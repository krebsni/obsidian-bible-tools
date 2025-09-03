# Obsidian Bible Tools

Port of personal Python utilities into an Obsidian plugin.

## Features
- Add folder index files (Dataview)
- Add Next/Previous links across numbered files
- Extract red <mark> highlights into a section or a folder summary
- Extract an "Outline" from headings and insert intelligently
- Format outline text (Roman numerals/A/B/1/a) into Markdown headings
- Auto-link Bible verse references like `Rom. 1:10-12, 14; 2:1` to your anchors `[[Rom#^1-10|Rom. 1:10]]`
- Command palette, hotkeys, mobile toolbar, ribbon icons
- obsidian:// protocol actions for command-line triggering

## Build
```bash
npm i
npm run build
```

Copy the folder into your vault `.obsidian/plugins/` (or symlink), then enable in Settings → Community Plugins.

## Command line trigger (macOS example)
```bash
open 'obsidian://obsidian-bible-tools?action=link-verses&scope=current'
```

See Settings → Mobile → Toolbar to add commands to the mobile editor toolbar.
