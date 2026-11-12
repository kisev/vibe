<!-- source: e0f14454bcc5 -->

# 支持的格式

Vibe 接受音频和视频文件，并以多种文本格式导出转录。桌面应用在转录前用 ffmpeg 规范化媒体；在 Linux 上需要系统 `ffmpeg`，而 macOS 和 Windows 构建版本自带。

## 输入

| 类型 | 扩展名 |
| --- | --- |
| 音频 | `mp3`, `wav`, `aac`, `flac`, `oga`, `ogg`, `opus`, `m4a`, `m4b`, `wma` |
| 视频 | `mp4`, `mkv`, `avi`, `mov`, `wmv`, `webm`, `mxf` |

不在此列表中的容器，只要 ffmpeg 能解码，也可能可用；如果应用拒绝它，请先转换。

## 桌面导出

在转录上打开导出对话框，选择以下之一：

| 格式 | 内容 |
| --- | --- |
| TXT | 无格式的纯文本 |
| Markdown | 标题和格式化文本 |
| SRT | 带时间戳的编号字幕条目 |
| VTT | 带时间戳的 WebVTT 字幕 |
| HTML | 样式化的网页 |
| JSON | 结构化的转录和时间数据 |
| CSV | 可直接用于电子表格的行 |
| DOCX | 格式化的 Word 文档 |
| PDF | 可打印的文档 |

导出选项还会在格式支持时切换时间戳和发言者标签。自动导出可以将这些格式中的任意一种写到录音旁边、项目文件夹中，或你选择的文件夹中。

## CLI 输出

`vibe-server transcribe` 会写入 `txt`（默认）、`markdown`（别名 `md`）、`json`、`srt` 或 `vtt`。`--output` 会写入新文件，并拒绝覆盖已有路径。参见[命令行](/vibe/docs#cli)。

## 相关页面

- 模型系列及其限制见[模型](/vibe/docs#models)。
- 桌面流程见[转录你的第一段录音](/vibe/docs#first-transcription)。
