# Proposal

## Why

The server was released as `server-v0.9.0` while following the upstream project's numbering. This fork has its own line now: the app starts at 1.0.0 and the server is its own product with its own releases, so carrying upstream's 0.x numbering makes every release note and tag read as a continuation of a project this is not.

## What Changes

- The server's version starts at `1.0.0` and advances independently of the app and of upstream. Release tags keep the `server-v1.0.0` shape the workflow already triggers on.
- The crate version and `.server-version` move together: the crate is bumped now, and `.server-version` only when the release that carries it exists — bumping it earlier would point every local build and the dev workflow at a release that does not exist.
- Documentation states the numbering rule so the next release does not fall back to upstream's line.

## Capabilities

- `server-release` (new): how the server is versioned and published.

## Impact

- `server/crates/vibe-server/Cargo.toml`, `.server-version` (at release time), `docs/how-to/build-the-server.md`, `docs/how-to/publish-a-release.md`, the release skill.
