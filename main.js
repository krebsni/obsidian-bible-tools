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
var import_obsidian21 = require("obsidian");

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

// src/commands/clean-blank-lines.ts
var import_obsidian20 = require("obsidian");

// src/lib/text-clean.ts
function stripAndRemoveEmptyLines(input) {
  const lines = Array.isArray(input) ? input : input.split(/\r?\n/);
  const out = [];
  for (const raw of lines) {
    const s = raw.trim();
    if (s.length) out.push(s);
  }
  return out.join("\n");
}
function stripAndCollapseBlankLines(input, maxConsecutive = 1) {
  const lines = Array.isArray(input) ? input : input.split(/\r?\n/);
  const out = [];
  let blanks = 0;
  for (const raw of lines) {
    const s = raw.trim();
    if (s.length === 0) {
      blanks++;
      if (blanks <= maxConsecutive) out.push("");
    } else {
      blanks = 0;
      out.push(s);
    }
  }
  return out.join("\n");
}

// src/ui/blank-lines-modal.ts
var import_obsidian19 = require("obsidian");
var BlankLinesModal = class extends import_obsidian19.Modal {
  constructor(app, onRun) {
    super(app);
    // UI state
    this._scope = "current";
    this.recursive = true;
    this.chosenFolder = null;
    this.mode = "remove";
    this.maxConsecutive = 1;
    this.onRun = onRun;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText("Clean blank lines");
    new import_obsidian19.Setting(contentEl).setName("Scope").addDropdown((dd) => {
      dd.addOption("current", "Current file");
      dd.addOption("folder", "Pick folder\u2026");
      dd.setValue(this._scope);
      dd.onChange((v) => {
        this._scope = v;
        folderRow.settingEl.toggle(this._scope === "folder");
        recurseRow.settingEl.toggle(this._scope === "folder");
      });
    });
    const folderRow = new import_obsidian19.Setting(contentEl).setName("Folder").setDesc("Process all Markdown files in the folder").addButton(
      (b) => b.setButtonText(this.chosenFolder ? this.chosenFolder.path : "Pick\u2026").onClick(() => {
        new FolderSuggestModal(this.app, (folder) => {
          this.chosenFolder = folder;
          b.setButtonText(folder.path);
        }).open();
      })
    );
    folderRow.settingEl.toggle(this._scope === "folder");
    const recurseRow = new import_obsidian19.Setting(contentEl).setName("Include subfolders").addToggle((t) => t.setValue(this.recursive).onChange((v) => this.recursive = v));
    recurseRow.settingEl.toggle(this._scope === "folder");
    new import_obsidian19.Setting(contentEl).setName("Mode").addDropdown((dd) => {
      dd.addOption("collapse", "Collapse consecutive blanks");
      dd.addOption("remove", "Remove all blank lines");
      dd.setValue(this.mode);
      dd.onChange((v) => {
        this.mode = v;
        maxRow.settingEl.toggle(this.mode === "collapse");
      });
    });
    const maxRow = new import_obsidian19.Setting(contentEl).setName("Max consecutive blanks to keep").setDesc("Used only when collapsing; 1 keeps single empty lines between paragraphs.").addSlider(
      (s) => s.setLimits(0, 3, 1).setValue(this.maxConsecutive).onChange((v) => this.maxConsecutive = v).setDynamicTooltip()
    );
    maxRow.settingEl.toggle(this.mode === "collapse");
    new import_obsidian19.Setting(contentEl).addButton(
      (b) => b.setCta().setButtonText("Run").onClick(() => {
        if (this._scope === "folder" && !this.chosenFolder) {
          new import_obsidian19.Notice("Pick a folder first.");
          return;
        }
        const scope = this._scope === "current" ? { kind: "current" } : { kind: "folder", folder: this.chosenFolder, recursive: this.recursive };
        this.close();
        this.onRun({ scope, mode: this.mode, maxConsecutive: this.maxConsecutive });
      })
    ).addExtraButton((b) => b.setIcon("x").setTooltip("Cancel").onClick(() => this.close()));
  }
};

// src/commands/clean-blank-lines.ts
async function processFile(app, f, choice) {
  if (f.extension !== "md") return;
  const raw = await app.vault.read(f);
  const { yaml, body } = splitFrontmatter(raw);
  let newBody;
  if (choice.mode === "remove") {
    newBody = stripAndRemoveEmptyLines(body);
  } else {
    newBody = stripAndCollapseBlankLines(body, choice.maxConsecutive);
  }
  if (newBody !== body) {
    await app.vault.modify(f, (yaml ?? "") + newBody);
  }
}
function* iterateMarkdownFiles(folder, recursive) {
  for (const child of folder.children) {
    if (child instanceof import_obsidian20.TFile && child.extension === "md") {
      yield child;
    } else if (recursive && child instanceof import_obsidian20.TFolder) {
      yield* iterateMarkdownFiles(child, true);
    }
  }
}
function commandCleanBlankLines(app) {
  new BlankLinesModal(app, async (choice) => {
    if (choice.scope.kind === "current") {
      const file = app.workspace.getActiveFile();
      if (!file) {
        new import_obsidian20.Notice("Open a file first.");
        return;
      }
      await processFile(app, file, choice);
      new import_obsidian20.Notice("Cleaned blank lines in current file.");
      return;
    }
    const { folder, recursive } = choice.scope;
    const tasks = [];
    let count = 0;
    for (const f of iterateMarkdownFiles(folder, recursive)) {
      count++;
      tasks.push(processFile(app, f, choice));
    }
    await Promise.all(tasks);
    new import_obsidian20.Notice(`Cleaned blank lines in ${count} file(s).`);
  }).open();
}

// src/main.ts
var ObsidianBibleTools = class extends import_obsidian21.Plugin {
  async onload() {
    console.log("Loading Bible Tools\u2026");
    registerIcons(import_obsidian21.addIcon);
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
    this.addCommand({
      id: "clean-blank-lines",
      name: "Clean blank lines (remove/collapse)",
      callback: () => commandCleanBlankLines(this.app)
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3NldHRpbmdzLnRzIiwgInNyYy91aS9ib2xscy1waWNrZXItY29tcG9uZW50LnRzIiwgInNyYy9jb21tYW5kcy92ZXJzZS1saW5rcy50cyIsICJzcmMvbGliL21kLXV0aWxzLnRzIiwgInNyYy91aS9waWNrLXZlcnNpb24tbW9kYWwudHMiLCAic3JjL3VpL2JvbGxzLWJhc2UtbW9kYWwudHMiLCAic3JjL2NvbW1hbmRzL2FkZC1uZXh0LXByZXZpb3VzLnRzIiwgInNyYy9jb21tYW5kcy9hZGQtZm9sZGVyLWluZGV4LnRzIiwgInNyYy9saWIvdGV4dC11dGlscy50cyIsICJzcmMvcHJvdG9jb2wudHMiLCAic3JjL2ljb25zLnRzIiwgInNyYy9jb21tYW5kcy9leHRyYWN0LWhpZ2hsaWdodHMtZm9sZGVyLnRzIiwgInNyYy9jb21tYW5kcy9leHRyYWN0LXJlZC1oaWdobGlnaHRzLnRzIiwgInNyYy9jb21tYW5kcy9vdXRsaW5lLWV4dHJhY3Rvci50cyIsICJzcmMvY29tbWFuZHMvb3V0bGluZS1mb3JtYXR0ZXIudHMiLCAic3JjL2xpYi9vdXRsaW5lLXV0aWxzLnRzIiwgInNyYy9jb21tYW5kcy9nZW5lcmF0ZS1iaWJsZS50cyIsICJzcmMvbGliL3R5cGVzLnRzIiwgInNyYy91aS9idWlsZC1iaWJsZS1tb2RhbC50cyIsICJzcmMvY29tbWFuZHMvYmlibGVodWItbGlua3MudHMiLCAic3JjL2xpYi9iaWJsZWh1Yi50cyIsICJzcmMvdWkvYmlibGUtaHViLWxpbmtzLW1vZGFsLnRzIiwgInNyYy91aS9mb2xkZXItc3VnZ2VzdC1tb2RhbC50cyIsICJzcmMvY29tbWFuZHMvY2xlYW4tYmxhbmstbGluZXMudHMiLCAic3JjL2xpYi90ZXh0LWNsZWFuLnRzIiwgInNyYy91aS9ibGFuay1saW5lcy1tb2RhbC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQXBwLCBOb3RpY2UsIFBsdWdpbiwgYWRkSWNvbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzLCBERUZBVUxUX1NFVFRJTkdTLCBCaWJsZVRvb2xzU2V0dGluZ1RhYiB9IGZyb20gXCIuL3NldHRpbmdzXCI7XG5pbXBvcnQgeyByZWdpc3RlclByb3RvY29sIH0gZnJvbSBcIi4vcHJvdG9jb2xcIjtcbmltcG9ydCB7IHJlZ2lzdGVySWNvbnMgfSBmcm9tIFwiLi9pY29uc1wiO1xuXG4vLyBDb21tYW5kc1xuaW1wb3J0IHsgY29tbWFuZEFkZEZvbGRlckluZGV4LCBjb21tYW5kQWRkSW5kZXhGb3JDdXJyZW50Rm9sZGVyIH0gZnJvbSBcIi4vY29tbWFuZHMvYWRkLWZvbGRlci1pbmRleFwiO1xuaW1wb3J0IHsgY29tbWFuZEFkZE5leHRQcmV2aW91cyB9IGZyb20gXCIuL2NvbW1hbmRzL2FkZC1uZXh0LXByZXZpb3VzXCI7XG5pbXBvcnQgeyBjb21tYW5kRXh0cmFjdEhpZ2hsaWdodHNGb2xkZXIgfSBmcm9tIFwiLi9jb21tYW5kcy9leHRyYWN0LWhpZ2hsaWdodHMtZm9sZGVyXCI7XG5pbXBvcnQgeyBjb21tYW5kRXh0cmFjdFJlZEhpZ2hsaWdodHMgfSBmcm9tIFwiLi9jb21tYW5kcy9leHRyYWN0LXJlZC1oaWdobGlnaHRzXCI7XG5pbXBvcnQgeyBjb21tYW5kT3V0bGluZUV4dHJhY3RvciB9IGZyb20gXCIuL2NvbW1hbmRzL291dGxpbmUtZXh0cmFjdG9yXCI7XG5pbXBvcnQgeyBjb21tYW5kT3V0bGluZUZvcm1hdHRlciB9IGZyb20gXCIuL2NvbW1hbmRzL291dGxpbmUtZm9ybWF0dGVyXCI7XG5pbXBvcnQgeyBjb21tYW5kVmVyc2VMaW5rcywgY29tbWFuZFZlcnNlTGlua3NDaG9vc2VWZXJzaW9uLCBjb21tYW5kVmVyc2VMaW5rc1NlbGVjdGlvbk9yTGluZSwgY29tbWFuZFZlcnNlTGlua3NTZWxlY3Rpb25PckxpbmVDaG9vc2VWZXJzaW9uIH0gZnJvbSBcIi4vY29tbWFuZHMvdmVyc2UtbGlua3NcIjtcbmltcG9ydCB7IGNvbW1hbmRCdWlsZEJpYmxlRnJvbUJvbGxzIH0gZnJvbSBcIi4vY29tbWFuZHMvZ2VuZXJhdGUtYmlibGVcIjtcbmltcG9ydCB7IGNvbW1hbmRBZGRCaWJsZUh1YkxpbmtzLCBjb21tYW5kUmVtb3ZlQmlibGVIdWJMaW5rcyB9IGZyb20gXCIuL2NvbW1hbmRzL2JpYmxlaHViLWxpbmtzXCI7XG5pbXBvcnQgeyBjb21tYW5kQ2xlYW5CbGFua0xpbmVzIH0gZnJvbSBcIi4vY29tbWFuZHMvY2xlYW4tYmxhbmstbGluZXNcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2JzaWRpYW5CaWJsZVRvb2xzIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3MhOiBCaWJsZVRvb2xzU2V0dGluZ3M7XG5cbiAgYXN5bmMgb25sb2FkKCkge1xuICAgIGNvbnNvbGUubG9nKFwiTG9hZGluZyBCaWJsZSBUb29sc1x1MjAyNlwiKTtcbiAgICByZWdpc3Rlckljb25zKGFkZEljb24pO1xuXG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG5cbiAgICAvLyBTZXR0aW5ncyBVSVxuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgQmlibGVUb29sc1NldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgIC8vIFJpYmJvbiBpY29uIChkZXNrdG9wKVxuICAgIHRoaXMuYWRkUmliYm9uSWNvbihcIm9idGItYm9va1wiLCBcIkJpYmxlIFRvb2xzOiBGb2xkZXIgSW5kZXhcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgY29tbWFuZEFkZEZvbGRlckluZGV4KHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKTtcbiAgICB9KTtcblxuICAgIC8vIENvbW1hbmRzXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9idGItYWRkLWZvbGRlci1pbmRleFwiLFxuICAgICAgbmFtZTogXCJDcmVhdGUvVXBkYXRlIEZvbGRlciBJbmRleCAoQm9va3MpXCIsXG4gICAgICBpY29uOiBcIm9idGItYm9va1wiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IGNvbW1hbmRBZGRGb2xkZXJJbmRleCh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncylcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJhZGQtaW5kZXgtZm9yLWN1cnJlbnQtZm9sZGVyXCIsXG4gICAgICBuYW1lOiBcIkNyZWF0ZS9VcGRhdGUgRm9sZGVyIEluZGV4IGZvciBDdXJyZW50IEZvbGRlclwiLFxuICAgICAgaWNvbjogXCJsaXN0LW9yZGVyZWRcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IGNvbW1hbmRBZGRJbmRleEZvckN1cnJlbnRGb2xkZXIodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpO1xuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvYnRiLWFkZC1uZXh0LXByZXZpb3VzXCIsXG4gICAgICBuYW1lOiBcIkluc2VydCBOZXh0L1ByZXZpb3VzIExpbmtzIChDdXJyZW50IEZvbGRlcilcIixcbiAgICAgIGljb246IFwib2J0Yi1saW5rc1wiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IGNvbW1hbmRBZGROZXh0UHJldmlvdXModGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib2J0Yi1leHRyYWN0LXJlZC1oaWdobGlnaHRzXCIsXG4gICAgICBuYW1lOiBcIkV4dHJhY3QgUmVkIEhpZ2hsaWdodHMgdG8gY3VycmVudCBmaWxlXCIsXG4gICAgICBpY29uOiBcIm9idGItaGlnaGxpZ2h0ZXJcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiBjb21tYW5kRXh0cmFjdFJlZEhpZ2hsaWdodHModGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib2J0Yi1leHRyYWN0LWhpZ2hsaWdodHMtZm9sZGVyXCIsXG4gICAgICBuYW1lOiBcIkNyZWF0ZSBIaWdobGlnaHRzLm1kIGZyb20gZm9sZGVyXCIsXG4gICAgICBpY29uOiBcIm9idGItc3VtbWFyeVwiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IGNvbW1hbmRFeHRyYWN0SGlnaGxpZ2h0c0ZvbGRlcih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncylcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvYnRiLW91dGxpbmUtZXh0cmFjdFwiLFxuICAgICAgbmFtZTogXCJBcHBlbmQgT3V0bGluZSAoZnJvbSAjIy4uLiMjIyMjIyBoZWFkaW5ncylcIixcbiAgICAgIGljb246IFwib2J0Yi1vdXRsaW5lXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4gY29tbWFuZE91dGxpbmVFeHRyYWN0b3IodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib2J0Yi1vdXRsaW5lLWZvcm1hdFwiLFxuICAgICAgbmFtZTogXCJGb3JtYXQgT3V0bGluZSAoUm9tYW4vQS8xL2EgXHUyMTkyIE1hcmtkb3duIGhlYWRpbmdzKSBhbmQgTGluayBWZXJzZXNcIixcbiAgICAgIGljb246IFwib2J0Yi1mb3JtYXR0ZXJcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiBjb21tYW5kT3V0bGluZUZvcm1hdHRlcih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncylcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJidWlsZC1iaWJsZS1mcm9tLWJvbGxzXCIsXG4gICAgICBuYW1lOiBcIkltcG9ydCBCaWJsZSB2ZXJzaW9uIGludG8gdmF1bHQgKGRvd25sb2FkIGZyb20gYm9sbHMubGlmZSlcIixcbiAgICAgIGljb246IFwiYm9vay1vcGVuXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gY29tbWFuZEJ1aWxkQmlibGVGcm9tQm9sbHModGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MpLFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcIm9idGItdmVyc2UtbGlua3NcIixcbiAgICAgIG5hbWU6IFwiTGluayB2ZXJzZXNcIixcbiAgICAgIGljb246IFwib2J0Yi1iaWJsZVwiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IGNvbW1hbmRWZXJzZUxpbmtzKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImxpbmstdmVyc2VzLXNlbGVjdGlvbi1vci1saW5lXCIsXG4gICAgICBuYW1lOiBcIkxpbmsgdmVyc2VzIGluIHNlbGVjdGlvbi9jdXJyZW50IGxpbmVcIixcbiAgICAgIGljb246IFwibGluay0yXCIsIC8vIGFwcGVhcnMgaW4gbW9iaWxlIGNvbW1hbmQgYmFyXG4gICAgICBlZGl0b3JDYWxsYmFjazogYXN5bmMgKF9lZGl0b3IsIF92aWV3KSA9PiB7XG4gICAgICAgIGF3YWl0IGNvbW1hbmRWZXJzZUxpbmtzU2VsZWN0aW9uT3JMaW5lKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKTtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibGluay12ZXJzZXMtY3VycmVudC1jaG9vc2UtdmVyc2lvblwiLFxuICAgICAgbmFtZTogXCJMaW5rIHZlcnNlcyAod2l0aCB2ZXJzaW9uKVwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IGNvbW1hbmRWZXJzZUxpbmtzQ2hvb3NlVmVyc2lvbih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyksXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibGluay12ZXJzZXMtc2VsZWN0aW9uLW9yLWxpbmUtY2hvb3NlLXZlcnNpb25cIixcbiAgICAgIG5hbWU6IFwiTGluayB2ZXJzZXMgaW4gc2VsZWN0aW9uL2N1cnJlbnQgbGluZSAod2l0aCB2ZXJzaW9uKVwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IGNvbW1hbmRWZXJzZUxpbmtzU2VsZWN0aW9uT3JMaW5lQ2hvb3NlVmVyc2lvbih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyksXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwiYWRkLWJpYmxlaHViLWludGVybGluZWFyLWxpbmtzXCIsXG4gICAgICBuYW1lOiBcIkJpYmxlSHViOiBBZGQgaW50ZXJsaW5lYXIgbGlua3MgKGZpbGUgLyBmb2xkZXIpXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gY29tbWFuZEFkZEJpYmxlSHViTGlua3ModGhpcy5hcHApLFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcInJlbW92ZS1iaWJsZWh1Yi1pbnRlcmxpbmVhci1saW5rc1wiLFxuICAgICAgbmFtZTogXCJCaWJsZUh1YjogUmVtb3ZlIGludGVybGluZWFyIGxpbmtzIChmaWxlIC8gZm9sZGVyKVwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IGNvbW1hbmRSZW1vdmVCaWJsZUh1YkxpbmtzKHRoaXMuYXBwKSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJjbGVhbi1ibGFuay1saW5lc1wiLFxuICAgICAgbmFtZTogXCJDbGVhbiBibGFuayBsaW5lcyAocmVtb3ZlL2NvbGxhcHNlKVwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IGNvbW1hbmRDbGVhbkJsYW5rTGluZXModGhpcy5hcHApLFxuICAgIH0pO1xuXG4gICAgcmVnaXN0ZXJQcm90b2NvbCh0aGlzKTtcbiAgfVxuXG4gIGFzeW5jIG9udW5sb2FkKCkge1xuICAgIGNvbnNvbGUubG9nKFwiVW5sb2FkaW5nIEJpYmxlIFRvb2xzXHUyMDI2XCIpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCkge1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyBBcHAsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBPYnNpZGlhbkJpYmxlVG9vbHMgZnJvbSBcIi4vbWFpblwiO1xuaW1wb3J0IHsgQm9sbHNMYW5ndWFnZSwgQm9sbHNQaWNrZXJDb21wb25lbnQgfSBmcm9tIFwiLi91aS9ib2xscy1waWNrZXItY29tcG9uZW50XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmlibGVUb29sc1NldHRpbmdzIHtcbiAgYmFzZUZvbGRlckJpYmxlOiBzdHJpbmc7XG4gIGJhc2VGb2xkZXI6IHN0cmluZztcbiAgcmVkTWFya0Nzczogc3RyaW5nO1xuICBpbmRleEZpbGVOYW1lTW9kZTogXCJmb2xkZXItbmFtZVwiIHwgXCJhcnRpY2xlLXN0eWxlXCI7XG4gIHN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2U6IGJvb2xlYW47IC8vIHN0cmlwIE1hcmtkb3duIGxpbmtzIHRoYXQgbG9vayBsaWtlIHNjcmlwdHVyZSByZWZlcmVuY2VzIChlLmcuLCBbUm9tLiAxOjFdKHVybCkgXHUyMTkyIFJvbS4gMToxKVxuICByZW1vdmVPYnNpZGlhbkRpc3BsYXlMaW5rczogYm9vbGVhbjsgLy8gcmVtb3ZlIE9ic2lkaWFuIGRpc3BsYXktdGV4dCBsaW5rcyB0aGF0IGxvb2sgbGlrZSBzY3JpcHR1cmUgcmVmZXJlbmNlcyAoZS5nLiwgW1tSb20uIDE6MXxSb20uIDE6MV1dIFx1MjE5MiBSb20uIDE6MSlcbiAgcmV3cml0ZU9sZE9ic2lkaWFuTGlua3M6IGJvb2xlYW47IC8vIHJld3JpdGUgbGVnYWN5IE9ic2lkaWFuIGxpbmtzIChlLmcuLCBbW1JvbSAxI14zfFx1MjAyNl1dIFx1MjE5MiBbW1JvbSNeMS0zfFx1MjAyNl1dKSBhbmQgcmVtb3ZlIHByZXZpb3VzIE9ic2lkaWFuIGxpbmtzIHRoYXQgaGF2ZSB2ZXJzZS1saWtlIGRpc3BsYXkgcGF0dGVyblxuXG4gIGF1dG9MaW5rVmVyc2VzOiBib29sZWFuOyAvLyBhdXRvLWxpbmsgdmVyc2VzIGluIHRoZSBjdXJyZW50IGZpbGUgd2hlbiBmb3JtYXR0aW5nIG91dGxpbmVzXG5cbiAgLy8gQmlibGUgZ2VuZXJhdGlvbiBkZWZhdWx0c1xuICBiaWJsZURlZmF1bHRWZXJzaW9uOiBzdHJpbmcgfCB1bmRlZmluZWQ7ICAgICAgICAgICAgICAvLyBlLmcuIFwiS0pWXCJcbiAgYmlibGVEZWZhdWx0VmVyc2lvbkZ1bGw6IHN0cmluZyB8IHVuZGVmaW5lZDsgICAgICAgICAgICAgIC8vIGUuZy4gXCJLaW5nIEphbWVzIFZlcnNpb25cIlxuICBiaWJsZURlZmF1bHRMYW5ndWFnZTogc3RyaW5nOyAgICAgICAgICAgICAvLyBlLmcuIFwiRW5nbGlzaFwiLFxuICBiaWJsZUluY2x1ZGVWZXJzaW9uSW5GaWxlbmFtZTogYm9vbGVhbjsgICAvLyBcIkpvaG4gKEtKVilcIiAmIEJpYmxlL0tKVi9cbiAgYmlibGVBZGRGcm9udG1hdHRlcjogYm9vbGVhbjsgICAgICAgICAgICAgLy8gYWRkIFlBTUwgZnJvbnRtYXR0ZXIgYXQgdG9wXG5cbiAgLy8gQ2FjaGluZyBvZiBCb2xscyBjYXRhbG9ndWUgKHRvIGF2b2lkIHJlLWZldGNoaW5nIGV2ZXJ5IHRpbWUpXG4gIGJvbGxzQ2F0YWxvZ3VlQ2FjaGU/OiBCb2xsc0xhbmd1YWdlW107XG4gIGJvbGxzQ2F0YWxvZ3VlQ2FjaGVkQXQ/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBCaWJsZVRvb2xzU2V0dGluZ3MgPSB7XG4gIGJhc2VGb2xkZXJCaWJsZTogXCJCaWJsZVwiLFxuICBiYXNlRm9sZGVyOiBcIkJvb2tzXCIsXG4gIHJlZE1hcmtDc3M6ICdiYWNrZ3JvdW5kOiAjRkY1NTgyQTY7JyxcbiAgaW5kZXhGaWxlTmFtZU1vZGU6IFwiYXJ0aWNsZS1zdHlsZVwiLFxuICBzdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlOiB0cnVlLFxuICByZW1vdmVPYnNpZGlhbkRpc3BsYXlMaW5rczogZmFsc2UsXG4gIHJld3JpdGVPbGRPYnNpZGlhbkxpbmtzOiB0cnVlLFxuICBhdXRvTGlua1ZlcnNlczogdHJ1ZSxcblxuICAvLyBCaWJsZSBnZW5lcmF0aW9uIGRlZmF1bHRzXG4gIGJpYmxlRGVmYXVsdFZlcnNpb246IHVuZGVmaW5lZCxcbiAgYmlibGVEZWZhdWx0VmVyc2lvbkZ1bGw6IHVuZGVmaW5lZCxcbiAgYmlibGVEZWZhdWx0TGFuZ3VhZ2U6IFwiRW5nbGlzaFwiLFxuICBiaWJsZUluY2x1ZGVWZXJzaW9uSW5GaWxlbmFtZTogdHJ1ZSxcbiAgYmlibGVBZGRGcm9udG1hdHRlcjogZmFsc2UsXG5cbiAgYm9sbHNDYXRhbG9ndWVDYWNoZTogdW5kZWZpbmVkLFxuICBib2xsc0NhdGFsb2d1ZUNhY2hlZEF0OiB1bmRlZmluZWQsXG59O1xuXG5leHBvcnQgY2xhc3MgQmlibGVUb29sc1NldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcGx1Z2luOiBPYnNpZGlhbkJpYmxlVG9vbHM7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogT2JzaWRpYW5CaWJsZVRvb2xzKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgZGlzcGxheSgpOiB2b2lkIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJCaWJsZSBUb29scyBcdTIwMTQgU2V0dGluZ3NcIiB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJEZWZhdWx0IGJhc2UgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIlJvb3QgZm9sZGVyIHRvIHNjYW4gd2hlbiBhIGNvbW1hbmQgbmVlZHMgYSBmb2xkZXIgKGUuZy4sIGluZGV4IGNyZWF0aW9uKS5cIilcbiAgICAgIC5hZGRUZXh0KHQgPT4gdC5zZXRQbGFjZWhvbGRlcihcIkJvb2tzXCIpLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmJhc2VGb2xkZXIpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodikgPT4geyB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYXNlRm9sZGVyID0gdiB8fCBcIkJvb2tzXCI7IGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpOyB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSW5kZXggZmlsZW5hbWUgbW9kZVwiKVxuICAgICAgLnNldERlc2MoJ0lmIGEgZm9sZGVyIGVuZHMgd2l0aCBcIiwgVGhlXCIgb3IgXCIsIEFcIiwgY29udmVydCB0byBcIlRoZSBcdTIwMjZcIiAvIFwiQSBcdTIwMjZcIi4nKVxuICAgICAgLmFkZERyb3Bkb3duKGRkID0+IGRkXG4gICAgICAgIC5hZGRPcHRpb24oXCJmb2xkZXItbmFtZVwiLCBcIktlZXAgZm9sZGVyIG5hbWVcIilcbiAgICAgICAgLmFkZE9wdGlvbihcImFydGljbGUtc3R5bGVcIiwgXCJBcnRpY2xlIHN0eWxlIChcdTIwMTgsIFRoZVx1MjAxOSBcdTIxOTIgXHUyMDE4VGhlIFx1MjAyNlx1MjAxOSlcIilcbiAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmluZGV4RmlsZU5hbWVNb2RlKVxuICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5kZXhGaWxlTmFtZU1vZGUgPSAodmFsdWUgYXMgXCJmb2xkZXItbmFtZVwiIHwgXCJhcnRpY2xlLXN0eWxlXCIpO1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiSGlnaGxpZ2h0IENTU1wiKVxuICAgICAgLnNldERlc2MoXCJFeGFjdCBzdHlsZSBhIDxtYXJrPiB0YWcgbXVzdCBoYXZlIHRvIGJlIGNvbnNpZGVyZWQgYSBoaWdobGlnaHQuXCIpXG4gICAgICAuYWRkVGV4dCh0ID0+IHQuc2V0UGxhY2Vob2xkZXIoJ2JhY2tncm91bmQ6ICNGRjU1ODJBNjsnKVxuICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucmVkTWFya0NzcylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLnJlZE1hcmtDc3MgPSB2OyBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTsgfSkpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlN0cmlwIE1hcmtkb3duIGxpbmtzIHRoYXQgbG9vayBsaWtlIHNjcmlwdHVyZVwiKVxuICAgICAgLmFkZFRvZ2dsZSh0ID0+IHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSlcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSA9IHY7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJSZW1vdmUgT2JzaWRpYW4gZGlzcGxheS10ZXh0IGxpbmtzIHRoYXQgbG9vayBsaWtlIHJlZmVyZW5jZXNcIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0XG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZW1vdmVPYnNpZGlhbkRpc3BsYXlMaW5rcylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJlbW92ZU9ic2lkaWFuRGlzcGxheUxpbmtzID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pKTtcblxuICAgIC8vIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgIC8vICAgLnNldE5hbWUoXCJSZXdyaXRlIGxlZ2FjeSBPYnNpZGlhbiBsaW5rc1wiKVxuICAgIC8vICAgLnNldERlc2MoXCJDb252ZXJ0IFtbUm9tIDEjXjN8XHUyMDI2XV0gXHUyMTkyIFtbUm9tI14xLTN8XHUyMDI2XV0gYmVmb3JlIGxpbmtpbmcgYW5kIHJlbW92ZSBwcmV2aW91cyBPYnNpZGlhbiBsaW5rcyB0aGF0IGhhdmUgdmVyc2UtbGlrZSBkaXNwbGF5IHBhdHRlcm4uXCIpXG4gICAgLy8gICAuYWRkVG9nZ2xlKHQgPT4gdFxuICAgIC8vICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucmV3cml0ZU9sZE9ic2lkaWFuTGlua3MpXG4gICAgLy8gICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAvLyAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZXdyaXRlT2xkT2JzaWRpYW5MaW5rcyA9IHZhbHVlO1xuICAgIC8vICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIC8vICAgICB9KSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQXV0by1saW5rIHZlcnNlcyBhZnRlciBvdXRsaW5lIGZvcm1hdHRpbmdcIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PiB0XG4gICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvTGlua1ZlcnNlcylcbiAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0xpbmtWZXJzZXMgPSB2O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICk7XG5cblxuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkRlZmF1bHQgQmlibGUgZm9sZGVyIHRvIGNyZWF0ZSB2ZXJzaW9ucyBpblwiKVxuICAgICAgLnNldERlc2MoXCJSb290IGZvbGRlciB0byBzY2FuIHdoZW4gYSBjb21tYW5kIG5lZWRzIGEgZm9sZGVyIChlLmcuLCBpbmRleCBjcmVhdGlvbikuXCIpXG4gICAgICAuYWRkVGV4dCh0ID0+IHQuc2V0UGxhY2Vob2xkZXIoXCJCaWJsZVwiKS5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYXNlRm9sZGVyQmlibGUpXG4gICAgICAgIC5vbkNoYW5nZShhc3luYyAodikgPT4geyB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYXNlRm9sZGVyQmlibGUgPSB2IHx8IFwiQmlibGVcIjsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pKTtcblxuICAgIC8vIEhvc3QgZWxlbWVudCBmb3IgdGhlIHBpY2tlciBjb21wb25lbnRcbiAgICBjb25zdCBwaWNrZXJIb3N0ID0gY29udGFpbmVyRWwuY3JlYXRlRGl2KHsgY2xzOiBcImJvbGxzLXBpY2tlci1ob3N0XCIgfSk7XG5cbiAgICAvLyBJbnN0YW50aWF0ZSB0aGUgcmV1c2FibGUgcGlja2VyLlxuICAgIC8vIC0gSXQgd2lsbCBsb2FkL2NhY2hlIEJvbGxzIGxhbmd1YWdlcy5qc29uIG9uIGl0cyBvd24uXG4gICAgLy8gLSBJdCBjYWxscyBvbkNoYW5nZShsYW5ndWFnZUtleSwgdHJhbnNsYXRpb25Db2RlLCB0cmFuc2xhdGlvbkZ1bGwpIHdoZW4gdXNlciBjaGFuZ2VzIHNlbGVjdGlvbi5cbiAgICBjb25zdCBwaWNrZXIgPSBuZXcgQm9sbHNQaWNrZXJDb21wb25lbnQoXG4gICAgICB7XG4gICAgICAgIGFwcDogdGhpcy5hcHAsXG4gICAgICAgIHNldHRpbmdzOiB0aGlzLnBsdWdpbi5zZXR0aW5ncyBhcyBCaWJsZVRvb2xzU2V0dGluZ3MsXG4gICAgICAgIGxhbmdCbG9ja3M6IFtdLCAvLyBjb21wb25lbnQgd2lsbCBmZXRjaCArIGZpbGxcbiAgICAgICAgbGFuZ3VhZ2VLZXk6IHRoaXMucGx1Z2luLnNldHRpbmdzLmJpYmxlRGVmYXVsdExhbmd1YWdlID8/IFwiQUxMXCIsXG4gICAgICAgIHRyYW5zbGF0aW9uQ29kZTogdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmlibGVEZWZhdWx0VmVyc2lvbixcbiAgICAgICAgdHJhbnNsYXRpb25GdWxsOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iaWJsZURlZmF1bHRWZXJzaW9uRnVsbCxcbiAgICAgICAgZGVmYXVsdHM6IHtcbiAgICAgICAgICBsYW5ndWFnZUxhYmVsOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5iaWJsZURlZmF1bHRMYW5ndWFnZSA/PyBudWxsLFxuICAgICAgICAgIHZlcnNpb25TaG9ydDogIHRoaXMucGx1Z2luLnNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb24sXG4gICAgICAgIH0sXG4gICAgICAgIGNvbnRhaW5lcjogcGlja2VySG9zdCxcbiAgICAgICAgdmVyc2lvbnNDb250YWluZXI6IHBpY2tlckhvc3QuY3JlYXRlRGl2KCksXG4gICAgICAgIG9uQ2hhbmdlOiBhc3luYyAobGFuZ3VhZ2UsIHZlcnNpb24sIHZlcnNpb25GdWxsKSA9PiB7XG4gICAgICAgICAgLy8gUGVyc2lzdCBzZWxlY3Rpb25zIGFzIHlvdXIgcGx1Z2luIGRlZmF1bHRzXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmlibGVEZWZhdWx0TGFuZ3VhZ2UgICAgID0gbGFuZ3VhZ2U7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmlibGVEZWZhdWx0VmVyc2lvbiA9IHZlcnNpb247XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmlibGVEZWZhdWx0VmVyc2lvbkZ1bGwgPSB2ZXJzaW9uRnVsbDtcblxuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncz8uKCk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MgYXMgQmlibGVUb29sc1NldHRpbmdzXG4gICAgKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IE5vdGljZSwgcmVxdWVzdFVybCwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcblxuLyoqIEJvbGxzIGZvcm1hdHMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQm9sbHNUcmFuc2xhdGlvbiB7XG4gIHNob3J0X25hbWU6IHN0cmluZztcbiAgZnVsbF9uYW1lOiBzdHJpbmc7XG4gIHVwZGF0ZWQ/OiBudW1iZXI7XG4gIGRpcj86IFwicnRsXCIgfCBcImx0clwiO1xufVxuZXhwb3J0IGludGVyZmFjZSBCb2xsc0xhbmd1YWdlIHtcbiAgbGFuZ3VhZ2U6IHN0cmluZztcbiAgdHJhbnNsYXRpb25zOiBCb2xsc1RyYW5zbGF0aW9uW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmFzZUJvbGxzRGVmYXVsdHMge1xuICBsYW5ndWFnZUxhYmVsPzogc3RyaW5nOyAgIC8vIGUuZy4sIFwiRW5nbGlzaFwiXG4gIHZlcnNpb25TaG9ydD86IHN0cmluZyB8IHVuZGVmaW5lZDsgICAgLy8gZS5nLiwgXCJLSlZcIiB8IHVuZGVmaW5lZCBtZWFucyBEZWZhdWx0XG59XG5cbmNvbnN0IEJPTExTID0ge1xuICBMQU5HVUFHRVNfVVJMOiBcImh0dHBzOi8vYm9sbHMubGlmZS9zdGF0aWMvYm9sbHMvYXBwL3ZpZXdzL2xhbmd1YWdlcy5qc29uXCIsXG59O1xuXG5hc3luYyBmdW5jdGlvbiBmZXRjaExhbmd1YWdlcygpOiBQcm9taXNlPEJvbGxzTGFuZ3VhZ2VbXT4ge1xuICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0VXJsKHsgdXJsOiBCT0xMUy5MQU5HVUFHRVNfVVJMLCBtZXRob2Q6IFwiR0VUXCIgfSk7XG4gIGlmIChyZXMuc3RhdHVzIDwgMjAwIHx8IHJlcy5zdGF0dXMgPj0gMzAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBIVFRQICR7cmVzLnN0YXR1c31gKTtcbiAgfVxuICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHJlcy50ZXh0KSBhcyBCb2xsc0xhbmd1YWdlW107XG4gIHJldHVybiAocGFyc2VkIHx8IFtdKS5maWx0ZXIoYiA9PiBBcnJheS5pc0FycmF5KGIudHJhbnNsYXRpb25zKSAmJiBiLnRyYW5zbGF0aW9ucy5sZW5ndGggPiAwKTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCb2xsc1BpY2tlckNvbXBvbmVudE9wdGlvbnMge1xuICBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzO1xuICBsYW5nQmxvY2tzOiBCb2xsc0xhbmd1YWdlW107ICAgICAgICAgICAgIC8vIGNhbiBwYXNzIFtdIFx1MjAxNCB3aWxsIGJlIGxvYWRlZFxuICBsYW5ndWFnZUtleTogc3RyaW5nOyAgICAgICAgICAgICAgICAgICAgIC8vIGluaXRpYWwgc2VsZWN0aW9uIChlLmcuLCBcIkFMTFwiKVxuICB0cmFuc2xhdGlvbkNvZGU6IHN0cmluZyB8IHVuZGVmaW5lZDsgLy8gXCJLSlZcIiBvciB1bmRlZmluZWQgZm9yIERlZmF1bHRcbiAgdHJhbnNsYXRpb25GdWxsPzogc3RyaW5nOyAgICAgICAgICAgICAgICAvLyBvcHRpb25hbCBpbml0aWFsIGZ1bGwgbmFtZVxuICBkZWZhdWx0cz86IEJhc2VCb2xsc0RlZmF1bHRzOyAgICAgICAgICAgIC8vIG9wdGlvbmFsIGRlZmF1bHRzIHRvIHByZXNlbGVjdFxuICBvbkNoYW5nZTogKGxhbmd1YWdlOiBzdHJpbmcsIHZlcnNpb246IHN0cmluZyB8IHVuZGVmaW5lZCwgdmVyc2lvbkZ1bGw6IHN0cmluZyB8IHVuZGVmaW5lZCkgPT4gdm9pZDtcbiAgY29udGFpbmVyOiBIVE1MRWxlbWVudDsgICAgICAgICAgICAgICAgICAvLyBob3N0IGVsZW1lbnRcbiAgdmVyc2lvbnNDb250YWluZXI/OiBIVE1MRGl2RWxlbWVudDsgICAgICAvLyAoc2V0IGJ5IGNvbXBvbmVudClcbiAgYXBwOiBhbnk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBwbHVnaW4vYXBwIGluc3RhbmNlIGZvciBzYXZpbmdcbiAgZGlzYWxsb3dEZWZhdWx0PzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIEJvbGxzUGlja2VyQ29tcG9uZW50IHtcbiAgcHJpdmF0ZSBvcHRpb25zOiBCb2xsc1BpY2tlckNvbXBvbmVudE9wdGlvbnM7XG4gIHByaXZhdGUgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncztcbiAgcHJpdmF0ZSBhcHA6IGFueTtcblxuICAvLyByZWZlcmVuY2Uga2VwdCB0byB0aGUgYWN0dWFsIHZlcnNpb25zIGNvbnRhaW5lciB3ZSByZW5kZXIgaW50b1xuICB2ZXJzaW9uc0NvbnRhaW5lciE6IEhUTUxEaXZFbGVtZW50O1xuXG4gIHByaXZhdGUgc3RhdGljIERFRkFVTFRfU0VOVElORUwgPSBcIl9fREVGQVVMVF9fXCI7XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczogQm9sbHNQaWNrZXJDb21wb25lbnRPcHRpb25zLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzLCBkaXNhbGxvd0RlZmF1bHQ6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgIHRoaXMuYXBwID0gb3B0aW9ucy5hcHA7XG5cbiAgICBpZiAoZGlzYWxsb3dEZWZhdWx0KSB0aGlzLnNldERpc2FsbG93RGVmYXVsdCh0cnVlKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgLyoqIEhlbHBlcjogZ2V0IHRyYW5zbGF0aW9ucyBmb3IgYSBsYW5ndWFnZSBvciBBTEwgKGRlZHVwIGJ5IHNob3J0X25hbWUpICovXG4gIHByb3RlY3RlZCB0cmFuc2xhdGlvbnNGb3JMYW5ndWFnZShsYW5nS2V5OiBzdHJpbmcpOiBCb2xsc1RyYW5zbGF0aW9uW10ge1xuICAgIGlmIChsYW5nS2V5ID09PSBcIkFMTFwiKSB7XG4gICAgICBjb25zdCBhbGw6IEJvbGxzVHJhbnNsYXRpb25bXSA9IFtdO1xuICAgICAgZm9yIChjb25zdCBibG9jayBvZiB0aGlzLm9wdGlvbnMubGFuZ0Jsb2NrcykgYWxsLnB1c2goLi4uYmxvY2sudHJhbnNsYXRpb25zKTtcbiAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgIHJldHVybiBhbGxcbiAgICAgICAgLmZpbHRlcih0ID0+IChzZWVuLmhhcyh0LnNob3J0X25hbWUpID8gZmFsc2UgOiAoc2Vlbi5hZGQodC5zaG9ydF9uYW1lKSwgdHJ1ZSkpKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gYS5zaG9ydF9uYW1lLmxvY2FsZUNvbXBhcmUoYi5zaG9ydF9uYW1lKSk7XG4gICAgfVxuICAgIGNvbnN0IGJsb2NrID0gdGhpcy5vcHRpb25zLmxhbmdCbG9ja3MuZmluZChiID0+IGIubGFuZ3VhZ2UgPT09IGxhbmdLZXkpO1xuICAgIGlmICghYmxvY2spIHJldHVybiBbXTtcbiAgICByZXR1cm4gYmxvY2sudHJhbnNsYXRpb25zLnNsaWNlKCkuc29ydCgoYSwgYikgPT4gYS5zaG9ydF9uYW1lLmxvY2FsZUNvbXBhcmUoYi5zaG9ydF9uYW1lKSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGxvYWRDYXRhbG9ndWUoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMuc2V0dGluZ3MuYm9sbHNDYXRhbG9ndWVDYWNoZSBhcyB1bmtub3duIGFzIEJvbGxzTGFuZ3VhZ2VbXSB8IHVuZGVmaW5lZDtcbiAgICAgIGlmIChjYWNoZWQ/Lmxlbmd0aCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMubGFuZ0Jsb2NrcyA9IGNhY2hlZDtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5vcHRpb25zLmxhbmdCbG9ja3MgPSBhd2FpdCBmZXRjaExhbmd1YWdlcygpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgKHRoaXMuc2V0dGluZ3MgYXMgYW55KS5ib2xsc0NhdGFsb2d1ZUNhY2hlID0gdGhpcy5vcHRpb25zLmxhbmdCbG9ja3M7XG4gICAgICAgICh0aGlzLnNldHRpbmdzIGFzIGFueSkuYm9sbHNDYXRhbG9ndWVDYWNoZWRBdCA9IERhdGUubm93KCk7XG4gICAgICAgIHRoaXMuYXBwPy5zYXZlUGx1Z2luU2V0dGluZ3M/LigpO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIltCb2xsc10gQ291bGQgbm90IGZldGNoIGxhbmd1YWdlcy5qc29uOlwiLCBlKTtcbiAgICAgIHRoaXMub3B0aW9ucy5sYW5nQmxvY2tzID0gW3tcbiAgICAgICAgbGFuZ3VhZ2U6IFwiRW5nbGlzaFwiLFxuICAgICAgICB0cmFuc2xhdGlvbnM6IFtcbiAgICAgICAgICB7IHNob3J0X25hbWU6IFwiS0pWXCIsIGZ1bGxfbmFtZTogXCJLaW5nIEphbWVzIFZlcnNpb24gMTc2OSB3aXRoIEFwb2NyeXBoYSBhbmQgU3Ryb25nJ3MgTnVtYmVyc1wiIH0sXG4gICAgICAgICAgeyBzaG9ydF9uYW1lOiBcIldFQlwiLCBmdWxsX25hbWU6IFwiV29ybGQgRW5nbGlzaCBCaWJsZVwiIH0sXG4gICAgICAgICAgeyBzaG9ydF9uYW1lOiBcIllMVFwiLCBmdWxsX25hbWU6IFwiWW91bmcncyBMaXRlcmFsIFRyYW5zbGF0aW9uICgxODk4KVwiIH0sXG4gICAgICAgIF0sXG4gICAgICB9XTtcbiAgICAgIG5ldyBOb3RpY2UoXCJVc2luZyBtaW5pbWFsIGZhbGxiYWNrIGNhdGFsb2d1ZSAoS0pWL1dFQi9ZTFQpLlwiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyByZW5kZXIoKSB7XG4gICAgY29uc3QgeyBjb250YWluZXIgfSA9IHRoaXMub3B0aW9ucztcbiAgICBjb250YWluZXIuZW1wdHkoKTtcblxuICAgIC8vIGVuc3VyZSBjYXRhbG9nIGlzIGxvYWRlZFxuICAgIGF3YWl0IHRoaXMubG9hZENhdGFsb2d1ZSgpO1xuXG4gICAgLy8gYXBwbHkgZGVmYXVsdHMgKGlmIGFueSlcbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZmF1bHRzPy5sYW5ndWFnZUxhYmVsKSB7XG4gICAgICBjb25zdCBmb3VuZCA9IHRoaXMub3B0aW9ucy5sYW5nQmxvY2tzLmZpbmQoYiA9PiBiLmxhbmd1YWdlID09PSB0aGlzLm9wdGlvbnMuZGVmYXVsdHMhLmxhbmd1YWdlTGFiZWwpO1xuICAgICAgaWYgKGZvdW5kKSB0aGlzLm9wdGlvbnMubGFuZ3VhZ2VLZXkgPSBmb3VuZC5sYW5ndWFnZTtcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5kZWZhdWx0cykge1xuICAgICAgLy8gSWYgdmVyc2lvblNob3J0IGlzIGV4cGxpY2l0bHkgdW5kZWZpbmVkIC0+IERlZmF1bHRcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGVmYXVsdHMudmVyc2lvblNob3J0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uRnVsbCA9IHVuZGVmaW5lZDtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmRlZmF1bHRzLnZlcnNpb25TaG9ydCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlID0gdGhpcy5vcHRpb25zLmRlZmF1bHRzLnZlcnNpb25TaG9ydDtcbiAgICAgICAgY29uc3QgdCA9IHRoaXMudHJhbnNsYXRpb25zRm9yTGFuZ3VhZ2UodGhpcy5vcHRpb25zLmxhbmd1YWdlS2V5KVxuICAgICAgICAgIC5maW5kKHggPT4geC5zaG9ydF9uYW1lID09PSB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlKTtcbiAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uRnVsbCA9IHQ/LmZ1bGxfbmFtZSA/PyB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlID8/IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBMQU5HVUFHRSBQSUNLRVJcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXIpXG4gICAgICAuc2V0TmFtZShcIkJpYmxlIGxhbmd1YWdlXCIpXG4gICAgICAuYWRkRHJvcGRvd24oZGQgPT4ge1xuICAgICAgICBkZC5hZGRPcHRpb24oXCJBTExcIiwgXCJBbGwgbGFuZ3VhZ2VzXCIpO1xuICAgICAgICBmb3IgKGNvbnN0IGJsb2NrIG9mIHRoaXMub3B0aW9ucy5sYW5nQmxvY2tzKSB7XG4gICAgICAgICAgZGQuYWRkT3B0aW9uKGJsb2NrLmxhbmd1YWdlLCBibG9jay5sYW5ndWFnZSk7XG4gICAgICAgIH1cbiAgICAgICAgZGQuc2V0VmFsdWUodGhpcy5vcHRpb25zLmxhbmd1YWdlS2V5KTtcbiAgICAgICAgZGQub25DaGFuZ2UodiA9PiB7XG4gICAgICAgICAgdGhpcy5vcHRpb25zLmxhbmd1YWdlS2V5ID0gdjtcbiAgICAgICAgICB0aGlzLnJlbmRlclZlcnNpb25zKCk7IC8vIHJlYnVpbGQgdmVyc2lvbnMgZm9yIHRoZSBzZWxlY3RlZCBsYW5ndWFnZVxuICAgICAgICAgIHRoaXMub3B0aW9ucy5vbkNoYW5nZSh0aGlzLm9wdGlvbnMubGFuZ3VhZ2VLZXksIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUsIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkZ1bGwpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgLy8gVkVSU0lPTlMgKGR5bmFtaWMpXG4gICAgdGhpcy52ZXJzaW9uc0NvbnRhaW5lciA9IGNvbnRhaW5lci5jcmVhdGVEaXYoKTtcbiAgICB0aGlzLm9wdGlvbnMudmVyc2lvbnNDb250YWluZXIgPSB0aGlzLnZlcnNpb25zQ29udGFpbmVyO1xuICAgIHRoaXMucmVuZGVyVmVyc2lvbnMoKTtcbiAgfVxuXG4gIHByaXZhdGUgc2V0RGlzYWxsb3dEZWZhdWx0KGRpc2FsbG93OiBib29sZWFuKSB7XG4gICAgdGhpcy5vcHRpb25zLmRpc2FsbG93RGVmYXVsdCA9IGRpc2FsbG93O1xuICAgIC8vIElmIHdlIG5vdyBkaXNhbGxvdyBkZWZhdWx0IGJ1dCBjdXJyZW50IGlzIHVuZGVmaW5lZCwgY29lcmNlIHRvIGZpcnN0IGF2YWlsYWJsZVxuICAgIGlmIChkaXNhbGxvdyAmJiAodGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSA9PSB1bmRlZmluZWQgfHwgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSA9PT0gXCJcIikpIHtcbiAgICAgIGNvbnN0IGxpc3QgPSB0aGlzLnRyYW5zbGF0aW9uc0Zvckxhbmd1YWdlKHRoaXMub3B0aW9ucy5sYW5ndWFnZUtleSk7XG4gICAgICBpZiAobGlzdC5sZW5ndGgpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5sYW5ndWFnZUtleSA9PT0gXCJFbmdsaXNoXCIgJiYgbGlzdC5zb21lKHQgPT4gdC5zaG9ydF9uYW1lID09PSBcIktKVlwiKSkge1xuICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgPSBcIktKVlwiO1xuICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkZ1bGwgPSBsaXN0LmZpbmQodCA9PiB0LnNob3J0X25hbWUgPT09IFwiS0pWXCIpPy5mdWxsX25hbWUgPz8gXCJLSlZcIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlID0gbGlzdFswXS5zaG9ydF9uYW1lO1xuICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkZ1bGwgPSBsaXN0WzBdLmZ1bGxfbmFtZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wdGlvbnMub25DaGFuZ2UodGhpcy5vcHRpb25zLmxhbmd1YWdlS2V5LCB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlLCB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25GdWxsKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUmVidWlsZCB2ZXJzaW9ucyBVSSB0byByZWZsZWN0IHRoZSBmbGFnXG4gICAgaWYgKHRoaXMudmVyc2lvbnNDb250YWluZXIpIHRoaXMucmVuZGVyVmVyc2lvbnMoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyVmVyc2lvbnMoKSB7XG4gICAgdGhpcy52ZXJzaW9uc0NvbnRhaW5lci5lbXB0eSgpO1xuICAgIGNvbnN0IGxpc3QgPSB0aGlzLnRyYW5zbGF0aW9uc0Zvckxhbmd1YWdlKHRoaXMub3B0aW9ucy5sYW5ndWFnZUtleSk7XG5cbiAgICBuZXcgU2V0dGluZyh0aGlzLnZlcnNpb25zQ29udGFpbmVyKVxuICAgICAgLnNldE5hbWUoXCJWZXJzaW9uXCIpXG4gICAgICAuYWRkRHJvcGRvd24oZGQgPT4ge1xuICAgICAgICBjb25zdCBzZWwgPSBkZC5zZWxlY3RFbCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgc2VsLnN0eWxlLm1heFdpZHRoID0gXCIzNjBweFwiO1xuICAgICAgICBzZWwuc3R5bGUud2hpdGVTcGFjZSA9IFwibm93cmFwXCI7XG5cbiAgICAgICAgLy8gT25seSBzaG93IFwiRGVmYXVsdFwiIHdoZW4gYWxsb3dlZFxuICAgICAgICBjb25zdCBhbGxvd0RlZmF1bHQgPSAhdGhpcy5vcHRpb25zLmRpc2FsbG93RGVmYXVsdDtcblxuICAgICAgICBpZiAoYWxsb3dEZWZhdWx0KSB7XG4gICAgICAgICAgZGQuYWRkT3B0aW9uKEJvbGxzUGlja2VyQ29tcG9uZW50LkRFRkFVTFRfU0VOVElORUwsIFwiRGVmYXVsdFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghbGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAvLyBXaXRoIG5vIHRyYW5zbGF0aW9ucyBhdmFpbGFibGU6XG4gICAgICAgICAgaWYgKGFsbG93RGVmYXVsdCkge1xuICAgICAgICAgICAgZGQuc2V0VmFsdWUoXG4gICAgICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgPyBCb2xsc1BpY2tlckNvbXBvbmVudC5ERUZBVUxUX1NFTlRJTkVMXG4gICAgICAgICAgICAgICAgOiBCb2xsc1BpY2tlckNvbXBvbmVudC5ERUZBVUxUX1NFTlRJTkVMXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkZ1bGwgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGRpc2FsbG93RGVmYXVsdDogbm90aGluZyB0byBwaWNrLCBrZWVwIGVtcHR5XG4gICAgICAgICAgICBkZC5hZGRPcHRpb24oXCJcIiwgXCIobm8gdHJhbnNsYXRpb25zKVwiKTtcbiAgICAgICAgICAgIGRkLnNldFZhbHVlKFwiXCIpO1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSA9IFwiXCI7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25GdWxsID0gXCJcIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCB0IG9mIGxpc3QpIHtcbiAgICAgICAgICBkZC5hZGRPcHRpb24odC5zaG9ydF9uYW1lLCBgJHt0LnNob3J0X25hbWV9IFx1MjAxNCAke3QuZnVsbF9uYW1lfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGV0ZXJtaW5lIGluaXRpYWwgdmFsdWVcbiAgICAgICAgbGV0IGluaXRpYWxWYWx1ZTogc3RyaW5nO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSA9PSB1bmRlZmluZWQgfHwgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSA9PT0gXCJcIikge1xuICAgICAgICAgIGlmIChhbGxvd0RlZmF1bHQpIHtcbiAgICAgICAgICAgIGluaXRpYWxWYWx1ZSA9IEJvbGxzUGlja2VyQ29tcG9uZW50LkRFRkFVTFRfU0VOVElORUw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGluaXRpYWxWYWx1ZSA9IGxpc3RbMF0uc2hvcnRfbmFtZTsgLy8gY29lcmNlIHRvIGZpcnN0XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGV4aXN0cyA9IGxpc3Quc29tZSh0ID0+IHQuc2hvcnRfbmFtZSA9PT0gdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSk7XG4gICAgICAgICAgaW5pdGlhbFZhbHVlID0gZXhpc3RzID8gKHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgYXMgc3RyaW5nKSA6IGxpc3RbMF0uc2hvcnRfbmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRkLnNldFZhbHVlKGluaXRpYWxWYWx1ZSk7XG5cbiAgICAgICAgLy8gU3luYyBpbnRlcm5hbCBzdGF0ZVxuICAgICAgICBpZiAoaW5pdGlhbFZhbHVlID09PSBCb2xsc1BpY2tlckNvbXBvbmVudC5ERUZBVUxUX1NFTlRJTkVMKSB7XG4gICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25GdWxsID0gdW5kZWZpbmVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2xhdGlvbkNvZGUgPSBpbml0aWFsVmFsdWU7XG4gICAgICAgICAgY29uc3QgdHQgPSBsaXN0LmZpbmQoeCA9PiB4LnNob3J0X25hbWUgPT09IGluaXRpYWxWYWx1ZSk7XG4gICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uRnVsbCA9IHR0Py5mdWxsX25hbWUgPz8gaW5pdGlhbFZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZGQub25DaGFuZ2UodiA9PiB7XG4gICAgICAgICAgaWYgKGFsbG93RGVmYXVsdCAmJiB2ID09PSBCb2xsc1BpY2tlckNvbXBvbmVudC5ERUZBVUxUX1NFTlRJTkVMKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uRnVsbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zbGF0aW9uQ29kZSA9IHY7XG4gICAgICAgICAgICBjb25zdCB0MiA9IGxpc3QuZmluZCh4ID0+IHguc2hvcnRfbmFtZSA9PT0gdik7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25GdWxsID0gdDI/LmZ1bGxfbmFtZSA/PyB2O1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLm9wdGlvbnMub25DaGFuZ2UodGhpcy5vcHRpb25zLmxhbmd1YWdlS2V5LCB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25Db2RlLCB0aGlzLm9wdGlvbnMudHJhbnNsYXRpb25GdWxsKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgfVxufSIsICIvLyBzcmMvY29tbWFuZHMvdmVyc2VMaW5rcy50c1xuaW1wb3J0IHtcbiAgQXBwLFxuICBNYXJrZG93blZpZXcsXG4gIE1vZGFsLFxuICBOb3RpY2UsXG4gIFNldHRpbmcsXG4gIFRGaWxlLFxuICByZXF1ZXN0VXJsLFxufSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgc3BsaXRGcm9udG1hdHRlciB9IGZyb20gXCIuLi9saWIvbWQtdXRpbHNcIjtcbmltcG9ydCB7IFBpY2tWZXJzaW9uTW9kYWwgfSBmcm9tIFwic3JjL3VpL3BpY2stdmVyc2lvbi1tb2RhbFwiO1xuXG4vKiogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgQk9PSyBNQVAgKGRlZmF1bHQsIEVuZ2xpc2gpXG4gKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5jb25zdCBCT09LX0FCQlI6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIC8vIC0tLS0gUGVudGF0ZXVjaCAtLS0tXG4gIFwiR2VuZXNpc1wiOiBcIkdlblwiLFxuICBcIjEgTW9zZVwiOiBcIkdlblwiLCBcIjFNb3NlXCI6IFwiR2VuXCIsXG4gIFwiMS4gTW9zZVwiOiBcIkdlblwiLCBcIjEuTW9zZVwiOiBcIkdlblwiLFxuXG4gIFwiRXhvZHVzXCI6IFwiRXhvXCIsXG4gIFwiMiBNb3NlXCI6IFwiRXhvXCIsIFwiMk1vc2VcIjogXCJFeG9cIixcbiAgXCIyLiBNb3NlXCI6IFwiRXhvXCIsIFwiMi5Nb3NlXCI6IFwiRXhvXCIsXG5cbiAgXCJMZXZpdGljdXNcIjogXCJMZXZcIixcbiAgXCIzIE1vc2VcIjogXCJMZXZcIiwgXCIzTW9zZVwiOiBcIkxldlwiLFxuICBcIjMuIE1vc2VcIjogXCJMZXZcIiwgXCIzLk1vc2VcIjogXCJMZXZcIixcblxuICBcIk51bWJlcnNcIjogXCJOdW1cIixcbiAgXCJOdW1lcmlcIjogXCJOdW1cIixcbiAgXCI0IE1vc2VcIjogXCJOdW1cIiwgXCI0TW9zZVwiOiBcIk51bVwiLFxuICBcIjQuIE1vc2VcIjogXCJOdW1cIiwgXCI0Lk1vc2VcIjogXCJOdW1cIixcblxuICBcIkRldXRlcm9ub215XCI6IFwiRGV1dFwiLFxuICBcIkRldXRlcm9ub21pdW1cIjogXCJEZXV0XCIsXG4gIFwiNSBNb3NlXCI6IFwiRGV1dFwiLCBcIjVNb3NlXCI6IFwiRGV1dFwiLFxuICBcIjUuIE1vc2VcIjogXCJEZXV0XCIsIFwiNS5Nb3NlXCI6IFwiRGV1dFwiLFxuXG4gIC8vIC0tLS0gSGlzdG9yaWNhbCAtLS0tXG4gIFwiSm9zaHVhXCI6IFwiSm9zaFwiLCBcIkpvc3VhXCI6IFwiSm9zaFwiLFxuICBcIkp1ZGdlc1wiOiBcIkp1ZGdcIiwgXCJSaWNodGVyXCI6IFwiSnVkZ1wiLFxuICBcIlJ1dGhcIjogXCJSdXRoXCIsXG5cbiAgXCIxIFNhbXVlbFwiOiBcIjEgU2FtXCIsIFwiMS4gU2FtdWVsXCI6IFwiMSBTYW1cIiwgXCIxU2FtdWVsXCI6IFwiMSBTYW1cIiwgXCIxLlNhbXVlbFwiOiBcIjEgU2FtXCIsXG4gIFwiMiBTYW11ZWxcIjogXCIyIFNhbVwiLCBcIjIuIFNhbXVlbFwiOiBcIjIgU2FtXCIsIFwiMlNhbXVlbFwiOiBcIjIgU2FtXCIsIFwiMi5TYW11ZWxcIjogXCIyIFNhbVwiLFxuXG4gIFwiMSBLaW5nc1wiOiBcIjEgS2luZ3NcIiwgXCIxLiBLXHUwMEY2bmlnZVwiOiBcIjEgS2luZ3NcIiwgXCIxS1x1MDBGNm5pZ2VcIjogXCIxIEtpbmdzXCIsIFwiMS5LXHUwMEY2bmlnZVwiOiBcIjEgS2luZ3NcIixcbiAgXCIyIEtpbmdzXCI6IFwiMiBLaW5nc1wiLCBcIjIuIEtcdTAwRjZuaWdlXCI6IFwiMiBLaW5nc1wiLCBcIjJLXHUwMEY2bmlnZVwiOiBcIjIgS2luZ3NcIiwgXCIyLktcdTAwRjZuaWdlXCI6IFwiMiBLaW5nc1wiLFxuXG4gIFwiMSBDaHJvbmljbGVzXCI6IFwiMSBDaHJvblwiLCBcIjEuIENocm9uaWtcIjogXCIxIENocm9uXCIsIFwiMUNocm9uaWtcIjogXCIxIENocm9uXCIsIFwiMS5DaHJvbmlrXCI6IFwiMSBDaHJvblwiLFxuICBcIjIgQ2hyb25pY2xlc1wiOiBcIjIgQ2hyb25cIiwgXCIyLiBDaHJvbmlrXCI6IFwiMiBDaHJvblwiLCBcIjJDaHJvbmlrXCI6IFwiMiBDaHJvblwiLCBcIjIuQ2hyb25pa1wiOiBcIjIgQ2hyb25cIixcblxuICBcIkV6cmFcIjogXCJFenJhXCIsIFwiRXNyYVwiOiBcIkV6cmFcIixcbiAgXCJOZWhlbWlhaFwiOiBcIk5laFwiLCBcIk5laGVtaWFcIjogXCJOZWhcIixcbiAgXCJFc3RoZXJcIjogXCJFc3RoXCIsXG4gIFwiSm9iXCI6IFwiSm9iXCIsIFwiSGlvYlwiOiBcIkpvYlwiLFxuXG4gIC8vIC0tLS0gV2lzZG9tIC0tLS1cbiAgXCJQc2FsbXNcIjogXCJQc2FcIiwgXCJQc2FsbVwiOiBcIlBzYVwiLCBcIlBzXCI6IFwiUHNhXCIsXG4gIFwiUHJvdmVyYnNcIjogXCJQcm92XCIsIFwiU3ByXHUwMEZDY2hlXCI6IFwiUHJvdlwiLCBcIlNwclwiOiBcIlByb3ZcIixcbiAgXCJFY2NsZXNpYXN0ZXNcIjogXCJFY2NsXCIsIFwiUHJlZGlnZXJcIjogXCJFY2NsXCIsIFwiS29oZWxldFwiOiBcIkVjY2xcIixcbiAgXCJTb25nIG9mIFNvbG9tb25cIjogXCJTb1NcIiwgXCJTb25nIG9mIFNvbmdzXCI6IFwiU29TXCIsIFwiSG9oZXNsaWVkXCI6IFwiU29TXCIsIFwiSG9oZWxpZWRcIjogXCJTb1NcIiwgXCJMaWVkIGRlciBMaWVkZXJcIjogXCJTb1NcIiwgXCJTU1wiOiBcIlNvU1wiLFxuXG4gIC8vIC0tLS0gUHJvcGhldHMgLS0tLVxuICBcIklzYWlhaFwiOiBcIklzYVwiLCBcIkplc2FqYVwiOiBcIklzYVwiLFxuICBcIkplcmVtaWFoXCI6IFwiSmVyXCIsIFwiSmVyZW1pYVwiOiBcIkplclwiLFxuICBcIkxhbWVudGF0aW9uc1wiOiBcIkxhbVwiLCBcIktsYWdlbGllZGVyXCI6IFwiTGFtXCIsIFwiVGhyZW5pXCI6IFwiTGFtXCIsXG4gIFwiRXpla2llbFwiOiBcIkV6ZWtcIiwgXCJIZXNla2llbFwiOiBcIkV6ZWtcIiwgXCJFemVjaGllbFwiOiBcIkV6ZWtcIixcbiAgXCJEYW5pZWxcIjogXCJEYW5cIixcbiAgXCJIb3NlYVwiOiBcIkhvc2VhXCIsXG4gIFwiSm9lbFwiOiBcIkpvZWxcIixcbiAgXCJBbW9zXCI6IFwiQW1vc1wiLFxuICBcIk9iYWRpYWhcIjogXCJPYmFkXCIsIFwiT2JhZGphXCI6IFwiT2JhZFwiLFxuICBcIkpvbmFoXCI6IFwiSm9uYWhcIiwgXCJKb25hXCI6IFwiSm9uYWhcIixcbiAgXCJNaWNhaFwiOiBcIk1pY2FoXCIsIFwiTWljaGFcIjogXCJNaWNhaFwiLFxuICBcIk5haHVtXCI6IFwiTmFoXCIsXG4gIFwiSGFiYWtrdWtcIjogXCJIYWJcIiwgXCJIYWJha3VrXCI6IFwiSGFiXCIsXG4gIFwiWmVwaGFuaWFoXCI6IFwiWmVwXCIsIFwiWmVwaGFuamFcIjogXCJaZXBcIiwgXCJaZWZhbmphXCI6IFwiWmVwXCIsXG4gIFwiSGFnZ2FpXCI6IFwiSGFnXCIsXG4gIFwiWmVjaGFyaWFoXCI6IFwiWmVjaFwiLCBcIlNhY2hhcmphXCI6IFwiWmVjaFwiLFxuICBcIk1hbGFjaGlcIjogXCJNYWxcIiwgXCJNYWxlYWNoaVwiOiBcIk1hbFwiLFxuXG4gIC8vIC0tLS0gR29zcGVscyAmIEFjdHMgLS0tLVxuICBcIk1hdHRoZXdcIjogXCJNYXR0XCIsIFwiTWF0dGhcdTAwRTR1c1wiOiBcIk1hdHRcIiwgXCJNdFwiOiBcIk1hdHRcIixcbiAgXCJNYXJrXCI6IFwiTWFya1wiLCBcIk1hcmt1c1wiOiBcIk1hcmtcIiwgXCJNa1wiOiBcIk1hcmtcIixcbiAgXCJMdWtlXCI6IFwiTHVrZVwiLCBcIkx1a2FzXCI6IFwiTHVrZVwiLCBcIkxrXCI6IFwiTHVrZVwiLCBcIkx1a1wiOiBcIkx1a2VcIixcbiAgXCJKb2huXCI6IFwiSm9oblwiLCBcIkpvaGFubmVzXCI6IFwiSm9oblwiLCBcIkpvaFwiOiBcIkpvaG5cIixcbiAgXCJBY3RzXCI6IFwiQWN0c1wiLCBcIkFwZ1wiOiBcIkFjdHNcIiwgXCJBcG9zdGVsZ2VzY2hpY2h0ZVwiOiBcIkFjdHNcIixcblxuICAvLyAtLS0tIFBhdWxcdTIwMTlzIGxldHRlcnMgLS0tLVxuICBcIlJvbWFuc1wiOiBcIlJvbVwiLCBcIlJcdTAwRjZtZXJcIjogXCJSb21cIiwgXCJSXHUwMEY2bVwiOiBcIlJvbVwiLCBcIlJcdTAwRjZtZXJicmllZlwiOiBcIlJvbVwiLFxuXG4gIFwiMSBDb3JpbnRoaWFuc1wiOiBcIjEgQ29yXCIsIFwiMSBLb3JpbnRoZXJcIjogXCIxIENvclwiLCBcIjEuIEtvcmludGhlclwiOiBcIjEgQ29yXCIsIFwiMUtvcmludGhlclwiOiBcIjEgQ29yXCIsIFwiMS5Lb3JpbnRoZXJcIjogXCIxIENvclwiLFxuICBcIjEgS29yXCI6IFwiMSBDb3JcIiwgXCIxLiBLb3JcIjogXCIxIENvclwiLCBcIjFLb3JcIjogXCIxIENvclwiLCBcIjEuS29yXCI6IFwiMSBDb3JcIixcblxuICBcIjIgQ29yaW50aGlhbnNcIjogXCIyIENvclwiLCBcIjIgS29yaW50aGVyXCI6IFwiMiBDb3JcIiwgXCIyLiBLb3JpbnRoZXJcIjogXCIyIENvclwiLCBcIjJLb3JpbnRoZXJcIjogXCIyIENvclwiLCBcIjIuS29yaW50aGVyXCI6IFwiMiBDb3JcIixcbiAgXCIyIEtvclwiOiBcIjIgQ29yXCIsIFwiMi4gS29yXCI6IFwiMiBDb3JcIiwgXCIyS29yXCI6IFwiMiBDb3JcIiwgXCIyLktvclwiOiBcIjIgQ29yXCIsXG5cbiAgXCJHYWxhdGlhbnNcIjogXCJHYWxcIiwgXCJHYWxhdGVyXCI6IFwiR2FsXCIsIFwiR2FsXCI6IFwiR2FsXCIsXG4gIFwiRXBoZXNpYW5zXCI6IFwiRXBoXCIsIFwiRXBoZXNlclwiOiBcIkVwaFwiLCBcIkVwaFwiOiBcIkVwaFwiLFxuICBcIlBoaWxpcHBpYW5zXCI6IFwiUGhpbFwiLCBcIlBoaWxpcHBlclwiOiBcIlBoaWxcIiwgXCJQaGlsXCI6IFwiUGhpbFwiLFxuICBcIkNvbG9zc2lhbnNcIjogXCJDb2xcIiwgXCJLb2xvc3NlclwiOiBcIkNvbFwiLCBcIktvbFwiOiBcIkNvbFwiLFxuXG4gIFwiMSBUaGVzc2Fsb25pYW5zXCI6IFwiMSBUaGVzXCIsIFwiMSBUaGVzc1wiOiBcIjEgVGhlc1wiLCBcIjEuIFRoZXNzXCI6IFwiMSBUaGVzXCIsIFwiMVRoZXNzXCI6IFwiMSBUaGVzXCIsIFwiMS5UaGVzc1wiOiBcIjEgVGhlc1wiLFxuICBcIjEgVGhlc3NhbG9uaWNoZXJcIjogXCIxIFRoZXNcIiwgXCIxLiBUaGVzc2Fsb25pY2hlclwiOiBcIjEgVGhlc1wiLCBcIjFUaGVzc2Fsb25pY2hlclwiOiBcIjEgVGhlc1wiLCBcIjEuVGhlc3NhbG9uaWNoZXJcIjogXCIxIFRoZXNcIixcblxuICBcIjIgVGhlc3NhbG9uaWFuc1wiOiBcIjIgVGhlc1wiLCBcIjIgVGhlc3NcIjogXCIyIFRoZXNcIiwgXCIyLiBUaGVzc1wiOiBcIjIgVGhlc1wiLCBcIjJUaGVzc1wiOiBcIjIgVGhlc1wiLCBcIjIuVGhlc3NcIjogXCIyIFRoZXNcIixcbiAgXCIyIFRoZXNzYWxvbmljaGVyXCI6IFwiMiBUaGVzXCIsIFwiMi4gVGhlc3NhbG9uaWNoZXJcIjogXCIyIFRoZXNcIiwgXCIyVGhlc3NhbG9uaWNoZXJcIjogXCIyIFRoZXNcIiwgXCIyLlRoZXNzYWxvbmljaGVyXCI6IFwiMiBUaGVzXCIsXG5cbiAgXCIxIFRpbW90aHlcIjogXCIxIFRpbVwiLCBcIjEgVGltb3RoZXVzXCI6IFwiMSBUaW1cIiwgXCIxLiBUaW1vdGhldXNcIjogXCIxIFRpbVwiLCBcIjFUaW1vdGhldXNcIjogXCIxIFRpbVwiLCBcIjEuVGltb3RoZXVzXCI6IFwiMSBUaW1cIixcbiAgXCIxIFRpbVwiOiBcIjEgVGltXCIsIFwiMS4gVGltXCI6IFwiMSBUaW1cIiwgXCIxVGltXCI6IFwiMSBUaW1cIiwgXCIxLlRpbVwiOiBcIjEgVGltXCIsXG5cbiAgXCIyIFRpbW90aHlcIjogXCIyIFRpbVwiLCBcIjIgVGltb3RoZXVzXCI6IFwiMiBUaW1cIiwgXCIyLiBUaW1vdGhldXNcIjogXCIyIFRpbVwiLCBcIjJUaW1vdGhldXNcIjogXCIyIFRpbVwiLCBcIjIuVGltb3RoZXVzXCI6IFwiMiBUaW1cIixcbiAgXCIyIFRpbVwiOiBcIjIgVGltXCIsIFwiMi4gVGltXCI6IFwiMiBUaW1cIiwgXCIyVGltXCI6IFwiMiBUaW1cIiwgXCIyLlRpbVwiOiBcIjIgVGltXCIsXG5cbiAgXCJUaXR1c1wiOiBcIlRpdHVzXCIsXG4gIFwiUGhpbGVtb25cIjogXCJQaGlsZW1cIixcblxuICBcIkhlYnJld3NcIjogXCJIZWJcIiwgXCJIZWJyXHUwMEU0ZXJcIjogXCJIZWJcIiwgXCJIZWJyXCI6IFwiSGViXCIsXG5cbiAgLy8gLS0tLSBDYXRob2xpYyAmIEdlbmVyYWwgbGV0dGVycyAtLS0tXG4gIFwiSmFtZXNcIjogXCJKYW1lc1wiLCBcIkpha29idXNcIjogXCJKYW1lc1wiLCBcIkpha1wiOiBcIkphbWVzXCIsXG4gIFwiMSBQZXRlclwiOiBcIjEgUGV0XCIsIFwiMSBQZXRydXNcIjogXCIxIFBldFwiLCBcIjEuIFBldHJ1c1wiOiBcIjEgUGV0XCIsIFwiMVBldHJ1c1wiOiBcIjEgUGV0XCIsIFwiMS5QZXRydXNcIjogXCIxIFBldFwiLFxuICBcIjEgUGV0XCI6IFwiMSBQZXRcIiwgXCIxLiBQZXRcIjogXCIxIFBldFwiLCBcIjEuIFBldHJcIjogXCIxIFBldFwiLCBcIjEuUGV0clwiOiBcIjEgUGV0XCIsIFwiMVBldFwiOiBcIjEgUGV0XCIsIFwiMS5QZXRcIjogXCIxIFBldFwiLFxuXG4gIFwiMiBQZXRlclwiOiBcIjIgUGV0XCIsIFwiMiBQZXRydXNcIjogXCIyIFBldFwiLCBcIjIuIFBldHJ1c1wiOiBcIjIgUGV0XCIsIFwiMlBldHJ1c1wiOiBcIjIgUGV0XCIsIFwiMi5QZXRydXNcIjogXCIyIFBldFwiLFxuICBcIjIgUGV0XCI6IFwiMiBQZXRcIiwgXCIyLiBQZXRcIjogXCIyIFBldFwiLCBcIjIuIFBldHJcIjogXCIyIFBldFwiLCBcIjIuUGV0clwiOiBcIjIgUGV0XCIsIFwiMlBldFwiOiBcIjIgUGV0XCIsIFwiMi5QZXRcIjogXCIyIFBldFwiLFxuXG4gIFwiMSBKb2huXCI6IFwiMSBKb2huXCIsIFwiMSBKb2hhbm5lc1wiOiBcIjEgSm9oblwiLCBcIjEuIEpvaGFubmVzXCI6IFwiMSBKb2huXCIsIFwiMUpvaGFubmVzXCI6IFwiMSBKb2huXCIsIFwiMS5Kb2hhbm5lc1wiOiBcIjEgSm9oblwiLFxuICBcIjEgSm9oXCI6IFwiMSBKb2huXCIsIFwiMS4gSm9oXCI6IFwiMSBKb2huXCIsIFwiMUpvaFwiOiBcIjEgSm9oblwiLCBcIjEuSm9oXCI6IFwiMSBKb2huXCIsXG5cbiAgXCIyIEpvaG5cIjogXCIyIEpvaG5cIiwgXCIyIEpvaGFubmVzXCI6IFwiMiBKb2huXCIsIFwiMi4gSm9oYW5uZXNcIjogXCIyIEpvaG5cIiwgXCIySm9oYW5uZXNcIjogXCIyIEpvaG5cIiwgXCIyLkpvaGFubmVzXCI6IFwiMiBKb2huXCIsXG4gIFwiMiBKb2hcIjogXCIyIEpvaG5cIiwgXCIyLiBKb2hcIjogXCIyIEpvaG5cIiwgXCIySm9oXCI6IFwiMiBKb2huXCIsIFwiMi5Kb2hcIjogXCIyIEpvaG5cIixcblxuICBcIjMgSm9oblwiOiBcIjMgSm9oblwiLCBcIjMgSm9oYW5uZXNcIjogXCIzIEpvaG5cIiwgXCIzLiBKb2hhbm5lc1wiOiBcIjMgSm9oblwiLCBcIjNKb2hhbm5lc1wiOiBcIjMgSm9oblwiLCBcIjMuSm9oYW5uZXNcIjogXCIzIEpvaG5cIixcbiAgXCIzIEpvaFwiOiBcIjMgSm9oblwiLCBcIjMuIEpvaFwiOiBcIjMgSm9oblwiLCBcIjNKb2hcIjogXCIzIEpvaG5cIiwgXCIzLkpvaFwiOiBcIjMgSm9oblwiLFxuXG4gIFwiSnVkZVwiOiBcIkp1ZGVcIiwgXCJKdWRhc1wiOiBcIkp1ZGVcIixcblxuICAvLyAtLS0tIFJldmVsYXRpb24gLS0tLVxuICBcIlJldmVsYXRpb25cIjogXCJSZXZcIiwgXCJPZmZlbmJhcnVuZ1wiOiBcIlJldlwiLCBcIk9mZmJcIjogXCJSZXZcIiwgXCJBcG9rYWx5cHNlXCI6IFwiUmV2XCJcbn07XG5cblxudHlwZSBCb29rTWFwID0gUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbmNvbnN0IGVzY2FwZVJlID0gKHM6IHN0cmluZykgPT4gcy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG5jb25zdCBSQU5HRV9TRVAgPSAvW1xcLVxcdTIwMTBcXHUyMDExXFx1MjAxMlxcdTIwMTNcXHUyMDE0XFx1MjAxNV0vOyAgLy8gZW4gZGFzaCwgZW0gZGFzaCwgaHlwaGVuXG5jb25zdCBUUklNX1RBSUxfUFVOQ1QgPSAvWyw6Oy5cXCldJC87IC8vIGNvbW1vbiB0cmFpbGluZyBwdW5jdHVhdGlvbiB0byBkcm9wIGZvciBwYXJzaW5nIChrZXB0IGluIGRpc3BsYXkpXG5cbi8qKiBCdWlsZCBsb2NhbGUtc3BlY2lmaWMgYm9vayBtYXAgKyBhbHRlcm5hdGlvbiBhdCBydW50aW1lICovXG5mdW5jdGlvbiBidWlsZEJvb2tDb250ZXh0KHNldHRpbmdzPzogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGxldCBib29rTG9jYWxlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGxldCBjdXN0b206IHVua25vd247XG5cbiAgdHJ5IHsgYm9va0xvY2FsZSA9IChzZXR0aW5ncyBhcyBhbnkpPy5ib29rTG9jYWxlIGFzIHN0cmluZyB8IHVuZGVmaW5lZDsgfSBjYXRjaCB7fVxuICB0cnkgeyBjdXN0b20gPSAoc2V0dGluZ3MgYXMgYW55KT8uY3VzdG9tQm9va01hcDsgfSBjYXRjaCB7fVxuXG4gIGxldCBhYmJyOiBCb29rTWFwID0gQk9PS19BQkJSO1xuXG4gIGlmIChib29rTG9jYWxlID09PSBcImN1c3RvbVwiICYmIGN1c3RvbSkge1xuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIGN1c3RvbSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGN1c3RvbSk7XG4gICAgICAgIGlmIChwYXJzZWQgJiYgdHlwZW9mIHBhcnNlZCA9PT0gXCJvYmplY3RcIikgYWJiciA9IHBhcnNlZCBhcyBCb29rTWFwO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY3VzdG9tID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIGFiYnIgPSBjdXN0b20gYXMgQm9va01hcDtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIGFiYnIgPSBCT09LX0FCQlI7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGFiYnIgPSBCT09LX0FCQlI7XG4gIH1cblxuICBjb25zdCBhbGxUb2tlbnMgPSBBcnJheS5mcm9tKG5ldyBTZXQoWy4uLk9iamVjdC5rZXlzKGFiYnIpLCAuLi5PYmplY3QudmFsdWVzKGFiYnIpXSkpLnNvcnQoXG4gICAgKGEsIGIpID0+IGIubGVuZ3RoIC0gYS5sZW5ndGhcbiAgKTtcbiAgY29uc3QgQk9PS19BTFQgPSBhbGxUb2tlbnMubWFwKGVzY2FwZVJlKS5qb2luKFwifFwiKTtcblxuICBjb25zdCBnZXRCb29rQWJiciA9IChib29rOiBzdHJpbmcpID0+IGFiYnJbYm9va10gPz8gYm9vaztcblxuICBjb25zdCBidWlsZFBhdHRlcm5Cb2R5ID0gKCk6IHN0cmluZyA9PiB7XG4gICAgY29uc3QgYm9vayA9IGAoPzoke0JPT0tfQUxUfSlgO1xuICAgIC8vIGNvbnN0IHJlZjEgPVxuICAgIC8vICAgYCg/Oig/OiR7Ym9va30pXFxcXC4/XFxcXHMqYCArXG4gICAgLy8gICBgXFxcXGQrKD86LVxcXFxkKyk/OlxcXFxkK1thLXpdPyg/Oi1cXFxcZCspP1thLXpdP2AgK1xuICAgIC8vICAgYCg/OlxcXFxzKixcXFxccypcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT98XFxcXHMqO1xcXFxzKlxcXFxkKzpcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT8pKmAgK1xuICAgIC8vICAgYClgO1xuICAgIGNvbnN0IHJlZjEgPVxuICAgICAgYCg/Oig/OiR7Ym9va30pP1xcXFwuP1xcXFxzKmAgK1xuICAgICAgYFxcXFxkKyg/OiR7UkFOR0VfU0VQLnNvdXJjZX1cXFxcZCspPzpcXFxcZCtbYS16XT8oPzoke1JBTkdFX1NFUC5zb3VyY2V9XFxcXGQrKT9bYS16XT9gICtcbiAgICAgIGAoPzpcXFxccyosXFxcXHMqXFxcXGQrW2Etel0/KD86JHtSQU5HRV9TRVAuc291cmNlfVxcXFxkKyk/W2Etel0/fFxcXFxzKjtcXFxccypcXFxcZCs6XFxcXGQrW2Etel0/KD86JHtSQU5HRV9TRVAuc291cmNlfVxcXFxkKyk/W2Etel0/KSpgICtcbiAgICAgIGApYDtcbiAgICBjb25zdCByZWYyID0gYCg/Oigke2Jvb2t9KVxcXFwuP1xcXFxzKyhcXFxcZCspKD86JHtSQU5HRV9TRVAuc291cmNlfShcXFxcZCspKT8pYDtcbiAgICBjb25zdCBSRUYgPSBgKD88cmVmPiR7cmVmMX18JHtyZWYyfSlgO1xuXG4gICAgY29uc3QgVkVSU0UgPVxuICAgICAgYCg/PHZlcnNlPmAgK1xuICAgICAgYFxcXFxiW1Z2XXY/KD86XFxcXC58ZXJzZXM/KVxcXFxzKmAgK1xuICAgICAgYFxcXFxkK1thLXpdPyg/OiR7UkFOR0VfU0VQLnNvdXJjZX1cXFxcZCspP1thLXpdP2AgK1xuICAgICAgYCg/Oig/Oix8LD9cXFxccyphbmQpXFxcXHMqXFxcXGQrKD86JHtSQU5HRV9TRVAuc291cmNlfVxcXFxkKyk/W2Etel0/KSpgICtcbiAgICAgIGApYDtcblxuICAgIGNvbnN0IENIQVBURVIgPVxuICAgICAgYCg/PGNoYXB0ZXI+YCArXG4gICAgICBgXFxcXGJbQ2NdaCg/OmFwdGVycz98cz9cXFxcLilcXFxcLj9cXFxccypgICtcbiAgICAgIGBcXFxcZCsoPzoke1JBTkdFX1NFUC5zb3VyY2V9XFxcXGQrKT9gICtcbiAgICAgIGApYDtcblxuICAgIGNvbnN0IE5PVEUgPVxuICAgICAgYCg/PG5vdGU+YCArXG4gICAgICBgXFxcXGJbTm5db3Rlcz9gICtcbiAgICAgIGAoPzpcXFxccytcXFxcZCsoPzpcXFxccytcXFxcZCspP2AgK1xuICAgICAgYCg/OmAgK1xuICAgICAgYCg/OlssO118LD9cXFxccyphbmQpXFxcXHMqXFxcXGQrKD86XFxcXHMrXFxcXGQrKT9gICtcbiAgICAgIGAoPzpcXFxccytpblxcXFxzKyR7Ym9va31cXFxcLj9cXFxccytcXFxcZCspP2AgK1xuICAgICAgYCkqYCArXG4gICAgICBgKWAgK1xuICAgICAgYCg/OlxcXFxzK2luXFxcXHMrJHtib29rfVxcXFwuP1xcXFxzK1xcXFxkKyk/YCArXG4gICAgICBgKWA7XG5cbiAgICBjb25zdCBCT09LID0gYCg/PGJvb2s+XFxcXGIoPzoke2Jvb2t9KVxcXFxiKSg/IVxcXFwuP1xcXFxzKlxcXFxkKylgO1xuXG4gICAgcmV0dXJuIGAke1JFRn18JHtWRVJTRX18JHtDSEFQVEVSfXwke05PVEV9fCR7Qk9PS31gO1xuICB9O1xuXG4gIGNvbnN0IFBBVFRFUk5fQk9EWSA9IGJ1aWxkUGF0dGVybkJvZHkoKTtcbiAgY29uc3QgUEFUVEVSTl9HID0gbmV3IFJlZ0V4cChQQVRURVJOX0JPRFksIFwiZ1wiKTtcbiAgY29uc3QgUEFUVEVSTl9IRUFEID0gbmV3IFJlZ0V4cChcIl5cIiArIFBBVFRFUk5fQk9EWSk7XG5cbiAgcmV0dXJuIHsgYWJiciwgYWxsVG9rZW5zLCBCT09LX0FMVCwgZ2V0Qm9va0FiYnIsIFBBVFRFUk5fRywgUEFUVEVSTl9IRUFEIH07XG59XG5cbi8qKiAtLS0tLS0tLS0tLS0tLS0tIFV0aWxpdHk6IG5vcm1hbGl6ZSBib29rIHRva2VuIHRvIHJlbW92ZSB0cmFpbGluZyBwZXJpb2QgLS0tLS0tLS0tLS0tLS0tICovXG5mdW5jdGlvbiBub3JtYWxpemVCb29rVG9rZW4ocmF3OiBzdHJpbmcsIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4pOiBzdHJpbmcge1xuICAvLyBUcmltIGFuZCBkcm9wIGEgc2luZ2xlIHRyYWlsaW5nIGRvdCAoZS5nLiwgXCJSb20uXCIgLT4gXCJSb21cIilcbiAgY29uc3QgY2xlYW5lZCA9IHJhdy50cmltKCkucmVwbGFjZSgvXFwuJC8sIFwiXCIpO1xuICByZXR1cm4gY3R4LmdldEJvb2tBYmJyKGNsZWFuZWQpO1xufVxuXG4vKiogLS0tLS0tLS0tLS0tLS0gUHJvdGVjdGVkIHJhbmdlcyAoZG9uXHUyMDE5dCB0b3VjaCB3aGlsZSBsaW5raW5nKSAtLS0tLS0tLS0tLS0tLSAqL1xudHlwZSBSYW5nZSA9IFtzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcl07XG5cbmZ1bmN0aW9uIGFkZFJhbmdlKHJhbmdlczogUmFuZ2VbXSwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbiAgaWYgKHN0YXJ0ID49IDAgJiYgZW5kID4gc3RhcnQpIHJhbmdlcy5wdXNoKFtzdGFydCwgZW5kXSk7XG59XG5cbmZ1bmN0aW9uIGZpbmRQcm90ZWN0ZWRSYW5nZXModGV4dDogc3RyaW5nKTogUmFuZ2VbXSB7XG4gIGNvbnN0IHJhbmdlczogUmFuZ2VbXSA9IFtdO1xuXG4gIC8vIDEpIENvZGUgZmVuY2VzIGBgYC4uLmBgYCBhbmQgfn5+Li4ufn5+XG4gIGNvbnN0IGZlbmNlUmUgPSAvKGBgYHx+fn4pW15cXG5dKlxcbltcXHNcXFNdKj9cXDEvZztcbiAgZm9yIChsZXQgbTsgKG0gPSBmZW5jZVJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuICAvLyAyKSBNYXRoIGJsb2NrcyAkJC4uLiQkXG4gIGNvbnN0IG1hdGhCbG9ja1JlID0gL1xcJFxcJFtcXHNcXFNdKj9cXCRcXCQvZztcbiAgZm9yIChsZXQgbTsgKG0gPSBtYXRoQmxvY2tSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbiAgLy8gMykgSW5saW5lIGNvZGUgYC4uLmBcbiAgY29uc3QgaW5saW5lQ29kZVJlID0gL2BbXmBcXG5dKmAvZztcbiAgZm9yIChsZXQgbTsgKG0gPSBpbmxpbmVDb2RlUmUuZXhlYyh0ZXh0KSk7ICkgYWRkUmFuZ2UocmFuZ2VzLCBtLmluZGV4LCBtLmluZGV4ICsgbVswXS5sZW5ndGgpO1xuXG4gIC8vIDQpIElubGluZSBtYXRoICQuLi4kIChhdm9pZCAkJClcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgKSB7XG4gICAgaWYgKHRleHRbaV0gPT09IFwiJFwiICYmIHRleHRbaSArIDFdICE9PSBcIiRcIikge1xuICAgICAgY29uc3Qgc3RhcnQgPSBpO1xuICAgICAgaSsrO1xuICAgICAgd2hpbGUgKGkgPCB0ZXh0Lmxlbmd0aCAmJiB0ZXh0W2ldICE9PSBcIiRcIikgaSsrO1xuICAgICAgaWYgKGkgPCB0ZXh0Lmxlbmd0aCAmJiB0ZXh0W2ldID09PSBcIiRcIikge1xuICAgICAgICBhZGRSYW5nZShyYW5nZXMsIHN0YXJ0LCBpICsgMSk7XG4gICAgICAgIGkrKztcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfVxuICAgIGkrKztcbiAgfVxuXG4gIC8vIDUpIE1hcmtkb3duIGxpbmtzIFt0ZXh0XSh1cmwpXG4gIGNvbnN0IG1kTGlua1JlID0gL1xcW1teXFxdXSs/XFxdXFwoW14pXStcXCkvZztcbiAgZm9yIChsZXQgbTsgKG0gPSBtZExpbmtSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbiAgLy8gNikgSW5saW5lIHByb3BlcnRpZXMgbGluZXM6ICBrZXk6OiB2YWx1ZVxuICBjb25zdCBpbmxpbmVQcm9wUmUgPSAvXlteXFxuOl17MSwyMDB9OjouKiQvZ207XG4gIGZvciAobGV0IG07IChtID0gaW5saW5lUHJvcFJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuICAvLyA3KSBPYnNpZGlhbiBsaW5rcyBbWy4uLl1dXG4gIGNvbnN0IG9ic2lkaWFuUmUgPSAvXFxbXFxbW15cXF1dKj9cXF1cXF0vZztcbiAgZm9yIChsZXQgbTsgKG0gPSBvYnNpZGlhblJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuICAvLyBNZXJnZSBvdmVybGFwcyAmIHNvcnRcbiAgcmFuZ2VzLnNvcnQoKGEsIGIpID0+IGFbMF0gLSBiWzBdKTtcbiAgY29uc3QgbWVyZ2VkOiBSYW5nZVtdID0gW107XG4gIGZvciAoY29uc3QgciBvZiByYW5nZXMpIHtcbiAgICBpZiAoIW1lcmdlZC5sZW5ndGggfHwgclswXSA+IG1lcmdlZFttZXJnZWQubGVuZ3RoIC0gMV1bMV0pIG1lcmdlZC5wdXNoKHIpO1xuICAgIGVsc2UgbWVyZ2VkW21lcmdlZC5sZW5ndGggLSAxXVsxXSA9IE1hdGgubWF4KG1lcmdlZFttZXJnZWQubGVuZ3RoIC0gMV1bMV0sIHJbMV0pO1xuICB9XG4gIHJldHVybiBtZXJnZWQ7XG59XG5cbmZ1bmN0aW9uIGluUHJvdGVjdGVkKHBvczogbnVtYmVyLCByYW5nZXM6IFJhbmdlW10pOiBib29sZWFuIHtcbiAgbGV0IGxvID0gMCwgaGkgPSByYW5nZXMubGVuZ3RoIC0gMTtcbiAgd2hpbGUgKGxvIDw9IGhpKSB7XG4gICAgY29uc3QgbWlkID0gKGxvICsgaGkpID4+IDE7XG4gICAgY29uc3QgW3MsIGVdID0gcmFuZ2VzW21pZF07XG4gICAgaWYgKHBvcyA8IHMpIGhpID0gbWlkIC0gMTtcbiAgICBlbHNlIGlmIChwb3MgPj0gZSkgbG8gPSBtaWQgKyAxO1xuICAgIGVsc2UgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc1dpdGhpbk9ic2lkaWFuTGluayh0ZXh0OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGJlZm9yZSA9IHRleHQuc2xpY2UoMCwgc3RhcnQpO1xuICBjb25zdCBhZnRlciA9IHRleHQuc2xpY2UoZW5kKTtcbiAgY29uc3Qgb3BlbklkeCA9IGJlZm9yZS5sYXN0SW5kZXhPZihcIltbXCIpO1xuICBjb25zdCBjbG9zZUlkeCA9IGJlZm9yZS5sYXN0SW5kZXhPZihcIl1dXCIpO1xuICBpZiAob3BlbklkeCA+IGNsb3NlSWR4KSB7XG4gICAgY29uc3QgbmV4dENsb3NlID0gYWZ0ZXIuaW5kZXhPZihcIl1dXCIpO1xuICAgIGlmIChuZXh0Q2xvc2UgIT09IC0xKSByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKiBQYXJlbnRoZXRpY2FsIG5vaXNlOiBza2lwIGlmIGluc2lkZSBcIigyMDE5KVwiLWxpa2UgcGFyZW50aGVzZXMgKi9cbmZ1bmN0aW9uIGlzSW5zaWRlTnVtZXJpY1BhcmVucyh0ZXh0OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IG9wZW4gPSB0ZXh0Lmxhc3RJbmRleE9mKFwiKFwiLCBzdGFydCk7XG4gIGlmIChvcGVuID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBjbG9zZSA9IHRleHQuaW5kZXhPZihcIilcIiwgZW5kKTtcbiAgaWYgKGNsb3NlID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBpbm5lciA9IHRleHQuc2xpY2Uob3BlbiArIDEsIGNsb3NlKS50cmltKCk7XG4gIGlmICgvXlxcZHsxLDR9KD86W1xcL1xcLlxcLTpdXFxkezEsMn0oPzpbXFwvXFwuXFwtOl1cXGR7MSw0fSk/KT8kLy50ZXN0KGlubmVyKSkgcmV0dXJuIHRydWU7XG4gIGlmICgvXnB7MSwyfVxcLlxccypcXGQrKFxccyotXFxzKlxcZCspPyQvaS50ZXN0KGlubmVyKSkgcmV0dXJuIHRydWU7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0gTWFya2Rvd24vT2JzaWRpYW4gbGluayBjbGVhbnVwIChQeXRob24gcGFyaXR5KSAtLS0tLS0tLS0tLS0tLS0tLS0tICovXG5mdW5jdGlvbiByZW1vdmVNYXRjaGluZ01hcmtkb3duTGlua3ModGV4dDogc3RyaW5nLCBQQVRURVJOX0hFQUQ6IFJlZ0V4cCk6IHN0cmluZyB7XG4gIGNvbnN0IG1kTGluayA9IC8oXFwqXFwqfF9ffFxcKik/XFxbKFteXFxdXSspXFxdXFwoW14pXStcXCkoXFwqXFwqfF9ffFxcKik/L2c7XG4gIHJldHVybiB0ZXh0LnJlcGxhY2UobWRMaW5rLCAoX20sIHByZSwgZGlzcCwgc3VmKSA9PiB7XG4gICAgY29uc3QgbGlua1RleHQgPSBTdHJpbmcoZGlzcCk7XG4gICAgaWYgKFBBVFRFUk5fSEVBRC50ZXN0KGxpbmtUZXh0KSkgcmV0dXJuIGxpbmtUZXh0O1xuICAgIGNvbnN0IHNpbXBsZU51bSA9IC9eXFxkKyg/Ols6LV1cXGQrKT8oPzotXFxkKyk/JC8udGVzdChsaW5rVGV4dCk7XG4gICAgaWYgKHNpbXBsZU51bSkgcmV0dXJuIGxpbmtUZXh0O1xuICAgIHJldHVybiBgJHtwcmUgPz8gXCJcIn1bJHtsaW5rVGV4dH1dJHtzdWYgPz8gXCJcIn1gO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlTWF0Y2hpbmdPYnNpZGlhbkxpbmtzKHRleHQ6IHN0cmluZywgUEFUVEVSTl9IRUFEOiBSZWdFeHApOiBzdHJpbmcge1xuICBjb25zdCBvYnMgPSAvXFxbXFxbKFteXFxdfF0rKVxcfChbXlxcXV0rKVxcXVxcXS9nO1xuICByZXR1cm4gdGV4dC5yZXBsYWNlKG9icywgKF9tLCBfdCwgZGlzcCkgPT4ge1xuICAgIGNvbnN0IGRpc3BsYXkgPSBTdHJpbmcoZGlzcCk7XG4gICAgaWYgKFBBVFRFUk5fSEVBRC50ZXN0KGRpc3BsYXkpKSByZXR1cm4gZGlzcGxheTtcbiAgICBjb25zdCBzaW1wbGVOdW0gPSAvXlxcZCsoPzpbOi1dXFxkKyk/KD86LVxcZCspPyQvLnRlc3QoZGlzcGxheSk7XG4gICAgaWYgKHNpbXBsZU51bSkgcmV0dXJuIGRpc3BsYXk7XG4gICAgcmV0dXJuIF9tO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZU9sZE9ic2lkaWFuTGlua3ModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgb2xkTGluayA9IC9cXFtcXFsoWzAtOV0/XFxzW0EtWmEteiBdKylcXHMoXFxkKykjXFxeKFxcZCspKD86XFx8KFteXFxdXSspKT9cXF1cXF0vZztcbiAgcmV0dXJuIHRleHQucmVwbGFjZShvbGRMaW5rLCAoX20sIGJvb2tTaG9ydCwgY2gsIHZlcnNlLCBkaXNwKSA9PiB7XG4gICAgY29uc3QgYiA9IFN0cmluZyhib29rU2hvcnQpLnRyaW0oKTtcbiAgICByZXR1cm4gZGlzcFxuICAgICAgPyBgW1ske2J9I14ke2NofS0ke3ZlcnNlfXwke2Rpc3B9XV1gXG4gICAgICA6IGBbWyR7Yn0jXiR7Y2h9LSR7dmVyc2V9XV1gO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZmluZExhc3RCb29rQmVmb3JlKHRleHQ6IHN0cmluZywgcG9zOiBudW1iZXIsIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4pOiBzdHJpbmcgfCBudWxsIHtcbiAgLy8gTG9vayBiYWNrIH4yMDAgY2hhcnMgZm9yIGEgYm9vayB0b2tlbiBlbmRpbmcgcmlnaHQgYmVmb3JlICdwb3MnXG4gIGNvbnN0IHN0YXJ0ID0gTWF0aC5tYXgoMCwgcG9zIC0gMjAwKTtcbiAgY29uc3QgbGVmdCA9IHRleHQuc2xpY2Uoc3RhcnQsIHBvcyk7XG5cbiAgLy8gTWF0Y2ggQUxMIGJvb2sgdG9rZW5zIGluIHRoZSB3aW5kb3c7IHRha2UgdGhlIGxhc3Qgb25lLlxuICBjb25zdCByZSA9IG5ldyBSZWdFeHAoYCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccyokfCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccytgLCBcImdcIik7XG4gIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICBsZXQgbGFzdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgd2hpbGUgKChtID0gcmUuZXhlYyhsZWZ0KSkgIT09IG51bGwpIHtcbiAgICBsYXN0ID0gbVswXS50cmltKCk7XG4gIH1cbiAgaWYgKCFsYXN0KSByZXR1cm4gbnVsbDtcblxuICAvLyBzdHJpcCB0cmFpbGluZyBwdW5jdHVhdGlvbi9kb3QgYW5kIG5vcm1hbGl6ZVxuICByZXR1cm4gbm9ybWFsaXplQm9va1Rva2VuKGxhc3QucmVwbGFjZSgvXFxzKyQvLCBcIlwiKSwgY3R4KTtcbn1cblxuLyoqIC0tLS0tLS0tLS0tLSBWZXJzaW9uLWF3YXJlIGxpbmsgdGFyZ2V0IC0tLS0tLS0tLS0tLSAqL1xuZnVuY3Rpb24gZm9ybWF0Qm9va1RhcmdldChib29rU2hvcnQ6IHN0cmluZywgdmVyc2lvblNob3J0Pzogc3RyaW5nIHwgbnVsbCk6IHN0cmluZyB7XG4gIGlmICghdmVyc2lvblNob3J0KSByZXR1cm4gYm9va1Nob3J0O1xuICByZXR1cm4gYCR7Ym9va1Nob3J0fSAoJHt2ZXJzaW9uU2hvcnR9KWA7XG59XG5cbi8qKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQ29yZSBsaW5rZXIgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5mdW5jdGlvbiByZXBsYWNlVmVyc2VSZWZlcmVuY2VzT2ZNYWluVGV4dChcbiAgdGV4dDogc3RyaW5nLFxuICBjdHg6IFJldHVyblR5cGU8dHlwZW9mIGJ1aWxkQm9va0NvbnRleHQ+LFxuICBvcHRzOiB7XG4gICAgcmVtb3ZlT2JzaWRpYW5MaW5rczogYm9vbGVhbjtcbiAgICByZXdyaXRlT2xkTGlua3M6IGJvb2xlYW47XG4gICAgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZTogYm9vbGVhbjtcbiAgICB2ZXJzaW9uU2hvcnQ/OiBzdHJpbmcgfCBudWxsOyAvLyBORVdcbiAgfVxuKTogc3RyaW5nIHtcbiAgaWYgKG9wdHMuc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSkgdGV4dCA9IHJlbW92ZU1hdGNoaW5nTWFya2Rvd25MaW5rcyh0ZXh0LCBjdHguUEFUVEVSTl9IRUFEKTtcbiAgaWYgKG9wdHMucmVtb3ZlT2JzaWRpYW5MaW5rcykgdGV4dCA9IHJlbW92ZU1hdGNoaW5nT2JzaWRpYW5MaW5rcyh0ZXh0LCBjdHguUEFUVEVSTl9IRUFEKTtcbiAgaWYgKG9wdHMucmV3cml0ZU9sZExpbmtzKSB0ZXh0ID0gcmVwbGFjZU9sZE9ic2lkaWFuTGlua3ModGV4dCk7XG5cbiAgY29uc3QgcHJvdGVjdGVkUmFuZ2VzID0gZmluZFByb3RlY3RlZFJhbmdlcyh0ZXh0KTtcblxuICBsZXQgY3VycmVudF9ib29rOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgbGV0IGN1cnJlbnRfY2hhcHRlcjogbnVtYmVyIHwgc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGxldCBjdXJyZW50X3ZlcnNlOiBudW1iZXIgfCBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIGxldCBsYXN0UG9zID0gMDtcblxuICBjb25zdCB0YXJnZXRPZiA9IChib29rU2hvcnQ6IHN0cmluZykgPT4gZm9ybWF0Qm9va1RhcmdldChib29rU2hvcnQsIG9wdHMudmVyc2lvblNob3J0KTtcblxuICBjdHguUEFUVEVSTl9HLmxhc3RJbmRleCA9IDA7XG4gIGZvciAobGV0IG06IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGwgPSBjdHguUEFUVEVSTl9HLmV4ZWModGV4dCk7IG07IG0gPSBjdHguUEFUVEVSTl9HLmV4ZWModGV4dCkpIHtcbiAgICBjb25zdCBzdGFydCA9IG0uaW5kZXg7XG4gICAgY29uc3QgZW5kID0gc3RhcnQgKyBtWzBdLmxlbmd0aDtcblxuICAgIGlmIChcbiAgICAgIGluUHJvdGVjdGVkKHN0YXJ0LCBwcm90ZWN0ZWRSYW5nZXMpIHx8XG4gICAgICBpblByb3RlY3RlZChlbmQgLSAxLCBwcm90ZWN0ZWRSYW5nZXMpIHx8XG4gICAgICBpc1dpdGhpbk9ic2lkaWFuTGluayh0ZXh0LCBzdGFydCwgZW5kKSB8fFxuICAgICAgaXNJbnNpZGVOdW1lcmljUGFyZW5zKHRleHQsIHN0YXJ0LCBlbmQpXG4gICAgKSB7XG4gICAgICBvdXQucHVzaCh0ZXh0LnNsaWNlKGxhc3RQb3MsIHN0YXJ0KSwgbVswXSk7XG4gICAgICBsYXN0UG9zID0gZW5kO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgb3V0LnB1c2godGV4dC5zbGljZShsYXN0UG9zLCBzdGFydCkpO1xuICAgIGxhc3RQb3MgPSBlbmQ7XG5cbiAgICBjb25zdCBnID0gbS5ncm91cHMgPz8ge307XG5cbiAgICAvLyAtLS0tIGJvb2sgb25seVxuICAgIGlmIChnLmJvb2spIHtcbiAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihnLmJvb2ssIGN0eCk7IC8vIDwtLSBzdHJpcHMgdHJhaWxpbmcgZG90XG4gICAgICBjdXJyZW50X2NoYXB0ZXIgPSBudWxsO1xuICAgICAgY3VycmVudF92ZXJzZSA9IG51bGw7XG4gICAgICBvdXQucHVzaChtWzBdKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIC0tLS0gY2hhcHRlciAoY2guLCBjaGFwdGVyLCBjaGFwdGVycylcbiAgICBpZiAoZy5jaGFwdGVyKSB7XG4gICAgICBjb25zdCBjaG0gPSBnLmNoYXB0ZXIubWF0Y2goLyhcXGQrKS8pO1xuICAgICAgaWYgKGNobSAmJiBjdXJyZW50X2Jvb2spIHtcbiAgICAgICAgY29uc3QgY2ggPSBjaG1bMV07XG4gICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IGNoO1xuICAgICAgICBjdXJyZW50X3ZlcnNlID0gbnVsbDtcbiAgICAgICAgb3V0LnB1c2goYFtbJHt0YXJnZXRPZihjdXJyZW50X2Jvb2spfSNeJHtjaH18JHttWzBdfV1dYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXQucHVzaChtWzBdKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChnLnZlcnNlKSB7XG4gICAgICBpZiAoIWN1cnJlbnRfYm9vaykge1xuICAgICAgICBjb25zdCBpbmZlcnJlZCA9IGZpbmRMYXN0Qm9va0JlZm9yZSh0ZXh0LCBzdGFydCwgY3R4KTtcbiAgICAgICAgaWYgKGluZmVycmVkKSBjdXJyZW50X2Jvb2sgPSBpbmZlcnJlZDtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgb3V0LnB1c2gobVswXSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdmVyc2VUZXh0ID0gbVswXTsgICAgICAgICAgICAgICAvLyBlLmcuIFwidnYuIDdiLThhOlwiXG4gICAgICBjb25zdCBjaCA9IGN1cnJlbnRfY2hhcHRlciA/IFN0cmluZyhjdXJyZW50X2NoYXB0ZXIpIDogXCIxXCI7XG4gICAgICBjb25zdCB0YXJnZXQgPSB0YXJnZXRPZihjdXJyZW50X2Jvb2spO1xuXG4gICAgICAvLyBzcGxpdCBwYXlsb2FkIGFmdGVyIFwidi5cIiAvIFwidnYuXCIgYnkgY29tbWFzIG9yIFwiYW5kXCJcbiAgICAgIGNvbnN0IHBheWxvYWQgPSB2ZXJzZVRleHQucmVwbGFjZSgvXlxccypcXGJbVnZddj8oPzpcXC58ZXJzZXM/KVxccyovLCcnKTsgLy8gXCI3Yi04YTpcIlxuICAgICAgY29uc3QgY2h1bmtzID0gcGF5bG9hZC5zcGxpdCgvXFxzKig/Oix8KD86LD9cXHMqYW5kKVxccyopXFxzKi8pO1xuXG4gICAgICAvLyByZS1lbWl0IHRoZSBsZWFkaW5nIFwidi5cIiAvIFwidnYuXCIgcHJlZml4IGFzIHBsYWluIHRleHRcbiAgICAgIGNvbnN0IHByZWZpeCA9IHZlcnNlVGV4dC5zbGljZSgwLCB2ZXJzZVRleHQubGVuZ3RoIC0gcGF5bG9hZC5sZW5ndGgpO1xuICAgICAgb3V0LnB1c2gocHJlZml4KTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaHVua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHBpZWNlID0gY2h1bmtzW2ldO1xuICAgICAgICBpZiAoIXBpZWNlKSBjb250aW51ZTtcblxuICAgICAgICAvLyBrZWVwIHRoZSBvcmlnaW5hbCBkaXNwbGF5IChpbmNsdWRpbmcgYW55IHRyYWlsaW5nIHB1bmN0dWF0aW9uKVxuICAgICAgICBjb25zdCBkaXNwbGF5ID0gcGllY2U7XG5cbiAgICAgICAgLy8gc3RyaXAgb25lIHRyYWlsaW5nIHB1bmN0dWF0aW9uIGZvciBwYXJzaW5nIChrZWVwIGluIGxhYmVsKVxuICAgICAgICBjb25zdCBjb3JlID0gcGllY2UucmVwbGFjZShUUklNX1RBSUxfUFVOQ1QsIFwiXCIpO1xuXG4gICAgICAgIC8vIHJhbmdlP1xuICAgICAgICBjb25zdCBbbGVmdCwgcmlnaHRdID0gY29yZS5zcGxpdChSQU5HRV9TRVApLm1hcChzID0+IHM/LnRyaW0oKSk7XG4gICAgICAgIGlmIChyaWdodCkge1xuICAgICAgICAgIC8vIGxlZnQgbGlua1xuICAgICAgICAgIGNvbnN0IGxlZnROdW0gPSAobGVmdC5tYXRjaCgvXFxkKy8pPy5bMF0pID8/IFwiXCI7XG4gICAgICAgICAgb3V0LnB1c2goYFtbJHt0YXJnZXR9I14ke2NofS0ke2xlZnROdW19fCR7bGVmdH1dXWApO1xuICAgICAgICAgIG91dC5wdXNoKFwiXHUyMDEzXCIpOyAvLyByZS1lbWl0IGEgZGFzaCAoY2hvb3NlIHRoZSBjYW5vbmljYWwgZW4gZGFzaCBpbiBvdXRwdXQpXG4gICAgICAgICAgLy8gcmlnaHQgbGlua1xuICAgICAgICAgIGNvbnN0IHJpZ2h0TnVtID0gKHJpZ2h0Lm1hdGNoKC9cXGQrLyk/LlswXSkgPz8gXCJcIjtcbiAgICAgICAgICAvLyByZWNvbnN0cnVjdCBkaXNwbGF5IHRhaWwgKHJpZ2h0LCBidXQgaWYgb3JpZ2luYWwgaGFkIHRyYWlsaW5nIHB1bmN0LCBwdXQgaXQgYmFjayBvbiByaWdodCBlbmQpXG4gICAgICAgICAgY29uc3QgdHJhaWxpbmcgPSBwaWVjZS5lbmRzV2l0aChcIjpcIikgPyBcIjpcIiA6IChwaWVjZS5lbmRzV2l0aChcIjtcIikgPyBcIjtcIiA6IChwaWVjZS5lbmRzV2l0aChcIi5cIikgPyBcIi5cIiA6IFwiXCIpKTtcbiAgICAgICAgICBvdXQucHVzaChgW1ske3RhcmdldH0jXiR7Y2h9LSR7cmlnaHROdW19fCR7cmlnaHR9JHt0cmFpbGluZ31dXWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIHNpbmdsZSB2ZXJzZSBsaWtlIFwiN2JcIiAocG9zc2libHkgd2l0aCB0cmFpbGluZyBcIjpcIiBvciBcIjtcIilcbiAgICAgICAgICBjb25zdCB2TnVtID0gKGNvcmUubWF0Y2goL1xcZCsvKT8uWzBdKSA/PyBcIlwiO1xuICAgICAgICAgIG91dC5wdXNoKGBbWyR7dGFyZ2V0fSNeJHtjaH0tJHt2TnVtfXwke2Rpc3BsYXl9XV1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpIDwgY2h1bmtzLmxlbmd0aCAtIDEpIG91dC5wdXNoKFwiLCBcIik7IC8vIHB1dCBjb21tYXMgYmFjayBiZXR3ZWVuIGNodW5rc1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gLS0tLSBub3RlKHMpXG4gICAgaWYgKGcubm90ZSkge1xuICAgICAgY29uc3Qgbm90ZVRleHQgPSBnLm5vdGUgYXMgc3RyaW5nO1xuICAgICAgY29uc3QgcGFydHMgPSBub3RlVGV4dC5zcGxpdCgvXFxzKy8pO1xuICAgICAgbGV0IGJvb2tTdWJzdHJpbmcgPSBmYWxzZTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGFydCA9IHBhcnRzW2ldO1xuICAgICAgICBjb25zdCBwbSA9IHBhcnQubWF0Y2goL14oXFxkKykvKTtcbiAgICAgICAgaWYgKHBtICYmICFib29rU3Vic3RyaW5nKSB7XG4gICAgICAgICAgY29uc3QgdmVyc2UgPSBwbVsxXTtcbiAgICAgICAgICBpZiAoKGkgKyAxIDwgcGFydHMubGVuZ3RoICYmICEvXlxcZCsvLnRlc3QocGFydHNbaSArIDFdKSkgfHwgaSArIDEgPj0gcGFydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBvdXQucHVzaChcIiBcIiArIHBhcnQpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IHBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAocGFydHNbal0gPT09IFwiaW5cIiAmJiBqICsgMSA8IHBhcnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICBpZiAoL15cXGQrJC8udGVzdChwYXJ0c1tqICsgMV0pICYmIGogKyAyIDwgcGFydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYm9vayA9IHBhcnRzW2ogKyAxXSArIFwiIFwiICsgcGFydHNbaiArIDJdO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IHBhcnRzW2ogKyAzXTtcbiAgICAgICAgICAgICAgICBjdXJyZW50X2Jvb2sgPSBub3JtYWxpemVCb29rVG9rZW4oYm9vaywgY3R4KTsgLy8gPC0tIG5vcm1hbGl6ZVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJvb2sgPSBwYXJ0c1tqICsgMV07XG4gICAgICAgICAgICAgICAgY3VycmVudF9jaGFwdGVyID0gcGFydHNbaiArIDJdO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihib29rLCBjdHgpOyAvLyA8LS0gbm9ybWFsaXplXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGN1cnJlbnRfYm9vayAmJiBjdXJyZW50X2NoYXB0ZXIpIHtcbiAgICAgICAgICAgIG91dC5wdXNoKGAgW1ske3RhcmdldE9mKGN1cnJlbnRfYm9vayl9ICR7Y3VycmVudF9jaGFwdGVyfSNeJHt2ZXJzZX18JHtwYXJ0fV1dYCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dC5wdXNoKFwiIFwiICsgcGFydCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG91dC5wdXNoKChpID4gMCA/IFwiIFwiIDogXCJcIikgKyBwYXJ0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gLS0tLSBmdWxsIHJlZmVyZW5jZVxuICAgIGlmIChnLnJlZikge1xuICAgICAgY29uc3QgbW0gPSAoZy5yZWYgYXMgc3RyaW5nKS5tYXRjaCgvKFxccypbXFwuLDtdPykoLispLyk7XG4gICAgICBjb25zdCBsZWFkaW5nID0gbW0gPyBtbVsxXSA6IFwiXCI7XG4gICAgICBsZXQgcmVmVGV4dCA9IG1tID8gbW1bMl0gOiAoZy5yZWYgYXMgc3RyaW5nKTtcblxuICAgICAgY29uc3QgYm9va1N0YXJ0ID0gcmVmVGV4dC5tYXRjaChuZXcgUmVnRXhwKGBeKCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccyspYCkpO1xuICAgICAgbGV0IHByZWZpeDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgICBpZiAoYm9va1N0YXJ0KSB7XG4gICAgICAgIGNvbnN0IGJvb2tQYXJ0ID0gYm9va1N0YXJ0WzBdO1xuICAgICAgICBwcmVmaXggPSBib29rUGFydDsgLy8gZm9yIGRpc3BsYXkgdGV4dCAoY2FuIGtlZXAgaXRzIGRvdClcbiAgICAgICAgY3VycmVudF9ib29rID0gbm9ybWFsaXplQm9va1Rva2VuKGJvb2tQYXJ0LnJlcGxhY2UoL1xccyskLywgXCJcIiksIGN0eCk7IC8vIDwtLSBub3JtYWxpemUgZm9yIHRhcmdldFxuICAgICAgICByZWZUZXh0ID0gcmVmVGV4dC5zbGljZShib29rUGFydC5sZW5ndGgpO1xuICAgICAgfVxuICAgICAgaWYgKCFjdXJyZW50X2Jvb2spIHtcbiAgICAgICAgLy8gRmFsbGJhY2s6IGluZmVyIGJvb2sgZnJvbSBsZWZ0IGNvbnRleHQgKGUuZy4sIFwiXHUyMDI2IEpvaG4gMToyOTsgMTI6MjQ7IFx1MjAyNlwiKVxuICAgICAgICBjb25zdCBpbmZlcnJlZCA9IGZpbmRMYXN0Qm9va0JlZm9yZSh0ZXh0LCBzdGFydCwgY3R4KTtcbiAgICAgICAgaWYgKGluZmVycmVkKSB7XG4gICAgICAgICAgY3VycmVudF9ib29rID0gaW5mZXJyZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3V0LnB1c2gobVswXSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgcGFydHMgPSByZWZUZXh0LnJlcGxhY2UoL1xcLi9nLCBcIlwiKS50cmltKCkuc3BsaXQoLyg7fCwpLyk7XG4gICAgICBjb25zdCByZXN1bHQ6IHN0cmluZ1tdID0gW107XG4gICAgICBsZXQgdmVyc2VTdHJpbmcgPSBmYWxzZTtcbiAgICAgIGN1cnJlbnRfY2hhcHRlciA9IG51bGw7XG4gICAgICBsZXQgbG9jYWxfY3VycmVudF92ZXJzZTogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGFydCA9IHBhcnRzW2ldO1xuICAgICAgICBpZiAocGFydCA9PT0gXCIsXCIgfHwgcGFydCA9PT0gXCI7XCIpIHtcbiAgICAgICAgICByZXN1bHQucHVzaChwYXJ0ICsgXCIgXCIpO1xuICAgICAgICAgIHZlcnNlU3RyaW5nID0gKHBhcnQgPT09IFwiLFwiKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwID0gcGFydC50cmltKCk7XG4gICAgICAgIGlmICghcCkgY29udGludWU7XG5cbiAgICAgICAgbGV0IGNoYXA6IHN0cmluZyB8IG51bWJlciB8IG51bGwgPSBjdXJyZW50X2NoYXB0ZXI7XG4gICAgICAgIGxldCB2OiBzdHJpbmcgfCBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgICAgICAgbGV0IHZFbmQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGlmIChwLmluY2x1ZGVzKFwiOlwiKSkge1xuICAgICAgICAgIGNvbnN0IFtjU3RyLCB2U3RyXSA9IHAuc3BsaXQoXCI6XCIpO1xuICAgICAgICAgIGNoYXAgPSBjU3RyO1xuICAgICAgICAgIHYgPSB2U3RyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh2ZXJzZVN0cmluZykgdiA9IHA7XG4gICAgICAgICAgZWxzZSB7IGNoYXAgPSBwOyB2ID0gbnVsbDsgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjaGFwICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgY29uc3QgY2hzID0gU3RyaW5nKGNoYXAgPz8gXCJcIikuc3BsaXQoUkFOR0VfU0VQKTtcbiAgICAgICAgICBjaGFwID0gcGFyc2VJbnQoY2hzWzBdLnJlcGxhY2UoL1thLXpdJC9pLCBcIlwiKSwgMTApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICBjb25zdCB2cyA9IFN0cmluZyh2KS5zcGxpdChSQU5HRV9TRVApO1xuICAgICAgICAgIGxvY2FsX2N1cnJlbnRfdmVyc2UgPSBwYXJzZUludCh2c1swXS5yZXBsYWNlKC9bYS16XSQvaSwgXCJcIiksIDEwKTtcbiAgICAgICAgICB2RW5kID0gdnMubGVuZ3RoID4gMSA/IHBhcnNlSW50KHZzWzFdLnJlcGxhY2UoL1thLXpdJC9pLCBcIlwiKSwgMTApIDogbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2NhbF9jdXJyZW50X3ZlcnNlID0gbnVsbDtcbiAgICAgICAgICB2RW5kID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRhcmdldCA9IHRhcmdldE9mKGN1cnJlbnRfYm9vayk7XG5cbiAgICAgICAgaWYgKHZFbmQpIHtcbiAgICAgICAgICAvLyBjYXB0dXJlIG9yaWdpbmFsIHNlcGFyYXRvciB0byByZS1lbWl0IGJldHdlZW4gbGlua3NcbiAgICAgICAgICBjb25zdCBzZXBNYXRjaCA9IHAubWF0Y2gobmV3IFJlZ0V4cChSQU5HRV9TRVAuc291cmNlKSk7XG4gICAgICAgICAgY29uc3Qgc2VwT3V0ICAgPSBzZXBNYXRjaD8uWzBdID8/IFwiLVwiO1xuXG4gICAgICAgICAgLy8gbGVmdCBkaXNwbGF5IHdpdGhvdXQgdHJhaWxpbmcgbnVtYmVyIEFORCB3aXRob3V0IHRyYWlsaW5nIHNlcGFyYXRvclxuICAgICAgICAgIGNvbnN0IGxlZnREaXNwTm9OdW0gPSBwLnJlcGxhY2UoL1xcZCtbYS16XT8kL2ksIFwiXCIpOyAgICAgICAgICAgICAgICAgLy8gZS5nLiBcIk9mZmIuIDE6NFx1MjAxM1wiXG4gICAgICAgICAgY29uc3QgbGVmdERpc3AgICAgICA9IGxlZnREaXNwTm9OdW0ucmVwbGFjZShuZXcgUmVnRXhwKGAke1JBTkdFX1NFUC5zb3VyY2V9XFxcXHMqJGApLCBcIlwiKTsgLy8gXCJPZmZiLiAxOjRcIlxuXG4gICAgICAgICAgLy8gcmlnaHQgZGlzcGxheSBpcyB0aGUgdHJhaWxpbmcgbnVtYmVyICh3aXRoIG9wdGlvbmFsIGxldHRlcilcbiAgICAgICAgICBjb25zdCByaWdodERpc3AgPSAocC5tYXRjaCgvKFxcZCtbYS16XT8pJC9pKT8uWzFdID8/IFwiXCIpO1xuXG4gICAgICAgICAgLy8gbGVmdCBsaW5rIChubyBkYXNoIGluc2lkZSlcbiAgICAgICAgICByZXN1bHQucHVzaChgW1ske3RhcmdldH0jXiR7Y2hhcH0tJHtsb2NhbF9jdXJyZW50X3ZlcnNlfXwkeyhwcmVmaXggPz8gXCJcIil9JHtsZWZ0RGlzcH1dXWApO1xuICAgICAgICAgIC8vIHNlcGFyYXRvciBCRVRXRUVOIGxpbmtzXG4gICAgICAgICAgcmVzdWx0LnB1c2goc2VwT3V0KTtcbiAgICAgICAgICAvLyByaWdodCBsaW5rXG4gICAgICAgICAgY29uc3QgdkVuZE51bSA9IHBhcnNlSW50KFN0cmluZyh2RW5kKS5yZXBsYWNlKC9bYS16XSQvaSwgXCJcIiksIDEwKTtcbiAgICAgICAgICByZXN1bHQucHVzaChgW1ske3RhcmdldH0jXiR7Y2hhcH0tJHt2RW5kTnVtfXwke3JpZ2h0RGlzcH1dXWApO1xuXG4gICAgICAgICAgbG9jYWxfY3VycmVudF92ZXJzZSA9IHZFbmROdW07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0LnB1c2goYFtbJHt0YXJnZXR9I14ke2NoYXB9JHtsb2NhbF9jdXJyZW50X3ZlcnNlID8gYC0ke2xvY2FsX2N1cnJlbnRfdmVyc2V9YCA6IFwiXCJ9fCR7cHJlZml4ID8gcHJlZml4IDogXCJcIn0ke3B9XV1gKTtcbiAgICAgICAgfVxuICAgICAgICBwcmVmaXggPSBudWxsO1xuICAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBjaGFwO1xuICAgICAgICBjdXJyZW50X3ZlcnNlID0gbG9jYWxfY3VycmVudF92ZXJzZTtcbiAgICAgIH1cblxuICAgICAgb3V0LnB1c2gobGVhZGluZyArIHJlc3VsdC5qb2luKFwiXCIpKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIG91dC5wdXNoKG1bMF0pO1xuICB9XG5cbiAgb3V0LnB1c2godGV4dC5zbGljZShsYXN0UG9zKSk7XG4gIHJldHVybiBvdXQuam9pbihcIlwiKTtcbn1cblxuLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQdWJsaWMgQVBJIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxpbmtWZXJzZXNJblRleHQoXG4gIHRleHQ6IHN0cmluZyxcbiAgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncyxcbiAgdmVyc2lvblNob3J0Pzogc3RyaW5nIHwgbnVsbFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgY3R4ID0gYnVpbGRCb29rQ29udGV4dChzZXR0aW5ncyk7XG5cbiAgY29uc3QgcmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MgPSAoc2V0dGluZ3MgYXMgYW55KT8ucmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MgPz8gdHJ1ZTtcbiAgY29uc3QgcmV3cml0ZU9sZE9ic2lkaWFuTGlua3MgPSAoc2V0dGluZ3MgYXMgYW55KT8ucmV3cml0ZU9sZE9ic2lkaWFuTGlua3MgPz8gdHJ1ZTtcbiAgY29uc3Qgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSA9IChzZXR0aW5ncyBhcyBhbnkpPy5zdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlID8/IHRydWU7XG5cbiAgcmV0dXJuIHJlcGxhY2VWZXJzZVJlZmVyZW5jZXNPZk1haW5UZXh0KHRleHQsIGN0eCwge1xuICAgIHJlbW92ZU9ic2lkaWFuTGlua3M6IHJlbW92ZU9ic2lkaWFuRGlzcGxheUxpbmtzLFxuICAgIHJld3JpdGVPbGRMaW5rczogcmV3cml0ZU9sZE9ic2lkaWFuTGlua3MsXG4gICAgc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSxcbiAgICB2ZXJzaW9uU2hvcnQ6IHZlcnNpb25TaG9ydCA/PyBudWxsLFxuICB9KTtcbn1cblxuXG4vKiogPT09PT09PT09PT09PT09PT09PT09PT09PT0gQ29tbWFuZHMgPT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbW1hbmRWZXJzZUxpbmtzKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzLCBwYXJhbXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSB7XG4gIGNvbnN0IHNjb3BlID0gcGFyYW1zPy5zY29wZSA/PyBcImN1cnJlbnRcIjtcblxuICBjb25zdCBmaWxlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gIGlmIChzY29wZSA9PT0gXCJmb2xkZXJcIikge1xuICAgIGNvbnN0IGFjdGl2ZSA9IGZpbGU7XG4gICAgY29uc3QgZm9sZGVyID0gYWN0aXZlPy5wYXJlbnQ7XG4gICAgaWYgKCFhY3RpdmUgfHwgIWZvbGRlcikge1xuICAgICAgbmV3IE5vdGljZShcIk9wZW4gYSBmaWxlIGluc2lkZSB0aGUgdGFyZ2V0IGZvbGRlci5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbiAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIFRGaWxlICYmIGNoaWxkLmV4dGVuc2lvbiA9PT0gXCJtZFwiKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChjaGlsZCk7XG4gICAgICAgIGNvbnN0IHsgeWFtbCwgYm9keSB9ID0gc3BsaXRGcm9udG1hdHRlcihjb250ZW50KTtcbiAgICAgICAgY29uc3QgbGlua2VkID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChib2R5LCBzZXR0aW5ncywgc2V0dGluZ3MuYmlibGVEZWZhdWx0VmVyc2lvbik7IC8vIGRlZmF1bHQ6IG5vIHZlcnNpb25cbiAgICAgICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShjaGlsZCwgKHlhbWwgPz8gXCJcIikgKyBsaW5rZWQpO1xuICAgICAgfVxuICAgIH1cbiAgICBuZXcgTm90aWNlKFwiTGlua2VkIHZlcnNlcyBpbiBmb2xkZXIuXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICghZmlsZSkge1xuICAgIG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICBjb25zdCB7IHlhbWwsIGJvZHkgfSA9IHNwbGl0RnJvbnRtYXR0ZXIoY29udGVudCk7XG4gIGNvbnN0IGxpbmtlZCA9IGF3YWl0IGxpbmtWZXJzZXNJblRleHQoYm9keSwgc2V0dGluZ3MsIHNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb24pOyAvLyBkZWZhdWx0OiBubyB2ZXJzaW9uXG4gIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgKHlhbWwgPz8gXCJcIikgKyBsaW5rZWQpO1xuICBuZXcgTm90aWNlKFwiTGlua2VkIHZlcnNlcyBpbiBjdXJyZW50IGZpbGUuXCIpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZFZlcnNlTGlua3NTZWxlY3Rpb25PckxpbmUoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MpIHtcbiAgY29uc3QgbWRWaWV3ID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gIGlmICghbWRWaWV3KSB7XG4gICAgbmV3IE5vdGljZShcIk9wZW4gYSBNYXJrZG93biBmaWxlIGZpcnN0LlwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBlZGl0b3IgPSBtZFZpZXcuZWRpdG9yO1xuICBjb25zdCBzZWxlY3Rpb25UZXh0ID0gZWRpdG9yLmdldFNlbGVjdGlvbigpO1xuXG4gIGNvbnN0IHJ1biA9IGFzeW5jICh0ZXh0OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KHRleHQsIHNldHRpbmdzLCBzZXR0aW5ncy5iaWJsZURlZmF1bHRWZXJzaW9uKTsgLy8gZGVmYXVsdDogbm8gdmVyc2lvblxuICAgIHJldHVybiBsaW5rZWQ7XG4gIH07XG5cbiAgaWYgKHNlbGVjdGlvblRleHQgJiYgc2VsZWN0aW9uVGV4dC5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgbGlua2VkID0gYXdhaXQgcnVuKHNlbGVjdGlvblRleHQpO1xuICAgIGlmIChsaW5rZWQgIT09IHNlbGVjdGlvblRleHQpIHtcbiAgICAgIGVkaXRvci5yZXBsYWNlU2VsZWN0aW9uKGxpbmtlZCk7XG4gICAgICBuZXcgTm90aWNlKFwiTGlua2VkIHZlcnNlcyBpbiBzZWxlY3Rpb24uXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXcgTm90aWNlKFwiTm8gbGlua2FibGUgdmVyc2VzIGluIHNlbGVjdGlvbi5cIik7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGxpbmUgPSBlZGl0b3IuZ2V0Q3Vyc29yKCkubGluZTtcbiAgY29uc3QgbGluZVRleHQgPSBlZGl0b3IuZ2V0TGluZShsaW5lKTtcbiAgY29uc3QgbGlua2VkID0gYXdhaXQgcnVuKGxpbmVUZXh0KTtcbiAgaWYgKGxpbmtlZCAhPT0gbGluZVRleHQpIHtcbiAgICBlZGl0b3Iuc2V0TGluZShsaW5lLCBsaW5rZWQpO1xuICAgIG5ldyBOb3RpY2UoXCJMaW5rZWQgdmVyc2VzIG9uIGN1cnJlbnQgbGluZS5cIik7XG4gIH0gZWxzZSB7XG4gICAgbmV3IE5vdGljZShcIk5vIGxpbmthYmxlIHZlcnNlcyBvbiBjdXJyZW50IGxpbmUuXCIpO1xuICB9XG59XG5cbi8qKlxuICogTkVXOiBTYW1lIGFzIGFib3ZlLCBidXQgYXNrcyB1c2VyIHRvIGNob29zZSBhIHZlcnNpb24gKGlmIGNhdGFsb2d1ZSBsb2FkcykuXG4gKiBJZiB1c2VyIGNhbmNlbHMgLyBmYWlscyB0byBsb2FkLCBmYWxscyBiYWNrIHRvIG5vLXZlcnNpb24uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kVmVyc2VMaW5rc0Nob29zZVZlcnNpb24oYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MpIHtcbiAgY29uc3QgZmlsZSA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICBpZiAoIWZpbGUpIHtcbiAgICBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgZmlyc3QuXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlKSA9PiB7XG4gICAgbmV3IFBpY2tWZXJzaW9uTW9kYWwoYXBwLCBzZXR0aW5ncywgYXN5bmMgKHZlcnNpb25TaG9ydCkgPT4ge1xuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgICAgY29uc3QgeyB5YW1sLCBib2R5IH0gPSBzcGxpdEZyb250bWF0dGVyKGNvbnRlbnQpO1xuICAgICAgY29uc3QgbGlua2VkID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChib2R5LCBzZXR0aW5ncywgdmVyc2lvblNob3J0KTtcbiAgICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgKHlhbWwgPz8gXCJcIikgKyBsaW5rZWQpO1xuICAgICAgbmV3IE5vdGljZSh2ZXJzaW9uU2hvcnQgPyBgTGlua2VkIHZlcnNlcyAoXHUyMTkyICR7dmVyc2lvblNob3J0fSkuYCA6IFwiTGlua2VkIHZlcnNlcyAobm8gdmVyc2lvbikuXCIpO1xuICAgICAgcmVzb2x2ZShsaW5rZWQpO1xuICAgIH0pLm9wZW4oKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kVmVyc2VMaW5rc1NlbGVjdGlvbk9yTGluZUNob29zZVZlcnNpb24oYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MpIHtcbiAgY29uc3QgbWRWaWV3ID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gIGlmICghbWRWaWV3KSB7XG4gICAgbmV3IE5vdGljZShcIk9wZW4gYSBNYXJrZG93biBmaWxlIGZpcnN0LlwiKTtcbiAgICByZXR1cm47XG4gIH1cbiAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUpID0+IHtcbiAgICBuZXcgUGlja1ZlcnNpb25Nb2RhbChhcHAsIHNldHRpbmdzLCBhc3luYyAodmVyc2lvblNob3J0KSA9PiB7XG4gICAgICBjb25zdCBlZGl0b3IgPSBtZFZpZXcuZWRpdG9yO1xuICAgICAgY29uc3Qgc2VsZWN0aW9uVGV4dCA9IGVkaXRvci5nZXRTZWxlY3Rpb24oKTtcblxuICAgICAgY29uc3QgcnVuID0gYXN5bmMgKHRleHQ6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KHRleHQsIHNldHRpbmdzLCB2ZXJzaW9uU2hvcnQpO1xuICAgICAgICByZXR1cm4gbGlua2VkO1xuICAgICAgfTtcblxuICAgICAgaWYgKHNlbGVjdGlvblRleHQgJiYgc2VsZWN0aW9uVGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGxpbmtlZCA9IGF3YWl0IHJ1bihzZWxlY3Rpb25UZXh0KTtcbiAgICAgICAgaWYgKGxpbmtlZCAhPT0gc2VsZWN0aW9uVGV4dCkge1xuICAgICAgICAgIGVkaXRvci5yZXBsYWNlU2VsZWN0aW9uKGxpbmtlZCk7XG4gICAgICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgICAgIHZlcnNpb25TaG9ydCA/IGBMaW5rZWQgKHNlbGVjdGlvbikgXHUyMTkyICR7dmVyc2lvblNob3J0fS5gIDogXCJMaW5rZWQgKHNlbGVjdGlvbikgd2l0aG91dCB2ZXJzaW9uLlwiXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXcgTm90aWNlKFwiTm8gbGlua2FibGUgdmVyc2VzIGluIHNlbGVjdGlvbi5cIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBsaW5lID0gZWRpdG9yLmdldEN1cnNvcigpLmxpbmU7XG4gICAgICBjb25zdCBsaW5lVGV4dCA9IGVkaXRvci5nZXRMaW5lKGxpbmUpO1xuICAgICAgY29uc3QgbGlua2VkID0gYXdhaXQgcnVuKGxpbmVUZXh0KTtcbiAgICAgIGlmIChsaW5rZWQgIT09IGxpbmVUZXh0KSB7XG4gICAgICAgIGVkaXRvci5zZXRMaW5lKGxpbmUsIGxpbmtlZCk7XG4gICAgICAgIG5ldyBOb3RpY2UodmVyc2lvblNob3J0ID8gYExpbmtlZCAobGluZSkgXHUyMTkyICR7dmVyc2lvblNob3J0fS5gIDogXCJMaW5rZWQgKGxpbmUpIHdpdGhvdXQgdmVyc2lvbi5cIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXcgTm90aWNlKFwiTm8gbGlua2FibGUgdmVyc2VzIG9uIGN1cnJlbnQgbGluZS5cIik7XG4gICAgICB9XG4gICAgICByZXNvbHZlKGxpbmtlZCk7XG4gICAgfSkub3BlbigpO1xuICB9KTtcbn1cblxuLy8gaW1wb3J0IHsgQXBwLCBNYXJrZG93blZpZXcsIE5vdGljZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbi8vIGltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuLy8gaW1wb3J0IHsgc3BsaXRGcm9udG1hdHRlciB9IGZyb20gXCIuLi9saWIvbWRVdGlsc1wiO1xuXG4vLyAvKiogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyAgKiAgQk9PSyBNQVAgKGRlZmF1bHQsIEVuZ2xpc2gpXG4vLyAgKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG5cbi8vIGNvbnN0IEJPT0tfQUJCUjogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbi8vICAgXCJHZW5lc2lzXCI6IFwiR2VuXCIsXG4vLyAgIFwiRXhvZHVzXCI6IFwiRXhvXCIsXG4vLyAgIFwiTGV2aXRpY3VzXCI6IFwiTGV2XCIsXG4vLyAgIFwiTnVtYmVyc1wiOiBcIk51bVwiLFxuLy8gICBcIkRldXRlcm9ub215XCI6IFwiRGV1dFwiLFxuLy8gICBcIkpvc2h1YVwiOiBcIkpvc2hcIixcbi8vICAgXCJKdWRnZXNcIjogXCJKdWRnXCIsXG4vLyAgIFwiUnV0aFwiOiBcIlJ1dGhcIixcbi8vICAgXCIxIFNhbXVlbFwiOiBcIjEgU2FtXCIsXG4vLyAgIFwiRmlyc3QgU2FtdWVsXCI6IFwiMSBTYW1cIixcbi8vICAgXCIyIFNhbXVlbFwiOiBcIjIgU2FtXCIsXG4vLyAgIFwiU2Vjb25kIFNhbXVlbFwiOiBcIjIgU2FtXCIsXG4vLyAgIFwiMSBLaW5nc1wiOiBcIjEgS2luZ3NcIixcbi8vICAgXCJGaXJzdCBLaW5nc1wiOiBcIjEgS2luZ3NcIixcbi8vICAgXCIyIEtpbmdzXCI6IFwiMiBLaW5nc1wiLFxuLy8gICBcIlNlY29uZCBLaW5nc1wiOiBcIjIgS2luZ3NcIixcbi8vICAgXCIxIENocm9uaWNsZXNcIjogXCIxIENocm9uXCIsXG4vLyAgIFwiRmlyc3QgQ2hyb25pY2xlc1wiOiBcIjEgQ2hyb25cIixcbi8vICAgXCIyIENocm9uaWNsZXNcIjogXCIyIENocm9uXCIsXG4vLyAgIFwiU2Vjb25kIENocm9uaWNsZXNcIjogXCIyIENocm9uXCIsXG4vLyAgIFwiRXpyYVwiOiBcIkV6cmFcIixcbi8vICAgXCJOZWhlbWlhaFwiOiBcIk5laFwiLFxuLy8gICBcIkVzdGhlclwiOiBcIkVzdGhcIixcbi8vICAgXCJKb2JcIjogXCJKb2JcIixcbi8vICAgXCJQc2FsbXNcIjogXCJQc2FcIixcbi8vICAgXCJQc2FsbVwiOiBcIlBzYVwiLFxuLy8gICBcIlByb3ZlcmJzXCI6IFwiUHJvdlwiLFxuLy8gICBcIkVjY2xlc2lhc3Rlc1wiOiBcIkVjY2xcIixcbi8vICAgXCJTb25nIG9mIFNvbG9tb25cIjogXCJTb1NcIixcbi8vICAgXCJTb25nIG9mIFNvbmdzXCI6IFwiU29TXCIsXG4vLyAgIFwiUy5TXCI6IFwiU29TXCIsXG4vLyAgIFwiUy5TLlwiOiBcIlNvU1wiLFxuLy8gICBcIlMuIFMuXCI6IFwiU29TXCIsXG4vLyAgIFwiUy4gU1wiOiBcIlNvU1wiLFxuLy8gICBcIlNTXCI6IFwiU29TXCIsXG4vLyAgIFwiSXNhaWFoXCI6IFwiSXNhXCIsXG4vLyAgIFwiSmVyZW1pYWhcIjogXCJKZXJcIixcbi8vICAgXCJMYW1lbnRhdGlvbnNcIjogXCJMYW1cIixcbi8vICAgXCJFemVraWVsXCI6IFwiRXpla1wiLFxuLy8gICBcIkRhbmllbFwiOiBcIkRhblwiLFxuLy8gICBcIkhvc2VhXCI6IFwiSG9zZWFcIixcbi8vICAgXCJKb2VsXCI6IFwiSm9lbFwiLFxuLy8gICBcIkFtb3NcIjogXCJBbW9zXCIsXG4vLyAgIFwiT2JhZGlhaFwiOiBcIk9iYWRcIixcbi8vICAgXCJKb25haFwiOiBcIkpvbmFoXCIsXG4vLyAgIFwiTWljYWhcIjogXCJNaWNhaFwiLFxuLy8gICBcIk5haHVtXCI6IFwiTmFoXCIsXG4vLyAgIFwiSGFiYWtrdWtcIjogXCJIYWJcIixcbi8vICAgXCJaZXBoYW5pYWhcIjogXCJaZXBcIixcbi8vICAgXCJIYWdnYWlcIjogXCJIYWdcIixcbi8vICAgXCJaZWNoYXJpYWhcIjogXCJaZWNoXCIsXG4vLyAgIFwiTWFsYWNoaVwiOiBcIk1hbFwiLFxuLy8gICBcIk1hdHRoZXdcIjogXCJNYXR0XCIsXG4vLyAgIFwiTWFya1wiOiBcIk1hcmtcIixcbi8vICAgXCJMdWtlXCI6IFwiTHVrZVwiLFxuLy8gICBcIkpvaG5cIjogXCJKb2huXCIsXG4vLyAgIFwiQWN0c1wiOiBcIkFjdHNcIixcbi8vICAgXCJSb21hbnNcIjogXCJSb21cIixcbi8vICAgXCIxIENvcmludGhpYW5zXCI6IFwiMSBDb3JcIixcbi8vICAgXCJGaXJzdCBDb3JpbnRoaWFuc1wiOiBcIjEgQ29yXCIsXG4vLyAgIFwiMiBDb3JpbnRoaWFuc1wiOiBcIjIgQ29yXCIsXG4vLyAgIFwiU2Vjb25kIENvcmludGhpYW5zXCI6IFwiMiBDb3JcIixcbi8vICAgXCJHYWxhdGlhbnNcIjogXCJHYWxcIixcbi8vICAgXCJFcGhlc2lhbnNcIjogXCJFcGhcIixcbi8vICAgXCJQaGlsaXBwaWFuc1wiOiBcIlBoaWxcIixcbi8vICAgXCJDb2xvc3NpYW5zXCI6IFwiQ29sXCIsXG4vLyAgIFwiMSBUaGVzc2Fsb25pYW5zXCI6IFwiMSBUaGVzXCIsXG4vLyAgIFwiRmlyc3QgVGhlc3NhbG9uaWFuc1wiOiBcIjEgVGhlc1wiLFxuLy8gICBcIjIgVGhlc3NhbG9uaWFuc1wiOiBcIjIgVGhlc1wiLFxuLy8gICBcIlNlY29uZCBUaGVzc2Fsb25pYW5zXCI6IFwiMiBUaGVzXCIsXG4vLyAgIFwiMSBUaW1vdGh5XCI6IFwiMSBUaW1cIixcbi8vICAgXCJGaXJzdCBUaW1vdGh5XCI6IFwiMSBUaW1cIixcbi8vICAgXCIyIFRpbW90aHlcIjogXCIyIFRpbVwiLFxuLy8gICBcIlNlY29uZCBUaW1vdGh5XCI6IFwiMiBUaW1cIixcbi8vICAgXCJUaXR1c1wiOiBcIlRpdHVzXCIsXG4vLyAgIFwiUGhpbGVtb25cIjogXCJQaGlsZW1cIixcbi8vICAgXCJIZWJyZXdzXCI6IFwiSGViXCIsXG4vLyAgIFwiSmFtZXNcIjogXCJKYW1lc1wiLFxuLy8gICBcIjEgUGV0ZXJcIjogXCIxIFBldFwiLFxuLy8gICBcIkZpcnN0IFBldGVyXCI6IFwiMSBQZXRcIixcbi8vICAgXCIyIFBldGVyXCI6IFwiMiBQZXRcIixcbi8vICAgXCJTZWNvbmQgUGV0ZXJcIjogXCIyIFBldFwiLFxuLy8gICBcIjEgSm9oblwiOiBcIjEgSm9oblwiLFxuLy8gICBcIkZpcnN0IEpvaG5cIjogXCIxIEpvaG5cIixcbi8vICAgXCIyIEpvaG5cIjogXCIyIEpvaG5cIixcbi8vICAgXCJTZWNvbmQgSm9oblwiOiBcIjIgSm9oblwiLFxuLy8gICBcIjMgSm9oblwiOiBcIjMgSm9oblwiLFxuLy8gICBcIlRoaXJkIEpvaG5cIjogXCIzIEpvaG5cIixcbi8vICAgXCJKdWRlXCI6IFwiSnVkZVwiLFxuLy8gICBcIlJldmVsYXRpb25cIjogXCJSZXZcIlxuLy8gfTtcblxuLy8gdHlwZSBCb29rTWFwID0gUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbi8vIGNvbnN0IGVzY2FwZVJlID0gKHM6IHN0cmluZykgPT4gcy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG5cbi8vIC8qKiBCdWlsZCBsb2NhbGUtc3BlY2lmaWMgYm9vayBtYXAgKyBhbHRlcm5hdGlvbiBhdCBydW50aW1lICovXG4vLyBmdW5jdGlvbiBidWlsZEJvb2tDb250ZXh0KHNldHRpbmdzPzogQmlibGVUb29sc1NldHRpbmdzKSB7XG4vLyAgIGxldCBib29rTG9jYWxlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4vLyAgIGxldCBjdXN0b206IHVua25vd247XG5cbi8vICAgdHJ5IHsgYm9va0xvY2FsZSA9IChzZXR0aW5ncyBhcyBhbnkpPy5ib29rTG9jYWxlIGFzIHN0cmluZyB8IHVuZGVmaW5lZDsgfSBjYXRjaCB7fVxuLy8gICB0cnkgeyBjdXN0b20gPSAoc2V0dGluZ3MgYXMgYW55KT8uY3VzdG9tQm9va01hcDsgfSBjYXRjaCB7fVxuXG4vLyAgIGxldCBhYmJyOiBCb29rTWFwID0gQk9PS19BQkJSO1xuXG4vLyAgIGlmIChib29rTG9jYWxlID09PSBcImN1c3RvbVwiICYmIGN1c3RvbSkge1xuLy8gICAgIHRyeSB7XG4vLyAgICAgICBpZiAodHlwZW9mIGN1c3RvbSA9PT0gXCJzdHJpbmdcIikge1xuLy8gICAgICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGN1c3RvbSk7XG4vLyAgICAgICAgIGlmIChwYXJzZWQgJiYgdHlwZW9mIHBhcnNlZCA9PT0gXCJvYmplY3RcIikgYWJiciA9IHBhcnNlZCBhcyBCb29rTWFwO1xuLy8gICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY3VzdG9tID09PSBcIm9iamVjdFwiKSB7XG4vLyAgICAgICAgIGFiYnIgPSBjdXN0b20gYXMgQm9va01hcDtcbi8vICAgICAgIH1cbi8vICAgICB9IGNhdGNoIHtcbi8vICAgICAgIGFiYnIgPSBCT09LX0FCQlI7XG4vLyAgICAgfVxuLy8gICB9IGVsc2Uge1xuLy8gICAgIGFiYnIgPSBCT09LX0FCQlI7XG4vLyAgIH1cblxuLy8gICBjb25zdCBhbGxUb2tlbnMgPSBBcnJheS5mcm9tKG5ldyBTZXQoWy4uLk9iamVjdC5rZXlzKGFiYnIpLCAuLi5PYmplY3QudmFsdWVzKGFiYnIpXSkpLnNvcnQoXG4vLyAgICAgKGEsIGIpID0+IGIubGVuZ3RoIC0gYS5sZW5ndGhcbi8vICAgKTtcbi8vICAgY29uc3QgQk9PS19BTFQgPSBhbGxUb2tlbnMubWFwKGVzY2FwZVJlKS5qb2luKFwifFwiKTtcblxuLy8gICBjb25zdCBnZXRCb29rQWJiciA9IChib29rOiBzdHJpbmcpID0+IGFiYnJbYm9va10gPz8gYm9vaztcblxuLy8gICBjb25zdCBidWlsZFBhdHRlcm5Cb2R5ID0gKCk6IHN0cmluZyA9PiB7XG4vLyAgICAgY29uc3QgYm9vayA9IGAoPzoke0JPT0tfQUxUfSlgO1xuLy8gICAgIC8vIGNvbnN0IHJlZjEgPVxuLy8gICAgIC8vICAgYCg/Oig/OiR7Ym9va30pXFxcXC4/XFxcXHMqYCArXG4vLyAgICAgLy8gICBgXFxcXGQrKD86LVxcXFxkKyk/OlxcXFxkK1thLXpdPyg/Oi1cXFxcZCspP1thLXpdP2AgK1xuLy8gICAgIC8vICAgYCg/OlxcXFxzKixcXFxccypcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT98XFxcXHMqO1xcXFxzKlxcXFxkKzpcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT8pKmAgK1xuLy8gICAgIC8vICAgYClgO1xuLy8gICAgIGNvbnN0IHJlZjEgPVxuLy8gICAgICAgYCg/Oig/OiR7Ym9va30pP1xcXFwuP1xcXFxzKmAgK1xuLy8gICAgICAgYFxcXFxkKyg/Oi1cXFxcZCspPzpcXFxcZCtbYS16XT8oPzotXFxcXGQrKT9bYS16XT9gICtcbi8vICAgICAgIGAoPzpcXFxccyosXFxcXHMqXFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/fFxcXFxzKjtcXFxccypcXFxcZCs6XFxcXGQrW2Etel0/KD86LVxcXFxkKyk/W2Etel0/KSpgICtcbi8vICAgICAgIGApYDtcbi8vICAgICBjb25zdCByZWYyID0gYCg/Oigke2Jvb2t9KVxcXFwuP1xcXFxzKyhcXFxcZCspKD86LShcXFxcZCspKT8pYDtcbi8vICAgICBjb25zdCBSRUYgPSBgKD88cmVmPiR7cmVmMX18JHtyZWYyfSlgO1xuXG4vLyAgICAgY29uc3QgVkVSU0UgPVxuLy8gICAgICAgYCg/PHZlcnNlPmAgK1xuLy8gICAgICAgYFxcXFxiW1Z2XXY/KD86XFxcXC58ZXJzZXM/KVxcXFxzKmAgK1xuLy8gICAgICAgYFxcXFxkKyg/Oi1cXFxcZCspP1thLXpdP2AgK1xuLy8gICAgICAgYCg/Oig/Oix8LD9cXFxccyphbmQpXFxcXHMqXFxcXGQrKD86LVxcXFxkKyk/W2Etel0/KSpgICtcbi8vICAgICAgIGApYDtcblxuLy8gICAgIGNvbnN0IENIQVBURVIgPVxuLy8gICAgICAgYCg/PGNoYXB0ZXI+YCArXG4vLyAgICAgICBgXFxcXGJbQ2NdaCg/OmFwdGVycz98cz9cXFxcLilcXFxcLj9cXFxccypgICtcbi8vICAgICAgIGBcXFxcZCsoPzotXFxcXGQrKT9gICtcbi8vICAgICAgIGApYDtcblxuLy8gICAgIGNvbnN0IE5PVEUgPVxuLy8gICAgICAgYCg/PG5vdGU+YCArXG4vLyAgICAgICBgXFxcXGJbTm5db3Rlcz9gICtcbi8vICAgICAgIGAoPzpcXFxccytcXFxcZCsoPzpcXFxccytcXFxcZCspP2AgK1xuLy8gICAgICAgYCg/OmAgK1xuLy8gICAgICAgYCg/OlssO118LD9cXFxccyphbmQpXFxcXHMqXFxcXGQrKD86XFxcXHMrXFxcXGQrKT9gICtcbi8vICAgICAgIGAoPzpcXFxccytpblxcXFxzKyR7Ym9va31cXFxcLj9cXFxccytcXFxcZCspP2AgK1xuLy8gICAgICAgYCkqYCArXG4vLyAgICAgICBgKWAgK1xuLy8gICAgICAgYCg/OlxcXFxzK2luXFxcXHMrJHtib29rfVxcXFwuP1xcXFxzK1xcXFxkKyk/YCArXG4vLyAgICAgICBgKWA7XG5cbi8vICAgICBjb25zdCBCT09LID0gYCg/PGJvb2s+XFxcXGIoPzoke2Jvb2t9KVxcXFxiKSg/IVxcXFwuP1xcXFxzKlxcXFxkKylgO1xuXG4vLyAgICAgcmV0dXJuIGAke1JFRn18JHtWRVJTRX18JHtDSEFQVEVSfXwke05PVEV9fCR7Qk9PS31gO1xuLy8gICB9O1xuXG4vLyAgIGNvbnN0IFBBVFRFUk5fQk9EWSA9IGJ1aWxkUGF0dGVybkJvZHkoKTtcbi8vICAgY29uc3QgUEFUVEVSTl9HID0gbmV3IFJlZ0V4cChQQVRURVJOX0JPRFksIFwiZ1wiKTtcbi8vICAgY29uc3QgUEFUVEVSTl9IRUFEID0gbmV3IFJlZ0V4cChcIl5cIiArIFBBVFRFUk5fQk9EWSk7XG5cbi8vICAgcmV0dXJuIHsgYWJiciwgYWxsVG9rZW5zLCBCT09LX0FMVCwgZ2V0Qm9va0FiYnIsIFBBVFRFUk5fRywgUEFUVEVSTl9IRUFEIH07XG4vLyB9XG5cbi8vIC8qKiAtLS0tLS0tLS0tLS0tLS0tIFV0aWxpdHk6IG5vcm1hbGl6ZSBib29rIHRva2VuIHRvIHJlbW92ZSB0cmFpbGluZyBwZXJpb2QgLS0tLS0tLS0tLS0tLS0tICovXG4vLyBmdW5jdGlvbiBub3JtYWxpemVCb29rVG9rZW4ocmF3OiBzdHJpbmcsIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4pOiBzdHJpbmcge1xuLy8gICAvLyBUcmltIGFuZCBkcm9wIGEgc2luZ2xlIHRyYWlsaW5nIGRvdCAoZS5nLiwgXCJSb20uXCIgLT4gXCJSb21cIilcbi8vICAgY29uc3QgY2xlYW5lZCA9IHJhdy50cmltKCkucmVwbGFjZSgvXFwuJC8sIFwiXCIpO1xuLy8gICByZXR1cm4gY3R4LmdldEJvb2tBYmJyKGNsZWFuZWQpO1xuLy8gfVxuXG4vLyAvKiogLS0tLS0tLS0tLS0tLS0gUHJvdGVjdGVkIHJhbmdlcyAoZG9uXHUyMDE5dCB0b3VjaCB3aGlsZSBsaW5raW5nKSAtLS0tLS0tLS0tLS0tLSAqL1xuLy8gdHlwZSBSYW5nZSA9IFtzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcl07XG5cbi8vIGZ1bmN0aW9uIGFkZFJhbmdlKHJhbmdlczogUmFuZ2VbXSwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbi8vICAgaWYgKHN0YXJ0ID49IDAgJiYgZW5kID4gc3RhcnQpIHJhbmdlcy5wdXNoKFtzdGFydCwgZW5kXSk7XG4vLyB9XG5cbi8vIGZ1bmN0aW9uIGZpbmRQcm90ZWN0ZWRSYW5nZXModGV4dDogc3RyaW5nKTogUmFuZ2VbXSB7XG4vLyAgIGNvbnN0IHJhbmdlczogUmFuZ2VbXSA9IFtdO1xuXG4vLyAgIC8vIDEpIENvZGUgZmVuY2VzIGBgYC4uLmBgYCBhbmQgfn5+Li4ufn5+XG4vLyAgIGNvbnN0IGZlbmNlUmUgPSAvKGBgYHx+fn4pW15cXG5dKlxcbltcXHNcXFNdKj9cXDEvZztcbi8vICAgZm9yIChsZXQgbTsgKG0gPSBmZW5jZVJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuLy8gICAvLyAyKSBNYXRoIGJsb2NrcyAkJC4uLiQkXG4vLyAgIGNvbnN0IG1hdGhCbG9ja1JlID0gL1xcJFxcJFtcXHNcXFNdKj9cXCRcXCQvZztcbi8vICAgZm9yIChsZXQgbTsgKG0gPSBtYXRoQmxvY2tSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbi8vICAgLy8gMykgSW5saW5lIGNvZGUgYC4uLmBcbi8vICAgY29uc3QgaW5saW5lQ29kZVJlID0gL2BbXmBcXG5dKmAvZztcbi8vICAgZm9yIChsZXQgbTsgKG0gPSBpbmxpbmVDb2RlUmUuZXhlYyh0ZXh0KSk7ICkgYWRkUmFuZ2UocmFuZ2VzLCBtLmluZGV4LCBtLmluZGV4ICsgbVswXS5sZW5ndGgpO1xuXG4vLyAgIC8vIDQpIElubGluZSBtYXRoICQuLi4kIChhdm9pZCAkJClcbi8vICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0Lmxlbmd0aDsgKSB7XG4vLyAgICAgaWYgKHRleHRbaV0gPT09IFwiJFwiICYmIHRleHRbaSArIDFdICE9PSBcIiRcIikge1xuLy8gICAgICAgY29uc3Qgc3RhcnQgPSBpO1xuLy8gICAgICAgaSsrO1xuLy8gICAgICAgd2hpbGUgKGkgPCB0ZXh0Lmxlbmd0aCAmJiB0ZXh0W2ldICE9PSBcIiRcIikgaSsrO1xuLy8gICAgICAgaWYgKGkgPCB0ZXh0Lmxlbmd0aCAmJiB0ZXh0W2ldID09PSBcIiRcIikge1xuLy8gICAgICAgICBhZGRSYW5nZShyYW5nZXMsIHN0YXJ0LCBpICsgMSk7XG4vLyAgICAgICAgIGkrKztcbi8vICAgICAgICAgY29udGludWU7XG4vLyAgICAgICB9XG4vLyAgICAgfVxuLy8gICAgIGkrKztcbi8vICAgfVxuXG4vLyAgIC8vIDUpIE1hcmtkb3duIGxpbmtzIFt0ZXh0XSh1cmwpXG4vLyAgIGNvbnN0IG1kTGlua1JlID0gL1xcW1teXFxdXSs/XFxdXFwoW14pXStcXCkvZztcbi8vICAgZm9yIChsZXQgbTsgKG0gPSBtZExpbmtSZS5leGVjKHRleHQpKTsgKSBhZGRSYW5nZShyYW5nZXMsIG0uaW5kZXgsIG0uaW5kZXggKyBtWzBdLmxlbmd0aCk7XG5cbi8vICAgLy8gNikgSW5saW5lIHByb3BlcnRpZXMgbGluZXM6ICBrZXk6OiB2YWx1ZVxuLy8gICBjb25zdCBpbmxpbmVQcm9wUmUgPSAvXlteXFxuOl17MSwyMDB9OjouKiQvZ207XG4vLyAgIGZvciAobGV0IG07IChtID0gaW5saW5lUHJvcFJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuLy8gICAvLyA3KSBPYnNpZGlhbiBsaW5rcyBbWy4uLl1dXG4vLyAgIGNvbnN0IG9ic2lkaWFuUmUgPSAvXFxbXFxbW15cXF1dKj9cXF1cXF0vZztcbi8vICAgZm9yIChsZXQgbTsgKG0gPSBvYnNpZGlhblJlLmV4ZWModGV4dCkpOyApIGFkZFJhbmdlKHJhbmdlcywgbS5pbmRleCwgbS5pbmRleCArIG1bMF0ubGVuZ3RoKTtcblxuLy8gICAvLyBNZXJnZSBvdmVybGFwcyAmIHNvcnRcbi8vICAgcmFuZ2VzLnNvcnQoKGEsIGIpID0+IGFbMF0gLSBiWzBdKTtcbi8vICAgY29uc3QgbWVyZ2VkOiBSYW5nZVtdID0gW107XG4vLyAgIGZvciAoY29uc3QgciBvZiByYW5nZXMpIHtcbi8vICAgICBpZiAoIW1lcmdlZC5sZW5ndGggfHwgclswXSA+IG1lcmdlZFttZXJnZWQubGVuZ3RoIC0gMV1bMV0pIG1lcmdlZC5wdXNoKHIpO1xuLy8gICAgIGVsc2UgbWVyZ2VkW21lcmdlZC5sZW5ndGggLSAxXVsxXSA9IE1hdGgubWF4KG1lcmdlZFttZXJnZWQubGVuZ3RoIC0gMV1bMV0sIHJbMV0pO1xuLy8gICB9XG4vLyAgIHJldHVybiBtZXJnZWQ7XG4vLyB9XG5cbi8vIGZ1bmN0aW9uIGluUHJvdGVjdGVkKHBvczogbnVtYmVyLCByYW5nZXM6IFJhbmdlW10pOiBib29sZWFuIHtcbi8vICAgbGV0IGxvID0gMCwgaGkgPSByYW5nZXMubGVuZ3RoIC0gMTtcbi8vICAgd2hpbGUgKGxvIDw9IGhpKSB7XG4vLyAgICAgY29uc3QgbWlkID0gKGxvICsgaGkpID4+IDE7XG4vLyAgICAgY29uc3QgW3MsIGVdID0gcmFuZ2VzW21pZF07XG4vLyAgICAgaWYgKHBvcyA8IHMpIGhpID0gbWlkIC0gMTtcbi8vICAgICBlbHNlIGlmIChwb3MgPj0gZSkgbG8gPSBtaWQgKyAxO1xuLy8gICAgIGVsc2UgcmV0dXJuIHRydWU7XG4vLyAgIH1cbi8vICAgcmV0dXJuIGZhbHNlO1xuLy8gfVxuXG4vLyBmdW5jdGlvbiBpc1dpdGhpbk9ic2lkaWFuTGluayh0ZXh0OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTogYm9vbGVhbiB7XG4vLyAgIGNvbnN0IGJlZm9yZSA9IHRleHQuc2xpY2UoMCwgc3RhcnQpO1xuLy8gICBjb25zdCBhZnRlciA9IHRleHQuc2xpY2UoZW5kKTtcbi8vICAgY29uc3Qgb3BlbklkeCA9IGJlZm9yZS5sYXN0SW5kZXhPZihcIltbXCIpO1xuLy8gICBjb25zdCBjbG9zZUlkeCA9IGJlZm9yZS5sYXN0SW5kZXhPZihcIl1dXCIpO1xuLy8gICBpZiAob3BlbklkeCA+IGNsb3NlSWR4KSB7XG4vLyAgICAgY29uc3QgbmV4dENsb3NlID0gYWZ0ZXIuaW5kZXhPZihcIl1dXCIpO1xuLy8gICAgIGlmIChuZXh0Q2xvc2UgIT09IC0xKSByZXR1cm4gdHJ1ZTtcbi8vICAgfVxuLy8gICByZXR1cm4gZmFsc2U7XG4vLyB9XG5cbi8vIC8qKiBQYXJlbnRoZXRpY2FsIG5vaXNlOiBza2lwIGlmIGluc2lkZSBcIigyMDE5KVwiLWxpa2UgcGFyZW50aGVzZXMgKi9cbi8vIGZ1bmN0aW9uIGlzSW5zaWRlTnVtZXJpY1BhcmVucyh0ZXh0OiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTogYm9vbGVhbiB7XG4vLyAgIGNvbnN0IG9wZW4gPSB0ZXh0Lmxhc3RJbmRleE9mKFwiKFwiLCBzdGFydCk7XG4vLyAgIGlmIChvcGVuID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuLy8gICBjb25zdCBjbG9zZSA9IHRleHQuaW5kZXhPZihcIilcIiwgZW5kKTtcbi8vICAgaWYgKGNsb3NlID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuLy8gICBjb25zdCBpbm5lciA9IHRleHQuc2xpY2Uob3BlbiArIDEsIGNsb3NlKS50cmltKCk7XG4vLyAgIGlmICgvXlxcZHsxLDR9KD86W1xcL1xcLlxcLTpdXFxkezEsMn0oPzpbXFwvXFwuXFwtOl1cXGR7MSw0fSk/KT8kLy50ZXN0KGlubmVyKSkgcmV0dXJuIHRydWU7XG4vLyAgIGlmICgvXnB7MSwyfVxcLlxccypcXGQrKFxccyotXFxzKlxcZCspPyQvaS50ZXN0KGlubmVyKSkgcmV0dXJuIHRydWU7XG4vLyAgIHJldHVybiBmYWxzZTtcbi8vIH1cblxuLy8gLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0gTWFya2Rvd24vT2JzaWRpYW4gbGluayBjbGVhbnVwIChQeXRob24gcGFyaXR5KSAtLS0tLS0tLS0tLS0tLS0tLS0tICovXG4vLyBmdW5jdGlvbiByZW1vdmVNYXRjaGluZ01hcmtkb3duTGlua3ModGV4dDogc3RyaW5nLCBQQVRURVJOX0hFQUQ6IFJlZ0V4cCk6IHN0cmluZyB7XG4vLyAgIGNvbnN0IG1kTGluayA9IC8oXFwqXFwqfF9ffFxcKik/XFxbKFteXFxdXSspXFxdXFwoW14pXStcXCkoXFwqXFwqfF9ffFxcKik/L2c7XG4vLyAgIHJldHVybiB0ZXh0LnJlcGxhY2UobWRMaW5rLCAoX20sIHByZSwgZGlzcCwgc3VmKSA9PiB7XG4vLyAgICAgY29uc3QgbGlua1RleHQgPSBTdHJpbmcoZGlzcCk7XG4vLyAgICAgaWYgKFBBVFRFUk5fSEVBRC50ZXN0KGxpbmtUZXh0KSkgcmV0dXJuIGxpbmtUZXh0O1xuLy8gICAgIGNvbnN0IHNpbXBsZU51bSA9IC9eXFxkKyg/Ols6LV1cXGQrKT8oPzotXFxkKyk/JC8udGVzdChsaW5rVGV4dCk7XG4vLyAgICAgaWYgKHNpbXBsZU51bSkgcmV0dXJuIGxpbmtUZXh0O1xuLy8gICAgIHJldHVybiBgJHtwcmUgPz8gXCJcIn1bJHtsaW5rVGV4dH1dJHtzdWYgPz8gXCJcIn1gO1xuLy8gICB9KTtcbi8vIH1cblxuLy8gZnVuY3Rpb24gcmVtb3ZlTWF0Y2hpbmdPYnNpZGlhbkxpbmtzKHRleHQ6IHN0cmluZywgUEFUVEVSTl9IRUFEOiBSZWdFeHApOiBzdHJpbmcge1xuLy8gICBjb25zdCBvYnMgPSAvXFxbXFxbKFteXFxdfF0rKVxcfChbXlxcXV0rKVxcXVxcXS9nO1xuLy8gICByZXR1cm4gdGV4dC5yZXBsYWNlKG9icywgKF9tLCBfdCwgZGlzcCkgPT4ge1xuLy8gICAgIGNvbnN0IGRpc3BsYXkgPSBTdHJpbmcoZGlzcCk7XG4vLyAgICAgaWYgKFBBVFRFUk5fSEVBRC50ZXN0KGRpc3BsYXkpKSByZXR1cm4gZGlzcGxheTtcbi8vICAgICBjb25zdCBzaW1wbGVOdW0gPSAvXlxcZCsoPzpbOi1dXFxkKyk/KD86LVxcZCspPyQvLnRlc3QoZGlzcGxheSk7XG4vLyAgICAgaWYgKHNpbXBsZU51bSkgcmV0dXJuIGRpc3BsYXk7XG4vLyAgICAgcmV0dXJuIF9tO1xuLy8gICB9KTtcbi8vIH1cblxuLy8gZnVuY3Rpb24gcmVwbGFjZU9sZE9ic2lkaWFuTGlua3ModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbi8vICAgY29uc3Qgb2xkTGluayA9IC9cXFtcXFsoWzAtOV0/XFxzW0EtWmEteiBdKylcXHMoXFxkKykjXFxeKFxcZCspKD86XFx8KFteXFxdXSspKT9cXF1cXF0vZztcbi8vICAgcmV0dXJuIHRleHQucmVwbGFjZShvbGRMaW5rLCAoX20sIGJvb2tTaG9ydCwgY2gsIHZlcnNlLCBkaXNwKSA9PiB7XG4vLyAgICAgY29uc3QgYiA9IFN0cmluZyhib29rU2hvcnQpLnRyaW0oKTtcbi8vICAgICByZXR1cm4gZGlzcFxuLy8gICAgICAgPyBgW1ske2J9I14ke2NofS0ke3ZlcnNlfXwke2Rpc3B9XV1gXG4vLyAgICAgICA6IGBbWyR7Yn0jXiR7Y2h9LSR7dmVyc2V9XV1gO1xuLy8gICB9KTtcbi8vIH1cblxuLy8gZnVuY3Rpb24gZmluZExhc3RCb29rQmVmb3JlKHRleHQ6IHN0cmluZywgcG9zOiBudW1iZXIsIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4pOiBzdHJpbmcgfCBudWxsIHtcbi8vICAgLy8gTG9vayBiYWNrIH4yMDAgY2hhcnMgZm9yIGEgYm9vayB0b2tlbiBlbmRpbmcgcmlnaHQgYmVmb3JlICdwb3MnXG4vLyAgIGNvbnN0IHN0YXJ0ID0gTWF0aC5tYXgoMCwgcG9zIC0gMjAwKTtcbi8vICAgY29uc3QgbGVmdCA9IHRleHQuc2xpY2Uoc3RhcnQsIHBvcyk7XG5cbi8vICAgLy8gTWF0Y2ggQUxMIGJvb2sgdG9rZW5zIGluIHRoZSB3aW5kb3c7IHRha2UgdGhlIGxhc3Qgb25lLlxuLy8gICBjb25zdCByZSA9IG5ldyBSZWdFeHAoYCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccyokfCg/OiR7Y3R4LkJPT0tfQUxUfSlcXFxcLj9cXFxccytgLCBcImdcIik7XG4vLyAgIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuLy8gICBsZXQgbGFzdDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbi8vICAgd2hpbGUgKChtID0gcmUuZXhlYyhsZWZ0KSkgIT09IG51bGwpIHtcbi8vICAgICBsYXN0ID0gbVswXS50cmltKCk7XG4vLyAgIH1cbi8vICAgaWYgKCFsYXN0KSByZXR1cm4gbnVsbDtcblxuLy8gICAvLyBzdHJpcCB0cmFpbGluZyBwdW5jdHVhdGlvbi9kb3QgYW5kIG5vcm1hbGl6ZVxuLy8gICByZXR1cm4gbm9ybWFsaXplQm9va1Rva2VuKGxhc3QucmVwbGFjZSgvXFxzKyQvLCBcIlwiKSwgY3R4KTtcbi8vIH1cblxuLy8gLyoqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBDb3JlIGxpbmtlciAoUHl0aG9uIDE6MSArIHByb3RlY3Rpb25zKSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cbi8vIGZ1bmN0aW9uIHJlcGxhY2VWZXJzZVJlZmVyZW5jZXNPZk1haW5UZXh0KFxuLy8gICB0ZXh0OiBzdHJpbmcsXG4vLyAgIGN0eDogUmV0dXJuVHlwZTx0eXBlb2YgYnVpbGRCb29rQ29udGV4dD4sXG4vLyAgIG9wdHM6IHsgcmVtb3ZlT2JzaWRpYW5MaW5rczogYm9vbGVhbjsgcmV3cml0ZU9sZExpbmtzOiBib29sZWFuLCBzdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlOiBib29sZWFuIH1cbi8vICk6IHN0cmluZyB7XG4vLyAgIC8vIE9yZGVyIG1hdGNoZXMgUHl0aG9uOiBzdHJpcCBNRCBsaW5rcyBcdTIxOTIgKG9wdGlvbmFsKSBzdHJpcCBbWy4uLnwuLi5dXSBcdTIxOTIgcmV3cml0ZSBvbGQgbGlua3Ncbi8vICAgaWYgKG9wdHMuc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSkgdGV4dCA9IHJlbW92ZU1hdGNoaW5nTWFya2Rvd25MaW5rcyh0ZXh0LCBjdHguUEFUVEVSTl9IRUFEKTtcbi8vICAgaWYgKG9wdHMucmVtb3ZlT2JzaWRpYW5MaW5rcykgdGV4dCA9IHJlbW92ZU1hdGNoaW5nT2JzaWRpYW5MaW5rcyh0ZXh0LCBjdHguUEFUVEVSTl9IRUFEKTtcbi8vICAgaWYgKG9wdHMucmV3cml0ZU9sZExpbmtzKSB0ZXh0ID0gcmVwbGFjZU9sZE9ic2lkaWFuTGlua3ModGV4dCk7XG5cbi8vICAgY29uc3QgcHJvdGVjdGVkUmFuZ2VzID0gZmluZFByb3RlY3RlZFJhbmdlcyh0ZXh0KTtcblxuLy8gICBsZXQgY3VycmVudF9ib29rOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbi8vICAgbGV0IGN1cnJlbnRfY2hhcHRlcjogbnVtYmVyIHwgc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4vLyAgIGxldCBjdXJyZW50X3ZlcnNlOiBudW1iZXIgfCBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuLy8gICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4vLyAgIGxldCBsYXN0UG9zID0gMDtcblxuLy8gICBjdHguUEFUVEVSTl9HLmxhc3RJbmRleCA9IDA7XG4vLyAgIGZvciAobGV0IG06IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGwgPSBjdHguUEFUVEVSTl9HLmV4ZWModGV4dCk7IG07IG0gPSBjdHguUEFUVEVSTl9HLmV4ZWModGV4dCkpIHtcbi8vICAgICBjb25zdCBzdGFydCA9IG0uaW5kZXg7XG4vLyAgICAgY29uc3QgZW5kID0gc3RhcnQgKyBtWzBdLmxlbmd0aDtcblxuLy8gICAgIGlmIChpblByb3RlY3RlZChzdGFydCwgcHJvdGVjdGVkUmFuZ2VzKSB8fCBpblByb3RlY3RlZChlbmQgLSAxLCBwcm90ZWN0ZWRSYW5nZXMpIHx8XG4vLyAgICAgICAgIGlzV2l0aGluT2JzaWRpYW5MaW5rKHRleHQsIHN0YXJ0LCBlbmQpIHx8IGlzSW5zaWRlTnVtZXJpY1BhcmVucyh0ZXh0LCBzdGFydCwgZW5kKSkge1xuLy8gICAgICAgb3V0LnB1c2godGV4dC5zbGljZShsYXN0UG9zLCBzdGFydCksIG1bMF0pO1xuLy8gICAgICAgbGFzdFBvcyA9IGVuZDtcbi8vICAgICAgIGNvbnRpbnVlO1xuLy8gICAgIH1cblxuLy8gICAgIG91dC5wdXNoKHRleHQuc2xpY2UobGFzdFBvcywgc3RhcnQpKTtcbi8vICAgICBsYXN0UG9zID0gZW5kO1xuXG4vLyAgICAgY29uc3QgZyA9IG0uZ3JvdXBzID8/IHt9O1xuXG4vLyAgICAgLy8gLS0tLSBib29rIG9ubHlcbi8vICAgICBpZiAoZy5ib29rKSB7XG4vLyAgICAgICBjdXJyZW50X2Jvb2sgPSBub3JtYWxpemVCb29rVG9rZW4oZy5ib29rLCBjdHgpOyAvLyA8LS0gc3RyaXBzIHRyYWlsaW5nIGRvdFxuLy8gICAgICAgY3VycmVudF9jaGFwdGVyID0gbnVsbDtcbi8vICAgICAgIGN1cnJlbnRfdmVyc2UgPSBudWxsO1xuLy8gICAgICAgb3V0LnB1c2gobVswXSk7XG4vLyAgICAgICBjb250aW51ZTtcbi8vICAgICB9XG5cbi8vICAgICAvLyAtLS0tIGNoYXB0ZXIgKGNoLiwgY2hhcHRlciwgY2hhcHRlcnMpXG4vLyAgICAgaWYgKGcuY2hhcHRlcikge1xuLy8gICAgICAgY29uc3QgY2htID0gZy5jaGFwdGVyLm1hdGNoKC8oXFxkKykvKTtcbi8vICAgICAgIGlmIChjaG0gJiYgY3VycmVudF9ib29rKSB7XG4vLyAgICAgICAgIGNvbnN0IGNoID0gY2htWzFdO1xuLy8gICAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBjaDtcbi8vICAgICAgICAgY3VycmVudF92ZXJzZSA9IG51bGw7XG4vLyAgICAgICAgIG91dC5wdXNoKGBbWyR7Y3VycmVudF9ib29rfSNeJHtjaH18JHttWzBdfV1dYCk7XG4vLyAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICBvdXQucHVzaChtWzBdKTtcbi8vICAgICAgIH1cbi8vICAgICAgIGNvbnRpbnVlO1xuLy8gICAgIH1cblxuLy8gICAgIC8vIC0tLS0gdmVyc2UgKHYuLCB2di4sIHZlcnNlcylcbi8vICAgICBpZiAoZy52ZXJzZSkge1xuLy8gICAgICAgaWYgKCFjdXJyZW50X2Jvb2spIHtcbi8vICAgICAgICAgY29uc3QgaW5mZXJyZWQgPSBmaW5kTGFzdEJvb2tCZWZvcmUodGV4dCwgc3RhcnQsIGN0eCk7XG4vLyAgICAgICAgIGlmIChpbmZlcnJlZCkge1xuLy8gICAgICAgICAgIGN1cnJlbnRfYm9vayA9IGluZmVycmVkO1xuLy8gICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgIG91dC5wdXNoKG1bMF0pO1xuLy8gICAgICAgICAgIGNvbnRpbnVlO1xuLy8gICAgICAgICB9XG4vLyAgICAgICB9XG4vLyAgICAgICBjb25zdCB2ZXJzZVRleHQgPSBtWzBdO1xuLy8gICAgICAgY29uc3QgcGFydHMgPSB2ZXJzZVRleHQuc3BsaXQoLyhcXHMrKS8pO1xuLy8gICAgICAgY29uc3QgY2ggPSBjdXJyZW50X2NoYXB0ZXIgPyBTdHJpbmcoY3VycmVudF9jaGFwdGVyKSA6IFwiMVwiO1xuLy8gICAgICAgZm9yIChjb25zdCBwYXJ0IG9mIHBhcnRzKSB7XG4vLyAgICAgICAgIGNvbnN0IHZtID0gcGFydC5tYXRjaCgvKFxcZCspLyk7XG4vLyAgICAgICAgIGlmICh2bSAmJiBwYXJ0LnRyaW0oKSkge1xuLy8gICAgICAgICAgIG91dC5wdXNoKGBbWyR7Y3VycmVudF9ib29rfSNeJHtjaH0tJHt2bVsxXX18JHtwYXJ0LnRyaW0oKX1dXWApO1xuLy8gICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgIG91dC5wdXNoKHBhcnQpO1xuLy8gICAgICAgICB9XG4vLyAgICAgICB9XG4vLyAgICAgICBjb250aW51ZTtcbi8vICAgICB9XG5cbi8vICAgICAvLyAtLS0tIG5vdGUocylcbi8vICAgICBpZiAoZy5ub3RlKSB7XG4vLyAgICAgICBjb25zdCBub3RlVGV4dCA9IGcubm90ZSBhcyBzdHJpbmc7XG4vLyAgICAgICBjb25zdCBwYXJ0cyA9IG5vdGVUZXh0LnNwbGl0KC9cXHMrLyk7XG4vLyAgICAgICBsZXQgYm9va1N1YnN0cmluZyA9IGZhbHNlO1xuLy8gICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgICBjb25zdCBwYXJ0ID0gcGFydHNbaV07XG4vLyAgICAgICAgIGNvbnN0IHBtID0gcGFydC5tYXRjaCgvXihcXGQrKS8pO1xuLy8gICAgICAgICBpZiAocG0gJiYgIWJvb2tTdWJzdHJpbmcpIHtcbi8vICAgICAgICAgICBjb25zdCB2ZXJzZSA9IHBtWzFdO1xuLy8gICAgICAgICAgIGlmICgoaSArIDEgPCBwYXJ0cy5sZW5ndGggJiYgIS9eXFxkKy8udGVzdChwYXJ0c1tpICsgMV0pKSB8fCBpICsgMSA+PSBwYXJ0cy5sZW5ndGgpIHtcbi8vICAgICAgICAgICAgIG91dC5wdXNoKFwiIFwiICsgcGFydCk7XG4vLyAgICAgICAgICAgICBjb250aW51ZTtcbi8vICAgICAgICAgICB9XG4vLyAgICAgICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDwgcGFydHMubGVuZ3RoOyBqKyspIHtcbi8vICAgICAgICAgICAgIGlmIChwYXJ0c1tqXSA9PT0gXCJpblwiICYmIGogKyAxIDwgcGFydHMubGVuZ3RoKSB7XG4vLyAgICAgICAgICAgICAgIGlmICgvXlxcZCskLy50ZXN0KHBhcnRzW2ogKyAxXSkgJiYgaiArIDIgPCBwYXJ0cy5sZW5ndGgpIHtcbi8vICAgICAgICAgICAgICAgICBjb25zdCBib29rID0gcGFydHNbaiArIDFdICsgXCIgXCIgKyBwYXJ0c1tqICsgMl07XG4vLyAgICAgICAgICAgICAgICAgY3VycmVudF9jaGFwdGVyID0gcGFydHNbaiArIDNdO1xuLy8gICAgICAgICAgICAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihib29rLCBjdHgpOyAvLyA8LS0gbm9ybWFsaXplXG4vLyAgICAgICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICAgICAgY29uc3QgYm9vayA9IHBhcnRzW2ogKyAxXTtcbi8vICAgICAgICAgICAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBwYXJ0c1tqICsgMl07XG4vLyAgICAgICAgICAgICAgICAgY3VycmVudF9ib29rID0gbm9ybWFsaXplQm9va1Rva2VuKGJvb2ssIGN0eCk7IC8vIDwtLSBub3JtYWxpemVcbi8vICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgfVxuLy8gICAgICAgICAgIH1cbi8vICAgICAgICAgICBpZiAoY3VycmVudF9ib29rICYmIGN1cnJlbnRfY2hhcHRlcikge1xuLy8gICAgICAgICAgICAgb3V0LnB1c2goYCBbWyR7Y3VycmVudF9ib29rfSAke2N1cnJlbnRfY2hhcHRlcn0jXiR7dmVyc2V9fCR7cGFydH1dXWApO1xuLy8gICAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICBvdXQucHVzaChcIiBcIiArIHBhcnQpO1xuLy8gICAgICAgICAgIH1cbi8vICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICBvdXQucHVzaCgoaSA+IDAgPyBcIiBcIiA6IFwiXCIpICsgcGFydCk7XG4vLyAgICAgICAgIH1cbi8vICAgICAgIH1cbi8vICAgICAgIGNvbnRpbnVlO1xuLy8gICAgIH1cblxuLy8gICAgIC8vIC0tLS0gZnVsbCByZWZlcmVuY2Vcbi8vICAgICBpZiAoZy5yZWYpIHtcbi8vICAgICAgIGNvbnN0IG1tID0gKGcucmVmIGFzIHN0cmluZykubWF0Y2goLyhcXHMqW1xcLiw7XT8pKC4rKS8pO1xuLy8gICAgICAgY29uc3QgbGVhZGluZyA9IG1tID8gbW1bMV0gOiBcIlwiO1xuLy8gICAgICAgbGV0IHJlZlRleHQgPSBtbSA/IG1tWzJdIDogKGcucmVmIGFzIHN0cmluZyk7XG5cbi8vICAgICAgIGNvbnN0IGJvb2tTdGFydCA9IHJlZlRleHQubWF0Y2gobmV3IFJlZ0V4cChgXigoPzoke2N0eC5CT09LX0FMVH0pXFxcXC4/XFxcXHMrKWApKTtcbi8vICAgICAgIGxldCBwcmVmaXg6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuLy8gICAgICAgaWYgKGJvb2tTdGFydCkge1xuLy8gICAgICAgICBjb25zdCBib29rUGFydCA9IGJvb2tTdGFydFswXTtcbi8vICAgICAgICAgcHJlZml4ID0gYm9va1BhcnQ7IC8vIGZvciBkaXNwbGF5IHRleHQgKGNhbiBrZWVwIGl0cyBkb3QpXG4vLyAgICAgICAgIGN1cnJlbnRfYm9vayA9IG5vcm1hbGl6ZUJvb2tUb2tlbihib29rUGFydC5yZXBsYWNlKC9cXHMrJC8sIFwiXCIpLCBjdHgpOyAvLyA8LS0gbm9ybWFsaXplIGZvciB0YXJnZXRcbi8vICAgICAgICAgcmVmVGV4dCA9IHJlZlRleHQuc2xpY2UoYm9va1BhcnQubGVuZ3RoKTtcbi8vICAgICAgIH1cbi8vICAgICAgIGlmICghY3VycmVudF9ib29rKSB7XG4vLyAgICAgICAgIC8vIEZhbGxiYWNrOiBpbmZlciBib29rIGZyb20gbGVmdCBjb250ZXh0IChlLmcuLCBcIlx1MjAyNiBKb2huIDE6Mjk7IDEyOjI0OyBcdTIwMjZcIilcbi8vICAgICAgICAgY29uc3QgaW5mZXJyZWQgPSBmaW5kTGFzdEJvb2tCZWZvcmUodGV4dCwgc3RhcnQsIGN0eCk7XG4vLyAgICAgICAgIGlmIChpbmZlcnJlZCkge1xuLy8gICAgICAgICAgIGN1cnJlbnRfYm9vayA9IGluZmVycmVkO1xuLy8gICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgIG91dC5wdXNoKG1bMF0pO1xuLy8gICAgICAgICAgIGNvbnRpbnVlO1xuLy8gICAgICAgICB9XG4vLyAgICAgICB9XG5cbi8vICAgICAgIGNvbnN0IHBhcnRzID0gcmVmVGV4dC5yZXBsYWNlKC9cXC4vZywgXCJcIikudHJpbSgpLnNwbGl0KC8oO3wsKS8pO1xuLy8gICAgICAgY29uc3QgcmVzdWx0OiBzdHJpbmdbXSA9IFtdO1xuLy8gICAgICAgbGV0IHZlcnNlU3RyaW5nID0gZmFsc2U7XG4vLyAgICAgICBjdXJyZW50X2NoYXB0ZXIgPSBudWxsO1xuLy8gICAgICAgbGV0IGxvY2FsX2N1cnJlbnRfdmVyc2U6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4vLyAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgICAgIGNvbnN0IHBhcnQgPSBwYXJ0c1tpXTtcbi8vICAgICAgICAgaWYgKHBhcnQgPT09IFwiLFwiIHx8IHBhcnQgPT09IFwiO1wiKSB7XG4vLyAgICAgICAgICAgcmVzdWx0LnB1c2gocGFydCArIFwiIFwiKTtcbi8vICAgICAgICAgICB2ZXJzZVN0cmluZyA9IChwYXJ0ID09PSBcIixcIik7XG4vLyAgICAgICAgICAgY29udGludWU7XG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgbGV0IHAgPSBwYXJ0LnRyaW0oKTtcbi8vICAgICAgICAgaWYgKCFwKSBjb250aW51ZTtcblxuLy8gICAgICAgICBsZXQgY2hhcDogc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCA9IGN1cnJlbnRfY2hhcHRlcjtcbi8vICAgICAgICAgbGV0IHY6IHN0cmluZyB8IG51bWJlciB8IG51bGwgPSBudWxsO1xuLy8gICAgICAgICBsZXQgdkVuZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbi8vICAgICAgICAgaWYgKHAuaW5jbHVkZXMoXCI6XCIpKSB7XG4vLyAgICAgICAgICAgY29uc3QgW2NTdHIsIHZTdHJdID0gcC5zcGxpdChcIjpcIik7XG4vLyAgICAgICAgICAgY2hhcCA9IGNTdHI7XG4vLyAgICAgICAgICAgdiA9IHZTdHI7XG4vLyAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgaWYgKHZlcnNlU3RyaW5nKSB2ID0gcDtcbi8vICAgICAgICAgICBlbHNlIHsgY2hhcCA9IHA7IHYgPSBudWxsOyB9XG4vLyAgICAgICAgIH1cblxuLy8gICAgICAgICBpZiAodHlwZW9mIGNoYXAgIT09IFwibnVtYmVyXCIpIHtcbi8vICAgICAgICAgICBjb25zdCBjaHMgPSBTdHJpbmcoY2hhcCA/PyBcIlwiKS5zcGxpdChcIi1cIik7XG4vLyAgICAgICAgICAgY2hhcCA9IHBhcnNlSW50KGNoc1swXS5yZXBsYWNlKC9bYS16XSQvaSwgXCJcIiksIDEwKTtcbi8vICAgICAgICAgfVxuXG4vLyAgICAgICAgIGlmICh2KSB7XG4vLyAgICAgICAgICAgY29uc3QgdnMgPSBTdHJpbmcodikuc3BsaXQoXCItXCIpO1xuLy8gICAgICAgICAgIGxvY2FsX2N1cnJlbnRfdmVyc2UgPSBwYXJzZUludCh2c1swXS5yZXBsYWNlKC9bYS16XSQvaSwgXCJcIiksIDEwKTtcbi8vICAgICAgICAgICB2RW5kID0gdnMubGVuZ3RoID4gMSA/IHBhcnNlSW50KHZzWzFdLnJlcGxhY2UoL1thLXpdJC9pLCBcIlwiKSwgMTApIDogbnVsbDtcbi8vICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICBsb2NhbF9jdXJyZW50X3ZlcnNlID0gbnVsbDtcbi8vICAgICAgICAgICB2RW5kID0gbnVsbDtcbi8vICAgICAgICAgfVxuXG4vLyAgICAgICAgIGlmICh2RW5kKSB7XG4vLyAgICAgICAgICAgY29uc3QgZGlzcGxheVN0YXJ0ID0gcC5yZXBsYWNlKC9cXGQrW2Etel0/JC9pLCBcIlwiKTtcbi8vICAgICAgICAgICByZXN1bHQucHVzaChgW1ske2N1cnJlbnRfYm9va30jXiR7Y2hhcH0tJHtsb2NhbF9jdXJyZW50X3ZlcnNlfXwke3ByZWZpeCA/IHByZWZpeCA6IFwiXCJ9JHtkaXNwbGF5U3RhcnR9XV1gKTtcbi8vICAgICAgICAgICByZXN1bHQucHVzaChgW1ske2N1cnJlbnRfYm9va30jXiR7Y2hhcH0tJHt2RW5kfXwke1N0cmluZyhwKS5tYXRjaCgvKFxcZCtbYS16XT8pJC9pKT8uWzFdID8/IFwiXCJ9XV1gKTtcbi8vICAgICAgICAgICBsb2NhbF9jdXJyZW50X3ZlcnNlID0gdkVuZDtcbi8vICAgICAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgICByZXN1bHQucHVzaChgW1ske2N1cnJlbnRfYm9va30jXiR7Y2hhcH0ke2xvY2FsX2N1cnJlbnRfdmVyc2UgPyBgLSR7bG9jYWxfY3VycmVudF92ZXJzZX1gIDogXCJcIn18JHtwcmVmaXggPyBwcmVmaXggOiBcIlwifSR7cH1dXWApO1xuLy8gICAgICAgICB9XG4vLyAgICAgICAgIHByZWZpeCA9IG51bGw7XG4vLyAgICAgICAgIGN1cnJlbnRfY2hhcHRlciA9IGNoYXA7XG4vLyAgICAgICAgIGN1cnJlbnRfdmVyc2UgPSBsb2NhbF9jdXJyZW50X3ZlcnNlO1xuLy8gICAgICAgfVxuXG4vLyAgICAgICBvdXQucHVzaChsZWFkaW5nICsgcmVzdWx0LmpvaW4oXCJcIikpO1xuLy8gICAgICAgY29udGludWU7XG4vLyAgICAgfVxuXG4vLyAgICAgb3V0LnB1c2gobVswXSk7XG4vLyAgIH1cblxuLy8gICBvdXQucHVzaCh0ZXh0LnNsaWNlKGxhc3RQb3MpKTtcbi8vICAgcmV0dXJuIG91dC5qb2luKFwiXCIpO1xuLy8gfVxuXG5cbi8vIC8qKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUHVibGljIEFQSSB1c2VkIGJ5IGNvbW1hbmQgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG4vLyBleHBvcnQgYXN5bmMgZnVuY3Rpb24gbGlua1ZlcnNlc0luVGV4dCh0ZXh0OiBzdHJpbmcsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MpOiBQcm9taXNlPHN0cmluZz4ge1xuLy8gICBjb25zdCBjdHggPSBidWlsZEJvb2tDb250ZXh0KHNldHRpbmdzKTtcblxuLy8gICAvLyBTZXR0aW5ncyB0b2dnbGVzIChvcHRpb25hbDsgZGVmYXVsdCB0byBQeXRob24gYmVoYXZpb3IpXG4vLyAgIGNvbnN0IHJlbW92ZU9ic2lkaWFuRGlzcGxheUxpbmtzID1cbi8vICAgICAoc2V0dGluZ3MgYXMgYW55KT8ucmVtb3ZlT2JzaWRpYW5EaXNwbGF5TGlua3MgPz8gdHJ1ZTtcbi8vICAgY29uc3QgcmV3cml0ZU9sZE9ic2lkaWFuTGlua3MgPVxuLy8gICAgIChzZXR0aW5ncyBhcyBhbnkpPy5yZXdyaXRlT2xkT2JzaWRpYW5MaW5rcyA/PyB0cnVlO1xuLy8gICBjb25zdCBzdHJpcE1kTGlua3NXaGVuVmVyc2VMaWtlID1cbi8vICAgICAoc2V0dGluZ3MgYXMgYW55KT8uc3RyaXBNZExpbmtzV2hlblZlcnNlTGlrZSA/PyB0cnVlO1xuXG4vLyAgIHJldHVybiByZXBsYWNlVmVyc2VSZWZlcmVuY2VzT2ZNYWluVGV4dCh0ZXh0LCBjdHgsIHtcbi8vICAgICByZW1vdmVPYnNpZGlhbkxpbmtzOiByZW1vdmVPYnNpZGlhbkRpc3BsYXlMaW5rcyxcbi8vICAgICByZXdyaXRlT2xkTGlua3M6IHJld3JpdGVPbGRPYnNpZGlhbkxpbmtzLFxuLy8gICAgIHN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2U6IHN0cmlwTWRMaW5rc1doZW5WZXJzZUxpa2Vcbi8vICAgfSk7XG4vLyB9XG5cbi8vIGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kVmVyc2VMaW5rcyhhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncywgcGFyYW1zPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPikge1xuLy8gICBjb25zdCBzY29wZSA9IHBhcmFtcz8uc2NvcGUgPz8gXCJjdXJyZW50XCI7XG5cbi8vICAgaWYgKHNjb3BlID09PSBcImZvbGRlclwiKSB7XG4vLyAgICAgY29uc3QgYWN0aXZlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4vLyAgICAgY29uc3QgZm9sZGVyID0gYWN0aXZlPy5wYXJlbnQ7XG4vLyAgICAgaWYgKCFhY3RpdmUgfHwgIWZvbGRlcikgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgaW5zaWRlIHRoZSB0YXJnZXQgZm9sZGVyLlwiKTsgcmV0dXJuOyB9XG5cbi8vICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZvbGRlci5jaGlsZHJlbikge1xuLy8gICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUgJiYgY2hpbGQuZXh0ZW5zaW9uID09PSBcIm1kXCIpIHtcbi8vICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGNoaWxkKTtcbi8vICAgICAgICAgY29uc3QgeyB5YW1sLCBib2R5IH0gPSBzcGxpdEZyb250bWF0dGVyKGNvbnRlbnQpO1xuLy8gICAgICAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KGJvZHksIHNldHRpbmdzKTtcbi8vICAgICAgICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShjaGlsZCwgKHlhbWwgPz8gXCJcIikgKyBsaW5rZWQpO1xuLy8gICAgICAgfVxuLy8gICAgIH1cbi8vICAgICBuZXcgTm90aWNlKFwiTGlua2VkIHZlcnNlcyBpbiBmb2xkZXIuXCIpO1xuLy8gICAgIHJldHVybjtcbi8vICAgfVxuXG4vLyAgIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbi8vICAgaWYgKCFmaWxlKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgZmlsZSBmaXJzdC5cIik7IHJldHVybjsgfVxuXG4vLyAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcbi8vICAgY29uc3QgeyB5YW1sLCBib2R5IH0gPSBzcGxpdEZyb250bWF0dGVyKGNvbnRlbnQpO1xuLy8gICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KGJvZHksIHNldHRpbmdzKTtcbi8vICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCAoeWFtbCA/PyBcIlwiKSArIGxpbmtlZCk7XG4vLyAgIG5ldyBOb3RpY2UoXCJMaW5rZWQgdmVyc2VzIGluIGN1cnJlbnQgZmlsZS5cIik7XG4vLyB9XG5cbi8vIGV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kVmVyc2VMaW5rc1NlbGVjdGlvbk9yTGluZShhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuLy8gICBjb25zdCBtZFZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbi8vICAgaWYgKCFtZFZpZXcpIHsgbmV3IE5vdGljZShcIk9wZW4gYSBNYXJrZG93biBmaWxlIGZpcnN0LlwiKTsgcmV0dXJuOyB9XG5cbi8vICAgY29uc3QgZWRpdG9yID0gbWRWaWV3LmVkaXRvcjtcblxuLy8gICAvLyBJZiB1c2VyIHNlbGVjdGVkIHRleHQsIHByb2Nlc3MgdGhhdDsgb3RoZXJ3aXNlIHByb2Nlc3MgdGhlIGN1cnJlbnQgbGluZVxuLy8gICBjb25zdCBzZWxlY3Rpb25UZXh0ID0gZWRpdG9yLmdldFNlbGVjdGlvbigpO1xuLy8gICBpZiAoc2VsZWN0aW9uVGV4dCAmJiBzZWxlY3Rpb25UZXh0Lmxlbmd0aCA+IDApIHtcbi8vICAgICBjb25zdCBsaW5rZWQgPSBhd2FpdCBsaW5rVmVyc2VzSW5UZXh0KHNlbGVjdGlvblRleHQsIHNldHRpbmdzKTtcbi8vICAgICBpZiAobGlua2VkICE9PSBzZWxlY3Rpb25UZXh0KSB7XG4vLyAgICAgICBlZGl0b3IucmVwbGFjZVNlbGVjdGlvbihsaW5rZWQpO1xuLy8gICAgICAgbmV3IE5vdGljZShcIkxpbmtlZCB2ZXJzZXMgaW4gc2VsZWN0aW9uLlwiKTtcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgbmV3IE5vdGljZShcIk5vIGxpbmthYmxlIHZlcnNlcyBpbiBzZWxlY3Rpb24uXCIpO1xuLy8gICAgIH1cbi8vICAgICByZXR1cm47XG4vLyAgIH1cblxuLy8gICAvLyBObyBzZWxlY3Rpb24gXHUyMTkyIHByb2Nlc3MgY3VycmVudCBsaW5lXG4vLyAgIGNvbnN0IGxpbmUgPSBlZGl0b3IuZ2V0Q3Vyc29yKCkubGluZTtcbi8vICAgY29uc3QgbGluZVRleHQgPSBlZGl0b3IuZ2V0TGluZShsaW5lKTtcbi8vICAgY29uc3QgbGlua2VkID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChsaW5lVGV4dCwgc2V0dGluZ3MpO1xuLy8gICBpZiAobGlua2VkICE9PSBsaW5lVGV4dCkge1xuLy8gICAgIGVkaXRvci5zZXRMaW5lKGxpbmUsIGxpbmtlZCk7XG4vLyAgICAgbmV3IE5vdGljZShcIkxpbmtlZCB2ZXJzZXMgb24gY3VycmVudCBsaW5lLlwiKTtcbi8vICAgfSBlbHNlIHtcbi8vICAgICBuZXcgTm90aWNlKFwiTm8gbGlua2FibGUgdmVyc2VzIG9uIGN1cnJlbnQgbGluZS5cIik7XG4vLyAgIH1cbi8vIH0iLCAiaW1wb3J0IHsgQXBwLCBURmlsZSwgVEZvbGRlciwgbm9ybWFsaXplUGF0aCB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRGcm9udG1hdHRlcih0ZXh0OiBzdHJpbmcpOiB7IHlhbWw/OiBzdHJpbmc7IGJvZHk6IHN0cmluZyB9IHtcbiAgaWYgKHRleHQuc3RhcnRzV2l0aChcIi0tLVwiKSkge1xuICAgIGNvbnN0IGVuZCA9IHRleHQuaW5kZXhPZihcIlxcbi0tLVwiLCAzKTtcbiAgICBpZiAoZW5kICE9PSAtMSkge1xuICAgICAgY29uc3QgeWFtbCA9IHRleHQuc2xpY2UoMCwgZW5kICsgNCk7XG4gICAgICBjb25zdCBib2R5ID0gdGV4dC5zbGljZShlbmQgKyA0KTtcbiAgICAgIHJldHVybiB7IHlhbWwsIGJvZHkgfTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHsgYm9keTogdGV4dCB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0QWZ0ZXJZYW1sT3JIMShzcmM6IHN0cmluZywgYmxvY2s6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHsgeWFtbCwgYm9keSB9ID0gc3BsaXRGcm9udG1hdHRlcihzcmMpO1xuICBpZiAoeWFtbCkgcmV0dXJuIHlhbWwgKyBcIlxcblwiICsgYmxvY2sgKyBib2R5O1xuICBjb25zdCBmaXJzdEgxID0gYm9keS5pbmRleE9mKFwiXFxuIyBcIik7XG4gIGlmIChmaXJzdEgxICE9PSAtMSkge1xuICAgIGNvbnN0IHBvcyA9IGZpcnN0SDEgKyAxO1xuICAgIHJldHVybiBib2R5LnNsaWNlKDAsIHBvcykgKyBibG9jayArIGJvZHkuc2xpY2UocG9zKTtcbiAgfVxuICByZXR1cm4gYm9keSArIChib2R5LmVuZHNXaXRoKFwiXFxuXCIpID8gXCJcIiA6IFwiXFxuXCIpICsgYmxvY2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0xlYWZGb2xkZXIoZm9sZGVyOiBURm9sZGVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBmb2xkZXIuY2hpbGRyZW4uZmluZChjID0+IGMgaW5zdGFuY2VvZiBURm9sZGVyKSA9PT0gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGVhZkZvbGRlcnNVbmRlcihhcHA6IEFwcCwgYmFzZUZvbGRlclBhdGg6IHN0cmluZyk6IFRGb2xkZXJbXSB7XG4gIGNvbnN0IGJhc2UgPSBhcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKG5vcm1hbGl6ZVBhdGgoYmFzZUZvbGRlclBhdGgpKTtcbiAgaWYgKCFiYXNlKSByZXR1cm4gW107XG4gIGNvbnN0IHJlczogVEZvbGRlcltdID0gW107XG4gIGNvbnN0IHdhbGsgPSAoZjogVEZvbGRlcikgPT4ge1xuICAgIGlmIChpc0xlYWZGb2xkZXIoZikpIHJlcy5wdXNoKGYpO1xuICAgIGVsc2UgZm9yIChjb25zdCBjIG9mIGYuY2hpbGRyZW4pIGlmIChjIGluc3RhbmNlb2YgVEZvbGRlcikgd2FsayhjKTtcbiAgfTtcbiAgd2FsayhiYXNlKTtcbiAgcmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpc3RNYXJrZG93bkZpbGVzKGZvbGRlcjogVEZvbGRlcik6IFRGaWxlW10ge1xuICByZXR1cm4gZm9sZGVyLmNoaWxkcmVuLmZpbHRlcigoYyk6IGMgaXMgVEZpbGUgPT4gYyBpbnN0YW5jZW9mIFRGaWxlICYmIGMuZXh0ZW5zaW9uID09PSBcIm1kXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlyc3ROb25FbXB0eUxpbmVJbmRleChsaW5lczogc3RyaW5nW10pOiBudW1iZXIge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSBpZiAobGluZXNbaV0udHJpbSgpLmxlbmd0aCkgcmV0dXJuIGk7XG4gIHJldHVybiAtMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwc2VydFRvcExpbmtzQmxvY2soc3JjOiBzdHJpbmcsIGxpbmtzTGluZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgeyB5YW1sLCBib2R5IH0gPSBzcGxpdEZyb250bWF0dGVyKHNyYyk7XG5cbiAgZnVuY3Rpb24gcmVwbGFjZVdpdGhpbihjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdChcIlxcblwiKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IE1hdGgubWluKDEwLCBsaW5lcy5sZW5ndGgpOyBpKyspIHtcbiAgICAgIGlmICgvXFx8UHJldmlvdXNcXF1cXF18XFx8TmV4dFxcXVxcXS8udGVzdChsaW5lc1tpXSkpIHtcbiAgICAgICAgbGluZXNbaV0gPSBsaW5rc0xpbmU7XG4gICAgICAgIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xuICAgICAgfVxuICAgIH1cbiAgICBsaW5lcy5zcGxpY2UoMCwgMCwgXCJcIiwgbGlua3NMaW5lLCBcIlwiKTtcbiAgICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGlmICh5YW1sKSByZXR1cm4geWFtbCArIHJlcGxhY2VXaXRoaW4oYm9keSk7XG4gIHJldHVybiByZXBsYWNlV2l0aGluKHNyYyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cHNlcnRCb3R0b21MaW5rcyhzcmM6IHN0cmluZywgbGlua3NMaW5lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IHNyYy5zcGxpdChcIlxcblwiKTtcbiAgZm9yIChsZXQgaSA9IE1hdGgubWF4KDAsIGxpbmVzLmxlbmd0aCAtIDUpOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoL1xcfFByZXZpb3VzXFxdXFxdfFxcfE5leHRcXF1cXF0vLnRlc3QobGluZXNbaV0pKSB7XG4gICAgICBsaW5lc1tpXSA9IGxpbmtzTGluZTtcbiAgICAgIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xuICAgIH1cbiAgfVxuICBsaW5lcy5wdXNoKFwiXCIsIGxpbmtzTGluZSk7XG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xufVxuIiwgImltcG9ydCB7IEFwcCwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IEJhc2VCb2xsc01vZGFsIH0gZnJvbSBcIi4vYm9sbHMtYmFzZS1tb2RhbFwiO1xuXG5leHBvcnQgY2xhc3MgUGlja1ZlcnNpb25Nb2RhbCBleHRlbmRzIEJhc2VCb2xsc01vZGFsIHtcbiAgcHJpdmF0ZSByZWFkb25seSBvblBpY2s6ICh2ZXJTaG9ydDogc3RyaW5nIHwgbnVsbCkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncywgb25QaWNrOiAodmVyU2hvcnQ6IHN0cmluZyB8IG51bGwpID0+IHZvaWQpIHtcbiAgICBzdXBlcihhcHAsIHNldHRpbmdzLCB7XG4gICAgICBsYW5ndWFnZUxhYmVsOiBzZXR0aW5ncy5iaWJsZURlZmF1bHRMYW5ndWFnZSA/PyBudWxsLFxuICAgICAgdmVyc2lvblNob3J0OiAgc2V0dGluZ3MuYmlibGVEZWZhdWx0VmVyc2lvbiwgLy8gY2FuIGJlIHVuZGVmaW5lZFxuICAgIH0pO1xuICAgIHRoaXMub25QaWNrID0gb25QaWNrO1xuICB9XG5cbiAgcHJvdGVjdGVkIHJlbmRlckZvb3Rlcihjb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJIb3cgdG8gbGlua1wiKVxuICAgICAgLnNldERlc2MoXCJJZiB5b3UgY2FuY2VsLCBsaW5rcyB3aWxsIHVzZSBkZWZhdWx0IChubyB2ZXJzaW9uKS5cIilcbiAgICAgIC5hZGRCdXR0b24oYiA9PlxuICAgICAgICBiLnNldEJ1dHRvblRleHQoXCJVc2Ugc2VsZWN0ZWQgdmVyc2lvblwiKS5zZXRDdGEoKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgdGhpcy5vblBpY2sodGhpcy50cmFuc2xhdGlvbkNvZGUgfHwgbnVsbCk7XG4gICAgICAgIH0pXG4gICAgICApXG4gICAgICAuYWRkRXh0cmFCdXR0b24oYiA9PlxuICAgICAgICBiLnNldEljb24oXCJ4XCIpLnNldFRvb2x0aXAoXCJDYW5jZWwgKG5vIHZlcnNpb24pXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICB0aGlzLm9uUGljayhudWxsKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG4gIH1cbn0iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHR5cGUgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7XG4gIEJhc2VCb2xsc0RlZmF1bHRzLFxuICBCb2xsc0xhbmd1YWdlLFxuICBCb2xsc1BpY2tlckNvbXBvbmVudCxcbn0gZnJvbSBcIi4vYm9sbHMtcGlja2VyLWNvbXBvbmVudFwiO1xuXG4vKipcbiAqIEJhc2UgbW9kYWwgdGhhdDpcbiAqICAtIGRlbGVnYXRlcyBhbGwgQm9sbHMgY2F0YWxvZ3VlIGxvYWRpbmcgKyBwaWNrZXJzIHRvIEJvbGxzUGlja2VyQ29tcG9uZW50LFxuICogIC0gZXhwb3NlcyBjaG9zZW4gYGxhbmd1YWdlS2V5YCwgYHRyYW5zbGF0aW9uQ29kZWAsIGB0cmFuc2xhdGlvbkZ1bGxgLFxuICogIC0gcHJvdmlkZXMgaG9va3MgZm9yIHN1YmNsYXNzZXMgdG8gYWRkIG9wdGlvbnMvZm9vdGVyL2FjdGlvbnMuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlQm9sbHNNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJvdGVjdGVkIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3M7XG5cbiAgLyoqIEN1cnJlbnQgc2VsZWN0aW9uIChrZXB0IGluIHN5bmMgdmlhIHRoZSBjb21wb25lbnQncyBvbkNoYW5nZSkgKi9cbiAgcHJvdGVjdGVkIGxhbmd1YWdlS2V5OiBzdHJpbmcgPSBcIkFMTFwiOyAvLyBcIkFMTFwiICg9ZmxhdHRlbikgb3IgZXhhY3QgQm9sbHNMYW5ndWFnZS5sYW5ndWFnZVxuICBwcm90ZWN0ZWQgdHJhbnNsYXRpb25Db2RlPzogc3RyaW5nID0gdW5kZWZpbmVkO1xuICBwcm90ZWN0ZWQgdHJhbnNsYXRpb25GdWxsPzogc3RyaW5nID0gdW5kZWZpbmVkO1xuXG4gIC8qKiBJZiBhIHN1YmNsYXNzIHdhbnRzIHRvIHJlbmRlciBhZGRpdGlvbmFsIFVJIG5lYXIgdGhlIHZlcnNpb25zIGFyZWEgKi9cbiAgcHJvdGVjdGVkIHZlcnNpb25zQ29udGFpbmVyITogSFRNTERpdkVsZW1lbnQ7XG5cbiAgLyoqIE9wdGlvbmFsIGRlZmF1bHRzIHRvIHByZXNlbGVjdCAoZnJvbSBzZXR0aW5ncykgKi9cbiAgcHJpdmF0ZSBkZWZhdWx0cz86IEJhc2VCb2xsc0RlZmF1bHRzO1xuXG4gIC8qKiBJZiBhIHN1YmNsYXNzIHdhbnRzIHRvIGluc3BlY3Qgb3IgcmV1c2UgdGhlIGNvbXBvbmVudC4gKi9cbiAgcHJvdGVjdGVkIHBpY2tlciE6IEJvbGxzUGlja2VyQ29tcG9uZW50O1xuXG4gIC8qKiBJZiBhIHN1YmNsYXNzIHdhbnRzIHRvIGFjY2VzcyB0aGUgaW4tbWVtb3J5IGJsb2NrcyBhZnRlciBjb21wb25lbnQgbG9hZHMuICovXG4gIHByb3RlY3RlZCBsYW5nQmxvY2tzOiBCb2xsc0xhbmd1YWdlW10gPSBbXTtcblxuICBwcm90ZWN0ZWQgZGlzYWxsb3dEZWZhdWx0OiBib29sZWFuID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MsIGRlZmF1bHRzPzogQmFzZUJvbGxzRGVmYXVsdHMpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICB0aGlzLnRyYW5zbGF0aW9uQ29kZSA9IHNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb247XG4gICAgdGhpcy50cmFuc2xhdGlvbkZ1bGwgPSBzZXR0aW5ncy5iaWJsZURlZmF1bHRWZXJzaW9uRnVsbDtcbiAgICB0aGlzLmxhbmd1YWdlS2V5ID0gc2V0dGluZ3MuYmlibGVEZWZhdWx0TGFuZ3VhZ2UgPz8gXCJBTExcIjtcbiAgICB0aGlzLmRlZmF1bHRzID0gZGVmYXVsdHM7XG4gIH1cblxuICAvKiogT3ZlcnJpZGUgdG8gYWRkIGV4dHJhIG9wdGlvbiBjb250cm9scyB1bmRlciB0aGUgcGlja2VycyAqL1xuICBwcm90ZWN0ZWQgcmVuZGVyRXh0cmFPcHRpb25zKF9jb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7fVxuXG4gIC8qKiBPdmVycmlkZSB0byByZW5kZXIgZm9vdGVyIChidXR0b25zL3Byb2dyZXNzL2V0Yy4pICovXG4gIHByb3RlY3RlZCBhYnN0cmFjdCByZW5kZXJGb290ZXIoY29udGVudEVsOiBIVE1MRWxlbWVudCk6IHZvaWQ7XG5cbiAgYXN5bmMgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiQmlibGUgdmVyc2lvblwiKTtcblxuICAgIC8vIEluc3RhbnRpYXRlIHRoZSByZXVzYWJsZSBwaWNrZXIgY29tcG9uZW50LlxuICAgIC8vIEl0IGhhbmRsZXM6XG4gICAgLy8gIC0gbG9hZGluZy9jYWNoaW5nIGxhbmd1YWdlcy5qc29uLFxuICAgIC8vICAtIGNyZWF0aW5nIExhbmd1YWdlICsgVmVyc2lvbiBkcm9wZG93bnMsXG4gICAgLy8gIC0gYXBwbHlpbmcgcHJvdmlkZWQgZGVmYXVsdHMsXG4gICAgLy8gIC0gY2FsbGluZyBvbkNoYW5nZSB3aXRoIGxhbmd1YWdlLCB2ZXJzaW9uIChzaG9ydCksIGFuZCB2ZXJzaW9uRnVsbC5cbiAgICB0aGlzLnBpY2tlciA9IG5ldyBCb2xsc1BpY2tlckNvbXBvbmVudChcbiAgICAgIHtcbiAgICAgICAgYXBwOiB0aGlzLmFwcCwgLy8gc28gY29tcG9uZW50IGNhbiBwZXJzaXN0IHNldHRpbmdzIGlmIGl0IHdhbnRzXG4gICAgICAgIHNldHRpbmdzOiB0aGlzLnNldHRpbmdzLFxuICAgICAgICAvLyBZb3UgY2FuIHBhc3MgYSBzdGFsZS9lbXB0eSBhcnJheTsgdGhlIGNvbXBvbmVudCB3aWxsIGxvYWQvcmVwbGFjZSBpdC5cbiAgICAgICAgbGFuZ0Jsb2NrczogdGhpcy5sYW5nQmxvY2tzLFxuICAgICAgICAvLyBJbml0aWFsIHZhbHVlczsgdGhlIGNvbXBvbmVudCBtYXkgb3ZlcnJpZGUgYmFzZWQgb24gZGVmYXVsdHMgb3IgYXZhaWxhYmlsaXR5LlxuICAgICAgICBsYW5ndWFnZUtleTogdGhpcy5sYW5ndWFnZUtleSxcbiAgICAgICAgdHJhbnNsYXRpb25Db2RlOiB0aGlzLnNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb24sXG4gICAgICAgIHRyYW5zbGF0aW9uRnVsbDogdGhpcy5zZXR0aW5ncy5iaWJsZURlZmF1bHRWZXJzaW9uRnVsbCxcbiAgICAgICAgZGVmYXVsdHM6IHRoaXMuZGVmYXVsdHMsXG4gICAgICAgIGNvbnRhaW5lcjogY29udGVudEVsLFxuICAgICAgICB2ZXJzaW9uc0NvbnRhaW5lcjogY29udGVudEVsLmNyZWF0ZURpdigpLCAvLyB3aWxsIGJlIHJlcGxhY2VkIGJ5IGNvbXBvbmVudCBpbiBpdHMgY29uc3RydWN0b3JcbiAgICAgICAgb25DaGFuZ2U6IChsYW5ndWFnZSwgdmVyc2lvbiwgdmVyc2lvbkZ1bGwpID0+IHtcbiAgICAgICAgICB0aGlzLmxhbmd1YWdlS2V5ID0gbGFuZ3VhZ2U7XG4gICAgICAgICAgdGhpcy50cmFuc2xhdGlvbkNvZGUgPSB2ZXJzaW9uO1xuICAgICAgICAgIHRoaXMudHJhbnNsYXRpb25GdWxsID0gdmVyc2lvbkZ1bGw7XG4gICAgICAgICAgLy8gS2VlcCBhIGxvY2FsIGNvcHkgb2Ygd2hhdCB0aGUgY29tcG9uZW50IGN1cnJlbnRseSBrbm93cyBhYm91dCBibG9ja3NcbiAgICAgICAgICB0aGlzLmxhbmdCbG9ja3MgPSB0aGlzLnBpY2tlcj8uW1wib3B0aW9uc1wiXT8ubGFuZ0Jsb2NrcyA/PyB0aGlzLmxhbmdCbG9ja3M7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgdGhpcy5zZXR0aW5ncyxcbiAgICAgIHRoaXMuZGlzYWxsb3dEZWZhdWx0XG4gICAgKTtcblxuICAgIC8vIEV4cG9zZSB0aGUgdmVyc2lvbnMgY29udGFpbmVyIGZvciBzdWJjbGFzc2VzIHRoYXQgd2FudCB0byByZW5kZXIgbmVhciBpdC5cbiAgICB0aGlzLnZlcnNpb25zQ29udGFpbmVyID0gdGhpcy5waWNrZXIudmVyc2lvbnNDb250YWluZXIhO1xuXG4gICAgLy8gQWxsb3cgc3ViY2xhc3NlcyB0byBhZGQgZXh0cmEgY29udHJvbHNcbiAgICB0aGlzLnJlbmRlckV4dHJhT3B0aW9ucyhjb250ZW50RWwpO1xuXG4gICAgLy8gRm9vdGVyL2FjdGlvbnMgKGFic3RyYWN0KVxuICAgIHRoaXMucmVuZGVyRm9vdGVyKGNvbnRlbnRFbCk7XG4gIH1cblxuICBvbkNsb3NlKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICB9XG59IiwgImltcG9ydCB7IEFwcCwgVEZpbGUsIFRGb2xkZXIsIE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBsaXN0TWFya2Rvd25GaWxlcywgdXBzZXJ0Qm90dG9tTGlua3MsIHVwc2VydFRvcExpbmtzQmxvY2sgfSBmcm9tIFwiLi4vbGliL21kLXV0aWxzXCI7XG5cbmZ1bmN0aW9uIHRva2VuRnJvbUZpbGVuYW1lKG5hbWU6IHN0cmluZyk6IG51bWJlciB8IG51bGwge1xuICBjb25zdCBtID0gbmFtZS5tYXRjaCgvXihcXGQrKS8pO1xuICBpZiAoIW0pIHJldHVybiBudWxsO1xuICByZXR1cm4gcGFyc2VJbnQobVsxXSwgMTApO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZEFkZE5leHRQcmV2aW91cyhhcHA6IEFwcCwgX3NldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MsIF9wYXJhbXM/OiBSZWNvcmQ8c3RyaW5nLHN0cmluZz4pIHtcbiAgY29uc3QgZmlsZSA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICBpZiAoIWZpbGUpIHsgbmV3IE5vdGljZShcIk9wZW4gYSBmaWxlIGZpcnN0LlwiKTsgcmV0dXJuOyB9XG4gIGNvbnN0IHBhcmVudCA9IGZpbGUucGFyZW50O1xuICBpZiAoIShwYXJlbnQgaW5zdGFuY2VvZiBURm9sZGVyKSkgeyBuZXcgTm90aWNlKFwiQ3VycmVudCBmaWxlIGhhcyBubyBmb2xkZXIuXCIpOyByZXR1cm47IH1cblxuICBjb25zdCBtZEZpbGVzID0gbGlzdE1hcmtkb3duRmlsZXMocGFyZW50KVxuICAgIC5tYXAoZiA9PiAoeyBmLCBuOiB0b2tlbkZyb21GaWxlbmFtZShmLm5hbWUpIH0pKVxuICAgIC5maWx0ZXIoeCA9PiB4Lm4gIT09IG51bGwpXG4gICAgLnNvcnQoKGEsIGIpID0+IChhLm4hIC0gYi5uISkpXG4gICAgLm1hcCh4ID0+IHguZik7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZEZpbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY3VyID0gbWRGaWxlc1tpXTtcbiAgICBjb25zdCBwcmV2ID0gbWRGaWxlc1tpIC0gMV07XG4gICAgY29uc3QgbmV4dCA9IG1kRmlsZXNbaSArIDFdO1xuXG4gICAgY29uc3QgcHJldk5hbWUgPSBwcmV2ID8gcHJldi5iYXNlbmFtZSA6IG51bGw7XG4gICAgY29uc3QgbmV4dE5hbWUgPSBuZXh0ID8gbmV4dC5iYXNlbmFtZSA6IG51bGw7XG5cbiAgICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAocHJldk5hbWUpIHBhcnRzLnB1c2goYFtbJHtwcmV2TmFtZX18UHJldmlvdXNdXWApO1xuICAgIGlmIChuZXh0TmFtZSkgcGFydHMucHVzaChgW1ske25leHROYW1lfXxOZXh0XV1gKTtcbiAgICBjb25zdCBsaW5rc0xpbmUgPSBwYXJ0cy5qb2luKFwiIHwgXCIpO1xuXG4gICAgaWYgKCFsaW5rc0xpbmUpIGNvbnRpbnVlO1xuXG4gICAgY29uc3Qgc3JjID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoY3VyKTtcbiAgICBjb25zdCB3aXRoVG9wID0gdXBzZXJ0VG9wTGlua3NCbG9jayhzcmMsIGxpbmtzTGluZSk7XG4gICAgY29uc3Qgd2l0aEJvdGggPSB1cHNlcnRCb3R0b21MaW5rcyh3aXRoVG9wLCBsaW5rc0xpbmUpO1xuICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoY3VyLCB3aXRoQm90aCk7XG4gIH1cblxuICBuZXcgTm90aWNlKFwiSW5zZXJ0ZWQgTmV4dC9QcmV2aW91cyBsaW5rcy5cIik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBURmlsZSwgVEZvbGRlciwgTm90aWNlLCBub3JtYWxpemVQYXRoIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IGFydGljbGVTdHlsZSwgbm93U3RhbXAgfSBmcm9tIFwiLi4vbGliL3RleHQtdXRpbHNcIjtcbmltcG9ydCB7IGdldExlYWZGb2xkZXJzVW5kZXIsIGxpc3RNYXJrZG93bkZpbGVzIH0gZnJvbSBcIi4uL2xpYi9tZC11dGlsc1wiO1xuXG5jb25zdCBzdHJpcFdpa2lsaW5rcyA9IChzOiBzdHJpbmcpID0+IHMucmVwbGFjZSgvXlxcW1xcW3xcXF1cXF0kL2csIFwiXCIpO1xuXG5mdW5jdGlvbiBmcm9udG1hdHRlckF1dGhvckZyb21GaWxlKGFwcDogQXBwLCBmOiBURmlsZSk6IHsgYXV0aG9yPzogc3RyaW5nIHwgc3RyaW5nW10sIGJvb2tfdHlwZT86IHN0cmluZyB9IHtcbiAgY29uc3QgY2FjaGUgPSBhcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZik7XG4gIGNvbnN0IGZtOiBhbnkgPSBjYWNoZT8uZnJvbnRtYXR0ZXIgPz8ge307XG4gIGxldCBhdXRob3IgPSBmbS5hdXRob3I7XG4gIGlmICh0eXBlb2YgYXV0aG9yID09PSBcInN0cmluZ1wiKSBhdXRob3IgPSBhdXRob3IucmVwbGFjZSgvXlwiXFxzKi8sIFwiXCIpLnJlcGxhY2UoL1xccypcIiQvLCBcIlwiKTtcbiAgY29uc3QgYm9va190eXBlID0gdHlwZW9mIGZtLmJvb2tfdHlwZSA9PT0gXCJzdHJpbmdcIiA/IGZtLmJvb2tfdHlwZS5yZXBsYWNlKC9eXCJcXHMqLywgXCJcIikucmVwbGFjZSgvXFxzKlwiJC8sIFwiXCIpIDogdW5kZWZpbmVkO1xuICByZXR1cm4geyBhdXRob3IsIGJvb2tfdHlwZSB9O1xufVxuXG5mdW5jdGlvbiBmb3JtYXRBdXRob3JGaWVsZChhdXRob3I6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgaWYgKCFhdXRob3IpIHJldHVybiAnXCJbW1Vua25vd24gQXV0aG9yXV1cIic7XG4gIGlmIChBcnJheS5pc0FycmF5KGF1dGhvcikpIHtcbiAgICByZXR1cm4gXCJcXG4gIC0gXCIgKyBhdXRob3JcbiAgICAgIC5tYXAoYSA9PiBhLnJlcGxhY2UoL15cXFtcXFt8XFxdXFxdJC9nLCBcIlwiKSlcbiAgICAgIC5tYXAoYSA9PiBgW1ske2F9XV1gKVxuICAgICAgLmpvaW4oXCJcXG4gIC0gXCIpO1xuICB9XG4gIGNvbnN0IGNsZWFuID0gYXV0aG9yLnJlcGxhY2UoL15cXFtcXFt8XFxdXFxdJC9nLCBcIlwiKTtcbiAgcmV0dXJuIGAgXCJbWyR7Y2xlYW59XV1cImA7XG59XG5cbi8qKiBDb3JlOiBjcmVhdGUvdXBkYXRlIHRoZSBpbmRleCBmaWxlIGZvciBhIHNpbmdsZSBmb2xkZXIuIFJldHVybnMgdHJ1ZSBpZiBjcmVhdGVkL3VwZGF0ZWQsIGZhbHNlIGlmIHNraXBwZWQuICovXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVPclVwZGF0ZUluZGV4Rm9yRm9sZGVyKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzLCBmb2xkZXI6IFRGb2xkZXIsIGlzQm9vazogYm9vbGVhbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBjb25zdCBmaWxlcyA9IGxpc3RNYXJrZG93bkZpbGVzKGZvbGRlcik7XG4gIGlmICghZmlsZXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gVHJ5IHRvIHBpY2sgYXV0aG9yL2Jvb2tfdHlwZSBmcm9tIHRoZSBmaXJzdCBmaWxlIHRoYXQgaGFzIGl0XG4gIGxldCBhdXRob3I6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBsZXQgYm9va1R5cGU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgZm9yIChjb25zdCBmIG9mIGZpbGVzKSB7XG4gICAgY29uc3QgbWV0YSA9IGZyb250bWF0dGVyQXV0aG9yRnJvbUZpbGUoYXBwLCBmKTtcbiAgICBpZiAobWV0YS5hdXRob3IpIHsgYXV0aG9yID0gbWV0YS5hdXRob3I7IGJvb2tUeXBlID0gbWV0YS5ib29rX3R5cGU7IGJyZWFrOyB9XG4gIH1cblxuICBjb25zdCBmb2xkZXJOYW1lID0gZm9sZGVyLm5hbWU7XG4gIGNvbnN0IGlkeE5hbWUgPSBzZXR0aW5ncy5pbmRleEZpbGVOYW1lTW9kZSA9PT0gXCJhcnRpY2xlLXN0eWxlXCIgPyBhcnRpY2xlU3R5bGUoZm9sZGVyTmFtZSkgOiBmb2xkZXJOYW1lO1xuICBjb25zdCBpbmRleFBhdGggPSBub3JtYWxpemVQYXRoKGZvbGRlci5wYXRoICsgXCIvXCIgKyBpZHhOYW1lICsgXCIubWRcIik7XG4gIGNvbnN0IGNyZWF0ZWQgPSBub3dTdGFtcCgpO1xuXG4gIHZhciBwcm9wczogc3RyaW5nO1xuICBpZiAoaXNCb29rKSB7XG4gICAgcHJvcHMgPSBbXG4gICAgICBgdGl0bGU6ICR7aWR4TmFtZX1gLFxuICAgICAgYGNyZWF0ZWQ6ICR7Y3JlYXRlZH1gLFxuICAgICAgYG1vZGlmaWVkOiAke2NyZWF0ZWR9YCxcbiAgICAgIGBib29rX3RpdGxlOiBcIltbJHtmb2xkZXJOYW1lfV1dXCJgLFxuICAgICAgLi4uKGJvb2tUeXBlID8gW2Bib29rX3R5cGU6IFwiW1ske3N0cmlwV2lraWxpbmtzKGJvb2tUeXBlKX1dXVwiYF0gOiBbXSksXG4gICAgICBgdHlwZTogXCJbW0Jvb2tdXVwiYCxcbiAgICAgIGBhdXRob3I6ICR7Zm9ybWF0QXV0aG9yRmllbGQoYXV0aG9yKX1gXG4gICAgXS5qb2luKFwiXFxuXCIpO1xuICB9IGVsc2Uge1xuICAgIHByb3BzID0gW1xuICAgICAgYHRpdGxlOiAke2lkeE5hbWV9YCxcbiAgICAgIGBjcmVhdGVkOiAke2NyZWF0ZWR9YCxcbiAgICAgIGBtb2RpZmllZDogJHtjcmVhdGVkfWAsXG4gICAgICBgdG9waWNzOiBcIltbJHtzdHJpcFdpa2lsaW5rcyhmb2xkZXJOYW1lKX1dXVwiYFxuICAgIF0uam9pbihcIlxcblwiKTtcbiAgfVxuXG4gIGNvbnN0IGRhdGF2aWV3ID0gW1xuICAgIFwiYGBgZGF0YXZpZXdcIixcbiAgICBcIlRBQkxFXCIsXG4gICAgJ2Zyb20gXCJcIicsXG4gICAgXCJ3aGVyZSBjb250YWlucyhmaWxlLmZvbGRlciwgdGhpcy5maWxlLmZvbGRlcikgYW5kIGZpbGUubmFtZSAhPSB0aGlzLmZpbGUubmFtZVwiLFxuICAgIFwiU09SVCBudW1iZXIoZmlsZS5uYW1lKSBBU0NcIixcbiAgICBcImBgYFwiLFxuICAgIFwiXCJcbiAgXS5qb2luKFwiXFxuXCIpO1xuXG4gIGNvbnN0IGhlYWRlciA9IGAtLS1cXG4ke3Byb3BzfVxcbi0tLVxcblxcbiMgJHtpZHhOYW1lfVxcbmA7XG4gIGNvbnN0IGNvbnRlbnQgPSBoZWFkZXIgKyBkYXRhdmlldztcblxuICBjb25zdCBleGlzdGluZyA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoaW5kZXhQYXRoKTtcbiAgaWYgKGV4aXN0aW5nIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICBjb25zdCBjdXIgPSBhd2FpdCBhcHAudmF1bHQucmVhZChleGlzdGluZyk7XG4gICAgaWYgKC9gYGBkYXRhdmlldy8udGVzdChjdXIpKSByZXR1cm4gZmFsc2U7IC8vIGFscmVhZHkgaGFzIGEgZGF0YXZpZXcgYmxvY2sgXHUyMDE0IHNraXBcblxuICAgIC8vIEluc2VydCBkYXRhdmlldyByaWdodCBhZnRlciBmcm9udG1hdHRlciBpZiBwcmVzZW50XG4gICAgY29uc3QgcGFydHMgPSBjdXIuc3BsaXQoXCItLS1cIik7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA+PSAzKSB7XG4gICAgICBjb25zdCBtZXJnZWQgPSBwYXJ0c1swXSArIFwiLS0tXCIgKyBwYXJ0c1sxXSArIFwiLS0tXFxuXCIgKyBkYXRhdmlldyArIHBhcnRzLnNsaWNlKDIpLmpvaW4oXCItLS1cIik7XG4gICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGV4aXN0aW5nLCBtZXJnZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGV4aXN0aW5nLCBjdXIgKyBcIlxcblwiICsgZGF0YXZpZXcpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICBhd2FpdCBhcHAudmF1bHQuY3JlYXRlKGluZGV4UGF0aCwgY29udGVudCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuLyoqIEV4aXN0aW5nIGNvbW1hbmQ6IGFkZCBpbmRleGVzIGZvciBhbGwgbGVhZiBmb2xkZXJzIHVuZGVyIGEgYmFzZSBmb2xkZXIgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21tYW5kQWRkRm9sZGVySW5kZXgoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MsIHBhcmFtcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pIHtcbiAgY29uc3QgYmFzZUZvbGRlciA9IHBhcmFtcz8uZm9sZGVyID8/IHNldHRpbmdzLmJhc2VGb2xkZXI7XG4gIGNvbnN0IGZvbGRlcnMgPSBnZXRMZWFmRm9sZGVyc1VuZGVyKGFwcCwgYmFzZUZvbGRlcik7XG4gIGlmICghZm9sZGVycy5sZW5ndGgpIHsgbmV3IE5vdGljZShgTm8gbGVhZiBmb2xkZXJzIHVuZGVyICR7YmFzZUZvbGRlcn1gKTsgcmV0dXJuOyB9XG5cbiAgbGV0IGNoYW5nZWQgPSAwO1xuICBmb3IgKGNvbnN0IGZvbGRlciBvZiBmb2xkZXJzKSB7XG4gICAgY29uc3QgZGlkID0gYXdhaXQgY3JlYXRlT3JVcGRhdGVJbmRleEZvckZvbGRlcihhcHAsIHNldHRpbmdzLCBmb2xkZXIsIHRydWUpO1xuICAgIGlmIChkaWQpIGNoYW5nZWQrKztcbiAgfVxuXG4gIG5ldyBOb3RpY2UoY2hhbmdlZCA+IDAgPyBgRm9sZGVyIGluZGV4ZXMgY3JlYXRlZC91cGRhdGVkOiAke2NoYW5nZWR9YCA6IFwiTm8gY2hhbmdlczsgaW5kZXhlcyBhbHJlYWR5IHByZXNlbnQuXCIpO1xufVxuXG4vKiogTkVXIGNvbW1hbmQ6IGFkZC91cGRhdGUgaW5kZXggT05MWSBmb3IgdGhlIGZvbGRlciBvZiB0aGUgY3VycmVudCBmaWxlICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZEFkZEluZGV4Rm9yQ3VycmVudEZvbGRlcihhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuICBjb25zdCBhY3RpdmUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgY29uc3QgZm9sZGVyID0gYWN0aXZlPy5wYXJlbnQ7XG4gIGlmICghYWN0aXZlIHx8ICFmb2xkZXIpIHsgbmV3IE5vdGljZShcIk9wZW4gYSBmaWxlIGluc2lkZSB0aGUgdGFyZ2V0IGZvbGRlci5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IGRpZCA9IGF3YWl0IGNyZWF0ZU9yVXBkYXRlSW5kZXhGb3JGb2xkZXIoYXBwLCBzZXR0aW5ncywgZm9sZGVyLCBmYWxzZSk7XG4gIG5ldyBOb3RpY2UoZGlkID8gYEluZGV4IGNyZWF0ZWQvdXBkYXRlZCBmb3IgXHUyMDFDJHtmb2xkZXIubmFtZX1cdTIwMUQuYCA6IGBObyBpbmRleCBjaGFuZ2UgaW4gXHUyMDFDJHtmb2xkZXIubmFtZX1cdTIwMUQuYCk7XG59IiwgImV4cG9ydCBmdW5jdGlvbiBhcnRpY2xlU3R5bGUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKG5hbWUuZW5kc1dpdGgoXCIsIFRoZVwiKSkgcmV0dXJuIGBUaGUgJHtuYW1lLnNsaWNlKDAsIC01KX1gO1xuICBpZiAobmFtZS5lbmRzV2l0aChcIiwgQVwiKSkgICByZXR1cm4gYEEgJHtuYW1lLnNsaWNlKDAsIC0zKX1gO1xuICByZXR1cm4gbmFtZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vd1N0YW1wKCk6IHN0cmluZyB7XG4gIGNvbnN0IGQgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCB3ZWVrZGF5ID0gZC50b0xvY2FsZURhdGVTdHJpbmcodW5kZWZpbmVkLCB7IHdlZWtkYXk6IFwic2hvcnRcIiB9KTtcbiAgY29uc3QgZGF5ID0gU3RyaW5nKGQuZ2V0RGF0ZSgpKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gIGNvbnN0IG1vbnRoID0gZC50b0xvY2FsZURhdGVTdHJpbmcodW5kZWZpbmVkLCB7IG1vbnRoOiBcImxvbmdcIiB9KTtcbiAgY29uc3QgeWVhciA9IGQuZ2V0RnVsbFllYXIoKTtcbiAgY29uc3QgdGltZSA9IGQudG9Mb2NhbGVUaW1lU3RyaW5nKHVuZGVmaW5lZCwgeyBob3VyMTI6IGZhbHNlIH0pO1xuICByZXR1cm4gYCR7d2Vla2RheX0sICR7ZGF5fS4gJHttb250aH0gJHt5ZWFyfSwgJHt0aW1lfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnN1cmVOZXdsaW5lKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBzLmVuZHNXaXRoKFwiXFxuXCIpID8gcyA6IHMgKyBcIlxcblwiO1xufVxuIiwgImltcG9ydCB0eXBlIE9ic2lkaWFuQmlibGVUb29scyBmcm9tIFwiLi9tYWluXCI7XG5pbXBvcnQgeyBjb21tYW5kVmVyc2VMaW5rcyB9IGZyb20gXCIuL2NvbW1hbmRzL3ZlcnNlLWxpbmtzXCI7XG5pbXBvcnQgeyBjb21tYW5kQWRkTmV4dFByZXZpb3VzIH0gZnJvbSBcIi4vY29tbWFuZHMvYWRkLW5leHQtcHJldmlvdXNcIjtcbmltcG9ydCB7IGNvbW1hbmRBZGRGb2xkZXJJbmRleCB9IGZyb20gXCIuL2NvbW1hbmRzL2FkZC1mb2xkZXItaW5kZXhcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUHJvdG9jb2wocGx1Z2luOiBPYnNpZGlhbkJpYmxlVG9vbHMpIHtcbiAgcGx1Z2luLnJlZ2lzdGVyT2JzaWRpYW5Qcm90b2NvbEhhbmRsZXIoXCJvYnNpZGlhbi1iaWJsZS10b29sc1wiLCBhc3luYyAocGFyYW1zKSA9PiB7XG4gICAgY29uc3QgYWN0aW9uID0gcGFyYW1zLmFjdGlvbiA/PyBcIlwiO1xuICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICBjYXNlIFwibGluay12ZXJzZXNcIjpcbiAgICAgICAgYXdhaXQgY29tbWFuZFZlcnNlTGlua3MocGx1Z2luLmFwcCwgcGx1Z2luLnNldHRpbmdzLCBwYXJhbXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJhZGQtbmV4dC1wcmV2aW91c1wiOlxuICAgICAgICBhd2FpdCBjb21tYW5kQWRkTmV4dFByZXZpb3VzKHBsdWdpbi5hcHAsIHBsdWdpbi5zZXR0aW5ncywgcGFyYW1zKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiYWRkLWZvbGRlci1pbmRleFwiOlxuICAgICAgICBhd2FpdCBjb21tYW5kQWRkRm9sZGVySW5kZXgocGx1Z2luLmFwcCwgcGx1Z2luLnNldHRpbmdzLCBwYXJhbXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfSk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBhZGRJY29uIGFzIEFkZEljb25GbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5jb25zdCBJQ09OUzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgXCJvYnRiLWJvb2tcIjogYDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj48cGF0aCBkPVwiTTYgNGgxMGEyIDIgMCAwIDEgMiAydjEyLjVhMS41IDEuNSAwIDAgMC0xLjUtMS41SDZhMiAyIDAgMCAwIDAgNGgxMFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIi8+PC9zdmc+YCxcbiAgXCJvYnRiLWxpbmtzXCI6IGA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI+PHBhdGggZD1cIk0xMCAxM2E1IDUgMCAwIDEgMC03bDEtMWE1IDUgMCAwIDEgNyA3bC0xIDFNMTQgMTFhNSA1IDAgMCAxIDAgN2wtMSAxYTUgNSAwIDAgMS03LTdsMS0xXCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiLz48L3N2Zz5gLFxuICBcIm9idGItaGlnaGxpZ2h0ZXJcIjogYDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiPjxwYXRoIGQ9XCJNMyAxNmw2LTYgNSA1LTYgNkgzelwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIi8+PHBhdGggZD1cIk0xMiA5bDMtMyAzIDMtMyAzelwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIi8+PC9zdmc+YCxcbiAgXCJvYnRiLXN1bW1hcnlcIjogYDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiPjxwYXRoIGQ9XCJNNSA1aDE0TTUgOWgxME01IDEzaDhNNSAxN2g2XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBmaWxsPVwibm9uZVwiLz48L3N2Zz5gLFxuICBcIm9idGItb3V0bGluZVwiOiBgPHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+PHBhdGggZD1cIk03IDZoMTBNNyAxMmgxME03IDE4aDZcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIGZpbGw9XCJub25lXCIvPjwvc3ZnPmAsXG4gIFwib2J0Yi1mb3JtYXR0ZXJcIjogYDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiPjxwYXRoIGQ9XCJNNSA3aDZNNSAxMmgxME01IDE3aDhcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIGZpbGw9XCJub25lXCIvPjwvc3ZnPmAsXG4gIFwib2J0Yi1iaWJsZVwiOiBgPHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+PHBhdGggZD1cIk02LjUgNGg5QTIuNSAyLjUgMCAwIDEgMTggNi41VjIwSDguNUEyLjUgMi41IDAgMCAxIDYgMTcuNVY0LjVcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIi8+PHBhdGggZD1cIk0xMCA4aDZNMTAgMTFoNlwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIi8+PC9zdmc+YFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySWNvbnMoYWRkSWNvbjogdHlwZW9mIEFkZEljb25Gbikge1xuICBmb3IgKGNvbnN0IFtuYW1lLCBzdmddIG9mIE9iamVjdC5lbnRyaWVzKElDT05TKSkgYWRkSWNvbihuYW1lLCBzdmcpO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTm90aWNlLCBURm9sZGVyIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IGxpc3RNYXJrZG93bkZpbGVzIH0gZnJvbSBcIi4uL2xpYi9tZC11dGlsc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZEV4dHJhY3RIaWdobGlnaHRzRm9sZGVyKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIGNvbnN0IHZpZXcgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgY29uc3Qgc3RhcnRGb2xkZXIgPSB2aWV3Py5wYXJlbnQgPz8gYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aChzZXR0aW5ncy5iYXNlRm9sZGVyKTtcbiAgaWYgKCEoc3RhcnRGb2xkZXIgaW5zdGFuY2VvZiBURm9sZGVyKSkgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgaW4gdGhlIHRhcmdldCBmb2xkZXIgb3Igc2V0IGEgdmFsaWQgYmFzZSBmb2xkZXIuXCIpOyByZXR1cm47IH1cblxuICBjb25zdCBhbGw6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgbWFya1JlZ2V4ID0gbmV3IFJlZ0V4cChgPG1hcmtcXFxccytzdHlsZT1bXCInXSR7c2V0dGluZ3MucmVkTWFya0Nzcy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxcXF1cXFxcXFxcXF0vZywgXCJcXFxcJCZcIil9W1wiJ10+KC4qPyk8L21hcms+YCwgXCJnXCIpO1xuXG4gIGNvbnN0IGZpbGVzID0gbGlzdE1hcmtkb3duRmlsZXMoc3RhcnRGb2xkZXIpLnNvcnQoKGEsYikgPT4ge1xuICAgIGNvbnN0IGFuID0gYS5iYXNlbmFtZS5tYXRjaCgvXlxcZCsvKT8uWzBdOyBjb25zdCBibiA9IGIuYmFzZW5hbWUubWF0Y2goL15cXGQrLyk/LlswXTtcbiAgICBpZiAoYW4gJiYgYm4pIHJldHVybiBOdW1iZXIoYW4pIC0gTnVtYmVyKGJuKTtcbiAgICBpZiAoYW4pIHJldHVybiAtMTtcbiAgICBpZiAoYm4pIHJldHVybiAxO1xuICAgIHJldHVybiBhLmJhc2VuYW1lLmxvY2FsZUNvbXBhcmUoYi5iYXNlbmFtZSk7XG4gIH0pO1xuXG4gIGZvciAoY29uc3QgZiBvZiBmaWxlcykge1xuICAgIGNvbnN0IHNyYyA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGYpO1xuICAgIGNvbnN0IGxvY2FsOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICAgIG1hcmtSZWdleC5sYXN0SW5kZXggPSAwO1xuICAgIHdoaWxlICgobSA9IG1hcmtSZWdleC5leGVjKHNyYykpICE9PSBudWxsKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gbVsxXS50cmltKCk7XG4gICAgICBpZiAoIXRleHQpIGNvbnRpbnVlO1xuICAgICAgaWYgKCFzZWVuLmhhcyh0ZXh0KSkgeyBzZWVuLmFkZCh0ZXh0KTsgaWYgKCFsb2NhbC5pbmNsdWRlcyh0ZXh0KSkgbG9jYWwucHVzaCh0ZXh0KTsgfVxuICAgIH1cbiAgICBpZiAobG9jYWwubGVuZ3RoKSB7XG4gICAgICBhbGwucHVzaChgXFxuIyMjIyBbWyR7Zi5iYXNlbmFtZX1dXVxcbmAgKyBsb2NhbC5tYXAodCA9PiBgLSAke3R9YCkuam9pbihcIlxcblwiKSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFhbGwubGVuZ3RoKSB7IG5ldyBOb3RpY2UoXCJObyBoaWdobGlnaHRzIGZvdW5kIGluIGZvbGRlci5cIik7IHJldHVybjsgfVxuXG4gIGNvbnN0IG91dCA9IGFsbC5qb2luKFwiXFxuXCIpO1xuICBjb25zdCB0YXJnZXQgPSBzdGFydEZvbGRlci5wYXRoICsgXCIvSGlnaGxpZ2h0cy5tZFwiO1xuICBjb25zdCBleGlzdGluZyA9IGFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKHRhcmdldCk7XG4gIGlmIChleGlzdGluZykgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShleGlzdGluZywgb3V0KTtcbiAgZWxzZSBhd2FpdCBhcHAudmF1bHQuY3JlYXRlKHRhcmdldCwgb3V0KTtcbiAgbmV3IE5vdGljZShcIkhpZ2hsaWdodHMubWQgY3JlYXRlZC5cIik7XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEJpYmxlVG9vbHNTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgaW5zZXJ0QWZ0ZXJZYW1sT3JIMSB9IGZyb20gXCIuLi9saWIvbWQtdXRpbHNcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbW1hbmRFeHRyYWN0UmVkSGlnaGxpZ2h0cyhhcHA6IEFwcCwgc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuICBjb25zdCBmaWxlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gIGlmICghZmlsZSkgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgZmlyc3QuXCIpOyByZXR1cm47IH1cbiAgY29uc3Qgc3JjID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG5cbiAgY29uc3QgbWFya1JlZ2V4ID0gbmV3IFJlZ0V4cChgPG1hcmtcXFxccytzdHlsZT1bXCInXSR7c2V0dGluZ3MucmVkTWFya0Nzcy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxcXF1cXFxcXFxcXF0vZywgXCJcXFxcJCZcIil9W1wiJ10+KC4qPyk8L21hcms+YCwgXCJnXCIpO1xuICBjb25zdCBoaXRzOiBzdHJpbmdbXSA9IFtdO1xuICBsZXQgbTogUmVnRXhwRXhlY0FycmF5IHwgbnVsbDtcbiAgd2hpbGUgKChtID0gbWFya1JlZ2V4LmV4ZWMoc3JjKSkgIT09IG51bGwpIHtcbiAgICBjb25zdCB0ZXh0ID0gbVsxXS50cmltKCk7XG4gICAgaWYgKHRleHQgJiYgIWhpdHMuaW5jbHVkZXModGV4dCkpIGhpdHMucHVzaCh0ZXh0KTtcbiAgfVxuXG4gIGlmICghaGl0cy5sZW5ndGgpIHsgbmV3IE5vdGljZShcIk5vIHJlZCBoaWdobGlnaHRzIGZvdW5kLlwiKTsgcmV0dXJuOyB9XG5cbiAgY29uc3Qgc2VjdGlvbiA9IFtcbiAgICBcIj4gWyFzdW1tYXJ5XS0gSGlnaGxpZ2h0c1wiLFxuICAgIC4uLmhpdHMubWFwKGggPT4gYD4gLSAke2h9YCksXG4gICAgXCJcIlxuICBdLmpvaW4oXCJcXG5cIik7XG5cbiAgY29uc3QgbWVyZ2VkID0gaW5zZXJ0QWZ0ZXJZYW1sT3JIMShzcmMsIHNlY3Rpb24pO1xuICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGZpbGUsIG1lcmdlZCk7XG4gIG5ldyBOb3RpY2UoXCJIaWdobGlnaHRzIHNlY3Rpb24gaW5zZXJ0ZWQuXCIpO1xufVxuIiwgImltcG9ydCB7IEFwcCwgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvbW1hbmRPdXRsaW5lRXh0cmFjdG9yKGFwcDogQXBwLCBfc2V0dGluZ3M6IEJpYmxlVG9vbHNTZXR0aW5ncykge1xuICBjb25zdCBmaWxlID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gIGlmICghZmlsZSkgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgZmlyc3QuXCIpOyByZXR1cm47IH1cblxuICBjb25zdCBvcmlnaW5hbCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICBjb25zdCBsaW5lcyA9IG9yaWdpbmFsLnNwbGl0KC9cXHI/XFxuLyk7XG5cbiAgY29uc3Qgb3V0bGluZUxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIEVYQUNUIHJlZ2V4IGFzIFB5dGhvbjogb25lIHNwYWNlIGFmdGVyIHRoZSBoYXNoZXNcbiAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgY29uc3QgbSA9IGxpbmUubWF0Y2goL14oI3syLDZ9KSAoLispLyk7XG4gICAgaWYgKG0pIHtcbiAgICAgIGNvbnN0IGhhc2hlcyA9IG1bMV07XG4gICAgICBsZXQgY29udGVudCA9IG1bMl07XG4gICAgICBjb25zdCBsZXZlbCA9IGhhc2hlcy5sZW5ndGggLSAyOyAvLyAjIyAtPiAwLCAjIyMgLT4gMSwgZXRjLlxuICAgICAgY29uc3QgaW5kZW50ID0gXCJcXHRcIi5yZXBlYXQoTWF0aC5tYXgoMCwgbGV2ZWwgLSAxKSk7XG4gICAgICBpZiAobGV2ZWwgPT09IDApIGNvbnRlbnQgPSBgKioke2NvbnRlbnR9KipgO1xuICAgICAgb3V0bGluZUxpbmVzLnB1c2goYCR7aW5kZW50fSR7Y29udGVudH1gKTtcbiAgICB9XG4gIH1cblxuICBpZiAob3V0bGluZUxpbmVzLmxlbmd0aCA9PT0gMCkge1xuICAgIG5ldyBOb3RpY2UoXCJObyBoZWFkaW5ncyAoIyMuLiMjIyMjIykgZm91bmQuXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIENoZWNrIGxhc3QgNCBsaW5lcyBmb3IgXCJ8TmV4dF1dXCIgb3IgXCJ8UHJldmlvdXNdXVwiXG4gIGxldCBpbnNlcnRJbmRleDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0IGxvb2tiYWNrID0gTWF0aC5taW4oNCwgbGluZXMubGVuZ3RoKTtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbG9va2JhY2s7IGkrKykge1xuICAgIGNvbnN0IGxuID0gbGluZXNbbGluZXMubGVuZ3RoIC0gaV07XG4gICAgaWYgKC9cXHxOZXh0XFxdXFxdfFxcfFByZXZpb3VzXFxdXFxdLy50ZXN0KGxuKSkge1xuICAgICAgaW5zZXJ0SW5kZXggPSBsaW5lcy5sZW5ndGggLSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgb3V0bGluZVRleHQgPSBcIiMjIE91dGxpbmVcXG5cIiArIG91dGxpbmVMaW5lcy5qb2luKFwiXFxuXCIpICsgXCJcXG5cXG5cIjtcblxuICBpZiAoaW5zZXJ0SW5kZXggIT09IG51bGwpIHtcbiAgICAvLyBJbnNlcnQgYmVmb3JlIHRoZSBmb3VuZCBsaW5lLCBwcmVzZXJ2aW5nIHN1cnJvdW5kaW5nIG5ld2xpbmVzXG4gICAgY29uc3QgYmVmb3JlU3RyID0gbGluZXMuc2xpY2UoMCwgaW5zZXJ0SW5kZXgpLmpvaW4oXCJcXG5cIik7XG4gICAgY29uc3QgYWZ0ZXJTdHIgPSBsaW5lcy5zbGljZShpbnNlcnRJbmRleCkuam9pbihcIlxcblwiKTtcbiAgICBjb25zdCBuZXdDb250ZW50ID1cbiAgICAgIChiZWZvcmVTdHIuZW5kc1dpdGgoXCJcXG5cIikgfHwgYmVmb3JlU3RyLmxlbmd0aCA9PT0gMCA/IFwiXCIgOiBcIlxcblwiKSArXG4gICAgICBvdXRsaW5lVGV4dCArXG4gICAgICBhZnRlclN0cjtcbiAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGZpbGUsIGJlZm9yZVN0ciArIG5ld0NvbnRlbnQpO1xuICB9IGVsc2Uge1xuICAgIC8vIEFwcGVuZCB0byBlbmQgKGxpa2UgUHl0aG9uICdhJyBtb2RlKVxuICAgIGNvbnN0IG5ld0NvbnRlbnQgPSBvcmlnaW5hbCArIChvcmlnaW5hbC5lbmRzV2l0aChcIlxcblwiKSA/IFwiXCIgOiBcIlxcblwiKSArIG91dGxpbmVUZXh0O1xuICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgbmV3Q29udGVudCk7XG4gIH1cblxuICBuZXcgTm90aWNlKFwiT3V0bGluZSBhcHBlbmRlZCBzdWNjZXNzZnVsbHkuXCIpO1xufSIsICJpbXBvcnQgeyBBcHAsIE5vdGljZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBmb3JtYXRPdXRsaW5lVGV4dCB9IGZyb20gXCIuLi9saWIvb3V0bGluZS11dGlsc1wiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tbWFuZE91dGxpbmVGb3JtYXR0ZXIoYXBwOiBBcHAsIHNldHRpbmdzOiBCaWJsZVRvb2xzU2V0dGluZ3MpIHtcbiAgY29uc3QgZmlsZSA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICBpZiAoIWZpbGUpIHsgbmV3IE5vdGljZShcIk9wZW4gYSBmaWxlIGZpcnN0LlwiKTsgcmV0dXJuOyB9XG5cbiAgY29uc3Qgc3JjID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG5cbiAgY29uc3Qgb3V0ID0gYXdhaXQgZm9ybWF0T3V0bGluZVRleHQoc3JjLCB7XG4gICAgc3BsaXRJbmxpbmVTdWJwb2ludHM6IHRydWUsICAgLy8gc3BsaXRzIFwiLi4uIHYuIDk6IGEuIC4uLiBiLiAuLi5cIiwgYnV0IE5PVCBvbiBcIi5cIlxuICAgIGZpeEh5cGhlbmF0ZWRCcmVha3M6IHRydWUsICAgIC8vIGZpeGVzIFwiaWxsdXMtIHRyYXRlZFwiIFx1MjE5MiBcImlsbHVzdHJhdGVkXCJcbiAgICBkcm9wUHVyZVBhZ2VOdW1iZXJMaW5lczogdHJ1ZSAvLyBvcHRpb25hbDogZHJvcHMgXCIxNFwiLCBcIjE1XCIsIFwiMTZcIlxuICB9LCBzZXR0aW5ncyk7XG5cbiAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBvdXQpO1xuICBuZXcgTm90aWNlKFwiT3V0bGluZSBmb3JtYXR0ZWQuXCIpO1xufSIsICJpbXBvcnQgeyBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IGxpbmtWZXJzZXNJblRleHQgfSBmcm9tIFwic3JjL2NvbW1hbmRzL3ZlcnNlLWxpbmtzXCI7XG5pbXBvcnQgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwic3JjL3NldHRpbmdzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3V0bGluZUZvcm1hdE9wdGlvbnMge1xuICBzcGxpdElubGluZVN1YnBvaW50cz86IGJvb2xlYW47ICAgICAgIC8vIGRlZmF1bHQ6IHRydWVcbiAgZml4SHlwaGVuYXRlZEJyZWFrcz86IGJvb2xlYW47ICAgICAgICAvLyBkZWZhdWx0OiB0cnVlXG4gIGRyb3BQdXJlUGFnZU51bWJlckxpbmVzPzogYm9vbGVhbjsgICAgLy8gZGVmYXVsdDogZmFsc2VcbiAgb3V0cHV0TGluZVNlcGFyYXRvcj86IHN0cmluZzsgICAgICAgICAvLyBkZWZhdWx0OiBcIlxcblwiXG59XG5cbi8qKiAtLS0tLSBIZWxwZXJzIChkZWxpbWl0ZXItYXdhcmUgKyBQeXRob24gcGFyaXR5KSAtLS0tLSAqL1xuXG5mdW5jdGlvbiByb21hblRvSW50KHJvbWFuOiBzdHJpbmcpOiBudW1iZXIge1xuICBjb25zdCBtYXA6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7IEk6MSwgVjo1LCBYOjEwLCBMOjUwLCBDOjEwMCwgRDo1MDAsIE06MTAwMCB9O1xuICBsZXQgcmVzdWx0ID0gMCwgcHJldiA9IDA7XG4gIGZvciAobGV0IGkgPSByb21hbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGNvbnN0IHZhbCA9IG1hcFtyb21hbltpXV07XG4gICAgaWYgKCF2YWwpIHJldHVybiBOYU47XG4gICAgcmVzdWx0ICs9IHZhbCA8IHByZXYgPyAtdmFsIDogdmFsO1xuICAgIHByZXYgPSB2YWw7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbmNvbnN0IGlzUm9tYW4gPSAoczogc3RyaW5nKSA9PiAvXltJVlhMQ0RNXSskLy50ZXN0KHMpO1xuY29uc3QgaXNBbHBoYVVwcGVyID0gKHM6IHN0cmluZykgPT4gL15bQS1aXSQvLnRlc3Qocyk7XG5cbmZ1bmN0aW9uIGdldE1kUHJlZml4RnJvbUxldmVsKGxldmVsOiBudW1iZXIgfCBcImJ1bGxldFwiKTogc3RyaW5nIHtcbiAgc3dpdGNoIChsZXZlbCkge1xuICAgIGNhc2UgMjogcmV0dXJuIFwiIyNcIjsgICAgICAvLyBSb21hblxuICAgIGNhc2UgMzogcmV0dXJuIFwiIyMjXCI7ICAgICAvLyBBLlxuICAgIGNhc2UgNDogcmV0dXJuIFwiIyMjI1wiOyAgICAvLyAxLlxuICAgIGNhc2UgNTogcmV0dXJuIFwiIyMjIyNcIjsgICAvLyBhLlxuICAgIGNhc2UgNjogcmV0dXJuIFwiIyMjIyMjXCI7ICAvLyAoMSkgb3IgMSlcbiAgICBkZWZhdWx0OiByZXR1cm4gXCIjIyMjIyNcIjsgLy8gYnVsbGV0IGZhbGxiYWNrXG4gIH1cbn1cblxuLyoqIFRva2VuaXplIGEgaGVhZGluZyBtYXJrZXIgYW5kIGl0cyByZXN0LiBDYXB0dXJlcyBkZWxpbWl0ZXI6IFwiLlwiLCBcIilcIiwgb3IgXCIuKVwiICovXG5mdW5jdGlvbiBwYXJzZUhlYWRpbmdTdGFydChzOiBzdHJpbmcpOiB7IHRva2VuOiBzdHJpbmc7IGxhYmVsOiBzdHJpbmc7IHJlc3Q6IHN0cmluZzsgZGVsaW06IHN0cmluZyB8IG51bGwgfSB8IG51bGwge1xuICBjb25zdCBtID1cbiAgICBzLm1hdGNoKC9eXFxzKig/PHJvbWFuPltJVlhMQ0RNXSspKD88ZGVsaW0+XFwuXFwpfFsuKV0pXFxzKyg/PHJlc3Q+LispJC8pIHx8XG4gICAgcy5tYXRjaCgvXlxccyooPzx1cHBlcj5bQS1aXSkoPzxkZWxpbT5cXC5cXCl8Wy4pXSlcXHMrKD88cmVzdD4uKykkLykgICAgICB8fFxuICAgIHMubWF0Y2goL15cXHMqKD88bnVtPlxcZCspKD88ZGVsaW0+XFwuXFwpfFsuKV0pXFxzKyg/PHJlc3Q+LispJC8pICAgICAgICAgIHx8XG4gICAgcy5tYXRjaCgvXlxccypcXChcXHMqKD88cG51bT5cXGQrKVxccypcXClcXHMrKD88cmVzdD4uKykkLykgICAgICAgICAgICAgICAgICB8fFxuICAgIHMubWF0Y2goL15cXHMqXFwoXFxzKig/PHBsb3c+W2Etel0pXFxzKlxcKVxccysoPzxyZXN0Pi4rKSQvKSAgICAgICAgICAgICAgICB8fFxuICAgIHMubWF0Y2goL15cXHMqKD88bG93PlthLXpdKSg/PGRlbGltPlxcLlxcKXxbLildKVxccysoPzxyZXN0Pi4rKSQvKTtcblxuICBpZiAoIW0pIHJldHVybiBudWxsO1xuICBjb25zdCBnID0gKG0gYXMgYW55KS5ncm91cHMgfHwge307XG4gIGxldCBsYWJlbCA9IFwiXCI7XG4gIGxldCBkZWxpbTogc3RyaW5nIHwgbnVsbCA9IGcuZGVsaW0gPz8gbnVsbDtcblxuICBpZiAoZy5yb21hbikgbGFiZWwgPSBnLnJvbWFuO1xuICBlbHNlIGlmIChnLnVwcGVyKSBsYWJlbCA9IGcudXBwZXI7XG4gIGVsc2UgaWYgKGcubnVtKSBsYWJlbCA9IGcubnVtO1xuICBlbHNlIGlmIChnLnBudW0pIHsgbGFiZWwgPSBgKCR7Zy5wbnVtfSlgOyBkZWxpbSA9IFwiKVwiOyB9XG4gIGVsc2UgaWYgKGcucGxvdykgeyBsYWJlbCA9IGAoJHtnLnBsb3d9KWA7IGRlbGltID0gXCIpXCI7IH1cbiAgZWxzZSBpZiAoZy5sb3cpIGxhYmVsID0gZy5sb3c7XG5cbiAgbGV0IHRva2VuID0gXCJcIjtcbiAgaWYgKGcucm9tYW4pIHRva2VuID0gYCR7Zy5yb21hbn0ke2RlbGltID8/IFwiLlwifWA7XG4gIGVsc2UgaWYgKGcudXBwZXIpIHRva2VuID0gYCR7Zy51cHBlcn0ke2RlbGltID8/IFwiLlwifWA7XG4gIGVsc2UgaWYgKGcubnVtKSB0b2tlbiA9IGAke2cubnVtfSR7ZGVsaW0gPz8gXCIuXCJ9YDtcbiAgZWxzZSBpZiAoZy5wbnVtKSB0b2tlbiA9IGAoJHtnLnBudW19KWA7XG4gIGVsc2UgaWYgKGcucGxvdykgdG9rZW4gPSBgKCR7Zy5wbG93fSlgO1xuICBlbHNlIGlmIChnLmxvdykgdG9rZW4gPSBgJHtnLmxvd30ke2RlbGltID8/IFwiLlwifWA7XG5cbiAgcmV0dXJuIHsgdG9rZW4sIGxhYmVsLCByZXN0OiBnLnJlc3QgfHwgXCJcIiwgZGVsaW0gfTtcbn1cblxuLyoqIERlY2lkZSBsZXZlbCB1c2luZyBkZWxpbWl0ZXIsIHBsdXMgUm9tYW4vQWxwaGEgaGV1cmlzdGljcyAobGlrZSBQeXRob24pICovXG5mdW5jdGlvbiBkZWNpZGVMZXZlbChcbiAgbGFiZWw6IHN0cmluZyxcbiAgZGVsaW06IHN0cmluZyB8IG51bGwsXG4gIHByZXZSb206IHN0cmluZyB8IG51bGwsXG4gIHByZXZBbHBoYUlkeDogbnVtYmVyIHwgbnVsbFxuKTogeyBsZXZlbDogbnVtYmVyIHwgXCJidWxsZXRcIjsgbmV4dFJvbTogc3RyaW5nIHwgbnVsbDsgbmV4dEFscGhhSWR4OiBudW1iZXIgfCBudWxsIH0ge1xuICBpZiAoL15cXChcXGQrXFwpJC8udGVzdChsYWJlbCkpIHtcbiAgICByZXR1cm4geyBsZXZlbDogNiwgbmV4dFJvbTogcHJldlJvbSwgbmV4dEFscGhhSWR4OiBwcmV2QWxwaGFJZHggfTsgICAgICAgICAvLyAoMSlcbiAgfVxuICBpZiAoL15cXChbYS16XStcXCkkLy50ZXN0KGxhYmVsKSkge1xuICAgIHJldHVybiB7IGxldmVsOiBcImJ1bGxldFwiLCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IHByZXZBbHBoYUlkeCB9OyAgLy8gKGEpXG4gIH1cblxuICAvLyAxKSB2cyAxLiB2cyAxLilcbiAgaWYgKC9eXFxkKyQvLnRlc3QobGFiZWwpKSB7XG4gICAgaWYgKGRlbGltID09PSBcIilcIikge1xuICAgICAgcmV0dXJuIHsgbGV2ZWw6IDYsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogcHJldkFscGhhSWR4IH07ICAgICAgIC8vIDEpXG4gICAgfVxuICAgIHJldHVybiB7IGxldmVsOiA0LCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IHByZXZBbHBoYUlkeCB9OyAgICAgICAgIC8vIDEuIC8gMS4pXG4gIH1cblxuICAvLyBSb21hbiB2cyBBbHBoYSBhbWJpZ3VpdHkgKGUuZy4sIEkuKVxuICBpZiAoaXNSb21hbihsYWJlbCkpIHtcbiAgICBjb25zdCByb21WYWwgPSByb21hblRvSW50KGxhYmVsKTtcbiAgICBjb25zdCBmaXRzUm9tYW4gPSAhcHJldlJvbSB8fCByb21hblRvSW50KHByZXZSb20pICsgMSA9PT0gcm9tVmFsO1xuXG4gICAgY29uc3QgYWxwaGFWYWwgPSBpc0FscGhhVXBwZXIobGFiZWwpID8gKGxhYmVsLmNoYXJDb2RlQXQoMCkgLSA2NCkgOiBudWxsOyAvLyBBPTFcbiAgICBjb25zdCBmaXRzQWxwaGEgPSBwcmV2QWxwaGFJZHggPT0gbnVsbCA/IHRydWUgOiAoYWxwaGFWYWwgIT0gbnVsbCAmJiBhbHBoYVZhbCA9PT0gcHJldkFscGhhSWR4ICsgMSk7XG5cbiAgICBpZiAoZml0c1JvbWFuICYmICFmaXRzQWxwaGEpIHtcbiAgICAgIHJldHVybiB7IGxldmVsOiAyLCBuZXh0Um9tOiBsYWJlbCwgbmV4dEFscGhhSWR4OiBwcmV2QWxwaGFJZHggfTsgICAgICAgICAvLyAjI1xuICAgIH0gZWxzZSBpZiAoZml0c0FscGhhICYmICFmaXRzUm9tYW4pIHtcbiAgICAgIHJldHVybiB7IGxldmVsOiAzLCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IGFscGhhVmFsID8/IDEgfTsgICAgICAvLyAjIyNcbiAgICB9IGVsc2UgaWYgKGZpdHNSb21hbiAmJiBmaXRzQWxwaGEpIHtcbiAgICAgIHJldHVybiB7IGxldmVsOiAzLCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IGFscGhhVmFsID8/IDEgfTsgICAgICAvLyBwcmVmZXIgYWxwaGEgYXMgZGVlcGVyXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7IGxldmVsOiAyLCBuZXh0Um9tOiBsYWJlbCwgbmV4dEFscGhhSWR4OiBwcmV2QWxwaGFJZHggfTsgICAgICAgICAvLyBkZWZhdWx0IHRvIFJvbWFuXG4gICAgfVxuICB9XG5cbiAgLy8gQSkgdnMgQS5cbiAgaWYgKGlzQWxwaGFVcHBlcihsYWJlbCkpIHtcbiAgICByZXR1cm4geyBsZXZlbDogMywgbmV4dFJvbTogcHJldlJvbSwgbmV4dEFscGhhSWR4OiBsYWJlbC5jaGFyQ29kZUF0KDApIC0gNjQgfTsgLy8gIyMjXG4gIH1cblxuICAvLyBhKSB2cyBhLlxuICBpZiAoL15bYS16XSQvLnRlc3QobGFiZWwpKSB7XG4gICAgaWYgKGRlbGltID09PSBcIilcIikge1xuICAgICAgcmV0dXJuIHsgbGV2ZWw6IFwiYnVsbGV0XCIsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogcHJldkFscGhhSWR4IH07ICAgIC8vIGEpXG4gICAgfVxuICAgIHJldHVybiB7IGxldmVsOiA1LCBuZXh0Um9tOiBwcmV2Um9tLCBuZXh0QWxwaGFJZHg6IHByZXZBbHBoYUlkeCB9OyAgICAgICAgICAgICAvLyBhLlxuICB9XG5cbiAgcmV0dXJuIHsgbGV2ZWw6IFwiYnVsbGV0XCIsIG5leHRSb206IHByZXZSb20sIG5leHRBbHBoYUlkeDogcHJldkFscGhhSWR4IH07XG59XG5cbi8qKiBIeXBoZW4gYnJlYWsgZml4ZXJzICovXG5jb25zdCBIWVBIID0gYC1cXFxcdTAwQURcXFxcdTIwMTBcXFxcdTIwMTFcXFxcdTIwMTJcXFxcdTIwMTNcXFxcdTIwMTRgOyAvLyAtLCBzb2Z0IGh5cGhlbiwgXHUyMDEwLCAtLCBcdTIwMTIsIFx1MjAxMywgXHUyMDE0XG5jb25zdCBJTkxJTkVfSFlQSEVOX0JSRUFLX1JFID0gbmV3IFJlZ0V4cChgKFtBLVphLXpcdTAwQzAtXHUwMEQ2XHUwMEQ4LVx1MDBGNlx1MDBGOC1cdTAwRkZdKVske0hZUEh9XVxcXFxzKyhbYS16XHUwMEUwLVx1MDBGNlx1MDBGOC1cdTAwRkZdKWAsIFwiZ1wiKTtcbmNvbnN0IFRSQUlMSU5HX0hZUEhFTl9BVF9FTkRfUkUgPSBuZXcgUmVnRXhwKGBbQS1aYS16XHUwMEMwLVx1MDBENlx1MDBEOC1cdTAwRjZcdTAwRjgtXHUwMEZGXVske0hZUEh9XVxcXFxzKiRgKTtcbmZ1bmN0aW9uIGZpeElubGluZUh5cGhlbnMoczogc3RyaW5nKTogc3RyaW5nIHsgcmV0dXJuIHMucmVwbGFjZShJTkxJTkVfSFlQSEVOX0JSRUFLX1JFLCBcIiQxJDJcIik7IH1cbmZ1bmN0aW9uIGFwcGVuZFdpdGhXb3JkQnJlYWtGaXgoYnVmOiBzdHJpbmcsIG5leHQ6IHN0cmluZywgZml4OiBib29sZWFuKTogc3RyaW5nIHtcbiAgaWYgKGZpeCkge1xuICAgIGlmIChUUkFJTElOR19IWVBIRU5fQVRfRU5EX1JFLnRlc3QoYnVmKSAmJiAvXlthLXpcdTAwRTAtXHUwMEY2XHUwMEY4LVx1MDBGRl0vLnRlc3QobmV4dCkpIHtcbiAgICAgIHJldHVybiBidWYucmVwbGFjZShuZXcgUmVnRXhwKGBbJHtIWVBIfV1cXFxccyokYCksIFwiXCIpICsgbmV4dDtcbiAgICB9XG4gICAgY29uc3Qgam9pbmVkID0gKGJ1ZiArIFwiIFwiICsgbmV4dCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG4gICAgcmV0dXJuIGZpeElubGluZUh5cGhlbnMoam9pbmVkKTtcbiAgfVxuICByZXR1cm4gKGJ1ZiArIFwiIFwiICsgbmV4dCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG59XG5cbi8qKiAtLS0gU3BsaXQgaGVscGVycyAobm93IHdpdGggXHUyMDE4cHJvdGVjdGVkXHUyMDE5IHZlcnNlICYgUy4gUy4gc3BhbnMpIC0tLSAqL1xuY29uc3QgVE9LRU5fU1RBUlRfU1JDID0gU3RyaW5nLnJhd2AoPzpbSVZYTENETV0rWy4pXXxbQS1aXVsuKV18W2Etel1bLildfFxcZCtbLildfCRiZWdpbjptYXRoOnRleHQkW2EtekEtWjAtOV0rJGVuZDptYXRoOnRleHQkKWA7XG5cbmNvbnN0IEFGVEVSX1BVTkNUX1NQTElUX1JFID0gbmV3IFJlZ0V4cChcbiAgU3RyaW5nLnJhd2AoWzo7IT8pXXxcdTIwMTRcXHMqdlxcLlxccypcXGQrW2Etel0/OilcXHMrKD89YCArIFRPS0VOX1NUQVJUX1NSQyArIFN0cmluZy5yYXdgXFxzKylgLFxuICBcImdpXCJcbik7XG5cbi8vIE9ubHkgcHJvdGVjdCB2ZXJzZSBtYXJrZXJzIGFuZCBcdTIwMUNTLiBTLlx1MjAxRDsgYWxsIG90aGVyIG9uZS1sZXR0ZXIgYWJicmV2cyBjYW4gc3BsaXQuXG5jb25zdCBBRlRFUl9TRU5UX1RPS0VOX1NQTElUX1JFID0gbmV3IFJlZ0V4cChcbiAgU3RyaW5nLnJhd2AoPzwhXFxiW3ZWXVt2Vl1cXC4pKD88IVxcYlt2Vl1cXC4pKD88IVxcYlNcXC5cXHMqUylcXC5cXHMrKD89YCArIFRPS0VOX1NUQVJUX1NSQyArIFN0cmluZy5yYXdgXFxzKylgLFxuICBcImdcIlxuKTtcblxuLy8gUHJlLXByb3RlY3QgXCJ2LiA3XCIsIFwidnYuIDctOVwiIGFuZCBcIlMuIFMuXCIgc28gc3BsaXR0ZXJzIGNhblx1MjAxOXQgY3V0IHRoZW0uXG4vLyBVc2VzIGEgcHJpdmF0ZS11c2Ugc2VudGluZWwgZm9yIHRoZSBwcm90ZWN0ZWQgc3BhY2UuXG5jb25zdCBTRU5USU5FTCA9IFwiXFx1RTAwMFwiO1xuZnVuY3Rpb24gcHJvdGVjdFNwYW5zKHM6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vIHYuIDdbbGV0dGVyXT9cbiAgcyA9IHMucmVwbGFjZSgvXFxiKFt2Vl0pXFwuXFxzKyhcXGQrW2Etel0/KSg/PVteXFxkXXwkKS9nLCAoX20sIHYsIG4pID0+IGAke3Z9LmAgKyBTRU5USU5FTCArIG4pO1xuICAvLyB2di4gNy05IC8gVlYuIDdcdTIwMTM5IGV0Yy5cbiAgcyA9IHMucmVwbGFjZSgvXFxiKFt2Vl0pKFt2Vl0pXFwuXFxzKyhcXGQrW2Etel0/KShcXHMqWy1cdTIwMTNcdTIwMTRdXFxzKlxcZCtbYS16XT8pPy9nLFxuICAgIChfbSwgdjEsIHYyLCBhLCBybmcpID0+IGAke3YxfSR7djJ9LmAgKyBTRU5USU5FTCArIGEgKyAocm5nID8/IFwiXCIpXG4gICk7XG4gIC8vIFMuIFMuXG4gIHMgPSBzLnJlcGxhY2UoL1xcYlNcXC5cXHMqU1xcLi9nLCBtID0+IG0ucmVwbGFjZSgvXFxzKy8sIFNFTlRJTkVMKSk7XG4gIHJldHVybiBzO1xufVxuZnVuY3Rpb24gdW5wcm90ZWN0U3BhbnMoczogc3RyaW5nKTogc3RyaW5nIHsgcmV0dXJuIHMucmVwbGFjZShuZXcgUmVnRXhwKFNFTlRJTkVMLCBcImdcIiksIFwiIFwiKTsgfVxuXG5mdW5jdGlvbiBzcGxpdElubGluZVNlZ21lbnRzKGxpbmU6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgbGV0IHMgPSBwcm90ZWN0U3BhbnMobGluZSk7XG4gIHMgPSBzLnJlcGxhY2UoQUZURVJfUFVOQ1RfU1BMSVRfUkUsIChfbSwgcDE6IHN0cmluZykgPT4gYCR7cDF9XFxuYCk7XG4gIHMgPSBzLnJlcGxhY2UoQUZURVJfU0VOVF9UT0tFTl9TUExJVF9SRSwgXCIuXFxuXCIpO1xuICBzID0gdW5wcm90ZWN0U3BhbnMocyk7XG4gIHJldHVybiBzLnNwbGl0KFwiXFxuXCIpLm1hcCh4ID0+IHgudHJpbSgpKS5maWx0ZXIoQm9vbGVhbik7XG59XG5cbi8qKiAtLS0tLSBNYWluIGZvcm1hdHRlciAoZGVsaW1pdGVyLWF3YXJlLCB2ZXJzZS1zYWZlKSAtLS0tLSAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZvcm1hdE91dGxpbmVUZXh0KFxuICB0ZXh0T3JMaW5lczogc3RyaW5nIHwgc3RyaW5nW10sXG4gIHtcbiAgICBzcGxpdElubGluZVN1YnBvaW50cyA9IHRydWUsXG4gICAgZml4SHlwaGVuYXRlZEJyZWFrcyA9IHRydWUsXG4gICAgb3V0cHV0TGluZVNlcGFyYXRvciA9IFwiXFxuXCIsXG4gICAgZHJvcFB1cmVQYWdlTnVtYmVyTGluZXMgPSBmYWxzZVxuICB9OiBPdXRsaW5lRm9ybWF0T3B0aW9ucyA9IHt9LFxuICBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICAvLyBCdWlsZCBhIHJhdyBzdHJpbmcgc28gd2UgY2FuIHByZS1oYWNrIHRoZSB2ZXJ5IGZpcnN0IFwiIEkuIFwiXG4gIGxldCByYXcgPSBBcnJheS5pc0FycmF5KHRleHRPckxpbmVzKSA/IHRleHRPckxpbmVzLmpvaW4oXCJcXG5cIikgOiB0ZXh0T3JMaW5lcztcblxuICAvLyBIQVJEIFBBVENIOiBJbiB0aGUgZmlyc3QgMjAwMCBjaGFycyBvbmx5LCBpbnNlcnQgYSBuZXdsaW5lIGJlZm9yZSB0aGUgZmlyc3Qgc3RhbmRhbG9uZSBcIiBJLiBcIlxuICAvLyAtIE5vdCBwcmVjZWRlZCBieSBhIGxldHRlci9udW1iZXIgKHNvIG5vdCBcIklJLlwiKVxuICAvLyAtIEZvbGxvd2VkIGJ5IGEgY2FwaXRhbCAoc3RhcnQgb2YgYSBzZW50ZW5jZS9oZWFkaW5nKVxuICAvLyAtIERvIG5vdCB0b3VjaCBcIlMuIFMuXCJcbiAge1xuICAgIGNvbnN0IGhlYWQgPSByYXcuc2xpY2UoMCwgMjAwMCk7XG4gICAgY29uc3QgdGFpbCA9IHJhdy5zbGljZSgyMDAwKTtcblxuICAgIC8vIG9uZS10aW1lIHJlcGxhY2UgKG5vIC9nLylcbiAgICBjb25zdCBoZWFkUGF0Y2hlZCA9IGhlYWQucmVwbGFjZShcbiAgICAgIC8oXnxbXkEtWmEtejAtOV0pSVxcLlxccysoPz1bQS1aXSkoPyFcXHMqU1xcLikvbSxcbiAgICAgIChfbSwgcHJlKSA9PiBgJHtwcmV9XFxuSS4gYFxuICAgICk7XG5cbiAgICByYXcgPSBoZWFkUGF0Y2hlZCArIHRhaWw7XG4gIH1cblxuICAvLyBub3cgcHJvY2VlZCB3aXRoIG5vcm1hbCBsaW5lIHNwbGl0dGluZyB1c2luZyB0aGUgcGF0Y2hlZCB0ZXh0XG4gIGNvbnN0IGxpbmVzID0gcmF3LnNwbGl0KC9cXHI/XFxuLyk7XG5cbiAgLy8gY29uc3QgbGluZXMgPSBBcnJheS5pc0FycmF5KHRleHRPckxpbmVzKSA/IHRleHRPckxpbmVzLnNsaWNlKCkgOiB0ZXh0T3JMaW5lcy5zcGxpdCgvXFxyP1xcbi8pO1xuXG4gIGNvbnN0IG91dDogc3RyaW5nW10gPSBbXTtcbiAgbGV0IGJ1ZiA9IFwiXCI7XG4gIGxldCBwcmV2Um9tYW46IHN0cmluZyB8IG51bGwgPSBudWxsOyAgICAgLy8gcHJldmlvdXMgUm9tYW4gbGFiZWwgKEksIElJLCBcdTIwMjYpXG4gIGxldCBwcmV2QWxwaGFJZHg6IG51bWJlciB8IG51bGwgPSBudWxsOyAgLy8gcHJldmlvdXMgQWxwaGEgaW5kZXggKEE9MSwgQj0yLCBcdTIwMjYpXG5cbiAgY29uc3QgZW1pdEJ1ZmZlciA9IChyYXc6IHN0cmluZykgPT4ge1xuICAgIGxldCBiYXNlID0gcmF3LnRyaW0oKTtcbiAgICBpZiAoIWJhc2UpIHJldHVybjtcblxuICAgIGlmICghc3BsaXRJbmxpbmVTdWJwb2ludHMpIHtcbiAgICAgIG91dC5wdXNoKGJhc2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBwYXJ0cyA9IHNwbGl0SW5saW5lU2VnbWVudHMoYmFzZSlcbiAgICAgIC5tYXAoc2VnID0+IHNlZy5yZXBsYWNlKC9eXFxkezEsM31cXHMrW0EtWl1bQS1aXSsoPzpbIC1dW0EtWl1bQS1aXSspKi8sIFwiXCIpLnRyaW0oKSkgLy8gY29uc2VydmF0aXZlIGhlYWRlciBzY3J1YlxuICAgICAgLmZpbHRlcihCb29sZWFuKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBwYXJ0ID0gcGFydHNbaV07XG4gICAgICBpZiAoZml4SHlwaGVuYXRlZEJyZWFrcykgcGFydCA9IGZpeElubGluZUh5cGhlbnMocGFydCk7XG5cbiAgICAgIGxldCBwYXJzZWQgPSBwYXJzZUhlYWRpbmdTdGFydChwYXJ0KTtcbiAgICAgIGlmICghcGFyc2VkKSB7XG4gICAgICAgIG91dC5wdXNoKHBhcnQpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgeyB0b2tlbiwgbGFiZWwsIHJlc3QsIGRlbGltIH0gPSBwYXJzZWQ7XG4gICAgICBjb25zdCB7IGxldmVsLCBuZXh0Um9tLCBuZXh0QWxwaGFJZHggfSA9IGRlY2lkZUxldmVsKGxhYmVsLnJlcGxhY2UoL1suKV0kLywgXCJcIiksIGRlbGltLCBwcmV2Um9tYW4sIHByZXZBbHBoYUlkeCk7XG4gICAgICBwcmV2Um9tYW4gPSBuZXh0Um9tO1xuICAgICAgcHJldkFscGhhSWR4ID0gbmV4dEFscGhhSWR4O1xuXG4gICAgICBpZiAobGV2ZWwgPT09IFwiYnVsbGV0XCIpIHtcbiAgICAgICAgb3V0LnB1c2goYCR7Z2V0TWRQcmVmaXhGcm9tTGV2ZWwobGV2ZWwpfSAqICR7dG9rZW59ICR7cmVzdH1gLnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcmVmaXggPSBnZXRNZFByZWZpeEZyb21MZXZlbChsZXZlbCk7XG4gICAgICAgIG91dC5wdXNoKGAke3ByZWZpeH0gJHt0b2tlbn0gJHtyZXN0fWAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZm9yIChsZXQgcmF3IG9mIGxpbmVzKSB7XG4gICAgbGV0IGxpbmUgPSByYXcudHJpbSgpO1xuICAgIGlmICghbGluZSkgY29udGludWU7XG4gICAgaWYgKGRyb3BQdXJlUGFnZU51bWJlckxpbmVzICYmIC9eXFxkKyQvLnRlc3QobGluZSkpIGNvbnRpbnVlO1xuICAgIGlmIChmaXhIeXBoZW5hdGVkQnJlYWtzKSBsaW5lID0gZml4SW5saW5lSHlwaGVucyhsaW5lKTtcblxuICAgIC8vIElmIHByZXZpb3VzIGJ1ZmZlciBlbmRzIHdpdGggdmVyc2UgbWFya2VyLCBhIGxlYWRpbmcgbnVtYmVyIGlzIGEgdmVyc2UgXHUyMDE0IG5vdCBhIG5ldyBoZWFkaW5nLlxuICAgIGxldCBwYXJzZWQgPSBwYXJzZUhlYWRpbmdTdGFydChsaW5lKTtcbiAgICBjb25zdCBwcmV2RW5kc1dpdGhWZXJzZSA9IC9cXGJbdlZdezEsMn1cXC5cXHMqJC8udGVzdChidWYpO1xuICAgIGlmIChwYXJzZWQgJiYgL15cXGQrJC8udGVzdChwYXJzZWQubGFiZWwpICYmIHByZXZFbmRzV2l0aFZlcnNlKSB7XG4gICAgICBwYXJzZWQgPSBudWxsOyAvLyB0cmVhdCBhcyBjb250aW51YXRpb25cbiAgICB9XG5cbiAgICBpZiAocGFyc2VkKSB7XG4gICAgICBpZiAoYnVmKSBlbWl0QnVmZmVyKGJ1Zik7XG4gICAgICBidWYgPSBcIlwiO1xuXG4gICAgICBjb25zdCB7IHRva2VuLCBsYWJlbCwgcmVzdCwgZGVsaW0gfSA9IHBhcnNlZDtcbiAgICAgIGNvbnN0IHsgbGV2ZWwsIG5leHRSb20sIG5leHRBbHBoYUlkeCB9ID0gZGVjaWRlTGV2ZWwobGFiZWwsIGRlbGltLCBwcmV2Um9tYW4sIHByZXZBbHBoYUlkeCk7XG4gICAgICBwcmV2Um9tYW4gPSBuZXh0Um9tO1xuICAgICAgcHJldkFscGhhSWR4ID0gbmV4dEFscGhhSWR4O1xuXG4gICAgICBpZiAobGV2ZWwgPT09IFwiYnVsbGV0XCIpIHtcbiAgICAgICAgYnVmID0gYCR7Z2V0TWRQcmVmaXhGcm9tTGV2ZWwobGV2ZWwpfSAqICR7dG9rZW59ICR7cmVzdH1gLnRyaW0oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHByZWZpeCA9IGdldE1kUHJlZml4RnJvbUxldmVsKGxldmVsKTtcbiAgICAgICAgYnVmID0gYCR7cHJlZml4fSAke3Rva2VufSAke3Jlc3R9YC50cmltKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ1ZiA9IGJ1ZiA/IGFwcGVuZFdpdGhXb3JkQnJlYWtGaXgoYnVmLCBsaW5lLCBmaXhIeXBoZW5hdGVkQnJlYWtzKSA6IGxpbmU7XG4gICAgfVxuICB9XG5cbiAgaWYgKGJ1ZikgZW1pdEJ1ZmZlcihidWYpO1xuICBsZXQgcmVzdWx0ID0gb3V0LmpvaW4ob3V0cHV0TGluZVNlcGFyYXRvcik7XG5cbiAgLy8gaW5zZXJ0IHZlcnNlIGxpbmtzIHVzaW5nIGxpbmtWZXJzZXNJblRleHRcbiAgaWYgKHNldHRpbmdzLmF1dG9MaW5rVmVyc2VzKSB7XG4gICAgcmVzdWx0ID0gYXdhaXQgbGlua1ZlcnNlc0luVGV4dChyZXN1bHQsIHNldHRpbmdzKTtcbiAgfVxuXG4gIG5ldyBOb3RpY2UoXCJPdXRsaW5lIGZvcm1hdHRlZFwiICsgKHNldHRpbmdzLmF1dG9MaW5rVmVyc2VzID8gXCIgKyB2ZXJzZXMgbGlua2VkLlwiIDogXCIuXCIpKTtcblxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8vIC8qKlxuLy8gICogU0FGRUxZIHNwbGl0IGlubGluZSBzdWJwb2ludHMgT05MWSB3aGVuIHRoZXkgY29tZSByaWdodCBhZnRlciBhIGNvbG9uL3NlbWljb2xvbixcbi8vICAqIGUuZy4gXHUyMDFDXHUyMDI2IHYuIDk6IGEuIEZ1bGxuZXNzIFx1MjAyNiBiLiBXaGVuIFx1MjAyNiAxLiBTb21ldGhpbmcgXHUyMDI2XHUyMDFEXG4vLyAgKiBUaGlzIHdpbGwgTk9UIHNwbGl0IFx1MjAxOENvbC5cdTIwMTkgLyBcdTIwMThFcGguXHUyMDE5IGJlY2F1c2UgdGhvc2UgYXJlblx1MjAxOXQgcHJlY2VkZWQgYnkgJzonIG9yICc7Jy5cbi8vICAqL1xuLy8gZnVuY3Rpb24gc3BsaXRJbmxpbmVIZWFkaW5nc0FmdGVyQ29sb24odGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbi8vICAgLy8gSW5zZXJ0IGEgbmV3bGluZSBhZnRlciBcIjpcIiBvciBcIjtcIiBCRUZPUkUgYSB0b2tlbiB0aGF0IGxvb2tzIGxpa2UgYSBzdWJwb2ludC5cbi8vICAgLy8gVG9rZW5zIHN1cHBvcnRlZDogIGEuICBiLiAgMS4gIDEwLiAgKGEpICAoMSlcbi8vICAgLy8gS2VlcCB0aGUgcHVuY3R1YXRpb24gKDokMSkgYW5kIGFkZCB0aGUgbmV3bGluZSBpbiAkMi5cbi8vICAgcmV0dXJuIHRleHRcbi8vICAgICAvLyBBZnRlciBcIjpcIiBvciBcIjtcIiB0aGVuIHNwYWNlKHMpIC0+IGJlZm9yZSBbYS16XS4gIChleGNsdWRlIHYuIGJ5IG5vdCBuZWVkZWQ6IHdlIG9ubHkgc3BsaXQgYWZ0ZXIgXCI6XCIgLyBcIjtcIilcbi8vICAgICAucmVwbGFjZSgvKFs6O10pXFxzKyg/PShbYS16XVxcLnxcXChcXHcrXFwpfFxcZCtcXC4pKS9nLCBcIiQxXFxuXCIpXG4vLyAgICAgLy8gQWxzbyBzdXBwb3J0IGVtL2VuIGRhc2ggXCJcdTIwMTRcIiBmb2xsb3dlZCBieSB2ZXJzZSBcInYuXCIgd2l0aCBudW1iZXIsIHRoZW4gY29sb246IFwiXHUyMDE0di4gOTpcIiBhIGNvbW1vbiBwYXR0ZXJuXG4vLyAgICAgLnJlcGxhY2UoLyhcdTIwMTRcXHMqdlxcLlxccypcXGQrW2Etel0/OilcXHMrKD89KFthLXpdXFwufFxcKFxcdytcXCl8XFxkK1xcLikpL2dpLCBcIiQxXFxuXCIpO1xuLy8gfSIsICJpbXBvcnQgeyBBcHAsIE1vZGFsLCBOb3RpY2UsIFNldHRpbmcsIFRGaWxlLCBURm9sZGVyLCBub3JtYWxpemVQYXRoLCByZXF1ZXN0VXJsIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBCaWJsZVRvb2xzU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2V0dGluZ3NcIjtcbmltcG9ydCB7IEJPT0tfQUJCUiB9IGZyb20gXCIuLi9saWIvdHlwZXNcIjtcbmltcG9ydCB7IEJ1aWxkQmlibGVNb2RhbCB9IGZyb20gXCJzcmMvdWkvYnVpbGQtYmlibGUtbW9kYWxcIjtcblxuLy8gLS0tLS0tLS0tLSBUeXBlcyAtLS0tLS0tLS0tXG50eXBlIEJvbGxzQm9va01ldGEgPSB7XG4gIGJvb2tpZDogbnVtYmVyO1xuICBjaHJvbm9yZGVyOiBudW1iZXI7XG4gIG5hbWU6IHN0cmluZztcbiAgY2hhcHRlcnM6IG51bWJlcjtcbn07XG5cbnR5cGUgQm9sbHNWZXJzZSA9IHtcbiAgcGs6IG51bWJlcjtcbiAgdmVyc2U6IG51bWJlcjtcbiAgdGV4dDogc3RyaW5nOyAgIC8vIEhUTUxcbiAgY29tbWVudD86IHN0cmluZztcbn07XG5cbmNvbnN0IEJPTExTID0ge1xuICBMQU5HVUFHRVNfVVJMOiBcImh0dHBzOi8vYm9sbHMubGlmZS9zdGF0aWMvYm9sbHMvYXBwL3ZpZXdzL2xhbmd1YWdlcy5qc29uXCIsXG4gIEdFVF9CT09LUzogKHRyOiBzdHJpbmcpID0+IGBodHRwczovL2JvbGxzLmxpZmUvZ2V0LWJvb2tzLyR7ZW5jb2RlVVJJQ29tcG9uZW50KHRyKX0vYCxcbiAgR0VUX0NIQVBURVI6ICh0cjogc3RyaW5nLCBib29rSWQ6IG51bWJlciwgY2g6IG51bWJlcikgPT5cbiAgICBgaHR0cHM6Ly9ib2xscy5saWZlL2dldC10ZXh0LyR7ZW5jb2RlVVJJQ29tcG9uZW50KHRyKX0vJHtib29rSWR9LyR7Y2h9L2AsXG59O1xuXG4vLyBDYW5vbmljYWwgYm9vayBuYW1lIGJ5IElEICg2Ni1ib29rIFByb3Rlc3RhbnQgYmFzZWxpbmUpXG5jb25zdCBDQU5PTl9FTl9CWV9JRDogUmVjb3JkPG51bWJlciwgc3RyaW5nPiA9IHtcbiAgMTpcIkdlbmVzaXNcIiwyOlwiRXhvZHVzXCIsMzpcIkxldml0aWN1c1wiLDQ6XCJOdW1iZXJzXCIsNTpcIkRldXRlcm9ub215XCIsXG4gIDY6XCJKb3NodWFcIiw3OlwiSnVkZ2VzXCIsODpcIlJ1dGhcIiw5OlwiMSBTYW11ZWxcIiwxMDpcIjIgU2FtdWVsXCIsXG4gIDExOlwiMSBLaW5nc1wiLDEyOlwiMiBLaW5nc1wiLDEzOlwiMSBDaHJvbmljbGVzXCIsMTQ6XCIyIENocm9uaWNsZXNcIiwxNTpcIkV6cmFcIixcbiAgMTY6XCJOZWhlbWlhaFwiLDE3OlwiRXN0aGVyXCIsMTg6XCJKb2JcIiwxOTpcIlBzYWxtc1wiLDIwOlwiUHJvdmVyYnNcIixcbiAgMjE6XCJFY2NsZXNpYXN0ZXNcIiwyMjpcIlNvbmcgb2YgU29uZ3NcIiwyMzpcIklzYWlhaFwiLDI0OlwiSmVyZW1pYWhcIiwyNTpcIkxhbWVudGF0aW9uc1wiLFxuICAyNjpcIkV6ZWtpZWxcIiwyNzpcIkRhbmllbFwiLDI4OlwiSG9zZWFcIiwyOTpcIkpvZWxcIiwzMDpcIkFtb3NcIixcbiAgMzE6XCJPYmFkaWFoXCIsMzI6XCJKb25haFwiLDMzOlwiTWljYWhcIiwzNDpcIk5haHVtXCIsMzU6XCJIYWJha2t1a1wiLFxuICAzNjpcIlplcGhhbmlhaFwiLDM3OlwiSGFnZ2FpXCIsMzg6XCJaZWNoYXJpYWhcIiwzOTpcIk1hbGFjaGlcIixcbiAgNDA6XCJNYXR0aGV3XCIsNDE6XCJNYXJrXCIsNDI6XCJMdWtlXCIsNDM6XCJKb2huXCIsNDQ6XCJBY3RzXCIsNDU6XCJSb21hbnNcIixcbiAgNDY6XCIxIENvcmludGhpYW5zXCIsNDc6XCIyIENvcmludGhpYW5zXCIsNDg6XCJHYWxhdGlhbnNcIiw0OTpcIkVwaGVzaWFuc1wiLFxuICA1MDpcIlBoaWxpcHBpYW5zXCIsNTE6XCJDb2xvc3NpYW5zXCIsNTI6XCIxIFRoZXNzYWxvbmlhbnNcIiw1MzpcIjIgVGhlc3NhbG9uaWFuc1wiLFxuICA1NDpcIjEgVGltb3RoeVwiLDU1OlwiMiBUaW1vdGh5XCIsNTY6XCJUaXR1c1wiLDU3OlwiUGhpbGVtb25cIiw1ODpcIkhlYnJld3NcIixcbiAgNTk6XCJKYW1lc1wiLDYwOlwiMSBQZXRlclwiLDYxOlwiMiBQZXRlclwiLDYyOlwiMSBKb2huXCIsNjM6XCIyIEpvaG5cIixcbiAgNjQ6XCIzIEpvaG5cIiw2NTpcIkp1ZGVcIiw2NjpcIlJldmVsYXRpb25cIixcbn07XG5cbmZ1bmN0aW9uIHNob3J0QWJickZvcihib29rSWQ6IG51bWJlciwgaW5jb21pbmdOYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjYW5vbiA9IENBTk9OX0VOX0JZX0lEW2Jvb2tJZF07XG4gIGlmIChjYW5vbiAmJiBCT09LX0FCQlJbY2Fub25dKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gQk9PS19BQkJSW2Nhbm9uXTtcbiAgICByZXR1cm4gcmVzdWx0ID09PSBcIlMuUy5cIiA/IFwiU29TXCIgOiByZXN1bHQ7XG4gIH1cblxuICBpZiAoQk9PS19BQkJSW2luY29taW5nTmFtZV0pIHtcbiAgICBjb25zdCByZXN1bHQgPSBCT09LX0FCQlJbaW5jb21pbmdOYW1lXTtcbiAgICByZXR1cm4gcmVzdWx0ID09PSBcIlMuUy5cIiA/IFwiU29TXCIgOiByZXN1bHQ7XG4gIH1cbiAgcmV0dXJuIGluY29taW5nTmFtZTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hKc29uPFQ+KHVybDogc3RyaW5nKTogUHJvbWlzZTxUPiB7XG4gIC8vIFByZWZlciBPYnNpZGlhbidzIHJlcXVlc3RVcmwgKG5vIENPUlMgcmVzdHJpY3Rpb25zKVxuICB0cnkge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCByZXF1ZXN0VXJsKHsgdXJsLCBtZXRob2Q6IFwiR0VUXCIgfSk7XG4gICAgaWYgKHJlc3Auc3RhdHVzIDwgMjAwIHx8IHJlc3Auc3RhdHVzID49IDMwMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3Jlc3Auc3RhdHVzfSBSZXF1ZXN0IGZhaWxlZGApO1xuICAgIH1cbiAgICBjb25zdCB0ZXh0ID0gcmVzcC50ZXh0ID8/IFwiXCI7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKHRleHQpIGFzIFQ7XG4gICAgfSBjYXRjaCB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgSlNPTiBmcm9tICR7dXJsfWApO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgLy8gRmFsbGJhY2sgdG8gZmV0Y2ggZm9yIG5vbi1PYnNpZGlhbiBjb250ZXh0cyAoZS5nLiwgdGVzdHMpXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwsIHsgbWV0aG9kOiBcIkdFVFwiIH0pO1xuICAgICAgaWYgKCFyLm9rKSB0aHJvdyBuZXcgRXJyb3IoYCR7ci5zdGF0dXN9ICR7ci5zdGF0dXNUZXh0fWApO1xuICAgICAgcmV0dXJuIChhd2FpdCByLmpzb24oKSkgYXMgVDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBTdXJmYWNlIHRoZSBvcmlnaW5hbCByZXF1ZXN0VXJsIGVycm9yIGlmIGJvdGggZmFpbFxuICAgICAgdGhyb3cgZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIgOiBuZXcgRXJyb3IoU3RyaW5nKGVycikpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaHRtbFRvVGV4dChodG1sOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaHRtbFxuICAgIC5yZXBsYWNlKC88YnJcXHMqXFwvPz4vZ2ksIFwiXFxuXCIpXG4gICAgLnJlcGxhY2UoLzxcXC8/KGl8ZW18c3Ryb25nfGJ8dXxzdXB8c3VifHNwYW58cHxkaXZ8YmxvY2txdW90ZXxzbWFsbHxmb250KVtePl0qPi9naSwgXCJcIilcbiAgICAucmVwbGFjZSgvJm5ic3A7L2csIFwiIFwiKVxuICAgIC5yZXBsYWNlKC8mYW1wOy9nLCBcIiZcIilcbiAgICAucmVwbGFjZSgvJmx0Oy9nLCBcIjxcIilcbiAgICAucmVwbGFjZSgvJmd0Oy9nLCBcIj5cIilcbiAgICAucmVwbGFjZSgvXFxzK1xcbi9nLCBcIlxcblwiKVxuICAgIC5yZXBsYWNlKC9cXG57Myx9L2csIFwiXFxuXFxuXCIpXG4gICAgLnRyaW0oKTtcbn1cblxuLy8gLS0tLS0tLS0tLSBCdWlsZGVyIGNvcmUgLS0tLS0tLS0tLVxudHlwZSBCdWlsZE9wdGlvbnMgPSB7XG4gIHRyYW5zbGF0aW9uQ29kZTogc3RyaW5nO1xuICB0cmFuc2xhdGlvbkZ1bGw6IHN0cmluZztcbiAgaW5jbHVkZVZlcnNpb25JbkZpbGVOYW1lOiBib29sZWFuO1xuICB2ZXJzaW9uQXNTdWJmb2xkZXI6IGJvb2xlYW47XG4gIGF1dG9Gcm9udG1hdHRlcjogYm9vbGVhbjtcbiAgY29uY3VycmVuY3k6IG51bWJlcjtcbiAgYmFzZUZvbGRlcjogc3RyaW5nO1xufTtcbnR5cGUgUHJvZ3Jlc3NGbiA9IChkb25lOiBudW1iZXIsIHRvdGFsOiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZDtcblxuZnVuY3Rpb24gbm93SXNvRGF0ZSgpOiBzdHJpbmcge1xuICBjb25zdCBkID0gbmV3IERhdGUoKTtcbiAgY29uc3QgbW0gPSBTdHJpbmcoZC5nZXRNb250aCgpKzEpLnBhZFN0YXJ0KDIsXCIwXCIpO1xuICBjb25zdCBkZCA9IFN0cmluZyhkLmdldERhdGUoKSkucGFkU3RhcnQoMixcIjBcIik7XG4gIHJldHVybiBgJHtkLmdldEZ1bGxZZWFyKCl9LSR7bW19LSR7ZGR9YDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW5zdXJlRm9sZGVyKGFwcDogQXBwLCBwYXRoOiBzdHJpbmcpOiBQcm9taXNlPFRGb2xkZXI+IHtcbiAgY29uc3QgbnAgPSBub3JtYWxpemVQYXRoKHBhdGgucmVwbGFjZSgvXFwvKyQvLFwiXCIpKTtcbiAgbGV0IGYgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5wKTtcbiAgaWYgKGYgaW5zdGFuY2VvZiBURm9sZGVyKSByZXR1cm4gZjtcbiAgYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihucCk7XG4gIGNvbnN0IGNyZWF0ZWQgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5wKTtcbiAgaWYgKGNyZWF0ZWQgaW5zdGFuY2VvZiBURm9sZGVyKSByZXR1cm4gY3JlYXRlZDtcbiAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gY3JlYXRlIGZvbGRlcjogJHtucH1gKTtcbn1cblxuZnVuY3Rpb24gYnVpbGRCb29rRmlsZW5hbWUoYmFzZVNob3J0OiBzdHJpbmcsIGNvZGU6IHN0cmluZywgaW5jbHVkZVZlcnNpb246IGJvb2xlYW4pOiBzdHJpbmcge1xuICByZXR1cm4gaW5jbHVkZVZlcnNpb24gPyBgJHtiYXNlU2hvcnR9ICgke2NvZGV9KWAgOiBiYXNlU2hvcnQ7XG59XG5cbmZ1bmN0aW9uIGNoYXB0ZXJOYXZMaW5lKGJvb2tTaG9ydDogc3RyaW5nLCBjaGFwdGVyczogbnVtYmVyKTogc3RyaW5nIHtcbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG4gIGZvciAobGV0IGM9MTsgYzw9Y2hhcHRlcnM7IGMrKykge1xuICAgIGNvbnN0IGxhYiA9IChjICUgNSA9PT0gMCB8fCBjID09PSAxIHx8IGMgPT09IGNoYXB0ZXJzKSA/IFN0cmluZyhjKSA6IFwiXHUyMDIyXCI7XG4gICAgcGFydHMucHVzaChgW1ske2Jvb2tTaG9ydH0jXiR7Y318JHtsYWJ9XV1gKTtcbiAgfVxuICByZXR1cm4gYFxcbioqY2guKiogJHtwYXJ0cy5qb2luKFwiIFwiKX1cXG5gO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYnVpbGRCaWJsZUZyb21Cb2xscyhhcHA6IEFwcCwgb3B0czogQnVpbGRPcHRpb25zLCBvblByb2dyZXNzOiBQcm9ncmVzc0ZuKSB7XG4gIGNvbnN0IGJhc2VGb2xkZXIgPSBvcHRzLmJhc2VGb2xkZXIucmVwbGFjZSgvXFwvKyQvLFwiXCIpO1xuICBjb25zdCByb290ID0gYXdhaXQgZW5zdXJlRm9sZGVyKGFwcCwgYmFzZUZvbGRlcik7XG4gIGNvbnN0IHBhcmVudCA9IG9wdHMudmVyc2lvbkFzU3ViZm9sZGVyXG4gICAgPyBhd2FpdCBlbnN1cmVGb2xkZXIoYXBwLCBgJHtiYXNlRm9sZGVyfS8ke29wdHMudHJhbnNsYXRpb25Db2RlfWApXG4gICAgOiByb290O1xuXG4gIGxldCBib29rczogQm9sbHNCb29rTWV0YVtdID0gW107XG4gIHRyeSB7XG4gICAgYm9va3MgPSBhd2FpdCBmZXRjaEpzb248Qm9sbHNCb29rTWV0YVtdPihCT0xMUy5HRVRfQk9PS1Mob3B0cy50cmFuc2xhdGlvbkNvZGUpKTtcbiAgfSBjYXRjaCAoZTphbnkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBsb2FkIGJvb2tzIGZvciAke29wdHMudHJhbnNsYXRpb25Db2RlfTogJHtlPy5tZXNzYWdlID8/IGV9YCk7XG4gIH1cbiAgaWYgKCFib29rcy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihcIk5vIGJvb2tzIHJldHVybmVkIGZyb20gQVBJLlwiKTtcblxuICBjb25zdCB0b3RhbCA9IGJvb2tzLnJlZHVjZSgoYWNjLGIpPT5hY2MgKyAoYi5jaGFwdGVyc3x8MCksIDApO1xuICBsZXQgZG9uZSA9IDA7XG5cbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgYm9vayBvZiBib29rcykge1xuICAgIGNvbnN0IHNob3J0Qm9vayA9IHNob3J0QWJickZvcihib29rLmJvb2tpZCwgYm9vay5uYW1lKTtcbiAgICBjb25zdCBzaG9ydFdpdGhBYmJyID0gYCR7c2hvcnRCb29rfSR7b3B0cy5pbmNsdWRlVmVyc2lvbkluRmlsZU5hbWUgPyBgICgke29wdHMudHJhbnNsYXRpb25Db2RlfSlgIDogXCJcIn1gO1xuICAgIGNvbnN0IGZpbGVCYXNlID0gYnVpbGRCb29rRmlsZW5hbWUoc2hvcnRCb29rLCBvcHRzLnRyYW5zbGF0aW9uQ29kZSwgb3B0cy5pbmNsdWRlVmVyc2lvbkluRmlsZU5hbWUpO1xuICAgIGNvbnN0IHRhcmdldFBhdGggPSBub3JtYWxpemVQYXRoKGAke3BhcmVudC5wYXRofS8ke2ZpbGVCYXNlfS5tZGApO1xuXG4gICAgY29uc3QgaGVhZGVyTGluZXM6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKG9wdHMuYXV0b0Zyb250bWF0dGVyKSB7XG4gICAgICBoZWFkZXJMaW5lcy5wdXNoKFxuICAgICAgICBcIi0tLVwiLFxuICAgICAgICBgdGl0bGU6IFwiJHtzaG9ydFdpdGhBYmJyfVwiYCxcbiAgICAgICAgYGJpYmxlX3RyYW5zbGF0aW9uX2NvZGU6IFwiJHtvcHRzLnRyYW5zbGF0aW9uQ29kZX1cImAsXG4gICAgICAgIGBiaWJsZV90cmFuc2xhdGlvbl9uYW1lOiBcIiR7b3B0cy50cmFuc2xhdGlvbkZ1bGx9XCJgLFxuICAgICAgICBgY3JlYXRlZDogJHtub3dJc29EYXRlKCl9YCxcbiAgICAgICAgXCItLS1cIixcbiAgICAgICAgXCJcIlxuICAgICAgKTtcbiAgICB9XG4gICAgaGVhZGVyTGluZXMucHVzaChgIyAke3Nob3J0V2l0aEFiYnJ9YCk7XG4gICAgaGVhZGVyTGluZXMucHVzaChjaGFwdGVyTmF2TGluZShzaG9ydFdpdGhBYmJyLCBib29rLmNoYXB0ZXJzKSk7XG4gICAgaGVhZGVyTGluZXMucHVzaChcIlwiKTtcblxuICAgIGNvbnN0IGNodW5rczogc3RyaW5nW10gPSBbaGVhZGVyTGluZXMuam9pbihcIlxcblwiKV07XG5cbiAgICBjb25zdCBxdWV1ZSA9IEFycmF5LmZyb20oe2xlbmd0aDogYm9vay5jaGFwdGVyc30sIChfLGkpPT5pKzEpO1xuICAgIGNvbnN0IGNvbmN1cnJlbmN5ID0gTWF0aC5tYXgoMSwgTWF0aC5taW4oOCwgb3B0cy5jb25jdXJyZW5jeSB8fCA0KSk7XG5cbiAgICAvLyBTaW1wbGUgcG9vbFxuICAgIGxldCBuZXh0ID0gMDtcbiAgICBjb25zdCB3b3JrZXJzID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBjb25jdXJyZW5jeX0sICgpID0+IChhc3luYyAoKSA9PiB7XG4gICAgICB3aGlsZSAobmV4dCA8IHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBjaCA9IHF1ZXVlW25leHQrK107XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgb25Qcm9ncmVzcyhkb25lLCB0b3RhbCwgYCR7c2hvcnRXaXRoQWJicn0gJHtjaH0vJHtib29rLmNoYXB0ZXJzfWApO1xuICAgICAgICAgIGNvbnN0IHZlcnNlcyA9IGF3YWl0IGZldGNoSnNvbjxCb2xsc1ZlcnNlW10+KEJPTExTLkdFVF9DSEFQVEVSKG9wdHMudHJhbnNsYXRpb25Db2RlLCBib29rLmJvb2tpZCwgY2gpKTtcbiAgICAgICAgICBjb25zdCBtYXhWID0gTWF0aC5tYXgoMCwgLi4udmVyc2VzLm1hcCh2ID0+IHYudmVyc2UpKTtcblxuICAgICAgICAgIGNvbnN0IHZ2TmF2ID0gQXJyYXkuZnJvbSh7bGVuZ3RoOiBtYXhWfSwgKF8saSk9PmkrMSlcbiAgICAgICAgICAgIC5tYXAodiA9PiBgW1ske3Nob3J0V2l0aEFiYnJ9I14ke2NofS0ke3Z9fCR7diAlIDUgPT09IDAgPyB2IDogXCJcdTIwMjJcIn1dXWApLmpvaW4oXCIgXCIpO1xuXG4gICAgICAgICAgY29uc3QgcHJldkxpbmsgPSBjaCA+IDEgPyBgW1ske3Nob3J0V2l0aEFiYnJ9I14ke2NoLTF9fDwtIFByZXZpb3VzXV1gIDogXCJcdTIxOTBcIjtcbiAgICAgICAgICBjb25zdCBuZXh0TGluayA9IGNoIDwgYm9vay5jaGFwdGVycyA/IGBbWyR7c2hvcnRXaXRoQWJicn0jXiR7Y2grMX18TmV4dCAtPl1dYCA6IFwiXHUyMTkyXCI7XG4gICAgICAgICAgY29uc3QgbWlkID0gYFtbJHtzaG9ydFdpdGhBYmJyfSMke3Nob3J0V2l0aEFiYnJ9fCR7c2hvcnRCb29rfSAke2NofSBvZiAke2Jvb2suY2hhcHRlcnN9XV1gO1xuXG4gICAgICAgICAgY29uc3QgdG9wID0gW1xuICAgICAgICAgICAgXCItLS1cIixcbiAgICAgICAgICAgIGAke3ByZXZMaW5rfSB8ICR7bWlkfSB8ICR7bmV4dExpbmt9IHwgKip2di4qKiAke3Z2TmF2fSBeJHtjaH1gLFxuICAgICAgICAgICAgXCJcXG4tLS1cXG5cIixcbiAgICAgICAgICAgIFwiXCJcbiAgICAgICAgICBdLmpvaW4oXCJcXG5cIik7XG5cbiAgICAgICAgICBjb25zdCB2ZXJzZXNNZCA9IHZlcnNlcy5tYXAodiA9PiB7XG4gICAgICAgICAgICBjb25zdCBwbGFpbiA9IGh0bWxUb1RleHQodi50ZXh0KS50cmltKCk7XG4gICAgICAgICAgICByZXR1cm4gYCoqJHtzaG9ydFdpdGhBYmJyfSAke2NofToke3YudmVyc2V9KiogLSAke3BsYWlufSBeJHtjaH0tJHt2LnZlcnNlfWA7XG4gICAgICAgICAgfSkuam9pbihcIlxcblxcblwiKTtcblxuICAgICAgICAgIGNodW5rc1tjaF0gPSBgJHt0b3B9JHt2ZXJzZXNNZH1cXG5cXG5gO1xuICAgICAgICB9IGNhdGNoIChlOmFueSkge1xuICAgICAgICAgIGVycm9ycy5wdXNoKGBbJHtvcHRzLnRyYW5zbGF0aW9uQ29kZX1dICR7c2hvcnRCb29rfSBjaC4ke2NofTogJHtlPy5tZXNzYWdlID8/IGV9YCk7XG4gICAgICAgICAgY2h1bmtzW2NoXSA9IGAtLS1cXG4oJHtzaG9ydEJvb2t9ICR7Y2h9KSBcdTIwMTQgZmFpbGVkIHRvIGRvd25sb2FkLlxcbl4ke2NofVxcbi0tLVxcblxcbmA7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgZG9uZSsrOyBvblByb2dyZXNzKGRvbmUsIHRvdGFsLCBgJHtzaG9ydEJvb2t9ICR7TWF0aC5taW4oY2gsIGJvb2suY2hhcHRlcnMpfS8ke2Jvb2suY2hhcHRlcnN9YCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KSgpKTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbCh3b3JrZXJzKTtcblxuICAgIGNvbnN0IGJvb2tDb250ZW50ID0gY2h1bmtzLmpvaW4oXCJcIik7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHRhcmdldFBhdGgpO1xuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGV4aXN0aW5nLCBib29rQ29udGVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IGFwcC52YXVsdC5jcmVhdGUodGFyZ2V0UGF0aCwgYm9va0NvbnRlbnQpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChlcnJvcnMubGVuZ3RoKSB7XG4gICAgLy8gY29uc3QgbG9nRm9sZGVyID0gYXdhaXQgZW5zdXJlRm9sZGVyKGFwcCwgYCR7YmFzZUZvbGRlcn0vX2xvZ3NgKTtcbiAgICAvLyBjb25zdCBsb2dQYXRoID0gbm9ybWFsaXplUGF0aChgJHtsb2dGb2xkZXIucGF0aH0vYmlibGUtYnVpbGQtJHtvcHRzLnRyYW5zbGF0aW9uQ29kZX0tJHtEYXRlLm5vdygpfS5tZGApO1xuICAgIC8vIGNvbnN0IGJvZHkgPSBbXG4gICAgLy8gICBgIyBCdWlsZCBMb2cgXHUyMDE0ICR7b3B0cy50cmFuc2xhdGlvbkNvZGV9YCxcbiAgICAvLyAgIGBEYXRlOiAke25ldyBEYXRlKCkudG9TdHJpbmcoKX1gLFxuICAgIC8vICAgXCJcIixcbiAgICAvLyAgIC4uLmVycm9ycy5tYXAoZSA9PiBgLSAke2V9YClcbiAgICAvLyBdLmpvaW4oXCJcXG5cIik7XG4gICAgLy8gYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZShsb2dQYXRoLCBib2R5KTtcbiAgICAvLyBuZXcgTm90aWNlKGBGaW5pc2hlZCB3aXRoICR7ZXJyb3JzLmxlbmd0aH0gZXJyb3IocykuIFNlZTogJHtsb2dQYXRofWApO1xuICAgIG5ldyBOb3RpY2UoYEZpbmlzaGVkIHdpdGggJHtlcnJvcnMubGVuZ3RofSBlcnJvcihzKS5gKTtcbiAgfSBlbHNlIHtcbiAgICBuZXcgTm90aWNlKFwiRmluaXNoZWQgd2l0aG91dCBlcnJvcnMuXCIpO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0gQ29tbWFuZCBlbnRyeSAtLS0tLS0tLS0tXG5leHBvcnQgZnVuY3Rpb24gY29tbWFuZEJ1aWxkQmlibGVGcm9tQm9sbHMoYXBwOiBBcHAsIF9zZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gIG5ldyBCdWlsZEJpYmxlTW9kYWwoYXBwLCBfc2V0dGluZ3MpLm9wZW4oKTtcbn0iLCAiZXhwb3J0IGNvbnN0IEJPT0tfQUJCUjogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgXCJHZW5lc2lzXCI6IFwiR2VuXCIsXG4gIFwiRXhvZHVzXCI6IFwiRXhvXCIsXG4gIFwiTGV2aXRpY3VzXCI6IFwiTGV2XCIsXG4gIFwiTnVtYmVyc1wiOiBcIk51bVwiLFxuICBcIkRldXRlcm9ub215XCI6IFwiRGV1dFwiLFxuICBcIkpvc2h1YVwiOiBcIkpvc2hcIixcbiAgXCJKdWRnZXNcIjogXCJKdWRnXCIsXG4gIFwiUnV0aFwiOiBcIlJ1dGhcIixcbiAgXCIxIFNhbXVlbFwiOiBcIjEgU2FtXCIsXG4gIFwiRmlyc3QgU2FtdWVsXCI6IFwiMSBTYW1cIixcbiAgXCIyIFNhbXVlbFwiOiBcIjIgU2FtXCIsXG4gIFwiU2Vjb25kIFNhbXVlbFwiOiBcIjIgU2FtXCIsXG4gIFwiMSBLaW5nc1wiOiBcIjEgS2luZ3NcIixcbiAgXCJGaXJzdCBLaW5nc1wiOiBcIjEgS2luZ3NcIixcbiAgXCIyIEtpbmdzXCI6IFwiMiBLaW5nc1wiLFxuICBcIlNlY29uZCBLaW5nc1wiOiBcIjIgS2luZ3NcIixcbiAgXCIxIENocm9uaWNsZXNcIjogXCIxIENocm9uXCIsXG4gIFwiRmlyc3QgQ2hyb25pY2xlc1wiOiBcIjEgQ2hyb25cIixcbiAgXCIyIENocm9uaWNsZXNcIjogXCIyIENocm9uXCIsXG4gIFwiU2Vjb25kIENocm9uaWNsZXNcIjogXCIyIENocm9uXCIsXG4gIFwiRXpyYVwiOiBcIkV6cmFcIixcbiAgXCJOZWhlbWlhaFwiOiBcIk5laFwiLFxuICBcIkVzdGhlclwiOiBcIkVzdGhcIixcbiAgXCJKb2JcIjogXCJKb2JcIixcbiAgXCJQc2FsbXNcIjogXCJQc2FcIixcbiAgXCJQc2FsbVwiOiBcIlBzYVwiLFxuICBcIlByb3ZlcmJzXCI6IFwiUHJvdlwiLFxuICBcIkVjY2xlc2lhc3Rlc1wiOiBcIkVjY2xcIixcbiAgXCJTb25nIG9mIFNvbmdzXCI6IFwiUy5TLlwiLFxuICBcIlNvbmcgb2YgU29sb21vblwiOiBcIlMuUy5cIixcbiAgXCJJc2FpYWhcIjogXCJJc2FcIixcbiAgXCJKZXJlbWlhaFwiOiBcIkplclwiLFxuICBcIkxhbWVudGF0aW9uc1wiOiBcIkxhbVwiLFxuICBcIkV6ZWtpZWxcIjogXCJFemVrXCIsXG4gIFwiRGFuaWVsXCI6IFwiRGFuXCIsXG4gIFwiSG9zZWFcIjogXCJIb3NlYVwiLFxuICBcIkpvZWxcIjogXCJKb2VsXCIsXG4gIFwiQW1vc1wiOiBcIkFtb3NcIixcbiAgXCJPYmFkaWFoXCI6IFwiT2JhZFwiLFxuICBcIkpvbmFoXCI6IFwiSm9uYWhcIixcbiAgXCJNaWNhaFwiOiBcIk1pY2FoXCIsXG4gIFwiTmFodW1cIjogXCJOYWh1bVwiLFxuICBcIkhhYmFra3VrXCI6IFwiSGFiXCIsXG4gIFwiWmVwaGFuaWFoXCI6IFwiWmVwaFwiLFxuICBcIkhhZ2dhaVwiOiBcIkhhZ1wiLFxuICBcIlplY2hhcmlhaFwiOiBcIlplY2hcIixcbiAgXCJNYWxhY2hpXCI6IFwiTWFsXCIsXG4gIFwiTWF0dGhld1wiOiBcIk1hdHRcIixcbiAgXCJNYXJrXCI6IFwiTWFya1wiLFxuICBcIkx1a2VcIjogXCJMdWtlXCIsXG4gIFwiSm9oblwiOiBcIkpvaG5cIixcbiAgXCJBY3RzXCI6IFwiQWN0c1wiLFxuICBcIlJvbWFuc1wiOiBcIlJvbVwiLFxuICBcIjEgQ29yaW50aGlhbnNcIjogXCIxIENvclwiLFxuICBcIkZpcnN0IENvcmludGhpYW5zXCI6IFwiMSBDb3JcIixcbiAgXCIyIENvcmludGhpYW5zXCI6IFwiMiBDb3JcIixcbiAgXCJTZWNvbmQgQ29yaW50aGlhbnNcIjogXCIyIENvclwiLFxuICBcIkdhbGF0aWFuc1wiOiBcIkdhbFwiLFxuICBcIkVwaGVzaWFuc1wiOiBcIkVwaFwiLFxuICBcIlBoaWxpcHBpYW5zXCI6IFwiUGhpbFwiLFxuICBcIkNvbG9zc2lhbnNcIjogXCJDb2xcIixcbiAgXCIxIFRoZXNzYWxvbmlhbnNcIjogXCIxIFRoZXNcIixcbiAgXCJGaXJzdCBUaGVzc2Fsb25pYW5zXCI6IFwiMSBUaGVzXCIsXG4gIFwiMiBUaGVzc2Fsb25pYW5zXCI6IFwiMiBUaGVzXCIsXG4gIFwiU2Vjb25kIFRoZXNzYWxvbmlhbnNcIjogXCIyIFRoZXNcIixcbiAgXCIxIFRpbW90aHlcIjogXCIxIFRpbVwiLFxuICBcIkZpcnN0IFRpbW90aHlcIjogXCIxIFRpbVwiLFxuICBcIjIgVGltb3RoeVwiOiBcIjIgVGltXCIsXG4gIFwiU2Vjb25kIFRpbW90aHlcIjogXCIyIFRpbVwiLFxuICBcIlRpdHVzXCI6IFwiVGl0dXNcIixcbiAgXCJQaGlsZW1vblwiOiBcIlBoaWxlbVwiLFxuICBcIkhlYnJld3NcIjogXCJIZWJcIixcbiAgXCJKYW1lc1wiOiBcIkphbWVzXCIsXG4gIFwiMSBQZXRlclwiOiBcIjEgUGV0XCIsXG4gIFwiRmlyc3QgUGV0ZXJcIjogXCIxIFBldFwiLFxuICBcIjIgUGV0ZXJcIjogXCIyIFBldFwiLFxuICBcIlNlY29uZCBQZXRlclwiOiBcIjIgUGV0XCIsXG4gIFwiMSBKb2huXCI6IFwiMSBKb2huXCIsXG4gIFwiRmlyc3QgSm9oblwiOiBcIjEgSm9oblwiLFxuICBcIjIgSm9oblwiOiBcIjIgSm9oblwiLFxuICBcIlNlY29uZCBKb2huXCI6IFwiMiBKb2huXCIsXG4gIFwiMyBKb2huXCI6IFwiMyBKb2huXCIsXG4gIFwiVGhpcmQgSm9oblwiOiBcIjMgSm9oblwiLFxuICBcIkp1ZGVcIjogXCJKdWRlXCIsXG4gIFwiUmV2ZWxhdGlvblwiOiBcIlJldlwiXG59O1xuXG5leHBvcnQgY29uc3QgQUxMX0JPT0tfVE9LRU5TID0gKCgpID0+IHtcbiAgY29uc3Qgc2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKEJPT0tfQUJCUikpIHsgc2V0LmFkZChrKTsgc2V0LmFkZCh2KTsgfVxuICByZXR1cm4gWy4uLnNldF0uc29ydCgoYSwgYikgPT4gYi5sZW5ndGggLSBhLmxlbmd0aCk7XG59KSgpO1xuXG5cbi8qKiBQeXRob24tcGFyaXR5IG1hcHBpbmcgZm9yIEJpYmxlSHViIGludGVybGluZWFyIHNsdWdzICovXG5leHBvcnQgY29uc3QgQklCTEVIVUJfSU5URVJMSU5FQVI6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIFwiR2VuXCI6IFwiZ2VuZXNpc1wiLFxuICBcIkV4b1wiOiBcImV4b2R1c1wiLFxuICBcIkxldlwiOiBcImxldml0aWN1c1wiLFxuICBcIk51bVwiOiBcIm51bWJlcnNcIixcbiAgXCJEZXV0XCI6IFwiZGV1dGVyb25vbXlcIixcbiAgXCJKb3NoXCI6IFwiam9zaHVhXCIsXG4gIFwiSnVkZ1wiOiBcImp1ZGdlc1wiLFxuICBcIlJ1dGhcIjogXCJydXRoXCIsXG4gIFwiMSBTYW1cIjogXCIxX3NhbXVlbFwiLFxuICBcIjIgU2FtXCI6IFwiMl9zYW11ZWxcIixcbiAgXCIxIEtpbmdzXCI6IFwiMV9raW5nc1wiLFxuICBcIjIgS2luZ3NcIjogXCIyX2tpbmdzXCIsXG4gIFwiMSBDaHJvblwiOiBcIjFfY2hyb25pY2xlc1wiLFxuICBcIjIgQ2hyb25cIjogXCIyX2Nocm9uaWNsZXNcIixcbiAgXCJFenJhXCI6IFwiZXpyYVwiLFxuICBcIk5laFwiOiBcIm5laGVtaWFoXCIsXG4gIFwiRXN0aFwiOiBcImVzdGhlclwiLFxuICBcIkpvYlwiOiBcImpvYlwiLFxuICBcIlBzYVwiOiBcInBzYWxtc1wiLFxuICBcIlByb3ZcIjogXCJwcm92ZXJic1wiLFxuICBcIkVjY2xcIjogXCJlY2NsZXNpYXN0ZXNcIixcbiAgXCJTb1NcIjogXCJzb25nc1wiLCAvLyBTb25nIG9mIFNvbG9tb24gLyBTb25nIG9mIFNvbmdzXG4gIFwiUy5TLlwiOiBcInNvbmdzXCIsIC8vIFNvbmcgb2YgU29sb21vbiAvIFNvbmcgb2YgU29uZ3NcbiAgXCJJc2FcIjogXCJpc2FpYWhcIixcbiAgXCJKZXJcIjogXCJqZXJlbWlhaFwiLFxuICBcIkxhbVwiOiBcImxhbWVudGF0aW9uc1wiLFxuICBcIkV6ZWtcIjogXCJlemVraWVsXCIsXG4gIFwiRGFuXCI6IFwiZGFuaWVsXCIsXG4gIFwiSG9zZWFcIjogXCJob3NlYVwiLFxuICBcIkpvZWxcIjogXCJqb2VsXCIsXG4gIFwiQW1vc1wiOiBcImFtb3NcIixcbiAgXCJPYmFkXCI6IFwib2JhZGlhaFwiLFxuICBcIkpvbmFoXCI6IFwiam9uYWhcIixcbiAgXCJNaWNhaFwiOiBcIm1pY2FoXCIsXG4gIFwiTmFoXCI6IFwibmFodW1cIixcbiAgXCJIYWJcIjogXCJoYWJha2t1a1wiLFxuICBcIlplcFwiOiBcInplcGhhbmlhaFwiLFxuICBcIlplcGhcIjogXCJ6ZXBoYW5pYWhcIixcbiAgXCJIYWdcIjogXCJoYWdnYWlcIixcbiAgXCJaZWNoXCI6IFwiemVjaGFyaWFoXCIsXG4gIFwiTWFsXCI6IFwibWFsYWNoaVwiLFxuICBcIk1hdHRcIjogXCJtYXR0aGV3XCIsXG4gIFwiTWFya1wiOiBcIm1hcmtcIixcbiAgXCJMdWtlXCI6IFwibHVrZVwiLFxuICBcIkpvaG5cIjogXCJqb2huXCIsXG4gIFwiQWN0c1wiOiBcImFjdHNcIixcbiAgXCJSb21cIjogXCJyb21hbnNcIixcbiAgXCIxIENvclwiOiBcIjFfY29yaW50aGlhbnNcIixcbiAgXCIyIENvclwiOiBcIjJfY29yaW50aGlhbnNcIixcbiAgXCJHYWxcIjogXCJnYWxhdGlhbnNcIixcbiAgXCJFcGhcIjogXCJlcGhlc2lhbnNcIixcbiAgXCJQaGlsXCI6IFwicGhpbGlwcGlhbnNcIixcbiAgXCJDb2xcIjogXCJjb2xvc3NpYW5zXCIsXG4gIFwiMSBUaGVzXCI6IFwiMV90aGVzc2Fsb25pYW5zXCIsXG4gIFwiMiBUaGVzXCI6IFwiMl90aGVzc2Fsb25pYW5zXCIsXG4gIFwiMSBUaW1cIjogXCIxX3RpbW90aHlcIixcbiAgXCIyIFRpbVwiOiBcIjJfdGltb3RoeVwiLFxuICBcIlRpdHVzXCI6IFwidGl0dXNcIixcbiAgXCJQaGlsZW1cIjogXCJwaGlsZW1vblwiLFxuICBcIkhlYlwiOiBcImhlYnJld3NcIixcbiAgXCJKYW1lc1wiOiBcImphbWVzXCIsXG4gIFwiMSBQZXRcIjogXCIxX3BldGVyXCIsXG4gIFwiMiBQZXRcIjogXCIyX3BldGVyXCIsXG4gIFwiMSBKb2huXCI6IFwiMV9qb2huXCIsXG4gIFwiMiBKb2huXCI6IFwiMl9qb2huXCIsXG4gIFwiMyBKb2huXCI6IFwiM19qb2huXCIsXG4gIFwiSnVkZVwiOiBcImp1ZGVcIixcbiAgXCJSZXZcIjogXCJyZXZlbGF0aW9uXCJcbn0iLCAiaW1wb3J0IHsgQXBwLCBTZXR0aW5nLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIHsgQmlibGVUb29sc1NldHRpbmdzIH0gZnJvbSBcIi4uL3NldHRpbmdzXCI7XG5pbXBvcnQgeyBCYXNlQm9sbHNNb2RhbCB9IGZyb20gXCIuL2JvbGxzLWJhc2UtbW9kYWxcIjtcbmltcG9ydCB7IGJ1aWxkQmlibGVGcm9tQm9sbHMgfSBmcm9tIFwiLi4vY29tbWFuZHMvZ2VuZXJhdGUtYmlibGVcIjtcblxuZXhwb3J0IGNsYXNzIEJ1aWxkQmlibGVNb2RhbCBleHRlbmRzIEJhc2VCb2xsc01vZGFsIHtcbiAgcHJpdmF0ZSBpbmNsdWRlVmVyc2lvbkluRmlsZU5hbWU6IGJvb2xlYW47XG4gIHByaXZhdGUgdmVyc2lvbkFzU3ViZm9sZGVyOiBib29sZWFuO1xuICBwcml2YXRlIGF1dG9Gcm9udG1hdHRlcjogYm9vbGVhbjtcbiAgcHJpdmF0ZSBjb25jdXJyZW5jeSA9IDQ7XG5cbiAgLy8gcHJvZ3Jlc3NcbiAgcHJpdmF0ZSBwcm9ncmVzc0VsITogSFRNTFByb2dyZXNzRWxlbWVudDtcbiAgcHJpdmF0ZSBzdGF0dXNFbCE6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIHN0YXJ0QnRuITogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHByaXZhdGUgd29ya2luZyA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBzZXR0aW5nczogQmlibGVUb29sc1NldHRpbmdzKSB7XG4gICAgc3VwZXIoYXBwLCBzZXR0aW5ncywge1xuICAgICAgbGFuZ3VhZ2VMYWJlbDogc2V0dGluZ3MuYmlibGVEZWZhdWx0TGFuZ3VhZ2UgPz8gbnVsbCxcbiAgICAgIHZlcnNpb25TaG9ydDogIHNldHRpbmdzLmJpYmxlRGVmYXVsdFZlcnNpb24gID8/IHVuZGVmaW5lZCxcbiAgICB9KTtcblxuICAgIHRoaXMuaW5jbHVkZVZlcnNpb25JbkZpbGVOYW1lID0gc2V0dGluZ3MuYmlibGVJbmNsdWRlVmVyc2lvbkluRmlsZW5hbWUgPz8gdHJ1ZTtcbiAgICAvLyBGSVg6IHVzZSB0aGUgZGVkaWNhdGVkIHNldHRpbmcgZm9yIHN1YmZvbGRlciAod2FzIHBvaW50aW5nIHRvIHRoZSBmaWxlbmFtZSBmbGFnKVxuICAgIHRoaXMudmVyc2lvbkFzU3ViZm9sZGVyICAgICAgID0gKHNldHRpbmdzIGFzIGFueSkuYmlibGVWZXJzaW9uQXNTdWJmb2xkZXIgPz8gdHJ1ZTtcbiAgICB0aGlzLmF1dG9Gcm9udG1hdHRlciA9IHNldHRpbmdzLmJpYmxlQWRkRnJvbnRtYXR0ZXIgPz8gZmFsc2U7XG4gICAgdGhpcy5kaXNhbGxvd0RlZmF1bHQgPSB0cnVlO1xuICB9XG5cbiAgcHJvdGVjdGVkIHJlbmRlckV4dHJhT3B0aW9ucyhjb250ZW50RWw6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJBcHBlbmQgdmVyc2lvbiB0byBmaWxlIG5hbWVcIilcbiAgICAgIC5zZXREZXNjKGBcIkpvaG4gKEtKVilcIiB2cyBcIkpvaG5cImApXG4gICAgICAuYWRkVG9nZ2xlKHQgPT5cbiAgICAgICAgdC5zZXRWYWx1ZSh0aGlzLmluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZSlcbiAgICAgICAgIC5vbkNoYW5nZSh2ID0+ICh0aGlzLmluY2x1ZGVWZXJzaW9uSW5GaWxlTmFtZSA9IHYpKVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5zZXROYW1lKFwiUGxhY2UgYm9va3MgdW5kZXIgdmVyc2lvbiBzdWJmb2xkZXJcIilcbiAgICAgIC5zZXREZXNjKGBcIkJpYmxlL0tKVi9Kb2huIChLSlYpXCIgdnMgXCJCaWJsZS9Kb2huXCJgKVxuICAgICAgLmFkZFRvZ2dsZSh0ID0+XG4gICAgICAgIHQuc2V0VmFsdWUodGhpcy52ZXJzaW9uQXNTdWJmb2xkZXIpXG4gICAgICAgICAub25DaGFuZ2UodiA9PiAodGhpcy52ZXJzaW9uQXNTdWJmb2xkZXIgPSB2KSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIkF1dG8tYWRkIGZyb250bWF0dGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkluc2VydCBZQU1MIHdpdGggdGl0bGUvdmVyc2lvbi9jcmVhdGVkIGludG8gZWFjaCBib29rIGZpbGVcIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PlxuICAgICAgICB0LnNldFZhbHVlKHRoaXMuYXV0b0Zyb250bWF0dGVyKVxuICAgICAgICAgLm9uQ2hhbmdlKHYgPT4gKHRoaXMuYXV0b0Zyb250bWF0dGVyID0gdikpXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJDb25jdXJyZW5jeVwiKVxuICAgICAgLnNldERlc2MoXCJIb3cgbWFueSBjaGFwdGVycyB0byBkb3dubG9hZCBpbiBwYXJhbGxlbFwiKVxuICAgICAgLmFkZFNsaWRlcihzID0+XG4gICAgICAgIHMuc2V0TGltaXRzKDEsIDgsIDEpXG4gICAgICAgICAuc2V0VmFsdWUodGhpcy5jb25jdXJyZW5jeSlcbiAgICAgICAgIC5vbkNoYW5nZSh2ID0+ICh0aGlzLmNvbmN1cnJlbmN5ID0gdikpXG4gICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKVxuICAgICAgKTtcbiAgfVxuXG4gIHByb3RlY3RlZCByZW5kZXJGb290ZXIoY29udGVudEVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IHByb2dXcmFwID0gY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJib2xscy1wcm9ncmVzc1wiIH0pO1xuICAgIHRoaXMucHJvZ3Jlc3NFbCA9IHByb2dXcmFwLmNyZWF0ZUVsKFwicHJvZ3Jlc3NcIik7XG4gICAgdGhpcy5wcm9ncmVzc0VsLm1heCA9IDEwMDtcbiAgICB0aGlzLnByb2dyZXNzRWwudmFsdWUgPSAwO1xuXG4gICAgdGhpcy5zdGF0dXNFbCA9IHByb2dXcmFwLmNyZWF0ZURpdih7IHRleHQ6IFwiSWRsZS5cIiB9KTtcblxuICAgIGNvbnN0IGJ0bnMgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcImJvbGxzLWFjdGlvbnNcIiB9KTtcbiAgICB0aGlzLnN0YXJ0QnRuID0gYnRucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiU3RhcnRcIiB9KTtcbiAgICB0aGlzLnN0YXJ0QnRuLm9uY2xpY2sgPSAoKSA9PiB0aGlzLnN0YXJ0KCk7XG5cbiAgICBjb25zdCBjYW5jZWxCdG4gPSBidG5zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJDbG9zZVwiIH0pO1xuICAgIGNhbmNlbEJ0bi5vbmNsaWNrID0gKCkgPT4gdGhpcy5jbG9zZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzdGFydCgpIHtcbiAgICBpZiAodGhpcy53b3JraW5nKSByZXR1cm47XG4gICAgdGhpcy53b3JraW5nID0gdHJ1ZTtcbiAgICB0aGlzLnN0YXJ0QnRuLmRpc2FibGVkID0gdHJ1ZTtcblxuICAgIGNvbnN0IGNvZGUgPSAodGhpcy50cmFuc2xhdGlvbkNvZGUgPz8gXCJcIikudHJpbSgpO1xuICAgIGlmICghY29kZSkge1xuICAgICAgbmV3IE5vdGljZShcIkNob29zZSBhIHRyYW5zbGF0aW9uIGNvZGUuXCIpO1xuICAgICAgdGhpcy53b3JraW5nID0gZmFsc2U7XG4gICAgICB0aGlzLnN0YXJ0QnRuLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGJ1aWxkQmlibGVGcm9tQm9sbHMoXG4gICAgICAgIHRoaXMuYXBwLFxuICAgICAgICB7XG4gICAgICAgICAgdHJhbnNsYXRpb25Db2RlOiBjb2RlLFxuICAgICAgICAgIHRyYW5zbGF0aW9uRnVsbDogdGhpcy50cmFuc2xhdGlvbkZ1bGwgfHwgY29kZSxcbiAgICAgICAgICBpbmNsdWRlVmVyc2lvbkluRmlsZU5hbWU6IHRoaXMuaW5jbHVkZVZlcnNpb25JbkZpbGVOYW1lLFxuICAgICAgICAgIHZlcnNpb25Bc1N1YmZvbGRlcjogdGhpcy52ZXJzaW9uQXNTdWJmb2xkZXIsXG4gICAgICAgICAgYXV0b0Zyb250bWF0dGVyOiB0aGlzLmF1dG9Gcm9udG1hdHRlcixcbiAgICAgICAgICBjb25jdXJyZW5jeTogdGhpcy5jb25jdXJyZW5jeSxcbiAgICAgICAgICBiYXNlRm9sZGVyOiB0aGlzLnNldHRpbmdzLmJhc2VGb2xkZXJCaWJsZSB8fCBcIkJpYmxlXCIsXG4gICAgICAgIH0sXG4gICAgICAgIChkb25lOiBudW1iZXIsIHRvdGFsOiBudW1iZXIsIG1zZzogYW55KSA9PiB7XG4gICAgICAgICAgdGhpcy5wcm9ncmVzc0VsLm1heCA9IHRvdGFsIHx8IDE7XG4gICAgICAgICAgdGhpcy5wcm9ncmVzc0VsLnZhbHVlID0gTWF0aC5taW4oZG9uZSwgdG90YWwgfHwgMSk7XG4gICAgICAgICAgdGhpcy5zdGF0dXNFbC5zZXRUZXh0KGAke2RvbmV9LyR7dG90YWx9IFx1MDBCNyAke21zZ31gKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMuc3RhdHVzRWwuc2V0VGV4dChcIkRvbmUuXCIpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgIG5ldyBOb3RpY2UoYEJpYmxlIGJ1aWxkIGZhaWxlZDogJHtlPy5tZXNzYWdlID8/IGV9YCk7XG4gICAgICB0aGlzLnN0YXR1c0VsLnNldFRleHQoXCJGYWlsZWQuXCIpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLndvcmtpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMuc3RhcnRCdG4uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cbn0iLCAiLy8gc3JjL2NvbW1hbmRzL2JpYmxlaHViTGlua3MudHNcbmltcG9ydCB7IEFwcCwgTm90aWNlLCBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgc3BsaXRGcm9udG1hdHRlciB9IGZyb20gXCIuLi9saWIvbWQtdXRpbHNcIjtcbmltcG9ydCB7XG4gIGFkZEJpYmxlSHViTGlua3NJblRleHQsXG4gIGRldGVjdEJvb2tTaG9ydEZvckZpbGUsXG4gIHJlbW92ZUJpYmxlSHViTGlua3NJblRleHQsXG59IGZyb20gXCIuLi9saWIvYmlibGVodWJcIjtcbmltcG9ydCB7IEJpYmxlSHViTGlua3NNb2RhbCwgU2NvcGVDaG9pY2UgfSBmcm9tIFwic3JjL3VpL2JpYmxlLWh1Yi1saW5rcy1tb2RhbFwiO1xuXG5hc3luYyBmdW5jdGlvbiBwcm9jZXNzRmlsZUFkZChhcHA6IEFwcCwgZmlsZTogVEZpbGUpOiBQcm9taXNlPHsgY2hhbmdlZDogYm9vbGVhbjsgYWRkZWQ6IG51bWJlcjsgcmVhc29uPzogc3RyaW5nIH0+IHtcbiAgY29uc3QgYm9va1Nob3J0ID0gYXdhaXQgZGV0ZWN0Qm9va1Nob3J0Rm9yRmlsZShhcHAsIGZpbGUpO1xuICBpZiAoIWJvb2tTaG9ydCkgcmV0dXJuIHsgY2hhbmdlZDogZmFsc2UsIGFkZGVkOiAwLCByZWFzb246IFwidW5rbm93biBib29rXCIgfTtcbiAgY29uc3QgcmF3ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIGNvbnN0IHsgeWFtbCwgYm9keSB9ID0gc3BsaXRGcm9udG1hdHRlcihyYXcpO1xuICBjb25zdCB7IHRleHQsIGFkZGVkIH0gPSBhZGRCaWJsZUh1YkxpbmtzSW5UZXh0KGJvZHksIGJvb2tTaG9ydCk7XG4gIGlmIChhZGRlZCA+IDApIHtcbiAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGZpbGUsICh5YW1sID8/IFwiXCIpICsgdGV4dCk7XG4gICAgcmV0dXJuIHsgY2hhbmdlZDogdHJ1ZSwgYWRkZWQgfTtcbiAgfVxuICByZXR1cm4geyBjaGFuZ2VkOiBmYWxzZSwgYWRkZWQ6IDAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc0ZpbGVSZW1vdmUoYXBwOiBBcHAsIGZpbGU6IFRGaWxlKTogUHJvbWlzZTx7IGNoYW5nZWQ6IGJvb2xlYW47IHJlbW92ZWQ6IG51bWJlciB9PiB7XG4gIGNvbnN0IHJhdyA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICBjb25zdCB7IHlhbWwsIGJvZHkgfSA9IHNwbGl0RnJvbnRtYXR0ZXIocmF3KTtcbiAgY29uc3QgeyB0ZXh0LCByZW1vdmVkIH0gPSByZW1vdmVCaWJsZUh1YkxpbmtzSW5UZXh0KGJvZHkpO1xuICBpZiAocmVtb3ZlZCA+IDApIHtcbiAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGZpbGUsICh5YW1sID8/IFwiXCIpICsgdGV4dCk7XG4gICAgcmV0dXJuIHsgY2hhbmdlZDogdHJ1ZSwgcmVtb3ZlZCB9O1xuICB9XG4gIHJldHVybiB7IGNoYW5nZWQ6IGZhbHNlLCByZW1vdmVkOiAwIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21tYW5kQWRkQmlibGVIdWJMaW5rcyhhcHA6IEFwcCkge1xuICBuZXcgQmlibGVIdWJMaW5rc01vZGFsKGFwcCwgYXN5bmMgKHNjb3BlOiBTY29wZUNob2ljZSkgPT4ge1xuICAgIGlmIChzY29wZS5raW5kID09PSBcImN1cnJlbnRcIikge1xuICAgICAgY29uc3QgZiA9IGFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgaWYgKCFmKSB7IG5ldyBOb3RpY2UoXCJPcGVuIGEgTWFya2Rvd24gZmlsZSBmaXJzdC5cIik7IHJldHVybjsgfVxuICAgICAgaWYgKGYuZXh0ZW5zaW9uICE9PSBcIm1kXCIpIHsgbmV3IE5vdGljZShcIkN1cnJlbnQgZmlsZSBpcyBub3QgYSBNYXJrZG93biBmaWxlLlwiKTsgcmV0dXJuOyB9XG4gICAgICBjb25zdCByID0gYXdhaXQgcHJvY2Vzc0ZpbGVBZGQoYXBwLCBmKTtcbiAgICAgIGlmIChyLmNoYW5nZWQpIG5ldyBOb3RpY2UoYEFkZGVkICR7ci5hZGRlZH0gQmlibGVIdWIgbGluayhzKS5gKTtcbiAgICAgIGVsc2UgbmV3IE5vdGljZShyLnJlYXNvbiA/IGBObyBsaW5rcyBhZGRlZCAoJHtyLnJlYXNvbn0pLmAgOiBcIk5vIGxpbmVzIHdpdGggXmNoYXB0ZXItdmVyc2UgYW5jaG9ycyBmb3VuZC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gZm9sZGVyIHNjb3BlIChub24tcmVjdXJzaXZlLCAubWQgb25seSlcbiAgICBjb25zdCBmb2xkZXIgPSBzY29wZS5mb2xkZXI7XG4gICAgbGV0IGFkZGVkVG90YWwgPSAwLCBjaGFuZ2VkRmlsZXMgPSAwLCBza2lwcGVkID0gMDtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGZvbGRlci5jaGlsZHJlbikge1xuICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgVEZpbGUgJiYgY2hpbGQuZXh0ZW5zaW9uID09PSBcIm1kXCIpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCByID0gYXdhaXQgcHJvY2Vzc0ZpbGVBZGQoYXBwLCBjaGlsZCk7XG4gICAgICAgICAgaWYgKHIuY2hhbmdlZCkgeyBjaGFuZ2VkRmlsZXMrKzsgYWRkZWRUb3RhbCArPSByLmFkZGVkOyB9XG4gICAgICAgICAgZWxzZSBpZiAoci5yZWFzb24gPT09IFwidW5rbm93biBib29rXCIpIHtcbiAgICAgICAgICAgIHNraXBwZWQrKztcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW0JpYmxlSHViXSBTa2lwcGVkICR7Y2hpbGQucGF0aH06IHVua25vd24gYm9vay5gKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJbQmlibGVIdWJdIEZhaWxlZCBvblwiLCBjaGlsZC5wYXRoLCBlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBuZXcgTm90aWNlKGBCaWJsZUh1YiBsaW5rczogKyR7YWRkZWRUb3RhbH0gaW4gJHtjaGFuZ2VkRmlsZXN9IGZpbGUocykuIFNraXBwZWQgKHVua25vd24gYm9vayk6ICR7c2tpcHBlZH0uYCk7XG4gIH0pLm9wZW4oKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbW1hbmRSZW1vdmVCaWJsZUh1YkxpbmtzKGFwcDogQXBwKSB7XG4gIG5ldyBCaWJsZUh1YkxpbmtzTW9kYWwoYXBwLCBhc3luYyAoc2NvcGU6IFNjb3BlQ2hvaWNlKSA9PiB7XG4gICAgaWYgKHNjb3BlLmtpbmQgPT09IFwiY3VycmVudFwiKSB7XG4gICAgICBjb25zdCBmID0gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICBpZiAoIWYpIHsgbmV3IE5vdGljZShcIk9wZW4gYSBNYXJrZG93biBmaWxlIGZpcnN0LlwiKTsgcmV0dXJuOyB9XG4gICAgICBpZiAoZi5leHRlbnNpb24gIT09IFwibWRcIikgeyBuZXcgTm90aWNlKFwiQ3VycmVudCBmaWxlIGlzIG5vdCBhIE1hcmtkb3duIGZpbGUuXCIpOyByZXR1cm47IH1cbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBwcm9jZXNzRmlsZVJlbW92ZShhcHAsIGYpO1xuICAgICAgaWYgKHIuY2hhbmdlZCkgbmV3IE5vdGljZShgUmVtb3ZlZCAke3IucmVtb3ZlZH0gQmlibGVIdWIgbGluayhzKS5gKTtcbiAgICAgIGVsc2UgbmV3IE5vdGljZShcIk5vIEJpYmxlSHViIGxpbmtzIHRvIHJlbW92ZS5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZm9sZGVyID0gc2NvcGUuZm9sZGVyO1xuICAgIGxldCByZW1vdmVkVG90YWwgPSAwLCBjaGFuZ2VkRmlsZXMgPSAwO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgZm9sZGVyLmNoaWxkcmVuKSB7XG4gICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBURmlsZSAmJiBjaGlsZC5leHRlbnNpb24gPT09IFwibWRcIikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHIgPSBhd2FpdCBwcm9jZXNzRmlsZVJlbW92ZShhcHAsIGNoaWxkKTtcbiAgICAgICAgICBpZiAoci5jaGFuZ2VkKSB7IGNoYW5nZWRGaWxlcysrOyByZW1vdmVkVG90YWwgKz0gci5yZW1vdmVkOyB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJbQmlibGVIdWJdIFJlbW92ZSBmYWlsZWQgb25cIiwgY2hpbGQucGF0aCwgZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgbmV3IE5vdGljZShgQmlibGVIdWIgbGlua3MgcmVtb3ZlZDogLSR7cmVtb3ZlZFRvdGFsfSBpbiAke2NoYW5nZWRGaWxlc30gZmlsZShzKS5gKTtcbiAgfSkub3BlbigpO1xufSIsICIvLyBzcmMvbGliL2JpYmxlaHViLnRzXG5pbXBvcnQgeyBBcHAsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBzcGxpdEZyb250bWF0dGVyIH0gZnJvbSBcIi4vbWQtdXRpbHNcIjtcbmltcG9ydCB7IEJJQkxFSFVCX0lOVEVSTElORUFSLCBCT09LX0FCQlIgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5cbi8qKiBOb3JtYWxpemUgYSByYXcgXCJib29rIHRpdGxlXCIgdG8gb3VyIHNob3J0IGtleSAodXNlcyBCT09LX0FCQlIpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVRvU2hvcnRCb29rKHJhdzogc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCk6IHN0cmluZyB8IG51bGwge1xuICBpZiAoIXJhdykgcmV0dXJuIG51bGw7XG4gIGxldCBzID0gU3RyaW5nKHJhdykudHJpbSgpO1xuICAvLyBzdHJpcCBbWy4uLl1dIGFuZCBwYXJlbnRoZXNlcyBsaWtlIFwiSm9obiAoS0pWKVwiXG4gIHMgPSBzLnJlcGxhY2UoL15cXFtcXFt8XFxdXFxdJC9nLCBcIlwiKS5yZXBsYWNlKC9cXHMqXFwoW14pXStcXClcXHMqJC8sIFwiXCIpO1xuICAvLyB0cnkgZGlyZWN0IHNob3J0IGtleVxuICBpZiAoQklCTEVIVUJfSU5URVJMSU5FQVJbc10pIHJldHVybiBzO1xuICAvLyB0cnkgbG9uZyAtPiBzaG9ydCB2aWEgQk9PS19BQkJSXG4gIGlmICgoQk9PS19BQkJSIGFzIGFueSlbc10pIHJldHVybiAoQk9PS19BQkJSIGFzIGFueSlbc107XG4gIC8vIHNvbWV0aW1lcyBwZW9wbGUgdXNlIGFiYnJldmlhdGlvbnMgd2l0aCB0cmFpbGluZyBkb3RcbiAgcyA9IHMucmVwbGFjZSgvXFwuJC8sIFwiXCIpO1xuICBpZiAoKEJPT0tfQUJCUiBhcyBhbnkpW3NdKSByZXR1cm4gKEJPT0tfQUJCUiBhcyBhbnkpW3NdO1xuICBpZiAoQklCTEVIVUJfSU5URVJMSU5FQVJbc10pIHJldHVybiBzO1xuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFRyeSB0byBkZXJpdmUgYm9vayBzaG9ydCBjb2RlIGZvciBhIGZpbGUgKGZyb250bWF0dGVyID4gZmlsZW5hbWUpLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRldGVjdEJvb2tTaG9ydEZvckZpbGUoYXBwOiBBcHAsIGZpbGU6IFRGaWxlKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcbiAgY29uc3QgeyB5YW1sIH0gPSBzcGxpdEZyb250bWF0dGVyKGNvbnRlbnQpO1xuICAvLyAxKSBmcm9udG1hdHRlciBrZXlzIHRoYXQgbWlnaHQgY2FycnkgdGhlIGJvb2sgbmFtZVxuICBpZiAoeWFtbCkge1xuICAgIGNvbnN0IG0gPSB5YW1sLm1hdGNoKC8oPzpefFxcbilib29rW18tXT90aXRsZTpcXHMqKFwiPykoW15cXG5cIl0rKVxcMS9pKTtcbiAgICBpZiAobSkge1xuICAgICAgY29uc3QgZnJvbUZtID0gbm9ybWFsaXplVG9TaG9ydEJvb2sobVsyXSk7XG4gICAgICBpZiAoZnJvbUZtKSByZXR1cm4gZnJvbUZtO1xuICAgIH1cbiAgICBjb25zdCB0ID0geWFtbC5tYXRjaCgvKD86XnxcXG4pdGl0bGU6XFxzKihcIj8pKFteXFxuXCJdKylcXDEvaSk7XG4gICAgaWYgKHQpIHtcbiAgICAgIGNvbnN0IGZyb21UaXRsZSA9IG5vcm1hbGl6ZVRvU2hvcnRCb29rKHRbMl0pO1xuICAgICAgaWYgKGZyb21UaXRsZSkgcmV0dXJuIGZyb21UaXRsZTtcbiAgICB9XG4gIH1cbiAgLy8gMikgZmFsbCBiYWNrIHRvIGJhc2VuYW1lXG4gIGNvbnN0IGJhc2UgPSBmaWxlLmJhc2VuYW1lO1xuICBjb25zdCBmcm9tTmFtZSA9IG5vcm1hbGl6ZVRvU2hvcnRCb29rKGJhc2UpO1xuICBpZiAoZnJvbU5hbWUpIHJldHVybiBmcm9tTmFtZTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBBZGQgYSBCaWJsZUh1YiBpbnRlcmxpbmVhciBsaW5rIGJlZm9yZSBhIHRyYWlsaW5nIGFuY2hvciBcIiBeTlwiIG9yIFwiIF5OLU1cIi4gKFB5dGhvbiBwYXJpdHkpICovXG5leHBvcnQgZnVuY3Rpb24gYWRkQmlibGVIdWJMaW5rVG9MaW5lKGxpbmU6IHN0cmluZywgYm9va1Nob3J0OiBzdHJpbmcpOiBzdHJpbmcge1xuICAvLyBJZiB0aGVyZSdzIGFscmVhZHkgYSBiaWJsZWh1YiBpbnRlcmxpbmVhciBsaW5rIHJpZ2h0IGJlZm9yZSB0aGUgYW5jaG9yLCBza2lwXG4gIGNvbnN0IGFscmVhZHkgPSAvXFxbXFxzKlxcXVxcKGh0dHBzPzpcXC9cXC9iaWJsZWh1YlxcLmNvbVxcL2ludGVybGluZWFyXFwvW15cXCldK1xcKVxccytcXF5cXGQrKD86LVxcZCspP1xccyokLy50ZXN0KGxpbmUpO1xuICBpZiAoYWxyZWFkeSkgcmV0dXJuIGxpbmU7XG5cbiAgY29uc3QgbSA9IGxpbmUubWF0Y2goLyhcXHNcXF4oXFxkKyg/Oi1cXGQrKT8pKSQvKTtcbiAgaWYgKCFtKSByZXR1cm4gbGluZTtcblxuICBjb25zdCBjaGFwdGVyVmVyc2UgPSBtWzJdO1xuICBjb25zdCBzbHVnID0gQklCTEVIVUJfSU5URVJMSU5FQVJbYm9va1Nob3J0XTtcbiAgaWYgKCFzbHVnKSByZXR1cm4gbGluZTtcblxuICBjb25zdCB1cmwgPSBgaHR0cHM6Ly9iaWJsZWh1Yi5jb20vaW50ZXJsaW5lYXIvJHtzbHVnfS8ke2NoYXB0ZXJWZXJzZX0uaHRtYDtcbiAgLy8gSW5zZXJ0IFwiIFtdKHVybClcIiBiZWZvcmUgdGhlIGFuY2hvciAocHJlc2VydmUgdGhlIG9yaWdpbmFsIGFuY2hvciB0YWlsIGluIGEgYmFja3JlZilcbiAgcmV0dXJuIGxpbmUucmVwbGFjZSgvKFxcc1xcXihcXGQrKSgtXFxkKyk/KSQvLCBgIFsgXSgke3VybH0pJDFgKTtcbn1cblxuLyoqIFJlbW92ZSBhbnkgXCIgW10oaHR0cHM6Ly9iaWJsZWh1Yi5jb20vaW50ZXJsaW5lYXIvLi4uKVwiIGltbWVkaWF0ZWx5IGJlZm9yZSBhIHRyYWlsaW5nIGFuY2hvci4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVCaWJsZUh1YkxpbmtGcm9tTGluZShsaW5lOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gbGluZS5yZXBsYWNlKFxuICAgIC9cXHNcXFtcXHMqXFxdXFwoaHR0cHM/OlxcL1xcL2JpYmxlaHViXFwuY29tXFwvaW50ZXJsaW5lYXJcXC9bXlxcKV0rXFwpXFxzKyg/PVxcXlxcZCsoPzotXFxkKyk/XFxzKiQpLyxcbiAgICBcIiBcIlxuICApO1xufVxuXG4vKiogUHJvY2VzcyBlbnRpcmUgdGV4dCBib2R5IChZQU1MIG11c3QgYmUgc3RyaXBwZWQgb3V0IGJlZm9yZWhhbmQpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZEJpYmxlSHViTGlua3NJblRleHQoYm9keTogc3RyaW5nLCBib29rU2hvcnQ6IHN0cmluZyk6IHsgdGV4dDogc3RyaW5nOyBhZGRlZDogbnVtYmVyIH0ge1xuICBjb25zdCBsaW5lcyA9IGJvZHkuc3BsaXQoL1xccj9cXG4vKTtcbiAgbGV0IGFkZGVkID0gMDtcbiAgY29uc3Qgb3V0ID0gbGluZXMubWFwKChsbikgPT4ge1xuICAgIGNvbnN0IG5leHQgPSBhZGRCaWJsZUh1YkxpbmtUb0xpbmUobG4sIGJvb2tTaG9ydCk7XG4gICAgaWYgKG5leHQgIT09IGxuKSBhZGRlZCsrO1xuICAgIHJldHVybiBuZXh0O1xuICB9KTtcbiAgcmV0dXJuIHsgdGV4dDogb3V0LmpvaW4oXCJcXG5cIiksIGFkZGVkIH07XG59XG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlQmlibGVIdWJMaW5rc0luVGV4dChib2R5OiBzdHJpbmcpOiB7IHRleHQ6IHN0cmluZzsgcmVtb3ZlZDogbnVtYmVyIH0ge1xuICBjb25zdCBsaW5lcyA9IGJvZHkuc3BsaXQoL1xccj9cXG4vKTtcbiAgbGV0IHJlbW92ZWQgPSAwO1xuICBjb25zdCBvdXQgPSBsaW5lcy5tYXAoKGxuKSA9PiB7XG4gICAgY29uc3QgbmV4dCA9IHJlbW92ZUJpYmxlSHViTGlua0Zyb21MaW5lKGxuKTtcbiAgICBpZiAobmV4dCAhPT0gbG4pIHJlbW92ZWQrKztcbiAgICByZXR1cm4gbmV4dDtcbiAgfSk7XG4gIHJldHVybiB7IHRleHQ6IG91dC5qb2luKFwiXFxuXCIpLCByZW1vdmVkIH07XG59IiwgIi8vIHNyYy91aS9CaWJsZUh1YkxpbmtzTW9kYWwudHNcbmltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgU2V0dGluZywgVEZpbGUsIFRGb2xkZXIgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEZvbGRlclN1Z2dlc3RNb2RhbCB9IGZyb20gXCIuL2ZvbGRlci1zdWdnZXN0LW1vZGFsXCI7XG5cbmV4cG9ydCB0eXBlIFNjb3BlQ2hvaWNlID0geyBraW5kOiBcImN1cnJlbnRcIiB9IHwgeyBraW5kOiBcImZvbGRlclwiOyBmb2xkZXI6IFRGb2xkZXIgfTtcblxuZXhwb3J0IGNsYXNzIEJpYmxlSHViTGlua3NNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcHJpdmF0ZSBhcHBSZWY6IEFwcDtcbiAgcHJpdmF0ZSBvblJ1bjogKHNjb3BlOiBTY29wZUNob2ljZSkgPT4gdm9pZDtcblxuICBwcml2YXRlIF9zY29wZTogXCJjdXJyZW50XCIgfCBcImZvbGRlclwiID0gXCJjdXJyZW50XCI7XG4gIHByaXZhdGUgY2hvc2VuRm9sZGVyOiBURm9sZGVyIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIG9uUnVuOiAoc2NvcGU6IFNjb3BlQ2hvaWNlKSA9PiB2b2lkKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLmFwcFJlZiA9IGFwcDtcbiAgICB0aGlzLm9uUnVuID0gb25SdW47XG4gIH1cblxuICBvbk9wZW4oKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJCaWJsZUh1YiBpbnRlcmxpbmVhciBsaW5rc1wiKTtcblxuICAgIC8vIFNjb3BlIHJhZGlvXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJTY29wZVwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkZCkgPT4ge1xuICAgICAgICBkZC5hZGRPcHRpb24oXCJjdXJyZW50XCIsIFwiQ3VycmVudCBmaWxlXCIpO1xuICAgICAgICBkZC5hZGRPcHRpb24oXCJmb2xkZXJcIiwgXCJQaWNrIGZvbGRlclx1MjAyNlwiKTtcbiAgICAgICAgZGQuc2V0VmFsdWUodGhpcy5fc2NvcGUpO1xuICAgICAgICBkZC5vbkNoYW5nZSgodikgPT4ge1xuICAgICAgICAgIHRoaXMuX3Njb3BlID0gdiBhcyBcImN1cnJlbnRcIiB8IFwiZm9sZGVyXCI7XG4gICAgICAgICAgZm9sZGVyUm93LnNldHRpbmdFbC50b2dnbGUodGhpcy5fc2NvcGUgPT09IFwiZm9sZGVyXCIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgLy8gRm9sZGVyIHBpY2tlciByb3dcbiAgICBjb25zdCBmb2xkZXJSb3cgPSBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIkZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJDaG9vc2UgYSBmb2xkZXIgdG8gcHJvY2VzcyBhbGwgLm1kIGZpbGVzIGluc2lkZSAobm9uLXJlY3Vyc2l2ZSkuXCIpXG4gICAgICAuYWRkQnV0dG9uKChiKSA9PlxuICAgICAgICBiXG4gICAgICAgICAgLnNldEJ1dHRvblRleHQodGhpcy5jaG9zZW5Gb2xkZXIgPyB0aGlzLmNob3NlbkZvbGRlci5wYXRoIDogXCJQaWNrXHUyMDI2XCIpXG4gICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgICAgbmV3IEZvbGRlclN1Z2dlc3RNb2RhbCh0aGlzLmFwcFJlZiwgKGYpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5jaG9zZW5Gb2xkZXIgPSBmO1xuICAgICAgICAgICAgICBiLnNldEJ1dHRvblRleHQoZi5wYXRoKTtcbiAgICAgICAgICAgIH0pLm9wZW4oKTtcbiAgICAgICAgICB9KVxuICAgICAgKTtcbiAgICBmb2xkZXJSb3cuc2V0dGluZ0VsLnRvZ2dsZSh0aGlzLl9zY29wZSA9PT0gXCJmb2xkZXJcIik7XG5cbiAgICAvLyBSdW4vQ2FuY2VsXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLmFkZEJ1dHRvbigoYikgPT5cbiAgICAgICAgYi5zZXRDdGEoKS5zZXRCdXR0b25UZXh0KFwiUnVuXCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLl9zY29wZSA9PT0gXCJmb2xkZXJcIikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmNob3NlbkZvbGRlcikge1xuICAgICAgICAgICAgICBuZXcgTm90aWNlKFwiUGljayBhIGZvbGRlciBmaXJzdC5cIik7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMub25SdW4oeyBraW5kOiBcImZvbGRlclwiLCBmb2xkZXI6IHRoaXMuY2hvc2VuRm9sZGVyIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB0aGlzLm9uUnVuKHsga2luZDogXCJjdXJyZW50XCIgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLmFkZEV4dHJhQnV0dG9uKChiKSA9PiBiLnNldEljb24oXCJ4XCIpLnNldFRvb2x0aXAoXCJDYW5jZWxcIikub25DbGljaygoKSA9PiB0aGlzLmNsb3NlKCkpKTtcbiAgfVxufSIsICIvLyBzcmMvdWkvRm9sZGVyU3VnZ2VzdE1vZGFsLnRzXG5pbXBvcnQgeyBBcHAsIEZ1enp5U3VnZ2VzdE1vZGFsLCBURm9sZGVyLCBWYXVsdCB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgY2xhc3MgRm9sZGVyU3VnZ2VzdE1vZGFsIGV4dGVuZHMgRnV6enlTdWdnZXN0TW9kYWw8VEZvbGRlcj4ge1xuICBwcml2YXRlIGFwcFJlZjogQXBwO1xuICBwcml2YXRlIG9uQ2hvb3NlOiAoZm9sZGVyOiBURm9sZGVyKSA9PiB2b2lkO1xuICBwcml2YXRlIGZvbGRlcnM6IFRGb2xkZXJbXTtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgb25DaG9vc2U6IChmb2xkZXI6IFRGb2xkZXIpID0+IHZvaWQpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuYXBwUmVmID0gYXBwO1xuICAgIHRoaXMub25DaG9vc2UgPSBvbkNob29zZTtcbiAgICB0aGlzLmZvbGRlcnMgPSBGb2xkZXJTdWdnZXN0TW9kYWwuY29sbGVjdEZvbGRlcnMoYXBwKTtcbiAgICB0aGlzLnNldFBsYWNlaG9sZGVyKFwiVHlwZSB0byBmaWx0ZXIgZm9sZGVyc1x1MjAyNlwiKTtcbiAgfVxuXG4gIGdldEl0ZW1zKCk6IFRGb2xkZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMuZm9sZGVycztcbiAgfVxuICBnZXRJdGVtVGV4dChpdGVtOiBURm9sZGVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gaXRlbS5wYXRoO1xuICB9XG4gIG9uQ2hvb3NlSXRlbShpdGVtOiBURm9sZGVyKTogdm9pZCB7XG4gICAgdGhpcy5vbkNob29zZShpdGVtKTtcbiAgfVxuXG4gIHN0YXRpYyBjb2xsZWN0Rm9sZGVycyhhcHA6IEFwcCk6IFRGb2xkZXJbXSB7XG4gICAgY29uc3Qgb3V0OiBURm9sZGVyW10gPSBbXTtcbiAgICBWYXVsdC5yZWN1cnNlQ2hpbGRyZW4oYXBwLnZhdWx0LmdldFJvb3QoKSwgKGFmKSA9PiB7XG4gICAgICBpZiAoYWYgaW5zdGFuY2VvZiBURm9sZGVyKSBvdXQucHVzaChhZik7XG4gICAgfSk7XG4gICAgcmV0dXJuIG91dC5zb3J0KChhLCBiKSA9PiBhLnBhdGgubG9jYWxlQ29tcGFyZShiLnBhdGgpKTtcbiAgfVxufSIsICJpbXBvcnQgeyBBcHAsIE5vdGljZSwgVEZpbGUsIFRGb2xkZXIgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IHNwbGl0RnJvbnRtYXR0ZXIgfSBmcm9tIFwiLi4vbGliL21kLXV0aWxzXCI7XG5pbXBvcnQgeyBzdHJpcEFuZENvbGxhcHNlQmxhbmtMaW5lcywgc3RyaXBBbmRSZW1vdmVFbXB0eUxpbmVzIH0gZnJvbSBcIi4uL2xpYi90ZXh0LWNsZWFuXCI7XG5pbXBvcnQgeyBCbGFua0xpbmVzQ2hvaWNlLCBCbGFua0xpbmVzTW9kYWwgfSBmcm9tIFwic3JjL3VpL2JsYW5rLWxpbmVzLW1vZGFsXCI7XG5cbmFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NGaWxlKGFwcDogQXBwLCBmOiBURmlsZSwgY2hvaWNlOiBCbGFua0xpbmVzQ2hvaWNlKSB7XG4gIGlmIChmLmV4dGVuc2lvbiAhPT0gXCJtZFwiKSByZXR1cm47XG5cbiAgY29uc3QgcmF3ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZik7XG4gIGNvbnN0IHsgeWFtbCwgYm9keSB9ID0gc3BsaXRGcm9udG1hdHRlcihyYXcpO1xuXG4gIGxldCBuZXdCb2R5OiBzdHJpbmc7XG4gIGlmIChjaG9pY2UubW9kZSA9PT0gXCJyZW1vdmVcIikge1xuICAgIG5ld0JvZHkgPSBzdHJpcEFuZFJlbW92ZUVtcHR5TGluZXMoYm9keSk7XG4gIH0gZWxzZSB7XG4gICAgbmV3Qm9keSA9IHN0cmlwQW5kQ29sbGFwc2VCbGFua0xpbmVzKGJvZHksIGNob2ljZS5tYXhDb25zZWN1dGl2ZSk7XG4gIH1cblxuICBpZiAobmV3Qm9keSAhPT0gYm9keSkge1xuICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZiwgKHlhbWwgPz8gXCJcIikgKyBuZXdCb2R5KTtcbiAgfVxufVxuXG5mdW5jdGlvbiogaXRlcmF0ZU1hcmtkb3duRmlsZXMoZm9sZGVyOiBURm9sZGVyLCByZWN1cnNpdmU6IGJvb2xlYW4pOiBHZW5lcmF0b3I8VEZpbGU+IHtcbiAgZm9yIChjb25zdCBjaGlsZCBvZiBmb2xkZXIuY2hpbGRyZW4pIHtcbiAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBURmlsZSAmJiBjaGlsZC5leHRlbnNpb24gPT09IFwibWRcIikge1xuICAgICAgeWllbGQgY2hpbGQ7XG4gICAgfSBlbHNlIGlmIChyZWN1cnNpdmUgJiYgY2hpbGQgaW5zdGFuY2VvZiBURm9sZGVyKSB7XG4gICAgICB5aWVsZCogaXRlcmF0ZU1hcmtkb3duRmlsZXMoY2hpbGQsIHRydWUpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tbWFuZENsZWFuQmxhbmtMaW5lcyhhcHA6IEFwcCkge1xuICBuZXcgQmxhbmtMaW5lc01vZGFsKGFwcCwgYXN5bmMgKGNob2ljZSkgPT4ge1xuICAgIGlmIChjaG9pY2Uuc2NvcGUua2luZCA9PT0gXCJjdXJyZW50XCIpIHtcbiAgICAgIGNvbnN0IGZpbGUgPSBhcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcbiAgICAgIGlmICghZmlsZSkgeyBuZXcgTm90aWNlKFwiT3BlbiBhIGZpbGUgZmlyc3QuXCIpOyByZXR1cm47IH1cbiAgICAgIGF3YWl0IHByb2Nlc3NGaWxlKGFwcCwgZmlsZSwgY2hvaWNlKTtcbiAgICAgIG5ldyBOb3RpY2UoXCJDbGVhbmVkIGJsYW5rIGxpbmVzIGluIGN1cnJlbnQgZmlsZS5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgeyBmb2xkZXIsIHJlY3Vyc2l2ZSB9ID0gY2hvaWNlLnNjb3BlO1xuICAgIGNvbnN0IHRhc2tzOiBQcm9taXNlPHZvaWQ+W10gPSBbXTtcbiAgICBsZXQgY291bnQgPSAwO1xuXG4gICAgZm9yIChjb25zdCBmIG9mIGl0ZXJhdGVNYXJrZG93bkZpbGVzKGZvbGRlciwgcmVjdXJzaXZlKSkge1xuICAgICAgY291bnQrKztcbiAgICAgIHRhc2tzLnB1c2gocHJvY2Vzc0ZpbGUoYXBwLCBmLCBjaG9pY2UpKTtcbiAgICB9XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwodGFza3MpO1xuICAgIG5ldyBOb3RpY2UoYENsZWFuZWQgYmxhbmsgbGluZXMgaW4gJHtjb3VudH0gZmlsZShzKS5gKTtcbiAgfSkub3BlbigpO1xufSIsICIvKiogUmVtb3ZlIGVtcHR5IGxpbmVzIGFmdGVyIHRyaW1taW5nIGVhY2ggbGluZSAoa2VlcHMgb25seSBub24tZW1wdHkpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwQW5kUmVtb3ZlRW1wdHlMaW5lcyhpbnB1dDogc3RyaW5nIHwgc3RyaW5nW10pOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IEFycmF5LmlzQXJyYXkoaW5wdXQpID8gaW5wdXQgOiBpbnB1dC5zcGxpdCgvXFxyP1xcbi8pO1xuICBjb25zdCBvdXQ6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3QgcmF3IG9mIGxpbmVzKSB7XG4gICAgY29uc3QgcyA9IHJhdy50cmltKCk7XG4gICAgaWYgKHMubGVuZ3RoKSBvdXQucHVzaChzKTtcbiAgfVxuICByZXR1cm4gb3V0LmpvaW4oXCJcXG5cIik7XG59XG5cbi8qKlxuICogVHJpbSBlYWNoIGxpbmUgYW5kIGNvbGxhcHNlIGNvbnNlY3V0aXZlIGJsYW5rIGxpbmVzLlxuICogQHBhcmFtIGlucHV0IHN0cmluZyBvciBhcnJheSBvZiBsaW5lc1xuICogQHBhcmFtIG1heENvbnNlY3V0aXZlIGhvdyBtYW55IGJsYW5rIGxpbmVzIHRvIGtlZXAgaW4gYSByb3cgKGRlZmF1bHQgMSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwQW5kQ29sbGFwc2VCbGFua0xpbmVzKGlucHV0OiBzdHJpbmcgfCBzdHJpbmdbXSwgbWF4Q29uc2VjdXRpdmUgPSAxKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBBcnJheS5pc0FycmF5KGlucHV0KSA/IGlucHV0IDogaW5wdXQuc3BsaXQoL1xccj9cXG4vKTtcbiAgY29uc3Qgb3V0OiBzdHJpbmdbXSA9IFtdO1xuICBsZXQgYmxhbmtzID0gMDtcblxuICBmb3IgKGNvbnN0IHJhdyBvZiBsaW5lcykge1xuICAgIGNvbnN0IHMgPSByYXcudHJpbSgpO1xuICAgIGlmIChzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgYmxhbmtzKys7XG4gICAgICBpZiAoYmxhbmtzIDw9IG1heENvbnNlY3V0aXZlKSBvdXQucHVzaChcIlwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYmxhbmtzID0gMDtcbiAgICAgIG91dC5wdXNoKHMpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb3V0LmpvaW4oXCJcXG5cIik7XG59IiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIE5vdGljZSwgU2V0dGluZywgVEZvbGRlciB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgRm9sZGVyU3VnZ2VzdE1vZGFsIH0gZnJvbSBcIi4vZm9sZGVyLXN1Z2dlc3QtbW9kYWxcIjtcblxuZXhwb3J0IHR5cGUgQmxhbmtMaW5lTW9kZSA9IFwicmVtb3ZlXCIgfCBcImNvbGxhcHNlXCI7XG5leHBvcnQgdHlwZSBCbGFua0xpbmVzU2NvcGUgPVxuICB8IHsga2luZDogXCJjdXJyZW50XCIgfVxuICB8IHsga2luZDogXCJmb2xkZXJcIjsgZm9sZGVyOiBURm9sZGVyOyByZWN1cnNpdmU6IGJvb2xlYW4gfTtcblxuZXhwb3J0IGludGVyZmFjZSBCbGFua0xpbmVzQ2hvaWNlIHtcbiAgc2NvcGU6IEJsYW5rTGluZXNTY29wZTtcbiAgbW9kZTogQmxhbmtMaW5lTW9kZTtcbiAgbWF4Q29uc2VjdXRpdmU6IG51bWJlcjsgLy8gdXNlZCBvbmx5IGlmIG1vZGUgPT09IFwiY29sbGFwc2VcIlxufVxuXG5leHBvcnQgY2xhc3MgQmxhbmtMaW5lc01vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIG9uUnVuOiAoY2hvaWNlOiBCbGFua0xpbmVzQ2hvaWNlKSA9PiB2b2lkO1xuXG4gIC8vIFVJIHN0YXRlXG4gIHByaXZhdGUgX3Njb3BlOiBcImN1cnJlbnRcIiB8IFwiZm9sZGVyXCIgPSBcImN1cnJlbnRcIjtcbiAgcHJpdmF0ZSByZWN1cnNpdmU6IGJvb2xlYW4gPSB0cnVlO1xuICBwcml2YXRlIGNob3NlbkZvbGRlcjogVEZvbGRlciB8IG51bGwgPSBudWxsO1xuXG4gIHByaXZhdGUgbW9kZTogQmxhbmtMaW5lTW9kZSA9IFwicmVtb3ZlXCI7XG4gIHByaXZhdGUgbWF4Q29uc2VjdXRpdmUgPSAxO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBvblJ1bjogKGNob2ljZTogQmxhbmtMaW5lc0Nob2ljZSkgPT4gdm9pZCkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5vblJ1biA9IG9uUnVuO1xuICB9XG5cbiAgb25PcGVuKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiQ2xlYW4gYmxhbmsgbGluZXNcIik7XG5cbiAgICAvLyBTY29wZVxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5zZXROYW1lKFwiU2NvcGVcIilcbiAgICAgIC5hZGREcm9wZG93bigoZGQpID0+IHtcbiAgICAgICAgZGQuYWRkT3B0aW9uKFwiY3VycmVudFwiLCBcIkN1cnJlbnQgZmlsZVwiKTtcbiAgICAgICAgZGQuYWRkT3B0aW9uKFwiZm9sZGVyXCIsIFwiUGljayBmb2xkZXJcdTIwMjZcIik7XG4gICAgICAgIGRkLnNldFZhbHVlKHRoaXMuX3Njb3BlKTtcbiAgICAgICAgZGQub25DaGFuZ2UoKHYpID0+IHtcbiAgICAgICAgICB0aGlzLl9zY29wZSA9IHYgYXMgXCJjdXJyZW50XCIgfCBcImZvbGRlclwiO1xuICAgICAgICAgIGZvbGRlclJvdy5zZXR0aW5nRWwudG9nZ2xlKHRoaXMuX3Njb3BlID09PSBcImZvbGRlclwiKTtcbiAgICAgICAgICByZWN1cnNlUm93LnNldHRpbmdFbC50b2dnbGUodGhpcy5fc2NvcGUgPT09IFwiZm9sZGVyXCIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgLy8gRm9sZGVyIHJvd1xuICAgIGNvbnN0IGZvbGRlclJvdyA9IG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5zZXROYW1lKFwiRm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIlByb2Nlc3MgYWxsIE1hcmtkb3duIGZpbGVzIGluIHRoZSBmb2xkZXJcIilcbiAgICAgIC5hZGRCdXR0b24oKGIpID0+XG4gICAgICAgIGJcbiAgICAgICAgICAuc2V0QnV0dG9uVGV4dCh0aGlzLmNob3NlbkZvbGRlciA/IHRoaXMuY2hvc2VuRm9sZGVyLnBhdGggOiBcIlBpY2tcdTIwMjZcIilcbiAgICAgICAgICAub25DbGljaygoKSA9PiB7XG4gICAgICAgICAgICBuZXcgRm9sZGVyU3VnZ2VzdE1vZGFsKHRoaXMuYXBwLCAoZm9sZGVyKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuY2hvc2VuRm9sZGVyID0gZm9sZGVyO1xuICAgICAgICAgICAgICBiLnNldEJ1dHRvblRleHQoZm9sZGVyLnBhdGgpO1xuICAgICAgICAgICAgfSkub3BlbigpO1xuICAgICAgICAgIH0pXG4gICAgICApO1xuICAgIGZvbGRlclJvdy5zZXR0aW5nRWwudG9nZ2xlKHRoaXMuX3Njb3BlID09PSBcImZvbGRlclwiKTtcblxuICAgIC8vIFJlY3Vyc2l2ZT9cbiAgICBjb25zdCByZWN1cnNlUm93ID0gbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJJbmNsdWRlIHN1YmZvbGRlcnNcIilcbiAgICAgIC5hZGRUb2dnbGUoKHQpID0+IHQuc2V0VmFsdWUodGhpcy5yZWN1cnNpdmUpLm9uQ2hhbmdlKCh2KSA9PiAodGhpcy5yZWN1cnNpdmUgPSB2KSkpO1xuICAgIHJlY3Vyc2VSb3cuc2V0dGluZ0VsLnRvZ2dsZSh0aGlzLl9zY29wZSA9PT0gXCJmb2xkZXJcIik7XG5cbiAgICAvLyBNb2RlXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJNb2RlXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRkKSA9PiB7XG4gICAgICAgIGRkLmFkZE9wdGlvbihcImNvbGxhcHNlXCIsIFwiQ29sbGFwc2UgY29uc2VjdXRpdmUgYmxhbmtzXCIpO1xuICAgICAgICBkZC5hZGRPcHRpb24oXCJyZW1vdmVcIiwgXCJSZW1vdmUgYWxsIGJsYW5rIGxpbmVzXCIpO1xuICAgICAgICBkZC5zZXRWYWx1ZSh0aGlzLm1vZGUpO1xuICAgICAgICBkZC5vbkNoYW5nZSgodikgPT4ge1xuICAgICAgICAgIHRoaXMubW9kZSA9IHYgYXMgQmxhbmtMaW5lTW9kZTtcbiAgICAgICAgICBtYXhSb3cuc2V0dGluZ0VsLnRvZ2dsZSh0aGlzLm1vZGUgPT09IFwiY29sbGFwc2VcIik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAvLyBNYXggY29uc2VjdXRpdmUgd2hlbiBjb2xsYXBzaW5nXG4gICAgY29uc3QgbWF4Um93ID0gbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJNYXggY29uc2VjdXRpdmUgYmxhbmtzIHRvIGtlZXBcIilcbiAgICAgIC5zZXREZXNjKFwiVXNlZCBvbmx5IHdoZW4gY29sbGFwc2luZzsgMSBrZWVwcyBzaW5nbGUgZW1wdHkgbGluZXMgYmV0d2VlbiBwYXJhZ3JhcGhzLlwiKVxuICAgICAgLmFkZFNsaWRlcigocykgPT5cbiAgICAgICAgcy5zZXRMaW1pdHMoMCwgMywgMSkuc2V0VmFsdWUodGhpcy5tYXhDb25zZWN1dGl2ZSkub25DaGFuZ2UoKHYpID0+ICh0aGlzLm1heENvbnNlY3V0aXZlID0gdikpLnNldER5bmFtaWNUb29sdGlwKClcbiAgICAgICk7XG4gICAgbWF4Um93LnNldHRpbmdFbC50b2dnbGUodGhpcy5tb2RlID09PSBcImNvbGxhcHNlXCIpO1xuXG4gICAgLy8gQWN0aW9uc1xuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5hZGRCdXR0b24oKGIpID0+XG4gICAgICAgIGIuc2V0Q3RhKCkuc2V0QnV0dG9uVGV4dChcIlJ1blwiKS5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5fc2NvcGUgPT09IFwiZm9sZGVyXCIgJiYgIXRoaXMuY2hvc2VuRm9sZGVyKSB7XG4gICAgICAgICAgICBuZXcgTm90aWNlKFwiUGljayBhIGZvbGRlciBmaXJzdC5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHNjb3BlOiBCbGFua0xpbmVzU2NvcGUgPVxuICAgICAgICAgICAgdGhpcy5fc2NvcGUgPT09IFwiY3VycmVudFwiXG4gICAgICAgICAgICAgID8geyBraW5kOiBcImN1cnJlbnRcIiB9XG4gICAgICAgICAgICAgIDogeyBraW5kOiBcImZvbGRlclwiLCBmb2xkZXI6IHRoaXMuY2hvc2VuRm9sZGVyISwgcmVjdXJzaXZlOiB0aGlzLnJlY3Vyc2l2ZSB9O1xuICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICB0aGlzLm9uUnVuKHsgc2NvcGUsIG1vZGU6IHRoaXMubW9kZSwgbWF4Q29uc2VjdXRpdmU6IHRoaXMubWF4Q29uc2VjdXRpdmUgfSk7XG4gICAgICAgIH0pXG4gICAgICApXG4gICAgICAuYWRkRXh0cmFCdXR0b24oKGIpID0+IGIuc2V0SWNvbihcInhcIikuc2V0VG9vbHRpcChcIkNhbmNlbFwiKS5vbkNsaWNrKCgpID0+IHRoaXMuY2xvc2UoKSkpO1xuICB9XG59Il0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7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QUEsRUFDUixTQUFTO0FBQUEsRUFDVCxTQUFTO0FBQUEsRUFDVCxXQUFXO0FBQUEsRUFDWCxXQUFXO0FBQUEsRUFDWCxXQUFXO0FBQUEsRUFDWCxXQUFXO0FBQUEsRUFDWCxRQUFRO0FBQUEsRUFDUixPQUFPO0FBQUEsRUFDUCxRQUFRO0FBQUEsRUFDUixPQUFPO0FBQUEsRUFDUCxPQUFPO0FBQUEsRUFDUCxRQUFRO0FBQUEsRUFDUixRQUFRO0FBQUEsRUFDUixPQUFPO0FBQUE7QUFBQSxFQUNQLFFBQVE7QUFBQTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsT0FBTztBQUFBLEVBQ1AsT0FBTztBQUFBLEVBQ1AsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsU0FBUztBQUFBLEVBQ1QsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsT0FBTztBQUFBLEVBQ1AsT0FBTztBQUFBLEVBQ1AsT0FBTztBQUFBLEVBQ1AsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsT0FBTztBQUFBLEVBQ1AsT0FBTztBQUFBLEVBQ1AsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsVUFBVTtBQUFBLEVBQ1YsVUFBVTtBQUFBLEVBQ1YsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsVUFBVTtBQUFBLEVBQ1YsT0FBTztBQUFBLEVBQ1AsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsU0FBUztBQUFBLEVBQ1QsVUFBVTtBQUFBLEVBQ1YsVUFBVTtBQUFBLEVBQ1YsVUFBVTtBQUFBLEVBQ1YsUUFBUTtBQUFBLEVB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TSwyQkFBMkIsS0FBSyxHQUFHO0FBQUEsSUFDckQsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sVUFBVSxNQUFNLHVCQUF1QixLQUFLLEdBQUc7QUFBQSxJQUNqRCxDQUFDO0FBRUQscUJBQWlCLElBQUk7QUFBQSxFQUN2QjtBQUFBLEVBRUEsTUFBTSxXQUFXO0FBQ2YsWUFBUSxJQUFJLDZCQUF3QjtBQUFBLEVBQ3RDO0FBQUEsRUFFQSxNQUFNLGVBQWU7QUFDbkIsVUFBTSxLQUFLLFNBQVMsS0FBSyxRQUFRO0FBQUEsRUFDbkM7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJibG9jayIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiY29udGVudCIsICJ5YW1sIiwgImJvZHkiLCAibGlua2VkIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiYWRkSWNvbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgInJhdyIsICJpbXBvcnRfb2JzaWRpYW4iLCAiQk9PS19BQkJSIiwgImltcG9ydF9vYnNpZGlhbiIsICJCT0xMUyIsICJCT09LX0FCQlIiLCAiaW1wb3J0X29ic2lkaWFuIiwgIkJPT0tfQUJCUiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iXQp9Cg==
