# Tasks

## 1. Cards without borrowed verdicts

- [x] 1.1 Remove the `ScoreBar` accuracy/speed row from the catalog card in `models-catalog.tsx` and the score computation feeding it on the render path (`entryScores` relative scores in `lib/catalog.ts`), keeping provider/size/languages/badges
- [x] 1.2 Retire the `catalogAccuracy`/`catalogSpeed` strings and the `ScoreBar` component if nothing else renders it; update `models-catalog.test.tsx`

## 2. Comparison input

- [x] 2.1 Add the comparison section to the models page: pick input by short in-place recording (reuse `use-recording`) or by audio-file dialog; show the chosen input with its duration. 2026-11-11: the section sits above the catalog, and the catalog is the last thing on the page — it is the long list, and scrolling past it to reach anything is the wrong order
- [x] 2.2 Multi-select of installed models (`listInstalledModels` — the listing already excludes auxiliary VAD/diarization/embedding/segment files), with the run disabled until two or more are chosen

## 3. Sequential runner

- [x] 3.1 Run the selected models one after another over the existing endpoints (`/v1/models/load`, `/v1/audio/transcriptions`), identical plain options per run (language preference, plus the bundled VAD model for engines that require one — no diarization, so the `vibe-diarize-native` helper never spawns), desktop wall-clock timing per model. 2026-11-11: the first live run failed on both GigaAM and Parakeet with `'vad_model' is required for this transcription engine`; the IO now asks `get_model_metadata` for each model and supplies `ggml-silero-v6.2.0.bin` from the models folder when `requires_vad` is set
- [x] 3.2 Progress per run in the section; a failed run shows its reason and the remaining models still run

## 4. Outputs and results

- [x] 4.1 Write each completed transcript as `<model-name>.md` via the auto-export markdown renderer into one `comparisons/<timestamp>-<input>/` folder
- [x] 4.2 Result list: model, processing time, link to its markdown file (open/reveal); tests for the runner, timing capture, and failure isolation

## 5. Validation

- [ ] 5.1 Local gates green (`desktop:test`, `tsc`), then a dev build comparing two installed models on a recorded clip: two markdown files, per-model times shown, links open
