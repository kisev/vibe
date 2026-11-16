<!-- source: 6fd793aea9b2 -->

# 引擎与 GPU 选择

Vibe 将桌面外壳与转录引擎分离。外壳是使用 Rust 和 React 的 Tauri 应用；引擎是 `vibe-server`，一个在 ggml 上调用 transcribe.cpp C++ 库的 Rust 进程。

## 为什么引擎是独立进程

服务器负责模型加载和繁重计算。将它移出桌面进程意味着：

- 窗口可以重启，而无需重新加载数 GB 的模型；
- 同一个二进制文件服务于应用、CLI 和本地 HTTP API；
- 引擎崩溃不会连带窗口；
- 引擎可以按自己的节奏更新，并由应用构建版本固定。

桌面应用通过本地 HTTP 与服务器通信。这条路径中的任何内容都不会离开机器；[隐私与离线设计](/vibe/docs#privacy)涵盖了网络暴露面。

## 一个引擎，多个模型系列

每个受支持的系列都通过相同的 ggml 构建运行：Whisper、Parakeet、Nemotron、Canary、Qwen3-ASR、Voxtral 和 GigaAM。Silero VAD 和 Nemotron-3 发言者分离也运行在该栈上。一个引擎使内存处理、量化和 GPU 调度对每个模型都保持一致。

代价是版本耦合：如果某个模型的 GGUF 需要比内置构建更新的 transcribe.cpp，它会列在[模型](/vibe/docs#models)中，但在引擎更新前无法加载。这种固定是有意为之，因为引擎升级是对齐事件，而不是后台依赖更新。

## GPU 后端

ggml 会为它运行所在的机器选择后端：

| 平台 | 后端 |
| --- | --- |
| macOS | Metal |
| Windows | Vulkan |
| Linux | Vulkan |

没有可用 GPU 的机器会在 CPU 上运行。**设置 → 模型**提供**在 CPU 上转录**，并在 Windows 和 Linux 上提供 GPU 设备选择器。如果 GPU 加载失败，应用会在 CPU 上重试并报告这一点。

GPU 对大型模型和长文件最重要。现代 CPU 上的小型模型可能已经足够快，而当驱动程序或 Vulkan 加载器缺失时，CPU 路径就是回退方案。

## 相关页面

- 目录及各系列限制见[模型](/vibe/docs#models)。
- `vibe-server` 的选项（如 `--gpu-device`）见[命令行](/vibe/docs#cli)。
- 哪些内容留在机器上见[隐私与离线设计](/vibe/docs#privacy)。
