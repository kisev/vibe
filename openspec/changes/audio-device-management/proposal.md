# Proposal

## Why

Device handling is the weakest point of the recording flow: device ids are enumeration indices that silently rebind when devices are replugged, a saved device that disappeared degrades to "None" with no error while recording stays enabled, disconnected devices are never re-selected when they return, and a device plugged in while the app runs is invisible until a full restart. Recording from an external camera mic or Bluetooth headphones — the user's normal setup — hits every one of these.

## What Changes

- Saved input/output selections match devices by stable identity (device name) instead of enumeration index, so replugging or reordering devices no longer rebinds a saved selection to the wrong device.
- A device can be pinned in each existing picker; a pinned device that disappears and later returns is re-selected automatically.
- A device can be hidden from the picker list (input and output separately), managed inside the existing dropdowns — no new settings selectors.
- The device lists refresh while the app runs when devices connect or disconnect; no restart needed.
- When a pinned device is unavailable, its picker shows the unavailable state and starting a recording fails with an error naming the missing device; the app never silently records on a different device.

## Capabilities

### New Capabilities

- `audio-device-management`: how recording devices are identified, pinned, hidden, refreshed, and enforced at record time.

### Modified Capabilities

## Impact

- `desktop/src-tauri/src/cmd/audio.rs` (device listing payload), `desktop/src/pages/home/hooks/use-recording.ts` (persistence and matching), `desktop/src/components/audio-device-input.tsx` (picker states, hidden management), `desktop/src/pages/main/components/idle-hero.tsx` (record gating), new config keys for hidden devices and pinned names, i18n keys for new states and the missing-device error.
- No server or transcription changes.
