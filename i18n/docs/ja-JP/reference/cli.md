<!-- source: 82b1f22a4618 -->

# コマンドライン

`vibe` 実行ファイルはデスクトップアプリです。`--hidden` 以外の引数を受け取ると、引数を同梱の `vibe-server` に転送し、そのプロセスの出力を表示するため、CLI とウィンドウは同じエンジンと同じモデルを使用します。

サーバーバイナリは `vibe-server` です。開発用チェックアウトでは直接呼び出せます。どちらのエントリポイントでも `--help` を付けると現在のフラグが表示されます。

## サブコマンド

| コマンド | 目的 |
| --- | --- |
| `transcribe <model> <audio>` | 1 つのファイルを文字起こしし、結果を表示または書き出す |
| `serve [model]` | Swagger ドキュメント付きのローカル HTTP サーバーを起動する |
| `pull <url>` | モデルまたはその他のファイルをダウンロードする |
| `devices` | GPU デバイスを JSON で一覧表示する |

## transcribe のオプション

| オプション | 効果 |
| --- | --- |
| `--format <txt\|markdown\|md\|json\|srt\|vtt>` | 出力フォーマット。デフォルトは `txt` |
| `--output <path>` | 新しいファイルに書き込む。上書きは拒否 |
| `-l`, `--language <code>` | 言語コード |
| `--detect-language` | 言語を検出する |
| `--translate` | モデルが対応している場合に英語へ翻訳する |
| `--vad-model <path>` | Silero VAD モデル。長い音声では一部のファミリーに必須 |
| `--diarize-model <path>` | 話者分離モデル |
| `--prompt <text>` | 初期プロンプト。使用するモデル向け |
| `--word-timestamps` | 対応している場合に単語単位のタイムスタンプを出力する |
| `--threads <n>` | CPU スレッド数 |
| `--gpu-device <n>` | GPU デバイスのインデックス。1 始まり。`0` または負の値は自動 |
| `--cache-dir <dir>` | 完了したチャンクを保持し、中断した実行を再開できるようにする |
| `--chunk-seconds <n>` | 計画するチャンク長。モデルのウィンドウが上限 |

`--enhance-audio`、`--temperature`、`--max-text-ctx`、`--max-segment-len`、`--best-of`、`--beam-size` はエンジンを調整します。デフォルト値は `--help` を実行して確認してください。

## serve のオプション

| オプション | 効果 |
| --- | --- |
| `--host <ip>` | バインドアドレス。デフォルトは `127.0.0.1` |
| `-p`, `--port <port>` | ポート。`0` は空いているポートを選ぶ |
| `--exit-with-parent` | 親プロセスとともに停止する |
| `--unload-timeout <value>` | アイドル状態のモデルをアンロードする |
| `--cache-dir <dir>` | チャンクキャッシュのディレクトリ |

**設定 → エージェント** はアプリから同じサーバーを起動し、その Swagger ドキュメントにリンクします。

## 例

```console
vibe transcribe model.gguf recording.wav --format srt --output recording.srt
vibe transcribe model.gguf recording.wav --language ru --vad-model ggml-silero-v6.2.0.bin
vibe devices
vibe serve --port 0
```

## 関連ページ

- モデルの選択肢とファミリー別の制限については[モデル](/vibe/docs#models)。
- 入力拡張子とエクスポート形式については[対応フォーマット](/vibe/docs#formats)。
