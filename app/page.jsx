import Link from "next/link";
import { groupedByMonth, listReports } from "@/lib/reports";
import { formatDisplayDate } from "@/lib/markdown";

export default function Home() {
  const reports = listReports();
  const groups = groupedByMonth();
  const latest = reports[0];
  const rest = latest
    ? groups
        .map((g) => ({ ...g, reports: g.reports.filter((r) => r.date !== latest.date) }))
        .filter((g) => g.reports.length)
    : groups;

  return (
    <div className="frame">
      <header className="mast">
        <p className="kicker">Daily briefing</p>
        <h1>Aditya's Tech Report</h1>
        <p className="deck">
          Eight items from the last twenty-four hours. Hacker News, Reddit, Product Hunt, X, and the trades — cut down to what a working engineer or founder should actually know.
        </p>
      </header>
      <main>
        {latest ? (
          <section className="latest">
            <Link className="date" href={`/report/${latest.date}/`}>
              Latest · {formatDisplayDate(latest.date)}
            </Link>
            <h2>
              <Link href={`/report/${latest.date}/`}>{latest.title}</Link>
            </h2>
            <p>{latest.lede}</p>
            <p>
              {(latest.tags || []).map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </p>
          </section>
        ) : (
          <p>No reports published yet.</p>
        )}
        {rest.map((g) => (
          <section key={g.month}>
            <div className="section-label">
              <span>{g.label}</span>
              <Link href={`/m/${g.month}/`}>All {g.month}</Link>
            </div>
            <ol className="archive">
              {g.reports.map((r) => (
                <li key={r.date}>
                  <Link href={`/report/${r.date}/`}>
                    <div className="when">{formatDisplayDate(r.date)}</div>
                    <h3>{r.title}</h3>
                    <p>{r.lede}</p>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </main>
      <footer>
        <p>
          Made for Aditya Khandelwal, not by. Source on{" "}
          <a href="https://github.com/nvmaditya/adityas-tech-report">GitHub</a>.
        </p>
      </footer>
    </div>
  );
}
