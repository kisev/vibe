# Spec Delta

## Purpose

Free build trust: verifiable provenance for every published artifact without paid certificates, and a provider switch for Windows Authenticode so a free publicly trusted option slots in when approved.

## ADDED Requirements

### Requirement: Attested artifacts

Every published release artifact SHALL carry a GitHub artifact attestation linking it to the exact workflow run and commit, verifiable offline with `gh attestation verify`, at zero certificate cost.

#### Scenario: Verifying a download

- **WHEN** a user downloads a bundle from a release and runs the attestation verification
- **THEN** it proves the file was produced by this repository's workflow for that commit

### Requirement: SBOM and scan per release

Each release SHALL publish a software bill of materials for its bundles (syft) and a trivy scan of the published files, with findings surfaced in the workflow summary rather than silently ignored.

#### Scenario: SBOM alongside bundles

- **WHEN** a release publishes its artifacts
- **THEN** an SBOM document is attached next to them

#### Scenario: Vulnerability found

- **WHEN** trivy finds a known vulnerability in a published artifact
- **THEN** the workflow summary names it and the release step fails

### Requirement: Windows signing provider switch

The release workflow's Windows signing SHALL be a provider selection with three free-or-owned options: the existing sign-server (remote YubiKey), SignPath Foundation (publicly trusted, free for this open-source fork, enabled by repo secrets once approved), and self-signed (zero cost, fingerprint published in the README). An unsigned run SHALL remain possible exactly as today.

#### Scenario: Self-signed run

- **WHEN** the user selects self-signed signing
- **THEN** binaries are signed with the repository's own certificate and the README carries its fingerprint for one-time trust

#### Scenario: SignPath enabled

- **WHEN** the Foundation application is approved and the repo secrets are set
- **THEN** selecting the signpath provider produces publicly trusted signatures with no other workflow change

#### Scenario: No provider

- **WHEN** signing is disabled
- **THEN** the run behaves as it does today

### Requirement: macOS stays unsigned, documented

macOS bundles SHALL remain unsigned (Apple requires a paid program), and the supported install path SHALL be documented in the README and release notes.

#### Scenario: Install on macOS

- **WHEN** a user installs the unsigned bundle
- **THEN** the release notes describe the Gatekeeper bypass steps for the current macOS version
