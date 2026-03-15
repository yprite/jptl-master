"""
User-specific roadmap profile and review persistence.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Literal

from backend.application.services.roadmap_service import RoadmapService
from backend.infrastructure.config.database import Database


RoadmapRating = Literal["again", "hard", "good", "easy"]
RoadmapState = Literal["new", "learning", "review", "relearning"]


class RoadmapProgressService:
    """Persist roadmap profiles and Anki-inspired item review state."""

    VALID_RATINGS = {"again", "hard", "good", "easy"}
    DEFAULT_EASE_FACTOR = 2.5
    MIN_EASE_FACTOR = 1.3
    MAX_EASE_FACTOR = 3.0

    def __init__(self, database: Database):
        self.database = database
        self.roadmap_service = RoadmapService(database)

    def get_profile(self, user_id: int) -> dict[str, Any] | None:
        with self.database.get_connection() as conn:
            row = conn.execute(
                """
                SELECT user_id, level, start_date, target_days, daily_new_cards
                FROM roadmap_profiles
                WHERE user_id = ?
                """,
                (user_id,),
            ).fetchone()

        if not row:
            return None

        return self._serialize_profile(
            {
                "user_id": int(row["user_id"]),
                "level": row["level"],
                "start_date": row["start_date"],
                "target_days": int(row["target_days"]),
                "daily_new_cards": int(row["daily_new_cards"]),
            }
        )

    def save_profile(
        self,
        *,
        user_id: int,
        level: str,
        start_date: date,
        target_days: int,
        daily_new_cards: int,
    ) -> dict[str, Any]:
        normalized_level = level.upper()
        plan = self.roadmap_service.build_plan_preview(
            level=normalized_level,
            start_date=start_date,
            target_days=target_days,
            daily_new_cards=daily_new_cards,
        )

        with self.database.get_connection() as conn:
            existing = conn.execute(
                "SELECT id FROM roadmap_profiles WHERE user_id = ?",
                (user_id,),
            ).fetchone()

            if existing:
                conn.execute(
                    """
                    UPDATE roadmap_profiles
                    SET level = ?, start_date = ?, target_days = ?, daily_new_cards = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ?
                    """,
                    (
                        normalized_level,
                        start_date.isoformat(),
                        target_days,
                        daily_new_cards,
                        user_id,
                    ),
                )
            else:
                conn.execute(
                    """
                    INSERT INTO roadmap_profiles (user_id, level, start_date, target_days, daily_new_cards)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        user_id,
                        normalized_level,
                        start_date.isoformat(),
                        target_days,
                        daily_new_cards,
                    ),
                )
            conn.commit()

        return self._serialize_profile(
            {
                "user_id": user_id,
                "level": normalized_level,
                "start_date": start_date.isoformat(),
                "target_days": target_days,
                "daily_new_cards": daily_new_cards,
                "required_active_days": plan["required_active_days"],
                "buffer_days": plan["buffer_days"],
                "recommended_daily_review_cards": plan["recommended_daily_review_cards"],
                "totals": plan["totals"],
            }
        )

    def build_dashboard(self, *, user_id: int, reference_date: date | None = None) -> dict[str, Any]:
        profile = self.get_profile(user_id)
        if not profile:
            raise ValueError("저장된 로드맵 프로필이 없습니다. 먼저 시작일과 학습 속도를 저장하세요.")

        reference_date = reference_date or date.today()
        start_date = date.fromisoformat(profile["start_date"])
        end_date = start_date + timedelta(days=profile["target_days"] - 1)

        if reference_date < start_date:
            status = "scheduled"
            current_day_number = 0
            today_assignment = None
            plan = self.roadmap_service.build_plan_preview(
                level=profile["level"],
                start_date=start_date,
                target_days=profile["target_days"],
                daily_new_cards=profile["daily_new_cards"],
            )
        else:
            status = "completed" if reference_date > end_date else "active"
            current_day_number = min(profile["target_days"], (reference_date - start_date).days + 1)
            plan = self.roadmap_service.build_plan_preview(
                level=profile["level"],
                start_date=start_date,
                target_days=profile["target_days"],
                daily_new_cards=profile["daily_new_cards"],
            )
            assignment = self.roadmap_service.build_day_assignment(
                level=profile["level"],
                day_number=current_day_number,
                start_date=start_date,
                target_days=profile["target_days"],
                daily_new_cards=profile["daily_new_cards"],
            )
            today_assignment = self._attach_progress_to_assignment(user_id, assignment)

        return {
            "profile": profile,
            "reference_date": reference_date.isoformat(),
            "status": status,
            "current_day_number": current_day_number,
            "days_until_start": max(0, (start_date - reference_date).days),
            "due_review_count": self._count_due_reviews(user_id, reference_date),
            "reviewed_today_count": self._count_review_logs(user_id, reference_date),
            "new_items_started_today": self._count_review_logs(user_id, reference_date, previous_state="new"),
            "plan": {
                "level": plan["level"],
                "start_date": plan["start_date"],
                "target_days": plan["target_days"],
                "required_active_days": plan["required_active_days"],
                "buffer_days": plan["buffer_days"],
                "recommended_daily_new_cards": plan["recommended_daily_new_cards"],
                "recommended_daily_review_cards": plan["recommended_daily_review_cards"],
                "totals": plan["totals"],
            },
            "today_assignment": today_assignment,
        }

    def list_due_reviews(
        self,
        *,
        user_id: int,
        reference_date: date | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        reference_date = reference_date or date.today()
        with self.database.get_connection() as conn:
            rows = conn.execute(
                """
                SELECT
                    li.id,
                    li.level,
                    li.item_type,
                    li.title,
                    li.prompt,
                    li.answer,
                    li.reading,
                    li.meaning,
                    li.example_jp,
                    li.example_kr,
                    li.extra_text,
                    li.source_reference,
                    rip.state,
                    rip.due_date,
                    rip.interval_days,
                    rip.ease_factor,
                    rip.review_count,
                    rip.successful_reviews,
                    rip.lapse_count,
                    rip.last_rating,
                    rip.last_reviewed_at
                FROM roadmap_item_progress rip
                JOIN learning_items li ON li.id = rip.learning_item_id
                WHERE rip.user_id = ?
                  AND rip.state IN ('learning', 'review', 'relearning')
                  AND rip.due_date IS NOT NULL
                  AND rip.due_date <= ?
                ORDER BY
                    rip.due_date ASC,
                    CASE rip.state
                        WHEN 'relearning' THEN 0
                        WHEN 'learning' THEN 1
                        ELSE 2
                    END,
                    rip.last_reviewed_at ASC
                LIMIT ?
                """,
                (user_id, reference_date.isoformat(), limit),
            ).fetchall()

        return [
            {
                "id": int(row["id"]),
                "level": row["level"],
                "item_type": row["item_type"],
                "title": row["title"],
                "prompt": row["prompt"],
                "answer": row["answer"],
                "reading": row["reading"],
                "meaning": row["meaning"],
                "example_jp": row["example_jp"],
                "example_kr": row["example_kr"],
                "extra_text": row["extra_text"],
                "source_reference": row["source_reference"],
                "progress": self._serialize_progress(
                    {
                        "learning_item_id": int(row["id"]),
                        "state": row["state"],
                        "due_date": row["due_date"],
                        "interval_days": int(row["interval_days"] or 0),
                        "ease_factor": float(row["ease_factor"] or self.DEFAULT_EASE_FACTOR),
                        "review_count": int(row["review_count"] or 0),
                        "successful_reviews": int(row["successful_reviews"] or 0),
                        "lapse_count": int(row["lapse_count"] or 0),
                        "last_rating": row["last_rating"],
                        "last_reviewed_at": row["last_reviewed_at"],
                    }
                ),
            }
            for row in rows
        ]

    def record_review(
        self,
        *,
        user_id: int,
        learning_item_id: int,
        rating: RoadmapRating,
        reviewed_at: datetime | None = None,
    ) -> dict[str, Any]:
        if rating not in self.VALID_RATINGS:
            raise ValueError("rating은 again, hard, good, easy 중 하나여야 합니다.")

        reviewed_at = reviewed_at or datetime.now()
        review_date = reviewed_at.date()

        with self.database.get_connection() as conn:
            item_row = conn.execute(
                """
                SELECT id, level, item_type, title, prompt, answer, reading, meaning, example_jp, example_kr, extra_text, source_reference
                FROM learning_items
                WHERE id = ?
                """,
                (learning_item_id,),
            ).fetchone()
            if not item_row:
                raise ValueError("학습 아이템을 찾을 수 없습니다.")

            progress_row = conn.execute(
                """
                SELECT id, state, due_date, interval_days, ease_factor, review_count,
                       successful_reviews, lapse_count, last_rating, last_reviewed_at
                FROM roadmap_item_progress
                WHERE user_id = ? AND learning_item_id = ?
                """,
                (user_id, learning_item_id),
            ).fetchone()

            progress = self._build_progress_dict(learning_item_id, progress_row, review_date)
            previous_state = progress["state"]
            previous_due_date = progress["due_date"]
            previous_interval_days = progress["interval_days"]

            updated = self._apply_review(progress, rating, reviewed_at)

            if progress_row:
                conn.execute(
                    """
                    UPDATE roadmap_item_progress
                    SET state = ?, due_date = ?, interval_days = ?, ease_factor = ?, review_count = ?,
                        successful_reviews = ?, lapse_count = ?, last_rating = ?, last_reviewed_at = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ? AND learning_item_id = ?
                    """,
                    (
                        updated["state"],
                        updated["due_date"],
                        updated["interval_days"],
                        updated["ease_factor"],
                        updated["review_count"],
                        updated["successful_reviews"],
                        updated["lapse_count"],
                        updated["last_rating"],
                        updated["last_reviewed_at"],
                        user_id,
                        learning_item_id,
                    ),
                )
            else:
                conn.execute(
                    """
                    INSERT INTO roadmap_item_progress (
                        user_id, learning_item_id, state, due_date, interval_days,
                        ease_factor, review_count, successful_reviews, lapse_count,
                        last_rating, last_reviewed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        user_id,
                        learning_item_id,
                        updated["state"],
                        updated["due_date"],
                        updated["interval_days"],
                        updated["ease_factor"],
                        updated["review_count"],
                        updated["successful_reviews"],
                        updated["lapse_count"],
                        updated["last_rating"],
                        updated["last_reviewed_at"],
                    ),
                )

            conn.execute(
                """
                INSERT INTO roadmap_review_logs (
                    user_id, learning_item_id, rating, reviewed_at,
                    previous_state, next_state, previous_due_date, next_due_date,
                    previous_interval_days, next_interval_days
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    learning_item_id,
                    rating,
                    reviewed_at.isoformat(),
                    previous_state,
                    updated["state"],
                    previous_due_date,
                    updated["due_date"],
                    previous_interval_days,
                    updated["interval_days"],
                ),
            )
            conn.commit()

        return {
            "item": {
                "id": int(item_row["id"]),
                "level": item_row["level"],
                "item_type": item_row["item_type"],
                "title": item_row["title"],
                "prompt": item_row["prompt"],
                "answer": item_row["answer"],
                "reading": item_row["reading"],
                "meaning": item_row["meaning"],
                "example_jp": item_row["example_jp"],
                "example_kr": item_row["example_kr"],
                "extra_text": item_row["extra_text"],
                "source_reference": item_row["source_reference"],
            },
            "progress": self._serialize_progress(updated),
            "rating": rating,
        }

    def _attach_progress_to_assignment(self, user_id: int, assignment: dict[str, Any]) -> dict[str, Any]:
        item_ids = [
            *[item["id"] for item in assignment["vocabulary"]],
            *[item["id"] for item in assignment["grammar"]],
        ]
        progress_map = self._get_progress_map(user_id, item_ids)

        return {
            "summary": assignment["summary"],
            "vocabulary": [
                {
                    **item,
                    "progress": progress_map.get(item["id"], self._serialize_progress(self._build_progress_dict(item["id"], None, None))),
                }
                for item in assignment["vocabulary"]
            ],
            "grammar": [
                {
                    **item,
                    "progress": progress_map.get(item["id"], self._serialize_progress(self._build_progress_dict(item["id"], None, None))),
                }
                for item in assignment["grammar"]
            ],
        }

    def _get_progress_map(self, user_id: int, item_ids: list[int]) -> dict[int, dict[str, Any]]:
        if not item_ids:
            return {}

        placeholders = ", ".join(["?"] * len(item_ids))
        with self.database.get_connection() as conn:
            rows = conn.execute(
                f"""
                SELECT learning_item_id, state, due_date, interval_days, ease_factor, review_count,
                       successful_reviews, lapse_count, last_rating, last_reviewed_at
                FROM roadmap_item_progress
                WHERE user_id = ? AND learning_item_id IN ({placeholders})
                """,
                (user_id, *item_ids),
            ).fetchall()

        return {
            int(row["learning_item_id"]): self._serialize_progress(
                {
                    "learning_item_id": int(row["learning_item_id"]),
                    "state": row["state"],
                    "due_date": row["due_date"],
                    "interval_days": int(row["interval_days"] or 0),
                    "ease_factor": float(row["ease_factor"] or self.DEFAULT_EASE_FACTOR),
                    "review_count": int(row["review_count"] or 0),
                    "successful_reviews": int(row["successful_reviews"] or 0),
                    "lapse_count": int(row["lapse_count"] or 0),
                    "last_rating": row["last_rating"],
                    "last_reviewed_at": row["last_reviewed_at"],
                }
            )
            for row in rows
        }

    def _build_progress_dict(
        self,
        learning_item_id: int,
        row: Any,
        review_date: date | None,
    ) -> dict[str, Any]:
        if row:
            return {
                "learning_item_id": learning_item_id,
                "state": row["state"],
                "due_date": row["due_date"],
                "interval_days": int(row["interval_days"] or 0),
                "ease_factor": float(row["ease_factor"] or self.DEFAULT_EASE_FACTOR),
                "review_count": int(row["review_count"] or 0),
                "successful_reviews": int(row["successful_reviews"] or 0),
                "lapse_count": int(row["lapse_count"] or 0),
                "last_rating": row["last_rating"],
                "last_reviewed_at": row["last_reviewed_at"],
            }

        return {
            "learning_item_id": learning_item_id,
            "state": "new",
            "due_date": review_date.isoformat() if review_date else None,
            "interval_days": 0,
            "ease_factor": self.DEFAULT_EASE_FACTOR,
            "review_count": 0,
            "successful_reviews": 0,
            "lapse_count": 0,
            "last_rating": None,
            "last_reviewed_at": None,
        }

    def _apply_review(
        self,
        progress: dict[str, Any],
        rating: RoadmapRating,
        reviewed_at: datetime,
    ) -> dict[str, Any]:
        review_date = reviewed_at.date()
        state = progress["state"]
        interval_days = progress["interval_days"]
        ease_factor = progress["ease_factor"]
        successful_reviews = progress["successful_reviews"]
        lapse_count = progress["lapse_count"]
        review_count = progress["review_count"] + 1

        if state in {"new", "learning", "relearning"}:
            if rating == "again":
                next_state: RoadmapState = "learning"
                next_interval = 0
                next_due = review_date
                next_successes = 0
                next_ease = max(self.MIN_EASE_FACTOR, ease_factor - 0.2)
            elif rating == "hard":
                next_state = "learning"
                next_interval = 1
                next_due = review_date + timedelta(days=1)
                next_successes = min(successful_reviews + 1, 1)
                next_ease = max(self.MIN_EASE_FACTOR, ease_factor - 0.05)
            elif rating == "good":
                next_successes = successful_reviews + 1
                if next_successes >= 2:
                    next_state = "review"
                    next_interval = max(3, interval_days or 3)
                    next_due = review_date + timedelta(days=next_interval)
                else:
                    next_state = "learning"
                    next_interval = 1
                    next_due = review_date + timedelta(days=1)
                next_ease = ease_factor
            else:
                next_state = "review"
                next_interval = max(4, interval_days or 4)
                next_due = review_date + timedelta(days=next_interval)
                next_successes = max(2, successful_reviews + 1)
                next_ease = min(self.MAX_EASE_FACTOR, ease_factor + 0.15)
        else:
            if rating == "again":
                next_state = "relearning"
                next_interval = 1
                next_due = review_date + timedelta(days=1)
                next_successes = 0
                lapse_count += 1
                next_ease = max(self.MIN_EASE_FACTOR, ease_factor - 0.2)
            elif rating == "hard":
                next_state = "review"
                next_interval = max(1, round(max(1, interval_days) * 1.2))
                next_due = review_date + timedelta(days=next_interval)
                next_successes = successful_reviews + 1
                next_ease = max(self.MIN_EASE_FACTOR, ease_factor - 0.05)
            elif rating == "good":
                next_state = "review"
                next_interval = max(1, round(max(1, interval_days) * max(self.MIN_EASE_FACTOR, ease_factor)))
                next_due = review_date + timedelta(days=next_interval)
                next_successes = successful_reviews + 1
                next_ease = ease_factor
            else:
                next_state = "review"
                next_interval = max(
                    2,
                    round(max(1, interval_days) * max(self.MIN_EASE_FACTOR, ease_factor) * 1.3),
                )
                next_due = review_date + timedelta(days=next_interval)
                next_successes = successful_reviews + 1
                next_ease = min(self.MAX_EASE_FACTOR, ease_factor + 0.15)

        return {
            "learning_item_id": progress["learning_item_id"],
            "state": next_state,
            "due_date": next_due.isoformat(),
            "interval_days": next_interval,
            "ease_factor": round(next_ease, 2),
            "review_count": review_count,
            "successful_reviews": next_successes,
            "lapse_count": lapse_count,
            "last_rating": rating,
            "last_reviewed_at": reviewed_at.isoformat(),
        }

    def _count_due_reviews(self, user_id: int, reference_date: date) -> int:
        with self.database.get_connection() as conn:
            row = conn.execute(
                """
                SELECT COUNT(*) AS count
                FROM roadmap_item_progress
                WHERE user_id = ?
                  AND state IN ('learning', 'review', 'relearning')
                  AND due_date IS NOT NULL
                  AND due_date <= ?
                """,
                (user_id, reference_date.isoformat()),
            ).fetchone()
        return int(row["count"] or 0)

    def _count_review_logs(self, user_id: int, reference_date: date, previous_state: str | None = None) -> int:
        query = """
            SELECT COUNT(*) AS count
            FROM roadmap_review_logs
            WHERE user_id = ?
              AND DATE(reviewed_at) = ?
        """
        params: list[Any] = [user_id, reference_date.isoformat()]
        if previous_state is not None:
            query += " AND previous_state = ?"
            params.append(previous_state)

        with self.database.get_connection() as conn:
            row = conn.execute(query, tuple(params)).fetchone()
        return int(row["count"] or 0)

    def _serialize_profile(self, profile: dict[str, Any]) -> dict[str, Any]:
        recommended_daily_review_cards = profile.get("recommended_daily_review_cards")
        if recommended_daily_review_cards is None:
            recommended_daily_review_cards = max(10, round(profile["daily_new_cards"] * 2.4))

        serialized = {
            "user_id": profile["user_id"],
            "level": profile["level"],
            "start_date": profile["start_date"],
            "target_days": profile["target_days"],
            "daily_new_cards": profile["daily_new_cards"],
            "recommended_daily_review_cards": recommended_daily_review_cards,
        }
        if "required_active_days" in profile:
            serialized["required_active_days"] = profile["required_active_days"]
        if "buffer_days" in profile:
            serialized["buffer_days"] = profile["buffer_days"]
        if "totals" in profile:
            serialized["totals"] = profile["totals"]
        return serialized

    def _serialize_progress(self, progress: dict[str, Any]) -> dict[str, Any]:
        return {
            "learning_item_id": progress["learning_item_id"],
            "state": progress["state"],
            "due_date": progress["due_date"],
            "interval_days": progress["interval_days"],
            "ease_factor": progress["ease_factor"],
            "review_count": progress["review_count"],
            "successful_reviews": progress["successful_reviews"],
            "lapse_count": progress["lapse_count"],
            "last_rating": progress["last_rating"],
            "last_reviewed_at": progress["last_reviewed_at"],
        }
