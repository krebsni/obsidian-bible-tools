import { App, TFile, TFolder, Notice, normalizePath } from "obsidian";
import { BibleToolsSettings } from "../settings";
import { articleStyle, nowStamp } from "../lib/textUtils";
import { getLeafFoldersUnder, listMarkdownFiles } from "../lib/mdUtils";

const stripWikilinks = (s: string) => s.replace(/^\[\[|\]\]$/g, "");

function frontmatterAuthorFromFile(app: App, f: TFile): { author?: string | string[], book_type?: string } {
  const cache = app.metadataCache.getFileCache(f);
  const fm: any = cache?.frontmatter ?? {};
  let author = fm.author;
  if (typeof author === "string") author = author.replace(/^"\s*/, "").replace(/\s*"$/, "");
  const book_type = typeof fm.book_type === "string" ? fm.book_type.replace(/^"\s*/, "").replace(/\s*"$/, "") : undefined;
  return { author, book_type };
}

function formatAuthorField(author: string | string[] | undefined): string {
  if (!author) return '"[[Unknown Author]]"';
  if (Array.isArray(author)) {
    return "\n  - " + author
      .map(a => a.replace(/^\[\[|\]\]$/g, ""))
      .map(a => `[[${a}]]`)
      .join("\n  - ");
  }
  const clean = author.replace(/^\[\[|\]\]$/g, "");
  return ` "[[${clean}]]"`;
}

/** Core: create/update the index file for a single folder. Returns true if created/updated, false if skipped. */
async function createOrUpdateIndexForFolder(app: App, settings: BibleToolsSettings, folder: TFolder, isBook: boolean): Promise<boolean> {
  const files = listMarkdownFiles(folder);
  if (!files.length) return false;

  // Try to pick author/book_type from the first file that has it
  let author: string | string[] | undefined = undefined;
  let bookType: string | undefined = undefined;
  for (const f of files) {
    const meta = frontmatterAuthorFromFile(app, f);
    if (meta.author) { author = meta.author; bookType = meta.book_type; break; }
  }

  const folderName = folder.name;
  const idxName = settings.indexFileNameMode === "article-style" ? articleStyle(folderName) : folderName;
  const indexPath = normalizePath(folder.path + "/" + idxName + ".md");
  const created = nowStamp();

  var props: string;
  if (isBook) {
    props = [
      `title: ${idxName}`,
      `created: ${created}`,
      `modified: ${created}`,
      `book_title: "[[${folderName}]]"`,
      ...(bookType ? [`book_type: "[[${stripWikilinks(bookType)}]]"`] : []),
      `type: "[[Book]]"`,
      `author: ${formatAuthorField(author)}`
    ].join("\n");
  } else {
    props = [
      `title: ${idxName}`,
      `created: ${created}`,
      `modified: ${created}`,
      `topics: "[[${stripWikilinks(folderName)}]]"`
    ].join("\n");
  }

  const dataview = [
    "```dataview",
    "TABLE",
    'from ""',
    "where contains(file.folder, this.file.folder) and file.name != this.file.name",
    "SORT number(file.name) ASC",
    "```",
    ""
  ].join("\n");

  const header = `---\n${props}\n---\n\n# ${idxName}\n`;
  const content = header + dataview;

  const existing = app.vault.getAbstractFileByPath(indexPath);
  if (existing instanceof TFile) {
    const cur = await app.vault.read(existing);
    if (/```dataview/.test(cur)) return false; // already has a dataview block — skip

    // Insert dataview right after frontmatter if present
    const parts = cur.split("---");
    if (parts.length >= 3) {
      const merged = parts[0] + "---" + parts[1] + "---\n" + dataview + parts.slice(2).join("---");
      await app.vault.modify(existing, merged);
    } else {
      await app.vault.modify(existing, cur + "\n" + dataview);
    }
    return true;
  } else {
    await app.vault.create(indexPath, content);
    return true;
  }
}

/** Existing command: add indexes for all leaf folders under a base folder */
export async function commandAddFolderIndex(app: App, settings: BibleToolsSettings, params?: Record<string, string>) {
  const baseFolder = params?.folder ?? settings.baseFolder;
  const folders = getLeafFoldersUnder(app, baseFolder);
  if (!folders.length) { new Notice(`No leaf folders under ${baseFolder}`); return; }

  let changed = 0;
  for (const folder of folders) {
    const did = await createOrUpdateIndexForFolder(app, settings, folder, true);
    if (did) changed++;
  }

  new Notice(changed > 0 ? `Folder indexes created/updated: ${changed}` : "No changes; indexes already present.");
}

/** NEW command: add/update index ONLY for the folder of the current file */
export async function commandAddIndexForCurrentFolder(app: App, settings: BibleToolsSettings) {
  const active = app.workspace.getActiveFile();
  const folder = active?.parent;
  if (!active || !folder) { new Notice("Open a file inside the target folder."); return; }

  const did = await createOrUpdateIndexForFolder(app, settings, folder, false);
  new Notice(did ? `Index created/updated for “${folder.name}”.` : `No index change in “${folder.name}”.`);
}