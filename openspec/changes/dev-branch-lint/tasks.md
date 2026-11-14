# Tasks

- [x] 1. Add `workflow_dispatch` to `.github/workflows/lint.yml` with a comment naming why dev revisions are dispatched rather than pushed to `main`.
- [x] 2. Restate the release rule in `AGENTS.md`: tag only from a revision with a green Lint run, dispatched on `dev`.
- [x] 3. Dispatched `lint.yml` against `dev` (run 43301674408 on a109a4b) and it finished green on all five jobs, including the Windows `helper-link-check` — the run that exists so a dev revision is checked without touching `main`. The first dispatch (run 43265633048 on a7d56c9) failed in `format:check`, which is exactly the class of failure this dispatch surfaces before a tag.
- [x] 4. A `main` push still triggers Lint unchanged: pushing `dev:main` at 2c4333da started run 43297846178 with all five jobs, and the `helper-link-check` job's Windows failure there is what the relative-path tar fix in `scripts/ggml_libs.sh` addresses.
- [x] 5. Add a macOS twin of `desktop-check`: the crate's macOS-only blocks compile nowhere else, and dev.81 through dev.84 all shipped with every macOS cell failing on one `bail!` (unqualified, from a module that imports `eyre`) while Linux and Windows stayed green. `scripts/ci/desktop-check.sh` also stages the `ffmpeg` placeholder the macOS config declares, and the tag rule now reads: no tag until the Lint run, macOS job included, is green on that commit.
- [x] 6. Every `fd -H` call in `taskfile.yml` now excludes `.git`: the hidden-including search walked into `.git/worktrees/`, so a second worktree on the machine made `format:check` fail on files no one wrote.
