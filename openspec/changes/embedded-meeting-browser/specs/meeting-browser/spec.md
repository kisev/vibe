# Spec Delta

## Purpose

Open any link inside Vibe, treat configured meeting hosts as recordable sessions, and hand links into Vibe through the one OS mechanism an installed app actually owns — its own URL scheme.

## ADDED Requirements

### Requirement: Any link opens in an app browser

The application SHALL open links in a Vibe-hosted Chromium webview window with address, back, forward, and reload controls. Links to configured meeting hosts SHALL additionally show a meeting bar. The browser window SHALL use a data partition separate from the application's own storage and SHALL NOT inject scripts into pages.

#### Scenario: An arbitrary link

- **WHEN** the user opens any URL from the app or the deep link
- **THEN** it loads in the Vibe browser window with working navigation controls

#### Scenario: A meeting link

- **WHEN** the URL is on a host marked as a meeting host
- **THEN** the same window shows the meeting bar with a record action

#### Scenario: The page's own permissions

- **WHEN** the page asks for camera or microphone access
- **THEN** the platform webview asks the user, and Vibe does not grant the permission on its own

### Requirement: Meeting hosts are configurable

Settings SHALL list meeting hosts with a default set (`telemost.yandex.ru`, `stream.wb.ru`) and SHALL let the user add and remove hosts. Host matching SHALL be by host name over https.

#### Scenario: Adding a host

- **WHEN** the user adds a host
- **THEN** links on that host show the meeting bar

#### Scenario: Removing a host

- **WHEN** the user removes a host
- **THEN** its links still open in the browser but without the meeting bar

### Requirement: Recording is one click away in a meeting

For a meeting host, the meeting bar SHALL offer a prominent record action that starts the existing recording (system audio and microphone as configured) and shows a visible recording indicator in the meeting window and the main window; a second action stops it. Recording SHALL remain manual — this change adds no automatic start.

#### Scenario: Starting a call

- **WHEN** the user opens a meeting on a configured host
- **THEN** the meeting bar shows "Record this call" and pressing it starts recording with a visible indicator

#### Scenario: Already recording

- **WHEN** a recording is already running and a meeting window opens
- **THEN** the bar shows the active state instead of offering a second recording

#### Scenario: Leaving the call

- **WHEN** the browser window closes while the meeting recording is running
- **THEN** the app warns and lets the user stop or keep recording

### Requirement: Deep links hand URLs to the app

The application SHALL accept `vibe://open/?url=<https url>`, validate the scheme and URL, and route it to the browser window; a second invocation SHALL focus the existing window rather than fail. A URL that fails validation SHALL NOT be opened without explicit confirmation.

#### Scenario: Handoff from another app

- **WHEN** `vibe://open/?url=` names an https URL
- **THEN** the app opens or focuses its browser window on that URL

#### Scenario: Invalid input

- **WHEN** the deep link names a non-https scheme or malformed URL
- **THEN** the app does not load it silently and asks before doing anything

### Requirement: In-app meetings do not double-prompt

While a meeting runs in an app browser window, the existing external-meeting detection prompt SHALL NOT appear for that same meeting, and detection of external calls SHALL continue unchanged.

#### Scenario: An in-app call

- **WHEN** a call runs in the Vibe browser window
- **THEN** the external detection prompt stays silent for it

#### Scenario: An external call

- **WHEN** a call runs in the system browser
- **THEN** the existing detection prompt appears as before
