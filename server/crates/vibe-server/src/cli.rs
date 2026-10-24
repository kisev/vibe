use crate::engine::Engine;
use crate::engine::{ContextOptions, TranscribeOptions};
use clap::{Parser, Subcommand, ValueEnum};

use crate::server::format;
use crate::{audio, pull, server};

const VERSION: &str = match option_env!("VIBE_SERVER_VERSION") {
    Some(value) => value,
    None => "dev",
};
const COMMIT: &str = match option_env!("VIBE_SERVER_COMMIT") {
    Some(value) => value,
    None => "dev",
};

#[derive(Debug, Parser)]
#[command(name = "vibe-server", version = VERSION, about = "Speech-to-text powered by whisper.cpp")]
struct Cli {
    #[arg(short, long, global = true)]
    verbose: bool,
    #[command(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    Transcribe {
        model: String,
        audio: String,
        #[arg(long)]
        vad_model: Option<String>,
        #[arg(long)]
        diarize_model: Option<String>,
        /// Directory for finished chunks, so an interrupted run resumes. Also
        /// read from VIBE_SERVER_CACHE_DIR.
        #[arg(long, env = "VIBE_SERVER_CACHE_DIR")]
        cache_dir: Option<String>,
        /// Planned chunk length in seconds; defaults to the engine maximum
        /// (25 for GigaAM, 30 for Parakeet and Nemotron).
        #[arg(long)]
        chunk_seconds: Option<f64>,
        #[arg(long, value_enum, default_value_t = OutputFormat::Txt)]
        format: OutputFormat,
        #[arg(long)]
        output: Option<String>,
        #[arg(short, long)]
        language: Option<String>,
        #[arg(long)]
        detect_language: bool,
        #[arg(long)]
        enhance_audio: bool,
        #[arg(long)]
        translate: bool,
        #[arg(long, default_value_t = 0)]
        threads: i32,
        #[arg(long)]
        prompt: Option<String>,
        #[arg(long, default_value_t = 0.0)]
        temperature: f32,
        #[arg(long, default_value_t = 0)]
        max_text_ctx: i32,
        #[arg(long)]
        word_timestamps: bool,
        #[arg(long, default_value_t = 0)]
        max_segment_len: i32,
        #[arg(long, default_value_t = 0)]
        best_of: i32,
        #[arg(long, default_value_t = 0)]
        beam_size: i32,
        #[arg(long, default_value_t = -1)]
        gpu_device: i32,
    },
    Serve {
        model: Option<String>,
        #[arg(long, default_value = "127.0.0.1")]
        host: String,
        #[arg(short, long, default_value_t = 0)]
        port: u16,
        #[arg(long, default_value_t = true, action = clap::ArgAction::Set)]
        exit_with_parent: bool,
        #[arg(long, env = "VIBE_SERVER_UNLOAD_TIMEOUT", default_value = "0")]
        unload_timeout: crate::server::unload_timeout::UnloadTimeout,
        /// Directory holding finished transcription chunks, reused across runs
        /// and after an interruption.
        #[arg(long, env = "VIBE_SERVER_CACHE_DIR")]
        cache_dir: Option<String>,
    },
    Pull {
        url: String,
        #[arg(short, long)]
        output: Option<String>,
    },
    Devices,
}

#[derive(Debug, Clone, Copy)]
pub struct AppConfig {
    verbose: bool,
    version: &'static str,
    commit: &'static str,
    /// Root of the transcription cache, when the caller configured one. The
    /// string lives for the process lifetime, so the config stays `Copy`.
    cache_dir: Option<&'static str>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            verbose: false,
            version: VERSION,
            commit: COMMIT,
            cache_dir: None,
        }
    }
}

impl AppConfig {
    pub fn verbose(&self) -> bool {
        self.verbose
    }

    pub fn version(&self) -> &'static str {
        self.version
    }

    pub fn commit(&self) -> &'static str {
        self.commit
    }

    pub fn cache_dir(&self) -> Option<&'static str> {
        self.cache_dir
    }

    fn with_cache_dir(self, dir: Option<String>) -> Self {
        Self {
            cache_dir: dir.map(|dir| &*Box::leak(dir.into_boxed_str())),
            ..self
        }
    }
}

pub async fn run() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let config = AppConfig {
        verbose: cli.verbose,
        version: VERSION,
        commit: COMMIT,
        cache_dir: None,
    };

    match cli.command {
        Command::Transcribe {
            model,
            audio,
            vad_model,
            diarize_model,
            cache_dir,
            chunk_seconds,
            format,
            output,
            language,
            detect_language,
            enhance_audio,
            translate,
            threads,
            prompt,
            temperature,
            max_text_ctx,
            word_timestamps,
            max_segment_len,
            best_of,
            beam_size,
            gpu_device,
        } => {
            transcribe_command(
                TranscribeArgs {
                    model,
                    audio,
                    vad_model,
                    diarize_model,
                    chunk_seconds,
                    format,
                    output,
                    language,
                    detect_language,
                    enhance_audio,
                    translate,
                    threads,
                    prompt,
                    temperature,
                    max_text_ctx,
                    word_timestamps,
                    max_segment_len,
                    best_of,
                    beam_size,
                    gpu_device,
                },
                config.with_cache_dir(cache_dir),
            )
            .await
        }
        Command::Serve {
            model,
            host,
            port,
            exit_with_parent,
            unload_timeout,
            cache_dir,
        } => {
            let config = config.with_cache_dir(cache_dir);
            if exit_with_parent {
                crate::parent::watch();
            }
            server::serve(host, port, model, unload_timeout, config).await
        }
        Command::Pull { url, output } => pull::pull_file(&url, output.as_deref()).await,
        Command::Devices => devices_command(config),
    }
}

async fn transcribe_command(args: TranscribeArgs, config: AppConfig) -> anyhow::Result<()> {
    crate::engine::set_verbose(config.verbose());
    let samples = audio::read_file_with_options(
        &args.audio,
        audio::ReadOptions {
            enhance_audio: args.enhance_audio,
            verbose: config.verbose(),
        },
    )?;
    let mut ctx = Engine::load(
        &args.model,
        ContextOptions {
            gpu_device: args.gpu_device,
            no_gpu: false,
        },
    )
    .inspect_err(|err| tracing::error!(model = args.model, "failed to load model: {err:#}"))?;

    let diar_segments = args.diarize_model.as_deref().map_or_else(Vec::new, |model_path| {
        crate::server::diarization::diarize(model_path, &samples)
    });

    let options = TranscribeOptions {
        language: args.language,
        detect_language: args.detect_language,
        translate: args.translate,
        threads: args.threads,
        prompt: args.prompt,
        verbose: config.verbose(),
        temperature: args.temperature,
        max_text_ctx: args.max_text_ctx,
        word_timestamps: args.word_timestamps,
        // One word per segment is what --word-timestamps is asking for, unless
        // the caller picked a length themselves.
        max_segment_len: if args.word_timestamps && args.max_segment_len == 0 {
            1
        } else {
            args.max_segment_len
        },
        best_of: args.best_of,
        beam_size: args.beam_size,
        vad_model_path: args.vad_model,
        ..TranscribeOptions::default()
    };
    // Validation raises the same language error the engine does, so the marker
    // has to cover both paths: a rejected language never reaches `transcribe`.
    ctx.validate_request(&options).map_err(unsupported_language_marker)?;
    if let (Some(requested), Some(maximum)) = (args.chunk_seconds, ctx.max_input_seconds()) {
        if requested > maximum {
            anyhow::bail!("--chunk-seconds must not exceed {maximum} for this engine");
        }
    }
    let plan = crate::server::transcription::plan_for(
        &mut ctx,
        &samples,
        &diar_segments,
        options.vad_model_path.as_deref(),
        args.chunk_seconds,
    );
    let result = match (plan.as_ref(), config.cache_dir()) {
        (Some(plan), Some(root)) => {
            crate::server::chunk_cache::transcribe_cached(&mut ctx, &args.model, &samples, plan, &options, root)
        }
        (Some(plan), None) => ctx.transcribe_chunks(&samples, plan, options),
        (None, _) => ctx.transcribe(&samples, options),
    }
    .inspect_err(|err| tracing::error!("transcription failed: {err:#}"))
    .map_err(unsupported_language_marker)?;

    let rendered = if args.word_timestamps && args.format == OutputFormat::Txt {
        // whisper.cpp emits one segment per word here, plus a leading empty one for
        // the silence before speech starts.
        let mut out = String::new();
        for word in result.segments.iter().filter(|segment| !segment.text.trim().is_empty()) {
            out.push_str(&format!(
                "[{} --> {}] {}\n",
                format::cs_to_vtt_time(word.start),
                format::cs_to_vtt_time(word.end),
                word.text.trim()
            ));
        }
        out
    } else {
        match args.format {
            OutputFormat::Txt => format!("{}\n", result.text()),
            OutputFormat::Markdown => format::format_markdown(&result.segments, &diar_segments),
            OutputFormat::Json => format::format_json(&result, &diar_segments, plan.as_ref()),
            OutputFormat::Srt => format::format_srt(&result.segments),
            OutputFormat::Vtt => format::format_vtt(&result.segments),
        }
    };

    match args.output {
        Some(path) => write_output(&rendered, &path)?,
        None => print!("{rendered}"),
    }
    Ok(())
}

/// Replace a rejected single-language model's language with the marker the CLI
/// contract documents. The unified engine reports "{engine} supports only {lang}".
fn unsupported_language_marker(err: anyhow::Error) -> anyhow::Error {
    let text = format!("{err:#}");
    if text.contains("supports only") {
        let language = text.rsplit(' ').next().unwrap_or_default().to_owned();
        return anyhow::anyhow!("unsupported_language: {language:?}");
    }
    err
}

/// Write the rendered transcript to a new file. `create_new` refuses an existing
/// path, so a previous transcript is never overwritten.
fn write_output(rendered: &str, path: &str) -> anyhow::Result<()> {
    use std::io::Write as _;
    let mut file = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)
        .map_err(|err| anyhow::anyhow!("cannot create output file {path:?}: {err}"))?;
    file.write_all(rendered.as_bytes())?;
    Ok(())
}

fn devices_command(config: AppConfig) -> anyhow::Result<()> {
    crate::engine::set_verbose(config.verbose());
    let devices: Vec<_> = crate::engine::list_gpu_devices()
        .into_iter()
        .map(|device| {
            serde_json::json!({
                "index": device.index,
                "name": device.name,
                "description": device.description,
                "type": match device.device_type {
                    crate::engine::GPUDeviceType::Gpu => "gpu",
                    crate::engine::GPUDeviceType::IntegratedGpu => "igpu",
                },
            })
        })
        .collect();
    println!("{}", serde_json::to_string_pretty(&devices)?);
    Ok(())
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
enum OutputFormat {
    /// Plain text transcript.
    Txt,
    /// Markdown with timestamped, speaker-labelled blocks.
    #[value(alias = "md")]
    Markdown,
    /// JSON document with text and timestamped segments.
    Json,
    /// SubRip subtitles.
    Srt,
    /// WebVTT subtitles.
    Vtt,
}

struct TranscribeArgs {
    model: String,
    audio: String,
    vad_model: Option<String>,
    diarize_model: Option<String>,
    chunk_seconds: Option<f64>,
    format: OutputFormat,
    output: Option<String>,
    language: Option<String>,
    detect_language: bool,
    enhance_audio: bool,
    translate: bool,
    threads: i32,
    prompt: Option<String>,
    temperature: f32,
    max_text_ctx: i32,
    word_timestamps: bool,
    max_segment_len: i32,
    best_of: i32,
    beam_size: i32,
    gpu_device: i32,
}

#[cfg(test)]
mod tests {
    use super::*;
    use clap::CommandFactory;

    fn transcribe_command_definition() -> clap::Command {
        Cli::command()
            .find_subcommand("transcribe")
            .expect("transcribe subcommand")
            .clone()
    }

    fn long_flags() -> Vec<String> {
        transcribe_command_definition()
            .get_arguments()
            .filter_map(|arg| arg.get_long().map(str::to_string))
            .collect()
    }

    #[test]
    fn transcribe_help_lists_diarization_format_and_output() {
        let flags = long_flags();
        for expected in ["diarize-model", "format", "output", "cache-dir", "chunk-seconds"] {
            assert!(flags.iter().any(|flag| flag == expected), "missing --{expected} in {flags:?}");
        }
    }

    #[test]
    fn format_defaults_to_txt_and_accepts_md_alias() {
        let cli = Cli::try_parse_from(["vibe-server", "transcribe", "model.bin", "audio.wav"]).unwrap();
        let Command::Transcribe { format, .. } = cli.command else {
            panic!("expected transcribe");
        };
        assert_eq!(format, OutputFormat::Txt);

        let cli = Cli::try_parse_from(["vibe-server", "transcribe", "model.bin", "audio.wav", "--format", "md"]).unwrap();
        let Command::Transcribe { format, .. } = cli.command else {
            panic!("expected transcribe");
        };
        assert_eq!(format, OutputFormat::Markdown);
    }

    #[test]
    fn write_output_creates_a_new_file_with_the_whole_transcript() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("transcript.md");
        let path = path.to_str().unwrap();

        write_output("# Transcript\n\nhello\n", path).unwrap();

        assert_eq!(std::fs::read_to_string(path).unwrap(), "# Transcript\n\nhello\n");
    }

    #[test]
    fn write_output_refuses_an_existing_path_and_leaves_it_unchanged() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("transcript.md");
        std::fs::write(&path, "previous").unwrap();
        let path = path.to_str().unwrap();

        let error = write_output("new", path).unwrap_err();

        assert!(error.to_string().contains(path), "error should name the path: {error}");
        assert_eq!(std::fs::read_to_string(path).unwrap(), "previous");
    }

    #[test]
    fn write_output_creates_nothing_when_the_path_is_unusable() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("missing-dir").join("transcript.md");

        assert!(write_output("new", path.to_str().unwrap()).is_err());
        assert!(!path.exists());
    }
}
