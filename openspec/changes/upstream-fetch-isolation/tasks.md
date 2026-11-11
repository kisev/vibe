# Tasks

## 1. Tasks

- [ ] 1.1 Add `upstream:fetch` to `taskfile.yml`: fetch `upstream` branches with `--prune` and no tag negotiation; verify `git fetch upstream` exits 0 with the colliding `v1.0.0` on both sides and `git tag -l` is unchanged
- [ ] 1.2 Add `upstream:tags`: fetch `refs/tags/*` into `refs/upstream-tags/*`; verify `git tag -l 'upstream-tags/*'`-style refs appear and `git tag -l` still lists only fork tags
- [ ] 1.3 Add `setup:remotes` (idempotent): set `remote.upstream.fetch` to `+refs/heads/*:refs/remotes/upstream/*` and `^refs/tags/*`, and `remote.upstream.tagOpt=--no-tags`, printing what changed; verify running it twice is a no-op

## 2. Documentation

- [ ] 2.1 Write `docs/UPSTREAM.md`: root cause (own tag history plus global `fetch.forcetags`), the exact config, the two fetch tasks, the namespaced tags, and the rule that versioning stays the fork's; verify commands in the doc run as written
- [ ] 2.2 Add one line to `AGENTS.md` under tooling pointing at `task upstream:fetch` and the doc

## 3. Validation

- [ ] 3.1 From a fresh clone: run `task setup:remotes`, then `task upstream:fetch`; verify no tag error and no tag changes (`git tag -l` before and after)
- [ ] 3.2 Verify with a deliberately broken global config (`git -c fetch.forcetags=true -c fetch.prunetags=true fetch upstream`) that the repository's refspec still wins
- [ ] 3.3 Live acceptance: a real upstream sync starts from `task upstream:fetch` with no manual git config archaeology; report what should change before archiving
