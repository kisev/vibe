# Proposal

## Why

Diarization labels each recording's speakers as `Speaker 1…N`, and the names a user types are stored per transcript. The same person in the next meeting starts as `Speaker 1` again, so the user retypes the same names and gets no continuity across a series of calls. A voice embedding computed once per diarized speaker can carry an identity across recordings — but the current diarization model (Nemotron-3-Diarization) is an end-to-end speaker head with per-recording slots and exposes no cross-recording embedding, so the app needs a small dedicated speaker-embedding model.

## What Changes

- The server gains a speaker-embedding engine: a compact GGUF voice model (e.g. a WeSpeaker/3D-Speaker ResNet or CAM++ export) that turns the audio of one diarized speaker into a fixed-length vector. Transcription with diarization enabled returns one embedding per detected speaker alongside the segments.
- The desktop keeps a local voice-profile store: each profile carries a name, one or more embeddings (one per heard recording), and timestamps. Profiles live next to app data, never leave the device, and can be renamed, merged, or deleted.
- After a transcript is diarized, each detected speaker is compared against the profiles and carries a confidence on a 0–100 scale shown in 25-point bands (0 definitely not, 25 probably not, 50 possibly, 75 probably, 100 definitely), calibrated against labelled recordings rather than left as a raw cosine score.
- Two configurable thresholds drive behavior: at or above the automatic threshold (default 75) the matched name is filled in automatically and stays editable; between the asking and automatic thresholds (default 50) the name is filled in and marked for confirmation; below the asking threshold the speaker is marked "could not determine" and the user names it.
- Every diarized transcript ends with a complete speaker list — each voice named, awaiting confirmation, or explicitly undetermined — so no recording ships as an unaddressed "Speaker 1/2/3" set. Every proposal, including an automatic match, can be overridden without changing the stored profile unless the user chooses to remember the new voice.
- The speaker list plays a short excerpt of each speaker's own audio (about 10–15 s) so identity can be decided by ear; playback stops early on request, and starting another excerpt stops the previous one.
- Profiles are managed in a dedicated settings section: names, number of recordings heard, rename, merge, delete.
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
