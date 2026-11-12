# Proposal

## Why

The public feature list still describes the upstream product: it promises AI summaries through one API, a fixed export set, and a generic privacy story, and it never mentions the fork's own work — the model comparison lab, the three update channels, the embedded meeting browser, the local API and agent skills, phone handoff, or the translated site. Nothing on the site says what is planned either, so readers cannot tell an idea in an OpenSpec proposal from a shipped capability.

The fork's plans already live in `openspec/changes/*/proposal.md`. Maintaining a second roadmap by hand would drift from them on the first change, so the site should generate the list from those files at build time, exactly like `scripts/dev_manifest.py` generates `website/public/updater/dev.json`.

## What Changes

- `scripts/roadmap.py` reads every unarchived `openspec/changes/<name>/proposal.md`, skips `archive/`, takes the first sentence of the `## Why` section, strips Markdown, and writes `website/public/roadmap.json` sorted by change name. A proposal without a readable `## Why` fails the run instead of silently dropping a change.
- `scripts/website_build.sh` (the body of `task website:build`) runs the generator before `pnpm build`, next to the existing `website_links.py` and `dev_manifest.py` steps.
- The site gains a `/roadmap` route and a nav entry. It lists the planned changes with a note that they are planned, not shipped, and states where the list comes from.
- The Features page is refreshed against the fork's settings surfaces and message catalogs: the existing copy is corrected where it no longer describes the app, and the fork's own capabilities are added as new cards. The page stays data-driven through `features.json`.
- New UI copy lands in `i18n/website/en-US.json` only; other locales fall back to English until the normal translation pass.

## Capabilities

### New Capabilities

- `site-roadmap`: how the public site derives its planned-work list from the repository's OpenSpec changes, and what the roadmap and feature pages promise.

### Modified Capabilities

None.
