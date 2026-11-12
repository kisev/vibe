# Tasks

## 1. Comparison diff

- [ ] 1.1 Replace the LCS table with a linear-space diff and raise the token budget; when the budget is still exceeded, return a marker the view renders as a note
- [ ] 1.2 Render the note in the column header (translated) instead of `+0 −0`, with tests covering long and pathological inputs
- [ ] 1.3 Verify on a real 10+ minute comparison that counts are non-zero and the highlights match the visible differences

## 2. Update channels

- [x] 2.1 Render `Release` / `Beta` / `Dev` as literals; drop the three catalog keys from every desktop locale — 2026-11-12: literals in `updater-controls.tsx`, 66 keys removed across 22 locales, paraglide regenerated, controls tests pass
- [x] 2.2 `scripts/channel.py` writes beta only for `-rc.N` versions; stable promotion no longer copies into beta — 2026-11-12: `accepts()` rejects a non-rc version for beta and the stable→beta block is gone; `--self-test` asserts `1.0.0` rejected and `1.1.0-rc.1` accepted
- [x] 2.3 Remove `website/public/updater/beta.json` while no candidate exists; the app treats a missing manifest as "no update on this line" — 2026-11-12: file removed with `git rm`; `update_check` probes the URL on `ReleaseNotFound` and returns `None` for 404/410 (`absent_status` test)
- [x] 2.4 Update `docs/UPDATER.md`, the `channel.py` self-test, and the updater-controls tests — 2026-11-12: doc says beta is candidate-only and stable promotion leaves it alone; self-test and controls tests updated

## 3. Meeting browser

- [x] 3.1 Drop the `vibe://open/?url=` handling and its single-instance plumbing — `parseBrowserDeepLink` removed; launch arguments go through `open_meeting_link` (`desktop/src/lib/use-single-instance.tsx`, `use-deep-links.tsx`)
- [x] 3.2 Register `zoommtg`, `msteams`, `teams`, `webex` handlers behind an opt-in setting; map each to its web URL — `desktop/src-tauri/src/meeting_schemes.rs` + `custom_protocol.rs`, toggle in the meeting settings
- [x] 3.3 Make the meeting window closeable through native window controls; show a failure state with retry and close when the page does not load — the React bar is gone; the window carries a native menu (back/forward/reload/external/close) and the close-confirmation dialog lives in the main window
- [ ] 3.4 Verify the menu and close on Windows; verify a Zoom/Teams link arrives from the system

## 4. Dev changelog

- [x] 4.1 `/changelog/dev` renders the newest dev release notes; stable is only the fallback — `findDevRelease` returns the `unreleased` dev entry whenever it has bullets and falls back to the newest stable release only when it is empty (`website/src/lib/changelog.ts:128`)
- [x] 4.2 Translate the Unreleased heading and the unreleased entry title through the website catalog — new `changelogUnreleased` / `changelogUnreleasedTitle` keys in `i18n/website/en-US.json` and `ru-RU.json`, rendered in `website/src/pages/Changelog.tsx`
- [x] 4.3 Populate the unreleased entry with the current dev notes; update the audit expectations — `i18n/changelog/unreleased.md` now carries 10 user-facing bullets through dev.75; `content_i18n.py` already excludes the unreleased entry from expected locale translations, so no audit change was needed

## 5. Local API intent

- [x] 5.1 Persist `api.enabled`; the switch reads and writes it
- [x] 5.2 Start the server at launch only when the intent is on; stop a leaked process when it is off
- [x] 5.3 Cover the restart and transcription scenarios in tests

## 6. Validation

- [ ] 6.1 Desktop tests, type-check, clippy and the website suite are green
- [ ] 6.2 Ship dev.76 and verify each item on the installed build
