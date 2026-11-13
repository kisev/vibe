# Spec Delta

## ADDED Requirements

### Requirement: The browser window always renders and always closes

The browser SHALL show its chrome and the page in one window: the address bar, back, forward, reload, open in the system browser, close and the record action sit at the top, and the page fills the rest of the same window. The window SHALL be creatable without blocking the app, and a page that never loads SHALL offer retry and close.

#### Scenario: A page renders in a single window

- **WHEN** a meeting or ordinary link is opened
- **THEN** one window opens with the chrome at the top and the page below it, and the page resizes with the window

#### Scenario: A page never loads

- **WHEN** the page has not finished loading after the timeout
- **THEN** the chrome offers retry and close, and closing always works

#### Scenario: Recording from the chrome

- **WHEN** the chrome's record action is pressed on a meeting host
- **THEN** the main window starts the configured recording and the chrome shows the recording state

### Requirement: The browser opens from the home page

The main window SHALL offer a visible action that opens a link in the embedded browser without visiting Settings.

#### Scenario: Opening from home

- **WHEN** the user pastes a link on the home page's browser action
- **THEN** the embedded browser opens on it, in the same single window
