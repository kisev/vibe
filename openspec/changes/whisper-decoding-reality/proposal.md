# Proposal

## Why

The Whisper options surface offers beam search (sampling strategy, best-of, beam size), `max_sentence_len` and an n-threads knob. The unified engine ignores them: `transcribe-cpp` 0.4.1 exposes no beam-search parameter at all, and the server logs that these values are discarded. Threads are different — the engine's `SessionOptions` carries `n_threads`, but the server opens sessions with defaults and never passes the value. So two of these controls are placeholders and one is a genuine gap.

## What Changes

- The placeholder controls are removed from the desktop: sampling strategy, greedy/beam, best-of, beam size and max sentence length disappear, along with their strings and hints. A control that cannot change anything is worse than no control.
- n-threads is wired where the engine accepts it: the server opens its transcription sessions with `SessionOptions { n_threads }` taken from the request. This requires a server release, since the desktop ships the pinned sidecar.
- The server keeps tolerating the removed fields so an older desktop still works; the one warning that remains names only what is truly ignored.

## Capabilities

- `transcription-cli` (existing): the engine options a transcription can carry.

## Impact

- `desktop/src/pages/settings/sections/whisper-options.tsx`, `desktop/src/lib/config.ts` defaults, `server/crates/vibe-server/src/engine.rs`, catalogs, tests, `server/libs`/`.server-version` only when the server release is cut.

## Open question

The server change needs a `server-v*` release before a desktop build can use it. Threads stay exposed until then, because the setting is honest once the sidecar catches up.
