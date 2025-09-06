// src/commands/biblehubLinks.ts
import { App, Notice, TFile } from "obsidian";
import { splitFrontmatter } from "../lib/md-utils";
import {
  addBibleHubLinksInText,
  detectBookShortForFile,
  removeBibleHubLinksInText,
} from "../lib/biblehub";
import { BibleHubLinksModal, ScopeChoice } from "src/ui/bible-hub-links-modal";

async function processFileAdd(app: App, file: TFile): Promise<{ changed: boolean; added: number; reason?: string }> {
  const bookShort = await detectBookShortForFile(app, file);
  if (!bookShort) return { changed: false, added: 0, reason: "unknown book" };
  const raw = await app.vault.read(file);
  const { yaml, body } = splitFrontmatter(raw);
  const { text, added } = addBibleHubLinksInText(body, bookShort);
  if (added > 0) {
    await app.vault.modify(file, (yaml ?? "") + text);
    return { changed: true, added };
  }
  return { changed: false, added: 0 };
}

async function processFileRemove(app: App, file: TFile): Promise<{ changed: boolean; removed: number }> {
  const raw = await app.vault.read(file);
  const { yaml, body } = splitFrontmatter(raw);
  const { text, removed } = removeBibleHubLinksInText(body);
  if (removed > 0) {
    await app.vault.modify(file, (yaml ?? "") + text);
    return { changed: true, removed };
  }
  return { changed: false, removed: 0 };
}

export function commandAddBibleHubLinks(app: App) {
  new BibleHubLinksModal(app, async (scope: ScopeChoice) => {
    if (scope.kind === "current") {
      const f = app.workspace.getActiveFile();
      if (!f) { new Notice("Open a Markdown file first."); return; }
      if (f.extension !== "md") { new Notice("Current file is not a Markdown file."); return; }
      const r = await processFileAdd(app, f);
      if (r.changed) new Notice(`Added ${r.added} BibleHub link(s).`);
      else new Notice(r.reason ? `No links added (${r.reason}).` : "No lines with ^chapter-verse anchors found.");
      return;
    }

    // folder scope (non-recursive, .md only)
    const folder = scope.folder;
    let addedTotal = 0, changedFiles = 0, skipped = 0;
    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === "md") {
        try {
          const r = await processFileAdd(app, child);
          if (r.changed) { changedFiles++; addedTotal += r.added; }
          else if (r.reason === "unknown book") {
            skipped++;
            console.warn(`[BibleHub] Skipped ${child.path}: unknown book.`);
          }
        } catch (e) {
          console.warn("[BibleHub] Failed on", child.path, e);
        }
      }
    }
    new Notice(`BibleHub links: +${addedTotal} in ${changedFiles} file(s). Skipped (unknown book): ${skipped}.`);
  }).open();
}

export function commandRemoveBibleHubLinks(app: App) {
  new BibleHubLinksModal(app, async (scope: ScopeChoice) => {
    if (scope.kind === "current") {
      const f = app.workspace.getActiveFile();
      if (!f) { new Notice("Open a Markdown file first."); return; }
      if (f.extension !== "md") { new Notice("Current file is not a Markdown file."); return; }
      const r = await processFileRemove(app, f);
      if (r.changed) new Notice(`Removed ${r.removed} BibleHub link(s).`);
      else new Notice("No BibleHub links to remove.");
      return;
    }

    const folder = scope.folder;
    let removedTotal = 0, changedFiles = 0;
    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === "md") {
        try {
          const r = await processFileRemove(app, child);
          if (r.changed) { changedFiles++; removedTotal += r.removed; }
        } catch (e) {
          console.warn("[BibleHub] Remove failed on", child.path, e);
        }
      }
    }
    new Notice(`BibleHub links removed: -${removedTotal} in ${changedFiles} file(s).`);
  }).open();
}