# Publish a release

Releases are cut with `.github/workflows/release.yml` (dispatch only) and published as GitHub prereleases. A channel file on the website decides which builds the in-app updater offers. [Update channels](../reference/update-channels.md) lists the files and rules; [the explanation](../explanation/update-channels.md) covers why the lines and suffixes are what they are.

## Before the release

- The commit is on `main`.
- The Lint run for that exact revision is green.
- The release notes exist at `i18n/changelog/<version>.md`. `task ci:changelog-gate` fails the release when the file is missing.

`tauri.conf.json` carries the version. The workflow's `version` input overrides it for the run; leave it empty to release the committed version.

## Cut a release candidate

```console
# GitHub → Actions → Release → Run workflow
# branch: main, version: 1.1.0-rc.1
```

The workflow rewrites `tauri.conf.json` for the run, tags `v1.1.0-rc.1`, and publishes a prerelease whose `latest.json` the updater can read. Point the beta channel at it from a checkout:

```console
uv run scripts/channel.py 1.1.0-rc.1 --channel beta
git add website/public/updater/beta.json
git commit -m "Point beta at 1.1.0-rc.1"
```

Commit to `main`. The website deploy publishes `updater/beta.json` within a few minutes. `channel.py` accepts only `X.Y.Z-rc.<n>` on the beta channel; a plain release is rejected there.

## Publish a stable release

```console
# GitHub → Actions → Release → Run workflow
# branch: main, version: 1.0.0
```

After the workflow finishes and the candidate has passed testing:

```console
uv run scripts/channel.py 1.0.0 --channel stable
git add website/public/updater/stable.json
git commit -m "Point stable at 1.0.0"
```

Then mark the release stable on GitHub:

```console
gh release edit v1.0.0 --prerelease=false --latest
```

Run the `gh release edit` last. Apps built before the channel files (the upstream 3.x line) still read whichever GitHub release is marked "latest", so this is what ships the version to them.

Promoting a release does not move the beta channel. `channel.py` writes `beta.json` only for release candidates, so a stable install on Beta moves to the final by switching its channel to Release, where `X.Y.Z` sorts above its candidates.

## Optional signing

The workflow takes two boolean inputs, both off by default:

- `sign-windows` signs through the remote YubiKey server. See [Sign Windows binaries](sign-windows-binaries.md).
- `sign-macos` signs and notarizes with an Apple Developer ID. See [Sign and notarize macOS builds](sign-and-notarize-macos.md).

The updater artifacts are signed by Tauri with `TAURI_PRIVATE_KEY` regardless; the platform signing inputs add OS-level signatures to the binaries.

## If something is wrong

The updater only moves forward. Fix a bad release by shipping a newer one, which is what the beta line is for: catch the problem before stable gets it. See [Update channels](../explanation/update-channels.md).
