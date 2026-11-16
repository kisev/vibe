# Tasks

- [x] 1. `skip()` in `scripts/ocr_gate.py` prints `ocr commit gate: review NOT run — <reason>` on stdout, and the `OCR_SKIP` branch prints `review NOT run — bypassed with OCR_SKIP`; the "nothing to review" cases keep `no staged changes` / `no reviewable files staged`.
- [x] 2. `scripts/ocr_gate_test.py` asserts the new wording for the infrastructure-failure, no-usable-output, first-commit and `OCR_SKIP` paths, asserts a skip never prints the clean verdict, and keeps the nothing-to-review cases (`no staged changes`, `no reviewable files staged`) out of the `review NOT run` wording (`uv run scripts/ocr_gate_test.py`: 19 tests OK).
- [x] 3. `docs/how-to/check-your-change.md` quotes the new line and says why it is worded as the opposite of a clean verdict.
- [x] 4. Per-file verdict caching is recorded as a non-goal in `proposal.md`: the retries that cost time change the same file, so it would save nothing.
