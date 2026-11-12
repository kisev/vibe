# Proposal

## Why

Every published release — dev.76 through dev.81 — left a failed **Deploy Website** run behind. The `github-pages` environment allows deployments only from branches named in its custom policy (`main`), so a run whose ref is a tag (`refs/tags/dev.81`) is rejected before any step starts: the job finishes red with an empty step list. The CI janitor sees that failure, re-runs it, and the rerun fails the same way, so each tag produces a red run plus janitor noise and wasted runners.

The trigger is also wrong on its own terms. A release event deploys whatever ref the release points at, which for a dev build is the `dev` branch — that would put half-finished site changes on the public site. The site is already deployed by the push to `main` that carries the same content, and stable releases are cut from `main`, so the release trigger adds nothing but failures.

## What Changes

- `.github/workflows/website.yml` no longer triggers on `release: published`. Deployment stays on push to `main` and on manual `workflow_dispatch`.
- Nothing else about the build changes: the `pwa`, `build` and `deploy` jobs, the `pages` concurrency group and the environment name stay as they are.

## Capabilities

### New Capabilities

- `website`: how the public site is built and deployed — which refs may deploy it and what a release event does to it.

## Impact

- `.github/workflows/website.yml` (trigger block only).
- No app, server, script or content change.
- The janitor stops receiving failed Deploy Website runs caused by tags; it keeps its Dev Build healing path.
