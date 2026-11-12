# Tasks

- [x] 1. Remove the `release: types: [published]` trigger from `.github/workflows/website.yml`, leaving push-to-`main` and `workflow_dispatch`.
- [x] 2. Add a comment beside the trigger block naming the reason: the `github-pages` environment's branch policy rejects tag refs, and a dev tag would deploy the `dev` branch.
- [x] 3. Check `.github/workflows/ci-janitor.yml` still heals Dev Build failures and no longer receives doomed Deploy Website runs from tags.
- [ ] 4. Confirm a main push still deploys (the next site commit) and that publishing dev.82 leaves no Deploy Website run.
