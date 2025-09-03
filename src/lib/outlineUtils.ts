import { Notice } from "obsidian";
import { linkVersesInText } from "src/commands/verseLinks";
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

// export interface OutlineFormatOptions {
//   /** Split inline subpoints like "a. … b. … (1) …" AFTER colon/semicolon or "—v. 9:", and also after sentence-ending "." before a new token */
//   splitInlineSubpoints?: boolean;       // default: true
//   /** Fix "hyphen + line break" word splits when merging lines (illus- trated → illustrated) */
//   fixHyphenatedBreaks?: boolean;        // default: true
//   /** Drop lines that are only a page number (e.g., "14") before merging */
//   dropPurePageNumberLines?: boolean;    // default: false
// }

// /** Strict port + safe improvements */
// export function formatOutlineText(text: string, opts: OutlineFormatOptions = {}): string {
//   const {
//     splitInlineSubpoints = true,
//     fixHyphenatedBreaks = true,
//     dropPurePageNumberLines = false,
//   } = opts;

//   const lines = text.split(/\r?\n/);
//   const output: string[] = [];
//   let buffer = "";

//   const isHeading = (line: string): boolean => {
//     const s = line.trim();
//     // Roman (I., II., …), Uppercase (A.), Decimal (1.), Paren ((a), (1))
//     return /^((I{1,3}|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)[\.\)]|[A-Z][\.\)]|\d+\.[\)]?|\([a-zA-Z0-9]+\))/.test(s);
//   };

//   const getMdPrefix = (item: string): string => {
//     if (/^(?:[IVXLCDM]+)[\.\)]/i.test(item)) return "##";   // Roman
//     if (/^\s*[A-Z][\.\)]/.test(item)) return "####";        // A.
//     if (/^\s*\d+\./.test(item)) return "#####";             // 1.
//     if (/^\s*[a-z]\./.test(item)) return "######";          // a.
//     if (/^\s*\(\d+\)/.test(item)) return "";                // (1)
//     if (/^\s*\([a-z]\)/.test(item)) return "";              // (a)
//     return "";
//   };

//   // ---- Hyphenated word wrap join (… "illus-" + "trated" => "illustrated")
//   const TRAILING_HYPHEN_AT_END = /[A-Za-z][\-\u2010\u2011\u2012\u2013\u2014]\s*$/;
//   const appendWithWordBreakFix = (buf: string, next: string): string => {
//     if (fixHyphenatedBreaks && TRAILING_HYPHEN_AT_END.test(buf) && /^[a-z]/.test(next)) {
//       return buf.replace(/[\-\u2010\u2011\u2012\u2013\u2014]\s*$/, "") + next;
//     }
//     return (buf + " " + next).replace(/\s+/g, " ");
//   };

//   // ---- Normalize divider dashes before verse refs to a tight em-dash: "—" (no spaces)
//   function normalizeRefDashes(s: string): string {
//     // before "v. 9", "v. 9:", etc.
//     s = s.replace(/(\S)\s*[\-\u2010\u2011\u2012\u2013\u2014]\s*(v\.\s*\d+[a-z]?:?)/gi, "$1—$2");
//     // before book+reference like "S. S. 4:11a", "Col. 1:12", "1 John 1:5"
//     s = s.replace(
//       /(\S)\s*[\-\u2010\u2011\u2012\u2013\u2014]\s*(([1-3]?\s?(?:[A-Z][a-zA-Z]*\.?|[A-Z]\.))(?:\s+[1-3]?\s?(?:[A-Z][a-zA-Z]*\.?|[A-Z]\.))*\s+\d+:\d+[a-z]?)/g,
//       "$1—$2"
//     );
//     return s;
//   }

//   // ---- Split inline subpoints (1) after :,; or em-dash before "v. 9:"  (2) after sentence "." when a new token starts
//   // Keep abbreviations like "S. S." by forbidding split when dot is part of a one-letter abbrev: (?<!\b[A-Za-z]\.)
//   const TOKEN_START_SRC = String.raw`(?:[IVXLCDM]+\.|[A-Z]\.|[a-z]\.|\d+\.|$begin:math:text$[a-zA-Z0-9]+$end:math:text$)`;
//   const AFTER_PUNCT_SPLIT_RE = new RegExp(
//     String.raw`([:;!?]|—\s*v\.\s*\d+[a-z]?:)\s+(?=` + TOKEN_START_SRC + String.raw`\s+)`,
//     "gi"
//   );
//   const AFTER_SENT_TOKEN_SPLIT_RE = new RegExp(
//     String.raw`(?<!\b[A-Za-z]\.)\.\s+(?=` + TOKEN_START_SRC + String.raw`\s+)`,
//     "g"
//   );

//   const splitInlineSegments = (line: string): string[] => {
//     // 1) split after :, ;, !?, and “— v. 9:”
//     let s = line.replace(AFTER_PUNCT_SPLIT_RE, (_m, p1: string) => `${p1}\n`);
//     // 2) split after sentence-ending dot when a token (1., a., (1), I., A.) follows
//     s = s.replace(AFTER_SENT_TOKEN_SPLIT_RE, ".\n");
//     return s.split("\n").map(x => x.trim()).filter(Boolean);
//   };

//   const emitBuffer = (buf: string) => {
//     const base = normalizeRefDashes(buf.trim());
//     if (!base) return;

//     if (!splitInlineSubpoints) {
//       output.push(base);
//       return;
//     }

//     const parts = splitInlineSegments(base);
//     for (let i = 0; i < parts.length; i++) {
//       let part = parts[i];
//       part = normalizeRefDashes(part);

//       if (i === 0) {
//         output.push(part);
//         continue;
//       }

//       // Add heading prefix for split-off subpoints
//       const m = part.match(/^((?:[IVXLCDM]+\.|[A-Z]\.|[a-z]\.|\d+\.|\([a-zA-Z0-9]+\)))\s+(.*)$/);
//       if (m) {
//         const item = m[1];
//         const content = m[2] ?? "";
//         const prefix = getMdPrefix(item);
//         output.push(`${prefix} ${item} ${content}`.trim());
//       } else {
//         output.push(part);
//       }
//     }
//   };

//   for (const line of lines) {
//     const stripped = line.trim();
//     if (!stripped) continue;
//     if (dropPurePageNumberLines && /^\d+$/.test(stripped)) continue;

//     if (isHeading(stripped)) {
//       if (buffer) emitBuffer(buffer);
//       buffer = "";

//       const firstSpace = stripped.indexOf(" ");
//       const item = firstSpace === -1 ? stripped : stripped.slice(0, firstSpace);
//       const content = firstSpace === -1 ? "" : stripped.slice(firstSpace + 1);
//       const prefix = getMdPrefix(item);
//       buffer = `${prefix} ${item} ${content}`.trim();
//     } else {
//       buffer = buffer ? appendWithWordBreakFix(buffer, stripped) : stripped;
//     }
//   }

//   if (buffer) emitBuffer(buffer);
//   return output.join("\n");
// }

// -----------------
// export interface OutlineFormatOptions {
//   /** Split inline subpoints like "a. … b. … (1) …" AFTER colon/semicolon or "—v. 9:" */
//   splitInlineSubpoints?: boolean;       // default: true
//   /** Fix "hyphen + line break" word splits when merging lines (illus- trated → illustrated) */
//   fixHyphenatedBreaks?: boolean;        // default: true
//   /** Drop lines that are only a page number (e.g., "14") before merging */
//   dropPurePageNumberLines?: boolean;    // default: false
// }

// /** Strict port of your Python plus SAFE opt-ins */
// export function formatOutlineText(text: string, opts: OutlineFormatOptions = {}): string {
//   const {
//     splitInlineSubpoints = true,
//     fixHyphenatedBreaks = true,
//     dropPurePageNumberLines = false,
//   } = opts;

//   const lines = text.split(/\r?\n/);
//   const output: string[] = [];
//   let buffer = "";

//   const isHeading = (line: string): boolean => {
//     const s = line.trim();
//     // ^((Roman)|[A-Z].|digits.|(paren))
//     return /^((I{1,3}|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)[\.\)]|[A-Z][\.\)]|\d+\.[\)]?|\([a-zA-Z0-9]+\))/.test(s);
//   };

//   const getMdPrefix = (item: string): string => {
//     if (/^(I{1,3}|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)[\.\)]/.test(item)) return "##";
//     else if (/^\s*[A-Z][\.\)]/.test(item)) return "####";
//     else if (/^\s*\d+\./.test(item)) return "#####";
//     else if (/^\s*[a-z]\./.test(item)) return "######";
//     else if (/^\s*\(\d+\)/.test(item)) return "";
//     else if (/^\s*\([a-z]\)/.test(item)) return "";
//     else return "";
//   };

//   // ---- Hyphenated word wrap join (… "illus-" + "trated" => "illustrated")
//   const TRAILING_HYPHEN_AT_END = /[A-Za-z][\-\u2010\u2011\u2012\u2013\u2014]\s*$/; // -, ‐, -, ‒, –, —
//   const appendWithWordBreakFix = (buf: string, next: string): string => {
//     if (fixHyphenatedBreaks && TRAILING_HYPHEN_AT_END.test(buf) && /^[a-z]/.test(next)) {
//       return buf.replace(/[\-\u2010\u2011\u2012\u2013\u2014]\s*$/, "") + next;
//     }
//     return (buf + " " + next).replace(/\s+/g, " ");
//   };

//   // ---- Normalize divider dashes before verse refs to a tight em-dash: "—" (no spaces)
//   function normalizeRefDashes(s: string): string {
//     // Case 1: before "v. 9", "v. 9:", "v. 9a:"
//     s = s.replace(
//       /(\S)\s*[\-\u2010\u2011\u2012\u2013\u2014]\s*(v\.\s*\d+[a-z]?:?)/gi,
//       "$1—$2"
//     );

//     // Case 2: before book+reference like "S. S. 4:11a", "Col. 1:12", "1 John 1:5"
//     // Supports chains like "1 Tim." or "Song of Songs" abbreviations with dots.
//     s = s.replace(
//       /(\S)\s*[\-\u2010\u2011\u2012\u2013\u2014]\s*(([1-3]?\s?(?:[A-Z][a-zA-Z]*\.?|[A-Z]\.))(?:\s+[1-3]?\s?(?:[A-Z][a-zA-Z]*\.?|[A-Z]\.))*\s+\d+:\d+[a-z]?)/g,
//       "$1—$2"
//     );

//     return s;
//   }

//   // ---- Split inline subpoints ONLY after ":" or ";" (or "—v. 9:"), never after "."
//   // This keeps "S. S. 4:11a" together.
//   const AFTER_PUNCT_SPLIT_RE =
//     /([:;!?]|—\s*v\.\s*\d+[a-z]?:)\s+(?=(?:[a-z]\.|[A-Z]\.|\d+\.|\([a-z0-9]+\))\s+)/gi;

//   const splitInlineAfterPunct = (line: string): string[] => {
//     const withBreaks = line.replace(AFTER_PUNCT_SPLIT_RE, (_m, p1: string) => `${p1}\n`);
//     return withBreaks.split("\n").map(s => s.trim()).filter(Boolean);
//   };

//   const emitBuffer = (buf: string) => {
//     const base = normalizeRefDashes(buf.trim());
//     if (!base) return;

//     if (!splitInlineSubpoints) {
//       output.push(base);
//       return;
//     }

//     const parts = splitInlineAfterPunct(base);
//     for (let i = 0; i < parts.length; i++) {
//       let part = parts[i];
//       part = normalizeRefDashes(part); // ensure each piece has tight em-dash to refs

//       if (i === 0) {
//         // first piece is already rendered (e.g., "#### A. ...") or plain text
//         output.push(part);
//         continue;
//       }

//       // For split-off subpoints, add heading prefix based on token
//       const m = part.match(/^((?:[A-Z]\.)|(?:[a-z]\.)|(?:\d+\.)|\([a-zA-Z0-9]+\))\s+(.*)$/);
//       if (m) {
//         const item = m[1];
//         const content = m[2] ?? "";
//         const prefix = getMdPrefix(item);
//         output.push(`${prefix} ${item} ${content}`.trim());
//       } else {
//         output.push(part);
//       }
//     }
//   };

//   for (const line of lines) {
//     const stripped = line.trim();
//     if (!stripped) continue;
//     if (dropPurePageNumberLines && /^\d+$/.test(stripped)) continue; // drop "14", "15", ...

//     if (isHeading(stripped)) {
//       if (buffer) emitBuffer(buffer);
//       buffer = "";

//       // split(maxsplit=1)
//       const firstSpace = stripped.indexOf(" ");
//       const item = firstSpace === -1 ? stripped : stripped.slice(0, firstSpace);
//       const content = firstSpace === -1 ? "" : stripped.slice(firstSpace + 1);
//       const prefix = getMdPrefix(item);
//       buffer = `${prefix} ${item} ${content}`.trim();
//     } else {
//       buffer = buffer ? appendWithWordBreakFix(buffer, stripped) : stripped;
//     }
//   }

//   if (buffer) emitBuffer(buffer);
//   return output.join("\n");
// }


// export function formatOutlineText(text: string): string {
//   const lines = text.split(/\r?\n/);
//   text = splitInlineHeadings(text);

//   const output: string[] = [];
//   let buffer = "";

//   const isHeading = (line: string): boolean => {
//     const s = line.trim();
//     return /^((I{1,3}|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)[\.\)] | [A - Z][\.\)]|\d +\.[\)] ?|\([a - zA - Z0 - 9] +\))/.test(s);
//   };

//   const getMdPrefix = (item: string): string => {
//     if (/^(I{1,3}|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)[\.\)]/.test(item)) return "##";
//     else if (/^\s*[A-Z][\.\)]/.test(item)) return "####";
//     else if (/^\s*\d+\./.test(item)) return "#####";
//     else if (/^\s*[a-z]\./.test(item)) return "######";
//     else if (/^\s*\(\d+\)/.test(item)) return "";
//     else if (/^\s*\([a-z]\)/.test(item)) return "";
//     else return "";
//   };

//   for (const line of lines) {
//     const stripped = line.trim();
//     if (!stripped) continue;

//     if (isHeading(stripped)) {
//       if (buffer) output.push(buffer.trim());
//       buffer = "";

//       const parts = stripped.split(/\s+/, 1 + 1); // maxsplit=1
//       const item = parts[0];
//       const content = parts.length > 1 ? parts[1] : "";
//       const prefix = getMdPrefix(item);
//       buffer = `${prefix} ${item} ${content}`.trim();
//     } else {
//       buffer += ` ${stripped}`;
//     }
//   }

//   if (buffer) output.push(buffer.trim());
//   return output.join("\n");
// }

// // Insert newlines before inline tokens that look like new items.
// // Avoids splitting common abbreviations like "v." by excluding it.
// function splitInlineHeadings(text: string): string {
//   return text
//     // Before A. / B. / C.
//     .replace(/\s+(?=(?:[A-Z]\.)\s)/g, "\n")
//     // Before a. / b. / c.  (but NOT v.)
//     .replace(/\s+(?=(?:(?!v\.)[a-z]\.)\s)/g, "\n")
//     // Before 1. / 2. / 3.
//     .replace(/\s+(?=(?:\d+\.)\s)/g, "\n")
//     // Before (a) / (1)
//     .replace(/\s+(?=\([a-z0-9]+\)\s)/gi, "\n");
// }


// // src/lib/outlineUtils.ts

// /** Strict 1:1 TypeScript port of your Python `format_outline` */
// export function formatOutlineText(text: string, opts?: { splitInlineAfterColon?: boolean }): string {
//   // Optional: split subpoints like "a.", "b.", "(1)" that appear AFTER a colon or semicolon.
//   // This is OFF by default so we don't break "Col.", "Eph.", etc.
//   // if (opts?.splitInlineAfterColon) {
//   text = splitInlineHeadingsAfterColon(text);
//   // }

//   const lines = text.split(/\r?\n/);
//   const output: string[] = [];
//   let buffer = "";

//   const isHeading = (line: string): boolean => {
//     const s = line.trim();
//     // ^((Roman)|[A-Z].|digits.|(paren))
//     return /^((I{1,3}|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)[\.\)]|[A-Z][\.\)]|\d+\.[\)]?|\([a-zA-Z0-9]+\))/.test(s);
//   };

//   const getMdPrefix = (item: string): string => {
//     if (/^(I{1,3}|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)[\.\)]/.test(item)) return "##";
//     else if (/^\s*[A-Z][\.\)]/.test(item)) return "####";
//     else if (/^\s*\d+\./.test(item)) return "#####";
//     else if (/^\s*[a-z]\./.test(item)) return "######";
//     else if (/^\s*\(\d+\)/.test(item)) return "";
//     else if (/^\s*\([a-z]\)/.test(item)) return "";
//     else return "";
//   };

//   for (const line of lines) {
//     const stripped = line.trim();
//     if (!stripped) continue;

//     if (isHeading(stripped)) {
//       if (buffer) output.push(buffer.trim());
//       buffer = "";

//       // split(maxsplit=1)
//       const firstSpace = stripped.indexOf(" ");
//       const item = firstSpace === -1 ? stripped : stripped.slice(0, firstSpace);
//       const content = firstSpace === -1 ? "" : stripped.slice(firstSpace + 1);

//       const prefix = getMdPrefix(item);
//       buffer = `${prefix} ${item} ${content}`.trim();
//     } else {
//       buffer += ` ${stripped}`;
//     }
//   }

//   if (buffer) output.push(buffer.trim());
//   return output.join("\n");
// }

/**
 * SAFELY split inline subpoints ONLY when they come right after a colon/semicolon,
 * e.g. “… v. 9: a. Fullness … b. When … 1. Something …”
 * This will NOT split ‘Col.’ / ‘Eph.’ because those aren’t preceded by ':' or ';'.
 */
function splitInlineHeadingsAfterColon(text: string): string {
  // Insert a newline after ":" or ";" BEFORE a token that looks like a subpoint.
  // Tokens supported:  a.  b.  1.  10.  (a)  (1)
  // Keep the punctuation (:$1) and add the newline in $2.
  return text
    // After ":" or ";" then space(s) -> before [a-z].  (exclude v. by not needed: we only split after ":" / ";")
    .replace(/([:;])\s+(?=([a-z]\.|\(\w+\)|\d+\.))/g, "$1\n")
    // Also support em/en dash "—" followed by verse "v." with number, then colon: "—v. 9:" a common pattern
    .replace(/(—\s*v\.\s*\d+[a-z]?:)\s+(?=([a-z]\.|\(\w+\)|\d+\.))/gi, "$1\n");
}





// // =====================
// // Numbering detection
// // =====================
// const ROMAN = /^(I{1,3}|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)[\.\)]\s/;
// const UPPER = /^[A-Z][\.\)]\s/;
// const LOWER = /^[a-z][\.\)]\s/;              // e.g., "a. "
// const NUMERIC = /^\d+[\.\)]\s/;              // e.g., "1. " or "10) "
// const PAREN = /^\([a-zA-Z0-9]+\)\s/;         // e.g., "(a) " "(1) "

// /** true iff the line begins a new numbered item */
// export function startsWithNumbering(line: string): boolean {
//   return ROMAN.test(line) || UPPER.test(line) || LOWER.test(line) || NUMERIC.test(line) || PAREN.test(line);
// }

// /** remove page-number-only lines and trim whitespace */
// function preprocessLines(input: string): string[] {
//   return input
//     .split(/\r?\n/)
//     .map(l => l.trim())
//     // .filter(l => l.length > 0 && !/^\d+$/.test(l)); // drop pure page numbers like "14"
// }

// /** join soft hyphenated breaks when merging (… "illus-" + "trated" → "illustrated") */
// function joinWithHyphenFix(prev: string, next: string): string {
//   // If prev ends with a hyphen-like char, drop it and don't add a space
//   if (/[‐-‒–—-]$/.test(prev)) {
//     return prev.replace(/[‐-‒–—-]$/, "") + next.replace(/^[‐-‒–—-]\s*/, "");
//   }
//   // Otherwise join with a single space
//   return (prev + " " + next).replace(/\s+/g, " ");
// }

// /**
//  * Normalize raw outline text to one logical line per numbered item:
//  * - Only start a new output line when the *current* input line begins with a numbering token
//  * - Otherwise, merge the line into the previous output line (fixing hyphenated line breaks)
//  * - Text before the first numbered item is ignored (per your rule)
//  */
// export function normalizeBreaksByNumbering(input: string): string {
//   const lines = preprocessLines(input);
//   const out: string[] = [];
//   let cur = "";
//   let haveCurrent = false; // only output once we hit first numbering

//   for (const raw of lines) {
//     const line = raw; // already trimmed
//     if (startsWithNumbering(line)) {
//       // commit previous
//       if (haveCurrent && cur) out.push(cur.trim());
//       // start new item
//       cur = line;
//       haveCurrent = true;
//     } else {
//       // merge only if we've started a numbered item; otherwise ignore preamble
//       // if (!haveCurrent) continue;
//       cur = joinWithHyphenFix(cur, line);
//     }
//   }

//   if (haveCurrent && cur) out.push(cur.trim());
//   return out.join("\n");
// }

// // =====================
// // Markdown conversion
// // =====================

// /** Map a numbering token to a Markdown heading level */
// export function mdPrefixForToken(token: string): string {
//   const roman = /^(I{1,3}|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)[\.\)]$/i;
//   const upper = /^[A-Z][\.\)]$/;
//   const lower = /^[a-z][\.\)]$/;
//   const numeric = /^\d+[\.\)]?$/;
//   const paren = /^\([a-zA-Z0-9]+\)$/;

//   if (roman.test(token)) return "##";      // top level
//   if (upper.test(token)) return "###";
//   if (numeric.test(token)) return "####";
//   if (lower.test(token)) return "#####";
//   if (paren.test(token)) return "######";
//   return "";
// }

// /** A line is an outline heading line if it starts with a numbering token */
// export function isOutlineHeadingLine(line: string): boolean {
//   const s = line.trim();
//   return ROMAN.test(s) || UPPER.test(s) || LOWER.test(s) || NUMERIC.test(s) || PAREN.test(s);
// }

// /**
//  * Convert normalized outline text (one numbered item per line) into Markdown
//  * headings based on the numbering token.
//  *
//  * If you pass raw input, this will first normalize it.
//  */
// export function formatOutlineText(input: string): string {
//   // Step 1: normalize to one numbered item per line
//   const normalized = normalizeBreaksByNumbering(input);
//   const lines = normalized.split(/\r?\n/);

//   // Step 2: convert each line to a heading based on its token
//   const out: string[] = [];

//   for (const raw of lines) {
//     const line = raw.trim();
//     if (!line) continue;

//     // must start with a numbering token
//     if (!isOutlineHeadingLine(line)) {
//       // Safety: if it slips through, append to previous line
//       if (out.length) {
//         out[out.length - 1] = joinWithHyphenFix(out[out.length - 1], line);
//       } else {
//         out.push(line);
//       }
//       continue;
//     }

//     const parts = line.split(/\s+/, 2);
//     const token = parts[0].replace(/:$/, "");
//     const rest = parts.length > 1 ? parts[1] : "";
//     const prefix = mdPrefixForToken(token);
//     const rendered = (prefix ? `${prefix} ${token} ${rest}` : line).trim();

//     out.push(rendered);
//   }

//   return out.join("\n");
// }