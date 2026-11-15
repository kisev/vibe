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
