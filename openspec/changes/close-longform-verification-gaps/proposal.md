# Proposal

## Why

Verification of `diarization-aware-longform` found the contract and the code drifted in three places and left four scenarios without direct test evidence: a chunk that diarization missed loses its contract (the fix landed in code but not in any spec), the singular `speaker` on a boundary line is the lowest id rather than the speaker who actually dominates it, and an exhausted out-of-memory split reports an error that does not say which time range failed. Closing those gaps now keeps the archived long-form contract trustworthy before the next server release.

## What Changes

- Record the behavior the planner already has: speech VAD found outside every diarization turn is planned as its own chunk with an empty speaker set, so it is transcribed instead of silently dropped. Lock it with a test.
- Make `speaker` on a boundary chunk the speaker with the largest diarization coverage inside the chunk's core, with the lowest id as the tie-break; `speakers` keeps the full union. **BREAKING** for exports and any client that reads `speaker` on a boundary line — a line that named the first id may now name another speaker.
- Name the failing range when a chunk cannot be split any further: the out-of-memory error carries the chunk's start and end times.
- Add the missing test evidence: identical transcripts with the cache disabled and enabled, a run that fails on its first chunk and repeats the same error on retry, `chunk_seconds` rejected before any audio is decoded, and the desktop cache-directory path.
- Split `server/transcription.rs` (712 lines, over the project's 700-line limit): move the cached chunk pass, the split tree, and their tests into their own module.
- State the planner's target length and the engine ceiling in the server README, and add the unattributed-speech sentence to the long-recording docs in every locale.

## Capabilities

### New Capabilities

Both capabilities are introduced by `diarization-aware-longform`, which is not archived yet, so they are absent from `openspec/specs/`. This change adds requirements to them with ADDED deltas only, so syncing stays correct whichever change is archived first.

- `long-form-chunk-planning`: two requirements — speech outside diarization turns is still transcribed without a speaker set, and a boundary chunk's singular `speaker` is its dominant speaker.
- `transcription-cache`: one requirement — an out-of-memory failure that cannot be split further names the failing time range.

### Modified Capabilities

None.

## Impact

- `server/crates/vibe-server`: planner-to-segment mapping (HTTP verbose JSON and NDJSON stream), the split error text, module layout, CLI/integration tests.
- `desktop/src-tauri`: a unit test for the cache-directory helper; no behavior change.
- Docs: `server/README.md` and `i18n/docs/*/models.md` gain the unattributed-speech sentence and the target-length wording.
- Compatibility: only the singular `speaker` on multi-speaker boundary lines changes; single-speaker lines and `speakers` arrays are unaffected.
