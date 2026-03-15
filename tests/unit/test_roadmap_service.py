from backend.application.services.roadmap_service import RoadmapService
from backend.infrastructure.config.database import Database


def seed_items(db: Database) -> None:
    with db.get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO content_imports (source_name, source_path, item_count, metadata_json)
            VALUES (?, ?, ?, ?)
            """,
            ("fixture.apkg", "/tmp/fixture.apkg", 6, "{}"),
        )
        import_id = int(cursor.lastrowid)

        rows = [
            (import_id, 1, 1, "N5", "vocabulary", "deck", "1. JLPT 어휘", "단어1", "단어1", "뜻1", None, "뜻1", None, None, None, "1", 1, "{}", "[]"),
            (import_id, 2, 2, "N5", "vocabulary", "deck", "1. JLPT 어휘", "단어2", "단어2", "뜻2", None, "뜻2", None, None, None, "2", 2, "{}", "[]"),
            (import_id, 3, 3, "N5", "vocabulary", "deck", "1. JLPT 어휘", "단어3", "단어3", "뜻3", None, "뜻3", None, None, None, "3", 3, "{}", "[]"),
            (import_id, 4, 4, "N5", "grammar", "deck", "2. JLPT 문법", "문법1", "문법1", "의미1", None, "의미1", "예문1", "해석1", None, "4", 4, "{}", "[]"),
            (import_id, 5, 5, "N5", "grammar", "deck", "2. JLPT 문법", "문법2", "문법2", "의미2", None, "의미2", "예문2", "해석2", None, "5", 5, "{}", "[]"),
            (import_id, 6, 6, "N4", "vocabulary", "deck", "1. JLPT 어휘", "단어4", "단어4", "뜻4", None, "뜻4", None, None, None, "6", 6, "{}", "[]"),
        ]

        conn.executemany(
            """
            INSERT INTO learning_items (
                import_id, source_note_id, source_card_id, level, item_type, deck_name,
                note_type_name, title, prompt, answer, reading, meaning, example_jp,
                example_kr, extra_text, source_reference, source_order, raw_fields_json, tags_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            rows,
        )
        conn.commit()


def test_build_plan_preview_spreads_new_cards_across_target_days(tmp_path):
    db = Database(str(tmp_path / "roadmap.db"))
    seed_items(db)
    service = RoadmapService(db)

    plan = service.build_plan_preview(level="N5", target_days=10, daily_new_cards=1)

    assert plan["totals"]["total"] == 5
    assert len(plan["days"]) == 10
    assert sum(day["new_cards"] for day in plan["days"]) == 5
    assert plan["required_active_days"] == 5
    assert plan["buffer_days"] == 5


def test_build_day_assignment_returns_items_in_source_order(tmp_path):
    db = Database(str(tmp_path / "roadmap.db"))
    seed_items(db)
    service = RoadmapService(db)

    assignment = service.build_day_assignment(level="N5", day_number=1, target_days=10, daily_new_cards=2)

    assert assignment["summary"]["new_cards"] == 2
    assert assignment["vocabulary"][0]["title"] == "단어1"
    assert assignment["grammar"][0]["title"] == "문법1"
