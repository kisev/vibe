use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Transcript {
    pub processing_time_sec: u64,
    pub segments: Vec<Segment>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Segment {
    pub start: i64,
    pub stop: i64,
    pub text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speaker: Option<i32>,
    /// Every speaker the planned chunk held. More than one means the line sits
    /// on a turn boundary, so it is marked as uncertain rather than attributed
    /// to a single speaker.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speakers: Option<Vec<u16>>,
}
