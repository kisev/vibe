//! Attributes transcript segments to diarization speaker turns, splitting on
//! word timings.
//!
//! A recognizer segment can run across several speakers (unpunctuated
//! stretches lack a sentence boundary), so a segment carrying word rows is
//! split wherever the speaker changes; each run is attributed the speaker
//! whose turn its words overlap. Without word rows the whole segment takes
//! the speaker it overlaps most — the overlap matcher `format::match_speaker`
//! already provided, which stays the fallback at every level here.
//!
//! Ported from upstream's speakers.rs for the unified-engine result types.

use crate::engine::Segment;
use crate::server::diarization;
use crate::server::format::{cs_to_seconds, match_speaker};

/// A run of one speaker within a segment, in centiseconds like [`Segment`].
#[derive(Debug, Clone, PartialEq)]
pub struct Run {
    pub start: i64,
    pub end: i64,
    pub text: String,
    pub speaker: Option<usize>,
}

/// Splits `segment` into one [`Run`] per stretch of the same speaker. A
/// segment without word rows, or a request without diarization turns, comes
/// back whole — attributed by overlap in the second case, untouched in the
/// first.
pub fn attribute(segment: &Segment, turns: &[diarization::Segment]) -> Vec<Run> {
    let whole = |speaker: Option<usize>| Run {
        start: segment.start,
        end: segment.end,
        text: segment.text.clone(),
        speaker,
    };
    if turns.is_empty() {
        return vec![whole(None)];
    }
    if segment.words.is_empty() {
        return vec![whole(match_speaker(
            cs_to_seconds(segment.start),
            cs_to_seconds(segment.end),
            turns,
        ))];
    }

    // A word nobody claims (a gap in the diarization) between two attributed
    // words continues the run before it. At either end of the segment it stays
    // unassigned, as a whole segment that far from every turn does.
    let mut speakers = segment
        .words
        .iter()
        .map(|word| match_speaker(cs_to_seconds(word.start), cs_to_seconds(word.end), turns))
        .collect::<Vec<_>>();
    let first_known = speakers.iter().position(Option::is_some);
    let last_known = speakers.iter().rposition(Option::is_some);
    if let (Some(first), Some(last)) = (first_known, last_known) {
        for index in first + 1..last {
            if speakers[index].is_none() {
                speakers[index] = speakers[index - 1];
            }
        }
    }

    let mut runs: Vec<Run> = Vec::new();
    for (word, speaker) in segment.words.iter().zip(speakers) {
        match runs.last_mut() {
            Some(run) if run.speaker == speaker => {
                run.end = word.end;
                run.text.push_str(&word.text);
            }
            _ => runs.push(Run {
                start: word.start,
                end: word.end,
                text: word.text.clone(),
                speaker,
            }),
        }
    }
    // The segment's own bounds frame the speech; word timings sit inside them.
    if let Some(first) = runs.first_mut() {
        first.start = first.start.min(segment.start);
    }
    if let Some(last) = runs.last_mut() {
        last.end = last.end.max(segment.end);
    }
    for run in &mut runs {
        run.text = run.text.trim().to_owned();
    }
    runs.retain(|run| !run.text.is_empty());
    if runs.is_empty() {
        return vec![whole(match_speaker(
            cs_to_seconds(segment.start),
            cs_to_seconds(segment.end),
            turns,
        ))];
    }
    runs
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::Word;

    fn turn(start: f64, end: f64, speaker_id: usize) -> diarization::Segment {
        diarization::Segment { start, end, speaker_id }
    }

    fn word(start: i64, end: i64, text: &str) -> Word {
        Word {
            start,
            end,
            text: text.to_owned(),
        }
    }

    fn segment(start: i64, end: i64, text: &str, words: Vec<Word>) -> Segment {
        Segment {
            start,
            end,
            text: text.into(),
            words,
            ..Default::default()
        }
    }

    #[test]
    fn without_turns_the_segment_comes_back_whole_and_unattributed() {
        let segment = segment(0, 500, "привет как дела", vec![]);
        assert_eq!(
            attribute(&segment, &[]),
            vec![Run {
                start: 0,
                end: 500,
                text: "привет как дела".into(),
                speaker: None
            }]
        );
    }

    #[test]
    fn without_word_rows_the_whole_segment_takes_the_overlapping_speaker() {
        let segment = segment(0, 200, "привет", vec![]);
        let turns = [turn(0.0, 2.0, 3)];
        assert_eq!(
            attribute(&segment, &turns),
            vec![Run {
                start: 0,
                end: 200,
                text: "привет".into(),
                speaker: Some(3),
            }]
        );
    }

    #[test]
    fn a_speaker_change_inside_a_segment_splits_it() {
        let words = vec![word(0, 100, "привет "), word(100, 200, "пока ")];
        let segment = segment(0, 200, "привет пока", words);
        let turns = [turn(0.0, 1.0, 0), turn(1.0, 2.0, 1)];
        let runs = attribute(&segment, &turns);
        assert_eq!(
            runs,
            vec![
                Run {
                    start: 0,
                    end: 100,
                    text: "привет".into(),
                    speaker: Some(0)
                },
                Run {
                    start: 100,
                    end: 200,
                    text: "пока".into(),
                    speaker: Some(1)
                },
            ]
        );
    }

    #[test]
    fn an_unclaimed_word_between_attributed_words_continues_the_earlier_run() {
        // Speaker 1 talks 0–1 s, nobody claims 1–2 s, speaker 2 talks 2–3 s.
        let words = vec![word(0, 100, "привет "), word(100, 200, "эээ "), word(200, 300, "пока ")];
        let segment = segment(0, 300, "привет эээ пока", words);
        let turns = [turn(0.0, 1.0, 0), turn(2.0, 3.0, 1)];
        let runs = attribute(&segment, &turns);
        assert_eq!(
            runs,
            vec![
                Run {
                    start: 0,
                    end: 200,
                    text: "привет эээ".into(),
                    speaker: Some(0)
                },
                Run {
                    start: 200,
                    end: 300,
                    text: "пока".into(),
                    speaker: Some(1)
                },
            ]
        );
    }

    #[test]
    fn the_segment_bounds_frame_the_word_runs() {
        let words = vec![word(50, 100, "привет ")];
        let segment = segment(0, 200, "привет", words);
        let turns = [turn(0.5, 1.0, 0)];
        let runs = attribute(&segment, &turns);
        assert_eq!(runs[0].start, 0);
        assert_eq!(runs[0].end, 200);
    }

    #[test]
    fn only_whitespace_runs_leave_one_overlap_attributed_row() {
        let words = vec![word(0, 100, "  ")];
        let segment = segment(0, 100, "привет", words);
        let turns = [turn(0.0, 1.0, 2)];
        assert_eq!(
            attribute(&segment, &turns),
            vec![Run {
                start: 0,
                end: 100,
                text: "привет".into(),
                speaker: Some(2),
            }]
        );
    }
}
