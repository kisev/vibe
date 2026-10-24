# Tasks

## 1. Dominant speaker on boundary chunks

- [x] 1.1 Add a helper that ranks a chunk's speakers by their diarization coverage of its core (ties and unrankable sets fall back to the lowest id), and derive both `speaker` and `speakers` from the plan in the verbose JSON formatter; verify with unit tests for a majority speaker, an equal split, missing ranking data, and a single-speaker chunk
- [x] 1.2 Use the same helper in the NDJSON segment event; verify a boundary chunk's event reports the dominant `speaker` and the full `speakers` union
- [x] 1.3 Verify the CLI JSON path now reports the dominant id too, since it shares the formatter; extend the existing format test to assert `speaker` on the two-speaker chunk

## 2. Unattributed speech in the contract

- [x] 2.1 Verify the planner's existing behavior matches the new scenarios: add a test that a gap without detected speech produces no chunk, and that a chunk with an empty speaker set yields segments without a planned set in the verbose JSON
- [x] 2.2 Document the behavior in `server/README.md` (one sentence: speech diarization missed is transcribed in its own input without a speaker) and verify the sentence matches the plan output
- [x] 2.3 Add the same paragraph to the long-form design record: `openspec/changes/diarization-aware-longform/design.md` while that change is active, otherwise its copy under `openspec/changes/archive/`; verify the paragraph describes the empty-set behavior

## 3. Out-of-memory error names the range

- [x] 3.1 Wrap the exhausted-split error (minimum length and depth cap) with the chunk's core range, keeping the source chain so classification still works; verify the existing split tests assert the range text
- [x] 3.2 Add a test for a resumed split where a leaf still exhausts memory; verify the message names the leaf's range, not the original chunk's

## 4. Missing test evidence

- [x] 4.1 Add a gated CLI test that transcribes the same file with and without `--cache-dir`; verify both runs produce byte-identical stdout
- [x] 4.2 Add a unit test that drives the split resolver with a runner that always exhausts memory on a chunk too short to halve; verify a second identical attempt fails with the same error and writes no part
- [x] 4.3 Add a model-gated test that calls the transcription handler with a constructed multipart request carrying junk audio and an oversized `chunk_seconds`; verify the response is `invalid_request`, not `invalid_audio`
- [x] 4.4 Split the desktop cache-directory path composition from the `AppHandle` lookup and add a unit test; verify the path ends in `transcribe-cache` under the app local data directory

## 5. Module split and wording

- [x] 5.1 Move the cached pass, the split tree, the stored-segment type, and their tests from `server/crates/vibe-server/src/server/transcription.rs` into `server/crates/vibe-server/src/server/chunk_cache.rs`; verify `transcription.rs` is under 700 lines and the full server suite still passes
- [x] 5.2 State in `server/README.md` that the planner aims at about 20 seconds per input, never exceeds the engine maximum, and that `--chunk-seconds` lowers that ceiling; verify the wording matches `Settings` defaults and the CLI help

## 6. Integration verification

- [x] 6.1 Run the full server suite with the gated models (GigaAM, Parakeet, Nemotron, diarization), plus `cargo fmt --check` and `cargo clippy`; verify zero failures and no new warnings
- [x] 6.2 Run the desktop type check and unit tests, and `cargo check --tests` for the desktop crate on Windows; verify they pass
- [x] 6.3 Confirm the cache schema version and key inputs are unchanged, so existing entries remain valid; verify by re-running the CLI cache test against a directory produced before the change

## Workflow follow-up

- Archive the change after review.
- Archive `diarization-aware-longform` once its verification warnings closed here are resolved.
