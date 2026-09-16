import Link from "next/link";
import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { getReport, listReports } from "@/lib/reports";
import { formatDisplayDate } from "@/lib/markdown";
import ListenBar from "../../ListenBar";

export function generateStaticParams() {
  return listReports().map((r) => ({ date: r.date }));
}

export async function generateMetadata({ params }) {
  const { date } = await params;
  const report = getReport(date);
  return { title: `${report?.title || date} — Aditya's Tech Report` };
}

function audioFor(date) {
  const file = path.join(process.cwd(), "public", "audio", `${date}.mp3`);
  if (!fs.existsSync(file)) return null;
  const base = process.env.GITHUB_PAGES === "1" ? "/adityas-tech-report" : "";
  return `${base}/audio/${date}.mp3`;
}

export default async function ReportPage({ params }) {
  const { date } = await params;
  const report = getReport(date);
  if (!report) notFound();
  const audioSrc = audioFor(date);
  return (
    <div className="frame">
      <header className="mast compact">
        <p className="kicker">
          <Link href="/">Aditya's Tech Report</Link>
        </p>
        <h1>{report.title}</h1>
        <p className="deck">{report.lede}</p>
        <p>
          {(report.tags || []).map((t) => (
            <span key={t} className="tag">{t}</span>
          ))}
        </p>
      </header>
      <ListenBar title={report.title} lede={report.lede} audioSrc={audioSrc} />
      <p className="kicker">{formatDisplayDate(report.date)} · {report.month}</p>
      <article className="prose" dangerouslySetInnerHTML={{ __html: report.html }} />
      <p className="nav">
        <Link href="/">← All reports</Link>
        {" · "}
        <Link href={`/m/${report.month}/`}>{report.month} archive</Link>
      </p>
      <footer>
        <p>
          Made for Aditya Khandelwal, not by. Source on{" "}
          <a href="https://github.com/nvmaditya/adityas-tech-report">GitHub</a>.
        </p>
      </footer>
    </div>
  );
}
