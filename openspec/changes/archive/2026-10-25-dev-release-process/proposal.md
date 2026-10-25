# Proposal

## Why

Every push to `main` runs a five-platform dev build (Linux x2, macOS x2, Windows), whether or not anyone is ready to install one — 35 dev releases accumulated in a day. Builds should run when the maintainer asks for one, not on every commit. The fork also carries dev.1…dev.35 tags and releases that nothing consumes: the updater reads `releases/latest`, which excludes prereleases.

## What Changes

- The dev build triggers on a pushed `dev.<number>` tag (plus manual `workflow_dispatch`), and derives the build version from that tag instead of auto-incrementing.
- A one-time cleanup deletes every dev tag and release except the most recent one. `server-v*` tags are untouched. No automatic pruning is added — future cleanup is manual, on purpose.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `dev-build`: the trigger requirement changes from "every main push" to "every `dev.<number>` tag"; the version derivation follows the tag.
