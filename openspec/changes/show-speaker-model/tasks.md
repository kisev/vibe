# Tasks

## 1. Visible state

- [x] 1.1 Add the speaker-separation group to the Models page: the bundled model's name (`Nemotron-3-Diarization Q8_0`), its size, and installed/missing state, with reveal-in-folder when installed and a verified download action when missing
- [x] 1.2 Keep the catalog the last thing on the page and the group above the comparison lab, so the long list still has nothing below it
- [x] 1.3 Sweep the superseded diarization artifacts at startup when the current model is already usable, not only after a fresh download — and whatever the speaker-separation preference says, since the leftover files are dead weight either way
- [x] 1.4 Tests: installed state with its size and reveal-in-folder, missing → download → installed, failed download stays missing, the download still working after a failed check, the legacy sweep on an already-installed model (leaving the current model untouched), and the startup sweep as a no-op when the current model is absent

## 2. Validation

- [x] 2.1 Dev build on Windows: the row names Nemotron-3-Diarization, reports Installed (the machine has the file), and the leftover `diar_streaming_sortformer_4spk-v2.1-Q8_0.gguf` is gone from the models folder after startup (2026-11-15: confirmed by the maintainer on the installed local build — the speaker row named the model as installed and no leftover sorting model appeared after startup.)
