# Design

## Context

`get_audio_devices` (`desktop/src-tauri/src/cmd/audio.rs`) lists devices via `cpal` and returns the enumeration index as the device id; pickers persist that string (`recording.inputDeviceId` / `recording.outputDeviceId`). cpal exposes no stable hardware id and no portable hot-plug events, which forces the two central choices below. The pickers live on the main record panel only; there are no settings selectors, and the user explicitly wants none added.

## Goals / Non-Goals

**Goals:**

- Survive replug, reorder, and reconnect with zero user action.
- Fail loudly (and only at record time) when a pinned device is missing.
- Keep all device management inside the two existing dropdowns.

**Non-Goals:**

- Per-platform device watchers (WASAPI device notifications, CoreAudio listeners).
- In-app audio routing controls beyond input/output selection.
- Changing the Rust device-listing contract beyond what the pickers need.

## Decisions

- **Match by device name.** Persist the device name and select `devices.find(d => d.name === saved)`. Names are stable across replug for the devices that matter here (camera mics, Bluetooth headsets). Two identical devices collide — tie-break by enumeration order and accept the ambiguity; platform-specific unique ids (WASAPI/CoreAudio COM) would buy exactness at the cost of per-OS code in the Tauri layer. The backend payload keeps its shape; the frontend stops trusting `id` for matching and stores names instead.
- **Poll instead of platform watchers.** Refresh the device snapshot when a picker is open, on window focus, and after any device operation fails, diffing against the previous list to update state. Portable, a few lines, fast enough for the picker use case; true push notifications are per-OS work with no additional user-visible reliability at this scale.
- **Pin = remembered selection + return policy.** The existing persisted selection already survives restarts; "pinned" adds that a vanished device stays selected-but-unavailable and is re-selected the moment it reappears. No separate pin/selection states — every explicit selection is a pin.
- **Hidden management inside the dropdown.** Each picker gets a "hidden devices" trailing section listing excluded devices with a restore action, plus a hide action per row (context menu or affordance on the row). New config keys: `recording.hiddenInputDevices` / `recording.hiddenOutputDevices` (string arrays of names).
- **Record-time enforcement.** `use-recording` resolves the pinned names against the current snapshot right before capture starts (and before output loopback capture). Unresolved → toast naming the device, no capture. No polling between record sessions: an unplugged device between check and capture fails in cpal and surfaces as a recording error — same outcome, single code path.

## Risks / Trade-offs

- [Device names are user-renameable or non-unique] → Collision or rename degrades to today's behavior (selection falls back to unselected); no worse than the status quo, and the picker makes the state visible.
- [Polling misses a device change while no picker is open] → Lists refresh on picker open and window focus, which is when the user can act on them; recording enforcement is independent of list freshness.
- [Stored index-strings from before the change never match a name] → Treat unresolvable saved values as "no selection" once, silently; the user re-pins once and the state is stable thereafter.

## Migration Plan

Single frontend release; no data migration beyond tolerating stale stored ids (covered above). Rollback is a revert — persistence keys are additive.

## Open Questions
