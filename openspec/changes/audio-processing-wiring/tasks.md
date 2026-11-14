# Tasks

- [x] 1. `FfmpegOptions` is carried by `TranscribeOptions` and turned into ffmpeg arguments by a tested helper.
- [x] 2. The transcribe command prepares a temporary normalized copy through `ffmpeg::normalize` and removes it however the run ends.
- [x] 3. The queue and the comparison pass the saved settings; nothing is added when both are off.
- [x] 4. Tests: argument building, off-path sends the original, temporary copy removed.
