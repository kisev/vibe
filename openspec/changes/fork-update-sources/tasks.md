# Tasks

## 1. Updater trust

- [x] 1.1 Generate a Tauri updater minisign keypair (`tauri signer generate`), store the private key and password as fork Actions secrets, and verify `gh secret list` shows both
- [x] 1.2 Point `desktop/src-tauri/tauri.conf.json` `plugins.updater` at the fork endpoint (`https://github.com/kisev/vibe/releases/latest/download/latest.json`) and the new public key; verify with `pnpm tauri info`/schema validation that the config parses

## 2. Functional links

- [x] 2.1 Repoint `desktop/src/lib/config.ts` (`aboutURL`, `repoURL`, `updateVersionURL`, `modelsDocURL`, `changelogURL`) at `kisev.github.io/vibe` / `github.com/kisev/vibe` and verify every exported constant is used from there (grep for stray hardcoded `thewh1teagle` URLs in `desktop/src`)
- [x] 2.2 Repoint the issue URL in `desktop/src/lib/app.ts` and the bug-report URL in `desktop/src-tauri/src/diagnostics.rs`; verify by running the diagnostics unit path that the composed bug-report URL names the fork
- [x] 2.3 Repoint the pairing page in `desktop/src-tauri/src/handoff/mod.rs`, `desktop/src/mock-tauri/handlers/handoff.ts`, and `desktop/src/lib/qr.test.ts`; update the mock identifier expectation in `desktop/src/mock-tauri/handlers/plugins.ts` if it asserts URLs; verify `vitest` passes for `qr.test.ts` and the handoff mock
- [x] 2.4 Update `desktop/src-tauri/src/keepawake.rs` reverse-domain constant to match the retained identifier and verify the desktop crate's `cargo check --tests` on Windows is clean (per repo constraint: desktop Rust builds on Windows)
- [x] 2.5 Run the desktop test suites (`tsc`, `vitest`) and verify zero failures after all URL changes

## 3. Dev sidecar source

- [x] 3.1 Change the `chorefile` server download from `gh://thewh1teagle/vibe/...` to `gh://kisev/vibe/...` and verify `chore` still resolves the pinned `.server-version` URL (dry-run the fetch step)
- [x] 3.2 Publish the pinned `server-v0.8.0` release in the fork (tag `server-v0.8.0`; the server-release workflow builds it) and verify the exact sidecar asset URL returns 200

## 4. Installer identity (winget channel)

- [x] 4.1 Add an NSIS installer hook (`desktop/src-tauri/tauri.conf.json` `bundle.windows.nsis.installerHooks`) that rewrites the Add/Remove-Programs entry a fork build writes: fork publisher and fork product code instead of upstream's `com`/`vibe` tuple that winget matches to `Thewh1teagle.vibe`; verify the built installer's ARP entry on Windows (dev.45's Windows cell built the installer with the hook; the ARP value itself is the empirical check in 4.2)
- [ ] 4.2 Empirical check on Windows: with the fork build installed, `winget upgrade` no longer lists or touches vibe (upstream package unmatched); a fork build installed over an upstream install keeps settings and data under the unchanged identifier
- [ ] 4.3 Blocked on signed stable releases: publish the fork's own winget package (`kisev.Vibe`, manifests pointing at fork stable releases) and verify `winget upgrade` on a fork install pulls the fork release

## 5. End-to-end update path

- [ ] 5.1 Trigger a fork release and verify `latest.json` appears on the fork's releases with signatures from the fork key, and that an installed fork build older than it is offered and completes the update while keeping settings and identifier
