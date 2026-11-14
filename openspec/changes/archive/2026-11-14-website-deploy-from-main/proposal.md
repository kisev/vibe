# Proposal

## Why

Every published release — dev.76 through dev.81 — left a failed **Deploy Website** run behind. The `github-pages` environment allows deployments only from branches named in its custom policy (`main`), so a run whose ref is a tag (`refs/tags/dev.81`) is rejected before any step starts: the job finishes red with an empty step list. The CI janitor sees that failure, re-runs it, and the rerun fails the same way, so each tag produces a red run plus janitor noise and wasted runners.

The trigger is also wrong on its own terms. A release event deploys whatever ref the release points at, which for a dev build is the `dev` branch — that would put half-finished site changes on the public site. The site is already deployed by the push to `main` that carries the same content, and stable releases are cut from `main`, so the release trigger adds nothing but failures.

## What Changes

- `.github/workflows/website.yml` no longer triggers on `release: published`, and deployments start from `main` only: a `dev` push creates no run, and a `guard` job fails a dispatch on any other ref instead of reporting a skipped deploy as success. The release site is built from `main`; the dev preview is built from the `dev` tree inside that deploy.
- The phone PWA job no longer assumes the release line ships `handoff/`: the workflow greps the checked-out `main` inline, `pwa` runs only when the handoff is there, and `build` depends on the probe rather than on the phone job, so the site publishes without `/phone/` until a release includes it.
- The deploy takes `taskfile.yml`, `scripts/`, `pyproject.toml` and `uv.lock` from `dev`, so a release line that predates the site pipeline still builds its own content.
- The `pages` concurrency group and the environment name stay as they are.

## Capabilities

### New Capabilities

- `website`: how the public site is built and deployed — which refs may deploy it, what a release event does to it, and whether the phone handoff is part of the artifact.

## Impact

- `.github/workflows/website.yml` (triggers, guard, inline phone probe and pipeline sourcing).
- No app, server or content change.
- The janitor stops receiving failed Deploy Website runs caused by tags; it keeps its Dev Build healing path.
