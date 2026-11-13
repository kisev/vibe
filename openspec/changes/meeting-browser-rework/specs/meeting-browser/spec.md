# Spec Delta

## ADDED Requirements

### Requirement: The browser window always renders and always closes

Any `https://` link SHALL open in a browser window inside Vibe that renders the page and always offers a way out: a titlebar close, and a bar with the address, back, forward, reload, open in the system browser and close.

#### Scenario: A page renders

- **WHEN** a meeting or ordinary link is opened
- **THEN** the content window shows the page, and the bar shows its address with working back, forward, reload and close

#### Scenario: A page never loads

- **WHEN** the page has not finished loading after the timeout
- **THEN** the bar offers retry and close, and closing always works

#### Scenario: The window is created on Windows

- **WHEN** the content webview is created
- **THEN** it uses the process's WebView2 environment (no separate data directory), so creation cannot block the app
