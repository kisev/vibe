//! Durable per-chunk transcription cache.
//!
//! A cache entry holds the plan and every finished chunk of one recording, so a
//! run interrupted by a crash, a timeout, or an out-of-memory failure resumes
//! instead of starting over. Entries are content-addressed: the key changes
//! whenever anything that affects the transcript changes, so a stale entry is
//! never mistaken for a fresh one.
//!
//! Nothing is created until a [`Cache`] is built from a root directory, which
//! keeps the cache purely opt-in.

use std::fs::{File, OpenOptions};
use std::io::Write as _;
use std::path::{Path, PathBuf};

use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

/// Bumped whenever the on-disk meaning of any file changes. Version 2 is the
/// unified transcribe.cpp engine: transcripts can differ from the hand-written
/// engines, so entries written by version 1 must never be reused.
pub const SCHEMA_VERSION: u32 = 2;

/// How long a second process waits for a busy entry before giving up.
const LOCK_WAIT: std::time::Duration = std::time::Duration::from_secs(2);
const LOCK_POLL: std::time::Duration = std::time::Duration::from_millis(50);

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("cache entry {0} is in use by another run")]
    Busy(String),
    #[error("cache io failed for {path}: {source}")]
    Io {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("cache entry {path} is corrupt: {source}")]
    Corrupt {
        path: PathBuf,
        #[source]
        source: serde_json::Error,
    },
}

type Result<T> = std::result::Result<T, Error>;

fn io(path: &Path) -> impl FnOnce(std::io::Error) -> Error + '_ {
    move |source| Error::Io {
        path: path.to_path_buf(),
        source,
    }
}

/// The plan and the options that produced it, stored beside the parts.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Manifest {
    pub schema: u32,
    pub audio_hash: String,
    pub model: ModelStamp,
    pub engine: String,
    pub options: serde_json::Value,
    pub plan: crate::plan::Plan,
}

/// A cheap identity for a model file: hashing hundreds of megabytes on every
/// run would cost more than the cache saves.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ModelStamp {
    pub path: String,
    pub size: u64,
    /// Seconds since the Unix epoch, or zero when the platform cannot say.
    pub modified: u64,
}

impl ModelStamp {
    pub fn of(path: &str) -> Self {
        let metadata = std::fs::metadata(path).ok();
        Self {
            path: path.to_string(),
            size: metadata.as_ref().map_or(0, std::fs::Metadata::len),
            modified: metadata
                .and_then(|metadata| metadata.modified().ok())
                .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
                .map_or(0, |duration| duration.as_secs()),
        }
    }
}

/// Everything that defines an entry.
#[derive(Debug, Clone, Serialize)]
pub struct Identity<'a> {
    pub audio: &'a [f32],
    pub model: ModelStamp,
    pub engine: &'a str,
    pub options: serde_json::Value,
    pub plan: &'a crate::plan::Plan,
}

impl Identity<'_> {
    /// SHA-256 over every output-affecting input, truncated to 32 hex digits.
    /// Decoded samples are hashed rather than the uploaded bytes so the same
    /// recording in two containers shares an entry.
    pub fn key(&self) -> String {
        self.key_with_version(SCHEMA_VERSION)
    }

    /// The same digest under a historical schema version. Used to prove a bump
    /// moves every key: an entry written before the bump sits at a different
    /// directory and is never opened again.
    pub fn key_with_version(&self, version: u32) -> String {
        let mut hasher = Sha256::new();
        hasher.update(version.to_le_bytes());
        let mut samples = Hasher(&mut hasher);
        for sample in self.audio {
            samples.update(&sample.to_bits().to_le_bytes());
        }
        hasher.update(self.model.path.as_bytes());
        hasher.update(self.model.size.to_le_bytes());
        hasher.update(self.model.modified.to_le_bytes());
        hasher.update(self.engine.as_bytes());
        hasher.update(self.options.to_string().as_bytes());
        hasher.update(serde_json::to_vec(self.plan).unwrap_or_default());
        hex(&hasher.finalize())
    }
}

/// SHA-256 of the decoded samples, kept in the manifest for debugging.
pub fn audio_hash(audio: &[f32]) -> String {
    let mut hasher = Sha256::new();
    for sample in audio {
        hasher.update(sample.to_bits().to_le_bytes());
    }
    hex(&hasher.finalize())
}

/// Small adapter so the audio loop does not inline the digest plumbing.
struct Hasher<'a>(&'a mut Sha256);

impl Hasher<'_> {
    fn update(&mut self, bytes: &[u8]) {
        self.0.update(bytes);
    }
}

fn hex(bytes: &[u8]) -> String {
    let mut out = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        use std::fmt::Write as _;
        let _ = write!(out, "{byte:02x}");
    }
    out.chars().take(32).collect()
}

/// A cache root. Build it only when caching is configured.
#[derive(Debug, Clone)]
pub struct Cache {
    root: PathBuf,
}

impl Cache {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self { root: root.into() }
    }

    /// Create the entry for `key` and take its exclusive lock. A second run on
    /// the same entry waits briefly and then reports [`Error::Busy`].
    pub fn open(&self, key: &str) -> Result<Entry> {
        let dir = self.root.join(key);
        std::fs::create_dir_all(dir.join("parts")).map_err(io(&dir))?;
        let lock_path = dir.join("run.lock");
        let lock = OpenOptions::new()
            .create(true)
            .truncate(false)
            .write(true)
            .open(&lock_path)
            .map_err(io(&lock_path))?;
        let deadline = std::time::Instant::now() + LOCK_WAIT;
        loop {
            match FileExt::try_lock_exclusive(&lock) {
                Ok(true) => break,
                Ok(false) => {
                    if std::time::Instant::now() >= deadline {
                        return Err(Error::Busy(key.to_string()));
                    }
                    std::thread::sleep(LOCK_POLL);
                }
                Err(err) if err.kind() == std::io::ErrorKind::WouldBlock => {
                    if std::time::Instant::now() >= deadline {
                        return Err(Error::Busy(key.to_string()));
                    }
                    std::thread::sleep(LOCK_POLL);
                }
                Err(err) => return Err(io(&lock_path)(err)),
            }
        }
        Ok(Entry { dir, _lock: lock })
    }
}

use fs4::fs_std::FileExt;

/// One opened entry. The lock is released when it is dropped.
#[derive(Debug)]
pub struct Entry {
    dir: PathBuf,
    _lock: File,
}

impl Entry {
    #[cfg(test)]
    pub fn dir(&self) -> &Path {
        &self.dir
    }

    pub fn manifest(&self) -> Option<Manifest> {
        read_json(&self.dir.join("manifest.json"))
    }

    pub fn write_manifest(&self, manifest: &Manifest) -> Result<()> {
        write_json(&self.dir.join("manifest.json"), manifest)
    }

    pub fn write_plan(&self, plan: &crate::plan::Plan) -> Result<()> {
        write_json(&self.dir.join("plan.json"), plan)
    }

    /// A finished chunk, if one was stored.
    #[cfg(test)]
    pub fn part<T: DeserializeOwned + Serialize>(&self, index: usize) -> Option<T> {
        self.part_at(index, "")
    }

    #[cfg(test)]
    pub fn write_part<T: Serialize>(&self, index: usize, part: &T) -> Result<()> {
        self.write_part_at(index, "", part)
    }

    /// A finished chunk or one leaf of a split chunk. `tag` is empty for a chunk
    /// the engine handled whole and names the half for a leaf, so a resumed run
    /// keeps whatever halves a previous run finished.
    pub fn part_at<T: DeserializeOwned>(&self, index: usize, tag: &str) -> Option<T> {
        read_json(&self.part_path(index, tag))
    }

    pub fn write_part_at<T: Serialize>(&self, index: usize, tag: &str, part: &T) -> Result<()> {
        write_json(&self.part_path(index, tag), part)
    }

    pub fn splits(&self) -> Option<Vec<Split>> {
        read_json(&self.dir.join("splits.json"))
    }

    pub fn write_splits(&self, splits: &[Split]) -> Result<()> {
        write_json(&self.dir.join("splits.json"), splits)
    }

    fn part_path(&self, index: usize, tag: &str) -> PathBuf {
        self.dir.join("parts").join(format!("part-{index:06}{tag}.json"))
    }
}

/// A chunk the model could not handle whole, split into these halves.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Split {
    pub core_start: f64,
    pub core_end: f64,
    pub halves: Vec<(f64, f64)>,
}

fn read_json<T: DeserializeOwned>(path: &Path) -> Option<T> {
    let bytes = std::fs::read(path).ok()?;
    match serde_json::from_slice(&bytes) {
        Ok(value) => Some(value),
        Err(err) => {
            tracing::warn!("ignoring unreadable cache file {}: {err}", path.display());
            None
        }
    }
}

/// Write through a temporary file in the same directory and rename it into
/// place, so an interrupted write never leaves a readable partial result.
fn write_json<T: Serialize + ?Sized>(path: &Path, value: &T) -> Result<()> {
    let bytes = serde_json::to_vec(value).map_err(|source| Error::Corrupt {
        path: path.to_path_buf(),
        source,
    })?;
    let tmp = path.with_extension("tmp");
    {
        let mut file = File::create(&tmp).map_err(io(&tmp))?;
        file.write_all(&bytes).map_err(io(&tmp))?;
        file.sync_all().map_err(io(&tmp))?;
    }
    std::fs::rename(&tmp, path).map_err(io(path))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::plan::{Chunk, Plan};

    fn plan() -> Plan {
        Plan {
            chunks: vec![Chunk {
                input_start: 0.0,
                input_end: 10.0,
                core_start: 0.0,
                core_end: 10.0,
                speakers: vec![1],
            }],
            max_input_seconds: 25.0,
        }
    }

    fn identity<'a>(audio: &'a [f32], engine: &'a str, plan: &'a Plan) -> Identity<'a> {
        Identity {
            audio,
            model: ModelStamp {
                path: "/models/a.gguf".to_string(),
                size: 10,
                modified: 1,
            },
            engine,
            options: serde_json::json!({ "language": "ru" }),
            plan,
        }
    }

    #[test]
    fn changing_any_input_changes_the_key() {
        let audio = vec![0.0_f32; 16];
        let other_audio = vec![0.5_f32; 16];
        let plan = plan();
        let base = identity(&audio, "gigaam", &plan).key();

        let mut changed_audio = identity(&other_audio, "gigaam", &plan);
        assert_ne!(changed_audio.key(), base);
        changed_audio.audio = &audio;

        let mut changed_model = identity(&audio, "gigaam", &plan);
        changed_model.model.size += 1;
        assert_ne!(changed_model.key(), base);

        assert_ne!(identity(&audio, "parakeet", &plan).key(), base);

        let mut changed_options = identity(&audio, "gigaam", &plan);
        changed_options.options = serde_json::json!({ "language": "en" });
        assert_ne!(changed_options.key(), base);

        let mut other_plan = plan.clone();
        other_plan.max_input_seconds = 20.0;
        assert_ne!(identity(&audio, "gigaam", &other_plan).key(), base);
    }

    #[test]
    fn the_same_inputs_produce_the_same_key() {
        let audio = vec![0.1_f32; 32];
        let plan = plan();
        assert_eq!(
            identity(&audio, "gigaam", &plan).key(),
            identity(&audio, "gigaam", &plan).key()
        );
    }

    #[test]
    fn a_schema_bump_moves_every_key() {
        // Version 1 is the hand-written-engine era; version 2 the unified
        // engine. Same inputs, different key: an entry written before the bump
        // sits at a directory the current code never opens, so it can neither
        // be reused nor corrupted.
        assert_eq!(SCHEMA_VERSION, 2);
        let audio = vec![0.1_f32; 32];
        let plan = plan();
        let one = identity(&audio, "gigaam", &plan).key_with_version(1);
        assert_ne!(one, identity(&audio, "gigaam", &plan).key());
    }

    #[test]
    fn parts_round_trip() {
        let dir = tempfile::tempdir().unwrap();
        let cache = Cache::new(dir.path());
        let entry = cache.open("abc").unwrap();
        assert!(entry.part::<Vec<String>>(0).is_none());

        entry.write_part(0, &vec!["hello".to_string()]).unwrap();
        assert_eq!(entry.part::<Vec<String>>(0).unwrap(), vec!["hello".to_string()]);
        assert!(!entry.dir().join("parts").join("part-000000.tmp").exists());
    }

    #[test]
    fn an_interrupted_write_leaves_no_visible_part() {
        let dir = tempfile::tempdir().unwrap();
        let cache = Cache::new(dir.path());
        let entry = cache.open("abc").unwrap();
        // A crash between create and rename leaves only the temporary file.
        let path = entry.dir().join("parts").join("part-000000.json");
        std::fs::write(path.with_extension("tmp"), b"{ half").unwrap();
        assert!(entry.part::<Vec<String>>(0).is_none());
    }

    #[test]
    fn a_second_open_of_a_live_entry_reports_busy() {
        let dir = tempfile::tempdir().unwrap();
        let cache = Cache::new(dir.path());
        let _first = cache.open("abc").unwrap();
        let error = cache.open("abc").expect_err("the entry is locked");
        assert!(matches!(error, Error::Busy(_)), "{error}");
    }

    #[test]
    fn a_corrupt_file_is_ignored() {
        let dir = tempfile::tempdir().unwrap();
        let cache = Cache::new(dir.path());
        let entry = cache.open("abc").unwrap();
        std::fs::write(entry.dir().join("manifest.json"), b"not json").unwrap();
        assert!(entry.manifest().is_none());
    }

    #[test]
    fn no_root_means_no_directory() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().join("never-created");
        // Building a cache is inert; only opening an entry writes anything.
        let _cache = Cache::new(&root);
        assert!(!root.exists());
    }
}
