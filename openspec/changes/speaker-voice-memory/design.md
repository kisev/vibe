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

- **Conservative matching with a margin rule.** Suggestion threshold starts at cosine 0.70 and automatic labeling at 0.80, and only for a profile the user has already confirmed. Automatic labeling additionally requires the best profile to beat the runner-up by ≥0.05; otherwise the candidates are shown as suggestions. Both numbers are calibration constants, not settings — an exposed threshold invites the user to dial it into false positives. Typed names in the current transcript always win.

- **Profiles live in one versioned local file.** `speaker-profiles.json` in the app config directory: schema version, and per profile `{id, name, createdAt, updatedAt, confirmed, samples: [{embedding, dims, recordedAt}]}`. Embeddings are stored base64-encoded little-endian f32 to keep the file compact and readable enough to debug; writes are atomic (temp file + rename). Audio is never stored. Deleting a profile deletes its samples; merging moves the loser's samples into the survivor.

- **Naming is the creation gesture.** Naming a speaker in the transcript popover offers "Remember this voice" (on by default); accepting a suggested match links the speaker to the existing profile instead of creating one. This keeps the flow already in the product and avoids a separate enrollment ritual. A profiles subpage under General lists names, voice counts, and last heard, with rename/merge/delete.

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
