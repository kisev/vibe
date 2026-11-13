# Tasks

- [ ] 1. Loudness normalization and speaker separation default to on; the audio-processing reset restores normalization on.
- [ ] 2. The Whisper-only note moves into the Whisper options group.
- [ ] 3. Discord link, URL and catalog strings removed everywhere.
- [x] 4. SettingsRow renders an info icon with the row's explanation; rows without a description get one.
  - Verified: all 27 parameter rows in `sections/**` now pass a `description`; 23 new `info*` keys were added and `infoGpuDevice`/`autoExportInfo` reused where the text already existed. `shared.test.tsx` proves the tooltip text and that a row without a description renders no icon. Dynamic list/status rows (comparison runs, non-default meeting hosts) are not parameters and were left alone.
- [x] 5. New help strings translated into all desktop locales; `task i18n:audit` clean.
  - Verified: `parameterHelp` plus the 23 new keys exist in all 21 non-English catalogs (837 keys each); `pnpm --dir desktop i18n:generate`, `pnpm --dir desktop exec tsc --noEmit` and `mise exec -- oxfmt --check i18n/desktop` pass. `task i18n:audit` passes with one fallback warning for `recordingLongSilence`, a key added to `en-US` concurrently by another change, outside this task's strings.
- [ ] 6. The main window applies locale and theme before its first paint.
- [ ] 7. Tests: defaults, the moved note, the absence of the Discord entry, the info tooltip text, first-paint locale.
