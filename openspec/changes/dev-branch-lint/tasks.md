# Tasks

- [x] 1. Add `workflow_dispatch` to `.github/workflows/lint.yml` with a comment naming why dev revisions are dispatched rather than pushed to `main`.
- [x] 2. Restate the release rule in `AGENTS.md`: tag only from a revision with a green Lint run, dispatched on `dev`.
- [ ] 3. Dispatch `lint.yml` against `dev` and get it green before the next tag.
- [ ] 4. Confirm a `main` push still triggers Lint unchanged.
