import { ALL_BOOK_TOKENS } from "./verseMap";

const bookAlt = ALL_BOOK_TOKENS.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

const ref =
  `(?:(?:${bookAlt})\\.?\\s*)?` +
  `\\d+(?:-\\d+)?:\\d+[a-z]?(?:-\\d+)?[a-z]?` +
  `(?:\\s*(?:,\\s*\\d+[a-z]?(?:-\\d+)?[a-z]?|;\\s*\\d+:\\d+[a-z]?(?:-\\d+)?[a-z]?))*`;

const verse = `\\b[Vv]v?(?:\\.|erses?)\\s*\\d+(?:-\\d+)?[a-z]?(?:\\s*(?:,|(?:,?\\s*and))\\s*\\d+(?:-\\d+)?[a-z]?)*`;
const chapter = `\\b[Cc]h(?:apters?|s?\\.)\\.?\\s*\\d+(?:-\\d+)?`;

const note =
  `\\b[Nn]otes?` +
  `(?:\\s+\\d+(?:\\s+\\d+)?(?:\\s*(?:,|;|(?:,?\\s*and))\\s*\\d+(?:\\s+\\d+)?(?:\\s+in\\s+(?:${bookAlt})\\.?\\s+\\d+)?)*)` +
  `(?:\\s+in\\s+(?:${bookAlt})\\.?\\s+\\d+)?`;

const book = `\\b(?:${bookAlt})\\b(?!\\.?\\s*\\d+)`;

export const VERSE_PATTERN = new RegExp(
  `(?<ref>${ref})|(?<verse>${verse})|(?<chapter>${chapter})|(?<note>${note})|(?<book>${book})`,
  "g"
);

export function insideObsidianLink(src: string, start: number, end: number): boolean {
  const before = src.slice(0, start);
  const after = src.slice(end);
  const open = before.lastIndexOf("[[");
  const close = before.lastIndexOf("]]");
  if (open > close) {
    const nextClose = after.indexOf("]]");
    if (nextClose !== -1) return true;
  }
  return false;
}
