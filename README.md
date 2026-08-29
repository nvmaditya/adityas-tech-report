# Aditya's Tech Report

Eight-item daily briefing. Last twenty-four hours. AI, startups, launches, industry shifts, and the occasional take that is actually moving conversation.

Live site (after GitHub Pages is on): https://nvmaditya.github.io/adityas-tech-report/

## Layout

- `reports/YYYY-MM-DD.md` — the briefing
- `reports/index.json` — catalog, newest first
- `index.html` / `report.html` — blog UI

## Publish

The Grok skill `aditya-tech-report` writes the markdown + catalog and pushes to `main`.

## Pages

Settings → Pages → Source = GitHub Actions (workflow in `.github/workflows/pages.yml`). First enable may take a minute after the first successful workflow.
