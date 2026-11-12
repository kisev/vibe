<!-- source: 82b1f22a4618 -->

# 命令行

`vibe` 可执行文件就是桌面应用。当它收到除 `--hidden` 以外的任何参数时，会把参数转发给内置的 `vibe-server` 并打印该进程的输出，因此 CLI 和窗口使用同一引擎和模型。

服务器二进制文件是 `vibe-server`；开发检出可以直接调用它。任一入口点上的 `--help` 都会打印当前标志。

## 子命令

| 命令 | 用途 |
| --- | --- |
| `transcribe <model> <audio>` | 转录一个文件并打印或写入结果 |
| `serve [model]` | 启动本地 HTTP 服务器，带 Swagger 文档 |
| `pull <url>` | 下载模型或其他文件 |
| `devices` | 以 JSON 列出 GPU 设备 |

## 转录选项

| 选项 | 作用 |
| --- | --- |
| `--format <txt\|markdown\|md\|json\|srt\|vtt>` | 输出格式；默认 `txt` |
| `--output <path>` | 写入新文件；拒绝覆盖 |
| `-l`, `--language <code>` | 语言代码 |
| `--detect-language` | 检测语言 |
| `--translate` | 在模型支持时翻译为英语 |
| `--vad-model <path>` | Silero VAD 模型，部分系列处理长音频时必需 |
| `--diarize-model <path>` | 发言者分离模型 |
| `--prompt <text>` | 初始提示词，供使用提示词的模型 |
| `--word-timestamps` | 在支持时输出词级时间戳 |
| `--threads <n>` | CPU 线程数 |
| `--gpu-device <n>` | GPU 设备索引，从 1 开始；`0` 或负数表示自动 |
| `--cache-dir <dir>` | 保留完成的分块，使中断的运行可以恢复 |
| `--chunk-seconds <n>` | 计划的分块长度，受模型窗口上限约束 |

`--enhance-audio`、`--temperature`、`--max-text-ctx`、`--max-segment-len`、`--best-of` 和 `--beam-size` 用于调整引擎；运行 `--help` 查看它们的默认值。

## Serve 选项

| 选项 | 作用 |
| --- | --- |
| `--host <ip>` | 绑定地址；默认 `127.0.0.1` |
| `-p`, `--port <port>` | 端口；`0` 会选择空闲端口 |
| `--exit-with-parent` | 随父进程退出 |
| `--unload-timeout <value>` | 卸载空闲模型 |
| `--cache-dir <dir>` | 分块缓存目录 |

**设置 → 代理**会从应用中启动同一服务器，并链接到其 Swagger 文档。

## 示例

```console
vibe transcribe model.gguf recording.wav --format srt --output recording.srt
vibe transcribe model.gguf recording.wav --language ru --vad-model ggml-silero-v6.2.0.bin
vibe devices
vibe serve --port 0
```

## 相关页面

- 模型选择及各系列限制见[模型](/vibe/docs#models)。
- 输入扩展名和导出格式见[支持的格式](/vibe/docs#formats)。
