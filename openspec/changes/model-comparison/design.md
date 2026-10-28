# Design

## Context

`models-catalog.tsx` renders `ScoreBar` accuracy/speed indicators from relative scores computed in `lib/catalog.ts` against catalog-supplied benchmarks — third-party numbers that don't reflect the user's audio or hardware. Everything the lab needs already exists as building blocks: the `use-recording` hook (getUserMedia capture with visualizer), the file dialog for audio selection, `listInstalledModels` for on-disk models, the server's `POST /v1/models/load` + `POST /v1/audio/transcriptions`, and `renderExport`/`exportTranscript` in auto-export for markdown rendering and writing.

## Decisions

- **Client-side orchestration, no new server API.** The desktop already drives model loads; the lab loops `load → transcribe` per selected model over the existing endpoints. A batch server endpoint would couple the server to a settings-page concern and duplicate what two calls already express.
- **Timing is desktop wall-clock per model.** One measurement covering load-if-needed and transcription is what the user experiences when switching models; splitting it would need server timing fields for little value. The clock starts when a model's run begins and stops when its transcript returns.
- **Same plain options for every run.** The lab sends the user's language preference and nothing else — no diarization, no stable timestamps — so differences in the outputs are model differences. The lab is a judging instrument, not a second transcription screen.
- **One folder per comparison, markdown only.** Files land under a `comparisons/<timestamp>-<input-name>/` folder next to the audio-export convention, named `<model-name>.md`; links use the existing reveal-in-file-manager command. Markdown because it renders in every viewer and the user asked for it.
- **The catalog keeps its benchmark data.** The bars go away (component, score computation on the render path, `catalogAccuracy`/`catalogSpeed` strings, their tests), but the catalog file itself still carries the numbers for anyone scripting against them — the card is the thing that stops asserting them.
- **Sequential, one model in memory at a time.** The server loads a model per request path; running sequentially keeps VRAM bounded (relevant at 12 GB with large models) and gives clean per-model timing without interleaving.

## Risks / Trade-offs

- [Long inputs make comparisons slow] → the section nudges toward a short clip by showing the input duration; nothing hard-limits it, a deliberate file is the user's call.
- [First-run load time skews timing when models were already resident] → timing notes include whether a load happened; the number users compare is per-comparison anyway, same conditions for all runs in it.
- [Removing published scores loses the quick "which is big/slow" glance] → size in MB and the family name remain on the card; quality is exactly what the lab measures on real audio.

## Migration Plan

Pure addition on the models page plus a card simplification; no data migration. The i18n keys `catalogAccuracy`/`catalogSpeed` retire with the bars, new lab strings land in en-US first and ride the normal translation flow.
