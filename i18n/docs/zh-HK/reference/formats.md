<!-- source: e0f14454bcc5 -->

# 支援的格式

Vibe 接受音頻和影片檔案，並以數種文字格式匯出轉錄文字。桌面應用程式會在轉錄前使用 ffmpeg 正規化媒體；在 Linux 上需要系統的 `ffmpeg`，而 macOS 和 Windows 的套件則附帶自己的版本。

## 輸入

| 類型 | 副檔名 |
| --- | --- |
| 音頻 | `mp3`, `wav`, `aac`, `flac`, `oga`, `ogg`, `opus`, `m4a`, `m4b`, `wma` |
| 影片 | `mp4`, `mkv`, `avi`, `mov`, `wmv`, `webm`, `mxf` |

此清單以外的容器格式若能由 ffmpeg 解碼，仍可能正常運作；如果應用程式拒絕它，請先轉換。

## 桌面匯出

在轉錄文字上開啟匯出對話方塊，並挑選以下其中一種：

| 格式 | 內容 |
| --- | --- |
| TXT | 不含格式的純文字 |
| Markdown | 標題和已格式化的文字 |
| SRT | 附編號和時間戳的字幕段落 |
| VTT | 附時間戳的 WebVTT 字幕 |
| HTML | 已套用樣式的網頁 |
| JSON | 結構化的轉錄和時間資料 |
| CSV | 可直接用於試算表的資料列 |
| DOCX | 已格式化的 Word 文件 |
| PDF | 可列印的文件 |

匯出選項亦會在格式支援的情況下切換時間戳和發言者標籤。自動匯出可以將上述任何格式寫入錄音旁邊、專案資料夾，或你選擇的資料夾。

## CLI 輸出

`vibe-server transcribe` 會寫入 `txt`（預設）、`markdown`（別名 `md`）、`json`、`srt` 或 `vtt`。`--output` 會寫入新檔案，並拒絕覆寫現有路徑。請參閱[命令列](/vibe/docs#cli)。

## 相關頁面

- [模型](/vibe/docs#models)涵蓋模型家族及其限制。
- [轉錄你的第一段錄音](/vibe/docs#first-transcription)涵蓋桌面流程。
