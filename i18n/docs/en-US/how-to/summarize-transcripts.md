# Summarize a transcript

Vibe can turn a finished transcript into a summary, notes, or a translation. The request goes to the AI platform you configure: a local Ollama model, Claude, or any OpenAI-compatible endpoint. [Settings and config](/vibe/docs#settings) lists where the connection is stored.

## Use a local Ollama model

1. Install [Ollama](https://ollama.com) and pull a model, for example `ollama pull llama3.1`.
1. Open **Settings → AI**.
1. Set **Platform** to **Ollama**. The default URL is `http://localhost:11434`.
1. Pick the model name.
1. Turn on **Summaries**, and optionally **Auto summarize on finish**.

Ollama runs on this machine, so the transcript stays local.

## Use Claude or an OpenAI-compatible endpoint

1. Open **Settings → AI** and choose the platform.
1. Paste the API key, and change the base URL if the endpoint is not the default.
1. Pick the model.
1. Turn on **Summaries**.

For a non-default endpoint, the base URL and key are the connection the app uses for both summaries and dictation.

## Summarize

1. Finish a transcription.
1. Open the summary action in the transcript view.
1. Pick a preset and, if needed, edit the prompt.
1. Run it; the result is saved with the project and can be exported beside the transcript.

With **Auto summarize on finish** enabled, the summary runs as soon as a transcription completes.

## Next steps

- [Settings and config](/vibe/docs#settings) for the config file and the settings sections.
- [Privacy and offline design](/vibe/docs#privacy) for which platforms keep the text on the machine.
