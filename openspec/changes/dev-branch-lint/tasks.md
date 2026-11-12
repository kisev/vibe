# Tasks

- [x] 1. Add `workflow_dispatch` to `.github/workflows/lint.yml` with a comment naming why dev revisions are dispatched rather than pushed to `main`.
- [x] 2. Restate the release rule in `AGENTS.md`: tag only from a revision with a green Lint run, dispatched on `dev`.
- [x] 3. Dispatched `lint.yml` against `dev` (run 43301674408 on a109a4b) and it finished green on all five jobs, including the Windows `helper-link-check` — the run that exists so a dev revision is checked without touching `main`. The first dispatch (run 43265633048 on a7d56c9) failed in `format:check`, which is exactly the class of failure this dispatch surfaces before a tag.
- [x] 4. A `main` push still triggers Lint unchanged: pushing `dev:main` at 2c4333da started run 43297846178 with all five jobs, and the `helper-link-check` job's Windows failure there is what the relative-path tar fix in `scripts/ggml_libs.sh` addresses.
