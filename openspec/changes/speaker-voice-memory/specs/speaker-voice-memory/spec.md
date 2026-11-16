# Spec Delta

## Purpose

Voice profiles carry speaker identity across recordings. Every transcript opens with a complete speaker list: each detected voice is either named by a match, named with confirmation, or explicitly marked undetermined for the user to name — never a bare "Speaker N" left unaddressed.

## ADDED Requirements

### Requirement: Voice profiles are local and named

The application SHALL store voice profiles on the local device only, each with a user-visible name and the voice embeddings collected for it, and SHALL NOT transmit audio, embeddings, or profile data anywhere. Deleting a profile SHALL remove its embeddings from the device.

#### Scenario: A profile is created from a named speaker

- **WHEN** the user names a diarized speaker and keeps the offered "remember this voice" choice
- **THEN** a profile carrying that name and an embedding computed from that speaker's audio exists locally

#### Scenario: A profile can be deleted

- **WHEN** the user deletes a profile
- **THEN** its embeddings and name are gone from the device, and later transcripts match against the remaining profiles only

### Requirement: Every match carries a confidence

Each detected speaker SHALL be matched against the stored profiles and SHALL carry a confidence expressed on a 0–100 scale shown in 25-point bands: 0 — definitely not, 25 — probably not, 50 — possibly, 75 — probably, 100 — definitely. The mapping from embedding similarity to confidence SHALL be calibrated against labelled recordings so the bands mean the same for every voice model, and the UI SHALL show the percentage as well as the band.

#### Scenario: A clear match

- **WHEN** a speaker's voice closely matches a profile
- **THEN** the speaker shows that profile's name with a confidence in the top band

#### Scenario: Bands are meaningful

- **WHEN** the calibration set is evaluated
- **THEN** matches in the top band are correct at a materially higher rate than matches in the middle band, and the mapping is stable across models

### Requirement: Confidence decides between automatic naming, confirmation, and unknown

The application SHALL apply two user-configurable thresholds: automatic naming (default 75) and asking (default 50). At or above the automatic threshold the matched name SHALL be filled in automatically and SHALL remain editable; between the thresholds the name SHALL be filled in but marked as awaiting confirmation; below the asking threshold the speaker SHALL be marked "could not determine" and left for the user to name, with no profile name applied.

#### Scenario: Automatic naming

- **WHEN** a speaker matches a profile at or above the automatic threshold
- **THEN** the transcript is written with the profile name and the user can still replace it

#### Scenario: Confirmation

- **WHEN** a speaker matches a profile between the asking and automatic thresholds
- **THEN** the name is filled in, visibly marked as unconfirmed, and one action confirms or changes it

#### Scenario: Undetermined

- **WHEN** no profile reaches the asking threshold
- **THEN** the speaker is marked "could not determine", no profile name is applied, and the user is prompted to name it

#### Scenario: Thresholds change behavior

- **WHEN** the user changes either threshold in settings
- **THEN** the next transcripts follow the new values without a restart

### Requirement: The transcript always ends with a complete speaker list

Every diarized transcript SHALL present a speaker list naming every detected speaker — matched, pending confirmation, or undetermined — and SHALL NOT ship with unattended generic labels as the final state. The list SHALL be visible in the transcript view and SHALL allow naming, renaming, and rejecting any proposed match, including automatic ones.

#### Scenario: A meeting with three voices

- **WHEN** a transcript with three diarized speakers is opened
- **THEN** all three appear in the speaker list with their names or their undetermined state, and each can be named or corrected in place

### Requirement: A voice sample can be heard per speaker

The speaker list SHALL offer playback of a short excerpt of each speaker's own audio (about ten to fifteen seconds) so the user can decide identity by ear. Playback SHALL stop early on request, and starting one excerpt SHALL stop any other playing excerpt.

#### Scenario: Listening to a speaker

- **WHEN** the user presses play on a speaker row
- **THEN** that speaker's excerpt plays, and pressing play on another speaker stops the first

#### Scenario: No usable excerpt

- **WHEN** a speaker has no speech long enough for an excerpt
- **THEN** the row says so and the play action is unavailable for that speaker

### Requirement: Proposed names are always overridable

Any name applied by a match, including an automatic one, SHALL be replaceable in the transcript without touching the stored profile unless the user explicitly chooses to remember the new voice. Rejecting a match SHALL leave the profile unchanged.

#### Scenario: Overriding an automatic name

- **WHEN** the user renames a speaker that was named automatically
- **THEN** the transcript uses the new name and the matched profile keeps its data

### Requirement: Profiles are manageable

Settings SHALL provide a dedicated voice-profiles section listing every profile with its name and the number of recordings it was heard in, and SHALL allow renaming, merging two profiles that are the same person, and deleting a profile.

#### Scenario: Rename

- **WHEN** the user renames a profile
- **THEN** the new name is used for matches in future transcripts without losing its embeddings

#### Scenario: Merge

- **WHEN** the same person exists as two profiles and the user merges them
- **THEN** the surviving profile carries the chosen name and the embeddings of both, and the other profile disappears

### Requirement: Voice memory degrades gracefully

When diarization is disabled, the embedding model is not installed, or the recording produced no usable speaker audio, the app SHALL transcribe exactly as before and SHALL NOT block naming or fail the transcript.

#### Scenario: Embedding model missing

- **WHEN** a recording is transcribed with diarization on but the embedding model absent
- **THEN** the transcript completes with the speaker list in its undetermined state, and naming works manually

#### Scenario: Diarization off

- **WHEN** speaker separation is disabled
- **THEN** no matches or proposals are produced for that transcript
