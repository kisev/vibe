# Troubleshoot a crash

Work through these checks before filing a bug. Each one narrows whether the problem is the audio, the model, the server, or the desktop shell.

1. Is the audio file valid? Try another file, for example [server/fixtures/single.wav](https://github.com/kisev/vibe/raw/main/server/fixtures/single.wav).
1. Reproduce with the default model. A custom or partially downloaded model is a common cause; if the default model works, the problem is the model, not the app.
1. Start the app from a terminal with logs enabled (below). A crash without a visible error almost always has a traceback in the log.
1. Report it from **Settings → Report Issue**. That action builds a GitHub issue prefilled with the diagnostics block (version, OS, relevant logs). Nothing is sent automatically; you review and submit the issue yourself.

## Run with logs

Run the app from a terminal so its output reaches the console. `RUST_LOG` filters the desktop (`vibe`) and server (`vibe_server`) targets; `RUST_BACKTRACE=1` turns a panic into a stack trace.

**Windows** (`cmd.exe`):

```console
taskkill /IM vibe.exe /F
set RUST_BACKTRACE=1
set RUST_LOG=vibe=debug,vibe_server=debug
%localappdata%\vibe\vibe.exe
```

**macOS**:

```console
RUST_LOG=vibe=debug,vibe_server=debug RUST_BACKTRACE=1 /Applications/vibe.app/Contents/MacOS/vibe
```

**Linux**:

```console
RUST_LOG=vibe=debug,vibe_server=debug RUST_BACKTRACE=1 /path/to/vibe
```

Adjust the path if the bundle is installed elsewhere. If the app cannot start at all, read the log files directly:

- macOS: `$HOME/Library/Application Support/github.com.thewh1teagle.vibe`
- Windows: `%appdata%\github.com.thewh1teagle.vibe`
- Linux: `~/.config/github.com.thewh1teagle.vibe`

The app identifier is still the upstream one, so the directory names are unchanged.

## Crash with no window and no log

On Windows, open **Event Viewer → Windows Logs → Application** and look for an error at the crash time. The faulting module usually identifies a missing runtime or GPU driver.

Check that the application log directory above contains a log at all. An empty directory means the process died before logging started, which points at the launcher or the bundled sidecar rather than the UI.

## Missing Windows DLLs

- `vcomp140.dll`: install the [Visual C++ redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe).
- `vulkan-1.dll`: install the [Vulkan runtime](https://sdk.lunarg.com/sdk/download/1.3.290.0/windows/VulkanRT-1.3.290.0-Installer.exe). The server uses Vulkan on Windows; a driver without a loader fails at startup.

## OS information for the report

Include the OS name and version, the Vibe version from Settings, the model you used, and whether the default model reproduces the problem. The Report Issue action already fills in the version and OS fields.

Report via [a new issue](https://github.com/kisev/vibe/issues/new?assignees=octocat&labels=bug&projects=&template=bug_report.yaml&title=%5BShort+title%5D) or comment on an existing one with the same details.
