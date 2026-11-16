<!-- source: dd9e41dac7e3 -->

# 设置与配置

设置位于应用配置目录中的 `app_config.json`。该文件本就应该被读取和编辑：Vibe 会监视它，并在不重启的情况下应用外部更改。**设置 → 代理 → 配置文件**会打开它。

## 配置文件位置

| 平台 | 目录 |
| --- | --- |
| macOS | `~/Library/Application Support/github.com.thewh1teagle.vibe` |
| Windows | `%appdata%\github.com.thewh1teagle.vibe` |
| Linux | `~/.config/github.com.thewh1teagle.vibe` |

该目录保留其上游标识符，因此名称与早期构建相比没有变化。

## 设置分区

| 分区 | 包含 |
| --- | --- |
| 通用 | 显示语言、主题、更新、关闭后保留在托盘、开机时启动、阻止休眠 |
| 隐私 | 是否保存项目，以及隐私政策 |
| 转录 | 语言、自动导出、完成提示音与窗口焦点、项目文件夹 |
| 模型 | CPU/GPU 选择、GPU 设备、模型目录、发言者分离模型 |
| 调优 | Whisper 选项、音频处理、模型内存和卸载超时 |
| 录音 | 会议浏览器、会议检测、自动转录、录音快捷键、macOS 权限 |
| 听写 | 听写快捷键和激活方式 |
| AI 助手 | 摘要和听写任务、平台连接 |
| 手机 | 手机接力、配对、已配对设备 |
| 代理 | 本地 API、Agent Skill、配置文件 |
| 高级设置 | 日志、诊断和开发者控制 |

## 值得了解的键

| 键组 | 含义 |
| --- | --- |
| `transcription.*` | 语言、提示词、发言者分离、时间戳、长录音分块 |
| `model.*` | 所选模型、显示名称、GPU 设备、仅 CPU 开关、卸载超时 |
| `transcript.*` | 导出格式、时间戳、发言者、自动导出 |
| `recording.*` | 输入和输出设备、会议检测、录音快捷键 |
| `ai.*` | 平台、基础 URL、密钥、模型、各任务提示词和开关 |
| `general.updateChannel` | `stable`、`beta` 或 `dev` |
| `handoff.pairing` | 已配对的手机设备和凭据哈希 |

确切字段名足够稳定，可以编辑，但应用拥有该架构：有对应设置界面时，请通过界面修改值，并让应用重写文件，而不是整体替换它。

## 相关页面

- 通道设置见[切换更新通道](/vibe/docs#switch-update-channels)。
- AI 连接见[总结转录内容](/vibe/docs#summarize-transcripts)。
- 接力设置见[从手机转录](/vibe/docs#transcribe-from-a-phone)。
