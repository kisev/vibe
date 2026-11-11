# Updater

Vibe updates from one of three channel files on the website, not from GitHub's latest release:

- `https://kisev.github.io/vibe/updater/stable.json` — Release
- `https://kisev.github.io/vibe/updater/beta.json` — Beta (release candidates)
- `https://kisev.github.io/vibe/updater/dev.json` — Dev

Each is the `latest.json` a release build produced. Settings → General → Updates carries the
channel selector, the current version, a "Check for updates" action, the last check time, and the
outcome. The app side is `desktop/src-tauri/src/updater.rs`.

## The three lines

| Channel | Tag | Where | Version | What it is |
| --- | --- | --- | --- | --- |
| Release | `vX.Y.Z` | `main` | `X.Y.Z` | The stable line |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Candidate for the next stable, published as a GitHub prerelease |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | The moving build of `dev` |

The `-rc.<n>` spelling is deliberate. Semver sorts `X.Y.Z-dev.N` below `X.Y.Z-rc.N` below `X.Y.Z`,
so switching Dev → Beta → Release always moves forward with the updater's strict comparison and no
overrides. Upstream historically used `-beta.0`, but it had no dev channel; `X.Y.Z-beta.N` would
sort *above* `X.Y.Z-dev.N`, breaking that switch. The beta channel keeps its name; only the suffix
is `-rc.<n>`.

A release or beta install that selects Dev sees "up to date": every dev build sorts below the
version it already runs. Moving to the dev line takes one manual install of a dev build; after
that, the Dev channel updates it forward.

## Shipping a release candidate

```console
# Release workflow → Run workflow, version: 1.1.0-rc.1 (from main)
# It rewrites tauri.conf.json, tags v1.1.0-rc.1, publishes a prerelease.
uv run scripts/channel.py 1.1.0-rc.1 --channel beta
```

Commit `website/public/updater/` to main after each step; the website deploy publishes it in a
few minutes. Candidate notes live in `i18n/changelog/1.1.0-rc.1.md`, next to the stable notes.

## Shipping a release

```console
# after release.yml finished (the GitHub release is a prerelease)
uv run scripts/channel.py 1.0.0 --channel beta     # beta users first
uv run scripts/channel.py 1.0.0 --channel stable   # once beta looks fine
gh release edit v1.0.0 --prerelease=false --latest # last: older apps read GitHub
```

Promoting to stable also moves beta forward, so beta is never behind stable. `scripts/channel.py`
refuses to move a channel backwards and understands `-rc.<n>` ordering.

## Dev builds

Dev releases are cut by `dev-build.yml` from `dev.<n>` tags and carry signed updater artifacts plus
`latest.json`. The Deploy Website workflow reads the newest complete dev release and writes
`updater/dev.json`; a fresh dev build dispatches that deploy. If the newest dev release is partial
or the API call fails, the website keeps the previous `dev.json`.

The updater only moves forward. A bad release is fixed by shipping a newer one — which is what beta
is for: catch it before stable gets it.

Apps built before the channel files (the upstream 3.x line) don't know about them: they still update from whichever GitHub
release is marked "latest". So `gh release edit --latest` is what ships a version to them — run it
last, once the version is already on stable.
