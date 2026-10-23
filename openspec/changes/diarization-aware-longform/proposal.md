# Proposal

## Why

Long recordings are currently chunked inside each engine and speakers are attributed afterwards by interval overlap, so one model input can contain several people and a line can only carry one approximate speaker. A crash, timeout, or out-of-memory failure in the middle of a multi-hour recording also forces the whole file to be transcribed again. The external pipeline this project is replacing solved both by planning chunks around diarization turns and by caching each finished chunk.

## What Changes

- Add a long-form planning stage in the server: diarization produces speaker turns, VAD produces speech pauses, and a per-engine input bound produces a chunk plan. Every planned input belongs to one speaker, or explicitly to a union of speakers at an uncertain boundary.
- Give each planned chunk a speaker set, padding, and neighbor limits; propagate the speaker set to the transcript segments produced from that chunk.
- Apply the planner to engines that consume externally chunked input (Parakeet, Nemotron, GigaAM). Whisper keeps its internal long-form path because its decoding depends on its own segmentation and prompt context.
- Fall back to the current behavior when no diarization model is supplied: VAD-only chunking and overlap-based speaker matching.
- Add an optional, content-addressed transcription cache: a chunk plan and each finished chunk result are stored under a key derived from the decoded audio, the model file, the engine, the options that affect output, and a cache schema version.
- On out-of-memory failure, split a chunk recursively and persist the split decision so a resumed run does not repeat the failed attempt.
- Expose the plan bound as `--chunk-seconds` on the CLI and `chunk_seconds` in the transcription API; expose the cache root as `--cache-dir` on the CLI and server startup, and pass an app-owned cache directory when the desktop starts the server.
- Add cache lifecycle handling: exclusive lock per cache key, atomic writes, reuse after a crash, and age-based cleanup owned by the desktop process.
- **BREAKING** for transcript output only when diarization is enabled: speaker attribution and chunk boundaries change for Parakeet, Nemotron, and GigaAM. Stored transcripts are unaffected.

Out of scope: real-time/streaming planning, speaker identification by name, and cross-model cache reuse.

## Capabilities

### New Capabilities

- `long-form-chunk-planning`: how a long recording is divided into model inputs, including diarization turns, pause-aware cuts, per-engine bounds, and speaker propagation.
- `transcription-cache`: durable reuse of a chunk plan and finished chunk results across interrupted runs, including cache identity, locking, and cleanup.

### Modified Capabilities

None. The capabilities introduced by `add-gigaam-engine` are not yet archived; this change adds to that planned behavior without changing its external contract.

## Impact

- `server/crates/vibe-server`: new planning and cache modules, transcription flow, engine chunk API, CLI flags, API form field, startup option.
- Model crates: Parakeet, Nemotron, and GigaAM gain an entry point that transcribes an explicit chunk instead of owning the VAD loop; their current entry point stays.
- `desktop/src-tauri`: passes a cache directory under the app local data directory to the server and cleans old entries.
- Desktop UI: no new modes; existing diarization toggle now yields speaker-consistent chunks.
- Storage: cache lives on disk and contains transcript text; it is opt-in for CLI/API users and app-managed for the desktop.
- Docs: long-recording behavior, cache location and cleanup, new flags.
