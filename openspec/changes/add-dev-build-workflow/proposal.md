# Proposal

## Why

The fork has no way to produce an installable build of its own work. The only
existing pipeline, `release.yml`, is manual, needs `chore` and the upstream
signing secrets, and fetches its sidecars from the `server-v<.server-version>`
release — but the fork pins `v0.7.0`, which upstream never published, so that
step cannot succeed for the changes we are shipping. Every test of the GigaAM
engine therefore means building the server and the app by hand on one machine.

## What Changes

- Add `.github/workflows/dev-build.yml`, a separate workflow that builds all
  five release platforms (macOS arm64 and x86_64, Linux x86_64 and aarch64,
  Windows x86_64) on every push to `main` and on manual dispatch.
- Build the `vibe-server` sidecar from the checked-out tree instead of
  downloading the pinned server release, so the build always carries the
  engine changes on `main`.
- Fetch the ggml static libraries and the ffmpeg binaries directly from their
  public sources, reproducing what the `chore` tasks do without installing
  `chore`.
- Disable updater artifacts for dev builds, so no signing key or other secret
  is required.
- Stamp the version as `<base>-dev.<short-commit>` and turn the update channel
  off, so a dev build never claims to be the release it was branched from and
  never offers to replace itself with one.
- Keep the build fast enough to be useful: no LTO, a cached server workspace,
  and a lean dependency install.
- Publish the bundles as a rolling prerelease tagged `dev`, replaced on every
  successful run, so one stable URL always holds the newest build.
- Leave every upstream-owned file untouched: `release.yml`, the `chorefile`s,
  and the app configuration. No app code changes.

Out of scope: automatic updates for dev builds (they keep pointing at the
upstream release channel), running the test suites as a gate, and any change
to the upstream release process.

## Capabilities

### New Capabilities

- `dev-build`: the fork's continuous build contract — when a dev build runs,
  which platforms it covers, where its sidecars come from, what it publishes,
  and which secrets and upstream files it must not depend on.

### Modified Capabilities

None.

## Impact

- New workflow file `.github/workflows/dev-build.yml`; no other tracked file
  changes.
- Repository settings: GitHub Actions must be enabled on the fork, and the
  inherited `Deploy Website` workflow should be disabled there, because it also
  triggers on pushes to `main` that touch `i18n/`.
- Consumes public assets from `thewh1teagle/vibe` releases
  (`libraries-ggml-v0.22.0-r6`), `osxexperts.net`, and `gyan.dev`.
- Produces a `dev` prerelease in the fork's Releases with unsigned installers.
