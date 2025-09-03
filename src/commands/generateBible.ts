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

// // ---------- Build Modal ----------
// class BuildBibleModal extends Modal {
//   private settings: BibleToolsSettings;
//   private appRef: App;

//   // Data from languages.json
//   private langBlocks: LanguagesEntry[] = [];

//   // UI state
//   private languageKey: string = "ALL"; // "ALL" or the exact LanguagesEntry.language string
//   private translationCode: string = "KJV";
//   private translationFull: string = "King James Version";

//   private includeVersionInFileName: boolean;
//   private versionAsSubfolder: boolean;
//   private autoFrontmatter: boolean;
//   private concurrency: number = 4;

//   // progress
//   private progressEl!: HTMLProgressElement;
//   private statusEl!: HTMLDivElement;
//   private startBtn!: HTMLButtonElement;
//   private working = false;

//   constructor(app: App, settings: BibleToolsSettings) {
//     super(app);
//     this.appRef = app;
//     this.settings = settings;

//     this.includeVersionInFileName = settings.bibleIncludeVersionInFilename ?? true;
//     this.versionAsSubfolder = settings.bibleIncludeVersionInFilename ?? true;
//     this.autoFrontmatter = settings.bibleAddFrontmatter ?? false;
//   }

//   private translationsForLanguage(langKey: string): LanguagesEntry["translations"] {
//     if (langKey === "ALL") {
//       // flatten all translations
//       const all: LanguagesEntry["translations"] = [];
//       for (const block of this.langBlocks) all.push(...block.translations);
//       // De-dup by short_name
//       const seen = new Set<string>();
//       return all.filter(t => {
//         if (seen.has(t.short_name)) return false;
//         seen.add(t.short_name);
//         return true;
//       }).sort((a,b) => a.short_name.localeCompare(b.short_name));
//     }
//     const block = this.langBlocks.find(b => b.language === langKey);
//     if (!block) return [];
//     return block.translations.slice().sort((a,b) => a.short_name.localeCompare(b.short_name));
//   }

//   async onOpen() {
//     const { contentEl } = this;
//     contentEl.empty();
//     this.titleEl.setText("Build _Bible from bolls.life");

//     // Load languages.json (single catalogue we have)
//     try {
//       const raw = await fetchJson<LanguagesEntry[]>(BOLLS.LANGUAGES_URL);
//       // filter out empty translation groups just in case
//       this.langBlocks = (raw || []).filter(b => Array.isArray(b.translations) && b.translations.length > 0);
//     } catch (e) {
//       console.warn("[Bolls] Could not fetch languages.json:", e);
//       // Minimal English fallback so the modal still works:
//       this.langBlocks = [{
//         language: "English",
//         translations: [
//           { short_name: "KJV", full_name: "King James Version 1769 with Apocrypha and Strong's Numbers" },
//           { short_name: "WEB", full_name: "World English Bible" },
//           { short_name: "YLT", full_name: "Young's Literal Translation (1898)" },
//         ]
//       }];
//     }

//     // LANGUAGE PICKER
//     new Setting(contentEl)
//       .setName("Language")
//       .addDropdown(dd => {
//         (dd.selectEl as HTMLElement).style.maxWidth = "300px";
//         (dd.selectEl as HTMLElement).style.textOverflow = "ellipsis";
//         (dd.selectEl as HTMLElement).style.overflow = "hidden";
//         (dd.selectEl as HTMLElement).style.whiteSpace = "nowrap";

//         dd.addOption("ALL", "All languages");
//         for (const block of this.langBlocks) {
//           dd.addOption(block.language, block.language);
//         }
//         dd.setValue(this.languageKey);
//         dd.onChange(v => {
//           this.languageKey = v;
//           rebuildVersions();
//         });
//       });

//     // VERSIONS (dynamic)
//     const versionsContainer = contentEl.createDiv();

//     const rebuildVersions = () => {
//       versionsContainer.empty();
//       const list = this.translationsForLanguage(this.languageKey);
//       new Setting(versionsContainer)
//         .setName("Version")
//         .addDropdown(dd => {
//           (dd.selectEl as HTMLElement).style.maxWidth = "300px";
//           (dd.selectEl as HTMLElement).style.textOverflow = "ellipsis";
//           (dd.selectEl as HTMLElement).style.overflow = "hidden";
//           (dd.selectEl as HTMLElement).style.whiteSpace = "nowrap";

//           if (!list.length) {
//             dd.addOption("", "(no translations for this language)");
//             dd.setValue("");
//               } else {
//             for (const t of list) {
//               dd.addOption(t.short_name, `${t.short_name} — ${t.full_name}`);
//             }
//             // keep existing if still present, else first
//             const exists = list.some(t => t.short_name === this.translationCode);
//             const chosen = exists ? this.translationCode : list[0].short_name;
//             dd.setValue(chosen);
//             this.translationCode = chosen;
//             const t = list.find(x => x.short_name === chosen);
//             this.translationFull = t?.full_name ?? chosen;

//             dd.onChange(v => {
//               this.translationCode = v;
//               const tt = list.find(x => x.short_name === v);
//               this.translationFull = tt?.full_name ?? v;
//             });
//           }
//         })
//     };

//     rebuildVersions();

//     // OPTIONS
//     new Setting(contentEl)
//       .setName("Append version to file name")
//       .setDesc(`"John (KJV)" vs "John"`)
//       .addToggle(t => t.setValue(this.includeVersionInFileName).onChange(v => this.includeVersionInFileName = v));

//     new Setting(contentEl)
//       .setName("Place books under version subfolder")
//       .setDesc(`"_Bible/KJV/John (KJV)" vs "_Bible/John"`)
//       .addToggle(t => t.setValue(this.versionAsSubfolder).onChange(v => this.versionAsSubfolder = v));

//     new Setting(contentEl)
//       .setName("Auto-add frontmatter")
//       .setDesc("Insert YAML with title/version/created into each book file")
//       .addToggle(t => t.setValue(this.autoFrontmatter).onChange(v => this.autoFrontmatter = v));

//     new Setting(contentEl)
//       .setName("Concurrency")
//       .setDesc("How many chapters to download in parallel")
//       .addSlider(s => s.setLimits(1, 8, 1).setValue(this.concurrency).onChange(v => this.concurrency = v).setDynamicTooltip());

//     // PROGRESS
//     const progWrap = contentEl.createDiv({ cls: "bolls-progress" });
//     this.progressEl = progWrap.createEl("progress", { attr: { max: "100", value: "0", style: "width:100%" } });
//     this.statusEl = progWrap.createDiv({ text: "Idle." });

//     // ACTIONS
//     const btns = contentEl.createDiv({ cls: "bolls-actions" });
//     this.startBtn = btns.createEl("button", { text: "Start" });
//     this.startBtn.onclick = () => this.start();

//     const cancelBtn = btns.createEl("button", { text: "Close" });
//     cancelBtn.onclick = () => this.close();
//   }

//   async start() {
//     if (this.working) return;
//     this.working = true;
//     this.startBtn.disabled = true;
//     const code = this.translationCode.trim();
//     if (!code) { new Notice("Choose or enter a translation code."); this.working = false; this.startBtn.disabled = false; return; }

//     try {
//       await buildBibleFromBolls(this.appRef, {
//         translationCode: code,
//         translationFull: this.translationFull || code,
//         includeVersionInFileName: this.includeVersionInFileName,
//         versionAsSubfolder: this.versionAsSubfolder,
//         autoFrontmatter: this.autoFrontmatter,
//         concurrency: this.concurrency,
//       }, (done, total, msg) => {
//         this.progressEl.max = total;
//         this.progressEl.value = done;
//         this.statusEl.setText(`${done}/${total} · ${msg}`);
//       });
//       this.statusEl.setText("Done.");
//     } catch (e:any) {
//       console.error(e);
//       new Notice(`Bible build failed: ${e?.message ?? e}`);
//     } finally {
//       this.working = false;
//       this.startBtn.disabled = false;
//     }
//   }
// }

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