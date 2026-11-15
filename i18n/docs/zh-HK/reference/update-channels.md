<!-- source: 63b7a2f2736b -->

# 更新頻道

應用程式會從網站上的三個頻道檔案之一更新，而非從 GitHub 的「最新發行版本」：

| 頻道 | 檔案 |
| --- | --- |
| 正式版 | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

每個檔案都是發行構建版本產生的 `latest.json`。沒有檔案的頻道就是一條沒有內容的版本線：應用程式會回報「已是最新版本」，而不是退回另一個頻道，或將缺失的檔案視為檢查失敗。

## 版本線與版本

| 頻道 | 標籤 | 分支 | 版本 | 內容 |
| --- | --- | --- | --- | --- |
| 正式版 | `vX.Y.Z` | `main` | `X.Y.Z` | 穩定版本線 |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | 下一個穩定版本的候選版本，以 GitHub 預發行版本形式發佈 |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | `dev` 的持續變動構建版本 |

沒有發佈候選版本時，`beta.json` 並不存在。普通發行版本在 beta 頻道上會被拒絕；該頻道只接受 `X.Y.Z-rc.<n>`。

## 資訊清單從何而來

- **正式版與 Beta**：發行構建版本的 Tauri 更新器會產生 `latest.json`。`scripts/channel.py <version> --channel <stable|beta>` 會從 `https://github.com/kisev/vibe/releases/download/v<version>/latest.json` 下載它、驗證版本，並寫入 `website/public/updater/<channel>.json`。將檔案提交到 `main`；網站部署會發佈它。
- **Dev**：`.github/workflows/dev-build.yml` 會發佈帶有更新器成品和 `latest.json` 的預發行版本。`scripts/dev_manifest.py` 會讀取最新的完整 dev 發行版本，並寫入 `website/public/updater/dev.json`；新的 dev 構建會觸發網站部署。若最新的發行版本不完整，或 API 呼叫失敗，先前的 `dev.json` 會保持不變。

`channel.py` 會拒絕將頻道往後移動，並理解 `-rc.<n>` 的排序。

## 在應用程式中

- **設定 → 一般 → 更新**提供頻道選擇器、目前版本、**檢查更新**、上次檢查時間和結果。
- 執行階段的選擇位於 `desktop/src-tauri/src/updater.rs`；webview 一側則是 `desktop/src/providers/updater.tsx`。
- `desktop/src-tauri/src/updater.rs` 會直接探測 `updater/<channel>.json`。`404` 或 `410` 表示該頻道從未發佈；其他任何失敗都是真實錯誤。
- `tauri.conf.json` 中 Tauri 外掛的靜態端點是外掛本身知道的退回方式；頻道的選擇發生在應用程式碼中。

## 界限

- 更新器只會向前推進。不良構建版本可透過發行更新的版本來修復。
- 選擇 Dev 的正式版或 Beta 安裝會看到「已是最新版本」：每個 dev 構建版本的排序都低於它已執行的版本。轉到 dev 版本線需要手動安裝一次 dev 構建版本；之後 Dev 頻道便會將其向前更新。
- Beta 安裝可透過切換到正式版來移至最終發行版本，因為 `X.Y.Z` 的排序高於其候選版本。
- 在頻道檔案出現之前建置的應用程式（上游 3.x 版本線）仍會讀取被標記為「latest」的 GitHub 發行版本。`gh release edit --latest` 就是會提供給它們的內容，最後執行。

程序見[發佈版本](../how-to/publish-a-release.md)和[剪出 dev 構建](../how-to/cut-a-dev-build.md)，版本線與後綴為何如此設計見[說明](../explanation/update-channels.md)。
