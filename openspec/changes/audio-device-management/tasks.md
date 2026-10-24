# Tasks

## 1. Stable identity and persistence

- [ ] 1.1 Switch `use-recording.ts` device matching from stored index strings to device names (`devices.find(d => d.name === saved)`), treat unresolvable stored values as no selection, and keep the existing config keys; verify with a unit test that a saved name re-selects the device after a simulated reorder of the device list
- [ ] 1.2 Add `recording.hiddenInputDevices` / `recording.hiddenOutputDevices` persisted string-array keys and a helper for reading/writing them; verify persistence round-trips in a unit test

## 2. Picker behavior

- [ ] 2.1 Extend `audio-device-input.tsx` with a hide action per row and a trailing hidden-devices section with restore actions, and verify with a component test that a hidden device disappears from the list and a restored one returns
- [ ] 2.2 Render the pinned-device-unavailable state in the picker (selected but greyed/flagged, not falling back to "None") when the saved name is absent from the snapshot; verify with a component test that removing the device from the snapshot keeps it selected and flags it
- [ ] 2.3 Add the i18n keys for hide/restore/hidden section/unavailable state in en-US and all shipped locales (translate via the `/translate` flow), regenerate paraglide, and stamp; verify the i18n audit is clean

## 3. Live refresh

- [ ] 3.1 Add device-list refresh on picker open, on window focus, and after a failed device operation, diffing the new snapshot into state; verify with a unit test that a snapshot containing a new device updates the picker without remounting
- [ ] 3.2 Verify manually in the running app: plugging and unplugging a device while the app is open updates both pickers without a restart

## 4. Record-time enforcement

- [ ] 4.1 In `use-recording.ts`, resolve pinned input and output names against the current snapshot immediately before capture starts and fail with a toast naming the missing device when unresolved; verify with a unit test that starting a recording with a missing pinned input neither opens the recorder nor writes a job
- [ ] 4.2 Verify manually: unplug the pinned microphone, start a recording, and confirm the error names the device and no silent fallback device is used

## 5. Integration

- [ ] 5.1 Run `tsc`, `vitest`, and the desktop Rust `cargo check --tests` (Windows toolchain); verify zero failures
