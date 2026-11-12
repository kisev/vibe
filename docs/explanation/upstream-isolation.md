# Upstream isolation

The fork tracks `thewh1teagle/vibe` for feature work but keeps its own tag history. A plain `git fetch upstream` therefore tries to update `refs/tags` with upstream's tags and dies:

```text
! [rejected] v1.0.0 -> v1.0.0 (would clobber existing tag)
```

`git fetch --no-tags upstream` does not help either. The machine-wide `~/.gitconfig` sets `fetch.forcetags=true` and `fetch.prunetags=true`, and git still negotiates tags after the refspec fetch. The failure is not one bad flag; it is two tag histories with the same names meeting in one namespace.

## The decision

Scope the fix to the one remote that diverged, instead of changing a machine-wide setting:

```text
remote.upstream.fetch = +refs/heads/*:refs/remotes/upstream/*
remote.upstream.fetch = ^refs/tags/*
remote.upstream.tagOpt = --no-tags
```

Repository configuration wins over the global `fetch.forcetags`. Branches fetch normally; tags are excluded from every routine fetch.

When an upstream tag is genuinely useful — comparing a fork release with its upstream origin — it is fetched into a separate namespace:

```text
refs/upstream-tags/*
```

That namespace is local-only: nothing pushes it, and the fork's tags are never merged into it. A `git diff upstream-tags/v3.3.0 main` works without any collision.

## Why not just rename the fork's tags

The fork's version line starts at 1.0.0 and is its own. Releases are `vX.Y.Z` on `main`, dev builds are `dev.<n>` on `dev`, and users' updaters depend on those names. Renaming or namespacing the fork's tags would break the release line to make an upstream fetch convenient. The remote-scoped exclusion costs one setup task and keeps both histories intact.

## Rules that follow

- The fork's versioning is its own. Never push upstream tags to `origin`.
- Never fetch `refs/tags/*` from `upstream` into `refs/tags/*`. A command that needs that is asking to overwrite the fork's history; use the namespaced task.
- The setup task is idempotent and belongs in every fresh checkout.

The procedure is in [Sync upstream](../how-to/sync-upstream.md). The normative sync spec is `openspec/specs/upstream-sync/spec.md`.
