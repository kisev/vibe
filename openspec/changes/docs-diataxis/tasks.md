# Tasks

## 1. OpenSpec change

- [x] 1.1 Create `openspec/changes/docs-diataxis/` with a proposal, a `docs` capability delta, and this task list — the delta states the four purposes, the map, the fact-accuracy rule, link resolution, and the deferred site-docs work.

## 2. Repository docs restructure

- [x] 2.1 Create `docs/{tutorials,how-to,reference,explanation}/` and `docs/README.md` as the category map — 22 content pages listed with one-line descriptions and the rule that a page has one purpose.
- [x] 2.2 Move the build material: `BUILDING.md` split into `tutorials/build-and-run.md`, `how-to/check-your-change.md`, `how-to/build-the-server.md`, `how-to/update-dependencies.md`, `how-to/publish-a-release.md`, and `how-to/maintain-the-repository.md` — the obsolete raw `ncu`/`cargo upgrade` recipe and the duplicate self-signed Windows certificate section were dropped.
- [x] 2.3 Move the updater material: `UPDATER.md` split into `reference/update-channels.md`, `explanation/update-channels.md`, `how-to/publish-a-release.md`, and `how-to/cut-a-dev-build.md` — the channel table, the `-rc.<n>` semver reason, and the forward-only boundary now live on the page that owns each.
- [x] 2.4 Move the upstream material: `UPSTREAM.md` split into `how-to/sync-upstream.md` and `explanation/upstream-isolation.md` — the procedure is separate from the root-cause explanation.
- [x] 2.5 Move the meeting-browser material: `MEETING-BROWSER.md` split into `how-to/use-the-meeting-browser.md`, `reference/meeting-browser.md`, and `explanation/meeting-browser.md`.
- [x] 2.6 Move `ARCHITECTURE.md` to `reference/architecture.md`; correct the build flow (`task setup <triple>` in the release workflow) and document the native diarization helper and the handoff crates.
- [x] 2.7 Move `TRANSLATIONS.md` to `how-to/add-a-translation.md`; replace `chore check-i18n` with the `task i18n:*` targets and add the content-hash flow.
- [x] 2.8 Move `DEBUG.md` to `how-to/troubleshoot-a-crash.md`; replace the whisper.cpp comparison and `whisper_rs` log target with the current `vibe`/`vibe_server` targets, and describe Report Issue as a prefilled local action since telemetry is gone.
- [x] 2.9 Move the code-signing guides: `WINDOWS_YUBIKEY.md` → `how-to/sign-with-a-yubikey.md`, `MACOS.md` → `how-to/sign-and-notarize-macos.md`; add `how-to/sign-windows-binaries.md` for the remote YubiKey sign server that `scripts/sign.py` actually implements.
- [x] 2.10 Delete `code-signing/WINDOWS_ESIGNING.md` — the eSigner cloud-signing path and its whitelist no longer exist; the tree signs through the YubiKey server, and the script's whitelist is currently disabled.
- [x] 2.11 Add reference pages the restructure needed: `reference/repository-layout.md` and `reference/tooling.md` (the `task`/`chore` split, mise pins, git hooks). No page was left without an owner.
- [x] 2.12 Verify facts against `taskfile.yml`, `chorefile`, `server/chorefile`, `scripts/sign.py`, `scripts/channel.py`, `scripts/dev_build.py`, `.server-version`, `server/crates/vibe-server/Cargo.toml`, the Tauri configs, and `.github/workflows/` — every documented task, path, version, and workflow input exists.
- [x] 2.13 Delete the seven flat pages and `docs/code-signing/` after their content moved, so no content is duplicated.

## 3. Inbound links

- [x] 3.1 Update `README.md` (build tutorial, translation guide, crash guide, docs map).
- [x] 3.2 Update `AGENTS.md` and `CONTRIBUTE.md` to the new paths.
- [x] 3.3 Update code and workflow references: `scripts/channel.py`, `desktop/src-tauri/src/updater.rs`, `desktop/src/providers/updater.tsx`, `.github/workflows/release.yml`, and `.github/ISSUE_TEMPLATE/bug_report.yaml`.
- [x] 3.4 Update every cross-link between docs pages; verified each relative link resolves.
- [x] 3.5 Leave archived and completed OpenSpec change records untouched — they describe past work at the paths that existed then, and rewriting them would falsify the record.

## 4. Validation

- [x] 4.1 `mise exec -- markdownlint-cli2 docs/**/*.md docs/README.md README.md` — 24 files, 0 issues. The same run extended to `AGENTS.md`, `CONTRIBUTE.md`, and the change records is also clean.
- [x] 4.2 `mise exec -- mdformat --check` over every changed Markdown file — passes.
- [x] 4.3 Relative-link check over `docs/**/*.md` — every link resolves.
- [x] 4.4 Search for `docs/<path>.md` across the repository — no reference outside OpenSpec history points at a deleted page.
- [x] 4.5 Confirm no page mentions telemetry, donations, or the upstream release flow as a current feature.

## 5. Site docs (follow-up pass, after the website agents finish)

- [x] 5.1 Decided the site page set by purpose and mapped it to slugs: tutorials (`install`, `first-transcription`), how-to (`record-audio`, `transcribe-a-link`, `use-a-custom-model`, `transcribe-from-a-phone`, `summarize-transcripts`, `switch-update-channels`, `use-the-meeting-browser`), reference (`models`, `formats`, `cli`, `settings`, `update-channels`), explanation (`privacy`, `engine`, `meeting-browser`, `update-channels-design`).
- [x] 5.2 Rewrote the English sources under `i18n/docs/en-US/{tutorials,how-to,reference,explanation}/` into those 18 pages. Content moved instead of copied: the old `install.md` split into the install and first-transcription tutorials, the format/CLI/settings facts, and the recording, link, custom-model, phone, summary, update-channel, and meeting how-tos; `models.md` moved to `reference/models.md` and kept its generated catalog.
- [x] 5.3 Taught `website/src/lib/docs.ts` to read the category subdirectories, keep `pageOrder` and the `Slug` type, and derive each page title from its H1. `website/src/pages/Docs.tsx` now groups the sidebar by category and keeps the `#slug` deep links.
- [x] 5.4 Added the English category labels (`docsTutorials`, `docsHowTo`, `docsReference`, `docsExplanation`) to `i18n/website/en-US.json` and regenerated Paraglide. The four labels now exist in all 14 website locales too (Учебники / Практические руководства / Справочник / Объяснение and their counterparts); Paraglide regenerates on build.
- [x] 5.5 Revised the translated folders by deleting the 28 stale flat `install.md`/`models.md` pages under `i18n/docs/<locale>/`, because no localized page matches the new English source and the site falls back whole. No translation of the new page set exists yet, so the page translations are the follow-up task 5.8; the audit passes with fallback warnings.
- [x] 5.6 Ran `pnpm --dir website exec tsc --noEmit`, `pnpm --dir website test`, and `pnpm --dir website run build` (the typecheck and build behind `task website:typecheck` and the site build task); the new `website/src/lib/docs.test.ts` covers the navigation page set, the `#slug` deep links, every internal `/vibe/docs#…` link, and the English fallback for a locale with no translated page.
- [x] 5.7 Added the site-docs link guard to `website/src/lib/docs.test.ts`, which runs under `task website:test` in the Lint workflow. The deploy workflow itself has no separate link-check step, so no workflow step was added.
- [x] 5.8 All 18 site pages exist in the 14 website locales (`i18n/docs/<locale>/…`, 252 files, one subagent per locale). Each page is structurally identical to its English source — heading levels and count, list-item counts, table rows, fenced blocks and every link target — checked by `scripts/content_i18n.py` for the source hash after `task stamp-translations`, and by a diff of headings/lists/links against `en-US`. Formatting and markdownlint pass; `pnpm --dir website test` stays green (33 tests). The same pass corrected the `speakers` label in 12 desktop catalogs, where the audio-output device was translated as “people who speak” (ru-RU «Говорящие» → «Динамики», zh-CN 发言者 → 扬声器, and so on), plus `no-NO`; the pages use the corrected word.
