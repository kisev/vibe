# Design

## Context

The fork is `kisev/vibe` (SSH remote `git@github.com:kisev/vibe.git`). Every source of updates and downloads in the tree still points at `thewh1teagle/vibe` or `thewh1teagle.github.io/vibe`; the full inventory was gathered during exploration and is repeated in tasks. Tauri updater artifacts are already enabled (`createUpdaterArtifacts: true`), but the bundled pubkey is the upstream one, so even a repointed endpoint would reject fork-signed updates — endpoint and key must move together.

## Goals / Non-Goals

**Goals:**

- One place to see and change every fork URL (keep the existing `config.ts` pattern).
- Fork releases verifiable by fork builds end to end: key generation, CI secret, signing, endpoint, pubkey.
- Existing installations survive switching to a fork build without data loss.

**Non-Goals:**

- Repointing already-installed upstream builds (impossible remotely; they keep checking upstream).
- Replacing the yt-dlp download source (third-party tool with its own releases).
- Changing the identifier, bundle id, deep-link schemes, or the phone pairing protocol.
- Migrating the website hosting itself; the fork's `website.yml` already deploys to the fork's Pages origin.

## Decisions

- **Split the installer identity, not the application identity.** The winget channel matches installed apps by Add/Remove-Programs fields; the fork build inherits upstream's exact tuple — DisplayName `vibe` (productName), ProductCode `vibe`, Publisher `com` (derived from the unchanged reverse-domain identifier) — so winget correlates it with the upstream community package `Thewh1teagle.vibe`, whose manifest declares that same ProductCode with `UpgradeBehavior: install` and downloads from upstream releases. The fork's version scheme (`3.2.2-dev.44`) sorts below `3.2.2`, so winget dutifully "upgrades" the fork install to upstream. The fix rewrites the ARP Publisher and ProductCode to fork values via an NSIS installer hook (`bundle.windows.nsis.installerHooks`): productName, identifier, and install location stay as they are, so settings, deep links, and the existing install path are untouched — the in-app updater never was the vector, and it stays pointed at the fork.

- **The fork's own winget package waits for signed stable releases.** A `kisev.Vibe` manifest in winget-pkgs pointing at fork releases is what turns `winget upgrade` into a fork channel, but winget-pkgs carries stable releases only; dev prereleases do not belong there, and the fork's stable release pipeline is still blocked on signing (task 4.1). Until then the identity split alone delivers the required half: winget cannot offer or install upstream over a fork build.

- **Generate a fresh minisign keypair for the fork** (Tauri updater signing) rather than reusing any upstream material. Private key and password go into fork Actions secrets (`TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`); the public key is committed into `tauri.conf.json`. Alternative — keeping the upstream pubkey — would only work if the fork never signs, which contradicts `createUpdaterArtifacts`.

- **Keep the upstream identifier** `github.com.thewh1teagle.vibe`. Changing it would strand settings, transcripts, deep links (`vibe://`), and OS registration for every existing install; the identifier is not itself an update source. The reverse-domain constant in `keepawake.rs` follows the identifier.

- **Repoint functional URLs, keep credit URLs.** About/repo/issues/bug-report/changelog/models-doc/pairing point at the fork; donation (`supportVibeURL`) and Discord stay upstream — the fork benefits from upstream's community and owes upstream the credit. yt-dlp stays as is.

- **Fork origins derived from the repo:** website `https://kisev.github.io/vibe/`, repository `https://github.com/kisev/vibe`. `config.ts` stays the single source; `changelogURL(version)` keeps its shape.

- **`server-v*` releases live in the fork.** `chorefile` switches to `gh://kisev/vibe`; the current pin (`v0.8.0`) must be published in the fork before a standard app build can fetch it. The dev-build workflow is unaffected (it builds the sidecar from the tree by design).

## Risks / Trade-offs

- [Rotating the pubkey orphans any hypothetical hybrid build that trusts the old key] → Acceptable: no fork build has shipped yet; upstream builds keep their own channel by design.
- [Fork Pages origin drifts from hardcoded URLs] → Keep every URL in `config.ts` and verify all of them in one test pass.
- \[Forgetting to publish `server-v0.8.0` in the fork\] → Tracked task with an explicit verification (fetch the exact asset URL); dev builds and CI are unaffected either way.

## Migration Plan

1. Generate the updater keypair; add the private half to fork secrets.
1. Land the URL/pubkey changes in one commit; verify with the mock test suite plus a packaging dry run.
1. Publish `server-v0.8.0` in the fork; verify the sidecar fetch.
1. The next fork release produces signed `latest.json`; install a prior fork build and update over it end to end.

## Open Questions
