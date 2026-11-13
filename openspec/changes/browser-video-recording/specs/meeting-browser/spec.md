# Spec Delta

## ADDED Requirements

### Requirement: The embedded page can be recorded as video

The bar SHALL offer a video recording action for the open content window. While it runs, Vibe SHALL capture that window's picture locally and write an MP4 beside the audio recording, and the capture SHALL stop with the audio, with the action, or when the window closes.

#### Scenario: Recording a call with a shared screen

- **WHEN** the user starts video recording in the bar during a meeting
- **THEN** an MP4 of the content window is written next to the transcript, and the bar shows the recording state until it stops

#### Scenario: The window closes while recording

- **WHEN** the content window is closed during video capture
- **THEN** the capture stops and the file is finalized rather than left truncated

#### Scenario: Capture is unavailable

- **WHEN** the platform offers no capture backend for the window
- **THEN** the bar reports the reason and records no empty file

#### Scenario: Nothing leaves the device

- **WHEN** video recording runs
- **THEN** the capture is local and no page or network request is involved
