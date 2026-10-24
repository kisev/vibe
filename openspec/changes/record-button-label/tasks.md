# Tasks

## 1. Label change

- [ ] 1.1 Set `startRecord` in `i18n/desktop/en-US.json` to `"Record"` and in `i18n/desktop/ru-RU.json` to `"Записать"`, and translate the same key in every other shipped locale catalog (use the `/translate` skill's subagent flow); verify with `grep` that no locale's `startRecord` value still contains a "transcribe"/"транскриб" stem

## 2. Build and verify

- [ ] 2.1 Regenerate paraglide messages (`desktop/node_modules/.bin/paraglide-js compile`), stamp source hashes (`uv run scripts/content_i18n.py stamp`), and run the i18n audit; verify the audit reports no missing or stale keys
- [ ] 2.2 Verify in the running desktop app that the button renders the new label in en-US and ru-RU and that recording still starts
