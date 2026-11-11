# Design

## Context

`models-catalog.tsx` renders `ScoreBar` accuracy/speed indicators from relative scores computed by `entryScores` in `lib/catalog.ts` against catalog-supplied benchmarks — third-party numbers that don't reflect the user's audio or hardware. This design is written against the post-sync tree (upstream v3.3.0 merged): the card's provider label comes from `providerOf()` in `lib/catalog.ts`, which groups the 12 official whisper picks under the Vibe provider, so the card the lab sits next to already attributes the whole whisper line to Vibe. Everything the lab needs already exists as building blocks: the `use-recording` hook in `pages/home/hooks` (getUserMedia capture with visualizer), the file dialog for audio selection, `listInstalledModels` in `lib/model.ts` for on-disk models (the listing already excludes auxiliary VAD/diarization/embedding/segment files, so diarization models can't be picked), the server's `POST /v1/models/load` + `POST /v1/audio/transcriptions`, and `renderExport`/`exportTranscript` in `lib/auto-export.ts` for markdown rendering and writing.

## Decisions

- **Client-side orchestration, no new server API.** The desktop already drives model loads; the lab loops `load → transcribe` per selected model over the existing endpoints. A batch server endpoint would couple the server to a settings-page concern and duplicate what two calls already express.

- **Timing is desktop wall-clock per model.** One measurement covering load-if-needed and transcription is what the user experiences when switching models; splitting it would need server timing fields for little value. The clock starts when a model's run begins and stops when its transcript returns.

- **Same options for every run; the option set is the user's choice.** The lab sends the user's language preference and, once per comparison, the user's switch for speaker separation. Separated transcripts are labelled by voice, and marking who said what is what makes two transcripts comparable at all; the option applies identically to every run, so the difference between columns is still the model. When the separate diarization model is installed and usable the switch is on by default, because a wall of unlabelled text is the failure the first live run showed; when the model is absent the switch is not offered and the runs stay plain. Engines that cannot plan their input without a VAD model receive the same bundled silero file the app already uses for bounded models; that is an engine necessity rather than a setting, and every model that needs it gets the identical file. Diarized runs do spawn the `vibe-diarize-native` helper, and that time is inside the per-model wall clock because it is time every compared model pays equally. The lab is a judging instrument, not a second transcription screen.

- **One folder per comparison, markdown only.** Files land under a `comparisons/<timestamp>-<input-name>/` folder next to the audio-export convention, named `<model-name>.md`; links use the existing reveal-in-file-manager command. Markdown because it renders in every viewer and the user asked for it.

- **The catalog keeps its benchmark data.** The bars go away (component, score computation on the render path, `catalogAccuracy`/`catalogSpeed` strings, their tests), but the catalog file itself still carries the numbers for anyone scripting against them — the card is the thing that stops asserting them.

- **Sequential, one model in memory at a time.** The server loads a model per request path; running sequentially keeps VRAM bounded (relevant at 12 GB with large models) and gives clean per-model timing without interleaving.

- **Results live in memory and open on a full-window surface.** The runner keeps each completed run's segments alongside its seconds and file path, so the results view needs no file parsing and reflects exactly what was measured. The view is a full-screen dialog inside the settings surface, opened by a "Compare results" action once at least one run completed: one column per model with its time, word count, transcript, and file reveal. A word-level LCS diff against a selectable baseline highlights missed and extra words; past a token cap the view shows plain text instead of building an unbounded table. The written markdown files stay the durable artifacts; the view is the quick read. Three layout rules come from the first live run: each column owns a vertical scroll region (`min-h-0` on every flex ancestor, `overflow-y-auto` on the text) so a long transcript never pushes the header away or collapses the column; the header reserves trailing space (`pe-16`) so the dialog's close control never sits on the highlight switch; and every non-baseline column shows its added/removed word counts, so a diff that renders subtly still states how different the texts are. The transcript text is built one line per segment with the speaker prefix when separation ran, and that same string feeds the diff, so a speaker change is a visible difference too.

- **Names come from the catalog, not from file names, when the catalog knows the file.** `getModelDisplayName` matches an installed file against the catalog and renders the canonical entry name with its quantization key (`GigaAM v3 E2E-RNN-T · Q8_0`). Auxiliary models carry their project names (`Nemotron-3-Diarization Q8_0`), and unknown files fall back to a reading of the file name that keeps acronyms (`GigaAM`, `RNNT`, `E2E`) and the quantization spelling (`Q8_0`, `Q4_K_M`) instead of title-casing every token.

## Risks / Trade-offs

- [Long inputs make comparisons slow] → the section nudges toward a short clip by showing the input duration; nothing hard-limits it, a deliberate file is the user's call.
- [First-run load time skews timing when models were already resident] → timing notes include whether a load happened; the number users compare is per-comparison anyway, same conditions for all runs in it.
- [Removing published scores loses the quick "which is big/slow" glance] → size in MB and the family name remain on the card; quality is exactly what the lab measures on real audio.

## Migration Plan

Pure addition on the models page plus a card simplification; no data migration. The i18n keys `catalogAccuracy`/`catalogSpeed` retire with the bars, new lab strings land in en-US first and ride the normal translation flow.
