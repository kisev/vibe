# Privacy and offline design

Vibe is built so the normal transcription path needs no account and no cloud service. The app starts a local server, the server loads a model from disk, and the audio is decoded and transcribed on the same machine.

## What stays local

- Audio files, recordings, exports, and transcripts.
- The models and ffmpeg binaries.
- The project history in the projects folder.
- The local HTTP API between the desktop app and `vibe-server`, bound to loopback.

The app sends no telemetry. **Report Issue** builds a prefilled issue from local diagnostics and opens GitHub; nothing is submitted until you review and send it.

## Where the network is used

| Feature | Network contact |
| --- | --- |
| Model download | The host serving the model file |
| Transcribe from a link | The media host, and GitHub for the yt-dlp binary |
| Update check | The website channel file |
| AI summary with Claude or OpenAI | The configured provider |
| AI summary with Ollama | The Ollama URL, local by default |
| Phone handoff | An end-to-end encrypted relay between the phone and this computer |

The transcription engine itself has no network path.

## Phone handoff

The phone and desktop connect through iroh. The relay carries end-to-end encrypted traffic, so the relay forwards bytes it cannot read; transcription still happens on this computer, and Vibe must stay open for the handoff to work.

## Trade-offs

- Local models cost disk space and use the machine's CPU or GPU. [Engine and GPU choices](/vibe/docs#engine) explains the split.
- A cloud summary sends the transcript text to the provider you choose. Leave the platform on Ollama to keep it local.
- Updates are checked from static files on the website, which reveals that the app checked a channel, not what it transcribed.

## Related pages

- [Settings and config](/vibe/docs#settings) for the local config file.
- [Transcribe from your phone](/vibe/docs#transcribe-from-a-phone) for the handoff steps.
- [Summarize a transcript](/vibe/docs#summarize-transcripts) for the AI platforms.
