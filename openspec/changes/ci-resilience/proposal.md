# Proposal

## Why

This week the Actions tab went red for three distinct reasons, two of which will recur: **lint.yml** compiled the server's Vulkan backend without ever installing the Vulkan toolchain — red on every push until the prerequisite step landed (e429a999) — and GitHub's macOS pool spent the day killing random jobs at exactly 15:01 with no logs, which broke the dev.41/dev.42 build matrix three times and left the website undeployed (`build` killed → `deploy` skipped). Every recovery today was a human (me) typing `gh run rerun --failed`. A repository this active needs that loop closed by the repository itself. The `macos-runner-probe.yml` diagnostic also outlived its purpose.

## What Changes

- Deploy Website's `build` and `deploy` jobs stop using `macos-latest`: they upload a static artifact and publish GitHub Pages, nothing in them is Apple-specific — the whole class of macOS-pool flakiness disappears from releases.
- A small janitor workflow re-runs failed jobs of Dev Build and Deploy Website automatically, capped at 3 attempts per run, using only `gh` and the built-in token — event-driven on red completions, with a daily backstop sweep.
- Every workflow that compiles the server carries the Vulkan build prerequisites — the landed lint fix becomes a standing requirement, not a one-off.
- The temporary macOS probe workflow is deleted.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `dev-build`: adds self-healing for infrastructure-killed runs and a standing prerequisite rule for every workflow that builds the server.

## Assumptions

- The janitor covers Dev Build and Deploy Website only; Lint is excluded on purpose — its failures are content failures, and auto-retrying them would paint broken code green on the second roll.
- A run killed again after its third attempt stays red for a human; the cap keeps a permanently broken workflow from burning minutes forever.
