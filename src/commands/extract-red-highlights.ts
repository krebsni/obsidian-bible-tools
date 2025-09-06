import { App, Notice } from "obsidian";
import { BibleToolsSettings } from "../settings";
import { insertAfterYamlOrH1 } from "../lib/md-utils";

export async function commandExtractRedHighlights(app: App, settings: BibleToolsSettings) {
  const file = app.workspace.getActiveFile();
  if (!file) { new Notice("Open a file first."); return; }
  const src = await app.vault.read(file);

  const markRegex = new RegExp(`<mark\\s+style=["']${settings.redMarkCss.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}["']>(.*?)</mark>`, "g");
  const hits: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = markRegex.exec(src)) !== null) {
    const text = m[1].trim();
    if (text && !hits.includes(text)) hits.push(text);
  }

  if (!hits.length) { new Notice("No red highlights found."); return; }

  const section = [
    "> [!summary]- Highlights",
    ...hits.map(h => `> - ${h}`),
    ""
  ].join("\n");

  const merged = insertAfterYamlOrH1(src, section);
  await app.vault.modify(file, merged);
  new Notice("Highlights section inserted.");
}
