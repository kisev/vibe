# Install Vibe

This tutorial takes a new machine from a download to a running Vibe window. It assumes a desktop with an internet connection and no existing install. [Transcribe your first recording](/vibe/docs#first-transcription) is the next step.

## Download the installer

Open the [download page](https://kisev.github.io/vibe/) and pick the build for this machine:

| Platform | Build |
| --- | --- |
| Windows | `.exe` installer |
| macOS, Apple silicon | `aarch64.dmg` |
| macOS, Intel | `x64.dmg` |
| Linux | `.deb` or `.rpm`, x86-64 or arm64 |

The same files are attached to each [GitHub release](https://github.com/kisev/vibe/releases). The Linux `.deb` declares its runtime dependencies, including `ffmpeg`.

## Install and open

1. Run the installer and follow its prompts.
1. Open Vibe from the applications menu, or run `vibe` from a terminal.

Release builds are unsigned. On macOS the first launch needs right-click → **Open** in Finder to pass Gatekeeper; later launches open normally. Windows SmartScreen may show a warning for the same reason.

## Finish setup

On first launch Vibe offers the default model. Accept the download and wait for it to finish. The model is stored locally and reused on every later run; [Models](/vibe/docs#models) lists the alternatives.

The window is ready when the drop area and the **Record** and **From link** actions are visible.

## Next steps

- [Transcribe your first recording](/vibe/docs#first-transcription) uses this install.
- [Supported formats](/vibe/docs#formats) lists what Vibe can open and export.
- [Troubleshoot a crash](https://github.com/kisev/vibe/blob/main/docs/how-to/troubleshoot-a-crash.md) covers logs and diagnostics if the window does not open.
