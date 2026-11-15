//! Cached chunk transcription: reuse finished chunks, resume an interrupted
//! run, and halve a chunk the engine cannot fit in memory.
//!
//! The cache is opt-in; this module only runs when a root was configured.

use crate::cache;
use crate::engine::Engine;
use crate::plan::Plan;

/// A segment as it is stored in the cache; identical to the engine's output.
/// Word rows default to empty so entries written before they were kept load
/// unchanged — speaker splitting simply falls back to overlap for them.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct StoredSegment {
    start: i64,
    end: i64,
    text: String,
    no_speech_prob: f32,
    #[serde(default)]
    words: Vec<crate::engine::Word>,
}

impl From<&crate::engine::Segment> for StoredSegment {
    fn from(segment: &crate::engine::Segment) -> Self {
        Self {
            start: segment.start,
            end: segment.end,
            text: segment.text.clone(),
            no_speech_prob: segment.no_speech_prob,
            words: segment.words.clone(),
        }
    }
}

impl From<StoredSegment> for crate::engine::Segment {
    fn from(segment: StoredSegment) -> Self {
        Self {
            start: segment.start,
            end: segment.end,
            text: segment.text,
            no_speech_prob: segment.no_speech_prob,
            words: segment.words,
        }
    }
}

/// Deepest a chunk is halved before the run gives up.
const MAX_SPLIT_DEPTH: usize = 6;

/// Transcribe the plan chunk by chunk, reusing every chunk a previous run
/// already finished. A chunk that runs out of memory is split in half and the
/// halves are tried; the split itself is persisted, so a resumed run starts
/// from the halves instead of failing on the full size again.
pub(crate) fn transcribe_cached(
    ctx: &mut Engine,
    model_path: &str,
    samples: &[f32],
    plan: &Plan,
    options: &crate::engine::TranscribeOptions,
    root: &str,
) -> anyhow::Result<crate::engine::TranscribeResult> {
    let engine = ctx.capabilities().engine;
    let options_json = options_json(options);
    let identity = cache::Identity {
        audio: samples,
        model: cache::ModelStamp::of(model_path),
        engine: &engine,
        options: options_json.clone(),
        plan,
    };
    let store = cache::Cache::new(root);
    let Ok(entry) = store.open(&identity.key()) else {
        // The cache is an optimization: a busy entry (a duplicate request) or
        // an unusable directory must degrade to an uncached run, never fail a
        // request that would otherwise succeed.
        tracing::warn!(root, "cache entry unavailable; transcribing without the cache");
        return ctx.transcribe_chunks(samples, plan, options.clone());
    };
    if entry.manifest().is_none() {
        warn_cache_write(
            "writing the cache manifest",
            entry.write_manifest(&cache::Manifest {
                schema: cache::SCHEMA_VERSION,
                audio_hash: cache::audio_hash(samples),
                model: cache::ModelStamp::of(model_path),
                engine,
                options: options_json,
                plan: plan.clone(),
            }),
        );
        warn_cache_write("writing the cache plan", entry.write_plan(plan));
    }

    let mut splits = entry.splits().unwrap_or_default();
    let mut segments = Vec::new();
    for (index, chunk) in plan.chunks.iter().enumerate() {
        let mut run = |chunk: &crate::plan::Chunk| {
            let single = Plan {
                chunks: vec![chunk.clone()],
                max_input_seconds: plan.max_input_seconds,
            };
            ctx.transcribe_chunks(samples, &single, options.clone())
                .map(|result| result.segments)
        };
        let finished = Resolution {
            entry: &entry,
            splits: &mut splits,
            index,
        }
        .chunk(chunk, &mut Vec::new(), 0, &mut run)?;
        segments.extend(finished);
    }
    Ok(crate::engine::TranscribeResult {
        segments,
        language: None,
    })
}

/// The output-affecting options an entry is keyed by. The whole option set is
/// serialized rather than a hand-picked list: a field the engine honours must
/// move the key, and the next option added cannot be forgotten here.
fn options_json(options: &crate::engine::TranscribeOptions) -> serde_json::Value {
    serde_json::to_value(options).unwrap_or(serde_json::Value::Null)
}

/// Cache writes are an optimization: a full disk, a vanished directory, or a
/// transient I/O error must not turn an already successful transcription into
/// a failure. Report and continue.
fn warn_cache_write(context: &str, result: std::result::Result<(), cache::Error>) {
    if let Err(err) = result {
        tracing::warn!("{context}: {err}; continuing without the cache");
    }
}

/// What one chunk's resolution shares across its split tree: the opened cache
/// entry, the split tree being built, and the chunk's index in the plan.
struct Resolution<'a> {
    entry: &'a cache::Entry,
    splits: &'a mut Vec<cache::Split>,
    index: usize,
}

impl Resolution<'_> {
    /// One chunk's segments: a stored result, a stored split, or a fresh run.
    ///
    /// The split tree is walked before anything is attempted, so a resumed run
    /// never retries a size the engine already failed on. Each leaf stores its
    /// own result, so a run interrupted mid-split keeps the halves that finish.
    fn chunk<F>(
        &mut self,
        chunk: &crate::plan::Chunk,
        slot: &mut Vec<usize>,
        depth: usize,
        run: &mut F,
    ) -> anyhow::Result<Vec<crate::engine::Segment>>
    where
        F: FnMut(&crate::plan::Chunk) -> anyhow::Result<Vec<crate::engine::Segment>>,
    {
        let tag = slot_tag(slot);
        if let Some(stored) = self.entry.part_at::<Vec<StoredSegment>>(self.index, &tag) {
            tracing::debug!(chunk = self.index, part = %tag, segments = stored.len(), "reusing cached chunk");
            return Ok(stored.into_iter().map(crate::engine::Segment::from).collect());
        }

        if let Some(halves) = self
            .splits
            .iter()
            .find(|split| split.core_start == chunk.core_start && split.core_end == chunk.core_end)
            .map(|split| split.halves.clone())
        {
            tracing::debug!(chunk = self.index, part = %tag, "resuming a split chunk");
            return self.halves(chunk, &halves, slot, depth, run);
        }

        match run(chunk) {
            Ok(finished) => {
                warn_cache_write(
                    "storing a finished chunk",
                    self.entry.write_part_at(
                        self.index,
                        &tag,
                        &finished.iter().map(StoredSegment::from).collect::<Vec<_>>(),
                    ),
                );
                Ok(finished)
            }
            Err(err) if is_out_of_memory(&err) && depth < MAX_SPLIT_DEPTH => {
                let Some(halves) = halve(chunk) else {
                    return Err(with_range(err, chunk));
                };
                tracing::warn!(chunk = self.index, part = %tag, "out of memory; splitting the chunk in half");
                self.splits.push(cache::Split {
                    core_start: chunk.core_start,
                    core_end: chunk.core_end,
                    halves: halves.clone(),
                });
                warn_cache_write("remembering a chunk split", self.entry.write_splits(self.splits));
                self.halves(chunk, &halves, slot, depth, run)
            }
            // The depth cap is reached: this size cannot be made to fit either.
            Err(err) if is_out_of_memory(&err) => Err(with_range(err, chunk)),
            Err(err) => Err(err),
        }
    }

    fn halves<F>(
        &mut self,
        parent: &crate::plan::Chunk,
        halves: &[(f64, f64)],
        slot: &mut Vec<usize>,
        depth: usize,
        run: &mut F,
    ) -> anyhow::Result<Vec<crate::engine::Segment>>
    where
        F: FnMut(&crate::plan::Chunk) -> anyhow::Result<Vec<crate::engine::Segment>>,
    {
        let mut segments = Vec::new();
        for (half_index, (start, end)) in halves.iter().enumerate() {
            let (input_start, input_end) = half_input(parent, half_index, halves.len(), *start, *end);
            let half = crate::plan::Chunk {
                input_start,
                input_end,
                core_start: *start,
                core_end: *end,
                speakers: parent.speakers.clone(),
            };
            slot.push(half_index);
            segments.extend(self.chunk(&half, slot, depth + 1, run)?);
            slot.pop();
        }
        Ok(segments)
    }
}

/// The audio a split half hears: its core plus the parent's padding on the
/// outer edges, keeping both inside the parent's input range. The seam between
/// two halves is not padded on either side — overlapping inputs would
/// transcribe the same audio twice and duplicate the text at the cut.
fn half_input(parent: &crate::plan::Chunk, index: usize, count: usize, start: f64, end: f64) -> (f64, f64) {
    let pad_before = parent.core_start - parent.input_start;
    let pad_after = parent.input_end - parent.core_end;
    let left = if index == 0 {
        (start - pad_before).max(parent.input_start)
    } else {
        start
    };
    let right = if index + 1 == count {
        (end + pad_after).min(parent.input_end)
    } else {
        end
    };
    (left, right)
}

/// Name the span the engine could not process. The message keeps the engine's
/// wording, so the cause is still visible in a single line the user sees.
fn with_range(error: anyhow::Error, chunk: &crate::plan::Chunk) -> anyhow::Error {
    anyhow::anyhow!(
        "chunk {:.1}s..{:.1}s could not be transcribed: {error:#}",
        chunk.core_start,
        chunk.core_end
    )
}

/// The two halves of a chunk, or `None` when either would fall below the
/// shortest chunk worth producing.
fn halve(chunk: &crate::plan::Chunk) -> Option<Vec<(f64, f64)>> {
    let middle = (chunk.core_start + chunk.core_end) / 2.0;
    if middle - chunk.core_start < 1.0 || chunk.core_end - middle < 1.0 {
        return None;
    }
    Some(vec![(chunk.core_start, middle), (middle, chunk.core_end)])
}

/// Names one leaf among the parts of a chunk: empty for the whole chunk, then
/// one `-h<n>` per level of halving.
fn slot_tag(slot: &[usize]) -> String {
    slot.iter().map(|half| format!("-h{half}")).collect()
}

/// Whether an engine error is an allocation failure that a smaller chunk may
/// survive. One marker list classifies both this decision and the HTTP error
/// code (see `engine::allocation_failure`), so a "room" in an ordinary error
/// can no longer persist a split.
fn is_out_of_memory(error: &anyhow::Error) -> bool {
    crate::engine::allocation_failure(error).is_some()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::server::transcription::build_options;
    use std::collections::HashMap;

    /// The gated GigaAM model, its audio, and a loaded engine.
    fn gigaam() -> Option<(Engine, String, Vec<f32>)> {
        let model = std::env::var("GIGAAM_MODEL").ok()?;
        // The tests that use this helper need a VAD model; its presence is the gate.
        let _vad = std::env::var("GIGAAM_VAD_MODEL").ok()?;
        let audio_path = std::env::var("GIGAAM_AUDIO").ok()?;
        if !std::path::Path::new(&model).exists() {
            return None;
        }
        let mut reader = hound::WavReader::open(audio_path).ok()?;
        let samples = reader
            .samples::<i16>()
            .map(|sample| sample.expect("audio sample") as f32 / 32768.0)
            .collect();
        let engine = Engine::load(&model, crate::engine::ContextOptions::default()).ok()?;
        Some((engine, model, samples))
    }

    fn two_chunk_plan(duration: f64) -> Plan {
        let middle = duration / 2.0;
        Plan {
            chunks: vec![
                crate::plan::Chunk {
                    input_start: 0.0,
                    input_end: middle,
                    core_start: 0.0,
                    core_end: middle,
                    speakers: vec![1],
                },
                crate::plan::Chunk {
                    input_start: middle,
                    input_end: duration,
                    core_start: middle,
                    core_end: duration,
                    speakers: vec![2],
                },
            ],
            max_input_seconds: 25.0,
        }
    }

    fn chunk(start: f64, end: f64) -> crate::plan::Chunk {
        crate::plan::Chunk {
            input_start: start,
            input_end: end,
            core_start: start,
            core_end: end,
            speakers: vec![1],
        }
    }

    /// Fails the way a CUDA allocation does for anything longer than `limit`.
    fn run_failing_above(
        limit: f64,
        calls: &mut Vec<(f64, f64)>,
    ) -> impl FnMut(&crate::plan::Chunk) -> anyhow::Result<Vec<crate::engine::Segment>> + '_ {
        move |chunk: &crate::plan::Chunk| {
            calls.push((chunk.core_start, chunk.core_end));
            if chunk.core_end - chunk.core_start > limit {
                anyhow::bail!("ggml_backend_cuda_buffer_type_alloc_buffer: CUDA error: out of memory");
            }
            Ok(vec![crate::engine::Segment {
                start: (chunk.core_start * 100.0) as i64,
                end: (chunk.core_end * 100.0) as i64,
                text: format!("{:.1}-{:.1}", chunk.core_start, chunk.core_end),
                no_speech_prob: 0.0,
                words: Vec::new(),
            }])
        }
    }

    #[test]
    fn a_cached_run_stores_every_chunk_and_repeats_identically() {
        let Some((mut engine, model_path, samples)) = gigaam() else {
            return;
        };
        let dir = tempfile::tempdir().unwrap();
        let plan = two_chunk_plan(samples.len() as f64 / crate::plan::SAMPLE_RATE);
        let options = build_options(&HashMap::new(), false, false, std::env::var("GIGAAM_VAD_MODEL").ok());
        let root = dir.path().to_str().unwrap();

        let first = transcribe_cached(&mut engine, &model_path, &samples, &plan, &options, root).expect("first run");
        let second = transcribe_cached(&mut engine, &model_path, &samples, &plan, &options, root).expect("second run");
        assert_eq!(first.text(), second.text());
        assert!(!first.segments.is_empty());
        let parts = std::fs::read_dir(dir.path().join(shortest_dir(dir.path())))
            .map(|entries| entries.filter_map(Result::ok).count())
            .unwrap_or(0);
        assert!(parts > 0, "the entry directory holds the stored files");
    }

    fn shortest_dir(root: &std::path::Path) -> std::path::PathBuf {
        std::fs::read_dir(root)
            .expect("cache root")
            .filter_map(Result::ok)
            .map(|entry| entry.file_name())
            .next()
            .expect("one entry")
            .into()
    }

    #[test]
    fn a_finished_chunk_is_reused_instead_of_transcribed() {
        let Some((mut engine, model_path, samples)) = gigaam() else {
            return;
        };
        let dir = tempfile::tempdir().unwrap();
        let plan = two_chunk_plan(samples.len() as f64 / crate::plan::SAMPLE_RATE);
        let options = build_options(&HashMap::new(), false, false, std::env::var("GIGAAM_VAD_MODEL").ok());
        let root = dir.path().to_str().unwrap();

        // A previous run finished both chunks; overwrite the first with a marker.
        transcribe_cached(&mut engine, &model_path, &samples, &plan, &options, root).expect("warm the cache");
        let entry = dir.path().join(shortest_dir(dir.path()));
        let marker = vec![StoredSegment {
            start: 0,
            end: 100,
            text: "cached marker".to_string(),
            no_speech_prob: 0.0,
            words: Vec::new(),
        }];
        std::fs::write(
            entry.join("parts").join("part-000000.json"),
            serde_json::to_vec(&marker).unwrap(),
        )
        .unwrap();

        let result = transcribe_cached(&mut engine, &model_path, &samples, &plan, &options, root).expect("resumed run");
        assert_eq!(result.segments[0].text, "cached marker");
    }

    #[test]
    fn a_pre_bump_cache_entry_is_ignored_not_reused() {
        // A directory written by schema 1 (the hand-written engines) still sits
        // in the user's cache root. The current run computes a schema-2 key, so
        // it transcribes fresh and leaves the old directory untouched.
        let dir = tempfile::tempdir().unwrap();
        let store = cache::Cache::new(dir.path());
        let audio = vec![0.0_f32; 16];
        let plan = two_chunk_plan(audio.len() as f64 / crate::plan::SAMPLE_RATE);
        let identity = cache::Identity {
            audio: &audio,
            model: cache::ModelStamp::of("model.gguf"),
            engine: "whisper",
            options: serde_json::json!({}),
            plan: &plan,
        };

        let legacy = store.open(&identity.key_with_version(1)).unwrap();
        legacy
            .write_manifest(&cache::Manifest {
                schema: 1,
                audio_hash: cache::audio_hash(&audio),
                model: cache::ModelStamp::of("model.gguf"),
                engine: "whisper".to_string(),
                options: serde_json::json!({}),
                plan: plan.clone(),
            })
            .unwrap();
        let marker = vec![StoredSegment {
            start: 0,
            end: 100,
            text: "schema-1 marker".to_string(),
            no_speech_prob: 0.0,
            words: Vec::new(),
        }];
        legacy.write_part(0, &marker).unwrap();
        drop(legacy);

        let entry = store.open(&identity.key()).unwrap();
        let fresh = vec![crate::engine::Segment {
            start: 0,
            end: 100,
            text: "schema-2 fresh".to_string(),
            no_speech_prob: 0.0,
            words: Vec::new(),
        }];
        let mut run = move |_: &crate::plan::Chunk| Ok(fresh.clone());
        let segments = Resolution {
            entry: &entry,
            splits: &mut Vec::new(),
            index: 0,
        }
        .chunk(&plan.chunks[0], &mut Vec::new(), 0, &mut run)
        .expect("fresh run");
        assert_eq!(segments[0].text, "schema-2 fresh");

        let legacy_dir = dir.path().join(identity.key_with_version(1));
        let stored: Vec<StoredSegment> =
            serde_json::from_slice(&std::fs::read(legacy_dir.join("parts").join("part-000000.json")).unwrap()).unwrap();
        assert_eq!(stored[0].text, "schema-1 marker");
    }

    #[test]
    fn a_split_chunk_is_remembered_and_never_retried_whole() {
        let dir = tempfile::tempdir().unwrap();
        let store = cache::Cache::new(dir.path());
        let whole = chunk(0.0, 30.0);
        let mut calls = Vec::new();

        {
            let entry = store.open("key").unwrap();
            let mut splits = Vec::new();
            let segments = {
                let mut run = run_failing_above(10.0, &mut calls);
                Resolution {
                    entry: &entry,
                    splits: &mut splits,
                    index: 0,
                }
                .chunk(&whole, &mut Vec::new(), 0, &mut run)
                .expect("split run")
            };
            // 30s splits into 15s halves, each of which splits again into 7.5s leaves.
            assert_eq!(
                calls,
                vec![
                    (0.0, 30.0),
                    (0.0, 15.0),
                    (0.0, 7.5),
                    (7.5, 15.0),
                    (15.0, 30.0),
                    (15.0, 22.5),
                    (22.5, 30.0)
                ]
            );
            assert!(!segments.is_empty());
        }

        // A second run finds the split tree and every leaf already on disk.
        let entry = store.open("key").unwrap();
        let mut splits = entry.splits().expect("the split is persisted");
        assert_eq!(splits.len(), 3, "one split per chunk that ran out of memory");
        let mut retried = Vec::new();
        let segments = {
            let mut run = run_failing_above(10.0, &mut retried);
            Resolution {
                entry: &entry,
                splits: &mut splits,
                index: 0,
            }
            .chunk(&whole, &mut Vec::new(), 0, &mut run)
            .expect("resumed run")
        };
        assert!(retried.is_empty(), "no size is tried twice: {retried:?}");
        assert_eq!(segments.len(), 4);
    }

    #[test]
    fn splitting_stops_at_the_minimum_length() {
        let dir = tempfile::tempdir().unwrap();
        let store = cache::Cache::new(dir.path());
        let entry = store.open("key").unwrap();
        let mut splits = Vec::new();
        let mut calls = Vec::new();
        let mut run = |chunk: &crate::plan::Chunk| -> anyhow::Result<Vec<crate::engine::Segment>> {
            calls.push((chunk.core_start, chunk.core_end));
            anyhow::bail!("failed to allocate")
        };
        let error = Resolution {
            entry: &entry,
            splits: &mut splits,
            index: 0,
        }
        .chunk(&chunk(0.0, 2.0), &mut Vec::new(), 0, &mut run)
        .expect_err("a 2 second chunk cannot be halved below the minimum");
        let message = format!("{error:#}");
        assert!(message.contains("allocate"), "{message}");
        assert!(message.contains("0.0s..1.0s"), "the failing span is named: {message}");
        // The 1-second half is the smallest that may still be tried; failing there
        // ends the run instead of halving it into 0.5-second slivers.
        assert_eq!(calls, vec![(0.0, 2.0), (0.0, 1.0)]);
    }

    #[test]
    fn a_resumed_split_names_the_leaf_that_still_fails() {
        let dir = tempfile::tempdir().unwrap();
        let store = cache::Cache::new(dir.path());
        let whole = chunk(0.0, 30.0);
        let mut run = |chunk: &crate::plan::Chunk| -> anyhow::Result<Vec<crate::engine::Segment>> {
            // Every size fails, so the split keeps halving until the leaf is too
            // short to halve again — the only place the run can give up.
            if chunk.core_end - chunk.core_start > 1.0 {
                anyhow::bail!("CUDA out of memory");
            }
            Ok(Vec::new())
        };

        {
            let entry = store.open("key").unwrap();
            let mut splits = Vec::new();
            let error = Resolution {
                entry: &entry,
                splits: &mut splits,
                index: 0,
            }
            .chunk(&whole, &mut Vec::new(), 0, &mut run)
            .expect_err("the leaf cannot be halved");
            let message = format!("{error:#}");
            assert!(message.contains("0.0s..1.9s"), "{message}");
        }

        // The split tree sends the run straight to the halves, and the leaf that
        // failed before fails again — naming itself, not the chunk it came from.
        let entry = store.open("key").unwrap();
        let mut splits = entry.splits().expect("the split is persisted");
        let error = Resolution {
            entry: &entry,
            splits: &mut splits,
            index: 0,
        }
        .chunk(&whole, &mut Vec::new(), 0, &mut run)
        .expect_err("the leaf still cannot be halved");
        let message = format!("{error:#}");
        assert!(message.contains("0.0s..1.9s"), "{message}");
        assert!(!message.contains("0.0s..30.0s"), "the whole chunk is not blamed: {message}");
    }

    #[test]
    fn an_ordinary_error_is_not_an_allocation_failure() {
        // A bare "oom" used to match any word containing it ("room", "boom"),
        // and a false positive persisted a split that lowered quality for good.
        let error = anyhow::anyhow!("the driver reported the room is unavailable");
        assert!(!is_out_of_memory(&error), "a substring of an ordinary word is not OOM");

        let cuda = anyhow::anyhow!("ggml_backend_cuda_buffer_type_alloc_buffer: CUDA error: out of memory");
        assert!(is_out_of_memory(&cuda), "the canonical CUDA message is OOM");
        let vulkan = anyhow::anyhow!("vk::OutOfDeviceMemoryError");
        assert!(is_out_of_memory(&vulkan), "Vulkan's spelling is OOM");
    }

    #[test]
    fn a_split_keeps_the_parent_padding_on_its_outer_edges() {
        let dir = tempfile::tempdir().unwrap();
        let store = cache::Cache::new(dir.path());
        let entry = store.open("key").unwrap();
        let mut splits = Vec::new();
        // The planner padded the parent by 0.25 s on both sides.
        let parent = crate::plan::Chunk {
            input_start: 0.75,
            input_end: 11.25,
            core_start: 1.0,
            core_end: 11.0,
            speakers: vec![1],
        };
        let mut inputs = Vec::new();
        let mut run = |chunk: &crate::plan::Chunk| -> anyhow::Result<Vec<crate::engine::Segment>> {
            inputs.push((chunk.input_start, chunk.input_end));
            if chunk.core_end - chunk.core_start > 5.0 {
                anyhow::bail!("CUDA out of memory");
            }
            Ok(Vec::new())
        };
        Resolution {
            entry: &entry,
            splits: &mut splits,
            index: 0,
        }
        .chunk(&parent, &mut Vec::new(), 0, &mut run)
        .expect("split run");

        // The outer halves keep the parent's padding; the seam is not padded
        // in either direction, so the seam audio is never transcribed twice.
        assert_eq!(inputs, vec![(0.75, 11.25), (0.75, 6.0), (6.0, 11.25)]);
    }

    #[test]
    fn a_failure_before_any_chunk_completes_repeats_identically() {
        let dir = tempfile::tempdir().unwrap();
        let store = cache::Cache::new(dir.path());
        let entry = store.open("key").unwrap();
        let mut splits = Vec::new();
        let mut run =
            |_: &crate::plan::Chunk| -> anyhow::Result<Vec<crate::engine::Segment>> { anyhow::bail!("failed to allocate") };
        let chunk = chunk(0.0, 2.0);

        let first = Resolution {
            entry: &entry,
            splits: &mut splits,
            index: 0,
        }
        .chunk(&chunk, &mut Vec::new(), 0, &mut run)
        .expect_err("the first attempt fails");
        assert!(
            entry.part_at::<Vec<StoredSegment>>(0, "").is_none(),
            "a failed chunk stores nothing"
        );

        let second = Resolution {
            entry: &entry,
            splits: &mut splits,
            index: 0,
        }
        .chunk(&chunk, &mut Vec::new(), 0, &mut run)
        .expect_err("the retry fails the same way");
        assert_eq!(format!("{first:#}"), format!("{second:#}"));
        assert!(
            entry.part_at::<Vec<StoredSegment>>(0, "").is_none(),
            "the retry still stores nothing"
        );
    }
}
