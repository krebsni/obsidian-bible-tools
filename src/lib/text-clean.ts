/** Remove empty lines after trimming each line (keeps only non-empty). */
export function stripAndRemoveEmptyLines(input: string | string[]): string {
  const lines = Array.isArray(input) ? input : input.split(/\r?\n/);
  const out: string[] = [];
  for (const raw of lines) {
    const s = raw.trim();
    if (s.length) out.push(s);
  }
  return out.join("\n");
}

/**
 * Trim each line and collapse consecutive blank lines.
 * @param input string or array of lines
 * @param maxConsecutive how many blank lines to keep in a row (default 1)
 */
export function stripAndCollapseBlankLines(input: string | string[], maxConsecutive = 1): string {
  const lines = Array.isArray(input) ? input : input.split(/\r?\n/);
  const out: string[] = [];
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