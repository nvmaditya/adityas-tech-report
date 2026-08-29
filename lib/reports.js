import fs from "node:fs";
import path from "node:path";
import {
  formatMonthLabel,
  monthFromDate,
  parseFrontmatter,
  renderMarkdown,
} from "./markdown.js";

const ROOT = path.join(process.cwd(), "reports");

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
      reports.push({
        ...data,
        date,
        title: data.title || date,
        month: monthFromDate(date),
        body,
        html: renderMarkdown(body),
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
