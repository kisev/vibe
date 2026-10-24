<!-- source: 2b80fd9e5daa -->

# 🌟 Модели Vibe 🌟

Добро пожаловать на страницу моделей Vibe! Здесь вы найдёте подобранный список рекомендуемых моделей для использования с Vibe. Чтобы установить модель, используйте ссылку «Magic Setup», чтобы открыть её в Vibe, либо скопируйте и вставьте ссылку для прямого скачивания в настройках Vibe.

## Длинные записи

Запись длиннее входного окна модели перед инференсом разбивается на фрагменты. Если включено распознавание говорящих, разбиение следует за обнаруженными репликами, поэтому один фрагмент никогда не смешивает двух говорящих — кроме мест, где их реплики смыкаются; такие строки показывают обоих говорящих со знаком «?», и их можно назначить одному из них. GigaAM (25 s), Parakeet (30 s) и Nemotron (30 s) разбиваются так; Whisper сохраняет собственную обработку длинных записей.

Готовые фрагменты сохраняются на вашем компьютере, поэтому при повторном запуске длинного файла с теми же настройками обработка продолжится с того места, где остановилась. Кэш хранит текст транскрипции, план фрагментов и отметку модели — но никогда не аудио — и никогда не покидает ваше устройство. При запуске приложение удаляет записи, к которым не обращались 30 дней. В командной строке включите его с помощью `--cache-dir <folder>` и удалите эту папку, чтобы очистить кэш; `--chunk-seconds <n>` задаёт планируемую длину и не может превышать окно модели.

## Доступные модели

### 🌱 Модель Tiny

Компактная и эффективная версия, подходящая для быстрых задач и сред с ограниченными ресурсами.

[👉 Магическая настройка](https://shorturl.at/XSP9R)  
[🔽 Прямая загрузка](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin?download=true)

### 🚀 Large v3 Turbo (рекомендуется)

[👉 Магическая настройка](https://tinyurl.com/yphwban5)  
[🔽 Прямая загрузка](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin)

### 🦜 Parakeet TDT 0.6B v3

Поддерживает потоковую обработку и лучше всего подходит для диктовки.

[👉 Посмотреть модель](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/tree/main)  
[🔽 Скачать Q4_K_M](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/resolve/main/parakeet-tdt-0.6b-v3-Q4_K_M.gguf?download=true)

### ⚡ Nemotron 3.5 ASR Streaming 0.6B

Поддерживает потоковую обработку и лучше всего подходит для диктовки.

[👉 Посмотреть модель](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf)  
[🔽 Скачать Q4_K_M](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/main/nemotron-3.5-asr-streaming-0.6b-Q4_K_M.gguf?download=true)

### 🇷🇺 GigaAM v3 (русский)

Распознавание русской речи с заглавными буквами и знаками препинания от Salute Developers. Лучше всего подходит для диктовки на русском языке.

[👉 Посмотреть модель](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf)  
[🔽 Скачать Q8_0](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/main/gigaam-v3-e2e-rnnt-Q8_0.gguf?download=true)

<details>
<summary>Ограничения GigaAM и примеры командной строки</summary>

**Ограничения**

- Только русский язык. Автоопределения языка нет: `--language ru` и `--language auto` оба выбирают русский, а любой другой язык завершается ошибкой `unsupported_language`.
- Потоковая обработка не поддерживается. Окно модели — 25 секунд, а для разделения длинных записей требуется [модель Silero VAD](https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v6.2.0.bin).
- Нет перевода и нет текстовой подсказки.
- Стабильные метки времени не поддерживаются, а запросы меток времени для слов игнорируются. Каждый сегмент содержит метки времени токенов с разрешением 40 мс.
- Разделение по говорящим работает как обычно.
- Под `handy-computer` опубликованы четыре варианта: [`gigaam-v3-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf), [`gigaam-v3-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf), [`gigaam-v3-e2e-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf) и [`gigaam-v3-e2e-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf). Варианты `e2e` добавляют заглавные буквы и знаки препинания; остальные возвращают текст в нижнем регистре без знаков препинания.

**Командная строка**

Скачайте модель VAD, указанную выше, и передайте её с помощью `--vad-model`:

```console
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format markdown --output transcript.md
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format json
```

`--format` принимает `txt` (по умолчанию), `markdown` (псевдоним `md`), `json`, `srt` и `vtt`. `--output` записывает транскрипцию в файл и отказывается перезаписывать существующий. Добавьте `--diarize-model <diar.gguf>`, чтобы отметить говорящих в выводе Markdown и JSON.

</details>

### Модели, оптимизированные для других языков

<details>
<summary>✡️ Иврит (Ivrit)</summary>

Специализирована на данных иврита (Ivrit), оптимизирована для высокой скорости и точности в задачах на иврите.

[👉 Магическая настройка (Large v3 Turbo)](https://tinyurl.com/t9r3tyxk)  
[🔽 Прямая загрузка (Large v3 Turbo)](https://huggingface.co/ivrit-ai/whisper-large-v3-turbo-ggml/resolve/main/ggml-model.bin?download=true)

</details>

<details>
<summary>🇳🇴 Норвежский</summary>
	
Оптимизирована для норвежского языка [лабораторией ИИ Национальной библиотеки Норвегии](https://huggingface.co/NbAiLab).

[👉 Магическая настройка (medium)](https://tinyurl.com/5wzb9ux8)  
[🔽 Прямая загрузка (medium)](https://huggingface.co/NbAiLab/nb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Магическая настройка (large)](https://tinyurl.com/f228efbu)  
[🔽 Прямая загрузка (large)](https://huggingface.co/NbAiLab/nb-whisper-large/blob/main/ggml-model.bin?download=true)

Больше моделей меньшего размера доступно на [странице скачивания на huggingface](https://huggingface.co/NbAiLab/nb-whisper-large).  
Найдите нужный размер, скачайте файл _ggml-model.bin_, переименуйте файл и поместите его в папку моделей vibe.

</details>

<details>
<summary>🇸🇪 Шведский</summary>

Оптимизирована для шведского языка [Data Lab Национальной библиотеки Швеции](https://huggingface.co/KBLab).

[👉 Магическая настройка (medium)](https://tinyurl.com/ynawnc33)  
[🔽 Прямая загрузка (medium)](https://huggingface.co/KBLab/kb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Магическая настройка (large v3)](https://tinyurl.com/46dvpeky)  
[🔽 Прямая загрузка (large v3)](https://huggingface.co/KBLab/kb-whisper-large/blob/main/ggml-model.bin?download=true)

Больше моделей меньшего размера доступно на [странице скачивания на huggingface](https://huggingface.co/KBLab/kb-whisper-large).  
Найдите нужный размер, скачайте файл _ggml-model.bin_, переименуйте файл и поместите его в папку моделей vibe.

</details>
</details>

Наслаждайтесь исследованием этих моделей и делайте Vibe ещё лучше! 🌐✨

### Хотите больше?

Дополнительные модели можно найти здесь:

[👉 Смотреть больше моделей](https://huggingface.co/ggerganov/whisper.cpp/tree/main)

---

### Подготовьте свои собственные модели

<details>
<summary>Преобразование transformers в GGML</summary>

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
