# Tasks

- [x] 1. `vibe-server`'s crate version moved to the new line: 1.0.0 when the line started, and 1.0.2 now, so the crate never lags `.server-version`.
- [x] 2. Docs state the independent numbering and the `.server-version` ordering rule: the Versions section of `docs/how-to/build-the-server.md`, `docs/how-to/publish-a-release.md`, the release skill, and `server/docs/BUILDING.md`.
- [x] 3. At release time: cut the server tag and only then move `.server-version` to it. `server-v1.0.2` is the first fully green run (workflow run succeeded, all eight assets present), so `.server-version` now reads `v1.0.2`; `v1.0.0` and `v1.0.1` stay published with their failing cells recorded in tasks 4 and 5, and the marker never points at a release whose assets are incomplete.
- [x] 4. `server-v1.0.0`'s macOS and Windows cells failed packaging: the task runs from the repository root while the build step left the binary under `server/`, and the archive named ffmpeg without the `.exe` Windows resolves. The workflow now passes `server/`-prefixed paths and the script keeps the extension; `server-v1.0.1` carries the fix.
- [x] 5. `server-v1.0.1` shipped every platform except Windows: Git Bash has no `zip`, so packaging exited 127. The archive is now built with Python's `zipfile` on any host; `server-v1.0.2` carries it.
- [x] 6. `server/crates/vibe-server/tests/version_line.rs` pins the rules: `.server-version` is a `server-v*` tag on the 1.x line, `server-release.yml` publishes that tag shape, and the pin never runs ahead of the crate version.
