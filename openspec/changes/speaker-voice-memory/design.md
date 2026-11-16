# Design

## Context

Diarization runs NVIDIA Nemotron-3-Diarization through `server/crates/nemotron-diarize-rs`: an end-to-end speaker head that outputs per-frame speaker probabilities and derives segments with a zero-based `speaker` index. Its speaker cache and hidden states are per-recording slots — the model has no verification objective and no stable identity across recordings, so those vectors cannot serve as a voice fingerprint.

The server has no ONNX runtime: every engine (whisper, parakeet, gigaam, nemotron, vad) is a native ggml implementation in its own crate. Any new model therefore arrives as GGUF plus a native inference crate, not as a runtime dependency. See `proposal.md` for motivation and `specs/speaker-voice-memory/spec.md` for the behavior contract.

Speaker names today are per transcript: `SpeakerNames` in `desktop/src/lib/transcripts-store.ts` maps a zero-based speaker index to a name, edited through the `SpeakerLabel` popover, and used by the transcript renderer and every export. Nothing survives the transcript.

## Goals / Non-Goals

**Goals:**

- A cross-recording identity signal that is computed once per diarized speaker and costs no extra audio decode.
- Profiles that are inspectable, editable, and deletable, with no hidden state.
- Conservative defaults: a wrong name is more damaging than an unnamed speaker.

**Non-Goals:**

- Real-time recognition while recording (matching runs when the transcript is ready).
- Retroactively relabeling existing transcripts.
- Cloud voice services, profile sync, or sharing (permanent privacy stance).
- Speaker identification without diarization.
- Changing the transcript file format beyond additive fields.

## Decisions

- **A dedicated speaker-embedding model, not Nemotron's internal state.** Reusing the diarization model's cache embeddings was considered and rejected: they are per-recording slots optimized for clustering within one audio, so their cosine distance across recordings is not calibrated and would produce confident nonsense. The alternative is a small verification model (WeSpeaker ResNet34-LM, CAM++, or ECAPA-TDNN class) exported to GGUF and implemented natively, following the parakeet/nemotron crate pattern. Selection criteria: multilingual accuracy, ≤ ~100 MB at q8, permissive license, simple CNN/ResNet graph. The exact checkpoint is an open question; the crate contract is not.

- **Embeddings are computed server-side during the diarized pass.** The transcription request gains an optional `embedding_model` path, and the response gains an additive `speaker_embeddings` map (`speaker index → vector`). The server already holds decoded audio when diarizing, so this costs one forward pass over the speaker's speech regions and no second decode. Alternatives considered: a separate `/v1/embeddings` endpoint (second audio decode, extra round trip, more latency) and desktop-side extraction (the desktop has no DSP/ggml stack and would duplicate decoding).

- **One vector per speaker per recording.** For each speaker, take the longest speech runs up to a fixed budget (e.g. up to 30 s of audio total, segments shorter than ~0.5 s skipped), L2-normalize each window embedding, and average then re-normalize. A profile stores each recording's vector as a separate sample (bounded, e.g. newest 20 with a duration-size heuristic) rather than a single centroid, so varied conditions stay represented; the match score is the maximum cosine over samples.

- **Confidence is a calibrated percentage, not raw cosine.** Similarity scores are mapped through a monotonic calibration curve (piecewise-linear knots fitted on labelled recordings, per embedding model) into a 0–100 confidence shown in 25-point bands. The bands are what the user reasons about; the calibration is what makes them comparable across models and environments. A runner-up margin still gates automatic naming: the best profile must beat the second candidate by a fixed margin (initially 10 points) or the speaker drops into the confirmation band.

- **Two user-configurable thresholds, applied in one place.** `autoNameAt` (default 75) and `askAt` (default 50) live in settings and are read when a transcript is opened, not baked into profiles. At or above `autoNameAt` the match fills the name automatically and is marked as recognized; between the thresholds it fills the name marked unconfirmed; below `askAt` no profile name is applied and the speaker enters the "could not determine" state. A name the user typed always wins; changing a name never rewrites the profile unless "remember this voice" is chosen.

- **The speaker list is the transcript's front door.** A speakers panel in the transcript view lists every diarized voice with its current name or undetermined state, its confidence band, the candidate profiles, a play button for its excerpt, and actions to accept, rename, pick another profile, or reject. The panel is available for every transcript, including ones transcribed before the model existed (they simply show undetermined). Settings gets its own dedicated voice-profiles section (a top-level settings section, not a subpage) for rename/merge/delete and for the two thresholds.

- **Excerpts are cut once, played one at a time.** For each speaker the server records the longest contiguous speech run, capped at 15 s, as a temporary wav next to the transcript work area; the panel plays it through one shared audio element, so starting another excerpt stops the current one and the stop action releases it. Files are cleaned with the other transcription temporaries; no audio is added to the profile store.

- **Profiles live in one versioned local file.** `speaker-profiles.json` in the app config directory: schema version, and per profile `{id, name, createdAt, updatedAt, samples: [{embedding, dims, recordedAt}]}`. Embeddings are stored base64-encoded little-endian f32; writes are atomic (temp file + rename). Audio is never stored. Deleting a profile deletes its samples; merging moves the loser's samples into the survivor.

- **Naming is the creation gesture.** Naming a speaker in the transcript popover or the speakers panel offers "Remember this voice" (on by default); confirming a match links the speaker to the existing profile instead of creating one.

- **Matching runs after the transcript, on the desktop.** The desktop owns profiles (no server state), so the server stays stateless: it returns vectors, the desktop decides who they are. This also keeps the privacy boundary in one place.

## Risks / Trade-offs

- [Voice embeddings are biometric data] → Local file only, never logged or transmitted, deletion removes samples, privacy documentation states the storage location; no audio retained.
- [False positives label the wrong person in a meeting] → Two thresholds plus a runner-up margin, automatic labeling only for confirmed profiles, every applied name is an ordinary editable speaker name.
- [Diarization splits one person into two slots in one recording] → Both slots may match the same profile and both receive the name; the profile UI's merge handles duplicates across recordings; no attempt to force one slot.
- [Cross-language and far-field accuracy is unknown] → Calibration task on real recordings (Russian and English) before fixing thresholds; vectors from short/noisy speakers are below the minimum-duration budget and simply produce no match.
- [A new native model is significant work] → Ship the engine behind the absent-model degradation path: voice memory is off until the model is installed, so the rest of the change is shippable independently.
- [Model checkpoint licensing or conversion trouble] → Selection criteria include license and graph simplicity; the crate contract isolates the checkpoint choice.
- [Profile file growth] → Per-profile sample cap with oldest-removed policy; base64 f32 keeps 512-dim vectors ≈ 2.7 KB each.

## Migration Plan

1. Additive server fields and the optional option; existing clients and CLI ignore them.
1. Desktop creates the profiles file on first use; a missing or unreadable file means "no profiles", never a transcription failure.
1. Existing transcripts keep their stored names; no backfill.
1. Rollback: removing the app version leaves the profiles file untouched and harmless; matching simply stops.

## Open Questions

- Which embedding checkpoint: WeSpeaker ResNet34-LM vs CAM++ vs ECAPA-TDNN, judged on Russian/English recordings at q8 within ~100 MB.
- Exact thresholds after calibration (0.70/0.80 are starting points; the margin stays regardless).
- Whether the profiles subpage belongs under General or gets its own settings section once the list grows.
