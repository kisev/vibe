# Spec Delta

## ADDED Requirements

### Requirement: Recording-quality defaults are on

Loudness normalization and speaker separation SHALL default to on for a fresh configuration, and resetting audio processing SHALL restore normalization on. A missing separation model SHALL turn separation back off through the existing migration rather than failing a transcription.

#### Scenario: A fresh install

- **WHEN** the app starts with a configuration that has never set these keys
- **THEN** loudness normalization and speaker separation are enabled

#### Scenario: No separation model yet

- **WHEN** separation is enabled but its model is missing
- **THEN** the existing migration disables separation and the rest of the app works as before

### Requirement: A note never contradicts its control

The Whisper-only options note SHALL appear with the Whisper options it describes, not beside the speaker-separation toggle, and SHALL NOT be readable as a limit on speaker separation.

#### Scenario: A non-Whisper model is selected

- **WHEN** the tuning section hides the Whisper-only rows
- **THEN** the explanation sits with the Whisper options group and the speaker toggle stands alone

### Requirement: The fork has no upstream community link

The settings SHALL NOT link to a Discord community, and no URL or string for it SHALL remain in the tree.

#### Scenario: Opening the settings

- **WHEN** any settings section renders
- **THEN** no Discord entry is shown and `discordURL` does not exist in the codebase

### Requirement: Every parameter explains itself

Each settings parameter SHALL offer an info affordance that shows a short explanation in the selected language, using the existing description where there is one and a new help string where there is not.

#### Scenario: Hovering a parameter

- **WHEN** the pointer rests on a parameter's info icon
- **THEN** a short tooltip explains what the parameter does, in the app's language

#### Scenario: A localized tooltip

- **WHEN** the interface language changes
- **THEN** the explanations are shown in that language, with no English fallback where a translation exists
