# Tasks

- [x] 1. Remove the `release: types: [published]` trigger from `.github/workflows/website.yml`, leaving push-to-`main` and `workflow_dispatch`.
- [x] 2. Add a comment beside the trigger block naming the reason: the `github-pages` environment's branch policy rejects tag refs, and a dev tag would deploy the `dev` branch.
- [x] 3. Check `.github/workflows/ci-janitor.yml` still heals Dev Build failures and no longer receives doomed Deploy Website runs from tags.
- [x] 4. The `dev:main` push at 2c4333da started Deploy Website, which finished success and the live site serves the new bundle (`/vibe/assets/index-4TDZ5eQC.js`, the roadmap route included). Tagging `dev.82` started only the Dev Build run — no Deploy Website run exists for that tag.
- [x] 5. The phone PWA job assumed the release line already carried `handoff/`. Once `main` was rolled back to 1.0.0 the job failed with `Task "phone:pwa" does not exist` and took the whole deploy down. A `probe` job now greps the checked-out `main` for the `phone:pwa` task; the `pwa` job runs only when it is there, and the site publishes without `/phone/` until a release includes it. `build` depends on `probe`, not on `pwa`. The check is inline rather than a task or script call: it has to run against `main`, which carries neither a newer taskfile nor the deploy pipeline's own scripts.
