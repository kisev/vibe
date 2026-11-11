# Tasks

## 1. Channel support

- [ ] 1.1 Add `Dev` to `Channel` in `updater.rs` with `https://kisev.github.io/vibe/updater/dev.json`, keeping `beta` accepted but unexposed; verify URL mapping and deserialization with unit tests
- [ ] 1.2 Extend the persisted channel value and make a channel switch trigger an immediate check; verify the value survives a restart and a stored `beta` keeps working

## 2. Dev updater artifacts

- [ ] 2.1 Enable signed updater artifacts and `latest.json` for dev builds in `dev-build.yml`, leaving the release workflow untouched; verify a dev release publishes signed artifacts and a manifest that verifies with the fork pubkey
- [ ] 2.2 Keep the one-dev-release cleanup working with artifacts present; verify only the newest complete dev release remains after two builds

## 3. Dev channel manifest

- [ ] 3.1 Generate `updater/dev.json` in the website build from the newest complete dev prerelease (all platform assets and `latest.json` present), authenticated with the workflow token; verify a built site serves the manifest
- [ ] 3.2 Keep the previous manifest when the release is partial or the API fails; verify with a mocked failure
- [ ] 3.3 Dispatch the website deploy from the end of the dev-build workflow; verify a fresh dev build refreshes the published manifest

## 4. Update controls

- [ ] 4.1 Replace the "Beta updates" switch with a Release/Dev selector and an explicit "Check for updates" action in General, including current version, last check, state, notes, and progress; verify component tests for current, available, downloading, error, and channel switch
- [ ] 4.2 Explain the semver boundary when a release install selects Dev and offer no update; verify the copy and that no `1.0.0-dev.N` is offered to a 1.0.0 build
- [ ] 4.3 Keep the automatic check and mirror the state in About if that surface exists; verify a manual check and an automatic check report through the same state

## 5. Documentation and strings

- [ ] 5.1 Update `docs/UPDATER.md` with the dev channel, its manifest generation, and the semver rule; verify the doc matches the implementation
- [ ] 5.2 Add the new UI strings in en-US and translate them through the normal flow; verify `task i18n:audit` passes

## 6. Validation

- [ ] 6.1 Live: a dev install on the Dev channel is offered and installs the next dev build, keeping settings and identifier; verify from the update UI and the ARP entry
- [ ] 6.2 Live: a release install on the Dev channel reports no update and explains why; switching back to Release works
- [ ] 6.3 Negative: a tampered dev manifest is refused with an error and the installed version is untouched
