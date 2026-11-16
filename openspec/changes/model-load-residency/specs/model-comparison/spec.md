# Spec Delta

## ADDED Requirements

### Requirement: A run says whether its time included a model load

The comparison SHALL report, for every column, whether its measured time included loading the model or the model was already resident. A server that does not report it SHALL leave the column marked unknown rather than implying either case. The requirement lives with the comparison's own spec; the server field it rides on belongs to `server-interface`.

#### Scenario: A model was loaded for this run

- **WHEN** a column's model was loaded as part of the run
- **THEN** the column shows that its time includes the load

#### Scenario: A model was already resident

- **WHEN** the server kept the model loaded from an earlier run
- **THEN** the column says the time excludes loading, so it is not read as a faster model

#### Scenario: An older server

- **WHEN** the server's response carries no such field
- **THEN** the column is marked unknown, and the comparison still completes
