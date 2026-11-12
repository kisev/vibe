# Tasks

## 1. Generator

- [x] 1.1 Write `scripts/roadmap.py` (stdlib only) that reads `openspec/changes/*/proposal.md`, skips `archive`, extracts the change name, title and first `## Why` sentence with Markdown stripped, and writes `website/public/roadmap.json` sorted by name; verify it is deterministic and fails loudly on a malformed proposal — Done: `python3 scripts/roadmap.py` writes 19 unarchived changes to a 5842-byte file sorted by name; two consecutive runs produce the same sha256 (`bec57349…`); `uv run scripts/roadmap_test.py` exercises the malformed cases (missing `proposal.md`, missing `## Why`, empty `## Why`), each of which exits non-zero naming the path.
- [x] 1.2 Add a unit test for the generator over a temporary tree with two active changes and an archive directory; verify collected names, extracted why text, deterministic output, and the malformed/missing-proposal failures — Done: `scripts/roadmap_test.py` has 7 tests, all passing (`uv run scripts/roadmap_test.py -v`), covering sort order, archive skipping, a real proposal H1, Markdown stripping, byte-identical rendering, and the three failure modes.
- [x] 1.3 Wire the generator into `website/website.chore` before `pnpm build`; verify a build writes `website/public/roadmap.json` — Done: `website-build` runs `uv run ../scripts/roadmap.py` next to `website_links.py` and `dev_manifest.py`, before `pnpm build`; the local `website` dev task runs it too. The same command wrote the committed-tree output above. The full `website-build` chore was not run (it installs packages and fetches releases); `tsc` and vitest validate the output consumption.

## 2. Roadmap page

- [x] 2.1 Add a `Roadmap` page that loads `roadmap.json` and renders the entries with the planned-not-shipped note, a localized load-failure state, and a localized empty state — Done: `src/pages/Roadmap.tsx` fetches through `src/lib/roadmap.ts`, renders the note above the list, and shows localized `roadmap-load-failed` / `roadmap-empty` states.
- [x] 2.2 Add the `/roadmap` route and a header navigation entry; verify the nav link reaches the page — Done: route in `src/App.tsx`, link in `src/components/Nav.tsx`; a render test clicks the header link and asserts the page heading and an entry appear.
- [x] 2.3 Add a render test for the page covering entries, the note, and the failure state; verify it passes under vitest — Done: `src/lib/roadmap.test.tsx` covers entries, the planned note, the HTTP failure, malformed JSON, the empty state, and navigation; `pnpm exec vitest run` → 29 tests in 3 files pass.

## 3. Features refresh

- [x] 3.1 Update `website/src/lib/features.json` and `Features.tsx` with the fork's capabilities: model comparison lab, three update channels, embedded meeting browser, local API and agent skills, phone handoff, and site language selector; verify icons and slugs resolve — Done: six new slugs added to `features.json` and six matching icon/copy entries in `Features.tsx`; `tsc --noEmit` resolves every message and icon, and the render test in `i18n.test.ts` mounts the page in English and French.
- [x] 3.2 Correct outdated copy for formats, AI providers, privacy and model customization from the desktop settings and catalogs; verify no upstream-only surface is promised — Done: format list now matches `auto-export.tsx` (VTT/SRT/TXT/MD/JSON/CSV/DOCX/PDF/HTML), AI copy names Claude, OpenAI-compatible endpoints and Ollama (from `ai.tsx`), privacy states local transcription and no telemetry (`remove-upstream-ties`), URL copy names yt-dlp, media formats match `config.ts`, and devices copy names microphone/system-audio merging.
- [x] 3.3 Add all new English keys to `i18n/website/en-US.json`; verify `uv run scripts/check_i18n.py` reports only fallback warnings for other locales and the coverage guard passes — Done: 18 new keys (12 feature, 6 roadmap) added to en-US only; `uv run scripts/check_i18n.py` exits 0 with "passed with fallback warnings"; the string coverage guard in `i18n.test.ts` passes over the new page and nav link.

## 4. Validation

- [x] 4.1 Run `./node_modules/.bin/tsc --noEmit`, `pnpm exec vitest run`, `uv run scripts/check_i18n.py`, and the generator against the real tree; record the results — Done: tsc exits 0; vitest 29/29 pass; i18n audit exits 0 with fallback warnings; `python3 scripts/roadmap.py` writes 19 changes, 5842 bytes, first entry `app-update-controls` / "Updates are checked in the background…".
