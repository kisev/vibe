# Proposal

## Why

The OCR commit gate fails open: when the provider is unreachable, the review times out, OCR is not installed, or the run produces no usable JSON, it prints `ocr commit gate skipped: <reason>` to stderr and lets the commit through. In the commit output that line sits next to the hook list and reads like just another note, while a commit that *was* reviewed ends with `no medium/high findings`. Two opposite outcomes, one glance apart.

That matters because the gate is the only review before a push: a skipped review that looks like a passed one is a silent hole in the gate.

## What Changes

- A review that did not run says so on stdout, in wording that cannot be mistaken for a clean verdict: `ocr commit gate: review NOT run — <reason>`, with the reason (provider failure, timeout, missing CLI, no JSON, first commit).
- `OCR_SKIP=1` says the same, naming the bypass instead of a reason.
- The cases where there is genuinely nothing to review keep their own wording (`no staged changes`, `no reviewable files staged`), so "nothing to look at" is not confused with "could not look".

## Capabilities

- `dev-tooling` (existing): the local gates a commit or push runs.

## Impact

- `scripts/ocr_gate.py` (`skip()` and the `OCR_SKIP` branch), `scripts/ocr_gate_test.py` (the three tests that asserted the old wording), and `docs/how-to/check-your-change.md`, which quotes the line.

## Non-Goals

- **Per-file verdict caching.** The idea was to reuse findings for unchanged files across retries, but the retries that cost time change the same file every round — the cache would save nothing, while an identical tree (a retry after a signing failure) already hits the existing cache. Recorded here so it is not re-proposed.
- **`glob` on the hook.** The gate already counts reviewable files before reviewing: a docs-only commit finishes in seconds.
- **Lowering `--effort`.** The review is expensive because it is thorough; trading that away is a quality decision, not a tuning one.
