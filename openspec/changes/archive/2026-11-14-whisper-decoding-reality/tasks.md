# Tasks

- [x] 1. Remove the sampling-strategy, greedy/beam, best-of, beam-size and max-sentence-length controls from the Whisper options surface, with their keys in every catalog and their tests.
- [x] 2. Server: open transcription sessions with `SessionOptions { n_threads }` taken from the request; keep accepting removed fields.
- [x] 3. Tests: the options surface renders no removed control; the server maps threads and tolerates old fields.

Cutting the `server-v*` release that ships this wiring, and bumping `.server-version` to it, is an
operational follow-up outside this change — see `docs/how-to/publish-a-release.md`.
