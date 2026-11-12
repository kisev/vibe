<!-- source: 18fa449ab772 -->

# 更新通道

应用从网站上的三个通道文件之一更新，而不是从 GitHub 的“最新发布”更新：

| 通道 | 文件 |
| --- | --- |
| Release | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

每个文件都是发布构建生成的 `latest.json`。文件缺失意味着该线上没有任何内容：应用会报告“已是最新版本”，而不会回退到另一个通道。

## 线路与版本

| 通道 | 标签 | 分支 | 版本 | 内容 |
| --- | --- | --- | --- | --- |
| Release | `vX.Y.Z` | `main` | `X.Y.Z` | 稳定线 |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | 下一个稳定版本的候选版本，以预发布形式发布 |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | `dev` 的持续更新构建 |

普通发布在 Beta 通道会被拒绝；只有 `X.Y.Z-rc.<n>` 会在那里被接受。没有候选版本的通道是缺席，而不是空。

## 在应用中

- **设置 → 通用 → 更新**提供通道选择器、当前版本、**检查更新**、上次检查时间和结果。
- 应用会自行探测 `updater/<channel>.json`。`404` 或 `410` 意味着该通道从未发布；其他任何失败都是真实错误。
- 检查在启动时以及切换通道后运行。

## 边界

- 更新器只会向前移动。坏的构建通过发布更新的构建来修复。
- 选择了 Dev 的 Release 或 Beta 安装会看到“已是最新版本”：每个 dev 构建的排序都低于它当前运行的版本。转到 dev 线需要手动安装一次 dev 构建；之后 Dev 通道会将其向前更新。
- Beta 安装通过切换到 Release 来迁移到最终版本，其中 `X.Y.Z` 的排序高于其候选版本。

## 相关页面

- 步骤见[切换更新通道](/vibe/docs#switch-update-channels)。
- 设计见[更新通道为何这样工作](/vibe/docs#update-channels-design)。
