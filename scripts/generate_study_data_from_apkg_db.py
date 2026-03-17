#!/usr/bin/env python3
"""
Generate static study datasets for the Next.js app from the normalized JLPT deck DB.

Source DB schema is expected to contain `learning_items` imported from the JLPT APKG.
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sqlite3
from pathlib import Path
from typing import Any


LEVELS = ("N5", "N4", "N3")
OUTPUT_DIR_NAME = "study-data"
MAX_EXAMPLE_LENGTH = 220
DISTRACTOR_COUNT = 3
ANKI_TTS_PATTERN = re.compile(r"\[anki:tts[^\]]*\](.*?)\[/anki:tts\]", re.DOTALL)


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    text = ANKI_TTS_PATTERN.sub(r"\1", str(value))
    return " ".join(text.split()).strip()


def shorten_text(value: str | None, limit: int = MAX_EXAMPLE_LENGTH) -> str | None:
    text = normalize_text(value)
    if not text:
        return None
    if len(text) <= limit:
        return text
    return f"{text[: limit - 1].rstrip()}…"


def extract_vocab_example(value: str | None) -> str | None:
    if not value:
        return None

    match = ANKI_TTS_PATTERN.search(str(value))
    if not match:
        return None

    return shorten_text(match.group(1), 120)


def unique_values(rows: list[sqlite3.Row], key: str) -> list[str]:
    seen: set[str] = set()
    values: list[str] = []
    for row in rows:
      value = normalize_text(row[key])
      if value and value not in seen:
          values.append(value)
          seen.add(value)
    return values


def pick_distractors(
    *,
    seed: str,
    pool: list[str],
    correct: str,
    count: int = DISTRACTOR_COUNT,
) -> list[str]:
    candidates = [value for value in pool if value and value != correct]
    if len(candidates) <= count:
        return candidates

    rng = random.Random(seed)
    picks: list[str] = []
    while candidates and len(picks) < count:
        choice = rng.choice(candidates)
        candidates.remove(choice)
        if choice not in picks:
            picks.append(choice)
    return picks


def shuffled_choices(seed: str, correct: str, distractors: list[str]) -> list[str]:
    choices = [correct, *distractors]
    rng = random.Random(f"{seed}:shuffle")
    rng.shuffle(choices)
    return choices


def load_rows(conn: sqlite3.Connection, level: str, item_type: str) -> list[sqlite3.Row]:
    return conn.execute(
        """
        SELECT
            id,
            level,
            item_type,
            title,
            prompt,
            answer,
            reading,
            meaning,
            example_jp,
            example_kr,
            extra_text,
            source_order
        FROM learning_items
        WHERE level = ? AND item_type = ?
        ORDER BY COALESCE(source_order, id), id
        """,
        (level, item_type),
    ).fetchall()


def build_flashcards(rows: list[sqlite3.Row], level: str) -> list[dict[str, Any]]:
    cards: list[dict[str, Any]] = []
    for row in rows:
        cards.append(
            {
                "word": normalize_text(row["title"]),
                "reading": normalize_text(row["reading"]) or None,
                "meaning": normalize_text(row["meaning"] or row["answer"]),
                "level": level,
                "example": extract_vocab_example(row["extra_text"] or row["example_jp"]),
            }
        )
    return cards


def build_vocabulary_questions(rows: list[sqlite3.Row], level: str) -> list[dict[str, Any]]:
    meaning_pool = unique_values(rows, "meaning")
    reading_pool = unique_values(rows, "reading")
    questions: list[dict[str, Any]] = []

    for row in rows:
        word = normalize_text(row["title"])
        meaning = normalize_text(row["meaning"] or row["answer"])
        reading = normalize_text(row["reading"])
        example = extract_vocab_example(row["extra_text"] or row["example_jp"])
        base_seed = f"{level}:{row['id']}"

        meaning_distractors = pick_distractors(
            seed=f"{base_seed}:meaning",
            pool=meaning_pool,
            correct=meaning,
        )
        if len(meaning_distractors) == DISTRACTOR_COUNT:
            questions.append(
                {
                    "id": f"{row['id']}-meaning",
                    "level": level,
                    "type": "meaning",
                    "prompt": word,
                    "question": f"「{word}」의 뜻으로 맞는 것은?",
                    "choices": shuffled_choices(f"{base_seed}:meaning", meaning, meaning_distractors),
                    "correct_answer": meaning,
                    "explanation": normalize_text(
                        " ".join(
                            part
                            for part in [
                                f"{word}{f' ({reading})' if reading else ''} = {meaning}.",
                                f"예문: {example}." if example else "",
                            ]
                            if part
                        )
                    ),
                }
            )

        if reading:
            reading_distractors = pick_distractors(
                seed=f"{base_seed}:reading",
                pool=reading_pool,
                correct=reading,
            )
            if len(reading_distractors) == DISTRACTOR_COUNT:
                questions.append(
                    {
                        "id": f"{row['id']}-reading",
                        "level": level,
                        "type": "reading",
                        "prompt": word,
                        "question": f"「{word}」의 읽기로 맞는 것은?",
                        "choices": shuffled_choices(
                            f"{base_seed}:reading", reading, reading_distractors
                        ),
                        "correct_answer": reading,
                        "explanation": normalize_text(
                            f"{word}의 읽기는 {reading}입니다. 뜻: {meaning}."
                        ),
                    }
                )

    return questions


def build_grammar_questions(rows: list[sqlite3.Row], level: str) -> list[dict[str, Any]]:
    meaning_pool = unique_values(rows, "meaning")
    questions: list[dict[str, Any]] = []

    for row in rows:
        pattern = normalize_text(row["title"])
        meaning = normalize_text(row["meaning"] or row["answer"])
        example_jp = normalize_text(row["example_jp"]) or None
        example_kr = normalize_text(row["example_kr"]) or None
        explanation = normalize_text(
            " ".join(part for part in [f"{pattern} = {meaning}.", example_jp or "", example_kr or ""] if part)
        )
        seed = f"{level}:{row['id']}:grammar"
        distractors = pick_distractors(seed=seed, pool=meaning_pool, correct=meaning)
        if len(distractors) != DISTRACTOR_COUNT:
            continue

        questions.append(
            {
                "id": f"{row['id']}-grammar",
                "level": level,
                "type": "meaning",
                "pattern": pattern,
                "question": f"「{pattern}」의 의미로 맞는 것은?",
                "choices": shuffled_choices(seed, meaning, distractors),
                "correct_answer": meaning,
                "explanation": explanation,
                "example_jp": example_jp,
                "example_kr": example_kr,
            }
        )

    return questions


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def build_manifest(
    flashcards: dict[str, list[dict[str, Any]]],
    vocabulary_questions: dict[str, list[dict[str, Any]]],
    grammar_questions: dict[str, list[dict[str, Any]]],
) -> dict[str, Any]:
    return {
        "flashcards": {level: len(items) for level, items in flashcards.items()},
        "vocabulary_questions": {
            level: {
                "total": len(items),
                "meaning": sum(1 for item in items if item["type"] == "meaning"),
                "reading": sum(1 for item in items if item["type"] == "reading"),
            }
            for level, items in vocabulary_questions.items()
        },
        "grammar_questions": {level: len(items) for level, items in grammar_questions.items()},
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source-db",
        default="/Users/yonghun/.openclaw/workspace/jptl-master/data/jlpt.db",
        help="Path to the normalized JLPT SQLite DB.",
    )
    parser.add_argument(
        "--output-dir",
        default="public/study-data",
        help="Directory where generated JSON files will be written.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source_db = Path(args.source_db).expanduser().resolve()
    output_dir = Path(args.output_dir).resolve()

    if not source_db.exists():
        raise FileNotFoundError(f"Source DB not found: {source_db}")

    conn = sqlite3.connect(source_db)
    conn.row_factory = sqlite3.Row

    try:
        flashcards: dict[str, list[dict[str, Any]]] = {}
        vocabulary_questions: dict[str, list[dict[str, Any]]] = {}
        grammar_questions: dict[str, list[dict[str, Any]]] = {}

        for level in LEVELS:
            vocab_rows = load_rows(conn, level, "vocabulary")
            grammar_rows = load_rows(conn, level, "grammar")

            flashcards[level] = build_flashcards(vocab_rows, level)
            vocabulary_questions[level] = build_vocabulary_questions(vocab_rows, level)
            grammar_questions[level] = build_grammar_questions(grammar_rows, level)

            write_json(output_dir / f"flashcards-{level}.json", flashcards[level])
            write_json(
                output_dir / f"vocabulary-questions-{level}.json",
                vocabulary_questions[level],
            )
            write_json(output_dir / f"grammar-questions-{level}.json", grammar_questions[level])

        write_json(
            output_dir / "manifest.json",
            build_manifest(flashcards, vocabulary_questions, grammar_questions),
        )
    finally:
        conn.close()


if __name__ == "__main__":
    main()
