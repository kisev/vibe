# Proposal

## Why

A release body carries the English notes only. The website already publishes the same entry in every supported locale at `https://kisev.github.io/vibe/changelog/<version>`, but a reader arriving from GitHub has no way to find their language. Dev builds already link readers to the dev notes alias; stable and candidate releases should point at their own version the same way.

## What Changes

- Stable and candidate release bodies gain the line `Read this changelog in your language: https://kisev.github.io/vibe/changelog/<version>` naming the version being released. The English notes stay inline as the source language.
- The body is assembled by `scripts/release_notes.py` (via `task release:notes`): it strips the changelog frontmatter, keeps the body unchanged, and prepends the link line. Promotion uses that file instead of the ad-hoc `awk` pipeline.
- The prerelease body `release.yml` publishes before promotion carries the same link line for the version it builds.
- Dev builds keep the existing `Read the latest dev notes` line and the `/changelog/dev` alias; nothing changes there.

## Capabilities

### New Capabilities

- `release-notes`: how the GitHub release body relates to the versioned changelog entry and the translated website changelog.

## Impact

- `scripts/release_notes.py` (new), `taskfile.yml` (`release:notes`), `.github/workflows/release.yml` (prerelease body), `.claude/skills/release/SKILL.md` (promotion step).
- No app, server or website change; the existing translated entries and the whole-entry English fallback are reused.
