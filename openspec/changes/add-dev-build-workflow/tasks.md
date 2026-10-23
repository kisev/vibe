# Tasks

## 1. Workflow skeleton

- [x] 1.1 Create `.github/workflows/dev-build.yml` with `push: branches: [main]` and `workflow_dispatch`, `permissions: contents: write`, a concurrency group that queues instead of cancelling, and a `fail-fast: false` matrix of the five triples (macOS arm64/x86_64, Linux x86_64/aarch64, Windows x86_64); verify the file parses as YAML and the matrix lists exactly those five triples
- [x] 1.2 Add the shared setup steps from `release.yml`: checkout, pnpm, Node 22 with pnpm cache, Rust stable with both macOS targets added on `macos-latest` runners, and `swatinem/rust-cache`; verify a workflow dispatch reaches the build step on all five runners

## 2. Sidecars without chore

- [x] 2.1 Add the Linux dependency step with the package list from `chorefile:linux-deps`; verify the Linux jobs pass that step
- [x] 2.2 Add the ggml library step: compute the release tag from `server/libs/ggml-version` and `server/libs/revision`, download `ggml-libs-<platform>.tar.gz`, and replace `server/libs/lib` with its `lib/` directory; verify all five URLs resolve with `curl -I` and the Linux job compiles against the extracted libraries
- [x] 2.3 Build the server with `cargo build -p vibe-server --release --target <triple>` in `server/` and copy the binary to `desktop/src-tauri/binaries/vibe-server-<triple>[.exe]`; verify the copied binary runs `--version` on each native runner and reports the commit from `VIBE_SERVER_COMMIT`
- [x] 2.4 Add the ffmpeg step for macOS and Windows using the URLs recorded in `server/chorefile:package-release`, extracting and renaming to `ffmpeg-<triple>[.exe]`; verify the Tauri build on Windows and macOS finds the sidecar and that the Linux jobs skip this step

## 3. Build and publish

- [x] 3.1 Run `pnpm install --frozen-lockfile` and `pnpm exec tauri build --target <triple> --config '{"bundle":{"createUpdaterArtifacts":false}}'`; verify each platform produces the bundles its config enables (`dmg`/`app`, `deb`/`rpm`, `nsis`) and that no updater artifacts are produced
- [x] 3.2 Wire publishing through `tauri-action` with `tagName: dev`, `releaseName` naming the commit, `prerelease: true`, and `includeUpdaterJson: false`; verify the first run creates the `dev` prerelease with assets from every platform and later runs replace those assets
- [x] 3.3 Confirm the workflow contains no `chore` invocation and no secret reference; verify `grep -n chore .github/workflows/dev-build.yml` finds nothing and the run succeeds on a fork with no secrets configured

## 4. Verification

- [x] 4.1 Push to `main` and wait for a full run; verify all five jobs finish and the `dev` release holds a `.dmg`, a `.deb` and `.rpm`, and an `.exe` installer
- [ ] 4.2 Install the Windows build on the test machine, confirm the app starts, and confirm the bundled server reports the pushed commit via `vibe-server --version`; verify GigaAM models are listed and one file transcribes end to end
- [x] 4.3 Verify the `dev` release is marked as a prerelease and is not the repository's latest release, and that its body names the built commit
- [ ] 4.4 Enable Actions for the fork and disable the inherited `Deploy Website` workflow; verify a push to `main` starts only the dev build

## Workflow follow-up

- Archive the change after the first successful end-to-end run.
