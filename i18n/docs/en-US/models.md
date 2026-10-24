# 🌟 Vibe Models 🌟

Welcome to the Vibe Models page! Here you can find a curated list of suggested models to use with Vibe. To install a model, use the "Magic Setup" link to open it in Vibe, or copy and paste the direct download link in Vibe settings.

## Long recordings

A recording longer than a model's input window is split into chunks before inference. With speaker recognition enabled, the split follows the detected turns, so one chunk never mixes two speakers except where their turns meet — those lines show both speakers with a "?" and can be given to one of them. GigaAM (25 s), Parakeet (30 s), and Nemotron (30 s) split this way; Whisper keeps its own long-form handling.

Finished chunks are kept on your computer, so re-running a long file with the same settings resumes from where it stopped. The cache holds transcript text, the chunk plan, and a model stamp — never the audio — and never leaves your device. The app deletes entries untouched for 30 days when it starts. On the command line, opt in with `--cache-dir <folder>` and delete that folder to clear it; `--chunk-seconds <n>` sets the planned length and cannot exceed the model's window.

## Available Models

### 🌱 Tiny Model

A compact and efficient version, suitable for quick tasks and limited-resource environments.

[👉 Magic Setup](https://shorturl.at/XSP9R)  
[🔽 Direct Download](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin?download=true)

### 🚀 Large v3 Turbo (Recommended)

[👉 Magic Setup](https://tinyurl.com/yphwban5)  
[🔽 Direct Download](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin)

### 🦜 Parakeet TDT 0.6B v3

Supports streaming and is best suited for dictation.

[👉 View Model](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/tree/main)  
[🔽 Download Q4_K_M](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/resolve/main/parakeet-tdt-0.6b-v3-Q4_K_M.gguf?download=true)

### ⚡ Nemotron 3.5 ASR Streaming 0.6B

Supports streaming and is best suited for dictation.

[👉 View Model](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf)  
[🔽 Download Q4_K_M](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/main/nemotron-3.5-asr-streaming-0.6b-Q4_K_M.gguf?download=true)

### 🇷🇺 GigaAM v3 (Russian)

Russian speech recognition with capitalization and punctuation, by Salute Developers. Best suited for Russian dictation.

[👉 View Model](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf)  
[🔽 Download Q8_0](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/main/gigaam-v3-e2e-rnnt-Q8_0.gguf?download=true)

<details>
<summary>GigaAM limitations and command-line examples</summary>

**Limitations**

- Russian only. There is no language auto-detect: `--language ru` and `--language auto` both select Russian, and any other language fails with `unsupported_language`.
- Not streaming. The model window is 25 seconds, and the [Silero VAD model](https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v6.2.0.bin) is required to split longer recordings.
- No translation and no text prompt.
- Stable timestamps are unsupported, and word-timestamp requests are ignored. Each segment carries token timestamps at 40 ms resolution.
- Speaker diarization works as usual.
- Four variants are published under `handy-computer`: [`gigaam-v3-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf), [`gigaam-v3-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf), [`gigaam-v3-e2e-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf), and [`gigaam-v3-e2e-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf). The `e2e` variants add capitalization and punctuation; the others return lowercase text without punctuation.

**Command line**

Download the VAD model above and pass it with `--vad-model`:

```console
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format markdown --output transcript.md
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format json
```

`--format` accepts `txt` (default), `markdown` (alias `md`), `json`, `srt`, and `vtt`. `--output` writes the transcript to a file and refuses to overwrite an existing one. Add `--diarize-model <diar.gguf>` to label speakers in Markdown and JSON output.

</details>

### Models optimised for other languages

<details>
<summary>✡️ Hebrew (Ivrit)</summary>

Specialized for Hebrew (Ivrit) language data, optimized for high speed and accuracy in Hebrew tasks.

[👉 Magic Setup (Large v3 Turbo)](https://tinyurl.com/t9r3tyxk)  
[🔽 Direct Download (Large v3 Turbo)](https://huggingface.co/ivrit-ai/whisper-large-v3-turbo-ggml/resolve/main/ggml-model.bin?download=true)

**Parakeet TDT 0.6B v3 Hebrew**: a Hebrew fine-tune of Parakeet TDT 0.6B v3. Best suited for dictation.

[👉 View Model](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-he-gguf)  
[🔽 Download Q8_0](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-he-gguf/resolve/main/parakeet-tdt-0.6b-v3-he-q8_0.gguf?download=true)

</details>

<details>
<summary>🇳🇴 Norwegian</summary>
	
Optimised for Norwegian by the [AI Lab at the National Library of Norway](https://huggingface.co/NbAiLab).

[👉 Magic Setup (medium)](https://tinyurl.com/5wzb9ux8)  
[🔽 Direct Download (medium)](https://huggingface.co/NbAiLab/nb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Magic Setup (large)](https://tinyurl.com/f228efbu)  
[🔽 Direct Download (large)](https://huggingface.co/NbAiLab/nb-whisper-large/blob/main/ggml-model.bin?download=true)

More models of smaller sizes are available via [their huggingface download page](https://huggingface.co/NbAiLab/nb-whisper-large).  
Find the size you want, download the _ggml-model.bin_ file, rename the file, and palce it in vibe's model folder.

</details>

<details>
<summary>🇸🇪 Swedish</summary>

Optimised for Swedish by the [Data Lab at the National Library of Sweden](https://huggingface.co/KBLab).

[👉 Magic Setup (medium)](https://tinyurl.com/ynawnc33)  
[🔽 Direct Download (medium)](https://huggingface.co/KBLab/kb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Magic Setup (large v3)](https://tinyurl.com/46dvpeky)  
[🔽 Direct Download (large v3)](https://huggingface.co/KBLab/kb-whisper-large/blob/main/ggml-model.bin?download=true)

More models of smaller sizes are available via [their huggingface download page](https://huggingface.co/KBLab/kb-whisper-large).  
Find the size you want, download the _ggml-model.bin_ file, rename the file, and palce it in vibe's model folder.

</details>
</details>

Enjoy exploring these models and enhancing your Vibe! 🌐✨

### Want More?

Find additional models here:

[👉 See More Models](https://huggingface.co/ggerganov/whisper.cpp/tree/main)

---

### Prepare your own models

<details>
<summary>Convert transformers to GGML</summary>

```console
# Setup environment
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
uv venv
uv pip install torch transformers huggingface_hub
huggingface-cli login --token "token" # https://huggingface.co/settings/tokens

# Convert and upload
git clone https://github.com/openai/whisper
git clone https://github.com/ggml-org/whisper.cpp
git clone https://huggingface.co/ivrit-ai/whisper-large-v3-turbo
uv run ./whisper.cpp/models/convert-h5-to-ggml.py ./whisper-large-v3-turbo/ ./whisper .
uv run huggingface-cli upload --repo-type model whisper-large-v3-turbo-ivrit ./ggml-model.bin ./ggml-model.bin

# Quantize
sudo apt install cmake build-essential -y
cd whisper.cpp
cmake -B build
cmake --build build --config Release
cd ..
./whisper.cpp/build/bin/quantize ggml-model.bin ./ggml-model.int8.bin q8_0 # fp32/fp16/q8_0/q5_0
```

</details>
