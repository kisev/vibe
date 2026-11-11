# Tasks

## 1. Visible state

- [x] 1.1 Add the speaker-separation group to the Models page: the bundled model's name (`Nemotron-3-Diarization Q8_0`), its size, and installed/missing state, with reveal-in-folder when installed and a verified download action when missing
- [x] 1.2 Keep the catalog the last thing on the page and the group above the comparison lab, so the long list still has nothing below it
- [x] 1.3 Sweep the superseded diarization artifacts at startup when the current model is already usable, not only after a fresh download
- [x] 1.4 Tests: installed state, missing → download → installed, failed download stays missing, and the legacy sweep on an already-installed model

## 2. Validation

- [ ] 2.1 Dev build on Windows: the row names Nemotron-3-Diarization, reports Installed (the machine has the file), and the leftover `diar_streaming_sortformer_4spk-v2.1-Q8_0.gguf` is gone from the models folder after startup
