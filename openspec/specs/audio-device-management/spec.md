# audio-device-management Specification

## Purpose

Makes recording devices reliable for people who plug and unplug hardware: selections survive reconnection, devices come and go without a restart, and a pinned device is either used or loudly missing — never silently replaced.

## Requirements

### Requirement: Selections survive reconnection

Saved input and output device selections SHALL be matched to devices by stable identity — the device name — and MUST NOT depend on enumeration order, so replugging a device or changing what is connected does not rebind a saved selection to a different device.

#### Scenario: Device returns

- **WHEN** a pinned device is disconnected and later reconnected
- **THEN** the picker selects it again automatically

#### Scenario: Enumeration order changes

- **WHEN** the system enumerates devices in a different order after replug
- **THEN** the saved selection still names the same physical device

### Requirement: Devices can be pinned and hidden from the pickers

Each picker SHALL let the user pin a device and exclude devices from the list, persisted across restarts. Hidden devices SHALL be manageable inside the same picker; no separate settings selectors are added.

#### Scenario: Pin persists

- **WHEN** the user pins an input device and restarts the application
- **THEN** that device is still the selected input

#### Scenario: Hide and restore

- **WHEN** the user hides a device from the input picker
- **THEN** it disappears from the list and can be restored from a hidden-devices section inside the same picker

#### Scenario: Input and output are independent

- **WHEN** the user pins one input device and hides one output device
- **THEN** the output picker still shows the output's pinning state and the input picker is unaffected

### Requirement: Device lists refresh without a restart

The application SHALL detect devices connecting or disconnecting while it runs and refresh both pickers without an application restart.

#### Scenario: Device plugged in

- **WHEN** a recording device is connected while the application is open
- **THEN** it appears in the matching picker without restarting

#### Scenario: Device unplugged

- **WHEN** a device is disconnected while the application is open
- **THEN** it leaves the picker list and, if it was selected, the picker shows its unavailable state

### Requirement: Recording never uses a silently replaced device

When a pinned device is unavailable, starting a recording SHALL fail with an error naming the missing device, and the picker SHALL show the pinned device as unavailable; the application MUST NOT record from a different device in its place.

#### Scenario: Pinned input missing

- **WHEN** the pinned input device is unavailable and the user starts a recording
- **THEN** the recording does not start and the error names that device

#### Scenario: Picker shows the state

- **WHEN** the pinned device is unavailable
- **THEN** its picker displays the pinned device as unavailable rather than falling back to another device or to "None"
