//! Word-error-rate measurement on a prepared FLEURS-ru manifest.
//!
//! `GIGAAM_MODEL` selects the GGUF and `GIGAAM_FLEURS` a TSV with
//! `wav<TAB>reference` rows. The evaluation protocol matches the one next to
//! the published reference: utterances longer than 30 s and references
//! containing digits are excluded, and both sides are lowercased with
//! punctuation removed. Run with `--release`; debug inference is too slow to
//! finish a useful sample.

use std::path::Path;

use gigaam_rs::Model;

fn read_samples(path: &Path) -> Vec<f32> {
    let mut reader = hound::WavReader::open(path).unwrap();
    let spec = reader.spec();
    assert_eq!(spec.sample_rate, 16_000, "{}", path.display());
    assert_eq!(spec.channels, 1, "{}", path.display());
    match spec.sample_format {
        hound::SampleFormat::Float => reader.samples::<f32>().map(|value| value.unwrap()).collect(),
        hound::SampleFormat::Int => {
            let scale = 1.0 / (1i64 << (spec.bits_per_sample - 1)) as f32;
            reader.samples::<i32>().map(|value| value.unwrap() as f32 * scale).collect()
        }
    }
}

fn normalize(text: &str) -> Vec<String> {
    text.to_lowercase()
        .chars()
        .map(|character| if character.is_alphanumeric() { character } else { ' ' })
        .collect::<String>()
        .split_whitespace()
        .map(str::to_owned)
        .collect()
}

fn edit_distance(reference: &[String], hypothesis: &[String]) -> usize {
    let mut previous = (0..=hypothesis.len()).collect::<Vec<_>>();
    let mut current = vec![0; hypothesis.len() + 1];
    for (row, reference_word) in reference.iter().enumerate() {
        current[0] = row + 1;
        for (column, hypothesis_word) in hypothesis.iter().enumerate() {
            let substitution = previous[column] + usize::from(reference_word != hypothesis_word);
            current[column + 1] = substitution.min(previous[column + 1] + 1).min(current[column] + 1);
        }
        std::mem::swap(&mut previous, &mut current);
    }
    previous[hypothesis.len()]
}

#[test]
fn fleurs_wer_matches_the_published_reference() {
    let (Some(model_path), Ok(manifest)) = (std::env::var("GIGAAM_MODEL").ok(), std::env::var("GIGAAM_FLEURS")) else {
        return;
    };
    let model = Model::load(&model_path).unwrap();
    let mut total_words = 0;
    let mut total_errors = 0;
    let mut counted = 0;
    let mut skipped_digits = 0;
    let mut skipped_long = 0;
    for line in std::fs::read_to_string(&manifest).unwrap().lines() {
        let Some((wav, reference)) = line.split_once('\t') else {
            continue;
        };
        if reference.chars().any(|character| character.is_ascii_digit()) {
            skipped_digits += 1;
            continue;
        }
        let samples = read_samples(Path::new(wav));
        if samples.len() > 30 * 16_000 {
            skipped_long += 1;
            continue;
        }
        let transcription = model.transcribe_chunk(&samples, "ru").unwrap();
        let reference = normalize(reference);
        let hypothesis = normalize(&transcription.text);
        let errors = edit_distance(&reference, &hypothesis);
        total_words += reference.len();
        total_errors += errors;
        counted += 1;
    }
    let wer = 100.0 * total_errors as f64 / total_words as f64;
    eprintln!(
        "fleurs-ru: {counted} utterances, skipped {} with digits and {skipped_long} over 30 s, \
         {total_errors}/{total_words} word errors, WER {wer:.2}% (published Q8_0 reference 5.35%)",
        skipped_digits
    );
    assert!(counted > 0);
    // The published transcribe.cpp reference is 5.35% on the full split; allow
    // the one-percentage-point margin the task sets.
    assert!(wer <= 6.35, "WER {wer:.2}% is more than one point above the reference");
}
