# Proposal

## Why

The long-form features landed engine-agnostically in the server, but two practical gaps make them feel engine-gated: the chunk plan — and therefore the transcription cache, resume, and speaker-aware chunks — only exists when a diarization model is supplied, which most runs do not have; and the desktop UI hardcodes a limitations note to `engine === 'gigaam'` instead of deriving it from capabilities. Meanwhile the `chunk_seconds` override exists in the CLI and HTTP API but has no UI at all.

## What Changes

- The planner builds a chunk plan from detected speech even when no diarization model is supplied: every bounded engine (not whisper) gets planned chunks, cache reuse, and resume without diarization; speakers keep being attributed by overlap.
- The desktop gains a chunk-duration control (clamped to the metadata-reported maximum, default = engine limit), closing the CLI/HTTP/desktop parity gap.
- Model limitation notes in the UI are derived from capability flags, never from the engine name; the `engine === 'gigaam'` conditional disappears.
- Streaming display in the model list is deliberately deferred to the `model-catalog` change, which owns model presentation.

## Capabilities

### New Capabilities

### Modified Capabilities

- `long-form-chunk-planning`: planning without a diarization model becomes a planned path (ADDED requirement), and the input bound becomes user-controllable from the desktop UI (ADDED requirement).
- `model-capabilities`: clients must derive model notes and option visibility from capability flags rather than engine names (ADDED requirement).

## Impact

- Server: `server/crates/vibe-server/src/server/transcription.rs` (`plan_for` diarization gate), plan tests, possibly README wording.
- Desktop: `desktop/src/pages/settings/sections/models.tsx` (hardcode removal), a chunk-duration control in transcription settings, plumbing of the `chunk_seconds` request field, i18n keys.
- No engine crates, no cache mechanics — the cache spec already covers reuse whenever a plan exists.
