# Proposal

## Why

The first build the maintainer lived in for a day (1.0.0-dev.75) exposed five defects that no unit test caught: the comparison view claims zero differences on real transcripts, the update channels leak English/translated names and offer a stable build on Beta, the meeting browser opens an unusable white window that cannot be closed and depends on a `vibe://` scheme nobody else produces, the dev changelog page falls back to 1.0.0 and leaves two labels untranslated, and the local API server switch turns itself on after a restart.

## What Changes

- The word diff stops silently degrading to "no differences": long transcripts are diffed with a linear-space algorithm, and when a diff genuinely cannot be computed the view says so instead of printing `+0 −0`.
- Update channel names stay `Release` / `Beta` / `Dev` in every language, and the Beta channel only ever offers a `-rc.N` build — with no candidate released, Beta offers nothing.
- The meeting browser drops the `vibe://open/?url=` entry point, registers the app as the system handler for other apps' meeting schemes (`zoommtg:`, `msteams:`, …) behind an opt-in switch, and its window is always closeable, reporting a page that failed to load instead of showing white.
- `/changelog/dev` renders the newest dev release's notes (not the newest stable one), and the Unreleased label and the dev entry title are translated.
- The local API switch becomes a persisted intent: nothing starts the server at launch, and turning it off survives a restart.

## Capabilities

### Modified Capabilities

- `model-comparison`: the diff must cover the transcripts users actually produce.
- `app-updates`: channel names are product names, and Beta is a candidate line only.
- `meeting-browser`: entry through third-party schemes, and a window that can always be closed.
- `changelog`: the dev alias and its labels.
- `local-api`: the switch states an intent, not a process.

## Assumptions

- Channel names (`Release`, `Beta`, `Dev`) are proper names of the update lines, like `Dev`/`Beta` on other products; they are not translated.
- The beta manifest is absent rather than pointing at stable when no `-rc.N` build exists; the app treats a missing manifest as "nothing on this line".
- The meeting schemes worth handling are those that carry a web URL the browser can open (`zoommtg`, `msteams`, `webex`, `teams`); registering them is off by default and reversible.
- The API server process stays shared with transcription; the switch governs the user's intent and the startup state, and a model load for transcription does not flip it.
