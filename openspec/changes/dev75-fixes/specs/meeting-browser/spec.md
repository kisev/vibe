# Spec Delta

## MODIFIED Requirements

### Requirement: Meeting links open in Vibe

Vibe SHALL register as the system handler for other applications' meeting schemes (`zoommtg:`, `msteams:`, `teams:`, `webex:`) when the user enables it in settings, and SHALL NOT require a `vibe://` link of its own. A registered scheme SHALL resolve to the web URL it carries and open it in the meeting window when the host is configured, or in the system browser otherwise. Registration SHALL be reversible from the same switch and SHALL report itself unavailable where the platform does not support it.

#### Scenario: Registration is optional

- **WHEN** the user has not enabled meeting link handling
- **THEN** the app is not registered for any scheme and the system's own handler keeps working

#### Scenario: An incoming Zoom link

- **WHEN** the app is registered and the system hands it `zoommtg://zoom.us/join?confno=…`
- **THEN** the app opens the equivalent `https://zoom.us/j/…` in the meeting window

#### Scenario: An ordinary link

- **WHEN** a registered scheme resolves to a host that is not in the meeting list
- **THEN** the link opens in the system browser, not in the meeting window

### Requirement: The meeting window can always be closed

Every meeting window SHALL carry its controls in the window itself — native frame and a menu with back, forward, reload, open-externally and close — so a page that fails to render still leaves the user a way to reload or close it.

#### Scenario: A page that does not render

- **WHEN** the address cannot be loaded and the view stays blank
- **THEN** the menu's reload retries the page and close closes the window

#### Scenario: Closing during a recording

- **WHEN** a recording is active and the user closes the window
- **THEN** the app asks whether to stop the recording or keep it running
