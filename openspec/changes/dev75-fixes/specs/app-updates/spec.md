# Spec Delta

## MODIFIED Requirements

### Requirement: Three update channels

The app SHALL offer Release, Beta and Dev channels. The channel names SHALL be rendered as the same Latin words in every locale. Beta SHALL offer only release candidates (`X.Y.Z-rc.N`); when no candidate exists, Beta SHALL report that nothing is available on the line.

#### Scenario: Channel names

- **WHEN** the interface language is Russian
- **THEN** the selector reads `Release`, `Beta`, `Dev`

#### Scenario: Beta with no candidates

- **WHEN** no `-rc.N` build has been released and the user selects Beta
- **THEN** the check reports no update, and the installed stable or dev build is not offered as a beta

#### Scenario: Candidate published

- **WHEN** `channel.py` points beta at an `-rc.N` release
- **THEN** Beta offers that version to installs older than it
