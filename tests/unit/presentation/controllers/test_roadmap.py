import os
import tempfile
from datetime import date
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.domain.entities.user import User
from backend.domain.value_objects.jlpt import JLPTLevel
from backend.infrastructure.config.database import Database
from backend.infrastructure.repositories.user_repository import SqliteUserRepository
from backend.presentation.controllers.auth import get_current_user
from backend.presentation.controllers.roadmap import router


def create_temp_db() -> str:
    handle = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    handle.close()
    return handle.name


def seed_user(db: Database) -> User:
    repo = SqliteUserRepository(db=db)
    return repo.save(
        User(
            id=None,
            email="controller@example.com",
            username="controller-user",
            target_level=JLPTLevel.N5,
        )
    )


def seed_learning_items(db: Database) -> int:
    with db.get_connection() as conn:
        import_row = conn.execute(
            """
            INSERT INTO content_imports (source_name, source_path, item_count, metadata_json)
            VALUES (?, ?, ?, ?)
            """,
            ("fixture.apkg", "/tmp/fixture.apkg", 2, "{}"),
        )
        import_id = int(import_row.lastrowid)
        conn.execute(
            """
            INSERT INTO learning_items (
                import_id, source_note_id, source_card_id, level, item_type, deck_name,
                note_type_name, title, prompt, answer, reading, meaning, example_jp,
                example_kr, extra_text, source_reference, source_order, raw_fields_json, tags_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                import_id, 1, 1, "N5", "vocabulary", "deck", "1. JLPT 어휘",
                "단어1", "단어1", "뜻1", "읽기1", "뜻1",
                None, None, None, "1", 1, "{}", "[]",
            ),
        )
        conn.execute(
            """
            INSERT INTO learning_items (
                import_id, source_note_id, source_card_id, level, item_type, deck_name,
                note_type_name, title, prompt, answer, reading, meaning, example_jp,
                example_kr, extra_text, source_reference, source_order, raw_fields_json, tags_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                import_id, 2, 2, "N5", "grammar", "deck", "2. JLPT 문법",
                "문법1", "문법1", "의미1", None, "의미1",
                "예문1", "해석1", None, "2", 2, "{}", "[]",
            ),
        )
        conn.commit()
        row = conn.execute("SELECT id FROM learning_items ORDER BY source_order LIMIT 1").fetchone()
        return int(row["id"])


def build_app() -> FastAPI:
    app = FastAPI()
    app.include_router(router)
    return app


def test_get_profile_returns_null_when_not_saved():
    db_path = create_temp_db()
    app = None
    try:
        db = Database(db_path)
        user = seed_user(db)
        seed_learning_items(db)
        app = build_app()
        client = TestClient(app)

        with patch("backend.presentation.controllers.roadmap.get_database", return_value=db):
            app.dependency_overrides[get_current_user] = lambda: user

            response = client.get("/profile")
            assert response.status_code == 200
            assert response.json()["data"] is None
    finally:
        if app is not None:
            app.dependency_overrides.clear()
        if os.path.exists(db_path):
            os.unlink(db_path)


def test_save_profile_and_submit_review():
    db_path = create_temp_db()
    app = None
    try:
        db = Database(db_path)
        user = seed_user(db)
        learning_item_id = seed_learning_items(db)
        app = build_app()
        client = TestClient(app)

        with patch("backend.presentation.controllers.roadmap.get_database", return_value=db):
            app.dependency_overrides[get_current_user] = lambda: user

            profile_response = client.put(
                "/profile",
                json={
                    "level": "N5",
                    "start_date": "2026-03-15",
                    "target_days": 20,
                    "daily_new_cards": 1,
                },
            )
            assert profile_response.status_code == 200
            assert profile_response.json()["data"]["start_date"] == "2026-03-15"

            review_response = client.post(
                "/reviews",
                json={
                    "learning_item_id": learning_item_id,
                    "rating": "good",
                },
            )
            assert review_response.status_code == 200
            review_data = review_response.json()["data"]
            assert review_data["item"]["id"] == learning_item_id
            assert review_data["progress"]["state"] == "learning"

            dashboard_response = client.get("/dashboard")
            assert dashboard_response.status_code == 200
            assert dashboard_response.json()["data"]["profile"]["level"] == "N5"
    finally:
        if app is not None:
            app.dependency_overrides.clear()
        if os.path.exists(db_path):
            os.unlink(db_path)
