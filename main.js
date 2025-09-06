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
var import_obsidian19 = require("obsidian");

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
  baseFolderBible: "Bible",
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
    new import_obsidian2.Setting(containerEl).setName("Default Bible folder to create versions in").setDesc("Root folder to scan when a command needs a folder (e.g., index creation).").addText((t) => t.setPlaceholder("Bible").setValue(this.plugin.settings.baseFolderBible).onChange(async (v) => {
      this.plugin.settings.baseFolderBible = v || "Bible";
      await this.plugin.saveSettings();
    }));
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

// src/commands/verse-links.ts
var import_obsidian6 = require("obsidian");

// src/lib/md-utils.ts
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

// src/commands/verse-links.ts
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

// src/commands/add-next-previous.ts
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

// src/commands/add-folder-index.ts
var import_obsidian8 = require("obsidian");

// src/lib/text-utils.ts
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

// src/commands/add-folder-index.ts
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

// src/commands/extract-highlights-folder.ts
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

// src/commands/extract-red-highlights.ts
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

// src/commands/outline-extractor.ts
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

// src/commands/outline-formatter.ts
var import_obsidian13 = require("obsidian");

// src/lib/outline-utils.ts
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

// src/commands/outline-formatter.ts
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

// src/commands/generate-bible.ts
var import_obsidian15 = require("obsidian");

// src/lib/types.ts
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
var BIBLEHUB_INTERLINEAR = {
  "Gen": "genesis",
  "Exo": "exodus",
  "Lev": "leviticus",
  "Num": "numbers",
  "Deut": "deuteronomy",
  "Josh": "joshua",
  "Judg": "judges",
  "Ruth": "ruth",
  "1 Sam": "1_samuel",
  "2 Sam": "2_samuel",
  "1 Kings": "1_kings",
  "2 Kings": "2_kings",
  "1 Chron": "1_chronicles",
  "2 Chron": "2_chronicles",
  "Ezra": "ezra",
  "Neh": "nehemiah",
  "Esth": "esther",
  "Job": "job",
  "Psa": "psalms",
  "Prov": "proverbs",
  "Eccl": "ecclesiastes",
  "SoS": "songs",
  // Song of Solomon / Song of Songs
  "S.S.": "songs",
  // Song of Solomon / Song of Songs
  "Isa": "isaiah",
  "Jer": "jeremiah",
  "Lam": "lamentations",
  "Ezek": "ezekiel",
  "Dan": "daniel",
  "Hosea": "hosea",
  "Joel": "joel",
  "Amos": "amos",
  "Obad": "obadiah",
  "Jonah": "jonah",
  "Micah": "micah",
  "Nah": "nahum",
  "Hab": "habakkuk",
  "Zep": "zephaniah",
  "Zeph": "zephaniah",
  "Hag": "haggai",
  "Zech": "zechariah",
  "Mal": "malachi",
  "Matt": "matthew",
  "Mark": "mark",
  "Luke": "luke",
  "John": "john",
  "Acts": "acts",
  "Rom": "romans",
  "1 Cor": "1_corinthians",
  "2 Cor": "2_corinthians",
  "Gal": "galatians",
  "Eph": "ephesians",
  "Phil": "philippians",
  "Col": "colossians",
  "1 Thes": "1_thessalonians",
  "2 Thes": "2_thessalonians",
  "1 Tim": "1_timothy",
  "2 Tim": "2_timothy",
  "Titus": "titus",
  "Philem": "philemon",
  "Heb": "hebrews",
  "James": "james",
  "1 Pet": "1_peter",
  "2 Pet": "2_peter",
  "1 John": "1_john",
  "2 John": "2_john",
  "3 John": "3_john",
  "Jude": "jude",
  "Rev": "revelation"
};

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
    new import_obsidian14.Setting(contentEl).setName("Place books under version subfolder").setDesc(`"Bible/KJV/John (KJV)" vs "Bible/John"`).addToggle(
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
          concurrency: this.concurrency,
          baseFolder: this.settings.baseFolderBible || "Bible"
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

// src/commands/generate-bible.ts
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
  if (canon && BOOK_ABBR2[canon]) {
    const result = BOOK_ABBR2[canon];
    return result === "S.S." ? "SoS" : result;
  }
  if (BOOK_ABBR2[incomingName]) {
    const result = BOOK_ABBR2[incomingName];
    return result === "S.S." ? "SoS" : result;
  }
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
  const baseFolder = opts.baseFolder.replace(/\/+$/, "");
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

// src/commands/biblehub-links.ts
var import_obsidian18 = require("obsidian");

// src/lib/biblehub.ts
function normalizeToShortBook(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  s = s.replace(/^\[\[|\]\]$/g, "").replace(/\s*\([^)]+\)\s*$/, "");
  if (BIBLEHUB_INTERLINEAR[s]) return s;
  if (BOOK_ABBR2[s]) return BOOK_ABBR2[s];
  s = s.replace(/\.$/, "");
  if (BOOK_ABBR2[s]) return BOOK_ABBR2[s];
  if (BIBLEHUB_INTERLINEAR[s]) return s;
  return null;
}
async function detectBookShortForFile(app, file) {
  const content = await app.vault.read(file);
  const { yaml } = splitFrontmatter(content);
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
  const base = file.basename;
  const fromName = normalizeToShortBook(base);
  if (fromName) return fromName;
  return null;
}
function addBibleHubLinkToLine(line, bookShort) {
  const already = /\[\s*\]\(https?:\/\/biblehub\.com\/interlinear\/[^\)]+\)\s+\^\d+(?:-\d+)?\s*$/.test(line);
  if (already) return line;
  const m = line.match(/(\s\^(\d+(?:-\d+)?))$/);
  if (!m) return line;
  const chapterVerse = m[2];
  const slug = BIBLEHUB_INTERLINEAR[bookShort];
  if (!slug) return line;
  const url = `https://biblehub.com/interlinear/${slug}/${chapterVerse}.htm`;
  return line.replace(/(\s\^(\d+)(-\d+)?)$/, ` [ ](${url})$1`);
}
function removeBibleHubLinkFromLine(line) {
  return line.replace(
    /\s\[\s*\]\(https?:\/\/biblehub\.com\/interlinear\/[^\)]+\)\s+(?=\^\d+(?:-\d+)?\s*$)/,
    " "
  );
}
function addBibleHubLinksInText(body, bookShort) {
  const lines = body.split(/\r?\n/);
  let added = 0;
  const out = lines.map((ln) => {
    const next = addBibleHubLinkToLine(ln, bookShort);
    if (next !== ln) added++;
    return next;
  });
  return { text: out.join("\n"), added };
}
function removeBibleHubLinksInText(body) {
  const lines = body.split(/\r?\n/);
  let removed = 0;
  const out = lines.map((ln) => {
    const next = removeBibleHubLinkFromLine(ln);
    if (next !== ln) removed++;
    return next;
  });
  return { text: out.join("\n"), removed };
}

// src/ui/bible-hub-links-modal.ts
var import_obsidian17 = require("obsidian");

// src/ui/folder-suggest-modal.ts
var import_obsidian16 = require("obsidian");
var FolderSuggestModal = class _FolderSuggestModal extends import_obsidian16.FuzzySuggestModal {
  constructor(app, onChoose) {
    super(app);
    this.appRef = app;
    this.onChoose = onChoose;
    this.folders = _FolderSuggestModal.collectFolders(app);
    this.setPlaceholder("Type to filter folders\u2026");
  }
  getItems() {
    return this.folders;
  }
  getItemText(item) {
    return item.path;
  }
  onChooseItem(item) {
    this.onChoose(item);
  }
  static collectFolders(app) {
    const out = [];
    import_obsidian16.Vault.recurseChildren(app.vault.getRoot(), (af) => {
      if (af instanceof import_obsidian16.TFolder) out.push(af);
    });
    return out.sort((a, b) => a.path.localeCompare(b.path));
  }
};

// src/ui/bible-hub-links-modal.ts
var BibleHubLinksModal = class extends import_obsidian17.Modal {
  constructor(app, onRun) {
    super(app);
    this._scope = "current";
    this.chosenFolder = null;
    this.appRef = app;
    this.onRun = onRun;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText("BibleHub interlinear links");
    new import_obsidian17.Setting(contentEl).setName("Scope").addDropdown((dd) => {
      dd.addOption("current", "Current file");
      dd.addOption("folder", "Pick folder\u2026");
      dd.setValue(this._scope);
      dd.onChange((v) => {
        this._scope = v;
        folderRow.settingEl.toggle(this._scope === "folder");
      });
    });
    const folderRow = new import_obsidian17.Setting(contentEl).setName("Folder").setDesc("Choose a folder to process all .md files inside (non-recursive).").addButton(
      (b) => b.setButtonText(this.chosenFolder ? this.chosenFolder.path : "Pick\u2026").onClick(() => {
        new FolderSuggestModal(this.appRef, (f) => {
          this.chosenFolder = f;
          b.setButtonText(f.path);
        }).open();
      })
    );
    folderRow.settingEl.toggle(this._scope === "folder");
    new import_obsidian17.Setting(contentEl).addButton(
      (b) => b.setCta().setButtonText("Run").onClick(() => {
        if (this._scope === "folder") {
          if (!this.chosenFolder) {
            new import_obsidian17.Notice("Pick a folder first.");
            return;
          }
          this.close();
          this.onRun({ kind: "folder", folder: this.chosenFolder });
        } else {
          this.close();
          this.onRun({ kind: "current" });
        }
      })
    ).addExtraButton((b) => b.setIcon("x").setTooltip("Cancel").onClick(() => this.close()));
  }
};

// src/commands/biblehub-links.ts
async function processFileAdd(app, file) {
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
async function processFileRemove(app, file) {
  const raw = await app.vault.read(file);
  const { yaml, body } = splitFrontmatter(raw);
  const { text, removed } = removeBibleHubLinksInText(body);
  if (removed > 0) {
    await app.vault.modify(file, (yaml ?? "") + text);
    return { changed: true, removed };
  }
  return { changed: false, removed: 0 };
}
function commandAddBibleHubLinks(app) {
  new BibleHubLinksModal(app, async (scope) => {
    if (scope.kind === "current") {
      const f = app.workspace.getActiveFile();
      if (!f) {
        new import_obsidian18.Notice("Open a Markdown file first.");
        return;
      }
      if (f.extension !== "md") {
        new import_obsidian18.Notice("Current file is not a Markdown file.");
        return;
      }
      const r = await processFileAdd(app, f);
      if (r.changed) new import_obsidian18.Notice(`Added ${r.added} BibleHub link(s).`);
      else new import_obsidian18.Notice(r.reason ? `No links added (${r.reason}).` : "No lines with ^chapter-verse anchors found.");
      return;
    }
    const folder = scope.folder;
    let addedTotal = 0, changedFiles = 0, skipped = 0;
    for (const child of folder.children) {
      if (child instanceof import_obsidian18.TFile && child.extension === "md") {
        try {
          const r = await processFileAdd(app, child);
          if (r.changed) {
            changedFiles++;
            addedTotal += r.added;
          } else if (r.reason === "unknown book") {
            skipped++;
            console.warn(`[BibleHub] Skipped ${child.path}: unknown book.`);
          }
        } catch (e) {
          console.warn("[BibleHub] Failed on", child.path, e);
        }
      }
    }
    new import_obsidian18.Notice(`BibleHub links: +${addedTotal} in ${changedFiles} file(s). Skipped (unknown book): ${skipped}.`);
  }).open();
}
function commandRemoveBibleHubLinks(app) {
  new BibleHubLinksModal(app, async (scope) => {
    if (scope.kind === "current") {
      const f = app.workspace.getActiveFile();
      if (!f) {
        new import_obsidian18.Notice("Open a Markdown file first.");
        return;
      }
      if (f.extension !== "md") {
        new import_obsidian18.Notice("Current file is not a Markdown file.");
        return;
      }
      const r = await processFileRemove(app, f);
      if (r.changed) new import_obsidian18.Notice(`Removed ${r.removed} BibleHub link(s).`);
      else new import_obsidian18.Notice("No BibleHub links to remove.");
      return;
    }
    const folder = scope.folder;
    let removedTotal = 0, changedFiles = 0;
    for (const child of folder.children) {
      if (child instanceof import_obsidian18.TFile && child.extension === "md") {
        try {
          const r = await processFileRemove(app, child);
          if (r.changed) {
            changedFiles++;
            removedTotal += r.removed;
          }
        } catch (e) {
          console.warn("[BibleHub] Remove failed on", child.path, e);
        }
      }
    }
    new import_obsidian18.Notice(`BibleHub links removed: -${removedTotal} in ${changedFiles} file(s).`);
  }).open();
}

// src/main.ts
var ObsidianBibleTools = class extends import_obsidian19.Plugin {
  async onload() {
    console.log("Loading Bible Tools\u2026");
    registerIcons(import_obsidian19.addIcon);
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
    this.addCommand({
      id: "add-biblehub-interlinear-links",
      name: "BibleHub: Add interlinear links (file / folder)",
      callback: () => commandAddBibleHubLinks(this.app)
    });
    this.addCommand({
      id: "remove-biblehub-interlinear-links",
      name: "BibleHub: Remove interlinear links (file / folder)",
      callback: () => commandRemoveBibleHubLinks(this.app)
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3NldHRpbmdzLnRzIiwgInNyYy91aS9ib2xscy1waWNrZXItY29tcG9uZW50LnRzIiwgInNyYy9jb21tYW5kcy92ZXJzZS1saW5rcy50cyIsICJzcmMvbGliL21kLXV0aWxzLnRzIiwgInNyYy91aS9waWNrLXZlcnNpb24tbW9kYWwudHMiLCAic3JjL3VpL2JvbGxzLWJhc2UtbW9kYWwudHMiLCAic3JjL2NvbW1hbmRzL2FkZC1uZXh0LXByZXZpb3VzLnRzIiwgInNyYy9jb21tYW5kcy9hZGQtZm9sZGVyLWluZGV4LnRzIiwgInNyYy9saWIvdGV4dC11dGlscy50cyIsICJzcmMvcHJvdG9jb2wudHMiLCAic3JjL2ljb25zLnRzIiwgInNyYy9jb21tYW5kcy9leHRyYWN0LWhpZ2hsaWdodHMtZm9sZGVyLnRzIiwgInNyYy9jb21tYW5kcy9leHRyYWN0LXJlZC1oaWdobGlnaHRzLnRzIiwgInNyYy9jb21tYW5kcy9vdXRsaW5lLWV4dHJhY3Rvci50cyIsICJzcmMvY29tbWFuZHMvb3V0bGluZS1mb3JtYXR0ZXIudHMiLCAic3JjL2xpYi9vdXRsaW5lLXV0aWxzLnRzIiwgInNyYy9jb21tYW5kcy9nZW5lcmF0ZS1iaWJsZS50cyIsICJzcmMvbGliL3R5cGVzLnRzIiwgInNyYy91aS9idWlsZC1iaWJsZS1tb2RhbC50cyIsICJzcmMvY29tbWFuZHMvYmlibGVodWItbGlua3MudHMiLCAic3JjL2xpYi9iaWJsZWh1Yi50cyIsICJzcmMvdWkvYmlibGUtaHViLWxpbmtzLW1vZGFsLnRzIiwgInNyYy91aS9mb2xkZXItc3VnZ2VzdC1tb2RhbC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFBsdWdpbiwgYWRkSWNvbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzLCBERUZBVUxUX1NFVFRJTkdTLCBCaWJsZVRvb2xzU2V0dGluZ1RhYiB9IGZyb20gXCIuL3NldHRpbmdzXCI7XG5pbXBvcnQgeyByZWdpc3RlclByb3RvY29sIH0gZnJvbSBcIi4vcHJvdG9jb2xcIjtcbmltcG9ydCB7IHJlZ2lzdGVySWNvbnMgfSBmcm9tIFwiLi9pY29uc1wiO1xuXG4vLyBDb21tYW5kc1xuaW1wb3J0IHsgY29tbWFuZEFkZEZvbGRlckluZGV4LCBjb21tYW5kQWRkSW5kZXhGb3JDdXJyZW50Rm9sZGVyIH0gZnJvbSBcIi4vY29tbWFuZHMvYWRkLWZvbGRlci1pbmRleFwiO1xuaW1wb3J0IHsgY29tbWFuZEFkZE5leHRQcmV2aW91cyB9IGZyb20gXCIuL2NvbW1hbmRzL2FkZC1uZXh0LXByZXZpb3VzXCI7XG5pbXBvcnQgeyBjb21tYW5kRXh0cmFjdEhpZ2hsaWdodHNGb2xkZXIgfSBmcm9tIFwiLi9jb21tYW5kcy9leHRyYWN0LWhpZ2hsaWdodHMtZm9sZGVyXCI7XG5pbXBvcnQgeyBjb21tYW5kRXh0cmFjdFJlZEhpZ2hsaWdodHMgfSBmcm9tIFwiLi9jb21tYW5kcy9leHRyYWN0LXJlZC1oaWdobGlnaHRzXCI7XG5pbXBvcnQgeyBjb21tYW5kT3V0bGluZUV4dHJhY3RvciB9IGZyb20gXCIuL2NvbW1hbmRzL291dGxpbmUtZXh0cmFjdG9yXCI7XG5pbXBvcnQgeyBjb21tYW5kT3V0bGluZUZvcm1hdHRlciB9IGZyb20gXCIuL2NvbW1hbmRzL291dGxpbmUtZm9ybWF0dGVyXCI7XG5pbXBvcnQgeyBjb21tYW5kVmVyc2VMaW5rcywgY29tbWFuZFZlcnNlTGlua3NDaG9vc2VWZXJzaW9uLCBjb21tYW5kVmVyc2VMaW5rc1NlbGVjdGlvbk9yTGluZSwgY29tbWFuZFZlcnNlTGlua3NTZWxlY3Rpb25PckxpbmVDaG9vc2VWZXJzaW9uIH0gZnJvbSBcIi4vY29tbWFuZHMvdmVyc2UtbGlua3NcIjtcbmltcG9ydCB7IGNvbW1hbmRCdWlsZEJpYmxlRnJvbUJvbGxzIH0gZnJvbSBcIi4vY29tbWFuZHMvZ2VuZXJhdGUtYmlibGVcIjtcbmltcG9ydCB7IGNvbW1hbmRBZGRCaWJsZUh1YkxpbmtzLCBjb21tYW5kUmVtb3ZlQmlibGVIdWJMaW5rcyB9IGZyb20gXCIuL2NvbW1hbmRzL2JpYmxlaHViLWxpbmtzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE9ic2lkaWFuQmlibGVUb29scyBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzITogQmlibGVUb29sc1NldHRpbmdzO1xuXG4gIGFzeW5jIG9ubG9hZCgpIHtcbiAgICBjb25zb2xlLmxvZyhcIkxvYWRpbmcgQmlibGUgVG9vbHNcdTIwMjZcIik7XG4gICAgcmVnaXN0ZXJJY29ucyhhZGRJY29uKTtcblxuICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xuXG4gICAgLy8gU2V0dGluZ3MgVUlcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IEJpYmxlVG9vbHNTZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG5cbiAgICAvLyBSaWJib24gaWNvbiAoZGVza3RvcClcbiAgICB0aGlzLmFkZFJpYmJvbkljb24oXCJvYnRiLWJvb2tcIiwgXCJCaWJsZSBUb29sczogRm9sZGVyIEluZGV4XCIsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGNvbW1hbmRBZGRGb2xkZXJJbmRleCh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyk7XG4gICAgfSk7XG5cbiAgICAvLyBDb21tYW5kc1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvYnRiLWFkZC1mb2xkZXItaW5kZXhcIixcbiAgICAgIG5hbWU6IFwiQ3JlYXRlL1VwZGF0ZSBGb2xkZXIgSW5kZXggKEJvb2tzKVwiLFxuICAgICAgaWNvbjogXCJvYnRiLWJvb2tcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiBjb21tYW5kQWRkRm9sZGVySW5kZXgodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwiYWRkLWluZGV4LWZvci1jdXJyZW50LWZvbGRlclwiLFxuICAgICAgbmFtZTogXCJDcmVhdGUvVXBkYXRlIEZvbGRlciBJbmRleCBmb3IgQ3VycmVudCBGb2xkZXJcIixcbiAgICAgIGljb246IFwibGlzdC1vcmRlcmVkXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCBjb21tYW5kQWRkSW5kZXhGb3JDdXJyZW50Rm9sZGVyKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKTtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib2J0Yi1hZGQtbmV4dC1wcmV2aW91c1wiLFxuICAgICAgbmFtZTogXCJJbnNlcnQgTmV4dC9QcmV2aW91cyBMaW5rcyAoQ3VycmVudCBGb2xkZXIpXCIsXG4gICAgICBpY29uOiBcIm9idGItbGlua3NcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiBjb21tYW5kQWRkTmV4dFByZXZpb3VzKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9idGItZXh0cmFjdC1yZWQtaGlnaGxpZ2h0c1wiLFxuICAgICAgbmFtZTogXCJFeHRyYWN0IFJlZCBIaWdobGlnaHRzIHRvIGN1cnJlbnQgZmlsZVwiLFxuICAgICAgaWNvbjogXCJvYnRiLWhpZ2hsaWdodGVyXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4gY29tbWFuZEV4dHJhY3RSZWRIaWdobGlnaHRzKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9idGItZXh0cmFjdC1oaWdobGlnaHRzLWZvbGRlclwiLFxuICAgICAgbmFtZTogXCJDcmVhdGUgSGlnaGxpZ2h0cy5tZCBmcm9tIGZvbGRlclwiLFxuICAgICAgaWNvbjogXCJvYnRiLXN1bW1hcnlcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiBjb21tYW5kRXh0cmFjdEhpZ2hsaWdodHNGb2xkZXIodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib2J0Yi1vdXRsaW5lLWV4dHJhY3RcIixcbiAgICAgIG5hbWU6IFwiQXBwZW5kIE91dGxpbmUgKGZyb20gIyMuLi4jIyMjIyMgaGVhZGluZ3MpXCIsXG4gICAgICBpY29uOiBcIm9idGItb3V0bGluZVwiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IGNvbW1hbmRPdXRsaW5lRXh0cmFjdG9yKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9idGItb3V0bGluZS1mb3JtYXRcIixcbiAgICAgIG5hbWU6IFwiRm9ybWF0IE91dGxpbmUgKFJvbWFuL0EvMS9hIFx1MjE5MiBNYXJrZG93biBoZWFkaW5ncykgYW5kIExpbmsgVmVyc2VzXCIsXG4gICAgICBpY29uOiBcIm9idGItZm9ybWF0dGVyXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4gY29tbWFuZE91dGxpbmVGb3JtYXR0ZXIodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwiYnVpbGQtYmlibGUtZnJvbS1ib2xsc1wiLFxuICAgICAgbmFtZTogXCJJbXBvcnQgQmlibGUgdmVyc2lvbiBpbnRvIHZhdWx0IChkb3dubG9hZCBmcm9tIGJvbGxzLmxpZmUpXCIsXG4gICAgICBpY29uOiBcImJvb2stb3BlblwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IGNvbW1hbmRCdWlsZEJpYmxlRnJvbUJvbGxzKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvYnRiLXZlcnNlLWxpbmtzXCIsXG4gICAgICBuYW1lOiBcIkxpbmsgdmVyc2VzXCIsXG4gICAgICBpY29uOiBcIm9idGItYmlibGVcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiBjb21tYW5kVmVyc2VMaW5rcyh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncylcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJsaW5rLXZlcnNlcy1zZWxlY3Rpb24tb3ItbGluZVwiLFxuICAgICAgbmFtZTogXCJMaW5rIHZlcnNlcyBpbiBzZWxlY3Rpb24vY3VycmVudCBsaW5lXCIsXG4gICAgICBpY29uOiBcImxpbmstMlwiLCAvLyBhcHBlYXJzIGluIG1vYmlsZSBjb21tYW5kIGJhclxuICAgICAgZWRpdG9yQ2FsbGJhY2s6IGFzeW5jIChfZWRpdG9yLCBfdmlldykgPT4ge1xuICAgICAgICBhd2FpdCBjb21tYW5kVmVyc2VMaW5rc1NlbGVjdGlvbk9yTGluZSh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyk7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImxpbmstdmVyc2VzLWN1cnJlbnQtY2hvb3NlLXZlcnNpb25cIixcbiAgICAgIG5hbWU6IFwiTGluayB2ZXJzZXMgKHdpdGggdmVyc2lvbilcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiBjb21tYW5kVmVyc2VMaW5rc0Nob29zZVZlcnNpb24odGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpLFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImxpbmstdmVyc2VzLXNlbGVjdGlvbi1vci1saW5lLWNob29zZS12ZXJzaW9uXCIsXG4gICAgICBuYW1lOiBcIkxpbmsgdmVyc2VzIGluIHNlbGVjdGlvbi9jdXJyZW50IGxpbmUgKHdpdGggdmVyc2lvbilcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiBjb21tYW5kVmVyc2VMaW5rc1NlbGVjdGlvbk9yTGluZUNob29zZVZlcnNpb24odGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpLFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImFkZC1iaWJsZWh1Yi1pbnRlcmxpbmVhci1saW5rc1wiLFxuICAgICAgbmFtZTogXCJCaWJsZUh1YjogQWRkIGludGVybGluZWFyIGxpbmtzIChmaWxlIC8gZm9sZGVyKVwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IGNvbW1hbmRBZGRCaWJsZUh1YkxpbmtzKHRoaXMuYXBwKSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJyZW1vdmUtYmlibGVodWItaW50ZXJsaW5lYXItbGlua3NcIixcbiAgICAgIG5hbWU6IFwiQmlibGVIdWI6IFJlbW92ZSBpbnRlcmxpbmVhciBsaW5rcyAoZmlsZSAvIGZvbGRlcilcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiBjb21tYW5kUmVtb3ZlQmlibGVIdWJMaW5rcyh0aGlzLmFwcCksXG4gICAgfSk7XG5cbiAgICByZWdpc3RlclByb3RvY29sKHRoaXMpO1xuICB9XG5cbiAgYXN5bmMgb251bmxvYWQoKSB7XG4gICAgY29uc29sZS5sb2coXCJVbmxvYWRpbmcgQmlibGUgVG9vbHNcdTIwMjZcIik7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IE9ic2lkaWFuQmlibGVUb29scyBmcm9tIFwiLi9tYWluXCI7XG5pbXBvcnQgeyBCb2xsc0xhbmd1YWdlLCBCb2xsc1BpY2tlckNvbXBvbmVudCB9IGZyb20gXCIuL3VpL2JvbGxzLXBpY2tlci1jb21wb25lbnRcIjtcblxuZXhwb3J0IGludGVyZmFjZSBCaWJsZVRvb2xzU2V0dGluZ3Mge1xuICBiYXNlRm9sZGVyQmlibGU6IHN0cmluZztcbiAgYmFzZUZvbGRlcjogc3RyaW5nO1xuICByZWRNYXJrQ3NzOiBzdHJpbmc7XG4gIGluZGV4RmlsZU5hbWVNb2RlOiBcImZvbGRlci1uYW1lXCIgfCBcImFydGljbGUtc3R5bGVcIjtcbiAgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZTogYm9vbGVhbjsgLy8gc3RyaXAgTWFya2Rvd24gbGlua3MgdGhhdCBsb29rIGxpa2Ugc2NyaXB0dXJlIHJlZmVyZW5jZXMgKGUuZy4sIFtSb20uIDE6MV0odXJsKSBcdTIxOTIgUm9tLiAxOjEpXG4gIHJlbW92ZU9ic2lkaWFuRGlzcGxheUxpbmtzOiBib29sZWFuOyAvLyByZW1vdmUgT2JzaWRpYW4gZGlzcGxheS10ZXh0IGxpbmtzIHRoYXQgbG9vayBsaWtlIHNjcmlwdHVyZSByZWZlcmVuY2VzIChlLmcuLCBbW1JvbS4gMToxfFJvbS4gMToxXV0gXHUyMTkyIFJvbS4gMToxKVxuICByZXdyaXRlT2xkT2JzaWRpYW5MaW5rczogYm9vbGVhbjsgLy8gcmV3cml0ZSBsZWdhY3kgT2JzaWRpYW4gbGlua3MgKGUuZy4sIFtbUm9tIDEjXjN8XHUyMDI2XV0gXHUyMTkyIFtbUm9tI14xLTN8XHUyMDI2XV0pIGFuZCByZW1vdmUgcHJldmlvdXMgT2JzaWRpYW4gbGlua3MgdGhhdCBoYXZlIHZlcnNlLWxpa2UgZGlzcGxheSBwYXR0ZXJuXG5cbiAgYXV0b0xpbmtWZXJzZXM6IGJvb2xlYW47IC8vIGF1dG8tbGluayB2ZXJzZXMgaW4gdGhlIGN1cnJlbnQgZmlsZSB3aGVuIGZvcm1hdHRpbmcgb3V0bGluZXNcblxuICAvLyBCaWJsZSBnZW5lcmF0aW9uIGRlZmF1bHRzXG4gIGJpYmxlRGVmYXVsdFZlcnNpb246IHN0cmluZyB8IHVuZGVmaW5lZDsgICAgICAgICAgICAgIC8vIGUuZy4gXCJLSlZcIlxuICBiaWJsZURlZmF1bHRWZXJzaW9uRnVsbDogc3RyaW5nIHwgdW5kZWZpbmVkOyAgICAgICAgICAgICAgLy8gZS5nLiBcIktpbmcgSmFtZXMgVmVyc2lvblwiXG4gIGJpYmxlRGVmYXVsdExhbmd1YWdlOiBzdHJpbmc7ICAgICAgICAgICAgIC8vIGUuZy4gXCJFbmdsaXNoXCIsXG4gIGJpYmxlSW5jbHVkZVZlcnNpb25JbkZpbGVuYW1lOiBib29sZWFuOyAgIC8vIFwiSm9obiAoS0pWKVwiICYgQmlibGUvS0pWL1xuICBiaWJsZUFkZEZyb250bWF0dGVyOiBib29sZWFuOyAgICAgICAgICAgICAvLyBhZGQgWUFNTCBmcm9udG1hdHRlciBhdCB0b3BcblxuICAvLyBDYWNoaW5nIG9mIEJvbGxzIGNhdGFsb2d1ZSAodG8gYXZvaWQgcmUtZmV0Y2hpbmcgZXZlcnkgdGltZSlcbiAgYm9sbHNDYXRhbG9ndWVDYWNoZT86IEJvbGxzTGFuZ3VhZ2VbXTtcbiAgYm9sbHNDYXRhbG9ndWVDYWNoZWRBdD86IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEJpYmxlVG9vbHNTZXR0aW5ncyA9IHtcbiAgYmFzZUZvbGRlckJpYmxlOiBcIkJpYmxlXCIsXG4gIGJhc2VGb2xkZXI6IFwiQm9va3NcIixcbiAgcmVkTWFya0NzczogJ2JhY2tncm91bmQ6ICNGRjU1ODJBNjsnLFxuICBpbmRleEZpbGVOYW1lTW9kZTogXCJhcnRpY2xlLXN0eWxlXCIsXG4gIHN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2U6IHRydWUsXG4gIHJlbW92ZU9ic2lkaWFuRGlzcGxheUxpbmtzOiBmYWxzZSxcbiAgcmV3cml0ZU9sZE9ic2lkaWFuTGlua3M6IHRydWUsXG4gIGF1dG9MaW5rVmVyc2VzOiB0cnVlLFxuXG4gIC8vIEJpYmxlIGdlbmVyYXRpb24gZGVmYXVsdHNcbiAgYmlibGVEZWZhdWx0VmVyc2lvbjogdW5kZWZpbmVkLFxuICBiaWJsZURlZmF1bHRWZXJzaW9uRnVsbDogdW5kZWZpbmVkLFxuICBiaWJsZURlZmF1bHRMYW5ndWFnZTogXCJFbmdsaXNoXCIsXG4gIGJpYmxlSW5jbHVkZVZlcnNpb25JbkZpbGVuYW1lOiB0cnVlLFxuICBiaWJsZUFkZEZyb250bWF0dGVyOiBmYWxzZSxcblxuICBib2xsc0NhdGFsb2d1ZUNhY2hlOiB1bmRlZmluZWQsXG4gIGJvbGxzQ2F0YWxvZ3VlQ2FjaGVkQXQ6IHVuZGVmaW5lZCxcbn07XG5cbmV4cG9ydCBjbGFzcyBCaWJsZVRvb2xzU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IE9ic2lkaWFuQmlibGVUb29scztcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBPYnNpZGlhbkJpYmxlVG9vbHMpIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIkJpYmxlIFRvb2xzIFx1MjAxNCBTZXR0aW5nc1wiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkRlZmF1bHQgYmFzZSBmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiUm9vdCBmb2xkZXIgdG8gc2NhbiB3aGVuIGEgY29tbWFuZCBuZWVkcyBhIGZvbGRlciAoZS5nLiwgaW5kZXggY3JlYXRpb24pLlwiKVxuICAgICAgLmFkZFRleHQodCA9PiB0LnNldFBsYWNlaG9sZGVyKFwiQm9va3NcIikuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFzZUZvbGRlcilcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLmJhc2VGb2xkZXIgPSB2IHx8IFwiQm9va3NcIjsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJJbmRleCBmaWxlbmFtZSBtb2RlXCIpXG4gICAgICAuc2V0RGVzYygnSWYgYSBmb2xkZXIgZW5kcyB3aXRoIFwiLCBUaGVcIiBvciBcIiwgQVwiLCBjb252ZXJ0IHRvIFwiVGhlIFx1MjAyNlwiIC8gXCJBIFx1MjAyNlwiLicpXG4gICAgICAuYWRkRHJvcGRvd24oZGQgPT4gZGRcbiAgICAgICAgLmFkZE9wdGlvbihcImZvbGRlci1uYW1lXCIsIFwiS2VlcCBmb2xkZXIgbmFtZVwiKVxuICAgICAgICAuYWRkT3B0aW9uKFwiYXJ0aWNsZS1zdHlsZVwiLCBcIkFydGljbGUgc3R5bGUgKFx1MjAxOCwgVGhlXHUyMDE5IFx1MjE5MiBcdTIwMThUaGUgXHUyMDI2XHUyMDE5KVwiKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5kZXhGaWxlTmFtZU1vZGUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbmRleEZpbGVOYW1lTW9kZSA9ICh2YWx1ZSBhcyBcImZvbGRlci1uYW1lXCIgfCBcImFydGljbGUtc3R5bGVcIik7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJIaWdobGlnaHQgQ1NTXCIpXG4gICAgICAuc2V0RGVzYyhcIkV4YWN0IHN0eWxlIGEgPG1hcms+IHRhZyBtdXN0IGhhdmUgdG8gYmUgY29uc2lkZXJlZCBhIGhpZ2hsaWdodC5cIilcbiAgICAgIC5hZGRUZXh0KHQgPT4gdC5zZXRQbGFjZWhvbGRlcignYmFja2dyb3VuZDogI0ZGNTU4MkE2OycpXG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWRNYXJrQ3NzKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHYpID0+IHsgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmVkTWFya0NzcyA9IHY7IGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpOyB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiU3RyaXAgTWFya2Rvd24gbGlua3MgdGhhdCBsb29rIGxpa2Ugc2NyaXB0dXJlXCIpXG4gICAgICAuYWRkVG9nZ2xlKHQgPT4gdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHYpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlID0gdjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlJlbW92ZSBPYnNpZGlhbiBkaXNwbGF5LXRleHQgbGlua3MgdGhhdCBsb29rIGxpa2UgcmVmZXJlbmNlc1wiKVxuICAgICAgLmFkZFRvZ2dsZSh0ID0+IHRcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnJlbW92ZU9ic2lkaWFuRGlzcGxheUxpbmtzKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MgPSB2YWx1ZTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgLy8gbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgLy8gICAuc2V0TmFtZShcIlJld3JpdGUgbGVnYWN5IE9ic2lkaWFuIGxpbmtzXCIpXG4gICAgLy8gICAuc2V0RGVzYyhcIkNvbnZlcnQgW1tSb20gMSNeM3xcdTIwMjZdXSBcdTIxOTIgW1tSb20jXjEtM3xcdTIwMjZdXSBiZWZvcmUgbGlua2luZyBhbmQgcmVtb3ZlIHByZXZpb3VzIE9ic2lkaWFuIGxpbmtzIHRoYXQgaGF2ZSB2ZXJzZS1saWtlIGRpc3BsYXkgcGF0dGVybi5cIilcbiAgICAvLyAgIC5hZGRUb2dnbGUodCA9PiB0XG4gICAgLy8gICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZXdyaXRlT2xkT2JzaWRpYW5MaW5rcylcbiAgICAvLyAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgIC8vICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJld3JpdGVPbGRPYnNpZGlhbkxpbmtzID0gdmFsdWU7XG4gICAgLy8gICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgLy8gICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJBdXRvLWxpbmsgdmVyc2VzIGFmdGVyIG91dGxpbmUgZm9ybWF0dGluZ1wiKVxuICAgICAgLmFkZFRvZ2dsZSh0ID0+IHRcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9MaW5rVmVyc2VzKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHYpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvTGlua1ZlcnNlcyA9IHY7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgKTtcblxuXG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRGVmYXVsdCBCaWJsZSBmb2xkZXIgdG8gY3JlYXRlIHZlcnNpb25zIGluXCIpXG4gICAgICAuc2V0RGVzYyhcIlJvb3QgZm9sZGVyIHRvIHNjYW4gd2hlbiBhIGNvbW1hbmQgbmVlZHMgYSBmb2xkZXIgKGUuZy4sIGluZGV4IGNyZWF0aW9uKS5cIilcbiAgICAgIC5hZGRUZXh0KHQgPT4gdC5zZXRQbGFjZWhvbGRlcihcIkJpYmxlXCIpLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmJhc2VGb2xkZXJCaWJsZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLmJhc2VGb2xkZXJCaWJsZSA9IHYgfHwgXCJCaWJsZVwiOyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgLy8gSG9zdCBlbGVtZW50IGZvciB0aGUgcGlja2VyIGNvbXBvbmVudFxuICAgIGNvbnN0IHBpY2tlckhvc3QgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoeyBjbHM6IFwiYm9sbHMtcGlja2VyLWhvc3RcIiB9KTtcblxuICAgIC8vIEluc3RhbnRpYXRlIHRoZSByZXVzYWJsZSBwaWNrZXIuXG4gICAgLy8gLSBJdCB3aWxsIGxvYWQvY2FjaGUgQm9sbHMgbGFuZ3VhZ2VzLmpzb24gb24gaXRzIG93bi5cbiAgICAvLyAtIEl0IGNhbGxzIG9uQ2hhbmdlKGxhbmd1YWdlS2V5LCB0cmFuc2xhdGlvbkNvZGUsIHRyYW5zbGF0aW9uRnVsbCkgd2hlbiB1c2VyIGNoYW5nZXMgc2VsZWN0aW9uLlxuICAgIGNvbnN0IHBpY2tlciA9IG5ldyBCb2xsc1BpY2tlckNvbXBvbmVudChcbiAgICAgIHtcbiAgICAgICAgYXBwOiB0aGlzLmFwcCxcbiAgICAgICAgc2V0dGluZ3M6IHRoaXMucGx1Z2luLnNldHRpbmdzIGFzIEJpYmxlVG9vbHNTZXR0aW5ncyxcbiAgICAgICAgbGFuZ0Jsb2NrczogW10sIC8vIGNvbXBvbmVudCB3aWxsIGZldGNoICsgZmlsbFxuICAgICAgICBsYW5ndWFnZUtleTogdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmlibGVEZWZhdWx0TGFuZ3VhZ2UgPz8gXCJBTExcIixcbiAgICAgICAgdHJhbnNsYXRpb25Db2RlOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iaWJsZURlZmF1bHRWZXJzaW9uLFxuICAgICAgICB0cmFuc2xhdGlvbkZ1bGw6IHRoaXMucGx1Z2luLnNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb25GdWxsLFxuICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgIGxhbmd1YWdlTGFiZWw6IHRoaXMucGx1Z2luLnNldHRpbmdzLmJpYmxlRGVmYXVsdExhbmd1YWdlID8/IG51bGwsXG4gICAgICAgICAgdmVyc2lvblNob3J0OiAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmlibGVEZWZhdWx0VmVyc2lvbixcbiAgICAgICAgfSxcbiAgICAgICAgY29udGFpbmVyOiBwaWNrZXJIb3N0LFxuICAgICAgICB2ZXJzaW9uc0NvbnRhaW5lcjogcGlja2VySG9zdC5jcmVhdGVEaXYoKSxcbiAgICAgICAgb25DaGFuZ2U6IGFzeW5jIChsYW5ndWFnZSwgdmVyc2lvbiwgdmVyc2lvbkZ1bGwpID0+IHtcbiAgICAgICAgICAvLyBQZXJzaXN0IHNlbGVjdGlvbnMgYXMgeW91ciBwbHVnaW4gZGVmYXVsdHNcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iaWJsZURlZmF1bHRMYW5ndWFnZSAgICAgPSBsYW5ndWFnZTtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iaWJsZURlZmF1bHRWZXJzaW9uID0gdmVyc2lvbjtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iaWJsZURlZmF1bHRWZXJzaW9uRnVsbCA9IHZlcnNpb25GdWxsO1xuXG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzPy4oKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncyBhcyBCaWJsZVRvb2xzU2V0dGluZ3NcbiAgICApO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgTm90aWNlLCByZXF1ZXN0VXJsLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuXG4vKiogQm9sbHMgZm9ybWF0cyAqL1xuZXhwb3J0IGludGVyZmFjZSBCb2xsc1RyYW5zbGF0aW9uIHtcbiAgc2hvcnRfbmFtZTogc3RyaW5nO1xuICBmdWxsX25hbWU6IHN0cmluZztcbiAgdXBkYXRlZD86IG51bWJlcjtcbiAgZGlyPzogXCJydGxcIiB8IFwibHRyXCI7XG59XG5leHBvcnQgaW50ZXJmYWNlIEJvbGxzTGFuZ3VhZ2Uge1xuICBsYW5ndWFnZTogc3RyaW5nO1xuICB0cmFuc2xhdGlvbnM6IEJvbGxzVHJhbnNsYXRpb25bXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCYXNlQm9sbHNEZWZhdWx0cyB7XG4gIGxhbmd1YWdlTGFiZWw/OiBzdHJpbmc7ICAgLy8gZS5nLiwgXCJFbmdsaXNoXCJcbiAgdmVyc2lvblNob3J0Pzogc3RyaW5nIHwgdW5kZWZpbmVkOyAgICAvLyBlLmcuLCBcIktKVlwiIHwgdW5kZWZpbmVkIG1lYW5zIERlZmF1bHRcbn1cblxuY29uc3QgQk9MTFMgPSB7XG4gIExBTkdVQUdFU19VUkw6IFwiaHR0cHM6Ly9ib2xscy5saWZlL3N0YXRpYy9ib2xscy9hcHAvdmlld3MvbGFuZ3VhZ2VzLmpzb25cIixcbn07XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoTGFuZ3VhZ2VzKCk6IFByb21pc2U8Qm9sbHNMYW5ndWFnZVtdPiB7XG4gIGNvbnN0IHJlcyA9IGF3YWl0IHJlcXVlc3RVcmwoeyB1cmw6IEJPTExTLkxBTkdVQUdFU19VUkwsIG1ldGhvZDogXCJHRVRcIiB9KTtcbiAgaWYgKHJlcy5zdGF0dXMgPCAyMDAgfHwgcmVzLnN0YXR1cyA+PSAzMDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyZXMuc3RhdHVzfWApO1xuICB9XG4gIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UocmVzLnRleHQpIGFzIEJvbGxzTGFuZ3VhZ2VbXTtcbiAgcmV0dXJuIChwYXJzZWQgfHwgW10pLmZpbHRlcihiID0+IEFycmF5LmlzQXJyYXkoYi50cmFuc2xhdGlvbnMpICYmIGIudHJhbnNsYXRpb25zLmxlbmd0aCA+IDApO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJvbGxzUGlja2VyQ29tcG9uZW50T3B0aW9ucyB7XG4gIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3M7XG4gIGxhbmdCbG9ja3M6IEJvbGxzTGFuZ3VhZ2VbXTsgICAgICAgICAgICAgLy8gY2FuIHBhc3MgW10gXHUyMDE0IHdpbGwgYmUgbG9hZGVkXG4gIGxhbmd1YWdlS2V5OiBzdHJpbmc7ICAgICAgICAgICAgICAgICAgICAgLy8gaW5pdGlhbCBzZWxlY3Rpb24gKGUuZy4sIFwiQUxMXCIpXG4gIHRyYW5zbGF0aW9uQ29kZTogc3RyaW5nIHwgdW5kZWZpbmVkOyAvLyBcIktKVlwiIG9yIHVuZGVmaW5lZCBmb3IgRGVmYXVsdFxuICB0cmFuc2xhdGlvbkZ1bGw/OiBzdHJpbmc7ICAgICAgICAgICAgICAgIC8vIG9wdGlvbmFsIGluaXRpYWwgZnVsbCBuYW1lXG4gIGRlZmF1bHRzPzogQmFzZUJvbGxzRGVmYXVsdHM7ICAgICAgICAgICAgLy8gb3B0aW9uYWwgZGVmYXVsdHMgdG8gcHJlc2VsZWN0XG4gIG9uQ2hhbmdlOiAobGFuZ3VhZ2U6IHN0cmluZywgdmVyc2lvbjogc3RyaW5nIHwgdW5kZWZpbmVkLCB2ZXJzaW9uRnVsbDogc3RyaW5nIHwgdW5kZWZpbmVkKSA9PiB2b2lkO1xuICBjb250YWluZXI6IEhUTUxFbGVtZW50OyAgICAgICAgICAgICAgICAgIC8vIGhvc3QgZWxlbWVudFxuICB2ZXJzaW9uc0NvbnRhaW5lcj86IEhUTUxEaXZFbGVtZW50OyAgICAgIC8vIChzZXQgYnkgY29tcG9uZW50KVxuICBhcHA6IGFueTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBsdWdpbi9hcHAgaW5zdGFuY2UgZm9yIHNhdmluZ1xuICBkaXNhbGxvd0RlZmF1bHQ/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgQm9sbHNQaWNrZXJDb21wb25lbnQge1xuICBwcml2YXRlIG9wdGlvbnM6IEJvbGxzUGlja2VyQ29tcG9uZW50T3B0aW9ucztcbiAgcHJpdmF0ZSBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzO1xuICBwcml2YXRlIGFwcDogYW55O1xuXG4gIC8vIHJlZmVyZW5jZSBrZXB0IHRvIHRoZSBhY3R1YWwgdmVyc2lvbnMgY29udGFpbmVyIHdlIHJlbmRlciBpbnRvXG4gIHZlcnNpb25zQ29udGFpbmVyITogSFRNTERpdkVsZW1lbnQ7XG5cbiAgcHJpdmF0ZSBzdGF0aWMgREVGQVVMVF9TRU5USU5FTCA9IFwiX19ERUZBVUxUX19cIjtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBCb2xsc1BpY2tlckNvbXBvbmVudE9wdGlvbnMsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MsIGRpc2FsbG93RGVmYXVsdDogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgdGhpcy5hcHAgPSBvcHRpb25zLmFwcDtcblxuICAgIGlmIChkaXNhbGxvd0RlZmF1bHQpIHRoaXMuc2V0RGlzYWxsb3dEZWZhdWx0KHRydWUpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICAvKiogSGVscGVyOiBnZXQgdHJhbnNsYXRpb25zIGZvciBhIGxhbmd1YWdlIG9yIEFMTCAoZGVkdXAgYnkgc2hvcnRfbmFtZSkgKi9cbiAgcHJvdGVjdGVkIHRyYW5zbGF0aW9uc0Zvckxhbmd1YWdlKGxhbmdLZXk6IHN0cmluZyk6IEJvbGxzVHJhbnNsYXRpb25bXSB7XG4gICAgaWYgKGxhbmdLZXkgPT09IFwiQUxMXCIpIHtcbiAgICAgIGNvbnN0IGFsbDogQm9sbHNUcmFuc2xhdGlvbltdID0gW107XG4gICAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIHRoaXMub3B0aW9ucy5sYW5nQmxvY2tzKSBhbGwucHVzaCguLi5ibG9jay50cmFuc2xhdGlvbnMpO1xuICAgICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgcmV0dXJuIGFsbFxuICAgICAgICAuZmlsdGVyKHQgPT4gKHNlZW4uaGFzKHQuc2hvcnRfbmFtZSkgPyBmYWxzZSA6IChzZWVuLmFkZCh0LnNob3J0X25hbWUpLCB0cnVlKSkpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBhLnNob3J0X25hbWUubG9jYWxlQ29tcGFyZShiLnNob3J0X25hbWUpKTtcbiAgICB9XG4gICAgY29uc3QgYmxvY2sgPSB0aGlzLm9wdGlvbnMubGFuZ0Jsb2Nrcy5maW5kKGIgPT4gYi5sYW5ndWFnZSA9PT0gbGFuZ0tleSk7XG4gICAgaWYgKCFibG9jaykgcmV0dXJuIFtdO1xuICAgIHJldHVybiBibG9jay50cmFuc2xhdGlvbnMuc2xpY2UoKS5zb3J0KChhLCBiKSA9PiBhLnNob3J0X25hbWUubG9jYWxlQ29tcGFyZShiLnNob3J0X25hbWUpKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgbG9hZENhdGFsb2d1ZSgpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY2FjaGVkID0gdGhpcy5zZXR0aW5ncy5ib2xsc0NhdGFsb2d1ZUNhY2hlIGFzIHVua25vd24gYXMgQm9sbHNMYW5ndWFnZVtdIHwgdW5kZWZpbmVkO1xuICAgICAgaWYgKGNhY2hlZD8ubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5sYW5nQmxvY2tzID0gY2FjaGVkO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLm9wdGlvbnMubGFuZ0Jsb2NrcyA9IGF3YWl0IGZldGNoTGFuZ3VhZ2VzKCk7XG4gICAgICB0cnkge1xuICAgICAgICAodGhpcy5zZXR0aW5ncyBhcyBhbnkpLmJvbGxzQ2F0YWxvZ3VlQ2FjaGUgPSB0aGlzLm9wdGlvbnMubGFuZ0Jsb2NrcztcbiAgICAgICAgKHRoaXMuc2V0dGluZ3MgYXMgYW55KS5ib2xsc0NhdGFsb2d1ZUNhY2hlZEF0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdGhpcy5hcHA/LnNhdmVQbHVnaW5TZXR0aW5ncz8uKCk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKFwiW0JvbGxzXSBDb3VsZCBub3QgZmV0Y2ggbGFuZ3VhZ2VzLmpzb246XCIsIGUpO1xuICAgICAgdGhpcy5vcHRpb25zLmxhbmdCbG9ja3MgPSBbe1xuICAgICAgICBsYW5ndWFnZTogXCJFbmdsaXNoXCIsXG4gICAgICAgIHRyYW5zbGF0aW9uczogW1xuICAgICAgICAgIHsgc2hvcnRfbmFtZTogXCJLSlZcIiwgZnVsbF9uYW1lOiBcIktpbmcgSmFtZXMgVmVyc2lvbiAxNzY5IHdpdGggQXBvY3J5cGhhIGFuZCBTdHJvbmcncyBOdW1iZXJzXCIgfSxcbiAgICAgICAgICB7IHNob3J0X25hbWU6IFwiV0VCXCIsIGZ1bGxfbmFtZTogXCJXb3JsZCBFbmdsaXNoIEJpYmxlXCIgfSxcbiAgICAgICAgICB7IHNob3J0X25hbWU6IFwiWUxUXCIsIGZ1bGxfbmFtZTogXCJZb3VuZydzIExpdGVyYWwgVHJhbnNsYXRpb24gKDE4OTgpXCIgfSxcbiAgICAgICAgXSxcbiAgICAgIH1dO1xuICAgICAgbmV3IE5vdGljZShcIlVzaW5nIG1pbmltYWwgZmFsbGJhY2sgY2F0YWxvZ3VlIChLSlYvV0VCL1lMVCkuXCIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHJlbmRlcigpIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lciB9ID0gdGhpcy5vcHRpb25zO1xuICAgIGNvbnRhaW5lci5lbXB0eSgpO1xuXG4gICAgLy8gZW5zdXJlIGNhdGFsb2cgaXMgbG9hZGVkXG4gICAgYXdhaXQgdGhpcy5sb2FkQ2F0YWxvZ3VlKCk7XG5cbiAgICAvLyBhcHBseSBkZWZhdWx0cyAoaWYgYW55KVxuICAgIGlmICh0aGlzLm9wdGlvbnMuZGVmYXVsdHM/Lmxhbmd1YWdlTGFiZWwpIHtcbiAgICAgIGNvbnN0IGZvdW5kID0gdGhpcy5vcHRpb25zLmxhbmdCbG9ja3MuZmluZChiID0+IGIubGFuZ3VhZ2UgPT09IHRoaXMub3B0aW9ucy5kZWZhdWx0cyEubGFuZ3VhZ2VMYWJlbCk7XG4gICAgICBpZiAoZm91bmQpIHRoaXMub3B0aW9ucy5sYW5ndWFnZUtleSA9IGZvdW5kLmxhbmd1YWdlO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZmF1bHRzKSB7XG4gICAgICAvLyBJZiB2ZXJzaW9uU2hvcnQgaXMgZXhwbGljaXRseSB1bmRlZmluZWQgLT4gRGVmYXVsdFxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5kZWZhdWx0cy52ZXJzaW9uU2hvcnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25GdWxsID0gdW5kZWZpbmVkO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuZGVmYXVsdHMudmVyc2lvblNob3J0KSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgPSB0aGlzLm9wdGlvbnMuZGVmYXVsdHMudmVyc2lvblNob3J0O1xuICAgICAgICBjb25zdCB0ID0gdGhpcy50cmFuc2xhdGlvbnNGb3JMYW5ndWFnZSh0aGlzLm9wdGlvbnMubGFuZ3VhZ2VLZXkpXG4gICAgICAgICAgLmZpbmQoeCA9PiB4LnNob3J0X25hbWUgPT09IHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUpO1xuICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25GdWxsID0gdD8uZnVsbF9uYW1lID8/IHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgPz8gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIExBTkdVQUdFIFBJQ0tFUlxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lcilcbiAgICAgIC5zZXROYW1lKFwiQmlibGUgbGFuZ3VhZ2VcIilcbiAgICAgIC5hZGREcm9wZG93bihkZCA9PiB7XG4gICAgICAgIGRkLmFkZE9wdGlvbihcIkFMTFwiLCBcIkFsbCBsYW5ndWFnZXNcIik7XG4gICAgICAgIGZvciAoY29uc3QgYmxvY2sgb2YgdGhpcy5vcHRpb25zLmxhbmdCbG9ja3MpIHtcbiAgICAgICAgICBkZC5hZGRPcHRpb24oYmxvY2subGFuZ3VhZ2UsIGJsb2NrLmxhbmd1YWdlKTtcbiAgICAgICAgfVxuICAgICAgICBkZC5zZXRWYWx1ZSh0aGlzLm9wdGlvbnMubGFuZ3VhZ2VLZXkpO1xuICAgICAgICBkZC5vbkNoYW5nZSh2ID0+IHtcbiAgICAgICAgICB0aGlzLm9wdGlvbnMubGFuZ3VhZ2VLZXkgPSB2O1xuICAgICAgICAgIHRoaXMucmVuZGVyVmVyc2lvbnMoKTsgLy8gcmVidWlsZCB2ZXJzaW9ucyBmb3IgdGhlIHNlbGVjdGVkIGxhbmd1YWdlXG4gICAgICAgICAgdGhpcy5vcHRpb25zLm9uQ2hhbmdlKHRoaXMub3B0aW9ucy5sYW5ndWFnZUtleSwgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSwgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uRnVsbCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAvLyBWRVJTSU9OUyAoZHluYW1pYylcbiAgICB0aGlzLnZlcnNpb25zQ29udGFpbmVyID0gY29udGFpbmVyLmNyZWF0ZURpdigpO1xuICAgIHRoaXMub3B0aW9ucy52ZXJzaW9uc0NvbnRhaW5lciA9IHRoaXMudmVyc2lvbnNDb250YWluZXI7XG4gICAgdGhpcy5yZW5kZXJWZXJzaW9ucygpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXREaXNhbGxvd0RlZmF1bHQoZGlzYWxsb3c6IGJvb2xlYW4pIHtcbiAgICB0aGlzLm9wdGlvbnMuZGlzYWxsb3dEZWZhdWx0ID0gZGlzYWxsb3c7XG4gICAgLy8gSWYgd2Ugbm93IGRpc2FsbG93IGRlZmF1bHQgYnV0IGN1cnJlbnQgaXMgdW5kZWZpbmVkLCBjb2VyY2UgdG8gZmlyc3QgYXZhaWxhYmxlXG4gICAgaWYgKGRpc2FsbG93ICYmICh0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlID09IHVuZGVmaW5lZCB8fCB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlID09PSBcIlwiKSkge1xuICAgICAgY29uc3QgbGlzdCA9IHRoaXMudHJhbnNsYXRpb25zRm9yTGFuZ3VhZ2UodGhpcy5vcHRpb25zLmxhbmd1YWdlS2V5KTtcbiAgICAgIGlmIChsaXN0Lmxlbmd0aCkge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmxhbmd1YWdlS2V5ID09PSBcIkVuZ2xpc2hcIiAmJiBsaXN0LnNvbWUodCA9PiB0LnNob3J0X25hbWUgPT09IFwiS0pWXCIpKSB7XG4gICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSA9IFwiS0pWXCI7XG4gICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uRnVsbCA9IGxpc3QuZmluZCh0ID0+IHQuc2hvcnRfbmFtZSA9PT0gXCJLSlZcIik/LmZ1bGxfbmFtZSA/PyBcIktKVlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgPSBsaXN0WzBdLnNob3J0X25hbWU7XG4gICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uRnVsbCA9IGxpc3RbMF0uZnVsbF9uYW1lO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub3B0aW9ucy5vbkNoYW5nZSh0aGlzLm9wdGlvbnMubGFuZ3VhZ2VLZXksIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUsIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkZ1bGwpO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBSZWJ1aWxkIHZlcnNpb25zIFVJIHRvIHJlZmxlY3QgdGhlIGZsYWdcbiAgICBpZiAodGhpcy52ZXJzaW9uc0NvbnRhaW5lcikgdGhpcy5yZW5kZXJWZXJzaW9ucygpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJWZXJzaW9ucygpIHtcbiAgICB0aGlzLnZlcnNpb25zQ29udGFpbmVyLmVtcHR5KCk7XG4gICAgY29uc3QgbGlzdCA9IHRoaXMudHJhbnNsYXRpb25zRm9yTGFuZ3VhZ2UodGhpcy5vcHRpb25zLmxhbmd1YWdlS2V5KTtcblxuICAgIG5ldyBTZXR0aW5nKHRoaXMudmVyc2lvbnNDb250YWluZXIpXG4gICAgICAuc2V0TmFtZShcIlZlcnNpb25cIilcbiAgICAgIC5hZGREcm9wZG93bihkZCA9PiB7XG4gICAgICAgIGNvbnN0IHNlbCA9IGRkLnNlbGVjdEVsIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICBzZWwuc3R5bGUubWF4V2lkdGggPSBcIjM2MHB4XCI7XG4gICAgICAgIHNlbC5zdHlsZS53aGl0ZVNwYWNlID0gXCJub3dyYXBcIjtcblxuICAgICAgICAvLyBPbmx5IHNob3cgXCJEZWZhdWx0XCIgd2hlbiBhbGxvd2VkXG4gICAgICAgIGNvbnN0IGFsbG93RGVmYXVsdCA9ICF0aGlzLm9wdGlvbnMuZGlzYWxsb3dEZWZhdWx0O1xuXG4gICAgICAgIGlmIChhbGxvd0RlZmF1bHQpIHtcbiAgICAgICAgICBkZC5hZGRPcHRpb24oQm9sbHNQaWNrZXJDb21wb25lbnQuREVGQVVMVF9TRU5USU5FTCwgXCJEZWZhdWx0XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFsaXN0Lmxlbmd0aCkge1xuICAgICAgICAgIC8vIFdpdGggbm8gdHJhbnNsYXRpb25zIGF2YWlsYWJsZTpcbiAgICAgICAgICBpZiAoYWxsb3dEZWZhdWx0KSB7XG4gICAgICAgICAgICBkZC5zZXRWYWx1ZShcbiAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSA9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICA/IEJvbGxzUGlja2VyQ29tcG9uZW50LkRFRkFVTFRfU0VOVElORUxcbiAgICAgICAgICAgICAgICA6IEJvbGxzUGlja2VyQ29tcG9uZW50LkRFRkFVTFRfU0VOVElORUxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uRnVsbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZGlzYWxsb3dEZWZhdWx0OiBub3RoaW5nIHRvIHBpY2ssIGtlZXAgZW1wdHlcbiAgICAgICAgICAgIGRkLmFkZE9wdGlvbihcIlwiLCBcIihubyB0cmFuc2xhdGlvbnMpXCIpO1xuICAgICAgICAgICAgZGQuc2V0VmFsdWUoXCJcIik7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlID0gXCJcIjtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkZ1bGwgPSBcIlwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IHQgb2YgbGlzdCkge1xuICAgICAgICAgIGRkLmFkZE9wdGlvbih0LnNob3J0X25hbWUsIGAke3Quc2hvcnRfbmFtZX0gXHUyMDE0ICR7dC5mdWxsX25hbWV9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZXRlcm1pbmUgaW5pdGlhbCB2YWx1ZVxuICAgICAgICBsZXQgaW5pdGlhbFZhbHVlOiBzdHJpbmc7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlID09IHVuZGVmaW5lZCB8fCB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlID09PSBcIlwiKSB7XG4gICAgICAgICAgaWYgKGFsbG93RGVmYXVsdCkge1xuICAgICAgICAgICAgaW5pdGlhbFZhbHVlID0gQm9sbHNQaWNrZXJDb21wb25lbnQuREVGQVVMVF9TRU5USU5FTDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW5pdGlhbFZhbHVlID0gbGlzdFswXS5zaG9ydF9uYW1lOyAvLyBjb2VyY2UgdG8gZmlyc3RcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgZXhpc3RzID0gbGlzdC5zb21lKHQgPT4gdC5zaG9ydF9uYW1lID09PSB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlKTtcbiAgICAgICAgICBpbml0aWFsVmFsdWUgPSBleGlzdHMgPyAodGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSBhcyBzdHJpbmcpIDogbGlzdFswXS5zaG9ydF9uYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgZGQuc2V0VmFsdWUoaW5pdGlhbFZhbHVlKTtcblxuICAgICAgICAvLyBTeW5jIGludGVybmFsIHN0YXRlXG4gICAgICAgIGlmIChpbml0aWFsVmFsdWUgPT09IEJvbGxzUGlja2VyQ29tcG9uZW50LkRFRkFVTFRfU0VOVElORUwpIHtcbiAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlID0gdW5kZWZpbmVkO1xuICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkZ1bGwgPSB1bmRlZmluZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSA9IGluaXRpYWxWYWx1ZTtcbiAgICAgICAgICBjb25zdCB0dCA9IGxpc3QuZmluZCh4ID0+IHguc2hvcnRfbmFtZSA9PT0gaW5pdGlhbFZhbHVlKTtcbiAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25GdWxsID0gdHQ/LmZ1bGxfbmFtZSA/PyBpbml0aWFsVmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICBkZC5vbkNoYW5nZSh2ID0+IHtcbiAgICAgICAgICBpZiAoYWxsb3dEZWZhdWx0ICYmIHYgPT09IEJvbGxzUGlja2VyQ29tcG9uZW50LkRFRkFVTFRfU0VOVElORUwpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25GdWxsID0gdW5kZWZpbmVkO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlID0gdjtcbiAgICAgICAgICAgIGNvbnN0IHQyID0gbGlzdC5maW5kKHggPT4geC5zaG9ydF9uYW1lID09PSB2KTtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkZ1bGwgPSB0Mj8uZnVsbF9uYW1lID8/IHY7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMub3B0aW9ucy5vbkNoYW5nZSh0aGlzLm9wdGlvbnMubGFuZ3VhZ2VLZXksIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUsIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkZ1bGwpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICB9XG59IiwgIi8vIHNyYy9jb21tYW5kcy92ZXJzZUxpbmtzLnRzXG5pbXBvcnQge1xuICBBcHAsXG4gIE1hcmtkb3duVmlldyxcbiAgTW9kYWwsXG4gIE5vdGljZSxcbiAgU2V0dGluZyxcbiAgVEZpbGUsXG4gIHJlcXVlc3RVcmwsXG59IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBzcGxpdEZyb250bWF0dGVyIH0gZnJvbSBcIi4uL2xpYi9tZC11dGlsc1wiO1xuaW1wb3J0IHsgUGlja1ZlcnNpb25Nb2RhbCB9IGZyb20gXCJzcmMvdWkvcGljay12ZXJzaW9uLW1vZGFsXCI7XG5cbi8qKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICBCT09LIE1BUCAoZGVmYXVsdCwgRW5nbGlzaClcbiAqICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cbmNvbnN0IEJPT0tfQUJCUjogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgLy8gLS0tLSBQZW50YXRldWNoIC0tLS1cbiAgXCJHZW5lc2lzXCI6IFwiR2VuXCIsXG4gIFwiMSBNb3NlXCI6IFwiR2VuXCIsIFwiMU1vc2VcIjogXCJHZW5cIixcbiAgXCIxLiBNb3NlXCI6IFwiR2VuXCIsIFwiMS5Nb3NlXCI6IFwiR2VuXCIsXG5cbiAgXCJFeG9kdXNcIjogXCJFeG9cIixcbiAgXCIyIE1vc2VcIjogXCJFeG9cIiwgXCIyTW9zZVwiOiBcIkV4b1wiLFxuICBcIjIuIE1vc2VcIjogXCJFeG9cIiwgXCIyLk1vc2VcIjogXCJFeG9cIixcblxuICBcIkxldml0aWN1c1wiOiBcIkxldlwiLFxuICBcIjMgTW9zZVwiOiBcIkxldlwiLCBcIjNNb3NlXCI6IFwiTGV2XCIsXG4gIFwiMy4gTW9zZVwiOiBcIkxldlwiLCBcIjMuTW9zZVwiOiBcIkxldlwiLFxuXG4gIFwiTnVtYmVyc1wiOiBcIk51bVwiLFxuICBcIk51bWVyaVwiOiBcIk51bVwiLFxuICBcIjQgTW9zZVwiOiBcIk51bVwiLCBcIjRNb3NlXCI6IFwiTnVtXCIsXG4gIFwiNC4gTW9zZVwiOiBcIk51bVwiLCBcIjQuTW9zZVwiOiBcIk51bVwiLFxuXG4gIFwiRGV1dGVyb25vbXlcIjogXCJEZXV0XCIsXG4gIFwiRGV1dGVyb25vbWl1bVwiOiBcIkRldXRcIixcbiAgXCI1IE1vc2VcIjogXCJEZXV0XCIsIFwiNU1vc2VcIjogXCJEZXV0XCIsXG4gIFwiNS4gTW9zZVwiOiBcIkRldXRcIiwgXCI1Lk1vc2VcIjogXCJEZXV0XCIsXG5cbiAgLy8gLS0tLSBIaXN0b3JpY2FsIC0tLS1cbiAgXCJKb3NodWFcIjogXCJKb3NoXCIsIFwiSm9zdWFcIjogXCJKb3NoXCIsXG4gIFwiSnVkZ2VzXCI6IFwiSnVkZ1wiLCBcIlJpY2h0ZXJcIjogXCJKdWRnXCIsXG4gIFwiUnV0aFwiOiBcIlJ1dGhcIixcblxuICBcIjEgU2FtdWVsXCI6IFwiMSBTYW1cIiwgXCIxLiBTYW11ZWxcIjogXCIxIFNhbVwiLCBcIjFTYW11ZWxcIjogXCIxIFNhbVwiLCBcIjEuU2FtdWVsXCI6IFwiMSBTYW1cIixcbiAgXCIyIFNhbXVlbFwiOiBcIjIgU2FtXCIsIFwiMi4gU2FtdWVsXCI6IFwiMiBTYW1cIiwgXCIyU2FtdWVsXCI6IFwiMiBTYW1cIiwgXCIyLlNhbXVlbFwiOiBcIjIgU2FtXCIsXG5cbiAgXCIxIEtpbmdzXCI6IFwiMSBLaW5nc1wiLCBcIjEuIEtcdTAwRjZuaWdlXCI6IFwiMSBLaW5nc1wiLCBcIjFLXHUwMEY2bmlnZVwiOiBcIjEgS2luZ3NcIiwgXCIxLktcdTAwRjZuaWdlXCI6IFwiMSBLaW5nc1wiLFxuICBcIjIgS2luZ3NcIjogXCIyIEtpbmdzXCIsIFwiMi4gS1x1MDBGNm5pZ2VcIjogXCIyIEtpbmdzXCIsIFwiMktcdTAwRjZuaWdlXCI6IFwiMiBLaW5nc1wiLCBcIjIuS1x1MDBGNm5pZ2VcIjogXCIyIEtpbmdzXCIsXG5cbiAgXCIxIENocm9uaWNsZXNcIjogXCIxIENocm9uXCIsIFwiMS4gQ2hyb25pa1wiOiBcIjEgQ2hyb25cIiwgXCIxQ2hyb25pa1wiOiBcIjEgQ2hyb25cIiwgXCIxLkNocm9uaWtcIjogXCIxIENocm9uXCIsXG4gIFwiMiBDaHJvbmljbGVzXCI6IFwiMiBDaHJvblwiLCBcIjIuIENocm9uaWtcIjogXCIyIENocm9uXCIsIFwiMkNocm9uaWtcIjogXCIyIENocm9uXCIsIFwiMi5DaHJvbmlrXCI6IFwiMiBDaHJvblwiLFxuXG4gIFwiRXpyYVwiOiBcIkV6cmFcIiwgXCJFc3JhXCI6IFwiRXpyYVwiLFxuICBcIk5laGVtaWFoXCI6IFwiTmVoXCIsIFwiTmVoZW1pYVwiOiBcIk5laFwiLFxuICBcIkVzdGhlclwiOiBcIkVzdGhcIixcbiAgXCJKb2JcIjogXCJKb2JcIiwgXCJIaW9iXCI6IFwiSm9iXCIsXG5cbiAgLy8gLS0tLSBXaXNkb20gLS0tLVxuICBcIlBzYWxtc1wiOiBcIlBzYVwiLCBcIlBzYWxtXCI6IFwiUHNhXCIsIFwiUHNcIjogXCJQc2FcIixcbiAgXCJQcm92ZXJic1wiOiBcIlByb3ZcIiwgXCJTcHJcdTAwRkNjaGVcIjogXCJQcm92XCIsIFwiU3ByXCI6IFwiUHJvdlwiLFxuICBcIkVjY2xlc2lhc3Rlc1wiOiBcIkVjY2xcIiwgXCJQcmVkaWdlclwiOiBcIkVjY2xcIiwgXCJLb2hlbGV0XCI6IFwiRWNjbFwiLFxuICBcIlNvbmcgb2YgU29sb21vblwiOiBcIlNvU1wiLCBcIlNvbmcgb2YgU29uZ3NcIjogXCJTb1NcIiwgXCJIb2hlc2xpZWRcIjogXCJTb1NcIiwgXCJIb2hlbGllZFwiOiBcIlNvU1wiLCBcIkxpZWQgZGVyIExpZWRlclwiOiBcIlNvU1wiLCBcIlNTXCI6IFwiU29TXCIsXG5cbiAgLy8gLS0tLSBQcm9waGV0cyAtLS0tXG4gIFwiSXNhaWFoXCI6IFwiSXNhXCIsIFwiSmVzYWphXCI6IFwiSXNhXCIsXG4gIFwiSmVyZW1pYWhcIjogXCJKZXJcIiwgXCJKZXJlbWlhXCI6IFwiSmVyXCIsXG4gIFwiTGFtZW50YXRpb25zXCI6IFwiTGFtXCIsIFwiS2xhZ2VsaWVkZXJcIjogXCJMYW1cIiwgXCJUaHJlbmlcIjogXCJMYW1cIixcbiAgXCJFemVraWVsXCI6IFwiRXpla1wiLCBcIkhlc2VraWVsXCI6IFwiRXpla1wiLCBcIkV6ZWNoaWVsXCI6IFwiRXpla1wiLFxuICBcIkRhbmllbFwiOiBcIkRhblwiLFxuICBcIkhvc2VhXCI6IFwiSG9zZWFcIixcbiAgXCJKb2VsXCI6IFwiSm9lbFwiLFxuICBcIkFtb3NcIjogXCJBbW9zXCIsXG4gIFwiT2JhZGlhaFwiOiBcIk9iYWRcIiwgXCJPYmFkamFcIjogXCJPYmFkXCIsXG4gIFwiSm9uYWhcIjogXCJKb25haFwiLCBcIkpvbmFcIjogXCJKb25haFwiLFxuICBcIk1pY2FoXCI6IFwiTWljYWhcIiwgXCJNaWNoYVwiOiBcIk1pY2FoXCIsXG4gIFwiTmFodW1cIjogXCJOYWhcIixcbiAgXCJIYWJha2t1a1wiOiBcIkhhYlwiLCBcIkhhYmFrdWtcIjogXCJIYWJcIixcbiAgXCJaZXBoYW5pYWhcIjogXCJaZXBcIiwgXCJaZXBoYW5qYVwiOiBcIlplcFwiLCBcIlplZmFuamFcIjogXCJaZXBcIixcbiAgXCJIYWdnYWlcIjogXCJIYWdcIixcbiAgXCJaZWNoYXJpYWhcIjogXCJaZWNoXCIsIFwiU2FjaGFyamFcIjogXCJaZWNoXCIsXG4gIFwiTWFsYWNoaVwiOiBcIk1hbFwiLCBcIk1hbGVhY2hpXCI6IFwiTWFsXCIsXG5cbiAgLy8gLS0tLSBHb3NwZWxzICYgQWN0cyAtLS0tXG4gIFwiTWF0dGhld1wiOiBcIk1hdHRcIiwgXCJNYXR0aFx1MDBFNHVzXCI6IFwiTWF0dFwiLCBcIk10XCI6IFwiTWF0dFwiLFxuICBcIk1hcmtcIjogXCJNYXJrXCIsIFwiTWFya3VzXCI6IFwiTWFya1wiLCBcIk1rXCI6IFwiTWFya1wiLFxuICBcIkx1a2VcIjogXCJMdWtlXCIsIFwiTHVrYXNcIjogXCJMdWtlXCIsIFwiTGtcIjogXCJMdWtlXCIsIFwiTHVrXCI6IFwiTHVrZVwiLFxuICBcIkpvaG5cIjogXCJKb2huXCIsIFwiSm9oYW5uZXNcIjogXCJKb2huXCIsIFwiSm9oXCI6IFwiSm9oblwiLFxuICBcIkFjdHNcIjogXCJBY3RzXCIsIFwiQXBnXCI6IFwiQWN0c1wiLCBcIkFwb3N0ZWxnZXNjaGljaHRlXCI6IFwiQWN0c1wiLFxuXG4gIC8vIC0tLS0gUGF1bFx1MjAxOXMgbGV0dGVycyAtLS0tXG4gIFwiUm9tYW5zXCI6IFwiUm9tXCIsIFwiUlx1MDBGNm1lclwiOiBcIlJvbVwiLCBcIlJcdTAwRjZtXCI6IFwiUm9tXCIsIFwiUlx1MDBGNm1lcmJyaWVmXCI6IFwiUm9tXCIsXG5cbiAgXCIxIENvcmludGhpYW5zXCI6IFwiMSBDb3JcIiwgXCIxIEtvcmludGhlclwiOiBcIjEgQ29yXCIsIFwiMS4gS29yaW50aGVyXCI6IFwiMSBDb3JcIiwgXCIxS29yaW50aGVyXCI6IFwiMSBDb3JcIiwgXCIxLktvcmludGhlclwiOiBcIjEgQ29yXCIsXG4gIFwiMSBLb3JcIjogXCIxIENvclwiLCBcIjEuIEtvclwiOiBcIjEgQ29yXCIsIFwiMUtvclwiOiBcIjEgQ29yXCIsIFwiMS5Lb3JcIjogXCIxIENvclwiLFxuXG4gIFwiMiBDb3JpbnRoaWFuc1wiOiBcIjIgQ29yXCIsIFwiMiBLb3JpbnRoZXJcIjogXCIyIENvclwiLCBcIjIuIEtvcmludGhlclwiOiBcIjIgQ29yXCIsIFwiMktvcmludGhlclwiOiBcIjIgQ29yXCIsIFwiMi5Lb3JpbnRoZXJcIjogXCIyIENvclwiLFxuICBcIjIgS29yXCI6IFwiMiBDb3JcIiwgXCIyLiBLb3JcIjogXCIyIENvclwiLCBcIjJLb3JcIjogXCIyIENvclwiLCBcIjIuS29yXCI6IFwiMiBDb3JcIixcblxuICBcIkdhbGF0aWFuc1wiOiBcIkdhbFwiLCBcIkdhbGF0ZXJcIjogXCJHYWxcIiwgXCJHYWxcIjogXCJHYWxcIixcbiAgXCJFcGhlc2lhbnNcIjogXCJFcGhcIiwgXCJFcGhlc2VyXCI6IFwiRXBoXCIsIFwiRXBoXCI6IFwiRXBoXCIsXG4gIFwiUGhpbGlwcGlhbnNcIjogXCJQaGlsXCIsIFwiUGhpbGlwcGVyXCI6IFwiUGhpbFwiLCBcIlBoaWxcIjogXCJQaGlsXCIsXG4gIFwiQ29sb3NzaWFuc1wiOiBcIkNvbFwiLCBcIktvbG9zc2VyXCI6IFwiQ29sXCIsIFwiS29sXCI6IFwiQ29sXCIsXG5cbiAgXCIxIFRoZXNzYWxvbmlhbnNcIjogXCIxIFRoZXNcIiwgXCIxIFRoZXNzXCI6IFwiMSBUaGVzXCIsIFwiMS4gVGhlc3NcIjogXCIxIFRoZXNcIiwgXCIxVGhlc3NcIjogXCIxIFRoZXNcIiwgXCIxLlRoZXNzXCI6IFwiMSBUaGVzXCIsXG4gIFwiMSBUaGVzc2Fsb25pY2hlclwiOiBcIjEgVGhlc1wiLCBcIjEuIFRoZXNzYWxvbmljaGVyXCI6IFwiMSBUaGVzXCIsIFwiMVRoZXNzYWxvbmljaGVyXCI6IFwiMSBUaGVzXCIsIFwiMS5UaGVzc2Fsb25pY2hlclwiOiBcIjEgVGhlc1wiLFxuXG4gIFwiMiBUaGVzc2Fsb25pYW5zXCI6IFwiMiBUaGVzXCIsIFwiMiBUaGVzc1wiOiBcIjIgVGhlc1wiLCBcIjIuIFRoZXNzXCI6IFwiMiBUaGVzXCIsIFwiMlRoZXNzXCI6IFwiMiBUaGVzXCIsIFwiMi5UaGVzc1wiOiBcIjIgVGhlc1wiLFxuICBcIjIgVGhlc3NhbG9uaWNoZXJcIjogXCIyIFRoZXNcIiwgXCIyLiBUaGVzc2Fsb25pY2hlclwiOiBcIjIgVGhlc1wiLCBcIjJUaGVzc2Fsb25pY2hlclwiOiBcIjIgVGhlc1wiLCBcIjIuVGhlc3NhbG9uaWNoZXJcIjogXCIyIFRoZXNcIixcblxuICBcIjEgVGltb3RoeVwiOiBcIjEgVGltXCIsIFwiMSBUaW1vdGhldXNcIjogXCIxIFRpbVwiLCBcIjEuIFRpbW90aGV1c1wiOiBcIjEgVGltXCIsIFwiMVRpbW90aGV1c1wiOiBcIjEgVGltXCIsIFwiMS5UaW1vdGhldXNcIjogXCIxIFRpbVwiLFxuICBcIjEgVGltXCI6IFwiMSBUaW1cIiwgXCIxLiBUaW1cIjogXCIxIFRpbVwiLCBcIjFUaW1cIjogXCIxIFRpbVwiLCBcIjEuVGltXCI6IFwiMSBUaW1cIixcblxuICBcIjIgVGltb3RoeVwiOiBcIjIgVGltXCIsIFwiMiBUaW1vdGhldXNcIjogXCIyIFRpbVwiLCBcIjIuIFRpbW90aGV1c1wiOiBcIjIgVGltXCIsIFwiMlRpbW90aGV1c1wiOiBcIjIgVGltXCIsIFwiMi5UaW1vdGhldXNcIjogXCIyIFRpbVwiLFxuICBcIjIgVGltXCI6IFwiMiBUaW1cIiwgXCIyLiBUaW1cIjogXCIyIFRpbVwiLCBcIjJUaW1cIjogXCIyIFRpbVwiLCBcIjIuVGltXCI6IFwiMiBUaW1cIixcblxuICBcIlRpdHVzXCI6IFwiVGl0dXNcIixcbiAgXCJQaGlsZW1vblwiOiBcIlBoaWxlbVwiLFxuXG4gIFwiSGVicmV3c1wiOiBcIkhlYlwiLCBcIkhlYnJcdTAwRTRlclwiOiBcIkhlYlwiLCBcIkhlYnJcIjogXCJIZWJcIixcblxuICAvLyAtLS0tIENhdGhvbGljICYgR2VuZXJhbCBsZXR0ZXJzIC0tLS1cbiAgXCJKYW1lc1wiOiBcIkphbWVzXCIsIFwiSmFrb2J1c1wiOiBcIkphbWVzXCIsIFwiSmFrXCI6IFwiSmFtZXNcIixcbiAgXCIxIFBldGVyXCI6IFwiMSBQZXRcIiwgXCIxIFBldHJ1c1wiOiBcIjEgUGV0XCIsIFwiMS4gUGV0cnVzXCI6IFwiMSBQZXRcIiwgXCIxUGV0cnVzXCI6IFwiMSBQZXRcIiwgXCIxLlBldHJ1c1wiOiBcIjEgUGV0XCIsXG4gIFwiMSBQZXRcIjogXCIxIFBldFwiLCBcIjEuIFBldFwiOiBcIjEgUGV0XCIsIFwiMS4gUGV0clwiOiBcIjEgUGV0XCIsIFwiMS5QZXRyXCI6IFwiMSBQZXRcIiwgXCIxUGV0XCI6IFwiMSBQZXRcIiwgXCIxLlBldFwiOiBcIjEgUGV0XCIsXG5cbiAgXCIyIFBldGVyXCI6IFwiMiBQZXRcIiwgXCIyIFBldHJ1c1wiOiBcIjIgUGV0XCIsIFwiMi4gUGV0cnVzXCI6IFwiMiBQZXRcIiwgXCIyUGV0cnVzXCI6IFwiMiBQZXRcIiwgXCIyLlBldHJ1c1wiOiBcIjIgUGV0XCIsXG4gIFwiMiBQZXRcIjogXCIyIFBldFwiLCBcIjIuIFBldFwiOiBcIjIgUGV0XCIsIFwiMi4gUGV0clwiOiBcIjIgUGV0XCIsIFwiMi5QZXRyXCI6IFwiMiBQZXRcIiwgXCIyUGV0XCI6IFwiMiBQZXRcIiwgXCIyLlBldFwiOiBcIjIgUGV0XCIsXG5cbiAgXCIxIEpvaG5cIjogXCIxIEpvaG5cIiwgXCIxIEpvaGFubmVzXCI6IFwiMSBKb2huXCIsIFwiMS4gSm9oYW5uZXNcIjogXCIxIEpvaG5cIiwgXCIxSm9oYW5uZXNcIjogXCIxIEpvaG5cIiwgXCIxLkpvaGFubmVzXCI6IFwiMSBKb2huXCIsXG4gIFwiMSBKb2hcIjogXCIxIEpvaG5cIiwgXCIxLiBKb2hcIjogXCIxIEpvaG5cIiwgXCIxSm9oXCI6IFwiMSBKb2huXCIsIFwiMS5Kb2hcIjogXCIxIEpvaG5cIixcblxuICBcIjIgSm9oblwiOiBcIjIgSm9oblwiLCBcIjIgSm9oYW5uZXNcIjogXCIyIEpvaG5cIiwgXCIyLiBKb2hhbm5lc1wiOiBcIjIgSm9oblwiLCBcIjJKb2hhbm5lc1wiOiBcIjIgSm9oblwiLCBcIjIuSm9oYW5uZXNcIjogXCIyIEpvaG5cIixcbiAgXCIyIEpvaFwiOiBcIjIgSm9oblwiLCBcIjIuIEpvaFwiOiBcIjIgSm9oblwiLCBcIjJKb2hcIjogXCIyIEpvaG5cIiwgXCIyLkpvaFwiOiBcIjIgSm9oblwiLFxuXG4gIFwiMyBKb2huXCI6IFwiMyBKb2huXCIsIFwiMyBKb2hhbm5lc1wiOiBcIjMgSm9oblwiLCBcIjMuIEpvaGFubmVzXCI6IFwiMyBKb2huXCIsIFwiM0pvaGFubmVzXCI6IFwiMyBKb2huXCIsIFwiMy5Kb2hhbm5lc1wiOiBcIjMgSm9oblwiLFxuICBcIjMgSm9oXCI6IFwiMyBKb2huXCIsIFwiMy4gSm9oXCI6IFwiMyBKb2huXCIsIFwiM0pvaFwiOiBcIjMgSm9oblwiLCBcIjMuSm9oXCI6IFwiMyBKb2huXCIsXG5cbiAgXCJKdWRlXCI6IFwiSnVkZVwiLCBcIkp1ZGFzXCI6IFwiSnVkZVwiLFxuXG4gIC8vIC0tLS0gUmV2ZWxhdGlvbiAtLS0tXG4gIFwiUmV2ZWxhdGlvblwiOiBcIlJldlwiLCBcIk9mZmVuYmFydW5nXCI6IFwiUmV2XCIsIFwiT2ZmYlwiOiBcIlJldlwiLCBcIkFwb2thbHlwc2VcIjogXCJSZXZcIlxufTtcblxuXG50eXBlIEJvb2tNYXAgPSBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuY29uc3QgZXNjYXBlUmUgPSAoczogc3RyaW5nKSA9PiBzLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbmNvbnN0IFJBTkdFX1NFUCA9IC9bXFwtXFx1MjAxMFxcdTIwMTFcXHUyMDEyXFx1MjAxM1xcdTIwMTRcXHUyMDE1XS87ICAvLyBlbiBkYXNoLCBlbSBkYXNoLCBoeXBoZW5cbmNvbnN0IFRSSU1fVEFJTF9QVU5DVCA9IC9bLDo7LlxcKV0kLzsgLy8gY29tbW9uIHRyYWlsaW5nIHB1bmN0dWF0aW9uIHRvIGRyb3AgZm9yIHBhcnNpbmcgKGtlcHQgaW4gZGlzcGxheSlcblxuLyoqIEJ1aWxkIGxvY2FsZS1zcGVjaWZpYyBib29rIG1hcCArIGFsdGVybmF0aW9uIGF0IHJ1bnRpbWUgKi9cbmZ1bmN0aW9uIGJ1aWxkQm9va0NvbnRleHQoc2V0dGluZ3M/OiBCaWJsZVRvb2xzU2V0dGluZ3MpIHtcbiAgbGV0IGJvb2tMb2NhbGU6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgbGV0IGN1c3RvbTogdW5rbm93bjtcblxuICB0cnkgeyBib29rTG9jYWxlID0gKHNldHRpbmdzIGFzIGFueSk/LmJvb2tMb2NhbGUgYXMgc3RyaW5nIHwgdW5kZWZpbmVkOyB9IGNhdGNoIHt9XG4gIHRyeSB7IGN1c3RvbSA9IChzZXR0aW5ncyBhcyBhbnkpPy5jdXN0b21Cb29rTWFwOyB9IGNhdGNoIHt9XG5cbiAgbGV0IGFiYnI6IEJvb2tNYXAgPSBCT09LX0FCQlI7XG5cbiAgaWYgKGJvb2tMb2NhbGUgPT09IFwiY3VzdG9tXCIgJiYgY3VzdG9tKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0eXBlb2YgY3VzdG9tID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoY3VzdG9tKTtcbiAgICAgICAgaWYgKHBhcnNlZCAmJiB0eXBlb2YgcGFyc2VkID09PSBcIm9iamVjdFwiKSBhYmJyID0gcGFyc2VkIGFzIEJvb2tNYXA7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjdXN0b20gPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgYWJiciA9IGN1c3RvbSBhcyBCb29rTWFwO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgYWJiciA9IEJPT0tfQUJCUjtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgYWJiciA9IEJPT0tfQUJCUjtcbiAgfVxuXG4gIGNvbnN0IGFsbFRva2VucyA9IEFycmF5LmZyb20obmV3IFNldChbLi4uT2JqZWN0LmtleXMoYWJiciksIC4uLk9iamVjdC52YWx1ZXMoYWJicildKSkuc29ydChcbiAgICAoYSwgYikgPT4gYi5sZW5ndGggLSBhLmxlbmd0aFxuICApO1xuICBjb25zdCBCT09LX0FMVCA9IGFsbFRva2Vucy5tYXAoZXNjYXBlUmUpLmpvaW4oXCJ8XCIpO1xuXG4gIGNvbnN0IGdldEJvb2tBYmJyID0gKGJvb2s6IHN0cmluZykgPT4gYWJicltib29rXSA/PyBib29rO1xuXG4gIGNvbnN0IGJ1aWxkUGF0dGVybkJvZHkgPSAoKTogc3RyaW5nID0+IHtcbiAgICBjb25zdCBib29rID0gYCg/OiR7Qk9PS19BTFR9KWA7XG4gICAgLy8gY29uc3QgcmVmMSA9XG4gICAgLy8gICBgKD86KD86JHtib29rfSlcXFxcLj9cXFxccypgICtcbiAgICAvLyAgIGBcXFxcZCsoPzotXFxcXGQrKT86XFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/YCArXG4gICAgLy8gICBgKD86XFxcXHMqLFxcXFxzKlxcXFxkK1thLXpdPyg/Oi1cXFxcZCspP1thLXpdP3xcXFxccyo7XFxcXHMqXFxcXGQrOlxcXFxkK1thLXpdPyg/Oi1cXFxcZCspP1thLXpdPykqYCArXG4gICAgLy8gICBgKWA7XG4gICAgY29uc3QgcmVmMSA9XG4gICAgICBgKD86KD86JHtib29rfSk/XFxcXC4/XFxcXHMqYCArXG4gICAgICBgXFxcXGQrKD86JHtSQU5HRV9TRVAuc291cmNlfVxcXFxkKyk/OlxcXFxkK1thLXpdPyg/OiR7UkFOR0VfU0VQLnNvdXJjZX1cXFxcZCspP1thLXpdP2AgK1xuICAgICAgYCg/OlxcXFxzKixcXFxccypcXFxcZCtbYS16XT8oPzoke1JBTkdFX1NFUC5zb3VyY2V9XFxcXGQrKT9bYS16XT98XFxcXHMqO1xcXFxzKlxcXFxkKzpcXFxcZCtbYS16XT8oPzoke1JBTkdFX1NFUC5zb3VyY2V9XFxcXGQrKT9bYS16XT8pKmAgK1xuICAgICAgYClgO1xuICAgIGNvbnN0IHJlZjIgPSBgKD86KCR7Ym9va30pXFxcXC4/XFxcXHMrKFxcXFxkKykoPzoke1JBTkdFX1NFUC5zb3VyY2V9KFxcXFxkKykpPylgO1xuICAgIGNvbnN0IFJFRiA9IGAoPzxyZWY+JHtyZWYxfXwke3JlZjJ9KWA7XG5cbiAgICBjb25zdCBWRVJTRSA9XG4gICAgICBgKD88dmVyc2U+YCArXG4gICAgICBgXFxcXGJbVnZddj8oPzpcXFxcLnxlcnNlcz8pXFxcXHMqYCArXG4gICAgICBgXFxcXGQrW2Etel0/KD86JHtSQU5HRV9TRVAuc291cmNlfVxcXFxkKyk/W2Etel0/YCArXG4gICAgICBgKD86KD86LHwsP1xcXFxzKmFuZClcXFxccypcXFxcZCsoPzoke1JBTkdFX1NFUC5zb3VyY2V9XFxcXGQrKT9bYS16XT8pKmAgK1xuICAgICAgYClgO1xuXG4gICAgY29uc3QgQ0hBUFRFUiA9XG4gICAgICBgKD88Y2hhcHRlcj5gICtcbiAgICAgIGBcXFxcYltDY11oKD86YXB0ZXJzP3xzP1xcXFwuKVxcXFwuP1xcXFxzKmAgK1xuICAgICAgYFxcXFxkKyg/OiR7UkFOR0VfU0VQLnNvdXJjZX1cXFxcZCspP2AgK1xuICAgICAgYClgO1xuXG4gICAgY29uc3QgTk9URSA9XG4gICAgICBgKD88bm90ZT5gICtcbiAgICAgIGBcXFxcYltObl1vdGVzP2AgK1xuICAgICAgYCg/OlxcXFxzK1xcXFxkKyg/OlxcXFxzK1xcXFxkKyk/YCArXG4gICAgICBgKD86YCArXG4gICAgICBgKD86Wyw7XXwsP1xcXFxzKmFuZClcXFxccypcXFxcZCsoPzpcXFxccytcXFxcZCspP2AgK1xuICAgICAgYCg/OlxcXFxzK2luXFxcXHMrJHtib29rfVxcXFwuP1xcXFxzK1xcXFxkKyk/YCArXG4gICAgICBgKSpgICtcbiAgICAgIGApYCArXG4gICAgICBgKD86XFxcXHMraW5cXFxccyske2Jvb2t9XFxcXC4/XFxcXHMrXFxcXGQrKT9gICtcbiAgICAgIGApYDtcblxuICAgIGNvbnN0IEJPT0sgPSBgKD88Ym9vaz5cXFxcYig/OiR7Ym9va30pXFxcXGIpKD8hXFxcXC4/XFxcXHMqXFxcXGQrKWA7XG5cbiAgICByZXR1cm4gYCR7UkVGfXwke1ZFUlNFfXwke0NIQVBURVJ9fCR7Tk9URX18JHtCT09LfWA7XG4gIH07XG5cbiAgY29uc3QgUEFUVEVSTl9CT0RZID0gYnVpbGRQYXR0ZXJuQm9keSgpO1xuICBjb25zdCBQQVRURVJOX0cgPSBuZXcgUmVnRXhwKFBBVFRFUk5fQk9EWSwgXCJnXCIpO1xuICBjb25zdCBQQVRURVJOX0hFQUQgPSBuZXcgUmVnRXhwKFwiXlwiICsgUEFUVEVSTl9CT0RZKTtcblxuICByZXR1cm4geyBhYmJyLCBhbGxUb2tlbnMsIEJPT0tfQUxULCBnZXRCb29rQWJiciwgUEFUVEVSTl9HLCBQQVRURVJOX0hFQUQgfTtcbn1cblxuLyoqIC0tLS0tLS0tLS0tLS0tLS0gVXRpbGl0eTogbm9ybWFsaXplIGJvb2sgdG9rZW4gdG8gcmVtb3ZlIHRyYWlsaW5nIHBlcmlvZCAtLS0tLS0tLS0tLS0tLS0gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZUJvb2tUb2tlbihyYXc6IHN0cmluZywgY3R4OiBSZXR1cm5UeXBlPHR5cGVvZiBidWlsZEJvb2tDb250ZXh0Pik6IHN0cmluZyB7XG4gIC8vIFRyaW0gYW5kIGRyb3AgYSBzaW5nbGUgdHJhaWxpbmcgZG90IChlLmcuLCBcIlJvbS5cIiAtPiBcIlJvbVwiKVxuICBjb25zdCBjbGVhbmVkID0gcmF3LnRyaW0oKS5yZXBsYWNlKC9cXC4kLywgXCJcIik7XG4gIHJldHVybiBjdHguZ2V0Qm9va0FiYnIoY2xlYW5lZCk7XG59XG5cbi8qKiAtLS0tLS0tLS0tLS0tLSBQcm90ZWN0ZWQgcmFuZ2VzIChkb25cdTIwMTl0IHRvdWNoIHdoaWxlIGxpbmtpbmcpIC0tLS0tLS0tLS0tLS0tICovXG50eXBlIFJhbmdlID0gW3N0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyXTtcblxuZnVuY3Rpb24gYWRkUmFuZ2UocmFuZ2VzOiBSYW5nZVtdLCBzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcikge1xuICBpZiAoc3RhcnQgPj0gMCAmJiBlbmQgPiBzdGFydCkgcmFuZ2VzLnB1c2goW3N0YXJ0LCBlbmRdKTtcbn1cblxuZnVuY3Rpb24gZmluZFByb3RlY3RlZFJhbmdlcyh0ZXh0OiBzdHJpbmcpOiBSYW5nZVtdIHtcbiAgY29uc3QgcmFuZ2VzOiBSYW5nZVtdID0gW107XG5cbiAgLy8gMSkgQ29kZSBmZW5jZXMgYGBgLi4uYGBgIGFuZCB+fn4uLi5+fn5cbiAgY29uc3QgZmVuY2VSZSA9IC8oYGBgfH5+filbXlxcbl0qXFxuW1xcc1xcU10qP1xcMS9nO1xuICBmb3IgKGxldCBtOyAobSA9IGZlbmNlUmUuZXhlYyh0ZXh0KSk7ICkgYWRkUmFuZ2UocmFuZ2VzLCBtLmluZGV4LCBtLmluZGV4ICsgbVswXS5sZW5ndGgpO1xuXG4gIC8vIDIpIE1hdGggYmxvY2tzICQkLi4uJCRcbiAgY29uc3QgbWF0aEJsb2NrUmUgPSAvXFwkXFwkW1xcc1xcU10qP1xcJFxcJC9nO1xuICBmb3IgKGxldCBtOyAobSA9IG1hdGhCbG9ja1JlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuICAvLyAzKSBJbmxpbmUgY29kZSBgLi4uYFxuICBjb25zdCBpbmxpbmVDb2RlUmUgPSAvYFteYFxcbl0qYC9nO1xuICBmb3IgKGxldCBtOyAobSA9IGlubGluZUNvZGVSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbiAgLy8gNCkgSW5saW5lIG1hdGggJC4uLiQgKGF2b2lkICQkKVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHQubGVuZ3RoOyApIHtcbiAgICBpZiAodGV4dFtpXSA9PT0gXCIkXCIgJiYgdGV4dFtpICsgMV0gIT09IFwiJFwiKSB7XG4gICAgICBjb25zdCBzdGFydCA9IGk7XG4gICAgICBpKys7XG4gICAgICB3aGlsZSAoaSA8IHRleHQubGVuZ3RoICYmIHRleHRbaV0gIT09IFwiJFwiKSBpKys7XG4gICAgICBpZiAoaSA8IHRleHQubGVuZ3RoICYmIHRleHRbaV0gPT09IFwiJFwiKSB7XG4gICAgICAgIGFkZFJhbmdlKHJhbmdlcywgc3RhcnQsIGkgKyAxKTtcbiAgICAgICAgaSsrO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaSsrO1xuICB9XG5cbiAgLy8gNSkgTWFya2Rvd24gbGlua3MgW3RleHRdKHVybClcbiAgY29uc3QgbWRMaW5rUmUgPSAvXFxbW15cXF1dKz9cXF1cXChbXildK1xcKS9nO1xuICBmb3IgKGxldCBtOyAobSA9IG1kTGlua1JlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuICAvLyA2KSBJbmxpbmUgcHJvcGVydGllcyBsaW5lczogIGtleTo6IHZhbHVlXG4gIGNvbnN0IGlubGluZVByb3BSZSA9IC9eW15cXG46XXsxLDIwMH06Oi4qJC9nbTtcbiAgZm9yIChsZXQgbTsgKG0gPSBpbmxpbmVQcm9wUmUuZXhlYyh0ZXh0KSk7ICkgYWRkUmFuZ2UocmFuZ2VzLCBtLmluZGV4LCBtLmluZGV4ICsgbVswXS5sZW5ndGgpO1xuXG4gIC8vIDcpIE9ic2lkaWFuIGxpbmtzIFtbLi4uXV1cbiAgY29uc3Qgb2JzaWRpYW5SZSA9IC9cXFtcXFtbXlxcXV0qP1xcXVxcXS9nO1xuICBmb3IgKGxldCBtOyAobSA9IG9ic2lkaWFuUmUuZXhlYyh0ZXh0KSk7ICkgYWRkUmFuZ2UocmFuZ2VzLCBtLmluZGV4LCBtLmluZGV4ICsgbVswXS5sZW5ndGgpO1xuXG4gIC8vIE1lcmdlIG92ZXJsYXBzICYgc29ydFxuICByYW5nZXMuc29ydCgoYSwgYikgPT4gYVswXSAtIGJbMF0pO1xuICBjb25zdCBtZXJnZWQ6IFJhbmdlW10gPSBbXTtcbiAgZm9yIChjb25zdCByIG9mIHJhbmdlcykge1xuICAgIGlmICghbWVyZ2VkLmxlbmd0aCB8fCByWzBdID4gbWVyZ2VkW21lcmdlZC5sZW5ndGggLSAxXVsxXSkgbWVyZ2VkLnB1c2gocik7XG4gICAgZWxzZSBtZXJnZWRbbWVyZ2VkLmxlbmd0aCAtIDFdWzFdID0gTWF0aC5tYXgobWVyZ2VkW21lcmdlZC5sZW5ndGggLSAxXVsxXSwgclsxXSk7XG4gIH1cbiAgcmV0dXJuIG1lcmdlZDtcbn1cblxuZnVuY3Rpb24gaW5Qcm90ZWN0ZWQocG9zOiBudW1iZXIsIHJhbmdlczogUmFuZ2VbXSk6IGJvb2xlYW4ge1xuICBsZXQgbG8gPSAwLCBoaSA9IHJhbmdlcy5sZW5ndGggLSAxO1xuICB3aGlsZSAobG8gPD0gaGkpIHtcbiAgICBjb25zdCBtaWQgPSAobG8gKyBoaSkgPj4gMTtcbiAgICBjb25zdCBbcywgZV0gPSByYW5nZXNbbWlkXTtcbiAgICBpZiAocG9zIDwgcykgaGkgPSBtaWQgLSAxO1xuICAgIGVsc2UgaWYgKHBvcyA+PSBlKSBsbyA9IG1pZCArIDE7XG4gICAgZWxzZSByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzV2l0aGluT2JzaWRpYW5MaW5rKHRleHQ6IHN0cmluZywgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3QgYmVmb3JlID0gdGV4dC5zbGljZSgwLCBzdGFydCk7XG4gIGNvbnN0IGFmdGVyID0gdGV4dC5zbGljZShlbmQpO1xuICBjb25zdCBvcGVuSWR4ID0gYmVmb3JlLmxhc3RJbmRleE9mKFwiW1tcIik7XG4gIGNvbnN0IGNsb3NlSWR4ID0gYmVmb3JlLmxhc3RJbmRleE9mKFwiXV1cIik7XG4gIGlmIChvcGVuSWR4ID4gY2xvc2VJZHgpIHtcbiAgICBjb25zdCBuZXh0Q2xvc2UgPSBhZnRlci5pbmRleE9mKFwiXV1cIik7XG4gICAgaWYgKG5leHRDbG9zZSAhPT0gLTEpIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqIFBhcmVudGhldGljYWwgbm9pc2U6IHNraXAgaWYgaW5zaWRlIFwiKDIwMTkpXCItbGlrZSBwYXJlbnRoZXNlcyAqL1xuZnVuY3Rpb24gaXNJbnNpZGVOdW1lcmljUGFyZW5zKHRleHQ6IHN0cmluZywgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3Qgb3BlbiA9IHRleHQubGFzdEluZGV4T2YoXCIoXCIsIHN0YXJ0KTtcbiAgaWYgKG9wZW4gPT09IC0xKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IGNsb3NlID0gdGV4dC5pbmRleE9mKFwiKVwiLCBlbmQpO1xuICBpZiAoY2xvc2UgPT09IC0xKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IGlubmVyID0gdGV4dC5zbGljZShvcGVuICsgMSwgY2xvc2UpLnRyaW0oKTtcbiAgaWYgKC9eXFxkezEsNH0oPzpbXFwvXFwuXFwtOl1cXGR7MSwyfSg/OltcXC9cXC5cXC06XVxcZHsxLDR9KT8pPyQvLnRlc3QoaW5uZXIpKSByZXR1cm4gdHJ1ZTtcbiAgaWYgKC9ecHsxLDJ9XFwuXFxzKlxcZCsoXFxzKi1cXHMqXFxkKyk/JC9pLnRlc3QoaW5uZXIpKSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKiogLS0tLS0tLS0tLS0tLS0tLS0tLSBNYXJrZG93bi9PYnNpZGlhbiBsaW5rIGNsZWFudXAgKFB5dGhvbiBwYXJpdHkpIC0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cbmZ1bmN0aW9uIHJlbW92ZU1hdGNoaW5nTWFya2Rvd25MaW5rcyh0ZXh0OiBzdHJpbmcsIFBBVFRFUk5fSEVBRDogUmVnRXhwKTogc3RyaW5nIHtcbiAgY29uc3QgbWRMaW5rID0gLyhcXCpcXCp8X198XFwqKT9cXFsoW15cXF1dKylcXF1cXChbXildK1xcKShcXCpcXCp8X198XFwqKT8vZztcbiAgcmV0dXJuIHRleHQucmVwbGFjZShtZExpbmssIChfbSwgcHJlLCBkaXNwLCBzdWYpID0+IHtcbiAgICBjb25zdCBsaW5rVGV4dCA9IFN0cmluZyhkaXNwKTtcbiAgICBpZiAoUEFUVEVSTl9IRUFELnRlc3QobGlua1RleHQpKSByZXR1cm4gbGlua1RleHQ7XG4gICAgY29uc3Qgc2ltcGxlTnVtID0gL15cXGQrKD86WzotXVxcZCspPyg/Oi1cXGQrKT8kLy50ZXN0KGxpbmtUZXh0KTtcbiAgICBpZiAoc2ltcGxlTnVtKSByZXR1cm4gbGlua1RleHQ7XG4gICAgcmV0dXJuIGAke3ByZSA/PyBcIlwifVske2xpbmtUZXh0fV0ke3N1ZiA/PyBcIlwifWA7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiByZW1vdmVNYXRjaGluZ09ic2lkaWFuTGlua3ModGV4dDogc3RyaW5nLCBQQVRURVJOX0hFQUQ6IFJlZ0V4cCk6IHN0cmluZyB7XG4gIGNvbnN0IG9icyA9IC9cXFtcXFsoW15cXF18XSspXFx8KFteXFxdXSspXFxdXFxdL2c7XG4gIHJldHVybiB0ZXh0LnJlcGxhY2Uob2JzLCAoX20sIF90LCBkaXNwKSA9PiB7XG4gICAgY29uc3QgZGlzcGxheSA9IFN0cmluZyhkaXNwKTtcbiAgICBpZiAoUEFUVEVSTl9IRUFELnRlc3QoZGlzcGxheSkpIHJldHVybiBkaXNwbGF5O1xuICAgIGNvbnN0IHNpbXBsZU51bSA9IC9eXFxkKyg/Ols6LV1cXGQrKT8oPzotXFxkKyk/JC8udGVzdChkaXNwbGF5KTtcbiAgICBpZiAoc2ltcGxlTnVtKSByZXR1cm4gZGlzcGxheTtcbiAgICByZXR1cm4gX207XG4gIH0pO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlT2xkT2JzaWRpYW5MaW5rcyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBvbGRMaW5rID0gL1xcW1xcWyhbMC05XT9cXHNbQS1aYS16IF0rKVxccyhcXGQrKSNcXF4oXFxkKykoPzpcXHwoW15cXF1dKykpP1xcXVxcXS9nO1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKG9sZExpbmssIChfbSwgYm9va1Nob3J0LCBjaCwgdmVyc2UsIGRpc3ApID0+IHtcbiAgICBjb25zdCBiID0gU3RyaW5nKGJvb2tTaG9ydCkudHJpbSgpO1xuICAgIHJldHVybiBkaXNwXG4gICAgICA/IGBbWyR7Yn0jXiR7Y2h9LSR7dmVyc2V9fCR7ZGlzcH1dXWBcbiAgICAgIDogYFtbJHtifSNeJHtjaH0tJHt2ZXJzZX1dXWA7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBmaW5kTGFzdEJvb2tCZWZvcmUodGV4dDogc3RyaW5nLCBwb3M6IG51bWJlciwgY3R4OiBSZXR1cm5UeXBlPHR5cGVvZiBidWlsZEJvb2tDb250ZXh0Pik6IHN0cmluZyB8IG51bGwge1xuICAvLyBMb29rIGJhY2sgfjIwMCBjaGFycyBmb3IgYSBib29rIHRva2VuIGVuZGluZyByaWdodCBiZWZvcmUgJ3BvcydcbiAgY29uc3Qgc3RhcnQgPSBNYXRoLm1heCgwLCBwb3MgLSAyMDApO1xuICBjb25zdCBsZWZ0ID0gdGV4dC5zbGljZShzdGFydCwgcG9zKTtcblxuICAvLyBNYXRjaCBBTEwgYm9vayB0b2tlbnMgaW4gdGhlIHdpbmRvdzsgdGFrZSB0aGUgbGFzdCBvbmUuXG4gIGNvbnN0IHJlID0gbmV3IFJlZ0V4cChgKD86JHtjdHguQk9PS19BTFR9KVxcXFwuP1xcXFxzKiR8KD86JHtjdHguQk9PS19BTFR9KVxcXFwuP1xcXFxzK2AsIFwiZ1wiKTtcbiAgbGV0IG06IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGw7XG4gIGxldCBsYXN0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICB3aGlsZSAoKG0gPSByZS5leGVjKGxlZnQpKSAhPT0gbnVsbCkge1xuICAgIGxhc3QgPSBtWzBdLnRyaW0oKTtcbiAgfVxuICBpZiAoIWxhc3QpIHJldHVybiBudWxsO1xuXG4gIC8vIHN0cmlwIHRyYWlsaW5nIHB1bmN0dWF0aW9uL2RvdCBhbmQgbm9ybWFsaXplXG4gIHJldHVybiBub3JtYWxpemVCb29rVG9rZW4obGFzdC5yZXBsYWNlKC9cXHMrJC8sIFwiXCIpLCBjdHgpO1xufVxuXG4vKiogLS0tLS0tLS0tLS0tIFZlcnNpb24tYXdhcmUgbGluayB0YXJnZXQgLS0tLS0tLS0tLS0tICovXG5mdW5jdGlvbiBmb3JtYXRCb29rVGFyZ2V0KGJvb2tTaG9ydDogc3RyaW5nLCB2ZXJzaW9uU2hvcnQ/OiBzdHJpbmcgfCBudWxsKTogc3RyaW5nIHtcbiAgaWYgKCF2ZXJzaW9uU2hvcnQpIHJldHVybiBib29rU2hvcnQ7XG4gIHJldHVybiBgJHtib29rU2hvcnR9ICgke3ZlcnNpb25TaG9ydH0pYDtcbn1cblxuLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBDb3JlIGxpbmtlciAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cbmZ1bmN0aW9uIHJlcGxhY2VWZXJzZVJlZmVyZW5jZXNPZk1haW5UZXh0KFxuICB0ZXh0OiBzdHJpbmcsXG4gIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4sXG4gIG9wdHM6IHtcbiAgICByZW1vdmVPYnNpZGlhbkxpbmtzOiBib29sZWFuO1xuICAgIHJld3JpdGVPbGRMaW5rczogYm9vbGVhbjtcbiAgICBzdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlOiBib29sZWFuO1xuICAgIHZlcnNpb25TaG9ydD86IHN0cmluZyB8IG51bGw7IC8vIE5FV1xuICB9XG4pOiBzdHJpbmcge1xuICBpZiAob3B0cy5zdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlKSB0ZXh0ID0gcmVtb3ZlTWF0Y2hpbmdNYXJrZG93bkxpbmtzKHRleHQsIGN0eC5QQVRURVJOX0hFQUQpO1xuICBpZiAob3B0cy5yZW1vdmVPYnNpZGlhbkxpbmtzKSB0ZXh0ID0gcmVtb3ZlTWF0Y2hpbmdPYnNpZGlhbkxpbmtzKHRleHQsIGN0eC5QQVRURVJOX0hFQUQpO1xuICBpZiAob3B0cy5yZXdyaXRlT2xkTGlua3MpIHRleHQgPSByZXBsYWNlT2xkT2JzaWRpYW5MaW5rcyh0ZXh0KTtcblxuICBjb25zdCBwcm90ZWN0ZWRSYW5nZXMgPSBmaW5kUHJvdGVjdGVkUmFuZ2VzKHRleHQpO1xuXG4gIGxldCBjdXJyZW50X2Jvb2s6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBsZXQgY3VycmVudF9jaGFwdGVyOiBudW1iZXIgfCBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgbGV0IGN1cnJlbnRfdmVyc2U6IG51bWJlciB8IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgbGV0IGxhc3RQb3MgPSAwO1xuXG4gIGNvbnN0IHRhcmdldE9mID0gKGJvb2tTaG9ydDogc3RyaW5nKSA9PiBmb3JtYXRCb29rVGFyZ2V0KGJvb2tTaG9ydCwgb3B0cy52ZXJzaW9uU2hvcnQpO1xuXG4gIGN0eC5QQVRURVJOX0cubGFzdEluZGV4ID0gMDtcbiAgZm9yIChsZXQgbTogUmVnRXhwRXhlY0FycmF5IHwgbnVsbCA9IGN0eC5QQVRURVJOX0cuZXhlYyh0ZXh0KTsgbTsgbSA9IGN0eC5QQVRURVJOX0cuZXhlYyh0ZXh0KSkge1xuICAgIGNvbnN0IHN0YXJ0ID0gbS5pbmRleDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIG1bMF0ubGVuZ3RoO1xuXG4gICAgaWYgKFxuICAgICAgaW5Qcm90ZWN0ZWQoc3RhcnQsIHByb3RlY3RlZFJhbmdlcykgfHxcbiAgICAgIGluUHJvdGVjdGVkKGVuZCAtIDEsIHByb3RlY3RlZFJhbmdlcykgfHxcbiAgICAgIGlzV2l0aGluT2JzaWRpYW5MaW5rKHRleHQsIHN0YXJ0LCBlbmQpIHx8XG4gICAgICBpc0luc2lkZU51bWVyaWNQYXJlbnModGV4dCwgc3RhcnQsIGVuZClcbiAgICApIHtcbiAgICAgIG91dC5wdXNoKHRleHQuc2xpY2UobGFzdFBvcywgc3RhcnQpLCBtWzBdKTtcbiAgICAgIGxhc3RQb3MgPSBlbmQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBvdXQucHVzaCh0ZXh0LnNsaWNlKGxhc3RQb3MsIHN0YXJ0KSk7XG4gICAgbGFzdFBvcyA9IGVuZDtcblxuICAgIGNvbnN0IGcgPSBtLmdyb3VwcyA/PyB7fTtcblxuICAgIC8vIC0tLS0gYm9vayBvbmx5XG4gICAgaWYgKGcuYm9vaykge1xuICAgICAgY3VycmVudF9ib29rID0gbm9ybWFsaXplQm9va1Rva2VuKGcuYm9vaywgY3R4KTsgLy8gPC0tIHN0cmlwcyB0cmFpbGluZyBkb3RcbiAgICAgIGN1cnJlbnRfY2hhcHRlciA9IG51bGw7XG4gICAgICBjdXJyZW50X3ZlcnNlID0gbnVsbDtcbiAgICAgIG91dC5wdXNoKG1bMF0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gLS0tLSBjaGFwdGVyIChjaC4sIGNoYXB0ZXIsIGNoYXB0ZXJzKVxuICAgIGlmIChnLmNoYXB0ZXIpIHtcbiAgICAgIGNvbnN0IGNobSA9IGcuY2hhcHRlci5tYXRjaCgvKFxcZCspLyk7XG4gICAgICBpZiAoY2htICYmIGN1cnJlbnRfYm9vaykge1xuICAgICAgICBjb25zdCBjaCA9IGNobVsxXTtcbiAgICAgICAgY3VycmVudF9jaGFwdGVyID0gY2g7XG4gICAgICAgIGN1cnJlbnRfdmVyc2UgPSBudWxsO1xuICAgICAgICBvdXQucHVzaChgW1ske3RhcmdldE9mKGN1cnJlbnRfYm9vayl9I14ke2NofXwke21bMF19XV1gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dC5wdXNoKG1bMF0pO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGcudmVyc2UpIHtcbiAgICAgIGlmICghY3VycmVudF9ib29rKSB7XG4gICAgICAgIGNvbnN0IGluZmVycmVkID0gZmluZExhc3RCb29rQmVmb3JlKHRleHQsIHN0YXJ0LCBjdHgpO1xuICAgICAgICBpZiAoaW5mZXJyZWQpIGN1cnJlbnRfYm9vayA9IGluZmVycmVkO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBvdXQucHVzaChtWzBdKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCB2ZXJzZVRleHQgPSBtWzBdOyAgICAgICAgICAgICAgIC8vIGUuZy4gXCJ2di4gN2ItOGE6XCJcbiAgICAgIGNvbnN0IGNoID0gY3VycmVudF9jaGFwdGVyID8gU3RyaW5nKGN1cnJlbnRfY2hhcHRlcikgOiBcIjFcIjtcbiAgICAgIGNvbnN0IHRhcmdldCA9IHRhcmdldE9mKGN1cnJlbnRfYm9vayk7XG5cbiAgICAgIC8vIHNwbGl0IHBheWxvYWQgYWZ0ZXIgXCJ2LlwiIC8gXCJ2di5cIiBieSBjb21tYXMgb3IgXCJhbmRcIlxuICAgICAgY29uc3QgcGF5bG9hZCA9IHZlcnNlVGV4dC5yZXBsYWNlKC9eXFxzKlxcYltWdl12Pyg/OlxcLnxlcnNlcz8pXFxzKi8sJycpOyAvLyBcIjdiLThhOlwiXG4gICAgICBjb25zdCBjaHVua3MgPSBwYXlsb2FkLnNwbGl0KC9cXHMqKD86LHwoPzosP1xccyphbmQpXFxzKilcXHMqLyk7XG5cbiAgICAgIC8vIHJlLWVtaXQgdGhlIGxlYWRpbmcgXCJ2LlwiIC8gXCJ2di5cIiBwcmVmaXggYXMgcGxhaW4gdGV4dFxuICAgICAgY29uc3QgcHJlZml4ID0gdmVyc2VUZXh0LnNsaWNlKDAsIHZlcnNlVGV4dC5sZW5ndGggLSBwYXlsb2FkLmxlbmd0aCk7XG4gICAgICBvdXQucHVzaChwcmVmaXgpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNodW5rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgcGllY2UgPSBjaHVua3NbaV07XG4gICAgICAgIGlmICghcGllY2UpIGNvbnRpbnVlO1xuXG4gICAgICAgIC8vIGtlZXAgdGhlIG9yaWdpbmFsIGRpc3BsYXkgKGluY2x1ZGluZyBhbnkgdHJhaWxpbmcgcHVuY3R1YXRpb24pXG4gICAgICAgIGNvbnN0IGRpc3BsYXkgPSBwaWVjZTtcblxuICAgICAgICAvLyBzdHJpcCBvbmUgdHJhaWxpbmcgcHVuY3R1YXRpb24gZm9yIHBhcnNpbmcgKGtlZXAgaW4gbGFiZWwpXG4gICAgICAgIGNvbnN0IGNvcmUgPSBwaWVjZS5yZXBsYWNlKFRSSU1fVEFJTF9QVU5DVCwgXCJcIik7XG5cbiAgICAgICAgLy8gcmFuZ2U/XG4gICAgICAgIGNvbnN0IFtsZWZ0LCByaWdodF0gPSBjb3JlLnNwbGl0KFJBTkdFX1NFUCkubWFwKHMgPT4gcz8udHJpbSgpKTtcbiAgICAgICAgaWYgKHJpZ2h0KSB7XG4gICAgICAgICAgLy8gbGVmdCBsaW5rXG4gICAgICAgICAgY29uc3QgbGVmdE51bSA9IChsZWZ0Lm1hdGNoKC9cXGQrLyk/LlswXSkgPz8gXCJcIjtcbiAgICAgICAgICBvdXQucHVzaChgW1ske3RhcmdldH0jXiR7Y2h9LSR7bGVmdE51bX18JHtsZWZ0fV1dYCk7XG4gICAgICAgICAgb3V0LnB1c2goXCJcdTIwMTNcIik7IC8vIHJlLWVtaXQgYSBkYXNoIChjaG9vc2UgdGhlIGNhbm9uaWNhbCBlbiBkYXNoIGluIG91dHB1dClcbiAgICAgICAgICAvLyByaWdodCBsaW5rXG4gICAgICAgICAgY29uc3QgcmlnaHROdW0gPSAocmlnaHQubWF0Y2goL1xcZCsvKT8uWzBdKSA/PyBcIlwiO1xuICAgICAgICAgIC8vIHJlY29uc3RydWN0IGRpc3BsYXkgdGFpbCAocmlnaHQsIGJ1dCBpZiBvcmlnaW5hbCBoYWQgdHJhaWxpbmcgcHVuY3QsIHB1dCBpdCBiYWNrIG9uIHJpZ2h0IGVuZClcbiAgICAgICAgICBjb25zdCB0cmFpbGluZyA9IHBpZWNlLmVuZHNXaXRoKFwiOlwiKSA/IFwiOlwiIDogKHBpZWNlLmVuZHNXaXRoKFwiO1wiKSA/IFwiO1wiIDogKHBpZWNlLmVuZHNXaXRoKFwiLlwiKSA/IFwiLlwiIDogXCJcIikpO1xuICAgICAgICAgIG91dC5wdXNoKGBbWyR7dGFyZ2V0fSNeJHtjaH0tJHtyaWdodE51bX18JHtyaWdodH0ke3RyYWlsaW5nfV1dYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gc2luZ2xlIHZlcnNlIGxpa2UgXCI3YlwiIChwb3NzaWJseSB3aXRoIHRyYWlsaW5nIFwiOlwiIG9yIFwiO1wiKVxuICAgICAgICAgIGNvbnN0IHZOdW0gPSAoY29yZS5tYXRjaCgvXFxkKy8pPy5bMF0pID8/IFwiXCI7XG4gICAgICAgICAgb3V0LnB1c2goYFtbJHt0YXJnZXR9I14ke2NofS0ke3ZOdW19fCR7ZGlzcGxheX1dXWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGkgPCBjaHVua3MubGVuZ3RoIC0gMSkgb3V0LnB1c2goXCIsIFwiKTsgLy8gcHV0IGNvbW1hcyBiYWNrIGJldHdlZW4gY2h1bmtzXG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyAtLS0tIG5vdGUocylcbiAgICBpZiAoZy5ub3RlKSB7XG4gICAgICBjb25zdCBub3RlVGV4dCA9IGcubm90ZSBhcyBzdHJpbmc7XG4gICAgICBjb25zdCBwYXJ0cyA9IG5vdGVUZXh0LnNwbGl0KC9cXHMrLyk7XG4gICAgICBsZXQgYm9va1N1YnN0cmluZyA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBwYXJ0ID0gcGFydHNbaV07XG4gICAgICAgIGNvbnN0IHBtID0gcGFydC5tYXRjaCgvXihcXGQrKS8pO1xuICAgICAgICBpZiAocG0gJiYgIWJvb2tTdWJzdHJpbmcpIHtcbiAgICAgICAgICBjb25zdCB2ZXJzZSA9IHBtWzFdO1xuICAgICAgICAgIGlmICgoaSArIDEgPCBwYXJ0cy5sZW5ndGggJiYgIS9eXFxkKy8udGVzdChwYXJ0c1tpICsgMV0pKSB8fCBpICsgMSA+PSBwYXJ0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIG91dC5wdXNoKFwiIFwiICsgcGFydCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDwgcGFydHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChwYXJ0c1tqXSA9PT0gXCJpblwiICYmIGogKyAxIDwgcGFydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgIGlmICgvXlxcZCskLy50ZXN0KHBhcnRzW2ogKyAxXSkgJiYgaiArIDIgPCBwYXJ0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBib29rID0gcGFydHNbaiArIDFdICsgXCIgXCIgKyBwYXJ0c1tqICsgMl07XG4gICAgICAgICAgICAgICAgY3VycmVudF9jaGFwdGVyID0gcGFydHNbaiArIDNdO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihib29rLCBjdHgpOyAvLyA8LS0gbm9ybWFsaXplXG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYm9vayA9IHBhcnRzW2ogKyAxXTtcbiAgICAgICAgICAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBwYXJ0c1tqICsgMl07XG4gICAgICAgICAgICAgICAgY3VycmVudF9ib29rID0gbm9ybWFsaXplQm9va1Rva2VuKGJvb2ssIGN0eCk7IC8vIDwtLSBub3JtYWxpemVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY3VycmVudF9ib29rICYmIGN1cnJlbnRfY2hhcHRlcikge1xuICAgICAgICAgICAgb3V0LnB1c2goYCBbWyR7dGFyZ2V0T2YoY3VycmVudF9ib29rKX0gJHtjdXJyZW50X2NoYXB0ZXJ9I14ke3ZlcnNlfXwke3BhcnR9XV1gKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3V0LnB1c2goXCIgXCIgKyBwYXJ0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3V0LnB1c2goKGkgPiAwID8gXCIgXCIgOiBcIlwiKSArIHBhcnQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyAtLS0tIGZ1bGwgcmVmZXJlbmNlXG4gICAgaWYgKGcucmVmKSB7XG4gICAgICBjb25zdCBtbSA9IChnLnJlZiBhcyBzdHJpbmcpLm1hdGNoKC8oXFxzKltcXC4sO10/KSguKykvKTtcbiAgICAgIGNvbnN0IGxlYWRpbmcgPSBtbSA/IG1tWzFdIDogXCJcIjtcbiAgICAgIGxldCByZWZUZXh0ID0gbW0gPyBtbVsyXSA6IChnLnJlZiBhcyBzdHJpbmcpO1xuXG4gICAgICBjb25zdCBib29rU3RhcnQgPSByZWZUZXh0Lm1hdGNoKG5ldyBSZWdFeHAoYF4oKD86JHtjdHguQk9PS19BTFR9KVxcXFwuP1xcXFxzKylgKSk7XG4gICAgICBsZXQgcHJlZml4OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICAgIGlmIChib29rU3RhcnQpIHtcbiAgICAgICAgY29uc3QgYm9va1BhcnQgPSBib29rU3RhcnRbMF07XG4gICAgICAgIHByZWZpeCA9IGJvb2tQYXJ0OyAvLyBmb3IgZGlzcGxheSB0ZXh0IChjYW4ga2VlcCBpdHMgZG90KVxuICAgICAgICBjdXJyZW50X2Jvb2sgPSBub3JtYWxpemVCb29rVG9rZW4oYm9va1BhcnQucmVwbGFjZSgvXFxzKyQvLCBcIlwiKSwgY3R4KTsgLy8gPC0tIG5vcm1hbGl6ZSBmb3IgdGFyZ2V0XG4gICAgICAgIHJlZlRleHQgPSByZWZUZXh0LnNsaWNlKGJvb2tQYXJ0Lmxlbmd0aCk7XG4gICAgICB9XG4gICAgICBpZiAoIWN1cnJlbnRfYm9vaykge1xuICAgICAgICAvLyBGYWxsYmFjazogaW5mZXIgYm9vayBmcm9tIGxlZnQgY29udGV4dCAoZS5nLiwgXCJcdTIwMjYgSm9obiAxOjI5OyAxMjoyNDsgXHUyMDI2XCIpXG4gICAgICAgIGNvbnN0IGluZmVycmVkID0gZmluZExhc3RCb29rQmVmb3JlKHRleHQsIHN0YXJ0LCBjdHgpO1xuICAgICAgICBpZiAoaW5mZXJyZWQpIHtcbiAgICAgICAgICBjdXJyZW50X2Jvb2sgPSBpbmZlcnJlZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvdXQucHVzaChtWzBdKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBwYXJ0cyA9IHJlZlRleHQucmVwbGFjZSgvXFwuL2csIFwiXCIpLnRyaW0oKS5zcGxpdCgvKDt8LCkvKTtcbiAgICAgIGNvbnN0IHJlc3VsdDogc3RyaW5nW10gPSBbXTtcbiAgICAgIGxldCB2ZXJzZVN0cmluZyA9IGZhbHNlO1xuICAgICAgY3VycmVudF9jaGFwdGVyID0gbnVsbDtcbiAgICAgIGxldCBsb2NhbF9jdXJyZW50X3ZlcnNlOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBwYXJ0ID0gcGFydHNbaV07XG4gICAgICAgIGlmIChwYXJ0ID09PSBcIixcIiB8fCBwYXJ0ID09PSBcIjtcIikge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKHBhcnQgKyBcIiBcIik7XG4gICAgICAgICAgdmVyc2VTdHJpbmcgPSAocGFydCA9PT0gXCIsXCIpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHAgPSBwYXJ0LnRyaW0oKTtcbiAgICAgICAgaWYgKCFwKSBjb250aW51ZTtcblxuICAgICAgICBsZXQgY2hhcDogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCA9IGN1cnJlbnRfY2hhcHRlcjtcbiAgICAgICAgbGV0IHY6IHN0cmluZyB8IG51bWJlciB8IG51bGwgPSBudWxsO1xuICAgICAgICBsZXQgdkVuZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgaWYgKHAuaW5jbHVkZXMoXCI6XCIpKSB7XG4gICAgICAgICAgY29uc3QgW2NTdHIsIHZTdHJdID0gcC5zcGxpdChcIjpcIik7XG4gICAgICAgICAgY2hhcCA9IGNTdHI7XG4gICAgICAgICAgdiA9IHZTdHI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHZlcnNlU3RyaW5nKSB2ID0gcDtcbiAgICAgICAgICBlbHNlIHsgY2hhcCA9IHA7IHYgPSBudWxsOyB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGNoYXAgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICBjb25zdCBjaHMgPSBTdHJpbmcoY2hhcCA/PyBcIlwiKS5zcGxpdChSQU5HRV9TRVApO1xuICAgICAgICAgIGNoYXAgPSBwYXJzZUludChjaHNbMF0ucmVwbGFjZSgvW2Etel0kL2ksIFwiXCIpLCAxMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodikge1xuICAgICAgICAgIGNvbnN0IHZzID0gU3RyaW5nKHYpLnNwbGl0KFJBTkdFX1NFUCk7XG4gICAgICAgICAgbG9jYWxfY3VycmVudF92ZXJzZSA9IHBhcnNlSW50KHZzWzBdLnJlcGxhY2UoL1thLXpdJC9pLCBcIlwiKSwgMTApO1xuICAgICAgICAgIHZFbmQgPSB2cy5sZW5ndGggPiAxID8gcGFyc2VJbnQodnNbMV0ucmVwbGFjZSgvW2Etel0kL2ksIFwiXCIpLCAxMCkgOiBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxvY2FsX2N1cnJlbnRfdmVyc2UgPSBudWxsO1xuICAgICAgICAgIHZFbmQgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gdGFyZ2V0T2YoY3VycmVudF9ib29rKTtcblxuICAgICAgICBpZiAodkVuZCkge1xuICAgICAgICAgIC8vIGNhcHR1cmUgb3JpZ2luYWwgc2VwYXJhdG9yIHRvIHJlLWVtaXQgYmV0d2VlbiBsaW5rc1xuICAgICAgICAgIGNvbnN0IHNlcE1hdGNoID0gcC5tYXRjaChuZXcgUmVnRXhwKFJBTkdFX1NFUC5zb3VyY2UpKTtcbiAgICAgICAgICBjb25zdCBzZXBPdXQgICA9IHNlcE1hdGNoPy5bMF0gPz8gXCItXCI7XG5cbiAgICAgICAgICAvLyBsZWZ0IGRpc3BsYXkgd2l0aG91dCB0cmFpbGluZyBudW1iZXIgQU5EIHdpdGhvdXQgdHJhaWxpbmcgc2VwYXJhdG9yXG4gICAgICAgICAgY29uc3QgbGVmdERpc3BOb051bSA9IHAucmVwbGFjZSgvXFxkK1thLXpdPyQvaSwgXCJcIik7ICAgICAgICAgICAgICAgICAvLyBlLmcuIFwiT2ZmYi4gMTo0XHUyMDEzXCJcbiAgICAgICAgICBjb25zdCBsZWZ0RGlzcCAgICAgID0gbGVmdERpc3BOb051bS5yZXBsYWNlKG5ldyBSZWdFeHAoYCR7UkFOR0VfU0VQLnNvdXJjZX1cXFxccyokYCksIFwiXCIpOyAvLyBcIk9mZmIuIDE6NFwiXG5cbiAgICAgICAgICAvLyByaWdodCBkaXNwbGF5IGlzIHRoZSB0cmFpbGluZyBudW1iZXIgKHdpdGggb3B0aW9uYWwgbGV0dGVyKVxuICAgICAgICAgIGNvbnN0IHJpZ2h0RGlzcCA9IChwLm1hdGNoKC8oXFxkK1thLXpdPykkL2kpPy5bMV0gPz8gXCJcIik7XG5cbiAgICAgICAgICAvLyBsZWZ0IGxpbmsgKG5vIGRhc2ggaW5zaWRlKVxuICAgICAgICAgIHJlc3VsdC5wdXNoKGBbWyR7dGFyZ2V0fSNeJHtjaGFwfS0ke2xvY2FsX2N1cnJlbnRfdmVyc2V9fCR7KHByZWZpeCA/PyBcIlwiKX0ke2xlZnREaXNwfV1dYCk7XG4gICAgICAgICAgLy8gc2VwYXJhdG9yIEJFVFdFRU4gbGlua3NcbiAgICAgICAgICByZXN1bHQucHVzaChzZXBPdXQpO1xuICAgICAgICAgIC8vIHJpZ2h0IGxpbmtcbiAgICAgICAgICBjb25zdCB2RW5kTnVtID0gcGFyc2VJbnQoU3RyaW5nKHZFbmQpLnJlcGxhY2UoL1thLXpdJC9pLCBcIlwiKSwgMTApO1xuICAgICAgICAgIHJlc3VsdC5wdXNoKGBbWyR7dGFyZ2V0fSNeJHtjaGFwfS0ke3ZFbmROdW19fCR7cmlnaHREaXNwfV1dYCk7XG5cbiAgICAgICAgICBsb2NhbF9jdXJyZW50X3ZlcnNlID0gdkVuZE51bTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHQucHVzaChgW1ske3RhcmdldH0jXiR7Y2hhcH0ke2xvY2FsX2N1cnJlbnRfdmVyc2UgPyBgLSR7bG9jYWxfY3VycmVudF92ZXJzZX1gIDogXCJcIn18JHtwcmVmaXggPyBwcmVmaXggOiBcIlwifSR7cH1dXWApO1xuICAgICAgICB9XG4gICAgICAgIHByZWZpeCA9IG51bGw7XG4gICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IGNoYXA7XG4gICAgICAgIGN1cnJlbnRfdmVyc2UgPSBsb2NhbF9jdXJyZW50X3ZlcnNlO1xuICAgICAgfVxuXG4gICAgICBvdXQucHVzaChsZWFkaW5nICsgcmVzdWx0LmpvaW4oXCJcIikpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgb3V0LnB1c2gobVswXSk7XG4gIH1cblxuICBvdXQucHVzaCh0ZXh0LnNsaWNlKGxhc3RQb3MpKTtcbiAgcmV0dXJuIG91dC5qb2luKFwiXCIpO1xufVxuXG4vKiogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFB1YmxpYyBBUEkgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbGlua1ZlcnNlc0luVGV4dChcbiAgdGV4dDogc3RyaW5nLFxuICBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzLFxuICB2ZXJzaW9uU2hvcnQ/OiBzdHJpbmcgfCBudWxsXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBjdHggPSBidWlsZEJvb2tDb250ZXh0KHNldHRpbmdzKTtcblxuICBjb25zdCByZW1vdmVPYnNpZGlhbkRpc3BsYXlMaW5rcyA9IChzZXR0aW5ncyBhcyBhbnkpPy5yZW1vdmVPYnNpZGlhbkRpc3BsYXlMaW5rcyA/PyB0cnVlO1xuICBjb25zdCByZXdyaXRlT2xkT2JzaWRpYW5MaW5rcyA9IChzZXR0aW5ncyBhcyBhbnkpPy5yZXdyaXRlT2xkT2JzaWRpYW5MaW5rcyA/PyB0cnVlO1xuICBjb25zdCBzdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlID0gKHNldHRpbmdzIGFzIGFueSk/LnN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2UgPz8gdHJ1ZTtcblxuICByZXR1cm4gcmVwbGFjZVZlcnNlUmVmZXJlbmNlc09mTWFpblRleHQodGV4dCwgY3R4LCB7XG4gICAgcmVtb3ZlT2JzaWRpYW5MaW5rczogcmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MsXG4gICAgcmV3cml0ZU9sZExpbmtzOiByZXdyaXRlT2xkT2JzaWRpYW5MaW5rcyxcbiAgICBzdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlLFxuICAgIHZlcnNpb25TaG9ydDogdmVyc2lvblNob3J0ID8/IG51bGwsXG4gIH0pO1xufVxuXG5cbi8qKiA9PT09PT09PT09PT09PT09PT09PT09PT09PSBDb21tYW5kcyA9PT09PT09PT09PT09PT09PT09PT09PT09PSAqL1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZFZlcnNlTGlua3MoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MsIHBhcmFtcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pIHtcbiAgY29uc3Qgc2NvcGUgPSBwYXJhbXM/LnNjb3BlID8/IFwiY3VycmVudFwiO1xuXG4gIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgaWYgKHNjb3BlID09PSBcImZvbGRlclwiKSB7XG4gICAgY29uc3QgYWN0aXZlID0gZmlsZTtcbiAgICBjb25zdCBmb2xkZXIgPSBhY3RpdmU/LnBhcmVudDtcbiAgICBpZiAoIWFjdGl2ZSB8fCAhZm9sZGVyKSB7XG4gICAgICBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgaW5zaWRlIHRoZSB0YXJnZXQgZm9sZGVyLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZvbGRlci5jaGlsZHJlbikge1xuICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUgJiYgY2hpbGQuZXh0ZW5zaW9uID09PSBcIm1kXCIpIHtcbiAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGNoaWxkKTtcbiAgICAgICAgY29uc3QgeyB5YW1sLCBib2R5IH0gPSBzcGxpdEZyb250bWF0dGVyKGNvbnRlbnQpO1xuICAgICAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KGJvZHksIHNldHRpbmdzLCBzZXR0aW5ncy5iaWJsZURlZmF1bHRWZXJzaW9uKTsgLy8gZGVmYXVsdDogbm8gdmVyc2lvblxuICAgICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGNoaWxkLCAoeWFtbCA/PyBcIlwiKSArIGxpbmtlZCk7XG4gICAgICB9XG4gICAgfVxuICAgIG5ldyBOb3RpY2UoXCJMaW5rZWQgdmVyc2VzIGluIGZvbGRlci5cIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCFmaWxlKSB7XG4gICAgbmV3IE5vdGljZShcIk9wZW4gYSBmaWxlIGZpcnN0LlwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBjb250ZW50ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIGNvbnN0IHsgeWFtbCwgYm9keSB9ID0gc3BsaXRGcm9udG1hdHRlcihjb250ZW50KTtcbiAgY29uc3QgbGlua2VkID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChib2R5LCBzZXR0aW5ncywgc2V0dGluZ3MuYmlibGVEZWZhdWx0VmVyc2lvbik7IC8vIGRlZmF1bHQ6IG5vIHZlcnNpb25cbiAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCAoeWFtbCA/PyBcIlwiKSArIGxpbmtlZCk7XG4gIG5ldyBOb3RpY2UoXCJMaW5rZWQgdmVyc2VzIGluIGN1cnJlbnQgZmlsZS5cIik7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kVmVyc2VMaW5rc1NlbGVjdGlvbk9yTGluZShhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuICBjb25zdCBtZFZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgaWYgKCFtZFZpZXcpIHtcbiAgICBuZXcgTm90aWNlKFwiT3BlbiBhIE1hcmtkb3duIGZpbGUgZmlyc3QuXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGVkaXRvciA9IG1kVmlldy5lZGl0b3I7XG4gIGNvbnN0IHNlbGVjdGlvblRleHQgPSBlZGl0b3IuZ2V0U2VsZWN0aW9uKCk7XG5cbiAgY29uc3QgcnVuID0gYXN5bmMgKHRleHQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGxpbmtlZCA9IGF3YWl0IGxpbmtWZXJzZXNJblRleHQodGV4dCwgc2V0dGluZ3MsIHNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb24pOyAvLyBkZWZhdWx0OiBubyB2ZXJzaW9uXG4gICAgcmV0dXJuIGxpbmtlZDtcbiAgfTtcblxuICBpZiAoc2VsZWN0aW9uVGV4dCAmJiBzZWxlY3Rpb25UZXh0Lmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBydW4oc2VsZWN0aW9uVGV4dCk7XG4gICAgaWYgKGxpbmtlZCAhPT0gc2VsZWN0aW9uVGV4dCkge1xuICAgICAgZWRpdG9yLnJlcGxhY2VTZWxlY3Rpb24obGlua2VkKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJMaW5rZWQgdmVyc2VzIGluIHNlbGVjdGlvbi5cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ldyBOb3RpY2UoXCJObyBsaW5rYWJsZSB2ZXJzZXMgaW4gc2VsZWN0aW9uLlwiKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRDdXJzb3IoKS5saW5lO1xuICBjb25zdCBsaW5lVGV4dCA9IGVkaXRvci5nZXRMaW5lKGxpbmUpO1xuICBjb25zdCBsaW5rZWQgPSBhd2FpdCBydW4obGluZVRleHQpO1xuICBpZiAobGlua2VkICE9PSBsaW5lVGV4dCkge1xuICAgIGVkaXRvci5zZXRMaW5lKGxpbmUsIGxpbmtlZCk7XG4gICAgbmV3IE5vdGljZShcIkxpbmtlZCB2ZXJzZXMgb24gY3VycmVudCBsaW5lLlwiKTtcbiAgfSBlbHNlIHtcbiAgICBuZXcgTm90aWNlKFwiTm8gbGlua2FibGUgdmVyc2VzIG9uIGN1cnJlbnQgbGluZS5cIik7XG4gIH1cbn1cblxuLyoqXG4gKiBORVc6IFNhbWUgYXMgYWJvdmUsIGJ1dCBhc2tzIHVzZXIgdG8gY2hvb3NlIGEgdmVyc2lvbiAoaWYgY2F0YWxvZ3VlIGxvYWRzKS5cbiAqIElmIHVzZXIgY2FuY2VscyAvIGZhaWxzIHRvIGxvYWQsIGZhbGxzIGJhY2sgdG8gbm8tdmVyc2lvbi5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbW1hbmRWZXJzZUxpbmtzQ2hvb3NlVmVyc2lvbihhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuICBjb25zdCBmaWxlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gIGlmICghZmlsZSkge1xuICAgIG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUpID0+IHtcbiAgICBuZXcgUGlja1ZlcnNpb25Nb2RhbChhcHAsIHNldHRpbmdzLCBhc3luYyAodmVyc2lvblNob3J0KSA9PiB7XG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICBjb25zdCB7IHlhbWwsIGJvZHkgfSA9IHNwbGl0RnJvbnRtYXR0ZXIoY29udGVudCk7XG4gICAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KGJvZHksIHNldHRpbmdzLCB2ZXJzaW9uU2hvcnQpO1xuICAgICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCAoeWFtbCA/PyBcIlwiKSArIGxpbmtlZCk7XG4gICAgICBuZXcgTm90aWNlKHZlcnNpb25TaG9ydCA/IGBMaW5rZWQgdmVyc2VzIChcdTIxOTIgJHt2ZXJzaW9uU2hvcnR9KS5gIDogXCJMaW5rZWQgdmVyc2VzIChubyB2ZXJzaW9uKS5cIik7XG4gICAgICByZXNvbHZlKGxpbmtlZCk7XG4gICAgfSkub3BlbigpO1xuICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbW1hbmRWZXJzZUxpbmtzU2VsZWN0aW9uT3JMaW5lQ2hvb3NlVmVyc2lvbihhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuICBjb25zdCBtZFZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgaWYgKCFtZFZpZXcpIHtcbiAgICBuZXcgTm90aWNlKFwiT3BlbiBhIE1hcmtkb3duIGZpbGUgZmlyc3QuXCIpO1xuICAgIHJldHVybjtcbiAgfVxuICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2U8c3RyaW5nPigocmVzb2x2ZSkgPT4ge1xuICAgIG5ldyBQaWNrVmVyc2lvbk1vZGFsKGFwcCwgc2V0dGluZ3MsIGFzeW5jICh2ZXJzaW9uU2hvcnQpID0+IHtcbiAgICAgIGNvbnN0IGVkaXRvciA9IG1kVmlldy5lZGl0b3I7XG4gICAgICBjb25zdCBzZWxlY3Rpb25UZXh0ID0gZWRpdG9yLmdldFNlbGVjdGlvbigpO1xuXG4gICAgICBjb25zdCBydW4gPSBhc3luYyAodGV4dDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGxpbmtlZCA9IGF3YWl0IGxpbmtWZXJzZXNJblRleHQodGV4dCwgc2V0dGluZ3MsIHZlcnNpb25TaG9ydCk7XG4gICAgICAgIHJldHVybiBsaW5rZWQ7XG4gICAgICB9O1xuXG4gICAgICBpZiAoc2VsZWN0aW9uVGV4dCAmJiBzZWxlY3Rpb25UZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgbGlua2VkID0gYXdhaXQgcnVuKHNlbGVjdGlvblRleHQpO1xuICAgICAgICBpZiAobGlua2VkICE9PSBzZWxlY3Rpb25UZXh0KSB7XG4gICAgICAgICAgZWRpdG9yLnJlcGxhY2VTZWxlY3Rpb24obGlua2VkKTtcbiAgICAgICAgICBuZXcgTm90aWNlKFxuICAgICAgICAgICAgdmVyc2lvblNob3J0ID8gYExpbmtlZCAoc2VsZWN0aW9uKSBcdTIxOTIgJHt2ZXJzaW9uU2hvcnR9LmAgOiBcIkxpbmtlZCAoc2VsZWN0aW9uKSB3aXRob3V0IHZlcnNpb24uXCJcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ldyBOb3RpY2UoXCJObyBsaW5rYWJsZSB2ZXJzZXMgaW4gc2VsZWN0aW9uLlwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxpbmUgPSBlZGl0b3IuZ2V0Q3Vyc29yKCkubGluZTtcbiAgICAgIGNvbnN0IGxpbmVUZXh0ID0gZWRpdG9yLmdldExpbmUobGluZSk7XG4gICAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBydW4obGluZVRleHQpO1xuICAgICAgaWYgKGxpbmtlZCAhPT0gbGluZVRleHQpIHtcbiAgICAgICAgZWRpdG9yLnNldExpbmUobGluZSwgbGlua2VkKTtcbiAgICAgICAgbmV3IE5vdGljZSh2ZXJzaW9uU2hvcnQgPyBgTGlua2VkIChsaW5lKSBcdTIxOTIgJHt2ZXJzaW9uU2hvcnR9LmAgOiBcIkxpbmtlZCAobGluZSkgd2l0aG91dCB2ZXJzaW9uLlwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJObyBsaW5rYWJsZSB2ZXJzZXMgb24gY3VycmVudCBsaW5lLlwiKTtcbiAgICAgIH1cbiAgICAgIHJlc29sdmUobGlua2VkKTtcbiAgICB9KS5vcGVuKCk7XG4gIH0pO1xufVxuXG4vLyBpbXBvcnQgeyBBcHAsIE1hcmtkb3duVmlldywgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuLy8gaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG4vLyBpbXBvcnQgeyBzcGxpdEZyb250bWF0dGVyIH0gZnJvbSBcIi4uL2xpYi9tZFV0aWxzXCI7XG5cbi8vIC8qKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vICAqICBCT09LIE1BUCAoZGVmYXVsdCwgRW5nbGlzaClcbi8vICAqICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblxuLy8gY29uc3QgQk9PS19BQkJSOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuLy8gICBcIkdlbmVzaXNcIjogXCJHZW5cIixcbi8vICAgXCJFeG9kdXNcIjogXCJFeG9cIixcbi8vICAgXCJMZXZpdGljdXNcIjogXCJMZXZcIixcbi8vICAgXCJOdW1iZXJzXCI6IFwiTnVtXCIsXG4vLyAgIFwiRGV1dGVyb25vbXlcIjogXCJEZXV0XCIsXG4vLyAgIFwiSm9zaHVhXCI6IFwiSm9zaFwiLFxuLy8gICBcIkp1ZGdlc1wiOiBcIkp1ZGdcIixcbi8vICAgXCJSdXRoXCI6IFwiUnV0aFwiLFxuLy8gICBcIjEgU2FtdWVsXCI6IFwiMSBTYW1cIixcbi8vICAgXCJGaXJzdCBTYW11ZWxcIjogXCIxIFNhbVwiLFxuLy8gICBcIjIgU2FtdWVsXCI6IFwiMiBTYW1cIixcbi8vICAgXCJTZWNvbmQgU2FtdWVsXCI6IFwiMiBTYW1cIixcbi8vICAgXCIxIEtpbmdzXCI6IFwiMSBLaW5nc1wiLFxuLy8gICBcIkZpcnN0IEtpbmdzXCI6IFwiMSBLaW5nc1wiLFxuLy8gICBcIjIgS2luZ3NcIjogXCIyIEtpbmdzXCIsXG4vLyAgIFwiU2Vjb25kIEtpbmdzXCI6IFwiMiBLaW5nc1wiLFxuLy8gICBcIjEgQ2hyb25pY2xlc1wiOiBcIjEgQ2hyb25cIixcbi8vICAgXCJGaXJzdCBDaHJvbmljbGVzXCI6IFwiMSBDaHJvblwiLFxuLy8gICBcIjIgQ2hyb25pY2xlc1wiOiBcIjIgQ2hyb25cIixcbi8vICAgXCJTZWNvbmQgQ2hyb25pY2xlc1wiOiBcIjIgQ2hyb25cIixcbi8vICAgXCJFenJhXCI6IFwiRXpyYVwiLFxuLy8gICBcIk5laGVtaWFoXCI6IFwiTmVoXCIsXG4vLyAgIFwiRXN0aGVyXCI6IFwiRXN0aFwiLFxuLy8gICBcIkpvYlwiOiBcIkpvYlwiLFxuLy8gICBcIlBzYWxtc1wiOiBcIlBzYVwiLFxuLy8gICBcIlBzYWxtXCI6IFwiUHNhXCIsXG4vLyAgIFwiUHJvdmVyYnNcIjogXCJQcm92XCIsXG4vLyAgIFwiRWNjbGVzaWFzdGVzXCI6IFwiRWNjbFwiLFxuLy8gICBcIlNvbmcgb2YgU29sb21vblwiOiBcIlNvU1wiLFxuLy8gICBcIlNvbmcgb2YgU29uZ3NcIjogXCJTb1NcIixcbi8vICAgXCJTLlNcIjogXCJTb1NcIixcbi8vICAgXCJTLlMuXCI6IFwiU29TXCIsXG4vLyAgIFwiUy4gUy5cIjogXCJTb1NcIixcbi8vICAgXCJTLiBTXCI6IFwiU29TXCIsXG4vLyAgIFwiU1NcIjogXCJTb1NcIixcbi8vICAgXCJJc2FpYWhcIjogXCJJc2FcIixcbi8vICAgXCJKZXJlbWlhaFwiOiBcIkplclwiLFxuLy8gICBcIkxhbWVudGF0aW9uc1wiOiBcIkxhbVwiLFxuLy8gICBcIkV6ZWtpZWxcIjogXCJFemVrXCIsXG4vLyAgIFwiRGFuaWVsXCI6IFwiRGFuXCIsXG4vLyAgIFwiSG9zZWFcIjogXCJIb3NlYVwiLFxuLy8gICBcIkpvZWxcIjogXCJKb2VsXCIsXG4vLyAgIFwiQW1vc1wiOiBcIkFtb3NcIixcbi8vICAgXCJPYmFkaWFoXCI6IFwiT2JhZFwiLFxuLy8gICBcIkpvbmFoXCI6IFwiSm9uYWhcIixcbi8vICAgXCJNaWNhaFwiOiBcIk1pY2FoXCIsXG4vLyAgIFwiTmFodW1cIjogXCJOYWhcIixcbi8vICAgXCJIYWJha2t1a1wiOiBcIkhhYlwiLFxuLy8gICBcIlplcGhhbmlhaFwiOiBcIlplcFwiLFxuLy8gICBcIkhhZ2dhaVwiOiBcIkhhZ1wiLFxuLy8gICBcIlplY2hhcmlhaFwiOiBcIlplY2hcIixcbi8vICAgXCJNYWxhY2hpXCI6IFwiTWFsXCIsXG4vLyAgIFwiTWF0dGhld1wiOiBcIk1hdHRcIixcbi8vICAgXCJNYXJrXCI6IFwiTWFya1wiLFxuLy8gICBcIkx1a2VcIjogXCJMdWtlXCIsXG4vLyAgIFwiSm9oblwiOiBcIkpvaG5cIixcbi8vICAgXCJBY3RzXCI6IFwiQWN0c1wiLFxuLy8gICBcIlJvbWFuc1wiOiBcIlJvbVwiLFxuLy8gICBcIjEgQ29yaW50aGlhbnNcIjogXCIxIENvclwiLFxuLy8gICBcIkZpcnN0IENvcmludGhpYW5zXCI6IFwiMSBDb3JcIixcbi8vICAgXCIyIENvcmludGhpYW5zXCI6IFwiMiBDb3JcIixcbi8vICAgXCJTZWNvbmQgQ29yaW50aGlhbnNcIjogXCIyIENvclwiLFxuLy8gICBcIkdhbGF0aWFuc1wiOiBcIkdhbFwiLFxuLy8gICBcIkVwaGVzaWFuc1wiOiBcIkVwaFwiLFxuLy8gICBcIlBoaWxpcHBpYW5zXCI6IFwiUGhpbFwiLFxuLy8gICBcIkNvbG9zc2lhbnNcIjogXCJDb2xcIixcbi8vICAgXCIxIFRoZXNzYWxvbmlhbnNcIjogXCIxIFRoZXNcIixcbi8vICAgXCJGaXJzdCBUaGVzc2Fsb25pYW5zXCI6IFwiMSBUaGVzXCIsXG4vLyAgIFwiMiBUaGVzc2Fsb25pYW5zXCI6IFwiMiBUaGVzXCIsXG4vLyAgIFwiU2Vjb25kIFRoZXNzYWxvbmlhbnNcIjogXCIyIFRoZXNcIixcbi8vICAgXCIxIFRpbW90aHlcIjogXCIxIFRpbVwiLFxuLy8gICBcIkZpcnN0IFRpbW90aHlcIjogXCIxIFRpbVwiLFxuLy8gICBcIjIgVGltb3RoeVwiOiBcIjIgVGltXCIsXG4vLyAgIFwiU2Vjb25kIFRpbW90aHlcIjogXCIyIFRpbVwiLFxuLy8gICBcIlRpdHVzXCI6IFwiVGl0dXNcIixcbi8vICAgXCJQaGlsZW1vblwiOiBcIlBoaWxlbVwiLFxuLy8gICBcIkhlYnJld3NcIjogXCJIZWJcIixcbi8vICAgXCJKYW1lc1wiOiBcIkphbWVzXCIsXG4vLyAgIFwiMSBQZXRlclwiOiBcIjEgUGV0XCIsXG4vLyAgIFwiRmlyc3QgUGV0ZXJcIjogXCIxIFBldFwiLFxuLy8gICBcIjIgUGV0ZXJcIjogXCIyIFBldFwiLFxuLy8gICBcIlNlY29uZCBQZXRlclwiOiBcIjIgUGV0XCIsXG4vLyAgIFwiMSBKb2huXCI6IFwiMSBKb2huXCIsXG4vLyAgIFwiRmlyc3QgSm9oblwiOiBcIjEgSm9oblwiLFxuLy8gICBcIjIgSm9oblwiOiBcIjIgSm9oblwiLFxuLy8gICBcIlNlY29uZCBKb2huXCI6IFwiMiBKb2huXCIsXG4vLyAgIFwiMyBKb2huXCI6IFwiMyBKb2huXCIsXG4vLyAgIFwiVGhpcmQgSm9oblwiOiBcIjMgSm9oblwiLFxuLy8gICBcIkp1ZGVcIjogXCJKdWRlXCIsXG4vLyAgIFwiUmV2ZWxhdGlvblwiOiBcIlJldlwiXG4vLyB9O1xuXG4vLyB0eXBlIEJvb2tNYXAgPSBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuLy8gY29uc3QgZXNjYXBlUmUgPSAoczogc3RyaW5nKSA9PiBzLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcblxuLy8gLyoqIEJ1aWxkIGxvY2FsZS1zcGVjaWZpYyBib29rIG1hcCArIGFsdGVybmF0aW9uIGF0IHJ1bnRpbWUgKi9cbi8vIGZ1bmN0aW9uIGJ1aWxkQm9va0NvbnRleHQoc2V0dGluZ3M/OiBCaWJsZVRvb2xzU2V0dGluZ3MpIHtcbi8vICAgbGV0IGJvb2tMb2NhbGU6IHN0cmluZyB8IHVuZGVmaW5lZDtcbi8vICAgbGV0IGN1c3RvbTogdW5rbm93bjtcblxuLy8gICB0cnkgeyBib29rTG9jYWxlID0gKHNldHRpbmdzIGFzIGFueSk/LmJvb2tMb2NhbGUgYXMgc3RyaW5nIHwgdW5kZWZpbmVkOyB9IGNhdGNoIHt9XG4vLyAgIHRyeSB7IGN1c3RvbSA9IChzZXR0aW5ncyBhcyBhbnkpPy5jdXN0b21Cb29rTWFwOyB9IGNhdGNoIHt9XG5cbi8vICAgbGV0IGFiYnI6IEJvb2tNYXAgPSBCT09LX0FCQlI7XG5cbi8vICAgaWYgKGJvb2tMb2NhbGUgPT09IFwiY3VzdG9tXCIgJiYgY3VzdG9tKSB7XG4vLyAgICAgdHJ5IHtcbi8vICAgICAgIGlmICh0eXBlb2YgY3VzdG9tID09PSBcInN0cmluZ1wiKSB7XG4vLyAgICAgICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoY3VzdG9tKTtcbi8vICAgICAgICAgaWYgKHBhcnNlZCAmJiB0eXBlb2YgcGFyc2VkID09PSBcIm9iamVjdFwiKSBhYmJyID0gcGFyc2VkIGFzIEJvb2tNYXA7XG4vLyAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjdXN0b20gPT09IFwib2JqZWN0XCIpIHtcbi8vICAgICAgICAgYWJiciA9IGN1c3RvbSBhcyBCb29rTWFwO1xuLy8gICAgICAgfVxuLy8gICAgIH0gY2F0Y2gge1xuLy8gICAgICAgYWJiciA9IEJPT0tfQUJCUjtcbi8vICAgICB9XG4vLyAgIH0gZWxzZSB7XG4vLyAgICAgYWJiciA9IEJPT0tfQUJCUjtcbi8vICAgfVxuXG4vLyAgIGNvbnN0IGFsbFRva2VucyA9IEFycmF5LmZyb20obmV3IFNldChbLi4uT2JqZWN0LmtleXMoYWJiciksIC4uLk9iamVjdC52YWx1ZXMoYWJicildKSkuc29ydChcbi8vICAgICAoYSwgYikgPT4gYi5sZW5ndGggLSBhLmxlbmd0aFxuLy8gICApO1xuLy8gICBjb25zdCBCT09LX0FMVCA9IGFsbFRva2Vucy5tYXAoZXNjYXBlUmUpLmpvaW4oXCJ8XCIpO1xuXG4vLyAgIGNvbnN0IGdldEJvb2tBYmJyID0gKGJvb2s6IHN0cmluZykgPT4gYWJicltib29rXSA/PyBib29rO1xuXG4vLyAgIGNvbnN0IGJ1aWxkUGF0dGVybkJvZHkgPSAoKTogc3RyaW5nID0+IHtcbi8vICAgICBjb25zdCBib29rID0gYCg/OiR7Qk9PS19BTFR9KWA7XG4vLyAgICAgLy8gY29uc3QgcmVmMSA9XG4vLyAgICAgLy8gICBgKD86KD86JHtib29rfSlcXFxcLj9cXFxccypgICtcbi8vICAgICAvLyAgIGBcXFxcZCsoPzotXFxcXGQrKT86XFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/YCArXG4vLyAgICAgLy8gICBgKD86XFxcXHMqLFxcXFxzKlxcXFxkK1thLXpdPyg/Oi1cXFxcZCspP1thLXpdP3xcXFxccyo7XFxcXHMqXFxcXGQrOlxcXFxkK1thLXpdPyg/Oi1cXFxcZCspP1thLXpdPykqYCArXG4vLyAgICAgLy8gICBgKWA7XG4vLyAgICAgY29uc3QgcmVmMSA9XG4vLyAgICAgICBgKD86KD86JHtib29rfSk/XFxcXC4/XFxcXHMqYCArXG4vLyAgICAgICBgXFxcXGQrKD86LVxcXFxkKyk/OlxcXFxkK1thLXpdPyg/Oi1cXFxcZCspP1thLXpdP2AgK1xuLy8gICAgICAgYCg/OlxcXFxzKixcXFxccypcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT98XFxcXHMqO1xcXFxzKlxcXFxkKzpcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT8pKmAgK1xuLy8gICAgICAgYClgO1xuLy8gICAgIGNvbnN0IHJlZjIgPSBgKD86KCR7Ym9va30pXFxcXC4/XFxcXHMrKFxcXFxkKykoPzotKFxcXFxkKykpPylgO1xuLy8gICAgIGNvbnN0IFJFRiA9IGAoPzxyZWY+JHtyZWYxfXwke3JlZjJ9KWA7XG5cbi8vICAgICBjb25zdCBWRVJTRSA9XG4vLyAgICAgICBgKD88dmVyc2U+YCArXG4vLyAgICAgICBgXFxcXGJbVnZddj8oPzpcXFxcLnxlcnNlcz8pXFxcXHMqYCArXG4vLyAgICAgICBgXFxcXGQrKD86LVxcXFxkKyk/W2Etel0/YCArXG4vLyAgICAgICBgKD86KD86LHwsP1xcXFxzKmFuZClcXFxccypcXFxcZCsoPzotXFxcXGQrKT9bYS16XT8pKmAgK1xuLy8gICAgICAgYClgO1xuXG4vLyAgICAgY29uc3QgQ0hBUFRFUiA9XG4vLyAgICAgICBgKD88Y2hhcHRlcj5gICtcbi8vICAgICAgIGBcXFxcYltDY11oKD86YXB0ZXJzP3xzP1xcXFwuKVxcXFwuP1xcXFxzKmAgK1xuLy8gICAgICAgYFxcXFxkKyg/Oi1cXFxcZCspP2AgK1xuLy8gICAgICAgYClgO1xuXG4vLyAgICAgY29uc3QgTk9URSA9XG4vLyAgICAgICBgKD88bm90ZT5gICtcbi8vICAgICAgIGBcXFxcYltObl1vdGVzP2AgK1xuLy8gICAgICAgYCg/OlxcXFxzK1xcXFxkKyg/OlxcXFxzK1xcXFxkKyk/YCArXG4vLyAgICAgICBgKD86YCArXG4vLyAgICAgICBgKD86Wyw7XXwsP1xcXFxzKmFuZClcXFxccypcXFxcZCsoPzpcXFxccytcXFxcZCspP2AgK1xuLy8gICAgICAgYCg/OlxcXFxzK2luXFxcXHMrJHtib29rfVxcXFwuP1xcXFxzK1xcXFxkKyk/YCArXG4vLyAgICAgICBgKSpgICtcbi8vICAgICAgIGApYCArXG4vLyAgICAgICBgKD86XFxcXHMraW5cXFxccyske2Jvb2t9XFxcXC4/XFxcXHMrXFxcXGQrKT9gICtcbi8vICAgICAgIGApYDtcblxuLy8gICAgIGNvbnN0IEJPT0sgPSBgKD88Ym9vaz5cXFxcYig/OiR7Ym9va30pXFxcXGIpKD8hXFxcXC4/XFxcXHMqXFxcXGQrKWA7XG5cbi8vICAgICByZXR1cm4gYCR7UkVGfXwke1ZFUlNFfXwke0NIQVBURVJ9fCR7Tk9URX18JHtCT09LfWA7XG4vLyAgIH07XG5cbi8vICAgY29uc3QgUEFUVEVSTl9CT0RZID0gYnVpbGRQYXR0ZXJuQm9keSgpO1xuLy8gICBjb25zdCBQQVRURVJOX0cgPSBuZXcgUmVnRXhwKFBBVFRFUk5fQk9EWSwgXCJnXCIpO1xuLy8gICBjb25zdCBQQVRURVJOX0hFQUQgPSBuZXcgUmVnRXhwKFwiXlwiICsgUEFUVEVSTl9CT0RZKTtcblxuLy8gICByZXR1cm4geyBhYmJyLCBhbGxUb2tlbnMsIEJPT0tfQUxULCBnZXRCb29rQWJiciwgUEFUVEVSTl9HLCBQQVRURVJOX0hFQUQgfTtcbi8vIH1cblxuLy8gLyoqIC0tLS0tLS0tLS0tLS0tLS0gVXRpbGl0eTogbm9ybWFsaXplIGJvb2sgdG9rZW4gdG8gcmVtb3ZlIHRyYWlsaW5nIHBlcmlvZCAtLS0tLS0tLS0tLS0tLS0gKi9cbi8vIGZ1bmN0aW9uIG5vcm1hbGl6ZUJvb2tUb2tlbihyYXc6IHN0cmluZywgY3R4OiBSZXR1cm5UeXBlPHR5cGVvZiBidWlsZEJvb2tDb250ZXh0Pik6IHN0cmluZyB7XG4vLyAgIC8vIFRyaW0gYW5kIGRyb3AgYSBzaW5nbGUgdHJhaWxpbmcgZG90IChlLmcuLCBcIlJvbS5cIiAtPiBcIlJvbVwiKVxuLy8gICBjb25zdCBjbGVhbmVkID0gcmF3LnRyaW0oKS5yZXBsYWNlKC9cXC4kLywgXCJcIik7XG4vLyAgIHJldHVybiBjdHguZ2V0Qm9va0FiYnIoY2xlYW5lZCk7XG4vLyB9XG5cbi8vIC8qKiAtLS0tLS0tLS0tLS0tLSBQcm90ZWN0ZWQgcmFuZ2VzIChkb25cdTIwMTl0IHRvdWNoIHdoaWxlIGxpbmtpbmcpIC0tLS0tLS0tLS0tLS0tICovXG4vLyB0eXBlIFJhbmdlID0gW3N0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyXTtcblxuLy8gZnVuY3Rpb24gYWRkUmFuZ2UocmFuZ2VzOiBSYW5nZVtdLCBzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcikge1xuLy8gICBpZiAoc3RhcnQgPj0gMCAmJiBlbmQgPiBzdGFydCkgcmFuZ2VzLnB1c2goW3N0YXJ0LCBlbmRdKTtcbi8vIH1cblxuLy8gZnVuY3Rpb24gZmluZFByb3RlY3RlZFJhbmdlcyh0ZXh0OiBzdHJpbmcpOiBSYW5nZVtdIHtcbi8vICAgY29uc3QgcmFuZ2VzOiBSYW5nZVtdID0gW107XG5cbi8vICAgLy8gMSkgQ29kZSBmZW5jZXMgYGBgLi4uYGBgIGFuZCB+fn4uLi5+fn5cbi8vICAgY29uc3QgZmVuY2VSZSA9IC8oYGBgfH5+filbXlxcbl0qXFxuW1xcc1xcU10qP1xcMS9nO1xuLy8gICBmb3IgKGxldCBtOyAobSA9IGZlbmNlUmUuZXhlYyh0ZXh0KSk7ICkgYWRkUmFuZ2UocmFuZ2VzLCBtLmluZGV4LCBtLmluZGV4ICsgbVswXS5sZW5ndGgpO1xuXG4vLyAgIC8vIDIpIE1hdGggYmxvY2tzICQkLi4uJCRcbi8vICAgY29uc3QgbWF0aEJsb2NrUmUgPSAvXFwkXFwkW1xcc1xcU10qP1xcJFxcJC9nO1xuLy8gICBmb3IgKGxldCBtOyAobSA9IG1hdGhCbG9ja1JlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuLy8gICAvLyAzKSBJbmxpbmUgY29kZSBgLi4uYFxuLy8gICBjb25zdCBpbmxpbmVDb2RlUmUgPSAvYFteYFxcbl0qYC9nO1xuLy8gICBmb3IgKGxldCBtOyAobSA9IGlubGluZUNvZGVSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbi8vICAgLy8gNCkgSW5saW5lIG1hdGggJC4uLiQgKGF2b2lkICQkKVxuLy8gICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHQubGVuZ3RoOyApIHtcbi8vICAgICBpZiAodGV4dFtpXSA9PT0gXCIkXCIgJiYgdGV4dFtpICsgMV0gIT09IFwiJFwiKSB7XG4vLyAgICAgICBjb25zdCBzdGFydCA9IGk7XG4vLyAgICAgICBpKys7XG4vLyAgICAgICB3aGlsZSAoaSA8IHRleHQubGVuZ3RoICYmIHRleHRbaV0gIT09IFwiJFwiKSBpKys7XG4vLyAgICAgICBpZiAoaSA8IHRleHQubGVuZ3RoICYmIHRleHRbaV0gPT09IFwiJFwiKSB7XG4vLyAgICAgICAgIGFkZFJhbmdlKHJhbmdlcywgc3RhcnQsIGkgKyAxKTtcbi8vICAgICAgICAgaSsrO1xuLy8gICAgICAgICBjb250aW51ZTtcbi8vICAgICAgIH1cbi8vICAgICB9XG4vLyAgICAgaSsrO1xuLy8gICB9XG5cbi8vICAgLy8gNSkgTWFya2Rvd24gbGlua3MgW3RleHRdKHVybClcbi8vICAgY29uc3QgbWRMaW5rUmUgPSAvXFxbW15cXF1dKz9cXF1cXChbXildK1xcKS9nO1xuLy8gICBmb3IgKGxldCBtOyAobSA9IG1kTGlua1JlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuLy8gICAvLyA2KSBJbmxpbmUgcHJvcGVydGllcyBsaW5lczogIGtleTo6IHZhbHVlXG4vLyAgIGNvbnN0IGlubGluZVByb3BSZSA9IC9eW15cXG46XXsxLDIwMH06Oi4qJC9nbTtcbi8vICAgZm9yIChsZXQgbTsgKG0gPSBpbmxpbmVQcm9wUmUuZXhlYyh0ZXh0KSk7ICkgYWRkUmFuZ2UocmFuZ2VzLCBtLmluZGV4LCBtLmluZGV4ICsgbVswXS5sZW5ndGgpO1xuXG4vLyAgIC8vIDcpIE9ic2lkaWFuIGxpbmtzIFtbLi4uXV1cbi8vICAgY29uc3Qgb2JzaWRpYW5SZSA9IC9cXFtcXFtbXlxcXV0qP1xcXVxcXS9nO1xuLy8gICBmb3IgKGxldCBtOyAobSA9IG9ic2lkaWFuUmUuZXhlYyh0ZXh0KSk7ICkgYWRkUmFuZ2UocmFuZ2VzLCBtLmluZGV4LCBtLmluZGV4ICsgbVswXS5sZW5ndGgpO1xuXG4vLyAgIC8vIE1lcmdlIG92ZXJsYXBzICYgc29ydFxuLy8gICByYW5nZXMuc29ydCgoYSwgYikgPT4gYVswXSAtIGJbMF0pO1xuLy8gICBjb25zdCBtZXJnZWQ6IFJhbmdlW10gPSBbXTtcbi8vICAgZm9yIChjb25zdCByIG9mIHJhbmdlcykge1xuLy8gICAgIGlmICghbWVyZ2VkLmxlbmd0aCB8fCByWzBdID4gbWVyZ2VkW21lcmdlZC5sZW5ndGggLSAxXVsxXSkgbWVyZ2VkLnB1c2gocik7XG4vLyAgICAgZWxzZSBtZXJnZWRbbWVyZ2VkLmxlbmd0aCAtIDFdWzFdID0gTWF0aC5tYXgobWVyZ2VkW21lcmdlZC5sZW5ndGggLSAxXVsxXSwgclsxXSk7XG4vLyAgIH1cbi8vICAgcmV0dXJuIG1lcmdlZDtcbi8vIH1cblxuLy8gZnVuY3Rpb24gaW5Qcm90ZWN0ZWQocG9zOiBudW1iZXIsIHJhbmdlczogUmFuZ2VbXSk6IGJvb2xlYW4ge1xuLy8gICBsZXQgbG8gPSAwLCBoaSA9IHJhbmdlcy5sZW5ndGggLSAxO1xuLy8gICB3aGlsZSAobG8gPD0gaGkpIHtcbi8vICAgICBjb25zdCBtaWQgPSAobG8gKyBoaSkgPj4gMTtcbi8vICAgICBjb25zdCBbcywgZV0gPSByYW5nZXNbbWlkXTtcbi8vICAgICBpZiAocG9zIDwgcykgaGkgPSBtaWQgLSAxO1xuLy8gICAgIGVsc2UgaWYgKHBvcyA+PSBlKSBsbyA9IG1pZCArIDE7XG4vLyAgICAgZWxzZSByZXR1cm4gdHJ1ZTtcbi8vICAgfVxuLy8gICByZXR1cm4gZmFsc2U7XG4vLyB9XG5cbi8vIGZ1bmN0aW9uIGlzV2l0aGluT2JzaWRpYW5MaW5rKHRleHQ6IHN0cmluZywgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpOiBib29sZWFuIHtcbi8vICAgY29uc3QgYmVmb3JlID0gdGV4dC5zbGljZSgwLCBzdGFydCk7XG4vLyAgIGNvbnN0IGFmdGVyID0gdGV4dC5zbGljZShlbmQpO1xuLy8gICBjb25zdCBvcGVuSWR4ID0gYmVmb3JlLmxhc3RJbmRleE9mKFwiW1tcIik7XG4vLyAgIGNvbnN0IGNsb3NlSWR4ID0gYmVmb3JlLmxhc3RJbmRleE9mKFwiXV1cIik7XG4vLyAgIGlmIChvcGVuSWR4ID4gY2xvc2VJZHgpIHtcbi8vICAgICBjb25zdCBuZXh0Q2xvc2UgPSBhZnRlci5pbmRleE9mKFwiXV1cIik7XG4vLyAgICAgaWYgKG5leHRDbG9zZSAhPT0gLTEpIHJldHVybiB0cnVlO1xuLy8gICB9XG4vLyAgIHJldHVybiBmYWxzZTtcbi8vIH1cblxuLy8gLyoqIFBhcmVudGhldGljYWwgbm9pc2U6IHNraXAgaWYgaW5zaWRlIFwiKDIwMTkpXCItbGlrZSBwYXJlbnRoZXNlcyAqL1xuLy8gZnVuY3Rpb24gaXNJbnNpZGVOdW1lcmljUGFyZW5zKHRleHQ6IHN0cmluZywgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpOiBib29sZWFuIHtcbi8vICAgY29uc3Qgb3BlbiA9IHRleHQubGFzdEluZGV4T2YoXCIoXCIsIHN0YXJ0KTtcbi8vICAgaWYgKG9wZW4gPT09IC0xKSByZXR1cm4gZmFsc2U7XG4vLyAgIGNvbnN0IGNsb3NlID0gdGV4dC5pbmRleE9mKFwiKVwiLCBlbmQpO1xuLy8gICBpZiAoY2xvc2UgPT09IC0xKSByZXR1cm4gZmFsc2U7XG4vLyAgIGNvbnN0IGlubmVyID0gdGV4dC5zbGljZShvcGVuICsgMSwgY2xvc2UpLnRyaW0oKTtcbi8vICAgaWYgKC9eXFxkezEsNH0oPzpbXFwvXFwuXFwtOl1cXGR7MSwyfSg/OltcXC9cXC5cXC06XVxcZHsxLDR9KT8pPyQvLnRlc3QoaW5uZXIpKSByZXR1cm4gdHJ1ZTtcbi8vICAgaWYgKC9ecHsxLDJ9XFwuXFxzKlxcZCsoXFxzKi1cXHMqXFxkKyk/JC9pLnRlc3QoaW5uZXIpKSByZXR1cm4gdHJ1ZTtcbi8vICAgcmV0dXJuIGZhbHNlO1xuLy8gfVxuXG4vLyAvKiogLS0tLS0tLS0tLS0tLS0tLS0tLSBNYXJrZG93bi9PYnNpZGlhbiBsaW5rIGNsZWFudXAgKFB5dGhvbiBwYXJpdHkpIC0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cbi8vIGZ1bmN0aW9uIHJlbW92ZU1hdGNoaW5nTWFya2Rvd25MaW5rcyh0ZXh0OiBzdHJpbmcsIFBBVFRFUk5fSEVBRDogUmVnRXhwKTogc3RyaW5nIHtcbi8vICAgY29uc3QgbWRMaW5rID0gLyhcXCpcXCp8X198XFwqKT9cXFsoW15cXF1dKylcXF1cXChbXildK1xcKShcXCpcXCp8X198XFwqKT8vZztcbi8vICAgcmV0dXJuIHRleHQucmVwbGFjZShtZExpbmssIChfbSwgcHJlLCBkaXNwLCBzdWYpID0+IHtcbi8vICAgICBjb25zdCBsaW5rVGV4dCA9IFN0cmluZyhkaXNwKTtcbi8vICAgICBpZiAoUEFUVEVSTl9IRUFELnRlc3QobGlua1RleHQpKSByZXR1cm4gbGlua1RleHQ7XG4vLyAgICAgY29uc3Qgc2ltcGxlTnVtID0gL15cXGQrKD86WzotXVxcZCspPyg/Oi1cXGQrKT8kLy50ZXN0KGxpbmtUZXh0KTtcbi8vICAgICBpZiAoc2ltcGxlTnVtKSByZXR1cm4gbGlua1RleHQ7XG4vLyAgICAgcmV0dXJuIGAke3ByZSA/PyBcIlwifVske2xpbmtUZXh0fV0ke3N1ZiA/PyBcIlwifWA7XG4vLyAgIH0pO1xuLy8gfVxuXG4vLyBmdW5jdGlvbiByZW1vdmVNYXRjaGluZ09ic2lkaWFuTGlua3ModGV4dDogc3RyaW5nLCBQQVRURVJOX0hFQUQ6IFJlZ0V4cCk6IHN0cmluZyB7XG4vLyAgIGNvbnN0IG9icyA9IC9cXFtcXFsoW15cXF18XSspXFx8KFteXFxdXSspXFxdXFxdL2c7XG4vLyAgIHJldHVybiB0ZXh0LnJlcGxhY2Uob2JzLCAoX20sIF90LCBkaXNwKSA9PiB7XG4vLyAgICAgY29uc3QgZGlzcGxheSA9IFN0cmluZyhkaXNwKTtcbi8vICAgICBpZiAoUEFUVEVSTl9IRUFELnRlc3QoZGlzcGxheSkpIHJldHVybiBkaXNwbGF5O1xuLy8gICAgIGNvbnN0IHNpbXBsZU51bSA9IC9eXFxkKyg/Ols6LV1cXGQrKT8oPzotXFxkKyk/JC8udGVzdChkaXNwbGF5KTtcbi8vICAgICBpZiAoc2ltcGxlTnVtKSByZXR1cm4gZGlzcGxheTtcbi8vICAgICByZXR1cm4gX207XG4vLyAgIH0pO1xuLy8gfVxuXG4vLyBmdW5jdGlvbiByZXBsYWNlT2xkT2JzaWRpYW5MaW5rcyh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuLy8gICBjb25zdCBvbGRMaW5rID0gL1xcW1xcWyhbMC05XT9cXHNbQS1aYS16IF0rKVxccyhcXGQrKSNcXF4oXFxkKykoPzpcXHwoW15cXF1dKykpP1xcXVxcXS9nO1xuLy8gICByZXR1cm4gdGV4dC5yZXBsYWNlKG9sZExpbmssIChfbSwgYm9va1Nob3J0LCBjaCwgdmVyc2UsIGRpc3ApID0+IHtcbi8vICAgICBjb25zdCBiID0gU3RyaW5nKGJvb2tTaG9ydCkudHJpbSgpO1xuLy8gICAgIHJldHVybiBkaXNwXG4vLyAgICAgICA/IGBbWyR7Yn0jXiR7Y2h9LSR7dmVyc2V9fCR7ZGlzcH1dXWBcbi8vICAgICAgIDogYFtbJHtifSNeJHtjaH0tJHt2ZXJzZX1dXWA7XG4vLyAgIH0pO1xuLy8gfVxuXG4vLyBmdW5jdGlvbiBmaW5kTGFzdEJvb2tCZWZvcmUodGV4dDogc3RyaW5nLCBwb3M6IG51bWJlciwgY3R4OiBSZXR1cm5UeXBlPHR5cGVvZiBidWlsZEJvb2tDb250ZXh0Pik6IHN0cmluZyB8IG51bGwge1xuLy8gICAvLyBMb29rIGJhY2sgfjIwMCBjaGFycyBmb3IgYSBib29rIHRva2VuIGVuZGluZyByaWdodCBiZWZvcmUgJ3Bvcydcbi8vICAgY29uc3Qgc3RhcnQgPSBNYXRoLm1heCgwLCBwb3MgLSAyMDApO1xuLy8gICBjb25zdCBsZWZ0ID0gdGV4dC5zbGljZShzdGFydCwgcG9zKTtcblxuLy8gICAvLyBNYXRjaCBBTEwgYm9vayB0b2tlbnMgaW4gdGhlIHdpbmRvdzsgdGFrZSB0aGUgbGFzdCBvbmUuXG4vLyAgIGNvbnN0IHJlID0gbmV3IFJlZ0V4cChgKD86JHtjdHguQk9PS19BTFR9KVxcXFwuP1xcXFxzKiR8KD86JHtjdHguQk9PS19BTFR9KVxcXFwuP1xcXFxzK2AsIFwiZ1wiKTtcbi8vICAgbGV0IG06IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGw7XG4vLyAgIGxldCBsYXN0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuLy8gICB3aGlsZSAoKG0gPSByZS5leGVjKGxlZnQpKSAhPT0gbnVsbCkge1xuLy8gICAgIGxhc3QgPSBtWzBdLnRyaW0oKTtcbi8vICAgfVxuLy8gICBpZiAoIWxhc3QpIHJldHVybiBudWxsO1xuXG4vLyAgIC8vIHN0cmlwIHRyYWlsaW5nIHB1bmN0dWF0aW9uL2RvdCBhbmQgbm9ybWFsaXplXG4vLyAgIHJldHVybiBub3JtYWxpemVCb29rVG9rZW4obGFzdC5yZXBsYWNlKC9cXHMrJC8sIFwiXCIpLCBjdHgpO1xuLy8gfVxuXG4vLyAvKiogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIENvcmUgbGlua2VyIChQeXRob24gMToxICsgcHJvdGVjdGlvbnMpIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuLy8gZnVuY3Rpb24gcmVwbGFjZVZlcnNlUmVmZXJlbmNlc09mTWFpblRleHQoXG4vLyAgIHRleHQ6IHN0cmluZyxcbi8vICAgY3R4OiBSZXR1cm5UeXBlPHR5cGVvZiBidWlsZEJvb2tDb250ZXh0Pixcbi8vICAgb3B0czogeyByZW1vdmVPYnNpZGlhbkxpbmtzOiBib29sZWFuOyByZXdyaXRlT2xkTGlua3M6IGJvb2xlYW4sIHN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2U6IGJvb2xlYW4gfVxuLy8gKTogc3RyaW5nIHtcbi8vICAgLy8gT3JkZXIgbWF0Y2hlcyBQeXRob246IHN0cmlwIE1EIGxpbmtzIFx1MjE5MiAob3B0aW9uYWwpIHN0cmlwIFtbLi4ufC4uLl1dIFx1MjE5MiByZXdyaXRlIG9sZCBsaW5rc1xuLy8gICBpZiAob3B0cy5zdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlKSB0ZXh0ID0gcmVtb3ZlTWF0Y2hpbmdNYXJrZG93bkxpbmtzKHRleHQsIGN0eC5QQVRURVJOX0hFQUQpO1xuLy8gICBpZiAob3B0cy5yZW1vdmVPYnNpZGlhbkxpbmtzKSB0ZXh0ID0gcmVtb3ZlTWF0Y2hpbmdPYnNpZGlhbkxpbmtzKHRleHQsIGN0eC5QQVRURVJOX0hFQUQpO1xuLy8gICBpZiAob3B0cy5yZXdyaXRlT2xkTGlua3MpIHRleHQgPSByZXBsYWNlT2xkT2JzaWRpYW5MaW5rcyh0ZXh0KTtcblxuLy8gICBjb25zdCBwcm90ZWN0ZWRSYW5nZXMgPSBmaW5kUHJvdGVjdGVkUmFuZ2VzKHRleHQpO1xuXG4vLyAgIGxldCBjdXJyZW50X2Jvb2s6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuLy8gICBsZXQgY3VycmVudF9jaGFwdGVyOiBudW1iZXIgfCBzdHJpbmcgfCBudWxsID0gbnVsbDtcbi8vICAgbGV0IGN1cnJlbnRfdmVyc2U6IG51bWJlciB8IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4vLyAgIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbi8vICAgbGV0IGxhc3RQb3MgPSAwO1xuXG4vLyAgIGN0eC5QQVRURVJOX0cubGFzdEluZGV4ID0gMDtcbi8vICAgZm9yIChsZXQgbTogUmVnRXhwRXhlY0FycmF5IHwgbnVsbCA9IGN0eC5QQVRURVJOX0cuZXhlYyh0ZXh0KTsgbTsgbSA9IGN0eC5QQVRURVJOX0cuZXhlYyh0ZXh0KSkge1xuLy8gICAgIGNvbnN0IHN0YXJ0ID0gbS5pbmRleDtcbi8vICAgICBjb25zdCBlbmQgPSBzdGFydCArIG1bMF0ubGVuZ3RoO1xuXG4vLyAgICAgaWYgKGluUHJvdGVjdGVkKHN0YXJ0LCBwcm90ZWN0ZWRSYW5nZXMpIHx8IGluUHJvdGVjdGVkKGVuZCAtIDEsIHByb3RlY3RlZFJhbmdlcykgfHxcbi8vICAgICAgICAgaXNXaXRoaW5PYnNpZGlhbkxpbmsodGV4dCwgc3RhcnQsIGVuZCkgfHwgaXNJbnNpZGVOdW1lcmljUGFyZW5zKHRleHQsIHN0YXJ0LCBlbmQpKSB7XG4vLyAgICAgICBvdXQucHVzaCh0ZXh0LnNsaWNlKGxhc3RQb3MsIHN0YXJ0KSwgbVswXSk7XG4vLyAgICAgICBsYXN0UG9zID0gZW5kO1xuLy8gICAgICAgY29udGludWU7XG4vLyAgICAgfVxuXG4vLyAgICAgb3V0LnB1c2godGV4dC5zbGljZShsYXN0UG9zLCBzdGFydCkpO1xuLy8gICAgIGxhc3RQb3MgPSBlbmQ7XG5cbi8vICAgICBjb25zdCBnID0gbS5ncm91cHMgPz8ge307XG5cbi8vICAgICAvLyAtLS0tIGJvb2sgb25seVxuLy8gICAgIGlmIChnLmJvb2spIHtcbi8vICAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihnLmJvb2ssIGN0eCk7IC8vIDwtLSBzdHJpcHMgdHJhaWxpbmcgZG90XG4vLyAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBudWxsO1xuLy8gICAgICAgY3VycmVudF92ZXJzZSA9IG51bGw7XG4vLyAgICAgICBvdXQucHVzaChtWzBdKTtcbi8vICAgICAgIGNvbnRpbnVlO1xuLy8gICAgIH1cblxuLy8gICAgIC8vIC0tLS0gY2hhcHRlciAoY2guLCBjaGFwdGVyLCBjaGFwdGVycylcbi8vICAgICBpZiAoZy5jaGFwdGVyKSB7XG4vLyAgICAgICBjb25zdCBjaG0gPSBnLmNoYXB0ZXIubWF0Y2goLyhcXGQrKS8pO1xuLy8gICAgICAgaWYgKGNobSAmJiBjdXJyZW50X2Jvb2spIHtcbi8vICAgICAgICAgY29uc3QgY2ggPSBjaG1bMV07XG4vLyAgICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IGNoO1xuLy8gICAgICAgICBjdXJyZW50X3ZlcnNlID0gbnVsbDtcbi8vICAgICAgICAgb3V0LnB1c2goYFtbJHtjdXJyZW50X2Jvb2t9I14ke2NofXwke21bMF19XV1gKTtcbi8vICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgIG91dC5wdXNoKG1bMF0pO1xuLy8gICAgICAgfVxuLy8gICAgICAgY29udGludWU7XG4vLyAgICAgfVxuXG4vLyAgICAgLy8gLS0tLSB2ZXJzZSAodi4sIHZ2LiwgdmVyc2VzKVxuLy8gICAgIGlmIChnLnZlcnNlKSB7XG4vLyAgICAgICBpZiAoIWN1cnJlbnRfYm9vaykge1xuLy8gICAgICAgICBjb25zdCBpbmZlcnJlZCA9IGZpbmRMYXN0Qm9va0JlZm9yZSh0ZXh0LCBzdGFydCwgY3R4KTtcbi8vICAgICAgICAgaWYgKGluZmVycmVkKSB7XG4vLyAgICAgICAgICAgY3VycmVudF9ib29rID0gaW5mZXJyZWQ7XG4vLyAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgb3V0LnB1c2gobVswXSk7XG4vLyAgICAgICAgICAgY29udGludWU7XG4vLyAgICAgICAgIH1cbi8vICAgICAgIH1cbi8vICAgICAgIGNvbnN0IHZlcnNlVGV4dCA9IG1bMF07XG4vLyAgICAgICBjb25zdCBwYXJ0cyA9IHZlcnNlVGV4dC5zcGxpdCgvKFxccyspLyk7XG4vLyAgICAgICBjb25zdCBjaCA9IGN1cnJlbnRfY2hhcHRlciA/IFN0cmluZyhjdXJyZW50X2NoYXB0ZXIpIDogXCIxXCI7XG4vLyAgICAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGFydHMpIHtcbi8vICAgICAgICAgY29uc3Qgdm0gPSBwYXJ0Lm1hdGNoKC8oXFxkKykvKTtcbi8vICAgICAgICAgaWYgKHZtICYmIHBhcnQudHJpbSgpKSB7XG4vLyAgICAgICAgICAgb3V0LnB1c2goYFtbJHtjdXJyZW50X2Jvb2t9I14ke2NofS0ke3ZtWzFdfXwke3BhcnQudHJpbSgpfV1dYCk7XG4vLyAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgb3V0LnB1c2gocGFydCk7XG4vLyAgICAgICAgIH1cbi8vICAgICAgIH1cbi8vICAgICAgIGNvbnRpbnVlO1xuLy8gICAgIH1cblxuLy8gICAgIC8vIC0tLS0gbm90ZShzKVxuLy8gICAgIGlmIChnLm5vdGUpIHtcbi8vICAgICAgIGNvbnN0IG5vdGVUZXh0ID0gZy5ub3RlIGFzIHN0cmluZztcbi8vICAgICAgIGNvbnN0IHBhcnRzID0gbm90ZVRleHQuc3BsaXQoL1xccysvKTtcbi8vICAgICAgIGxldCBib29rU3Vic3RyaW5nID0gZmFsc2U7XG4vLyAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgICAgIGNvbnN0IHBhcnQgPSBwYXJ0c1tpXTtcbi8vICAgICAgICAgY29uc3QgcG0gPSBwYXJ0Lm1hdGNoKC9eKFxcZCspLyk7XG4vLyAgICAgICAgIGlmIChwbSAmJiAhYm9va1N1YnN0cmluZykge1xuLy8gICAgICAgICAgIGNvbnN0IHZlcnNlID0gcG1bMV07XG4vLyAgICAgICAgICAgaWYgKChpICsgMSA8IHBhcnRzLmxlbmd0aCAmJiAhL15cXGQrLy50ZXN0KHBhcnRzW2kgKyAxXSkpIHx8IGkgKyAxID49IHBhcnRzLmxlbmd0aCkge1xuLy8gICAgICAgICAgICAgb3V0LnB1c2goXCIgXCIgKyBwYXJ0KTtcbi8vICAgICAgICAgICAgIGNvbnRpbnVlO1xuLy8gICAgICAgICAgIH1cbi8vICAgICAgICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPCBwYXJ0cy5sZW5ndGg7IGorKykge1xuLy8gICAgICAgICAgICAgaWYgKHBhcnRzW2pdID09PSBcImluXCIgJiYgaiArIDEgPCBwYXJ0cy5sZW5ndGgpIHtcbi8vICAgICAgICAgICAgICAgaWYgKC9eXFxkKyQvLnRlc3QocGFydHNbaiArIDFdKSAmJiBqICsgMiA8IHBhcnRzLmxlbmd0aCkge1xuLy8gICAgICAgICAgICAgICAgIGNvbnN0IGJvb2sgPSBwYXJ0c1tqICsgMV0gKyBcIiBcIiArIHBhcnRzW2ogKyAyXTtcbi8vICAgICAgICAgICAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBwYXJ0c1tqICsgM107XG4vLyAgICAgICAgICAgICAgICAgY3VycmVudF9ib29rID0gbm9ybWFsaXplQm9va1Rva2VuKGJvb2ssIGN0eCk7IC8vIDwtLSBub3JtYWxpemVcbi8vICAgICAgICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICAgICAgICBjb25zdCBib29rID0gcGFydHNbaiArIDFdO1xuLy8gICAgICAgICAgICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IHBhcnRzW2ogKyAyXTtcbi8vICAgICAgICAgICAgICAgICBjdXJyZW50X2Jvb2sgPSBub3JtYWxpemVCb29rVG9rZW4oYm9vaywgY3R4KTsgLy8gPC0tIG5vcm1hbGl6ZVxuLy8gICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgfVxuLy8gICAgICAgICAgIGlmIChjdXJyZW50X2Jvb2sgJiYgY3VycmVudF9jaGFwdGVyKSB7XG4vLyAgICAgICAgICAgICBvdXQucHVzaChgIFtbJHtjdXJyZW50X2Jvb2t9ICR7Y3VycmVudF9jaGFwdGVyfSNeJHt2ZXJzZX18JHtwYXJ0fV1dYCk7XG4vLyAgICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICAgIG91dC5wdXNoKFwiIFwiICsgcGFydCk7XG4vLyAgICAgICAgICAgfVxuLy8gICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgIG91dC5wdXNoKChpID4gMCA/IFwiIFwiIDogXCJcIikgKyBwYXJ0KTtcbi8vICAgICAgICAgfVxuLy8gICAgICAgfVxuLy8gICAgICAgY29udGludWU7XG4vLyAgICAgfVxuXG4vLyAgICAgLy8gLS0tLSBmdWxsIHJlZmVyZW5jZVxuLy8gICAgIGlmIChnLnJlZikge1xuLy8gICAgICAgY29uc3QgbW0gPSAoZy5yZWYgYXMgc3RyaW5nKS5tYXRjaCgvKFxccypbXFwuLDtdPykoLispLyk7XG4vLyAgICAgICBjb25zdCBsZWFkaW5nID0gbW0gPyBtbVsxXSA6IFwiXCI7XG4vLyAgICAgICBsZXQgcmVmVGV4dCA9IG1tID8gbW1bMl0gOiAoZy5yZWYgYXMgc3RyaW5nKTtcblxuLy8gICAgICAgY29uc3QgYm9va1N0YXJ0ID0gcmVmVGV4dC5tYXRjaChuZXcgUmVnRXhwKGBeKCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccyspYCkpO1xuLy8gICAgICAgbGV0IHByZWZpeDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4vLyAgICAgICBpZiAoYm9va1N0YXJ0KSB7XG4vLyAgICAgICAgIGNvbnN0IGJvb2tQYXJ0ID0gYm9va1N0YXJ0WzBdO1xuLy8gICAgICAgICBwcmVmaXggPSBib29rUGFydDsgLy8gZm9yIGRpc3BsYXkgdGV4dCAoY2FuIGtlZXAgaXRzIGRvdClcbi8vICAgICAgICAgY3VycmVudF9ib29rID0gbm9ybWFsaXplQm9va1Rva2VuKGJvb2tQYXJ0LnJlcGxhY2UoL1xccyskLywgXCJcIiksIGN0eCk7IC8vIDwtLSBub3JtYWxpemUgZm9yIHRhcmdldFxuLy8gICAgICAgICByZWZUZXh0ID0gcmVmVGV4dC5zbGljZShib29rUGFydC5sZW5ndGgpO1xuLy8gICAgICAgfVxuLy8gICAgICAgaWYgKCFjdXJyZW50X2Jvb2spIHtcbi8vICAgICAgICAgLy8gRmFsbGJhY2s6IGluZmVyIGJvb2sgZnJvbSBsZWZ0IGNvbnRleHQgKGUuZy4sIFwiXHUyMDI2IEpvaG4gMToyOTsgMTI6MjQ7IFx1MjAyNlwiKVxuLy8gICAgICAgICBjb25zdCBpbmZlcnJlZCA9IGZpbmRMYXN0Qm9va0JlZm9yZSh0ZXh0LCBzdGFydCwgY3R4KTtcbi8vICAgICAgICAgaWYgKGluZmVycmVkKSB7XG4vLyAgICAgICAgICAgY3VycmVudF9ib29rID0gaW5mZXJyZWQ7XG4vLyAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgb3V0LnB1c2gobVswXSk7XG4vLyAgICAgICAgICAgY29udGludWU7XG4vLyAgICAgICAgIH1cbi8vICAgICAgIH1cblxuLy8gICAgICAgY29uc3QgcGFydHMgPSByZWZUZXh0LnJlcGxhY2UoL1xcLi9nLCBcIlwiKS50cmltKCkuc3BsaXQoLyg7fCwpLyk7XG4vLyAgICAgICBjb25zdCByZXN1bHQ6IHN0cmluZ1tdID0gW107XG4vLyAgICAgICBsZXQgdmVyc2VTdHJpbmcgPSBmYWxzZTtcbi8vICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IG51bGw7XG4vLyAgICAgICBsZXQgbG9jYWxfY3VycmVudF92ZXJzZTogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbi8vICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgICAgY29uc3QgcGFydCA9IHBhcnRzW2ldO1xuLy8gICAgICAgICBpZiAocGFydCA9PT0gXCIsXCIgfHwgcGFydCA9PT0gXCI7XCIpIHtcbi8vICAgICAgICAgICByZXN1bHQucHVzaChwYXJ0ICsgXCIgXCIpO1xuLy8gICAgICAgICAgIHZlcnNlU3RyaW5nID0gKHBhcnQgPT09IFwiLFwiKTtcbi8vICAgICAgICAgICBjb250aW51ZTtcbi8vICAgICAgICAgfVxuLy8gICAgICAgICBsZXQgcCA9IHBhcnQudHJpbSgpO1xuLy8gICAgICAgICBpZiAoIXApIGNvbnRpbnVlO1xuXG4vLyAgICAgICAgIGxldCBjaGFwOiBzdHJpbmcgfCBudW1iZXIgfCBudWxsID0gY3VycmVudF9jaGFwdGVyO1xuLy8gICAgICAgICBsZXQgdjogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4vLyAgICAgICAgIGxldCB2RW5kOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuLy8gICAgICAgICBpZiAocC5pbmNsdWRlcyhcIjpcIikpIHtcbi8vICAgICAgICAgICBjb25zdCBbY1N0ciwgdlN0cl0gPSBwLnNwbGl0KFwiOlwiKTtcbi8vICAgICAgICAgICBjaGFwID0gY1N0cjtcbi8vICAgICAgICAgICB2ID0gdlN0cjtcbi8vICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICBpZiAodmVyc2VTdHJpbmcpIHYgPSBwO1xuLy8gICAgICAgICAgIGVsc2UgeyBjaGFwID0gcDsgdiA9IG51bGw7IH1cbi8vICAgICAgICAgfVxuXG4vLyAgICAgICAgIGlmICh0eXBlb2YgY2hhcCAhPT0gXCJudW1iZXJcIikge1xuLy8gICAgICAgICAgIGNvbnN0IGNocyA9IFN0cmluZyhjaGFwID8/IFwiXCIpLnNwbGl0KFwiLVwiKTtcbi8vICAgICAgICAgICBjaGFwID0gcGFyc2VJbnQoY2hzWzBdLnJlcGxhY2UoL1thLXpdJC9pLCBcIlwiKSwgMTApO1xuLy8gICAgICAgICB9XG5cbi8vICAgICAgICAgaWYgKHYpIHtcbi8vICAgICAgICAgICBjb25zdCB2cyA9IFN0cmluZyh2KS5zcGxpdChcIi1cIik7XG4vLyAgICAgICAgICAgbG9jYWxfY3VycmVudF92ZXJzZSA9IHBhcnNlSW50KHZzWzBdLnJlcGxhY2UoL1thLXpdJC9pLCBcIlwiKSwgMTApO1xuLy8gICAgICAgICAgIHZFbmQgPSB2cy5sZW5ndGggPiAxID8gcGFyc2VJbnQodnNbMV0ucmVwbGFjZSgvW2Etel0kL2ksIFwiXCIpLCAxMCkgOiBudWxsO1xuLy8gICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgIGxvY2FsX2N1cnJlbnRfdmVyc2UgPSBudWxsO1xuLy8gICAgICAgICAgIHZFbmQgPSBudWxsO1xuLy8gICAgICAgICB9XG5cbi8vICAgICAgICAgaWYgKHZFbmQpIHtcbi8vICAgICAgICAgICBjb25zdCBkaXNwbGF5U3RhcnQgPSBwLnJlcGxhY2UoL1xcZCtbYS16XT8kL2ksIFwiXCIpO1xuLy8gICAgICAgICAgIHJlc3VsdC5wdXNoKGBbWyR7Y3VycmVudF9ib29rfSNeJHtjaGFwfS0ke2xvY2FsX2N1cnJlbnRfdmVyc2V9fCR7cHJlZml4ID8gcHJlZml4IDogXCJcIn0ke2Rpc3BsYXlTdGFydH1dXWApO1xuLy8gICAgICAgICAgIHJlc3VsdC5wdXNoKGBbWyR7Y3VycmVudF9ib29rfSNeJHtjaGFwfS0ke3ZFbmR9fCR7U3RyaW5nKHApLm1hdGNoKC8oXFxkK1thLXpdPykkL2kpPy5bMV0gPz8gXCJcIn1dXWApO1xuLy8gICAgICAgICAgIGxvY2FsX2N1cnJlbnRfdmVyc2UgPSB2RW5kO1xuLy8gICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgIHJlc3VsdC5wdXNoKGBbWyR7Y3VycmVudF9ib29rfSNeJHtjaGFwfSR7bG9jYWxfY3VycmVudF92ZXJzZSA/IGAtJHtsb2NhbF9jdXJyZW50X3ZlcnNlfWAgOiBcIlwifXwke3ByZWZpeCA/IHByZWZpeCA6IFwiXCJ9JHtwfV1dYCk7XG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgcHJlZml4ID0gbnVsbDtcbi8vICAgICAgICAgY3VycmVudF9jaGFwdGVyID0gY2hhcDtcbi8vICAgICAgICAgY3VycmVudF92ZXJzZSA9IGxvY2FsX2N1cnJlbnRfdmVyc2U7XG4vLyAgICAgICB9XG5cbi8vICAgICAgIG91dC5wdXNoKGxlYWRpbmcgKyByZXN1bHQuam9pbihcIlwiKSk7XG4vLyAgICAgICBjb250aW51ZTtcbi8vICAgICB9XG5cbi8vICAgICBvdXQucHVzaChtWzBdKTtcbi8vICAgfVxuXG4vLyAgIG91dC5wdXNoKHRleHQuc2xpY2UobGFzdFBvcykpO1xuLy8gICByZXR1cm4gb3V0LmpvaW4oXCJcIik7XG4vLyB9XG5cblxuLy8gLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQdWJsaWMgQVBJIHVzZWQgYnkgY29tbWFuZCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cbi8vIGV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaW5rVmVyc2VzSW5UZXh0KHRleHQ6IHN0cmluZywgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncyk6IFByb21pc2U8c3RyaW5nPiB7XG4vLyAgIGNvbnN0IGN0eCA9IGJ1aWxkQm9va0NvbnRleHQoc2V0dGluZ3MpO1xuXG4vLyAgIC8vIFNldHRpbmdzIHRvZ2dsZXMgKG9wdGlvbmFsOyBkZWZhdWx0IHRvIFB5dGhvbiBiZWhhdmlvcilcbi8vICAgY29uc3QgcmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MgPVxuLy8gICAgIChzZXR0aW5ncyBhcyBhbnkpPy5yZW1vdmVPYnNpZGlhbkRpc3BsYXlMaW5rcyA/PyB0cnVlO1xuLy8gICBjb25zdCByZXdyaXRlT2xkT2JzaWRpYW5MaW5rcyA9XG4vLyAgICAgKHNldHRpbmdzIGFzIGFueSk/LnJld3JpdGVPbGRPYnNpZGlhbkxpbmtzID8/IHRydWU7XG4vLyAgIGNvbnN0IHN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2UgPVxuLy8gICAgIChzZXR0aW5ncyBhcyBhbnkpPy5zdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlID8/IHRydWU7XG5cbi8vICAgcmV0dXJuIHJlcGxhY2VWZXJzZVJlZmVyZW5jZXNPZk1haW5UZXh0KHRleHQsIGN0eCwge1xuLy8gICAgIHJlbW92ZU9ic2lkaWFuTGlua3M6IHJlbW92ZU9ic2lkaWFuRGlzcGxheUxpbmtzLFxuLy8gICAgIHJld3JpdGVPbGRMaW5rczogcmV3cml0ZU9sZE9ic2lkaWFuTGlua3MsXG4vLyAgICAgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZTogc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZVxuLy8gICB9KTtcbi8vIH1cblxuLy8gZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbW1hbmRWZXJzZUxpbmtzKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzLCBwYXJhbXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSB7XG4vLyAgIGNvbnN0IHNjb3BlID0gcGFyYW1zPy5zY29wZSA/PyBcImN1cnJlbnRcIjtcblxuLy8gICBpZiAoc2NvcGUgPT09IFwiZm9sZGVyXCIpIHtcbi8vICAgICBjb25zdCBhY3RpdmUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbi8vICAgICBjb25zdCBmb2xkZXIgPSBhY3RpdmU/LnBhcmVudDtcbi8vICAgICBpZiAoIWFjdGl2ZSB8fCAhZm9sZGVyKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBpbnNpZGUgdGhlIHRhcmdldCBmb2xkZXIuXCIpOyByZXR1cm47IH1cblxuLy8gICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4vLyAgICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBURmlsZSAmJiBjaGlsZC5leHRlbnNpb24gPT09IFwibWRcIikge1xuLy8gICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoY2hpbGQpO1xuLy8gICAgICAgICBjb25zdCB7IHlhbWwsIGJvZHkgfSA9IHNwbGl0RnJvbnRtYXR0ZXIoY29udGVudCk7XG4vLyAgICAgICAgIGNvbnN0IGxpbmtlZCA9IGF3YWl0IGxpbmtWZXJzZXNJblRleHQoYm9keSwgc2V0dGluZ3MpO1xuLy8gICAgICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGNoaWxkLCAoeWFtbCA/PyBcIlwiKSArIGxpbmtlZCk7XG4vLyAgICAgICB9XG4vLyAgICAgfVxuLy8gICAgIG5ldyBOb3RpY2UoXCJMaW5rZWQgdmVyc2VzIGluIGZvbGRlci5cIik7XG4vLyAgICAgcmV0dXJuO1xuLy8gICB9XG5cbi8vICAgY29uc3QgZmlsZSA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuLy8gICBpZiAoIWZpbGUpIHsgbmV3IE5vdGljZShcIk9wZW4gYSBmaWxlIGZpcnN0LlwiKTsgcmV0dXJuOyB9XG5cbi8vICAgY29uc3QgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuLy8gICBjb25zdCB7IHlhbWwsIGJvZHkgfSA9IHNwbGl0RnJvbnRtYXR0ZXIoY29udGVudCk7XG4vLyAgIGNvbnN0IGxpbmtlZCA9IGF3YWl0IGxpbmtWZXJzZXNJblRleHQoYm9keSwgc2V0dGluZ3MpO1xuLy8gICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGZpbGUsICh5YW1sID8/IFwiXCIpICsgbGlua2VkKTtcbi8vICAgbmV3IE5vdGljZShcIkxpbmtlZCB2ZXJzZXMgaW4gY3VycmVudCBmaWxlLlwiKTtcbi8vIH1cblxuLy8gZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbW1hbmRWZXJzZUxpbmtzU2VsZWN0aW9uT3JMaW5lKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4vLyAgIGNvbnN0IG1kVmlldyA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuLy8gICBpZiAoIW1kVmlldykgeyBuZXcgTm90aWNlKFwiT3BlbiBhIE1hcmtkb3duIGZpbGUgZmlyc3QuXCIpOyByZXR1cm47IH1cblxuLy8gICBjb25zdCBlZGl0b3IgPSBtZFZpZXcuZWRpdG9yO1xuXG4vLyAgIC8vIElmIHVzZXIgc2VsZWN0ZWQgdGV4dCwgcHJvY2VzcyB0aGF0OyBvdGhlcndpc2UgcHJvY2VzcyB0aGUgY3VycmVudCBsaW5lXG4vLyAgIGNvbnN0IHNlbGVjdGlvblRleHQgPSBlZGl0b3IuZ2V0U2VsZWN0aW9uKCk7XG4vLyAgIGlmIChzZWxlY3Rpb25UZXh0ICYmIHNlbGVjdGlvblRleHQubGVuZ3RoID4gMCkge1xuLy8gICAgIGNvbnN0IGxpbmtlZCA9IGF3YWl0IGxpbmtWZXJzZXNJblRleHQoc2VsZWN0aW9uVGV4dCwgc2V0dGluZ3MpO1xuLy8gICAgIGlmIChsaW5rZWQgIT09IHNlbGVjdGlvblRleHQpIHtcbi8vICAgICAgIGVkaXRvci5yZXBsYWNlU2VsZWN0aW9uKGxpbmtlZCk7XG4vLyAgICAgICBuZXcgTm90aWNlKFwiTGlua2VkIHZlcnNlcyBpbiBzZWxlY3Rpb24uXCIpO1xuLy8gICAgIH0gZWxzZSB7XG4vLyAgICAgICBuZXcgTm90aWNlKFwiTm8gbGlua2FibGUgdmVyc2VzIGluIHNlbGVjdGlvbi5cIik7XG4vLyAgICAgfVxuLy8gICAgIHJldHVybjtcbi8vICAgfVxuXG4vLyAgIC8vIE5vIHNlbGVjdGlvbiBcdTIxOTIgcHJvY2VzcyBjdXJyZW50IGxpbmVcbi8vICAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRDdXJzb3IoKS5saW5lO1xuLy8gICBjb25zdCBsaW5lVGV4dCA9IGVkaXRvci5nZXRMaW5lKGxpbmUpO1xuLy8gICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KGxpbmVUZXh0LCBzZXR0aW5ncyk7XG4vLyAgIGlmIChsaW5rZWQgIT09IGxpbmVUZXh0KSB7XG4vLyAgICAgZWRpdG9yLnNldExpbmUobGluZSwgbGlua2VkKTtcbi8vICAgICBuZXcgTm90aWNlKFwiTGlua2VkIHZlcnNlcyBvbiBjdXJyZW50IGxpbmUuXCIpO1xuLy8gICB9IGVsc2Uge1xuLy8gICAgIG5ldyBOb3RpY2UoXCJObyBsaW5rYWJsZSB2ZXJzZXMgb24gY3VycmVudCBsaW5lLlwiKTtcbi8vICAgfVxuLy8gfSIsICJpbXBvcnQgeyBBcHAsIFRGaWxlLCBURm9sZGVyLCBub3JtYWxpemVQYXRoIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBzcGxpdEZyb250bWF0dGVyKHRleHQ6IHN0cmluZyk6IHsgeWFtbD86IHN0cmluZzsgYm9keTogc3RyaW5nIH0ge1xuICBpZiAodGV4dC5zdGFydHNXaXRoKFwiLS0tXCIpKSB7XG4gICAgY29uc3QgZW5kID0gdGV4dC5pbmRleE9mKFwiXFxuLS0tXCIsIDMpO1xuICAgIGlmIChlbmQgIT09IC0xKSB7XG4gICAgICBjb25zdCB5YW1sID0gdGV4dC5zbGljZSgwLCBlbmQgKyA0KTtcbiAgICAgIGNvbnN0IGJvZHkgPSB0ZXh0LnNsaWNlKGVuZCArIDQpO1xuICAgICAgcmV0dXJuIHsgeWFtbCwgYm9keSB9O1xuICAgIH1cbiAgfVxuICByZXR1cm4geyBib2R5OiB0ZXh0IH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRBZnRlcllhbWxPckgxKHNyYzogc3RyaW5nLCBibG9jazogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgeyB5YW1sLCBib2R5IH0gPSBzcGxpdEZyb250bWF0dGVyKHNyYyk7XG4gIGlmICh5YW1sKSByZXR1cm4geWFtbCArIFwiXFxuXCIgKyBibG9jayArIGJvZHk7XG4gIGNvbnN0IGZpcnN0SDEgPSBib2R5LmluZGV4T2YoXCJcXG4jIFwiKTtcbiAgaWYgKGZpcnN0SDEgIT09IC0xKSB7XG4gICAgY29uc3QgcG9zID0gZmlyc3RIMSArIDE7XG4gICAgcmV0dXJuIGJvZHkuc2xpY2UoMCwgcG9zKSArIGJsb2NrICsgYm9keS5zbGljZShwb3MpO1xuICB9XG4gIHJldHVybiBib2R5ICsgKGJvZHkuZW5kc1dpdGgoXCJcXG5cIikgPyBcIlwiIDogXCJcXG5cIikgKyBibG9jaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTGVhZkZvbGRlcihmb2xkZXI6IFRGb2xkZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGZvbGRlci5jaGlsZHJlbi5maW5kKGMgPT4gYyBpbnN0YW5jZW9mIFRGb2xkZXIpID09PSB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMZWFmRm9sZGVyc1VuZGVyKGFwcDogQXBwLCBiYXNlRm9sZGVyUGF0aDogc3RyaW5nKTogVEZvbGRlcltdIHtcbiAgY29uc3QgYmFzZSA9IGFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgobm9ybWFsaXplUGF0aChiYXNlRm9sZGVyUGF0aCkpO1xuICBpZiAoIWJhc2UpIHJldHVybiBbXTtcbiAgY29uc3QgcmVzOiBURm9sZGVyW10gPSBbXTtcbiAgY29uc3Qgd2FsayA9IChmOiBURm9sZGVyKSA9PiB7XG4gICAgaWYgKGlzTGVhZkZvbGRlcihmKSkgcmVzLnB1c2goZik7XG4gICAgZWxzZSBmb3IgKGNvbnN0IGMgb2YgZi5jaGlsZHJlbikgaWYgKGMgaW5zdGFuY2VvZiBURm9sZGVyKSB3YWxrKGMpO1xuICB9O1xuICB3YWxrKGJhc2UpO1xuICByZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbGlzdE1hcmtkb3duRmlsZXMoZm9sZGVyOiBURm9sZGVyKTogVEZpbGVbXSB7XG4gIHJldHVybiBmb2xkZXIuY2hpbGRyZW4uZmlsdGVyKChjKTogYyBpcyBURmlsZSA9PiBjIGluc3RhbmNlb2YgVEZpbGUgJiYgYy5leHRlbnNpb24gPT09IFwibWRcIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaXJzdE5vbkVtcHR5TGluZUluZGV4KGxpbmVzOiBzdHJpbmdbXSk6IG51bWJlciB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIGlmIChsaW5lc1tpXS50cmltKCkubGVuZ3RoKSByZXR1cm4gaTtcbiAgcmV0dXJuIC0xO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdXBzZXJ0VG9wTGlua3NCbG9jayhzcmM6IHN0cmluZywgbGlua3NMaW5lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB7IHlhbWwsIGJvZHkgfSA9IHNwbGl0RnJvbnRtYXR0ZXIoc3JjKTtcblxuICBmdW5jdGlvbiByZXBsYWNlV2l0aGluKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTWF0aC5taW4oMTAsIGxpbmVzLmxlbmd0aCk7IGkrKykge1xuICAgICAgaWYgKC9cXHxQcmV2aW91c1xcXVxcXXxcXHxOZXh0XFxdXFxdLy50ZXN0KGxpbmVzW2ldKSkge1xuICAgICAgICBsaW5lc1tpXSA9IGxpbmtzTGluZTtcbiAgICAgICAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIik7XG4gICAgICB9XG4gICAgfVxuICAgIGxpbmVzLnNwbGljZSgwLCAwLCBcIlwiLCBsaW5rc0xpbmUsIFwiXCIpO1xuICAgIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgaWYgKHlhbWwpIHJldHVybiB5YW1sICsgcmVwbGFjZVdpdGhpbihib2R5KTtcbiAgcmV0dXJuIHJlcGxhY2VXaXRoaW4oc3JjKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwc2VydEJvdHRvbUxpbmtzKHNyYzogc3RyaW5nLCBsaW5rc0xpbmU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gc3JjLnNwbGl0KFwiXFxuXCIpO1xuICBmb3IgKGxldCBpID0gTWF0aC5tYXgoMCwgbGluZXMubGVuZ3RoIC0gNSk7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgIGlmICgvXFx8UHJldmlvdXNcXF1cXF18XFx8TmV4dFxcXVxcXS8udGVzdChsaW5lc1tpXSkpIHtcbiAgICAgIGxpbmVzW2ldID0gbGlua3NMaW5lO1xuICAgICAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIik7XG4gICAgfVxuICB9XG4gIGxpbmVzLnB1c2goXCJcIiwgbGlua3NMaW5lKTtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgQmFzZUJvbGxzTW9kYWwgfSBmcm9tIFwiLi9ib2xscy1iYXNlLW1vZGFsXCI7XG5cbmV4cG9ydCBjbGFzcyBQaWNrVmVyc2lvbk1vZGFsIGV4dGVuZHMgQmFzZUJvbGxzTW9kYWwge1xuICBwcml2YXRlIHJlYWRvbmx5IG9uUGljazogKHZlclNob3J0OiBzdHJpbmcgfCBudWxsKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzLCBvblBpY2s6ICh2ZXJTaG9ydDogc3RyaW5nIHwgbnVsbCkgPT4gdm9pZCkge1xuICAgIHN1cGVyKGFwcCwgc2V0dGluZ3MsIHtcbiAgICAgIGxhbmd1YWdlTGFiZWw6IHNldHRpbmdzLmJpYmxlRGVmYXVsdExhbmd1YWdlID8/IG51bGwsXG4gICAgICB2ZXJzaW9uU2hvcnQ6ICBzZXR0aW5ncy5iaWJsZURlZmF1bHRWZXJzaW9uLCAvLyBjYW4gYmUgdW5kZWZpbmVkXG4gICAgfSk7XG4gICAgdGhpcy5vblBpY2sgPSBvblBpY2s7XG4gIH1cblxuICBwcm90ZWN0ZWQgcmVuZGVyRm9vdGVyKGNvbnRlbnRFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIkhvdyB0byBsaW5rXCIpXG4gICAgICAuc2V0RGVzYyhcIklmIHlvdSBjYW5jZWwsIGxpbmtzIHdpbGwgdXNlIGRlZmF1bHQgKG5vIHZlcnNpb24pLlwiKVxuICAgICAgLmFkZEJ1dHRvbihiID0+XG4gICAgICAgIGIuc2V0QnV0dG9uVGV4dChcIlVzZSBzZWxlY3RlZCB2ZXJzaW9uXCIpLnNldEN0YSgpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICB0aGlzLm9uUGljayh0aGlzLnRyYW5zbGF0aW9uQ29kZSB8fCBudWxsKTtcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5hZGRFeHRyYUJ1dHRvbihiID0+XG4gICAgICAgIGIuc2V0SWNvbihcInhcIikuc2V0VG9vbHRpcChcIkNhbmNlbCAobm8gdmVyc2lvbilcIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICAgIHRoaXMub25QaWNrKG51bGwpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgfVxufSIsICJpbXBvcnQgeyBBcHAsIE1vZGFsIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHtcbiAgQmFzZUJvbGxzRGVmYXVsdHMsXG4gIEJvbGxzTGFuZ3VhZ2UsXG4gIEJvbGxzUGlja2VyQ29tcG9uZW50LFxufSBmcm9tIFwiLi9ib2xscy1waWNrZXItY29tcG9uZW50XCI7XG5cbi8qKlxuICogQmFzZSBtb2RhbCB0aGF0OlxuICogIC0gZGVsZWdhdGVzIGFsbCBCb2xscyBjYXRhbG9ndWUgbG9hZGluZyArIHBpY2tlcnMgdG8gQm9sbHNQaWNrZXJDb21wb25lbnQsXG4gKiAgLSBleHBvc2VzIGNob3NlbiBgbGFuZ3VhZ2VLZXlgLCBgdHJhbnNsYXRpb25Db2RlYCwgYHRyYW5zbGF0aW9uRnVsbGAsXG4gKiAgLSBwcm92aWRlcyBob29rcyBmb3Igc3ViY2xhc3NlcyB0byBhZGQgb3B0aW9ucy9mb290ZXIvYWN0aW9ucy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VCb2xsc01vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcm90ZWN0ZWQgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncztcblxuICAvKiogQ3VycmVudCBzZWxlY3Rpb24gKGtlcHQgaW4gc3luYyB2aWEgdGhlIGNvbXBvbmVudCdzIG9uQ2hhbmdlKSAqL1xuICBwcm90ZWN0ZWQgbGFuZ3VhZ2VLZXk6IHN0cmluZyA9IFwiQUxMXCI7IC8vIFwiQUxMXCIgKD1mbGF0dGVuKSBvciBleGFjdCBCb2xsc0xhbmd1YWdlLmxhbmd1YWdlXG4gIHByb3RlY3RlZCB0cmFuc2xhdGlvbkNvZGU/OiBzdHJpbmcgPSB1bmRlZmluZWQ7XG4gIHByb3RlY3RlZCB0cmFuc2xhdGlvbkZ1bGw/OiBzdHJpbmcgPSB1bmRlZmluZWQ7XG5cbiAgLyoqIElmIGEgc3ViY2xhc3Mgd2FudHMgdG8gcmVuZGVyIGFkZGl0aW9uYWwgVUkgbmVhciB0aGUgdmVyc2lvbnMgYXJlYSAqL1xuICBwcm90ZWN0ZWQgdmVyc2lvbnNDb250YWluZXIhOiBIVE1MRGl2RWxlbWVudDtcblxuICAvKiogT3B0aW9uYWwgZGVmYXVsdHMgdG8gcHJlc2VsZWN0IChmcm9tIHNldHRpbmdzKSAqL1xuICBwcml2YXRlIGRlZmF1bHRzPzogQmFzZUJvbGxzRGVmYXVsdHM7XG5cbiAgLyoqIElmIGEgc3ViY2xhc3Mgd2FudHMgdG8gaW5zcGVjdCBvciByZXVzZSB0aGUgY29tcG9uZW50LiAqL1xuICBwcm90ZWN0ZWQgcGlja2VyITogQm9sbHNQaWNrZXJDb21wb25lbnQ7XG5cbiAgLyoqIElmIGEgc3ViY2xhc3Mgd2FudHMgdG8gYWNjZXNzIHRoZSBpbi1tZW1vcnkgYmxvY2tzIGFmdGVyIGNvbXBvbmVudCBsb2Fkcy4gKi9cbiAgcHJvdGVjdGVkIGxhbmdCbG9ja3M6IEJvbGxzTGFuZ3VhZ2VbXSA9IFtdO1xuXG4gIHByb3RlY3RlZCBkaXNhbGxvd0RlZmF1bHQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncywgZGVmYXVsdHM/OiBCYXNlQm9sbHNEZWZhdWx0cykge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgIHRoaXMudHJhbnNsYXRpb25Db2RlID0gc2V0dGluZ3MuYmlibGVEZWZhdWx0VmVyc2lvbjtcbiAgICB0aGlzLnRyYW5zbGF0aW9uRnVsbCA9IHNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb25GdWxsO1xuICAgIHRoaXMubGFuZ3VhZ2VLZXkgPSBzZXR0aW5ncy5iaWJsZURlZmF1bHRMYW5ndWFnZSA/PyBcIkFMTFwiO1xuICAgIHRoaXMuZGVmYXVsdHMgPSBkZWZhdWx0cztcbiAgfVxuXG4gIC8qKiBPdmVycmlkZSB0byBhZGQgZXh0cmEgb3B0aW9uIGNvbnRyb2xzIHVuZGVyIHRoZSBwaWNrZXJzICovXG4gIHByb3RlY3RlZCByZW5kZXJFeHRyYU9wdGlvbnMoX2NvbnRlbnRFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHt9XG5cbiAgLyoqIE92ZXJyaWRlIHRvIHJlbmRlciBmb290ZXIgKGJ1dHRvbnMvcHJvZ3Jlc3MvZXRjLikgKi9cbiAgcHJvdGVjdGVkIGFic3RyYWN0IHJlbmRlckZvb3Rlcihjb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZDtcblxuICBhc3luYyBvbk9wZW4oKSB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJCaWJsZSB2ZXJzaW9uXCIpO1xuXG4gICAgLy8gSW5zdGFudGlhdGUgdGhlIHJldXNhYmxlIHBpY2tlciBjb21wb25lbnQuXG4gICAgLy8gSXQgaGFuZGxlczpcbiAgICAvLyAgLSBsb2FkaW5nL2NhY2hpbmcgbGFuZ3VhZ2VzLmpzb24sXG4gICAgLy8gIC0gY3JlYXRpbmcgTGFuZ3VhZ2UgKyBWZXJzaW9uIGRyb3Bkb3ducyxcbiAgICAvLyAgLSBhcHBseWluZyBwcm92aWRlZCBkZWZhdWx0cyxcbiAgICAvLyAgLSBjYWxsaW5nIG9uQ2hhbmdlIHdpdGggbGFuZ3VhZ2UsIHZlcnNpb24gKHNob3J0KSwgYW5kIHZlcnNpb25GdWxsLlxuICAgIHRoaXMucGlja2VyID0gbmV3IEJvbGxzUGlja2VyQ29tcG9uZW50KFxuICAgICAge1xuICAgICAgICBhcHA6IHRoaXMuYXBwLCAvLyBzbyBjb21wb25lbnQgY2FuIHBlcnNpc3Qgc2V0dGluZ3MgaWYgaXQgd2FudHNcbiAgICAgICAgc2V0dGluZ3M6IHRoaXMuc2V0dGluZ3MsXG4gICAgICAgIC8vIFlvdSBjYW4gcGFzcyBhIHN0YWxlL2VtcHR5IGFycmF5OyB0aGUgY29tcG9uZW50IHdpbGwgbG9hZC9yZXBsYWNlIGl0LlxuICAgICAgICBsYW5nQmxvY2tzOiB0aGlzLmxhbmdCbG9ja3MsXG4gICAgICAgIC8vIEluaXRpYWwgdmFsdWVzOyB0aGUgY29tcG9uZW50IG1heSBvdmVycmlkZSBiYXNlZCBvbiBkZWZhdWx0cyBvciBhdmFpbGFiaWxpdHkuXG4gICAgICAgIGxhbmd1YWdlS2V5OiB0aGlzLmxhbmd1YWdlS2V5LFxuICAgICAgICB0cmFuc2xhdGlvbkNvZGU6IHRoaXMuc2V0dGluZ3MuYmlibGVEZWZhdWx0VmVyc2lvbixcbiAgICAgICAgdHJhbnNsYXRpb25GdWxsOiB0aGlzLnNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb25GdWxsLFxuICAgICAgICBkZWZhdWx0czogdGhpcy5kZWZhdWx0cyxcbiAgICAgICAgY29udGFpbmVyOiBjb250ZW50RWwsXG4gICAgICAgIHZlcnNpb25zQ29udGFpbmVyOiBjb250ZW50RWwuY3JlYXRlRGl2KCksIC8vIHdpbGwgYmUgcmVwbGFjZWQgYnkgY29tcG9uZW50IGluIGl0cyBjb25zdHJ1Y3RvclxuICAgICAgICBvbkNoYW5nZTogKGxhbmd1YWdlLCB2ZXJzaW9uLCB2ZXJzaW9uRnVsbCkgPT4ge1xuICAgICAgICAgIHRoaXMubGFuZ3VhZ2VLZXkgPSBsYW5ndWFnZTtcbiAgICAgICAgICB0aGlzLnRyYW5zbGF0aW9uQ29kZSA9IHZlcnNpb247XG4gICAgICAgICAgdGhpcy50cmFuc2xhdGlvbkZ1bGwgPSB2ZXJzaW9uRnVsbDtcbiAgICAgICAgICAvLyBLZWVwIGEgbG9jYWwgY29weSBvZiB3aGF0IHRoZSBjb21wb25lbnQgY3VycmVudGx5IGtub3dzIGFib3V0IGJsb2Nrc1xuICAgICAgICAgIHRoaXMubGFuZ0Jsb2NrcyA9IHRoaXMucGlja2VyPy5bXCJvcHRpb25zXCJdPy5sYW5nQmxvY2tzID8/IHRoaXMubGFuZ0Jsb2NrcztcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB0aGlzLnNldHRpbmdzLFxuICAgICAgdGhpcy5kaXNhbGxvd0RlZmF1bHRcbiAgICApO1xuXG4gICAgLy8gRXhwb3NlIHRoZSB2ZXJzaW9ucyBjb250YWluZXIgZm9yIHN1YmNsYXNzZXMgdGhhdCB3YW50IHRvIHJlbmRlciBuZWFyIGl0LlxuICAgIHRoaXMudmVyc2lvbnNDb250YWluZXIgPSB0aGlzLnBpY2tlci52ZXJzaW9uc0NvbnRhaW5lciE7XG5cbiAgICAvLyBBbGxvdyBzdWJjbGFzc2VzIHRvIGFkZCBleHRyYSBjb250cm9sc1xuICAgIHRoaXMucmVuZGVyRXh0cmFPcHRpb25zKGNvbnRlbnRFbCk7XG5cbiAgICAvLyBGb290ZXIvYWN0aW9ucyAoYWJzdHJhY3QpXG4gICAgdGhpcy5yZW5kZXJGb290ZXIoY29udGVudEVsKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBURmlsZSwgVEZvbGRlciwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IGxpc3RNYXJrZG93bkZpbGVzLCB1cHNlcnRCb3R0b21MaW5rcywgdXBzZXJ0VG9wTGlua3NCbG9jayB9IGZyb20gXCIuLi9saWIvbWQtdXRpbHNcIjtcblxuZnVuY3Rpb24gdG9rZW5Gcm9tRmlsZW5hbWUobmFtZTogc3RyaW5nKTogbnVtYmVyIHwgbnVsbCB7XG4gIGNvbnN0IG0gPSBuYW1lLm1hdGNoKC9eKFxcZCspLyk7XG4gIGlmICghbSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBwYXJzZUludChtWzFdLCAxMCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kQWRkTmV4dFByZXZpb3VzKGFwcDogQXBwLCBfc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncywgX3BhcmFtcz86IFJlY29yZDxzdHJpbmcsc3RyaW5nPikge1xuICBjb25zdCBmaWxlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gIGlmICghZmlsZSkgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgZmlyc3QuXCIpOyByZXR1cm47IH1cbiAgY29uc3QgcGFyZW50ID0gZmlsZS5wYXJlbnQ7XG4gIGlmICghKHBhcmVudCBpbnN0YW5jZW9mIFRGb2xkZXIpKSB7IG5ldyBOb3RpY2UoXCJDdXJyZW50IGZpbGUgaGFzIG5vIGZvbGRlci5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IG1kRmlsZXMgPSBsaXN0TWFya2Rvd25GaWxlcyhwYXJlbnQpXG4gICAgLm1hcChmID0+ICh7IGYsIG46IHRva2VuRnJvbUZpbGVuYW1lKGYubmFtZSkgfSkpXG4gICAgLmZpbHRlcih4ID0+IHgubiAhPT0gbnVsbClcbiAgICAuc29ydCgoYSwgYikgPT4gKGEubiEgLSBiLm4hKSlcbiAgICAubWFwKHggPT4geC5mKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1kRmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjdXIgPSBtZEZpbGVzW2ldO1xuICAgIGNvbnN0IHByZXYgPSBtZEZpbGVzW2kgLSAxXTtcbiAgICBjb25zdCBuZXh0ID0gbWRGaWxlc1tpICsgMV07XG5cbiAgICBjb25zdCBwcmV2TmFtZSA9IHByZXYgPyBwcmV2LmJhc2VuYW1lIDogbnVsbDtcbiAgICBjb25zdCBuZXh0TmFtZSA9IG5leHQgPyBuZXh0LmJhc2VuYW1lIDogbnVsbDtcblxuICAgIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmIChwcmV2TmFtZSkgcGFydHMucHVzaChgW1ske3ByZXZOYW1lfXxQcmV2aW91c11dYCk7XG4gICAgaWYgKG5leHROYW1lKSBwYXJ0cy5wdXNoKGBbWyR7bmV4dE5hbWV9fE5leHRdXWApO1xuICAgIGNvbnN0IGxpbmtzTGluZSA9IHBhcnRzLmpvaW4oXCIgfCBcIik7XG5cbiAgICBpZiAoIWxpbmtzTGluZSkgY29udGludWU7XG5cbiAgICBjb25zdCBzcmMgPSBhd2FpdCBhcHAudmF1bHQucmVhZChjdXIpO1xuICAgIGNvbnN0IHdpdGhUb3AgPSB1cHNlcnRUb3BMaW5rc0Jsb2NrKHNyYywgbGlua3NMaW5lKTtcbiAgICBjb25zdCB3aXRoQm90aCA9IHVwc2VydEJvdHRvbUxpbmtzKHdpdGhUb3AsIGxpbmtzTGluZSk7XG4gICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShjdXIsIHdpdGhCb3RoKTtcbiAgfVxuXG4gIG5ldyBOb3RpY2UoXCJJbnNlcnRlZCBOZXh0L1ByZXZpb3VzIGxpbmtzLlwiKTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIFRGaWxlLCBURm9sZGVyLCBOb3RpY2UsIG5vcm1hbGl6ZVBhdGggfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgYXJ0aWNsZVN0eWxlLCBub3dTdGFtcCB9IGZyb20gXCIuLi9saWIvdGV4dC11dGlsc1wiO1xuaW1wb3J0IHsgZ2V0TGVhZkZvbGRlcnNVbmRlciwgbGlzdE1hcmtkb3duRmlsZXMgfSBmcm9tIFwiLi4vbGliL21kLXV0aWxzXCI7XG5cbmNvbnN0IHN0cmlwV2lraWxpbmtzID0gKHM6IHN0cmluZykgPT4gcy5yZXBsYWNlKC9eXFxbXFxbfFxcXVxcXSQvZywgXCJcIik7XG5cbmZ1bmN0aW9uIGZyb250bWF0dGVyQXV0aG9yRnJvbUZpbGUoYXBwOiBBcHAsIGY6IFRGaWxlKTogeyBhdXRob3I/OiBzdHJpbmcgfCBzdHJpbmdbXSwgYm9va190eXBlPzogc3RyaW5nIH0ge1xuICBjb25zdCBjYWNoZSA9IGFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmKTtcbiAgY29uc3QgZm06IGFueSA9IGNhY2hlPy5mcm9udG1hdHRlciA/PyB7fTtcbiAgbGV0IGF1dGhvciA9IGZtLmF1dGhvcjtcbiAgaWYgKHR5cGVvZiBhdXRob3IgPT09IFwic3RyaW5nXCIpIGF1dGhvciA9IGF1dGhvci5yZXBsYWNlKC9eXCJcXHMqLywgXCJcIikucmVwbGFjZSgvXFxzKlwiJC8sIFwiXCIpO1xuICBjb25zdCBib29rX3R5cGUgPSB0eXBlb2YgZm0uYm9va190eXBlID09PSBcInN0cmluZ1wiID8gZm0uYm9va190eXBlLnJlcGxhY2UoL15cIlxccyovLCBcIlwiKS5yZXBsYWNlKC9cXHMqXCIkLywgXCJcIikgOiB1bmRlZmluZWQ7XG4gIHJldHVybiB7IGF1dGhvciwgYm9va190eXBlIH07XG59XG5cbmZ1bmN0aW9uIGZvcm1hdEF1dGhvckZpZWxkKGF1dGhvcjogc3RyaW5nIHwgc3RyaW5nW10gfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBpZiAoIWF1dGhvcikgcmV0dXJuICdcIltbVW5rbm93biBBdXRob3JdXVwiJztcbiAgaWYgKEFycmF5LmlzQXJyYXkoYXV0aG9yKSkge1xuICAgIHJldHVybiBcIlxcbiAgLSBcIiArIGF1dGhvclxuICAgICAgLm1hcChhID0+IGEucmVwbGFjZSgvXlxcW1xcW3xcXF1cXF0kL2csIFwiXCIpKVxuICAgICAgLm1hcChhID0+IGBbWyR7YX1dXWApXG4gICAgICAuam9pbihcIlxcbiAgLSBcIik7XG4gIH1cbiAgY29uc3QgY2xlYW4gPSBhdXRob3IucmVwbGFjZSgvXlxcW1xcW3xcXF1cXF0kL2csIFwiXCIpO1xuICByZXR1cm4gYCBcIltbJHtjbGVhbn1dXVwiYDtcbn1cblxuLyoqIENvcmU6IGNyZWF0ZS91cGRhdGUgdGhlIGluZGV4IGZpbGUgZm9yIGEgc2luZ2xlIGZvbGRlci4gUmV0dXJucyB0cnVlIGlmIGNyZWF0ZWQvdXBkYXRlZCwgZmFsc2UgaWYgc2tpcHBlZC4gKi9cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZU9yVXBkYXRlSW5kZXhGb3JGb2xkZXIoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MsIGZvbGRlcjogVEZvbGRlciwgaXNCb29rOiBib29sZWFuKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGNvbnN0IGZpbGVzID0gbGlzdE1hcmtkb3duRmlsZXMoZm9sZGVyKTtcbiAgaWYgKCFmaWxlcy5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAvLyBUcnkgdG8gcGljayBhdXRob3IvYm9va190eXBlIGZyb20gdGhlIGZpcnN0IGZpbGUgdGhhdCBoYXMgaXRcbiAgbGV0IGF1dGhvcjogc3RyaW5nIHwgc3RyaW5nW10gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIGxldCBib29rVHlwZTogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBmb3IgKGNvbnN0IGYgb2YgZmlsZXMpIHtcbiAgICBjb25zdCBtZXRhID0gZnJvbnRtYXR0ZXJBdXRob3JGcm9tRmlsZShhcHAsIGYpO1xuICAgIGlmIChtZXRhLmF1dGhvcikgeyBhdXRob3IgPSBtZXRhLmF1dGhvcjsgYm9va1R5cGUgPSBtZXRhLmJvb2tfdHlwZTsgYnJlYWs7IH1cbiAgfVxuXG4gIGNvbnN0IGZvbGRlck5hbWUgPSBmb2xkZXIubmFtZTtcbiAgY29uc3QgaWR4TmFtZSA9IHNldHRpbmdzLmluZGV4RmlsZU5hbWVNb2RlID09PSBcImFydGljbGUtc3R5bGVcIiA/IGFydGljbGVTdHlsZShmb2xkZXJOYW1lKSA6IGZvbGRlck5hbWU7XG4gIGNvbnN0IGluZGV4UGF0aCA9IG5vcm1hbGl6ZVBhdGgoZm9sZGVyLnBhdGggKyBcIi9cIiArIGlkeE5hbWUgKyBcIi5tZFwiKTtcbiAgY29uc3QgY3JlYXRlZCA9IG5vd1N0YW1wKCk7XG5cbiAgdmFyIHByb3BzOiBzdHJpbmc7XG4gIGlmIChpc0Jvb2spIHtcbiAgICBwcm9wcyA9IFtcbiAgICAgIGB0aXRsZTogJHtpZHhOYW1lfWAsXG4gICAgICBgY3JlYXRlZDogJHtjcmVhdGVkfWAsXG4gICAgICBgbW9kaWZpZWQ6ICR7Y3JlYXRlZH1gLFxuICAgICAgYGJvb2tfdGl0bGU6IFwiW1ske2ZvbGRlck5hbWV9XV1cImAsXG4gICAgICAuLi4oYm9va1R5cGUgPyBbYGJvb2tfdHlwZTogXCJbWyR7c3RyaXBXaWtpbGlua3MoYm9va1R5cGUpfV1dXCJgXSA6IFtdKSxcbiAgICAgIGB0eXBlOiBcIltbQm9va11dXCJgLFxuICAgICAgYGF1dGhvcjogJHtmb3JtYXRBdXRob3JGaWVsZChhdXRob3IpfWBcbiAgICBdLmpvaW4oXCJcXG5cIik7XG4gIH0gZWxzZSB7XG4gICAgcHJvcHMgPSBbXG4gICAgICBgdGl0bGU6ICR7aWR4TmFtZX1gLFxuICAgICAgYGNyZWF0ZWQ6ICR7Y3JlYXRlZH1gLFxuICAgICAgYG1vZGlmaWVkOiAke2NyZWF0ZWR9YCxcbiAgICAgIGB0b3BpY3M6IFwiW1ske3N0cmlwV2lraWxpbmtzKGZvbGRlck5hbWUpfV1dXCJgXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgY29uc3QgZGF0YXZpZXcgPSBbXG4gICAgXCJgYGBkYXRhdmlld1wiLFxuICAgIFwiVEFCTEVcIixcbiAgICAnZnJvbSBcIlwiJyxcbiAgICBcIndoZXJlIGNvbnRhaW5zKGZpbGUuZm9sZGVyLCB0aGlzLmZpbGUuZm9sZGVyKSBhbmQgZmlsZS5uYW1lICE9IHRoaXMuZmlsZS5uYW1lXCIsXG4gICAgXCJTT1JUIG51bWJlcihmaWxlLm5hbWUpIEFTQ1wiLFxuICAgIFwiYGBgXCIsXG4gICAgXCJcIlxuICBdLmpvaW4oXCJcXG5cIik7XG5cbiAgY29uc3QgaGVhZGVyID0gYC0tLVxcbiR7cHJvcHN9XFxuLS0tXFxuXFxuIyAke2lkeE5hbWV9XFxuYDtcbiAgY29uc3QgY29udGVudCA9IGhlYWRlciArIGRhdGF2aWV3O1xuXG4gIGNvbnN0IGV4aXN0aW5nID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChpbmRleFBhdGgpO1xuICBpZiAoZXhpc3RpbmcgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgIGNvbnN0IGN1ciA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGV4aXN0aW5nKTtcbiAgICBpZiAoL2BgYGRhdGF2aWV3Ly50ZXN0KGN1cikpIHJldHVybiBmYWxzZTsgLy8gYWxyZWFkeSBoYXMgYSBkYXRhdmlldyBibG9jayBcdTIwMTQgc2tpcFxuXG4gICAgLy8gSW5zZXJ0IGRhdGF2aWV3IHJpZ2h0IGFmdGVyIGZyb250bWF0dGVyIGlmIHByZXNlbnRcbiAgICBjb25zdCBwYXJ0cyA9IGN1ci5zcGxpdChcIi0tLVwiKTtcbiAgICBpZiAocGFydHMubGVuZ3RoID49IDMpIHtcbiAgICAgIGNvbnN0IG1lcmdlZCA9IHBhcnRzWzBdICsgXCItLS1cIiArIHBhcnRzWzFdICsgXCItLS1cXG5cIiArIGRhdGF2aWV3ICsgcGFydHMuc2xpY2UoMikuam9pbihcIi0tLVwiKTtcbiAgICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZXhpc3RpbmcsIG1lcmdlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZXhpc3RpbmcsIGN1ciArIFwiXFxuXCIgKyBkYXRhdmlldyk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIGF3YWl0IGFwcC52YXVsdC5jcmVhdGUoaW5kZXhQYXRoLCBjb250ZW50KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuXG4vKiogRXhpc3RpbmcgY29tbWFuZDogYWRkIGluZGV4ZXMgZm9yIGFsbCBsZWFmIGZvbGRlcnMgdW5kZXIgYSBiYXNlIGZvbGRlciAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbW1hbmRBZGRGb2xkZXJJbmRleChhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncywgcGFyYW1zPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPikge1xuICBjb25zdCBiYXNlRm9sZGVyID0gcGFyYW1zPy5mb2xkZXIgPz8gc2V0dGluZ3MuYmFzZUZvbGRlcjtcbiAgY29uc3QgZm9sZGVycyA9IGdldExlYWZGb2xkZXJzVW5kZXIoYXBwLCBiYXNlRm9sZGVyKTtcbiAgaWYgKCFmb2xkZXJzLmxlbmd0aCkgeyBuZXcgTm90aWNlKGBObyBsZWFmIGZvbGRlcnMgdW5kZXIgJHtiYXNlRm9sZGVyfWApOyByZXR1cm47IH1cblxuICBsZXQgY2hhbmdlZCA9IDA7XG4gIGZvciAoY29uc3QgZm9sZGVyIG9mIGZvbGRlcnMpIHtcbiAgICBjb25zdCBkaWQgPSBhd2FpdCBjcmVhdGVPclVwZGF0ZUluZGV4Rm9yRm9sZGVyKGFwcCwgc2V0dGluZ3MsIGZvbGRlciwgdHJ1ZSk7XG4gICAgaWYgKGRpZCkgY2hhbmdlZCsrO1xuICB9XG5cbiAgbmV3IE5vdGljZShjaGFuZ2VkID4gMCA/IGBGb2xkZXIgaW5kZXhlcyBjcmVhdGVkL3VwZGF0ZWQ6ICR7Y2hhbmdlZH1gIDogXCJObyBjaGFuZ2VzOyBpbmRleGVzIGFscmVhZHkgcHJlc2VudC5cIik7XG59XG5cbi8qKiBORVcgY29tbWFuZDogYWRkL3VwZGF0ZSBpbmRleCBPTkxZIGZvciB0aGUgZm9sZGVyIG9mIHRoZSBjdXJyZW50IGZpbGUgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kQWRkSW5kZXhGb3JDdXJyZW50Rm9sZGVyKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IGFjdGl2ZSA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICBjb25zdCBmb2xkZXIgPSBhY3RpdmU/LnBhcmVudDtcbiAgaWYgKCFhY3RpdmUgfHwgIWZvbGRlcikgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgaW5zaWRlIHRoZSB0YXJnZXQgZm9sZGVyLlwiKTsgcmV0dXJuOyB9XG5cbiAgY29uc3QgZGlkID0gYXdhaXQgY3JlYXRlT3JVcGRhdGVJbmRleEZvckZvbGRlcihhcHAsIHNldHRpbmdzLCBmb2xkZXIsIGZhbHNlKTtcbiAgbmV3IE5vdGljZShkaWQgPyBgSW5kZXggY3JlYXRlZC91cGRhdGVkIGZvciBcdTIwMUMke2ZvbGRlci5uYW1lfVx1MjAxRC5gIDogYE5vIGluZGV4IGNoYW5nZSBpbiBcdTIwMUMke2ZvbGRlci5uYW1lfVx1MjAxRC5gKTtcbn0iLCAiZXhwb3J0IGZ1bmN0aW9uIGFydGljbGVTdHlsZShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAobmFtZS5lbmRzV2l0aChcIiwgVGhlXCIpKSByZXR1cm4gYFRoZSAke25hbWUuc2xpY2UoMCwgLTUpfWA7XG4gIGlmIChuYW1lLmVuZHNXaXRoKFwiLCBBXCIpKSAgIHJldHVybiBgQSAke25hbWUuc2xpY2UoMCwgLTMpfWA7XG4gIHJldHVybiBuYW1lO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm93U3RhbXAoKTogc3RyaW5nIHtcbiAgY29uc3QgZCA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IHdlZWtkYXkgPSBkLnRvTG9jYWxlRGF0ZVN0cmluZyh1bmRlZmluZWQsIHsgd2Vla2RheTogXCJzaG9ydFwiIH0pO1xuICBjb25zdCBkYXkgPSBTdHJpbmcoZC5nZXREYXRlKCkpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgY29uc3QgbW9udGggPSBkLnRvTG9jYWxlRGF0ZVN0cmluZyh1bmRlZmluZWQsIHsgbW9udGg6IFwibG9uZ1wiIH0pO1xuICBjb25zdCB5ZWFyID0gZC5nZXRGdWxsWWVhcigpO1xuICBjb25zdCB0aW1lID0gZC50b0xvY2FsZVRpbWVTdHJpbmcodW5kZWZpbmVkLCB7IGhvdXIxMjogZmFsc2UgfSk7XG4gIHJldHVybiBgJHt3ZWVrZGF5fSwgJHtkYXl9LiAke21vbnRofSAke3llYXJ9LCAke3RpbWV9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuc3VyZU5ld2xpbmUoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHMuZW5kc1dpdGgoXCJcXG5cIikgPyBzIDogcyArIFwiXFxuXCI7XG59XG4iLCAiaW1wb3J0IHR5cGUgT2JzaWRpYW5CaWJsZVRvb2xzIGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB7IGNvbW1hbmRWZXJzZUxpbmtzIH0gZnJvbSBcIi4vY29tbWFuZHMvdmVyc2UtbGlua3NcIjtcbmltcG9ydCB7IGNvbW1hbmRBZGROZXh0UHJldmlvdXMgfSBmcm9tIFwiLi9jb21tYW5kcy9hZGQtbmV4dC1wcmV2aW91c1wiO1xuaW1wb3J0IHsgY29tbWFuZEFkZEZvbGRlckluZGV4IH0gZnJvbSBcIi4vY29tbWFuZHMvYWRkLWZvbGRlci1pbmRleFwiO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJQcm90b2NvbChwbHVnaW46IE9ic2lkaWFuQmlibGVUb29scykge1xuICBwbHVnaW4ucmVnaXN0ZXJPYnNpZGlhblByb3RvY29sSGFuZGxlcihcIm9ic2lkaWFuLWJpYmxlLXRvb2xzXCIsIGFzeW5jIChwYXJhbXMpID0+IHtcbiAgICBjb25zdCBhY3Rpb24gPSBwYXJhbXMuYWN0aW9uID8/IFwiXCI7XG4gICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgIGNhc2UgXCJsaW5rLXZlcnNlc1wiOlxuICAgICAgICBhd2FpdCBjb21tYW5kVmVyc2VMaW5rcyhwbHVnaW4uYXBwLCBwbHVnaW4uc2V0dGluZ3MsIHBhcmFtcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFkZC1uZXh0LXByZXZpb3VzXCI6XG4gICAgICAgIGF3YWl0IGNvbW1hbmRBZGROZXh0UHJldmlvdXMocGx1Z2luLmFwcCwgcGx1Z2luLnNldHRpbmdzLCBwYXJhbXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJhZGQtZm9sZGVyLWluZGV4XCI6XG4gICAgICAgIGF3YWl0IGNvbW1hbmRBZGRGb2xkZXJJbmRleChwbHVnaW4uYXBwLCBwbHVnaW4uc2V0dGluZ3MsIHBhcmFtcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9KTtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IGFkZEljb24gYXMgQWRkSWNvbkZuIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmNvbnN0IElDT05TOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICBcIm9idGItYm9va1wiOiBgPHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiPjxwYXRoIGQ9XCJNNiA0aDEwYTIgMiAwIDAgMSAyIDJ2MTIuNWExLjUgMS41IDAgMCAwLTEuNS0xLjVINmEyIDIgMCAwIDAgMCA0aDEwXCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiLz48L3N2Zz5gLFxuICBcIm9idGItbGlua3NcIjogYDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj48cGF0aCBkPVwiTTEwIDEzYTUgNSAwIDAgMSAwLTdsMS0xYTUgNSAwIDAgMSA3IDdsLTEgMU0xNCAxMWE1IDUgMCAwIDEgMCA3bC0xIDFhNSA1IDAgMCAxLTctN2wxLTFcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIvPjwvc3ZnPmAsXG4gIFwib2J0Yi1oaWdobGlnaHRlclwiOiBgPHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+PHBhdGggZD1cIk0zIDE2bDYtNiA1IDUtNiA2SDN6XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiLz48cGF0aCBkPVwiTTEyIDlsMy0zIDMgMy0zIDN6XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiLz48L3N2Zz5gLFxuICBcIm9idGItc3VtbWFyeVwiOiBgPHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+PHBhdGggZD1cIk01IDVoMTRNNSA5aDEwTTUgMTNoOE01IDE3aDZcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIGZpbGw9XCJub25lXCIvPjwvc3ZnPmAsXG4gIFwib2J0Yi1vdXRsaW5lXCI6IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj48cGF0aCBkPVwiTTcgNmgxME03IDEyaDEwTTcgMThoNlwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgZmlsbD1cIm5vbmVcIi8+PC9zdmc+YCxcbiAgXCJvYnRiLWZvcm1hdHRlclwiOiBgPHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+PHBhdGggZD1cIk01IDdoNk01IDEyaDEwTTUgMTdoOFwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgZmlsbD1cIm5vbmVcIi8+PC9zdmc+YCxcbiAgXCJvYnRiLWJpYmxlXCI6IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIj48cGF0aCBkPVwiTTYuNSA0aDlBMi41IDIuNSAwIDAgMSAxOCA2LjVWMjBIOC41QTIuNSAyLjUgMCAwIDEgNiAxNy41VjQuNVwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiLz48cGF0aCBkPVwiTTEwIDhoNk0xMCAxMWg2XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiLz48L3N2Zz5gXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJJY29ucyhhZGRJY29uOiB0eXBlb2YgQWRkSWNvbkZuKSB7XG4gIGZvciAoY29uc3QgW25hbWUsIHN2Z10gb2YgT2JqZWN0LmVudHJpZXMoSUNPTlMpKSBhZGRJY29uKG5hbWUsIHN2Zyk7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFRGb2xkZXIgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgbGlzdE1hcmtkb3duRmlsZXMgfSBmcm9tIFwiLi4vbGliL21kLXV0aWxzXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kRXh0cmFjdEhpZ2hsaWdodHNGb2xkZXIoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MpIHtcbiAgY29uc3QgdmlldyA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICBjb25zdCBzdGFydEZvbGRlciA9IHZpZXc/LnBhcmVudCA/PyBhcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKHNldHRpbmdzLmJhc2VGb2xkZXIpO1xuICBpZiAoIShzdGFydEZvbGRlciBpbnN0YW5jZW9mIFRGb2xkZXIpKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBpbiB0aGUgdGFyZ2V0IGZvbGRlciBvciBzZXQgYSB2YWxpZCBiYXNlIGZvbGRlci5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IGFsbDogc3RyaW5nW10gPSBbXTtcbiAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCBtYXJrUmVnZXggPSBuZXcgUmVnRXhwKGA8bWFya1xcXFxzK3N0eWxlPVtcIiddJHtzZXR0aW5ncy5yZWRNYXJrQ3NzLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXFxcXVxcXFxcXFxcXS9nLCBcIlxcXFwkJlwiKX1bXCInXT4oLio/KTwvbWFyaz5gLCBcImdcIik7XG5cbiAgY29uc3QgZmlsZXMgPSBsaXN0TWFya2Rvd25GaWxlcyhzdGFydEZvbGRlcikuc29ydCgoYSxiKSA9PiB7XG4gICAgY29uc3QgYW4gPSBhLmJhc2VuYW1lLm1hdGNoKC9eXFxkKy8pPy5bMF07IGNvbnN0IGJuID0gYi5iYXNlbmFtZS5tYXRjaCgvXlxcZCsvKT8uWzBdO1xuICAgIGlmIChhbiAmJiBibikgcmV0dXJuIE51bWJlcihhbikgLSBOdW1iZXIoYm4pO1xuICAgIGlmIChhbikgcmV0dXJuIC0xO1xuICAgIGlmIChibikgcmV0dXJuIDE7XG4gICAgcmV0dXJuIGEuYmFzZW5hbWUubG9jYWxlQ29tcGFyZShiLmJhc2VuYW1lKTtcbiAgfSk7XG5cbiAgZm9yIChjb25zdCBmIG9mIGZpbGVzKSB7XG4gICAgY29uc3Qgc3JjID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZik7XG4gICAgY29uc3QgbG9jYWw6IHN0cmluZ1tdID0gW107XG4gICAgbGV0IG06IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGw7XG4gICAgbWFya1JlZ2V4Lmxhc3RJbmRleCA9IDA7XG4gICAgd2hpbGUgKChtID0gbWFya1JlZ2V4LmV4ZWMoc3JjKSkgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBtWzFdLnRyaW0oKTtcbiAgICAgIGlmICghdGV4dCkgY29udGludWU7XG4gICAgICBpZiAoIXNlZW4uaGFzKHRleHQpKSB7IHNlZW4uYWRkKHRleHQpOyBpZiAoIWxvY2FsLmluY2x1ZGVzKHRleHQpKSBsb2NhbC5wdXNoKHRleHQpOyB9XG4gICAgfVxuICAgIGlmIChsb2NhbC5sZW5ndGgpIHtcbiAgICAgIGFsbC5wdXNoKGBcXG4jIyMjIFtbJHtmLmJhc2VuYW1lfV1dXFxuYCArIGxvY2FsLm1hcCh0ID0+IGAtICR7dH1gKS5qb2luKFwiXFxuXCIpKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWFsbC5sZW5ndGgpIHsgbmV3IE5vdGljZShcIk5vIGhpZ2hsaWdodHMgZm91bmQgaW4gZm9sZGVyLlwiKTsgcmV0dXJuOyB9XG5cbiAgY29uc3Qgb3V0ID0gYWxsLmpvaW4oXCJcXG5cIik7XG4gIGNvbnN0IHRhcmdldCA9IHN0YXJ0Rm9sZGVyLnBhdGggKyBcIi9IaWdobGlnaHRzLm1kXCI7XG4gIGNvbnN0IGV4aXN0aW5nID0gYXBwLnZhdWx0LmdldEZpbGVCeVBhdGgodGFyZ2V0KTtcbiAgaWYgKGV4aXN0aW5nKSBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGV4aXN0aW5nLCBvdXQpO1xuICBlbHNlIGF3YWl0IGFwcC52YXVsdC5jcmVhdGUodGFyZ2V0LCBvdXQpO1xuICBuZXcgTm90aWNlKFwiSGlnaGxpZ2h0cy5tZCBjcmVhdGVkLlwiKTtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBpbnNlcnRBZnRlcllhbWxPckgxIH0gZnJvbSBcIi4uL2xpYi9tZC11dGlsc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZEV4dHJhY3RSZWRIaWdobGlnaHRzKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgaWYgKCFmaWxlKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7IHJldHVybjsgfVxuICBjb25zdCBzcmMgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcblxuICBjb25zdCBtYXJrUmVnZXggPSBuZXcgUmVnRXhwKGA8bWFya1xcXFxzK3N0eWxlPVtcIiddJHtzZXR0aW5ncy5yZWRNYXJrQ3NzLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXFxcXVxcXFxcXFxcXS9nLCBcIlxcXFwkJlwiKX1bXCInXT4oLio/KTwvbWFyaz5gLCBcImdcIik7XG4gIGNvbnN0IGhpdHM6IHN0cmluZ1tdID0gW107XG4gIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICB3aGlsZSAoKG0gPSBtYXJrUmVnZXguZXhlYyhzcmMpKSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHRleHQgPSBtWzFdLnRyaW0oKTtcbiAgICBpZiAodGV4dCAmJiAhaGl0cy5pbmNsdWRlcyh0ZXh0KSkgaGl0cy5wdXNoKHRleHQpO1xuICB9XG5cbiAgaWYgKCFoaXRzLmxlbmd0aCkgeyBuZXcgTm90aWNlKFwiTm8gcmVkIGhpZ2hsaWdodHMgZm91bmQuXCIpOyByZXR1cm47IH1cblxuICBjb25zdCBzZWN0aW9uID0gW1xuICAgIFwiPiBbIXN1bW1hcnldLSBIaWdobGlnaHRzXCIsXG4gICAgLi4uaGl0cy5tYXAoaCA9PiBgPiAtICR7aH1gKSxcbiAgICBcIlwiXG4gIF0uam9pbihcIlxcblwiKTtcblxuICBjb25zdCBtZXJnZWQgPSBpbnNlcnRBZnRlcllhbWxPckgxKHNyYywgc2VjdGlvbik7XG4gIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgbWVyZ2VkKTtcbiAgbmV3IE5vdGljZShcIkhpZ2hsaWdodHMgc2VjdGlvbiBpbnNlcnRlZC5cIik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZE91dGxpbmVFeHRyYWN0b3IoYXBwOiBBcHAsIF9zZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgaWYgKCFmaWxlKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IG9yaWdpbmFsID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIGNvbnN0IGxpbmVzID0gb3JpZ2luYWwuc3BsaXQoL1xccj9cXG4vKTtcblxuICBjb25zdCBvdXRsaW5lTGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgLy8gRVhBQ1QgcmVnZXggYXMgUHl0aG9uOiBvbmUgc3BhY2UgYWZ0ZXIgdGhlIGhhc2hlc1xuICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICBjb25zdCBtID0gbGluZS5tYXRjaCgvXigjezIsNn0pICguKykvKTtcbiAgICBpZiAobSkge1xuICAgICAgY29uc3QgaGFzaGVzID0gbVsxXTtcbiAgICAgIGxldCBjb250ZW50ID0gbVsyXTtcbiAgICAgIGNvbnN0IGxldmVsID0gaGFzaGVzLmxlbmd0aCAtIDI7IC8vICMjIC0+IDAsICMjIyAtPiAxLCBldGMuXG4gICAgICBjb25zdCBpbmRlbnQgPSBcIlxcdFwiLnJlcGVhdChNYXRoLm1heCgwLCBsZXZlbCAtIDEpKTtcbiAgICAgIGlmIChsZXZlbCA9PT0gMCkgY29udGVudCA9IGAqKiR7Y29udGVudH0qKmA7XG4gICAgICBvdXRsaW5lTGluZXMucHVzaChgJHtpbmRlbnR9JHtjb250ZW50fWApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChvdXRsaW5lTGluZXMubGVuZ3RoID09PSAwKSB7XG4gICAgbmV3IE5vdGljZShcIk5vIGhlYWRpbmdzICgjIy4uIyMjIyMjKSBmb3VuZC5cIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gQ2hlY2sgbGFzdCA0IGxpbmVzIGZvciBcInxOZXh0XV1cIiBvciBcInxQcmV2aW91c11dXCJcbiAgbGV0IGluc2VydEluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgY29uc3QgbG9va2JhY2sgPSBNYXRoLm1pbig0LCBsaW5lcy5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMTsgaSA8PSBsb29rYmFjazsgaSsrKSB7XG4gICAgY29uc3QgbG4gPSBsaW5lc1tsaW5lcy5sZW5ndGggLSBpXTtcbiAgICBpZiAoL1xcfE5leHRcXF1cXF18XFx8UHJldmlvdXNcXF1cXF0vLnRlc3QobG4pKSB7XG4gICAgICBpbnNlcnRJbmRleCA9IGxpbmVzLmxlbmd0aCAtIGk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBjb25zdCBvdXRsaW5lVGV4dCA9IFwiIyMgT3V0bGluZVxcblwiICsgb3V0bGluZUxpbmVzLmpvaW4oXCJcXG5cIikgKyBcIlxcblxcblwiO1xuXG4gIGlmIChpbnNlcnRJbmRleCAhPT0gbnVsbCkge1xuICAgIC8vIEluc2VydCBiZWZvcmUgdGhlIGZvdW5kIGxpbmUsIHByZXNlcnZpbmcgc3Vycm91bmRpbmcgbmV3bGluZXNcbiAgICBjb25zdCBiZWZvcmVTdHIgPSBsaW5lcy5zbGljZSgwLCBpbnNlcnRJbmRleCkuam9pbihcIlxcblwiKTtcbiAgICBjb25zdCBhZnRlclN0ciA9IGxpbmVzLnNsaWNlKGluc2VydEluZGV4KS5qb2luKFwiXFxuXCIpO1xuICAgIGNvbnN0IG5ld0NvbnRlbnQgPVxuICAgICAgKGJlZm9yZVN0ci5lbmRzV2l0aChcIlxcblwiKSB8fCBiZWZvcmVTdHIubGVuZ3RoID09PSAwID8gXCJcIiA6IFwiXFxuXCIpICtcbiAgICAgIG91dGxpbmVUZXh0ICtcbiAgICAgIGFmdGVyU3RyO1xuICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgYmVmb3JlU3RyICsgbmV3Q29udGVudCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gQXBwZW5kIHRvIGVuZCAobGlrZSBQeXRob24gJ2EnIG1vZGUpXG4gICAgY29uc3QgbmV3Q29udGVudCA9IG9yaWdpbmFsICsgKG9yaWdpbmFsLmVuZHNXaXRoKFwiXFxuXCIpID8gXCJcIiA6IFwiXFxuXCIpICsgb3V0bGluZVRleHQ7XG4gICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBuZXdDb250ZW50KTtcbiAgfVxuXG4gIG5ldyBOb3RpY2UoXCJPdXRsaW5lIGFwcGVuZGVkIHN1Y2Nlc3NmdWxseS5cIik7XG59IiwgImltcG9ydCB7IEFwcCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IGZvcm1hdE91dGxpbmVUZXh0IH0gZnJvbSBcIi4uL2xpYi9vdXRsaW5lLXV0aWxzXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kT3V0bGluZUZvcm1hdHRlcihhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuICBjb25zdCBmaWxlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gIGlmICghZmlsZSkgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgZmlyc3QuXCIpOyByZXR1cm47IH1cblxuICBjb25zdCBzcmMgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcblxuICBjb25zdCBvdXQgPSBhd2FpdCBmb3JtYXRPdXRsaW5lVGV4dChzcmMsIHtcbiAgICBzcGxpdElubGluZVN1YnBvaW50czogdHJ1ZSwgICAvLyBzcGxpdHMgXCIuLi4gdi4gOTogYS4gLi4uIGIuIC4uLlwiLCBidXQgTk9UIG9uIFwiLlwiXG4gICAgZml4SHlwaGVuYXRlZEJyZWFrczogdHJ1ZSwgICAgLy8gZml4ZXMgXCJpbGx1cy0gdHJhdGVkXCIgXHUyMTkyIFwiaWxsdXN0cmF0ZWRcIlxuICAgIGRyb3BQdXJlUGFnZU51bWJlckxpbmVzOiB0cnVlIC8vIG9wdGlvbmFsOiBkcm9wcyBcIjE0XCIsIFwiMTVcIiwgXCIxNlwiXG4gIH0sIHNldHRpbmdzKTtcblxuICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGZpbGUsIG91dCk7XG4gIG5ldyBOb3RpY2UoXCJPdXRsaW5lIGZvcm1hdHRlZC5cIik7XG59IiwgImltcG9ydCB7IE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgbGlua1ZlcnNlc0luVGV4dCB9IGZyb20gXCJzcmMvY29tbWFuZHMvdmVyc2UtbGlua3NcIjtcbmltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCJzcmMvc2V0dGluZ3NcIjtcblxuZXhwb3J0IGludGVyZmFjZSBPdXRsaW5lRm9ybWF0T3B0aW9ucyB7XG4gIHNwbGl0SW5saW5lU3VicG9pbnRzPzogYm9vbGVhbjsgICAgICAgLy8gZGVmYXVsdDogdHJ1ZVxuICBmaXhIeXBoZW5hdGVkQnJlYWtzPzogYm9vbGVhbjsgICAgICAgIC8vIGRlZmF1bHQ6IHRydWVcbiAgZHJvcFB1cmVQYWdlTnVtYmVyTGluZXM/OiBib29sZWFuOyAgICAvLyBkZWZhdWx0OiBmYWxzZVxuICBvdXRwdXRMaW5lU2VwYXJhdG9yPzogc3RyaW5nOyAgICAgICAgIC8vIGRlZmF1bHQ6IFwiXFxuXCJcbn1cblxuLyoqIC0tLS0tIEhlbHBlcnMgKGRlbGltaXRlci1hd2FyZSArIFB5dGhvbiBwYXJpdHkpIC0tLS0tICovXG5cbmZ1bmN0aW9uIHJvbWFuVG9JbnQocm9tYW46IHN0cmluZyk6IG51bWJlciB7XG4gIGNvbnN0IG1hcDogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHsgSToxLCBWOjUsIFg6MTAsIEw6NTAsIEM6MTAwLCBEOjUwMCwgTToxMDAwIH07XG4gIGxldCByZXN1bHQgPSAwLCBwcmV2ID0gMDtcbiAgZm9yIChsZXQgaSA9IHJvbWFuLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgY29uc3QgdmFsID0gbWFwW3JvbWFuW2ldXTtcbiAgICBpZiAoIXZhbCkgcmV0dXJuIE5hTjtcbiAgICByZXN1bHQgKz0gdmFsIDwgcHJldiA/IC12YWwgOiB2YWw7XG4gICAgcHJldiA9IHZhbDtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuY29uc3QgaXNSb21hbiA9IChzOiBzdHJpbmcpID0+IC9eW0lWWExDRE1dKyQvLnRlc3Qocyk7XG5jb25zdCBpc0FscGhhVXBwZXIgPSAoczogc3RyaW5nKSA9PiAvXltBLVpdJC8udGVzdChzKTtcblxuZnVuY3Rpb24gZ2V0TWRQcmVmaXhGcm9tTGV2ZWwobGV2ZWw6IG51bWJlciB8IFwiYnVsbGV0XCIpOiBzdHJpbmcge1xuICBzd2l0Y2ggKGxldmVsKSB7XG4gICAgY2FzZSAyOiByZXR1cm4gXCIjI1wiOyAgICAgIC8vIFJvbWFuXG4gICAgY2FzZSAzOiByZXR1cm4gXCIjIyNcIjsgICAgIC8vIEEuXG4gICAgY2FzZSA0OiByZXR1cm4gXCIjIyMjXCI7ICAgIC8vIDEuXG4gICAgY2FzZSA1OiByZXR1cm4gXCIjIyMjI1wiOyAgIC8vIGEuXG4gICAgY2FzZSA2OiByZXR1cm4gXCIjIyMjIyNcIjsgIC8vICgxKSBvciAxKVxuICAgIGRlZmF1bHQ6IHJldHVybiBcIiMjIyMjI1wiOyAvLyBidWxsZXQgZmFsbGJhY2tcbiAgfVxufVxuXG4vKiogVG9rZW5pemUgYSBoZWFkaW5nIG1hcmtlciBhbmQgaXRzIHJlc3QuIENhcHR1cmVzIGRlbGltaXRlcjogXCIuXCIsIFwiKVwiLCBvciBcIi4pXCIgKi9cbmZ1bmN0aW9uIHBhcnNlSGVhZGluZ1N0YXJ0KHM6IHN0cmluZyk6IHsgdG9rZW46IHN0cmluZzsgbGFiZWw6IHN0cmluZzsgcmVzdDogc3RyaW5nOyBkZWxpbTogc3RyaW5nIHwgbnVsbCB9IHwgbnVsbCB7XG4gIGNvbnN0IG0gPVxuICAgIHMubWF0Y2goL15cXHMqKD88cm9tYW4+W0lWWExDRE1dKykoPzxkZWxpbT5cXC5cXCl8Wy4pXSlcXHMrKD88cmVzdD4uKykkLykgfHxcbiAgICBzLm1hdGNoKC9eXFxzKig/PHVwcGVyPltBLVpdKSg/PGRlbGltPlxcLlxcKXxbLildKVxccysoPzxyZXN0Pi4rKSQvKSAgICAgIHx8XG4gICAgcy5tYXRjaCgvXlxccyooPzxudW0+XFxkKykoPzxkZWxpbT5cXC5cXCl8Wy4pXSlcXHMrKD88cmVzdD4uKykkLykgICAgICAgICAgfHxcbiAgICBzLm1hdGNoKC9eXFxzKlxcKFxccyooPzxwbnVtPlxcZCspXFxzKlxcKVxccysoPzxyZXN0Pi4rKSQvKSAgICAgICAgICAgICAgICAgIHx8XG4gICAgcy5tYXRjaCgvXlxccypcXChcXHMqKD88cGxvdz5bYS16XSlcXHMqXFwpXFxzKyg/PHJlc3Q+LispJC8pICAgICAgICAgICAgICAgIHx8XG4gICAgcy5tYXRjaCgvXlxccyooPzxsb3c+W2Etel0pKD88ZGVsaW0+XFwuXFwpfFsuKV0pXFxzKyg/PHJlc3Q+LispJC8pO1xuXG4gIGlmICghbSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGcgPSAobSBhcyBhbnkpLmdyb3VwcyB8fCB7fTtcbiAgbGV0IGxhYmVsID0gXCJcIjtcbiAgbGV0IGRlbGltOiBzdHJpbmcgfCBudWxsID0gZy5kZWxpbSA/PyBudWxsO1xuXG4gIGlmIChnLnJvbWFuKSBsYWJlbCA9IGcucm9tYW47XG4gIGVsc2UgaWYgKGcudXBwZXIpIGxhYmVsID0gZy51cHBlcjtcbiAgZWxzZSBpZiAoZy5udW0pIGxhYmVsID0gZy5udW07XG4gIGVsc2UgaWYgKGcucG51bSkgeyBsYWJlbCA9IGAoJHtnLnBudW19KWA7IGRlbGltID0gXCIpXCI7IH1cbiAgZWxzZSBpZiAoZy5wbG93KSB7IGxhYmVsID0gYCgke2cucGxvd30pYDsgZGVsaW0gPSBcIilcIjsgfVxuICBlbHNlIGlmIChnLmxvdykgbGFiZWwgPSBnLmxvdztcblxuICBsZXQgdG9rZW4gPSBcIlwiO1xuICBpZiAoZy5yb21hbikgdG9rZW4gPSBgJHtnLnJvbWFufSR7ZGVsaW0gPz8gXCIuXCJ9YDtcbiAgZWxzZSBpZiAoZy51cHBlcikgdG9rZW4gPSBgJHtnLnVwcGVyfSR7ZGVsaW0gPz8gXCIuXCJ9YDtcbiAgZWxzZSBpZiAoZy5udW0pIHRva2VuID0gYCR7Zy5udW19JHtkZWxpbSA/PyBcIi5cIn1gO1xuICBlbHNlIGlmIChnLnBudW0pIHRva2VuID0gYCgke2cucG51bX0pYDtcbiAgZWxzZSBpZiAoZy5wbG93KSB0b2tlbiA9IGAoJHtnLnBsb3d9KWA7XG4gIGVsc2UgaWYgKGcubG93KSB0b2tlbiA9IGAke2cubG93fSR7ZGVsaW0gPz8gXCIuXCJ9YDtcblxuICByZXR1cm4geyB0b2tlbiwgbGFiZWwsIHJlc3Q6IGcucmVzdCB8fCBcIlwiLCBkZWxpbSB9O1xufVxuXG4vKiogRGVjaWRlIGxldmVsIHVzaW5nIGRlbGltaXRlciwgcGx1cyBSb21hbi9BbHBoYSBoZXVyaXN0aWNzIChsaWtlIFB5dGhvbikgKi9cbmZ1bmN0aW9uIGRlY2lkZUxldmVsKFxuICBsYWJlbDogc3RyaW5nLFxuICBkZWxpbTogc3RyaW5nIHwgbnVsbCxcbiAgcHJldlJvbTogc3RyaW5nIHwgbnVsbCxcbiAgcHJldkFscGhhSWR4OiBudW1iZXIgfCBudWxsXG4pOiB7IGxldmVsOiBudW1iZXIgfCBcImJ1bGxldFwiOyBuZXh0Um9tOiBzdHJpbmcgfCBudWxsOyBuZXh0QWxwaGFJZHg6IG51bWJlciB8IG51bGwgfSB7XG4gIGlmICgvXlxcKFxcZCtcXCkkLy50ZXN0KGxhYmVsKSkge1xuICAgIHJldHVybiB7IGxldmVsOiA2LCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IHByZXZBbHBoYUlkeCB9OyAgICAgICAgIC8vICgxKVxuICB9XG4gIGlmICgvXlxcKFthLXpdK1xcKSQvLnRlc3QobGFiZWwpKSB7XG4gICAgcmV0dXJuIHsgbGV2ZWw6IFwiYnVsbGV0XCIsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogcHJldkFscGhhSWR4IH07ICAvLyAoYSlcbiAgfVxuXG4gIC8vIDEpIHZzIDEuIHZzIDEuKVxuICBpZiAoL15cXGQrJC8udGVzdChsYWJlbCkpIHtcbiAgICBpZiAoZGVsaW0gPT09IFwiKVwiKSB7XG4gICAgICByZXR1cm4geyBsZXZlbDogNiwgbmV4dFJvbTogcHJldlJvbSwgbmV4dEFscGhhSWR4OiBwcmV2QWxwaGFJZHggfTsgICAgICAgLy8gMSlcbiAgICB9XG4gICAgcmV0dXJuIHsgbGV2ZWw6IDQsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogcHJldkFscGhhSWR4IH07ICAgICAgICAgLy8gMS4gLyAxLilcbiAgfVxuXG4gIC8vIFJvbWFuIHZzIEFscGhhIGFtYmlndWl0eSAoZS5nLiwgSS4pXG4gIGlmIChpc1JvbWFuKGxhYmVsKSkge1xuICAgIGNvbnN0IHJvbVZhbCA9IHJvbWFuVG9JbnQobGFiZWwpO1xuICAgIGNvbnN0IGZpdHNSb21hbiA9ICFwcmV2Um9tIHx8IHJvbWFuVG9JbnQocHJldlJvbSkgKyAxID09PSByb21WYWw7XG5cbiAgICBjb25zdCBhbHBoYVZhbCA9IGlzQWxwaGFVcHBlcihsYWJlbCkgPyAobGFiZWwuY2hhckNvZGVBdCgwKSAtIDY0KSA6IG51bGw7IC8vIEE9MVxuICAgIGNvbnN0IGZpdHNBbHBoYSA9IHByZXZBbHBoYUlkeCA9PSBudWxsID8gdHJ1ZSA6IChhbHBoYVZhbCAhPSBudWxsICYmIGFscGhhVmFsID09PSBwcmV2QWxwaGFJZHggKyAxKTtcblxuICAgIGlmIChmaXRzUm9tYW4gJiYgIWZpdHNBbHBoYSkge1xuICAgICAgcmV0dXJuIHsgbGV2ZWw6IDIsIG5leHRSb206IGxhYmVsLCBuZXh0QWxwaGFJZHg6IHByZXZBbHBoYUlkeCB9OyAgICAgICAgIC8vICMjXG4gICAgfSBlbHNlIGlmIChmaXRzQWxwaGEgJiYgIWZpdHNSb21hbikge1xuICAgICAgcmV0dXJuIHsgbGV2ZWw6IDMsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogYWxwaGFWYWwgPz8gMSB9OyAgICAgIC8vICMjI1xuICAgIH0gZWxzZSBpZiAoZml0c1JvbWFuICYmIGZpdHNBbHBoYSkge1xuICAgICAgcmV0dXJuIHsgbGV2ZWw6IDMsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogYWxwaGFWYWwgPz8gMSB9OyAgICAgIC8vIHByZWZlciBhbHBoYSBhcyBkZWVwZXJcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHsgbGV2ZWw6IDIsIG5leHRSb206IGxhYmVsLCBuZXh0QWxwaGFJZHg6IHByZXZBbHBoYUlkeCB9OyAgICAgICAgIC8vIGRlZmF1bHQgdG8gUm9tYW5cbiAgICB9XG4gIH1cblxuICAvLyBBKSB2cyBBLlxuICBpZiAoaXNBbHBoYVVwcGVyKGxhYmVsKSkge1xuICAgIHJldHVybiB7IGxldmVsOiAzLCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IGxhYmVsLmNoYXJDb2RlQXQoMCkgLSA2NCB9OyAvLyAjIyNcbiAgfVxuXG4gIC8vIGEpIHZzIGEuXG4gIGlmICgvXlthLXpdJC8udGVzdChsYWJlbCkpIHtcbiAgICBpZiAoZGVsaW0gPT09IFwiKVwiKSB7XG4gICAgICByZXR1cm4geyBsZXZlbDogXCJidWxsZXRcIiwgbmV4dFJvbTogcHJldlJvbSwgbmV4dEFscGhhSWR4OiBwcmV2QWxwaGFJZHggfTsgICAgLy8gYSlcbiAgICB9XG4gICAgcmV0dXJuIHsgbGV2ZWw6IDUsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogcHJldkFscGhhSWR4IH07ICAgICAgICAgICAgIC8vIGEuXG4gIH1cblxuICByZXR1cm4geyBsZXZlbDogXCJidWxsZXRcIiwgbmV4dFJvbTogcHJldlJvbSwgbmV4dEFscGhhSWR4OiBwcmV2QWxwaGFJZHggfTtcbn1cblxuLyoqIEh5cGhlbiBicmVhayBmaXhlcnMgKi9cbmNvbnN0IEhZUEggPSBgLVxcXFx1MDBBRFxcXFx1MjAxMFxcXFx1MjAxMVxcXFx1MjAxMlxcXFx1MjAxM1xcXFx1MjAxNGA7IC8vIC0sIHNvZnQgaHlwaGVuLCBcdTIwMTAsIC0sIFx1MjAxMiwgXHUyMDEzLCBcdTIwMTRcbmNvbnN0IElOTElORV9IWVBIRU5fQlJFQUtfUkUgPSBuZXcgUmVnRXhwKGAoW0EtWmEtelx1MDBDMC1cdTAwRDZcdTAwRDgtXHUwMEY2XHUwMEY4LVx1MDBGRl0pWyR7SFlQSH1dXFxcXHMrKFthLXpcdTAwRTAtXHUwMEY2XHUwMEY4LVx1MDBGRl0pYCwgXCJnXCIpO1xuY29uc3QgVFJBSUxJTkdfSFlQSEVOX0FUX0VORF9SRSA9IG5ldyBSZWdFeHAoYFtBLVphLXpcdTAwQzAtXHUwMEQ2XHUwMEQ4LVx1MDBGNlx1MDBGOC1cdTAwRkZdWyR7SFlQSH1dXFxcXHMqJGApO1xuZnVuY3Rpb24gZml4SW5saW5lSHlwaGVucyhzOiBzdHJpbmcpOiBzdHJpbmcgeyByZXR1cm4gcy5yZXBsYWNlKElOTElORV9IWVBIRU5fQlJFQUtfUkUsIFwiJDEkMlwiKTsgfVxuZnVuY3Rpb24gYXBwZW5kV2l0aFdvcmRCcmVha0ZpeChidWY6IHN0cmluZywgbmV4dDogc3RyaW5nLCBmaXg6IGJvb2xlYW4pOiBzdHJpbmcge1xuICBpZiAoZml4KSB7XG4gICAgaWYgKFRSQUlMSU5HX0hZUEhFTl9BVF9FTkRfUkUudGVzdChidWYpICYmIC9eW2Etelx1MDBFMC1cdTAwRjZcdTAwRjgtXHUwMEZGXS8udGVzdChuZXh0KSkge1xuICAgICAgcmV0dXJuIGJ1Zi5yZXBsYWNlKG5ldyBSZWdFeHAoYFske0hZUEh9XVxcXFxzKiRgKSwgXCJcIikgKyBuZXh0O1xuICAgIH1cbiAgICBjb25zdCBqb2luZWQgPSAoYnVmICsgXCIgXCIgKyBuZXh0KS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKTtcbiAgICByZXR1cm4gZml4SW5saW5lSHlwaGVucyhqb2luZWQpO1xuICB9XG4gIHJldHVybiAoYnVmICsgXCIgXCIgKyBuZXh0KS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKTtcbn1cblxuLyoqIC0tLSBTcGxpdCBoZWxwZXJzIChub3cgd2l0aCBcdTIwMThwcm90ZWN0ZWRcdTIwMTkgdmVyc2UgJiBTLiBTLiBzcGFucykgLS0tICovXG5jb25zdCBUT0tFTl9TVEFSVF9TUkMgPSBTdHJpbmcucmF3YCg/OltJVlhMQ0RNXStbLildfFtBLVpdWy4pXXxbYS16XVsuKV18XFxkK1suKV18JGJlZ2luOm1hdGg6dGV4dCRbYS16QS1aMC05XSskZW5kOm1hdGg6dGV4dCQpYDtcblxuY29uc3QgQUZURVJfUFVOQ1RfU1BMSVRfUkUgPSBuZXcgUmVnRXhwKFxuICBTdHJpbmcucmF3YChbOjshPyldfFx1MjAxNFxccyp2XFwuXFxzKlxcZCtbYS16XT86KVxccysoPz1gICsgVE9LRU5fU1RBUlRfU1JDICsgU3RyaW5nLnJhd2BcXHMrKWAsXG4gIFwiZ2lcIlxuKTtcblxuLy8gT25seSBwcm90ZWN0IHZlcnNlIG1hcmtlcnMgYW5kIFx1MjAxQ1MuIFMuXHUyMDFEOyBhbGwgb3RoZXIgb25lLWxldHRlciBhYmJyZXZzIGNhbiBzcGxpdC5cbmNvbnN0IEFGVEVSX1NFTlRfVE9LRU5fU1BMSVRfUkUgPSBuZXcgUmVnRXhwKFxuICBTdHJpbmcucmF3YCg/PCFcXGJbdlZdW3ZWXVxcLikoPzwhXFxiW3ZWXVxcLikoPzwhXFxiU1xcLlxccypTKVxcLlxccysoPz1gICsgVE9LRU5fU1RBUlRfU1JDICsgU3RyaW5nLnJhd2BcXHMrKWAsXG4gIFwiZ1wiXG4pO1xuXG4vLyBQcmUtcHJvdGVjdCBcInYuIDdcIiwgXCJ2di4gNy05XCIgYW5kIFwiUy4gUy5cIiBzbyBzcGxpdHRlcnMgY2FuXHUyMDE5dCBjdXQgdGhlbS5cbi8vIFVzZXMgYSBwcml2YXRlLXVzZSBzZW50aW5lbCBmb3IgdGhlIHByb3RlY3RlZCBzcGFjZS5cbmNvbnN0IFNFTlRJTkVMID0gXCJcXHVFMDAwXCI7XG5mdW5jdGlvbiBwcm90ZWN0U3BhbnMoczogc3RyaW5nKTogc3RyaW5nIHtcbiAgLy8gdi4gN1tsZXR0ZXJdP1xuICBzID0gcy5yZXBsYWNlKC9cXGIoW3ZWXSlcXC5cXHMrKFxcZCtbYS16XT8pKD89W15cXGRdfCQpL2csIChfbSwgdiwgbikgPT4gYCR7dn0uYCArIFNFTlRJTkVMICsgbik7XG4gIC8vIHZ2LiA3LTkgLyBWVi4gN1x1MjAxMzkgZXRjLlxuICBzID0gcy5yZXBsYWNlKC9cXGIoW3ZWXSkoW3ZWXSlcXC5cXHMrKFxcZCtbYS16XT8pKFxccypbLVx1MjAxM1x1MjAxNF1cXHMqXFxkK1thLXpdPyk/L2csXG4gICAgKF9tLCB2MSwgdjIsIGEsIHJuZykgPT4gYCR7djF9JHt2Mn0uYCArIFNFTlRJTkVMICsgYSArIChybmcgPz8gXCJcIilcbiAgKTtcbiAgLy8gUy4gUy5cbiAgcyA9IHMucmVwbGFjZSgvXFxiU1xcLlxccypTXFwuL2csIG0gPT4gbS5yZXBsYWNlKC9cXHMrLywgU0VOVElORUwpKTtcbiAgcmV0dXJuIHM7XG59XG5mdW5jdGlvbiB1bnByb3RlY3RTcGFucyhzOiBzdHJpbmcpOiBzdHJpbmcgeyByZXR1cm4gcy5yZXBsYWNlKG5ldyBSZWdFeHAoU0VOVElORUwsIFwiZ1wiKSwgXCIgXCIpOyB9XG5cbmZ1bmN0aW9uIHNwbGl0SW5saW5lU2VnbWVudHMobGluZTogc3RyaW5nKTogc3RyaW5nW10ge1xuICBsZXQgcyA9IHByb3RlY3RTcGFucyhsaW5lKTtcbiAgcyA9IHMucmVwbGFjZShBRlRFUl9QVU5DVF9TUExJVF9SRSwgKF9tLCBwMTogc3RyaW5nKSA9PiBgJHtwMX1cXG5gKTtcbiAgcyA9IHMucmVwbGFjZShBRlRFUl9TRU5UX1RPS0VOX1NQTElUX1JFLCBcIi5cXG5cIik7XG4gIHMgPSB1bnByb3RlY3RTcGFucyhzKTtcbiAgcmV0dXJuIHMuc3BsaXQoXCJcXG5cIikubWFwKHggPT4geC50cmltKCkpLmZpbHRlcihCb29sZWFuKTtcbn1cblxuLyoqIC0tLS0tIE1haW4gZm9ybWF0dGVyIChkZWxpbWl0ZXItYXdhcmUsIHZlcnNlLXNhZmUpIC0tLS0tICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZm9ybWF0T3V0bGluZVRleHQoXG4gIHRleHRPckxpbmVzOiBzdHJpbmcgfCBzdHJpbmdbXSxcbiAge1xuICAgIHNwbGl0SW5saW5lU3VicG9pbnRzID0gdHJ1ZSxcbiAgICBmaXhIeXBoZW5hdGVkQnJlYWtzID0gdHJ1ZSxcbiAgICBvdXRwdXRMaW5lU2VwYXJhdG9yID0gXCJcXG5cIixcbiAgICBkcm9wUHVyZVBhZ2VOdW1iZXJMaW5lcyA9IGZhbHNlXG4gIH06IE91dGxpbmVGb3JtYXRPcHRpb25zID0ge30sXG4gIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3Ncbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIC8vIEJ1aWxkIGEgcmF3IHN0cmluZyBzbyB3ZSBjYW4gcHJlLWhhY2sgdGhlIHZlcnkgZmlyc3QgXCIgSS4gXCJcbiAgbGV0IHJhdyA9IEFycmF5LmlzQXJyYXkodGV4dE9yTGluZXMpID8gdGV4dE9yTGluZXMuam9pbihcIlxcblwiKSA6IHRleHRPckxpbmVzO1xuXG4gIC8vIEhBUkQgUEFUQ0g6IEluIHRoZSBmaXJzdCAyMDAwIGNoYXJzIG9ubHksIGluc2VydCBhIG5ld2xpbmUgYmVmb3JlIHRoZSBmaXJzdCBzdGFuZGFsb25lIFwiIEkuIFwiXG4gIC8vIC0gTm90IHByZWNlZGVkIGJ5IGEgbGV0dGVyL251bWJlciAoc28gbm90IFwiSUkuXCIpXG4gIC8vIC0gRm9sbG93ZWQgYnkgYSBjYXBpdGFsIChzdGFydCBvZiBhIHNlbnRlbmNlL2hlYWRpbmcpXG4gIC8vIC0gRG8gbm90IHRvdWNoIFwiUy4gUy5cIlxuICB7XG4gICAgY29uc3QgaGVhZCA9IHJhdy5zbGljZSgwLCAyMDAwKTtcbiAgICBjb25zdCB0YWlsID0gcmF3LnNsaWNlKDIwMDApO1xuXG4gICAgLy8gb25lLXRpbWUgcmVwbGFjZSAobm8gL2cvKVxuICAgIGNvbnN0IGhlYWRQYXRjaGVkID0gaGVhZC5yZXBsYWNlKFxuICAgICAgLyhefFteQS1aYS16MC05XSlJXFwuXFxzKyg/PVtBLVpdKSg/IVxccypTXFwuKS9tLFxuICAgICAgKF9tLCBwcmUpID0+IGAke3ByZX1cXG5JLiBgXG4gICAgKTtcblxuICAgIHJhdyA9IGhlYWRQYXRjaGVkICsgdGFpbDtcbiAgfVxuXG4gIC8vIG5vdyBwcm9jZWVkIHdpdGggbm9ybWFsIGxpbmUgc3BsaXR0aW5nIHVzaW5nIHRoZSBwYXRjaGVkIHRleHRcbiAgY29uc3QgbGluZXMgPSByYXcuc3BsaXQoL1xccj9cXG4vKTtcblxuICAvLyBjb25zdCBsaW5lcyA9IEFycmF5LmlzQXJyYXkodGV4dE9yTGluZXMpID8gdGV4dE9yTGluZXMuc2xpY2UoKSA6IHRleHRPckxpbmVzLnNwbGl0KC9cXHI/XFxuLyk7XG5cbiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICBsZXQgYnVmID0gXCJcIjtcbiAgbGV0IHByZXZSb21hbjogc3RyaW5nIHwgbnVsbCA9IG51bGw7ICAgICAvLyBwcmV2aW91cyBSb21hbiBsYWJlbCAoSSwgSUksIFx1MjAyNilcbiAgbGV0IHByZXZBbHBoYUlkeDogbnVtYmVyIHwgbnVsbCA9IG51bGw7ICAvLyBwcmV2aW91cyBBbHBoYSBpbmRleCAoQT0xLCBCPTIsIFx1MjAyNilcblxuICBjb25zdCBlbWl0QnVmZmVyID0gKHJhdzogc3RyaW5nKSA9PiB7XG4gICAgbGV0IGJhc2UgPSByYXcudHJpbSgpO1xuICAgIGlmICghYmFzZSkgcmV0dXJuO1xuXG4gICAgaWYgKCFzcGxpdElubGluZVN1YnBvaW50cykge1xuICAgICAgb3V0LnB1c2goYmFzZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHBhcnRzID0gc3BsaXRJbmxpbmVTZWdtZW50cyhiYXNlKVxuICAgICAgLm1hcChzZWcgPT4gc2VnLnJlcGxhY2UoL15cXGR7MSwzfVxccytbQS1aXVtBLVpdKyg/OlsgLV1bQS1aXVtBLVpdKykqLywgXCJcIikudHJpbSgpKSAvLyBjb25zZXJ2YXRpdmUgaGVhZGVyIHNjcnViXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IHBhcnQgPSBwYXJ0c1tpXTtcbiAgICAgIGlmIChmaXhIeXBoZW5hdGVkQnJlYWtzKSBwYXJ0ID0gZml4SW5saW5lSHlwaGVucyhwYXJ0KTtcblxuICAgICAgbGV0IHBhcnNlZCA9IHBhcnNlSGVhZGluZ1N0YXJ0KHBhcnQpO1xuICAgICAgaWYgKCFwYXJzZWQpIHtcbiAgICAgICAgb3V0LnB1c2gocGFydCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB7IHRva2VuLCBsYWJlbCwgcmVzdCwgZGVsaW0gfSA9IHBhcnNlZDtcbiAgICAgIGNvbnN0IHsgbGV2ZWwsIG5leHRSb20sIG5leHRBbHBoYUlkeCB9ID0gZGVjaWRlTGV2ZWwobGFiZWwucmVwbGFjZSgvWy4pXSQvLCBcIlwiKSwgZGVsaW0sIHByZXZSb21hbiwgcHJldkFscGhhSWR4KTtcbiAgICAgIHByZXZSb21hbiA9IG5leHRSb207XG4gICAgICBwcmV2QWxwaGFJZHggPSBuZXh0QWxwaGFJZHg7XG5cbiAgICAgIGlmIChsZXZlbCA9PT0gXCJidWxsZXRcIikge1xuICAgICAgICBvdXQucHVzaChgJHtnZXRNZFByZWZpeEZyb21MZXZlbChsZXZlbCl9ICogJHt0b2tlbn0gJHtyZXN0fWAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4RnJvbUxldmVsKGxldmVsKTtcbiAgICAgICAgb3V0LnB1c2goYCR7cHJlZml4fSAke3Rva2VufSAke3Jlc3R9YC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCkpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBmb3IgKGxldCByYXcgb2YgbGluZXMpIHtcbiAgICBsZXQgbGluZSA9IHJhdy50cmltKCk7XG4gICAgaWYgKCFsaW5lKSBjb250aW51ZTtcbiAgICBpZiAoZHJvcFB1cmVQYWdlTnVtYmVyTGluZXMgJiYgL15cXGQrJC8udGVzdChsaW5lKSkgY29udGludWU7XG4gICAgaWYgKGZpeEh5cGhlbmF0ZWRCcmVha3MpIGxpbmUgPSBmaXhJbmxpbmVIeXBoZW5zKGxpbmUpO1xuXG4gICAgLy8gSWYgcHJldmlvdXMgYnVmZmVyIGVuZHMgd2l0aCB2ZXJzZSBtYXJrZXIsIGEgbGVhZGluZyBudW1iZXIgaXMgYSB2ZXJzZSBcdTIwMTQgbm90IGEgbmV3IGhlYWRpbmcuXG4gICAgbGV0IHBhcnNlZCA9IHBhcnNlSGVhZGluZ1N0YXJ0KGxpbmUpO1xuICAgIGNvbnN0IHByZXZFbmRzV2l0aFZlcnNlID0gL1xcYlt2Vl17MSwyfVxcLlxccyokLy50ZXN0KGJ1Zik7XG4gICAgaWYgKHBhcnNlZCAmJiAvXlxcZCskLy50ZXN0KHBhcnNlZC5sYWJlbCkgJiYgcHJldkVuZHNXaXRoVmVyc2UpIHtcbiAgICAgIHBhcnNlZCA9IG51bGw7IC8vIHRyZWF0IGFzIGNvbnRpbnVhdGlvblxuICAgIH1cblxuICAgIGlmIChwYXJzZWQpIHtcbiAgICAgIGlmIChidWYpIGVtaXRCdWZmZXIoYnVmKTtcbiAgICAgIGJ1ZiA9IFwiXCI7XG5cbiAgICAgIGNvbnN0IHsgdG9rZW4sIGxhYmVsLCByZXN0LCBkZWxpbSB9ID0gcGFyc2VkO1xuICAgICAgY29uc3QgeyBsZXZlbCwgbmV4dFJvbSwgbmV4dEFscGhhSWR4IH0gPSBkZWNpZGVMZXZlbChsYWJlbCwgZGVsaW0sIHByZXZSb21hbiwgcHJldkFscGhhSWR4KTtcbiAgICAgIHByZXZSb21hbiA9IG5leHRSb207XG4gICAgICBwcmV2QWxwaGFJZHggPSBuZXh0QWxwaGFJZHg7XG5cbiAgICAgIGlmIChsZXZlbCA9PT0gXCJidWxsZXRcIikge1xuICAgICAgICBidWYgPSBgJHtnZXRNZFByZWZpeEZyb21MZXZlbChsZXZlbCl9ICogJHt0b2tlbn0gJHtyZXN0fWAudHJpbSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcHJlZml4ID0gZ2V0TWRQcmVmaXhGcm9tTGV2ZWwobGV2ZWwpO1xuICAgICAgICBidWYgPSBgJHtwcmVmaXh9ICR7dG9rZW59ICR7cmVzdH1gLnRyaW0oKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYnVmID0gYnVmID8gYXBwZW5kV2l0aFdvcmRCcmVha0ZpeChidWYsIGxpbmUsIGZpeEh5cGhlbmF0ZWRCcmVha3MpIDogbGluZTtcbiAgICB9XG4gIH1cblxuICBpZiAoYnVmKSBlbWl0QnVmZmVyKGJ1Zik7XG4gIGxldCByZXN1bHQgPSBvdXQuam9pbihvdXRwdXRMaW5lU2VwYXJhdG9yKTtcblxuICAvLyBpbnNlcnQgdmVyc2UgbGlua3MgdXNpbmcgbGlua1ZlcnNlc0luVGV4dFxuICBpZiAoc2V0dGluZ3MuYXV0b0xpbmtWZXJzZXMpIHtcbiAgICByZXN1bHQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KHJlc3VsdCwgc2V0dGluZ3MpO1xuICB9XG5cbiAgbmV3IE5vdGljZShcIk91dGxpbmUgZm9ybWF0dGVkXCIgKyAoc2V0dGluZ3MuYXV0b0xpbmtWZXJzZXMgPyBcIiArIHZlcnNlcyBsaW5rZWQuXCIgOiBcIi5cIikpO1xuXG4gIHJldHVybiByZXN1bHRcbn1cblxuLy8gLyoqXG4vLyAgKiBTQUZFTFkgc3BsaXQgaW5saW5lIHN1YnBvaW50cyBPTkxZIHdoZW4gdGhleSBjb21lIHJpZ2h0IGFmdGVyIGEgY29sb24vc2VtaWNvbG9uLFxuLy8gICogZS5nLiBcdTIwMUNcdTIwMjYgdi4gOTogYS4gRnVsbG5lc3MgXHUyMDI2IGIuIFdoZW4gXHUyMDI2IDEuIFNvbWV0aGluZyBcdTIwMjZcdTIwMURcbi8vICAqIFRoaXMgd2lsbCBOT1Qgc3BsaXQgXHUyMDE4Q29sLlx1MjAxOSAvIFx1MjAxOEVwaC5cdTIwMTkgYmVjYXVzZSB0aG9zZSBhcmVuXHUyMDE5dCBwcmVjZWRlZCBieSAnOicgb3IgJzsnLlxuLy8gICovXG4vLyBmdW5jdGlvbiBzcGxpdElubGluZUhlYWRpbmdzQWZ0ZXJDb2xvbih0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuLy8gICAvLyBJbnNlcnQgYSBuZXdsaW5lIGFmdGVyIFwiOlwiIG9yIFwiO1wiIEJFRk9SRSBhIHRva2VuIHRoYXQgbG9va3MgbGlrZSBhIHN1YnBvaW50LlxuLy8gICAvLyBUb2tlbnMgc3VwcG9ydGVkOiAgYS4gIGIuICAxLiAgMTAuICAoYSkgICgxKVxuLy8gICAvLyBLZWVwIHRoZSBwdW5jdHVhdGlvbiAoOiQxKSBhbmQgYWRkIHRoZSBuZXdsaW5lIGluICQyLlxuLy8gICByZXR1cm4gdGV4dFxuLy8gICAgIC8vIEFmdGVyIFwiOlwiIG9yIFwiO1wiIHRoZW4gc3BhY2UocykgLT4gYmVmb3JlIFthLXpdLiAgKGV4Y2x1ZGUgdi4gYnkgbm90IG5lZWRlZDogd2Ugb25seSBzcGxpdCBhZnRlciBcIjpcIiAvIFwiO1wiKVxuLy8gICAgIC5yZXBsYWNlKC8oWzo7XSlcXHMrKD89KFthLXpdXFwufFxcKFxcdytcXCl8XFxkK1xcLikpL2csIFwiJDFcXG5cIilcbi8vICAgICAvLyBBbHNvIHN1cHBvcnQgZW0vZW4gZGFzaCBcIlx1MjAxNFwiIGZvbGxvd2VkIGJ5IHZlcnNlIFwidi5cIiB3aXRoIG51bWJlciwgdGhlbiBjb2xvbjogXCJcdTIwMTR2LiA5OlwiIGEgY29tbW9uIHBhdHRlcm5cbi8vICAgICAucmVwbGFjZSgvKFx1MjAxNFxccyp2XFwuXFxzKlxcZCtbYS16XT86KVxccysoPz0oW2Etel1cXC58XFwoXFx3K1xcKXxcXGQrXFwuKSkvZ2ksIFwiJDFcXG5cIik7XG4vLyB9IiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgU2V0dGluZywgVEZpbGUsIFRGb2xkZXIsIG5vcm1hbGl6ZVBhdGgsIHJlcXVlc3RVcmwgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgQk9PS19BQkJSIH0gZnJvbSBcIi4uL2xpYi90eXBlc1wiO1xuaW1wb3J0IHsgQnVpbGRCaWJsZU1vZGFsIH0gZnJvbSBcInNyYy91aS9idWlsZC1iaWJsZS1tb2RhbFwiO1xuXG4vLyAtLS0tLS0tLS0tIFR5cGVzIC0tLS0tLS0tLS1cbnR5cGUgQm9sbHNCb29rTWV0YSA9IHtcbiAgYm9va2lkOiBudW1iZXI7XG4gIGNocm9ub3JkZXI6IG51bWJlcjtcbiAgbmFtZTogc3RyaW5nO1xuICBjaGFwdGVyczogbnVtYmVyO1xufTtcblxudHlwZSBCb2xsc1ZlcnNlID0ge1xuICBwazogbnVtYmVyO1xuICB2ZXJzZTogbnVtYmVyO1xuICB0ZXh0OiBzdHJpbmc7ICAgLy8gSFRNTFxuICBjb21tZW50Pzogc3RyaW5nO1xufTtcblxuY29uc3QgQk9MTFMgPSB7XG4gIExBTkdVQUdFU19VUkw6IFwiaHR0cHM6Ly9ib2xscy5saWZlL3N0YXRpYy9ib2xscy9hcHAvdmlld3MvbGFuZ3VhZ2VzLmpzb25cIixcbiAgR0VUX0JPT0tTOiAodHI6IHN0cmluZykgPT4gYGh0dHBzOi8vYm9sbHMubGlmZS9nZXQtYm9va3MvJHtlbmNvZGVVUklDb21wb25lbnQodHIpfS9gLFxuICBHRVRfQ0hBUFRFUjogKHRyOiBzdHJpbmcsIGJvb2tJZDogbnVtYmVyLCBjaDogbnVtYmVyKSA9PlxuICAgIGBodHRwczovL2JvbGxzLmxpZmUvZ2V0LXRleHQvJHtlbmNvZGVVUklDb21wb25lbnQodHIpfS8ke2Jvb2tJZH0vJHtjaH0vYCxcbn07XG5cbi8vIENhbm9uaWNhbCBib29rIG5hbWUgYnkgSUQgKDY2LWJvb2sgUHJvdGVzdGFudCBiYXNlbGluZSlcbmNvbnN0IENBTk9OX0VOX0JZX0lEOiBSZWNvcmQ8bnVtYmVyLCBzdHJpbmc+ID0ge1xuICAxOlwiR2VuZXNpc1wiLDI6XCJFeG9kdXNcIiwzOlwiTGV2aXRpY3VzXCIsNDpcIk51bWJlcnNcIiw1OlwiRGV1dGVyb25vbXlcIixcbiAgNjpcIkpvc2h1YVwiLDc6XCJKdWRnZXNcIiw4OlwiUnV0aFwiLDk6XCIxIFNhbXVlbFwiLDEwOlwiMiBTYW11ZWxcIixcbiAgMTE6XCIxIEtpbmdzXCIsMTI6XCIyIEtpbmdzXCIsMTM6XCIxIENocm9uaWNsZXNcIiwxNDpcIjIgQ2hyb25pY2xlc1wiLDE1OlwiRXpyYVwiLFxuICAxNjpcIk5laGVtaWFoXCIsMTc6XCJFc3RoZXJcIiwxODpcIkpvYlwiLDE5OlwiUHNhbG1zXCIsMjA6XCJQcm92ZXJic1wiLFxuICAyMTpcIkVjY2xlc2lhc3Rlc1wiLDIyOlwiU29uZyBvZiBTb25nc1wiLDIzOlwiSXNhaWFoXCIsMjQ6XCJKZXJlbWlhaFwiLDI1OlwiTGFtZW50YXRpb25zXCIsXG4gIDI2OlwiRXpla2llbFwiLDI3OlwiRGFuaWVsXCIsMjg6XCJIb3NlYVwiLDI5OlwiSm9lbFwiLDMwOlwiQW1vc1wiLFxuICAzMTpcIk9iYWRpYWhcIiwzMjpcIkpvbmFoXCIsMzM6XCJNaWNhaFwiLDM0OlwiTmFodW1cIiwzNTpcIkhhYmFra3VrXCIsXG4gIDM2OlwiWmVwaGFuaWFoXCIsMzc6XCJIYWdnYWlcIiwzODpcIlplY2hhcmlhaFwiLDM5OlwiTWFsYWNoaVwiLFxuICA0MDpcIk1hdHRoZXdcIiw0MTpcIk1hcmtcIiw0MjpcIkx1a2VcIiw0MzpcIkpvaG5cIiw0NDpcIkFjdHNcIiw0NTpcIlJvbWFuc1wiLFxuICA0NjpcIjEgQ29yaW50aGlhbnNcIiw0NzpcIjIgQ29yaW50aGlhbnNcIiw0ODpcIkdhbGF0aWFuc1wiLDQ5OlwiRXBoZXNpYW5zXCIsXG4gIDUwOlwiUGhpbGlwcGlhbnNcIiw1MTpcIkNvbG9zc2lhbnNcIiw1MjpcIjEgVGhlc3NhbG9uaWFuc1wiLDUzOlwiMiBUaGVzc2Fsb25pYW5zXCIsXG4gIDU0OlwiMSBUaW1vdGh5XCIsNTU6XCIyIFRpbW90aHlcIiw1NjpcIlRpdHVzXCIsNTc6XCJQaGlsZW1vblwiLDU4OlwiSGVicmV3c1wiLFxuICA1OTpcIkphbWVzXCIsNjA6XCIxIFBldGVyXCIsNjE6XCIyIFBldGVyXCIsNjI6XCIxIEpvaG5cIiw2MzpcIjIgSm9oblwiLFxuICA2NDpcIjMgSm9oblwiLDY1OlwiSnVkZVwiLDY2OlwiUmV2ZWxhdGlvblwiLFxufTtcblxuZnVuY3Rpb24gc2hvcnRBYmJyRm9yKGJvb2tJZDogbnVtYmVyLCBpbmNvbWluZ05hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGNhbm9uID0gQ0FOT05fRU5fQllfSURbYm9va0lkXTtcbiAgaWYgKGNhbm9uICYmIEJPT0tfQUJCUltjYW5vbl0pIHtcbiAgICBjb25zdCByZXN1bHQgPSBCT09LX0FCQlJbY2Fub25dO1xuICAgIHJldHVybiByZXN1bHQgPT09IFwiUy5TLlwiID8gXCJTb1NcIiA6IHJlc3VsdDtcbiAgfVxuXG4gIGlmIChCT09LX0FCQlJbaW5jb21pbmdOYW1lXSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IEJPT0tfQUJCUltpbmNvbWluZ05hbWVdO1xuICAgIHJldHVybiByZXN1bHQgPT09IFwiUy5TLlwiID8gXCJTb1NcIiA6IHJlc3VsdDtcbiAgfVxuICByZXR1cm4gaW5jb21pbmdOYW1lO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEpzb248VD4odXJsOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcbiAgLy8gUHJlZmVyIE9ic2lkaWFuJ3MgcmVxdWVzdFVybCAobm8gQ09SUyByZXN0cmljdGlvbnMpXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHJlcXVlc3RVcmwoeyB1cmwsIG1ldGhvZDogXCJHRVRcIiB9KTtcbiAgICBpZiAocmVzcC5zdGF0dXMgPCAyMDAgfHwgcmVzcC5zdGF0dXMgPj0gMzAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7cmVzcC5zdGF0dXN9IFJlcXVlc3QgZmFpbGVkYCk7XG4gICAgfVxuICAgIGNvbnN0IHRleHQgPSByZXNwLnRleHQgPz8gXCJcIjtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UodGV4dCkgYXMgVDtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBKU09OIGZyb20gJHt1cmx9YCk7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBGYWxsYmFjayB0byBmZXRjaCBmb3Igbm9uLU9ic2lkaWFuIGNvbnRleHRzIChlLmcuLCB0ZXN0cylcbiAgICB0cnkge1xuICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybCwgeyBtZXRob2Q6IFwiR0VUXCIgfSk7XG4gICAgICBpZiAoIXIub2spIHRocm93IG5ldyBFcnJvcihgJHtyLnN0YXR1c30gJHtyLnN0YXR1c1RleHR9YCk7XG4gICAgICByZXR1cm4gKGF3YWl0IHIuanNvbigpKSBhcyBUO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIFN1cmZhY2UgdGhlIG9yaWdpbmFsIHJlcXVlc3RVcmwgZXJyb3IgaWYgYm90aCBmYWlsXG4gICAgICB0aHJvdyBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyKSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBodG1sVG9UZXh0KGh0bWw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBodG1sXG4gICAgLnJlcGxhY2UoLzxiclxccypcXC8/Pi9naSwgXCJcXG5cIilcbiAgICAucmVwbGFjZSgvPFxcLz8oaXxlbXxzdHJvbmd8Ynx1fHN1cHxzdWJ8c3BhbnxwfGRpdnxibG9ja3F1b3RlfHNtYWxsfGZvbnQpW14+XSo+L2dpLCBcIlwiKVxuICAgIC5yZXBsYWNlKC8mbmJzcDsvZywgXCIgXCIpXG4gICAgLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKVxuICAgIC5yZXBsYWNlKC8mbHQ7L2csIFwiPFwiKVxuICAgIC5yZXBsYWNlKC8mZ3Q7L2csIFwiPlwiKVxuICAgIC5yZXBsYWNlKC9cXHMrXFxuL2csIFwiXFxuXCIpXG4gICAgLnJlcGxhY2UoL1xcbnszLH0vZywgXCJcXG5cXG5cIilcbiAgICAudHJpbSgpO1xufVxuXG4vLyAtLS0tLS0tLS0tIEJ1aWxkZXIgY29yZSAtLS0tLS0tLS0tXG50eXBlIEJ1aWxkT3B0aW9ucyA9IHtcbiAgdHJhbnNsYXRpb25Db2RlOiBzdHJpbmc7XG4gIHRyYW5zbGF0aW9uRnVsbDogc3RyaW5nO1xuICBpbmNsdWRlVmVyc2lvbkluRmlsZU5hbWU6IGJvb2xlYW47XG4gIHZlcnNpb25Bc1N1YmZvbGRlcjogYm9vbGVhbjtcbiAgYXV0b0Zyb250bWF0dGVyOiBib29sZWFuO1xuICBjb25jdXJyZW5jeTogbnVtYmVyO1xuICBiYXNlRm9sZGVyOiBzdHJpbmc7XG59O1xudHlwZSBQcm9ncmVzc0ZuID0gKGRvbmU6IG51bWJlciwgdG90YWw6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkO1xuXG5mdW5jdGlvbiBub3dJc29EYXRlKCk6IHN0cmluZyB7XG4gIGNvbnN0IGQgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCBtbSA9IFN0cmluZyhkLmdldE1vbnRoKCkrMSkucGFkU3RhcnQoMixcIjBcIik7XG4gIGNvbnN0IGRkID0gU3RyaW5nKGQuZ2V0RGF0ZSgpKS5wYWRTdGFydCgyLFwiMFwiKTtcbiAgcmV0dXJuIGAke2QuZ2V0RnVsbFllYXIoKX0tJHttbX0tJHtkZH1gO1xufVxuXG5hc3luYyBmdW5jdGlvbiBlbnN1cmVGb2xkZXIoYXBwOiBBcHAsIHBhdGg6IHN0cmluZyk6IFByb21pc2U8VEZvbGRlcj4ge1xuICBjb25zdCBucCA9IG5vcm1hbGl6ZVBhdGgocGF0aC5yZXBsYWNlKC9cXC8rJC8sXCJcIikpO1xuICBsZXQgZiA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobnApO1xuICBpZiAoZiBpbnN0YW5jZW9mIFRGb2xkZXIpIHJldHVybiBmO1xuICBhd2FpdCBhcHAudmF1bHQuY3JlYXRlRm9sZGVyKG5wKTtcbiAgY29uc3QgY3JlYXRlZCA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobnApO1xuICBpZiAoY3JlYXRlZCBpbnN0YW5jZW9mIFRGb2xkZXIpIHJldHVybiBjcmVhdGVkO1xuICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBjcmVhdGUgZm9sZGVyOiAke25wfWApO1xufVxuXG5mdW5jdGlvbiBidWlsZEJvb2tGaWxlbmFtZShiYXNlU2hvcnQ6IHN0cmluZywgY29kZTogc3RyaW5nLCBpbmNsdWRlVmVyc2lvbjogYm9vbGVhbik6IHN0cmluZyB7XG4gIHJldHVybiBpbmNsdWRlVmVyc2lvbiA/IGAke2Jhc2VTaG9ydH0gKCR7Y29kZX0pYCA6IGJhc2VTaG9ydDtcbn1cblxuZnVuY3Rpb24gY2hhcHRlck5hdkxpbmUoYm9va1Nob3J0OiBzdHJpbmcsIGNoYXB0ZXJzOiBudW1iZXIpOiBzdHJpbmcge1xuICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChsZXQgYz0xOyBjPD1jaGFwdGVyczsgYysrKSB7XG4gICAgY29uc3QgbGFiID0gKGMgJSA1ID09PSAwIHx8IGMgPT09IDEgfHwgYyA9PT0gY2hhcHRlcnMpID8gU3RyaW5nKGMpIDogXCJcdTIwMjJcIjtcbiAgICBwYXJ0cy5wdXNoKGBbWyR7Ym9va1Nob3J0fSNeJHtjfXwke2xhYn1dXWApO1xuICB9XG4gIHJldHVybiBgXFxuKipjaC4qKiAke3BhcnRzLmpvaW4oXCIgXCIpfVxcbmA7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBidWlsZEJpYmxlRnJvbUJvbGxzKGFwcDogQXBwLCBvcHRzOiBCdWlsZE9wdGlvbnMsIG9uUHJvZ3Jlc3M6IFByb2dyZXNzRm4pIHtcbiAgY29uc3QgYmFzZUZvbGRlciA9IG9wdHMuYmFzZUZvbGRlci5yZXBsYWNlKC9cXC8rJC8sXCJcIik7XG4gIGNvbnN0IHJvb3QgPSBhd2FpdCBlbnN1cmVGb2xkZXIoYXBwLCBiYXNlRm9sZGVyKTtcbiAgY29uc3QgcGFyZW50ID0gb3B0cy52ZXJzaW9uQXNTdWJmb2xkZXJcbiAgICA/IGF3YWl0IGVuc3VyZUZvbGRlcihhcHAsIGAke2Jhc2VGb2xkZXJ9LyR7b3B0cy50cmFuc2xhdGlvbkNvZGV9YClcbiAgICA6IHJvb3Q7XG5cbiAgbGV0IGJvb2tzOiBCb2xsc0Jvb2tNZXRhW10gPSBbXTtcbiAgdHJ5IHtcbiAgICBib29rcyA9IGF3YWl0IGZldGNoSnNvbjxCb2xsc0Jvb2tNZXRhW10+KEJPTExTLkdFVF9CT09LUyhvcHRzLnRyYW5zbGF0aW9uQ29kZSkpO1xuICB9IGNhdGNoIChlOmFueSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGxvYWQgYm9va3MgZm9yICR7b3B0cy50cmFuc2xhdGlvbkNvZGV9OiAke2U/Lm1lc3NhZ2UgPz8gZX1gKTtcbiAgfVxuICBpZiAoIWJvb2tzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKFwiTm8gYm9va3MgcmV0dXJuZWQgZnJvbSBBUEkuXCIpO1xuXG4gIGNvbnN0IHRvdGFsID0gYm9va3MucmVkdWNlKChhY2MsYik9PmFjYyArIChiLmNoYXB0ZXJzfHwwKSwgMCk7XG4gIGxldCBkb25lID0gMDtcblxuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChjb25zdCBib29rIG9mIGJvb2tzKSB7XG4gICAgY29uc3Qgc2hvcnRCb29rID0gc2hvcnRBYmJyRm9yKGJvb2suYm9va2lkLCBib29rLm5hbWUpO1xuICAgIGNvbnN0IHNob3J0V2l0aEFiYnIgPSBgJHtzaG9ydEJvb2t9JHtvcHRzLmluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZSA/IGAgKCR7b3B0cy50cmFuc2xhdGlvbkNvZGV9KWAgOiBcIlwifWA7XG4gICAgY29uc3QgZmlsZUJhc2UgPSBidWlsZEJvb2tGaWxlbmFtZShzaG9ydEJvb2ssIG9wdHMudHJhbnNsYXRpb25Db2RlLCBvcHRzLmluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZSk7XG4gICAgY29uc3QgdGFyZ2V0UGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7cGFyZW50LnBhdGh9LyR7ZmlsZUJhc2V9Lm1kYCk7XG5cbiAgICBjb25zdCBoZWFkZXJMaW5lczogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAob3B0cy5hdXRvRnJvbnRtYXR0ZXIpIHtcbiAgICAgIGhlYWRlckxpbmVzLnB1c2goXG4gICAgICAgIFwiLS0tXCIsXG4gICAgICAgIGB0aXRsZTogXCIke3Nob3J0V2l0aEFiYnJ9XCJgLFxuICAgICAgICBgYmlibGVfdHJhbnNsYXRpb25fY29kZTogXCIke29wdHMudHJhbnNsYXRpb25Db2RlfVwiYCxcbiAgICAgICAgYGJpYmxlX3RyYW5zbGF0aW9uX25hbWU6IFwiJHtvcHRzLnRyYW5zbGF0aW9uRnVsbH1cImAsXG4gICAgICAgIGBjcmVhdGVkOiAke25vd0lzb0RhdGUoKX1gLFxuICAgICAgICBcIi0tLVwiLFxuICAgICAgICBcIlwiXG4gICAgICApO1xuICAgIH1cbiAgICBoZWFkZXJMaW5lcy5wdXNoKGAjICR7c2hvcnRXaXRoQWJicn1gKTtcbiAgICBoZWFkZXJMaW5lcy5wdXNoKGNoYXB0ZXJOYXZMaW5lKHNob3J0V2l0aEFiYnIsIGJvb2suY2hhcHRlcnMpKTtcbiAgICBoZWFkZXJMaW5lcy5wdXNoKFwiXCIpO1xuXG4gICAgY29uc3QgY2h1bmtzOiBzdHJpbmdbXSA9IFtoZWFkZXJMaW5lcy5qb2luKFwiXFxuXCIpXTtcblxuICAgIGNvbnN0IHF1ZXVlID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBib29rLmNoYXB0ZXJzfSwgKF8saSk9PmkrMSk7XG4gICAgY29uc3QgY29uY3VycmVuY3kgPSBNYXRoLm1heCgxLCBNYXRoLm1pbig4LCBvcHRzLmNvbmN1cnJlbmN5IHx8IDQpKTtcblxuICAgIC8vIFNpbXBsZSBwb29sXG4gICAgbGV0IG5leHQgPSAwO1xuICAgIGNvbnN0IHdvcmtlcnMgPSBBcnJheS5mcm9tKHtsZW5ndGg6IGNvbmN1cnJlbmN5fSwgKCkgPT4gKGFzeW5jICgpID0+IHtcbiAgICAgIHdoaWxlIChuZXh0IDwgcXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IGNoID0gcXVldWVbbmV4dCsrXTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBvblByb2dyZXNzKGRvbmUsIHRvdGFsLCBgJHtzaG9ydFdpdGhBYmJyfSAke2NofS8ke2Jvb2suY2hhcHRlcnN9YCk7XG4gICAgICAgICAgY29uc3QgdmVyc2VzID0gYXdhaXQgZmV0Y2hKc29uPEJvbGxzVmVyc2VbXT4oQk9MTFMuR0VUX0NIQVBURVIob3B0cy50cmFuc2xhdGlvbkNvZGUsIGJvb2suYm9va2lkLCBjaCkpO1xuICAgICAgICAgIGNvbnN0IG1heFYgPSBNYXRoLm1heCgwLCAuLi52ZXJzZXMubWFwKHYgPT4gdi52ZXJzZSkpO1xuXG4gICAgICAgICAgY29uc3QgdnZOYXYgPSBBcnJheS5mcm9tKHtsZW5ndGg6IG1heFZ9LCAoXyxpKT0+aSsxKVxuICAgICAgICAgICAgLm1hcCh2ID0+IGBbWyR7c2hvcnRXaXRoQWJicn0jXiR7Y2h9LSR7dn18JHt2ICUgNSA9PT0gMCA/IHYgOiBcIlx1MjAyMlwifV1dYCkuam9pbihcIiBcIik7XG5cbiAgICAgICAgICBjb25zdCBwcmV2TGluayA9IGNoID4gMSA/IGBbWyR7c2hvcnRXaXRoQWJicn0jXiR7Y2gtMX18PC0gUHJldmlvdXNdXWAgOiBcIlx1MjE5MFwiO1xuICAgICAgICAgIGNvbnN0IG5leHRMaW5rID0gY2ggPCBib29rLmNoYXB0ZXJzID8gYFtbJHtzaG9ydFdpdGhBYmJyfSNeJHtjaCsxfXxOZXh0IC0+XV1gIDogXCJcdTIxOTJcIjtcbiAgICAgICAgICBjb25zdCBtaWQgPSBgW1ske3Nob3J0V2l0aEFiYnJ9IyR7c2hvcnRXaXRoQWJicn18JHtzaG9ydEJvb2t9ICR7Y2h9IG9mICR7Ym9vay5jaGFwdGVyc31dXWA7XG5cbiAgICAgICAgICBjb25zdCB0b3AgPSBbXG4gICAgICAgICAgICBcIi0tLVwiLFxuICAgICAgICAgICAgYCR7cHJldkxpbmt9IHwgJHttaWR9IHwgJHtuZXh0TGlua30gfCAqKnZ2LioqICR7dnZOYXZ9IF4ke2NofWAsXG4gICAgICAgICAgICBcIlxcbi0tLVxcblwiLFxuICAgICAgICAgICAgXCJcIlxuICAgICAgICAgIF0uam9pbihcIlxcblwiKTtcblxuICAgICAgICAgIGNvbnN0IHZlcnNlc01kID0gdmVyc2VzLm1hcCh2ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBsYWluID0gaHRtbFRvVGV4dCh2LnRleHQpLnRyaW0oKTtcbiAgICAgICAgICAgIHJldHVybiBgKioke3Nob3J0V2l0aEFiYnJ9ICR7Y2h9OiR7di52ZXJzZX0qKiAtICR7cGxhaW59IF4ke2NofS0ke3YudmVyc2V9YDtcbiAgICAgICAgICB9KS5qb2luKFwiXFxuXFxuXCIpO1xuXG4gICAgICAgICAgY2h1bmtzW2NoXSA9IGAke3RvcH0ke3ZlcnNlc01kfVxcblxcbmA7XG4gICAgICAgIH0gY2F0Y2ggKGU6YW55KSB7XG4gICAgICAgICAgZXJyb3JzLnB1c2goYFske29wdHMudHJhbnNsYXRpb25Db2RlfV0gJHtzaG9ydEJvb2t9IGNoLiR7Y2h9OiAke2U/Lm1lc3NhZ2UgPz8gZX1gKTtcbiAgICAgICAgICBjaHVua3NbY2hdID0gYC0tLVxcbigke3Nob3J0Qm9va30gJHtjaH0pIFx1MjAxNCBmYWlsZWQgdG8gZG93bmxvYWQuXFxuXiR7Y2h9XFxuLS0tXFxuXFxuYDtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBkb25lKys7IG9uUHJvZ3Jlc3MoZG9uZSwgdG90YWwsIGAke3Nob3J0Qm9va30gJHtNYXRoLm1pbihjaCwgYm9vay5jaGFwdGVycyl9LyR7Ym9vay5jaGFwdGVyc31gKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pKCkpO1xuICAgIGF3YWl0IFByb21pc2UuYWxsKHdvcmtlcnMpO1xuXG4gICAgY29uc3QgYm9va0NvbnRlbnQgPSBjaHVua3Muam9pbihcIlwiKTtcbiAgICBjb25zdCBleGlzdGluZyA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgodGFyZ2V0UGF0aCk7XG4gICAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZXhpc3RpbmcsIGJvb2tDb250ZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZSh0YXJnZXRQYXRoLCBib29rQ29udGVudCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGVycm9ycy5sZW5ndGgpIHtcbiAgICAvLyBjb25zdCBsb2dGb2xkZXIgPSBhd2FpdCBlbnN1cmVGb2xkZXIoYXBwLCBgJHtiYXNlRm9sZGVyfS9fbG9nc2ApO1xuICAgIC8vIGNvbnN0IGxvZ1BhdGggPSBub3JtYWxpemVQYXRoKGAke2xvZ0ZvbGRlci5wYXRofS9iaWJsZS1idWlsZC0ke29wdHMudHJhbnNsYXRpb25Db2RlfS0ke0RhdGUubm93KCl9Lm1kYCk7XG4gICAgLy8gY29uc3QgYm9keSA9IFtcbiAgICAvLyAgIGAjIEJ1aWxkIExvZyBcdTIwMTQgJHtvcHRzLnRyYW5zbGF0aW9uQ29kZX1gLFxuICAgIC8vICAgYERhdGU6ICR7bmV3IERhdGUoKS50b1N0cmluZygpfWAsXG4gICAgLy8gICBcIlwiLFxuICAgIC8vICAgLi4uZXJyb3JzLm1hcChlID0+IGAtICR7ZX1gKVxuICAgIC8vIF0uam9pbihcIlxcblwiKTtcbiAgICAvLyBhd2FpdCBhcHAudmF1bHQuY3JlYXRlKGxvZ1BhdGgsIGJvZHkpO1xuICAgIC8vIG5ldyBOb3RpY2UoYEZpbmlzaGVkIHdpdGggJHtlcnJvcnMubGVuZ3RofSBlcnJvcihzKS4gU2VlOiAke2xvZ1BhdGh9YCk7XG4gICAgbmV3IE5vdGljZShgRmluaXNoZWQgd2l0aCAke2Vycm9ycy5sZW5ndGh9IGVycm9yKHMpLmApO1xuICB9IGVsc2Uge1xuICAgIG5ldyBOb3RpY2UoXCJGaW5pc2hlZCB3aXRob3V0IGVycm9ycy5cIik7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLSBDb21tYW5kIGVudHJ5IC0tLS0tLS0tLS1cbmV4cG9ydCBmdW5jdGlvbiBjb21tYW5kQnVpbGRCaWJsZUZyb21Cb2xscyhhcHA6IEFwcCwgX3NldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MpIHtcbiAgbmV3IEJ1aWxkQmlibGVNb2RhbChhcHAsIF9zZXR0aW5ncykub3BlbigpO1xufSIsICJleHBvcnQgY29uc3QgQk9PS19BQkJSOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICBcIkdlbmVzaXNcIjogXCJHZW5cIixcbiAgXCJFeG9kdXNcIjogXCJFeG9cIixcbiAgXCJMZXZpdGljdXNcIjogXCJMZXZcIixcbiAgXCJOdW1iZXJzXCI6IFwiTnVtXCIsXG4gIFwiRGV1dGVyb25vbXlcIjogXCJEZXV0XCIsXG4gIFwiSm9zaHVhXCI6IFwiSm9zaFwiLFxuICBcIkp1ZGdlc1wiOiBcIkp1ZGdcIixcbiAgXCJSdXRoXCI6IFwiUnV0aFwiLFxuICBcIjEgU2FtdWVsXCI6IFwiMSBTYW1cIixcbiAgXCJGaXJzdCBTYW11ZWxcIjogXCIxIFNhbVwiLFxuICBcIjIgU2FtdWVsXCI6IFwiMiBTYW1cIixcbiAgXCJTZWNvbmQgU2FtdWVsXCI6IFwiMiBTYW1cIixcbiAgXCIxIEtpbmdzXCI6IFwiMSBLaW5nc1wiLFxuICBcIkZpcnN0IEtpbmdzXCI6IFwiMSBLaW5nc1wiLFxuICBcIjIgS2luZ3NcIjogXCIyIEtpbmdzXCIsXG4gIFwiU2Vjb25kIEtpbmdzXCI6IFwiMiBLaW5nc1wiLFxuICBcIjEgQ2hyb25pY2xlc1wiOiBcIjEgQ2hyb25cIixcbiAgXCJGaXJzdCBDaHJvbmljbGVzXCI6IFwiMSBDaHJvblwiLFxuICBcIjIgQ2hyb25pY2xlc1wiOiBcIjIgQ2hyb25cIixcbiAgXCJTZWNvbmQgQ2hyb25pY2xlc1wiOiBcIjIgQ2hyb25cIixcbiAgXCJFenJhXCI6IFwiRXpyYVwiLFxuICBcIk5laGVtaWFoXCI6IFwiTmVoXCIsXG4gIFwiRXN0aGVyXCI6IFwiRXN0aFwiLFxuICBcIkpvYlwiOiBcIkpvYlwiLFxuICBcIlBzYWxtc1wiOiBcIlBzYVwiLFxuICBcIlBzYWxtXCI6IFwiUHNhXCIsXG4gIFwiUHJvdmVyYnNcIjogXCJQcm92XCIsXG4gIFwiRWNjbGVzaWFzdGVzXCI6IFwiRWNjbFwiLFxuICBcIlNvbmcgb2YgU29uZ3NcIjogXCJTLlMuXCIsXG4gIFwiU29uZyBvZiBTb2xvbW9uXCI6IFwiUy5TLlwiLFxuICBcIklzYWlhaFwiOiBcIklzYVwiLFxuICBcIkplcmVtaWFoXCI6IFwiSmVyXCIsXG4gIFwiTGFtZW50YXRpb25zXCI6IFwiTGFtXCIsXG4gIFwiRXpla2llbFwiOiBcIkV6ZWtcIixcbiAgXCJEYW5pZWxcIjogXCJEYW5cIixcbiAgXCJIb3NlYVwiOiBcIkhvc2VhXCIsXG4gIFwiSm9lbFwiOiBcIkpvZWxcIixcbiAgXCJBbW9zXCI6IFwiQW1vc1wiLFxuICBcIk9iYWRpYWhcIjogXCJPYmFkXCIsXG4gIFwiSm9uYWhcIjogXCJKb25haFwiLFxuICBcIk1pY2FoXCI6IFwiTWljYWhcIixcbiAgXCJOYWh1bVwiOiBcIk5haHVtXCIsXG4gIFwiSGFiYWtrdWtcIjogXCJIYWJcIixcbiAgXCJaZXBoYW5pYWhcIjogXCJaZXBoXCIsXG4gIFwiSGFnZ2FpXCI6IFwiSGFnXCIsXG4gIFwiWmVjaGFyaWFoXCI6IFwiWmVjaFwiLFxuICBcIk1hbGFjaGlcIjogXCJNYWxcIixcbiAgXCJNYXR0aGV3XCI6IFwiTWF0dFwiLFxuICBcIk1hcmtcIjogXCJNYXJrXCIsXG4gIFwiTHVrZVwiOiBcIkx1a2VcIixcbiAgXCJKb2huXCI6IFwiSm9oblwiLFxuICBcIkFjdHNcIjogXCJBY3RzXCIsXG4gIFwiUm9tYW5zXCI6IFwiUm9tXCIsXG4gIFwiMSBDb3JpbnRoaWFuc1wiOiBcIjEgQ29yXCIsXG4gIFwiRmlyc3QgQ29yaW50aGlhbnNcIjogXCIxIENvclwiLFxuICBcIjIgQ29yaW50aGlhbnNcIjogXCIyIENvclwiLFxuICBcIlNlY29uZCBDb3JpbnRoaWFuc1wiOiBcIjIgQ29yXCIsXG4gIFwiR2FsYXRpYW5zXCI6IFwiR2FsXCIsXG4gIFwiRXBoZXNpYW5zXCI6IFwiRXBoXCIsXG4gIFwiUGhpbGlwcGlhbnNcIjogXCJQaGlsXCIsXG4gIFwiQ29sb3NzaWFuc1wiOiBcIkNvbFwiLFxuICBcIjEgVGhlc3NhbG9uaWFuc1wiOiBcIjEgVGhlc1wiLFxuICBcIkZpcnN0IFRoZXNzYWxvbmlhbnNcIjogXCIxIFRoZXNcIixcbiAgXCIyIFRoZXNzYWxvbmlhbnNcIjogXCIyIFRoZXNcIixcbiAgXCJTZWNvbmQgVGhlc3NhbG9uaWFuc1wiOiBcIjIgVGhlc1wiLFxuICBcIjEgVGltb3RoeVwiOiBcIjEgVGltXCIsXG4gIFwiRmlyc3QgVGltb3RoeVwiOiBcIjEgVGltXCIsXG4gIFwiMiBUaW1vdGh5XCI6IFwiMiBUaW1cIixcbiAgXCJTZWNvbmQgVGltb3RoeVwiOiBcIjIgVGltXCIsXG4gIFwiVGl0dXNcIjogXCJUaXR1c1wiLFxuICBcIlBoaWxlbW9uXCI6IFwiUGhpbGVtXCIsXG4gIFwiSGVicmV3c1wiOiBcIkhlYlwiLFxuICBcIkphbWVzXCI6IFwiSmFtZXNcIixcbiAgXCIxIFBldGVyXCI6IFwiMSBQZXRcIixcbiAgXCJGaXJzdCBQZXRlclwiOiBcIjEgUGV0XCIsXG4gIFwiMiBQZXRlclwiOiBcIjIgUGV0XCIsXG4gIFwiU2Vjb25kIFBldGVyXCI6IFwiMiBQZXRcIixcbiAgXCIxIEpvaG5cIjogXCIxIEpvaG5cIixcbiAgXCJGaXJzdCBKb2huXCI6IFwiMSBKb2huXCIsXG4gIFwiMiBKb2huXCI6IFwiMiBKb2huXCIsXG4gIFwiU2Vjb25kIEpvaG5cIjogXCIyIEpvaG5cIixcbiAgXCIzIEpvaG5cIjogXCIzIEpvaG5cIixcbiAgXCJUaGlyZCBKb2huXCI6IFwiMyBKb2huXCIsXG4gIFwiSnVkZVwiOiBcIkp1ZGVcIixcbiAgXCJSZXZlbGF0aW9uXCI6IFwiUmV2XCJcbn07XG5cbmV4cG9ydCBjb25zdCBBTExfQk9PS19UT0tFTlMgPSAoKCkgPT4ge1xuICBjb25zdCBzZXQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoQk9PS19BQkJSKSkgeyBzZXQuYWRkKGspOyBzZXQuYWRkKHYpOyB9XG4gIHJldHVybiBbLi4uc2V0XS5zb3J0KChhLCBiKSA9PiBiLmxlbmd0aCAtIGEubGVuZ3RoKTtcbn0pKCk7XG5cblxuLyoqIFB5dGhvbi1wYXJpdHkgbWFwcGluZyBmb3IgQmlibGVIdWIgaW50ZXJsaW5lYXIgc2x1Z3MgKi9cbmV4cG9ydCBjb25zdCBCSUJMRUhVQl9JTlRFUkxJTkVBUjogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgXCJHZW5cIjogXCJnZW5lc2lzXCIsXG4gIFwiRXhvXCI6IFwiZXhvZHVzXCIsXG4gIFwiTGV2XCI6IFwibGV2aXRpY3VzXCIsXG4gIFwiTnVtXCI6IFwibnVtYmVyc1wiLFxuICBcIkRldXRcIjogXCJkZXV0ZXJvbm9teVwiLFxuICBcIkpvc2hcIjogXCJqb3NodWFcIixcbiAgXCJKdWRnXCI6IFwianVkZ2VzXCIsXG4gIFwiUnV0aFwiOiBcInJ1dGhcIixcbiAgXCIxIFNhbVwiOiBcIjFfc2FtdWVsXCIsXG4gIFwiMiBTYW1cIjogXCIyX3NhbXVlbFwiLFxuICBcIjEgS2luZ3NcIjogXCIxX2tpbmdzXCIsXG4gIFwiMiBLaW5nc1wiOiBcIjJfa2luZ3NcIixcbiAgXCIxIENocm9uXCI6IFwiMV9jaHJvbmljbGVzXCIsXG4gIFwiMiBDaHJvblwiOiBcIjJfY2hyb25pY2xlc1wiLFxuICBcIkV6cmFcIjogXCJlenJhXCIsXG4gIFwiTmVoXCI6IFwibmVoZW1pYWhcIixcbiAgXCJFc3RoXCI6IFwiZXN0aGVyXCIsXG4gIFwiSm9iXCI6IFwiam9iXCIsXG4gIFwiUHNhXCI6IFwicHNhbG1zXCIsXG4gIFwiUHJvdlwiOiBcInByb3ZlcmJzXCIsXG4gIFwiRWNjbFwiOiBcImVjY2xlc2lhc3Rlc1wiLFxuICBcIlNvU1wiOiBcInNvbmdzXCIsIC8vIFNvbmcgb2YgU29sb21vbiAvIFNvbmcgb2YgU29uZ3NcbiAgXCJTLlMuXCI6IFwic29uZ3NcIiwgLy8gU29uZyBvZiBTb2xvbW9uIC8gU29uZyBvZiBTb25nc1xuICBcIklzYVwiOiBcImlzYWlhaFwiLFxuICBcIkplclwiOiBcImplcmVtaWFoXCIsXG4gIFwiTGFtXCI6IFwibGFtZW50YXRpb25zXCIsXG4gIFwiRXpla1wiOiBcImV6ZWtpZWxcIixcbiAgXCJEYW5cIjogXCJkYW5pZWxcIixcbiAgXCJIb3NlYVwiOiBcImhvc2VhXCIsXG4gIFwiSm9lbFwiOiBcImpvZWxcIixcbiAgXCJBbW9zXCI6IFwiYW1vc1wiLFxuICBcIk9iYWRcIjogXCJvYmFkaWFoXCIsXG4gIFwiSm9uYWhcIjogXCJqb25haFwiLFxuICBcIk1pY2FoXCI6IFwibWljYWhcIixcbiAgXCJOYWhcIjogXCJuYWh1bVwiLFxuICBcIkhhYlwiOiBcImhhYmFra3VrXCIsXG4gIFwiWmVwXCI6IFwiemVwaGFuaWFoXCIsXG4gIFwiWmVwaFwiOiBcInplcGhhbmlhaFwiLFxuICBcIkhhZ1wiOiBcImhhZ2dhaVwiLFxuICBcIlplY2hcIjogXCJ6ZWNoYXJpYWhcIixcbiAgXCJNYWxcIjogXCJtYWxhY2hpXCIsXG4gIFwiTWF0dFwiOiBcIm1hdHRoZXdcIixcbiAgXCJNYXJrXCI6IFwibWFya1wiLFxuICBcIkx1a2VcIjogXCJsdWtlXCIsXG4gIFwiSm9oblwiOiBcImpvaG5cIixcbiAgXCJBY3RzXCI6IFwiYWN0c1wiLFxuICBcIlJvbVwiOiBcInJvbWFuc1wiLFxuICBcIjEgQ29yXCI6IFwiMV9jb3JpbnRoaWFuc1wiLFxuICBcIjIgQ29yXCI6IFwiMl9jb3JpbnRoaWFuc1wiLFxuICBcIkdhbFwiOiBcImdhbGF0aWFuc1wiLFxuICBcIkVwaFwiOiBcImVwaGVzaWFuc1wiLFxuICBcIlBoaWxcIjogXCJwaGlsaXBwaWFuc1wiLFxuICBcIkNvbFwiOiBcImNvbG9zc2lhbnNcIixcbiAgXCIxIFRoZXNcIjogXCIxX3RoZXNzYWxvbmlhbnNcIixcbiAgXCIyIFRoZXNcIjogXCIyX3RoZXNzYWxvbmlhbnNcIixcbiAgXCIxIFRpbVwiOiBcIjFfdGltb3RoeVwiLFxuICBcIjIgVGltXCI6IFwiMl90aW1vdGh5XCIsXG4gIFwiVGl0dXNcIjogXCJ0aXR1c1wiLFxuICBcIlBoaWxlbVwiOiBcInBoaWxlbW9uXCIsXG4gIFwiSGViXCI6IFwiaGVicmV3c1wiLFxuICBcIkphbWVzXCI6IFwiamFtZXNcIixcbiAgXCIxIFBldFwiOiBcIjFfcGV0ZXJcIixcbiAgXCIyIFBldFwiOiBcIjJfcGV0ZXJcIixcbiAgXCIxIEpvaG5cIjogXCIxX2pvaG5cIixcbiAgXCIyIEpvaG5cIjogXCIyX2pvaG5cIixcbiAgXCIzIEpvaG5cIjogXCIzX2pvaG5cIixcbiAgXCJKdWRlXCI6IFwianVkZVwiLFxuICBcIlJldlwiOiBcInJldmVsYXRpb25cIlxufSIsICJpbXBvcnQgeyBBcHAsIFNldHRpbmcsIE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IEJhc2VCb2xsc01vZGFsIH0gZnJvbSBcIi4vYm9sbHMtYmFzZS1tb2RhbFwiO1xuaW1wb3J0IHsgYnVpbGRCaWJsZUZyb21Cb2xscyB9IGZyb20gXCIuLi9jb21tYW5kcy9nZW5lcmF0ZS1iaWJsZVwiO1xuXG5leHBvcnQgY2xhc3MgQnVpbGRCaWJsZU1vZGFsIGV4dGVuZHMgQmFzZUJvbGxzTW9kYWwge1xuICBwcml2YXRlIGluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZTogYm9vbGVhbjtcbiAgcHJpdmF0ZSB2ZXJzaW9uQXNTdWJmb2xkZXI6IGJvb2xlYW47XG4gIHByaXZhdGUgYXV0b0Zyb250bWF0dGVyOiBib29sZWFuO1xuICBwcml2YXRlIGNvbmN1cnJlbmN5ID0gNDtcblxuICAvLyBwcm9ncmVzc1xuICBwcml2YXRlIHByb2dyZXNzRWwhOiBIVE1MUHJvZ3Jlc3NFbGVtZW50O1xuICBwcml2YXRlIHN0YXR1c0VsITogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgc3RhcnRCdG4hOiBIVE1MQnV0dG9uRWxlbWVudDtcbiAgcHJpdmF0ZSB3b3JraW5nID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MpIHtcbiAgICBzdXBlcihhcHAsIHNldHRpbmdzLCB7XG4gICAgICBsYW5ndWFnZUxhYmVsOiBzZXR0aW5ncy5iaWJsZURlZmF1bHRMYW5ndWFnZSA/PyBudWxsLFxuICAgICAgdmVyc2lvblNob3J0OiAgc2V0dGluZ3MuYmlibGVEZWZhdWx0VmVyc2lvbiAgPz8gdW5kZWZpbmVkLFxuICAgIH0pO1xuXG4gICAgdGhpcy5pbmNsdWRlVmVyc2lvbkluRmlsZU5hbWUgPSBzZXR0aW5ncy5iaWJsZUluY2x1ZGVWZXJzaW9uSW5GaWxlbmFtZSA/PyB0cnVlO1xuICAgIC8vIEZJWDogdXNlIHRoZSBkZWRpY2F0ZWQgc2V0dGluZyBmb3Igc3ViZm9sZGVyICh3YXMgcG9pbnRpbmcgdG8gdGhlIGZpbGVuYW1lIGZsYWcpXG4gICAgdGhpcy52ZXJzaW9uQXNTdWJmb2xkZXIgICAgICAgPSAoc2V0dGluZ3MgYXMgYW55KS5iaWJsZVZlcnNpb25Bc1N1YmZvbGRlciA/PyB0cnVlO1xuICAgIHRoaXMuYXV0b0Zyb250bWF0dGVyID0gc2V0dGluZ3MuYmlibGVBZGRGcm9udG1hdHRlciA/PyBmYWxzZTtcbiAgICB0aGlzLmRpc2FsbG93RGVmYXVsdCA9IHRydWU7XG4gIH1cblxuICBwcm90ZWN0ZWQgcmVuZGVyRXh0cmFPcHRpb25zKGNvbnRlbnRFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIkFwcGVuZCB2ZXJzaW9uIHRvIGZpbGUgbmFtZVwiKVxuICAgICAgLnNldERlc2MoYFwiSm9obiAoS0pWKVwiIHZzIFwiSm9oblwiYClcbiAgICAgIC5hZGRUb2dnbGUodCA9PlxuICAgICAgICB0LnNldFZhbHVlKHRoaXMuaW5jbHVkZVZlcnNpb25JbkZpbGVOYW1lKVxuICAgICAgICAgLm9uQ2hhbmdlKHYgPT4gKHRoaXMuaW5jbHVkZVZlcnNpb25JbkZpbGVOYW1lID0gdikpXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJQbGFjZSBib29rcyB1bmRlciB2ZXJzaW9uIHN1YmZvbGRlclwiKVxuICAgICAgLnNldERlc2MoYFwiQmlibGUvS0pWL0pvaG4gKEtKVilcIiB2cyBcIkJpYmxlL0pvaG5cImApXG4gICAgICAuYWRkVG9nZ2xlKHQgPT5cbiAgICAgICAgdC5zZXRWYWx1ZSh0aGlzLnZlcnNpb25Bc1N1YmZvbGRlcilcbiAgICAgICAgIC5vbkNoYW5nZSh2ID0+ICh0aGlzLnZlcnNpb25Bc1N1YmZvbGRlciA9IHYpKVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5zZXROYW1lKFwiQXV0by1hZGQgZnJvbnRtYXR0ZXJcIilcbiAgICAgIC5zZXREZXNjKFwiSW5zZXJ0IFlBTUwgd2l0aCB0aXRsZS92ZXJzaW9uL2NyZWF0ZWQgaW50byBlYWNoIGJvb2sgZmlsZVwiKVxuICAgICAgLmFkZFRvZ2dsZSh0ID0+XG4gICAgICAgIHQuc2V0VmFsdWUodGhpcy5hdXRvRnJvbnRtYXR0ZXIpXG4gICAgICAgICAub25DaGFuZ2UodiA9PiAodGhpcy5hdXRvRnJvbnRtYXR0ZXIgPSB2KSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIkNvbmN1cnJlbmN5XCIpXG4gICAgICAuc2V0RGVzYyhcIkhvdyBtYW55IGNoYXB0ZXJzIHRvIGRvd25sb2FkIGluIHBhcmFsbGVsXCIpXG4gICAgICAuYWRkU2xpZGVyKHMgPT5cbiAgICAgICAgcy5zZXRMaW1pdHMoMSwgOCwgMSlcbiAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLmNvbmN1cnJlbmN5KVxuICAgICAgICAgLm9uQ2hhbmdlKHYgPT4gKHRoaXMuY29uY3VycmVuY3kgPSB2KSlcbiAgICAgICAgIC5zZXREeW5hbWljVG9vbHRpcCgpXG4gICAgICApO1xuICB9XG5cbiAgcHJvdGVjdGVkIHJlbmRlckZvb3Rlcihjb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgcHJvZ1dyYXAgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcImJvbGxzLXByb2dyZXNzXCIgfSk7XG4gICAgdGhpcy5wcm9ncmVzc0VsID0gcHJvZ1dyYXAuY3JlYXRlRWwoXCJwcm9ncmVzc1wiKTtcbiAgICB0aGlzLnByb2dyZXNzRWwubWF4ID0gMTAwO1xuICAgIHRoaXMucHJvZ3Jlc3NFbC52YWx1ZSA9IDA7XG5cbiAgICB0aGlzLnN0YXR1c0VsID0gcHJvZ1dyYXAuY3JlYXRlRGl2KHsgdGV4dDogXCJJZGxlLlwiIH0pO1xuXG4gICAgY29uc3QgYnRucyA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwiYm9sbHMtYWN0aW9uc1wiIH0pO1xuICAgIHRoaXMuc3RhcnRCdG4gPSBidG5zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJTdGFydFwiIH0pO1xuICAgIHRoaXMuc3RhcnRCdG4ub25jbGljayA9ICgpID0+IHRoaXMuc3RhcnQoKTtcblxuICAgIGNvbnN0IGNhbmNlbEJ0biA9IGJ0bnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIkNsb3NlXCIgfSk7XG4gICAgY2FuY2VsQnRuLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNsb3NlKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHN0YXJ0KCkge1xuICAgIGlmICh0aGlzLndvcmtpbmcpIHJldHVybjtcbiAgICB0aGlzLndvcmtpbmcgPSB0cnVlO1xuICAgIHRoaXMuc3RhcnRCdG4uZGlzYWJsZWQgPSB0cnVlO1xuXG4gICAgY29uc3QgY29kZSA9ICh0aGlzLnRyYW5zbGF0aW9uQ29kZSA/PyBcIlwiKS50cmltKCk7XG4gICAgaWYgKCFjb2RlKSB7XG4gICAgICBuZXcgTm90aWNlKFwiQ2hvb3NlIGEgdHJhbnNsYXRpb24gY29kZS5cIik7XG4gICAgICB0aGlzLndvcmtpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMuc3RhcnRCdG4uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgYnVpbGRCaWJsZUZyb21Cb2xscyhcbiAgICAgICAgdGhpcy5hcHAsXG4gICAgICAgIHtcbiAgICAgICAgICB0cmFuc2xhdGlvbkNvZGU6IGNvZGUsXG4gICAgICAgICAgdHJhbnNsYXRpb25GdWxsOiB0aGlzLnRyYW5zbGF0aW9uRnVsbCB8fCBjb2RlLFxuICAgICAgICAgIGluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZTogdGhpcy5pbmNsdWRlVmVyc2lvbkluRmlsZU5hbWUsXG4gICAgICAgICAgdmVyc2lvbkFzU3ViZm9sZGVyOiB0aGlzLnZlcnNpb25Bc1N1YmZvbGRlcixcbiAgICAgICAgICBhdXRvRnJvbnRtYXR0ZXI6IHRoaXMuYXV0b0Zyb250bWF0dGVyLFxuICAgICAgICAgIGNvbmN1cnJlbmN5OiB0aGlzLmNvbmN1cnJlbmN5LFxuICAgICAgICAgIGJhc2VGb2xkZXI6IHRoaXMuc2V0dGluZ3MuYmFzZUZvbGRlckJpYmxlIHx8IFwiQmlibGVcIixcbiAgICAgICAgfSxcbiAgICAgICAgKGRvbmU6IG51bWJlciwgdG90YWw6IG51bWJlciwgbXNnOiBhbnkpID0+IHtcbiAgICAgICAgICB0aGlzLnByb2dyZXNzRWwubWF4ID0gdG90YWwgfHwgMTtcbiAgICAgICAgICB0aGlzLnByb2dyZXNzRWwudmFsdWUgPSBNYXRoLm1pbihkb25lLCB0b3RhbCB8fCAxKTtcbiAgICAgICAgICB0aGlzLnN0YXR1c0VsLnNldFRleHQoYCR7ZG9uZX0vJHt0b3RhbH0gXHUwMEI3ICR7bXNnfWApO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5zdGF0dXNFbC5zZXRUZXh0KFwiRG9uZS5cIik7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgbmV3IE5vdGljZShgQmlibGUgYnVpbGQgZmFpbGVkOiAke2U/Lm1lc3NhZ2UgPz8gZX1gKTtcbiAgICAgIHRoaXMuc3RhdHVzRWwuc2V0VGV4dChcIkZhaWxlZC5cIik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMud29ya2luZyA9IGZhbHNlO1xuICAgICAgdGhpcy5zdGFydEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxufSIsICIvLyBzcmMvY29tbWFuZHMvYmlibGVodWJMaW5rcy50c1xuaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBzcGxpdEZyb250bWF0dGVyIH0gZnJvbSBcIi4uL2xpYi9tZC11dGlsc1wiO1xuaW1wb3J0IHtcbiAgYWRkQmlibGVIdWJMaW5rc0luVGV4dCxcbiAgZGV0ZWN0Qm9va1Nob3J0Rm9yRmlsZSxcbiAgcmVtb3ZlQmlibGVIdWJMaW5rc0luVGV4dCxcbn0gZnJvbSBcIi4uL2xpYi9iaWJsZWh1YlwiO1xuaW1wb3J0IHsgQmlibGVIdWJMaW5rc01vZGFsLCBTY29wZUNob2ljZSB9IGZyb20gXCJzcmMvdWkvYmlibGUtaHViLWxpbmtzLW1vZGFsXCI7XG5cbmFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NGaWxlQWRkKGFwcDogQXBwLCBmaWxlOiBURmlsZSk6IFByb21pc2U8eyBjaGFuZ2VkOiBib29sZWFuOyBhZGRlZDogbnVtYmVyOyByZWFzb24/OiBzdHJpbmcgfT4ge1xuICBjb25zdCBib29rU2hvcnQgPSBhd2FpdCBkZXRlY3RCb29rU2hvcnRGb3JGaWxlKGFwcCwgZmlsZSk7XG4gIGlmICghYm9va1Nob3J0KSByZXR1cm4geyBjaGFuZ2VkOiBmYWxzZSwgYWRkZWQ6IDAsIHJlYXNvbjogXCJ1bmtub3duIGJvb2tcIiB9O1xuICBjb25zdCByYXcgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcbiAgY29uc3QgeyB5YW1sLCBib2R5IH0gPSBzcGxpdEZyb250bWF0dGVyKHJhdyk7XG4gIGNvbnN0IHsgdGV4dCwgYWRkZWQgfSA9IGFkZEJpYmxlSHViTGlua3NJblRleHQoYm9keSwgYm9va1Nob3J0KTtcbiAgaWYgKGFkZGVkID4gMCkge1xuICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgKHlhbWwgPz8gXCJcIikgKyB0ZXh0KTtcbiAgICByZXR1cm4geyBjaGFuZ2VkOiB0cnVlLCBhZGRlZCB9O1xuICB9XG4gIHJldHVybiB7IGNoYW5nZWQ6IGZhbHNlLCBhZGRlZDogMCB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBwcm9jZXNzRmlsZVJlbW92ZShhcHA6IEFwcCwgZmlsZTogVEZpbGUpOiBQcm9taXNlPHsgY2hhbmdlZDogYm9vbGVhbjsgcmVtb3ZlZDogbnVtYmVyIH0+IHtcbiAgY29uc3QgcmF3ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIGNvbnN0IHsgeWFtbCwgYm9keSB9ID0gc3BsaXRGcm9udG1hdHRlcihyYXcpO1xuICBjb25zdCB7IHRleHQsIHJlbW92ZWQgfSA9IHJlbW92ZUJpYmxlSHViTGlua3NJblRleHQoYm9keSk7XG4gIGlmIChyZW1vdmVkID4gMCkge1xuICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgKHlhbWwgPz8gXCJcIikgKyB0ZXh0KTtcbiAgICByZXR1cm4geyBjaGFuZ2VkOiB0cnVlLCByZW1vdmVkIH07XG4gIH1cbiAgcmV0dXJuIHsgY2hhbmdlZDogZmFsc2UsIHJlbW92ZWQ6IDAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbW1hbmRBZGRCaWJsZUh1YkxpbmtzKGFwcDogQXBwKSB7XG4gIG5ldyBCaWJsZUh1YkxpbmtzTW9kYWwoYXBwLCBhc3luYyAoc2NvcGU6IFNjb3BlQ2hvaWNlKSA9PiB7XG4gICAgaWYgKHNjb3BlLmtpbmQgPT09IFwiY3VycmVudFwiKSB7XG4gICAgICBjb25zdCBmID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICBpZiAoIWYpIHsgbmV3IE5vdGljZShcIk9wZW4gYSBNYXJrZG93biBmaWxlIGZpcnN0LlwiKTsgcmV0dXJuOyB9XG4gICAgICBpZiAoZi5leHRlbnNpb24gIT09IFwibWRcIikgeyBuZXcgTm90aWNlKFwiQ3VycmVudCBmaWxlIGlzIG5vdCBhIE1hcmtkb3duIGZpbGUuXCIpOyByZXR1cm47IH1cbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBwcm9jZXNzRmlsZUFkZChhcHAsIGYpO1xuICAgICAgaWYgKHIuY2hhbmdlZCkgbmV3IE5vdGljZShgQWRkZWQgJHtyLmFkZGVkfSBCaWJsZUh1YiBsaW5rKHMpLmApO1xuICAgICAgZWxzZSBuZXcgTm90aWNlKHIucmVhc29uID8gYE5vIGxpbmtzIGFkZGVkICgke3IucmVhc29ufSkuYCA6IFwiTm8gbGluZXMgd2l0aCBeY2hhcHRlci12ZXJzZSBhbmNob3JzIGZvdW5kLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBmb2xkZXIgc2NvcGUgKG5vbi1yZWN1cnNpdmUsIC5tZCBvbmx5KVxuICAgIGNvbnN0IGZvbGRlciA9IHNjb3BlLmZvbGRlcjtcbiAgICBsZXQgYWRkZWRUb3RhbCA9IDAsIGNoYW5nZWRGaWxlcyA9IDAsIHNraXBwZWQgPSAwO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBURmlsZSAmJiBjaGlsZC5leHRlbnNpb24gPT09IFwibWRcIikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHIgPSBhd2FpdCBwcm9jZXNzRmlsZUFkZChhcHAsIGNoaWxkKTtcbiAgICAgICAgICBpZiAoci5jaGFuZ2VkKSB7IGNoYW5nZWRGaWxlcysrOyBhZGRlZFRvdGFsICs9IHIuYWRkZWQ7IH1cbiAgICAgICAgICBlbHNlIGlmIChyLnJlYXNvbiA9PT0gXCJ1bmtub3duIGJvb2tcIikge1xuICAgICAgICAgICAgc2tpcHBlZCsrO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbQmlibGVIdWJdIFNraXBwZWQgJHtjaGlsZC5wYXRofTogdW5rbm93biBib29rLmApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybihcIltCaWJsZUh1Yl0gRmFpbGVkIG9uXCIsIGNoaWxkLnBhdGgsIGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIG5ldyBOb3RpY2UoYEJpYmxlSHViIGxpbmtzOiArJHthZGRlZFRvdGFsfSBpbiAke2NoYW5nZWRGaWxlc30gZmlsZShzKS4gU2tpcHBlZCAodW5rbm93biBib29rKTogJHtza2lwcGVkfS5gKTtcbiAgfSkub3BlbigpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tbWFuZFJlbW92ZUJpYmxlSHViTGlua3MoYXBwOiBBcHApIHtcbiAgbmV3IEJpYmxlSHViTGlua3NNb2RhbChhcHAsIGFzeW5jIChzY29wZTogU2NvcGVDaG9pY2UpID0+IHtcbiAgICBpZiAoc2NvcGUua2luZCA9PT0gXCJjdXJyZW50XCIpIHtcbiAgICAgIGNvbnN0IGYgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICAgIGlmICghZikgeyBuZXcgTm90aWNlKFwiT3BlbiBhIE1hcmtkb3duIGZpbGUgZmlyc3QuXCIpOyByZXR1cm47IH1cbiAgICAgIGlmIChmLmV4dGVuc2lvbiAhPT0gXCJtZFwiKSB7IG5ldyBOb3RpY2UoXCJDdXJyZW50IGZpbGUgaXMgbm90IGEgTWFya2Rvd24gZmlsZS5cIik7IHJldHVybjsgfVxuICAgICAgY29uc3QgciA9IGF3YWl0IHByb2Nlc3NGaWxlUmVtb3ZlKGFwcCwgZik7XG4gICAgICBpZiAoci5jaGFuZ2VkKSBuZXcgTm90aWNlKGBSZW1vdmVkICR7ci5yZW1vdmVkfSBCaWJsZUh1YiBsaW5rKHMpLmApO1xuICAgICAgZWxzZSBuZXcgTm90aWNlKFwiTm8gQmlibGVIdWIgbGlua3MgdG8gcmVtb3ZlLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmb2xkZXIgPSBzY29wZS5mb2xkZXI7XG4gICAgbGV0IHJlbW92ZWRUb3RhbCA9IDAsIGNoYW5nZWRGaWxlcyA9IDA7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIFRGaWxlICYmIGNoaWxkLmV4dGVuc2lvbiA9PT0gXCJtZFwiKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgciA9IGF3YWl0IHByb2Nlc3NGaWxlUmVtb3ZlKGFwcCwgY2hpbGQpO1xuICAgICAgICAgIGlmIChyLmNoYW5nZWQpIHsgY2hhbmdlZEZpbGVzKys7IHJlbW92ZWRUb3RhbCArPSByLnJlbW92ZWQ7IH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybihcIltCaWJsZUh1Yl0gUmVtb3ZlIGZhaWxlZCBvblwiLCBjaGlsZC5wYXRoLCBlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBuZXcgTm90aWNlKGBCaWJsZUh1YiBsaW5rcyByZW1vdmVkOiAtJHtyZW1vdmVkVG90YWx9IGluICR7Y2hhbmdlZEZpbGVzfSBmaWxlKHMpLmApO1xuICB9KS5vcGVuKCk7XG59IiwgIi8vIHNyYy9saWIvYmlibGVodWIudHNcbmltcG9ydCB7IEFwcCwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IHNwbGl0RnJvbnRtYXR0ZXIgfSBmcm9tIFwiLi9tZC11dGlsc1wiO1xuaW1wb3J0IHsgQklCTEVIVUJfSU5URVJMSU5FQVIsIEJPT0tfQUJCUiB9IGZyb20gXCIuL3R5cGVzXCI7XG5cblxuLyoqIE5vcm1hbGl6ZSBhIHJhdyBcImJvb2sgdGl0bGVcIiB0byBvdXIgc2hvcnQga2V5ICh1c2VzIEJPT0tfQUJCUikuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplVG9TaG9ydEJvb2socmF3OiBzdHJpbmcgfCB1bmRlZmluZWQgfCBudWxsKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghcmF3KSByZXR1cm4gbnVsbDtcbiAgbGV0IHMgPSBTdHJpbmcocmF3KS50cmltKCk7XG4gIC8vIHN0cmlwIFtbLi4uXV0gYW5kIHBhcmVudGhlc2VzIGxpa2UgXCJKb2huIChLSlYpXCJcbiAgcyA9IHMucmVwbGFjZSgvXlxcW1xcW3xcXF1cXF0kL2csIFwiXCIpLnJlcGxhY2UoL1xccypcXChbXildK1xcKVxccyokLywgXCJcIik7XG4gIC8vIHRyeSBkaXJlY3Qgc2hvcnQga2V5XG4gIGlmIChCSUJMRUhVQl9JTlRFUkxJTkVBUltzXSkgcmV0dXJuIHM7XG4gIC8vIHRyeSBsb25nIC0+IHNob3J0IHZpYSBCT09LX0FCQlJcbiAgaWYgKChCT09LX0FCQlIgYXMgYW55KVtzXSkgcmV0dXJuIChCT09LX0FCQlIgYXMgYW55KVtzXTtcbiAgLy8gc29tZXRpbWVzIHBlb3BsZSB1c2UgYWJicmV2aWF0aW9ucyB3aXRoIHRyYWlsaW5nIGRvdFxuICBzID0gcy5yZXBsYWNlKC9cXC4kLywgXCJcIik7XG4gIGlmICgoQk9PS19BQkJSIGFzIGFueSlbc10pIHJldHVybiAoQk9PS19BQkJSIGFzIGFueSlbc107XG4gIGlmIChCSUJMRUhVQl9JTlRFUkxJTkVBUltzXSkgcmV0dXJuIHM7XG4gIHJldHVybiBudWxsO1xufVxuXG4vKiogVHJ5IHRvIGRlcml2ZSBib29rIHNob3J0IGNvZGUgZm9yIGEgZmlsZSAoZnJvbnRtYXR0ZXIgPiBmaWxlbmFtZSkuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGV0ZWN0Qm9va1Nob3J0Rm9yRmlsZShhcHA6IEFwcCwgZmlsZTogVEZpbGUpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgY29uc3QgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICBjb25zdCB7IHlhbWwgfSA9IHNwbGl0RnJvbnRtYXR0ZXIoY29udGVudCk7XG4gIC8vIDEpIGZyb250bWF0dGVyIGtleXMgdGhhdCBtaWdodCBjYXJyeSB0aGUgYm9vayBuYW1lXG4gIGlmICh5YW1sKSB7XG4gICAgY29uc3QgbSA9IHlhbWwubWF0Y2goLyg/Ol58XFxuKWJvb2tbXy1dP3RpdGxlOlxccyooXCI/KShbXlxcblwiXSspXFwxL2kpO1xuICAgIGlmIChtKSB7XG4gICAgICBjb25zdCBmcm9tRm0gPSBub3JtYWxpemVUb1Nob3J0Qm9vayhtWzJdKTtcbiAgICAgIGlmIChmcm9tRm0pIHJldHVybiBmcm9tRm07XG4gICAgfVxuICAgIGNvbnN0IHQgPSB5YW1sLm1hdGNoKC8oPzpefFxcbil0aXRsZTpcXHMqKFwiPykoW15cXG5cIl0rKVxcMS9pKTtcbiAgICBpZiAodCkge1xuICAgICAgY29uc3QgZnJvbVRpdGxlID0gbm9ybWFsaXplVG9TaG9ydEJvb2sodFsyXSk7XG4gICAgICBpZiAoZnJvbVRpdGxlKSByZXR1cm4gZnJvbVRpdGxlO1xuICAgIH1cbiAgfVxuICAvLyAyKSBmYWxsIGJhY2sgdG8gYmFzZW5hbWVcbiAgY29uc3QgYmFzZSA9IGZpbGUuYmFzZW5hbWU7XG4gIGNvbnN0IGZyb21OYW1lID0gbm9ybWFsaXplVG9TaG9ydEJvb2soYmFzZSk7XG4gIGlmIChmcm9tTmFtZSkgcmV0dXJuIGZyb21OYW1lO1xuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIEFkZCBhIEJpYmxlSHViIGludGVybGluZWFyIGxpbmsgYmVmb3JlIGEgdHJhaWxpbmcgYW5jaG9yIFwiIF5OXCIgb3IgXCIgXk4tTVwiLiAoUHl0aG9uIHBhcml0eSkgKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRCaWJsZUh1YkxpbmtUb0xpbmUobGluZTogc3RyaW5nLCBib29rU2hvcnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vIElmIHRoZXJlJ3MgYWxyZWFkeSBhIGJpYmxlaHViIGludGVybGluZWFyIGxpbmsgcmlnaHQgYmVmb3JlIHRoZSBhbmNob3IsIHNraXBcbiAgY29uc3QgYWxyZWFkeSA9IC9cXFtcXHMqXFxdXFwoaHR0cHM/OlxcL1xcL2JpYmxlaHViXFwuY29tXFwvaW50ZXJsaW5lYXJcXC9bXlxcKV0rXFwpXFxzK1xcXlxcZCsoPzotXFxkKyk/XFxzKiQvLnRlc3QobGluZSk7XG4gIGlmIChhbHJlYWR5KSByZXR1cm4gbGluZTtcblxuICBjb25zdCBtID0gbGluZS5tYXRjaCgvKFxcc1xcXihcXGQrKD86LVxcZCspPykpJC8pO1xuICBpZiAoIW0pIHJldHVybiBsaW5lO1xuXG4gIGNvbnN0IGNoYXB0ZXJWZXJzZSA9IG1bMl07XG4gIGNvbnN0IHNsdWcgPSBCSUJMRUhVQl9JTlRFUkxJTkVBUltib29rU2hvcnRdO1xuICBpZiAoIXNsdWcpIHJldHVybiBsaW5lO1xuXG4gIGNvbnN0IHVybCA9IGBodHRwczovL2JpYmxlaHViLmNvbS9pbnRlcmxpbmVhci8ke3NsdWd9LyR7Y2hhcHRlclZlcnNlfS5odG1gO1xuICAvLyBJbnNlcnQgXCIgW10odXJsKVwiIGJlZm9yZSB0aGUgYW5jaG9yIChwcmVzZXJ2ZSB0aGUgb3JpZ2luYWwgYW5jaG9yIHRhaWwgaW4gYSBiYWNrcmVmKVxuICByZXR1cm4gbGluZS5yZXBsYWNlKC8oXFxzXFxeKFxcZCspKC1cXGQrKT8pJC8sIGAgWyBdKCR7dXJsfSkkMWApO1xufVxuXG4vKiogUmVtb3ZlIGFueSBcIiBbXShodHRwczovL2JpYmxlaHViLmNvbS9pbnRlcmxpbmVhci8uLi4pXCIgaW1tZWRpYXRlbHkgYmVmb3JlIGEgdHJhaWxpbmcgYW5jaG9yLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUJpYmxlSHViTGlua0Zyb21MaW5lKGxpbmU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBsaW5lLnJlcGxhY2UoXG4gICAgL1xcc1xcW1xccypcXF1cXChodHRwcz86XFwvXFwvYmlibGVodWJcXC5jb21cXC9pbnRlcmxpbmVhclxcL1teXFwpXStcXClcXHMrKD89XFxeXFxkKyg/Oi1cXGQrKT9cXHMqJCkvLFxuICAgIFwiIFwiXG4gICk7XG59XG5cbi8qKiBQcm9jZXNzIGVudGlyZSB0ZXh0IGJvZHkgKFlBTUwgbXVzdCBiZSBzdHJpcHBlZCBvdXQgYmVmb3JlaGFuZCkuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkQmlibGVIdWJMaW5rc0luVGV4dChib2R5OiBzdHJpbmcsIGJvb2tTaG9ydDogc3RyaW5nKTogeyB0ZXh0OiBzdHJpbmc7IGFkZGVkOiBudW1iZXIgfSB7XG4gIGNvbnN0IGxpbmVzID0gYm9keS5zcGxpdCgvXFxyP1xcbi8pO1xuICBsZXQgYWRkZWQgPSAwO1xuICBjb25zdCBvdXQgPSBsaW5lcy5tYXAoKGxuKSA9PiB7XG4gICAgY29uc3QgbmV4dCA9IGFkZEJpYmxlSHViTGlua1RvTGluZShsbiwgYm9va1Nob3J0KTtcbiAgICBpZiAobmV4dCAhPT0gbG4pIGFkZGVkKys7XG4gICAgcmV0dXJuIG5leHQ7XG4gIH0pO1xuICByZXR1cm4geyB0ZXh0OiBvdXQuam9pbihcIlxcblwiKSwgYWRkZWQgfTtcbn1cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVCaWJsZUh1YkxpbmtzSW5UZXh0KGJvZHk6IHN0cmluZyk6IHsgdGV4dDogc3RyaW5nOyByZW1vdmVkOiBudW1iZXIgfSB7XG4gIGNvbnN0IGxpbmVzID0gYm9keS5zcGxpdCgvXFxyP1xcbi8pO1xuICBsZXQgcmVtb3ZlZCA9IDA7XG4gIGNvbnN0IG91dCA9IGxpbmVzLm1hcCgobG4pID0+IHtcbiAgICBjb25zdCBuZXh0ID0gcmVtb3ZlQmlibGVIdWJMaW5rRnJvbUxpbmUobG4pO1xuICAgIGlmIChuZXh0ICE9PSBsbikgcmVtb3ZlZCsrO1xuICAgIHJldHVybiBuZXh0O1xuICB9KTtcbiAgcmV0dXJuIHsgdGV4dDogb3V0LmpvaW4oXCJcXG5cIiksIHJlbW92ZWQgfTtcbn0iLCAiLy8gc3JjL3VpL0JpYmxlSHViTGlua3NNb2RhbC50c1xuaW1wb3J0IHsgQXBwLCBNb2RhbCwgTm90aWNlLCBTZXR0aW5nLCBURmlsZSwgVEZvbGRlciB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgRm9sZGVyU3VnZ2VzdE1vZGFsIH0gZnJvbSBcIi4vZm9sZGVyLXN1Z2dlc3QtbW9kYWxcIjtcblxuZXhwb3J0IHR5cGUgU2NvcGVDaG9pY2UgPSB7IGtpbmQ6IFwiY3VycmVudFwiIH0gfCB7IGtpbmQ6IFwiZm9sZGVyXCI7IGZvbGRlcjogVEZvbGRlciB9O1xuXG5leHBvcnQgY2xhc3MgQmlibGVIdWJMaW5rc01vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIGFwcFJlZjogQXBwO1xuICBwcml2YXRlIG9uUnVuOiAoc2NvcGU6IFNjb3BlQ2hvaWNlKSA9PiB2b2lkO1xuXG4gIHByaXZhdGUgX3Njb3BlOiBcImN1cnJlbnRcIiB8IFwiZm9sZGVyXCIgPSBcImN1cnJlbnRcIjtcbiAgcHJpdmF0ZSBjaG9zZW5Gb2xkZXI6IFRGb2xkZXIgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgb25SdW46IChzY29wZTogU2NvcGVDaG9pY2UpID0+IHZvaWQpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuYXBwUmVmID0gYXBwO1xuICAgIHRoaXMub25SdW4gPSBvblJ1bjtcbiAgfVxuXG4gIG9uT3BlbigpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChcIkJpYmxlSHViIGludGVybGluZWFyIGxpbmtzXCIpO1xuXG4gICAgLy8gU2NvcGUgcmFkaW9cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIlNjb3BlXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRkKSA9PiB7XG4gICAgICAgIGRkLmFkZE9wdGlvbihcImN1cnJlbnRcIiwgXCJDdXJyZW50IGZpbGVcIik7XG4gICAgICAgIGRkLmFkZE9wdGlvbihcImZvbGRlclwiLCBcIlBpY2sgZm9sZGVyXHUyMDI2XCIpO1xuICAgICAgICBkZC5zZXRWYWx1ZSh0aGlzLl9zY29wZSk7XG4gICAgICAgIGRkLm9uQ2hhbmdlKCh2KSA9PiB7XG4gICAgICAgICAgdGhpcy5fc2NvcGUgPSB2IGFzIFwiY3VycmVudFwiIHwgXCJmb2xkZXJcIjtcbiAgICAgICAgICBmb2xkZXJSb3cuc2V0dGluZ0VsLnRvZ2dsZSh0aGlzLl9zY29wZSA9PT0gXCJmb2xkZXJcIik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAvLyBGb2xkZXIgcGlja2VyIHJvd1xuICAgIGNvbnN0IGZvbGRlclJvdyA9IG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5zZXROYW1lKFwiRm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkNob29zZSBhIGZvbGRlciB0byBwcm9jZXNzIGFsbCAubWQgZmlsZXMgaW5zaWRlIChub24tcmVjdXJzaXZlKS5cIilcbiAgICAgIC5hZGRCdXR0b24oKGIpID0+XG4gICAgICAgIGJcbiAgICAgICAgICAuc2V0QnV0dG9uVGV4dCh0aGlzLmNob3NlbkZvbGRlciA/IHRoaXMuY2hvc2VuRm9sZGVyLnBhdGggOiBcIlBpY2tcdTIwMjZcIilcbiAgICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgICBuZXcgRm9sZGVyU3VnZ2VzdE1vZGFsKHRoaXMuYXBwUmVmLCAoZikgPT4ge1xuICAgICAgICAgICAgICB0aGlzLmNob3NlbkZvbGRlciA9IGY7XG4gICAgICAgICAgICAgIGIuc2V0QnV0dG9uVGV4dChmLnBhdGgpO1xuICAgICAgICAgICAgfSkub3BlbigpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuICAgIGZvbGRlclJvdy5zZXR0aW5nRWwudG9nZ2xlKHRoaXMuX3Njb3BlID09PSBcImZvbGRlclwiKTtcblxuICAgIC8vIFJ1bi9DYW5jZWxcbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuYWRkQnV0dG9uKChiKSA9PlxuICAgICAgICBiLnNldEN0YSgpLnNldEJ1dHRvblRleHQoXCJSdW5cIikub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuX3Njb3BlID09PSBcImZvbGRlclwiKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuY2hvc2VuRm9sZGVyKSB7XG4gICAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJQaWNrIGEgZm9sZGVyIGZpcnN0LlwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgdGhpcy5vblJ1bih7IGtpbmQ6IFwiZm9sZGVyXCIsIGZvbGRlcjogdGhpcy5jaG9zZW5Gb2xkZXIgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMub25SdW4oeyBraW5kOiBcImN1cnJlbnRcIiB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICApXG4gICAgICAuYWRkRXh0cmFCdXR0b24oKGIpID0+IGIuc2V0SWNvbihcInhcIikuc2V0VG9vbHRpcChcIkNhbmNlbFwiKS5vbkNsaWNrKCgpID0+IHRoaXMuY2xvc2UoKSkpO1xuICB9XG59IiwgIi8vIHNyYy91aS9Gb2xkZXJTdWdnZXN0TW9kYWwudHNcbmltcG9ydCB7IEFwcCwgRnV6enlTdWdnZXN0TW9kYWwsIFRGb2xkZXIsIFZhdWx0IH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBjbGFzcyBGb2xkZXJTdWdnZXN0TW9kYWwgZXh0ZW5kcyBGdXp6eVN1Z2dlc3RNb2RhbDxURm9sZGVyPiB7XG4gIHByaXZhdGUgYXBwUmVmOiBBcHA7XG4gIHByaXZhdGUgb25DaG9vc2U6IChmb2xkZXI6IFRGb2xkZXIpID0+IHZvaWQ7XG4gIHByaXZhdGUgZm9sZGVyczogVEZvbGRlcltdO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBvbkNob29zZTogKGZvbGRlcjogVEZvbGRlcikgPT4gdm9pZCkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5hcHBSZWYgPSBhcHA7XG4gICAgdGhpcy5vbkNob29zZSA9IG9uQ2hvb3NlO1xuICAgIHRoaXMuZm9sZGVycyA9IEZvbGRlclN1Z2dlc3RNb2RhbC5jb2xsZWN0Rm9sZGVycyhhcHApO1xuICAgIHRoaXMuc2V0UGxhY2Vob2xkZXIoXCJUeXBlIHRvIGZpbHRlciBmb2xkZXJzXHUyMDI2XCIpO1xuICB9XG5cbiAgZ2V0SXRlbXMoKTogVEZvbGRlcltdIHtcbiAgICByZXR1cm4gdGhpcy5mb2xkZXJzO1xuICB9XG4gIGdldEl0ZW1UZXh0KGl0ZW06IFRGb2xkZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBpdGVtLnBhdGg7XG4gIH1cbiAgb25DaG9vc2VJdGVtKGl0ZW06IFRGb2xkZXIpOiB2b2lkIHtcbiAgICB0aGlzLm9uQ2hvb3NlKGl0ZW0pO1xuICB9XG5cbiAgc3RhdGljIGNvbGxlY3RGb2xkZXJzKGFwcDogQXBwKTogVEZvbGRlcltdIHtcbiAgICBjb25zdCBvdXQ6IFRGb2xkZXJbXSA9IFtdO1xuICAgIFZhdWx0LnJlY3Vyc2VDaGlsZHJlbihhcHAudmF1bHQuZ2V0Um9vdCgpLCAoYWYpID0+IHtcbiAgICAgIGlmIChhZiBpbnN0YW5jZW9mIFRGb2xkZXIpIG91dC5wdXNoKGFmKTtcbiAgICB9KTtcbiAgICByZXR1cm4gb3V0LnNvcnQoKGEsIGIpID0+IGEucGF0aC5sb2NhbGVDb21wYXJlKGIucGF0aCkpO1xuICB9XG59Il0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsb0JBQTZDOzs7QUNBN0MsSUFBQUMsbUJB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LElBQU1DLGFBQW9DO0FBQUEsRUFDL0MsV0FBVztBQUFBLEVBQ1gsVUFBVTtBQUFBLEVBQ1YsYUFBYTtBQUFBLEVBQ2IsV0FBVztBQUFBLEVBQ1gsZUFBZTtBQUFBLEVBQ2YsVUFBVTtBQUFBLEVBQ1YsVUFBVTtBQUFBLEVBQ1YsUUFBUTtBQUFBLEVBQ1IsWUFBWTtBQUFBLEVBQ1osZ0JBQWdCO0FBQUEsRUFDaEIsWUFBWTtBQUFBLEVBQ1osaUJBQWlCO0FBQUEsRUFDakIsV0FBVztBQUFBLEVBQ1gsZUFBZTtBQUFBLEVBQ2YsV0FBVztBQUFBLEVBQ1gsZ0JBQWdCO0FBQUEsRUFDaEIsZ0JBQWdCO0FBQUEsRUFDaEIsb0JBQW9CO0FBQUEsRUFDcEIsZ0JBQWdCO0FBQUEsRUFDaEIscUJBQXFCO0FBQUEsRUFDckIsUUFBUTtBQUFBLEVBQ1IsWUFBWTtBQUFBLEVBQ1osVUFBVTtBQUFBLEVBQ1YsT0FBTztBQUFBLEVBQ1AsVUFBVTtBQUFBLEVBQ1YsU0FBUztBQUFBLEVBQ1QsWUFBWTtBQUFBLEVBQ1osZ0JBQWdCO0FBQUEsRUFDaEIsaUJBQWlCO0FBQUEsRUFDakIsbUJBQW1CO0FBQUEsRUFDbkIsVUFBVTtBQUFBLEVBQ1YsWUFBWTtBQUFBLEVBQ1osZ0JBQWdCO0FBQUEsRUFDaEIsV0FBVztBQUFBLEVBQ1gsVUFBVTtBQUFBLEVBQ1YsU0FBUztBQUFBLEVBQ1QsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsV0FBVztBQUFBLEVBQ1gsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsWUFBWTtBQUFBLEVBQ1osYUFBYTtBQUFBLEVBQ2IsVUFBVTtBQUFBLEVBQ1YsYUFBYTtBQUFBLEVBQ2IsV0FBVztBQUFBLEVBQ1gsV0FBVztBQUFBLEVBQ1gsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsVUFBVTtBQUFBLEVBQ1YsaUJBQWlCO0FBQUEsRUFDakIscUJBQXFCO0FBQUEsRUFDckIsaUJBQWlCO0FBQUEsRUFDakIsc0JBQXNCO0FBQUEsRUFDdEIsYUFBYTtBQUFBLEVBQ2IsYUFBYTtBQUFBLEVBQ2IsZUFBZTtBQUFBLEVBQ2YsY0FBYztBQUFBLEVBQ2QsbUJBQW1CO0FBQUEsRUFDbkIsdUJBQXVCO0FBQUEsRUFDdkIsbUJBQW1CO0FBQUEsRUFDbkIsd0JBQXdCO0FBQUEsRUFDeEIsYUFBYTtBQUFBLEVBQ2IsaUJBQWlCO0FBQUEsRUFDakIsYUFBYTtBQUFBLEVBQ2Isa0JBQWtCO0FBQUEsRUFDbEIsU0FBUztBQUFBLEVBQ1QsWUFBWTtBQUFBLEVBQ1osV0FBVztBQUFBLEVBQ1gsU0FBUztBQUFBLEVBQ1QsV0FBVztBQUFBLEVBQ1gsZUFBZTtBQUFBLEVBQ2YsV0FBVztBQUFBLEVBQ1gsZ0JBQWdCO0FBQUEsRUFDaEIsVUFBVTtBQUFBLEVBQ1YsY0FBYztBQUFBLEVBQ2QsVUFBVTtBQUFBLEVBQ1YsZUFBZTtBQUFBLEVBQ2YsVUFBVTtBQUFBLEVBQ1YsY0FBYztBQUFBLEVBQ2QsUUFBUTtBQUFBLEVBQ1IsY0FBYztBQUNoQjtBQUVPLElBQU0sbUJBQW1CLE1BQU07QUFDcEMsUUFBTSxNQUFNLG9CQUFJLElBQVk7QUFDNUIsYUFBVyxDQUFDLEdBQUcsQ0FBQyxLQUFLLE9BQU8sUUFBUUEsVUFBUyxHQUFHO0FBQUUsUUFBSSxJQUFJLENBQUM7QUFBRyxRQUFJLElBQUksQ0FBQztBQUFBLEVBQUc7QUFDMUUsU0FBTyxDQUFDLEdBQUcsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTTtBQUNwRCxHQUFHO0FBSUksSUFBTSx1QkFBK0M7QUFBQSxFQUMxRCxPQUFPO0FBQUEsRUFDUCxPQUFPO0FBQUEsRUFDUCxPQUFPO0FBQUEsRUFDUCxPQUFPO0FBQUEsRUFDUCxRQUFRO0FBQUEsRUFDUixRQUFRO0FBQUEsRUFDUixRQUFRO0FBQUEsRUFDUixRQUFRO0FBQUEsRUFDUixTQUFTO0FBQUEsRUFDVCxTQUFTO0FBQUEsRUFDVCxXQUFXO0FBQUEsRUFDWCxXQUFXO0FBQUEsRUFDWCxXQUFXO0FBQUEsRUFDWCxXQUFXO0FBQUEsRUFDWCxRQUFRO0FBQUEsRUFDUixPQUFPO0FBQUEsRUFDUCxRQUFRO0FBQUEsRUFDUixPQUFPO0FBQUEsRUFDUCxPQUFPO0FBQUEsRUFDUCxRQUFRO0FBQUEsRUFDUixRQUFRO0FBQUEsRUFDUixPQUFPO0FBQUE7QUFBQSxFQUNQLFFBQVE7QUFBQTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsT0FBTztBQUFBLEVBQ1AsT0FBTztBQUFBLEVBQ1AsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsU0FBUztBQUFBLEVBQ1QsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsT0FBTztBQUFBLEVBQ1AsT0FBTztBQUFBLEVBQ1AsT0FBTztBQUFBLEVBQ1AsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsT0FBTztBQUFBLEVBQ1AsT0FBTztBQUFBLEVBQ1AsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsVUFBVTtBQUFBLEVBQ1YsVUFBVTtBQUFBLEVBQ1YsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsVUFBVTtBQUFBLEVBQ1YsT0FBTztBQUFBLEVBQ1AsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsVUFBVTtBQUFBLEVBQ1YsVUFBVTtBQUFBLEVBQ1YsVUFBVTtBQUFBLEVBQ1YsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUNUOzs7QUNyS0EsSUFBQUMsb0JBQXFDO0FBSzlCLElBQU0sa0JBQU4sY0FBOEIsZUFBZTtBQUFB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LEtBQUssS0FBSyxRQUFRO0FBQUEsSUFDckQsQ0FBQztBQUdELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sVUFBVSxZQUFZLHNCQUFzQixLQUFLLEtBQUssS0FBSyxRQUFRO0FBQUEsSUFDckUsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sVUFBVSxZQUFZO0FBQ3BCLGNBQU0sZ0NBQWdDLEtBQUssS0FBSyxLQUFLLFFBQVE7QUFBQSxNQUMvRDtBQUFBLElBQ0YsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sVUFBVSxZQUFZLHVCQUF1QixLQUFLLEtBQUssS0FBSyxRQUFRO0FBQUEsSUFDdEUsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sVUFBVSxZQUFZLDRCQUE0QixLQUFLLEtBQUssS0FBSyxRQUFRO0FBQUEsSUFDM0UsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sVUFBVSxZQUFZLCtCQUErQixLQUFLLEtBQUssS0FBSyxRQUFRO0FBQUEsSUFDOUUsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sVUFBVSxZQUFZLHdCQUF3QixLQUFLLEtBQUssS0FBSyxRQUFRO0FBQUEsSUFDdkUsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sVUFBVSxZQUFZLHdCQUF3QixLQUFLLEtBQUssS0FBSyxRQUFRO0FBQUEsSUFDdkUsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sVUFBVSxNQUFNLDJCQUEyQixLQUFLLEtBQUssS0FBSyxRQUFRO0FBQUEsSUFDcEUsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sVUFBVSxZQUFZLGtCQUFrQixLQUFLLEtBQUssS0FBSyxRQUFRO0FBQUEsSUFDakUsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBO0FBQUEsTUFDTixnQkFBZ0IsT0FBTyxTQUFTLFVBQVU7QUFDeEMsY0FBTSxpQ0FBaUMsS0FBSyxLQUFLLEtBQUssUUFBUTtBQUFBLE1BQ2hFO0FBQUEsSUFDRixDQUFDO0FBRUQsU0FBSyxXQUFXO0FBQUEsTUFDZCxJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixVQUFVLE1BQU0sK0JBQStCLEtBQUssS0FBSyxLQUFLLFFBQVE7QUFBQSxJQUN4RSxDQUFDO0FBRUQsU0FBSyxXQUFXO0FBQUEsTUFDZCxJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixVQUFVLE1BQU0sOENBQThDLEtBQUssS0FBSyxLQUFLLFFBQVE7QUFBQSxJQUN2RixDQUFDO0FBRUQsU0FBSyxXQUFXO0FBQUEsTUFDZCxJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixVQUFVLE1BQU0sd0JBQXdCLEtBQUssR0FBRztBQUFBLElBQ2xELENBQUM7QUFFRCxTQUFLLFdBQVc7QUFBQSxNQUNkLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxNQUNOLFVBQVUsTUFBTSwyQkFBMkIsS0FBSyxHQUFHO0FBQUEsSUFDckQsQ0FBQztBQUVELHFCQUFpQixJQUFJO0FBQUEsRUFDdkI7QUFBQSxFQUVBLE1BQU0sV0FBVztBQUNmLFlBQVEsSUFBSSw2QkFBd0I7QUFBQSxFQUN0QztBQUFBLEVBRUEsTUFBTSxlQUFlO0FBQ25CLFVBQU0sS0FBSyxTQUFTLEtBQUssUUFBUTtBQUFBLEVBQ25DO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiYmxvY2siLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImNvbnRlbnQiLCAieWFtbCIsICJib2R5IiwgImxpbmtlZCIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImFkZEljb24iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJyYXciLCAiaW1wb3J0X29ic2lkaWFuIiwgIkJPT0tfQUJCUiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiQk9MTFMiLCAiQk9PS19BQkJSIiwgImltcG9ydF9vYnNpZGlhbiIsICJCT09LX0FCQlIiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiJdCn0K
