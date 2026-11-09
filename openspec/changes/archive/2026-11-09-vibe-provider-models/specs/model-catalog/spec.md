# Spec Delta

## ADDED Requirements

### Requirement: Official vibe picks group under the Vibe provider

The catalog SHALL display every model the vibe project publishes — the `vibe-app` repository entries and the whisper model line the project's download page has always linked to — under the Vibe provider, regardless of which repository hosts the file. The attribution SHALL be maintained by the fork independently of the vendored catalog copy, so refreshing the upstream catalog data does not silently re-group them.

#### Scenario: Whisper models under the Vibe filter

- **WHEN** the settings catalog is filtered by the Vibe provider
- **THEN** the whisper line (Tiny, Tiny English, Base, Base English, Small, Small English, Medium, Medium English, Large v1, Large v2, Large v3, Large v3 Turbo) appears alongside the Parakeet and Nemotron entries, and each entry is downloadable and installable exactly as its catalog metadata describes

#### Scenario: A catalog refresh keeps the grouping

- **WHEN** the vendored handy catalog copy is refreshed from upstream and an officially picked model is still present
- **THEN** the entry keeps its Vibe provider attribution; an id that no longer exists upstream simply disappears from the group with no dangling reference

#### Scenario: Hosting origin stays visible

- **WHEN** an officially picked entry's card or link is inspected
- **THEN** the entry still links to its actual repository, so the user can see where the file lives even though the provider group says Vibe
