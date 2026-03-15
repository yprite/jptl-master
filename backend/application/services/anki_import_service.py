"""
Anki APKG import service for the 100-day JLPT roadmap product.
"""

from __future__ import annotations

from dataclasses import dataclass
from html import unescape
import json
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess
import tempfile
from typing import Any
import zipfile

from backend.infrastructure.config.database import Database


FIELD_SEPARATOR = "\x1f"
DECK_SEPARATOR = "\x1f"
LEVEL_PATTERN = re.compile(r"JLPT\s*N([1-5])")
HTML_TAG_PATTERN = re.compile(r"<[^>]+>")
WHITESPACE_PATTERN = re.compile(r"\s+")

SUPPORTED_NOTE_TYPES = {
    "1. JLPT 어휘": "vocabulary",
    "2. JLPT 문법": "grammar",
}

FALLBACK_LEVELS = {
    "기초 문법": "N5",
}


@dataclass
class ImportSummary:
    import_id: int
    source_name: str
    source_path: str
    item_count: int
    levels: dict[str, dict[str, int]]


class AnkiApkgImportService:
    """Import supported Anki note types into the local roadmap schema."""

    def __init__(self, database: Database):
        self.database = database

    def import_package(self, file_path: str, overwrite: bool = True) -> ImportSummary:
        package_path = Path(file_path).expanduser().resolve()
        if not package_path.exists():
            raise FileNotFoundError(f"APKG 파일을 찾을 수 없습니다: {package_path}")

        with tempfile.TemporaryDirectory() as temp_dir:
            collection_db_path = self._extract_collection_database(package_path, Path(temp_dir))
            items = self._read_supported_items(collection_db_path)

        if not items:
            raise ValueError("지원되는 JLPT 어휘/문법 카드가 없습니다.")

        with self.database.get_connection() as conn:
            if overwrite:
                conn.execute("DELETE FROM learning_items")
                conn.execute("DELETE FROM content_imports")

            metadata = self._build_metadata(items)
            cursor = conn.execute(
                """
                INSERT INTO content_imports (source_name, source_path, item_count, metadata_json)
                VALUES (?, ?, ?, ?)
                """,
                (
                    package_path.name,
                    str(package_path),
                    len(items),
                    json.dumps(metadata, ensure_ascii=False),
                ),
            )
            import_id = int(cursor.lastrowid)

            conn.executemany(
                """
                INSERT INTO learning_items (
                    import_id,
                    source_note_id,
                    source_card_id,
                    level,
                    item_type,
                    deck_name,
                    note_type_name,
                    title,
                    prompt,
                    answer,
                    reading,
                    meaning,
                    example_jp,
                    example_kr,
                    extra_text,
                    source_reference,
                    source_order,
                    raw_fields_json,
                    tags_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        import_id,
                        item["source_note_id"],
                        item["source_card_id"],
                        item["level"],
                        item["item_type"],
                        item["deck_name"],
                        item["note_type_name"],
                        item["title"],
                        item["prompt"],
                        item["answer"],
                        item["reading"],
                        item["meaning"],
                        item["example_jp"],
                        item["example_kr"],
                        item["extra_text"],
                        item["source_reference"],
                        item["source_order"],
                        json.dumps(item["raw_fields"], ensure_ascii=False),
                        json.dumps(item["tags"], ensure_ascii=False),
                    )
                    for item in items
                ],
            )
            conn.commit()

        return ImportSummary(
            import_id=import_id,
            source_name=package_path.name,
            source_path=str(package_path),
            item_count=len(items),
            levels=metadata["levels"],
        )

    def _extract_collection_database(self, package_path: Path, temp_dir: Path) -> Path:
        with zipfile.ZipFile(package_path) as archive:
            names = set(archive.namelist())
            if "collection.anki21b" in names:
                archive.extract("collection.anki21b", temp_dir)
                return self._decompress_zstd(temp_dir / "collection.anki21b", temp_dir / "collection.sqlite")

            if "collection.anki2" in names:
                archive.extract("collection.anki2", temp_dir)
                copied = temp_dir / "collection.sqlite"
                shutil.copyfile(temp_dir / "collection.anki2", copied)
                return copied

        raise ValueError("collection.anki21b 또는 collection.anki2 파일을 찾지 못했습니다.")

    def _decompress_zstd(self, source_path: Path, target_path: Path) -> Path:
        zstd_binary = shutil.which("zstd")
        if not zstd_binary:
            raise RuntimeError("`zstd` 명령을 찾지 못했습니다. collection.anki21b를 해제할 수 없습니다.")

        subprocess.run(
            [zstd_binary, "-d", "-q", str(source_path), "-o", str(target_path)],
            check=True,
        )
        return target_path

    def _read_supported_items(self, collection_db_path: Path) -> list[dict[str, Any]]:
        conn = sqlite3.connect(collection_db_path)
        conn.row_factory = sqlite3.Row
        conn.create_collation(
            "unicase",
            lambda left, right: (left.casefold() > right.casefold()) - (left.casefold() < right.casefold()),
        )

        try:
            field_names_by_note_type = self._load_field_names(conn)
            rows = conn.execute(
                """
                SELECT
                    c.id AS card_id,
                    n.id AS note_id,
                    n.mid AS note_type_id,
                    n.tags AS note_tags,
                    n.flds AS raw_fields,
                    nt.name AS note_type_name,
                    d.name AS deck_name
                FROM cards c
                JOIN notes n ON n.id = c.nid
                JOIN decks d ON d.id = c.did
                JOIN notetypes nt ON nt.id = n.mid
                ORDER BY c.id
                """
            ).fetchall()

            items: list[dict[str, Any]] = []
            for row in rows:
                item_type = SUPPORTED_NOTE_TYPES.get(row["note_type_name"])
                if not item_type:
                    continue

                level = self._infer_level(row["deck_name"])
                if not level:
                    continue

                field_names = field_names_by_note_type.get(row["note_type_id"], [])
                raw_values = row["raw_fields"].split(FIELD_SEPARATOR)
                raw_fields = {
                    field_names[index]: raw_values[index] if index < len(raw_values) else ""
                    for index in range(len(field_names))
                }

                mapped_item = self._map_item(
                    item_type=item_type,
                    level=level,
                    deck_name=row["deck_name"],
                    note_type_name=row["note_type_name"],
                    source_note_id=int(row["note_id"]),
                    source_card_id=int(row["card_id"]),
                    tags=self._split_tags(row["note_tags"]),
                    raw_fields=raw_fields,
                )
                if mapped_item:
                    items.append(mapped_item)

            return items
        finally:
            conn.close()

    def _load_field_names(self, conn: sqlite3.Connection) -> dict[int, list[str]]:
        rows = conn.execute(
            """
            SELECT ntid, ord, name
            FROM fields
            ORDER BY ntid, ord
            """
        ).fetchall()

        field_names: dict[int, list[str]] = {}
        for row in rows:
            field_names.setdefault(int(row["ntid"]), []).append(str(row["name"]))
        return field_names

    def _map_item(
        self,
        *,
        item_type: str,
        level: str,
        deck_name: str,
        note_type_name: str,
        source_note_id: int,
        source_card_id: int,
        tags: list[str],
        raw_fields: dict[str, str],
    ) -> dict[str, Any] | None:
        if item_type == "vocabulary":
            word = self._clean_text(raw_fields.get("단어") or raw_fields.get("한자"))
            meaning = self._clean_text(raw_fields.get("의미"))
            if not word or not meaning:
                return None

            reading = self._clean_text(raw_fields.get("루비"))
            part_of_speech = self._clean_text(raw_fields.get("품사"))
            example_text = self._clean_text(raw_fields.get("예문"))
            source_reference = self._clean_text(raw_fields.get("넘버"))

            return {
                "source_note_id": source_note_id,
                "source_card_id": source_card_id,
                "level": level,
                "item_type": item_type,
                "deck_name": deck_name,
                "note_type_name": note_type_name,
                "title": word,
                "prompt": word,
                "answer": meaning,
                "reading": reading or None,
                "meaning": meaning,
                "example_jp": None,
                "example_kr": None,
                "extra_text": self._join_non_empty([part_of_speech, example_text]),
                "source_reference": source_reference or None,
                "source_order": self._to_int(source_reference),
                "raw_fields": raw_fields,
                "tags": tags,
            }

        grammar = self._clean_text(raw_fields.get("문법"))
        meaning = self._clean_text(raw_fields.get("의미"))
        if not grammar or not meaning:
            return None

        source_reference = self._clean_text(raw_fields.get("넘버"))
        return {
            "source_note_id": source_note_id,
            "source_card_id": source_card_id,
            "level": level,
            "item_type": item_type,
            "deck_name": deck_name,
            "note_type_name": note_type_name,
            "title": grammar,
            "prompt": grammar,
            "answer": meaning,
            "reading": None,
            "meaning": meaning,
            "example_jp": self._clean_text(raw_fields.get("예문(일본어)")) or None,
            "example_kr": self._clean_text(raw_fields.get("예문(한국어)")) or None,
            "extra_text": self._clean_text(raw_fields.get("TTS")) or None,
            "source_reference": source_reference or None,
            "source_order": self._to_int(source_reference),
            "raw_fields": raw_fields,
            "tags": tags,
        }

    def _infer_level(self, deck_name: str) -> str | None:
        parts = deck_name.split(DECK_SEPARATOR)
        for part in reversed(parts):
            matched = LEVEL_PATTERN.search(part)
            if matched:
                return f"N{matched.group(1)}"
            fallback = FALLBACK_LEVELS.get(part)
            if fallback:
                return fallback
        return None

    def _clean_text(self, value: str | None) -> str:
        if not value:
            return ""
        text = unescape(value.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n"))
        text = HTML_TAG_PATTERN.sub(" ", text)
        text = text.replace("\xa0", " ")
        return WHITESPACE_PATTERN.sub(" ", text).strip()

    def _split_tags(self, raw_tags: str) -> list[str]:
        return [tag for tag in raw_tags.strip().split() if tag]

    def _join_non_empty(self, values: list[str]) -> str | None:
        cleaned = [value for value in values if value]
        return " | ".join(cleaned) if cleaned else None

    def _to_int(self, value: str | None) -> int | None:
        if not value:
            return None
        digits = re.sub(r"[^\d]", "", value)
        if not digits:
            return None
        return int(digits)

    def _build_metadata(self, items: list[dict[str, Any]]) -> dict[str, Any]:
        levels: dict[str, dict[str, int]] = {}
        for item in items:
            level_stats = levels.setdefault(item["level"], {"vocabulary": 0, "grammar": 0, "total": 0})
            level_stats[item["item_type"]] += 1
            level_stats["total"] += 1

        return {
            "levels": levels,
            "supported_note_types": sorted(SUPPORTED_NOTE_TYPES),
        }
