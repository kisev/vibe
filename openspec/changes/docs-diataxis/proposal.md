# Proposal

## Why

The repository docs grew as one page per topic, and several pages mix purposes: `docs/BUILDING.md` is a first-run tutorial, a test/lint how-to, a dependency-update how-to, a release procedure, and a grab bag of one-off commands at once. `docs/UPDATER.md` mixes the channel reference, the release how-to, and the semver rationale. `docs/UPSTREAM.md` mixes the git failure explanation with the fetch how-to. A reader cannot tell whether a page teaches, instructs, states facts, or explains a decision, so each page serves none of those jobs well.

The docs also carry text that no longer matches the tree: the upstream release flow, whisper.cpp troubleshooting, the disabled eSigner whitelist, and a project-wide version bump procedure that the `task` facade replaced. Documentation that lies is worse than missing documentation.

Diátaxis gives the repository one rule: every page has exactly one of four purposes — tutorial, how-to, reference, explanation — and lives in the folder named for it.

## What Changes

- `docs/` is restructured into `tutorials/`, `how-to/`, `reference/`, and `explanation/`, with `docs/README.md` as the map.
- Mixed pages are split by purpose rather than copied:
  - `BUILDING.md` becomes the build-and-run tutorial, the check-your-change how-to, the server-build how-to, the dependency-update how-to, the release how-to, and repository-maintenance how-to.
  - `UPDATER.md` becomes the update-channel reference, the channel-design explanation, and the release/dev how-tos.
  - `UPSTREAM.md` becomes the upstream-sync how-to and the upstream-isolation explanation.
  - `MEETING-BROWSER.md` becomes the meeting-browser how-to, reference, and explanation.
- Every moved page is verified against `taskfile.yml`, `chorefile`, `scripts/`, and `.github/workflows/`; stale claims are rewritten or deleted rather than carried over. Deleted: the eSigner cloud-signing guide (the tree signs through the remote YubiKey server in `scripts/sign.py`), the whisper.cpp comparison in the crash guide (the engine is transcribe.cpp through `server/`), and the obsolete manual package-upgrade recipe (replaced by `task deps:*`).
- All inbound references are repointed: `README.md`, `AGENTS.md`, `CONTRIBUTE.md`, `docs/` cross-links, `scripts/channel.py`, the updater code comments, the release workflow comment, and the bug report template.
- The site `/docs` pages and their translations are handled in a follow-up pass; this change records that work as unchecked tasks.

## Capabilities

### New Capabilities

- `docs`: how repository documentation is organized, what each page is allowed to do, and how links and facts stay correct.

### Modified Capabilities

None.

## Assumptions

- The upstream-facing surfaces (telemetry, Ko-fi, upstream release docs) were already removed by the `remove-upstream-ties` change; this change only removes the remaining stale prose that referenced them or the upstream flow.
- Translations come after the English source settles, per the existing content i18n flow. This change is English-only.
- `website/src/` belongs to another in-flight change and is not edited here; the site docs pass stays unchecked.
