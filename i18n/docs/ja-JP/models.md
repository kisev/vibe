<!-- source: 2b80fd9e5daa -->

# 🌟 Vibeモデル 🌟

Vibeモデルのページへようこそ！ここではVibeで使用するおすすめモデルの厳選リストを紹介しています。モデルをインストールするには、「Magic Setup」リンクを使ってVibeで開くか、直接ダウンロードリンクをVibeの設定にコピー＆ペーストしてください。

## 長い録音

モデルの入力ウィンドウより長い録音は、推論の前にチャンクに分割されます。話者認識が有効な場合、分割は検出された発話の切り替わりに従うため、1 つのチャンクに 2 人の話者が混ざることは、発話の切り替わり目を除いてありません — そのような行では両方の話者が「?」付きで表示され、どちらか一方の話者に割り当てることができます。GigaAM（25 s）、Parakeet（30 s）、Nemotron（30 s）はこの方法で分割されます。Whisper は独自の長文処理を維持します。

完了したチャンクはお使いのコンピューターに保存されるため、同じ設定で長いファイルを再実行すると、停止したところから再開されます。キャッシュには文字起こしテキスト、チャンク計画、モデルのスタンプが保存され、音声は保存されず、デバイスの外に出ることもありません。アプリは起動時に 30 日間変更されていないエントリを削除します。コマンドラインでは `--cache-dir <folder>` で有効にし、そのフォルダーを削除するとキャッシュがクリアされます。`--chunk-seconds <n>` は計画される長さを設定し、モデルのウィンドウを超えることはできません。

## 利用可能なモデル

### 🌱 Tinyモデル

コンパクトで効率的なバージョンで、簡単なタスクやリソースが限られた環境に適しています。

[👉 Magic Setup](https://shorturl.at/XSP9R)  
[🔽 直接ダウンロード](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin?download=true)

### 🚀 Large v3 Turbo（推奨）

[👉 Magic Setup](https://tinyurl.com/yphwban5)  
[🔽 直接ダウンロード](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin)

### 🦜 Parakeet TDT 0.6B v3

ストリーミングに対応しており、ディクテーション（口述筆記）に最適です。

[👉 モデルを見る](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/tree/main)  
[🔽 Q4_K_Mをダウンロード](https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-gguf/resolve/main/parakeet-tdt-0.6b-v3-Q4_K_M.gguf?download=true)

### ⚡ Nemotron 3.5 ASR Streaming 0.6B

ストリーミングに対応しており、ディクテーション（口述筆記）に最適です。

[👉 モデルを見る](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf)  
[🔽 Q4_K_Mをダウンロード](https://huggingface.co/vibe-app/nemotron-3.5-asr-streaming-0.6b-gguf/resolve/main/nemotron-3.5-asr-streaming-0.6b-Q4_K_M.gguf?download=true)

### 🇷🇺 GigaAM v3（ロシア語）

Salute Developersによる、大文字と小文字の区別および句読点を備えたロシア語音声認識です。ロシア語のディクテーション（口述筆記）に最適です。

[👉 モデルを見る](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf)  
[🔽 Q8_0をダウンロード](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/main/gigaam-v3-e2e-rnnt-Q8_0.gguf?download=true)

<details>
<summary>GigaAMの制限事項とコマンドラインの例</summary>

**制限事項**

- ロシア語専用です。言語の自動検出はありません。`--language ru` と `--language auto` はどちらもロシア語を選択し、その他の言語は `unsupported_language` で失敗します。
- ストリーミングには対応していません。モデルのウィンドウは25秒で、より長い録音を分割するには[Silero VADモデル](https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v6.2.0.bin)が必要です。
- 翻訳とテキストプロンプトには対応していません。
- 安定タイムスタンプには対応しておらず、単語タイムスタンプのリクエストは無視されます。各セグメントには40 ms分解能のトークンタイムスタンプが付きます。
- 話者分離は通常どおり動作します。
- `handy-computer` では4つのバリアントが公開されています：[`gigaam-v3-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-rnnt-gguf)、[`gigaam-v3-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-ctc-gguf)、[`gigaam-v3-e2e-rnnt-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf)、[`gigaam-v3-e2e-ctc-gguf`](https://huggingface.co/handy-computer/gigaam-v3-e2e-ctc-gguf)。`e2e` バリアントは大文字と小文字の区別および句読点を追加しますが、その他は句読点のない小文字のテキストを返します。

**コマンドライン**

上記のVADモデルをダウンロードし、`--vad-model` で指定してください。

```console
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format markdown --output transcript.md
vibe-server transcribe <model.gguf> <audio.wav> --vad-model ggml-silero-v6.2.0.bin --format json
```

`--format` は `txt`（デフォルト）、`markdown`（エイリアス `md`）、`json`、`srt`、`vtt` を受け付けます。`--output` は文字起こしをファイルに書き込み、既存のファイルへの上書きは行いません。`--diarize-model <diar.gguf>` を追加すると、Markdown と JSON の出力に話者ラベルが付きます。

</details>

### 他言語に最適化されたモデル

<details>
<summary>✡️ ヘブライ語（Ivrit）</summary>

ヘブライ語（Ivrit）のデータに特化しており、ヘブライ語タスクにおける高速性と精度に最適化されています。

[👉 Magic Setup（Large v3 Turbo）](https://tinyurl.com/t9r3tyxk)  
[🔽 直接ダウンロード（Large v3 Turbo）](https://huggingface.co/ivrit-ai/whisper-large-v3-turbo-ggml/resolve/main/ggml-model.bin?download=true)

</details>

<details>
<summary>🇳🇴 ノルウェー語</summary>
	
[ノルウェー国立図書館のAI Lab](https://huggingface.co/NbAiLab) によりノルウェー語向けに最適化されています。

[👉 Magic Setup（medium）](https://tinyurl.com/5wzb9ux8)  
[🔽 直接ダウンロード（medium）](https://huggingface.co/NbAiLab/nb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Magic Setup（large）](https://tinyurl.com/f228efbu)  
[🔽 直接ダウンロード（large）](https://huggingface.co/NbAiLab/nb-whisper-large/blob/main/ggml-model.bin?download=true)

より小さいサイズのモデルは[Hugging Faceのダウンロードページ](https://huggingface.co/NbAiLab/nb-whisper-large)から入手できます。  
希望のサイズを見つけて _ggml-model.bin_ ファイルをダウンロードし、ファイル名を変更してVibeのモデルフォルダに配置してください。

</details>

<details>
<summary>🇸🇪 スウェーデン語</summary>

[スウェーデン国立図書館のData Lab](https://huggingface.co/KBLab) によりスウェーデン語向けに最適化されています。

[👉 Magic Setup（medium）](https://tinyurl.com/ynawnc33)  
[🔽 直接ダウンロード（medium）](https://huggingface.co/KBLab/kb-whisper-medium/blob/main/ggml-model.bin?download=true)

[👉 Magic Setup（large v3）](https://tinyurl.com/46dvpeky)  
[🔽 直接ダウンロード（large v3）](https://huggingface.co/KBLab/kb-whisper-large/blob/main/ggml-model.bin?download=true)

より小さいサイズのモデルは[Hugging Faceのダウンロードページ](https://huggingface.co/KBLab/kb-whisper-large)から入手できます。  
希望のサイズを見つけて _ggml-model.bin_ ファイルをダウンロードし、ファイル名を変更してVibeのモデルフォルダに配置してください。

</details>
</details>

これらのモデルをぜひお試しいただき、Vibeをより便利にお使いください！🌐✨

### さらに探したい方へ

こちらでさらに多くのモデルを見つけられます:

[👉 他のモデルを見る](https://huggingface.co/ggerganov/whisper.cpp/tree/main)

---

### 独自のモデルを準備する

<details>
<summary>TransformersをGGMLに変換する</summary>

```console
# 環境をセットアップ
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc
uv venv
uv pip install torch transformers huggingface_hub
huggingface-cli login --token "token" # https://huggingface.co/settings/tokens

# 変換してアップロード
git clone https://github.com/openai/whisper
git clone https://github.com/ggml-org/whisper.cpp
git clone https://huggingface.co/ivrit-ai/whisper-large-v3-turbo
uv run ./whisper.cpp/models/convert-h5-to-ggml.py ./whisper-large-v3-turbo/ ./whisper .
uv run huggingface-cli upload --repo-type model whisper-large-v3-turbo-ivrit ./ggml-model.bin ./ggml-model.bin

# 量子化
sudo apt install cmake build-essential -y
cd whisper.cpp
cmake -B build
cmake --build build --config Release
cd ..
./whisper.cpp/build/bin/quantize ggml-model.bin ./ggml-model.int8.bin q8_0 # fp32/fp16/q8_0/q5_0
```

</details>
