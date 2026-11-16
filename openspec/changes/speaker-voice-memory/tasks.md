# Tasks

## 1. Speaker-embedding engine

- [ ] 1.1 Select the checkpoint against the design criteria (multilingual accuracy on Russian and English, q8 within ~100 MB, permissive license, simple CNN/ResNet graph) and export it to GGUF; verify the export reproduces the reference implementation's cosine scores on a fixed sample set with a documented tolerance
- [ ] 1.2 Implement the native inference crate for the chosen architecture (mel features, network, L2-normalized output vector), following the parakeet/nemotron crate layout; verify with a golden-vector unit test against the reference export
- [ ] 1.3 Report the new family from model metadata (engine name, embedding dimension, input constraints) and expose it through the existing metadata contract; verify metadata equals the loaded model's reported capabilities
- [ ] 1.4 Ship the model file through the catalog infrastructure with size and SHA-256 pinning; verify a downloaded file passes the integrity check and a truncation is rejected

## 2. Embeddings and excerpts in the diarized pass

- [ ] 2.1 Accept an optional `embedding_model` option on the transcription request and return additive `speaker_embeddings` (speaker index → vector) and `speaker_excerpts` (speaker index → temporary wav path, longest run capped at 15 s) when diarization produced speakers; verify a request without the option returns neither field and the transcript is otherwise byte-identical
- [ ] 2.2 Aggregate per speaker from the longest speech runs within a fixed audio budget, skipping segments shorter than the minimum; verify with synthetic segments that a speaker below the budget yields no vector and an excerpt of at most 15 s
- [ ] 2.3 Clean the excerpt files with the other transcription temporaries and cover the failure path: a missing or unusable embedding model logs and omits embeddings without failing the transcript; verify with an absent file and a corrupt file

## 3. Profiles, calibration, and matching

- [ ] 3.1 Implement `speaker-profiles.json` (schema version, profile id/name/timestamps/samples as base64 f32) with atomic writes and a per-profile sample cap; verify load/save round-trips and a corrupt file reads as "no profiles"
- [ ] 3.2 Implement similarity-to-confidence calibration: piecewise-linear knots fitted on labelled recordings and stored per embedding model, mapping cosine similarity to 0–100 with the 25-point bands; verify a calibration test set lands in the intended bands and the mapping is monotonic
- [ ] 3.3 Implement matching: best profile plus runner-up margin (10 points) feeding the thresholds `autoNameAt` (default 75) and `askAt` (default 50), read from settings; verify unit tests for auto, confirm, undetermined, runner-up ambiguity, and a deleted profile
- [ ] 3.4 Implement profile mutations — create, rename, merge (samples move), delete — and verify each with tests on the store

## 4. The speaker list in the transcript

- [ ] 4.1 Add the speakers panel: every diarized voice with its name or "could not determine", confidence band and percentage, candidate profiles, and actions accept / rename / pick another profile / reject; verify component tests for matched, pending-confirmation, undetermined, and overridden states
- [ ] 4.2 Apply the naming policy on transcript open: automatic names at or above `autoNameAt`, filled-but-unconfirmed between the thresholds, undetermined below `askAt`; never override a name typed in the transcript; verify all three paths
- [ ] 4.3 Offer "Remember this voice" when a name is given (on by default) and link confirmed matches to the existing profile; verify a named speaker creates exactly one profile and a confirmed match adds no duplicate
- [ ] 4.4 Make the panel reachable from the transcript speaker chips and keep it usable when diarization produced a single speaker; verify both entries open the same panel

## 5. Sample playback

- [ ] 5.1 Play a speaker's excerpt from its row with a single shared audio element, stopping the current excerpt when another starts, and expose stop; verify with two speakers that only one plays at a time and stop releases it
- [ ] 5.2 Show an unavailable state when a speaker has no excerpt (too short or missing file); verify the play action is disabled with the reason

## 6. Settings and auxiliary model

- [ ] 6.1 Add the dedicated voice-profiles settings section (top-level, not a subpage) listing names, recordings heard, and last heard, with rename, merge, and delete; verify component tests for the list and each action
- [ ] 6.2 Add the two threshold settings (`autoNameAt` 75, `askAt` 50) with validation (ask ≤ auto) and a short explanation of the bands; verify a changed threshold affects the next transcript without a restart
- [ ] 6.3 Show the embedding model in the speaker-separation settings next to the diarization model with name, size, installed/missing state, download, and reveal-in-folder; verify component tests for installed, missing → download → installed, and failed download

## 7. Privacy and strings

- [ ] 7.1 Document the local voice-profile storage, what an embedding is and is not, deletion, and the temporary excerpts; verify the privacy page names the file and the no-network guarantee
- [ ] 7.2 Add the new UI strings in en-US and translate them through the normal flow; verify `task i18n:audit` passes

## 8. Calibration and validation

- [ ] 8.1 Calibrate the confidence curve and the runner-up margin on real recordings with known speakers in Russian and English; verify the chosen knots and the false-accept/false-reject rates per band are recorded in this change
- [ ] 8.2 End-to-end: name a speaker in one recording, transcribe a second recording with the same person, and verify auto-naming at or above the threshold, the confirmation band, and the undetermined state on an unknown voice
- [ ] 8.3 Verify degradation: with the embedding model removed and with diarization disabled, transcription and manual naming behave exactly as before

## 9. Live acceptance (user checkpoints)

- [ ] 9.1 Live review of the speaker list on a real meeting: every speaker has a name, a pending confirmation, or an undetermined state; report what should change
- [ ] 9.2 Live review of the confidence bands and thresholds: automatic names are right often enough, the confirmation band is genuinely uncertain, and below-threshold speakers are not guessed
- [ ] 9.3 Live review of excerpt playback: 10–15 s per speaker, clear enough to recognize the voice, one excerpt at a time, stop works
- [ ] 9.4 Live review of overrides and profiles management: an automatic name can be replaced, a rejected match leaves the profile untouched, merge and delete behave as expected; report what should change before archiving

## Workflow follow-up

- Archive this change after 8.x and 9.x pass, syncing the `speaker-voice-memory` and `model-catalog` deltas into the main specs.
