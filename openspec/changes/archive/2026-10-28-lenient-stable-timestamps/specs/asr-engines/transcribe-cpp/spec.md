# Spec Delta

## Purpose

An unsupported stable-timestamp request no longer fails transcription: the flag is a quality enhancement, and clients send it without checking every family's capabilities, so the engine drops it with a warning while keeping strict rejections for semantic options.

## ADDED Requirements

### Requirement: Unsupported enhancement flags degrade gracefully

The engine SHALL NOT fail a request because of an enhancement flag the loaded family cannot honor: a `stable_timestamps` request on a family without that capability SHALL proceed with the flag dropped and a warning logged. Semantic options (translation, text prompts, unsupported languages) SHALL keep failing with their specific reasons.

#### Scenario: Stable timestamps on a family without them

- **WHEN** a request sets `stable_timestamps` on a family whose capabilities report it off, such as GigaAM
- **THEN** the request transcribes, the flag is dropped from the engine options, and the server logs a warning naming the family

#### Scenario: Semantic options still rejected

- **WHEN** a request asks for translation or a text prompt on a family without that capability
- **THEN** the request fails with the family-specific reason, exactly as before

#### Scenario: The dropped flag stays out of the cache key

- **WHEN** the same audio is transcribed with the flag set on a family that drops it
- **THEN** the chunk cache keys the run by the post-drop options, so repeat runs reuse the entry
