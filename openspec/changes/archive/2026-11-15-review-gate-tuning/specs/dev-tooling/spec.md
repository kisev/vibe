# Spec Delta

## ADDED Requirements

### Requirement: An unreviewed commit says so

The commit gate SHALL fail open when it cannot review, and SHALL say that the review did not run in wording distinct from a clean verdict: a skip names its reason and is printed where the commit's hook output shows it. Deliberate bypasses (`OCR_SKIP`) SHALL name the bypass, and the cases with nothing to review SHALL keep their own wording.

#### Scenario: The provider is unreachable

- **WHEN** the review cannot run because the provider fails, times out, or returns no usable output
- **THEN** the commit proceeds
- **AND** the output carries `review NOT run` with the reason, never a clean-verdict line

#### Scenario: The gate is bypassed on purpose

- **WHEN** a commit is made with `OCR_SKIP=1`
- **THEN** the output says the review did not run and names the bypass

#### Scenario: Nothing to review

- **WHEN** the staged snapshot holds no reviewable file
- **THEN** the output says there was nothing to review, not that a review was skipped
