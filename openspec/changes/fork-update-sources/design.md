# Design

## Context

The fork is `kisev/vibe` (SSH remote `git@github.com:kisev/vibe.git`). Every source of updates and downloads in the tree still points at `thewh1teagle/vibe` or `thewh1teagle.github.io/vibe`; the full inventory was gathered during exploration and is repeated in tasks. Tauri updater artifacts are already enabled (`createUpdaterArtifacts: true`), but the bundled pubkey is the upstream one, so even a repointed endpoint would reject fork-signed updates — endpoint and key must move together.

## Goals / Non-Goals

**Goals:**

- One place to see and change every fork URL (keep the existing `config.ts` pattern).
- Fork releases verifiable by fork builds end to end: key generation, CI secret, minisign signing, endpoint, pubkey.
- Existing installations survive switching to a fork build without data loss.

**Non-Goals:**

- Authenticode code signing, Apple notarization, the remote YubiKey sign server as a release requirement, and the fork's own winget package — the user maintains no signing infrastructure (permanent decision, 2026-11-09).
- Repointing already-installed upstream builds (impossible remotely; they keep checking upstream).
- Replacing the yt-dlp download source (third-party tool with its own releases).
- Changing the identifier, bundle id, deep-link schemes, or the phone pairing protocol.
- Migrating the website hosting itself; the fork's `website.yml` already deploys to the fork's Pages origin.

## Decisions

- **Split the installer identity, not the application identity.** The winget channel matches installed apps by Add/Remove-Programs fields; the fork build inherits upstream's exact tuple — DisplayName `vibe` (productName), ProductCode `vibe`, Publisher `com` (derived from the unchanged reverse-domain identifier) — so winget correlates it with the upstream community package `Thewh1teagle.vibe`, whose manifest declares that same ProductCode with `UpgradeBehavior: install` and downloads from upstream releases. The fork's version scheme (`3.2.2-dev.44`) sorts below `3.2.2`, so winget dutifully "upgrades" the fork install to upstream. The fix rewrites the ARP Publisher and ProductCode to fork values via an NSIS installer hook (`bundle.windows.nsis.installerHooks`): productName, identifier, and install location stay as they are, so settings, deep links, and the existing install path are untouched — the in-app updater never was the vector, and it stays pointed at the fork.

- **No winget package; stable releases ship unsigned.** A `kisev.Vibe` manifest in winget-pkgs would turn `winget upgrade` into a fork channel, but winget-pkgs carries stable releases only and the user will maintain no code-signing infrastructure (decision 2026-11-09). The package is out of scope permanently; the identity split alone is the end state — winget cannot offer or install upstream over a fork build. Stable fork releases still publish updater artifacts: minisign authenticates `latest.json`, while the platform binaries themselves are unsigned and Windows shows SmartScreen once.

- **Generate a fresh minisign keypair for the fork** (Tauri updater signing) rather than reusing any upstream material. Private key and password go into fork Actions secrets (`TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`); the public key is committed into `tauri.conf.json`. Alternative — keeping the upstream pubkey — would only work if the fork never signs updater artifacts, which contradicts `createUpdaterArtifacts`. This minisign key is the only signing the fork does; it needs no external infrastructure and is not affected by the no-code-signing decision.

- **Keep the upstream identifier** `github.com.thewh1teagle.vibe`. Changing it would strand settings, transcripts, deep links (`vibe://`), and OS registration for every existing install; the identifier is not itself an update source. The reverse-domain constant in `keepawake.rs` follows the identifier.

- **Repoint functional URLs, keep credit URLs.** About/repo/issues/bug-report/changelog/models-doc/pairing point at the fork; donation (`supportVibeURL`) and Discord stay upstream — the fork benefits from upstream's community and owes upstream the credit. yt-dlp stays as is.

- **Fork origins derived from the repo:** website `https://kisev.github.io/vibe/`, repository `https://github.com/kisev/vibe`. `config.ts` stays the single source; `changelogURL(version)` keeps its shape.

- **`server-v*` releases live in the fork.** `chorefile` switches to `gh://kisev/vibe`; the current pin (`v0.8.0`) must be published in the fork before a standard app build can fetch it. The dev-build workflow is unaffected (it builds the sidecar from the tree by design).

## Risks / Trade-offs

- [Rotating the pubkey orphans any hypothetical hybrid build that trusts the old key] → Acceptable: no fork build has shipped yet; upstream builds keep their own channel by design.
- [Unsigned Windows binaries trigger SmartScreen on first install] → Accepted permanently (2026-11-09). Minisign protects the update path, not the first download; the release notes and README state that signature warnings are expected.
- [Fork Pages origin drifts from hardcoded URLs] → Keep every URL in `config.ts` and verify all of them in one test pass.
- \[Forgetting to publish `server-v0.8.0` in the fork\] → Tracked task with an explicit verification (fetch the exact asset URL); dev builds and CI are unaffected either way.

## Migration Plan

1. Generate the updater keypair; add the private half to fork secrets.
1. Land the URL/pubkey changes in one commit; verify with the mock test suite plus a packaging dry run.
1. Publish `server-v0.8.0` in the fork; verify the sidecar fetch.
1. The fork's own version line starts at 1.0.0 and the upstream-based releases and dev tags were deleted (2026-11-10). A build from the old `3.3.0-dev.*` line sorts above 1.0.0, so the updater — which only offers `release.version > current_version` — never moves it into the new line: the first step is one manual install of 1.0.0, after which settings, data, and the identifier survive. From 1.0.0 on, every release produces minisign-signed `latest.json` with unsigned binaries, and the in-app update path is exercised between two releases of the new line.

## Open Questions
