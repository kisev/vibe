# Proposal

## Why

A full review of `v1.0.0..HEAD` (OCR session `0f6fd8ac-d821-4771-a647-554acf7221a4`, run 2026-11-14)
raised 167 findings across 84 files: correctness bugs in the browser chrome, recording gates and
sidecar startup; fail-open navigation policy and supply-chain gaps in the ffmpeg and ggml fetches;
CI steps that call `gh` without a token or a hard-coded `python3` on Windows; and a tail of
maintainability and documentation defects. Several findings predate commits landed after the review
started (`244b8c98`, `24394c36`, `2048d075`, `b1ded741`), so the sweep re-checks every finding
against the current tree instead of applying the report verbatim.

## What Changes

- Every finding in `review-1.md` is classified against the current tree as valid, already fixed, a
  false positive, or needing a decision; only valid findings are changed.
- Correctness fixes land in the desktop backend (browser policy, protocol registration, server
  lifecycle), the desktop frontend (recording gates, chrome, config, mock Tauri), the website and
  the packaging/CI scripts.
- Security fixes close fail-open navigation, enforce allowlist entries that are real domains, and
  authenticate `gh` in every CI step that fetches release assets. Checksum pinning of third-party
  ffmpeg builds is recorded as a decision, not invented.
- CI and repository configuration are corrected where they would fail or mislead on Windows,
  macOS and Linux runners.

## Capabilities

None. The sweep changes no specified behavior: it fixes defects and records per-finding decisions in
`sweep-report.md`, so the change sets `skip_specs: true`. The existing `dev-tooling`, `desktop-e2e`,
`site-locale`, `site-roadmap` and `docs` capabilities are affected code, not requirement changes.

## Impact

- `desktop/src-tauri/**`, `desktop/src/**`, `scripts/**`, `.github/workflows/**`, `taskfile.yml`,
  `lefthook.yml`, `renovate.json`, `pyproject.toml`, `website/**`, `i18n/**`.
- `task verify` must stay green; `openspec validate --all --strict` must pass.
