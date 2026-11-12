<!-- source: 18fa449ab772 -->

# 更新頻道

應用程式會從網站上的三個頻道檔案之一更新，而非從 GitHub 的「最新發行版本」：

| 頻道 | 檔案 |
| --- | --- |
| 正式版 | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

每個檔案都是發行構建版本產生的 `latest.json`。檔案缺失意味著該版本線沒有內容：應用程式會回報「已是最新版本」，而非退回另一個頻道。

## 版本線與版本

| 頻道 | 標籤 | 分支 | 版本 | 內容 |
| --- | --- | --- | --- | --- |
| 正式版 | `vX.Y.Z` | `main` | `X.Y.Z` | 穩定版本線 |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | 下一個穩定版本的候選版本，以預發行版本形式發佈 |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | `dev` 的持續變動構建版本 |

beta 頻道會拒絕普通發行版本；該處只接受 `X.Y.Z-rc.<n>`。沒有候選版本的頻道會不存在，而非空白。

## 在應用程式中

- **設定 → 一般 → 更新**提供頻道選擇器、目前版本、**檢查更新**、上次檢查時間和結果。
- 應用程式會自行探測 `updater/<channel>.json`。`404` 或 `410` 表示該頻道從未發佈；其他任何失敗都是真實錯誤。
- 檢查會在啟動時以及切換頻道後執行。

## 界限

- 更新器只會向前推進。不良構建版本可透過發行更新的版本來修復。
- 選擇 Dev 的正式版或 Beta 安裝會看到「已是最新版本」：每個 dev 構建版本的排序都低於它已執行的版本。轉到 dev 版本線需要手動安裝一次 dev 構建版本；之後 Dev 頻道便會將其向前更新。
- Beta 安裝可透過切換到正式版來移至最終發行版本，因為 `X.Y.Z` 的排序高於其候選版本。

## 相關頁面

- [切換更新頻道](/vibe/docs#switch-update-channels)涵蓋操作步驟。
- [更新頻道為何如此運作](/vibe/docs#update-channels-design)涵蓋設計。
