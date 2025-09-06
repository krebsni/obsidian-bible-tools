import { Notice, requestUrl, Setting } from "obsidian";
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

export interface BaseBollsDefaults {
  languageLabel?: string;   // e.g., "English"
  versionShort?: string | undefined;    // e.g., "KJV" | undefined means Default
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

export interface BollsPickerComponentOptions {
  settings: BibleToolsSettings;
  langBlocks: BollsLanguage[];             // can pass [] — will be loaded
  languageKey: string;                     // initial selection (e.g., "ALL")
  translationCode: string | undefined; // "KJV" or undefined for Default
  translationFull?: string;                // optional initial full name
  defaults?: BaseBollsDefaults;            // optional defaults to preselect
  onChange: (language: string, version: string | undefined, versionFull: string | undefined) => void;
  container: HTMLElement;                  // host element
  versionsContainer?: HTMLDivElement;      // (set by component)
  app: any;                                // plugin/app instance for saving
  disallowDefault?: boolean;
}

export class BollsPickerComponent {
  private options: BollsPickerComponentOptions;
  private settings: BibleToolsSettings;
  private app: any;

  // reference kept to the actual versions container we render into
  versionsContainer!: HTMLDivElement;

  private static DEFAULT_SENTINEL = "__DEFAULT__";

  constructor(options: BollsPickerComponentOptions, settings: BibleToolsSettings, disallowDefault: boolean = false) {
    this.options = options;
    this.settings = settings;
    this.app = options.app;

    if (disallowDefault) this.setDisallowDefault(true);
    this.render();
  }

  /** Helper: get translations for a language or ALL (dedup by short_name) */
  protected translationsForLanguage(langKey: string): BollsTranslation[] {
    if (langKey === "ALL") {
      const all: BollsTranslation[] = [];
      for (const block of this.options.langBlocks) all.push(...block.translations);
      const seen = new Set<string>();
      return all
        .filter(t => (seen.has(t.short_name) ? false : (seen.add(t.short_name), true)))
        .sort((a, b) => a.short_name.localeCompare(b.short_name));
    }
    const block = this.options.langBlocks.find(b => b.language === langKey);
    if (!block) return [];
    return block.translations.slice().sort((a, b) => a.short_name.localeCompare(b.short_name));
  }

  private async loadCatalogue() {
    try {
      const cached = this.settings.bollsCatalogueCache as unknown as BollsLanguage[] | undefined;
      if (cached?.length) {
        this.options.langBlocks = cached;
        return;
      }
      this.options.langBlocks = await fetchLanguages();
      try {
        (this.settings as any).bollsCatalogueCache = this.options.langBlocks;
        (this.settings as any).bollsCatalogueCachedAt = Date.now();
        this.app?.savePluginSettings?.();
      } catch {}
    } catch (e) {
      console.warn("[Bolls] Could not fetch languages.json:", e);
      this.options.langBlocks = [{
        language: "English",
        translations: [
          { short_name: "KJV", full_name: "King James Version 1769 with Apocrypha and Strong's Numbers" },
          { short_name: "WEB", full_name: "World English Bible" },
          { short_name: "YLT", full_name: "Young's Literal Translation (1898)" },
        ],
      }];
      new Notice("Using minimal fallback catalogue (KJV/WEB/YLT).");
    }
  }

  async render() {
    const { container } = this.options;
    container.empty();

    // ensure catalog is loaded
    await this.loadCatalogue();

    // apply defaults (if any)
    if (this.options.defaults?.languageLabel) {
      const found = this.options.langBlocks.find(b => b.language === this.options.defaults!.languageLabel);
      if (found) this.options.languageKey = found.language;
    }
    if (this.options.defaults) {
      // If versionShort is explicitly undefined -> Default
      if (this.options.defaults.versionShort === undefined) {
        this.options.translationCode = undefined;
        this.options.translationFull = undefined;
      } else if (this.options.defaults.versionShort) {
        this.options.translationCode = this.options.defaults.versionShort;
        const t = this.translationsForLanguage(this.options.languageKey)
          .find(x => x.short_name === this.options.translationCode);
        this.options.translationFull = t?.full_name ?? this.options.translationCode ?? undefined;
      }
    }

    // LANGUAGE PICKER
    new Setting(container)
      .setName("Bible language")
      .addDropdown(dd => {
        dd.addOption("ALL", "All languages");
        for (const block of this.options.langBlocks) {
          dd.addOption(block.language, block.language);
        }
        dd.setValue(this.options.languageKey);
        dd.onChange(v => {
          this.options.languageKey = v;
          this.renderVersions(); // rebuild versions for the selected language
          this.options.onChange(this.options.languageKey, this.options.translationCode, this.options.translationFull);
        });
      });

    // VERSIONS (dynamic)
    this.versionsContainer = container.createDiv();
    this.options.versionsContainer = this.versionsContainer;
    this.renderVersions();
  }

  private setDisallowDefault(disallow: boolean) {
    this.options.disallowDefault = disallow;
    // If we now disallow default but current is undefined, coerce to first available
    if (disallow && (this.options.translationCode == undefined || this.options.translationCode === "")) {
      const list = this.translationsForLanguage(this.options.languageKey);
      if (list.length) {
        if (this.options.languageKey === "English" && list.some(t => t.short_name === "KJV")) {
          this.options.translationCode = "KJV";
          this.options.translationFull = list.find(t => t.short_name === "KJV")?.full_name ?? "KJV";
        } else {
          this.options.translationCode = list[0].short_name;
          this.options.translationFull = list[0].full_name;
        }
        this.options.onChange(this.options.languageKey, this.options.translationCode, this.options.translationFull);
      }
    }
    // Rebuild versions UI to reflect the flag
    if (this.versionsContainer) this.renderVersions();
  }

  private renderVersions() {
    this.versionsContainer.empty();
    const list = this.translationsForLanguage(this.options.languageKey);

    new Setting(this.versionsContainer)
      .setName("Version")
      .addDropdown(dd => {
        const sel = dd.selectEl as HTMLElement;
        sel.style.maxWidth = "360px";
        sel.style.whiteSpace = "nowrap";

        // Only show "Default" when allowed
        const allowDefault = !this.options.disallowDefault;

        if (allowDefault) {
          dd.addOption(BollsPickerComponent.DEFAULT_SENTINEL, "Default");
        }

        if (!list.length) {
          // With no translations available:
          if (allowDefault) {
            dd.setValue(
              this.options.translationCode == undefined
                ? BollsPickerComponent.DEFAULT_SENTINEL
                : BollsPickerComponent.DEFAULT_SENTINEL
            );
            this.options.translationCode = undefined;
            this.options.translationFull = undefined;
          } else {
            // disallowDefault: nothing to pick, keep empty
            dd.addOption("", "(no translations)");
            dd.setValue("");
            this.options.translationCode = "";
            this.options.translationFull = "";
          }
          return;
        }

        for (const t of list) {
          dd.addOption(t.short_name, `${t.short_name} — ${t.full_name}`);
        }

        // Determine initial value
        let initialValue: string;
        if (this.options.translationCode == undefined || this.options.translationCode === "") {
          if (allowDefault) {
            initialValue = BollsPickerComponent.DEFAULT_SENTINEL;
          } else {
            initialValue = list[0].short_name; // coerce to first
          }
        } else {
          const exists = list.some(t => t.short_name === this.options.translationCode);
          initialValue = exists ? (this.options.translationCode as string) : list[0].short_name;
        }

        dd.setValue(initialValue);

        // Sync internal state
        if (initialValue === BollsPickerComponent.DEFAULT_SENTINEL) {
          this.options.translationCode = undefined;
          this.options.translationFull = undefined;
        } else {
          this.options.translationCode = initialValue;
          const tt = list.find(x => x.short_name === initialValue);
          this.options.translationFull = tt?.full_name ?? initialValue;
        }

        dd.onChange(v => {
          if (allowDefault && v === BollsPickerComponent.DEFAULT_SENTINEL) {
            this.options.translationCode = undefined;
            this.options.translationFull = undefined;
          } else {
            this.options.translationCode = v;
            const t2 = list.find(x => x.short_name === v);
            this.options.translationFull = t2?.full_name ?? v;
          }
          this.options.onChange(this.options.languageKey, this.options.translationCode, this.options.translationFull);
        });
      });
  }
}