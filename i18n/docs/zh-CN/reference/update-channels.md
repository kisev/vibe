<!-- source: 63b7a2f2736b -->

# 更新通道

应用从网站上的三个通道文件之一更新，而不是从 GitHub 的最新发布更新：

| 通道 | 文件 |
| --- | --- |
| Release | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

每个文件都是发布构建生成的 `latest.json`。没有文件的通道就是一条没有任何内容的线：应用会报告“已是最新版本”，而不会回退到另一个通道，也不会把缺失的文件当作检查失败。

## 线与版本

| 通道 | 标签 | 分支 | 版本 | 内容 |
| --- | --- | --- | --- | --- |
| Release | `vX.Y.Z` | `main` | `X.Y.Z` | 稳定线 |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | 下一个稳定版本的候选，以 GitHub 预发布形式发布 |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | `dev` 的持续更新构建 |

在没有候选版本发布期间，`beta.json` 不存在。普通发布会在 beta 通道被拒绝；那里只接受 `X.Y.Z-rc.<n>`。

## 清单文件从何而来

- **Release 和 beta**：发布构建的 Tauri 更新器会生成 `latest.json`。`scripts/channel.py <version> --channel <stable|beta>` 会从 `https://github.com/kisev/vibe/releases/download/v<version>/latest.json` 下载它，验证版本，并写入 `website/public/updater/<channel>.json`。将该文件提交到 `main`；网站部署会发布它。
- **Dev**：`.github/workflows/dev-build.yml` 会发布一个带有更新器产物和 `latest.json` 的预发布。`scripts/dev_manifest.py` 会读取最新的完整 dev 发布，并写入 `website/public/updater/dev.json`；新的 dev 构建会触发网站部署。如果最新发布不完整或 API 调用失败，则保留之前的 `dev.json`。

`channel.py` 拒绝将通道向后移动，并理解 `-rc.<n>` 的排序。

## 在应用中

- **设置 → 通用 → 更新**提供通道选择器、当前版本、**检查更新**、上次检查时间和结果。
- 运行时选择位于 `desktop/src-tauri/src/updater.rs`；webview 侧是 `desktop/src/providers/updater.tsx`。
- `desktop/src-tauri/src/updater.rs` 会直接探测 `updater/<channel>.json`。`404` 或 `410` 意味着该通道从未发布；其他任何失败都是真实错误。
- `tauri.conf.json` 中 Tauri 插件的静态端点是插件自身所知的回退；通道选择发生在应用代码中。

## 边界

- 更新器只会向前移动。坏的构建通过发布更新的构建来修复。
- 选择了 Dev 的 Release 或 Beta 安装会看到“已是最新版本”：每个 dev 构建的排序都低于它当前运行的版本。转到 dev 线需要手动安装一次 dev 构建；之后 Dev 通道会将其向前更新。
- Beta 安装通过切换到 Release 来迁移到最终版本，其中 `X.Y.Z` 的排序高于其候选版本。
- 在通道文件出现之前构建的应用（上游 3.x 线）仍会读取被标记为“latest”的那个 GitHub 发布。要交付给它们的是 `gh release edit --latest`，最后运行。

流程见[发布版本](../how-to/publish-a-release.md)和[制作 dev 构建](../how-to/cut-a-dev-build.md)，各条线与后缀为何这样设计见[说明](../explanation/update-channels.md)。
