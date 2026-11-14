# Tasks

- [x] 1. Remove the sampling-strategy, greedy/beam, best-of, beam-size and max-sentence-length controls from the Whisper options surface, with their keys in every catalog and their tests.
- [x] 2. Server: open transcription sessions with `SessionOptions { n_threads }` taken from the request; keep accepting removed fields.
- [ ] 3. Cut a server release carrying the thread wiring and bump `.server-version` (after the user approves the release). **Waiting on the user:** the server changes are in the tree, but no release is cut and `.server-version` is untouched until they approve.
- [x] 4. Tests: the options surface renders no removed control; the server maps threads and tolerates old fields.
