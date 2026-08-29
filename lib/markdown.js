import { marked } from "marked";

marked.setOptions({ gfm: true });

export function renderMarkdown(md) {
  return marked.parse(md, { async: false });
}

export function parseFrontmatter(raw) {
  const trimmed = raw.replace(/^\uFEFF/, "");
  if (!trimmed.startsWith("---")) throw new Error("missing frontmatter");
  const end = trimmed.indexOf("\n---", 3);
  if (end === -1) throw new Error("unclosed frontmatter");
  const yaml = trimmed.slice(4, end).trim();
  const body = trimmed.slice(end + 4).replace(/^\s+/, "");
  const data = { date: "", title: "", lede: "", item_count: 8, tags: [] };
  let list = null;
  for (const line of yaml.split("\n")) {
    if (/^\s+-\s+/.test(line) && list) {
      list.push(line.replace(/^\s+-\s+/, "").trim());
      continue;
    }
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, valRaw] = m;
    const val = valRaw.trim();
    if (key === "tags") {
      data.tags = [];
      list = data.tags;
    } else if (key === "item_count") {
      list = null;
      data.item_count = Number(val) || 8;
    } else if (["date", "title", "lede", "notes"].includes(key)) {
      list = null;
      data[key] = val.replace(/^["']|["']$/g, "");
    } else list = null;
  }
  return { data, body };
}

export function monthFromDate(date) {
  return date.slice(0, 7);
}

export function formatDisplayDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatMonthLabel(month) {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}
