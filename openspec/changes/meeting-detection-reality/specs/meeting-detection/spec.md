# Spec Delta

## Purpose

Notices that a supported calling app has started using the microphone, and offers to record that call — without guessing, without telemetry, and without getting in the way of people who record by hand or meet inside Vibe's own browser.

## ADDED Requirements

### Requirement: A supported app that takes the microphone is noticed

The app SHALL detect that a supported calling application has started using a microphone on Windows, Linux and macOS, and SHALL name the service. The signal SHALL come from the platform's audio stack — which process currently holds a capture device — rather than from a window title alone or from a Windows-specific registry entry. Where the platform cannot name the process, the app SHALL say that its detection is approximate instead of presenting a guess as a fact.

#### Scenario: A desktop call starts

- **WHEN** a supported desktop app starts using the microphone during a call
- **THEN** the detector reports that service as active

#### Scenario: The call ends

- **WHEN** the app releases the microphone, or another process takes it
- **THEN** the detector reports the call as over without a prompt left behind

#### Scenario: A platform that cannot name the process

- **WHEN** the platform only reports that some process holds the microphone
- **THEN** the settings describe that signal as approximate, and attribution uses the frontmost application

### Requirement: The supported services are named

Detection SHALL cover Zoom, Teams, Telegram, Telemost and Stream in their desktop clients, and SHALL attribute a meeting held in a browser by the window title. The list SHALL be data, so a new client or helper process is added without changing the detection logic.

#### Scenario: A browser meeting

- **WHEN** a meeting runs in a browser whose window title identifies it
- **THEN** that service is reported

#### Scenario: An unsupported app holds the microphone

- **WHEN** an application outside the supported list uses the microphone
- **THEN** no prompt appears

### Requirement: The prompt arrives after a configurable pause

A detected meeting SHALL offer to record only after a pause of `recording.meetingPromptDelaySeconds` (default ten seconds, configurable from zero to two minutes) during which the same service keeps the microphone. Losing the microphone or the attribution before the pause ends SHALL cancel the offer, and a call that is detected again SHALL NOT stack offers.

#### Scenario: A call that starts with a sound check

- **WHEN** a supported app takes the microphone and keeps it for the configured pause
- **THEN** Vibe comes forward once and offers to record that call

#### Scenario: A false start

- **WHEN** the microphone is released before the pause ends
- **THEN** no prompt appears

### Requirement: The offer stays out of the way where Vibe already knows

The offer SHALL NOT appear while Vibe is recording, while a meeting is open in Vibe's embedded browser, or for a meeting the person dismissed, until that call ends.

#### Scenario: A meeting in Vibe's browser

- **WHEN** a call is open in the embedded browser
- **THEN** no detection prompt appears, because the browser carries its own recording controls

#### Scenario: A dismissed offer

- **WHEN** the person closes the detection offer during a call
- **THEN** it does not return for that call

### Requirement: The state of detection is visible

The settings SHALL show whether detection is running, what it last observed and when, and SHALL offer the current log file without requiring the person to know where the app keeps it.

#### Scenario: The feature does not fire

- **WHEN** a person opens the setting after a call that produced no offer
- **THEN** the section shows whether the detector ran and what it last saw, and reaches the log in one action
