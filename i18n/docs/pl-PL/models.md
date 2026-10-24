<!-- source: 2b80fd9e5daa -->

# 🌟 Modele Vibe 🌟

Witamy na stronie modeli Vibe! Znajdziesz tu wyselekcjonowaną listę modeli polecanych do użycia z Vibe. Aby zainstalować model, użyj linku „Magiczna konfiguracja”, aby otworzyć go w Vibe, lub skopiuj i wklej bezpośredni link do pobrania w ustawieniach Vibe.

## Długie nagrania

Nagranie dłuższe niż okno wejściowe modelu jest dzielone na fragmenty przed rozpoznawaniem. Gdy rozpoznawanie mówców jest włączone, podział przebiega wzdłuż wykrytych wypowiedzi, więc jeden fragment nigdy nie miesza dwóch mówców — poza miejscem, w którym ich wypowiedzi się stykają. Te linie pokazują obu mówców ze znakiem „?” i można przypisać je jednemu z nich. GigaAM (25 s), Parakeet (30 s) i Nemotron (30 s) dzielą w ten sposób; Whisper zachowuje własną obsługę długich nagrań.

Gotowe fragmenty są przechowywane na Twoim komputerze, więc ponowne uruchomienie długiego pliku z tymi samymi ustawieniami wznawia pracę od miejsca zatrzymania. Pamięć podręczna zawiera tekst transkrypcji, plan fragmentów i znacznik modelu — nigdy dźwięk — i nie opuszcza Twojego urządzenia. Aplikacja usuwa przy starcie wpisy nietknięte przez 30 dni. W wierszu poleceń włącz ją za pomocą `--cache-dir <folder>` i usuń ten folder, aby ją wyczyścić; `--chunk-seconds <n>` ustawia planowaną długość i nie może przekroczyć okna modelu.

## Dostępne modele

### 🌱 Model Tiny

Kompaktowa i wydajna wersja, odpowiednia do szybkich zadań i środowisk o ograniczonych zasobach.

[👉 Magiczna konfiguracja](https://shorturl.at/XSP9R)  
[🔽 Bezpośrednie pobieranie](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin?download=true)

### 🚀 Large v3 Turbo (zalecany)

[👉 Magiczna konfiguracja](https://tinyurl.com/yphwban5)  
[🔽 Bezpośrednie pobieranie](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin)

### 🦜 Parakeet TDT 0.6B v3

Obsługuje strumieniowanie i najlepiej sprawdza się w dyktowaniu.

[👉 Zobacz model](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/tree/main)  
[🔽 Pobierz Q4_K_M](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/resolve/main/parakeet-tdt-0.6b-v3-Q4_K_M.gguf?download=true)

### ⚡ Nemotron 3.5 ASR Streaming 0.6B

Obsługuje strumieniowanie i najlepiej sprawdza się w dyktowaniu.

[👉 Zobacz model](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf)  
[🔽 Pobierz Q4_K_M](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/main/nemotron-3.5-asr-streaming-0.6b-Q4_K_M.gguf?download=true)

### 🇷🇺 GigaAM v3 (rosyjski)

Rozpoznawanie mowy rosyjskiej z wielkimi literami i interpunkcją, autorstwa Salute Developers. Najlepiej sprawdza się w dyktowaniu po rosyjsku.

[👉 Zobacz model](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf)  
[🔽 Pobierz Q8_0](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/main/gigaam-v3-e2e-rnnt-Q8_0.gguf?download=true)

<details>
<summary>Ograniczenia GigaAM i przykłady wiersza poleceń</summary>

**Ograniczenia**

- Tylko język rosyjski. Brak automatycznego wykrywania języka: `--language ru` i `--language auto` wybierają rosyjski, a każdy inny język kończy się błędem `unsupported_language`.
- Brak strumieniowania. Okno modelu wynosi 25 sekund, a do dzielenia dłuższych nagrań wymagany jest [model Silero VAD](https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v6.2.0.bin).
- Brak tłumaczenia i brak podpowiedzi tekstowej.
- Stabilne znaczniki czasu nie są obsługiwane, a żądania znaczników czasu słów są ignorowane. Każdy segment zawiera znaczniki czasu tokenów z rozdzielczością 40 ms.
- Rozpoznawanie mówców działa jak zwykle.
- Cztery warianty są publikowane w `handy-computer`: [`gigaam-v3-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf), [`gigaam-v3-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf), [`gigaam-v3-e2e-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf) i [`gigaam-v3-e2e-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf). Warianty `e2e` dodają wielkie litery i interpunkcję; pozostałe zwracają tekst małymi literami bez interpunkcji.

**Wiersz poleceń**

Pobierz powyższy model VAD i przekaż go za pomocą `--vad-model`:

```console
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format markdown --output transcript.md
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format json
```

`--format` akceptuje `txt` (domyślnie), `markdown` (alias `md`), `json`, `srt` i `vtt`. `--output` zapisuje transkrypcję do pliku i odmawia nadpisania istniejącego. Dodaj `--diarize-model <diar.gguf>`, aby oznaczyć mówców w danych wyjściowych Markdown i JSON.

</details>

### Modele zoptymalizowane pod inne języki

<details>
<summary>✡️ Hebrajski (Ivrit)</summary>

Wyspecjalizowany w danych językowych hebrajskich (Ivrit), zoptymalizowany pod kątem szybkości i dokładności w zadaniach w języku hebrajskim.

[👉 Magiczna konfiguracja (Large v3 Turbo)](https://tinyurl.com/t9r3tyxk)  
[🔽 Bezpośrednie pobieranie (Large v3 Turbo)](https://huggingface.co/ivrit-ai/whisper-large-v3-turbo-ggml/resolve/main/ggml-model.bin?download=true)

</details>

<details>
<summary>🇳🇴 Norweski</summary>
	
Zoptymalizowany dla języka norweskiego przez [AI Lab w Bibliotece Narodowej Norwegii](https://huggingface.co/NbAiLab).

[👉 Magiczna konfiguracja (medium)](https://tinyurl.com/5wzb9ux8)  
[🔽 Bezpośrednie pobieranie (medium)](https://huggingface.co/NbAiLab/nb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Magiczna konfiguracja (large)](https://tinyurl.com/f228efbu)  
[🔽 Bezpośrednie pobieranie (large)](https://huggingface.co/NbAiLab/nb-whisper-large/blob/main/ggml-model.bin?download=true)

Więcej modeli o mniejszych rozmiarach jest dostępnych na [ich stronie pobierania na huggingface](https://huggingface.co/NbAiLab/nb-whisper-large).  
Znajdź rozmiar, którego potrzebujesz, pobierz plik _ggml-model.bin_, zmień jego nazwę i umieść go w folderze modeli Vibe.

</details>

<details>
<summary>🇸🇪 Szwedzki</summary>

Zoptymalizowany dla języka szwedzkiego przez [Data Lab w Bibliotece Narodowej Szwecji](https://huggingface.co/KBLab).

[👉 Magiczna konfiguracja (medium)](https://tinyurl.com/ynawnc33)  
[🔽 Bezpośrednie pobieranie (medium)](https://huggingface.co/KBLab/kb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Magiczna konfiguracja (large v3)](https://tinyurl.com/46dvpeky)  
[🔽 Bezpośrednie pobieranie (large v3)](https://huggingface.co/KBLab/kb-whisper-large/blob/main/ggml-model.bin?download=true)

Więcej modeli o mniejszych rozmiarach jest dostępnych na [ich stronie pobierania na huggingface](https://huggingface.co/KBLab/kb-whisper-large).  
Znajdź rozmiar, którego potrzebujesz, pobierz plik _ggml-model.bin_, zmień jego nazwę i umieść go w folderze modeli Vibe.

</details>
</details>

Miłego odkrywania tych modeli i ulepszania swojego Vibe! 🌐✨

### Chcesz więcej?

Znajdź dodatkowe modele tutaj:

[👉 Zobacz więcej modeli](https://huggingface.co/ggerganov/whisper.cpp/tree/main)

---

### Przygotuj własne modele

<details>
<summary>Konwersja transformers do GGML</summary>

```console
# Konfiguracja środowiska
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
uv venv
uv pip install torch transformers huggingface_hub
huggingface-cli login --token "token" # https://huggingface.co/settings/tokens

# Konwersja i przesyłanie
git clone https://github.com/openai/whisper
git clone https://github.com/ggml-org/whisper.cpp
git clone https://huggingface.co/ivrit-ai/whisper-large-v3-turbo
uv run ./whisper.cpp/models/convert-h5-to-ggml.py ./whisper-large-v3-turbo/ ./whisper .
uv run huggingface-cli upload --repo-type model whisper-large-v3-turbo-ivrit ./ggml-model.bin ./ggml-model.bin

# Kwantyzacja
sudo apt install cmake build-essential -y
cd whisper.cpp
cmake -B build
cmake --build build --config Release
cd ..
./whisper.cpp/build/bin/quantize ggml-model.bin ./ggml-model.int8.bin q8_0 # fp32/fp16/q8_0/q5_0
```

</details>
