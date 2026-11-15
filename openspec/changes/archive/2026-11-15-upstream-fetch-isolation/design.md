# Design

## Context

The fork keeps its own version line: `main` carries `vX.Y.Z` releases starting at 1.0.0, and `dev` carries `dev.<n>` tags. Upstream carries its own `vX.Y.Z` tags (historically up to `v3.3.0`) whose targets differ from the fork's. `git fetch upstream` with a default refspec writes `refs/tags/*`, and the user's global `~/.gitconfig` sets `fetch.forcetags=true` and `fetch.prunetags=true`, which makes even `git fetch --no-tags upstream` attempt tag updates after the refspec fetch. The result is a hard failure — `v1.0.0 -> v1.0.0 (would clobber existing tag)` — and the sync stops.

The working configuration was found empirically and applied to one local checkout:

```
remote.upstream.fetch = +refs/heads/*:refs/remotes/upstream/*
remote.upstream.fetch = ^refs/tags/*
remote.upstream.tagOpt = --no-tags
```

## Goals / Non-Goals

**Goals:**

- `git fetch upstream` (and the tasks that wrap it) succeeds in any checkout, on any machine, without touching global git settings.
- The fork's tag history stays untouched and pushable; upstream tags remain available for comparison when explicitly wanted.
- The rule survives a fresh clone: it is a task plus documentation, not tribal knowledge.

**Non-Goals:**

- Changing the fork's own versioning or tag naming.
- Renaming or deleting upstream tags on the remote.
- Mirroring upstream tags into `refs/tags` ever.
- A general-purpose git remote manager.

## Decisions

- **A negative refspec on the upstream fetch, not a global git setting.** `^refs/tags/*` in `remote.upstream.fetch` excludes tags from all refspec-based fetching of that remote, and repository config takes precedence over the global `fetch.forcetags`. Changing the user's `~/.gitconfig` would repair this checkout by breaking the intent for every other repository on the machine; the negative refspec is scoped to the one remote that has diverged. The alternative of `--no-tags` alone was tried and is insufficient: with `fetch.forcetags=true`, git still attempts to update tags fetched by the refspec machinery.

- **A separate namespace for upstream tags.** `git fetch upstream 'refs/tags/*:refs/upstream-tags/*'` makes upstream tags addressable (`git diff upstream-tags/v3.3.0`) without any chance of colliding with `refs/tags`. They are local-only: no refspec pushes them, and they are never merged into the fork's tags.

- **Two verbs, deliberately separate.** `task upstream:fetch` is the routine sync (branches only, prunes upstream-tracking branches). `task upstream:tags` is the occasional history read (namespaced tags). Keeping them apart means the common path cannot accidentally negotiate tags again.

- **`task setup:remotes` is the reproducible entry point.** It replaces the fetch refspec with `+refs/heads/*:refs/remotes/upstream/*` and `^refs/tags/*` and sets `tagOpt=--no-tags` with `git config` on an existing `upstream` remote, and is idempotent. It adds the `upstream` remote when a fresh clone has none (`origin` is all a clone carries), so one command takes a checkout to a working state. Existing checkouts that already have the setting are unchanged apart from that guard.

- **The docs carry the why, split by purpose.** The failure mode is counter-intuitive and the fix is invisible in `git fetch` output, so `docs/explanation/upstream-isolation.md` records the root cause and the trade-off, `docs/how-to/sync-upstream.md` the exact config, the two tasks and the rule that the fork's versioning is its own, and `docs/README.md` indexes both.

## Risks / Trade-offs

- [Someone fetches upstream manually with an explicit tag refspec] → The doc states the namespaced form; a direct `git fetch upstream 'refs/tags/*:refs/tags/*'` can still fail, which is the correct outcome — it is asking to overwrite the fork's history.
- [Setup task silently overwrites an intentional upstream config] → It clears the remote's whole fetch refspec and replaces it with the two lines it owns, then prints the resulting rule; any custom refspec on `upstream` (for example PR refs) is dropped deliberately, because upstream branches under this isolation are the only thing that remote fetches. Other remotes are untouched.
- [Upstream tags go stale] → `task upstream:tags` is run on demand before a comparison; the branches, which drive syncs, stay current through `upstream:fetch`.
- \[Global `fetch.prunetags=true` deletes tags in forks that did import them\] → The negative refspec also prevents pruning at this remote, so the fork's tags are safe.

## Migration Plan

1. Land the tasks and the docs.
1. Run `task setup:remotes` on the existing checkout; confirm `git fetch upstream` succeeds and `git tag -l 'v*'` still shows only fork tags.
1. Any other checkout runs the same procedure once: add the `upstream` remote if the checkout is a fresh clone, then `task setup:remotes`.

## Open Questions

- Whether `task setup:remotes` should also verify the `origin` remote and the HTTPS credential helper, or stay scoped to upstream.
