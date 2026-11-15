# Design

## Context

See `proposal.md` for why the pickers move into the chrome.

The chrome is a separate webview that renders `desktop/src/windows/browser-window.tsx` through the `?window=browser` branch of `bootstrap.tsx`. That branch loads the config store and appearance but skips the app's providers, startup migrations, device enumeration and server supervision, so the chrome cannot reuse the settings view-model or the recorder hook directly. The main window owns the recorder: it resolves devices through `useRecording`, starts them with `start_record`, and reports its state to the chrome through Tauri events (`meeting-browser-record-gate.tsx`, `pages/main/session.tsx`).

The config store is file-backed and shared by every window (`app_config.json`): a write in one window reaches subscribers in the others through the plugin's app-wide `store://change` event. Device selections persist by name, never by enumeration id, because ids are indexes that shuffle on hot-plug.

## Goals / Non-Goals

**Goals:**

- The chrome reads and writes the same device selection the main window uses, without booting a second app.
- A picker never offers a choice the recorder would interpret differently, and the chrome names what a running recording actually captures.

**Non-Goals:**

- Per-source level preview in the chrome (listed as optional in the proposal; the recorder's indicator already carries levels).
- A second recorder, or device enumeration owned by the chrome.
- Changing the main window's picker component: the chrome keeps its own compact rendering.

## Decisions

- **The chrome resolves devices itself instead of asking the main window.** `readRecordingDeviceState` calls the existing `get_audio_devices` command and resolves the saved names through the same `resolveSelection` helper the recorder uses. Routing enumeration through an event would add a round trip and a state owner to keep in sync, and would still need the config keys; the command is already registered for all windows. Alternative rejected: booting the app's providers in the chrome, which is what the two-webview design deliberately avoids.

- **Selection travels through the main window's config keys, by device name.** `writeRecordingDeviceSelection` writes `recording.inputDeviceName` / `recording.outputDeviceName`, the keys `useRecording` already persists to and resolves from. Because the config store broadcasts across windows, a pick in the chrome re-resolves the main window's selection, and the reverse. An empty name means "no device"; system defaults are never written, matching the recorder's convention. Alternative rejected: a dedicated `browser.*` key pair, which would have made the two surfaces disagree.

- **Pickers are native `<select>` elements.** The chrome webview is only the toolbar height (104 px by default) and sits above the page webview; a popup rendered inside it would be clipped at the toolbar edge. A native select's option list is drawn by the platform, outside the webview's bounds, so every device stays visible and selectable. Commit `baf6e6f8` records the finding that led here. Alternative rejected: growing the chrome for a custom popup, which would move the page on every picker open.

- **Recording state is mirrored from its owner, with the devices it records.** The chrome never starts a recording itself; it asks the main window and mirrors `RecordingStatePayload`. The payload carries the run's device names (`inputName`, `outputName`) alongside `sources`, so the chrome names what the run actually opened instead of re-reading a config that may have moved since the start, and a source the run did not open reads **None**. Reporters that did not resolve the run omit the fields — the record gate only names a run its own hook started, and `session.tsx` only names a run the main window owns — so an adoption or a late state request cannot overwrite a better report with "no device". Pickers are disabled whenever the payload says a recording runs, whichever surface started it.

- **Devices refresh on mount, on window focus and after a pick.** cpal emits no hot-plug events, so a snapshot cannot stay live by subscription; focus is the point where the user returns from another window, which is also when a selection or device set may have changed. The alternative — polling — costs an IPC call per interval for a list that changes rarely.

## Risks / Trade-offs

- [A device unplugged while a recording runs] → The recorder keeps its open stream; the chrome keeps naming the reported devices, and the snapshot refresh does not replace them while the run is active.
- [A hand-edited config or a hidden device] → Resolution reuses `resolveSelection`, so an absent pinned name is shown as unavailable rather than silently swapped, and hidden devices stay out of the chrome's list.
- [The page webview could cover a native popup on some platforms] → The popup is platform-drawn and not bounded by the chrome webview; Windows is the validated platform and the fallback is the main window's picker.
- [Two windows reporting the same run] → Device fields are omitted by a reporter that does not own the run, and the chrome ignores absent fields while recording, so the last report cannot downgrade a known device set.
