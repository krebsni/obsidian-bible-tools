// src/commands/verseLinks.ts
import {
  App,
  MarkdownView,
  Modal,
  Notice,
  Setting,
  TFile,
  requestUrl,
} from "obsidian";
import { BibleToolsSettings } from "../settings";
import { splitFrontmatter } from "../lib/mdUtils";
import { PickVersionModal } from "src/ui/pick-version-modal";

/** ---------------------------
 *  BOOK MAP (default, English)
 *  --------------------------- */
const BOOK_ABBR: Record<string, string> = {
  // ---- Pentateuch ----
  "Genesis": "Gen",
  "1 Mose": "Gen", "1Mose": "Gen",
  "1. Mose": "Gen", "1.Mose": "Gen",

  "Exodus": "Exo",
  "2 Mose": "Exo", "2Mose": "Exo",
  "2. Mose": "Exo", "2.Mose": "Exo",

  "Leviticus": "Lev",
  "3 Mose": "Lev", "3Mose": "Lev",
  "3. Mose": "Lev", "3.Mose": "Lev",

  "Numbers": "Num",
  "Numeri": "Num",
  "4 Mose": "Num", "4Mose": "Num",
  "4. Mose": "Num", "4.Mose": "Num",

  "Deuteronomy": "Deut",
  "Deuteronomium": "Deut",
  "5 Mose": "Deut", "5Mose": "Deut",
  "5. Mose": "Deut", "5.Mose": "Deut",

  // ---- Historical ----
  "Joshua": "Josh", "Josua": "Josh",
  "Judges": "Judg", "Richter": "Judg",
  "Ruth": "Ruth",

  "1 Samuel": "1 Sam", "1. Samuel": "1 Sam", "1Samuel": "1 Sam", "1.Samuel": "1 Sam",
  "2 Samuel": "2 Sam", "2. Samuel": "2 Sam", "2Samuel": "2 Sam", "2.Samuel": "2 Sam",

  "1 Kings": "1 Kings", "1. Könige": "1 Kings", "1Könige": "1 Kings", "1.Könige": "1 Kings",
  "2 Kings": "2 Kings", "2. Könige": "2 Kings", "2Könige": "2 Kings", "2.Könige": "2 Kings",

  "1 Chronicles": "1 Chron", "1. Chronik": "1 Chron", "1Chronik": "1 Chron", "1.Chronik": "1 Chron",
  "2 Chronicles": "2 Chron", "2. Chronik": "2 Chron", "2Chronik": "2 Chron", "2.Chronik": "2 Chron",

  "Ezra": "Ezra", "Esra": "Ezra",
  "Nehemiah": "Neh", "Nehemia": "Neh",
  "Esther": "Esth",
  "Job": "Job", "Hiob": "Job",

  // ---- Wisdom ----
  "Psalms": "Psa", "Psalm": "Psa", "Ps": "Psa",
  "Proverbs": "Prov", "Sprüche": "Prov", "Spr": "Prov",
  "Ecclesiastes": "Eccl", "Prediger": "Eccl", "Kohelet": "Eccl",
  "Song of Solomon": "SoS", "Song of Songs": "SoS", "Hoheslied": "SoS", "Hohelied": "SoS", "Lied der Lieder": "SoS", "SS": "SoS",

  // ---- Prophets ----
  "Isaiah": "Isa", "Jesaja": "Isa",
  "Jeremiah": "Jer", "Jeremia": "Jer",
  "Lamentations": "Lam", "Klagelieder": "Lam", "Threni": "Lam",
  "Ezekiel": "Ezek", "Hesekiel": "Ezek", "Ezechiel": "Ezek",
  "Daniel": "Dan",
  "Hosea": "Hosea",
  "Joel": "Joel",
  "Amos": "Amos",
  "Obadiah": "Obad", "Obadja": "Obad",
  "Jonah": "Jonah", "Jona": "Jonah",
  "Micah": "Micah", "Micha": "Micah",
  "Nahum": "Nah",
  "Habakkuk": "Hab", "Habakuk": "Hab",
  "Zephaniah": "Zep", "Zephanja": "Zep", "Zefanja": "Zep",
  "Haggai": "Hag",
  "Zechariah": "Zech", "Sacharja": "Zech",
  "Malachi": "Mal", "Maleachi": "Mal",

  // ---- Gospels & Acts ----
  "Matthew": "Matt", "Matthäus": "Matt", "Mt": "Matt",
  "Mark": "Mark", "Markus": "Mark", "Mk": "Mark",
  "Luke": "Luke", "Lukas": "Luke", "Lk": "Luke", "Luk": "Luke",
  "John": "John", "Johannes": "John", "Joh": "John",
  "Acts": "Acts", "Apg": "Acts", "Apostelgeschichte": "Acts",

  // ---- Paul’s letters ----
  "Romans": "Rom", "Römer": "Rom", "Röm": "Rom", "Römerbrief": "Rom",

  "1 Corinthians": "1 Cor", "1 Korinther": "1 Cor", "1. Korinther": "1 Cor", "1Korinther": "1 Cor", "1.Korinther": "1 Cor",
  "1 Kor": "1 Cor", "1. Kor": "1 Cor", "1Kor": "1 Cor", "1.Kor": "1 Cor",

  "2 Corinthians": "2 Cor", "2 Korinther": "2 Cor", "2. Korinther": "2 Cor", "2Korinther": "2 Cor", "2.Korinther": "2 Cor",
  "2 Kor": "2 Cor", "2. Kor": "2 Cor", "2Kor": "2 Cor", "2.Kor": "2 Cor",

  "Galatians": "Gal", "Galater": "Gal", "Gal": "Gal",
  "Ephesians": "Eph", "Epheser": "Eph", "Eph": "Eph",
  "Philippians": "Phil", "Philipper": "Phil", "Phil": "Phil",
  "Colossians": "Col", "Kolosser": "Col", "Kol": "Col",

  "1 Thessalonians": "1 Thes", "1 Thess": "1 Thes", "1. Thess": "1 Thes", "1Thess": "1 Thes", "1.Thess": "1 Thes",
  "1 Thessalonicher": "1 Thes", "1. Thessalonicher": "1 Thes", "1Thessalonicher": "1 Thes", "1.Thessalonicher": "1 Thes",

  "2 Thessalonians": "2 Thes", "2 Thess": "2 Thes", "2. Thess": "2 Thes", "2Thess": "2 Thes", "2.Thess": "2 Thes",
  "2 Thessalonicher": "2 Thes", "2. Thessalonicher": "2 Thes", "2Thessalonicher": "2 Thes", "2.Thessalonicher": "2 Thes",

  "1 Timothy": "1 Tim", "1 Timotheus": "1 Tim", "1. Timotheus": "1 Tim", "1Timotheus": "1 Tim", "1.Timotheus": "1 Tim",
  "1 Tim": "1 Tim", "1. Tim": "1 Tim", "1Tim": "1 Tim", "1.Tim": "1 Tim",

  "2 Timothy": "2 Tim", "2 Timotheus": "2 Tim", "2. Timotheus": "2 Tim", "2Timotheus": "2 Tim", "2.Timotheus": "2 Tim",
  "2 Tim": "2 Tim", "2. Tim": "2 Tim", "2Tim": "2 Tim", "2.Tim": "2 Tim",

  "Titus": "Titus",
  "Philemon": "Philem",

  "Hebrews": "Heb", "Hebräer": "Heb", "Hebr": "Heb",

  // ---- Catholic & General letters ----
  "James": "James", "Jakobus": "James", "Jak": "James",
  "1 Peter": "1 Pet", "1 Petrus": "1 Pet", "1. Petrus": "1 Pet", "1Petrus": "1 Pet", "1.Petrus": "1 Pet",
  "1 Pet": "1 Pet", "1. Pet": "1 Pet", "1. Petr": "1 Pet", "1.Petr": "1 Pet", "1Pet": "1 Pet", "1.Pet": "1 Pet",

  "2 Peter": "2 Pet", "2 Petrus": "2 Pet", "2. Petrus": "2 Pet", "2Petrus": "2 Pet", "2.Petrus": "2 Pet",
  "2 Pet": "2 Pet", "2. Pet": "2 Pet", "2. Petr": "2 Pet", "2.Petr": "2 Pet", "2Pet": "2 Pet", "2.Pet": "2 Pet",

  "1 John": "1 John", "1 Johannes": "1 John", "1. Johannes": "1 John", "1Johannes": "1 John", "1.Johannes": "1 John",
  "1 Joh": "1 John", "1. Joh": "1 John", "1Joh": "1 John", "1.Joh": "1 John",

  "2 John": "2 John", "2 Johannes": "2 John", "2. Johannes": "2 John", "2Johannes": "2 John", "2.Johannes": "2 John",
  "2 Joh": "2 John", "2. Joh": "2 John", "2Joh": "2 John", "2.Joh": "2 John",

  "3 John": "3 John", "3 Johannes": "3 John", "3. Johannes": "3 John", "3Johannes": "3 John", "3.Johannes": "3 John",
  "3 Joh": "3 John", "3. Joh": "3 John", "3Joh": "3 John", "3.Joh": "3 John",

  "Jude": "Jude", "Judas": "Jude",

  // ---- Revelation ----
  "Revelation": "Rev", "Offenbarung": "Rev", "Offb": "Rev", "Apokalypse": "Rev"
};


type BookMap = Record<string, string>;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Build locale-specific book map + alternation at runtime */
function buildBookContext(settings?: BibleToolsSettings) {
  let bookLocale: string | undefined;
  let custom: unknown;

  try { bookLocale = (settings as any)?.bookLocale as string | undefined; } catch {}
  try { custom = (settings as any)?.customBookMap; } catch {}

  let abbr: BookMap = BOOK_ABBR;

  if (bookLocale === "custom" && custom) {
    try {
      if (typeof custom === "string") {
        const parsed = JSON.parse(custom);
        if (parsed && typeof parsed === "object") abbr = parsed as BookMap;
      } else if (typeof custom === "object") {
        abbr = custom as BookMap;
      }
    } catch {
      abbr = BOOK_ABBR;
    }
  } else {
    abbr = BOOK_ABBR;
  }

  const allTokens = Array.from(new Set([...Object.keys(abbr), ...Object.values(abbr)])).sort(
    (a, b) => b.length - a.length
  );
  const BOOK_ALT = allTokens.map(escapeRe).join("|");

  const getBookAbbr = (book: string) => abbr[book] ?? book;

  const buildPatternBody = (): string => {
    const book = `(?:${BOOK_ALT})`;
    // const ref1 =
    //   `(?:(?:${book})\\.?\\s*` +
    //   `\\d+(?:-\\d+)?:\\d+[a-z]?(?:-\\d+)?[a-z]?` +
    //   `(?:\\s*,\\s*\\d+[a-z]?(?:-\\d+)?[a-z]?|\\s*;\\s*\\d+:\\d+[a-z]?(?:-\\d+)?[a-z]?)*` +
    //   `)`;
    const ref1 =
      `(?:(?:${book})?\\.?\\s*` +
      `\\d+(?:-\\d+)?:\\d+[a-z]?(?:-\\d+)?[a-z]?` +
      `(?:\\s*,\\s*\\d+[a-z]?(?:-\\d+)?[a-z]?|\\s*;\\s*\\d+:\\d+[a-z]?(?:-\\d+)?[a-z]?)*` +
      `)`;
    const ref2 = `(?:(${book})\\.?\\s+(\\d+)(?:-(\\d+))?)`;
    const REF = `(?<ref>${ref1}|${ref2})`;

    const VERSE =
      `(?<verse>` +
      `\\b[Vv]v?(?:\\.|erses?)\\s*` +
      `\\d+(?:-\\d+)?[a-z]?` +
      `(?:(?:,|,?\\s*and)\\s*\\d+(?:-\\d+)?[a-z]?)*` +
      `)`;

    const CHAPTER =
      `(?<chapter>` +
      `\\b[Cc]h(?:apters?|s?\\.)\\.?\\s*` +
      `\\d+(?:-\\d+)?` +
      `)`;

    const NOTE =
      `(?<note>` +
      `\\b[Nn]otes?` +
      `(?:\\s+\\d+(?:\\s+\\d+)?` +
      `(?:` +
      `(?:[,;]|,?\\s*and)\\s*\\d+(?:\\s+\\d+)?` +
      `(?:\\s+in\\s+${book}\\.?\\s+\\d+)?` +
      `)*` +
      `)` +
      `(?:\\s+in\\s+${book}\\.?\\s+\\d+)?` +
      `)`;

    const BOOK = `(?<book>\\b(?:${book})\\b)(?!\\.?\\s*\\d+)`;

    return `${REF}|${VERSE}|${CHAPTER}|${NOTE}|${BOOK}`;
  };

  const PATTERN_BODY = buildPatternBody();
  const PATTERN_G = new RegExp(PATTERN_BODY, "g");
  const PATTERN_HEAD = new RegExp("^" + PATTERN_BODY);

  return { abbr, allTokens, BOOK_ALT, getBookAbbr, PATTERN_G, PATTERN_HEAD };
}


/** ---------------- Utility: normalize book token to remove trailing period --------------- */
function normalizeBookToken(raw: string, ctx: ReturnType<typeof buildBookContext>): string {
  // Trim and drop a single trailing dot (e.g., "Rom." -> "Rom")
  const cleaned = raw.trim().replace(/\.$/, "");
  return ctx.getBookAbbr(cleaned);
}

/** -------------- Protected ranges (don’t touch while linking) -------------- */
type Range = [start: number, end: number];

function addRange(ranges: Range[], start: number, end: number) {
  if (start >= 0 && end > start) ranges.push([start, end]);
}

function findProtectedRanges(text: string): Range[] {
  const ranges: Range[] = [];

  // 1) Code fences ```...``` and ~~~...~~~
  const fenceRe = /(```|~~~)[^\n]*\n[\s\S]*?\1/g;
  for (let m; (m = fenceRe.exec(text)); ) addRange(ranges, m.index, m.index + m[0].length);

  // 2) Math blocks $$...$$
  const mathBlockRe = /\$\$[\s\S]*?\$\$/g;
  for (let m; (m = mathBlockRe.exec(text)); ) addRange(ranges, m.index, m.index + m[0].length);

  // 3) Inline code `...`
  const inlineCodeRe = /`[^`\n]*`/g;
  for (let m; (m = inlineCodeRe.exec(text)); ) addRange(ranges, m.index, m.index + m[0].length);

  // 4) Inline math $...$ (avoid $$)
  for (let i = 0; i < text.length; ) {
    if (text[i] === "$" && text[i + 1] !== "$") {
      const start = i;
      i++;
      while (i < text.length && text[i] !== "$") i++;
      if (i < text.length && text[i] === "$") {
        addRange(ranges, start, i + 1);
        i++;
        continue;
      }
    }
    i++;
  }

  // 5) Markdown links [text](url)
  const mdLinkRe = /\[[^\]]+?\]\([^)]+\)/g;
  for (let m; (m = mdLinkRe.exec(text)); ) addRange(ranges, m.index, m.index + m[0].length);

  // 6) Inline properties lines:  key:: value
  const inlinePropRe = /^[^\n:]{1,200}::.*$/gm;
  for (let m; (m = inlinePropRe.exec(text)); ) addRange(ranges, m.index, m.index + m[0].length);

  // 7) Obsidian links [[...]]
  const obsidianRe = /\[\[[^\]]*?\]\]/g;
  for (let m; (m = obsidianRe.exec(text)); ) addRange(ranges, m.index, m.index + m[0].length);

  // Merge overlaps & sort
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Range[] = [];
  for (const r of ranges) {
    if (!merged.length || r[0] > merged[merged.length - 1][1]) merged.push(r);
    else merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], r[1]);
  }
  return merged;
}

function inProtected(pos: number, ranges: Range[]): boolean {
  let lo = 0, hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [s, e] = ranges[mid];
    if (pos < s) hi = mid - 1;
    else if (pos >= e) lo = mid + 1;
    else return true;
  }
  return false;
}

function isWithinObsidianLink(text: string, start: number, end: number): boolean {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const openIdx = before.lastIndexOf("[[");
  const closeIdx = before.lastIndexOf("]]");
  if (openIdx > closeIdx) {
    const nextClose = after.indexOf("]]");
    if (nextClose !== -1) return true;
  }
  return false;
}

/** Parenthetical noise: skip if inside "(2019)"-like parentheses */
function isInsideNumericParens(text: string, start: number, end: number): boolean {
  const open = text.lastIndexOf("(", start);
  if (open === -1) return false;
  const close = text.indexOf(")", end);
  if (close === -1) return false;
  const inner = text.slice(open + 1, close).trim();
  if (/^\d{1,4}(?:[\/\.\-:]\d{1,2}(?:[\/\.\-:]\d{1,4})?)?$/.test(inner)) return true;
  if (/^p{1,2}\.\s*\d+(\s*-\s*\d+)?$/i.test(inner)) return true;
  return false;
}

/** ------------------- Markdown/Obsidian link cleanup (Python parity) ------------------- */
function removeMatchingMarkdownLinks(text: string, PATTERN_HEAD: RegExp): string {
  const mdLink = /(\*\*|__|\*)?\[([^\]]+)\]\([^)]+\)(\*\*|__|\*)?/g;
  return text.replace(mdLink, (_m, pre, disp, suf) => {
    const linkText = String(disp);
    if (PATTERN_HEAD.test(linkText)) return linkText;
    const simpleNum = /^\d+(?:[:-]\d+)?(?:-\d+)?$/.test(linkText);
    if (simpleNum) return linkText;
    return `${pre ?? ""}[${linkText}]${suf ?? ""}`;
  });
}

function removeMatchingObsidianLinks(text: string, PATTERN_HEAD: RegExp): string {
  const obs = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
  return text.replace(obs, (_m, _t, disp) => {
    const display = String(disp);
    if (PATTERN_HEAD.test(display)) return display;
    const simpleNum = /^\d+(?:[:-]\d+)?(?:-\d+)?$/.test(display);
    if (simpleNum) return display;
    return _m;
  });
}

function replaceOldObsidianLinks(text: string): string {
  const oldLink = /\[\[([0-9]?\s[A-Za-z ]+)\s(\d+)#\^(\d+)(?:\|([^\]]+))?\]\]/g;
  return text.replace(oldLink, (_m, bookShort, ch, verse, disp) => {
    const b = String(bookShort).trim();
    return disp
      ? `[[${b}#^${ch}-${verse}|${disp}]]`
      : `[[${b}#^${ch}-${verse}]]`;
  });
}

function findLastBookBefore(text: string, pos: number, ctx: ReturnType<typeof buildBookContext>): string | null {
  // Look back ~200 chars for a book token ending right before 'pos'
  const start = Math.max(0, pos - 200);
  const left = text.slice(start, pos);

  // Match ALL book tokens in the window; take the last one.
  const re = new RegExp(`(?:${ctx.BOOK_ALT})\\.?\\s*$|(?:${ctx.BOOK_ALT})\\.?\\s+`, "g");
  let m: RegExpExecArray | null;
  let last: string | null = null;

  while ((m = re.exec(left)) !== null) {
    last = m[0].trim();
  }
  if (!last) return null;

  // strip trailing punctuation/dot and normalize
  return normalizeBookToken(last.replace(/\s+$/, ""), ctx);
}

/** ------------ Version-aware link target ------------ */
function formatBookTarget(bookShort: string, versionShort?: string | null): string {
  if (!versionShort) return bookShort;
  return `${bookShort} (${versionShort})`;
}

/** ------------------------ Core linker ------------------------ */
function replaceVerseReferencesOfMainText(
  text: string,
  ctx: ReturnType<typeof buildBookContext>,
  opts: {
    removeObsidianLinks: boolean;
    rewriteOldLinks: boolean;
    stripMdLinksWhenVerseLike: boolean;
    versionShort?: string | null; // NEW
  }
): string {
  if (opts.stripMdLinksWhenVerseLike) text = removeMatchingMarkdownLinks(text, ctx.PATTERN_HEAD);
  if (opts.removeObsidianLinks) text = removeMatchingObsidianLinks(text, ctx.PATTERN_HEAD);
  if (opts.rewriteOldLinks) text = replaceOldObsidianLinks(text);

  const protectedRanges = findProtectedRanges(text);

  let current_book: string | null = null;
  let current_chapter: number | string | null = null;
  let current_verse: number | string | null = null;

  const out: string[] = [];
  let lastPos = 0;

  const targetOf = (bookShort: string) => formatBookTarget(bookShort, opts.versionShort);

  ctx.PATTERN_G.lastIndex = 0;
  for (let m: RegExpExecArray | null = ctx.PATTERN_G.exec(text); m; m = ctx.PATTERN_G.exec(text)) {
    const start = m.index;
    const end = start + m[0].length;

    if (
      inProtected(start, protectedRanges) ||
      inProtected(end - 1, protectedRanges) ||
      isWithinObsidianLink(text, start, end) ||
      isInsideNumericParens(text, start, end)
    ) {
      out.push(text.slice(lastPos, start), m[0]);
      lastPos = end;
      continue;
    }

    out.push(text.slice(lastPos, start));
    lastPos = end;

    const g = m.groups ?? {};

    // ---- book only
    if (g.book) {
      current_book = normalizeBookToken(g.book, ctx); // <-- strips trailing dot
      current_chapter = null;
      current_verse = null;
      out.push(m[0]);
      continue;
    }

    // ---- chapter (ch., chapter, chapters)
    if (g.chapter) {
      const chm = g.chapter.match(/(\d+)/);
      if (chm && current_book) {
        const ch = chm[1];
        current_chapter = ch;
        current_verse = null;
        out.push(`[[${targetOf(current_book)}#^${ch}|${m[0]}]]`);
      } else {
        out.push(m[0]);
      }
      continue;
    }

    // ---- verse (v., vv., verses)
    if (g.verse) {
      if (!current_book) {
        const inferred = findLastBookBefore(text, start, ctx);
        if (inferred) current_book = inferred;
        else {
          out.push(m[0]);
          continue;
        }
      }
      const verseText = m[0];
      const parts = verseText.split(/(\s+)/);
      const ch = current_chapter ? String(current_chapter) : "1";
      for (const part of parts) {
        const vm = part.match(/(\d+)/);
        if (vm && part.trim()) {
          out.push(`[[${targetOf(current_book)}#^${ch}-${vm[1]}|${part.trim()}]]`);
        } else {
          out.push(part);
        }
      }
      continue;
    }

    // ---- note(s)
    if (g.note) {
      const noteText = g.note as string;
      const parts = noteText.split(/\s+/);
      let bookSubstring = false;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const pm = part.match(/^(\d+)/);
        if (pm && !bookSubstring) {
          const verse = pm[1];
          if ((i + 1 < parts.length && !/^\d+/.test(parts[i + 1])) || i + 1 >= parts.length) {
            out.push(" " + part);
            continue;
          }
          for (let j = i + 1; j < parts.length; j++) {
            if (parts[j] === "in" && j + 1 < parts.length) {
              if (/^\d+$/.test(parts[j + 1]) && j + 2 < parts.length) {
                const book = parts[j + 1] + " " + parts[j + 2];
                current_chapter = parts[j + 3];
                current_book = normalizeBookToken(book, ctx); // <-- normalize
              } else {
                const book = parts[j + 1];
                current_chapter = parts[j + 2];
                current_book = normalizeBookToken(book, ctx); // <-- normalize
              }
            }
          }
          if (current_book && current_chapter) {
            out.push(` [[${targetOf(current_book)} ${current_chapter}#^${verse}|${part}]]`);
          } else {
            out.push(" " + part);
          }
        } else {
          out.push((i > 0 ? " " : "") + part);
        }
      }
      continue;
    }

    // ---- full reference
    if (g.ref) {
      const mm = (g.ref as string).match(/(\s*[\.,;]?)(.+)/);
      const leading = mm ? mm[1] : "";
      let refText = mm ? mm[2] : (g.ref as string);

      const bookStart = refText.match(new RegExp(`^((?:${ctx.BOOK_ALT})\\.?\\s+)`));
      let prefix: string | null = null;
      if (bookStart) {
        const bookPart = bookStart[0];
        prefix = bookPart; // for display text (can keep its dot)
        current_book = normalizeBookToken(bookPart.replace(/\s+$/, ""), ctx); // <-- normalize for target
        refText = refText.slice(bookPart.length);
      }
      if (!current_book) {
        // Fallback: infer book from left context (e.g., "… John 1:29; 12:24; …")
        const inferred = findLastBookBefore(text, start, ctx);
        if (inferred) {
          current_book = inferred;
        } else {
          out.push(m[0]);
          continue;
        }
      }

      const parts = refText.replace(/\./g, "").trim().split(/(;|,)/);
      const result: string[] = [];
      let verseString = false;
      current_chapter = null;
      let local_current_verse: number | null = null;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part === "," || part === ";") {
          result.push(part + " ");
          verseString = (part === ",");
          continue;
        }
        let p = part.trim();
        if (!p) continue;

        let chap: string | number | null = current_chapter;
        let v: string | number | null = null;
        let vEnd: number | null = null;

        if (p.includes(":")) {
          const [cStr, vStr] = p.split(":");
          chap = cStr;
          v = vStr;
        } else {
          if (verseString) v = p;
          else { chap = p; v = null; }
        }

        if (typeof chap !== "number") {
          const chs = String(chap ?? "").split("-");
          chap = parseInt(chs[0].replace(/[a-z]$/i, ""), 10);
        }

        if (v) {
          const vs = String(v).split("-");
          local_current_verse = parseInt(vs[0].replace(/[a-z]$/i, ""), 10);
          vEnd = vs.length > 1 ? parseInt(vs[1].replace(/[a-z]$/i, ""), 10) : null;
        } else {
          local_current_verse = null;
          vEnd = null;
        }

        const target = targetOf(current_book);

        if (vEnd) {
          const displayStart = p.replace(/\d+[a-z]?$/i, "");
          result.push(`[[${target}#^${chap}-${local_current_verse}|${prefix ? prefix : ""}${displayStart}]]`);
          result.push(`[[${target}#^${chap}-${vEnd}|${String(p).match(/(\d+[a-z]?)$/i)?.[1] ?? ""}]]`);
          local_current_verse = vEnd;
        } else {
          result.push(`[[${target}#^${chap}${local_current_verse ? `-${local_current_verse}` : ""}|${prefix ? prefix : ""}${p}]]`);
        }
        prefix = null;
        current_chapter = chap;
        current_verse = local_current_verse;
      }

      out.push(leading + result.join(""));
      continue;
    }

    out.push(m[0]);
  }

  out.push(text.slice(lastPos));
  return out.join("");
}

/** --------------------------- Public API --------------------------- */
export async function linkVersesInText(
  text: string,
  settings: BibleToolsSettings,
  versionShort?: string | null
): Promise<string> {
  const ctx = buildBookContext(settings);

  const removeObsidianDisplayLinks = (settings as any)?.removeObsidianDisplayLinks ?? true;
  const rewriteOldObsidianLinks = (settings as any)?.rewriteOldObsidianLinks ?? true;
  const stripMdLinksWhenVerseLike = (settings as any)?.stripMdLinksWhenVerseLike ?? true;

  return replaceVerseReferencesOfMainText(text, ctx, {
    removeObsidianLinks: removeObsidianDisplayLinks,
    rewriteOldLinks: rewriteOldObsidianLinks,
    stripMdLinksWhenVerseLike,
    versionShort: versionShort ?? null,
  });
}

/** ========================== Version Picker (Bolls) ========================== */

type BollsLanguage = {
  language: string;
  translations: { short_name: string; full_name: string; updated?: number; dir?: "rtl" | "ltr" }[];
};

async function fetchJson<T>(url: string): Promise<T> {
  const resp = await requestUrl({ url, method: "GET" });
  if (resp.status < 200 || resp.status >= 300) {
    throw new Error(`${resp.status}`);
  }
  const text = resp.text ?? "";
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON from ${url}`);
  }
}

async function loadBollsCatalogue(): Promise<BollsLanguage[]> {
  const URL = "https://bolls.life/static/bolls/app/views/languages.json";
  return await fetchJson<BollsLanguage[]>(URL);
}

// class PickVersionModal extends Modal {
//   private langs: BollsLanguage[] = [];
//   private onPick: (verShort: string | null) => void;
//   private chosenLangIdx = 0;
//   private chosenVerIdx = 0;

//   constructor(app: App, langs: BollsLanguage[], onPick: (verShort: string | null) => void) {
//     super(app);
//     this.langs = langs;
//     this.onPick = onPick;
//   }

//   onOpen() {
//     const { contentEl } = this;
//     contentEl.empty();
//     contentEl.createEl("h3", { text: "Link verses: choose Bible version (optional)" });

//     let langSel: HTMLSelectElement;
//     let verSel: HTMLSelectElement;

//     new Setting(contentEl)
//       .setName("Language")
//       .addDropdown((d) => {
//         langSel = d.selectEl;
//         this.langs.forEach((l, idx) => d.addOption(String(idx), l.language));
//         d.setValue(String(this.chosenLangIdx));
//         d.onChange((v) => {
//           this.chosenLangIdx = parseInt(v, 10);
//           // rebuild versions
//           verSel!.empty();
//           const trans = this.langs[this.chosenLangIdx].translations;
//           trans.forEach((t, i) => {
//             const label = `${t.full_name} (${t.short_name})`;
//             const opt = document.createElement("option");
//             opt.value = String(i);
//             opt.text = label;
//             verSel!.appendChild(opt);
//           });
//           this.chosenVerIdx = 0;
//           verSel!.value = "0";
//         });
//       });

//     new Setting(contentEl)
//       .setName("Translation")
//       .addDropdown((d) => {
//         verSel = d.selectEl;
//         const trans = this.langs[this.chosenLangIdx]?.translations ?? [];
//         trans.forEach((t, i) => {
//           d.addOption(String(i), `${t.full_name} (${t.short_name})`);
//         });
//         d.setValue("0");
//         d.onChange((v) => (this.chosenVerIdx = parseInt(v, 10)));
//       });

//     new Setting(contentEl)
//       .setName("How to link")
//       .setDesc("If you cancel, links will use default (no version).")
//       .addButton((b) =>
//         b.setButtonText("Use selected version").setCta().onClick(() => {
//           const ver = this.langs[this.chosenLangIdx].translations[this.chosenVerIdx];
//           this.close();
//           this.onPick(ver?.short_name ?? null);
//         })
//       )
//       .addExtraButton((b) =>
//         b.setIcon("x").setTooltip("Cancel (no version)").onClick(() => {
//           this.close();
//           this.onPick(null);
//         })
//       );
//   }
// }


/** ========================== Commands ========================== */

export async function commandVerseLinks(app: App, settings: BibleToolsSettings, params?: Record<string, string>) {
  const scope = params?.scope ?? "current";

  const file = app.workspace.getActiveFile();
  if (scope === "folder") {
    const active = file;
    const folder = active?.parent;
    if (!active || !folder) {
      new Notice("Open a file inside the target folder.");
      return;
    }

    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === "md") {
        const content = await app.vault.read(child);
        const { yaml, body } = splitFrontmatter(content);
        const linked = await linkVersesInText(body, settings, null); // default: no version
        await app.vault.modify(child, (yaml ?? "") + linked);
      }
    }
    new Notice("Linked verses in folder.");
    return;
  }

  if (!file) {
    new Notice("Open a file first.");
    return;
  }

  const content = await app.vault.read(file);
  const { yaml, body } = splitFrontmatter(content);
  const linked = await linkVersesInText(body, settings, null); // default: no version
  await app.vault.modify(file, (yaml ?? "") + linked);
  new Notice("Linked verses in current file.");
}

export async function commandVerseLinksSelectionOrLine(app: App, settings: BibleToolsSettings) {
  const mdView = app.workspace.getActiveViewOfType(MarkdownView);
  if (!mdView) {
    new Notice("Open a Markdown file first.");
    return;
  }

  const editor = mdView.editor;
  const selectionText = editor.getSelection();

  const run = async (text: string) => {
    const linked = await linkVersesInText(text, settings, null); // default: no version
    return linked;
  };

  if (selectionText && selectionText.length > 0) {
    const linked = await run(selectionText);
    if (linked !== selectionText) {
      editor.replaceSelection(linked);
      new Notice("Linked verses in selection.");
    } else {
      new Notice("No linkable verses in selection.");
    }
    return;
  }

  const line = editor.getCursor().line;
  const lineText = editor.getLine(line);
  const linked = await run(lineText);
  if (linked !== lineText) {
    editor.setLine(line, linked);
    new Notice("Linked verses on current line.");
  } else {
    new Notice("No linkable verses on current line.");
  }
}

/**
 * NEW: Same as above, but asks user to choose a version (if catalogue loads).
 * If user cancels / fails to load, falls back to no-version.
 */
export async function commandVerseLinksChooseVersion(app: App, settings: BibleToolsSettings) {
  const file = app.workspace.getActiveFile();
  if (!file) {
    new Notice("Open a file first.");
    return;
  }

  return await new Promise<string>((resolve) => {
    new PickVersionModal(app, settings, async (versionShort) => {
      const content = await app.vault.read(file);
      const { yaml, body } = splitFrontmatter(content);
      const linked = await linkVersesInText(body, settings, versionShort);
      await app.vault.modify(file, (yaml ?? "") + linked);
      new Notice(versionShort ? `Linked verses (→ ${versionShort}).` : "Linked verses (no version).");
      resolve(linked);
    }).open();
  });
}

export async function commandVerseLinksSelectionOrLineChooseVersion(app: App, settings: BibleToolsSettings) {
  const mdView = app.workspace.getActiveViewOfType(MarkdownView);
  if (!mdView) {
    new Notice("Open a Markdown file first.");
    return;
  }
  return await new Promise<string>((resolve) => {
    new PickVersionModal(app, settings, async (versionShort) => {
      const editor = mdView.editor;
      const selectionText = editor.getSelection();

      const run = async (text: string) => {
        const linked = await linkVersesInText(text, settings, versionShort);
        return linked;
      };

      if (selectionText && selectionText.length > 0) {
        const linked = await run(selectionText);
        if (linked !== selectionText) {
          editor.replaceSelection(linked);
          new Notice(
            versionShort ? `Linked (selection) → ${versionShort}.` : "Linked (selection) without version."
          );
        } else {
          new Notice("No linkable verses in selection.");
        }
        return;
      }

      const line = editor.getCursor().line;
      const lineText = editor.getLine(line);
      const linked = await run(lineText);
      if (linked !== lineText) {
        editor.setLine(line, linked);
        new Notice(versionShort ? `Linked (line) → ${versionShort}.` : "Linked (line) without version.");
      } else {
        new Notice("No linkable verses on current line.");
      }
      resolve(linked);
    }).open();
  });
}

// import { App, MarkdownView, Notice, TFile } from "obsidian";
// import { BibleToolsSettings } from "../settings";
// import { splitFrontmatter } from "../lib/mdUtils";

// /** ---------------------------
//  *  BOOK MAP (default, English)
//  *  --------------------------- */

// const BOOK_ABBR: Record<string, string> = {
//   "Genesis": "Gen",
//   "Exodus": "Exo",
//   "Leviticus": "Lev",
//   "Numbers": "Num",
//   "Deuteronomy": "Deut",
//   "Joshua": "Josh",
//   "Judges": "Judg",
//   "Ruth": "Ruth",
//   "1 Samuel": "1 Sam",
//   "First Samuel": "1 Sam",
//   "2 Samuel": "2 Sam",
//   "Second Samuel": "2 Sam",
//   "1 Kings": "1 Kings",
//   "First Kings": "1 Kings",
//   "2 Kings": "2 Kings",
//   "Second Kings": "2 Kings",
//   "1 Chronicles": "1 Chron",
//   "First Chronicles": "1 Chron",
//   "2 Chronicles": "2 Chron",
//   "Second Chronicles": "2 Chron",
//   "Ezra": "Ezra",
//   "Nehemiah": "Neh",
//   "Esther": "Esth",
//   "Job": "Job",
//   "Psalms": "Psa",
//   "Psalm": "Psa",
//   "Proverbs": "Prov",
//   "Ecclesiastes": "Eccl",
//   "Song of Solomon": "SoS",
//   "Song of Songs": "SoS",
//   "S.S": "SoS",
//   "S.S.": "SoS",
//   "S. S.": "SoS",
//   "S. S": "SoS",
//   "SS": "SoS",
//   "Isaiah": "Isa",
//   "Jeremiah": "Jer",
//   "Lamentations": "Lam",
//   "Ezekiel": "Ezek",
//   "Daniel": "Dan",
//   "Hosea": "Hosea",
//   "Joel": "Joel",
//   "Amos": "Amos",
//   "Obadiah": "Obad",
//   "Jonah": "Jonah",
//   "Micah": "Micah",
//   "Nahum": "Nah",
//   "Habakkuk": "Hab",
//   "Zephaniah": "Zep",
//   "Haggai": "Hag",
//   "Zechariah": "Zech",
//   "Malachi": "Mal",
//   "Matthew": "Matt",
//   "Mark": "Mark",
//   "Luke": "Luke",
//   "John": "John",
//   "Acts": "Acts",
//   "Romans": "Rom",
//   "1 Corinthians": "1 Cor",
//   "First Corinthians": "1 Cor",
//   "2 Corinthians": "2 Cor",
//   "Second Corinthians": "2 Cor",
//   "Galatians": "Gal",
//   "Ephesians": "Eph",
//   "Philippians": "Phil",
//   "Colossians": "Col",
//   "1 Thessalonians": "1 Thes",
//   "First Thessalonians": "1 Thes",
//   "2 Thessalonians": "2 Thes",
//   "Second Thessalonians": "2 Thes",
//   "1 Timothy": "1 Tim",
//   "First Timothy": "1 Tim",
//   "2 Timothy": "2 Tim",
//   "Second Timothy": "2 Tim",
//   "Titus": "Titus",
//   "Philemon": "Philem",
//   "Hebrews": "Heb",
//   "James": "James",
//   "1 Peter": "1 Pet",
//   "First Peter": "1 Pet",
//   "2 Peter": "2 Pet",
//   "Second Peter": "2 Pet",
//   "1 John": "1 John",
//   "First John": "1 John",
//   "2 John": "2 John",
//   "Second John": "2 John",
//   "3 John": "3 John",
//   "Third John": "3 John",
//   "Jude": "Jude",
//   "Revelation": "Rev"
// };

// type BookMap = Record<string, string>;
// const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// /** Build locale-specific book map + alternation at runtime */
// function buildBookContext(settings?: BibleToolsSettings) {
//   let bookLocale: string | undefined;
//   let custom: unknown;

//   try { bookLocale = (settings as any)?.bookLocale as string | undefined; } catch {}
//   try { custom = (settings as any)?.customBookMap; } catch {}

//   let abbr: BookMap = BOOK_ABBR;

//   if (bookLocale === "custom" && custom) {
//     try {
//       if (typeof custom === "string") {
//         const parsed = JSON.parse(custom);
//         if (parsed && typeof parsed === "object") abbr = parsed as BookMap;
//       } else if (typeof custom === "object") {
//         abbr = custom as BookMap;
//       }
//     } catch {
//       abbr = BOOK_ABBR;
//     }
//   } else {
//     abbr = BOOK_ABBR;
//   }

//   const allTokens = Array.from(new Set([...Object.keys(abbr), ...Object.values(abbr)])).sort(
//     (a, b) => b.length - a.length
//   );
//   const BOOK_ALT = allTokens.map(escapeRe).join("|");

//   const getBookAbbr = (book: string) => abbr[book] ?? book;

//   const buildPatternBody = (): string => {
//     const book = `(?:${BOOK_ALT})`;
//     // const ref1 =
//     //   `(?:(?:${book})\\.?\\s*` +
//     //   `\\d+(?:-\\d+)?:\\d+[a-z]?(?:-\\d+)?[a-z]?` +
//     //   `(?:\\s*,\\s*\\d+[a-z]?(?:-\\d+)?[a-z]?|\\s*;\\s*\\d+:\\d+[a-z]?(?:-\\d+)?[a-z]?)*` +
//     //   `)`;
//     const ref1 =
//       `(?:(?:${book})?\\.?\\s*` +
//       `\\d+(?:-\\d+)?:\\d+[a-z]?(?:-\\d+)?[a-z]?` +
//       `(?:\\s*,\\s*\\d+[a-z]?(?:-\\d+)?[a-z]?|\\s*;\\s*\\d+:\\d+[a-z]?(?:-\\d+)?[a-z]?)*` +
//       `)`;
//     const ref2 = `(?:(${book})\\.?\\s+(\\d+)(?:-(\\d+))?)`;
//     const REF = `(?<ref>${ref1}|${ref2})`;

//     const VERSE =
//       `(?<verse>` +
//       `\\b[Vv]v?(?:\\.|erses?)\\s*` +
//       `\\d+(?:-\\d+)?[a-z]?` +
//       `(?:(?:,|,?\\s*and)\\s*\\d+(?:-\\d+)?[a-z]?)*` +
//       `)`;

//     const CHAPTER =
//       `(?<chapter>` +
//       `\\b[Cc]h(?:apters?|s?\\.)\\.?\\s*` +
//       `\\d+(?:-\\d+)?` +
//       `)`;

//     const NOTE =
//       `(?<note>` +
//       `\\b[Nn]otes?` +
//       `(?:\\s+\\d+(?:\\s+\\d+)?` +
//       `(?:` +
//       `(?:[,;]|,?\\s*and)\\s*\\d+(?:\\s+\\d+)?` +
//       `(?:\\s+in\\s+${book}\\.?\\s+\\d+)?` +
//       `)*` +
//       `)` +
//       `(?:\\s+in\\s+${book}\\.?\\s+\\d+)?` +
//       `)`;

//     const BOOK = `(?<book>\\b(?:${book})\\b)(?!\\.?\\s*\\d+)`;

//     return `${REF}|${VERSE}|${CHAPTER}|${NOTE}|${BOOK}`;
//   };

//   const PATTERN_BODY = buildPatternBody();
//   const PATTERN_G = new RegExp(PATTERN_BODY, "g");
//   const PATTERN_HEAD = new RegExp("^" + PATTERN_BODY);

//   return { abbr, allTokens, BOOK_ALT, getBookAbbr, PATTERN_G, PATTERN_HEAD };
// }

// /** ---------------- Utility: normalize book token to remove trailing period --------------- */
// function normalizeBookToken(raw: string, ctx: ReturnType<typeof buildBookContext>): string {
//   // Trim and drop a single trailing dot (e.g., "Rom." -> "Rom")
//   const cleaned = raw.trim().replace(/\.$/, "");
//   return ctx.getBookAbbr(cleaned);
// }

// /** -------------- Protected ranges (don’t touch while linking) -------------- */
// type Range = [start: number, end: number];

// function addRange(ranges: Range[], start: number, end: number) {
//   if (start >= 0 && end > start) ranges.push([start, end]);
// }

// function findProtectedRanges(text: string): Range[] {
//   const ranges: Range[] = [];

//   // 1) Code fences ```...``` and ~~~...~~~
//   const fenceRe = /(```|~~~)[^\n]*\n[\s\S]*?\1/g;
//   for (let m; (m = fenceRe.exec(text)); ) addRange(ranges, m.index, m.index + m[0].length);

//   // 2) Math blocks $$...$$
//   const mathBlockRe = /\$\$[\s\S]*?\$\$/g;
//   for (let m; (m = mathBlockRe.exec(text)); ) addRange(ranges, m.index, m.index + m[0].length);

//   // 3) Inline code `...`
//   const inlineCodeRe = /`[^`\n]*`/g;
//   for (let m; (m = inlineCodeRe.exec(text)); ) addRange(ranges, m.index, m.index + m[0].length);

//   // 4) Inline math $...$ (avoid $$)
//   for (let i = 0; i < text.length; ) {
//     if (text[i] === "$" && text[i + 1] !== "$") {
//       const start = i;
//       i++;
//       while (i < text.length && text[i] !== "$") i++;
//       if (i < text.length && text[i] === "$") {
//         addRange(ranges, start, i + 1);
//         i++;
//         continue;
//       }
//     }
//     i++;
//   }

//   // 5) Markdown links [text](url)
//   const mdLinkRe = /\[[^\]]+?\]\([^)]+\)/g;
//   for (let m; (m = mdLinkRe.exec(text)); ) addRange(ranges, m.index, m.index + m[0].length);

//   // 6) Inline properties lines:  key:: value
//   const inlinePropRe = /^[^\n:]{1,200}::.*$/gm;
//   for (let m; (m = inlinePropRe.exec(text)); ) addRange(ranges, m.index, m.index + m[0].length);

//   // 7) Obsidian links [[...]]
//   const obsidianRe = /\[\[[^\]]*?\]\]/g;
//   for (let m; (m = obsidianRe.exec(text)); ) addRange(ranges, m.index, m.index + m[0].length);

//   // Merge overlaps & sort
//   ranges.sort((a, b) => a[0] - b[0]);
//   const merged: Range[] = [];
//   for (const r of ranges) {
//     if (!merged.length || r[0] > merged[merged.length - 1][1]) merged.push(r);
//     else merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], r[1]);
//   }
//   return merged;
// }

// function inProtected(pos: number, ranges: Range[]): boolean {
//   let lo = 0, hi = ranges.length - 1;
//   while (lo <= hi) {
//     const mid = (lo + hi) >> 1;
//     const [s, e] = ranges[mid];
//     if (pos < s) hi = mid - 1;
//     else if (pos >= e) lo = mid + 1;
//     else return true;
//   }
//   return false;
// }

// function isWithinObsidianLink(text: string, start: number, end: number): boolean {
//   const before = text.slice(0, start);
//   const after = text.slice(end);
//   const openIdx = before.lastIndexOf("[[");
//   const closeIdx = before.lastIndexOf("]]");
//   if (openIdx > closeIdx) {
//     const nextClose = after.indexOf("]]");
//     if (nextClose !== -1) return true;
//   }
//   return false;
// }

// /** Parenthetical noise: skip if inside "(2019)"-like parentheses */
// function isInsideNumericParens(text: string, start: number, end: number): boolean {
//   const open = text.lastIndexOf("(", start);
//   if (open === -1) return false;
//   const close = text.indexOf(")", end);
//   if (close === -1) return false;
//   const inner = text.slice(open + 1, close).trim();
//   if (/^\d{1,4}(?:[\/\.\-:]\d{1,2}(?:[\/\.\-:]\d{1,4})?)?$/.test(inner)) return true;
//   if (/^p{1,2}\.\s*\d+(\s*-\s*\d+)?$/i.test(inner)) return true;
//   return false;
// }

// /** ------------------- Markdown/Obsidian link cleanup (Python parity) ------------------- */
// function removeMatchingMarkdownLinks(text: string, PATTERN_HEAD: RegExp): string {
//   const mdLink = /(\*\*|__|\*)?\[([^\]]+)\]\([^)]+\)(\*\*|__|\*)?/g;
//   return text.replace(mdLink, (_m, pre, disp, suf) => {
//     const linkText = String(disp);
//     if (PATTERN_HEAD.test(linkText)) return linkText;
//     const simpleNum = /^\d+(?:[:-]\d+)?(?:-\d+)?$/.test(linkText);
//     if (simpleNum) return linkText;
//     return `${pre ?? ""}[${linkText}]${suf ?? ""}`;
//   });
// }

// function removeMatchingObsidianLinks(text: string, PATTERN_HEAD: RegExp): string {
//   const obs = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
//   return text.replace(obs, (_m, _t, disp) => {
//     const display = String(disp);
//     if (PATTERN_HEAD.test(display)) return display;
//     const simpleNum = /^\d+(?:[:-]\d+)?(?:-\d+)?$/.test(display);
//     if (simpleNum) return display;
//     return _m;
//   });
// }

// function replaceOldObsidianLinks(text: string): string {
//   const oldLink = /\[\[([0-9]?\s[A-Za-z ]+)\s(\d+)#\^(\d+)(?:\|([^\]]+))?\]\]/g;
//   return text.replace(oldLink, (_m, bookShort, ch, verse, disp) => {
//     const b = String(bookShort).trim();
//     return disp
//       ? `[[${b}#^${ch}-${verse}|${disp}]]`
//       : `[[${b}#^${ch}-${verse}]]`;
//   });
// }

// function findLastBookBefore(text: string, pos: number, ctx: ReturnType<typeof buildBookContext>): string | null {
//   // Look back ~200 chars for a book token ending right before 'pos'
//   const start = Math.max(0, pos - 200);
//   const left = text.slice(start, pos);

//   // Match ALL book tokens in the window; take the last one.
//   const re = new RegExp(`(?:${ctx.BOOK_ALT})\\.?\\s*$|(?:${ctx.BOOK_ALT})\\.?\\s+`, "g");
//   let m: RegExpExecArray | null;
//   let last: string | null = null;

//   while ((m = re.exec(left)) !== null) {
//     last = m[0].trim();
//   }
//   if (!last) return null;

//   // strip trailing punctuation/dot and normalize
//   return normalizeBookToken(last.replace(/\s+$/, ""), ctx);
// }

// /** ------------------------ Core linker (Python 1:1 + protections) ------------------------ */
// function replaceVerseReferencesOfMainText(
//   text: string,
//   ctx: ReturnType<typeof buildBookContext>,
//   opts: { removeObsidianLinks: boolean; rewriteOldLinks: boolean, stripMdLinksWhenVerseLike: boolean }
// ): string {
//   // Order matches Python: strip MD links → (optional) strip [[...|...]] → rewrite old links
//   if (opts.stripMdLinksWhenVerseLike) text = removeMatchingMarkdownLinks(text, ctx.PATTERN_HEAD);
//   if (opts.removeObsidianLinks) text = removeMatchingObsidianLinks(text, ctx.PATTERN_HEAD);
//   if (opts.rewriteOldLinks) text = replaceOldObsidianLinks(text);

//   const protectedRanges = findProtectedRanges(text);

//   let current_book: string | null = null;
//   let current_chapter: number | string | null = null;
//   let current_verse: number | string | null = null;

//   const out: string[] = [];
//   let lastPos = 0;

//   ctx.PATTERN_G.lastIndex = 0;
//   for (let m: RegExpExecArray | null = ctx.PATTERN_G.exec(text); m; m = ctx.PATTERN_G.exec(text)) {
//     const start = m.index;
//     const end = start + m[0].length;

//     if (inProtected(start, protectedRanges) || inProtected(end - 1, protectedRanges) ||
//         isWithinObsidianLink(text, start, end) || isInsideNumericParens(text, start, end)) {
//       out.push(text.slice(lastPos, start), m[0]);
//       lastPos = end;
//       continue;
//     }

//     out.push(text.slice(lastPos, start));
//     lastPos = end;

//     const g = m.groups ?? {};

//     // ---- book only
//     if (g.book) {
//       current_book = normalizeBookToken(g.book, ctx); // <-- strips trailing dot
//       current_chapter = null;
//       current_verse = null;
//       out.push(m[0]);
//       continue;
//     }

//     // ---- chapter (ch., chapter, chapters)
//     if (g.chapter) {
//       const chm = g.chapter.match(/(\d+)/);
//       if (chm && current_book) {
//         const ch = chm[1];
//         current_chapter = ch;
//         current_verse = null;
//         out.push(`[[${current_book}#^${ch}|${m[0]}]]`);
//       } else {
//         out.push(m[0]);
//       }
//       continue;
//     }

//     // ---- verse (v., vv., verses)
//     if (g.verse) {
//       if (!current_book) {
//         const inferred = findLastBookBefore(text, start, ctx);
//         if (inferred) {
//           current_book = inferred;
//         } else {
//           out.push(m[0]);
//           continue;
//         }
//       }
//       const verseText = m[0];
//       const parts = verseText.split(/(\s+)/);
//       const ch = current_chapter ? String(current_chapter) : "1";
//       for (const part of parts) {
//         const vm = part.match(/(\d+)/);
//         if (vm && part.trim()) {
//           out.push(`[[${current_book}#^${ch}-${vm[1]}|${part.trim()}]]`);
//         } else {
//           out.push(part);
//         }
//       }
//       continue;
//     }

//     // ---- note(s)
//     if (g.note) {
//       const noteText = g.note as string;
//       const parts = noteText.split(/\s+/);
//       let bookSubstring = false;
//       for (let i = 0; i < parts.length; i++) {
//         const part = parts[i];
//         const pm = part.match(/^(\d+)/);
//         if (pm && !bookSubstring) {
//           const verse = pm[1];
//           if ((i + 1 < parts.length && !/^\d+/.test(parts[i + 1])) || i + 1 >= parts.length) {
//             out.push(" " + part);
//             continue;
//           }
//           for (let j = i + 1; j < parts.length; j++) {
//             if (parts[j] === "in" && j + 1 < parts.length) {
//               if (/^\d+$/.test(parts[j + 1]) && j + 2 < parts.length) {
//                 const book = parts[j + 1] + " " + parts[j + 2];
//                 current_chapter = parts[j + 3];
//                 current_book = normalizeBookToken(book, ctx); // <-- normalize
//               } else {
//                 const book = parts[j + 1];
//                 current_chapter = parts[j + 2];
//                 current_book = normalizeBookToken(book, ctx); // <-- normalize
//               }
//             }
//           }
//           if (current_book && current_chapter) {
//             out.push(` [[${current_book} ${current_chapter}#^${verse}|${part}]]`);
//           } else {
//             out.push(" " + part);
//           }
//         } else {
//           out.push((i > 0 ? " " : "") + part);
//         }
//       }
//       continue;
//     }

//     // ---- full reference
//     if (g.ref) {
//       const mm = (g.ref as string).match(/(\s*[\.,;]?)(.+)/);
//       const leading = mm ? mm[1] : "";
//       let refText = mm ? mm[2] : (g.ref as string);

//       const bookStart = refText.match(new RegExp(`^((?:${ctx.BOOK_ALT})\\.?\\s+)`));
//       let prefix: string | null = null;
//       if (bookStart) {
//         const bookPart = bookStart[0];
//         prefix = bookPart; // for display text (can keep its dot)
//         current_book = normalizeBookToken(bookPart.replace(/\s+$/, ""), ctx); // <-- normalize for target
//         refText = refText.slice(bookPart.length);
//       }
//       if (!current_book) {
//         // Fallback: infer book from left context (e.g., "… John 1:29; 12:24; …")
//         const inferred = findLastBookBefore(text, start, ctx);
//         if (inferred) {
//           current_book = inferred;
//         } else {
//           out.push(m[0]);
//           continue;
//         }
//       }

//       const parts = refText.replace(/\./g, "").trim().split(/(;|,)/);
//       const result: string[] = [];
//       let verseString = false;
//       current_chapter = null;
//       let local_current_verse: number | null = null;

//       for (let i = 0; i < parts.length; i++) {
//         const part = parts[i];
//         if (part === "," || part === ";") {
//           result.push(part + " ");
//           verseString = (part === ",");
//           continue;
//         }
//         let p = part.trim();
//         if (!p) continue;

//         let chap: string | number | null = current_chapter;
//         let v: string | number | null = null;
//         let vEnd: number | null = null;

//         if (p.includes(":")) {
//           const [cStr, vStr] = p.split(":");
//           chap = cStr;
//           v = vStr;
//         } else {
//           if (verseString) v = p;
//           else { chap = p; v = null; }
//         }

//         if (typeof chap !== "number") {
//           const chs = String(chap ?? "").split("-");
//           chap = parseInt(chs[0].replace(/[a-z]$/i, ""), 10);
//         }

//         if (v) {
//           const vs = String(v).split("-");
//           local_current_verse = parseInt(vs[0].replace(/[a-z]$/i, ""), 10);
//           vEnd = vs.length > 1 ? parseInt(vs[1].replace(/[a-z]$/i, ""), 10) : null;
//         } else {
//           local_current_verse = null;
//           vEnd = null;
//         }

//         if (vEnd) {
//           const displayStart = p.replace(/\d+[a-z]?$/i, "");
//           result.push(`[[${current_book}#^${chap}-${local_current_verse}|${prefix ? prefix : ""}${displayStart}]]`);
//           result.push(`[[${current_book}#^${chap}-${vEnd}|${String(p).match(/(\d+[a-z]?)$/i)?.[1] ?? ""}]]`);
//           local_current_verse = vEnd;
//         } else {
//           result.push(`[[${current_book}#^${chap}${local_current_verse ? `-${local_current_verse}` : ""}|${prefix ? prefix : ""}${p}]]`);
//         }
//         prefix = null;
//         current_chapter = chap;
//         current_verse = local_current_verse;
//       }

//       out.push(leading + result.join(""));
//       continue;
//     }

//     out.push(m[0]);
//   }

//   out.push(text.slice(lastPos));
//   return out.join("");
// }


// /** --------------------------- Public API used by command --------------------------- */
// export async function linkVersesInText(text: string, settings: BibleToolsSettings): Promise<string> {
//   const ctx = buildBookContext(settings);

//   // Settings toggles (optional; default to Python behavior)
//   const removeObsidianDisplayLinks =
//     (settings as any)?.removeObsidianDisplayLinks ?? true;
//   const rewriteOldObsidianLinks =
//     (settings as any)?.rewriteOldObsidianLinks ?? true;
//   const stripMdLinksWhenVerseLike =
//     (settings as any)?.stripMdLinksWhenVerseLike ?? true;

//   return replaceVerseReferencesOfMainText(text, ctx, {
//     removeObsidianLinks: removeObsidianDisplayLinks,
//     rewriteOldLinks: rewriteOldObsidianLinks,
//     stripMdLinksWhenVerseLike: stripMdLinksWhenVerseLike
//   });
// }

// export async function commandVerseLinks(app: App, settings: BibleToolsSettings, params?: Record<string, string>) {
//   const scope = params?.scope ?? "current";

//   if (scope === "folder") {
//     const active = app.workspace.getActiveFile();
//     const folder = active?.parent;
//     if (!active || !folder) { new Notice("Open a file inside the target folder."); return; }

//     for (const child of folder.children) {
//       if (child instanceof TFile && child.extension === "md") {
//         const content = await app.vault.read(child);
//         const { yaml, body } = splitFrontmatter(content);
//         const linked = await linkVersesInText(body, settings);
//         await app.vault.modify(child, (yaml ?? "") + linked);
//       }
//     }
//     new Notice("Linked verses in folder.");
//     return;
//   }

//   const file = app.workspace.getActiveFile();
//   if (!file) { new Notice("Open a file first."); return; }

//   const content = await app.vault.read(file);
//   const { yaml, body } = splitFrontmatter(content);
//   const linked = await linkVersesInText(body, settings);
//   await app.vault.modify(file, (yaml ?? "") + linked);
//   new Notice("Linked verses in current file.");
// }

// export async function commandVerseLinksSelectionOrLine(app: App, settings: BibleToolsSettings) {
//   const mdView = app.workspace.getActiveViewOfType(MarkdownView);
//   if (!mdView) { new Notice("Open a Markdown file first."); return; }

//   const editor = mdView.editor;

//   // If user selected text, process that; otherwise process the current line
//   const selectionText = editor.getSelection();
//   if (selectionText && selectionText.length > 0) {
//     const linked = await linkVersesInText(selectionText, settings);
//     if (linked !== selectionText) {
//       editor.replaceSelection(linked);
//       new Notice("Linked verses in selection.");
//     } else {
//       new Notice("No linkable verses in selection.");
//     }
//     return;
//   }

//   // No selection → process current line
//   const line = editor.getCursor().line;
//   const lineText = editor.getLine(line);
//   const linked = await linkVersesInText(lineText, settings);
//   if (linked !== lineText) {
//     editor.setLine(line, linked);
//     new Notice("Linked verses on current line.");
//   } else {
//     new Notice("No linkable verses on current line.");
//   }
// }