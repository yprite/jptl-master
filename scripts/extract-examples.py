#!/usr/bin/env python3
"""Extract example sentences from Anki deck and enrich flashcard JSON files."""

import json
import re
import sqlite3
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
ANKI_DB = Path("/tmp/anki-extract/collection21.sqlite3")
VOCAB_NOTETYPE_ID = 1728981502167


class ExampleParser(HTMLParser):
    """Parse Anki HTML example field to extract first example sentence."""

    def __init__(self):
        super().__init__()
        self._in_origin = False
        self._in_translate = False
        self._in_ruby_rb = False
        self._in_ruby_rt = False
        self._skip = False
        self._current_jp = []
        self._current_reading = []
        self._current_kr = []
        self.examples = []  # list of (japanese, yomigana, korean)
        self._pending_kanji = ""

    def handle_starttag(self, tag, attrs):
        classes = dict(attrs).get("class", "")
        if tag == "p" and "origin" in classes:
            self._in_origin = True
            self._current_jp = []
            self._current_reading = []
        elif tag == "p" and "translate" in classes:
            self._in_translate = True
            self._current_kr = []
        elif tag == "rb" and self._in_origin:
            self._in_ruby_rb = True
            self._pending_kanji = ""
        elif tag == "rt" and self._in_origin:
            self._in_ruby_rt = True
        elif tag == "rp":
            self._skip = True

    def handle_endtag(self, tag):
        if tag == "p" and self._in_origin:
            self._in_origin = False
        elif tag == "p" and self._in_translate:
            self._in_translate = False
            jp = "".join(self._current_jp).strip()
            reading = "".join(self._current_reading).strip()
            kr = "".join(self._current_kr).strip()
            # Remove TTS markers
            jp = re.sub(r"\[anki:tts.*?\[/anki:tts\]", "", jp).strip()
            reading = re.sub(r"\[anki:tts.*?\[/anki:tts\]", "", reading).strip()
            if jp and kr:
                self.examples.append((jp, reading, kr))
        elif tag == "rb":
            self._in_ruby_rb = False
        elif tag == "rt":
            self._in_ruby_rt = False
        elif tag == "rp":
            self._skip = False

    def handle_data(self, data):
        if self._skip:
            return
        if self._in_ruby_rb:
            self._pending_kanji = data
            self._current_jp.append(data)
        elif self._in_ruby_rt:
            self._current_reading.append(data)
            # Don't add to jp (kanji already added via rb)
        elif self._in_origin:
            text = data
            # Remove TTS blocks
            if "[anki:tts" in text or "[/anki:tts]" in text:
                return
            self._current_jp.append(text)
            self._current_reading.append(text)
        elif self._in_translate:
            self._current_kr.append(data)


def extract_anki_examples():
    """Extract vocabulary examples from Anki database."""
    if not ANKI_DB.exists():
        print(f"Anki DB not found at {ANKI_DB}", file=sys.stderr)
        sys.exit(1)

    conn = sqlite3.connect(str(ANKI_DB))
    rows = conn.execute(
        "SELECT flds FROM notes WHERE mid = ?", (VOCAB_NOTETYPE_ID,)
    ).fetchall()
    conn.close()

    word_examples = {}  # word -> {japanese, yomigana, korean}

    for (flds,) in rows:
        fields = flds.split("\x1f")
        if len(fields) < 6:
            continue

        word = fields[0].strip()
        reading = fields[1].strip() if fields[1] else None
        html_examples = fields[5]

        if not html_examples or not html_examples.strip():
            continue

        parser = ExampleParser()
        try:
            parser.feed(html_examples)
        except Exception:
            continue

        if parser.examples:
            jp, yomi, kr = parser.examples[0]  # Take first example
            word_examples[word] = {
                "example_jp": jp,
                "example_reading": yomi,
                "example_kr": kr,
            }

    return word_examples


def enrich_flashcards(word_examples):
    """Update flashcard JSON files with example data."""
    study_data = PROJECT / "public" / "study-data"
    updated_files = []

    for json_file in sorted(study_data.glob("flashcards-*.json")):
        with open(json_file, "r", encoding="utf-8") as f:
            cards = json.load(f)

        changed = 0
        for card in cards:
            word = card.get("word", "")
            if word in word_examples:
                ex = word_examples[word]
                card["example_jp"] = ex["example_jp"]
                card["example_reading"] = ex["example_reading"]
                card["example_kr"] = ex["example_kr"]
                changed += 1

        if changed > 0:
            with open(json_file, "w", encoding="utf-8") as f:
                json.dump(cards, f, ensure_ascii=False, indent=2)
            updated_files.append((json_file.name, changed, len(cards)))
            print(f"  {json_file.name}: {changed}/{len(cards)} cards enriched")

    return updated_files


def main():
    print("Extracting examples from Anki deck...")
    word_examples = extract_anki_examples()
    print(f"  Found examples for {len(word_examples)} words")

    print("\nEnriching flashcard files...")
    results = enrich_flashcards(word_examples)

    if not results:
        print("  No files updated.")
    else:
        print(f"\nDone! Updated {len(results)} file(s).")


if __name__ == "__main__":
    main()
