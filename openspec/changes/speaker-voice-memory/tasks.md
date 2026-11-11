# Tasks

## 1. Speaker-embedding engine

- [ ] 1.1 Select the checkpoint against the design criteria (multilingual accuracy on Russian and English, q8 within ~100 MB, permissive license, simple CNN/ResNet graph) and export it to GGUF; verify the export reproduces the reference implementation's cosine scores on a fixed sample set with a documented tolerance
- [ ] 1.2 Implement the native inference crate for the chosen architecture (mel features, network, L2-normalized output vector), following the parakeet/nemotron crate layout; verify with a golden-vector unit test against the reference export
- [ ] 1.3 Report the new family from model metadata (engine name, embedding dimension, input constraints) and expose it through the existing metadata contract; verify metadata equals the loaded model's reported capabilities
- [ ] 1.4 Ship the model file through the catalog infrastructure with size and SHA-256 pinning; verify a downloaded file passes the integrity check and a truncation is rejected

## 2. Embeddings in the diarized transcription pass

- [ ] 2.1 Accept an optional `embedding_model` option on the transcription request and return an additive `speaker_embeddings` map (speaker index → vector) when diarization produced speakers; verify a request without the option returns no embeddings and the transcript is otherwise byte-identical
- [ ] 2.2 Aggregate per speaker from the longest speech runs within a fixed audio budget, skipping segments shorter than the minimum; verify with synthetic segments that a speaker below the budget yields no vector
- [ ] 2.3 Cover the failure path: a missing or unusable embedding model logs and omits embeddings without failing the transcription; verify with an absent file and a corrupt file

## 3. Profile store and matching

- [ ] 3.1 Implement `speaker-profiles.json` (schema version, profile id/name/timestamps/confirmed flag, sample vectors as base64 f32) with atomic writes and a per-profile sample cap; verify load/save round-trips and a corrupt file reads as "no profiles"
- [ ] 3.2 Implement matching: cosine similarity against every sample, best score plus runner-up margin, and the confirmed/auto-label rules; verify unit tests cover clear match, ambiguous runner-up, below-threshold, and a deleted profile
- [ ] 3.3 Implement profile mutations — create, rename, merge (samples move, loser disappears), delete (samples gone) — and verify each with tests on the store

## 4. Transcript integration

- [ ] 4.1 On transcript completion, match each diarized speaker and surface suggestions in the speaker-label popover with accept, reject, and pick-another actions; verify component tests for accept (name applied, profile linked), reject (name unchanged, profile untouched), and manual rename
- [ ] 4.2 Offer "Remember this voice" when the user names a speaker (on by default) and create the profile with that recording's vector; verify a named speaker produces exactly one profile carrying that name
- [ ] 4.3 Apply confirmed profiles automatically only on a clear match and never over a name typed in the current transcript; verify tests for auto-label, ambiguous fallback to suggestions, and the typed-name-wins case

## 5. Profiles management

- [ ] 5.1 Add the voice-profiles surface (names, voice counts, last heard) with rename, merge, and delete; verify component tests for the list and each action
- [ ] 5.2 Link the surface from the speaker-separation settings and cover the empty state; verify the empty state explains how profiles are created

## 6. Auxiliary model visibility

- [ ] 6.1 Show the embedding model in the speaker-separation settings next to the diarization model with name, size, installed/missing state, download, and reveal-in-folder; verify component tests for installed, missing → download → installed, and failed download
- [ ] 6.2 Keep the embedding model out of the transcription-model catalog; verify the installed-models listing and the catalog do not include it

## 7. Privacy and strings

- [ ] 7.1 Document the local voice-profile storage, what an embedding is and is not, and how deletion works; verify the privacy page names the file and the no-network guarantee
- [ ] 7.2 Add the new UI strings in en-US and translate them through the normal flow; verify `task i18n:audit` passes

## 8. Calibration and end-to-end validation

- [ ] 8.1 Calibrate thresholds and the runner-up margin on real recordings with known speakers in Russian and English; verify the chosen numbers and the false-accept/false-reject rates are recorded in this change
- [ ] 8.2 End-to-end check in a dev build: name a speaker in one recording, then transcribe a second recording with the same person and verify the name is applied automatically; a third recording with an unknown person stays unnamed
- [ ] 8.3 Verify degradation: with the embedding model removed and with diarization disabled, transcription and manual naming behave exactly as before

## Workflow follow-up

- Archive this change after 8.x passes, syncing the `speaker-voice-memory` and `model-catalog` deltas into the main specs.
