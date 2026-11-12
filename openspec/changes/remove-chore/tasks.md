# Tasks

- [x] 1. Port the root chorefile: `task setup [triple]` (`scripts/setup_sidecars.sh`), `server:build [triple]`, `linux-deps`, `dev`, `dev:web`, `app:build`, `app:upgrade`, `stamp-translations`, `check-types` — `task setup` was run on this host and installed `vibe-server-x86_64-unknown-linux-gnu` from the pinned `server-v0.9.0` release.
- [x] 2. Port `website/website.chore`: `website:dev`, `website:build` (`scripts/website_build.sh`) — `task website:build` built the site into `website/dist` end to end.
- [x] 3. Port `handoff/handoff.chore`: `phone:wasm` (`scripts/phone_wasm.sh`), `phone:pwa`, `phone:dev`, `phone:tunnel`, `phone:probe`, `phone:caps`.
- [x] 4. Port `server/chorefile`: `server:package-release` (`scripts/package_server_release.sh`), `server:fetch-headers`; `server-release.yml` calls `mise exec -- task server:package-release`.
- [x] 5. Port `server/libs/libs.chore` into `scripts/ggml_libs.sh` and the `libs:*` targets; `ci:ggml-libs` now maps its triple onto `libs:fetch` instead of keeping a second fetch implementation. `libs:id`, `libs:tag` and `libs:platform` were run against the current tree.
- [x] 6. `scripts/ci/linux-build-deps.sh` speaks apt, zypper and dnf; both `task linux-deps` and `ci:linux-build-deps` call it.
- [x] 7. `release.yml`, `lint_rust.yml`, `server-release.yml` and `website.yml` call `mise exec -- task …`, have no `getchore/setup-chore` step, and pass `GH_TOKEN` where the sidecar and ggml downloads need it; the site workflow's path filter names `taskfile.yml`.
- [x] 8. Deleted all five files.
- [x] 9. The prose sweep covered 13 files (docs/reference, how-to, tutorials, handoff and server READMEs, both skills); code comments in `handoff/pwa` and `ggml-rs-sys` and the two active change records that named chore commands were corrected too.
- [ ] 10. Run `task verify` (minus the desktop clippy this host cannot run) and `openspec validate remove-chore --strict`; confirm `grep -ri chore` finds only archived history.
