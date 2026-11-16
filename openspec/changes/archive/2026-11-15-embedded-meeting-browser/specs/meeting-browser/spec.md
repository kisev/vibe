# Spec Delta

## Purpose

Open a link inside Vibe, keep the browser window's chrome and page in one window, and hand meeting links into Vibe through the OS mechanisms an installed app actually owns.

## ADDED Requirements

### Requirement: Links open in an app browser window

The application SHALL open a link it accepts in a Vibe-hosted window built on the platform webview. The app-owned chrome — address, back, forward, reload, open in system browser and close — SHALL sit in the same window above the page, and the page SHALL fill the rest of it. The page SHALL get no injected scripts and no app capabilities; camera and microphone prompts SHALL be the platform webview's own, and the page SHALL share the app's webview environment.

#### Scenario: A page in one window

- **WHEN** the user opens an accepted link from the app or the handoff
- **THEN** one window opens with the chrome at the top and the page below it, and the page resizes with the window

#### Scenario: A meeting link

- **WHEN** the URL is a meeting room on a host the browser may load
- **THEN** the same window shows it with the chrome's recording action available

#### Scenario: The page's own permissions

- **WHEN** the page asks for camera or microphone access
- **THEN** the platform webview asks the user, and Vibe does not grant the permission on its own

#### Scenario: A platform without multi-webview embedding

- **WHEN** the browser opens on macOS
- **THEN** the page opens in a page-only window, and recording stays reachable from the main window

### Requirement: Browser hosts are configurable

Settings SHALL list the hosts the embedded browser may load and SHALL let the user add and remove hosts. Matching SHALL be by host name over https, an entry covering its subdomains. The list SHALL start empty — no seeded defaults — with the previous `meeting.browserHosts` value migrated once. A removed host SHALL be refused on its next navigation and recorded as blocked. While any browser window is open, Vibe SHALL suppress its own external call prompt.

#### Scenario: Adding a host

- **WHEN** the user adds a host
- **THEN** links on that host, and on its subdomains over https, load in the browser

#### Scenario: Removing a host

- **WHEN** the user removes a host
- **THEN** its next navigation is refused and the host appears among the blocked hosts with an Allow action

### Requirement: Recording is one click away in the browser window

The browser chrome SHALL offer a record action on every page. It SHALL start the existing recording with the configured devices and show a visible indicator in the browser window and the main window; a second action stops it. If a recording already runs when a browser window opens, the chrome SHALL show that state instead of offering a second start. Closing the window while recording SHALL ask whether to stop or keep it. Recording SHALL remain manual.

#### Scenario: Starting a call

- **WHEN** the user opens a meeting in the browser and presses "Record this call"
- **THEN** recording starts with the configured devices and both windows show a visible indicator

#### Scenario: Already recording

- **WHEN** a recording is already running and a browser window opens
- **THEN** the chrome shows the active state instead of offering a second recording

#### Scenario: Leaving the call

- **WHEN** the browser window closes while the recording it shows is running
- **THEN** the app warns and lets the user stop or keep recording

### Requirement: Deep links hand URLs to the app

The application SHALL accept a meeting link handed to it by the operating system — a registered meeting scheme or an `https` launch argument — validate the URL, and route a link on a host the browser may load to the browser window. A second invocation for the same URL SHALL focus the existing window. A link that fails validation SHALL NOT load silently: the failure SHALL be reported in a dialog and nothing SHALL open. A URL on a host the browser may not load SHALL open in the system browser.

#### Scenario: Handoff from another app

- **WHEN** the app is registered for a meeting scheme and the system hands it a link
- **THEN** the equivalent https URL opens in the browser window, or its existing window is focused

#### Scenario: Invalid input

- **WHEN** the handed link is malformed or does not resolve to an https URL
- **THEN** the app reports it in a dialog and loads nothing

#### Scenario: An ordinary link

- **WHEN** the handed https URL is on a host the browser may not load
- **THEN** the app opens it in the system browser

### Requirement: In-app meetings do not double-prompt

While a browser window is open, the existing external-meeting detection prompt SHALL NOT appear, and detection SHALL resume unchanged when the last browser window closes.

#### Scenario: An in-app call

- **WHEN** a call runs in the Vibe browser window
- **THEN** the external detection prompt stays silent for it

#### Scenario: An external call

- **WHEN** no browser window is open and a call runs in the system browser
- **THEN** the existing detection prompt appears as before
