# model-comparison Specification

## Purpose

Users pick a model on their own audio, not on borrowed benchmarks: the models page runs the same short input through the selected models one by one and leaves comparable markdown transcripts with the processing time of each run, with every selected model accounted for even when its run fails.

## Requirements

### Requirement: A failed run is shown, not dropped

The comparison results SHALL render one column per selected model, including models whose run failed, showing the failure reason in place of the transcript. The baseline picker SHALL offer only successful runs.

#### Scenario: The third of three models fails

- **WHEN** three models are selected and the third fails
- **THEN** the results window shows three columns, the third carrying its error, and the baseline picker lists the two successful models

#### Scenario: All models fail

- **WHEN** every run fails
- **THEN** the results window says so and offers no baseline
