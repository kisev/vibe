# Update channels

The app updates from one of three channel files on the website, not from GitHub's latest release:

| Channel | File |
| --- | --- |
| Release | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

Each file is the `latest.json` a release build produced. A channel with no file is a line with nothing on it: the app reports "up to date" rather than falling back to another channel or treating the missing file as a failed check.

## Lines and versions

| Channel | Tag | Branch | Version | What it is |
| --- | --- | --- | --- | --- |
| Release | `vX.Y.Z` | `main` | `X.Y.Z` | The stable line |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Candidate for the next stable, published as a GitHub prerelease |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | The moving build of `dev` |

`beta.json` is absent while no candidate is published. A plain release is rejected on the beta channel; only `X.Y.Z-rc.<n>` is accepted there.

## Where the manifests come from

- **Release and beta**: the release build's Tauri updater produces `latest.json`. `scripts/channel.py <version> --channel <stable|beta>` downloads it from `https://github.com/kisev/vibe/releases/download/v<version>/latest.json`, validates the version, and writes `website/public/updater/<channel>.json`. Commit the file to `main`; the website deploy publishes it.
- **Dev**: `.github/workflows/dev-build.yml` publishes a prerelease with updater artifacts and `latest.json`. `scripts/dev_manifest.py` reads the newest complete dev release and writes `website/public/updater/dev.json`; a fresh dev build dispatches the website deploy. If the newest release is partial or the API call fails, the previous `dev.json` stays.

`channel.py` refuses to move a channel backwards and understands `-rc.<n>` ordering.

## In the app

- **Settings → General → Updates** carries the channel selector, the current version, **Check for updates**, the last check time, and the outcome.
- Runtime selection lives in `desktop/src-tauri/src/updater.rs`; the webview side is `desktop/src/providers/updater.tsx`.
- `desktop/src-tauri/src/updater.rs` probes `updater/<channel>.json` directly. A `404` or `410` means the channel was never published; every other failure is a real error.
- The Tauri plugin's static endpoint in `tauri.conf.json` is the fallback the plugin itself knows about; the channel choice happens in the app code.

## Boundaries

- The updater only moves forward. A bad build is fixed by shipping a newer one.
- A release or beta install that selects Dev sees "up to date": every dev build sorts below the version it already runs. Moving to the dev line takes one manual install of a dev build; after that the Dev channel updates it forward.
- A Beta install moves to the final release by switching to Release, where `X.Y.Z` sorts above its candidates.
- Apps built before the channel files (the upstream 3.x line) still read whichever GitHub release is marked "latest". `gh release edit --latest` is what ships to them, run last.

See [Publish a release](../how-to/publish-a-release.md) and [Cut a dev build](../how-to/cut-a-dev-build.md) for the procedures, and [the explanation](../explanation/update-channels.md) for why the lines and suffixes are shaped this way.
