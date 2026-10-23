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
            out.push_str(" ");
            out.push_str(&speaker_label(speaker));
        }
        out.push_str("**\n\n");
        out.push_str(segment.text.trim());
        out.push_str("\n\n");
    }
    out
}

pub fn format_json(result: &TranscribeResult, diar_segments: &[diarization::Segment]) -> String {
    serde_json::to_string_pretty(&build_verbose_json(result, diar_segments)).unwrap_or_else(|_| "{}".into())
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
    pub no_speech_prob: f32,
}

pub fn build_verbose_json(result: &TranscribeResult, diar_segments: &[diarization::Segment]) -> VerboseJson {
    VerboseJson {
        text: result.text(),
        segments: result
            .segments
            .iter()
            .map(|segment| VerboseSegment {
                start: cs_to_seconds(segment.start),
                end: cs_to_seconds(segment.end),
                text: segment.text.clone(),
                speaker: match_speaker(cs_to_seconds(segment.start), cs_to_seconds(segment.end), diar_segments),
                no_speech_prob: segment.no_speech_prob,
            })
            .collect(),
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
        let json = format_json(&result(vec![segment(100, 250, "привет")]), &[]);
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
        let json = format_json(&result(segments.to_vec()), &turns);
        let value: serde_json::Value = serde_json::from_str(&json).unwrap();
        let segments = value["segments"].as_array().unwrap();
        assert_eq!(segments[0]["speaker"], 1);
        assert_eq!(segments[1]["speaker"], 0);
    }

    #[test]
    fn json_with_empty_segments_is_an_empty_document() {
        let json = format_json(&result(vec![]), &[]);
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
