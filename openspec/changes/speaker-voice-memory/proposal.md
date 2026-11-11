# Proposal

## Why

Diarization labels each recording's speakers as `Speaker 1…N`, and the names a user types are stored per transcript. The same person in the next meeting starts as `Speaker 1` again, so the user retypes the same names and gets no continuity across a series of calls. A voice embedding computed once per diarized speaker can carry an identity across recordings — but the current diarization model (Nemotron-3-Diarization) is an end-to-end speaker head with per-recording slots and exposes no cross-recording embedding, so the app needs a small dedicated speaker-embedding model.

## What Changes

- The server gains a speaker-embedding engine: a compact GGUF voice model (e.g. a WeSpeaker/3D-Speaker ResNet or CAM++ export) that turns the audio of one diarized speaker into a fixed-length vector. Transcription with diarization enabled returns one embedding per detected speaker alongside the segments.
- The desktop keeps a local voice-profile store: each profile carries a name, one or more embeddings (one per heard recording), and timestamps. Profiles live next to app data, never leave the device, and can be renamed, merged, or deleted.
- After a transcript is diarized, each detected speaker is compared against the profiles. A confident match is proposed with the profile name; naming a speaker offers to remember that voice (including a name typed in a transcript).
- Once the user confirms a profile match, later transcripts fill the speaker's name automatically when the match is clear; ambiguous or weak matches stay suggestions with an accept/reject action. A disagreement never overwrites a name the user typed in that transcript.
- The voice model is auxiliary, like the diarization model: it is downloaded once, its presence and identity are visible in the speaker-separation settings, and voice memory is skipped silently when the model or diarization is unavailable.
- All matching runs locally; only the embedding vectors are stored, never audio.

## Capabilities

### New Capabilities

- `speaker-voice-memory`: local voice profiles, cross-recording speaker matching, confidence policy, the suggestion/confirmation UI, and the privacy guarantees around stored voice vectors.

### Modified Capabilities

- `model-catalog`: the auxiliary speaker-embedding model joins the diarization model in the speaker-separation settings — named with its size, shown as installed or missing, and downloadable with verification.

## Impact

- Server: a new native engine crate (embedding model loading/inference in ggml), the diarization path or a sibling endpoint producing per-speaker embeddings, transcription request options (`embedding_model`), and metadata for the new model family.
- Desktop: voice-profile storage (app data), matching service, transcript creation and the speaker-label popover, a profiles management surface in settings, and i18n strings.
- Model catalog/website docs: the embedding model's entry and download.
- Privacy documentation: voice embeddings are biometric data — local storage, deletion on profile removal, and no network transfer must be stated.
- No change to ASR transcription quality or the existing transcript format; the embedding fields are additive.
