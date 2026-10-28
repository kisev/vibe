# Tasks

## 1. Cards without borrowed verdicts

- [ ] 1.1 Remove the `ScoreBar` accuracy/speed row from the catalog card in `models-catalog.tsx` and the score computation feeding it on the render path (`lib/catalog.ts` relative scores), keeping provider/size/languages/badges
- [ ] 1.2 Retire the `catalogAccuracy`/`catalogSpeed` strings and the `ScoreBar` component if nothing else renders it; update `models-catalog.test.tsx`

## 2. Comparison input

- [ ] 2.1 Add the comparison section to the models page: pick input by short in-place recording (reuse `use-recording`) or by audio-file dialog; show the chosen input with its duration
- [ ] 2.2 Multi-select of installed models (`listInstalledModels`), with the run disabled until two or more are chosen

## 3. Sequential runner

- [ ] 3.1 Run the selected models one after another over the existing endpoints (`/v1/models/load`, `/v1/audio/transcriptions`), identical plain options per run (language preference only), desktop wall-clock timing per model
- [ ] 3.2 Progress per run in the section; a failed run shows its reason and the remaining models still run

## 4. Outputs and results

- [ ] 4.1 Write each completed transcript as `<model-name>.md` via the auto-export markdown renderer into one `comparisons/<timestamp>-<input>/` folder
- [ ] 4.2 Result list: model, processing time, link to its markdown file (open/reveal); tests for the runner, timing capture, and failure isolation

## 5. Validation

- [ ] 5.1 Local gates green (`desktop:test`, `tsc`), then a dev build comparing two installed models on a recorded clip: two markdown files, per-model times shown, links open
