# Sync upstream

The fork tracks `thewh1teagle/vibe` for feature work but keeps its own tag history, so a plain `git fetch upstream` fails when an upstream `vX.Y.Z` tag collides with a fork tag of the same name. The setup below scopes the fix to the `upstream` remote. [Upstream isolation](../explanation/upstream-isolation.md) explains why those tags collide in the first place.

## Configure the remote once per checkout

```console
task setup:remotes
```

That sets, on `upstream`:

```text
remote.upstream.fetch = +refs/heads/*:refs/remotes/upstream/*
remote.upstream.fetch = ^refs/tags/*
remote.upstream.tagOpt = --no-tags
```

Repository configuration wins over a machine-wide `fetch.forcetags`, so no global setting changes. The task is idempotent; run it again after a fresh clone.

## Fetch branches

```console
task upstream:fetch
```

This is the routine sync. It updates `refs/remotes/upstream/*` and never writes `refs/tags`.

## Fetch tags for comparison

Upstream tags are sometimes useful for comparing a release with its upstream origin. They land in their own namespace:

```console
task upstream:tags
git diff upstream-tags/v3.3.0 main
```

`refs/upstream-tags/*` is local-only: nothing pushes it, and the fork's tags are never merged into it.

## Rules

- Never push upstream tags to `origin`.
- Never fetch `refs/tags/*` from `upstream` into `refs/tags/*`; a command that needs that is asking to overwrite the fork's history. Use the namespaced task instead.
- The fork's versioning is its own: releases are `vX.Y.Z` on `main` starting at 1.0.0, and dev builds are `dev.<n>` on `dev`.
- The sync procedure itself lives in `openspec/specs/upstream-sync/spec.md`; this page covers the git plumbing.
