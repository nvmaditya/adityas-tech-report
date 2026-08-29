import Link from "next/link";
import { notFound } from "next/navigation";
import { groupedByMonth, listByMonth } from "@/lib/reports";
import { formatDisplayDate, formatMonthLabel } from "@/lib/markdown";

export function generateStaticParams() {
  return groupedByMonth().map((g) => ({ month: g.month }));
}

export async function generateMetadata({ params }) {
  const { month } = await params;
  return { title: `${formatMonthLabel(month)} — Aditya's Tech Report` };
}

export default async function MonthPage({ params }) {
  const { month } = await params;
  const reports = listByMonth(month);
  if (!reports.length) notFound();
  const label = formatMonthLabel(month);
  return (
    <div className="frame">
      <header className="mast compact">
        <p className="kicker">
          <Link href="/">Aditya's Tech Report</Link>
        </p>
        <h1>{label}</h1>
      </header>
      <ol className="archive">
        {reports.map((r) => (
          <li key={r.date}>
            <Link href={`/report/${r.date}/`}>
              <div className="when">{formatDisplayDate(r.date)}</div>
              <h3>{r.title}</h3>
              <p>{r.lede}</p>
            </Link>
          </li>
        ))}
      </ol>
      <p className="nav">
        <Link href="/">← All reports</Link>
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
