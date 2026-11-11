# Tasks

## 1. Channel support

- [ ] 1.1 Add `Dev` to `Channel` in `updater.rs` with `https://kisev.github.io/vibe/updater/dev.json`, keeping `Stable` and `Beta` in the selector; verify URL mapping and deserialization with unit tests
- [ ] 1.2 Extend the persisted channel value with `dev` and make a channel switch trigger an immediate check; verify the value survives a restart and stored `stable`/`beta` values keep working

## 2. Dev updater artifacts

- [ ] 2.1 Enable signed updater artifacts and `latest.json` for dev builds in `dev-build.yml`, leaving the release workflow untouched; verify a dev release publishes signed artifacts and a manifest that verifies with the fork pubkey
- [ ] 2.2 Keep the one-dev-release cleanup working with artifacts present; verify only the newest complete dev release remains after two builds

## 3. Channel manifests

- [ ] 3.1 Generate `updater/dev.json` in the website build from the newest complete dev prerelease (all platform assets and `latest.json` present), authenticated with the workflow token; verify a built site serves the manifest
- [ ] 3.2 Keep the previous manifest when the release is partial or the API fails; verify with a mocked failure
- [ ] 3.3 Dispatch the website deploy from the end of the dev-build workflow; verify a fresh dev build refreshes the published manifest
- [ ] 3.4 Replace `version_key` in `scripts/channel.py` with a full semver comparator (prerelease parsed, `rc.N` compared numerically, release newer than its prereleases) and accept `X.Y.Z-rc.N` for `--channel beta`; unit-test the ordering `1.0.0-dev.70 < 1.0.0-rc.1 < 1.0.0-rc.2 < 1.0.0` and the beta-behind-stable promotion

## 4. Release candidates

- [ ] 4.1 Add a `version` input to `release.yml` that rewrites `desktop/src-tauri/tauri.conf.json` before the build and names the tag; default to the config version so a plain release is unchanged; verify the tag and the built version match the input
- [ ] 4.2 Publish an `-rc.` version as a GitHub prerelease with `make_latest: 'false'` and refuse an `-rc.` tag on anything but `main`; verify a candidate does not become "latest" and a malformed tag fails the run
- [ ] 4.3 Require the candidate's changelog file (`i18n/changelog/<version>.md`) and document the cut in `docs/UPDATER.md`: rc from `main`, `beta.json` points at it, stable publish promotes beta
- [ ] 4.4 Cut the first real candidate and point `beta.json` at it with `scripts/channel.py … --channel beta`; verify a beta install is offered the candidate and a release install is not

## 5. Update controls

- [ ] 5.1 Replace the "Beta updates" switch with a Release/Beta/Dev selector and an explicit "Check for updates" action in General, including current version, last check, state, notes, and progress; verify component tests for current, available, downloading, error, and channel switch
- [ ] 5.2 Explain the semver boundary when a release install selects Dev or Beta and offer no update; verify the copy and that no `1.0.0-dev.N` or `1.0.0-rc.N` is offered to a 1.0.0 build
- [ ] 5.3 Keep the automatic check and mirror the state in About if that surface exists; verify a manual check and an automatic check report through the same state

## 6. Documentation and strings

- [ ] 6.1 Update `docs/UPDATER.md` with the three channels, their tag rules, the `-rc.<n>` spelling and its semver reason, manifest generation, and the manual-install boundary; verify the doc matches the implementation
- [ ] 6.2 Add the new UI strings in en-US and translate them through the normal flow; verify `task i18n:audit` passes

## 7. Validation

- [ ] 7.1 Live: a dev install on the Dev channel is offered and installs the next dev build, keeping settings and identifier; verify from the update UI and the ARP entry
- [ ] 7.2 Live: a release install on Dev and on Beta reports no update and explains why; switching back to Release works
- [ ] 7.3 Live: a beta install is offered the rc and then the stable release that promotes it
- [ ] 7.4 Negative: a tampered channel manifest is refused with an error and the installed version is untouched
- [ ] 7.5 Live acceptance: the update group reads clearly (current version, channel, last check, one obvious action), each channel's switch behaves as explained, the dev → dev upgrade works, and the rc → stable path works in the app; report what should change before archiving
