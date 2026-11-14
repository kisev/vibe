# Tasks

`review-1.md` is the review report. The review ran against an earlier `HEAD`, so every finding was
first re-checked against the current tree and recorded as valid, already fixed, false positive, or
needing a decision. Only valid findings were changed; false positives and decisions are recorded in
`sweep-report.md`.

- [x] 1. Desktop backend (`desktop/src-tauri/**`): browser policy fail-open, scheme registration, meeting-browser session state, server lifecycle, recording flag.
- [x] 2. Desktop chrome and settings (`desktop/src/{windows,components,pages,providers}/**`): recording gates, blocked-host list, address bar, tooltips, update states, long-silence alert.
- [x] 3. Desktop infrastructure (`desktop/src/{app,bootstrap,lib,mock-tauri}`, `desktop/e2e`, `desktop/vite.config.ts`): config store, deep links, mock contract, diff budgets.
- [x] 4. Scripts (`scripts/**`): ffmpeg/ggml fetches, packaging, signing, upgrade, Python helpers.
- [x] 5. CI and repository configuration (`.github/**`, `taskfile.yml`, `lefthook.yml`, `renovate.json`, `pyproject.toml`): tokens, interpreters, runners, pins.
- [x] 6. Website and i18n (`website/**`, `i18n/**`): locale handling, changelog routes, roadmap loading.
- [x] 7. No finding was applied on a stale or false premise; decisions and rejected findings are listed in `sweep-report.md`.
- [x] 8. `task verify` green and `openspec validate review-sweep` passes.
