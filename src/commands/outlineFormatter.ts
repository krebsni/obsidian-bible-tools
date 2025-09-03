import { App, Notice } from "obsidian";
import { BibleToolsSettings } from "../settings";
import { formatOutlineText } from "../lib/outlineUtils";

export async function commandOutlineFormatter(app: App, settings: BibleToolsSettings) {
  const file = app.workspace.getActiveFile();
  if (!file) { new Notice("Open a file first."); return; }

  const src = await app.vault.read(file);

  const out = await formatOutlineText(src, {
    splitInlineSubpoints: true,   // splits "... v. 9: a. ... b. ...", but NOT on "."
    fixHyphenatedBreaks: true,    // fixes "illus- trated" → "illustrated"
    dropPurePageNumberLines: true // optional: drops "14", "15", "16"
  }, settings);

  await app.vault.modify(file, out);
  new Notice("Outline formatted.");
}