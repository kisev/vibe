<!-- source: 82b1f22a4618 -->

# 명령줄

`vibe` 실행 파일은 데스크톱 앱입니다. `--hidden` 외의 인수를 받으면 인수를 번들된 `vibe-server`로 전달하고 그 프로세스의 출력을 표시하므로, CLI와 창이 같은 엔진과 모델을 사용합니다.

서버 바이너리는 `vibe-server`이며, 개발 체크아웃에서는 직접 호출할 수 있습니다. 두 진입점 모두에서 `--help`가 현재 플래그를 표시합니다.

## 하위 명령

| 명령 | 목적 |
| --- | --- |
| `transcribe <model> <audio>` | 파일 하나를 받아쓰고 결과를 출력하거나 파일에 씁니다 |
| `serve [model]` | Swagger 문서와 함께 로컬 HTTP 서버를 시작합니다 |
| `pull <url>` | 모델 또는 기타 파일을 다운로드합니다 |
| `devices` | GPU 장치를 JSON으로 나열합니다 |

## 받아쓰기 옵션

| 옵션 | 효과 |
| --- | --- |
| `--format <txt\|markdown\|md\|json\|srt\|vtt>` | 출력 형식, 기본값 `txt` |
| `--output <path>` | 새 파일에 쓰기, 덮어쓰기 거부 |
| `-l`, `--language <code>` | 언어 코드 |
| `--detect-language` | 언어 감지 |
| `--translate` | 모델이 지원하는 경우 영어로 번역 |
| `--vad-model <path>` | Silero VAD 모델, 일부 모델군에서 긴 오디오에 필요 |
| `--diarize-model <path>` | 화자 분리 모델 |
| `--prompt <text>` | 초기 프롬프트, 프롬프트를 사용하는 모델용 |
| `--word-timestamps` | 지원되는 경우 단어 수준 타임스탬프 출력 |
| `--threads <n>` | CPU 스레드 |
| `--gpu-device <n>` | GPU 장치 인덱스, 1부터 시작, `0` 또는 음수는 자동 |
| `--cache-dir <dir>` | 완료된 청크를 보관해 중단된 실행 재개 |
| `--chunk-seconds <n>` | 계획된 청크 길이, 모델 윈도우로 제한 |

`--enhance-audio`, `--temperature`, `--max-text-ctx`, `--max-segment-len`, `--best-of`, `--beam-size`는 엔진을 조정합니다. 기본값은 `--help`를 실행하세요.

## Serve 옵션

| 옵션 | 효과 |
| --- | --- |
| `--host <ip>` | 바인드 주소, 기본값 `127.0.0.1` |
| `-p`, `--port <port>` | 포트, `0`은 빈 포트 선택 |
| `--exit-with-parent` | 상위 프로세스와 함께 중지 |
| `--unload-timeout <value>` | 유휴 모델 언로드 |
| `--cache-dir <dir>` | 청크 캐시 디렉터리 |

**설정 → 에이전트**는 앱에서 같은 서버를 시작하고 Swagger 문서로 연결합니다.

## 예

```console
vibe transcribe model.gguf recording.wav --format srt --output recording.srt
vibe transcribe model.gguf recording.wav --language ru --vad-model ggml-silero-v6.2.0.bin
vibe devices
vibe serve --port 0
```

## 관련 페이지

- 모델 선택과 모델군별 제한은 [모델](/vibe/docs#models).
- 입력 확장자와 내보내기 형식은 [지원되는 형식](/vibe/docs#formats).
