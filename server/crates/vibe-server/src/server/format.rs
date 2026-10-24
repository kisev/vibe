use serde::Serialize;
use whisper_rs::{Segment, TranscribeResult};

use crate::server::diarization;

pub fn cs_to_seconds(cs: i64) -> f64 {
    cs as f64 / 100.0
}

fn cs_to_srt_time(cs: i64) -> String {
    let mut ms = cs * 10;
    let mut s = ms / 1000;
    ms %= 1000;
    let mut m = s / 60;
    s %= 60;
    let h = m / 60;
    m %= 60;
    format!("{h:02}:{m:02}:{s:02},{ms:03}")
}

pub(crate) fn cs_to_vtt_time(cs: i64) -> String {
    cs_to_srt_time(cs).replace(',', ".")
}

pub fn format_srt(segments: &[Segment]) -> String {
    let mut out = String::new();
    for (index, segment) in segments.iter().enumerate() {
        if index > 0 {
            out.push('\n');
        }
        out.push_str(&format!(
            "{}\n{} --> {}\n{}\n",
            index + 1,
            cs_to_srt_time(segment.start),
            cs_to_srt_time(segment.end),
            segment.text.trim()
        ));
    }
    out
}

pub fn format_vtt(segments: &[Segment]) -> String {
    let mut out = String::from("WEBVTT\n\n");
    for (index, segment) in segments.iter().enumerate() {
        if index > 0 {
            out.push('\n');
        }
        out.push_str(&format!(
            "{} --> {}\n{}\n",
            cs_to_vtt_time(segment.start),
            cs_to_vtt_time(segment.end),
            segment.text.trim()
        ));
    }
    out
}

fn speaker_label(speaker_id: usize) -> String {
    format!("Speaker {}", speaker_id + 1)
}

/// Markdown transcript with one timestamped block per segment. Speaker labels
/// are included only when diarization produced one for that segment.
pub fn format_markdown(segments: &[Segment], diar_segments: &[diarization::Segment]) -> String {
    let mut out = String::from("# Transcript\n\n");
    for segment in segments {
        let start = cs_to_seconds(segment.start);
        let end = cs_to_seconds(segment.end);
        let speaker = match_speaker(start, end, diar_segments);
        out.push_str("**[");
        out.push_str(&cs_to_vtt_time(segment.start));
        out.push_str(" --> ");
        out.push_str(&cs_to_vtt_time(segment.end));
        out.push(']');
        if let Some(speaker) = speaker {
            out.push(' ');
            out.push_str(&speaker_label(speaker));
        }
        out.push_str("**\n\n");
        out.push_str(segment.text.trim());
        out.push_str("\n\n");
    }
    out
}

/// The JSON document, carrying the chunk speaker sets when a plan produced them.
pub fn format_json(
    result: &TranscribeResult,
    diar_segments: &[diarization::Segment],
    plan: Option<&crate::plan::Plan>,
) -> String {
    serde_json::to_string_pretty(&build_verbose_json(result, diar_segments, plan)).unwrap_or_else(|_| "{}".into())
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct VerboseJson {
    pub text: String,
    pub segments: Vec<VerboseSegment>,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub struct VerboseSegment {
    pub start: f64,
    pub end: f64,
    pub text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speaker: Option<usize>,
    /// Present only when the chunk plan supplied the speakers; a boundary chunk
    /// carries more than one id.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speakers: Option<Vec<u16>>,
    pub no_speech_prob: f32,
}

pub fn build_verbose_json(
    result: &TranscribeResult,
    diar_segments: &[diarization::Segment],
    plan: Option<&crate::plan::Plan>,
) -> VerboseJson {
    VerboseJson {
        text: result.text(),
        segments: result
            .segments
            .iter()
            .map(|segment| {
                let start = cs_to_seconds(segment.start);
                let end = cs_to_seconds(segment.end);
                let planned = plan
                    .and_then(|plan| planned_chunk(plan, start, end))
                    .filter(|chunk| !chunk.speakers.is_empty());
                VerboseSegment {
                    start,
                    end,
                    text: segment.text.clone(),
                    speaker: planned.map_or_else(
                        || match_speaker(start, end, diar_segments),
                        |chunk| dominant_speaker(chunk, diar_segments).map(usize::from),
                    ),
                    speakers: planned.map(|chunk| chunk.speakers.clone()),
                    no_speech_prob: segment.no_speech_prob,
                }
            })
            .collect(),
    }
}

/// The planned chunk a segment belongs to: the one whose core holds its middle,
/// else the nearest one, so a segment that overhangs a boundary still reports
/// the speakers of the input it came from.
pub fn planned_chunk(plan: &crate::plan::Plan, start: f64, end: f64) -> Option<&crate::plan::Chunk> {
    let middle = (start + end) / 2.0;
    plan.chunks
        .iter()
        .find(|chunk| middle >= chunk.core_start && middle <= chunk.core_end)
        .or_else(|| {
            plan.chunks
                .iter()
                .min_by(|a, b| distance(a, middle).total_cmp(&distance(b, middle)))
        })
}

/// The chunk's most likely speaker: the id whose diarization turns cover the
/// most of its core. Ties and chunks with nothing to measure fall back to the
/// lowest id, so the singular field is always one of the reported set.
pub fn dominant_speaker(chunk: &crate::plan::Chunk, diarization: &[diarization::Segment]) -> Option<u16> {
    let mut covered: Vec<(u16, f64)> = Vec::new();
    for segment in diarization {
        let Ok(speaker) = u16::try_from(segment.speaker_id) else {
            continue;
        };
        if !chunk.speakers.contains(&speaker) {
            continue;
        }
        let overlap = segment.end.min(chunk.core_end) - segment.start.max(chunk.core_start);
        if overlap <= 0.0 {
            continue;
        }
        match covered.iter_mut().find(|(id, _)| *id == speaker) {
            Some((_, total)) => *total += overlap,
            None => covered.push((speaker, overlap)),
        }
    }
    let best = covered
        .into_iter()
        .max_by(|(left_id, left), (right_id, right)| left.total_cmp(right).then(right_id.cmp(left_id)));
    best.map_or_else(|| chunk.speakers.iter().copied().min(), |(id, _)| Some(id))
}

fn distance(chunk: &crate::plan::Chunk, point: f64) -> f64 {
    if point < chunk.core_start {
        chunk.core_start - point
    } else if point > chunk.core_end {
        point - chunk.core_end
    } else {
        0.0
    }
}

/// How far (seconds) a transcript segment may sit from the nearest speaker turn and
/// still be attributed to it. Diarization drops short, quiet utterances ("you know,")
/// that the recognizer kept, and a line with no speaker cannot be exported, renamed
/// or filtered like the others.
const NEAREST_TURN_TOLERANCE_SECS: f64 = 1.5;

pub fn match_speaker(start: f64, end: f64, diar_segments: &[diarization::Segment]) -> Option<usize> {
    let mut best_id = None;
    let mut best_overlap = 0.0;
    let mut nearest = None;
    let mut nearest_gap = f64::INFINITY;
    for segment in diar_segments {
        let overlap = segment.end.min(end) - segment.start.max(start);
        if overlap > best_overlap {
            best_overlap = overlap;
            best_id = Some(segment.speaker_id);
        }
        let gap = (segment.start - end).max(start - segment.end);
        if gap < nearest_gap {
            nearest_gap = gap;
            nearest = Some(segment.speaker_id);
        }
    }
    if best_id.is_some() {
        return best_id;
    }
    (nearest_gap <= NEAREST_TURN_TOLERANCE_SECS).then_some(nearest).flatten()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn turn(start: f64, end: f64, speaker_id: usize) -> diarization::Segment {
        diarization::Segment { start, end, speaker_id }
    }

    #[test]
    fn markdown_labels_speakers_and_times() {
        let segments = [Segment {
            start: 100,
            end: 250,
            text: "привет".into(),
            no_speech_prob: 0.0,
        }];
        let turns = [turn(0.5, 3.0, 0)];
        let markdown = format_markdown(&segments, &turns);
        assert!(markdown.contains("**[00:00:01.000 --> 00:00:02.500] Speaker 1**"));
        assert!(markdown.contains("привет"));
    }

    fn segment(start: i64, end: i64, text: &str) -> Segment {
        Segment {
            start,
            end,
            text: text.into(),
            no_speech_prob: 0.25,
        }
    }

    fn result(segments: Vec<Segment>) -> TranscribeResult {
        TranscribeResult { segments }
    }

    #[test]
    fn markdown_has_text_and_timestamps_without_diarization() {
        let markdown = format_markdown(&[segment(100, 250, "привет")], &[]);
        assert!(markdown.starts_with("# Transcript\n\n"));
        assert!(markdown.contains("**[00:00:01.000 --> 00:00:02.500]**"));
        assert!(markdown.contains("привет"));
        assert!(!markdown.contains("Speaker"));
    }

    #[test]
    fn markdown_with_empty_segments_is_just_the_heading() {
        assert_eq!(format_markdown(&[], &[]), "# Transcript\n\n");
    }

    #[test]
    fn markdown_carries_synthetic_speaker_labels() {
        let segments = [segment(100, 250, "привет"), segment(300, 400, "пока")];
        let turns = [turn(1.0, 2.5, 1), turn(3.0, 4.0, 0)];
        let markdown = format_markdown(&segments, &turns);
        assert!(markdown.contains("**[00:00:01.000 --> 00:00:02.500] Speaker 2**"));
        assert!(markdown.contains("**[00:00:03.000 --> 00:00:04.000] Speaker 1**"));
    }

    #[test]
    fn json_has_text_segments_and_timestamps_without_diarization() {
        let json = format_json(&result(vec![segment(100, 250, "привет")]), &[], None);
        let value: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(value["text"], "привет");
        let segments = value["segments"].as_array().unwrap();
        assert_eq!(segments.len(), 1);
        assert_eq!(segments[0]["start"], 1.0);
        assert_eq!(segments[0]["end"], 2.5);
        assert_eq!(segments[0]["text"], "привет");
        assert_eq!(segments[0]["no_speech_prob"], 0.25);
        assert!(segments[0].get("speaker").is_none());
    }

    #[test]
    fn json_carries_synthetic_speaker_labels() {
        let segments = [segment(100, 250, "привет"), segment(300, 400, "пока")];
        let turns = [turn(1.0, 2.5, 1), turn(3.0, 4.0, 0)];
        let json = format_json(&result(segments.to_vec()), &turns, None);
        let value: serde_json::Value = serde_json::from_str(&json).unwrap();
        let segments = value["segments"].as_array().unwrap();
        assert_eq!(segments[0]["speaker"], 1);
        assert_eq!(segments[1]["speaker"], 0);
    }

    #[test]
    fn json_with_empty_segments_is_an_empty_document() {
        let json = format_json(&result(vec![]), &[], None);
        let value: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(value["text"], "");
        assert_eq!(value["segments"].as_array().unwrap().len(), 0);
    }

    #[test]
    fn overlap_wins_over_proximity() {
        let turns = [turn(0.0, 10.0, 0), turn(10.0, 20.0, 1)];
        assert_eq!(match_speaker(9.0, 12.5, &turns), Some(1));
        assert_eq!(match_speaker(2.0, 4.0, &turns), Some(0));
    }

    #[test]
    fn a_line_in_a_gap_takes_the_nearest_turn() {
        let turns = [turn(0.0, 10.0, 0), turn(12.0, 20.0, 1)];
        assert_eq!(match_speaker(10.2, 10.8, &turns), Some(0));
        assert_eq!(match_speaker(11.4, 11.9, &turns), Some(1));
    }

    #[test]
    fn a_line_far_from_any_turn_stays_unassigned() {
        let turns = [turn(0.0, 10.0, 0)];
        assert_eq!(match_speaker(12.0, 13.0, &turns), None);
        assert_eq!(match_speaker(1.0, 2.0, &[]), None);
    }

    #[test]
    fn srt_writes_one_indexed_cue_per_segment() {
        let segments = [segment(100, 250, "привет"), segment(300, 400, "пока")];
        assert_eq!(
            format_srt(&segments),
            "1\n00:00:01,000 --> 00:00:02,500\nпривет\n\n2\n00:00:03,000 --> 00:00:04,000\nпока\n"
        );
    }

    #[test]
    fn vtt_writes_a_header_and_a_blank_line_between_cues() {
        let segments = [segment(100, 250, "привет"), segment(300, 400, "пока")];
        assert_eq!(
            format_vtt(&segments),
            "WEBVTT\n\n00:00:01.000 --> 00:00:02.500\nпривет\n\n00:00:03.000 --> 00:00:04.000\nпока\n"
        );
    }

    #[test]
    fn srt_uses_a_comma_and_vtt_a_dot_in_timestamps() {
        let segments = [segment(110, 370, "привет")];
        assert!(format_srt(&segments).contains("00:00:01,100 --> 00:00:03,700"));
        assert!(format_vtt(&segments).contains("00:00:01.100 --> 00:00:03.700"));
    }

    #[test]
    fn srt_with_empty_segments_is_an_empty_string() {
        assert_eq!(format_srt(&[]), "");
    }

    #[test]
    fn vtt_with_empty_segments_is_just_the_header() {
        assert_eq!(format_vtt(&[]), "WEBVTT\n\n");
    }
}

#[cfg(test)]
mod planner_tests {
    use super::*;
    use crate::plan::{Chunk, Plan};

    fn segment(start: i64, end: i64) -> Segment {
        Segment {
            start,
            end,
            text: "hello".to_string(),
            no_speech_prob: 0.0,
        }
    }

    fn turn(start: f64, end: f64, speaker_id: usize) -> diarization::Segment {
        diarization::Segment { start, end, speaker_id }
    }

    fn plan() -> Plan {
        Plan {
            chunks: vec![
                Chunk {
                    input_start: 0.0,
                    input_end: 10.0,
                    core_start: 0.0,
                    core_end: 10.0,
                    speakers: vec![1],
                },
                Chunk {
                    input_start: 10.0,
                    input_end: 20.0,
                    core_start: 10.0,
                    core_end: 20.0,
                    speakers: vec![1, 2],
                },
            ],
            max_input_seconds: 25.0,
        }
    }

    fn result() -> TranscribeResult {
        TranscribeResult {
            segments: vec![segment(100, 200), segment(1500, 1900)],
        }
    }

    #[test]
    fn each_segment_carries_its_chunk_speakers() {
        let plan = plan();
        let result = result();
        let sets: Vec<_> = result
            .segments
            .iter()
            .map(|segment| {
                planned_chunk(&plan, cs_to_seconds(segment.start), cs_to_seconds(segment.end))
                    .map_or_else(Vec::new, |chunk| chunk.speakers.clone())
            })
            .collect();
        assert_eq!(sets, vec![vec![1], vec![1, 2]]);
    }

    #[test]
    fn verbose_json_reports_the_union_for_a_boundary_chunk() {
        let result = result();
        let json = build_verbose_json(&result, &[], Some(&plan()));
        assert_eq!(json.segments[0].speaker, Some(1));
        assert_eq!(json.segments[0].speakers, Some(vec![1]));
        assert_eq!(json.segments[1].speaker, Some(1));
        assert_eq!(json.segments[1].speakers, Some(vec![1, 2]));
    }

    #[test]
    fn a_boundary_chunk_names_the_speaker_who_covers_most_of_it() {
        let result = result();
        // Inside the 10-20 s chunk speaker 2 talks for four seconds, speaker 1 for one.
        let diar = [turn(10.0, 11.0, 1), turn(14.0, 19.0, 2)];
        let json = build_verbose_json(&result, &diar, Some(&plan()));
        assert_eq!(json.segments[1].speaker, Some(2));
        assert_eq!(json.segments[1].speakers, Some(vec![1, 2]));
        // The single-speaker chunk is unaffected.
        assert_eq!(json.segments[0].speaker, Some(1));
    }

    #[test]
    fn equal_coverage_reports_the_lower_id() {
        let result = result();
        let diar = [turn(10.0, 12.0, 2), turn(12.0, 14.0, 1)];
        let json = build_verbose_json(&result, &diar, Some(&plan()));
        assert_eq!(json.segments[1].speaker, Some(1));
        assert_eq!(json.segments[1].speakers, Some(vec![1, 2]));
    }

    #[test]
    fn a_chunk_without_ranking_data_keeps_the_lowest_id() {
        let result = result();
        // Diarization reports a speaker outside the chunk, so nothing covers it.
        let diar = [turn(0.0, 1.0, 2)];
        let json = build_verbose_json(&result, &diar, Some(&plan()));
        assert_eq!(json.segments[1].speaker, Some(1));
        assert_eq!(json.segments[1].speakers, Some(vec![1, 2]));
    }

    #[test]
    fn an_unattributed_chunk_falls_back_to_overlap() {
        let mut plan = plan();
        plan.chunks[1].speakers = Vec::new();
        let result = result();
        let diar = [turn(15.0, 19.0, 3)];
        let json = build_verbose_json(&result, &diar, Some(&plan));
        assert_eq!(json.segments[1].speakers, None);
        assert_eq!(json.segments[1].speaker, Some(3));
    }

    #[test]
    fn the_cli_json_carries_the_same_speaker_sets_as_the_api() {
        let result = result();
        let json = format_json(&result, &[], Some(&plan()));
        let value: serde_json::Value = serde_json::from_str(&json).unwrap();
        let segments = value["segments"].as_array().unwrap();
        assert_eq!(segments[0]["speakers"], serde_json::json!([1]));
        assert_eq!(segments[0]["speaker"], 1);
        assert_eq!(segments[1]["speakers"], serde_json::json!([1, 2]));
        assert_eq!(segments[1]["speaker"], 1);
    }

    #[test]
    fn the_cli_json_names_the_dominant_speaker_on_a_boundary_chunk() {
        let result = result();
        let diar = [turn(10.0, 11.0, 1), turn(14.0, 19.0, 2)];
        let json = format_json(&result, &diar, Some(&plan()));
        let value: serde_json::Value = serde_json::from_str(&json).unwrap();
        let segments = value["segments"].as_array().unwrap();
        assert_eq!(segments[0]["speaker"], 1);
        assert_eq!(segments[1]["speaker"], 2);
        assert_eq!(segments[1]["speakers"], serde_json::json!([1, 2]));
    }

    #[test]
    fn without_a_plan_the_overlap_speaker_is_used() {
        let result = TranscribeResult {
            segments: vec![segment(0, 100)],
        };
        let diar = [diarization::Segment {
            start: 0.0,
            end: 1.0,
            speaker_id: 3,
        }];
        let json = build_verbose_json(&result, &diar, None);
        assert_eq!(json.segments[0].speaker, Some(3));
        assert!(json.segments[0].speakers.is_none());
    }
}
