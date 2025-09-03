import type { addIcon as AddIconFn } from "obsidian";

const ICONS: Record<string, string> = {
  "obtb-book": `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6 4h10a2 2 0 0 1 2 2v12.5a1.5 1.5 0 0 0-1.5-1.5H6a2 2 0 0 0 0 4h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  "obtb-links": `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  "obtb-highlighter": `<svg viewBox="0 0 24 24"><path d="M3 16l6-6 5 5-6 6H3z" fill="currentColor"/><path d="M12 9l3-3 3 3-3 3z" fill="currentColor"/></svg>`,
  "obtb-summary": `<svg viewBox="0 0 24 24"><path d="M5 5h14M5 9h10M5 13h8M5 17h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`,
  "obtb-outline": `<svg viewBox="0 0 24 24"><path d="M7 6h10M7 12h10M7 18h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`,
  "obtb-formatter": `<svg viewBox="0 0 24 24"><path d="M5 7h6M5 12h10M5 17h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`,
  "obtb-bible": `<svg viewBox="0 0 24 24"><path d="M6.5 4h9A2.5 2.5 0 0 1 18 6.5V20H8.5A2.5 2.5 0 0 1 6 17.5V4.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 8h6M10 11h6" stroke="currentColor" stroke-width="2"/></svg>`
};

export function registerIcons(addIcon: typeof AddIconFn) {
  for (const [name, svg] of Object.entries(ICONS)) addIcon(name, svg);
}
