import Link from "next/link";
import { notFound } from "next/navigation";
import { getReport, listReports } from "@/lib/reports";
import { formatDisplayDate } from "@/lib/markdown";

export function generateStaticParams() {
  return listReports().map((r) => ({ date: r.date }));
}

export async function generateMetadata({ params }) {
  const { date } = await params;
  const report = getReport(date);
  return { title: `${report?.title || date} — Aditya's Tech Report` };
}

export default async function ReportPage({ params }) {
  const { date } = await params;
  const report = getReport(date);
  if (!report) notFound();
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
      <p className="kicker">{formatDisplayDate(report.date)} · {report.month}</p>
      <article className="prose" dangerouslySetInnerHTML={{ __html: report.html }} />
      <p className="nav">
        <Link href="/">← All reports</Link>
        {" · "}
        <Link href={`/m/${report.month}/`}>{report.month} archive</Link>
      </p>
      <footer>
        <p>
          <a href="https://github.com/nvmaditya/adityas-tech-report">GitHub</a>
        </p>
      </footer>
    </div>
  );
}
