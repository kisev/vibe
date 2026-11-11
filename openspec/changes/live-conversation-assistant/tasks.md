# Tasks

## 1. Session pipeline

- [ ] 1.1 Subscribe the assistant to transcription segment events while a recording runs and maintain the rolling window plus digest state; verify with a fake event stream that the window keeps the last N minutes and clears on stop
- [ ] 1.2 Build the hint prompt with transcript text delimited as data and the requested output shape (topic + 1–3 replies, transcript language); verify snapshot tests for the prompt shape and that transcript text cannot alter the system section
- [ ] 1.3 Add the throttle and generation counter (minimum interval, minimum new words, one in flight, stale response discarded, abort on stop); verify with fake timers and a slow provider
- [ ] 1.4 Verify both sides: record with the microphone and the system-audio loopback selected, confirm `start_record` merges them and the assistant's window includes the other participants; when only one side is selected, the panel says so

## 2. Providers

- [ ] 2.1 Define the provider interface and implement the Anthropic adapter, reusing the existing key handling; verify a mocked Messages API response renders as a hint
- [ ] 2.2 Implement the OpenAI-compatible adapter (base URL + model) for vLLM/Ollama/LM Studio/llama-swap; verify against a mocked chat-completions server, including a non-streaming error body
- [ ] 2.3 Implement the CLI adapter (argument array, prompt on stdin, hard timeout, kill on timeout/cancel) and verify it with a stub executable that answers, sleeps forever, and exits non-zero
- [ ] 2.4 Add provider settings (kind, endpoint, model, key, CLI command) with validation and a connection test; verify each kind saves, reopens, and reports a failed test without crashing

## 3. Panel

- [ ] 3.1 Add the collapsible assistant dock to the recording view with hint fields, last refresh time, provider name, and the local/remote disclosure line; verify component tests for empty, loading, hint, and error states
- [ ] 3.2 Persist only the assistant-enabled preference and session request counter; verify hints and transcript text are not written to disk or logs

## 4. Privacy and strings

- [ ] 4.1 Document the text-to-provider disclosure and the local-only configuration in the privacy page and the assistant settings; verify the copy names what is sent and where
- [ ] 4.2 Add the new UI strings in en-US and translate them through the normal flow; verify `task i18n:audit` passes

## 5. Validation

- [ ] 5.1 End-to-end check in a dev build with a local OpenAI-compatible endpoint: record a conversation and verify hints refresh at the intended cadence with no network egress
- [ ] 5.2 End-to-end check with a remote provider and a CLI provider; verify the disclosure appears, failures are quiet, and stopping the recording cancels requests
- [ ] 5.3 Live acceptance: run a real call with the assistant and report whether the hints are timely, relevant, and cheap enough, and whether the panel placement works during a meeting; adjust before archiving
