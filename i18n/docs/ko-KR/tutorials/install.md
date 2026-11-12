<!-- source: 03e5a04c40fd -->

# Vibe 설치

이 튜토리얼은 새 컴퓨터에서 다운로드부터 실행 중인 Vibe 창까지 안내합니다. 인터넷에 연결되어 있고 기존 설치가 없는 데스크톱을 전제로 합니다. 다음 단계는 [첫 녹음 받아쓰기](/vibe/docs#first-transcription)입니다.

## 설치 프로그램 다운로드

[다운로드 페이지](https://kisev.github.io/vibe/)를 열고 이 컴퓨터에 맞는 빌드를 고르세요:

| 플랫폼 | 빌드 |
| --- | --- |
| Windows | `.exe` 설치 프로그램 |
| macOS, Apple silicon | `aarch64.dmg` |
| macOS, Intel | `x64.dmg` |
| Linux | `.deb` 또는 `.rpm`, x86-64 또는 arm64 |

같은 파일이 각 [GitHub 릴리스](https://github.com/kisev/vibe/releases)에 첨부되어 있습니다. Linux `.deb`는 `ffmpeg`를 포함한 런타임 의존성을 선언합니다.

## 설치 및 실행

1. 설치 프로그램을 실행하고 안내를 따릅니다.
1. 애플리케이션 메뉴에서 Vibe를 열거나 터미널에서 `vibe`를 실행합니다.

릴리스 빌드는 서명되지 않습니다. macOS에서는 Gatekeeper를 통과하려면 첫 실행 시 Finder에서 마우스 오른쪽 클릭 → **열기**가 필요하고, 이후 실행은 정상적으로 열립니다. 같은 이유로 Windows SmartScreen이 경고를 표시할 수 있습니다.

## 설정 마무리

첫 실행 시 Vibe가 기본 모델을 제안합니다. 다운로드를 수락하고 완료될 때까지 기다리세요. 모델은 로컬에 저장되며 이후 실행마다 재사용됩니다. [모델](/vibe/docs#models)에서 대안을 확인할 수 있습니다.

드롭 영역과 **녹음**, **링크에서** 동작이 보이면 창이 준비된 것입니다.

## 다음 단계

- [첫 녹음 받아쓰기](/vibe/docs#first-transcription)는 이 설치를 사용합니다.
- [지원되는 형식](/vibe/docs#formats)은 Vibe가 열고 내보낼 수 있는 항목을 나열합니다.
- [충돌 문제 해결](https://github.com/kisev/vibe/blob/main/docs/how-to/troubleshoot-a-crash.md)은 창이 열리지 않을 때 로그와 진단을 다룹니다.
