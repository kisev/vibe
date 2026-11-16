# Spec Delta

## ADDED Requirements

### Requirement: Strict resource filtering holds on every platform

The browser window SHALL NOT offer a strict filtering mode on a platform where it does not enforce it.

#### Scenario: Strict mode on a platform without a filter

- **WHEN** the user enables strict filtering on a platform where resource blocking is not implemented
- **THEN** the setting is unavailable there, or the platform's filter is enforced — never a silent no-op

### Requirement: The meeting log does not carry a secret

Log output SHALL NOT contain a full meeting URL. When a URL must be logged, only its scheme and host are written.

#### Scenario: A Zoom meeting is opened

- **WHEN** the meeting browser loads a Zoom address that carries a password or token
- **THEN** the log line names the host, and no part of the meeting secret appears in any log file
