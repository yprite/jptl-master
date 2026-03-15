"""
Roadmap planning service for 100-day JLPT study tracks.
"""

from __future__ import annotations

from datetime import date, timedelta
import math
from typing import Any

from backend.infrastructure.config.database import Database


LEVEL_SEQUENCE = ["N5", "N4", "N3", "N2", "N1"]
REVIEW_WEIGHTS = (
    (1, 1.0),
    (3, 0.7),
    (7, 0.5),
    (14, 0.35),
    (30, 0.2),
)


class RoadmapService:
    """Create level summaries and 100-day plan previews from imported items."""

    def __init__(self, database: Database):
        self.database = database

    def list_levels(self) -> list[dict[str, Any]]:
        with self.database.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT
                    level,
                    SUM(CASE WHEN item_type = 'vocabulary' THEN 1 ELSE 0 END) AS vocabulary_count,
                    SUM(CASE WHEN item_type = 'grammar' THEN 1 ELSE 0 END) AS grammar_count,
                    COUNT(*) AS total_count
                FROM learning_items
                GROUP BY level
                """
            ).fetchall()

        levels: list[dict[str, Any]] = []
        for row in rows:
            total = int(row["total_count"])
            buffer_days = 10
            active_days = 100 - buffer_days
            recommended = max(1, math.ceil(total / active_days))
            levels.append(
                {
                    "level": row["level"],
                    "vocabulary_count": int(row["vocabulary_count"]),
                    "grammar_count": int(row["grammar_count"]),
                    "total_count": total,
                    "recommended_daily_new_cards": recommended,
                    "recommended_daily_review_cards": max(10, round(recommended * 2.4)),
                }
            )

        return sorted(levels, key=lambda item: LEVEL_SEQUENCE.index(item["level"]))

    def build_plan_preview(
        self,
        *,
        level: str,
        start_date: date | None = None,
        target_days: int = 100,
        daily_new_cards: int | None = None,
    ) -> dict[str, Any]:
        counts = self._get_level_counts(level)
        total_count = counts["total_count"]
        if total_count == 0:
            raise ValueError(f"{level} 레벨 학습 데이터가 없습니다. 먼저 APKG를 import하세요.")

        start_date = start_date or date.today()
        minimum_buffer_days = max(10, target_days // 10)
        active_day_capacity = max(1, target_days - minimum_buffer_days)
        recommended_daily_new_cards = max(1, math.ceil(total_count / active_day_capacity))
        chosen_daily_new_cards = daily_new_cards or recommended_daily_new_cards

        required_active_days = max(1, math.ceil(total_count / chosen_daily_new_cards))
        if required_active_days > target_days:
            raise ValueError(
                f"{level} 전체 카드 {total_count}개를 {target_days}일 안에 끝내려면 "
                f"하루 신규 카드가 최소 {recommended_daily_new_cards}개는 필요합니다."
            )

        buffer_days = target_days - required_active_days
        vocabulary_schedule = self._partition_total(counts["vocabulary_count"], required_active_days)
        grammar_schedule = self._partition_total(counts["grammar_count"], required_active_days)

        days: list[dict[str, Any]] = []
        cumulative_new = 0
        daily_totals = [0] * target_days

        for day_index in range(target_days):
            vocabulary_new = vocabulary_schedule[day_index] if day_index < required_active_days else 0
            grammar_new = grammar_schedule[day_index] if day_index < required_active_days else 0
            new_cards = vocabulary_new + grammar_new
            daily_totals[day_index] = new_cards

        for day_index in range(target_days):
            day_number = day_index + 1
            vocabulary_new = vocabulary_schedule[day_index] if day_index < required_active_days else 0
            grammar_new = grammar_schedule[day_index] if day_index < required_active_days else 0
            new_cards = daily_totals[day_index]
            cumulative_new += new_cards

            review_estimate = self._estimate_reviews(daily_totals, day_index)
            remaining_cards = max(0, total_count - cumulative_new)
            phase = "learn" if day_index < required_active_days else "buffer"
            milestone = round((cumulative_new / total_count) * 100) if total_count else 0

            days.append(
                {
                    "day_number": day_number,
                    "date": (start_date + timedelta(days=day_index)).isoformat(),
                    "phase": phase,
                    "focus": self._build_focus_label(day_number, required_active_days, target_days),
                    "vocabulary_new": vocabulary_new,
                    "grammar_new": grammar_new,
                    "new_cards": new_cards,
                    "review_estimate": review_estimate,
                    "remaining_cards": remaining_cards,
                    "progress_percent": milestone,
                }
            )

        return {
            "level": level,
            "start_date": start_date.isoformat(),
            "target_days": target_days,
            "required_active_days": required_active_days,
            "buffer_days": buffer_days,
            "recommended_daily_new_cards": recommended_daily_new_cards,
            "chosen_daily_new_cards": chosen_daily_new_cards,
            "recommended_daily_review_cards": max(10, round(chosen_daily_new_cards * 2.4)),
            "totals": {
                "vocabulary": counts["vocabulary_count"],
                "grammar": counts["grammar_count"],
                "total": total_count,
            },
            "srs_model": {
                "name": "Anki-inspired staged review",
                "review_offsets_days": [offset for offset, _ in REVIEW_WEIGHTS],
                "description": "신규 카드 이후 1, 3, 7, 14, 30일 복습 수요를 기반으로 일일 복습량을 추정합니다.",
            },
            "milestones": self._build_milestones(days),
            "days": days,
        }

    def build_day_assignment(
        self,
        *,
        level: str,
        day_number: int,
        start_date: date | None = None,
        target_days: int = 100,
        daily_new_cards: int | None = None,
    ) -> dict[str, Any]:
        plan = self.build_plan_preview(
            level=level,
            start_date=start_date,
            target_days=target_days,
            daily_new_cards=daily_new_cards,
        )

        if day_number < 1 or day_number > target_days:
            raise ValueError(f"day_number는 1 이상 {target_days} 이하이어야 합니다.")

        day = plan["days"][day_number - 1]
        vocabulary_offset = sum(entry["vocabulary_new"] for entry in plan["days"][: day_number - 1])
        grammar_offset = sum(entry["grammar_new"] for entry in plan["days"][: day_number - 1])

        return {
            "summary": day,
            "vocabulary": self._fetch_items(level, "vocabulary", vocabulary_offset, day["vocabulary_new"]),
            "grammar": self._fetch_items(level, "grammar", grammar_offset, day["grammar_new"]),
        }

    def _get_level_counts(self, level: str) -> dict[str, int]:
        with self.database.get_connection() as conn:
            row = conn.execute(
                """
                SELECT
                    SUM(CASE WHEN item_type = 'vocabulary' THEN 1 ELSE 0 END) AS vocabulary_count,
                    SUM(CASE WHEN item_type = 'grammar' THEN 1 ELSE 0 END) AS grammar_count,
                    COUNT(*) AS total_count
                FROM learning_items
                WHERE level = ?
                """,
                (level,),
            ).fetchone()

        return {
            "vocabulary_count": int(row["vocabulary_count"] or 0),
            "grammar_count": int(row["grammar_count"] or 0),
            "total_count": int(row["total_count"] or 0),
        }

    def _fetch_items(self, level: str, item_type: str, offset: int, limit: int) -> list[dict[str, Any]]:
        if limit <= 0:
            return []

        with self.database.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT
                    id,
                    title,
                    prompt,
                    answer,
                    reading,
                    meaning,
                    example_jp,
                    example_kr,
                    extra_text,
                    source_reference,
                    source_order
                FROM learning_items
                WHERE level = ? AND item_type = ?
                ORDER BY
                    CASE WHEN source_order IS NULL THEN 1 ELSE 0 END,
                    source_order,
                    source_note_id
                LIMIT ? OFFSET ?
                """,
                (level, item_type, limit, offset),
            ).fetchall()

        return [
            {
                "id": int(row["id"]),
                "title": row["title"],
                "prompt": row["prompt"],
                "answer": row["answer"],
                "reading": row["reading"],
                "meaning": row["meaning"],
                "example_jp": row["example_jp"],
                "example_kr": row["example_kr"],
                "extra_text": row["extra_text"],
                "source_reference": row["source_reference"],
                "source_order": row["source_order"],
            }
            for row in rows
        ]

    def _partition_total(self, total: int, slots: int) -> list[int]:
        if slots <= 0:
            return []
        base = total // slots
        remainder = total % slots
        return [base + (1 if index < remainder else 0) for index in range(slots)]

    def _estimate_reviews(self, daily_totals: list[int], day_index: int) -> int:
        reviews = 0.0
        for offset, weight in REVIEW_WEIGHTS:
            source_day_index = day_index - offset
            if source_day_index >= 0:
                reviews += daily_totals[source_day_index] * weight
        return int(round(reviews))

    def _build_focus_label(self, day_number: int, required_active_days: int, target_days: int) -> str:
        if day_number == 1:
            return "시작 가속"
        if day_number <= 7:
            return "기초 패턴 정착"
        if day_number <= required_active_days // 2:
            return "신규 카드 누적"
        if day_number <= required_active_days:
            return "신규 + 복습 균형"
        if day_number == target_days:
            return "100일 마감 점검"
        return "버퍼 리뷰"

    def _build_milestones(self, days: list[dict[str, Any]]) -> list[dict[str, Any]]:
        milestones: list[dict[str, Any]] = []
        interesting_days = [1, 7, 14, 30, 60, len(days)]
        seen_days = set()
        for day_number in interesting_days:
            if day_number in seen_days or day_number > len(days):
                continue
            seen_days.add(day_number)
            day = days[day_number - 1]
            milestones.append(
                {
                    "day_number": day_number,
                    "label": f"Day {day_number}",
                    "progress_percent": day["progress_percent"],
                    "remaining_cards": day["remaining_cards"],
                    "focus": day["focus"],
                }
            )
        return milestones
