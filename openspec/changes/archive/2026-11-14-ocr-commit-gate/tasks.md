# Tasks

## 1. Gate script

- [x] 1.1 Add `npm:@alibaba-group/open-code-review = "1.13.9"` to `mise.toml`; verify with `mise install && mise exec -- ocr version` (prints 1.13.9).
- [x] 1.2 Write `scripts/ocr_gate.py`: build the staged tree (`git write-tree` + `git commit-tree -p HEAD`), skip via `ocr review --commit <sha> --preview` when zero reviewable files, then run `ocr review --commit <sha> --format json --output <tmp> --audience agent --effort high --timeout 15`. Verify by running it on a staged change and on a docs-only staged set (the second makes no LLM call).
- [x] 1.3 Parse the JSON output and classify findings: `medium`/`high` exit 1 with `path:line severity: message`, `low` prints and exits 0, and an unrecognised or failed run prints `ocr commit gate skipped: <reason>` and exits 0. Verify with unit tests over a captured success JSON and a failure JSON.
- [x] 1.4 Add the cache under `$(git rev-parse --git-dir)/ocr-gate/`, keyed by the staged-diff SHA-256 plus gate version and review settings, written atomically, with `OCR_GATE_NO_CACHE=1` bypass. Verify that re-running on the same staged diff makes no second LLM call and prints the cached verdict.
- [x] 1.5 Handle bypass and edge cases: `OCR_SKIP=1` exits before any git or LLM work; an unborn `HEAD`, a `write-tree` failure, and a missing `ocr` warn and allow. Verify each path with a test or a scripted run.
- [x] 1.6 Capture a real successful `--format json --output` run into `scripts/fixtures/ocr_review.json` (start the configured provider if it is down) and bind the parser test to that fixture; the planning probe only reached a provider failure, so the success shape must be pinned before the hook is enabled.
- [x] 1.7 Add `uv run scripts/ocr_gate_test.py` to `task scripts:test`; verify `task scripts:test` passes and includes the new tests.

## 2. Task facade

- [x] 2.1 Add a `review:staged` target that invokes `scripts/ocr_gate.py` through `uv run`, with a `desc` carrying the bypass (`OCR_SKIP`), and list it via `task --list`; verify the target runs the script and propagates its exit code.
- [x] 2.2 Exercise the target against three staged sets — a clean code change, a deliberately defective code change (e.g. `subprocess.run(..., shell=True)`), and a docs-only change — and record the observed verdicts; verify the defective set exits 1 and the other two exit 0.

## 3. Hook and documentation

- [x] 3.1 Add `review: run: task review:staged` to `lefthook.yml` pre-commit, keeping `parallel: true`; verify `task hooks` installs it and a commit with a staged defect is rejected.
- [x] 3.2 Update `docs/how-to/check-your-change.md` with the review stage, its severity policy, the fail-open behaviour, the bypasses (`OCR_SKIP=1`, `LEFTHOOK_EXCLUDE=review`, `--no-verify`), the commit-latency cost, and the privacy note that the staged diff goes to the configured provider; verify the page renders and its commands match the task and hook.
- [x] 3.3 Run the acceptance matrix: medium finding blocks, high finding blocks, low-only passes, docs-only skips without an LLM call, provider failure warns and allows, `OCR_SKIP=1` bypasses. Record each observed result.

## 4. Verification

- [x] 4.1 `task verify` green, `openspec validate --all --strict` passes, and the hook works from the main checkout as well as a linked worktree (the cache lands under the worktree's own git dir).
