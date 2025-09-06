import { App, Notice, TFolder } from "obsidian";
import { BibleToolsSettings } from "../settings";
import { listMarkdownFiles } from "../lib/md-utils";

export async function commandExtractHighlightsFolder(app: App, settings: BibleToolsSettings) {
  const view = app.workspace.getActiveFile();
  const startFolder = view?.parent ?? app.vault.getFolderByPath(settings.baseFolder);
  if (!(startFolder instanceof TFolder)) { new Notice("Open a file in the target folder or set a valid base folder."); return; }

  const all: string[] = [];
  const seen = new Set<string>();
  const markRegex = new RegExp(`<mark\\s+style=["']${settings.redMarkCss.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}["']>(.*?)</mark>`, "g");

  const files = listMarkdownFiles(startFolder).sort((a,b) => {
    const an = a.basename.match(/^\d+/)?.[0]; const bn = b.basename.match(/^\d+/)?.[0];
    if (an && bn) return Number(an) - Number(bn);
    if (an) return -1;
    if (bn) return 1;
    return a.basename.localeCompare(b.basename);
  });

  for (const f of files) {
    const src = await app.vault.read(f);
    const local: string[] = [];
    let m: RegExpExecArray | null;
    markRegex.lastIndex = 0;
    while ((m = markRegex.exec(src)) !== null) {
      const text = m[1].trim();
      if (!text) continue;
      if (!seen.has(text)) { seen.add(text); if (!local.includes(text)) local.push(text); }
    }
    if (local.length) {
      all.push(`\n#### [[${f.basename}]]\n` + local.map(t => `- ${t}`).join("\n"));
    }
  }

  if (!all.length) { new Notice("No highlights found in folder."); return; }

  const out = all.join("\n");
  const target = startFolder.path + "/Highlights.md";
  const existing = app.vault.getFileByPath(target);
  if (existing) await app.vault.modify(existing, out);
  else await app.vault.create(target, out);
  new Notice("Highlights.md created.");
}
