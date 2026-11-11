# Proposal

## Why

`git fetch upstream` fails in this fork: upstream and the fork both want to own tags like `v1.0.0`, and the fork's history is deliberately its own (an own version line starting at 1.0.0, dev builds tagged `dev.<n>`). The local `~/.gitconfig` also sets `fetch.forcetags=true` and `fetch.prunetags=true`, so even a `--no-tags` fetch still tries to update `refs/tags/*` and dies on `v1.0.0 -> v1.0.0 (would clobber existing tag)`. Today the working configuration exists only as undocumented local state in one checkout, so a fresh clone, another machine, or a future session hits the same wall and the upstream sync grinds to a halt.

## What Changes

- The upstream remote gets a fetch refspec that never writes tags: `+refs/heads/*:refs/remotes/upstream/*` plus a negative `^refs/tags/*`, and `tagOpt=--no-tags`. Repository config beats the global `fetch.forcetags`, so this works without changing the user's machine-wide settings.
- Two tasks make the intent executable: `task upstream:fetch` updates upstream branches only, and `task upstream:tags` fetches upstream tags into the separate namespace `refs/upstream-tags/*` for history comparison, so they never collide with the fork's tags.
- A setup task applies the remote configuration in any checkout, and `docs/UPSTREAM.md` records the root cause, the rules, and how to compare fork and upstream tags.
- The fork keeps its own versioning: upstream tags are read-only inputs under their own namespace, never merged into `refs/tags`, never pushed.

## Capabilities

### New Capabilities

### Modified Capabilities

- `upstream-sync`: adds the rule that fetching upstream never writes the fork's tags, and that the isolation is reproducible from the repository rather than from one machine's local config.

## Impact

- `taskfile.yml` (three tasks), `docs/UPSTREAM.md` (new), `AGENTS.md` (one line pointing at the task), and the local `remote.upstream` configuration as the applied result. No application code.
