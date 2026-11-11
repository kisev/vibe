# Spec Delta

## Purpose

Voice profiles let a diarized speaker be recognized across recordings: the app stores a local voice embedding per known person, proposes names for matching speakers, and applies confirmed names automatically while keeping every identity decision reversible.

## ADDED Requirements

### Requirement: Voice profiles are local and named

The application SHALL store voice profiles on the local device only, each with a user-visible name and the voice embeddings collected for it, and SHALL NOT transmit audio, embeddings, or profile data anywhere. Deleting a profile SHALL remove its embeddings from the device.

#### Scenario: A profile is created from a named speaker

- **WHEN** the user names a diarized speaker in a transcript and keeps the offered "remember this voice" choice
- **THEN** a profile carrying that name and an embedding computed from that speaker's audio exists locally

#### Scenario: A profile can be deleted

- **WHEN** the user deletes a profile
- **THEN** its embeddings and name are gone from the device, and later transcripts match against the remaining profiles only

#### Scenario: Nothing leaves the device

- **WHEN** a voice profile is created or matched
- **THEN** no audio, embedding, or profile name is sent over the network

### Requirement: Matching proposes names for diarized speakers

After a transcript is diarized, the application SHALL compare each detected speaker's embedding against the stored profiles and SHALL present a matching profile name as a suggestion when the similarity is at or above the profile's match threshold. A suggestion SHALL be accepted, rejected, or replaced by another name, and rejecting it SHALL leave the speaker unnamed (or named as before) without changing the profile.

#### Scenario: A known voice in a new recording

- **WHEN** a diarized speaker matches a stored profile clearly
- **THEN** the transcript shows that profile's name for the speaker, pending the confirmation rule below

#### Scenario: An unknown voice

- **WHEN** no profile reaches the match threshold
- **THEN** the speaker keeps the default label and the user can name it as today

#### Scenario: A rejected suggestion

- **WHEN** the user rejects a suggested profile name
- **THEN** the speaker is not linked to that profile and the transcript keeps its previous naming

### Requirement: Confirmed identities label later transcripts automatically

Once a speaker-to-profile link has been confirmed by the user, subsequent recordings SHALL fill that profile's name automatically only when the match is clear. Weak or ambiguous matches — two profiles close to each other, or similarity below the confirmation threshold — SHALL remain suggestions and SHALL NOT overwrite a name the user typed in the current transcript.

#### Scenario: The next meeting with a confirmed person

- **WHEN** a confirmed profile matches a speaker in a new transcript clearly
- **THEN** that speaker is labeled with the profile name without further prompting

#### Scenario: An ambiguous match

- **WHEN** two profiles are similarly close to one speaker, or similarity is below the confirmation threshold
- **THEN** the app presents the candidates as suggestions instead of choosing one

#### Scenario: A user-typed name wins

- **WHEN** the user has typed a name for a speaker in the current transcript and a profile match would disagree
- **THEN** the typed name stays and the match is shown as a non-destructive suggestion

### Requirement: Profiles are manageable

The application SHALL provide a settings surface that lists voice profiles with their names and voice counts, and SHALL allow renaming, merging two profiles that are the same person, and deleting a profile.

#### Scenario: Rename

- **WHEN** the user renames a profile
- **THEN** the new name is used for matches in future transcripts without losing its embeddings

#### Scenario: Merge

- **WHEN** the same person exists as two profiles and the user merges them
- **THEN** the surviving profile carries the chosen name and the embeddings of both, and the other profile disappears

### Requirement: Voice memory degrades gracefully

When diarization is disabled, the embedding model is not installed, or the recording produced no usable speaker audio, the app SHALL transcribe and label speakers exactly as before and SHALL NOT fail the transcript or block naming.

#### Scenario: Embedding model missing

- **WHEN** a recording is transcribed with diarization on but the embedding model absent
- **THEN** the transcript completes with default speaker labels and naming works manually

#### Scenario: Diarization off

- **WHEN** speaker separation is disabled
- **THEN** no voice profiles are created or suggested for that transcript
