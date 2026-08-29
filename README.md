# Aditya's Tech Report

Eight-item daily briefing. React/Next.js static site, published to GitHub Pages.

Live: https://nvmaditya.github.io/adityas-tech-report/

## Report files

One markdown file per day:

```
reports/YYYY-MM/YYYY-MM-DD.md
```

Example: `reports/2026-08/2026-08-29.md`

`reports/index.json` is the catalog (newest first). The site also reads every `reports/*/*.md` at build time.

## Deploy

Every push to `main` builds the Next.js export and deploys via GitHub Actions. The workflow enables Pages on first run (`build_type: workflow`) so Settings does not have to be clicked by hand.

If a run is stuck on the `github-pages` environment, open the Actions tab and approve the deployment.
