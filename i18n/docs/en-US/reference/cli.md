# Command line

The `vibe` executable is the desktop app. When it receives any argument except `--hidden`, it forwards the arguments to the bundled `vibe-server` and prints that process's output, so the CLI and the window use the same engine and models.

The server binary is `vibe-server`; a development checkout can call it directly. `--help` on either entry point prints the current flags.

## Subcommands

| Command | Purpose |
| --- | --- |
| `transcribe <model> <audio>` | Transcribe one file and print or write the result |
| `serve [model]` | Start the local HTTP server, with Swagger docs |
| `pull <url>` | Download a model or other file |
| `devices` | List GPU devices as JSON |

## Transcribe options

| Option | Effect |
| --- | --- |
| `--format <txt\|markdown\|md\|json\|srt\|vtt>` | Output format; default `txt` |
| `--output <path>` | Write to a new file; refuses to overwrite |
| `-l`, `--language <code>` | Language code |
| `--detect-language` | Detect the language |
| `--translate` | Translate to English where the model supports it |
| `--vad-model <path>` | Silero VAD model, required by some families for long audio |
| `--diarize-model <path>` | Speaker diarization model |
| `--prompt <text>` | Initial prompt, for models that use one |
| `--word-timestamps` | Emit word-level timestamps where supported |
| `--threads <n>` | CPU threads |
| `--gpu-device <n>` | GPU device index, 1-based; `0` or negative means auto |
| `--cache-dir <dir>` | Keep finished chunks so an interrupted run resumes |
| `--chunk-seconds <n>` | Planned chunk length, capped by the model window |

`--enhance-audio`, `--temperature`, `--max-text-ctx`, `--max-segment-len`, `--best-of`, and `--beam-size` tune the engine; run `--help` for their defaults.

## Serve options

| Option | Effect |
| --- | --- |
| `--host <ip>` | Bind address; default `127.0.0.1` |
| `-p`, `--port <port>` | Port; `0` picks a free one |
| `--exit-with-parent` | Stop with the parent process |
| `--unload-timeout <value>` | Unload an idle model |
| `--cache-dir <dir>` | Chunk cache directory |

**Settings → Agents** starts the same server from the app and links to its Swagger docs.

## Examples

```console
vibe transcribe model.gguf recording.wav --format srt --output recording.srt
vibe transcribe model.gguf recording.wav --language ru --vad-model ggml-silero-v6.2.0.bin
vibe devices
vibe serve --port 0
```

## Related pages

- [Models](/vibe/docs#models) for model choices and per-family limits.
- [Supported formats](/vibe/docs#formats) for input extensions and export formats.
