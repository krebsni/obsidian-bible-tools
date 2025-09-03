import { App, Notice } from "obsidian";
import { BibleToolsSettings } from "../settings";

export async function commandOutlineExtractor(app: App, _settings: BibleToolsSettings) {
  const file = app.workspace.getActiveFile();
  if (!file) { new Notice("Open a file first."); return; }

  const original = await app.vault.read(file);
  const lines = original.split(/\r?\n/);

  const outlineLines: string[] = [];

  // EXACT regex as Python: one space after the hashes
  for (const line of lines) {
    const m = line.match(/^(#{2,6}) (.+)/);
    if (m) {
      const hashes = m[1];
      let content = m[2];
      const level = hashes.length - 2; // ## -> 0, ### -> 1, etc.
      const indent = "\t".repeat(Math.max(0, level - 1));
      if (level === 0) content = `**${content}**`;
      outlineLines.push(`${indent}${content}`);
    }
  }

  if (outlineLines.length === 0) {
    new Notice("No headings (##..######) found.");
    return;
  }

  // Check last 4 lines for "|Next]]" or "|Previous]]"
  let insertIndex: number | null = null;
  const lookback = Math.min(4, lines.length);
  for (let i = 1; i <= lookback; i++) {
    const ln = lines[lines.length - i];
    if (/\|Next\]\]|\|Previous\]\]/.test(ln)) {
      insertIndex = lines.length - i;
      break;
    }
  }

  const outlineText = "## Outline\n" + outlineLines.join("\n") + "\n\n";

  if (insertIndex !== null) {
    // Insert before the found line, preserving surrounding newlines
    const beforeStr = lines.slice(0, insertIndex).join("\n");
    const afterStr = lines.slice(insertIndex).join("\n");
    const newContent =
      (beforeStr.endsWith("\n") || beforeStr.length === 0 ? "" : "\n") +
      outlineText +
      afterStr;
    await app.vault.modify(file, beforeStr + newContent);
  } else {
    // Append to end (like Python 'a' mode)
    const newContent = original + (original.endsWith("\n") ? "" : "\n") + outlineText;
    await app.vault.modify(file, newContent);
  }

  new Notice("Outline appended successfully.");
}