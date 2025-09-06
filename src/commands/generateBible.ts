import { App, Modal, Notice, Setting, TFile, TFolder, normalizePath, requestUrl } from "obsidian";
import { BibleToolsSettings } from "../settings";
import { BOOK_ABBR } from "../lib/verseMap";
import { BuildBibleModal } from "src/ui/build-bible-modal";

// ---------- Types ----------
type LanguagesEntry = {
  language: string; // e.g. "English"
  translations: Array<{
    short_name: string; // e.g. "KJV"
    full_name: string;  // e.g. "King James Version ..."
    updated?: number;
    dir?: "rtl" | "ltr";
  }>;
};

type BollsBookMeta = {
  bookid: number;
  chronorder: number;
  name: string;
  chapters: number;
};

type BollsVerse = {
  pk: number;
  verse: number;
  text: string;   // HTML
  comment?: string;
};

const BOLLS = {
  LANGUAGES_URL: "https://bolls.life/static/bolls/app/views/languages.json",
  GET_BOOKS: (tr: string) => `https://bolls.life/get-books/${encodeURIComponent(tr)}/`,
  GET_CHAPTER: (tr: string, bookId: number, ch: number) =>
    `https://bolls.life/get-text/${encodeURIComponent(tr)}/${bookId}/${ch}/`,
};

// Canonical book name by ID (66-book Protestant baseline)
const CANON_EN_BY_ID: Record<number, string> = {
  1:"Genesis",2:"Exodus",3:"Leviticus",4:"Numbers",5:"Deuteronomy",
  6:"Joshua",7:"Judges",8:"Ruth",9:"1 Samuel",10:"2 Samuel",
  11:"1 Kings",12:"2 Kings",13:"1 Chronicles",14:"2 Chronicles",15:"Ezra",
  16:"Nehemiah",17:"Esther",18:"Job",19:"Psalms",20:"Proverbs",
  21:"Ecclesiastes",22:"Song of Songs",23:"Isaiah",24:"Jeremiah",25:"Lamentations",
  26:"Ezekiel",27:"Daniel",28:"Hosea",29:"Joel",30:"Amos",
  31:"Obadiah",32:"Jonah",33:"Micah",34:"Nahum",35:"Habakkuk",
  36:"Zephaniah",37:"Haggai",38:"Zechariah",39:"Malachi",
  40:"Matthew",41:"Mark",42:"Luke",43:"John",44:"Acts",45:"Romans",
  46:"1 Corinthians",47:"2 Corinthians",48:"Galatians",49:"Ephesians",
  50:"Philippians",51:"Colossians",52:"1 Thessalonians",53:"2 Thessalonians",
  54:"1 Timothy",55:"2 Timothy",56:"Titus",57:"Philemon",58:"Hebrews",
  59:"James",60:"1 Peter",61:"2 Peter",62:"1 John",63:"2 John",
  64:"3 John",65:"Jude",66:"Revelation",
};

function shortAbbrFor(bookId: number, incomingName: string): string {
  const canon = CANON_EN_BY_ID[bookId];
  if (canon && BOOK_ABBR[canon]) return BOOK_ABBR[canon];
  if (BOOK_ABBR[incomingName]) return BOOK_ABBR[incomingName];
  return incomingName;
}

async function fetchJson<T>(url: string): Promise<T> {
  // Prefer Obsidian's requestUrl (no CORS restrictions)
  try {
    const resp = await requestUrl({ url, method: "GET" });
    if (resp.status < 200 || resp.status >= 300) {
      throw new Error(`${resp.status} Request failed`);
    }
    const text = resp.text ?? "";
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Invalid JSON from ${url}`);
    }
  } catch (err) {
    // Fallback to fetch for non-Obsidian contexts (e.g., tests)
    try {
      const r = await fetch(url, { method: "GET" });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return (await r.json()) as T;
    } catch (e) {
      // Surface the original requestUrl error if both fail
      throw err instanceof Error ? err : new Error(String(err));
    }
  }
}

export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(i|em|strong|b|u|sup|sub|span|p|div|blockquote|small|font)[^>]*>/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ---------- Builder core ----------
type BuildOptions = {
  translationCode: string;
  translationFull: string;
  includeVersionInFileName: boolean;
  versionAsSubfolder: boolean;
  autoFrontmatter: boolean;
  concurrency: number;
};
type ProgressFn = (done: number, total: number, message: string) => void;

function nowIsoDate(): string {
  const d = new Date();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

async function ensureFolder(app: App, path: string): Promise<TFolder> {
  const np = normalizePath(path.replace(/\/+$/,""));
  let f = app.vault.getAbstractFileByPath(np);
  if (f instanceof TFolder) return f;
  await app.vault.createFolder(np);
  const created = app.vault.getAbstractFileByPath(np);
  if (created instanceof TFolder) return created;
  throw new Error(`Failed to create folder: ${np}`);
}

function buildBookFilename(baseShort: string, code: string, includeVersion: boolean): string {
  return includeVersion ? `${baseShort} (${code})` : baseShort;
}

function chapterNavLine(bookShort: string, chapters: number): string {
  const parts: string[] = [];
  for (let c=1; c<=chapters; c++) {
    const lab = (c % 5 === 0 || c === 1 || c === chapters) ? String(c) : "•";
    parts.push(`[[${bookShort}#^${c}|${lab}]]`);
  }
  return `\n**ch.** ${parts.join(" ")}\n`;
}

export async function buildBibleFromBolls(app: App, opts: BuildOptions, onProgress: ProgressFn) {
  const baseFolder = "_Bible";
  const root = await ensureFolder(app, baseFolder);
  const parent = opts.versionAsSubfolder
    ? await ensureFolder(app, `${baseFolder}/${opts.translationCode}`)
    : root;

  let books: BollsBookMeta[] = [];
  try {
    books = await fetchJson<BollsBookMeta[]>(BOLLS.GET_BOOKS(opts.translationCode));
  } catch (e:any) {
    throw new Error(`Could not load books for ${opts.translationCode}: ${e?.message ?? e}`);
  }
  if (!books.length) throw new Error("No books returned from API.");

  const total = books.reduce((acc,b)=>acc + (b.chapters||0), 0);
  let done = 0;

  const errors: string[] = [];

  for (const book of books) {
    const shortBook = shortAbbrFor(book.bookid, book.name);
    const shortWithAbbr = `${shortBook}${opts.includeVersionInFileName ? ` (${opts.translationCode})` : ""}`;
    const fileBase = buildBookFilename(shortBook, opts.translationCode, opts.includeVersionInFileName);
    const targetPath = normalizePath(`${parent.path}/${fileBase}.md`);

    const headerLines: string[] = [];
    if (opts.autoFrontmatter) {
      headerLines.push(
        "---",
        `title: "${shortWithAbbr}"`,
        `bible_translation_code: "${opts.translationCode}"`,
        `bible_translation_name: "${opts.translationFull}"`,
        `created: ${nowIsoDate()}`,
        "---",
        ""
      );
    }
    headerLines.push(`# ${shortWithAbbr}`);
    headerLines.push(chapterNavLine(shortWithAbbr, book.chapters));
    headerLines.push("");

    const chunks: string[] = [headerLines.join("\n")];

    const queue = Array.from({length: book.chapters}, (_,i)=>i+1);
    const concurrency = Math.max(1, Math.min(8, opts.concurrency || 4));

    // Simple pool
    let next = 0;
    const workers = Array.from({length: concurrency}, () => (async () => {
      while (next < queue.length) {
        const ch = queue[next++];
        try {
          onProgress(done, total, `${shortWithAbbr} ${ch}/${book.chapters}`);
          const verses = await fetchJson<BollsVerse[]>(BOLLS.GET_CHAPTER(opts.translationCode, book.bookid, ch));
          const maxV = Math.max(0, ...verses.map(v => v.verse));

          const vvNav = Array.from({length: maxV}, (_,i)=>i+1)
            .map(v => `[[${shortWithAbbr}#^${ch}-${v}|${v % 5 === 0 ? v : "•"}]]`).join(" ");

          const prevLink = ch > 1 ? `[[${shortWithAbbr}#^${ch-1}|<- Previous]]` : "←";
          const nextLink = ch < book.chapters ? `[[${shortWithAbbr}#^${ch+1}|Next ->]]` : "→";
          const mid = `[[${shortWithAbbr}#${shortWithAbbr}|${shortBook} ${ch} of ${book.chapters}]]`;

          const top = [
            "---",
            `${prevLink} | ${mid} | ${nextLink} | **vv.** ${vvNav} ^${ch}`,
            "\n---\n",
            ""
          ].join("\n");

          const versesMd = verses.map(v => {
            const plain = htmlToText(v.text).trim();
            return `**${shortWithAbbr} ${ch}:${v.verse}** - ${plain} ^${ch}-${v.verse}`;
          }).join("\n\n");

          chunks[ch] = `${top}${versesMd}\n\n`;
        } catch (e:any) {
          errors.push(`[${opts.translationCode}] ${shortBook} ch.${ch}: ${e?.message ?? e}`);
          chunks[ch] = `---\n(${shortBook} ${ch}) — failed to download.\n^${ch}\n---\n\n`;
        } finally {
          done++; onProgress(done, total, `${shortBook} ${Math.min(ch, book.chapters)}/${book.chapters}`);
        }
      }
    })());
    await Promise.all(workers);

    const bookContent = chunks.join("");
    const existing = app.vault.getAbstractFileByPath(targetPath);
    if (existing instanceof TFile) {
      await app.vault.modify(existing, bookContent);
    } else {
      await app.vault.create(targetPath, bookContent);
    }
  }

  if (errors.length) {
    // const logFolder = await ensureFolder(app, `${baseFolder}/_logs`);
    // const logPath = normalizePath(`${logFolder.path}/bible-build-${opts.translationCode}-${Date.now()}.md`);
    // const body = [
    //   `# Build Log — ${opts.translationCode}`,
    //   `Date: ${new Date().toString()}`,
    //   "",
    //   ...errors.map(e => `- ${e}`)
    // ].join("\n");
    // await app.vault.create(logPath, body);
    // new Notice(`Finished with ${errors.length} error(s). See: ${logPath}`);
    new Notice(`Finished with ${errors.length} error(s).`);
  } else {
    new Notice("Finished without errors.");
  }
}

// ---------- Command entry ----------
export function commandBuildBibleFromBolls(app: App, _settings: BibleToolsSettings) {
  new BuildBibleModal(app, _settings).open();
}