# Spec Delta

## ADDED Requirements

### Requirement: Long transcripts are still diffed

The results view SHALL compute the word diff for transcripts of any realistic length, and SHALL NOT report zero added and zero removed words for texts that differ.

#### Scenario: A ten-minute recording

- **WHEN** two runs of the same input each produce more than a thousand words and the texts differ
- **THEN** the non-baseline column shows non-zero `+` and `−` counts and the differing words are highlighted

#### Scenario: A diff that cannot be computed

- **WHEN** the texts exceed what the diff can handle within its budget
- **THEN** the column shows the plain text with an explicit note that highlighting is unavailable, never `+0 −0`
