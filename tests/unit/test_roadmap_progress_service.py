from datetime import date, datetime
import os
import tempfile

from backend.application.services.roadmap_progress_service import RoadmapProgressService
from backend.domain.entities.user import User
from backend.domain.value_objects.jlpt import JLPTLevel
from backend.infrastructure.config.database import Database
from backend.infrastructure.repositories.user_repository import SqliteUserRepository


def create_temp_db() -> str:
    handle = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    handle.close()
    return handle.name


def seed_user(db: Database) -> int:
    repo = SqliteUserRepository(db=db)
    user = User(
        id=None,
        email="roadmap@example.com",
        username="roadmap-user",
        target_level=JLPTLevel.N5,
    )
    return repo.save(user).id


def seed_learning_items(db: Database) -> list[int]:
    with db.get_connection() as conn:
        import_row = conn.execute(
            """
            INSERT INTO content_imports (source_name, source_path, item_count, metadata_json)
            VALUES (?, ?, ?, ?)
            """,
            ("fixture.apkg", "/tmp/fixture.apkg", 4, "{}"),
        )
        import_id = int(import_row.lastrowid)

        rows = [
            (import_id, 1, 1, "N5", "vocabulary", "deck", "1. JLPT 어휘", "단어1", "단어1", "뜻1", "읽기1", "뜻1", None, None, None, "1", 1, "{}", "[]"),
            (import_id, 2, 2, "N5", "vocabulary", "deck", "1. JLPT 어휘", "단어2", "단어2", "뜻2", "읽기2", "뜻2", None, None, None, "2", 2, "{}", "[]"),
            (import_id, 3, 3, "N5", "grammar", "deck", "2. JLPT 문법", "문법1", "문법1", "의미1", None, "의미1", "예문1", "해석1", None, "3", 3, "{}", "[]"),
            (import_id, 4, 4, "N5", "grammar", "deck", "2. JLPT 문법", "문법2", "문법2", "의미2", None, "의미2", "예문2", "해석2", None, "4", 4, "{}", "[]"),
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

        saved_rows = conn.execute(
            "SELECT id FROM learning_items ORDER BY source_order"
        ).fetchall()
        return [int(row["id"]) for row in saved_rows]


def test_save_profile_round_trip():
    db_path = create_temp_db()
    try:
        db = Database(db_path)
        user_id = seed_user(db)
        seed_learning_items(db)
        service = RoadmapProgressService(db)

        saved = service.save_profile(
            user_id=user_id,
            level="N5",
            start_date=date(2026, 3, 15),
            target_days=30,
            daily_new_cards=1,
        )
        loaded = service.get_profile(user_id)

        assert saved["start_date"] == "2026-03-15"
        assert saved["daily_new_cards"] == 1
        assert loaded == {
            "user_id": user_id,
            "level": "N5",
            "start_date": "2026-03-15",
            "target_days": 30,
            "daily_new_cards": 1,
            "recommended_daily_review_cards": 10,
        }
    finally:
        if os.path.exists(db_path):
            os.unlink(db_path)


def test_record_review_graduates_new_item_and_lists_due_reviews():
    db_path = create_temp_db()
    try:
        db = Database(db_path)
        user_id = seed_user(db)
        item_ids = seed_learning_items(db)
        service = RoadmapProgressService(db)

        first = service.record_review(
            user_id=user_id,
            learning_item_id=item_ids[0],
            rating="good",
            reviewed_at=datetime(2026, 3, 15, 9, 0, 0),
        )
        second = service.record_review(
            user_id=user_id,
            learning_item_id=item_ids[0],
            rating="good",
            reviewed_at=datetime(2026, 3, 16, 9, 0, 0),
        )
        due_reviews = service.list_due_reviews(
            user_id=user_id,
            reference_date=date(2026, 3, 19),
        )

        assert first["progress"]["state"] == "learning"
        assert first["progress"]["due_date"] == "2026-03-16"
        assert second["progress"]["state"] == "review"
        assert second["progress"]["due_date"] == "2026-03-19"
        assert due_reviews[0]["id"] == item_ids[0]
        assert due_reviews[0]["progress"]["state"] == "review"
    finally:
        if os.path.exists(db_path):
            os.unlink(db_path)


def test_again_on_review_item_moves_to_relearning_and_updates_dashboard_counts():
    db_path = create_temp_db()
    try:
        db = Database(db_path)
        user_id = seed_user(db)
        item_ids = seed_learning_items(db)
        service = RoadmapProgressService(db)

        service.save_profile(
            user_id=user_id,
            level="N5",
            start_date=date(2026, 3, 15),
            target_days=10,
            daily_new_cards=2,
        )
        service.record_review(
            user_id=user_id,
            learning_item_id=item_ids[0],
            rating="good",
            reviewed_at=datetime(2026, 3, 15, 9, 0, 0),
        )
        service.record_review(
            user_id=user_id,
            learning_item_id=item_ids[0],
            rating="good",
            reviewed_at=datetime(2026, 3, 16, 9, 0, 0),
        )
        result = service.record_review(
            user_id=user_id,
            learning_item_id=item_ids[0],
            rating="again",
            reviewed_at=datetime(2026, 3, 19, 9, 0, 0),
        )
        dashboard = service.build_dashboard(
            user_id=user_id,
            reference_date=date(2026, 3, 19),
        )

        assert result["progress"]["state"] == "relearning"
        assert result["progress"]["lapse_count"] == 1
        assert result["progress"]["due_date"] == "2026-03-20"
        assert dashboard["current_day_number"] == 5
        assert dashboard["reviewed_today_count"] == 1
        assert dashboard["today_assignment"] is not None
    finally:
        if os.path.exists(db_path):
            os.unlink(db_path)
