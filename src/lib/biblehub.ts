// src/lib/biblehub.ts
import { App, TFile } from "obsidian";
import { splitFrontmatter } from "./md-utils";
import { BIBLEHUB_INTERLINEAR, BOOK_ABBR } from "./types";


/** Normalize a raw "book title" to our short key (uses BOOK_ABBR). */
export function normalizeToShortBook(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let s = String(raw).trim();
  // strip [[...]] and parentheses like "John (KJV)"
  s = s.replace(/^\[\[|\]\]$/g, "").replace(/\s*\([^)]+\)\s*$/, "");
  // try direct short key
  if (BIBLEHUB_INTERLINEAR[s]) return s;
  // try long -> short via BOOK_ABBR
  if ((BOOK_ABBR as any)[s]) return (BOOK_ABBR as any)[s];
  // sometimes people use abbreviations with trailing dot
  s = s.replace(/\.$/, "");
  if ((BOOK_ABBR as any)[s]) return (BOOK_ABBR as any)[s];
  if (BIBLEHUB_INTERLINEAR[s]) return s;
  return null;
}

/** Try to derive book short code for a file (frontmatter > filename). */
export async function detectBookShortForFile(app: App, file: TFile): Promise<string | null> {
  const content = await app.vault.read(file);
  const { yaml } = splitFrontmatter(content);
  // 1) frontmatter keys that might carry the book name
  if (yaml) {
    const m = yaml.match(/(?:^|\n)book[_-]?title:\s*("?)([^\n"]+)\1/i);
    if (m) {
      const fromFm = normalizeToShortBook(m[2]);
      if (fromFm) return fromFm;
    }
    const t = yaml.match(/(?:^|\n)title:\s*("?)([^\n"]+)\1/i);
    if (t) {
      const fromTitle = normalizeToShortBook(t[2]);
      if (fromTitle) return fromTitle;
    }
  }
  // 2) fall back to basename
  const base = file.basename;
  const fromName = normalizeToShortBook(base);
  if (fromName) return fromName;
  return null;
}

/** Add a BibleHub interlinear link before a trailing anchor " ^N" or " ^N-M". (Python parity) */
export function addBibleHubLinkToLine(line: string, bookShort: string): string {
  // If there's already a biblehub interlinear link right before the anchor, skip
  const already = /\[\s*\]\(https?:\/\/biblehub\.com\/interlinear\/[^\)]+\)\s+\^\d+(?:-\d+)?\s*$/.test(line);
  if (already) return line;

  const m = line.match(/(\s\^(\d+(?:-\d+)?))$/);
  if (!m) return line;

  const chapterVerse = m[2];
  const slug = BIBLEHUB_INTERLINEAR[bookShort];
  if (!slug) return line;

  const url = `https://biblehub.com/interlinear/${slug}/${chapterVerse}.htm`;
  // Insert " [](url)" before the anchor (preserve the original anchor tail in a backref)
  return line.replace(/(\s\^(\d+)(-\d+)?)$/, ` [ ](${url})$1`);
}

/** Remove any " [](https://biblehub.com/interlinear/...)" immediately before a trailing anchor. */
export function removeBibleHubLinkFromLine(line: string): string {
  return line.replace(
    /\s\[\s*\]\(https?:\/\/biblehub\.com\/interlinear\/[^\)]+\)\s+(?=\^\d+(?:-\d+)?\s*$)/,
    " "
  );
}

/** Process entire text body (YAML must be stripped out beforehand). */
export function addBibleHubLinksInText(body: string, bookShort: string): { text: string; added: number } {
  const lines = body.split(/\r?\n/);
  let added = 0;
  const out = lines.map((ln) => {
    const next = addBibleHubLinkToLine(ln, bookShort);
    if (next !== ln) added++;
    return next;
  });
  return { text: out.join("\n"), added };
}
export function removeBibleHubLinksInText(body: string): { text: string; removed: number } {
  const lines = body.split(/\r?\n/);
  let removed = 0;
  const out = lines.map((ln) => {
    const next = removeBibleHubLinkFromLine(ln);
    if (next !== ln) removed++;
    return next;
  });
  return { text: out.join("\n"), removed };
}