# Proposal

## Why

Re-verifying the changes archived after `v1.0.0` found defects the automated gates did not: the published release how-to promotes a release without rebuilding its body, so a stable release ships without the inline English notes the spec requires; `task verify` omits two locally-runnable CI jobs (the site build and the transcription spike); CI runs raw `cargo fmt`/`clippy` instead of the task targets, so the local and remote commands can drift; the roadmap build ignores `openspec/changes/**`; the prebuilt ggml archive is packaged into `ggml-build/` while `upload` reads the repository root; and the E2E job's path filter misses the files the suite reads.

## What Changes

- The release flow's promotion step runs `task release:notes` before `gh release edit`, and the candidate body keeps its inline English notes; `release_notes.py` refuses malformed frontmatter and non-`rc` prereleases.
- `task verify` covers the site build and the transcription spike, or the requirement is narrowed where a local run is genuinely impossible; CI calls `task rust:fmt-check`/`task rust:clippy` instead of raw cargo.
- The site deploy rebuilds on `openspec/changes/**` and `scripts/roadmap.py`.
- `scripts/ggml_libs.sh` packages the archive where `upload` expects it.
- The E2E workflow's path filter includes `i18n/desktop/**`, `scripts/ci/e2e.sh` and `taskfile.yml`.
- Residual `chore` references in plans and open changes are corrected; the retention scenarios name the tag they actually use.

## Capabilities

- `release-notes`, `dev-tooling` (existing).

## Impact

- `docs/how-to/publish-a-release.md`, `.claude/skills/release/SKILL.md`, `scripts/release_notes.py`, `taskfile.yml`, `.github/workflows/{lint,lint_rust,e2e,website}.yml`, `scripts/ggml_libs.sh`, docs and open change records, tests.
