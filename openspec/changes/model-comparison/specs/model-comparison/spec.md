# Spec Delta

## Purpose

Users pick a model on their own audio, not on borrowed benchmarks: the models page runs the same short input through the selected models one by one and leaves comparable markdown transcripts with the processing time of each run.

## ADDED Requirements

### Requirement: Comparison input

The comparison section SHALL accept its input either as a recording made in place or as an audio file chosen from disk, and SHALL let the user select two or more installed models for the run. Models not on disk SHALL not be selectable.

#### Scenario: Short recording

- **WHEN** the user starts recording from the comparison section and stops
- **THEN** the captured clip becomes the comparison input, shown with its duration before any run starts

#### Scenario: Existing file

- **WHEN** the user picks an audio file instead
- **THEN** the file becomes the comparison input under the same rules as the recording

#### Scenario: At least two models

- **WHEN** fewer than two models are selected
- **THEN** the run cannot start and the section says why

### Requirement: Sequential runs with timing

The comparison SHALL transcribe the same input on each selected model one after another, loading one model at a time, and SHALL report the wall-clock processing time of every completed run. Runs of one comparison SHALL use identical transcription options so the difference between results is the model, not the settings.

#### Scenario: Order of runs

- **WHEN** a comparison starts on models A, B, C
- **THEN** the runs execute one after another, each reporting progress, and no model is loaded while another runs

#### Scenario: Per-model timing

- **WHEN** a run finishes
- **THEN** the section shows that model's processing time alongside its name

### Requirement: Comparable markdown outputs

Every completed run SHALL write its transcript as a markdown file named for the model into one folder for the comparison, and the section SHALL link to each file so the user can open and compare the texts.

#### Scenario: Files of one comparison

- **WHEN** a comparison of three models finishes
- **THEN** one folder holds three markdown files, each named after its model, and the section lists all three with links

### Requirement: Failure isolation

A run that fails SHALL not abort the remaining runs; the section SHALL show the failed model with the reason, and the runs that succeeded SHALL still produce their markdown files.

#### Scenario: One model fails

- **WHEN** the middle model of three fails to load or transcribe
- **THEN** the third model still runs, two markdown files are written, and the failure is shown with its reason
