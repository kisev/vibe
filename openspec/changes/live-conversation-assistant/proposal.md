# Proposal

## Why

The app transcribes meetings, but help arrives after the call: summaries and questions are asked about a finished transcript. The server now streams segments for streaming-capable models, and the app already has configured LLM providers (Anthropic API, Ollama) plus prompts, so the material for a live assistant — "what is being discussed, what should I answer" — is already flowing through the product. What is missing is a panel that consumes it while the meeting is still running.

## What Changes

- A live assistant panel during recording: streaming transcript segments feed a bounded rolling window, and the chosen provider returns short, refreshed hints — the current topic and a suggested reply.
- Provider choice is explicit and provider-agnostic: Anthropic API, any OpenAI-compatible endpoint (vLLM, Ollama, LM Studio, llama-swap, a remote gateway), or a CLI adapter that drives an already-configured `claude`, `codex`, or `opencode` executable.
- Both sides of the conversation are heard: `start_record` already accepts several devices and merges the microphone with the system-audio loopback through ffmpeg, so the transcript the assistant reads carries the user and the other participants together; no second capture path is added.
- Audio never leaves the device: recognition stays on the local server; only transcript text is sent, and only to the provider the user selected. Local endpoints keep the whole session on the machine; the session states where text goes.
- Hints refresh on a bounded cadence (minimum interval and minimum new words), one request in flight at a time, cancelled when the recording stops; provider failures are quiet and never affect the recording.
- Hints are advisory and ephemeral: nothing is written into the transcript, nothing is sent on the user's behalf, and the panel is off until enabled.

## Capabilities

### New Capabilities

- `live-assistant`: the in-recording hint panel, its provider contract (API and CLI adapters), cadence and cancellation rules, privacy boundary, and failure isolation.

### Modified Capabilities

## Impact

- Desktop: recording pipeline subscribes to streaming segments, a new assistant panel/dock, provider settings, prompt templates, i18n.
- AI layer: a provider abstraction extended with OpenAI-compatible endpoints and CLI adapters (spawn with an argument array, prompt on stdin, timeout); the existing Anthropic and Ollama paths are reused.
- No server API change beyond streaming segments already specified; no audio upload path is introduced.
- Privacy documentation: text-to-provider disclosure, local-only option.
