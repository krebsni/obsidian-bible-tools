import { Notice } from "obsidian";
import { linkVersesInText } from "src/commands/verse-links";
import { BibleToolsSettings } from "src/settings";

export interface OutlineFormatOptions {
  splitInlineSubpoints?: boolean;       // default: true
  fixHyphenatedBreaks?: boolean;        // default: true
  dropPurePageNumberLines?: boolean;    // default: false
  outputLineSeparator?: string;         // default: "\n"
}

/** ----- Helpers (delimiter-aware + Python parity) ----- */

function romanToInt(roman: string): number {
  const map: Record<string, number> = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
  let result = 0, prev = 0;
  for (let i = roman.length - 1; i >= 0; i--) {
    const val = map[roman[i]];
    if (!val) return NaN;
    result += val < prev ? -val : val;
    prev = val;
  }
  return result;
}
const isRoman = (s: string) => /^[IVXLCDM]+$/.test(s);
const isAlphaUpper = (s: string) => /^[A-Z]$/.test(s);

function getMdPrefixFromLevel(level: number | "bullet"): string {
  switch (level) {
    case 2: return "##";      // Roman
    case 3: return "###";     // A.
    case 4: return "####";    // 1.
    case 5: return "#####";   // a.
    case 6: return "######";  // (1) or 1)
    default: return "######"; // bullet fallback
  }
}

/** Tokenize a heading marker and its rest. Captures delimiter: ".", ")", or ".)" */
function parseHeadingStart(s: string): { token: string; label: string; rest: string; delim: string | null } | null {
  const m =
    s.match(/^\s*(?<roman>[IVXLCDM]+)(?<delim>\.\)|[.)])\s+(?<rest>.+)$/) ||
    s.match(/^\s*(?<upper>[A-Z])(?<delim>\.\)|[.)])\s+(?<rest>.+)$/)      ||
    s.match(/^\s*(?<num>\d+)(?<delim>\.\)|[.)])\s+(?<rest>.+)$/)          ||
    s.match(/^\s*\(\s*(?<pnum>\d+)\s*\)\s+(?<rest>.+)$/)                  ||
    s.match(/^\s*\(\s*(?<plow>[a-z])\s*\)\s+(?<rest>.+)$/)                ||
    s.match(/^\s*(?<low>[a-z])(?<delim>\.\)|[.)])\s+(?<rest>.+)$/);

  if (!m) return null;
  const g = (m as any).groups || {};
  let label = "";
  let delim: string | null = g.delim ?? null;

  if (g.roman) label = g.roman;
  else if (g.upper) label = g.upper;
  else if (g.num) label = g.num;
  else if (g.pnum) { label = `(${g.pnum})`; delim = ")"; }
  else if (g.plow) { label = `(${g.plow})`; delim = ")"; }
  else if (g.low) label = g.low;

  let token = "";
  if (g.roman) token = `${g.roman}${delim ?? "."}`;
  else if (g.upper) token = `${g.upper}${delim ?? "."}`;
  else if (g.num) token = `${g.num}${delim ?? "."}`;
  else if (g.pnum) token = `(${g.pnum})`;
  else if (g.plow) token = `(${g.plow})`;
  else if (g.low) token = `${g.low}${delim ?? "."}`;

  return { token, label, rest: g.rest || "", delim };
}

/** Decide level using delimiter, plus Roman/Alpha heuristics (like Python) */
function decideLevel(
  label: string,
  delim: string | null,
  prevRom: string | null,
  prevAlphaIdx: number | null
): { level: number | "bullet"; nextRom: string | null; nextAlphaIdx: number | null } {
  if (/^\(\d+\)$/.test(label)) {
    return { level: 6, nextRom: prevRom, nextAlphaIdx: prevAlphaIdx };         // (1)
  }
  if (/^\([a-z]+\)$/.test(label)) {
    return { level: "bullet", nextRom: prevRom, nextAlphaIdx: prevAlphaIdx };  // (a)
  }

  // 1) vs 1. vs 1.)
  if (/^\d+$/.test(label)) {
    if (delim === ")") {
      return { level: 6, nextRom: prevRom, nextAlphaIdx: prevAlphaIdx };       // 1)
    }
    return { level: 4, nextRom: prevRom, nextAlphaIdx: prevAlphaIdx };         // 1. / 1.)
  }

  // Roman vs Alpha ambiguity (e.g., I.)
  if (isRoman(label)) {
    const romVal = romanToInt(label);
    const fitsRoman = !prevRom || romanToInt(prevRom) + 1 === romVal;

    const alphaVal = isAlphaUpper(label) ? (label.charCodeAt(0) - 64) : null; // A=1
    const fitsAlpha = prevAlphaIdx == null ? true : (alphaVal != null && alphaVal === prevAlphaIdx + 1);

    if (fitsRoman && !fitsAlpha) {
      return { level: 2, nextRom: label, nextAlphaIdx: prevAlphaIdx };         // ##
    } else if (fitsAlpha && !fitsRoman) {
      return { level: 3, nextRom: prevRom, nextAlphaIdx: alphaVal ?? 1 };      // ###
    } else if (fitsRoman && fitsAlpha) {
      return { level: 3, nextRom: prevRom, nextAlphaIdx: alphaVal ?? 1 };      // prefer alpha as deeper
    } else {
      return { level: 2, nextRom: label, nextAlphaIdx: prevAlphaIdx };         // default to Roman
    }
  }

  // A) vs A.
  if (isAlphaUpper(label)) {
    return { level: 3, nextRom: prevRom, nextAlphaIdx: label.charCodeAt(0) - 64 }; // ###
  }

  // a) vs a.
  if (/^[a-z]$/.test(label)) {
    if (delim === ")") {
      return { level: "bullet", nextRom: prevRom, nextAlphaIdx: prevAlphaIdx };    // a)
    }
    return { level: 5, nextRom: prevRom, nextAlphaIdx: prevAlphaIdx };             // a.
  }

  return { level: "bullet", nextRom: prevRom, nextAlphaIdx: prevAlphaIdx };
}

/** Hyphen break fixers */
const HYPH = `-\\u00AD\\u2010\\u2011\\u2012\\u2013\\u2014`; // -, soft hyphen, ‐, -, ‒, –, —
const INLINE_HYPHEN_BREAK_RE = new RegExp(`([A-Za-zÀ-ÖØ-öø-ÿ])[${HYPH}]\\s+([a-zà-öø-ÿ])`, "g");
const TRAILING_HYPHEN_AT_END_RE = new RegExp(`[A-Za-zÀ-ÖØ-öø-ÿ][${HYPH}]\\s*$`);
function fixInlineHyphens(s: string): string { return s.replace(INLINE_HYPHEN_BREAK_RE, "$1$2"); }
function appendWithWordBreakFix(buf: string, next: string, fix: boolean): string {
  if (fix) {
    if (TRAILING_HYPHEN_AT_END_RE.test(buf) && /^[a-zà-öø-ÿ]/.test(next)) {
      return buf.replace(new RegExp(`[${HYPH}]\\s*$`), "") + next;
    }
    const joined = (buf + " " + next).replace(/\s+/g, " ");
    return fixInlineHyphens(joined);
  }
  return (buf + " " + next).replace(/\s+/g, " ");
}

/** --- Split helpers (now with ‘protected’ verse & S. S. spans) --- */
const TOKEN_START_SRC = String.raw`(?:[IVXLCDM]+[.)]|[A-Z][.)]|[a-z][.)]|\d+[.)]|$begin:math:text$[a-zA-Z0-9]+$end:math:text$)`;

const AFTER_PUNCT_SPLIT_RE = new RegExp(
  String.raw`([:;!?)]|—\s*v\.\s*\d+[a-z]?:)\s+(?=` + TOKEN_START_SRC + String.raw`\s+)`,
  "gi"
);

// Only protect verse markers and “S. S.”; all other one-letter abbrevs can split.
const AFTER_SENT_TOKEN_SPLIT_RE = new RegExp(
  String.raw`(?<!\b[vV][vV]\.)(?<!\b[vV]\.)(?<!\bS\.\s*S)\.\s+(?=` + TOKEN_START_SRC + String.raw`\s+)`,
  "g"
);

// Pre-protect "v. 7", "vv. 7-9" and "S. S." so splitters can’t cut them.
// Uses a private-use sentinel for the protected space.
const SENTINEL = "\uE000";
function protectSpans(s: string): string {
  // v. 7[letter]?
  s = s.replace(/\b([vV])\.\s+(\d+[a-z]?)(?=[^\d]|$)/g, (_m, v, n) => `${v}.` + SENTINEL + n);
  // vv. 7-9 / VV. 7–9 etc.
  s = s.replace(/\b([vV])([vV])\.\s+(\d+[a-z]?)(\s*[-–—]\s*\d+[a-z]?)?/g,
    (_m, v1, v2, a, rng) => `${v1}${v2}.` + SENTINEL + a + (rng ?? "")
  );
  // S. S.
  s = s.replace(/\bS\.\s*S\./g, m => m.replace(/\s+/, SENTINEL));
  return s;
}
function unprotectSpans(s: string): string { return s.replace(new RegExp(SENTINEL, "g"), " "); }

function splitInlineSegments(line: string): string[] {
  let s = protectSpans(line);
  s = s.replace(AFTER_PUNCT_SPLIT_RE, (_m, p1: string) => `${p1}\n`);
  s = s.replace(AFTER_SENT_TOKEN_SPLIT_RE, ".\n");
  s = unprotectSpans(s);
  return s.split("\n").map(x => x.trim()).filter(Boolean);
}

/** ----- Main formatter (delimiter-aware, verse-safe) ----- */
export async function formatOutlineText(
  textOrLines: string | string[],
  {
    splitInlineSubpoints = true,
    fixHyphenatedBreaks = true,
    outputLineSeparator = "\n",
    dropPurePageNumberLines = false
  }: OutlineFormatOptions = {},
  settings: BibleToolsSettings
): Promise<string> {
  // Build a raw string so we can pre-hack the very first " I. "
  let raw = Array.isArray(textOrLines) ? textOrLines.join("\n") : textOrLines;

  // HARD PATCH: In the first 2000 chars only, insert a newline before the first standalone " I. "
  // - Not preceded by a letter/number (so not "II.")
  // - Followed by a capital (start of a sentence/heading)
  // - Do not touch "S. S."
  {
    const head = raw.slice(0, 2000);
    const tail = raw.slice(2000);

    // one-time replace (no /g/)
    const headPatched = head.replace(
      /(^|[^A-Za-z0-9])I\.\s+(?=[A-Z])(?!\s*S\.)/m,
      (_m, pre) => `${pre}\nI. `
    );

    raw = headPatched + tail;
  }

  // now proceed with normal line splitting using the patched text
  const lines = raw.split(/\r?\n/);

  // const lines = Array.isArray(textOrLines) ? textOrLines.slice() : textOrLines.split(/\r?\n/);

  const out: string[] = [];
  let buf = "";
  let prevRoman: string | null = null;     // previous Roman label (I, II, …)
  let prevAlphaIdx: number | null = null;  // previous Alpha index (A=1, B=2, …)

  const emitBuffer = (raw: string) => {
    let base = raw.trim();
    if (!base) return;

    if (!splitInlineSubpoints) {
      out.push(base);
      return;
    }
    const parts = splitInlineSegments(base)
      .map(seg => seg.replace(/^\d{1,3}\s+[A-Z][A-Z]+(?:[ -][A-Z][A-Z]+)*/, "").trim()) // conservative header scrub
      .filter(Boolean);

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

  for (let raw of lines) {
    let line = raw.trim();
    if (!line) continue;
    if (dropPurePageNumberLines && /^\d+$/.test(line)) continue;
    if (fixHyphenatedBreaks) line = fixInlineHyphens(line);

    // If previous buffer ends with verse marker, a leading number is a verse — not a new heading.
    let parsed = parseHeadingStart(line);
    const prevEndsWithVerse = /\b[vV]{1,2}\.\s*$/.test(buf);
    if (parsed && /^\d+$/.test(parsed.label) && prevEndsWithVerse) {
      parsed = null; // treat as continuation
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

  // insert verse links using linkVersesInText
  if (settings.autoLinkVerses) {
    result = await linkVersesInText(result, settings);
  }

  new Notice("Outline formatted" + (settings.autoLinkVerses ? " + verses linked." : "."));

  return result
}

// /**
//  * SAFELY split inline subpoints ONLY when they come right after a colon/semicolon,
//  * e.g. “… v. 9: a. Fullness … b. When … 1. Something …”
//  * This will NOT split ‘Col.’ / ‘Eph.’ because those aren’t preceded by ':' or ';'.
//  */
// function splitInlineHeadingsAfterColon(text: string): string {
//   // Insert a newline after ":" or ";" BEFORE a token that looks like a subpoint.
//   // Tokens supported:  a.  b.  1.  10.  (a)  (1)
//   // Keep the punctuation (:$1) and add the newline in $2.
//   return text
//     // After ":" or ";" then space(s) -> before [a-z].  (exclude v. by not needed: we only split after ":" / ";")
//     .replace(/([:;])\s+(?=([a-z]\.|\(\w+\)|\d+\.))/g, "$1\n")
//     // Also support em/en dash "—" followed by verse "v." with number, then colon: "—v. 9:" a common pattern
//     .replace(/(—\s*v\.\s*\d+[a-z]?:)\s+(?=([a-z]\.|\(\w+\)|\d+\.))/gi, "$1\n");
// }