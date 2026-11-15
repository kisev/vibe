# Tasks

## 1. Tasks

- [x] 1.1 Add `upstream:fetch` to `taskfile.yml`: fetch `upstream` branches with `--prune` and no tag negotiation; verify `git fetch upstream` exits 0 with the colliding `v1.0.0` on both sides and `git tag -l` is unchanged — 2026-11-11: `task upstream:fetch` exited 0 and the tag list was byte-identical before and after
- [x] 1.2 Add `upstream:tags`: fetch `refs/tags/*` into `refs/upstream-tags/*`; verify upstream tags appear under the namespace and `git tag -l` still lists only fork tags — 2026-11-11: 99 refs under `refs/upstream-tags/`, local tags still 6
- [x] 1.3 Add `setup:remotes` (idempotent): replace `remote.upstream.fetch` with `+refs/heads/*:refs/remotes/upstream/*` and `^refs/tags/*`, set `remote.upstream.tagOpt=--no-tags`, and print the resulting rule; verify running it twice is a no-op — 2026-11-11: run on the existing checkout and on a fresh clone, both leave the three lines in place; the task adds `upstream` itself when a clone has none, so one command takes a fresh checkout to a working state (2026-11-15)

## 2. Documentation

- [x] 2.1 Write the upstream docs: root cause (own tag history plus global `fetch.forcetags`) in `docs/explanation/upstream-isolation.md`, the exact config, the two fetch tasks, the namespaced tags and the rules in `docs/how-to/sync-upstream.md`, both indexed in `docs/README.md`; verify commands in the doc run as written — 2026-11-15: the Diátaxis rework (760cf2e4) split the original `docs/UPSTREAM.md` into those two pages; `task setup:remotes`, `task upstream:fetch`, `task upstream:tags` and `git diff upstream-tags/v3.3.0 main` run as written, and the how-to carries the one-time `git remote add upstream` a fresh clone needs
- [x] 2.2 Add one line to `AGENTS.md` under tooling pointing at `task upstream:fetch` and the doc

## 3. Validation

- [x] 3.1 From a fresh clone: run the setup config (it adds the `upstream` remote a plain clone lacks), then `git fetch upstream --prune`; verify no tag error and no tag changes — 2026-11-11: a clone of the repo with `upstream` added fetched 39 refs, exit 0, tags unchanged
- [x] 3.2 Verify with the deliberately broken global config still in force (`fetch.forcetags=true`, `fetch.prunetags=true`) that the repository's refspec wins — 2026-11-11: the fetch above ran under exactly that global config
- [x] 3.3 Live acceptance: a real upstream sync starts from `task upstream:fetch` with no manual git config archaeology — 2026-11-15: ran it on this host; `git fetch upstream --prune` succeeded against `upstream/main` at 06344076 under the machine's `fetch.forcetags=true`/`fetch.prunetags=true`, no remote setup was needed, `refs/tags` still held only the fork's tags, and the separate `task upstream:tags` namespace held all 99 upstream tags
