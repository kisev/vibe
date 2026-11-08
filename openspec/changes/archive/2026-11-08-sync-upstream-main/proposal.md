# Proposal

## Why

Upstream `thewh1teagle/vibe` main moved 16 commits past the fork point (2026-10-06 → 2026-10-30, released as v3.3.0) while the fork accumulated 132 of its own. The window carries changes the fork needs — a diarization replacement the fork's own fix only papers over, update channels, a fork-dependency cleanup (cpal, eyre, aptabase) — and the wider the gap grows, the costlier each future sync becomes.

## What Changes

- Merge `upstream/main` into the fork's `main` as a single merge commit (no rebase: 132 fork commits, 21 signed dev tags, and the tags are the release history).
- **Run two engines side by side** (user decision 2026-10-30): the fork's transcribe.cpp unified engine stays the primary path for handy-catalog models, and upstream's native pure-Rust stack (`whisper-rs`, `ggml-rs-sys`, `vad-rs`, `parakeet-rs`, `nemotron-rs`, and the new `nemotron-diarize-rs`) returns to the workspace as the engine for upstream-native models. A live probe settled the shape: the fork's transcribe.cpp 0.4.1 rejects the Nemotron-3-Diarization GGUF (`unsupported architecture (status 5)`), and upstream implements it on their own ggml stack — so full support for both model families means both engines. The sync lands in two stages: the merge restores the native crates and keeps vibe-server fork-side (both engines present, native dormant), then follow-up commits wire `nemotron-diarize-rs` into diarization routing, make Nemotron the diarization model, and move the fork's Sortformer v2.1 artifacts to the legacy list for a second automatic re-migration.
- Adopt upstream's stable/beta update-channel mechanism with the fork's endpoints: channels point at fork releases (`latest.json` from `kisev/vibe`), the fork's minisign key stays.
- Adopt upstream's in-app analytics client, dropping the `tauri-plugin-aptabase` fork dependency; continuity of the deterministic-daily-session behavior the fork's plugin carried is a recorded follow-up question, not a blocker.
- **BREAKING** (dev-release surface only): the fork's application version base moves to 3.3.0, so dev builds report `3.3.0-dev.<n>.<sha>`.
- Adopt the rest of the window as-is: Google Meet detection on Windows, recording-shortcut microphone selection, AUR path in the Linux installer, Hebrew Parakeet + Q8_0 quantization, OpenAI `max_completion_tokens`, macOS window dragging, changelog translation flash fix.
- Resolve overlaps in fork-owned zones in the fork's favor: updater endpoints, installer identity (`vibe-kisev-fork`), single-dev-release scheme, CI janitor — none of which upstream touched.

## Capabilities

### New Capabilities

- `upstream-sync`: the standing contract for integrating upstream main into the fork — fork identity survives a sync, syncs are validated end to end before landing, and upstream model-family switches extend the legacy migration list.

### Modified Capabilities

- None. (The migration requirement in `model-capabilities` already covers re-offering downloads after an artifact switch; this change only adds artifacts to its legacy list.)
