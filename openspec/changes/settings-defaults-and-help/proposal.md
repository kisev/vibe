# Proposal

## Why

Two settings that decide whether a recording is useful are off by default: loudness normalization (better accuracy per the app's own note) and speaker separation. A note about Whisper-only options renders directly under the speaker toggle for non-Whisper models, which reads as "speaker recognition is Whisper-only" — the opposite of the truth, since separation runs on its own model for every engine. A Discord community link points at a server that is not the maintainer's. And most parameters carry no explanation at all, so their meaning has to be guessed.

## What Changes

- Loudness normalization defaults to on, and "Reset audio processing" restores it on rather than off.
- Speaker separation defaults to on; a missing separation model still turns it back off with the existing migration, so nothing breaks.
- The Whisper-only note moves into the Whisper options group and is worded so it cannot read as a statement about speaker separation.
- The Discord community link and its URL are removed everywhere.
- Every settings row gets an info icon with a short, localized explanation: an existing description where one exists, a new help string where it does not.
- The main window applies the configured language and theme before its first paint, so an upgrade never shows an English frame first.

## Capabilities

- `settings-ui` (new): how the settings surfaces present and explain values.

## Impact

- `desktop/src/providers/preference.tsx`, `desktop/src/pages/settings/**`, `desktop/src/lib/config.ts`, `desktop/src/bootstrap.tsx`, `i18n/desktop/*`, tests.
