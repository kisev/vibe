# Proposal

## Why

The review of `v1.0.0..HEAD` found real defects the lint matrix cannot see: fail-open navigation,
session races, a broken Windows packaging path, unauthenticated CI steps. That review ran by hand,
after the code had already landed. The commit boundary is the cheapest place to catch the same
class of defect: before a finding reaches the branch, a pull request, or a later full review.

## What Changes

- A new `task review:staged` target, with the logic in `scripts/ocr_gate.py`, reviews exactly the
  staged snapshot of the pending commit and blocks it when OCR reports a `critical`, `medium` or
  `high` finding. Low findings are printed but do not block.
- The gate builds a temporary commit object from the index (`git write-tree` + `git commit-tree`)
  and runs `ocr review --commit <sha>`, so unstaged and untracked files are never reviewed and
  never block a commit.
- `lefthook.yml` gains a `review` command in pre-commit. The existing file-scoped checks stay
  parallel and fast; the review is an additional, slower stage that runs only when the staged set
  holds files OCR supports.
- All files OCR supports are in scope. OCR's own extension filter decides: markdown and other
  unsupported types are skipped by the tool.
- Infrastructure failures — provider unreachable, timeout, OCR not configured — print a prominent
  warning and let the commit proceed. Only medium/high findings block.
- A clean result (and a blocking one) is cached per staged-diff hash under the git directory, so a
  retry after a failing lint does not pay for the same review twice.
- The review runs with `--effort high` and `--timeout 15`, matching the owner's configured quality
  budget rather than the tool's defaults.
- Escape hatches: `OCR_SKIP=1`, `LEFTHOOK_EXCLUDE=review`, or `git commit --no-verify`.

## Capabilities

### New Capabilities

None: the gate is a development-tooling gate, not a new product behavior.

### Modified Capabilities

- `dev-tooling`: the pre-commit gate gains a commit-time review stage. The "fast pre-commit"
  requirement is narrowed to the file-scoped checks, and a new requirement defines the review
  gate's staged snapshot, severity policy, failure policy and bypass.

## Impact

- `taskfile.yml`, `lefthook.yml`, `scripts/ocr_gate.py` (new), its test, `docs/how-to/check-your-change.md`.
- `mise.toml`: pin `ocr` so the hook resolves one version instead of a global install.
- Privacy: the staged diff is sent to the OCR provider configured in `~/.opencodereview`
  (`claude-code-router` today). With a remote provider, staged code leaves the machine at commit
  time; that is recorded in the docs, not hidden.
