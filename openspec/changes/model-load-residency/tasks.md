# Tasks

- [ ] 1. Server: add a residency value to the model-load response (`vibe-server`), set from the engine's own knowledge of whether the model was already loaded; no request field needed.
- [ ] 2. Desktop: carry the value into each comparison column, treating an absent field as unknown, and show it beside the time.
- [ ] 3. Tests: server unit test for both answers, desktop test for the three column states.
- [ ] 4. Remove the residency risk from `model-comparison`'s design, since the note it promised now exists.
- [ ] 5. The server line gets its own release with the field before the desktop relies on it; note that in the release tasks.
