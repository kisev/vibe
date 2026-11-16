<!-- source: 03e5a04c40fd -->

# 安装 Vibe

本教程带你在一台新机器上从下载安装程序到打开 Vibe 窗口。前提是有一台可联网的桌面电脑，且尚未安装 Vibe。下一步是[转录你的第一段录音](/vibe/docs#first-transcription)。

## 下载安装程序

打开[下载页面](https://kisev.github.io/vibe/)，选择适合这台机器的构建版本：

| 平台 | 构建版本 |
| --- | --- |
| Windows | `.exe` 安装程序 |
| macOS，Apple 芯片 | `aarch64.dmg` |
| macOS，Intel | `x64.dmg` |
| Linux | `.deb` 或 `.rpm`，x86-64 或 arm64 |

相同的文件也附在每个 [GitHub 发布版本](https://github.com/kisev/vibe/releases)下。Linux 的 `.deb` 声明了其运行时依赖，包括 `ffmpeg`。

## 安装并打开

1. 运行安装程序，按提示操作。
1. 从应用程序菜单打开 Vibe，或在终端中运行 `vibe`。

发布版本未经签名。在 macOS 上首次启动需要在访达（Finder）中右键 → **打开** 才能通过 Gatekeeper；之后的启动会正常打开。Windows SmartScreen 也可能因此显示警告。

## 完成设置

首次启动时，Vibe 会提供默认模型。接受下载并等待完成。模型存储在本地，之后每次运行都会复用；[模型](/vibe/docs#models)列出了其他选择。

当拖放区域以及**录音**和**从链接**操作可见时，窗口就绪。

## 下一步

- [转录你的第一段录音](/vibe/docs#first-transcription)会用到这次安装。
- [支持的格式](/vibe/docs#formats)列出了 Vibe 可以打开和导出的内容。
- [排查崩溃](https://github.com/kisev/vibe/blob/main/docs/how-to/troubleshoot-a-crash.md)涵盖窗口无法打开时的日志和诊断。
