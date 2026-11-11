# Upstream

The fork tracks `thewh1teagle/vibe` for feature work, but keeps its own tag history: releases are
`vX.Y.Z` on `main` starting at 1.0.0, and dev builds are `dev.<n>` on `dev`. Upstream has its own
`vX.Y.Z` tags whose commits differ from the fork's, so a plain `git fetch upstream` tries to update
`refs/tags` and dies:

```
! [rejected] v1.0.0 -> v1.0.0 (would clobber existing tag)
```

The usual `git fetch --no-tags upstream` does not help either. The machine-wide `~/.gitconfig` here
sets `fetch.forcetags=true` and `fetch.prunetags=true`, and git still negotiates tags after the
refspec fetch. The fix is scoped to the one remote that diverged.

## Setup

```console
task setup:remotes
```

That sets, on the `upstream` remote:

```
remote.upstream.fetch = +refs/heads/*:refs/remotes/upstream/*
remote.upstream.fetch = ^refs/tags/*
remote.upstream.tagOpt = --no-tags
```

Repository config wins over the global `fetch.forcetags`, so no machine-wide setting changes. Run it
once per checkout and it is idempotent.

## Fetching

```console
task upstream:fetch   # branches only, pruned
```

This is the routine sync: it updates `refs/remotes/upstream/*` and never writes `refs/tags`.

Upstream tags are sometimes useful for comparing a release with its upstream origin. They land in
their own namespace, never in `refs/tags`:

```console
task upstream:tags
git diff upstream-tags/v3.3.0 main
```

`refs/upstream-tags/*` is local-only: nothing pushes it, and the fork's tags are never merged into
it.

## Rules

- The fork's versioning is its own. Never push upstream tags to `origin`.
- Never fetch `refs/tags/*` from `upstream` into `refs/tags/*`. If a command needs that, it is
  asking to overwrite the fork's history — use the namespaced task instead.
- The sync procedure itself lives in `openspec/specs/upstream-sync/spec.md`; this page only covers
  the git plumbing.
