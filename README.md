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

## Listen

Every report page has a Listen bar. It uses the browser's best English neural voice (Google / Microsoft when present), skips source lists and figures, highlights the paragraph being read, and lets you change speed and voice. Optional studio MP3s can be dropped at `public/audio/YYYY-MM-DD.mp3` and will be preferred when present.

## Deploy

Every push to `main` builds the Next.js export and force-pushes it to the `gh-pages` branch. GitHub Pages serves that branch. The workflow refuses to deploy if the new commit's author or committer is not `Aditya Khandelwal <138802256+nvmaditya@users.noreply.github.com>`.

Do not publish commits through the GitHub contents API. That path has attributed commits to the unrelated account `aditya` by writing `aditya@users.noreply.github.com`. Use a normal git commit with the address above, then `git push`.
