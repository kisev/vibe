# Proposal

## Why

Dev releases are cleaned up — only the newest dev release remains — and dev builds have no versioned changelog entry of their own; their notes are the `unreleased` entry at release time. Links that name a dev version (`/changelog/1.0.0-dev.72`) therefore land on "unknown version" as soon as that release is swept, and an app opened from an old dev release can point at a page that never existed. The changelog alias needs to outlive the release it came from.

## What Changes

- The website gains a stable dev changelog alias (`/changelog/dev`) that always renders the current dev-line entry (the `unreleased` one), and versioned dev URLs resolve to it instead of the unknown-version state.
- When the dev entry is empty or absent, the alias shows the newest released entry with a short notice instead of an error.
- Dev release bodies and the dev build's "What's new" link point at the alias, never at a dev version path.
- Stable changelog links keep their current behavior and versioned stable URLs are unaffected.

## Capabilities

### Modified Capabilities

- `changelog`: dev-line links become stable aliases that survive release cleanup, rather than versioned entries that can disappear.

## Impact

- `website/src/pages/Changelog.tsx`, `website/src/lib/changelog.ts` (dev-version detection and fallback), router in `website/src/App.tsx`.
- `desktop/src/lib/config.ts` (`changelogURL` maps dev versions to the alias).
- `.github/workflows/dev-build.yml` (release body link).
- No data migration; no server change.
