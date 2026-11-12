# Settings and config

Settings live in `app_config.json` in the app config directory. The file is meant to be read and edited: Vibe watches it and applies an outside change without a restart. **Settings → Agents → Config file** opens it.

## Config file location

| Platform | Directory |
| --- | --- |
| macOS | `~/Library/Application Support/github.com.thewh1teagle.vibe` |
| Windows | `%appdata%\github.com.thewh1teagle.vibe` |
| Linux | `~/.config/github.com.thewh1teagle.vibe` |

The directory keeps its upstream identifier, so the name is unchanged from earlier builds.

## Settings sections

| Section | Holds |
| --- | --- |
| General | Display language, theme, updates, close-to-tray, launch at startup, prevent sleep |
| Privacy | Whether projects are saved, and the privacy policy |
| Transcription | Language, auto-export, finish sound and focus, projects folder |
| Models | CPU/GPU choice, GPU device, model catalog, speaker-separation model |
| Tuning | Whisper options, audio processing, model memory and unload timeout |
| Recording | Meeting browser, meeting detection, auto-transcribe, recording shortcut, permissions on macOS |
| Dictation | Dictation shortcut and activation mode |
| AI | Summaries and dictation tasks, platform connection |
| Phone | Phone handoff, pairing, paired devices |
| Agents | Local API, agent skill, config file |
| Advanced | Logs, diagnostics, and developer controls |

## Values worth knowing

| Key group | Meaning |
| --- | --- |
| `transcription.*` | Language, prompt, diarization, timestamps, long-recording chunking |
| `model.*` | Selected model, display names, GPU device, CPU-only switch, unload timeout |
| `transcript.*` | Export format, timestamps, speakers, auto-export |
| `recording.*` | Input and output devices, meeting detection, recording shortcut |
| `ai.*` | Platform, base URL, key, model, per-task prompt and switches |
| `general.updateChannel` | `stable`, `beta`, or `dev` |
| `handoff.pairing` | Paired phone devices and credential hashes |

The exact field names are stable enough to edit, but the app owns the schema: change a value through the settings UI when one exists, and let the app rewrite the file rather than replacing it whole.

## Related pages

- [Switch update channels](/vibe/docs#switch-update-channels) for the channel setting.
- [Summarize a transcript](/vibe/docs#summarize-transcripts) for the AI connection.
- [Transcribe from your phone](/vibe/docs#transcribe-from-a-phone) for the handoff settings.
