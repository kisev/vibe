# Design

## Decision: the review is evidence, not an order

Each finding is re-read against the file it names, in the revision it will be fixed on, before anything is edited. Three answers are possible:

- **fixed** — the defect is real and the smallest correct change is made;
- **rejected: stale** — the code the finding quotes no longer exists or already handles the case; the reason quotes what is there now;
- **rejected: preference** — the finding is a matter of taste, the current form is deliberate, and changing it would fight the file's style.

A rejection is recorded in `tasks.md` beside the task that covered the finding, with the file and the reason. Silence is not an outcome: a finding is either fixed or rejected.

## Decision: fix the contract, not the symptom

Where a finding names a contract mismatch (speaker ids zero- versus one-based, an error code, a units field, a sentinel), the fix lands at the contract and every caller is brought in line, even when that widens the diff. Patching one side leaves the next reader with the same trap.

## Decision: one commit per area

The tree is split into eight disjoint areas (Tauri core, desktop web, desktop tooling, server, CI and configuration, scripts, website, and the probe/no-op pieces). Each area is fixed, checked and committed on its own, so a review remark about the commit itself stays readable and a regression can be bisected by area. The areas share no files; shared files are edited by the coordinator only.

## Decision: what gets a requirement

A fix gets a spec delta only when it changes what a user or another program observes:

- an explicit "None" device that persists and is distinguishable from "nothing stored";
- an active model that the catalog refuses to delete;
- a failed download that surfaces as a failure;
- one-based speaker ids and option errors with their own code;
- a commit gate that prints its partial verdict and keeps low findings non-blocking;
- strict resource filtering on every platform, and a browser log without the meeting secret.

Everything else — a redundant clone, a dead branch, a duplicated literal, a missing `permissions:` block — is remediation of existing behavior and belongs to tasks, not to the specs.

## Decision: verification per area

Every area runs the check that covers the code it touched (desktop tests and `tsc`, `cargo test` for a crate, `actionlint`/`task verify` pieces for the workflows, the website suite for the site). The whole gate (`task verify`) runs once at the end, on the combined tree, because a per-area gate is where cross-area breakage hides.
