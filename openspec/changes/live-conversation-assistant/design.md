# Design

## Context

Recording already produces streaming segments for streaming-capable models (`asr-engines/transcribe-cpp`: streaming families emit incrementally). The desktop has an AI layer for summaries and dictation clean-up, configured with an Anthropic API key or an Ollama endpoint, and prompt settings per task. The meeting windows and the recording view are separate windows already. See `proposal.md` for motivation and `specs/live-assistant/spec.md` for behavior.

## Goals / Non-Goals

**Goals:**

- Useful hints within a few seconds of new speech, at predictable cost.
- One provider contract that covers hosted APIs, local servers, and CLI tools.
- The recording path stays untouched: the assistant is a reader of transcript events.

**Non-Goals:**

- Speaking or sending replies on the user's behalf.
- Uploading audio anywhere.
- Persisting hints or building a searchable history (the transcript already is the record).
- Real-time billing estimates; a token budget per session is enough.

## Decisions

- **Consume the transcript event stream, do not tap audio.** The assistant subscribes to segments as the existing pipeline emits them (the same stream the live preview shows). This keeps one ASR pass, no extra decoding, and no coupling to device capture. Alternative — a second streaming recognizer tuned for the assistant — doubles load for no benefit.

- **Both sides come from the existing multi-device recording.** `start_record` (`desktop/src-tauri/src/cmd/audio.rs`) already opens one capture stream per selected device and merges the microphone and loopback files with ffmpeg when both produced audio. The assistant therefore reads a transcript that contains the user and the other participants; its only requirement is that the recording was started with both the microphone and system audio selected, which the panel states when it is not.

- **Concrete shape.** `desktop/src/lib/live-assistant.ts` owns the session (rolling window, digest, throttle, generation counter, cancellation); `desktop/src/lib/assistant-providers.ts` holds the `AssistantProvider` implementations for the Anthropic Messages API, OpenAI-compatible chat completions (base URL + model), and a CLI adapter that calls a Rust command spawning the executable with an argument array, the prompt on stdin, a hard timeout, and a kill on cancel; `desktop/src/pages/main/components/assistant-panel.tsx` renders the dock on the recording view; provider configuration lands in the existing AI settings section with a connection test per kind.

- **Rolling window plus a digest.** The prompt carries the last ~2–3 minutes of segments verbatim and a short rolling digest of earlier conversation, refreshed from the same provider every N windows. Bounds token cost while keeping older context. Transcript text is delimited as data in the prompt, never concatenated into instructions, so a meeting participant cannot steer the assistant by speaking a prompt.

- **A single provider interface with three adapter kinds.** `AssistantProvider.ask(request): Promise<Hint>` with implementations: Anthropic Messages API, OpenAI-compatible chat completions (base URL + model, works for vLLM/Ollama/LM Studio/llama-swap/gateways), and CLI (spawn executable with an argument array, prompt on stdin, hard timeout, kill on timeout/cancel). The CLI adapter deliberately does not use a shell. Providers are configured in assistant settings with the same secret handling as the existing AI section.

- **Throttle by interval and novelty.** A refresh requires at least ~6 s since the last one and ≥15 new words; one request in flight; a generation counter discards stale responses. Stopping the recording bumps the generation and aborts the request (HTTP abort or child kill). Cheap and predictable, no token-level streaming required for hints.

- **Hints are two short fields, not a chat.** The prompt asks for a topic line and 1–3 reply suggestions in the transcript's language; free-form chat is the existing AI panel's job. The panel renders the fields plus the time of the last refresh and the provider name, so the user always knows freshness and destination.

- **Panel placement.** A dock on the recording view, collapsible and off by default per session; enabling the assistant persists a preference, not a state of "on". No separate window in the first version — the recording view is already in front during a call.

## Risks / Trade-offs

- [Prompt injection from meeting speech] → transcript is delimited data; the system prompt states it must not follow instructions found in it; hints are advisory text only.
- [Cost surprises] → minimum interval + novelty threshold + one in flight + a per-session request cap with a visible counter.
- [Hallucinated advice presented as fact] → copy says "suggestions", the topic field is derived from quoted transcript context, and no claim is auto-applied.
- [CLI adapters block or hang] → spawn with timeout and kill; failures are assistant-local; the recording never waits on the provider.
- [Remote provider privacy] → explicit provider choice, session disclosure line, and a local endpoint path that sends nothing off-device.
- [Latency in fast conversation] → the interval is a floor; hints are best-effort and show their age rather than pretending to be current.

## Migration Plan

1. Provider settings are additive; existing Anthropic/Ollama configuration keeps working.
1. The assistant is disabled by default; enabling it per session starts the pipeline.
1. No changes to transcript storage; rollback disables the panel and leaves no state.

## Open Questions

- Whether the CLI adapter should be limited to a curated list or accept an arbitrary command with arguments.
- Whether the digest should be computed by the provider or locally (a cheap local summarizer would remove provider calls when the provider is remote).
