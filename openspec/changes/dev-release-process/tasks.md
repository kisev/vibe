# Tasks

## 1. Tag-driven dev builds

- [ ] 1.1 Change `dev-build.yml` triggers from `push: branches: [main]` to `push: tags: ['dev.*']`, keep `workflow_dispatch`
- [ ] 1.2 Derive the dev version from the pushed tag (`dev.N` → `3.2.2-dev.N.<short-sha>`); on `workflow_dispatch` fall back to the run-number scheme; the workflow must not create a second tag for a run a tag started
- [ ] 1.3 Push a throwaway `dev.<next>` tag on a no-op commit and confirm the build runs, publishes, and no build runs for a plain `main` push afterwards

## 2. One-time cleanup (manual, user-confirmed)

- [ ] 2.1 Delete every dev tag and release except the most recent one (`gh release delete dev.N --yes` + `git push origin :refs/tags/dev.N`), leaving `server-*` untouched; confirm the list before deleting
