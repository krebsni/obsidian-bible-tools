import { App, TFile, TFolder, Notice } from "obsidian";
import { BibleToolsSettings } from "../settings";
import { listMarkdownFiles, upsertBottomLinks, upsertTopLinksBlock } from "../lib/mdUtils";

function tokenFromFilename(name: string): number | null {
  const m = name.match(/^(\d+)/);
  if (!m) return null;
  return parseInt(m[1], 10);
}

export async function commandAddNextPrevious(app: App, _settings: BibleToolsSettings, _params?: Record<string,string>) {
  const file = app.workspace.getActiveFile();
  if (!file) { new Notice("Open a file first."); return; }
  const parent = file.parent;
  if (!(parent instanceof TFolder)) { new Notice("Current file has no folder."); return; }

  const mdFiles = listMarkdownFiles(parent)
    .map(f => ({ f, n: tokenFromFilename(f.name) }))
    .filter(x => x.n !== null)
    .sort((a, b) => (a.n! - b.n!))
    .map(x => x.f);

  for (let i = 0; i < mdFiles.length; i++) {
    const cur = mdFiles[i];
    const prev = mdFiles[i - 1];
    const next = mdFiles[i + 1];

    const prevName = prev ? prev.basename : null;
    const nextName = next ? next.basename : null;

    const parts: string[] = [];
    if (prevName) parts.push(`[[${prevName}|Previous]]`);
    if (nextName) parts.push(`[[${nextName}|Next]]`);
    const linksLine = parts.join(" | ");

    if (!linksLine) continue;

    const src = await app.vault.read(cur);
    const withTop = upsertTopLinksBlock(src, linksLine);
    const withBoth = upsertBottomLinks(withTop, linksLine);
    await app.vault.modify(cur, withBoth);
  }

  new Notice("Inserted Next/Previous links.");
}
