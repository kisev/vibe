<!-- source: 674c5e6aa04b -->

# 🌟 Modely Vibe 🌟

Vítejte na stránce Modely Vibe! Najdete zde pečlivě vybraný seznam doporučených modelů pro použití s Vibe. Model nainstalujete pomocí odkazu „Magic Setup“, který jej otevře přímo ve Vibe, nebo zkopírováním a vložením přímého odkazu ke stažení do nastavení Vibe.

## Dostupné modely

### 🌱 Model Tiny

Kompaktní a efektivní verze, vhodná pro rychlé úkoly a prostředí s omezenými zdroji.

[👉 Rychlé nastavení](https://shorturl.at/XSP9R)  
[🔽 Přímé stažení](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin?download=true)

### 🚀 Large v3 Turbo (Doporučeno)

[👉 Rychlé nastavení](https://tinyurl.com/yphwban5)  
[🔽 Přímé stažení](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin)

### 🦜 Parakeet TDT 0.6B v3

Podporuje streamování a nejlépe se hodí pro diktování.

[👉 Zobrazit model](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/tree/main)  
[🔽 Stáhnout Q4_K_M](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/resolve/main/parakeet-tdt-0.6b-v3-Q4_K_M.gguf?download=true)

### ⚡ Nemotron 3.5 ASR Streaming 0.6B

Podporuje streamování a nejlépe se hodí pro diktování.

[👉 Zobrazit model](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf)  
[🔽 Stáhnout Q4_K_M](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/main/nemotron-3.5-asr-streaming-0.6b-Q4_K_M.gguf?download=true)

### 🇷🇺 GigaAM v3 (Ruština)

Rozpoznávání ruské řeči s velkými písmeny a interpunkcí od Salute Developers. Nejlépe se hodí pro ruské diktování.

[👉 Zobrazit model](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf)  
[🔽 Stáhnout Q8_0](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/main/gigaam-v3-e2e-rnnt-Q8_0.gguf?download=true)

<details>
<summary>Omezení GigaAM v3 a příklady příkazového řádku</summary>

**Omezení**

- Pouze ruština. Automatická detekce jazyka neexistuje: `--language ru` i `--language auto` vyberou ruštinu a jakýkoli jiný jazyk selže s `unsupported_language`.
- Nepodporuje streamování. Okno modelu je 25 sekund a pro rozdělení delších nahrávek je vyžadován [model Silero VAD](https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v6.2.0.bin).
- Žádný překlad a žádná textová výzva.
- Stabilní časové značky nejsou podporovány a požadavky na časové značky slov se ignorují. Každý segment nese časové značky tokenů s rozlišením 40 ms.
- Diarizace mluvčích funguje jako obvykle.
- Pod `handy-computer` jsou publikovány čtyři varianty: [`gigaam-v3-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf), [`gigaam-v3-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf), [`gigaam-v3-e2e-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf) a [`gigaam-v3-e2e-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf). Varianty `e2e` přidávají velká písmena a interpunkci; ostatní vracejí text malými písmeny bez interpunkce.

**Příkazový řádek**

Stáhněte výše uvedený VAD model a předejte jej pomocí `--vad-model`:

```console
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format markdown --output transcript.md
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format json
```

`--format` přijímá `txt` (výchozí), `markdown` (alias `md`), `json`, `srt` a `vtt`. `--output` zapíše přepis do souboru a odmítne přepsat existující soubor. Přidejte `--diarize-model <diar.gguf>` pro označení mluvčích ve výstupu Markdown a JSON.

</details>

### Modely optimalizované pro jiné jazyky

<details>
<summary>✡️ Hebrejština (Ivrit)</summary>

Specializovaný na hebrejská (ivrit) jazyková data, optimalizovaný pro vysokou rychlost a přesnost při hebrejských úlohách.

[👉 Rychlé nastavení (Large v3 Turbo)](https://tinyurl.com/t9r3tyxk)  
[🔽 Přímé stažení (Large v3 Turbo)](https://huggingface.co/ivrit-ai/whisper-large-v3-turbo-ggml/resolve/main/ggml-model.bin?download=true)

</details>

<details>
<summary>🇳🇴 Norština</summary>
	
Optimalizováno pro norštinu laboratoří [AI Lab Norské národní knihovny](https://huggingface.co/NbAiLab).

[👉 Rychlé nastavení (medium)](https://tinyurl.com/5wzb9ux8)  
[🔽 Přímé stažení (medium)](https://huggingface.co/NbAiLab/nb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Rychlé nastavení (large)](https://tinyurl.com/f228efbu)  
[🔽 Přímé stažení (large)](https://huggingface.co/NbAiLab/nb-whisper-large/blob/main/ggml-model.bin?download=true)

Další modely menších velikostí jsou k dispozici na [jejich stránce ke stažení na huggingface](https://huggingface.co/NbAiLab/nb-whisper-large).  
Najděte velikost, kterou chcete, stáhněte soubor _ggml-model.bin_, přejmenujte jej a umístěte do složky s modely ve Vibe.

</details>

<details>
<summary>🇸🇪 Švédština</summary>

Optimalizováno pro švédštinu laboratoří [Data Lab Švédské národní knihovny](https://huggingface.co/KBLab).

[👉 Rychlé nastavení (medium)](https://tinyurl.com/ynawnc33)  
[🔽 Přímé stažení (medium)](https://huggingface.co/KBLab/kb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Rychlé nastavení (large v3)](https://tinyurl.com/46dvpeky)  
[🔽 Přímé stažení (large v3)](https://huggingface.co/KBLab/kb-whisper-large/blob/main/ggml-model.bin?download=true)

Další modely menších velikostí jsou k dispozici na [jejich stránce ke stažení na huggingface](https://huggingface.co/KBLab/kb-whisper-large).  
Najděte velikost, kterou chcete, stáhněte soubor _ggml-model.bin_, přejmenujte jej a umístěte do složky s modely ve Vibe.

</details>
</details>

Užijte si objevování těchto modelů a vylepšete si svůj Vibe! 🌐✨

### Chcete více?

Další modely najdete zde:

[👉 Zobrazit další modely](https://huggingface.co/ggerganov/whisper.cpp/tree/main)

---

### Připravte si vlastní modely

<details>
<summary>Převod transformers do GGML</summary>

```console
# Nastavení prostředí
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
uv venv
uv pip install torch transformers huggingface_hub
huggingface-cli login --token "token" # https://huggingface.co/settings/tokens

# Převod a nahrání
git clone https://github.com/openai/whisper
git clone https://github.com/ggml-org/whisper.cpp
git clone https://huggingface.co/ivrit-ai/whisper-large-v3-turbo
uv run ./whisper.cpp/models/convert-h5-to-ggml.py ./whisper-large-v3-turbo/ ./whisper .
uv run huggingface-cli upload --repo-type model whisper-large-v3-turbo-ivrit ./ggml-model.bin ./ggml-model.bin

# Kvantizace
sudo apt install cmake build-essential -y
cd whisper.cpp
cmake -B build
cmake --build build --config Release
cd ..
./whisper.cpp/build/bin/quantize ggml-model.bin ./ggml-model.int8.bin q8_0 # fp32/fp16/q8_0/q5_0
```

</details>
