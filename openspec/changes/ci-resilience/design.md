# Design

## Context

Three failure classes hit the Actions tab this week. (1) `lint.yml` ran `server:clippy`, which since the Vulkan backend compiles `transcribe-cpp-sys` with `GGML_VULKAN=ON`, on a bare `ubuntu-24.04` runner — seven consecutive red runs until the apt step landed in e429a999. (2) GitHub's macOS pool intermittently kills jobs at exactly 15:01 with `BlobNotFound` logs (proven by a bare-heartbeat probe that died the same way; a pinned-label probe survived — it flaps per-job, per-window): it took down dev.41's matrix three times, dev.42's first pass, and Deploy Website 40387623693, whose `build` job was killed → `deploy` skipped → site never published. Every recovery was a manual `gh run rerun --failed`; both manual reruns that landed in good windows succeeded. (3) `macos-runner-probe.yml` was a diagnostic and its question is answered.

## Decisions

- **Move website build/deploy off macOS, don't bandage it.** The `build` job is checkout + pnpm + `upload-pages-artifact` of a static `website/dist`; `deploy` is the pages deployment. Nothing in either step needs an Apple runner, so both go to `ubuntu-latest` and the site stops depending on the flakiest pool GitHub offers. The `pwa` job already runs on ubuntu.
- **A janitor workflow, not per-job retry actions.** Runner-level kills never execute the job's own steps, so in-job retry wrappers cannot react to them. A scheduled sweep can: every 30 minutes, look at the **latest** run of Dev Build and of Deploy Website; if it finished `failed`/`cancelled` and `run_attempt < 3`, re-run its failed jobs, one log line per action. `gh` is preinstalled; `permissions: actions: write` on the job's own token is enough; no third-party actions (retrying via the API keeps the audit trail in the run itself — the rerun appears on the original run, which is exactly what a human would have done). Latest-run only is deliberate: a dry test of the obvious 24-hour-window rule against the real history showed it selecting sixteen red runs — including deliberately cancelled debug iterations and runs from revisions whose later runs already superseded them — which the janitor would have resurrected at full matrix cost. A superseded run is never the latest; the latest run is the only one whose completion still matters.
- **Attempt cap via `run_attempt`.** The API already counts attempts; `run_attempt < 3` gives every run two automatic retries — enough for a flapping pool (dev.42 needed one), not enough to hide a genuinely broken workflow or burn minutes forever.
- **Lint stays out of the janitor.** Its failures are content failures; auto-retrying would mark broken code green on a lucky roll. The prerequisite step (landed) is what keeps it deterministic.
- **The prerequisite rule becomes spec, not memory.** The lint gap existed because "which workflows compile the server?" was answered from memory once and never re-asked when the engine grew a GPU backend. The delta requirement makes the answer part of the contract; the tasks include the audit table as of today.

## Risks / Trade-offs

- [Janitor reruns a run whose failure was real, not infra] → capped at two rolls; a real failure stays red after that, and the rerun trail is visible on the run.
- [A sweep races a human's own rerun] → `gh run rerun` on an already-running run fails harmlessly; the janitor logs and moves on.
- [Website deploys on ubuntu change an environment] → the pages deployment pins `environment: github-pages` already; the runner OS is not part of that contract.

## Migration Plan

Two commits: the website runner move (no observable behavior change beyond reliability) and the janitor + probe deletion. Validation is observational: the next platform kill self-heals within 30 minutes, and the Actions tab needs no human rerun for release workflows again.
