# Proposal

## Why

The speaker-separation model is auxiliary: `listInstalledModels` filters it out of the catalog, so nothing in settings says which model the app uses for speaker separation, whether it is downloaded, or that the app pulled one. The only place it surfaces is the download question when the switch is turned on, and the "Silero VAD" file requested by other flows makes the two easy to confuse — the VAD detector decides where speech is, while diarization decides who is speaking. A machine that already had the current diarization model when it changed format also keeps the superseded artifacts forever: the startup migration sweeps them only after a fresh download, and a fresh download never happens when the current file is already usable.

## What Changes

- The Models page gains a speaker-separation group: the bundled model's name and size, whether it is installed, a verified download action when missing, and reveal-in-folder when present.
- The startup migration sweeps the superseded diarization artifacts whenever the current model is already in place, not only after a fresh download.

## Capabilities

### New Capabilities

### Modified Capabilities

- `model-catalog`: the auxiliary speaker-separation model's identity, size, and install state become visible in settings, outside the catalog of transcription models the engine can load.

## Impact

- `desktop/src/pages/settings/sections/models-speaker.tsx` (new), `models.tsx` (wiring), `desktop/src/lib/diarization-migration.ts`, their tests.
- No server code, no transcription behavior.
