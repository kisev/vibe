//! Pure long-form chunk planning.
//!
//! The planner decides which slice of audio each model input receives. It takes
//! the decoded duration, the diarization turns, and the speech ranges VAD found,
//! and returns chunks that stay within the engine's input bound. It performs no
//! I/O and holds no state, so a repeated call with the same inputs produces the
//! same plan.

use serde::{Deserialize, Serialize};

/// Samples per second of the audio the planner works on.
pub const SAMPLE_RATE: f64 = 16_000.0;

/// One diarization result, in seconds.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct DiarSegment {
    pub start: f64,
    pub end: f64,
    pub speaker: u16,
}

/// A planned model input.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Chunk {
    /// Audio sent to the model, including padding.
    pub input_start: f64,
    pub input_end: f64,
    /// Time range the transcript belongs to.
    pub core_start: f64,
    pub core_end: f64,
    /// One speaker, or the union at an uncertain boundary.
    pub speakers: Vec<u16>,
}

/// A whole-recording plan.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Plan {
    pub chunks: Vec<Chunk>,
    pub max_input_seconds: f64,
}

/// Planning knobs. Distances are seconds.
#[derive(Debug, Clone, Copy)]
pub struct Settings {
    /// Engine input bound; no chunk may exceed it.
    pub max_input_seconds: f64,
    /// Length the cut aims for when a turn must be split.
    pub preferred_seconds: f64,
    /// Audio added around the core on both sides.
    pub padding_seconds: f64,
    /// How far inside a pause a cut is placed.
    pub inset_seconds: f64,
    /// Diarization segments closer than this are one turn.
    pub gap_seconds: f64,
    /// A turn shorter than this is folded into its neighbour.
    pub sliver_seconds: f64,
    /// How far around the preferred length a pause is looked for.
    pub search_seconds: f64,
    /// Shortest chunk worth producing.
    pub min_chunk_seconds: f64,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            max_input_seconds: 30.0,
            preferred_seconds: 20.0,
            padding_seconds: 0.3,
            inset_seconds: 0.15,
            gap_seconds: 0.5,
            sliver_seconds: 1.0,
            search_seconds: 3.0,
            min_chunk_seconds: 1.0,
        }
    }
}

impl Settings {
    /// Longest audio range a chunk's core may occupy. A core of exactly the
    /// bound leaves no room for padding; `padded` then clips the padding rather
    /// than the core, so a turn at the bound stays one chunk.
    fn max_core(&self) -> f64 {
        self.max_input_seconds.max(self.min_chunk_seconds)
    }
}

/// A stretch of audio attributed to a fixed set of speakers.
#[derive(Debug, Clone, PartialEq)]
pub struct Turn {
    pub start: f64,
    pub end: f64,
    pub speakers: Vec<u16>,
}

/// Build the chunk plan for a recording.
///
/// `diarization` may be empty: the plan is then built from pauses only and the
/// chunks carry no speakers.
pub fn plan(duration: f64, diarization: &[DiarSegment], speech: &[(f64, f64)], settings: Settings) -> Plan {
    let duration = snap(duration);
    let mut chunks = Vec::new();
    if duration > 0.0 {
        let mut turns = turns(diarization, duration, settings);
        turns.extend(unattributed(speech, &turns, duration));
        turns.sort_by(|a, b| a.start.total_cmp(&b.start));
        turns = absorb_slivers(&mut turns, duration, settings.sliver_seconds);
        let pauses = pauses(speech, duration);
        for (index, turn) in turns.iter().enumerate() {
            let left_limit = if index == 0 {
                0.0
            } else {
                midpoint(turns[index - 1].end, turn.start)
            };
            let right_limit = match turns.get(index + 1) {
                Some(next) => midpoint(turn.end, next.start),
                None => duration,
            };
            for (core_start, core_end) in cores(turn, &pauses, settings) {
                let (input_start, input_end) = padded(core_start, core_end, left_limit, right_limit, duration, settings);
                chunks.push(Chunk {
                    input_start,
                    input_end,
                    core_start,
                    core_end,
                    speakers: turn.speakers.clone(),
                });
            }
        }
    }
    Plan {
        chunks,
        max_input_seconds: settings.max_input_seconds,
    }
}

/// Sweep diarization segments into turns: overlapping or adjacent segments
/// become one turn, and a turn too short to stand alone is folded into the
/// neighbour it is closest to, keeping the union of speakers.
pub fn turns(diarization: &[DiarSegment], duration: f64, settings: Settings) -> Vec<Turn> {
    if diarization.is_empty() {
        return vec![Turn {
            start: 0.0,
            end: snap(duration),
            speakers: Vec::new(),
        }];
    }

    let mut sorted: Vec<DiarSegment> = diarization
        .iter()
        .map(|segment| DiarSegment {
            start: snap(segment.start.max(0.0)),
            end: snap(segment.end.min(duration)),
            speaker: segment.speaker,
        })
        .filter(|segment| segment.end > segment.start)
        .collect();
    sorted.sort_by(|a, b| a.start.total_cmp(&b.start).then(a.speaker.cmp(&b.speaker)));

    let mut merged: Vec<Turn> = Vec::new();
    for segment in sorted {
        match merged.last_mut() {
            Some(turn) if segment.start - turn.end < settings.gap_seconds => {
                turn.end = turn.end.max(segment.end);
                if !turn.speakers.contains(&segment.speaker) {
                    turn.speakers.push(segment.speaker);
                    turn.speakers.sort_unstable();
                }
            }
            _ => merged.push(Turn {
                start: segment.start,
                end: segment.end,
                speakers: vec![segment.speaker],
            }),
        }
    }

    absorb_slivers(&mut merged, duration, settings.sliver_seconds)
}

/// Speech VAD found that no diarization turn covers.
///
/// Diarization misses speech — a speaker past the model's limit, noise it does
/// not classify — and dropping those ranges would silently lose words. They
/// keep their own chunk with no speaker set, so their segments fall back to
/// overlap matching instead of being attributed to a neighbour.
fn unattributed(speech: &[(f64, f64)], turns: &[Turn], duration: f64) -> Vec<Turn> {
    let mut ranges: Vec<(f64, f64)> = speech
        .iter()
        .map(|(start, end)| (snap(start.max(0.0)), snap(end.min(duration))))
        .filter(|(start, end)| end > start)
        .collect();
    ranges.sort_by(|a, b| a.0.total_cmp(&b.0));

    let mut free = Vec::new();
    for (start, end) in ranges {
        let mut cursor = start;
        for turn in turns {
            if turn.end <= cursor {
                continue;
            }
            if turn.start >= end {
                break;
            }
            if turn.start > cursor {
                free.push((cursor, turn.start.min(end)));
            }
            cursor = cursor.max(turn.end);
            if cursor >= end {
                break;
            }
        }
        if cursor < end {
            free.push((cursor, end));
        }
    }

    free.into_iter()
        .map(|(start, end)| Turn {
            start,
            end,
            speakers: Vec::new(),
        })
        .collect()
}

/// Fold every turn shorter than `sliver_seconds` into the nearest neighbour.
fn absorb_slivers(turns: &mut Vec<Turn>, duration: f64, sliver_seconds: f64) -> Vec<Turn> {
    // A recording made only of slivers would collapse to nothing, so keep one.
    while turns.len() > 1 {
        let Some(index) = turns.iter().position(|turn| turn.end - turn.start < sliver_seconds) else {
            break;
        };
        let turn = turns.remove(index);
        let neighbour = if index == 0 {
            0
        } else if index == turns.len() {
            index - 1
        } else {
            let to_previous = turn.start - turns[index - 1].end;
            let to_next = turns[index].start - turn.end;
            if to_previous <= to_next {
                index - 1
            } else {
                index
            }
        };
        let merged = &mut turns[neighbour];
        merged.start = merged.start.min(turn.start);
        merged.end = merged.end.max(turn.end);
        for speaker in turn.speakers {
            if !merged.speakers.contains(&speaker) {
                merged.speakers.push(speaker);
            }
        }
        merged.speakers.sort_unstable();
    }
    turns.iter_mut().for_each(|turn| {
        turn.start = snap(turn.start.clamp(0.0, duration));
        turn.end = snap(turn.end.clamp(0.0, duration));
    });
    std::mem::take(turns)
}

/// The gaps between speech ranges, which is where a cut may land.
pub fn pauses(speech: &[(f64, f64)], duration: f64) -> Vec<(f64, f64)> {
    let mut ranges: Vec<(f64, f64)> = speech
        .iter()
        .map(|(start, end)| (snap(start.max(0.0)), snap(end.min(duration))))
        .filter(|(start, end)| end > start)
        .collect();
    ranges.sort_by(|a, b| a.0.total_cmp(&b.0));

    let mut pauses = Vec::new();
    let mut cursor = 0.0;
    for (start, end) in ranges {
        if start > cursor {
            pauses.push((snap(cursor), snap(start)));
        }
        cursor = cursor.max(end);
    }
    if cursor < duration {
        pauses.push((snap(cursor), snap(duration)));
    }
    pauses
}

/// Split one turn into core ranges, preferring cuts inside pauses near the
/// preferred length and falling back to the bound.
fn cores(turn: &Turn, pauses: &[(f64, f64)], settings: Settings) -> Vec<(f64, f64)> {
    let max_core = settings.max_core();
    let mut cores = Vec::new();
    let mut position = turn.start;
    while turn.end - position > max_core {
        let desired = settings.preferred_seconds.min(max_core);
        let cut = search_cut(position, desired, max_core, pauses, settings).unwrap_or_else(|| position + max_core);
        cores.push((snap(position), snap(cut)));
        position = cut;
    }
    if turn.end > position {
        cores.push((snap(position), snap(turn.end)));
    }
    cores
}

/// Find a cut inside a pause within the search window, closest to the desired
/// length. The cut stays `inset_seconds` away from the pause edges.
fn search_cut(position: f64, desired: f64, max_core: f64, pauses: &[(f64, f64)], settings: Settings) -> Option<f64> {
    let target = position + desired;
    let window_start = position + settings.min_chunk_seconds;
    let window_end = position + max_core;
    let mut best: Option<(f64, f64)> = None;
    for (start, end) in pauses {
        let low = (*start + settings.inset_seconds).max(window_start);
        let high = (*end - settings.inset_seconds).min(window_end);
        if high < low {
            continue;
        }
        let cut = target.clamp(low, high);
        let distance = (cut - target).abs();
        // A pause too far from the preferred length is not worth cutting in: the
        // bound is a better fallback than a chunk far shorter or longer than asked.
        if distance > settings.search_seconds {
            continue;
        }
        if best.is_none_or(|(best_distance, _)| distance < best_distance) {
            best = Some((distance, cut));
        }
    }
    best.map(|(_, cut)| snap(cut))
}

/// Expand a core range by the padding, clamped to the room the neighbours allow
/// and to the engine bound.
fn padded(core_start: f64, core_end: f64, left_limit: f64, right_limit: f64, duration: f64, settings: Settings) -> (f64, f64) {
    let mut start = (core_start - settings.padding_seconds).max(left_limit).max(0.0);
    let mut end = (core_end + settings.padding_seconds).min(right_limit).min(duration);
    if end - start > settings.max_input_seconds {
        // Shave the padding rather than the core: the transcript belongs to the
        // core, so it is the last thing to give up.
        let core_mid = (core_start + core_end) / 2.0;
        start = core_mid - settings.max_input_seconds / 2.0;
        end = start + settings.max_input_seconds;
    }
    (snap(start.max(0.0)), snap(end.min(duration)))
}

fn midpoint(a: f64, b: f64) -> f64 {
    snap((a + b) / 2.0)
}

/// Round a time to a whole sample so plans compare exactly.
fn snap(seconds: f64) -> f64 {
    (seconds * SAMPLE_RATE).round() / SAMPLE_RATE
}

#[cfg(test)]
mod tests {
    use super::*;

    const MINUTE: f64 = 60.0;

    fn settings(max_input: f64) -> Settings {
        Settings {
            max_input_seconds: max_input,
            ..Settings::default()
        }
    }

    fn speech(start: f64, end: f64) -> (f64, f64) {
        (start, end)
    }

    #[test]
    fn empty_audio_plans_nothing() {
        let plan = plan(0.0, &[], &[], settings(30.0));
        assert!(plan.chunks.is_empty());
        assert_eq!(plan.max_input_seconds, 30.0);
    }

    #[test]
    fn a_single_short_turn_is_one_chunk() {
        let diarization = [DiarSegment {
            start: 1.0,
            end: 5.0,
            speaker: 1,
        }];
        let plan = plan(10.0, &diarization, &[speech(1.0, 5.0)], settings(30.0));
        assert_eq!(plan.chunks.len(), 1);
        let chunk = &plan.chunks[0];
        assert_eq!(chunk.speakers, vec![1]);
        assert_eq!(chunk.core_start, 1.0);
        assert_eq!(chunk.core_end, 5.0);
        assert!(chunk.input_start <= 1.0 && chunk.input_end >= 5.0);
        assert!(chunk.input_end - chunk.input_start <= 30.0);
    }

    #[test]
    fn speech_diarization_missed_becomes_a_chunk_without_speakers() {
        let diarization = [
            DiarSegment {
                start: 0.0,
                end: 4.0,
                speaker: 1,
            },
            DiarSegment {
                start: 10.0,
                end: 14.0,
                speaker: 2,
            },
        ];
        // VAD hears speech between the two turns that diarization did not label.
        let speech = [speech(0.0, 4.0), speech(5.0, 9.0), speech(10.0, 14.0)];
        let plan = plan(14.0, &diarization, &speech, settings(30.0));

        assert_eq!(plan.chunks.len(), 3, "every speech range keeps a chunk");
        assert_eq!(plan.chunks[0].speakers, vec![1]);
        assert!(plan.chunks[1].speakers.is_empty(), "the missed range stays unattributed");
        assert_eq!((plan.chunks[1].core_start, plan.chunks[1].core_end), (5.0, 9.0));
        assert_eq!(plan.chunks[2].speakers, vec![2]);
    }

    #[test]
    fn a_gap_without_speech_produces_no_chunk() {
        let diarization = [
            DiarSegment {
                start: 0.0,
                end: 4.0,
                speaker: 1,
            },
            DiarSegment {
                start: 10.0,
                end: 14.0,
                speaker: 2,
            },
        ];
        // VAD hears nothing between the turns, so the silence is not planned.
        let speech = [speech(0.0, 4.0), speech(10.0, 14.0)];
        let plan = plan(14.0, &diarization, &speech, settings(30.0));

        assert_eq!(plan.chunks.len(), 2);
        assert_eq!(plan.chunks[0].speakers, vec![1]);
        assert_eq!(plan.chunks[1].speakers, vec![2]);
    }

    #[test]
    fn a_turn_exactly_at_the_bound_is_not_split() {
        let diarization = [DiarSegment {
            start: 0.0,
            end: 30.0,
            speaker: 1,
        }];
        let plan = plan(30.0, &diarization, &[speech(0.0, 30.0)], settings(30.0));
        assert_eq!(plan.chunks.len(), 1);
        assert!(plan.chunks[0].input_end - plan.chunks[0].input_start <= 30.0);
    }

    #[test]
    fn overlapping_speakers_form_a_union_turn() {
        let diarization = [
            DiarSegment {
                start: 0.0,
                end: 10.0,
                speaker: 1,
            },
            DiarSegment {
                start: 8.0,
                end: 20.0,
                speaker: 2,
            },
        ];
        let turns = turns(&diarization, 20.0, settings(30.0));
        assert_eq!(turns.len(), 1);
        assert_eq!(turns[0].speakers, vec![1, 2]);
    }

    #[test]
    fn adjacent_turns_merge() {
        let diarization = [
            DiarSegment {
                start: 0.0,
                end: 10.0,
                speaker: 1,
            },
            DiarSegment {
                start: 10.2,
                end: 20.0,
                speaker: 2,
            },
        ];
        let turns = turns(&diarization, 20.0, settings(30.0));
        assert_eq!(turns.len(), 1, "a gap under the threshold is one turn");
        assert_eq!(turns[0].speakers, vec![1, 2]);
    }

    #[test]
    fn distant_turns_stay_separate() {
        let diarization = [
            DiarSegment {
                start: 0.0,
                end: 10.0,
                speaker: 1,
            },
            DiarSegment {
                start: 12.0,
                end: 20.0,
                speaker: 2,
            },
        ];
        let turns = turns(&diarization, 20.0, settings(30.0));
        assert_eq!(turns.len(), 2);
        assert_eq!(turns[0].speakers, vec![1]);
        assert_eq!(turns[1].speakers, vec![2]);
    }

    #[test]
    fn a_sliver_is_absorbed_into_its_neighbour() {
        let diarization = [
            DiarSegment {
                start: 0.0,
                end: 10.0,
                speaker: 1,
            },
            DiarSegment {
                start: 10.1,
                end: 10.5,
                speaker: 2,
            },
            DiarSegment {
                start: 12.0,
                end: 20.0,
                speaker: 3,
            },
        ];
        let turns = turns(&diarization, 20.0, settings(30.0));
        assert_eq!(turns.len(), 2, "the 400 ms turn must not stand alone");
        assert_eq!(turns[0].speakers, vec![1, 2]);
        assert_eq!(turns[1].speakers, vec![3]);
    }

    #[test]
    fn pauses_tile_the_non_speech() {
        let pauses = pauses(&[speech(10.0, 20.0), speech(30.0, 40.0)], 50.0);
        assert_eq!(pauses, vec![(0.0, 10.0), (20.0, 30.0), (40.0, 50.0)]);
    }

    #[test]
    fn no_vad_produces_fixed_size_chunks() {
        let plan = plan(75.0, &[], &[], settings(30.0));
        assert!(!plan.chunks.is_empty());
        for chunk in &plan.chunks {
            assert!(chunk.input_end - chunk.input_start <= 30.0);
            assert!(chunk.speakers.is_empty());
        }
        // Every sample of the recording is covered exactly once.
        assert_eq!(plan.chunks.first().unwrap().core_start, 0.0);
        assert!((plan.chunks.last().unwrap().core_end - 75.0).abs() < 0.001);
    }

    #[test]
    fn no_chunk_exceeds_the_engine_bound() {
        let diarization: Vec<_> = (0..6)
            .map(|i| DiarSegment {
                start: i as f64 * 600.0,
                end: (i + 1) as f64 * 600.0,
                speaker: (i % 2) as u16 + 1,
            })
            .collect();
        let plan = plan(3600.0, &diarization, &[speech(0.0, 3600.0)], settings(25.0));
        assert!(!plan.chunks.is_empty());
        for chunk in &plan.chunks {
            assert!(
                chunk.input_end - chunk.input_start <= 25.0 + 1e-9,
                "chunk {:?} exceeds the bound",
                chunk
            );
        }
    }

    #[test]
    fn a_smaller_bound_is_respected() {
        let plan = plan(120.0, &[], &[speech(0.0, 120.0)], settings(12.0));
        for chunk in &plan.chunks {
            assert!(chunk.input_end - chunk.input_start <= 12.0 + 1e-9);
        }
    }

    #[test]
    fn a_pause_near_the_target_is_preferred() {
        // One 60-second turn with a pause at about 19.5-20.5 seconds.
        let diarization = [DiarSegment {
            start: 0.0,
            end: 60.0,
            speaker: 1,
        }];
        let speech = [speech(0.0, 19.5), speech(20.5, 60.0)];
        let plan = plan(60.0, &diarization, &speech, settings(30.0));
        let cut = plan.chunks[0].core_end;
        assert!((19.5..=20.5).contains(&cut), "cut {cut} should land in the pause");
    }

    #[test]
    fn uninterrupted_speech_cuts_at_the_bound() {
        let diarization = [DiarSegment {
            start: 0.0,
            end: 60.0,
            speaker: 1,
        }];
        let plan = plan(60.0, &diarization, &[speech(0.0, 60.0)], settings(30.0));
        assert!(plan.chunks.len() >= 2);
        assert!((plan.chunks[0].core_end - 30.0).abs() < 0.001);
    }

    #[test]
    fn planning_an_hour_costs_milliseconds() {
        // An hour of alternating speakers, cut by pauses every few seconds.
        let diarization: Vec<_> = (0..120)
            .map(|i| DiarSegment {
                start: i as f64 * 30.0,
                end: (i + 1) as f64 * 30.0,
                speaker: (i % 2) as u16 + 1,
            })
            .collect();
        let speech: Vec<_> = (0..720).map(|i| (i as f64 * 5.0, i as f64 * 5.0 + 4.5)).collect();
        let started = std::time::Instant::now();
        let plan = plan(3600.0, &diarization, &speech, settings(25.0));
        let elapsed = started.elapsed();
        assert!(!plan.chunks.is_empty());
        assert!(
            elapsed < std::time::Duration::from_millis(50),
            "planning took {elapsed:?}, far more than arithmetic should"
        );
    }

    #[test]
    fn the_same_inputs_produce_the_same_plan() {
        let diarization = [
            DiarSegment {
                start: 0.0,
                end: 40.0,
                speaker: 1,
            },
            DiarSegment {
                start: 40.0,
                end: 90.0,
                speaker: 2,
            },
        ];
        let speech = [speech(0.0, 39.0), speech(41.0, 90.0)];
        let first = plan(90.0, &diarization, &speech, settings(25.0));
        let second = plan(90.0, &diarization, &speech, settings(25.0));
        assert_eq!(first, second);
    }
}
