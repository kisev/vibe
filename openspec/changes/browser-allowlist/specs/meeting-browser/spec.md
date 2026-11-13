# Spec Delta

## ADDED Requirements

### Requirement: Only allowlisted domains may load

The embedded browser SHALL load a page only when its host, or a subdomain of it, is in the allowlist; every other navigation SHALL be refused. Every resource request from a host outside the list SHALL be refused as well, and the host SHALL be recorded once.

#### Scenario: An allowlisted host

- **WHEN** the user opens `https://meet.example.com/room/1` with `example.com` allowed
- **THEN** the page loads, and resources from `example.com` and its subdomains load too

#### Scenario: A navigation outside the list

- **WHEN** a link points at a host that is not allowed
- **THEN** the browser refuses the navigation and records the host

#### Scenario: A resource outside the list

- **WHEN** an allowed page requests a script or image from another origin
- **THEN** the request is refused, and that origin appears in the blocked list once

### Requirement: Blocked hosts are visible and allowable in place

Settings SHALL show the allowlist and the unique blocked hosts, and each blocked host SHALL offer an action that adds it to the allowlist and reloads the page.

#### Scenario: Allowing a blocked host

- **WHEN** the user presses Allow on a blocked host
- **THEN** the host joins the allowlist, disappears from the blocked list, and the open page reloads

#### Scenario: Removing an allowed host

- **WHEN** the user removes an allowed host
- **THEN** its pages are refused on the next navigation and appear among the blocked hosts
