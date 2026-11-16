# Tasks

## 1. Application

- [x] 1.1 Delete the analytics module and every call site; drop the dependency and the key/endpoint from configuration — removed `desktop/src-tauri/src/analytics/`, all `track_event*`/`track_analytics_event` call sites, and the frontend `analytics.ts` plus its settings toggle; `os_info`/`sys-locale` left the manifest (`Cargo.lock` lost only vibe's direct edges), `cargo metadata --no-deps` and `cargo fmt --check` pass.
- [x] 1.2 Remove the analytics key from the release workflow and any build/test fixture that references it — dropped `APTABASE_APP_KEY`/`APTABASE_BASE_URL` from `.github/workflows/release.yml` and the `APTABASE_KEY` rerun line from `desktop/src-tauri/build.rs`; `rg -i "aptabase"` has no app/CI/config hits.
- [x] 1.3 Delete `scripts/export_analytics.py` and the `analytics` skill; clean `docs/BUILDING.md` — both deleted, the Analytics section removed from `docs/BUILDING.md`, and `docs/ARCHITECTURE.md` no longer lists analytics.

## 2. Website

- [x] 2.1 Remove the Ko-fi dialog, supporters wall, links and their catalog keys — deleted `KofiDialog.tsx`, `SupportButton.tsx`, `WallOfLove.tsx`, their imports/props, and 4 keys from every `i18n/website/*.json`; `tsc --noEmit` green
- [x] 2.2 Delete `scripts/export_kofi_supports.py` and `website/public/kofi-supporters.json` — both files gone; the remaining `rg -i "kofi|ko-fi|donat"` hits are prose (the roadmap card rationale, the unreleased changelog entry, this change's own notes and the `dependency-hygiene` plan), with no component, data file or link among them
- [x] 2.3 Rewrite the privacy policy for the local-only behaviour — `privacy_policy.md` states no telemetry/analytics, local logs and diagnostics, and feature-scoped network access; PDF regenerated

## 3. Validation

- [x] 3.1 `rg -i "aptabase|analytics|kofi|ko-fi"` leaves no app, CI, config or site surface — the remaining hits are history (`openspec/changes/archive/**`), this change's own artifacts and the `dependency-hygiene` plan, the privacy policy's statement that there is none, the unreleased changelog entry announcing the removal, and the roadmap card rationale in `i18n/roadmap/*.json`; none is a link, key or code path
- [x] 3.2 Desktop tests, type-check, clippy and the website suite are green; a dev build is cut (covered by `dev.85`, cut on 1a108eac which contains this change's commits: Lint run 43632033769 is green on that commit — desktop and website suites, desktop cargo check, server clippy — and the dev build itself runs `tsc` and the release compile)
