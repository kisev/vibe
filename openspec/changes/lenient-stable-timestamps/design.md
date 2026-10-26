# Design

## Context

`validate_request` rejects every option the loaded family cannot honor before audio decode. The desktop gates its stable-timestamps toggle on the model's capabilities, but only once they resolve: with `modelMetadata` still null the toggle stays effectual and the persisted preference sends `stable_timestamps: true` — on GigaAM that request failed outright. The gate already ignores `word_timestamps` silently; stable timestamps are the same kind of option (a quality enhancement whisper applies via `condition_on_previous_tokens`), not a semantic one like translate or prompts.

## Decisions

- **Downgrade, don't widen the desktop gate.** The server is the authority and the same leak exists for every client (API users, CLI); making the gate lenient fixes all paths at once. The desktop's "missing capabilities keep the control" rule stays: it is forward-compat by design and now harmless.
- **Mutate the options through validation.** `validate_request(&mut TranscribeOptions)` drops the flag in place, so `transcribe`, `transcribe_stream`, the HTTP handler, and the CLI all carry the post-drop value into the chunk cache — a cached run keyed by `true` would poison lookups from clients that later send the flag again after learning it is unsupported.
- **Word-timestamps precedent.** The ignore-with-warning behavior mirrors the existing `word_timestamps` handling one screen over in the same test file, so no new pattern is introduced.

## Risks / Trade-offs

- [A user who explicitly wanted stabilized timestamps gets plain ones without a hard failure] → the warning is in the server log and the UI already hides the control once capabilities resolve; a silent quality difference beats a dead transcription.

## Migration Plan

One commit: engine gate change, mutable call sites, updated tests. Validation is a dev build whose GigaAM transcription with the leaked flag succeeds on the GPU.
