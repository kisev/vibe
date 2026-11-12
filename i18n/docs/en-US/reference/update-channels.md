# Update channels

The app updates from one of three channel files on the website, not from GitHub's "latest release":

| Channel | File |
| --- | --- |
| Release | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

Each file is the `latest.json` a release build produced. A missing file means the line has nothing on it: the app reports "up to date" rather than falling back to another channel.

## Lines and versions

| Channel | Tag | Branch | Version | What it is |
| --- | --- | --- | --- | --- |
| Release | `vX.Y.Z` | `main` | `X.Y.Z` | The stable line |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Candidate for the next stable, published as a prerelease |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | The moving build of `dev` |

A plain release is rejected on the beta channel; only `X.Y.Z-rc.<n>` is accepted there. A channel with no candidate is absent, not empty.

## In the app

- **Settings → General → Updates** carries the channel selector, the current version, **Check for updates**, the last check time, and the outcome.
- The app probes `updater/<channel>.json` itself. A `404` or `410` means the channel was never published; every other failure is a real error.
- The check runs at startup and after a channel switch.

## Boundaries

- The updater only moves forward. A bad build is fixed by shipping a newer one.
- A Release or Beta install that selects Dev sees "up to date": every dev build sorts below the version it already runs. Moving to the dev line takes one manual install of a dev build; after that the Dev channel updates it forward.
- A Beta install moves to the final release by switching to Release, where `X.Y.Z` sorts above its candidates.

## Related pages

- [Switch update channels](/vibe/docs#switch-update-channels) for the steps.
- [Why update channels work this way](/vibe/docs#update-channels-design) for the design.
