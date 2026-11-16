# Spec Delta

## ADDED Requirements

### Requirement: A partial review verdict is reported

When the commit-time reviewer returns a partial verdict, the gate SHALL print it, and the decision to block SHALL follow the severities it contains rather than the verdict's shape.

#### Scenario: A partial verdict with only low findings

- **WHEN** the reviewer reports a partial verdict whose findings are all low
- **THEN** the findings are printed and the commit proceeds

#### Scenario: A partial verdict with a blocking finding

- **WHEN** the reviewer reports a partial verdict that contains a medium or high finding
- **THEN** the commit is refused and the finding is printed

### Requirement: Sidecar pins are committed

The version and revision pins a sidecar fetch depends on SHALL be committed with the vendored headers and patches, and a missing pin SHALL stop the fetch with a message naming the missing file and the command that regenerates it.

#### Scenario: A clean checkout

- **WHEN** the sidecar fetch runs in a fresh checkout
- **THEN** it reads the committed pins and proceeds without a manual step

#### Scenario: A pin is absent

- **WHEN** a pin file is missing
- **THEN** the script names the file and the regeneration command instead of failing on a shell redirect
