import fs from "node:fs";
import path from "node:path";
import {
  formatMonthLabel,
  monthFromDate,
  parseFrontmatter,
  renderMarkdown,
} from "./markdown.js";

const ROOT = path.join(process.cwd(), "reports");

function norm(s) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .trim()
    .toLowerCase();
}

/** Page chrome already prints title + lede. Strip those from the markdown body. */
function stripChrome(body, { title, lede }) {
  let text = String(body ?? "").replace(/^\uFEFF/, "").trimStart();
  text = text.replace(/^#\s+.+\n+/, "");
  if (lede) {
    const first = text.match(/^(?:[\s\S]*?\n)\n|^(.+)\n+/);
    const paraMatch = text.match(/^((?:.+\n)*?.+)\n\n/);
    if (paraMatch && norm(paraMatch[1]) === norm(lede)) {
      text = text.slice(paraMatch[0].length);
    } else {
      const lines = text.split("\n");
      let i = 0;
      const buf = [];
      while (i < lines.length && lines[i].trim() !== "") {
        buf.push(lines[i]);
        i += 1;
      }
      if (norm(buf.join(" ")) === norm(lede)) {
        while (i < lines.length && lines[i].trim() === "") i += 1;
        text = lines.slice(i).join("\n");
      }
    }
  }
  return text.trimStart();
}

function loadAll() {
  if (!fs.existsSync(ROOT)) return [];
  const reports = [];
  for (const month of fs.readdirSync(ROOT)) {
    const dir = path.join(ROOT, month);
    if (!/^\d{4}-\d{2}$/.test(month) || !fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, body } = parseFrontmatter(raw);
      const date = data.date || file.replace(/\.md$/, "");
      const title = data.title || date;
      const cleaned = stripChrome(body, { title, lede: data.lede });
      reports.push({
        ...data,
        date,
        title,
        month: monthFromDate(date),
        body: cleaned,
        html: renderMarkdown(cleaned),
      });
    }
  }
  reports.sort((a, b) => (a.date < b.date ? 1 : -1));
  return reports;
}

const ALL = loadAll();

export function listReports() { return ALL; }
export function getReport(date) { return ALL.find((r) => r.date === date); }
export function listByMonth(month) { return ALL.filter((r) => r.month === month); }
export function groupedByMonth() {
  const order = [];
  const groups = new Map();
  for (const r of ALL) {
    if (!groups.has(r.month)) {
      groups.set(r.month, []);
      order.push(r.month);
    }
    groups.get(r.month).push(r);
  }
  return order.map((month) => ({
    month,
    label: formatMonthLabel(month),
    reports: groups.get(month),
  }));
}
