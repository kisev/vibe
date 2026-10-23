# Tasks

## 1. Crate scaffold and model loading

- [x] 1.1 Create `server/crates/gigaam-rs` with the module layout from the design, add it to the `server/` workspace and to `vibe-server` dependencies; verify `cargo check -p gigaam-rs` and `cargo check -p vibe-server` succeed
- [x] 1.2 Implement GGUF metadata parsing for architecture, variant, head kind, languages, encoder dimensions, head dimensions, and frontend parameters; verify unit tests with the real GGUF files behind env vars and with a fixture for malformed metadata
- [x] 1.3 Implement tokenizer loading and detokenization for SentencePiece and charwise vocabularies; verify unit tests decode punctuated, charwise, and byte-fallback pieces and reject a missing blank id
- [x] 1.4 Implement weight loading and device upload following `parakeet-rs`; verify a smoke test loads all four Q8_0 variants and that a non-GigaAM GGUF and an unknown head both fail with named errors
- [x] 1.5 Implement the mel frontend with the baked filterbank and window, plus frame geometry (`n_fft` 320, window 320, hop 160, no centering); verify the frame count and a tensor comparison against the reference dump within tolerance

## 2. Conformer encoder

- [x] 2.1 Implement the ggml graph helpers: layer norm, feed-forward, macaron block, depthwise conv, rotary attention; verify shape unit tests and a rotary comparison against precomputed cos/sin vectors
- [x] 2.2 Implement convolutional subsampling; verify the pre-encode output matches the reference dump
- [x] 2.3 Implement the 16 conformer blocks with rotary attention and the convolution module; verify the final encoder output matches the reference dump
- [x] 2.4 Implement the output norm and frame-to-time conversion (40 ms per frame); verify timestamps for known token frames in a unit test

## 3. Heads, decoding, and segmentation

- [x] 3.1 Implement RNN-T greedy decoding with the predictor LSTM, joint projection, blank handling, and a symbol cap; verify emitted token ids match the reference for a short Russian clip
- [x] 3.2 Implement CTC argmax with repeat and blank collapsing; verify against the reference for the CTC variants
- [x] 3.3 Implement token-to-sentence grouping with punctuation, falling back to one segment per chunk for charwise vocabularies; verify unit tests for punctuated, unpunctuated, and empty output
- [x] 3.4 Implement long-form chunking through VAD with a 24-second bound, token deduplication across chunk boundaries, abort checks, and progress callbacks; verify a synthetic long-speech test produces no input over the bound and a silence-only test returns no segments

## 4. Server engine integration

- [x] 4.1 Add the GigaAM variant to the engine enum with load and detect paths; verify both RNN-T and CTC variants load and report engine `gigaam`
- [x] 4.2 Extract one model-detection routine used by both the load path and the metadata route; verify an integration test that probing then loading reports identical engine and capabilities
- [x] 4.3 Map GigaAM to the capability fields exactly as specified; verify a metadata test asserts every field
- [x] 4.4 Add per-engine VAD options and key the VAD cache by path and options; verify GigaAM never receives a chunk over the bound and Whisper, Parakeet, and Nemotron keep the 30-second default
- [x] 4.5 Implement the Russian-only language contract and rejection of translation, prompts, and stable timestamps, with word timestamps ignored; verify engine-level tests and matching HTTP error codes
- [x] 4.6 Verify the transcription endpoint and NDJSON streaming both work for GigaAM, including segments with timestamps, and that a missing VAD model returns `invalid_request`

## 5. CLI transcription and output

- [x] 5.1 Add `--diarize-model`, `--format`, and `--output` to the `transcribe` subcommand with help text; verify `vibe-server transcribe --help` lists them
- [x] 5.2 Add Markdown and JSON transcript formatting next to the existing SRT and VTT formatters; verify formatter unit tests for text, timestamps, and speaker labels
- [x] 5.3 Implement safe output: create a new file only after successful transcription and refuse an existing path; verify tests for new file, existing file, and failed transcription
- [x] 5.4 Wire diarization into the CLI and label segments by speaker; verify a command with a diarization model produces speaker identifiers and one without it does not
- [x] 5.5 Verify the full GigaAM CLI path: `transcribe model.gguf audio.wav --vad-model silero --diarize-model sortformer --format md --output out.md` exits 0 and writes a Markdown file

## 6. HTTP API and documentation schema

- [x] 6.1 Add the GigaAM branch to the metadata endpoint through the shared detection routine; verify the endpoint returns `format: "gguf"` with GigaAM capabilities
- [x] 6.2 Verify the OpenAPI schema still validates and describes the unchanged capability fields; regenerate or inspect `/openapi.json` in an integration test
- [x] 6.3 Verify an API request with an unsupported language returns `400 unsupported_language` and no partial stream

## 7. Desktop UI and client gating

- [x] 7.1 Gate whisper-only controls (stable timestamps, word timestamps, sentence length, sampling, temperature, prompt) on a whisper engine; verify component tests for a GigaAM metadata fixture
- [x] 7.2 Add GigaAM to the model brand glyph and verify the fallback and matched renderings in tests
- [x] 7.3 Verify language selection shows only Russian with no auto-detect, VAD download is prompted, and diarization works with a mocked GigaAM metadata response
- [x] 7.4 Add user-facing strings and a model catalog entry with GigaAM download links and limitations; verify the i18n audit and the documented URL flow
- [x] 7.5 Verify the app end-to-end path (select GigaAM, batch one file, export Markdown) against a local model using the existing dev harness

## 8. Numerical validation and release

- [x] 8.1 Add the standalone reference script at `plans/add-gigaam-engine/add-gigaam-engine_001.py` with a short README; verify it dumps stage tensors and reference text for all four variants
- [x] 8.2 Add a model-gated golden test comparing Rust output to the reference transcript (normalized) and verify it passes for all four variants
- [x] 8.3 Measure WER on a FLEURS-ru subset and record the result next to the published reference; verify the measured value is not worse than the reference by more than one percentage point
- [x] 8.4 Measure real-time factor on CPU and Vulkan and record the result; verify transcription of a 10-minute recording completes without memory growth failures
- [x] 8.5 Bump the `vibe-server` version and the app's server pin; verify the release build includes the new crate and no new native libraries
- [x] 8.6 Update the models documentation, limitations, and CLI examples; verify every documented command runs as written

## 9. Verification follow-ups

- [x] 9.1 Add SRT and VTT formatter tests covering cue timing and one cue per segment
- [x] 9.2 Add a route-level metadata test asserting a `400 unsupported_model` response naming the unsupported architecture
- [x] 9.3 Add env-gated CLI tests for a GigaAM transcription, a missing VAD model, and an unsupported language
- [x] 9.4 Add env-gated CLI tests for diarized and non-diarized Markdown output
- [x] 9.5 Extract the desktop VAD-download gate into a shared helper and cover confirm, decline, and download
- [x] 9.6 Run the affected Rust and desktop test suites and confirm them green
- [x] 9.7 Translate the new models documentation and the five desktop catalog keys into every supported locale, then stamp the source hashes and pass the i18n audit

## Workflow follow-up

- Archive the change after review requirements are satisfied.
- Verify the archived specs match the implemented behavior.
