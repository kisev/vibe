# Design

## Context

See `proposal.md` — Why. The current pre-commit hook is a parallel, file-scoped set of lint/format
commands in `lefthook.yml`; all logic lives in `taskfile.yml` targets and `scripts/`, never in the
hook file. `ocr` (OpenCodeReview 1.13.9) is installed globally today; `~/.opencodereview/config.json`
selects `claude-code-router` / `glm-5.3`, effort `high`, language Russian. OCR has no `--staged`
flag: its workspace mode reviews staged + unstaged + untracked files, and its `--commit` mode
reviews one commit against its parent. Its JSON output carries findings with `severity`.

## Goals / Non-Goals

**Goals:**

- Review the exact content that is about to be committed, and nothing else.
- Block only on `medium`/`high` findings; never block on review infrastructure failures.
- Keep the gate out of the fast lint path and make bypass explicit and documented.
- One tool version on every checkout, resolved through `mise`.

**Non-Goals:**

- Replacing the full `ocr review --from v1.0.0 --to HEAD` sweep, or reviewing what is already
  committed.
- A CI-side review job: this gate is local, because it sits at the commit boundary.
- Reviewing the commit message or files OCR does not support.

## Decisions

### Review the staged tree through an unreferenced commit object

`scripts/ocr_gate.py` runs `git write-tree`, then `git commit-tree <tree> -p HEAD -m "ocr gate"`,
and passes the resulting SHA to `ocr review --commit <sha>`. The object is unreferenced, so it
never appears in `git log` or in a branch, and the repository's GC removes it. The diff is exactly
the index against `HEAD`, which is exactly what the commit will contain.

Alternatives considered:

- **Workspace mode (`ocr review`)**: reviews staged + unstaged + untracked, so uncommitted work
  could block an unrelated commit. Rejected.
- **`git stash --keep-index`**: mutates the shared stash stack and races with other sessions;
  forbidden by the worktree rules. Rejected.
- **Copying the index into a temporary repository**: loses history context for the review and is
  slow on a large tree. Rejected.

Edge cases: an unborn `HEAD` has no parent to diff against, so the gate warns and allows the very
first commit; a `write-tree` failure (intent-to-add entries, index lock) is treated the same way.

### Skip without an LLM call when nothing is reviewable

Run `ocr review --commit <sha> --preview` first. It costs a git inspection, not a model call; when
its output reports zero changed reviewable files, the gate exits 0. This is what keeps docs-only
and translation-only commits instant and is the reason the hook has no extension glob: OCR's own
matcher is the single source of truth for "supported file".

### Block from the structured output, not the exit code

The gate runs `ocr review --format json --output <file> --audience agent --effort high --timeout 15`.
It parses `comments` and classifies each by `severity`. Blocking is decided from those values
(`critical`, `medium`, `high`); `low` is printed but not blocking. The process exit code is used
only as an infrastructure signal: a failed review (non-zero exit, missing output, `comments: null`,
or an explicit error field) is a failure to review, not a finding. A run that reports a complete
status while every tool call failed is also treated as a failed review, and a partial tool-call
failure prints a warning that the findings may be incomplete.

The exact success-path JSON shape is pinned by a captured fixture during implementation: the
planning probe reached a provider failure before producing findings, so the parser is written
against the session-record shape and verified with a fixture, not assumed.

### Fail open on infrastructure, fail closed on findings

An unreachable provider, a timeout, or an unconfigured OCR prints a loud warning and exits 0. The
hook pipeline must not turn a local LLM outage into "cannot commit". Findings are the only reason
to exit 1. This also covers the current probe result: the configured router was unreachable, and a
fail-closed gate would have blocked every commit.

### Cache by staged-diff hash

The key is the staged parent/tree identity combined with the gate schema version, the review
effort, and a provider/model fingerprint read from `~/.opencodereview/config.json`, so switching
models re-reviews instead of replaying an older model's verdict. The entry lives under
`$(git rev-parse --git-dir)/ocr-gate/` — per worktree, so the shared stash and other worktrees are
untouched — and is written atomically (temporary file + rename). Both a clean verdict and a
blocking verdict are cached: a retry after an unrelated hook failure repeats the same verdict in
milliseconds. `OCR_GATE_NO_CACHE=1` bypasses it.

### Pin the tool, resolve through mise

Add `npm:@alibaba-group/open-code-review` to `mise.toml` and call `mise exec -- ocr`. The gate
stops with a warning (fail-open) when `mise exec` cannot find the tool, so a checkout without
`mise install` is degraded, not broken. The LLM provider configuration stays in
`~/.opencodereview/config.json`: it is per-user credentials, not repository state.

### Hook placement and bypass

Add one command to `lefthook.yml` pre-commit: `review: run: task review:staged`. Keep
`parallel: true`; the review runs beside the fast checks, and the script decides whether there is
work. The script honours `OCR_SKIP=1` before doing anything. `LEFTHOOK_EXCLUDE=review` and
`git commit --no-verify` remain the stock escapes.

### Output

On a block, print each finding as `path:line severity: message`, then the session id and
`ocr session export <id>` for full context. On a pass, print one line with the finding count and
elapsed time. On infrastructure failure, print `ocr commit gate skipped: <reason>` to stderr so it
is visible above the commit summary.

## Risks / Trade-offs

- **Commit latency**: effort `high` with a 15-minute budget can make a commit take minutes. →
  Cache by diff hash, skip when nothing is reviewable, keep the explicit bypass, and print elapsed
  time so the cost is visible. The owner chose this budget over a faster setting.
- **False positives block commits**: an LLM finding can be wrong. → Findings are printed with
  path/line so they can be judged; `OCR_SKIP=1` / `--no-verify` are one keystroke away; the
  severity gate excludes `low`.
- **Code leaves the machine**: every reviewed commit sends its staged diff to the configured
  provider (a local router today, a remote model behind it). → Documented in
  `docs/how-to/check-your-change.md`; the bypass and the provider choice stay local.
- **OCR output contract drifts**: a future OCR version may change the JSON shape. → Version pinned
  in `mise.toml`; the parser treats an unrecognised shape as an infrastructure failure (warn,
  allow), never as a silent pass.
- **Windows**: `git commit-tree` and Python are available under Git Bash, but the hook path has
  only been reasoned about, not run there. → The gate uses only git/Python, no POSIX-only
  utilities; a Windows commit is the acceptance check.
- **First commit**: no parent to diff. → Warn and allow, documented.

## Migration Plan

Land the task, script, and test first with the hook command absent; run `task review:staged`
manually on a known-good and a known-bad staged set. Then add the lefthook command and run
`task hooks` in each checkout. Rollback is removing the one lefthook command; the script and task
are inert without it.

## Open Questions

None that change the specs or the approach. The exact success JSON shape is pinned by a fixture
during implementation; if it differs from the session shape, only the parser and its fixture change.
