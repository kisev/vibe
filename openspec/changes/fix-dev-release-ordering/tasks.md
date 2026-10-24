# Tasks

## 1. Tag scheme in the workflow

- [x] 1.1 In `.github/workflows/dev-build.yml`, change the "Compute the dev version" step to derive `tag="dev.${{ github.run_number }}"` while keeping `version` as the application version with the `-dev.<short-commit>` suffix, and emit both; verify the step output still prints a `tag` and a `version` line on actionlint or a local shell run of the step body
- [x] 1.2 Point the tauri-action inputs at the new tag (`tagName: dev.<run-number>`) and keep `releaseName`/`releaseBody` carrying the dev version with the short commit and the full SHA (`github.sha`); verify by grep that no remaining step derives the tag from the commit SHA
- [x] 1.3 Fix the stale file-header comment that still describes a rolling `dev` prerelease so it describes one release per run; verify the header matches the actual publish behavior

## 2. End-to-end ordering check

- [ ] 2.1 Push a commit to `main`, wait for the dev build, and verify on the fork's releases page that the new `dev.<run-number>` release appears above all earlier `dev.<sha>` releases and its name shows the `-dev.<short-commit>` version with the full SHA in the body
