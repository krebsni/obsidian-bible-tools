export function articleStyle(name: string): string {
  if (name.endsWith(", The")) return `The ${name.slice(0, -5)}`;
  if (name.endsWith(", A"))   return `A ${name.slice(0, -3)}`;
  return name;
}

export function nowStamp(): string {
  const d = new Date();
  const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleDateString(undefined, { month: "long" });
  const year = d.getFullYear();
  const time = d.toLocaleTimeString(undefined, { hour12: false });
  return `${weekday}, ${day}. ${month} ${year}, ${time}`;
}

export function ensureNewline(s: string): string {
  return s.endsWith("\n") ? s : s + "\n";
}
