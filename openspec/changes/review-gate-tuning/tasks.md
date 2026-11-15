# Tasks

- [x] 1. `skip()` in `scripts/ocr_gate.py` prints `ocr commit gate: review NOT run — <reason>` on stdout, and the `OCR_SKIP` branch prints `review NOT run — bypassed with OCR_SKIP`; the "nothing to review" cases keep `no staged changes` / `no reviewable files staged`.
- [x] 2. `scripts/ocr_gate_test.py` asserts the new wording for the infrastructure-failure, first-commit and `OCR_SKIP` paths, and keeps asserting the nothing-to-review lines are different (`uv run scripts/ocr_gate_test.py`: 17 tests OK).
- [x] 3. `docs/how-to/check-your-change.md` quotes the new line and says why it is worded as the opposite of a clean verdict.
- [x] 4. Per-file verdict caching is recorded as a non-goal in `proposal.md`: the retries that cost time change the same file, so it would save nothing.
