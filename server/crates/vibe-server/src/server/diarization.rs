use transcribe_cpp::{DiarizeOptions, Model};

#[derive(Debug, Clone)]
pub struct Segment {
    pub start: f64,
    pub end: f64,
    pub speaker_id: usize,
}

pub fn diarize(model_path: &str, samples: &[f32]) -> Vec<Segment> {
    let result = (|| -> anyhow::Result<Vec<Segment>> {
        let model = Model::load(model_path)?;
        let mut session = model.diarize_session()?;
        let segments = session.run(samples, &DiarizeOptions::default())?;
        Ok(segments
            .into_iter()
            .map(|segment| Segment {
                start: segment.t0_ms as f64 / 1000.0,
                end: segment.t1_ms as f64 / 1000.0,
                speaker_id: segment.speaker_id.max(1) as usize,
            })
            .collect())
    })();
    match result {
        Ok(segments) => segments,
        Err(err) => {
            tracing::warn!("diarization failed, skipping speakers: {err:#}");
            Vec::new()
        }
    }
}
