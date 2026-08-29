# Aditya's Tech Report

Eight-item daily briefing. React/Next.js static site.

Live: https://nvmaditya.github.io/adityas-tech-report/

## Report files

One markdown file per day:

```
reports/YYYY-MM/YYYY-MM-DD.md
```

Example: `reports/2026-08/2026-08-29.md`

`reports/index.json` is the catalog (newest first). The site also reads every `reports/*/*.md` at build time.

## Enable GitHub Pages

Repo → Settings → Pages → Source = **GitHub Actions**. Approve the `github-pages` environment on the first workflow if GitHub asks.
