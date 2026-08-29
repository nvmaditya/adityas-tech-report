const INDEX_URL = "reports/index.json";

function $(id) {
  return document.getElementById(id);
}

function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function tagHtml(tags) {
  return (tags || []).map((t) => `<span class="tag">${t}</span>`).join("");
}

async function loadIndex() {
  const res = await fetch(INDEX_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("index missing");
  return res.json();
}

function renderHome(entries) {
  const archive = $("archive");
  const empty = $("empty");
  const latest = $("latest");
  if (!entries.length) {
    empty.hidden = false;
    return;
  }
  const [first, ...rest] = entries;
  latest.hidden = false;
  latest.innerHTML = `
    <a class="date" href="report.html?date=${first.date}">Latest · ${formatDate(first.date)}</a>
    <h2><a href="report.html?date=${first.date}">${first.title}</a></h2>
    <p>${first.lede || ""}</p>
    <p class="tag-row">${tagHtml(first.tags)}</p>
  `;
  archive.innerHTML = rest
    .map(
      (e) => `
      <li>
        <a href="report.html?date=${e.date}">
          <div class="when">${formatDate(e.date)}</div>
          <h3>${e.title}</h3>
          <p>${e.lede || ""}</p>
        </a>
      </li>`
    )
    .join("");
}

function stripFrontmatter(md) {
  if (!md.startsWith("---")) return md;
  const end = md.indexOf("\n---", 3);
  if (end === -1) return md;
  return md.slice(end + 4).trim();
}

async function renderReport() {
  const params = new URLSearchParams(location.search);
  const date = params.get("date");
  if (!date) {
    $("title").textContent = "Missing date";
    return;
  }
  const [mdRes, index] = await Promise.all([
    fetch(`reports/${date}.md`, { cache: "no-store" }),
    loadIndex().catch(() => []),
  ]);
  if (!mdRes.ok) {
    $("title").textContent = "Report not found";
    $("lede").textContent = date;
    return;
  }
  const meta = (index || []).find((e) => e.date === date) || {};
  $("title").textContent = meta.title || formatDate(date);
  $("lede").textContent = meta.lede || "";
  $("tags").innerHTML = tagHtml(meta.tags);
  $("raw").href = `reports/${date}.md`;
  document.title = `${meta.title || date} — Aditya's Tech Report`;
  const md = stripFrontmatter(await mdRes.text());
  $("body").innerHTML = window.marked.parse(md);
}

document.addEventListener("DOMContentLoaded", () => {
  const page = location.pathname.split("/").pop();
  if (page === "report.html") {
    renderReport().catch((err) => {
      $("title").textContent = "Could not load report";
      $("lede").textContent = String(err);
    });
  } else {
    loadIndex()
      .then(renderHome)
      .catch(() => {
        $("empty").hidden = false;
      });
  }
});
