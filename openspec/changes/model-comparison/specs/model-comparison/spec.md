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

The comparison SHALL transcribe the same input on each selected model one after another, loading one model at a time, and SHALL report the wall-clock processing time of every completed run. Runs of one comparison SHALL use identical transcription options — the language preference, the bundled VAD model for engines that cannot plan their input without one, and the same speaker separation when the user enabled it — so the difference between results is the model, not the settings.

#### Scenario: Order of runs

- **WHEN** a comparison starts on models A, B, C
- **THEN** the runs execute one after another, each reporting progress, and no model is loaded while another runs

#### Scenario: Per-model timing

- **WHEN** a run finishes
- **THEN** the section shows that model's processing time alongside its name

#### Scenario: An engine that requires VAD

- **WHEN** a selected model's engine cannot plan its input without a VAD model
- **THEN** its run supplies the bundled VAD model and completes, while engines that do not require one run with the plain options

#### Scenario: Speaker separation

- **WHEN** the separate diarization model is installed, usable, and the section's speaker-separation switch is on
- **THEN** every run of the comparison passes that model and its transcript lines carry the speaker, and when the switch is off or the model is missing every run is plain transcription

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

### Requirement: Side-by-side results

After a comparison, the section SHALL offer a results surface that covers the application window and shows, for each completed model, its transcript and wall-clock processing time side by side, with the markdown file written for it reachable from its column. The surface SHALL let the user choose a baseline run and SHALL highlight word-level differences between the baseline and every other transcript, and SHALL remain readable with the highlighting off.

#### Scenario: Results after a run

- **WHEN** a comparison finishes
- **THEN** a "Compare results" action opens the full-window surface with one column per completed model

#### Scenario: Difference highlighting

- **WHEN** highlighting is on
- **THEN** words the model missed relative to the baseline are struck out and its extra words are highlighted, and choosing another baseline recomputes the differences

#### Scenario: Files

- **WHEN** a result column is shown
- **THEN** the markdown file written for that model can be revealed from the column

### Requirement: Readable results surface

The results surface SHALL keep each column's transcript in its own scroll region so a long text never displaces the header or collapses another column, SHALL state each non-baseline column's added and removed word counts, and SHALL place the close control so it overlaps no other control.

#### Scenario: Long transcript

- **WHEN** a transcript is taller than the window
- **THEN** that column scrolls on its own and the header stays in place

#### Scenario: Difference counts

- **WHEN** a column differs from the baseline
- **THEN** the column states how many words it added and how many it missed

#### Scenario: Close control

- **WHEN** the surface is shown
- **THEN** the close control sits clear of the baseline selector and the highlight switch
