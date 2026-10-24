# Proposal

## Why

The record button is labelled "Записать и транскрибировать" / "Record and transcribe", but transcription after recording is off by default (`recording.autoTranscribeAfterRecording: false`) and the label never reflects that setting — it promises something the app may not do.

## What Changes

- The record button label becomes a plain "Записать" / "Record" in every shipped locale: static text with no promise about transcription.
- The label stays the same regardless of the auto-transcribe setting; no dynamic label logic is added.
- Nothing else about recording or transcription flow changes.

## Capabilities

### New Capabilities

- `record-button-label`: what the record button promises the user it will do.

### Modified Capabilities

## Impact

- `startRecord` in all desktop i18n catalogs (`i18n/desktop/*.json`), regenerated paraglide output, translation source stamps.
- `desktop/src/pages/main/components/idle-hero.tsx` keeps reading the same message key; no component logic changes.
