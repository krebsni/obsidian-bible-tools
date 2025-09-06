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
var import_obsidian16 = require("obsidian");

// src/settings.ts
var import_obsidian2 = require("obsidian");

// src/ui/bolls-picker-component.ts
var import_obsidian = require("obsidian");
var BOLLS = {
  LANGUAGES_URL: "https://bolls.life/static/bolls/app/views/languages.json"
};
async function fetchLanguages() {
  const res = await (0, import_obsidian.requestUrl)({ url: BOLLS.LANGUAGES_URL, method: "GET" });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`HTTP ${res.status}`);
  }
  const parsed = JSON.parse(res.text);
  return (parsed || []).filter((b) => Array.isArray(b.translations) && b.translations.length > 0);
}
var _BollsPickerComponent = class _BollsPickerComponent {
  constructor(options, settings, disallowDefault = false) {
    this.options = options;
    this.settings = settings;
    this.app = options.app;
    if (disallowDefault) this.setDisallowDefault(true);
    this.render();
  }
  /** Helper: get translations for a language or ALL (dedup by short_name) */
  translationsForLanguage(langKey) {
    if (langKey === "ALL") {
      const all = [];
      for (const block2 of this.options.langBlocks) all.push(...block2.translations);
      const seen = /* @__PURE__ */ new Set();
      return all.filter((t) => seen.has(t.short_name) ? false : (seen.add(t.short_name), true)).sort((a, b) => a.short_name.localeCompare(b.short_name));
    }
    const block = this.options.langBlocks.find((b) => b.language === langKey);
    if (!block) return [];
    return block.translations.slice().sort((a, b) => a.short_name.localeCompare(b.short_name));
  }
  async loadCatalogue() {
    try {
      const cached = this.settings.bollsCatalogueCache;
      if (cached?.length) {
        this.options.langBlocks = cached;
        return;
      }
      this.options.langBlocks = await fetchLanguages();
      try {
        this.settings.bollsCatalogueCache = this.options.langBlocks;
        this.settings.bollsCatalogueCachedAt = Date.now();
        this.app?.savePluginSettings?.();
      } catch {
      }
    } catch (e) {
      console.warn("[Bolls] Could not fetch languages.json:", e);
      this.options.langBlocks = [{
        language: "English",
        translations: [
          { short_name: "KJV", full_name: "King James Version 1769 with Apocrypha and Strong's Numbers" },
          { short_name: "WEB", full_name: "World English Bible" },
          { short_name: "YLT", full_name: "Young's Literal Translation (1898)" }
        ]
      }];
      new import_obsidian.Notice("Using minimal fallback catalogue (KJV/WEB/YLT).");
    }
  }
  async render() {
    const { container } = this.options;
    container.empty();
    await this.loadCatalogue();
    if (this.options.defaults?.languageLabel) {
      const found = this.options.langBlocks.find((b) => b.language === this.options.defaults.languageLabel);
      if (found) this.options.languageKey = found.language;
    }
    if (this.options.defaults) {
      if (this.options.defaults.versionShort === void 0) {
        this.options.translationCode = void 0;
        this.options.translationFull = void 0;
      } else if (this.options.defaults.versionShort) {
        this.options.translationCode = this.options.defaults.versionShort;
        const t = this.translationsForLanguage(this.options.languageKey).find((x) => x.short_name === this.options.translationCode);
        this.options.translationFull = t?.full_name ?? this.options.translationCode ?? void 0;
      }
    }
    new import_obsidian.Setting(container).setName("Bible language").addDropdown((dd) => {
      dd.addOption("ALL", "All languages");
      for (const block of this.options.langBlocks) {
        dd.addOption(block.language, block.language);
      }
      dd.setValue(this.options.languageKey);
      dd.onChange((v) => {
        this.options.languageKey = v;
        this.renderVersions();
        this.options.onChange(this.options.languageKey, this.options.translationCode, this.options.translationFull);
      });
    });
    this.versionsContainer = container.createDiv();
    this.options.versionsContainer = this.versionsContainer;
    this.renderVersions();
  }
  setDisallowDefault(disallow) {
    this.options.disallowDefault = disallow;
    if (disallow && (this.options.translationCode == void 0 || this.options.translationCode === "")) {
      const list = this.translationsForLanguage(this.options.languageKey);
      if (list.length) {
        if (this.options.languageKey === "English" && list.some((t) => t.short_name === "KJV")) {
          this.options.translationCode = "KJV";
          this.options.translationFull = list.find((t) => t.short_name === "KJV")?.full_name ?? "KJV";
        } else {
          this.options.translationCode = list[0].short_name;
          this.options.translationFull = list[0].full_name;
        }
        this.options.onChange(this.options.languageKey, this.options.translationCode, this.options.translationFull);
      }
    }
    if (this.versionsContainer) this.renderVersions();
  }
  renderVersions() {
    this.versionsContainer.empty();
    const list = this.translationsForLanguage(this.options.languageKey);
    new import_obsidian.Setting(this.versionsContainer).setName("Version").addDropdown((dd) => {
      const sel = dd.selectEl;
      sel.style.maxWidth = "360px";
      sel.style.whiteSpace = "nowrap";
      const allowDefault = !this.options.disallowDefault;
      if (allowDefault) {
        dd.addOption(_BollsPickerComponent.DEFAULT_SENTINEL, "Default");
      }
      if (!list.length) {
        if (allowDefault) {
          dd.setValue(
            this.options.translationCode == void 0 ? _BollsPickerComponent.DEFAULT_SENTINEL : _BollsPickerComponent.DEFAULT_SENTINEL
          );
          this.options.translationCode = void 0;
          this.options.translationFull = void 0;
        } else {
          dd.addOption("", "(no translations)");
          dd.setValue("");
          this.options.translationCode = "";
          this.options.translationFull = "";
        }
        return;
      }
      for (const t of list) {
        dd.addOption(t.short_name, `${t.short_name} \u2014 ${t.full_name}`);
      }
      let initialValue;
      if (this.options.translationCode == void 0 || this.options.translationCode === "") {
        if (allowDefault) {
          initialValue = _BollsPickerComponent.DEFAULT_SENTINEL;
        } else {
          initialValue = list[0].short_name;
        }
      } else {
        const exists = list.some((t) => t.short_name === this.options.translationCode);
        initialValue = exists ? this.options.translationCode : list[0].short_name;
      }
      dd.setValue(initialValue);
      if (initialValue === _BollsPickerComponent.DEFAULT_SENTINEL) {
        this.options.translationCode = void 0;
        this.options.translationFull = void 0;
      } else {
        this.options.translationCode = initialValue;
        const tt = list.find((x) => x.short_name === initialValue);
        this.options.translationFull = tt?.full_name ?? initialValue;
      }
      dd.onChange((v) => {
        if (allowDefault && v === _BollsPickerComponent.DEFAULT_SENTINEL) {
          this.options.translationCode = void 0;
          this.options.translationFull = void 0;
        } else {
          this.options.translationCode = v;
          const t2 = list.find((x) => x.short_name === v);
          this.options.translationFull = t2?.full_name ?? v;
        }
        this.options.onChange(this.options.languageKey, this.options.translationCode, this.options.translationFull);
      });
    });
  }
};
_BollsPickerComponent.DEFAULT_SENTINEL = "__DEFAULT__";
var BollsPickerComponent = _BollsPickerComponent;

// src/settings.ts
var DEFAULT_SETTINGS = {
  baseFolder: "Books",
  redMarkCss: "background: #FF5582A6;",
  indexFileNameMode: "article-style",
  stripMdLinksWhenVerseLike: true,
  removeObsidianDisplayLinks: false,
  rewriteOldObsidianLinks: true,
  autoLinkVerses: true,
  // Bible generation defaults
  bibleDefaultVersion: void 0,
  bibleDefaultVersionFull: void 0,
  bibleDefaultLanguage: "English",
  bibleIncludeVersionInFilename: true,
  bibleAddFrontmatter: false,
  bollsCatalogueCache: void 0,
  bollsCatalogueCachedAt: void 0
};
var BibleToolsSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Bible Tools \u2014 Settings" });
    new import_obsidian2.Setting(containerEl).setName("Default base folder").setDesc("Root folder to scan when a command needs a folder (e.g., index creation).").addText((t) => t.setPlaceholder("Books").setValue(this.plugin.settings.baseFolder).onChange(async (v) => {
      this.plugin.settings.baseFolder = v || "Books";
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName("Index filename mode").setDesc('If a folder ends with ", The" or ", A", convert to "The \u2026" / "A \u2026".').addDropdown((dd) => dd.addOption("folder-name", "Keep folder name").addOption("article-style", "Article style (\u2018, The\u2019 \u2192 \u2018The \u2026\u2019)").setValue(this.plugin.settings.indexFileNameMode).onChange(async (value) => {
      this.plugin.settings.indexFileNameMode = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName("Highlight CSS").setDesc("Exact style a <mark> tag must have to be considered a highlight.").addText((t) => t.setPlaceholder("background: #FF5582A6;").setValue(this.plugin.settings.redMarkCss).onChange(async (v) => {
      this.plugin.settings.redMarkCss = v;
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName("Strip Markdown links that look like scripture").addToggle((t) => t.setValue(this.plugin.settings.stripMdLinksWhenVerseLike).onChange(async (v) => {
      this.plugin.settings.stripMdLinksWhenVerseLike = v;
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName("Remove Obsidian display-text links that look like references").addToggle((t) => t.setValue(this.plugin.settings.removeObsidianDisplayLinks).onChange(async (value) => {
      this.plugin.settings.removeObsidianDisplayLinks = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName("Auto-link verses after outline formatting").addToggle(
      (t) => t.setValue(this.plugin.settings.autoLinkVerses).onChange(async (v) => {
        this.plugin.settings.autoLinkVerses = v;
        await this.plugin.saveSettings();
      })
    );
    const pickerHost = containerEl.createDiv({ cls: "bolls-picker-host" });
    const picker = new BollsPickerComponent(
      {
        app: this.app,
        settings: this.plugin.settings,
        langBlocks: [],
        // component will fetch + fill
        languageKey: this.plugin.settings.bibleDefaultLanguage ?? "ALL",
        translationCode: this.plugin.settings.bibleDefaultVersion,
        translationFull: this.plugin.settings.bibleDefaultVersionFull,
        defaults: {
          languageLabel: this.plugin.settings.bibleDefaultLanguage ?? null,
          versionShort: this.plugin.settings.bibleDefaultVersion
        },
        container: pickerHost,
        versionsContainer: pickerHost.createDiv(),
        onChange: async (language, version, versionFull) => {
          this.plugin.settings.bibleDefaultLanguage = language;
          this.plugin.settings.bibleDefaultVersion = version;
          this.plugin.settings.bibleDefaultVersionFull = versionFull;
          await this.plugin.saveSettings?.();
        }
      },
      this.plugin.settings
    );
  }
};

// src/commands/verseLinks.ts
var import_obsidian6 = require("obsidian");

// src/lib/mdUtils.ts
var import_obsidian3 = require("obsidian");
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
  return folder.children.find((c) => c instanceof import_obsidian3.TFolder) === void 0;
}
function getLeafFoldersUnder(app, baseFolderPath) {
  const base = app.vault.getFolderByPath((0, import_obsidian3.normalizePath)(baseFolderPath));
  if (!base) return [];
  const res = [];
  const walk = (f) => {
    if (isLeafFolder(f)) res.push(f);
    else for (const c of f.children) if (c instanceof import_obsidian3.TFolder) walk(c);
  };
  walk(base);
  return res;
}
function listMarkdownFiles(folder) {
  return folder.children.filter((c) => c instanceof import_obsidian3.TFile && c.extension === "md");
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
var import_obsidian5 = require("obsidian");

// src/ui/bolls-base-modal.ts
var import_obsidian4 = require("obsidian");
var BaseBollsModal = class extends import_obsidian4.Modal {
  constructor(app, settings, defaults) {
    super(app);
    /** Current selection (kept in sync via the component's onChange) */
    this.languageKey = "ALL";
    // "ALL" (=flatten) or exact BollsLanguage.language
    this.translationCode = void 0;
    this.translationFull = void 0;
    /** If a subclass wants to access the in-memory blocks after component loads. */
    this.langBlocks = [];
    this.disallowDefault = false;
    this.settings = settings;
    this.translationCode = settings.bibleDefaultVersion;
    this.translationFull = settings.bibleDefaultVersionFull;
    this.languageKey = settings.bibleDefaultLanguage ?? "ALL";
    this.defaults = defaults;
  }
  /** Override to add extra option controls under the pickers */
  renderExtraOptions(_contentEl) {
  }
  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText("Bible version");
    this.picker = new BollsPickerComponent(
      {
        app: this.app,
        // so component can persist settings if it wants
        settings: this.settings,
        // You can pass a stale/empty array; the component will load/replace it.
        langBlocks: this.langBlocks,
        // Initial values; the component may override based on defaults or availability.
        languageKey: this.languageKey,
        translationCode: this.settings.bibleDefaultVersion,
        translationFull: this.settings.bibleDefaultVersionFull,
        defaults: this.defaults,
        container: contentEl,
        versionsContainer: contentEl.createDiv(),
        // will be replaced by component in its constructor
        onChange: (language, version, versionFull) => {
          this.languageKey = language;
          this.translationCode = version;
          this.translationFull = versionFull;
          this.langBlocks = this.picker?.["options"]?.langBlocks ?? this.langBlocks;
        }
      },
      this.settings,
      this.disallowDefault
    );
    this.versionsContainer = this.picker.versionsContainer;
    this.renderExtraOptions(contentEl);
    this.renderFooter(contentEl);
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};

// src/ui/pick-version-modal.ts
var PickVersionModal = class extends BaseBollsModal {
  constructor(app, settings, onPick) {
    super(app, settings, {
      languageLabel: settings.bibleDefaultLanguage ?? null,
      versionShort: settings.bibleDefaultVersion
      // can be undefined
    });
    this.onPick = onPick;
  }
  renderFooter(contentEl) {
    new import_obsidian5.Setting(contentEl).setName("How to link").setDesc("If you cancel, links will use default (no version).").addButton(
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
var RANGE_SEP = /[\-\u2010\u2011\u2012\u2013\u2014\u2015]/;
var TRIM_TAIL_PUNCT = /[,:;.\)]$/;
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
    const ref1 = `(?:(?:${book})?\\.?\\s*\\d+(?:${RANGE_SEP.source}\\d+)?:\\d+[a-z]?(?:${RANGE_SEP.source}\\d+)?[a-z]?(?:\\s*,\\s*\\d+[a-z]?(?:${RANGE_SEP.source}\\d+)?[a-z]?|\\s*;\\s*\\d+:\\d+[a-z]?(?:${RANGE_SEP.source}\\d+)?[a-z]?)*)`;
    const ref2 = `(?:(${book})\\.?\\s+(\\d+)(?:${RANGE_SEP.source}(\\d+))?)`;
    const REF = `(?<ref>${ref1}|${ref2})`;
    const VERSE = `(?<verse>\\b[Vv]v?(?:\\.|erses?)\\s*\\d+[a-z]?(?:${RANGE_SEP.source}\\d+)?[a-z]?(?:(?:,|,?\\s*and)\\s*\\d+(?:${RANGE_SEP.source}\\d+)?[a-z]?)*)`;
    const CHAPTER = `(?<chapter>\\b[Cc]h(?:apters?|s?\\.)\\.?\\s*\\d+(?:${RANGE_SEP.source}\\d+)?)`;
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
      const ch = current_chapter ? String(current_chapter) : "1";
      const target = targetOf(current_book);
      const payload = verseText.replace(/^\s*\b[Vv]v?(?:\.|erses?)\s*/, "");
      const chunks = payload.split(/\s*(?:,|(?:,?\s*and)\s*)\s*/);
      const prefix = verseText.slice(0, verseText.length - payload.length);
      out.push(prefix);
      for (let i = 0; i < chunks.length; i++) {
        let piece = chunks[i];
        if (!piece) continue;
        const display = piece;
        const core = piece.replace(TRIM_TAIL_PUNCT, "");
        const [left, right] = core.split(RANGE_SEP).map((s) => s?.trim());
        if (right) {
          const leftNum = left.match(/\d+/)?.[0] ?? "";
          out.push(`[[${target}#^${ch}-${leftNum}|${left}]]`);
          out.push("\u2013");
          const rightNum = right.match(/\d+/)?.[0] ?? "";
          const trailing = piece.endsWith(":") ? ":" : piece.endsWith(";") ? ";" : piece.endsWith(".") ? "." : "";
          out.push(`[[${target}#^${ch}-${rightNum}|${right}${trailing}]]`);
        } else {
          const vNum = core.match(/\d+/)?.[0] ?? "";
          out.push(`[[${target}#^${ch}-${vNum}|${display}]]`);
        }
        if (i < chunks.length - 1) out.push(", ");
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
          const chs = String(chap ?? "").split(RANGE_SEP);
          chap = parseInt(chs[0].replace(/[a-z]$/i, ""), 10);
        }
        if (v) {
          const vs = String(v).split(RANGE_SEP);
          local_current_verse = parseInt(vs[0].replace(/[a-z]$/i, ""), 10);
          vEnd = vs.length > 1 ? parseInt(vs[1].replace(/[a-z]$/i, ""), 10) : null;
        } else {
          local_current_verse = null;
          vEnd = null;
        }
        const target = targetOf(current_book);
        if (vEnd) {
          const sepMatch = p.match(new RegExp(RANGE_SEP.source));
          const sepOut = sepMatch?.[0] ?? "-";
          const leftDispNoNum = p.replace(/\d+[a-z]?$/i, "");
          const leftDisp = leftDispNoNum.replace(new RegExp(`${RANGE_SEP.source}\\s*$`), "");
          const rightDisp = p.match(/(\d+[a-z]?)$/i)?.[1] ?? "";
          result.push(`[[${target}#^${chap}-${local_current_verse}|${prefix ?? ""}${leftDisp}]]`);
          result.push(sepOut);
          const vEndNum = parseInt(String(vEnd).replace(/[a-z]$/i, ""), 10);
          result.push(`[[${target}#^${chap}-${vEndNum}|${rightDisp}]]`);
          local_current_verse = vEndNum;
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
      new import_obsidian6.Notice("Open a file inside the target folder.");
      return;
    }
    for (const child of folder.children) {
      if (child instanceof import_obsidian6.TFile && child.extension === "md") {
        const content2 = await app.vault.read(child);
        const { yaml: yaml2, body: body2 } = splitFrontmatter(content2);
        const linked2 = await linkVersesInText(body2, settings, settings.bibleDefaultVersion);
        await app.vault.modify(child, (yaml2 ?? "") + linked2);
      }
    }
    new import_obsidian6.Notice("Linked verses in folder.");
    return;
  }
  if (!file) {
    new import_obsidian6.Notice("Open a file first.");
    return;
  }
  const content = await app.vault.read(file);
  const { yaml, body } = splitFrontmatter(content);
  const linked = await linkVersesInText(body, settings, settings.bibleDefaultVersion);
  await app.vault.modify(file, (yaml ?? "") + linked);
  new import_obsidian6.Notice("Linked verses in current file.");
}
async function commandVerseLinksSelectionOrLine(app, settings) {
  const mdView = app.workspace.getActiveViewOfType(import_obsidian6.MarkdownView);
  if (!mdView) {
    new import_obsidian6.Notice("Open a Markdown file first.");
    return;
  }
  const editor = mdView.editor;
  const selectionText = editor.getSelection();
  const run = async (text) => {
    const linked2 = await linkVersesInText(text, settings, settings.bibleDefaultVersion);
    return linked2;
  };
  if (selectionText && selectionText.length > 0) {
    const linked2 = await run(selectionText);
    if (linked2 !== selectionText) {
      editor.replaceSelection(linked2);
      new import_obsidian6.Notice("Linked verses in selection.");
    } else {
      new import_obsidian6.Notice("No linkable verses in selection.");
    }
    return;
  }
  const line = editor.getCursor().line;
  const lineText = editor.getLine(line);
  const linked = await run(lineText);
  if (linked !== lineText) {
    editor.setLine(line, linked);
    new import_obsidian6.Notice("Linked verses on current line.");
  } else {
    new import_obsidian6.Notice("No linkable verses on current line.");
  }
}
async function commandVerseLinksChooseVersion(app, settings) {
  const file = app.workspace.getActiveFile();
  if (!file) {
    new import_obsidian6.Notice("Open a file first.");
    return;
  }
  return await new Promise((resolve) => {
    new PickVersionModal(app, settings, async (versionShort) => {
      const content = await app.vault.read(file);
      const { yaml, body } = splitFrontmatter(content);
      const linked = await linkVersesInText(body, settings, versionShort);
      await app.vault.modify(file, (yaml ?? "") + linked);
      new import_obsidian6.Notice(versionShort ? `Linked verses (\u2192 ${versionShort}).` : "Linked verses (no version).");
      resolve(linked);
    }).open();
  });
}
async function commandVerseLinksSelectionOrLineChooseVersion(app, settings) {
  const mdView = app.workspace.getActiveViewOfType(import_obsidian6.MarkdownView);
  if (!mdView) {
    new import_obsidian6.Notice("Open a Markdown file first.");
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
          new import_obsidian6.Notice(
            versionShort ? `Linked (selection) \u2192 ${versionShort}.` : "Linked (selection) without version."
          );
        } else {
          new import_obsidian6.Notice("No linkable verses in selection.");
        }
        return;
      }
      const line = editor.getCursor().line;
      const lineText = editor.getLine(line);
      const linked = await run(lineText);
      if (linked !== lineText) {
        editor.setLine(line, linked);
        new import_obsidian6.Notice(versionShort ? `Linked (line) \u2192 ${versionShort}.` : "Linked (line) without version.");
      } else {
        new import_obsidian6.Notice("No linkable verses on current line.");
      }
      resolve(linked);
    }).open();
  });
}

// src/commands/addNextPrevious.ts
var import_obsidian7 = require("obsidian");
function tokenFromFilename(name) {
  const m = name.match(/^(\d+)/);
  if (!m) return null;
  return parseInt(m[1], 10);
}
async function commandAddNextPrevious(app, _settings, _params) {
  const file = app.workspace.getActiveFile();
  if (!file) {
    new import_obsidian7.Notice("Open a file first.");
    return;
  }
  const parent = file.parent;
  if (!(parent instanceof import_obsidian7.TFolder)) {
    new import_obsidian7.Notice("Current file has no folder.");
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
  new import_obsidian7.Notice("Inserted Next/Previous links.");
}

// src/commands/addFolderIndex.ts
var import_obsidian8 = require("obsidian");

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
  const indexPath = (0, import_obsidian8.normalizePath)(folder.path + "/" + idxName + ".md");
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
  if (existing instanceof import_obsidian8.TFile) {
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
    new import_obsidian8.Notice(`No leaf folders under ${baseFolder}`);
    return;
  }
  let changed = 0;
  for (const folder of folders) {
    const did = await createOrUpdateIndexForFolder(app, settings, folder, true);
    if (did) changed++;
  }
  new import_obsidian8.Notice(changed > 0 ? `Folder indexes created/updated: ${changed}` : "No changes; indexes already present.");
}
async function commandAddIndexForCurrentFolder(app, settings) {
  const active = app.workspace.getActiveFile();
  const folder = active?.parent;
  if (!active || !folder) {
    new import_obsidian8.Notice("Open a file inside the target folder.");
    return;
  }
  const did = await createOrUpdateIndexForFolder(app, settings, folder, false);
  new import_obsidian8.Notice(did ? `Index created/updated for \u201C${folder.name}\u201D.` : `No index change in \u201C${folder.name}\u201D.`);
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
var import_obsidian9 = require("obsidian");
async function commandExtractHighlightsFolder(app, settings) {
  const view = app.workspace.getActiveFile();
  const startFolder = view?.parent ?? app.vault.getFolderByPath(settings.baseFolder);
  if (!(startFolder instanceof import_obsidian9.TFolder)) {
    new import_obsidian9.Notice("Open a file in the target folder or set a valid base folder.");
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
    new import_obsidian9.Notice("No highlights found in folder.");
    return;
  }
  const out = all.join("\n");
  const target = startFolder.path + "/Highlights.md";
  const existing = app.vault.getFileByPath(target);
  if (existing) await app.vault.modify(existing, out);
  else await app.vault.create(target, out);
  new import_obsidian9.Notice("Highlights.md created.");
}

// src/commands/extractRedHighlights.ts
var import_obsidian10 = require("obsidian");
async function commandExtractRedHighlights(app, settings) {
  const file = app.workspace.getActiveFile();
  if (!file) {
    new import_obsidian10.Notice("Open a file first.");
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
    new import_obsidian10.Notice("No red highlights found.");
    return;
  }
  const section = [
    "> [!summary]- Highlights",
    ...hits.map((h) => `> - ${h}`),
    ""
  ].join("\n");
  const merged = insertAfterYamlOrH1(src, section);
  await app.vault.modify(file, merged);
  new import_obsidian10.Notice("Highlights section inserted.");
}

// src/commands/outlineExtractor.ts
var import_obsidian11 = require("obsidian");
async function commandOutlineExtractor(app, _settings) {
  const file = app.workspace.getActiveFile();
  if (!file) {
    new import_obsidian11.Notice("Open a file first.");
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
    new import_obsidian11.Notice("No headings (##..######) found.");
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
  new import_obsidian11.Notice("Outline appended successfully.");
}

// src/commands/outlineFormatter.ts
var import_obsidian13 = require("obsidian");

// src/lib/outlineUtils.ts
var import_obsidian12 = require("obsidian");
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
  new import_obsidian12.Notice("Outline formatted" + (settings.autoLinkVerses ? " + verses linked." : "."));
  return result;
}

// src/commands/outlineFormatter.ts
async function commandOutlineFormatter(app, settings) {
  const file = app.workspace.getActiveFile();
  if (!file) {
    new import_obsidian13.Notice("Open a file first.");
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
  new import_obsidian13.Notice("Outline formatted.");
}

// src/commands/generateBible.ts
var import_obsidian15 = require("obsidian");

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
var import_obsidian14 = require("obsidian");
var BuildBibleModal = class extends BaseBollsModal {
  constructor(app, settings) {
    super(app, settings, {
      languageLabel: settings.bibleDefaultLanguage ?? null,
      versionShort: settings.bibleDefaultVersion ?? void 0
    });
    this.concurrency = 4;
    this.working = false;
    this.includeVersionInFileName = settings.bibleIncludeVersionInFilename ?? true;
    this.versionAsSubfolder = settings.bibleVersionAsSubfolder ?? true;
    this.autoFrontmatter = settings.bibleAddFrontmatter ?? false;
    this.disallowDefault = true;
  }
  renderExtraOptions(contentEl) {
    new import_obsidian14.Setting(contentEl).setName("Append version to file name").setDesc(`"John (KJV)" vs "John"`).addToggle(
      (t) => t.setValue(this.includeVersionInFileName).onChange((v) => this.includeVersionInFileName = v)
    );
    new import_obsidian14.Setting(contentEl).setName("Place books under version subfolder").setDesc(`"_Bible/KJV/John (KJV)" vs "_Bible/John"`).addToggle(
      (t) => t.setValue(this.versionAsSubfolder).onChange((v) => this.versionAsSubfolder = v)
    );
    new import_obsidian14.Setting(contentEl).setName("Auto-add frontmatter").setDesc("Insert YAML with title/version/created into each book file").addToggle(
      (t) => t.setValue(this.autoFrontmatter).onChange((v) => this.autoFrontmatter = v)
    );
    new import_obsidian14.Setting(contentEl).setName("Concurrency").setDesc("How many chapters to download in parallel").addSlider(
      (s) => s.setLimits(1, 8, 1).setValue(this.concurrency).onChange((v) => this.concurrency = v).setDynamicTooltip()
    );
  }
  renderFooter(contentEl) {
    const progWrap = contentEl.createDiv({ cls: "bolls-progress" });
    this.progressEl = progWrap.createEl("progress");
    this.progressEl.max = 100;
    this.progressEl.value = 0;
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
    const code = (this.translationCode ?? "").trim();
    if (!code) {
      new import_obsidian14.Notice("Choose a translation code.");
      this.working = false;
      this.startBtn.disabled = false;
      return;
    }
    try {
      await buildBibleFromBolls(
        this.app,
        {
          translationCode: code,
          translationFull: this.translationFull || code,
          includeVersionInFileName: this.includeVersionInFileName,
          versionAsSubfolder: this.versionAsSubfolder,
          autoFrontmatter: this.autoFrontmatter,
          concurrency: this.concurrency
        },
        (done, total, msg) => {
          this.progressEl.max = total || 1;
          this.progressEl.value = Math.min(done, total || 1);
          this.statusEl.setText(`${done}/${total} \xB7 ${msg}`);
        }
      );
      this.statusEl.setText("Done.");
    } catch (e) {
      console.error(e);
      new import_obsidian14.Notice(`Bible build failed: ${e?.message ?? e}`);
      this.statusEl.setText("Failed.");
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
    const resp = await (0, import_obsidian15.requestUrl)({ url, method: "GET" });
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
  const np = (0, import_obsidian15.normalizePath)(path.replace(/\/+$/, ""));
  let f = app.vault.getAbstractFileByPath(np);
  if (f instanceof import_obsidian15.TFolder) return f;
  await app.vault.createFolder(np);
  const created = app.vault.getAbstractFileByPath(np);
  if (created instanceof import_obsidian15.TFolder) return created;
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
    const targetPath = (0, import_obsidian15.normalizePath)(`${parent.path}/${fileBase}.md`);
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
    if (existing instanceof import_obsidian15.TFile) {
      await app.vault.modify(existing, bookContent);
    } else {
      await app.vault.create(targetPath, bookContent);
    }
  }
  if (errors.length) {
    new import_obsidian15.Notice(`Finished with ${errors.length} error(s).`);
  } else {
    new import_obsidian15.Notice("Finished without errors.");
  }
}
function commandBuildBibleFromBolls(app, _settings) {
  new BuildBibleModal(app, _settings).open();
}

// src/main.ts
var ObsidianBibleTools = class extends import_obsidian16.Plugin {
  async onload() {
    console.log("Loading Bible Tools\u2026");
    registerIcons(import_obsidian16.addIcon);
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
      id: "build-bible-from-bolls",
      name: "Import Bible version into vault (download from bolls.life)",
      icon: "book-open",
      callback: () => commandBuildBibleFromBolls(this.app, this.settings)
    });
    this.addCommand({
      id: "obtb-verse-links",
      name: "Link verses",
      icon: "obtb-bible",
      callback: async () => commandVerseLinks(this.app, this.settings)
    });
    this.addCommand({
      id: "link-verses-selection-or-line",
      name: "Link verses in selection/current line",
      icon: "link-2",
      // appears in mobile command bar
      editorCallback: async (_editor, _view) => {
        await commandVerseLinksSelectionOrLine(this.app, this.settings);
      }
    });
    this.addCommand({
      id: "link-verses-current-choose-version",
      name: "Link verses (with version)",
      callback: () => commandVerseLinksChooseVersion(this.app, this.settings)
    });
    this.addCommand({
      id: "link-verses-selection-or-line-choose-version",
      name: "Link verses in selection/current line (with version)",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3NldHRpbmdzLnRzIiwgInNyYy91aS9ib2xscy1waWNrZXItY29tcG9uZW50LnRzIiwgInNyYy9jb21tYW5kcy92ZXJzZUxpbmtzLnRzIiwgInNyYy9saWIvbWRVdGlscy50cyIsICJzcmMvdWkvcGljay12ZXJzaW9uLW1vZGFsLnRzIiwgInNyYy91aS9ib2xscy1iYXNlLW1vZGFsLnRzIiwgInNyYy9jb21tYW5kcy9hZGROZXh0UHJldmlvdXMudHMiLCAic3JjL2NvbW1hbmRzL2FkZEZvbGRlckluZGV4LnRzIiwgInNyYy9saWIvdGV4dFV0aWxzLnRzIiwgInNyYy9wcm90b2NvbC50cyIsICJzcmMvaWNvbnMudHMiLCAic3JjL2NvbW1hbmRzL2V4dHJhY3RIaWdobGlnaHRzRm9sZGVyLnRzIiwgInNyYy9jb21tYW5kcy9leHRyYWN0UmVkSGlnaGxpZ2h0cy50cyIsICJzcmMvY29tbWFuZHMvb3V0bGluZUV4dHJhY3Rvci50cyIsICJzcmMvY29tbWFuZHMvb3V0bGluZUZvcm1hdHRlci50cyIsICJzcmMvbGliL291dGxpbmVVdGlscy50cyIsICJzcmMvY29tbWFuZHMvZ2VuZXJhdGVCaWJsZS50cyIsICJzcmMvbGliL3ZlcnNlTWFwLnRzIiwgInNyYy91aS9idWlsZC1iaWJsZS1tb2RhbC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFBsdWdpbiwgYWRkSWNvbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzLCBERUZBVUxUX1NFVFRJTkdTLCBCaWJsZVRvb2xzU2V0dGluZ1RhYiB9IGZyb20gXCIuL3NldHRpbmdzXCI7XG5pbXBvcnQgeyByZWdpc3RlclByb3RvY29sIH0gZnJvbSBcIi4vcHJvdG9jb2xcIjtcbmltcG9ydCB7IHJlZ2lzdGVySWNvbnMgfSBmcm9tIFwiLi9pY29uc1wiO1xuXG4vLyBDb21tYW5kc1xuaW1wb3J0IHsgY29tbWFuZEFkZEZvbGRlckluZGV4LCBjb21tYW5kQWRkSW5kZXhGb3JDdXJyZW50Rm9sZGVyIH0gZnJvbSBcIi4vY29tbWFuZHMvYWRkRm9sZGVySW5kZXhcIjtcbmltcG9ydCB7IGNvbW1hbmRBZGROZXh0UHJldmlvdXMgfSBmcm9tIFwiLi9jb21tYW5kcy9hZGROZXh0UHJldmlvdXNcIjtcbmltcG9ydCB7IGNvbW1hbmRFeHRyYWN0SGlnaGxpZ2h0c0ZvbGRlciB9IGZyb20gXCIuL2NvbW1hbmRzL2V4dHJhY3RIaWdobGlnaHRzRm9sZGVyXCI7XG5pbXBvcnQgeyBjb21tYW5kRXh0cmFjdFJlZEhpZ2hsaWdodHMgfSBmcm9tIFwiLi9jb21tYW5kcy9leHRyYWN0UmVkSGlnaGxpZ2h0c1wiO1xuaW1wb3J0IHsgY29tbWFuZE91dGxpbmVFeHRyYWN0b3IgfSBmcm9tIFwiLi9jb21tYW5kcy9vdXRsaW5lRXh0cmFjdG9yXCI7XG5pbXBvcnQgeyBjb21tYW5kT3V0bGluZUZvcm1hdHRlciB9IGZyb20gXCIuL2NvbW1hbmRzL291dGxpbmVGb3JtYXR0ZXJcIjtcbmltcG9ydCB7IGNvbW1hbmRWZXJzZUxpbmtzLCBjb21tYW5kVmVyc2VMaW5rc0Nob29zZVZlcnNpb24sIGNvbW1hbmRWZXJzZUxpbmtzU2VsZWN0aW9uT3JMaW5lLCBjb21tYW5kVmVyc2VMaW5rc1NlbGVjdGlvbk9yTGluZUNob29zZVZlcnNpb24gfSBmcm9tIFwiLi9jb21tYW5kcy92ZXJzZUxpbmtzXCI7XG5pbXBvcnQgeyBjb21tYW5kQnVpbGRCaWJsZUZyb21Cb2xscyB9IGZyb20gXCIuL2NvbW1hbmRzL2dlbmVyYXRlQmlibGVcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2JzaWRpYW5CaWJsZVRvb2xzIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3MhOiBCaWJsZVRvb2xzU2V0dGluZ3M7XG5cbiAgYXN5bmMgb25sb2FkKCkge1xuICAgIGNvbnNvbGUubG9nKFwiTG9hZGluZyBCaWJsZSBUb29sc1x1MjAyNlwiKTtcbiAgICByZWdpc3Rlckljb25zKGFkZEljb24pO1xuXG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG5cbiAgICAvLyBTZXR0aW5ncyBVSVxuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgQmlibGVUb29sc1NldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgIC8vIFJpYmJvbiBpY29uIChkZXNrdG9wKVxuICAgIHRoaXMuYWRkUmliYm9uSWNvbihcIm9idGItYm9va1wiLCBcIkJpYmxlIFRvb2xzOiBGb2xkZXIgSW5kZXhcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgY29tbWFuZEFkZEZvbGRlckluZGV4KHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKTtcbiAgICB9KTtcblxuICAgIC8vIENvbW1hbmRzXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9idGItYWRkLWZvbGRlci1pbmRleFwiLFxuICAgICAgbmFtZTogXCJDcmVhdGUvVXBkYXRlIEZvbGRlciBJbmRleCAoQm9va3MpXCIsXG4gICAgICBpY29uOiBcIm9idGItYm9va1wiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IGNvbW1hbmRBZGRGb2xkZXJJbmRleCh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncylcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJhZGQtaW5kZXgtZm9yLWN1cnJlbnQtZm9sZGVyXCIsXG4gICAgICBuYW1lOiBcIkNyZWF0ZS9VcGRhdGUgRm9sZGVyIEluZGV4IGZvciBDdXJyZW50IEZvbGRlclwiLFxuICAgICAgaWNvbjogXCJsaXN0LW9yZGVyZWRcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IGNvbW1hbmRBZGRJbmRleEZvckN1cnJlbnRGb2xkZXIodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpO1xuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvYnRiLWFkZC1uZXh0LXByZXZpb3VzXCIsXG4gICAgICBuYW1lOiBcIkluc2VydCBOZXh0L1ByZXZpb3VzIExpbmtzIChDdXJyZW50IEZvbGRlcilcIixcbiAgICAgIGljb246IFwib2J0Yi1saW5rc1wiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IGNvbW1hbmRBZGROZXh0UHJldmlvdXModGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib2J0Yi1leHRyYWN0LXJlZC1oaWdobGlnaHRzXCIsXG4gICAgICBuYW1lOiBcIkV4dHJhY3QgUmVkIEhpZ2hsaWdodHMgdG8gY3VycmVudCBmaWxlXCIsXG4gICAgICBpY29uOiBcIm9idGItaGlnaGxpZ2h0ZXJcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiBjb21tYW5kRXh0cmFjdFJlZEhpZ2hsaWdodHModGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib2J0Yi1leHRyYWN0LWhpZ2hsaWdodHMtZm9sZGVyXCIsXG4gICAgICBuYW1lOiBcIkNyZWF0ZSBIaWdobGlnaHRzLm1kIGZyb20gZm9sZGVyXCIsXG4gICAgICBpY29uOiBcIm9idGItc3VtbWFyeVwiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IGNvbW1hbmRFeHRyYWN0SGlnaGxpZ2h0c0ZvbGRlcih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncylcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvYnRiLW91dGxpbmUtZXh0cmFjdFwiLFxuICAgICAgbmFtZTogXCJBcHBlbmQgT3V0bGluZSAoZnJvbSAjIy4uLiMjIyMjIyBoZWFkaW5ncylcIixcbiAgICAgIGljb246IFwib2J0Yi1vdXRsaW5lXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4gY29tbWFuZE91dGxpbmVFeHRyYWN0b3IodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib2J0Yi1vdXRsaW5lLWZvcm1hdFwiLFxuICAgICAgbmFtZTogXCJGb3JtYXQgT3V0bGluZSAoUm9tYW4vQS8xL2EgXHUyMTkyIE1hcmtkb3duIGhlYWRpbmdzKSBhbmQgTGluayBWZXJzZXNcIixcbiAgICAgIGljb246IFwib2J0Yi1mb3JtYXR0ZXJcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiBjb21tYW5kT3V0bGluZUZvcm1hdHRlcih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncylcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJidWlsZC1iaWJsZS1mcm9tLWJvbGxzXCIsXG4gICAgICBuYW1lOiBcIkltcG9ydCBCaWJsZSB2ZXJzaW9uIGludG8gdmF1bHQgKGRvd25sb2FkIGZyb20gYm9sbHMubGlmZSlcIixcbiAgICAgIGljb246IFwiYm9vay1vcGVuXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gY29tbWFuZEJ1aWxkQmlibGVGcm9tQm9sbHModGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpLFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9idGItdmVyc2UtbGlua3NcIixcbiAgICAgIG5hbWU6IFwiTGluayB2ZXJzZXNcIixcbiAgICAgIGljb246IFwib2J0Yi1iaWJsZVwiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IGNvbW1hbmRWZXJzZUxpbmtzKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImxpbmstdmVyc2VzLXNlbGVjdGlvbi1vci1saW5lXCIsXG4gICAgICBuYW1lOiBcIkxpbmsgdmVyc2VzIGluIHNlbGVjdGlvbi9jdXJyZW50IGxpbmVcIixcbiAgICAgIGljb246IFwibGluay0yXCIsIC8vIGFwcGVhcnMgaW4gbW9iaWxlIGNvbW1hbmQgYmFyXG4gICAgICBlZGl0b3JDYWxsYmFjazogYXN5bmMgKF9lZGl0b3IsIF92aWV3KSA9PiB7XG4gICAgICAgIGF3YWl0IGNvbW1hbmRWZXJzZUxpbmtzU2VsZWN0aW9uT3JMaW5lKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKTtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibGluay12ZXJzZXMtY3VycmVudC1jaG9vc2UtdmVyc2lvblwiLFxuICAgICAgbmFtZTogXCJMaW5rIHZlcnNlcyAod2l0aCB2ZXJzaW9uKVwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IGNvbW1hbmRWZXJzZUxpbmtzQ2hvb3NlVmVyc2lvbih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyksXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibGluay12ZXJzZXMtc2VsZWN0aW9uLW9yLWxpbmUtY2hvb3NlLXZlcnNpb25cIixcbiAgICAgIG5hbWU6IFwiTGluayB2ZXJzZXMgaW4gc2VsZWN0aW9uL2N1cnJlbnQgbGluZSAod2l0aCB2ZXJzaW9uKVwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IGNvbW1hbmRWZXJzZUxpbmtzU2VsZWN0aW9uT3JMaW5lQ2hvb3NlVmVyc2lvbih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyksXG4gICAgfSk7XG5cbiAgICByZWdpc3RlclByb3RvY29sKHRoaXMpO1xuICB9XG5cbiAgYXN5bmMgb251bmxvYWQoKSB7XG4gICAgY29uc29sZS5sb2coXCJVbmxvYWRpbmcgQmlibGUgVG9vbHNcdTIwMjZcIik7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IE9ic2lkaWFuQmlibGVUb29scyBmcm9tIFwiLi9tYWluXCI7XG5pbXBvcnQgeyBCb2xsc0xhbmd1YWdlLCBCb2xsc1BpY2tlckNvbXBvbmVudCB9IGZyb20gXCIuL3VpL2JvbGxzLXBpY2tlci1jb21wb25lbnRcIjtcblxuZXhwb3J0IGludGVyZmFjZSBCaWJsZVRvb2xzU2V0dGluZ3Mge1xuICBiYXNlRm9sZGVyOiBzdHJpbmc7XG4gIHJlZE1hcmtDc3M6IHN0cmluZztcbiAgaW5kZXhGaWxlTmFtZU1vZGU6IFwiZm9sZGVyLW5hbWVcIiB8IFwiYXJ0aWNsZS1zdHlsZVwiO1xuICBzdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlOiBib29sZWFuOyAvLyBzdHJpcCBNYXJrZG93biBsaW5rcyB0aGF0IGxvb2sgbGlrZSBzY3JpcHR1cmUgcmVmZXJlbmNlcyAoZS5nLiwgW1JvbS4gMToxXSh1cmwpIFx1MjE5MiBSb20uIDE6MSlcbiAgcmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3M6IGJvb2xlYW47IC8vIHJlbW92ZSBPYnNpZGlhbiBkaXNwbGF5LXRleHQgbGlua3MgdGhhdCBsb29rIGxpa2Ugc2NyaXB0dXJlIHJlZmVyZW5jZXMgKGUuZy4sIFtbUm9tLiAxOjF8Um9tLiAxOjFdXSBcdTIxOTIgUm9tLiAxOjEpXG4gIHJld3JpdGVPbGRPYnNpZGlhbkxpbmtzOiBib29sZWFuOyAvLyByZXdyaXRlIGxlZ2FjeSBPYnNpZGlhbiBsaW5rcyAoZS5nLiwgW1tSb20gMSNeM3xcdTIwMjZdXSBcdTIxOTIgW1tSb20jXjEtM3xcdTIwMjZdXSkgYW5kIHJlbW92ZSBwcmV2aW91cyBPYnNpZGlhbiBsaW5rcyB0aGF0IGhhdmUgdmVyc2UtbGlrZSBkaXNwbGF5IHBhdHRlcm5cblxuICBhdXRvTGlua1ZlcnNlczogYm9vbGVhbjsgLy8gYXV0by1saW5rIHZlcnNlcyBpbiB0aGUgY3VycmVudCBmaWxlIHdoZW4gZm9ybWF0dGluZyBvdXRsaW5lc1xuXG4gIC8vIEJpYmxlIGdlbmVyYXRpb24gZGVmYXVsdHNcbiAgYmlibGVEZWZhdWx0VmVyc2lvbjogc3RyaW5nIHwgdW5kZWZpbmVkOyAgICAgICAgICAgICAgLy8gZS5nLiBcIktKVlwiXG4gIGJpYmxlRGVmYXVsdFZlcnNpb25GdWxsOiBzdHJpbmcgfCB1bmRlZmluZWQ7ICAgICAgICAgICAgICAvLyBlLmcuIFwiS2luZyBKYW1lcyBWZXJzaW9uXCJcbiAgYmlibGVEZWZhdWx0TGFuZ3VhZ2U6IHN0cmluZzsgICAgICAgICAgICAgLy8gZS5nLiBcIkVuZ2xpc2hcIixcbiAgYmlibGVJbmNsdWRlVmVyc2lvbkluRmlsZW5hbWU6IGJvb2xlYW47ICAgLy8gXCJKb2huIChLSlYpXCIgJiBfQmlibGUvS0pWL1xuICBiaWJsZUFkZEZyb250bWF0dGVyOiBib29sZWFuOyAgICAgICAgICAgICAvLyBhZGQgWUFNTCBmcm9udG1hdHRlciBhdCB0b3BcblxuICAvLyBDYWNoaW5nIG9mIEJvbGxzIGNhdGFsb2d1ZSAodG8gYXZvaWQgcmUtZmV0Y2hpbmcgZXZlcnkgdGltZSlcbiAgYm9sbHNDYXRhbG9ndWVDYWNoZT86IEJvbGxzTGFuZ3VhZ2VbXTtcbiAgYm9sbHNDYXRhbG9ndWVDYWNoZWRBdD86IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEJpYmxlVG9vbHNTZXR0aW5ncyA9IHtcbiAgYmFzZUZvbGRlcjogXCJCb29rc1wiLFxuICByZWRNYXJrQ3NzOiAnYmFja2dyb3VuZDogI0ZGNTU4MkE2OycsXG4gIGluZGV4RmlsZU5hbWVNb2RlOiBcImFydGljbGUtc3R5bGVcIixcbiAgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZTogdHJ1ZSxcbiAgcmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3M6IGZhbHNlLFxuICByZXdyaXRlT2xkT2JzaWRpYW5MaW5rczogdHJ1ZSxcbiAgYXV0b0xpbmtWZXJzZXM6IHRydWUsXG5cbiAgLy8gQmlibGUgZ2VuZXJhdGlvbiBkZWZhdWx0c1xuICBiaWJsZURlZmF1bHRWZXJzaW9uOiB1bmRlZmluZWQsXG4gIGJpYmxlRGVmYXVsdFZlcnNpb25GdWxsOiB1bmRlZmluZWQsXG4gIGJpYmxlRGVmYXVsdExhbmd1YWdlOiBcIkVuZ2xpc2hcIixcbiAgYmlibGVJbmNsdWRlVmVyc2lvbkluRmlsZW5hbWU6IHRydWUsXG4gIGJpYmxlQWRkRnJvbnRtYXR0ZXI6IGZhbHNlLFxuXG4gIGJvbGxzQ2F0YWxvZ3VlQ2FjaGU6IHVuZGVmaW5lZCxcbiAgYm9sbHNDYXRhbG9ndWVDYWNoZWRBdDogdW5kZWZpbmVkLFxufTtcblxuZXhwb3J0IGNsYXNzIEJpYmxlVG9vbHNTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHBsdWdpbjogT2JzaWRpYW5CaWJsZVRvb2xzO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IE9ic2lkaWFuQmlibGVUb29scykge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiQmlibGUgVG9vbHMgXHUyMDE0IFNldHRpbmdzXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRGVmYXVsdCBiYXNlIGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJSb290IGZvbGRlciB0byBzY2FuIHdoZW4gYSBjb21tYW5kIG5lZWRzIGEgZm9sZGVyIChlLmcuLCBpbmRleCBjcmVhdGlvbikuXCIpXG4gICAgICAuYWRkVGV4dCh0ID0+IHQuc2V0UGxhY2Vob2xkZXIoXCJCb29rc1wiKS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYXNlRm9sZGVyKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHYpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFzZUZvbGRlciA9IHYgfHwgXCJCb29rc1wiOyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkluZGV4IGZpbGVuYW1lIG1vZGVcIilcbiAgICAgIC5zZXREZXNjKCdJZiBhIGZvbGRlciBlbmRzIHdpdGggXCIsIFRoZVwiIG9yIFwiLCBBXCIsIGNvbnZlcnQgdG8gXCJUaGUgXHUyMDI2XCIgLyBcIkEgXHUyMDI2XCIuJylcbiAgICAgIC5hZGREcm9wZG93bihkZCA9PiBkZFxuICAgICAgICAuYWRkT3B0aW9uKFwiZm9sZGVyLW5hbWVcIiwgXCJLZWVwIGZvbGRlciBuYW1lXCIpXG4gICAgICAgIC5hZGRPcHRpb24oXCJhcnRpY2xlLXN0eWxlXCIsIFwiQXJ0aWNsZSBzdHlsZSAoXHUyMDE4LCBUaGVcdTIwMTkgXHUyMTkyIFx1MjAxOFRoZSBcdTIwMjZcdTIwMTkpXCIpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbmRleEZpbGVOYW1lTW9kZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmluZGV4RmlsZU5hbWVNb2RlID0gKHZhbHVlIGFzIFwiZm9sZGVyLW5hbWVcIiB8IFwiYXJ0aWNsZS1zdHlsZVwiKTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkhpZ2hsaWdodCBDU1NcIilcbiAgICAgIC5zZXREZXNjKFwiRXhhY3Qgc3R5bGUgYSA8bWFyaz4gdGFnIG11c3QgaGF2ZSB0byBiZSBjb25zaWRlcmVkIGEgaGlnaGxpZ2h0LlwiKVxuICAgICAgLmFkZFRleHQodCA9PiB0LnNldFBsYWNlaG9sZGVyKCdiYWNrZ3JvdW5kOiAjRkY1NTgyQTY7JylcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnJlZE1hcmtDc3MpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodikgPT4geyB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWRNYXJrQ3NzID0gdjsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJTdHJpcCBNYXJrZG93biBsaW5rcyB0aGF0IGxvb2sgbGlrZSBzY3JpcHR1cmVcIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2UpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodikgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2UgPSB2O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiUmVtb3ZlIE9ic2lkaWFuIGRpc3BsYXktdGV4dCBsaW5rcyB0aGF0IGxvb2sgbGlrZSByZWZlcmVuY2VzXCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZW1vdmVPYnNpZGlhbkRpc3BsYXlMaW5rcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICAvLyBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAvLyAgIC5zZXROYW1lKFwiUmV3cml0ZSBsZWdhY3kgT2JzaWRpYW4gbGlua3NcIilcbiAgICAvLyAgIC5zZXREZXNjKFwiQ29udmVydCBbW1JvbSAxI14zfFx1MjAyNl1dIFx1MjE5MiBbW1JvbSNeMS0zfFx1MjAyNl1dIGJlZm9yZSBsaW5raW5nIGFuZCByZW1vdmUgcHJldmlvdXMgT2JzaWRpYW4gbGlua3MgdGhhdCBoYXZlIHZlcnNlLWxpa2UgZGlzcGxheSBwYXR0ZXJuLlwiKVxuICAgIC8vICAgLmFkZFRvZ2dsZSh0ID0+IHRcbiAgICAvLyAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnJld3JpdGVPbGRPYnNpZGlhbkxpbmtzKVxuICAgIC8vICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgLy8gICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmV3cml0ZU9sZE9ic2lkaWFuTGlua3MgPSB2YWx1ZTtcbiAgICAvLyAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAvLyAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkF1dG8tbGluayB2ZXJzZXMgYWZ0ZXIgb3V0bGluZSBmb3JtYXR0aW5nXCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0xpbmtWZXJzZXMpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodikgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9MaW5rVmVyc2VzID0gdjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAvLyBIb3N0IGVsZW1lbnQgZm9yIHRoZSBwaWNrZXIgY29tcG9uZW50XG4gICAgY29uc3QgcGlja2VySG9zdCA9IGNvbnRhaW5lckVsLmNyZWF0ZURpdih7IGNsczogXCJib2xscy1waWNrZXItaG9zdFwiIH0pO1xuXG4gICAgLy8gSW5zdGFudGlhdGUgdGhlIHJldXNhYmxlIHBpY2tlci5cbiAgICAvLyAtIEl0IHdpbGwgbG9hZC9jYWNoZSBCb2xscyBsYW5ndWFnZXMuanNvbiBvbiBpdHMgb3duLlxuICAgIC8vIC0gSXQgY2FsbHMgb25DaGFuZ2UobGFuZ3VhZ2VLZXksIHRyYW5zbGF0aW9uQ29kZSwgdHJhbnNsYXRpb25GdWxsKSB3aGVuIHVzZXIgY2hhbmdlcyBzZWxlY3Rpb24uXG4gICAgY29uc3QgcGlja2VyID0gbmV3IEJvbGxzUGlja2VyQ29tcG9uZW50KFxuICAgICAge1xuICAgICAgICBhcHA6IHRoaXMuYXBwLFxuICAgICAgICBzZXR0aW5nczogdGhpcy5wbHVnaW4uc2V0dGluZ3MgYXMgQmlibGVUb29sc1NldHRpbmdzLFxuICAgICAgICBsYW5nQmxvY2tzOiBbXSwgLy8gY29tcG9uZW50IHdpbGwgZmV0Y2ggKyBmaWxsXG4gICAgICAgIGxhbmd1YWdlS2V5OiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iaWJsZURlZmF1bHRMYW5ndWFnZSA/PyBcIkFMTFwiLFxuICAgICAgICB0cmFuc2xhdGlvbkNvZGU6IHRoaXMucGx1Z2luLnNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb24sXG4gICAgICAgIHRyYW5zbGF0aW9uRnVsbDogdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmlibGVEZWZhdWx0VmVyc2lvbkZ1bGwsXG4gICAgICAgIGRlZmF1bHRzOiB7XG4gICAgICAgICAgbGFuZ3VhZ2VMYWJlbDogdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmlibGVEZWZhdWx0TGFuZ3VhZ2UgPz8gbnVsbCxcbiAgICAgICAgICB2ZXJzaW9uU2hvcnQ6ICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iaWJsZURlZmF1bHRWZXJzaW9uLFxuICAgICAgICB9LFxuICAgICAgICBjb250YWluZXI6IHBpY2tlckhvc3QsXG4gICAgICAgIHZlcnNpb25zQ29udGFpbmVyOiBwaWNrZXJIb3N0LmNyZWF0ZURpdigpLFxuICAgICAgICBvbkNoYW5nZTogYXN5bmMgKGxhbmd1YWdlLCB2ZXJzaW9uLCB2ZXJzaW9uRnVsbCkgPT4ge1xuICAgICAgICAgIC8vIFBlcnNpc3Qgc2VsZWN0aW9ucyBhcyB5b3VyIHBsdWdpbiBkZWZhdWx0c1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmJpYmxlRGVmYXVsdExhbmd1YWdlICAgICA9IGxhbmd1YWdlO1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb24gPSB2ZXJzaW9uO1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb25GdWxsID0gdmVyc2lvbkZ1bGw7XG5cbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3M/LigpO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzIGFzIEJpYmxlVG9vbHNTZXR0aW5nc1xuICAgICk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBOb3RpY2UsIHJlcXVlc3RVcmwsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5cbi8qKiBCb2xscyBmb3JtYXRzICovXG5leHBvcnQgaW50ZXJmYWNlIEJvbGxzVHJhbnNsYXRpb24ge1xuICBzaG9ydF9uYW1lOiBzdHJpbmc7XG4gIGZ1bGxfbmFtZTogc3RyaW5nO1xuICB1cGRhdGVkPzogbnVtYmVyO1xuICBkaXI/OiBcInJ0bFwiIHwgXCJsdHJcIjtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgQm9sbHNMYW5ndWFnZSB7XG4gIGxhbmd1YWdlOiBzdHJpbmc7XG4gIHRyYW5zbGF0aW9uczogQm9sbHNUcmFuc2xhdGlvbltdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJhc2VCb2xsc0RlZmF1bHRzIHtcbiAgbGFuZ3VhZ2VMYWJlbD86IHN0cmluZzsgICAvLyBlLmcuLCBcIkVuZ2xpc2hcIlxuICB2ZXJzaW9uU2hvcnQ/OiBzdHJpbmcgfCB1bmRlZmluZWQ7ICAgIC8vIGUuZy4sIFwiS0pWXCIgfCB1bmRlZmluZWQgbWVhbnMgRGVmYXVsdFxufVxuXG5jb25zdCBCT0xMUyA9IHtcbiAgTEFOR1VBR0VTX1VSTDogXCJodHRwczovL2JvbGxzLmxpZmUvc3RhdGljL2JvbGxzL2FwcC92aWV3cy9sYW5ndWFnZXMuanNvblwiLFxufTtcblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hMYW5ndWFnZXMoKTogUHJvbWlzZTxCb2xsc0xhbmd1YWdlW10+IHtcbiAgY29uc3QgcmVzID0gYXdhaXQgcmVxdWVzdFVybCh7IHVybDogQk9MTFMuTEFOR1VBR0VTX1VSTCwgbWV0aG9kOiBcIkdFVFwiIH0pO1xuICBpZiAocmVzLnN0YXR1cyA8IDIwMCB8fCByZXMuc3RhdHVzID49IDMwMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgSFRUUCAke3Jlcy5zdGF0dXN9YCk7XG4gIH1cbiAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShyZXMudGV4dCkgYXMgQm9sbHNMYW5ndWFnZVtdO1xuICByZXR1cm4gKHBhcnNlZCB8fCBbXSkuZmlsdGVyKGIgPT4gQXJyYXkuaXNBcnJheShiLnRyYW5zbGF0aW9ucykgJiYgYi50cmFuc2xhdGlvbnMubGVuZ3RoID4gMCk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQm9sbHNQaWNrZXJDb21wb25lbnRPcHRpb25zIHtcbiAgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncztcbiAgbGFuZ0Jsb2NrczogQm9sbHNMYW5ndWFnZVtdOyAgICAgICAgICAgICAvLyBjYW4gcGFzcyBbXSBcdTIwMTQgd2lsbCBiZSBsb2FkZWRcbiAgbGFuZ3VhZ2VLZXk6IHN0cmluZzsgICAgICAgICAgICAgICAgICAgICAvLyBpbml0aWFsIHNlbGVjdGlvbiAoZS5nLiwgXCJBTExcIilcbiAgdHJhbnNsYXRpb25Db2RlOiBzdHJpbmcgfCB1bmRlZmluZWQ7IC8vIFwiS0pWXCIgb3IgdW5kZWZpbmVkIGZvciBEZWZhdWx0XG4gIHRyYW5zbGF0aW9uRnVsbD86IHN0cmluZzsgICAgICAgICAgICAgICAgLy8gb3B0aW9uYWwgaW5pdGlhbCBmdWxsIG5hbWVcbiAgZGVmYXVsdHM/OiBCYXNlQm9sbHNEZWZhdWx0czsgICAgICAgICAgICAvLyBvcHRpb25hbCBkZWZhdWx0cyB0byBwcmVzZWxlY3RcbiAgb25DaGFuZ2U6IChsYW5ndWFnZTogc3RyaW5nLCB2ZXJzaW9uOiBzdHJpbmcgfCB1bmRlZmluZWQsIHZlcnNpb25GdWxsOiBzdHJpbmcgfCB1bmRlZmluZWQpID0+IHZvaWQ7XG4gIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQ7ICAgICAgICAgICAgICAgICAgLy8gaG9zdCBlbGVtZW50XG4gIHZlcnNpb25zQ29udGFpbmVyPzogSFRNTERpdkVsZW1lbnQ7ICAgICAgLy8gKHNldCBieSBjb21wb25lbnQpXG4gIGFwcDogYW55OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGx1Z2luL2FwcCBpbnN0YW5jZSBmb3Igc2F2aW5nXG4gIGRpc2FsbG93RGVmYXVsdD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBCb2xsc1BpY2tlckNvbXBvbmVudCB7XG4gIHByaXZhdGUgb3B0aW9uczogQm9sbHNQaWNrZXJDb21wb25lbnRPcHRpb25zO1xuICBwcml2YXRlIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3M7XG4gIHByaXZhdGUgYXBwOiBhbnk7XG5cbiAgLy8gcmVmZXJlbmNlIGtlcHQgdG8gdGhlIGFjdHVhbCB2ZXJzaW9ucyBjb250YWluZXIgd2UgcmVuZGVyIGludG9cbiAgdmVyc2lvbnNDb250YWluZXIhOiBIVE1MRGl2RWxlbWVudDtcblxuICBwcml2YXRlIHN0YXRpYyBERUZBVUxUX1NFTlRJTkVMID0gXCJfX0RFRkFVTFRfX1wiO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IEJvbGxzUGlja2VyQ29tcG9uZW50T3B0aW9ucywgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncywgZGlzYWxsb3dEZWZhdWx0OiBib29sZWFuID0gZmFsc2UpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICB0aGlzLmFwcCA9IG9wdGlvbnMuYXBwO1xuXG4gICAgaWYgKGRpc2FsbG93RGVmYXVsdCkgdGhpcy5zZXREaXNhbGxvd0RlZmF1bHQodHJ1ZSk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIC8qKiBIZWxwZXI6IGdldCB0cmFuc2xhdGlvbnMgZm9yIGEgbGFuZ3VhZ2Ugb3IgQUxMIChkZWR1cCBieSBzaG9ydF9uYW1lKSAqL1xuICBwcm90ZWN0ZWQgdHJhbnNsYXRpb25zRm9yTGFuZ3VhZ2UobGFuZ0tleTogc3RyaW5nKTogQm9sbHNUcmFuc2xhdGlvbltdIHtcbiAgICBpZiAobGFuZ0tleSA9PT0gXCJBTExcIikge1xuICAgICAgY29uc3QgYWxsOiBCb2xsc1RyYW5zbGF0aW9uW10gPSBbXTtcbiAgICAgIGZvciAoY29uc3QgYmxvY2sgb2YgdGhpcy5vcHRpb25zLmxhbmdCbG9ja3MpIGFsbC5wdXNoKC4uLmJsb2NrLnRyYW5zbGF0aW9ucyk7XG4gICAgICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICByZXR1cm4gYWxsXG4gICAgICAgIC5maWx0ZXIodCA9PiAoc2Vlbi5oYXModC5zaG9ydF9uYW1lKSA/IGZhbHNlIDogKHNlZW4uYWRkKHQuc2hvcnRfbmFtZSksIHRydWUpKSlcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEuc2hvcnRfbmFtZS5sb2NhbGVDb21wYXJlKGIuc2hvcnRfbmFtZSkpO1xuICAgIH1cbiAgICBjb25zdCBibG9jayA9IHRoaXMub3B0aW9ucy5sYW5nQmxvY2tzLmZpbmQoYiA9PiBiLmxhbmd1YWdlID09PSBsYW5nS2V5KTtcbiAgICBpZiAoIWJsb2NrKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGJsb2NrLnRyYW5zbGF0aW9ucy5zbGljZSgpLnNvcnQoKGEsIGIpID0+IGEuc2hvcnRfbmFtZS5sb2NhbGVDb21wYXJlKGIuc2hvcnRfbmFtZSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBsb2FkQ2F0YWxvZ3VlKCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjYWNoZWQgPSB0aGlzLnNldHRpbmdzLmJvbGxzQ2F0YWxvZ3VlQ2FjaGUgYXMgdW5rbm93biBhcyBCb2xsc0xhbmd1YWdlW10gfCB1bmRlZmluZWQ7XG4gICAgICBpZiAoY2FjaGVkPy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLmxhbmdCbG9ja3MgPSBjYWNoZWQ7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMub3B0aW9ucy5sYW5nQmxvY2tzID0gYXdhaXQgZmV0Y2hMYW5ndWFnZXMoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgICh0aGlzLnNldHRpbmdzIGFzIGFueSkuYm9sbHNDYXRhbG9ndWVDYWNoZSA9IHRoaXMub3B0aW9ucy5sYW5nQmxvY2tzO1xuICAgICAgICAodGhpcy5zZXR0aW5ncyBhcyBhbnkpLmJvbGxzQ2F0YWxvZ3VlQ2FjaGVkQXQgPSBEYXRlLm5vdygpO1xuICAgICAgICB0aGlzLmFwcD8uc2F2ZVBsdWdpblNldHRpbmdzPy4oKTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJbQm9sbHNdIENvdWxkIG5vdCBmZXRjaCBsYW5ndWFnZXMuanNvbjpcIiwgZSk7XG4gICAgICB0aGlzLm9wdGlvbnMubGFuZ0Jsb2NrcyA9IFt7XG4gICAgICAgIGxhbmd1YWdlOiBcIkVuZ2xpc2hcIixcbiAgICAgICAgdHJhbnNsYXRpb25zOiBbXG4gICAgICAgICAgeyBzaG9ydF9uYW1lOiBcIktKVlwiLCBmdWxsX25hbWU6IFwiS2luZyBKYW1lcyBWZXJzaW9uIDE3Njkgd2l0aCBBcG9jcnlwaGEgYW5kIFN0cm9uZydzIE51bWJlcnNcIiB9LFxuICAgICAgICAgIHsgc2hvcnRfbmFtZTogXCJXRUJcIiwgZnVsbF9uYW1lOiBcIldvcmxkIEVuZ2xpc2ggQmlibGVcIiB9LFxuICAgICAgICAgIHsgc2hvcnRfbmFtZTogXCJZTFRcIiwgZnVsbF9uYW1lOiBcIllvdW5nJ3MgTGl0ZXJhbCBUcmFuc2xhdGlvbiAoMTg5OClcIiB9LFxuICAgICAgICBdLFxuICAgICAgfV07XG4gICAgICBuZXcgTm90aWNlKFwiVXNpbmcgbWluaW1hbCBmYWxsYmFjayBjYXRhbG9ndWUgKEtKVi9XRUIvWUxUKS5cIik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgcmVuZGVyKCkge1xuICAgIGNvbnN0IHsgY29udGFpbmVyIH0gPSB0aGlzLm9wdGlvbnM7XG4gICAgY29udGFpbmVyLmVtcHR5KCk7XG5cbiAgICAvLyBlbnN1cmUgY2F0YWxvZyBpcyBsb2FkZWRcbiAgICBhd2FpdCB0aGlzLmxvYWRDYXRhbG9ndWUoKTtcblxuICAgIC8vIGFwcGx5IGRlZmF1bHRzIChpZiBhbnkpXG4gICAgaWYgKHRoaXMub3B0aW9ucy5kZWZhdWx0cz8ubGFuZ3VhZ2VMYWJlbCkge1xuICAgICAgY29uc3QgZm91bmQgPSB0aGlzLm9wdGlvbnMubGFuZ0Jsb2Nrcy5maW5kKGIgPT4gYi5sYW5ndWFnZSA9PT0gdGhpcy5vcHRpb25zLmRlZmF1bHRzIS5sYW5ndWFnZUxhYmVsKTtcbiAgICAgIGlmIChmb3VuZCkgdGhpcy5vcHRpb25zLmxhbmd1YWdlS2V5ID0gZm91bmQubGFuZ3VhZ2U7XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuZGVmYXVsdHMpIHtcbiAgICAgIC8vIElmIHZlcnNpb25TaG9ydCBpcyBleHBsaWNpdGx5IHVuZGVmaW5lZCAtPiBEZWZhdWx0XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmRlZmF1bHRzLnZlcnNpb25TaG9ydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkZ1bGwgPSB1bmRlZmluZWQ7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5kZWZhdWx0cy52ZXJzaW9uU2hvcnQpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSA9IHRoaXMub3B0aW9ucy5kZWZhdWx0cy52ZXJzaW9uU2hvcnQ7XG4gICAgICAgIGNvbnN0IHQgPSB0aGlzLnRyYW5zbGF0aW9uc0Zvckxhbmd1YWdlKHRoaXMub3B0aW9ucy5sYW5ndWFnZUtleSlcbiAgICAgICAgICAuZmluZCh4ID0+IHguc2hvcnRfbmFtZSA9PT0gdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSk7XG4gICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkZ1bGwgPSB0Py5mdWxsX25hbWUgPz8gdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSA/PyB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTEFOR1VBR0UgUElDS0VSXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyKVxuICAgICAgLnNldE5hbWUoXCJCaWJsZSBsYW5ndWFnZVwiKVxuICAgICAgLmFkZERyb3Bkb3duKGRkID0+IHtcbiAgICAgICAgZGQuYWRkT3B0aW9uKFwiQUxMXCIsIFwiQWxsIGxhbmd1YWdlc1wiKTtcbiAgICAgICAgZm9yIChjb25zdCBibG9jayBvZiB0aGlzLm9wdGlvbnMubGFuZ0Jsb2Nrcykge1xuICAgICAgICAgIGRkLmFkZE9wdGlvbihibG9jay5sYW5ndWFnZSwgYmxvY2subGFuZ3VhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIGRkLnNldFZhbHVlKHRoaXMub3B0aW9ucy5sYW5ndWFnZUtleSk7XG4gICAgICAgIGRkLm9uQ2hhbmdlKHYgPT4ge1xuICAgICAgICAgIHRoaXMub3B0aW9ucy5sYW5ndWFnZUtleSA9IHY7XG4gICAgICAgICAgdGhpcy5yZW5kZXJWZXJzaW9ucygpOyAvLyByZWJ1aWxkIHZlcnNpb25zIGZvciB0aGUgc2VsZWN0ZWQgbGFuZ3VhZ2VcbiAgICAgICAgICB0aGlzLm9wdGlvbnMub25DaGFuZ2UodGhpcy5vcHRpb25zLmxhbmd1YWdlS2V5LCB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlLCB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25GdWxsKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIC8vIFZFUlNJT05TIChkeW5hbWljKVxuICAgIHRoaXMudmVyc2lvbnNDb250YWluZXIgPSBjb250YWluZXIuY3JlYXRlRGl2KCk7XG4gICAgdGhpcy5vcHRpb25zLnZlcnNpb25zQ29udGFpbmVyID0gdGhpcy52ZXJzaW9uc0NvbnRhaW5lcjtcbiAgICB0aGlzLnJlbmRlclZlcnNpb25zKCk7XG4gIH1cblxuICBwcml2YXRlIHNldERpc2FsbG93RGVmYXVsdChkaXNhbGxvdzogYm9vbGVhbikge1xuICAgIHRoaXMub3B0aW9ucy5kaXNhbGxvd0RlZmF1bHQgPSBkaXNhbGxvdztcbiAgICAvLyBJZiB3ZSBub3cgZGlzYWxsb3cgZGVmYXVsdCBidXQgY3VycmVudCBpcyB1bmRlZmluZWQsIGNvZXJjZSB0byBmaXJzdCBhdmFpbGFibGVcbiAgICBpZiAoZGlzYWxsb3cgJiYgKHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgPT0gdW5kZWZpbmVkIHx8IHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgPT09IFwiXCIpKSB7XG4gICAgICBjb25zdCBsaXN0ID0gdGhpcy50cmFuc2xhdGlvbnNGb3JMYW5ndWFnZSh0aGlzLm9wdGlvbnMubGFuZ3VhZ2VLZXkpO1xuICAgICAgaWYgKGxpc3QubGVuZ3RoKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubGFuZ3VhZ2VLZXkgPT09IFwiRW5nbGlzaFwiICYmIGxpc3Quc29tZSh0ID0+IHQuc2hvcnRfbmFtZSA9PT0gXCJLSlZcIikpIHtcbiAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlID0gXCJLSlZcIjtcbiAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25GdWxsID0gbGlzdC5maW5kKHQgPT4gdC5zaG9ydF9uYW1lID09PSBcIktKVlwiKT8uZnVsbF9uYW1lID8/IFwiS0pWXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSA9IGxpc3RbMF0uc2hvcnRfbmFtZTtcbiAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25GdWxsID0gbGlzdFswXS5mdWxsX25hbWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcHRpb25zLm9uQ2hhbmdlKHRoaXMub3B0aW9ucy5sYW5ndWFnZUtleSwgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSwgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uRnVsbCk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFJlYnVpbGQgdmVyc2lvbnMgVUkgdG8gcmVmbGVjdCB0aGUgZmxhZ1xuICAgIGlmICh0aGlzLnZlcnNpb25zQ29udGFpbmVyKSB0aGlzLnJlbmRlclZlcnNpb25zKCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclZlcnNpb25zKCkge1xuICAgIHRoaXMudmVyc2lvbnNDb250YWluZXIuZW1wdHkoKTtcbiAgICBjb25zdCBsaXN0ID0gdGhpcy50cmFuc2xhdGlvbnNGb3JMYW5ndWFnZSh0aGlzLm9wdGlvbnMubGFuZ3VhZ2VLZXkpO1xuXG4gICAgbmV3IFNldHRpbmcodGhpcy52ZXJzaW9uc0NvbnRhaW5lcilcbiAgICAgIC5zZXROYW1lKFwiVmVyc2lvblwiKVxuICAgICAgLmFkZERyb3Bkb3duKGRkID0+IHtcbiAgICAgICAgY29uc3Qgc2VsID0gZGQuc2VsZWN0RWwgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIHNlbC5zdHlsZS5tYXhXaWR0aCA9IFwiMzYwcHhcIjtcbiAgICAgICAgc2VsLnN0eWxlLndoaXRlU3BhY2UgPSBcIm5vd3JhcFwiO1xuXG4gICAgICAgIC8vIE9ubHkgc2hvdyBcIkRlZmF1bHRcIiB3aGVuIGFsbG93ZWRcbiAgICAgICAgY29uc3QgYWxsb3dEZWZhdWx0ID0gIXRoaXMub3B0aW9ucy5kaXNhbGxvd0RlZmF1bHQ7XG5cbiAgICAgICAgaWYgKGFsbG93RGVmYXVsdCkge1xuICAgICAgICAgIGRkLmFkZE9wdGlvbihCb2xsc1BpY2tlckNvbXBvbmVudC5ERUZBVUxUX1NFTlRJTkVMLCBcIkRlZmF1bHRcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWxpc3QubGVuZ3RoKSB7XG4gICAgICAgICAgLy8gV2l0aCBubyB0cmFuc2xhdGlvbnMgYXZhaWxhYmxlOlxuICAgICAgICAgIGlmIChhbGxvd0RlZmF1bHQpIHtcbiAgICAgICAgICAgIGRkLnNldFZhbHVlKFxuICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlID09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgID8gQm9sbHNQaWNrZXJDb21wb25lbnQuREVGQVVMVF9TRU5USU5FTFxuICAgICAgICAgICAgICAgIDogQm9sbHNQaWNrZXJDb21wb25lbnQuREVGQVVMVF9TRU5USU5FTFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25GdWxsID0gdW5kZWZpbmVkO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBkaXNhbGxvd0RlZmF1bHQ6IG5vdGhpbmcgdG8gcGljaywga2VlcCBlbXB0eVxuICAgICAgICAgICAgZGQuYWRkT3B0aW9uKFwiXCIsIFwiKG5vIHRyYW5zbGF0aW9ucylcIik7XG4gICAgICAgICAgICBkZC5zZXRWYWx1ZShcIlwiKTtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgPSBcIlwiO1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uRnVsbCA9IFwiXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3QgdCBvZiBsaXN0KSB7XG4gICAgICAgICAgZGQuYWRkT3B0aW9uKHQuc2hvcnRfbmFtZSwgYCR7dC5zaG9ydF9uYW1lfSBcdTIwMTQgJHt0LmZ1bGxfbmFtZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERldGVybWluZSBpbml0aWFsIHZhbHVlXG4gICAgICAgIGxldCBpbml0aWFsVmFsdWU6IHN0cmluZztcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgPT0gdW5kZWZpbmVkIHx8IHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgPT09IFwiXCIpIHtcbiAgICAgICAgICBpZiAoYWxsb3dEZWZhdWx0KSB7XG4gICAgICAgICAgICBpbml0aWFsVmFsdWUgPSBCb2xsc1BpY2tlckNvbXBvbmVudC5ERUZBVUxUX1NFTlRJTkVMO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbml0aWFsVmFsdWUgPSBsaXN0WzBdLnNob3J0X25hbWU7IC8vIGNvZXJjZSB0byBmaXJzdFxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBleGlzdHMgPSBsaXN0LnNvbWUodCA9PiB0LnNob3J0X25hbWUgPT09IHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUpO1xuICAgICAgICAgIGluaXRpYWxWYWx1ZSA9IGV4aXN0cyA/ICh0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlIGFzIHN0cmluZykgOiBsaXN0WzBdLnNob3J0X25hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBkZC5zZXRWYWx1ZShpbml0aWFsVmFsdWUpO1xuXG4gICAgICAgIC8vIFN5bmMgaW50ZXJuYWwgc3RhdGVcbiAgICAgICAgaWYgKGluaXRpYWxWYWx1ZSA9PT0gQm9sbHNQaWNrZXJDb21wb25lbnQuREVGQVVMVF9TRU5USU5FTCkge1xuICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uRnVsbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlID0gaW5pdGlhbFZhbHVlO1xuICAgICAgICAgIGNvbnN0IHR0ID0gbGlzdC5maW5kKHggPT4geC5zaG9ydF9uYW1lID09PSBpbml0aWFsVmFsdWUpO1xuICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkZ1bGwgPSB0dD8uZnVsbF9uYW1lID8/IGluaXRpYWxWYWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRkLm9uQ2hhbmdlKHYgPT4ge1xuICAgICAgICAgIGlmIChhbGxvd0RlZmF1bHQgJiYgdiA9PT0gQm9sbHNQaWNrZXJDb21wb25lbnQuREVGQVVMVF9TRU5USU5FTCkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkZ1bGwgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgPSB2O1xuICAgICAgICAgICAgY29uc3QgdDIgPSBsaXN0LmZpbmQoeCA9PiB4LnNob3J0X25hbWUgPT09IHYpO1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uRnVsbCA9IHQyPy5mdWxsX25hbWUgPz8gdjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5vcHRpb25zLm9uQ2hhbmdlKHRoaXMub3B0aW9ucy5sYW5ndWFnZUtleSwgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSwgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uRnVsbCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gIH1cbn0iLCAiLy8gc3JjL2NvbW1hbmRzL3ZlcnNlTGlua3MudHNcbmltcG9ydCB7XG4gIEFwcCxcbiAgTWFya2Rvd25WaWV3LFxuICBNb2RhbCxcbiAgTm90aWNlLFxuICBTZXR0aW5nLFxuICBURmlsZSxcbiAgcmVxdWVzdFVybCxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IHNwbGl0RnJvbnRtYXR0ZXIgfSBmcm9tIFwiLi4vbGliL21kVXRpbHNcIjtcbmltcG9ydCB7IFBpY2tWZXJzaW9uTW9kYWwgfSBmcm9tIFwic3JjL3VpL3BpY2stdmVyc2lvbi1tb2RhbFwiO1xuXG4vKiogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgQk9PSyBNQVAgKGRlZmF1bHQsIEVuZ2xpc2gpXG4gKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5jb25zdCBCT09LX0FCQlI6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIC8vIC0tLS0gUGVudGF0ZXVjaCAtLS0tXG4gIFwiR2VuZXNpc1wiOiBcIkdlblwiLFxuICBcIjEgTW9zZVwiOiBcIkdlblwiLCBcIjFNb3NlXCI6IFwiR2VuXCIsXG4gIFwiMS4gTW9zZVwiOiBcIkdlblwiLCBcIjEuTW9zZVwiOiBcIkdlblwiLFxuXG4gIFwiRXhvZHVzXCI6IFwiRXhvXCIsXG4gIFwiMiBNb3NlXCI6IFwiRXhvXCIsIFwiMk1vc2VcIjogXCJFeG9cIixcbiAgXCIyLiBNb3NlXCI6IFwiRXhvXCIsIFwiMi5Nb3NlXCI6IFwiRXhvXCIsXG5cbiAgXCJMZXZpdGljdXNcIjogXCJMZXZcIixcbiAgXCIzIE1vc2VcIjogXCJMZXZcIiwgXCIzTW9zZVwiOiBcIkxldlwiLFxuICBcIjMuIE1vc2VcIjogXCJMZXZcIiwgXCIzLk1vc2VcIjogXCJMZXZcIixcblxuICBcIk51bWJlcnNcIjogXCJOdW1cIixcbiAgXCJOdW1lcmlcIjogXCJOdW1cIixcbiAgXCI0IE1vc2VcIjogXCJOdW1cIiwgXCI0TW9zZVwiOiBcIk51bVwiLFxuICBcIjQuIE1vc2VcIjogXCJOdW1cIiwgXCI0Lk1vc2VcIjogXCJOdW1cIixcblxuICBcIkRldXRlcm9ub215XCI6IFwiRGV1dFwiLFxuICBcIkRldXRlcm9ub21pdW1cIjogXCJEZXV0XCIsXG4gIFwiNSBNb3NlXCI6IFwiRGV1dFwiLCBcIjVNb3NlXCI6IFwiRGV1dFwiLFxuICBcIjUuIE1vc2VcIjogXCJEZXV0XCIsIFwiNS5Nb3NlXCI6IFwiRGV1dFwiLFxuXG4gIC8vIC0tLS0gSGlzdG9yaWNhbCAtLS0tXG4gIFwiSm9zaHVhXCI6IFwiSm9zaFwiLCBcIkpvc3VhXCI6IFwiSm9zaFwiLFxuICBcIkp1ZGdlc1wiOiBcIkp1ZGdcIiwgXCJSaWNodGVyXCI6IFwiSnVkZ1wiLFxuICBcIlJ1dGhcIjogXCJSdXRoXCIsXG5cbiAgXCIxIFNhbXVlbFwiOiBcIjEgU2FtXCIsIFwiMS4gU2FtdWVsXCI6IFwiMSBTYW1cIiwgXCIxU2FtdWVsXCI6IFwiMSBTYW1cIiwgXCIxLlNhbXVlbFwiOiBcIjEgU2FtXCIsXG4gIFwiMiBTYW11ZWxcIjogXCIyIFNhbVwiLCBcIjIuIFNhbXVlbFwiOiBcIjIgU2FtXCIsIFwiMlNhbXVlbFwiOiBcIjIgU2FtXCIsIFwiMi5TYW11ZWxcIjogXCIyIFNhbVwiLFxuXG4gIFwiMSBLaW5nc1wiOiBcIjEgS2luZ3NcIiwgXCIxLiBLXHUwMEY2bmlnZVwiOiBcIjEgS2luZ3NcIiwgXCIxS1x1MDBGNm5pZ2VcIjogXCIxIEtpbmdzXCIsIFwiMS5LXHUwMEY2bmlnZVwiOiBcIjEgS2luZ3NcIixcbiAgXCIyIEtpbmdzXCI6IFwiMiBLaW5nc1wiLCBcIjIuIEtcdTAwRjZuaWdlXCI6IFwiMiBLaW5nc1wiLCBcIjJLXHUwMEY2bmlnZVwiOiBcIjIgS2luZ3NcIiwgXCIyLktcdTAwRjZuaWdlXCI6IFwiMiBLaW5nc1wiLFxuXG4gIFwiMSBDaHJvbmljbGVzXCI6IFwiMSBDaHJvblwiLCBcIjEuIENocm9uaWtcIjogXCIxIENocm9uXCIsIFwiMUNocm9uaWtcIjogXCIxIENocm9uXCIsIFwiMS5DaHJvbmlrXCI6IFwiMSBDaHJvblwiLFxuICBcIjIgQ2hyb25pY2xlc1wiOiBcIjIgQ2hyb25cIiwgXCIyLiBDaHJvbmlrXCI6IFwiMiBDaHJvblwiLCBcIjJDaHJvbmlrXCI6IFwiMiBDaHJvblwiLCBcIjIuQ2hyb25pa1wiOiBcIjIgQ2hyb25cIixcblxuICBcIkV6cmFcIjogXCJFenJhXCIsIFwiRXNyYVwiOiBcIkV6cmFcIixcbiAgXCJOZWhlbWlhaFwiOiBcIk5laFwiLCBcIk5laGVtaWFcIjogXCJOZWhcIixcbiAgXCJFc3RoZXJcIjogXCJFc3RoXCIsXG4gIFwiSm9iXCI6IFwiSm9iXCIsIFwiSGlvYlwiOiBcIkpvYlwiLFxuXG4gIC8vIC0tLS0gV2lzZG9tIC0tLS1cbiAgXCJQc2FsbXNcIjogXCJQc2FcIiwgXCJQc2FsbVwiOiBcIlBzYVwiLCBcIlBzXCI6IFwiUHNhXCIsXG4gIFwiUHJvdmVyYnNcIjogXCJQcm92XCIsIFwiU3ByXHUwMEZDY2hlXCI6IFwiUHJvdlwiLCBcIlNwclwiOiBcIlByb3ZcIixcbiAgXCJFY2NsZXNpYXN0ZXNcIjogXCJFY2NsXCIsIFwiUHJlZGlnZXJcIjogXCJFY2NsXCIsIFwiS29oZWxldFwiOiBcIkVjY2xcIixcbiAgXCJTb25nIG9mIFNvbG9tb25cIjogXCJTb1NcIiwgXCJTb25nIG9mIFNvbmdzXCI6IFwiU29TXCIsIFwiSG9oZXNsaWVkXCI6IFwiU29TXCIsIFwiSG9oZWxpZWRcIjogXCJTb1NcIiwgXCJMaWVkIGRlciBMaWVkZXJcIjogXCJTb1NcIiwgXCJTU1wiOiBcIlNvU1wiLFxuXG4gIC8vIC0tLS0gUHJvcGhldHMgLS0tLVxuICBcIklzYWlhaFwiOiBcIklzYVwiLCBcIkplc2FqYVwiOiBcIklzYVwiLFxuICBcIkplcmVtaWFoXCI6IFwiSmVyXCIsIFwiSmVyZW1pYVwiOiBcIkplclwiLFxuICBcIkxhbWVudGF0aW9uc1wiOiBcIkxhbVwiLCBcIktsYWdlbGllZGVyXCI6IFwiTGFtXCIsIFwiVGhyZW5pXCI6IFwiTGFtXCIsXG4gIFwiRXpla2llbFwiOiBcIkV6ZWtcIiwgXCJIZXNla2llbFwiOiBcIkV6ZWtcIiwgXCJFemVjaGllbFwiOiBcIkV6ZWtcIixcbiAgXCJEYW5pZWxcIjogXCJEYW5cIixcbiAgXCJIb3NlYVwiOiBcIkhvc2VhXCIsXG4gIFwiSm9lbFwiOiBcIkpvZWxcIixcbiAgXCJBbW9zXCI6IFwiQW1vc1wiLFxuICBcIk9iYWRpYWhcIjogXCJPYmFkXCIsIFwiT2JhZGphXCI6IFwiT2JhZFwiLFxuICBcIkpvbmFoXCI6IFwiSm9uYWhcIiwgXCJKb25hXCI6IFwiSm9uYWhcIixcbiAgXCJNaWNhaFwiOiBcIk1pY2FoXCIsIFwiTWljaGFcIjogXCJNaWNhaFwiLFxuICBcIk5haHVtXCI6IFwiTmFoXCIsXG4gIFwiSGFiYWtrdWtcIjogXCJIYWJcIiwgXCJIYWJha3VrXCI6IFwiSGFiXCIsXG4gIFwiWmVwaGFuaWFoXCI6IFwiWmVwXCIsIFwiWmVwaGFuamFcIjogXCJaZXBcIiwgXCJaZWZhbmphXCI6IFwiWmVwXCIsXG4gIFwiSGFnZ2FpXCI6IFwiSGFnXCIsXG4gIFwiWmVjaGFyaWFoXCI6IFwiWmVjaFwiLCBcIlNhY2hhcmphXCI6IFwiWmVjaFwiLFxuICBcIk1hbGFjaGlcIjogXCJNYWxcIiwgXCJNYWxlYWNoaVwiOiBcIk1hbFwiLFxuXG4gIC8vIC0tLS0gR29zcGVscyAmIEFjdHMgLS0tLVxuICBcIk1hdHRoZXdcIjogXCJNYXR0XCIsIFwiTWF0dGhcdTAwRTR1c1wiOiBcIk1hdHRcIiwgXCJNdFwiOiBcIk1hdHRcIixcbiAgXCJNYXJrXCI6IFwiTWFya1wiLCBcIk1hcmt1c1wiOiBcIk1hcmtcIiwgXCJNa1wiOiBcIk1hcmtcIixcbiAgXCJMdWtlXCI6IFwiTHVrZVwiLCBcIkx1a2FzXCI6IFwiTHVrZVwiLCBcIkxrXCI6IFwiTHVrZVwiLCBcIkx1a1wiOiBcIkx1a2VcIixcbiAgXCJKb2huXCI6IFwiSm9oblwiLCBcIkpvaGFubmVzXCI6IFwiSm9oblwiLCBcIkpvaFwiOiBcIkpvaG5cIixcbiAgXCJBY3RzXCI6IFwiQWN0c1wiLCBcIkFwZ1wiOiBcIkFjdHNcIiwgXCJBcG9zdGVsZ2VzY2hpY2h0ZVwiOiBcIkFjdHNcIixcblxuICAvLyAtLS0tIFBhdWxcdTIwMTlzIGxldHRlcnMgLS0tLVxuICBcIlJvbWFuc1wiOiBcIlJvbVwiLCBcIlJcdTAwRjZtZXJcIjogXCJSb21cIiwgXCJSXHUwMEY2bVwiOiBcIlJvbVwiLCBcIlJcdTAwRjZtZXJicmllZlwiOiBcIlJvbVwiLFxuXG4gIFwiMSBDb3JpbnRoaWFuc1wiOiBcIjEgQ29yXCIsIFwiMSBLb3JpbnRoZXJcIjogXCIxIENvclwiLCBcIjEuIEtvcmludGhlclwiOiBcIjEgQ29yXCIsIFwiMUtvcmludGhlclwiOiBcIjEgQ29yXCIsIFwiMS5Lb3JpbnRoZXJcIjogXCIxIENvclwiLFxuICBcIjEgS29yXCI6IFwiMSBDb3JcIiwgXCIxLiBLb3JcIjogXCIxIENvclwiLCBcIjFLb3JcIjogXCIxIENvclwiLCBcIjEuS29yXCI6IFwiMSBDb3JcIixcblxuICBcIjIgQ29yaW50aGlhbnNcIjogXCIyIENvclwiLCBcIjIgS29yaW50aGVyXCI6IFwiMiBDb3JcIiwgXCIyLiBLb3JpbnRoZXJcIjogXCIyIENvclwiLCBcIjJLb3JpbnRoZXJcIjogXCIyIENvclwiLCBcIjIuS29yaW50aGVyXCI6IFwiMiBDb3JcIixcbiAgXCIyIEtvclwiOiBcIjIgQ29yXCIsIFwiMi4gS29yXCI6IFwiMiBDb3JcIiwgXCIyS29yXCI6IFwiMiBDb3JcIiwgXCIyLktvclwiOiBcIjIgQ29yXCIsXG5cbiAgXCJHYWxhdGlhbnNcIjogXCJHYWxcIiwgXCJHYWxhdGVyXCI6IFwiR2FsXCIsIFwiR2FsXCI6IFwiR2FsXCIsXG4gIFwiRXBoZXNpYW5zXCI6IFwiRXBoXCIsIFwiRXBoZXNlclwiOiBcIkVwaFwiLCBcIkVwaFwiOiBcIkVwaFwiLFxuICBcIlBoaWxpcHBpYW5zXCI6IFwiUGhpbFwiLCBcIlBoaWxpcHBlclwiOiBcIlBoaWxcIiwgXCJQaGlsXCI6IFwiUGhpbFwiLFxuICBcIkNvbG9zc2lhbnNcIjogXCJDb2xcIiwgXCJLb2xvc3NlclwiOiBcIkNvbFwiLCBcIktvbFwiOiBcIkNvbFwiLFxuXG4gIFwiMSBUaGVzc2Fsb25pYW5zXCI6IFwiMSBUaGVzXCIsIFwiMSBUaGVzc1wiOiBcIjEgVGhlc1wiLCBcIjEuIFRoZXNzXCI6IFwiMSBUaGVzXCIsIFwiMVRoZXNzXCI6IFwiMSBUaGVzXCIsIFwiMS5UaGVzc1wiOiBcIjEgVGhlc1wiLFxuICBcIjEgVGhlc3NhbG9uaWNoZXJcIjogXCIxIFRoZXNcIiwgXCIxLiBUaGVzc2Fsb25pY2hlclwiOiBcIjEgVGhlc1wiLCBcIjFUaGVzc2Fsb25pY2hlclwiOiBcIjEgVGhlc1wiLCBcIjEuVGhlc3NhbG9uaWNoZXJcIjogXCIxIFRoZXNcIixcblxuICBcIjIgVGhlc3NhbG9uaWFuc1wiOiBcIjIgVGhlc1wiLCBcIjIgVGhlc3NcIjogXCIyIFRoZXNcIiwgXCIyLiBUaGVzc1wiOiBcIjIgVGhlc1wiLCBcIjJUaGVzc1wiOiBcIjIgVGhlc1wiLCBcIjIuVGhlc3NcIjogXCIyIFRoZXNcIixcbiAgXCIyIFRoZXNzYWxvbmljaGVyXCI6IFwiMiBUaGVzXCIsIFwiMi4gVGhlc3NhbG9uaWNoZXJcIjogXCIyIFRoZXNcIiwgXCIyVGhlc3NhbG9uaWNoZXJcIjogXCIyIFRoZXNcIiwgXCIyLlRoZXNzYWxvbmljaGVyXCI6IFwiMiBUaGVzXCIsXG5cbiAgXCIxIFRpbW90aHlcIjogXCIxIFRpbVwiLCBcIjEgVGltb3RoZXVzXCI6IFwiMSBUaW1cIiwgXCIxLiBUaW1vdGhldXNcIjogXCIxIFRpbVwiLCBcIjFUaW1vdGhldXNcIjogXCIxIFRpbVwiLCBcIjEuVGltb3RoZXVzXCI6IFwiMSBUaW1cIixcbiAgXCIxIFRpbVwiOiBcIjEgVGltXCIsIFwiMS4gVGltXCI6IFwiMSBUaW1cIiwgXCIxVGltXCI6IFwiMSBUaW1cIiwgXCIxLlRpbVwiOiBcIjEgVGltXCIsXG5cbiAgXCIyIFRpbW90aHlcIjogXCIyIFRpbVwiLCBcIjIgVGltb3RoZXVzXCI6IFwiMiBUaW1cIiwgXCIyLiBUaW1vdGhldXNcIjogXCIyIFRpbVwiLCBcIjJUaW1vdGhldXNcIjogXCIyIFRpbVwiLCBcIjIuVGltb3RoZXVzXCI6IFwiMiBUaW1cIixcbiAgXCIyIFRpbVwiOiBcIjIgVGltXCIsIFwiMi4gVGltXCI6IFwiMiBUaW1cIiwgXCIyVGltXCI6IFwiMiBUaW1cIiwgXCIyLlRpbVwiOiBcIjIgVGltXCIsXG5cbiAgXCJUaXR1c1wiOiBcIlRpdHVzXCIsXG4gIFwiUGhpbGVtb25cIjogXCJQaGlsZW1cIixcblxuICBcIkhlYnJld3NcIjogXCJIZWJcIiwgXCJIZWJyXHUwMEU0ZXJcIjogXCJIZWJcIiwgXCJIZWJyXCI6IFwiSGViXCIsXG5cbiAgLy8gLS0tLSBDYXRob2xpYyAmIEdlbmVyYWwgbGV0dGVycyAtLS0tXG4gIFwiSmFtZXNcIjogXCJKYW1lc1wiLCBcIkpha29idXNcIjogXCJKYW1lc1wiLCBcIkpha1wiOiBcIkphbWVzXCIsXG4gIFwiMSBQZXRlclwiOiBcIjEgUGV0XCIsIFwiMSBQZXRydXNcIjogXCIxIFBldFwiLCBcIjEuIFBldHJ1c1wiOiBcIjEgUGV0XCIsIFwiMVBldHJ1c1wiOiBcIjEgUGV0XCIsIFwiMS5QZXRydXNcIjogXCIxIFBldFwiLFxuICBcIjEgUGV0XCI6IFwiMSBQZXRcIiwgXCIxLiBQZXRcIjogXCIxIFBldFwiLCBcIjEuIFBldHJcIjogXCIxIFBldFwiLCBcIjEuUGV0clwiOiBcIjEgUGV0XCIsIFwiMVBldFwiOiBcIjEgUGV0XCIsIFwiMS5QZXRcIjogXCIxIFBldFwiLFxuXG4gIFwiMiBQZXRlclwiOiBcIjIgUGV0XCIsIFwiMiBQZXRydXNcIjogXCIyIFBldFwiLCBcIjIuIFBldHJ1c1wiOiBcIjIgUGV0XCIsIFwiMlBldHJ1c1wiOiBcIjIgUGV0XCIsIFwiMi5QZXRydXNcIjogXCIyIFBldFwiLFxuICBcIjIgUGV0XCI6IFwiMiBQZXRcIiwgXCIyLiBQZXRcIjogXCIyIFBldFwiLCBcIjIuIFBldHJcIjogXCIyIFBldFwiLCBcIjIuUGV0clwiOiBcIjIgUGV0XCIsIFwiMlBldFwiOiBcIjIgUGV0XCIsIFwiMi5QZXRcIjogXCIyIFBldFwiLFxuXG4gIFwiMSBKb2huXCI6IFwiMSBKb2huXCIsIFwiMSBKb2hhbm5lc1wiOiBcIjEgSm9oblwiLCBcIjEuIEpvaGFubmVzXCI6IFwiMSBKb2huXCIsIFwiMUpvaGFubmVzXCI6IFwiMSBKb2huXCIsIFwiMS5Kb2hhbm5lc1wiOiBcIjEgSm9oblwiLFxuICBcIjEgSm9oXCI6IFwiMSBKb2huXCIsIFwiMS4gSm9oXCI6IFwiMSBKb2huXCIsIFwiMUpvaFwiOiBcIjEgSm9oblwiLCBcIjEuSm9oXCI6IFwiMSBKb2huXCIsXG5cbiAgXCIyIEpvaG5cIjogXCIyIEpvaG5cIiwgXCIyIEpvaGFubmVzXCI6IFwiMiBKb2huXCIsIFwiMi4gSm9oYW5uZXNcIjogXCIyIEpvaG5cIiwgXCIySm9oYW5uZXNcIjogXCIyIEpvaG5cIiwgXCIyLkpvaGFubmVzXCI6IFwiMiBKb2huXCIsXG4gIFwiMiBKb2hcIjogXCIyIEpvaG5cIiwgXCIyLiBKb2hcIjogXCIyIEpvaG5cIiwgXCIySm9oXCI6IFwiMiBKb2huXCIsIFwiMi5Kb2hcIjogXCIyIEpvaG5cIixcblxuICBcIjMgSm9oblwiOiBcIjMgSm9oblwiLCBcIjMgSm9oYW5uZXNcIjogXCIzIEpvaG5cIiwgXCIzLiBKb2hhbm5lc1wiOiBcIjMgSm9oblwiLCBcIjNKb2hhbm5lc1wiOiBcIjMgSm9oblwiLCBcIjMuSm9oYW5uZXNcIjogXCIzIEpvaG5cIixcbiAgXCIzIEpvaFwiOiBcIjMgSm9oblwiLCBcIjMuIEpvaFwiOiBcIjMgSm9oblwiLCBcIjNKb2hcIjogXCIzIEpvaG5cIiwgXCIzLkpvaFwiOiBcIjMgSm9oblwiLFxuXG4gIFwiSnVkZVwiOiBcIkp1ZGVcIiwgXCJKdWRhc1wiOiBcIkp1ZGVcIixcblxuICAvLyAtLS0tIFJldmVsYXRpb24gLS0tLVxuICBcIlJldmVsYXRpb25cIjogXCJSZXZcIiwgXCJPZmZlbmJhcnVuZ1wiOiBcIlJldlwiLCBcIk9mZmJcIjogXCJSZXZcIiwgXCJBcG9rYWx5cHNlXCI6IFwiUmV2XCJcbn07XG5cblxudHlwZSBCb29rTWFwID0gUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbmNvbnN0IGVzY2FwZVJlID0gKHM6IHN0cmluZykgPT4gcy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG5jb25zdCBSQU5HRV9TRVAgPSAvW1xcLVxcdTIwMTBcXHUyMDExXFx1MjAxMlxcdTIwMTNcXHUyMDE0XFx1MjAxNV0vOyAgLy8gZW4gZGFzaCwgZW0gZGFzaCwgaHlwaGVuXG5jb25zdCBUUklNX1RBSUxfUFVOQ1QgPSAvWyw6Oy5cXCldJC87IC8vIGNvbW1vbiB0cmFpbGluZyBwdW5jdHVhdGlvbiB0byBkcm9wIGZvciBwYXJzaW5nIChrZXB0IGluIGRpc3BsYXkpXG5cbi8qKiBCdWlsZCBsb2NhbGUtc3BlY2lmaWMgYm9vayBtYXAgKyBhbHRlcm5hdGlvbiBhdCBydW50aW1lICovXG5mdW5jdGlvbiBidWlsZEJvb2tDb250ZXh0KHNldHRpbmdzPzogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGxldCBib29rTG9jYWxlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGxldCBjdXN0b206IHVua25vd247XG5cbiAgdHJ5IHsgYm9va0xvY2FsZSA9IChzZXR0aW5ncyBhcyBhbnkpPy5ib29rTG9jYWxlIGFzIHN0cmluZyB8IHVuZGVmaW5lZDsgfSBjYXRjaCB7fVxuICB0cnkgeyBjdXN0b20gPSAoc2V0dGluZ3MgYXMgYW55KT8uY3VzdG9tQm9va01hcDsgfSBjYXRjaCB7fVxuXG4gIGxldCBhYmJyOiBCb29rTWFwID0gQk9PS19BQkJSO1xuXG4gIGlmIChib29rTG9jYWxlID09PSBcImN1c3RvbVwiICYmIGN1c3RvbSkge1xuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIGN1c3RvbSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGN1c3RvbSk7XG4gICAgICAgIGlmIChwYXJzZWQgJiYgdHlwZW9mIHBhcnNlZCA9PT0gXCJvYmplY3RcIikgYWJiciA9IHBhcnNlZCBhcyBCb29rTWFwO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY3VzdG9tID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIGFiYnIgPSBjdXN0b20gYXMgQm9va01hcDtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIGFiYnIgPSBCT09LX0FCQlI7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGFiYnIgPSBCT09LX0FCQlI7XG4gIH1cblxuICBjb25zdCBhbGxUb2tlbnMgPSBBcnJheS5mcm9tKG5ldyBTZXQoWy4uLk9iamVjdC5rZXlzKGFiYnIpLCAuLi5PYmplY3QudmFsdWVzKGFiYnIpXSkpLnNvcnQoXG4gICAgKGEsIGIpID0+IGIubGVuZ3RoIC0gYS5sZW5ndGhcbiAgKTtcbiAgY29uc3QgQk9PS19BTFQgPSBhbGxUb2tlbnMubWFwKGVzY2FwZVJlKS5qb2luKFwifFwiKTtcblxuICBjb25zdCBnZXRCb29rQWJiciA9IChib29rOiBzdHJpbmcpID0+IGFiYnJbYm9va10gPz8gYm9vaztcblxuICBjb25zdCBidWlsZFBhdHRlcm5Cb2R5ID0gKCk6IHN0cmluZyA9PiB7XG4gICAgY29uc3QgYm9vayA9IGAoPzoke0JPT0tfQUxUfSlgO1xuICAgIC8vIGNvbnN0IHJlZjEgPVxuICAgIC8vICAgYCg/Oig/OiR7Ym9va30pXFxcXC4/XFxcXHMqYCArXG4gICAgLy8gICBgXFxcXGQrKD86LVxcXFxkKyk/OlxcXFxkK1thLXpdPyg/Oi1cXFxcZCspP1thLXpdP2AgK1xuICAgIC8vICAgYCg/OlxcXFxzKixcXFxccypcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT98XFxcXHMqO1xcXFxzKlxcXFxkKzpcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT8pKmAgK1xuICAgIC8vICAgYClgO1xuICAgIGNvbnN0IHJlZjEgPVxuICAgICAgYCg/Oig/OiR7Ym9va30pP1xcXFwuP1xcXFxzKmAgK1xuICAgICAgYFxcXFxkKyg/OiR7UkFOR0VfU0VQLnNvdXJjZX1cXFxcZCspPzpcXFxcZCtbYS16XT8oPzoke1JBTkdFX1NFUC5zb3VyY2V9XFxcXGQrKT9bYS16XT9gICtcbiAgICAgIGAoPzpcXFxccyosXFxcXHMqXFxcXGQrW2Etel0/KD86JHtSQU5HRV9TRVAuc291cmNlfVxcXFxkKyk/W2Etel0/fFxcXFxzKjtcXFxccypcXFxcZCs6XFxcXGQrW2Etel0/KD86JHtSQU5HRV9TRVAuc291cmNlfVxcXFxkKyk/W2Etel0/KSpgICtcbiAgICAgIGApYDtcbiAgICBjb25zdCByZWYyID0gYCg/Oigke2Jvb2t9KVxcXFwuP1xcXFxzKyhcXFxcZCspKD86JHtSQU5HRV9TRVAuc291cmNlfShcXFxcZCspKT8pYDtcbiAgICBjb25zdCBSRUYgPSBgKD88cmVmPiR7cmVmMX18JHtyZWYyfSlgO1xuXG4gICAgY29uc3QgVkVSU0UgPVxuICAgICAgYCg/PHZlcnNlPmAgK1xuICAgICAgYFxcXFxiW1Z2XXY/KD86XFxcXC58ZXJzZXM/KVxcXFxzKmAgK1xuICAgICAgYFxcXFxkK1thLXpdPyg/OiR7UkFOR0VfU0VQLnNvdXJjZX1cXFxcZCspP1thLXpdP2AgK1xuICAgICAgYCg/Oig/Oix8LD9cXFxccyphbmQpXFxcXHMqXFxcXGQrKD86JHtSQU5HRV9TRVAuc291cmNlfVxcXFxkKyk/W2Etel0/KSpgICtcbiAgICAgIGApYDtcblxuICAgIGNvbnN0IENIQVBURVIgPVxuICAgICAgYCg/PGNoYXB0ZXI+YCArXG4gICAgICBgXFxcXGJbQ2NdaCg/OmFwdGVycz98cz9cXFxcLilcXFxcLj9cXFxccypgICtcbiAgICAgIGBcXFxcZCsoPzoke1JBTkdFX1NFUC5zb3VyY2V9XFxcXGQrKT9gICtcbiAgICAgIGApYDtcblxuICAgIGNvbnN0IE5PVEUgPVxuICAgICAgYCg/PG5vdGU+YCArXG4gICAgICBgXFxcXGJbTm5db3Rlcz9gICtcbiAgICAgIGAoPzpcXFxccytcXFxcZCsoPzpcXFxccytcXFxcZCspP2AgK1xuICAgICAgYCg/OmAgK1xuICAgICAgYCg/OlssO118LD9cXFxccyphbmQpXFxcXHMqXFxcXGQrKD86XFxcXHMrXFxcXGQrKT9gICtcbiAgICAgIGAoPzpcXFxccytpblxcXFxzKyR7Ym9va31cXFxcLj9cXFxccytcXFxcZCspP2AgK1xuICAgICAgYCkqYCArXG4gICAgICBgKWAgK1xuICAgICAgYCg/OlxcXFxzK2luXFxcXHMrJHtib29rfVxcXFwuP1xcXFxzK1xcXFxkKyk/YCArXG4gICAgICBgKWA7XG5cbiAgICBjb25zdCBCT09LID0gYCg/PGJvb2s+XFxcXGIoPzoke2Jvb2t9KVxcXFxiKSg/IVxcXFwuP1xcXFxzKlxcXFxkKylgO1xuXG4gICAgcmV0dXJuIGAke1JFRn18JHtWRVJTRX18JHtDSEFQVEVSfXwke05PVEV9fCR7Qk9PS31gO1xuICB9O1xuXG4gIGNvbnN0IFBBVFRFUk5fQk9EWSA9IGJ1aWxkUGF0dGVybkJvZHkoKTtcbiAgY29uc3QgUEFUVEVSTl9HID0gbmV3IFJlZ0V4cChQQVRURVJOX0JPRFksIFwiZ1wiKTtcbiAgY29uc3QgUEFUVEVSTl9IRUFEID0gbmV3IFJlZ0V4cChcIl5cIiArIFBBVFRFUk5fQk9EWSk7XG5cbiAgcmV0dXJuIHsgYWJiciwgYWxsVG9rZW5zLCBCT09LX0FMVCwgZ2V0Qm9va0FiYnIsIFBBVFRFUk5fRywgUEFUVEVSTl9IRUFEIH07XG59XG5cbi8qKiAtLS0tLS0tLS0tLS0tLS0tIFV0aWxpdHk6IG5vcm1hbGl6ZSBib29rIHRva2VuIHRvIHJlbW92ZSB0cmFpbGluZyBwZXJpb2QgLS0tLS0tLS0tLS0tLS0tICovXG5mdW5jdGlvbiBub3JtYWxpemVCb29rVG9rZW4ocmF3OiBzdHJpbmcsIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4pOiBzdHJpbmcge1xuICAvLyBUcmltIGFuZCBkcm9wIGEgc2luZ2xlIHRyYWlsaW5nIGRvdCAoZS5nLiwgXCJSb20uXCIgLT4gXCJSb21cIilcbiAgY29uc3QgY2xlYW5lZCA9IHJhdy50cmltKCkucmVwbGFjZSgvXFwuJC8sIFwiXCIpO1xuICByZXR1cm4gY3R4LmdldEJvb2tBYmJyKGNsZWFuZWQpO1xufVxuXG4vKiogLS0tLS0tLS0tLS0tLS0gUHJvdGVjdGVkIHJhbmdlcyAoZG9uXHUyMDE5dCB0b3VjaCB3aGlsZSBsaW5raW5nKSAtLS0tLS0tLS0tLS0tLSAqL1xudHlwZSBSYW5nZSA9IFtzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcl07XG5cbmZ1bmN0aW9uIGFkZFJhbmdlKHJhbmdlczogUmFuZ2VbXSwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbiAgaWYgKHN0YXJ0ID49IDAgJiYgZW5kID4gc3RhcnQpIHJhbmdlcy5wdXNoKFtzdGFydCwgZW5kXSk7XG59XG5cbmZ1bmN0aW9uIGZpbmRQcm90ZWN0ZWRSYW5nZXModGV4dDogc3RyaW5nKTogUmFuZ2VbXSB7XG4gIGNvbnN0IHJhbmdlczogUmFuZ2VbXSA9IFtdO1xuXG4gIC8vIDEpIENvZGUgZmVuY2VzIGBgYC4uLmBgYCBhbmQgfn5+Li4ufn5+XG4gIGNvbnN0IGZlbmNlUmUgPSAvKGBgYHx+fn4pW15cXG5dKlxcbltcXHNcXFNdKj9cXDEvZztcbiAgZm9yIChsZXQgbTsgKG0gPSBmZW5jZVJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuICAvLyAyKSBNYXRoIGJsb2NrcyAkJC4uLiQkXG4gIGNvbnN0IG1hdGhCbG9ja1JlID0gL1xcJFxcJFtcXHNcXFNdKj9cXCRcXCQvZztcbiAgZm9yIChsZXQgbTsgKG0gPSBtYXRoQmxvY2tSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbiAgLy8gMykgSW5saW5lIGNvZGUgYC4uLmBcbiAgY29uc3QgaW5saW5lQ29kZVJlID0gL2BbXmBcXG5dKmAvZztcbiAgZm9yIChsZXQgbTsgKG0gPSBpbmxpbmVDb2RlUmUuZXhlYyh0ZXh0KSk7ICkgYWRkUmFuZ2UocmFuZ2VzLCBtLmluZGV4LCBtLmluZGV4ICsgbVswXS5sZW5ndGgpO1xuXG4gIC8vIDQpIElubGluZSBtYXRoICQuLi4kIChhdm9pZCAkJClcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgKSB7XG4gICAgaWYgKHRleHRbaV0gPT09IFwiJFwiICYmIHRleHRbaSArIDFdICE9PSBcIiRcIikge1xuICAgICAgY29uc3Qgc3RhcnQgPSBpO1xuICAgICAgaSsrO1xuICAgICAgd2hpbGUgKGkgPCB0ZXh0Lmxlbmd0aCAmJiB0ZXh0W2ldICE9PSBcIiRcIikgaSsrO1xuICAgICAgaWYgKGkgPCB0ZXh0Lmxlbmd0aCAmJiB0ZXh0W2ldID09PSBcIiRcIikge1xuICAgICAgICBhZGRSYW5nZShyYW5nZXMsIHN0YXJ0LCBpICsgMSk7XG4gICAgICAgIGkrKztcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfVxuICAgIGkrKztcbiAgfVxuXG4gIC8vIDUpIE1hcmtkb3duIGxpbmtzIFt0ZXh0XSh1cmwpXG4gIGNvbnN0IG1kTGlua1JlID0gL1xcW1teXFxdXSs/XFxdXFwoW14pXStcXCkvZztcbiAgZm9yIChsZXQgbTsgKG0gPSBtZExpbmtSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbiAgLy8gNikgSW5saW5lIHByb3BlcnRpZXMgbGluZXM6ICBrZXk6OiB2YWx1ZVxuICBjb25zdCBpbmxpbmVQcm9wUmUgPSAvXlteXFxuOl17MSwyMDB9OjouKiQvZ207XG4gIGZvciAobGV0IG07IChtID0gaW5saW5lUHJvcFJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuICAvLyA3KSBPYnNpZGlhbiBsaW5rcyBbWy4uLl1dXG4gIGNvbnN0IG9ic2lkaWFuUmUgPSAvXFxbXFxbW15cXF1dKj9cXF1cXF0vZztcbiAgZm9yIChsZXQgbTsgKG0gPSBvYnNpZGlhblJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuICAvLyBNZXJnZSBvdmVybGFwcyAmIHNvcnRcbiAgcmFuZ2VzLnNvcnQoKGEsIGIpID0+IGFbMF0gLSBiWzBdKTtcbiAgY29uc3QgbWVyZ2VkOiBSYW5nZVtdID0gW107XG4gIGZvciAoY29uc3QgciBvZiByYW5nZXMpIHtcbiAgICBpZiAoIW1lcmdlZC5sZW5ndGggfHwgclswXSA+IG1lcmdlZFttZXJnZWQubGVuZ3RoIC0gMV1bMV0pIG1lcmdlZC5wdXNoKHIpO1xuICAgIGVsc2UgbWVyZ2VkW21lcmdlZC5sZW5ndGggLSAxXVsxXSA9IE1hdGgubWF4KG1lcmdlZFttZXJnZWQubGVuZ3RoIC0gMV1bMV0sIHJbMV0pO1xuICB9XG4gIHJldHVybiBtZXJnZWQ7XG59XG5cbmZ1bmN0aW9uIGluUHJvdGVjdGVkKHBvczogbnVtYmVyLCByYW5nZXM6IFJhbmdlW10pOiBib29sZWFuIHtcbiAgbGV0IGxvID0gMCwgaGkgPSByYW5nZXMubGVuZ3RoIC0gMTtcbiAgd2hpbGUgKGxvIDw9IGhpKSB7XG4gICAgY29uc3QgbWlkID0gKGxvICsgaGkpID4+IDE7XG4gICAgY29uc3QgW3MsIGVdID0gcmFuZ2VzW21pZF07XG4gICAgaWYgKHBvcyA8IHMpIGhpID0gbWlkIC0gMTtcbiAgICBlbHNlIGlmIChwb3MgPj0gZSkgbG8gPSBtaWQgKyAxO1xuICAgIGVsc2UgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc1dpdGhpbk9ic2lkaWFuTGluayh0ZXh0OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGJlZm9yZSA9IHRleHQuc2xpY2UoMCwgc3RhcnQpO1xuICBjb25zdCBhZnRlciA9IHRleHQuc2xpY2UoZW5kKTtcbiAgY29uc3Qgb3BlbklkeCA9IGJlZm9yZS5sYXN0SW5kZXhPZihcIltbXCIpO1xuICBjb25zdCBjbG9zZUlkeCA9IGJlZm9yZS5sYXN0SW5kZXhPZihcIl1dXCIpO1xuICBpZiAob3BlbklkeCA+IGNsb3NlSWR4KSB7XG4gICAgY29uc3QgbmV4dENsb3NlID0gYWZ0ZXIuaW5kZXhPZihcIl1dXCIpO1xuICAgIGlmIChuZXh0Q2xvc2UgIT09IC0xKSByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKiBQYXJlbnRoZXRpY2FsIG5vaXNlOiBza2lwIGlmIGluc2lkZSBcIigyMDE5KVwiLWxpa2UgcGFyZW50aGVzZXMgKi9cbmZ1bmN0aW9uIGlzSW5zaWRlTnVtZXJpY1BhcmVucyh0ZXh0OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IG9wZW4gPSB0ZXh0Lmxhc3RJbmRleE9mKFwiKFwiLCBzdGFydCk7XG4gIGlmIChvcGVuID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBjbG9zZSA9IHRleHQuaW5kZXhPZihcIilcIiwgZW5kKTtcbiAgaWYgKGNsb3NlID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBpbm5lciA9IHRleHQuc2xpY2Uob3BlbiArIDEsIGNsb3NlKS50cmltKCk7XG4gIGlmICgvXlxcZHsxLDR9KD86W1xcL1xcLlxcLTpdXFxkezEsMn0oPzpbXFwvXFwuXFwtOl1cXGR7MSw0fSk/KT8kLy50ZXN0KGlubmVyKSkgcmV0dXJuIHRydWU7XG4gIGlmICgvXnB7MSwyfVxcLlxccypcXGQrKFxccyotXFxzKlxcZCspPyQvaS50ZXN0KGlubmVyKSkgcmV0dXJuIHRydWU7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0gTWFya2Rvd24vT2JzaWRpYW4gbGluayBjbGVhbnVwIChQeXRob24gcGFyaXR5KSAtLS0tLS0tLS0tLS0tLS0tLS0tICovXG5mdW5jdGlvbiByZW1vdmVNYXRjaGluZ01hcmtkb3duTGlua3ModGV4dDogc3RyaW5nLCBQQVRURVJOX0hFQUQ6IFJlZ0V4cCk6IHN0cmluZyB7XG4gIGNvbnN0IG1kTGluayA9IC8oXFwqXFwqfF9ffFxcKik/XFxbKFteXFxdXSspXFxdXFwoW14pXStcXCkoXFwqXFwqfF9ffFxcKik/L2c7XG4gIHJldHVybiB0ZXh0LnJlcGxhY2UobWRMaW5rLCAoX20sIHByZSwgZGlzcCwgc3VmKSA9PiB7XG4gICAgY29uc3QgbGlua1RleHQgPSBTdHJpbmcoZGlzcCk7XG4gICAgaWYgKFBBVFRFUk5fSEVBRC50ZXN0KGxpbmtUZXh0KSkgcmV0dXJuIGxpbmtUZXh0O1xuICAgIGNvbnN0IHNpbXBsZU51bSA9IC9eXFxkKyg/Ols6LV1cXGQrKT8oPzotXFxkKyk/JC8udGVzdChsaW5rVGV4dCk7XG4gICAgaWYgKHNpbXBsZU51bSkgcmV0dXJuIGxpbmtUZXh0O1xuICAgIHJldHVybiBgJHtwcmUgPz8gXCJcIn1bJHtsaW5rVGV4dH1dJHtzdWYgPz8gXCJcIn1gO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlTWF0Y2hpbmdPYnNpZGlhbkxpbmtzKHRleHQ6IHN0cmluZywgUEFUVEVSTl9IRUFEOiBSZWdFeHApOiBzdHJpbmcge1xuICBjb25zdCBvYnMgPSAvXFxbXFxbKFteXFxdfF0rKVxcfChbXlxcXV0rKVxcXVxcXS9nO1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKG9icywgKF9tLCBfdCwgZGlzcCkgPT4ge1xuICAgIGNvbnN0IGRpc3BsYXkgPSBTdHJpbmcoZGlzcCk7XG4gICAgaWYgKFBBVFRFUk5fSEVBRC50ZXN0KGRpc3BsYXkpKSByZXR1cm4gZGlzcGxheTtcbiAgICBjb25zdCBzaW1wbGVOdW0gPSAvXlxcZCsoPzpbOi1dXFxkKyk/KD86LVxcZCspPyQvLnRlc3QoZGlzcGxheSk7XG4gICAgaWYgKHNpbXBsZU51bSkgcmV0dXJuIGRpc3BsYXk7XG4gICAgcmV0dXJuIF9tO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZU9sZE9ic2lkaWFuTGlua3ModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgb2xkTGluayA9IC9cXFtcXFsoWzAtOV0/XFxzW0EtWmEteiBdKylcXHMoXFxkKykjXFxeKFxcZCspKD86XFx8KFteXFxdXSspKT9cXF1cXF0vZztcbiAgcmV0dXJuIHRleHQucmVwbGFjZShvbGRMaW5rLCAoX20sIGJvb2tTaG9ydCwgY2gsIHZlcnNlLCBkaXNwKSA9PiB7XG4gICAgY29uc3QgYiA9IFN0cmluZyhib29rU2hvcnQpLnRyaW0oKTtcbiAgICByZXR1cm4gZGlzcFxuICAgICAgPyBgW1ske2J9I14ke2NofS0ke3ZlcnNlfXwke2Rpc3B9XV1gXG4gICAgICA6IGBbWyR7Yn0jXiR7Y2h9LSR7dmVyc2V9XV1gO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZmluZExhc3RCb29rQmVmb3JlKHRleHQ6IHN0cmluZywgcG9zOiBudW1iZXIsIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4pOiBzdHJpbmcgfCBudWxsIHtcbiAgLy8gTG9vayBiYWNrIH4yMDAgY2hhcnMgZm9yIGEgYm9vayB0b2tlbiBlbmRpbmcgcmlnaHQgYmVmb3JlICdwb3MnXG4gIGNvbnN0IHN0YXJ0ID0gTWF0aC5tYXgoMCwgcG9zIC0gMjAwKTtcbiAgY29uc3QgbGVmdCA9IHRleHQuc2xpY2Uoc3RhcnQsIHBvcyk7XG5cbiAgLy8gTWF0Y2ggQUxMIGJvb2sgdG9rZW5zIGluIHRoZSB3aW5kb3c7IHRha2UgdGhlIGxhc3Qgb25lLlxuICBjb25zdCByZSA9IG5ldyBSZWdFeHAoYCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccyokfCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccytgLCBcImdcIik7XG4gIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICBsZXQgbGFzdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgd2hpbGUgKChtID0gcmUuZXhlYyhsZWZ0KSkgIT09IG51bGwpIHtcbiAgICBsYXN0ID0gbVswXS50cmltKCk7XG4gIH1cbiAgaWYgKCFsYXN0KSByZXR1cm4gbnVsbDtcblxuICAvLyBzdHJpcCB0cmFpbGluZyBwdW5jdHVhdGlvbi9kb3QgYW5kIG5vcm1hbGl6ZVxuICByZXR1cm4gbm9ybWFsaXplQm9va1Rva2VuKGxhc3QucmVwbGFjZSgvXFxzKyQvLCBcIlwiKSwgY3R4KTtcbn1cblxuLyoqIC0tLS0tLS0tLS0tLSBWZXJzaW9uLWF3YXJlIGxpbmsgdGFyZ2V0IC0tLS0tLS0tLS0tLSAqL1xuZnVuY3Rpb24gZm9ybWF0Qm9va1RhcmdldChib29rU2hvcnQ6IHN0cmluZywgdmVyc2lvblNob3J0Pzogc3RyaW5nIHwgbnVsbCk6IHN0cmluZyB7XG4gIGlmICghdmVyc2lvblNob3J0KSByZXR1cm4gYm9va1Nob3J0O1xuICByZXR1cm4gYCR7Ym9va1Nob3J0fSAoJHt2ZXJzaW9uU2hvcnR9KWA7XG59XG5cbi8qKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQ29yZSBsaW5rZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5mdW5jdGlvbiByZXBsYWNlVmVyc2VSZWZlcmVuY2VzT2ZNYWluVGV4dChcbiAgdGV4dDogc3RyaW5nLFxuICBjdHg6IFJldHVyblR5cGU8dHlwZW9mIGJ1aWxkQm9va0NvbnRleHQ+LFxuICBvcHRzOiB7XG4gICAgcmVtb3ZlT2JzaWRpYW5MaW5rczogYm9vbGVhbjtcbiAgICByZXdyaXRlT2xkTGlua3M6IGJvb2xlYW47XG4gICAgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZTogYm9vbGVhbjtcbiAgICB2ZXJzaW9uU2hvcnQ/OiBzdHJpbmcgfCBudWxsOyAvLyBORVdcbiAgfVxuKTogc3RyaW5nIHtcbiAgaWYgKG9wdHMuc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSkgdGV4dCA9IHJlbW92ZU1hdGNoaW5nTWFya2Rvd25MaW5rcyh0ZXh0LCBjdHguUEFUVEVSTl9IRUFEKTtcbiAgaWYgKG9wdHMucmVtb3ZlT2JzaWRpYW5MaW5rcykgdGV4dCA9IHJlbW92ZU1hdGNoaW5nT2JzaWRpYW5MaW5rcyh0ZXh0LCBjdHguUEFUVEVSTl9IRUFEKTtcbiAgaWYgKG9wdHMucmV3cml0ZU9sZExpbmtzKSB0ZXh0ID0gcmVwbGFjZU9sZE9ic2lkaWFuTGlua3ModGV4dCk7XG5cbiAgY29uc3QgcHJvdGVjdGVkUmFuZ2VzID0gZmluZFByb3RlY3RlZFJhbmdlcyh0ZXh0KTtcblxuICBsZXQgY3VycmVudF9ib29rOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgbGV0IGN1cnJlbnRfY2hhcHRlcjogbnVtYmVyIHwgc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGxldCBjdXJyZW50X3ZlcnNlOiBudW1iZXIgfCBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIGxldCBsYXN0UG9zID0gMDtcblxuICBjb25zdCB0YXJnZXRPZiA9IChib29rU2hvcnQ6IHN0cmluZykgPT4gZm9ybWF0Qm9va1RhcmdldChib29rU2hvcnQsIG9wdHMudmVyc2lvblNob3J0KTtcblxuICBjdHguUEFUVEVSTl9HLmxhc3RJbmRleCA9IDA7XG4gIGZvciAobGV0IG06IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGwgPSBjdHguUEFUVEVSTl9HLmV4ZWModGV4dCk7IG07IG0gPSBjdHguUEFUVEVSTl9HLmV4ZWModGV4dCkpIHtcbiAgICBjb25zdCBzdGFydCA9IG0uaW5kZXg7XG4gICAgY29uc3QgZW5kID0gc3RhcnQgKyBtWzBdLmxlbmd0aDtcblxuICAgIGlmIChcbiAgICAgIGluUHJvdGVjdGVkKHN0YXJ0LCBwcm90ZWN0ZWRSYW5nZXMpIHx8XG4gICAgICBpblByb3RlY3RlZChlbmQgLSAxLCBwcm90ZWN0ZWRSYW5nZXMpIHx8XG4gICAgICBpc1dpdGhpbk9ic2lkaWFuTGluayh0ZXh0LCBzdGFydCwgZW5kKSB8fFxuICAgICAgaXNJbnNpZGVOdW1lcmljUGFyZW5zKHRleHQsIHN0YXJ0LCBlbmQpXG4gICAgKSB7XG4gICAgICBvdXQucHVzaCh0ZXh0LnNsaWNlKGxhc3RQb3MsIHN0YXJ0KSwgbVswXSk7XG4gICAgICBsYXN0UG9zID0gZW5kO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgb3V0LnB1c2godGV4dC5zbGljZShsYXN0UG9zLCBzdGFydCkpO1xuICAgIGxhc3RQb3MgPSBlbmQ7XG5cbiAgICBjb25zdCBnID0gbS5ncm91cHMgPz8ge307XG5cbiAgICAvLyAtLS0tIGJvb2sgb25seVxuICAgIGlmIChnLmJvb2spIHtcbiAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihnLmJvb2ssIGN0eCk7IC8vIDwtLSBzdHJpcHMgdHJhaWxpbmcgZG90XG4gICAgICBjdXJyZW50X2NoYXB0ZXIgPSBudWxsO1xuICAgICAgY3VycmVudF92ZXJzZSA9IG51bGw7XG4gICAgICBvdXQucHVzaChtWzBdKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIC0tLS0gY2hhcHRlciAoY2guLCBjaGFwdGVyLCBjaGFwdGVycylcbiAgICBpZiAoZy5jaGFwdGVyKSB7XG4gICAgICBjb25zdCBjaG0gPSBnLmNoYXB0ZXIubWF0Y2goLyhcXGQrKS8pO1xuICAgICAgaWYgKGNobSAmJiBjdXJyZW50X2Jvb2spIHtcbiAgICAgICAgY29uc3QgY2ggPSBjaG1bMV07XG4gICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IGNoO1xuICAgICAgICBjdXJyZW50X3ZlcnNlID0gbnVsbDtcbiAgICAgICAgb3V0LnB1c2goYFtbJHt0YXJnZXRPZihjdXJyZW50X2Jvb2spfSNeJHtjaH18JHttWzBdfV1dYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXQucHVzaChtWzBdKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChnLnZlcnNlKSB7XG4gICAgICBpZiAoIWN1cnJlbnRfYm9vaykge1xuICAgICAgICBjb25zdCBpbmZlcnJlZCA9IGZpbmRMYXN0Qm9va0JlZm9yZSh0ZXh0LCBzdGFydCwgY3R4KTtcbiAgICAgICAgaWYgKGluZmVycmVkKSBjdXJyZW50X2Jvb2sgPSBpbmZlcnJlZDtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgb3V0LnB1c2gobVswXSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdmVyc2VUZXh0ID0gbVswXTsgICAgICAgICAgICAgICAvLyBlLmcuIFwidnYuIDdiLThhOlwiXG4gICAgICBjb25zdCBjaCA9IGN1cnJlbnRfY2hhcHRlciA/IFN0cmluZyhjdXJyZW50X2NoYXB0ZXIpIDogXCIxXCI7XG4gICAgICBjb25zdCB0YXJnZXQgPSB0YXJnZXRPZihjdXJyZW50X2Jvb2spO1xuXG4gICAgICAvLyBzcGxpdCBwYXlsb2FkIGFmdGVyIFwidi5cIiAvIFwidnYuXCIgYnkgY29tbWFzIG9yIFwiYW5kXCJcbiAgICAgIGNvbnN0IHBheWxvYWQgPSB2ZXJzZVRleHQucmVwbGFjZSgvXlxccypcXGJbVnZddj8oPzpcXC58ZXJzZXM/KVxccyovLCcnKTsgLy8gXCI3Yi04YTpcIlxuICAgICAgY29uc3QgY2h1bmtzID0gcGF5bG9hZC5zcGxpdCgvXFxzKig/Oix8KD86LD9cXHMqYW5kKVxccyopXFxzKi8pO1xuXG4gICAgICAvLyByZS1lbWl0IHRoZSBsZWFkaW5nIFwidi5cIiAvIFwidnYuXCIgcHJlZml4IGFzIHBsYWluIHRleHRcbiAgICAgIGNvbnN0IHByZWZpeCA9IHZlcnNlVGV4dC5zbGljZSgwLCB2ZXJzZVRleHQubGVuZ3RoIC0gcGF5bG9hZC5sZW5ndGgpO1xuICAgICAgb3V0LnB1c2gocHJlZml4KTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaHVua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHBpZWNlID0gY2h1bmtzW2ldO1xuICAgICAgICBpZiAoIXBpZWNlKSBjb250aW51ZTtcblxuICAgICAgICAvLyBrZWVwIHRoZSBvcmlnaW5hbCBkaXNwbGF5IChpbmNsdWRpbmcgYW55IHRyYWlsaW5nIHB1bmN0dWF0aW9uKVxuICAgICAgICBjb25zdCBkaXNwbGF5ID0gcGllY2U7XG5cbiAgICAgICAgLy8gc3RyaXAgb25lIHRyYWlsaW5nIHB1bmN0dWF0aW9uIGZvciBwYXJzaW5nIChrZWVwIGluIGxhYmVsKVxuICAgICAgICBjb25zdCBjb3JlID0gcGllY2UucmVwbGFjZShUUklNX1RBSUxfUFVOQ1QsIFwiXCIpO1xuXG4gICAgICAgIC8vIHJhbmdlP1xuICAgICAgICBjb25zdCBbbGVmdCwgcmlnaHRdID0gY29yZS5zcGxpdChSQU5HRV9TRVApLm1hcChzID0+IHM/LnRyaW0oKSk7XG4gICAgICAgIGlmIChyaWdodCkge1xuICAgICAgICAgIC8vIGxlZnQgbGlua1xuICAgICAgICAgIGNvbnN0IGxlZnROdW0gPSAobGVmdC5tYXRjaCgvXFxkKy8pPy5bMF0pID8/IFwiXCI7XG4gICAgICAgICAgb3V0LnB1c2goYFtbJHt0YXJnZXR9I14ke2NofS0ke2xlZnROdW19fCR7bGVmdH1dXWApO1xuICAgICAgICAgIG91dC5wdXNoKFwiXHUyMDEzXCIpOyAvLyByZS1lbWl0IGEgZGFzaCAoY2hvb3NlIHRoZSBjYW5vbmljYWwgZW4gZGFzaCBpbiBvdXRwdXQpXG4gICAgICAgICAgLy8gcmlnaHQgbGlua1xuICAgICAgICAgIGNvbnN0IHJpZ2h0TnVtID0gKHJpZ2h0Lm1hdGNoKC9cXGQrLyk/LlswXSkgPz8gXCJcIjtcbiAgICAgICAgICAvLyByZWNvbnN0cnVjdCBkaXNwbGF5IHRhaWwgKHJpZ2h0LCBidXQgaWYgb3JpZ2luYWwgaGFkIHRyYWlsaW5nIHB1bmN0LCBwdXQgaXQgYmFjayBvbiByaWdodCBlbmQpXG4gICAgICAgICAgY29uc3QgdHJhaWxpbmcgPSBwaWVjZS5lbmRzV2l0aChcIjpcIikgPyBcIjpcIiA6IChwaWVjZS5lbmRzV2l0aChcIjtcIikgPyBcIjtcIiA6IChwaWVjZS5lbmRzV2l0aChcIi5cIikgPyBcIi5cIiA6IFwiXCIpKTtcbiAgICAgICAgICBvdXQucHVzaChgW1ske3RhcmdldH0jXiR7Y2h9LSR7cmlnaHROdW19fCR7cmlnaHR9JHt0cmFpbGluZ31dXWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIHNpbmdsZSB2ZXJzZSBsaWtlIFwiN2JcIiAocG9zc2libHkgd2l0aCB0cmFpbGluZyBcIjpcIiBvciBcIjtcIilcbiAgICAgICAgICBjb25zdCB2TnVtID0gKGNvcmUubWF0Y2goL1xcZCsvKT8uWzBdKSA/PyBcIlwiO1xuICAgICAgICAgIG91dC5wdXNoKGBbWyR7dGFyZ2V0fSNeJHtjaH0tJHt2TnVtfXwke2Rpc3BsYXl9XV1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpIDwgY2h1bmtzLmxlbmd0aCAtIDEpIG91dC5wdXNoKFwiLCBcIik7IC8vIHB1dCBjb21tYXMgYmFjayBiZXR3ZWVuIGNodW5rc1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gLS0tLSBub3RlKHMpXG4gICAgaWYgKGcubm90ZSkge1xuICAgICAgY29uc3Qgbm90ZVRleHQgPSBnLm5vdGUgYXMgc3RyaW5nO1xuICAgICAgY29uc3QgcGFydHMgPSBub3RlVGV4dC5zcGxpdCgvXFxzKy8pO1xuICAgICAgbGV0IGJvb2tTdWJzdHJpbmcgPSBmYWxzZTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGFydCA9IHBhcnRzW2ldO1xuICAgICAgICBjb25zdCBwbSA9IHBhcnQubWF0Y2goL14oXFxkKykvKTtcbiAgICAgICAgaWYgKHBtICYmICFib29rU3Vic3RyaW5nKSB7XG4gICAgICAgICAgY29uc3QgdmVyc2UgPSBwbVsxXTtcbiAgICAgICAgICBpZiAoKGkgKyAxIDwgcGFydHMubGVuZ3RoICYmICEvXlxcZCsvLnRlc3QocGFydHNbaSArIDFdKSkgfHwgaSArIDEgPj0gcGFydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBvdXQucHVzaChcIiBcIiArIHBhcnQpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IHBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAocGFydHNbal0gPT09IFwiaW5cIiAmJiBqICsgMSA8IHBhcnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICBpZiAoL15cXGQrJC8udGVzdChwYXJ0c1tqICsgMV0pICYmIGogKyAyIDwgcGFydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYm9vayA9IHBhcnRzW2ogKyAxXSArIFwiIFwiICsgcGFydHNbaiArIDJdO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IHBhcnRzW2ogKyAzXTtcbiAgICAgICAgICAgICAgICBjdXJyZW50X2Jvb2sgPSBub3JtYWxpemVCb29rVG9rZW4oYm9vaywgY3R4KTsgLy8gPC0tIG5vcm1hbGl6ZVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJvb2sgPSBwYXJ0c1tqICsgMV07XG4gICAgICAgICAgICAgICAgY3VycmVudF9jaGFwdGVyID0gcGFydHNbaiArIDJdO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihib29rLCBjdHgpOyAvLyA8LS0gbm9ybWFsaXplXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGN1cnJlbnRfYm9vayAmJiBjdXJyZW50X2NoYXB0ZXIpIHtcbiAgICAgICAgICAgIG91dC5wdXNoKGAgW1ske3RhcmdldE9mKGN1cnJlbnRfYm9vayl9ICR7Y3VycmVudF9jaGFwdGVyfSNeJHt2ZXJzZX18JHtwYXJ0fV1dYCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dC5wdXNoKFwiIFwiICsgcGFydCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG91dC5wdXNoKChpID4gMCA/IFwiIFwiIDogXCJcIikgKyBwYXJ0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gLS0tLSBmdWxsIHJlZmVyZW5jZVxuICAgIGlmIChnLnJlZikge1xuICAgICAgY29uc3QgbW0gPSAoZy5yZWYgYXMgc3RyaW5nKS5tYXRjaCgvKFxccypbXFwuLDtdPykoLispLyk7XG4gICAgICBjb25zdCBsZWFkaW5nID0gbW0gPyBtbVsxXSA6IFwiXCI7XG4gICAgICBsZXQgcmVmVGV4dCA9IG1tID8gbW1bMl0gOiAoZy5yZWYgYXMgc3RyaW5nKTtcblxuICAgICAgY29uc3QgYm9va1N0YXJ0ID0gcmVmVGV4dC5tYXRjaChuZXcgUmVnRXhwKGBeKCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccyspYCkpO1xuICAgICAgbGV0IHByZWZpeDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgICBpZiAoYm9va1N0YXJ0KSB7XG4gICAgICAgIGNvbnN0IGJvb2tQYXJ0ID0gYm9va1N0YXJ0WzBdO1xuICAgICAgICBwcmVmaXggPSBib29rUGFydDsgLy8gZm9yIGRpc3BsYXkgdGV4dCAoY2FuIGtlZXAgaXRzIGRvdClcbiAgICAgICAgY3VycmVudF9ib29rID0gbm9ybWFsaXplQm9va1Rva2VuKGJvb2tQYXJ0LnJlcGxhY2UoL1xccyskLywgXCJcIiksIGN0eCk7IC8vIDwtLSBub3JtYWxpemUgZm9yIHRhcmdldFxuICAgICAgICByZWZUZXh0ID0gcmVmVGV4dC5zbGljZShib29rUGFydC5sZW5ndGgpO1xuICAgICAgfVxuICAgICAgaWYgKCFjdXJyZW50X2Jvb2spIHtcbiAgICAgICAgLy8gRmFsbGJhY2s6IGluZmVyIGJvb2sgZnJvbSBsZWZ0IGNvbnRleHQgKGUuZy4sIFwiXHUyMDI2IEpvaG4gMToyOTsgMTI6MjQ7IFx1MjAyNlwiKVxuICAgICAgICBjb25zdCBpbmZlcnJlZCA9IGZpbmRMYXN0Qm9va0JlZm9yZSh0ZXh0LCBzdGFydCwgY3R4KTtcbiAgICAgICAgaWYgKGluZmVycmVkKSB7XG4gICAgICAgICAgY3VycmVudF9ib29rID0gaW5mZXJyZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3V0LnB1c2gobVswXSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgcGFydHMgPSByZWZUZXh0LnJlcGxhY2UoL1xcLi9nLCBcIlwiKS50cmltKCkuc3BsaXQoLyg7fCwpLyk7XG4gICAgICBjb25zdCByZXN1bHQ6IHN0cmluZ1tdID0gW107XG4gICAgICBsZXQgdmVyc2VTdHJpbmcgPSBmYWxzZTtcbiAgICAgIGN1cnJlbnRfY2hhcHRlciA9IG51bGw7XG4gICAgICBsZXQgbG9jYWxfY3VycmVudF92ZXJzZTogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGFydCA9IHBhcnRzW2ldO1xuICAgICAgICBpZiAocGFydCA9PT0gXCIsXCIgfHwgcGFydCA9PT0gXCI7XCIpIHtcbiAgICAgICAgICByZXN1bHQucHVzaChwYXJ0ICsgXCIgXCIpO1xuICAgICAgICAgIHZlcnNlU3RyaW5nID0gKHBhcnQgPT09IFwiLFwiKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwID0gcGFydC50cmltKCk7XG4gICAgICAgIGlmICghcCkgY29udGludWU7XG5cbiAgICAgICAgbGV0IGNoYXA6IHN0cmluZyB8IG51bWJlciB8IG51bGwgPSBjdXJyZW50X2NoYXB0ZXI7XG4gICAgICAgIGxldCB2OiBzdHJpbmcgfCBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICAgICAgbGV0IHZFbmQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGlmIChwLmluY2x1ZGVzKFwiOlwiKSkge1xuICAgICAgICAgIGNvbnN0IFtjU3RyLCB2U3RyXSA9IHAuc3BsaXQoXCI6XCIpO1xuICAgICAgICAgIGNoYXAgPSBjU3RyO1xuICAgICAgICAgIHYgPSB2U3RyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh2ZXJzZVN0cmluZykgdiA9IHA7XG4gICAgICAgICAgZWxzZSB7IGNoYXAgPSBwOyB2ID0gbnVsbDsgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjaGFwICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgY29uc3QgY2hzID0gU3RyaW5nKGNoYXAgPz8gXCJcIikuc3BsaXQoUkFOR0VfU0VQKTtcbiAgICAgICAgICBjaGFwID0gcGFyc2VJbnQoY2hzWzBdLnJlcGxhY2UoL1thLXpdJC9pLCBcIlwiKSwgMTApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICBjb25zdCB2cyA9IFN0cmluZyh2KS5zcGxpdChSQU5HRV9TRVApO1xuICAgICAgICAgIGxvY2FsX2N1cnJlbnRfdmVyc2UgPSBwYXJzZUludCh2c1swXS5yZXBsYWNlKC9bYS16XSQvaSwgXCJcIiksIDEwKTtcbiAgICAgICAgICB2RW5kID0gdnMubGVuZ3RoID4gMSA/IHBhcnNlSW50KHZzWzFdLnJlcGxhY2UoL1thLXpdJC9pLCBcIlwiKSwgMTApIDogbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2NhbF9jdXJyZW50X3ZlcnNlID0gbnVsbDtcbiAgICAgICAgICB2RW5kID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRhcmdldCA9IHRhcmdldE9mKGN1cnJlbnRfYm9vayk7XG5cbiAgICAgICAgaWYgKHZFbmQpIHtcbiAgICAgICAgICAvLyBjYXB0dXJlIG9yaWdpbmFsIHNlcGFyYXRvciB0byByZS1lbWl0IGJldHdlZW4gbGlua3NcbiAgICAgICAgICBjb25zdCBzZXBNYXRjaCA9IHAubWF0Y2gobmV3IFJlZ0V4cChSQU5HRV9TRVAuc291cmNlKSk7XG4gICAgICAgICAgY29uc3Qgc2VwT3V0ICAgPSBzZXBNYXRjaD8uWzBdID8/IFwiLVwiO1xuXG4gICAgICAgICAgLy8gbGVmdCBkaXNwbGF5IHdpdGhvdXQgdHJhaWxpbmcgbnVtYmVyIEFORCB3aXRob3V0IHRyYWlsaW5nIHNlcGFyYXRvclxuICAgICAgICAgIGNvbnN0IGxlZnREaXNwTm9OdW0gPSBwLnJlcGxhY2UoL1xcZCtbYS16XT8kL2ksIFwiXCIpOyAgICAgICAgICAgICAgICAgLy8gZS5nLiBcIk9mZmIuIDE6NFx1MjAxM1wiXG4gICAgICAgICAgY29uc3QgbGVmdERpc3AgICAgICA9IGxlZnREaXNwTm9OdW0ucmVwbGFjZShuZXcgUmVnRXhwKGAke1JBTkdFX1NFUC5zb3VyY2V9XFxcXHMqJGApLCBcIlwiKTsgLy8gXCJPZmZiLiAxOjRcIlxuXG4gICAgICAgICAgLy8gcmlnaHQgZGlzcGxheSBpcyB0aGUgdHJhaWxpbmcgbnVtYmVyICh3aXRoIG9wdGlvbmFsIGxldHRlcilcbiAgICAgICAgICBjb25zdCByaWdodERpc3AgPSAocC5tYXRjaCgvKFxcZCtbYS16XT8pJC9pKT8uWzFdID8/IFwiXCIpO1xuXG4gICAgICAgICAgLy8gbGVmdCBsaW5rIChubyBkYXNoIGluc2lkZSlcbiAgICAgICAgICByZXN1bHQucHVzaChgW1ske3RhcmdldH0jXiR7Y2hhcH0tJHtsb2NhbF9jdXJyZW50X3ZlcnNlfXwkeyhwcmVmaXggPz8gXCJcIil9JHtsZWZ0RGlzcH1dXWApO1xuICAgICAgICAgIC8vIHNlcGFyYXRvciBCRVRXRUVOIGxpbmtzXG4gICAgICAgICAgcmVzdWx0LnB1c2goc2VwT3V0KTtcbiAgICAgICAgICAvLyByaWdodCBsaW5rXG4gICAgICAgICAgY29uc3QgdkVuZE51bSA9IHBhcnNlSW50KFN0cmluZyh2RW5kKS5yZXBsYWNlKC9bYS16XSQvaSwgXCJcIiksIDEwKTtcbiAgICAgICAgICByZXN1bHQucHVzaChgW1ske3RhcmdldH0jXiR7Y2hhcH0tJHt2RW5kTnVtfXwke3JpZ2h0RGlzcH1dXWApO1xuXG4gICAgICAgICAgbG9jYWxfY3VycmVudF92ZXJzZSA9IHZFbmROdW07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0LnB1c2goYFtbJHt0YXJnZXR9I14ke2NoYXB9JHtsb2NhbF9jdXJyZW50X3ZlcnNlID8gYC0ke2xvY2FsX2N1cnJlbnRfdmVyc2V9YCA6IFwiXCJ9fCR7cHJlZml4ID8gcHJlZml4IDogXCJcIn0ke3B9XV1gKTtcbiAgICAgICAgfVxuICAgICAgICBwcmVmaXggPSBudWxsO1xuICAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBjaGFwO1xuICAgICAgICBjdXJyZW50X3ZlcnNlID0gbG9jYWxfY3VycmVudF92ZXJzZTtcbiAgICAgIH1cblxuICAgICAgb3V0LnB1c2gobGVhZGluZyArIHJlc3VsdC5qb2luKFwiXCIpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIG91dC5wdXNoKG1bMF0pO1xuICB9XG5cbiAgb3V0LnB1c2godGV4dC5zbGljZShsYXN0UG9zKSk7XG4gIHJldHVybiBvdXQuam9pbihcIlwiKTtcbn1cblxuLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQdWJsaWMgQVBJIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxpbmtWZXJzZXNJblRleHQoXG4gIHRleHQ6IHN0cmluZyxcbiAgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncyxcbiAgdmVyc2lvblNob3J0Pzogc3RyaW5nIHwgbnVsbFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgY3R4ID0gYnVpbGRCb29rQ29udGV4dChzZXR0aW5ncyk7XG5cbiAgY29uc3QgcmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MgPSAoc2V0dGluZ3MgYXMgYW55KT8ucmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MgPz8gdHJ1ZTtcbiAgY29uc3QgcmV3cml0ZU9sZE9ic2lkaWFuTGlua3MgPSAoc2V0dGluZ3MgYXMgYW55KT8ucmV3cml0ZU9sZE9ic2lkaWFuTGlua3MgPz8gdHJ1ZTtcbiAgY29uc3Qgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSA9IChzZXR0aW5ncyBhcyBhbnkpPy5zdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlID8/IHRydWU7XG5cbiAgcmV0dXJuIHJlcGxhY2VWZXJzZVJlZmVyZW5jZXNPZk1haW5UZXh0KHRleHQsIGN0eCwge1xuICAgIHJlbW92ZU9ic2lkaWFuTGlua3M6IHJlbW92ZU9ic2lkaWFuRGlzcGxheUxpbmtzLFxuICAgIHJld3JpdGVPbGRMaW5rczogcmV3cml0ZU9sZE9ic2lkaWFuTGlua3MsXG4gICAgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSxcbiAgICB2ZXJzaW9uU2hvcnQ6IHZlcnNpb25TaG9ydCA/PyBudWxsLFxuICB9KTtcbn1cblxuXG4vKiogPT09PT09PT09PT09PT09PT09PT09PT09PT0gQ29tbWFuZHMgPT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbW1hbmRWZXJzZUxpbmtzKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzLCBwYXJhbXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSB7XG4gIGNvbnN0IHNjb3BlID0gcGFyYW1zPy5zY29wZSA/PyBcImN1cnJlbnRcIjtcblxuICBjb25zdCBmaWxlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gIGlmIChzY29wZSA9PT0gXCJmb2xkZXJcIikge1xuICAgIGNvbnN0IGFjdGl2ZSA9IGZpbGU7XG4gICAgY29uc3QgZm9sZGVyID0gYWN0aXZlPy5wYXJlbnQ7XG4gICAgaWYgKCFhY3RpdmUgfHwgIWZvbGRlcikge1xuICAgICAgbmV3IE5vdGljZShcIk9wZW4gYSBmaWxlIGluc2lkZSB0aGUgdGFyZ2V0IGZvbGRlci5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIFRGaWxlICYmIGNoaWxkLmV4dGVuc2lvbiA9PT0gXCJtZFwiKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChjaGlsZCk7XG4gICAgICAgIGNvbnN0IHsgeWFtbCwgYm9keSB9ID0gc3BsaXRGcm9udG1hdHRlcihjb250ZW50KTtcbiAgICAgICAgY29uc3QgbGlua2VkID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChib2R5LCBzZXR0aW5ncywgc2V0dGluZ3MuYmlibGVEZWZhdWx0VmVyc2lvbik7IC8vIGRlZmF1bHQ6IG5vIHZlcnNpb25cbiAgICAgICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShjaGlsZCwgKHlhbWwgPz8gXCJcIikgKyBsaW5rZWQpO1xuICAgICAgfVxuICAgIH1cbiAgICBuZXcgTm90aWNlKFwiTGlua2VkIHZlcnNlcyBpbiBmb2xkZXIuXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICghZmlsZSkge1xuICAgIG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICBjb25zdCB7IHlhbWwsIGJvZHkgfSA9IHNwbGl0RnJvbnRtYXR0ZXIoY29udGVudCk7XG4gIGNvbnN0IGxpbmtlZCA9IGF3YWl0IGxpbmtWZXJzZXNJblRleHQoYm9keSwgc2V0dGluZ3MsIHNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb24pOyAvLyBkZWZhdWx0OiBubyB2ZXJzaW9uXG4gIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgKHlhbWwgPz8gXCJcIikgKyBsaW5rZWQpO1xuICBuZXcgTm90aWNlKFwiTGlua2VkIHZlcnNlcyBpbiBjdXJyZW50IGZpbGUuXCIpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZFZlcnNlTGlua3NTZWxlY3Rpb25PckxpbmUoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MpIHtcbiAgY29uc3QgbWRWaWV3ID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gIGlmICghbWRWaWV3KSB7XG4gICAgbmV3IE5vdGljZShcIk9wZW4gYSBNYXJrZG93biBmaWxlIGZpcnN0LlwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBlZGl0b3IgPSBtZFZpZXcuZWRpdG9yO1xuICBjb25zdCBzZWxlY3Rpb25UZXh0ID0gZWRpdG9yLmdldFNlbGVjdGlvbigpO1xuXG4gIGNvbnN0IHJ1biA9IGFzeW5jICh0ZXh0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KHRleHQsIHNldHRpbmdzLCBzZXR0aW5ncy5iaWJsZURlZmF1bHRWZXJzaW9uKTsgLy8gZGVmYXVsdDogbm8gdmVyc2lvblxuICAgIHJldHVybiBsaW5rZWQ7XG4gIH07XG5cbiAgaWYgKHNlbGVjdGlvblRleHQgJiYgc2VsZWN0aW9uVGV4dC5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgbGlua2VkID0gYXdhaXQgcnVuKHNlbGVjdGlvblRleHQpO1xuICAgIGlmIChsaW5rZWQgIT09IHNlbGVjdGlvblRleHQpIHtcbiAgICAgIGVkaXRvci5yZXBsYWNlU2VsZWN0aW9uKGxpbmtlZCk7XG4gICAgICBuZXcgTm90aWNlKFwiTGlua2VkIHZlcnNlcyBpbiBzZWxlY3Rpb24uXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXcgTm90aWNlKFwiTm8gbGlua2FibGUgdmVyc2VzIGluIHNlbGVjdGlvbi5cIik7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGxpbmUgPSBlZGl0b3IuZ2V0Q3Vyc29yKCkubGluZTtcbiAgY29uc3QgbGluZVRleHQgPSBlZGl0b3IuZ2V0TGluZShsaW5lKTtcbiAgY29uc3QgbGlua2VkID0gYXdhaXQgcnVuKGxpbmVUZXh0KTtcbiAgaWYgKGxpbmtlZCAhPT0gbGluZVRleHQpIHtcbiAgICBlZGl0b3Iuc2V0TGluZShsaW5lLCBsaW5rZWQpO1xuICAgIG5ldyBOb3RpY2UoXCJMaW5rZWQgdmVyc2VzIG9uIGN1cnJlbnQgbGluZS5cIik7XG4gIH0gZWxzZSB7XG4gICAgbmV3IE5vdGljZShcIk5vIGxpbmthYmxlIHZlcnNlcyBvbiBjdXJyZW50IGxpbmUuXCIpO1xuICB9XG59XG5cbi8qKlxuICogTkVXOiBTYW1lIGFzIGFib3ZlLCBidXQgYXNrcyB1c2VyIHRvIGNob29zZSBhIHZlcnNpb24gKGlmIGNhdGFsb2d1ZSBsb2FkcykuXG4gKiBJZiB1c2VyIGNhbmNlbHMgLyBmYWlscyB0byBsb2FkLCBmYWxscyBiYWNrIHRvIG5vLXZlcnNpb24uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kVmVyc2VMaW5rc0Nob29zZVZlcnNpb24oYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MpIHtcbiAgY29uc3QgZmlsZSA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICBpZiAoIWZpbGUpIHtcbiAgICBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgZmlyc3QuXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlKSA9PiB7XG4gICAgbmV3IFBpY2tWZXJzaW9uTW9kYWwoYXBwLCBzZXR0aW5ncywgYXN5bmMgKHZlcnNpb25TaG9ydCkgPT4ge1xuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgICAgY29uc3QgeyB5YW1sLCBib2R5IH0gPSBzcGxpdEZyb250bWF0dGVyKGNvbnRlbnQpO1xuICAgICAgY29uc3QgbGlua2VkID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChib2R5LCBzZXR0aW5ncywgdmVyc2lvblNob3J0KTtcbiAgICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgKHlhbWwgPz8gXCJcIikgKyBsaW5rZWQpO1xuICAgICAgbmV3IE5vdGljZSh2ZXJzaW9uU2hvcnQgPyBgTGlua2VkIHZlcnNlcyAoXHUyMTkyICR7dmVyc2lvblNob3J0fSkuYCA6IFwiTGlua2VkIHZlcnNlcyAobm8gdmVyc2lvbikuXCIpO1xuICAgICAgcmVzb2x2ZShsaW5rZWQpO1xuICAgIH0pLm9wZW4oKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kVmVyc2VMaW5rc1NlbGVjdGlvbk9yTGluZUNob29zZVZlcnNpb24oYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MpIHtcbiAgY29uc3QgbWRWaWV3ID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gIGlmICghbWRWaWV3KSB7XG4gICAgbmV3IE5vdGljZShcIk9wZW4gYSBNYXJrZG93biBmaWxlIGZpcnN0LlwiKTtcbiAgICByZXR1cm47XG4gIH1cbiAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUpID0+IHtcbiAgICBuZXcgUGlja1ZlcnNpb25Nb2RhbChhcHAsIHNldHRpbmdzLCBhc3luYyAodmVyc2lvblNob3J0KSA9PiB7XG4gICAgICBjb25zdCBlZGl0b3IgPSBtZFZpZXcuZWRpdG9yO1xuICAgICAgY29uc3Qgc2VsZWN0aW9uVGV4dCA9IGVkaXRvci5nZXRTZWxlY3Rpb24oKTtcblxuICAgICAgY29uc3QgcnVuID0gYXN5bmMgKHRleHQ6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KHRleHQsIHNldHRpbmdzLCB2ZXJzaW9uU2hvcnQpO1xuICAgICAgICByZXR1cm4gbGlua2VkO1xuICAgICAgfTtcblxuICAgICAgaWYgKHNlbGVjdGlvblRleHQgJiYgc2VsZWN0aW9uVGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGxpbmtlZCA9IGF3YWl0IHJ1bihzZWxlY3Rpb25UZXh0KTtcbiAgICAgICAgaWYgKGxpbmtlZCAhPT0gc2VsZWN0aW9uVGV4dCkge1xuICAgICAgICAgIGVkaXRvci5yZXBsYWNlU2VsZWN0aW9uKGxpbmtlZCk7XG4gICAgICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgICAgIHZlcnNpb25TaG9ydCA/IGBMaW5rZWQgKHNlbGVjdGlvbikgXHUyMTkyICR7dmVyc2lvblNob3J0fS5gIDogXCJMaW5rZWQgKHNlbGVjdGlvbikgd2l0aG91dCB2ZXJzaW9uLlwiXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiTm8gbGlua2FibGUgdmVyc2VzIGluIHNlbGVjdGlvbi5cIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBsaW5lID0gZWRpdG9yLmdldEN1cnNvcigpLmxpbmU7XG4gICAgICBjb25zdCBsaW5lVGV4dCA9IGVkaXRvci5nZXRMaW5lKGxpbmUpO1xuICAgICAgY29uc3QgbGlua2VkID0gYXdhaXQgcnVuKGxpbmVUZXh0KTtcbiAgICAgIGlmIChsaW5rZWQgIT09IGxpbmVUZXh0KSB7XG4gICAgICAgIGVkaXRvci5zZXRMaW5lKGxpbmUsIGxpbmtlZCk7XG4gICAgICAgIG5ldyBOb3RpY2UodmVyc2lvblNob3J0ID8gYExpbmtlZCAobGluZSkgXHUyMTkyICR7dmVyc2lvblNob3J0fS5gIDogXCJMaW5rZWQgKGxpbmUpIHdpdGhvdXQgdmVyc2lvbi5cIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXcgTm90aWNlKFwiTm8gbGlua2FibGUgdmVyc2VzIG9uIGN1cnJlbnQgbGluZS5cIik7XG4gICAgICB9XG4gICAgICByZXNvbHZlKGxpbmtlZCk7XG4gICAgfSkub3BlbigpO1xuICB9KTtcbn1cblxuLy8gaW1wb3J0IHsgQXBwLCBNYXJrZG93blZpZXcsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbi8vIGltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuLy8gaW1wb3J0IHsgc3BsaXRGcm9udG1hdHRlciB9IGZyb20gXCIuLi9saWIvbWRVdGlsc1wiO1xuXG4vLyAvKiogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyAgKiAgQk9PSyBNQVAgKGRlZmF1bHQsIEVuZ2xpc2gpXG4vLyAgKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbi8vIGNvbnN0IEJPT0tfQUJCUjogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbi8vICAgXCJHZW5lc2lzXCI6IFwiR2VuXCIsXG4vLyAgIFwiRXhvZHVzXCI6IFwiRXhvXCIsXG4vLyAgIFwiTGV2aXRpY3VzXCI6IFwiTGV2XCIsXG4vLyAgIFwiTnVtYmVyc1wiOiBcIk51bVwiLFxuLy8gICBcIkRldXRlcm9ub215XCI6IFwiRGV1dFwiLFxuLy8gICBcIkpvc2h1YVwiOiBcIkpvc2hcIixcbi8vICAgXCJKdWRnZXNcIjogXCJKdWRnXCIsXG4vLyAgIFwiUnV0aFwiOiBcIlJ1dGhcIixcbi8vICAgXCIxIFNhbXVlbFwiOiBcIjEgU2FtXCIsXG4vLyAgIFwiRmlyc3QgU2FtdWVsXCI6IFwiMSBTYW1cIixcbi8vICAgXCIyIFNhbXVlbFwiOiBcIjIgU2FtXCIsXG4vLyAgIFwiU2Vjb25kIFNhbXVlbFwiOiBcIjIgU2FtXCIsXG4vLyAgIFwiMSBLaW5nc1wiOiBcIjEgS2luZ3NcIixcbi8vICAgXCJGaXJzdCBLaW5nc1wiOiBcIjEgS2luZ3NcIixcbi8vICAgXCIyIEtpbmdzXCI6IFwiMiBLaW5nc1wiLFxuLy8gICBcIlNlY29uZCBLaW5nc1wiOiBcIjIgS2luZ3NcIixcbi8vICAgXCIxIENocm9uaWNsZXNcIjogXCIxIENocm9uXCIsXG4vLyAgIFwiRmlyc3QgQ2hyb25pY2xlc1wiOiBcIjEgQ2hyb25cIixcbi8vICAgXCIyIENocm9uaWNsZXNcIjogXCIyIENocm9uXCIsXG4vLyAgIFwiU2Vjb25kIENocm9uaWNsZXNcIjogXCIyIENocm9uXCIsXG4vLyAgIFwiRXpyYVwiOiBcIkV6cmFcIixcbi8vICAgXCJOZWhlbWlhaFwiOiBcIk5laFwiLFxuLy8gICBcIkVzdGhlclwiOiBcIkVzdGhcIixcbi8vICAgXCJKb2JcIjogXCJKb2JcIixcbi8vICAgXCJQc2FsbXNcIjogXCJQc2FcIixcbi8vICAgXCJQc2FsbVwiOiBcIlBzYVwiLFxuLy8gICBcIlByb3ZlcmJzXCI6IFwiUHJvdlwiLFxuLy8gICBcIkVjY2xlc2lhc3Rlc1wiOiBcIkVjY2xcIixcbi8vICAgXCJTb25nIG9mIFNvbG9tb25cIjogXCJTb1NcIixcbi8vICAgXCJTb25nIG9mIFNvbmdzXCI6IFwiU29TXCIsXG4vLyAgIFwiUy5TXCI6IFwiU29TXCIsXG4vLyAgIFwiUy5TLlwiOiBcIlNvU1wiLFxuLy8gICBcIlMuIFMuXCI6IFwiU29TXCIsXG4vLyAgIFwiUy4gU1wiOiBcIlNvU1wiLFxuLy8gICBcIlNTXCI6IFwiU29TXCIsXG4vLyAgIFwiSXNhaWFoXCI6IFwiSXNhXCIsXG4vLyAgIFwiSmVyZW1pYWhcIjogXCJKZXJcIixcbi8vICAgXCJMYW1lbnRhdGlvbnNcIjogXCJMYW1cIixcbi8vICAgXCJFemVraWVsXCI6IFwiRXpla1wiLFxuLy8gICBcIkRhbmllbFwiOiBcIkRhblwiLFxuLy8gICBcIkhvc2VhXCI6IFwiSG9zZWFcIixcbi8vICAgXCJKb2VsXCI6IFwiSm9lbFwiLFxuLy8gICBcIkFtb3NcIjogXCJBbW9zXCIsXG4vLyAgIFwiT2JhZGlhaFwiOiBcIk9iYWRcIixcbi8vICAgXCJKb25haFwiOiBcIkpvbmFoXCIsXG4vLyAgIFwiTWljYWhcIjogXCJNaWNhaFwiLFxuLy8gICBcIk5haHVtXCI6IFwiTmFoXCIsXG4vLyAgIFwiSGFiYWtrdWtcIjogXCJIYWJcIixcbi8vICAgXCJaZXBoYW5pYWhcIjogXCJaZXBcIixcbi8vICAgXCJIYWdnYWlcIjogXCJIYWdcIixcbi8vICAgXCJaZWNoYXJpYWhcIjogXCJaZWNoXCIsXG4vLyAgIFwiTWFsYWNoaVwiOiBcIk1hbFwiLFxuLy8gICBcIk1hdHRoZXdcIjogXCJNYXR0XCIsXG4vLyAgIFwiTWFya1wiOiBcIk1hcmtcIixcbi8vICAgXCJMdWtlXCI6IFwiTHVrZVwiLFxuLy8gICBcIkpvaG5cIjogXCJKb2huXCIsXG4vLyAgIFwiQWN0c1wiOiBcIkFjdHNcIixcbi8vICAgXCJSb21hbnNcIjogXCJSb21cIixcbi8vICAgXCIxIENvcmludGhpYW5zXCI6IFwiMSBDb3JcIixcbi8vICAgXCJGaXJzdCBDb3JpbnRoaWFuc1wiOiBcIjEgQ29yXCIsXG4vLyAgIFwiMiBDb3JpbnRoaWFuc1wiOiBcIjIgQ29yXCIsXG4vLyAgIFwiU2Vjb25kIENvcmludGhpYW5zXCI6IFwiMiBDb3JcIixcbi8vICAgXCJHYWxhdGlhbnNcIjogXCJHYWxcIixcbi8vICAgXCJFcGhlc2lhbnNcIjogXCJFcGhcIixcbi8vICAgXCJQaGlsaXBwaWFuc1wiOiBcIlBoaWxcIixcbi8vICAgXCJDb2xvc3NpYW5zXCI6IFwiQ29sXCIsXG4vLyAgIFwiMSBUaGVzc2Fsb25pYW5zXCI6IFwiMSBUaGVzXCIsXG4vLyAgIFwiRmlyc3QgVGhlc3NhbG9uaWFuc1wiOiBcIjEgVGhlc1wiLFxuLy8gICBcIjIgVGhlc3NhbG9uaWFuc1wiOiBcIjIgVGhlc1wiLFxuLy8gICBcIlNlY29uZCBUaGVzc2Fsb25pYW5zXCI6IFwiMiBUaGVzXCIsXG4vLyAgIFwiMSBUaW1vdGh5XCI6IFwiMSBUaW1cIixcbi8vICAgXCJGaXJzdCBUaW1vdGh5XCI6IFwiMSBUaW1cIixcbi8vICAgXCIyIFRpbW90aHlcIjogXCIyIFRpbVwiLFxuLy8gICBcIlNlY29uZCBUaW1vdGh5XCI6IFwiMiBUaW1cIixcbi8vICAgXCJUaXR1c1wiOiBcIlRpdHVzXCIsXG4vLyAgIFwiUGhpbGVtb25cIjogXCJQaGlsZW1cIixcbi8vICAgXCJIZWJyZXdzXCI6IFwiSGViXCIsXG4vLyAgIFwiSmFtZXNcIjogXCJKYW1lc1wiLFxuLy8gICBcIjEgUGV0ZXJcIjogXCIxIFBldFwiLFxuLy8gICBcIkZpcnN0IFBldGVyXCI6IFwiMSBQZXRcIixcbi8vICAgXCIyIFBldGVyXCI6IFwiMiBQZXRcIixcbi8vICAgXCJTZWNvbmQgUGV0ZXJcIjogXCIyIFBldFwiLFxuLy8gICBcIjEgSm9oblwiOiBcIjEgSm9oblwiLFxuLy8gICBcIkZpcnN0IEpvaG5cIjogXCIxIEpvaG5cIixcbi8vICAgXCIyIEpvaG5cIjogXCIyIEpvaG5cIixcbi8vICAgXCJTZWNvbmQgSm9oblwiOiBcIjIgSm9oblwiLFxuLy8gICBcIjMgSm9oblwiOiBcIjMgSm9oblwiLFxuLy8gICBcIlRoaXJkIEpvaG5cIjogXCIzIEpvaG5cIixcbi8vICAgXCJKdWRlXCI6IFwiSnVkZVwiLFxuLy8gICBcIlJldmVsYXRpb25cIjogXCJSZXZcIlxuLy8gfTtcblxuLy8gdHlwZSBCb29rTWFwID0gUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbi8vIGNvbnN0IGVzY2FwZVJlID0gKHM6IHN0cmluZykgPT4gcy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG5cbi8vIC8qKiBCdWlsZCBsb2NhbGUtc3BlY2lmaWMgYm9vayBtYXAgKyBhbHRlcm5hdGlvbiBhdCBydW50aW1lICovXG4vLyBmdW5jdGlvbiBidWlsZEJvb2tDb250ZXh0KHNldHRpbmdzPzogQmlibGVUb29sc1NldHRpbmdzKSB7XG4vLyAgIGxldCBib29rTG9jYWxlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4vLyAgIGxldCBjdXN0b206IHVua25vd247XG5cbi8vICAgdHJ5IHsgYm9va0xvY2FsZSA9IChzZXR0aW5ncyBhcyBhbnkpPy5ib29rTG9jYWxlIGFzIHN0cmluZyB8IHVuZGVmaW5lZDsgfSBjYXRjaCB7fVxuLy8gICB0cnkgeyBjdXN0b20gPSAoc2V0dGluZ3MgYXMgYW55KT8uY3VzdG9tQm9va01hcDsgfSBjYXRjaCB7fVxuXG4vLyAgIGxldCBhYmJyOiBCb29rTWFwID0gQk9PS19BQkJSO1xuXG4vLyAgIGlmIChib29rTG9jYWxlID09PSBcImN1c3RvbVwiICYmIGN1c3RvbSkge1xuLy8gICAgIHRyeSB7XG4vLyAgICAgICBpZiAodHlwZW9mIGN1c3RvbSA9PT0gXCJzdHJpbmdcIikge1xuLy8gICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGN1c3RvbSk7XG4vLyAgICAgICAgIGlmIChwYXJzZWQgJiYgdHlwZW9mIHBhcnNlZCA9PT0gXCJvYmplY3RcIikgYWJiciA9IHBhcnNlZCBhcyBCb29rTWFwO1xuLy8gICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY3VzdG9tID09PSBcIm9iamVjdFwiKSB7XG4vLyAgICAgICAgIGFiYnIgPSBjdXN0b20gYXMgQm9va01hcDtcbi8vICAgICAgIH1cbi8vICAgICB9IGNhdGNoIHtcbi8vICAgICAgIGFiYnIgPSBCT09LX0FCQlI7XG4vLyAgICAgfVxuLy8gICB9IGVsc2Uge1xuLy8gICAgIGFiYnIgPSBCT09LX0FCQlI7XG4vLyAgIH1cblxuLy8gICBjb25zdCBhbGxUb2tlbnMgPSBBcnJheS5mcm9tKG5ldyBTZXQoWy4uLk9iamVjdC5rZXlzKGFiYnIpLCAuLi5PYmplY3QudmFsdWVzKGFiYnIpXSkpLnNvcnQoXG4vLyAgICAgKGEsIGIpID0+IGIubGVuZ3RoIC0gYS5sZW5ndGhcbi8vICAgKTtcbi8vICAgY29uc3QgQk9PS19BTFQgPSBhbGxUb2tlbnMubWFwKGVzY2FwZVJlKS5qb2luKFwifFwiKTtcblxuLy8gICBjb25zdCBnZXRCb29rQWJiciA9IChib29rOiBzdHJpbmcpID0+IGFiYnJbYm9va10gPz8gYm9vaztcblxuLy8gICBjb25zdCBidWlsZFBhdHRlcm5Cb2R5ID0gKCk6IHN0cmluZyA9PiB7XG4vLyAgICAgY29uc3QgYm9vayA9IGAoPzoke0JPT0tfQUxUfSlgO1xuLy8gICAgIC8vIGNvbnN0IHJlZjEgPVxuLy8gICAgIC8vICAgYCg/Oig/OiR7Ym9va30pXFxcXC4/XFxcXHMqYCArXG4vLyAgICAgLy8gICBgXFxcXGQrKD86LVxcXFxkKyk/OlxcXFxkK1thLXpdPyg/Oi1cXFxcZCspP1thLXpdP2AgK1xuLy8gICAgIC8vICAgYCg/OlxcXFxzKixcXFxccypcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT98XFxcXHMqO1xcXFxzKlxcXFxkKzpcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT8pKmAgK1xuLy8gICAgIC8vICAgYClgO1xuLy8gICAgIGNvbnN0IHJlZjEgPVxuLy8gICAgICAgYCg/Oig/OiR7Ym9va30pP1xcXFwuP1xcXFxzKmAgK1xuLy8gICAgICAgYFxcXFxkKyg/Oi1cXFxcZCspPzpcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT9gICtcbi8vICAgICAgIGAoPzpcXFxccyosXFxcXHMqXFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/fFxcXFxzKjtcXFxccypcXFxcZCs6XFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/KSpgICtcbi8vICAgICAgIGApYDtcbi8vICAgICBjb25zdCByZWYyID0gYCg/Oigke2Jvb2t9KVxcXFwuP1xcXFxzKyhcXFxcZCspKD86LShcXFxcZCspKT8pYDtcbi8vICAgICBjb25zdCBSRUYgPSBgKD88cmVmPiR7cmVmMX18JHtyZWYyfSlgO1xuXG4vLyAgICAgY29uc3QgVkVSU0UgPVxuLy8gICAgICAgYCg/PHZlcnNlPmAgK1xuLy8gICAgICAgYFxcXFxiW1Z2XXY/KD86XFxcXC58ZXJzZXM/KVxcXFxzKmAgK1xuLy8gICAgICAgYFxcXFxkKyg/Oi1cXFxcZCspP1thLXpdP2AgK1xuLy8gICAgICAgYCg/Oig/Oix8LD9cXFxccyphbmQpXFxcXHMqXFxcXGQrKD86LVxcXFxkKyk/W2Etel0/KSpgICtcbi8vICAgICAgIGApYDtcblxuLy8gICAgIGNvbnN0IENIQVBURVIgPVxuLy8gICAgICAgYCg/PGNoYXB0ZXI+YCArXG4vLyAgICAgICBgXFxcXGJbQ2NdaCg/OmFwdGVycz98cz9cXFxcLilcXFxcLj9cXFxccypgICtcbi8vICAgICAgIGBcXFxcZCsoPzotXFxcXGQrKT9gICtcbi8vICAgICAgIGApYDtcblxuLy8gICAgIGNvbnN0IE5PVEUgPVxuLy8gICAgICAgYCg/PG5vdGU+YCArXG4vLyAgICAgICBgXFxcXGJbTm5db3Rlcz9gICtcbi8vICAgICAgIGAoPzpcXFxccytcXFxcZCsoPzpcXFxccytcXFxcZCspP2AgK1xuLy8gICAgICAgYCg/OmAgK1xuLy8gICAgICAgYCg/OlssO118LD9cXFxccyphbmQpXFxcXHMqXFxcXGQrKD86XFxcXHMrXFxcXGQrKT9gICtcbi8vICAgICAgIGAoPzpcXFxccytpblxcXFxzKyR7Ym9va31cXFxcLj9cXFxccytcXFxcZCspP2AgK1xuLy8gICAgICAgYCkqYCArXG4vLyAgICAgICBgKWAgK1xuLy8gICAgICAgYCg/OlxcXFxzK2luXFxcXHMrJHtib29rfVxcXFwuP1xcXFxzK1xcXFxkKyk/YCArXG4vLyAgICAgICBgKWA7XG5cbi8vICAgICBjb25zdCBCT09LID0gYCg/PGJvb2s+XFxcXGIoPzoke2Jvb2t9KVxcXFxiKSg/IVxcXFwuP1xcXFxzKlxcXFxkKylgO1xuXG4vLyAgICAgcmV0dXJuIGAke1JFRn18JHtWRVJTRX18JHtDSEFQVEVSfXwke05PVEV9fCR7Qk9PS31gO1xuLy8gICB9O1xuXG4vLyAgIGNvbnN0IFBBVFRFUk5fQk9EWSA9IGJ1aWxkUGF0dGVybkJvZHkoKTtcbi8vICAgY29uc3QgUEFUVEVSTl9HID0gbmV3IFJlZ0V4cChQQVRURVJOX0JPRFksIFwiZ1wiKTtcbi8vICAgY29uc3QgUEFUVEVSTl9IRUFEID0gbmV3IFJlZ0V4cChcIl5cIiArIFBBVFRFUk5fQk9EWSk7XG5cbi8vICAgcmV0dXJuIHsgYWJiciwgYWxsVG9rZW5zLCBCT09LX0FMVCwgZ2V0Qm9va0FiYnIsIFBBVFRFUk5fRywgUEFUVEVSTl9IRUFEIH07XG4vLyB9XG5cbi8vIC8qKiAtLS0tLS0tLS0tLS0tLS0tIFV0aWxpdHk6IG5vcm1hbGl6ZSBib29rIHRva2VuIHRvIHJlbW92ZSB0cmFpbGluZyBwZXJpb2QgLS0tLS0tLS0tLS0tLS0tICovXG4vLyBmdW5jdGlvbiBub3JtYWxpemVCb29rVG9rZW4ocmF3OiBzdHJpbmcsIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4pOiBzdHJpbmcge1xuLy8gICAvLyBUcmltIGFuZCBkcm9wIGEgc2luZ2xlIHRyYWlsaW5nIGRvdCAoZS5nLiwgXCJSb20uXCIgLT4gXCJSb21cIilcbi8vICAgY29uc3QgY2xlYW5lZCA9IHJhdy50cmltKCkucmVwbGFjZSgvXFwuJC8sIFwiXCIpO1xuLy8gICByZXR1cm4gY3R4LmdldEJvb2tBYmJyKGNsZWFuZWQpO1xuLy8gfVxuXG4vLyAvKiogLS0tLS0tLS0tLS0tLS0gUHJvdGVjdGVkIHJhbmdlcyAoZG9uXHUyMDE5dCB0b3VjaCB3aGlsZSBsaW5raW5nKSAtLS0tLS0tLS0tLS0tLSAqL1xuLy8gdHlwZSBSYW5nZSA9IFtzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcl07XG5cbi8vIGZ1bmN0aW9uIGFkZFJhbmdlKHJhbmdlczogUmFuZ2VbXSwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbi8vICAgaWYgKHN0YXJ0ID49IDAgJiYgZW5kID4gc3RhcnQpIHJhbmdlcy5wdXNoKFtzdGFydCwgZW5kXSk7XG4vLyB9XG5cbi8vIGZ1bmN0aW9uIGZpbmRQcm90ZWN0ZWRSYW5nZXModGV4dDogc3RyaW5nKTogUmFuZ2VbXSB7XG4vLyAgIGNvbnN0IHJhbmdlczogUmFuZ2VbXSA9IFtdO1xuXG4vLyAgIC8vIDEpIENvZGUgZmVuY2VzIGBgYC4uLmBgYCBhbmQgfn5+Li4ufn5+XG4vLyAgIGNvbnN0IGZlbmNlUmUgPSAvKGBgYHx+fn4pW15cXG5dKlxcbltcXHNcXFNdKj9cXDEvZztcbi8vICAgZm9yIChsZXQgbTsgKG0gPSBmZW5jZVJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuLy8gICAvLyAyKSBNYXRoIGJsb2NrcyAkJC4uLiQkXG4vLyAgIGNvbnN0IG1hdGhCbG9ja1JlID0gL1xcJFxcJFtcXHNcXFNdKj9cXCRcXCQvZztcbi8vICAgZm9yIChsZXQgbTsgKG0gPSBtYXRoQmxvY2tSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbi8vICAgLy8gMykgSW5saW5lIGNvZGUgYC4uLmBcbi8vICAgY29uc3QgaW5saW5lQ29kZVJlID0gL2BbXmBcXG5dKmAvZztcbi8vICAgZm9yIChsZXQgbTsgKG0gPSBpbmxpbmVDb2RlUmUuZXhlYyh0ZXh0KSk7ICkgYWRkUmFuZ2UocmFuZ2VzLCBtLmluZGV4LCBtLmluZGV4ICsgbVswXS5sZW5ndGgpO1xuXG4vLyAgIC8vIDQpIElubGluZSBtYXRoICQuLi4kIChhdm9pZCAkJClcbi8vICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgKSB7XG4vLyAgICAgaWYgKHRleHRbaV0gPT09IFwiJFwiICYmIHRleHRbaSArIDFdICE9PSBcIiRcIikge1xuLy8gICAgICAgY29uc3Qgc3RhcnQgPSBpO1xuLy8gICAgICAgaSsrO1xuLy8gICAgICAgd2hpbGUgKGkgPCB0ZXh0Lmxlbmd0aCAmJiB0ZXh0W2ldICE9PSBcIiRcIikgaSsrO1xuLy8gICAgICAgaWYgKGkgPCB0ZXh0Lmxlbmd0aCAmJiB0ZXh0W2ldID09PSBcIiRcIikge1xuLy8gICAgICAgICBhZGRSYW5nZShyYW5nZXMsIHN0YXJ0LCBpICsgMSk7XG4vLyAgICAgICAgIGkrKztcbi8vICAgICAgICAgY29udGludWU7XG4vLyAgICAgICB9XG4vLyAgICAgfVxuLy8gICAgIGkrKztcbi8vICAgfVxuXG4vLyAgIC8vIDUpIE1hcmtkb3duIGxpbmtzIFt0ZXh0XSh1cmwpXG4vLyAgIGNvbnN0IG1kTGlua1JlID0gL1xcW1teXFxdXSs/XFxdXFwoW14pXStcXCkvZztcbi8vICAgZm9yIChsZXQgbTsgKG0gPSBtZExpbmtSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbi8vICAgLy8gNikgSW5saW5lIHByb3BlcnRpZXMgbGluZXM6ICBrZXk6OiB2YWx1ZVxuLy8gICBjb25zdCBpbmxpbmVQcm9wUmUgPSAvXlteXFxuOl17MSwyMDB9OjouKiQvZ207XG4vLyAgIGZvciAobGV0IG07IChtID0gaW5saW5lUHJvcFJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuLy8gICAvLyA3KSBPYnNpZGlhbiBsaW5rcyBbWy4uLl1dXG4vLyAgIGNvbnN0IG9ic2lkaWFuUmUgPSAvXFxbXFxbW15cXF1dKj9cXF1cXF0vZztcbi8vICAgZm9yIChsZXQgbTsgKG0gPSBvYnNpZGlhblJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuLy8gICAvLyBNZXJnZSBvdmVybGFwcyAmIHNvcnRcbi8vICAgcmFuZ2VzLnNvcnQoKGEsIGIpID0+IGFbMF0gLSBiWzBdKTtcbi8vICAgY29uc3QgbWVyZ2VkOiBSYW5nZVtdID0gW107XG4vLyAgIGZvciAoY29uc3QgciBvZiByYW5nZXMpIHtcbi8vICAgICBpZiAoIW1lcmdlZC5sZW5ndGggfHwgclswXSA+IG1lcmdlZFttZXJnZWQubGVuZ3RoIC0gMV1bMV0pIG1lcmdlZC5wdXNoKHIpO1xuLy8gICAgIGVsc2UgbWVyZ2VkW21lcmdlZC5sZW5ndGggLSAxXVsxXSA9IE1hdGgubWF4KG1lcmdlZFttZXJnZWQubGVuZ3RoIC0gMV1bMV0sIHJbMV0pO1xuLy8gICB9XG4vLyAgIHJldHVybiBtZXJnZWQ7XG4vLyB9XG5cbi8vIGZ1bmN0aW9uIGluUHJvdGVjdGVkKHBvczogbnVtYmVyLCByYW5nZXM6IFJhbmdlW10pOiBib29sZWFuIHtcbi8vICAgbGV0IGxvID0gMCwgaGkgPSByYW5nZXMubGVuZ3RoIC0gMTtcbi8vICAgd2hpbGUgKGxvIDw9IGhpKSB7XG4vLyAgICAgY29uc3QgbWlkID0gKGxvICsgaGkpID4+IDE7XG4vLyAgICAgY29uc3QgW3MsIGVdID0gcmFuZ2VzW21pZF07XG4vLyAgICAgaWYgKHBvcyA8IHMpIGhpID0gbWlkIC0gMTtcbi8vICAgICBlbHNlIGlmIChwb3MgPj0gZSkgbG8gPSBtaWQgKyAxO1xuLy8gICAgIGVsc2UgcmV0dXJuIHRydWU7XG4vLyAgIH1cbi8vICAgcmV0dXJuIGZhbHNlO1xuLy8gfVxuXG4vLyBmdW5jdGlvbiBpc1dpdGhpbk9ic2lkaWFuTGluayh0ZXh0OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTogYm9vbGVhbiB7XG4vLyAgIGNvbnN0IGJlZm9yZSA9IHRleHQuc2xpY2UoMCwgc3RhcnQpO1xuLy8gICBjb25zdCBhZnRlciA9IHRleHQuc2xpY2UoZW5kKTtcbi8vICAgY29uc3Qgb3BlbklkeCA9IGJlZm9yZS5sYXN0SW5kZXhPZihcIltbXCIpO1xuLy8gICBjb25zdCBjbG9zZUlkeCA9IGJlZm9yZS5sYXN0SW5kZXhPZihcIl1dXCIpO1xuLy8gICBpZiAob3BlbklkeCA+IGNsb3NlSWR4KSB7XG4vLyAgICAgY29uc3QgbmV4dENsb3NlID0gYWZ0ZXIuaW5kZXhPZihcIl1dXCIpO1xuLy8gICAgIGlmIChuZXh0Q2xvc2UgIT09IC0xKSByZXR1cm4gdHJ1ZTtcbi8vICAgfVxuLy8gICByZXR1cm4gZmFsc2U7XG4vLyB9XG5cbi8vIC8qKiBQYXJlbnRoZXRpY2FsIG5vaXNlOiBza2lwIGlmIGluc2lkZSBcIigyMDE5KVwiLWxpa2UgcGFyZW50aGVzZXMgKi9cbi8vIGZ1bmN0aW9uIGlzSW5zaWRlTnVtZXJpY1BhcmVucyh0ZXh0OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTogYm9vbGVhbiB7XG4vLyAgIGNvbnN0IG9wZW4gPSB0ZXh0Lmxhc3RJbmRleE9mKFwiKFwiLCBzdGFydCk7XG4vLyAgIGlmIChvcGVuID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuLy8gICBjb25zdCBjbG9zZSA9IHRleHQuaW5kZXhPZihcIilcIiwgZW5kKTtcbi8vICAgaWYgKGNsb3NlID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuLy8gICBjb25zdCBpbm5lciA9IHRleHQuc2xpY2Uob3BlbiArIDEsIGNsb3NlKS50cmltKCk7XG4vLyAgIGlmICgvXlxcZHsxLDR9KD86W1xcL1xcLlxcLTpdXFxkezEsMn0oPzpbXFwvXFwuXFwtOl1cXGR7MSw0fSk/KT8kLy50ZXN0KGlubmVyKSkgcmV0dXJuIHRydWU7XG4vLyAgIGlmICgvXnB7MSwyfVxcLlxccypcXGQrKFxccyotXFxzKlxcZCspPyQvaS50ZXN0KGlubmVyKSkgcmV0dXJuIHRydWU7XG4vLyAgIHJldHVybiBmYWxzZTtcbi8vIH1cblxuLy8gLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0gTWFya2Rvd24vT2JzaWRpYW4gbGluayBjbGVhbnVwIChQeXRob24gcGFyaXR5KSAtLS0tLS0tLS0tLS0tLS0tLS0tICovXG4vLyBmdW5jdGlvbiByZW1vdmVNYXRjaGluZ01hcmtkb3duTGlua3ModGV4dDogc3RyaW5nLCBQQVRURVJOX0hFQUQ6IFJlZ0V4cCk6IHN0cmluZyB7XG4vLyAgIGNvbnN0IG1kTGluayA9IC8oXFwqXFwqfF9ffFxcKik/XFxbKFteXFxdXSspXFxdXFwoW14pXStcXCkoXFwqXFwqfF9ffFxcKik/L2c7XG4vLyAgIHJldHVybiB0ZXh0LnJlcGxhY2UobWRMaW5rLCAoX20sIHByZSwgZGlzcCwgc3VmKSA9PiB7XG4vLyAgICAgY29uc3QgbGlua1RleHQgPSBTdHJpbmcoZGlzcCk7XG4vLyAgICAgaWYgKFBBVFRFUk5fSEVBRC50ZXN0KGxpbmtUZXh0KSkgcmV0dXJuIGxpbmtUZXh0O1xuLy8gICAgIGNvbnN0IHNpbXBsZU51bSA9IC9eXFxkKyg/Ols6LV1cXGQrKT8oPzotXFxkKyk/JC8udGVzdChsaW5rVGV4dCk7XG4vLyAgICAgaWYgKHNpbXBsZU51bSkgcmV0dXJuIGxpbmtUZXh0O1xuLy8gICAgIHJldHVybiBgJHtwcmUgPz8gXCJcIn1bJHtsaW5rVGV4dH1dJHtzdWYgPz8gXCJcIn1gO1xuLy8gICB9KTtcbi8vIH1cblxuLy8gZnVuY3Rpb24gcmVtb3ZlTWF0Y2hpbmdPYnNpZGlhbkxpbmtzKHRleHQ6IHN0cmluZywgUEFUVEVSTl9IRUFEOiBSZWdFeHApOiBzdHJpbmcge1xuLy8gICBjb25zdCBvYnMgPSAvXFxbXFxbKFteXFxdfF0rKVxcfChbXlxcXV0rKVxcXVxcXS9nO1xuLy8gICByZXR1cm4gdGV4dC5yZXBsYWNlKG9icywgKF9tLCBfdCwgZGlzcCkgPT4ge1xuLy8gICAgIGNvbnN0IGRpc3BsYXkgPSBTdHJpbmcoZGlzcCk7XG4vLyAgICAgaWYgKFBBVFRFUk5fSEVBRC50ZXN0KGRpc3BsYXkpKSByZXR1cm4gZGlzcGxheTtcbi8vICAgICBjb25zdCBzaW1wbGVOdW0gPSAvXlxcZCsoPzpbOi1dXFxkKyk/KD86LVxcZCspPyQvLnRlc3QoZGlzcGxheSk7XG4vLyAgICAgaWYgKHNpbXBsZU51bSkgcmV0dXJuIGRpc3BsYXk7XG4vLyAgICAgcmV0dXJuIF9tO1xuLy8gICB9KTtcbi8vIH1cblxuLy8gZnVuY3Rpb24gcmVwbGFjZU9sZE9ic2lkaWFuTGlua3ModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbi8vICAgY29uc3Qgb2xkTGluayA9IC9cXFtcXFsoWzAtOV0/XFxzW0EtWmEteiBdKylcXHMoXFxkKykjXFxeKFxcZCspKD86XFx8KFteXFxdXSspKT9cXF1cXF0vZztcbi8vICAgcmV0dXJuIHRleHQucmVwbGFjZShvbGRMaW5rLCAoX20sIGJvb2tTaG9ydCwgY2gsIHZlcnNlLCBkaXNwKSA9PiB7XG4vLyAgICAgY29uc3QgYiA9IFN0cmluZyhib29rU2hvcnQpLnRyaW0oKTtcbi8vICAgICByZXR1cm4gZGlzcFxuLy8gICAgICAgPyBgW1ske2J9I14ke2NofS0ke3ZlcnNlfXwke2Rpc3B9XV1gXG4vLyAgICAgICA6IGBbWyR7Yn0jXiR7Y2h9LSR7dmVyc2V9XV1gO1xuLy8gICB9KTtcbi8vIH1cblxuLy8gZnVuY3Rpb24gZmluZExhc3RCb29rQmVmb3JlKHRleHQ6IHN0cmluZywgcG9zOiBudW1iZXIsIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4pOiBzdHJpbmcgfCBudWxsIHtcbi8vICAgLy8gTG9vayBiYWNrIH4yMDAgY2hhcnMgZm9yIGEgYm9vayB0b2tlbiBlbmRpbmcgcmlnaHQgYmVmb3JlICdwb3MnXG4vLyAgIGNvbnN0IHN0YXJ0ID0gTWF0aC5tYXgoMCwgcG9zIC0gMjAwKTtcbi8vICAgY29uc3QgbGVmdCA9IHRleHQuc2xpY2Uoc3RhcnQsIHBvcyk7XG5cbi8vICAgLy8gTWF0Y2ggQUxMIGJvb2sgdG9rZW5zIGluIHRoZSB3aW5kb3c7IHRha2UgdGhlIGxhc3Qgb25lLlxuLy8gICBjb25zdCByZSA9IG5ldyBSZWdFeHAoYCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccyokfCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccytgLCBcImdcIik7XG4vLyAgIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuLy8gICBsZXQgbGFzdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbi8vICAgd2hpbGUgKChtID0gcmUuZXhlYyhsZWZ0KSkgIT09IG51bGwpIHtcbi8vICAgICBsYXN0ID0gbVswXS50cmltKCk7XG4vLyAgIH1cbi8vICAgaWYgKCFsYXN0KSByZXR1cm4gbnVsbDtcblxuLy8gICAvLyBzdHJpcCB0cmFpbGluZyBwdW5jdHVhdGlvbi9kb3QgYW5kIG5vcm1hbGl6ZVxuLy8gICByZXR1cm4gbm9ybWFsaXplQm9va1Rva2VuKGxhc3QucmVwbGFjZSgvXFxzKyQvLCBcIlwiKSwgY3R4KTtcbi8vIH1cblxuLy8gLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBDb3JlIGxpbmtlciAoUHl0aG9uIDE6MSArIHByb3RlY3Rpb25zKSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cbi8vIGZ1bmN0aW9uIHJlcGxhY2VWZXJzZVJlZmVyZW5jZXNPZk1haW5UZXh0KFxuLy8gICB0ZXh0OiBzdHJpbmcsXG4vLyAgIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4sXG4vLyAgIG9wdHM6IHsgcmVtb3ZlT2JzaWRpYW5MaW5rczogYm9vbGVhbjsgcmV3cml0ZU9sZExpbmtzOiBib29sZWFuLCBzdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlOiBib29sZWFuIH1cbi8vICk6IHN0cmluZyB7XG4vLyAgIC8vIE9yZGVyIG1hdGNoZXMgUHl0aG9uOiBzdHJpcCBNRCBsaW5rcyBcdTIxOTIgKG9wdGlvbmFsKSBzdHJpcCBbWy4uLnwuLi5dXSBcdTIxOTIgcmV3cml0ZSBvbGQgbGlua3Ncbi8vICAgaWYgKG9wdHMuc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSkgdGV4dCA9IHJlbW92ZU1hdGNoaW5nTWFya2Rvd25MaW5rcyh0ZXh0LCBjdHguUEFUVEVSTl9IRUFEKTtcbi8vICAgaWYgKG9wdHMucmVtb3ZlT2JzaWRpYW5MaW5rcykgdGV4dCA9IHJlbW92ZU1hdGNoaW5nT2JzaWRpYW5MaW5rcyh0ZXh0LCBjdHguUEFUVEVSTl9IRUFEKTtcbi8vICAgaWYgKG9wdHMucmV3cml0ZU9sZExpbmtzKSB0ZXh0ID0gcmVwbGFjZU9sZE9ic2lkaWFuTGlua3ModGV4dCk7XG5cbi8vICAgY29uc3QgcHJvdGVjdGVkUmFuZ2VzID0gZmluZFByb3RlY3RlZFJhbmdlcyh0ZXh0KTtcblxuLy8gICBsZXQgY3VycmVudF9ib29rOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbi8vICAgbGV0IGN1cnJlbnRfY2hhcHRlcjogbnVtYmVyIHwgc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4vLyAgIGxldCBjdXJyZW50X3ZlcnNlOiBudW1iZXIgfCBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuLy8gICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4vLyAgIGxldCBsYXN0UG9zID0gMDtcblxuLy8gICBjdHguUEFUVEVSTl9HLmxhc3RJbmRleCA9IDA7XG4vLyAgIGZvciAobGV0IG06IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGwgPSBjdHguUEFUVEVSTl9HLmV4ZWModGV4dCk7IG07IG0gPSBjdHguUEFUVEVSTl9HLmV4ZWModGV4dCkpIHtcbi8vICAgICBjb25zdCBzdGFydCA9IG0uaW5kZXg7XG4vLyAgICAgY29uc3QgZW5kID0gc3RhcnQgKyBtWzBdLmxlbmd0aDtcblxuLy8gICAgIGlmIChpblByb3RlY3RlZChzdGFydCwgcHJvdGVjdGVkUmFuZ2VzKSB8fCBpblByb3RlY3RlZChlbmQgLSAxLCBwcm90ZWN0ZWRSYW5nZXMpIHx8XG4vLyAgICAgICAgIGlzV2l0aGluT2JzaWRpYW5MaW5rKHRleHQsIHN0YXJ0LCBlbmQpIHx8IGlzSW5zaWRlTnVtZXJpY1BhcmVucyh0ZXh0LCBzdGFydCwgZW5kKSkge1xuLy8gICAgICAgb3V0LnB1c2godGV4dC5zbGljZShsYXN0UG9zLCBzdGFydCksIG1bMF0pO1xuLy8gICAgICAgbGFzdFBvcyA9IGVuZDtcbi8vICAgICAgIGNvbnRpbnVlO1xuLy8gICAgIH1cblxuLy8gICAgIG91dC5wdXNoKHRleHQuc2xpY2UobGFzdFBvcywgc3RhcnQpKTtcbi8vICAgICBsYXN0UG9zID0gZW5kO1xuXG4vLyAgICAgY29uc3QgZyA9IG0uZ3JvdXBzID8/IHt9O1xuXG4vLyAgICAgLy8gLS0tLSBib29rIG9ubHlcbi8vICAgICBpZiAoZy5ib29rKSB7XG4vLyAgICAgICBjdXJyZW50X2Jvb2sgPSBub3JtYWxpemVCb29rVG9rZW4oZy5ib29rLCBjdHgpOyAvLyA8LS0gc3RyaXBzIHRyYWlsaW5nIGRvdFxuLy8gICAgICAgY3VycmVudF9jaGFwdGVyID0gbnVsbDtcbi8vICAgICAgIGN1cnJlbnRfdmVyc2UgPSBudWxsO1xuLy8gICAgICAgb3V0LnB1c2gobVswXSk7XG4vLyAgICAgICBjb250aW51ZTtcbi8vICAgICB9XG5cbi8vICAgICAvLyAtLS0tIGNoYXB0ZXIgKGNoLiwgY2hhcHRlciwgY2hhcHRlcnMpXG4vLyAgICAgaWYgKGcuY2hhcHRlcikge1xuLy8gICAgICAgY29uc3QgY2htID0gZy5jaGFwdGVyLm1hdGNoKC8oXFxkKykvKTtcbi8vICAgICAgIGlmIChjaG0gJiYgY3VycmVudF9ib29rKSB7XG4vLyAgICAgICAgIGNvbnN0IGNoID0gY2htWzFdO1xuLy8gICAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBjaDtcbi8vICAgICAgICAgY3VycmVudF92ZXJzZSA9IG51bGw7XG4vLyAgICAgICAgIG91dC5wdXNoKGBbWyR7Y3VycmVudF9ib29rfSNeJHtjaH18JHttWzBdfV1dYCk7XG4vLyAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICBvdXQucHVzaChtWzBdKTtcbi8vICAgICAgIH1cbi8vICAgICAgIGNvbnRpbnVlO1xuLy8gICAgIH1cblxuLy8gICAgIC8vIC0tLS0gdmVyc2UgKHYuLCB2di4sIHZlcnNlcylcbi8vICAgICBpZiAoZy52ZXJzZSkge1xuLy8gICAgICAgaWYgKCFjdXJyZW50X2Jvb2spIHtcbi8vICAgICAgICAgY29uc3QgaW5mZXJyZWQgPSBmaW5kTGFzdEJvb2tCZWZvcmUodGV4dCwgc3RhcnQsIGN0eCk7XG4vLyAgICAgICAgIGlmIChpbmZlcnJlZCkge1xuLy8gICAgICAgICAgIGN1cnJlbnRfYm9vayA9IGluZmVycmVkO1xuLy8gICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgIG91dC5wdXNoKG1bMF0pO1xuLy8gICAgICAgICAgIGNvbnRpbnVlO1xuLy8gICAgICAgICB9XG4vLyAgICAgICB9XG4vLyAgICAgICBjb25zdCB2ZXJzZVRleHQgPSBtWzBdO1xuLy8gICAgICAgY29uc3QgcGFydHMgPSB2ZXJzZVRleHQuc3BsaXQoLyhcXHMrKS8pO1xuLy8gICAgICAgY29uc3QgY2ggPSBjdXJyZW50X2NoYXB0ZXIgPyBTdHJpbmcoY3VycmVudF9jaGFwdGVyKSA6IFwiMVwiO1xuLy8gICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIHBhcnRzKSB7XG4vLyAgICAgICAgIGNvbnN0IHZtID0gcGFydC5tYXRjaCgvKFxcZCspLyk7XG4vLyAgICAgICAgIGlmICh2bSAmJiBwYXJ0LnRyaW0oKSkge1xuLy8gICAgICAgICAgIG91dC5wdXNoKGBbWyR7Y3VycmVudF9ib29rfSNeJHtjaH0tJHt2bVsxXX18JHtwYXJ0LnRyaW0oKX1dXWApO1xuLy8gICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgIG91dC5wdXNoKHBhcnQpO1xuLy8gICAgICAgICB9XG4vLyAgICAgICB9XG4vLyAgICAgICBjb250aW51ZTtcbi8vICAgICB9XG5cbi8vICAgICAvLyAtLS0tIG5vdGUocylcbi8vICAgICBpZiAoZy5ub3RlKSB7XG4vLyAgICAgICBjb25zdCBub3RlVGV4dCA9IGcubm90ZSBhcyBzdHJpbmc7XG4vLyAgICAgICBjb25zdCBwYXJ0cyA9IG5vdGVUZXh0LnNwbGl0KC9cXHMrLyk7XG4vLyAgICAgICBsZXQgYm9va1N1YnN0cmluZyA9IGZhbHNlO1xuLy8gICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgICBjb25zdCBwYXJ0ID0gcGFydHNbaV07XG4vLyAgICAgICAgIGNvbnN0IHBtID0gcGFydC5tYXRjaCgvXihcXGQrKS8pO1xuLy8gICAgICAgICBpZiAocG0gJiYgIWJvb2tTdWJzdHJpbmcpIHtcbi8vICAgICAgICAgICBjb25zdCB2ZXJzZSA9IHBtWzFdO1xuLy8gICAgICAgICAgIGlmICgoaSArIDEgPCBwYXJ0cy5sZW5ndGggJiYgIS9eXFxkKy8udGVzdChwYXJ0c1tpICsgMV0pKSB8fCBpICsgMSA+PSBwYXJ0cy5sZW5ndGgpIHtcbi8vICAgICAgICAgICAgIG91dC5wdXNoKFwiIFwiICsgcGFydCk7XG4vLyAgICAgICAgICAgICBjb250aW51ZTtcbi8vICAgICAgICAgICB9XG4vLyAgICAgICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDwgcGFydHMubGVuZ3RoOyBqKyspIHtcbi8vICAgICAgICAgICAgIGlmIChwYXJ0c1tqXSA9PT0gXCJpblwiICYmIGogKyAxIDwgcGFydHMubGVuZ3RoKSB7XG4vLyAgICAgICAgICAgICAgIGlmICgvXlxcZCskLy50ZXN0KHBhcnRzW2ogKyAxXSkgJiYgaiArIDIgPCBwYXJ0cy5sZW5ndGgpIHtcbi8vICAgICAgICAgICAgICAgICBjb25zdCBib29rID0gcGFydHNbaiArIDFdICsgXCIgXCIgKyBwYXJ0c1tqICsgMl07XG4vLyAgICAgICAgICAgICAgICAgY3VycmVudF9jaGFwdGVyID0gcGFydHNbaiArIDNdO1xuLy8gICAgICAgICAgICAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihib29rLCBjdHgpOyAvLyA8LS0gbm9ybWFsaXplXG4vLyAgICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgICAgY29uc3QgYm9vayA9IHBhcnRzW2ogKyAxXTtcbi8vICAgICAgICAgICAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBwYXJ0c1tqICsgMl07XG4vLyAgICAgICAgICAgICAgICAgY3VycmVudF9ib29rID0gbm9ybWFsaXplQm9va1Rva2VuKGJvb2ssIGN0eCk7IC8vIDwtLSBub3JtYWxpemVcbi8vICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICAgIH1cbi8vICAgICAgICAgICBpZiAoY3VycmVudF9ib29rICYmIGN1cnJlbnRfY2hhcHRlcikge1xuLy8gICAgICAgICAgICAgb3V0LnB1c2goYCBbWyR7Y3VycmVudF9ib29rfSAke2N1cnJlbnRfY2hhcHRlcn0jXiR7dmVyc2V9fCR7cGFydH1dXWApO1xuLy8gICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICBvdXQucHVzaChcIiBcIiArIHBhcnQpO1xuLy8gICAgICAgICAgIH1cbi8vICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICBvdXQucHVzaCgoaSA+IDAgPyBcIiBcIiA6IFwiXCIpICsgcGFydCk7XG4vLyAgICAgICAgIH1cbi8vICAgICAgIH1cbi8vICAgICAgIGNvbnRpbnVlO1xuLy8gICAgIH1cblxuLy8gICAgIC8vIC0tLS0gZnVsbCByZWZlcmVuY2Vcbi8vICAgICBpZiAoZy5yZWYpIHtcbi8vICAgICAgIGNvbnN0IG1tID0gKGcucmVmIGFzIHN0cmluZykubWF0Y2goLyhcXHMqW1xcLiw7XT8pKC4rKS8pO1xuLy8gICAgICAgY29uc3QgbGVhZGluZyA9IG1tID8gbW1bMV0gOiBcIlwiO1xuLy8gICAgICAgbGV0IHJlZlRleHQgPSBtbSA/IG1tWzJdIDogKGcucmVmIGFzIHN0cmluZyk7XG5cbi8vICAgICAgIGNvbnN0IGJvb2tTdGFydCA9IHJlZlRleHQubWF0Y2gobmV3IFJlZ0V4cChgXigoPzoke2N0eC5CT09LX0FMVH0pXFxcXC4/XFxcXHMrKWApKTtcbi8vICAgICAgIGxldCBwcmVmaXg6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuLy8gICAgICAgaWYgKGJvb2tTdGFydCkge1xuLy8gICAgICAgICBjb25zdCBib29rUGFydCA9IGJvb2tTdGFydFswXTtcbi8vICAgICAgICAgcHJlZml4ID0gYm9va1BhcnQ7IC8vIGZvciBkaXNwbGF5IHRleHQgKGNhbiBrZWVwIGl0cyBkb3QpXG4vLyAgICAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihib29rUGFydC5yZXBsYWNlKC9cXHMrJC8sIFwiXCIpLCBjdHgpOyAvLyA8LS0gbm9ybWFsaXplIGZvciB0YXJnZXRcbi8vICAgICAgICAgcmVmVGV4dCA9IHJlZlRleHQuc2xpY2UoYm9va1BhcnQubGVuZ3RoKTtcbi8vICAgICAgIH1cbi8vICAgICAgIGlmICghY3VycmVudF9ib29rKSB7XG4vLyAgICAgICAgIC8vIEZhbGxiYWNrOiBpbmZlciBib29rIGZyb20gbGVmdCBjb250ZXh0IChlLmcuLCBcIlx1MjAyNiBKb2huIDE6Mjk7IDEyOjI0OyBcdTIwMjZcIilcbi8vICAgICAgICAgY29uc3QgaW5mZXJyZWQgPSBmaW5kTGFzdEJvb2tCZWZvcmUodGV4dCwgc3RhcnQsIGN0eCk7XG4vLyAgICAgICAgIGlmIChpbmZlcnJlZCkge1xuLy8gICAgICAgICAgIGN1cnJlbnRfYm9vayA9IGluZmVycmVkO1xuLy8gICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgIG91dC5wdXNoKG1bMF0pO1xuLy8gICAgICAgICAgIGNvbnRpbnVlO1xuLy8gICAgICAgICB9XG4vLyAgICAgICB9XG5cbi8vICAgICAgIGNvbnN0IHBhcnRzID0gcmVmVGV4dC5yZXBsYWNlKC9cXC4vZywgXCJcIikudHJpbSgpLnNwbGl0KC8oO3wsKS8pO1xuLy8gICAgICAgY29uc3QgcmVzdWx0OiBzdHJpbmdbXSA9IFtdO1xuLy8gICAgICAgbGV0IHZlcnNlU3RyaW5nID0gZmFsc2U7XG4vLyAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBudWxsO1xuLy8gICAgICAgbGV0IGxvY2FsX2N1cnJlbnRfdmVyc2U6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4vLyAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgICAgIGNvbnN0IHBhcnQgPSBwYXJ0c1tpXTtcbi8vICAgICAgICAgaWYgKHBhcnQgPT09IFwiLFwiIHx8IHBhcnQgPT09IFwiO1wiKSB7XG4vLyAgICAgICAgICAgcmVzdWx0LnB1c2gocGFydCArIFwiIFwiKTtcbi8vICAgICAgICAgICB2ZXJzZVN0cmluZyA9IChwYXJ0ID09PSBcIixcIik7XG4vLyAgICAgICAgICAgY29udGludWU7XG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgbGV0IHAgPSBwYXJ0LnRyaW0oKTtcbi8vICAgICAgICAgaWYgKCFwKSBjb250aW51ZTtcblxuLy8gICAgICAgICBsZXQgY2hhcDogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCA9IGN1cnJlbnRfY2hhcHRlcjtcbi8vICAgICAgICAgbGV0IHY6IHN0cmluZyB8IG51bWJlciB8IG51bGwgPSBudWxsO1xuLy8gICAgICAgICBsZXQgdkVuZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbi8vICAgICAgICAgaWYgKHAuaW5jbHVkZXMoXCI6XCIpKSB7XG4vLyAgICAgICAgICAgY29uc3QgW2NTdHIsIHZTdHJdID0gcC5zcGxpdChcIjpcIik7XG4vLyAgICAgICAgICAgY2hhcCA9IGNTdHI7XG4vLyAgICAgICAgICAgdiA9IHZTdHI7XG4vLyAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgaWYgKHZlcnNlU3RyaW5nKSB2ID0gcDtcbi8vICAgICAgICAgICBlbHNlIHsgY2hhcCA9IHA7IHYgPSBudWxsOyB9XG4vLyAgICAgICAgIH1cblxuLy8gICAgICAgICBpZiAodHlwZW9mIGNoYXAgIT09IFwibnVtYmVyXCIpIHtcbi8vICAgICAgICAgICBjb25zdCBjaHMgPSBTdHJpbmcoY2hhcCA/PyBcIlwiKS5zcGxpdChcIi1cIik7XG4vLyAgICAgICAgICAgY2hhcCA9IHBhcnNlSW50KGNoc1swXS5yZXBsYWNlKC9bYS16XSQvaSwgXCJcIiksIDEwKTtcbi8vICAgICAgICAgfVxuXG4vLyAgICAgICAgIGlmICh2KSB7XG4vLyAgICAgICAgICAgY29uc3QgdnMgPSBTdHJpbmcodikuc3BsaXQoXCItXCIpO1xuLy8gICAgICAgICAgIGxvY2FsX2N1cnJlbnRfdmVyc2UgPSBwYXJzZUludCh2c1swXS5yZXBsYWNlKC9bYS16XSQvaSwgXCJcIiksIDEwKTtcbi8vICAgICAgICAgICB2RW5kID0gdnMubGVuZ3RoID4gMSA/IHBhcnNlSW50KHZzWzFdLnJlcGxhY2UoL1thLXpdJC9pLCBcIlwiKSwgMTApIDogbnVsbDtcbi8vICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICBsb2NhbF9jdXJyZW50X3ZlcnNlID0gbnVsbDtcbi8vICAgICAgICAgICB2RW5kID0gbnVsbDtcbi8vICAgICAgICAgfVxuXG4vLyAgICAgICAgIGlmICh2RW5kKSB7XG4vLyAgICAgICAgICAgY29uc3QgZGlzcGxheVN0YXJ0ID0gcC5yZXBsYWNlKC9cXGQrW2Etel0/JC9pLCBcIlwiKTtcbi8vICAgICAgICAgICByZXN1bHQucHVzaChgW1ske2N1cnJlbnRfYm9va30jXiR7Y2hhcH0tJHtsb2NhbF9jdXJyZW50X3ZlcnNlfXwke3ByZWZpeCA/IHByZWZpeCA6IFwiXCJ9JHtkaXNwbGF5U3RhcnR9XV1gKTtcbi8vICAgICAgICAgICByZXN1bHQucHVzaChgW1ske2N1cnJlbnRfYm9va30jXiR7Y2hhcH0tJHt2RW5kfXwke1N0cmluZyhwKS5tYXRjaCgvKFxcZCtbYS16XT8pJC9pKT8uWzFdID8/IFwiXCJ9XV1gKTtcbi8vICAgICAgICAgICBsb2NhbF9jdXJyZW50X3ZlcnNlID0gdkVuZDtcbi8vICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICByZXN1bHQucHVzaChgW1ske2N1cnJlbnRfYm9va30jXiR7Y2hhcH0ke2xvY2FsX2N1cnJlbnRfdmVyc2UgPyBgLSR7bG9jYWxfY3VycmVudF92ZXJzZX1gIDogXCJcIn18JHtwcmVmaXggPyBwcmVmaXggOiBcIlwifSR7cH1dXWApO1xuLy8gICAgICAgICB9XG4vLyAgICAgICAgIHByZWZpeCA9IG51bGw7XG4vLyAgICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IGNoYXA7XG4vLyAgICAgICAgIGN1cnJlbnRfdmVyc2UgPSBsb2NhbF9jdXJyZW50X3ZlcnNlO1xuLy8gICAgICAgfVxuXG4vLyAgICAgICBvdXQucHVzaChsZWFkaW5nICsgcmVzdWx0LmpvaW4oXCJcIikpO1xuLy8gICAgICAgY29udGludWU7XG4vLyAgICAgfVxuXG4vLyAgICAgb3V0LnB1c2gobVswXSk7XG4vLyAgIH1cblxuLy8gICBvdXQucHVzaCh0ZXh0LnNsaWNlKGxhc3RQb3MpKTtcbi8vICAgcmV0dXJuIG91dC5qb2luKFwiXCIpO1xuLy8gfVxuXG5cbi8vIC8qKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUHVibGljIEFQSSB1c2VkIGJ5IGNvbW1hbmQgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG4vLyBleHBvcnQgYXN5bmMgZnVuY3Rpb24gbGlua1ZlcnNlc0luVGV4dCh0ZXh0OiBzdHJpbmcsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MpOiBQcm9taXNlPHN0cmluZz4ge1xuLy8gICBjb25zdCBjdHggPSBidWlsZEJvb2tDb250ZXh0KHNldHRpbmdzKTtcblxuLy8gICAvLyBTZXR0aW5ncyB0b2dnbGVzIChvcHRpb25hbDsgZGVmYXVsdCB0byBQeXRob24gYmVoYXZpb3IpXG4vLyAgIGNvbnN0IHJlbW92ZU9ic2lkaWFuRGlzcGxheUxpbmtzID1cbi8vICAgICAoc2V0dGluZ3MgYXMgYW55KT8ucmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MgPz8gdHJ1ZTtcbi8vICAgY29uc3QgcmV3cml0ZU9sZE9ic2lkaWFuTGlua3MgPVxuLy8gICAgIChzZXR0aW5ncyBhcyBhbnkpPy5yZXdyaXRlT2xkT2JzaWRpYW5MaW5rcyA/PyB0cnVlO1xuLy8gICBjb25zdCBzdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlID1cbi8vICAgICAoc2V0dGluZ3MgYXMgYW55KT8uc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSA/PyB0cnVlO1xuXG4vLyAgIHJldHVybiByZXBsYWNlVmVyc2VSZWZlcmVuY2VzT2ZNYWluVGV4dCh0ZXh0LCBjdHgsIHtcbi8vICAgICByZW1vdmVPYnNpZGlhbkxpbmtzOiByZW1vdmVPYnNpZGlhbkRpc3BsYXlMaW5rcyxcbi8vICAgICByZXdyaXRlT2xkTGlua3M6IHJld3JpdGVPbGRPYnNpZGlhbkxpbmtzLFxuLy8gICAgIHN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2U6IHN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2Vcbi8vICAgfSk7XG4vLyB9XG5cbi8vIGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kVmVyc2VMaW5rcyhhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncywgcGFyYW1zPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPikge1xuLy8gICBjb25zdCBzY29wZSA9IHBhcmFtcz8uc2NvcGUgPz8gXCJjdXJyZW50XCI7XG5cbi8vICAgaWYgKHNjb3BlID09PSBcImZvbGRlclwiKSB7XG4vLyAgICAgY29uc3QgYWN0aXZlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4vLyAgICAgY29uc3QgZm9sZGVyID0gYWN0aXZlPy5wYXJlbnQ7XG4vLyAgICAgaWYgKCFhY3RpdmUgfHwgIWZvbGRlcikgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgaW5zaWRlIHRoZSB0YXJnZXQgZm9sZGVyLlwiKTsgcmV0dXJuOyB9XG5cbi8vICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZvbGRlci5jaGlsZHJlbikge1xuLy8gICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUgJiYgY2hpbGQuZXh0ZW5zaW9uID09PSBcIm1kXCIpIHtcbi8vICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGNoaWxkKTtcbi8vICAgICAgICAgY29uc3QgeyB5YW1sLCBib2R5IH0gPSBzcGxpdEZyb250bWF0dGVyKGNvbnRlbnQpO1xuLy8gICAgICAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KGJvZHksIHNldHRpbmdzKTtcbi8vICAgICAgICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShjaGlsZCwgKHlhbWwgPz8gXCJcIikgKyBsaW5rZWQpO1xuLy8gICAgICAgfVxuLy8gICAgIH1cbi8vICAgICBuZXcgTm90aWNlKFwiTGlua2VkIHZlcnNlcyBpbiBmb2xkZXIuXCIpO1xuLy8gICAgIHJldHVybjtcbi8vICAgfVxuXG4vLyAgIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbi8vICAgaWYgKCFmaWxlKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7IHJldHVybjsgfVxuXG4vLyAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcbi8vICAgY29uc3QgeyB5YW1sLCBib2R5IH0gPSBzcGxpdEZyb250bWF0dGVyKGNvbnRlbnQpO1xuLy8gICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KGJvZHksIHNldHRpbmdzKTtcbi8vICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCAoeWFtbCA/PyBcIlwiKSArIGxpbmtlZCk7XG4vLyAgIG5ldyBOb3RpY2UoXCJMaW5rZWQgdmVyc2VzIGluIGN1cnJlbnQgZmlsZS5cIik7XG4vLyB9XG5cbi8vIGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kVmVyc2VMaW5rc1NlbGVjdGlvbk9yTGluZShhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuLy8gICBjb25zdCBtZFZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbi8vICAgaWYgKCFtZFZpZXcpIHsgbmV3IE5vdGljZShcIk9wZW4gYSBNYXJrZG93biBmaWxlIGZpcnN0LlwiKTsgcmV0dXJuOyB9XG5cbi8vICAgY29uc3QgZWRpdG9yID0gbWRWaWV3LmVkaXRvcjtcblxuLy8gICAvLyBJZiB1c2VyIHNlbGVjdGVkIHRleHQsIHByb2Nlc3MgdGhhdDsgb3RoZXJ3aXNlIHByb2Nlc3MgdGhlIGN1cnJlbnQgbGluZVxuLy8gICBjb25zdCBzZWxlY3Rpb25UZXh0ID0gZWRpdG9yLmdldFNlbGVjdGlvbigpO1xuLy8gICBpZiAoc2VsZWN0aW9uVGV4dCAmJiBzZWxlY3Rpb25UZXh0Lmxlbmd0aCA+IDApIHtcbi8vICAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KHNlbGVjdGlvblRleHQsIHNldHRpbmdzKTtcbi8vICAgICBpZiAobGlua2VkICE9PSBzZWxlY3Rpb25UZXh0KSB7XG4vLyAgICAgICBlZGl0b3IucmVwbGFjZVNlbGVjdGlvbihsaW5rZWQpO1xuLy8gICAgICAgbmV3IE5vdGljZShcIkxpbmtlZCB2ZXJzZXMgaW4gc2VsZWN0aW9uLlwiKTtcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgbmV3IE5vdGljZShcIk5vIGxpbmthYmxlIHZlcnNlcyBpbiBzZWxlY3Rpb24uXCIpO1xuLy8gICAgIH1cbi8vICAgICByZXR1cm47XG4vLyAgIH1cblxuLy8gICAvLyBObyBzZWxlY3Rpb24gXHUyMTkyIHByb2Nlc3MgY3VycmVudCBsaW5lXG4vLyAgIGNvbnN0IGxpbmUgPSBlZGl0b3IuZ2V0Q3Vyc29yKCkubGluZTtcbi8vICAgY29uc3QgbGluZVRleHQgPSBlZGl0b3IuZ2V0TGluZShsaW5lKTtcbi8vICAgY29uc3QgbGlua2VkID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChsaW5lVGV4dCwgc2V0dGluZ3MpO1xuLy8gICBpZiAobGlua2VkICE9PSBsaW5lVGV4dCkge1xuLy8gICAgIGVkaXRvci5zZXRMaW5lKGxpbmUsIGxpbmtlZCk7XG4vLyAgICAgbmV3IE5vdGljZShcIkxpbmtlZCB2ZXJzZXMgb24gY3VycmVudCBsaW5lLlwiKTtcbi8vICAgfSBlbHNlIHtcbi8vICAgICBuZXcgTm90aWNlKFwiTm8gbGlua2FibGUgdmVyc2VzIG9uIGN1cnJlbnQgbGluZS5cIik7XG4vLyAgIH1cbi8vIH0iLCAiaW1wb3J0IHsgQXBwLCBURmlsZSwgVEZvbGRlciwgbm9ybWFsaXplUGF0aCB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRGcm9udG1hdHRlcih0ZXh0OiBzdHJpbmcpOiB7IHlhbWw/OiBzdHJpbmc7IGJvZHk6IHN0cmluZyB9IHtcbiAgaWYgKHRleHQuc3RhcnRzV2l0aChcIi0tLVwiKSkge1xuICAgIGNvbnN0IGVuZCA9IHRleHQuaW5kZXhPZihcIlxcbi0tLVwiLCAzKTtcbiAgICBpZiAoZW5kICE9PSAtMSkge1xuICAgICAgY29uc3QgeWFtbCA9IHRleHQuc2xpY2UoMCwgZW5kICsgNCk7XG4gICAgICBjb25zdCBib2R5ID0gdGV4dC5zbGljZShlbmQgKyA0KTtcbiAgICAgIHJldHVybiB7IHlhbWwsIGJvZHkgfTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHsgYm9keTogdGV4dCB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0QWZ0ZXJZYW1sT3JIMShzcmM6IHN0cmluZywgYmxvY2s6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHsgeWFtbCwgYm9keSB9ID0gc3BsaXRGcm9udG1hdHRlcihzcmMpO1xuICBpZiAoeWFtbCkgcmV0dXJuIHlhbWwgKyBcIlxcblwiICsgYmxvY2sgKyBib2R5O1xuICBjb25zdCBmaXJzdEgxID0gYm9keS5pbmRleE9mKFwiXFxuIyBcIik7XG4gIGlmIChmaXJzdEgxICE9PSAtMSkge1xuICAgIGNvbnN0IHBvcyA9IGZpcnN0SDEgKyAxO1xuICAgIHJldHVybiBib2R5LnNsaWNlKDAsIHBvcykgKyBibG9jayArIGJvZHkuc2xpY2UocG9zKTtcbiAgfVxuICByZXR1cm4gYm9keSArIChib2R5LmVuZHNXaXRoKFwiXFxuXCIpID8gXCJcIiA6IFwiXFxuXCIpICsgYmxvY2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0xlYWZGb2xkZXIoZm9sZGVyOiBURm9sZGVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBmb2xkZXIuY2hpbGRyZW4uZmluZChjID0+IGMgaW5zdGFuY2VvZiBURm9sZGVyKSA9PT0gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGVhZkZvbGRlcnNVbmRlcihhcHA6IEFwcCwgYmFzZUZvbGRlclBhdGg6IHN0cmluZyk6IFRGb2xkZXJbXSB7XG4gIGNvbnN0IGJhc2UgPSBhcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKG5vcm1hbGl6ZVBhdGgoYmFzZUZvbGRlclBhdGgpKTtcbiAgaWYgKCFiYXNlKSByZXR1cm4gW107XG4gIGNvbnN0IHJlczogVEZvbGRlcltdID0gW107XG4gIGNvbnN0IHdhbGsgPSAoZjogVEZvbGRlcikgPT4ge1xuICAgIGlmIChpc0xlYWZGb2xkZXIoZikpIHJlcy5wdXNoKGYpO1xuICAgIGVsc2UgZm9yIChjb25zdCBjIG9mIGYuY2hpbGRyZW4pIGlmIChjIGluc3RhbmNlb2YgVEZvbGRlcikgd2FsayhjKTtcbiAgfTtcbiAgd2FsayhiYXNlKTtcbiAgcmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpc3RNYXJrZG93bkZpbGVzKGZvbGRlcjogVEZvbGRlcik6IFRGaWxlW10ge1xuICByZXR1cm4gZm9sZGVyLmNoaWxkcmVuLmZpbHRlcigoYyk6IGMgaXMgVEZpbGUgPT4gYyBpbnN0YW5jZW9mIFRGaWxlICYmIGMuZXh0ZW5zaW9uID09PSBcIm1kXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlyc3ROb25FbXB0eUxpbmVJbmRleChsaW5lczogc3RyaW5nW10pOiBudW1iZXIge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSBpZiAobGluZXNbaV0udHJpbSgpLmxlbmd0aCkgcmV0dXJuIGk7XG4gIHJldHVybiAtMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwc2VydFRvcExpbmtzQmxvY2soc3JjOiBzdHJpbmcsIGxpbmtzTGluZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgeyB5YW1sLCBib2R5IH0gPSBzcGxpdEZyb250bWF0dGVyKHNyYyk7XG5cbiAgZnVuY3Rpb24gcmVwbGFjZVdpdGhpbihjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IE1hdGgubWluKDEwLCBsaW5lcy5sZW5ndGgpOyBpKyspIHtcbiAgICAgIGlmICgvXFx8UHJldmlvdXNcXF1cXF18XFx8TmV4dFxcXVxcXS8udGVzdChsaW5lc1tpXSkpIHtcbiAgICAgICAgbGluZXNbaV0gPSBsaW5rc0xpbmU7XG4gICAgICAgIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xuICAgICAgfVxuICAgIH1cbiAgICBsaW5lcy5zcGxpY2UoMCwgMCwgXCJcIiwgbGlua3NMaW5lLCBcIlwiKTtcbiAgICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGlmICh5YW1sKSByZXR1cm4geWFtbCArIHJlcGxhY2VXaXRoaW4oYm9keSk7XG4gIHJldHVybiByZXBsYWNlV2l0aGluKHNyYyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cHNlcnRCb3R0b21MaW5rcyhzcmM6IHN0cmluZywgbGlua3NMaW5lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IHNyYy5zcGxpdChcIlxcblwiKTtcbiAgZm9yIChsZXQgaSA9IE1hdGgubWF4KDAsIGxpbmVzLmxlbmd0aCAtIDUpOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoL1xcfFByZXZpb3VzXFxdXFxdfFxcfE5leHRcXF1cXF0vLnRlc3QobGluZXNbaV0pKSB7XG4gICAgICBsaW5lc1tpXSA9IGxpbmtzTGluZTtcbiAgICAgIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xuICAgIH1cbiAgfVxuICBsaW5lcy5wdXNoKFwiXCIsIGxpbmtzTGluZSk7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xufVxuIiwgImltcG9ydCB7IEFwcCwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IEJhc2VCb2xsc01vZGFsIH0gZnJvbSBcIi4vYm9sbHMtYmFzZS1tb2RhbFwiO1xuXG5leHBvcnQgY2xhc3MgUGlja1ZlcnNpb25Nb2RhbCBleHRlbmRzIEJhc2VCb2xsc01vZGFsIHtcbiAgcHJpdmF0ZSByZWFkb25seSBvblBpY2s6ICh2ZXJTaG9ydDogc3RyaW5nIHwgbnVsbCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncywgb25QaWNrOiAodmVyU2hvcnQ6IHN0cmluZyB8IG51bGwpID0+IHZvaWQpIHtcbiAgICBzdXBlcihhcHAsIHNldHRpbmdzLCB7XG4gICAgICBsYW5ndWFnZUxhYmVsOiBzZXR0aW5ncy5iaWJsZURlZmF1bHRMYW5ndWFnZSA/PyBudWxsLFxuICAgICAgdmVyc2lvblNob3J0OiAgc2V0dGluZ3MuYmlibGVEZWZhdWx0VmVyc2lvbiwgLy8gY2FuIGJlIHVuZGVmaW5lZFxuICAgIH0pO1xuICAgIHRoaXMub25QaWNrID0gb25QaWNrO1xuICB9XG5cbiAgcHJvdGVjdGVkIHJlbmRlckZvb3Rlcihjb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJIb3cgdG8gbGlua1wiKVxuICAgICAgLnNldERlc2MoXCJJZiB5b3UgY2FuY2VsLCBsaW5rcyB3aWxsIHVzZSBkZWZhdWx0IChubyB2ZXJzaW9uKS5cIilcbiAgICAgIC5hZGRCdXR0b24oYiA9PlxuICAgICAgICBiLnNldEJ1dHRvblRleHQoXCJVc2Ugc2VsZWN0ZWQgdmVyc2lvblwiKS5zZXRDdGEoKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgdGhpcy5vblBpY2sodGhpcy50cmFuc2xhdGlvbkNvZGUgfHwgbnVsbCk7XG4gICAgICAgIH0pXG4gICAgICApXG4gICAgICAuYWRkRXh0cmFCdXR0b24oYiA9PlxuICAgICAgICBiLnNldEljb24oXCJ4XCIpLnNldFRvb2x0aXAoXCJDYW5jZWwgKG5vIHZlcnNpb24pXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICB0aGlzLm9uUGljayhudWxsKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7XG4gIEJhc2VCb2xsc0RlZmF1bHRzLFxuICBCb2xsc0xhbmd1YWdlLFxuICBCb2xsc1BpY2tlckNvbXBvbmVudCxcbn0gZnJvbSBcIi4vYm9sbHMtcGlja2VyLWNvbXBvbmVudFwiO1xuXG4vKipcbiAqIEJhc2UgbW9kYWwgdGhhdDpcbiAqICAtIGRlbGVnYXRlcyBhbGwgQm9sbHMgY2F0YWxvZ3VlIGxvYWRpbmcgKyBwaWNrZXJzIHRvIEJvbGxzUGlja2VyQ29tcG9uZW50LFxuICogIC0gZXhwb3NlcyBjaG9zZW4gYGxhbmd1YWdlS2V5YCwgYHRyYW5zbGF0aW9uQ29kZWAsIGB0cmFuc2xhdGlvbkZ1bGxgLFxuICogIC0gcHJvdmlkZXMgaG9va3MgZm9yIHN1YmNsYXNzZXMgdG8gYWRkIG9wdGlvbnMvZm9vdGVyL2FjdGlvbnMuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlQm9sbHNNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJvdGVjdGVkIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3M7XG5cbiAgLyoqIEN1cnJlbnQgc2VsZWN0aW9uIChrZXB0IGluIHN5bmMgdmlhIHRoZSBjb21wb25lbnQncyBvbkNoYW5nZSkgKi9cbiAgcHJvdGVjdGVkIGxhbmd1YWdlS2V5OiBzdHJpbmcgPSBcIkFMTFwiOyAvLyBcIkFMTFwiICg9ZmxhdHRlbikgb3IgZXhhY3QgQm9sbHNMYW5ndWFnZS5sYW5ndWFnZVxuICBwcm90ZWN0ZWQgdHJhbnNsYXRpb25Db2RlPzogc3RyaW5nID0gdW5kZWZpbmVkO1xuICBwcm90ZWN0ZWQgdHJhbnNsYXRpb25GdWxsPzogc3RyaW5nID0gdW5kZWZpbmVkO1xuXG4gIC8qKiBJZiBhIHN1YmNsYXNzIHdhbnRzIHRvIHJlbmRlciBhZGRpdGlvbmFsIFVJIG5lYXIgdGhlIHZlcnNpb25zIGFyZWEgKi9cbiAgcHJvdGVjdGVkIHZlcnNpb25zQ29udGFpbmVyITogSFRNTERpdkVsZW1lbnQ7XG5cbiAgLyoqIE9wdGlvbmFsIGRlZmF1bHRzIHRvIHByZXNlbGVjdCAoZnJvbSBzZXR0aW5ncykgKi9cbiAgcHJpdmF0ZSBkZWZhdWx0cz86IEJhc2VCb2xsc0RlZmF1bHRzO1xuXG4gIC8qKiBJZiBhIHN1YmNsYXNzIHdhbnRzIHRvIGluc3BlY3Qgb3IgcmV1c2UgdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJvdGVjdGVkIHBpY2tlciE6IEJvbGxzUGlja2VyQ29tcG9uZW50O1xuXG4gIC8qKiBJZiBhIHN1YmNsYXNzIHdhbnRzIHRvIGFjY2VzcyB0aGUgaW4tbWVtb3J5IGJsb2NrcyBhZnRlciBjb21wb25lbnQgbG9hZHMuICovXG4gIHByb3RlY3RlZCBsYW5nQmxvY2tzOiBCb2xsc0xhbmd1YWdlW10gPSBbXTtcblxuICBwcm90ZWN0ZWQgZGlzYWxsb3dEZWZhdWx0OiBib29sZWFuID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MsIGRlZmF1bHRzPzogQmFzZUJvbGxzRGVmYXVsdHMpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICB0aGlzLnRyYW5zbGF0aW9uQ29kZSA9IHNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb247XG4gICAgdGhpcy50cmFuc2xhdGlvbkZ1bGwgPSBzZXR0aW5ncy5iaWJsZURlZmF1bHRWZXJzaW9uRnVsbDtcbiAgICB0aGlzLmxhbmd1YWdlS2V5ID0gc2V0dGluZ3MuYmlibGVEZWZhdWx0TGFuZ3VhZ2UgPz8gXCJBTExcIjtcbiAgICB0aGlzLmRlZmF1bHRzID0gZGVmYXVsdHM7XG4gIH1cblxuICAvKiogT3ZlcnJpZGUgdG8gYWRkIGV4dHJhIG9wdGlvbiBjb250cm9scyB1bmRlciB0aGUgcGlja2VycyAqL1xuICBwcm90ZWN0ZWQgcmVuZGVyRXh0cmFPcHRpb25zKF9jb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7fVxuXG4gIC8qKiBPdmVycmlkZSB0byByZW5kZXIgZm9vdGVyIChidXR0b25zL3Byb2dyZXNzL2V0Yy4pICovXG4gIHByb3RlY3RlZCBhYnN0cmFjdCByZW5kZXJGb290ZXIoY29udGVudEVsOiBIVE1MRWxlbWVudCk6IHZvaWQ7XG5cbiAgYXN5bmMgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiQmlibGUgdmVyc2lvblwiKTtcblxuICAgIC8vIEluc3RhbnRpYXRlIHRoZSByZXVzYWJsZSBwaWNrZXIgY29tcG9uZW50LlxuICAgIC8vIEl0IGhhbmRsZXM6XG4gICAgLy8gIC0gbG9hZGluZy9jYWNoaW5nIGxhbmd1YWdlcy5qc29uLFxuICAgIC8vICAtIGNyZWF0aW5nIExhbmd1YWdlICsgVmVyc2lvbiBkcm9wZG93bnMsXG4gICAgLy8gIC0gYXBwbHlpbmcgcHJvdmlkZWQgZGVmYXVsdHMsXG4gICAgLy8gIC0gY2FsbGluZyBvbkNoYW5nZSB3aXRoIGxhbmd1YWdlLCB2ZXJzaW9uIChzaG9ydCksIGFuZCB2ZXJzaW9uRnVsbC5cbiAgICB0aGlzLnBpY2tlciA9IG5ldyBCb2xsc1BpY2tlckNvbXBvbmVudChcbiAgICAgIHtcbiAgICAgICAgYXBwOiB0aGlzLmFwcCwgLy8gc28gY29tcG9uZW50IGNhbiBwZXJzaXN0IHNldHRpbmdzIGlmIGl0IHdhbnRzXG4gICAgICAgIHNldHRpbmdzOiB0aGlzLnNldHRpbmdzLFxuICAgICAgICAvLyBZb3UgY2FuIHBhc3MgYSBzdGFsZS9lbXB0eSBhcnJheTsgdGhlIGNvbXBvbmVudCB3aWxsIGxvYWQvcmVwbGFjZSBpdC5cbiAgICAgICAgbGFuZ0Jsb2NrczogdGhpcy5sYW5nQmxvY2tzLFxuICAgICAgICAvLyBJbml0aWFsIHZhbHVlczsgdGhlIGNvbXBvbmVudCBtYXkgb3ZlcnJpZGUgYmFzZWQgb24gZGVmYXVsdHMgb3IgYXZhaWxhYmlsaXR5LlxuICAgICAgICBsYW5ndWFnZUtleTogdGhpcy5sYW5ndWFnZUtleSxcbiAgICAgICAgdHJhbnNsYXRpb25Db2RlOiB0aGlzLnNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb24sXG4gICAgICAgIHRyYW5zbGF0aW9uRnVsbDogdGhpcy5zZXR0aW5ncy5iaWJsZURlZmF1bHRWZXJzaW9uRnVsbCxcbiAgICAgICAgZGVmYXVsdHM6IHRoaXMuZGVmYXVsdHMsXG4gICAgICAgIGNvbnRhaW5lcjogY29udGVudEVsLFxuICAgICAgICB2ZXJzaW9uc0NvbnRhaW5lcjogY29udGVudEVsLmNyZWF0ZURpdigpLCAvLyB3aWxsIGJlIHJlcGxhY2VkIGJ5IGNvbXBvbmVudCBpbiBpdHMgY29uc3RydWN0b3JcbiAgICAgICAgb25DaGFuZ2U6IChsYW5ndWFnZSwgdmVyc2lvbiwgdmVyc2lvbkZ1bGwpID0+IHtcbiAgICAgICAgICB0aGlzLmxhbmd1YWdlS2V5ID0gbGFuZ3VhZ2U7XG4gICAgICAgICAgdGhpcy50cmFuc2xhdGlvbkNvZGUgPSB2ZXJzaW9uO1xuICAgICAgICAgIHRoaXMudHJhbnNsYXRpb25GdWxsID0gdmVyc2lvbkZ1bGw7XG4gICAgICAgICAgLy8gS2VlcCBhIGxvY2FsIGNvcHkgb2Ygd2hhdCB0aGUgY29tcG9uZW50IGN1cnJlbnRseSBrbm93cyBhYm91dCBibG9ja3NcbiAgICAgICAgICB0aGlzLmxhbmdCbG9ja3MgPSB0aGlzLnBpY2tlcj8uW1wib3B0aW9uc1wiXT8ubGFuZ0Jsb2NrcyA/PyB0aGlzLmxhbmdCbG9ja3M7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdGhpcy5zZXR0aW5ncyxcbiAgICAgIHRoaXMuZGlzYWxsb3dEZWZhdWx0XG4gICAgKTtcblxuICAgIC8vIEV4cG9zZSB0aGUgdmVyc2lvbnMgY29udGFpbmVyIGZvciBzdWJjbGFzc2VzIHRoYXQgd2FudCB0byByZW5kZXIgbmVhciBpdC5cbiAgICB0aGlzLnZlcnNpb25zQ29udGFpbmVyID0gdGhpcy5waWNrZXIudmVyc2lvbnNDb250YWluZXIhO1xuXG4gICAgLy8gQWxsb3cgc3ViY2xhc3NlcyB0byBhZGQgZXh0cmEgY29udHJvbHNcbiAgICB0aGlzLnJlbmRlckV4dHJhT3B0aW9ucyhjb250ZW50RWwpO1xuXG4gICAgLy8gRm9vdGVyL2FjdGlvbnMgKGFic3RyYWN0KVxuICAgIHRoaXMucmVuZGVyRm9vdGVyKGNvbnRlbnRFbCk7XG4gIH1cblxuICBvbkNsb3NlKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG59IiwgImltcG9ydCB7IEFwcCwgVEZpbGUsIFRGb2xkZXIsIE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBsaXN0TWFya2Rvd25GaWxlcywgdXBzZXJ0Qm90dG9tTGlua3MsIHVwc2VydFRvcExpbmtzQmxvY2sgfSBmcm9tIFwiLi4vbGliL21kVXRpbHNcIjtcblxuZnVuY3Rpb24gdG9rZW5Gcm9tRmlsZW5hbWUobmFtZTogc3RyaW5nKTogbnVtYmVyIHwgbnVsbCB7XG4gIGNvbnN0IG0gPSBuYW1lLm1hdGNoKC9eKFxcZCspLyk7XG4gIGlmICghbSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBwYXJzZUludChtWzFdLCAxMCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kQWRkTmV4dFByZXZpb3VzKGFwcDogQXBwLCBfc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncywgX3BhcmFtcz86IFJlY29yZDxzdHJpbmcsc3RyaW5nPikge1xuICBjb25zdCBmaWxlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gIGlmICghZmlsZSkgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgZmlyc3QuXCIpOyByZXR1cm47IH1cbiAgY29uc3QgcGFyZW50ID0gZmlsZS5wYXJlbnQ7XG4gIGlmICghKHBhcmVudCBpbnN0YW5jZW9mIFRGb2xkZXIpKSB7IG5ldyBOb3RpY2UoXCJDdXJyZW50IGZpbGUgaGFzIG5vIGZvbGRlci5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IG1kRmlsZXMgPSBsaXN0TWFya2Rvd25GaWxlcyhwYXJlbnQpXG4gICAgLm1hcChmID0+ICh7IGYsIG46IHRva2VuRnJvbUZpbGVuYW1lKGYubmFtZSkgfSkpXG4gICAgLmZpbHRlcih4ID0+IHgubiAhPT0gbnVsbClcbiAgICAuc29ydCgoYSwgYikgPT4gKGEubiEgLSBiLm4hKSlcbiAgICAubWFwKHggPT4geC5mKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1kRmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjdXIgPSBtZEZpbGVzW2ldO1xuICAgIGNvbnN0IHByZXYgPSBtZEZpbGVzW2kgLSAxXTtcbiAgICBjb25zdCBuZXh0ID0gbWRGaWxlc1tpICsgMV07XG5cbiAgICBjb25zdCBwcmV2TmFtZSA9IHByZXYgPyBwcmV2LmJhc2VuYW1lIDogbnVsbDtcbiAgICBjb25zdCBuZXh0TmFtZSA9IG5leHQgPyBuZXh0LmJhc2VuYW1lIDogbnVsbDtcblxuICAgIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmIChwcmV2TmFtZSkgcGFydHMucHVzaChgW1ske3ByZXZOYW1lfXxQcmV2aW91c11dYCk7XG4gICAgaWYgKG5leHROYW1lKSBwYXJ0cy5wdXNoKGBbWyR7bmV4dE5hbWV9fE5leHRdXWApO1xuICAgIGNvbnN0IGxpbmtzTGluZSA9IHBhcnRzLmpvaW4oXCIgfCBcIik7XG5cbiAgICBpZiAoIWxpbmtzTGluZSkgY29udGludWU7XG5cbiAgICBjb25zdCBzcmMgPSBhd2FpdCBhcHAudmF1bHQucmVhZChjdXIpO1xuICAgIGNvbnN0IHdpdGhUb3AgPSB1cHNlcnRUb3BMaW5rc0Jsb2NrKHNyYywgbGlua3NMaW5lKTtcbiAgICBjb25zdCB3aXRoQm90aCA9IHVwc2VydEJvdHRvbUxpbmtzKHdpdGhUb3AsIGxpbmtzTGluZSk7XG4gICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShjdXIsIHdpdGhCb3RoKTtcbiAgfVxuXG4gIG5ldyBOb3RpY2UoXCJJbnNlcnRlZCBOZXh0L1ByZXZpb3VzIGxpbmtzLlwiKTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIFRGaWxlLCBURm9sZGVyLCBOb3RpY2UsIG5vcm1hbGl6ZVBhdGggfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgYXJ0aWNsZVN0eWxlLCBub3dTdGFtcCB9IGZyb20gXCIuLi9saWIvdGV4dFV0aWxzXCI7XG5pbXBvcnQgeyBnZXRMZWFmRm9sZGVyc1VuZGVyLCBsaXN0TWFya2Rvd25GaWxlcyB9IGZyb20gXCIuLi9saWIvbWRVdGlsc1wiO1xuXG5jb25zdCBzdHJpcFdpa2lsaW5rcyA9IChzOiBzdHJpbmcpID0+IHMucmVwbGFjZSgvXlxcW1xcW3xcXF1cXF0kL2csIFwiXCIpO1xuXG5mdW5jdGlvbiBmcm9udG1hdHRlckF1dGhvckZyb21GaWxlKGFwcDogQXBwLCBmOiBURmlsZSk6IHsgYXV0aG9yPzogc3RyaW5nIHwgc3RyaW5nW10sIGJvb2tfdHlwZT86IHN0cmluZyB9IHtcbiAgY29uc3QgY2FjaGUgPSBhcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZik7XG4gIGNvbnN0IGZtOiBhbnkgPSBjYWNoZT8uZnJvbnRtYXR0ZXIgPz8ge307XG4gIGxldCBhdXRob3IgPSBmbS5hdXRob3I7XG4gIGlmICh0eXBlb2YgYXV0aG9yID09PSBcInN0cmluZ1wiKSBhdXRob3IgPSBhdXRob3IucmVwbGFjZSgvXlwiXFxzKi8sIFwiXCIpLnJlcGxhY2UoL1xccypcIiQvLCBcIlwiKTtcbiAgY29uc3QgYm9va190eXBlID0gdHlwZW9mIGZtLmJvb2tfdHlwZSA9PT0gXCJzdHJpbmdcIiA/IGZtLmJvb2tfdHlwZS5yZXBsYWNlKC9eXCJcXHMqLywgXCJcIikucmVwbGFjZSgvXFxzKlwiJC8sIFwiXCIpIDogdW5kZWZpbmVkO1xuICByZXR1cm4geyBhdXRob3IsIGJvb2tfdHlwZSB9O1xufVxuXG5mdW5jdGlvbiBmb3JtYXRBdXRob3JGaWVsZChhdXRob3I6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgaWYgKCFhdXRob3IpIHJldHVybiAnXCJbW1Vua25vd24gQXV0aG9yXV1cIic7XG4gIGlmIChBcnJheS5pc0FycmF5KGF1dGhvcikpIHtcbiAgICByZXR1cm4gXCJcXG4gIC0gXCIgKyBhdXRob3JcbiAgICAgIC5tYXAoYSA9PiBhLnJlcGxhY2UoL15cXFtcXFt8XFxdXFxdJC9nLCBcIlwiKSlcbiAgICAgIC5tYXAoYSA9PiBgW1ske2F9XV1gKVxuICAgICAgLmpvaW4oXCJcXG4gIC0gXCIpO1xuICB9XG4gIGNvbnN0IGNsZWFuID0gYXV0aG9yLnJlcGxhY2UoL15cXFtcXFt8XFxdXFxdJC9nLCBcIlwiKTtcbiAgcmV0dXJuIGAgXCJbWyR7Y2xlYW59XV1cImA7XG59XG5cbi8qKiBDb3JlOiBjcmVhdGUvdXBkYXRlIHRoZSBpbmRleCBmaWxlIGZvciBhIHNpbmdsZSBmb2xkZXIuIFJldHVybnMgdHJ1ZSBpZiBjcmVhdGVkL3VwZGF0ZWQsIGZhbHNlIGlmIHNraXBwZWQuICovXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVPclVwZGF0ZUluZGV4Rm9yRm9sZGVyKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzLCBmb2xkZXI6IFRGb2xkZXIsIGlzQm9vazogYm9vbGVhbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBjb25zdCBmaWxlcyA9IGxpc3RNYXJrZG93bkZpbGVzKGZvbGRlcik7XG4gIGlmICghZmlsZXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gVHJ5IHRvIHBpY2sgYXV0aG9yL2Jvb2tfdHlwZSBmcm9tIHRoZSBmaXJzdCBmaWxlIHRoYXQgaGFzIGl0XG4gIGxldCBhdXRob3I6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBsZXQgYm9va1R5cGU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgZm9yIChjb25zdCBmIG9mIGZpbGVzKSB7XG4gICAgY29uc3QgbWV0YSA9IGZyb250bWF0dGVyQXV0aG9yRnJvbUZpbGUoYXBwLCBmKTtcbiAgICBpZiAobWV0YS5hdXRob3IpIHsgYXV0aG9yID0gbWV0YS5hdXRob3I7IGJvb2tUeXBlID0gbWV0YS5ib29rX3R5cGU7IGJyZWFrOyB9XG4gIH1cblxuICBjb25zdCBmb2xkZXJOYW1lID0gZm9sZGVyLm5hbWU7XG4gIGNvbnN0IGlkeE5hbWUgPSBzZXR0aW5ncy5pbmRleEZpbGVOYW1lTW9kZSA9PT0gXCJhcnRpY2xlLXN0eWxlXCIgPyBhcnRpY2xlU3R5bGUoZm9sZGVyTmFtZSkgOiBmb2xkZXJOYW1lO1xuICBjb25zdCBpbmRleFBhdGggPSBub3JtYWxpemVQYXRoKGZvbGRlci5wYXRoICsgXCIvXCIgKyBpZHhOYW1lICsgXCIubWRcIik7XG4gIGNvbnN0IGNyZWF0ZWQgPSBub3dTdGFtcCgpO1xuXG4gIHZhciBwcm9wczogc3RyaW5nO1xuICBpZiAoaXNCb29rKSB7XG4gICAgcHJvcHMgPSBbXG4gICAgICBgdGl0bGU6ICR7aWR4TmFtZX1gLFxuICAgICAgYGNyZWF0ZWQ6ICR7Y3JlYXRlZH1gLFxuICAgICAgYG1vZGlmaWVkOiAke2NyZWF0ZWR9YCxcbiAgICAgIGBib29rX3RpdGxlOiBcIltbJHtmb2xkZXJOYW1lfV1dXCJgLFxuICAgICAgLi4uKGJvb2tUeXBlID8gW2Bib29rX3R5cGU6IFwiW1ske3N0cmlwV2lraWxpbmtzKGJvb2tUeXBlKX1dXVwiYF0gOiBbXSksXG4gICAgICBgdHlwZTogXCJbW0Jvb2tdXVwiYCxcbiAgICAgIGBhdXRob3I6ICR7Zm9ybWF0QXV0aG9yRmllbGQoYXV0aG9yKX1gXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9IGVsc2Uge1xuICAgIHByb3BzID0gW1xuICAgICAgYHRpdGxlOiAke2lkeE5hbWV9YCxcbiAgICAgIGBjcmVhdGVkOiAke2NyZWF0ZWR9YCxcbiAgICAgIGBtb2RpZmllZDogJHtjcmVhdGVkfWAsXG4gICAgICBgdG9waWNzOiBcIltbJHtzdHJpcFdpa2lsaW5rcyhmb2xkZXJOYW1lKX1dXVwiYFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IGRhdGF2aWV3ID0gW1xuICAgIFwiYGBgZGF0YXZpZXdcIixcbiAgICBcIlRBQkxFXCIsXG4gICAgJ2Zyb20gXCJcIicsXG4gICAgXCJ3aGVyZSBjb250YWlucyhmaWxlLmZvbGRlciwgdGhpcy5maWxlLmZvbGRlcikgYW5kIGZpbGUubmFtZSAhPSB0aGlzLmZpbGUubmFtZVwiLFxuICAgIFwiU09SVCBudW1iZXIoZmlsZS5uYW1lKSBBU0NcIixcbiAgICBcImBgYFwiLFxuICAgIFwiXCJcbiAgXS5qb2luKFwiXFxuXCIpO1xuXG4gIGNvbnN0IGhlYWRlciA9IGAtLS1cXG4ke3Byb3BzfVxcbi0tLVxcblxcbiMgJHtpZHhOYW1lfVxcbmA7XG4gIGNvbnN0IGNvbnRlbnQgPSBoZWFkZXIgKyBkYXRhdmlldztcblxuICBjb25zdCBleGlzdGluZyA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoaW5kZXhQYXRoKTtcbiAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICBjb25zdCBjdXIgPSBhd2FpdCBhcHAudmF1bHQucmVhZChleGlzdGluZyk7XG4gICAgaWYgKC9gYGBkYXRhdmlldy8udGVzdChjdXIpKSByZXR1cm4gZmFsc2U7IC8vIGFscmVhZHkgaGFzIGEgZGF0YXZpZXcgYmxvY2sgXHUyMDE0IHNraXBcblxuICAgIC8vIEluc2VydCBkYXRhdmlldyByaWdodCBhZnRlciBmcm9udG1hdHRlciBpZiBwcmVzZW50XG4gICAgY29uc3QgcGFydHMgPSBjdXIuc3BsaXQoXCItLS1cIik7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA+PSAzKSB7XG4gICAgICBjb25zdCBtZXJnZWQgPSBwYXJ0c1swXSArIFwiLS0tXCIgKyBwYXJ0c1sxXSArIFwiLS0tXFxuXCIgKyBkYXRhdmlldyArIHBhcnRzLnNsaWNlKDIpLmpvaW4oXCItLS1cIik7XG4gICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGV4aXN0aW5nLCBtZXJnZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGV4aXN0aW5nLCBjdXIgKyBcIlxcblwiICsgZGF0YXZpZXcpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICBhd2FpdCBhcHAudmF1bHQuY3JlYXRlKGluZGV4UGF0aCwgY29udGVudCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuLyoqIEV4aXN0aW5nIGNvbW1hbmQ6IGFkZCBpbmRleGVzIGZvciBhbGwgbGVhZiBmb2xkZXJzIHVuZGVyIGEgYmFzZSBmb2xkZXIgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kQWRkRm9sZGVySW5kZXgoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MsIHBhcmFtcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pIHtcbiAgY29uc3QgYmFzZUZvbGRlciA9IHBhcmFtcz8uZm9sZGVyID8/IHNldHRpbmdzLmJhc2VGb2xkZXI7XG4gIGNvbnN0IGZvbGRlcnMgPSBnZXRMZWFmRm9sZGVyc1VuZGVyKGFwcCwgYmFzZUZvbGRlcik7XG4gIGlmICghZm9sZGVycy5sZW5ndGgpIHsgbmV3IE5vdGljZShgTm8gbGVhZiBmb2xkZXJzIHVuZGVyICR7YmFzZUZvbGRlcn1gKTsgcmV0dXJuOyB9XG5cbiAgbGV0IGNoYW5nZWQgPSAwO1xuICBmb3IgKGNvbnN0IGZvbGRlciBvZiBmb2xkZXJzKSB7XG4gICAgY29uc3QgZGlkID0gYXdhaXQgY3JlYXRlT3JVcGRhdGVJbmRleEZvckZvbGRlcihhcHAsIHNldHRpbmdzLCBmb2xkZXIsIHRydWUpO1xuICAgIGlmIChkaWQpIGNoYW5nZWQrKztcbiAgfVxuXG4gIG5ldyBOb3RpY2UoY2hhbmdlZCA+IDAgPyBgRm9sZGVyIGluZGV4ZXMgY3JlYXRlZC91cGRhdGVkOiAke2NoYW5nZWR9YCA6IFwiTm8gY2hhbmdlczsgaW5kZXhlcyBhbHJlYWR5IHByZXNlbnQuXCIpO1xufVxuXG4vKiogTkVXIGNvbW1hbmQ6IGFkZC91cGRhdGUgaW5kZXggT05MWSBmb3IgdGhlIGZvbGRlciBvZiB0aGUgY3VycmVudCBmaWxlICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZEFkZEluZGV4Rm9yQ3VycmVudEZvbGRlcihhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuICBjb25zdCBhY3RpdmUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgY29uc3QgZm9sZGVyID0gYWN0aXZlPy5wYXJlbnQ7XG4gIGlmICghYWN0aXZlIHx8ICFmb2xkZXIpIHsgbmV3IE5vdGljZShcIk9wZW4gYSBmaWxlIGluc2lkZSB0aGUgdGFyZ2V0IGZvbGRlci5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IGRpZCA9IGF3YWl0IGNyZWF0ZU9yVXBkYXRlSW5kZXhGb3JGb2xkZXIoYXBwLCBzZXR0aW5ncywgZm9sZGVyLCBmYWxzZSk7XG4gIG5ldyBOb3RpY2UoZGlkID8gYEluZGV4IGNyZWF0ZWQvdXBkYXRlZCBmb3IgXHUyMDFDJHtmb2xkZXIubmFtZX1cdTIwMUQuYCA6IGBObyBpbmRleCBjaGFuZ2UgaW4gXHUyMDFDJHtmb2xkZXIubmFtZX1cdTIwMUQuYCk7XG59IiwgImV4cG9ydCBmdW5jdGlvbiBhcnRpY2xlU3R5bGUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKG5hbWUuZW5kc1dpdGgoXCIsIFRoZVwiKSkgcmV0dXJuIGBUaGUgJHtuYW1lLnNsaWNlKDAsIC01KX1gO1xuICBpZiAobmFtZS5lbmRzV2l0aChcIiwgQVwiKSkgICByZXR1cm4gYEEgJHtuYW1lLnNsaWNlKDAsIC0zKX1gO1xuICByZXR1cm4gbmFtZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vd1N0YW1wKCk6IHN0cmluZyB7XG4gIGNvbnN0IGQgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCB3ZWVrZGF5ID0gZC50b0xvY2FsZURhdGVTdHJpbmcodW5kZWZpbmVkLCB7IHdlZWtkYXk6IFwic2hvcnRcIiB9KTtcbiAgY29uc3QgZGF5ID0gU3RyaW5nKGQuZ2V0RGF0ZSgpKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gIGNvbnN0IG1vbnRoID0gZC50b0xvY2FsZURhdGVTdHJpbmcodW5kZWZpbmVkLCB7IG1vbnRoOiBcImxvbmdcIiB9KTtcbiAgY29uc3QgeWVhciA9IGQuZ2V0RnVsbFllYXIoKTtcbiAgY29uc3QgdGltZSA9IGQudG9Mb2NhbGVUaW1lU3RyaW5nKHVuZGVmaW5lZCwgeyBob3VyMTI6IGZhbHNlIH0pO1xuICByZXR1cm4gYCR7d2Vla2RheX0sICR7ZGF5fS4gJHttb250aH0gJHt5ZWFyfSwgJHt0aW1lfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnN1cmVOZXdsaW5lKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzLmVuZHNXaXRoKFwiXFxuXCIpID8gcyA6IHMgKyBcIlxcblwiO1xufVxuIiwgImltcG9ydCB0eXBlIE9ic2lkaWFuQmlibGVUb29scyBmcm9tIFwiLi9tYWluXCI7XG5pbXBvcnQgeyBjb21tYW5kVmVyc2VMaW5rcyB9IGZyb20gXCIuL2NvbW1hbmRzL3ZlcnNlTGlua3NcIjtcbmltcG9ydCB7IGNvbW1hbmRBZGROZXh0UHJldmlvdXMgfSBmcm9tIFwiLi9jb21tYW5kcy9hZGROZXh0UHJldmlvdXNcIjtcbmltcG9ydCB7IGNvbW1hbmRBZGRGb2xkZXJJbmRleCB9IGZyb20gXCIuL2NvbW1hbmRzL2FkZEZvbGRlckluZGV4XCI7XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclByb3RvY29sKHBsdWdpbjogT2JzaWRpYW5CaWJsZVRvb2xzKSB7XG4gIHBsdWdpbi5yZWdpc3Rlck9ic2lkaWFuUHJvdG9jb2xIYW5kbGVyKFwib2JzaWRpYW4tYmlibGUtdG9vbHNcIiwgYXN5bmMgKHBhcmFtcykgPT4ge1xuICAgIGNvbnN0IGFjdGlvbiA9IHBhcmFtcy5hY3Rpb24gPz8gXCJcIjtcbiAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgY2FzZSBcImxpbmstdmVyc2VzXCI6XG4gICAgICAgIGF3YWl0IGNvbW1hbmRWZXJzZUxpbmtzKHBsdWdpbi5hcHAsIHBsdWdpbi5zZXR0aW5ncywgcGFyYW1zKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiYWRkLW5leHQtcHJldmlvdXNcIjpcbiAgICAgICAgYXdhaXQgY29tbWFuZEFkZE5leHRQcmV2aW91cyhwbHVnaW4uYXBwLCBwbHVnaW4uc2V0dGluZ3MsIHBhcmFtcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFkZC1mb2xkZXItaW5kZXhcIjpcbiAgICAgICAgYXdhaXQgY29tbWFuZEFkZEZvbGRlckluZGV4KHBsdWdpbi5hcHAsIHBsdWdpbi5zZXR0aW5ncywgcGFyYW1zKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH0pO1xufVxuIiwgImltcG9ydCB0eXBlIHsgYWRkSWNvbiBhcyBBZGRJY29uRm4gfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuY29uc3QgSUNPTlM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIFwib2J0Yi1ib29rXCI6IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI+PHBhdGggZD1cIk02IDRoMTBhMiAyIDAgMCAxIDIgMnYxMi41YTEuNSAxLjUgMCAwIDAtMS41LTEuNUg2YTIgMiAwIDAgMCAwIDRoMTBcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIvPjwvc3ZnPmAsXG4gIFwib2J0Yi1saW5rc1wiOiBgPHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiPjxwYXRoIGQ9XCJNMTAgMTNhNSA1IDAgMCAxIDAtN2wxLTFhNSA1IDAgMCAxIDcgN2wtMSAxTTE0IDExYTUgNSAwIDAgMSAwIDdsLTEgMWE1IDUgMCAwIDEtNy03bDEtMVwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIi8+PC9zdmc+YCxcbiAgXCJvYnRiLWhpZ2hsaWdodGVyXCI6IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj48cGF0aCBkPVwiTTMgMTZsNi02IDUgNS02IDZIM3pcIiBmaWxsPVwiY3VycmVudENvbG9yXCIvPjxwYXRoIGQ9XCJNMTIgOWwzLTMgMyAzLTMgM3pcIiBmaWxsPVwiY3VycmVudENvbG9yXCIvPjwvc3ZnPmAsXG4gIFwib2J0Yi1zdW1tYXJ5XCI6IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj48cGF0aCBkPVwiTTUgNWgxNE01IDloMTBNNSAxM2g4TTUgMTdoNlwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgZmlsbD1cIm5vbmVcIi8+PC9zdmc+YCxcbiAgXCJvYnRiLW91dGxpbmVcIjogYDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiPjxwYXRoIGQ9XCJNNyA2aDEwTTcgMTJoMTBNNyAxOGg2XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBmaWxsPVwibm9uZVwiLz48L3N2Zz5gLFxuICBcIm9idGItZm9ybWF0dGVyXCI6IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj48cGF0aCBkPVwiTTUgN2g2TTUgMTJoMTBNNSAxN2g4XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBmaWxsPVwibm9uZVwiLz48L3N2Zz5gLFxuICBcIm9idGItYmlibGVcIjogYDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiPjxwYXRoIGQ9XCJNNi41IDRoOUEyLjUgMi41IDAgMCAxIDE4IDYuNVYyMEg4LjVBMi41IDIuNSAwIDAgMSA2IDE3LjVWNC41XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIvPjxwYXRoIGQ9XCJNMTAgOGg2TTEwIDExaDZcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIvPjwvc3ZnPmBcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3Rlckljb25zKGFkZEljb246IHR5cGVvZiBBZGRJY29uRm4pIHtcbiAgZm9yIChjb25zdCBbbmFtZSwgc3ZnXSBvZiBPYmplY3QuZW50cmllcyhJQ09OUykpIGFkZEljb24obmFtZSwgc3ZnKTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE5vdGljZSwgVEZvbGRlciB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBsaXN0TWFya2Rvd25GaWxlcyB9IGZyb20gXCIuLi9saWIvbWRVdGlsc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZEV4dHJhY3RIaWdobGlnaHRzRm9sZGVyKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IHZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgY29uc3Qgc3RhcnRGb2xkZXIgPSB2aWV3Py5wYXJlbnQgPz8gYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aChzZXR0aW5ncy5iYXNlRm9sZGVyKTtcbiAgaWYgKCEoc3RhcnRGb2xkZXIgaW5zdGFuY2VvZiBURm9sZGVyKSkgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgaW4gdGhlIHRhcmdldCBmb2xkZXIgb3Igc2V0IGEgdmFsaWQgYmFzZSBmb2xkZXIuXCIpOyByZXR1cm47IH1cblxuICBjb25zdCBhbGw6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgbWFya1JlZ2V4ID0gbmV3IFJlZ0V4cChgPG1hcmtcXFxccytzdHlsZT1bXCInXSR7c2V0dGluZ3MucmVkTWFya0Nzcy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxcXF1cXFxcXFxcXF0vZywgXCJcXFxcJCZcIil9W1wiJ10+KC4qPyk8L21hcms+YCwgXCJnXCIpO1xuXG4gIGNvbnN0IGZpbGVzID0gbGlzdE1hcmtkb3duRmlsZXMoc3RhcnRGb2xkZXIpLnNvcnQoKGEsYikgPT4ge1xuICAgIGNvbnN0IGFuID0gYS5iYXNlbmFtZS5tYXRjaCgvXlxcZCsvKT8uWzBdOyBjb25zdCBibiA9IGIuYmFzZW5hbWUubWF0Y2goL15cXGQrLyk/LlswXTtcbiAgICBpZiAoYW4gJiYgYm4pIHJldHVybiBOdW1iZXIoYW4pIC0gTnVtYmVyKGJuKTtcbiAgICBpZiAoYW4pIHJldHVybiAtMTtcbiAgICBpZiAoYm4pIHJldHVybiAxO1xuICAgIHJldHVybiBhLmJhc2VuYW1lLmxvY2FsZUNvbXBhcmUoYi5iYXNlbmFtZSk7XG4gIH0pO1xuXG4gIGZvciAoY29uc3QgZiBvZiBmaWxlcykge1xuICAgIGNvbnN0IHNyYyA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGYpO1xuICAgIGNvbnN0IGxvY2FsOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICAgIG1hcmtSZWdleC5sYXN0SW5kZXggPSAwO1xuICAgIHdoaWxlICgobSA9IG1hcmtSZWdleC5leGVjKHNyYykpICE9PSBudWxsKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gbVsxXS50cmltKCk7XG4gICAgICBpZiAoIXRleHQpIGNvbnRpbnVlO1xuICAgICAgaWYgKCFzZWVuLmhhcyh0ZXh0KSkgeyBzZWVuLmFkZCh0ZXh0KTsgaWYgKCFsb2NhbC5pbmNsdWRlcyh0ZXh0KSkgbG9jYWwucHVzaCh0ZXh0KTsgfVxuICAgIH1cbiAgICBpZiAobG9jYWwubGVuZ3RoKSB7XG4gICAgICBhbGwucHVzaChgXFxuIyMjIyBbWyR7Zi5iYXNlbmFtZX1dXVxcbmAgKyBsb2NhbC5tYXAodCA9PiBgLSAke3R9YCkuam9pbihcIlxcblwiKSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFhbGwubGVuZ3RoKSB7IG5ldyBOb3RpY2UoXCJObyBoaWdobGlnaHRzIGZvdW5kIGluIGZvbGRlci5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IG91dCA9IGFsbC5qb2luKFwiXFxuXCIpO1xuICBjb25zdCB0YXJnZXQgPSBzdGFydEZvbGRlci5wYXRoICsgXCIvSGlnaGxpZ2h0cy5tZFwiO1xuICBjb25zdCBleGlzdGluZyA9IGFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKHRhcmdldCk7XG4gIGlmIChleGlzdGluZykgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShleGlzdGluZywgb3V0KTtcbiAgZWxzZSBhd2FpdCBhcHAudmF1bHQuY3JlYXRlKHRhcmdldCwgb3V0KTtcbiAgbmV3IE5vdGljZShcIkhpZ2hsaWdodHMubWQgY3JlYXRlZC5cIik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgaW5zZXJ0QWZ0ZXJZYW1sT3JIMSB9IGZyb20gXCIuLi9saWIvbWRVdGlsc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZEV4dHJhY3RSZWRIaWdobGlnaHRzKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgaWYgKCFmaWxlKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7IHJldHVybjsgfVxuICBjb25zdCBzcmMgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcblxuICBjb25zdCBtYXJrUmVnZXggPSBuZXcgUmVnRXhwKGA8bWFya1xcXFxzK3N0eWxlPVtcIiddJHtzZXR0aW5ncy5yZWRNYXJrQ3NzLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXFxcXVxcXFxcXFxcXS9nLCBcIlxcXFwkJlwiKX1bXCInXT4oLio/KTwvbWFyaz5gLCBcImdcIik7XG4gIGNvbnN0IGhpdHM6IHN0cmluZ1tdID0gW107XG4gIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICB3aGlsZSAoKG0gPSBtYXJrUmVnZXguZXhlYyhzcmMpKSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHRleHQgPSBtWzFdLnRyaW0oKTtcbiAgICBpZiAodGV4dCAmJiAhaGl0cy5pbmNsdWRlcyh0ZXh0KSkgaGl0cy5wdXNoKHRleHQpO1xuICB9XG5cbiAgaWYgKCFoaXRzLmxlbmd0aCkgeyBuZXcgTm90aWNlKFwiTm8gcmVkIGhpZ2hsaWdodHMgZm91bmQuXCIpOyByZXR1cm47IH1cblxuICBjb25zdCBzZWN0aW9uID0gW1xuICAgIFwiPiBbIXN1bW1hcnldLSBIaWdobGlnaHRzXCIsXG4gICAgLi4uaGl0cy5tYXAoaCA9PiBgPiAtICR7aH1gKSxcbiAgICBcIlwiXG4gIF0uam9pbihcIlxcblwiKTtcblxuICBjb25zdCBtZXJnZWQgPSBpbnNlcnRBZnRlcllhbWxPckgxKHNyYywgc2VjdGlvbik7XG4gIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgbWVyZ2VkKTtcbiAgbmV3IE5vdGljZShcIkhpZ2hsaWdodHMgc2VjdGlvbiBpbnNlcnRlZC5cIik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZE91dGxpbmVFeHRyYWN0b3IoYXBwOiBBcHAsIF9zZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgaWYgKCFmaWxlKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IG9yaWdpbmFsID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIGNvbnN0IGxpbmVzID0gb3JpZ2luYWwuc3BsaXQoL1xccj9cXG4vKTtcblxuICBjb25zdCBvdXRsaW5lTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgLy8gRVhBQ1QgcmVnZXggYXMgUHl0aG9uOiBvbmUgc3BhY2UgYWZ0ZXIgdGhlIGhhc2hlc1xuICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBtID0gbGluZS5tYXRjaCgvXigjezIsNn0pICguKykvKTtcbiAgICBpZiAobSkge1xuICAgICAgY29uc3QgaGFzaGVzID0gbVsxXTtcbiAgICAgIGxldCBjb250ZW50ID0gbVsyXTtcbiAgICAgIGNvbnN0IGxldmVsID0gaGFzaGVzLmxlbmd0aCAtIDI7IC8vICMjIC0+IDAsICMjIyAtPiAxLCBldGMuXG4gICAgICBjb25zdCBpbmRlbnQgPSBcIlxcdFwiLnJlcGVhdChNYXRoLm1heCgwLCBsZXZlbCAtIDEpKTtcbiAgICAgIGlmIChsZXZlbCA9PT0gMCkgY29udGVudCA9IGAqKiR7Y29udGVudH0qKmA7XG4gICAgICBvdXRsaW5lTGluZXMucHVzaChgJHtpbmRlbnR9JHtjb250ZW50fWApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChvdXRsaW5lTGluZXMubGVuZ3RoID09PSAwKSB7XG4gICAgbmV3IE5vdGljZShcIk5vIGhlYWRpbmdzICgjIy4uIyMjIyMjKSBmb3VuZC5cIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gQ2hlY2sgbGFzdCA0IGxpbmVzIGZvciBcInxOZXh0XV1cIiBvciBcInxQcmV2aW91c11dXCJcbiAgbGV0IGluc2VydEluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgY29uc3QgbG9va2JhY2sgPSBNYXRoLm1pbig0LCBsaW5lcy5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMTsgaSA8PSBsb29rYmFjazsgaSsrKSB7XG4gICAgY29uc3QgbG4gPSBsaW5lc1tsaW5lcy5sZW5ndGggLSBpXTtcbiAgICBpZiAoL1xcfE5leHRcXF1cXF18XFx8UHJldmlvdXNcXF1cXF0vLnRlc3QobG4pKSB7XG4gICAgICBpbnNlcnRJbmRleCA9IGxpbmVzLmxlbmd0aCAtIGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBjb25zdCBvdXRsaW5lVGV4dCA9IFwiIyMgT3V0bGluZVxcblwiICsgb3V0bGluZUxpbmVzLmpvaW4oXCJcXG5cIikgKyBcIlxcblxcblwiO1xuXG4gIGlmIChpbnNlcnRJbmRleCAhPT0gbnVsbCkge1xuICAgIC8vIEluc2VydCBiZWZvcmUgdGhlIGZvdW5kIGxpbmUsIHByZXNlcnZpbmcgc3Vycm91bmRpbmcgbmV3bGluZXNcbiAgICBjb25zdCBiZWZvcmVTdHIgPSBsaW5lcy5zbGljZSgwLCBpbnNlcnRJbmRleCkuam9pbihcIlxcblwiKTtcbiAgICBjb25zdCBhZnRlclN0ciA9IGxpbmVzLnNsaWNlKGluc2VydEluZGV4KS5qb2luKFwiXFxuXCIpO1xuICAgIGNvbnN0IG5ld0NvbnRlbnQgPVxuICAgICAgKGJlZm9yZVN0ci5lbmRzV2l0aChcIlxcblwiKSB8fCBiZWZvcmVTdHIubGVuZ3RoID09PSAwID8gXCJcIiA6IFwiXFxuXCIpICtcbiAgICAgIG91dGxpbmVUZXh0ICtcbiAgICAgIGFmdGVyU3RyO1xuICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgYmVmb3JlU3RyICsgbmV3Q29udGVudCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gQXBwZW5kIHRvIGVuZCAobGlrZSBQeXRob24gJ2EnIG1vZGUpXG4gICAgY29uc3QgbmV3Q29udGVudCA9IG9yaWdpbmFsICsgKG9yaWdpbmFsLmVuZHNXaXRoKFwiXFxuXCIpID8gXCJcIiA6IFwiXFxuXCIpICsgb3V0bGluZVRleHQ7XG4gICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBuZXdDb250ZW50KTtcbiAgfVxuXG4gIG5ldyBOb3RpY2UoXCJPdXRsaW5lIGFwcGVuZGVkIHN1Y2Nlc3NmdWxseS5cIik7XG59IiwgImltcG9ydCB7IEFwcCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZvcm1hdE91dGxpbmVUZXh0IH0gZnJvbSBcIi4uL2xpYi9vdXRsaW5lVXRpbHNcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbW1hbmRPdXRsaW5lRm9ybWF0dGVyKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgaWYgKCFmaWxlKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IHNyYyA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuXG4gIGNvbnN0IG91dCA9IGF3YWl0IGZvcm1hdE91dGxpbmVUZXh0KHNyYywge1xuICAgIHNwbGl0SW5saW5lU3VicG9pbnRzOiB0cnVlLCAgIC8vIHNwbGl0cyBcIi4uLiB2LiA5OiBhLiAuLi4gYi4gLi4uXCIsIGJ1dCBOT1Qgb24gXCIuXCJcbiAgICBmaXhIeXBoZW5hdGVkQnJlYWtzOiB0cnVlLCAgICAvLyBmaXhlcyBcImlsbHVzLSB0cmF0ZWRcIiBcdTIxOTIgXCJpbGx1c3RyYXRlZFwiXG4gICAgZHJvcFB1cmVQYWdlTnVtYmVyTGluZXM6IHRydWUgLy8gb3B0aW9uYWw6IGRyb3BzIFwiMTRcIiwgXCIxNVwiLCBcIjE2XCJcbiAgfSwgc2V0dGluZ3MpO1xuXG4gIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgb3V0KTtcbiAgbmV3IE5vdGljZShcIk91dGxpbmUgZm9ybWF0dGVkLlwiKTtcbn0iLCAiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBsaW5rVmVyc2VzSW5UZXh0IH0gZnJvbSBcInNyYy9jb21tYW5kcy92ZXJzZUxpbmtzXCI7XG5pbXBvcnQgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwic3JjL3NldHRpbmdzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3V0bGluZUZvcm1hdE9wdGlvbnMge1xuICBzcGxpdElubGluZVN1YnBvaW50cz86IGJvb2xlYW47ICAgICAgIC8vIGRlZmF1bHQ6IHRydWVcbiAgZml4SHlwaGVuYXRlZEJyZWFrcz86IGJvb2xlYW47ICAgICAgICAvLyBkZWZhdWx0OiB0cnVlXG4gIGRyb3BQdXJlUGFnZU51bWJlckxpbmVzPzogYm9vbGVhbjsgICAgLy8gZGVmYXVsdDogZmFsc2VcbiAgb3V0cHV0TGluZVNlcGFyYXRvcj86IHN0cmluZzsgICAgICAgICAvLyBkZWZhdWx0OiBcIlxcblwiXG59XG5cbi8qKiAtLS0tLSBIZWxwZXJzIChkZWxpbWl0ZXItYXdhcmUgKyBQeXRob24gcGFyaXR5KSAtLS0tLSAqL1xuXG5mdW5jdGlvbiByb21hblRvSW50KHJvbWFuOiBzdHJpbmcpOiBudW1iZXIge1xuICBjb25zdCBtYXA6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7IEk6MSwgVjo1LCBYOjEwLCBMOjUwLCBDOjEwMCwgRDo1MDAsIE06MTAwMCB9O1xuICBsZXQgcmVzdWx0ID0gMCwgcHJldiA9IDA7XG4gIGZvciAobGV0IGkgPSByb21hbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGNvbnN0IHZhbCA9IG1hcFtyb21hbltpXV07XG4gICAgaWYgKCF2YWwpIHJldHVybiBOYU47XG4gICAgcmVzdWx0ICs9IHZhbCA8IHByZXYgPyAtdmFsIDogdmFsO1xuICAgIHByZXYgPSB2YWw7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbmNvbnN0IGlzUm9tYW4gPSAoczogc3RyaW5nKSA9PiAvXltJVlhMQ0RNXSskLy50ZXN0KHMpO1xuY29uc3QgaXNBbHBoYVVwcGVyID0gKHM6IHN0cmluZykgPT4gL15bQS1aXSQvLnRlc3Qocyk7XG5cbmZ1bmN0aW9uIGdldE1kUHJlZml4RnJvbUxldmVsKGxldmVsOiBudW1iZXIgfCBcImJ1bGxldFwiKTogc3RyaW5nIHtcbiAgc3dpdGNoIChsZXZlbCkge1xuICAgIGNhc2UgMjogcmV0dXJuIFwiIyNcIjsgICAgICAvLyBSb21hblxuICAgIGNhc2UgMzogcmV0dXJuIFwiIyMjXCI7ICAgICAvLyBBLlxuICAgIGNhc2UgNDogcmV0dXJuIFwiIyMjI1wiOyAgICAvLyAxLlxuICAgIGNhc2UgNTogcmV0dXJuIFwiIyMjIyNcIjsgICAvLyBhLlxuICAgIGNhc2UgNjogcmV0dXJuIFwiIyMjIyMjXCI7ICAvLyAoMSkgb3IgMSlcbiAgICBkZWZhdWx0OiByZXR1cm4gXCIjIyMjIyNcIjsgLy8gYnVsbGV0IGZhbGxiYWNrXG4gIH1cbn1cblxuLyoqIFRva2VuaXplIGEgaGVhZGluZyBtYXJrZXIgYW5kIGl0cyByZXN0LiBDYXB0dXJlcyBkZWxpbWl0ZXI6IFwiLlwiLCBcIilcIiwgb3IgXCIuKVwiICovXG5mdW5jdGlvbiBwYXJzZUhlYWRpbmdTdGFydChzOiBzdHJpbmcpOiB7IHRva2VuOiBzdHJpbmc7IGxhYmVsOiBzdHJpbmc7IHJlc3Q6IHN0cmluZzsgZGVsaW06IHN0cmluZyB8IG51bGwgfSB8IG51bGwge1xuICBjb25zdCBtID1cbiAgICBzLm1hdGNoKC9eXFxzKig/PHJvbWFuPltJVlhMQ0RNXSspKD88ZGVsaW0+XFwuXFwpfFsuKV0pXFxzKyg/PHJlc3Q+LispJC8pIHx8XG4gICAgcy5tYXRjaCgvXlxccyooPzx1cHBlcj5bQS1aXSkoPzxkZWxpbT5cXC5cXCl8Wy4pXSlcXHMrKD88cmVzdD4uKykkLykgICAgICB8fFxuICAgIHMubWF0Y2goL15cXHMqKD88bnVtPlxcZCspKD88ZGVsaW0+XFwuXFwpfFsuKV0pXFxzKyg/PHJlc3Q+LispJC8pICAgICAgICAgIHx8XG4gICAgcy5tYXRjaCgvXlxccypcXChcXHMqKD88cG51bT5cXGQrKVxccypcXClcXHMrKD88cmVzdD4uKykkLykgICAgICAgICAgICAgICAgICB8fFxuICAgIHMubWF0Y2goL15cXHMqXFwoXFxzKig/PHBsb3c+W2Etel0pXFxzKlxcKVxccysoPzxyZXN0Pi4rKSQvKSAgICAgICAgICAgICAgICB8fFxuICAgIHMubWF0Y2goL15cXHMqKD88bG93PlthLXpdKSg/PGRlbGltPlxcLlxcKXxbLildKVxccysoPzxyZXN0Pi4rKSQvKTtcblxuICBpZiAoIW0pIHJldHVybiBudWxsO1xuICBjb25zdCBnID0gKG0gYXMgYW55KS5ncm91cHMgfHwge307XG4gIGxldCBsYWJlbCA9IFwiXCI7XG4gIGxldCBkZWxpbTogc3RyaW5nIHwgbnVsbCA9IGcuZGVsaW0gPz8gbnVsbDtcblxuICBpZiAoZy5yb21hbikgbGFiZWwgPSBnLnJvbWFuO1xuICBlbHNlIGlmIChnLnVwcGVyKSBsYWJlbCA9IGcudXBwZXI7XG4gIGVsc2UgaWYgKGcubnVtKSBsYWJlbCA9IGcubnVtO1xuICBlbHNlIGlmIChnLnBudW0pIHsgbGFiZWwgPSBgKCR7Zy5wbnVtfSlgOyBkZWxpbSA9IFwiKVwiOyB9XG4gIGVsc2UgaWYgKGcucGxvdykgeyBsYWJlbCA9IGAoJHtnLnBsb3d9KWA7IGRlbGltID0gXCIpXCI7IH1cbiAgZWxzZSBpZiAoZy5sb3cpIGxhYmVsID0gZy5sb3c7XG5cbiAgbGV0IHRva2VuID0gXCJcIjtcbiAgaWYgKGcucm9tYW4pIHRva2VuID0gYCR7Zy5yb21hbn0ke2RlbGltID8/IFwiLlwifWA7XG4gIGVsc2UgaWYgKGcudXBwZXIpIHRva2VuID0gYCR7Zy51cHBlcn0ke2RlbGltID8/IFwiLlwifWA7XG4gIGVsc2UgaWYgKGcubnVtKSB0b2tlbiA9IGAke2cubnVtfSR7ZGVsaW0gPz8gXCIuXCJ9YDtcbiAgZWxzZSBpZiAoZy5wbnVtKSB0b2tlbiA9IGAoJHtnLnBudW19KWA7XG4gIGVsc2UgaWYgKGcucGxvdykgdG9rZW4gPSBgKCR7Zy5wbG93fSlgO1xuICBlbHNlIGlmIChnLmxvdykgdG9rZW4gPSBgJHtnLmxvd30ke2RlbGltID8/IFwiLlwifWA7XG5cbiAgcmV0dXJuIHsgdG9rZW4sIGxhYmVsLCByZXN0OiBnLnJlc3QgfHwgXCJcIiwgZGVsaW0gfTtcbn1cblxuLyoqIERlY2lkZSBsZXZlbCB1c2luZyBkZWxpbWl0ZXIsIHBsdXMgUm9tYW4vQWxwaGEgaGV1cmlzdGljcyAobGlrZSBQeXRob24pICovXG5mdW5jdGlvbiBkZWNpZGVMZXZlbChcbiAgbGFiZWw6IHN0cmluZyxcbiAgZGVsaW06IHN0cmluZyB8IG51bGwsXG4gIHByZXZSb206IHN0cmluZyB8IG51bGwsXG4gIHByZXZBbHBoYUlkeDogbnVtYmVyIHwgbnVsbFxuKTogeyBsZXZlbDogbnVtYmVyIHwgXCJidWxsZXRcIjsgbmV4dFJvbTogc3RyaW5nIHwgbnVsbDsgbmV4dEFscGhhSWR4OiBudW1iZXIgfCBudWxsIH0ge1xuICBpZiAoL15cXChcXGQrXFwpJC8udGVzdChsYWJlbCkpIHtcbiAgICByZXR1cm4geyBsZXZlbDogNiwgbmV4dFJvbTogcHJldlJvbSwgbmV4dEFscGhhSWR4OiBwcmV2QWxwaGFJZHggfTsgICAgICAgICAvLyAoMSlcbiAgfVxuICBpZiAoL15cXChbYS16XStcXCkkLy50ZXN0KGxhYmVsKSkge1xuICAgIHJldHVybiB7IGxldmVsOiBcImJ1bGxldFwiLCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IHByZXZBbHBoYUlkeCB9OyAgLy8gKGEpXG4gIH1cblxuICAvLyAxKSB2cyAxLiB2cyAxLilcbiAgaWYgKC9eXFxkKyQvLnRlc3QobGFiZWwpKSB7XG4gICAgaWYgKGRlbGltID09PSBcIilcIikge1xuICAgICAgcmV0dXJuIHsgbGV2ZWw6IDYsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogcHJldkFscGhhSWR4IH07ICAgICAgIC8vIDEpXG4gICAgfVxuICAgIHJldHVybiB7IGxldmVsOiA0LCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IHByZXZBbHBoYUlkeCB9OyAgICAgICAgIC8vIDEuIC8gMS4pXG4gIH1cblxuICAvLyBSb21hbiB2cyBBbHBoYSBhbWJpZ3VpdHkgKGUuZy4sIEkuKVxuICBpZiAoaXNSb21hbihsYWJlbCkpIHtcbiAgICBjb25zdCByb21WYWwgPSByb21hblRvSW50KGxhYmVsKTtcbiAgICBjb25zdCBmaXRzUm9tYW4gPSAhcHJldlJvbSB8fCByb21hblRvSW50KHByZXZSb20pICsgMSA9PT0gcm9tVmFsO1xuXG4gICAgY29uc3QgYWxwaGFWYWwgPSBpc0FscGhhVXBwZXIobGFiZWwpID8gKGxhYmVsLmNoYXJDb2RlQXQoMCkgLSA2NCkgOiBudWxsOyAvLyBBPTFcbiAgICBjb25zdCBmaXRzQWxwaGEgPSBwcmV2QWxwaGFJZHggPT0gbnVsbCA/IHRydWUgOiAoYWxwaGFWYWwgIT0gbnVsbCAmJiBhbHBoYVZhbCA9PT0gcHJldkFscGhhSWR4ICsgMSk7XG5cbiAgICBpZiAoZml0c1JvbWFuICYmICFmaXRzQWxwaGEpIHtcbiAgICAgIHJldHVybiB7IGxldmVsOiAyLCBuZXh0Um9tOiBsYWJlbCwgbmV4dEFscGhhSWR4OiBwcmV2QWxwaGFJZHggfTsgICAgICAgICAvLyAjI1xuICAgIH0gZWxzZSBpZiAoZml0c0FscGhhICYmICFmaXRzUm9tYW4pIHtcbiAgICAgIHJldHVybiB7IGxldmVsOiAzLCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IGFscGhhVmFsID8/IDEgfTsgICAgICAvLyAjIyNcbiAgICB9IGVsc2UgaWYgKGZpdHNSb21hbiAmJiBmaXRzQWxwaGEpIHtcbiAgICAgIHJldHVybiB7IGxldmVsOiAzLCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IGFscGhhVmFsID8/IDEgfTsgICAgICAvLyBwcmVmZXIgYWxwaGEgYXMgZGVlcGVyXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7IGxldmVsOiAyLCBuZXh0Um9tOiBsYWJlbCwgbmV4dEFscGhhSWR4OiBwcmV2QWxwaGFJZHggfTsgICAgICAgICAvLyBkZWZhdWx0IHRvIFJvbWFuXG4gICAgfVxuICB9XG5cbiAgLy8gQSkgdnMgQS5cbiAgaWYgKGlzQWxwaGFVcHBlcihsYWJlbCkpIHtcbiAgICByZXR1cm4geyBsZXZlbDogMywgbmV4dFJvbTogcHJldlJvbSwgbmV4dEFscGhhSWR4OiBsYWJlbC5jaGFyQ29kZUF0KDApIC0gNjQgfTsgLy8gIyMjXG4gIH1cblxuICAvLyBhKSB2cyBhLlxuICBpZiAoL15bYS16XSQvLnRlc3QobGFiZWwpKSB7XG4gICAgaWYgKGRlbGltID09PSBcIilcIikge1xuICAgICAgcmV0dXJuIHsgbGV2ZWw6IFwiYnVsbGV0XCIsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogcHJldkFscGhhSWR4IH07ICAgIC8vIGEpXG4gICAgfVxuICAgIHJldHVybiB7IGxldmVsOiA1LCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IHByZXZBbHBoYUlkeCB9OyAgICAgICAgICAgICAvLyBhLlxuICB9XG5cbiAgcmV0dXJuIHsgbGV2ZWw6IFwiYnVsbGV0XCIsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogcHJldkFscGhhSWR4IH07XG59XG5cbi8qKiBIeXBoZW4gYnJlYWsgZml4ZXJzICovXG5jb25zdCBIWVBIID0gYC1cXFxcdTAwQURcXFxcdTIwMTBcXFxcdTIwMTFcXFxcdTIwMTJcXFxcdTIwMTNcXFxcdTIwMTRgOyAvLyAtLCBzb2Z0IGh5cGhlbiwgXHUyMDEwLCAtLCBcdTIwMTIsIFx1MjAxMywgXHUyMDE0XG5jb25zdCBJTkxJTkVfSFlQSEVOX0JSRUFLX1JFID0gbmV3IFJlZ0V4cChgKFtBLVphLXpcdTAwQzAtXHUwMEQ2XHUwMEQ4LVx1MDBGNlx1MDBGOC1cdTAwRkZdKVske0hZUEh9XVxcXFxzKyhbYS16XHUwMEUwLVx1MDBGNlx1MDBGOC1cdTAwRkZdKWAsIFwiZ1wiKTtcbmNvbnN0IFRSQUlMSU5HX0hZUEhFTl9BVF9FTkRfUkUgPSBuZXcgUmVnRXhwKGBbQS1aYS16XHUwMEMwLVx1MDBENlx1MDBEOC1cdTAwRjZcdTAwRjgtXHUwMEZGXVske0hZUEh9XVxcXFxzKiRgKTtcbmZ1bmN0aW9uIGZpeElubGluZUh5cGhlbnMoczogc3RyaW5nKTogc3RyaW5nIHsgcmV0dXJuIHMucmVwbGFjZShJTkxJTkVfSFlQSEVOX0JSRUFLX1JFLCBcIiQxJDJcIik7IH1cbmZ1bmN0aW9uIGFwcGVuZFdpdGhXb3JkQnJlYWtGaXgoYnVmOiBzdHJpbmcsIG5leHQ6IHN0cmluZywgZml4OiBib29sZWFuKTogc3RyaW5nIHtcbiAgaWYgKGZpeCkge1xuICAgIGlmIChUUkFJTElOR19IWVBIRU5fQVRfRU5EX1JFLnRlc3QoYnVmKSAmJiAvXlthLXpcdTAwRTAtXHUwMEY2XHUwMEY4LVx1MDBGRl0vLnRlc3QobmV4dCkpIHtcbiAgICAgIHJldHVybiBidWYucmVwbGFjZShuZXcgUmVnRXhwKGBbJHtIWVBIfV1cXFxccyokYCksIFwiXCIpICsgbmV4dDtcbiAgICB9XG4gICAgY29uc3Qgam9pbmVkID0gKGJ1ZiArIFwiIFwiICsgbmV4dCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG4gICAgcmV0dXJuIGZpeElubGluZUh5cGhlbnMoam9pbmVkKTtcbiAgfVxuICByZXR1cm4gKGJ1ZiArIFwiIFwiICsgbmV4dCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG59XG5cbi8qKiAtLS0gU3BsaXQgaGVscGVycyAobm93IHdpdGggXHUyMDE4cHJvdGVjdGVkXHUyMDE5IHZlcnNlICYgUy4gUy4gc3BhbnMpIC0tLSAqL1xuY29uc3QgVE9LRU5fU1RBUlRfU1JDID0gU3RyaW5nLnJhd2AoPzpbSVZYTENETV0rWy4pXXxbQS1aXVsuKV18W2Etel1bLildfFxcZCtbLildfCRiZWdpbjptYXRoOnRleHQkW2EtekEtWjAtOV0rJGVuZDptYXRoOnRleHQkKWA7XG5cbmNvbnN0IEFGVEVSX1BVTkNUX1NQTElUX1JFID0gbmV3IFJlZ0V4cChcbiAgU3RyaW5nLnJhd2AoWzo7IT8pXXxcdTIwMTRcXHMqdlxcLlxccypcXGQrW2Etel0/OilcXHMrKD89YCArIFRPS0VOX1NUQVJUX1NSQyArIFN0cmluZy5yYXdgXFxzKylgLFxuICBcImdpXCJcbik7XG5cbi8vIE9ubHkgcHJvdGVjdCB2ZXJzZSBtYXJrZXJzIGFuZCBcdTIwMUNTLiBTLlx1MjAxRDsgYWxsIG90aGVyIG9uZS1sZXR0ZXIgYWJicmV2cyBjYW4gc3BsaXQuXG5jb25zdCBBRlRFUl9TRU5UX1RPS0VOX1NQTElUX1JFID0gbmV3IFJlZ0V4cChcbiAgU3RyaW5nLnJhd2AoPzwhXFxiW3ZWXVt2Vl1cXC4pKD88IVxcYlt2Vl1cXC4pKD88IVxcYlNcXC5cXHMqUylcXC5cXHMrKD89YCArIFRPS0VOX1NUQVJUX1NSQyArIFN0cmluZy5yYXdgXFxzKylgLFxuICBcImdcIlxuKTtcblxuLy8gUHJlLXByb3RlY3QgXCJ2LiA3XCIsIFwidnYuIDctOVwiIGFuZCBcIlMuIFMuXCIgc28gc3BsaXR0ZXJzIGNhblx1MjAxOXQgY3V0IHRoZW0uXG4vLyBVc2VzIGEgcHJpdmF0ZS11c2Ugc2VudGluZWwgZm9yIHRoZSBwcm90ZWN0ZWQgc3BhY2UuXG5jb25zdCBTRU5USU5FTCA9IFwiXFx1RTAwMFwiO1xuZnVuY3Rpb24gcHJvdGVjdFNwYW5zKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vIHYuIDdbbGV0dGVyXT9cbiAgcyA9IHMucmVwbGFjZSgvXFxiKFt2Vl0pXFwuXFxzKyhcXGQrW2Etel0/KSg/PVteXFxkXXwkKS9nLCAoX20sIHYsIG4pID0+IGAke3Z9LmAgKyBTRU5USU5FTCArIG4pO1xuICAvLyB2di4gNy05IC8gVlYuIDdcdTIwMTM5IGV0Yy5cbiAgcyA9IHMucmVwbGFjZSgvXFxiKFt2Vl0pKFt2Vl0pXFwuXFxzKyhcXGQrW2Etel0/KShcXHMqWy1cdTIwMTNcdTIwMTRdXFxzKlxcZCtbYS16XT8pPy9nLFxuICAgIChfbSwgdjEsIHYyLCBhLCBybmcpID0+IGAke3YxfSR7djJ9LmAgKyBTRU5USU5FTCArIGEgKyAocm5nID8/IFwiXCIpXG4gICk7XG4gIC8vIFMuIFMuXG4gIHMgPSBzLnJlcGxhY2UoL1xcYlNcXC5cXHMqU1xcLi9nLCBtID0+IG0ucmVwbGFjZSgvXFxzKy8sIFNFTlRJTkVMKSk7XG4gIHJldHVybiBzO1xufVxuZnVuY3Rpb24gdW5wcm90ZWN0U3BhbnMoczogc3RyaW5nKTogc3RyaW5nIHsgcmV0dXJuIHMucmVwbGFjZShuZXcgUmVnRXhwKFNFTlRJTkVMLCBcImdcIiksIFwiIFwiKTsgfVxuXG5mdW5jdGlvbiBzcGxpdElubGluZVNlZ21lbnRzKGxpbmU6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgbGV0IHMgPSBwcm90ZWN0U3BhbnMobGluZSk7XG4gIHMgPSBzLnJlcGxhY2UoQUZURVJfUFVOQ1RfU1BMSVRfUkUsIChfbSwgcDE6IHN0cmluZykgPT4gYCR7cDF9XFxuYCk7XG4gIHMgPSBzLnJlcGxhY2UoQUZURVJfU0VOVF9UT0tFTl9TUExJVF9SRSwgXCIuXFxuXCIpO1xuICBzID0gdW5wcm90ZWN0U3BhbnMocyk7XG4gIHJldHVybiBzLnNwbGl0KFwiXFxuXCIpLm1hcCh4ID0+IHgudHJpbSgpKS5maWx0ZXIoQm9vbGVhbik7XG59XG5cbi8qKiAtLS0tLSBNYWluIGZvcm1hdHRlciAoZGVsaW1pdGVyLWF3YXJlLCB2ZXJzZS1zYWZlKSAtLS0tLSAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZvcm1hdE91dGxpbmVUZXh0KFxuICB0ZXh0T3JMaW5lczogc3RyaW5nIHwgc3RyaW5nW10sXG4gIHtcbiAgICBzcGxpdElubGluZVN1YnBvaW50cyA9IHRydWUsXG4gICAgZml4SHlwaGVuYXRlZEJyZWFrcyA9IHRydWUsXG4gICAgb3V0cHV0TGluZVNlcGFyYXRvciA9IFwiXFxuXCIsXG4gICAgZHJvcFB1cmVQYWdlTnVtYmVyTGluZXMgPSBmYWxzZVxuICB9OiBPdXRsaW5lRm9ybWF0T3B0aW9ucyA9IHt9LFxuICBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICAvLyBCdWlsZCBhIHJhdyBzdHJpbmcgc28gd2UgY2FuIHByZS1oYWNrIHRoZSB2ZXJ5IGZpcnN0IFwiIEkuIFwiXG4gIGxldCByYXcgPSBBcnJheS5pc0FycmF5KHRleHRPckxpbmVzKSA/IHRleHRPckxpbmVzLmpvaW4oXCJcXG5cIikgOiB0ZXh0T3JMaW5lcztcblxuICAvLyBIQVJEIFBBVENIOiBJbiB0aGUgZmlyc3QgMjAwMCBjaGFycyBvbmx5LCBpbnNlcnQgYSBuZXdsaW5lIGJlZm9yZSB0aGUgZmlyc3Qgc3RhbmRhbG9uZSBcIiBJLiBcIlxuICAvLyAtIE5vdCBwcmVjZWRlZCBieSBhIGxldHRlci9udW1iZXIgKHNvIG5vdCBcIklJLlwiKVxuICAvLyAtIEZvbGxvd2VkIGJ5IGEgY2FwaXRhbCAoc3RhcnQgb2YgYSBzZW50ZW5jZS9oZWFkaW5nKVxuICAvLyAtIERvIG5vdCB0b3VjaCBcIlMuIFMuXCJcbiAge1xuICAgIGNvbnN0IGhlYWQgPSByYXcuc2xpY2UoMCwgMjAwMCk7XG4gICAgY29uc3QgdGFpbCA9IHJhdy5zbGljZSgyMDAwKTtcblxuICAgIC8vIG9uZS10aW1lIHJlcGxhY2UgKG5vIC9nLylcbiAgICBjb25zdCBoZWFkUGF0Y2hlZCA9IGhlYWQucmVwbGFjZShcbiAgICAgIC8oXnxbXkEtWmEtejAtOV0pSVxcLlxccysoPz1bQS1aXSkoPyFcXHMqU1xcLikvbSxcbiAgICAgIChfbSwgcHJlKSA9PiBgJHtwcmV9XFxuSS4gYFxuICAgICk7XG5cbiAgICByYXcgPSBoZWFkUGF0Y2hlZCArIHRhaWw7XG4gIH1cblxuICAvLyBub3cgcHJvY2VlZCB3aXRoIG5vcm1hbCBsaW5lIHNwbGl0dGluZyB1c2luZyB0aGUgcGF0Y2hlZCB0ZXh0XG4gIGNvbnN0IGxpbmVzID0gcmF3LnNwbGl0KC9cXHI/XFxuLyk7XG5cbiAgLy8gY29uc3QgbGluZXMgPSBBcnJheS5pc0FycmF5KHRleHRPckxpbmVzKSA/IHRleHRPckxpbmVzLnNsaWNlKCkgOiB0ZXh0T3JMaW5lcy5zcGxpdCgvXFxyP1xcbi8pO1xuXG4gIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgbGV0IGJ1ZiA9IFwiXCI7XG4gIGxldCBwcmV2Um9tYW46IHN0cmluZyB8IG51bGwgPSBudWxsOyAgICAgLy8gcHJldmlvdXMgUm9tYW4gbGFiZWwgKEksIElJLCBcdTIwMjYpXG4gIGxldCBwcmV2QWxwaGFJZHg6IG51bWJlciB8IG51bGwgPSBudWxsOyAgLy8gcHJldmlvdXMgQWxwaGEgaW5kZXggKEE9MSwgQj0yLCBcdTIwMjYpXG5cbiAgY29uc3QgZW1pdEJ1ZmZlciA9IChyYXc6IHN0cmluZykgPT4ge1xuICAgIGxldCBiYXNlID0gcmF3LnRyaW0oKTtcbiAgICBpZiAoIWJhc2UpIHJldHVybjtcblxuICAgIGlmICghc3BsaXRJbmxpbmVTdWJwb2ludHMpIHtcbiAgICAgIG91dC5wdXNoKGJhc2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBwYXJ0cyA9IHNwbGl0SW5saW5lU2VnbWVudHMoYmFzZSlcbiAgICAgIC5tYXAoc2VnID0+IHNlZy5yZXBsYWNlKC9eXFxkezEsM31cXHMrW0EtWl1bQS1aXSsoPzpbIC1dW0EtWl1bQS1aXSspKi8sIFwiXCIpLnRyaW0oKSkgLy8gY29uc2VydmF0aXZlIGhlYWRlciBzY3J1YlxuICAgICAgLmZpbHRlcihCb29sZWFuKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBwYXJ0ID0gcGFydHNbaV07XG4gICAgICBpZiAoZml4SHlwaGVuYXRlZEJyZWFrcykgcGFydCA9IGZpeElubGluZUh5cGhlbnMocGFydCk7XG5cbiAgICAgIGxldCBwYXJzZWQgPSBwYXJzZUhlYWRpbmdTdGFydChwYXJ0KTtcbiAgICAgIGlmICghcGFyc2VkKSB7XG4gICAgICAgIG91dC5wdXNoKHBhcnQpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgeyB0b2tlbiwgbGFiZWwsIHJlc3QsIGRlbGltIH0gPSBwYXJzZWQ7XG4gICAgICBjb25zdCB7IGxldmVsLCBuZXh0Um9tLCBuZXh0QWxwaGFJZHggfSA9IGRlY2lkZUxldmVsKGxhYmVsLnJlcGxhY2UoL1suKV0kLywgXCJcIiksIGRlbGltLCBwcmV2Um9tYW4sIHByZXZBbHBoYUlkeCk7XG4gICAgICBwcmV2Um9tYW4gPSBuZXh0Um9tO1xuICAgICAgcHJldkFscGhhSWR4ID0gbmV4dEFscGhhSWR4O1xuXG4gICAgICBpZiAobGV2ZWwgPT09IFwiYnVsbGV0XCIpIHtcbiAgICAgICAgb3V0LnB1c2goYCR7Z2V0TWRQcmVmaXhGcm9tTGV2ZWwobGV2ZWwpfSAqICR7dG9rZW59ICR7cmVzdH1gLnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcmVmaXggPSBnZXRNZFByZWZpeEZyb21MZXZlbChsZXZlbCk7XG4gICAgICAgIG91dC5wdXNoKGAke3ByZWZpeH0gJHt0b2tlbn0gJHtyZXN0fWAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZm9yIChsZXQgcmF3IG9mIGxpbmVzKSB7XG4gICAgbGV0IGxpbmUgPSByYXcudHJpbSgpO1xuICAgIGlmICghbGluZSkgY29udGludWU7XG4gICAgaWYgKGRyb3BQdXJlUGFnZU51bWJlckxpbmVzICYmIC9eXFxkKyQvLnRlc3QobGluZSkpIGNvbnRpbnVlO1xuICAgIGlmIChmaXhIeXBoZW5hdGVkQnJlYWtzKSBsaW5lID0gZml4SW5saW5lSHlwaGVucyhsaW5lKTtcblxuICAgIC8vIElmIHByZXZpb3VzIGJ1ZmZlciBlbmRzIHdpdGggdmVyc2UgbWFya2VyLCBhIGxlYWRpbmcgbnVtYmVyIGlzIGEgdmVyc2UgXHUyMDE0IG5vdCBhIG5ldyBoZWFkaW5nLlxuICAgIGxldCBwYXJzZWQgPSBwYXJzZUhlYWRpbmdTdGFydChsaW5lKTtcbiAgICBjb25zdCBwcmV2RW5kc1dpdGhWZXJzZSA9IC9cXGJbdlZdezEsMn1cXC5cXHMqJC8udGVzdChidWYpO1xuICAgIGlmIChwYXJzZWQgJiYgL15cXGQrJC8udGVzdChwYXJzZWQubGFiZWwpICYmIHByZXZFbmRzV2l0aFZlcnNlKSB7XG4gICAgICBwYXJzZWQgPSBudWxsOyAvLyB0cmVhdCBhcyBjb250aW51YXRpb25cbiAgICB9XG5cbiAgICBpZiAocGFyc2VkKSB7XG4gICAgICBpZiAoYnVmKSBlbWl0QnVmZmVyKGJ1Zik7XG4gICAgICBidWYgPSBcIlwiO1xuXG4gICAgICBjb25zdCB7IHRva2VuLCBsYWJlbCwgcmVzdCwgZGVsaW0gfSA9IHBhcnNlZDtcbiAgICAgIGNvbnN0IHsgbGV2ZWwsIG5leHRSb20sIG5leHRBbHBoYUlkeCB9ID0gZGVjaWRlTGV2ZWwobGFiZWwsIGRlbGltLCBwcmV2Um9tYW4sIHByZXZBbHBoYUlkeCk7XG4gICAgICBwcmV2Um9tYW4gPSBuZXh0Um9tO1xuICAgICAgcHJldkFscGhhSWR4ID0gbmV4dEFscGhhSWR4O1xuXG4gICAgICBpZiAobGV2ZWwgPT09IFwiYnVsbGV0XCIpIHtcbiAgICAgICAgYnVmID0gYCR7Z2V0TWRQcmVmaXhGcm9tTGV2ZWwobGV2ZWwpfSAqICR7dG9rZW59ICR7cmVzdH1gLnRyaW0oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4RnJvbUxldmVsKGxldmVsKTtcbiAgICAgICAgYnVmID0gYCR7cHJlZml4fSAke3Rva2VufSAke3Jlc3R9YC50cmltKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ1ZiA9IGJ1ZiA/IGFwcGVuZFdpdGhXb3JkQnJlYWtGaXgoYnVmLCBsaW5lLCBmaXhIeXBoZW5hdGVkQnJlYWtzKSA6IGxpbmU7XG4gICAgfVxuICB9XG5cbiAgaWYgKGJ1ZikgZW1pdEJ1ZmZlcihidWYpO1xuICBsZXQgcmVzdWx0ID0gb3V0LmpvaW4ob3V0cHV0TGluZVNlcGFyYXRvcik7XG5cbiAgLy8gaW5zZXJ0IHZlcnNlIGxpbmtzIHVzaW5nIGxpbmtWZXJzZXNJblRleHRcbiAgaWYgKHNldHRpbmdzLmF1dG9MaW5rVmVyc2VzKSB7XG4gICAgcmVzdWx0ID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChyZXN1bHQsIHNldHRpbmdzKTtcbiAgfVxuXG4gIG5ldyBOb3RpY2UoXCJPdXRsaW5lIGZvcm1hdHRlZFwiICsgKHNldHRpbmdzLmF1dG9MaW5rVmVyc2VzID8gXCIgKyB2ZXJzZXMgbGlua2VkLlwiIDogXCIuXCIpKTtcblxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8vIGV4cG9ydCBpbnRlcmZhY2UgT3V0bGluZUZvcm1hdE9wdGlvbnMge1xuLy8gICAvKiogU3BsaXQgaW5saW5lIHN1YnBvaW50cyBsaWtlIFwiYS4gXHUyMDI2IGIuIFx1MjAyNiAoMSkgXHUyMDI2XCIgQUZURVIgY29sb24vc2VtaWNvbG9uIG9yIFwiXHUyMDE0di4gOTpcIiwgYW5kIGFsc28gYWZ0ZXIgc2VudGVuY2UtZW5kaW5nIFwiLlwiIGJlZm9yZSBhIG5ldyB0b2tlbiAqL1xuLy8gICBzcGxpdElubGluZVN1YnBvaW50cz86IGJvb2xlYW47ICAgICAgIC8vIGRlZmF1bHQ6IHRydWVcbi8vICAgLyoqIEZpeCBcImh5cGhlbiArIGxpbmUgYnJlYWtcIiB3b3JkIHNwbGl0cyB3aGVuIG1lcmdpbmcgbGluZXMgKGlsbHVzLSB0cmF0ZWQgXHUyMTkyIGlsbHVzdHJhdGVkKSAqL1xuLy8gICBmaXhIeXBoZW5hdGVkQnJlYWtzPzogYm9vbGVhbjsgICAgICAgIC8vIGRlZmF1bHQ6IHRydWVcbi8vICAgLyoqIERyb3AgbGluZXMgdGhhdCBhcmUgb25seSBhIHBhZ2UgbnVtYmVyIChlLmcuLCBcIjE0XCIpIGJlZm9yZSBtZXJnaW5nICovXG4vLyAgIGRyb3BQdXJlUGFnZU51bWJlckxpbmVzPzogYm9vbGVhbjsgICAgLy8gZGVmYXVsdDogZmFsc2Vcbi8vIH1cblxuLy8gLyoqIFN0cmljdCBwb3J0ICsgc2FmZSBpbXByb3ZlbWVudHMgKi9cbi8vIGV4cG9ydCBmdW5jdGlvbiBmb3JtYXRPdXRsaW5lVGV4dCh0ZXh0OiBzdHJpbmcsIG9wdHM6IE91dGxpbmVGb3JtYXRPcHRpb25zID0ge30pOiBzdHJpbmcge1xuLy8gICBjb25zdCB7XG4vLyAgICAgc3BsaXRJbmxpbmVTdWJwb2ludHMgPSB0cnVlLFxuLy8gICAgIGZpeEh5cGhlbmF0ZWRCcmVha3MgPSB0cnVlLFxuLy8gICAgIGRyb3BQdXJlUGFnZU51bWJlckxpbmVzID0gZmFsc2UsXG4vLyAgIH0gPSBvcHRzO1xuXG4vLyAgIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgvXFxyP1xcbi8pO1xuLy8gICBjb25zdCBvdXRwdXQ6IHN0cmluZ1tdID0gW107XG4vLyAgIGxldCBidWZmZXIgPSBcIlwiO1xuXG4vLyAgIGNvbnN0IGlzSGVhZGluZyA9IChsaW5lOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbi8vICAgICBjb25zdCBzID0gbGluZS50cmltKCk7XG4vLyAgICAgLy8gUm9tYW4gKEkuLCBJSS4sIFx1MjAyNiksIFVwcGVyY2FzZSAoQS4pLCBEZWNpbWFsICgxLiksIFBhcmVuICgoYSksICgxKSlcbi8vICAgICByZXR1cm4gL14oKEl7MSwzfXxJVnxWfFZJfFZJSXxWSUlJfElYfFh8WEl8WElJfFhJSUl8WElWfFhWKVtcXC5cXCldfFtBLVpdW1xcLlxcKV18XFxkK1xcLltcXCldP3xcXChbYS16QS1aMC05XStcXCkpLy50ZXN0KHMpO1xuLy8gICB9O1xuXG4vLyAgIGNvbnN0IGdldE1kUHJlZml4ID0gKGl0ZW06IHN0cmluZyk6IHN0cmluZyA9PiB7XG4vLyAgICAgaWYgKC9eKD86W0lWWExDRE1dKylbXFwuXFwpXS9pLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjXCI7ICAgLy8gUm9tYW5cbi8vICAgICBpZiAoL15cXHMqW0EtWl1bXFwuXFwpXS8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyMjI1wiOyAgICAgICAgLy8gQS5cbi8vICAgICBpZiAoL15cXHMqXFxkK1xcLi8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyMjIyNcIjsgICAgICAgICAgICAgLy8gMS5cbi8vICAgICBpZiAoL15cXHMqW2Etel1cXC4vLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjIyMjI1wiOyAgICAgICAgICAvLyBhLlxuLy8gICAgIGlmICgvXlxccypcXChcXGQrXFwpLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCJcIjsgICAgICAgICAgICAgICAgLy8gKDEpXG4vLyAgICAgaWYgKC9eXFxzKlxcKFthLXpdXFwpLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCJcIjsgICAgICAgICAgICAgIC8vIChhKVxuLy8gICAgIHJldHVybiBcIlwiO1xuLy8gICB9O1xuXG4vLyAgIC8vIC0tLS0gSHlwaGVuYXRlZCB3b3JkIHdyYXAgam9pbiAoXHUyMDI2IFwiaWxsdXMtXCIgKyBcInRyYXRlZFwiID0+IFwiaWxsdXN0cmF0ZWRcIilcbi8vICAgY29uc3QgVFJBSUxJTkdfSFlQSEVOX0FUX0VORCA9IC9bQS1aYS16XVtcXC1cXHUyMDEwXFx1MjAxMVxcdTIwMTJcXHUyMDEzXFx1MjAxNF1cXHMqJC87XG4vLyAgIGNvbnN0IGFwcGVuZFdpdGhXb3JkQnJlYWtGaXggPSAoYnVmOiBzdHJpbmcsIG5leHQ6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4vLyAgICAgaWYgKGZpeEh5cGhlbmF0ZWRCcmVha3MgJiYgVFJBSUxJTkdfSFlQSEVOX0FUX0VORC50ZXN0KGJ1ZikgJiYgL15bYS16XS8udGVzdChuZXh0KSkge1xuLy8gICAgICAgcmV0dXJuIGJ1Zi5yZXBsYWNlKC9bXFwtXFx1MjAxMFxcdTIwMTFcXHUyMDEyXFx1MjAxM1xcdTIwMTRdXFxzKiQvLCBcIlwiKSArIG5leHQ7XG4vLyAgICAgfVxuLy8gICAgIHJldHVybiAoYnVmICsgXCIgXCIgKyBuZXh0KS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKTtcbi8vICAgfTtcblxuLy8gICAvLyAtLS0tIE5vcm1hbGl6ZSBkaXZpZGVyIGRhc2hlcyBiZWZvcmUgdmVyc2UgcmVmcyB0byBhIHRpZ2h0IGVtLWRhc2g6IFwiXHUyMDE0XCIgKG5vIHNwYWNlcylcbi8vICAgZnVuY3Rpb24gbm9ybWFsaXplUmVmRGFzaGVzKHM6IHN0cmluZyk6IHN0cmluZyB7XG4vLyAgICAgLy8gYmVmb3JlIFwidi4gOVwiLCBcInYuIDk6XCIsIGV0Yy5cbi8vICAgICBzID0gcy5yZXBsYWNlKC8oXFxTKVxccypbXFwtXFx1MjAxMFxcdTIwMTFcXHUyMDEyXFx1MjAxM1xcdTIwMTRdXFxzKih2XFwuXFxzKlxcZCtbYS16XT86PykvZ2ksIFwiJDFcdTIwMTQkMlwiKTtcbi8vICAgICAvLyBiZWZvcmUgYm9vaytyZWZlcmVuY2UgbGlrZSBcIlMuIFMuIDQ6MTFhXCIsIFwiQ29sLiAxOjEyXCIsIFwiMSBKb2huIDE6NVwiXG4vLyAgICAgcyA9IHMucmVwbGFjZShcbi8vICAgICAgIC8oXFxTKVxccypbXFwtXFx1MjAxMFxcdTIwMTFcXHUyMDEyXFx1MjAxM1xcdTIwMTRdXFxzKigoWzEtM10/XFxzPyg/OltBLVpdW2EtekEtWl0qXFwuP3xbQS1aXVxcLikpKD86XFxzK1sxLTNdP1xccz8oPzpbQS1aXVthLXpBLVpdKlxcLj98W0EtWl1cXC4pKSpcXHMrXFxkKzpcXGQrW2Etel0/KS9nLFxuLy8gICAgICAgXCIkMVx1MjAxNCQyXCJcbi8vICAgICApO1xuLy8gICAgIHJldHVybiBzO1xuLy8gICB9XG5cbi8vICAgLy8gLS0tLSBTcGxpdCBpbmxpbmUgc3VicG9pbnRzICgxKSBhZnRlciA6LDsgb3IgZW0tZGFzaCBiZWZvcmUgXCJ2LiA5OlwiICAoMikgYWZ0ZXIgc2VudGVuY2UgXCIuXCIgd2hlbiBhIG5ldyB0b2tlbiBzdGFydHNcbi8vICAgLy8gS2VlcCBhYmJyZXZpYXRpb25zIGxpa2UgXCJTLiBTLlwiIGJ5IGZvcmJpZGRpbmcgc3BsaXQgd2hlbiBkb3QgaXMgcGFydCBvZiBhIG9uZS1sZXR0ZXIgYWJicmV2OiAoPzwhXFxiW0EtWmEtel1cXC4pXG4vLyAgIGNvbnN0IFRPS0VOX1NUQVJUX1NSQyA9IFN0cmluZy5yYXdgKD86W0lWWExDRE1dK1xcLnxbQS1aXVxcLnxbYS16XVxcLnxcXGQrXFwufCRiZWdpbjptYXRoOnRleHQkW2EtekEtWjAtOV0rJGVuZDptYXRoOnRleHQkKWA7XG4vLyAgIGNvbnN0IEFGVEVSX1BVTkNUX1NQTElUX1JFID0gbmV3IFJlZ0V4cChcbi8vICAgICBTdHJpbmcucmF3YChbOjshP118XHUyMDE0XFxzKnZcXC5cXHMqXFxkK1thLXpdPzopXFxzKyg/PWAgKyBUT0tFTl9TVEFSVF9TUkMgKyBTdHJpbmcucmF3YFxccyspYCxcbi8vICAgICBcImdpXCJcbi8vICAgKTtcbi8vICAgY29uc3QgQUZURVJfU0VOVF9UT0tFTl9TUExJVF9SRSA9IG5ldyBSZWdFeHAoXG4vLyAgICAgU3RyaW5nLnJhd2AoPzwhXFxiW0EtWmEtel1cXC4pXFwuXFxzKyg/PWAgKyBUT0tFTl9TVEFSVF9TUkMgKyBTdHJpbmcucmF3YFxccyspYCxcbi8vICAgICBcImdcIlxuLy8gICApO1xuXG4vLyAgIGNvbnN0IHNwbGl0SW5saW5lU2VnbWVudHMgPSAobGluZTogc3RyaW5nKTogc3RyaW5nW10gPT4ge1xuLy8gICAgIC8vIDEpIHNwbGl0IGFmdGVyIDosIDssICE/LCBhbmQgXHUyMDFDXHUyMDE0IHYuIDk6XHUyMDFEXG4vLyAgICAgbGV0IHMgPSBsaW5lLnJlcGxhY2UoQUZURVJfUFVOQ1RfU1BMSVRfUkUsIChfbSwgcDE6IHN0cmluZykgPT4gYCR7cDF9XFxuYCk7XG4vLyAgICAgLy8gMikgc3BsaXQgYWZ0ZXIgc2VudGVuY2UtZW5kaW5nIGRvdCB3aGVuIGEgdG9rZW4gKDEuLCBhLiwgKDEpLCBJLiwgQS4pIGZvbGxvd3Ncbi8vICAgICBzID0gcy5yZXBsYWNlKEFGVEVSX1NFTlRfVE9LRU5fU1BMSVRfUkUsIFwiLlxcblwiKTtcbi8vICAgICByZXR1cm4gcy5zcGxpdChcIlxcblwiKS5tYXAoeCA9PiB4LnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pO1xuLy8gICB9O1xuXG4vLyAgIGNvbnN0IGVtaXRCdWZmZXIgPSAoYnVmOiBzdHJpbmcpID0+IHtcbi8vICAgICBjb25zdCBiYXNlID0gbm9ybWFsaXplUmVmRGFzaGVzKGJ1Zi50cmltKCkpO1xuLy8gICAgIGlmICghYmFzZSkgcmV0dXJuO1xuXG4vLyAgICAgaWYgKCFzcGxpdElubGluZVN1YnBvaW50cykge1xuLy8gICAgICAgb3V0cHV0LnB1c2goYmFzZSk7XG4vLyAgICAgICByZXR1cm47XG4vLyAgICAgfVxuXG4vLyAgICAgY29uc3QgcGFydHMgPSBzcGxpdElubGluZVNlZ21lbnRzKGJhc2UpO1xuLy8gICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgIGxldCBwYXJ0ID0gcGFydHNbaV07XG4vLyAgICAgICBwYXJ0ID0gbm9ybWFsaXplUmVmRGFzaGVzKHBhcnQpO1xuXG4vLyAgICAgICBpZiAoaSA9PT0gMCkge1xuLy8gICAgICAgICBvdXRwdXQucHVzaChwYXJ0KTtcbi8vICAgICAgICAgY29udGludWU7XG4vLyAgICAgICB9XG5cbi8vICAgICAgIC8vIEFkZCBoZWFkaW5nIHByZWZpeCBmb3Igc3BsaXQtb2ZmIHN1YnBvaW50c1xuLy8gICAgICAgY29uc3QgbSA9IHBhcnQubWF0Y2goL14oKD86W0lWWExDRE1dK1xcLnxbQS1aXVxcLnxbYS16XVxcLnxcXGQrXFwufFxcKFthLXpBLVowLTldK1xcKSkpXFxzKyguKikkLyk7XG4vLyAgICAgICBpZiAobSkge1xuLy8gICAgICAgICBjb25zdCBpdGVtID0gbVsxXTtcbi8vICAgICAgICAgY29uc3QgY29udGVudCA9IG1bMl0gPz8gXCJcIjtcbi8vICAgICAgICAgY29uc3QgcHJlZml4ID0gZ2V0TWRQcmVmaXgoaXRlbSk7XG4vLyAgICAgICAgIG91dHB1dC5wdXNoKGAke3ByZWZpeH0gJHtpdGVtfSAke2NvbnRlbnR9YC50cmltKCkpO1xuLy8gICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgb3V0cHV0LnB1c2gocGFydCk7XG4vLyAgICAgICB9XG4vLyAgICAgfVxuLy8gICB9O1xuXG4vLyAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuLy8gICAgIGNvbnN0IHN0cmlwcGVkID0gbGluZS50cmltKCk7XG4vLyAgICAgaWYgKCFzdHJpcHBlZCkgY29udGludWU7XG4vLyAgICAgaWYgKGRyb3BQdXJlUGFnZU51bWJlckxpbmVzICYmIC9eXFxkKyQvLnRlc3Qoc3RyaXBwZWQpKSBjb250aW51ZTtcblxuLy8gICAgIGlmIChpc0hlYWRpbmcoc3RyaXBwZWQpKSB7XG4vLyAgICAgICBpZiAoYnVmZmVyKSBlbWl0QnVmZmVyKGJ1ZmZlcik7XG4vLyAgICAgICBidWZmZXIgPSBcIlwiO1xuXG4vLyAgICAgICBjb25zdCBmaXJzdFNwYWNlID0gc3RyaXBwZWQuaW5kZXhPZihcIiBcIik7XG4vLyAgICAgICBjb25zdCBpdGVtID0gZmlyc3RTcGFjZSA9PT0gLTEgPyBzdHJpcHBlZCA6IHN0cmlwcGVkLnNsaWNlKDAsIGZpcnN0U3BhY2UpO1xuLy8gICAgICAgY29uc3QgY29udGVudCA9IGZpcnN0U3BhY2UgPT09IC0xID8gXCJcIiA6IHN0cmlwcGVkLnNsaWNlKGZpcnN0U3BhY2UgKyAxKTtcbi8vICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4KGl0ZW0pO1xuLy8gICAgICAgYnVmZmVyID0gYCR7cHJlZml4fSAke2l0ZW19ICR7Y29udGVudH1gLnRyaW0oKTtcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgYnVmZmVyID0gYnVmZmVyID8gYXBwZW5kV2l0aFdvcmRCcmVha0ZpeChidWZmZXIsIHN0cmlwcGVkKSA6IHN0cmlwcGVkO1xuLy8gICAgIH1cbi8vICAgfVxuXG4vLyAgIGlmIChidWZmZXIpIGVtaXRCdWZmZXIoYnVmZmVyKTtcbi8vICAgcmV0dXJuIG91dHB1dC5qb2luKFwiXFxuXCIpO1xuLy8gfVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLVxuLy8gZXhwb3J0IGludGVyZmFjZSBPdXRsaW5lRm9ybWF0T3B0aW9ucyB7XG4vLyAgIC8qKiBTcGxpdCBpbmxpbmUgc3VicG9pbnRzIGxpa2UgXCJhLiBcdTIwMjYgYi4gXHUyMDI2ICgxKSBcdTIwMjZcIiBBRlRFUiBjb2xvbi9zZW1pY29sb24gb3IgXCJcdTIwMTR2LiA5OlwiICovXG4vLyAgIHNwbGl0SW5saW5lU3VicG9pbnRzPzogYm9vbGVhbjsgICAgICAgLy8gZGVmYXVsdDogdHJ1ZVxuLy8gICAvKiogRml4IFwiaHlwaGVuICsgbGluZSBicmVha1wiIHdvcmQgc3BsaXRzIHdoZW4gbWVyZ2luZyBsaW5lcyAoaWxsdXMtIHRyYXRlZCBcdTIxOTIgaWxsdXN0cmF0ZWQpICovXG4vLyAgIGZpeEh5cGhlbmF0ZWRCcmVha3M/OiBib29sZWFuOyAgICAgICAgLy8gZGVmYXVsdDogdHJ1ZVxuLy8gICAvKiogRHJvcCBsaW5lcyB0aGF0IGFyZSBvbmx5IGEgcGFnZSBudW1iZXIgKGUuZy4sIFwiMTRcIikgYmVmb3JlIG1lcmdpbmcgKi9cbi8vICAgZHJvcFB1cmVQYWdlTnVtYmVyTGluZXM/OiBib29sZWFuOyAgICAvLyBkZWZhdWx0OiBmYWxzZVxuLy8gfVxuXG4vLyAvKiogU3RyaWN0IHBvcnQgb2YgeW91ciBQeXRob24gcGx1cyBTQUZFIG9wdC1pbnMgKi9cbi8vIGV4cG9ydCBmdW5jdGlvbiBmb3JtYXRPdXRsaW5lVGV4dCh0ZXh0OiBzdHJpbmcsIG9wdHM6IE91dGxpbmVGb3JtYXRPcHRpb25zID0ge30pOiBzdHJpbmcge1xuLy8gICBjb25zdCB7XG4vLyAgICAgc3BsaXRJbmxpbmVTdWJwb2ludHMgPSB0cnVlLFxuLy8gICAgIGZpeEh5cGhlbmF0ZWRCcmVha3MgPSB0cnVlLFxuLy8gICAgIGRyb3BQdXJlUGFnZU51bWJlckxpbmVzID0gZmFsc2UsXG4vLyAgIH0gPSBvcHRzO1xuXG4vLyAgIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgvXFxyP1xcbi8pO1xuLy8gICBjb25zdCBvdXRwdXQ6IHN0cmluZ1tdID0gW107XG4vLyAgIGxldCBidWZmZXIgPSBcIlwiO1xuXG4vLyAgIGNvbnN0IGlzSGVhZGluZyA9IChsaW5lOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbi8vICAgICBjb25zdCBzID0gbGluZS50cmltKCk7XG4vLyAgICAgLy8gXigoUm9tYW4pfFtBLVpdLnxkaWdpdHMufChwYXJlbikpXG4vLyAgICAgcmV0dXJuIC9eKChJezEsM318SVZ8VnxWSXxWSUl8VklJSXxJWHxYfFhJfFhJSXxYSUlJfFhJVnxYVilbXFwuXFwpXXxbQS1aXVtcXC5cXCldfFxcZCtcXC5bXFwpXT98XFwoW2EtekEtWjAtOV0rXFwpKS8udGVzdChzKTtcbi8vICAgfTtcblxuLy8gICBjb25zdCBnZXRNZFByZWZpeCA9IChpdGVtOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuLy8gICAgIGlmICgvXihJezEsM318SVZ8VnxWSXxWSUl8VklJSXxJWHxYfFhJfFhJSXxYSUlJfFhJVnxYVilbXFwuXFwpXS8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyNcIjtcbi8vICAgICBlbHNlIGlmICgvXlxccypbQS1aXVtcXC5cXCldLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCIjIyMjXCI7XG4vLyAgICAgZWxzZSBpZiAoL15cXHMqXFxkK1xcLi8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyMjIyNcIjtcbi8vICAgICBlbHNlIGlmICgvXlxccypbYS16XVxcLi8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyMjIyMjXCI7XG4vLyAgICAgZWxzZSBpZiAoL15cXHMqXFwoXFxkK1xcKS8udGVzdChpdGVtKSkgcmV0dXJuIFwiXCI7XG4vLyAgICAgZWxzZSBpZiAoL15cXHMqXFwoW2Etel1cXCkvLnRlc3QoaXRlbSkpIHJldHVybiBcIlwiO1xuLy8gICAgIGVsc2UgcmV0dXJuIFwiXCI7XG4vLyAgIH07XG5cbi8vICAgLy8gLS0tLSBIeXBoZW5hdGVkIHdvcmQgd3JhcCBqb2luIChcdTIwMjYgXCJpbGx1cy1cIiArIFwidHJhdGVkXCIgPT4gXCJpbGx1c3RyYXRlZFwiKVxuLy8gICBjb25zdCBUUkFJTElOR19IWVBIRU5fQVRfRU5EID0gL1tBLVphLXpdW1xcLVxcdTIwMTBcXHUyMDExXFx1MjAxMlxcdTIwMTNcXHUyMDE0XVxccyokLzsgLy8gLSwgXHUyMDEwLCAtLCBcdTIwMTIsIFx1MjAxMywgXHUyMDE0XG4vLyAgIGNvbnN0IGFwcGVuZFdpdGhXb3JkQnJlYWtGaXggPSAoYnVmOiBzdHJpbmcsIG5leHQ6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4vLyAgICAgaWYgKGZpeEh5cGhlbmF0ZWRCcmVha3MgJiYgVFJBSUxJTkdfSFlQSEVOX0FUX0VORC50ZXN0KGJ1ZikgJiYgL15bYS16XS8udGVzdChuZXh0KSkge1xuLy8gICAgICAgcmV0dXJuIGJ1Zi5yZXBsYWNlKC9bXFwtXFx1MjAxMFxcdTIwMTFcXHUyMDEyXFx1MjAxM1xcdTIwMTRdXFxzKiQvLCBcIlwiKSArIG5leHQ7XG4vLyAgICAgfVxuLy8gICAgIHJldHVybiAoYnVmICsgXCIgXCIgKyBuZXh0KS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKTtcbi8vICAgfTtcblxuLy8gICAvLyAtLS0tIE5vcm1hbGl6ZSBkaXZpZGVyIGRhc2hlcyBiZWZvcmUgdmVyc2UgcmVmcyB0byBhIHRpZ2h0IGVtLWRhc2g6IFwiXHUyMDE0XCIgKG5vIHNwYWNlcylcbi8vICAgZnVuY3Rpb24gbm9ybWFsaXplUmVmRGFzaGVzKHM6IHN0cmluZyk6IHN0cmluZyB7XG4vLyAgICAgLy8gQ2FzZSAxOiBiZWZvcmUgXCJ2LiA5XCIsIFwidi4gOTpcIiwgXCJ2LiA5YTpcIlxuLy8gICAgIHMgPSBzLnJlcGxhY2UoXG4vLyAgICAgICAvKFxcUylcXHMqW1xcLVxcdTIwMTBcXHUyMDExXFx1MjAxMlxcdTIwMTNcXHUyMDE0XVxccyoodlxcLlxccypcXGQrW2Etel0/Oj8pL2dpLFxuLy8gICAgICAgXCIkMVx1MjAxNCQyXCJcbi8vICAgICApO1xuXG4vLyAgICAgLy8gQ2FzZSAyOiBiZWZvcmUgYm9vaytyZWZlcmVuY2UgbGlrZSBcIlMuIFMuIDQ6MTFhXCIsIFwiQ29sLiAxOjEyXCIsIFwiMSBKb2huIDE6NVwiXG4vLyAgICAgLy8gU3VwcG9ydHMgY2hhaW5zIGxpa2UgXCIxIFRpbS5cIiBvciBcIlNvbmcgb2YgU29uZ3NcIiBhYmJyZXZpYXRpb25zIHdpdGggZG90cy5cbi8vICAgICBzID0gcy5yZXBsYWNlKFxuLy8gICAgICAgLyhcXFMpXFxzKltcXC1cXHUyMDEwXFx1MjAxMVxcdTIwMTJcXHUyMDEzXFx1MjAxNF1cXHMqKChbMS0zXT9cXHM/KD86W0EtWl1bYS16QS1aXSpcXC4/fFtBLVpdXFwuKSkoPzpcXHMrWzEtM10/XFxzPyg/OltBLVpdW2EtekEtWl0qXFwuP3xbQS1aXVxcLikpKlxccytcXGQrOlxcZCtbYS16XT8pL2csXG4vLyAgICAgICBcIiQxXHUyMDE0JDJcIlxuLy8gICAgICk7XG5cbi8vICAgICByZXR1cm4gcztcbi8vICAgfVxuXG4vLyAgIC8vIC0tLS0gU3BsaXQgaW5saW5lIHN1YnBvaW50cyBPTkxZIGFmdGVyIFwiOlwiIG9yIFwiO1wiIChvciBcIlx1MjAxNHYuIDk6XCIpLCBuZXZlciBhZnRlciBcIi5cIlxuLy8gICAvLyBUaGlzIGtlZXBzIFwiUy4gUy4gNDoxMWFcIiB0b2dldGhlci5cbi8vICAgY29uc3QgQUZURVJfUFVOQ1RfU1BMSVRfUkUgPVxuLy8gICAgIC8oWzo7IT9dfFx1MjAxNFxccyp2XFwuXFxzKlxcZCtbYS16XT86KVxccysoPz0oPzpbYS16XVxcLnxbQS1aXVxcLnxcXGQrXFwufFxcKFthLXowLTldK1xcKSlcXHMrKS9naTtcblxuLy8gICBjb25zdCBzcGxpdElubGluZUFmdGVyUHVuY3QgPSAobGluZTogc3RyaW5nKTogc3RyaW5nW10gPT4ge1xuLy8gICAgIGNvbnN0IHdpdGhCcmVha3MgPSBsaW5lLnJlcGxhY2UoQUZURVJfUFVOQ1RfU1BMSVRfUkUsIChfbSwgcDE6IHN0cmluZykgPT4gYCR7cDF9XFxuYCk7XG4vLyAgICAgcmV0dXJuIHdpdGhCcmVha3Muc3BsaXQoXCJcXG5cIikubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihCb29sZWFuKTtcbi8vICAgfTtcblxuLy8gICBjb25zdCBlbWl0QnVmZmVyID0gKGJ1Zjogc3RyaW5nKSA9PiB7XG4vLyAgICAgY29uc3QgYmFzZSA9IG5vcm1hbGl6ZVJlZkRhc2hlcyhidWYudHJpbSgpKTtcbi8vICAgICBpZiAoIWJhc2UpIHJldHVybjtcblxuLy8gICAgIGlmICghc3BsaXRJbmxpbmVTdWJwb2ludHMpIHtcbi8vICAgICAgIG91dHB1dC5wdXNoKGJhc2UpO1xuLy8gICAgICAgcmV0dXJuO1xuLy8gICAgIH1cblxuLy8gICAgIGNvbnN0IHBhcnRzID0gc3BsaXRJbmxpbmVBZnRlclB1bmN0KGJhc2UpO1xuLy8gICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgIGxldCBwYXJ0ID0gcGFydHNbaV07XG4vLyAgICAgICBwYXJ0ID0gbm9ybWFsaXplUmVmRGFzaGVzKHBhcnQpOyAvLyBlbnN1cmUgZWFjaCBwaWVjZSBoYXMgdGlnaHQgZW0tZGFzaCB0byByZWZzXG5cbi8vICAgICAgIGlmIChpID09PSAwKSB7XG4vLyAgICAgICAgIC8vIGZpcnN0IHBpZWNlIGlzIGFscmVhZHkgcmVuZGVyZWQgKGUuZy4sIFwiIyMjIyBBLiAuLi5cIikgb3IgcGxhaW4gdGV4dFxuLy8gICAgICAgICBvdXRwdXQucHVzaChwYXJ0KTtcbi8vICAgICAgICAgY29udGludWU7XG4vLyAgICAgICB9XG5cbi8vICAgICAgIC8vIEZvciBzcGxpdC1vZmYgc3VicG9pbnRzLCBhZGQgaGVhZGluZyBwcmVmaXggYmFzZWQgb24gdG9rZW5cbi8vICAgICAgIGNvbnN0IG0gPSBwYXJ0Lm1hdGNoKC9eKCg/OltBLVpdXFwuKXwoPzpbYS16XVxcLil8KD86XFxkK1xcLil8XFwoW2EtekEtWjAtOV0rXFwpKVxccysoLiopJC8pO1xuLy8gICAgICAgaWYgKG0pIHtcbi8vICAgICAgICAgY29uc3QgaXRlbSA9IG1bMV07XG4vLyAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBtWzJdID8/IFwiXCI7XG4vLyAgICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4KGl0ZW0pO1xuLy8gICAgICAgICBvdXRwdXQucHVzaChgJHtwcmVmaXh9ICR7aXRlbX0gJHtjb250ZW50fWAudHJpbSgpKTtcbi8vICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgIG91dHB1dC5wdXNoKHBhcnQpO1xuLy8gICAgICAgfVxuLy8gICAgIH1cbi8vICAgfTtcblxuLy8gICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbi8vICAgICBjb25zdCBzdHJpcHBlZCA9IGxpbmUudHJpbSgpO1xuLy8gICAgIGlmICghc3RyaXBwZWQpIGNvbnRpbnVlO1xuLy8gICAgIGlmIChkcm9wUHVyZVBhZ2VOdW1iZXJMaW5lcyAmJiAvXlxcZCskLy50ZXN0KHN0cmlwcGVkKSkgY29udGludWU7IC8vIGRyb3AgXCIxNFwiLCBcIjE1XCIsIC4uLlxuXG4vLyAgICAgaWYgKGlzSGVhZGluZyhzdHJpcHBlZCkpIHtcbi8vICAgICAgIGlmIChidWZmZXIpIGVtaXRCdWZmZXIoYnVmZmVyKTtcbi8vICAgICAgIGJ1ZmZlciA9IFwiXCI7XG5cbi8vICAgICAgIC8vIHNwbGl0KG1heHNwbGl0PTEpXG4vLyAgICAgICBjb25zdCBmaXJzdFNwYWNlID0gc3RyaXBwZWQuaW5kZXhPZihcIiBcIik7XG4vLyAgICAgICBjb25zdCBpdGVtID0gZmlyc3RTcGFjZSA9PT0gLTEgPyBzdHJpcHBlZCA6IHN0cmlwcGVkLnNsaWNlKDAsIGZpcnN0U3BhY2UpO1xuLy8gICAgICAgY29uc3QgY29udGVudCA9IGZpcnN0U3BhY2UgPT09IC0xID8gXCJcIiA6IHN0cmlwcGVkLnNsaWNlKGZpcnN0U3BhY2UgKyAxKTtcbi8vICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4KGl0ZW0pO1xuLy8gICAgICAgYnVmZmVyID0gYCR7cHJlZml4fSAke2l0ZW19ICR7Y29udGVudH1gLnRyaW0oKTtcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgYnVmZmVyID0gYnVmZmVyID8gYXBwZW5kV2l0aFdvcmRCcmVha0ZpeChidWZmZXIsIHN0cmlwcGVkKSA6IHN0cmlwcGVkO1xuLy8gICAgIH1cbi8vICAgfVxuXG4vLyAgIGlmIChidWZmZXIpIGVtaXRCdWZmZXIoYnVmZmVyKTtcbi8vICAgcmV0dXJuIG91dHB1dC5qb2luKFwiXFxuXCIpO1xuLy8gfVxuXG5cbi8vIGV4cG9ydCBmdW5jdGlvbiBmb3JtYXRPdXRsaW5lVGV4dCh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuLy8gICBjb25zdCBsaW5lcyA9IHRleHQuc3BsaXQoL1xccj9cXG4vKTtcbi8vICAgdGV4dCA9IHNwbGl0SW5saW5lSGVhZGluZ3ModGV4dCk7XG5cbi8vICAgY29uc3Qgb3V0cHV0OiBzdHJpbmdbXSA9IFtdO1xuLy8gICBsZXQgYnVmZmVyID0gXCJcIjtcblxuLy8gICBjb25zdCBpc0hlYWRpbmcgPSAobGluZTogc3RyaW5nKTogYm9vbGVhbiA9PiB7XG4vLyAgICAgY29uc3QgcyA9IGxpbmUudHJpbSgpO1xuLy8gICAgIHJldHVybiAvXigoSXsxLDN9fElWfFZ8Vkl8VklJfFZJSUl8SVh8WHxYSXxYSUl8WElJSXxYSVZ8WFZ8WFZJfFhWSUl8WFZJSUl8WElYfFhYKVtcXC5cXCldIHwgW0EgLSBaXVtcXC5cXCldfFxcZCArXFwuW1xcKV0gP3xcXChbYSAtIHpBIC0gWjAgLSA5XSArXFwpKS8udGVzdChzKTtcbi8vICAgfTtcblxuLy8gICBjb25zdCBnZXRNZFByZWZpeCA9IChpdGVtOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuLy8gICAgIGlmICgvXihJezEsM318SVZ8VnxWSXxWSUl8VklJSXxJWHxYfFhJfFhJSXxYSUlJfFhJVnxYVnxYVkl8WFZJSXxYVklJSXxYSVh8WFgpW1xcLlxcKV0vLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjXCI7XG4vLyAgICAgZWxzZSBpZiAoL15cXHMqW0EtWl1bXFwuXFwpXS8udGVzdChpdGVtKSkgcmV0dXJuIFwiIyMjI1wiO1xuLy8gICAgIGVsc2UgaWYgKC9eXFxzKlxcZCtcXC4vLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjIyMjXCI7XG4vLyAgICAgZWxzZSBpZiAoL15cXHMqW2Etel1cXC4vLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjIyMjI1wiO1xuLy8gICAgIGVsc2UgaWYgKC9eXFxzKlxcKFxcZCtcXCkvLnRlc3QoaXRlbSkpIHJldHVybiBcIlwiO1xuLy8gICAgIGVsc2UgaWYgKC9eXFxzKlxcKFthLXpdXFwpLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCJcIjtcbi8vICAgICBlbHNlIHJldHVybiBcIlwiO1xuLy8gICB9O1xuXG4vLyAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuLy8gICAgIGNvbnN0IHN0cmlwcGVkID0gbGluZS50cmltKCk7XG4vLyAgICAgaWYgKCFzdHJpcHBlZCkgY29udGludWU7XG5cbi8vICAgICBpZiAoaXNIZWFkaW5nKHN0cmlwcGVkKSkge1xuLy8gICAgICAgaWYgKGJ1ZmZlcikgb3V0cHV0LnB1c2goYnVmZmVyLnRyaW0oKSk7XG4vLyAgICAgICBidWZmZXIgPSBcIlwiO1xuXG4vLyAgICAgICBjb25zdCBwYXJ0cyA9IHN0cmlwcGVkLnNwbGl0KC9cXHMrLywgMSArIDEpOyAvLyBtYXhzcGxpdD0xXG4vLyAgICAgICBjb25zdCBpdGVtID0gcGFydHNbMF07XG4vLyAgICAgICBjb25zdCBjb250ZW50ID0gcGFydHMubGVuZ3RoID4gMSA/IHBhcnRzWzFdIDogXCJcIjtcbi8vICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4KGl0ZW0pO1xuLy8gICAgICAgYnVmZmVyID0gYCR7cHJlZml4fSAke2l0ZW19ICR7Y29udGVudH1gLnRyaW0oKTtcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgYnVmZmVyICs9IGAgJHtzdHJpcHBlZH1gO1xuLy8gICAgIH1cbi8vICAgfVxuXG4vLyAgIGlmIChidWZmZXIpIG91dHB1dC5wdXNoKGJ1ZmZlci50cmltKCkpO1xuLy8gICByZXR1cm4gb3V0cHV0LmpvaW4oXCJcXG5cIik7XG4vLyB9XG5cbi8vIC8vIEluc2VydCBuZXdsaW5lcyBiZWZvcmUgaW5saW5lIHRva2VucyB0aGF0IGxvb2sgbGlrZSBuZXcgaXRlbXMuXG4vLyAvLyBBdm9pZHMgc3BsaXR0aW5nIGNvbW1vbiBhYmJyZXZpYXRpb25zIGxpa2UgXCJ2LlwiIGJ5IGV4Y2x1ZGluZyBpdC5cbi8vIGZ1bmN0aW9uIHNwbGl0SW5saW5lSGVhZGluZ3ModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbi8vICAgcmV0dXJuIHRleHRcbi8vICAgICAvLyBCZWZvcmUgQS4gLyBCLiAvIEMuXG4vLyAgICAgLnJlcGxhY2UoL1xccysoPz0oPzpbQS1aXVxcLilcXHMpL2csIFwiXFxuXCIpXG4vLyAgICAgLy8gQmVmb3JlIGEuIC8gYi4gLyBjLiAgKGJ1dCBOT1Qgdi4pXG4vLyAgICAgLnJlcGxhY2UoL1xccysoPz0oPzooPyF2XFwuKVthLXpdXFwuKVxccykvZywgXCJcXG5cIilcbi8vICAgICAvLyBCZWZvcmUgMS4gLyAyLiAvIDMuXG4vLyAgICAgLnJlcGxhY2UoL1xccysoPz0oPzpcXGQrXFwuKVxccykvZywgXCJcXG5cIilcbi8vICAgICAvLyBCZWZvcmUgKGEpIC8gKDEpXG4vLyAgICAgLnJlcGxhY2UoL1xccysoPz1cXChbYS16MC05XStcXClcXHMpL2dpLCBcIlxcblwiKTtcbi8vIH1cblxuXG4vLyAvLyBzcmMvbGliL291dGxpbmVVdGlscy50c1xuXG4vLyAvKiogU3RyaWN0IDE6MSBUeXBlU2NyaXB0IHBvcnQgb2YgeW91ciBQeXRob24gYGZvcm1hdF9vdXRsaW5lYCAqL1xuLy8gZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdE91dGxpbmVUZXh0KHRleHQ6IHN0cmluZywgb3B0cz86IHsgc3BsaXRJbmxpbmVBZnRlckNvbG9uPzogYm9vbGVhbiB9KTogc3RyaW5nIHtcbi8vICAgLy8gT3B0aW9uYWw6IHNwbGl0IHN1YnBvaW50cyBsaWtlIFwiYS5cIiwgXCJiLlwiLCBcIigxKVwiIHRoYXQgYXBwZWFyIEFGVEVSIGEgY29sb24gb3Igc2VtaWNvbG9uLlxuLy8gICAvLyBUaGlzIGlzIE9GRiBieSBkZWZhdWx0IHNvIHdlIGRvbid0IGJyZWFrIFwiQ29sLlwiLCBcIkVwaC5cIiwgZXRjLlxuLy8gICAvLyBpZiAob3B0cz8uc3BsaXRJbmxpbmVBZnRlckNvbG9uKSB7XG4vLyAgIHRleHQgPSBzcGxpdElubGluZUhlYWRpbmdzQWZ0ZXJDb2xvbih0ZXh0KTtcbi8vICAgLy8gfVxuXG4vLyAgIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgvXFxyP1xcbi8pO1xuLy8gICBjb25zdCBvdXRwdXQ6IHN0cmluZ1tdID0gW107XG4vLyAgIGxldCBidWZmZXIgPSBcIlwiO1xuXG4vLyAgIGNvbnN0IGlzSGVhZGluZyA9IChsaW5lOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbi8vICAgICBjb25zdCBzID0gbGluZS50cmltKCk7XG4vLyAgICAgLy8gXigoUm9tYW4pfFtBLVpdLnxkaWdpdHMufChwYXJlbikpXG4vLyAgICAgcmV0dXJuIC9eKChJezEsM318SVZ8VnxWSXxWSUl8VklJSXxJWHxYfFhJfFhJSXxYSUlJfFhJVnxYVnxYVkl8WFZJSXxYVklJSXxYSVh8WFgpW1xcLlxcKV18W0EtWl1bXFwuXFwpXXxcXGQrXFwuW1xcKV0/fFxcKFthLXpBLVowLTldK1xcKSkvLnRlc3Qocyk7XG4vLyAgIH07XG5cbi8vICAgY29uc3QgZ2V0TWRQcmVmaXggPSAoaXRlbTogc3RyaW5nKTogc3RyaW5nID0+IHtcbi8vICAgICBpZiAoL14oSXsxLDN9fElWfFZ8Vkl8VklJfFZJSUl8SVh8WHxYSXxYSUl8WElJSXxYSVZ8WFZ8WFZJfFhWSUl8WFZJSUl8WElYfFhYKVtcXC5cXCldLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCIjI1wiO1xuLy8gICAgIGVsc2UgaWYgKC9eXFxzKltBLVpdW1xcLlxcKV0vLnRlc3QoaXRlbSkpIHJldHVybiBcIiMjIyNcIjtcbi8vICAgICBlbHNlIGlmICgvXlxccypcXGQrXFwuLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCIjIyMjI1wiO1xuLy8gICAgIGVsc2UgaWYgKC9eXFxzKlthLXpdXFwuLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCIjIyMjIyNcIjtcbi8vICAgICBlbHNlIGlmICgvXlxccypcXChcXGQrXFwpLy50ZXN0KGl0ZW0pKSByZXR1cm4gXCJcIjtcbi8vICAgICBlbHNlIGlmICgvXlxccypcXChbYS16XVxcKS8udGVzdChpdGVtKSkgcmV0dXJuIFwiXCI7XG4vLyAgICAgZWxzZSByZXR1cm4gXCJcIjtcbi8vICAgfTtcblxuLy8gICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbi8vICAgICBjb25zdCBzdHJpcHBlZCA9IGxpbmUudHJpbSgpO1xuLy8gICAgIGlmICghc3RyaXBwZWQpIGNvbnRpbnVlO1xuXG4vLyAgICAgaWYgKGlzSGVhZGluZyhzdHJpcHBlZCkpIHtcbi8vICAgICAgIGlmIChidWZmZXIpIG91dHB1dC5wdXNoKGJ1ZmZlci50cmltKCkpO1xuLy8gICAgICAgYnVmZmVyID0gXCJcIjtcblxuLy8gICAgICAgLy8gc3BsaXQobWF4c3BsaXQ9MSlcbi8vICAgICAgIGNvbnN0IGZpcnN0U3BhY2UgPSBzdHJpcHBlZC5pbmRleE9mKFwiIFwiKTtcbi8vICAgICAgIGNvbnN0IGl0ZW0gPSBmaXJzdFNwYWNlID09PSAtMSA/IHN0cmlwcGVkIDogc3RyaXBwZWQuc2xpY2UoMCwgZmlyc3RTcGFjZSk7XG4vLyAgICAgICBjb25zdCBjb250ZW50ID0gZmlyc3RTcGFjZSA9PT0gLTEgPyBcIlwiIDogc3RyaXBwZWQuc2xpY2UoZmlyc3RTcGFjZSArIDEpO1xuXG4vLyAgICAgICBjb25zdCBwcmVmaXggPSBnZXRNZFByZWZpeChpdGVtKTtcbi8vICAgICAgIGJ1ZmZlciA9IGAke3ByZWZpeH0gJHtpdGVtfSAke2NvbnRlbnR9YC50cmltKCk7XG4vLyAgICAgfSBlbHNlIHtcbi8vICAgICAgIGJ1ZmZlciArPSBgICR7c3RyaXBwZWR9YDtcbi8vICAgICB9XG4vLyAgIH1cblxuLy8gICBpZiAoYnVmZmVyKSBvdXRwdXQucHVzaChidWZmZXIudHJpbSgpKTtcbi8vICAgcmV0dXJuIG91dHB1dC5qb2luKFwiXFxuXCIpO1xuLy8gfVxuXG4vKipcbiAqIFNBRkVMWSBzcGxpdCBpbmxpbmUgc3VicG9pbnRzIE9OTFkgd2hlbiB0aGV5IGNvbWUgcmlnaHQgYWZ0ZXIgYSBjb2xvbi9zZW1pY29sb24sXG4gKiBlLmcuIFx1MjAxQ1x1MjAyNiB2LiA5OiBhLiBGdWxsbmVzcyBcdTIwMjYgYi4gV2hlbiBcdTIwMjYgMS4gU29tZXRoaW5nIFx1MjAyNlx1MjAxRFxuICogVGhpcyB3aWxsIE5PVCBzcGxpdCBcdTIwMThDb2wuXHUyMDE5IC8gXHUyMDE4RXBoLlx1MjAxOSBiZWNhdXNlIHRob3NlIGFyZW5cdTIwMTl0IHByZWNlZGVkIGJ5ICc6JyBvciAnOycuXG4gKi9cbmZ1bmN0aW9uIHNwbGl0SW5saW5lSGVhZGluZ3NBZnRlckNvbG9uKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vIEluc2VydCBhIG5ld2xpbmUgYWZ0ZXIgXCI6XCIgb3IgXCI7XCIgQkVGT1JFIGEgdG9rZW4gdGhhdCBsb29rcyBsaWtlIGEgc3VicG9pbnQuXG4gIC8vIFRva2VucyBzdXBwb3J0ZWQ6ICBhLiAgYi4gIDEuICAxMC4gIChhKSAgKDEpXG4gIC8vIEtlZXAgdGhlIHB1bmN0dWF0aW9uICg6JDEpIGFuZCBhZGQgdGhlIG5ld2xpbmUgaW4gJDIuXG4gIHJldHVybiB0ZXh0XG4gICAgLy8gQWZ0ZXIgXCI6XCIgb3IgXCI7XCIgdGhlbiBzcGFjZShzKSAtPiBiZWZvcmUgW2Etel0uICAoZXhjbHVkZSB2LiBieSBub3QgbmVlZGVkOiB3ZSBvbmx5IHNwbGl0IGFmdGVyIFwiOlwiIC8gXCI7XCIpXG4gICAgLnJlcGxhY2UoLyhbOjtdKVxccysoPz0oW2Etel1cXC58XFwoXFx3K1xcKXxcXGQrXFwuKSkvZywgXCIkMVxcblwiKVxuICAgIC8vIEFsc28gc3VwcG9ydCBlbS9lbiBkYXNoIFwiXHUyMDE0XCIgZm9sbG93ZWQgYnkgdmVyc2UgXCJ2LlwiIHdpdGggbnVtYmVyLCB0aGVuIGNvbG9uOiBcIlx1MjAxNHYuIDk6XCIgYSBjb21tb24gcGF0dGVyblxuICAgIC5yZXBsYWNlKC8oXHUyMDE0XFxzKnZcXC5cXHMqXFxkK1thLXpdPzopXFxzKyg/PShbYS16XVxcLnxcXChcXHcrXFwpfFxcZCtcXC4pKS9naSwgXCIkMVxcblwiKTtcbn1cblxuXG5cblxuXG4vLyAvLyA9PT09PT09PT09PT09PT09PT09PT1cbi8vIC8vIE51bWJlcmluZyBkZXRlY3Rpb25cbi8vIC8vID09PT09PT09PT09PT09PT09PT09PVxuLy8gY29uc3QgUk9NQU4gPSAvXihJezEsM318SVZ8VnxWSXxWSUl8VklJSXxJWHxYfFhJfFhJSXxYSUlJfFhJVnxYVilbXFwuXFwpXVxccy87XG4vLyBjb25zdCBVUFBFUiA9IC9eW0EtWl1bXFwuXFwpXVxccy87XG4vLyBjb25zdCBMT1dFUiA9IC9eW2Etel1bXFwuXFwpXVxccy87ICAgICAgICAgICAgICAvLyBlLmcuLCBcImEuIFwiXG4vLyBjb25zdCBOVU1FUklDID0gL15cXGQrW1xcLlxcKV1cXHMvOyAgICAgICAgICAgICAgLy8gZS5nLiwgXCIxLiBcIiBvciBcIjEwKSBcIlxuLy8gY29uc3QgUEFSRU4gPSAvXlxcKFthLXpBLVowLTldK1xcKVxccy87ICAgICAgICAgLy8gZS5nLiwgXCIoYSkgXCIgXCIoMSkgXCJcblxuLy8gLyoqIHRydWUgaWZmIHRoZSBsaW5lIGJlZ2lucyBhIG5ldyBudW1iZXJlZCBpdGVtICovXG4vLyBleHBvcnQgZnVuY3Rpb24gc3RhcnRzV2l0aE51bWJlcmluZyhsaW5lOiBzdHJpbmcpOiBib29sZWFuIHtcbi8vICAgcmV0dXJuIFJPTUFOLnRlc3QobGluZSkgfHwgVVBQRVIudGVzdChsaW5lKSB8fCBMT1dFUi50ZXN0KGxpbmUpIHx8IE5VTUVSSUMudGVzdChsaW5lKSB8fCBQQVJFTi50ZXN0KGxpbmUpO1xuLy8gfVxuXG4vLyAvKiogcmVtb3ZlIHBhZ2UtbnVtYmVyLW9ubHkgbGluZXMgYW5kIHRyaW0gd2hpdGVzcGFjZSAqL1xuLy8gZnVuY3Rpb24gcHJlcHJvY2Vzc0xpbmVzKGlucHV0OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4vLyAgIHJldHVybiBpbnB1dFxuLy8gICAgIC5zcGxpdCgvXFxyP1xcbi8pXG4vLyAgICAgLm1hcChsID0+IGwudHJpbSgpKVxuLy8gICAgIC8vIC5maWx0ZXIobCA9PiBsLmxlbmd0aCA+IDAgJiYgIS9eXFxkKyQvLnRlc3QobCkpOyAvLyBkcm9wIHB1cmUgcGFnZSBudW1iZXJzIGxpa2UgXCIxNFwiXG4vLyB9XG5cbi8vIC8qKiBqb2luIHNvZnQgaHlwaGVuYXRlZCBicmVha3Mgd2hlbiBtZXJnaW5nIChcdTIwMjYgXCJpbGx1cy1cIiArIFwidHJhdGVkXCIgXHUyMTkyIFwiaWxsdXN0cmF0ZWRcIikgKi9cbi8vIGZ1bmN0aW9uIGpvaW5XaXRoSHlwaGVuRml4KHByZXY6IHN0cmluZywgbmV4dDogc3RyaW5nKTogc3RyaW5nIHtcbi8vICAgLy8gSWYgcHJldiBlbmRzIHdpdGggYSBoeXBoZW4tbGlrZSBjaGFyLCBkcm9wIGl0IGFuZCBkb24ndCBhZGQgYSBzcGFjZVxuLy8gICBpZiAoL1tcdTIwMTAtXHUyMDEyXHUyMDEzXHUyMDE0LV0kLy50ZXN0KHByZXYpKSB7XG4vLyAgICAgcmV0dXJuIHByZXYucmVwbGFjZSgvW1x1MjAxMC1cdTIwMTJcdTIwMTNcdTIwMTQtXSQvLCBcIlwiKSArIG5leHQucmVwbGFjZSgvXltcdTIwMTAtXHUyMDEyXHUyMDEzXHUyMDE0LV1cXHMqLywgXCJcIik7XG4vLyAgIH1cbi8vICAgLy8gT3RoZXJ3aXNlIGpvaW4gd2l0aCBhIHNpbmdsZSBzcGFjZVxuLy8gICByZXR1cm4gKHByZXYgKyBcIiBcIiArIG5leHQpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xuLy8gfVxuXG4vLyAvKipcbi8vICAqIE5vcm1hbGl6ZSByYXcgb3V0bGluZSB0ZXh0IHRvIG9uZSBsb2dpY2FsIGxpbmUgcGVyIG51bWJlcmVkIGl0ZW06XG4vLyAgKiAtIE9ubHkgc3RhcnQgYSBuZXcgb3V0cHV0IGxpbmUgd2hlbiB0aGUgKmN1cnJlbnQqIGlucHV0IGxpbmUgYmVnaW5zIHdpdGggYSBudW1iZXJpbmcgdG9rZW5cbi8vICAqIC0gT3RoZXJ3aXNlLCBtZXJnZSB0aGUgbGluZSBpbnRvIHRoZSBwcmV2aW91cyBvdXRwdXQgbGluZSAoZml4aW5nIGh5cGhlbmF0ZWQgbGluZSBicmVha3MpXG4vLyAgKiAtIFRleHQgYmVmb3JlIHRoZSBmaXJzdCBudW1iZXJlZCBpdGVtIGlzIGlnbm9yZWQgKHBlciB5b3VyIHJ1bGUpXG4vLyAgKi9cbi8vIGV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVCcmVha3NCeU51bWJlcmluZyhpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbi8vICAgY29uc3QgbGluZXMgPSBwcmVwcm9jZXNzTGluZXMoaW5wdXQpO1xuLy8gICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4vLyAgIGxldCBjdXIgPSBcIlwiO1xuLy8gICBsZXQgaGF2ZUN1cnJlbnQgPSBmYWxzZTsgLy8gb25seSBvdXRwdXQgb25jZSB3ZSBoaXQgZmlyc3QgbnVtYmVyaW5nXG5cbi8vICAgZm9yIChjb25zdCByYXcgb2YgbGluZXMpIHtcbi8vICAgICBjb25zdCBsaW5lID0gcmF3OyAvLyBhbHJlYWR5IHRyaW1tZWRcbi8vICAgICBpZiAoc3RhcnRzV2l0aE51bWJlcmluZyhsaW5lKSkge1xuLy8gICAgICAgLy8gY29tbWl0IHByZXZpb3VzXG4vLyAgICAgICBpZiAoaGF2ZUN1cnJlbnQgJiYgY3VyKSBvdXQucHVzaChjdXIudHJpbSgpKTtcbi8vICAgICAgIC8vIHN0YXJ0IG5ldyBpdGVtXG4vLyAgICAgICBjdXIgPSBsaW5lO1xuLy8gICAgICAgaGF2ZUN1cnJlbnQgPSB0cnVlO1xuLy8gICAgIH0gZWxzZSB7XG4vLyAgICAgICAvLyBtZXJnZSBvbmx5IGlmIHdlJ3ZlIHN0YXJ0ZWQgYSBudW1iZXJlZCBpdGVtOyBvdGhlcndpc2UgaWdub3JlIHByZWFtYmxlXG4vLyAgICAgICAvLyBpZiAoIWhhdmVDdXJyZW50KSBjb250aW51ZTtcbi8vICAgICAgIGN1ciA9IGpvaW5XaXRoSHlwaGVuRml4KGN1ciwgbGluZSk7XG4vLyAgICAgfVxuLy8gICB9XG5cbi8vICAgaWYgKGhhdmVDdXJyZW50ICYmIGN1cikgb3V0LnB1c2goY3VyLnRyaW0oKSk7XG4vLyAgIHJldHVybiBvdXQuam9pbihcIlxcblwiKTtcbi8vIH1cblxuLy8gLy8gPT09PT09PT09PT09PT09PT09PT09XG4vLyAvLyBNYXJrZG93biBjb252ZXJzaW9uXG4vLyAvLyA9PT09PT09PT09PT09PT09PT09PT1cblxuLy8gLyoqIE1hcCBhIG51bWJlcmluZyB0b2tlbiB0byBhIE1hcmtkb3duIGhlYWRpbmcgbGV2ZWwgKi9cbi8vIGV4cG9ydCBmdW5jdGlvbiBtZFByZWZpeEZvclRva2VuKHRva2VuOiBzdHJpbmcpOiBzdHJpbmcge1xuLy8gICBjb25zdCByb21hbiA9IC9eKEl7MSwzfXxJVnxWfFZJfFZJSXxWSUlJfElYfFh8WEl8WElJfFhJSUl8WElWfFhWKVtcXC5cXCldJC9pO1xuLy8gICBjb25zdCB1cHBlciA9IC9eW0EtWl1bXFwuXFwpXSQvO1xuLy8gICBjb25zdCBsb3dlciA9IC9eW2Etel1bXFwuXFwpXSQvO1xuLy8gICBjb25zdCBudW1lcmljID0gL15cXGQrW1xcLlxcKV0/JC87XG4vLyAgIGNvbnN0IHBhcmVuID0gL15cXChbYS16QS1aMC05XStcXCkkLztcblxuLy8gICBpZiAocm9tYW4udGVzdCh0b2tlbikpIHJldHVybiBcIiMjXCI7ICAgICAgLy8gdG9wIGxldmVsXG4vLyAgIGlmICh1cHBlci50ZXN0KHRva2VuKSkgcmV0dXJuIFwiIyMjXCI7XG4vLyAgIGlmIChudW1lcmljLnRlc3QodG9rZW4pKSByZXR1cm4gXCIjIyMjXCI7XG4vLyAgIGlmIChsb3dlci50ZXN0KHRva2VuKSkgcmV0dXJuIFwiIyMjIyNcIjtcbi8vICAgaWYgKHBhcmVuLnRlc3QodG9rZW4pKSByZXR1cm4gXCIjIyMjIyNcIjtcbi8vICAgcmV0dXJuIFwiXCI7XG4vLyB9XG5cbi8vIC8qKiBBIGxpbmUgaXMgYW4gb3V0bGluZSBoZWFkaW5nIGxpbmUgaWYgaXQgc3RhcnRzIHdpdGggYSBudW1iZXJpbmcgdG9rZW4gKi9cbi8vIGV4cG9ydCBmdW5jdGlvbiBpc091dGxpbmVIZWFkaW5nTGluZShsaW5lOiBzdHJpbmcpOiBib29sZWFuIHtcbi8vICAgY29uc3QgcyA9IGxpbmUudHJpbSgpO1xuLy8gICByZXR1cm4gUk9NQU4udGVzdChzKSB8fCBVUFBFUi50ZXN0KHMpIHx8IExPV0VSLnRlc3QocykgfHwgTlVNRVJJQy50ZXN0KHMpIHx8IFBBUkVOLnRlc3Qocyk7XG4vLyB9XG5cbi8vIC8qKlxuLy8gICogQ29udmVydCBub3JtYWxpemVkIG91dGxpbmUgdGV4dCAob25lIG51bWJlcmVkIGl0ZW0gcGVyIGxpbmUpIGludG8gTWFya2Rvd25cbi8vICAqIGhlYWRpbmdzIGJhc2VkIG9uIHRoZSBudW1iZXJpbmcgdG9rZW4uXG4vLyAgKlxuLy8gICogSWYgeW91IHBhc3MgcmF3IGlucHV0LCB0aGlzIHdpbGwgZmlyc3Qgbm9ybWFsaXplIGl0LlxuLy8gICovXG4vLyBleHBvcnQgZnVuY3Rpb24gZm9ybWF0T3V0bGluZVRleHQoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4vLyAgIC8vIFN0ZXAgMTogbm9ybWFsaXplIHRvIG9uZSBudW1iZXJlZCBpdGVtIHBlciBsaW5lXG4vLyAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVCcmVha3NCeU51bWJlcmluZyhpbnB1dCk7XG4vLyAgIGNvbnN0IGxpbmVzID0gbm9ybWFsaXplZC5zcGxpdCgvXFxyP1xcbi8pO1xuXG4vLyAgIC8vIFN0ZXAgMjogY29udmVydCBlYWNoIGxpbmUgdG8gYSBoZWFkaW5nIGJhc2VkIG9uIGl0cyB0b2tlblxuLy8gICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG5cbi8vICAgZm9yIChjb25zdCByYXcgb2YgbGluZXMpIHtcbi8vICAgICBjb25zdCBsaW5lID0gcmF3LnRyaW0oKTtcbi8vICAgICBpZiAoIWxpbmUpIGNvbnRpbnVlO1xuXG4vLyAgICAgLy8gbXVzdCBzdGFydCB3aXRoIGEgbnVtYmVyaW5nIHRva2VuXG4vLyAgICAgaWYgKCFpc091dGxpbmVIZWFkaW5nTGluZShsaW5lKSkge1xuLy8gICAgICAgLy8gU2FmZXR5OiBpZiBpdCBzbGlwcyB0aHJvdWdoLCBhcHBlbmQgdG8gcHJldmlvdXMgbGluZVxuLy8gICAgICAgaWYgKG91dC5sZW5ndGgpIHtcbi8vICAgICAgICAgb3V0W291dC5sZW5ndGggLSAxXSA9IGpvaW5XaXRoSHlwaGVuRml4KG91dFtvdXQubGVuZ3RoIC0gMV0sIGxpbmUpO1xuLy8gICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgb3V0LnB1c2gobGluZSk7XG4vLyAgICAgICB9XG4vLyAgICAgICBjb250aW51ZTtcbi8vICAgICB9XG5cbi8vICAgICBjb25zdCBwYXJ0cyA9IGxpbmUuc3BsaXQoL1xccysvLCAyKTtcbi8vICAgICBjb25zdCB0b2tlbiA9IHBhcnRzWzBdLnJlcGxhY2UoLzokLywgXCJcIik7XG4vLyAgICAgY29uc3QgcmVzdCA9IHBhcnRzLmxlbmd0aCA+IDEgPyBwYXJ0c1sxXSA6IFwiXCI7XG4vLyAgICAgY29uc3QgcHJlZml4ID0gbWRQcmVmaXhGb3JUb2tlbih0b2tlbik7XG4vLyAgICAgY29uc3QgcmVuZGVyZWQgPSAocHJlZml4ID8gYCR7cHJlZml4fSAke3Rva2VufSAke3Jlc3R9YCA6IGxpbmUpLnRyaW0oKTtcblxuLy8gICAgIG91dC5wdXNoKHJlbmRlcmVkKTtcbi8vICAgfVxuXG4vLyAgIHJldHVybiBvdXQuam9pbihcIlxcblwiKTtcbi8vIH0iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlLCBTZXR0aW5nLCBURmlsZSwgVEZvbGRlciwgbm9ybWFsaXplUGF0aCwgcmVxdWVzdFVybCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBCT09LX0FCQlIgfSBmcm9tIFwiLi4vbGliL3ZlcnNlTWFwXCI7XG5pbXBvcnQgeyBCdWlsZEJpYmxlTW9kYWwgfSBmcm9tIFwic3JjL3VpL2J1aWxkLWJpYmxlLW1vZGFsXCI7XG5cbi8vIC0tLS0tLS0tLS0gVHlwZXMgLS0tLS0tLS0tLVxudHlwZSBMYW5ndWFnZXNFbnRyeSA9IHtcbiAgbGFuZ3VhZ2U6IHN0cmluZzsgLy8gZS5nLiBcIkVuZ2xpc2hcIlxuICB0cmFuc2xhdGlvbnM6IEFycmF5PHtcbiAgICBzaG9ydF9uYW1lOiBzdHJpbmc7IC8vIGUuZy4gXCJLSlZcIlxuICAgIGZ1bGxfbmFtZTogc3RyaW5nOyAgLy8gZS5nLiBcIktpbmcgSmFtZXMgVmVyc2lvbiAuLi5cIlxuICAgIHVwZGF0ZWQ/OiBudW1iZXI7XG4gICAgZGlyPzogXCJydGxcIiB8IFwibHRyXCI7XG4gIH0+O1xufTtcblxudHlwZSBCb2xsc0Jvb2tNZXRhID0ge1xuICBib29raWQ6IG51bWJlcjtcbiAgY2hyb25vcmRlcjogbnVtYmVyO1xuICBuYW1lOiBzdHJpbmc7XG4gIGNoYXB0ZXJzOiBudW1iZXI7XG59O1xuXG50eXBlIEJvbGxzVmVyc2UgPSB7XG4gIHBrOiBudW1iZXI7XG4gIHZlcnNlOiBudW1iZXI7XG4gIHRleHQ6IHN0cmluZzsgICAvLyBIVE1MXG4gIGNvbW1lbnQ/OiBzdHJpbmc7XG59O1xuXG5jb25zdCBCT0xMUyA9IHtcbiAgTEFOR1VBR0VTX1VSTDogXCJodHRwczovL2JvbGxzLmxpZmUvc3RhdGljL2JvbGxzL2FwcC92aWV3cy9sYW5ndWFnZXMuanNvblwiLFxuICBHRVRfQk9PS1M6ICh0cjogc3RyaW5nKSA9PiBgaHR0cHM6Ly9ib2xscy5saWZlL2dldC1ib29rcy8ke2VuY29kZVVSSUNvbXBvbmVudCh0cil9L2AsXG4gIEdFVF9DSEFQVEVSOiAodHI6IHN0cmluZywgYm9va0lkOiBudW1iZXIsIGNoOiBudW1iZXIpID0+XG4gICAgYGh0dHBzOi8vYm9sbHMubGlmZS9nZXQtdGV4dC8ke2VuY29kZVVSSUNvbXBvbmVudCh0cil9LyR7Ym9va0lkfS8ke2NofS9gLFxufTtcblxuLy8gQ2Fub25pY2FsIGJvb2sgbmFtZSBieSBJRCAoNjYtYm9vayBQcm90ZXN0YW50IGJhc2VsaW5lKVxuY29uc3QgQ0FOT05fRU5fQllfSUQ6IFJlY29yZDxudW1iZXIsIHN0cmluZz4gPSB7XG4gIDE6XCJHZW5lc2lzXCIsMjpcIkV4b2R1c1wiLDM6XCJMZXZpdGljdXNcIiw0OlwiTnVtYmVyc1wiLDU6XCJEZXV0ZXJvbm9teVwiLFxuICA2OlwiSm9zaHVhXCIsNzpcIkp1ZGdlc1wiLDg6XCJSdXRoXCIsOTpcIjEgU2FtdWVsXCIsMTA6XCIyIFNhbXVlbFwiLFxuICAxMTpcIjEgS2luZ3NcIiwxMjpcIjIgS2luZ3NcIiwxMzpcIjEgQ2hyb25pY2xlc1wiLDE0OlwiMiBDaHJvbmljbGVzXCIsMTU6XCJFenJhXCIsXG4gIDE2OlwiTmVoZW1pYWhcIiwxNzpcIkVzdGhlclwiLDE4OlwiSm9iXCIsMTk6XCJQc2FsbXNcIiwyMDpcIlByb3ZlcmJzXCIsXG4gIDIxOlwiRWNjbGVzaWFzdGVzXCIsMjI6XCJTb25nIG9mIFNvbmdzXCIsMjM6XCJJc2FpYWhcIiwyNDpcIkplcmVtaWFoXCIsMjU6XCJMYW1lbnRhdGlvbnNcIixcbiAgMjY6XCJFemVraWVsXCIsMjc6XCJEYW5pZWxcIiwyODpcIkhvc2VhXCIsMjk6XCJKb2VsXCIsMzA6XCJBbW9zXCIsXG4gIDMxOlwiT2JhZGlhaFwiLDMyOlwiSm9uYWhcIiwzMzpcIk1pY2FoXCIsMzQ6XCJOYWh1bVwiLDM1OlwiSGFiYWtrdWtcIixcbiAgMzY6XCJaZXBoYW5pYWhcIiwzNzpcIkhhZ2dhaVwiLDM4OlwiWmVjaGFyaWFoXCIsMzk6XCJNYWxhY2hpXCIsXG4gIDQwOlwiTWF0dGhld1wiLDQxOlwiTWFya1wiLDQyOlwiTHVrZVwiLDQzOlwiSm9oblwiLDQ0OlwiQWN0c1wiLDQ1OlwiUm9tYW5zXCIsXG4gIDQ2OlwiMSBDb3JpbnRoaWFuc1wiLDQ3OlwiMiBDb3JpbnRoaWFuc1wiLDQ4OlwiR2FsYXRpYW5zXCIsNDk6XCJFcGhlc2lhbnNcIixcbiAgNTA6XCJQaGlsaXBwaWFuc1wiLDUxOlwiQ29sb3NzaWFuc1wiLDUyOlwiMSBUaGVzc2Fsb25pYW5zXCIsNTM6XCIyIFRoZXNzYWxvbmlhbnNcIixcbiAgNTQ6XCIxIFRpbW90aHlcIiw1NTpcIjIgVGltb3RoeVwiLDU2OlwiVGl0dXNcIiw1NzpcIlBoaWxlbW9uXCIsNTg6XCJIZWJyZXdzXCIsXG4gIDU5OlwiSmFtZXNcIiw2MDpcIjEgUGV0ZXJcIiw2MTpcIjIgUGV0ZXJcIiw2MjpcIjEgSm9oblwiLDYzOlwiMiBKb2huXCIsXG4gIDY0OlwiMyBKb2huXCIsNjU6XCJKdWRlXCIsNjY6XCJSZXZlbGF0aW9uXCIsXG59O1xuXG5mdW5jdGlvbiBzaG9ydEFiYnJGb3IoYm9va0lkOiBudW1iZXIsIGluY29taW5nTmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgY2Fub24gPSBDQU5PTl9FTl9CWV9JRFtib29rSWRdO1xuICBpZiAoY2Fub24gJiYgQk9PS19BQkJSW2Nhbm9uXSkgcmV0dXJuIEJPT0tfQUJCUltjYW5vbl07XG4gIGlmIChCT09LX0FCQlJbaW5jb21pbmdOYW1lXSkgcmV0dXJuIEJPT0tfQUJCUltpbmNvbWluZ05hbWVdO1xuICByZXR1cm4gaW5jb21pbmdOYW1lO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEpzb248VD4odXJsOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcbiAgLy8gUHJlZmVyIE9ic2lkaWFuJ3MgcmVxdWVzdFVybCAobm8gQ09SUyByZXN0cmljdGlvbnMpXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHJlcXVlc3RVcmwoeyB1cmwsIG1ldGhvZDogXCJHRVRcIiB9KTtcbiAgICBpZiAocmVzcC5zdGF0dXMgPCAyMDAgfHwgcmVzcC5zdGF0dXMgPj0gMzAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7cmVzcC5zdGF0dXN9IFJlcXVlc3QgZmFpbGVkYCk7XG4gICAgfVxuICAgIGNvbnN0IHRleHQgPSByZXNwLnRleHQgPz8gXCJcIjtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UodGV4dCkgYXMgVDtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBKU09OIGZyb20gJHt1cmx9YCk7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBGYWxsYmFjayB0byBmZXRjaCBmb3Igbm9uLU9ic2lkaWFuIGNvbnRleHRzIChlLmcuLCB0ZXN0cylcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwgeyBtZXRob2Q6IFwiR0VUXCIgfSk7XG4gICAgICBpZiAoIXIub2spIHRocm93IG5ldyBFcnJvcihgJHtyLnN0YXR1c30gJHtyLnN0YXR1c1RleHR9YCk7XG4gICAgICByZXR1cm4gKGF3YWl0IHIuanNvbigpKSBhcyBUO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIFN1cmZhY2UgdGhlIG9yaWdpbmFsIHJlcXVlc3RVcmwgZXJyb3IgaWYgYm90aCBmYWlsXG4gICAgICB0aHJvdyBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyKSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBodG1sVG9UZXh0KGh0bWw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBodG1sXG4gICAgLnJlcGxhY2UoLzxiclxccypcXC8/Pi9naSwgXCJcXG5cIilcbiAgICAucmVwbGFjZSgvPFxcLz8oaXxlbXxzdHJvbmd8Ynx1fHN1cHxzdWJ8c3BhbnxwfGRpdnxibG9ja3F1b3RlfHNtYWxsfGZvbnQpW14+XSo+L2dpLCBcIlwiKVxuICAgIC5yZXBsYWNlKC8mbmJzcDsvZywgXCIgXCIpXG4gICAgLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKVxuICAgIC5yZXBsYWNlKC8mbHQ7L2csIFwiPFwiKVxuICAgIC5yZXBsYWNlKC8mZ3Q7L2csIFwiPlwiKVxuICAgIC5yZXBsYWNlKC9cXHMrXFxuL2csIFwiXFxuXCIpXG4gICAgLnJlcGxhY2UoL1xcbnszLH0vZywgXCJcXG5cXG5cIilcbiAgICAudHJpbSgpO1xufVxuXG4vLyAtLS0tLS0tLS0tIEJ1aWxkZXIgY29yZSAtLS0tLS0tLS0tXG50eXBlIEJ1aWxkT3B0aW9ucyA9IHtcbiAgdHJhbnNsYXRpb25Db2RlOiBzdHJpbmc7XG4gIHRyYW5zbGF0aW9uRnVsbDogc3RyaW5nO1xuICBpbmNsdWRlVmVyc2lvbkluRmlsZU5hbWU6IGJvb2xlYW47XG4gIHZlcnNpb25Bc1N1YmZvbGRlcjogYm9vbGVhbjtcbiAgYXV0b0Zyb250bWF0dGVyOiBib29sZWFuO1xuICBjb25jdXJyZW5jeTogbnVtYmVyO1xufTtcbnR5cGUgUHJvZ3Jlc3NGbiA9IChkb25lOiBudW1iZXIsIHRvdGFsOiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZDtcblxuZnVuY3Rpb24gbm93SXNvRGF0ZSgpOiBzdHJpbmcge1xuICBjb25zdCBkID0gbmV3IERhdGUoKTtcbiAgY29uc3QgbW0gPSBTdHJpbmcoZC5nZXRNb250aCgpKzEpLnBhZFN0YXJ0KDIsXCIwXCIpO1xuICBjb25zdCBkZCA9IFN0cmluZyhkLmdldERhdGUoKSkucGFkU3RhcnQoMixcIjBcIik7XG4gIHJldHVybiBgJHtkLmdldEZ1bGxZZWFyKCl9LSR7bW19LSR7ZGR9YDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW5zdXJlRm9sZGVyKGFwcDogQXBwLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRGb2xkZXI+IHtcbiAgY29uc3QgbnAgPSBub3JtYWxpemVQYXRoKHBhdGgucmVwbGFjZSgvXFwvKyQvLFwiXCIpKTtcbiAgbGV0IGYgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5wKTtcbiAgaWYgKGYgaW5zdGFuY2VvZiBURm9sZGVyKSByZXR1cm4gZjtcbiAgYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihucCk7XG4gIGNvbnN0IGNyZWF0ZWQgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5wKTtcbiAgaWYgKGNyZWF0ZWQgaW5zdGFuY2VvZiBURm9sZGVyKSByZXR1cm4gY3JlYXRlZDtcbiAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gY3JlYXRlIGZvbGRlcjogJHtucH1gKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRCb29rRmlsZW5hbWUoYmFzZVNob3J0OiBzdHJpbmcsIGNvZGU6IHN0cmluZywgaW5jbHVkZVZlcnNpb246IGJvb2xlYW4pOiBzdHJpbmcge1xuICByZXR1cm4gaW5jbHVkZVZlcnNpb24gPyBgJHtiYXNlU2hvcnR9ICgke2NvZGV9KWAgOiBiYXNlU2hvcnQ7XG59XG5cbmZ1bmN0aW9uIGNoYXB0ZXJOYXZMaW5lKGJvb2tTaG9ydDogc3RyaW5nLCBjaGFwdGVyczogbnVtYmVyKTogc3RyaW5nIHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG4gIGZvciAobGV0IGM9MTsgYzw9Y2hhcHRlcnM7IGMrKykge1xuICAgIGNvbnN0IGxhYiA9IChjICUgNSA9PT0gMCB8fCBjID09PSAxIHx8IGMgPT09IGNoYXB0ZXJzKSA/IFN0cmluZyhjKSA6IFwiXHUyMDIyXCI7XG4gICAgcGFydHMucHVzaChgW1ske2Jvb2tTaG9ydH0jXiR7Y318JHtsYWJ9XV1gKTtcbiAgfVxuICByZXR1cm4gYFxcbioqY2guKiogJHtwYXJ0cy5qb2luKFwiIFwiKX1cXG5gO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYnVpbGRCaWJsZUZyb21Cb2xscyhhcHA6IEFwcCwgb3B0czogQnVpbGRPcHRpb25zLCBvblByb2dyZXNzOiBQcm9ncmVzc0ZuKSB7XG4gIGNvbnN0IGJhc2VGb2xkZXIgPSBcIl9CaWJsZVwiO1xuICBjb25zdCByb290ID0gYXdhaXQgZW5zdXJlRm9sZGVyKGFwcCwgYmFzZUZvbGRlcik7XG4gIGNvbnN0IHBhcmVudCA9IG9wdHMudmVyc2lvbkFzU3ViZm9sZGVyXG4gICAgPyBhd2FpdCBlbnN1cmVGb2xkZXIoYXBwLCBgJHtiYXNlRm9sZGVyfS8ke29wdHMudHJhbnNsYXRpb25Db2RlfWApXG4gICAgOiByb290O1xuXG4gIGxldCBib29rczogQm9sbHNCb29rTWV0YVtdID0gW107XG4gIHRyeSB7XG4gICAgYm9va3MgPSBhd2FpdCBmZXRjaEpzb248Qm9sbHNCb29rTWV0YVtdPihCT0xMUy5HRVRfQk9PS1Mob3B0cy50cmFuc2xhdGlvbkNvZGUpKTtcbiAgfSBjYXRjaCAoZTphbnkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBsb2FkIGJvb2tzIGZvciAke29wdHMudHJhbnNsYXRpb25Db2RlfTogJHtlPy5tZXNzYWdlID8/IGV9YCk7XG4gIH1cbiAgaWYgKCFib29rcy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihcIk5vIGJvb2tzIHJldHVybmVkIGZyb20gQVBJLlwiKTtcblxuICBjb25zdCB0b3RhbCA9IGJvb2tzLnJlZHVjZSgoYWNjLGIpPT5hY2MgKyAoYi5jaGFwdGVyc3x8MCksIDApO1xuICBsZXQgZG9uZSA9IDA7XG5cbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgYm9vayBvZiBib29rcykge1xuICAgIGNvbnN0IHNob3J0Qm9vayA9IHNob3J0QWJickZvcihib29rLmJvb2tpZCwgYm9vay5uYW1lKTtcbiAgICBjb25zdCBzaG9ydFdpdGhBYmJyID0gYCR7c2hvcnRCb29rfSR7b3B0cy5pbmNsdWRlVmVyc2lvbkluRmlsZU5hbWUgPyBgICgke29wdHMudHJhbnNsYXRpb25Db2RlfSlgIDogXCJcIn1gO1xuICAgIGNvbnN0IGZpbGVCYXNlID0gYnVpbGRCb29rRmlsZW5hbWUoc2hvcnRCb29rLCBvcHRzLnRyYW5zbGF0aW9uQ29kZSwgb3B0cy5pbmNsdWRlVmVyc2lvbkluRmlsZU5hbWUpO1xuICAgIGNvbnN0IHRhcmdldFBhdGggPSBub3JtYWxpemVQYXRoKGAke3BhcmVudC5wYXRofS8ke2ZpbGVCYXNlfS5tZGApO1xuXG4gICAgY29uc3QgaGVhZGVyTGluZXM6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKG9wdHMuYXV0b0Zyb250bWF0dGVyKSB7XG4gICAgICBoZWFkZXJMaW5lcy5wdXNoKFxuICAgICAgICBcIi0tLVwiLFxuICAgICAgICBgdGl0bGU6IFwiJHtzaG9ydFdpdGhBYmJyfVwiYCxcbiAgICAgICAgYGJpYmxlX3RyYW5zbGF0aW9uX2NvZGU6IFwiJHtvcHRzLnRyYW5zbGF0aW9uQ29kZX1cImAsXG4gICAgICAgIGBiaWJsZV90cmFuc2xhdGlvbl9uYW1lOiBcIiR7b3B0cy50cmFuc2xhdGlvbkZ1bGx9XCJgLFxuICAgICAgICBgY3JlYXRlZDogJHtub3dJc29EYXRlKCl9YCxcbiAgICAgICAgXCItLS1cIixcbiAgICAgICAgXCJcIlxuICAgICAgKTtcbiAgICB9XG4gICAgaGVhZGVyTGluZXMucHVzaChgIyAke3Nob3J0V2l0aEFiYnJ9YCk7XG4gICAgaGVhZGVyTGluZXMucHVzaChjaGFwdGVyTmF2TGluZShzaG9ydFdpdGhBYmJyLCBib29rLmNoYXB0ZXJzKSk7XG4gICAgaGVhZGVyTGluZXMucHVzaChcIlwiKTtcblxuICAgIGNvbnN0IGNodW5rczogc3RyaW5nW10gPSBbaGVhZGVyTGluZXMuam9pbihcIlxcblwiKV07XG5cbiAgICBjb25zdCBxdWV1ZSA9IEFycmF5LmZyb20oe2xlbmd0aDogYm9vay5jaGFwdGVyc30sIChfLGkpPT5pKzEpO1xuICAgIGNvbnN0IGNvbmN1cnJlbmN5ID0gTWF0aC5tYXgoMSwgTWF0aC5taW4oOCwgb3B0cy5jb25jdXJyZW5jeSB8fCA0KSk7XG5cbiAgICAvLyBTaW1wbGUgcG9vbFxuICAgIGxldCBuZXh0ID0gMDtcbiAgICBjb25zdCB3b3JrZXJzID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBjb25jdXJyZW5jeX0sICgpID0+IChhc3luYyAoKSA9PiB7XG4gICAgICB3aGlsZSAobmV4dCA8IHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBjaCA9IHF1ZXVlW25leHQrK107XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgb25Qcm9ncmVzcyhkb25lLCB0b3RhbCwgYCR7c2hvcnRXaXRoQWJicn0gJHtjaH0vJHtib29rLmNoYXB0ZXJzfWApO1xuICAgICAgICAgIGNvbnN0IHZlcnNlcyA9IGF3YWl0IGZldGNoSnNvbjxCb2xsc1ZlcnNlW10+KEJPTExTLkdFVF9DSEFQVEVSKG9wdHMudHJhbnNsYXRpb25Db2RlLCBib29rLmJvb2tpZCwgY2gpKTtcbiAgICAgICAgICBjb25zdCBtYXhWID0gTWF0aC5tYXgoMCwgLi4udmVyc2VzLm1hcCh2ID0+IHYudmVyc2UpKTtcblxuICAgICAgICAgIGNvbnN0IHZ2TmF2ID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBtYXhWfSwgKF8saSk9PmkrMSlcbiAgICAgICAgICAgIC5tYXAodiA9PiBgW1ske3Nob3J0V2l0aEFiYnJ9I14ke2NofS0ke3Z9fCR7diAlIDUgPT09IDAgPyB2IDogXCJcdTIwMjJcIn1dXWApLmpvaW4oXCIgXCIpO1xuXG4gICAgICAgICAgY29uc3QgcHJldkxpbmsgPSBjaCA+IDEgPyBgW1ske3Nob3J0V2l0aEFiYnJ9I14ke2NoLTF9fDwtIFByZXZpb3VzXV1gIDogXCJcdTIxOTBcIjtcbiAgICAgICAgICBjb25zdCBuZXh0TGluayA9IGNoIDwgYm9vay5jaGFwdGVycyA/IGBbWyR7c2hvcnRXaXRoQWJicn0jXiR7Y2grMX18TmV4dCAtPl1dYCA6IFwiXHUyMTkyXCI7XG4gICAgICAgICAgY29uc3QgbWlkID0gYFtbJHtzaG9ydFdpdGhBYmJyfSMke3Nob3J0V2l0aEFiYnJ9fCR7c2hvcnRCb29rfSAke2NofSBvZiAke2Jvb2suY2hhcHRlcnN9XV1gO1xuXG4gICAgICAgICAgY29uc3QgdG9wID0gW1xuICAgICAgICAgICAgXCItLS1cIixcbiAgICAgICAgICAgIGAke3ByZXZMaW5rfSB8ICR7bWlkfSB8ICR7bmV4dExpbmt9IHwgKip2di4qKiAke3Z2TmF2fSBeJHtjaH1gLFxuICAgICAgICAgICAgXCJcXG4tLS1cXG5cIixcbiAgICAgICAgICAgIFwiXCJcbiAgICAgICAgICBdLmpvaW4oXCJcXG5cIik7XG5cbiAgICAgICAgICBjb25zdCB2ZXJzZXNNZCA9IHZlcnNlcy5tYXAodiA9PiB7XG4gICAgICAgICAgICBjb25zdCBwbGFpbiA9IGh0bWxUb1RleHQodi50ZXh0KS50cmltKCk7XG4gICAgICAgICAgICByZXR1cm4gYCoqJHtzaG9ydFdpdGhBYmJyfSAke2NofToke3YudmVyc2V9KiogLSAke3BsYWlufSBeJHtjaH0tJHt2LnZlcnNlfWA7XG4gICAgICAgICAgfSkuam9pbihcIlxcblxcblwiKTtcblxuICAgICAgICAgIGNodW5rc1tjaF0gPSBgJHt0b3B9JHt2ZXJzZXNNZH1cXG5cXG5gO1xuICAgICAgICB9IGNhdGNoIChlOmFueSkge1xuICAgICAgICAgIGVycm9ycy5wdXNoKGBbJHtvcHRzLnRyYW5zbGF0aW9uQ29kZX1dICR7c2hvcnRCb29rfSBjaC4ke2NofTogJHtlPy5tZXNzYWdlID8/IGV9YCk7XG4gICAgICAgICAgY2h1bmtzW2NoXSA9IGAtLS1cXG4oJHtzaG9ydEJvb2t9ICR7Y2h9KSBcdTIwMTQgZmFpbGVkIHRvIGRvd25sb2FkLlxcbl4ke2NofVxcbi0tLVxcblxcbmA7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgZG9uZSsrOyBvblByb2dyZXNzKGRvbmUsIHRvdGFsLCBgJHtzaG9ydEJvb2t9ICR7TWF0aC5taW4oY2gsIGJvb2suY2hhcHRlcnMpfS8ke2Jvb2suY2hhcHRlcnN9YCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KSgpKTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbCh3b3JrZXJzKTtcblxuICAgIGNvbnN0IGJvb2tDb250ZW50ID0gY2h1bmtzLmpvaW4oXCJcIik7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHRhcmdldFBhdGgpO1xuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGV4aXN0aW5nLCBib29rQ29udGVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IGFwcC52YXVsdC5jcmVhdGUodGFyZ2V0UGF0aCwgYm9va0NvbnRlbnQpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChlcnJvcnMubGVuZ3RoKSB7XG4gICAgLy8gY29uc3QgbG9nRm9sZGVyID0gYXdhaXQgZW5zdXJlRm9sZGVyKGFwcCwgYCR7YmFzZUZvbGRlcn0vX2xvZ3NgKTtcbiAgICAvLyBjb25zdCBsb2dQYXRoID0gbm9ybWFsaXplUGF0aChgJHtsb2dGb2xkZXIucGF0aH0vYmlibGUtYnVpbGQtJHtvcHRzLnRyYW5zbGF0aW9uQ29kZX0tJHtEYXRlLm5vdygpfS5tZGApO1xuICAgIC8vIGNvbnN0IGJvZHkgPSBbXG4gICAgLy8gICBgIyBCdWlsZCBMb2cgXHUyMDE0ICR7b3B0cy50cmFuc2xhdGlvbkNvZGV9YCxcbiAgICAvLyAgIGBEYXRlOiAke25ldyBEYXRlKCkudG9TdHJpbmcoKX1gLFxuICAgIC8vICAgXCJcIixcbiAgICAvLyAgIC4uLmVycm9ycy5tYXAoZSA9PiBgLSAke2V9YClcbiAgICAvLyBdLmpvaW4oXCJcXG5cIik7XG4gICAgLy8gYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZShsb2dQYXRoLCBib2R5KTtcbiAgICAvLyBuZXcgTm90aWNlKGBGaW5pc2hlZCB3aXRoICR7ZXJyb3JzLmxlbmd0aH0gZXJyb3IocykuIFNlZTogJHtsb2dQYXRofWApO1xuICAgIG5ldyBOb3RpY2UoYEZpbmlzaGVkIHdpdGggJHtlcnJvcnMubGVuZ3RofSBlcnJvcihzKS5gKTtcbiAgfSBlbHNlIHtcbiAgICBuZXcgTm90aWNlKFwiRmluaXNoZWQgd2l0aG91dCBlcnJvcnMuXCIpO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0gQ29tbWFuZCBlbnRyeSAtLS0tLS0tLS0tXG5leHBvcnQgZnVuY3Rpb24gY29tbWFuZEJ1aWxkQmlibGVGcm9tQm9sbHMoYXBwOiBBcHAsIF9zZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIG5ldyBCdWlsZEJpYmxlTW9kYWwoYXBwLCBfc2V0dGluZ3MpLm9wZW4oKTtcbn0iLCAiZXhwb3J0IGNvbnN0IEJPT0tfQUJCUjogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgXCJHZW5lc2lzXCI6IFwiR2VuXCIsXG4gIFwiRXhvZHVzXCI6IFwiRXhvXCIsXG4gIFwiTGV2aXRpY3VzXCI6IFwiTGV2XCIsXG4gIFwiTnVtYmVyc1wiOiBcIk51bVwiLFxuICBcIkRldXRlcm9ub215XCI6IFwiRGV1dFwiLFxuICBcIkpvc2h1YVwiOiBcIkpvc2hcIixcbiAgXCJKdWRnZXNcIjogXCJKdWRnXCIsXG4gIFwiUnV0aFwiOiBcIlJ1dGhcIixcbiAgXCIxIFNhbXVlbFwiOiBcIjEgU2FtXCIsXG4gIFwiRmlyc3QgU2FtdWVsXCI6IFwiMSBTYW1cIixcbiAgXCIyIFNhbXVlbFwiOiBcIjIgU2FtXCIsXG4gIFwiU2Vjb25kIFNhbXVlbFwiOiBcIjIgU2FtXCIsXG4gIFwiMSBLaW5nc1wiOiBcIjEgS2luZ3NcIixcbiAgXCJGaXJzdCBLaW5nc1wiOiBcIjEgS2luZ3NcIixcbiAgXCIyIEtpbmdzXCI6IFwiMiBLaW5nc1wiLFxuICBcIlNlY29uZCBLaW5nc1wiOiBcIjIgS2luZ3NcIixcbiAgXCIxIENocm9uaWNsZXNcIjogXCIxIENocm9uXCIsXG4gIFwiRmlyc3QgQ2hyb25pY2xlc1wiOiBcIjEgQ2hyb25cIixcbiAgXCIyIENocm9uaWNsZXNcIjogXCIyIENocm9uXCIsXG4gIFwiU2Vjb25kIENocm9uaWNsZXNcIjogXCIyIENocm9uXCIsXG4gIFwiRXpyYVwiOiBcIkV6cmFcIixcbiAgXCJOZWhlbWlhaFwiOiBcIk5laFwiLFxuICBcIkVzdGhlclwiOiBcIkVzdGhcIixcbiAgXCJKb2JcIjogXCJKb2JcIixcbiAgXCJQc2FsbXNcIjogXCJQc2FcIixcbiAgXCJQc2FsbVwiOiBcIlBzYVwiLFxuICBcIlByb3ZlcmJzXCI6IFwiUHJvdlwiLFxuICBcIkVjY2xlc2lhc3Rlc1wiOiBcIkVjY2xcIixcbiAgXCJTb25nIG9mIFNvbmdzXCI6IFwiUy5TLlwiLFxuICBcIlNvbmcgb2YgU29sb21vblwiOiBcIlMuUy5cIixcbiAgXCJJc2FpYWhcIjogXCJJc2FcIixcbiAgXCJKZXJlbWlhaFwiOiBcIkplclwiLFxuICBcIkxhbWVudGF0aW9uc1wiOiBcIkxhbVwiLFxuICBcIkV6ZWtpZWxcIjogXCJFemVrXCIsXG4gIFwiRGFuaWVsXCI6IFwiRGFuXCIsXG4gIFwiSG9zZWFcIjogXCJIb3NlYVwiLFxuICBcIkpvZWxcIjogXCJKb2VsXCIsXG4gIFwiQW1vc1wiOiBcIkFtb3NcIixcbiAgXCJPYmFkaWFoXCI6IFwiT2JhZFwiLFxuICBcIkpvbmFoXCI6IFwiSm9uYWhcIixcbiAgXCJNaWNhaFwiOiBcIk1pY2FoXCIsXG4gIFwiTmFodW1cIjogXCJOYWh1bVwiLFxuICBcIkhhYmFra3VrXCI6IFwiSGFiXCIsXG4gIFwiWmVwaGFuaWFoXCI6IFwiWmVwaFwiLFxuICBcIkhhZ2dhaVwiOiBcIkhhZ1wiLFxuICBcIlplY2hhcmlhaFwiOiBcIlplY2hcIixcbiAgXCJNYWxhY2hpXCI6IFwiTWFsXCIsXG4gIFwiTWF0dGhld1wiOiBcIk1hdHRcIixcbiAgXCJNYXJrXCI6IFwiTWFya1wiLFxuICBcIkx1a2VcIjogXCJMdWtlXCIsXG4gIFwiSm9oblwiOiBcIkpvaG5cIixcbiAgXCJBY3RzXCI6IFwiQWN0c1wiLFxuICBcIlJvbWFuc1wiOiBcIlJvbVwiLFxuICBcIjEgQ29yaW50aGlhbnNcIjogXCIxIENvclwiLFxuICBcIkZpcnN0IENvcmludGhpYW5zXCI6IFwiMSBDb3JcIixcbiAgXCIyIENvcmludGhpYW5zXCI6IFwiMiBDb3JcIixcbiAgXCJTZWNvbmQgQ29yaW50aGlhbnNcIjogXCIyIENvclwiLFxuICBcIkdhbGF0aWFuc1wiOiBcIkdhbFwiLFxuICBcIkVwaGVzaWFuc1wiOiBcIkVwaFwiLFxuICBcIlBoaWxpcHBpYW5zXCI6IFwiUGhpbFwiLFxuICBcIkNvbG9zc2lhbnNcIjogXCJDb2xcIixcbiAgXCIxIFRoZXNzYWxvbmlhbnNcIjogXCIxIFRoZXNcIixcbiAgXCJGaXJzdCBUaGVzc2Fsb25pYW5zXCI6IFwiMSBUaGVzXCIsXG4gIFwiMiBUaGVzc2Fsb25pYW5zXCI6IFwiMiBUaGVzXCIsXG4gIFwiU2Vjb25kIFRoZXNzYWxvbmlhbnNcIjogXCIyIFRoZXNcIixcbiAgXCIxIFRpbW90aHlcIjogXCIxIFRpbVwiLFxuICBcIkZpcnN0IFRpbW90aHlcIjogXCIxIFRpbVwiLFxuICBcIjIgVGltb3RoeVwiOiBcIjIgVGltXCIsXG4gIFwiU2Vjb25kIFRpbW90aHlcIjogXCIyIFRpbVwiLFxuICBcIlRpdHVzXCI6IFwiVGl0dXNcIixcbiAgXCJQaGlsZW1vblwiOiBcIlBoaWxlbVwiLFxuICBcIkhlYnJld3NcIjogXCJIZWJcIixcbiAgXCJKYW1lc1wiOiBcIkphbWVzXCIsXG4gIFwiMSBQZXRlclwiOiBcIjEgUGV0XCIsXG4gIFwiRmlyc3QgUGV0ZXJcIjogXCIxIFBldFwiLFxuICBcIjIgUGV0ZXJcIjogXCIyIFBldFwiLFxuICBcIlNlY29uZCBQZXRlclwiOiBcIjIgUGV0XCIsXG4gIFwiMSBKb2huXCI6IFwiMSBKb2huXCIsXG4gIFwiRmlyc3QgSm9oblwiOiBcIjEgSm9oblwiLFxuICBcIjIgSm9oblwiOiBcIjIgSm9oblwiLFxuICBcIlNlY29uZCBKb2huXCI6IFwiMiBKb2huXCIsXG4gIFwiMyBKb2huXCI6IFwiMyBKb2huXCIsXG4gIFwiVGhpcmQgSm9oblwiOiBcIjMgSm9oblwiLFxuICBcIkp1ZGVcIjogXCJKdWRlXCIsXG4gIFwiUmV2ZWxhdGlvblwiOiBcIlJldlwiXG59O1xuXG5leHBvcnQgY29uc3QgQUxMX0JPT0tfVE9LRU5TID0gKCgpID0+IHtcbiAgY29uc3Qgc2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKEJPT0tfQUJCUikpIHsgc2V0LmFkZChrKTsgc2V0LmFkZCh2KTsgfVxuICByZXR1cm4gWy4uLnNldF0uc29ydCgoYSwgYikgPT4gYi5sZW5ndGggLSBhLmxlbmd0aCk7XG59KSgpO1xuIiwgImltcG9ydCB7IEFwcCwgU2V0dGluZywgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgQmFzZUJvbGxzTW9kYWwgfSBmcm9tIFwiLi9ib2xscy1iYXNlLW1vZGFsXCI7XG5pbXBvcnQgeyBidWlsZEJpYmxlRnJvbUJvbGxzIH0gZnJvbSBcIi4uL2NvbW1hbmRzL2dlbmVyYXRlQmlibGVcIjtcblxuZXhwb3J0IGNsYXNzIEJ1aWxkQmlibGVNb2RhbCBleHRlbmRzIEJhc2VCb2xsc01vZGFsIHtcbiAgcHJpdmF0ZSBpbmNsdWRlVmVyc2lvbkluRmlsZU5hbWU6IGJvb2xlYW47XG4gIHByaXZhdGUgdmVyc2lvbkFzU3ViZm9sZGVyOiBib29sZWFuO1xuICBwcml2YXRlIGF1dG9Gcm9udG1hdHRlcjogYm9vbGVhbjtcbiAgcHJpdmF0ZSBjb25jdXJyZW5jeSA9IDQ7XG5cbiAgLy8gcHJvZ3Jlc3NcbiAgcHJpdmF0ZSBwcm9ncmVzc0VsITogSFRNTFByb2dyZXNzRWxlbWVudDtcbiAgcHJpdmF0ZSBzdGF0dXNFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIHN0YXJ0QnRuITogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHByaXZhdGUgd29ya2luZyA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gICAgc3VwZXIoYXBwLCBzZXR0aW5ncywge1xuICAgICAgbGFuZ3VhZ2VMYWJlbDogc2V0dGluZ3MuYmlibGVEZWZhdWx0TGFuZ3VhZ2UgPz8gbnVsbCxcbiAgICAgIHZlcnNpb25TaG9ydDogIHNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb24gID8/IHVuZGVmaW5lZCxcbiAgICB9KTtcblxuICAgIHRoaXMuaW5jbHVkZVZlcnNpb25JbkZpbGVOYW1lID0gc2V0dGluZ3MuYmlibGVJbmNsdWRlVmVyc2lvbkluRmlsZW5hbWUgPz8gdHJ1ZTtcbiAgICAvLyBGSVg6IHVzZSB0aGUgZGVkaWNhdGVkIHNldHRpbmcgZm9yIHN1YmZvbGRlciAod2FzIHBvaW50aW5nIHRvIHRoZSBmaWxlbmFtZSBmbGFnKVxuICAgIHRoaXMudmVyc2lvbkFzU3ViZm9sZGVyICAgICAgID0gKHNldHRpbmdzIGFzIGFueSkuYmlibGVWZXJzaW9uQXNTdWJmb2xkZXIgPz8gdHJ1ZTtcbiAgICB0aGlzLmF1dG9Gcm9udG1hdHRlciA9IHNldHRpbmdzLmJpYmxlQWRkRnJvbnRtYXR0ZXIgPz8gZmFsc2U7XG4gICAgdGhpcy5kaXNhbGxvd0RlZmF1bHQgPSB0cnVlO1xuICB9XG5cbiAgcHJvdGVjdGVkIHJlbmRlckV4dHJhT3B0aW9ucyhjb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJBcHBlbmQgdmVyc2lvbiB0byBmaWxlIG5hbWVcIilcbiAgICAgIC5zZXREZXNjKGBcIkpvaG4gKEtKVilcIiB2cyBcIkpvaG5cImApXG4gICAgICAuYWRkVG9nZ2xlKHQgPT5cbiAgICAgICAgdC5zZXRWYWx1ZSh0aGlzLmluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZSlcbiAgICAgICAgIC5vbkNoYW5nZSh2ID0+ICh0aGlzLmluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZSA9IHYpKVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5zZXROYW1lKFwiUGxhY2UgYm9va3MgdW5kZXIgdmVyc2lvbiBzdWJmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKGBcIl9CaWJsZS9LSlYvSm9obiAoS0pWKVwiIHZzIFwiX0JpYmxlL0pvaG5cImApXG4gICAgICAuYWRkVG9nZ2xlKHQgPT5cbiAgICAgICAgdC5zZXRWYWx1ZSh0aGlzLnZlcnNpb25Bc1N1YmZvbGRlcilcbiAgICAgICAgIC5vbkNoYW5nZSh2ID0+ICh0aGlzLnZlcnNpb25Bc1N1YmZvbGRlciA9IHYpKVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5zZXROYW1lKFwiQXV0by1hZGQgZnJvbnRtYXR0ZXJcIilcbiAgICAgIC5zZXREZXNjKFwiSW5zZXJ0IFlBTUwgd2l0aCB0aXRsZS92ZXJzaW9uL2NyZWF0ZWQgaW50byBlYWNoIGJvb2sgZmlsZVwiKVxuICAgICAgLmFkZFRvZ2dsZSh0ID0+XG4gICAgICAgIHQuc2V0VmFsdWUodGhpcy5hdXRvRnJvbnRtYXR0ZXIpXG4gICAgICAgICAub25DaGFuZ2UodiA9PiAodGhpcy5hdXRvRnJvbnRtYXR0ZXIgPSB2KSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIkNvbmN1cnJlbmN5XCIpXG4gICAgICAuc2V0RGVzYyhcIkhvdyBtYW55IGNoYXB0ZXJzIHRvIGRvd25sb2FkIGluIHBhcmFsbGVsXCIpXG4gICAgICAuYWRkU2xpZGVyKHMgPT5cbiAgICAgICAgcy5zZXRMaW1pdHMoMSwgOCwgMSlcbiAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLmNvbmN1cnJlbmN5KVxuICAgICAgICAgLm9uQ2hhbmdlKHYgPT4gKHRoaXMuY29uY3VycmVuY3kgPSB2KSlcbiAgICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICApO1xuICB9XG5cbiAgcHJvdGVjdGVkIHJlbmRlckZvb3Rlcihjb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgcHJvZ1dyYXAgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcImJvbGxzLXByb2dyZXNzXCIgfSk7XG4gICAgdGhpcy5wcm9ncmVzc0VsID0gcHJvZ1dyYXAuY3JlYXRlRWwoXCJwcm9ncmVzc1wiKTtcbiAgICB0aGlzLnByb2dyZXNzRWwubWF4ID0gMTAwO1xuICAgIHRoaXMucHJvZ3Jlc3NFbC52YWx1ZSA9IDA7XG5cbiAgICB0aGlzLnN0YXR1c0VsID0gcHJvZ1dyYXAuY3JlYXRlRGl2KHsgdGV4dDogXCJJZGxlLlwiIH0pO1xuXG4gICAgY29uc3QgYnRucyA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwiYm9sbHMtYWN0aW9uc1wiIH0pO1xuICAgIHRoaXMuc3RhcnRCdG4gPSBidG5zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJTdGFydFwiIH0pO1xuICAgIHRoaXMuc3RhcnRCdG4ub25jbGljayA9ICgpID0+IHRoaXMuc3RhcnQoKTtcblxuICAgIGNvbnN0IGNhbmNlbEJ0biA9IGJ0bnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIkNsb3NlXCIgfSk7XG4gICAgY2FuY2VsQnRuLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNsb3NlKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHN0YXJ0KCkge1xuICAgIGlmICh0aGlzLndvcmtpbmcpIHJldHVybjtcbiAgICB0aGlzLndvcmtpbmcgPSB0cnVlO1xuICAgIHRoaXMuc3RhcnRCdG4uZGlzYWJsZWQgPSB0cnVlO1xuXG4gICAgY29uc3QgY29kZSA9ICh0aGlzLnRyYW5zbGF0aW9uQ29kZSA/PyBcIlwiKS50cmltKCk7XG4gICAgaWYgKCFjb2RlKSB7XG4gICAgICBuZXcgTm90aWNlKFwiQ2hvb3NlIGEgdHJhbnNsYXRpb24gY29kZS5cIik7XG4gICAgICB0aGlzLndvcmtpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMuc3RhcnRCdG4uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgYnVpbGRCaWJsZUZyb21Cb2xscyhcbiAgICAgICAgdGhpcy5hcHAsXG4gICAgICAgIHtcbiAgICAgICAgICB0cmFuc2xhdGlvbkNvZGU6IGNvZGUsXG4gICAgICAgICAgdHJhbnNsYXRpb25GdWxsOiB0aGlzLnRyYW5zbGF0aW9uRnVsbCB8fCBjb2RlLFxuICAgICAgICAgIGluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZTogdGhpcy5pbmNsdWRlVmVyc2lvbkluRmlsZU5hbWUsXG4gICAgICAgICAgdmVyc2lvbkFzU3ViZm9sZGVyOiB0aGlzLnZlcnNpb25Bc1N1YmZvbGRlcixcbiAgICAgICAgICBhdXRvRnJvbnRtYXR0ZXI6IHRoaXMuYXV0b0Zyb250bWF0dGVyLFxuICAgICAgICAgIGNvbmN1cnJlbmN5OiB0aGlzLmNvbmN1cnJlbmN5LFxuICAgICAgICB9LFxuICAgICAgICAoZG9uZTogbnVtYmVyLCB0b3RhbDogbnVtYmVyLCBtc2c6IGFueSkgPT4ge1xuICAgICAgICAgIHRoaXMucHJvZ3Jlc3NFbC5tYXggPSB0b3RhbCB8fCAxO1xuICAgICAgICAgIHRoaXMucHJvZ3Jlc3NFbC52YWx1ZSA9IE1hdGgubWluKGRvbmUsIHRvdGFsIHx8IDEpO1xuICAgICAgICAgIHRoaXMuc3RhdHVzRWwuc2V0VGV4dChgJHtkb25lfS8ke3RvdGFsfSBcdTAwQjcgJHttc2d9YCk7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLnN0YXR1c0VsLnNldFRleHQoXCJEb25lLlwiKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICBuZXcgTm90aWNlKGBCaWJsZSBidWlsZCBmYWlsZWQ6ICR7ZT8ubWVzc2FnZSA/PyBlfWApO1xuICAgICAgdGhpcy5zdGF0dXNFbC5zZXRUZXh0KFwiRmFpbGVkLlwiKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy53b3JraW5nID0gZmFsc2U7XG4gICAgICB0aGlzLnN0YXJ0QnRuLmRpc2FibGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG59Il0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsb0JBQTZDOzs7QUNBN0MsSUFBQUMsbUJBQStDOzs7QUNBL0Msc0JBQTRDO0FBb0I1QyxJQUFNLFFBQVE7QUFBQSxFQUNaLGVBQWU7QUFDakI7QUFFQSxlQUFlLGlCQUEyQztBQUN4RCxRQUFNLE1BQU0sVUFBTSw0QkFBVyxFQUFFLEtBQUssTUFBTSxlQUFlLFFBQVEsTUFBTSxDQUFDO0FBQ3hFLE1BQUksSUFBSSxTQUFTLE9BQU8sSUFBSSxVQUFVLEtBQUs7QUFDekMsVUFBTSxJQUFJLE1BQU0sUUFBUSxJQUFJLE1BQU0sRUFBRTtBQUFBLEVBQ3RDO0FBQ0EsUUFBTSxTQUFTLEtBQUssTUFBTSxJQUFJLElBQUk7QUFDbEMsVUFBUSxVQUFVLENBQUMsR0FBRyxPQUFPLE9BQUssTUFBTSxRQUFRLEVBQUUsWUFBWSxLQUFLLEVBQUUsYUFBYSxTQUFTLENBQUM7QUFDOUY7QUFnQk8sSUFBTSx3QkFBTixNQUFNLHNCQUFxQjtBQUFBLEVBVWhDLFlBQVksU0FBc0MsVUFBOEIsa0JBQTJCLE9BQU87QUFDaEgsU0FBSyxVQUFVO0FBQ2YsU0FBSyxXQUFXO0FBQ2hCLFNBQUssTUFBTSxRQUFRO0FBRW5CLFFBQUks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TUFBTTtBQUFBLE1BQ04sVUFBVSxNQUFNLDhDQUE4QyxLQUFLLEtBQUssS0FBSyxRQUFRO0FBQUEsSUFDdkYsQ0FBQztBQUVELHFCQUFpQixJQUFJO0FBQUEsRUFDdkI7QUFBQSxFQUVBLE1BQU0sV0FBVztBQUNmLFlBQVEsSUFBSSw2QkFBd0I7QUFBQSxFQUN0QztBQUFBLEVBRUEsTUFBTSxlQUFlO0FBQ25CLFVBQU0sS0FBSyxTQUFTLEtBQUssUUFBUTtBQUFBLEVBQ25DO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiYmxvY2siLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImNvbnRlbnQiLCAieWFtbCIsICJib2R5IiwgImxpbmtlZCIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImFkZEljb24iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJyYXciLCAiaW1wb3J0X29ic2lkaWFuIiwgIkJPT0tfQUJCUiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiQk9MTFMiLCAiQk9PS19BQkJSIl0KfQo=
