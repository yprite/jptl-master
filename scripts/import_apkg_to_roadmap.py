#!/usr/bin/env python3
"""
Import an APKG deck into the roadmap schema.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.application.services.anki_import_service import AnkiApkgImportService
from backend.infrastructure.config.database import get_database


def main() -> None:
    parser = argparse.ArgumentParser(description="Import JLPT APKG into the roadmap tables.")
    parser.add_argument("file_path", help="Absolute or relative path to the .apkg file")
    parser.add_argument(
        "--keep-existing",
        action="store_true",
        help="Keep existing roadmap import rows instead of overwriting them",
    )
    args = parser.parse_args()

    service = AnkiApkgImportService(get_database())
    summary = service.import_package(args.file_path, overwrite=not args.keep_existing)

    print(f"Imported {summary.item_count} items from {summary.source_name}")
    for level, counts in sorted(summary.levels.items()):
        print(
            f"  {level}: total={counts['total']} "
            f"vocabulary={counts['vocabulary']} grammar={counts['grammar']}"
        )


if __name__ == "__main__":
    main()
