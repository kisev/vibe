<!-- source: dd9e41dac7e3 -->

# 設定與配置

設定存放在應用程式配置目錄中的 `app_config.json`。此檔案旨在供讀取和編輯：Vibe 會監看它，並在毋須重新啟動的情況下套用外部變更。**設定 → 代理 → 設定檔**會開啟它。

## 配置檔位置

| 平台 | 目錄 |
| --- | --- |
| macOS | `~/Library/Application Support/github.com.thewh1teagle.vibe` |
| Windows | `%appdata%\github.com.thewh1teagle.vibe` |
| Linux | `~/.config/github.com.thewh1teagle.vibe` |

此目錄保留其上游識別碼，因此名稱與較早版本相同。

## 設定區段

| 區段 | 包含 |
| --- | --- |
| 一般 | 顯示語言、主題、更新、關閉後保留在系統匣、開機時啟動、防止睡眠 |
| 私隱 | 是否儲存專案，以及私隱政策 |
| 轉錄 | 語言、自動匯出、完成音效與聚焦、專案資料夾 |
| 模型 | CPU/GPU 選擇、GPU 裝置、模型目錄、發言者分離模型 |
| 微調 | Whisper 選項、音頻處理、模型記憶體和卸載逾時 |
| 錄音 | 會議瀏覽器、會議偵測、自動轉錄、錄音快捷鍵、macOS 權限 |
| 語音輸入 | 語音輸入快捷鍵和啟用模式 |
| AI | 摘要和語音輸入任務、平台連線 |
| 手機 | 手機接力、配對、已配對裝置 |
| 代理 | 本機 API、Agent 技能、設定檔 |
| 進階設定 | 日誌、診斷和開發者控制項 |

## 值得了解的數值

| 鍵群組 | 含義 |
| --- | --- |
| `transcription.*` | 語言、提示詞、發言者識別、時間戳、長錄音分塊 |
| `model.*` | 所選模型、顯示名稱、GPU 裝置、僅用 CPU 切換、卸載逾時 |
| `transcript.*` | 匯出格式、時間戳、發言者、自動匯出 |
| `recording.*` | 輸入和輸出裝置、會議偵測、錄音快捷鍵 |
| `ai.*` | 平台、基本 URL、金鑰、模型、每個任務的提示詞和切換 |
| `general.updateChannel` | `stable`、`beta` 或 `dev` |
| `handoff.pairing` | 已配對的手機裝置和憑證雜湊 |

確切的欄位名稱足夠穩定可供編輯，但結構描述由應用程式擁有：如設定介面中存在某個值，請透過它變更；並讓應用程式重寫檔案，而非整份取代。

## 相關頁面

- [切換更新頻道](/vibe/docs#switch-update-channels)涵蓋頻道設定。
- [總結轉錄文字](/vibe/docs#summarize-transcripts)涵蓋 AI 連線。
- [從手機轉錄](/vibe/docs#transcribe-from-a-phone)涵蓋手機接力設定。
