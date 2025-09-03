import { App, Modal, Setting, Notice, requestUrl } from "obsidian";
import type { BibleToolsSettings } from "../settings";

/** Bolls formats */
export interface BollsTranslation {
  short_name: string;
  full_name: string;
  updated?: number;
  dir?: "rtl" | "ltr";
}
export interface BollsLanguage {
  language: string;
  translations: BollsTranslation[];
}

const BOLLS = {
  LANGUAGES_URL: "https://bolls.life/static/bolls/app/views/languages.json",
};

async function fetchLanguages(): Promise<BollsLanguage[]> {
  const res = await requestUrl({ url: BOLLS.LANGUAGES_URL, method: "GET" });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`HTTP ${res.status}`);
  }
  const parsed = JSON.parse(res.text) as BollsLanguage[];
  return (parsed || []).filter(b => Array.isArray(b.translations) && b.translations.length > 0);
}

export interface BaseBollsDefaults {
  languageLabel?: string | null;   // e.g., "English"
  versionShort?: string | null;    // e.g., "KJV"
}

/**
 * Base modal that:
 *  - loads Bolls languages.json (with requestUrl, so no CORS issues),
 *  - renders Language + Version pickers,
 *  - exposes chosen `languageKey`, `translationCode`, `translationFull`,
 *  - provides hooks for subclasses to add options/footer/actions.
 */
export abstract class BaseBollsModal extends Modal {
  protected settings: BibleToolsSettings;

  protected langBlocks: BollsLanguage[] = [];
  protected languageKey: string = "ALL"; // "ALL" (=flatten) or exact BollsLanguage.language
  protected translationCode: string = "KJV";
  protected translationFull: string = "King James Version";

  /** UI elements shared so subclasses can re-render parts if they want */
  protected versionsContainer!: HTMLDivElement;

  /** Optional defaults to preselect (from settings) */
  private defaults?: BaseBollsDefaults;

  constructor(app: App, settings: BibleToolsSettings, defaults?: BaseBollsDefaults) {
    super(app);
    this.settings = settings;
    this.defaults = defaults;
  }

  /** Override to add extra option controls under the pickers */
  protected renderExtraOptions(_contentEl: HTMLElement): void {}

  /** Override to render footer (buttons/progress/etc.) */
  protected abstract renderFooter(contentEl: HTMLElement): void;

  /** Subclasses can call to rebuild version dropdown */
  protected translationsForLanguage(langKey: string): BollsTranslation[] {
    if (langKey === "ALL") {
      const all: BollsTranslation[] = [];
      for (const block of this.langBlocks) all.push(...block.translations);
      const seen = new Set<string>();
      return all
        .filter(t => {
          if (seen.has(t.short_name)) return false;
          seen.add(t.short_name);
          return true;
        })
        .sort((a, b) => a.short_name.localeCompare(b.short_name));
    }
    const block = this.langBlocks.find(b => b.language === langKey);
    if (!block) return [];
    return block.translations.slice().sort((a, b) => a.short_name.localeCompare(b.short_name));
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText("Bible version");

    // Load catalogue (cache optional: if you already cache in settings, you can reuse it)
    try {
      const cached = this.settings.bollsCatalogueCache as unknown as BollsLanguage[] | undefined;
      if (cached?.length) {
        this.langBlocks = cached;
      } else {
        this.langBlocks = await fetchLanguages();
        // (optional) save into settings for later
        try {
          (this.settings as any).bollsCatalogueCache = this.langBlocks;
          (this.settings as any).bollsCatalogueCachedAt = Date.now();
          // call your plugin save method, if any:
          (this.app as any).savePluginSettings?.() ?? (this as any).plugin?.saveSettings?.();
        } catch {}
      }
    } catch (e) {
      console.warn("[Bolls] Could not fetch languages.json:", e);
      // Minimal fallback so UI still works:
      this.langBlocks = [{
        language: "English",
        translations: [
          { short_name: "KJV", full_name: "King James Version 1769 with Apocrypha and Strong's Numbers" },
          { short_name: "WEB", full_name: "World English Bible" },
          { short_name: "YLT", full_name: "Young's Literal Translation (1898)" },
        ],
      }];
      new Notice("Using minimal fallback catalogue (KJV/WEB/YLT).");
    }

    // Preselect defaults if provided
    if (this.defaults?.languageLabel) {
      const found = this.langBlocks.find(b => b.language === this.defaults!.languageLabel);
      if (found) this.languageKey = found.language;
    }
    if (this.defaults?.versionShort) {
      this.translationCode = this.defaults.versionShort;
      const t = this.translationsForLanguage(this.languageKey).find(x => x.short_name === this.translationCode);
      this.translationFull = t?.full_name ?? this.translationCode;
    }

    // LANGUAGE PICKER
    new Setting(contentEl)
      .setName("Language")
      .addDropdown(dd => {
        const sel = dd.selectEl;
        (sel as HTMLElement).style.maxWidth = "360px";
        (sel as HTMLElement).style.whiteSpace = "nowrap";

        dd.addOption("ALL", "All languages");
        for (const block of this.langBlocks) {
          dd.addOption(block.language, block.language);
        }
        dd.setValue(this.languageKey);
        dd.onChange(v => {
          this.languageKey = v;
          this.rebuildVersions();
        });
      });

    // VERSIONS (dynamic)
    this.versionsContainer = contentEl.createDiv();
    this.rebuildVersions();

    // Allow subclasses to add extra controls
    this.renderExtraOptions(contentEl);

    // Footer/actions (abstract)
    this.renderFooter(contentEl);
  }

  protected rebuildVersions() {
    this.versionsContainer.empty();
    const list = this.translationsForLanguage(this.languageKey);

    new Setting(this.versionsContainer)
      .setName("Version")
      .addDropdown(dd => {
        const sel = dd.selectEl;
        (sel as HTMLElement).style.maxWidth = "360px";
        (sel as HTMLElement).style.whiteSpace = "nowrap";

        if (!list.length) {
          dd.addOption("", "(no translations)");
          dd.setValue("");
          this.translationCode = "";
          this.translationFull = "";
          return;
        }

        for (const t of list) dd.addOption(t.short_name, `${t.short_name} — ${t.full_name}`);

        // keep current if exists; else first
        const exists = list.some(t => t.short_name === this.translationCode);
        const chosen = exists ? this.translationCode : list[0].short_name;
        dd.setValue(chosen);
        this.translationCode = chosen;
        const tt = list.find(x => x.short_name === chosen);
        this.translationFull = tt?.full_name ?? chosen;

        dd.onChange(v => {
          this.translationCode = v;
          const t2 = list.find(x => x.short_name === v);
          this.translationFull = t2?.full_name ?? v;
        });
      });
  }
}