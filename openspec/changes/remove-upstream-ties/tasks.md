# Tasks

## 1. Application

- [x] 1.1 Delete the analytics module and every call site; drop the dependency and the key/endpoint from configuration — removed `desktop/src-tauri/src/analytics/`, all `track_event*`/`track_analytics_event` call sites, and the frontend `analytics.ts` plus its settings toggle; `os_info`/`sys-locale` left the manifest (`Cargo.lock` lost only vibe's direct edges), `cargo metadata --no-deps` and `cargo fmt --check` pass.
- [x] 1.2 Remove the analytics key from the release workflow and any build/test fixture that references it — dropped `APTABASE_APP_KEY`/`APTABASE_BASE_URL` from `.github/workflows/release.yml` and the `APTABASE_KEY` rerun line from `desktop/src-tauri/build.rs`; `rg -i "aptabase"` has no app/CI/config hits.
- [x] 1.3 Delete `scripts/export_analytics.py` and the `analytics` skill; clean `docs/BUILDING.md` — both deleted, the Analytics section removed from `docs/BUILDING.md`, and `docs/ARCHITECTURE.md` no longer lists analytics.

## 2. Website

- [x] 2.1 Remove the Ko-fi dialog, supporters wall, links and their catalog keys — deleted `KofiDialog.tsx`, `SupportButton.tsx`, `WallOfLove.tsx`, their imports/props, and 4 keys from every `i18n/website/*.json`; `tsc --noEmit` green
- [x] 2.2 Delete `scripts/export_kofi_supports.py` and `website/public/kofi-supporters.json` — both files gone; `rg -i "kofi|ko-fi|donat"` is clean
- [x] 2.3 Rewrite the privacy policy for the local-only behaviour — `privacy_policy.md` states no telemetry/analytics, local logs and diagnostics, and feature-scoped network access; PDF regenerated

## 3. Validation

- [x] 3.1 `rg -i "aptabase|analytics|kofi|ko-fi"` returns only history/archive mentions — the only hits are `openspec/changes/archive/**`, this change's own notes, the privacy policy's statement that there is none, and the unreleased entry announcing the removal
- [ ] 3.2 Desktop tests, type-check, clippy and the website suite are green; a dev build is cut
