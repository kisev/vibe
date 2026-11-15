<!-- source: 63b7a2f2736b -->

# 업데이트 채널

앱은 GitHub의 "최신 릴리스"가 아니라 웹사이트의 세 채널 파일 중 하나에서 업데이트합니다:

| 채널 | 파일 |
| --- | --- |
| 릴리스 | `https://kisev.github.io/vibe/updater/stable.json` |
| 베타 | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

각 파일은 릴리스 빌드가 생성한 `latest.json`입니다. 파일이 없는 채널은 아무것도 올려지지 않은 라인입니다: 앱은 다른 채널로 대체하거나 파일이 없다는 것을 실패한 확인으로 처리하지 않고 "최신 상태"를 보고합니다.

## 라인과 버전

| 채널 | 태그 | 브랜치 | 버전 | 설명 |
| --- | --- | --- | --- | --- |
| 릴리스 | `vX.Y.Z` | `main` | `X.Y.Z` | 안정 라인 |
| 베타 | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | 다음 안정 버전의 후보, GitHub 프리릴리스로 게시 |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | `dev`의 이동 빌드 |

`beta.json`은 후보가 게시되지 않은 동안 존재하지 않습니다. 베타 채널에서는 일반 릴리스가 거부되며, `X.Y.Z-rc.<n>`만 허용됩니다.

## 매니페스트의 출처

- **릴리스 및 베타**: 릴리스 빌드의 Tauri 업데이터가 `latest.json`을 생성합니다. `scripts/channel.py <version> --channel <stable|beta>`가 이를 `https://github.com/kisev/vibe/releases/download/v<version>/latest.json`에서 다운로드하고 버전을 검증한 뒤 `website/public/updater/<channel>.json`에 씁니다. 파일을 `main`에 커밋하면 웹사이트 배포가 이를 게시합니다.
- **Dev**: `.github/workflows/dev-build.yml`이 업데이터 아티팩트와 `latest.json`이 포함된 프리릴리스를 게시합니다. `scripts/dev_manifest.py`가 가장 최근의 완료된 dev 릴리스를 읽고 `website/public/updater/dev.json`을 씁니다. 새 dev 빌드는 웹사이트 배포를 디스패치합니다. 가장 최근 릴리스가 일부만 완료되었거나 API 호출이 실패하면 이전 `dev.json`이 유지됩니다.

`channel.py`는 채널을 뒤로 이동하는 것을 거부하며 `-rc.<n>` 순서를 이해합니다.

## 앱에서

- **설정 → 일반 → 업데이트**에는 채널 선택기, 현재 버전, **업데이트 확인**, 마지막 확인 시간, 결과가 있습니다.
- 런타임 선택은 `desktop/src-tauri/src/updater.rs`에 있고, 웹뷰 쪽은 `desktop/src/providers/updater.tsx`입니다.
- `desktop/src-tauri/src/updater.rs`는 `updater/<channel>.json`을 직접 조회합니다. `404` 또는 `410`은 채널이 게시된 적이 없다는 뜻이며, 다른 모든 실패는 실제 오류입니다.
- `tauri.conf.json`에 있는 Tauri 플러그인의 정적 엔드포인트는 플러그인 자체가 아는 대체 경로이며, 채널 선택은 앱 코드에서 일어납니다.

## 경계

- 업데이터는 앞으로만 이동합니다. 잘못된 빌드는 더 새로운 빌드를 내보내 고칩니다.
- Dev를 선택한 릴리스 또는 베타 설치에서는 "최신 상태"가 표시됩니다: 모든 dev 빌드는 이미 실행 중인 버전보다 아래로 정렬됩니다. dev 라인으로 이동하려면 dev 빌드를 한 번 직접 설치해야 하며, 그 이후에는 Dev 채널이 앞으로 업데이트합니다.
- 베타 설치는 릴리스로 전환하면 최종 릴리스로 이동합니다. 여기서 `X.Y.Z`는 후보들보다 위로 정렬됩니다.
- 채널 파일 이전에 빌드된 앱(업스트림 3.x 라인)은 여전히 "latest"로 표시된 GitHub 릴리스를 읽습니다. `gh release edit --latest`가 그 앱에 제공되는 것이며, 마지막에 실행됩니다.

절차는 [릴리스 게시](../how-to/publish-a-release.md)와 [dev 빌드 자르기](../how-to/cut-a-dev-build.md)를, 라인과 접미사가 이렇게 구성된 이유는 [설명](../explanation/update-channels.md)을 참조하세요.
