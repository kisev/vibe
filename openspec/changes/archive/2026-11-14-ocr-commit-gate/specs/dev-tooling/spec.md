# Spec Delta

## MODIFIED Requirements

### Requirement: Local gates via git hooks

The repository SHALL install lefthook hooks once per checkout (`task hooks`) with three gates: pre-commit runs file-scoped checks in parallel over the staged set and, when reviewable files are staged, the commit-time review gate; pre-push runs `task verify`, the local mirror of the CI gate set; commit-msg enforces the commit message convention.

#### Scenario: Fast pre-commit

- **WHEN** a commit stages a handful of files
- **THEN** the lint and format commands run in parallel over only the matching staged files and complete in seconds, independently of the review stage

#### Scenario: Broken formatting blocked

- **WHEN** a staged file fails its format check, including a style sheet or an HTML page
- **THEN** the commit is rejected with the tool's own diff or message

#### Scenario: Pre-push tests

- **WHEN** a push happens
- **THEN** `task verify` runs first and a failure blocks the push

#### Scenario: Conventional messages

- **WHEN** a commit message violates the configured convention
- **THEN** the commit is rejected and the rule that failed is named

## ADDED Requirements

### Requirement: Commit-time review gate

When a commit stages at least one file the review tool supports, the repository SHALL review exactly the staged snapshot before the commit is created. A `critical`, `medium` or `high` finding SHALL block the commit; a `low` finding SHALL be reported without blocking. When the review cannot run — provider unreachable, timeout, or missing configuration — the gate SHALL warn and allow the commit. The gate SHALL be explicitly bypassable.

#### Scenario: Only the staged snapshot is reviewed

- **WHEN** a worktree has staged files, unstaged edits, and untracked files
- **THEN** the review sees only the staged snapshot, and a finding in an unstaged or untracked file cannot block the commit

#### Scenario: A medium finding blocks

- **WHEN** the review reports a `medium` finding in the staged snapshot
- **THEN** the commit is rejected and the finding's path, line, severity, and message are printed

#### Scenario: A high finding blocks

- **WHEN** the review reports a `high` finding in the staged snapshot
- **THEN** the commit is rejected and the finding's path, line, severity, and message are printed

#### Scenario: A critical finding blocks

- **WHEN** the review reports a `critical` finding in the staged snapshot
- **THEN** the commit is rejected and the finding's path, line, severity, and message are printed

#### Scenario: Low findings do not block

- **WHEN** the review reports only `low` findings
- **THEN** the findings are printed and the commit proceeds

#### Scenario: No reviewable files

- **WHEN** the staged set contains no file the review tool supports
- **THEN** the gate exits without calling the language model

#### Scenario: Review infrastructure fails

- **WHEN** the provider is unreachable, the review times out, or OCR is not configured
- **THEN** the gate prints a warning naming the failure and the commit proceeds

#### Scenario: Explicit bypass

- **WHEN** `OCR_SKIP=1` is set for the commit
- **THEN** no review runs and the commit proceeds
