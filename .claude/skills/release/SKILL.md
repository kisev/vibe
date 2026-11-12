---
name: release
description: Ship a Vibe release end to end — decide whether server/ needs its own release first, bump the version, PR and squash-merge, run release.yml unsigned, promote the prerelease, deploy the website. Use when the user asks to cut, ship or publish a release, or invokes /release.
---

# Release

Six steps. Each has a gate — do not start the next one until the gate is green.
Report the version, the run URLs and the gate results as you go; ask before
skipping a step.

Windows binaries ship unsigned, permanently: the fork has no code-signing
infrastructure (no Authenticode certificate, no SignPath approval) and never
passes `-f sign-windows=true`. Minisign protects the updater path; SmartScreen
warns once on first install and the release notes say so.

## 0. Preflight

```
git switch main && git pull --ff-only
git status --short          # must be empty
```

## 1. Does `server/` need a release first?

The desktop app downloads a pinned engine, so engine fixes only reach users
through a new server release.

```
pin=$(cat .server-version)                          # e.g. v0.6.9
git log --oneline "server-${pin#v}"..main -- server/ 2>/dev/null ||
  git log --oneline "server-$pin"..main -- server/
```

- **No commits** → skip to step 2, leave `.server-version` alone.
- **Only docs/comments** → say so and ask whether to skip.
- **Code changed** → release the server first:
  - If anything under `server/libs/` changed (`ggml-version`, `patches/`,
    `include/`) or `scripts/ggml_libs.sh` changed, bump `server/libs/revision` in
    the same commit and run `server-libs.yml` **first** (~9 min); `task libs:upload`
    refuses a tag that exists for another tree.
  - `git tag server-vX.Y.Z && git push origin server-vX.Y.Z` on main.
  - **Gate:** `server-release.yml` green (~8 min) and all 5 assets uploaded — the
    Intel Mac asset lands last. It publishes as a *prerelease* on purpose; leave
    it that way so Latest stays with the app.

## 2. Bump and write the notes

Three files, one commit:

- `desktop/src-tauri/tauri.conf.json` → `"version"`.
- `.server-version` → the new server tag minus `server-` (only if step 1 released one).
- `i18n/changelog/<version>.md`. **release.yml fails without it.**

The notes are not written at release time — they accumulate in
`i18n/changelog/unreleased.md` (same frontmatter and `## New` / `## Improved` /
`## Fixed` sections, `- 🎯 **Term** — what changed` bullets) as user-visible
changes land, and the website renders that entry above every release. At release
time:

- Copy `unreleased.md` to `i18n/changelog/<version>.md`, set `version:` and
  `date:` in its frontmatter (the title was written as the entry grew;
  release.yml fails without the versioned file).
- Replace `unreleased.md` with a fresh skeleton so the next cycle starts empty.

If an entry is missing bullets, read what actually shipped —
`git log --oneline <previous tag>..main` and the PR bodies — and match the voice
of the last two entries: plain, concrete, user-visible. A refactor nobody can see
does not get a bullet.

Then translate it: invoke the `translate` skill, which fans one cheap subagent per
locale over the new file and stamps the hashes. Untranslated is not fatal — the
page falls back to English per entry — but the notes are the one page every user
opens on update day, so translate them unless the user says otherwise.

**Gate:** `uv run scripts/check_i18n.py` passes and `task check-types` is clean.

## 3. PR and squash merge

Commit title style: `Bump version to X, and <feature> (#PR)`.

```
git switch -c release/vX.Y.Z && git commit && git push -u origin HEAD
gh pr create --fill
```

**Gate:** `fmt` and `clippy` pass, then `gh pr merge <n> --squash --delete-branch`.
Repo-level auto-merge is **off** (`allow_auto_merge: false`), so `--auto` silently
does nothing — poll the checks and merge when they settle. Then `git switch main
&& git pull`.

## 4. Release

```
gh workflow run release.yml --ref main
```

~20 min. tauri-action creates the tag `vX.Y.Z` and a **prerelease**. Leave both
signing inputs at their `false` defaults: there is no signing infrastructure to
reach, and a signing-enabled run would only fail or ship an unexpected config.
The Windows job produces an unsigned `vibe.exe`; that is the accepted permanent
state.

**Gate:** all 5 platform jobs green. A single failed platform can be re-run with
`gh run rerun <id> --failed`.

## 5. Promote

```
VERSION=<version> RELEASE_NOTES=/tmp/notes.md task release:notes
gh release edit vX.Y.Z --prerelease=false --latest --notes-file /tmp/notes.md
```

The body is the versioned English entry, so GitHub and the website never
disagree, under `Read this changelog in your language:
https://kisev.github.io/vibe/changelog/<version>` — the same entry in the
reader's own language. Dev releases pick the body up from `unreleased.md`
automatically and link to `/changelog/dev` instead.

## 6. Deploy the website

```
gh workflow run website.yml --ref main
```

The website also deploys on `release: published`, but trigger it explicitly so the
changelog page carries the new entry without waiting.

**Gate:** `website.yml` green, and `https://kisev.github.io/vibe/changelog/<version>`
serves the new entry.
