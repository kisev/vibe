# Tasks

- [ ] 1. Backend: `record_level` carries the device/source it belongs to (or a second event), without changing capture.
- [ ] 2. Main window: a recording surface with elapsed time, two labelled meters (microphone, system audio) and a silent-source marker.
- [ ] 3. Browser chrome: the same indicator and meters from shared events; no second recorder.
- [ ] 4. Tests: level routing per source, silent-source state, elapsed time, and the chrome mirror.
- [ ] 5. Manual: a call with the wrong output device shows the silent source before the call ends.
- [ ] 6. Silence is a visible badge, and five minutes of it focuses the main window with a message naming the source.
