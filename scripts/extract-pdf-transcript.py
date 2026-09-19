#!/usr/bin/env python3
"""Create a page-separated Markdown transcript from a text-layer PDF."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

from pypdf import PdfReader


def clean_text(value: str) -> str:
    return (
        value.replace("\x00", "")
        .replace("\u00ad", "")
        .replace("\r\n", "\n")
        .replace("\r", "\n")
        .strip()
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--title", required=True)
    args = parser.parse_args()

    source_bytes = args.source.read_bytes()
    checksum = hashlib.sha256(source_bytes).hexdigest()
    reader = PdfReader(str(args.source))

    parts = [
        f"# {args.title}: полный текстовый слой",
        "",
        "Текст извлечён автоматически и разделён по PDF-страницам. Он сохраняет",
        "слова источника, но не порядок стрелок и блоков диагностических схем.",
        "Для маршрутов используйте `flowcharts.md` и обязательно сверяйтесь с PDF.",
        "",
        f"- PDF-страниц: {len(reader.pages)}",
        f"- SHA-256: `{checksum}`",
        "",
    ]

    for page_number, page in enumerate(reader.pages, start=1):
        parts.extend(
            [
                f"## PDF-страница {page_number}",
                "",
                clean_text(page.extract_text() or "") or "_[Текстовый слой отсутствует]_",
                "",
            ]
        )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(parts), encoding="utf-8")


if __name__ == "__main__":
    main()
