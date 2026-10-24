<!-- source: 2b80fd9e5daa -->

# 🌟 Vibe 모델 🌟

Vibe 모델 페이지에 오신 것을 환영합니다! 이 페이지에서는 Vibe와 함께 사용하기 좋은 모델 목록을 확인할 수 있습니다. 모델을 설치하려면 "Magic Setup" 링크로 Vibe에서 바로 열거나, 직접 다운로드 링크를 복사해 Vibe 설정에 붙여넣으세요.

## 긴 녹음

모델의 입력 창보다 긴 녹음은 추론 전에 청크로 나뉩니다. 화자 인식을 켜면 나뉘는 위치가 감지된 발언을 따르므로, 한 청크에 두 화자가 섞이는 일은 두 화자의 발언이 만나는 지점을 빼고는 없습니다. 그런 줄에는 두 화자가 "?"와 함께 표시되며 둘 중 한 명에게 지정할 수 있습니다. GigaAM(25 s), Parakeet(30 s), Nemotron(30 s)은 이 방식으로 나뉘고, Whisper는 자체적인 장시간 처리 방식을 유지합니다.

완료된 청크는 컴퓨터에 보관되므로, 같은 설정으로 긴 파일을 다시 실행하면 중단된 지점부터 이어집니다. 캐시에는 전사 텍스트, 청크 계획, 모델 스탬프가 저장되며 오디오는 저장되지 않고, 기기를 벗어나지도 않습니다. 앱은 시작할 때 30일 동안 건드리지 않은 항목을 삭제합니다. 명령줄에서는 `--cache-dir <folder>`로 사용을 켜고 해당 폴더를 삭제해 캐시를 비울 수 있습니다. `--chunk-seconds <n>`은 계획된 길이를 설정하며 모델의 창을 초과할 수 없습니다.

## 사용 가능한 모델

### 🌱 Tiny 모델

가볍고 효율적인 버전으로, 빠른 작업이나 리소스가 제한된 환경에 적합합니다.

[👉 Magic Setup](https://shorturl.at/XSP9R)  
[🔽 직접 다운로드](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin?download=true)

### 🚀 Large v3 Turbo (권장)

[👉 Magic Setup](https://tinyurl.com/yphwban5)  
[🔽 직접 다운로드](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin)

### 🦜 Parakeet TDT 0.6B v3

스트리밍을 지원하며 받아쓰기에 가장 적합합니다.

[👉 모델 보기](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/tree/main)  
[🔽 Q4_K_M 다운로드](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/resolve/main/parakeet-tdt-0.6b-v3-Q4_K_M.gguf?download=true)

### ⚡ Nemotron 3.5 ASR Streaming 0.6B

스트리밍을 지원하며 받아쓰기에 가장 적합합니다.

[👉 모델 보기](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf)  
[🔽 Q4_K_M 다운로드](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/main/nemotron-3.5-asr-streaming-0.6b-Q4_K_M.gguf?download=true)

### 🇷🇺 GigaAM v3 (러시아어)

Salute Developers가 만든 러시아어 음성 인식 모델로, 대문자화와 문장 부호를 처리합니다. 러시아어 받아쓰기에 가장 적합합니다.

[👉 모델 보기](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf)  
[🔽 Q8_0 다운로드](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/main/gigaam-v3-e2e-rnnt-Q8_0.gguf?download=true)

<details>
<summary>GigaAM 제한 사항 및 명령줄 예제</summary>

**제한 사항**

- 러시아어만 지원하며 언어 자동 감지 기능이 없습니다. `--language ru`와 `--language auto`는 모두 러시아어를 선택하고, 다른 언어는 `unsupported_language` 오류로 실패합니다.
- 스트리밍을 지원하지 않습니다. 모델 창은 25초이며, 더 긴 녹음을 나누려면 [Silero VAD 모델](https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v6.2.0.bin)이 필요합니다.
- 번역과 텍스트 프롬프트를 지원하지 않습니다.
- 안정적인 타임스탬프는 지원하지 않으며, 단어 타임스탬프 요청은 무시됩니다. 각 세그먼트에는 40ms 해상도의 토큰 타임스탬프가 포함됩니다.
- 화자 분리는 평소와 같이 동작합니다.
- `handy-computer` 아래에 네 가지 변형이 게시되어 있습니다: [`gigaam-v3-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf), [`gigaam-v3-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf), [`gigaam-v3-e2e-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf), [`gigaam-v3-e2e-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf). `e2e` 변형은 대문자화와 문장 부호를 추가하고, 나머지는 문장 부호 없는 소문자 텍스트를 반환합니다.

**명령줄**

위에서 VAD 모델을 다운로드하고 `--vad-model`로 전달하세요:

```console
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format markdown --output transcript.md
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format json
```

`--format`은 `txt`(기본값), `markdown`(별칭 `md`), `json`, `srt`, `vtt`를 지원합니다. `--output`은 트랜스크립트를 파일로 저장하며 기존 파일을 덮어쓰지 않습니다. `--diarize-model <diar.gguf>`를 추가하면 Markdown 및 JSON 출력에 화자 레이블이 표시됩니다.

</details>

### 다른 언어에 최적화된 모델

<details>
<summary>✡️ 히브리어 (Ivrit)</summary>

히브리어(Ivrit) 데이터에 특화되어 있으며, 히브리어 작업에서 높은 속도와 정확도를 내도록 최적화되었습니다.

[👉 Magic Setup (Large v3 Turbo)](https://tinyurl.com/t9r3tyxk)  
[🔽 직접 다운로드 (Large v3 Turbo)](https://huggingface.co/ivrit-ai/whisper-large-v3-turbo-ggml/resolve/main/ggml-model.bin?download=true)

</details>

<details>
<summary>🇳🇴 노르웨이어</summary>
	
[노르웨이 국립도서관 AI Lab](https://huggingface.co/NbAiLab)에서 노르웨이어에 맞게 최적화했습니다.

[👉 Magic Setup (medium)](https://tinyurl.com/5wzb9ux8)  
[🔽 직접 다운로드 (medium)](https://huggingface.co/NbAiLab/nb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Magic Setup (large)](https://tinyurl.com/f228efbu)  
[🔽 직접 다운로드 (large)](https://huggingface.co/NbAiLab/nb-whisper-large/blob/main/ggml-model.bin?download=true)

더 작은 크기의 모델은 [huggingface 다운로드 페이지](https://huggingface.co/NbAiLab/nb-whisper-large)에서 확인할 수 있습니다.  
원하는 크기를 찾아 _ggml-model.bin_ 파일을 다운로드한 뒤 파일명을 변경하고 vibe의 모델 폴더에 넣으세요.

</details>

<details>
<summary>🇸🇪 스웨덴어</summary>

[스웨덴 국립도서관 Data Lab](https://huggingface.co/KBLab)에서 스웨덴어에 맞게 최적화했습니다.

[👉 Magic Setup (medium)](https://tinyurl.com/ynawnc33)  
[🔽 직접 다운로드 (medium)](https://huggingface.co/KBLab/kb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Magic Setup (large v3)](https://tinyurl.com/46dvpeky)  
[🔽 직접 다운로드 (large v3)](https://huggingface.co/KBLab/kb-whisper-large/blob/main/ggml-model.bin?download=true)

더 작은 크기의 모델은 [huggingface 다운로드 페이지](https://huggingface.co/KBLab/kb-whisper-large)에서 확인할 수 있습니다.  
원하는 크기를 찾아 _ggml-model.bin_ 파일을 다운로드한 뒤 파일명을 변경하고 vibe의 모델 폴더에 넣으세요.

</details>
</details>

다양한 모델을 살펴보며 Vibe를 더욱 풍성하게 활용해 보세요! 🌐✨

### 더 찾고 계신가요?

여기에서 더 많은 모델을 찾을 수 있습니다.

[👉 더 많은 모델 보기](https://huggingface.co/ggerganov/whisper.cpp/tree/main)

---

### 나만의 모델 준비하기

<details>
<summary>Transformers를 GGML로 변환하기</summary>

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
