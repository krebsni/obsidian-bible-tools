"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ObsidianBibleTools
});
module.exports = __toCommonJS(main_exports);
var import_obsidian12 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  baseFolder: "Books",
  redMarkCss: "background: #FF5582A6;",
  indexFileNameMode: "article-style",
  stripMdLinksWhenVerseLike: true,
  removeObsidianDisplayLinks: false,
  rewriteOldObsidianLinks: true,
  autoLinkVerses: true,
  // Bible generation defaults
  bibleDefaultVersion: "KJV",
  bibleDefaultLanguage: "English",
  bibleIncludeVersionInFilename: true,
  bibleAddFrontmatter: false
};
var BibleToolsSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Obsidian Bible Tools \u2014 Settings" });
    new import_obsidian.Setting(containerEl).setName("Default base folder").setDesc("Root folder to scan when a command needs a folder (e.g., index creation).").addText((t) => t.setPlaceholder("Books").setValue(this.plugin.settings.baseFolder).onChange(async (v) => {
      this.plugin.settings.baseFolder = v || "Books";
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Index filename mode").setDesc('If a folder ends with ", The" or ", A", convert to "The \u2026" / "A \u2026".').addDropdown((dd) => dd.addOption("folder-name", "Keep folder name").addOption("article-style", "Article style (\u2018, The\u2019 \u2192 \u2018The \u2026\u2019)").setValue(this.plugin.settings.indexFileNameMode).onChange(async (value) => {
      this.plugin.settings.indexFileNameMode = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Red highlight CSS").setDesc("Exact style a <mark> tag must have to be considered a red highlight.").addText((t) => t.setPlaceholder("background: #FF5582A6;").setValue(this.plugin.settings.redMarkCss).onChange(async (v) => {
      this.plugin.settings.redMarkCss = v;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Strip Markdown links that look like scripture").setDesc("Replace [Rom. 1:1](url) with plain text before linking to anchors.").addToggle((t) => t.setValue(this.plugin.settings.stripMdLinksWhenVerseLike).onChange(async (v) => {
      this.plugin.settings.stripMdLinksWhenVerseLike = v;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Remove Obsidian display-text links that look like references").setDesc("If [[Target|Display]] looks like a scripture ref, replace it with plain text before linking (same as the Python script).").addToggle((t) => t.setValue(this.plugin.settings.removeObsidianDisplayLinks).onChange(async (value) => {
      this.plugin.settings.removeObsidianDisplayLinks = value;
      await this.plugin.saveSettings();
      new import_obsidian.Notice("Saved: remove Obsidian display-text links");
    }));
    new import_obsidian.Setting(containerEl).setName("Rewrite legacy Obsidian links").setDesc("Convert [[Rom 1#^3|\u2026]] \u2192 [[Rom#^1-3|\u2026]] before linking and remove previous Obsidian links that have verse-like display pattern.").addToggle((t) => t.setValue(this.plugin.settings.rewriteOldObsidianLinks).onChange(async (value) => {
      this.plugin.settings.rewriteOldObsidianLinks = value;
      await this.plugin.saveSettings();
      new import_obsidian.Notice("Saved: rewrite old-style links");
    }));
    new import_obsidian.Setting(containerEl).setName("Auto-link verses after outline formatting").setDesc("After the outline text is formatted, automatically link scripture references in the result.").addToggle(
      (t) => t.setValue(this.plugin.settings.autoLinkVerses).onChange(async (v) => {
        this.plugin.settings.autoLinkVerses = v;
        await this.plugin.saveSettings();
      })
    );
  }
};

// src/commands/verseLinks.ts
var import_obsidian3 = require("obsidian");

// src/lib/mdUtils.ts
var import_obsidian2 = require("obsidian");
function splitFrontmatter(text) {
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) {
      const yaml = text.slice(0, end + 4);
      const body = text.slice(end + 4);
      return { yaml, body };
    }
  }
  return { body: text };
}
function insertAfterYamlOrH1(src, block) {
  const { yaml, body } = splitFrontmatter(src);
  if (yaml) return yaml + "\n" + block + body;
  const firstH1 = body.indexOf("\n# ");
  if (firstH1 !== -1) {
    const pos = firstH1 + 1;
    return body.slice(0, pos) + block + body.slice(pos);
  }
  return body + (body.endsWith("\n") ? "" : "\n") + block;
}
function isLeafFolder(folder) {
  return folder.children.find((c) => c instanceof import_obsidian2.TFolder) === void 0;
}
function getLeafFoldersUnder(app, baseFolderPath) {
  const base = app.vault.getFolderByPath((0, import_obsidian2.normalizePath)(baseFolderPath));
  if (!base) return [];
  const res = [];
  const walk = (f) => {
    if (isLeafFolder(f)) res.push(f);
    else for (const c of f.children) if (c instanceof import_obsidian2.TFolder) walk(c);
  };
  walk(base);
  return res;
}
function listMarkdownFiles(folder) {
  return folder.children.filter((c) => c instanceof import_obsidian2.TFile && c.extension === "md");
}
function upsertTopLinksBlock(src, linksLine) {
  const { yaml, body } = splitFrontmatter(src);
  function replaceWithin(content) {
    const lines = content.split("\n");
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      if (/\|Previous\]\]|\|Next\]\]/.test(lines[i])) {
        lines[i] = linksLine;
        return lines.join("\n");
      }
    }
    lines.splice(0, 0, "", linksLine, "");
    return lines.join("\n");
  }
  if (yaml) return yaml + replaceWithin(body);
  return replaceWithin(src);
}
function upsertBottomLinks(src, linksLine) {
  const lines = src.split("\n");
  for (let i = Math.max(0, lines.length - 5); i < lines.length; i++) {
    if (/\|Previous\]\]|\|Next\]\]/.test(lines[i])) {
      lines[i] = linksLine;
      return lines.join("\n");
    }
  }
  lines.push("", linksLine);
  return lines.join("\n");
}

// src/commands/verseLinks.ts
var BOOK_ABBR = {
  // ---- Pentateuch ----
  "Genesis": "Gen",
  "1 Mose": "Gen",
  "1Mose": "Gen",
  "1. Mose": "Gen",
  "1.Mose": "Gen",
  "Exodus": "Exo",
  "2 Mose": "Exo",
  "2Mose": "Exo",
  "2. Mose": "Exo",
  "2.Mose": "Exo",
  "Leviticus": "Lev",
  "3 Mose": "Lev",
  "3Mose": "Lev",
  "3. Mose": "Lev",
  "3.Mose": "Lev",
  "Numbers": "Num",
  "Numeri": "Num",
  "4 Mose": "Num",
  "4Mose": "Num",
  "4. Mose": "Num",
  "4.Mose": "Num",
  "Deuteronomy": "Deut",
  "Deuteronomium": "Deut",
  "5 Mose": "Deut",
  "5Mose": "Deut",
  "5. Mose": "Deut",
  "5.Mose": "Deut",
  // ---- Historical ----
  "Joshua": "Josh",
  "Josua": "Josh",
  "Judges": "Judg",
  "Richter": "Judg",
  "Ruth": "Ruth",
  "1 Samuel": "1 Sam",
  "1. Samuel": "1 Sam",
  "1Samuel": "1 Sam",
  "1.Samuel": "1 Sam",
  "2 Samuel": "2 Sam",
  "2. Samuel": "2 Sam",
  "2Samuel": "2 Sam",
  "2.Samuel": "2 Sam",
  "1 Kings": "1 Kings",
  "1. K\xF6nige": "1 Kings",
  "1K\xF6nige": "1 Kings",
  "1.K\xF6nige": "1 Kings",
  "2 Kings": "2 Kings",
  "2. K\xF6nige": "2 Kings",
  "2K\xF6nige": "2 Kings",
  "2.K\xF6nige": "2 Kings",
  "1 Chronicles": "1 Chron",
  "1. Chronik": "1 Chron",
  "1Chronik": "1 Chron",
  "1.Chronik": "1 Chron",
  "2 Chronicles": "2 Chron",
  "2. Chronik": "2 Chron",
  "2Chronik": "2 Chron",
  "2.Chronik": "2 Chron",
  "Ezra": "Ezra",
  "Esra": "Ezra",
  "Nehemiah": "Neh",
  "Nehemia": "Neh",
  "Esther": "Esth",
  "Job": "Job",
  "Hiob": "Job",
  // ---- Wisdom ----
  "Psalms": "Psa",
  "Psalm": "Psa",
  "Ps": "Psa",
  "Proverbs": "Prov",
  "Spr\xFCche": "Prov",
  "Spr": "Prov",
  "Ecclesiastes": "Eccl",
  "Prediger": "Eccl",
  "Kohelet": "Eccl",
  "Song of Solomon": "SoS",
  "Song of Songs": "SoS",
  "Hoheslied": "SoS",
  "Hohelied": "SoS",
  "Lied der Lieder": "SoS",
  "SS": "SoS",
  // ---- Prophets ----
  "Isaiah": "Isa",
  "Jesaja": "Isa",
  "Jeremiah": "Jer",
  "Jeremia": "Jer",
  "Lamentations": "Lam",
  "Klagelieder": "Lam",
  "Threni": "Lam",
  "Ezekiel": "Ezek",
  "Hesekiel": "Ezek",
  "Ezechiel": "Ezek",
  "Daniel": "Dan",
  "Hosea": "Hosea",
  "Joel": "Joel",
  "Amos": "Amos",
  "Obadiah": "Obad",
  "Obadja": "Obad",
  "Jonah": "Jonah",
  "Jona": "Jonah",
  "Micah": "Micah",
  "Micha": "Micah",
  "Nahum": "Nah",
  "Habakkuk": "Hab",
  "Habakuk": "Hab",
  "Zephaniah": "Zep",
  "Zephanja": "Zep",
  "Zefanja": "Zep",
  "Haggai": "Hag",
  "Zechariah": "Zech",
  "Sacharja": "Zech",
  "Malachi": "Mal",
  "Maleachi": "Mal",
  // ---- Gospels & Acts ----
  "Matthew": "Matt",
  "Matth\xE4us": "Matt",
  "Mt": "Matt",
  "Mark": "Mark",
  "Markus": "Mark",
  "Mk": "Mark",
  "Luke": "Luke",
  "Lukas": "Luke",
  "Lk": "Luke",
  "Luk": "Luke",
  "John": "John",
  "Johannes": "John",
  "Joh": "John",
  "Acts": "Acts",
  "Apg": "Acts",
  "Apostelgeschichte": "Acts",
  // ---- Paul’s letters ----
  "Romans": "Rom",
  "R\xF6mer": "Rom",
  "R\xF6m": "Rom",
  "R\xF6merbrief": "Rom",
  "1 Corinthians": "1 Cor",
  "1 Korinther": "1 Cor",
  "1. Korinther": "1 Cor",
  "1Korinther": "1 Cor",
  "1.Korinther": "1 Cor",
  "1 Kor": "1 Cor",
  "1. Kor": "1 Cor",
  "1Kor": "1 Cor",
  "1.Kor": "1 Cor",
  "2 Corinthians": "2 Cor",
  "2 Korinther": "2 Cor",
  "2. Korinther": "2 Cor",
  "2Korinther": "2 Cor",
  "2.Korinther": "2 Cor",
  "2 Kor": "2 Cor",
  "2. Kor": "2 Cor",
  "2Kor": "2 Cor",
  "2.Kor": "2 Cor",
  "Galatians": "Gal",
  "Galater": "Gal",
  "Gal": "Gal",
  "Ephesians": "Eph",
  "Epheser": "Eph",
  "Eph": "Eph",
  "Philippians": "Phil",
  "Philipper": "Phil",
  "Phil": "Phil",
  "Colossians": "Col",
  "Kolosser": "Col",
  "Kol": "Col",
  "1 Thessalonians": "1 Thes",
  "1 Thess": "1 Thes",
  "1. Thess": "1 Thes",
  "1Thess": "1 Thes",
  "1.Thess": "1 Thes",
  "1 Thessalonicher": "1 Thes",
  "1. Thessalonicher": "1 Thes",
  "1Thessalonicher": "1 Thes",
  "1.Thessalonicher": "1 Thes",
  "2 Thessalonians": "2 Thes",
  "2 Thess": "2 Thes",
  "2. Thess": "2 Thes",
  "2Thess": "2 Thes",
  "2.Thess": "2 Thes",
  "2 Thessalonicher": "2 Thes",
  "2. Thessalonicher": "2 Thes",
  "2Thessalonicher": "2 Thes",
  "2.Thessalonicher": "2 Thes",
  "1 Timothy": "1 Tim",
  "1 Timotheus": "1 Tim",
  "1. Timotheus": "1 Tim",
  "1Timotheus": "1 Tim",
  "1.Timotheus": "1 Tim",
  "1 Tim": "1 Tim",
  "1. Tim": "1 Tim",
  "1Tim": "1 Tim",
  "1.Tim": "1 Tim",
  "2 Timothy": "2 Tim",
  "2 Timotheus": "2 Tim",
  "2. Timotheus": "2 Tim",
  "2Timotheus": "2 Tim",
  "2.Timotheus": "2 Tim",
  "2 Tim": "2 Tim",
  "2. Tim": "2 Tim",
  "2Tim": "2 Tim",
  "2.Tim": "2 Tim",
  "Titus": "Titus",
  "Philemon": "Philem",
  "Hebrews": "Heb",
  "Hebr\xE4er": "Heb",
  "Hebr": "Heb",
  // ---- Catholic & General letters ----
  "James": "James",
  "Jakobus": "James",
  "Jak": "James",
  "1 Peter": "1 Pet",
  "1 Petrus": "1 Pet",
  "1. Petrus": "1 Pet",
  "1Petrus": "1 Pet",
  "1.Petrus": "1 Pet",
  "1 Pet": "1 Pet",
  "1. Pet": "1 Pet",
  "1. Petr": "1 Pet",
  "1.Petr": "1 Pet",
  "1Pet": "1 Pet",
  "1.Pet": "1 Pet",
  "2 Peter": "2 Pet",
  "2 Petrus": "2 Pet",
  "2. Petrus": "2 Pet",
  "2Petrus": "2 Pet",
  "2.Petrus": "2 Pet",
  "2 Pet": "2 Pet",
  "2. Pet": "2 Pet",
  "2. Petr": "2 Pet",
  "2.Petr": "2 Pet",
  "2Pet": "2 Pet",
  "2.Pet": "2 Pet",
  "1 John": "1 John",
  "1 Johannes": "1 John",
  "1. Johannes": "1 John",
  "1Johannes": "1 John",
  "1.Johannes": "1 John",
  "1 Joh": "1 John",
  "1. Joh": "1 John",
  "1Joh": "1 John",
  "1.Joh": "1 John",
  "2 John": "2 John",
  "2 Johannes": "2 John",
  "2. Johannes": "2 John",
  "2Johannes": "2 John",
  "2.Johannes": "2 John",
  "2 Joh": "2 John",
  "2. Joh": "2 John",
  "2Joh": "2 John",
  "2.Joh": "2 John",
  "3 John": "3 John",
  "3 Johannes": "3 John",
  "3. Johannes": "3 John",
  "3Johannes": "3 John",
  "3.Johannes": "3 John",
  "3 Joh": "3 John",
  "3. Joh": "3 John",
  "3Joh": "3 John",
  "3.Joh": "3 John",
  "Jude": "Jude",
  "Judas": "Jude",
  // ---- Revelation ----
  "Revelation": "Rev",
  "Offenbarung": "Rev",
  "Offb": "Rev",
  "Apokalypse": "Rev"
};
var escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function buildBookContext(settings) {
  let bookLocale;
  let custom;
  try {
    bookLocale = settings?.bookLocale;
  } catch {
  }
  try {
    custom = settings?.customBookMap;
  } catch {
  }
  let abbr = BOOK_ABBR;
  if (bookLocale === "custom" && custom) {
    try {
      if (typeof custom === "string") {
        const parsed = JSON.parse(custom);
        if (parsed && typeof parsed === "object") abbr = parsed;
      } else if (typeof custom === "object") {
        abbr = custom;
      }
    } catch {
      abbr = BOOK_ABBR;
    }
  } else {
    abbr = BOOK_ABBR;
  }
  const allTokens = Array.from(/* @__PURE__ */ new Set([...Object.keys(abbr), ...Object.values(abbr)])).sort(
    (a, b) => b.length - a.length
  );
  const BOOK_ALT = allTokens.map(escapeRe).join("|");
  const getBookAbbr = (book) => abbr[book] ?? book;
  const buildPatternBody = () => {
    const book = `(?:${BOOK_ALT})`;
    const ref1 = `(?:(?:${book})?\\.?\\s*\\d+(?:-\\d+)?:\\d+[a-z]?(?:-\\d+)?[a-z]?(?:\\s*,\\s*\\d+[a-z]?(?:-\\d+)?[a-z]?|\\s*;\\s*\\d+:\\d+[a-z]?(?:-\\d+)?[a-z]?)*)`;
    const ref2 = `(?:(${book})\\.?\\s+(\\d+)(?:-(\\d+))?)`;
    const REF = `(?<ref>${ref1}|${ref2})`;
    const VERSE = `(?<verse>\\b[Vv]v?(?:\\.|erses?)\\s*\\d+(?:-\\d+)?[a-z]?(?:(?:,|,?\\s*and)\\s*\\d+(?:-\\d+)?[a-z]?)*)`;
    const CHAPTER = `(?<chapter>\\b[Cc]h(?:apters?|s?\\.)\\.?\\s*\\d+(?:-\\d+)?)`;
    const NOTE = `(?<note>\\b[Nn]otes?(?:\\s+\\d+(?:\\s+\\d+)?(?:(?:[,;]|,?\\s*and)\\s*\\d+(?:\\s+\\d+)?(?:\\s+in\\s+${book}\\.?\\s+\\d+)?)*)(?:\\s+in\\s+${book}\\.?\\s+\\d+)?)`;
    const BOOK = `(?<book>\\b(?:${book})\\b)(?!\\.?\\s*\\d+)`;
    return `${REF}|${VERSE}|${CHAPTER}|${NOTE}|${BOOK}`;
  };
  const PATTERN_BODY = buildPatternBody();
  const PATTERN_G = new RegExp(PATTERN_BODY, "g");
  const PATTERN_HEAD = new RegExp("^" + PATTERN_BODY);
  return { abbr, allTokens, BOOK_ALT, getBookAbbr, PATTERN_G, PATTERN_HEAD };
}
function normalizeBookToken(raw, ctx) {
  const cleaned = raw.trim().replace(/\.$/, "");
  return ctx.getBookAbbr(cleaned);
}
function addRange(ranges, start, end) {
  if (start >= 0 && end > start) ranges.push([start, end]);
}
function findProtectedRanges(text) {
  const ranges = [];
  const fenceRe = /(```|~~~)[^\n]*\n[\s\S]*?\1/g;
  for (let m; m = fenceRe.exec(text); ) addRange(ranges, m.index, m.index + m[0].length);
  const mathBlockRe = /\$\$[\s\S]*?\$\$/g;
  for (let m; m = mathBlockRe.exec(text); ) addRange(ranges, m.index, m.index + m[0].length);
  const inlineCodeRe = /`[^`\n]*`/g;
  for (let m; m = inlineCodeRe.exec(text); ) addRange(ranges, m.index, m.index + m[0].length);
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
  const mdLinkRe = /\[[^\]]+?\]\([^)]+\)/g;
  for (let m; m = mdLinkRe.exec(text); ) addRange(ranges, m.index, m.index + m[0].length);
  const inlinePropRe = /^[^\n:]{1,200}::.*$/gm;
  for (let m; m = inlinePropRe.exec(text); ) addRange(ranges, m.index, m.index + m[0].length);
  const obsidianRe = /\[\[[^\]]*?\]\]/g;
  for (let m; m = obsidianRe.exec(text); ) addRange(ranges, m.index, m.index + m[0].length);
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of ranges) {
    if (!merged.length || r[0] > merged[merged.length - 1][1]) merged.push(r);
    else merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], r[1]);
  }
  return merged;
}
function inProtected(pos, ranges) {
  let lo = 0, hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = lo + hi >> 1;
    const [s, e] = ranges[mid];
    if (pos < s) hi = mid - 1;
    else if (pos >= e) lo = mid + 1;
    else return true;
  }
  return false;
}
function isWithinObsidianLink(text, start, end) {
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
function isInsideNumericParens(text, start, end) {
  const open = text.lastIndexOf("(", start);
  if (open === -1) return false;
  const close = text.indexOf(")", end);
  if (close === -1) return false;
  const inner = text.slice(open + 1, close).trim();
  if (/^\d{1,4}(?:[\/\.\-:]\d{1,2}(?:[\/\.\-:]\d{1,4})?)?$/.test(inner)) return true;
  if (/^p{1,2}\.\s*\d+(\s*-\s*\d+)?$/i.test(inner)) return true;
  return false;
}
function removeMatchingMarkdownLinks(text, PATTERN_HEAD) {
  const mdLink = /(\*\*|__|\*)?\[([^\]]+)\]\([^)]+\)(\*\*|__|\*)?/g;
  return text.replace(mdLink, (_m, pre, disp, suf) => {
    const linkText = String(disp);
    if (PATTERN_HEAD.test(linkText)) return linkText;
    const simpleNum = /^\d+(?:[:-]\d+)?(?:-\d+)?$/.test(linkText);
    if (simpleNum) return linkText;
    return `${pre ?? ""}[${linkText}]${suf ?? ""}`;
  });
}
function removeMatchingObsidianLinks(text, PATTERN_HEAD) {
  const obs = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
  return text.replace(obs, (_m, _t, disp) => {
    const display = String(disp);
    if (PATTERN_HEAD.test(display)) return display;
    const simpleNum = /^\d+(?:[:-]\d+)?(?:-\d+)?$/.test(display);
    if (simpleNum) return display;
    return _m;
  });
}
function replaceOldObsidianLinks(text) {
  const oldLink = /\[\[([0-9]?\s[A-Za-z ]+)\s(\d+)#\^(\d+)(?:\|([^\]]+))?\]\]/g;
  return text.replace(oldLink, (_m, bookShort, ch, verse, disp) => {
    const b = String(bookShort).trim();
    return disp ? `[[${b}#^${ch}-${verse}|${disp}]]` : `[[${b}#^${ch}-${verse}]]`;
  });
}
function findLastBookBefore(text, pos, ctx) {
  const start = Math.max(0, pos - 200);
  const left = text.slice(start, pos);
  const re = new RegExp(`(?:${ctx.BOOK_ALT})\\.?\\s*$|(?:${ctx.BOOK_ALT})\\.?\\s+`, "g");
  let m;
  let last = null;
  while ((m = re.exec(left)) !== null) {
    last = m[0].trim();
  }
  if (!last) return null;
  return normalizeBookToken(last.replace(/\s+$/, ""), ctx);
}
function formatBookTarget(bookShort, versionShort) {
  if (!versionShort) return bookShort;
  return `${bookShort} (${versionShort})`;
}
function replaceVerseReferencesOfMainText(text, ctx, opts) {
  if (opts.stripMdLinksWhenVerseLike) text = removeMatchingMarkdownLinks(text, ctx.PATTERN_HEAD);
  if (opts.removeObsidianLinks) text = removeMatchingObsidianLinks(text, ctx.PATTERN_HEAD);
  if (opts.rewriteOldLinks) text = replaceOldObsidianLinks(text);
  const protectedRanges = findProtectedRanges(text);
  let current_book = null;
  let current_chapter = null;
  let current_verse = null;
  const out = [];
  let lastPos = 0;
  const targetOf = (bookShort) => formatBookTarget(bookShort, opts.versionShort);
  ctx.PATTERN_G.lastIndex = 0;
  for (let m = ctx.PATTERN_G.exec(text); m; m = ctx.PATTERN_G.exec(text)) {
    const start = m.index;
    const end = start + m[0].length;
    if (inProtected(start, protectedRanges) || inProtected(end - 1, protectedRanges) || isWithinObsidianLink(text, start, end) || isInsideNumericParens(text, start, end)) {
      out.push(text.slice(lastPos, start), m[0]);
      lastPos = end;
      continue;
    }
    out.push(text.slice(lastPos, start));
    lastPos = end;
    const g = m.groups ?? {};
    if (g.book) {
      current_book = normalizeBookToken(g.book, ctx);
      current_chapter = null;
      current_verse = null;
      out.push(m[0]);
      continue;
    }
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
    if (g.note) {
      const noteText = g.note;
      const parts = noteText.split(/\s+/);
      let bookSubstring = false;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const pm = part.match(/^(\d+)/);
        if (pm && !bookSubstring) {
          const verse = pm[1];
          if (i + 1 < parts.length && !/^\d+/.test(parts[i + 1]) || i + 1 >= parts.length) {
            out.push(" " + part);
            continue;
          }
          for (let j = i + 1; j < parts.length; j++) {
            if (parts[j] === "in" && j + 1 < parts.length) {
              if (/^\d+$/.test(parts[j + 1]) && j + 2 < parts.length) {
                const book = parts[j + 1] + " " + parts[j + 2];
                current_chapter = parts[j + 3];
                current_book = normalizeBookToken(book, ctx);
              } else {
                const book = parts[j + 1];
                current_chapter = parts[j + 2];
                current_book = normalizeBookToken(book, ctx);
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
    if (g.ref) {
      const mm = g.ref.match(/(\s*[\.,;]?)(.+)/);
      const leading = mm ? mm[1] : "";
      let refText = mm ? mm[2] : g.ref;
      const bookStart = refText.match(new RegExp(`^((?:${ctx.BOOK_ALT})\\.?\\s+)`));
      let prefix = null;
      if (bookStart) {
        const bookPart = bookStart[0];
        prefix = bookPart;
        current_book = normalizeBookToken(bookPart.replace(/\s+$/, ""), ctx);
        refText = refText.slice(bookPart.length);
      }
      if (!current_book) {
        const inferred = findLastBookBefore(text, start, ctx);
        if (inferred) {
          current_book = inferred;
        } else {
          out.push(m[0]);
          continue;
        }
      }
      const parts = refText.replace(/\./g, "").trim().split(/(;|,)/);
      const result = [];
      let verseString = false;
      current_chapter = null;
      let local_current_verse = null;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part === "," || part === ";") {
          result.push(part + " ");
          verseString = part === ",";
          continue;
        }
        let p = part.trim();
        if (!p) continue;
        let chap = current_chapter;
        let v = null;
        let vEnd = null;
        if (p.includes(":")) {
          const [cStr, vStr] = p.split(":");
          chap = cStr;
          v = vStr;
        } else {
          if (verseString) v = p;
          else {
            chap = p;
            v = null;
          }
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
async function linkVersesInText(text, settings, versionShort) {
  const ctx = buildBookContext(settings);
  const removeObsidianDisplayLinks = settings?.removeObsidianDisplayLinks ?? true;
  const rewriteOldObsidianLinks = settings?.rewriteOldObsidianLinks ?? true;
  const stripMdLinksWhenVerseLike = settings?.stripMdLinksWhenVerseLike ?? true;
  return replaceVerseReferencesOfMainText(text, ctx, {
    removeObsidianLinks: removeObsidianDisplayLinks,
    rewriteOldLinks: rewriteOldObsidianLinks,
    stripMdLinksWhenVerseLike,
    versionShort: versionShort ?? null
  });
}
async function fetchJson(url) {
  const resp = await (0, import_obsidian3.requestUrl)({ url, method: "GET" });
  if (resp.status < 200 || resp.status >= 300) {
    throw new Error(`${resp.status}`);
  }
  const text = resp.text ?? "";
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${url}`);
  }
}
async function loadBollsCatalogue() {
  const URL = "https://bolls.life/static/bolls/app/views/languages.json";
  return await fetchJson(URL);
}
var PickVersionModal = class extends import_obsidian3.Modal {
  constructor(app, langs, onPick) {
    super(app);
    this.langs = [];
    this.chosenLangIdx = 0;
    this.chosenVerIdx = 0;
    this.langs = langs;
    this.onPick = onPick;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Link verses: choose Bible version (optional)" });
    let langSel;
    let verSel;
    new import_obsidian3.Setting(contentEl).setName("Language").addDropdown((d) => {
      langSel = d.selectEl;
      this.langs.forEach((l, idx) => d.addOption(String(idx), l.language));
      d.setValue(String(this.chosenLangIdx));
      d.onChange((v) => {
        this.chosenLangIdx = parseInt(v, 10);
        verSel.empty();
        const trans = this.langs[this.chosenLangIdx].translations;
        trans.forEach((t, i) => {
          const label = `${t.full_name} (${t.short_name})`;
          const opt = document.createElement("option");
          opt.value = String(i);
          opt.text = label;
          verSel.appendChild(opt);
        });
        this.chosenVerIdx = 0;
        verSel.value = "0";
      });
    });
    new import_obsidian3.Setting(contentEl).setName("Translation").addDropdown((d) => {
      verSel = d.selectEl;
      const trans = this.langs[this.chosenLangIdx]?.translations ?? [];
      trans.forEach((t, i) => {
        d.addOption(String(i), `${t.full_name} (${t.short_name})`);
      });
      d.setValue("0");
      d.onChange((v) => this.chosenVerIdx = parseInt(v, 10));
    });
    new import_obsidian3.Setting(contentEl).setName("How to link").setDesc("If you cancel, links will use default (no version).").addButton(
      (b) => b.setButtonText("Use selected version").setCta().onClick(() => {
        const ver = this.langs[this.chosenLangIdx].translations[this.chosenVerIdx];
        this.close();
        this.onPick(ver?.short_name ?? null);
      })
    ).addExtraButton(
      (b) => b.setIcon("x").setTooltip("Cancel (no version)").onClick(() => {
        this.close();
        this.onPick(null);
      })
    );
  }
};
async function pickVersionShortOrNull(app) {
  try {
    const langs = await loadBollsCatalogue();
    return await new Promise((resolve) => {
      const m = new PickVersionModal(app, langs, resolve);
      m.open();
    });
  } catch (e) {
    console.warn("[VerseLinks] Could not load Bolls languages.json; linking without version.", e);
    new import_obsidian3.Notice("Could not load Bible catalogue. Linking without version.");
    return null;
  }
}
async function commandVerseLinks(app, settings, params) {
  const scope = params?.scope ?? "current";
  const file = app.workspace.getActiveFile();
  if (scope === "folder") {
    const active = file;
    const folder = active?.parent;
    if (!active || !folder) {
      new import_obsidian3.Notice("Open a file inside the target folder.");
      return;
    }
    for (const child of folder.children) {
      if (child instanceof import_obsidian3.TFile && child.extension === "md") {
        const content2 = await app.vault.read(child);
        const { yaml: yaml2, body: body2 } = splitFrontmatter(content2);
        const linked2 = await linkVersesInText(body2, settings, null);
        await app.vault.modify(child, (yaml2 ?? "") + linked2);
      }
    }
    new import_obsidian3.Notice("Linked verses in folder.");
    return;
  }
  if (!file) {
    new import_obsidian3.Notice("Open a file first.");
    return;
  }
  const content = await app.vault.read(file);
  const { yaml, body } = splitFrontmatter(content);
  const linked = await linkVersesInText(body, settings, null);
  await app.vault.modify(file, (yaml ?? "") + linked);
  new import_obsidian3.Notice("Linked verses in current file.");
}
async function commandVerseLinksSelectionOrLine(app, settings) {
  const mdView = app.workspace.getActiveViewOfType(import_obsidian3.MarkdownView);
  if (!mdView) {
    new import_obsidian3.Notice("Open a Markdown file first.");
    return;
  }
  const editor = mdView.editor;
  const selectionText = editor.getSelection();
  const run = async (text) => {
    const linked2 = await linkVersesInText(text, settings, null);
    return linked2;
  };
  if (selectionText && selectionText.length > 0) {
    const linked2 = await run(selectionText);
    if (linked2 !== selectionText) {
      editor.replaceSelection(linked2);
      new import_obsidian3.Notice("Linked verses in selection.");
    } else {
      new import_obsidian3.Notice("No linkable verses in selection.");
    }
    return;
  }
  const line = editor.getCursor().line;
  const lineText = editor.getLine(line);
  const linked = await run(lineText);
  if (linked !== lineText) {
    editor.setLine(line, linked);
    new import_obsidian3.Notice("Linked verses on current line.");
  } else {
    new import_obsidian3.Notice("No linkable verses on current line.");
  }
}
async function commandVerseLinksChooseVersion(app, settings) {
  const versionShort = await pickVersionShortOrNull(app);
  const file = app.workspace.getActiveFile();
  if (!file) {
    new import_obsidian3.Notice("Open a file first.");
    return;
  }
  const content = await app.vault.read(file);
  const { yaml, body } = splitFrontmatter(content);
  const linked = await linkVersesInText(body, settings, versionShort);
  await app.vault.modify(file, (yaml ?? "") + linked);
  new import_obsidian3.Notice(versionShort ? `Linked verses (\u2192 ${versionShort}).` : "Linked verses (no version).");
}
async function commandVerseLinksSelectionOrLineChooseVersion(app, settings) {
  const mdView = app.workspace.getActiveViewOfType(import_obsidian3.MarkdownView);
  if (!mdView) {
    new import_obsidian3.Notice("Open a Markdown file first.");
    return;
  }
  const versionShort = await pickVersionShortOrNull(app);
  const editor = mdView.editor;
  const selectionText = editor.getSelection();
  const run = async (text) => {
    const linked2 = await linkVersesInText(text, settings, versionShort);
    return linked2;
  };
  if (selectionText && selectionText.length > 0) {
    const linked2 = await run(selectionText);
    if (linked2 !== selectionText) {
      editor.replaceSelection(linked2);
      new import_obsidian3.Notice(
        versionShort ? `Linked (selection) \u2192 ${versionShort}.` : "Linked (selection) without version."
      );
    } else {
      new import_obsidian3.Notice("No linkable verses in selection.");
    }
    return;
  }
  const line = editor.getCursor().line;
  const lineText = editor.getLine(line);
  const linked = await run(lineText);
  if (linked !== lineText) {
    editor.setLine(line, linked);
    new import_obsidian3.Notice(versionShort ? `Linked (line) \u2192 ${versionShort}.` : "Linked (line) without version.");
  } else {
    new import_obsidian3.Notice("No linkable verses on current line.");
  }
}

// src/commands/addNextPrevious.ts
var import_obsidian4 = require("obsidian");
function tokenFromFilename(name) {
  const m = name.match(/^(\d+)/);
  if (!m) return null;
  return parseInt(m[1], 10);
}
async function commandAddNextPrevious(app, _settings, _params) {
  const file = app.workspace.getActiveFile();
  if (!file) {
    new import_obsidian4.Notice("Open a file first.");
    return;
  }
  const parent = file.parent;
  if (!(parent instanceof import_obsidian4.TFolder)) {
    new import_obsidian4.Notice("Current file has no folder.");
    return;
  }
  const mdFiles = listMarkdownFiles(parent).map((f) => ({ f, n: tokenFromFilename(f.name) })).filter((x) => x.n !== null).sort((a, b) => a.n - b.n).map((x) => x.f);
  for (let i = 0; i < mdFiles.length; i++) {
    const cur = mdFiles[i];
    const prev = mdFiles[i - 1];
    const next = mdFiles[i + 1];
    const prevName = prev ? prev.basename : null;
    const nextName = next ? next.basename : null;
    const parts = [];
    if (prevName) parts.push(`[[${prevName}|Previous]]`);
    if (nextName) parts.push(`[[${nextName}|Next]]`);
    const linksLine = parts.join(" | ");
    if (!linksLine) continue;
    const src = await app.vault.read(cur);
    const withTop = upsertTopLinksBlock(src, linksLine);
    const withBoth = upsertBottomLinks(withTop, linksLine);
    await app.vault.modify(cur, withBoth);
  }
  new import_obsidian4.Notice("Inserted Next/Previous links.");
}

// src/commands/addFolderIndex.ts
var import_obsidian5 = require("obsidian");

// src/lib/textUtils.ts
function articleStyle(name) {
  if (name.endsWith(", The")) return `The ${name.slice(0, -5)}`;
  if (name.endsWith(", A")) return `A ${name.slice(0, -3)}`;
  return name;
}
function nowStamp() {
  const d = /* @__PURE__ */ new Date();
  const weekday = d.toLocaleDateString(void 0, { weekday: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleDateString(void 0, { month: "long" });
  const year = d.getFullYear();
  const time = d.toLocaleTimeString(void 0, { hour12: false });
  return `${weekday}, ${day}. ${month} ${year}, ${time}`;
}

// src/commands/addFolderIndex.ts
var stripWikilinks = (s) => s.replace(/^\[\[|\]\]$/g, "");
function frontmatterAuthorFromFile(app, f) {
  const cache = app.metadataCache.getFileCache(f);
  const fm = cache?.frontmatter ?? {};
  let author = fm.author;
  if (typeof author === "string") author = author.replace(/^"\s*/, "").replace(/\s*"$/, "");
  const book_type = typeof fm.book_type === "string" ? fm.book_type.replace(/^"\s*/, "").replace(/\s*"$/, "") : void 0;
  return { author, book_type };
}
function formatAuthorField(author) {
  if (!author) return '"[[Unknown Author]]"';
  if (Array.isArray(author)) {
    return "\n  - " + author.map((a) => a.replace(/^\[\[|\]\]$/g, "")).map((a) => `[[${a}]]`).join("\n  - ");
  }
  const clean = author.replace(/^\[\[|\]\]$/g, "");
  return ` "[[${clean}]]"`;
}
async function createOrUpdateIndexForFolder(app, settings, folder, isBook) {
  const files = listMarkdownFiles(folder);
  if (!files.length) return false;
  let author = void 0;
  let bookType = void 0;
  for (const f of files) {
    const meta = frontmatterAuthorFromFile(app, f);
    if (meta.author) {
      author = meta.author;
      bookType = meta.book_type;
      break;
    }
  }
  const folderName = folder.name;
  const idxName = settings.indexFileNameMode === "article-style" ? articleStyle(folderName) : folderName;
  const indexPath = (0, import_obsidian5.normalizePath)(folder.path + "/" + idxName + ".md");
  const created = nowStamp();
  var props;
  if (isBook) {
    props = [
      `title: ${idxName}`,
      `created: ${created}`,
      `modified: ${created}`,
      `book_title: "[[${folderName}]]"`,
      ...bookType ? [`book_type: "[[${stripWikilinks(bookType)}]]"`] : [],
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
  const header = `---
${props}
---

# ${idxName}
`;
  const content = header + dataview;
  const existing = app.vault.getAbstractFileByPath(indexPath);
  if (existing instanceof import_obsidian5.TFile) {
    const cur = await app.vault.read(existing);
    if (/```dataview/.test(cur)) return false;
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
async function commandAddFolderIndex(app, settings, params) {
  const baseFolder = params?.folder ?? settings.baseFolder;
  const folders = getLeafFoldersUnder(app, baseFolder);
  if (!folders.length) {
    new import_obsidian5.Notice(`No leaf folders under ${baseFolder}`);
    return;
  }
  let changed = 0;
  for (const folder of folders) {
    const did = await createOrUpdateIndexForFolder(app, settings, folder, true);
    if (did) changed++;
  }
  new import_obsidian5.Notice(changed > 0 ? `Folder indexes created/updated: ${changed}` : "No changes; indexes already present.");
}
async function commandAddIndexForCurrentFolder(app, settings) {
  const active = app.workspace.getActiveFile();
  const folder = active?.parent;
  if (!active || !folder) {
    new import_obsidian5.Notice("Open a file inside the target folder.");
    return;
  }
  const did = await createOrUpdateIndexForFolder(app, settings, folder, false);
  new import_obsidian5.Notice(did ? `Index created/updated for \u201C${folder.name}\u201D.` : `No index change in \u201C${folder.name}\u201D.`);
}

// src/protocol.ts
function registerProtocol(plugin) {
  plugin.registerObsidianProtocolHandler("obsidian-bible-tools", async (params) => {
    const action = params.action ?? "";
    switch (action) {
      case "link-verses":
        await commandVerseLinks(plugin.app, plugin.settings, params);
        break;
      case "add-next-previous":
        await commandAddNextPrevious(plugin.app, plugin.settings, params);
        break;
      case "add-folder-index":
        await commandAddFolderIndex(plugin.app, plugin.settings, params);
        break;
      default:
        break;
    }
  });
}

// src/icons.ts
var ICONS = {
  "obtb-book": `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6 4h10a2 2 0 0 1 2 2v12.5a1.5 1.5 0 0 0-1.5-1.5H6a2 2 0 0 0 0 4h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  "obtb-links": `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  "obtb-highlighter": `<svg viewBox="0 0 24 24"><path d="M3 16l6-6 5 5-6 6H3z" fill="currentColor"/><path d="M12 9l3-3 3 3-3 3z" fill="currentColor"/></svg>`,
  "obtb-summary": `<svg viewBox="0 0 24 24"><path d="M5 5h14M5 9h10M5 13h8M5 17h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`,
  "obtb-outline": `<svg viewBox="0 0 24 24"><path d="M7 6h10M7 12h10M7 18h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`,
  "obtb-formatter": `<svg viewBox="0 0 24 24"><path d="M5 7h6M5 12h10M5 17h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`,
  "obtb-bible": `<svg viewBox="0 0 24 24"><path d="M6.5 4h9A2.5 2.5 0 0 1 18 6.5V20H8.5A2.5 2.5 0 0 1 6 17.5V4.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 8h6M10 11h6" stroke="currentColor" stroke-width="2"/></svg>`
};
function registerIcons(addIcon2) {
  for (const [name, svg] of Object.entries(ICONS)) addIcon2(name, svg);
}

// src/commands/extractHighlightsFolder.ts
var import_obsidian6 = require("obsidian");
async function commandExtractHighlightsFolder(app, settings) {
  const view = app.workspace.getActiveFile();
  const startFolder = view?.parent ?? app.vault.getFolderByPath(settings.baseFolder);
  if (!(startFolder instanceof import_obsidian6.TFolder)) {
    new import_obsidian6.Notice("Open a file in the target folder or set a valid base folder.");
    return;
  }
  const all = [];
  const seen = /* @__PURE__ */ new Set();
  const markRegex = new RegExp(`<mark\\s+style=["']${settings.redMarkCss.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}["']>(.*?)</mark>`, "g");
  const files = listMarkdownFiles(startFolder).sort((a, b) => {
    const an = a.basename.match(/^\d+/)?.[0];
    const bn = b.basename.match(/^\d+/)?.[0];
    if (an && bn) return Number(an) - Number(bn);
    if (an) return -1;
    if (bn) return 1;
    return a.basename.localeCompare(b.basename);
  });
  for (const f of files) {
    const src = await app.vault.read(f);
    const local = [];
    let m;
    markRegex.lastIndex = 0;
    while ((m = markRegex.exec(src)) !== null) {
      const text = m[1].trim();
      if (!text) continue;
      if (!seen.has(text)) {
        seen.add(text);
        if (!local.includes(text)) local.push(text);
      }
    }
    if (local.length) {
      all.push(`
#### [[${f.basename}]]
` + local.map((t) => `- ${t}`).join("\n"));
    }
  }
  if (!all.length) {
    new import_obsidian6.Notice("No highlights found in folder.");
    return;
  }
  const out = all.join("\n");
  const target = startFolder.path + "/Highlights.md";
  const existing = app.vault.getFileByPath(target);
  if (existing) await app.vault.modify(existing, out);
  else await app.vault.create(target, out);
  new import_obsidian6.Notice("Highlights.md created.");
}

// src/commands/extractRedHighlights.ts
var import_obsidian7 = require("obsidian");
async function commandExtractRedHighlights(app, settings) {
  const file = app.workspace.getActiveFile();
  if (!file) {
    new import_obsidian7.Notice("Open a file first.");
    return;
  }
  const src = await app.vault.read(file);
  const markRegex = new RegExp(`<mark\\s+style=["']${settings.redMarkCss.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}["']>(.*?)</mark>`, "g");
  const hits = [];
  let m;
  while ((m = markRegex.exec(src)) !== null) {
    const text = m[1].trim();
    if (text && !hits.includes(text)) hits.push(text);
  }
  if (!hits.length) {
    new import_obsidian7.Notice("No red highlights found.");
    return;
  }
  const section = [
    "> [!summary]- Highlights",
    ...hits.map((h) => `> - ${h}`),
    ""
  ].join("\n");
  const merged = insertAfterYamlOrH1(src, section);
  await app.vault.modify(file, merged);
  new import_obsidian7.Notice("Highlights section inserted.");
}

// src/commands/outlineExtractor.ts
var import_obsidian8 = require("obsidian");
async function commandOutlineExtractor(app, _settings) {
  const file = app.workspace.getActiveFile();
  if (!file) {
    new import_obsidian8.Notice("Open a file first.");
    return;
  }
  const original = await app.vault.read(file);
  const lines = original.split(/\r?\n/);
  const outlineLines = [];
  for (const line of lines) {
    const m = line.match(/^(#{2,6}) (.+)/);
    if (m) {
      const hashes = m[1];
      let content = m[2];
      const level = hashes.length - 2;
      const indent = "	".repeat(Math.max(0, level - 1));
      if (level === 0) content = `**${content}**`;
      outlineLines.push(`${indent}${content}`);
    }
  }
  if (outlineLines.length === 0) {
    new import_obsidian8.Notice("No headings (##..######) found.");
    return;
  }
  let insertIndex = null;
  const lookback = Math.min(4, lines.length);
  for (let i = 1; i <= lookback; i++) {
    const ln = lines[lines.length - i];
    if (/\|Next\]\]|\|Previous\]\]/.test(ln)) {
      insertIndex = lines.length - i;
      break;
    }
  }
  const outlineText = "## Outline\n" + outlineLines.join("\n") + "\n\n";
  if (insertIndex !== null) {
    const beforeStr = lines.slice(0, insertIndex).join("\n");
    const afterStr = lines.slice(insertIndex).join("\n");
    const newContent = (beforeStr.endsWith("\n") || beforeStr.length === 0 ? "" : "\n") + outlineText + afterStr;
    await app.vault.modify(file, beforeStr + newContent);
  } else {
    const newContent = original + (original.endsWith("\n") ? "" : "\n") + outlineText;
    await app.vault.modify(file, newContent);
  }
  new import_obsidian8.Notice("Outline appended successfully.");
}

// src/commands/outlineFormatter.ts
var import_obsidian10 = require("obsidian");

// src/lib/outlineUtils.ts
var import_obsidian9 = require("obsidian");
function romanToInt(roman) {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1e3 };
  let result = 0, prev = 0;
  for (let i = roman.length - 1; i >= 0; i--) {
    const val = map[roman[i]];
    if (!val) return NaN;
    result += val < prev ? -val : val;
    prev = val;
  }
  return result;
}
var isRoman = (s) => /^[IVXLCDM]+$/.test(s);
var isAlphaUpper = (s) => /^[A-Z]$/.test(s);
function getMdPrefixFromLevel(level) {
  switch (level) {
    case 2:
      return "##";
    case 3:
      return "###";
    case 4:
      return "####";
    case 5:
      return "#####";
    case 6:
      return "######";
    default:
      return "######";
  }
}
function parseHeadingStart(s) {
  const m = s.match(/^\s*(?<roman>[IVXLCDM]+)(?<delim>\.\)|[.)])\s+(?<rest>.+)$/) || s.match(/^\s*(?<upper>[A-Z])(?<delim>\.\)|[.)])\s+(?<rest>.+)$/) || s.match(/^\s*(?<num>\d+)(?<delim>\.\)|[.)])\s+(?<rest>.+)$/) || s.match(/^\s*\(\s*(?<pnum>\d+)\s*\)\s+(?<rest>.+)$/) || s.match(/^\s*\(\s*(?<plow>[a-z])\s*\)\s+(?<rest>.+)$/) || s.match(/^\s*(?<low>[a-z])(?<delim>\.\)|[.)])\s+(?<rest>.+)$/);
  if (!m) return null;
  const g = m.groups || {};
  let label = "";
  let delim = g.delim ?? null;
  if (g.roman) label = g.roman;
  else if (g.upper) label = g.upper;
  else if (g.num) label = g.num;
  else if (g.pnum) {
    label = `(${g.pnum})`;
    delim = ")";
  } else if (g.plow) {
    label = `(${g.plow})`;
    delim = ")";
  } else if (g.low) label = g.low;
  let token = "";
  if (g.roman) token = `${g.roman}${delim ?? "."}`;
  else if (g.upper) token = `${g.upper}${delim ?? "."}`;
  else if (g.num) token = `${g.num}${delim ?? "."}`;
  else if (g.pnum) token = `(${g.pnum})`;
  else if (g.plow) token = `(${g.plow})`;
  else if (g.low) token = `${g.low}${delim ?? "."}`;
  return { token, label, rest: g.rest || "", delim };
}
function decideLevel(label, delim, prevRom, prevAlphaIdx) {
  if (/^\(\d+\)$/.test(label)) {
    return { level: 6, nextRom: prevRom, nextAlphaIdx: prevAlphaIdx };
  }
  if (/^\([a-z]+\)$/.test(label)) {
    return { level: "bullet", nextRom: prevRom, nextAlphaIdx: prevAlphaIdx };
  }
  if (/^\d+$/.test(label)) {
    if (delim === ")") {
      return { level: 6, nextRom: prevRom, nextAlphaIdx: prevAlphaIdx };
    }
    return { level: 4, nextRom: prevRom, nextAlphaIdx: prevAlphaIdx };
  }
  if (isRoman(label)) {
    const romVal = romanToInt(label);
    const fitsRoman = !prevRom || romanToInt(prevRom) + 1 === romVal;
    const alphaVal = isAlphaUpper(label) ? label.charCodeAt(0) - 64 : null;
    const fitsAlpha = prevAlphaIdx == null ? true : alphaVal != null && alphaVal === prevAlphaIdx + 1;
    if (fitsRoman && !fitsAlpha) {
      return { level: 2, nextRom: label, nextAlphaIdx: prevAlphaIdx };
    } else if (fitsAlpha && !fitsRoman) {
      return { level: 3, nextRom: prevRom, nextAlphaIdx: alphaVal ?? 1 };
    } else if (fitsRoman && fitsAlpha) {
      return { level: 3, nextRom: prevRom, nextAlphaIdx: alphaVal ?? 1 };
    } else {
      return { level: 2, nextRom: label, nextAlphaIdx: prevAlphaIdx };
    }
  }
  if (isAlphaUpper(label)) {
    return { level: 3, nextRom: prevRom, nextAlphaIdx: label.charCodeAt(0) - 64 };
  }
  if (/^[a-z]$/.test(label)) {
    if (delim === ")") {
      return { level: "bullet", nextRom: prevRom, nextAlphaIdx: prevAlphaIdx };
    }
    return { level: 5, nextRom: prevRom, nextAlphaIdx: prevAlphaIdx };
  }
  return { level: "bullet", nextRom: prevRom, nextAlphaIdx: prevAlphaIdx };
}
var HYPH = `-\\u00AD\\u2010\\u2011\\u2012\\u2013\\u2014`;
var INLINE_HYPHEN_BREAK_RE = new RegExp(`([A-Za-z\xC0-\xD6\xD8-\xF6\xF8-\xFF])[${HYPH}]\\s+([a-z\xE0-\xF6\xF8-\xFF])`, "g");
var TRAILING_HYPHEN_AT_END_RE = new RegExp(`[A-Za-z\xC0-\xD6\xD8-\xF6\xF8-\xFF][${HYPH}]\\s*$`);
function fixInlineHyphens(s) {
  return s.replace(INLINE_HYPHEN_BREAK_RE, "$1$2");
}
function appendWithWordBreakFix(buf, next, fix) {
  if (fix) {
    if (TRAILING_HYPHEN_AT_END_RE.test(buf) && /^[a-zà-öø-ÿ]/.test(next)) {
      return buf.replace(new RegExp(`[${HYPH}]\\s*$`), "") + next;
    }
    const joined = (buf + " " + next).replace(/\s+/g, " ");
    return fixInlineHyphens(joined);
  }
  return (buf + " " + next).replace(/\s+/g, " ");
}
var TOKEN_START_SRC = String.raw`(?:[IVXLCDM]+[.)]|[A-Z][.)]|[a-z][.)]|\d+[.)]|$begin:math:text$[a-zA-Z0-9]+$end:math:text$)`;
var AFTER_PUNCT_SPLIT_RE = new RegExp(
  String.raw`([:;!?)]|—\s*v\.\s*\d+[a-z]?:)\s+(?=` + TOKEN_START_SRC + String.raw`\s+)`,
  "gi"
);
var AFTER_SENT_TOKEN_SPLIT_RE = new RegExp(
  String.raw`(?<!\b[vV][vV]\.)(?<!\b[vV]\.)(?<!\bS\.\s*S)\.\s+(?=` + TOKEN_START_SRC + String.raw`\s+)`,
  "g"
);
var SENTINEL = "\uE000";
function protectSpans(s) {
  s = s.replace(/\b([vV])\.\s+(\d+[a-z]?)(?=[^\d]|$)/g, (_m, v, n) => `${v}.` + SENTINEL + n);
  s = s.replace(
    /\b([vV])([vV])\.\s+(\d+[a-z]?)(\s*[-–—]\s*\d+[a-z]?)?/g,
    (_m, v1, v2, a, rng) => `${v1}${v2}.` + SENTINEL + a + (rng ?? "")
  );
  s = s.replace(/\bS\.\s*S\./g, (m) => m.replace(/\s+/, SENTINEL));
  return s;
}
function unprotectSpans(s) {
  return s.replace(new RegExp(SENTINEL, "g"), " ");
}
function splitInlineSegments(line) {
  let s = protectSpans(line);
  s = s.replace(AFTER_PUNCT_SPLIT_RE, (_m, p1) => `${p1}
`);
  s = s.replace(AFTER_SENT_TOKEN_SPLIT_RE, ".\n");
  s = unprotectSpans(s);
  return s.split("\n").map((x) => x.trim()).filter(Boolean);
}
async function formatOutlineText(textOrLines, {
  splitInlineSubpoints = true,
  fixHyphenatedBreaks = true,
  outputLineSeparator = "\n",
  dropPurePageNumberLines = false
} = {}, settings) {
  let raw = Array.isArray(textOrLines) ? textOrLines.join("\n") : textOrLines;
  {
    const head = raw.slice(0, 2e3);
    const tail = raw.slice(2e3);
    const headPatched = head.replace(
      /(^|[^A-Za-z0-9])I\.\s+(?=[A-Z])(?!\s*S\.)/m,
      (_m, pre) => `${pre}
I. `
    );
    raw = headPatched + tail;
  }
  const lines = raw.split(/\r?\n/);
  const out = [];
  let buf = "";
  let prevRoman = null;
  let prevAlphaIdx = null;
  const emitBuffer = (raw2) => {
    let base = raw2.trim();
    if (!base) return;
    if (!splitInlineSubpoints) {
      out.push(base);
      return;
    }
    const parts = splitInlineSegments(base).map((seg) => seg.replace(/^\d{1,3}\s+[A-Z][A-Z]+(?:[ -][A-Z][A-Z]+)*/, "").trim()).filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
      let part = parts[i];
      if (fixHyphenatedBreaks) part = fixInlineHyphens(part);
      let parsed = parseHeadingStart(part);
      if (!parsed) {
        out.push(part);
        continue;
      }
      const { token, label, rest, delim } = parsed;
      const { level, nextRom, nextAlphaIdx } = decideLevel(label.replace(/[.)]$/, ""), delim, prevRoman, prevAlphaIdx);
      prevRoman = nextRom;
      prevAlphaIdx = nextAlphaIdx;
      if (level === "bullet") {
        out.push(`${getMdPrefixFromLevel(level)} * ${token} ${rest}`.replace(/\s+/g, " ").trim());
      } else {
        const prefix = getMdPrefixFromLevel(level);
        out.push(`${prefix} ${token} ${rest}`.replace(/\s+/g, " ").trim());
      }
    }
  };
  for (let raw2 of lines) {
    let line = raw2.trim();
    if (!line) continue;
    if (dropPurePageNumberLines && /^\d+$/.test(line)) continue;
    if (fixHyphenatedBreaks) line = fixInlineHyphens(line);
    let parsed = parseHeadingStart(line);
    const prevEndsWithVerse = /\b[vV]{1,2}\.\s*$/.test(buf);
    if (parsed && /^\d+$/.test(parsed.label) && prevEndsWithVerse) {
      parsed = null;
    }
    if (parsed) {
      if (buf) emitBuffer(buf);
      buf = "";
      const { token, label, rest, delim } = parsed;
      const { level, nextRom, nextAlphaIdx } = decideLevel(label, delim, prevRoman, prevAlphaIdx);
      prevRoman = nextRom;
      prevAlphaIdx = nextAlphaIdx;
      if (level === "bullet") {
        buf = `${getMdPrefixFromLevel(level)} * ${token} ${rest}`.trim();
      } else {
        const prefix = getMdPrefixFromLevel(level);
        buf = `${prefix} ${token} ${rest}`.trim();
      }
    } else {
      buf = buf ? appendWithWordBreakFix(buf, line, fixHyphenatedBreaks) : line;
    }
  }
  if (buf) emitBuffer(buf);
  let result = out.join(outputLineSeparator);
  if (settings.autoLinkVerses) {
    result = await linkVersesInText(result, settings);
  }
  new import_obsidian9.Notice("Outline formatted" + (settings.autoLinkVerses ? " + verses linked." : "."));
  return result;
}

// src/commands/outlineFormatter.ts
async function commandOutlineFormatter(app, settings) {
  const file = app.workspace.getActiveFile();
  if (!file) {
    new import_obsidian10.Notice("Open a file first.");
    return;
  }
  const src = await app.vault.read(file);
  const out = await formatOutlineText(src, {
    splitInlineSubpoints: true,
    // splits "... v. 9: a. ... b. ...", but NOT on "."
    fixHyphenatedBreaks: true,
    // fixes "illus- trated" → "illustrated"
    dropPurePageNumberLines: true
    // optional: drops "14", "15", "16"
  }, settings);
  await app.vault.modify(file, out);
  new import_obsidian10.Notice("Outline formatted.");
}

// src/commands/generateBible.ts
var import_obsidian11 = require("obsidian");

// src/lib/verseMap.ts
var BOOK_ABBR2 = {
  "Genesis": "Gen",
  "Exodus": "Exo",
  "Leviticus": "Lev",
  "Numbers": "Num",
  "Deuteronomy": "Deut",
  "Joshua": "Josh",
  "Judges": "Judg",
  "Ruth": "Ruth",
  "1 Samuel": "1 Sam",
  "First Samuel": "1 Sam",
  "2 Samuel": "2 Sam",
  "Second Samuel": "2 Sam",
  "1 Kings": "1 Kings",
  "First Kings": "1 Kings",
  "2 Kings": "2 Kings",
  "Second Kings": "2 Kings",
  "1 Chronicles": "1 Chron",
  "First Chronicles": "1 Chron",
  "2 Chronicles": "2 Chron",
  "Second Chronicles": "2 Chron",
  "Ezra": "Ezra",
  "Nehemiah": "Neh",
  "Esther": "Esth",
  "Job": "Job",
  "Psalms": "Psa",
  "Psalm": "Psa",
  "Proverbs": "Prov",
  "Ecclesiastes": "Eccl",
  "Song of Songs": "S.S.",
  "Song of Solomon": "S.S.",
  "Isaiah": "Isa",
  "Jeremiah": "Jer",
  "Lamentations": "Lam",
  "Ezekiel": "Ezek",
  "Daniel": "Dan",
  "Hosea": "Hosea",
  "Joel": "Joel",
  "Amos": "Amos",
  "Obadiah": "Obad",
  "Jonah": "Jonah",
  "Micah": "Micah",
  "Nahum": "Nahum",
  "Habakkuk": "Hab",
  "Zephaniah": "Zeph",
  "Haggai": "Hag",
  "Zechariah": "Zech",
  "Malachi": "Mal",
  "Matthew": "Matt",
  "Mark": "Mark",
  "Luke": "Luke",
  "John": "John",
  "Acts": "Acts",
  "Romans": "Rom",
  "1 Corinthians": "1 Cor",
  "First Corinthians": "1 Cor",
  "2 Corinthians": "2 Cor",
  "Second Corinthians": "2 Cor",
  "Galatians": "Gal",
  "Ephesians": "Eph",
  "Philippians": "Phil",
  "Colossians": "Col",
  "1 Thessalonians": "1 Thes",
  "First Thessalonians": "1 Thes",
  "2 Thessalonians": "2 Thes",
  "Second Thessalonians": "2 Thes",
  "1 Timothy": "1 Tim",
  "First Timothy": "1 Tim",
  "2 Timothy": "2 Tim",
  "Second Timothy": "2 Tim",
  "Titus": "Titus",
  "Philemon": "Philem",
  "Hebrews": "Heb",
  "James": "James",
  "1 Peter": "1 Pet",
  "First Peter": "1 Pet",
  "2 Peter": "2 Pet",
  "Second Peter": "2 Pet",
  "1 John": "1 John",
  "First John": "1 John",
  "2 John": "2 John",
  "Second John": "2 John",
  "3 John": "3 John",
  "Third John": "3 John",
  "Jude": "Jude",
  "Revelation": "Rev"
};
var ALL_BOOK_TOKENS = (() => {
  const set = /* @__PURE__ */ new Set();
  for (const [k, v] of Object.entries(BOOK_ABBR2)) {
    set.add(k);
    set.add(v);
  }
  return [...set].sort((a, b) => b.length - a.length);
})();

// src/commands/generateBible.ts
var BOLLS = {
  LANGUAGES_URL: "https://bolls.life/static/bolls/app/views/languages.json",
  GET_BOOKS: (tr) => `https://bolls.life/get-books/${encodeURIComponent(tr)}/`,
  GET_CHAPTER: (tr, bookId, ch) => `https://bolls.life/get-text/${encodeURIComponent(tr)}/${bookId}/${ch}/`
};
var CANON_EN_BY_ID = {
  1: "Genesis",
  2: "Exodus",
  3: "Leviticus",
  4: "Numbers",
  5: "Deuteronomy",
  6: "Joshua",
  7: "Judges",
  8: "Ruth",
  9: "1 Samuel",
  10: "2 Samuel",
  11: "1 Kings",
  12: "2 Kings",
  13: "1 Chronicles",
  14: "2 Chronicles",
  15: "Ezra",
  16: "Nehemiah",
  17: "Esther",
  18: "Job",
  19: "Psalms",
  20: "Proverbs",
  21: "Ecclesiastes",
  22: "Song of Songs",
  23: "Isaiah",
  24: "Jeremiah",
  25: "Lamentations",
  26: "Ezekiel",
  27: "Daniel",
  28: "Hosea",
  29: "Joel",
  30: "Amos",
  31: "Obadiah",
  32: "Jonah",
  33: "Micah",
  34: "Nahum",
  35: "Habakkuk",
  36: "Zephaniah",
  37: "Haggai",
  38: "Zechariah",
  39: "Malachi",
  40: "Matthew",
  41: "Mark",
  42: "Luke",
  43: "John",
  44: "Acts",
  45: "Romans",
  46: "1 Corinthians",
  47: "2 Corinthians",
  48: "Galatians",
  49: "Ephesians",
  50: "Philippians",
  51: "Colossians",
  52: "1 Thessalonians",
  53: "2 Thessalonians",
  54: "1 Timothy",
  55: "2 Timothy",
  56: "Titus",
  57: "Philemon",
  58: "Hebrews",
  59: "James",
  60: "1 Peter",
  61: "2 Peter",
  62: "1 John",
  63: "2 John",
  64: "3 John",
  65: "Jude",
  66: "Revelation"
};
function shortAbbrFor(bookId, incomingName) {
  const canon = CANON_EN_BY_ID[bookId];
  if (canon && BOOK_ABBR2[canon]) return BOOK_ABBR2[canon];
  if (BOOK_ABBR2[incomingName]) return BOOK_ABBR2[incomingName];
  return incomingName;
}
async function fetchJson2(url) {
  try {
    const resp = await (0, import_obsidian11.requestUrl)({ url, method: "GET" });
    if (resp.status < 200 || resp.status >= 300) {
      throw new Error(`${resp.status} Request failed`);
    }
    const text = resp.text ?? "";
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON from ${url}`);
    }
  } catch (err) {
    try {
      const r = await fetch(url, { method: "GET" });
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return await r.json();
    } catch (e) {
      throw err instanceof Error ? err : new Error(String(err));
    }
  }
}
function htmlToText(html) {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?(i|em|strong|b|u|sup|sub|span|p|div|blockquote|small|font)[^>]*>/gi, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
var BuildBibleModal = class extends import_obsidian11.Modal {
  constructor(app, settings) {
    super(app);
    // Data from languages.json
    this.langBlocks = [];
    // UI state
    this.languageKey = "ALL";
    // "ALL" or the exact LanguagesEntry.language string
    this.translationCode = "KJV";
    this.translationFull = "King James Version";
    this.concurrency = 4;
    this.working = false;
    this.appRef = app;
    this.settings = settings;
    this.includeVersionInFileName = settings.bibleIncludeVersionInFilename ?? true;
    this.versionAsSubfolder = settings.bibleIncludeVersionInFilename ?? true;
    this.autoFrontmatter = settings.bibleAddFrontmatter ?? false;
  }
  translationsForLanguage(langKey) {
    if (langKey === "ALL") {
      const all = [];
      for (const block2 of this.langBlocks) all.push(...block2.translations);
      const seen = /* @__PURE__ */ new Set();
      return all.filter((t) => {
        if (seen.has(t.short_name)) return false;
        seen.add(t.short_name);
        return true;
      }).sort((a, b) => a.short_name.localeCompare(b.short_name));
    }
    const block = this.langBlocks.find((b) => b.language === langKey);
    if (!block) return [];
    return block.translations.slice().sort((a, b) => a.short_name.localeCompare(b.short_name));
  }
  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText("Build _Bible from bolls.life");
    try {
      const raw = await fetchJson2(BOLLS.LANGUAGES_URL);
      this.langBlocks = (raw || []).filter((b) => Array.isArray(b.translations) && b.translations.length > 0);
    } catch (e) {
      console.warn("[Bolls] Could not fetch languages.json:", e);
      this.langBlocks = [{
        language: "English",
        translations: [
          { short_name: "KJV", full_name: "King James Version 1769 with Apocrypha and Strong's Numbers" },
          { short_name: "WEB", full_name: "World English Bible" },
          { short_name: "YLT", full_name: "Young's Literal Translation (1898)" }
        ]
      }];
    }
    new import_obsidian11.Setting(contentEl).setName("Language").addDropdown((dd) => {
      dd.selectEl.style.maxWidth = "300px";
      dd.selectEl.style.textOverflow = "ellipsis";
      dd.selectEl.style.overflow = "hidden";
      dd.selectEl.style.whiteSpace = "nowrap";
      dd.addOption("ALL", "All languages");
      for (const block of this.langBlocks) {
        dd.addOption(block.language, block.language);
      }
      dd.setValue(this.languageKey);
      dd.onChange((v) => {
        this.languageKey = v;
        rebuildVersions();
      });
    });
    const versionsContainer = contentEl.createDiv();
    const rebuildVersions = () => {
      versionsContainer.empty();
      const list = this.translationsForLanguage(this.languageKey);
      new import_obsidian11.Setting(versionsContainer).setName("Version").addDropdown((dd) => {
        dd.selectEl.style.maxWidth = "300px";
        dd.selectEl.style.textOverflow = "ellipsis";
        dd.selectEl.style.overflow = "hidden";
        dd.selectEl.style.whiteSpace = "nowrap";
        if (!list.length) {
          dd.addOption("", "(no translations for this language)");
          dd.setValue("");
        } else {
          for (const t2 of list) {
            dd.addOption(t2.short_name, `${t2.short_name} \u2014 ${t2.full_name}`);
          }
          const exists = list.some((t2) => t2.short_name === this.translationCode);
          const chosen = exists ? this.translationCode : list[0].short_name;
          dd.setValue(chosen);
          this.translationCode = chosen;
          const t = list.find((x) => x.short_name === chosen);
          this.translationFull = t?.full_name ?? chosen;
          dd.onChange((v) => {
            this.translationCode = v;
            const tt = list.find((x) => x.short_name === v);
            this.translationFull = tt?.full_name ?? v;
          });
        }
      });
    };
    rebuildVersions();
    new import_obsidian11.Setting(contentEl).setName("Append version to file name").setDesc(`"John (KJV)" vs "John"`).addToggle((t) => t.setValue(this.includeVersionInFileName).onChange((v) => this.includeVersionInFileName = v));
    new import_obsidian11.Setting(contentEl).setName("Place books under version subfolder").setDesc(`"_Bible/KJV/John (KJV)" vs "_Bible/John"`).addToggle((t) => t.setValue(this.versionAsSubfolder).onChange((v) => this.versionAsSubfolder = v));
    new import_obsidian11.Setting(contentEl).setName("Auto-add frontmatter").setDesc("Insert YAML with title/version/created into each book file").addToggle((t) => t.setValue(this.autoFrontmatter).onChange((v) => this.autoFrontmatter = v));
    new import_obsidian11.Setting(contentEl).setName("Concurrency").setDesc("How many chapters to download in parallel").addSlider((s) => s.setLimits(1, 8, 1).setValue(this.concurrency).onChange((v) => this.concurrency = v).setDynamicTooltip());
    const progWrap = contentEl.createDiv({ cls: "bolls-progress" });
    this.progressEl = progWrap.createEl("progress", { attr: { max: "100", value: "0", style: "width:100%" } });
    this.statusEl = progWrap.createDiv({ text: "Idle." });
    const btns = contentEl.createDiv({ cls: "bolls-actions" });
    this.startBtn = btns.createEl("button", { text: "Start" });
    this.startBtn.onclick = () => this.start();
    const cancelBtn = btns.createEl("button", { text: "Close" });
    cancelBtn.onclick = () => this.close();
  }
  async start() {
    if (this.working) return;
    this.working = true;
    this.startBtn.disabled = true;
    const code = this.translationCode.trim();
    if (!code) {
      new import_obsidian11.Notice("Choose or enter a translation code.");
      this.working = false;
      this.startBtn.disabled = false;
      return;
    }
    try {
      await buildBibleFromBolls(this.appRef, {
        translationCode: code,
        translationFull: this.translationFull || code,
        includeVersionInFileName: this.includeVersionInFileName,
        versionAsSubfolder: this.versionAsSubfolder,
        autoFrontmatter: this.autoFrontmatter,
        concurrency: this.concurrency
      }, (done, total, msg) => {
        this.progressEl.max = total;
        this.progressEl.value = done;
        this.statusEl.setText(`${done}/${total} \xB7 ${msg}`);
      });
      this.statusEl.setText("Done.");
    } catch (e) {
      console.error(e);
      new import_obsidian11.Notice(`Bible build failed: ${e?.message ?? e}`);
    } finally {
      this.working = false;
      this.startBtn.disabled = false;
    }
  }
};
function nowIsoDate() {
  const d = /* @__PURE__ */ new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
async function ensureFolder(app, path) {
  const np = (0, import_obsidian11.normalizePath)(path.replace(/\/+$/, ""));
  let f = app.vault.getAbstractFileByPath(np);
  if (f instanceof import_obsidian11.TFolder) return f;
  await app.vault.createFolder(np);
  const created = app.vault.getAbstractFileByPath(np);
  if (created instanceof import_obsidian11.TFolder) return created;
  throw new Error(`Failed to create folder: ${np}`);
}
function buildBookFilename(baseShort, code, includeVersion) {
  return includeVersion ? `${baseShort} (${code})` : baseShort;
}
function chapterNavLine(bookShort, chapters) {
  const parts = [];
  for (let c = 1; c <= chapters; c++) {
    const lab = c % 5 === 0 || c === 1 || c === chapters ? String(c) : "\u2022";
    parts.push(`[[${bookShort}#^${c}|${lab}]]`);
  }
  return `
**ch.** ${parts.join(" ")}
`;
}
async function buildBibleFromBolls(app, opts, onProgress) {
  const baseFolder = "_Bible";
  const root = await ensureFolder(app, baseFolder);
  const parent = opts.versionAsSubfolder ? await ensureFolder(app, `${baseFolder}/${opts.translationCode}`) : root;
  let books = [];
  try {
    books = await fetchJson2(BOLLS.GET_BOOKS(opts.translationCode));
  } catch (e) {
    throw new Error(`Could not load books for ${opts.translationCode}: ${e?.message ?? e}`);
  }
  if (!books.length) throw new Error("No books returned from API.");
  const total = books.reduce((acc, b) => acc + (b.chapters || 0), 0);
  let done = 0;
  const errors = [];
  for (const book of books) {
    const shortBook = shortAbbrFor(book.bookid, book.name);
    const shortWithAbbr = `${shortBook}${opts.includeVersionInFileName ? ` (${opts.translationCode})` : ""}`;
    const fileBase = buildBookFilename(shortBook, opts.translationCode, opts.includeVersionInFileName);
    const targetPath = (0, import_obsidian11.normalizePath)(`${parent.path}/${fileBase}.md`);
    const headerLines = [];
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
    const chunks = [headerLines.join("\n")];
    const queue = Array.from({ length: book.chapters }, (_, i) => i + 1);
    const concurrency = Math.max(1, Math.min(8, opts.concurrency || 4));
    let next = 0;
    const workers = Array.from({ length: concurrency }, () => (async () => {
      while (next < queue.length) {
        const ch = queue[next++];
        try {
          onProgress(done, total, `${shortWithAbbr} ${ch}/${book.chapters}`);
          const verses = await fetchJson2(BOLLS.GET_CHAPTER(opts.translationCode, book.bookid, ch));
          const maxV = Math.max(0, ...verses.map((v) => v.verse));
          const vvNav = Array.from({ length: maxV }, (_, i) => i + 1).map((v) => `[[${shortWithAbbr}#^${ch}-${v}|${v % 5 === 0 ? v : "\u2022"}]]`).join(" ");
          const prevLink = ch > 1 ? `[[${shortWithAbbr}#^${ch - 1}|<- Previous]]` : "\u2190";
          const nextLink = ch < book.chapters ? `[[${shortWithAbbr}#^${ch + 1}|Next ->]]` : "\u2192";
          const mid = `[[${shortWithAbbr}#${shortWithAbbr}|${shortBook} ${ch} of ${book.chapters}]]`;
          const top = [
            "---",
            `${prevLink} | ${mid} | ${nextLink} | **vv.** ${vvNav} ^${ch}`,
            "\n---\n",
            ""
          ].join("\n");
          const versesMd = verses.map((v) => {
            const plain = htmlToText(v.text).trim();
            return `**${shortWithAbbr} ${ch}:${v.verse}** - ${plain} ^${ch}-${v.verse}`;
          }).join("\n\n");
          chunks[ch] = `${top}${versesMd}

`;
        } catch (e) {
          errors.push(`[${opts.translationCode}] ${shortBook} ch.${ch}: ${e?.message ?? e}`);
          chunks[ch] = `---
(${shortBook} ${ch}) \u2014 failed to download.
^${ch}
---

`;
        } finally {
          done++;
          onProgress(done, total, `${shortBook} ${Math.min(ch, book.chapters)}/${book.chapters}`);
        }
      }
    })());
    await Promise.all(workers);
    const bookContent = chunks.join("");
    const existing = app.vault.getAbstractFileByPath(targetPath);
    if (existing instanceof import_obsidian11.TFile) {
      await app.vault.modify(existing, bookContent);
    } else {
      await app.vault.create(targetPath, bookContent);
    }
  }
  if (errors.length) {
    new import_obsidian11.Notice(`Finished with ${errors.length} error(s).`);
  } else {
    new import_obsidian11.Notice("Finished without errors.");
  }
}
function commandBuildBibleFromBolls(app, _settings) {
  new BuildBibleModal(app, _settings).open();
}

// src/main.ts
var ObsidianBibleTools = class extends import_obsidian12.Plugin {
  async onload() {
    console.log("Loading Obsidian Bible Tools\u2026");
    registerIcons(import_obsidian12.addIcon);
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new BibleToolsSettingTab(this.app, this));
    this.addRibbonIcon("obtb-book", "Bible Tools: Folder Index", async () => {
      await commandAddFolderIndex(this.app, this.settings);
    });
    this.addCommand({
      id: "obtb-add-folder-index",
      name: "Create/Update Folder Index (Books)",
      icon: "obtb-book",
      callback: async () => commandAddFolderIndex(this.app, this.settings)
    });
    this.addCommand({
      id: "add-index-for-current-folder",
      name: "Create/Update Folder Index for Current Folder",
      icon: "list-ordered",
      callback: async () => {
        await commandAddIndexForCurrentFolder(this.app, this.settings);
      }
    });
    this.addCommand({
      id: "obtb-add-next-previous",
      name: "Insert Next/Previous Links (Current Folder)",
      icon: "obtb-links",
      callback: async () => commandAddNextPrevious(this.app, this.settings)
    });
    this.addCommand({
      id: "obtb-extract-red-highlights",
      name: "Extract Red Highlights to current file",
      icon: "obtb-highlighter",
      callback: async () => commandExtractRedHighlights(this.app, this.settings)
    });
    this.addCommand({
      id: "obtb-extract-highlights-folder",
      name: "Create Highlights.md from folder",
      icon: "obtb-summary",
      callback: async () => commandExtractHighlightsFolder(this.app, this.settings)
    });
    this.addCommand({
      id: "obtb-outline-extract",
      name: "Append Outline (from ##...###### headings)",
      icon: "obtb-outline",
      callback: async () => commandOutlineExtractor(this.app, this.settings)
    });
    this.addCommand({
      id: "obtb-outline-format",
      name: "Format Outline (Roman/A/1/a \u2192 Markdown headings) and Link Verses",
      icon: "obtb-formatter",
      callback: async () => commandOutlineFormatter(this.app, this.settings)
    });
    this.addCommand({
      id: "obtb-verse-links",
      name: "Auto-link Bible verses (file or folder)",
      icon: "obtb-bible",
      callback: async () => commandVerseLinks(this.app, this.settings)
    });
    this.addCommand({
      id: "link-verses-selection-or-line",
      name: "Link verses in selection (or current line)",
      icon: "link-2",
      // appears in mobile command bar
      editorCallback: async (_editor, _view) => {
        await commandVerseLinksSelectionOrLine(this.app, this.settings);
      }
    });
    this.addCommand({
      id: "build-bible-from-bolls",
      name: "Build _Bible (download from bolls.life)",
      icon: "book-open",
      callback: () => commandBuildBibleFromBolls(this.app, this.settings)
    });
    this.addCommand({
      id: "link-verses-current-choose-version",
      name: "Link verses (choose version\u2026)",
      callback: () => commandVerseLinksChooseVersion(this.app, this.settings)
    });
    this.addCommand({
      id: "link-verses-selection-or-line-choose-version",
      name: "Link verses in selection/line (choose version\u2026)",
      callback: () => commandVerseLinksSelectionOrLineChooseVersion(this.app, this.settings)
    });
    registerProtocol(this);
  }
  async onunload() {
    console.log("Unloading Obsidian Bible Tools\u2026");
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3NldHRpbmdzLnRzIiwgInNyYy9jb21tYW5kcy92ZXJzZUxpbmtzLnRzIiwgInNyYy9saWIvbWRVdGlscy50cyIsICJzcmMvY29tbWFuZHMvYWRkTmV4dFByZXZpb3VzLnRzIiwgInNyYy9jb21tYW5kcy9hZGRGb2xkZXJJbmRleC50cyIsICJzcmMvbGliL3RleHRVdGlscy50cyIsICJzcmMvcHJvdG9jb2wudHMiLCAic3JjL2ljb25zLnRzIiwgInNyYy9jb21tYW5kcy9leHRyYWN0SGlnaGxpZ2h0c0ZvbGRlci50cyIsICJzcmMvY29tbWFuZHMvZXh0cmFjdFJlZEhpZ2hsaWdodHMudHMiLCAic3JjL2NvbW1hbmRzL291dGxpbmVFeHRyYWN0b3IudHMiLCAic3JjL2NvbW1hbmRzL291dGxpbmVGb3JtYXR0ZXIudHMiLCAic3JjL2xpYi9vdXRsaW5lVXRpbHMudHMiLCAic3JjL2NvbW1hbmRzL2dlbmVyYXRlQmlibGUudHMiLCAic3JjL2xpYi92ZXJzZU1hcC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFBsdWdpbiwgYWRkSWNvbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzLCBERUZBVUxUX1NFVFRJTkdTLCBCaWJsZVRvb2xzU2V0dGluZ1RhYiB9IGZyb20gXCIuL3NldHRpbmdzXCI7XG5pbXBvcnQgeyByZWdpc3RlclByb3RvY29sIH0gZnJvbSBcIi4vcHJvdG9jb2xcIjtcbmltcG9ydCB7IHJlZ2lzdGVySWNvbnMgfSBmcm9tIFwiLi9pY29uc1wiO1xuXG4vLyBDb21tYW5kc1xuaW1wb3J0IHsgY29tbWFuZEFkZEZvbGRlckluZGV4LCBjb21tYW5kQWRkSW5kZXhGb3JDdXJyZW50Rm9sZGVyIH0gZnJvbSBcIi4vY29tbWFuZHMvYWRkRm9sZGVySW5kZXhcIjtcbmltcG9ydCB7IGNvbW1hbmRBZGROZXh0UHJldmlvdXMgfSBmcm9tIFwiLi9jb21tYW5kcy9hZGROZXh0UHJldmlvdXNcIjtcbmltcG9ydCB7IGNvbW1hbmRFeHRyYWN0SGlnaGxpZ2h0c0ZvbGRlciB9IGZyb20gXCIuL2NvbW1hbmRzL2V4dHJhY3RIaWdobGlnaHRzRm9sZGVyXCI7XG5pbXBvcnQgeyBjb21tYW5kRXh0cmFjdFJlZEhpZ2hsaWdodHMgfSBmcm9tIFwiLi9jb21tYW5kcy9leHRyYWN0UmVkSGlnaGxpZ2h0c1wiO1xuaW1wb3J0IHsgY29tbWFuZE91dGxpbmVFeHRyYWN0b3IgfSBmcm9tIFwiLi9jb21tYW5kcy9vdXRsaW5lRXh0cmFjdG9yXCI7XG5pbXBvcnQgeyBjb21tYW5kT3V0bGluZUZvcm1hdHRlciB9IGZyb20gXCIuL2NvbW1hbmRzL291dGxpbmVGb3JtYXR0ZXJcIjtcbmltcG9ydCB7IGNvbW1hbmRWZXJzZUxpbmtzLCBjb21tYW5kVmVyc2VMaW5rc0Nob29zZVZlcnNpb24sIGNvbW1hbmRWZXJzZUxpbmtzU2VsZWN0aW9uT3JMaW5lLCBjb21tYW5kVmVyc2VMaW5rc1NlbGVjdGlvbk9yTGluZUNob29zZVZlcnNpb24gfSBmcm9tIFwiLi9jb21tYW5kcy92ZXJzZUxpbmtzXCI7XG5pbXBvcnQgeyBjb21tYW5kQnVpbGRCaWJsZUZyb21Cb2xscyB9IGZyb20gXCIuL2NvbW1hbmRzL2dlbmVyYXRlQmlibGVcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2JzaWRpYW5CaWJsZVRvb2xzIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncztcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgY29uc29sZS5sb2coXCJMb2FkaW5nIE9ic2lkaWFuIEJpYmxlIFRvb2xzXHUyMDI2XCIpO1xuICAgIHJlZ2lzdGVySWNvbnMoYWRkSWNvbik7XG5cbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcblxuICAgIC8vIFNldHRpbmdzIFVJXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBCaWJsZVRvb2xzU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuXG4gICAgLy8gUmliYm9uIGljb24gKGRlc2t0b3ApXG4gICAgdGhpcy5hZGRSaWJib25JY29uKFwib2J0Yi1ib29rXCIsIFwiQmlibGUgVG9vbHM6IEZvbGRlciBJbmRleFwiLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBjb21tYW5kQWRkRm9sZGVySW5kZXgodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpO1xuICAgIH0pO1xuXG4gICAgLy8gQ29tbWFuZHNcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib2J0Yi1hZGQtZm9sZGVyLWluZGV4XCIsXG4gICAgICBuYW1lOiBcIkNyZWF0ZS9VcGRhdGUgRm9sZGVyIEluZGV4IChCb29rcylcIixcbiAgICAgIGljb246IFwib2J0Yi1ib29rXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4gY29tbWFuZEFkZEZvbGRlckluZGV4KHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImFkZC1pbmRleC1mb3ItY3VycmVudC1mb2xkZXJcIixcbiAgICAgIG5hbWU6IFwiQ3JlYXRlL1VwZGF0ZSBGb2xkZXIgSW5kZXggZm9yIEN1cnJlbnQgRm9sZGVyXCIsXG4gICAgICBpY29uOiBcImxpc3Qtb3JkZXJlZFwiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgY29tbWFuZEFkZEluZGV4Rm9yQ3VycmVudEZvbGRlcih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyk7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9idGItYWRkLW5leHQtcHJldmlvdXNcIixcbiAgICAgIG5hbWU6IFwiSW5zZXJ0IE5leHQvUHJldmlvdXMgTGlua3MgKEN1cnJlbnQgRm9sZGVyKVwiLFxuICAgICAgaWNvbjogXCJvYnRiLWxpbmtzXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4gY29tbWFuZEFkZE5leHRQcmV2aW91cyh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncylcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvYnRiLWV4dHJhY3QtcmVkLWhpZ2hsaWdodHNcIixcbiAgICAgIG5hbWU6IFwiRXh0cmFjdCBSZWQgSGlnaGxpZ2h0cyB0byBjdXJyZW50IGZpbGVcIixcbiAgICAgIGljb246IFwib2J0Yi1oaWdobGlnaHRlclwiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IGNvbW1hbmRFeHRyYWN0UmVkSGlnaGxpZ2h0cyh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncylcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvYnRiLWV4dHJhY3QtaGlnaGxpZ2h0cy1mb2xkZXJcIixcbiAgICAgIG5hbWU6IFwiQ3JlYXRlIEhpZ2hsaWdodHMubWQgZnJvbSBmb2xkZXJcIixcbiAgICAgIGljb246IFwib2J0Yi1zdW1tYXJ5XCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4gY29tbWFuZEV4dHJhY3RIaWdobGlnaHRzRm9sZGVyKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9idGItb3V0bGluZS1leHRyYWN0XCIsXG4gICAgICBuYW1lOiBcIkFwcGVuZCBPdXRsaW5lIChmcm9tICMjLi4uIyMjIyMjIGhlYWRpbmdzKVwiLFxuICAgICAgaWNvbjogXCJvYnRiLW91dGxpbmVcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiBjb21tYW5kT3V0bGluZUV4dHJhY3Rvcih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncylcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvYnRiLW91dGxpbmUtZm9ybWF0XCIsXG4gICAgICBuYW1lOiBcIkZvcm1hdCBPdXRsaW5lIChSb21hbi9BLzEvYSBcdTIxOTIgTWFya2Rvd24gaGVhZGluZ3MpIGFuZCBMaW5rIFZlcnNlc1wiLFxuICAgICAgaWNvbjogXCJvYnRiLWZvcm1hdHRlclwiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IGNvbW1hbmRPdXRsaW5lRm9ybWF0dGVyKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9idGItdmVyc2UtbGlua3NcIixcbiAgICAgIG5hbWU6IFwiQXV0by1saW5rIEJpYmxlIHZlcnNlcyAoZmlsZSBvciBmb2xkZXIpXCIsXG4gICAgICBpY29uOiBcIm9idGItYmlibGVcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiBjb21tYW5kVmVyc2VMaW5rcyh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncylcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJsaW5rLXZlcnNlcy1zZWxlY3Rpb24tb3ItbGluZVwiLFxuICAgICAgbmFtZTogXCJMaW5rIHZlcnNlcyBpbiBzZWxlY3Rpb24gKG9yIGN1cnJlbnQgbGluZSlcIixcbiAgICAgIGljb246IFwibGluay0yXCIsIC8vIGFwcGVhcnMgaW4gbW9iaWxlIGNvbW1hbmQgYmFyXG4gICAgICBlZGl0b3JDYWxsYmFjazogYXN5bmMgKF9lZGl0b3IsIF92aWV3KSA9PiB7XG4gICAgICAgIGF3YWl0IGNvbW1hbmRWZXJzZUxpbmtzU2VsZWN0aW9uT3JMaW5lKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKTtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyB0aGlzLmFkZENvbW1hbmQoe1xuICAgIC8vICAgaWQ6IFwiZ2VuZXJhdGUtYmlibGUtdmF1bHRcIixcbiAgICAvLyAgIG5hbWU6IFwiR2VuZXJhdGUgX0JpYmxlIGZvbGRlciBhbmQgZmlsZXNcdTIwMjZcIixcbiAgICAvLyAgIGNhbGxiYWNrOiAoKSA9PiBvcGVuQmlibGVCdWlsZE1vZGFsKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKSxcbiAgICAvLyB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJidWlsZC1iaWJsZS1mcm9tLWJvbGxzXCIsXG4gICAgICBuYW1lOiBcIkJ1aWxkIF9CaWJsZSAoZG93bmxvYWQgZnJvbSBib2xscy5saWZlKVwiLFxuICAgICAgaWNvbjogXCJib29rLW9wZW5cIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiBjb21tYW5kQnVpbGRCaWJsZUZyb21Cb2xscyh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyksXG4gICAgfSk7XG5cbiAgICAvLyBpbiBtYWluIHBsdWdpbiBmaWxlIChlLmcuLCBzcmMvbWFpbi50cykgaW5zaWRlIG9ubG9hZCgpXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImxpbmstdmVyc2VzLWN1cnJlbnQtY2hvb3NlLXZlcnNpb25cIixcbiAgICAgIG5hbWU6IFwiTGluayB2ZXJzZXMgKGNob29zZSB2ZXJzaW9uXHUyMDI2KVwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IGNvbW1hbmRWZXJzZUxpbmtzQ2hvb3NlVmVyc2lvbih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyksXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibGluay12ZXJzZXMtc2VsZWN0aW9uLW9yLWxpbmUtY2hvb3NlLXZlcnNpb25cIixcbiAgICAgIG5hbWU6IFwiTGluayB2ZXJzZXMgaW4gc2VsZWN0aW9uL2xpbmUgKGNob29zZSB2ZXJzaW9uXHUyMDI2KVwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IGNvbW1hbmRWZXJzZUxpbmtzU2VsZWN0aW9uT3JMaW5lQ2hvb3NlVmVyc2lvbih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyksXG4gICAgfSk7XG5cbiAgICAvLyBvYnNpZGlhbjovLyBwcm90b2NvbCBoYW5kbGVyIGZvciBjb21tYW5kIGxpbmUgdHJpZ2dlcnNcbiAgICByZWdpc3RlclByb3RvY29sKHRoaXMpO1xuICB9XG5cbiAgYXN5bmMgb251bmxvYWQoKSB7XG4gICAgY29uc29sZS5sb2coXCJVbmxvYWRpbmcgT2JzaWRpYW4gQmlibGUgVG9vbHNcdTIwMjZcIik7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTm90aWNlLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgT2JzaWRpYW5CaWJsZVRvb2xzIGZyb20gXCIuL21haW5cIjtcblxuZXhwb3J0IGludGVyZmFjZSBCaWJsZVRvb2xzU2V0dGluZ3Mge1xuICBiYXNlRm9sZGVyOiBzdHJpbmc7XG4gIHJlZE1hcmtDc3M6IHN0cmluZztcbiAgaW5kZXhGaWxlTmFtZU1vZGU6IFwiZm9sZGVyLW5hbWVcIiB8IFwiYXJ0aWNsZS1zdHlsZVwiO1xuICBzdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlOiBib29sZWFuOyAvLyBJZiB0cnVlLCBzdHJpcCBNYXJrZG93biBsaW5rcyB0aGF0IGxvb2sgbGlrZSBzY3JpcHR1cmUgcmVmZXJlbmNlcyAoZS5nLiwgW1JvbS4gMToxXSh1cmwpIFx1MjE5MiBSb20uIDE6MSlcbiAgcmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3M6IGJvb2xlYW47IC8vIElmIHRydWUsIHJlbW92ZSBPYnNpZGlhbiBkaXNwbGF5LXRleHQgbGlua3MgdGhhdCBsb29rIGxpa2Ugc2NyaXB0dXJlIHJlZmVyZW5jZXMgKGUuZy4sIFtbUm9tLiAxOjF8Um9tLiAxOjFdXSBcdTIxOTIgUm9tLiAxOjEpXG4gIHJld3JpdGVPbGRPYnNpZGlhbkxpbmtzOiBib29sZWFuOyAvLyBJZiB0cnVlLCByZXdyaXRlIGxlZ2FjeSBPYnNpZGlhbiBsaW5rcyAoZS5nLiwgW1tSb20gMSNeM3xcdTIwMjZdXSBcdTIxOTIgW1tSb20jXjEtM3xcdTIwMjZdXSkgYW5kIHJlbW92ZSBwcmV2aW91cyBPYnNpZGlhbiBsaW5rcyB0aGF0IGhhdmUgdmVyc2UtbGlrZSBkaXNwbGF5IHBhdHRlcm5cblxuICBhdXRvTGlua1ZlcnNlczogYm9vbGVhbjsgLy8gSWYgdHJ1ZSwgYXV0by1saW5rIHZlcnNlcyBpbiB0aGUgY3VycmVudCBmaWxlIHdoZW4gZm9ybWF0dGluZyBvdXRsaW5lc1xuXG4gIC8vIEJpYmxlIGdlbmVyYXRpb24gZGVmYXVsdHNcbiAgYmlibGVEZWZhdWx0VmVyc2lvbjogc3RyaW5nOyAgICAgICAgICAgICAgLy8gZS5nLiBcIktKVlwiXG4gIGJpYmxlRGVmYXVsdExhbmd1YWdlOiBzdHJpbmc7ICAgICAgICAgICAgIC8vIGUuZy4gXCJFbmdsaXNoXCIsXG4gIGJpYmxlSW5jbHVkZVZlcnNpb25JbkZpbGVuYW1lOiBib29sZWFuOyAgIC8vIFwiSm9obiAoS0pWKVwiICYgX0JpYmxlL0tKVi9cbiAgYmlibGVBZGRGcm9udG1hdHRlcjogYm9vbGVhbjsgICAgICAgICAgICAgLy8gYWRkIFlBTUwgZnJvbnRtYXR0ZXIgYXQgdG9wXG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBCaWJsZVRvb2xzU2V0dGluZ3MgPSB7XG4gIGJhc2VGb2xkZXI6IFwiQm9va3NcIixcbiAgcmVkTWFya0NzczogJ2JhY2tncm91bmQ6ICNGRjU1ODJBNjsnLFxuICBpbmRleEZpbGVOYW1lTW9kZTogXCJhcnRpY2xlLXN0eWxlXCIsXG4gIHN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2U6IHRydWUsXG4gIHJlbW92ZU9ic2lkaWFuRGlzcGxheUxpbmtzOiBmYWxzZSxcbiAgcmV3cml0ZU9sZE9ic2lkaWFuTGlua3M6IHRydWUsXG4gIGF1dG9MaW5rVmVyc2VzOiB0cnVlLFxuXG4gIC8vIEJpYmxlIGdlbmVyYXRpb24gZGVmYXVsdHNcbiAgYmlibGVEZWZhdWx0VmVyc2lvbjogXCJLSlZcIixcbiAgYmlibGVEZWZhdWx0TGFuZ3VhZ2U6IFwiRW5nbGlzaFwiLFxuICBiaWJsZUluY2x1ZGVWZXJzaW9uSW5GaWxlbmFtZTogdHJ1ZSxcbiAgYmlibGVBZGRGcm9udG1hdHRlcjogZmFsc2UsXG59O1xuXG5leHBvcnQgY2xhc3MgQmlibGVUb29sc1NldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcGx1Z2luOiBPYnNpZGlhbkJpYmxlVG9vbHM7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogT2JzaWRpYW5CaWJsZVRvb2xzKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJPYnNpZGlhbiBCaWJsZSBUb29scyBcdTIwMTQgU2V0dGluZ3NcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJEZWZhdWx0IGJhc2UgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIlJvb3QgZm9sZGVyIHRvIHNjYW4gd2hlbiBhIGNvbW1hbmQgbmVlZHMgYSBmb2xkZXIgKGUuZy4sIGluZGV4IGNyZWF0aW9uKS5cIilcbiAgICAgIC5hZGRUZXh0KHQgPT4gdC5zZXRQbGFjZWhvbGRlcihcIkJvb2tzXCIpLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmJhc2VGb2xkZXIpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodikgPT4geyB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYXNlRm9sZGVyID0gdiB8fCBcIkJvb2tzXCI7IGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpOyB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSW5kZXggZmlsZW5hbWUgbW9kZVwiKVxuICAgICAgLnNldERlc2MoJ0lmIGEgZm9sZGVyIGVuZHMgd2l0aCBcIiwgVGhlXCIgb3IgXCIsIEFcIiwgY29udmVydCB0byBcIlRoZSBcdTIwMjZcIiAvIFwiQSBcdTIwMjZcIi4nKVxuICAgICAgLmFkZERyb3Bkb3duKGRkID0+IGRkXG4gICAgICAgIC5hZGRPcHRpb24oXCJmb2xkZXItbmFtZVwiLCBcIktlZXAgZm9sZGVyIG5hbWVcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImFydGljbGUtc3R5bGVcIiwgXCJBcnRpY2xlIHN0eWxlIChcdTIwMTgsIFRoZVx1MjAxOSBcdTIxOTIgXHUyMDE4VGhlIFx1MjAyNlx1MjAxOSlcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmluZGV4RmlsZU5hbWVNb2RlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5kZXhGaWxlTmFtZU1vZGUgPSAodmFsdWUgYXMgXCJmb2xkZXItbmFtZVwiIHwgXCJhcnRpY2xlLXN0eWxlXCIpO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiUmVkIGhpZ2hsaWdodCBDU1NcIilcbiAgICAgIC5zZXREZXNjKFwiRXhhY3Qgc3R5bGUgYSA8bWFyaz4gdGFnIG11c3QgaGF2ZSB0byBiZSBjb25zaWRlcmVkIGEgcmVkIGhpZ2hsaWdodC5cIilcbiAgICAgIC5hZGRUZXh0KHQgPT4gdC5zZXRQbGFjZWhvbGRlcignYmFja2dyb3VuZDogI0ZGNTU4MkE2OycpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWRNYXJrQ3NzKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHYpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmVkTWFya0NzcyA9IHY7IGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpOyB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU3RyaXAgTWFya2Rvd24gbGlua3MgdGhhdCBsb29rIGxpa2Ugc2NyaXB0dXJlXCIpXG4gICAgICAuc2V0RGVzYyhcIlJlcGxhY2UgW1JvbS4gMToxXSh1cmwpIHdpdGggcGxhaW4gdGV4dCBiZWZvcmUgbGlua2luZyB0byBhbmNob3JzLlwiKVxuICAgICAgLmFkZFRvZ2dsZSh0ID0+IHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLnN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2UgPSB2OyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlJlbW92ZSBPYnNpZGlhbiBkaXNwbGF5LXRleHQgbGlua3MgdGhhdCBsb29rIGxpa2UgcmVmZXJlbmNlc1wiKVxuICAgICAgLnNldERlc2MoXCJJZiBbW1RhcmdldHxEaXNwbGF5XV0gbG9va3MgbGlrZSBhIHNjcmlwdHVyZSByZWYsIHJlcGxhY2UgaXQgd2l0aCBwbGFpbiB0ZXh0IGJlZm9yZSBsaW5raW5nIChzYW1lIGFzIHRoZSBQeXRob24gc2NyaXB0KS5cIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0XG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZW1vdmVPYnNpZGlhbkRpc3BsYXlMaW5rcylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJlbW92ZU9ic2lkaWFuRGlzcGxheUxpbmtzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgbmV3IE5vdGljZShcIlNhdmVkOiByZW1vdmUgT2JzaWRpYW4gZGlzcGxheS10ZXh0IGxpbmtzXCIpOyB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiUmV3cml0ZSBsZWdhY3kgT2JzaWRpYW4gbGlua3NcIilcbiAgICAgIC5zZXREZXNjKFwiQ29udmVydCBbW1JvbSAxI14zfFx1MjAyNl1dIFx1MjE5MiBbW1JvbSNeMS0zfFx1MjAyNl1dIGJlZm9yZSBsaW5raW5nIGFuZCByZW1vdmUgcHJldmlvdXMgT2JzaWRpYW4gbGlua3MgdGhhdCBoYXZlIHZlcnNlLWxpa2UgZGlzcGxheSBwYXR0ZXJuLlwiKVxuICAgICAgLmFkZFRvZ2dsZSh0ID0+IHRcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnJld3JpdGVPbGRPYnNpZGlhbkxpbmtzKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmV3cml0ZU9sZE9ic2lkaWFuTGlua3MgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiU2F2ZWQ6IHJld3JpdGUgb2xkLXN0eWxlIGxpbmtzXCIpO1xuICAgICAgICB9KSk7XG5cbiAgICAvLyBUb2dnbGU6IEF1dG8tbGluayB2ZXJzZXMgYWZ0ZXIgb3V0bGluZSBmb3JtYXR0aW5nXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkF1dG8tbGluayB2ZXJzZXMgYWZ0ZXIgb3V0bGluZSBmb3JtYXR0aW5nXCIpXG4gICAgICAuc2V0RGVzYyhcIkFmdGVyIHRoZSBvdXRsaW5lIHRleHQgaXMgZm9ybWF0dGVkLCBhdXRvbWF0aWNhbGx5IGxpbmsgc2NyaXB0dXJlIHJlZmVyZW5jZXMgaW4gdGhlIHJlc3VsdC5cIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0XG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvTGlua1ZlcnNlcylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0xpbmtWZXJzZXMgPSB2O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIC8vIERlZmF1bHRzIGZvciBCaWJsZSBnZW5lcmF0b3JcbiAgICAvLyBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAvLyAuc2V0TmFtZShcIkRlZmF1bHQgQmlibGUgdmVyc2lvblwiKVxuICAgIC8vIC5zZXREZXNjKFwiVXNlZCBhcyB0aGUgcHJlc2VsZWN0ZWQgdmVyc2lvbiB3aGVuIGdlbmVyYXRpbmcgdGhlIF9CaWJsZSB2YXVsdC5cIilcbiAgICAvLyAuYWRkRHJvcGRvd24oZCA9PiBkXG4gICAgLy8gICAuYWRkT3B0aW9ucyh7XG4gICAgLy8gICAgIEtKVjogXCJLSlYgXHUyMDEzIEtpbmcgSmFtZXMgVmVyc2lvblwiLFxuICAgIC8vICAgICBXRUI6IFwiV0VCIFx1MjAxMyBXb3JsZCBFbmdsaXNoIEJpYmxlXCIsXG4gICAgLy8gICAgIEFTVjogXCJBU1YgXHUyMDEzIEFtZXJpY2FuIFN0YW5kYXJkIFZlcnNpb25cIixcbiAgICAvLyAgICAgWUxUOiBcIllMVCBcdTIwMTMgWW91bmcncyBMaXRlcmFsIFRyYW5zbGF0aW9uXCIsXG4gICAgLy8gICAgIERBUkJZOiBcIkRBUkJZIFx1MjAxMyBEYXJieSBUcmFuc2xhdGlvblwiLFxuICAgIC8vICAgICBCQkU6IFwiQkJFIFx1MjAxMyBCaWJsZSBpbiBCYXNpYyBFbmdsaXNoXCIsXG4gICAgLy8gICB9KVxuICAgIC8vICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb24pXG4gICAgLy8gICAub25DaGFuZ2UoYXN5bmMgKHYpID0+IHtcbiAgICAvLyAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmlibGVEZWZhdWx0VmVyc2lvbiA9IHY7XG4gICAgLy8gICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIC8vICAgfSlcbiAgICAvLyApO1xuXG4gICAgLy8gbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgLy8gLnNldE5hbWUoXCJJbmNsdWRlIHZlcnNpb24gaW4gZmlsZW5hbWVzXCIpXG4gICAgLy8gLnNldERlc2MoYElmIE9OOiBmb2xkZXIgc3RydWN0dXJlIGxpa2UgXCJfQmlibGUvS0pWL0pvaG4gKEtKVilcIi4gSWYgT0ZGOiBmb2xkZXIgc3RydWN0dXJlIGxpa2UgXCJfQmlibGUvSm9oblwiLmApXG4gICAgLy8gLmFkZFRvZ2dsZSh0ID0+IHRcbiAgICAvLyAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5iaWJsZUluY2x1ZGVWZXJzaW9uSW5GaWxlbmFtZSlcbiAgICAvLyAgIC5vbkNoYW5nZShhc3luYyAodikgPT4ge1xuICAgIC8vICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iaWJsZUluY2x1ZGVWZXJzaW9uSW5GaWxlbmFtZSA9IHY7XG4gICAgLy8gICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIC8vICAgfSlcbiAgICAvLyApO1xuXG4gICAgLy8gbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgLy8gICAuc2V0TmFtZShcIkFkZCBZQU1MIGZyb250bWF0dGVyIHRvIGdlbmVyYXRlZCBCaWJsZSBmaWxlc1wiKVxuICAgIC8vICAgLnNldERlc2MoJ0lmIE9OLCBlYWNoIGJvb2sgZmlsZSBzdGFydHMgd2l0aCBZQU1MICh0aXRsZSwgdmVyc2lvbiwgYm9vaywgY2hhcHRlcnMsIGV0Yy4pLicpXG4gICAgLy8gICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgIC8vICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYmlibGVBZGRGcm9udG1hdHRlcilcbiAgICAvLyAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgLy8gICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmlibGVBZGRGcm9udG1hdHRlciA9IHY7XG4gICAgLy8gICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgLy8gICAgIH0pXG4gICAgLy8gICApO1xuICB9XG59XG4iLCAiLy8gc3JjL2NvbW1hbmRzL3ZlcnNlTGlua3MudHNcbmltcG9ydCB7XG4gIEFwcCxcbiAgTWFya2Rvd25WaWV3LFxuICBNb2RhbCxcbiAgTm90aWNlLFxuICBTZXR0aW5nLFxuICBURmlsZSxcbiAgcmVxdWVzdFVybCxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IHNwbGl0RnJvbnRtYXR0ZXIgfSBmcm9tIFwiLi4vbGliL21kVXRpbHNcIjtcblxuLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIEJPT0sgTUFQIChkZWZhdWx0LCBFbmdsaXNoKVxuICogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuY29uc3QgQk9PS19BQkJSOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAvLyAtLS0tIFBlbnRhdGV1Y2ggLS0tLVxuICBcIkdlbmVzaXNcIjogXCJHZW5cIixcbiAgXCIxIE1vc2VcIjogXCJHZW5cIiwgXCIxTW9zZVwiOiBcIkdlblwiLFxuICBcIjEuIE1vc2VcIjogXCJHZW5cIiwgXCIxLk1vc2VcIjogXCJHZW5cIixcblxuICBcIkV4b2R1c1wiOiBcIkV4b1wiLFxuICBcIjIgTW9zZVwiOiBcIkV4b1wiLCBcIjJNb3NlXCI6IFwiRXhvXCIsXG4gIFwiMi4gTW9zZVwiOiBcIkV4b1wiLCBcIjIuTW9zZVwiOiBcIkV4b1wiLFxuXG4gIFwiTGV2aXRpY3VzXCI6IFwiTGV2XCIsXG4gIFwiMyBNb3NlXCI6IFwiTGV2XCIsIFwiM01vc2VcIjogXCJMZXZcIixcbiAgXCIzLiBNb3NlXCI6IFwiTGV2XCIsIFwiMy5Nb3NlXCI6IFwiTGV2XCIsXG5cbiAgXCJOdW1iZXJzXCI6IFwiTnVtXCIsXG4gIFwiTnVtZXJpXCI6IFwiTnVtXCIsXG4gIFwiNCBNb3NlXCI6IFwiTnVtXCIsIFwiNE1vc2VcIjogXCJOdW1cIixcbiAgXCI0LiBNb3NlXCI6IFwiTnVtXCIsIFwiNC5Nb3NlXCI6IFwiTnVtXCIsXG5cbiAgXCJEZXV0ZXJvbm9teVwiOiBcIkRldXRcIixcbiAgXCJEZXV0ZXJvbm9taXVtXCI6IFwiRGV1dFwiLFxuICBcIjUgTW9zZVwiOiBcIkRldXRcIiwgXCI1TW9zZVwiOiBcIkRldXRcIixcbiAgXCI1LiBNb3NlXCI6IFwiRGV1dFwiLCBcIjUuTW9zZVwiOiBcIkRldXRcIixcblxuICAvLyAtLS0tIEhpc3RvcmljYWwgLS0tLVxuICBcIkpvc2h1YVwiOiBcIkpvc2hcIiwgXCJKb3N1YVwiOiBcIkpvc2hcIixcbiAgXCJKdWRnZXNcIjogXCJKdWRnXCIsIFwiUmljaHRlclwiOiBcIkp1ZGdcIixcbiAgXCJSdXRoXCI6IFwiUnV0aFwiLFxuXG4gIFwiMSBTYW11ZWxcIjogXCIxIFNhbVwiLCBcIjEuIFNhbXVlbFwiOiBcIjEgU2FtXCIsIFwiMVNhbXVlbFwiOiBcIjEgU2FtXCIsIFwiMS5TYW11ZWxcIjogXCIxIFNhbVwiLFxuICBcIjIgU2FtdWVsXCI6IFwiMiBTYW1cIiwgXCIyLiBTYW11ZWxcIjogXCIyIFNhbVwiLCBcIjJTYW11ZWxcIjogXCIyIFNhbVwiLCBcIjIuU2FtdWVsXCI6IFwiMiBTYW1cIixcblxuICBcIjEgS2luZ3NcIjogXCIxIEtpbmdzXCIsIFwiMS4gS1x1MDBGNm5pZ2VcIjogXCIxIEtpbmdzXCIsIFwiMUtcdTAwRjZuaWdlXCI6IFwiMSBLaW5nc1wiLCBcIjEuS1x1MDBGNm5pZ2VcIjogXCIxIEtpbmdzXCIsXG4gIFwiMiBLaW5nc1wiOiBcIjIgS2luZ3NcIiwgXCIyLiBLXHUwMEY2bmlnZVwiOiBcIjIgS2luZ3NcIiwgXCIyS1x1MDBGNm5pZ2VcIjogXCIyIEtpbmdzXCIsIFwiMi5LXHUwMEY2bmlnZVwiOiBcIjIgS2luZ3NcIixcblxuICBcIjEgQ2hyb25pY2xlc1wiOiBcIjEgQ2hyb25cIiwgXCIxLiBDaHJvbmlrXCI6IFwiMSBDaHJvblwiLCBcIjFDaHJvbmlrXCI6IFwiMSBDaHJvblwiLCBcIjEuQ2hyb25pa1wiOiBcIjEgQ2hyb25cIixcbiAgXCIyIENocm9uaWNsZXNcIjogXCIyIENocm9uXCIsIFwiMi4gQ2hyb25pa1wiOiBcIjIgQ2hyb25cIiwgXCIyQ2hyb25pa1wiOiBcIjIgQ2hyb25cIiwgXCIyLkNocm9uaWtcIjogXCIyIENocm9uXCIsXG5cbiAgXCJFenJhXCI6IFwiRXpyYVwiLCBcIkVzcmFcIjogXCJFenJhXCIsXG4gIFwiTmVoZW1pYWhcIjogXCJOZWhcIiwgXCJOZWhlbWlhXCI6IFwiTmVoXCIsXG4gIFwiRXN0aGVyXCI6IFwiRXN0aFwiLFxuICBcIkpvYlwiOiBcIkpvYlwiLCBcIkhpb2JcIjogXCJKb2JcIixcblxuICAvLyAtLS0tIFdpc2RvbSAtLS0tXG4gIFwiUHNhbG1zXCI6IFwiUHNhXCIsIFwiUHNhbG1cIjogXCJQc2FcIiwgXCJQc1wiOiBcIlBzYVwiLFxuICBcIlByb3ZlcmJzXCI6IFwiUHJvdlwiLCBcIlNwclx1MDBGQ2NoZVwiOiBcIlByb3ZcIiwgXCJTcHJcIjogXCJQcm92XCIsXG4gIFwiRWNjbGVzaWFzdGVzXCI6IFwiRWNjbFwiLCBcIlByZWRpZ2VyXCI6IFwiRWNjbFwiLCBcIktvaGVsZXRcIjogXCJFY2NsXCIsXG4gIFwiU29uZyBvZiBTb2xvbW9uXCI6IFwiU29TXCIsIFwiU29uZyBvZiBTb25nc1wiOiBcIlNvU1wiLCBcIkhvaGVzbGllZFwiOiBcIlNvU1wiLCBcIkhvaGVsaWVkXCI6IFwiU29TXCIsIFwiTGllZCBkZXIgTGllZGVyXCI6IFwiU29TXCIsIFwiU1NcIjogXCJTb1NcIixcblxuICAvLyAtLS0tIFByb3BoZXRzIC0tLS1cbiAgXCJJc2FpYWhcIjogXCJJc2FcIiwgXCJKZXNhamFcIjogXCJJc2FcIixcbiAgXCJKZXJlbWlhaFwiOiBcIkplclwiLCBcIkplcmVtaWFcIjogXCJKZXJcIixcbiAgXCJMYW1lbnRhdGlvbnNcIjogXCJMYW1cIiwgXCJLbGFnZWxpZWRlclwiOiBcIkxhbVwiLCBcIlRocmVuaVwiOiBcIkxhbVwiLFxuICBcIkV6ZWtpZWxcIjogXCJFemVrXCIsIFwiSGVzZWtpZWxcIjogXCJFemVrXCIsIFwiRXplY2hpZWxcIjogXCJFemVrXCIsXG4gIFwiRGFuaWVsXCI6IFwiRGFuXCIsXG4gIFwiSG9zZWFcIjogXCJIb3NlYVwiLFxuICBcIkpvZWxcIjogXCJKb2VsXCIsXG4gIFwiQW1vc1wiOiBcIkFtb3NcIixcbiAgXCJPYmFkaWFoXCI6IFwiT2JhZFwiLCBcIk9iYWRqYVwiOiBcIk9iYWRcIixcbiAgXCJKb25haFwiOiBcIkpvbmFoXCIsIFwiSm9uYVwiOiBcIkpvbmFoXCIsXG4gIFwiTWljYWhcIjogXCJNaWNhaFwiLCBcIk1pY2hhXCI6IFwiTWljYWhcIixcbiAgXCJOYWh1bVwiOiBcIk5haFwiLFxuICBcIkhhYmFra3VrXCI6IFwiSGFiXCIsIFwiSGFiYWt1a1wiOiBcIkhhYlwiLFxuICBcIlplcGhhbmlhaFwiOiBcIlplcFwiLCBcIlplcGhhbmphXCI6IFwiWmVwXCIsIFwiWmVmYW5qYVwiOiBcIlplcFwiLFxuICBcIkhhZ2dhaVwiOiBcIkhhZ1wiLFxuICBcIlplY2hhcmlhaFwiOiBcIlplY2hcIiwgXCJTYWNoYXJqYVwiOiBcIlplY2hcIixcbiAgXCJNYWxhY2hpXCI6IFwiTWFsXCIsIFwiTWFsZWFjaGlcIjogXCJNYWxcIixcblxuICAvLyAtLS0tIEdvc3BlbHMgJiBBY3RzIC0tLS1cbiAgXCJNYXR0aGV3XCI6IFwiTWF0dFwiLCBcIk1hdHRoXHUwMEU0dXNcIjogXCJNYXR0XCIsIFwiTXRcIjogXCJNYXR0XCIsXG4gIFwiTWFya1wiOiBcIk1hcmtcIiwgXCJNYXJrdXNcIjogXCJNYXJrXCIsIFwiTWtcIjogXCJNYXJrXCIsXG4gIFwiTHVrZVwiOiBcIkx1a2VcIiwgXCJMdWthc1wiOiBcIkx1a2VcIiwgXCJMa1wiOiBcIkx1a2VcIiwgXCJMdWtcIjogXCJMdWtlXCIsXG4gIFwiSm9oblwiOiBcIkpvaG5cIiwgXCJKb2hhbm5lc1wiOiBcIkpvaG5cIiwgXCJKb2hcIjogXCJKb2huXCIsXG4gIFwiQWN0c1wiOiBcIkFjdHNcIiwgXCJBcGdcIjogXCJBY3RzXCIsIFwiQXBvc3RlbGdlc2NoaWNodGVcIjogXCJBY3RzXCIsXG5cbiAgLy8gLS0tLSBQYXVsXHUyMDE5cyBsZXR0ZXJzIC0tLS1cbiAgXCJSb21hbnNcIjogXCJSb21cIiwgXCJSXHUwMEY2bWVyXCI6IFwiUm9tXCIsIFwiUlx1MDBGNm1cIjogXCJSb21cIiwgXCJSXHUwMEY2bWVyYnJpZWZcIjogXCJSb21cIixcblxuICBcIjEgQ29yaW50aGlhbnNcIjogXCIxIENvclwiLCBcIjEgS29yaW50aGVyXCI6IFwiMSBDb3JcIiwgXCIxLiBLb3JpbnRoZXJcIjogXCIxIENvclwiLCBcIjFLb3JpbnRoZXJcIjogXCIxIENvclwiLCBcIjEuS29yaW50aGVyXCI6IFwiMSBDb3JcIixcbiAgXCIxIEtvclwiOiBcIjEgQ29yXCIsIFwiMS4gS29yXCI6IFwiMSBDb3JcIiwgXCIxS29yXCI6IFwiMSBDb3JcIiwgXCIxLktvclwiOiBcIjEgQ29yXCIsXG5cbiAgXCIyIENvcmludGhpYW5zXCI6IFwiMiBDb3JcIiwgXCIyIEtvcmludGhlclwiOiBcIjIgQ29yXCIsIFwiMi4gS29yaW50aGVyXCI6IFwiMiBDb3JcIiwgXCIyS29yaW50aGVyXCI6IFwiMiBDb3JcIiwgXCIyLktvcmludGhlclwiOiBcIjIgQ29yXCIsXG4gIFwiMiBLb3JcIjogXCIyIENvclwiLCBcIjIuIEtvclwiOiBcIjIgQ29yXCIsIFwiMktvclwiOiBcIjIgQ29yXCIsIFwiMi5Lb3JcIjogXCIyIENvclwiLFxuXG4gIFwiR2FsYXRpYW5zXCI6IFwiR2FsXCIsIFwiR2FsYXRlclwiOiBcIkdhbFwiLCBcIkdhbFwiOiBcIkdhbFwiLFxuICBcIkVwaGVzaWFuc1wiOiBcIkVwaFwiLCBcIkVwaGVzZXJcIjogXCJFcGhcIiwgXCJFcGhcIjogXCJFcGhcIixcbiAgXCJQaGlsaXBwaWFuc1wiOiBcIlBoaWxcIiwgXCJQaGlsaXBwZXJcIjogXCJQaGlsXCIsIFwiUGhpbFwiOiBcIlBoaWxcIixcbiAgXCJDb2xvc3NpYW5zXCI6IFwiQ29sXCIsIFwiS29sb3NzZXJcIjogXCJDb2xcIiwgXCJLb2xcIjogXCJDb2xcIixcblxuICBcIjEgVGhlc3NhbG9uaWFuc1wiOiBcIjEgVGhlc1wiLCBcIjEgVGhlc3NcIjogXCIxIFRoZXNcIiwgXCIxLiBUaGVzc1wiOiBcIjEgVGhlc1wiLCBcIjFUaGVzc1wiOiBcIjEgVGhlc1wiLCBcIjEuVGhlc3NcIjogXCIxIFRoZXNcIixcbiAgXCIxIFRoZXNzYWxvbmljaGVyXCI6IFwiMSBUaGVzXCIsIFwiMS4gVGhlc3NhbG9uaWNoZXJcIjogXCIxIFRoZXNcIiwgXCIxVGhlc3NhbG9uaWNoZXJcIjogXCIxIFRoZXNcIiwgXCIxLlRoZXNzYWxvbmljaGVyXCI6IFwiMSBUaGVzXCIsXG5cbiAgXCIyIFRoZXNzYWxvbmlhbnNcIjogXCIyIFRoZXNcIiwgXCIyIFRoZXNzXCI6IFwiMiBUaGVzXCIsIFwiMi4gVGhlc3NcIjogXCIyIFRoZXNcIiwgXCIyVGhlc3NcIjogXCIyIFRoZXNcIiwgXCIyLlRoZXNzXCI6IFwiMiBUaGVzXCIsXG4gIFwiMiBUaGVzc2Fsb25pY2hlclwiOiBcIjIgVGhlc1wiLCBcIjIuIFRoZXNzYWxvbmljaGVyXCI6IFwiMiBUaGVzXCIsIFwiMlRoZXNzYWxvbmljaGVyXCI6IFwiMiBUaGVzXCIsIFwiMi5UaGVzc2Fsb25pY2hlclwiOiBcIjIgVGhlc1wiLFxuXG4gIFwiMSBUaW1vdGh5XCI6IFwiMSBUaW1cIiwgXCIxIFRpbW90aGV1c1wiOiBcIjEgVGltXCIsIFwiMS4gVGltb3RoZXVzXCI6IFwiMSBUaW1cIiwgXCIxVGltb3RoZXVzXCI6IFwiMSBUaW1cIiwgXCIxLlRpbW90aGV1c1wiOiBcIjEgVGltXCIsXG4gIFwiMSBUaW1cIjogXCIxIFRpbVwiLCBcIjEuIFRpbVwiOiBcIjEgVGltXCIsIFwiMVRpbVwiOiBcIjEgVGltXCIsIFwiMS5UaW1cIjogXCIxIFRpbVwiLFxuXG4gIFwiMiBUaW1vdGh5XCI6IFwiMiBUaW1cIiwgXCIyIFRpbW90aGV1c1wiOiBcIjIgVGltXCIsIFwiMi4gVGltb3RoZXVzXCI6IFwiMiBUaW1cIiwgXCIyVGltb3RoZXVzXCI6IFwiMiBUaW1cIiwgXCIyLlRpbW90aGV1c1wiOiBcIjIgVGltXCIsXG4gIFwiMiBUaW1cIjogXCIyIFRpbVwiLCBcIjIuIFRpbVwiOiBcIjIgVGltXCIsIFwiMlRpbVwiOiBcIjIgVGltXCIsIFwiMi5UaW1cIjogXCIyIFRpbVwiLFxuXG4gIFwiVGl0dXNcIjogXCJUaXR1c1wiLFxuICBcIlBoaWxlbW9uXCI6IFwiUGhpbGVtXCIsXG5cbiAgXCJIZWJyZXdzXCI6IFwiSGViXCIsIFwiSGViclx1MDBFNGVyXCI6IFwiSGViXCIsIFwiSGViclwiOiBcIkhlYlwiLFxuXG4gIC8vIC0tLS0gQ2F0aG9saWMgJiBHZW5lcmFsIGxldHRlcnMgLS0tLVxuICBcIkphbWVzXCI6IFwiSmFtZXNcIiwgXCJKYWtvYnVzXCI6IFwiSmFtZXNcIiwgXCJKYWtcIjogXCJKYW1lc1wiLFxuICBcIjEgUGV0ZXJcIjogXCIxIFBldFwiLCBcIjEgUGV0cnVzXCI6IFwiMSBQZXRcIiwgXCIxLiBQZXRydXNcIjogXCIxIFBldFwiLCBcIjFQZXRydXNcIjogXCIxIFBldFwiLCBcIjEuUGV0cnVzXCI6IFwiMSBQZXRcIixcbiAgXCIxIFBldFwiOiBcIjEgUGV0XCIsIFwiMS4gUGV0XCI6IFwiMSBQZXRcIiwgXCIxLiBQZXRyXCI6IFwiMSBQZXRcIiwgXCIxLlBldHJcIjogXCIxIFBldFwiLCBcIjFQZXRcIjogXCIxIFBldFwiLCBcIjEuUGV0XCI6IFwiMSBQZXRcIixcblxuICBcIjIgUGV0ZXJcIjogXCIyIFBldFwiLCBcIjIgUGV0cnVzXCI6IFwiMiBQZXRcIiwgXCIyLiBQZXRydXNcIjogXCIyIFBldFwiLCBcIjJQZXRydXNcIjogXCIyIFBldFwiLCBcIjIuUGV0cnVzXCI6IFwiMiBQZXRcIixcbiAgXCIyIFBldFwiOiBcIjIgUGV0XCIsIFwiMi4gUGV0XCI6IFwiMiBQZXRcIiwgXCIyLiBQZXRyXCI6IFwiMiBQZXRcIiwgXCIyLlBldHJcIjogXCIyIFBldFwiLCBcIjJQZXRcIjogXCIyIFBldFwiLCBcIjIuUGV0XCI6IFwiMiBQZXRcIixcblxuICBcIjEgSm9oblwiOiBcIjEgSm9oblwiLCBcIjEgSm9oYW5uZXNcIjogXCIxIEpvaG5cIiwgXCIxLiBKb2hhbm5lc1wiOiBcIjEgSm9oblwiLCBcIjFKb2hhbm5lc1wiOiBcIjEgSm9oblwiLCBcIjEuSm9oYW5uZXNcIjogXCIxIEpvaG5cIixcbiAgXCIxIEpvaFwiOiBcIjEgSm9oblwiLCBcIjEuIEpvaFwiOiBcIjEgSm9oblwiLCBcIjFKb2hcIjogXCIxIEpvaG5cIiwgXCIxLkpvaFwiOiBcIjEgSm9oblwiLFxuXG4gIFwiMiBKb2huXCI6IFwiMiBKb2huXCIsIFwiMiBKb2hhbm5lc1wiOiBcIjIgSm9oblwiLCBcIjIuIEpvaGFubmVzXCI6IFwiMiBKb2huXCIsIFwiMkpvaGFubmVzXCI6IFwiMiBKb2huXCIsIFwiMi5Kb2hhbm5lc1wiOiBcIjIgSm9oblwiLFxuICBcIjIgSm9oXCI6IFwiMiBKb2huXCIsIFwiMi4gSm9oXCI6IFwiMiBKb2huXCIsIFwiMkpvaFwiOiBcIjIgSm9oblwiLCBcIjIuSm9oXCI6IFwiMiBKb2huXCIsXG5cbiAgXCIzIEpvaG5cIjogXCIzIEpvaG5cIiwgXCIzIEpvaGFubmVzXCI6IFwiMyBKb2huXCIsIFwiMy4gSm9oYW5uZXNcIjogXCIzIEpvaG5cIiwgXCIzSm9oYW5uZXNcIjogXCIzIEpvaG5cIiwgXCIzLkpvaGFubmVzXCI6IFwiMyBKb2huXCIsXG4gIFwiMyBKb2hcIjogXCIzIEpvaG5cIiwgXCIzLiBKb2hcIjogXCIzIEpvaG5cIiwgXCIzSm9oXCI6IFwiMyBKb2huXCIsIFwiMy5Kb2hcIjogXCIzIEpvaG5cIixcblxuICBcIkp1ZGVcIjogXCJKdWRlXCIsIFwiSnVkYXNcIjogXCJKdWRlXCIsXG5cbiAgLy8gLS0tLSBSZXZlbGF0aW9uIC0tLS1cbiAgXCJSZXZlbGF0aW9uXCI6IFwiUmV2XCIsIFwiT2ZmZW5iYXJ1bmdcIjogXCJSZXZcIiwgXCJPZmZiXCI6IFwiUmV2XCIsIFwiQXBva2FseXBzZVwiOiBcIlJldlwiXG59O1xuXG5cbnR5cGUgQm9va01hcCA9IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG5jb25zdCBlc2NhcGVSZSA9IChzOiBzdHJpbmcpID0+IHMucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xuXG4vKiogQnVpbGQgbG9jYWxlLXNwZWNpZmljIGJvb2sgbWFwICsgYWx0ZXJuYXRpb24gYXQgcnVudGltZSAqL1xuZnVuY3Rpb24gYnVpbGRCb29rQ29udGV4dChzZXR0aW5ncz86IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuICBsZXQgYm9va0xvY2FsZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBsZXQgY3VzdG9tOiB1bmtub3duO1xuXG4gIHRyeSB7IGJvb2tMb2NhbGUgPSAoc2V0dGluZ3MgYXMgYW55KT8uYm9va0xvY2FsZSBhcyBzdHJpbmcgfCB1bmRlZmluZWQ7IH0gY2F0Y2gge31cbiAgdHJ5IHsgY3VzdG9tID0gKHNldHRpbmdzIGFzIGFueSk/LmN1c3RvbUJvb2tNYXA7IH0gY2F0Y2gge31cblxuICBsZXQgYWJicjogQm9va01hcCA9IEJPT0tfQUJCUjtcblxuICBpZiAoYm9va0xvY2FsZSA9PT0gXCJjdXN0b21cIiAmJiBjdXN0b20pIHtcbiAgICB0cnkge1xuICAgICAgaWYgKHR5cGVvZiBjdXN0b20gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShjdXN0b20pO1xuICAgICAgICBpZiAocGFyc2VkICYmIHR5cGVvZiBwYXJzZWQgPT09IFwib2JqZWN0XCIpIGFiYnIgPSBwYXJzZWQgYXMgQm9va01hcDtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGN1c3RvbSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBhYmJyID0gY3VzdG9tIGFzIEJvb2tNYXA7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBhYmJyID0gQk9PS19BQkJSO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBhYmJyID0gQk9PS19BQkJSO1xuICB9XG5cbiAgY29uc3QgYWxsVG9rZW5zID0gQXJyYXkuZnJvbShuZXcgU2V0KFsuLi5PYmplY3Qua2V5cyhhYmJyKSwgLi4uT2JqZWN0LnZhbHVlcyhhYmJyKV0pKS5zb3J0KFxuICAgIChhLCBiKSA9PiBiLmxlbmd0aCAtIGEubGVuZ3RoXG4gICk7XG4gIGNvbnN0IEJPT0tfQUxUID0gYWxsVG9rZW5zLm1hcChlc2NhcGVSZSkuam9pbihcInxcIik7XG5cbiAgY29uc3QgZ2V0Qm9va0FiYnIgPSAoYm9vazogc3RyaW5nKSA9PiBhYmJyW2Jvb2tdID8/IGJvb2s7XG5cbiAgY29uc3QgYnVpbGRQYXR0ZXJuQm9keSA9ICgpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IGJvb2sgPSBgKD86JHtCT09LX0FMVH0pYDtcbiAgICAvLyBjb25zdCByZWYxID1cbiAgICAvLyAgIGAoPzooPzoke2Jvb2t9KVxcXFwuP1xcXFxzKmAgK1xuICAgIC8vICAgYFxcXFxkKyg/Oi1cXFxcZCspPzpcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT9gICtcbiAgICAvLyAgIGAoPzpcXFxccyosXFxcXHMqXFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/fFxcXFxzKjtcXFxccypcXFxcZCs6XFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/KSpgICtcbiAgICAvLyAgIGApYDtcbiAgICBjb25zdCByZWYxID1cbiAgICAgIGAoPzooPzoke2Jvb2t9KT9cXFxcLj9cXFxccypgICtcbiAgICAgIGBcXFxcZCsoPzotXFxcXGQrKT86XFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/YCArXG4gICAgICBgKD86XFxcXHMqLFxcXFxzKlxcXFxkK1thLXpdPyg/Oi1cXFxcZCspP1thLXpdP3xcXFxccyo7XFxcXHMqXFxcXGQrOlxcXFxkK1thLXpdPyg/Oi1cXFxcZCspP1thLXpdPykqYCArXG4gICAgICBgKWA7XG4gICAgY29uc3QgcmVmMiA9IGAoPzooJHtib29rfSlcXFxcLj9cXFxccysoXFxcXGQrKSg/Oi0oXFxcXGQrKSk/KWA7XG4gICAgY29uc3QgUkVGID0gYCg/PHJlZj4ke3JlZjF9fCR7cmVmMn0pYDtcblxuICAgIGNvbnN0IFZFUlNFID1cbiAgICAgIGAoPzx2ZXJzZT5gICtcbiAgICAgIGBcXFxcYltWdl12Pyg/OlxcXFwufGVyc2VzPylcXFxccypgICtcbiAgICAgIGBcXFxcZCsoPzotXFxcXGQrKT9bYS16XT9gICtcbiAgICAgIGAoPzooPzosfCw/XFxcXHMqYW5kKVxcXFxzKlxcXFxkKyg/Oi1cXFxcZCspP1thLXpdPykqYCArXG4gICAgICBgKWA7XG5cbiAgICBjb25zdCBDSEFQVEVSID1cbiAgICAgIGAoPzxjaGFwdGVyPmAgK1xuICAgICAgYFxcXFxiW0NjXWgoPzphcHRlcnM/fHM/XFxcXC4pXFxcXC4/XFxcXHMqYCArXG4gICAgICBgXFxcXGQrKD86LVxcXFxkKyk/YCArXG4gICAgICBgKWA7XG5cbiAgICBjb25zdCBOT1RFID1cbiAgICAgIGAoPzxub3RlPmAgK1xuICAgICAgYFxcXFxiW05uXW90ZXM/YCArXG4gICAgICBgKD86XFxcXHMrXFxcXGQrKD86XFxcXHMrXFxcXGQrKT9gICtcbiAgICAgIGAoPzpgICtcbiAgICAgIGAoPzpbLDtdfCw/XFxcXHMqYW5kKVxcXFxzKlxcXFxkKyg/OlxcXFxzK1xcXFxkKyk/YCArXG4gICAgICBgKD86XFxcXHMraW5cXFxccyske2Jvb2t9XFxcXC4/XFxcXHMrXFxcXGQrKT9gICtcbiAgICAgIGApKmAgK1xuICAgICAgYClgICtcbiAgICAgIGAoPzpcXFxccytpblxcXFxzKyR7Ym9va31cXFxcLj9cXFxccytcXFxcZCspP2AgK1xuICAgICAgYClgO1xuXG4gICAgY29uc3QgQk9PSyA9IGAoPzxib29rPlxcXFxiKD86JHtib29rfSlcXFxcYikoPyFcXFxcLj9cXFxccypcXFxcZCspYDtcblxuICAgIHJldHVybiBgJHtSRUZ9fCR7VkVSU0V9fCR7Q0hBUFRFUn18JHtOT1RFfXwke0JPT0t9YDtcbiAgfTtcblxuICBjb25zdCBQQVRURVJOX0JPRFkgPSBidWlsZFBhdHRlcm5Cb2R5KCk7XG4gIGNvbnN0IFBBVFRFUk5fRyA9IG5ldyBSZWdFeHAoUEFUVEVSTl9CT0RZLCBcImdcIik7XG4gIGNvbnN0IFBBVFRFUk5fSEVBRCA9IG5ldyBSZWdFeHAoXCJeXCIgKyBQQVRURVJOX0JPRFkpO1xuXG4gIHJldHVybiB7IGFiYnIsIGFsbFRva2VucywgQk9PS19BTFQsIGdldEJvb2tBYmJyLCBQQVRURVJOX0csIFBBVFRFUk5fSEVBRCB9O1xufVxuXG5cbi8qKiAtLS0tLS0tLS0tLS0tLS0tIFV0aWxpdHk6IG5vcm1hbGl6ZSBib29rIHRva2VuIHRvIHJlbW92ZSB0cmFpbGluZyBwZXJpb2QgLS0tLS0tLS0tLS0tLS0tICovXG5mdW5jdGlvbiBub3JtYWxpemVCb29rVG9rZW4ocmF3OiBzdHJpbmcsIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4pOiBzdHJpbmcge1xuICAvLyBUcmltIGFuZCBkcm9wIGEgc2luZ2xlIHRyYWlsaW5nIGRvdCAoZS5nLiwgXCJSb20uXCIgLT4gXCJSb21cIilcbiAgY29uc3QgY2xlYW5lZCA9IHJhdy50cmltKCkucmVwbGFjZSgvXFwuJC8sIFwiXCIpO1xuICByZXR1cm4gY3R4LmdldEJvb2tBYmJyKGNsZWFuZWQpO1xufVxuXG4vKiogLS0tLS0tLS0tLS0tLS0gUHJvdGVjdGVkIHJhbmdlcyAoZG9uXHUyMDE5dCB0b3VjaCB3aGlsZSBsaW5raW5nKSAtLS0tLS0tLS0tLS0tLSAqL1xudHlwZSBSYW5nZSA9IFtzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcl07XG5cbmZ1bmN0aW9uIGFkZFJhbmdlKHJhbmdlczogUmFuZ2VbXSwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbiAgaWYgKHN0YXJ0ID49IDAgJiYgZW5kID4gc3RhcnQpIHJhbmdlcy5wdXNoKFtzdGFydCwgZW5kXSk7XG59XG5cbmZ1bmN0aW9uIGZpbmRQcm90ZWN0ZWRSYW5nZXModGV4dDogc3RyaW5nKTogUmFuZ2VbXSB7XG4gIGNvbnN0IHJhbmdlczogUmFuZ2VbXSA9IFtdO1xuXG4gIC8vIDEpIENvZGUgZmVuY2VzIGBgYC4uLmBgYCBhbmQgfn5+Li4ufn5+XG4gIGNvbnN0IGZlbmNlUmUgPSAvKGBgYHx+fn4pW15cXG5dKlxcbltcXHNcXFNdKj9cXDEvZztcbiAgZm9yIChsZXQgbTsgKG0gPSBmZW5jZVJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuICAvLyAyKSBNYXRoIGJsb2NrcyAkJC4uLiQkXG4gIGNvbnN0IG1hdGhCbG9ja1JlID0gL1xcJFxcJFtcXHNcXFNdKj9cXCRcXCQvZztcbiAgZm9yIChsZXQgbTsgKG0gPSBtYXRoQmxvY2tSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbiAgLy8gMykgSW5saW5lIGNvZGUgYC4uLmBcbiAgY29uc3QgaW5saW5lQ29kZVJlID0gL2BbXmBcXG5dKmAvZztcbiAgZm9yIChsZXQgbTsgKG0gPSBpbmxpbmVDb2RlUmUuZXhlYyh0ZXh0KSk7ICkgYWRkUmFuZ2UocmFuZ2VzLCBtLmluZGV4LCBtLmluZGV4ICsgbVswXS5sZW5ndGgpO1xuXG4gIC8vIDQpIElubGluZSBtYXRoICQuLi4kIChhdm9pZCAkJClcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgKSB7XG4gICAgaWYgKHRleHRbaV0gPT09IFwiJFwiICYmIHRleHRbaSArIDFdICE9PSBcIiRcIikge1xuICAgICAgY29uc3Qgc3RhcnQgPSBpO1xuICAgICAgaSsrO1xuICAgICAgd2hpbGUgKGkgPCB0ZXh0Lmxlbmd0aCAmJiB0ZXh0W2ldICE9PSBcIiRcIikgaSsrO1xuICAgICAgaWYgKGkgPCB0ZXh0Lmxlbmd0aCAmJiB0ZXh0W2ldID09PSBcIiRcIikge1xuICAgICAgICBhZGRSYW5nZShyYW5nZXMsIHN0YXJ0LCBpICsgMSk7XG4gICAgICAgIGkrKztcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfVxuICAgIGkrKztcbiAgfVxuXG4gIC8vIDUpIE1hcmtkb3duIGxpbmtzIFt0ZXh0XSh1cmwpXG4gIGNvbnN0IG1kTGlua1JlID0gL1xcW1teXFxdXSs/XFxdXFwoW14pXStcXCkvZztcbiAgZm9yIChsZXQgbTsgKG0gPSBtZExpbmtSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbiAgLy8gNikgSW5saW5lIHByb3BlcnRpZXMgbGluZXM6ICBrZXk6OiB2YWx1ZVxuICBjb25zdCBpbmxpbmVQcm9wUmUgPSAvXlteXFxuOl17MSwyMDB9OjouKiQvZ207XG4gIGZvciAobGV0IG07IChtID0gaW5saW5lUHJvcFJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuICAvLyA3KSBPYnNpZGlhbiBsaW5rcyBbWy4uLl1dXG4gIGNvbnN0IG9ic2lkaWFuUmUgPSAvXFxbXFxbW15cXF1dKj9cXF1cXF0vZztcbiAgZm9yIChsZXQgbTsgKG0gPSBvYnNpZGlhblJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuICAvLyBNZXJnZSBvdmVybGFwcyAmIHNvcnRcbiAgcmFuZ2VzLnNvcnQoKGEsIGIpID0+IGFbMF0gLSBiWzBdKTtcbiAgY29uc3QgbWVyZ2VkOiBSYW5nZVtdID0gW107XG4gIGZvciAoY29uc3QgciBvZiByYW5nZXMpIHtcbiAgICBpZiAoIW1lcmdlZC5sZW5ndGggfHwgclswXSA+IG1lcmdlZFttZXJnZWQubGVuZ3RoIC0gMV1bMV0pIG1lcmdlZC5wdXNoKHIpO1xuICAgIGVsc2UgbWVyZ2VkW21lcmdlZC5sZW5ndGggLSAxXVsxXSA9IE1hdGgubWF4KG1lcmdlZFttZXJnZWQubGVuZ3RoIC0gMV1bMV0sIHJbMV0pO1xuICB9XG4gIHJldHVybiBtZXJnZWQ7XG59XG5cbmZ1bmN0aW9uIGluUHJvdGVjdGVkKHBvczogbnVtYmVyLCByYW5nZXM6IFJhbmdlW10pOiBib29sZWFuIHtcbiAgbGV0IGxvID0gMCwgaGkgPSByYW5nZXMubGVuZ3RoIC0gMTtcbiAgd2hpbGUgKGxvIDw9IGhpKSB7XG4gICAgY29uc3QgbWlkID0gKGxvICsgaGkpID4+IDE7XG4gICAgY29uc3QgW3MsIGVdID0gcmFuZ2VzW21pZF07XG4gICAgaWYgKHBvcyA8IHMpIGhpID0gbWlkIC0gMTtcbiAgICBlbHNlIGlmIChwb3MgPj0gZSkgbG8gPSBtaWQgKyAxO1xuICAgIGVsc2UgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc1dpdGhpbk9ic2lkaWFuTGluayh0ZXh0OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGJlZm9yZSA9IHRleHQuc2xpY2UoMCwgc3RhcnQpO1xuICBjb25zdCBhZnRlciA9IHRleHQuc2xpY2UoZW5kKTtcbiAgY29uc3Qgb3BlbklkeCA9IGJlZm9yZS5sYXN0SW5kZXhPZihcIltbXCIpO1xuICBjb25zdCBjbG9zZUlkeCA9IGJlZm9yZS5sYXN0SW5kZXhPZihcIl1dXCIpO1xuICBpZiAob3BlbklkeCA+IGNsb3NlSWR4KSB7XG4gICAgY29uc3QgbmV4dENsb3NlID0gYWZ0ZXIuaW5kZXhPZihcIl1dXCIpO1xuICAgIGlmIChuZXh0Q2xvc2UgIT09IC0xKSByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKiBQYXJlbnRoZXRpY2FsIG5vaXNlOiBza2lwIGlmIGluc2lkZSBcIigyMDE5KVwiLWxpa2UgcGFyZW50aGVzZXMgKi9cbmZ1bmN0aW9uIGlzSW5zaWRlTnVtZXJpY1BhcmVucyh0ZXh0OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IG9wZW4gPSB0ZXh0Lmxhc3RJbmRleE9mKFwiKFwiLCBzdGFydCk7XG4gIGlmIChvcGVuID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBjbG9zZSA9IHRleHQuaW5kZXhPZihcIilcIiwgZW5kKTtcbiAgaWYgKGNsb3NlID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBpbm5lciA9IHRleHQuc2xpY2Uob3BlbiArIDEsIGNsb3NlKS50cmltKCk7XG4gIGlmICgvXlxcZHsxLDR9KD86W1xcL1xcLlxcLTpdXFxkezEsMn0oPzpbXFwvXFwuXFwtOl1cXGR7MSw0fSk/KT8kLy50ZXN0KGlubmVyKSkgcmV0dXJuIHRydWU7XG4gIGlmICgvXnB7MSwyfVxcLlxccypcXGQrKFxccyotXFxzKlxcZCspPyQvaS50ZXN0KGlubmVyKSkgcmV0dXJuIHRydWU7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0gTWFya2Rvd24vT2JzaWRpYW4gbGluayBjbGVhbnVwIChQeXRob24gcGFyaXR5KSAtLS0tLS0tLS0tLS0tLS0tLS0tICovXG5mdW5jdGlvbiByZW1vdmVNYXRjaGluZ01hcmtkb3duTGlua3ModGV4dDogc3RyaW5nLCBQQVRURVJOX0hFQUQ6IFJlZ0V4cCk6IHN0cmluZyB7XG4gIGNvbnN0IG1kTGluayA9IC8oXFwqXFwqfF9ffFxcKik/XFxbKFteXFxdXSspXFxdXFwoW14pXStcXCkoXFwqXFwqfF9ffFxcKik/L2c7XG4gIHJldHVybiB0ZXh0LnJlcGxhY2UobWRMaW5rLCAoX20sIHByZSwgZGlzcCwgc3VmKSA9PiB7XG4gICAgY29uc3QgbGlua1RleHQgPSBTdHJpbmcoZGlzcCk7XG4gICAgaWYgKFBBVFRFUk5fSEVBRC50ZXN0KGxpbmtUZXh0KSkgcmV0dXJuIGxpbmtUZXh0O1xuICAgIGNvbnN0IHNpbXBsZU51bSA9IC9eXFxkKyg/Ols6LV1cXGQrKT8oPzotXFxkKyk/JC8udGVzdChsaW5rVGV4dCk7XG4gICAgaWYgKHNpbXBsZU51bSkgcmV0dXJuIGxpbmtUZXh0O1xuICAgIHJldHVybiBgJHtwcmUgPz8gXCJcIn1bJHtsaW5rVGV4dH1dJHtzdWYgPz8gXCJcIn1gO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlTWF0Y2hpbmdPYnNpZGlhbkxpbmtzKHRleHQ6IHN0cmluZywgUEFUVEVSTl9IRUFEOiBSZWdFeHApOiBzdHJpbmcge1xuICBjb25zdCBvYnMgPSAvXFxbXFxbKFteXFxdfF0rKVxcfChbXlxcXV0rKVxcXVxcXS9nO1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKG9icywgKF9tLCBfdCwgZGlzcCkgPT4ge1xuICAgIGNvbnN0IGRpc3BsYXkgPSBTdHJpbmcoZGlzcCk7XG4gICAgaWYgKFBBVFRFUk5fSEVBRC50ZXN0KGRpc3BsYXkpKSByZXR1cm4gZGlzcGxheTtcbiAgICBjb25zdCBzaW1wbGVOdW0gPSAvXlxcZCsoPzpbOi1dXFxkKyk/KD86LVxcZCspPyQvLnRlc3QoZGlzcGxheSk7XG4gICAgaWYgKHNpbXBsZU51bSkgcmV0dXJuIGRpc3BsYXk7XG4gICAgcmV0dXJuIF9tO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZU9sZE9ic2lkaWFuTGlua3ModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgb2xkTGluayA9IC9cXFtcXFsoWzAtOV0/XFxzW0EtWmEteiBdKylcXHMoXFxkKykjXFxeKFxcZCspKD86XFx8KFteXFxdXSspKT9cXF1cXF0vZztcbiAgcmV0dXJuIHRleHQucmVwbGFjZShvbGRMaW5rLCAoX20sIGJvb2tTaG9ydCwgY2gsIHZlcnNlLCBkaXNwKSA9PiB7XG4gICAgY29uc3QgYiA9IFN0cmluZyhib29rU2hvcnQpLnRyaW0oKTtcbiAgICByZXR1cm4gZGlzcFxuICAgICAgPyBgW1ske2J9I14ke2NofS0ke3ZlcnNlfXwke2Rpc3B9XV1gXG4gICAgICA6IGBbWyR7Yn0jXiR7Y2h9LSR7dmVyc2V9XV1gO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZmluZExhc3RCb29rQmVmb3JlKHRleHQ6IHN0cmluZywgcG9zOiBudW1iZXIsIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4pOiBzdHJpbmcgfCBudWxsIHtcbiAgLy8gTG9vayBiYWNrIH4yMDAgY2hhcnMgZm9yIGEgYm9vayB0b2tlbiBlbmRpbmcgcmlnaHQgYmVmb3JlICdwb3MnXG4gIGNvbnN0IHN0YXJ0ID0gTWF0aC5tYXgoMCwgcG9zIC0gMjAwKTtcbiAgY29uc3QgbGVmdCA9IHRleHQuc2xpY2Uoc3RhcnQsIHBvcyk7XG5cbiAgLy8gTWF0Y2ggQUxMIGJvb2sgdG9rZW5zIGluIHRoZSB3aW5kb3c7IHRha2UgdGhlIGxhc3Qgb25lLlxuICBjb25zdCByZSA9IG5ldyBSZWdFeHAoYCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccyokfCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccytgLCBcImdcIik7XG4gIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICBsZXQgbGFzdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgd2hpbGUgKChtID0gcmUuZXhlYyhsZWZ0KSkgIT09IG51bGwpIHtcbiAgICBsYXN0ID0gbVswXS50cmltKCk7XG4gIH1cbiAgaWYgKCFsYXN0KSByZXR1cm4gbnVsbDtcblxuICAvLyBzdHJpcCB0cmFpbGluZyBwdW5jdHVhdGlvbi9kb3QgYW5kIG5vcm1hbGl6ZVxuICByZXR1cm4gbm9ybWFsaXplQm9va1Rva2VuKGxhc3QucmVwbGFjZSgvXFxzKyQvLCBcIlwiKSwgY3R4KTtcbn1cblxuLyoqIC0tLS0tLS0tLS0tLSBWZXJzaW9uLWF3YXJlIGxpbmsgdGFyZ2V0IC0tLS0tLS0tLS0tLSAqL1xuZnVuY3Rpb24gZm9ybWF0Qm9va1RhcmdldChib29rU2hvcnQ6IHN0cmluZywgdmVyc2lvblNob3J0Pzogc3RyaW5nIHwgbnVsbCk6IHN0cmluZyB7XG4gIGlmICghdmVyc2lvblNob3J0KSByZXR1cm4gYm9va1Nob3J0O1xuICByZXR1cm4gYCR7Ym9va1Nob3J0fSAoJHt2ZXJzaW9uU2hvcnR9KWA7XG59XG5cbi8qKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQ29yZSBsaW5rZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5mdW5jdGlvbiByZXBsYWNlVmVyc2VSZWZlcmVuY2VzT2ZNYWluVGV4dChcbiAgdGV4dDogc3RyaW5nLFxuICBjdHg6IFJldHVyblR5cGU8dHlwZW9mIGJ1aWxkQm9va0NvbnRleHQ+LFxuICBvcHRzOiB7XG4gICAgcmVtb3ZlT2JzaWRpYW5MaW5rczogYm9vbGVhbjtcbiAgICByZXdyaXRlT2xkTGlua3M6IGJvb2xlYW47XG4gICAgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZTogYm9vbGVhbjtcbiAgICB2ZXJzaW9uU2hvcnQ/OiBzdHJpbmcgfCBudWxsOyAvLyBORVdcbiAgfVxuKTogc3RyaW5nIHtcbiAgaWYgKG9wdHMuc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSkgdGV4dCA9IHJlbW92ZU1hdGNoaW5nTWFya2Rvd25MaW5rcyh0ZXh0LCBjdHguUEFUVEVSTl9IRUFEKTtcbiAgaWYgKG9wdHMucmVtb3ZlT2JzaWRpYW5MaW5rcykgdGV4dCA9IHJlbW92ZU1hdGNoaW5nT2JzaWRpYW5MaW5rcyh0ZXh0LCBjdHguUEFUVEVSTl9IRUFEKTtcbiAgaWYgKG9wdHMucmV3cml0ZU9sZExpbmtzKSB0ZXh0ID0gcmVwbGFjZU9sZE9ic2lkaWFuTGlua3ModGV4dCk7XG5cbiAgY29uc3QgcHJvdGVjdGVkUmFuZ2VzID0gZmluZFByb3RlY3RlZFJhbmdlcyh0ZXh0KTtcblxuICBsZXQgY3VycmVudF9ib29rOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgbGV0IGN1cnJlbnRfY2hhcHRlcjogbnVtYmVyIHwgc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGxldCBjdXJyZW50X3ZlcnNlOiBudW1iZXIgfCBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIGxldCBsYXN0UG9zID0gMDtcblxuICBjb25zdCB0YXJnZXRPZiA9IChib29rU2hvcnQ6IHN0cmluZykgPT4gZm9ybWF0Qm9va1RhcmdldChib29rU2hvcnQsIG9wdHMudmVyc2lvblNob3J0KTtcblxuICBjdHguUEFUVEVSTl9HLmxhc3RJbmRleCA9IDA7XG4gIGZvciAobGV0IG06IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGwgPSBjdHguUEFUVEVSTl9HLmV4ZWModGV4dCk7IG07IG0gPSBjdHguUEFUVEVSTl9HLmV4ZWModGV4dCkpIHtcbiAgICBjb25zdCBzdGFydCA9IG0uaW5kZXg7XG4gICAgY29uc3QgZW5kID0gc3RhcnQgKyBtWzBdLmxlbmd0aDtcblxuICAgIGlmIChcbiAgICAgIGluUHJvdGVjdGVkKHN0YXJ0LCBwcm90ZWN0ZWRSYW5nZXMpIHx8XG4gICAgICBpblByb3RlY3RlZChlbmQgLSAxLCBwcm90ZWN0ZWRSYW5nZXMpIHx8XG4gICAgICBpc1dpdGhpbk9ic2lkaWFuTGluayh0ZXh0LCBzdGFydCwgZW5kKSB8fFxuICAgICAgaXNJbnNpZGVOdW1lcmljUGFyZW5zKHRleHQsIHN0YXJ0LCBlbmQpXG4gICAgKSB7XG4gICAgICBvdXQucHVzaCh0ZXh0LnNsaWNlKGxhc3RQb3MsIHN0YXJ0KSwgbVswXSk7XG4gICAgICBsYXN0UG9zID0gZW5kO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgb3V0LnB1c2godGV4dC5zbGljZShsYXN0UG9zLCBzdGFydCkpO1xuICAgIGxhc3RQb3MgPSBlbmQ7XG5cbiAgICBjb25zdCBnID0gbS5ncm91cHMgPz8ge307XG5cbiAgICAvLyAtLS0tIGJvb2sgb25seVxuICAgIGlmIChnLmJvb2spIHtcbiAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihnLmJvb2ssIGN0eCk7IC8vIDwtLSBzdHJpcHMgdHJhaWxpbmcgZG90XG4gICAgICBjdXJyZW50X2NoYXB0ZXIgPSBudWxsO1xuICAgICAgY3VycmVudF92ZXJzZSA9IG51bGw7XG4gICAgICBvdXQucHVzaChtWzBdKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIC0tLS0gY2hhcHRlciAoY2guLCBjaGFwdGVyLCBjaGFwdGVycylcbiAgICBpZiAoZy5jaGFwdGVyKSB7XG4gICAgICBjb25zdCBjaG0gPSBnLmNoYXB0ZXIubWF0Y2goLyhcXGQrKS8pO1xuICAgICAgaWYgKGNobSAmJiBjdXJyZW50X2Jvb2spIHtcbiAgICAgICAgY29uc3QgY2ggPSBjaG1bMV07XG4gICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IGNoO1xuICAgICAgICBjdXJyZW50X3ZlcnNlID0gbnVsbDtcbiAgICAgICAgb3V0LnB1c2goYFtbJHt0YXJnZXRPZihjdXJyZW50X2Jvb2spfSNeJHtjaH18JHttWzBdfV1dYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXQucHVzaChtWzBdKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIC0tLS0gdmVyc2UgKHYuLCB2di4sIHZlcnNlcylcbiAgICBpZiAoZy52ZXJzZSkge1xuICAgICAgaWYgKCFjdXJyZW50X2Jvb2spIHtcbiAgICAgICAgY29uc3QgaW5mZXJyZWQgPSBmaW5kTGFzdEJvb2tCZWZvcmUodGV4dCwgc3RhcnQsIGN0eCk7XG4gICAgICAgIGlmIChpbmZlcnJlZCkgY3VycmVudF9ib29rID0gaW5mZXJyZWQ7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIG91dC5wdXNoKG1bMF0pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCB2ZXJzZVRleHQgPSBtWzBdO1xuICAgICAgY29uc3QgcGFydHMgPSB2ZXJzZVRleHQuc3BsaXQoLyhcXHMrKS8pO1xuICAgICAgY29uc3QgY2ggPSBjdXJyZW50X2NoYXB0ZXIgPyBTdHJpbmcoY3VycmVudF9jaGFwdGVyKSA6IFwiMVwiO1xuICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIHBhcnRzKSB7XG4gICAgICAgIGNvbnN0IHZtID0gcGFydC5tYXRjaCgvKFxcZCspLyk7XG4gICAgICAgIGlmICh2bSAmJiBwYXJ0LnRyaW0oKSkge1xuICAgICAgICAgIG91dC5wdXNoKGBbWyR7dGFyZ2V0T2YoY3VycmVudF9ib29rKX0jXiR7Y2h9LSR7dm1bMV19fCR7cGFydC50cmltKCl9XV1gKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvdXQucHVzaChwYXJ0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gLS0tLSBub3RlKHMpXG4gICAgaWYgKGcubm90ZSkge1xuICAgICAgY29uc3Qgbm90ZVRleHQgPSBnLm5vdGUgYXMgc3RyaW5nO1xuICAgICAgY29uc3QgcGFydHMgPSBub3RlVGV4dC5zcGxpdCgvXFxzKy8pO1xuICAgICAgbGV0IGJvb2tTdWJzdHJpbmcgPSBmYWxzZTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGFydCA9IHBhcnRzW2ldO1xuICAgICAgICBjb25zdCBwbSA9IHBhcnQubWF0Y2goL14oXFxkKykvKTtcbiAgICAgICAgaWYgKHBtICYmICFib29rU3Vic3RyaW5nKSB7XG4gICAgICAgICAgY29uc3QgdmVyc2UgPSBwbVsxXTtcbiAgICAgICAgICBpZiAoKGkgKyAxIDwgcGFydHMubGVuZ3RoICYmICEvXlxcZCsvLnRlc3QocGFydHNbaSArIDFdKSkgfHwgaSArIDEgPj0gcGFydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBvdXQucHVzaChcIiBcIiArIHBhcnQpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IHBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAocGFydHNbal0gPT09IFwiaW5cIiAmJiBqICsgMSA8IHBhcnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICBpZiAoL15cXGQrJC8udGVzdChwYXJ0c1tqICsgMV0pICYmIGogKyAyIDwgcGFydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYm9vayA9IHBhcnRzW2ogKyAxXSArIFwiIFwiICsgcGFydHNbaiArIDJdO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IHBhcnRzW2ogKyAzXTtcbiAgICAgICAgICAgICAgICBjdXJyZW50X2Jvb2sgPSBub3JtYWxpemVCb29rVG9rZW4oYm9vaywgY3R4KTsgLy8gPC0tIG5vcm1hbGl6ZVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJvb2sgPSBwYXJ0c1tqICsgMV07XG4gICAgICAgICAgICAgICAgY3VycmVudF9jaGFwdGVyID0gcGFydHNbaiArIDJdO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihib29rLCBjdHgpOyAvLyA8LS0gbm9ybWFsaXplXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGN1cnJlbnRfYm9vayAmJiBjdXJyZW50X2NoYXB0ZXIpIHtcbiAgICAgICAgICAgIG91dC5wdXNoKGAgW1ske3RhcmdldE9mKGN1cnJlbnRfYm9vayl9ICR7Y3VycmVudF9jaGFwdGVyfSNeJHt2ZXJzZX18JHtwYXJ0fV1dYCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dC5wdXNoKFwiIFwiICsgcGFydCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG91dC5wdXNoKChpID4gMCA/IFwiIFwiIDogXCJcIikgKyBwYXJ0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gLS0tLSBmdWxsIHJlZmVyZW5jZVxuICAgIGlmIChnLnJlZikge1xuICAgICAgY29uc3QgbW0gPSAoZy5yZWYgYXMgc3RyaW5nKS5tYXRjaCgvKFxccypbXFwuLDtdPykoLispLyk7XG4gICAgICBjb25zdCBsZWFkaW5nID0gbW0gPyBtbVsxXSA6IFwiXCI7XG4gICAgICBsZXQgcmVmVGV4dCA9IG1tID8gbW1bMl0gOiAoZy5yZWYgYXMgc3RyaW5nKTtcblxuICAgICAgY29uc3QgYm9va1N0YXJ0ID0gcmVmVGV4dC5tYXRjaChuZXcgUmVnRXhwKGBeKCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccyspYCkpO1xuICAgICAgbGV0IHByZWZpeDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgICBpZiAoYm9va1N0YXJ0KSB7XG4gICAgICAgIGNvbnN0IGJvb2tQYXJ0ID0gYm9va1N0YXJ0WzBdO1xuICAgICAgICBwcmVmaXggPSBib29rUGFydDsgLy8gZm9yIGRpc3BsYXkgdGV4dCAoY2FuIGtlZXAgaXRzIGRvdClcbiAgICAgICAgY3VycmVudF9ib29rID0gbm9ybWFsaXplQm9va1Rva2VuKGJvb2tQYXJ0LnJlcGxhY2UoL1xccyskLywgXCJcIiksIGN0eCk7IC8vIDwtLSBub3JtYWxpemUgZm9yIHRhcmdldFxuICAgICAgICByZWZUZXh0ID0gcmVmVGV4dC5zbGljZShib29rUGFydC5sZW5ndGgpO1xuICAgICAgfVxuICAgICAgaWYgKCFjdXJyZW50X2Jvb2spIHtcbiAgICAgICAgLy8gRmFsbGJhY2s6IGluZmVyIGJvb2sgZnJvbSBsZWZ0IGNvbnRleHQgKGUuZy4sIFwiXHUyMDI2IEpvaG4gMToyOTsgMTI6MjQ7IFx1MjAyNlwiKVxuICAgICAgICBjb25zdCBpbmZlcnJlZCA9IGZpbmRMYXN0Qm9va0JlZm9yZSh0ZXh0LCBzdGFydCwgY3R4KTtcbiAgICAgICAgaWYgKGluZmVycmVkKSB7XG4gICAgICAgICAgY3VycmVudF9ib29rID0gaW5mZXJyZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3V0LnB1c2gobVswXSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgcGFydHMgPSByZWZUZXh0LnJlcGxhY2UoL1xcLi9nLCBcIlwiKS50cmltKCkuc3BsaXQoLyg7fCwpLyk7XG4gICAgICBjb25zdCByZXN1bHQ6IHN0cmluZ1tdID0gW107XG4gICAgICBsZXQgdmVyc2VTdHJpbmcgPSBmYWxzZTtcbiAgICAgIGN1cnJlbnRfY2hhcHRlciA9IG51bGw7XG4gICAgICBsZXQgbG9jYWxfY3VycmVudF92ZXJzZTogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGFydCA9IHBhcnRzW2ldO1xuICAgICAgICBpZiAocGFydCA9PT0gXCIsXCIgfHwgcGFydCA9PT0gXCI7XCIpIHtcbiAgICAgICAgICByZXN1bHQucHVzaChwYXJ0ICsgXCIgXCIpO1xuICAgICAgICAgIHZlcnNlU3RyaW5nID0gKHBhcnQgPT09IFwiLFwiKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcCA9IHBhcnQudHJpbSgpO1xuICAgICAgICBpZiAoIXApIGNvbnRpbnVlO1xuXG4gICAgICAgIGxldCBjaGFwOiBzdHJpbmcgfCBudW1iZXIgfCBudWxsID0gY3VycmVudF9jaGFwdGVyO1xuICAgICAgICBsZXQgdjogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGxldCB2RW5kOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBpZiAocC5pbmNsdWRlcyhcIjpcIikpIHtcbiAgICAgICAgICBjb25zdCBbY1N0ciwgdlN0cl0gPSBwLnNwbGl0KFwiOlwiKTtcbiAgICAgICAgICBjaGFwID0gY1N0cjtcbiAgICAgICAgICB2ID0gdlN0cjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodmVyc2VTdHJpbmcpIHYgPSBwO1xuICAgICAgICAgIGVsc2UgeyBjaGFwID0gcDsgdiA9IG51bGw7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2hhcCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgIGNvbnN0IGNocyA9IFN0cmluZyhjaGFwID8/IFwiXCIpLnNwbGl0KFwiLVwiKTtcbiAgICAgICAgICBjaGFwID0gcGFyc2VJbnQoY2hzWzBdLnJlcGxhY2UoL1thLXpdJC9pLCBcIlwiKSwgMTApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICBjb25zdCB2cyA9IFN0cmluZyh2KS5zcGxpdChcIi1cIik7XG4gICAgICAgICAgbG9jYWxfY3VycmVudF92ZXJzZSA9IHBhcnNlSW50KHZzWzBdLnJlcGxhY2UoL1thLXpdJC9pLCBcIlwiKSwgMTApO1xuICAgICAgICAgIHZFbmQgPSB2cy5sZW5ndGggPiAxID8gcGFyc2VJbnQodnNbMV0ucmVwbGFjZSgvW2Etel0kL2ksIFwiXCIpLCAxMCkgOiBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxvY2FsX2N1cnJlbnRfdmVyc2UgPSBudWxsO1xuICAgICAgICAgIHZFbmQgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGFyZ2V0T2YoY3VycmVudF9ib29rKTtcblxuICAgICAgICBpZiAodkVuZCkge1xuICAgICAgICAgIGNvbnN0IGRpc3BsYXlTdGFydCA9IHAucmVwbGFjZSgvXFxkK1thLXpdPyQvaSwgXCJcIik7XG4gICAgICAgICAgcmVzdWx0LnB1c2goYFtbJHt0YXJnZXR9I14ke2NoYXB9LSR7bG9jYWxfY3VycmVudF92ZXJzZX18JHtwcmVmaXggPyBwcmVmaXggOiBcIlwifSR7ZGlzcGxheVN0YXJ0fV1dYCk7XG4gICAgICAgICAgcmVzdWx0LnB1c2goYFtbJHt0YXJnZXR9I14ke2NoYXB9LSR7dkVuZH18JHtTdHJpbmcocCkubWF0Y2goLyhcXGQrW2Etel0/KSQvaSk/LlsxXSA/PyBcIlwifV1dYCk7XG4gICAgICAgICAgbG9jYWxfY3VycmVudF92ZXJzZSA9IHZFbmQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0LnB1c2goYFtbJHt0YXJnZXR9I14ke2NoYXB9JHtsb2NhbF9jdXJyZW50X3ZlcnNlID8gYC0ke2xvY2FsX2N1cnJlbnRfdmVyc2V9YCA6IFwiXCJ9fCR7cHJlZml4ID8gcHJlZml4IDogXCJcIn0ke3B9XV1gKTtcbiAgICAgICAgfVxuICAgICAgICBwcmVmaXggPSBudWxsO1xuICAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBjaGFwO1xuICAgICAgICBjdXJyZW50X3ZlcnNlID0gbG9jYWxfY3VycmVudF92ZXJzZTtcbiAgICAgIH1cblxuICAgICAgb3V0LnB1c2gobGVhZGluZyArIHJlc3VsdC5qb2luKFwiXCIpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIG91dC5wdXNoKG1bMF0pO1xuICB9XG5cbiAgb3V0LnB1c2godGV4dC5zbGljZShsYXN0UG9zKSk7XG4gIHJldHVybiBvdXQuam9pbihcIlwiKTtcbn1cblxuLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQdWJsaWMgQVBJIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxpbmtWZXJzZXNJblRleHQoXG4gIHRleHQ6IHN0cmluZyxcbiAgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncyxcbiAgdmVyc2lvblNob3J0Pzogc3RyaW5nIHwgbnVsbFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgY3R4ID0gYnVpbGRCb29rQ29udGV4dChzZXR0aW5ncyk7XG5cbiAgY29uc3QgcmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MgPSAoc2V0dGluZ3MgYXMgYW55KT8ucmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MgPz8gdHJ1ZTtcbiAgY29uc3QgcmV3cml0ZU9sZE9ic2lkaWFuTGlua3MgPSAoc2V0dGluZ3MgYXMgYW55KT8ucmV3cml0ZU9sZE9ic2lkaWFuTGlua3MgPz8gdHJ1ZTtcbiAgY29uc3Qgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSA9IChzZXR0aW5ncyBhcyBhbnkpPy5zdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlID8/IHRydWU7XG5cbiAgcmV0dXJuIHJlcGxhY2VWZXJzZVJlZmVyZW5jZXNPZk1haW5UZXh0KHRleHQsIGN0eCwge1xuICAgIHJlbW92ZU9ic2lkaWFuTGlua3M6IHJlbW92ZU9ic2lkaWFuRGlzcGxheUxpbmtzLFxuICAgIHJld3JpdGVPbGRMaW5rczogcmV3cml0ZU9sZE9ic2lkaWFuTGlua3MsXG4gICAgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSxcbiAgICB2ZXJzaW9uU2hvcnQ6IHZlcnNpb25TaG9ydCA/PyBudWxsLFxuICB9KTtcbn1cblxuLyoqID09PT09PT09PT09PT09PT09PT09PT09PT09IFZlcnNpb24gUGlja2VyIChCb2xscykgPT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxudHlwZSBCb2xsc0xhbmd1YWdlID0ge1xuICBsYW5ndWFnZTogc3RyaW5nO1xuICB0cmFuc2xhdGlvbnM6IHsgc2hvcnRfbmFtZTogc3RyaW5nOyBmdWxsX25hbWU6IHN0cmluZzsgdXBkYXRlZD86IG51bWJlcjsgZGlyPzogXCJydGxcIiB8IFwibHRyXCIgfVtdO1xufTtcblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hKc29uPFQ+KHVybDogc3RyaW5nKTogUHJvbWlzZTxUPiB7XG4gIGNvbnN0IHJlc3AgPSBhd2FpdCByZXF1ZXN0VXJsKHsgdXJsLCBtZXRob2Q6IFwiR0VUXCIgfSk7XG4gIGlmIChyZXNwLnN0YXR1cyA8IDIwMCB8fCByZXNwLnN0YXR1cyA+PSAzMDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7cmVzcC5zdGF0dXN9YCk7XG4gIH1cbiAgY29uc3QgdGV4dCA9IHJlc3AudGV4dCA/PyBcIlwiO1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHRleHQpIGFzIFQ7XG4gIH0gY2F0Y2gge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBKU09OIGZyb20gJHt1cmx9YCk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZEJvbGxzQ2F0YWxvZ3VlKCk6IFByb21pc2U8Qm9sbHNMYW5ndWFnZVtdPiB7XG4gIGNvbnN0IFVSTCA9IFwiaHR0cHM6Ly9ib2xscy5saWZlL3N0YXRpYy9ib2xscy9hcHAvdmlld3MvbGFuZ3VhZ2VzLmpzb25cIjtcbiAgcmV0dXJuIGF3YWl0IGZldGNoSnNvbjxCb2xsc0xhbmd1YWdlW10+KFVSTCk7XG59XG5cbmNsYXNzIFBpY2tWZXJzaW9uTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgbGFuZ3M6IEJvbGxzTGFuZ3VhZ2VbXSA9IFtdO1xuICBwcml2YXRlIG9uUGljazogKHZlclNob3J0OiBzdHJpbmcgfCBudWxsKSA9PiB2b2lkO1xuICBwcml2YXRlIGNob3NlbkxhbmdJZHggPSAwO1xuICBwcml2YXRlIGNob3NlblZlcklkeCA9IDA7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGxhbmdzOiBCb2xsc0xhbmd1YWdlW10sIG9uUGljazogKHZlclNob3J0OiBzdHJpbmcgfCBudWxsKSA9PiB2b2lkKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLmxhbmdzID0gbGFuZ3M7XG4gICAgdGhpcy5vblBpY2sgPSBvblBpY2s7XG4gIH1cblxuICBvbk9wZW4oKSB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkxpbmsgdmVyc2VzOiBjaG9vc2UgQmlibGUgdmVyc2lvbiAob3B0aW9uYWwpXCIgfSk7XG5cbiAgICBsZXQgbGFuZ1NlbDogSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgbGV0IHZlclNlbDogSFRNTFNlbGVjdEVsZW1lbnQ7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIkxhbmd1YWdlXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGQpID0+IHtcbiAgICAgICAgbGFuZ1NlbCA9IGQuc2VsZWN0RWw7XG4gICAgICAgIHRoaXMubGFuZ3MuZm9yRWFjaCgobCwgaWR4KSA9PiBkLmFkZE9wdGlvbihTdHJpbmcoaWR4KSwgbC5sYW5ndWFnZSkpO1xuICAgICAgICBkLnNldFZhbHVlKFN0cmluZyh0aGlzLmNob3NlbkxhbmdJZHgpKTtcbiAgICAgICAgZC5vbkNoYW5nZSgodikgPT4ge1xuICAgICAgICAgIHRoaXMuY2hvc2VuTGFuZ0lkeCA9IHBhcnNlSW50KHYsIDEwKTtcbiAgICAgICAgICAvLyByZWJ1aWxkIHZlcnNpb25zXG4gICAgICAgICAgdmVyU2VsIS5lbXB0eSgpO1xuICAgICAgICAgIGNvbnN0IHRyYW5zID0gdGhpcy5sYW5nc1t0aGlzLmNob3NlbkxhbmdJZHhdLnRyYW5zbGF0aW9ucztcbiAgICAgICAgICB0cmFucy5mb3JFYWNoKCh0LCBpKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBsYWJlbCA9IGAke3QuZnVsbF9uYW1lfSAoJHt0LnNob3J0X25hbWV9KWA7XG4gICAgICAgICAgICBjb25zdCBvcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpO1xuICAgICAgICAgICAgb3B0LnZhbHVlID0gU3RyaW5nKGkpO1xuICAgICAgICAgICAgb3B0LnRleHQgPSBsYWJlbDtcbiAgICAgICAgICAgIHZlclNlbCEuYXBwZW5kQ2hpbGQob3B0KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aGlzLmNob3NlblZlcklkeCA9IDA7XG4gICAgICAgICAgdmVyU2VsIS52YWx1ZSA9IFwiMFwiO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJUcmFuc2xhdGlvblwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkKSA9PiB7XG4gICAgICAgIHZlclNlbCA9IGQuc2VsZWN0RWw7XG4gICAgICAgIGNvbnN0IHRyYW5zID0gdGhpcy5sYW5nc1t0aGlzLmNob3NlbkxhbmdJZHhdPy50cmFuc2xhdGlvbnMgPz8gW107XG4gICAgICAgIHRyYW5zLmZvckVhY2goKHQsIGkpID0+IHtcbiAgICAgICAgICBkLmFkZE9wdGlvbihTdHJpbmcoaSksIGAke3QuZnVsbF9uYW1lfSAoJHt0LnNob3J0X25hbWV9KWApO1xuICAgICAgICB9KTtcbiAgICAgICAgZC5zZXRWYWx1ZShcIjBcIik7XG4gICAgICAgIGQub25DaGFuZ2UoKHYpID0+ICh0aGlzLmNob3NlblZlcklkeCA9IHBhcnNlSW50KHYsIDEwKSkpO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIkhvdyB0byBsaW5rXCIpXG4gICAgICAuc2V0RGVzYyhcIklmIHlvdSBjYW5jZWwsIGxpbmtzIHdpbGwgdXNlIGRlZmF1bHQgKG5vIHZlcnNpb24pLlwiKVxuICAgICAgLmFkZEJ1dHRvbigoYikgPT5cbiAgICAgICAgYi5zZXRCdXR0b25UZXh0KFwiVXNlIHNlbGVjdGVkIHZlcnNpb25cIikuc2V0Q3RhKCkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgY29uc3QgdmVyID0gdGhpcy5sYW5nc1t0aGlzLmNob3NlbkxhbmdJZHhdLnRyYW5zbGF0aW9uc1t0aGlzLmNob3NlblZlcklkeF07XG4gICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICAgIHRoaXMub25QaWNrKHZlcj8uc2hvcnRfbmFtZSA/PyBudWxsKTtcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5hZGRFeHRyYUJ1dHRvbigoYikgPT5cbiAgICAgICAgYi5zZXRJY29uKFwieFwiKS5zZXRUb29sdGlwKFwiQ2FuY2VsIChubyB2ZXJzaW9uKVwiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgdGhpcy5vblBpY2sobnVsbCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICB9XG59XG5cbi8qKiBUcnkgdG8gcGljayBhIHZlcnNpb24gdmlhIEJvbGxzOyBpZiBmZXRjaCBmYWlscywgcmVzb2x2ZSB3aXRoIG51bGwgKG5vIHZlcnNpb24pICovXG5hc3luYyBmdW5jdGlvbiBwaWNrVmVyc2lvblNob3J0T3JOdWxsKGFwcDogQXBwKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgbGFuZ3MgPSBhd2FpdCBsb2FkQm9sbHNDYXRhbG9ndWUoKTtcbiAgICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2U8c3RyaW5nIHwgbnVsbD4oKHJlc29sdmUpID0+IHtcbiAgICAgIGNvbnN0IG0gPSBuZXcgUGlja1ZlcnNpb25Nb2RhbChhcHAsIGxhbmdzLCByZXNvbHZlKTtcbiAgICAgIG0ub3BlbigpO1xuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS53YXJuKFwiW1ZlcnNlTGlua3NdIENvdWxkIG5vdCBsb2FkIEJvbGxzIGxhbmd1YWdlcy5qc29uOyBsaW5raW5nIHdpdGhvdXQgdmVyc2lvbi5cIiwgZSk7XG4gICAgbmV3IE5vdGljZShcIkNvdWxkIG5vdCBsb2FkIEJpYmxlIGNhdGFsb2d1ZS4gTGlua2luZyB3aXRob3V0IHZlcnNpb24uXCIpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKiA9PT09PT09PT09PT09PT09PT09PT09PT09PSBDb21tYW5kcyA9PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZFZlcnNlTGlua3MoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MsIHBhcmFtcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pIHtcbiAgY29uc3Qgc2NvcGUgPSBwYXJhbXM/LnNjb3BlID8/IFwiY3VycmVudFwiO1xuXG4gIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgaWYgKHNjb3BlID09PSBcImZvbGRlclwiKSB7XG4gICAgY29uc3QgYWN0aXZlID0gZmlsZTtcbiAgICBjb25zdCBmb2xkZXIgPSBhY3RpdmU/LnBhcmVudDtcbiAgICBpZiAoIWFjdGl2ZSB8fCAhZm9sZGVyKSB7XG4gICAgICBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgaW5zaWRlIHRoZSB0YXJnZXQgZm9sZGVyLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZvbGRlci5jaGlsZHJlbikge1xuICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUgJiYgY2hpbGQuZXh0ZW5zaW9uID09PSBcIm1kXCIpIHtcbiAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGNoaWxkKTtcbiAgICAgICAgY29uc3QgeyB5YW1sLCBib2R5IH0gPSBzcGxpdEZyb250bWF0dGVyKGNvbnRlbnQpO1xuICAgICAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KGJvZHksIHNldHRpbmdzLCBudWxsKTsgLy8gZGVmYXVsdDogbm8gdmVyc2lvblxuICAgICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGNoaWxkLCAoeWFtbCA/PyBcIlwiKSArIGxpbmtlZCk7XG4gICAgICB9XG4gICAgfVxuICAgIG5ldyBOb3RpY2UoXCJMaW5rZWQgdmVyc2VzIGluIGZvbGRlci5cIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCFmaWxlKSB7XG4gICAgbmV3IE5vdGljZShcIk9wZW4gYSBmaWxlIGZpcnN0LlwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjb250ZW50ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIGNvbnN0IHsgeWFtbCwgYm9keSB9ID0gc3BsaXRGcm9udG1hdHRlcihjb250ZW50KTtcbiAgY29uc3QgbGlua2VkID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChib2R5LCBzZXR0aW5ncywgbnVsbCk7IC8vIGRlZmF1bHQ6IG5vIHZlcnNpb25cbiAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCAoeWFtbCA/PyBcIlwiKSArIGxpbmtlZCk7XG4gIG5ldyBOb3RpY2UoXCJMaW5rZWQgdmVyc2VzIGluIGN1cnJlbnQgZmlsZS5cIik7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kVmVyc2VMaW5rc1NlbGVjdGlvbk9yTGluZShhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuICBjb25zdCBtZFZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgaWYgKCFtZFZpZXcpIHtcbiAgICBuZXcgTm90aWNlKFwiT3BlbiBhIE1hcmtkb3duIGZpbGUgZmlyc3QuXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGVkaXRvciA9IG1kVmlldy5lZGl0b3I7XG4gIGNvbnN0IHNlbGVjdGlvblRleHQgPSBlZGl0b3IuZ2V0U2VsZWN0aW9uKCk7XG5cbiAgY29uc3QgcnVuID0gYXN5bmMgKHRleHQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGxpbmtlZCA9IGF3YWl0IGxpbmtWZXJzZXNJblRleHQodGV4dCwgc2V0dGluZ3MsIG51bGwpOyAvLyBkZWZhdWx0OiBubyB2ZXJzaW9uXG4gICAgcmV0dXJuIGxpbmtlZDtcbiAgfTtcblxuICBpZiAoc2VsZWN0aW9uVGV4dCAmJiBzZWxlY3Rpb25UZXh0Lmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBydW4oc2VsZWN0aW9uVGV4dCk7XG4gICAgaWYgKGxpbmtlZCAhPT0gc2VsZWN0aW9uVGV4dCkge1xuICAgICAgZWRpdG9yLnJlcGxhY2VTZWxlY3Rpb24obGlua2VkKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJMaW5rZWQgdmVyc2VzIGluIHNlbGVjdGlvbi5cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJObyBsaW5rYWJsZSB2ZXJzZXMgaW4gc2VsZWN0aW9uLlwiKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRDdXJzb3IoKS5saW5lO1xuICBjb25zdCBsaW5lVGV4dCA9IGVkaXRvci5nZXRMaW5lKGxpbmUpO1xuICBjb25zdCBsaW5rZWQgPSBhd2FpdCBydW4obGluZVRleHQpO1xuICBpZiAobGlua2VkICE9PSBsaW5lVGV4dCkge1xuICAgIGVkaXRvci5zZXRMaW5lKGxpbmUsIGxpbmtlZCk7XG4gICAgbmV3IE5vdGljZShcIkxpbmtlZCB2ZXJzZXMgb24gY3VycmVudCBsaW5lLlwiKTtcbiAgfSBlbHNlIHtcbiAgICBuZXcgTm90aWNlKFwiTm8gbGlua2FibGUgdmVyc2VzIG9uIGN1cnJlbnQgbGluZS5cIik7XG4gIH1cbn1cblxuLyoqXG4gKiBORVc6IFNhbWUgYXMgYWJvdmUsIGJ1dCBhc2tzIHVzZXIgdG8gY2hvb3NlIGEgdmVyc2lvbiAoaWYgY2F0YWxvZ3VlIGxvYWRzKS5cbiAqIElmIHVzZXIgY2FuY2VscyAvIGZhaWxzIHRvIGxvYWQsIGZhbGxzIGJhY2sgdG8gbm8tdmVyc2lvbi5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbW1hbmRWZXJzZUxpbmtzQ2hvb3NlVmVyc2lvbihhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuICBjb25zdCB2ZXJzaW9uU2hvcnQgPSBhd2FpdCBwaWNrVmVyc2lvblNob3J0T3JOdWxsKGFwcCk7IC8vIG1heSBiZSBudWxsXG4gIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgaWYgKCFmaWxlKSB7XG4gICAgbmV3IE5vdGljZShcIk9wZW4gYSBmaWxlIGZpcnN0LlwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjb250ZW50ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIGNvbnN0IHsgeWFtbCwgYm9keSB9ID0gc3BsaXRGcm9udG1hdHRlcihjb250ZW50KTtcbiAgY29uc3QgbGlua2VkID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChib2R5LCBzZXR0aW5ncywgdmVyc2lvblNob3J0KTtcbiAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCAoeWFtbCA/PyBcIlwiKSArIGxpbmtlZCk7XG4gIG5ldyBOb3RpY2UodmVyc2lvblNob3J0ID8gYExpbmtlZCB2ZXJzZXMgKFx1MjE5MiAke3ZlcnNpb25TaG9ydH0pLmAgOiBcIkxpbmtlZCB2ZXJzZXMgKG5vIHZlcnNpb24pLlwiKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbW1hbmRWZXJzZUxpbmtzU2VsZWN0aW9uT3JMaW5lQ2hvb3NlVmVyc2lvbihhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuICBjb25zdCBtZFZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgaWYgKCFtZFZpZXcpIHtcbiAgICBuZXcgTm90aWNlKFwiT3BlbiBhIE1hcmtkb3duIGZpbGUgZmlyc3QuXCIpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB2ZXJzaW9uU2hvcnQgPSBhd2FpdCBwaWNrVmVyc2lvblNob3J0T3JOdWxsKGFwcCk7IC8vIG1heSBiZSBudWxsXG5cbiAgY29uc3QgZWRpdG9yID0gbWRWaWV3LmVkaXRvcjtcbiAgY29uc3Qgc2VsZWN0aW9uVGV4dCA9IGVkaXRvci5nZXRTZWxlY3Rpb24oKTtcblxuICBjb25zdCBydW4gPSBhc3luYyAodGV4dDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgbGlua2VkID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dCh0ZXh0LCBzZXR0aW5ncywgdmVyc2lvblNob3J0KTtcbiAgICByZXR1cm4gbGlua2VkO1xuICB9O1xuXG4gIGlmIChzZWxlY3Rpb25UZXh0ICYmIHNlbGVjdGlvblRleHQubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGxpbmtlZCA9IGF3YWl0IHJ1bihzZWxlY3Rpb25UZXh0KTtcbiAgICBpZiAobGlua2VkICE9PSBzZWxlY3Rpb25UZXh0KSB7XG4gICAgICBlZGl0b3IucmVwbGFjZVNlbGVjdGlvbihsaW5rZWQpO1xuICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgdmVyc2lvblNob3J0ID8gYExpbmtlZCAoc2VsZWN0aW9uKSBcdTIxOTIgJHt2ZXJzaW9uU2hvcnR9LmAgOiBcIkxpbmtlZCAoc2VsZWN0aW9uKSB3aXRob3V0IHZlcnNpb24uXCJcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJObyBsaW5rYWJsZSB2ZXJzZXMgaW4gc2VsZWN0aW9uLlwiKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRDdXJzb3IoKS5saW5lO1xuICBjb25zdCBsaW5lVGV4dCA9IGVkaXRvci5nZXRMaW5lKGxpbmUpO1xuICBjb25zdCBsaW5rZWQgPSBhd2FpdCBydW4obGluZVRleHQpO1xuICBpZiAobGlua2VkICE9PSBsaW5lVGV4dCkge1xuICAgIGVkaXRvci5zZXRMaW5lKGxpbmUsIGxpbmtlZCk7XG4gICAgbmV3IE5vdGljZSh2ZXJzaW9uU2hvcnQgPyBgTGlua2VkIChsaW5lKSBcdTIxOTIgJHt2ZXJzaW9uU2hvcnR9LmAgOiBcIkxpbmtlZCAobGluZSkgd2l0aG91dCB2ZXJzaW9uLlwiKTtcbiAgfSBlbHNlIHtcbiAgICBuZXcgTm90aWNlKFwiTm8gbGlua2FibGUgdmVyc2VzIG9uIGN1cnJlbnQgbGluZS5cIik7XG4gIH1cbn1cblxuLy8gaW1wb3J0IHsgQXBwLCBNYXJrZG93blZpZXcsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbi8vIGltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuLy8gaW1wb3J0IHsgc3BsaXRGcm9udG1hdHRlciB9IGZyb20gXCIuLi9saWIvbWRVdGlsc1wiO1xuXG4vLyAvKiogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyAgKiAgQk9PSyBNQVAgKGRlZmF1bHQsIEVuZ2xpc2gpXG4vLyAgKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbi8vIGNvbnN0IEJPT0tfQUJCUjogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbi8vICAgXCJHZW5lc2lzXCI6IFwiR2VuXCIsXG4vLyAgIFwiRXhvZHVzXCI6IFwiRXhvXCIsXG4vLyAgIFwiTGV2aXRpY3VzXCI6IFwiTGV2XCIsXG4vLyAgIFwiTnVtYmVyc1wiOiBcIk51bVwiLFxuLy8gICBcIkRldXRlcm9ub215XCI6IFwiRGV1dFwiLFxuLy8gICBcIkpvc2h1YVwiOiBcIkpvc2hcIixcbi8vICAgXCJKdWRnZXNcIjogXCJKdWRnXCIsXG4vLyAgIFwiUnV0aFwiOiBcIlJ1dGhcIixcbi8vICAgXCIxIFNhbXVlbFwiOiBcIjEgU2FtXCIsXG4vLyAgIFwiRmlyc3QgU2FtdWVsXCI6IFwiMSBTYW1cIixcbi8vICAgXCIyIFNhbXVlbFwiOiBcIjIgU2FtXCIsXG4vLyAgIFwiU2Vjb25kIFNhbXVlbFwiOiBcIjIgU2FtXCIsXG4vLyAgIFwiMSBLaW5nc1wiOiBcIjEgS2luZ3NcIixcbi8vICAgXCJGaXJzdCBLaW5nc1wiOiBcIjEgS2luZ3NcIixcbi8vICAgXCIyIEtpbmdzXCI6IFwiMiBLaW5nc1wiLFxuLy8gICBcIlNlY29uZCBLaW5nc1wiOiBcIjIgS2luZ3NcIixcbi8vICAgXCIxIENocm9uaWNsZXNcIjogXCIxIENocm9uXCIsXG4vLyAgIFwiRmlyc3QgQ2hyb25pY2xlc1wiOiBcIjEgQ2hyb25cIixcbi8vICAgXCIyIENocm9uaWNsZXNcIjogXCIyIENocm9uXCIsXG4vLyAgIFwiU2Vjb25kIENocm9uaWNsZXNcIjogXCIyIENocm9uXCIsXG4vLyAgIFwiRXpyYVwiOiBcIkV6cmFcIixcbi8vICAgXCJOZWhlbWlhaFwiOiBcIk5laFwiLFxuLy8gICBcIkVzdGhlclwiOiBcIkVzdGhcIixcbi8vICAgXCJKb2JcIjogXCJKb2JcIixcbi8vICAgXCJQc2FsbXNcIjogXCJQc2FcIixcbi8vICAgXCJQc2FsbVwiOiBcIlBzYVwiLFxuLy8gICBcIlByb3ZlcmJzXCI6IFwiUHJvdlwiLFxuLy8gICBcIkVjY2xlc2lhc3Rlc1wiOiBcIkVjY2xcIixcbi8vICAgXCJTb25nIG9mIFNvbG9tb25cIjogXCJTb1NcIixcbi8vICAgXCJTb25nIG9mIFNvbmdzXCI6IFwiU29TXCIsXG4vLyAgIFwiUy5TXCI6IFwiU29TXCIsXG4vLyAgIFwiUy5TLlwiOiBcIlNvU1wiLFxuLy8gICBcIlMuIFMuXCI6IFwiU29TXCIsXG4vLyAgIFwiUy4gU1wiOiBcIlNvU1wiLFxuLy8gICBcIlNTXCI6IFwiU29TXCIsXG4vLyAgIFwiSXNhaWFoXCI6IFwiSXNhXCIsXG4vLyAgIFwiSmVyZW1pYWhcIjogXCJKZXJcIixcbi8vICAgXCJMYW1lbnRhdGlvbnNcIjogXCJMYW1cIixcbi8vICAgXCJFemVraWVsXCI6IFwiRXpla1wiLFxuLy8gICBcIkRhbmllbFwiOiBcIkRhblwiLFxuLy8gICBcIkhvc2VhXCI6IFwiSG9zZWFcIixcbi8vICAgXCJKb2VsXCI6IFwiSm9lbFwiLFxuLy8gICBcIkFtb3NcIjogXCJBbW9zXCIsXG4vLyAgIFwiT2JhZGlhaFwiOiBcIk9iYWRcIixcbi8vICAgXCJKb25haFwiOiBcIkpvbmFoXCIsXG4vLyAgIFwiTWljYWhcIjogXCJNaWNhaFwiLFxuLy8gICBcIk5haHVtXCI6IFwiTmFoXCIsXG4vLyAgIFwiSGFiYWtrdWtcIjogXCJIYWJcIixcbi8vICAgXCJaZXBoYW5pYWhcIjogXCJaZXBcIixcbi8vICAgXCJIYWdnYWlcIjogXCJIYWdcIixcbi8vICAgXCJaZWNoYXJpYWhcIjogXCJaZWNoXCIsXG4vLyAgIFwiTWFsYWNoaVwiOiBcIk1hbFwiLFxuLy8gICBcIk1hdHRoZXdcIjogXCJNYXR0XCIsXG4vLyAgIFwiTWFya1wiOiBcIk1hcmtcIixcbi8vICAgXCJMdWtlXCI6IFwiTHVrZVwiLFxuLy8gICBcIkpvaG5cIjogXCJKb2huXCIsXG4vLyAgIFwiQWN0c1wiOiBcIkFjdHNcIixcbi8vICAgXCJSb21hbnNcIjogXCJSb21cIixcbi8vICAgXCIxIENvcmludGhpYW5zXCI6IFwiMSBDb3JcIixcbi8vICAgXCJGaXJzdCBDb3JpbnRoaWFuc1wiOiBcIjEgQ29yXCIsXG4vLyAgIFwiMiBDb3JpbnRoaWFuc1wiOiBcIjIgQ29yXCIsXG4vLyAgIFwiU2Vjb25kIENvcmludGhpYW5zXCI6IFwiMiBDb3JcIixcbi8vICAgXCJHYWxhdGlhbnNcIjogXCJHYWxcIixcbi8vICAgXCJFcGhlc2lhbnNcIjogXCJFcGhcIixcbi8vICAgXCJQaGlsaXBwaWFuc1wiOiBcIlBoaWxcIixcbi8vICAgXCJDb2xvc3NpYW5zXCI6IFwiQ29sXCIsXG4vLyAgIFwiMSBUaGVzc2Fsb25pYW5zXCI6IFwiMSBUaGVzXCIsXG4vLyAgIFwiRmlyc3QgVGhlc3NhbG9uaWFuc1wiOiBcIjEgVGhlc1wiLFxuLy8gICBcIjIgVGhlc3NhbG9uaWFuc1wiOiBcIjIgVGhlc1wiLFxuLy8gICBcIlNlY29uZCBUaGVzc2Fsb25pYW5zXCI6IFwiMiBUaGVzXCIsXG4vLyAgIFwiMSBUaW1vdGh5XCI6IFwiMSBUaW1cIixcbi8vICAgXCJGaXJzdCBUaW1vdGh5XCI6IFwiMSBUaW1cIixcbi8vICAgXCIyIFRpbW90aHlcIjogXCIyIFRpbVwiLFxuLy8gICBcIlNlY29uZCBUaW1vdGh5XCI6IFwiMiBUaW1cIixcbi8vICAgXCJUaXR1c1wiOiBcIlRpdHVzXCIsXG4vLyAgIFwiUGhpbGVtb25cIjogXCJQaGlsZW1cIixcbi8vICAgXCJIZWJyZXdzXCI6IFwiSGViXCIsXG4vLyAgIFwiSmFtZXNcIjogXCJKYW1lc1wiLFxuLy8gICBcIjEgUGV0ZXJcIjogXCIxIFBldFwiLFxuLy8gICBcIkZpcnN0IFBldGVyXCI6IFwiMSBQZXRcIixcbi8vICAgXCIyIFBldGVyXCI6IFwiMiBQZXRcIixcbi8vICAgXCJTZWNvbmQgUGV0ZXJcIjogXCIyIFBldFwiLFxuLy8gICBcIjEgSm9oblwiOiBcIjEgSm9oblwiLFxuLy8gICBcIkZpcnN0IEpvaG5cIjogXCIxIEpvaG5cIixcbi8vICAgXCIyIEpvaG5cIjogXCIyIEpvaG5cIixcbi8vICAgXCJTZWNvbmQgSm9oblwiOiBcIjIgSm9oblwiLFxuLy8gICBcIjMgSm9oblwiOiBcIjMgSm9oblwiLFxuLy8gICBcIlRoaXJkIEpvaG5cIjogXCIzIEpvaG5cIixcbi8vICAgXCJKdWRlXCI6IFwiSnVkZVwiLFxuLy8gICBcIlJldmVsYXRpb25cIjogXCJSZXZcIlxuLy8gfTtcblxuLy8gdHlwZSBCb29rTWFwID0gUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbi8vIGNvbnN0IGVzY2FwZVJlID0gKHM6IHN0cmluZykgPT4gcy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG5cbi8vIC8qKiBCdWlsZCBsb2NhbGUtc3BlY2lmaWMgYm9vayBtYXAgKyBhbHRlcm5hdGlvbiBhdCBydW50aW1lICovXG4vLyBmdW5jdGlvbiBidWlsZEJvb2tDb250ZXh0KHNldHRpbmdzPzogQmlibGVUb29sc1NldHRpbmdzKSB7XG4vLyAgIGxldCBib29rTG9jYWxlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4vLyAgIGxldCBjdXN0b206IHVua25vd247XG5cbi8vICAgdHJ5IHsgYm9va0xvY2FsZSA9IChzZXR0aW5ncyBhcyBhbnkpPy5ib29rTG9jYWxlIGFzIHN0cmluZyB8IHVuZGVmaW5lZDsgfSBjYXRjaCB7fVxuLy8gICB0cnkgeyBjdXN0b20gPSAoc2V0dGluZ3MgYXMgYW55KT8uY3VzdG9tQm9va01hcDsgfSBjYXRjaCB7fVxuXG4vLyAgIGxldCBhYmJyOiBCb29rTWFwID0gQk9PS19BQkJSO1xuXG4vLyAgIGlmIChib29rTG9jYWxlID09PSBcImN1c3RvbVwiICYmIGN1c3RvbSkge1xuLy8gICAgIHRyeSB7XG4vLyAgICAgICBpZiAodHlwZW9mIGN1c3RvbSA9PT0gXCJzdHJpbmdcIikge1xuLy8gICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGN1c3RvbSk7XG4vLyAgICAgICAgIGlmIChwYXJzZWQgJiYgdHlwZW9mIHBhcnNlZCA9PT0gXCJvYmplY3RcIikgYWJiciA9IHBhcnNlZCBhcyBCb29rTWFwO1xuLy8gICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY3VzdG9tID09PSBcIm9iamVjdFwiKSB7XG4vLyAgICAgICAgIGFiYnIgPSBjdXN0b20gYXMgQm9va01hcDtcbi8vICAgICAgIH1cbi8vICAgICB9IGNhdGNoIHtcbi8vICAgICAgIGFiYnIgPSBCT09LX0FCQlI7XG4vLyAgICAgfVxuLy8gICB9IGVsc2Uge1xuLy8gICAgIGFiYnIgPSBCT09LX0FCQlI7XG4vLyAgIH1cblxuLy8gICBjb25zdCBhbGxUb2tlbnMgPSBBcnJheS5mcm9tKG5ldyBTZXQoWy4uLk9iamVjdC5rZXlzKGFiYnIpLCAuLi5PYmplY3QudmFsdWVzKGFiYnIpXSkpLnNvcnQoXG4vLyAgICAgKGEsIGIpID0+IGIubGVuZ3RoIC0gYS5sZW5ndGhcbi8vICAgKTtcbi8vICAgY29uc3QgQk9PS19BTFQgPSBhbGxUb2tlbnMubWFwKGVzY2FwZVJlKS5qb2luKFwifFwiKTtcblxuLy8gICBjb25zdCBnZXRCb29rQWJiciA9IChib29rOiBzdHJpbmcpID0+IGFiYnJbYm9va10gPz8gYm9vaztcblxuLy8gICBjb25zdCBidWlsZFBhdHRlcm5Cb2R5ID0gKCk6IHN0cmluZyA9PiB7XG4vLyAgICAgY29uc3QgYm9vayA9IGAoPzoke0JPT0tfQUxUfSlgO1xuLy8gICAgIC8vIGNvbnN0IHJlZjEgPVxuLy8gICAgIC8vICAgYCg/Oig/OiR7Ym9va30pXFxcXC4/XFxcXHMqYCArXG4vLyAgICAgLy8gICBgXFxcXGQrKD86LVxcXFxkKyk/OlxcXFxkK1thLXpdPyg/Oi1cXFxcZCspP1thLXpdP2AgK1xuLy8gICAgIC8vICAgYCg/OlxcXFxzKixcXFxccypcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT98XFxcXHMqO1xcXFxzKlxcXFxkKzpcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT8pKmAgK1xuLy8gICAgIC8vICAgYClgO1xuLy8gICAgIGNvbnN0IHJlZjEgPVxuLy8gICAgICAgYCg/Oig/OiR7Ym9va30pP1xcXFwuP1xcXFxzKmAgK1xuLy8gICAgICAgYFxcXFxkKyg/Oi1cXFxcZCspPzpcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT9gICtcbi8vICAgICAgIGAoPzpcXFxccyosXFxcXHMqXFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/fFxcXFxzKjtcXFxccypcXFxcZCs6XFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/KSpgICtcbi8vICAgICAgIGApYDtcbi8vICAgICBjb25zdCByZWYyID0gYCg/Oigke2Jvb2t9KVxcXFwuP1xcXFxzKyhcXFxcZCspKD86LShcXFxcZCspKT8pYDtcbi8vICAgICBjb25zdCBSRUYgPSBgKD88cmVmPiR7cmVmMX18JHtyZWYyfSlgO1xuXG4vLyAgICAgY29uc3QgVkVSU0UgPVxuLy8gICAgICAgYCg/PHZlcnNlPmAgK1xuLy8gICAgICAgYFxcXFxiW1Z2XXY/KD86XFxcXC58ZXJzZXM/KVxcXFxzKmAgK1xuLy8gICAgICAgYFxcXFxkKyg/Oi1cXFxcZCspP1thLXpdP2AgK1xuLy8gICAgICAgYCg/Oig/Oix8LD9cXFxccyphbmQpXFxcXHMqXFxcXGQrKD86LVxcXFxkKyk/W2Etel0/KSpgICtcbi8vICAgICAgIGApYDtcblxuLy8gICAgIGNvbnN0IENIQVBURVIgPVxuLy8gICAgICAgYCg/PGNoYXB0ZXI+YCArXG4vLyAgICAgICBgXFxcXGJbQ2NdaCg/OmFwdGVycz98cz9cXFxcLilcXFxcLj9cXFxccypgICtcbi8vICAgICAgIGBcXFxcZCsoPzotXFxcXGQrKT9gICtcbi8vICAgICAgIGApYDtcblxuLy8gICAgIGNvbnN0IE5PVEUgPVxuLy8gICAgICAgYCg/PG5vdGU+YCArXG4vLyAgICAgICBgXFxcXGJbTm5db3Rlcz9gICtcbi8vICAgICAgIGAoPzpcXFxccytcXFxcZCsoPzpcXFxccytcXFxcZCspP2AgK1xuLy8gICAgICAgYCg/OmAgK1xuLy8gICAgICAgYCg/OlssO118LD9cXFxccyphbmQpXFxcXHMqXFxcXGQrKD86XFxcXHMrXFxcXGQrKT9gICtcbi8vICAgICAgIGAoPzpcXFxccytpblxcXFxzKyR7Ym9va31cXFxcLj9cXFxccytcXFxcZCspP2AgK1xuLy8gICAgICAgYCkqYCArXG4vLyAgICAgICBgKWAgK1xuLy8gICAgICAgYCg/OlxcXFxzK2luXFxcXHMrJHtib29rfVxcXFwuP1xcXFxzK1xcXFxkKyk/YCArXG4vLyAgICAgICBgKWA7XG5cbi8vICAgICBjb25zdCBCT09LID0gYCg/PGJvb2s+XFxcXGIoPzoke2Jvb2t9KVxcXFxiKSg/IVxcXFwuP1xcXFxzKlxcXFxkKylgO1xuXG4vLyAgICAgcmV0dXJuIGAke1JFRn18JHtWRVJTRX18JHtDSEFQVEVSfXwke05PVEV9fCR7Qk9PS31gO1xuLy8gICB9O1xuXG4vLyAgIGNvbnN0IFBBVFRFUk5fQk9EWSA9IGJ1aWxkUGF0dGVybkJvZHkoKTtcbi8vICAgY29uc3QgUEFUVEVSTl9HID0gbmV3IFJlZ0V4cChQQVRURVJOX0JPRFksIFwiZ1wiKTtcbi8vICAgY29uc3QgUEFUVEVSTl9IRUFEID0gbmV3IFJlZ0V4cChcIl5cIiArIFBBVFRFUk5fQk9EWSk7XG5cbi8vICAgcmV0dXJuIHsgYWJiciwgYWxsVG9rZW5zLCBCT09LX0FMVCwgZ2V0Qm9va0FiYnIsIFBBVFRFUk5fRywgUEFUVEVSTl9IRUFEIH07XG4vLyB9XG5cbi8vIC8qKiAtLS0tLS0tLS0tLS0tLS0tIFV0aWxpdHk6IG5vcm1hbGl6ZSBib29rIHRva2VuIHRvIHJlbW92ZSB0cmFpbGluZyBwZXJpb2QgLS0tLS0tLS0tLS0tLS0tICovXG4vLyBmdW5jdGlvbiBub3JtYWxpemVCb29rVG9rZW4ocmF3OiBzdHJpbmcsIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4pOiBzdHJpbmcge1xuLy8gICAvLyBUcmltIGFuZCBkcm9wIGEgc2luZ2xlIHRyYWlsaW5nIGRvdCAoZS5nLiwgXCJSb20uXCIgLT4gXCJSb21cIilcbi8vICAgY29uc3QgY2xlYW5lZCA9IHJhdy50cmltKCkucmVwbGFjZSgvXFwuJC8sIFwiXCIpO1xuLy8gICByZXR1cm4gY3R4LmdldEJvb2tBYmJyKGNsZWFuZWQpO1xuLy8gfVxuXG4vLyAvKiogLS0tLS0tLS0tLS0tLS0gUHJvdGVjdGVkIHJhbmdlcyAoZG9uXHUyMDE5dCB0b3VjaCB3aGlsZSBsaW5raW5nKSAtLS0tLS0tLS0tLS0tLSAqL1xuLy8gdHlwZSBSYW5nZSA9IFtzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcl07XG5cbi8vIGZ1bmN0aW9uIGFkZFJhbmdlKHJhbmdlczogUmFuZ2VbXSwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbi8vICAgaWYgKHN0YXJ0ID49IDAgJiYgZW5kID4gc3RhcnQpIHJhbmdlcy5wdXNoKFtzdGFydCwgZW5kXSk7XG4vLyB9XG5cbi8vIGZ1bmN0aW9uIGZpbmRQcm90ZWN0ZWRSYW5nZXModGV4dDogc3RyaW5nKTogUmFuZ2VbXSB7XG4vLyAgIGNvbnN0IHJhbmdlczogUmFuZ2VbXSA9IFtdO1xuXG4vLyAgIC8vIDEpIENvZGUgZmVuY2VzIGBgYC4uLmBgYCBhbmQgfn5+Li4ufn5+XG4vLyAgIGNvbnN0IGZlbmNlUmUgPSAvKGBgYHx+fn4pW15cXG5dKlxcbltcXHNcXFNdKj9cXDEvZztcbi8vICAgZm9yIChsZXQgbTsgKG0gPSBmZW5jZVJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuLy8gICAvLyAyKSBNYXRoIGJsb2NrcyAkJC4uLiQkXG4vLyAgIGNvbnN0IG1hdGhCbG9ja1JlID0gL1xcJFxcJFtcXHNcXFNdKj9cXCRcXCQvZztcbi8vICAgZm9yIChsZXQgbTsgKG0gPSBtYXRoQmxvY2tSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbi8vICAgLy8gMykgSW5saW5lIGNvZGUgYC4uLmBcbi8vICAgY29uc3QgaW5saW5lQ29kZVJlID0gL2BbXmBcXG5dKmAvZztcbi8vICAgZm9yIChsZXQgbTsgKG0gPSBpbmxpbmVDb2RlUmUuZXhlYyh0ZXh0KSk7ICkgYWRkUmFuZ2UocmFuZ2VzLCBtLmluZGV4LCBtLmluZGV4ICsgbVswXS5sZW5ndGgpO1xuXG4vLyAgIC8vIDQpIElubGluZSBtYXRoICQuLi4kIChhdm9pZCAkJClcbi8vICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgKSB7XG4vLyAgICAgaWYgKHRleHRbaV0gPT09IFwiJFwiICYmIHRleHRbaSArIDFdICE9PSBcIiRcIikge1xuLy8gICAgICAgY29uc3Qgc3RhcnQgPSBpO1xuLy8gICAgICAgaSsrO1xuLy8gICAgICAgd2hpbGUgKGkgPCB0ZXh0Lmxlbmd0aCAmJiB0ZXh0W2ldICE9PSBcIiRcIikgaSsrO1xuLy8gICAgICAgaWYgKGkgPCB0ZXh0Lmxlbmd0aCAmJiB0ZXh0W2ldID09PSBcIiRcIikge1xuLy8gICAgICAgICBhZGRSYW5nZShyYW5nZXMsIHN0YXJ0LCBpICsgMSk7XG4vLyAgICAgICAgIGkrKztcbi8vICAgICAgICAgY29udGludWU7XG4vLyAgICAgICB9XG4vLyAgICAgfVxuLy8gICAgIGkrKztcbi8vICAgfVxuXG4vLyAgIC8vIDUpIE1hcmtkb3duIGxpbmtzIFt0ZXh0XSh1cmwpXG4vLyAgIGNvbnN0IG1kTGlua1JlID0gL1xcW1teXFxdXSs/XFxdXFwoW14pXStcXCkvZztcbi8vICAgZm9yIChsZXQgbTsgKG0gPSBtZExpbmtSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbi8vICAgLy8gNikgSW5saW5lIHByb3BlcnRpZXMgbGluZXM6ICBrZXk6OiB2YWx1ZVxuLy8gICBjb25zdCBpbmxpbmVQcm9wUmUgPSAvXlteXFxuOl17MSwyMDB9OjouKiQvZ207XG4vLyAgIGZvciAobGV0IG07IChtID0gaW5saW5lUHJvcFJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuLy8gICAvLyA3KSBPYnNpZGlhbiBsaW5rcyBbWy4uLl1dXG4vLyAgIGNvbnN0IG9ic2lkaWFuUmUgPSAvXFxbXFxbW15cXF1dKj9cXF1cXF0vZztcbi8vICAgZm9yIChsZXQgbTsgKG0gPSBvYnNpZGlhblJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuLy8gICAvLyBNZXJnZSBvdmVybGFwcyAmIHNvcnRcbi8vICAgcmFuZ2VzLnNvcnQoKGEsIGIpID0+IGFbMF0gLSBiWzBdKTtcbi8vICAgY29uc3QgbWVyZ2VkOiBSYW5nZVtdID0gW107XG4vLyAgIGZvciAoY29uc3QgciBvZiByYW5nZXMpIHtcbi8vICAgICBpZiAoIW1lcmdlZC5sZW5ndGggfHwgclswXSA+IG1lcmdlZFttZXJnZWQubGVuZ3RoIC0gMV1bMV0pIG1lcmdlZC5wdXNoKHIpO1xuLy8gICAgIGVsc2UgbWVyZ2VkW21lcmdlZC5sZW5ndGggLSAxXVsxXSA9IE1hdGgubWF4KG1lcmdlZFttZXJnZWQubGVuZ3RoIC0gMV1bMV0sIHJbMV0pO1xuLy8gICB9XG4vLyAgIHJldHVybiBtZXJnZWQ7XG4vLyB9XG5cbi8vIGZ1bmN0aW9uIGluUHJvdGVjdGVkKHBvczogbnVtYmVyLCByYW5nZXM6IFJhbmdlW10pOiBib29sZWFuIHtcbi8vICAgbGV0IGxvID0gMCwgaGkgPSByYW5nZXMubGVuZ3RoIC0gMTtcbi8vICAgd2hpbGUgKGxvIDw9IGhpKSB7XG4vLyAgICAgY29uc3QgbWlkID0gKGxvICsgaGkpID4+IDE7XG4vLyAgICAgY29uc3QgW3MsIGVdID0gcmFuZ2VzW21pZF07XG4vLyAgICAgaWYgKHBvcyA8IHMpIGhpID0gbWlkIC0gMTtcbi8vICAgICBlbHNlIGlmIChwb3MgPj0gZSkgbG8gPSBtaWQgKyAxO1xuLy8gICAgIGVsc2UgcmV0dXJuIHRydWU7XG4vLyAgIH1cbi8vICAgcmV0dXJuIGZhbHNlO1xuLy8gfVxuXG4vLyBmdW5jdGlvbiBpc1dpdGhpbk9ic2lkaWFuTGluayh0ZXh0OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTogYm9vbGVhbiB7XG4vLyAgIGNvbnN0IGJlZm9yZSA9IHRleHQuc2xpY2UoMCwgc3RhcnQpO1xuLy8gICBjb25zdCBhZnRlciA9IHRleHQuc2xpY2UoZW5kKTtcbi8vICAgY29uc3Qgb3BlbklkeCA9IGJlZm9yZS5sYXN0SW5kZXhPZihcIltbXCIpO1xuLy8gICBjb25zdCBjbG9zZUlkeCA9IGJlZm9yZS5sYXN0SW5kZXhPZihcIl1dXCIpO1xuLy8gICBpZiAob3BlbklkeCA+IGNsb3NlSWR4KSB7XG4vLyAgICAgY29uc3QgbmV4dENsb3NlID0gYWZ0ZXIuaW5kZXhPZihcIl1dXCIpO1xuLy8gICAgIGlmIChuZXh0Q2xvc2UgIT09IC0xKSByZXR1cm4gdHJ1ZTtcbi8vICAgfVxuLy8gICByZXR1cm4gZmFsc2U7XG4vLyB9XG5cbi8vIC8qKiBQYXJlbnRoZXRpY2FsIG5vaXNlOiBza2lwIGlmIGluc2lkZSBcIigyMDE5KVwiLWxpa2UgcGFyZW50aGVzZXMgKi9cbi8vIGZ1bmN0aW9uIGlzSW5zaWRlTnVtZXJpY1BhcmVucyh0ZXh0OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTogYm9vbGVhbiB7XG4vLyAgIGNvbnN0IG9wZW4gPSB0ZXh0Lmxhc3RJbmRleE9mKFwiKFwiLCBzdGFydCk7XG4vLyAgIGlmIChvcGVuID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuLy8gICBjb25zdCBjbG9zZSA9IHRleHQuaW5kZXhPZihcIilcIiwgZW5kKTtcbi8vICAgaWYgKGNsb3NlID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuLy8gICBjb25zdCBpbm5lciA9IHRleHQuc2xpY2Uob3BlbiArIDEsIGNsb3NlKS50cmltKCk7XG4vLyAgIGlmICgvXlxcZHsxLDR9KD86W1xcL1xcLlxcLTpdXFxkezEsMn0oPzpbXFwvXFwuXFwtOl1cXGR7MSw0fSk/KT8kLy50ZXN0KGlubmVyKSkgcmV0dXJuIHRydWU7XG4vLyAgIGlmICgvXnB7MSwyfVxcLlxccypcXGQrKFxccyotXFxzKlxcZCspPyQvaS50ZXN0KGlubmVyKSkgcmV0dXJuIHRydWU7XG4vLyAgIHJldHVybiBmYWxzZTtcbi8vIH1cblxuLy8gLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0gTWFya2Rvd24vT2JzaWRpYW4gbGluayBjbGVhbnVwIChQeXRob24gcGFyaXR5KSAtLS0tLS0tLS0tLS0tLS0tLS0tICovXG4vLyBmdW5jdGlvbiByZW1vdmVNYXRjaGluZ01hcmtkb3duTGlua3ModGV4dDogc3RyaW5nLCBQQVRURVJOX0hFQUQ6IFJlZ0V4cCk6IHN0cmluZyB7XG4vLyAgIGNvbnN0IG1kTGluayA9IC8oXFwqXFwqfF9ffFxcKik/XFxbKFteXFxdXSspXFxdXFwoW14pXStcXCkoXFwqXFwqfF9ffFxcKik/L2c7XG4vLyAgIHJldHVybiB0ZXh0LnJlcGxhY2UobWRMaW5rLCAoX20sIHByZSwgZGlzcCwgc3VmKSA9PiB7XG4vLyAgICAgY29uc3QgbGlua1RleHQgPSBTdHJpbmcoZGlzcCk7XG4vLyAgICAgaWYgKFBBVFRFUk5fSEVBRC50ZXN0KGxpbmtUZXh0KSkgcmV0dXJuIGxpbmtUZXh0O1xuLy8gICAgIGNvbnN0IHNpbXBsZU51bSA9IC9eXFxkKyg/Ols6LV1cXGQrKT8oPzotXFxkKyk/JC8udGVzdChsaW5rVGV4dCk7XG4vLyAgICAgaWYgKHNpbXBsZU51bSkgcmV0dXJuIGxpbmtUZXh0O1xuLy8gICAgIHJldHVybiBgJHtwcmUgPz8gXCJcIn1bJHtsaW5rVGV4dH1dJHtzdWYgPz8gXCJcIn1gO1xuLy8gICB9KTtcbi8vIH1cblxuLy8gZnVuY3Rpb24gcmVtb3ZlTWF0Y2hpbmdPYnNpZGlhbkxpbmtzKHRleHQ6IHN0cmluZywgUEFUVEVSTl9IRUFEOiBSZWdFeHApOiBzdHJpbmcge1xuLy8gICBjb25zdCBvYnMgPSAvXFxbXFxbKFteXFxdfF0rKVxcfChbXlxcXV0rKVxcXVxcXS9nO1xuLy8gICByZXR1cm4gdGV4dC5yZXBsYWNlKG9icywgKF9tLCBfdCwgZGlzcCkgPT4ge1xuLy8gICAgIGNvbnN0IGRpc3BsYXkgPSBTdHJpbmcoZGlzcCk7XG4vLyAgICAgaWYgKFBBVFRFUk5fSEVBRC50ZXN0KGRpc3BsYXkpKSByZXR1cm4gZGlzcGxheTtcbi8vICAgICBjb25zdCBzaW1wbGVOdW0gPSAvXlxcZCsoPzpbOi1dXFxkKyk/KD86LVxcZCspPyQvLnRlc3QoZGlzcGxheSk7XG4vLyAgICAgaWYgKHNpbXBsZU51bSkgcmV0dXJuIGRpc3BsYXk7XG4vLyAgICAgcmV0dXJuIF9tO1xuLy8gICB9KTtcbi8vIH1cblxuLy8gZnVuY3Rpb24gcmVwbGFjZU9sZE9ic2lkaWFuTGlua3ModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbi8vICAgY29uc3Qgb2xkTGluayA9IC9cXFtcXFsoWzAtOV0/XFxzW0EtWmEteiBdKylcXHMoXFxkKykjXFxeKFxcZCspKD86XFx8KFteXFxdXSspKT9cXF1cXF0vZztcbi8vICAgcmV0dXJuIHRleHQucmVwbGFjZShvbGRMaW5rLCAoX20sIGJvb2tTaG9ydCwgY2gsIHZlcnNlLCBkaXNwKSA9PiB7XG4vLyAgICAgY29uc3QgYiA9IFN0cmluZyhib29rU2hvcnQpLnRyaW0oKTtcbi8vICAgICByZXR1cm4gZGlzcFxuLy8gICAgICAgPyBgW1ske2J9I14ke2NofS0ke3ZlcnNlfXwke2Rpc3B9XV1gXG4vLyAgICAgICA6IGBbWyR7Yn0jXiR7Y2h9LSR7dmVyc2V9XV1gO1xuLy8gICB9KTtcbi8vIH1cblxuLy8gZnVuY3Rpb24gZmluZExhc3RCb29rQmVmb3JlKHRleHQ6IHN0cmluZywgcG9zOiBudW1iZXIsIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4pOiBzdHJpbmcgfCBudWxsIHtcbi8vICAgLy8gTG9vayBiYWNrIH4yMDAgY2hhcnMgZm9yIGEgYm9vayB0b2tlbiBlbmRpbmcgcmlnaHQgYmVmb3JlICdwb3MnXG4vLyAgIGNvbnN0IHN0YXJ0ID0gTWF0aC5tYXgoMCwgcG9zIC0gMjAwKTtcbi8vICAgY29uc3QgbGVmdCA9IHRleHQuc2xpY2Uoc3RhcnQsIHBvcyk7XG5cbi8vICAgLy8gTWF0Y2ggQUxMIGJvb2sgdG9rZW5zIGluIHRoZSB3aW5kb3c7IHRha2UgdGhlIGxhc3Qgb25lLlxuLy8gICBjb25zdCByZSA9IG5ldyBSZWdFeHAoYCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccyokfCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccytgLCBcImdcIik7XG4vLyAgIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuLy8gICBsZXQgbGFzdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbi8vICAgd2hpbGUgKChtID0gcmUuZXhlYyhsZWZ0KSkgIT09IG51bGwpIHtcbi8vICAgICBsYXN0ID0gbVswXS50cmltKCk7XG4vLyAgIH1cbi8vICAgaWYgKCFsYXN0KSByZXR1cm4gbnVsbDtcblxuLy8gICAvLyBzdHJpcCB0cmFpbGluZyBwdW5jdHVhdGlvbi9kb3QgYW5kIG5vcm1hbGl6ZVxuLy8gICByZXR1cm4gbm9ybWFsaXplQm9va1Rva2VuKGxhc3QucmVwbGFjZSgvXFxzKyQvLCBcIlwiKSwgY3R4KTtcbi8vIH1cblxuLy8gLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBDb3JlIGxpbmtlciAoUHl0aG9uIDE6MSArIHByb3RlY3Rpb25zKSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cbi8vIGZ1bmN0aW9uIHJlcGxhY2VWZXJzZVJlZmVyZW5jZXNPZk1haW5UZXh0KFxuLy8gICB0ZXh0OiBzdHJpbmcsXG4vLyAgIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4sXG4vLyAgIG9wdHM6IHsgcmVtb3ZlT2JzaWRpYW5MaW5rczogYm9vbGVhbjsgcmV3cml0ZU9sZExpbmtzOiBib29sZWFuLCBzdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlOiBib29sZWFuIH1cbi8vICk6IHN0cmluZyB7XG4vLyAgIC8vIE9yZGVyIG1hdGNoZXMgUHl0aG9uOiBzdHJpcCBNRCBsaW5rcyBcdTIxOTIgKG9wdGlvbmFsKSBzdHJpcCBbWy4uLnwuLi5dXSBcdTIxOTIgcmV3cml0ZSBvbGQgbGlua3Ncbi8vICAgaWYgKG9wdHMuc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSkgdGV4dCA9IHJlbW92ZU1hdGNoaW5nTWFya2Rvd25MaW5rcyh0ZXh0LCBjdHguUEFUVEVSTl9IRUFEKTtcbi8vICAgaWYgKG9wdHMucmVtb3ZlT2JzaWRpYW5MaW5rcykgdGV4dCA9IHJlbW92ZU1hdGNoaW5nT2JzaWRpYW5MaW5rcyh0ZXh0LCBjdHguUEFUVEVSTl9IRUFEKTtcbi8vICAgaWYgKG9wdHMucmV3cml0ZU9sZExpbmtzKSB0ZXh0ID0gcmVwbGFjZU9sZE9ic2lkaWFuTGlua3ModGV4dCk7XG5cbi8vICAgY29uc3QgcHJvdGVjdGVkUmFuZ2VzID0gZmluZFByb3RlY3RlZFJhbmdlcyh0ZXh0KTtcblxuLy8gICBsZXQgY3VycmVudF9ib29rOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbi8vICAgbGV0IGN1cnJlbnRfY2hhcHRlcjogbnVtYmVyIHwgc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4vLyAgIGxldCBjdXJyZW50X3ZlcnNlOiBudW1iZXIgfCBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuLy8gICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4vLyAgIGxldCBsYXN0UG9zID0gMDtcblxuLy8gICBjdHguUEFUVEVSTl9HLmxhc3RJbmRleCA9IDA7XG4vLyAgIGZvciAobGV0IG06IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGwgPSBjdHguUEFUVEVSTl9HLmV4ZWModGV4dCk7IG07IG0gPSBjdHguUEFUVEVSTl9HLmV4ZWModGV4dCkpIHtcbi8vICAgICBjb25zdCBzdGFydCA9IG0uaW5kZXg7XG4vLyAgICAgY29uc3QgZW5kID0gc3RhcnQgKyBtWzBdLmxlbmd0aDtcblxuLy8gICAgIGlmIChpblByb3RlY3RlZChzdGFydCwgcHJvdGVjdGVkUmFuZ2VzKSB8fCBpblByb3RlY3RlZChlbmQgLSAxLCBwcm90ZWN0ZWRSYW5nZXMpIHx8XG4vLyAgICAgICAgIGlzV2l0aGluT2JzaWRpYW5MaW5rKHRleHQsIHN0YXJ0LCBlbmQpIHx8IGlzSW5zaWRlTnVtZXJpY1BhcmVucyh0ZXh0LCBzdGFydCwgZW5kKSkge1xuLy8gICAgICAgb3V0LnB1c2godGV4dC5zbGljZShsYXN0UG9zLCBzdGFydCksIG1bMF0pO1xuLy8gICAgICAgbGFzdFBvcyA9IGVuZDtcbi8vICAgICAgIGNvbnRpbnVlO1xuLy8gICAgIH1cblxuLy8gICAgIG91dC5wdXNoKHRleHQuc2xpY2UobGFzdFBvcywgc3RhcnQpKTtcbi8vICAgICBsYXN0UG9zID0gZW5kO1xuXG4vLyAgICAgY29uc3QgZyA9IG0uZ3JvdXBzID8/IHt9O1xuXG4vLyAgICAgLy8gLS0tLSBib29rIG9ubHlcbi8vICAgICBpZiAoZy5ib29rKSB7XG4vLyAgICAgICBjdXJyZW50X2Jvb2sgPSBub3JtYWxpemVCb29rVG9rZW4oZy5ib29rLCBjdHgpOyAvLyA8LS0gc3RyaXBzIHRyYWlsaW5nIGRvdFxuLy8gICAgICAgY3VycmVudF9jaGFwdGVyID0gbnVsbDtcbi8vICAgICAgIGN1cnJlbnRfdmVyc2UgPSBudWxsO1xuLy8gICAgICAgb3V0LnB1c2gobVswXSk7XG4vLyAgICAgICBjb250aW51ZTtcbi8vICAgICB9XG5cbi8vICAgICAvLyAtLS0tIGNoYXB0ZXIgKGNoLiwgY2hhcHRlciwgY2hhcHRlcnMpXG4vLyAgICAgaWYgKGcuY2hhcHRlcikge1xuLy8gICAgICAgY29uc3QgY2htID0gZy5jaGFwdGVyLm1hdGNoKC8oXFxkKykvKTtcbi8vICAgICAgIGlmIChjaG0gJiYgY3VycmVudF9ib29rKSB7XG4vLyAgICAgICAgIGNvbnN0IGNoID0gY2htWzFdO1xuLy8gICAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBjaDtcbi8vICAgICAgICAgY3VycmVudF92ZXJzZSA9IG51bGw7XG4vLyAgICAgICAgIG91dC5wdXNoKGBbWyR7Y3VycmVudF9ib29rfSNeJHtjaH18JHttWzBdfV1dYCk7XG4vLyAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICBvdXQucHVzaChtWzBdKTtcbi8vICAgICAgIH1cbi8vICAgICAgIGNvbnRpbnVlO1xuLy8gICAgIH1cblxuLy8gICAgIC8vIC0tLS0gdmVyc2UgKHYuLCB2di4sIHZlcnNlcylcbi8vICAgICBpZiAoZy52ZXJzZSkge1xuLy8gICAgICAgaWYgKCFjdXJyZW50X2Jvb2spIHtcbi8vICAgICAgICAgY29uc3QgaW5mZXJyZWQgPSBmaW5kTGFzdEJvb2tCZWZvcmUodGV4dCwgc3RhcnQsIGN0eCk7XG4vLyAgICAgICAgIGlmIChpbmZlcnJlZCkge1xuLy8gICAgICAgICAgIGN1cnJlbnRfYm9vayA9IGluZmVycmVkO1xuLy8gICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgIG91dC5wdXNoKG1bMF0pO1xuLy8gICAgICAgICAgIGNvbnRpbnVlO1xuLy8gICAgICAgICB9XG4vLyAgICAgICB9XG4vLyAgICAgICBjb25zdCB2ZXJzZVRleHQgPSBtWzBdO1xuLy8gICAgICAgY29uc3QgcGFydHMgPSB2ZXJzZVRleHQuc3BsaXQoLyhcXHMrKS8pO1xuLy8gICAgICAgY29uc3QgY2ggPSBjdXJyZW50X2NoYXB0ZXIgPyBTdHJpbmcoY3VycmVudF9jaGFwdGVyKSA6IFwiMVwiO1xuLy8gICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIHBhcnRzKSB7XG4vLyAgICAgICAgIGNvbnN0IHZtID0gcGFydC5tYXRjaCgvKFxcZCspLyk7XG4vLyAgICAgICAgIGlmICh2bSAmJiBwYXJ0LnRyaW0oKSkge1xuLy8gICAgICAgICAgIG91dC5wdXNoKGBbWyR7Y3VycmVudF9ib29rfSNeJHtjaH0tJHt2bVsxXX18JHtwYXJ0LnRyaW0oKX1dXWApO1xuLy8gICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgIG91dC5wdXNoKHBhcnQpO1xuLy8gICAgICAgICB9XG4vLyAgICAgICB9XG4vLyAgICAgICBjb250aW51ZTtcbi8vICAgICB9XG5cbi8vICAgICAvLyAtLS0tIG5vdGUocylcbi8vICAgICBpZiAoZy5ub3RlKSB7XG4vLyAgICAgICBjb25zdCBub3RlVGV4dCA9IGcubm90ZSBhcyBzdHJpbmc7XG4vLyAgICAgICBjb25zdCBwYXJ0cyA9IG5vdGVUZXh0LnNwbGl0KC9cXHMrLyk7XG4vLyAgICAgICBsZXQgYm9va1N1YnN0cmluZyA9IGZhbHNlO1xuLy8gICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgICBjb25zdCBwYXJ0ID0gcGFydHNbaV07XG4vLyAgICAgICAgIGNvbnN0IHBtID0gcGFydC5tYXRjaCgvXihcXGQrKS8pO1xuLy8gICAgICAgICBpZiAocG0gJiYgIWJvb2tTdWJzdHJpbmcpIHtcbi8vICAgICAgICAgICBjb25zdCB2ZXJzZSA9IHBtWzFdO1xuLy8gICAgICAgICAgIGlmICgoaSArIDEgPCBwYXJ0cy5sZW5ndGggJiYgIS9eXFxkKy8udGVzdChwYXJ0c1tpICsgMV0pKSB8fCBpICsgMSA+PSBwYXJ0cy5sZW5ndGgpIHtcbi8vICAgICAgICAgICAgIG91dC5wdXNoKFwiIFwiICsgcGFydCk7XG4vLyAgICAgICAgICAgICBjb250aW51ZTtcbi8vICAgICAgICAgICB9XG4vLyAgICAgICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDwgcGFydHMubGVuZ3RoOyBqKyspIHtcbi8vICAgICAgICAgICAgIGlmIChwYXJ0c1tqXSA9PT0gXCJpblwiICYmIGogKyAxIDwgcGFydHMubGVuZ3RoKSB7XG4vLyAgICAgICAgICAgICAgIGlmICgvXlxcZCskLy50ZXN0KHBhcnRzW2ogKyAxXSkgJiYgaiArIDIgPCBwYXJ0cy5sZW5ndGgpIHtcbi8vICAgICAgICAgICAgICAgICBjb25zdCBib29rID0gcGFydHNbaiArIDFdICsgXCIgXCIgKyBwYXJ0c1tqICsgMl07XG4vLyAgICAgICAgICAgICAgICAgY3VycmVudF9jaGFwdGVyID0gcGFydHNbaiArIDNdO1xuLy8gICAgICAgICAgICAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihib29rLCBjdHgpOyAvLyA8LS0gbm9ybWFsaXplXG4vLyAgICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgICAgY29uc3QgYm9vayA9IHBhcnRzW2ogKyAxXTtcbi8vICAgICAgICAgICAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBwYXJ0c1tqICsgMl07XG4vLyAgICAgICAgICAgICAgICAgY3VycmVudF9ib29rID0gbm9ybWFsaXplQm9va1Rva2VuKGJvb2ssIGN0eCk7IC8vIDwtLSBub3JtYWxpemVcbi8vICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICAgIH1cbi8vICAgICAgICAgICBpZiAoY3VycmVudF9ib29rICYmIGN1cnJlbnRfY2hhcHRlcikge1xuLy8gICAgICAgICAgICAgb3V0LnB1c2goYCBbWyR7Y3VycmVudF9ib29rfSAke2N1cnJlbnRfY2hhcHRlcn0jXiR7dmVyc2V9fCR7cGFydH1dXWApO1xuLy8gICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICBvdXQucHVzaChcIiBcIiArIHBhcnQpO1xuLy8gICAgICAgICAgIH1cbi8vICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICBvdXQucHVzaCgoaSA+IDAgPyBcIiBcIiA6IFwiXCIpICsgcGFydCk7XG4vLyAgICAgICAgIH1cbi8vICAgICAgIH1cbi8vICAgICAgIGNvbnRpbnVlO1xuLy8gICAgIH1cblxuLy8gICAgIC8vIC0tLS0gZnVsbCByZWZlcmVuY2Vcbi8vICAgICBpZiAoZy5yZWYpIHtcbi8vICAgICAgIGNvbnN0IG1tID0gKGcucmVmIGFzIHN0cmluZykubWF0Y2goLyhcXHMqW1xcLiw7XT8pKC4rKS8pO1xuLy8gICAgICAgY29uc3QgbGVhZGluZyA9IG1tID8gbW1bMV0gOiBcIlwiO1xuLy8gICAgICAgbGV0IHJlZlRleHQgPSBtbSA/IG1tWzJdIDogKGcucmVmIGFzIHN0cmluZyk7XG5cbi8vICAgICAgIGNvbnN0IGJvb2tTdGFydCA9IHJlZlRleHQubWF0Y2gobmV3IFJlZ0V4cChgXigoPzoke2N0eC5CT09LX0FMVH0pXFxcXC4/XFxcXHMrKWApKTtcbi8vICAgICAgIGxldCBwcmVmaXg6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuLy8gICAgICAgaWYgKGJvb2tTdGFydCkge1xuLy8gICAgICAgICBjb25zdCBib29rUGFydCA9IGJvb2tTdGFydFswXTtcbi8vICAgICAgICAgcHJlZml4ID0gYm9va1BhcnQ7IC8vIGZvciBkaXNwbGF5IHRleHQgKGNhbiBrZWVwIGl0cyBkb3QpXG4vLyAgICAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihib29rUGFydC5yZXBsYWNlKC9cXHMrJC8sIFwiXCIpLCBjdHgpOyAvLyA8LS0gbm9ybWFsaXplIGZvciB0YXJnZXRcbi8vICAgICAgICAgcmVmVGV4dCA9IHJlZlRleHQuc2xpY2UoYm9va1BhcnQubGVuZ3RoKTtcbi8vICAgICAgIH1cbi8vICAgICAgIGlmICghY3VycmVudF9ib29rKSB7XG4vLyAgICAgICAgIC8vIEZhbGxiYWNrOiBpbmZlciBib29rIGZyb20gbGVmdCBjb250ZXh0IChlLmcuLCBcIlx1MjAyNiBKb2huIDE6Mjk7IDEyOjI0OyBcdTIwMjZcIilcbi8vICAgICAgICAgY29uc3QgaW5mZXJyZWQgPSBmaW5kTGFzdEJvb2tCZWZvcmUodGV4dCwgc3RhcnQsIGN0eCk7XG4vLyAgICAgICAgIGlmIChpbmZlcnJlZCkge1xuLy8gICAgICAgICAgIGN1cnJlbnRfYm9vayA9IGluZmVycmVkO1xuLy8gICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgIG91dC5wdXNoKG1bMF0pO1xuLy8gICAgICAgICAgIGNvbnRpbnVlO1xuLy8gICAgICAgICB9XG4vLyAgICAgICB9XG5cbi8vICAgICAgIGNvbnN0IHBhcnRzID0gcmVmVGV4dC5yZXBsYWNlKC9cXC4vZywgXCJcIikudHJpbSgpLnNwbGl0KC8oO3wsKS8pO1xuLy8gICAgICAgY29uc3QgcmVzdWx0OiBzdHJpbmdbXSA9IFtdO1xuLy8gICAgICAgbGV0IHZlcnNlU3RyaW5nID0gZmFsc2U7XG4vLyAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBudWxsO1xuLy8gICAgICAgbGV0IGxvY2FsX2N1cnJlbnRfdmVyc2U6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4vLyAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgICAgIGNvbnN0IHBhcnQgPSBwYXJ0c1tpXTtcbi8vICAgICAgICAgaWYgKHBhcnQgPT09IFwiLFwiIHx8IHBhcnQgPT09IFwiO1wiKSB7XG4vLyAgICAgICAgICAgcmVzdWx0LnB1c2gocGFydCArIFwiIFwiKTtcbi8vICAgICAgICAgICB2ZXJzZVN0cmluZyA9IChwYXJ0ID09PSBcIixcIik7XG4vLyAgICAgICAgICAgY29udGludWU7XG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgbGV0IHAgPSBwYXJ0LnRyaW0oKTtcbi8vICAgICAgICAgaWYgKCFwKSBjb250aW51ZTtcblxuLy8gICAgICAgICBsZXQgY2hhcDogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCA9IGN1cnJlbnRfY2hhcHRlcjtcbi8vICAgICAgICAgbGV0IHY6IHN0cmluZyB8IG51bWJlciB8IG51bGwgPSBudWxsO1xuLy8gICAgICAgICBsZXQgdkVuZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbi8vICAgICAgICAgaWYgKHAuaW5jbHVkZXMoXCI6XCIpKSB7XG4vLyAgICAgICAgICAgY29uc3QgW2NTdHIsIHZTdHJdID0gcC5zcGxpdChcIjpcIik7XG4vLyAgICAgICAgICAgY2hhcCA9IGNTdHI7XG4vLyAgICAgICAgICAgdiA9IHZTdHI7XG4vLyAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgaWYgKHZlcnNlU3RyaW5nKSB2ID0gcDtcbi8vICAgICAgICAgICBlbHNlIHsgY2hhcCA9IHA7IHYgPSBudWxsOyB9XG4vLyAgICAgICAgIH1cblxuLy8gICAgICAgICBpZiAodHlwZW9mIGNoYXAgIT09IFwibnVtYmVyXCIpIHtcbi8vICAgICAgICAgICBjb25zdCBjaHMgPSBTdHJpbmcoY2hhcCA/PyBcIlwiKS5zcGxpdChcIi1cIik7XG4vLyAgICAgICAgICAgY2hhcCA9IHBhcnNlSW50KGNoc1swXS5yZXBsYWNlKC9bYS16XSQvaSwgXCJcIiksIDEwKTtcbi8vICAgICAgICAgfVxuXG4vLyAgICAgICAgIGlmICh2KSB7XG4vLyAgICAgICAgICAgY29uc3QgdnMgPSBTdHJpbmcodikuc3BsaXQoXCItXCIpO1xuLy8gICAgICAgICAgIGxvY2FsX2N1cnJlbnRfdmVyc2UgPSBwYXJzZUludCh2c1swXS5yZXBsYWNlKC9bYS16XSQvaSwgXCJcIiksIDEwKTtcbi8vICAgICAgICAgICB2RW5kID0gdnMubGVuZ3RoID4gMSA/IHBhcnNlSW50KHZzWzFdLnJlcGxhY2UoL1thLXpdJC9pLCBcIlwiKSwgMTApIDogbnVsbDtcbi8vICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICBsb2NhbF9jdXJyZW50X3ZlcnNlID0gbnVsbDtcbi8vICAgICAgICAgICB2RW5kID0gbnVsbDtcbi8vICAgICAgICAgfVxuXG4vLyAgICAgICAgIGlmICh2RW5kKSB7XG4vLyAgICAgICAgICAgY29uc3QgZGlzcGxheVN0YXJ0ID0gcC5yZXBsYWNlKC9cXGQrW2Etel0/JC9pLCBcIlwiKTtcbi8vICAgICAgICAgICByZXN1bHQucHVzaChgW1ske2N1cnJlbnRfYm9va30jXiR7Y2hhcH0tJHtsb2NhbF9jdXJyZW50X3ZlcnNlfXwke3ByZWZpeCA/IHByZWZpeCA6IFwiXCJ9JHtkaXNwbGF5U3RhcnR9XV1gKTtcbi8vICAgICAgICAgICByZXN1bHQucHVzaChgW1ske2N1cnJlbnRfYm9va30jXiR7Y2hhcH0tJHt2RW5kfXwke1N0cmluZyhwKS5tYXRjaCgvKFxcZCtbYS16XT8pJC9pKT8uWzFdID8/IFwiXCJ9XV1gKTtcbi8vICAgICAgICAgICBsb2NhbF9jdXJyZW50X3ZlcnNlID0gdkVuZDtcbi8vICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICByZXN1bHQucHVzaChgW1ske2N1cnJlbnRfYm9va30jXiR7Y2hhcH0ke2xvY2FsX2N1cnJlbnRfdmVyc2UgPyBgLSR7bG9jYWxfY3VycmVudF92ZXJzZX1gIDogXCJcIn18JHtwcmVmaXggPyBwcmVmaXggOiBcIlwifSR7cH1dXWApO1xuLy8gICAgICAgICB9XG4vLyAgICAgICAgIHByZWZpeCA9IG51bGw7XG4vLyAgICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IGNoYXA7XG4vLyAgICAgICAgIGN1cnJlbnRfdmVyc2UgPSBsb2NhbF9jdXJyZW50X3ZlcnNlO1xuLy8gICAgICAgfVxuXG4vLyAgICAgICBvdXQucHVzaChsZWFkaW5nICsgcmVzdWx0LmpvaW4oXCJcIikpO1xuLy8gICAgICAgY29udGludWU7XG4vLyAgICAgfVxuXG4vLyAgICAgb3V0LnB1c2gobVswXSk7XG4vLyAgIH1cblxuLy8gICBvdXQucHVzaCh0ZXh0LnNsaWNlKGxhc3RQb3MpKTtcbi8vICAgcmV0dXJuIG91dC5qb2luKFwiXCIpO1xuLy8gfVxuXG5cbi8vIC8qKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUHVibGljIEFQSSB1c2VkIGJ5IGNvbW1hbmQgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG4vLyBleHBvcnQgYXN5bmMgZnVuY3Rpb24gbGlua1ZlcnNlc0luVGV4dCh0ZXh0OiBzdHJpbmcsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MpOiBQcm9taXNlPHN0cmluZz4ge1xuLy8gICBjb25zdCBjdHggPSBidWlsZEJvb2tDb250ZXh0KHNldHRpbmdzKTtcblxuLy8gICAvLyBTZXR0aW5ncyB0b2dnbGVzIChvcHRpb25hbDsgZGVmYXVsdCB0byBQeXRob24gYmVoYXZpb3IpXG4vLyAgIGNvbnN0IHJlbW92ZU9ic2lkaWFuRGlzcGxheUxpbmtzID1cbi8vICAgICAoc2V0dGluZ3MgYXMgYW55KT8ucmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MgPz8gdHJ1ZTtcbi8vICAgY29uc3QgcmV3cml0ZU9sZE9ic2lkaWFuTGlua3MgPVxuLy8gICAgIChzZXR0aW5ncyBhcyBhbnkpPy5yZXdyaXRlT2xkT2JzaWRpYW5MaW5rcyA/PyB0cnVlO1xuLy8gICBjb25zdCBzdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlID1cbi8vICAgICAoc2V0dGluZ3MgYXMgYW55KT8uc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSA/PyB0cnVlO1xuXG4vLyAgIHJldHVybiByZXBsYWNlVmVyc2VSZWZlcmVuY2VzT2ZNYWluVGV4dCh0ZXh0LCBjdHgsIHtcbi8vICAgICByZW1vdmVPYnNpZGlhbkxpbmtzOiByZW1vdmVPYnNpZGlhbkRpc3BsYXlMaW5rcyxcbi8vICAgICByZXdyaXRlT2xkTGlua3M6IHJld3JpdGVPbGRPYnNpZGlhbkxpbmtzLFxuLy8gICAgIHN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2U6IHN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2Vcbi8vICAgfSk7XG4vLyB9XG5cbi8vIGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kVmVyc2VMaW5rcyhhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncywgcGFyYW1zPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPikge1xuLy8gICBjb25zdCBzY29wZSA9IHBhcmFtcz8uc2NvcGUgPz8gXCJjdXJyZW50XCI7XG5cbi8vICAgaWYgKHNjb3BlID09PSBcImZvbGRlclwiKSB7XG4vLyAgICAgY29uc3QgYWN0aXZlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4vLyAgICAgY29uc3QgZm9sZGVyID0gYWN0aXZlPy5wYXJlbnQ7XG4vLyAgICAgaWYgKCFhY3RpdmUgfHwgIWZvbGRlcikgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgaW5zaWRlIHRoZSB0YXJnZXQgZm9sZGVyLlwiKTsgcmV0dXJuOyB9XG5cbi8vICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZvbGRlci5jaGlsZHJlbikge1xuLy8gICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUgJiYgY2hpbGQuZXh0ZW5zaW9uID09PSBcIm1kXCIpIHtcbi8vICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGNoaWxkKTtcbi8vICAgICAgICAgY29uc3QgeyB5YW1sLCBib2R5IH0gPSBzcGxpdEZyb250bWF0dGVyKGNvbnRlbnQpO1xuLy8gICAgICAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KGJvZHksIHNldHRpbmdzKTtcbi8vICAgICAgICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShjaGlsZCwgKHlhbWwgPz8gXCJcIikgKyBsaW5rZWQpO1xuLy8gICAgICAgfVxuLy8gICAgIH1cbi8vICAgICBuZXcgTm90aWNlKFwiTGlua2VkIHZlcnNlcyBpbiBmb2xkZXIuXCIpO1xuLy8gICAgIHJldHVybjtcbi8vICAgfVxuXG4vLyAgIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbi8vICAgaWYgKCFmaWxlKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7IHJldHVybjsgfVxuXG4vLyAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcbi8vICAgY29uc3QgeyB5YW1sLCBib2R5IH0gPSBzcGxpdEZyb250bWF0dGVyKGNvbnRlbnQpO1xuLy8gICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KGJvZHksIHNldHRpbmdzKTtcbi8vICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCAoeWFtbCA/PyBcIlwiKSArIGxpbmtlZCk7XG4vLyAgIG5ldyBOb3RpY2UoXCJMaW5rZWQgdmVyc2VzIGluIGN1cnJlbnQgZmlsZS5cIik7XG4vLyB9XG5cbi8vIGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kVmVyc2VMaW5rc1NlbGVjdGlvbk9yTGluZShhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuLy8gICBjb25zdCBtZFZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbi8vICAgaWYgKCFtZFZpZXcpIHsgbmV3IE5vdGljZShcIk9wZW4gYSBNYXJrZG93biBmaWxlIGZpcnN0LlwiKTsgcmV0dXJuOyB9XG5cbi8vICAgY29uc3QgZWRpdG9yID0gbWRWaWV3LmVkaXRvcjtcblxuLy8gICAvLyBJZiB1c2VyIHNlbGVjdGVkIHRleHQsIHByb2Nlc3MgdGhhdDsgb3RoZXJ3aXNlIHByb2Nlc3MgdGhlIGN1cnJlbnQgbGluZVxuLy8gICBjb25zdCBzZWxlY3Rpb25UZXh0ID0gZWRpdG9yLmdldFNlbGVjdGlvbigpO1xuLy8gICBpZiAoc2VsZWN0aW9uVGV4dCAmJiBzZWxlY3Rpb25UZXh0Lmxlbmd0aCA+IDApIHtcbi8vICAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KHNlbGVjdGlvblRleHQsIHNldHRpbmdzKTtcbi8vICAgICBpZiAobGlua2VkICE9PSBzZWxlY3Rpb25UZXh0KSB7XG4vLyAgICAgICBlZGl0b3IucmVwbGFjZVNlbGVjdGlvbihsaW5rZWQpO1xuLy8gICAgICAgbmV3IE5vdGljZShcIkxpbmtlZCB2ZXJzZXMgaW4gc2VsZWN0aW9uLlwiKTtcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgbmV3IE5vdGljZShcIk5vIGxpbmthYmxlIHZlcnNlcyBpbiBzZWxlY3Rpb24uXCIpO1xuLy8gICAgIH1cbi8vICAgICByZXR1cm47XG4vLyAgIH1cblxuLy8gICAvLyBObyBzZWxlY3Rpb24gXHUyMTkyIHByb2Nlc3MgY3VycmVudCBsaW5lXG4vLyAgIGNvbnN0IGxpbmUgPSBlZGl0b3IuZ2V0Q3Vyc29yKCkubGluZTtcbi8vICAgY29uc3QgbGluZVRleHQgPSBlZGl0b3IuZ2V0TGluZShsaW5lKTtcbi8vICAgY29uc3QgbGlua2VkID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChsaW5lVGV4dCwgc2V0dGluZ3MpO1xuLy8gICBpZiAobGlua2VkICE9PSBsaW5lVGV4dCkge1xuLy8gICAgIGVkaXRvci5zZXRMaW5lKGxpbmUsIGxpbmtlZCk7XG4vLyAgICAgbmV3IE5vdGljZShcIkxpbmtlZCB2ZXJzZXMgb24gY3VycmVudCBsaW5lLlwiKTtcbi8vICAgfSBlbHNlIHtcbi8vICAgICBuZXcgTm90aWNlKFwiTm8gbGlua2FibGUgdmVyc2VzIG9uIGN1cnJlbnQgbGluZS5cIik7XG4vLyAgIH1cbi8vIH0iLCAiaW1wb3J0IHsgQXBwLCBURmlsZSwgVEZvbGRlciwgbm9ybWFsaXplUGF0aCB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRGcm9udG1hdHRlcih0ZXh0OiBzdHJpbmcpOiB7IHlhbWw/OiBzdHJpbmc7IGJvZHk6IHN0cmluZyB9IHtcbiAgaWYgKHRleHQuc3RhcnRzV2l0aChcIi0tLVwiKSkge1xuICAgIGNvbnN0IGVuZCA9IHRleHQuaW5kZXhPZihcIlxcbi0tLVwiLCAzKTtcbiAgICBpZiAoZW5kICE9PSAtMSkge1xuICAgICAgY29uc3QgeWFtbCA9IHRleHQuc2xpY2UoMCwgZW5kICsgNCk7XG4gICAgICBjb25zdCBib2R5ID0gdGV4dC5zbGljZShlbmQgKyA0KTtcbiAgICAgIHJldHVybiB7IHlhbWwsIGJvZHkgfTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHsgYm9keTogdGV4dCB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0QWZ0ZXJZYW1sT3JIMShzcmM6IHN0cmluZywgYmxvY2s6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHsgeWFtbCwgYm9keSB9ID0gc3BsaXRGcm9udG1hdHRlcihzcmMpO1xuICBpZiAoeWFtbCkgcmV0dXJuIHlhbWwgKyBcIlxcblwiICsgYmxvY2sgKyBib2R5O1xuICBjb25zdCBmaXJzdEgxID0gYm9keS5pbmRleE9mKFwiXFxuIyBcIik7XG4gIGlmIChmaXJzdEgxICE9PSAtMSkge1xuICAgIGNvbnN0IHBvcyA9IGZpcnN0SDEgKyAxO1xuICAgIHJldHVybiBib2R5LnNsaWNlKDAsIHBvcykgKyBibG9jayArIGJvZHkuc2xpY2UocG9zKTtcbiAgfVxuICByZXR1cm4gYm9keSArIChib2R5LmVuZHNXaXRoKFwiXFxuXCIpID8gXCJcIiA6IFwiXFxuXCIpICsgYmxvY2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0xlYWZGb2xkZXIoZm9sZGVyOiBURm9sZGVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBmb2xkZXIuY2hpbGRyZW4uZmluZChjID0+IGMgaW5zdGFuY2VvZiBURm9sZGVyKSA9PT0gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGVhZkZvbGRlcnNVbmRlcihhcHA6IEFwcCwgYmFzZUZvbGRlclBhdGg6IHN0cmluZyk6IFRGb2xkZXJbXSB7XG4gIGNvbnN0IGJhc2UgPSBhcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKG5vcm1hbGl6ZVBhdGgoYmFzZUZvbGRlclBhdGgpKTtcbiAgaWYgKCFiYXNlKSByZXR1cm4gW107XG4gIGNvbnN0IHJlczogVEZvbGRlcltdID0gW107XG4gIGNvbnN0IHdhbGsgPSAoZjogVEZvbGRlcikgPT4ge1xuICAgIGlmIChpc0xlYWZGb2xkZXIoZikpIHJlcy5wdXNoKGYpO1xuICAgIGVsc2UgZm9yIChjb25zdCBjIG9mIGYuY2hpbGRyZW4pIGlmIChjIGluc3RhbmNlb2YgVEZvbGRlcikgd2FsayhjKTtcbiAgfTtcbiAgd2FsayhiYXNlKTtcbiAgcmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpc3RNYXJrZG93bkZpbGVzKGZvbGRlcjogVEZvbGRlcik6IFRGaWxlW10ge1xuICByZXR1cm4gZm9sZGVyLmNoaWxkcmVuLmZpbHRlcigoYyk6IGMgaXMgVEZpbGUgPT4gYyBpbnN0YW5jZW9mIFRGaWxlICYmIGMuZXh0ZW5zaW9uID09PSBcIm1kXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlyc3ROb25FbXB0eUxpbmVJbmRleChsaW5lczogc3RyaW5nW10pOiBudW1iZXIge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSBpZiAobGluZXNbaV0udHJpbSgpLmxlbmd0aCkgcmV0dXJuIGk7XG4gIHJldHVybiAtMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwc2VydFRvcExpbmtzQmxvY2soc3JjOiBzdHJpbmcsIGxpbmtzTGluZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgeyB5YW1sLCBib2R5IH0gPSBzcGxpdEZyb250bWF0dGVyKHNyYyk7XG5cbiAgZnVuY3Rpb24gcmVwbGFjZVdpdGhpbihjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IE1hdGgubWluKDEwLCBsaW5lcy5sZW5ndGgpOyBpKyspIHtcbiAgICAgIGlmICgvXFx8UHJldmlvdXNcXF1cXF18XFx8TmV4dFxcXVxcXS8udGVzdChsaW5lc1tpXSkpIHtcbiAgICAgICAgbGluZXNbaV0gPSBsaW5rc0xpbmU7XG4gICAgICAgIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xuICAgICAgfVxuICAgIH1cbiAgICBsaW5lcy5zcGxpY2UoMCwgMCwgXCJcIiwgbGlua3NMaW5lLCBcIlwiKTtcbiAgICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGlmICh5YW1sKSByZXR1cm4geWFtbCArIHJlcGxhY2VXaXRoaW4oYm9keSk7XG4gIHJldHVybiByZXBsYWNlV2l0aGluKHNyYyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cHNlcnRCb3R0b21MaW5rcyhzcmM6IHN0cmluZywgbGlua3NMaW5lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IHNyYy5zcGxpdChcIlxcblwiKTtcbiAgZm9yIChsZXQgaSA9IE1hdGgubWF4KDAsIGxpbmVzLmxlbmd0aCAtIDUpOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoL1xcfFByZXZpb3VzXFxdXFxdfFxcfE5leHRcXF1cXF0vLnRlc3QobGluZXNbaV0pKSB7XG4gICAgICBsaW5lc1tpXSA9IGxpbmtzTGluZTtcbiAgICAgIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xuICAgIH1cbiAgfVxuICBsaW5lcy5wdXNoKFwiXCIsIGxpbmtzTGluZSk7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xufVxuIiwgImltcG9ydCB7IEFwcCwgVEZpbGUsIFRGb2xkZXIsIE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBsaXN0TWFya2Rvd25GaWxlcywgdXBzZXJ0Qm90dG9tTGlua3MsIHVwc2VydFRvcExpbmtzQmxvY2sgfSBmcm9tIFwiLi4vbGliL21kVXRpbHNcIjtcblxuZnVuY3Rpb24gdG9rZW5Gcm9tRmlsZW5hbWUobmFtZTogc3RyaW5nKTogbnVtYmVyIHwgbnVsbCB7XG4gIGNvbnN0IG0gPSBuYW1lLm1hdGNoKC9eKFxcZCspLyk7XG4gIGlmICghbSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBwYXJzZUludChtWzFdLCAxMCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kQWRkTmV4dFByZXZpb3VzKGFwcDogQXBwLCBfc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncywgX3BhcmFtcz86IFJlY29yZDxzdHJpbmcsc3RyaW5nPikge1xuICBjb25zdCBmaWxlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gIGlmICghZmlsZSkgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgZmlyc3QuXCIpOyByZXR1cm47IH1cbiAgY29uc3QgcGFyZW50ID0gZmlsZS5wYXJlbnQ7XG4gIGlmICghKHBhcmVudCBpbnN0YW5jZW9mIFRGb2xkZXIpKSB7IG5ldyBOb3RpY2UoXCJDdXJyZW50IGZpbGUgaGFzIG5vIGZvbGRlci5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IG1kRmlsZXMgPSBsaXN0TWFya2Rvd25GaWxlcyhwYXJlbnQpXG4gICAgLm1hcChmID0+ICh7IGYsIG46IHRva2VuRnJvbUZpbGVuYW1lKGYubmFtZSkgfSkpXG4gICAgLmZpbHRlcih4ID0+IHgubiAhPT0gbnVsbClcbiAgICAuc29ydCgoYSwgYikgPT4gKGEubiEgLSBiLm4hKSlcbiAgICAubWFwKHggPT4geC5mKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1kRmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjdXIgPSBtZEZpbGVzW2ldO1xuICAgIGNvbnN0IHByZXYgPSBtZEZpbGVzW2kgLSAxXTtcbiAgICBjb25zdCBuZXh0ID0gbWRGaWxlc1tpICsgMV07XG5cbiAgICBjb25zdCBwcmV2TmFtZSA9IHByZXYgPyBwcmV2LmJhc2VuYW1lIDogbnVsbDtcbiAgICBjb25zdCBuZXh0TmFtZSA9IG5leHQgPyBuZXh0LmJhc2VuYW1lIDogbnVsbDtcblxuICAgIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmIChwcmV2TmFtZSkgcGFydHMucHVzaChgW1ske3ByZXZOYW1lfXxQcmV2aW91c11dYCk7XG4gICAgaWYgKG5leHROYW1lKSBwYXJ0cy5wdXNoKGBbWyR7bmV4dE5hbWV9fE5leHRdXWApO1xuICAgIGNvbnN0IGxpbmtzTGluZSA9IHBhcnRzLmpvaW4oXCIgfCBcIik7XG5cbiAgICBpZiAoIWxpbmtzTGluZSkgY29udGludWU7XG5cbiAgICBjb25zdCBzcmMgPSBhd2FpdCBhcHAudmF1bHQucmVhZChjdXIpO1xuICAgIGNvbnN0IHdpdGhUb3AgPSB1cHNlcnRUb3BMaW5rc0Jsb2NrKHNyYywgbGlua3NMaW5lKTtcbiAgICBjb25zdCB3aXRoQm90aCA9IHVwc2VydEJvdHRvbUxpbmtzKHdpdGhUb3AsIGxpbmtzTGluZSk7XG4gICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShjdXIsIHdpdGhCb3RoKTtcbiAgfVxuXG4gIG5ldyBOb3RpY2UoXCJJbnNlcnRlZCBOZXh0L1ByZXZpb3VzIGxpbmtzLlwiKTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIFRGaWxlLCBURm9sZGVyLCBOb3RpY2UsIG5vcm1hbGl6ZVBhdGggfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgYXJ0aWNsZVN0eWxlLCBub3dTdGFtcCB9IGZyb20gXCIuLi9saWIvdGV4dFV0aWxzXCI7XG5pbXBvcnQgeyBnZXRMZWFmRm9sZGVyc1VuZGVyLCBsaXN0TWFya2Rvd25GaWxlcyB9IGZyb20gXCIuLi9saWIvbWRVdGlsc1wiO1xuXG5jb25zdCBzdHJpcFdpa2lsaW5rcyA9IChzOiBzdHJpbmcpID0+IHMucmVwbGFjZSgvXlxcW1xcW3xcXF1cXF0kL2csIFwiXCIpO1xuXG5mdW5jdGlvbiBmcm9udG1hdHRlckF1dGhvckZyb21GaWxlKGFwcDogQXBwLCBmOiBURmlsZSk6IHsgYXV0aG9yPzogc3RyaW5nIHwgc3RyaW5nW10sIGJvb2tfdHlwZT86IHN0cmluZyB9IHtcbiAgY29uc3QgY2FjaGUgPSBhcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZik7XG4gIGNvbnN0IGZtOiBhbnkgPSBjYWNoZT8uZnJvbnRtYXR0ZXIgPz8ge307XG4gIGxldCBhdXRob3IgPSBmbS5hdXRob3I7XG4gIGlmICh0eXBlb2YgYXV0aG9yID09PSBcInN0cmluZ1wiKSBhdXRob3IgPSBhdXRob3IucmVwbGFjZSgvXlwiXFxzKi8sIFwiXCIpLnJlcGxhY2UoL1xccypcIiQvLCBcIlwiKTtcbiAgY29uc3QgYm9va190eXBlID0gdHlwZW9mIGZtLmJvb2tfdHlwZSA9PT0gXCJzdHJpbmdcIiA/IGZtLmJvb2tfdHlwZS5yZXBsYWNlKC9eXCJcXHMqLywgXCJcIikucmVwbGFjZSgvXFxzKlwiJC8sIFwiXCIpIDogdW5kZWZpbmVkO1xuICByZXR1cm4geyBhdXRob3IsIGJvb2tfdHlwZSB9O1xufVxuXG5mdW5jdGlvbiBmb3JtYXRBdXRob3JGaWVsZChhdXRob3I6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgaWYgKCFhdXRob3IpIHJldHVybiAnXCJbW1Vua25vd24gQXV0aG9yXV1cIic7XG4gIGlmIChBcnJheS5pc0FycmF5KGF1dGhvcikpIHtcbiAgICByZXR1cm4gXCJcXG4gIC0gXCIgKyBhdXRob3JcbiAgICAgIC5tYXAoYSA9PiBhLnJlcGxhY2UoL15cXFtcXFt8XFxdXFxdJC9nLCBcIlwiKSlcbiAgICAgIC5tYXAoYSA9PiBgW1ske2F9XV1gKVxuICAgICAgLmpvaW4oXCJcXG4gIC0gXCIpO1xuICB9XG4gIGNvbnN0IGNsZWFuID0gYXV0aG9yLnJlcGxhY2UoL15cXFtcXFt8XFxdXFxdJC9nLCBcIlwiKTtcbiAgcmV0dXJuIGAgXCJbWyR7Y2xlYW59XV1cImA7XG59XG5cbi8qKiBDb3JlOiBjcmVhdGUvdXBkYXRlIHRoZSBpbmRleCBmaWxlIGZvciBhIHNpbmdsZSBmb2xkZXIuIFJldHVybnMgdHJ1ZSBpZiBjcmVhdGVkL3VwZGF0ZWQsIGZhbHNlIGlmIHNraXBwZWQuICovXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVPclVwZGF0ZUluZGV4Rm9yRm9sZGVyKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzLCBmb2xkZXI6IFRGb2xkZXIsIGlzQm9vazogYm9vbGVhbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBjb25zdCBmaWxlcyA9IGxpc3RNYXJrZG93bkZpbGVzKGZvbGRlcik7XG4gIGlmICghZmlsZXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gVHJ5IHRvIHBpY2sgYXV0aG9yL2Jvb2tfdHlwZSBmcm9tIHRoZSBmaXJzdCBmaWxlIHRoYXQgaGFzIGl0XG4gIGxldCBhdXRob3I6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBsZXQgYm9va1R5cGU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgZm9yIChjb25zdCBmIG9mIGZpbGVzKSB7XG4gICAgY29uc3QgbWV0YSA9IGZyb250bWF0dGVyQXV0aG9yRnJvbUZpbGUoYXBwLCBmKTtcbiAgICBpZiAobWV0YS5hdXRob3IpIHsgYXV0aG9yID0gbWV0YS5hdXRob3I7IGJvb2tUeXBlID0gbWV0YS5ib29rX3R5cGU7IGJyZWFrOyB9XG4gIH1cblxuICBjb25zdCBmb2xkZXJOYW1lID0gZm9sZGVyLm5hbWU7XG4gIGNvbnN0IGlkeE5hbWUgPSBzZXR0aW5ncy5pbmRleEZpbGVOYW1lTW9kZSA9PT0gXCJhcnRpY2xlLXN0eWxlXCIgPyBhcnRpY2xlU3R5bGUoZm9sZGVyTmFtZSkgOiBmb2xkZXJOYW1lO1xuICBjb25zdCBpbmRleFBhdGggPSBub3JtYWxpemVQYXRoKGZvbGRlci5wYXRoICsgXCIvXCIgKyBpZHhOYW1lICsgXCIubWRcIik7XG4gIGNvbnN0IGNyZWF0ZWQgPSBub3dTdGFtcCgpO1xuXG4gIHZhciBwcm9wczogc3RyaW5nO1xuICBpZiAoaXNCb29rKSB7XG4gICAgcHJvcHMgPSBbXG4gICAgICBgdGl0bGU6ICR7aWR4TmFtZX1gLFxuICAgICAgYGNyZWF0ZWQ6ICR7Y3JlYXRlZH1gLFxuICAgICAgYG1vZGlmaWVkOiAke2NyZWF0ZWR9YCxcbiAgICAgIGBib29rX3RpdGxlOiBcIltbJHtmb2xkZXJOYW1lfV1dXCJgLFxuICAgICAgLi4uKGJvb2tUeXBlID8gW2Bib29rX3R5cGU6IFwiW1ske3N0cmlwV2lraWxpbmtzKGJvb2tUeXBlKX1dXVwiYF0gOiBbXSksXG4gICAgICBgdHlwZTogXCJbW0Jvb2tdXVwiYCxcbiAgICAgIGBhdXRob3I6ICR7Zm9ybWF0QXV0aG9yRmllbGQoYXV0aG9yKX1gXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9IGVsc2Uge1xuICAgIHByb3BzID0gW1xuICAgICAgYHRpdGxlOiAke2lkeE5hbWV9YCxcbiAgICAgIGBjcmVhdGVkOiAke2NyZWF0ZWR9YCxcbiAgICAgIGBtb2RpZmllZDogJHtjcmVhdGVkfWAsXG4gICAgICBgdG9waWNzOiBcIltbJHtzdHJpcFdpa2lsaW5rcyhmb2xkZXJOYW1lKX1dXVwiYFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IGRhdGF2aWV3ID0gW1xuICAgIFwiYGBgZGF0YXZpZXdcIixcbiAgICBcIlRBQkxFXCIsXG4gICAgJ2Zyb20gXCJcIicsXG4gICAgXCJ3aGVyZSBjb250YWlucyhmaWxlLmZvbGRlciwgdGhpcy5maWxlLmZvbGRlcikgYW5kIGZpbGUubmFtZSAhPSB0aGlzLmZpbGUubmFtZVwiLFxuICAgIFwiU09SVCBudW1iZXIoZmlsZS5uYW1lKSBBU0NcIixcbiAgICBcImBgYFwiLFxuICAgIFwiXCJcbiAgXS5qb2luKFwiXFxuXCIpO1xuXG4gIGNvbnN0IGhlYWRlciA9IGAtLS1cXG4ke3Byb3BzfVxcbi0tLVxcblxcbiMgJHtpZHhOYW1lfVxcbmA7XG4gIGNvbnN0IGNvbnRlbnQgPSBoZWFkZXIgKyBkYXRhdmlldztcblxuICBjb25zdCBleGlzdGluZyA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoaW5kZXhQYXRoKTtcbiAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICBjb25zdCBjdXIgPSBhd2FpdCBhcHAudmF1bHQucmVhZChleGlzdGluZyk7XG4gICAgaWYgKC9gYGBkYXRhdmlldy8udGVzdChjdXIpKSByZXR1cm4gZmFsc2U7IC8vIGFscmVhZHkgaGFzIGEgZGF0YXZpZXcgYmxvY2sgXHUyMDE0IHNraXBcblxuICAgIC8vIEluc2VydCBkYXRhdmlldyByaWdodCBhZnRlciBmcm9udG1hdHRlciBpZiBwcmVzZW50XG4gICAgY29uc3QgcGFydHMgPSBjdXIuc3BsaXQoXCItLS1cIik7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA+PSAzKSB7XG4gICAgICBjb25zdCBtZXJnZWQgPSBwYXJ0c1swXSArIFwiLS0tXCIgKyBwYXJ0c1sxXSArIFwiLS0tXFxuXCIgKyBkYXRhdmlldyArIHBhcnRzLnNsaWNlKDIpLmpvaW4oXCItLS1cIik7XG4gICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGV4aXN0aW5nLCBtZXJnZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGV4aXN0aW5nLCBjdXIgKyBcIlxcblwiICsgZGF0YXZpZXcpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICBhd2FpdCBhcHAudmF1bHQuY3JlYXRlKGluZGV4UGF0aCwgY29udGVudCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuLyoqIEV4aXN0aW5nIGNvbW1hbmQ6IGFkZCBpbmRleGVzIGZvciBhbGwgbGVhZiBmb2xkZXJzIHVuZGVyIGEgYmFzZSBmb2xkZXIgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kQWRkRm9sZGVySW5kZXgoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MsIHBhcmFtcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pIHtcbiAgY29uc3QgYmFzZUZvbGRlciA9IHBhcmFtcz8uZm9sZGVyID8/IHNldHRpbmdzLmJhc2VGb2xkZXI7XG4gIGNvbnN0IGZvbGRlcnMgPSBnZXRMZWFmRm9sZGVyc1VuZGVyKGFwcCwgYmFzZUZvbGRlcik7XG4gIGlmICghZm9sZGVycy5sZW5ndGgpIHsgbmV3IE5vdGljZShgTm8gbGVhZiBmb2xkZXJzIHVuZGVyICR7YmFzZUZvbGRlcn1gKTsgcmV0dXJuOyB9XG5cbiAgbGV0IGNoYW5nZWQgPSAwO1xuICBmb3IgKGNvbnN0IGZvbGRlciBvZiBmb2xkZXJzKSB7XG4gICAgY29uc3QgZGlkID0gYXdhaXQgY3JlYXRlT3JVcGRhdGVJbmRleEZvckZvbGRlcihhcHAsIHNldHRpbmdzLCBmb2xkZXIsIHRydWUpO1xuICAgIGlmIChkaWQpIGNoYW5nZWQrKztcbiAgfVxuXG4gIG5ldyBOb3RpY2UoY2hhbmdlZCA+IDAgPyBgRm9sZGVyIGluZGV4ZXMgY3JlYXRlZC91cGRhdGVkOiAke2NoYW5nZWR9YCA6IFwiTm8gY2hhbmdlczsgaW5kZXhlcyBhbHJlYWR5IHByZXNlbnQuXCIpO1xufVxuXG4vKiogTkVXIGNvbW1hbmQ6IGFkZC91cGRhdGUgaW5kZXggT05MWSBmb3IgdGhlIGZvbGRlciBvZiB0aGUgY3VycmVudCBmaWxlICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZEFkZEluZGV4Rm9yQ3VycmVudEZvbGRlcihhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuICBjb25zdCBhY3RpdmUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgY29uc3QgZm9sZGVyID0gYWN0aXZlPy5wYXJlbnQ7XG4gIGlmICghYWN0aXZlIHx8ICFmb2xkZXIpIHsgbmV3IE5vdGljZShcIk9wZW4gYSBmaWxlIGluc2lkZSB0aGUgdGFyZ2V0IGZvbGRlci5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IGRpZCA9IGF3YWl0IGNyZWF0ZU9yVXBkYXRlSW5kZXhGb3JGb2xkZXIoYXBwLCBzZXR0aW5ncywgZm9sZGVyLCBmYWxzZSk7XG4gIG5ldyBOb3RpY2UoZGlkID8gYEluZGV4IGNyZWF0ZWQvdXBkYXRlZCBmb3IgXHUyMDFDJHtmb2xkZXIubmFtZX1cdTIwMUQuYCA6IGBObyBpbmRleCBjaGFuZ2UgaW4gXHUyMDFDJHtmb2xkZXIubmFtZX1cdTIwMUQuYCk7XG59IiwgImV4cG9ydCBmdW5jdGlvbiBhcnRpY2xlU3R5bGUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKG5hbWUuZW5kc1dpdGgoXCIsIFRoZVwiKSkgcmV0dXJuIGBUaGUgJHtuYW1lLnNsaWNlKDAsIC01KX1gO1xuICBpZiAobmFtZS5lbmRzV2l0aChcIiwgQVwiKSkgICByZXR1cm4gYEEgJHtuYW1lLnNsaWNlKDAsIC0zKX1gO1xuICByZXR1cm4gbmFtZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vd1N0YW1wKCk6IHN0cmluZyB7XG4gIGNvbnN0IGQgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCB3ZWVrZGF5ID0gZC50b0xvY2FsZURhdGVTdHJpbmcodW5kZWZpbmVkLCB7IHdlZWtkYXk6IFwic2hvcnRcIiB9KTtcbiAgY29uc3QgZGF5ID0gU3RyaW5nKGQuZ2V0RGF0ZSgpKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gIGNvbnN0IG1vbnRoID0gZC50b0xvY2FsZURhdGVTdHJpbmcodW5kZWZpbmVkLCB7IG1vbnRoOiBcImxvbmdcIiB9KTtcbiAgY29uc3QgeWVhciA9IGQuZ2V0RnVsbFllYXIoKTtcbiAgY29uc3QgdGltZSA9IGQudG9Mb2NhbGVUaW1lU3RyaW5nKHVuZGVmaW5lZCwgeyBob3VyMTI6IGZhbHNlIH0pO1xuICByZXR1cm4gYCR7d2Vla2RheX0sICR7ZGF5fS4gJHttb250aH0gJHt5ZWFyfSwgJHt0aW1lfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnN1cmVOZXdsaW5lKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzLmVuZHNXaXRoKFwiXFxuXCIpID8gcyA6IHMgKyBcIlxcblwiO1xufVxuIiwgImltcG9ydCB0eXBlIE9ic2lkaWFuQmlibGVUb29scyBmcm9tIFwiLi9tYWluXCI7XG5pbXBvcnQgeyBjb21tYW5kVmVyc2VMaW5rcyB9IGZyb20gXCIuL2NvbW1hbmRzL3ZlcnNlTGlua3NcIjtcbmltcG9ydCB7IGNvbW1hbmRBZGROZXh0UHJldmlvdXMgfSBmcm9tIFwiLi9jb21tYW5kcy9hZGROZXh0UHJldmlvdXNcIjtcbmltcG9ydCB7IGNvbW1hbmRBZGRGb2xkZXJJbmRleCB9IGZyb20gXCIuL2NvbW1hbmRzL2FkZEZvbGRlckluZGV4XCI7XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclByb3RvY29sKHBsdWdpbjogT2JzaWRpYW5CaWJsZVRvb2xzKSB7XG4gIHBsdWdpbi5yZWdpc3Rlck9ic2lkaWFuUHJvdG9jb2xIYW5kbGVyKFwib2JzaWRpYW4tYmlibGUtdG9vbHNcIiwgYXN5bmMgKHBhcmFtcykgPT4ge1xuICAgIGNvbnN0IGFjdGlvbiA9IHBhcmFtcy5hY3Rpb24gPz8gXCJcIjtcbiAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgY2FzZSBcImxpbmstdmVyc2VzXCI6XG4gICAgICAgIGF3YWl0IGNvbW1hbmRWZXJzZUxpbmtzKHBsdWdpbi5hcHAsIHBsdWdpbi5zZXR0aW5ncywgcGFyYW1zKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiYWRkLW5leHQtcHJldmlvdXNcIjpcbiAgICAgICAgYXdhaXQgY29tbWFuZEFkZE5leHRQcmV2aW91cyhwbHVnaW4uYXBwLCBwbHVnaW4uc2V0dGluZ3MsIHBhcmFtcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFkZC1mb2xkZXItaW5kZXhcIjpcbiAgICAgICAgYXdhaXQgY29tbWFuZEFkZEZvbGRlckluZGV4KHBsdWdpbi5hcHAsIHBsdWdpbi5zZXR0aW5ncywgcGFyYW1zKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH0pO1xufVxuIiwgImltcG9ydCB0eXBlIHsgYWRkSWNvbiBhcyBBZGRJY29uRm4gfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuY29uc3QgSUNPTlM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIFwib2J0Yi1ib29rXCI6IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI+PHBhdGggZD1cIk02IDRoMTBhMiAyIDAgMCAxIDIgMnYxMi41YTEuNSAxLjUgMCAwIDAtMS41LTEuNUg2YTIgMiAwIDAgMCAwIDRoMTBcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIvPjwvc3ZnPmAsXG4gIFwib2J0Yi1saW5rc1wiOiBgPHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiPjxwYXRoIGQ9XCJNMTAgMTNhNSA1IDAgMCAxIDAtN2wxLTFhNSA1IDAgMCAxIDcgN2wtMSAxTTE0IDExYTUgNSAwIDAgMSAwIDdsLTEgMWE1IDUgMCAwIDEtNy03bDEtMVwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIi8+PC9zdmc+YCxcbiAgXCJvYnRiLWhpZ2hsaWdodGVyXCI6IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj48cGF0aCBkPVwiTTMgMTZsNi02IDUgNS02IDZIM3pcIiBmaWxsPVwiY3VycmVudENvbG9yXCIvPjxwYXRoIGQ9XCJNMTIgOWwzLTMgMyAzLTMgM3pcIiBmaWxsPVwiY3VycmVudENvbG9yXCIvPjwvc3ZnPmAsXG4gIFwib2J0Yi1zdW1tYXJ5XCI6IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj48cGF0aCBkPVwiTTUgNWgxNE01IDloMTBNNSAxM2g4TTUgMTdoNlwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgZmlsbD1cIm5vbmVcIi8+PC9zdmc+YCxcbiAgXCJvYnRiLW91dGxpbmVcIjogYDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiPjxwYXRoIGQ9XCJNNyA2aDEwTTcgMTJoMTBNNyAxOGg2XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBmaWxsPVwibm9uZVwiLz48L3N2Zz5gLFxuICBcIm9idGItZm9ybWF0dGVyXCI6IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj48cGF0aCBkPVwiTTUgN2g2TTUgMTJoMTBNNSAxN2g4XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBmaWxsPVwibm9uZVwiLz48L3N2Zz5gLFxuICBcIm9idGItYmlibGVcIjogYDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiPjxwYXRoIGQ9XCJNNi41IDRoOUEyLjUgMi41IDAgMCAxIDE4IDYuNVYyMEg4LjVBMi41IDIuNSAwIDAgMSA2IDE3LjVWNC41XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIvPjxwYXRoIGQ9XCJNMTAgOGg2TTEwIDExaDZcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIvPjwvc3ZnPmBcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3Rlckljb25zKGFkZEljb246IHR5cGVvZiBBZGRJY29uRm4pIHtcbiAgZm9yIChjb25zdCBbbmFtZSwgc3ZnXSBvZiBPYmplY3QuZW50cmllcyhJQ09OUykpIGFkZEljb24obmFtZSwgc3ZnKTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE5vdGljZSwgVEZvbGRlciB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBsaXN0TWFya2Rvd25GaWxlcyB9IGZyb20gXCIuLi9saWIvbWRVdGlsc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZEV4dHJhY3RIaWdobGlnaHRzRm9sZGVyKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IHZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgY29uc3Qgc3RhcnRGb2xkZXIgPSB2aWV3Py5wYXJlbnQgPz8gYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aChzZXR0aW5ncy5iYXNlRm9sZGVyKTtcbiAgaWYgKCEoc3RhcnRGb2xkZXIgaW5zdGFuY2VvZiBURm9sZGVyKSkgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgaW4gdGhlIHRhcmdldCBmb2xkZXIgb3Igc2V0IGEgdmFsaWQgYmFzZSBmb2xkZXIuXCIpOyByZXR1cm47IH1cblxuICBjb25zdCBhbGw6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgbWFya1JlZ2V4ID0gbmV3IFJlZ0V4cChgPG1hcmtcXFxccytzdHlsZT1bXCInXSR7c2V0dGluZ3MucmVkTWFya0Nzcy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxcXF1cXFxcXFxcXF0vZywgXCJcXFxcJCZcIil9W1wiJ10+KC4qPyk8L21hcms+YCwgXCJnXCIpO1xuXG4gIGNvbnN0IGZpbGVzID0gbGlzdE1hcmtkb3duRmlsZXMoc3RhcnRGb2xkZXIpLnNvcnQoKGEsYikgPT4ge1xuICAgIGNvbnN0IGFuID0gYS5iYXNlbmFtZS5tYXRjaCgvXlxcZCsvKT8uWzBdOyBjb25zdCBibiA9IGIuYmFzZW5hbWUubWF0Y2goL15cXGQrLyk/LlswXTtcbiAgICBpZiAoYW4gJiYgYm4pIHJldHVybiBOdW1iZXIoYW4pIC0gTnVtYmVyKGJuKTtcbiAgICBpZiAoYW4pIHJldHVybiAtMTtcbiAgICBpZiAoYm4pIHJldHVybiAxO1xuICAgIHJldHVybiBhLmJhc2VuYW1lLmxvY2FsZUNvbXBhcmUoYi5iYXNlbmFtZSk7XG4gIH0pO1xuXG4gIGZvciAoY29uc3QgZiBvZiBmaWxlcykge1xuICAgIGNvbnN0IHNyYyA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGYpO1xuICAgIGNvbnN0IGxvY2FsOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICAgIG1hcmtSZWdleC5sYXN0SW5kZXggPSAwO1xuICAgIHdoaWxlICgobSA9IG1hcmtSZWdleC5leGVjKHNyYykpICE9PSBudWxsKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gbVsxXS50cmltKCk7XG4gICAgICBpZiAoIXRleHQpIGNvbnRpbnVlO1xuICAgICAgaWYgKCFzZWVuLmhhcyh0ZXh0KSkgeyBzZWVuLmFkZCh0ZXh0KTsgaWYgKCFsb2NhbC5pbmNsdWRlcyh0ZXh0KSkgbG9jYWwucHVzaCh0ZXh0KTsgfVxuICAgIH1cbiAgICBpZiAobG9jYWwubGVuZ3RoKSB7XG4gICAgICBhbGwucHVzaChgXFxuIyMjIyBbWyR7Zi5iYXNlbmFtZX1dXVxcbmAgKyBsb2NhbC5tYXAodCA9PiBgLSAke3R9YCkuam9pbihcIlxcblwiKSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFhbGwubGVuZ3RoKSB7IG5ldyBOb3RpY2UoXCJObyBoaWdobGlnaHRzIGZvdW5kIGluIGZvbGRlci5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IG91dCA9IGFsbC5qb2luKFwiXFxuXCIpO1xuICBjb25zdCB0YXJnZXQgPSBzdGFydEZvbGRlci5wYXRoICsgXCIvSGlnaGxpZ2h0cy5tZFwiO1xuICBjb25zdCBleGlzdGluZyA9IGFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKHRhcmdldCk7XG4gIGlmIChleGlzdGluZykgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShleGlzdGluZywgb3V0KTtcbiAgZWxzZSBhd2FpdCBhcHAudmF1bHQuY3JlYXRlKHRhcmdldCwgb3V0KTtcbiAgbmV3IE5vdGljZShcIkhpZ2hsaWdodHMubWQgY3JlYXRlZC5cIik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgaW5zZXJ0QWZ0ZXJZYW1sT3JIMSB9IGZyb20gXCIuLi9saWIvbWRVdGlsc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZEV4dHJhY3RSZWRIaWdobGlnaHRzKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgaWYgKCFmaWxlKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7IHJldHVybjsgfVxuICBjb25zdCBzcmMgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcblxuICBjb25zdCBtYXJrUmVnZXggPSBuZXcgUmVnRXhwKGA8bWFya1xcXFxzK3N0eWxlPVtcIiddJHtzZXR0aW5ncy5yZWRNYXJrQ3NzLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXFxcXVxcXFxcXFxcXS9nLCBcIlxcXFwkJlwiKX1bXCInXT4oLio/KTwvbWFyaz5gLCBcImdcIik7XG4gIGNvbnN0IGhpdHM6IHN0cmluZ1tdID0gW107XG4gIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICB3aGlsZSAoKG0gPSBtYXJrUmVnZXguZXhlYyhzcmMpKSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHRleHQgPSBtWzFdLnRyaW0oKTtcbiAgICBpZiAodGV4dCAmJiAhaGl0cy5pbmNsdWRlcyh0ZXh0KSkgaGl0cy5wdXNoKHRleHQpO1xuICB9XG5cbiAgaWYgKCFoaXRzLmxlbmd0aCkgeyBuZXcgTm90aWNlKFwiTm8gcmVkIGhpZ2hsaWdodHMgZm91bmQuXCIpOyByZXR1cm47IH1cblxuICBjb25zdCBzZWN0aW9uID0gW1xuICAgIFwiPiBbIXN1bW1hcnldLSBIaWdobGlnaHRzXCIsXG4gICAgLi4uaGl0cy5tYXAoaCA9PiBgPiAtICR7aH1gKSxcbiAgICBcIlwiXG4gIF0uam9pbihcIlxcblwiKTtcblxuICBjb25zdCBtZXJnZWQgPSBpbnNlcnRBZnRlcllhbWxPckgxKHNyYywgc2VjdGlvbik7XG4gIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgbWVyZ2VkKTtcbiAgbmV3IE5vdGljZShcIkhpZ2hsaWdodHMgc2VjdGlvbiBpbnNlcnRlZC5cIik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZE91dGxpbmVFeHRyYWN0b3IoYXBwOiBBcHAsIF9zZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgaWYgKCFmaWxlKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IG9yaWdpbmFsID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIGNvbnN0IGxpbmVzID0gb3JpZ2luYWwuc3BsaXQoL1xccj9cXG4vKTtcblxuICBjb25zdCBvdXRsaW5lTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgLy8gRVhBQ1QgcmVnZXggYXMgUHl0aG9uOiBvbmUgc3BhY2UgYWZ0ZXIgdGhlIGhhc2hlc1xuICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBtID0gbGluZS5tYXRjaCgvXigjezIsNn0pICguKykvKTtcbiAgICBpZiAobSkge1xuICAgICAgY29uc3QgaGFzaGVzID0gbVsxXTtcbiAgICAgIGxldCBjb250ZW50ID0gbVsyXTtcbiAgICAgIGNvbnN0IGxldmVsID0gaGFzaGVzLmxlbmd0aCAtIDI7IC8vICMjIC0+IDAsICMjIyAtPiAxLCBldGMuXG4gICAgICBjb25zdCBpbmRlbnQgPSBcIlxcdFwiLnJlcGVhdChNYXRoLm1heCgwLCBsZXZlbCAtIDEpKTtcbiAgICAgIGlmIChsZXZlbCA9PT0gMCkgY29udGVudCA9IGAqKiR7Y29udGVudH0qKmA7XG4gICAgICBvdXRsaW5lTGluZXMucHVzaChgJHtpbmRlbnR9JHtjb250ZW50fWApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChvdXRsaW5lTGluZXMubGVuZ3RoID09PSAwKSB7XG4gICAgbmV3IE5vdGljZShcIk5vIGhlYWRpbmdzICgjIy4uIyMjIyMjKSBmb3VuZC5cIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gQ2hlY2sgbGFzdCA0IGxpbmVzIGZvciBcInxOZXh0XV1cIiBvciBcInxQcmV2aW91c11dXCJcbiAgbGV0IGluc2VydEluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgY29uc3QgbG9va2JhY2sgPSBNYXRoLm1pbig0LCBsaW5lcy5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMTsgaSA8PSBsb29rYmFjazsgaSsrKSB7XG4gICAgY29uc3QgbG4gPSBsaW5lc1tsaW5lcy5sZW5ndGggLSBpXTtcbiAgICBpZiAoL1xcfE5leHRcXF1cXF18XFx8UHJldmlvdXNcXF1cXF0vLnRlc3QobG4pKSB7XG4gICAgICBpbnNlcnRJbmRleCA9IGxpbmVzLmxlbmd0aCAtIGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBjb25zdCBvdXRsaW5lVGV4dCA9IFwiIyMgT3V0bGluZVxcblwiICsgb3V0bGluZUxpbmVzLmpvaW4oXCJcXG5cIikgKyBcIlxcblxcblwiO1xuXG4gIGlmIChpbnNlcnRJbmRleCAhPT0gbnVsbCkge1xuICAgIC8vIEluc2VydCBiZWZvcmUgdGhlIGZvdW5kIGxpbmUsIHByZXNlcnZpbmcgc3Vycm91bmRpbmcgbmV3bGluZXNcbiAgICBjb25zdCBiZWZvcmVTdHIgPSBsaW5lcy5zbGljZSgwLCBpbnNlcnRJbmRleCkuam9pbihcIlxcblwiKTtcbiAgICBjb25zdCBhZnRlclN0ciA9IGxpbmVzLnNsaWNlKGluc2VydEluZGV4KS5qb2luKFwiXFxuXCIpO1xuICAgIGNvbnN0IG5ld0NvbnRlbnQgPVxuICAgICAgKGJlZm9yZVN0ci5lbmRzV2l0aChcIlxcblwiKSB8fCBiZWZvcmVTdHIubGVuZ3RoID09PSAwID8gXCJcIiA6IFwiXFxuXCIpICtcbiAgICAgIG91dGxpbmVUZXh0ICtcbiAgICAgIGFmdGVyU3RyO1xuICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgYmVmb3JlU3RyICsgbmV3Q29udGVudCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gQXBwZW5kIHRvIGVuZCAobGlrZSBQeXRob24gJ2EnIG1vZGUpXG4gICAgY29uc3QgbmV3Q29udGVudCA9IG9yaWdpbmFsICsgKG9yaWdpbmFsLmVuZHNXaXRoKFwiXFxuXCIpID8gXCJcIiA6IFwiXFxuXCIpICsgb3V0bGluZVRleHQ7XG4gICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBuZXdDb250ZW50KTtcbiAgfVxuXG4gIG5ldyBOb3RpY2UoXCJPdXRsaW5lIGFwcGVuZGVkIHN1Y2Nlc3NmdWxseS5cIik7XG59IiwgImltcG9ydCB7IEFwcCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZvcm1hdE91dGxpbmVUZXh0IH0gZnJvbSBcIi4uL2xpYi9vdXRsaW5lVXRpbHNcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbW1hbmRPdXRsaW5lRm9ybWF0dGVyKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgaWYgKCFmaWxlKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IHNyYyA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuXG4gIGNvbnN0IG91dCA9IGF3YWl0IGZvcm1hdE91dGxpbmVUZXh0KHNyYywge1xuICAgIHNwbGl0SW5saW5lU3VicG9pbnRzOiB0cnVlLCAgIC8vIHNwbGl0cyBcIi4uLiB2LiA5OiBhLiAuLi4gYi4gLi4uXCIsIGJ1dCBOT1Qgb24gXCIuXCJcbiAgICBmaXhIeXBoZW5hdGVkQnJlYWtzOiB0cnVlLCAgICAvLyBmaXhlcyBcImlsbHVzLSB0cmF0ZWRcIiBcdTIxOTIgXCJpbGx1c3RyYXRlZFwiXG4gICAgZHJvcFB1cmVQYWdlTnVtYmVyTGluZXM6IHRydWUgLy8gb3B0aW9uYWw6IGRyb3BzIFwiMTRcIiwgXCIxNVwiLCBcIjE2XCJcbiAgfSwgc2V0dGluZ3MpO1xuXG4gIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgb3V0KTtcbiAgbmV3IE5vdGljZShcIk91dGxpbmUgZm9ybWF0dGVkLlwiKTtcbn0iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBsaW5rVmVyc2VzSW5UZXh0IH0gZnJvbSBcInNyYy9jb21tYW5kcy92ZXJzZUxpbmtzXCI7XG5pbXBvcnQgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwic3JjL3NldHRpbmdzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3V0bGluZUZvcm1hdE9wdGlvbnMge1xuICBzcGxpdElubGluZVN1YnBvaW50cz86IGJvb2xlYW47ICAgICAgIC8vIGRlZmF1bHQ6IHRydWVcbiAgZml4SHlwaGVuYXRlZEJyZWFrcz86IGJvb2xlYW47ICAgICAgICAvLyBkZWZhdWx0OiB0cnVlXG4gIGRyb3BQdXJlUGFnZU51bWJlckxpbmVzPzogYm9vbGVhbjsgICAgLy8gZGVmYXVsdDogZmFsc2VcbiAgb3V0cHV0TGluZVNlcGFyYXRvcj86IHN0cmluZzsgICAgICAgICAvLyBkZWZhdWx0OiBcIlxcblwiXG59XG5cbi8qKiAtLS0tLSBIZWxwZXJzIChkZWxpbWl0ZXItYXdhcmUgKyBQeXRob24gcGFyaXR5KSAtLS0tLSAqL1xuXG5mdW5jdGlvbiByb21hblRvSW50KHJvbWFuOiBzdHJpbmcpOiBudW1iZXIge1xuICBjb25zdCBtYXA6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7IEk6MSwgVjo1LCBYOjEwLCBMOjUwLCBDOjEwMCwgRDo1MDAsIE06MTAwMCB9O1xuICBsZXQgcmVzdWx0ID0gMCwgcHJldiA9IDA7XG4gIGZvciAobGV0IGkgPSByb21hbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGNvbnN0IHZhbCA9IG1hcFtyb21hbltpXV07XG4gICAgaWYgKCF2YWwpIHJldHVybiBOYU47XG4gICAgcmVzdWx0ICs9IHZhbCA8IHByZXYgPyAtdmFsIDogdmFsO1xuICAgIHByZXYgPSB2YWw7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbmNvbnN0IGlzUm9tYW4gPSAoczogc3RyaW5nKSA9PiAvXltJVlhMQ0RNXSskLy50ZXN0KHMpO1xuY29uc3QgaXNBbHBoYVVwcGVyID0gKHM6IHN0cmluZykgPT4gL15bQS1aXSQvLnRlc3Qocyk7XG5cbmZ1bmN0aW9uIGdldE1kUHJlZml4RnJvbUxldmVsKGxldmVsOiBudW1iZXIgfCBcImJ1bGxldFwiKTogc3RyaW5nIHtcbiAgc3dpdGNoIChsZXZlbCkge1xuICAgIGNhc2UgMjogcmV0dXJuIFwiIyNcIjsgICAgICAvLyBSb21hblxuICAgIGNhc2UgMzogcmV0dXJuIFwiIyMjXCI7ICAgICAvLyBBLlxuICAgIGNhc2UgNDogcmV0dXJuIFwiIyMjI1wiOyAgICAvLyAxLlxuICAgIGNhc2UgNTogcmV0dXJuIFwiIyMjIyNcIjsgICAvLyBhLlxuICAgIGNhc2UgNjogcmV0dXJuIFwiIyMjIyMjXCI7ICAvLyAoMSkgb3IgMSlcbiAgICBkZWZhdWx0OiByZXR1cm4gXCIjIyMjIyNcIjsgLy8gYnVsbGV0IGZhbGxiYWNrXG4gIH1cbn1cblxuLyoqIFRva2VuaXplIGEgaGVhZGluZyBtYXJrZXIgYW5kIGl0cyByZXN0LiBDYXB0dXJlcyBkZWxpbWl0ZXI6IFwiLlwiLCBcIilcIiwgb3IgXCIuKVwiICovXG5mdW5jdGlvbiBwYXJzZUhlYWRpbmdTdGFydChzOiBzdHJpbmcpOiB7IHRva2VuOiBzdHJpbmc7IGxhYmVsOiBzdHJpbmc7IHJlc3Q6IHN0cmluZzsgZGVsaW06IHN0cmluZyB8IG51bGwgfSB8IG51bGwge1xuICBjb25zdCBtID1cbiAgICBzLm1hdGNoKC9eXFxzKig/PHJvbWFuPltJVlhMQ0RNXSspKD88ZGVsaW0+XFwuXFwpfFsuKV0pXFxzKyg/PHJlc3Q+LispJC8pIHx8XG4gICAgcy5tYXRjaCgvXlxccyooPzx1cHBlcj5bQS1aXSkoPzxkZWxpbT5cXC5cXCl8Wy4pXSlcXHMrKD88cmVzdD4uKykkLykgICAgICB8fFxuICAgIHMubWF0Y2goL15cXHMqKD88bnVtPlxcZCspKD88ZGVsaW0+XFwuXFwpfFsuKV0pXFxzKyg/PHJlc3Q+LispJC8pICAgICAgICAgIHx8XG4gICAgcy5tYXRjaCgvXlxccypcXChcXHMqKD88cG51bT5cXGQrKVxccypcXClcXHMrKD88cmVzdD4uKykkLykgICAgICAgICAgICAgICAgICB8fFxuICAgIHMubWF0Y2goL15cXHMqXFwoXFxzKig/PHBsb3c+W2Etel0pXFxzKlxcKVxccysoPzxyZXN0Pi4rKSQvKSAgICAgICAgICAgICAgICB8fFxuICAgIHMubWF0Y2goL15cXHMqKD88bG93PlthLXpdKSg/PGRlbGltPlxcLlxcKXxbLildKVxccysoPzxyZXN0Pi4rKSQvKTtcblxuICBpZiAoIW0pIHJldHVybiBudWxsO1xuICBjb25zdCBnID0gKG0gYXMgYW55KS5ncm91cHMgfHwge307XG4gIGxldCBsYWJlbCA9IFwiXCI7XG4gIGxldCBkZWxpbTogc3RyaW5nIHwgbnVsbCA9IGcuZGVsaW0gPz8gbnVsbDtcblxuICBpZiAoZy5yb21hbikgbGFiZWwgPSBnLnJvbWFuO1xuICBlbHNlIGlmIChnLnVwcGVyKSBsYWJlbCA9IGcudXBwZXI7XG4gIGVsc2UgaWYgKGcubnVtKSBsYWJlbCA9IGcubnVtO1xuICBlbHNlIGlmIChnLnBudW0pIHsgbGFiZWwgPSBgKCR7Zy5wbnVtfSlgOyBkZWxpbSA9IFwiKVwiOyB9XG4gIGVsc2UgaWYgKGcucGxvdykgeyBsYWJlbCA9IGAoJHtnLnBsb3d9KWA7IGRlbGltID0gXCIpXCI7IH1cbiAgZWxzZSBpZiAoZy5sb3cpIGxhYmVsID0gZy5sb3c7XG5cbiAgbGV0IHRva2VuID0gXCJcIjtcbiAgaWYgKGcucm9tYW4pIHRva2VuID0gYCR7Zy5yb21hbn0ke2RlbGltID8/IFwiLlwifWA7XG4gIGVsc2UgaWYgKGcudXBwZXIpIHRva2VuID0gYCR7Zy51cHBlcn0ke2RlbGltID8/IFwiLlwifWA7XG4gIGVsc2UgaWYgKGcubnVtKSB0b2tlbiA9IGAke2cubnVtfSR7ZGVsaW0gPz8gXCIuXCJ9YDtcbiAgZWxzZSBpZiAoZy5wbnVtKSB0b2tlbiA9IGAoJHtnLnBudW19KWA7XG4gIGVsc2UgaWYgKGcucGxvdykgdG9rZW4gPSBgKCR7Zy5wbG93fSlgO1xuICBlbHNlIGlmIChnLmxvdykgdG9rZW4gPSBgJHtnLmxvd30ke2RlbGltID8/IFwiLlwifWA7XG5cbiAgcmV0dXJuIHsgdG9rZW4sIGxhYmVsLCByZXN0OiBnLnJlc3QgfHwgXCJcIiwgZGVsaW0gfTtcbn1cblxuLyoqIERlY2lkZSBsZXZlbCB1c2luZyBkZWxpbWl0ZXIsIHBsdXMgUm9tYW4vQWxwaGEgaGV1cmlzdGljcyAobGlrZSBQeXRob24pICovXG5mdW5jdGlvbiBkZWNpZGVMZXZlbChcbiAgbGFiZWw6IHN0cmluZyxcbiAgZGVsaW06IHN0cmluZyB8IG51bGwsXG4gIHByZXZSb206IHN0cmluZyB8IG51bGwsXG4gIHByZXZBbHBoYUlkeDogbnVtYmVyIHwgbnVsbFxuKTogeyBsZXZlbDogbnVtYmVyIHwgXCJidWxsZXRcIjsgbmV4dFJvbTogc3RyaW5nIHwgbnVsbDsgbmV4dEFscGhhSWR4OiBudW1iZXIgfCBudWxsIH0ge1xuICBpZiAoL15cXChcXGQrXFwpJC8udGVzdChsYWJlbCkpIHtcbiAgICByZXR1cm4geyBsZXZlbDogNiwgbmV4dFJvbTogcHJldlJvbSwgbmV4dEFscGhhSWR4OiBwcmV2QWxwaGFJZHggfTsgICAgICAgICAvLyAoMSlcbiAgfVxuICBpZiAoL15cXChbYS16XStcXCkkLy50ZXN0KGxhYmVsKSkge1xuICAgIHJldHVybiB7IGxldmVsOiBcImJ1bGxldFwiLCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IHByZXZBbHBoYUlkeCB9OyAgLy8gKGEpXG4gIH1cblxuICAvLyAxKSB2cyAxLiB2cyAxLilcbiAgaWYgKC9eXFxkKyQvLnRlc3QobGFiZWwpKSB7XG4gICAgaWYgKGRlbGltID09PSBcIilcIikge1xuICAgICAgcmV0dXJuIHsgbGV2ZWw6IDYsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogcHJldkFscGhhSWR4IH07ICAgICAgIC8vIDEpXG4gICAgfVxuICAgIHJldHVybiB7IGxldmVsOiA0LCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IHByZXZBbHBoYUlkeCB9OyAgICAgICAgIC8vIDEuIC8gMS4pXG4gIH1cblxuICAvLyBSb21hbiB2cyBBbHBoYSBhbWJpZ3VpdHkgKGUuZy4sIEkuKVxuICBpZiAoaXNSb21hbihsYWJlbCkpIHtcbiAgICBjb25zdCByb21WYWwgPSByb21hblRvSW50KGxhYmVsKTtcbiAgICBjb25zdCBmaXRzUm9tYW4gPSAhcHJldlJvbSB8fCByb21hblRvSW50KHByZXZSb20pICsgMSA9PT0gcm9tVmFsO1xuXG4gICAgY29uc3QgYWxwaGFWYWwgPSBpc0FscGhhVXBwZXIobGFiZWwpID8gKGxhYmVsLmNoYXJDb2RlQXQoMCkgLSA2NCkgOiBudWxsOyAvLyBBPTFcbiAgICBjb25zdCBmaXRzQWxwaGEgPSBwcmV2QWxwaGFJZHggPT0gbnVsbCA/IHRydWUgOiAoYWxwaGFWYWwgIT0gbnVsbCAmJiBhbHBoYVZhbCA9PT0gcHJldkFscGhhSWR4ICsgMSk7XG5cbiAgICBpZiAoZml0c1JvbWFuICYmICFmaXRzQWxwaGEpIHtcbiAgICAgIHJldHVybiB7IGxldmVsOiAyLCBuZXh0Um9tOiBsYWJlbCwgbmV4dEFscGhhSWR4OiBwcmV2QWxwaGFJZHggfTsgICAgICAgICAvLyAjI1xuICAgIH0gZWxzZSBpZiAoZml0c0FscGhhICYmICFmaXRzUm9tYW4pIHtcbiAgICAgIHJldHVybiB7IGxldmVsOiAzLCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IGFscGhhVmFsID8/IDEgfTsgICAgICAvLyAjIyNcbiAgICB9IGVsc2UgaWYgKGZpdHNSb21hbiAmJiBmaXRzQWxwaGEpIHtcbiAgICAgIHJldHVybiB7IGxldmVsOiAzLCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IGFscGhhVmFsID8/IDEgfTsgICAgICAvLyBwcmVmZXIgYWxwaGEgYXMgZGVlcGVyXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7IGxldmVsOiAyLCBuZXh0Um9tOiBsYWJlbCwgbmV4dEFscGhhSWR4OiBwcmV2QWxwaGFJZHggfTsgICAgICAgICAvLyBkZWZhdWx0IHRvIFJvbWFuXG4gICAgfVxuICB9XG5cbiAgLy8gQSkgdnMgQS5cbiAgaWYgKGlzQWxwaGFVcHBlcihsYWJlbCkpIHtcbiAgICByZXR1cm4geyBsZXZlbDogMywgbmV4dFJvbTogcHJldlJvbSwgbmV4dEFscGhhSWR4OiBsYWJlbC5jaGFyQ29kZUF0KDApIC0gNjQgfTsgLy8gIyMjXG4gIH1cblxuICAvLyBhKSB2cyBhLlxuICBpZiAoL15bYS16XSQvLnRlc3QobGFiZWwpKSB7XG4gICAgaWYgKGRlbGltID09PSBcIilcIikge1xuICAgICAgcmV0dXJuIHsgbGV2ZWw6IFwiYnVsbGV0XCIsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogcHJldkFscGhhSWR4IH07ICAgIC8vIGEpXG4gICAgfVxuICAgIHJldHVybiB7IGxldmVsOiA1LCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IHByZXZBbHBoYUlkeCB9OyAgICAgICAgICAgICAvLyBhLlxuICB9XG5cbiAgcmV0dXJuIHsgbGV2ZWw6IFwiYnVsbGV0XCIsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogcHJldkFscGhhSWR4IH07XG59XG5cbi8qKiBIeXBoZW4gYnJlYWsgZml4ZXJzICovXG5jb25zdCBIWVBIID0gYC1cXFxcdTAwQURcXFxcdTIwMTBcXFxcdTIwMTFcXFxcdTIwMTJcXFxcdTIwMTNcXFxcdTIwMTRgOyAvLyAtLCBzb2Z0IGh5cGhlbiwgXHUyMDEwLCAtLCBcdTIwMTIsIFx1MjAxMywgXHUyMDE0XG5jb25zdCBJTkxJTkVfSFlQSEVOX0JSRUFLX1JFID0gbmV3IFJlZ0V4cChgKFtBLVphLXpcdTAwQzAtXHUwMEQ2XHUwMEQ4LVx1MDBGNlx1MDBGOC1cdTAwRkZdKVske0hZUEh9XVxcXFxzKyhbYS16XHUwMEUwLVx1MDBGNlx1MDBGOC1cdTAwRkZdKWAsIFwiZ1wiKTtcbmNvbnN0IFRSQUlMSU5HX0hZUEhFTl9BVF9FTkRfUkUgPSBuZXcgUmVnRXhwKGBbQS1aYS16XHUwMEMwLVx1MDBENlx1MDBEOC1cdTAwRjZcdTAwRjgtXHUwMEZGXVske0hZUEh9XVxcXFxzKiRgKTtcbmZ1bmN0aW9uIGZpeElubGluZUh5cGhlbnMoczogc3RyaW5nKTogc3RyaW5nIHsgcmV0dXJuIHMucmVwbGFjZShJTkxJTkVfSFlQSEVOX0JSRUFLX1JFLCBcIiQxJDJcIik7IH1cbmZ1bmN0aW9uIGFwcGVuZFdpdGhXb3JkQnJlYWtGaXgoYnVmOiBzdHJpbmcsIG5leHQ6IHN0cmluZywgZml4OiBib29sZWFuKTogc3RyaW5nIHtcbiAgaWYgKGZpeCkge1xuICAgIGlmIChUUkFJTElOR19IWVBIRU5fQVRfRU5EX1JFLnRlc3QoYnVmKSAmJiAvXlthLXpcdTAwRTAtXHUwMEY2XHUwMEY4LVx1MDBGRl0vLnRlc3QobmV4dCkpIHtcbiAgICAgIHJldHVybiBidWYucmVwbGFjZShuZXcgUmVnRXhwKGBbJHtIWVBIfV1cXFxccyokYCksIFwiXCIpICsgbmV4dDtcbiAgICB9XG4gICAgY29uc3Qgam9pbmVkID0gKGJ1ZiArIFwiIFwiICsgbmV4dCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG4gICAgcmV0dXJuIGZpeElubGluZUh5cGhlbnMoam9pbmVkKTtcbiAgfVxuICByZXR1cm4gKGJ1ZiArIFwiIFwiICsgbmV4dCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG59XG5cbi8qKiAtLS0gU3BsaXQgaGVscGVycyAobm93IHdpdGggXHUyMDE4cHJvdGVjdGVkXHUyMDE5IHZlcnNlICYgUy4gUy4gc3BhbnMpIC0tLSAqL1xuY29uc3QgVE9LRU5fU1RBUlRfU1JDID0gU3RyaW5nLnJhd2AoPzpbSVZYTENETV0rWy4pXXxbQS1aXVsuKV18W2Etel1bLildfFxcZCtbLildfCRiZWdpbjptYXRoOnRleHQkW2EtekEtWjAtOV0rJGVuZDptYXRoOnRleHQkKWA7XG5cbmNvbnN0IEFGVEVSX1BVTkNUX1NQTElUX1JFID0gbmV3IFJlZ0V4cChcbiAgU3RyaW5nLnJhd2AoWzo7IT8pXXxcdTIwMTRcXHMqdlxcLlxccypcXGQrW2Etel0/OilcXHMrKD89YCArIFRPS0VOX1NUQVJUX1NSQyArIFN0cmluZy5yYXdgXFxzKylgLFxuICBcImdpXCJcbik7XG5cbi8vIE9ubHkgcHJvdGVjdCB2ZXJzZSBtYXJrZXJzIGFuZCBcdTIwMUNTLiBTLlx1MjAxRDsgYWxsIG90aGVyIG9uZS1sZXR0ZXIgYWJicmV2cyBjYW4gc3BsaXQuXG5jb25zdCBBRlRFUl9TRU5UX1RPS0VOX1NQTElUX1JFID0gbmV3IFJlZ0V4cChcbiAgU3RyaW5nLnJhd2AoPzwhXFxiW3ZWXVt2Vl1cXC4pKD88IVxcYlt2Vl1cXC4pKD88IVxcYlNcXC5cXHMqUylcXC5cXHMrKD89YCArIFRPS0VOX1NUQVJUX1NSQyArIFN0cmluZy5yYXdgXFxzKylgLFxuICBcImdcIlxuKTtcblxuLy8gUHJlLXByb3RlY3QgXCJ2LiA3XCIsIFwidnYuIDctOVwiIGFuZCBcIlMuIFMuXCIgc28gc3BsaXR0ZXJzIGNhblx1MjAxOXQgY3V0IHRoZW0uXG4vLyBVc2VzIGEgcHJpdmF0ZS11c2Ugc2VudGluZWwgZm9yIHRoZSBwcm90ZWN0ZWQgc3BhY2UuXG5jb25zdCBTRU5USU5FTCA9IFwiXFx1RTAwMFwiO1xuZnVuY3Rpb24gcHJvdGVjdFNwYW5zKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vIHYuIDdbbGV0dGVyXT9cbiAgcyA9IHMucmVwbGFjZSgvXFxiKFt2Vl0pXFwuXFxzKyhcXGQrW2Etel0/KSg/PVteXFxkXXwkKS9nLCAoX20sIHYsIG4pID0+IGAke3Z9LmAgKyBTRU5USU5FTCArIG4pO1xuICAvLyB2di4gNy05IC8gVlYuIDdcdTIwMTM5IGV0Yy5cbiAgcyA9IHMucmVwbGFjZSgvXFxiKFt2Vl0pKFt2Vl0pXFwuXFxzKyhcXGQrW2Etel0/KShcXHMqWy1cdTIwMTNcdTIwMTRdXFxzKlxcZCtbYS16XT8pPy9nLFxuICAgIChfbSwgdjEsIHYyLCBhLCBybmcpID0+IGAke3YxfSR7djJ9LmAgKyBTRU5USU5FTCArIGEgKyAocm5nID8/IFwiXCIpXG4gICk7XG4gIC8vIFMuIFMuXG4gIHMgPSBzLnJlcGxhY2UoL1xcYlNcXC5cXHMqU1xcLi9nLCBtID0+IG0ucmVwbGFjZSgvXFxzKy8sIFNFTlRJTkVMKSk7XG4gIHJldHVybiBzO1xufVxuZnVuY3Rpb24gdW5wcm90ZWN0U3BhbnMoczogc3RyaW5nKTogc3RyaW5nIHsgcmV0dXJuIHMucmVwbGFjZShuZXcgUmVnRXhwKFNFTlRJTkVMLCBcImdcIiksIFwiIFwiKTsgfVxuXG5mdW5jdGlvbiBzcGxpdElubGluZVNlZ21lbnRzKGxpbmU6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgbGV0IHMgPSBwcm90ZWN0U3BhbnMobGluZSk7XG4gIHMgPSBzLnJlcGxhY2UoQUZURVJfUFVOQ1RfU1BMSVRfUkUsIChfbSwgcDE6IHN0cmluZykgPT4gYCR7cDF9XFxuYCk7XG4gIHMgPSBzLnJlcGxhY2UoQUZURVJfU0VOVF9UT0tFTl9TUExJVF9SRSwgXCIuXFxuXCIpO1xuICBzID0gdW5wcm90ZWN0U3BhbnMocyk7XG4gIHJldHVybiBzLnNwbGl0KFwiXFxuXCIpLm1hcCh4ID0+IHgudHJpbSgpKS5maWx0ZXIoQm9vbGVhbik7XG59XG5cbi8qKiAtLS0tLSBNYWluIGZvcm1hdHRlciAoZGVsaW1pdGVyLWF3YXJlLCB2ZXJzZS1zYWZlKSAtLS0tLSAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZvcm1hdE91dGxpbmVUZXh0KFxuICB0ZXh0T3JMaW5lczogc3RyaW5nIHwgc3RyaW5nW10sXG4gIHtcbiAgICBzcGxpdElubGluZVN1YnBvaW50cyA9IHRydWUsXG4gICAgZml4SHlwaGVuYXRlZEJyZWFrcyA9IHRydWUsXG4gICAgb3V0cHV0TGluZVNlcGFyYXRvciA9IFwiXFxuXCIsXG4gICAgZHJvcFB1cmVQYWdlTnVtYmVyTGluZXMgPSBmYWxzZVxuICB9OiBPdXRsaW5lRm9ybWF0T3B0aW9ucyA9IHt9LFxuICBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICAvLyBCdWlsZCBhIHJhdyBzdHJpbmcgc28gd2UgY2FuIHByZS1oYWNrIHRoZSB2ZXJ5IGZpcnN0IFwiIEkuIFwiXG4gIGxldCByYXcgPSBBcnJheS5pc0FycmF5KHRleHRPckxpbmVzKSA/IHRleHRPckxpbmVzLmpvaW4oXCJcXG5cIikgOiB0ZXh0T3JMaW5lcztcblxuICAvLyBIQVJEIFBBVENIOiBJbiB0aGUgZmlyc3QgMjAwMCBjaGFycyBvbmx5LCBpbnNlcnQgYSBuZXdsaW5lIGJlZm9yZSB0aGUgZmlyc3Qgc3RhbmRhbG9uZSBcIiBJLiBcIlxuICAvLyAtIE5vdCBwcmVjZWRlZCBieSBhIGxldHRlci9udW1iZXIgKHNvIG5vdCBcIklJLlwiKVxuICAvLyAtIEZvbGxvd2VkIGJ5IGEgY2FwaXRhbCAoc3RhcnQgb2YgYSBzZW50ZW5jZS9oZWFkaW5nKVxuICAvLyAtIERvIG5vdCB0b3VjaCBcIlMuIFMuXCJcbiAge1xuICAgIGNvbnN0IGhlYWQgPSByYXcuc2xpY2UoMCwgMjAwMCk7XG4gICAgY29uc3QgdGFpbCA9IHJhdy5zbGljZSgyMDAwKTtcblxuICAgIC8vIG9uZS10aW1lIHJlcGxhY2UgKG5vIC9nLylcbiAgICBjb25zdCBoZWFkUGF0Y2hlZCA9IGhlYWQucmVwbGFjZShcbiAgICAgIC8oXnxbXkEtWmEtejAtOV0pSVxcLlxccysoPz1bQS1aXSkoPyFcXHMqU1xcLikvbSxcbiAgICAgIChfbSwgcHJlKSA9PiBgJHtwcmV9XFxuSS4gYFxuICAgICk7XG5cbiAgICByYXcgPSBoZWFkUGF0Y2hlZCArIHRhaWw7XG4gIH1cblxuICAvLyBub3cgcHJvY2VlZCB3aXRoIG5vcm1hbCBsaW5lIHNwbGl0dGluZyB1c2luZyB0aGUgcGF0Y2hlZCB0ZXh0XG4gIGNvbnN0IGxpbmVzID0gcmF3LnNwbGl0KC9cXHI/XFxuLyk7XG5cbiAgLy8gY29uc3QgbGluZXMgPSBBcnJheS5pc0FycmF5KHRleHRPckxpbmVzKSA/IHRleHRPckxpbmVzLnNsaWNlKCkgOiB0ZXh0T3JMaW5lcy5zcGxpdCgvXFxyP1xcbi8pO1xuXG4gIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgbGV0IGJ1ZiA9IFwiXCI7XG4gIGxldCBwcmV2Um9tYW46IHN0cmluZyB8IG51bGwgPSBudWxsOyAgICAgLy8gcHJldmlvdXMgUm9tYW4gbGFiZWwgKEksIElJLCBcdTIwMjYpXG4gIGxldCBwcmV2QWxwaGFJZHg6IG51bWJlciB8IG51bGwgPSBudWxsOyAgLy8gcHJldmlvdXMgQWxwaGEgaW5kZXggKEE9MSwgQj0yLCBcdTIwMjYpXG5cbiAgY29uc3QgZW1pdEJ1ZmZlciA9IChyYXc6IHN0cmluZykgPT4ge1xuICAgIGxldCBiYXNlID0gcmF3LnRyaW0oKTtcbiAgICBpZiAoIWJhc2UpIHJldHVybjtcblxuICAgIGlmICghc3BsaXRJbmxpbmVTdWJwb2ludHMpIHtcbiAgICAgIG91dC5wdXNoKGJhc2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBwYXJ0cyA9IHNwbGl0SW5saW5lU2VnbWVudHMoYmFzZSlcbiAgICAgIC5tYXAoc2VnID0+IHNlZy5yZXBsYWNlKC9eXFxkezEsM31cXHMrW0EtWl1bQS1aXSsoPzpbIC1dW0EtWl1bQS1aXSspKi8sIFwiXCIpLnRyaW0oKSkgLy8gY29uc2VydmF0aXZlIGhlYWRlciBzY3J1YlxuICAgICAgLmZpbHRlcihCb29sZWFuKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBwYXJ0ID0gcGFydHNbaV07XG4gICAgICBpZiAoZml4SHlwaGVuYXRlZEJyZWFrcykgcGFydCA9IGZpeElubGluZUh5cGhlbnMocGFydCk7XG5cbiAgICAgIGxldCBwYXJzZWQgPSBwYXJzZUhlYWRpbmdTdGFydChwYXJ0KTtcbiAgICAgIGlmICghcGFyc2VkKSB7XG4gICAgICAgIG91dC5wdXNoKHBhcnQpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgeyB0b2tlbiwgbGFiZWwsIHJlc3QsIGRlbGltIH0gPSBwYXJzZWQ7XG4gICAgICBjb25zdCB7IGxldmVsLCBuZXh0Um9tLCBuZXh0QWxwaGFJZHggfSA9IGRlY2lkZUxldmVsKGxhYmVsLnJlcGxhY2UoL1suKV0kLywgXCJcIiksIGRlbGltLCBwcmV2Um9tYW4sIHByZXZBbHBoYUlkeCk7XG4gICAgICBwcmV2Um9tYW4gPSBuZXh0Um9tO1xuICAgICAgcHJldkFscGhhSWR4ID0gbmV4dEFscGhhSWR4O1xuXG4gICAgICBpZiAobGV2ZWwgPT09IFwiYnVsbGV0XCIpIHtcbiAgICAgICAgb3V0LnB1c2goYCR7Z2V0TWRQcmVmaXhGcm9tTGV2ZWwobGV2ZWwpfSAqICR7dG9rZW59ICR7cmVzdH1gLnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcmVmaXggPSBnZXRNZFByZWZpeEZyb21MZXZlbChsZXZlbCk7XG4gICAgICAgIG91dC5wdXNoKGAke3ByZWZpeH0gJHt0b2tlbn0gJHtyZXN0fWAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZm9yIChsZXQgcmF3IG9mIGxpbmVzKSB7XG4gICAgbGV0IGxpbmUgPSByYXcudHJpbSgpO1xuICAgIGlmICghbGluZSkgY29udGludWU7XG4gICAgaWYgKGRyb3BQdXJlUGFnZU51bWJlckxpbmVzICYmIC9eXFxkKyQvLnRlc3QobGluZSkpIGNvbnRpbnVlO1xuICAgIGlmIChmaXhIeXBoZW5hdGVkQnJlYWtzKSBsaW5lID0gZml4SW5saW5lSHlwaGVucyhsaW5lKTtcblxuICAgIC8vIElmIHByZXZpb3VzIGJ1ZmZlciBlbmRzIHdpdGggdmVyc2UgbWFya2VyLCBhIGxlYWRpbmcgbnVtYmVyIGlzIGEgdmVyc2UgXHUyMDE0IG5vdCBhIG5ldyBoZWFkaW5nLlxuICAgIGxldCBwYXJzZWQgPSBwYXJzZUhlYWRpbmdTdGFydChsaW5lKTtcbiAgICBjb25zdCBwcmV2RW5kc1dpdGhWZXJzZSA9IC9cXGJbdlZdezEsMn1cXC5cXHMqJC8udGVzdChidWYpO1xuICAgIGlmIChwYXJzZWQgJiYgL15cXGQrJC8udGVzdChwYXJzZWQubGFiZWwpICYmIHByZXZFbmRzV2l0aFZlcnNlKSB7XG4gICAgICBwYXJzZWQgPSBudWxsOyAvLyB0cmVhdCBhcyBjb250aW51YXRpb25cbiAgICB9XG5cbiAgICBpZiAocGFyc2VkKSB7XG4gICAgICBpZiAoYnVmKSBlbWl0QnVmZmVyKGJ1Zik7XG4gICAgICBidWYgPSBcIlwiO1xuXG4gICAgICBjb25zdCB7IHRva2VuLCBsYWJlbCwgcmVzdCwgZGVsaW0gfSA9IHBhcnNlZDtcbiAgICAgIGNvbnN0IHsgbGV2ZWwsIG5leHRSb20sIG5leHRBbHBoYUlkeCB9ID0gZGVjaWRlTGV2ZWwobGFiZWwsIGRlbGltLCBwcmV2Um9tYW4sIHByZXZBbHBoYUlkeCk7XG4gICAgICBwcmV2Um9tYW4gPSBuZXh0Um9tO1xuICAgICAgcHJldkFscGhhSWR4ID0gbmV4dEFscGhhSWR4O1xuXG4gICAgICBpZiAobGV2ZWwgPT09IFwiYnVsbGV0XCIpIHtcbiAgICAgICAgYnVmID0gYCR7Z2V0TWRQcmVmaXhGcm9tTGV2ZWwobGV2ZWwpfSAqICR7dG9rZW59ICR7cmVzdH1gLnRyaW0oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4RnJvbUxldmVsKGxldmVsKTtcbiAgICAgICAgYnVmID0gYCR7cHJlZml4fSAke3Rva2VufSAke3Jlc3R9YC50cmltKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ1ZiA9IGJ1ZiA/IGFwcGVuZFdpdGhXb3JkQnJlYWtGaXgoYnVmLCBsaW5lLCBmaXhIeXBoZW5hdGVkQnJlYWtzKSA6IGxpbmU7XG4gICAgfVxuICB9XG5cbiAgaWYgKGJ1ZikgZW1pdEJ1ZmZlcihidWYpO1xuICBsZXQgcmVzdWx0ID0gb3V0LmpvaW4ob3V0cHV0TGluZVNlcGFyYXRvcik7XG5cbiAgLy8gaW5zZXJ0IHZlcnNlIGxpbmtzIHVzaW5nIGxpbmtWZXJzZXNJblRleHRcbiAgaWYgKHNldHRpbmdzLmF1dG9MaW5rVmVyc2VzKSB7XG4gICAgcmVzdWx0ID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChyZXN1bHQsIHNldHRpbmdzKTtcbiAgfVxuXG4gIG5ldyBOb3RpY2UoXCJPdXRsaW5lIGZvcm1hdHRlZFwiICsgKHNldHRpbmdzLmF1dG9MaW5rVmVyc2VzID8gXCIgKyB2ZXJzZXMgbGlua2VkLlwiIDogXCIuXCIpKTtcblxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8vIGV4cG9ydCBpbnRlcmZhY2UgT3V0bGluZUZvcm1hdE9wdGlvbnMge1xuLy8gICAvKiogU3BsaXQgaW5saW5lIHN1YnBvaW50cyBsaWtlIFwiYS4gXHUyMDI2IGIuIFx1MjAyNiAoMSkgXHUyMDI2XCIgQUZURVIgY29sb24vc2VtaWNvbG9uIG9yIFwiXHUyMDE0di4gOTpcIiwgYW5kIGFsc28gYWZ0ZXIgc2VudGVuY2UtZW5kaW5nIFwiLlwiIGJlZm9yZSBhIG5ldyB0b2tlbiAqL1xuLy8gICBzcGxpdElubGluZVN1YnBvaW50cz86IGJvb2xlYW47ICAgICAgIC8vIGRlZmF1bHQ6IHRydWVcbi8vICAgLyoqIEZpeCBcImh5cGhlbiArIGxpbmUgYnJlYWtcIiB3b3JkIHNwbGl0cyB3aGVuIG1lcmdpbmcgbGluZXMgKGlsbHVzLSB0cmF0ZWQgXHUyMTkyIGlsbHVzdHJhdGVkKSAqL1xuLy8gICBmaXhIeXBoZW5hdGVkQnJlYWtzPzogYm9vbGVhbjsgICAgICAgIC8vIGRlZmF1bHQ6IHRydWVcbi8vICAgLyoqIERyb3AgbGluZXMgdGhhdCBhcmUgb25seSBhIHBhZ2UgbnVtYmVyIChlLmcuLCBcIjE0XCIpIGJlZm9yZSBtZXJnaW5nICovXG4vLyAgIGRyb3BQdXJlUGFnZU51bWJlckxpbmVzPzogYm9vbGVhbjsgICAgLy8gZGVmYXVsdDogZmFsc2Vcbi8vIH1cblxuLy8gLyoqIFN0cmljdCBwb3J0ICsgc2FmZSBpbXByb3ZlbWVudHMgKi9cbi8vIGV4cG9ydCBmdW5jdGlvbiBmb3JtYXRPdXRsaW5lVGV4dCh0ZXh0OiBzdHJpbmcsIG9wdHM6IE91dGxpbmVGb3JtYXRPcHRpb25zID0ge30pOiBzdHJpbmcge1xuLy8gICBjb25zdCB7XG4vLyAgICAgc3BsaXRJbmxpbmVTdWJwb2ludHMgPSB0cnVlLFxuLy8gICAgIGZpeEh5cGhlbmF0ZWRCcmVha3MgPSB0cnVlLFxuLy8gICAgIGRyb3BQdXJlUGFnZU51bWJlckxpbmVzID0gZmFsc2UsXG4vLyAgIH0gPSBvcHRzO1xuXG4vLyAgIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgvXFxyP1xcbi8pO1xuLy8gICBjb25zdCBvdXRwdXQ6IHN0cmluZ1tdID0gW107XG4vLyAgIGxldCBidWZmZXIgPSBcIlwiO1xuXG4vLyAgIGNvbnN0IGlzSGVhZGluZyA9IChsaW5lOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbi8vICAgICBjb25zdCBzID0gbGluZS50cmltKCk7XG4vLyAgICAgLy8gUm9tYW4gKEkuLCBJSS4sIFx1MjAyNiksIFVwcGVyY2FzZSAoQS4pLCBEZWNpbWFsICgxLiksIFBhcmVuICgoYSksICgxKSlcbi8vICAgICByZXR1cm4gL14oKEl7MSwzfXxJVnxWfFZJfFZJSXxWSUlJfElYfFh8WEl8WElJfFhJSUl8WElWfFhWKVtcXC5cXCldfFtBLVpdW1xcLlxcKV18XFxkK1xcLltcXCldP3xcXChbYS16QS1aMC05XStcXCkpLy50ZXN0KHMpO1xuLy8gICB9O1xuXG4vLyAgIGNvbnN0IGdldE1kUHJlZml4ID0gKGl0ZW06IHN0cmluZyk6IHN0cmluZyA9PiB7XG4vLyAgICAgaWYgKC9eKD86W0lWWExDRE1dKylbXFwuXFwpXS9pLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjXCI7ICAgLy8gUm9tYW5cbi8vICAgICBpZiAoL15cXHMqW0EtWl1bXFwuXFwpXS8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyMjI1wiOyAgICAgICAgLy8gQS5cbi8vICAgICBpZiAoL15cXHMqXFxkK1xcLi8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyMjIyNcIjsgICAgICAgICAgICAgLy8gMS5cbi8vICAgICBpZiAoL15cXHMqW2Etel1cXC4vLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjIyMjI1wiOyAgICAgICAgICAvLyBhLlxuLy8gICAgIGlmICgvXlxccypcXChcXGQrXFwpLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCJcIjsgICAgICAgICAgICAgICAgLy8gKDEpXG4vLyAgICAgaWYgKC9eXFxzKlxcKFthLXpdXFwpLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCJcIjsgICAgICAgICAgICAgIC8vIChhKVxuLy8gICAgIHJldHVybiBcIlwiO1xuLy8gICB9O1xuXG4vLyAgIC8vIC0tLS0gSHlwaGVuYXRlZCB3b3JkIHdyYXAgam9pbiAoXHUyMDI2IFwiaWxsdXMtXCIgKyBcInRyYXRlZFwiID0+IFwiaWxsdXN0cmF0ZWRcIilcbi8vICAgY29uc3QgVFJBSUxJTkdfSFlQSEVOX0FUX0VORCA9IC9bQS1aYS16XVtcXC1cXHUyMDEwXFx1MjAxMVxcdTIwMTJcXHUyMDEzXFx1MjAxNF1cXHMqJC87XG4vLyAgIGNvbnN0IGFwcGVuZFdpdGhXb3JkQnJlYWtGaXggPSAoYnVmOiBzdHJpbmcsIG5leHQ6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4vLyAgICAgaWYgKGZpeEh5cGhlbmF0ZWRCcmVha3MgJiYgVFJBSUxJTkdfSFlQSEVOX0FUX0VORC50ZXN0KGJ1ZikgJiYgL15bYS16XS8udGVzdChuZXh0KSkge1xuLy8gICAgICAgcmV0dXJuIGJ1Zi5yZXBsYWNlKC9bXFwtXFx1MjAxMFxcdTIwMTFcXHUyMDEyXFx1MjAxM1xcdTIwMTRdXFxzKiQvLCBcIlwiKSArIG5leHQ7XG4vLyAgICAgfVxuLy8gICAgIHJldHVybiAoYnVmICsgXCIgXCIgKyBuZXh0KS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKTtcbi8vICAgfTtcblxuLy8gICAvLyAtLS0tIE5vcm1hbGl6ZSBkaXZpZGVyIGRhc2hlcyBiZWZvcmUgdmVyc2UgcmVmcyB0byBhIHRpZ2h0IGVtLWRhc2g6IFwiXHUyMDE0XCIgKG5vIHNwYWNlcylcbi8vICAgZnVuY3Rpb24gbm9ybWFsaXplUmVmRGFzaGVzKHM6IHN0cmluZyk6IHN0cmluZyB7XG4vLyAgICAgLy8gYmVmb3JlIFwidi4gOVwiLCBcInYuIDk6XCIsIGV0Yy5cbi8vICAgICBzID0gcy5yZXBsYWNlKC8oXFxTKVxccypbXFwtXFx1MjAxMFxcdTIwMTFcXHUyMDEyXFx1MjAxM1xcdTIwMTRdXFxzKih2XFwuXFxzKlxcZCtbYS16XT86PykvZ2ksIFwiJDFcdTIwMTQkMlwiKTtcbi8vICAgICAvLyBiZWZvcmUgYm9vaytyZWZlcmVuY2UgbGlrZSBcIlMuIFMuIDQ6MTFhXCIsIFwiQ29sLiAxOjEyXCIsIFwiMSBKb2huIDE6NVwiXG4vLyAgICAgcyA9IHMucmVwbGFjZShcbi8vICAgICAgIC8oXFxTKVxccypbXFwtXFx1MjAxMFxcdTIwMTFcXHUyMDEyXFx1MjAxM1xcdTIwMTRdXFxzKigoWzEtM10/XFxzPyg/OltBLVpdW2EtekEtWl0qXFwuP3xbQS1aXVxcLikpKD86XFxzK1sxLTNdP1xccz8oPzpbQS1aXVthLXpBLVpdKlxcLj98W0EtWl1cXC4pKSpcXHMrXFxkKzpcXGQrW2Etel0/KS9nLFxuLy8gICAgICAgXCIkMVx1MjAxNCQyXCJcbi8vICAgICApO1xuLy8gICAgIHJldHVybiBzO1xuLy8gICB9XG5cbi8vICAgLy8gLS0tLSBTcGxpdCBpbmxpbmUgc3VicG9pbnRzICgxKSBhZnRlciA6LDsgb3IgZW0tZGFzaCBiZWZvcmUgXCJ2LiA5OlwiICAoMikgYWZ0ZXIgc2VudGVuY2UgXCIuXCIgd2hlbiBhIG5ldyB0b2tlbiBzdGFydHNcbi8vICAgLy8gS2VlcCBhYmJyZXZpYXRpb25zIGxpa2UgXCJTLiBTLlwiIGJ5IGZvcmJpZGRpbmcgc3BsaXQgd2hlbiBkb3QgaXMgcGFydCBvZiBhIG9uZS1sZXR0ZXIgYWJicmV2OiAoPzwhXFxiW0EtWmEtel1cXC4pXG4vLyAgIGNvbnN0IFRPS0VOX1NUQVJUX1NSQyA9IFN0cmluZy5yYXdgKD86W0lWWExDRE1dK1xcLnxbQS1aXVxcLnxbYS16XVxcLnxcXGQrXFwufCRiZWdpbjptYXRoOnRleHQkW2EtekEtWjAtOV0rJGVuZDptYXRoOnRleHQkKWA7XG4vLyAgIGNvbnN0IEFGVEVSX1BVTkNUX1NQTElUX1JFID0gbmV3IFJlZ0V4cChcbi8vICAgICBTdHJpbmcucmF3YChbOjshP118XHUyMDE0XFxzKnZcXC5cXHMqXFxkK1thLXpdPzopXFxzKyg/PWAgKyBUT0tFTl9TVEFSVF9TUkMgKyBTdHJpbmcucmF3YFxccyspYCxcbi8vICAgICBcImdpXCJcbi8vICAgKTtcbi8vICAgY29uc3QgQUZURVJfU0VOVF9UT0tFTl9TUExJVF9SRSA9IG5ldyBSZWdFeHAoXG4vLyAgICAgU3RyaW5nLnJhd2AoPzwhXFxiW0EtWmEtel1cXC4pXFwuXFxzKyg/PWAgKyBUT0tFTl9TVEFSVF9TUkMgKyBTdHJpbmcucmF3YFxccyspYCxcbi8vICAgICBcImdcIlxuLy8gICApO1xuXG4vLyAgIGNvbnN0IHNwbGl0SW5saW5lU2VnbWVudHMgPSAobGluZTogc3RyaW5nKTogc3RyaW5nW10gPT4ge1xuLy8gICAgIC8vIDEpIHNwbGl0IGFmdGVyIDosIDssICE/LCBhbmQgXHUyMDFDXHUyMDE0IHYuIDk6XHUyMDFEXG4vLyAgICAgbGV0IHMgPSBsaW5lLnJlcGxhY2UoQUZURVJfUFVOQ1RfU1BMSVRfUkUsIChfbSwgcDE6IHN0cmluZykgPT4gYCR7cDF9XFxuYCk7XG4vLyAgICAgLy8gMikgc3BsaXQgYWZ0ZXIgc2VudGVuY2UtZW5kaW5nIGRvdCB3aGVuIGEgdG9rZW4gKDEuLCBhLiwgKDEpLCBJLiwgQS4pIGZvbGxvd3Ncbi8vICAgICBzID0gcy5yZXBsYWNlKEFGVEVSX1NFTlRfVE9LRU5fU1BMSVRfUkUsIFwiLlxcblwiKTtcbi8vICAgICByZXR1cm4gcy5zcGxpdChcIlxcblwiKS5tYXAoeCA9PiB4LnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pO1xuLy8gICB9O1xuXG4vLyAgIGNvbnN0IGVtaXRCdWZmZXIgPSAoYnVmOiBzdHJpbmcpID0+IHtcbi8vICAgICBjb25zdCBiYXNlID0gbm9ybWFsaXplUmVmRGFzaGVzKGJ1Zi50cmltKCkpO1xuLy8gICAgIGlmICghYmFzZSkgcmV0dXJuO1xuXG4vLyAgICAgaWYgKCFzcGxpdElubGluZVN1YnBvaW50cykge1xuLy8gICAgICAgb3V0cHV0LnB1c2goYmFzZSk7XG4vLyAgICAgICByZXR1cm47XG4vLyAgICAgfVxuXG4vLyAgICAgY29uc3QgcGFydHMgPSBzcGxpdElubGluZVNlZ21lbnRzKGJhc2UpO1xuLy8gICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgIGxldCBwYXJ0ID0gcGFydHNbaV07XG4vLyAgICAgICBwYXJ0ID0gbm9ybWFsaXplUmVmRGFzaGVzKHBhcnQpO1xuXG4vLyAgICAgICBpZiAoaSA9PT0gMCkge1xuLy8gICAgICAgICBvdXRwdXQucHVzaChwYXJ0KTtcbi8vICAgICAgICAgY29udGludWU7XG4vLyAgICAgICB9XG5cbi8vICAgICAgIC8vIEFkZCBoZWFkaW5nIHByZWZpeCBmb3Igc3BsaXQtb2ZmIHN1YnBvaW50c1xuLy8gICAgICAgY29uc3QgbSA9IHBhcnQubWF0Y2goL14oKD86W0lWWExDRE1dK1xcLnxbQS1aXVxcLnxbYS16XVxcLnxcXGQrXFwufFxcKFthLXpBLVowLTldK1xcKSkpXFxzKyguKikkLyk7XG4vLyAgICAgICBpZiAobSkge1xuLy8gICAgICAgICBjb25zdCBpdGVtID0gbVsxXTtcbi8vICAgICAgICAgY29uc3QgY29udGVudCA9IG1bMl0gPz8gXCJcIjtcbi8vICAgICAgICAgY29uc3QgcHJlZml4ID0gZ2V0TWRQcmVmaXgoaXRlbSk7XG4vLyAgICAgICAgIG91dHB1dC5wdXNoKGAke3ByZWZpeH0gJHtpdGVtfSAke2NvbnRlbnR9YC50cmltKCkpO1xuLy8gICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgb3V0cHV0LnB1c2gocGFydCk7XG4vLyAgICAgICB9XG4vLyAgICAgfVxuLy8gICB9O1xuXG4vLyAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuLy8gICAgIGNvbnN0IHN0cmlwcGVkID0gbGluZS50cmltKCk7XG4vLyAgICAgaWYgKCFzdHJpcHBlZCkgY29udGludWU7XG4vLyAgICAgaWYgKGRyb3BQdXJlUGFnZU51bWJlckxpbmVzICYmIC9eXFxkKyQvLnRlc3Qoc3RyaXBwZWQpKSBjb250aW51ZTtcblxuLy8gICAgIGlmIChpc0hlYWRpbmcoc3RyaXBwZWQpKSB7XG4vLyAgICAgICBpZiAoYnVmZmVyKSBlbWl0QnVmZmVyKGJ1ZmZlcik7XG4vLyAgICAgICBidWZmZXIgPSBcIlwiO1xuXG4vLyAgICAgICBjb25zdCBmaXJzdFNwYWNlID0gc3RyaXBwZWQuaW5kZXhPZihcIiBcIik7XG4vLyAgICAgICBjb25zdCBpdGVtID0gZmlyc3RTcGFjZSA9PT0gLTEgPyBzdHJpcHBlZCA6IHN0cmlwcGVkLnNsaWNlKDAsIGZpcnN0U3BhY2UpO1xuLy8gICAgICAgY29uc3QgY29udGVudCA9IGZpcnN0U3BhY2UgPT09IC0xID8gXCJcIiA6IHN0cmlwcGVkLnNsaWNlKGZpcnN0U3BhY2UgKyAxKTtcbi8vICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4KGl0ZW0pO1xuLy8gICAgICAgYnVmZmVyID0gYCR7cHJlZml4fSAke2l0ZW19ICR7Y29udGVudH1gLnRyaW0oKTtcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgYnVmZmVyID0gYnVmZmVyID8gYXBwZW5kV2l0aFdvcmRCcmVha0ZpeChidWZmZXIsIHN0cmlwcGVkKSA6IHN0cmlwcGVkO1xuLy8gICAgIH1cbi8vICAgfVxuXG4vLyAgIGlmIChidWZmZXIpIGVtaXRCdWZmZXIoYnVmZmVyKTtcbi8vICAgcmV0dXJuIG91dHB1dC5qb2luKFwiXFxuXCIpO1xuLy8gfVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLVxuLy8gZXhwb3J0IGludGVyZmFjZSBPdXRsaW5lRm9ybWF0T3B0aW9ucyB7XG4vLyAgIC8qKiBTcGxpdCBpbmxpbmUgc3VicG9pbnRzIGxpa2UgXCJhLiBcdTIwMjYgYi4gXHUyMDI2ICgxKSBcdTIwMjZcIiBBRlRFUiBjb2xvbi9zZW1pY29sb24gb3IgXCJcdTIwMTR2LiA5OlwiICovXG4vLyAgIHNwbGl0SW5saW5lU3VicG9pbnRzPzogYm9vbGVhbjsgICAgICAgLy8gZGVmYXVsdDogdHJ1ZVxuLy8gICAvKiogRml4IFwiaHlwaGVuICsgbGluZSBicmVha1wiIHdvcmQgc3BsaXRzIHdoZW4gbWVyZ2luZyBsaW5lcyAoaWxsdXMtIHRyYXRlZCBcdTIxOTIgaWxsdXN0cmF0ZWQpICovXG4vLyAgIGZpeEh5cGhlbmF0ZWRCcmVha3M/OiBib29sZWFuOyAgICAgICAgLy8gZGVmYXVsdDogdHJ1ZVxuLy8gICAvKiogRHJvcCBsaW5lcyB0aGF0IGFyZSBvbmx5IGEgcGFnZSBudW1iZXIgKGUuZy4sIFwiMTRcIikgYmVmb3JlIG1lcmdpbmcgKi9cbi8vICAgZHJvcFB1cmVQYWdlTnVtYmVyTGluZXM/OiBib29sZWFuOyAgICAvLyBkZWZhdWx0OiBmYWxzZVxuLy8gfVxuXG4vLyAvKiogU3RyaWN0IHBvcnQgb2YgeW91ciBQeXRob24gcGx1cyBTQUZFIG9wdC1pbnMgKi9cbi8vIGV4cG9ydCBmdW5jdGlvbiBmb3JtYXRPdXRsaW5lVGV4dCh0ZXh0OiBzdHJpbmcsIG9wdHM6IE91dGxpbmVGb3JtYXRPcHRpb25zID0ge30pOiBzdHJpbmcge1xuLy8gICBjb25zdCB7XG4vLyAgICAgc3BsaXRJbmxpbmVTdWJwb2ludHMgPSB0cnVlLFxuLy8gICAgIGZpeEh5cGhlbmF0ZWRCcmVha3MgPSB0cnVlLFxuLy8gICAgIGRyb3BQdXJlUGFnZU51bWJlckxpbmVzID0gZmFsc2UsXG4vLyAgIH0gPSBvcHRzO1xuXG4vLyAgIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgvXFxyP1xcbi8pO1xuLy8gICBjb25zdCBvdXRwdXQ6IHN0cmluZ1tdID0gW107XG4vLyAgIGxldCBidWZmZXIgPSBcIlwiO1xuXG4vLyAgIGNvbnN0IGlzSGVhZGluZyA9IChsaW5lOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbi8vICAgICBjb25zdCBzID0gbGluZS50cmltKCk7XG4vLyAgICAgLy8gXigoUm9tYW4pfFtBLVpdLnxkaWdpdHMufChwYXJlbikpXG4vLyAgICAgcmV0dXJuIC9eKChJezEsM318SVZ8VnxWSXxWSUl8VklJSXxJWHxYfFhJfFhJSXxYSUlJfFhJVnxYVilbXFwuXFwpXXxbQS1aXVtcXC5cXCldfFxcZCtcXC5bXFwpXT98XFwoW2EtekEtWjAtOV0rXFwpKS8udGVzdChzKTtcbi8vICAgfTtcblxuLy8gICBjb25zdCBnZXRNZFByZWZpeCA9IChpdGVtOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuLy8gICAgIGlmICgvXihJezEsM318SVZ8VnxWSXxWSUl8VklJSXxJWHxYfFhJfFhJSXxYSUlJfFhJVnxYVilbXFwuXFwpXS8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyNcIjtcbi8vICAgICBlbHNlIGlmICgvXlxccypbQS1aXVtcXC5cXCldLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCIjIyMjXCI7XG4vLyAgICAgZWxzZSBpZiAoL15cXHMqXFxkK1xcLi8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyMjIyNcIjtcbi8vICAgICBlbHNlIGlmICgvXlxccypbYS16XVxcLi8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyMjIyMjXCI7XG4vLyAgICAgZWxzZSBpZiAoL15cXHMqXFwoXFxkK1xcKS8udGVzdChpdGVtKSkgcmV0dXJuIFwiXCI7XG4vLyAgICAgZWxzZSBpZiAoL15cXHMqXFwoW2Etel1cXCkvLnRlc3QoaXRlbSkpIHJldHVybiBcIlwiO1xuLy8gICAgIGVsc2UgcmV0dXJuIFwiXCI7XG4vLyAgIH07XG5cbi8vICAgLy8gLS0tLSBIeXBoZW5hdGVkIHdvcmQgd3JhcCBqb2luIChcdTIwMjYgXCJpbGx1cy1cIiArIFwidHJhdGVkXCIgPT4gXCJpbGx1c3RyYXRlZFwiKVxuLy8gICBjb25zdCBUUkFJTElOR19IWVBIRU5fQVRfRU5EID0gL1tBLVphLXpdW1xcLVxcdTIwMTBcXHUyMDExXFx1MjAxMlxcdTIwMTNcXHUyMDE0XVxccyokLzsgLy8gLSwgXHUyMDEwLCAtLCBcdTIwMTIsIFx1MjAxMywgXHUyMDE0XG4vLyAgIGNvbnN0IGFwcGVuZFdpdGhXb3JkQnJlYWtGaXggPSAoYnVmOiBzdHJpbmcsIG5leHQ6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4vLyAgICAgaWYgKGZpeEh5cGhlbmF0ZWRCcmVha3MgJiYgVFJBSUxJTkdfSFlQSEVOX0FUX0VORC50ZXN0KGJ1ZikgJiYgL15bYS16XS8udGVzdChuZXh0KSkge1xuLy8gICAgICAgcmV0dXJuIGJ1Zi5yZXBsYWNlKC9bXFwtXFx1MjAxMFxcdTIwMTFcXHUyMDEyXFx1MjAxM1xcdTIwMTRdXFxzKiQvLCBcIlwiKSArIG5leHQ7XG4vLyAgICAgfVxuLy8gICAgIHJldHVybiAoYnVmICsgXCIgXCIgKyBuZXh0KS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKTtcbi8vICAgfTtcblxuLy8gICAvLyAtLS0tIE5vcm1hbGl6ZSBkaXZpZGVyIGRhc2hlcyBiZWZvcmUgdmVyc2UgcmVmcyB0byBhIHRpZ2h0IGVtLWRhc2g6IFwiXHUyMDE0XCIgKG5vIHNwYWNlcylcbi8vICAgZnVuY3Rpb24gbm9ybWFsaXplUmVmRGFzaGVzKHM6IHN0cmluZyk6IHN0cmluZyB7XG4vLyAgICAgLy8gQ2FzZSAxOiBiZWZvcmUgXCJ2LiA5XCIsIFwidi4gOTpcIiwgXCJ2LiA5YTpcIlxuLy8gICAgIHMgPSBzLnJlcGxhY2UoXG4vLyAgICAgICAvKFxcUylcXHMqW1xcLVxcdTIwMTBcXHUyMDExXFx1MjAxMlxcdTIwMTNcXHUyMDE0XVxccyoodlxcLlxccypcXGQrW2Etel0/Oj8pL2dpLFxuLy8gICAgICAgXCIkMVx1MjAxNCQyXCJcbi8vICAgICApO1xuXG4vLyAgICAgLy8gQ2FzZSAyOiBiZWZvcmUgYm9vaytyZWZlcmVuY2UgbGlrZSBcIlMuIFMuIDQ6MTFhXCIsIFwiQ29sLiAxOjEyXCIsIFwiMSBKb2huIDE6NVwiXG4vLyAgICAgLy8gU3VwcG9ydHMgY2hhaW5zIGxpa2UgXCIxIFRpbS5cIiBvciBcIlNvbmcgb2YgU29uZ3NcIiBhYmJyZXZpYXRpb25zIHdpdGggZG90cy5cbi8vICAgICBzID0gcy5yZXBsYWNlKFxuLy8gICAgICAgLyhcXFMpXFxzKltcXC1cXHUyMDEwXFx1MjAxMVxcdTIwMTJcXHUyMDEzXFx1MjAxNF1cXHMqKChbMS0zXT9cXHM/KD86W0EtWl1bYS16QS1aXSpcXC4/fFtBLVpdXFwuKSkoPzpcXHMrWzEtM10/XFxzPyg/OltBLVpdW2EtekEtWl0qXFwuP3xbQS1aXVxcLikpKlxccytcXGQrOlxcZCtbYS16XT8pL2csXG4vLyAgICAgICBcIiQxXHUyMDE0JDJcIlxuLy8gICAgICk7XG5cbi8vICAgICByZXR1cm4gcztcbi8vICAgfVxuXG4vLyAgIC8vIC0tLS0gU3BsaXQgaW5saW5lIHN1YnBvaW50cyBPTkxZIGFmdGVyIFwiOlwiIG9yIFwiO1wiIChvciBcIlx1MjAxNHYuIDk6XCIpLCBuZXZlciBhZnRlciBcIi5cIlxuLy8gICAvLyBUaGlzIGtlZXBzIFwiUy4gUy4gNDoxMWFcIiB0b2dldGhlci5cbi8vICAgY29uc3QgQUZURVJfUFVOQ1RfU1BMSVRfUkUgPVxuLy8gICAgIC8oWzo7IT9dfFx1MjAxNFxccyp2XFwuXFxzKlxcZCtbYS16XT86KVxccysoPz0oPzpbYS16XVxcLnxbQS1aXVxcLnxcXGQrXFwufFxcKFthLXowLTldK1xcKSlcXHMrKS9naTtcblxuLy8gICBjb25zdCBzcGxpdElubGluZUFmdGVyUHVuY3QgPSAobGluZTogc3RyaW5nKTogc3RyaW5nW10gPT4ge1xuLy8gICAgIGNvbnN0IHdpdGhCcmVha3MgPSBsaW5lLnJlcGxhY2UoQUZURVJfUFVOQ1RfU1BMSVRfUkUsIChfbSwgcDE6IHN0cmluZykgPT4gYCR7cDF9XFxuYCk7XG4vLyAgICAgcmV0dXJuIHdpdGhCcmVha3Muc3BsaXQoXCJcXG5cIikubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihCb29sZWFuKTtcbi8vICAgfTtcblxuLy8gICBjb25zdCBlbWl0QnVmZmVyID0gKGJ1Zjogc3RyaW5nKSA9PiB7XG4vLyAgICAgY29uc3QgYmFzZSA9IG5vcm1hbGl6ZVJlZkRhc2hlcyhidWYudHJpbSgpKTtcbi8vICAgICBpZiAoIWJhc2UpIHJldHVybjtcblxuLy8gICAgIGlmICghc3BsaXRJbmxpbmVTdWJwb2ludHMpIHtcbi8vICAgICAgIG91dHB1dC5wdXNoKGJhc2UpO1xuLy8gICAgICAgcmV0dXJuO1xuLy8gICAgIH1cblxuLy8gICAgIGNvbnN0IHBhcnRzID0gc3BsaXRJbmxpbmVBZnRlclB1bmN0KGJhc2UpO1xuLy8gICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgIGxldCBwYXJ0ID0gcGFydHNbaV07XG4vLyAgICAgICBwYXJ0ID0gbm9ybWFsaXplUmVmRGFzaGVzKHBhcnQpOyAvLyBlbnN1cmUgZWFjaCBwaWVjZSBoYXMgdGlnaHQgZW0tZGFzaCB0byByZWZzXG5cbi8vICAgICAgIGlmIChpID09PSAwKSB7XG4vLyAgICAgICAgIC8vIGZpcnN0IHBpZWNlIGlzIGFscmVhZHkgcmVuZGVyZWQgKGUuZy4sIFwiIyMjIyBBLiAuLi5cIikgb3IgcGxhaW4gdGV4dFxuLy8gICAgICAgICBvdXRwdXQucHVzaChwYXJ0KTtcbi8vICAgICAgICAgY29udGludWU7XG4vLyAgICAgICB9XG5cbi8vICAgICAgIC8vIEZvciBzcGxpdC1vZmYgc3VicG9pbnRzLCBhZGQgaGVhZGluZyBwcmVmaXggYmFzZWQgb24gdG9rZW5cbi8vICAgICAgIGNvbnN0IG0gPSBwYXJ0Lm1hdGNoKC9eKCg/OltBLVpdXFwuKXwoPzpbYS16XVxcLil8KD86XFxkK1xcLil8XFwoW2EtekEtWjAtOV0rXFwpKVxccysoLiopJC8pO1xuLy8gICAgICAgaWYgKG0pIHtcbi8vICAgICAgICAgY29uc3QgaXRlbSA9IG1bMV07XG4vLyAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBtWzJdID8/IFwiXCI7XG4vLyAgICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4KGl0ZW0pO1xuLy8gICAgICAgICBvdXRwdXQucHVzaChgJHtwcmVmaXh9ICR7aXRlbX0gJHtjb250ZW50fWAudHJpbSgpKTtcbi8vICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgIG91dHB1dC5wdXNoKHBhcnQpO1xuLy8gICAgICAgfVxuLy8gICAgIH1cbi8vICAgfTtcblxuLy8gICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbi8vICAgICBjb25zdCBzdHJpcHBlZCA9IGxpbmUudHJpbSgpO1xuLy8gICAgIGlmICghc3RyaXBwZWQpIGNvbnRpbnVlO1xuLy8gICAgIGlmIChkcm9wUHVyZVBhZ2VOdW1iZXJMaW5lcyAmJiAvXlxcZCskLy50ZXN0KHN0cmlwcGVkKSkgY29udGludWU7IC8vIGRyb3AgXCIxNFwiLCBcIjE1XCIsIC4uLlxuXG4vLyAgICAgaWYgKGlzSGVhZGluZyhzdHJpcHBlZCkpIHtcbi8vICAgICAgIGlmIChidWZmZXIpIGVtaXRCdWZmZXIoYnVmZmVyKTtcbi8vICAgICAgIGJ1ZmZlciA9IFwiXCI7XG5cbi8vICAgICAgIC8vIHNwbGl0KG1heHNwbGl0PTEpXG4vLyAgICAgICBjb25zdCBmaXJzdFNwYWNlID0gc3RyaXBwZWQuaW5kZXhPZihcIiBcIik7XG4vLyAgICAgICBjb25zdCBpdGVtID0gZmlyc3RTcGFjZSA9PT0gLTEgPyBzdHJpcHBlZCA6IHN0cmlwcGVkLnNsaWNlKDAsIGZpcnN0U3BhY2UpO1xuLy8gICAgICAgY29uc3QgY29udGVudCA9IGZpcnN0U3BhY2UgPT09IC0xID8gXCJcIiA6IHN0cmlwcGVkLnNsaWNlKGZpcnN0U3BhY2UgKyAxKTtcbi8vICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4KGl0ZW0pO1xuLy8gICAgICAgYnVmZmVyID0gYCR7cHJlZml4fSAke2l0ZW19ICR7Y29udGVudH1gLnRyaW0oKTtcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgYnVmZmVyID0gYnVmZmVyID8gYXBwZW5kV2l0aFdvcmRCcmVha0ZpeChidWZmZXIsIHN0cmlwcGVkKSA6IHN0cmlwcGVkO1xuLy8gICAgIH1cbi8vICAgfVxuXG4vLyAgIGlmIChidWZmZXIpIGVtaXRCdWZmZXIoYnVmZmVyKTtcbi8vICAgcmV0dXJuIG91dHB1dC5qb2luKFwiXFxuXCIpO1xuLy8gfVxuXG5cbi8vIGV4cG9ydCBmdW5jdGlvbiBmb3JtYXRPdXRsaW5lVGV4dCh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuLy8gICBjb25zdCBsaW5lcyA9IHRleHQuc3BsaXQoL1xccj9cXG4vKTtcbi8vICAgdGV4dCA9IHNwbGl0SW5saW5lSGVhZGluZ3ModGV4dCk7XG5cbi8vICAgY29uc3Qgb3V0cHV0OiBzdHJpbmdbXSA9IFtdO1xuLy8gICBsZXQgYnVmZmVyID0gXCJcIjtcblxuLy8gICBjb25zdCBpc0hlYWRpbmcgPSAobGluZTogc3RyaW5nKTogYm9vbGVhbiA9PiB7XG4vLyAgICAgY29uc3QgcyA9IGxpbmUudHJpbSgpO1xuLy8gICAgIHJldHVybiAvXigoSXsxLDN9fElWfFZ8Vkl8VklJfFZJSUl8SVh8WHxYSXxYSUl8WElJSXxYSVZ8WFZ8WFZJfFhWSUl8WFZJSUl8WElYfFhYKVtcXC5cXCldIHwgW0EgLSBaXVtcXC5cXCldfFxcZCArXFwuW1xcKV0gP3xcXChbYSAtIHpBIC0gWjAgLSA5XSArXFwpKS8udGVzdChzKTtcbi8vICAgfTtcblxuLy8gICBjb25zdCBnZXRNZFByZWZpeCA9IChpdGVtOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuLy8gICAgIGlmICgvXihJezEsM318SVZ8VnxWSXxWSUl8VklJSXxJWHxYfFhJfFhJSXxYSUlJfFhJVnxYVnxYVkl8WFZJSXxYVklJSXxYSVh8WFgpW1xcLlxcKV0vLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjXCI7XG4vLyAgICAgZWxzZSBpZiAoL15cXHMqW0EtWl1bXFwuXFwpXS8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyMjI1wiO1xuLy8gICAgIGVsc2UgaWYgKC9eXFxzKlxcZCtcXC4vLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjIyMjXCI7XG4vLyAgICAgZWxzZSBpZiAoL15cXHMqW2Etel1cXC4vLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjIyMjI1wiO1xuLy8gICAgIGVsc2UgaWYgKC9eXFxzKlxcKFxcZCtcXCkvLnRlc3QoaXRlbSkpIHJldHVybiBcIlwiO1xuLy8gICAgIGVsc2UgaWYgKC9eXFxzKlxcKFthLXpdXFwpLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCJcIjtcbi8vICAgICBlbHNlIHJldHVybiBcIlwiO1xuLy8gICB9O1xuXG4vLyAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuLy8gICAgIGNvbnN0IHN0cmlwcGVkID0gbGluZS50cmltKCk7XG4vLyAgICAgaWYgKCFzdHJpcHBlZCkgY29udGludWU7XG5cbi8vICAgICBpZiAoaXNIZWFkaW5nKHN0cmlwcGVkKSkge1xuLy8gICAgICAgaWYgKGJ1ZmZlcikgb3V0cHV0LnB1c2goYnVmZmVyLnRyaW0oKSk7XG4vLyAgICAgICBidWZmZXIgPSBcIlwiO1xuXG4vLyAgICAgICBjb25zdCBwYXJ0cyA9IHN0cmlwcGVkLnNwbGl0KC9cXHMrLywgMSArIDEpOyAvLyBtYXhzcGxpdD0xXG4vLyAgICAgICBjb25zdCBpdGVtID0gcGFydHNbMF07XG4vLyAgICAgICBjb25zdCBjb250ZW50ID0gcGFydHMubGVuZ3RoID4gMSA/IHBhcnRzWzFdIDogXCJcIjtcbi8vICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4KGl0ZW0pO1xuLy8gICAgICAgYnVmZmVyID0gYCR7cHJlZml4fSAke2l0ZW19ICR7Y29udGVudH1gLnRyaW0oKTtcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgYnVmZmVyICs9IGAgJHtzdHJpcHBlZH1gO1xuLy8gICAgIH1cbi8vICAgfVxuXG4vLyAgIGlmIChidWZmZXIpIG91dHB1dC5wdXNoKGJ1ZmZlci50cmltKCkpO1xuLy8gICByZXR1cm4gb3V0cHV0LmpvaW4oXCJcXG5cIik7XG4vLyB9XG5cbi8vIC8vIEluc2VydCBuZXdsaW5lcyBiZWZvcmUgaW5saW5lIHRva2VucyB0aGF0IGxvb2sgbGlrZSBuZXcgaXRlbXMuXG4vLyAvLyBBdm9pZHMgc3BsaXR0aW5nIGNvbW1vbiBhYmJyZXZpYXRpb25zIGxpa2UgXCJ2LlwiIGJ5IGV4Y2x1ZGluZyBpdC5cbi8vIGZ1bmN0aW9uIHNwbGl0SW5saW5lSGVhZGluZ3ModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbi8vICAgcmV0dXJuIHRleHRcbi8vICAgICAvLyBCZWZvcmUgQS4gLyBCLiAvIEMuXG4vLyAgICAgLnJlcGxhY2UoL1xccysoPz0oPzpbQS1aXVxcLilcXHMpL2csIFwiXFxuXCIpXG4vLyAgICAgLy8gQmVmb3JlIGEuIC8gYi4gLyBjLiAgKGJ1dCBOT1Qgdi4pXG4vLyAgICAgLnJlcGxhY2UoL1xccysoPz0oPzooPyF2XFwuKVthLXpdXFwuKVxccykvZywgXCJcXG5cIilcbi8vICAgICAvLyBCZWZvcmUgMS4gLyAyLiAvIDMuXG4vLyAgICAgLnJlcGxhY2UoL1xccysoPz0oPzpcXGQrXFwuKVxccykvZywgXCJcXG5cIilcbi8vICAgICAvLyBCZWZvcmUgKGEpIC8gKDEpXG4vLyAgICAgLnJlcGxhY2UoL1xccysoPz1cXChbYS16MC05XStcXClcXHMpL2dpLCBcIlxcblwiKTtcbi8vIH1cblxuXG4vLyAvLyBzcmMvbGliL291dGxpbmVVdGlscy50c1xuXG4vLyAvKiogU3RyaWN0IDE6MSBUeXBlU2NyaXB0IHBvcnQgb2YgeW91ciBQeXRob24gYGZvcm1hdF9vdXRsaW5lYCAqL1xuLy8gZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdE91dGxpbmVUZXh0KHRleHQ6IHN0cmluZywgb3B0cz86IHsgc3BsaXRJbmxpbmVBZnRlckNvbG9uPzogYm9vbGVhbiB9KTogc3RyaW5nIHtcbi8vICAgLy8gT3B0aW9uYWw6IHNwbGl0IHN1YnBvaW50cyBsaWtlIFwiYS5cIiwgXCJiLlwiLCBcIigxKVwiIHRoYXQgYXBwZWFyIEFGVEVSIGEgY29sb24gb3Igc2VtaWNvbG9uLlxuLy8gICAvLyBUaGlzIGlzIE9GRiBieSBkZWZhdWx0IHNvIHdlIGRvbid0IGJyZWFrIFwiQ29sLlwiLCBcIkVwaC5cIiwgZXRjLlxuLy8gICAvLyBpZiAob3B0cz8uc3BsaXRJbmxpbmVBZnRlckNvbG9uKSB7XG4vLyAgIHRleHQgPSBzcGxpdElubGluZUhlYWRpbmdzQWZ0ZXJDb2xvbih0ZXh0KTtcbi8vICAgLy8gfVxuXG4vLyAgIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgvXFxyP1xcbi8pO1xuLy8gICBjb25zdCBvdXRwdXQ6IHN0cmluZ1tdID0gW107XG4vLyAgIGxldCBidWZmZXIgPSBcIlwiO1xuXG4vLyAgIGNvbnN0IGlzSGVhZGluZyA9IChsaW5lOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbi8vICAgICBjb25zdCBzID0gbGluZS50cmltKCk7XG4vLyAgICAgLy8gXigoUm9tYW4pfFtBLVpdLnxkaWdpdHMufChwYXJlbikpXG4vLyAgICAgcmV0dXJuIC9eKChJezEsM318SVZ8VnxWSXxWSUl8VklJSXxJWHxYfFhJfFhJSXxYSUlJfFhJVnxYVnxYVkl8WFZJSXxYVklJSXxYSVh8WFgpW1xcLlxcKV18W0EtWl1bXFwuXFwpXXxcXGQrXFwuW1xcKV0/fFxcKFthLXpBLVowLTldK1xcKSkvLnRlc3Qocyk7XG4vLyAgIH07XG5cbi8vICAgY29uc3QgZ2V0TWRQcmVmaXggPSAoaXRlbTogc3RyaW5nKTogc3RyaW5nID0+IHtcbi8vICAgICBpZiAoL14oSXsxLDN9fElWfFZ8Vkl8VklJfFZJSUl8SVh8WHxYSXxYSUl8WElJSXxYSVZ8WFZ8WFZJfFhWSUl8WFZJSUl8WElYfFhYKVtcXC5cXCldLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCIjI1wiO1xuLy8gICAgIGVsc2UgaWYgKC9eXFxzKltBLVpdW1xcLlxcKV0vLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjIyNcIjtcbi8vICAgICBlbHNlIGlmICgvXlxccypcXGQrXFwuLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCIjIyMjI1wiO1xuLy8gICAgIGVsc2UgaWYgKC9eXFxzKlthLXpdXFwuLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCIjIyMjIyNcIjtcbi8vICAgICBlbHNlIGlmICgvXlxccypcXChcXGQrXFwpLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCJcIjtcbi8vICAgICBlbHNlIGlmICgvXlxccypcXChbYS16XVxcKS8udGVzdChpdGVtKSkgcmV0dXJuIFwiXCI7XG4vLyAgICAgZWxzZSByZXR1cm4gXCJcIjtcbi8vICAgfTtcblxuLy8gICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbi8vICAgICBjb25zdCBzdHJpcHBlZCA9IGxpbmUudHJpbSgpO1xuLy8gICAgIGlmICghc3RyaXBwZWQpIGNvbnRpbnVlO1xuXG4vLyAgICAgaWYgKGlzSGVhZGluZyhzdHJpcHBlZCkpIHtcbi8vICAgICAgIGlmIChidWZmZXIpIG91dHB1dC5wdXNoKGJ1ZmZlci50cmltKCkpO1xuLy8gICAgICAgYnVmZmVyID0gXCJcIjtcblxuLy8gICAgICAgLy8gc3BsaXQobWF4c3BsaXQ9MSlcbi8vICAgICAgIGNvbnN0IGZpcnN0U3BhY2UgPSBzdHJpcHBlZC5pbmRleE9mKFwiIFwiKTtcbi8vICAgICAgIGNvbnN0IGl0ZW0gPSBmaXJzdFNwYWNlID09PSAtMSA/IHN0cmlwcGVkIDogc3RyaXBwZWQuc2xpY2UoMCwgZmlyc3RTcGFjZSk7XG4vLyAgICAgICBjb25zdCBjb250ZW50ID0gZmlyc3RTcGFjZSA9PT0gLTEgPyBcIlwiIDogc3RyaXBwZWQuc2xpY2UoZmlyc3RTcGFjZSArIDEpO1xuXG4vLyAgICAgICBjb25zdCBwcmVmaXggPSBnZXRNZFByZWZpeChpdGVtKTtcbi8vICAgICAgIGJ1ZmZlciA9IGAke3ByZWZpeH0gJHtpdGVtfSAke2NvbnRlbnR9YC50cmltKCk7XG4vLyAgICAgfSBlbHNlIHtcbi8vICAgICAgIGJ1ZmZlciArPSBgICR7c3RyaXBwZWR9YDtcbi8vICAgICB9XG4vLyAgIH1cblxuLy8gICBpZiAoYnVmZmVyKSBvdXRwdXQucHVzaChidWZmZXIudHJpbSgpKTtcbi8vICAgcmV0dXJuIG91dHB1dC5qb2luKFwiXFxuXCIpO1xuLy8gfVxuXG4vKipcbiAqIFNBRkVMWSBzcGxpdCBpbmxpbmUgc3VicG9pbnRzIE9OTFkgd2hlbiB0aGV5IGNvbWUgcmlnaHQgYWZ0ZXIgYSBjb2xvbi9zZW1pY29sb24sXG4gKiBlLmcuIFx1MjAxQ1x1MjAyNiB2LiA5OiBhLiBGdWxsbmVzcyBcdTIwMjYgYi4gV2hlbiBcdTIwMjYgMS4gU29tZXRoaW5nIFx1MjAyNlx1MjAxRFxuICogVGhpcyB3aWxsIE5PVCBzcGxpdCBcdTIwMThDb2wuXHUyMDE5IC8gXHUyMDE4RXBoLlx1MjAxOSBiZWNhdXNlIHRob3NlIGFyZW5cdTIwMTl0IHByZWNlZGVkIGJ5ICc6JyBvciAnOycuXG4gKi9cbmZ1bmN0aW9uIHNwbGl0SW5saW5lSGVhZGluZ3NBZnRlckNvbG9uKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vIEluc2VydCBhIG5ld2xpbmUgYWZ0ZXIgXCI6XCIgb3IgXCI7XCIgQkVGT1JFIGEgdG9rZW4gdGhhdCBsb29rcyBsaWtlIGEgc3VicG9pbnQuXG4gIC8vIFRva2VucyBzdXBwb3J0ZWQ6ICBhLiAgYi4gIDEuICAxMC4gIChhKSAgKDEpXG4gIC8vIEtlZXAgdGhlIHB1bmN0dWF0aW9uICg6JDEpIGFuZCBhZGQgdGhlIG5ld2xpbmUgaW4gJDIuXG4gIHJldHVybiB0ZXh0XG4gICAgLy8gQWZ0ZXIgXCI6XCIgb3IgXCI7XCIgdGhlbiBzcGFjZShzKSAtPiBiZWZvcmUgW2Etel0uICAoZXhjbHVkZSB2LiBieSBub3QgbmVlZGVkOiB3ZSBvbmx5IHNwbGl0IGFmdGVyIFwiOlwiIC8gXCI7XCIpXG4gICAgLnJlcGxhY2UoLyhbOjtdKVxccysoPz0oW2Etel1cXC58XFwoXFx3K1xcKXxcXGQrXFwuKSkvZywgXCIkMVxcblwiKVxuICAgIC8vIEFsc28gc3VwcG9ydCBlbS9lbiBkYXNoIFwiXHUyMDE0XCIgZm9sbG93ZWQgYnkgdmVyc2UgXCJ2LlwiIHdpdGggbnVtYmVyLCB0aGVuIGNvbG9uOiBcIlx1MjAxNHYuIDk6XCIgYSBjb21tb24gcGF0dGVyblxuICAgIC5yZXBsYWNlKC8oXHUyMDE0XFxzKnZcXC5cXHMqXFxkK1thLXpdPzopXFxzKyg/PShbYS16XVxcLnxcXChcXHcrXFwpfFxcZCtcXC4pKS9naSwgXCIkMVxcblwiKTtcbn1cblxuXG5cblxuXG4vLyAvLyA9PT09PT09PT09PT09PT09PT09PT1cbi8vIC8vIE51bWJlcmluZyBkZXRlY3Rpb25cbi8vIC8vID09PT09PT09PT09PT09PT09PT09PVxuLy8gY29uc3QgUk9NQU4gPSAvXihJezEsM318SVZ8VnxWSXxWSUl8VklJSXxJWHxYfFhJfFhJSXxYSUlJfFhJVnxYVilbXFwuXFwpXVxccy87XG4vLyBjb25zdCBVUFBFUiA9IC9eW0EtWl1bXFwuXFwpXVxccy87XG4vLyBjb25zdCBMT1dFUiA9IC9eW2Etel1bXFwuXFwpXVxccy87ICAgICAgICAgICAgICAvLyBlLmcuLCBcImEuIFwiXG4vLyBjb25zdCBOVU1FUklDID0gL15cXGQrW1xcLlxcKV1cXHMvOyAgICAgICAgICAgICAgLy8gZS5nLiwgXCIxLiBcIiBvciBcIjEwKSBcIlxuLy8gY29uc3QgUEFSRU4gPSAvXlxcKFthLXpBLVowLTldK1xcKVxccy87ICAgICAgICAgLy8gZS5nLiwgXCIoYSkgXCIgXCIoMSkgXCJcblxuLy8gLyoqIHRydWUgaWZmIHRoZSBsaW5lIGJlZ2lucyBhIG5ldyBudW1iZXJlZCBpdGVtICovXG4vLyBleHBvcnQgZnVuY3Rpb24gc3RhcnRzV2l0aE51bWJlcmluZyhsaW5lOiBzdHJpbmcpOiBib29sZWFuIHtcbi8vICAgcmV0dXJuIFJPTUFOLnRlc3QobGluZSkgfHwgVVBQRVIudGVzdChsaW5lKSB8fCBMT1dFUi50ZXN0KGxpbmUpIHx8IE5VTUVSSUMudGVzdChsaW5lKSB8fCBQQVJFTi50ZXN0KGxpbmUpO1xuLy8gfVxuXG4vLyAvKiogcmVtb3ZlIHBhZ2UtbnVtYmVyLW9ubHkgbGluZXMgYW5kIHRyaW0gd2hpdGVzcGFjZSAqL1xuLy8gZnVuY3Rpb24gcHJlcHJvY2Vzc0xpbmVzKGlucHV0OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4vLyAgIHJldHVybiBpbnB1dFxuLy8gICAgIC5zcGxpdCgvXFxyP1xcbi8pXG4vLyAgICAgLm1hcChsID0+IGwudHJpbSgpKVxuLy8gICAgIC8vIC5maWx0ZXIobCA9PiBsLmxlbmd0aCA+IDAgJiYgIS9eXFxkKyQvLnRlc3QobCkpOyAvLyBkcm9wIHB1cmUgcGFnZSBudW1iZXJzIGxpa2UgXCIxNFwiXG4vLyB9XG5cbi8vIC8qKiBqb2luIHNvZnQgaHlwaGVuYXRlZCBicmVha3Mgd2hlbiBtZXJnaW5nIChcdTIwMjYgXCJpbGx1cy1cIiArIFwidHJhdGVkXCIgXHUyMTkyIFwiaWxsdXN0cmF0ZWRcIikgKi9cbi8vIGZ1bmN0aW9uIGpvaW5XaXRoSHlwaGVuRml4KHByZXY6IHN0cmluZywgbmV4dDogc3RyaW5nKTogc3RyaW5nIHtcbi8vICAgLy8gSWYgcHJldiBlbmRzIHdpdGggYSBoeXBoZW4tbGlrZSBjaGFyLCBkcm9wIGl0IGFuZCBkb24ndCBhZGQgYSBzcGFjZVxuLy8gICBpZiAoL1tcdTIwMTAtXHUyMDEyXHUyMDEzXHUyMDE0LV0kLy50ZXN0KHByZXYpKSB7XG4vLyAgICAgcmV0dXJuIHByZXYucmVwbGFjZSgvW1x1MjAxMC1cdTIwMTJcdTIwMTNcdTIwMTQtXSQvLCBcIlwiKSArIG5leHQucmVwbGFjZSgvXltcdTIwMTAtXHUyMDEyXHUyMDEzXHUyMDE0LV1cXHMqLywgXCJcIik7XG4vLyAgIH1cbi8vICAgLy8gT3RoZXJ3aXNlIGpvaW4gd2l0aCBhIHNpbmdsZSBzcGFjZVxuLy8gICByZXR1cm4gKHByZXYgKyBcIiBcIiArIG5leHQpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xuLy8gfVxuXG4vLyAvKipcbi8vICAqIE5vcm1hbGl6ZSByYXcgb3V0bGluZSB0ZXh0IHRvIG9uZSBsb2dpY2FsIGxpbmUgcGVyIG51bWJlcmVkIGl0ZW06XG4vLyAgKiAtIE9ubHkgc3RhcnQgYSBuZXcgb3V0cHV0IGxpbmUgd2hlbiB0aGUgKmN1cnJlbnQqIGlucHV0IGxpbmUgYmVnaW5zIHdpdGggYSBudW1iZXJpbmcgdG9rZW5cbi8vICAqIC0gT3RoZXJ3aXNlLCBtZXJnZSB0aGUgbGluZSBpbnRvIHRoZSBwcmV2aW91cyBvdXRwdXQgbGluZSAoZml4aW5nIGh5cGhlbmF0ZWQgbGluZSBicmVha3MpXG4vLyAgKiAtIFRleHQgYmVmb3JlIHRoZSBmaXJzdCBudW1iZXJlZCBpdGVtIGlzIGlnbm9yZWQgKHBlciB5b3VyIHJ1bGUpXG4vLyAgKi9cbi8vIGV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVCcmVha3NCeU51bWJlcmluZyhpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbi8vICAgY29uc3QgbGluZXMgPSBwcmVwcm9jZXNzTGluZXMoaW5wdXQpO1xuLy8gICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4vLyAgIGxldCBjdXIgPSBcIlwiO1xuLy8gICBsZXQgaGF2ZUN1cnJlbnQgPSBmYWxzZTsgLy8gb25seSBvdXRwdXQgb25jZSB3ZSBoaXQgZmlyc3QgbnVtYmVyaW5nXG5cbi8vICAgZm9yIChjb25zdCByYXcgb2YgbGluZXMpIHtcbi8vICAgICBjb25zdCBsaW5lID0gcmF3OyAvLyBhbHJlYWR5IHRyaW1tZWRcbi8vICAgICBpZiAoc3RhcnRzV2l0aE51bWJlcmluZyhsaW5lKSkge1xuLy8gICAgICAgLy8gY29tbWl0IHByZXZpb3VzXG4vLyAgICAgICBpZiAoaGF2ZUN1cnJlbnQgJiYgY3VyKSBvdXQucHVzaChjdXIudHJpbSgpKTtcbi8vICAgICAgIC8vIHN0YXJ0IG5ldyBpdGVtXG4vLyAgICAgICBjdXIgPSBsaW5lO1xuLy8gICAgICAgaGF2ZUN1cnJlbnQgPSB0cnVlO1xuLy8gICAgIH0gZWxzZSB7XG4vLyAgICAgICAvLyBtZXJnZSBvbmx5IGlmIHdlJ3ZlIHN0YXJ0ZWQgYSBudW1iZXJlZCBpdGVtOyBvdGhlcndpc2UgaWdub3JlIHByZWFtYmxlXG4vLyAgICAgICAvLyBpZiAoIWhhdmVDdXJyZW50KSBjb250aW51ZTtcbi8vICAgICAgIGN1ciA9IGpvaW5XaXRoSHlwaGVuRml4KGN1ciwgbGluZSk7XG4vLyAgICAgfVxuLy8gICB9XG5cbi8vICAgaWYgKGhhdmVDdXJyZW50ICYmIGN1cikgb3V0LnB1c2goY3VyLnRyaW0oKSk7XG4vLyAgIHJldHVybiBvdXQuam9pbihcIlxcblwiKTtcbi8vIH1cblxuLy8gLy8gPT09PT09PT09PT09PT09PT09PT09XG4vLyAvLyBNYXJrZG93biBjb252ZXJzaW9uXG4vLyAvLyA9PT09PT09PT09PT09PT09PT09PT1cblxuLy8gLyoqIE1hcCBhIG51bWJlcmluZyB0b2tlbiB0byBhIE1hcmtkb3duIGhlYWRpbmcgbGV2ZWwgKi9cbi8vIGV4cG9ydCBmdW5jdGlvbiBtZFByZWZpeEZvclRva2VuKHRva2VuOiBzdHJpbmcpOiBzdHJpbmcge1xuLy8gICBjb25zdCByb21hbiA9IC9eKEl7MSwzfXxJVnxWfFZJfFZJSXxWSUlJfElYfFh8WEl8WElJfFhJSUl8WElWfFhWKVtcXC5cXCldJC9pO1xuLy8gICBjb25zdCB1cHBlciA9IC9eW0EtWl1bXFwuXFwpXSQvO1xuLy8gICBjb25zdCBsb3dlciA9IC9eW2Etel1bXFwuXFwpXSQvO1xuLy8gICBjb25zdCBudW1lcmljID0gL15cXGQrW1xcLlxcKV0/JC87XG4vLyAgIGNvbnN0IHBhcmVuID0gL15cXChbYS16QS1aMC05XStcXCkkLztcblxuLy8gICBpZiAocm9tYW4udGVzdCh0b2tlbikpIHJldHVybiBcIiMjXCI7ICAgICAgLy8gdG9wIGxldmVsXG4vLyAgIGlmICh1cHBlci50ZXN0KHRva2VuKSkgcmV0dXJuIFwiIyMjXCI7XG4vLyAgIGlmIChudW1lcmljLnRlc3QodG9rZW4pKSByZXR1cm4gXCIjIyMjXCI7XG4vLyAgIGlmIChsb3dlci50ZXN0KHRva2VuKSkgcmV0dXJuIFwiIyMjIyNcIjtcbi8vICAgaWYgKHBhcmVuLnRlc3QodG9rZW4pKSByZXR1cm4gXCIjIyMjIyNcIjtcbi8vICAgcmV0dXJuIFwiXCI7XG4vLyB9XG5cbi8vIC8qKiBBIGxpbmUgaXMgYW4gb3V0bGluZSBoZWFkaW5nIGxpbmUgaWYgaXQgc3RhcnRzIHdpdGggYSBudW1iZXJpbmcgdG9rZW4gKi9cbi8vIGV4cG9ydCBmdW5jdGlvbiBpc091dGxpbmVIZWFkaW5nTGluZShsaW5lOiBzdHJpbmcpOiBib29sZWFuIHtcbi8vICAgY29uc3QgcyA9IGxpbmUudHJpbSgpO1xuLy8gICByZXR1cm4gUk9NQU4udGVzdChzKSB8fCBVUFBFUi50ZXN0KHMpIHx8IExPV0VSLnRlc3QocykgfHwgTlVNRVJJQy50ZXN0KHMpIHx8IFBBUkVOLnRlc3Qocyk7XG4vLyB9XG5cbi8vIC8qKlxuLy8gICogQ29udmVydCBub3JtYWxpemVkIG91dGxpbmUgdGV4dCAob25lIG51bWJlcmVkIGl0ZW0gcGVyIGxpbmUpIGludG8gTWFya2Rvd25cbi8vICAqIGhlYWRpbmdzIGJhc2VkIG9uIHRoZSBudW1iZXJpbmcgdG9rZW4uXG4vLyAgKlxuLy8gICogSWYgeW91IHBhc3MgcmF3IGlucHV0LCB0aGlzIHdpbGwgZmlyc3Qgbm9ybWFsaXplIGl0LlxuLy8gICovXG4vLyBleHBvcnQgZnVuY3Rpb24gZm9ybWF0T3V0bGluZVRleHQoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4vLyAgIC8vIFN0ZXAgMTogbm9ybWFsaXplIHRvIG9uZSBudW1iZXJlZCBpdGVtIHBlciBsaW5lXG4vLyAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVCcmVha3NCeU51bWJlcmluZyhpbnB1dCk7XG4vLyAgIGNvbnN0IGxpbmVzID0gbm9ybWFsaXplZC5zcGxpdCgvXFxyP1xcbi8pO1xuXG4vLyAgIC8vIFN0ZXAgMjogY29udmVydCBlYWNoIGxpbmUgdG8gYSBoZWFkaW5nIGJhc2VkIG9uIGl0cyB0b2tlblxuLy8gICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG5cbi8vICAgZm9yIChjb25zdCByYXcgb2YgbGluZXMpIHtcbi8vICAgICBjb25zdCBsaW5lID0gcmF3LnRyaW0oKTtcbi8vICAgICBpZiAoIWxpbmUpIGNvbnRpbnVlO1xuXG4vLyAgICAgLy8gbXVzdCBzdGFydCB3aXRoIGEgbnVtYmVyaW5nIHRva2VuXG4vLyAgICAgaWYgKCFpc091dGxpbmVIZWFkaW5nTGluZShsaW5lKSkge1xuLy8gICAgICAgLy8gU2FmZXR5OiBpZiBpdCBzbGlwcyB0aHJvdWdoLCBhcHBlbmQgdG8gcHJldmlvdXMgbGluZVxuLy8gICAgICAgaWYgKG91dC5sZW5ndGgpIHtcbi8vICAgICAgICAgb3V0W291dC5sZW5ndGggLSAxXSA9IGpvaW5XaXRoSHlwaGVuRml4KG91dFtvdXQubGVuZ3RoIC0gMV0sIGxpbmUpO1xuLy8gICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgb3V0LnB1c2gobGluZSk7XG4vLyAgICAgICB9XG4vLyAgICAgICBjb250aW51ZTtcbi8vICAgICB9XG5cbi8vICAgICBjb25zdCBwYXJ0cyA9IGxpbmUuc3BsaXQoL1xccysvLCAyKTtcbi8vICAgICBjb25zdCB0b2tlbiA9IHBhcnRzWzBdLnJlcGxhY2UoLzokLywgXCJcIik7XG4vLyAgICAgY29uc3QgcmVzdCA9IHBhcnRzLmxlbmd0aCA+IDEgPyBwYXJ0c1sxXSA6IFwiXCI7XG4vLyAgICAgY29uc3QgcHJlZml4ID0gbWRQcmVmaXhGb3JUb2tlbih0b2tlbik7XG4vLyAgICAgY29uc3QgcmVuZGVyZWQgPSAocHJlZml4ID8gYCR7cHJlZml4fSAke3Rva2VufSAke3Jlc3R9YCA6IGxpbmUpLnRyaW0oKTtcblxuLy8gICAgIG91dC5wdXNoKHJlbmRlcmVkKTtcbi8vICAgfVxuXG4vLyAgIHJldHVybiBvdXQuam9pbihcIlxcblwiKTtcbi8vIH0iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlLCBTZXR0aW5nLCBURmlsZSwgVEZvbGRlciwgbm9ybWFsaXplUGF0aCwgcmVxdWVzdFVybCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBCT09LX0FCQlIgfSBmcm9tIFwiLi4vbGliL3ZlcnNlTWFwXCI7XG5cbi8vIC0tLS0tLS0tLS0gVHlwZXMgLS0tLS0tLS0tLVxudHlwZSBMYW5ndWFnZXNFbnRyeSA9IHtcbiAgbGFuZ3VhZ2U6IHN0cmluZzsgLy8gZS5nLiBcIkVuZ2xpc2hcIlxuICB0cmFuc2xhdGlvbnM6IEFycmF5PHtcbiAgICBzaG9ydF9uYW1lOiBzdHJpbmc7IC8vIGUuZy4gXCJLSlZcIlxuICAgIGZ1bGxfbmFtZTogc3RyaW5nOyAgLy8gZS5nLiBcIktpbmcgSmFtZXMgVmVyc2lvbiAuLi5cIlxuICAgIHVwZGF0ZWQ/OiBudW1iZXI7XG4gICAgZGlyPzogXCJydGxcIiB8IFwibHRyXCI7XG4gIH0+O1xufTtcblxudHlwZSBCb2xsc0Jvb2tNZXRhID0ge1xuICBib29raWQ6IG51bWJlcjtcbiAgY2hyb25vcmRlcjogbnVtYmVyO1xuICBuYW1lOiBzdHJpbmc7XG4gIGNoYXB0ZXJzOiBudW1iZXI7XG59O1xuXG50eXBlIEJvbGxzVmVyc2UgPSB7XG4gIHBrOiBudW1iZXI7XG4gIHZlcnNlOiBudW1iZXI7XG4gIHRleHQ6IHN0cmluZzsgICAvLyBIVE1MXG4gIGNvbW1lbnQ/OiBzdHJpbmc7XG59O1xuXG5jb25zdCBCT0xMUyA9IHtcbiAgTEFOR1VBR0VTX1VSTDogXCJodHRwczovL2JvbGxzLmxpZmUvc3RhdGljL2JvbGxzL2FwcC92aWV3cy9sYW5ndWFnZXMuanNvblwiLFxuICBHRVRfQk9PS1M6ICh0cjogc3RyaW5nKSA9PiBgaHR0cHM6Ly9ib2xscy5saWZlL2dldC1ib29rcy8ke2VuY29kZVVSSUNvbXBvbmVudCh0cil9L2AsXG4gIEdFVF9DSEFQVEVSOiAodHI6IHN0cmluZywgYm9va0lkOiBudW1iZXIsIGNoOiBudW1iZXIpID0+XG4gICAgYGh0dHBzOi8vYm9sbHMubGlmZS9nZXQtdGV4dC8ke2VuY29kZVVSSUNvbXBvbmVudCh0cil9LyR7Ym9va0lkfS8ke2NofS9gLFxufTtcblxuLy8gQ2Fub25pY2FsIGJvb2sgbmFtZSBieSBJRCAoNjYtYm9vayBQcm90ZXN0YW50IGJhc2VsaW5lKVxuY29uc3QgQ0FOT05fRU5fQllfSUQ6IFJlY29yZDxudW1iZXIsIHN0cmluZz4gPSB7XG4gIDE6XCJHZW5lc2lzXCIsMjpcIkV4b2R1c1wiLDM6XCJMZXZpdGljdXNcIiw0OlwiTnVtYmVyc1wiLDU6XCJEZXV0ZXJvbm9teVwiLFxuICA2OlwiSm9zaHVhXCIsNzpcIkp1ZGdlc1wiLDg6XCJSdXRoXCIsOTpcIjEgU2FtdWVsXCIsMTA6XCIyIFNhbXVlbFwiLFxuICAxMTpcIjEgS2luZ3NcIiwxMjpcIjIgS2luZ3NcIiwxMzpcIjEgQ2hyb25pY2xlc1wiLDE0OlwiMiBDaHJvbmljbGVzXCIsMTU6XCJFenJhXCIsXG4gIDE2OlwiTmVoZW1pYWhcIiwxNzpcIkVzdGhlclwiLDE4OlwiSm9iXCIsMTk6XCJQc2FsbXNcIiwyMDpcIlByb3ZlcmJzXCIsXG4gIDIxOlwiRWNjbGVzaWFzdGVzXCIsMjI6XCJTb25nIG9mIFNvbmdzXCIsMjM6XCJJc2FpYWhcIiwyNDpcIkplcmVtaWFoXCIsMjU6XCJMYW1lbnRhdGlvbnNcIixcbiAgMjY6XCJFemVraWVsXCIsMjc6XCJEYW5pZWxcIiwyODpcIkhvc2VhXCIsMjk6XCJKb2VsXCIsMzA6XCJBbW9zXCIsXG4gIDMxOlwiT2JhZGlhaFwiLDMyOlwiSm9uYWhcIiwzMzpcIk1pY2FoXCIsMzQ6XCJOYWh1bVwiLDM1OlwiSGFiYWtrdWtcIixcbiAgMzY6XCJaZXBoYW5pYWhcIiwzNzpcIkhhZ2dhaVwiLDM4OlwiWmVjaGFyaWFoXCIsMzk6XCJNYWxhY2hpXCIsXG4gIDQwOlwiTWF0dGhld1wiLDQxOlwiTWFya1wiLDQyOlwiTHVrZVwiLDQzOlwiSm9oblwiLDQ0OlwiQWN0c1wiLDQ1OlwiUm9tYW5zXCIsXG4gIDQ2OlwiMSBDb3JpbnRoaWFuc1wiLDQ3OlwiMiBDb3JpbnRoaWFuc1wiLDQ4OlwiR2FsYXRpYW5zXCIsNDk6XCJFcGhlc2lhbnNcIixcbiAgNTA6XCJQaGlsaXBwaWFuc1wiLDUxOlwiQ29sb3NzaWFuc1wiLDUyOlwiMSBUaGVzc2Fsb25pYW5zXCIsNTM6XCIyIFRoZXNzYWxvbmlhbnNcIixcbiAgNTQ6XCIxIFRpbW90aHlcIiw1NTpcIjIgVGltb3RoeVwiLDU2OlwiVGl0dXNcIiw1NzpcIlBoaWxlbW9uXCIsNTg6XCJIZWJyZXdzXCIsXG4gIDU5OlwiSmFtZXNcIiw2MDpcIjEgUGV0ZXJcIiw2MTpcIjIgUGV0ZXJcIiw2MjpcIjEgSm9oblwiLDYzOlwiMiBKb2huXCIsXG4gIDY0OlwiMyBKb2huXCIsNjU6XCJKdWRlXCIsNjY6XCJSZXZlbGF0aW9uXCIsXG59O1xuXG5mdW5jdGlvbiBzaG9ydEFiYnJGb3IoYm9va0lkOiBudW1iZXIsIGluY29taW5nTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgY2Fub24gPSBDQU5PTl9FTl9CWV9JRFtib29rSWRdO1xuICBpZiAoY2Fub24gJiYgQk9PS19BQkJSW2Nhbm9uXSkgcmV0dXJuIEJPT0tfQUJCUltjYW5vbl07XG4gIGlmIChCT09LX0FCQlJbaW5jb21pbmdOYW1lXSkgcmV0dXJuIEJPT0tfQUJCUltpbmNvbWluZ05hbWVdO1xuICByZXR1cm4gaW5jb21pbmdOYW1lO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEpzb248VD4odXJsOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcbiAgLy8gUHJlZmVyIE9ic2lkaWFuJ3MgcmVxdWVzdFVybCAobm8gQ09SUyByZXN0cmljdGlvbnMpXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHJlcXVlc3RVcmwoeyB1cmwsIG1ldGhvZDogXCJHRVRcIiB9KTtcbiAgICBpZiAocmVzcC5zdGF0dXMgPCAyMDAgfHwgcmVzcC5zdGF0dXMgPj0gMzAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7cmVzcC5zdGF0dXN9IFJlcXVlc3QgZmFpbGVkYCk7XG4gICAgfVxuICAgIGNvbnN0IHRleHQgPSByZXNwLnRleHQgPz8gXCJcIjtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UodGV4dCkgYXMgVDtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBKU09OIGZyb20gJHt1cmx9YCk7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBGYWxsYmFjayB0byBmZXRjaCBmb3Igbm9uLU9ic2lkaWFuIGNvbnRleHRzIChlLmcuLCB0ZXN0cylcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwgeyBtZXRob2Q6IFwiR0VUXCIgfSk7XG4gICAgICBpZiAoIXIub2spIHRocm93IG5ldyBFcnJvcihgJHtyLnN0YXR1c30gJHtyLnN0YXR1c1RleHR9YCk7XG4gICAgICByZXR1cm4gKGF3YWl0IHIuanNvbigpKSBhcyBUO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIFN1cmZhY2UgdGhlIG9yaWdpbmFsIHJlcXVlc3RVcmwgZXJyb3IgaWYgYm90aCBmYWlsXG4gICAgICB0aHJvdyBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyKSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBodG1sVG9UZXh0KGh0bWw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBodG1sXG4gICAgLnJlcGxhY2UoLzxiclxccypcXC8/Pi9naSwgXCJcXG5cIilcbiAgICAucmVwbGFjZSgvPFxcLz8oaXxlbXxzdHJvbmd8Ynx1fHN1cHxzdWJ8c3BhbnxwfGRpdnxibG9ja3F1b3RlfHNtYWxsfGZvbnQpW14+XSo+L2dpLCBcIlwiKVxuICAgIC5yZXBsYWNlKC8mbmJzcDsvZywgXCIgXCIpXG4gICAgLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKVxuICAgIC5yZXBsYWNlKC8mbHQ7L2csIFwiPFwiKVxuICAgIC5yZXBsYWNlKC8mZ3Q7L2csIFwiPlwiKVxuICAgIC5yZXBsYWNlKC9cXHMrXFxuL2csIFwiXFxuXCIpXG4gICAgLnJlcGxhY2UoL1xcbnszLH0vZywgXCJcXG5cXG5cIilcbiAgICAudHJpbSgpO1xufVxuXG4vLyAtLS0tLS0tLS0tIEJ1aWxkIE1vZGFsIC0tLS0tLS0tLS1cbmNsYXNzIEJ1aWxkQmlibGVNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzO1xuICBwcml2YXRlIGFwcFJlZjogQXBwO1xuXG4gIC8vIERhdGEgZnJvbSBsYW5ndWFnZXMuanNvblxuICBwcml2YXRlIGxhbmdCbG9ja3M6IExhbmd1YWdlc0VudHJ5W10gPSBbXTtcblxuICAvLyBVSSBzdGF0ZVxuICBwcml2YXRlIGxhbmd1YWdlS2V5OiBzdHJpbmcgPSBcIkFMTFwiOyAvLyBcIkFMTFwiIG9yIHRoZSBleGFjdCBMYW5ndWFnZXNFbnRyeS5sYW5ndWFnZSBzdHJpbmdcbiAgcHJpdmF0ZSB0cmFuc2xhdGlvbkNvZGU6IHN0cmluZyA9IFwiS0pWXCI7XG4gIHByaXZhdGUgdHJhbnNsYXRpb25GdWxsOiBzdHJpbmcgPSBcIktpbmcgSmFtZXMgVmVyc2lvblwiO1xuXG4gIHByaXZhdGUgaW5jbHVkZVZlcnNpb25JbkZpbGVOYW1lOiBib29sZWFuO1xuICBwcml2YXRlIHZlcnNpb25Bc1N1YmZvbGRlcjogYm9vbGVhbjtcbiAgcHJpdmF0ZSBhdXRvRnJvbnRtYXR0ZXI6IGJvb2xlYW47XG4gIHByaXZhdGUgY29uY3VycmVuY3k6IG51bWJlciA9IDQ7XG5cbiAgLy8gcHJvZ3Jlc3NcbiAgcHJpdmF0ZSBwcm9ncmVzc0VsITogSFRNTFByb2dyZXNzRWxlbWVudDtcbiAgcHJpdmF0ZSBzdGF0dXNFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIHN0YXJ0QnRuITogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHByaXZhdGUgd29ya2luZyA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLmFwcFJlZiA9IGFwcDtcbiAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG5cbiAgICB0aGlzLmluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZSA9IHNldHRpbmdzLmJpYmxlSW5jbHVkZVZlcnNpb25JbkZpbGVuYW1lID8/IHRydWU7XG4gICAgdGhpcy52ZXJzaW9uQXNTdWJmb2xkZXIgPSBzZXR0aW5ncy5iaWJsZUluY2x1ZGVWZXJzaW9uSW5GaWxlbmFtZSA/PyB0cnVlO1xuICAgIHRoaXMuYXV0b0Zyb250bWF0dGVyID0gc2V0dGluZ3MuYmlibGVBZGRGcm9udG1hdHRlciA/PyBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgdHJhbnNsYXRpb25zRm9yTGFuZ3VhZ2UobGFuZ0tleTogc3RyaW5nKTogTGFuZ3VhZ2VzRW50cnlbXCJ0cmFuc2xhdGlvbnNcIl0ge1xuICAgIGlmIChsYW5nS2V5ID09PSBcIkFMTFwiKSB7XG4gICAgICAvLyBmbGF0dGVuIGFsbCB0cmFuc2xhdGlvbnNcbiAgICAgIGNvbnN0IGFsbDogTGFuZ3VhZ2VzRW50cnlbXCJ0cmFuc2xhdGlvbnNcIl0gPSBbXTtcbiAgICAgIGZvciAoY29uc3QgYmxvY2sgb2YgdGhpcy5sYW5nQmxvY2tzKSBhbGwucHVzaCguLi5ibG9jay50cmFuc2xhdGlvbnMpO1xuICAgICAgLy8gRGUtZHVwIGJ5IHNob3J0X25hbWVcbiAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgIHJldHVybiBhbGwuZmlsdGVyKHQgPT4ge1xuICAgICAgICBpZiAoc2Vlbi5oYXModC5zaG9ydF9uYW1lKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBzZWVuLmFkZCh0LnNob3J0X25hbWUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pLnNvcnQoKGEsYikgPT4gYS5zaG9ydF9uYW1lLmxvY2FsZUNvbXBhcmUoYi5zaG9ydF9uYW1lKSk7XG4gICAgfVxuICAgIGNvbnN0IGJsb2NrID0gdGhpcy5sYW5nQmxvY2tzLmZpbmQoYiA9PiBiLmxhbmd1YWdlID09PSBsYW5nS2V5KTtcbiAgICBpZiAoIWJsb2NrKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGJsb2NrLnRyYW5zbGF0aW9ucy5zbGljZSgpLnNvcnQoKGEsYikgPT4gYS5zaG9ydF9uYW1lLmxvY2FsZUNvbXBhcmUoYi5zaG9ydF9uYW1lKSk7XG4gIH1cblxuICBhc3luYyBvbk9wZW4oKSB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJCdWlsZCBfQmlibGUgZnJvbSBib2xscy5saWZlXCIpO1xuXG4gICAgLy8gTG9hZCBsYW5ndWFnZXMuanNvbiAoc2luZ2xlIGNhdGFsb2d1ZSB3ZSBoYXZlKVxuICAgIHRyeSB7XG4gICAgICBjb25zdCByYXcgPSBhd2FpdCBmZXRjaEpzb248TGFuZ3VhZ2VzRW50cnlbXT4oQk9MTFMuTEFOR1VBR0VTX1VSTCk7XG4gICAgICAvLyBmaWx0ZXIgb3V0IGVtcHR5IHRyYW5zbGF0aW9uIGdyb3VwcyBqdXN0IGluIGNhc2VcbiAgICAgIHRoaXMubGFuZ0Jsb2NrcyA9IChyYXcgfHwgW10pLmZpbHRlcihiID0+IEFycmF5LmlzQXJyYXkoYi50cmFuc2xhdGlvbnMpICYmIGIudHJhbnNsYXRpb25zLmxlbmd0aCA+IDApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIltCb2xsc10gQ291bGQgbm90IGZldGNoIGxhbmd1YWdlcy5qc29uOlwiLCBlKTtcbiAgICAgIC8vIE1pbmltYWwgRW5nbGlzaCBmYWxsYmFjayBzbyB0aGUgbW9kYWwgc3RpbGwgd29ya3M6XG4gICAgICB0aGlzLmxhbmdCbG9ja3MgPSBbe1xuICAgICAgICBsYW5ndWFnZTogXCJFbmdsaXNoXCIsXG4gICAgICAgIHRyYW5zbGF0aW9uczogW1xuICAgICAgICAgIHsgc2hvcnRfbmFtZTogXCJLSlZcIiwgZnVsbF9uYW1lOiBcIktpbmcgSmFtZXMgVmVyc2lvbiAxNzY5IHdpdGggQXBvY3J5cGhhIGFuZCBTdHJvbmcncyBOdW1iZXJzXCIgfSxcbiAgICAgICAgICB7IHNob3J0X25hbWU6IFwiV0VCXCIsIGZ1bGxfbmFtZTogXCJXb3JsZCBFbmdsaXNoIEJpYmxlXCIgfSxcbiAgICAgICAgICB7IHNob3J0X25hbWU6IFwiWUxUXCIsIGZ1bGxfbmFtZTogXCJZb3VuZydzIExpdGVyYWwgVHJhbnNsYXRpb24gKDE4OTgpXCIgfSxcbiAgICAgICAgXVxuICAgICAgfV07XG4gICAgfVxuXG4gICAgLy8gTEFOR1VBR0UgUElDS0VSXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJMYW5ndWFnZVwiKVxuICAgICAgLmFkZERyb3Bkb3duKGRkID0+IHtcbiAgICAgICAgKGRkLnNlbGVjdEVsIGFzIEhUTUxFbGVtZW50KS5zdHlsZS5tYXhXaWR0aCA9IFwiMzAwcHhcIjtcbiAgICAgICAgKGRkLnNlbGVjdEVsIGFzIEhUTUxFbGVtZW50KS5zdHlsZS50ZXh0T3ZlcmZsb3cgPSBcImVsbGlwc2lzXCI7XG4gICAgICAgIChkZC5zZWxlY3RFbCBhcyBIVE1MRWxlbWVudCkuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuICAgICAgICAoZGQuc2VsZWN0RWwgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLndoaXRlU3BhY2UgPSBcIm5vd3JhcFwiO1xuXG4gICAgICAgIGRkLmFkZE9wdGlvbihcIkFMTFwiLCBcIkFsbCBsYW5ndWFnZXNcIik7XG4gICAgICAgIGZvciAoY29uc3QgYmxvY2sgb2YgdGhpcy5sYW5nQmxvY2tzKSB7XG4gICAgICAgICAgZGQuYWRkT3B0aW9uKGJsb2NrLmxhbmd1YWdlLCBibG9jay5sYW5ndWFnZSk7XG4gICAgICAgIH1cbiAgICAgICAgZGQuc2V0VmFsdWUodGhpcy5sYW5ndWFnZUtleSk7XG4gICAgICAgIGRkLm9uQ2hhbmdlKHYgPT4ge1xuICAgICAgICAgIHRoaXMubGFuZ3VhZ2VLZXkgPSB2O1xuICAgICAgICAgIHJlYnVpbGRWZXJzaW9ucygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgLy8gVkVSU0lPTlMgKGR5bmFtaWMpXG4gICAgY29uc3QgdmVyc2lvbnNDb250YWluZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KCk7XG5cbiAgICBjb25zdCByZWJ1aWxkVmVyc2lvbnMgPSAoKSA9PiB7XG4gICAgICB2ZXJzaW9uc0NvbnRhaW5lci5lbXB0eSgpO1xuICAgICAgY29uc3QgbGlzdCA9IHRoaXMudHJhbnNsYXRpb25zRm9yTGFuZ3VhZ2UodGhpcy5sYW5ndWFnZUtleSk7XG4gICAgICBuZXcgU2V0dGluZyh2ZXJzaW9uc0NvbnRhaW5lcilcbiAgICAgICAgLnNldE5hbWUoXCJWZXJzaW9uXCIpXG4gICAgICAgIC5hZGREcm9wZG93bihkZCA9PiB7XG4gICAgICAgICAgKGRkLnNlbGVjdEVsIGFzIEhUTUxFbGVtZW50KS5zdHlsZS5tYXhXaWR0aCA9IFwiMzAwcHhcIjtcbiAgICAgICAgICAoZGQuc2VsZWN0RWwgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLnRleHRPdmVyZmxvdyA9IFwiZWxsaXBzaXNcIjtcbiAgICAgICAgICAoZGQuc2VsZWN0RWwgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICAoZGQuc2VsZWN0RWwgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLndoaXRlU3BhY2UgPSBcIm5vd3JhcFwiO1xuXG4gICAgICAgICAgaWYgKCFsaXN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgZGQuYWRkT3B0aW9uKFwiXCIsIFwiKG5vIHRyYW5zbGF0aW9ucyBmb3IgdGhpcyBsYW5ndWFnZSlcIik7XG4gICAgICAgICAgICBkZC5zZXRWYWx1ZShcIlwiKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgdCBvZiBsaXN0KSB7XG4gICAgICAgICAgICAgIGRkLmFkZE9wdGlvbih0LnNob3J0X25hbWUsIGAke3Quc2hvcnRfbmFtZX0gXHUyMDE0ICR7dC5mdWxsX25hbWV9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBrZWVwIGV4aXN0aW5nIGlmIHN0aWxsIHByZXNlbnQsIGVsc2UgZmlyc3RcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0cyA9IGxpc3Quc29tZSh0ID0+IHQuc2hvcnRfbmFtZSA9PT0gdGhpcy50cmFuc2xhdGlvbkNvZGUpO1xuICAgICAgICAgICAgY29uc3QgY2hvc2VuID0gZXhpc3RzID8gdGhpcy50cmFuc2xhdGlvbkNvZGUgOiBsaXN0WzBdLnNob3J0X25hbWU7XG4gICAgICAgICAgICBkZC5zZXRWYWx1ZShjaG9zZW4pO1xuICAgICAgICAgICAgdGhpcy50cmFuc2xhdGlvbkNvZGUgPSBjaG9zZW47XG4gICAgICAgICAgICBjb25zdCB0ID0gbGlzdC5maW5kKHggPT4geC5zaG9ydF9uYW1lID09PSBjaG9zZW4pO1xuICAgICAgICAgICAgdGhpcy50cmFuc2xhdGlvbkZ1bGwgPSB0Py5mdWxsX25hbWUgPz8gY2hvc2VuO1xuXG4gICAgICAgICAgICBkZC5vbkNoYW5nZSh2ID0+IHtcbiAgICAgICAgICAgICAgdGhpcy50cmFuc2xhdGlvbkNvZGUgPSB2O1xuICAgICAgICAgICAgICBjb25zdCB0dCA9IGxpc3QuZmluZCh4ID0+IHguc2hvcnRfbmFtZSA9PT0gdik7XG4gICAgICAgICAgICAgIHRoaXMudHJhbnNsYXRpb25GdWxsID0gdHQ/LmZ1bGxfbmFtZSA/PyB2O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH07XG5cbiAgICByZWJ1aWxkVmVyc2lvbnMoKTtcblxuICAgIC8vIE9QVElPTlNcbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIkFwcGVuZCB2ZXJzaW9uIHRvIGZpbGUgbmFtZVwiKVxuICAgICAgLnNldERlc2MoYFwiSm9obiAoS0pWKVwiIHZzIFwiSm9oblwiYClcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0LnNldFZhbHVlKHRoaXMuaW5jbHVkZVZlcnNpb25JbkZpbGVOYW1lKS5vbkNoYW5nZSh2ID0+IHRoaXMuaW5jbHVkZVZlcnNpb25JbkZpbGVOYW1lID0gdikpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJQbGFjZSBib29rcyB1bmRlciB2ZXJzaW9uIHN1YmZvbGRlclwiKVxuICAgICAgLnNldERlc2MoYFwiX0JpYmxlL0tKVi9Kb2huIChLSlYpXCIgdnMgXCJfQmlibGUvSm9oblwiYClcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0LnNldFZhbHVlKHRoaXMudmVyc2lvbkFzU3ViZm9sZGVyKS5vbkNoYW5nZSh2ID0+IHRoaXMudmVyc2lvbkFzU3ViZm9sZGVyID0gdikpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJBdXRvLWFkZCBmcm9udG1hdHRlclwiKVxuICAgICAgLnNldERlc2MoXCJJbnNlcnQgWUFNTCB3aXRoIHRpdGxlL3ZlcnNpb24vY3JlYXRlZCBpbnRvIGVhY2ggYm9vayBmaWxlXCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdC5zZXRWYWx1ZSh0aGlzLmF1dG9Gcm9udG1hdHRlcikub25DaGFuZ2UodiA9PiB0aGlzLmF1dG9Gcm9udG1hdHRlciA9IHYpKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5zZXROYW1lKFwiQ29uY3VycmVuY3lcIilcbiAgICAgIC5zZXREZXNjKFwiSG93IG1hbnkgY2hhcHRlcnMgdG8gZG93bmxvYWQgaW4gcGFyYWxsZWxcIilcbiAgICAgIC5hZGRTbGlkZXIocyA9PiBzLnNldExpbWl0cygxLCA4LCAxKS5zZXRWYWx1ZSh0aGlzLmNvbmN1cnJlbmN5KS5vbkNoYW5nZSh2ID0+IHRoaXMuY29uY3VycmVuY3kgPSB2KS5zZXREeW5hbWljVG9vbHRpcCgpKTtcblxuICAgIC8vIFBST0dSRVNTXG4gICAgY29uc3QgcHJvZ1dyYXAgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcImJvbGxzLXByb2dyZXNzXCIgfSk7XG4gICAgdGhpcy5wcm9ncmVzc0VsID0gcHJvZ1dyYXAuY3JlYXRlRWwoXCJwcm9ncmVzc1wiLCB7IGF0dHI6IHsgbWF4OiBcIjEwMFwiLCB2YWx1ZTogXCIwXCIsIHN0eWxlOiBcIndpZHRoOjEwMCVcIiB9IH0pO1xuICAgIHRoaXMuc3RhdHVzRWwgPSBwcm9nV3JhcC5jcmVhdGVEaXYoeyB0ZXh0OiBcIklkbGUuXCIgfSk7XG5cbiAgICAvLyBBQ1RJT05TXG4gICAgY29uc3QgYnRucyA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwiYm9sbHMtYWN0aW9uc1wiIH0pO1xuICAgIHRoaXMuc3RhcnRCdG4gPSBidG5zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJTdGFydFwiIH0pO1xuICAgIHRoaXMuc3RhcnRCdG4ub25jbGljayA9ICgpID0+IHRoaXMuc3RhcnQoKTtcblxuICAgIGNvbnN0IGNhbmNlbEJ0biA9IGJ0bnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIkNsb3NlXCIgfSk7XG4gICAgY2FuY2VsQnRuLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNsb3NlKCk7XG4gIH1cblxuICBhc3luYyBzdGFydCgpIHtcbiAgICBpZiAodGhpcy53b3JraW5nKSByZXR1cm47XG4gICAgdGhpcy53b3JraW5nID0gdHJ1ZTtcbiAgICB0aGlzLnN0YXJ0QnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICBjb25zdCBjb2RlID0gdGhpcy50cmFuc2xhdGlvbkNvZGUudHJpbSgpO1xuICAgIGlmICghY29kZSkgeyBuZXcgTm90aWNlKFwiQ2hvb3NlIG9yIGVudGVyIGEgdHJhbnNsYXRpb24gY29kZS5cIik7IHRoaXMud29ya2luZyA9IGZhbHNlOyB0aGlzLnN0YXJ0QnRuLmRpc2FibGVkID0gZmFsc2U7IHJldHVybjsgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGJ1aWxkQmlibGVGcm9tQm9sbHModGhpcy5hcHBSZWYsIHtcbiAgICAgICAgdHJhbnNsYXRpb25Db2RlOiBjb2RlLFxuICAgICAgICB0cmFuc2xhdGlvbkZ1bGw6IHRoaXMudHJhbnNsYXRpb25GdWxsIHx8IGNvZGUsXG4gICAgICAgIGluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZTogdGhpcy5pbmNsdWRlVmVyc2lvbkluRmlsZU5hbWUsXG4gICAgICAgIHZlcnNpb25Bc1N1YmZvbGRlcjogdGhpcy52ZXJzaW9uQXNTdWJmb2xkZXIsXG4gICAgICAgIGF1dG9Gcm9udG1hdHRlcjogdGhpcy5hdXRvRnJvbnRtYXR0ZXIsXG4gICAgICAgIGNvbmN1cnJlbmN5OiB0aGlzLmNvbmN1cnJlbmN5LFxuICAgICAgfSwgKGRvbmUsIHRvdGFsLCBtc2cpID0+IHtcbiAgICAgICAgdGhpcy5wcm9ncmVzc0VsLm1heCA9IHRvdGFsO1xuICAgICAgICB0aGlzLnByb2dyZXNzRWwudmFsdWUgPSBkb25lO1xuICAgICAgICB0aGlzLnN0YXR1c0VsLnNldFRleHQoYCR7ZG9uZX0vJHt0b3RhbH0gXHUwMEI3ICR7bXNnfWApO1xuICAgICAgfSk7XG4gICAgICB0aGlzLnN0YXR1c0VsLnNldFRleHQoXCJEb25lLlwiKTtcbiAgICB9IGNhdGNoIChlOmFueSkge1xuICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgIG5ldyBOb3RpY2UoYEJpYmxlIGJ1aWxkIGZhaWxlZDogJHtlPy5tZXNzYWdlID8/IGV9YCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMud29ya2luZyA9IGZhbHNlO1xuICAgICAgdGhpcy5zdGFydEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tIEJ1aWxkZXIgY29yZSAtLS0tLS0tLS0tXG50eXBlIEJ1aWxkT3B0aW9ucyA9IHtcbiAgdHJhbnNsYXRpb25Db2RlOiBzdHJpbmc7XG4gIHRyYW5zbGF0aW9uRnVsbDogc3RyaW5nO1xuICBpbmNsdWRlVmVyc2lvbkluRmlsZU5hbWU6IGJvb2xlYW47XG4gIHZlcnNpb25Bc1N1YmZvbGRlcjogYm9vbGVhbjtcbiAgYXV0b0Zyb250bWF0dGVyOiBib29sZWFuO1xuICBjb25jdXJyZW5jeTogbnVtYmVyO1xufTtcbnR5cGUgUHJvZ3Jlc3NGbiA9IChkb25lOiBudW1iZXIsIHRvdGFsOiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZDtcblxuZnVuY3Rpb24gbm93SXNvRGF0ZSgpOiBzdHJpbmcge1xuICBjb25zdCBkID0gbmV3IERhdGUoKTtcbiAgY29uc3QgbW0gPSBTdHJpbmcoZC5nZXRNb250aCgpKzEpLnBhZFN0YXJ0KDIsXCIwXCIpO1xuICBjb25zdCBkZCA9IFN0cmluZyhkLmdldERhdGUoKSkucGFkU3RhcnQoMixcIjBcIik7XG4gIHJldHVybiBgJHtkLmdldEZ1bGxZZWFyKCl9LSR7bW19LSR7ZGR9YDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW5zdXJlRm9sZGVyKGFwcDogQXBwLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRGb2xkZXI+IHtcbiAgY29uc3QgbnAgPSBub3JtYWxpemVQYXRoKHBhdGgucmVwbGFjZSgvXFwvKyQvLFwiXCIpKTtcbiAgbGV0IGYgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5wKTtcbiAgaWYgKGYgaW5zdGFuY2VvZiBURm9sZGVyKSByZXR1cm4gZjtcbiAgYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihucCk7XG4gIGNvbnN0IGNyZWF0ZWQgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5wKTtcbiAgaWYgKGNyZWF0ZWQgaW5zdGFuY2VvZiBURm9sZGVyKSByZXR1cm4gY3JlYXRlZDtcbiAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gY3JlYXRlIGZvbGRlcjogJHtucH1gKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRCb29rRmlsZW5hbWUoYmFzZVNob3J0OiBzdHJpbmcsIGNvZGU6IHN0cmluZywgaW5jbHVkZVZlcnNpb246IGJvb2xlYW4pOiBzdHJpbmcge1xuICByZXR1cm4gaW5jbHVkZVZlcnNpb24gPyBgJHtiYXNlU2hvcnR9ICgke2NvZGV9KWAgOiBiYXNlU2hvcnQ7XG59XG5cbmZ1bmN0aW9uIGNoYXB0ZXJOYXZMaW5lKGJvb2tTaG9ydDogc3RyaW5nLCBjaGFwdGVyczogbnVtYmVyKTogc3RyaW5nIHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG4gIGZvciAobGV0IGM9MTsgYzw9Y2hhcHRlcnM7IGMrKykge1xuICAgIGNvbnN0IGxhYiA9IChjICUgNSA9PT0gMCB8fCBjID09PSAxIHx8IGMgPT09IGNoYXB0ZXJzKSA/IFN0cmluZyhjKSA6IFwiXHUyMDIyXCI7XG4gICAgcGFydHMucHVzaChgW1ske2Jvb2tTaG9ydH0jXiR7Y318JHtsYWJ9XV1gKTtcbiAgfVxuICByZXR1cm4gYFxcbioqY2guKiogJHtwYXJ0cy5qb2luKFwiIFwiKX1cXG5gO1xufVxuXG5hc3luYyBmdW5jdGlvbiBidWlsZEJpYmxlRnJvbUJvbGxzKGFwcDogQXBwLCBvcHRzOiBCdWlsZE9wdGlvbnMsIG9uUHJvZ3Jlc3M6IFByb2dyZXNzRm4pIHtcbiAgY29uc3QgYmFzZUZvbGRlciA9IFwiX0JpYmxlXCI7XG4gIGNvbnN0IHJvb3QgPSBhd2FpdCBlbnN1cmVGb2xkZXIoYXBwLCBiYXNlRm9sZGVyKTtcbiAgY29uc3QgcGFyZW50ID0gb3B0cy52ZXJzaW9uQXNTdWJmb2xkZXJcbiAgICA/IGF3YWl0IGVuc3VyZUZvbGRlcihhcHAsIGAke2Jhc2VGb2xkZXJ9LyR7b3B0cy50cmFuc2xhdGlvbkNvZGV9YClcbiAgICA6IHJvb3Q7XG5cbiAgbGV0IGJvb2tzOiBCb2xsc0Jvb2tNZXRhW10gPSBbXTtcbiAgdHJ5IHtcbiAgICBib29rcyA9IGF3YWl0IGZldGNoSnNvbjxCb2xsc0Jvb2tNZXRhW10+KEJPTExTLkdFVF9CT09LUyhvcHRzLnRyYW5zbGF0aW9uQ29kZSkpO1xuICB9IGNhdGNoIChlOmFueSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGxvYWQgYm9va3MgZm9yICR7b3B0cy50cmFuc2xhdGlvbkNvZGV9OiAke2U/Lm1lc3NhZ2UgPz8gZX1gKTtcbiAgfVxuICBpZiAoIWJvb2tzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKFwiTm8gYm9va3MgcmV0dXJuZWQgZnJvbSBBUEkuXCIpO1xuXG4gIGNvbnN0IHRvdGFsID0gYm9va3MucmVkdWNlKChhY2MsYik9PmFjYyArIChiLmNoYXB0ZXJzfHwwKSwgMCk7XG4gIGxldCBkb25lID0gMDtcblxuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChjb25zdCBib29rIG9mIGJvb2tzKSB7XG4gICAgY29uc3Qgc2hvcnRCb29rID0gc2hvcnRBYmJyRm9yKGJvb2suYm9va2lkLCBib29rLm5hbWUpO1xuICAgIGNvbnN0IHNob3J0V2l0aEFiYnIgPSBgJHtzaG9ydEJvb2t9JHtvcHRzLmluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZSA/IGAgKCR7b3B0cy50cmFuc2xhdGlvbkNvZGV9KWAgOiBcIlwifWA7XG4gICAgY29uc3QgZmlsZUJhc2UgPSBidWlsZEJvb2tGaWxlbmFtZShzaG9ydEJvb2ssIG9wdHMudHJhbnNsYXRpb25Db2RlLCBvcHRzLmluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZSk7XG4gICAgY29uc3QgdGFyZ2V0UGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7cGFyZW50LnBhdGh9LyR7ZmlsZUJhc2V9Lm1kYCk7XG5cbiAgICBjb25zdCBoZWFkZXJMaW5lczogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAob3B0cy5hdXRvRnJvbnRtYXR0ZXIpIHtcbiAgICAgIGhlYWRlckxpbmVzLnB1c2goXG4gICAgICAgIFwiLS0tXCIsXG4gICAgICAgIGB0aXRsZTogXCIke3Nob3J0V2l0aEFiYnJ9XCJgLFxuICAgICAgICBgYmlibGVfdHJhbnNsYXRpb25fY29kZTogXCIke29wdHMudHJhbnNsYXRpb25Db2RlfVwiYCxcbiAgICAgICAgYGJpYmxlX3RyYW5zbGF0aW9uX25hbWU6IFwiJHtvcHRzLnRyYW5zbGF0aW9uRnVsbH1cImAsXG4gICAgICAgIGBjcmVhdGVkOiAke25vd0lzb0RhdGUoKX1gLFxuICAgICAgICBcIi0tLVwiLFxuICAgICAgICBcIlwiXG4gICAgICApO1xuICAgIH1cbiAgICBoZWFkZXJMaW5lcy5wdXNoKGAjICR7c2hvcnRXaXRoQWJicn1gKTtcbiAgICBoZWFkZXJMaW5lcy5wdXNoKGNoYXB0ZXJOYXZMaW5lKHNob3J0V2l0aEFiYnIsIGJvb2suY2hhcHRlcnMpKTtcbiAgICBoZWFkZXJMaW5lcy5wdXNoKFwiXCIpO1xuXG4gICAgY29uc3QgY2h1bmtzOiBzdHJpbmdbXSA9IFtoZWFkZXJMaW5lcy5qb2luKFwiXFxuXCIpXTtcblxuICAgIGNvbnN0IHF1ZXVlID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBib29rLmNoYXB0ZXJzfSwgKF8saSk9PmkrMSk7XG4gICAgY29uc3QgY29uY3VycmVuY3kgPSBNYXRoLm1heCgxLCBNYXRoLm1pbig4LCBvcHRzLmNvbmN1cnJlbmN5IHx8IDQpKTtcblxuICAgIC8vIFNpbXBsZSBwb29sXG4gICAgbGV0IG5leHQgPSAwO1xuICAgIGNvbnN0IHdvcmtlcnMgPSBBcnJheS5mcm9tKHtsZW5ndGg6IGNvbmN1cnJlbmN5fSwgKCkgPT4gKGFzeW5jICgpID0+IHtcbiAgICAgIHdoaWxlIChuZXh0IDwgcXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGNoID0gcXVldWVbbmV4dCsrXTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBvblByb2dyZXNzKGRvbmUsIHRvdGFsLCBgJHtzaG9ydFdpdGhBYmJyfSAke2NofS8ke2Jvb2suY2hhcHRlcnN9YCk7XG4gICAgICAgICAgY29uc3QgdmVyc2VzID0gYXdhaXQgZmV0Y2hKc29uPEJvbGxzVmVyc2VbXT4oQk9MTFMuR0VUX0NIQVBURVIob3B0cy50cmFuc2xhdGlvbkNvZGUsIGJvb2suYm9va2lkLCBjaCkpO1xuICAgICAgICAgIGNvbnN0IG1heFYgPSBNYXRoLm1heCgwLCAuLi52ZXJzZXMubWFwKHYgPT4gdi52ZXJzZSkpO1xuXG4gICAgICAgICAgY29uc3QgdnZOYXYgPSBBcnJheS5mcm9tKHtsZW5ndGg6IG1heFZ9LCAoXyxpKT0+aSsxKVxuICAgICAgICAgICAgLm1hcCh2ID0+IGBbWyR7c2hvcnRXaXRoQWJicn0jXiR7Y2h9LSR7dn18JHt2ICUgNSA9PT0gMCA/IHYgOiBcIlx1MjAyMlwifV1dYCkuam9pbihcIiBcIik7XG5cbiAgICAgICAgICBjb25zdCBwcmV2TGluayA9IGNoID4gMSA/IGBbWyR7c2hvcnRXaXRoQWJicn0jXiR7Y2gtMX18PC0gUHJldmlvdXNdXWAgOiBcIlx1MjE5MFwiO1xuICAgICAgICAgIGNvbnN0IG5leHRMaW5rID0gY2ggPCBib29rLmNoYXB0ZXJzID8gYFtbJHtzaG9ydFdpdGhBYmJyfSNeJHtjaCsxfXxOZXh0IC0+XV1gIDogXCJcdTIxOTJcIjtcbiAgICAgICAgICBjb25zdCBtaWQgPSBgW1ske3Nob3J0V2l0aEFiYnJ9IyR7c2hvcnRXaXRoQWJicn18JHtzaG9ydEJvb2t9ICR7Y2h9IG9mICR7Ym9vay5jaGFwdGVyc31dXWA7XG5cbiAgICAgICAgICBjb25zdCB0b3AgPSBbXG4gICAgICAgICAgICBcIi0tLVwiLFxuICAgICAgICAgICAgYCR7cHJldkxpbmt9IHwgJHttaWR9IHwgJHtuZXh0TGlua30gfCAqKnZ2LioqICR7dnZOYXZ9IF4ke2NofWAsXG4gICAgICAgICAgICBcIlxcbi0tLVxcblwiLFxuICAgICAgICAgICAgXCJcIlxuICAgICAgICAgIF0uam9pbihcIlxcblwiKTtcblxuICAgICAgICAgIGNvbnN0IHZlcnNlc01kID0gdmVyc2VzLm1hcCh2ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBsYWluID0gaHRtbFRvVGV4dCh2LnRleHQpLnRyaW0oKTtcbiAgICAgICAgICAgIHJldHVybiBgKioke3Nob3J0V2l0aEFiYnJ9ICR7Y2h9OiR7di52ZXJzZX0qKiAtICR7cGxhaW59IF4ke2NofS0ke3YudmVyc2V9YDtcbiAgICAgICAgICB9KS5qb2luKFwiXFxuXFxuXCIpO1xuXG4gICAgICAgICAgY2h1bmtzW2NoXSA9IGAke3RvcH0ke3ZlcnNlc01kfVxcblxcbmA7XG4gICAgICAgIH0gY2F0Y2ggKGU6YW55KSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2goYFske29wdHMudHJhbnNsYXRpb25Db2RlfV0gJHtzaG9ydEJvb2t9IGNoLiR7Y2h9OiAke2U/Lm1lc3NhZ2UgPz8gZX1gKTtcbiAgICAgICAgICBjaHVua3NbY2hdID0gYC0tLVxcbigke3Nob3J0Qm9va30gJHtjaH0pIFx1MjAxNCBmYWlsZWQgdG8gZG93bmxvYWQuXFxuXiR7Y2h9XFxuLS0tXFxuXFxuYDtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBkb25lKys7IG9uUHJvZ3Jlc3MoZG9uZSwgdG90YWwsIGAke3Nob3J0Qm9va30gJHtNYXRoLm1pbihjaCwgYm9vay5jaGFwdGVycyl9LyR7Ym9vay5jaGFwdGVyc31gKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pKCkpO1xuICAgIGF3YWl0IFByb21pc2UuYWxsKHdvcmtlcnMpO1xuXG4gICAgY29uc3QgYm9va0NvbnRlbnQgPSBjaHVua3Muam9pbihcIlwiKTtcbiAgICBjb25zdCBleGlzdGluZyA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgodGFyZ2V0UGF0aCk7XG4gICAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZXhpc3RpbmcsIGJvb2tDb250ZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZSh0YXJnZXRQYXRoLCBib29rQ29udGVudCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGVycm9ycy5sZW5ndGgpIHtcbiAgICAvLyBjb25zdCBsb2dGb2xkZXIgPSBhd2FpdCBlbnN1cmVGb2xkZXIoYXBwLCBgJHtiYXNlRm9sZGVyfS9fbG9nc2ApO1xuICAgIC8vIGNvbnN0IGxvZ1BhdGggPSBub3JtYWxpemVQYXRoKGAke2xvZ0ZvbGRlci5wYXRofS9iaWJsZS1idWlsZC0ke29wdHMudHJhbnNsYXRpb25Db2RlfS0ke0RhdGUubm93KCl9Lm1kYCk7XG4gICAgLy8gY29uc3QgYm9keSA9IFtcbiAgICAvLyAgIGAjIEJ1aWxkIExvZyBcdTIwMTQgJHtvcHRzLnRyYW5zbGF0aW9uQ29kZX1gLFxuICAgIC8vICAgYERhdGU6ICR7bmV3IERhdGUoKS50b1N0cmluZygpfWAsXG4gICAgLy8gICBcIlwiLFxuICAgIC8vICAgLi4uZXJyb3JzLm1hcChlID0+IGAtICR7ZX1gKVxuICAgIC8vIF0uam9pbihcIlxcblwiKTtcbiAgICAvLyBhd2FpdCBhcHAudmF1bHQuY3JlYXRlKGxvZ1BhdGgsIGJvZHkpO1xuICAgIC8vIG5ldyBOb3RpY2UoYEZpbmlzaGVkIHdpdGggJHtlcnJvcnMubGVuZ3RofSBlcnJvcihzKS4gU2VlOiAke2xvZ1BhdGh9YCk7XG4gICAgbmV3IE5vdGljZShgRmluaXNoZWQgd2l0aCAke2Vycm9ycy5sZW5ndGh9IGVycm9yKHMpLmApO1xuICB9IGVsc2Uge1xuICAgIG5ldyBOb3RpY2UoXCJGaW5pc2hlZCB3aXRob3V0IGVycm9ycy5cIik7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLSBDb21tYW5kIGVudHJ5IC0tLS0tLS0tLS1cbmV4cG9ydCBmdW5jdGlvbiBjb21tYW5kQnVpbGRCaWJsZUZyb21Cb2xscyhhcHA6IEFwcCwgX3NldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MpIHtcbiAgbmV3IEJ1aWxkQmlibGVNb2RhbChhcHAsIF9zZXR0aW5ncykub3BlbigpO1xufSIsICJleHBvcnQgY29uc3QgQk9PS19BQkJSOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICBcIkdlbmVzaXNcIjogXCJHZW5cIixcbiAgXCJFeG9kdXNcIjogXCJFeG9cIixcbiAgXCJMZXZpdGljdXNcIjogXCJMZXZcIixcbiAgXCJOdW1iZXJzXCI6IFwiTnVtXCIsXG4gIFwiRGV1dGVyb25vbXlcIjogXCJEZXV0XCIsXG4gIFwiSm9zaHVhXCI6IFwiSm9zaFwiLFxuICBcIkp1ZGdlc1wiOiBcIkp1ZGdcIixcbiAgXCJSdXRoXCI6IFwiUnV0aFwiLFxuICBcIjEgU2FtdWVsXCI6IFwiMSBTYW1cIixcbiAgXCJGaXJzdCBTYW11ZWxcIjogXCIxIFNhbVwiLFxuICBcIjIgU2FtdWVsXCI6IFwiMiBTYW1cIixcbiAgXCJTZWNvbmQgU2FtdWVsXCI6IFwiMiBTYW1cIixcbiAgXCIxIEtpbmdzXCI6IFwiMSBLaW5nc1wiLFxuICBcIkZpcnN0IEtpbmdzXCI6IFwiMSBLaW5nc1wiLFxuICBcIjIgS2luZ3NcIjogXCIyIEtpbmdzXCIsXG4gIFwiU2Vjb25kIEtpbmdzXCI6IFwiMiBLaW5nc1wiLFxuICBcIjEgQ2hyb25pY2xlc1wiOiBcIjEgQ2hyb25cIixcbiAgXCJGaXJzdCBDaHJvbmljbGVzXCI6IFwiMSBDaHJvblwiLFxuICBcIjIgQ2hyb25pY2xlc1wiOiBcIjIgQ2hyb25cIixcbiAgXCJTZWNvbmQgQ2hyb25pY2xlc1wiOiBcIjIgQ2hyb25cIixcbiAgXCJFenJhXCI6IFwiRXpyYVwiLFxuICBcIk5laGVtaWFoXCI6IFwiTmVoXCIsXG4gIFwiRXN0aGVyXCI6IFwiRXN0aFwiLFxuICBcIkpvYlwiOiBcIkpvYlwiLFxuICBcIlBzYWxtc1wiOiBcIlBzYVwiLFxuICBcIlBzYWxtXCI6IFwiUHNhXCIsXG4gIFwiUHJvdmVyYnNcIjogXCJQcm92XCIsXG4gIFwiRWNjbGVzaWFzdGVzXCI6IFwiRWNjbFwiLFxuICBcIlNvbmcgb2YgU29uZ3NcIjogXCJTLlMuXCIsXG4gIFwiU29uZyBvZiBTb2xvbW9uXCI6IFwiUy5TLlwiLFxuICBcIklzYWlhaFwiOiBcIklzYVwiLFxuICBcIkplcmVtaWFoXCI6IFwiSmVyXCIsXG4gIFwiTGFtZW50YXRpb25zXCI6IFwiTGFtXCIsXG4gIFwiRXpla2llbFwiOiBcIkV6ZWtcIixcbiAgXCJEYW5pZWxcIjogXCJEYW5cIixcbiAgXCJIb3NlYVwiOiBcIkhvc2VhXCIsXG4gIFwiSm9lbFwiOiBcIkpvZWxcIixcbiAgXCJBbW9zXCI6IFwiQW1vc1wiLFxuICBcIk9iYWRpYWhcIjogXCJPYmFkXCIsXG4gIFwiSm9uYWhcIjogXCJKb25haFwiLFxuICBcIk1pY2FoXCI6IFwiTWljYWhcIixcbiAgXCJOYWh1bVwiOiBcIk5haHVtXCIsXG4gIFwiSGFiYWtrdWtcIjogXCJIYWJcIixcbiAgXCJaZXBoYW5pYWhcIjogXCJaZXBoXCIsXG4gIFwiSGFnZ2FpXCI6IFwiSGFnXCIsXG4gIFwiWmVjaGFyaWFoXCI6IFwiWmVjaFwiLFxuICBcIk1hbGFjaGlcIjogXCJNYWxcIixcbiAgXCJNYXR0aGV3XCI6IFwiTWF0dFwiLFxuICBcIk1hcmtcIjogXCJNYXJrXCIsXG4gIFwiTHVrZVwiOiBcIkx1a2VcIixcbiAgXCJKb2huXCI6IFwiSm9oblwiLFxuICBcIkFjdHNcIjogXCJBY3RzXCIsXG4gIFwiUm9tYW5zXCI6IFwiUm9tXCIsXG4gIFwiMSBDb3JpbnRoaWFuc1wiOiBcIjEgQ29yXCIsXG4gIFwiRmlyc3QgQ29yaW50aGlhbnNcIjogXCIxIENvclwiLFxuICBcIjIgQ29yaW50aGlhbnNcIjogXCIyIENvclwiLFxuICBcIlNlY29uZCBDb3JpbnRoaWFuc1wiOiBcIjIgQ29yXCIsXG4gIFwiR2FsYXRpYW5zXCI6IFwiR2FsXCIsXG4gIFwiRXBoZXNpYW5zXCI6IFwiRXBoXCIsXG4gIFwiUGhpbGlwcGlhbnNcIjogXCJQaGlsXCIsXG4gIFwiQ29sb3NzaWFuc1wiOiBcIkNvbFwiLFxuICBcIjEgVGhlc3NhbG9uaWFuc1wiOiBcIjEgVGhlc1wiLFxuICBcIkZpcnN0IFRoZXNzYWxvbmlhbnNcIjogXCIxIFRoZXNcIixcbiAgXCIyIFRoZXNzYWxvbmlhbnNcIjogXCIyIFRoZXNcIixcbiAgXCJTZWNvbmQgVGhlc3NhbG9uaWFuc1wiOiBcIjIgVGhlc1wiLFxuICBcIjEgVGltb3RoeVwiOiBcIjEgVGltXCIsXG4gIFwiRmlyc3QgVGltb3RoeVwiOiBcIjEgVGltXCIsXG4gIFwiMiBUaW1vdGh5XCI6IFwiMiBUaW1cIixcbiAgXCJTZWNvbmQgVGltb3RoeVwiOiBcIjIgVGltXCIsXG4gIFwiVGl0dXNcIjogXCJUaXR1c1wiLFxuICBcIlBoaWxlbW9uXCI6IFwiUGhpbGVtXCIsXG4gIFwiSGVicmV3c1wiOiBcIkhlYlwiLFxuICBcIkphbWVzXCI6IFwiSmFtZXNcIixcbiAgXCIxIFBldGVyXCI6IFwiMSBQZXRcIixcbiAgXCJGaXJzdCBQZXRlclwiOiBcIjEgUGV0XCIsXG4gIFwiMiBQZXRlclwiOiBcIjIgUGV0XCIsXG4gIFwiU2Vjb25kIFBldGVyXCI6IFwiMiBQZXRcIixcbiAgXCIxIEpvaG5cIjogXCIxIEpvaG5cIixcbiAgXCJGaXJzdCBKb2huXCI6IFwiMSBKb2huXCIsXG4gIFwiMiBKb2huXCI6IFwiMiBKb2huXCIsXG4gIFwiU2Vjb25kIEpvaG5cIjogXCIyIEpvaG5cIixcbiAgXCIzIEpvaG5cIjogXCIzIEpvaG5cIixcbiAgXCJUaGlyZCBKb2huXCI6IFwiMyBKb2huXCIsXG4gIFwiSnVkZVwiOiBcIkp1ZGVcIixcbiAgXCJSZXZlbGF0aW9uXCI6IFwiUmV2XCJcbn07XG5cbmV4cG9ydCBjb25zdCBBTExfQk9PS19UT0tFTlMgPSAoKCkgPT4ge1xuICBjb25zdCBzZXQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoQk9PS19BQkJSKSkgeyBzZXQuYWRkKGspOyBzZXQuYWRkKHYpOyB9XG4gIHJldHVybiBbLi4uc2V0XS5zb3J0KChhLCBiKSA9PiBiLmxlbmd0aCAtIGEubGVuZ3RoKTtcbn0pKCk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUFBQSxvQkFBNkM7OztBQ0E3QyxzQkFBdUQ7QUFvQmhELElBQU0sbUJBQXVDO0FBQUEsRUFDbEQsWUFBWTtBQUFBLEVBQ1osWUFBWTtBQUFBLEVBQ1osbUJBQW1CO0FBQUEsRUFDbkIsMkJBQTJCO0FBQUEsRUFDM0IsNEJBQTRCO0FBQUEsRUFDNUIseUJBQXlCO0FBQUEsRUFDekIsZ0JBQWdCO0FBQUE7QUFBQSxFQUdoQixxQkFBcUI7QUFBQSxFQUNyQixzQkFBc0I7QUFBQSxFQUN0QiwrQkFBK0I7QUFBQSxFQUMvQixxQkFBcUI7QUFDdkI7QUFFTyxJQUFNLHVCQUFOLGNBQW1DLGlDQUFpQjtBQUFBLEVBR3pELFlBQVksS0FBVSxRQUE0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QUFDLG9CQUF1Rjs7O0FDQWhGLElBQU1DLGFBQW9DO0FBQUEsRUFDL0MsV0FBVztBQUFBLEVBQ1gsVUFBVTtBQUFBLEVBQ1YsYUFBYTtBQUFBLEVBQ2IsV0FBVztBQUFBLEVBQ1gsZUFBZTtBQUFBLEVBQ2YsVUFBVTtBQUFBLEVBQ1YsVUFBVTtBQUFBLEVBQ1YsUUFBUTtBQUFBLEVBQ1IsWUFBWTtBQUFBLEVBQ1osZ0JBQWdCO0FBQUEsRUFDaEIsWUFBWTtBQUFBLEVBQ1osaUJBQWlCO0FBQUEsRUFDakIsV0FBVztBQUFBLEVBQ1gsZUFBZTtBQUFBLEVBQ2YsV0FBVztBQUFBLEVBQ1gsZ0JBQWdCO0FBQUEsRUFDaEIsZ0JBQWdCO0FBQUEsRUFDaEIsb0JBQW9CO0FBQUEsRUFDcEIsZ0JBQWdCO0FBQUEsRUFDaEIscUJBQXFCO0FBQUEsRUFDckIsUUFBUTtBQUFBLEVBQ1IsWUFBWTtBQUFBLEVBQ1osVUFBVTtBQUFBLEVBQ1YsT0FBTztBQUFBLEVBQ1AsVUFBVTtBQUFBLEVBQ1YsU0FBUztBQUFBLEVBQ1QsWUFBWTtBQUFBLEVBQ1osZ0JBQWdCO0FBQUEsRUFDaEIsaUJBQWlCO0FBQUEsRUFDakIsbUJBQW1CO0FBQUEsRUFDbkIsVUFBVTtBQUFBLEVBQ1YsWUFBWTtBQUFBLEVBQ1osZ0JBQWdCO0FBQUEsRUFDaEIsV0FBVztBQUFBLEVBQ1gsVUFBVTtBQUFBLEVBQ1YsU0FBUztBQUFBLEVBQ1QsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsV0FBVztBQUFBLEVBQ1gsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsWUFBWTtBQUFBLEVBQ1osYUFBYTtBQUFBLEVBQ2IsVUFBVTtBQUFBLEVBQ1YsYUFBYTtBQUFBLEVBQ2IsV0FBVztBQUFBLEVBQ1gsV0FBVztBQUFBLEVBQ1gsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsVUFBVTtBQUFBLEVBQ1YsaUJBQWlCO0FBQUEsRUFDakIscUJBQXFCO0FBQUEs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QUNKLE1BQU07QUFBQSxNQUNOLFVBQVUsTUFBTSwrQkFBK0IsS0FBSyxLQUFLLEtBQUssUUFBUTtBQUFBLElBQ3hFLENBQUM7QUFFRCxTQUFLLFdBQVc7QUFBQSxNQUNkLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxNQUNOLFVBQVUsTUFBTSw4Q0FBOEMsS0FBSyxLQUFLLEtBQUssUUFBUTtBQUFBLElBQ3ZGLENBQUM7QUFHRCxxQkFBaUIsSUFBSTtBQUFBLEVBQ3ZCO0FBQUEsRUFFQSxNQUFNLFdBQVc7QUFDZixZQUFRLElBQUksc0NBQWlDO0FBQUEsRUFDL0M7QUFBQSxFQUVBLE1BQU0sZUFBZTtBQUNuQixVQUFNLEtBQUssU0FBUyxLQUFLLFFBQVE7QUFBQSxFQUNuQztBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJjb250ZW50IiwgInlhbWwiLCAiYm9keSIsICJsaW5rZWQiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJhZGRJY29uIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAicmF3IiwgImltcG9ydF9vYnNpZGlhbiIsICJCT09LX0FCQlIiLCAiQk9PS19BQkJSIiwgImZldGNoSnNvbiIsICJibG9jayIsICJ0Il0KfQo=
