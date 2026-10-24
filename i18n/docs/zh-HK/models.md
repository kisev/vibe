<!-- source: 2b80fd9e5daa -->

# 🌟 Vibe 模型 🌟

歡迎來到 Vibe 模型頁面！在這裡你可以找到一系列建議與 Vibe 搭配使用的模型。要安裝模型，可以使用「Magic Setup」連結在 Vibe 中打開，或是在 Vibe 設定中複製並貼上直接下載連結。

## 長錄音

超過模型輸入視窗的錄音會在推論前分割成多個區塊。啟用發言者識別後，分割會依偵測到的發言段進行，因此單一區塊不會混入兩位發言者，只有在他們的發言段交界處例外——這些行會同時顯示兩位發言者並加上「?」，可指定給其中一位。GigaAM（25 s）、Parakeet（30 s）及 Nemotron（30 s）以此方式分割；Whisper 則保留自己的長音訊處理方式。

完成的區塊會保留在你的電腦上，因此以相同設定重新執行長檔案時，會從上次停止的地方繼續。快取儲存轉錄文字、區塊計畫和模型標記——絕不包含音訊——並且永遠不會離開你的裝置。應用程式啟動時會刪除 30 天內未再動用的項目。在命令列上，以 `--cache-dir <folder>` 啟用，並刪除該資料夾即可清除；`--chunk-seconds <n>` 設定計畫長度，且不得超過模型的視窗。

## 可用模型

### 🌱 Tiny 模型

輕巧高效的版本，適合快速任務和資源有限的環境。

[👉 Magic Setup](https://shorturl.at/XSP9R)  
[🔽 直接下載](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin?download=true)

### 🚀 Large v3 Turbo（推薦）

[👉 Magic Setup](https://tinyurl.com/yphwban5)  
[🔽 直接下載](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin)

### 🦜 Parakeet TDT 0.6B v3

支援串流，最適合用於聽寫。

[👉 查看模型](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/tree/main)  
[🔽 下載 Q4_K_M](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/resolve/main/parakeet-tdt-0.6b-v3-Q4_K_M.gguf?download=true)

### ⚡ Nemotron 3.5 ASR Streaming 0.6B

支援串流，最適合用於聽寫。

[👉 查看模型](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf)  
[🔽 下載 Q4_K_M](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/main/nemotron-3.5-asr-streaming-0.6b-Q4_K_M.gguf?download=true)

### 🇷🇺 GigaAM v3（俄語）

由 Salute Developers 開發，支援大寫及標點的俄語語音識別，最適合用於俄語聽寫。

[👉 查看模型](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf)  
[🔽 下載 Q8_0](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/main/gigaam-v3-e2e-rnnt-Q8_0.gguf?download=true)

<details>
<summary>GigaAM 限制與命令列範例</summary>

**限制**

- 只支援俄語。沒有語言自動檢測：`--language ru` 與 `--language auto` 都會選擇俄語，其他任何語言都會因 `unsupported_language` 而失敗。
- 不支援串流。模型視窗為 25 秒，需要 [Silero VAD 模型](https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v6.2.0.bin) 來切分較長的錄音。
- 不支援翻譯，也不支援文字提示詞。
- 不支援穩定時間碼，單詞時間戳請求會被忽略。每個片段帶有 40 毫秒解像度的 token 時間戳。
- 發言者分離功能照常運作。
- `handy-computer` 下發佈了四個變體：[`gigaam-v3-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf)、[`gigaam-v3-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf)、[`gigaam-v3-e2e-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf) 及 [`gigaam-v3-e2e-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf)。`e2e` 變體會加上大寫及標點，其餘變體則傳回沒有標點的小寫文字。

**命令列**

下載上方的 VAD 模型，並以 `--vad-model` 傳入：

```console
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format markdown --output transcript.md
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format json
```

`--format` 接受 `txt`（預設）、`markdown`（別名 `md`）、`json`、`srt` 及 `vtt`。`--output` 會將轉錄內容寫入檔案，並拒絕覆寫既有檔案。加上 `--diarize-model <diar.gguf>` 可在 Markdown 及 JSON 輸出中標示發言者。

</details>

### 針對其他語言優化的模型

<details>
<summary>✡️ 希伯來文（Ivrit）</summary>

專為希伯來文（Ivrit）語言資料設計，針對希伯來文任務優化速度與準確度。

[👉 Magic Setup（Large v3 Turbo）](https://tinyurl.com/t9r3tyxk)  
[🔽 直接下載（Large v3 Turbo）](https://huggingface.co/ivrit-ai/whisper-large-v3-turbo-ggml/resolve/main/ggml-model.bin?download=true)

</details>

<details>
<summary>🇳🇴 挪威文</summary>
	
由[挪威國家圖書館 AI Lab](https://huggingface.co/NbAiLab) 針對挪威文優化。

[👉 Magic Setup（medium）](https://tinyurl.com/5wzb9ux8)  
[🔽 直接下載（medium）](https://huggingface.co/NbAiLab/nb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Magic Setup（large）](https://tinyurl.com/f228efbu)  
[🔽 直接下載（large）](https://huggingface.co/NbAiLab/nb-whisper-large/blob/main/ggml-model.bin?download=true)

更多較小尺寸的模型可以在[他們的 huggingface 下載頁面](https://huggingface.co/NbAiLab/nb-whisper-large)找到。
找到你想要的尺寸後，下載 _ggml-model.bin_ 檔案，重新命名，然後放入 vibe 的模型資料夾。

</details>

<details>
<summary>🇸🇪 瑞典文</summary>

由[瑞典國家圖書館 Data Lab](https://huggingface.co/KBLab) 針對瑞典文優化。

[👉 Magic Setup（medium）](https://tinyurl.com/ynawnc33)  
[🔽 直接下載（medium）](https://huggingface.co/KBLab/kb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Magic Setup（large v3）](https://tinyurl.com/46dvpeky)  
[🔽 直接下載（large v3）](https://huggingface.co/KBLab/kb-whisper-large/blob/main/ggml-model.bin?download=true)

更多較小尺寸的模型可以在[他們的 huggingface 下載頁面](https://huggingface.co/KBLab/kb-whisper-large)找到。
找到你想要的尺寸後，下載 _ggml-model.bin_ 檔案，重新命名，然後放入 vibe 的模型資料夾。

</details>
</details>

盡情探索這些模型，提升你的 Vibe 體驗！🌐✨

### 想要更多？

在這裡找到更多模型：

[👉 查看更多模型](https://huggingface.co/ggerganov/whisper.cpp/tree/main)

---

### 準備你自己的模型

<details>
<summary>將 transformers 轉換為 GGML</summary>

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
