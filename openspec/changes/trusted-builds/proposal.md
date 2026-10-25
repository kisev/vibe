# Proposal

## Why

The fork's binaries are unsigned: Windows shows SmartScreen warnings, and nothing proves a downloaded bundle came from this repository's workflow. The user accepts only free options — Apple's $99/year Developer Program is out, so macOS stays unsigned by design. Free trust, however, is available at three layers: the updater is already minisign-signed (done), GitHub can attest that artifacts came from exactly this workflow (free, no certificates), and Windows binaries can get a publicly trusted Authenticode signature for free through the SignPath Foundation's open-source program.

## What Changes

- Release artifacts ship with free provenance: GitHub artifact attestations, an SBOM per bundle (syft), and a trivy scan of the published files.
- The Windows signing step in `release.yml` becomes a provider switch behind the existing `sign-windows` input: `sign-server` (the current remote-YubiKey path), `signpath` (wired for when the Foundation application is approved), and `self-signed` (zero-cost fallback with the fingerprint published in the README).
- macOS stays unsigned, with the right-click install path documented in the release notes and README.
- A checklist document walks the user through the SignPath Foundation application (the only step that needs a human outside the repo).

## Capabilities

### New Capabilities

- `trusted-builds`: free, verifiable build provenance (attestations, SBOM, artifact scanning) and the Windows signing provider switch.

### Modified Capabilities

_None._
