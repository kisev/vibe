<!-- source: 6fd793aea9b2 -->

# 엔진과 GPU 선택

Vibe는 데스크톱 셸과 트랜스크립션 엔진을 분리합니다. 셸은 Rust와 React로 만든 Tauri 앱이고, 엔진은 ggml 위에서 transcribe.cpp C++ 라이브러리를 호출하는 Rust 프로세스 `vibe-server`입니다.

## 엔진이 별도 프로세스인 이유

서버는 모델 로딩과 무거운 연산을 담당합니다. 데스크톱 프로세스 밖에 두면:

- 창은 수 기가바이트 모델을 다시 로드하지 않고 재시작할 수 있습니다.
- 같은 바이너리가 앱, CLI, 로컬 HTTP API를 제공합니다.
- 엔진의 충돌이 창을 함께 끌고 가지 않습니다.
- 엔진을 자체 일정에 따라 업데이트할 수 있으며 앱 빌드가 이를 고정합니다.

데스크톱 앱은 로컬 HTTP로 서버와 통신합니다. 그 경로의 어떤 것도 기기를 떠나지 않습니다. [프라이버시와 오프라인 설계](/vibe/docs#privacy)가 네트워크 표면을 다룹니다.

## 하나의 엔진, 여러 모델군

지원되는 모든 모델군은 같은 ggml 빌드로 실행됩니다: Whisper, Parakeet, Nemotron, Canary, Qwen3-ASR, Voxtral, GigaAM. Silero VAD와 Nemotron-3 화자 분리도 그 스택에서 실행됩니다. 엔진이 하나면 모든 모델의 메모리 처리, 양자화, GPU 디스패치가 같습니다.

트레이드오프는 버전 결합입니다. GGUF가 번들 빌드보다 최신 transcribe.cpp를 필요로 하는 모델은 [모델](/vibe/docs#models)에 표시되지만 엔진이 이동할 때까지 로드할 수 없습니다. 이 고정은 의도적이며, 엔진 업그레이드는 백그라운드 의존성 업데이트가 아니라 동등성 이벤트이기 때문입니다.

## GPU 백엔드

ggml은 실행되는 기기에 맞는 백엔드를 선택합니다:

| 플랫폼 | 백엔드 |
| --- | --- |
| macOS | Metal |
| Windows | Vulkan |
| Linux | Vulkan |

사용 가능한 GPU가 없는 기기는 CPU에서 실행됩니다. **설정 → 모델**에는 **CPU에서 트랜스크립션**과, Windows 및 Linux에서 GPU 장치 선택기가 있습니다. GPU 로드가 실패하면 앱이 CPU에서 다시 시도하고 그 사실을 보고합니다.

GPU는 큰 모델과 긴 파일에서 가장 중요합니다. 현대적인 CPU에서 작은 모델은 충분히 빠를 수 있으며, 드라이버나 Vulkan 로더가 없을 때 CPU 경로가 대체입니다.

## 관련 페이지

- 카탈로그와 모델군별 제한은 [모델](/vibe/docs#models).
- `--gpu-device` 같은 `vibe-server` 옵션은 [명령줄](/vibe/docs#cli).
- 기기에 남는 것은 [프라이버시와 오프라인 설계](/vibe/docs#privacy).
