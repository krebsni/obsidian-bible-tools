# Bible Tools

Outline formatter, Bible verse linker (selection/line/folder), _Bible builder from public catalogues (bolls.life), PDF import with OCR, and folder utilities.

## Features

- **Outline Formatter**: cleans PDF-style line breaks, splits inline points (I./A./1./a./(1)), keeps “S. S.” intact, preserves verse refs (e.g., `v. 7.`), normalizes dashes.
- **Verse Linker**: link `John 3:16; 17:1` → `[[John#^3-16|…]]`, with optional version suffix (e.g., `John (KJV)`) and selection/line/folder scope.
- **Bible Builder**: generate `_Bible/<Version>/Book (VER)` files, chapters and verse anchors (`^ch-verse`), chapter navigation, and optional frontmatter.
- **Folder Indexer**: insert Dataview index files per leaf folder.

## Installation (Community)

1. In Obsidian: **Settings → Community plugins → Browse**.
2. Search **Bible Tools**, install, then **Enable**.

## Commands

- Bible Tools: Link verses (choose version...)
- Bible Tools: Create Highlights.md from folder
- Bible Tools: Create/Update Folder Index (Books)
- Bible Tools: Extract Red Highlights to current file
- Bible Tools: Import Bible version into vault (download from bolls.life)
- Bible Tools: Auto-link Bible verses (file or folder)
- Bible Tools: Append Outline (from ##...###### headings)
- Bible Tools: Insert Next/Previous Links (Current Folder)
- Bible Tools: Create/Update Folder Index for Current Folder Bible Tools: Link verses in selection/line (choose version...)
- Bible Tools: Format Outline (Roman/A/1/a → Markdown headings) and Link Verses


## Changelog

See **Releases** for version-by-version notes.

## Upcoming

Planned features include:

- Create/Update Folder Index (Books) -> instead use new Bases
- Properties (e.g. book number for base sorting)
- Option to link Biblehub Interlinear at end of verse lines

## License

MIT License © 2025 Nicolai Krebs
See [LICENSE](./LICENSE) for details.
