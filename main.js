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
var import_obsidian15 = require("obsidian");

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
  bibleAddFrontmatter: false,
  bollsCatalogueCache: void 0,
  bollsCatalogueCachedAt: void 0
};
var BibleToolsSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Bible Tools \u2014 Settings" });
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
var import_obsidian5 = require("obsidian");

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

// src/ui/pick-version-modal.ts
var import_obsidian4 = require("obsidian");

// src/ui/bolls-base-modal.ts
var import_obsidian3 = require("obsidian");
var BOLLS = {
  LANGUAGES_URL: "https://bolls.life/static/bolls/app/views/languages.json"
};
async function fetchLanguages() {
  const res = await (0, import_obsidian3.requestUrl)({ url: BOLLS.LANGUAGES_URL, method: "GET" });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`HTTP ${res.status}`);
  }
  const parsed = JSON.parse(res.text);
  return (parsed || []).filter((b) => Array.isArray(b.translations) && b.translations.length > 0);
}
var BaseBollsModal = class extends import_obsidian3.Modal {
  constructor(app, settings, defaults) {
    super(app);
    this.langBlocks = [];
    this.languageKey = "ALL";
    // "ALL" (=flatten) or exact BollsLanguage.language
    this.translationCode = "KJV";
    this.translationFull = "King James Version";
    this.settings = settings;
    this.defaults = defaults;
  }
  /** Override to add extra option controls under the pickers */
  renderExtraOptions(_contentEl) {
  }
  /** Subclasses can call to rebuild version dropdown */
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
    this.titleEl.setText("Bible version");
    try {
      const cached = this.settings.bollsCatalogueCache;
      if (cached?.length) {
        this.langBlocks = cached;
      } else {
        this.langBlocks = await fetchLanguages();
        try {
          this.settings.bollsCatalogueCache = this.langBlocks;
          this.settings.bollsCatalogueCachedAt = Date.now();
          this.app.savePluginSettings?.() ?? this.plugin?.saveSettings?.();
        } catch {
        }
      }
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
      new import_obsidian3.Notice("Using minimal fallback catalogue (KJV/WEB/YLT).");
    }
    if (this.defaults?.languageLabel) {
      const found = this.langBlocks.find((b) => b.language === this.defaults.languageLabel);
      if (found) this.languageKey = found.language;
    }
    if (this.defaults?.versionShort) {
      this.translationCode = this.defaults.versionShort;
      const t = this.translationsForLanguage(this.languageKey).find((x) => x.short_name === this.translationCode);
      this.translationFull = t?.full_name ?? this.translationCode;
    }
    new import_obsidian3.Setting(contentEl).setName("Language").addDropdown((dd) => {
      const sel = dd.selectEl;
      sel.style.maxWidth = "360px";
      sel.style.whiteSpace = "nowrap";
      dd.addOption("ALL", "All languages");
      for (const block of this.langBlocks) {
        dd.addOption(block.language, block.language);
      }
      dd.setValue(this.languageKey);
      dd.onChange((v) => {
        this.languageKey = v;
        this.rebuildVersions();
      });
    });
    this.versionsContainer = contentEl.createDiv();
    this.rebuildVersions();
    this.renderExtraOptions(contentEl);
    this.renderFooter(contentEl);
  }
  rebuildVersions() {
    this.versionsContainer.empty();
    const list = this.translationsForLanguage(this.languageKey);
    new import_obsidian3.Setting(this.versionsContainer).setName("Version").addDropdown((dd) => {
      const sel = dd.selectEl;
      sel.style.maxWidth = "360px";
      sel.style.whiteSpace = "nowrap";
      if (!list.length) {
        dd.addOption("", "(no translations)");
        dd.setValue("");
        this.translationCode = "";
        this.translationFull = "";
        return;
      }
      for (const t of list) dd.addOption(t.short_name, `${t.short_name} \u2014 ${t.full_name}`);
      const exists = list.some((t) => t.short_name === this.translationCode);
      const chosen = exists ? this.translationCode : list[0].short_name;
      dd.setValue(chosen);
      this.translationCode = chosen;
      const tt = list.find((x) => x.short_name === chosen);
      this.translationFull = tt?.full_name ?? chosen;
      dd.onChange((v) => {
        this.translationCode = v;
        const t2 = list.find((x) => x.short_name === v);
        this.translationFull = t2?.full_name ?? v;
      });
    });
  }
};

// src/ui/pick-version-modal.ts
var PickVersionModal = class extends BaseBollsModal {
  constructor(app, settings, onPick) {
    super(app, settings, {
      languageLabel: settings.bibleDefaultLanguage ?? null,
      versionShort: settings.bibleDefaultVersion ?? null
    });
    this.onPick = onPick;
  }
  renderFooter(contentEl) {
    new import_obsidian4.Setting(contentEl).setName("How to link").setDesc("If you cancel, links will use default (no version).").addButton(
      (b) => b.setButtonText("Use selected version").setCta().onClick(() => {
        this.close();
        this.onPick(this.translationCode || null);
      })
    ).addExtraButton(
      (b) => b.setIcon("x").setTooltip("Cancel (no version)").onClick(() => {
        this.close();
        this.onPick(null);
      })
    );
  }
};

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
async function commandVerseLinks(app, settings, params) {
  const scope = params?.scope ?? "current";
  const file = app.workspace.getActiveFile();
  if (scope === "folder") {
    const active = file;
    const folder = active?.parent;
    if (!active || !folder) {
      new import_obsidian5.Notice("Open a file inside the target folder.");
      return;
    }
    for (const child of folder.children) {
      if (child instanceof import_obsidian5.TFile && child.extension === "md") {
        const content2 = await app.vault.read(child);
        const { yaml: yaml2, body: body2 } = splitFrontmatter(content2);
        const linked2 = await linkVersesInText(body2, settings, null);
        await app.vault.modify(child, (yaml2 ?? "") + linked2);
      }
    }
    new import_obsidian5.Notice("Linked verses in folder.");
    return;
  }
  if (!file) {
    new import_obsidian5.Notice("Open a file first.");
    return;
  }
  const content = await app.vault.read(file);
  const { yaml, body } = splitFrontmatter(content);
  const linked = await linkVersesInText(body, settings, null);
  await app.vault.modify(file, (yaml ?? "") + linked);
  new import_obsidian5.Notice("Linked verses in current file.");
}
async function commandVerseLinksSelectionOrLine(app, settings) {
  const mdView = app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
  if (!mdView) {
    new import_obsidian5.Notice("Open a Markdown file first.");
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
      new import_obsidian5.Notice("Linked verses in selection.");
    } else {
      new import_obsidian5.Notice("No linkable verses in selection.");
    }
    return;
  }
  const line = editor.getCursor().line;
  const lineText = editor.getLine(line);
  const linked = await run(lineText);
  if (linked !== lineText) {
    editor.setLine(line, linked);
    new import_obsidian5.Notice("Linked verses on current line.");
  } else {
    new import_obsidian5.Notice("No linkable verses on current line.");
  }
}
async function commandVerseLinksChooseVersion(app, settings) {
  const file = app.workspace.getActiveFile();
  if (!file) {
    new import_obsidian5.Notice("Open a file first.");
    return;
  }
  return await new Promise((resolve) => {
    new PickVersionModal(app, settings, async (versionShort) => {
      const content = await app.vault.read(file);
      const { yaml, body } = splitFrontmatter(content);
      const linked = await linkVersesInText(body, settings, versionShort);
      await app.vault.modify(file, (yaml ?? "") + linked);
      new import_obsidian5.Notice(versionShort ? `Linked verses (\u2192 ${versionShort}).` : "Linked verses (no version).");
      resolve(linked);
    }).open();
  });
}
async function commandVerseLinksSelectionOrLineChooseVersion(app, settings) {
  const mdView = app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
  if (!mdView) {
    new import_obsidian5.Notice("Open a Markdown file first.");
    return;
  }
  return await new Promise((resolve) => {
    new PickVersionModal(app, settings, async (versionShort) => {
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
          new import_obsidian5.Notice(
            versionShort ? `Linked (selection) \u2192 ${versionShort}.` : "Linked (selection) without version."
          );
        } else {
          new import_obsidian5.Notice("No linkable verses in selection.");
        }
        return;
      }
      const line = editor.getCursor().line;
      const lineText = editor.getLine(line);
      const linked = await run(lineText);
      if (linked !== lineText) {
        editor.setLine(line, linked);
        new import_obsidian5.Notice(versionShort ? `Linked (line) \u2192 ${versionShort}.` : "Linked (line) without version.");
      } else {
        new import_obsidian5.Notice("No linkable verses on current line.");
      }
      resolve(linked);
    }).open();
  });
}

// src/commands/addNextPrevious.ts
var import_obsidian6 = require("obsidian");
function tokenFromFilename(name) {
  const m = name.match(/^(\d+)/);
  if (!m) return null;
  return parseInt(m[1], 10);
}
async function commandAddNextPrevious(app, _settings, _params) {
  const file = app.workspace.getActiveFile();
  if (!file) {
    new import_obsidian6.Notice("Open a file first.");
    return;
  }
  const parent = file.parent;
  if (!(parent instanceof import_obsidian6.TFolder)) {
    new import_obsidian6.Notice("Current file has no folder.");
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
  new import_obsidian6.Notice("Inserted Next/Previous links.");
}

// src/commands/addFolderIndex.ts
var import_obsidian7 = require("obsidian");

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
  const indexPath = (0, import_obsidian7.normalizePath)(folder.path + "/" + idxName + ".md");
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
  if (existing instanceof import_obsidian7.TFile) {
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
    new import_obsidian7.Notice(`No leaf folders under ${baseFolder}`);
    return;
  }
  let changed = 0;
  for (const folder of folders) {
    const did = await createOrUpdateIndexForFolder(app, settings, folder, true);
    if (did) changed++;
  }
  new import_obsidian7.Notice(changed > 0 ? `Folder indexes created/updated: ${changed}` : "No changes; indexes already present.");
}
async function commandAddIndexForCurrentFolder(app, settings) {
  const active = app.workspace.getActiveFile();
  const folder = active?.parent;
  if (!active || !folder) {
    new import_obsidian7.Notice("Open a file inside the target folder.");
    return;
  }
  const did = await createOrUpdateIndexForFolder(app, settings, folder, false);
  new import_obsidian7.Notice(did ? `Index created/updated for \u201C${folder.name}\u201D.` : `No index change in \u201C${folder.name}\u201D.`);
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
var import_obsidian8 = require("obsidian");
async function commandExtractHighlightsFolder(app, settings) {
  const view = app.workspace.getActiveFile();
  const startFolder = view?.parent ?? app.vault.getFolderByPath(settings.baseFolder);
  if (!(startFolder instanceof import_obsidian8.TFolder)) {
    new import_obsidian8.Notice("Open a file in the target folder or set a valid base folder.");
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
    new import_obsidian8.Notice("No highlights found in folder.");
    return;
  }
  const out = all.join("\n");
  const target = startFolder.path + "/Highlights.md";
  const existing = app.vault.getFileByPath(target);
  if (existing) await app.vault.modify(existing, out);
  else await app.vault.create(target, out);
  new import_obsidian8.Notice("Highlights.md created.");
}

// src/commands/extractRedHighlights.ts
var import_obsidian9 = require("obsidian");
async function commandExtractRedHighlights(app, settings) {
  const file = app.workspace.getActiveFile();
  if (!file) {
    new import_obsidian9.Notice("Open a file first.");
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
    new import_obsidian9.Notice("No red highlights found.");
    return;
  }
  const section = [
    "> [!summary]- Highlights",
    ...hits.map((h) => `> - ${h}`),
    ""
  ].join("\n");
  const merged = insertAfterYamlOrH1(src, section);
  await app.vault.modify(file, merged);
  new import_obsidian9.Notice("Highlights section inserted.");
}

// src/commands/outlineExtractor.ts
var import_obsidian10 = require("obsidian");
async function commandOutlineExtractor(app, _settings) {
  const file = app.workspace.getActiveFile();
  if (!file) {
    new import_obsidian10.Notice("Open a file first.");
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
    new import_obsidian10.Notice("No headings (##..######) found.");
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
  new import_obsidian10.Notice("Outline appended successfully.");
}

// src/commands/outlineFormatter.ts
var import_obsidian12 = require("obsidian");

// src/lib/outlineUtils.ts
var import_obsidian11 = require("obsidian");
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
  new import_obsidian11.Notice("Outline formatted" + (settings.autoLinkVerses ? " + verses linked." : "."));
  return result;
}

// src/commands/outlineFormatter.ts
async function commandOutlineFormatter(app, settings) {
  const file = app.workspace.getActiveFile();
  if (!file) {
    new import_obsidian12.Notice("Open a file first.");
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
  new import_obsidian12.Notice("Outline formatted.");
}

// src/commands/generateBible.ts
var import_obsidian14 = require("obsidian");

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

// src/ui/build-bible-modal.ts
var import_obsidian13 = require("obsidian");
var BuildBibleModal = class extends BaseBollsModal {
  constructor(app, settings) {
    super(app, settings, {
      languageLabel: settings.bibleDefaultLanguage ?? null,
      versionShort: settings.bibleDefaultVersion ?? null
    });
    this.concurrency = 4;
    this.working = false;
    this.includeVersionInFileName = settings.bibleIncludeVersionInFilename ?? true;
    this.versionAsSubfolder = settings.bibleIncludeVersionInFilename ?? true;
    this.autoFrontmatter = settings.bibleAddFrontmatter ?? false;
  }
  renderExtraOptions(contentEl) {
    new import_obsidian13.Setting(contentEl).setName("Append version to file name").setDesc(`"John (KJV)" vs "John"`).addToggle((t) => t.setValue(this.includeVersionInFileName).onChange((v) => this.includeVersionInFileName = v));
    new import_obsidian13.Setting(contentEl).setName("Place books under version subfolder").setDesc(`"_Bible/KJV/John (KJV)" vs "_Bible/John"`).addToggle((t) => t.setValue(this.versionAsSubfolder).onChange((v) => this.versionAsSubfolder = v));
    new import_obsidian13.Setting(contentEl).setName("Auto-add frontmatter").setDesc("Insert YAML with title/version/created into each book file").addToggle((t) => t.setValue(this.autoFrontmatter).onChange((v) => this.autoFrontmatter = v));
    new import_obsidian13.Setting(contentEl).setName("Concurrency").setDesc("How many chapters to download in parallel").addSlider((s) => s.setLimits(1, 8, 1).setValue(this.concurrency).onChange((v) => this.concurrency = v).setDynamicTooltip());
  }
  renderFooter(contentEl) {
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
      new import_obsidian13.Notice("Choose a translation code.");
      this.working = false;
      this.startBtn.disabled = false;
      return;
    }
    try {
      await buildBibleFromBolls(this.app, {
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
      new import_obsidian13.Notice(`Bible build failed: ${e?.message ?? e}`);
    } finally {
      this.working = false;
      this.startBtn.disabled = false;
    }
  }
};

// src/commands/generateBible.ts
var BOLLS2 = {
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
async function fetchJson(url) {
  try {
    const resp = await (0, import_obsidian14.requestUrl)({ url, method: "GET" });
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
function nowIsoDate() {
  const d = /* @__PURE__ */ new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
async function ensureFolder(app, path) {
  const np = (0, import_obsidian14.normalizePath)(path.replace(/\/+$/, ""));
  let f = app.vault.getAbstractFileByPath(np);
  if (f instanceof import_obsidian14.TFolder) return f;
  await app.vault.createFolder(np);
  const created = app.vault.getAbstractFileByPath(np);
  if (created instanceof import_obsidian14.TFolder) return created;
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
    books = await fetchJson(BOLLS2.GET_BOOKS(opts.translationCode));
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
    const targetPath = (0, import_obsidian14.normalizePath)(`${parent.path}/${fileBase}.md`);
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
          const verses = await fetchJson(BOLLS2.GET_CHAPTER(opts.translationCode, book.bookid, ch));
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
    if (existing instanceof import_obsidian14.TFile) {
      await app.vault.modify(existing, bookContent);
    } else {
      await app.vault.create(targetPath, bookContent);
    }
  }
  if (errors.length) {
    new import_obsidian14.Notice(`Finished with ${errors.length} error(s).`);
  } else {
    new import_obsidian14.Notice("Finished without errors.");
  }
}
function commandBuildBibleFromBolls(app, _settings) {
  new BuildBibleModal(app, _settings).open();
}

// src/main.ts
var ObsidianBibleTools = class extends import_obsidian15.Plugin {
  async onload() {
    console.log("Loading Bible Tools\u2026");
    registerIcons(import_obsidian15.addIcon);
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
    console.log("Unloading Bible Tools\u2026");
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3NldHRpbmdzLnRzIiwgInNyYy9jb21tYW5kcy92ZXJzZUxpbmtzLnRzIiwgInNyYy9saWIvbWRVdGlscy50cyIsICJzcmMvdWkvcGljay12ZXJzaW9uLW1vZGFsLnRzIiwgInNyYy91aS9ib2xscy1iYXNlLW1vZGFsLnRzIiwgInNyYy9jb21tYW5kcy9hZGROZXh0UHJldmlvdXMudHMiLCAic3JjL2NvbW1hbmRzL2FkZEZvbGRlckluZGV4LnRzIiwgInNyYy9saWIvdGV4dFV0aWxzLnRzIiwgInNyYy9wcm90b2NvbC50cyIsICJzcmMvaWNvbnMudHMiLCAic3JjL2NvbW1hbmRzL2V4dHJhY3RIaWdobGlnaHRzRm9sZGVyLnRzIiwgInNyYy9jb21tYW5kcy9leHRyYWN0UmVkSGlnaGxpZ2h0cy50cyIsICJzcmMvY29tbWFuZHMvb3V0bGluZUV4dHJhY3Rvci50cyIsICJzcmMvY29tbWFuZHMvb3V0bGluZUZvcm1hdHRlci50cyIsICJzcmMvbGliL291dGxpbmVVdGlscy50cyIsICJzcmMvY29tbWFuZHMvZ2VuZXJhdGVCaWJsZS50cyIsICJzcmMvbGliL3ZlcnNlTWFwLnRzIiwgInNyYy91aS9idWlsZC1iaWJsZS1tb2RhbC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFBsdWdpbiwgYWRkSWNvbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzLCBERUZBVUxUX1NFVFRJTkdTLCBCaWJsZVRvb2xzU2V0dGluZ1RhYiB9IGZyb20gXCIuL3NldHRpbmdzXCI7XG5pbXBvcnQgeyByZWdpc3RlclByb3RvY29sIH0gZnJvbSBcIi4vcHJvdG9jb2xcIjtcbmltcG9ydCB7IHJlZ2lzdGVySWNvbnMgfSBmcm9tIFwiLi9pY29uc1wiO1xuXG4vLyBDb21tYW5kc1xuaW1wb3J0IHsgY29tbWFuZEFkZEZvbGRlckluZGV4LCBjb21tYW5kQWRkSW5kZXhGb3JDdXJyZW50Rm9sZGVyIH0gZnJvbSBcIi4vY29tbWFuZHMvYWRkRm9sZGVySW5kZXhcIjtcbmltcG9ydCB7IGNvbW1hbmRBZGROZXh0UHJldmlvdXMgfSBmcm9tIFwiLi9jb21tYW5kcy9hZGROZXh0UHJldmlvdXNcIjtcbmltcG9ydCB7IGNvbW1hbmRFeHRyYWN0SGlnaGxpZ2h0c0ZvbGRlciB9IGZyb20gXCIuL2NvbW1hbmRzL2V4dHJhY3RIaWdobGlnaHRzRm9sZGVyXCI7XG5pbXBvcnQgeyBjb21tYW5kRXh0cmFjdFJlZEhpZ2hsaWdodHMgfSBmcm9tIFwiLi9jb21tYW5kcy9leHRyYWN0UmVkSGlnaGxpZ2h0c1wiO1xuaW1wb3J0IHsgY29tbWFuZE91dGxpbmVFeHRyYWN0b3IgfSBmcm9tIFwiLi9jb21tYW5kcy9vdXRsaW5lRXh0cmFjdG9yXCI7XG5pbXBvcnQgeyBjb21tYW5kT3V0bGluZUZvcm1hdHRlciB9IGZyb20gXCIuL2NvbW1hbmRzL291dGxpbmVGb3JtYXR0ZXJcIjtcbmltcG9ydCB7IGNvbW1hbmRWZXJzZUxpbmtzLCBjb21tYW5kVmVyc2VMaW5rc0Nob29zZVZlcnNpb24sIGNvbW1hbmRWZXJzZUxpbmtzU2VsZWN0aW9uT3JMaW5lLCBjb21tYW5kVmVyc2VMaW5rc1NlbGVjdGlvbk9yTGluZUNob29zZVZlcnNpb24gfSBmcm9tIFwiLi9jb21tYW5kcy92ZXJzZUxpbmtzXCI7XG5pbXBvcnQgeyBjb21tYW5kQnVpbGRCaWJsZUZyb21Cb2xscyB9IGZyb20gXCIuL2NvbW1hbmRzL2dlbmVyYXRlQmlibGVcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2JzaWRpYW5CaWJsZVRvb2xzIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncztcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgY29uc29sZS5sb2coXCJMb2FkaW5nIEJpYmxlIFRvb2xzXHUyMDI2XCIpO1xuICAgIHJlZ2lzdGVySWNvbnMoYWRkSWNvbik7XG5cbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcblxuICAgIC8vIFNldHRpbmdzIFVJXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBCaWJsZVRvb2xzU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuXG4gICAgLy8gUmliYm9uIGljb24gKGRlc2t0b3ApXG4gICAgdGhpcy5hZGRSaWJib25JY29uKFwib2J0Yi1ib29rXCIsIFwiQmlibGUgVG9vbHM6IEZvbGRlciBJbmRleFwiLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBjb21tYW5kQWRkRm9sZGVySW5kZXgodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpO1xuICAgIH0pO1xuXG4gICAgLy8gQ29tbWFuZHNcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib2J0Yi1hZGQtZm9sZGVyLWluZGV4XCIsXG4gICAgICBuYW1lOiBcIkNyZWF0ZS9VcGRhdGUgRm9sZGVyIEluZGV4IChCb29rcylcIixcbiAgICAgIGljb246IFwib2J0Yi1ib29rXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4gY29tbWFuZEFkZEZvbGRlckluZGV4KHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImFkZC1pbmRleC1mb3ItY3VycmVudC1mb2xkZXJcIixcbiAgICAgIG5hbWU6IFwiQ3JlYXRlL1VwZGF0ZSBGb2xkZXIgSW5kZXggZm9yIEN1cnJlbnQgRm9sZGVyXCIsXG4gICAgICBpY29uOiBcImxpc3Qtb3JkZXJlZFwiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgY29tbWFuZEFkZEluZGV4Rm9yQ3VycmVudEZvbGRlcih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyk7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9idGItYWRkLW5leHQtcHJldmlvdXNcIixcbiAgICAgIG5hbWU6IFwiSW5zZXJ0IE5leHQvUHJldmlvdXMgTGlua3MgKEN1cnJlbnQgRm9sZGVyKVwiLFxuICAgICAgaWNvbjogXCJvYnRiLWxpbmtzXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4gY29tbWFuZEFkZE5leHRQcmV2aW91cyh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncylcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvYnRiLWV4dHJhY3QtcmVkLWhpZ2hsaWdodHNcIixcbiAgICAgIG5hbWU6IFwiRXh0cmFjdCBSZWQgSGlnaGxpZ2h0cyB0byBjdXJyZW50IGZpbGVcIixcbiAgICAgIGljb246IFwib2J0Yi1oaWdobGlnaHRlclwiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IGNvbW1hbmRFeHRyYWN0UmVkSGlnaGxpZ2h0cyh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncylcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvYnRiLWV4dHJhY3QtaGlnaGxpZ2h0cy1mb2xkZXJcIixcbiAgICAgIG5hbWU6IFwiQ3JlYXRlIEhpZ2hsaWdodHMubWQgZnJvbSBmb2xkZXJcIixcbiAgICAgIGljb246IFwib2J0Yi1zdW1tYXJ5XCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4gY29tbWFuZEV4dHJhY3RIaWdobGlnaHRzRm9sZGVyKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9idGItb3V0bGluZS1leHRyYWN0XCIsXG4gICAgICBuYW1lOiBcIkFwcGVuZCBPdXRsaW5lIChmcm9tICMjLi4uIyMjIyMjIGhlYWRpbmdzKVwiLFxuICAgICAgaWNvbjogXCJvYnRiLW91dGxpbmVcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiBjb21tYW5kT3V0bGluZUV4dHJhY3Rvcih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncylcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvYnRiLW91dGxpbmUtZm9ybWF0XCIsXG4gICAgICBuYW1lOiBcIkZvcm1hdCBPdXRsaW5lIChSb21hbi9BLzEvYSBcdTIxOTIgTWFya2Rvd24gaGVhZGluZ3MpIGFuZCBMaW5rIFZlcnNlc1wiLFxuICAgICAgaWNvbjogXCJvYnRiLWZvcm1hdHRlclwiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IGNvbW1hbmRPdXRsaW5lRm9ybWF0dGVyKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9idGItdmVyc2UtbGlua3NcIixcbiAgICAgIG5hbWU6IFwiQXV0by1saW5rIEJpYmxlIHZlcnNlcyAoZmlsZSBvciBmb2xkZXIpXCIsXG4gICAgICBpY29uOiBcIm9idGItYmlibGVcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiBjb21tYW5kVmVyc2VMaW5rcyh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncylcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJsaW5rLXZlcnNlcy1zZWxlY3Rpb24tb3ItbGluZVwiLFxuICAgICAgbmFtZTogXCJMaW5rIHZlcnNlcyBpbiBzZWxlY3Rpb24gKG9yIGN1cnJlbnQgbGluZSlcIixcbiAgICAgIGljb246IFwibGluay0yXCIsIC8vIGFwcGVhcnMgaW4gbW9iaWxlIGNvbW1hbmQgYmFyXG4gICAgICBlZGl0b3JDYWxsYmFjazogYXN5bmMgKF9lZGl0b3IsIF92aWV3KSA9PiB7XG4gICAgICAgIGF3YWl0IGNvbW1hbmRWZXJzZUxpbmtzU2VsZWN0aW9uT3JMaW5lKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKTtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyB0aGlzLmFkZENvbW1hbmQoe1xuICAgIC8vICAgaWQ6IFwiZ2VuZXJhdGUtYmlibGUtdmF1bHRcIixcbiAgICAvLyAgIG5hbWU6IFwiR2VuZXJhdGUgX0JpYmxlIGZvbGRlciBhbmQgZmlsZXNcdTIwMjZcIixcbiAgICAvLyAgIGNhbGxiYWNrOiAoKSA9PiBvcGVuQmlibGVCdWlsZE1vZGFsKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKSxcbiAgICAvLyB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJidWlsZC1iaWJsZS1mcm9tLWJvbGxzXCIsXG4gICAgICBuYW1lOiBcIkJ1aWxkIF9CaWJsZSAoZG93bmxvYWQgZnJvbSBib2xscy5saWZlKVwiLFxuICAgICAgaWNvbjogXCJib29rLW9wZW5cIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiBjb21tYW5kQnVpbGRCaWJsZUZyb21Cb2xscyh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyksXG4gICAgfSk7XG5cbiAgICAvLyBpbiBtYWluIHBsdWdpbiBmaWxlIChlLmcuLCBzcmMvbWFpbi50cykgaW5zaWRlIG9ubG9hZCgpXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImxpbmstdmVyc2VzLWN1cnJlbnQtY2hvb3NlLXZlcnNpb25cIixcbiAgICAgIG5hbWU6IFwiTGluayB2ZXJzZXMgKGNob29zZSB2ZXJzaW9uXHUyMDI2KVwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IGNvbW1hbmRWZXJzZUxpbmtzQ2hvb3NlVmVyc2lvbih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyksXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibGluay12ZXJzZXMtc2VsZWN0aW9uLW9yLWxpbmUtY2hvb3NlLXZlcnNpb25cIixcbiAgICAgIG5hbWU6IFwiTGluayB2ZXJzZXMgaW4gc2VsZWN0aW9uL2xpbmUgKGNob29zZSB2ZXJzaW9uXHUyMDI2KVwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IGNvbW1hbmRWZXJzZUxpbmtzU2VsZWN0aW9uT3JMaW5lQ2hvb3NlVmVyc2lvbih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyksXG4gICAgfSk7XG5cbiAgICAvLyBvYnNpZGlhbjovLyBwcm90b2NvbCBoYW5kbGVyIGZvciBjb21tYW5kIGxpbmUgdHJpZ2dlcnNcbiAgICByZWdpc3RlclByb3RvY29sKHRoaXMpO1xuICB9XG5cbiAgYXN5bmMgb251bmxvYWQoKSB7XG4gICAgY29uc29sZS5sb2coXCJVbmxvYWRpbmcgQmlibGUgVG9vbHNcdTIwMjZcIik7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTm90aWNlLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgT2JzaWRpYW5CaWJsZVRvb2xzIGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB7IEJvbGxzTGFuZ3VhZ2UgfSBmcm9tIFwiLi91aS9ib2xscy1iYXNlLW1vZGFsXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmlibGVUb29sc1NldHRpbmdzIHtcbiAgYmFzZUZvbGRlcjogc3RyaW5nO1xuICByZWRNYXJrQ3NzOiBzdHJpbmc7XG4gIGluZGV4RmlsZU5hbWVNb2RlOiBcImZvbGRlci1uYW1lXCIgfCBcImFydGljbGUtc3R5bGVcIjtcbiAgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZTogYm9vbGVhbjsgLy8gSWYgdHJ1ZSwgc3RyaXAgTWFya2Rvd24gbGlua3MgdGhhdCBsb29rIGxpa2Ugc2NyaXB0dXJlIHJlZmVyZW5jZXMgKGUuZy4sIFtSb20uIDE6MV0odXJsKSBcdTIxOTIgUm9tLiAxOjEpXG4gIHJlbW92ZU9ic2lkaWFuRGlzcGxheUxpbmtzOiBib29sZWFuOyAvLyBJZiB0cnVlLCByZW1vdmUgT2JzaWRpYW4gZGlzcGxheS10ZXh0IGxpbmtzIHRoYXQgbG9vayBsaWtlIHNjcmlwdHVyZSByZWZlcmVuY2VzIChlLmcuLCBbW1JvbS4gMToxfFJvbS4gMToxXV0gXHUyMTkyIFJvbS4gMToxKVxuICByZXdyaXRlT2xkT2JzaWRpYW5MaW5rczogYm9vbGVhbjsgLy8gSWYgdHJ1ZSwgcmV3cml0ZSBsZWdhY3kgT2JzaWRpYW4gbGlua3MgKGUuZy4sIFtbUm9tIDEjXjN8XHUyMDI2XV0gXHUyMTkyIFtbUm9tI14xLTN8XHUyMDI2XV0pIGFuZCByZW1vdmUgcHJldmlvdXMgT2JzaWRpYW4gbGlua3MgdGhhdCBoYXZlIHZlcnNlLWxpa2UgZGlzcGxheSBwYXR0ZXJuXG5cbiAgYXV0b0xpbmtWZXJzZXM6IGJvb2xlYW47IC8vIElmIHRydWUsIGF1dG8tbGluayB2ZXJzZXMgaW4gdGhlIGN1cnJlbnQgZmlsZSB3aGVuIGZvcm1hdHRpbmcgb3V0bGluZXNcblxuICAvLyBCaWJsZSBnZW5lcmF0aW9uIGRlZmF1bHRzXG4gIGJpYmxlRGVmYXVsdFZlcnNpb246IHN0cmluZzsgICAgICAgICAgICAgIC8vIGUuZy4gXCJLSlZcIlxuICBiaWJsZURlZmF1bHRMYW5ndWFnZTogc3RyaW5nOyAgICAgICAgICAgICAvLyBlLmcuIFwiRW5nbGlzaFwiLFxuICBiaWJsZUluY2x1ZGVWZXJzaW9uSW5GaWxlbmFtZTogYm9vbGVhbjsgICAvLyBcIkpvaG4gKEtKVilcIiAmIF9CaWJsZS9LSlYvXG4gIGJpYmxlQWRkRnJvbnRtYXR0ZXI6IGJvb2xlYW47ICAgICAgICAgICAgIC8vIGFkZCBZQU1MIGZyb250bWF0dGVyIGF0IHRvcFxuXG4gIC8vIENhY2hpbmcgb2YgQm9sbHMgY2F0YWxvZ3VlICh0byBhdm9pZCByZS1mZXRjaGluZyBldmVyeSB0aW1lKVxuICBib2xsc0NhdGFsb2d1ZUNhY2hlPzogQm9sbHNMYW5ndWFnZVtdO1xuICBib2xsc0NhdGFsb2d1ZUNhY2hlZEF0PzogbnVtYmVyO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRVRUSU5HUzogQmlibGVUb29sc1NldHRpbmdzID0ge1xuICBiYXNlRm9sZGVyOiBcIkJvb2tzXCIsXG4gIHJlZE1hcmtDc3M6ICdiYWNrZ3JvdW5kOiAjRkY1NTgyQTY7JyxcbiAgaW5kZXhGaWxlTmFtZU1vZGU6IFwiYXJ0aWNsZS1zdHlsZVwiLFxuICBzdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlOiB0cnVlLFxuICByZW1vdmVPYnNpZGlhbkRpc3BsYXlMaW5rczogZmFsc2UsXG4gIHJld3JpdGVPbGRPYnNpZGlhbkxpbmtzOiB0cnVlLFxuICBhdXRvTGlua1ZlcnNlczogdHJ1ZSxcblxuICAvLyBCaWJsZSBnZW5lcmF0aW9uIGRlZmF1bHRzXG4gIGJpYmxlRGVmYXVsdFZlcnNpb246IFwiS0pWXCIsXG4gIGJpYmxlRGVmYXVsdExhbmd1YWdlOiBcIkVuZ2xpc2hcIixcbiAgYmlibGVJbmNsdWRlVmVyc2lvbkluRmlsZW5hbWU6IHRydWUsXG4gIGJpYmxlQWRkRnJvbnRtYXR0ZXI6IGZhbHNlLFxuXG4gIGJvbGxzQ2F0YWxvZ3VlQ2FjaGU6IHVuZGVmaW5lZCxcbiAgYm9sbHNDYXRhbG9ndWVDYWNoZWRBdDogdW5kZWZpbmVkLFxufTtcblxuZXhwb3J0IGNsYXNzIEJpYmxlVG9vbHNTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHBsdWdpbjogT2JzaWRpYW5CaWJsZVRvb2xzO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IE9ic2lkaWFuQmlibGVUb29scykge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiQmlibGUgVG9vbHMgXHUyMDE0IFNldHRpbmdzXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRGVmYXVsdCBiYXNlIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJSb290IGZvbGRlciB0byBzY2FuIHdoZW4gYSBjb21tYW5kIG5lZWRzIGEgZm9sZGVyIChlLmcuLCBpbmRleCBjcmVhdGlvbikuXCIpXG4gICAgICAuYWRkVGV4dCh0ID0+IHQuc2V0UGxhY2Vob2xkZXIoXCJCb29rc1wiKS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYXNlRm9sZGVyKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHYpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFzZUZvbGRlciA9IHYgfHwgXCJCb29rc1wiOyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkluZGV4IGZpbGVuYW1lIG1vZGVcIilcbiAgICAgIC5zZXREZXNjKCdJZiBhIGZvbGRlciBlbmRzIHdpdGggXCIsIFRoZVwiIG9yIFwiLCBBXCIsIGNvbnZlcnQgdG8gXCJUaGUgXHUyMDI2XCIgLyBcIkEgXHUyMDI2XCIuJylcbiAgICAgIC5hZGREcm9wZG93bihkZCA9PiBkZFxuICAgICAgICAuYWRkT3B0aW9uKFwiZm9sZGVyLW5hbWVcIiwgXCJLZWVwIGZvbGRlciBuYW1lXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJhcnRpY2xlLXN0eWxlXCIsIFwiQXJ0aWNsZSBzdHlsZSAoXHUyMDE4LCBUaGVcdTIwMTkgXHUyMTkyIFx1MjAxOFRoZSBcdTIwMjZcdTIwMTkpXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbmRleEZpbGVOYW1lTW9kZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmluZGV4RmlsZU5hbWVNb2RlID0gKHZhbHVlIGFzIFwiZm9sZGVyLW5hbWVcIiB8IFwiYXJ0aWNsZS1zdHlsZVwiKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlJlZCBoaWdobGlnaHQgQ1NTXCIpXG4gICAgICAuc2V0RGVzYyhcIkV4YWN0IHN0eWxlIGEgPG1hcms+IHRhZyBtdXN0IGhhdmUgdG8gYmUgY29uc2lkZXJlZCBhIHJlZCBoaWdobGlnaHQuXCIpXG4gICAgICAuYWRkVGV4dCh0ID0+IHQuc2V0UGxhY2Vob2xkZXIoJ2JhY2tncm91bmQ6ICNGRjU1ODJBNjsnKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucmVkTWFya0NzcylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLnJlZE1hcmtDc3MgPSB2OyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlN0cmlwIE1hcmtkb3duIGxpbmtzIHRoYXQgbG9vayBsaWtlIHNjcmlwdHVyZVwiKVxuICAgICAgLnNldERlc2MoXCJSZXBsYWNlIFtSb20uIDE6MV0odXJsKSB3aXRoIHBsYWluIHRleHQgYmVmb3JlIGxpbmtpbmcgdG8gYW5jaG9ycy5cIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2UpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodikgPT4geyB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlID0gdjsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJSZW1vdmUgT2JzaWRpYW4gZGlzcGxheS10ZXh0IGxpbmtzIHRoYXQgbG9vayBsaWtlIHJlZmVyZW5jZXNcIilcbiAgICAgIC5zZXREZXNjKFwiSWYgW1tUYXJnZXR8RGlzcGxheV1dIGxvb2tzIGxpa2UgYSBzY3JpcHR1cmUgcmVmLCByZXBsYWNlIGl0IHdpdGggcGxhaW4gdGV4dCBiZWZvcmUgbGlua2luZyAoc2FtZSBhcyB0aGUgUHl0aG9uIHNjcmlwdCkuXCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZW1vdmVPYnNpZGlhbkRpc3BsYXlMaW5rcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJTYXZlZDogcmVtb3ZlIE9ic2lkaWFuIGRpc3BsYXktdGV4dCBsaW5rc1wiKTsgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlJld3JpdGUgbGVnYWN5IE9ic2lkaWFuIGxpbmtzXCIpXG4gICAgICAuc2V0RGVzYyhcIkNvbnZlcnQgW1tSb20gMSNeM3xcdTIwMjZdXSBcdTIxOTIgW1tSb20jXjEtM3xcdTIwMjZdXSBiZWZvcmUgbGlua2luZyBhbmQgcmVtb3ZlIHByZXZpb3VzIE9ic2lkaWFuIGxpbmtzIHRoYXQgaGF2ZSB2ZXJzZS1saWtlIGRpc3BsYXkgcGF0dGVybi5cIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0XG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZXdyaXRlT2xkT2JzaWRpYW5MaW5rcylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJld3JpdGVPbGRPYnNpZGlhbkxpbmtzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgbmV3IE5vdGljZShcIlNhdmVkOiByZXdyaXRlIG9sZC1zdHlsZSBsaW5rc1wiKTtcbiAgICAgICAgfSkpO1xuXG4gICAgLy8gVG9nZ2xlOiBBdXRvLWxpbmsgdmVyc2VzIGFmdGVyIG91dGxpbmUgZm9ybWF0dGluZ1xuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJBdXRvLWxpbmsgdmVyc2VzIGFmdGVyIG91dGxpbmUgZm9ybWF0dGluZ1wiKVxuICAgICAgLnNldERlc2MoXCJBZnRlciB0aGUgb3V0bGluZSB0ZXh0IGlzIGZvcm1hdHRlZCwgYXV0b21hdGljYWxseSBsaW5rIHNjcmlwdHVyZSByZWZlcmVuY2VzIGluIHRoZSByZXN1bHQuXCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0xpbmtWZXJzZXMpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodikgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9MaW5rVmVyc2VzID0gdjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAvLyBEZWZhdWx0cyBmb3IgQmlibGUgZ2VuZXJhdG9yXG4gICAgLy8gbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgLy8gLnNldE5hbWUoXCJEZWZhdWx0IEJpYmxlIHZlcnNpb25cIilcbiAgICAvLyAuc2V0RGVzYyhcIlVzZWQgYXMgdGhlIHByZXNlbGVjdGVkIHZlcnNpb24gd2hlbiBnZW5lcmF0aW5nIHRoZSBfQmlibGUgdmF1bHQuXCIpXG4gICAgLy8gLmFkZERyb3Bkb3duKGQgPT4gZFxuICAgIC8vICAgLmFkZE9wdGlvbnMoe1xuICAgIC8vICAgICBLSlY6IFwiS0pWIFx1MjAxMyBLaW5nIEphbWVzIFZlcnNpb25cIixcbiAgICAvLyAgICAgV0VCOiBcIldFQiBcdTIwMTMgV29ybGQgRW5nbGlzaCBCaWJsZVwiLFxuICAgIC8vICAgICBBU1Y6IFwiQVNWIFx1MjAxMyBBbWVyaWNhbiBTdGFuZGFyZCBWZXJzaW9uXCIsXG4gICAgLy8gICAgIFlMVDogXCJZTFQgXHUyMDEzIFlvdW5nJ3MgTGl0ZXJhbCBUcmFuc2xhdGlvblwiLFxuICAgIC8vICAgICBEQVJCWTogXCJEQVJCWSBcdTIwMTMgRGFyYnkgVHJhbnNsYXRpb25cIixcbiAgICAvLyAgICAgQkJFOiBcIkJCRSBcdTIwMTMgQmlibGUgaW4gQmFzaWMgRW5nbGlzaFwiLFxuICAgIC8vICAgfSlcbiAgICAvLyAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5iaWJsZURlZmF1bHRWZXJzaW9uKVxuICAgIC8vICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgLy8gICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb24gPSB2O1xuICAgIC8vICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAvLyAgIH0pXG4gICAgLy8gKTtcblxuICAgIC8vIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgIC8vIC5zZXROYW1lKFwiSW5jbHVkZSB2ZXJzaW9uIGluIGZpbGVuYW1lc1wiKVxuICAgIC8vIC5zZXREZXNjKGBJZiBPTjogZm9sZGVyIHN0cnVjdHVyZSBsaWtlIFwiX0JpYmxlL0tKVi9Kb2huIChLSlYpXCIuIElmIE9GRjogZm9sZGVyIHN0cnVjdHVyZSBsaWtlIFwiX0JpYmxlL0pvaG5cIi5gKVxuICAgIC8vIC5hZGRUb2dnbGUodCA9PiB0XG4gICAgLy8gICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYmlibGVJbmNsdWRlVmVyc2lvbkluRmlsZW5hbWUpXG4gICAgLy8gICAub25DaGFuZ2UoYXN5bmMgKHYpID0+IHtcbiAgICAvLyAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmlibGVJbmNsdWRlVmVyc2lvbkluRmlsZW5hbWUgPSB2O1xuICAgIC8vICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAvLyAgIH0pXG4gICAgLy8gKTtcblxuICAgIC8vIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgIC8vICAgLnNldE5hbWUoXCJBZGQgWUFNTCBmcm9udG1hdHRlciB0byBnZW5lcmF0ZWQgQmlibGUgZmlsZXNcIilcbiAgICAvLyAgIC5zZXREZXNjKCdJZiBPTiwgZWFjaCBib29rIGZpbGUgc3RhcnRzIHdpdGggWUFNTCAodGl0bGUsIHZlcnNpb24sIGJvb2ssIGNoYXB0ZXJzLCBldGMuKS4nKVxuICAgIC8vICAgLmFkZFRvZ2dsZSh0ID0+IHRcbiAgICAvLyAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmJpYmxlQWRkRnJvbnRtYXR0ZXIpXG4gICAgLy8gICAgIC5vbkNoYW5nZShhc3luYyAodikgPT4ge1xuICAgIC8vICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmJpYmxlQWRkRnJvbnRtYXR0ZXIgPSB2O1xuICAgIC8vICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIC8vICAgICB9KVxuICAgIC8vICAgKTtcbiAgfVxufVxuIiwgIi8vIHNyYy9jb21tYW5kcy92ZXJzZUxpbmtzLnRzXG5pbXBvcnQge1xuICBBcHAsXG4gIE1hcmtkb3duVmlldyxcbiAgTW9kYWwsXG4gIE5vdGljZSxcbiAgU2V0dGluZyxcbiAgVEZpbGUsXG4gIHJlcXVlc3RVcmwsXG59IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBzcGxpdEZyb250bWF0dGVyIH0gZnJvbSBcIi4uL2xpYi9tZFV0aWxzXCI7XG5pbXBvcnQgeyBQaWNrVmVyc2lvbk1vZGFsIH0gZnJvbSBcInNyYy91aS9waWNrLXZlcnNpb24tbW9kYWxcIjtcblxuLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIEJPT0sgTUFQIChkZWZhdWx0LCBFbmdsaXNoKVxuICogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuY29uc3QgQk9PS19BQkJSOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAvLyAtLS0tIFBlbnRhdGV1Y2ggLS0tLVxuICBcIkdlbmVzaXNcIjogXCJHZW5cIixcbiAgXCIxIE1vc2VcIjogXCJHZW5cIiwgXCIxTW9zZVwiOiBcIkdlblwiLFxuICBcIjEuIE1vc2VcIjogXCJHZW5cIiwgXCIxLk1vc2VcIjogXCJHZW5cIixcblxuICBcIkV4b2R1c1wiOiBcIkV4b1wiLFxuICBcIjIgTW9zZVwiOiBcIkV4b1wiLCBcIjJNb3NlXCI6IFwiRXhvXCIsXG4gIFwiMi4gTW9zZVwiOiBcIkV4b1wiLCBcIjIuTW9zZVwiOiBcIkV4b1wiLFxuXG4gIFwiTGV2aXRpY3VzXCI6IFwiTGV2XCIsXG4gIFwiMyBNb3NlXCI6IFwiTGV2XCIsIFwiM01vc2VcIjogXCJMZXZcIixcbiAgXCIzLiBNb3NlXCI6IFwiTGV2XCIsIFwiMy5Nb3NlXCI6IFwiTGV2XCIsXG5cbiAgXCJOdW1iZXJzXCI6IFwiTnVtXCIsXG4gIFwiTnVtZXJpXCI6IFwiTnVtXCIsXG4gIFwiNCBNb3NlXCI6IFwiTnVtXCIsIFwiNE1vc2VcIjogXCJOdW1cIixcbiAgXCI0LiBNb3NlXCI6IFwiTnVtXCIsIFwiNC5Nb3NlXCI6IFwiTnVtXCIsXG5cbiAgXCJEZXV0ZXJvbm9teVwiOiBcIkRldXRcIixcbiAgXCJEZXV0ZXJvbm9taXVtXCI6IFwiRGV1dFwiLFxuICBcIjUgTW9zZVwiOiBcIkRldXRcIiwgXCI1TW9zZVwiOiBcIkRldXRcIixcbiAgXCI1LiBNb3NlXCI6IFwiRGV1dFwiLCBcIjUuTW9zZVwiOiBcIkRldXRcIixcblxuICAvLyAtLS0tIEhpc3RvcmljYWwgLS0tLVxuICBcIkpvc2h1YVwiOiBcIkpvc2hcIiwgXCJKb3N1YVwiOiBcIkpvc2hcIixcbiAgXCJKdWRnZXNcIjogXCJKdWRnXCIsIFwiUmljaHRlclwiOiBcIkp1ZGdcIixcbiAgXCJSdXRoXCI6IFwiUnV0aFwiLFxuXG4gIFwiMSBTYW11ZWxcIjogXCIxIFNhbVwiLCBcIjEuIFNhbXVlbFwiOiBcIjEgU2FtXCIsIFwiMVNhbXVlbFwiOiBcIjEgU2FtXCIsIFwiMS5TYW11ZWxcIjogXCIxIFNhbVwiLFxuICBcIjIgU2FtdWVsXCI6IFwiMiBTYW1cIiwgXCIyLiBTYW11ZWxcIjogXCIyIFNhbVwiLCBcIjJTYW11ZWxcIjogXCIyIFNhbVwiLCBcIjIuU2FtdWVsXCI6IFwiMiBTYW1cIixcblxuICBcIjEgS2luZ3NcIjogXCIxIEtpbmdzXCIsIFwiMS4gS1x1MDBGNm5pZ2VcIjogXCIxIEtpbmdzXCIsIFwiMUtcdTAwRjZuaWdlXCI6IFwiMSBLaW5nc1wiLCBcIjEuS1x1MDBGNm5pZ2VcIjogXCIxIEtpbmdzXCIsXG4gIFwiMiBLaW5nc1wiOiBcIjIgS2luZ3NcIiwgXCIyLiBLXHUwMEY2bmlnZVwiOiBcIjIgS2luZ3NcIiwgXCIyS1x1MDBGNm5pZ2VcIjogXCIyIEtpbmdzXCIsIFwiMi5LXHUwMEY2bmlnZVwiOiBcIjIgS2luZ3NcIixcblxuICBcIjEgQ2hyb25pY2xlc1wiOiBcIjEgQ2hyb25cIiwgXCIxLiBDaHJvbmlrXCI6IFwiMSBDaHJvblwiLCBcIjFDaHJvbmlrXCI6IFwiMSBDaHJvblwiLCBcIjEuQ2hyb25pa1wiOiBcIjEgQ2hyb25cIixcbiAgXCIyIENocm9uaWNsZXNcIjogXCIyIENocm9uXCIsIFwiMi4gQ2hyb25pa1wiOiBcIjIgQ2hyb25cIiwgXCIyQ2hyb25pa1wiOiBcIjIgQ2hyb25cIiwgXCIyLkNocm9uaWtcIjogXCIyIENocm9uXCIsXG5cbiAgXCJFenJhXCI6IFwiRXpyYVwiLCBcIkVzcmFcIjogXCJFenJhXCIsXG4gIFwiTmVoZW1pYWhcIjogXCJOZWhcIiwgXCJOZWhlbWlhXCI6IFwiTmVoXCIsXG4gIFwiRXN0aGVyXCI6IFwiRXN0aFwiLFxuICBcIkpvYlwiOiBcIkpvYlwiLCBcIkhpb2JcIjogXCJKb2JcIixcblxuICAvLyAtLS0tIFdpc2RvbSAtLS0tXG4gIFwiUHNhbG1zXCI6IFwiUHNhXCIsIFwiUHNhbG1cIjogXCJQc2FcIiwgXCJQc1wiOiBcIlBzYVwiLFxuICBcIlByb3ZlcmJzXCI6IFwiUHJvdlwiLCBcIlNwclx1MDBGQ2NoZVwiOiBcIlByb3ZcIiwgXCJTcHJcIjogXCJQcm92XCIsXG4gIFwiRWNjbGVzaWFzdGVzXCI6IFwiRWNjbFwiLCBcIlByZWRpZ2VyXCI6IFwiRWNjbFwiLCBcIktvaGVsZXRcIjogXCJFY2NsXCIsXG4gIFwiU29uZyBvZiBTb2xvbW9uXCI6IFwiU29TXCIsIFwiU29uZyBvZiBTb25nc1wiOiBcIlNvU1wiLCBcIkhvaGVzbGllZFwiOiBcIlNvU1wiLCBcIkhvaGVsaWVkXCI6IFwiU29TXCIsIFwiTGllZCBkZXIgTGllZGVyXCI6IFwiU29TXCIsIFwiU1NcIjogXCJTb1NcIixcblxuICAvLyAtLS0tIFByb3BoZXRzIC0tLS1cbiAgXCJJc2FpYWhcIjogXCJJc2FcIiwgXCJKZXNhamFcIjogXCJJc2FcIixcbiAgXCJKZXJlbWlhaFwiOiBcIkplclwiLCBcIkplcmVtaWFcIjogXCJKZXJcIixcbiAgXCJMYW1lbnRhdGlvbnNcIjogXCJMYW1cIiwgXCJLbGFnZWxpZWRlclwiOiBcIkxhbVwiLCBcIlRocmVuaVwiOiBcIkxhbVwiLFxuICBcIkV6ZWtpZWxcIjogXCJFemVrXCIsIFwiSGVzZWtpZWxcIjogXCJFemVrXCIsIFwiRXplY2hpZWxcIjogXCJFemVrXCIsXG4gIFwiRGFuaWVsXCI6IFwiRGFuXCIsXG4gIFwiSG9zZWFcIjogXCJIb3NlYVwiLFxuICBcIkpvZWxcIjogXCJKb2VsXCIsXG4gIFwiQW1vc1wiOiBcIkFtb3NcIixcbiAgXCJPYmFkaWFoXCI6IFwiT2JhZFwiLCBcIk9iYWRqYVwiOiBcIk9iYWRcIixcbiAgXCJKb25haFwiOiBcIkpvbmFoXCIsIFwiSm9uYVwiOiBcIkpvbmFoXCIsXG4gIFwiTWljYWhcIjogXCJNaWNhaFwiLCBcIk1pY2hhXCI6IFwiTWljYWhcIixcbiAgXCJOYWh1bVwiOiBcIk5haFwiLFxuICBcIkhhYmFra3VrXCI6IFwiSGFiXCIsIFwiSGFiYWt1a1wiOiBcIkhhYlwiLFxuICBcIlplcGhhbmlhaFwiOiBcIlplcFwiLCBcIlplcGhhbmphXCI6IFwiWmVwXCIsIFwiWmVmYW5qYVwiOiBcIlplcFwiLFxuICBcIkhhZ2dhaVwiOiBcIkhhZ1wiLFxuICBcIlplY2hhcmlhaFwiOiBcIlplY2hcIiwgXCJTYWNoYXJqYVwiOiBcIlplY2hcIixcbiAgXCJNYWxhY2hpXCI6IFwiTWFsXCIsIFwiTWFsZWFjaGlcIjogXCJNYWxcIixcblxuICAvLyAtLS0tIEdvc3BlbHMgJiBBY3RzIC0tLS1cbiAgXCJNYXR0aGV3XCI6IFwiTWF0dFwiLCBcIk1hdHRoXHUwMEU0dXNcIjogXCJNYXR0XCIsIFwiTXRcIjogXCJNYXR0XCIsXG4gIFwiTWFya1wiOiBcIk1hcmtcIiwgXCJNYXJrdXNcIjogXCJNYXJrXCIsIFwiTWtcIjogXCJNYXJrXCIsXG4gIFwiTHVrZVwiOiBcIkx1a2VcIiwgXCJMdWthc1wiOiBcIkx1a2VcIiwgXCJMa1wiOiBcIkx1a2VcIiwgXCJMdWtcIjogXCJMdWtlXCIsXG4gIFwiSm9oblwiOiBcIkpvaG5cIiwgXCJKb2hhbm5lc1wiOiBcIkpvaG5cIiwgXCJKb2hcIjogXCJKb2huXCIsXG4gIFwiQWN0c1wiOiBcIkFjdHNcIiwgXCJBcGdcIjogXCJBY3RzXCIsIFwiQXBvc3RlbGdlc2NoaWNodGVcIjogXCJBY3RzXCIsXG5cbiAgLy8gLS0tLSBQYXVsXHUyMDE5cyBsZXR0ZXJzIC0tLS1cbiAgXCJSb21hbnNcIjogXCJSb21cIiwgXCJSXHUwMEY2bWVyXCI6IFwiUm9tXCIsIFwiUlx1MDBGNm1cIjogXCJSb21cIiwgXCJSXHUwMEY2bWVyYnJpZWZcIjogXCJSb21cIixcblxuICBcIjEgQ29yaW50aGlhbnNcIjogXCIxIENvclwiLCBcIjEgS29yaW50aGVyXCI6IFwiMSBDb3JcIiwgXCIxLiBLb3JpbnRoZXJcIjogXCIxIENvclwiLCBcIjFLb3JpbnRoZXJcIjogXCIxIENvclwiLCBcIjEuS29yaW50aGVyXCI6IFwiMSBDb3JcIixcbiAgXCIxIEtvclwiOiBcIjEgQ29yXCIsIFwiMS4gS29yXCI6IFwiMSBDb3JcIiwgXCIxS29yXCI6IFwiMSBDb3JcIiwgXCIxLktvclwiOiBcIjEgQ29yXCIsXG5cbiAgXCIyIENvcmludGhpYW5zXCI6IFwiMiBDb3JcIiwgXCIyIEtvcmludGhlclwiOiBcIjIgQ29yXCIsIFwiMi4gS29yaW50aGVyXCI6IFwiMiBDb3JcIiwgXCIyS29yaW50aGVyXCI6IFwiMiBDb3JcIiwgXCIyLktvcmludGhlclwiOiBcIjIgQ29yXCIsXG4gIFwiMiBLb3JcIjogXCIyIENvclwiLCBcIjIuIEtvclwiOiBcIjIgQ29yXCIsIFwiMktvclwiOiBcIjIgQ29yXCIsIFwiMi5Lb3JcIjogXCIyIENvclwiLFxuXG4gIFwiR2FsYXRpYW5zXCI6IFwiR2FsXCIsIFwiR2FsYXRlclwiOiBcIkdhbFwiLCBcIkdhbFwiOiBcIkdhbFwiLFxuICBcIkVwaGVzaWFuc1wiOiBcIkVwaFwiLCBcIkVwaGVzZXJcIjogXCJFcGhcIiwgXCJFcGhcIjogXCJFcGhcIixcbiAgXCJQaGlsaXBwaWFuc1wiOiBcIlBoaWxcIiwgXCJQaGlsaXBwZXJcIjogXCJQaGlsXCIsIFwiUGhpbFwiOiBcIlBoaWxcIixcbiAgXCJDb2xvc3NpYW5zXCI6IFwiQ29sXCIsIFwiS29sb3NzZXJcIjogXCJDb2xcIiwgXCJLb2xcIjogXCJDb2xcIixcblxuICBcIjEgVGhlc3NhbG9uaWFuc1wiOiBcIjEgVGhlc1wiLCBcIjEgVGhlc3NcIjogXCIxIFRoZXNcIiwgXCIxLiBUaGVzc1wiOiBcIjEgVGhlc1wiLCBcIjFUaGVzc1wiOiBcIjEgVGhlc1wiLCBcIjEuVGhlc3NcIjogXCIxIFRoZXNcIixcbiAgXCIxIFRoZXNzYWxvbmljaGVyXCI6IFwiMSBUaGVzXCIsIFwiMS4gVGhlc3NhbG9uaWNoZXJcIjogXCIxIFRoZXNcIiwgXCIxVGhlc3NhbG9uaWNoZXJcIjogXCIxIFRoZXNcIiwgXCIxLlRoZXNzYWxvbmljaGVyXCI6IFwiMSBUaGVzXCIsXG5cbiAgXCIyIFRoZXNzYWxvbmlhbnNcIjogXCIyIFRoZXNcIiwgXCIyIFRoZXNzXCI6IFwiMiBUaGVzXCIsIFwiMi4gVGhlc3NcIjogXCIyIFRoZXNcIiwgXCIyVGhlc3NcIjogXCIyIFRoZXNcIiwgXCIyLlRoZXNzXCI6IFwiMiBUaGVzXCIsXG4gIFwiMiBUaGVzc2Fsb25pY2hlclwiOiBcIjIgVGhlc1wiLCBcIjIuIFRoZXNzYWxvbmljaGVyXCI6IFwiMiBUaGVzXCIsIFwiMlRoZXNzYWxvbmljaGVyXCI6IFwiMiBUaGVzXCIsIFwiMi5UaGVzc2Fsb25pY2hlclwiOiBcIjIgVGhlc1wiLFxuXG4gIFwiMSBUaW1vdGh5XCI6IFwiMSBUaW1cIiwgXCIxIFRpbW90aGV1c1wiOiBcIjEgVGltXCIsIFwiMS4gVGltb3RoZXVzXCI6IFwiMSBUaW1cIiwgXCIxVGltb3RoZXVzXCI6IFwiMSBUaW1cIiwgXCIxLlRpbW90aGV1c1wiOiBcIjEgVGltXCIsXG4gIFwiMSBUaW1cIjogXCIxIFRpbVwiLCBcIjEuIFRpbVwiOiBcIjEgVGltXCIsIFwiMVRpbVwiOiBcIjEgVGltXCIsIFwiMS5UaW1cIjogXCIxIFRpbVwiLFxuXG4gIFwiMiBUaW1vdGh5XCI6IFwiMiBUaW1cIiwgXCIyIFRpbW90aGV1c1wiOiBcIjIgVGltXCIsIFwiMi4gVGltb3RoZXVzXCI6IFwiMiBUaW1cIiwgXCIyVGltb3RoZXVzXCI6IFwiMiBUaW1cIiwgXCIyLlRpbW90aGV1c1wiOiBcIjIgVGltXCIsXG4gIFwiMiBUaW1cIjogXCIyIFRpbVwiLCBcIjIuIFRpbVwiOiBcIjIgVGltXCIsIFwiMlRpbVwiOiBcIjIgVGltXCIsIFwiMi5UaW1cIjogXCIyIFRpbVwiLFxuXG4gIFwiVGl0dXNcIjogXCJUaXR1c1wiLFxuICBcIlBoaWxlbW9uXCI6IFwiUGhpbGVtXCIsXG5cbiAgXCJIZWJyZXdzXCI6IFwiSGViXCIsIFwiSGViclx1MDBFNGVyXCI6IFwiSGViXCIsIFwiSGViclwiOiBcIkhlYlwiLFxuXG4gIC8vIC0tLS0gQ2F0aG9saWMgJiBHZW5lcmFsIGxldHRlcnMgLS0tLVxuICBcIkphbWVzXCI6IFwiSmFtZXNcIiwgXCJKYWtvYnVzXCI6IFwiSmFtZXNcIiwgXCJKYWtcIjogXCJKYW1lc1wiLFxuICBcIjEgUGV0ZXJcIjogXCIxIFBldFwiLCBcIjEgUGV0cnVzXCI6IFwiMSBQZXRcIiwgXCIxLiBQZXRydXNcIjogXCIxIFBldFwiLCBcIjFQZXRydXNcIjogXCIxIFBldFwiLCBcIjEuUGV0cnVzXCI6IFwiMSBQZXRcIixcbiAgXCIxIFBldFwiOiBcIjEgUGV0XCIsIFwiMS4gUGV0XCI6IFwiMSBQZXRcIiwgXCIxLiBQZXRyXCI6IFwiMSBQZXRcIiwgXCIxLlBldHJcIjogXCIxIFBldFwiLCBcIjFQZXRcIjogXCIxIFBldFwiLCBcIjEuUGV0XCI6IFwiMSBQZXRcIixcblxuICBcIjIgUGV0ZXJcIjogXCIyIFBldFwiLCBcIjIgUGV0cnVzXCI6IFwiMiBQZXRcIiwgXCIyLiBQZXRydXNcIjogXCIyIFBldFwiLCBcIjJQZXRydXNcIjogXCIyIFBldFwiLCBcIjIuUGV0cnVzXCI6IFwiMiBQZXRcIixcbiAgXCIyIFBldFwiOiBcIjIgUGV0XCIsIFwiMi4gUGV0XCI6IFwiMiBQZXRcIiwgXCIyLiBQZXRyXCI6IFwiMiBQZXRcIiwgXCIyLlBldHJcIjogXCIyIFBldFwiLCBcIjJQZXRcIjogXCIyIFBldFwiLCBcIjIuUGV0XCI6IFwiMiBQZXRcIixcblxuICBcIjEgSm9oblwiOiBcIjEgSm9oblwiLCBcIjEgSm9oYW5uZXNcIjogXCIxIEpvaG5cIiwgXCIxLiBKb2hhbm5lc1wiOiBcIjEgSm9oblwiLCBcIjFKb2hhbm5lc1wiOiBcIjEgSm9oblwiLCBcIjEuSm9oYW5uZXNcIjogXCIxIEpvaG5cIixcbiAgXCIxIEpvaFwiOiBcIjEgSm9oblwiLCBcIjEuIEpvaFwiOiBcIjEgSm9oblwiLCBcIjFKb2hcIjogXCIxIEpvaG5cIiwgXCIxLkpvaFwiOiBcIjEgSm9oblwiLFxuXG4gIFwiMiBKb2huXCI6IFwiMiBKb2huXCIsIFwiMiBKb2hhbm5lc1wiOiBcIjIgSm9oblwiLCBcIjIuIEpvaGFubmVzXCI6IFwiMiBKb2huXCIsIFwiMkpvaGFubmVzXCI6IFwiMiBKb2huXCIsIFwiMi5Kb2hhbm5lc1wiOiBcIjIgSm9oblwiLFxuICBcIjIgSm9oXCI6IFwiMiBKb2huXCIsIFwiMi4gSm9oXCI6IFwiMiBKb2huXCIsIFwiMkpvaFwiOiBcIjIgSm9oblwiLCBcIjIuSm9oXCI6IFwiMiBKb2huXCIsXG5cbiAgXCIzIEpvaG5cIjogXCIzIEpvaG5cIiwgXCIzIEpvaGFubmVzXCI6IFwiMyBKb2huXCIsIFwiMy4gSm9oYW5uZXNcIjogXCIzIEpvaG5cIiwgXCIzSm9oYW5uZXNcIjogXCIzIEpvaG5cIiwgXCIzLkpvaGFubmVzXCI6IFwiMyBKb2huXCIsXG4gIFwiMyBKb2hcIjogXCIzIEpvaG5cIiwgXCIzLiBKb2hcIjogXCIzIEpvaG5cIiwgXCIzSm9oXCI6IFwiMyBKb2huXCIsIFwiMy5Kb2hcIjogXCIzIEpvaG5cIixcblxuICBcIkp1ZGVcIjogXCJKdWRlXCIsIFwiSnVkYXNcIjogXCJKdWRlXCIsXG5cbiAgLy8gLS0tLSBSZXZlbGF0aW9uIC0tLS1cbiAgXCJSZXZlbGF0aW9uXCI6IFwiUmV2XCIsIFwiT2ZmZW5iYXJ1bmdcIjogXCJSZXZcIiwgXCJPZmZiXCI6IFwiUmV2XCIsIFwiQXBva2FseXBzZVwiOiBcIlJldlwiXG59O1xuXG5cbnR5cGUgQm9va01hcCA9IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG5jb25zdCBlc2NhcGVSZSA9IChzOiBzdHJpbmcpID0+IHMucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xuXG4vKiogQnVpbGQgbG9jYWxlLXNwZWNpZmljIGJvb2sgbWFwICsgYWx0ZXJuYXRpb24gYXQgcnVudGltZSAqL1xuZnVuY3Rpb24gYnVpbGRCb29rQ29udGV4dChzZXR0aW5ncz86IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuICBsZXQgYm9va0xvY2FsZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBsZXQgY3VzdG9tOiB1bmtub3duO1xuXG4gIHRyeSB7IGJvb2tMb2NhbGUgPSAoc2V0dGluZ3MgYXMgYW55KT8uYm9va0xvY2FsZSBhcyBzdHJpbmcgfCB1bmRlZmluZWQ7IH0gY2F0Y2gge31cbiAgdHJ5IHsgY3VzdG9tID0gKHNldHRpbmdzIGFzIGFueSk/LmN1c3RvbUJvb2tNYXA7IH0gY2F0Y2gge31cblxuICBsZXQgYWJicjogQm9va01hcCA9IEJPT0tfQUJCUjtcblxuICBpZiAoYm9va0xvY2FsZSA9PT0gXCJjdXN0b21cIiAmJiBjdXN0b20pIHtcbiAgICB0cnkge1xuICAgICAgaWYgKHR5cGVvZiBjdXN0b20gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShjdXN0b20pO1xuICAgICAgICBpZiAocGFyc2VkICYmIHR5cGVvZiBwYXJzZWQgPT09IFwib2JqZWN0XCIpIGFiYnIgPSBwYXJzZWQgYXMgQm9va01hcDtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGN1c3RvbSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBhYmJyID0gY3VzdG9tIGFzIEJvb2tNYXA7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICBhYmJyID0gQk9PS19BQkJSO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBhYmJyID0gQk9PS19BQkJSO1xuICB9XG5cbiAgY29uc3QgYWxsVG9rZW5zID0gQXJyYXkuZnJvbShuZXcgU2V0KFsuLi5PYmplY3Qua2V5cyhhYmJyKSwgLi4uT2JqZWN0LnZhbHVlcyhhYmJyKV0pKS5zb3J0KFxuICAgIChhLCBiKSA9PiBiLmxlbmd0aCAtIGEubGVuZ3RoXG4gICk7XG4gIGNvbnN0IEJPT0tfQUxUID0gYWxsVG9rZW5zLm1hcChlc2NhcGVSZSkuam9pbihcInxcIik7XG5cbiAgY29uc3QgZ2V0Qm9va0FiYnIgPSAoYm9vazogc3RyaW5nKSA9PiBhYmJyW2Jvb2tdID8/IGJvb2s7XG5cbiAgY29uc3QgYnVpbGRQYXR0ZXJuQm9keSA9ICgpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IGJvb2sgPSBgKD86JHtCT09LX0FMVH0pYDtcbiAgICAvLyBjb25zdCByZWYxID1cbiAgICAvLyAgIGAoPzooPzoke2Jvb2t9KVxcXFwuP1xcXFxzKmAgK1xuICAgIC8vICAgYFxcXFxkKyg/Oi1cXFxcZCspPzpcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT9gICtcbiAgICAvLyAgIGAoPzpcXFxccyosXFxcXHMqXFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/fFxcXFxzKjtcXFxccypcXFxcZCs6XFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/KSpgICtcbiAgICAvLyAgIGApYDtcbiAgICBjb25zdCByZWYxID1cbiAgICAgIGAoPzooPzoke2Jvb2t9KT9cXFxcLj9cXFxccypgICtcbiAgICAgIGBcXFxcZCsoPzotXFxcXGQrKT86XFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/YCArXG4gICAgICBgKD86XFxcXHMqLFxcXFxzKlxcXFxkK1thLXpdPyg/Oi1cXFxcZCspP1thLXpdP3xcXFxccyo7XFxcXHMqXFxcXGQrOlxcXFxkK1thLXpdPyg/Oi1cXFxcZCspP1thLXpdPykqYCArXG4gICAgICBgKWA7XG4gICAgY29uc3QgcmVmMiA9IGAoPzooJHtib29rfSlcXFxcLj9cXFxccysoXFxcXGQrKSg/Oi0oXFxcXGQrKSk/KWA7XG4gICAgY29uc3QgUkVGID0gYCg/PHJlZj4ke3JlZjF9fCR7cmVmMn0pYDtcblxuICAgIGNvbnN0IFZFUlNFID1cbiAgICAgIGAoPzx2ZXJzZT5gICtcbiAgICAgIGBcXFxcYltWdl12Pyg/OlxcXFwufGVyc2VzPylcXFxccypgICtcbiAgICAgIGBcXFxcZCsoPzotXFxcXGQrKT9bYS16XT9gICtcbiAgICAgIGAoPzooPzosfCw/XFxcXHMqYW5kKVxcXFxzKlxcXFxkKyg/Oi1cXFxcZCspP1thLXpdPykqYCArXG4gICAgICBgKWA7XG5cbiAgICBjb25zdCBDSEFQVEVSID1cbiAgICAgIGAoPzxjaGFwdGVyPmAgK1xuICAgICAgYFxcXFxiW0NjXWgoPzphcHRlcnM/fHM/XFxcXC4pXFxcXC4/XFxcXHMqYCArXG4gICAgICBgXFxcXGQrKD86LVxcXFxkKyk/YCArXG4gICAgICBgKWA7XG5cbiAgICBjb25zdCBOT1RFID1cbiAgICAgIGAoPzxub3RlPmAgK1xuICAgICAgYFxcXFxiW05uXW90ZXM/YCArXG4gICAgICBgKD86XFxcXHMrXFxcXGQrKD86XFxcXHMrXFxcXGQrKT9gICtcbiAgICAgIGAoPzpgICtcbiAgICAgIGAoPzpbLDtdfCw/XFxcXHMqYW5kKVxcXFxzKlxcXFxkKyg/OlxcXFxzK1xcXFxkKyk/YCArXG4gICAgICBgKD86XFxcXHMraW5cXFxccyske2Jvb2t9XFxcXC4/XFxcXHMrXFxcXGQrKT9gICtcbiAgICAgIGApKmAgK1xuICAgICAgYClgICtcbiAgICAgIGAoPzpcXFxccytpblxcXFxzKyR7Ym9va31cXFxcLj9cXFxccytcXFxcZCspP2AgK1xuICAgICAgYClgO1xuXG4gICAgY29uc3QgQk9PSyA9IGAoPzxib29rPlxcXFxiKD86JHtib29rfSlcXFxcYikoPyFcXFxcLj9cXFxccypcXFxcZCspYDtcblxuICAgIHJldHVybiBgJHtSRUZ9fCR7VkVSU0V9fCR7Q0hBUFRFUn18JHtOT1RFfXwke0JPT0t9YDtcbiAgfTtcblxuICBjb25zdCBQQVRURVJOX0JPRFkgPSBidWlsZFBhdHRlcm5Cb2R5KCk7XG4gIGNvbnN0IFBBVFRFUk5fRyA9IG5ldyBSZWdFeHAoUEFUVEVSTl9CT0RZLCBcImdcIik7XG4gIGNvbnN0IFBBVFRFUk5fSEVBRCA9IG5ldyBSZWdFeHAoXCJeXCIgKyBQQVRURVJOX0JPRFkpO1xuXG4gIHJldHVybiB7IGFiYnIsIGFsbFRva2VucywgQk9PS19BTFQsIGdldEJvb2tBYmJyLCBQQVRURVJOX0csIFBBVFRFUk5fSEVBRCB9O1xufVxuXG5cbi8qKiAtLS0tLS0tLS0tLS0tLS0tIFV0aWxpdHk6IG5vcm1hbGl6ZSBib29rIHRva2VuIHRvIHJlbW92ZSB0cmFpbGluZyBwZXJpb2QgLS0tLS0tLS0tLS0tLS0tICovXG5mdW5jdGlvbiBub3JtYWxpemVCb29rVG9rZW4ocmF3OiBzdHJpbmcsIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4pOiBzdHJpbmcge1xuICAvLyBUcmltIGFuZCBkcm9wIGEgc2luZ2xlIHRyYWlsaW5nIGRvdCAoZS5nLiwgXCJSb20uXCIgLT4gXCJSb21cIilcbiAgY29uc3QgY2xlYW5lZCA9IHJhdy50cmltKCkucmVwbGFjZSgvXFwuJC8sIFwiXCIpO1xuICByZXR1cm4gY3R4LmdldEJvb2tBYmJyKGNsZWFuZWQpO1xufVxuXG4vKiogLS0tLS0tLS0tLS0tLS0gUHJvdGVjdGVkIHJhbmdlcyAoZG9uXHUyMDE5dCB0b3VjaCB3aGlsZSBsaW5raW5nKSAtLS0tLS0tLS0tLS0tLSAqL1xudHlwZSBSYW5nZSA9IFtzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcl07XG5cbmZ1bmN0aW9uIGFkZFJhbmdlKHJhbmdlczogUmFuZ2VbXSwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbiAgaWYgKHN0YXJ0ID49IDAgJiYgZW5kID4gc3RhcnQpIHJhbmdlcy5wdXNoKFtzdGFydCwgZW5kXSk7XG59XG5cbmZ1bmN0aW9uIGZpbmRQcm90ZWN0ZWRSYW5nZXModGV4dDogc3RyaW5nKTogUmFuZ2VbXSB7XG4gIGNvbnN0IHJhbmdlczogUmFuZ2VbXSA9IFtdO1xuXG4gIC8vIDEpIENvZGUgZmVuY2VzIGBgYC4uLmBgYCBhbmQgfn5+Li4ufn5+XG4gIGNvbnN0IGZlbmNlUmUgPSAvKGBgYHx+fn4pW15cXG5dKlxcbltcXHNcXFNdKj9cXDEvZztcbiAgZm9yIChsZXQgbTsgKG0gPSBmZW5jZVJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuICAvLyAyKSBNYXRoIGJsb2NrcyAkJC4uLiQkXG4gIGNvbnN0IG1hdGhCbG9ja1JlID0gL1xcJFxcJFtcXHNcXFNdKj9cXCRcXCQvZztcbiAgZm9yIChsZXQgbTsgKG0gPSBtYXRoQmxvY2tSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbiAgLy8gMykgSW5saW5lIGNvZGUgYC4uLmBcbiAgY29uc3QgaW5saW5lQ29kZVJlID0gL2BbXmBcXG5dKmAvZztcbiAgZm9yIChsZXQgbTsgKG0gPSBpbmxpbmVDb2RlUmUuZXhlYyh0ZXh0KSk7ICkgYWRkUmFuZ2UocmFuZ2VzLCBtLmluZGV4LCBtLmluZGV4ICsgbVswXS5sZW5ndGgpO1xuXG4gIC8vIDQpIElubGluZSBtYXRoICQuLi4kIChhdm9pZCAkJClcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgKSB7XG4gICAgaWYgKHRleHRbaV0gPT09IFwiJFwiICYmIHRleHRbaSArIDFdICE9PSBcIiRcIikge1xuICAgICAgY29uc3Qgc3RhcnQgPSBpO1xuICAgICAgaSsrO1xuICAgICAgd2hpbGUgKGkgPCB0ZXh0Lmxlbmd0aCAmJiB0ZXh0W2ldICE9PSBcIiRcIikgaSsrO1xuICAgICAgaWYgKGkgPCB0ZXh0Lmxlbmd0aCAmJiB0ZXh0W2ldID09PSBcIiRcIikge1xuICAgICAgICBhZGRSYW5nZShyYW5nZXMsIHN0YXJ0LCBpICsgMSk7XG4gICAgICAgIGkrKztcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfVxuICAgIGkrKztcbiAgfVxuXG4gIC8vIDUpIE1hcmtkb3duIGxpbmtzIFt0ZXh0XSh1cmwpXG4gIGNvbnN0IG1kTGlua1JlID0gL1xcW1teXFxdXSs/XFxdXFwoW14pXStcXCkvZztcbiAgZm9yIChsZXQgbTsgKG0gPSBtZExpbmtSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbiAgLy8gNikgSW5saW5lIHByb3BlcnRpZXMgbGluZXM6ICBrZXk6OiB2YWx1ZVxuICBjb25zdCBpbmxpbmVQcm9wUmUgPSAvXlteXFxuOl17MSwyMDB9OjouKiQvZ207XG4gIGZvciAobGV0IG07IChtID0gaW5saW5lUHJvcFJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuICAvLyA3KSBPYnNpZGlhbiBsaW5rcyBbWy4uLl1dXG4gIGNvbnN0IG9ic2lkaWFuUmUgPSAvXFxbXFxbW15cXF1dKj9cXF1cXF0vZztcbiAgZm9yIChsZXQgbTsgKG0gPSBvYnNpZGlhblJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuICAvLyBNZXJnZSBvdmVybGFwcyAmIHNvcnRcbiAgcmFuZ2VzLnNvcnQoKGEsIGIpID0+IGFbMF0gLSBiWzBdKTtcbiAgY29uc3QgbWVyZ2VkOiBSYW5nZVtdID0gW107XG4gIGZvciAoY29uc3QgciBvZiByYW5nZXMpIHtcbiAgICBpZiAoIW1lcmdlZC5sZW5ndGggfHwgclswXSA+IG1lcmdlZFttZXJnZWQubGVuZ3RoIC0gMV1bMV0pIG1lcmdlZC5wdXNoKHIpO1xuICAgIGVsc2UgbWVyZ2VkW21lcmdlZC5sZW5ndGggLSAxXVsxXSA9IE1hdGgubWF4KG1lcmdlZFttZXJnZWQubGVuZ3RoIC0gMV1bMV0sIHJbMV0pO1xuICB9XG4gIHJldHVybiBtZXJnZWQ7XG59XG5cbmZ1bmN0aW9uIGluUHJvdGVjdGVkKHBvczogbnVtYmVyLCByYW5nZXM6IFJhbmdlW10pOiBib29sZWFuIHtcbiAgbGV0IGxvID0gMCwgaGkgPSByYW5nZXMubGVuZ3RoIC0gMTtcbiAgd2hpbGUgKGxvIDw9IGhpKSB7XG4gICAgY29uc3QgbWlkID0gKGxvICsgaGkpID4+IDE7XG4gICAgY29uc3QgW3MsIGVdID0gcmFuZ2VzW21pZF07XG4gICAgaWYgKHBvcyA8IHMpIGhpID0gbWlkIC0gMTtcbiAgICBlbHNlIGlmIChwb3MgPj0gZSkgbG8gPSBtaWQgKyAxO1xuICAgIGVsc2UgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc1dpdGhpbk9ic2lkaWFuTGluayh0ZXh0OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGJlZm9yZSA9IHRleHQuc2xpY2UoMCwgc3RhcnQpO1xuICBjb25zdCBhZnRlciA9IHRleHQuc2xpY2UoZW5kKTtcbiAgY29uc3Qgb3BlbklkeCA9IGJlZm9yZS5sYXN0SW5kZXhPZihcIltbXCIpO1xuICBjb25zdCBjbG9zZUlkeCA9IGJlZm9yZS5sYXN0SW5kZXhPZihcIl1dXCIpO1xuICBpZiAob3BlbklkeCA+IGNsb3NlSWR4KSB7XG4gICAgY29uc3QgbmV4dENsb3NlID0gYWZ0ZXIuaW5kZXhPZihcIl1dXCIpO1xuICAgIGlmIChuZXh0Q2xvc2UgIT09IC0xKSByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKiBQYXJlbnRoZXRpY2FsIG5vaXNlOiBza2lwIGlmIGluc2lkZSBcIigyMDE5KVwiLWxpa2UgcGFyZW50aGVzZXMgKi9cbmZ1bmN0aW9uIGlzSW5zaWRlTnVtZXJpY1BhcmVucyh0ZXh0OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IG9wZW4gPSB0ZXh0Lmxhc3RJbmRleE9mKFwiKFwiLCBzdGFydCk7XG4gIGlmIChvcGVuID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBjbG9zZSA9IHRleHQuaW5kZXhPZihcIilcIiwgZW5kKTtcbiAgaWYgKGNsb3NlID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBpbm5lciA9IHRleHQuc2xpY2Uob3BlbiArIDEsIGNsb3NlKS50cmltKCk7XG4gIGlmICgvXlxcZHsxLDR9KD86W1xcL1xcLlxcLTpdXFxkezEsMn0oPzpbXFwvXFwuXFwtOl1cXGR7MSw0fSk/KT8kLy50ZXN0KGlubmVyKSkgcmV0dXJuIHRydWU7XG4gIGlmICgvXnB7MSwyfVxcLlxccypcXGQrKFxccyotXFxzKlxcZCspPyQvaS50ZXN0KGlubmVyKSkgcmV0dXJuIHRydWU7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0gTWFya2Rvd24vT2JzaWRpYW4gbGluayBjbGVhbnVwIChQeXRob24gcGFyaXR5KSAtLS0tLS0tLS0tLS0tLS0tLS0tICovXG5mdW5jdGlvbiByZW1vdmVNYXRjaGluZ01hcmtkb3duTGlua3ModGV4dDogc3RyaW5nLCBQQVRURVJOX0hFQUQ6IFJlZ0V4cCk6IHN0cmluZyB7XG4gIGNvbnN0IG1kTGluayA9IC8oXFwqXFwqfF9ffFxcKik/XFxbKFteXFxdXSspXFxdXFwoW14pXStcXCkoXFwqXFwqfF9ffFxcKik/L2c7XG4gIHJldHVybiB0ZXh0LnJlcGxhY2UobWRMaW5rLCAoX20sIHByZSwgZGlzcCwgc3VmKSA9PiB7XG4gICAgY29uc3QgbGlua1RleHQgPSBTdHJpbmcoZGlzcCk7XG4gICAgaWYgKFBBVFRFUk5fSEVBRC50ZXN0KGxpbmtUZXh0KSkgcmV0dXJuIGxpbmtUZXh0O1xuICAgIGNvbnN0IHNpbXBsZU51bSA9IC9eXFxkKyg/Ols6LV1cXGQrKT8oPzotXFxkKyk/JC8udGVzdChsaW5rVGV4dCk7XG4gICAgaWYgKHNpbXBsZU51bSkgcmV0dXJuIGxpbmtUZXh0O1xuICAgIHJldHVybiBgJHtwcmUgPz8gXCJcIn1bJHtsaW5rVGV4dH1dJHtzdWYgPz8gXCJcIn1gO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlTWF0Y2hpbmdPYnNpZGlhbkxpbmtzKHRleHQ6IHN0cmluZywgUEFUVEVSTl9IRUFEOiBSZWdFeHApOiBzdHJpbmcge1xuICBjb25zdCBvYnMgPSAvXFxbXFxbKFteXFxdfF0rKVxcfChbXlxcXV0rKVxcXVxcXS9nO1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKG9icywgKF9tLCBfdCwgZGlzcCkgPT4ge1xuICAgIGNvbnN0IGRpc3BsYXkgPSBTdHJpbmcoZGlzcCk7XG4gICAgaWYgKFBBVFRFUk5fSEVBRC50ZXN0KGRpc3BsYXkpKSByZXR1cm4gZGlzcGxheTtcbiAgICBjb25zdCBzaW1wbGVOdW0gPSAvXlxcZCsoPzpbOi1dXFxkKyk/KD86LVxcZCspPyQvLnRlc3QoZGlzcGxheSk7XG4gICAgaWYgKHNpbXBsZU51bSkgcmV0dXJuIGRpc3BsYXk7XG4gICAgcmV0dXJuIF9tO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZU9sZE9ic2lkaWFuTGlua3ModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgb2xkTGluayA9IC9cXFtcXFsoWzAtOV0/XFxzW0EtWmEteiBdKylcXHMoXFxkKykjXFxeKFxcZCspKD86XFx8KFteXFxdXSspKT9cXF1cXF0vZztcbiAgcmV0dXJuIHRleHQucmVwbGFjZShvbGRMaW5rLCAoX20sIGJvb2tTaG9ydCwgY2gsIHZlcnNlLCBkaXNwKSA9PiB7XG4gICAgY29uc3QgYiA9IFN0cmluZyhib29rU2hvcnQpLnRyaW0oKTtcbiAgICByZXR1cm4gZGlzcFxuICAgICAgPyBgW1ske2J9I14ke2NofS0ke3ZlcnNlfXwke2Rpc3B9XV1gXG4gICAgICA6IGBbWyR7Yn0jXiR7Y2h9LSR7dmVyc2V9XV1gO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZmluZExhc3RCb29rQmVmb3JlKHRleHQ6IHN0cmluZywgcG9zOiBudW1iZXIsIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4pOiBzdHJpbmcgfCBudWxsIHtcbiAgLy8gTG9vayBiYWNrIH4yMDAgY2hhcnMgZm9yIGEgYm9vayB0b2tlbiBlbmRpbmcgcmlnaHQgYmVmb3JlICdwb3MnXG4gIGNvbnN0IHN0YXJ0ID0gTWF0aC5tYXgoMCwgcG9zIC0gMjAwKTtcbiAgY29uc3QgbGVmdCA9IHRleHQuc2xpY2Uoc3RhcnQsIHBvcyk7XG5cbiAgLy8gTWF0Y2ggQUxMIGJvb2sgdG9rZW5zIGluIHRoZSB3aW5kb3c7IHRha2UgdGhlIGxhc3Qgb25lLlxuICBjb25zdCByZSA9IG5ldyBSZWdFeHAoYCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccyokfCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccytgLCBcImdcIik7XG4gIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICBsZXQgbGFzdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgd2hpbGUgKChtID0gcmUuZXhlYyhsZWZ0KSkgIT09IG51bGwpIHtcbiAgICBsYXN0ID0gbVswXS50cmltKCk7XG4gIH1cbiAgaWYgKCFsYXN0KSByZXR1cm4gbnVsbDtcblxuICAvLyBzdHJpcCB0cmFpbGluZyBwdW5jdHVhdGlvbi9kb3QgYW5kIG5vcm1hbGl6ZVxuICByZXR1cm4gbm9ybWFsaXplQm9va1Rva2VuKGxhc3QucmVwbGFjZSgvXFxzKyQvLCBcIlwiKSwgY3R4KTtcbn1cblxuLyoqIC0tLS0tLS0tLS0tLSBWZXJzaW9uLWF3YXJlIGxpbmsgdGFyZ2V0IC0tLS0tLS0tLS0tLSAqL1xuZnVuY3Rpb24gZm9ybWF0Qm9va1RhcmdldChib29rU2hvcnQ6IHN0cmluZywgdmVyc2lvblNob3J0Pzogc3RyaW5nIHwgbnVsbCk6IHN0cmluZyB7XG4gIGlmICghdmVyc2lvblNob3J0KSByZXR1cm4gYm9va1Nob3J0O1xuICByZXR1cm4gYCR7Ym9va1Nob3J0fSAoJHt2ZXJzaW9uU2hvcnR9KWA7XG59XG5cbi8qKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQ29yZSBsaW5rZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5mdW5jdGlvbiByZXBsYWNlVmVyc2VSZWZlcmVuY2VzT2ZNYWluVGV4dChcbiAgdGV4dDogc3RyaW5nLFxuICBjdHg6IFJldHVyblR5cGU8dHlwZW9mIGJ1aWxkQm9va0NvbnRleHQ+LFxuICBvcHRzOiB7XG4gICAgcmVtb3ZlT2JzaWRpYW5MaW5rczogYm9vbGVhbjtcbiAgICByZXdyaXRlT2xkTGlua3M6IGJvb2xlYW47XG4gICAgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZTogYm9vbGVhbjtcbiAgICB2ZXJzaW9uU2hvcnQ/OiBzdHJpbmcgfCBudWxsOyAvLyBORVdcbiAgfVxuKTogc3RyaW5nIHtcbiAgaWYgKG9wdHMuc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSkgdGV4dCA9IHJlbW92ZU1hdGNoaW5nTWFya2Rvd25MaW5rcyh0ZXh0LCBjdHguUEFUVEVSTl9IRUFEKTtcbiAgaWYgKG9wdHMucmVtb3ZlT2JzaWRpYW5MaW5rcykgdGV4dCA9IHJlbW92ZU1hdGNoaW5nT2JzaWRpYW5MaW5rcyh0ZXh0LCBjdHguUEFUVEVSTl9IRUFEKTtcbiAgaWYgKG9wdHMucmV3cml0ZU9sZExpbmtzKSB0ZXh0ID0gcmVwbGFjZU9sZE9ic2lkaWFuTGlua3ModGV4dCk7XG5cbiAgY29uc3QgcHJvdGVjdGVkUmFuZ2VzID0gZmluZFByb3RlY3RlZFJhbmdlcyh0ZXh0KTtcblxuICBsZXQgY3VycmVudF9ib29rOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgbGV0IGN1cnJlbnRfY2hhcHRlcjogbnVtYmVyIHwgc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGxldCBjdXJyZW50X3ZlcnNlOiBudW1iZXIgfCBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIGxldCBsYXN0UG9zID0gMDtcblxuICBjb25zdCB0YXJnZXRPZiA9IChib29rU2hvcnQ6IHN0cmluZykgPT4gZm9ybWF0Qm9va1RhcmdldChib29rU2hvcnQsIG9wdHMudmVyc2lvblNob3J0KTtcblxuICBjdHguUEFUVEVSTl9HLmxhc3RJbmRleCA9IDA7XG4gIGZvciAobGV0IG06IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGwgPSBjdHguUEFUVEVSTl9HLmV4ZWModGV4dCk7IG07IG0gPSBjdHguUEFUVEVSTl9HLmV4ZWModGV4dCkpIHtcbiAgICBjb25zdCBzdGFydCA9IG0uaW5kZXg7XG4gICAgY29uc3QgZW5kID0gc3RhcnQgKyBtWzBdLmxlbmd0aDtcblxuICAgIGlmIChcbiAgICAgIGluUHJvdGVjdGVkKHN0YXJ0LCBwcm90ZWN0ZWRSYW5nZXMpIHx8XG4gICAgICBpblByb3RlY3RlZChlbmQgLSAxLCBwcm90ZWN0ZWRSYW5nZXMpIHx8XG4gICAgICBpc1dpdGhpbk9ic2lkaWFuTGluayh0ZXh0LCBzdGFydCwgZW5kKSB8fFxuICAgICAgaXNJbnNpZGVOdW1lcmljUGFyZW5zKHRleHQsIHN0YXJ0LCBlbmQpXG4gICAgKSB7XG4gICAgICBvdXQucHVzaCh0ZXh0LnNsaWNlKGxhc3RQb3MsIHN0YXJ0KSwgbVswXSk7XG4gICAgICBsYXN0UG9zID0gZW5kO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgb3V0LnB1c2godGV4dC5zbGljZShsYXN0UG9zLCBzdGFydCkpO1xuICAgIGxhc3RQb3MgPSBlbmQ7XG5cbiAgICBjb25zdCBnID0gbS5ncm91cHMgPz8ge307XG5cbiAgICAvLyAtLS0tIGJvb2sgb25seVxuICAgIGlmIChnLmJvb2spIHtcbiAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihnLmJvb2ssIGN0eCk7IC8vIDwtLSBzdHJpcHMgdHJhaWxpbmcgZG90XG4gICAgICBjdXJyZW50X2NoYXB0ZXIgPSBudWxsO1xuICAgICAgY3VycmVudF92ZXJzZSA9IG51bGw7XG4gICAgICBvdXQucHVzaChtWzBdKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIC0tLS0gY2hhcHRlciAoY2guLCBjaGFwdGVyLCBjaGFwdGVycylcbiAgICBpZiAoZy5jaGFwdGVyKSB7XG4gICAgICBjb25zdCBjaG0gPSBnLmNoYXB0ZXIubWF0Y2goLyhcXGQrKS8pO1xuICAgICAgaWYgKGNobSAmJiBjdXJyZW50X2Jvb2spIHtcbiAgICAgICAgY29uc3QgY2ggPSBjaG1bMV07XG4gICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IGNoO1xuICAgICAgICBjdXJyZW50X3ZlcnNlID0gbnVsbDtcbiAgICAgICAgb3V0LnB1c2goYFtbJHt0YXJnZXRPZihjdXJyZW50X2Jvb2spfSNeJHtjaH18JHttWzBdfV1dYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXQucHVzaChtWzBdKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIC0tLS0gdmVyc2UgKHYuLCB2di4sIHZlcnNlcylcbiAgICBpZiAoZy52ZXJzZSkge1xuICAgICAgaWYgKCFjdXJyZW50X2Jvb2spIHtcbiAgICAgICAgY29uc3QgaW5mZXJyZWQgPSBmaW5kTGFzdEJvb2tCZWZvcmUodGV4dCwgc3RhcnQsIGN0eCk7XG4gICAgICAgIGlmIChpbmZlcnJlZCkgY3VycmVudF9ib29rID0gaW5mZXJyZWQ7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIG91dC5wdXNoKG1bMF0pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCB2ZXJzZVRleHQgPSBtWzBdO1xuICAgICAgY29uc3QgcGFydHMgPSB2ZXJzZVRleHQuc3BsaXQoLyhcXHMrKS8pO1xuICAgICAgY29uc3QgY2ggPSBjdXJyZW50X2NoYXB0ZXIgPyBTdHJpbmcoY3VycmVudF9jaGFwdGVyKSA6IFwiMVwiO1xuICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIHBhcnRzKSB7XG4gICAgICAgIGNvbnN0IHZtID0gcGFydC5tYXRjaCgvKFxcZCspLyk7XG4gICAgICAgIGlmICh2bSAmJiBwYXJ0LnRyaW0oKSkge1xuICAgICAgICAgIG91dC5wdXNoKGBbWyR7dGFyZ2V0T2YoY3VycmVudF9ib29rKX0jXiR7Y2h9LSR7dm1bMV19fCR7cGFydC50cmltKCl9XV1gKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvdXQucHVzaChwYXJ0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gLS0tLSBub3RlKHMpXG4gICAgaWYgKGcubm90ZSkge1xuICAgICAgY29uc3Qgbm90ZVRleHQgPSBnLm5vdGUgYXMgc3RyaW5nO1xuICAgICAgY29uc3QgcGFydHMgPSBub3RlVGV4dC5zcGxpdCgvXFxzKy8pO1xuICAgICAgbGV0IGJvb2tTdWJzdHJpbmcgPSBmYWxzZTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGFydCA9IHBhcnRzW2ldO1xuICAgICAgICBjb25zdCBwbSA9IHBhcnQubWF0Y2goL14oXFxkKykvKTtcbiAgICAgICAgaWYgKHBtICYmICFib29rU3Vic3RyaW5nKSB7XG4gICAgICAgICAgY29uc3QgdmVyc2UgPSBwbVsxXTtcbiAgICAgICAgICBpZiAoKGkgKyAxIDwgcGFydHMubGVuZ3RoICYmICEvXlxcZCsvLnRlc3QocGFydHNbaSArIDFdKSkgfHwgaSArIDEgPj0gcGFydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBvdXQucHVzaChcIiBcIiArIHBhcnQpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IHBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAocGFydHNbal0gPT09IFwiaW5cIiAmJiBqICsgMSA8IHBhcnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICBpZiAoL15cXGQrJC8udGVzdChwYXJ0c1tqICsgMV0pICYmIGogKyAyIDwgcGFydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYm9vayA9IHBhcnRzW2ogKyAxXSArIFwiIFwiICsgcGFydHNbaiArIDJdO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IHBhcnRzW2ogKyAzXTtcbiAgICAgICAgICAgICAgICBjdXJyZW50X2Jvb2sgPSBub3JtYWxpemVCb29rVG9rZW4oYm9vaywgY3R4KTsgLy8gPC0tIG5vcm1hbGl6ZVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJvb2sgPSBwYXJ0c1tqICsgMV07XG4gICAgICAgICAgICAgICAgY3VycmVudF9jaGFwdGVyID0gcGFydHNbaiArIDJdO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihib29rLCBjdHgpOyAvLyA8LS0gbm9ybWFsaXplXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGN1cnJlbnRfYm9vayAmJiBjdXJyZW50X2NoYXB0ZXIpIHtcbiAgICAgICAgICAgIG91dC5wdXNoKGAgW1ske3RhcmdldE9mKGN1cnJlbnRfYm9vayl9ICR7Y3VycmVudF9jaGFwdGVyfSNeJHt2ZXJzZX18JHtwYXJ0fV1dYCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dC5wdXNoKFwiIFwiICsgcGFydCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG91dC5wdXNoKChpID4gMCA/IFwiIFwiIDogXCJcIikgKyBwYXJ0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gLS0tLSBmdWxsIHJlZmVyZW5jZVxuICAgIGlmIChnLnJlZikge1xuICAgICAgY29uc3QgbW0gPSAoZy5yZWYgYXMgc3RyaW5nKS5tYXRjaCgvKFxccypbXFwuLDtdPykoLispLyk7XG4gICAgICBjb25zdCBsZWFkaW5nID0gbW0gPyBtbVsxXSA6IFwiXCI7XG4gICAgICBsZXQgcmVmVGV4dCA9IG1tID8gbW1bMl0gOiAoZy5yZWYgYXMgc3RyaW5nKTtcblxuICAgICAgY29uc3QgYm9va1N0YXJ0ID0gcmVmVGV4dC5tYXRjaChuZXcgUmVnRXhwKGBeKCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccyspYCkpO1xuICAgICAgbGV0IHByZWZpeDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgICBpZiAoYm9va1N0YXJ0KSB7XG4gICAgICAgIGNvbnN0IGJvb2tQYXJ0ID0gYm9va1N0YXJ0WzBdO1xuICAgICAgICBwcmVmaXggPSBib29rUGFydDsgLy8gZm9yIGRpc3BsYXkgdGV4dCAoY2FuIGtlZXAgaXRzIGRvdClcbiAgICAgICAgY3VycmVudF9ib29rID0gbm9ybWFsaXplQm9va1Rva2VuKGJvb2tQYXJ0LnJlcGxhY2UoL1xccyskLywgXCJcIiksIGN0eCk7IC8vIDwtLSBub3JtYWxpemUgZm9yIHRhcmdldFxuICAgICAgICByZWZUZXh0ID0gcmVmVGV4dC5zbGljZShib29rUGFydC5sZW5ndGgpO1xuICAgICAgfVxuICAgICAgaWYgKCFjdXJyZW50X2Jvb2spIHtcbiAgICAgICAgLy8gRmFsbGJhY2s6IGluZmVyIGJvb2sgZnJvbSBsZWZ0IGNvbnRleHQgKGUuZy4sIFwiXHUyMDI2IEpvaG4gMToyOTsgMTI6MjQ7IFx1MjAyNlwiKVxuICAgICAgICBjb25zdCBpbmZlcnJlZCA9IGZpbmRMYXN0Qm9va0JlZm9yZSh0ZXh0LCBzdGFydCwgY3R4KTtcbiAgICAgICAgaWYgKGluZmVycmVkKSB7XG4gICAgICAgICAgY3VycmVudF9ib29rID0gaW5mZXJyZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3V0LnB1c2gobVswXSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgcGFydHMgPSByZWZUZXh0LnJlcGxhY2UoL1xcLi9nLCBcIlwiKS50cmltKCkuc3BsaXQoLyg7fCwpLyk7XG4gICAgICBjb25zdCByZXN1bHQ6IHN0cmluZ1tdID0gW107XG4gICAgICBsZXQgdmVyc2VTdHJpbmcgPSBmYWxzZTtcbiAgICAgIGN1cnJlbnRfY2hhcHRlciA9IG51bGw7XG4gICAgICBsZXQgbG9jYWxfY3VycmVudF92ZXJzZTogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGFydCA9IHBhcnRzW2ldO1xuICAgICAgICBpZiAocGFydCA9PT0gXCIsXCIgfHwgcGFydCA9PT0gXCI7XCIpIHtcbiAgICAgICAgICByZXN1bHQucHVzaChwYXJ0ICsgXCIgXCIpO1xuICAgICAgICAgIHZlcnNlU3RyaW5nID0gKHBhcnQgPT09IFwiLFwiKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcCA9IHBhcnQudHJpbSgpO1xuICAgICAgICBpZiAoIXApIGNvbnRpbnVlO1xuXG4gICAgICAgIGxldCBjaGFwOiBzdHJpbmcgfCBudW1iZXIgfCBudWxsID0gY3VycmVudF9jaGFwdGVyO1xuICAgICAgICBsZXQgdjogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gICAgICAgIGxldCB2RW5kOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBpZiAocC5pbmNsdWRlcyhcIjpcIikpIHtcbiAgICAgICAgICBjb25zdCBbY1N0ciwgdlN0cl0gPSBwLnNwbGl0KFwiOlwiKTtcbiAgICAgICAgICBjaGFwID0gY1N0cjtcbiAgICAgICAgICB2ID0gdlN0cjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodmVyc2VTdHJpbmcpIHYgPSBwO1xuICAgICAgICAgIGVsc2UgeyBjaGFwID0gcDsgdiA9IG51bGw7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2hhcCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgIGNvbnN0IGNocyA9IFN0cmluZyhjaGFwID8/IFwiXCIpLnNwbGl0KFwiLVwiKTtcbiAgICAgICAgICBjaGFwID0gcGFyc2VJbnQoY2hzWzBdLnJlcGxhY2UoL1thLXpdJC9pLCBcIlwiKSwgMTApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICBjb25zdCB2cyA9IFN0cmluZyh2KS5zcGxpdChcIi1cIik7XG4gICAgICAgICAgbG9jYWxfY3VycmVudF92ZXJzZSA9IHBhcnNlSW50KHZzWzBdLnJlcGxhY2UoL1thLXpdJC9pLCBcIlwiKSwgMTApO1xuICAgICAgICAgIHZFbmQgPSB2cy5sZW5ndGggPiAxID8gcGFyc2VJbnQodnNbMV0ucmVwbGFjZSgvW2Etel0kL2ksIFwiXCIpLCAxMCkgOiBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxvY2FsX2N1cnJlbnRfdmVyc2UgPSBudWxsO1xuICAgICAgICAgIHZFbmQgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGFyZ2V0T2YoY3VycmVudF9ib29rKTtcblxuICAgICAgICBpZiAodkVuZCkge1xuICAgICAgICAgIGNvbnN0IGRpc3BsYXlTdGFydCA9IHAucmVwbGFjZSgvXFxkK1thLXpdPyQvaSwgXCJcIik7XG4gICAgICAgICAgcmVzdWx0LnB1c2goYFtbJHt0YXJnZXR9I14ke2NoYXB9LSR7bG9jYWxfY3VycmVudF92ZXJzZX18JHtwcmVmaXggPyBwcmVmaXggOiBcIlwifSR7ZGlzcGxheVN0YXJ0fV1dYCk7XG4gICAgICAgICAgcmVzdWx0LnB1c2goYFtbJHt0YXJnZXR9I14ke2NoYXB9LSR7dkVuZH18JHtTdHJpbmcocCkubWF0Y2goLyhcXGQrW2Etel0/KSQvaSk/LlsxXSA/PyBcIlwifV1dYCk7XG4gICAgICAgICAgbG9jYWxfY3VycmVudF92ZXJzZSA9IHZFbmQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0LnB1c2goYFtbJHt0YXJnZXR9I14ke2NoYXB9JHtsb2NhbF9jdXJyZW50X3ZlcnNlID8gYC0ke2xvY2FsX2N1cnJlbnRfdmVyc2V9YCA6IFwiXCJ9fCR7cHJlZml4ID8gcHJlZml4IDogXCJcIn0ke3B9XV1gKTtcbiAgICAgICAgfVxuICAgICAgICBwcmVmaXggPSBudWxsO1xuICAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBjaGFwO1xuICAgICAgICBjdXJyZW50X3ZlcnNlID0gbG9jYWxfY3VycmVudF92ZXJzZTtcbiAgICAgIH1cblxuICAgICAgb3V0LnB1c2gobGVhZGluZyArIHJlc3VsdC5qb2luKFwiXCIpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIG91dC5wdXNoKG1bMF0pO1xuICB9XG5cbiAgb3V0LnB1c2godGV4dC5zbGljZShsYXN0UG9zKSk7XG4gIHJldHVybiBvdXQuam9pbihcIlwiKTtcbn1cblxuLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQdWJsaWMgQVBJIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxpbmtWZXJzZXNJblRleHQoXG4gIHRleHQ6IHN0cmluZyxcbiAgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncyxcbiAgdmVyc2lvblNob3J0Pzogc3RyaW5nIHwgbnVsbFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgY3R4ID0gYnVpbGRCb29rQ29udGV4dChzZXR0aW5ncyk7XG5cbiAgY29uc3QgcmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MgPSAoc2V0dGluZ3MgYXMgYW55KT8ucmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MgPz8gdHJ1ZTtcbiAgY29uc3QgcmV3cml0ZU9sZE9ic2lkaWFuTGlua3MgPSAoc2V0dGluZ3MgYXMgYW55KT8ucmV3cml0ZU9sZE9ic2lkaWFuTGlua3MgPz8gdHJ1ZTtcbiAgY29uc3Qgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSA9IChzZXR0aW5ncyBhcyBhbnkpPy5zdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlID8/IHRydWU7XG5cbiAgcmV0dXJuIHJlcGxhY2VWZXJzZVJlZmVyZW5jZXNPZk1haW5UZXh0KHRleHQsIGN0eCwge1xuICAgIHJlbW92ZU9ic2lkaWFuTGlua3M6IHJlbW92ZU9ic2lkaWFuRGlzcGxheUxpbmtzLFxuICAgIHJld3JpdGVPbGRMaW5rczogcmV3cml0ZU9sZE9ic2lkaWFuTGlua3MsXG4gICAgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSxcbiAgICB2ZXJzaW9uU2hvcnQ6IHZlcnNpb25TaG9ydCA/PyBudWxsLFxuICB9KTtcbn1cblxuLyoqID09PT09PT09PT09PT09PT09PT09PT09PT09IFZlcnNpb24gUGlja2VyIChCb2xscykgPT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxudHlwZSBCb2xsc0xhbmd1YWdlID0ge1xuICBsYW5ndWFnZTogc3RyaW5nO1xuICB0cmFuc2xhdGlvbnM6IHsgc2hvcnRfbmFtZTogc3RyaW5nOyBmdWxsX25hbWU6IHN0cmluZzsgdXBkYXRlZD86IG51bWJlcjsgZGlyPzogXCJydGxcIiB8IFwibHRyXCIgfVtdO1xufTtcblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hKc29uPFQ+KHVybDogc3RyaW5nKTogUHJvbWlzZTxUPiB7XG4gIGNvbnN0IHJlc3AgPSBhd2FpdCByZXF1ZXN0VXJsKHsgdXJsLCBtZXRob2Q6IFwiR0VUXCIgfSk7XG4gIGlmIChyZXNwLnN0YXR1cyA8IDIwMCB8fCByZXNwLnN0YXR1cyA+PSAzMDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7cmVzcC5zdGF0dXN9YCk7XG4gIH1cbiAgY29uc3QgdGV4dCA9IHJlc3AudGV4dCA/PyBcIlwiO1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHRleHQpIGFzIFQ7XG4gIH0gY2F0Y2gge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBKU09OIGZyb20gJHt1cmx9YCk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZEJvbGxzQ2F0YWxvZ3VlKCk6IFByb21pc2U8Qm9sbHNMYW5ndWFnZVtdPiB7XG4gIGNvbnN0IFVSTCA9IFwiaHR0cHM6Ly9ib2xscy5saWZlL3N0YXRpYy9ib2xscy9hcHAvdmlld3MvbGFuZ3VhZ2VzLmpzb25cIjtcbiAgcmV0dXJuIGF3YWl0IGZldGNoSnNvbjxCb2xsc0xhbmd1YWdlW10+KFVSTCk7XG59XG5cbi8vIGNsYXNzIFBpY2tWZXJzaW9uTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4vLyAgIHByaXZhdGUgbGFuZ3M6IEJvbGxzTGFuZ3VhZ2VbXSA9IFtdO1xuLy8gICBwcml2YXRlIG9uUGljazogKHZlclNob3J0OiBzdHJpbmcgfCBudWxsKSA9PiB2b2lkO1xuLy8gICBwcml2YXRlIGNob3NlbkxhbmdJZHggPSAwO1xuLy8gICBwcml2YXRlIGNob3NlblZlcklkeCA9IDA7XG5cbi8vICAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGxhbmdzOiBCb2xsc0xhbmd1YWdlW10sIG9uUGljazogKHZlclNob3J0OiBzdHJpbmcgfCBudWxsKSA9PiB2b2lkKSB7XG4vLyAgICAgc3VwZXIoYXBwKTtcbi8vICAgICB0aGlzLmxhbmdzID0gbGFuZ3M7XG4vLyAgICAgdGhpcy5vblBpY2sgPSBvblBpY2s7XG4vLyAgIH1cblxuLy8gICBvbk9wZW4oKSB7XG4vLyAgICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4vLyAgICAgY29udGVudEVsLmVtcHR5KCk7XG4vLyAgICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkxpbmsgdmVyc2VzOiBjaG9vc2UgQmlibGUgdmVyc2lvbiAob3B0aW9uYWwpXCIgfSk7XG5cbi8vICAgICBsZXQgbGFuZ1NlbDogSFRNTFNlbGVjdEVsZW1lbnQ7XG4vLyAgICAgbGV0IHZlclNlbDogSFRNTFNlbGVjdEVsZW1lbnQ7XG5cbi8vICAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4vLyAgICAgICAuc2V0TmFtZShcIkxhbmd1YWdlXCIpXG4vLyAgICAgICAuYWRkRHJvcGRvd24oKGQpID0+IHtcbi8vICAgICAgICAgbGFuZ1NlbCA9IGQuc2VsZWN0RWw7XG4vLyAgICAgICAgIHRoaXMubGFuZ3MuZm9yRWFjaCgobCwgaWR4KSA9PiBkLmFkZE9wdGlvbihTdHJpbmcoaWR4KSwgbC5sYW5ndWFnZSkpO1xuLy8gICAgICAgICBkLnNldFZhbHVlKFN0cmluZyh0aGlzLmNob3NlbkxhbmdJZHgpKTtcbi8vICAgICAgICAgZC5vbkNoYW5nZSgodikgPT4ge1xuLy8gICAgICAgICAgIHRoaXMuY2hvc2VuTGFuZ0lkeCA9IHBhcnNlSW50KHYsIDEwKTtcbi8vICAgICAgICAgICAvLyByZWJ1aWxkIHZlcnNpb25zXG4vLyAgICAgICAgICAgdmVyU2VsIS5lbXB0eSgpO1xuLy8gICAgICAgICAgIGNvbnN0IHRyYW5zID0gdGhpcy5sYW5nc1t0aGlzLmNob3NlbkxhbmdJZHhdLnRyYW5zbGF0aW9ucztcbi8vICAgICAgICAgICB0cmFucy5mb3JFYWNoKCh0LCBpKSA9PiB7XG4vLyAgICAgICAgICAgICBjb25zdCBsYWJlbCA9IGAke3QuZnVsbF9uYW1lfSAoJHt0LnNob3J0X25hbWV9KWA7XG4vLyAgICAgICAgICAgICBjb25zdCBvcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpO1xuLy8gICAgICAgICAgICAgb3B0LnZhbHVlID0gU3RyaW5nKGkpO1xuLy8gICAgICAgICAgICAgb3B0LnRleHQgPSBsYWJlbDtcbi8vICAgICAgICAgICAgIHZlclNlbCEuYXBwZW5kQ2hpbGQob3B0KTtcbi8vICAgICAgICAgICB9KTtcbi8vICAgICAgICAgICB0aGlzLmNob3NlblZlcklkeCA9IDA7XG4vLyAgICAgICAgICAgdmVyU2VsIS52YWx1ZSA9IFwiMFwiO1xuLy8gICAgICAgICB9KTtcbi8vICAgICAgIH0pO1xuXG4vLyAgICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuLy8gICAgICAgLnNldE5hbWUoXCJUcmFuc2xhdGlvblwiKVxuLy8gICAgICAgLmFkZERyb3Bkb3duKChkKSA9PiB7XG4vLyAgICAgICAgIHZlclNlbCA9IGQuc2VsZWN0RWw7XG4vLyAgICAgICAgIGNvbnN0IHRyYW5zID0gdGhpcy5sYW5nc1t0aGlzLmNob3NlbkxhbmdJZHhdPy50cmFuc2xhdGlvbnMgPz8gW107XG4vLyAgICAgICAgIHRyYW5zLmZvckVhY2goKHQsIGkpID0+IHtcbi8vICAgICAgICAgICBkLmFkZE9wdGlvbihTdHJpbmcoaSksIGAke3QuZnVsbF9uYW1lfSAoJHt0LnNob3J0X25hbWV9KWApO1xuLy8gICAgICAgICB9KTtcbi8vICAgICAgICAgZC5zZXRWYWx1ZShcIjBcIik7XG4vLyAgICAgICAgIGQub25DaGFuZ2UoKHYpID0+ICh0aGlzLmNob3NlblZlcklkeCA9IHBhcnNlSW50KHYsIDEwKSkpO1xuLy8gICAgICAgfSk7XG5cbi8vICAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4vLyAgICAgICAuc2V0TmFtZShcIkhvdyB0byBsaW5rXCIpXG4vLyAgICAgICAuc2V0RGVzYyhcIklmIHlvdSBjYW5jZWwsIGxpbmtzIHdpbGwgdXNlIGRlZmF1bHQgKG5vIHZlcnNpb24pLlwiKVxuLy8gICAgICAgLmFkZEJ1dHRvbigoYikgPT5cbi8vICAgICAgICAgYi5zZXRCdXR0b25UZXh0KFwiVXNlIHNlbGVjdGVkIHZlcnNpb25cIikuc2V0Q3RhKCkub25DbGljaygoKSA9PiB7XG4vLyAgICAgICAgICAgY29uc3QgdmVyID0gdGhpcy5sYW5nc1t0aGlzLmNob3NlbkxhbmdJZHhdLnRyYW5zbGF0aW9uc1t0aGlzLmNob3NlblZlcklkeF07XG4vLyAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuLy8gICAgICAgICAgIHRoaXMub25QaWNrKHZlcj8uc2hvcnRfbmFtZSA/PyBudWxsKTtcbi8vICAgICAgICAgfSlcbi8vICAgICAgIClcbi8vICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoYikgPT5cbi8vICAgICAgICAgYi5zZXRJY29uKFwieFwiKS5zZXRUb29sdGlwKFwiQ2FuY2VsIChubyB2ZXJzaW9uKVwiKS5vbkNsaWNrKCgpID0+IHtcbi8vICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4vLyAgICAgICAgICAgdGhpcy5vblBpY2sobnVsbCk7XG4vLyAgICAgICAgIH0pXG4vLyAgICAgICApO1xuLy8gICB9XG4vLyB9XG5cblxuLyoqID09PT09PT09PT09PT09PT09PT09PT09PT09IENvbW1hbmRzID09PT09PT09PT09PT09PT09PT09PT09PT09ICovXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kVmVyc2VMaW5rcyhhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncywgcGFyYW1zPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPikge1xuICBjb25zdCBzY29wZSA9IHBhcmFtcz8uc2NvcGUgPz8gXCJjdXJyZW50XCI7XG5cbiAgY29uc3QgZmlsZSA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICBpZiAoc2NvcGUgPT09IFwiZm9sZGVyXCIpIHtcbiAgICBjb25zdCBhY3RpdmUgPSBmaWxlO1xuICAgIGNvbnN0IGZvbGRlciA9IGFjdGl2ZT8ucGFyZW50O1xuICAgIGlmICghYWN0aXZlIHx8ICFmb2xkZXIpIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBpbnNpZGUgdGhlIHRhcmdldCBmb2xkZXIuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBURmlsZSAmJiBjaGlsZC5leHRlbnNpb24gPT09IFwibWRcIikge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoY2hpbGQpO1xuICAgICAgICBjb25zdCB7IHlhbWwsIGJvZHkgfSA9IHNwbGl0RnJvbnRtYXR0ZXIoY29udGVudCk7XG4gICAgICAgIGNvbnN0IGxpbmtlZCA9IGF3YWl0IGxpbmtWZXJzZXNJblRleHQoYm9keSwgc2V0dGluZ3MsIG51bGwpOyAvLyBkZWZhdWx0OiBubyB2ZXJzaW9uXG4gICAgICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoY2hpbGQsICh5YW1sID8/IFwiXCIpICsgbGlua2VkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbmV3IE5vdGljZShcIkxpbmtlZCB2ZXJzZXMgaW4gZm9sZGVyLlwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoIWZpbGUpIHtcbiAgICBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgZmlyc3QuXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcbiAgY29uc3QgeyB5YW1sLCBib2R5IH0gPSBzcGxpdEZyb250bWF0dGVyKGNvbnRlbnQpO1xuICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KGJvZHksIHNldHRpbmdzLCBudWxsKTsgLy8gZGVmYXVsdDogbm8gdmVyc2lvblxuICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGZpbGUsICh5YW1sID8/IFwiXCIpICsgbGlua2VkKTtcbiAgbmV3IE5vdGljZShcIkxpbmtlZCB2ZXJzZXMgaW4gY3VycmVudCBmaWxlLlwiKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbW1hbmRWZXJzZUxpbmtzU2VsZWN0aW9uT3JMaW5lKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IG1kVmlldyA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICBpZiAoIW1kVmlldykge1xuICAgIG5ldyBOb3RpY2UoXCJPcGVuIGEgTWFya2Rvd24gZmlsZSBmaXJzdC5cIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgZWRpdG9yID0gbWRWaWV3LmVkaXRvcjtcbiAgY29uc3Qgc2VsZWN0aW9uVGV4dCA9IGVkaXRvci5nZXRTZWxlY3Rpb24oKTtcblxuICBjb25zdCBydW4gPSBhc3luYyAodGV4dDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgbGlua2VkID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dCh0ZXh0LCBzZXR0aW5ncywgbnVsbCk7IC8vIGRlZmF1bHQ6IG5vIHZlcnNpb25cbiAgICByZXR1cm4gbGlua2VkO1xuICB9O1xuXG4gIGlmIChzZWxlY3Rpb25UZXh0ICYmIHNlbGVjdGlvblRleHQubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGxpbmtlZCA9IGF3YWl0IHJ1bihzZWxlY3Rpb25UZXh0KTtcbiAgICBpZiAobGlua2VkICE9PSBzZWxlY3Rpb25UZXh0KSB7XG4gICAgICBlZGl0b3IucmVwbGFjZVNlbGVjdGlvbihsaW5rZWQpO1xuICAgICAgbmV3IE5vdGljZShcIkxpbmtlZCB2ZXJzZXMgaW4gc2VsZWN0aW9uLlwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3IE5vdGljZShcIk5vIGxpbmthYmxlIHZlcnNlcyBpbiBzZWxlY3Rpb24uXCIpO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBsaW5lID0gZWRpdG9yLmdldEN1cnNvcigpLmxpbmU7XG4gIGNvbnN0IGxpbmVUZXh0ID0gZWRpdG9yLmdldExpbmUobGluZSk7XG4gIGNvbnN0IGxpbmtlZCA9IGF3YWl0IHJ1bihsaW5lVGV4dCk7XG4gIGlmIChsaW5rZWQgIT09IGxpbmVUZXh0KSB7XG4gICAgZWRpdG9yLnNldExpbmUobGluZSwgbGlua2VkKTtcbiAgICBuZXcgTm90aWNlKFwiTGlua2VkIHZlcnNlcyBvbiBjdXJyZW50IGxpbmUuXCIpO1xuICB9IGVsc2Uge1xuICAgIG5ldyBOb3RpY2UoXCJObyBsaW5rYWJsZSB2ZXJzZXMgb24gY3VycmVudCBsaW5lLlwiKTtcbiAgfVxufVxuXG4vKipcbiAqIE5FVzogU2FtZSBhcyBhYm92ZSwgYnV0IGFza3MgdXNlciB0byBjaG9vc2UgYSB2ZXJzaW9uIChpZiBjYXRhbG9ndWUgbG9hZHMpLlxuICogSWYgdXNlciBjYW5jZWxzIC8gZmFpbHMgdG8gbG9hZCwgZmFsbHMgYmFjayB0byBuby12ZXJzaW9uLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZFZlcnNlTGlua3NDaG9vc2VWZXJzaW9uKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgaWYgKCFmaWxlKSB7XG4gICAgbmV3IE5vdGljZShcIk9wZW4gYSBmaWxlIGZpcnN0LlwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2U8c3RyaW5nPigocmVzb2x2ZSkgPT4ge1xuICAgIG5ldyBQaWNrVmVyc2lvbk1vZGFsKGFwcCwgc2V0dGluZ3MsIGFzeW5jICh2ZXJzaW9uU2hvcnQpID0+IHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICAgIGNvbnN0IHsgeWFtbCwgYm9keSB9ID0gc3BsaXRGcm9udG1hdHRlcihjb250ZW50KTtcbiAgICAgIGNvbnN0IGxpbmtlZCA9IGF3YWl0IGxpbmtWZXJzZXNJblRleHQoYm9keSwgc2V0dGluZ3MsIHZlcnNpb25TaG9ydCk7XG4gICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGZpbGUsICh5YW1sID8/IFwiXCIpICsgbGlua2VkKTtcbiAgICAgIG5ldyBOb3RpY2UodmVyc2lvblNob3J0ID8gYExpbmtlZCB2ZXJzZXMgKFx1MjE5MiAke3ZlcnNpb25TaG9ydH0pLmAgOiBcIkxpbmtlZCB2ZXJzZXMgKG5vIHZlcnNpb24pLlwiKTtcbiAgICAgIHJlc29sdmUobGlua2VkKTtcbiAgICB9KS5vcGVuKCk7XG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZFZlcnNlTGlua3NTZWxlY3Rpb25PckxpbmVDaG9vc2VWZXJzaW9uKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IG1kVmlldyA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICBpZiAoIW1kVmlldykge1xuICAgIG5ldyBOb3RpY2UoXCJPcGVuIGEgTWFya2Rvd24gZmlsZSBmaXJzdC5cIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlKSA9PiB7XG4gICAgbmV3IFBpY2tWZXJzaW9uTW9kYWwoYXBwLCBzZXR0aW5ncywgYXN5bmMgKHZlcnNpb25TaG9ydCkgPT4ge1xuICAgICAgY29uc3QgZWRpdG9yID0gbWRWaWV3LmVkaXRvcjtcbiAgICAgIGNvbnN0IHNlbGVjdGlvblRleHQgPSBlZGl0b3IuZ2V0U2VsZWN0aW9uKCk7XG5cbiAgICAgIGNvbnN0IHJ1biA9IGFzeW5jICh0ZXh0OiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3QgbGlua2VkID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dCh0ZXh0LCBzZXR0aW5ncywgdmVyc2lvblNob3J0KTtcbiAgICAgICAgcmV0dXJuIGxpbmtlZDtcbiAgICAgIH07XG5cbiAgICAgIGlmIChzZWxlY3Rpb25UZXh0ICYmIHNlbGVjdGlvblRleHQubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBydW4oc2VsZWN0aW9uVGV4dCk7XG4gICAgICAgIGlmIChsaW5rZWQgIT09IHNlbGVjdGlvblRleHQpIHtcbiAgICAgICAgICBlZGl0b3IucmVwbGFjZVNlbGVjdGlvbihsaW5rZWQpO1xuICAgICAgICAgIG5ldyBOb3RpY2UoXG4gICAgICAgICAgICB2ZXJzaW9uU2hvcnQgPyBgTGlua2VkIChzZWxlY3Rpb24pIFx1MjE5MiAke3ZlcnNpb25TaG9ydH0uYCA6IFwiTGlua2VkIChzZWxlY3Rpb24pIHdpdGhvdXQgdmVyc2lvbi5cIlxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3IE5vdGljZShcIk5vIGxpbmthYmxlIHZlcnNlcyBpbiBzZWxlY3Rpb24uXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRDdXJzb3IoKS5saW5lO1xuICAgICAgY29uc3QgbGluZVRleHQgPSBlZGl0b3IuZ2V0TGluZShsaW5lKTtcbiAgICAgIGNvbnN0IGxpbmtlZCA9IGF3YWl0IHJ1bihsaW5lVGV4dCk7XG4gICAgICBpZiAobGlua2VkICE9PSBsaW5lVGV4dCkge1xuICAgICAgICBlZGl0b3Iuc2V0TGluZShsaW5lLCBsaW5rZWQpO1xuICAgICAgICBuZXcgTm90aWNlKHZlcnNpb25TaG9ydCA/IGBMaW5rZWQgKGxpbmUpIFx1MjE5MiAke3ZlcnNpb25TaG9ydH0uYCA6IFwiTGlua2VkIChsaW5lKSB3aXRob3V0IHZlcnNpb24uXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3IE5vdGljZShcIk5vIGxpbmthYmxlIHZlcnNlcyBvbiBjdXJyZW50IGxpbmUuXCIpO1xuICAgICAgfVxuICAgICAgcmVzb2x2ZShsaW5rZWQpO1xuICAgIH0pLm9wZW4oKTtcbiAgfSk7XG59XG5cbi8vIGltcG9ydCB7IEFwcCwgTWFya2Rvd25WaWV3LCBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG4vLyBpbXBvcnQgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbi8vIGltcG9ydCB7IHNwbGl0RnJvbnRtYXR0ZXIgfSBmcm9tIFwiLi4vbGliL21kVXRpbHNcIjtcblxuLy8gLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gICogIEJPT0sgTUFQIChkZWZhdWx0LCBFbmdsaXNoKVxuLy8gICogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG4vLyBjb25zdCBCT09LX0FCQlI6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4vLyAgIFwiR2VuZXNpc1wiOiBcIkdlblwiLFxuLy8gICBcIkV4b2R1c1wiOiBcIkV4b1wiLFxuLy8gICBcIkxldml0aWN1c1wiOiBcIkxldlwiLFxuLy8gICBcIk51bWJlcnNcIjogXCJOdW1cIixcbi8vICAgXCJEZXV0ZXJvbm9teVwiOiBcIkRldXRcIixcbi8vICAgXCJKb3NodWFcIjogXCJKb3NoXCIsXG4vLyAgIFwiSnVkZ2VzXCI6IFwiSnVkZ1wiLFxuLy8gICBcIlJ1dGhcIjogXCJSdXRoXCIsXG4vLyAgIFwiMSBTYW11ZWxcIjogXCIxIFNhbVwiLFxuLy8gICBcIkZpcnN0IFNhbXVlbFwiOiBcIjEgU2FtXCIsXG4vLyAgIFwiMiBTYW11ZWxcIjogXCIyIFNhbVwiLFxuLy8gICBcIlNlY29uZCBTYW11ZWxcIjogXCIyIFNhbVwiLFxuLy8gICBcIjEgS2luZ3NcIjogXCIxIEtpbmdzXCIsXG4vLyAgIFwiRmlyc3QgS2luZ3NcIjogXCIxIEtpbmdzXCIsXG4vLyAgIFwiMiBLaW5nc1wiOiBcIjIgS2luZ3NcIixcbi8vICAgXCJTZWNvbmQgS2luZ3NcIjogXCIyIEtpbmdzXCIsXG4vLyAgIFwiMSBDaHJvbmljbGVzXCI6IFwiMSBDaHJvblwiLFxuLy8gICBcIkZpcnN0IENocm9uaWNsZXNcIjogXCIxIENocm9uXCIsXG4vLyAgIFwiMiBDaHJvbmljbGVzXCI6IFwiMiBDaHJvblwiLFxuLy8gICBcIlNlY29uZCBDaHJvbmljbGVzXCI6IFwiMiBDaHJvblwiLFxuLy8gICBcIkV6cmFcIjogXCJFenJhXCIsXG4vLyAgIFwiTmVoZW1pYWhcIjogXCJOZWhcIixcbi8vICAgXCJFc3RoZXJcIjogXCJFc3RoXCIsXG4vLyAgIFwiSm9iXCI6IFwiSm9iXCIsXG4vLyAgIFwiUHNhbG1zXCI6IFwiUHNhXCIsXG4vLyAgIFwiUHNhbG1cIjogXCJQc2FcIixcbi8vICAgXCJQcm92ZXJic1wiOiBcIlByb3ZcIixcbi8vICAgXCJFY2NsZXNpYXN0ZXNcIjogXCJFY2NsXCIsXG4vLyAgIFwiU29uZyBvZiBTb2xvbW9uXCI6IFwiU29TXCIsXG4vLyAgIFwiU29uZyBvZiBTb25nc1wiOiBcIlNvU1wiLFxuLy8gICBcIlMuU1wiOiBcIlNvU1wiLFxuLy8gICBcIlMuUy5cIjogXCJTb1NcIixcbi8vICAgXCJTLiBTLlwiOiBcIlNvU1wiLFxuLy8gICBcIlMuIFNcIjogXCJTb1NcIixcbi8vICAgXCJTU1wiOiBcIlNvU1wiLFxuLy8gICBcIklzYWlhaFwiOiBcIklzYVwiLFxuLy8gICBcIkplcmVtaWFoXCI6IFwiSmVyXCIsXG4vLyAgIFwiTGFtZW50YXRpb25zXCI6IFwiTGFtXCIsXG4vLyAgIFwiRXpla2llbFwiOiBcIkV6ZWtcIixcbi8vICAgXCJEYW5pZWxcIjogXCJEYW5cIixcbi8vICAgXCJIb3NlYVwiOiBcIkhvc2VhXCIsXG4vLyAgIFwiSm9lbFwiOiBcIkpvZWxcIixcbi8vICAgXCJBbW9zXCI6IFwiQW1vc1wiLFxuLy8gICBcIk9iYWRpYWhcIjogXCJPYmFkXCIsXG4vLyAgIFwiSm9uYWhcIjogXCJKb25haFwiLFxuLy8gICBcIk1pY2FoXCI6IFwiTWljYWhcIixcbi8vICAgXCJOYWh1bVwiOiBcIk5haFwiLFxuLy8gICBcIkhhYmFra3VrXCI6IFwiSGFiXCIsXG4vLyAgIFwiWmVwaGFuaWFoXCI6IFwiWmVwXCIsXG4vLyAgIFwiSGFnZ2FpXCI6IFwiSGFnXCIsXG4vLyAgIFwiWmVjaGFyaWFoXCI6IFwiWmVjaFwiLFxuLy8gICBcIk1hbGFjaGlcIjogXCJNYWxcIixcbi8vICAgXCJNYXR0aGV3XCI6IFwiTWF0dFwiLFxuLy8gICBcIk1hcmtcIjogXCJNYXJrXCIsXG4vLyAgIFwiTHVrZVwiOiBcIkx1a2VcIixcbi8vICAgXCJKb2huXCI6IFwiSm9oblwiLFxuLy8gICBcIkFjdHNcIjogXCJBY3RzXCIsXG4vLyAgIFwiUm9tYW5zXCI6IFwiUm9tXCIsXG4vLyAgIFwiMSBDb3JpbnRoaWFuc1wiOiBcIjEgQ29yXCIsXG4vLyAgIFwiRmlyc3QgQ29yaW50aGlhbnNcIjogXCIxIENvclwiLFxuLy8gICBcIjIgQ29yaW50aGlhbnNcIjogXCIyIENvclwiLFxuLy8gICBcIlNlY29uZCBDb3JpbnRoaWFuc1wiOiBcIjIgQ29yXCIsXG4vLyAgIFwiR2FsYXRpYW5zXCI6IFwiR2FsXCIsXG4vLyAgIFwiRXBoZXNpYW5zXCI6IFwiRXBoXCIsXG4vLyAgIFwiUGhpbGlwcGlhbnNcIjogXCJQaGlsXCIsXG4vLyAgIFwiQ29sb3NzaWFuc1wiOiBcIkNvbFwiLFxuLy8gICBcIjEgVGhlc3NhbG9uaWFuc1wiOiBcIjEgVGhlc1wiLFxuLy8gICBcIkZpcnN0IFRoZXNzYWxvbmlhbnNcIjogXCIxIFRoZXNcIixcbi8vICAgXCIyIFRoZXNzYWxvbmlhbnNcIjogXCIyIFRoZXNcIixcbi8vICAgXCJTZWNvbmQgVGhlc3NhbG9uaWFuc1wiOiBcIjIgVGhlc1wiLFxuLy8gICBcIjEgVGltb3RoeVwiOiBcIjEgVGltXCIsXG4vLyAgIFwiRmlyc3QgVGltb3RoeVwiOiBcIjEgVGltXCIsXG4vLyAgIFwiMiBUaW1vdGh5XCI6IFwiMiBUaW1cIixcbi8vICAgXCJTZWNvbmQgVGltb3RoeVwiOiBcIjIgVGltXCIsXG4vLyAgIFwiVGl0dXNcIjogXCJUaXR1c1wiLFxuLy8gICBcIlBoaWxlbW9uXCI6IFwiUGhpbGVtXCIsXG4vLyAgIFwiSGVicmV3c1wiOiBcIkhlYlwiLFxuLy8gICBcIkphbWVzXCI6IFwiSmFtZXNcIixcbi8vICAgXCIxIFBldGVyXCI6IFwiMSBQZXRcIixcbi8vICAgXCJGaXJzdCBQZXRlclwiOiBcIjEgUGV0XCIsXG4vLyAgIFwiMiBQZXRlclwiOiBcIjIgUGV0XCIsXG4vLyAgIFwiU2Vjb25kIFBldGVyXCI6IFwiMiBQZXRcIixcbi8vICAgXCIxIEpvaG5cIjogXCIxIEpvaG5cIixcbi8vICAgXCJGaXJzdCBKb2huXCI6IFwiMSBKb2huXCIsXG4vLyAgIFwiMiBKb2huXCI6IFwiMiBKb2huXCIsXG4vLyAgIFwiU2Vjb25kIEpvaG5cIjogXCIyIEpvaG5cIixcbi8vICAgXCIzIEpvaG5cIjogXCIzIEpvaG5cIixcbi8vICAgXCJUaGlyZCBKb2huXCI6IFwiMyBKb2huXCIsXG4vLyAgIFwiSnVkZVwiOiBcIkp1ZGVcIixcbi8vICAgXCJSZXZlbGF0aW9uXCI6IFwiUmV2XCJcbi8vIH07XG5cbi8vIHR5cGUgQm9va01hcCA9IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4vLyBjb25zdCBlc2NhcGVSZSA9IChzOiBzdHJpbmcpID0+IHMucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xuXG4vLyAvKiogQnVpbGQgbG9jYWxlLXNwZWNpZmljIGJvb2sgbWFwICsgYWx0ZXJuYXRpb24gYXQgcnVudGltZSAqL1xuLy8gZnVuY3Rpb24gYnVpbGRCb29rQ29udGV4dChzZXR0aW5ncz86IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuLy8gICBsZXQgYm9va0xvY2FsZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuLy8gICBsZXQgY3VzdG9tOiB1bmtub3duO1xuXG4vLyAgIHRyeSB7IGJvb2tMb2NhbGUgPSAoc2V0dGluZ3MgYXMgYW55KT8uYm9va0xvY2FsZSBhcyBzdHJpbmcgfCB1bmRlZmluZWQ7IH0gY2F0Y2gge31cbi8vICAgdHJ5IHsgY3VzdG9tID0gKHNldHRpbmdzIGFzIGFueSk/LmN1c3RvbUJvb2tNYXA7IH0gY2F0Y2gge31cblxuLy8gICBsZXQgYWJicjogQm9va01hcCA9IEJPT0tfQUJCUjtcblxuLy8gICBpZiAoYm9va0xvY2FsZSA9PT0gXCJjdXN0b21cIiAmJiBjdXN0b20pIHtcbi8vICAgICB0cnkge1xuLy8gICAgICAgaWYgKHR5cGVvZiBjdXN0b20gPT09IFwic3RyaW5nXCIpIHtcbi8vICAgICAgICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShjdXN0b20pO1xuLy8gICAgICAgICBpZiAocGFyc2VkICYmIHR5cGVvZiBwYXJzZWQgPT09IFwib2JqZWN0XCIpIGFiYnIgPSBwYXJzZWQgYXMgQm9va01hcDtcbi8vICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGN1c3RvbSA9PT0gXCJvYmplY3RcIikge1xuLy8gICAgICAgICBhYmJyID0gY3VzdG9tIGFzIEJvb2tNYXA7XG4vLyAgICAgICB9XG4vLyAgICAgfSBjYXRjaCB7XG4vLyAgICAgICBhYmJyID0gQk9PS19BQkJSO1xuLy8gICAgIH1cbi8vICAgfSBlbHNlIHtcbi8vICAgICBhYmJyID0gQk9PS19BQkJSO1xuLy8gICB9XG5cbi8vICAgY29uc3QgYWxsVG9rZW5zID0gQXJyYXkuZnJvbShuZXcgU2V0KFsuLi5PYmplY3Qua2V5cyhhYmJyKSwgLi4uT2JqZWN0LnZhbHVlcyhhYmJyKV0pKS5zb3J0KFxuLy8gICAgIChhLCBiKSA9PiBiLmxlbmd0aCAtIGEubGVuZ3RoXG4vLyAgICk7XG4vLyAgIGNvbnN0IEJPT0tfQUxUID0gYWxsVG9rZW5zLm1hcChlc2NhcGVSZSkuam9pbihcInxcIik7XG5cbi8vICAgY29uc3QgZ2V0Qm9va0FiYnIgPSAoYm9vazogc3RyaW5nKSA9PiBhYmJyW2Jvb2tdID8/IGJvb2s7XG5cbi8vICAgY29uc3QgYnVpbGRQYXR0ZXJuQm9keSA9ICgpOiBzdHJpbmcgPT4ge1xuLy8gICAgIGNvbnN0IGJvb2sgPSBgKD86JHtCT09LX0FMVH0pYDtcbi8vICAgICAvLyBjb25zdCByZWYxID1cbi8vICAgICAvLyAgIGAoPzooPzoke2Jvb2t9KVxcXFwuP1xcXFxzKmAgK1xuLy8gICAgIC8vICAgYFxcXFxkKyg/Oi1cXFxcZCspPzpcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT9gICtcbi8vICAgICAvLyAgIGAoPzpcXFxccyosXFxcXHMqXFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/fFxcXFxzKjtcXFxccypcXFxcZCs6XFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/KSpgICtcbi8vICAgICAvLyAgIGApYDtcbi8vICAgICBjb25zdCByZWYxID1cbi8vICAgICAgIGAoPzooPzoke2Jvb2t9KT9cXFxcLj9cXFxccypgICtcbi8vICAgICAgIGBcXFxcZCsoPzotXFxcXGQrKT86XFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/YCArXG4vLyAgICAgICBgKD86XFxcXHMqLFxcXFxzKlxcXFxkK1thLXpdPyg/Oi1cXFxcZCspP1thLXpdP3xcXFxccyo7XFxcXHMqXFxcXGQrOlxcXFxkK1thLXpdPyg/Oi1cXFxcZCspP1thLXpdPykqYCArXG4vLyAgICAgICBgKWA7XG4vLyAgICAgY29uc3QgcmVmMiA9IGAoPzooJHtib29rfSlcXFxcLj9cXFxccysoXFxcXGQrKSg/Oi0oXFxcXGQrKSk/KWA7XG4vLyAgICAgY29uc3QgUkVGID0gYCg/PHJlZj4ke3JlZjF9fCR7cmVmMn0pYDtcblxuLy8gICAgIGNvbnN0IFZFUlNFID1cbi8vICAgICAgIGAoPzx2ZXJzZT5gICtcbi8vICAgICAgIGBcXFxcYltWdl12Pyg/OlxcXFwufGVyc2VzPylcXFxccypgICtcbi8vICAgICAgIGBcXFxcZCsoPzotXFxcXGQrKT9bYS16XT9gICtcbi8vICAgICAgIGAoPzooPzosfCw/XFxcXHMqYW5kKVxcXFxzKlxcXFxkKyg/Oi1cXFxcZCspP1thLXpdPykqYCArXG4vLyAgICAgICBgKWA7XG5cbi8vICAgICBjb25zdCBDSEFQVEVSID1cbi8vICAgICAgIGAoPzxjaGFwdGVyPmAgK1xuLy8gICAgICAgYFxcXFxiW0NjXWgoPzphcHRlcnM/fHM/XFxcXC4pXFxcXC4/XFxcXHMqYCArXG4vLyAgICAgICBgXFxcXGQrKD86LVxcXFxkKyk/YCArXG4vLyAgICAgICBgKWA7XG5cbi8vICAgICBjb25zdCBOT1RFID1cbi8vICAgICAgIGAoPzxub3RlPmAgK1xuLy8gICAgICAgYFxcXFxiW05uXW90ZXM/YCArXG4vLyAgICAgICBgKD86XFxcXHMrXFxcXGQrKD86XFxcXHMrXFxcXGQrKT9gICtcbi8vICAgICAgIGAoPzpgICtcbi8vICAgICAgIGAoPzpbLDtdfCw/XFxcXHMqYW5kKVxcXFxzKlxcXFxkKyg/OlxcXFxzK1xcXFxkKyk/YCArXG4vLyAgICAgICBgKD86XFxcXHMraW5cXFxccyske2Jvb2t9XFxcXC4/XFxcXHMrXFxcXGQrKT9gICtcbi8vICAgICAgIGApKmAgK1xuLy8gICAgICAgYClgICtcbi8vICAgICAgIGAoPzpcXFxccytpblxcXFxzKyR7Ym9va31cXFxcLj9cXFxccytcXFxcZCspP2AgK1xuLy8gICAgICAgYClgO1xuXG4vLyAgICAgY29uc3QgQk9PSyA9IGAoPzxib29rPlxcXFxiKD86JHtib29rfSlcXFxcYikoPyFcXFxcLj9cXFxccypcXFxcZCspYDtcblxuLy8gICAgIHJldHVybiBgJHtSRUZ9fCR7VkVSU0V9fCR7Q0hBUFRFUn18JHtOT1RFfXwke0JPT0t9YDtcbi8vICAgfTtcblxuLy8gICBjb25zdCBQQVRURVJOX0JPRFkgPSBidWlsZFBhdHRlcm5Cb2R5KCk7XG4vLyAgIGNvbnN0IFBBVFRFUk5fRyA9IG5ldyBSZWdFeHAoUEFUVEVSTl9CT0RZLCBcImdcIik7XG4vLyAgIGNvbnN0IFBBVFRFUk5fSEVBRCA9IG5ldyBSZWdFeHAoXCJeXCIgKyBQQVRURVJOX0JPRFkpO1xuXG4vLyAgIHJldHVybiB7IGFiYnIsIGFsbFRva2VucywgQk9PS19BTFQsIGdldEJvb2tBYmJyLCBQQVRURVJOX0csIFBBVFRFUk5fSEVBRCB9O1xuLy8gfVxuXG4vLyAvKiogLS0tLS0tLS0tLS0tLS0tLSBVdGlsaXR5OiBub3JtYWxpemUgYm9vayB0b2tlbiB0byByZW1vdmUgdHJhaWxpbmcgcGVyaW9kIC0tLS0tLS0tLS0tLS0tLSAqL1xuLy8gZnVuY3Rpb24gbm9ybWFsaXplQm9va1Rva2VuKHJhdzogc3RyaW5nLCBjdHg6IFJldHVyblR5cGU8dHlwZW9mIGJ1aWxkQm9va0NvbnRleHQ+KTogc3RyaW5nIHtcbi8vICAgLy8gVHJpbSBhbmQgZHJvcCBhIHNpbmdsZSB0cmFpbGluZyBkb3QgKGUuZy4sIFwiUm9tLlwiIC0+IFwiUm9tXCIpXG4vLyAgIGNvbnN0IGNsZWFuZWQgPSByYXcudHJpbSgpLnJlcGxhY2UoL1xcLiQvLCBcIlwiKTtcbi8vICAgcmV0dXJuIGN0eC5nZXRCb29rQWJicihjbGVhbmVkKTtcbi8vIH1cblxuLy8gLyoqIC0tLS0tLS0tLS0tLS0tIFByb3RlY3RlZCByYW5nZXMgKGRvblx1MjAxOXQgdG91Y2ggd2hpbGUgbGlua2luZykgLS0tLS0tLS0tLS0tLS0gKi9cbi8vIHR5cGUgUmFuZ2UgPSBbc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXJdO1xuXG4vLyBmdW5jdGlvbiBhZGRSYW5nZShyYW5nZXM6IFJhbmdlW10sIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKSB7XG4vLyAgIGlmIChzdGFydCA+PSAwICYmIGVuZCA+IHN0YXJ0KSByYW5nZXMucHVzaChbc3RhcnQsIGVuZF0pO1xuLy8gfVxuXG4vLyBmdW5jdGlvbiBmaW5kUHJvdGVjdGVkUmFuZ2VzKHRleHQ6IHN0cmluZyk6IFJhbmdlW10ge1xuLy8gICBjb25zdCByYW5nZXM6IFJhbmdlW10gPSBbXTtcblxuLy8gICAvLyAxKSBDb2RlIGZlbmNlcyBgYGAuLi5gYGAgYW5kIH5+fi4uLn5+flxuLy8gICBjb25zdCBmZW5jZVJlID0gLyhgYGB8fn5+KVteXFxuXSpcXG5bXFxzXFxTXSo/XFwxL2c7XG4vLyAgIGZvciAobGV0IG07IChtID0gZmVuY2VSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbi8vICAgLy8gMikgTWF0aCBibG9ja3MgJCQuLi4kJFxuLy8gICBjb25zdCBtYXRoQmxvY2tSZSA9IC9cXCRcXCRbXFxzXFxTXSo/XFwkXFwkL2c7XG4vLyAgIGZvciAobGV0IG07IChtID0gbWF0aEJsb2NrUmUuZXhlYyh0ZXh0KSk7ICkgYWRkUmFuZ2UocmFuZ2VzLCBtLmluZGV4LCBtLmluZGV4ICsgbVswXS5sZW5ndGgpO1xuXG4vLyAgIC8vIDMpIElubGluZSBjb2RlIGAuLi5gXG4vLyAgIGNvbnN0IGlubGluZUNvZGVSZSA9IC9gW15gXFxuXSpgL2c7XG4vLyAgIGZvciAobGV0IG07IChtID0gaW5saW5lQ29kZVJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuLy8gICAvLyA0KSBJbmxpbmUgbWF0aCAkLi4uJCAoYXZvaWQgJCQpXG4vLyAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dC5sZW5ndGg7ICkge1xuLy8gICAgIGlmICh0ZXh0W2ldID09PSBcIiRcIiAmJiB0ZXh0W2kgKyAxXSAhPT0gXCIkXCIpIHtcbi8vICAgICAgIGNvbnN0IHN0YXJ0ID0gaTtcbi8vICAgICAgIGkrKztcbi8vICAgICAgIHdoaWxlIChpIDwgdGV4dC5sZW5ndGggJiYgdGV4dFtpXSAhPT0gXCIkXCIpIGkrKztcbi8vICAgICAgIGlmIChpIDwgdGV4dC5sZW5ndGggJiYgdGV4dFtpXSA9PT0gXCIkXCIpIHtcbi8vICAgICAgICAgYWRkUmFuZ2UocmFuZ2VzLCBzdGFydCwgaSArIDEpO1xuLy8gICAgICAgICBpKys7XG4vLyAgICAgICAgIGNvbnRpbnVlO1xuLy8gICAgICAgfVxuLy8gICAgIH1cbi8vICAgICBpKys7XG4vLyAgIH1cblxuLy8gICAvLyA1KSBNYXJrZG93biBsaW5rcyBbdGV4dF0odXJsKVxuLy8gICBjb25zdCBtZExpbmtSZSA9IC9cXFtbXlxcXV0rP1xcXVxcKFteKV0rXFwpL2c7XG4vLyAgIGZvciAobGV0IG07IChtID0gbWRMaW5rUmUuZXhlYyh0ZXh0KSk7ICkgYWRkUmFuZ2UocmFuZ2VzLCBtLmluZGV4LCBtLmluZGV4ICsgbVswXS5sZW5ndGgpO1xuXG4vLyAgIC8vIDYpIElubGluZSBwcm9wZXJ0aWVzIGxpbmVzOiAga2V5OjogdmFsdWVcbi8vICAgY29uc3QgaW5saW5lUHJvcFJlID0gL15bXlxcbjpdezEsMjAwfTo6LiokL2dtO1xuLy8gICBmb3IgKGxldCBtOyAobSA9IGlubGluZVByb3BSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbi8vICAgLy8gNykgT2JzaWRpYW4gbGlua3MgW1suLi5dXVxuLy8gICBjb25zdCBvYnNpZGlhblJlID0gL1xcW1xcW1teXFxdXSo/XFxdXFxdL2c7XG4vLyAgIGZvciAobGV0IG07IChtID0gb2JzaWRpYW5SZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbi8vICAgLy8gTWVyZ2Ugb3ZlcmxhcHMgJiBzb3J0XG4vLyAgIHJhbmdlcy5zb3J0KChhLCBiKSA9PiBhWzBdIC0gYlswXSk7XG4vLyAgIGNvbnN0IG1lcmdlZDogUmFuZ2VbXSA9IFtdO1xuLy8gICBmb3IgKGNvbnN0IHIgb2YgcmFuZ2VzKSB7XG4vLyAgICAgaWYgKCFtZXJnZWQubGVuZ3RoIHx8IHJbMF0gPiBtZXJnZWRbbWVyZ2VkLmxlbmd0aCAtIDFdWzFdKSBtZXJnZWQucHVzaChyKTtcbi8vICAgICBlbHNlIG1lcmdlZFttZXJnZWQubGVuZ3RoIC0gMV1bMV0gPSBNYXRoLm1heChtZXJnZWRbbWVyZ2VkLmxlbmd0aCAtIDFdWzFdLCByWzFdKTtcbi8vICAgfVxuLy8gICByZXR1cm4gbWVyZ2VkO1xuLy8gfVxuXG4vLyBmdW5jdGlvbiBpblByb3RlY3RlZChwb3M6IG51bWJlciwgcmFuZ2VzOiBSYW5nZVtdKTogYm9vbGVhbiB7XG4vLyAgIGxldCBsbyA9IDAsIGhpID0gcmFuZ2VzLmxlbmd0aCAtIDE7XG4vLyAgIHdoaWxlIChsbyA8PSBoaSkge1xuLy8gICAgIGNvbnN0IG1pZCA9IChsbyArIGhpKSA+PiAxO1xuLy8gICAgIGNvbnN0IFtzLCBlXSA9IHJhbmdlc1ttaWRdO1xuLy8gICAgIGlmIChwb3MgPCBzKSBoaSA9IG1pZCAtIDE7XG4vLyAgICAgZWxzZSBpZiAocG9zID49IGUpIGxvID0gbWlkICsgMTtcbi8vICAgICBlbHNlIHJldHVybiB0cnVlO1xuLy8gICB9XG4vLyAgIHJldHVybiBmYWxzZTtcbi8vIH1cblxuLy8gZnVuY3Rpb24gaXNXaXRoaW5PYnNpZGlhbkxpbmsodGV4dDogc3RyaW5nLCBzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcik6IGJvb2xlYW4ge1xuLy8gICBjb25zdCBiZWZvcmUgPSB0ZXh0LnNsaWNlKDAsIHN0YXJ0KTtcbi8vICAgY29uc3QgYWZ0ZXIgPSB0ZXh0LnNsaWNlKGVuZCk7XG4vLyAgIGNvbnN0IG9wZW5JZHggPSBiZWZvcmUubGFzdEluZGV4T2YoXCJbW1wiKTtcbi8vICAgY29uc3QgY2xvc2VJZHggPSBiZWZvcmUubGFzdEluZGV4T2YoXCJdXVwiKTtcbi8vICAgaWYgKG9wZW5JZHggPiBjbG9zZUlkeCkge1xuLy8gICAgIGNvbnN0IG5leHRDbG9zZSA9IGFmdGVyLmluZGV4T2YoXCJdXVwiKTtcbi8vICAgICBpZiAobmV4dENsb3NlICE9PSAtMSkgcmV0dXJuIHRydWU7XG4vLyAgIH1cbi8vICAgcmV0dXJuIGZhbHNlO1xuLy8gfVxuXG4vLyAvKiogUGFyZW50aGV0aWNhbCBub2lzZTogc2tpcCBpZiBpbnNpZGUgXCIoMjAxOSlcIi1saWtlIHBhcmVudGhlc2VzICovXG4vLyBmdW5jdGlvbiBpc0luc2lkZU51bWVyaWNQYXJlbnModGV4dDogc3RyaW5nLCBzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcik6IGJvb2xlYW4ge1xuLy8gICBjb25zdCBvcGVuID0gdGV4dC5sYXN0SW5kZXhPZihcIihcIiwgc3RhcnQpO1xuLy8gICBpZiAob3BlbiA9PT0gLTEpIHJldHVybiBmYWxzZTtcbi8vICAgY29uc3QgY2xvc2UgPSB0ZXh0LmluZGV4T2YoXCIpXCIsIGVuZCk7XG4vLyAgIGlmIChjbG9zZSA9PT0gLTEpIHJldHVybiBmYWxzZTtcbi8vICAgY29uc3QgaW5uZXIgPSB0ZXh0LnNsaWNlKG9wZW4gKyAxLCBjbG9zZSkudHJpbSgpO1xuLy8gICBpZiAoL15cXGR7MSw0fSg/OltcXC9cXC5cXC06XVxcZHsxLDJ9KD86W1xcL1xcLlxcLTpdXFxkezEsNH0pPyk/JC8udGVzdChpbm5lcikpIHJldHVybiB0cnVlO1xuLy8gICBpZiAoL15wezEsMn1cXC5cXHMqXFxkKyhcXHMqLVxccypcXGQrKT8kL2kudGVzdChpbm5lcikpIHJldHVybiB0cnVlO1xuLy8gICByZXR1cm4gZmFsc2U7XG4vLyB9XG5cbi8vIC8qKiAtLS0tLS0tLS0tLS0tLS0tLS0tIE1hcmtkb3duL09ic2lkaWFuIGxpbmsgY2xlYW51cCAoUHl0aG9uIHBhcml0eSkgLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuLy8gZnVuY3Rpb24gcmVtb3ZlTWF0Y2hpbmdNYXJrZG93bkxpbmtzKHRleHQ6IHN0cmluZywgUEFUVEVSTl9IRUFEOiBSZWdFeHApOiBzdHJpbmcge1xuLy8gICBjb25zdCBtZExpbmsgPSAvKFxcKlxcKnxfX3xcXCopP1xcWyhbXlxcXV0rKVxcXVxcKFteKV0rXFwpKFxcKlxcKnxfX3xcXCopPy9nO1xuLy8gICByZXR1cm4gdGV4dC5yZXBsYWNlKG1kTGluaywgKF9tLCBwcmUsIGRpc3AsIHN1ZikgPT4ge1xuLy8gICAgIGNvbnN0IGxpbmtUZXh0ID0gU3RyaW5nKGRpc3ApO1xuLy8gICAgIGlmIChQQVRURVJOX0hFQUQudGVzdChsaW5rVGV4dCkpIHJldHVybiBsaW5rVGV4dDtcbi8vICAgICBjb25zdCBzaW1wbGVOdW0gPSAvXlxcZCsoPzpbOi1dXFxkKyk/KD86LVxcZCspPyQvLnRlc3QobGlua1RleHQpO1xuLy8gICAgIGlmIChzaW1wbGVOdW0pIHJldHVybiBsaW5rVGV4dDtcbi8vICAgICByZXR1cm4gYCR7cHJlID8/IFwiXCJ9WyR7bGlua1RleHR9XSR7c3VmID8/IFwiXCJ9YDtcbi8vICAgfSk7XG4vLyB9XG5cbi8vIGZ1bmN0aW9uIHJlbW92ZU1hdGNoaW5nT2JzaWRpYW5MaW5rcyh0ZXh0OiBzdHJpbmcsIFBBVFRFUk5fSEVBRDogUmVnRXhwKTogc3RyaW5nIHtcbi8vICAgY29uc3Qgb2JzID0gL1xcW1xcWyhbXlxcXXxdKylcXHwoW15cXF1dKylcXF1cXF0vZztcbi8vICAgcmV0dXJuIHRleHQucmVwbGFjZShvYnMsIChfbSwgX3QsIGRpc3ApID0+IHtcbi8vICAgICBjb25zdCBkaXNwbGF5ID0gU3RyaW5nKGRpc3ApO1xuLy8gICAgIGlmIChQQVRURVJOX0hFQUQudGVzdChkaXNwbGF5KSkgcmV0dXJuIGRpc3BsYXk7XG4vLyAgICAgY29uc3Qgc2ltcGxlTnVtID0gL15cXGQrKD86WzotXVxcZCspPyg/Oi1cXGQrKT8kLy50ZXN0KGRpc3BsYXkpO1xuLy8gICAgIGlmIChzaW1wbGVOdW0pIHJldHVybiBkaXNwbGF5O1xuLy8gICAgIHJldHVybiBfbTtcbi8vICAgfSk7XG4vLyB9XG5cbi8vIGZ1bmN0aW9uIHJlcGxhY2VPbGRPYnNpZGlhbkxpbmtzKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4vLyAgIGNvbnN0IG9sZExpbmsgPSAvXFxbXFxbKFswLTldP1xcc1tBLVphLXogXSspXFxzKFxcZCspI1xcXihcXGQrKSg/OlxcfChbXlxcXV0rKSk/XFxdXFxdL2c7XG4vLyAgIHJldHVybiB0ZXh0LnJlcGxhY2Uob2xkTGluaywgKF9tLCBib29rU2hvcnQsIGNoLCB2ZXJzZSwgZGlzcCkgPT4ge1xuLy8gICAgIGNvbnN0IGIgPSBTdHJpbmcoYm9va1Nob3J0KS50cmltKCk7XG4vLyAgICAgcmV0dXJuIGRpc3Bcbi8vICAgICAgID8gYFtbJHtifSNeJHtjaH0tJHt2ZXJzZX18JHtkaXNwfV1dYFxuLy8gICAgICAgOiBgW1ske2J9I14ke2NofS0ke3ZlcnNlfV1dYDtcbi8vICAgfSk7XG4vLyB9XG5cbi8vIGZ1bmN0aW9uIGZpbmRMYXN0Qm9va0JlZm9yZSh0ZXh0OiBzdHJpbmcsIHBvczogbnVtYmVyLCBjdHg6IFJldHVyblR5cGU8dHlwZW9mIGJ1aWxkQm9va0NvbnRleHQ+KTogc3RyaW5nIHwgbnVsbCB7XG4vLyAgIC8vIExvb2sgYmFjayB+MjAwIGNoYXJzIGZvciBhIGJvb2sgdG9rZW4gZW5kaW5nIHJpZ2h0IGJlZm9yZSAncG9zJ1xuLy8gICBjb25zdCBzdGFydCA9IE1hdGgubWF4KDAsIHBvcyAtIDIwMCk7XG4vLyAgIGNvbnN0IGxlZnQgPSB0ZXh0LnNsaWNlKHN0YXJ0LCBwb3MpO1xuXG4vLyAgIC8vIE1hdGNoIEFMTCBib29rIHRva2VucyBpbiB0aGUgd2luZG93OyB0YWtlIHRoZSBsYXN0IG9uZS5cbi8vICAgY29uc3QgcmUgPSBuZXcgUmVnRXhwKGAoPzoke2N0eC5CT09LX0FMVH0pXFxcXC4/XFxcXHMqJHwoPzoke2N0eC5CT09LX0FMVH0pXFxcXC4/XFxcXHMrYCwgXCJnXCIpO1xuLy8gICBsZXQgbTogUmVnRXhwRXhlY0FycmF5IHwgbnVsbDtcbi8vICAgbGV0IGxhc3Q6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4vLyAgIHdoaWxlICgobSA9IHJlLmV4ZWMobGVmdCkpICE9PSBudWxsKSB7XG4vLyAgICAgbGFzdCA9IG1bMF0udHJpbSgpO1xuLy8gICB9XG4vLyAgIGlmICghbGFzdCkgcmV0dXJuIG51bGw7XG5cbi8vICAgLy8gc3RyaXAgdHJhaWxpbmcgcHVuY3R1YXRpb24vZG90IGFuZCBub3JtYWxpemVcbi8vICAgcmV0dXJuIG5vcm1hbGl6ZUJvb2tUb2tlbihsYXN0LnJlcGxhY2UoL1xccyskLywgXCJcIiksIGN0eCk7XG4vLyB9XG5cbi8vIC8qKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQ29yZSBsaW5rZXIgKFB5dGhvbiAxOjEgKyBwcm90ZWN0aW9ucykgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG4vLyBmdW5jdGlvbiByZXBsYWNlVmVyc2VSZWZlcmVuY2VzT2ZNYWluVGV4dChcbi8vICAgdGV4dDogc3RyaW5nLFxuLy8gICBjdHg6IFJldHVyblR5cGU8dHlwZW9mIGJ1aWxkQm9va0NvbnRleHQ+LFxuLy8gICBvcHRzOiB7IHJlbW92ZU9ic2lkaWFuTGlua3M6IGJvb2xlYW47IHJld3JpdGVPbGRMaW5rczogYm9vbGVhbiwgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZTogYm9vbGVhbiB9XG4vLyApOiBzdHJpbmcge1xuLy8gICAvLyBPcmRlciBtYXRjaGVzIFB5dGhvbjogc3RyaXAgTUQgbGlua3MgXHUyMTkyIChvcHRpb25hbCkgc3RyaXAgW1suLi58Li4uXV0gXHUyMTkyIHJld3JpdGUgb2xkIGxpbmtzXG4vLyAgIGlmIChvcHRzLnN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2UpIHRleHQgPSByZW1vdmVNYXRjaGluZ01hcmtkb3duTGlua3ModGV4dCwgY3R4LlBBVFRFUk5fSEVBRCk7XG4vLyAgIGlmIChvcHRzLnJlbW92ZU9ic2lkaWFuTGlua3MpIHRleHQgPSByZW1vdmVNYXRjaGluZ09ic2lkaWFuTGlua3ModGV4dCwgY3R4LlBBVFRFUk5fSEVBRCk7XG4vLyAgIGlmIChvcHRzLnJld3JpdGVPbGRMaW5rcykgdGV4dCA9IHJlcGxhY2VPbGRPYnNpZGlhbkxpbmtzKHRleHQpO1xuXG4vLyAgIGNvbnN0IHByb3RlY3RlZFJhbmdlcyA9IGZpbmRQcm90ZWN0ZWRSYW5nZXModGV4dCk7XG5cbi8vICAgbGV0IGN1cnJlbnRfYm9vazogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4vLyAgIGxldCBjdXJyZW50X2NoYXB0ZXI6IG51bWJlciB8IHN0cmluZyB8IG51bGwgPSBudWxsO1xuLy8gICBsZXQgY3VycmVudF92ZXJzZTogbnVtYmVyIHwgc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbi8vICAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuLy8gICBsZXQgbGFzdFBvcyA9IDA7XG5cbi8vICAgY3R4LlBBVFRFUk5fRy5sYXN0SW5kZXggPSAwO1xuLy8gICBmb3IgKGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsID0gY3R4LlBBVFRFUk5fRy5leGVjKHRleHQpOyBtOyBtID0gY3R4LlBBVFRFUk5fRy5leGVjKHRleHQpKSB7XG4vLyAgICAgY29uc3Qgc3RhcnQgPSBtLmluZGV4O1xuLy8gICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgbVswXS5sZW5ndGg7XG5cbi8vICAgICBpZiAoaW5Qcm90ZWN0ZWQoc3RhcnQsIHByb3RlY3RlZFJhbmdlcykgfHwgaW5Qcm90ZWN0ZWQoZW5kIC0gMSwgcHJvdGVjdGVkUmFuZ2VzKSB8fFxuLy8gICAgICAgICBpc1dpdGhpbk9ic2lkaWFuTGluayh0ZXh0LCBzdGFydCwgZW5kKSB8fCBpc0luc2lkZU51bWVyaWNQYXJlbnModGV4dCwgc3RhcnQsIGVuZCkpIHtcbi8vICAgICAgIG91dC5wdXNoKHRleHQuc2xpY2UobGFzdFBvcywgc3RhcnQpLCBtWzBdKTtcbi8vICAgICAgIGxhc3RQb3MgPSBlbmQ7XG4vLyAgICAgICBjb250aW51ZTtcbi8vICAgICB9XG5cbi8vICAgICBvdXQucHVzaCh0ZXh0LnNsaWNlKGxhc3RQb3MsIHN0YXJ0KSk7XG4vLyAgICAgbGFzdFBvcyA9IGVuZDtcblxuLy8gICAgIGNvbnN0IGcgPSBtLmdyb3VwcyA/PyB7fTtcblxuLy8gICAgIC8vIC0tLS0gYm9vayBvbmx5XG4vLyAgICAgaWYgKGcuYm9vaykge1xuLy8gICAgICAgY3VycmVudF9ib29rID0gbm9ybWFsaXplQm9va1Rva2VuKGcuYm9vaywgY3R4KTsgLy8gPC0tIHN0cmlwcyB0cmFpbGluZyBkb3Rcbi8vICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IG51bGw7XG4vLyAgICAgICBjdXJyZW50X3ZlcnNlID0gbnVsbDtcbi8vICAgICAgIG91dC5wdXNoKG1bMF0pO1xuLy8gICAgICAgY29udGludWU7XG4vLyAgICAgfVxuXG4vLyAgICAgLy8gLS0tLSBjaGFwdGVyIChjaC4sIGNoYXB0ZXIsIGNoYXB0ZXJzKVxuLy8gICAgIGlmIChnLmNoYXB0ZXIpIHtcbi8vICAgICAgIGNvbnN0IGNobSA9IGcuY2hhcHRlci5tYXRjaCgvKFxcZCspLyk7XG4vLyAgICAgICBpZiAoY2htICYmIGN1cnJlbnRfYm9vaykge1xuLy8gICAgICAgICBjb25zdCBjaCA9IGNobVsxXTtcbi8vICAgICAgICAgY3VycmVudF9jaGFwdGVyID0gY2g7XG4vLyAgICAgICAgIGN1cnJlbnRfdmVyc2UgPSBudWxsO1xuLy8gICAgICAgICBvdXQucHVzaChgW1ske2N1cnJlbnRfYm9va30jXiR7Y2h9fCR7bVswXX1dXWApO1xuLy8gICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgb3V0LnB1c2gobVswXSk7XG4vLyAgICAgICB9XG4vLyAgICAgICBjb250aW51ZTtcbi8vICAgICB9XG5cbi8vICAgICAvLyAtLS0tIHZlcnNlICh2LiwgdnYuLCB2ZXJzZXMpXG4vLyAgICAgaWYgKGcudmVyc2UpIHtcbi8vICAgICAgIGlmICghY3VycmVudF9ib29rKSB7XG4vLyAgICAgICAgIGNvbnN0IGluZmVycmVkID0gZmluZExhc3RCb29rQmVmb3JlKHRleHQsIHN0YXJ0LCBjdHgpO1xuLy8gICAgICAgICBpZiAoaW5mZXJyZWQpIHtcbi8vICAgICAgICAgICBjdXJyZW50X2Jvb2sgPSBpbmZlcnJlZDtcbi8vICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICBvdXQucHVzaChtWzBdKTtcbi8vICAgICAgICAgICBjb250aW51ZTtcbi8vICAgICAgICAgfVxuLy8gICAgICAgfVxuLy8gICAgICAgY29uc3QgdmVyc2VUZXh0ID0gbVswXTtcbi8vICAgICAgIGNvbnN0IHBhcnRzID0gdmVyc2VUZXh0LnNwbGl0KC8oXFxzKykvKTtcbi8vICAgICAgIGNvbnN0IGNoID0gY3VycmVudF9jaGFwdGVyID8gU3RyaW5nKGN1cnJlbnRfY2hhcHRlcikgOiBcIjFcIjtcbi8vICAgICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXJ0cykge1xuLy8gICAgICAgICBjb25zdCB2bSA9IHBhcnQubWF0Y2goLyhcXGQrKS8pO1xuLy8gICAgICAgICBpZiAodm0gJiYgcGFydC50cmltKCkpIHtcbi8vICAgICAgICAgICBvdXQucHVzaChgW1ske2N1cnJlbnRfYm9va30jXiR7Y2h9LSR7dm1bMV19fCR7cGFydC50cmltKCl9XV1gKTtcbi8vICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICBvdXQucHVzaChwYXJ0KTtcbi8vICAgICAgICAgfVxuLy8gICAgICAgfVxuLy8gICAgICAgY29udGludWU7XG4vLyAgICAgfVxuXG4vLyAgICAgLy8gLS0tLSBub3RlKHMpXG4vLyAgICAgaWYgKGcubm90ZSkge1xuLy8gICAgICAgY29uc3Qgbm90ZVRleHQgPSBnLm5vdGUgYXMgc3RyaW5nO1xuLy8gICAgICAgY29uc3QgcGFydHMgPSBub3RlVGV4dC5zcGxpdCgvXFxzKy8pO1xuLy8gICAgICAgbGV0IGJvb2tTdWJzdHJpbmcgPSBmYWxzZTtcbi8vICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgICAgY29uc3QgcGFydCA9IHBhcnRzW2ldO1xuLy8gICAgICAgICBjb25zdCBwbSA9IHBhcnQubWF0Y2goL14oXFxkKykvKTtcbi8vICAgICAgICAgaWYgKHBtICYmICFib29rU3Vic3RyaW5nKSB7XG4vLyAgICAgICAgICAgY29uc3QgdmVyc2UgPSBwbVsxXTtcbi8vICAgICAgICAgICBpZiAoKGkgKyAxIDwgcGFydHMubGVuZ3RoICYmICEvXlxcZCsvLnRlc3QocGFydHNbaSArIDFdKSkgfHwgaSArIDEgPj0gcGFydHMubGVuZ3RoKSB7XG4vLyAgICAgICAgICAgICBvdXQucHVzaChcIiBcIiArIHBhcnQpO1xuLy8gICAgICAgICAgICAgY29udGludWU7XG4vLyAgICAgICAgICAgfVxuLy8gICAgICAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IHBhcnRzLmxlbmd0aDsgaisrKSB7XG4vLyAgICAgICAgICAgICBpZiAocGFydHNbal0gPT09IFwiaW5cIiAmJiBqICsgMSA8IHBhcnRzLmxlbmd0aCkge1xuLy8gICAgICAgICAgICAgICBpZiAoL15cXGQrJC8udGVzdChwYXJ0c1tqICsgMV0pICYmIGogKyAyIDwgcGFydHMubGVuZ3RoKSB7XG4vLyAgICAgICAgICAgICAgICAgY29uc3QgYm9vayA9IHBhcnRzW2ogKyAxXSArIFwiIFwiICsgcGFydHNbaiArIDJdO1xuLy8gICAgICAgICAgICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IHBhcnRzW2ogKyAzXTtcbi8vICAgICAgICAgICAgICAgICBjdXJyZW50X2Jvb2sgPSBub3JtYWxpemVCb29rVG9rZW4oYm9vaywgY3R4KTsgLy8gPC0tIG5vcm1hbGl6ZVxuLy8gICAgICAgICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgICAgICAgIGNvbnN0IGJvb2sgPSBwYXJ0c1tqICsgMV07XG4vLyAgICAgICAgICAgICAgICAgY3VycmVudF9jaGFwdGVyID0gcGFydHNbaiArIDJdO1xuLy8gICAgICAgICAgICAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihib29rLCBjdHgpOyAvLyA8LS0gbm9ybWFsaXplXG4vLyAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICB9XG4vLyAgICAgICAgICAgaWYgKGN1cnJlbnRfYm9vayAmJiBjdXJyZW50X2NoYXB0ZXIpIHtcbi8vICAgICAgICAgICAgIG91dC5wdXNoKGAgW1ske2N1cnJlbnRfYm9va30gJHtjdXJyZW50X2NoYXB0ZXJ9I14ke3ZlcnNlfXwke3BhcnR9XV1gKTtcbi8vICAgICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgICAgb3V0LnB1c2goXCIgXCIgKyBwYXJ0KTtcbi8vICAgICAgICAgICB9XG4vLyAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgb3V0LnB1c2goKGkgPiAwID8gXCIgXCIgOiBcIlwiKSArIHBhcnQpO1xuLy8gICAgICAgICB9XG4vLyAgICAgICB9XG4vLyAgICAgICBjb250aW51ZTtcbi8vICAgICB9XG5cbi8vICAgICAvLyAtLS0tIGZ1bGwgcmVmZXJlbmNlXG4vLyAgICAgaWYgKGcucmVmKSB7XG4vLyAgICAgICBjb25zdCBtbSA9IChnLnJlZiBhcyBzdHJpbmcpLm1hdGNoKC8oXFxzKltcXC4sO10/KSguKykvKTtcbi8vICAgICAgIGNvbnN0IGxlYWRpbmcgPSBtbSA/IG1tWzFdIDogXCJcIjtcbi8vICAgICAgIGxldCByZWZUZXh0ID0gbW0gPyBtbVsyXSA6IChnLnJlZiBhcyBzdHJpbmcpO1xuXG4vLyAgICAgICBjb25zdCBib29rU3RhcnQgPSByZWZUZXh0Lm1hdGNoKG5ldyBSZWdFeHAoYF4oKD86JHtjdHguQk9PS19BTFR9KVxcXFwuP1xcXFxzKylgKSk7XG4vLyAgICAgICBsZXQgcHJlZml4OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbi8vICAgICAgIGlmIChib29rU3RhcnQpIHtcbi8vICAgICAgICAgY29uc3QgYm9va1BhcnQgPSBib29rU3RhcnRbMF07XG4vLyAgICAgICAgIHByZWZpeCA9IGJvb2tQYXJ0OyAvLyBmb3IgZGlzcGxheSB0ZXh0IChjYW4ga2VlcCBpdHMgZG90KVxuLy8gICAgICAgICBjdXJyZW50X2Jvb2sgPSBub3JtYWxpemVCb29rVG9rZW4oYm9va1BhcnQucmVwbGFjZSgvXFxzKyQvLCBcIlwiKSwgY3R4KTsgLy8gPC0tIG5vcm1hbGl6ZSBmb3IgdGFyZ2V0XG4vLyAgICAgICAgIHJlZlRleHQgPSByZWZUZXh0LnNsaWNlKGJvb2tQYXJ0Lmxlbmd0aCk7XG4vLyAgICAgICB9XG4vLyAgICAgICBpZiAoIWN1cnJlbnRfYm9vaykge1xuLy8gICAgICAgICAvLyBGYWxsYmFjazogaW5mZXIgYm9vayBmcm9tIGxlZnQgY29udGV4dCAoZS5nLiwgXCJcdTIwMjYgSm9obiAxOjI5OyAxMjoyNDsgXHUyMDI2XCIpXG4vLyAgICAgICAgIGNvbnN0IGluZmVycmVkID0gZmluZExhc3RCb29rQmVmb3JlKHRleHQsIHN0YXJ0LCBjdHgpO1xuLy8gICAgICAgICBpZiAoaW5mZXJyZWQpIHtcbi8vICAgICAgICAgICBjdXJyZW50X2Jvb2sgPSBpbmZlcnJlZDtcbi8vICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICBvdXQucHVzaChtWzBdKTtcbi8vICAgICAgICAgICBjb250aW51ZTtcbi8vICAgICAgICAgfVxuLy8gICAgICAgfVxuXG4vLyAgICAgICBjb25zdCBwYXJ0cyA9IHJlZlRleHQucmVwbGFjZSgvXFwuL2csIFwiXCIpLnRyaW0oKS5zcGxpdCgvKDt8LCkvKTtcbi8vICAgICAgIGNvbnN0IHJlc3VsdDogc3RyaW5nW10gPSBbXTtcbi8vICAgICAgIGxldCB2ZXJzZVN0cmluZyA9IGZhbHNlO1xuLy8gICAgICAgY3VycmVudF9jaGFwdGVyID0gbnVsbDtcbi8vICAgICAgIGxldCBsb2NhbF9jdXJyZW50X3ZlcnNlOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuLy8gICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgICBjb25zdCBwYXJ0ID0gcGFydHNbaV07XG4vLyAgICAgICAgIGlmIChwYXJ0ID09PSBcIixcIiB8fCBwYXJ0ID09PSBcIjtcIikge1xuLy8gICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcnQgKyBcIiBcIik7XG4vLyAgICAgICAgICAgdmVyc2VTdHJpbmcgPSAocGFydCA9PT0gXCIsXCIpO1xuLy8gICAgICAgICAgIGNvbnRpbnVlO1xuLy8gICAgICAgICB9XG4vLyAgICAgICAgIGxldCBwID0gcGFydC50cmltKCk7XG4vLyAgICAgICAgIGlmICghcCkgY29udGludWU7XG5cbi8vICAgICAgICAgbGV0IGNoYXA6IHN0cmluZyB8IG51bWJlciB8IG51bGwgPSBjdXJyZW50X2NoYXB0ZXI7XG4vLyAgICAgICAgIGxldCB2OiBzdHJpbmcgfCBudW1iZXIgfCBudWxsID0gbnVsbDtcbi8vICAgICAgICAgbGV0IHZFbmQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4vLyAgICAgICAgIGlmIChwLmluY2x1ZGVzKFwiOlwiKSkge1xuLy8gICAgICAgICAgIGNvbnN0IFtjU3RyLCB2U3RyXSA9IHAuc3BsaXQoXCI6XCIpO1xuLy8gICAgICAgICAgIGNoYXAgPSBjU3RyO1xuLy8gICAgICAgICAgIHYgPSB2U3RyO1xuLy8gICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgIGlmICh2ZXJzZVN0cmluZykgdiA9IHA7XG4vLyAgICAgICAgICAgZWxzZSB7IGNoYXAgPSBwOyB2ID0gbnVsbDsgfVxuLy8gICAgICAgICB9XG5cbi8vICAgICAgICAgaWYgKHR5cGVvZiBjaGFwICE9PSBcIm51bWJlclwiKSB7XG4vLyAgICAgICAgICAgY29uc3QgY2hzID0gU3RyaW5nKGNoYXAgPz8gXCJcIikuc3BsaXQoXCItXCIpO1xuLy8gICAgICAgICAgIGNoYXAgPSBwYXJzZUludChjaHNbMF0ucmVwbGFjZSgvW2Etel0kL2ksIFwiXCIpLCAxMCk7XG4vLyAgICAgICAgIH1cblxuLy8gICAgICAgICBpZiAodikge1xuLy8gICAgICAgICAgIGNvbnN0IHZzID0gU3RyaW5nKHYpLnNwbGl0KFwiLVwiKTtcbi8vICAgICAgICAgICBsb2NhbF9jdXJyZW50X3ZlcnNlID0gcGFyc2VJbnQodnNbMF0ucmVwbGFjZSgvW2Etel0kL2ksIFwiXCIpLCAxMCk7XG4vLyAgICAgICAgICAgdkVuZCA9IHZzLmxlbmd0aCA+IDEgPyBwYXJzZUludCh2c1sxXS5yZXBsYWNlKC9bYS16XSQvaSwgXCJcIiksIDEwKSA6IG51bGw7XG4vLyAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgbG9jYWxfY3VycmVudF92ZXJzZSA9IG51bGw7XG4vLyAgICAgICAgICAgdkVuZCA9IG51bGw7XG4vLyAgICAgICAgIH1cblxuLy8gICAgICAgICBpZiAodkVuZCkge1xuLy8gICAgICAgICAgIGNvbnN0IGRpc3BsYXlTdGFydCA9IHAucmVwbGFjZSgvXFxkK1thLXpdPyQvaSwgXCJcIik7XG4vLyAgICAgICAgICAgcmVzdWx0LnB1c2goYFtbJHtjdXJyZW50X2Jvb2t9I14ke2NoYXB9LSR7bG9jYWxfY3VycmVudF92ZXJzZX18JHtwcmVmaXggPyBwcmVmaXggOiBcIlwifSR7ZGlzcGxheVN0YXJ0fV1dYCk7XG4vLyAgICAgICAgICAgcmVzdWx0LnB1c2goYFtbJHtjdXJyZW50X2Jvb2t9I14ke2NoYXB9LSR7dkVuZH18JHtTdHJpbmcocCkubWF0Y2goLyhcXGQrW2Etel0/KSQvaSk/LlsxXSA/PyBcIlwifV1dYCk7XG4vLyAgICAgICAgICAgbG9jYWxfY3VycmVudF92ZXJzZSA9IHZFbmQ7XG4vLyAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgcmVzdWx0LnB1c2goYFtbJHtjdXJyZW50X2Jvb2t9I14ke2NoYXB9JHtsb2NhbF9jdXJyZW50X3ZlcnNlID8gYC0ke2xvY2FsX2N1cnJlbnRfdmVyc2V9YCA6IFwiXCJ9fCR7cHJlZml4ID8gcHJlZml4IDogXCJcIn0ke3B9XV1gKTtcbi8vICAgICAgICAgfVxuLy8gICAgICAgICBwcmVmaXggPSBudWxsO1xuLy8gICAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBjaGFwO1xuLy8gICAgICAgICBjdXJyZW50X3ZlcnNlID0gbG9jYWxfY3VycmVudF92ZXJzZTtcbi8vICAgICAgIH1cblxuLy8gICAgICAgb3V0LnB1c2gobGVhZGluZyArIHJlc3VsdC5qb2luKFwiXCIpKTtcbi8vICAgICAgIGNvbnRpbnVlO1xuLy8gICAgIH1cblxuLy8gICAgIG91dC5wdXNoKG1bMF0pO1xuLy8gICB9XG5cbi8vICAgb3V0LnB1c2godGV4dC5zbGljZShsYXN0UG9zKSk7XG4vLyAgIHJldHVybiBvdXQuam9pbihcIlwiKTtcbi8vIH1cblxuXG4vLyAvKiogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFB1YmxpYyBBUEkgdXNlZCBieSBjb21tYW5kIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuLy8gZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxpbmtWZXJzZXNJblRleHQodGV4dDogc3RyaW5nLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKTogUHJvbWlzZTxzdHJpbmc+IHtcbi8vICAgY29uc3QgY3R4ID0gYnVpbGRCb29rQ29udGV4dChzZXR0aW5ncyk7XG5cbi8vICAgLy8gU2V0dGluZ3MgdG9nZ2xlcyAob3B0aW9uYWw7IGRlZmF1bHQgdG8gUHl0aG9uIGJlaGF2aW9yKVxuLy8gICBjb25zdCByZW1vdmVPYnNpZGlhbkRpc3BsYXlMaW5rcyA9XG4vLyAgICAgKHNldHRpbmdzIGFzIGFueSk/LnJlbW92ZU9ic2lkaWFuRGlzcGxheUxpbmtzID8/IHRydWU7XG4vLyAgIGNvbnN0IHJld3JpdGVPbGRPYnNpZGlhbkxpbmtzID1cbi8vICAgICAoc2V0dGluZ3MgYXMgYW55KT8ucmV3cml0ZU9sZE9ic2lkaWFuTGlua3MgPz8gdHJ1ZTtcbi8vICAgY29uc3Qgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSA9XG4vLyAgICAgKHNldHRpbmdzIGFzIGFueSk/LnN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2UgPz8gdHJ1ZTtcblxuLy8gICByZXR1cm4gcmVwbGFjZVZlcnNlUmVmZXJlbmNlc09mTWFpblRleHQodGV4dCwgY3R4LCB7XG4vLyAgICAgcmVtb3ZlT2JzaWRpYW5MaW5rczogcmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MsXG4vLyAgICAgcmV3cml0ZU9sZExpbmtzOiByZXdyaXRlT2xkT2JzaWRpYW5MaW5rcyxcbi8vICAgICBzdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlOiBzdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlXG4vLyAgIH0pO1xuLy8gfVxuXG4vLyBleHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZFZlcnNlTGlua3MoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MsIHBhcmFtcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pIHtcbi8vICAgY29uc3Qgc2NvcGUgPSBwYXJhbXM/LnNjb3BlID8/IFwiY3VycmVudFwiO1xuXG4vLyAgIGlmIChzY29wZSA9PT0gXCJmb2xkZXJcIikge1xuLy8gICAgIGNvbnN0IGFjdGl2ZSA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuLy8gICAgIGNvbnN0IGZvbGRlciA9IGFjdGl2ZT8ucGFyZW50O1xuLy8gICAgIGlmICghYWN0aXZlIHx8ICFmb2xkZXIpIHsgbmV3IE5vdGljZShcIk9wZW4gYSBmaWxlIGluc2lkZSB0aGUgdGFyZ2V0IGZvbGRlci5cIik7IHJldHVybjsgfVxuXG4vLyAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbi8vICAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIFRGaWxlICYmIGNoaWxkLmV4dGVuc2lvbiA9PT0gXCJtZFwiKSB7XG4vLyAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChjaGlsZCk7XG4vLyAgICAgICAgIGNvbnN0IHsgeWFtbCwgYm9keSB9ID0gc3BsaXRGcm9udG1hdHRlcihjb250ZW50KTtcbi8vICAgICAgICAgY29uc3QgbGlua2VkID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChib2R5LCBzZXR0aW5ncyk7XG4vLyAgICAgICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoY2hpbGQsICh5YW1sID8/IFwiXCIpICsgbGlua2VkKTtcbi8vICAgICAgIH1cbi8vICAgICB9XG4vLyAgICAgbmV3IE5vdGljZShcIkxpbmtlZCB2ZXJzZXMgaW4gZm9sZGVyLlwiKTtcbi8vICAgICByZXR1cm47XG4vLyAgIH1cblxuLy8gICBjb25zdCBmaWxlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4vLyAgIGlmICghZmlsZSkgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgZmlyc3QuXCIpOyByZXR1cm47IH1cblxuLy8gICBjb25zdCBjb250ZW50ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4vLyAgIGNvbnN0IHsgeWFtbCwgYm9keSB9ID0gc3BsaXRGcm9udG1hdHRlcihjb250ZW50KTtcbi8vICAgY29uc3QgbGlua2VkID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChib2R5LCBzZXR0aW5ncyk7XG4vLyAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgKHlhbWwgPz8gXCJcIikgKyBsaW5rZWQpO1xuLy8gICBuZXcgTm90aWNlKFwiTGlua2VkIHZlcnNlcyBpbiBjdXJyZW50IGZpbGUuXCIpO1xuLy8gfVxuXG4vLyBleHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZFZlcnNlTGlua3NTZWxlY3Rpb25PckxpbmUoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MpIHtcbi8vICAgY29uc3QgbWRWaWV3ID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4vLyAgIGlmICghbWRWaWV3KSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgTWFya2Rvd24gZmlsZSBmaXJzdC5cIik7IHJldHVybjsgfVxuXG4vLyAgIGNvbnN0IGVkaXRvciA9IG1kVmlldy5lZGl0b3I7XG5cbi8vICAgLy8gSWYgdXNlciBzZWxlY3RlZCB0ZXh0LCBwcm9jZXNzIHRoYXQ7IG90aGVyd2lzZSBwcm9jZXNzIHRoZSBjdXJyZW50IGxpbmVcbi8vICAgY29uc3Qgc2VsZWN0aW9uVGV4dCA9IGVkaXRvci5nZXRTZWxlY3Rpb24oKTtcbi8vICAgaWYgKHNlbGVjdGlvblRleHQgJiYgc2VsZWN0aW9uVGV4dC5sZW5ndGggPiAwKSB7XG4vLyAgICAgY29uc3QgbGlua2VkID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChzZWxlY3Rpb25UZXh0LCBzZXR0aW5ncyk7XG4vLyAgICAgaWYgKGxpbmtlZCAhPT0gc2VsZWN0aW9uVGV4dCkge1xuLy8gICAgICAgZWRpdG9yLnJlcGxhY2VTZWxlY3Rpb24obGlua2VkKTtcbi8vICAgICAgIG5ldyBOb3RpY2UoXCJMaW5rZWQgdmVyc2VzIGluIHNlbGVjdGlvbi5cIik7XG4vLyAgICAgfSBlbHNlIHtcbi8vICAgICAgIG5ldyBOb3RpY2UoXCJObyBsaW5rYWJsZSB2ZXJzZXMgaW4gc2VsZWN0aW9uLlwiKTtcbi8vICAgICB9XG4vLyAgICAgcmV0dXJuO1xuLy8gICB9XG5cbi8vICAgLy8gTm8gc2VsZWN0aW9uIFx1MjE5MiBwcm9jZXNzIGN1cnJlbnQgbGluZVxuLy8gICBjb25zdCBsaW5lID0gZWRpdG9yLmdldEN1cnNvcigpLmxpbmU7XG4vLyAgIGNvbnN0IGxpbmVUZXh0ID0gZWRpdG9yLmdldExpbmUobGluZSk7XG4vLyAgIGNvbnN0IGxpbmtlZCA9IGF3YWl0IGxpbmtWZXJzZXNJblRleHQobGluZVRleHQsIHNldHRpbmdzKTtcbi8vICAgaWYgKGxpbmtlZCAhPT0gbGluZVRleHQpIHtcbi8vICAgICBlZGl0b3Iuc2V0TGluZShsaW5lLCBsaW5rZWQpO1xuLy8gICAgIG5ldyBOb3RpY2UoXCJMaW5rZWQgdmVyc2VzIG9uIGN1cnJlbnQgbGluZS5cIik7XG4vLyAgIH0gZWxzZSB7XG4vLyAgICAgbmV3IE5vdGljZShcIk5vIGxpbmthYmxlIHZlcnNlcyBvbiBjdXJyZW50IGxpbmUuXCIpO1xuLy8gICB9XG4vLyB9IiwgImltcG9ydCB7IEFwcCwgVEZpbGUsIFRGb2xkZXIsIG5vcm1hbGl6ZVBhdGggfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0RnJvbnRtYXR0ZXIodGV4dDogc3RyaW5nKTogeyB5YW1sPzogc3RyaW5nOyBib2R5OiBzdHJpbmcgfSB7XG4gIGlmICh0ZXh0LnN0YXJ0c1dpdGgoXCItLS1cIikpIHtcbiAgICBjb25zdCBlbmQgPSB0ZXh0LmluZGV4T2YoXCJcXG4tLS1cIiwgMyk7XG4gICAgaWYgKGVuZCAhPT0gLTEpIHtcbiAgICAgIGNvbnN0IHlhbWwgPSB0ZXh0LnNsaWNlKDAsIGVuZCArIDQpO1xuICAgICAgY29uc3QgYm9keSA9IHRleHQuc2xpY2UoZW5kICsgNCk7XG4gICAgICByZXR1cm4geyB5YW1sLCBib2R5IH07XG4gICAgfVxuICB9XG4gIHJldHVybiB7IGJvZHk6IHRleHQgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluc2VydEFmdGVyWWFtbE9ySDEoc3JjOiBzdHJpbmcsIGJsb2NrOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB7IHlhbWwsIGJvZHkgfSA9IHNwbGl0RnJvbnRtYXR0ZXIoc3JjKTtcbiAgaWYgKHlhbWwpIHJldHVybiB5YW1sICsgXCJcXG5cIiArIGJsb2NrICsgYm9keTtcbiAgY29uc3QgZmlyc3RIMSA9IGJvZHkuaW5kZXhPZihcIlxcbiMgXCIpO1xuICBpZiAoZmlyc3RIMSAhPT0gLTEpIHtcbiAgICBjb25zdCBwb3MgPSBmaXJzdEgxICsgMTtcbiAgICByZXR1cm4gYm9keS5zbGljZSgwLCBwb3MpICsgYmxvY2sgKyBib2R5LnNsaWNlKHBvcyk7XG4gIH1cbiAgcmV0dXJuIGJvZHkgKyAoYm9keS5lbmRzV2l0aChcIlxcblwiKSA/IFwiXCIgOiBcIlxcblwiKSArIGJsb2NrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNMZWFmRm9sZGVyKGZvbGRlcjogVEZvbGRlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gZm9sZGVyLmNoaWxkcmVuLmZpbmQoYyA9PiBjIGluc3RhbmNlb2YgVEZvbGRlcikgPT09IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExlYWZGb2xkZXJzVW5kZXIoYXBwOiBBcHAsIGJhc2VGb2xkZXJQYXRoOiBzdHJpbmcpOiBURm9sZGVyW10ge1xuICBjb25zdCBiYXNlID0gYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aChub3JtYWxpemVQYXRoKGJhc2VGb2xkZXJQYXRoKSk7XG4gIGlmICghYmFzZSkgcmV0dXJuIFtdO1xuICBjb25zdCByZXM6IFRGb2xkZXJbXSA9IFtdO1xuICBjb25zdCB3YWxrID0gKGY6IFRGb2xkZXIpID0+IHtcbiAgICBpZiAoaXNMZWFmRm9sZGVyKGYpKSByZXMucHVzaChmKTtcbiAgICBlbHNlIGZvciAoY29uc3QgYyBvZiBmLmNoaWxkcmVuKSBpZiAoYyBpbnN0YW5jZW9mIFRGb2xkZXIpIHdhbGsoYyk7XG4gIH07XG4gIHdhbGsoYmFzZSk7XG4gIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsaXN0TWFya2Rvd25GaWxlcyhmb2xkZXI6IFRGb2xkZXIpOiBURmlsZVtdIHtcbiAgcmV0dXJuIGZvbGRlci5jaGlsZHJlbi5maWx0ZXIoKGMpOiBjIGlzIFRGaWxlID0+IGMgaW5zdGFuY2VvZiBURmlsZSAmJiBjLmV4dGVuc2lvbiA9PT0gXCJtZFwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpcnN0Tm9uRW1wdHlMaW5lSW5kZXgobGluZXM6IHN0cmluZ1tdKTogbnVtYmVyIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykgaWYgKGxpbmVzW2ldLnRyaW0oKS5sZW5ndGgpIHJldHVybiBpO1xuICByZXR1cm4gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cHNlcnRUb3BMaW5rc0Jsb2NrKHNyYzogc3RyaW5nLCBsaW5rc0xpbmU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHsgeWFtbCwgYm9keSB9ID0gc3BsaXRGcm9udG1hdHRlcihzcmMpO1xuXG4gIGZ1bmN0aW9uIHJlcGxhY2VXaXRoaW4oY29udGVudDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBNYXRoLm1pbigxMCwgbGluZXMubGVuZ3RoKTsgaSsrKSB7XG4gICAgICBpZiAoL1xcfFByZXZpb3VzXFxdXFxdfFxcfE5leHRcXF1cXF0vLnRlc3QobGluZXNbaV0pKSB7XG4gICAgICAgIGxpbmVzW2ldID0gbGlua3NMaW5lO1xuICAgICAgICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgbGluZXMuc3BsaWNlKDAsIDAsIFwiXCIsIGxpbmtzTGluZSwgXCJcIik7XG4gICAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIik7XG4gIH1cblxuICBpZiAoeWFtbCkgcmV0dXJuIHlhbWwgKyByZXBsYWNlV2l0aGluKGJvZHkpO1xuICByZXR1cm4gcmVwbGFjZVdpdGhpbihzcmMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXBzZXJ0Qm90dG9tTGlua3Moc3JjOiBzdHJpbmcsIGxpbmtzTGluZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBzcmMuc3BsaXQoXCJcXG5cIik7XG4gIGZvciAobGV0IGkgPSBNYXRoLm1heCgwLCBsaW5lcy5sZW5ndGggLSA1KTsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKC9cXHxQcmV2aW91c1xcXVxcXXxcXHxOZXh0XFxdXFxdLy50ZXN0KGxpbmVzW2ldKSkge1xuICAgICAgbGluZXNbaV0gPSBsaW5rc0xpbmU7XG4gICAgICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcbiAgICB9XG4gIH1cbiAgbGluZXMucHVzaChcIlwiLCBsaW5rc0xpbmUpO1xuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBCYXNlQm9sbHNNb2RhbCB9IGZyb20gXCIuL2JvbGxzLWJhc2UtbW9kYWxcIjtcblxuZXhwb3J0IGNsYXNzIFBpY2tWZXJzaW9uTW9kYWwgZXh0ZW5kcyBCYXNlQm9sbHNNb2RhbCB7XG4gIHByaXZhdGUgb25QaWNrOiAodmVyU2hvcnQ6IHN0cmluZyB8IG51bGwpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MsIG9uUGljazogKHZlclNob3J0OiBzdHJpbmcgfCBudWxsKSA9PiB2b2lkKSB7XG4gICAgc3VwZXIoYXBwLCBzZXR0aW5ncywge1xuICAgICAgbGFuZ3VhZ2VMYWJlbDogc2V0dGluZ3MuYmlibGVEZWZhdWx0TGFuZ3VhZ2UgPz8gbnVsbCxcbiAgICAgIHZlcnNpb25TaG9ydDogIHNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb24gPz8gbnVsbCxcbiAgICB9KTtcbiAgICB0aGlzLm9uUGljayA9IG9uUGljaztcbiAgfVxuXG4gIHByb3RlY3RlZCByZW5kZXJGb290ZXIoY29udGVudEVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5zZXROYW1lKFwiSG93IHRvIGxpbmtcIilcbiAgICAgIC5zZXREZXNjKFwiSWYgeW91IGNhbmNlbCwgbGlua3Mgd2lsbCB1c2UgZGVmYXVsdCAobm8gdmVyc2lvbikuXCIpXG4gICAgICAuYWRkQnV0dG9uKGIgPT5cbiAgICAgICAgYi5zZXRCdXR0b25UZXh0KFwiVXNlIHNlbGVjdGVkIHZlcnNpb25cIikuc2V0Q3RhKCkub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICAgIHRoaXMub25QaWNrKHRoaXMudHJhbnNsYXRpb25Db2RlIHx8IG51bGwpO1xuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLmFkZEV4dHJhQnV0dG9uKGIgPT5cbiAgICAgICAgYi5zZXRJY29uKFwieFwiKS5zZXRUb29sdGlwKFwiQ2FuY2VsIChubyB2ZXJzaW9uKVwiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgdGhpcy5vblBpY2sobnVsbCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuICB9XG59IiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIFNldHRpbmcsIE5vdGljZSwgcmVxdWVzdFVybCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcblxuLyoqIEJvbGxzIGZvcm1hdHMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQm9sbHNUcmFuc2xhdGlvbiB7XG4gIHNob3J0X25hbWU6IHN0cmluZztcbiAgZnVsbF9uYW1lOiBzdHJpbmc7XG4gIHVwZGF0ZWQ/OiBudW1iZXI7XG4gIGRpcj86IFwicnRsXCIgfCBcImx0clwiO1xufVxuZXhwb3J0IGludGVyZmFjZSBCb2xsc0xhbmd1YWdlIHtcbiAgbGFuZ3VhZ2U6IHN0cmluZztcbiAgdHJhbnNsYXRpb25zOiBCb2xsc1RyYW5zbGF0aW9uW107XG59XG5cbmNvbnN0IEJPTExTID0ge1xuICBMQU5HVUFHRVNfVVJMOiBcImh0dHBzOi8vYm9sbHMubGlmZS9zdGF0aWMvYm9sbHMvYXBwL3ZpZXdzL2xhbmd1YWdlcy5qc29uXCIsXG59O1xuXG5hc3luYyBmdW5jdGlvbiBmZXRjaExhbmd1YWdlcygpOiBQcm9taXNlPEJvbGxzTGFuZ3VhZ2VbXT4ge1xuICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0VXJsKHsgdXJsOiBCT0xMUy5MQU5HVUFHRVNfVVJMLCBtZXRob2Q6IFwiR0VUXCIgfSk7XG4gIGlmIChyZXMuc3RhdHVzIDwgMjAwIHx8IHJlcy5zdGF0dXMgPj0gMzAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7cmVzLnN0YXR1c31gKTtcbiAgfVxuICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHJlcy50ZXh0KSBhcyBCb2xsc0xhbmd1YWdlW107XG4gIHJldHVybiAocGFyc2VkIHx8IFtdKS5maWx0ZXIoYiA9PiBBcnJheS5pc0FycmF5KGIudHJhbnNsYXRpb25zKSAmJiBiLnRyYW5zbGF0aW9ucy5sZW5ndGggPiAwKTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCYXNlQm9sbHNEZWZhdWx0cyB7XG4gIGxhbmd1YWdlTGFiZWw/OiBzdHJpbmcgfCBudWxsOyAgIC8vIGUuZy4sIFwiRW5nbGlzaFwiXG4gIHZlcnNpb25TaG9ydD86IHN0cmluZyB8IG51bGw7ICAgIC8vIGUuZy4sIFwiS0pWXCJcbn1cblxuLyoqXG4gKiBCYXNlIG1vZGFsIHRoYXQ6XG4gKiAgLSBsb2FkcyBCb2xscyBsYW5ndWFnZXMuanNvbiAod2l0aCByZXF1ZXN0VXJsLCBzbyBubyBDT1JTIGlzc3VlcyksXG4gKiAgLSByZW5kZXJzIExhbmd1YWdlICsgVmVyc2lvbiBwaWNrZXJzLFxuICogIC0gZXhwb3NlcyBjaG9zZW4gYGxhbmd1YWdlS2V5YCwgYHRyYW5zbGF0aW9uQ29kZWAsIGB0cmFuc2xhdGlvbkZ1bGxgLFxuICogIC0gcHJvdmlkZXMgaG9va3MgZm9yIHN1YmNsYXNzZXMgdG8gYWRkIG9wdGlvbnMvZm9vdGVyL2FjdGlvbnMuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlQm9sbHNNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJvdGVjdGVkIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3M7XG5cbiAgcHJvdGVjdGVkIGxhbmdCbG9ja3M6IEJvbGxzTGFuZ3VhZ2VbXSA9IFtdO1xuICBwcm90ZWN0ZWQgbGFuZ3VhZ2VLZXk6IHN0cmluZyA9IFwiQUxMXCI7IC8vIFwiQUxMXCIgKD1mbGF0dGVuKSBvciBleGFjdCBCb2xsc0xhbmd1YWdlLmxhbmd1YWdlXG4gIHByb3RlY3RlZCB0cmFuc2xhdGlvbkNvZGU6IHN0cmluZyA9IFwiS0pWXCI7XG4gIHByb3RlY3RlZCB0cmFuc2xhdGlvbkZ1bGw6IHN0cmluZyA9IFwiS2luZyBKYW1lcyBWZXJzaW9uXCI7XG5cbiAgLyoqIFVJIGVsZW1lbnRzIHNoYXJlZCBzbyBzdWJjbGFzc2VzIGNhbiByZS1yZW5kZXIgcGFydHMgaWYgdGhleSB3YW50ICovXG4gIHByb3RlY3RlZCB2ZXJzaW9uc0NvbnRhaW5lciE6IEhUTUxEaXZFbGVtZW50O1xuXG4gIC8qKiBPcHRpb25hbCBkZWZhdWx0cyB0byBwcmVzZWxlY3QgKGZyb20gc2V0dGluZ3MpICovXG4gIHByaXZhdGUgZGVmYXVsdHM/OiBCYXNlQm9sbHNEZWZhdWx0cztcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncywgZGVmYXVsdHM/OiBCYXNlQm9sbHNEZWZhdWx0cykge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgIHRoaXMuZGVmYXVsdHMgPSBkZWZhdWx0cztcbiAgfVxuXG4gIC8qKiBPdmVycmlkZSB0byBhZGQgZXh0cmEgb3B0aW9uIGNvbnRyb2xzIHVuZGVyIHRoZSBwaWNrZXJzICovXG4gIHByb3RlY3RlZCByZW5kZXJFeHRyYU9wdGlvbnMoX2NvbnRlbnRFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHt9XG5cbiAgLyoqIE92ZXJyaWRlIHRvIHJlbmRlciBmb290ZXIgKGJ1dHRvbnMvcHJvZ3Jlc3MvZXRjLikgKi9cbiAgcHJvdGVjdGVkIGFic3RyYWN0IHJlbmRlckZvb3Rlcihjb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZDtcblxuICAvKiogU3ViY2xhc3NlcyBjYW4gY2FsbCB0byByZWJ1aWxkIHZlcnNpb24gZHJvcGRvd24gKi9cbiAgcHJvdGVjdGVkIHRyYW5zbGF0aW9uc0Zvckxhbmd1YWdlKGxhbmdLZXk6IHN0cmluZyk6IEJvbGxzVHJhbnNsYXRpb25bXSB7XG4gICAgaWYgKGxhbmdLZXkgPT09IFwiQUxMXCIpIHtcbiAgICAgIGNvbnN0IGFsbDogQm9sbHNUcmFuc2xhdGlvbltdID0gW107XG4gICAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIHRoaXMubGFuZ0Jsb2NrcykgYWxsLnB1c2goLi4uYmxvY2sudHJhbnNsYXRpb25zKTtcbiAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgIHJldHVybiBhbGxcbiAgICAgICAgLmZpbHRlcih0ID0+IHtcbiAgICAgICAgICBpZiAoc2Vlbi5oYXModC5zaG9ydF9uYW1lKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIHNlZW4uYWRkKHQuc2hvcnRfbmFtZSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBhLnNob3J0X25hbWUubG9jYWxlQ29tcGFyZShiLnNob3J0X25hbWUpKTtcbiAgICB9XG4gICAgY29uc3QgYmxvY2sgPSB0aGlzLmxhbmdCbG9ja3MuZmluZChiID0+IGIubGFuZ3VhZ2UgPT09IGxhbmdLZXkpO1xuICAgIGlmICghYmxvY2spIHJldHVybiBbXTtcbiAgICByZXR1cm4gYmxvY2sudHJhbnNsYXRpb25zLnNsaWNlKCkuc29ydCgoYSwgYikgPT4gYS5zaG9ydF9uYW1lLmxvY2FsZUNvbXBhcmUoYi5zaG9ydF9uYW1lKSk7XG4gIH1cblxuICBhc3luYyBvbk9wZW4oKSB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJCaWJsZSB2ZXJzaW9uXCIpO1xuXG4gICAgLy8gTG9hZCBjYXRhbG9ndWUgKGNhY2hlIG9wdGlvbmFsOiBpZiB5b3UgYWxyZWFkeSBjYWNoZSBpbiBzZXR0aW5ncywgeW91IGNhbiByZXVzZSBpdClcbiAgICB0cnkge1xuICAgICAgY29uc3QgY2FjaGVkID0gdGhpcy5zZXR0aW5ncy5ib2xsc0NhdGFsb2d1ZUNhY2hlIGFzIHVua25vd24gYXMgQm9sbHNMYW5ndWFnZVtdIHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKGNhY2hlZD8ubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMubGFuZ0Jsb2NrcyA9IGNhY2hlZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubGFuZ0Jsb2NrcyA9IGF3YWl0IGZldGNoTGFuZ3VhZ2VzKCk7XG4gICAgICAgIC8vIChvcHRpb25hbCkgc2F2ZSBpbnRvIHNldHRpbmdzIGZvciBsYXRlclxuICAgICAgICB0cnkge1xuICAgICAgICAgICh0aGlzLnNldHRpbmdzIGFzIGFueSkuYm9sbHNDYXRhbG9ndWVDYWNoZSA9IHRoaXMubGFuZ0Jsb2NrcztcbiAgICAgICAgICAodGhpcy5zZXR0aW5ncyBhcyBhbnkpLmJvbGxzQ2F0YWxvZ3VlQ2FjaGVkQXQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgIC8vIGNhbGwgeW91ciBwbHVnaW4gc2F2ZSBtZXRob2QsIGlmIGFueTpcbiAgICAgICAgICAodGhpcy5hcHAgYXMgYW55KS5zYXZlUGx1Z2luU2V0dGluZ3M/LigpID8/ICh0aGlzIGFzIGFueSkucGx1Z2luPy5zYXZlU2V0dGluZ3M/LigpO1xuICAgICAgICB9IGNhdGNoIHt9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKFwiW0JvbGxzXSBDb3VsZCBub3QgZmV0Y2ggbGFuZ3VhZ2VzLmpzb246XCIsIGUpO1xuICAgICAgLy8gTWluaW1hbCBmYWxsYmFjayBzbyBVSSBzdGlsbCB3b3JrczpcbiAgICAgIHRoaXMubGFuZ0Jsb2NrcyA9IFt7XG4gICAgICAgIGxhbmd1YWdlOiBcIkVuZ2xpc2hcIixcbiAgICAgICAgdHJhbnNsYXRpb25zOiBbXG4gICAgICAgICAgeyBzaG9ydF9uYW1lOiBcIktKVlwiLCBmdWxsX25hbWU6IFwiS2luZyBKYW1lcyBWZXJzaW9uIDE3Njkgd2l0aCBBcG9jcnlwaGEgYW5kIFN0cm9uZydzIE51bWJlcnNcIiB9LFxuICAgICAgICAgIHsgc2hvcnRfbmFtZTogXCJXRUJcIiwgZnVsbF9uYW1lOiBcIldvcmxkIEVuZ2xpc2ggQmlibGVcIiB9LFxuICAgICAgICAgIHsgc2hvcnRfbmFtZTogXCJZTFRcIiwgZnVsbF9uYW1lOiBcIllvdW5nJ3MgTGl0ZXJhbCBUcmFuc2xhdGlvbiAoMTg5OClcIiB9LFxuICAgICAgICBdLFxuICAgICAgfV07XG4gICAgICBuZXcgTm90aWNlKFwiVXNpbmcgbWluaW1hbCBmYWxsYmFjayBjYXRhbG9ndWUgKEtKVi9XRUIvWUxUKS5cIik7XG4gICAgfVxuXG4gICAgLy8gUHJlc2VsZWN0IGRlZmF1bHRzIGlmIHByb3ZpZGVkXG4gICAgaWYgKHRoaXMuZGVmYXVsdHM/Lmxhbmd1YWdlTGFiZWwpIHtcbiAgICAgIGNvbnN0IGZvdW5kID0gdGhpcy5sYW5nQmxvY2tzLmZpbmQoYiA9PiBiLmxhbmd1YWdlID09PSB0aGlzLmRlZmF1bHRzIS5sYW5ndWFnZUxhYmVsKTtcbiAgICAgIGlmIChmb3VuZCkgdGhpcy5sYW5ndWFnZUtleSA9IGZvdW5kLmxhbmd1YWdlO1xuICAgIH1cbiAgICBpZiAodGhpcy5kZWZhdWx0cz8udmVyc2lvblNob3J0KSB7XG4gICAgICB0aGlzLnRyYW5zbGF0aW9uQ29kZSA9IHRoaXMuZGVmYXVsdHMudmVyc2lvblNob3J0O1xuICAgICAgY29uc3QgdCA9IHRoaXMudHJhbnNsYXRpb25zRm9yTGFuZ3VhZ2UodGhpcy5sYW5ndWFnZUtleSkuZmluZCh4ID0+IHguc2hvcnRfbmFtZSA9PT0gdGhpcy50cmFuc2xhdGlvbkNvZGUpO1xuICAgICAgdGhpcy50cmFuc2xhdGlvbkZ1bGwgPSB0Py5mdWxsX25hbWUgPz8gdGhpcy50cmFuc2xhdGlvbkNvZGU7XG4gICAgfVxuXG4gICAgLy8gTEFOR1VBR0UgUElDS0VSXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJMYW5ndWFnZVwiKVxuICAgICAgLmFkZERyb3Bkb3duKGRkID0+IHtcbiAgICAgICAgY29uc3Qgc2VsID0gZGQuc2VsZWN0RWw7XG4gICAgICAgIChzZWwgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLm1heFdpZHRoID0gXCIzNjBweFwiO1xuICAgICAgICAoc2VsIGFzIEhUTUxFbGVtZW50KS5zdHlsZS53aGl0ZVNwYWNlID0gXCJub3dyYXBcIjtcblxuICAgICAgICBkZC5hZGRPcHRpb24oXCJBTExcIiwgXCJBbGwgbGFuZ3VhZ2VzXCIpO1xuICAgICAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIHRoaXMubGFuZ0Jsb2Nrcykge1xuICAgICAgICAgIGRkLmFkZE9wdGlvbihibG9jay5sYW5ndWFnZSwgYmxvY2subGFuZ3VhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGRkLnNldFZhbHVlKHRoaXMubGFuZ3VhZ2VLZXkpO1xuICAgICAgICBkZC5vbkNoYW5nZSh2ID0+IHtcbiAgICAgICAgICB0aGlzLmxhbmd1YWdlS2V5ID0gdjtcbiAgICAgICAgICB0aGlzLnJlYnVpbGRWZXJzaW9ucygpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgLy8gVkVSU0lPTlMgKGR5bmFtaWMpXG4gICAgdGhpcy52ZXJzaW9uc0NvbnRhaW5lciA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoKTtcbiAgICB0aGlzLnJlYnVpbGRWZXJzaW9ucygpO1xuXG4gICAgLy8gQWxsb3cgc3ViY2xhc3NlcyB0byBhZGQgZXh0cmEgY29udHJvbHNcbiAgICB0aGlzLnJlbmRlckV4dHJhT3B0aW9ucyhjb250ZW50RWwpO1xuXG4gICAgLy8gRm9vdGVyL2FjdGlvbnMgKGFic3RyYWN0KVxuICAgIHRoaXMucmVuZGVyRm9vdGVyKGNvbnRlbnRFbCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgcmVidWlsZFZlcnNpb25zKCkge1xuICAgIHRoaXMudmVyc2lvbnNDb250YWluZXIuZW1wdHkoKTtcbiAgICBjb25zdCBsaXN0ID0gdGhpcy50cmFuc2xhdGlvbnNGb3JMYW5ndWFnZSh0aGlzLmxhbmd1YWdlS2V5KTtcblxuICAgIG5ldyBTZXR0aW5nKHRoaXMudmVyc2lvbnNDb250YWluZXIpXG4gICAgICAuc2V0TmFtZShcIlZlcnNpb25cIilcbiAgICAgIC5hZGREcm9wZG93bihkZCA9PiB7XG4gICAgICAgIGNvbnN0IHNlbCA9IGRkLnNlbGVjdEVsO1xuICAgICAgICAoc2VsIGFzIEhUTUxFbGVtZW50KS5zdHlsZS5tYXhXaWR0aCA9IFwiMzYwcHhcIjtcbiAgICAgICAgKHNlbCBhcyBIVE1MRWxlbWVudCkuc3R5bGUud2hpdGVTcGFjZSA9IFwibm93cmFwXCI7XG5cbiAgICAgICAgaWYgKCFsaXN0Lmxlbmd0aCkge1xuICAgICAgICAgIGRkLmFkZE9wdGlvbihcIlwiLCBcIihubyB0cmFuc2xhdGlvbnMpXCIpO1xuICAgICAgICAgIGRkLnNldFZhbHVlKFwiXCIpO1xuICAgICAgICAgIHRoaXMudHJhbnNsYXRpb25Db2RlID0gXCJcIjtcbiAgICAgICAgICB0aGlzLnRyYW5zbGF0aW9uRnVsbCA9IFwiXCI7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCB0IG9mIGxpc3QpIGRkLmFkZE9wdGlvbih0LnNob3J0X25hbWUsIGAke3Quc2hvcnRfbmFtZX0gXHUyMDE0ICR7dC5mdWxsX25hbWV9YCk7XG5cbiAgICAgICAgLy8ga2VlcCBjdXJyZW50IGlmIGV4aXN0czsgZWxzZSBmaXJzdFxuICAgICAgICBjb25zdCBleGlzdHMgPSBsaXN0LnNvbWUodCA9PiB0LnNob3J0X25hbWUgPT09IHRoaXMudHJhbnNsYXRpb25Db2RlKTtcbiAgICAgICAgY29uc3QgY2hvc2VuID0gZXhpc3RzID8gdGhpcy50cmFuc2xhdGlvbkNvZGUgOiBsaXN0WzBdLnNob3J0X25hbWU7XG4gICAgICAgIGRkLnNldFZhbHVlKGNob3Nlbik7XG4gICAgICAgIHRoaXMudHJhbnNsYXRpb25Db2RlID0gY2hvc2VuO1xuICAgICAgICBjb25zdCB0dCA9IGxpc3QuZmluZCh4ID0+IHguc2hvcnRfbmFtZSA9PT0gY2hvc2VuKTtcbiAgICAgICAgdGhpcy50cmFuc2xhdGlvbkZ1bGwgPSB0dD8uZnVsbF9uYW1lID8/IGNob3NlbjtcblxuICAgICAgICBkZC5vbkNoYW5nZSh2ID0+IHtcbiAgICAgICAgICB0aGlzLnRyYW5zbGF0aW9uQ29kZSA9IHY7XG4gICAgICAgICAgY29uc3QgdDIgPSBsaXN0LmZpbmQoeCA9PiB4LnNob3J0X25hbWUgPT09IHYpO1xuICAgICAgICAgIHRoaXMudHJhbnNsYXRpb25GdWxsID0gdDI/LmZ1bGxfbmFtZSA/PyB2O1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICB9XG59IiwgImltcG9ydCB7IEFwcCwgVEZpbGUsIFRGb2xkZXIsIE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBsaXN0TWFya2Rvd25GaWxlcywgdXBzZXJ0Qm90dG9tTGlua3MsIHVwc2VydFRvcExpbmtzQmxvY2sgfSBmcm9tIFwiLi4vbGliL21kVXRpbHNcIjtcblxuZnVuY3Rpb24gdG9rZW5Gcm9tRmlsZW5hbWUobmFtZTogc3RyaW5nKTogbnVtYmVyIHwgbnVsbCB7XG4gIGNvbnN0IG0gPSBuYW1lLm1hdGNoKC9eKFxcZCspLyk7XG4gIGlmICghbSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBwYXJzZUludChtWzFdLCAxMCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kQWRkTmV4dFByZXZpb3VzKGFwcDogQXBwLCBfc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncywgX3BhcmFtcz86IFJlY29yZDxzdHJpbmcsc3RyaW5nPikge1xuICBjb25zdCBmaWxlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gIGlmICghZmlsZSkgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgZmlyc3QuXCIpOyByZXR1cm47IH1cbiAgY29uc3QgcGFyZW50ID0gZmlsZS5wYXJlbnQ7XG4gIGlmICghKHBhcmVudCBpbnN0YW5jZW9mIFRGb2xkZXIpKSB7IG5ldyBOb3RpY2UoXCJDdXJyZW50IGZpbGUgaGFzIG5vIGZvbGRlci5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IG1kRmlsZXMgPSBsaXN0TWFya2Rvd25GaWxlcyhwYXJlbnQpXG4gICAgLm1hcChmID0+ICh7IGYsIG46IHRva2VuRnJvbUZpbGVuYW1lKGYubmFtZSkgfSkpXG4gICAgLmZpbHRlcih4ID0+IHgubiAhPT0gbnVsbClcbiAgICAuc29ydCgoYSwgYikgPT4gKGEubiEgLSBiLm4hKSlcbiAgICAubWFwKHggPT4geC5mKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1kRmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjdXIgPSBtZEZpbGVzW2ldO1xuICAgIGNvbnN0IHByZXYgPSBtZEZpbGVzW2kgLSAxXTtcbiAgICBjb25zdCBuZXh0ID0gbWRGaWxlc1tpICsgMV07XG5cbiAgICBjb25zdCBwcmV2TmFtZSA9IHByZXYgPyBwcmV2LmJhc2VuYW1lIDogbnVsbDtcbiAgICBjb25zdCBuZXh0TmFtZSA9IG5leHQgPyBuZXh0LmJhc2VuYW1lIDogbnVsbDtcblxuICAgIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmIChwcmV2TmFtZSkgcGFydHMucHVzaChgW1ske3ByZXZOYW1lfXxQcmV2aW91c11dYCk7XG4gICAgaWYgKG5leHROYW1lKSBwYXJ0cy5wdXNoKGBbWyR7bmV4dE5hbWV9fE5leHRdXWApO1xuICAgIGNvbnN0IGxpbmtzTGluZSA9IHBhcnRzLmpvaW4oXCIgfCBcIik7XG5cbiAgICBpZiAoIWxpbmtzTGluZSkgY29udGludWU7XG5cbiAgICBjb25zdCBzcmMgPSBhd2FpdCBhcHAudmF1bHQucmVhZChjdXIpO1xuICAgIGNvbnN0IHdpdGhUb3AgPSB1cHNlcnRUb3BMaW5rc0Jsb2NrKHNyYywgbGlua3NMaW5lKTtcbiAgICBjb25zdCB3aXRoQm90aCA9IHVwc2VydEJvdHRvbUxpbmtzKHdpdGhUb3AsIGxpbmtzTGluZSk7XG4gICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShjdXIsIHdpdGhCb3RoKTtcbiAgfVxuXG4gIG5ldyBOb3RpY2UoXCJJbnNlcnRlZCBOZXh0L1ByZXZpb3VzIGxpbmtzLlwiKTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIFRGaWxlLCBURm9sZGVyLCBOb3RpY2UsIG5vcm1hbGl6ZVBhdGggfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgYXJ0aWNsZVN0eWxlLCBub3dTdGFtcCB9IGZyb20gXCIuLi9saWIvdGV4dFV0aWxzXCI7XG5pbXBvcnQgeyBnZXRMZWFmRm9sZGVyc1VuZGVyLCBsaXN0TWFya2Rvd25GaWxlcyB9IGZyb20gXCIuLi9saWIvbWRVdGlsc1wiO1xuXG5jb25zdCBzdHJpcFdpa2lsaW5rcyA9IChzOiBzdHJpbmcpID0+IHMucmVwbGFjZSgvXlxcW1xcW3xcXF1cXF0kL2csIFwiXCIpO1xuXG5mdW5jdGlvbiBmcm9udG1hdHRlckF1dGhvckZyb21GaWxlKGFwcDogQXBwLCBmOiBURmlsZSk6IHsgYXV0aG9yPzogc3RyaW5nIHwgc3RyaW5nW10sIGJvb2tfdHlwZT86IHN0cmluZyB9IHtcbiAgY29uc3QgY2FjaGUgPSBhcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZik7XG4gIGNvbnN0IGZtOiBhbnkgPSBjYWNoZT8uZnJvbnRtYXR0ZXIgPz8ge307XG4gIGxldCBhdXRob3IgPSBmbS5hdXRob3I7XG4gIGlmICh0eXBlb2YgYXV0aG9yID09PSBcInN0cmluZ1wiKSBhdXRob3IgPSBhdXRob3IucmVwbGFjZSgvXlwiXFxzKi8sIFwiXCIpLnJlcGxhY2UoL1xccypcIiQvLCBcIlwiKTtcbiAgY29uc3QgYm9va190eXBlID0gdHlwZW9mIGZtLmJvb2tfdHlwZSA9PT0gXCJzdHJpbmdcIiA/IGZtLmJvb2tfdHlwZS5yZXBsYWNlKC9eXCJcXHMqLywgXCJcIikucmVwbGFjZSgvXFxzKlwiJC8sIFwiXCIpIDogdW5kZWZpbmVkO1xuICByZXR1cm4geyBhdXRob3IsIGJvb2tfdHlwZSB9O1xufVxuXG5mdW5jdGlvbiBmb3JtYXRBdXRob3JGaWVsZChhdXRob3I6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgaWYgKCFhdXRob3IpIHJldHVybiAnXCJbW1Vua25vd24gQXV0aG9yXV1cIic7XG4gIGlmIChBcnJheS5pc0FycmF5KGF1dGhvcikpIHtcbiAgICByZXR1cm4gXCJcXG4gIC0gXCIgKyBhdXRob3JcbiAgICAgIC5tYXAoYSA9PiBhLnJlcGxhY2UoL15cXFtcXFt8XFxdXFxdJC9nLCBcIlwiKSlcbiAgICAgIC5tYXAoYSA9PiBgW1ske2F9XV1gKVxuICAgICAgLmpvaW4oXCJcXG4gIC0gXCIpO1xuICB9XG4gIGNvbnN0IGNsZWFuID0gYXV0aG9yLnJlcGxhY2UoL15cXFtcXFt8XFxdXFxdJC9nLCBcIlwiKTtcbiAgcmV0dXJuIGAgXCJbWyR7Y2xlYW59XV1cImA7XG59XG5cbi8qKiBDb3JlOiBjcmVhdGUvdXBkYXRlIHRoZSBpbmRleCBmaWxlIGZvciBhIHNpbmdsZSBmb2xkZXIuIFJldHVybnMgdHJ1ZSBpZiBjcmVhdGVkL3VwZGF0ZWQsIGZhbHNlIGlmIHNraXBwZWQuICovXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVPclVwZGF0ZUluZGV4Rm9yRm9sZGVyKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzLCBmb2xkZXI6IFRGb2xkZXIsIGlzQm9vazogYm9vbGVhbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBjb25zdCBmaWxlcyA9IGxpc3RNYXJrZG93bkZpbGVzKGZvbGRlcik7XG4gIGlmICghZmlsZXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gVHJ5IHRvIHBpY2sgYXV0aG9yL2Jvb2tfdHlwZSBmcm9tIHRoZSBmaXJzdCBmaWxlIHRoYXQgaGFzIGl0XG4gIGxldCBhdXRob3I6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBsZXQgYm9va1R5cGU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgZm9yIChjb25zdCBmIG9mIGZpbGVzKSB7XG4gICAgY29uc3QgbWV0YSA9IGZyb250bWF0dGVyQXV0aG9yRnJvbUZpbGUoYXBwLCBmKTtcbiAgICBpZiAobWV0YS5hdXRob3IpIHsgYXV0aG9yID0gbWV0YS5hdXRob3I7IGJvb2tUeXBlID0gbWV0YS5ib29rX3R5cGU7IGJyZWFrOyB9XG4gIH1cblxuICBjb25zdCBmb2xkZXJOYW1lID0gZm9sZGVyLm5hbWU7XG4gIGNvbnN0IGlkeE5hbWUgPSBzZXR0aW5ncy5pbmRleEZpbGVOYW1lTW9kZSA9PT0gXCJhcnRpY2xlLXN0eWxlXCIgPyBhcnRpY2xlU3R5bGUoZm9sZGVyTmFtZSkgOiBmb2xkZXJOYW1lO1xuICBjb25zdCBpbmRleFBhdGggPSBub3JtYWxpemVQYXRoKGZvbGRlci5wYXRoICsgXCIvXCIgKyBpZHhOYW1lICsgXCIubWRcIik7XG4gIGNvbnN0IGNyZWF0ZWQgPSBub3dTdGFtcCgpO1xuXG4gIHZhciBwcm9wczogc3RyaW5nO1xuICBpZiAoaXNCb29rKSB7XG4gICAgcHJvcHMgPSBbXG4gICAgICBgdGl0bGU6ICR7aWR4TmFtZX1gLFxuICAgICAgYGNyZWF0ZWQ6ICR7Y3JlYXRlZH1gLFxuICAgICAgYG1vZGlmaWVkOiAke2NyZWF0ZWR9YCxcbiAgICAgIGBib29rX3RpdGxlOiBcIltbJHtmb2xkZXJOYW1lfV1dXCJgLFxuICAgICAgLi4uKGJvb2tUeXBlID8gW2Bib29rX3R5cGU6IFwiW1ske3N0cmlwV2lraWxpbmtzKGJvb2tUeXBlKX1dXVwiYF0gOiBbXSksXG4gICAgICBgdHlwZTogXCJbW0Jvb2tdXVwiYCxcbiAgICAgIGBhdXRob3I6ICR7Zm9ybWF0QXV0aG9yRmllbGQoYXV0aG9yKX1gXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9IGVsc2Uge1xuICAgIHByb3BzID0gW1xuICAgICAgYHRpdGxlOiAke2lkeE5hbWV9YCxcbiAgICAgIGBjcmVhdGVkOiAke2NyZWF0ZWR9YCxcbiAgICAgIGBtb2RpZmllZDogJHtjcmVhdGVkfWAsXG4gICAgICBgdG9waWNzOiBcIltbJHtzdHJpcFdpa2lsaW5rcyhmb2xkZXJOYW1lKX1dXVwiYFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IGRhdGF2aWV3ID0gW1xuICAgIFwiYGBgZGF0YXZpZXdcIixcbiAgICBcIlRBQkxFXCIsXG4gICAgJ2Zyb20gXCJcIicsXG4gICAgXCJ3aGVyZSBjb250YWlucyhmaWxlLmZvbGRlciwgdGhpcy5maWxlLmZvbGRlcikgYW5kIGZpbGUubmFtZSAhPSB0aGlzLmZpbGUubmFtZVwiLFxuICAgIFwiU09SVCBudW1iZXIoZmlsZS5uYW1lKSBBU0NcIixcbiAgICBcImBgYFwiLFxuICAgIFwiXCJcbiAgXS5qb2luKFwiXFxuXCIpO1xuXG4gIGNvbnN0IGhlYWRlciA9IGAtLS1cXG4ke3Byb3BzfVxcbi0tLVxcblxcbiMgJHtpZHhOYW1lfVxcbmA7XG4gIGNvbnN0IGNvbnRlbnQgPSBoZWFkZXIgKyBkYXRhdmlldztcblxuICBjb25zdCBleGlzdGluZyA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoaW5kZXhQYXRoKTtcbiAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICBjb25zdCBjdXIgPSBhd2FpdCBhcHAudmF1bHQucmVhZChleGlzdGluZyk7XG4gICAgaWYgKC9gYGBkYXRhdmlldy8udGVzdChjdXIpKSByZXR1cm4gZmFsc2U7IC8vIGFscmVhZHkgaGFzIGEgZGF0YXZpZXcgYmxvY2sgXHUyMDE0IHNraXBcblxuICAgIC8vIEluc2VydCBkYXRhdmlldyByaWdodCBhZnRlciBmcm9udG1hdHRlciBpZiBwcmVzZW50XG4gICAgY29uc3QgcGFydHMgPSBjdXIuc3BsaXQoXCItLS1cIik7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA+PSAzKSB7XG4gICAgICBjb25zdCBtZXJnZWQgPSBwYXJ0c1swXSArIFwiLS0tXCIgKyBwYXJ0c1sxXSArIFwiLS0tXFxuXCIgKyBkYXRhdmlldyArIHBhcnRzLnNsaWNlKDIpLmpvaW4oXCItLS1cIik7XG4gICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGV4aXN0aW5nLCBtZXJnZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGV4aXN0aW5nLCBjdXIgKyBcIlxcblwiICsgZGF0YXZpZXcpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICBhd2FpdCBhcHAudmF1bHQuY3JlYXRlKGluZGV4UGF0aCwgY29udGVudCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuLyoqIEV4aXN0aW5nIGNvbW1hbmQ6IGFkZCBpbmRleGVzIGZvciBhbGwgbGVhZiBmb2xkZXJzIHVuZGVyIGEgYmFzZSBmb2xkZXIgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kQWRkRm9sZGVySW5kZXgoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MsIHBhcmFtcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pIHtcbiAgY29uc3QgYmFzZUZvbGRlciA9IHBhcmFtcz8uZm9sZGVyID8/IHNldHRpbmdzLmJhc2VGb2xkZXI7XG4gIGNvbnN0IGZvbGRlcnMgPSBnZXRMZWFmRm9sZGVyc1VuZGVyKGFwcCwgYmFzZUZvbGRlcik7XG4gIGlmICghZm9sZGVycy5sZW5ndGgpIHsgbmV3IE5vdGljZShgTm8gbGVhZiBmb2xkZXJzIHVuZGVyICR7YmFzZUZvbGRlcn1gKTsgcmV0dXJuOyB9XG5cbiAgbGV0IGNoYW5nZWQgPSAwO1xuICBmb3IgKGNvbnN0IGZvbGRlciBvZiBmb2xkZXJzKSB7XG4gICAgY29uc3QgZGlkID0gYXdhaXQgY3JlYXRlT3JVcGRhdGVJbmRleEZvckZvbGRlcihhcHAsIHNldHRpbmdzLCBmb2xkZXIsIHRydWUpO1xuICAgIGlmIChkaWQpIGNoYW5nZWQrKztcbiAgfVxuXG4gIG5ldyBOb3RpY2UoY2hhbmdlZCA+IDAgPyBgRm9sZGVyIGluZGV4ZXMgY3JlYXRlZC91cGRhdGVkOiAke2NoYW5nZWR9YCA6IFwiTm8gY2hhbmdlczsgaW5kZXhlcyBhbHJlYWR5IHByZXNlbnQuXCIpO1xufVxuXG4vKiogTkVXIGNvbW1hbmQ6IGFkZC91cGRhdGUgaW5kZXggT05MWSBmb3IgdGhlIGZvbGRlciBvZiB0aGUgY3VycmVudCBmaWxlICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZEFkZEluZGV4Rm9yQ3VycmVudEZvbGRlcihhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuICBjb25zdCBhY3RpdmUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgY29uc3QgZm9sZGVyID0gYWN0aXZlPy5wYXJlbnQ7XG4gIGlmICghYWN0aXZlIHx8ICFmb2xkZXIpIHsgbmV3IE5vdGljZShcIk9wZW4gYSBmaWxlIGluc2lkZSB0aGUgdGFyZ2V0IGZvbGRlci5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IGRpZCA9IGF3YWl0IGNyZWF0ZU9yVXBkYXRlSW5kZXhGb3JGb2xkZXIoYXBwLCBzZXR0aW5ncywgZm9sZGVyLCBmYWxzZSk7XG4gIG5ldyBOb3RpY2UoZGlkID8gYEluZGV4IGNyZWF0ZWQvdXBkYXRlZCBmb3IgXHUyMDFDJHtmb2xkZXIubmFtZX1cdTIwMUQuYCA6IGBObyBpbmRleCBjaGFuZ2UgaW4gXHUyMDFDJHtmb2xkZXIubmFtZX1cdTIwMUQuYCk7XG59IiwgImV4cG9ydCBmdW5jdGlvbiBhcnRpY2xlU3R5bGUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKG5hbWUuZW5kc1dpdGgoXCIsIFRoZVwiKSkgcmV0dXJuIGBUaGUgJHtuYW1lLnNsaWNlKDAsIC01KX1gO1xuICBpZiAobmFtZS5lbmRzV2l0aChcIiwgQVwiKSkgICByZXR1cm4gYEEgJHtuYW1lLnNsaWNlKDAsIC0zKX1gO1xuICByZXR1cm4gbmFtZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vd1N0YW1wKCk6IHN0cmluZyB7XG4gIGNvbnN0IGQgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCB3ZWVrZGF5ID0gZC50b0xvY2FsZURhdGVTdHJpbmcodW5kZWZpbmVkLCB7IHdlZWtkYXk6IFwic2hvcnRcIiB9KTtcbiAgY29uc3QgZGF5ID0gU3RyaW5nKGQuZ2V0RGF0ZSgpKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gIGNvbnN0IG1vbnRoID0gZC50b0xvY2FsZURhdGVTdHJpbmcodW5kZWZpbmVkLCB7IG1vbnRoOiBcImxvbmdcIiB9KTtcbiAgY29uc3QgeWVhciA9IGQuZ2V0RnVsbFllYXIoKTtcbiAgY29uc3QgdGltZSA9IGQudG9Mb2NhbGVUaW1lU3RyaW5nKHVuZGVmaW5lZCwgeyBob3VyMTI6IGZhbHNlIH0pO1xuICByZXR1cm4gYCR7d2Vla2RheX0sICR7ZGF5fS4gJHttb250aH0gJHt5ZWFyfSwgJHt0aW1lfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnN1cmVOZXdsaW5lKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzLmVuZHNXaXRoKFwiXFxuXCIpID8gcyA6IHMgKyBcIlxcblwiO1xufVxuIiwgImltcG9ydCB0eXBlIE9ic2lkaWFuQmlibGVUb29scyBmcm9tIFwiLi9tYWluXCI7XG5pbXBvcnQgeyBjb21tYW5kVmVyc2VMaW5rcyB9IGZyb20gXCIuL2NvbW1hbmRzL3ZlcnNlTGlua3NcIjtcbmltcG9ydCB7IGNvbW1hbmRBZGROZXh0UHJldmlvdXMgfSBmcm9tIFwiLi9jb21tYW5kcy9hZGROZXh0UHJldmlvdXNcIjtcbmltcG9ydCB7IGNvbW1hbmRBZGRGb2xkZXJJbmRleCB9IGZyb20gXCIuL2NvbW1hbmRzL2FkZEZvbGRlckluZGV4XCI7XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclByb3RvY29sKHBsdWdpbjogT2JzaWRpYW5CaWJsZVRvb2xzKSB7XG4gIHBsdWdpbi5yZWdpc3Rlck9ic2lkaWFuUHJvdG9jb2xIYW5kbGVyKFwib2JzaWRpYW4tYmlibGUtdG9vbHNcIiwgYXN5bmMgKHBhcmFtcykgPT4ge1xuICAgIGNvbnN0IGFjdGlvbiA9IHBhcmFtcy5hY3Rpb24gPz8gXCJcIjtcbiAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgY2FzZSBcImxpbmstdmVyc2VzXCI6XG4gICAgICAgIGF3YWl0IGNvbW1hbmRWZXJzZUxpbmtzKHBsdWdpbi5hcHAsIHBsdWdpbi5zZXR0aW5ncywgcGFyYW1zKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiYWRkLW5leHQtcHJldmlvdXNcIjpcbiAgICAgICAgYXdhaXQgY29tbWFuZEFkZE5leHRQcmV2aW91cyhwbHVnaW4uYXBwLCBwbHVnaW4uc2V0dGluZ3MsIHBhcmFtcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFkZC1mb2xkZXItaW5kZXhcIjpcbiAgICAgICAgYXdhaXQgY29tbWFuZEFkZEZvbGRlckluZGV4KHBsdWdpbi5hcHAsIHBsdWdpbi5zZXR0aW5ncywgcGFyYW1zKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH0pO1xufVxuIiwgImltcG9ydCB0eXBlIHsgYWRkSWNvbiBhcyBBZGRJY29uRm4gfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuY29uc3QgSUNPTlM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIFwib2J0Yi1ib29rXCI6IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI+PHBhdGggZD1cIk02IDRoMTBhMiAyIDAgMCAxIDIgMnYxMi41YTEuNSAxLjUgMCAwIDAtMS41LTEuNUg2YTIgMiAwIDAgMCAwIDRoMTBcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIvPjwvc3ZnPmAsXG4gIFwib2J0Yi1saW5rc1wiOiBgPHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiPjxwYXRoIGQ9XCJNMTAgMTNhNSA1IDAgMCAxIDAtN2wxLTFhNSA1IDAgMCAxIDcgN2wtMSAxTTE0IDExYTUgNSAwIDAgMSAwIDdsLTEgMWE1IDUgMCAwIDEtNy03bDEtMVwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIi8+PC9zdmc+YCxcbiAgXCJvYnRiLWhpZ2hsaWdodGVyXCI6IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj48cGF0aCBkPVwiTTMgMTZsNi02IDUgNS02IDZIM3pcIiBmaWxsPVwiY3VycmVudENvbG9yXCIvPjxwYXRoIGQ9XCJNMTIgOWwzLTMgMyAzLTMgM3pcIiBmaWxsPVwiY3VycmVudENvbG9yXCIvPjwvc3ZnPmAsXG4gIFwib2J0Yi1zdW1tYXJ5XCI6IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj48cGF0aCBkPVwiTTUgNWgxNE01IDloMTBNNSAxM2g4TTUgMTdoNlwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgZmlsbD1cIm5vbmVcIi8+PC9zdmc+YCxcbiAgXCJvYnRiLW91dGxpbmVcIjogYDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiPjxwYXRoIGQ9XCJNNyA2aDEwTTcgMTJoMTBNNyAxOGg2XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBmaWxsPVwibm9uZVwiLz48L3N2Zz5gLFxuICBcIm9idGItZm9ybWF0dGVyXCI6IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj48cGF0aCBkPVwiTTUgN2g2TTUgMTJoMTBNNSAxN2g4XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBmaWxsPVwibm9uZVwiLz48L3N2Zz5gLFxuICBcIm9idGItYmlibGVcIjogYDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiPjxwYXRoIGQ9XCJNNi41IDRoOUEyLjUgMi41IDAgMCAxIDE4IDYuNVYyMEg4LjVBMi41IDIuNSAwIDAgMSA2IDE3LjVWNC41XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIvPjxwYXRoIGQ9XCJNMTAgOGg2TTEwIDExaDZcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIvPjwvc3ZnPmBcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3Rlckljb25zKGFkZEljb246IHR5cGVvZiBBZGRJY29uRm4pIHtcbiAgZm9yIChjb25zdCBbbmFtZSwgc3ZnXSBvZiBPYmplY3QuZW50cmllcyhJQ09OUykpIGFkZEljb24obmFtZSwgc3ZnKTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE5vdGljZSwgVEZvbGRlciB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBsaXN0TWFya2Rvd25GaWxlcyB9IGZyb20gXCIuLi9saWIvbWRVdGlsc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZEV4dHJhY3RIaWdobGlnaHRzRm9sZGVyKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IHZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgY29uc3Qgc3RhcnRGb2xkZXIgPSB2aWV3Py5wYXJlbnQgPz8gYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aChzZXR0aW5ncy5iYXNlRm9sZGVyKTtcbiAgaWYgKCEoc3RhcnRGb2xkZXIgaW5zdGFuY2VvZiBURm9sZGVyKSkgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgaW4gdGhlIHRhcmdldCBmb2xkZXIgb3Igc2V0IGEgdmFsaWQgYmFzZSBmb2xkZXIuXCIpOyByZXR1cm47IH1cblxuICBjb25zdCBhbGw6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgbWFya1JlZ2V4ID0gbmV3IFJlZ0V4cChgPG1hcmtcXFxccytzdHlsZT1bXCInXSR7c2V0dGluZ3MucmVkTWFya0Nzcy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxcXF1cXFxcXFxcXF0vZywgXCJcXFxcJCZcIil9W1wiJ10+KC4qPyk8L21hcms+YCwgXCJnXCIpO1xuXG4gIGNvbnN0IGZpbGVzID0gbGlzdE1hcmtkb3duRmlsZXMoc3RhcnRGb2xkZXIpLnNvcnQoKGEsYikgPT4ge1xuICAgIGNvbnN0IGFuID0gYS5iYXNlbmFtZS5tYXRjaCgvXlxcZCsvKT8uWzBdOyBjb25zdCBibiA9IGIuYmFzZW5hbWUubWF0Y2goL15cXGQrLyk/LlswXTtcbiAgICBpZiAoYW4gJiYgYm4pIHJldHVybiBOdW1iZXIoYW4pIC0gTnVtYmVyKGJuKTtcbiAgICBpZiAoYW4pIHJldHVybiAtMTtcbiAgICBpZiAoYm4pIHJldHVybiAxO1xuICAgIHJldHVybiBhLmJhc2VuYW1lLmxvY2FsZUNvbXBhcmUoYi5iYXNlbmFtZSk7XG4gIH0pO1xuXG4gIGZvciAoY29uc3QgZiBvZiBmaWxlcykge1xuICAgIGNvbnN0IHNyYyA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGYpO1xuICAgIGNvbnN0IGxvY2FsOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICAgIG1hcmtSZWdleC5sYXN0SW5kZXggPSAwO1xuICAgIHdoaWxlICgobSA9IG1hcmtSZWdleC5leGVjKHNyYykpICE9PSBudWxsKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gbVsxXS50cmltKCk7XG4gICAgICBpZiAoIXRleHQpIGNvbnRpbnVlO1xuICAgICAgaWYgKCFzZWVuLmhhcyh0ZXh0KSkgeyBzZWVuLmFkZCh0ZXh0KTsgaWYgKCFsb2NhbC5pbmNsdWRlcyh0ZXh0KSkgbG9jYWwucHVzaCh0ZXh0KTsgfVxuICAgIH1cbiAgICBpZiAobG9jYWwubGVuZ3RoKSB7XG4gICAgICBhbGwucHVzaChgXFxuIyMjIyBbWyR7Zi5iYXNlbmFtZX1dXVxcbmAgKyBsb2NhbC5tYXAodCA9PiBgLSAke3R9YCkuam9pbihcIlxcblwiKSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFhbGwubGVuZ3RoKSB7IG5ldyBOb3RpY2UoXCJObyBoaWdobGlnaHRzIGZvdW5kIGluIGZvbGRlci5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IG91dCA9IGFsbC5qb2luKFwiXFxuXCIpO1xuICBjb25zdCB0YXJnZXQgPSBzdGFydEZvbGRlci5wYXRoICsgXCIvSGlnaGxpZ2h0cy5tZFwiO1xuICBjb25zdCBleGlzdGluZyA9IGFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKHRhcmdldCk7XG4gIGlmIChleGlzdGluZykgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShleGlzdGluZywgb3V0KTtcbiAgZWxzZSBhd2FpdCBhcHAudmF1bHQuY3JlYXRlKHRhcmdldCwgb3V0KTtcbiAgbmV3IE5vdGljZShcIkhpZ2hsaWdodHMubWQgY3JlYXRlZC5cIik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgaW5zZXJ0QWZ0ZXJZYW1sT3JIMSB9IGZyb20gXCIuLi9saWIvbWRVdGlsc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZEV4dHJhY3RSZWRIaWdobGlnaHRzKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgaWYgKCFmaWxlKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7IHJldHVybjsgfVxuICBjb25zdCBzcmMgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcblxuICBjb25zdCBtYXJrUmVnZXggPSBuZXcgUmVnRXhwKGA8bWFya1xcXFxzK3N0eWxlPVtcIiddJHtzZXR0aW5ncy5yZWRNYXJrQ3NzLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXFxcXVxcXFxcXFxcXS9nLCBcIlxcXFwkJlwiKX1bXCInXT4oLio/KTwvbWFyaz5gLCBcImdcIik7XG4gIGNvbnN0IGhpdHM6IHN0cmluZ1tdID0gW107XG4gIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICB3aGlsZSAoKG0gPSBtYXJrUmVnZXguZXhlYyhzcmMpKSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHRleHQgPSBtWzFdLnRyaW0oKTtcbiAgICBpZiAodGV4dCAmJiAhaGl0cy5pbmNsdWRlcyh0ZXh0KSkgaGl0cy5wdXNoKHRleHQpO1xuICB9XG5cbiAgaWYgKCFoaXRzLmxlbmd0aCkgeyBuZXcgTm90aWNlKFwiTm8gcmVkIGhpZ2hsaWdodHMgZm91bmQuXCIpOyByZXR1cm47IH1cblxuICBjb25zdCBzZWN0aW9uID0gW1xuICAgIFwiPiBbIXN1bW1hcnldLSBIaWdobGlnaHRzXCIsXG4gICAgLi4uaGl0cy5tYXAoaCA9PiBgPiAtICR7aH1gKSxcbiAgICBcIlwiXG4gIF0uam9pbihcIlxcblwiKTtcblxuICBjb25zdCBtZXJnZWQgPSBpbnNlcnRBZnRlcllhbWxPckgxKHNyYywgc2VjdGlvbik7XG4gIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgbWVyZ2VkKTtcbiAgbmV3IE5vdGljZShcIkhpZ2hsaWdodHMgc2VjdGlvbiBpbnNlcnRlZC5cIik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZE91dGxpbmVFeHRyYWN0b3IoYXBwOiBBcHAsIF9zZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgaWYgKCFmaWxlKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IG9yaWdpbmFsID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIGNvbnN0IGxpbmVzID0gb3JpZ2luYWwuc3BsaXQoL1xccj9cXG4vKTtcblxuICBjb25zdCBvdXRsaW5lTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgLy8gRVhBQ1QgcmVnZXggYXMgUHl0aG9uOiBvbmUgc3BhY2UgYWZ0ZXIgdGhlIGhhc2hlc1xuICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBtID0gbGluZS5tYXRjaCgvXigjezIsNn0pICguKykvKTtcbiAgICBpZiAobSkge1xuICAgICAgY29uc3QgaGFzaGVzID0gbVsxXTtcbiAgICAgIGxldCBjb250ZW50ID0gbVsyXTtcbiAgICAgIGNvbnN0IGxldmVsID0gaGFzaGVzLmxlbmd0aCAtIDI7IC8vICMjIC0+IDAsICMjIyAtPiAxLCBldGMuXG4gICAgICBjb25zdCBpbmRlbnQgPSBcIlxcdFwiLnJlcGVhdChNYXRoLm1heCgwLCBsZXZlbCAtIDEpKTtcbiAgICAgIGlmIChsZXZlbCA9PT0gMCkgY29udGVudCA9IGAqKiR7Y29udGVudH0qKmA7XG4gICAgICBvdXRsaW5lTGluZXMucHVzaChgJHtpbmRlbnR9JHtjb250ZW50fWApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChvdXRsaW5lTGluZXMubGVuZ3RoID09PSAwKSB7XG4gICAgbmV3IE5vdGljZShcIk5vIGhlYWRpbmdzICgjIy4uIyMjIyMjKSBmb3VuZC5cIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gQ2hlY2sgbGFzdCA0IGxpbmVzIGZvciBcInxOZXh0XV1cIiBvciBcInxQcmV2aW91c11dXCJcbiAgbGV0IGluc2VydEluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgY29uc3QgbG9va2JhY2sgPSBNYXRoLm1pbig0LCBsaW5lcy5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMTsgaSA8PSBsb29rYmFjazsgaSsrKSB7XG4gICAgY29uc3QgbG4gPSBsaW5lc1tsaW5lcy5sZW5ndGggLSBpXTtcbiAgICBpZiAoL1xcfE5leHRcXF1cXF18XFx8UHJldmlvdXNcXF1cXF0vLnRlc3QobG4pKSB7XG4gICAgICBpbnNlcnRJbmRleCA9IGxpbmVzLmxlbmd0aCAtIGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBjb25zdCBvdXRsaW5lVGV4dCA9IFwiIyMgT3V0bGluZVxcblwiICsgb3V0bGluZUxpbmVzLmpvaW4oXCJcXG5cIikgKyBcIlxcblxcblwiO1xuXG4gIGlmIChpbnNlcnRJbmRleCAhPT0gbnVsbCkge1xuICAgIC8vIEluc2VydCBiZWZvcmUgdGhlIGZvdW5kIGxpbmUsIHByZXNlcnZpbmcgc3Vycm91bmRpbmcgbmV3bGluZXNcbiAgICBjb25zdCBiZWZvcmVTdHIgPSBsaW5lcy5zbGljZSgwLCBpbnNlcnRJbmRleCkuam9pbihcIlxcblwiKTtcbiAgICBjb25zdCBhZnRlclN0ciA9IGxpbmVzLnNsaWNlKGluc2VydEluZGV4KS5qb2luKFwiXFxuXCIpO1xuICAgIGNvbnN0IG5ld0NvbnRlbnQgPVxuICAgICAgKGJlZm9yZVN0ci5lbmRzV2l0aChcIlxcblwiKSB8fCBiZWZvcmVTdHIubGVuZ3RoID09PSAwID8gXCJcIiA6IFwiXFxuXCIpICtcbiAgICAgIG91dGxpbmVUZXh0ICtcbiAgICAgIGFmdGVyU3RyO1xuICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgYmVmb3JlU3RyICsgbmV3Q29udGVudCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gQXBwZW5kIHRvIGVuZCAobGlrZSBQeXRob24gJ2EnIG1vZGUpXG4gICAgY29uc3QgbmV3Q29udGVudCA9IG9yaWdpbmFsICsgKG9yaWdpbmFsLmVuZHNXaXRoKFwiXFxuXCIpID8gXCJcIiA6IFwiXFxuXCIpICsgb3V0bGluZVRleHQ7XG4gICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBuZXdDb250ZW50KTtcbiAgfVxuXG4gIG5ldyBOb3RpY2UoXCJPdXRsaW5lIGFwcGVuZGVkIHN1Y2Nlc3NmdWxseS5cIik7XG59IiwgImltcG9ydCB7IEFwcCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZvcm1hdE91dGxpbmVUZXh0IH0gZnJvbSBcIi4uL2xpYi9vdXRsaW5lVXRpbHNcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbW1hbmRPdXRsaW5lRm9ybWF0dGVyKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgaWYgKCFmaWxlKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IHNyYyA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuXG4gIGNvbnN0IG91dCA9IGF3YWl0IGZvcm1hdE91dGxpbmVUZXh0KHNyYywge1xuICAgIHNwbGl0SW5saW5lU3VicG9pbnRzOiB0cnVlLCAgIC8vIHNwbGl0cyBcIi4uLiB2LiA5OiBhLiAuLi4gYi4gLi4uXCIsIGJ1dCBOT1Qgb24gXCIuXCJcbiAgICBmaXhIeXBoZW5hdGVkQnJlYWtzOiB0cnVlLCAgICAvLyBmaXhlcyBcImlsbHVzLSB0cmF0ZWRcIiBcdTIxOTIgXCJpbGx1c3RyYXRlZFwiXG4gICAgZHJvcFB1cmVQYWdlTnVtYmVyTGluZXM6IHRydWUgLy8gb3B0aW9uYWw6IGRyb3BzIFwiMTRcIiwgXCIxNVwiLCBcIjE2XCJcbiAgfSwgc2V0dGluZ3MpO1xuXG4gIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgb3V0KTtcbiAgbmV3IE5vdGljZShcIk91dGxpbmUgZm9ybWF0dGVkLlwiKTtcbn0iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBsaW5rVmVyc2VzSW5UZXh0IH0gZnJvbSBcInNyYy9jb21tYW5kcy92ZXJzZUxpbmtzXCI7XG5pbXBvcnQgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwic3JjL3NldHRpbmdzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3V0bGluZUZvcm1hdE9wdGlvbnMge1xuICBzcGxpdElubGluZVN1YnBvaW50cz86IGJvb2xlYW47ICAgICAgIC8vIGRlZmF1bHQ6IHRydWVcbiAgZml4SHlwaGVuYXRlZEJyZWFrcz86IGJvb2xlYW47ICAgICAgICAvLyBkZWZhdWx0OiB0cnVlXG4gIGRyb3BQdXJlUGFnZU51bWJlckxpbmVzPzogYm9vbGVhbjsgICAgLy8gZGVmYXVsdDogZmFsc2VcbiAgb3V0cHV0TGluZVNlcGFyYXRvcj86IHN0cmluZzsgICAgICAgICAvLyBkZWZhdWx0OiBcIlxcblwiXG59XG5cbi8qKiAtLS0tLSBIZWxwZXJzIChkZWxpbWl0ZXItYXdhcmUgKyBQeXRob24gcGFyaXR5KSAtLS0tLSAqL1xuXG5mdW5jdGlvbiByb21hblRvSW50KHJvbWFuOiBzdHJpbmcpOiBudW1iZXIge1xuICBjb25zdCBtYXA6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7IEk6MSwgVjo1LCBYOjEwLCBMOjUwLCBDOjEwMCwgRDo1MDAsIE06MTAwMCB9O1xuICBsZXQgcmVzdWx0ID0gMCwgcHJldiA9IDA7XG4gIGZvciAobGV0IGkgPSByb21hbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGNvbnN0IHZhbCA9IG1hcFtyb21hbltpXV07XG4gICAgaWYgKCF2YWwpIHJldHVybiBOYU47XG4gICAgcmVzdWx0ICs9IHZhbCA8IHByZXYgPyAtdmFsIDogdmFsO1xuICAgIHByZXYgPSB2YWw7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbmNvbnN0IGlzUm9tYW4gPSAoczogc3RyaW5nKSA9PiAvXltJVlhMQ0RNXSskLy50ZXN0KHMpO1xuY29uc3QgaXNBbHBoYVVwcGVyID0gKHM6IHN0cmluZykgPT4gL15bQS1aXSQvLnRlc3Qocyk7XG5cbmZ1bmN0aW9uIGdldE1kUHJlZml4RnJvbUxldmVsKGxldmVsOiBudW1iZXIgfCBcImJ1bGxldFwiKTogc3RyaW5nIHtcbiAgc3dpdGNoIChsZXZlbCkge1xuICAgIGNhc2UgMjogcmV0dXJuIFwiIyNcIjsgICAgICAvLyBSb21hblxuICAgIGNhc2UgMzogcmV0dXJuIFwiIyMjXCI7ICAgICAvLyBBLlxuICAgIGNhc2UgNDogcmV0dXJuIFwiIyMjI1wiOyAgICAvLyAxLlxuICAgIGNhc2UgNTogcmV0dXJuIFwiIyMjIyNcIjsgICAvLyBhLlxuICAgIGNhc2UgNjogcmV0dXJuIFwiIyMjIyMjXCI7ICAvLyAoMSkgb3IgMSlcbiAgICBkZWZhdWx0OiByZXR1cm4gXCIjIyMjIyNcIjsgLy8gYnVsbGV0IGZhbGxiYWNrXG4gIH1cbn1cblxuLyoqIFRva2VuaXplIGEgaGVhZGluZyBtYXJrZXIgYW5kIGl0cyByZXN0LiBDYXB0dXJlcyBkZWxpbWl0ZXI6IFwiLlwiLCBcIilcIiwgb3IgXCIuKVwiICovXG5mdW5jdGlvbiBwYXJzZUhlYWRpbmdTdGFydChzOiBzdHJpbmcpOiB7IHRva2VuOiBzdHJpbmc7IGxhYmVsOiBzdHJpbmc7IHJlc3Q6IHN0cmluZzsgZGVsaW06IHN0cmluZyB8IG51bGwgfSB8IG51bGwge1xuICBjb25zdCBtID1cbiAgICBzLm1hdGNoKC9eXFxzKig/PHJvbWFuPltJVlhMQ0RNXSspKD88ZGVsaW0+XFwuXFwpfFsuKV0pXFxzKyg/PHJlc3Q+LispJC8pIHx8XG4gICAgcy5tYXRjaCgvXlxccyooPzx1cHBlcj5bQS1aXSkoPzxkZWxpbT5cXC5cXCl8Wy4pXSlcXHMrKD88cmVzdD4uKykkLykgICAgICB8fFxuICAgIHMubWF0Y2goL15cXHMqKD88bnVtPlxcZCspKD88ZGVsaW0+XFwuXFwpfFsuKV0pXFxzKyg/PHJlc3Q+LispJC8pICAgICAgICAgIHx8XG4gICAgcy5tYXRjaCgvXlxccypcXChcXHMqKD88cG51bT5cXGQrKVxccypcXClcXHMrKD88cmVzdD4uKykkLykgICAgICAgICAgICAgICAgICB8fFxuICAgIHMubWF0Y2goL15cXHMqXFwoXFxzKig/PHBsb3c+W2Etel0pXFxzKlxcKVxccysoPzxyZXN0Pi4rKSQvKSAgICAgICAgICAgICAgICB8fFxuICAgIHMubWF0Y2goL15cXHMqKD88bG93PlthLXpdKSg/PGRlbGltPlxcLlxcKXxbLildKVxccysoPzxyZXN0Pi4rKSQvKTtcblxuICBpZiAoIW0pIHJldHVybiBudWxsO1xuICBjb25zdCBnID0gKG0gYXMgYW55KS5ncm91cHMgfHwge307XG4gIGxldCBsYWJlbCA9IFwiXCI7XG4gIGxldCBkZWxpbTogc3RyaW5nIHwgbnVsbCA9IGcuZGVsaW0gPz8gbnVsbDtcblxuICBpZiAoZy5yb21hbikgbGFiZWwgPSBnLnJvbWFuO1xuICBlbHNlIGlmIChnLnVwcGVyKSBsYWJlbCA9IGcudXBwZXI7XG4gIGVsc2UgaWYgKGcubnVtKSBsYWJlbCA9IGcubnVtO1xuICBlbHNlIGlmIChnLnBudW0pIHsgbGFiZWwgPSBgKCR7Zy5wbnVtfSlgOyBkZWxpbSA9IFwiKVwiOyB9XG4gIGVsc2UgaWYgKGcucGxvdykgeyBsYWJlbCA9IGAoJHtnLnBsb3d9KWA7IGRlbGltID0gXCIpXCI7IH1cbiAgZWxzZSBpZiAoZy5sb3cpIGxhYmVsID0gZy5sb3c7XG5cbiAgbGV0IHRva2VuID0gXCJcIjtcbiAgaWYgKGcucm9tYW4pIHRva2VuID0gYCR7Zy5yb21hbn0ke2RlbGltID8/IFwiLlwifWA7XG4gIGVsc2UgaWYgKGcudXBwZXIpIHRva2VuID0gYCR7Zy51cHBlcn0ke2RlbGltID8/IFwiLlwifWA7XG4gIGVsc2UgaWYgKGcubnVtKSB0b2tlbiA9IGAke2cubnVtfSR7ZGVsaW0gPz8gXCIuXCJ9YDtcbiAgZWxzZSBpZiAoZy5wbnVtKSB0b2tlbiA9IGAoJHtnLnBudW19KWA7XG4gIGVsc2UgaWYgKGcucGxvdykgdG9rZW4gPSBgKCR7Zy5wbG93fSlgO1xuICBlbHNlIGlmIChnLmxvdykgdG9rZW4gPSBgJHtnLmxvd30ke2RlbGltID8/IFwiLlwifWA7XG5cbiAgcmV0dXJuIHsgdG9rZW4sIGxhYmVsLCByZXN0OiBnLnJlc3QgfHwgXCJcIiwgZGVsaW0gfTtcbn1cblxuLyoqIERlY2lkZSBsZXZlbCB1c2luZyBkZWxpbWl0ZXIsIHBsdXMgUm9tYW4vQWxwaGEgaGV1cmlzdGljcyAobGlrZSBQeXRob24pICovXG5mdW5jdGlvbiBkZWNpZGVMZXZlbChcbiAgbGFiZWw6IHN0cmluZyxcbiAgZGVsaW06IHN0cmluZyB8IG51bGwsXG4gIHByZXZSb206IHN0cmluZyB8IG51bGwsXG4gIHByZXZBbHBoYUlkeDogbnVtYmVyIHwgbnVsbFxuKTogeyBsZXZlbDogbnVtYmVyIHwgXCJidWxsZXRcIjsgbmV4dFJvbTogc3RyaW5nIHwgbnVsbDsgbmV4dEFscGhhSWR4OiBudW1iZXIgfCBudWxsIH0ge1xuICBpZiAoL15cXChcXGQrXFwpJC8udGVzdChsYWJlbCkpIHtcbiAgICByZXR1cm4geyBsZXZlbDogNiwgbmV4dFJvbTogcHJldlJvbSwgbmV4dEFscGhhSWR4OiBwcmV2QWxwaGFJZHggfTsgICAgICAgICAvLyAoMSlcbiAgfVxuICBpZiAoL15cXChbYS16XStcXCkkLy50ZXN0KGxhYmVsKSkge1xuICAgIHJldHVybiB7IGxldmVsOiBcImJ1bGxldFwiLCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IHByZXZBbHBoYUlkeCB9OyAgLy8gKGEpXG4gIH1cblxuICAvLyAxKSB2cyAxLiB2cyAxLilcbiAgaWYgKC9eXFxkKyQvLnRlc3QobGFiZWwpKSB7XG4gICAgaWYgKGRlbGltID09PSBcIilcIikge1xuICAgICAgcmV0dXJuIHsgbGV2ZWw6IDYsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogcHJldkFscGhhSWR4IH07ICAgICAgIC8vIDEpXG4gICAgfVxuICAgIHJldHVybiB7IGxldmVsOiA0LCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IHByZXZBbHBoYUlkeCB9OyAgICAgICAgIC8vIDEuIC8gMS4pXG4gIH1cblxuICAvLyBSb21hbiB2cyBBbHBoYSBhbWJpZ3VpdHkgKGUuZy4sIEkuKVxuICBpZiAoaXNSb21hbihsYWJlbCkpIHtcbiAgICBjb25zdCByb21WYWwgPSByb21hblRvSW50KGxhYmVsKTtcbiAgICBjb25zdCBmaXRzUm9tYW4gPSAhcHJldlJvbSB8fCByb21hblRvSW50KHByZXZSb20pICsgMSA9PT0gcm9tVmFsO1xuXG4gICAgY29uc3QgYWxwaGFWYWwgPSBpc0FscGhhVXBwZXIobGFiZWwpID8gKGxhYmVsLmNoYXJDb2RlQXQoMCkgLSA2NCkgOiBudWxsOyAvLyBBPTFcbiAgICBjb25zdCBmaXRzQWxwaGEgPSBwcmV2QWxwaGFJZHggPT0gbnVsbCA/IHRydWUgOiAoYWxwaGFWYWwgIT0gbnVsbCAmJiBhbHBoYVZhbCA9PT0gcHJldkFscGhhSWR4ICsgMSk7XG5cbiAgICBpZiAoZml0c1JvbWFuICYmICFmaXRzQWxwaGEpIHtcbiAgICAgIHJldHVybiB7IGxldmVsOiAyLCBuZXh0Um9tOiBsYWJlbCwgbmV4dEFscGhhSWR4OiBwcmV2QWxwaGFJZHggfTsgICAgICAgICAvLyAjI1xuICAgIH0gZWxzZSBpZiAoZml0c0FscGhhICYmICFmaXRzUm9tYW4pIHtcbiAgICAgIHJldHVybiB7IGxldmVsOiAzLCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IGFscGhhVmFsID8/IDEgfTsgICAgICAvLyAjIyNcbiAgICB9IGVsc2UgaWYgKGZpdHNSb21hbiAmJiBmaXRzQWxwaGEpIHtcbiAgICAgIHJldHVybiB7IGxldmVsOiAzLCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IGFscGhhVmFsID8/IDEgfTsgICAgICAvLyBwcmVmZXIgYWxwaGEgYXMgZGVlcGVyXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7IGxldmVsOiAyLCBuZXh0Um9tOiBsYWJlbCwgbmV4dEFscGhhSWR4OiBwcmV2QWxwaGFJZHggfTsgICAgICAgICAvLyBkZWZhdWx0IHRvIFJvbWFuXG4gICAgfVxuICB9XG5cbiAgLy8gQSkgdnMgQS5cbiAgaWYgKGlzQWxwaGFVcHBlcihsYWJlbCkpIHtcbiAgICByZXR1cm4geyBsZXZlbDogMywgbmV4dFJvbTogcHJldlJvbSwgbmV4dEFscGhhSWR4OiBsYWJlbC5jaGFyQ29kZUF0KDApIC0gNjQgfTsgLy8gIyMjXG4gIH1cblxuICAvLyBhKSB2cyBhLlxuICBpZiAoL15bYS16XSQvLnRlc3QobGFiZWwpKSB7XG4gICAgaWYgKGRlbGltID09PSBcIilcIikge1xuICAgICAgcmV0dXJuIHsgbGV2ZWw6IFwiYnVsbGV0XCIsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogcHJldkFscGhhSWR4IH07ICAgIC8vIGEpXG4gICAgfVxuICAgIHJldHVybiB7IGxldmVsOiA1LCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IHByZXZBbHBoYUlkeCB9OyAgICAgICAgICAgICAvLyBhLlxuICB9XG5cbiAgcmV0dXJuIHsgbGV2ZWw6IFwiYnVsbGV0XCIsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogcHJldkFscGhhSWR4IH07XG59XG5cbi8qKiBIeXBoZW4gYnJlYWsgZml4ZXJzICovXG5jb25zdCBIWVBIID0gYC1cXFxcdTAwQURcXFxcdTIwMTBcXFxcdTIwMTFcXFxcdTIwMTJcXFxcdTIwMTNcXFxcdTIwMTRgOyAvLyAtLCBzb2Z0IGh5cGhlbiwgXHUyMDEwLCAtLCBcdTIwMTIsIFx1MjAxMywgXHUyMDE0XG5jb25zdCBJTkxJTkVfSFlQSEVOX0JSRUFLX1JFID0gbmV3IFJlZ0V4cChgKFtBLVphLXpcdTAwQzAtXHUwMEQ2XHUwMEQ4LVx1MDBGNlx1MDBGOC1cdTAwRkZdKVske0hZUEh9XVxcXFxzKyhbYS16XHUwMEUwLVx1MDBGNlx1MDBGOC1cdTAwRkZdKWAsIFwiZ1wiKTtcbmNvbnN0IFRSQUlMSU5HX0hZUEhFTl9BVF9FTkRfUkUgPSBuZXcgUmVnRXhwKGBbQS1aYS16XHUwMEMwLVx1MDBENlx1MDBEOC1cdTAwRjZcdTAwRjgtXHUwMEZGXVske0hZUEh9XVxcXFxzKiRgKTtcbmZ1bmN0aW9uIGZpeElubGluZUh5cGhlbnMoczogc3RyaW5nKTogc3RyaW5nIHsgcmV0dXJuIHMucmVwbGFjZShJTkxJTkVfSFlQSEVOX0JSRUFLX1JFLCBcIiQxJDJcIik7IH1cbmZ1bmN0aW9uIGFwcGVuZFdpdGhXb3JkQnJlYWtGaXgoYnVmOiBzdHJpbmcsIG5leHQ6IHN0cmluZywgZml4OiBib29sZWFuKTogc3RyaW5nIHtcbiAgaWYgKGZpeCkge1xuICAgIGlmIChUUkFJTElOR19IWVBIRU5fQVRfRU5EX1JFLnRlc3QoYnVmKSAmJiAvXlthLXpcdTAwRTAtXHUwMEY2XHUwMEY4LVx1MDBGRl0vLnRlc3QobmV4dCkpIHtcbiAgICAgIHJldHVybiBidWYucmVwbGFjZShuZXcgUmVnRXhwKGBbJHtIWVBIfV1cXFxccyokYCksIFwiXCIpICsgbmV4dDtcbiAgICB9XG4gICAgY29uc3Qgam9pbmVkID0gKGJ1ZiArIFwiIFwiICsgbmV4dCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG4gICAgcmV0dXJuIGZpeElubGluZUh5cGhlbnMoam9pbmVkKTtcbiAgfVxuICByZXR1cm4gKGJ1ZiArIFwiIFwiICsgbmV4dCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG59XG5cbi8qKiAtLS0gU3BsaXQgaGVscGVycyAobm93IHdpdGggXHUyMDE4cHJvdGVjdGVkXHUyMDE5IHZlcnNlICYgUy4gUy4gc3BhbnMpIC0tLSAqL1xuY29uc3QgVE9LRU5fU1RBUlRfU1JDID0gU3RyaW5nLnJhd2AoPzpbSVZYTENETV0rWy4pXXxbQS1aXVsuKV18W2Etel1bLildfFxcZCtbLildfCRiZWdpbjptYXRoOnRleHQkW2EtekEtWjAtOV0rJGVuZDptYXRoOnRleHQkKWA7XG5cbmNvbnN0IEFGVEVSX1BVTkNUX1NQTElUX1JFID0gbmV3IFJlZ0V4cChcbiAgU3RyaW5nLnJhd2AoWzo7IT8pXXxcdTIwMTRcXHMqdlxcLlxccypcXGQrW2Etel0/OilcXHMrKD89YCArIFRPS0VOX1NUQVJUX1NSQyArIFN0cmluZy5yYXdgXFxzKylgLFxuICBcImdpXCJcbik7XG5cbi8vIE9ubHkgcHJvdGVjdCB2ZXJzZSBtYXJrZXJzIGFuZCBcdTIwMUNTLiBTLlx1MjAxRDsgYWxsIG90aGVyIG9uZS1sZXR0ZXIgYWJicmV2cyBjYW4gc3BsaXQuXG5jb25zdCBBRlRFUl9TRU5UX1RPS0VOX1NQTElUX1JFID0gbmV3IFJlZ0V4cChcbiAgU3RyaW5nLnJhd2AoPzwhXFxiW3ZWXVt2Vl1cXC4pKD88IVxcYlt2Vl1cXC4pKD88IVxcYlNcXC5cXHMqUylcXC5cXHMrKD89YCArIFRPS0VOX1NUQVJUX1NSQyArIFN0cmluZy5yYXdgXFxzKylgLFxuICBcImdcIlxuKTtcblxuLy8gUHJlLXByb3RlY3QgXCJ2LiA3XCIsIFwidnYuIDctOVwiIGFuZCBcIlMuIFMuXCIgc28gc3BsaXR0ZXJzIGNhblx1MjAxOXQgY3V0IHRoZW0uXG4vLyBVc2VzIGEgcHJpdmF0ZS11c2Ugc2VudGluZWwgZm9yIHRoZSBwcm90ZWN0ZWQgc3BhY2UuXG5jb25zdCBTRU5USU5FTCA9IFwiXFx1RTAwMFwiO1xuZnVuY3Rpb24gcHJvdGVjdFNwYW5zKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vIHYuIDdbbGV0dGVyXT9cbiAgcyA9IHMucmVwbGFjZSgvXFxiKFt2Vl0pXFwuXFxzKyhcXGQrW2Etel0/KSg/PVteXFxkXXwkKS9nLCAoX20sIHYsIG4pID0+IGAke3Z9LmAgKyBTRU5USU5FTCArIG4pO1xuICAvLyB2di4gNy05IC8gVlYuIDdcdTIwMTM5IGV0Yy5cbiAgcyA9IHMucmVwbGFjZSgvXFxiKFt2Vl0pKFt2Vl0pXFwuXFxzKyhcXGQrW2Etel0/KShcXHMqWy1cdTIwMTNcdTIwMTRdXFxzKlxcZCtbYS16XT8pPy9nLFxuICAgIChfbSwgdjEsIHYyLCBhLCBybmcpID0+IGAke3YxfSR7djJ9LmAgKyBTRU5USU5FTCArIGEgKyAocm5nID8/IFwiXCIpXG4gICk7XG4gIC8vIFMuIFMuXG4gIHMgPSBzLnJlcGxhY2UoL1xcYlNcXC5cXHMqU1xcLi9nLCBtID0+IG0ucmVwbGFjZSgvXFxzKy8sIFNFTlRJTkVMKSk7XG4gIHJldHVybiBzO1xufVxuZnVuY3Rpb24gdW5wcm90ZWN0U3BhbnMoczogc3RyaW5nKTogc3RyaW5nIHsgcmV0dXJuIHMucmVwbGFjZShuZXcgUmVnRXhwKFNFTlRJTkVMLCBcImdcIiksIFwiIFwiKTsgfVxuXG5mdW5jdGlvbiBzcGxpdElubGluZVNlZ21lbnRzKGxpbmU6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgbGV0IHMgPSBwcm90ZWN0U3BhbnMobGluZSk7XG4gIHMgPSBzLnJlcGxhY2UoQUZURVJfUFVOQ1RfU1BMSVRfUkUsIChfbSwgcDE6IHN0cmluZykgPT4gYCR7cDF9XFxuYCk7XG4gIHMgPSBzLnJlcGxhY2UoQUZURVJfU0VOVF9UT0tFTl9TUExJVF9SRSwgXCIuXFxuXCIpO1xuICBzID0gdW5wcm90ZWN0U3BhbnMocyk7XG4gIHJldHVybiBzLnNwbGl0KFwiXFxuXCIpLm1hcCh4ID0+IHgudHJpbSgpKS5maWx0ZXIoQm9vbGVhbik7XG59XG5cbi8qKiAtLS0tLSBNYWluIGZvcm1hdHRlciAoZGVsaW1pdGVyLWF3YXJlLCB2ZXJzZS1zYWZlKSAtLS0tLSAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZvcm1hdE91dGxpbmVUZXh0KFxuICB0ZXh0T3JMaW5lczogc3RyaW5nIHwgc3RyaW5nW10sXG4gIHtcbiAgICBzcGxpdElubGluZVN1YnBvaW50cyA9IHRydWUsXG4gICAgZml4SHlwaGVuYXRlZEJyZWFrcyA9IHRydWUsXG4gICAgb3V0cHV0TGluZVNlcGFyYXRvciA9IFwiXFxuXCIsXG4gICAgZHJvcFB1cmVQYWdlTnVtYmVyTGluZXMgPSBmYWxzZVxuICB9OiBPdXRsaW5lRm9ybWF0T3B0aW9ucyA9IHt9LFxuICBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICAvLyBCdWlsZCBhIHJhdyBzdHJpbmcgc28gd2UgY2FuIHByZS1oYWNrIHRoZSB2ZXJ5IGZpcnN0IFwiIEkuIFwiXG4gIGxldCByYXcgPSBBcnJheS5pc0FycmF5KHRleHRPckxpbmVzKSA/IHRleHRPckxpbmVzLmpvaW4oXCJcXG5cIikgOiB0ZXh0T3JMaW5lcztcblxuICAvLyBIQVJEIFBBVENIOiBJbiB0aGUgZmlyc3QgMjAwMCBjaGFycyBvbmx5LCBpbnNlcnQgYSBuZXdsaW5lIGJlZm9yZSB0aGUgZmlyc3Qgc3RhbmRhbG9uZSBcIiBJLiBcIlxuICAvLyAtIE5vdCBwcmVjZWRlZCBieSBhIGxldHRlci9udW1iZXIgKHNvIG5vdCBcIklJLlwiKVxuICAvLyAtIEZvbGxvd2VkIGJ5IGEgY2FwaXRhbCAoc3RhcnQgb2YgYSBzZW50ZW5jZS9oZWFkaW5nKVxuICAvLyAtIERvIG5vdCB0b3VjaCBcIlMuIFMuXCJcbiAge1xuICAgIGNvbnN0IGhlYWQgPSByYXcuc2xpY2UoMCwgMjAwMCk7XG4gICAgY29uc3QgdGFpbCA9IHJhdy5zbGljZSgyMDAwKTtcblxuICAgIC8vIG9uZS10aW1lIHJlcGxhY2UgKG5vIC9nLylcbiAgICBjb25zdCBoZWFkUGF0Y2hlZCA9IGhlYWQucmVwbGFjZShcbiAgICAgIC8oXnxbXkEtWmEtejAtOV0pSVxcLlxccysoPz1bQS1aXSkoPyFcXHMqU1xcLikvbSxcbiAgICAgIChfbSwgcHJlKSA9PiBgJHtwcmV9XFxuSS4gYFxuICAgICk7XG5cbiAgICByYXcgPSBoZWFkUGF0Y2hlZCArIHRhaWw7XG4gIH1cblxuICAvLyBub3cgcHJvY2VlZCB3aXRoIG5vcm1hbCBsaW5lIHNwbGl0dGluZyB1c2luZyB0aGUgcGF0Y2hlZCB0ZXh0XG4gIGNvbnN0IGxpbmVzID0gcmF3LnNwbGl0KC9cXHI/XFxuLyk7XG5cbiAgLy8gY29uc3QgbGluZXMgPSBBcnJheS5pc0FycmF5KHRleHRPckxpbmVzKSA/IHRleHRPckxpbmVzLnNsaWNlKCkgOiB0ZXh0T3JMaW5lcy5zcGxpdCgvXFxyP1xcbi8pO1xuXG4gIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgbGV0IGJ1ZiA9IFwiXCI7XG4gIGxldCBwcmV2Um9tYW46IHN0cmluZyB8IG51bGwgPSBudWxsOyAgICAgLy8gcHJldmlvdXMgUm9tYW4gbGFiZWwgKEksIElJLCBcdTIwMjYpXG4gIGxldCBwcmV2QWxwaGFJZHg6IG51bWJlciB8IG51bGwgPSBudWxsOyAgLy8gcHJldmlvdXMgQWxwaGEgaW5kZXggKEE9MSwgQj0yLCBcdTIwMjYpXG5cbiAgY29uc3QgZW1pdEJ1ZmZlciA9IChyYXc6IHN0cmluZykgPT4ge1xuICAgIGxldCBiYXNlID0gcmF3LnRyaW0oKTtcbiAgICBpZiAoIWJhc2UpIHJldHVybjtcblxuICAgIGlmICghc3BsaXRJbmxpbmVTdWJwb2ludHMpIHtcbiAgICAgIG91dC5wdXNoKGJhc2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBwYXJ0cyA9IHNwbGl0SW5saW5lU2VnbWVudHMoYmFzZSlcbiAgICAgIC5tYXAoc2VnID0+IHNlZy5yZXBsYWNlKC9eXFxkezEsM31cXHMrW0EtWl1bQS1aXSsoPzpbIC1dW0EtWl1bQS1aXSspKi8sIFwiXCIpLnRyaW0oKSkgLy8gY29uc2VydmF0aXZlIGhlYWRlciBzY3J1YlxuICAgICAgLmZpbHRlcihCb29sZWFuKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBwYXJ0ID0gcGFydHNbaV07XG4gICAgICBpZiAoZml4SHlwaGVuYXRlZEJyZWFrcykgcGFydCA9IGZpeElubGluZUh5cGhlbnMocGFydCk7XG5cbiAgICAgIGxldCBwYXJzZWQgPSBwYXJzZUhlYWRpbmdTdGFydChwYXJ0KTtcbiAgICAgIGlmICghcGFyc2VkKSB7XG4gICAgICAgIG91dC5wdXNoKHBhcnQpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgeyB0b2tlbiwgbGFiZWwsIHJlc3QsIGRlbGltIH0gPSBwYXJzZWQ7XG4gICAgICBjb25zdCB7IGxldmVsLCBuZXh0Um9tLCBuZXh0QWxwaGFJZHggfSA9IGRlY2lkZUxldmVsKGxhYmVsLnJlcGxhY2UoL1suKV0kLywgXCJcIiksIGRlbGltLCBwcmV2Um9tYW4sIHByZXZBbHBoYUlkeCk7XG4gICAgICBwcmV2Um9tYW4gPSBuZXh0Um9tO1xuICAgICAgcHJldkFscGhhSWR4ID0gbmV4dEFscGhhSWR4O1xuXG4gICAgICBpZiAobGV2ZWwgPT09IFwiYnVsbGV0XCIpIHtcbiAgICAgICAgb3V0LnB1c2goYCR7Z2V0TWRQcmVmaXhGcm9tTGV2ZWwobGV2ZWwpfSAqICR7dG9rZW59ICR7cmVzdH1gLnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcmVmaXggPSBnZXRNZFByZWZpeEZyb21MZXZlbChsZXZlbCk7XG4gICAgICAgIG91dC5wdXNoKGAke3ByZWZpeH0gJHt0b2tlbn0gJHtyZXN0fWAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZm9yIChsZXQgcmF3IG9mIGxpbmVzKSB7XG4gICAgbGV0IGxpbmUgPSByYXcudHJpbSgpO1xuICAgIGlmICghbGluZSkgY29udGludWU7XG4gICAgaWYgKGRyb3BQdXJlUGFnZU51bWJlckxpbmVzICYmIC9eXFxkKyQvLnRlc3QobGluZSkpIGNvbnRpbnVlO1xuICAgIGlmIChmaXhIeXBoZW5hdGVkQnJlYWtzKSBsaW5lID0gZml4SW5saW5lSHlwaGVucyhsaW5lKTtcblxuICAgIC8vIElmIHByZXZpb3VzIGJ1ZmZlciBlbmRzIHdpdGggdmVyc2UgbWFya2VyLCBhIGxlYWRpbmcgbnVtYmVyIGlzIGEgdmVyc2UgXHUyMDE0IG5vdCBhIG5ldyBoZWFkaW5nLlxuICAgIGxldCBwYXJzZWQgPSBwYXJzZUhlYWRpbmdTdGFydChsaW5lKTtcbiAgICBjb25zdCBwcmV2RW5kc1dpdGhWZXJzZSA9IC9cXGJbdlZdezEsMn1cXC5cXHMqJC8udGVzdChidWYpO1xuICAgIGlmIChwYXJzZWQgJiYgL15cXGQrJC8udGVzdChwYXJzZWQubGFiZWwpICYmIHByZXZFbmRzV2l0aFZlcnNlKSB7XG4gICAgICBwYXJzZWQgPSBudWxsOyAvLyB0cmVhdCBhcyBjb250aW51YXRpb25cbiAgICB9XG5cbiAgICBpZiAocGFyc2VkKSB7XG4gICAgICBpZiAoYnVmKSBlbWl0QnVmZmVyKGJ1Zik7XG4gICAgICBidWYgPSBcIlwiO1xuXG4gICAgICBjb25zdCB7IHRva2VuLCBsYWJlbCwgcmVzdCwgZGVsaW0gfSA9IHBhcnNlZDtcbiAgICAgIGNvbnN0IHsgbGV2ZWwsIG5leHRSb20sIG5leHRBbHBoYUlkeCB9ID0gZGVjaWRlTGV2ZWwobGFiZWwsIGRlbGltLCBwcmV2Um9tYW4sIHByZXZBbHBoYUlkeCk7XG4gICAgICBwcmV2Um9tYW4gPSBuZXh0Um9tO1xuICAgICAgcHJldkFscGhhSWR4ID0gbmV4dEFscGhhSWR4O1xuXG4gICAgICBpZiAobGV2ZWwgPT09IFwiYnVsbGV0XCIpIHtcbiAgICAgICAgYnVmID0gYCR7Z2V0TWRQcmVmaXhGcm9tTGV2ZWwobGV2ZWwpfSAqICR7dG9rZW59ICR7cmVzdH1gLnRyaW0oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4RnJvbUxldmVsKGxldmVsKTtcbiAgICAgICAgYnVmID0gYCR7cHJlZml4fSAke3Rva2VufSAke3Jlc3R9YC50cmltKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ1ZiA9IGJ1ZiA/IGFwcGVuZFdpdGhXb3JkQnJlYWtGaXgoYnVmLCBsaW5lLCBmaXhIeXBoZW5hdGVkQnJlYWtzKSA6IGxpbmU7XG4gICAgfVxuICB9XG5cbiAgaWYgKGJ1ZikgZW1pdEJ1ZmZlcihidWYpO1xuICBsZXQgcmVzdWx0ID0gb3V0LmpvaW4ob3V0cHV0TGluZVNlcGFyYXRvcik7XG5cbiAgLy8gaW5zZXJ0IHZlcnNlIGxpbmtzIHVzaW5nIGxpbmtWZXJzZXNJblRleHRcbiAgaWYgKHNldHRpbmdzLmF1dG9MaW5rVmVyc2VzKSB7XG4gICAgcmVzdWx0ID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChyZXN1bHQsIHNldHRpbmdzKTtcbiAgfVxuXG4gIG5ldyBOb3RpY2UoXCJPdXRsaW5lIGZvcm1hdHRlZFwiICsgKHNldHRpbmdzLmF1dG9MaW5rVmVyc2VzID8gXCIgKyB2ZXJzZXMgbGlua2VkLlwiIDogXCIuXCIpKTtcblxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8vIGV4cG9ydCBpbnRlcmZhY2UgT3V0bGluZUZvcm1hdE9wdGlvbnMge1xuLy8gICAvKiogU3BsaXQgaW5saW5lIHN1YnBvaW50cyBsaWtlIFwiYS4gXHUyMDI2IGIuIFx1MjAyNiAoMSkgXHUyMDI2XCIgQUZURVIgY29sb24vc2VtaWNvbG9uIG9yIFwiXHUyMDE0di4gOTpcIiwgYW5kIGFsc28gYWZ0ZXIgc2VudGVuY2UtZW5kaW5nIFwiLlwiIGJlZm9yZSBhIG5ldyB0b2tlbiAqL1xuLy8gICBzcGxpdElubGluZVN1YnBvaW50cz86IGJvb2xlYW47ICAgICAgIC8vIGRlZmF1bHQ6IHRydWVcbi8vICAgLyoqIEZpeCBcImh5cGhlbiArIGxpbmUgYnJlYWtcIiB3b3JkIHNwbGl0cyB3aGVuIG1lcmdpbmcgbGluZXMgKGlsbHVzLSB0cmF0ZWQgXHUyMTkyIGlsbHVzdHJhdGVkKSAqL1xuLy8gICBmaXhIeXBoZW5hdGVkQnJlYWtzPzogYm9vbGVhbjsgICAgICAgIC8vIGRlZmF1bHQ6IHRydWVcbi8vICAgLyoqIERyb3AgbGluZXMgdGhhdCBhcmUgb25seSBhIHBhZ2UgbnVtYmVyIChlLmcuLCBcIjE0XCIpIGJlZm9yZSBtZXJnaW5nICovXG4vLyAgIGRyb3BQdXJlUGFnZU51bWJlckxpbmVzPzogYm9vbGVhbjsgICAgLy8gZGVmYXVsdDogZmFsc2Vcbi8vIH1cblxuLy8gLyoqIFN0cmljdCBwb3J0ICsgc2FmZSBpbXByb3ZlbWVudHMgKi9cbi8vIGV4cG9ydCBmdW5jdGlvbiBmb3JtYXRPdXRsaW5lVGV4dCh0ZXh0OiBzdHJpbmcsIG9wdHM6IE91dGxpbmVGb3JtYXRPcHRpb25zID0ge30pOiBzdHJpbmcge1xuLy8gICBjb25zdCB7XG4vLyAgICAgc3BsaXRJbmxpbmVTdWJwb2ludHMgPSB0cnVlLFxuLy8gICAgIGZpeEh5cGhlbmF0ZWRCcmVha3MgPSB0cnVlLFxuLy8gICAgIGRyb3BQdXJlUGFnZU51bWJlckxpbmVzID0gZmFsc2UsXG4vLyAgIH0gPSBvcHRzO1xuXG4vLyAgIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgvXFxyP1xcbi8pO1xuLy8gICBjb25zdCBvdXRwdXQ6IHN0cmluZ1tdID0gW107XG4vLyAgIGxldCBidWZmZXIgPSBcIlwiO1xuXG4vLyAgIGNvbnN0IGlzSGVhZGluZyA9IChsaW5lOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbi8vICAgICBjb25zdCBzID0gbGluZS50cmltKCk7XG4vLyAgICAgLy8gUm9tYW4gKEkuLCBJSS4sIFx1MjAyNiksIFVwcGVyY2FzZSAoQS4pLCBEZWNpbWFsICgxLiksIFBhcmVuICgoYSksICgxKSlcbi8vICAgICByZXR1cm4gL14oKEl7MSwzfXxJVnxWfFZJfFZJSXxWSUlJfElYfFh8WEl8WElJfFhJSUl8WElWfFhWKVtcXC5cXCldfFtBLVpdW1xcLlxcKV18XFxkK1xcLltcXCldP3xcXChbYS16QS1aMC05XStcXCkpLy50ZXN0KHMpO1xuLy8gICB9O1xuXG4vLyAgIGNvbnN0IGdldE1kUHJlZml4ID0gKGl0ZW06IHN0cmluZyk6IHN0cmluZyA9PiB7XG4vLyAgICAgaWYgKC9eKD86W0lWWExDRE1dKylbXFwuXFwpXS9pLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjXCI7ICAgLy8gUm9tYW5cbi8vICAgICBpZiAoL15cXHMqW0EtWl1bXFwuXFwpXS8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyMjI1wiOyAgICAgICAgLy8gQS5cbi8vICAgICBpZiAoL15cXHMqXFxkK1xcLi8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyMjIyNcIjsgICAgICAgICAgICAgLy8gMS5cbi8vICAgICBpZiAoL15cXHMqW2Etel1cXC4vLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjIyMjI1wiOyAgICAgICAgICAvLyBhLlxuLy8gICAgIGlmICgvXlxccypcXChcXGQrXFwpLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCJcIjsgICAgICAgICAgICAgICAgLy8gKDEpXG4vLyAgICAgaWYgKC9eXFxzKlxcKFthLXpdXFwpLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCJcIjsgICAgICAgICAgICAgIC8vIChhKVxuLy8gICAgIHJldHVybiBcIlwiO1xuLy8gICB9O1xuXG4vLyAgIC8vIC0tLS0gSHlwaGVuYXRlZCB3b3JkIHdyYXAgam9pbiAoXHUyMDI2IFwiaWxsdXMtXCIgKyBcInRyYXRlZFwiID0+IFwiaWxsdXN0cmF0ZWRcIilcbi8vICAgY29uc3QgVFJBSUxJTkdfSFlQSEVOX0FUX0VORCA9IC9bQS1aYS16XVtcXC1cXHUyMDEwXFx1MjAxMVxcdTIwMTJcXHUyMDEzXFx1MjAxNF1cXHMqJC87XG4vLyAgIGNvbnN0IGFwcGVuZFdpdGhXb3JkQnJlYWtGaXggPSAoYnVmOiBzdHJpbmcsIG5leHQ6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4vLyAgICAgaWYgKGZpeEh5cGhlbmF0ZWRCcmVha3MgJiYgVFJBSUxJTkdfSFlQSEVOX0FUX0VORC50ZXN0KGJ1ZikgJiYgL15bYS16XS8udGVzdChuZXh0KSkge1xuLy8gICAgICAgcmV0dXJuIGJ1Zi5yZXBsYWNlKC9bXFwtXFx1MjAxMFxcdTIwMTFcXHUyMDEyXFx1MjAxM1xcdTIwMTRdXFxzKiQvLCBcIlwiKSArIG5leHQ7XG4vLyAgICAgfVxuLy8gICAgIHJldHVybiAoYnVmICsgXCIgXCIgKyBuZXh0KS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKTtcbi8vICAgfTtcblxuLy8gICAvLyAtLS0tIE5vcm1hbGl6ZSBkaXZpZGVyIGRhc2hlcyBiZWZvcmUgdmVyc2UgcmVmcyB0byBhIHRpZ2h0IGVtLWRhc2g6IFwiXHUyMDE0XCIgKG5vIHNwYWNlcylcbi8vICAgZnVuY3Rpb24gbm9ybWFsaXplUmVmRGFzaGVzKHM6IHN0cmluZyk6IHN0cmluZyB7XG4vLyAgICAgLy8gYmVmb3JlIFwidi4gOVwiLCBcInYuIDk6XCIsIGV0Yy5cbi8vICAgICBzID0gcy5yZXBsYWNlKC8oXFxTKVxccypbXFwtXFx1MjAxMFxcdTIwMTFcXHUyMDEyXFx1MjAxM1xcdTIwMTRdXFxzKih2XFwuXFxzKlxcZCtbYS16XT86PykvZ2ksIFwiJDFcdTIwMTQkMlwiKTtcbi8vICAgICAvLyBiZWZvcmUgYm9vaytyZWZlcmVuY2UgbGlrZSBcIlMuIFMuIDQ6MTFhXCIsIFwiQ29sLiAxOjEyXCIsIFwiMSBKb2huIDE6NVwiXG4vLyAgICAgcyA9IHMucmVwbGFjZShcbi8vICAgICAgIC8oXFxTKVxccypbXFwtXFx1MjAxMFxcdTIwMTFcXHUyMDEyXFx1MjAxM1xcdTIwMTRdXFxzKigoWzEtM10/XFxzPyg/OltBLVpdW2EtekEtWl0qXFwuP3xbQS1aXVxcLikpKD86XFxzK1sxLTNdP1xccz8oPzpbQS1aXVthLXpBLVpdKlxcLj98W0EtWl1cXC4pKSpcXHMrXFxkKzpcXGQrW2Etel0/KS9nLFxuLy8gICAgICAgXCIkMVx1MjAxNCQyXCJcbi8vICAgICApO1xuLy8gICAgIHJldHVybiBzO1xuLy8gICB9XG5cbi8vICAgLy8gLS0tLSBTcGxpdCBpbmxpbmUgc3VicG9pbnRzICgxKSBhZnRlciA6LDsgb3IgZW0tZGFzaCBiZWZvcmUgXCJ2LiA5OlwiICAoMikgYWZ0ZXIgc2VudGVuY2UgXCIuXCIgd2hlbiBhIG5ldyB0b2tlbiBzdGFydHNcbi8vICAgLy8gS2VlcCBhYmJyZXZpYXRpb25zIGxpa2UgXCJTLiBTLlwiIGJ5IGZvcmJpZGRpbmcgc3BsaXQgd2hlbiBkb3QgaXMgcGFydCBvZiBhIG9uZS1sZXR0ZXIgYWJicmV2OiAoPzwhXFxiW0EtWmEtel1cXC4pXG4vLyAgIGNvbnN0IFRPS0VOX1NUQVJUX1NSQyA9IFN0cmluZy5yYXdgKD86W0lWWExDRE1dK1xcLnxbQS1aXVxcLnxbYS16XVxcLnxcXGQrXFwufCRiZWdpbjptYXRoOnRleHQkW2EtekEtWjAtOV0rJGVuZDptYXRoOnRleHQkKWA7XG4vLyAgIGNvbnN0IEFGVEVSX1BVTkNUX1NQTElUX1JFID0gbmV3IFJlZ0V4cChcbi8vICAgICBTdHJpbmcucmF3YChbOjshP118XHUyMDE0XFxzKnZcXC5cXHMqXFxkK1thLXpdPzopXFxzKyg/PWAgKyBUT0tFTl9TVEFSVF9TUkMgKyBTdHJpbmcucmF3YFxccyspYCxcbi8vICAgICBcImdpXCJcbi8vICAgKTtcbi8vICAgY29uc3QgQUZURVJfU0VOVF9UT0tFTl9TUExJVF9SRSA9IG5ldyBSZWdFeHAoXG4vLyAgICAgU3RyaW5nLnJhd2AoPzwhXFxiW0EtWmEtel1cXC4pXFwuXFxzKyg/PWAgKyBUT0tFTl9TVEFSVF9TUkMgKyBTdHJpbmcucmF3YFxccyspYCxcbi8vICAgICBcImdcIlxuLy8gICApO1xuXG4vLyAgIGNvbnN0IHNwbGl0SW5saW5lU2VnbWVudHMgPSAobGluZTogc3RyaW5nKTogc3RyaW5nW10gPT4ge1xuLy8gICAgIC8vIDEpIHNwbGl0IGFmdGVyIDosIDssICE/LCBhbmQgXHUyMDFDXHUyMDE0IHYuIDk6XHUyMDFEXG4vLyAgICAgbGV0IHMgPSBsaW5lLnJlcGxhY2UoQUZURVJfUFVOQ1RfU1BMSVRfUkUsIChfbSwgcDE6IHN0cmluZykgPT4gYCR7cDF9XFxuYCk7XG4vLyAgICAgLy8gMikgc3BsaXQgYWZ0ZXIgc2VudGVuY2UtZW5kaW5nIGRvdCB3aGVuIGEgdG9rZW4gKDEuLCBhLiwgKDEpLCBJLiwgQS4pIGZvbGxvd3Ncbi8vICAgICBzID0gcy5yZXBsYWNlKEFGVEVSX1NFTlRfVE9LRU5fU1BMSVRfUkUsIFwiLlxcblwiKTtcbi8vICAgICByZXR1cm4gcy5zcGxpdChcIlxcblwiKS5tYXAoeCA9PiB4LnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pO1xuLy8gICB9O1xuXG4vLyAgIGNvbnN0IGVtaXRCdWZmZXIgPSAoYnVmOiBzdHJpbmcpID0+IHtcbi8vICAgICBjb25zdCBiYXNlID0gbm9ybWFsaXplUmVmRGFzaGVzKGJ1Zi50cmltKCkpO1xuLy8gICAgIGlmICghYmFzZSkgcmV0dXJuO1xuXG4vLyAgICAgaWYgKCFzcGxpdElubGluZVN1YnBvaW50cykge1xuLy8gICAgICAgb3V0cHV0LnB1c2goYmFzZSk7XG4vLyAgICAgICByZXR1cm47XG4vLyAgICAgfVxuXG4vLyAgICAgY29uc3QgcGFydHMgPSBzcGxpdElubGluZVNlZ21lbnRzKGJhc2UpO1xuLy8gICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgIGxldCBwYXJ0ID0gcGFydHNbaV07XG4vLyAgICAgICBwYXJ0ID0gbm9ybWFsaXplUmVmRGFzaGVzKHBhcnQpO1xuXG4vLyAgICAgICBpZiAoaSA9PT0gMCkge1xuLy8gICAgICAgICBvdXRwdXQucHVzaChwYXJ0KTtcbi8vICAgICAgICAgY29udGludWU7XG4vLyAgICAgICB9XG5cbi8vICAgICAgIC8vIEFkZCBoZWFkaW5nIHByZWZpeCBmb3Igc3BsaXQtb2ZmIHN1YnBvaW50c1xuLy8gICAgICAgY29uc3QgbSA9IHBhcnQubWF0Y2goL14oKD86W0lWWExDRE1dK1xcLnxbQS1aXVxcLnxbYS16XVxcLnxcXGQrXFwufFxcKFthLXpBLVowLTldK1xcKSkpXFxzKyguKikkLyk7XG4vLyAgICAgICBpZiAobSkge1xuLy8gICAgICAgICBjb25zdCBpdGVtID0gbVsxXTtcbi8vICAgICAgICAgY29uc3QgY29udGVudCA9IG1bMl0gPz8gXCJcIjtcbi8vICAgICAgICAgY29uc3QgcHJlZml4ID0gZ2V0TWRQcmVmaXgoaXRlbSk7XG4vLyAgICAgICAgIG91dHB1dC5wdXNoKGAke3ByZWZpeH0gJHtpdGVtfSAke2NvbnRlbnR9YC50cmltKCkpO1xuLy8gICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgb3V0cHV0LnB1c2gocGFydCk7XG4vLyAgICAgICB9XG4vLyAgICAgfVxuLy8gICB9O1xuXG4vLyAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuLy8gICAgIGNvbnN0IHN0cmlwcGVkID0gbGluZS50cmltKCk7XG4vLyAgICAgaWYgKCFzdHJpcHBlZCkgY29udGludWU7XG4vLyAgICAgaWYgKGRyb3BQdXJlUGFnZU51bWJlckxpbmVzICYmIC9eXFxkKyQvLnRlc3Qoc3RyaXBwZWQpKSBjb250aW51ZTtcblxuLy8gICAgIGlmIChpc0hlYWRpbmcoc3RyaXBwZWQpKSB7XG4vLyAgICAgICBpZiAoYnVmZmVyKSBlbWl0QnVmZmVyKGJ1ZmZlcik7XG4vLyAgICAgICBidWZmZXIgPSBcIlwiO1xuXG4vLyAgICAgICBjb25zdCBmaXJzdFNwYWNlID0gc3RyaXBwZWQuaW5kZXhPZihcIiBcIik7XG4vLyAgICAgICBjb25zdCBpdGVtID0gZmlyc3RTcGFjZSA9PT0gLTEgPyBzdHJpcHBlZCA6IHN0cmlwcGVkLnNsaWNlKDAsIGZpcnN0U3BhY2UpO1xuLy8gICAgICAgY29uc3QgY29udGVudCA9IGZpcnN0U3BhY2UgPT09IC0xID8gXCJcIiA6IHN0cmlwcGVkLnNsaWNlKGZpcnN0U3BhY2UgKyAxKTtcbi8vICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4KGl0ZW0pO1xuLy8gICAgICAgYnVmZmVyID0gYCR7cHJlZml4fSAke2l0ZW19ICR7Y29udGVudH1gLnRyaW0oKTtcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgYnVmZmVyID0gYnVmZmVyID8gYXBwZW5kV2l0aFdvcmRCcmVha0ZpeChidWZmZXIsIHN0cmlwcGVkKSA6IHN0cmlwcGVkO1xuLy8gICAgIH1cbi8vICAgfVxuXG4vLyAgIGlmIChidWZmZXIpIGVtaXRCdWZmZXIoYnVmZmVyKTtcbi8vICAgcmV0dXJuIG91dHB1dC5qb2luKFwiXFxuXCIpO1xuLy8gfVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLVxuLy8gZXhwb3J0IGludGVyZmFjZSBPdXRsaW5lRm9ybWF0T3B0aW9ucyB7XG4vLyAgIC8qKiBTcGxpdCBpbmxpbmUgc3VicG9pbnRzIGxpa2UgXCJhLiBcdTIwMjYgYi4gXHUyMDI2ICgxKSBcdTIwMjZcIiBBRlRFUiBjb2xvbi9zZW1pY29sb24gb3IgXCJcdTIwMTR2LiA5OlwiICovXG4vLyAgIHNwbGl0SW5saW5lU3VicG9pbnRzPzogYm9vbGVhbjsgICAgICAgLy8gZGVmYXVsdDogdHJ1ZVxuLy8gICAvKiogRml4IFwiaHlwaGVuICsgbGluZSBicmVha1wiIHdvcmQgc3BsaXRzIHdoZW4gbWVyZ2luZyBsaW5lcyAoaWxsdXMtIHRyYXRlZCBcdTIxOTIgaWxsdXN0cmF0ZWQpICovXG4vLyAgIGZpeEh5cGhlbmF0ZWRCcmVha3M/OiBib29sZWFuOyAgICAgICAgLy8gZGVmYXVsdDogdHJ1ZVxuLy8gICAvKiogRHJvcCBsaW5lcyB0aGF0IGFyZSBvbmx5IGEgcGFnZSBudW1iZXIgKGUuZy4sIFwiMTRcIikgYmVmb3JlIG1lcmdpbmcgKi9cbi8vICAgZHJvcFB1cmVQYWdlTnVtYmVyTGluZXM/OiBib29sZWFuOyAgICAvLyBkZWZhdWx0OiBmYWxzZVxuLy8gfVxuXG4vLyAvKiogU3RyaWN0IHBvcnQgb2YgeW91ciBQeXRob24gcGx1cyBTQUZFIG9wdC1pbnMgKi9cbi8vIGV4cG9ydCBmdW5jdGlvbiBmb3JtYXRPdXRsaW5lVGV4dCh0ZXh0OiBzdHJpbmcsIG9wdHM6IE91dGxpbmVGb3JtYXRPcHRpb25zID0ge30pOiBzdHJpbmcge1xuLy8gICBjb25zdCB7XG4vLyAgICAgc3BsaXRJbmxpbmVTdWJwb2ludHMgPSB0cnVlLFxuLy8gICAgIGZpeEh5cGhlbmF0ZWRCcmVha3MgPSB0cnVlLFxuLy8gICAgIGRyb3BQdXJlUGFnZU51bWJlckxpbmVzID0gZmFsc2UsXG4vLyAgIH0gPSBvcHRzO1xuXG4vLyAgIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgvXFxyP1xcbi8pO1xuLy8gICBjb25zdCBvdXRwdXQ6IHN0cmluZ1tdID0gW107XG4vLyAgIGxldCBidWZmZXIgPSBcIlwiO1xuXG4vLyAgIGNvbnN0IGlzSGVhZGluZyA9IChsaW5lOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbi8vICAgICBjb25zdCBzID0gbGluZS50cmltKCk7XG4vLyAgICAgLy8gXigoUm9tYW4pfFtBLVpdLnxkaWdpdHMufChwYXJlbikpXG4vLyAgICAgcmV0dXJuIC9eKChJezEsM318SVZ8VnxWSXxWSUl8VklJSXxJWHxYfFhJfFhJSXxYSUlJfFhJVnxYVilbXFwuXFwpXXxbQS1aXVtcXC5cXCldfFxcZCtcXC5bXFwpXT98XFwoW2EtekEtWjAtOV0rXFwpKS8udGVzdChzKTtcbi8vICAgfTtcblxuLy8gICBjb25zdCBnZXRNZFByZWZpeCA9IChpdGVtOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuLy8gICAgIGlmICgvXihJezEsM318SVZ8VnxWSXxWSUl8VklJSXxJWHxYfFhJfFhJSXxYSUlJfFhJVnxYVilbXFwuXFwpXS8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyNcIjtcbi8vICAgICBlbHNlIGlmICgvXlxccypbQS1aXVtcXC5cXCldLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCIjIyMjXCI7XG4vLyAgICAgZWxzZSBpZiAoL15cXHMqXFxkK1xcLi8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyMjIyNcIjtcbi8vICAgICBlbHNlIGlmICgvXlxccypbYS16XVxcLi8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyMjIyMjXCI7XG4vLyAgICAgZWxzZSBpZiAoL15cXHMqXFwoXFxkK1xcKS8udGVzdChpdGVtKSkgcmV0dXJuIFwiXCI7XG4vLyAgICAgZWxzZSBpZiAoL15cXHMqXFwoW2Etel1cXCkvLnRlc3QoaXRlbSkpIHJldHVybiBcIlwiO1xuLy8gICAgIGVsc2UgcmV0dXJuIFwiXCI7XG4vLyAgIH07XG5cbi8vICAgLy8gLS0tLSBIeXBoZW5hdGVkIHdvcmQgd3JhcCBqb2luIChcdTIwMjYgXCJpbGx1cy1cIiArIFwidHJhdGVkXCIgPT4gXCJpbGx1c3RyYXRlZFwiKVxuLy8gICBjb25zdCBUUkFJTElOR19IWVBIRU5fQVRfRU5EID0gL1tBLVphLXpdW1xcLVxcdTIwMTBcXHUyMDExXFx1MjAxMlxcdTIwMTNcXHUyMDE0XVxccyokLzsgLy8gLSwgXHUyMDEwLCAtLCBcdTIwMTIsIFx1MjAxMywgXHUyMDE0XG4vLyAgIGNvbnN0IGFwcGVuZFdpdGhXb3JkQnJlYWtGaXggPSAoYnVmOiBzdHJpbmcsIG5leHQ6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4vLyAgICAgaWYgKGZpeEh5cGhlbmF0ZWRCcmVha3MgJiYgVFJBSUxJTkdfSFlQSEVOX0FUX0VORC50ZXN0KGJ1ZikgJiYgL15bYS16XS8udGVzdChuZXh0KSkge1xuLy8gICAgICAgcmV0dXJuIGJ1Zi5yZXBsYWNlKC9bXFwtXFx1MjAxMFxcdTIwMTFcXHUyMDEyXFx1MjAxM1xcdTIwMTRdXFxzKiQvLCBcIlwiKSArIG5leHQ7XG4vLyAgICAgfVxuLy8gICAgIHJldHVybiAoYnVmICsgXCIgXCIgKyBuZXh0KS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKTtcbi8vICAgfTtcblxuLy8gICAvLyAtLS0tIE5vcm1hbGl6ZSBkaXZpZGVyIGRhc2hlcyBiZWZvcmUgdmVyc2UgcmVmcyB0byBhIHRpZ2h0IGVtLWRhc2g6IFwiXHUyMDE0XCIgKG5vIHNwYWNlcylcbi8vICAgZnVuY3Rpb24gbm9ybWFsaXplUmVmRGFzaGVzKHM6IHN0cmluZyk6IHN0cmluZyB7XG4vLyAgICAgLy8gQ2FzZSAxOiBiZWZvcmUgXCJ2LiA5XCIsIFwidi4gOTpcIiwgXCJ2LiA5YTpcIlxuLy8gICAgIHMgPSBzLnJlcGxhY2UoXG4vLyAgICAgICAvKFxcUylcXHMqW1xcLVxcdTIwMTBcXHUyMDExXFx1MjAxMlxcdTIwMTNcXHUyMDE0XVxccyoodlxcLlxccypcXGQrW2Etel0/Oj8pL2dpLFxuLy8gICAgICAgXCIkMVx1MjAxNCQyXCJcbi8vICAgICApO1xuXG4vLyAgICAgLy8gQ2FzZSAyOiBiZWZvcmUgYm9vaytyZWZlcmVuY2UgbGlrZSBcIlMuIFMuIDQ6MTFhXCIsIFwiQ29sLiAxOjEyXCIsIFwiMSBKb2huIDE6NVwiXG4vLyAgICAgLy8gU3VwcG9ydHMgY2hhaW5zIGxpa2UgXCIxIFRpbS5cIiBvciBcIlNvbmcgb2YgU29uZ3NcIiBhYmJyZXZpYXRpb25zIHdpdGggZG90cy5cbi8vICAgICBzID0gcy5yZXBsYWNlKFxuLy8gICAgICAgLyhcXFMpXFxzKltcXC1cXHUyMDEwXFx1MjAxMVxcdTIwMTJcXHUyMDEzXFx1MjAxNF1cXHMqKChbMS0zXT9cXHM/KD86W0EtWl1bYS16QS1aXSpcXC4/fFtBLVpdXFwuKSkoPzpcXHMrWzEtM10/XFxzPyg/OltBLVpdW2EtekEtWl0qXFwuP3xbQS1aXVxcLikpKlxccytcXGQrOlxcZCtbYS16XT8pL2csXG4vLyAgICAgICBcIiQxXHUyMDE0JDJcIlxuLy8gICAgICk7XG5cbi8vICAgICByZXR1cm4gcztcbi8vICAgfVxuXG4vLyAgIC8vIC0tLS0gU3BsaXQgaW5saW5lIHN1YnBvaW50cyBPTkxZIGFmdGVyIFwiOlwiIG9yIFwiO1wiIChvciBcIlx1MjAxNHYuIDk6XCIpLCBuZXZlciBhZnRlciBcIi5cIlxuLy8gICAvLyBUaGlzIGtlZXBzIFwiUy4gUy4gNDoxMWFcIiB0b2dldGhlci5cbi8vICAgY29uc3QgQUZURVJfUFVOQ1RfU1BMSVRfUkUgPVxuLy8gICAgIC8oWzo7IT9dfFx1MjAxNFxccyp2XFwuXFxzKlxcZCtbYS16XT86KVxccysoPz0oPzpbYS16XVxcLnxbQS1aXVxcLnxcXGQrXFwufFxcKFthLXowLTldK1xcKSlcXHMrKS9naTtcblxuLy8gICBjb25zdCBzcGxpdElubGluZUFmdGVyUHVuY3QgPSAobGluZTogc3RyaW5nKTogc3RyaW5nW10gPT4ge1xuLy8gICAgIGNvbnN0IHdpdGhCcmVha3MgPSBsaW5lLnJlcGxhY2UoQUZURVJfUFVOQ1RfU1BMSVRfUkUsIChfbSwgcDE6IHN0cmluZykgPT4gYCR7cDF9XFxuYCk7XG4vLyAgICAgcmV0dXJuIHdpdGhCcmVha3Muc3BsaXQoXCJcXG5cIikubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihCb29sZWFuKTtcbi8vICAgfTtcblxuLy8gICBjb25zdCBlbWl0QnVmZmVyID0gKGJ1Zjogc3RyaW5nKSA9PiB7XG4vLyAgICAgY29uc3QgYmFzZSA9IG5vcm1hbGl6ZVJlZkRhc2hlcyhidWYudHJpbSgpKTtcbi8vICAgICBpZiAoIWJhc2UpIHJldHVybjtcblxuLy8gICAgIGlmICghc3BsaXRJbmxpbmVTdWJwb2ludHMpIHtcbi8vICAgICAgIG91dHB1dC5wdXNoKGJhc2UpO1xuLy8gICAgICAgcmV0dXJuO1xuLy8gICAgIH1cblxuLy8gICAgIGNvbnN0IHBhcnRzID0gc3BsaXRJbmxpbmVBZnRlclB1bmN0KGJhc2UpO1xuLy8gICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgIGxldCBwYXJ0ID0gcGFydHNbaV07XG4vLyAgICAgICBwYXJ0ID0gbm9ybWFsaXplUmVmRGFzaGVzKHBhcnQpOyAvLyBlbnN1cmUgZWFjaCBwaWVjZSBoYXMgdGlnaHQgZW0tZGFzaCB0byByZWZzXG5cbi8vICAgICAgIGlmIChpID09PSAwKSB7XG4vLyAgICAgICAgIC8vIGZpcnN0IHBpZWNlIGlzIGFscmVhZHkgcmVuZGVyZWQgKGUuZy4sIFwiIyMjIyBBLiAuLi5cIikgb3IgcGxhaW4gdGV4dFxuLy8gICAgICAgICBvdXRwdXQucHVzaChwYXJ0KTtcbi8vICAgICAgICAgY29udGludWU7XG4vLyAgICAgICB9XG5cbi8vICAgICAgIC8vIEZvciBzcGxpdC1vZmYgc3VicG9pbnRzLCBhZGQgaGVhZGluZyBwcmVmaXggYmFzZWQgb24gdG9rZW5cbi8vICAgICAgIGNvbnN0IG0gPSBwYXJ0Lm1hdGNoKC9eKCg/OltBLVpdXFwuKXwoPzpbYS16XVxcLil8KD86XFxkK1xcLil8XFwoW2EtekEtWjAtOV0rXFwpKVxccysoLiopJC8pO1xuLy8gICAgICAgaWYgKG0pIHtcbi8vICAgICAgICAgY29uc3QgaXRlbSA9IG1bMV07XG4vLyAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBtWzJdID8/IFwiXCI7XG4vLyAgICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4KGl0ZW0pO1xuLy8gICAgICAgICBvdXRwdXQucHVzaChgJHtwcmVmaXh9ICR7aXRlbX0gJHtjb250ZW50fWAudHJpbSgpKTtcbi8vICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgIG91dHB1dC5wdXNoKHBhcnQpO1xuLy8gICAgICAgfVxuLy8gICAgIH1cbi8vICAgfTtcblxuLy8gICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbi8vICAgICBjb25zdCBzdHJpcHBlZCA9IGxpbmUudHJpbSgpO1xuLy8gICAgIGlmICghc3RyaXBwZWQpIGNvbnRpbnVlO1xuLy8gICAgIGlmIChkcm9wUHVyZVBhZ2VOdW1iZXJMaW5lcyAmJiAvXlxcZCskLy50ZXN0KHN0cmlwcGVkKSkgY29udGludWU7IC8vIGRyb3AgXCIxNFwiLCBcIjE1XCIsIC4uLlxuXG4vLyAgICAgaWYgKGlzSGVhZGluZyhzdHJpcHBlZCkpIHtcbi8vICAgICAgIGlmIChidWZmZXIpIGVtaXRCdWZmZXIoYnVmZmVyKTtcbi8vICAgICAgIGJ1ZmZlciA9IFwiXCI7XG5cbi8vICAgICAgIC8vIHNwbGl0KG1heHNwbGl0PTEpXG4vLyAgICAgICBjb25zdCBmaXJzdFNwYWNlID0gc3RyaXBwZWQuaW5kZXhPZihcIiBcIik7XG4vLyAgICAgICBjb25zdCBpdGVtID0gZmlyc3RTcGFjZSA9PT0gLTEgPyBzdHJpcHBlZCA6IHN0cmlwcGVkLnNsaWNlKDAsIGZpcnN0U3BhY2UpO1xuLy8gICAgICAgY29uc3QgY29udGVudCA9IGZpcnN0U3BhY2UgPT09IC0xID8gXCJcIiA6IHN0cmlwcGVkLnNsaWNlKGZpcnN0U3BhY2UgKyAxKTtcbi8vICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4KGl0ZW0pO1xuLy8gICAgICAgYnVmZmVyID0gYCR7cHJlZml4fSAke2l0ZW19ICR7Y29udGVudH1gLnRyaW0oKTtcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgYnVmZmVyID0gYnVmZmVyID8gYXBwZW5kV2l0aFdvcmRCcmVha0ZpeChidWZmZXIsIHN0cmlwcGVkKSA6IHN0cmlwcGVkO1xuLy8gICAgIH1cbi8vICAgfVxuXG4vLyAgIGlmIChidWZmZXIpIGVtaXRCdWZmZXIoYnVmZmVyKTtcbi8vICAgcmV0dXJuIG91dHB1dC5qb2luKFwiXFxuXCIpO1xuLy8gfVxuXG5cbi8vIGV4cG9ydCBmdW5jdGlvbiBmb3JtYXRPdXRsaW5lVGV4dCh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuLy8gICBjb25zdCBsaW5lcyA9IHRleHQuc3BsaXQoL1xccj9cXG4vKTtcbi8vICAgdGV4dCA9IHNwbGl0SW5saW5lSGVhZGluZ3ModGV4dCk7XG5cbi8vICAgY29uc3Qgb3V0cHV0OiBzdHJpbmdbXSA9IFtdO1xuLy8gICBsZXQgYnVmZmVyID0gXCJcIjtcblxuLy8gICBjb25zdCBpc0hlYWRpbmcgPSAobGluZTogc3RyaW5nKTogYm9vbGVhbiA9PiB7XG4vLyAgICAgY29uc3QgcyA9IGxpbmUudHJpbSgpO1xuLy8gICAgIHJldHVybiAvXigoSXsxLDN9fElWfFZ8Vkl8VklJfFZJSUl8SVh8WHxYSXxYSUl8WElJSXxYSVZ8WFZ8WFZJfFhWSUl8WFZJSUl8WElYfFhYKVtcXC5cXCldIHwgW0EgLSBaXVtcXC5cXCldfFxcZCArXFwuW1xcKV0gP3xcXChbYSAtIHpBIC0gWjAgLSA5XSArXFwpKS8udGVzdChzKTtcbi8vICAgfTtcblxuLy8gICBjb25zdCBnZXRNZFByZWZpeCA9IChpdGVtOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuLy8gICAgIGlmICgvXihJezEsM318SVZ8VnxWSXxWSUl8VklJSXxJWHxYfFhJfFhJSXxYSUlJfFhJVnxYVnxYVkl8WFZJSXxYVklJSXxYSVh8WFgpW1xcLlxcKV0vLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjXCI7XG4vLyAgICAgZWxzZSBpZiAoL15cXHMqW0EtWl1bXFwuXFwpXS8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyMjI1wiO1xuLy8gICAgIGVsc2UgaWYgKC9eXFxzKlxcZCtcXC4vLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjIyMjXCI7XG4vLyAgICAgZWxzZSBpZiAoL15cXHMqW2Etel1cXC4vLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjIyMjI1wiO1xuLy8gICAgIGVsc2UgaWYgKC9eXFxzKlxcKFxcZCtcXCkvLnRlc3QoaXRlbSkpIHJldHVybiBcIlwiO1xuLy8gICAgIGVsc2UgaWYgKC9eXFxzKlxcKFthLXpdXFwpLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCJcIjtcbi8vICAgICBlbHNlIHJldHVybiBcIlwiO1xuLy8gICB9O1xuXG4vLyAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuLy8gICAgIGNvbnN0IHN0cmlwcGVkID0gbGluZS50cmltKCk7XG4vLyAgICAgaWYgKCFzdHJpcHBlZCkgY29udGludWU7XG5cbi8vICAgICBpZiAoaXNIZWFkaW5nKHN0cmlwcGVkKSkge1xuLy8gICAgICAgaWYgKGJ1ZmZlcikgb3V0cHV0LnB1c2goYnVmZmVyLnRyaW0oKSk7XG4vLyAgICAgICBidWZmZXIgPSBcIlwiO1xuXG4vLyAgICAgICBjb25zdCBwYXJ0cyA9IHN0cmlwcGVkLnNwbGl0KC9cXHMrLywgMSArIDEpOyAvLyBtYXhzcGxpdD0xXG4vLyAgICAgICBjb25zdCBpdGVtID0gcGFydHNbMF07XG4vLyAgICAgICBjb25zdCBjb250ZW50ID0gcGFydHMubGVuZ3RoID4gMSA/IHBhcnRzWzFdIDogXCJcIjtcbi8vICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4KGl0ZW0pO1xuLy8gICAgICAgYnVmZmVyID0gYCR7cHJlZml4fSAke2l0ZW19ICR7Y29udGVudH1gLnRyaW0oKTtcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgYnVmZmVyICs9IGAgJHtzdHJpcHBlZH1gO1xuLy8gICAgIH1cbi8vICAgfVxuXG4vLyAgIGlmIChidWZmZXIpIG91dHB1dC5wdXNoKGJ1ZmZlci50cmltKCkpO1xuLy8gICByZXR1cm4gb3V0cHV0LmpvaW4oXCJcXG5cIik7XG4vLyB9XG5cbi8vIC8vIEluc2VydCBuZXdsaW5lcyBiZWZvcmUgaW5saW5lIHRva2VucyB0aGF0IGxvb2sgbGlrZSBuZXcgaXRlbXMuXG4vLyAvLyBBdm9pZHMgc3BsaXR0aW5nIGNvbW1vbiBhYmJyZXZpYXRpb25zIGxpa2UgXCJ2LlwiIGJ5IGV4Y2x1ZGluZyBpdC5cbi8vIGZ1bmN0aW9uIHNwbGl0SW5saW5lSGVhZGluZ3ModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbi8vICAgcmV0dXJuIHRleHRcbi8vICAgICAvLyBCZWZvcmUgQS4gLyBCLiAvIEMuXG4vLyAgICAgLnJlcGxhY2UoL1xccysoPz0oPzpbQS1aXVxcLilcXHMpL2csIFwiXFxuXCIpXG4vLyAgICAgLy8gQmVmb3JlIGEuIC8gYi4gLyBjLiAgKGJ1dCBOT1Qgdi4pXG4vLyAgICAgLnJlcGxhY2UoL1xccysoPz0oPzooPyF2XFwuKVthLXpdXFwuKVxccykvZywgXCJcXG5cIilcbi8vICAgICAvLyBCZWZvcmUgMS4gLyAyLiAvIDMuXG4vLyAgICAgLnJlcGxhY2UoL1xccysoPz0oPzpcXGQrXFwuKVxccykvZywgXCJcXG5cIilcbi8vICAgICAvLyBCZWZvcmUgKGEpIC8gKDEpXG4vLyAgICAgLnJlcGxhY2UoL1xccysoPz1cXChbYS16MC05XStcXClcXHMpL2dpLCBcIlxcblwiKTtcbi8vIH1cblxuXG4vLyAvLyBzcmMvbGliL291dGxpbmVVdGlscy50c1xuXG4vLyAvKiogU3RyaWN0IDE6MSBUeXBlU2NyaXB0IHBvcnQgb2YgeW91ciBQeXRob24gYGZvcm1hdF9vdXRsaW5lYCAqL1xuLy8gZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdE91dGxpbmVUZXh0KHRleHQ6IHN0cmluZywgb3B0cz86IHsgc3BsaXRJbmxpbmVBZnRlckNvbG9uPzogYm9vbGVhbiB9KTogc3RyaW5nIHtcbi8vICAgLy8gT3B0aW9uYWw6IHNwbGl0IHN1YnBvaW50cyBsaWtlIFwiYS5cIiwgXCJiLlwiLCBcIigxKVwiIHRoYXQgYXBwZWFyIEFGVEVSIGEgY29sb24gb3Igc2VtaWNvbG9uLlxuLy8gICAvLyBUaGlzIGlzIE9GRiBieSBkZWZhdWx0IHNvIHdlIGRvbid0IGJyZWFrIFwiQ29sLlwiLCBcIkVwaC5cIiwgZXRjLlxuLy8gICAvLyBpZiAob3B0cz8uc3BsaXRJbmxpbmVBZnRlckNvbG9uKSB7XG4vLyAgIHRleHQgPSBzcGxpdElubGluZUhlYWRpbmdzQWZ0ZXJDb2xvbih0ZXh0KTtcbi8vICAgLy8gfVxuXG4vLyAgIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgvXFxyP1xcbi8pO1xuLy8gICBjb25zdCBvdXRwdXQ6IHN0cmluZ1tdID0gW107XG4vLyAgIGxldCBidWZmZXIgPSBcIlwiO1xuXG4vLyAgIGNvbnN0IGlzSGVhZGluZyA9IChsaW5lOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbi8vICAgICBjb25zdCBzID0gbGluZS50cmltKCk7XG4vLyAgICAgLy8gXigoUm9tYW4pfFtBLVpdLnxkaWdpdHMufChwYXJlbikpXG4vLyAgICAgcmV0dXJuIC9eKChJezEsM318SVZ8VnxWSXxWSUl8VklJSXxJWHxYfFhJfFhJSXxYSUlJfFhJVnxYVnxYVkl8WFZJSXxYVklJSXxYSVh8WFgpW1xcLlxcKV18W0EtWl1bXFwuXFwpXXxcXGQrXFwuW1xcKV0/fFxcKFthLXpBLVowLTldK1xcKSkvLnRlc3Qocyk7XG4vLyAgIH07XG5cbi8vICAgY29uc3QgZ2V0TWRQcmVmaXggPSAoaXRlbTogc3RyaW5nKTogc3RyaW5nID0+IHtcbi8vICAgICBpZiAoL14oSXsxLDN9fElWfFZ8Vkl8VklJfFZJSUl8SVh8WHxYSXxYSUl8WElJSXxYSVZ8WFZ8WFZJfFhWSUl8WFZJSUl8WElYfFhYKVtcXC5cXCldLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCIjI1wiO1xuLy8gICAgIGVsc2UgaWYgKC9eXFxzKltBLVpdW1xcLlxcKV0vLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjIyNcIjtcbi8vICAgICBlbHNlIGlmICgvXlxccypcXGQrXFwuLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCIjIyMjI1wiO1xuLy8gICAgIGVsc2UgaWYgKC9eXFxzKlthLXpdXFwuLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCIjIyMjIyNcIjtcbi8vICAgICBlbHNlIGlmICgvXlxccypcXChcXGQrXFwpLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCJcIjtcbi8vICAgICBlbHNlIGlmICgvXlxccypcXChbYS16XVxcKS8udGVzdChpdGVtKSkgcmV0dXJuIFwiXCI7XG4vLyAgICAgZWxzZSByZXR1cm4gXCJcIjtcbi8vICAgfTtcblxuLy8gICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbi8vICAgICBjb25zdCBzdHJpcHBlZCA9IGxpbmUudHJpbSgpO1xuLy8gICAgIGlmICghc3RyaXBwZWQpIGNvbnRpbnVlO1xuXG4vLyAgICAgaWYgKGlzSGVhZGluZyhzdHJpcHBlZCkpIHtcbi8vICAgICAgIGlmIChidWZmZXIpIG91dHB1dC5wdXNoKGJ1ZmZlci50cmltKCkpO1xuLy8gICAgICAgYnVmZmVyID0gXCJcIjtcblxuLy8gICAgICAgLy8gc3BsaXQobWF4c3BsaXQ9MSlcbi8vICAgICAgIGNvbnN0IGZpcnN0U3BhY2UgPSBzdHJpcHBlZC5pbmRleE9mKFwiIFwiKTtcbi8vICAgICAgIGNvbnN0IGl0ZW0gPSBmaXJzdFNwYWNlID09PSAtMSA/IHN0cmlwcGVkIDogc3RyaXBwZWQuc2xpY2UoMCwgZmlyc3RTcGFjZSk7XG4vLyAgICAgICBjb25zdCBjb250ZW50ID0gZmlyc3RTcGFjZSA9PT0gLTEgPyBcIlwiIDogc3RyaXBwZWQuc2xpY2UoZmlyc3RTcGFjZSArIDEpO1xuXG4vLyAgICAgICBjb25zdCBwcmVmaXggPSBnZXRNZFByZWZpeChpdGVtKTtcbi8vICAgICAgIGJ1ZmZlciA9IGAke3ByZWZpeH0gJHtpdGVtfSAke2NvbnRlbnR9YC50cmltKCk7XG4vLyAgICAgfSBlbHNlIHtcbi8vICAgICAgIGJ1ZmZlciArPSBgICR7c3RyaXBwZWR9YDtcbi8vICAgICB9XG4vLyAgIH1cblxuLy8gICBpZiAoYnVmZmVyKSBvdXRwdXQucHVzaChidWZmZXIudHJpbSgpKTtcbi8vICAgcmV0dXJuIG91dHB1dC5qb2luKFwiXFxuXCIpO1xuLy8gfVxuXG4vKipcbiAqIFNBRkVMWSBzcGxpdCBpbmxpbmUgc3VicG9pbnRzIE9OTFkgd2hlbiB0aGV5IGNvbWUgcmlnaHQgYWZ0ZXIgYSBjb2xvbi9zZW1pY29sb24sXG4gKiBlLmcuIFx1MjAxQ1x1MjAyNiB2LiA5OiBhLiBGdWxsbmVzcyBcdTIwMjYgYi4gV2hlbiBcdTIwMjYgMS4gU29tZXRoaW5nIFx1MjAyNlx1MjAxRFxuICogVGhpcyB3aWxsIE5PVCBzcGxpdCBcdTIwMThDb2wuXHUyMDE5IC8gXHUyMDE4RXBoLlx1MjAxOSBiZWNhdXNlIHRob3NlIGFyZW5cdTIwMTl0IHByZWNlZGVkIGJ5ICc6JyBvciAnOycuXG4gKi9cbmZ1bmN0aW9uIHNwbGl0SW5saW5lSGVhZGluZ3NBZnRlckNvbG9uKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vIEluc2VydCBhIG5ld2xpbmUgYWZ0ZXIgXCI6XCIgb3IgXCI7XCIgQkVGT1JFIGEgdG9rZW4gdGhhdCBsb29rcyBsaWtlIGEgc3VicG9pbnQuXG4gIC8vIFRva2VucyBzdXBwb3J0ZWQ6ICBhLiAgYi4gIDEuICAxMC4gIChhKSAgKDEpXG4gIC8vIEtlZXAgdGhlIHB1bmN0dWF0aW9uICg6JDEpIGFuZCBhZGQgdGhlIG5ld2xpbmUgaW4gJDIuXG4gIHJldHVybiB0ZXh0XG4gICAgLy8gQWZ0ZXIgXCI6XCIgb3IgXCI7XCIgdGhlbiBzcGFjZShzKSAtPiBiZWZvcmUgW2Etel0uICAoZXhjbHVkZSB2LiBieSBub3QgbmVlZGVkOiB3ZSBvbmx5IHNwbGl0IGFmdGVyIFwiOlwiIC8gXCI7XCIpXG4gICAgLnJlcGxhY2UoLyhbOjtdKVxccysoPz0oW2Etel1cXC58XFwoXFx3K1xcKXxcXGQrXFwuKSkvZywgXCIkMVxcblwiKVxuICAgIC8vIEFsc28gc3VwcG9ydCBlbS9lbiBkYXNoIFwiXHUyMDE0XCIgZm9sbG93ZWQgYnkgdmVyc2UgXCJ2LlwiIHdpdGggbnVtYmVyLCB0aGVuIGNvbG9uOiBcIlx1MjAxNHYuIDk6XCIgYSBjb21tb24gcGF0dGVyblxuICAgIC5yZXBsYWNlKC8oXHUyMDE0XFxzKnZcXC5cXHMqXFxkK1thLXpdPzopXFxzKyg/PShbYS16XVxcLnxcXChcXHcrXFwpfFxcZCtcXC4pKS9naSwgXCIkMVxcblwiKTtcbn1cblxuXG5cblxuXG4vLyAvLyA9PT09PT09PT09PT09PT09PT09PT1cbi8vIC8vIE51bWJlcmluZyBkZXRlY3Rpb25cbi8vIC8vID09PT09PT09PT09PT09PT09PT09PVxuLy8gY29uc3QgUk9NQU4gPSAvXihJezEsM318SVZ8VnxWSXxWSUl8VklJSXxJWHxYfFhJfFhJSXxYSUlJfFhJVnxYVilbXFwuXFwpXVxccy87XG4vLyBjb25zdCBVUFBFUiA9IC9eW0EtWl1bXFwuXFwpXVxccy87XG4vLyBjb25zdCBMT1dFUiA9IC9eW2Etel1bXFwuXFwpXVxccy87ICAgICAgICAgICAgICAvLyBlLmcuLCBcImEuIFwiXG4vLyBjb25zdCBOVU1FUklDID0gL15cXGQrW1xcLlxcKV1cXHMvOyAgICAgICAgICAgICAgLy8gZS5nLiwgXCIxLiBcIiBvciBcIjEwKSBcIlxuLy8gY29uc3QgUEFSRU4gPSAvXlxcKFthLXpBLVowLTldK1xcKVxccy87ICAgICAgICAgLy8gZS5nLiwgXCIoYSkgXCIgXCIoMSkgXCJcblxuLy8gLyoqIHRydWUgaWZmIHRoZSBsaW5lIGJlZ2lucyBhIG5ldyBudW1iZXJlZCBpdGVtICovXG4vLyBleHBvcnQgZnVuY3Rpb24gc3RhcnRzV2l0aE51bWJlcmluZyhsaW5lOiBzdHJpbmcpOiBib29sZWFuIHtcbi8vICAgcmV0dXJuIFJPTUFOLnRlc3QobGluZSkgfHwgVVBQRVIudGVzdChsaW5lKSB8fCBMT1dFUi50ZXN0KGxpbmUpIHx8IE5VTUVSSUMudGVzdChsaW5lKSB8fCBQQVJFTi50ZXN0KGxpbmUpO1xuLy8gfVxuXG4vLyAvKiogcmVtb3ZlIHBhZ2UtbnVtYmVyLW9ubHkgbGluZXMgYW5kIHRyaW0gd2hpdGVzcGFjZSAqL1xuLy8gZnVuY3Rpb24gcHJlcHJvY2Vzc0xpbmVzKGlucHV0OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4vLyAgIHJldHVybiBpbnB1dFxuLy8gICAgIC5zcGxpdCgvXFxyP1xcbi8pXG4vLyAgICAgLm1hcChsID0+IGwudHJpbSgpKVxuLy8gICAgIC8vIC5maWx0ZXIobCA9PiBsLmxlbmd0aCA+IDAgJiYgIS9eXFxkKyQvLnRlc3QobCkpOyAvLyBkcm9wIHB1cmUgcGFnZSBudW1iZXJzIGxpa2UgXCIxNFwiXG4vLyB9XG5cbi8vIC8qKiBqb2luIHNvZnQgaHlwaGVuYXRlZCBicmVha3Mgd2hlbiBtZXJnaW5nIChcdTIwMjYgXCJpbGx1cy1cIiArIFwidHJhdGVkXCIgXHUyMTkyIFwiaWxsdXN0cmF0ZWRcIikgKi9cbi8vIGZ1bmN0aW9uIGpvaW5XaXRoSHlwaGVuRml4KHByZXY6IHN0cmluZywgbmV4dDogc3RyaW5nKTogc3RyaW5nIHtcbi8vICAgLy8gSWYgcHJldiBlbmRzIHdpdGggYSBoeXBoZW4tbGlrZSBjaGFyLCBkcm9wIGl0IGFuZCBkb24ndCBhZGQgYSBzcGFjZVxuLy8gICBpZiAoL1tcdTIwMTAtXHUyMDEyXHUyMDEzXHUyMDE0LV0kLy50ZXN0KHByZXYpKSB7XG4vLyAgICAgcmV0dXJuIHByZXYucmVwbGFjZSgvW1x1MjAxMC1cdTIwMTJcdTIwMTNcdTIwMTQtXSQvLCBcIlwiKSArIG5leHQucmVwbGFjZSgvXltcdTIwMTAtXHUyMDEyXHUyMDEzXHUyMDE0LV1cXHMqLywgXCJcIik7XG4vLyAgIH1cbi8vICAgLy8gT3RoZXJ3aXNlIGpvaW4gd2l0aCBhIHNpbmdsZSBzcGFjZVxuLy8gICByZXR1cm4gKHByZXYgKyBcIiBcIiArIG5leHQpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xuLy8gfVxuXG4vLyAvKipcbi8vICAqIE5vcm1hbGl6ZSByYXcgb3V0bGluZSB0ZXh0IHRvIG9uZSBsb2dpY2FsIGxpbmUgcGVyIG51bWJlcmVkIGl0ZW06XG4vLyAgKiAtIE9ubHkgc3RhcnQgYSBuZXcgb3V0cHV0IGxpbmUgd2hlbiB0aGUgKmN1cnJlbnQqIGlucHV0IGxpbmUgYmVnaW5zIHdpdGggYSBudW1iZXJpbmcgdG9rZW5cbi8vICAqIC0gT3RoZXJ3aXNlLCBtZXJnZSB0aGUgbGluZSBpbnRvIHRoZSBwcmV2aW91cyBvdXRwdXQgbGluZSAoZml4aW5nIGh5cGhlbmF0ZWQgbGluZSBicmVha3MpXG4vLyAgKiAtIFRleHQgYmVmb3JlIHRoZSBmaXJzdCBudW1iZXJlZCBpdGVtIGlzIGlnbm9yZWQgKHBlciB5b3VyIHJ1bGUpXG4vLyAgKi9cbi8vIGV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVCcmVha3NCeU51bWJlcmluZyhpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbi8vICAgY29uc3QgbGluZXMgPSBwcmVwcm9jZXNzTGluZXMoaW5wdXQpO1xuLy8gICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4vLyAgIGxldCBjdXIgPSBcIlwiO1xuLy8gICBsZXQgaGF2ZUN1cnJlbnQgPSBmYWxzZTsgLy8gb25seSBvdXRwdXQgb25jZSB3ZSBoaXQgZmlyc3QgbnVtYmVyaW5nXG5cbi8vICAgZm9yIChjb25zdCByYXcgb2YgbGluZXMpIHtcbi8vICAgICBjb25zdCBsaW5lID0gcmF3OyAvLyBhbHJlYWR5IHRyaW1tZWRcbi8vICAgICBpZiAoc3RhcnRzV2l0aE51bWJlcmluZyhsaW5lKSkge1xuLy8gICAgICAgLy8gY29tbWl0IHByZXZpb3VzXG4vLyAgICAgICBpZiAoaGF2ZUN1cnJlbnQgJiYgY3VyKSBvdXQucHVzaChjdXIudHJpbSgpKTtcbi8vICAgICAgIC8vIHN0YXJ0IG5ldyBpdGVtXG4vLyAgICAgICBjdXIgPSBsaW5lO1xuLy8gICAgICAgaGF2ZUN1cnJlbnQgPSB0cnVlO1xuLy8gICAgIH0gZWxzZSB7XG4vLyAgICAgICAvLyBtZXJnZSBvbmx5IGlmIHdlJ3ZlIHN0YXJ0ZWQgYSBudW1iZXJlZCBpdGVtOyBvdGhlcndpc2UgaWdub3JlIHByZWFtYmxlXG4vLyAgICAgICAvLyBpZiAoIWhhdmVDdXJyZW50KSBjb250aW51ZTtcbi8vICAgICAgIGN1ciA9IGpvaW5XaXRoSHlwaGVuRml4KGN1ciwgbGluZSk7XG4vLyAgICAgfVxuLy8gICB9XG5cbi8vICAgaWYgKGhhdmVDdXJyZW50ICYmIGN1cikgb3V0LnB1c2goY3VyLnRyaW0oKSk7XG4vLyAgIHJldHVybiBvdXQuam9pbihcIlxcblwiKTtcbi8vIH1cblxuLy8gLy8gPT09PT09PT09PT09PT09PT09PT09XG4vLyAvLyBNYXJrZG93biBjb252ZXJzaW9uXG4vLyAvLyA9PT09PT09PT09PT09PT09PT09PT1cblxuLy8gLyoqIE1hcCBhIG51bWJlcmluZyB0b2tlbiB0byBhIE1hcmtkb3duIGhlYWRpbmcgbGV2ZWwgKi9cbi8vIGV4cG9ydCBmdW5jdGlvbiBtZFByZWZpeEZvclRva2VuKHRva2VuOiBzdHJpbmcpOiBzdHJpbmcge1xuLy8gICBjb25zdCByb21hbiA9IC9eKEl7MSwzfXxJVnxWfFZJfFZJSXxWSUlJfElYfFh8WEl8WElJfFhJSUl8WElWfFhWKVtcXC5cXCldJC9pO1xuLy8gICBjb25zdCB1cHBlciA9IC9eW0EtWl1bXFwuXFwpXSQvO1xuLy8gICBjb25zdCBsb3dlciA9IC9eW2Etel1bXFwuXFwpXSQvO1xuLy8gICBjb25zdCBudW1lcmljID0gL15cXGQrW1xcLlxcKV0/JC87XG4vLyAgIGNvbnN0IHBhcmVuID0gL15cXChbYS16QS1aMC05XStcXCkkLztcblxuLy8gICBpZiAocm9tYW4udGVzdCh0b2tlbikpIHJldHVybiBcIiMjXCI7ICAgICAgLy8gdG9wIGxldmVsXG4vLyAgIGlmICh1cHBlci50ZXN0KHRva2VuKSkgcmV0dXJuIFwiIyMjXCI7XG4vLyAgIGlmIChudW1lcmljLnRlc3QodG9rZW4pKSByZXR1cm4gXCIjIyMjXCI7XG4vLyAgIGlmIChsb3dlci50ZXN0KHRva2VuKSkgcmV0dXJuIFwiIyMjIyNcIjtcbi8vICAgaWYgKHBhcmVuLnRlc3QodG9rZW4pKSByZXR1cm4gXCIjIyMjIyNcIjtcbi8vICAgcmV0dXJuIFwiXCI7XG4vLyB9XG5cbi8vIC8qKiBBIGxpbmUgaXMgYW4gb3V0bGluZSBoZWFkaW5nIGxpbmUgaWYgaXQgc3RhcnRzIHdpdGggYSBudW1iZXJpbmcgdG9rZW4gKi9cbi8vIGV4cG9ydCBmdW5jdGlvbiBpc091dGxpbmVIZWFkaW5nTGluZShsaW5lOiBzdHJpbmcpOiBib29sZWFuIHtcbi8vICAgY29uc3QgcyA9IGxpbmUudHJpbSgpO1xuLy8gICByZXR1cm4gUk9NQU4udGVzdChzKSB8fCBVUFBFUi50ZXN0KHMpIHx8IExPV0VSLnRlc3QocykgfHwgTlVNRVJJQy50ZXN0KHMpIHx8IFBBUkVOLnRlc3Qocyk7XG4vLyB9XG5cbi8vIC8qKlxuLy8gICogQ29udmVydCBub3JtYWxpemVkIG91dGxpbmUgdGV4dCAob25lIG51bWJlcmVkIGl0ZW0gcGVyIGxpbmUpIGludG8gTWFya2Rvd25cbi8vICAqIGhlYWRpbmdzIGJhc2VkIG9uIHRoZSBudW1iZXJpbmcgdG9rZW4uXG4vLyAgKlxuLy8gICogSWYgeW91IHBhc3MgcmF3IGlucHV0LCB0aGlzIHdpbGwgZmlyc3Qgbm9ybWFsaXplIGl0LlxuLy8gICovXG4vLyBleHBvcnQgZnVuY3Rpb24gZm9ybWF0T3V0bGluZVRleHQoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4vLyAgIC8vIFN0ZXAgMTogbm9ybWFsaXplIHRvIG9uZSBudW1iZXJlZCBpdGVtIHBlciBsaW5lXG4vLyAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVCcmVha3NCeU51bWJlcmluZyhpbnB1dCk7XG4vLyAgIGNvbnN0IGxpbmVzID0gbm9ybWFsaXplZC5zcGxpdCgvXFxyP1xcbi8pO1xuXG4vLyAgIC8vIFN0ZXAgMjogY29udmVydCBlYWNoIGxpbmUgdG8gYSBoZWFkaW5nIGJhc2VkIG9uIGl0cyB0b2tlblxuLy8gICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG5cbi8vICAgZm9yIChjb25zdCByYXcgb2YgbGluZXMpIHtcbi8vICAgICBjb25zdCBsaW5lID0gcmF3LnRyaW0oKTtcbi8vICAgICBpZiAoIWxpbmUpIGNvbnRpbnVlO1xuXG4vLyAgICAgLy8gbXVzdCBzdGFydCB3aXRoIGEgbnVtYmVyaW5nIHRva2VuXG4vLyAgICAgaWYgKCFpc091dGxpbmVIZWFkaW5nTGluZShsaW5lKSkge1xuLy8gICAgICAgLy8gU2FmZXR5OiBpZiBpdCBzbGlwcyB0aHJvdWdoLCBhcHBlbmQgdG8gcHJldmlvdXMgbGluZVxuLy8gICAgICAgaWYgKG91dC5sZW5ndGgpIHtcbi8vICAgICAgICAgb3V0W291dC5sZW5ndGggLSAxXSA9IGpvaW5XaXRoSHlwaGVuRml4KG91dFtvdXQubGVuZ3RoIC0gMV0sIGxpbmUpO1xuLy8gICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgb3V0LnB1c2gobGluZSk7XG4vLyAgICAgICB9XG4vLyAgICAgICBjb250aW51ZTtcbi8vICAgICB9XG5cbi8vICAgICBjb25zdCBwYXJ0cyA9IGxpbmUuc3BsaXQoL1xccysvLCAyKTtcbi8vICAgICBjb25zdCB0b2tlbiA9IHBhcnRzWzBdLnJlcGxhY2UoLzokLywgXCJcIik7XG4vLyAgICAgY29uc3QgcmVzdCA9IHBhcnRzLmxlbmd0aCA+IDEgPyBwYXJ0c1sxXSA6IFwiXCI7XG4vLyAgICAgY29uc3QgcHJlZml4ID0gbWRQcmVmaXhGb3JUb2tlbih0b2tlbik7XG4vLyAgICAgY29uc3QgcmVuZGVyZWQgPSAocHJlZml4ID8gYCR7cHJlZml4fSAke3Rva2VufSAke3Jlc3R9YCA6IGxpbmUpLnRyaW0oKTtcblxuLy8gICAgIG91dC5wdXNoKHJlbmRlcmVkKTtcbi8vICAgfVxuXG4vLyAgIHJldHVybiBvdXQuam9pbihcIlxcblwiKTtcbi8vIH0iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlLCBTZXR0aW5nLCBURmlsZSwgVEZvbGRlciwgbm9ybWFsaXplUGF0aCwgcmVxdWVzdFVybCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBCT09LX0FCQlIgfSBmcm9tIFwiLi4vbGliL3ZlcnNlTWFwXCI7XG5pbXBvcnQgeyBCdWlsZEJpYmxlTW9kYWwgfSBmcm9tIFwic3JjL3VpL2J1aWxkLWJpYmxlLW1vZGFsXCI7XG5cbi8vIC0tLS0tLS0tLS0gVHlwZXMgLS0tLS0tLS0tLVxudHlwZSBMYW5ndWFnZXNFbnRyeSA9IHtcbiAgbGFuZ3VhZ2U6IHN0cmluZzsgLy8gZS5nLiBcIkVuZ2xpc2hcIlxuICB0cmFuc2xhdGlvbnM6IEFycmF5PHtcbiAgICBzaG9ydF9uYW1lOiBzdHJpbmc7IC8vIGUuZy4gXCJLSlZcIlxuICAgIGZ1bGxfbmFtZTogc3RyaW5nOyAgLy8gZS5nLiBcIktpbmcgSmFtZXMgVmVyc2lvbiAuLi5cIlxuICAgIHVwZGF0ZWQ/OiBudW1iZXI7XG4gICAgZGlyPzogXCJydGxcIiB8IFwibHRyXCI7XG4gIH0+O1xufTtcblxudHlwZSBCb2xsc0Jvb2tNZXRhID0ge1xuICBib29raWQ6IG51bWJlcjtcbiAgY2hyb25vcmRlcjogbnVtYmVyO1xuICBuYW1lOiBzdHJpbmc7XG4gIGNoYXB0ZXJzOiBudW1iZXI7XG59O1xuXG50eXBlIEJvbGxzVmVyc2UgPSB7XG4gIHBrOiBudW1iZXI7XG4gIHZlcnNlOiBudW1iZXI7XG4gIHRleHQ6IHN0cmluZzsgICAvLyBIVE1MXG4gIGNvbW1lbnQ/OiBzdHJpbmc7XG59O1xuXG5jb25zdCBCT0xMUyA9IHtcbiAgTEFOR1VBR0VTX1VSTDogXCJodHRwczovL2JvbGxzLmxpZmUvc3RhdGljL2JvbGxzL2FwcC92aWV3cy9sYW5ndWFnZXMuanNvblwiLFxuICBHRVRfQk9PS1M6ICh0cjogc3RyaW5nKSA9PiBgaHR0cHM6Ly9ib2xscy5saWZlL2dldC1ib29rcy8ke2VuY29kZVVSSUNvbXBvbmVudCh0cil9L2AsXG4gIEdFVF9DSEFQVEVSOiAodHI6IHN0cmluZywgYm9va0lkOiBudW1iZXIsIGNoOiBudW1iZXIpID0+XG4gICAgYGh0dHBzOi8vYm9sbHMubGlmZS9nZXQtdGV4dC8ke2VuY29kZVVSSUNvbXBvbmVudCh0cil9LyR7Ym9va0lkfS8ke2NofS9gLFxufTtcblxuLy8gQ2Fub25pY2FsIGJvb2sgbmFtZSBieSBJRCAoNjYtYm9vayBQcm90ZXN0YW50IGJhc2VsaW5lKVxuY29uc3QgQ0FOT05fRU5fQllfSUQ6IFJlY29yZDxudW1iZXIsIHN0cmluZz4gPSB7XG4gIDE6XCJHZW5lc2lzXCIsMjpcIkV4b2R1c1wiLDM6XCJMZXZpdGljdXNcIiw0OlwiTnVtYmVyc1wiLDU6XCJEZXV0ZXJvbm9teVwiLFxuICA2OlwiSm9zaHVhXCIsNzpcIkp1ZGdlc1wiLDg6XCJSdXRoXCIsOTpcIjEgU2FtdWVsXCIsMTA6XCIyIFNhbXVlbFwiLFxuICAxMTpcIjEgS2luZ3NcIiwxMjpcIjIgS2luZ3NcIiwxMzpcIjEgQ2hyb25pY2xlc1wiLDE0OlwiMiBDaHJvbmljbGVzXCIsMTU6XCJFenJhXCIsXG4gIDE2OlwiTmVoZW1pYWhcIiwxNzpcIkVzdGhlclwiLDE4OlwiSm9iXCIsMTk6XCJQc2FsbXNcIiwyMDpcIlByb3ZlcmJzXCIsXG4gIDIxOlwiRWNjbGVzaWFzdGVzXCIsMjI6XCJTb25nIG9mIFNvbmdzXCIsMjM6XCJJc2FpYWhcIiwyNDpcIkplcmVtaWFoXCIsMjU6XCJMYW1lbnRhdGlvbnNcIixcbiAgMjY6XCJFemVraWVsXCIsMjc6XCJEYW5pZWxcIiwyODpcIkhvc2VhXCIsMjk6XCJKb2VsXCIsMzA6XCJBbW9zXCIsXG4gIDMxOlwiT2JhZGlhaFwiLDMyOlwiSm9uYWhcIiwzMzpcIk1pY2FoXCIsMzQ6XCJOYWh1bVwiLDM1OlwiSGFiYWtrdWtcIixcbiAgMzY6XCJaZXBoYW5pYWhcIiwzNzpcIkhhZ2dhaVwiLDM4OlwiWmVjaGFyaWFoXCIsMzk6XCJNYWxhY2hpXCIsXG4gIDQwOlwiTWF0dGhld1wiLDQxOlwiTWFya1wiLDQyOlwiTHVrZVwiLDQzOlwiSm9oblwiLDQ0OlwiQWN0c1wiLDQ1OlwiUm9tYW5zXCIsXG4gIDQ2OlwiMSBDb3JpbnRoaWFuc1wiLDQ3OlwiMiBDb3JpbnRoaWFuc1wiLDQ4OlwiR2FsYXRpYW5zXCIsNDk6XCJFcGhlc2lhbnNcIixcbiAgNTA6XCJQaGlsaXBwaWFuc1wiLDUxOlwiQ29sb3NzaWFuc1wiLDUyOlwiMSBUaGVzc2Fsb25pYW5zXCIsNTM6XCIyIFRoZXNzYWxvbmlhbnNcIixcbiAgNTQ6XCIxIFRpbW90aHlcIiw1NTpcIjIgVGltb3RoeVwiLDU2OlwiVGl0dXNcIiw1NzpcIlBoaWxlbW9uXCIsNTg6XCJIZWJyZXdzXCIsXG4gIDU5OlwiSmFtZXNcIiw2MDpcIjEgUGV0ZXJcIiw2MTpcIjIgUGV0ZXJcIiw2MjpcIjEgSm9oblwiLDYzOlwiMiBKb2huXCIsXG4gIDY0OlwiMyBKb2huXCIsNjU6XCJKdWRlXCIsNjY6XCJSZXZlbGF0aW9uXCIsXG59O1xuXG5mdW5jdGlvbiBzaG9ydEFiYnJGb3IoYm9va0lkOiBudW1iZXIsIGluY29taW5nTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgY2Fub24gPSBDQU5PTl9FTl9CWV9JRFtib29rSWRdO1xuICBpZiAoY2Fub24gJiYgQk9PS19BQkJSW2Nhbm9uXSkgcmV0dXJuIEJPT0tfQUJCUltjYW5vbl07XG4gIGlmIChCT09LX0FCQlJbaW5jb21pbmdOYW1lXSkgcmV0dXJuIEJPT0tfQUJCUltpbmNvbWluZ05hbWVdO1xuICByZXR1cm4gaW5jb21pbmdOYW1lO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEpzb248VD4odXJsOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcbiAgLy8gUHJlZmVyIE9ic2lkaWFuJ3MgcmVxdWVzdFVybCAobm8gQ09SUyByZXN0cmljdGlvbnMpXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHJlcXVlc3RVcmwoeyB1cmwsIG1ldGhvZDogXCJHRVRcIiB9KTtcbiAgICBpZiAocmVzcC5zdGF0dXMgPCAyMDAgfHwgcmVzcC5zdGF0dXMgPj0gMzAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7cmVzcC5zdGF0dXN9IFJlcXVlc3QgZmFpbGVkYCk7XG4gICAgfVxuICAgIGNvbnN0IHRleHQgPSByZXNwLnRleHQgPz8gXCJcIjtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UodGV4dCkgYXMgVDtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBKU09OIGZyb20gJHt1cmx9YCk7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBGYWxsYmFjayB0byBmZXRjaCBmb3Igbm9uLU9ic2lkaWFuIGNvbnRleHRzIChlLmcuLCB0ZXN0cylcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwgeyBtZXRob2Q6IFwiR0VUXCIgfSk7XG4gICAgICBpZiAoIXIub2spIHRocm93IG5ldyBFcnJvcihgJHtyLnN0YXR1c30gJHtyLnN0YXR1c1RleHR9YCk7XG4gICAgICByZXR1cm4gKGF3YWl0IHIuanNvbigpKSBhcyBUO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIFN1cmZhY2UgdGhlIG9yaWdpbmFsIHJlcXVlc3RVcmwgZXJyb3IgaWYgYm90aCBmYWlsXG4gICAgICB0aHJvdyBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyKSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBodG1sVG9UZXh0KGh0bWw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBodG1sXG4gICAgLnJlcGxhY2UoLzxiclxccypcXC8/Pi9naSwgXCJcXG5cIilcbiAgICAucmVwbGFjZSgvPFxcLz8oaXxlbXxzdHJvbmd8Ynx1fHN1cHxzdWJ8c3BhbnxwfGRpdnxibG9ja3F1b3RlfHNtYWxsfGZvbnQpW14+XSo+L2dpLCBcIlwiKVxuICAgIC5yZXBsYWNlKC8mbmJzcDsvZywgXCIgXCIpXG4gICAgLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKVxuICAgIC5yZXBsYWNlKC8mbHQ7L2csIFwiPFwiKVxuICAgIC5yZXBsYWNlKC8mZ3Q7L2csIFwiPlwiKVxuICAgIC5yZXBsYWNlKC9cXHMrXFxuL2csIFwiXFxuXCIpXG4gICAgLnJlcGxhY2UoL1xcbnszLH0vZywgXCJcXG5cXG5cIilcbiAgICAudHJpbSgpO1xufVxuXG4vLyAvLyAtLS0tLS0tLS0tIEJ1aWxkIE1vZGFsIC0tLS0tLS0tLS1cbi8vIGNsYXNzIEJ1aWxkQmlibGVNb2RhbCBleHRlbmRzIE1vZGFsIHtcbi8vICAgcHJpdmF0ZSBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzO1xuLy8gICBwcml2YXRlIGFwcFJlZjogQXBwO1xuXG4vLyAgIC8vIERhdGEgZnJvbSBsYW5ndWFnZXMuanNvblxuLy8gICBwcml2YXRlIGxhbmdCbG9ja3M6IExhbmd1YWdlc0VudHJ5W10gPSBbXTtcblxuLy8gICAvLyBVSSBzdGF0ZVxuLy8gICBwcml2YXRlIGxhbmd1YWdlS2V5OiBzdHJpbmcgPSBcIkFMTFwiOyAvLyBcIkFMTFwiIG9yIHRoZSBleGFjdCBMYW5ndWFnZXNFbnRyeS5sYW5ndWFnZSBzdHJpbmdcbi8vICAgcHJpdmF0ZSB0cmFuc2xhdGlvbkNvZGU6IHN0cmluZyA9IFwiS0pWXCI7XG4vLyAgIHByaXZhdGUgdHJhbnNsYXRpb25GdWxsOiBzdHJpbmcgPSBcIktpbmcgSmFtZXMgVmVyc2lvblwiO1xuXG4vLyAgIHByaXZhdGUgaW5jbHVkZVZlcnNpb25JbkZpbGVOYW1lOiBib29sZWFuO1xuLy8gICBwcml2YXRlIHZlcnNpb25Bc1N1YmZvbGRlcjogYm9vbGVhbjtcbi8vICAgcHJpdmF0ZSBhdXRvRnJvbnRtYXR0ZXI6IGJvb2xlYW47XG4vLyAgIHByaXZhdGUgY29uY3VycmVuY3k6IG51bWJlciA9IDQ7XG5cbi8vICAgLy8gcHJvZ3Jlc3Ncbi8vICAgcHJpdmF0ZSBwcm9ncmVzc0VsITogSFRNTFByb2dyZXNzRWxlbWVudDtcbi8vICAgcHJpdmF0ZSBzdGF0dXNFbCE6IEhUTUxEaXZFbGVtZW50O1xuLy8gICBwcml2YXRlIHN0YXJ0QnRuITogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4vLyAgIHByaXZhdGUgd29ya2luZyA9IGZhbHNlO1xuXG4vLyAgIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4vLyAgICAgc3VwZXIoYXBwKTtcbi8vICAgICB0aGlzLmFwcFJlZiA9IGFwcDtcbi8vICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG5cbi8vICAgICB0aGlzLmluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZSA9IHNldHRpbmdzLmJpYmxlSW5jbHVkZVZlcnNpb25JbkZpbGVuYW1lID8/IHRydWU7XG4vLyAgICAgdGhpcy52ZXJzaW9uQXNTdWJmb2xkZXIgPSBzZXR0aW5ncy5iaWJsZUluY2x1ZGVWZXJzaW9uSW5GaWxlbmFtZSA/PyB0cnVlO1xuLy8gICAgIHRoaXMuYXV0b0Zyb250bWF0dGVyID0gc2V0dGluZ3MuYmlibGVBZGRGcm9udG1hdHRlciA/PyBmYWxzZTtcbi8vICAgfVxuXG4vLyAgIHByaXZhdGUgdHJhbnNsYXRpb25zRm9yTGFuZ3VhZ2UobGFuZ0tleTogc3RyaW5nKTogTGFuZ3VhZ2VzRW50cnlbXCJ0cmFuc2xhdGlvbnNcIl0ge1xuLy8gICAgIGlmIChsYW5nS2V5ID09PSBcIkFMTFwiKSB7XG4vLyAgICAgICAvLyBmbGF0dGVuIGFsbCB0cmFuc2xhdGlvbnNcbi8vICAgICAgIGNvbnN0IGFsbDogTGFuZ3VhZ2VzRW50cnlbXCJ0cmFuc2xhdGlvbnNcIl0gPSBbXTtcbi8vICAgICAgIGZvciAoY29uc3QgYmxvY2sgb2YgdGhpcy5sYW5nQmxvY2tzKSBhbGwucHVzaCguLi5ibG9jay50cmFuc2xhdGlvbnMpO1xuLy8gICAgICAgLy8gRGUtZHVwIGJ5IHNob3J0X25hbWVcbi8vICAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbi8vICAgICAgIHJldHVybiBhbGwuZmlsdGVyKHQgPT4ge1xuLy8gICAgICAgICBpZiAoc2Vlbi5oYXModC5zaG9ydF9uYW1lKSkgcmV0dXJuIGZhbHNlO1xuLy8gICAgICAgICBzZWVuLmFkZCh0LnNob3J0X25hbWUpO1xuLy8gICAgICAgICByZXR1cm4gdHJ1ZTtcbi8vICAgICAgIH0pLnNvcnQoKGEsYikgPT4gYS5zaG9ydF9uYW1lLmxvY2FsZUNvbXBhcmUoYi5zaG9ydF9uYW1lKSk7XG4vLyAgICAgfVxuLy8gICAgIGNvbnN0IGJsb2NrID0gdGhpcy5sYW5nQmxvY2tzLmZpbmQoYiA9PiBiLmxhbmd1YWdlID09PSBsYW5nS2V5KTtcbi8vICAgICBpZiAoIWJsb2NrKSByZXR1cm4gW107XG4vLyAgICAgcmV0dXJuIGJsb2NrLnRyYW5zbGF0aW9ucy5zbGljZSgpLnNvcnQoKGEsYikgPT4gYS5zaG9ydF9uYW1lLmxvY2FsZUNvbXBhcmUoYi5zaG9ydF9uYW1lKSk7XG4vLyAgIH1cblxuLy8gICBhc3luYyBvbk9wZW4oKSB7XG4vLyAgICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4vLyAgICAgY29udGVudEVsLmVtcHR5KCk7XG4vLyAgICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJCdWlsZCBfQmlibGUgZnJvbSBib2xscy5saWZlXCIpO1xuXG4vLyAgICAgLy8gTG9hZCBsYW5ndWFnZXMuanNvbiAoc2luZ2xlIGNhdGFsb2d1ZSB3ZSBoYXZlKVxuLy8gICAgIHRyeSB7XG4vLyAgICAgICBjb25zdCByYXcgPSBhd2FpdCBmZXRjaEpzb248TGFuZ3VhZ2VzRW50cnlbXT4oQk9MTFMuTEFOR1VBR0VTX1VSTCk7XG4vLyAgICAgICAvLyBmaWx0ZXIgb3V0IGVtcHR5IHRyYW5zbGF0aW9uIGdyb3VwcyBqdXN0IGluIGNhc2Vcbi8vICAgICAgIHRoaXMubGFuZ0Jsb2NrcyA9IChyYXcgfHwgW10pLmZpbHRlcihiID0+IEFycmF5LmlzQXJyYXkoYi50cmFuc2xhdGlvbnMpICYmIGIudHJhbnNsYXRpb25zLmxlbmd0aCA+IDApO1xuLy8gICAgIH0gY2F0Y2ggKGUpIHtcbi8vICAgICAgIGNvbnNvbGUud2FybihcIltCb2xsc10gQ291bGQgbm90IGZldGNoIGxhbmd1YWdlcy5qc29uOlwiLCBlKTtcbi8vICAgICAgIC8vIE1pbmltYWwgRW5nbGlzaCBmYWxsYmFjayBzbyB0aGUgbW9kYWwgc3RpbGwgd29ya3M6XG4vLyAgICAgICB0aGlzLmxhbmdCbG9ja3MgPSBbe1xuLy8gICAgICAgICBsYW5ndWFnZTogXCJFbmdsaXNoXCIsXG4vLyAgICAgICAgIHRyYW5zbGF0aW9uczogW1xuLy8gICAgICAgICAgIHsgc2hvcnRfbmFtZTogXCJLSlZcIiwgZnVsbF9uYW1lOiBcIktpbmcgSmFtZXMgVmVyc2lvbiAxNzY5IHdpdGggQXBvY3J5cGhhIGFuZCBTdHJvbmcncyBOdW1iZXJzXCIgfSxcbi8vICAgICAgICAgICB7IHNob3J0X25hbWU6IFwiV0VCXCIsIGZ1bGxfbmFtZTogXCJXb3JsZCBFbmdsaXNoIEJpYmxlXCIgfSxcbi8vICAgICAgICAgICB7IHNob3J0X25hbWU6IFwiWUxUXCIsIGZ1bGxfbmFtZTogXCJZb3VuZydzIExpdGVyYWwgVHJhbnNsYXRpb24gKDE4OTgpXCIgfSxcbi8vICAgICAgICAgXVxuLy8gICAgICAgfV07XG4vLyAgICAgfVxuXG4vLyAgICAgLy8gTEFOR1VBR0UgUElDS0VSXG4vLyAgICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuLy8gICAgICAgLnNldE5hbWUoXCJMYW5ndWFnZVwiKVxuLy8gICAgICAgLmFkZERyb3Bkb3duKGRkID0+IHtcbi8vICAgICAgICAgKGRkLnNlbGVjdEVsIGFzIEhUTUxFbGVtZW50KS5zdHlsZS5tYXhXaWR0aCA9IFwiMzAwcHhcIjtcbi8vICAgICAgICAgKGRkLnNlbGVjdEVsIGFzIEhUTUxFbGVtZW50KS5zdHlsZS50ZXh0T3ZlcmZsb3cgPSBcImVsbGlwc2lzXCI7XG4vLyAgICAgICAgIChkZC5zZWxlY3RFbCBhcyBIVE1MRWxlbWVudCkuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuLy8gICAgICAgICAoZGQuc2VsZWN0RWwgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLndoaXRlU3BhY2UgPSBcIm5vd3JhcFwiO1xuXG4vLyAgICAgICAgIGRkLmFkZE9wdGlvbihcIkFMTFwiLCBcIkFsbCBsYW5ndWFnZXNcIik7XG4vLyAgICAgICAgIGZvciAoY29uc3QgYmxvY2sgb2YgdGhpcy5sYW5nQmxvY2tzKSB7XG4vLyAgICAgICAgICAgZGQuYWRkT3B0aW9uKGJsb2NrLmxhbmd1YWdlLCBibG9jay5sYW5ndWFnZSk7XG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgZGQuc2V0VmFsdWUodGhpcy5sYW5ndWFnZUtleSk7XG4vLyAgICAgICAgIGRkLm9uQ2hhbmdlKHYgPT4ge1xuLy8gICAgICAgICAgIHRoaXMubGFuZ3VhZ2VLZXkgPSB2O1xuLy8gICAgICAgICAgIHJlYnVpbGRWZXJzaW9ucygpO1xuLy8gICAgICAgICB9KTtcbi8vICAgICAgIH0pO1xuXG4vLyAgICAgLy8gVkVSU0lPTlMgKGR5bmFtaWMpXG4vLyAgICAgY29uc3QgdmVyc2lvbnNDb250YWluZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KCk7XG5cbi8vICAgICBjb25zdCByZWJ1aWxkVmVyc2lvbnMgPSAoKSA9PiB7XG4vLyAgICAgICB2ZXJzaW9uc0NvbnRhaW5lci5lbXB0eSgpO1xuLy8gICAgICAgY29uc3QgbGlzdCA9IHRoaXMudHJhbnNsYXRpb25zRm9yTGFuZ3VhZ2UodGhpcy5sYW5ndWFnZUtleSk7XG4vLyAgICAgICBuZXcgU2V0dGluZyh2ZXJzaW9uc0NvbnRhaW5lcilcbi8vICAgICAgICAgLnNldE5hbWUoXCJWZXJzaW9uXCIpXG4vLyAgICAgICAgIC5hZGREcm9wZG93bihkZCA9PiB7XG4vLyAgICAgICAgICAgKGRkLnNlbGVjdEVsIGFzIEhUTUxFbGVtZW50KS5zdHlsZS5tYXhXaWR0aCA9IFwiMzAwcHhcIjtcbi8vICAgICAgICAgICAoZGQuc2VsZWN0RWwgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLnRleHRPdmVyZmxvdyA9IFwiZWxsaXBzaXNcIjtcbi8vICAgICAgICAgICAoZGQuc2VsZWN0RWwgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjtcbi8vICAgICAgICAgICAoZGQuc2VsZWN0RWwgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLndoaXRlU3BhY2UgPSBcIm5vd3JhcFwiO1xuXG4vLyAgICAgICAgICAgaWYgKCFsaXN0Lmxlbmd0aCkge1xuLy8gICAgICAgICAgICAgZGQuYWRkT3B0aW9uKFwiXCIsIFwiKG5vIHRyYW5zbGF0aW9ucyBmb3IgdGhpcyBsYW5ndWFnZSlcIik7XG4vLyAgICAgICAgICAgICBkZC5zZXRWYWx1ZShcIlwiKTtcbi8vICAgICAgICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICAgIGZvciAoY29uc3QgdCBvZiBsaXN0KSB7XG4vLyAgICAgICAgICAgICAgIGRkLmFkZE9wdGlvbih0LnNob3J0X25hbWUsIGAke3Quc2hvcnRfbmFtZX0gXHUyMDE0ICR7dC5mdWxsX25hbWV9YCk7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAvLyBrZWVwIGV4aXN0aW5nIGlmIHN0aWxsIHByZXNlbnQsIGVsc2UgZmlyc3Rcbi8vICAgICAgICAgICAgIGNvbnN0IGV4aXN0cyA9IGxpc3Quc29tZSh0ID0+IHQuc2hvcnRfbmFtZSA9PT0gdGhpcy50cmFuc2xhdGlvbkNvZGUpO1xuLy8gICAgICAgICAgICAgY29uc3QgY2hvc2VuID0gZXhpc3RzID8gdGhpcy50cmFuc2xhdGlvbkNvZGUgOiBsaXN0WzBdLnNob3J0X25hbWU7XG4vLyAgICAgICAgICAgICBkZC5zZXRWYWx1ZShjaG9zZW4pO1xuLy8gICAgICAgICAgICAgdGhpcy50cmFuc2xhdGlvbkNvZGUgPSBjaG9zZW47XG4vLyAgICAgICAgICAgICBjb25zdCB0ID0gbGlzdC5maW5kKHggPT4geC5zaG9ydF9uYW1lID09PSBjaG9zZW4pO1xuLy8gICAgICAgICAgICAgdGhpcy50cmFuc2xhdGlvbkZ1bGwgPSB0Py5mdWxsX25hbWUgPz8gY2hvc2VuO1xuXG4vLyAgICAgICAgICAgICBkZC5vbkNoYW5nZSh2ID0+IHtcbi8vICAgICAgICAgICAgICAgdGhpcy50cmFuc2xhdGlvbkNvZGUgPSB2O1xuLy8gICAgICAgICAgICAgICBjb25zdCB0dCA9IGxpc3QuZmluZCh4ID0+IHguc2hvcnRfbmFtZSA9PT0gdik7XG4vLyAgICAgICAgICAgICAgIHRoaXMudHJhbnNsYXRpb25GdWxsID0gdHQ/LmZ1bGxfbmFtZSA/PyB2O1xuLy8gICAgICAgICAgICAgfSk7XG4vLyAgICAgICAgICAgfVxuLy8gICAgICAgICB9KVxuLy8gICAgIH07XG5cbi8vICAgICByZWJ1aWxkVmVyc2lvbnMoKTtcblxuLy8gICAgIC8vIE9QVElPTlNcbi8vICAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4vLyAgICAgICAuc2V0TmFtZShcIkFwcGVuZCB2ZXJzaW9uIHRvIGZpbGUgbmFtZVwiKVxuLy8gICAgICAgLnNldERlc2MoYFwiSm9obiAoS0pWKVwiIHZzIFwiSm9oblwiYClcbi8vICAgICAgIC5hZGRUb2dnbGUodCA9PiB0LnNldFZhbHVlKHRoaXMuaW5jbHVkZVZlcnNpb25JbkZpbGVOYW1lKS5vbkNoYW5nZSh2ID0+IHRoaXMuaW5jbHVkZVZlcnNpb25JbkZpbGVOYW1lID0gdikpO1xuXG4vLyAgICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuLy8gICAgICAgLnNldE5hbWUoXCJQbGFjZSBib29rcyB1bmRlciB2ZXJzaW9uIHN1YmZvbGRlclwiKVxuLy8gICAgICAgLnNldERlc2MoYFwiX0JpYmxlL0tKVi9Kb2huIChLSlYpXCIgdnMgXCJfQmlibGUvSm9oblwiYClcbi8vICAgICAgIC5hZGRUb2dnbGUodCA9PiB0LnNldFZhbHVlKHRoaXMudmVyc2lvbkFzU3ViZm9sZGVyKS5vbkNoYW5nZSh2ID0+IHRoaXMudmVyc2lvbkFzU3ViZm9sZGVyID0gdikpO1xuXG4vLyAgICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuLy8gICAgICAgLnNldE5hbWUoXCJBdXRvLWFkZCBmcm9udG1hdHRlclwiKVxuLy8gICAgICAgLnNldERlc2MoXCJJbnNlcnQgWUFNTCB3aXRoIHRpdGxlL3ZlcnNpb24vY3JlYXRlZCBpbnRvIGVhY2ggYm9vayBmaWxlXCIpXG4vLyAgICAgICAuYWRkVG9nZ2xlKHQgPT4gdC5zZXRWYWx1ZSh0aGlzLmF1dG9Gcm9udG1hdHRlcikub25DaGFuZ2UodiA9PiB0aGlzLmF1dG9Gcm9udG1hdHRlciA9IHYpKTtcblxuLy8gICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbi8vICAgICAgIC5zZXROYW1lKFwiQ29uY3VycmVuY3lcIilcbi8vICAgICAgIC5zZXREZXNjKFwiSG93IG1hbnkgY2hhcHRlcnMgdG8gZG93bmxvYWQgaW4gcGFyYWxsZWxcIilcbi8vICAgICAgIC5hZGRTbGlkZXIocyA9PiBzLnNldExpbWl0cygxLCA4LCAxKS5zZXRWYWx1ZSh0aGlzLmNvbmN1cnJlbmN5KS5vbkNoYW5nZSh2ID0+IHRoaXMuY29uY3VycmVuY3kgPSB2KS5zZXREeW5hbWljVG9vbHRpcCgpKTtcblxuLy8gICAgIC8vIFBST0dSRVNTXG4vLyAgICAgY29uc3QgcHJvZ1dyYXAgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcImJvbGxzLXByb2dyZXNzXCIgfSk7XG4vLyAgICAgdGhpcy5wcm9ncmVzc0VsID0gcHJvZ1dyYXAuY3JlYXRlRWwoXCJwcm9ncmVzc1wiLCB7IGF0dHI6IHsgbWF4OiBcIjEwMFwiLCB2YWx1ZTogXCIwXCIsIHN0eWxlOiBcIndpZHRoOjEwMCVcIiB9IH0pO1xuLy8gICAgIHRoaXMuc3RhdHVzRWwgPSBwcm9nV3JhcC5jcmVhdGVEaXYoeyB0ZXh0OiBcIklkbGUuXCIgfSk7XG5cbi8vICAgICAvLyBBQ1RJT05TXG4vLyAgICAgY29uc3QgYnRucyA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwiYm9sbHMtYWN0aW9uc1wiIH0pO1xuLy8gICAgIHRoaXMuc3RhcnRCdG4gPSBidG5zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJTdGFydFwiIH0pO1xuLy8gICAgIHRoaXMuc3RhcnRCdG4ub25jbGljayA9ICgpID0+IHRoaXMuc3RhcnQoKTtcblxuLy8gICAgIGNvbnN0IGNhbmNlbEJ0biA9IGJ0bnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIkNsb3NlXCIgfSk7XG4vLyAgICAgY2FuY2VsQnRuLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNsb3NlKCk7XG4vLyAgIH1cblxuLy8gICBhc3luYyBzdGFydCgpIHtcbi8vICAgICBpZiAodGhpcy53b3JraW5nKSByZXR1cm47XG4vLyAgICAgdGhpcy53b3JraW5nID0gdHJ1ZTtcbi8vICAgICB0aGlzLnN0YXJ0QnRuLmRpc2FibGVkID0gdHJ1ZTtcbi8vICAgICBjb25zdCBjb2RlID0gdGhpcy50cmFuc2xhdGlvbkNvZGUudHJpbSgpO1xuLy8gICAgIGlmICghY29kZSkgeyBuZXcgTm90aWNlKFwiQ2hvb3NlIG9yIGVudGVyIGEgdHJhbnNsYXRpb24gY29kZS5cIik7IHRoaXMud29ya2luZyA9IGZhbHNlOyB0aGlzLnN0YXJ0QnRuLmRpc2FibGVkID0gZmFsc2U7IHJldHVybjsgfVxuXG4vLyAgICAgdHJ5IHtcbi8vICAgICAgIGF3YWl0IGJ1aWxkQmlibGVGcm9tQm9sbHModGhpcy5hcHBSZWYsIHtcbi8vICAgICAgICAgdHJhbnNsYXRpb25Db2RlOiBjb2RlLFxuLy8gICAgICAgICB0cmFuc2xhdGlvbkZ1bGw6IHRoaXMudHJhbnNsYXRpb25GdWxsIHx8IGNvZGUsXG4vLyAgICAgICAgIGluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZTogdGhpcy5pbmNsdWRlVmVyc2lvbkluRmlsZU5hbWUsXG4vLyAgICAgICAgIHZlcnNpb25Bc1N1YmZvbGRlcjogdGhpcy52ZXJzaW9uQXNTdWJmb2xkZXIsXG4vLyAgICAgICAgIGF1dG9Gcm9udG1hdHRlcjogdGhpcy5hdXRvRnJvbnRtYXR0ZXIsXG4vLyAgICAgICAgIGNvbmN1cnJlbmN5OiB0aGlzLmNvbmN1cnJlbmN5LFxuLy8gICAgICAgfSwgKGRvbmUsIHRvdGFsLCBtc2cpID0+IHtcbi8vICAgICAgICAgdGhpcy5wcm9ncmVzc0VsLm1heCA9IHRvdGFsO1xuLy8gICAgICAgICB0aGlzLnByb2dyZXNzRWwudmFsdWUgPSBkb25lO1xuLy8gICAgICAgICB0aGlzLnN0YXR1c0VsLnNldFRleHQoYCR7ZG9uZX0vJHt0b3RhbH0gXHUwMEI3ICR7bXNnfWApO1xuLy8gICAgICAgfSk7XG4vLyAgICAgICB0aGlzLnN0YXR1c0VsLnNldFRleHQoXCJEb25lLlwiKTtcbi8vICAgICB9IGNhdGNoIChlOmFueSkge1xuLy8gICAgICAgY29uc29sZS5lcnJvcihlKTtcbi8vICAgICAgIG5ldyBOb3RpY2UoYEJpYmxlIGJ1aWxkIGZhaWxlZDogJHtlPy5tZXNzYWdlID8/IGV9YCk7XG4vLyAgICAgfSBmaW5hbGx5IHtcbi8vICAgICAgIHRoaXMud29ya2luZyA9IGZhbHNlO1xuLy8gICAgICAgdGhpcy5zdGFydEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xuLy8gICAgIH1cbi8vICAgfVxuLy8gfVxuXG4vLyAtLS0tLS0tLS0tIEJ1aWxkZXIgY29yZSAtLS0tLS0tLS0tXG50eXBlIEJ1aWxkT3B0aW9ucyA9IHtcbiAgdHJhbnNsYXRpb25Db2RlOiBzdHJpbmc7XG4gIHRyYW5zbGF0aW9uRnVsbDogc3RyaW5nO1xuICBpbmNsdWRlVmVyc2lvbkluRmlsZU5hbWU6IGJvb2xlYW47XG4gIHZlcnNpb25Bc1N1YmZvbGRlcjogYm9vbGVhbjtcbiAgYXV0b0Zyb250bWF0dGVyOiBib29sZWFuO1xuICBjb25jdXJyZW5jeTogbnVtYmVyO1xufTtcbnR5cGUgUHJvZ3Jlc3NGbiA9IChkb25lOiBudW1iZXIsIHRvdGFsOiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZDtcblxuZnVuY3Rpb24gbm93SXNvRGF0ZSgpOiBzdHJpbmcge1xuICBjb25zdCBkID0gbmV3IERhdGUoKTtcbiAgY29uc3QgbW0gPSBTdHJpbmcoZC5nZXRNb250aCgpKzEpLnBhZFN0YXJ0KDIsXCIwXCIpO1xuICBjb25zdCBkZCA9IFN0cmluZyhkLmdldERhdGUoKSkucGFkU3RhcnQoMixcIjBcIik7XG4gIHJldHVybiBgJHtkLmdldEZ1bGxZZWFyKCl9LSR7bW19LSR7ZGR9YDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW5zdXJlRm9sZGVyKGFwcDogQXBwLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRGb2xkZXI+IHtcbiAgY29uc3QgbnAgPSBub3JtYWxpemVQYXRoKHBhdGgucmVwbGFjZSgvXFwvKyQvLFwiXCIpKTtcbiAgbGV0IGYgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5wKTtcbiAgaWYgKGYgaW5zdGFuY2VvZiBURm9sZGVyKSByZXR1cm4gZjtcbiAgYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihucCk7XG4gIGNvbnN0IGNyZWF0ZWQgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5wKTtcbiAgaWYgKGNyZWF0ZWQgaW5zdGFuY2VvZiBURm9sZGVyKSByZXR1cm4gY3JlYXRlZDtcbiAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gY3JlYXRlIGZvbGRlcjogJHtucH1gKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRCb29rRmlsZW5hbWUoYmFzZVNob3J0OiBzdHJpbmcsIGNvZGU6IHN0cmluZywgaW5jbHVkZVZlcnNpb246IGJvb2xlYW4pOiBzdHJpbmcge1xuICByZXR1cm4gaW5jbHVkZVZlcnNpb24gPyBgJHtiYXNlU2hvcnR9ICgke2NvZGV9KWAgOiBiYXNlU2hvcnQ7XG59XG5cbmZ1bmN0aW9uIGNoYXB0ZXJOYXZMaW5lKGJvb2tTaG9ydDogc3RyaW5nLCBjaGFwdGVyczogbnVtYmVyKTogc3RyaW5nIHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG4gIGZvciAobGV0IGM9MTsgYzw9Y2hhcHRlcnM7IGMrKykge1xuICAgIGNvbnN0IGxhYiA9IChjICUgNSA9PT0gMCB8fCBjID09PSAxIHx8IGMgPT09IGNoYXB0ZXJzKSA/IFN0cmluZyhjKSA6IFwiXHUyMDIyXCI7XG4gICAgcGFydHMucHVzaChgW1ske2Jvb2tTaG9ydH0jXiR7Y318JHtsYWJ9XV1gKTtcbiAgfVxuICByZXR1cm4gYFxcbioqY2guKiogJHtwYXJ0cy5qb2luKFwiIFwiKX1cXG5gO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYnVpbGRCaWJsZUZyb21Cb2xscyhhcHA6IEFwcCwgb3B0czogQnVpbGRPcHRpb25zLCBvblByb2dyZXNzOiBQcm9ncmVzc0ZuKSB7XG4gIGNvbnN0IGJhc2VGb2xkZXIgPSBcIl9CaWJsZVwiO1xuICBjb25zdCByb290ID0gYXdhaXQgZW5zdXJlRm9sZGVyKGFwcCwgYmFzZUZvbGRlcik7XG4gIGNvbnN0IHBhcmVudCA9IG9wdHMudmVyc2lvbkFzU3ViZm9sZGVyXG4gICAgPyBhd2FpdCBlbnN1cmVGb2xkZXIoYXBwLCBgJHtiYXNlRm9sZGVyfS8ke29wdHMudHJhbnNsYXRpb25Db2RlfWApXG4gICAgOiByb290O1xuXG4gIGxldCBib29rczogQm9sbHNCb29rTWV0YVtdID0gW107XG4gIHRyeSB7XG4gICAgYm9va3MgPSBhd2FpdCBmZXRjaEpzb248Qm9sbHNCb29rTWV0YVtdPihCT0xMUy5HRVRfQk9PS1Mob3B0cy50cmFuc2xhdGlvbkNvZGUpKTtcbiAgfSBjYXRjaCAoZTphbnkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBsb2FkIGJvb2tzIGZvciAke29wdHMudHJhbnNsYXRpb25Db2RlfTogJHtlPy5tZXNzYWdlID8/IGV9YCk7XG4gIH1cbiAgaWYgKCFib29rcy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihcIk5vIGJvb2tzIHJldHVybmVkIGZyb20gQVBJLlwiKTtcblxuICBjb25zdCB0b3RhbCA9IGJvb2tzLnJlZHVjZSgoYWNjLGIpPT5hY2MgKyAoYi5jaGFwdGVyc3x8MCksIDApO1xuICBsZXQgZG9uZSA9IDA7XG5cbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgYm9vayBvZiBib29rcykge1xuICAgIGNvbnN0IHNob3J0Qm9vayA9IHNob3J0QWJickZvcihib29rLmJvb2tpZCwgYm9vay5uYW1lKTtcbiAgICBjb25zdCBzaG9ydFdpdGhBYmJyID0gYCR7c2hvcnRCb29rfSR7b3B0cy5pbmNsdWRlVmVyc2lvbkluRmlsZU5hbWUgPyBgICgke29wdHMudHJhbnNsYXRpb25Db2RlfSlgIDogXCJcIn1gO1xuICAgIGNvbnN0IGZpbGVCYXNlID0gYnVpbGRCb29rRmlsZW5hbWUoc2hvcnRCb29rLCBvcHRzLnRyYW5zbGF0aW9uQ29kZSwgb3B0cy5pbmNsdWRlVmVyc2lvbkluRmlsZU5hbWUpO1xuICAgIGNvbnN0IHRhcmdldFBhdGggPSBub3JtYWxpemVQYXRoKGAke3BhcmVudC5wYXRofS8ke2ZpbGVCYXNlfS5tZGApO1xuXG4gICAgY29uc3QgaGVhZGVyTGluZXM6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKG9wdHMuYXV0b0Zyb250bWF0dGVyKSB7XG4gICAgICBoZWFkZXJMaW5lcy5wdXNoKFxuICAgICAgICBcIi0tLVwiLFxuICAgICAgICBgdGl0bGU6IFwiJHtzaG9ydFdpdGhBYmJyfVwiYCxcbiAgICAgICAgYGJpYmxlX3RyYW5zbGF0aW9uX2NvZGU6IFwiJHtvcHRzLnRyYW5zbGF0aW9uQ29kZX1cImAsXG4gICAgICAgIGBiaWJsZV90cmFuc2xhdGlvbl9uYW1lOiBcIiR7b3B0cy50cmFuc2xhdGlvbkZ1bGx9XCJgLFxuICAgICAgICBgY3JlYXRlZDogJHtub3dJc29EYXRlKCl9YCxcbiAgICAgICAgXCItLS1cIixcbiAgICAgICAgXCJcIlxuICAgICAgKTtcbiAgICB9XG4gICAgaGVhZGVyTGluZXMucHVzaChgIyAke3Nob3J0V2l0aEFiYnJ9YCk7XG4gICAgaGVhZGVyTGluZXMucHVzaChjaGFwdGVyTmF2TGluZShzaG9ydFdpdGhBYmJyLCBib29rLmNoYXB0ZXJzKSk7XG4gICAgaGVhZGVyTGluZXMucHVzaChcIlwiKTtcblxuICAgIGNvbnN0IGNodW5rczogc3RyaW5nW10gPSBbaGVhZGVyTGluZXMuam9pbihcIlxcblwiKV07XG5cbiAgICBjb25zdCBxdWV1ZSA9IEFycmF5LmZyb20oe2xlbmd0aDogYm9vay5jaGFwdGVyc30sIChfLGkpPT5pKzEpO1xuICAgIGNvbnN0IGNvbmN1cnJlbmN5ID0gTWF0aC5tYXgoMSwgTWF0aC5taW4oOCwgb3B0cy5jb25jdXJyZW5jeSB8fCA0KSk7XG5cbiAgICAvLyBTaW1wbGUgcG9vbFxuICAgIGxldCBuZXh0ID0gMDtcbiAgICBjb25zdCB3b3JrZXJzID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBjb25jdXJyZW5jeX0sICgpID0+IChhc3luYyAoKSA9PiB7XG4gICAgICB3aGlsZSAobmV4dCA8IHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBjaCA9IHF1ZXVlW25leHQrK107XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgb25Qcm9ncmVzcyhkb25lLCB0b3RhbCwgYCR7c2hvcnRXaXRoQWJicn0gJHtjaH0vJHtib29rLmNoYXB0ZXJzfWApO1xuICAgICAgICAgIGNvbnN0IHZlcnNlcyA9IGF3YWl0IGZldGNoSnNvbjxCb2xsc1ZlcnNlW10+KEJPTExTLkdFVF9DSEFQVEVSKG9wdHMudHJhbnNsYXRpb25Db2RlLCBib29rLmJvb2tpZCwgY2gpKTtcbiAgICAgICAgICBjb25zdCBtYXhWID0gTWF0aC5tYXgoMCwgLi4udmVyc2VzLm1hcCh2ID0+IHYudmVyc2UpKTtcblxuICAgICAgICAgIGNvbnN0IHZ2TmF2ID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBtYXhWfSwgKF8saSk9PmkrMSlcbiAgICAgICAgICAgIC5tYXAodiA9PiBgW1ske3Nob3J0V2l0aEFiYnJ9I14ke2NofS0ke3Z9fCR7diAlIDUgPT09IDAgPyB2IDogXCJcdTIwMjJcIn1dXWApLmpvaW4oXCIgXCIpO1xuXG4gICAgICAgICAgY29uc3QgcHJldkxpbmsgPSBjaCA+IDEgPyBgW1ske3Nob3J0V2l0aEFiYnJ9I14ke2NoLTF9fDwtIFByZXZpb3VzXV1gIDogXCJcdTIxOTBcIjtcbiAgICAgICAgICBjb25zdCBuZXh0TGluayA9IGNoIDwgYm9vay5jaGFwdGVycyA/IGBbWyR7c2hvcnRXaXRoQWJicn0jXiR7Y2grMX18TmV4dCAtPl1dYCA6IFwiXHUyMTkyXCI7XG4gICAgICAgICAgY29uc3QgbWlkID0gYFtbJHtzaG9ydFdpdGhBYmJyfSMke3Nob3J0V2l0aEFiYnJ9fCR7c2hvcnRCb29rfSAke2NofSBvZiAke2Jvb2suY2hhcHRlcnN9XV1gO1xuXG4gICAgICAgICAgY29uc3QgdG9wID0gW1xuICAgICAgICAgICAgXCItLS1cIixcbiAgICAgICAgICAgIGAke3ByZXZMaW5rfSB8ICR7bWlkfSB8ICR7bmV4dExpbmt9IHwgKip2di4qKiAke3Z2TmF2fSBeJHtjaH1gLFxuICAgICAgICAgICAgXCJcXG4tLS1cXG5cIixcbiAgICAgICAgICAgIFwiXCJcbiAgICAgICAgICBdLmpvaW4oXCJcXG5cIik7XG5cbiAgICAgICAgICBjb25zdCB2ZXJzZXNNZCA9IHZlcnNlcy5tYXAodiA9PiB7XG4gICAgICAgICAgICBjb25zdCBwbGFpbiA9IGh0bWxUb1RleHQodi50ZXh0KS50cmltKCk7XG4gICAgICAgICAgICByZXR1cm4gYCoqJHtzaG9ydFdpdGhBYmJyfSAke2NofToke3YudmVyc2V9KiogLSAke3BsYWlufSBeJHtjaH0tJHt2LnZlcnNlfWA7XG4gICAgICAgICAgfSkuam9pbihcIlxcblxcblwiKTtcblxuICAgICAgICAgIGNodW5rc1tjaF0gPSBgJHt0b3B9JHt2ZXJzZXNNZH1cXG5cXG5gO1xuICAgICAgICB9IGNhdGNoIChlOmFueSkge1xuICAgICAgICAgIGVycm9ycy5wdXNoKGBbJHtvcHRzLnRyYW5zbGF0aW9uQ29kZX1dICR7c2hvcnRCb29rfSBjaC4ke2NofTogJHtlPy5tZXNzYWdlID8/IGV9YCk7XG4gICAgICAgICAgY2h1bmtzW2NoXSA9IGAtLS1cXG4oJHtzaG9ydEJvb2t9ICR7Y2h9KSBcdTIwMTQgZmFpbGVkIHRvIGRvd25sb2FkLlxcbl4ke2NofVxcbi0tLVxcblxcbmA7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgZG9uZSsrOyBvblByb2dyZXNzKGRvbmUsIHRvdGFsLCBgJHtzaG9ydEJvb2t9ICR7TWF0aC5taW4oY2gsIGJvb2suY2hhcHRlcnMpfS8ke2Jvb2suY2hhcHRlcnN9YCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KSgpKTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbCh3b3JrZXJzKTtcblxuICAgIGNvbnN0IGJvb2tDb250ZW50ID0gY2h1bmtzLmpvaW4oXCJcIik7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHRhcmdldFBhdGgpO1xuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGV4aXN0aW5nLCBib29rQ29udGVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IGFwcC52YXVsdC5jcmVhdGUodGFyZ2V0UGF0aCwgYm9va0NvbnRlbnQpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChlcnJvcnMubGVuZ3RoKSB7XG4gICAgLy8gY29uc3QgbG9nRm9sZGVyID0gYXdhaXQgZW5zdXJlRm9sZGVyKGFwcCwgYCR7YmFzZUZvbGRlcn0vX2xvZ3NgKTtcbiAgICAvLyBjb25zdCBsb2dQYXRoID0gbm9ybWFsaXplUGF0aChgJHtsb2dGb2xkZXIucGF0aH0vYmlibGUtYnVpbGQtJHtvcHRzLnRyYW5zbGF0aW9uQ29kZX0tJHtEYXRlLm5vdygpfS5tZGApO1xuICAgIC8vIGNvbnN0IGJvZHkgPSBbXG4gICAgLy8gICBgIyBCdWlsZCBMb2cgXHUyMDE0ICR7b3B0cy50cmFuc2xhdGlvbkNvZGV9YCxcbiAgICAvLyAgIGBEYXRlOiAke25ldyBEYXRlKCkudG9TdHJpbmcoKX1gLFxuICAgIC8vICAgXCJcIixcbiAgICAvLyAgIC4uLmVycm9ycy5tYXAoZSA9PiBgLSAke2V9YClcbiAgICAvLyBdLmpvaW4oXCJcXG5cIik7XG4gICAgLy8gYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZShsb2dQYXRoLCBib2R5KTtcbiAgICAvLyBuZXcgTm90aWNlKGBGaW5pc2hlZCB3aXRoICR7ZXJyb3JzLmxlbmd0aH0gZXJyb3IocykuIFNlZTogJHtsb2dQYXRofWApO1xuICAgIG5ldyBOb3RpY2UoYEZpbmlzaGVkIHdpdGggJHtlcnJvcnMubGVuZ3RofSBlcnJvcihzKS5gKTtcbiAgfSBlbHNlIHtcbiAgICBuZXcgTm90aWNlKFwiRmluaXNoZWQgd2l0aG91dCBlcnJvcnMuXCIpO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0gQ29tbWFuZCBlbnRyeSAtLS0tLS0tLS0tXG5leHBvcnQgZnVuY3Rpb24gY29tbWFuZEJ1aWxkQmlibGVGcm9tQm9sbHMoYXBwOiBBcHAsIF9zZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIG5ldyBCdWlsZEJpYmxlTW9kYWwoYXBwLCBfc2V0dGluZ3MpLm9wZW4oKTtcbn0iLCAiZXhwb3J0IGNvbnN0IEJPT0tfQUJCUjogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgXCJHZW5lc2lzXCI6IFwiR2VuXCIsXG4gIFwiRXhvZHVzXCI6IFwiRXhvXCIsXG4gIFwiTGV2aXRpY3VzXCI6IFwiTGV2XCIsXG4gIFwiTnVtYmVyc1wiOiBcIk51bVwiLFxuICBcIkRldXRlcm9ub215XCI6IFwiRGV1dFwiLFxuICBcIkpvc2h1YVwiOiBcIkpvc2hcIixcbiAgXCJKdWRnZXNcIjogXCJKdWRnXCIsXG4gIFwiUnV0aFwiOiBcIlJ1dGhcIixcbiAgXCIxIFNhbXVlbFwiOiBcIjEgU2FtXCIsXG4gIFwiRmlyc3QgU2FtdWVsXCI6IFwiMSBTYW1cIixcbiAgXCIyIFNhbXVlbFwiOiBcIjIgU2FtXCIsXG4gIFwiU2Vjb25kIFNhbXVlbFwiOiBcIjIgU2FtXCIsXG4gIFwiMSBLaW5nc1wiOiBcIjEgS2luZ3NcIixcbiAgXCJGaXJzdCBLaW5nc1wiOiBcIjEgS2luZ3NcIixcbiAgXCIyIEtpbmdzXCI6IFwiMiBLaW5nc1wiLFxuICBcIlNlY29uZCBLaW5nc1wiOiBcIjIgS2luZ3NcIixcbiAgXCIxIENocm9uaWNsZXNcIjogXCIxIENocm9uXCIsXG4gIFwiRmlyc3QgQ2hyb25pY2xlc1wiOiBcIjEgQ2hyb25cIixcbiAgXCIyIENocm9uaWNsZXNcIjogXCIyIENocm9uXCIsXG4gIFwiU2Vjb25kIENocm9uaWNsZXNcIjogXCIyIENocm9uXCIsXG4gIFwiRXpyYVwiOiBcIkV6cmFcIixcbiAgXCJOZWhlbWlhaFwiOiBcIk5laFwiLFxuICBcIkVzdGhlclwiOiBcIkVzdGhcIixcbiAgXCJKb2JcIjogXCJKb2JcIixcbiAgXCJQc2FsbXNcIjogXCJQc2FcIixcbiAgXCJQc2FsbVwiOiBcIlBzYVwiLFxuICBcIlByb3ZlcmJzXCI6IFwiUHJvdlwiLFxuICBcIkVjY2xlc2lhc3Rlc1wiOiBcIkVjY2xcIixcbiAgXCJTb25nIG9mIFNvbmdzXCI6IFwiUy5TLlwiLFxuICBcIlNvbmcgb2YgU29sb21vblwiOiBcIlMuUy5cIixcbiAgXCJJc2FpYWhcIjogXCJJc2FcIixcbiAgXCJKZXJlbWlhaFwiOiBcIkplclwiLFxuICBcIkxhbWVudGF0aW9uc1wiOiBcIkxhbVwiLFxuICBcIkV6ZWtpZWxcIjogXCJFemVrXCIsXG4gIFwiRGFuaWVsXCI6IFwiRGFuXCIsXG4gIFwiSG9zZWFcIjogXCJIb3NlYVwiLFxuICBcIkpvZWxcIjogXCJKb2VsXCIsXG4gIFwiQW1vc1wiOiBcIkFtb3NcIixcbiAgXCJPYmFkaWFoXCI6IFwiT2JhZFwiLFxuICBcIkpvbmFoXCI6IFwiSm9uYWhcIixcbiAgXCJNaWNhaFwiOiBcIk1pY2FoXCIsXG4gIFwiTmFodW1cIjogXCJOYWh1bVwiLFxuICBcIkhhYmFra3VrXCI6IFwiSGFiXCIsXG4gIFwiWmVwaGFuaWFoXCI6IFwiWmVwaFwiLFxuICBcIkhhZ2dhaVwiOiBcIkhhZ1wiLFxuICBcIlplY2hhcmlhaFwiOiBcIlplY2hcIixcbiAgXCJNYWxhY2hpXCI6IFwiTWFsXCIsXG4gIFwiTWF0dGhld1wiOiBcIk1hdHRcIixcbiAgXCJNYXJrXCI6IFwiTWFya1wiLFxuICBcIkx1a2VcIjogXCJMdWtlXCIsXG4gIFwiSm9oblwiOiBcIkpvaG5cIixcbiAgXCJBY3RzXCI6IFwiQWN0c1wiLFxuICBcIlJvbWFuc1wiOiBcIlJvbVwiLFxuICBcIjEgQ29yaW50aGlhbnNcIjogXCIxIENvclwiLFxuICBcIkZpcnN0IENvcmludGhpYW5zXCI6IFwiMSBDb3JcIixcbiAgXCIyIENvcmludGhpYW5zXCI6IFwiMiBDb3JcIixcbiAgXCJTZWNvbmQgQ29yaW50aGlhbnNcIjogXCIyIENvclwiLFxuICBcIkdhbGF0aWFuc1wiOiBcIkdhbFwiLFxuICBcIkVwaGVzaWFuc1wiOiBcIkVwaFwiLFxuICBcIlBoaWxpcHBpYW5zXCI6IFwiUGhpbFwiLFxuICBcIkNvbG9zc2lhbnNcIjogXCJDb2xcIixcbiAgXCIxIFRoZXNzYWxvbmlhbnNcIjogXCIxIFRoZXNcIixcbiAgXCJGaXJzdCBUaGVzc2Fsb25pYW5zXCI6IFwiMSBUaGVzXCIsXG4gIFwiMiBUaGVzc2Fsb25pYW5zXCI6IFwiMiBUaGVzXCIsXG4gIFwiU2Vjb25kIFRoZXNzYWxvbmlhbnNcIjogXCIyIFRoZXNcIixcbiAgXCIxIFRpbW90aHlcIjogXCIxIFRpbVwiLFxuICBcIkZpcnN0IFRpbW90aHlcIjogXCIxIFRpbVwiLFxuICBcIjIgVGltb3RoeVwiOiBcIjIgVGltXCIsXG4gIFwiU2Vjb25kIFRpbW90aHlcIjogXCIyIFRpbVwiLFxuICBcIlRpdHVzXCI6IFwiVGl0dXNcIixcbiAgXCJQaGlsZW1vblwiOiBcIlBoaWxlbVwiLFxuICBcIkhlYnJld3NcIjogXCJIZWJcIixcbiAgXCJKYW1lc1wiOiBcIkphbWVzXCIsXG4gIFwiMSBQZXRlclwiOiBcIjEgUGV0XCIsXG4gIFwiRmlyc3QgUGV0ZXJcIjogXCIxIFBldFwiLFxuICBcIjIgUGV0ZXJcIjogXCIyIFBldFwiLFxuICBcIlNlY29uZCBQZXRlclwiOiBcIjIgUGV0XCIsXG4gIFwiMSBKb2huXCI6IFwiMSBKb2huXCIsXG4gIFwiRmlyc3QgSm9oblwiOiBcIjEgSm9oblwiLFxuICBcIjIgSm9oblwiOiBcIjIgSm9oblwiLFxuICBcIlNlY29uZCBKb2huXCI6IFwiMiBKb2huXCIsXG4gIFwiMyBKb2huXCI6IFwiMyBKb2huXCIsXG4gIFwiVGhpcmQgSm9oblwiOiBcIjMgSm9oblwiLFxuICBcIkp1ZGVcIjogXCJKdWRlXCIsXG4gIFwiUmV2ZWxhdGlvblwiOiBcIlJldlwiXG59O1xuXG5leHBvcnQgY29uc3QgQUxMX0JPT0tfVE9LRU5TID0gKCgpID0+IHtcbiAgY29uc3Qgc2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKEJPT0tfQUJCUikpIHsgc2V0LmFkZChrKTsgc2V0LmFkZCh2KTsgfVxuICByZXR1cm4gWy4uLnNldF0uc29ydCgoYSwgYikgPT4gYi5sZW5ndGggLSBhLmxlbmd0aCk7XG59KSgpO1xuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIFNldHRpbmcsIE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IEJhc2VCb2xsc01vZGFsIH0gZnJvbSBcIi4vYm9sbHMtYmFzZS1tb2RhbFwiO1xuaW1wb3J0IHsgYnVpbGRCaWJsZUZyb21Cb2xscyB9IGZyb20gXCIuLi9jb21tYW5kcy9nZW5lcmF0ZUJpYmxlXCI7IC8vIHlvdXIgYnVpbGRlciBmblxuXG5leHBvcnQgY2xhc3MgQnVpbGRCaWJsZU1vZGFsIGV4dGVuZHMgQmFzZUJvbGxzTW9kYWwge1xuICBwcml2YXRlIGluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZTogYm9vbGVhbjtcbiAgcHJpdmF0ZSB2ZXJzaW9uQXNTdWJmb2xkZXI6IGJvb2xlYW47XG4gIHByaXZhdGUgYXV0b0Zyb250bWF0dGVyOiBib29sZWFuO1xuICBwcml2YXRlIGNvbmN1cnJlbmN5OiBudW1iZXIgPSA0O1xuXG4gIC8vIHByb2dyZXNzXG4gIHByaXZhdGUgcHJvZ3Jlc3NFbCE6IEhUTUxQcm9ncmVzc0VsZW1lbnQ7XG4gIHByaXZhdGUgc3RhdHVzRWwhOiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSBzdGFydEJ0biE6IEhUTUxCdXR0b25FbGVtZW50O1xuICBwcml2YXRlIHdvcmtpbmcgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuICAgIHN1cGVyKGFwcCwgc2V0dGluZ3MsIHtcbiAgICAgIGxhbmd1YWdlTGFiZWw6IHNldHRpbmdzLmJpYmxlRGVmYXVsdExhbmd1YWdlID8/IG51bGwsXG4gICAgICB2ZXJzaW9uU2hvcnQ6IHNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb24gPz8gbnVsbCxcbiAgICB9KTtcblxuICAgIHRoaXMuaW5jbHVkZVZlcnNpb25JbkZpbGVOYW1lID0gc2V0dGluZ3MuYmlibGVJbmNsdWRlVmVyc2lvbkluRmlsZW5hbWUgPz8gdHJ1ZTtcbiAgICB0aGlzLnZlcnNpb25Bc1N1YmZvbGRlciAgICAgICA9IHNldHRpbmdzLmJpYmxlSW5jbHVkZVZlcnNpb25JbkZpbGVuYW1lID8/IHRydWU7XG4gICAgdGhpcy5hdXRvRnJvbnRtYXR0ZXIgICAgICAgICAgPSBzZXR0aW5ncy5iaWJsZUFkZEZyb250bWF0dGVyICAgICAgICAgICA/PyBmYWxzZTtcbiAgfVxuXG4gIHByb3RlY3RlZCByZW5kZXJFeHRyYU9wdGlvbnMoY29udGVudEVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5zZXROYW1lKFwiQXBwZW5kIHZlcnNpb24gdG8gZmlsZSBuYW1lXCIpXG4gICAgICAuc2V0RGVzYyhgXCJKb2huIChLSlYpXCIgdnMgXCJKb2huXCJgKVxuICAgICAgLmFkZFRvZ2dsZSh0ID0+IHQuc2V0VmFsdWUodGhpcy5pbmNsdWRlVmVyc2lvbkluRmlsZU5hbWUpLm9uQ2hhbmdlKHYgPT4gdGhpcy5pbmNsdWRlVmVyc2lvbkluRmlsZU5hbWUgPSB2KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIlBsYWNlIGJvb2tzIHVuZGVyIHZlcnNpb24gc3ViZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhgXCJfQmlibGUvS0pWL0pvaG4gKEtKVilcIiB2cyBcIl9CaWJsZS9Kb2huXCJgKVxuICAgICAgLmFkZFRvZ2dsZSh0ID0+IHQuc2V0VmFsdWUodGhpcy52ZXJzaW9uQXNTdWJmb2xkZXIpLm9uQ2hhbmdlKHYgPT4gdGhpcy52ZXJzaW9uQXNTdWJmb2xkZXIgPSB2KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIkF1dG8tYWRkIGZyb250bWF0dGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkluc2VydCBZQU1MIHdpdGggdGl0bGUvdmVyc2lvbi9jcmVhdGVkIGludG8gZWFjaCBib29rIGZpbGVcIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0LnNldFZhbHVlKHRoaXMuYXV0b0Zyb250bWF0dGVyKS5vbkNoYW5nZSh2ID0+IHRoaXMuYXV0b0Zyb250bWF0dGVyID0gdikpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJDb25jdXJyZW5jeVwiKVxuICAgICAgLnNldERlc2MoXCJIb3cgbWFueSBjaGFwdGVycyB0byBkb3dubG9hZCBpbiBwYXJhbGxlbFwiKVxuICAgICAgLmFkZFNsaWRlcihzID0+IHMuc2V0TGltaXRzKDEsIDgsIDEpLnNldFZhbHVlKHRoaXMuY29uY3VycmVuY3kpLm9uQ2hhbmdlKHYgPT4gdGhpcy5jb25jdXJyZW5jeSA9IHYpLnNldER5bmFtaWNUb29sdGlwKCkpO1xuICB9XG5cbiAgcHJvdGVjdGVkIHJlbmRlckZvb3Rlcihjb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgcHJvZ1dyYXAgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcImJvbGxzLXByb2dyZXNzXCIgfSk7XG4gICAgdGhpcy5wcm9ncmVzc0VsID0gcHJvZ1dyYXAuY3JlYXRlRWwoXCJwcm9ncmVzc1wiLCB7IGF0dHI6IHsgbWF4OiBcIjEwMFwiLCB2YWx1ZTogXCIwXCIsIHN0eWxlOiBcIndpZHRoOjEwMCVcIiB9IH0pO1xuICAgIHRoaXMuc3RhdHVzRWwgPSBwcm9nV3JhcC5jcmVhdGVEaXYoeyB0ZXh0OiBcIklkbGUuXCIgfSk7XG5cbiAgICBjb25zdCBidG5zID0gY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJib2xscy1hY3Rpb25zXCIgfSk7XG4gICAgdGhpcy5zdGFydEJ0biA9IGJ0bnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlN0YXJ0XCIgfSk7XG4gICAgdGhpcy5zdGFydEJ0bi5vbmNsaWNrID0gKCkgPT4gdGhpcy5zdGFydCgpO1xuXG4gICAgY29uc3QgY2FuY2VsQnRuID0gYnRucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiQ2xvc2VcIiB9KTtcbiAgICBjYW5jZWxCdG4ub25jbGljayA9ICgpID0+IHRoaXMuY2xvc2UoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc3RhcnQoKSB7XG4gICAgaWYgKHRoaXMud29ya2luZykgcmV0dXJuO1xuICAgIHRoaXMud29ya2luZyA9IHRydWU7XG4gICAgdGhpcy5zdGFydEJ0bi5kaXNhYmxlZCA9IHRydWU7XG5cbiAgICBjb25zdCBjb2RlID0gdGhpcy50cmFuc2xhdGlvbkNvZGUudHJpbSgpO1xuICAgIGlmICghY29kZSkgeyBuZXcgTm90aWNlKFwiQ2hvb3NlIGEgdHJhbnNsYXRpb24gY29kZS5cIik7IHRoaXMud29ya2luZyA9IGZhbHNlOyB0aGlzLnN0YXJ0QnRuLmRpc2FibGVkID0gZmFsc2U7IHJldHVybjsgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGJ1aWxkQmlibGVGcm9tQm9sbHModGhpcy5hcHAsIHtcbiAgICAgICAgdHJhbnNsYXRpb25Db2RlOiBjb2RlLFxuICAgICAgICB0cmFuc2xhdGlvbkZ1bGw6IHRoaXMudHJhbnNsYXRpb25GdWxsIHx8IGNvZGUsXG4gICAgICAgIGluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZTogdGhpcy5pbmNsdWRlVmVyc2lvbkluRmlsZU5hbWUsXG4gICAgICAgIHZlcnNpb25Bc1N1YmZvbGRlcjogdGhpcy52ZXJzaW9uQXNTdWJmb2xkZXIsXG4gICAgICAgIGF1dG9Gcm9udG1hdHRlcjogdGhpcy5hdXRvRnJvbnRtYXR0ZXIsXG4gICAgICAgIGNvbmN1cnJlbmN5OiB0aGlzLmNvbmN1cnJlbmN5LFxuICAgICAgfSwgKGRvbmU6IG51bWJlciwgdG90YWw6IG51bWJlciwgbXNnOiBhbnkpID0+IHtcbiAgICAgICAgdGhpcy5wcm9ncmVzc0VsLm1heCA9IHRvdGFsO1xuICAgICAgICB0aGlzLnByb2dyZXNzRWwudmFsdWUgPSBkb25lO1xuICAgICAgICB0aGlzLnN0YXR1c0VsLnNldFRleHQoYCR7ZG9uZX0vJHt0b3RhbH0gXHUwMEI3ICR7bXNnfWApO1xuICAgICAgfSk7XG4gICAgICB0aGlzLnN0YXR1c0VsLnNldFRleHQoXCJEb25lLlwiKTtcbiAgICB9IGNhdGNoIChlOmFueSkge1xuICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgIG5ldyBOb3RpY2UoYEJpYmxlIGJ1aWxkIGZhaWxlZDogJHtlPy5tZXNzYWdlID8/IGV9YCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMud29ya2luZyA9IGZhbHNlO1xuICAgICAgdGhpcy5zdGFydEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxufSJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG9CQUE2Qzs7O0FDQTdDLHNCQUF1RDtBQXlCaEQsSUFBTSxtQkFBdUM7QUFBQSxFQUNsRCxZQUFZO0FBQUEsRUFDWixZQUFZO0FBQUEsRUFDWixtQkFBbUI7QUFBQSxFQUNuQiwyQkFBMkI7QUFBQSxFQUMzQiw0QkFBNEI7QUFBQSxFQUM1Qix5QkFBeUI7QUFBQSxFQUN6QixnQkFBZ0I7QUFBQTtBQUFBLEVBR2hCLHFCQUFxQjtBQUFBLEVBQ3JCLHNCQUFzQjtBQUFBLEVBQ3RCLCtCQUErQjtBQUFBLEVBQy9CLHFCQUFxQjtBQUFBLEVBRXJCLHFCQUFxQjtBQUFBLEVBQ3JCLHdCQUF3QjtBQUMxQjtBQUVPLElBQU0sdUJBQU4sY0FBbUMsaUNBQWlCO0FBQUEsRUFHekQsWUFBWSxLQUFVLFFBQTRCO0FBQ2hELFVBQU0sS0FBSyxNQUFNO0FBQ2pCLFNBQUssU0FBUztBQUFBLEVBQ2hCO0FBQUEsRUFFQSxVQUFnQjtBQUNkLFVBQU0sRUFBRSxZQUFZLElBQUk7QUFDeEIsZ0JBQVksTUFBTTtBQUVsQixnQkFBWSxTQUFTLE1BQU0sRUFBRSxNQUFNLDhCQUF5QixDQUFDO0FBRTdELFFBQUksd0JBQVEsV0FBVyxFQUNwQixRQUFRLHFCQUFx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QUFFRCxTQUFLLFdBQVc7QUFBQSxNQUNkLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQTtBQUFBLE1BQ04sZ0JBQWdCLE9BQU8sU0FBUyxVQUFVO0FBQ3hDLGNBQU0saUNBQWlDLEtBQUssS0FBSyxLQUFLLFFBQVE7QUFBQSxNQUNoRTtBQUFBLElBQ0YsQ0FBQztBQVFELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sVUFBVSxNQUFNLDJCQUEyQixLQUFLLEtBQUssS0FBSyxRQUFRO0FBQUEsSUFDcEUsQ0FBQztBQUdELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sVUFBVSxNQUFNLCtCQUErQixLQUFLLEtBQUssS0FBSyxRQUFRO0FBQUEsSUFDeEUsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sVUFBVSxNQUFNLDhDQUE4QyxLQUFLLEtBQUssS0FBSyxRQUFRO0FBQUEsSUFDdkYsQ0FBQztBQUdELHFCQUFpQixJQUFJO0FBQUEsRUFDdkI7QUFBQSxFQUVBLE1BQU0sV0FBVztBQUNmLFlBQVEsSUFBSSw2QkFBd0I7QUFBQSxFQUN0QztBQUFBLEVBRUEsTUFBTSxlQUFlO0FBQ25CLFVBQU0sS0FBSyxTQUFTLEtBQUssUUFBUTtBQUFBLEVBQ25DO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiYmxvY2siLCAiY29udGVudCIsICJ5YW1sIiwgImJvZHkiLCAibGlua2VkIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiYWRkSWNvbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgInJhdyIsICJpbXBvcnRfb2JzaWRpYW4iLCAiQk9PS19BQkJSIiwgImltcG9ydF9vYnNpZGlhbiIsICJCT0xMUyIsICJCT09LX0FCQlIiXQp9Cg==
