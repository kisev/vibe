# Spec Delta

## Purpose

Open configured meeting sites inside Vibe, record them with consent, and hand links from the rest of the system into that window — without becoming the user's default browser.

## ADDED Requirements

### Requirement: Meeting sites open in an app window

The application SHALL open URLs on configured meeting hosts in a Vibe-hosted webview window with address, back, forward, and reload controls. Navigation to a host outside the allowlist SHALL open in the system browser instead of inside the app. The window SHALL use a browser data partition separate from the application's own storage.

#### Scenario: An allowed meeting link

- **WHEN** a meeting URL on an allowed host is opened from the deep link or inside the app
- **THEN** it loads in a Vibe meeting window and the page gets its own camera/microphone prompts

#### Scenario: A link outside the allowlist

- **WHEN** the meeting page navigates or the user enters a URL on a host that is not allowed
- **THEN** that URL opens in the system browser and the meeting window stays on its allowed host

#### Scenario: Cannot host

- **WHEN** the platform webview cannot host the meeting (unsupported call features or an intentional fallback)
- **THEN** the URL opens in the system browser with a notice, and the app keeps working

### Requirement: The host allowlist is configurable

Settings SHALL list meeting hosts with a default set (`telemost.yandex.ru`, `stream.wb.ru`) and SHALL let the user add, remove, and mark each host for automatic recording. Matching SHALL be by host, over https only.

#### Scenario: Adding a host

- **WHEN** the user adds a host to the allowlist
- **THEN** links on that host open in the meeting window and respect that host's auto-record setting

#### Scenario: Removing a host

- **WHEN** the user removes a host
- **THEN** its links no longer open in the meeting window and open in the system browser instead

### Requirement: Deep links hand meeting URLs to the app

The application SHALL accept `vibe://open/?url=<https meeting url>`, validate that the URL is https and on an allowed host, and route it to a meeting window; a second invocation SHALL focus the existing window rather than fail. A URL that fails validation SHALL NOT be opened inside the app without an explicit confirmation.

#### Scenario: Handoff from another app

- **WHEN** `vibe://open/?url=` names an allowed meeting URL
- **THEN** the app opens or focuses its meeting window on that URL

#### Scenario: A non-allowed URL

- **WHEN** the deep link names a host that is not allowed or a non-https scheme
- **THEN** the app does not load it silently; it asks, and declining leaves the app untouched

### Requirement: Auto-record is consented and visible

For a host marked for automatic recording, entering a meeting in the meeting window SHALL start recording system audio and microphone after a one-time confirmation for that host, SHALL show a recording indicator in the meeting window and the main window, and SHALL stop recording when the meeting ends, the window closes, or a recording is already running.

#### Scenario: Joining a meeting with auto-record

- **WHEN** the user joins a call on an auto-record host and has confirmed that host before
- **THEN** recording starts with a visible indicator naming the meeting

#### Scenario: First automatic recording on a host

- **WHEN** auto-record would start for a host the user has not confirmed
- **THEN** the app asks once, and declining leaves the call unrecorded while remembering the choice

#### Scenario: The meeting ends

- **WHEN** the call ends or the meeting window closes
- **THEN** the recording stops cleanly and the transcript is produced as usual

#### Scenario: Already recording

- **WHEN** a recording is already running when a meeting is joined
- **THEN** no second recording starts and the meeting window shows the active indicator

### Requirement: In-app meetings do not double-prompt

While a meeting is active in an app window, the existing external-meeting detection prompt SHALL NOT appear for that same meeting, and detection of external calls SHALL continue unchanged.

#### Scenario: An in-app call

- **WHEN** a call runs in the meeting window
- **THEN** the external detection prompt stays silent for it

#### Scenario: An external call

- **WHEN** a call runs in the system browser
- **THEN** the existing detection prompt appears as before
