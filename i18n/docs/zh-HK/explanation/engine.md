<!-- source: 6fd793aea9b2 -->

# 引擎與 GPU 選擇

Vibe 將桌面外殼與轉錄引擎分開。外殼是以 Rust 和 React 編寫的 Tauri 應用程式；引擎是 `vibe-server`，一個在 ggml 上呼叫 transcribe.cpp C++ 函式庫的 Rust 程序。

## 為何引擎是獨立程序

伺服器負責模型載入和繁重運算。讓它留在桌面程序之外意味著：

- 視窗可以重新啟動，而毋須重新載入數 GB 的模型；
- 同一個二進位檔服務應用程式、CLI 和本機 HTTP API；
- 引擎當機不會連帶令視窗一同關閉；
- 引擎可以按其自身時間表更新，並由應用程式構建版本固定。

桌面應用程式透過本機 HTTP 與伺服器通訊。該路徑中的任何內容都不會離開這部電腦；[私隱與離線設計](/vibe/docs#privacy)涵蓋網絡接觸面。

## 一個引擎，多個模型家族

每個支援的家族都透過相同的 ggml 構建版本執行：Whisper、Parakeet、Nemotron、Canary、Qwen3-ASR、Voxtral 和 GigaAM。Silero VAD 和 Nemotron-3 發言者識別亦在該技術堆疊上執行。一個引擎令每個模型的記憶體處理、量化和 GPU 分派方式保持一致。

取捨是版本耦合：GGUF 需要比內建構建版本更新之 transcribe.cpp 的模型會列於[模型](/vibe/docs#models)中，但在引擎更新前無法載入。這種固定是刻意為之，因為引擎升級是對等更新，而非背景依賴更新。

## GPU 後端

ggml 會為其執行所在的電腦選擇後端：

| 平台 | 後端 |
| --- | --- |
| macOS | Metal |
| Windows | Vulkan |
| Linux | Vulkan |

沒有可用 GPU 的電腦會在 CPU 上執行。**設定 → 模型**提供**在 CPU 上轉錄**，以及在 Windows 和 Linux 上的 GPU 裝置選擇器。如果 GPU 載入失敗，應用程式會在 CPU 上重試並報告此事。

GPU 對大型模型和長檔案最為重要。現代 CPU 上的小型模型可以足夠快，而當驅動程式或 Vulkan 載入器缺失時，CPU 路徑便是退回方式。

## 相關頁面

- [模型](/vibe/docs#models)涵蓋目錄和每個家族的限制。
- [命令列](/vibe/docs#cli)涵蓋 `vibe-server` 選項，例如 `--gpu-device`。
- [私隱與離線設計](/vibe/docs#privacy)涵蓋什麼會留在這部電腦上。
