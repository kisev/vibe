# Why update channels work this way

GitHub has one "latest release". Vibe needs three lines — Release, Beta, and Dev — that a user can switch between, including from an older install. That mismatch drives the channel design.

## Why the website, not GitHub

The app reads `updater/<channel>.json` from the website. Each file is the `latest.json` a release build produced, copied next to the others:

- Release → `stable.json`
- Beta → `beta.json`
- Dev → `dev.json`

A channel file is a static asset deployed with the site, so pointing a line at a build is a commit, not a release edit. It also lets a missing channel mean something precise: a `404` or `410` is "nothing on this line", which the app reports as up to date. If the app fell back to another channel on a missing file, a Beta user with no candidate would silently be moved to Release.

## Why the beta suffix is `-rc.<n>`

Semver sorts:

```text
X.Y.Z-dev.N < X.Y.Z-rc.N < X.Y.Z
```

That ordering is the whole reason for the spelling. With the updater's strict comparison, Dev → Beta → Release always moves forward; no special-case override is needed.

An earlier line used `-beta.N`, but it had no dev channel. `X.Y.Z-beta.N` sorts above `X.Y.Z-dev.N`, so a beta build would look newer than every dev build and break the switch. The beta channel keeps its name; only the version suffix is `-rc.<n>`.

## Why beta carries only candidates

Only an `X.Y.Z-rc.<n>` version is written to `beta.json`; a plain release is rejected. This keeps the beta line meaningful: it is the candidate line, not a second stable line. After a stable release, a Beta install moves to the final by switching its channel to Release, where `X.Y.Z` sorts above its candidates.

## Forward-only updates

The updater only moves forward. A bad release is fixed by shipping a newer one, which is what the beta line is for: catch it before Release gets it. This is also why a Release or Beta install that selects Dev sees "up to date": every dev build sorts below the version it already runs. Moving to the dev line takes one manual install of a dev build; after that the Dev channel updates it forward.

## Trade-offs

- **Copied manifests** mean a channel change is a commit to `main` plus a site deploy, not an API call. The delay is minutes and the history is reviewable.
- **No fallback between channels** means a user sees an accurate "up to date" rather than a surprise downgrade or a cross-line jump.
- **Dev requires one manual install** is the price of keeping semver ordering honest. Automating it would need a channel concept the old clients do not have.

## Related pages

- [Update channels](/vibe/docs#update-channels) for the files and version rules.
- [Switch update channels](/vibe/docs#switch-update-channels) for the steps.
