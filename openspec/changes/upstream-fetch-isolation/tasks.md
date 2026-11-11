# Tasks

## 1. Tasks

- [x] 1.1 Add `upstream:fetch` to `taskfile.yml`: fetch `upstream` branches with `--prune` and no tag negotiation; verify `git fetch upstream` exits 0 with the colliding `v1.0.0` on both sides and `git tag -l` is unchanged — 2026-11-11: `task upstream:fetch` exited 0 and the tag list was byte-identical before and after
- [x] 1.2 Add `upstream:tags`: fetch `refs/tags/*` into `refs/upstream-tags/*`; verify upstream tags appear under the namespace and `git tag -l` still lists only fork tags — 2026-11-11: 99 refs under `refs/upstream-tags/`, local tags still 6
- [x] 1.3 Add `setup:remotes` (idempotent): set `remote.upstream.fetch` to `+refs/heads/*:refs/remotes/upstream/*` and `^refs/tags/*`, and `remote.upstream.tagOpt=--no-tags`, printing what changed; verify running it twice is a no-op — 2026-11-11: run on the existing checkout and on a fresh clone, both leave the three lines in place

## 2. Documentation

- [x] 2.1 Write `docs/UPSTREAM.md`: root cause (own tag history plus global `fetch.forcetags`), the exact config, the two fetch tasks, the namespaced tags, and the rule that versioning stays the fork's; verify commands in the doc run as written
- [x] 2.2 Add one line to `AGENTS.md` under tooling pointing at `task upstream:fetch` and the doc

## 3. Validation

- [x] 3.1 From a fresh clone: run the setup config, then `git fetch upstream --prune`; verify no tag error and no tag changes — 2026-11-11: a clone of the repo with `upstream` re-added fetched 39 refs, exit 0, tags unchanged
- [x] 3.2 Verify with the deliberately broken global config still in force (`fetch.forcetags=true`, `fetch.prunetags=true`) that the repository's refspec wins — 2026-11-11: the fetch above ran under exactly that global config
- [ ] 3.3 Live acceptance: a real upstream sync starts from `task upstream:fetch` with no manual git config archaeology; report what should change before archiving
