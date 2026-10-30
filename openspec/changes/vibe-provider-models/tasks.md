# Tasks

## 1. Provider attribution

- [ ] 1.1 Add the official vibe picks id list to `desktop/src/lib/catalog.ts` (the twelve whisper handy ids from design.md) and make `providerName()` return "Vibe" for them before the owner-derived map; keep every other entry's label unchanged
- [ ] 1.2 Unit tests: every picked id renders "Vibe"; a non-picked handy entry still renders "Handy"; the three `vibe-app` entries still render "Vibe" through the owner map; an id in the list that no catalog entry carries changes nothing observable

## 2. Catalog surface

- [ ] 2.1 The settings catalog's provider filter lists "Vibe" with all fifteen ASR entries (3 vibe-app + 12 whisper), each downloadable through the existing flow; no duplicate rows appear; verify in `models-catalog.test.tsx`
- [ ] 2.2 A picked entry's card still links to its handy repository (hosting origin visible, per the spec scenario)
- [ ] 2.3 `task docs:models:check` and `task sync:catalog:check` stay green — the docs generator and the vendored-catalog staleness gate must not treat the relabel as drift

## 3. Validation

- [ ] 3.1 Desktop suites green locally: `pnpm tsc` + `pnpm test` (`desktop/`); push to main and let the Lint run (frontend-tests job) confirm
- [ ] 3.2 Live check on the next dev build: filter by Vibe shows the full line, a whisper GGUF downloads and transcribes (any fixture audio suffices)
