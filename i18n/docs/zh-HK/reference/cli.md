<!-- source: 82b1f22a4618 -->

# 命令列

`vibe` 執行檔是桌面應用程式。當它收到除 `--hidden` 以外的任何參數時，會將參數轉發給內建的 `vibe-server` 並印出該程序的輸出，因此 CLI 和視窗使用相同的引擎和模型。

伺服器二進位檔是 `vibe-server`；開發簽出可以直接呼叫它。任一個進入點的 `--help` 都會印出目前的旗標。

## 子命令

| 命令 | 用途 |
| --- | --- |
| `transcribe <model> <audio>` | 轉錄一個檔案並印出或寫入結果 |
| `serve [model]` | 啟動本機 HTTP 伺服器，附 Swagger 文件 |
| `pull <url>` | 下載模型或其他檔案 |
| `devices` | 以 JSON 列出 GPU 裝置 |

## 轉錄選項

| 選項 | 作用 |
| --- | --- |
| `--format <txt\|markdown\|md\|json\|srt\|vtt>` | 輸出格式；預設 `txt` |
| `--output <path>` | 寫入新檔案；拒絕覆寫 |
| `-l`, `--language <code>` | 語言代碼 |
| `--detect-language` | 偵測語言 |
| `--translate` | 在模型支援的情況下翻譯成英文 |
| `--vad-model <path>` | Silero VAD 模型，某些家族處理長音頻時需要 |
| `--diarize-model <path>` | 發言者識別模型 |
| `--prompt <text>` | 初始提示詞，供使用提示詞的模型使用 |
| `--word-timestamps` | 在支援的情況下輸出單詞級時間戳 |
| `--threads <n>` | CPU 執行緒 |
| `--gpu-device <n>` | GPU 裝置索引，由 1 開始；`0` 或負數表示自動 |
| `--cache-dir <dir>` | 保留已完成的分塊，令中斷的執行可以繼續 |
| `--chunk-seconds <n>` | 計劃的分塊長度，受模型視窗上限限制 |

`--enhance-audio`、`--temperature`、`--max-text-ctx`、`--max-segment-len`、`--best-of` 和 `--beam-size` 會調整引擎；執行 `--help` 查看其預設值。

## 服務選項

| 選項 | 作用 |
| --- | --- |
| `--host <ip>` | 繫結位址；預設 `127.0.0.1` |
| `-p`, `--port <port>` | 連接埠；`0` 會挑選一個空閒的連接埠 |
| `--exit-with-parent` | 隨父程序停止 |
| `--unload-timeout <value>` | 卸載閒置模型 |
| `--cache-dir <dir>` | 分塊快取目錄 |

**設定 → 代理**會從應用程式啟動相同的伺服器，並連結到其 Swagger 文件。

## 範例

```console
vibe transcribe model.gguf recording.wav --format srt --output recording.srt
vibe transcribe model.gguf recording.wav --language ru --vad-model ggml-silero-v6.2.0.bin
vibe devices
vibe serve --port 0
```

## 相關頁面

- [模型](/vibe/docs#models)涵蓋模型選擇和每個家族的限制。
- [支援的格式](/vibe/docs#formats)涵蓋輸入副檔名和匯出格式。
