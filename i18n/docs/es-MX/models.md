<!-- source: 674c5e6aa04b -->

# 🌟 Modelos de Vibe 🌟

¡Bienvenido a la página de Modelos de Vibe! Aquí encontrarás una lista curada de modelos sugeridos para usar con Vibe. Para instalar un modelo, usa el enlace "Configuración mágica" para abrirlo en Vibe, o copia y pega el enlace de descarga directa en la configuración de Vibe.

## Modelos disponibles

### 🌱 Modelo Tiny

Una versión compacta y eficiente, adecuada para tareas rápidas y entornos con recursos limitados.

[👉 Configuración mágica](https://shorturl.at/XSP9R)  
[🔽 Descarga directa](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin?download=true)

### 🚀 Large v3 Turbo (Recomendado)

[👉 Configuración mágica](https://tinyurl.com/yphwban5)  
[🔽 Descarga directa](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin)

### 🦜 Parakeet TDT 0.6B v3

Admite streaming y es ideal para dictado.

[👉 Ver modelo](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/tree/main)  
[🔽 Descargar Q4_K_M](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/resolve/main/parakeet-tdt-0.6b-v3-Q4_K_M.gguf?download=true)

### ⚡ Nemotron 3.5 ASR Streaming 0.6B

Admite streaming y es ideal para dictado.

[👉 Ver modelo](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf)  
[🔽 Descargar Q4_K_M](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/main/nemotron-3.5-asr-streaming-0.6b-Q4_K_M.gguf?download=true)

### 🇷🇺 GigaAM v3 (ruso)

Reconocimiento de voz en ruso con mayúsculas y puntuación, de Salute Developers. Ideal para dictado en ruso.

[👉 Ver modelo](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf)  
[🔽 Descargar Q8_0](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/main/gigaam-v3-e2e-rnnt-Q8_0.gguf?download=true)

<details>
<summary>Limitaciones de GigaAM y ejemplos de línea de comandos</summary>

**Limitaciones**

- Solo ruso. No hay detección automática del idioma: `--language ru` y `--language auto` seleccionan ruso, y cualquier otro idioma falla con `unsupported_language`.
- No es streaming. La ventana del modelo es de 25 segundos y se requiere el [modelo Silero VAD](https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v6.2.0.bin) para dividir grabaciones más largas.
- Sin traducción y sin indicaciones de texto.
- Las marcas de tiempo estables no son compatibles y las solicitudes de marcas de tiempo por palabra se ignoran. Cada segmento incluye marcas de tiempo por token con una resolución de 40 ms.
- La diarización de hablantes funciona con normalidad.
- Hay cuatro variantes publicadas en `handy-computer`: [`gigaam-v3-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf), [`gigaam-v3-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf), [`gigaam-v3-e2e-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf) y [`gigaam-v3-e2e-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf). Las variantes `e2e` añaden mayúsculas y puntuación; las demás devuelven texto en minúsculas y sin puntuación.

**Línea de comandos**

Descarga el modelo VAD mencionado arriba y pásalo con `--vad-model`:

```console
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format markdown --output transcript.md
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format json
```

`--format` acepta `txt` (predeterminado), `markdown` (alias `md`), `json`, `srt` y `vtt`. `--output` escribe la transcripción en un archivo y se niega a sobrescribir uno existente. Añade `--diarize-model <diar.gguf>` para etiquetar a los hablantes en la salida Markdown y JSON.

</details>

### Modelos optimizados para otros idiomas

<details>
<summary>✡️ Hebreo (Ivrit)</summary>

Especializado en datos del idioma hebreo (Ivrit), optimizado para alta velocidad y precisión en tareas en hebreo.

[👉 Configuración mágica (Large v3 Turbo)](https://tinyurl.com/t9r3tyxk)  
[🔽 Descarga directa (Large v3 Turbo)](https://huggingface.co/ivrit-ai/whisper-large-v3-turbo-ggml/resolve/main/ggml-model.bin?download=true)

</details>

<details>
<summary>🇳🇴 Noruego</summary>
	
Optimizado para noruego por el [AI Lab de la Biblioteca Nacional de Noruega](https://huggingface.co/NbAiLab).

[👉 Configuración mágica (medium)](https://tinyurl.com/5wzb9ux8)  
[🔽 Descarga directa (medium)](https://huggingface.co/NbAiLab/nb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Configuración mágica (large)](https://tinyurl.com/f228efbu)  
[🔽 Descarga directa (large)](https://huggingface.co/NbAiLab/nb-whisper-large/blob/main/ggml-model.bin?download=true)

Hay más modelos de tamaños más pequeños disponibles en [su página de descargas de huggingface](https://huggingface.co/NbAiLab/nb-whisper-large).  
Encuentra el tamaño que quieras, descarga el archivo _ggml-model.bin_, renómbralo y colócalo en la carpeta de modelos de Vibe.

</details>

<details>
<summary>🇸🇪 Sueco</summary>

Optimizado para sueco por el [Data Lab de la Biblioteca Nacional de Suecia](https://huggingface.co/KBLab).

[👉 Configuración mágica (medium)](https://tinyurl.com/ynawnc33)  
[🔽 Descarga directa (medium)](https://huggingface.co/KBLab/kb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Configuración mágica (large v3)](https://tinyurl.com/46dvpeky)  
[🔽 Descarga directa (large v3)](https://huggingface.co/KBLab/kb-whisper-large/blob/main/ggml-model.bin?download=true)

Hay más modelos de tamaños más pequeños disponibles en [su página de descargas de huggingface](https://huggingface.co/KBLab/kb-whisper-large).  
Encuentra el tamaño que quieras, descarga el archivo _ggml-model.bin_, renómbralo y colócalo en la carpeta de modelos de Vibe.

</details>
</details>

¡Disfruta explorando estos modelos y mejorando tu Vibe! 🌐✨

### ¿Quieres más?

Encuentra modelos adicionales aquí:

[👉 Ver más modelos](https://huggingface.co/ggerganov/whisper.cpp/tree/main)

---

### Prepara tus propios modelos

<details>
<summary>Convertir transformers a GGML</summary>

```console
# Configurar entorno
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
uv venv
uv pip install torch transformers huggingface_hub
huggingface-cli login --token "token" # https://huggingface.co/settings/tokens

# Convertir y subir
git clone https://github.com/openai/whisper
git clone https://github.com/ggml-org/whisper.cpp
git clone https://huggingface.co/ivrit-ai/whisper-large-v3-turbo
uv run ./whisper.cpp/models/convert-h5-to-ggml.py ./whisper-large-v3-turbo/ ./whisper .
uv run huggingface-cli upload --repo-type model whisper-large-v3-turbo-ivrit ./ggml-model.bin ./ggml-model.bin

# Cuantizar
sudo apt install cmake build-essential -y
cd whisper.cpp
cmake -B build
cmake --build build --config Release
cd ..
./whisper.cpp/build/bin/quantize ggml-model.bin ./ggml-model.int8.bin q8_0 # fp32/fp16/q8_0/q5_0
```

</details>
