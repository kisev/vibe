# Proposal

## Why

The fork still carries the original project's outward-facing machinery: Aptabase telemetry that sends events to a third-party dashboard, and Ko-fi donation surfaces that point at someone else's support page. Vibe is a personal fork now: nothing may leave the device, and no surface may advertise or fund the upstream project.

## What Changes

- All outbound analytics disappears: the Aptabase client, every call site, the key and endpoint in configuration and CI, the export script and the analytics skill.
- Local debugging data stays: log files, the diagnostics report, and project export are unchanged and never transmitted by the app.
- Every Ko-fi surface disappears from the website (dialog, supporters wall, links) and the support-data script goes with it.
- The privacy policy states the resulting behaviour: no telemetry, no transmission; diagnostics leave only when the user shares them.

## Capabilities

### New Capabilities

- `privacy`: what the app may collect and transmit.

### Modified Capabilities

- `website`: the site carries no donation or upstream-support surfaces.

## Assumptions

- Losing aggregate usage and crash statistics is acceptable; user reports and the test suites replace them.
- Logs and the diagnostics bundle are local artefacts; a future explicit "share diagnostics" flow would be a separate, user-initiated feature.
