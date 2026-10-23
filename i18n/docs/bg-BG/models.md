<!-- source: 674c5e6aa04b -->

# 🌟 Модели на Vibe 🌟

Добре дошли в страницата с модели на Vibe! Тук можете да намерите подбран списък с препоръчани модели за използване с Vibe. За да инсталирате модел, използвайте връзката „Magic Setup“, за да го отворите във Vibe, или копирайте и поставете директната връзка за изтегляне в настройките на Vibe.

## Налични модели

### 🌱 Модел Tiny

Компактна и ефективна версия, подходяща за бързи задачи и среди с ограничени ресурси.

[👉 Magic Setup](https://shorturl.at/XSP9R)  
[🔽 Директно изтегляне](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin?download=true)

### 🚀 Large v3 Turbo (Препоръчан)

[👉 Magic Setup](https://tinyurl.com/yphwban5)  
[🔽 Директно изтегляне](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin)

### 🦜 Parakeet TDT 0.6B v3

Поддържа поточно предаване и е най-подходящ за диктовка.

[👉 Преглед на модела](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/tree/main)  
[🔽 Изтегляне на Q4_K_M](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/resolve/main/parakeet-tdt-0.6b-v3-Q4_K_M.gguf?download=true)

### ⚡ Nemotron 3.5 ASR Streaming 0.6B

Поддържа поточно предаване и е най-подходящ за диктовка.

[👉 Преглед на модела](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf)  
[🔽 Изтегляне на Q4_K_M](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/main/nemotron-3.5-asr-streaming-0.6b-Q4_K_M.gguf?download=true)

### 🇷🇺 GigaAM v3 (руски)

Разпознаване на руска реч с главни букви и пунктуация от Salute Developers. Най-подходящ за диктовка на руски език.

[👉 Преглед на модела](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf)  
[🔽 Изтегляне на Q8_0](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/main/gigaam-v3-e2e-rnnt-Q8_0.gguf?download=true)

<details>
<summary>Ограничения на GigaAM и примери от команден ред</summary>

**Ограничения**

- Само руски език. Няма автоматично откриване на езика: `--language ru` и `--language auto` избират руски, а всеки друг език завършва с грешка `unsupported_language`.
- Не поддържа поточно предаване. Прозорецът на модела е 25 секунди и [моделът Silero VAD](https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v6.2.0.bin) е необходим за разделяне на по-дълги записи.
- Без превод и без текстова подсказка.
- Стабилните времеви маркери не се поддържат, а заявките за времеви маркери за думи се игнорират. Всеки сегмент носи времеви маркери на токените с разделителна способност 40 ms.
- Разграничаването на говорещите работи както обикновено.
- Четири варианта са публикувани под `handy-computer`: [`gigaam-v3-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf), [`gigaam-v3-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf), [`gigaam-v3-e2e-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf) и [`gigaam-v3-e2e-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf). Вариантите `e2e` добавят главни букви и пунктуация; останалите връщат текст с малки букви без пунктуация.

**Команден ред**

Изтеглете модела VAD по-горе и го подайте с `--vad-model`:

```console
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format markdown --output transcript.md
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format json
```

`--format` приема `txt` (по подразбиране), `markdown` (псевдоним `md`), `json`, `srt` и `vtt`. `--output` записва транскрипцията във файл и отказва да презапише съществуващ. Добавете `--diarize-model <diar.gguf>`, за да обозначите говорещите в изхода Markdown и JSON.

</details>

### Модели, оптимизирани за други езици

<details>
<summary>✡️ Иврит (Ivrit)</summary>

Специализиран за данни на иврит (Ivrit), оптимизиран за висока скорост и точност при задачи на иврит.

[👉 Magic Setup (Large v3 Turbo)](https://tinyurl.com/t9r3tyxk)  
[🔽 Директно изтегляне (Large v3 Turbo)](https://huggingface.co/ivrit-ai/whisper-large-v3-turbo-ggml/resolve/main/ggml-model.bin?download=true)

</details>

<details>
<summary>🇳🇴 Норвежки</summary>
	
Оптимизиран за норвежки от [AI Lab at the National Library of Norway](https://huggingface.co/NbAiLab).

[👉 Magic Setup (medium)](https://tinyurl.com/5wzb9ux8)  
[🔽 Директно изтегляне (medium)](https://huggingface.co/NbAiLab/nb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Magic Setup (large)](https://tinyurl.com/f228efbu)  
[🔽 Директно изтегляне (large)](https://huggingface.co/NbAiLab/nb-whisper-large/blob/main/ggml-model.bin?download=true)

Повече модели с по-малки размери са налични чрез [тяхната страница за изтегляне в huggingface](https://huggingface.co/NbAiLab/nb-whisper-large).  
Намерете желания размер, изтеглете файла _ggml-model.bin_, преименувайте го и го поставете в папката с модели на vibe.

</details>

<details>
<summary>🇸🇪 Шведски</summary>

Оптимизиран за шведски от [Data Lab at the National Library of Sweden](https://huggingface.co/KBLab).

[👉 Magic Setup (medium)](https://tinyurl.com/ynawnc33)  
[🔽 Директно изтегляне (medium)](https://huggingface.co/KBLab/kb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Magic Setup (large v3)](https://tinyurl.com/46dvpeky)  
[🔽 Директно изтегляне (large v3)](https://huggingface.co/KBLab/kb-whisper-large/blob/main/ggml-model.bin?download=true)

Повече модели с по-малки размери са налични чрез [тяхната страница за изтегляне в huggingface](https://huggingface.co/KBLab/kb-whisper-large).  
Намерете желания размер, изтеглете файла _ggml-model.bin_, преименувайте го и го поставете в папката с модели на vibe.

</details>
</details>

Насладете се на разглеждането на тези модели и подобряването на вашия Vibe! 🌐✨

### Искате още?

Намерете допълнителни модели тук:

[👉 Вижте още модели](https://huggingface.co/ggerganov/whisper.cpp/tree/main)

---

### Подгответе собствени модели

<details>
<summary>Преобразуване на transformers в GGML</summary>

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
