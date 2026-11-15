# meeting-browser Specification

## Purpose

The in-app meeting browser: one window holding the app's chrome above a remote page, which loads meeting pages only from an allowlist, applies a strictness policy to every navigation and resource request, and resolves refused hosts in place.

## Requirements

### Requirement: The blocked list grows the chrome instead of a popup

The chrome SHALL show blocked hosts in a region that is part of the chrome webview: pressing the shield grows the chrome by one fixed blocked-list region height and shrinks the page below it, and pressing again restores the toolbar. The region is tall enough for a handful of hosts and scrolls past that, so the list SHALL never be clipped by the page.

#### Scenario: Opening the blocked list

- **WHEN** the shield is pressed
- **THEN** the chrome grows by the blocked-list region height, the blocked hosts with their Allow buttons are shown in the region, and the page occupies the remaining height

#### Scenario: Closing the list

- **WHEN** the list is closed
- **THEN** the chrome returns to its toolbar height and the page takes the space back

### Requirement: A policy change applies to open windows

Changing the policy SHALL affect the window that is already open, without closing and reopening it: the next request follows the new mode.

#### Scenario: Switching to trusted-site

- **WHEN** the policy changes to `trusted-site` while a page is open
- **THEN** the page's resources stop being filtered immediately

### Requirement: The page matches the window at first paint

The page webview SHALL be sized to the window's physical bounds when it is created and whenever the scale factor changes, so a page never renders larger than its window until the window is resized.

#### Scenario: Opening on a scaled display

- **WHEN** the browser window opens on a display with a scale factor above one
- **THEN** the page fills the area under the toolbar exactly, with no oversized content

### Requirement: The browser chooses its recording devices

The browser chrome SHALL let the user pick the microphone and the output device for the recording it starts, showing the current selection, sharing that selection with the main window, and disabling the pickers while a recording runs.

#### Scenario: Changing the microphone from the browser

- **WHEN** the user picks another microphone in the browser chrome
- **THEN** the next recording started from the browser uses it, and the main window shows the same selection

#### Scenario: Recording in progress

- **WHEN** a recording runs
- **THEN** the pickers are disabled and name the devices being recorded

### Requirement: The pickers render above the page

The chrome's device pickers SHALL show their options completely, drawn by the platform where a popup inside the 104-pixel chrome would be clipped by the page webview below it.

#### Scenario: Opening a picker

- **WHEN** the user opens the microphone or output picker in the chrome
- **THEN** every device in the list is visible and selectable, not cut off at the toolbar's edge

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
