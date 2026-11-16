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

### Requirement: Blocked hosts can be allowed from the browser itself

While the strict policy is blocking a host, the browser chrome SHALL offer the blocked hosts with an Allow action of its own, so unblocking never requires a trip to Settings; allowing reloads the page. The in-browser list SHALL be hidden when nothing is blocked or the policy is not strict.

#### Scenario: Unblocking from the browser

- **WHEN** resources of the open page were blocked and the user allows one of the listed hosts in the chrome
- **THEN** the host joins the allowlist, leaves the blocked list, and the page reloads

#### Scenario: Nothing blocked

- **WHEN** no host is blocked or the policy is trusted-site
- **THEN** the chrome shows no blocked-hosts control

### Requirement: The policy has a strictness setting

The allowlist policy SHALL offer `strict` (the default: every origin, navigation and resource alike, must be on the allowlist) and `trusted-site` (a page opened on an allowlisted host may load its resources from anywhere; navigation still requires the allowlist). No mode SHALL drop the navigation allowlist.

#### Scenario: The default is strict

- **WHEN** the app starts with no stored policy
- **THEN** every origin is checked, and blocked hosts are listed in the chrome and in Settings

#### Scenario: Trusted-site loads a CDN

- **WHEN** the policy is trusted-site and the user opens a page on an allowed host whose scripts come from another origin
- **THEN** the page loads fully and nothing is added to the blocked list

#### Scenario: Navigation stays gated

- **WHEN** the policy is trusted-site and a link points at a host outside the allowlist
- **THEN** the navigation is refused as in strict mode
