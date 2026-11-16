<!-- source: 03e5a04c40fd -->

# 安裝 Vibe

本教學會帶你從下載開始，直到 Vibe 視窗開始運作。假設你使用一部可連線互聯網的桌面電腦，而且之前未曾安裝。[轉錄你的第一段錄音](/vibe/docs#first-transcription)是下一步。

## 下載安裝程式

開啟[下載頁面](https://kisev.github.io/vibe/)，然後選擇適用於這部電腦的構建版本：

| 平台 | 構建版本 |
| --- | --- |
| Windows | `.exe` 安裝程式 |
| macOS、Apple 晶片 | `aarch64.dmg` |
| macOS、Intel | `x64.dmg` |
| Linux | `.deb` 或 `.rpm`，x86-64 或 arm64 |

相同的檔案亦附於每個 [GitHub 發行版本](https://github.com/kisev/vibe/releases)。Linux 的 `.deb` 會宣告其執行階段依賴，包括 `ffmpeg`。

## 安裝並開啟

1. 執行安裝程式並依照其提示操作。
1. 從應用程式選單開啟 Vibe，或在終端機執行 `vibe`。

發行版本未簽署。在 macOS 上，首次啟動需要在 Finder 中右鍵 → **開啟**才能通過 Gatekeeper；之後啟動便會正常開啟。Windows SmartScreen 亦可能基於相同原因顯示警告。

## 完成設定

首次啟動時，Vibe 會提供預設模型。接受下載並等待完成。模型會儲存在本機，並在之後每次執行時重用；[模型](/vibe/docs#models)列出了其他選擇。

當拖放區以及**錄音**和**從連結**操作可見時，視窗便已準備就緒。

## 下一步

- [轉錄你的第一段錄音](/vibe/docs#first-transcription)會使用這次安裝。
- [支援的格式](/vibe/docs#formats)列出 Vibe 可以開啟和匯出的內容。
- [排解當機問題](https://github.com/kisev/vibe/blob/main/docs/how-to/troubleshoot-a-crash.md)涵蓋視窗無法開啟時的日誌和診斷。
