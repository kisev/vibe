<!-- markdownlint-disable MD010 -->

### [high/bug] scripts/ci/fetch_ffmpeg.py:35-37

os.replace() перемещает файл из $RUNNER_TEMP в рабочую копию репозитория (desktop/src-tauri/binaries). На GitHub-хостинговых Windows-раннерах workspace лежит на диске D:\\a\<repo>, а RUNNER_TEMP — на C:\\Users\\runneradmin~1\\AppData\\Local\\Temp: os.replace не передаёт MOVEFILE_COPY_ALLOWED и на разных томах падает с OSError [WinError 17] «The system cannot move the file to a different disk drive». Ячейка матрицы windows-latest в dev-build.yml (URL gyan.dev + EXE=.exe) будет падать на каждом запуске шага «Fetch ffmpeg». Используйте shutil.move, который при переходе между файловыми системами сам делает copy+delete (не забудьте import shutil); chmod 0o755 после него сохраняется.

**Existing:**

```
    target = pathlib.Path("desktop/src-tauri/binaries") / f"ffmpeg-{triple}{exe}"
    target.parent.mkdir(parents=True, exist_ok=True)
    os.replace(tmp / "out" / member, target)
```

**Suggestion:**

```
    target = pathlib.Path("desktop/src-tauri/binaries") / f"ffmpeg-{triple}{exe}"
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(tmp / "out" / member), str(target))
```

### [medium/security] scripts/ci/fetch_ffmpeg.py:26-27

Бинарник ffmpeg скачивается по FFMPEG_URL без какой-либо проверки целостности и сразу становится исполняемым файлом в дереве сборки, попадающем в распространяемый артефакт. Хуже того, матрица в dev-build.yml использует «катящийся» URL https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip — он всегда указывает на последнюю версию, поэтому содержимое поставки меняется без какого-либо изменения в репозитории, а подмена файла на стороне gyan.dev пройдёт незамеченной. Стоит закрепить в матрице URL с конкретной версией и проверять sha256 (например, через переменную FFMPEG_SHA256 в env шага).

**Existing:**

```
    archive = tmp / "ffmpeg.zip"
    urllib.request.urlretrieve(url, archive)
```

**Suggestion:**

```
    archive = tmp / "ffmpeg.zip"
    urllib.request.urlretrieve(url, archive)
    expected = os.environ.get("FFMPEG_SHA256", "")
    if expected:
        digest = hashlib.sha256(archive.read_bytes()).hexdigest()
        if digest != expected.lower():
            raise SystemExit(f"ffmpeg archive checksum mismatch: {digest}")
```

### [low/bug] scripts/ci/fetch_ffmpeg.py:29-33

next(...) без значения по умолчанию: если в архиве не окажется члена с базовым именем «ffmpeg{EXE}» (например, источник поменяет структуру zip), шаг упадёт с голым StopIteration без указания, что именно искали и в каком архиве. Лучше вернуть None по умолчанию и выдать явную ошибку с URL и ожидаемым именем.

**Existing:**

```
        member = next(
            name
            for name in bundle.namelist()
            if pathlib.PurePosixPath(name).name == "ffmpeg" + exe
        )
```

**Suggestion:**

```
        member = next(
            (
                name
                for name in bundle.namelist()
                if pathlib.PurePosixPath(name).name == "ffmpeg" + exe
            ),
            None,
        )
        if member is None:
            raise SystemExit(f"no ffmpeg{exe} member in the archive from {url}")
```

### [low/documentation] scripts/ci/linux-build-deps.sh:17-22

Первый комментарий в zypper-ветке противоречит и коду, и второму комментарию: он утверждает, что пробуются webkit2gtk-4_1-devel и webkitgtk4-devel, тогда как ниже код ставит webkitgtk3-devel с фолбэком на webkit2gtk-4_1-devel (и второй комментарий называет именно webkitgtk3-devel). Для нестандартной ветки, которую почти никто не гоняет в CI, неверное описание порядка фолбэка заметно мешает сопровождению — стоит привести комментарий в соответствие с кодом.

**Existing:**

```
    # openSUSE names differ from Debian's: libsoup's 3.x headers ship in
    # libsoup-devel (libsoup2-devel is the 2.4 line) and libxdo's in
    # xdotool-devel. The WebKitGTK 4.1 development package is
    # webkit2gtk-4_1-devel where the distribution publishes it and
    # webkitgtk4-devel on releases that only carry the 4.0 split, so both are
    # tried and the pkg-config check afterwards decides.
```

**Suggestion:**

```
    # openSUSE names differ from Debian's: libsoup's 3.x headers ship in
    # libsoup-devel (libsoup2-devel is the 2.4 line) and libxdo's in
    # xdotool-devel. The WebKitGTK 4.1 development package is webkitgtk3-devel
    # on most releases, with webkit2gtk-4_1-devel as the fallback where the
    # split package is published instead; the pkg-config check afterwards
    # decides.
```

### [low/maintainability] scripts/ci/macos-signing-env.sh:5-12

Дефолты `${VAR-}` превращают отсутствующий секрет в пустую строку: если релиз запущен с inputs.sign-macos, но какой-то из секретов не настроен в репозитории (release.yml всегда выставляет переменные шага, возможно пустыми), этот шаг молча завершится успехом и экспортирует пустые значения, а сборка упадёт позже внутри tauri-action с малопонятной ошибкой подписи/нотаризации. Учитывая `set -u`, лучше здесь же падать с явным сообщением, какой именно секрет пуст.

**Existing:**

```
{
    echo "APPLE_CERTIFICATE=${APPLE_CERTIFICATE-}"
    echo "APPLE_CERTIFICATE_PASSWORD=${APPLE_CERTIFICATE_PASSWORD-}"
    echo "APPLE_SIGNING_IDENTITY=${APPLE_SIGNING_IDENTITY-}"
    echo "APPLE_ID=${APPLE_ID-}"
    echo "APPLE_PASSWORD=${APPLE_PASSWORD-}"
    echo "APPLE_TEAM_ID=${APPLE_TEAM_ID-}"
} >>"$GITHUB_ENV"
```

**Suggestion:**

```
for name in APPLE_CERTIFICATE APPLE_CERTIFICATE_PASSWORD APPLE_SIGNING_IDENTITY \
    APPLE_ID APPLE_PASSWORD APPLE_TEAM_ID; do
    value="${!name:-}"
    if [ -z "$value" ]; then
        echo "$name is empty; configure the secret or disable the sign-macos input" >&2
        exit 1
    fi
    printf '%s=%s\n' "$name" "$value"
done >>"$GITHUB_ENV"
```

### [low/maintainability] scripts/ci/vulkan-deps.sh:12-14

После третьей, последней попытки цикл всё равно печатает «retrying in 10s» и засыпает на 10 секунд перед выходом с ::error — вводящее в заблуждение сообщение и лишняя задержка на уже гарантированно провальном пути. Стоит спать/логировать «retrying» только если попытки ещё остались.

**Existing:**

```
    echo "apt attempt $attempt failed; retrying in 10s"
    sleep 10
done
```

**Suggestion:**

```
    if [ "$attempt" -lt 3 ]; then
        echo "apt attempt $attempt failed; retrying in 10s"
        sleep 10
    else
        echo "apt attempt $attempt failed; no attempts left" >&2
    fi
done
```

### [low/bug] scripts/ci/vulkan-sdk-windows.ps1:9-9

curl.exe вызывается без флага --fail и без проверки $LASTEXITCODE: curl не выбрасывает исключение в PowerShell, а без -f HTTP-ошибка (например, 404 при опечатке в VULKAN_VERSION или недоступной версии SDK) считается успешной передачей — тело страницы ошибки сохранится как VulkanSDK-Installer.exe, и падение произойдёт только на следующей строке `&` с вводящим в заблуждение сообщением (не «скачивание не удалось», а «not a valid Win32 application» либо файл просто не найден при сетевом сбое). Стоит добавить -f/--fail и явный throw по коду выхода, чтобы шаг падался на месте сбоя с понятной причиной.

**Existing:**

```
curl.exe -o $env:RUNNER_TEMP/VulkanSDK-Installer.exe -L "https://sdk.lunarg.com/sdk/download/${env:VULKAN_VERSION}/windows/vulkansdk-windows-X64-${env:VULKAN_VERSION}.exe"
```

**Suggestion:**

```
curl.exe -f -o $env:RUNNER_TEMP/VulkanSDK-Installer.exe -L "https://sdk.lunarg.com/sdk/download/${env:VULKAN_VERSION}/windows/vulkansdk-windows-X64-${env:VULKAN_VERSION}.exe"
if ($LASTEXITCODE -ne 0) { throw "Vulkan SDK download failed with exit code $LASTEXITCODE" }
```

### [low/maintainability] scripts/ci/build-server.sh:1-4

Файл создан с режимом 100644 при наличии shebang `#!/usr/bin/env bash` (то же в changelog-gate.sh, check-server.sh, clippy.sh, desktop-build-deps.sh, desktop-check.sh и diarize-helper.sh; исполняемым создан только e2e.sh — 100755). taskfile.yml вызывает скрипты через `bash scripts/ci/...`, поэтому CI работает, но прямой запуск `./scripts/ci/build-server.sh` завершится «Permission denied», и режимы файлов внутри одного набора несогласованы. Стоит сделать все скрипты каталога исполняемыми (`chmod +x scripts/ci/*.sh`).

**Existing:**

```
#!/usr/bin/env bash
# Build vibe-server and stage it as the desktop sidecar. Requires TRIPLE and
# EXE (empty or ".exe"); VIBE_SERVER_VERSION, VIBE_SERVER_COMMIT and
# TRANSCRIBE_CMAKE_ARGS are inherited by cargo from the workflow environment.
```

### [high/bug] scripts/ci/changelog-gate.sh:5-5

Жёстко зашитый `python3` ломает этот гейт на Windows-раннере. В release.yml шаг «Require release notes for this version» выполняется с `shell: bash` без условия по ОС, т.е. и в ячейке матрицы `windows-latest`. mise.toml python не предоставляет (только lefthook/task/shellcheck и т.п.), а сам taskfile.yml в этом же PR фиксирует обратное: `PYTHON: '{{if eq OS "windows"}}python{{else}}python3{{end}}'` с комментарием «Windows images expose `python`, while Unix runners use `python3`». Под git-bash на windows-latest `python3` либо не найден, либо резолвится в заглушку Microsoft Store (ненулевой exit), и с `set -euo pipefail` скрипт падает до проверки файла — релизная сборка для Windows будет падать на каждом запуске. Стоит выбирать интерпретатор так же, как это делает taskfile (python3 с фолбэком на python), либо принимать его через переменную окружения от задачи.

**Existing:**

```
version=$(python3 -c 'import json; print(json.load(open("desktop/src-tauri/tauri.conf.json"))["version"])')
```

**Suggestion:**

```
py="$(command -v python3 || command -v python)"
version="$($py -c 'import json; print(json.load(open("desktop/src-tauri/tauri.conf.json"))["version"])')"
```

### [low/bug] scripts/ci/clippy.sh:20-20

`$gcc_include` подставляется в строку аргументов clang без кавычек: путь с пробелом распадётся на несколько аргументов и сломает вызов bindgen. На текущих CI-хостах путей с пробелами нет, поэтому страховка дешёвая, но именно такие латентные проблемы всплывают на локальных сборках (например, в каталогах с пробелами).

**Existing:**

```
            export BINDGEN_EXTRA_CLANG_ARGS="-isystem $gcc_include ${BINDGEN_EXTRA_CLANG_ARGS:-}"
```

**Suggestion:**

```
            export BINDGEN_EXTRA_CLANG_ARGS="-isystem \"$gcc_include\" ${BINDGEN_EXTRA_CLANG_ARGS:-}"
```

### [low/maintainability] scripts/ci/clippy.sh:13-14

uv-фолбэк не гарантирован окружением: uv отсутствует в mise.toml, а job `lint` в lint.yml (где `server:clippy` тоже вызывает этот скрипт через taskfile) не устанавливает uv. На ubuntu-24.04 зонд `ldconfig` пока находит libclang и эта ветка не выполняется, но на раннере или локальном хосте без системного libclang скрипт упадёт с «uv: command not found» — это выглядит как ошибка кода, а не окружения, ровно то, от чего комментарий в шапке предостерегает. Полезно явно проверить наличие uv и выдать внятную диагностику.

**Existing:**

```
        LIBCLANG_PATH="$(uv run --with libclang python -c \
            "import pathlib; import clang; print(pathlib.Path(clang.__file__).parent / 'native')")"
```

**Suggestion:**

```
        command -v uv >/dev/null 2>&1 || {
            echo "::error::no system libclang found and uv is not installed to fetch the libclang wheel" >&2
            exit 1
        }
        LIBCLANG_PATH="$(uv run --with libclang python -c \
            "import pathlib; import clang; print(pathlib.Path(clang.__file__).parent / 'native')")"
```

### [medium/bug] scripts/ci/clippy.sh:10-10

Детект системного libclang ломается из-за сочетания `grep -q` с `set -o pipefail`: `grep -q` выходит сразу после первого совпадения, не вычитывая stdin, а `ldconfig -p` печатает ~150–250 КБ. Если строка libclang попадает в первую часть вывода, у `ldconfig` после выхода grep остаётся больше данных, чем вмещает pipe-буфер (64 КБ), он получает SIGPIPE и умирает с кодом 141; pipefail превращает это в ложное условие, и скрипт уходит в uv-фолбэк даже на хосте с установленным libclang (в job `lint` из lint.yml, где uv не ставится, это роняет `server:clippy` целиком). grep без `-q` дочитывает поток до EOF, поэтому SIGPIPE не возникает.

**Existing:**

```
    if command -v ldconfig >/dev/null && ldconfig -p 2>/dev/null | grep -q 'libclang'; then
```

**Suggestion:**

```
    if command -v ldconfig >/dev/null && ldconfig -p 2>/dev/null | grep 'libclang' >/dev/null; then
```

### [low/maintainability] scripts/ci/diarize-helper.sh:18-21

Каталог назначения не создаётся перед cp — в отличие от build-server.sh, где есть `mkdir -p ../desktop/src-tauri/binaries`. Сейчас копирование спасают только отслеживаемый `.gitkeep` (каталог существует после чекаута) и порядок шагов в workflows: в dev-build.yml и lint_rust.yml перед этим скриптом выполняется build-server.sh/setup_sidecars.sh, которые создают каталог. При автономном запуске `task ci:diarize-helper` на машине, где каталог удалён, cp упадёт с «No such file or directory». Стоит повторить защиту из build-server.sh.

**Existing:**

```
cd server
cargo build -p vibe-diarize-native --release --target "$triple"
cp "target/$triple/release/vibe-diarize-native$exe" \
    "../desktop/src-tauri/binaries/vibe-diarize-native-$triple$exe"
```

**Suggestion:**

```
cd server
cargo build -p vibe-diarize-native --release --target "$triple"
mkdir -p ../desktop/src-tauri/binaries
cp "target/$triple/release/vibe-diarize-native$exe" \
    "../desktop/src-tauri/binaries/vibe-diarize-native-$triple$exe"
```

### [high/bug] desktop/src/pages/settings/sections/shared.tsx:48-60

Info-кнопка внутри RowLabel ломает ActionRow. ActionRow (строка 139 этого же файла) сам рендерит `<button>` и передаёт description в RowLabel (строка 150), а с этим изменением при наличии description внутрь внешней кнопки вкладывается ещё одна `<button>`. Это невалидный HTML (interactive content внутри <button> — React выдаст validateDOMNesting-warning, страдает доступность), а клик по info-иконке всплывает к внешней кнопке и запускает действие строки: в tuning.tsx:82/95 откроются страницы Whisper/Audio, а в transcription.tsx:49 (destructive-строка) клик по «?» запустит удаление всех проектов вместо показа подсказки. Затронутые вызовы: tuning.tsx (whisperOptionsInfo, audioProcessingInfo), transcription.tsx (deleteAllProjectsInfo), ai.tsx (AiTaskLink — m.on()/m.off()). Предложение: в RowLabel рендерить триггер тултипа как неинтерактивный `<span>` с `tabIndex={0}` (Radix TooltipTrigger работает и на нём — валидно внутри кнопки) и добавить stopPropagation для pointer/click-событий, либо добавить флаг вроде `interactiveHelp` и отключать кнопку-триггер при рендере внутри ActionRow. Тест в shared.test.tsx покрывает только SettingsRow — стоит добавить кейс ActionRow с description.

**Existing:**

```
					{description && (
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									aria-label={m.parameterHelp()}
									className="flex h-4 w-4 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70">
									<Info className="h-3.5 w-3.5" />
								</button>
							</TooltipTrigger>
							<TooltipContent className="max-w-xs">{description}</TooltipContent>
						</Tooltip>
					)}
```

**Suggestion:**

```
					{description && (
						<Tooltip>
							<TooltipTrigger asChild>
								{/* A span, not a button: RowLabel is also rendered inside ActionRow's <button>,
								   where a nested <button> is invalid HTML and its clicks would trigger the row action. */}
								<span
									role="button"
									tabIndex={0}
									aria-label={m.parameterHelp()}
									onClick={(event) => event.stopPropagation()}
									onMouseDown={(event) => event.stopPropagation()}
									className="flex h-4 w-4 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70">
									<Info className="h-3.5 w-3.5" />
								</span>
							</TooltipTrigger>
							<TooltipContent className="max-w-xs">{description}</TooltipContent>
						</Tooltip>
					)}
```

### [unset/maintainability] desktop/src-tauri/src/cmd/config.rs:19-23

Новые публичные константы `UNLOAD_TIMEOUT_MINUTES_KEY` и `DEFAULT_UNLOAD_TIMEOUT_MINUTES` дословно дублируют уже существующие приватные `CONFIG_KEY_UNLOAD_TIMEOUT_MINUTES` (строка 18) и `DEFAULT_UNLOAD_TIMEOUT_MINUTES` (строка 24) в `src/handoff/transcribe.rs` — одинаковая строка ключа, одинаковый дефолт 5 и почти одинаковый doc-комментарий «Matches the frontend default». Теперь один ключ конфигурации описан в двух независимых местах: при переименовании ключа или смене дефолта одно из них легко пропустить, и handoff-транскрипция начнёт расходиться с UI и движком. Стоит убрать локальные константы в `handoff/transcribe.rs` и переиспользовать эти, как это уже сделано для `api_server_enabled`.

**Existing:**

```
/// Config key for how long the engine may keep a model loaded. Must match `CONFIG_KEYS.unloadTimeoutMinutes`.
pub const UNLOAD_TIMEOUT_MINUTES_KEY: &str = "model.unloadTimeoutMinutes";

/// Matches the frontend default in `providers/preference.tsx`.
pub const DEFAULT_UNLOAD_TIMEOUT_MINUTES: u32 = 5;
```

**Suggestion:**

```
// handoff/transcribe.rs: заменить локальные константы на переиспользование
use crate::cmd::config::{DEFAULT_UNLOAD_TIMEOUT_MINUTES, UNLOAD_TIMEOUT_MINUTES_KEY};
```

### [low/maintainability] desktop/src/lib/config-store.ts:28-36

Новая `applyConfigValue` дословно повторяет логику сравнения/установки/удаления/notify из `applyExternalConfig` ниже. Внешний конфиг можно прогнать тем же помощником — источник истинности для семантики «значение изменилось» останется один, и правка (например, в сравнении) не разъедется между двумя функциями. Поведение идентично: отсутствующий ключ в JSON-файле даёт `undefined` → удаление.

**Existing:**

```
/** Apply one changed value, waking subscribers only when it really moved. */
function applyConfigValue(key: string, value: unknown) {
	const exists = value !== undefined
	if (!exists && !cache.has(key)) return
	if (exists && cache.has(key) && JSON.stringify(cache.get(key)) === JSON.stringify(value)) return
	if (exists) cache.set(key, value)
	else cache.delete(key)
	notify(key)
}
```

**Suggestion:**

```
/** Replace the cache with a config file edited from outside, waking only the keys that moved. */
function applyExternalConfig(next: Record<string, unknown> | null) {
	const incoming = next ?? {}
	for (const key of new Set([...cache.keys(), ...Object.keys(incoming)])) applyConfigValue(key, incoming[key])
}
```

### [unset/maintainability] desktop/src/lib/config.ts:11-16

Базовый URL 'https://kisev.github.io/vibe/changelog' захардкожен трижды в трёх ветках (без версии, dev-алиас, конкретный релиз). При смене хоста/пути придётся править три места, а `repoURL` выше уже несёт тот же origin. Стоит вынести базу в константу рядом с остальными URL файла и собирать ветки из неё.

**Existing:**

```
export const changelogURL = (version?: string) => {
	if (!version) return 'https://kisev.github.io/vibe/changelog'
	const wanted = version.replace(/^v/, '')
	if (wanted === 'dev' || wanted === 'unreleased' || wanted.includes('-dev.')) return 'https://kisev.github.io/vibe/changelog/dev'
	return `https://kisev.github.io/vibe/changelog/${version}`
}
```

**Suggestion:**

```
const changelogBaseURL = 'https://kisev.github.io/vibe/changelog'

export const changelogURL = (version?: string) => {
	if (!version) return changelogBaseURL
	const wanted = version.replace(/^v/, '')
	if (wanted === 'dev' || wanted === 'unreleased' || wanted.includes('-dev.')) return `${changelogBaseURL}/dev`
	return `${changelogBaseURL}/${version}`
}
```

### [medium/bug] desktop/src/lib/model-comparison.ts:167-168

Несогласованность вывода при диаризации: в `transcribe` теперь передаётся `diarize_model`, и сегменты получают `speaker`, но `renderMarkdown` в этом же IO по-прежнему жёстко вызывает `renderExport(..., { showSpeakers: false, speakerLabel: '' })`. В итоге артефакт на диске (файл, на который ведёт кнопка «Show in folder» и `outputPath`) молча теряет метки говорящих, хотя окно результатов показывает `[Speaker N]` — включённая пользователем опция не отражается в сохранённом выводе. Стоит связать флаг с диаризацией (`showSpeakers: diarizeModelPath != null`) и передать настоящий `speakerLabel` (как это делает основной поток: `speakerLabel: m.speakerPrefix()`; при пустой строке `speakerName` даст метки вида " 1"), например прокинув его из секции.

**Existing:**

```
					...(vadModel ? { vad_model: vadModel } : {}),
					...(diarizeModelPath ? { diarize_model: diarizeModelPath } : {}),
```

**Suggestion:**

```
		// renderMarkdown должен отражать ту же опцию:
		renderMarkdown: (name, segments) =>
			renderExport('md', { name, path: '', segments }, {
				direction: 'ltr',
				theme: 'light',
				showTimestamps: true,
				showSpeakers: diarizeModelPath != null,
				speakerLabel: 'Speaker', // или m.speakerPrefix(), если прокинуть из секции
```

### [low/maintainability] desktop/src/lib/model.ts:56-60

Ключи AUXILIARY_NAMES дублируют значения бизнес-констант из config.ts: 'nemotron-3-diarization-q8_0.gguf' — это config.diarizeModelFilename, а 'ggml-silero-v6.2.0.bin' — config.vadModelFilename. Оба идентификатора уже импортируются в этом же файле (строка 6) и используются как источник истины в AUXILIARY_MODEL_FILENAMES ниже. При обновлении версии диаризационной или VAD-модели в config.ts (что заведомо планируется — см. комментарии про миграцию в config.ts) маппинг молча перестанет совпадать, и имя откатится к generic-разбору имени файла. Лучше собрать ключи из самих констант, как это уже сделано для AUXILIARY_MODEL_FILENAMES.

**Existing:**

```
/** Auxiliary models the catalog does not list, named as their projects do. */
const AUXILIARY_NAMES: Record<string, string> = {
	'nemotron-3-diarization-q8_0.gguf': 'Nemotron-3-Diarization Q8_0',
	'ggml-silero-v6.2.0.bin': 'Silero VAD v6.2.0',
}
```

**Suggestion:**

```
/** Auxiliary models the catalog does not list, named as their projects do. */
const AUXILIARY_NAMES: Record<string, string> = {
	[diarizeModelFilename.toLowerCase()]: 'Nemotron-3-Diarization Q8_0',
	[vadModelFilename.toLowerCase()]: 'Silero VAD v6.2.0',
}
```

### [low/maintainability] desktop/src/pages/settings/sections/models-catalog.tsx:532-532

Миграция на `getModelDisplayName` выполнена частично: в этом же файле fallback для переименования (строки 536 и 559) всё ещё использует `getFriendlyModelName`. Для одного и того же установленного файла карточка покажет каталогное имя («Name · Q8_0»), а предзаполнение поля переименования — имя, выведенное из имени файла («Name Q8_0»). Стоит заменить оба оставшихся вызова на `getModelDisplayName`, чтобы дефолтное имя записи было единым (или полностью убрать `getFriendlyModelName` из импорта, если заменить везде).

**Existing:**

```
					displayName={vm.preference.modelDisplayNames[entry.path] ?? getModelDisplayName(entry.name)}
```

**Suggestion:**

```
					renaming={renamingFor(entry.path, vm.preference.modelDisplayNames[entry.path] ?? getModelDisplayName(entry.name))}
```

### [medium/performance] desktop/src/pages/settings/sections/models-comparison-results.tsx:137-140

Пословный дифф вычисляется прямо в теле рендера без мемоизации: для каждой колонки `diffWords(baselineText, text)` (алгоритм Майерса, O((N+M)·D), до 20 000 токенов и 2 000 правок на пару) и `transcriptText` пересчитываются при каждом переключении highlight или смене базовой линии — то есть ровно в тех взаимодействиях, где важна отзывчивость. Для длинных транскриптов (1–1,5 часа, близко к бюджету MAX_DIFF_TOKENS) это может дать заметные фризы по всем колонкам сразу. Стоит вынести тексты и диффы в useMemo (по [runs, baseline, baselineText]), а в колонках читать уже готовые значения.

**Existing:**

```
							const isBaseline = run.model.path === baseline?.model.path
							const text = transcriptText(run.segments ?? [])
							const words = tokenize(text).length
							const diff = isBaseline ? null : diffWords(baselineText, text)
```

**Suggestion:**

```
	const texts = useMemo(
		() => new Map(runs.map((run) => [run.model.path, transcriptText(run.segments ?? [])])),
		[runs],
	)
	const diffs = useMemo(() => {
		const baselinePathValue = baseline?.model.path
		return new Map(
			runs
				.filter((run) => run.status === 'done')
				.map((run) => [
					run.model.path,
					run.model.path === baselinePathValue ? null : diffWords(baselineText, texts.get(run.model.path) ?? ''),
				]),
		)
	}, [runs, baseline, baselineText, texts])
	// в теле колонки:
	// const text = texts.get(run.model.path) ?? ''
	// const diff = diffs.get(run.model.path) ?? null
```

### [low/style] desktop/src/pages/settings/sections/models-comparison-results.tsx:48-57

Вложенный тернарный оператор: условие `part.kind === 'same'` снаружи и второй тернар внутри атрибута className — по правилам проекта вложенные тернарники не допускаются, и карту классов по `kind` читать проще. Достаточно словаря для двух вариантов подсветки.

**Existing:**

```
part.kind === 'same' ? (
					<span key={index}>{part.text}</span>
				) : (
					<span
						key={index}
						className={
							part.kind === 'added'
								? 'rounded-[2px] bg-emerald-500/25 text-emerald-800 dark:text-emerald-200'
								: 'rounded-[2px] bg-red-500/20 text-red-700 line-through decoration-red-500/70 dark:text-red-300'
						}>
```

**Suggestion:**

```
const DIFF_HIGHLIGHT_CLASS = {
	added: 'rounded-[2px] bg-emerald-500/25 text-emerald-800 dark:text-emerald-200',
	removed: 'rounded-[2px] bg-red-500/20 text-red-700 line-through decoration-red-500/70 dark:text-red-300',
} as const

// в DiffText:
<span key={index} className={DIFF_HIGHLIGHT_CLASS[part.kind as keyof typeof DIFF_HIGHLIGHT_CLASS]}>
```

### [low/bug] desktop/src/pages/settings/sections/models-comparison.tsx:84-97

Тот же незащищённый эффект, что и в models-speaker.tsx: при reject от `get_models_folder`/`isModelFileUsable` возникает необработанный rejection, `diarizeModelPath` останется null и переключатель диаризации молча не появится без диагностики. Стоит обернуть в try/catch (достаточно тихо оставить null) и/или использовать helper `getModelsFolder()` из ~/lib/model.

**Existing:**

```
	useEffect(() => {
		let active = true
		void (async () => {
			const folder = await invoke<string>('get_models_folder')
			const path = await join(folder, config.diarizeModelFilename)
			const usable = await isModelFileUsable(path)
			if (!active) return
			setDiarizeModelPath(usable ? path : null)
			setDiarize(usable)
		})()
		return () => {
			active = false
		}
	}, [])
```

**Suggestion:**

```
	useEffect(() => {
		let active = true
		void (async () => {
			try {
				const folder = await invoke<string>('get_models_folder')
				const path = await join(folder, config.diarizeModelFilename)
				const usable = await isModelFileUsable(path)
				if (!active) return
				setDiarizeModelPath(usable ? path : null)
				setDiarize(usable)
			} catch (error) {
				console.error('failed to check the speaker-separation model:', error)
			}
		})()
		return () => {
			active = false
		}
	}, [])
```

### [medium/bug] desktop/src/pages/settings/sections/models-comparison.tsx:90-92

Состояние снимается ровно один раз при монтировании и больше не обновляется. Обе группы живут на одной странице настроек: если модель разделения говорящих скачана в `SpeakerSeparationModelGroup` прямо над этой секцией, переключатель диаризации здесь так и не появится, пока пользователь не перезайдёт в настройки (и наоборот — при удалении файла извне строка останется со stale-путём, и запуск упадёт с ошибкой транскрипции). `vm` уже обновляет модели по событию `tauri://focus` (view-model.ts); этой проверке нужен аналогичный механизм — перевычислять по фокусу/после загрузки или поднять состояние в vm.

**Existing:**

```
		if (!active) return
		setDiarizeModelPath(usable ? path : null)
		setDiarize(usable)
```

### [low/bug] desktop/src/pages/settings/sections/models-speaker.tsx:28-41

Асинхронная цепочка `get_models_folder` → join → isModelFileUsable выполняется без try/catch: отказ IPC или исключение из `fsExt.exists` (например, права на папку) даст необработанный rejection, а строка навсегда останется в состоянии 'checking' с бесконечным спиннером. Основной поток (buildSharedOptions в use-transcribe-queue.ts) специально оборачивает тот же `isModelFileUsable` в try/catch — здесь стоит так же откатываться в 'missing'. Заодно можно переиспользовать экспортированный helper `getModelsFolder()` из ~/lib/model вместо прямого invoke.

**Existing:**

```
	useEffect(() => {
		let active = true
		void (async () => {
			const folder = await invoke<string>('get_models_folder')
			const path = await join(folder, config.diarizeModelFilename)
			const usable = await isModelFileUsable(path)
			if (!active) return
			setModelPath(path)
			setState(usable ? 'installed' : 'missing')
		})()
		return () => {
			active = false
		}
	}, [])
```

**Suggestion:**

```
	useEffect(() => {
		let active = true
		void (async () => {
			try {
				const folder = await invoke<string>('get_models_folder')
				const path = await join(folder, config.diarizeModelFilename)
				const usable = await isModelFileUsable(path)
				if (!active) return
				setModelPath(path)
				setState(usable ? 'installed' : 'missing')
			} catch (error) {
				console.error('failed to check the speaker-separation model:', error)
				if (active) setState('missing')
			}
		})()
		return () => {
			active = false
		}
	}, [])
```

### [low/bug] desktop/src/pages/settings/sections/models-speaker.tsx:51-52

Тихий отказ без обратной связи: `downloadModel` возвращает `null` не только при исключении — `download_model` может завершиться со статусом не `completed` (отмена, обрыв). В этом分支 пользователь видит, как прогресс исчезает и кнопка просто возвращается в «missing» без единого сообщения, тогда как ветка `catch` показывает toast. Сравните с `diarization-migration.ts`, где `!downloaded` обрабатывается `toast.error(...)`.

**Existing:**

```
		if (downloaded) toast.success(m.downloadComplete())
		setState(downloaded ? 'installed' : 'missing')
```

**Suggestion:**

```
		if (downloaded) toast.success(m.downloadComplete())
		else toast.error(String(new Error('diarization model download did not complete')))
		setState(downloaded ? 'installed' : 'missing')
```

### [low/bug] desktop/src/pages/settings/sections/updater-controls.tsx:71-76

Переключатель каналов не блокируется во время загрузки/установки (`busy`). Переключение канала в момент загрузки запускает `checkNow` → Rust `update_check` очищает `PendingUpdate` (`*guard = None`) и записывает туда манифест нового канала; завершившаяся загрузка затем прикрепляет свои байты к чужому манифесту, и `update_install` упадёт на проверке подписи — уже после того, как API-сервер был остановлен. Стоит добавить `disabled={busy}`, как у кнопки ручной проверки.

**Existing:**

```
							<button
								key={value}
								type="button"
								role="radio"
								aria-checked={selected}
								onClick={() => setChannel(value)}
```

**Suggestion:**

```
							<button
								key={value}
								type="button"
								role="radio"
								aria-checked={selected}
								disabled={busy}
								onClick={() => setChannel(value)}
```

### [low/bug] desktop/src/pages/settings/sections/updater-controls.tsx:57-57

Условие `devLineBelow` неточно: комментарий «semver sorts it below what is installed» верен только при совпадении основной версии (`1.0.0-dev.N < 1.0.0`). Если dev-линия уже ушла на следующий цикл (манифест `1.1.0-dev.1`, а установлена `1.0.0`), семвер считает `1.1.0-dev.1 > 1.0.0`, плагин предложит обновление, `checkState` станет `'available'` — но описание всё равно покажет «Dev builds sort below your installed version…», что противоречит показанной тут же кнопке «update now». Текст границы уместен только когда на dev-канале ничего не предложено, т.е. когда `checkState === 'current'`.

**Existing:**

```
	const devLineBelow = channel === 'dev' && version !== '' && !version.includes('-dev.')
```

**Suggestion:**

```
	const devLineBelow = channel === 'dev' && checkState === 'current' && version !== '' && !version.includes('-dev.')
```

### [low/bug] desktop/src/pages/settings/sections/updater-controls.tsx:88-88

Текст «No candidate on this line» применяется только к beta-каналу, но то же состояние «пустой линии» достижимо и на dev-канале: когда `dev.json` отсутствует (404), Rust `update_check` через `channel_absent` возвращает `Ok(None)`, `checkNow` ставит `checkState: 'current'`, и пользователь на dev-сборке увидит «Up to date» — хотя на линии вообще ничего нет. Beta.json в этом же обновлении как раз удалён (линия пуста по замыслу), т.е. кейс пустого манифеста реален. Логичнее распространить условие на все не-stable каналы (для stable пустой линии не бывает) или передавать из проверки признак «линия пуста».

**Existing:**

```
				label={checkState === 'current' && channel === 'beta' ? m.updateNoCandidate() : statusText(checkState, manifest?.version, lastCheckedAt)}
```

**Suggestion:**

```
				label={checkState === 'current' && channel !== 'stable' ? m.updateNoCandidate() : statusText(checkState, manifest?.version, lastCheckedAt)}
```

### [medium/bug] desktop/src/providers/updater.tsx:176-179

После успешной установки состояние возвращается в 'available', и кнопка «Обновить сейчас» остаётся видимой, если пользователь отклонил перезапуск. Но `update_install` в Rust делает `pending.0.lock().await.take()` —\_pending-обновление уже поглощено. Повторный клик по кнопке вызовет `update_download`, который вернёт Err("no update to download"), и `updateApp` покажет модальное окно ошибки уже после успешного обновления. Лучше после `askForRelaunch()` перезапустить проверку (`await checkNow()`): она заново заполнит pending (текущая запущенная версия всё ещё меньше манифестной) и выставит согласованное состояние, либо ввести отдельное состояние «ожидает перезапуска».

**Existing:**

```
		setUpdating(false)
		setCheckState('available')
		await askForRelaunch()
		setAvailableUpdate(false)
```

**Suggestion:**

```
		setUpdating(false)
		setCheckState('available')
		await askForRelaunch()
		setAvailableUpdate(false)
		await checkNow()
```

### [low/maintainability] desktop/src/providers/updater.tsx:89-91

Запись `channelRef.current = channel` прямо в теле рендера — антипаттерн React: при concurrent-рендеринге рендер может быть отброшен, а запись в ref останется. Надёжнее токен запроса: инкремент при каждом запуске `checkNow` и сравнение `id` в колбэках — это заодно закрывает сценарий A→B→A, где первый ответ для канала A может перезаписать результат второго.

**Existing:**

```
	// A slow check on the previous channel must not overwrite the result of the new one.
	const channelRef = useRef(channel)
	channelRef.current = channel
```

**Suggestion:**

```
	// A slow check on the previous channel must not overwrite the result of the new one;
	// an id per invocation also survives an A→B→A switch.
	const checkIdRef = useRef(0)
	// в checkNow:
	// const id = ++checkIdRef.current
	// ... if (checkIdRef.current !== id) return
```

### [low/test] desktop/src/providers/updater.tsx:136-139

Стартовая проверка `checkNow` теперь не глотает ошибку, а выставляет `checkState: 'error'` — и в browser-режиме с mock-tauri команда `update_check` не замокана (route() бросает «unhandled command», см. mock-tauri/runtime.ts), поэтому при каждом запуске мок-режима в разделе Updates будет висеть «Update failed» с сырой строкой мока. Для `stop_api_server_process` мок-обработчик в этом же обновлении добавили, а для команд апдейтера — нет (`plugin:updater|check` больше не вызывается, приложение ходит через кастомные команды). Стоит добавить обработчики `update_check` / `update_download` / `update_install` в mock-tauri, чтобы мок-режим и e2e-спеки, открывающие настройки, видели штатное состояние.

**Existing:**

```
	// Checked on startup and on a channel switch, so moving to another line offers its build right away.
	useEffect(() => {
		void checkNow()
	}, [checkNow])
```

**Suggestion:**

```
// В desktop/src/mock-tauri/handlers/plugins.ts рядом с секцией updater:
// update_check: () => null,
// update_download: () => { console.warn('[mock-updater] download is a no-op') },
// update_install: () => { console.warn('[mock-updater] install is a no-op') },
```

### [low/bug] desktop/src/providers/updater.tsx:199-200

Сбой скачивания/установки попадает в тот же `checkState: 'error'`, что и сбой проверки, а единственная подпись для него — `m.updateFailed()` («The last update check failed»). Пользователь, у которого упала именно установка (после успешной проверки), увидит сообщение о проваленной проверке; реальную причину видно лишь в description (`checkError`). Стоит различать источник ошибки, например флаг/стадию `errorStage: 'check' | 'install'` в контексте и отдельная подпись для установки.

**Existing:**

```
				setCheckError(String(e))
				setCheckState('error')
```

**Suggestion:**

```
				setCheckError(String(e))
				setErrorStage('install')
				setCheckState('error')
```

### [high/security] desktop/src-tauri/src/browser_policy.rs:145-154

`should_block` работает по принципу fail-open: любая схема, кроме http/ws/https/wss, и любой нераспарсируемый URL проходят без проверки. Верхнеуровневая навигация на `file:`, `javascript:` или произвольную кастомную схему (включая зарегистрированные самим приложением `zoommtg:`/`msteams:`) не блокируется allowlist'ом, что противоречит заявленному инварианту «navigation is always gated» (политики без режима off). Стоит инвертировать логику: пропускать только явно перечисленные engine-internal схемы (about/data/blob), а остальное блокировать — как минимум в контексте навигации; для нераспарсируемых URL — тоже отказывать.

**Existing:**

```
pub fn should_block(url: &str, allowed: &[String]) -> bool {
    let Ok(parsed) = Url::parse(url) else {
        return false;
    };
    match parsed.scheme() {
        "http" | "ws" => true,
        "https" | "wss" => parsed.host_str().map(|host| !is_allowed_host(host, allowed)).unwrap_or(true),
        _ => false,
    }
}
```

**Suggestion:**

```
pub fn should_block(url: &str, allowed: &[String]) -> bool {
    let Ok(parsed) = Url::parse(url) else {
        return true;
    };
    match parsed.scheme() {
        "http" | "ws" => true,
        "https" | "wss" => parsed.host_str().map(|host| !is_allowed_host(host, allowed)).unwrap_or(true),
        // Engine internals only; file:, javascript: and custom schemes are refused.
        "about" | "data" | "blob" => false,
        _ => true,
    }
}
```

### [low/performance] desktop/src-tauri/src/browser_policy.rs:123-125

`format!(".{entry}")` аллоцирует новую String на каждую запись allowlist'а при каждой проверке хоста. В strict-режиме на Windows `is_allowed_host` вызывается из WebView2 WebResourceRequested-фильтра для каждого запроса ресурса — это горячий путь. Тот же результат достигается без аллокации через `strip_suffix` с проверкой точки-разделителя.

**Existing:**

```
    allowed
        .iter()
        .any(|entry| host == *entry || host.ends_with(&format!(".{entry}")))
```

**Suggestion:**

```
    allowed.iter().any(|entry| {
        host == *entry || host.strip_suffix(entry.as_str()).is_some_and(|rest| rest.ends_with('.'))
    })
```

### [medium/security] desktop/src-tauri/src/browser_policy.rs:86-88

`normalize_host` принимает любые имена, включая голые публичные суффиксы («com», «co.uk») и хосты из произвольных схем. Вместе с правилом «сам хост и поддомены» запись «com» делает разрешённым каждый `*.com`-сайт — allowlist молча перестаёт быть узким, без какого-либо предупреждения пользователю. Стоит отклонять записи, являющиеся публичными суффиксами (минимальный список или crate `publicsuffix`), по крайней мере в `allow_host`/`save_allowed`.

**Existing:**

```
    let parsed = Url::parse(&candidate).ok()?;
    let host = parsed.host_str()?.trim_end_matches('.').to_ascii_lowercase();
    (!host.is_empty()).then_some(host)
```

### [low/performance] desktop/src-tauri/src/browser_policy.rs:164-166

`allowed()` клонирует весь Vec<String> allowlist'а при каждом вызове. На Windows это горячий путь: `block_resource_request` вызывает его на КАЖДЫЙ запрос ресурса (картинки, скрипты, XHR) для каждой открытой страницы — по аллокации Vec + по String на каждый хост на запрос. Дешевле хранить снимок в `Arc<Vec<String>>` под мьютексом и возвращать `Arc`-клон (или проверять хост под локом).

**Existing:**

```
pub fn allowed() -> Vec<String> {
    ALLOWED.lock().map(|cache| cache.clone()).unwrap_or_default()
}
```

**Suggestion:**

```
static ALLOWED: Lazy<Mutex<Arc<Vec<String>>>> = Lazy::new(|| Mutex::new(Arc::new(Vec::new())));

pub fn allowed() -> Arc<Vec<String>> {
    ALLOWED.lock().map(|cache| cache.clone()).unwrap_or_default()
}
```

### [medium/bug] desktop/src-tauri/src/custom_protocol.rs:41-50

`register_schemes` перезаписывает `command` в уже существующих ключах HKCU\\Software\\Classes\<scheme> (например, регистрацию реального клиента Zoom/Teams, живущую в том же HKCU), а `unregister_schemes` удаляет ключ целиком через `delete_subkey_all`. После включения и последующего выключения настройки прежний владелец схемы теряет регистрацию без сохранения и восстановления: чужие `zoommtg:`/`msteams:`-ссылки могут перестать открываться вовсе. Стоит при регистрации сохранять прежний `command` в собственном ключе Vibe, а при unregister восстанавливать его и удалять ключ только если он был создан приложением.

**Existing:**

```
    pub fn unregister_schemes(schemes: &[&str]) -> Result<()> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let classes = hkcu.open_subkey_with_flags("Software\\Classes", KEY_ALL_ACCESS)?;
        for scheme in schemes {
            // A missing key is the state we want; only a key that exists but
            // cannot be removed is an error worth reporting.
            let _ = classes.delete_subkey_all(scheme);
        }
        Ok(())
    }
```

**Suggestion:**

```
    for scheme in schemes {
        // Only remove keys Vibe created; otherwise restore the previous owner's
        // command saved at registration time.
        if saved_previous_command(scheme)?.is_some() {
            restore_previous_command(scheme)?;
        } else {
            let _ = classes.delete_subkey_all(scheme);
        }
    }
```

### [low/bug] desktop/src-tauri/src/custom_protocol.rs:97-103

Удаление .desktop-файла не отменяет дефолт, установленный ранее через `xdg-mime default`: в `~/.config/mimeapps.list` остаётся запись `x-scheme-handler/…=vibe-meeting-handler.desktop`, указывающая на удалённый файл. Схема может остаться с неработающим обработчиком, и другие клиенты не подхватят её автоматически. Перед удалением файла стоит сбросить ассоциации (например, `xdg-mime unset` или удаление defunct-записей из mimeapps.list).

**Existing:**

```
    pub fn unregister_schemes(_schemes: &[&str]) -> Result<()> {
        let path = desktop_file()?;
        if path.exists() {
            fs::remove_file(path)?;
        }
        Ok(())
    }
```

### [medium/bug] desktop/src-tauri/src/custom_protocol.rs:44-48

Комментарий прямо говорит, что «ключ, который существует, но не удаляется — это ошибка, о которой стоит сообщить», однако `let _ = classes.delete_subkey_all(scheme)` отбрасывает ВСЕ ошибки, включая PermissionDenied и другие реальные отказы. В результате `set_meeting_schemes_enabled(false)` вернёт Ok, флаг `meeting.schemesEnabled` будет сохранён как false, а в реестре HKCU останется живая регистрация Vibe на zoommtg:/msteams: — настройка будет показывать «выключено», а ссылки продолжат открывать приложение. Нужно игнорировать только NotFound и пробрасывать остальные ошибки.

**Existing:**

```
        for scheme in schemes {
            // A missing key is the state we want; only a key that exists but
            // cannot be removed is an error worth reporting.
            let _ = classes.delete_subkey_all(scheme);
        }
```

**Suggestion:**

```
        for scheme in schemes {
            // A missing key is the state we want; only a key that exists but
            // cannot be removed is an error worth reporting.
            if let Err(error) = classes.delete_subkey_all(scheme) {
                if error.kind() != std::io::ErrorKind::NotFound {
                    return Err(error.into());
                }
            }
        }
```

### [high/bug] desktop/src-tauri/src/custom_protocol.rs:85-89

Аргументы для `xdg-mime` собираются неверно: `flat_map(|scheme| ["x-scheme-handler/".to_string(), scheme.to_string()])` передаёт MIME-тип как ДВА отдельных аргумента — `"x-scheme-handler/"` и, например, `"zoommtg"`. Команда получается `xdg-mime default vibe-meeting-handler.desktop x-scheme-handler/ zoommtg …`, тогда как правильный синтаксис — по одному аргументу на полный MIME-тип (`x-scheme-handler/zoommtg`), как это же значение корректно формируется в `desktop_entry` через `format!("x-scheme-handler/{scheme}")`. В результате дефолтный обработчик для реальных схем никогда не назначается: в `mimeapps.list` попадают мусорные записи `x-scheme-handler/=` и `zoommtg=`, а `xdg-mime`, скорее всего, завершится с кодом 0 — `set_meeting_schemes_enabled(true)` сообщит об успехе, хотя регистрация не работает.

**Existing:**

```
            .args(
                schemes
                    .iter()
                    .flat_map(|scheme| ["x-scheme-handler/".to_string(), scheme.to_string()]),
            )
```

**Suggestion:**

```
            .args(schemes.iter().map(|scheme| format!("x-scheme-handler/{scheme}")))
```

### [medium/bug] desktop/src-tauri/src/meeting_browser.rs:573-590

Состояние сессии (усечение forward-истории, смена url/host, can_back/can_forward) мутируется до вызова `page.navigate`. Если navigate завершится ошибкой, метод вернёт Err, но история уже обрезана и SESSION-событие не эмитится: адресная строка хрома и `info` рассинхронизируются с реально показанной страницей, а урезанные forward-записи потеряны безвозвратно. В `meeting_browser_navigate` порядок обратный (сначала navigate, потом обновление состояния) — стоит привести обе команды к одному порядку.

**Existing:**

```
    let (info, count) = {
        let mut runtime = lock_runtime()?;
        let state = runtime
            .sessions
            .get_mut(&session)
            .ok_or_else(|| format!("Unknown browser session {session}"))?;
        state.history.truncate(state.index + 1);
        state.history.push(parsed.as_str().to_string());
        state.index = state.history.len() - 1;
        state.info.url = parsed.as_str().to_string();
        state.info.host = browser_policy::host_of(&state.info.url);
        state.info.can_back = state.index > 0;
        state.info.can_forward = false;
        (state.info.clone(), runtime.session_count())
    };
    page.navigate(parsed)
        .map_err(|error| format!("Could not navigate the browser page: {error}"))?;
    emit_session(&app, &info);
```

**Suggestion:**

```
    let target = parsed.as_str().to_string();
    page.navigate(parsed)
        .map_err(|error| format!("Could not navigate the browser page: {error}"))?;
    let (info, count) = {
        let mut runtime = lock_runtime()?;
        let state = runtime
            .sessions
            .get_mut(&session)
            .ok_or_else(|| format!("Unknown browser session {session}"))?;
        state.history.truncate(state.index + 1);
        state.history.push(target.clone());
        state.index = state.history.len() - 1;
        state.info.url = target;
        state.info.host = browser_policy::host_of(&state.info.url);
        state.info.can_back = state.index > 0;
        state.info.can_forward = false;
        (state.info.clone(), runtime.session_count())
    };
    emit_session(&app, &info);
```

### [medium/bug] desktop/src-tauri/src/meeting_browser.rs:359-366

Поиск существующей сессии по URL и вставка новой выполняются в двух разных критических секциях, при этом команда асинхронная: два одновременных вызова (двойной клик по ссылке встречи, повторный invoke из `open_meeting_link`) оба не найдут существующую сессию и создадут две сессии и два окна для одного и того же URL. Поиск и вставку стоит выполнять под одним захватом RUNTIME (check-and-insert атомарно).

**Existing:**

```
    let existing = {
        let runtime = lock_runtime()?;
        runtime
            .sessions
            .values()
            .find(|state| state.info.url == normalized)
            .map(|state| state.info.clone())
    };
```

**Suggestion:**

```
    let existing = {
        let mut runtime = lock_runtime()?;
        match runtime.sessions.values().find(|state| state.info.url == normalized) {
            Some(state) => Some(state.info.clone()),
            None => {
                // Insert the session placeholder atomically with the duplicate check.
                let session = NEXT_SESSION.fetch_add(1, Ordering::Relaxed);
                runtime.sessions.insert(
                    session,
                    BrowserSession {
                        info: BrowserSessionInfo { session, url: normalized.clone(), host, can_back: false, can_forward: false },
                        history: vec![normalized],
                        index: 0,
                        force_close: false,
                        loaded: false,
                    },
                );
                None
            }
        }
    };
```

### [low/documentation] desktop/src-tauri/src/meeting_browser.rs:749-750

Обе `unsafe fn` (`attach_resource_filter`, `block_resource_request`) не имеют собственного контракта `# Safety` — SAFETY-комментарий есть только у места вызова `with_webview`. Здесь скрыто несколько инвариантов: вызов только на UI/main-потоке WebView2 (COM-требование), время жизни клонов `environment`/`AppHandle`, удерживаемых замыканием handler'а после возможного разрушения webview, и владение `PWSTR` через `take_pwstr`. Стоит описать инварианты в `# Safety` у каждой функции, чтобы будущие вызовы не нарушали их молча.

**Existing:**

```
#[cfg(windows)]
unsafe fn attach_resource_filter(platform: &tauri::webview::PlatformWebview, app: &AppHandle) -> Result<(), String> {
```

### [low/bug] desktop/src-tauri/src/meeting_browser.rs:422-426

Обработчик `on_window_event` регистрируется уже после того, как окно и webviews построены: если окно будет закрыто или уничтожено в этом зазоре, событие `Destroyed` не будет наблюдено, `finalize_session` не выполнится, и сессия навсегда останется в RUNTIME, удерживая `IN_APP_SESSION = true` — внешний meeting-промпт будет подавлен до перезапуска приложения. Надёжнее задать обработчик на этапе билдера (`Window::builder(...).on_window_event(...)` до `.build()`), когда это возможно.

**Existing:**

```
    let window = app
        .get_window(&browser_label(session))
        .ok_or_else(|| format!("Browser window for session {session} is not open"))?;
    let handler_app = app.clone();
    window.on_window_event(move |event| match event {
```

### [medium/bug] desktop/src-tauri/src/meeting_browser.rs:720-721

Разрешение одного хоста перезагружает ВСЕ открытые page-webview безусловно: независимо от политики (в trusted-site ресурсы вообще не блокировались и перезагрузка ничего не ретраит) и независимо от того, есть ли у страницы отношение к новому хосту. При этом `allowBrowserHost` вызывается в том числе из промпта в самом browser-chrome (browser-window.tsx) — то есть посреди живой встречи в этом же окне: reload страницы встречного клиента (Zoom/Teams web) разорвёт звонок и переконнектит пользователя. Стоит перезагружать только сессии, у которых реально есть записанные заблокированные ресурсы (и только в strict-режиме), либо оставлять перезагрузку на явное действие пользователя.

**Existing:**

```
/// Reload every page webview that is open, on the main thread where the engine expects it.
fn reload_browser_pages(app: &AppHandle) {
```

**Suggestion:**

```
// Перезагружать стоит только strict-сессии, у которых реально были
// заблокированные запросы; безусловный reload рвёт живую встречу.
fn reload_browser_pages(app: &AppHandle) {
```

### [low/security] desktop/src-tauri/src/meeting_schemes.rs:28-33

`confno` и `pwd` вставляются в итоговый URL как есть, без валидации и percent-encoding, хотя это полностью контролируемые данные: приложение опционально регистрируется системным обработчиком zoommtg:, т.е. любая программа может подсунуть произвольную строку схемы. Значения могут содержать '/', '?', '#': `confno=../../settings` → `https://zoom.us/settings` (Url::parse нормализует dot-segments), `confno=123?admin=1` инжектит query-параметры, `pwd=a#b` превращает хвост во fragment. Итог всё равно ограничен хостом из allowlist, поэтому severity низкий, но confno у Zoom — цифровой номер встречи: достаточно валидировать его как цифры и кодировать pwd.

**Existing:**

```
    let confno = form_value(query, "confno")?;
    let mut url = format!("https://{host}/j/{confno}");
    if let Some(pwd) = form_value(query, "pwd") {
        url.push_str("?pwd=");
        url.push_str(pwd);
    }
```

**Suggestion:**

```
    let confno = form_value(query, "confno")?;
    if confno.is_empty() || !confno.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    let mut url = format!("https://{host}/j/{confno}");
    if let Some(pwd) = form_value(query, "pwd") {
        url.push_str("?pwd=");
        url.push_str(pwd);
    }
```

### [medium/bug] desktop/src/components/meeting-browser-close-gate.tsx:15-25

ask() вызывается вне try/catch: при отклонении промиса (ошибка диалога) confirmMeetingBrowserClose не отправляется вовсе — окно остаётся в состоянии prevent_close без какого-либо диалога (Rust вызывает api.prevent_close() до эмитации события). Кроме того, повторный клик по X во время открытого диалога эмитит close-requested ещё раз, и второй ask открывается поверх первого. Стоит обернуть весь обработчик в try/catch/finally и ввести флаг «диалог открыт», чтобы повторные события игнорировались.

**Existing:**

```
		const stopAndClose = await ask(m.meetingBrowserCloseQuestion(), {
				title: m.meetingBrowserCloseTitle(),
				kind: 'warning',
				okLabel: m.meetingBrowserStopAndClose(),
				cancelLabel: m.meetingBrowserKeepRecording(),
			})
			try {
				await confirmMeetingBrowserClose(event.payload.session, stopAndClose)
			} catch (error) {
				console.error('could not close the meeting browser:', error)
			}
```

**Suggestion:**

```
		if (pendingClose.current !== null) return
		pendingClose.current = event.payload.session
		try {
			const stopAndClose = await ask(m.meetingBrowserCloseQuestion(), {
				title: m.meetingBrowserCloseTitle(),
				kind: 'warning',
				okLabel: m.meetingBrowserStopAndClose(),
				cancelLabel: m.meetingBrowserKeepRecording(),
			})
			await confirmMeetingBrowserClose(event.payload.session, stopAndClose)
		} catch (error) {
			console.error('could not close the meeting browser:', error)
		} finally {
			pendingClose.current = null
		}
```

### [low/bug] desktop/src/components/meeting-browser-close-gate.tsx:43-47

Гон в паттерне подписки: unlisteners заполняется асинхронно (listen(...).then(push)), и если эффект размонтируется до резолва промисов, cleanup уже прошёл по пустому массиву — unlisten-функции не вызываются никогда, подписки утекают, а при повторном монтировании события close-requested/load-failed обрабатываются дважды (двойные ask-диалоги). В этом же PR есть корректные варианты: флаг cancelled (секция настроек meeting-browser.tsx) или unlisten.then((fn) => fn()) (record-gate) — стоит применить один из них.

**Existing:**

```
		return () => {
			unlisteners.forEach((unlisten) => unlisten())
		}
	}, [])
	return null
```

**Suggestion:**

```
		let disposed = false
		const unlisteners: (() => void)[] = []
		const track = (pending: Promise<() => void>) => pending.then((fn) => (disposed ? fn() : unlisteners.push(fn)))
		// track(listen(...)) для обоих слушателей
		return () => {
			disposed = true
			unlisteners.forEach((unlisten) => unlisten())
		}
	}, [])
```

### [high/bug] desktop/src/components/meeting-browser-record-gate.tsx:13-16

Гейт создаёт собственный экземпляр useRecording, чей isRecording — локальный useState: он узнаёт только о записях, начатых через сам гейт. Запись, запущенная из UI главного окна (session.tsx использует свой, независимый экземпляр хука), для гейта незаметна: хром получает recording:false во время активной записи и показывает кнопку «Record», а её нажатие вызывает start_record повторно — на Rust-стороне start_record не проверяет флаг RECORDING (cmd/audio.rs), и вторая запись конкурирует с первой (двойной набор потоков, два слушателя stop_record, два record_finish). Побочно startedAt.current ??= Date.now() в этом случае даёт таймер с нуля. Перед стартом стоит сверяться с Rust-истиной через isRecordingActive() из lib/meeting-browser (и при ответе на RECORDING_STATE_REQUEST_EVENT тоже), либо разделять состояние записи между гейтом и главным окном.

**Existing:**

```
export default function MeetingBrowserRecordGate() {
	const recording = useRecording(() => {})
	const latest = useRef(recording)
	latest.current = recording
```

**Suggestion:**

```
useEffect(() => {
	const unlisten = listen<{ stop: boolean }>(RECORDING_TOGGLE_EVENT, async (event) => {
		const current = latest.current
		try {
			if (event.payload.stop) await current.stopRecord()
			else {
				// A recording started elsewhere (the main window UI) must not be double-started.
				if (await isRecordingActive()) return
				await current.refreshDevices()
				await current.startRecord()
			}
		} catch (error) {
				console.error('meeting bar recording toggle failed:', error)
		}
	})
	return () => {
		unlisten.then((fn) => fn())
	}
}, [])
```

### [medium/bug] desktop/src/components/meeting-browser-record-gate.tsx:45-50

Две проблемы обработки ошибок/состояния в этом обработчике. (1) Сбои старта невидимы для хрома: `startRecord` обрабатывает ошибки внутренне — открывает error-modal в ГЛАВНОМ окне (use-recording.ts:116) или молча выходит при отказе системного разрешения (use-recording.ts:102), поэтому `catch` здесь почти никогда не срабатывает, а пользователь, смотрящий на окно встречи, видит лишь безрезультатное нажатие «Record» (модалка спрятана за окном встречи). Стоит вернуть результат наружу (rethrow) или добавить в `RECORDING_STATE_EVENT` поле ошибки, которое хром покажет в своём `error`. (2) Устаревшее замыкание: `current.startRecord` читает `inputDevice`/`outputDevice` из рендера на момент события, поэтому результат только что вызванного `refreshDevices()` на ЭТОТ запуск записи не влияет — подхваченное по hot-plug устройство попадёт в запись только со следующего тумблера. После refresh стоит читать устройства заново (например, через `readConfiguredRecordingDevices()`).

**Existing:**

```
			try {
				if (event.payload.stop) await current.stopRecord()
				else {
					await current.refreshDevices()
					await current.startRecord()
				}
```

### [high/security] desktop/src/lib/meeting-browser.ts:80-85

normalizeAllowedHost проверяет только формат DNS-меток, но не требует наличия точки: односоставные записи («com», «net», «io») проходят валидацию. Сопоставление на Rust-стороне (browser_policy.rs, is_allowed_host) — `host == entry || host.ends_with(".{entry}")`, поэтому разрешение «com» открывает ВСЕ \*.com-домены сразу и для навигации, и для ресурсов в strict-режиме: одна опечатка обнуляет весь смысл allowlist. Rust normalize_host такие записи тоже не отвергает, так что фронтенд — последний рубеж. Стоит требовать минимум две метки, при необходимости явно разрешив «localhost».

**Existing:**

```
export function normalizeAllowedHost(value: string): string | null {
	const host = value.trim().toLowerCase().replace(/\.$/, '')
	if (!host || host.length > 253) return null
	if (!host.split('.').every((label) => HOSTNAME_LABEL.test(label))) return null
	return host
}
```

**Suggestion:**

```
export function normalizeAllowedHost(value: string): string | null {
	const host = value.trim().toLowerCase().replace(/\.$/, '')
	if (!host || host.length > 253) return null
	// A single-label entry ("com", "net") would allow every subdomain of a whole TLD.
	if (host !== 'localhost' && !host.includes('.')) return null
	if (!host.split('.').every((label) => HOSTNAME_LABEL.test(label))) return null
	return host
}
```

### [low/maintainability] desktop/src/lib/meeting-browser.ts:71-71

Экспорт isRecordingActive — единственная обёртка над командой recording_active — нигде не используется (мёртвый код). При этом именно он нужен MeetingBrowserRecordGate для сверки состояния записи с Rust-истиной (см. замечание о рассинхронизации экземпляров useRecording): либо использовать его в гейте, либо удалить.

**Existing:**

```
export const isRecordingActive = () => invoke<boolean>('recording_active')
```

### [low/maintainability] desktop/src/lib/meeting-browser.ts:133-137

Мёртвые экспорты: `handOffMeetingUrl` не используется нигде в кодовой базе (глубокие ссылки идут через `handOffMeetingLink` в use-deep-links.tsx и use-single-instance.tsx), а `readConfiguredRecordingDevices` (строка ~187) тоже не имеет ни одного потребителя — все читают состояние через `readRecordingDeviceState`. Если `readConfiguredRecordingDevices` задуман для гейта/хрома (свежее чтение устройств после `refreshDevices`) — стоит подключить его там, иначе удалить оба.

**Existing:**

```
export async function handOffMeetingUrl(url: string | null): Promise<void> {
	if (!url) {
		await message(m.meetingBrowserMissingLink(), { title: m.meetingBrowserTitle(), kind: 'error' })
		return
	}
```

### [low/test] desktop/src/mock-tauri/handlers/meeting.ts:45-50

Мок расходится с Rust-контрактом в трёх местах. (1) browser_allow_host вообще не валидирует хост: принимает «https://foo» или мусор как запись allowlist-а, тогда как Rust пропускает ввод через normalize_host и отвергает не-хосты. (2) open_meeting_browser/meeting_browser_load пропускают http:// по регэкспу /^https?:///, но затем allowed() молча отвергает его и записывает хост в blocked — Rust отвергает не-https отдельной ошибкой ДО проверки allowlist и в blocked его не записывает, т.е. мок порождает побочный эффект, которого нет в проде. (3) Отсутствуют обработчики open_meeting_link (его вызывает handOffMeetingLink из use-deep-links/use-single-instance), meeting_browser_session, meeting_browser_navigate, meeting_browser_open_external, recording_active — в mock-режиме это бросит «unhandled command» и может замаскировать или наоборот породить ложные падения при e2e.

**Existing:**

```
	browser_allow_host: (args) => {
		const host = String(args.host ?? '').trim().toLowerCase()
		if (host && !allowedHosts.includes(host)) allowedHosts = [...allowedHosts, host]
		blockedHosts = blockedHosts.filter((item) => item !== host)
		return [...allowedHosts]
	},
```

**Suggestion:**

```
	browser_allow_host: (args) => {
		const host = String(args.host ?? '').trim().toLowerCase()
		if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(host)) {
			throw `[mock-meeting] Enter a bare host name, not ${host}`
		}
		if (!allowedHosts.includes(host)) allowedHosts = [...allowedHosts, host]
		blockedHosts = blockedHosts.filter((item) => item !== host)
		return [...allowedHosts]
	},
```

### [low/test] desktop/src/mock-tauri/handlers/meeting.ts:23-26

Мок не эмитит `browser-blocked-hosts`, хотя Rust рассылает полный список при каждом новом отказе (см. doc `BROWSER_BLOCKED_HOSTS_EVENT` в lib) — и другие мок-хендлеры активно эмитят события через `emitMockEvent` (server.ts, media-misc.ts, plugins.ts). В browser-режиме это ломает ровно тот сценарий, ради которого мок существует: `openLink` в настройках получает отказ → хост попадает в реестр мока, но секция «Blocked hosts» не обновится (она ждёт событие), и разрешить хост из UI нельзя до перезагрузки страницы.

**Existing:**

```
function recordBlocked(host: string) {
	if (!host || blockedHosts.includes(host)) return
	blockedHosts = [host, ...blockedHosts]
}
```

**Suggestion:**

```
import { emitMockEvent } from '../event-bus'

function recordBlocked(host: string) {
	if (!host || blockedHosts.includes(host)) return
	blockedHosts = [host, ...blockedHosts]
	emitMockEvent('browser-blocked-hosts', [...blockedHosts])
}
```

### [low/bug] desktop/src/pages/settings/sections/meeting-browser.tsx:214-216

Условие policy === 'strict' и комментарий «Nothing is recorded while trusted-site skips the resource filter» расходятся с Rust-поведением: refuse_if_blocked записывает хост в реестр при отказе НАВИГАЦИИ в обоих режимах (blocks_navigation идентичен для strict и trusted-site), а блокирует navigation и в trusted-site. В итоге в trusted-site список заблокированных хостов продолжает пополняться, но раздел скрыт и в настройках, и в поповере хрома — увидеть и разрешить накопленные хосты можно только переключившись обратно на strict. Стоит показывать раздел в обоих режимах (и поправить комментарий).

**Existing:**

```
			{/* Nothing is recorded while trusted-site skips the resource filter. */}
			{policy === 'strict' && (
				<SettingsGroup title={m.browserBlockedHosts()} description={m.browserBlockedHostsInfo()}>
```

**Suggestion:**

```
			{/* Refused navigations are recorded in both policy modes; show the remedy in both. */}
			<SettingsGroup title={m.browserBlockedHosts()} description={m.browserBlockedHostsInfo()}>
```

### [medium/bug] desktop/src/pages/settings/sections/meeting-browser.tsx:137-143

Гарантированный отказ для http:// и scheme-ссылок. `normalizeMeetingUrl` пропускает `http://` и `zoommtg://`-подобные входы без изменений (проверка `hasScheme`), но Rust-команда `open_meeting_browser` принимает только https («Only https URLs can be opened», meeting_browser.rs:340/558). То есть вставленная пользователем http-ссылка или скопированная zoommtg://-ссылка всегда заканчивается тостом с технической ошибкой — при том, что `openMeetingLink` существует ровно для отображения таких ссылок (meeting_browser.rs:663: https и scheme-ссылки, недопустимые хосты уходят в системный браузер вместо ошибки). Стоит либо повышать http→https в нормализаторе, либо для scheme-входов вызывать `openMeetingLink` (это касается и idle-hero.tsx:137 — того же паттерна).

**Existing:**

```
	async function openLink() {
		const url = normalizeMeetingUrl(link)
		if (!url || opening) return
		setOpening(true)
		try {
			await openMeetingBrowser(url)
			setLink('')
```

**Suggestion:**

```
async function openLink() {
	const url = normalizeMeetingUrl(link)
	if (!url || opening) return
	setOpening(true)
	try {
		await openMeetingLink(url)
		setLink('')
```

### [medium/bug] desktop/src/windows/browser-window.tsx:208-212

go() отправляет в meeting_browser_load сырую строку address.trim(). Rust-команда требует полный https-URL (Url::parse + проверка схемы), поэтому голый домен («zoom.us») падает с «Invalid URL ... relative URL without a base», а http://-ссылка — с «Only https URLs can be opened». Экран настроек (openLink) и idle-hero прогоняют тот же пользовательский ввод через normalizeMeetingUrl; адресная строка хрома — тот же сценарий, но без нормализации даёт сырой отказ бэкенда.

**Existing:**

```
	function go() {
		const url = address.trim()
		if (!url) return
		void run(() => loadMeetingBrowserUrl(session, url))
	}
```

**Suggestion:**

```
	function go() {
		const url = normalizeMeetingUrl(address.trim())
		if (!url) return
		void run(() => loadMeetingBrowserUrl(session, url))
	}
```

### [medium/bug] desktop/src/windows/browser-window.tsx:262-264

Поповер рендерится в DOM хром-webview, но по геометрии Rust-стороны (resize_children в meeting_browser.rs) хром растянут на всё окно и лежит ПОД страничным webview, который добавлен позже (т.е. сверху — иначе страница не получала бы ввод) и начинается с y=104. Контент поповера (max-h-56 ≈ 224px при триггере в первой строке тулбара) почти целиком уходит ниже 104px и окажется скрыт за нативным webview страницы — ровно то, чего DevicePicker избегает нативным select. Комментарий «the popover may extend over the page area» противоречит соседнему объяснению про select. Стоит либо заменить поповер на нативный select (как DevicePicker), либо открывать список отдельным окном/диалогом.

**Existing:**

```
					{/* Strict only; the popover may extend over the page area. */}
					{policy === 'strict' && blockedHosts.length > 0 && (
						<Popover>
```

### [low/bug] desktop/src/windows/browser-window.tsx:188-193

Та же гонка подписки, что и в close-gate: unlisteners заполняется асинхронно, и при размонтировании эффекта до резолва промисов listen отписки не выполнятся. Флаг active здесь уже есть — стоит использовать его и для отложенных unlisten (как в секции настроек: if (cancelled) fn()). Сегодня эффект живёт столько же, сколько webview окна, но паттерн становится хрупким при любом изменении зависимостей [session, refreshDevices].

**Existing:**

```
		return () => {
			active = false
			window.removeEventListener('focus', onFocus)
			for (const unlisten of unlisteners) unlisten()
		}
	}, [session, refreshDevices])
```

**Suggestion:**

```
		const unlisteners: (() => void)[] = []
		const track = (pending: Promise<() => void>) => pending.then((fn) => (active ? unlisteners.push(fn) : fn()))
		// track(listen(...)) для каждого слушателя
		return () => {
			active = false
			window.removeEventListener('focus', onFocus)
			for (const unlisten of unlisteners) unlisten()
		}
```

### [low/maintainability] desktop/src/windows/browser-window.tsx:48-49

TOOLBAR_HEIGHT дублирует Rust-константу TOOLBAR_H = 104.0 (meeting_browser.rs), и синхронизация держится только на встречных комментариях: при расхождении страничный webview сместится — перекроет тулбар или оставит зазор. Надёжнее передавать высоту из Rust в момент создания хрома, например параметром в chrome_url (index.html?window=browser&session=…&toolbar=104), чтобы значение существовало в одном месте.

**Existing:**

```
/** Must match `TOOLBAR_H` in `desktop/src-tauri/src/meeting_browser.rs`. */
const TOOLBAR_HEIGHT = 104
```

**Suggestion:**

```
// Rust passes the real value when it builds the chrome webview, so the two cannot drift.
const TOOLBAR_HEIGHT = Number(new URLSearchParams(window.location.search).get('toolbar')) || 104
```

### [medium/bug] desktop/src/windows/browser-window.tsx:92-98

Пустая опция «none» в нативном select. `deviceMenuEntries` создаёт запись «none» с `label: ''` по задумке (device-selection.ts:44), а главный пикер подставляет локализованные подписи при рендере: `entry.kind === 'none' ? m.noRecord() : entry.kind === 'unavailable' ? m.deviceUnavailable({ name }) : entry.label` (audio-device-input.tsx:73). Здесь же рендерится сырой `entry.label`, поэтому в выпадающем списке «Нет» — пустая строка, и когда `value === 'none'` (устройств нет / ничего не выбрано), закрытый select тоже отображается пустым (нативный select показывает текст выбранной опции, а `title` виден только по ховеру). Опция «unavailable» вдобавок теряет пометку о недоступности. Стоит повторить подстановки из главного пикера.

**Existing:**

```
			{entries
				.filter((entry) => entry.kind !== 'hidden')
				.map((entry) => (
					<option key={entry.value} value={entry.value}>
						{entry.label}
					</option>
				))}
```

**Suggestion:**

```
{entries
	.filter((entry) => entry.kind !== 'hidden')
	.map((entry) => (
		<option key={entry.value} value={entry.value}>
			{entry.kind === 'none' ? m.noRecord() : entry.kind === 'unavailable' ? m.deviceUnavailable({ name: entry.label }) : entry.label}
		</option>
	))}
```

### [low/maintainability] desktop/src/windows/browser-window.tsx:224-229

Недостижимая ветка `kind === 'hidden'`: скрытые записи отфильтровываются из опций select выше (`.filter((entry) => entry.kind !== 'hidden')`), поэтому `onPick` не может получить такую запись, и `restoreRecordingDevice` здесь недостижим (это, кстати, единственное использование этой функции из lib). Получается, что восстановление скрытого устройства из хрома молча недоступно (в главном окне оно есть — audio-device-input.tsx:98-108), а код имитирует обратное. Либо удалить ветку (и осознать потерю функции), либо всё же отрисовать скрытые записи, например отдельным `<optgroup>`.

**Existing:**

```
	function pickDevice(type: 'input' | 'output', entry: DeviceMenuEntry) {
		if (entry.kind === 'unavailable') return
		if (entry.kind === 'hidden') restoreRecordingDevice(type, entry.label)
		else writeRecordingDeviceSelection(type, entry.kind === 'none' ? null : entry.label)
		void refreshDevices()
	}
```

**Suggestion:**

```
function pickDevice(type: 'input' | 'output', entry: DeviceMenuEntry) {
	if (entry.kind === 'unavailable' || entry.kind === 'hidden') return
	writeRecordingDeviceSelection(type, entry.kind === 'none' ? null : entry.label)
	void refreshDevices()
}
```

### [low/bug] desktop/src/windows/browser-window.tsx:162-167

Строка адреса затирается на каждую загрузку страницы. Rust публикует `meeting-browser-session` по каждому завершённому переходу (`handle_page_load` → `emit_session`, meeting_browser.rs), а flow входа в встречу полон редиректов (waiting room, join). Если пользователь печатает новый URL, а страница в этот момент редиректит — ввод молча сбрасывается, чего хром обычного браузера не делает. Стоит не синхронизировать адрес, пока поле в фокусе (или пока ввод «грязный» относительно последнего зафиксированного URL). Заодно: имя события захардкожено строкой, хотя остальные события вынесены в константы в lib/meeting-browser.

**Existing:**

```
		listen<BrowserSessionInfo>('meeting-browser-session', (event) => {
			if (event.payload.session !== session) return
			setInfo(event.payload)
			setAddress(event.payload.url)
			setBlockedHost(null)
		}).then((fn) => unlisteners.push(fn))
```

**Suggestion:**

```
		listen<BrowserSessionInfo>(MEETING_BROWSER_SESSION_EVENT, (event) => {
			if (event.payload.session !== session) return
			setInfo(event.payload)
			// Редиректы страницы не должны затирать адрес, который пользователь печатает прямо сейчас.
			if (document.activeElement?.tagName !== 'INPUT') setAddress(event.payload.url)
			setBlockedHost(null)
		}).then((fn) => unlisteners.push(fn))
```

### [low/maintainability] desktop/src/windows/browser-window.tsx:311-313

Бессмысленная обёртка `{ <>…</> }` вокруг блока пикеров — JSX-expression container с единственным фрагментом внутри, мусор после рефакторинга. Убирает читаемость строки без какой-либо функции; фрагмент здесь вообще не нужен (соседний `{blockedHost ? …}` — тернарник, ему контейнер требуется).

**Existing:**

```
				{
					<>
						<div role="group" aria-label={m.recordingDevices()} className="flex min-w-0 items-center gap-2">
```

**Suggestion:**

```
				<div role="group" aria-label={m.recordingDevices()} className="flex min-w-0 items-center gap-2">
```

### [low/bug] desktop/src/windows/browser-window.tsx:107-108

Тема и язык читаются `readConfig` в теле рендера без подписки, поэтому хром не следует за изменениями из главного окна: config-store действительно рассылает `store://change` между окнами (см. комментарий в config-store.ts), но без `useSyncExternalStore`/`usePersisted` ничего не перерисует хром. Итог — смена темы/языка в настройках применяется в хроме лишь случайно, при следующей перерисовке от постороннего события (toggle записи, focus-обновление устройств), а до того окно живёт со старой темой. Долгоживущему окну стоит читать эти ключи через `usePersisted`, как это делает preference.tsx.

**Existing:**

```
	const theme = readConfig<'light' | 'dark'>(CONFIG_KEYS.theme, window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
	const locale = readConfig<string>(CONFIG_KEYS.displayLanguage, 'en-US')
```

**Suggestion:**

```
	const [theme] = usePersisted<'light' | 'dark'>(CONFIG_KEYS.theme, window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
	const [locale] = usePersisted(CONFIG_KEYS.displayLanguage, 'en-US')
```

### [low/bug] desktop/src/windows/browser-window.tsx:181-183

Гонка стартового состояния: `emit(RECORDING_STATE_REQUEST_EVENT)` вызывается синхронно, а слушатель `RECORDING_STATE_EVENT` выше по эффекту регистрируется асинхронно (`listen(...).then(...)`). Ответ главного окна может прийти раньше, чем регистрация слушателя завершится, — событие теряется, и хром остаётся на дефолтном «Record» до следующей смены состояния (та же семья проблем, что и гонка unlisten-ов, но с другим следствием). Надёжнее эмитить запрос после резолва промиса самого слушателя.

**Existing:**

```
		// A chrome opened while a recording already runs learns the current state instead of
		// waiting for the next flip. Devices refresh on focus, when the main window may have moved.
		void emit(RECORDING_STATE_REQUEST_EVENT)
```

**Suggestion:**

```
		listen<RecordingStatePayload>(RECORDING_STATE_EVENT, (event) => {
			setRecording(event.payload.recording)
			setRecordingStartedAt(event.payload.recording ? (event.payload.startedAt ?? Date.now()) : null)
		}).then((fn) => {
			unlisteners.push(fn)
			// Теперь слушатель точно зарегистрирован — можно спрашивать текущее состояние.
			void emit(RECORDING_STATE_REQUEST_EVENT)
		})
```

### [low/maintainability] desktop/src/mock-tauri/runtime.ts:168-169

Тестовая поверхность возвращает поверхностную копию вызова (`{ ...call }`), поэтому вложенный объект `args` остаётся общей ссылкой с записью в логе. Если спека (или сам хендлер, мутирующий свои args) изменит поле в полученном вызове, история вызовов `calls()`/`callsFor()` исказится, и последующие ассерты в том же тесте будут проверять уже подменённые данные. Стоит отдавать глубокую копию (например, `structuredClone(args)`) — либо на записи в лог, либо на выдаче наружу.

**Existing:**

```
		calls: () => state.calls.map((call) => ({ ...call })),
		callsFor: (cmd) => state.calls.filter((call) => call.cmd === cmd).map((call) => ({ ...call })),
```

**Suggestion:**

```
		calls: () => state.calls.map(copyInvocation),
		callsFor: (cmd) => state.calls.filter((call) => call.cmd === cmd).map(copyInvocation),
```

### [low/maintainability] desktop/src/mock-tauri/runtime.ts:101-102

Лог вызовов не ограничен и очищается только вручную через `clearCalls`/`reset`. В длинной dev-сессии каждая IPC-команда (включая `plugin:event|listen`/`unlisten` при каждом монтировании слушателей) накапливается в памяти бесконечно. Разумно ограничить журнал кольцевым буфером (хранить последние N вызовов), чтобы старые записи отбрасывались автоматически.

**Existing:**

```
	const state = getState()
	state.calls.push({ cmd, args })
```

**Suggestion:**

```
	const state = getState()
	state.calls.push({ cmd, args })
	// Держим журнал ограниченным: dev-сессия длится часами, и никто не вызывает clearCalls посреди неё.
	if (state.calls.length > MAX_LOGGED_CALLS) state.calls.splice(0, state.calls.length - MAX_LOGGED_CALLS)
```

### [medium/bug] desktop/src/pages/main/components/idle-hero.tsx:41-42

Регрессия таймера записи. Хук useRecordingStartedAt выставляет startedAt = Date.now() в момент монтирования, а RecordPanel размонтируется при переключении сегмента (AnimatePresence с key={panel}: record → link/browser → record). Если во время записи пользователь уйдёт с панели записи и вернётся, таймер начнёт отсчёт заново с 00:00, хотя запись идёт. В прежней реализации recordElapsed жил в SessionProvider и переживал переключения панелей. Побочно сбрасывается и окно детекции тишины в useSourceFeedback, и 5-минутный алерт useLongSilenceAlert. Поднимите хук на уровень IdleHero (он не размонтируется в idle-режиме) и передавайте startedAt пропсом.

**Existing:**

```
	const { recording, preference } = useSession()
	const startedAt = useRecordingStartedAt(recording.isRecording)
```

**Suggestion:**

```
// в IdleHero (выше переключателя панелей):
// const startedAt = useRecordingStartedAt(recording.isRecording)
// ... <RecordPanel startedAt={startedAt} />
// а в RecordPanel: function RecordPanel({ startedAt }: { startedAt: number | null })
```

### [low/style] desktop/src/pages/main/components/idle-hero.tsx:396-396

Вложенный тернарный оператор при выборе панели (запрещён стандартом кодирования), и финальная ветка неявно рендерит BrowserPanel для любого неизвестного значения panel — при добавлении новой панели это приведёт к тихой ошибке. Лучше явные условия или маппинг panel → компонент.

**Existing:**

```
							{panel === 'record' ? <RecordPanel /> : panel === 'link' ? <LinkPanel /> : <BrowserPanel />}
```

**Suggestion:**

```
							{panel === 'record' && <RecordPanel />}
							{panel === 'link' && <LinkPanel />}
							{panel === 'browser' && <BrowserPanel />}
```

### [low/bug] desktop/src/pages/main/components/idle-hero.tsx:150-150

Enter в поле ввода вызывает open() даже при пустом url, хотя кнопка в этом состоянии отключена: пользователь получит 'Could not open this link: ' с пустым reason (обрезанное на вид сообщение). Тернарник с побочным эффектом здесь ещё и хуже читается, чем обычный обработчик. Добавьте ранний выход в open() — он заодно сделает ветку !normalized недостижимой (normalizeMeetingUrl возвращает '' только для пустого ввода).

**Existing:**

```
					onKeyDown={(event) => (event.key === 'Enter' ? void open() : null)}
```

**Suggestion:**

```
					onKeyDown={(event) => {
						if (event.key === 'Enter' && url.trim()) void open()
					}}
```

### [high/security] .github/workflows/dependency-updates.yml:37-38

Сторонний action закреплён только мутабельным мажорным тегом `@v41`, при этом job имеет `contents: write`, `pull-requests: write` и работает с PAT (RENOVATE_TOKEN). Перехват тега v41 в репозитории renovatebot даёт злоумышленнику выполнение произвольного кода с правами записи в репозиторий и scope персонального токена. Сторонние action'ы нужно пиннить на полный commit SHA — тем более в workflow, которое ходит по расписанию и молча работает с повышенными правами (в отличие от PR-проверок, это никто не заметит на ревью).

**Existing:**

```
            - name: Renovate
              uses: renovatebot/github-action@v41
```

**Suggestion:**

```
            - name: Renovate
              # v41, pinned to commit SHA: this job holds write permissions and a PAT
              uses: renovatebot/github-action@<full-commit-sha>
```

### [low/security] .github/workflows/dependency-updates.yml:16-18

Разрешения `contents: write` и `pull-requests: write` выдаются GITHUB_TOKEN задания, но нигде не используются: checkout достаточно `contents: read`, а PR открывает сам Renovate через RENOVATE_TOKEN (fine-grained PAT с собственными правами), который не зависит от этих permissions. Стоит сузить до минимума согласно least-privilege — это заодно снижает последствия перехвата джобового токена (шаг запускает сторонний action и docker-образ Renovate).

**Existing:**

```
permissions:
    contents: write
    pull-requests: write
```

**Suggestion:**

```
permissions:
    contents: read
```

### [high/bug] .github/workflows/dev-build.yml:196-198

Шаг вызывает `task ci:ggml-libs` → `scripts/ci/ggml-libs.sh` → `scripts/ggml_libs.sh fetch`, который скачивает архив через `gh release download`. `gh` без аутентификации падает с ошибкой «To use GitHub CLI in a GitHub Actions workflow, set the GH_TOKEN environment variable», т.е. шаг будет обрываться на всех пяти ячейках матрицы (старый inline-вариант использовал анонимный `curl` для публичного репозитория и работал без токена). В release.yml аналогичный шаг GH_TOKEN передаёт — добавьте его и здесь.

**Existing:**

```
              env:
                  TRIPLE: ${{ matrix.triple }}
              run: mise exec -- task ci:ggml-libs
```

**Suggestion:**

```
              env:
                  TRIPLE: ${{ matrix.triple }}
                  GH_TOKEN: ${{ github.token }}
              run: mise exec -- task ci:ggml-libs
```

### [low/other] .github/workflows/dev-build.yml:32-34

Новое задание guard — единственное в этом workflow без `timeout-minutes`: у build — 90, у cleanup и deploy-website — 5. Задание делает checkout с fetch-depth: 0, сетевую установку mise и `git fetch`; зависший шаг будет висеть до дефолтных 360 минут. Остальные новые задания файла снабжены таймаутом — добавьте его и здесь (например, 10).

**Existing:**

```
        # Dev builds belong to the dev branch: a dev tag cut anywhere else is a
        # mistake, and so is a manual dispatch on another branch.
        runs-on: ubuntu-latest
```

**Suggestion:**

```
        # Dev builds belong to the dev branch: a dev tag cut anywhere else is a
        # mistake, and so is a manual dispatch on another branch.
        runs-on: ubuntu-latest
        timeout-minutes: 10
```

### [low/other] .github/workflows/e2e.yml:16-19

У workflow нет блока `concurrency`, хотя он срабатывает на push в PR по путям `desktop/**` и `taskfile.yml` (задеваются почти всеми PR этого репозитория) и каждый прогон занимает до 25 минут. Серия быстрых пушей создаст очередь неиспользуемых прогонов. Остальные workflow проекта (lint.yml, dev-build.yml) используют concurrency-группы — стоит сделать так же с отменой устаревших прогонов.

**Existing:**

```
permissions:
    contents: read

jobs:
```

**Suggestion:**

```
permissions:
    contents: read

concurrency:
    group: e2e-${{ github.ref }}
    cancel-in-progress: true

jobs:
```

### [medium/performance] .github/workflows/e2e.yml:30-35

Setup mise устанавливает только `task`, но `MISE_EXEC_AUTO_INSTALL: "false"` не задан (в dev-build.yml/lint.yml/release.yml его ставят именно ради этого). Первый `mise exec -- task ci:e2e` доустановит весь тулчейн из mise.toml, включая cargo-deny/cargo-edit/cargo-machete/cargo-outdated — а в этой job вообще нет Rust-тулчейна, так что mise будет ставить и его, либо шаг упадёт. Добавьте env на уровне job.

**Existing:**

```
            - name: Setup mise
              uses: jdx/mise-action@v2
              with:
                  install: true
                  install_args: aqua:go-task/task
                  cache: true
```

**Suggestion:**

```
    e2e:
        runs-on: ubuntu-latest
        timeout-minutes: 25
        env:
            MISE_EXEC_AUTO_INSTALL: "false"
```

### [low/maintainability] .github/workflows/e2e.yml:12-13

В paths не включён сам файл воркфлоу `.github/workflows/e2e.yml` (website.yml включает свой). Правка настроек сьюта (node-версия, таймаут, порядок шагов) не запустит его на проверку — придётся диспатчить вручную.

**Existing:**

```
            - "scripts/ci/e2e.sh"
            - "taskfile.yml"
```

**Suggestion:**

```
            - "scripts/ci/e2e.sh"
            - "taskfile.yml"
            - ".github/workflows/e2e.yml"
```

### [high/bug] .github/workflows/lint.yml:53-55

`task ci:ggml-libs` теперь идёт через `ggml_libs.sh fetch` → `gh release download`, а `gh` требует GH_TOKEN/GITHUB_TOKEN — без него команда падает («set the GH_TOKEN environment variable»). Прежний inline-`curl` работал анонимно, так что это регрессия: каждый прогон Lint (весь job, включая clippy) будет падать на этом шаге. В release.yml тот же шаг токен передаёт.

**Existing:**

```
              env:
                  TRIPLE: x86_64-unknown-linux-gnu
              run: mise exec -- task ci:ggml-libs
```

**Suggestion:**

```
              env:
                  TRIPLE: x86_64-unknown-linux-gnu
                  GH_TOKEN: ${{ github.token }}
              run: mise exec -- task ci:ggml-libs
```

### [high/bug] .github/workflows/lint.yml:134-136

Та же проблема, что и в lint-задании: `task ci:ggml-libs` → `gh release download` требует аутентификации, а GH_TOKEN в этом шаге (и во всём job) не передан. Старый `curl`-вариант работал анонимно; теперь шаг будет падать на каждом прогоне. Сравните с release.yml, где этому же таску передаётся `GH_TOKEN: ${{ github.token }}`.

**Existing:**

```
              env:
                  TRIPLE: x86_64-pc-windows-msvc
              run: mise exec -- task ci:ggml-libs
```

**Suggestion:**

```
              env:
                  TRIPLE: x86_64-pc-windows-msvc
                  GH_TOKEN: ${{ github.token }}
              run: mise exec -- task ci:ggml-libs
```

### [high/bug] .github/workflows/lint_rust.yml:89-90

`task libs:fetch` → `ggml_libs.sh fetch` использует `gh release download`, которому нужна аутентификация. GH_TOKEN передан только соседнему шагу «Fetch the sidecars» (env ограничен шагом), а здесь gh окажется неаутентифицированным и шаг упадёт. Перенесите токен и на этот шаг (или на уровень job).

**Existing:**

```
            - name: Fetch the prebuilt ggml libraries
              run: mise exec -- task libs:fetch
```

**Suggestion:**

```
            - name: Fetch the prebuilt ggml libraries
              env:
                  GH_TOKEN: ${{ github.token }}
              run: mise exec -- task libs:fetch
```

### [medium/performance] .github/workflows/lint_rust.yml:34-39

Оба задания файла (fmt и clippy) устанавливают через mise только `task`, но не задают `MISE_EXEC_AUTO_INSTALL: "false"` — в отличие от dev-build.yml/lint.yml/release.yml, где это сделано именно чтобы «mise exec не тянул остальной тулчейн». Здесь первый `mise exec` доустановит весь пиннатый набор из mise.toml, включая компилируемые из исходников cargo-deny/cargo-edit/cargo-machete/cargo-outdated и npm-пакет renovate — лишние минуты на каждой машине без кэша (особенно на macOS-раннере). Добавьте env на уровне job.

**Existing:**

```
            - name: setup mise
              uses: jdx/mise-action@v2
              with:
                  install: true
                  install_args: aqua:go-task/task
                  cache: true
```

**Suggestion:**

```
    fmt:
        runs-on: macos-latest
        env:
            MISE_EXEC_AUTO_INSTALL: "false"
```

### [medium/security] .github/workflows/release.yml:52-57

`jdx/mise-action@v2` (как и добавленный `astral-sh/setup-uv@v5` в lint_rust.yml, и mise-action в dev-build/lint/lint_rust/e2e/website/server-release) закреплён мутабельным тегом. В release.yml этот action исполняется в job, который собирает подписываемые релизные артефакты и публикует релиз с write-токеном: компрометация тега v2 — это подмена собранных бинарников в релизном контейнере. Стоит пиннить все вновь добавленные сторонние action'ы на полный commit SHA (это же касается renovatebot/github-action@v41 в dependency-updates.yml — там риск ещё выше из-за PAT).

**Existing:**

```
            - name: Setup mise
              uses: jdx/mise-action@v2
              with:
                  install: true
                  install_args: aqua:go-task/task
                  cache: true
```

**Suggestion:**

```
            - name: Setup mise
              # v2, pinned to commit SHA
              uses: jdx/mise-action@<full-commit-sha>
              with:
                  install: true
                  install_args: aqua:go-task/task
                  cache: true
```

### [high/bug] .github/workflows/server-release.yml:124-124

Шаг наследует `defaults.run.working-directory: server`, но `task server:package-release` выполняет команды из директории корневого taskfile.yml (корень репозитория), а не из cwd. Бинарный файл скопирован предыдущим шагом в `server/${{ matrix.binary }}`, поэтому проверка `[ -f "$binary" ]` в scripts/package_server_release.sh выполняется от корня и упадёт с «binary not found». Даже если бы она прошла, архив записывается в `$PWD` (корень), а следующий шаг `gh release upload` (working-directory: server) ищет его в `server/` — упаковка сломана для всех трёх archive-ячеек матрицы. Запустите task от корня воркспейса и передайте пути с префиксом `server/`.

**Existing:**

```
          mise exec -- task server:package-release -- "${{ matrix.binary }}" "${{ matrix.package_os }}" "${{ matrix.package_arch }}" "${{ matrix.archive }}"
```

**Suggestion:**

```
        working-directory: ${{ github.workspace }}
        run: |
          mise exec -- task server:package-release -- "server/${{ matrix.binary }}" "${{ matrix.package_os }}" "${{ matrix.package_arch }}" "server/${{ matrix.archive }}"
```

### [medium/performance] .github/workflows/server-release.yml:71-75

Setup mise устанавливает только `task` (install_args), но в отличие от dev-build.yml/lint.yml/release.yml здесь не задан `MISE_EXEC_AUTO_INSTALL: "false"`. С настройкой по умолчанию первый же `mise exec` доустановит весь набор инструментов из mise.toml: cargo-deny, cargo-edit, cargo-machete, cargo-outdated (компиляция через cargo), npm-пакет renovate и т.д. — это лишние минуты установки на каждом промахе кэша, а для cargo-бэкенда mise может дополнительно тянуть Rust-тулчейн. Добавьте env на уровне job, как это сделано в остальных workflow.

**Existing:**

```
      - uses: jdx/mise-action@v2
        with:
          install: true
          install_args: aqua:go-task/task
          cache: true
```

**Suggestion:**

```
  build-and-upload:
    needs: create-release
    env:
      MISE_EXEC_AUTO_INSTALL: "false"
```

### [medium/other] .github/workflows/website.yml:17-20

После удаления триггера `release: [published]` публикация стабильного релиза больше не запускает ни одну пересборку сайта: `website_links.py` переписывает latest_release.json из `releases/latest` API в момент сборки, поэтому сайт, собранный на merge релизного PR (когда тега ещё нет), ещё долго указывает на предыдущую версию — до следующего подходящего push в main или ручного workflow_dispatch. Для Dev-канала автоматическая диспетчеризация добавлена (deploy-website в dev-build.yml), а для стабильного аналога нет — предложенная в комментарии ручная схема оставляет окно с устаревшими ссылками на скачивание после каждого релиза. Вместо возврата release-триггера (который справедливо не работает из-за branch policy для tag-ссылок) стоит диспетчеризировать пересборку в конце release.yml — тем же способом, что и dev-build.yml.

**Existing:**

```
    # No `release` trigger: the github-pages environment's branch policy admits
    # branches, so a tag ref fails the deploy job before its first step, and a dev
    # tag would publish the dev branch. A release's content reaches the site
    # through the main push that precedes it; workflow_dispatch covers the rest.
```

**Suggestion:**

```
    # No `release` trigger: the github-pages environment's branch policy admits
    # branches, so a tag ref fails the deploy job before its first step, and a dev
    # tag would publish the dev branch. Release.yml dispatches this workflow once
    # the release is published; workflow_dispatch covers the rest.
```

### [medium/performance] .github/workflows/website.yml:78-83

В обоих заданиях файла (pwa и build) mise ставит только `task`, но `MISE_EXEC_AUTO_INSTALL: "false"` не задан — в отличие от dev-build.yml/lint.yml/release.yml. Первый `mise exec` доустановит весь набор из mise.toml (включая компилируемые cargo-инструменты и npm-пакет renovate); в build-задании нет Rust-тулчейна, и mise потянет его дополнительно либо упадёт. Добавьте env на уровне каждого job.

**Existing:**

```
            - name: setup mise
              uses: jdx/mise-action@v2
              with:
                  install: true
                  install_args: aqua:go-task/task
                  cache: true
```

**Suggestion:**

```
    pwa:
        runs-on: ubuntu-latest
        env:
            MISE_EXEC_AUTO_INSTALL: "false"
```

### [low/bug] .github/workflows/website.yml:10-11

Сборка сайта теперь идёт через scripts/website_build.sh, который запускает scripts/dev_manifest.py (dev-канал обновлений) и uv-скрипты с зависимостями из pyproject.toml, но в paths триггера они не перечислены: правка генератора dev-манифеста или самого скрипта сборки не перезапустит деплой, и сайт останется со старым updater/dev.json. Добавьте новые скрипты сборки в paths.

**Existing:**

```
            - "openspec/changes/**"
            - "scripts/roadmap.py"
```

**Suggestion:**

```
            - "openspec/changes/**"
            - "scripts/roadmap.py"
            - "scripts/website_build.sh"
            - "scripts/dev_manifest.py"
```

### [high/bug] desktop/src-tauri/src/cmd/audio.rs:4-4

Из импорта удалён макрос `bail`, но он по-прежнему используется в `get_output_device_and_config` (строка 379) внутри блока `#[cfg(target_os = "macos")]`. На Linux/Windows вызов макроса скомпилирован cfg-условием — поэтому импорт выглядит «неиспользуемым» и его удаление не видно локальной сборкой и CI на Linux, — но сборка под macOS упадёт с ошибкой «cannot find macro `bail` in this scope». Импорт нужно вернуть с той же cfg-воронкой, что и использование.

**Existing:**

```
use eyre::{eyre, Context, ContextCompat, Result};
```

**Suggestion:**

```
use eyre::{eyre, Context, ContextCompat, Result};
#[cfg(target_os = "macos")]
use eyre::bail;
```

### [medium/bug] desktop/src-tauri/src/cmd/audio.rs:26-30

Гонка глобального флага при перекрывающихся сессиях записи. `start_record` вызывается из нескольких мест (`use-recording.ts`, `hotkey.tsx`, `recording-shortcut.tsx`) и никак не защищён от повторного вызова, а stop-замыкание выполняется синхронно и содержит блокирующие ffmpeg merge/normalize, которые могут идти секунды. Сценарий: остановка записи A (замыкание ещё работает), старт записи B (`RECORDING.store(true)`), завершение замыкания A — `RecordingFlagGuard::drop` безусловно записывает `false`, хотя запись B активна. `recording_active()` (его читает close-gate через `isRecordingActive()` в `lib/meeting-browser.ts`) будет ложно возвращать `false`, и окно браузера встреч может закрыться с идущей записью. Надёжнее считать сессии, а не хранить один bool: `fetch_add` при старте, `fetch_sub` в гарде — тогда завершение старой сессии не сбрасывает флаг новой.

**Existing:**

```
impl Drop for RecordingFlagGuard {
    fn drop(&mut self) {
        RECORDING.store(false, Ordering::SeqCst);
    }
}
```

**Suggestion:**

```
static RECORDING_SESSIONS: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);

// в start_record после запуска всех потоков:
RECORDING_SESSIONS.fetch_add(1, Ordering::AcqRel);

impl Drop for RecordingFlagGuard {
    fn drop(&mut self) {
        RECORDING_SESSIONS.fetch_sub(1, Ordering::AcqRel);
    }
}

#[tauri::command]
pub fn recording_active() -> bool {
    RECORDING_SESSIONS.load(Ordering::Acquire) > 0
}
```

### [low/maintainability] desktop/src/pages/main/hooks/use-transcribe-queue.ts:163-173

Инвариант «diarizeUsable === true ⟹ diarizePath !== null» выражен только неявно: TypeScript не сужает тип diarizePath по флагу, поэтому свойство получает тип `string | null`, хотя null туда попасть не может. Проще и типобезопаснее держать одну переменную: nullable-путь, который зануляется при недоступности модели — тогда сужение в тернарнике работает само, а проверку try/catch не нужно «расхлёбывать» по двум переменным.

**Existing:**

```
	let diarizeUsable = diarizePath !== null
	if (diarizePath) {
		try {
			diarizeUsable = await isModelFileUsable(diarizePath)
		} catch {
			// The check is a guard, not a gate: if it cannot run, behave as before and send it.
			diarizeUsable = true
		}
	}
	return {
		...(diarizeUsable ? { diarize_model: diarizePath } : {}),
```

**Suggestion:**

```
	let diarizeModel: string | null = diarizePath
	if (diarizePath) {
		try {
			if (!(await isModelFileUsable(diarizePath))) diarizeModel = null
		} catch {
			// The check is a guard, not a gate: if it cannot run, behave as before and send it.
		}
	}
	return {
		...(diarizeModel ? { diarize_model: diarizeModel } : {}),
```

### [low/test] desktop/e2e/helpers.ts:74-78

Граничный случай: при пустом массиве `values` выражение `values[Math.min(index++, values.length - 1)]` вычислит `values[-1]` === undefined, и хелпер будет молча возвращать undefined на каждый вызов вместо быстрого и понятного отказа. Такой скрытый сбой затрудняет отладку спеков. Стоит добавить явную проверку в начале функции.

**Existing:**

```
export async function overrideCommandSequence(page: Page, cmd: string, values: unknown[]): Promise<void> {
	await page.evaluate(
		({ cmd, values }) => {
			let index = 0
			;(window as unknown as MockWindow).__vibeMockTauri.override(cmd, () => values[Math.min(index++, values.length - 1)])
```

**Suggestion:**

```
export async function overrideCommandSequence(page: Page, cmd: string, values: unknown[]): Promise<void> {
	if (values.length === 0) {
		throw new Error(`overrideCommandSequence: empty sequence for command "${cmd}"`)
	}
	await page.evaluate(
		({ cmd, values }) => {
			let index = 0
			;(window as unknown as MockWindow).__vibeMockTauri.override(cmd, () => values[Math.min(index++, values.length - 1)])
```

### [low/maintainability] desktop/vite.config.ts:35-35

Опция `test.exclude` полностью заменяет дефолтный список исключений vitest, а не расширяет его: теряются стандартные паттерны `**/node_modules/**`, `**/dist/**` (с префиксом `**/`, который матчит и вложенные каталоги, а не только корневые), а также `**/cypress/**`, `**/.{idea,git,cache,output,temp}/**` и исключения конфиг-файлов. Если позже в проекте появится вложенный node_modules или другой каталог с чужими spec-файлами, vitest молча начнёт их собирать. Рекомендуемый vitest подход — расширять `configDefaults.exclude`.

**Existing:**

```
		exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
```

**Suggestion:**

```
import { configDefaults, defineConfig } from 'vitest/config'
// ...
		exclude: [...configDefaults.exclude, 'e2e/**'],
```

### [high/bug] desktop/src-tauri/src/cmd/server_cmd.rs:228-232

Probe-путь выполняется при удержанном Mutex<ServerState>, хотя probe вообще не использует state. При этом spawn_process → ServerProcess::spawn — синхронная функция с блокирующим handshake до READY_TIMEOUT = 60 c (server/process.rs:13, recv_timeout на ready-строке), а kill() — блокирующий child.wait(); всё это выполняется прямо на tokio worker-потоке async-команды. Команда вызывается на каждом старте приложения, и пока идёт handshake (или sidecar завис перед ready-строкой — ровно тот случай, ради которого введён READY_TIMEOUT), все команды, зависящие от этого мьютекса (load_model, get_api_base_url, start/stop_api_server, повторные get_model_metadata), выстраиваются в очередь. Освободите лок перед probe-путём (drop(state) после state.process = None) и/или вынесите блокирующий spawn в tokio::task::spawn_blocking.

**Existing:**

```
    let mut probe = spawn_process(
        &app_handle,
        crate::cmd::config::unload_timeout_minutes(&app_handle),
        crate::cmd::config::cpu_variant(&app_handle),
    )?;
```

**Suggestion:**

```
    drop(state);
    let app_spawn = app_handle.clone();
    let mut probe = tokio::task::spawn_blocking(move || {
        spawn_process(
            &app_spawn,
            crate::cmd::config::unload_timeout_minutes(&app_spawn),
            crate::cmd::config::cpu_variant(&app_spawn),
        )
    })
    .await
    .map_err(|e| eyre::eyre!("probe spawn task failed: {e}"))??;
```

### [medium/bug] desktop/src-tauri/src/cmd/server_cmd.rs:233-234

Запрос метаданных не ограничен по времени: у HTTP-клиента есть только connect_timeout (10 c), а общий request timeout намеренно отсутствует (server/process.rs:122-133 — ради долгих транскрипций). Если probe-сервер примет соединение, но зависнет при чтении файла модели, этот await не завершится никогда, а Mutex<ServerState> останется удержанным — все серверные команды зависают до перезапуска приложения. Метаданные — маленький ответ; оберните запрос в tokio::time::timeout.

**Existing:**

```
    let metadata = probe.model_metadata(&model_path).await;
    probe.kill();
```

**Suggestion:**

```
    let metadata = tokio::time::timeout(
        std::time::Duration::from_secs(30),
        probe.model_metadata(&model_path),
    )
    .await
    .map_err(|_| eyre::eyre!("timed out reading model metadata from the probe server"))?;
    probe.kill();
```

### [medium/bug] desktop/src-tauri/src/setup.rs:83-89

Фоновая задача автозапуска вызывает start_process, удерживая Mutex<ServerState> всё время его работы. start_process делает блокирующий spawn (handshake с sidecar до 60 c — READY_TIMEOUT) и при несовпадении настроек kill+respawn живого процесса (drop → блокирующий child.wait) — всё это выполняется синхронно на tokio worker-потоке. Фронтенд при старте сразу вызывает get_model_metadata и load_model (preference.tsx), и в типичном случае они лишь чуть подождут, но зависший перед ready-строкой sidecar блокирует все серверные команды на минуту. Вынесите блокирующую часть в tokio::task::spawn_blocking (spawn процесса вне критической секции, вставку в state — под коротким локом), чтобы автозапуск не мог заморозить транскрипции.

**Existing:**

```
        tauri::async_runtime::spawn(async move {
            let state = app_handle.state::<Mutex<ServerState>>();
            let mut guard = state.lock().await;
            if let Err(error) = crate::cmd::server_cmd::start_process(&app_handle, &mut guard, unload_timeout_minutes) {
                tracing::error!("could not start the local API server at launch: {:#}", error);
            }
        });
```

### [medium/bug] desktop/src-tauri/src/setup.rs:80-81

Автозапуск API-сервера не исключает CLI-режим, а CLI-режим завершается через std::process::exit (cli.rs, конец run), который не запускает деструкторы managed-состояния и не порождает RunEvent::Exit. Итог для `vibe <команда>` при включённом намерении API: (1) общий vibe-server, заспавненный этой фоновой задачей, остаётся осиротевшим процессом — у ServerProcess нет Job Object/PDEATHSIG, только Drop→kill, который здесь не выполнится; (2) api_base_url, опубликованный start_process, остаётся в app_config.json, и его никто не очистит — ровно та ситуация, от которой защищается обработчик выхода ("base URL left in the config file would point an agent at a dead port"). Простейшее исправление — не автозапускать сервер в CLI-режиме (is_cli_detected уже импортирован в setup.rs).

**Existing:**

```
    if crate::cmd::config::api_server_enabled(app.handle()) {
        let app_handle = app.app_handle().clone();
```

**Suggestion:**

```
    // A CLI launch exits via std::process::exit, which runs no drops and fires no
    // RunEvent::Exit: a shared server started here would be orphaned with its base URL
    // left published in the config, so the autostart is GUI-only.
    if !is_cli_detected() && crate::cmd::config::api_server_enabled(app.handle()) {
        let app_handle = app.app_handle().clone();
```

### [low/bug] desktop/src-tauri/src/setup.rs:41-44

Предупреждение о неудачной миграции эмитится до crate::logging::setup_logging (строка ниже), который устанавливает глобальный tracing-подписчик через set_global_default — без подписчика tracing::warn! уходит в никуда, и сбой миграции невозможно увидеть ни в терминале, ни в лог-файле. Аналогично теряются и любые предупреждения из самой browser_policy::migrate. Стоит сохранить результат миграции и залогировать его после инициализации логирования (миграция использует app.handle() и собственный доступ к store, локальная переменная store ей не нужна).

**Existing:**

```
    // The allowlist replaced the meeting-host list; carry over whatever the user had stored.
    if let Err(error) = crate::browser_policy::migrate(app.handle()) {
        tracing::warn!("could not migrate the browser allowlist: {error}");
    }
```

**Suggestion:**

```
    // The allowlist replaced the meeting-host list; carry over whatever the user had stored.
    // The result is reported only after logging is up: a warn before setup_logging installs
    // the global subscriber is silently dropped.
    let allowlist_migration = crate::browser_policy::migrate(app.handle());
    // ... после crate::logging::setup_logging(...):
    // if let Err(error) = allowlist_migration {
    //     tracing::warn!("could not migrate the browser allowlist: {error}");
    // }
```

### [low/maintainability] i18n/roadmap/cs-CZ.json:66-67

Неалфавитный порядок ключей верхнего уровня: пять ключей (comparison-failed-runs, local-windows-build, meeting-browser-rework, post-release-hardening, site-localization) вынесены в конец файла, тогда как во всех остальных локалях каталога i18n/roadmap (bg-BG, de-DE, es-MX, fr-FR, ja-JP, ko-KR, no-NO, pl-PL, ru-RU, zh-CN, zh-HK) порядок алфавитный — как и у сортировки директорий в scripts/roadmap.py. Для JSON и загрузчика (website/src/lib/roadmap.ts выполняет lookup по имени ключа) это нейтрально, но ломает построчное diff-сравнение локалей и усложняет визуальную/автоматическую сверку набора ключей. Стоит отсортировать ключи как в остальных файлах каталога.

**Existing:**

```
  "website-language-selector": {
    "title": "Výběr jazyka na webu",
```

**Suggestion:**

```
  "comparison-failed-runs": {
    ...
  },
  "dependency-hygiene": {
    ...
  },
  "desktop-e2e": {
    ...
  },
  ...
  "website-language-selector": {
    ...
  }
}
```

### [low/maintainability] i18n/roadmap/he-IL.json:66-67

Неалфавитный порядок ключей верхнего уровня: пять ключей (comparison-failed-runs, local-windows-build, meeting-browser-rework, post-release-hardening, site-localization) вынесены в конец файла, тогда как во всех остальных локалях каталога i18n/roadmap (bg-BG, de-DE, es-MX, fr-FR, ja-JP, ko-KR, no-NO, pl-PL, ru-RU, zh-CN, zh-HK) порядок алфавитный — как и у сортировки директорий в scripts/roadmap.py. Для JSON и загрузчика (website/src/lib/roadmap.ts выполняет lookup по имени ключа) это нейтрально, но ломает построчное diff-сравнение локалей и усложняет визуальную/автоматическую сверку набора ключей. Стоит отсортировать ключи как в остальных файлах каталога.

**Existing:**

```
  "website-language-selector": {
    "title": "בורר שפה באתר",
```

**Suggestion:**

```
  "comparison-failed-runs": {
    ...
  },
  "dependency-hygiene": {
    ...
  },
  "desktop-e2e": {
    ...
  },
  ...
  "website-language-selector": {
    ...
  }
}
```

### [low/maintainability] desktop/src-tauri/Cargo.toml:15-15

Feature `unstable` (multi-webview: дочерние webview через WebviewBuilder в meeting_browser.rs) включает API без гарантий стабильности между минорными релизами tauri 2.x, а требование версии осталось свободным "2". С добавленным в этом же обновлении renovate (автообновление зависимостей) переход 2.10 → 2.11+ может незаметно изменить поведение или сломать окно браузера встреч. Стоит ограничить диапазон известной хорошей версией (в lockfile сейчас 2.10.3) или зафиксировать в комментарии контракт ручного обновления.

**Existing:**

```
tauri = { version = "2", features = ["protocol-asset", "devtools", "macos-private-api", "tray-icon", "unstable"] }
```

**Suggestion:**

```
# Multi-webview (child webviews) rides the `unstable` feature: re-verify the
# browser window (desktop/src-tauri/src/meeting_browser.rs) when bumping the minor.
tauri = { version = "~2.10", features = ["protocol-asset", "devtools", "macos-private-api", "tray-icon", "unstable"] }
```

### [high/security] scripts/ggml_libs.sh:98-99

Supply chain: предсобранный бинарный архив ggml-libs скачивается из GitHub-релиза и без какой-либо проверки целостности распаковывается прямо в server/libs/lib, откуда линкуется в поставляемый пользователям vibe-server. Ни в этом скрипте, ни в taskfile.yml, ни в CI нет сверки контрольных сумм или подписи (поиск sha256/checksum/digest по scripts/, taskfile.yml, server/, .github/ — пусто). Собственный же путь `upload` использует `--clobber`, т.е. ассет под существующим тегом может быть перезаписан на месте — и каждый CI-билд/контрибьютор молча подхватит подменённый архив. Минимальная защита: на этапе fetch сверять tree-хэш из тела релиза с `libs_id` (он уже записывается в notes при upload); сильнее — хранить закоммиченный sha256 каждого платформенного архива в server/libs и проверять его перед распаковкой.

**Existing:**

```
    gh release download "$tag" --repo "$repo" \
        --pattern "ggml-libs-$platform.tar.gz" --dir "$ROOT/target" --clobber
```

**Suggestion:**

```
    gh release download "$tag" --repo "$repo" \
        --pattern "ggml-libs-$platform.tar.gz" --dir "$ROOT/target" --clobber
    # The archive enters the shipped binary, so tie it to the committed inputs
    # before extracting: the release body must name this server/libs tree.
    gh release view "$tag" --repo "$repo" --json body --jq .body \
        | grep -q "tree $(libs_id)" || {
            echo "release $tag does not list this server/libs tree; refusing to extract" >&2
            exit 1
        }
```

### [medium/bug] scripts/ggml_libs.sh:253-255

`find ... | head -1` под `set -euo pipefail`: head завершает чтение после первой строки, и при достаточно большом числе совпадений (вывод find не помещается в буфер пайпа) find получает SIGPIPE (141), пайплайн в command substitution возвращает ошибку, и `set -e` роняет весь скрипт посреди многочасовой сборки. Плюс выбор «первого попавшегося» файла недетерминирован при нескольких копиях библиотеки в cmake-дереве. Тот же паттерн повторяется в stage_cpu_variant (`find "$build" -name "$name" | head -1`). Замените на `-print -quit`: без пайпа, без SIGPIPE, одно совпадение.

**Existing:**

```
stage_lib() {
    local build="$1" pkg="$2" name="$3" alt="$4" found
    found="$(find "$build" -name "$name" -o -name "$alt" | head -1)"
```

**Suggestion:**

```
stage_lib() {
    local build="$1" pkg="$2" name="$3" alt="$4" found
    found="$(find "$build" \( -name "$name" -o -name "$alt" \) -print -quit)"
```

### [medium/bug] scripts/ggml_libs.sh:237-241

Защита «релиз уже существует для другого дерева» ломается тремя способами. (1) `|| true` на guard-запросе `gh api`: при транзиентной ошибке сети `existing` пуст, проверка молча пропускается. (2) `gh release create ... 2>/dev/null || true` глушит и «уже существует» (ожидаемый случай), и реальные ошибки авторизации/доступа — при упавшем create последующий `gh release upload --clobber` либо падает с невнятной диагностикой, либо перезаписывает ассеты чужого релиза. (3) `grep -q "tree $id"` не привязан к границе хэша, поэтому 12-символьный id совпадёт и как префикс более длинного tree-хэша в notes. Guard должен падать закрытым образом (fail closed), а «already_exists» от create — отличаться от прочих ошибок.

**Existing:**

```
    existing="$(gh api "repos/$repo/releases?per_page=100" --jq ".[] | select(.tag_name == \"$tag\") | .body" || true)"
    if [ -n "$existing" ] && ! grep -q "tree $id" <<<"$existing"; then
        echo "release $tag exists for another server/libs tree; bump server/libs/revision" >&2
        exit 1
    fi
```

**Suggestion:**

```
    existing="$(gh api "repos/$repo/releases?per_page=100" --jq ".[] | select(.tag_name == \"$tag\") | .body")" \
        || { echo "could not read releases to check $tag; refusing to upload blind" >&2; exit 1; }
    if [ -n "$existing" ] && ! grep -qE "tree $id([^0-9a-f]|$)" <<<"$existing"; then
        echo "release $tag exists for another server/libs tree; bump server/libs/revision" >&2
        exit 1
    fi
```

### [low/maintainability] scripts/ggml_libs.sh:272-276

Для Darwin и msvc-флейвора инструменты жёстко заданы как llvm-nm/llvm-objcopy без проверки их наличия; ни mise.toml, ни scripts/ci/, ни taskfile.yml их не устанавливают (поиск llvm — только в этом скрипте). На стоковой macOS/Windows их может не оказаться в PATH, и дорогой путь build/upload прервётся в самом конце неочевидным «command not found», уже после клонирования и двух компиляций ggml. Стоит сделать дешёвый preflight в начале build/upload с внятным сообщением, где их взять (Xcode CLT / LLVM-инсталляция).

**Existing:**

```
    local nm_tool=nm objcopy_tool=objcopy
    if [ "$os" = "Darwin" ] || [ "$(lib_flavor)" = "msvc" ]; then
        nm_tool=llvm-nm
        objcopy_tool=llvm-objcopy
    fi
```

**Suggestion:**

```
    local nm_tool=nm objcopy_tool=objcopy
    if [ "$os" = "Darwin" ] || [ "$(lib_flavor)" = "msvc" ]; then
        nm_tool=llvm-nm
        objcopy_tool=llvm-objcopy
    fi
    local tool
    for tool in "$nm_tool" "$objcopy_tool"; do
        command -v "$tool" >/dev/null 2>&1 || {
            echo "$tool not found; install the LLVM binutils (Xcode CLT / llvm.org)" >&2
            exit 1
        }
    done
```

### [high/bug] scripts/ggml_libs.sh:154-158

Мёртвая ветка: `$os` — это результат `uname -s`, который под Windows-окружениями bash всегда `MINGW64_NT-*` / `MSYS_*` / `CYGWIN_*`, но никогда не строка `windows` (сами паттерны `MINGW* | MSYS* | CYGWIN*` используются ниже в `platform_id` и `lib_flavor`). Поэтому условие `[ "$os" = "windows" ]` не срабатывает никогда: (1) `-G "MinGW Makefiles"` не выбирается при `VIBE_SERVER_WINDOWS_LIB_FLAVOR=gnu` — на машине с установленным Visual Studio cmake возьмёт MSVC-генератор и соберёт чужой ABI; (2) те же сравнения в стейджинге ниже (`if [ "$os" = "windows" ] && [ "$flavor" = "msvc" ]` / `elif [ "$os" = "windows" ]`) тоже недостижимы, и Windows-сборка проваливается в Linux-ветку стейджинга, которая ищет `libggml-cpu.a`/`libggml-vulkan.a`, а MSVC-сборка даёт `ggml.lib` — стейджинг упадёт с «not found». Весь windows-путь `build`/`upload` нового скрипта неработоспособен. Нужно матчить так же, как `platform_id` (case по `MINGW* | MSYS* | CYGWIN*`) или сравнивать нормализованный `$(platform_id | cut -d- -f1)` с `windows`.

**Existing:**

```
    if [ "$os" = "windows" ] && [ "$flavor" = "gnu" ]; then
        cmake -S "$src" -B "$build" "${flags[@]}" -G "MinGW Makefiles"
    else
        cmake -S "$src" -B "$build" "${flags[@]}"
    fi
```

**Suggestion:**

```
    case "$os" in
    MINGW* | MSYS* | CYGWIN* | windows*)
        if [ "$flavor" = "gnu" ]; then
            cmake -S "$src" -B "$build" "${flags[@]}" -G "MinGW Makefiles"
        else
            cmake -S "$src" -B "$build" "${flags[@]}"
        fi
        ;;
    *) cmake -S "$src" -B "$build" "${flags[@]}" ;;
    esac
```

### [medium/maintainability] scripts/ggml_libs.sh:76-78

Недетерминированная строка `// Fetched: $(date ...)` переписывает проверенные в git заголовки `server/libs/include` при каждом запуске `fetch-headers`, даже когда содержимое заголовка не изменилось. Последствия: (1) `git status` по `server/libs` всегда грязный, что блокирует `upload` (guard `git status --porcelain -- server/libs`) и создаёт шумные диффы; (2) `ggml-rs-sys/build.rs` регистрирует `rerun-if-changed` на эти файлы, так что смена только timestamp зря инвалидирует инкрементальную пересборку. Источник (`Source:` + `Version:`) уже даёт полную информацию о происхождении; timestamp лучше убрать, либо обновлять файл только при фактическом изменении содержимого.

**Existing:**

```
        {
            echo "// Fetched: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
            echo "// Source: https://github.com/ggml-org/ggml/blob/$version/include/$name"
```

**Suggestion:**

```
        {
            echo "// Source: https://github.com/ggml-org/ggml/blob/$version/include/$name"
```

### [low/maintainability] scripts/ggml_libs.sh:116-118

`build`/`upload` разворачивают git-клон ggml, два каталога сборки и итоговый архив прямо в корне репозитория (`$ROOT/ggml-src`, `$ROOT/ggml-build`, `$ROOT/ggml-build-x64`, `$ROOT/ggml-libs-*.tar.gz`), а корневой `.gitignore` не содержит ни одного ggml-паттерна (в этом же обновлении он правился, но эти пути не добавил; `fetch_libs`, кстати, использует уже игнорируемый `target/`). Итог — гигабайты незатреканного мусора в `git status` после тяжёлого пути и риск случайного коммита. Либо разместить артефакты под `target/` (согласованно поменяв `archive=` в `upload_libs`), либо добавить в `.gitignore` записи `/ggml-src/`, `/ggml-build/`, `/ggml-libs-*.tar.gz`.

**Existing:**

```
    src="$ROOT/ggml-src"
    build="$ROOT/ggml-build"
    build_x64="$ROOT/ggml-build-x64"
```

### [low/documentation] server/crates/ggml-rs-sys/src/cpu_variant.rs:5-5

Комментарий ссылается на `scripts/ggml_libs.sh stage-cpu-variant` как на команду, но у скрипта нет такой подкоманды — case-блок допускает только id|tag|platform|fetch-headers|fetch|build|upload, а `stage_cpu_variant` — внутренняя shell-функция. Разработчик, воспроизводящий сборку по этой инструкции, получит usage и exit 2. Корректная ссылка: `scripts/ggml_libs.sh build` (или уже упомянутый `task libs:build`).

**Existing:**

```
//! `task libs:build` (`scripts/ggml_libs.sh stage-cpu-variant`). ggml's backend registry resolves `ggml_backend_cpu_reg` at link
```

**Suggestion:**

```
//! `task libs:build` (the `stage_cpu_variant` function in scripts/ggml_libs.sh). ggml's backend registry resolves `ggml_backend_cpu_reg` at link
```

### [medium/bug] desktop/src/app.tsx:62-63

MeetingBrowserRecordGate поднимает собственный экземпляр useRecording, никак не связанный с manualRecording в session.tsx (рекорд-таб главного окна). Экземпляры синхронизируются только событием record_finish, а гейт эмитит RECORDING_STATE_EVENT лишь при смене своего isRecording. В итоге: запись, запущенная из главного окна, невидима для хромы (кнопка «Record» остаётся активной), а запись, запущенная из хромы, невидима главному окну (индикатор idle-hero и рекорд-таб показывают idle). Клик «Record» в этом состоянии вызывает второй конкурентный start_record — на Rust-стороне нет защиты от повторного старта (RECORDING используется только для чтения в recording_active, start_record проверяет лишь devices.is_empty()), получаются две параллельные записи, один stop_record останавливает обе и создаёт два проекта. Стоит пустить запись через одного владельца состояния (поднять useRecording провайдером выше SessionProvider и гейта, либо синхронизировать состояние гейта с session.recording), и/или добавить Rust-защиту от start_record при активной записи.

**Existing:**

```
											<MeetingBrowserCloseGate />
												<MeetingBrowserRecordGate />
```

### [low/bug] desktop/src/bootstrap.tsx:54-54

`Number(params.get('session'))` без проверки: отсутствующий параметр даст `Number(null)` = 0, некорректный — NaN, и после этого все session-инвойки хромы (`getMeetingBrowserSession`, navigate, close, события с фильтром `payload.session !== session`) будут молча неработоспособны. Rust-сторона всегда формирует `index.html?window=browser&session={n}` (meeting_browser.rs:232), так что в проде проблема недостижима, но ручное открытие URL в dev оставляет мёртвую хрому без диагностики. Дешёвая проверка параметра перед рендером упростит отладку.

**Existing:**

```
		ReactDOM.createRoot(root).render(<BrowserWindow session={Number(params.get('session'))} />)
```

**Suggestion:**

```
		const session = Number(params.get('session'))
		if (!Number.isFinite(session) || session < 0) {
			console.error('browser window opened without a valid session id:', window.location.search)
			return
		}
		ReactDOM.createRoot(root).render(<BrowserWindow session={session} />)
```

### [low/maintainability] desktop/src/bootstrap.tsx:28-29

`stored as never` отключает проверку типа локали, и порядок операций здесь чувствителен: если сохранённое значение мусорное и `setLocale` бросит, catch в `applyAppearance` проглотит ошибку, но строки ниже (`dark`-класс, `lang`, `dir`) уже не выполнятся — хрома откроется с системной темой вместо сохранённой, хотя код рассчитан на «cosmetic only». Paraglide runtime экспортирует `isLocale`/`locales` — стоит валидировать значение до вызова, это заодно уберёт каст `as never` (тот же паттерн продублирован в windows/browser-window.tsx:110).

**Existing:**

```
	const stored = readConfig<string | null>(CONFIG_KEYS.displayLanguage, null)
	if (stored) setLocale(stored as never, { reload: false })
```

**Suggestion:**

```
	const stored = readConfig<string | null>(CONFIG_KEYS.displayLanguage, null)
	if (stored && isLocale(stored)) setLocale(stored, { reload: false })
```

### [low/bug] desktop/src/bootstrap.tsx:58-59

Порядок вызовов: `applyAppearance()` выполняется до `runMigrations()`, хотя миграции синхронны и успевают до первого рендера. Миграция `migrateLegacyLocale` может сменить локаль ПОСЛЕ того, как `documentElement.lang`/`body.dir` уже записаны из старой локали — на первом запуске после обновления атрибут `lang` останется неверным на всю сессию, потому что в главном окне его больше никто не обновляет (`body.dir` исправляется эффектом в app.tsx, а `lang` — нет). Кроме того, `applyAppearance` одноразовый: смена языка в настройках (`setDisplayLanguage` → `setLocale`) обновляет сообщения и `body.dir`, но не `documentElement.lang` — атрибут расходится с фактическим языком UI (важно для скринридеров и переводчиков). Предложение: вызвать `applyAppearance()` после `runMigrations()` (гарантия «до первой отрисовки» сохраняется), а дляruntime-изменений обновлять `document.documentElement.lang` там же, где синхронизируется `dir` (эффект в app.tsx с `displayLanguage`).

**Existing:**

```
	// Before the first paint: a wrong-language frame on every launch reads as a reset setting.
	applyAppearance()
```

### [low/documentation] desktop/src/bootstrap.tsx:45-48

Последнее предложение комментария противоречит коду ниже: ветка браузера делает await loadConfigStore() ПЕРЕД монтированием (и внутренний комментарий это подтверждает: «the store must be in memory before the first paint»). Кроме того, миграции на самом деле выполняются не только главным окном: else-ветка безусловно вызывает runMigrations() и для dictation-indicator, и для meeting-prompt. Комментарий стоит поправить, чтобы он не вводил в заблуждение при будущих правках.

**Existing:**

```
	// The browser chrome is a chrome-only surface. Booting the whole app here would run the
	// startup migrations, device enumeration and server supervision a second time, which is
	// exactly what the main window already does — and what made the chrome behave like a second
	// app. It mounts before the config store and migrations, which only the main window needs.
```

### [low/maintainability] desktop/src/lib/use-deep-links.tsx:24-27

`!url.startsWith('vibe://')` — мёртвое условие: `isMeetingLaunchArg` возвращает true только для `https://`-ссылок и схем zoom/teams/webex, `vibe://` он не матчит, поэтому вторая проверка никогда не даёт false. Условие лишь намекает читателю, что vibe://-ссылка может быть meeting-ссылкой. Лучше убрать его (или, если такие ссылки когда-то появятся, перенести проверку схемы внутрь `isMeetingLaunchArg`).

**Existing:**

```
			if (isMeetingLaunchArg(url) && !url.startsWith('vibe://')) {
				await handOffMeetingLink(url)
				continue
			}
```

**Suggestion:**

```
			if (isMeetingLaunchArg(url)) {
				await handOffMeetingLink(url)
				continue
			}
```

### [low/maintainability] desktop/src/lib/use-single-instance.tsx:25-28

Ветка meeting-handoff продублирована с `use-deep-links.tsx` (тот же `isMeetingLaunchArg` + `handOffMeetingLink`). Набор схем и условие обработки теперь живут в двух хуках: при следующем изменении (например, новых схем или фильтре vibe://) легко обновить только одну копию. Стоит вынести общий helper в `meeting-browser.ts`, например `handOffMeetingLaunchArg(arg): Promise<boolean>` (true — ссылка распознана и обработана), и вызывать его из обоих хуков.

**Existing:**

```
			// A meeting scheme or https link handed over by the system's handler.
			if (action && isMeetingLaunchArg(action)) {
				await handOffMeetingLink(action)
			}
```

### [medium/bug] desktop/src/providers/preference.tsx:255-256

Дефолт `diarizeEnabled = true` на чистой установке работает вхолостую, а комментарий над строкой вводит в заблуждение. Проверил цепочку: для новой установки `persistedDiarize` = null, поэтому миграция ниже явно пропускается (`persistedDiarize !== true`), а загрузка модели запускается только переключателем (model-gates.ts → `toggleDiarization`). В итоге `buildSharedOptions` (use-transcribe-queue.ts) молча отбрасывает `diarize_model`, когда файл не прошёл `isModelFileUsable` — транскрипция не падает, но идёт без спикеров, при этом переключатель в настройках показывает «включено», пока пользователь не выключит и снова включит его. Фраза «the missing-model migration still switches it off when the model is absent» неверна: миграция именно что не срабатывает для свежих установок. Предложение: либо скорректировать комментарий под фактическое поведение, либо довести дефолт до конца — например, предлагать загрузку модели (`ensureDiarizeModel`) при первом использовании включённого дефолта / перед первой транскрипцией.

**Existing:**

```
	// On by default; the missing-model migration still switches it off when the model is absent.
	const [diarizeEnabled, setDiarizeEnabled] = usePersisted<boolean>(CONFIG_KEYS.diarizeEnabled, true)
```

**Suggestion:**

```
	// On by default. The model is not downloaded for a fresh install: the migration below only
	// revalidates a persisted preference, and the model-gates download runs on toggle — until then
	// buildSharedOptions silently transcribes without speakers.
	const [diarizeEnabled, setDiarizeEnabled] = usePersisted<boolean>(CONFIG_KEYS.diarizeEnabled, true)
```

### [low/maintainability] i18n/roadmap/ko-KR.json:86-87

Файл покрывает 22 из 28 неархивированных изменений openspec/changes: ключи browser-allowlist, browser-device-pickers, browser-video-recording, recording-feedback, settings-defaults-and-help, settings-version-readable отсутствуют во всех 14 файлах i18n/roadmap/\*.json. Их карточки плана развития всегда будут отрисовываться английским фолбэком (scripts/roadmap.py и website/src/lib/roadmap.ts молча подставляют английский текст, предупреждение выводится только про лишние ключи, а не про пропущенные). Стоит либо добавить записи для этих шести изменений во все локали, либо явно зафиксировать, что фолбэк принят намеренно.

**Existing:**

```
  "website-language-selector": {
    "title": "웹사이트 언어 선택기",
```

**Suggestion:**

```
  "browser-allowlist": {
    "title": "<перевод>",
    "why": "<перевод>"
  },
  "browser-device-pickers": {
    "title": "<перевод>",
    "why": "<перевод>"
  },
  "browser-video-recording": {
    "title": "<перевод>",
    "why": "<перевод>"
  },
  "recording-feedback": {
    "title": "<перевод>",
    "why": "<перевод>"
  },
  "settings-defaults-and-help": {
    "title": "<перевод>",
    "why": "<перевод>"
  },
  "settings-version-readable": {
    "title": "<перевод>",
    "why": "<перевод>"
  },
  "website-language-selector": {
```

### [low/maintainability] i18n/roadmap/pt-BR.json:70-71

В pt-BR.json пять ключей (comparison-failed-runs, local-windows-build, meeting-browser-rework, post-release-hardening, site-localization) вынесены в конец файла, тогда как во всех остальных locale-файлах i18n/roadmap (включая остальные шесть из этого ревью) ключи идут в алфавитном порядке. Функционально порядок не важен (roadmap.ts выполняет поиск по имени ключа, а порядок карточек задаёт roadmap.json), но рассинхрон с параллельными файлами затрудняет визуальное сравнение ключей между локалями и создаёт шумные диффы при будущих массовых обновлениях. Рекомендуется отсортировать ключи по алфавиту, как в остальных файлах.

**Existing:**

```
  "comparison-failed-runs": {
    "title": "Execuções com falha na comparação",
```

**Suggestion:**

```
  "app-update-controls": {
    ...
  },
  "comparison-failed-runs": {
    "title": "Execuções com falha na comparação",
    "why": "..."
  },
  "dependency-hygiene": {
    ...
```

### [high/bug] desktop/src/components/recording-feedback.tsx:230-231

Оповещение о долгой тишине никогда не срабатывает. В deps эффекта передаются объекты `feedback` и `names`, которые пересоздаются при каждом рендере: `useSourceFeedback` в `setLevels` всегда возвращает новый объект (тик каждые METER_TICK_MS = 60 мс), а часы `useElapsedSeconds` перерисовывают компонент каждые 500 мс. Эффект с интервалом в 15 с уничтожается и пересоздается каждые ~60 мс — колбэк с проверкой LONG_SILENCE_MS не успевает выполниться ни разу, поэтому `setFocus()` + диалог `recordingLongSilence` фактически мертвы, а `silentSince`/`alerted` никогда не заполняются. Нужно зависеть от примитивов или читать свежие значения через refs.

**Existing:**

```
		return () => window.clearInterval(timer)
	}, [active, enabled, feedback, names])
```

**Suggestion:**

```
	const feedbackRef = useRef(feedback)
	const namesRef = useRef(names)
	useEffect(() => {
		feedbackRef.current = feedback
		namesRef.current = names
	})

	useEffect(() => {
		if (!active) {
			silentSince.current = { microphone: null, system: null }
			alerted.current = { microphone: false, system: false }
			return
		}
		const timer = window.setInterval(() => {
			const { current: feedback } = feedbackRef
			const { current: names } = namesRef
			// ... проверка LONG_SILENCE_MS как сейчас
		}, 15_000)
		return () => window.clearInterval(timer)
	}, [active, enabled])
```

### [low/bug] desktop/src/components/recording-feedback.tsx:100-104

Апдейтер `setLevels` нечистый: внутри него мутируется внешнее замыкание `target[device] *= 0.6`. React требует чистоты апдейтеров и вправе вызвать его повторно (StrictMode, прерванные/повторные рендеры в concurrent-режиме) — тогда затухание «мёртвого» устройства применится дважды за тик (0.6 → 0.36). Перенесите decay наружу, до вызова setState; заодно можно возвращать `previous`, когда значения не изменились, — это уберёт лишний ре-рендер каждые 60 мс при полной тишине (который, в частности, подпитывает пересоздание эффектов у потребителей).

**Existing:**

```
			for (const device of DEVICES) {
				// A dead device emits nothing at all — decay so it can't freeze mid-bar.
				if (now - lastEvent[device] > LEVEL_STALE_MS) target[device] *= 0.6
				// Fast attack, slower release: peaks stay legible, the fall stays calm.
				const goal = target[device]
```

**Suggestion:**

```
		const timer = window.setInterval(() => {
			const now = Date.now()
			for (const device of DEVICES) {
				// A dead device emits nothing at all — decay so it can't freeze mid-bar.
				if (now - lastEvent[device] > LEVEL_STALE_MS) target[device] *= 0.6
			}
			setLevels((previous) => {
				let changed = false
				const next = { ...previous }
				for (const device of DEVICES) {
					// Fast attack, slower release: peaks stay legible, the fall stays calm.
					const goal = target[device]
					const eased = previous[device] + (goal - previous[device]) * (goal > previous[device] ? 0.7 : 0.3)
					next[device] = Math.abs(eased - goal) < 0.004 ? goal : eased
					changed ||= next[device] !== previous[device]
				}
				return changed ? next : previous
			})
```

### [medium/bug] desktop/src/components/recording-feedback.tsx:111-115

Ложное срабатывание «Тишина» для источника, который вообще не записывается. Запись может стартовать без одного из источников: в `use-recording.ts` `selectedDevices = [inputDevice, outputDevice].filter(... !== null)`, а оба потребителя (`idle-hero.tsx`, `browser-window.tsx`) всегда рендерят оба метра с фолбэком имени `m.noRecord()` ("None"). Такой источник не шлёт ни одного события `record_level`, `lastSound` остаётся равным `begin`, и через SILENCE_HOLD_MS (1.5 с) он навсегда помечается `silent` — пользователь видит янтарное предупреждение о «тишине» на устройстве, которое он сознательно не выбирал (а после починки deps эффекта в `useLongSilenceAlert` ещё и модальное окно через 5 минут с текстом «No sound from None…» и перехватом фокуса). При этом контракт бэкенда позволяет отличить случаи: открытый, но молчащий источник шлёт события с level=0 ~10 раз в секунду (см. `LevelMeter` в `cmd/audio.rs`), а незахваченный не шлёт ничего. Стоит флаговать «тишину» только для источников, от которых пришёл хотя бы одинevent (или передать из вызывающего кода, какие источники реально захватываются).

**Existing:**

```
			setSilent((previous) => {
				const next = {
					microphone: runningFor >= SILENCE_HOLD_MS && now - lastSound.microphone >= SILENCE_HOLD_MS,
					system: runningFor >= SILENCE_HOLD_MS && now - lastSound.system >= SILENCE_HOLD_MS,
				}
```

**Suggestion:**

```
			const everEmitted: Record<RecordLevelDevice, boolean> = { microphone: false, system: false }
			// ...в слушателе, после `lastEvent[device] = Date.now()`:
			// everEmitted[device] = true
			setSilent((previous) => {
				// Источник без единого события — не захватывается вовсе: он выключен, а не «тихий».
				const next = {
					microphone: everEmitted.microphone && runningFor >= SILENCE_HOLD_MS && now - lastSound.microphone >= SILENCE_HOLD_MS,
					system: everEmitted.system && runningFor >= SILENCE_HOLD_MS && now - lastSound.system >= SILENCE_HOLD_MS,
				}
```

### [medium/bug] desktop/src/components/recording-feedback.tsx:33-39

Хук фиксирует время не старта записи, а момента срабатывания своего эффекта. При размонтировании/повторном монтировании потребителя посреди активной записи таймер начинается заново с 00:00 и окно детекта тишины сбрасывается. Реальный сценарий: в `session.tsx` `mode` вычисляется по очереди транскрибации (`queue.jobs.length === 0 ? 'idle' : ...`), и `MainContent` переключает `IdleHero` ↔ `SessionView` — если во время записи бросить файл в транскрибацию и дождаться опустения очереди, `RecordPanel` смонтируется заново с `isRecording === true` и `startedAt` станет `Date.now()` на момент монтирования. В `meeting-browser-record-gate.tsx` настоящий `startedAt` уже хранится в персистентном ref и рассылается событием — метку времени стоит поднять на уровень состояния записи (`useRecording`/session), а не выводить её в UI-хуке.

**Existing:**

```
export function useRecordingStartedAt(recording: boolean): number | null {
	const [startedAt, setStartedAt] = useState<number | null>(null)
	useEffect(() => {
		setStartedAt(recording ? Date.now() : null)
	}, [recording])
	return startedAt
}
```

**Suggestion:**

```
// Хранить реальный момент старта вместе с isRecording в useRecording
// (переживает размонтирование RecordPanel), а в idle-hero передавать его в RecordingIndicator:
const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null)
// startRecord (успех): setRecordingStartedAt(Date.now())
// стоп/ошибка/record_finish: setRecordingStartedAt(null)
```

### [medium/performance] desktop/src/lib/text-diff.ts:25-29

Worst-case стоимость диффа в рамках заявленных бюджетов существенна для синхронного вызова на UI-потоке: при D = 2000 трасса — Σ(2d+1) ≈ 4 млн Int32 (~16 МБ) на один вызов, а время до O((N+M)·D) ≈ 80 млн сравнений строк. Единственный текущий потребитель (models-comparison-results.tsx) вызывает `diffWords` прямо в теле рендера для каждой колонки без `useMemo` — то есть на патологической паре транскриптов любой ре-рендер диалога (переключение baseline/highlight) повторяет фриз и аллокации. Стоит либо мемоизировать результат по [baselineText, text] на стороне вызова, либо снизить бюджет правок / добавить ограничение по времени, чтобы худший случай оставался интерактивным.

**Existing:**

```
/**
 * Myers stops once the edit script is this long: more changes than this in one pair
 * of transcripts is not a useful highlight, and the trace memory grows with D².
 */
export const MAX_DIFF_EDITS = 2_000
```

### [low/bug] desktop/src/lib/text-diff.ts:32-34

Токенизация только по пробелам превращает «пословный» дифф в пофразный для CJK-локалей. Whisper выводит китайский (zh-CN, zh-HK — поддерживаемые локали приложения) без пробелов между словами, поэтому весь сегмент становится одним токеном: при отличии в один иероглиф весь сегмент подсвечивается как удалённый+добавленный, и выделение теряет смысл именно для этих языков. Стоит сегментировать слова через `Intl.Segmenter` (доступен в WebView2/WebKit), оставив текущий regex как fallback — при этом join токенов должен по-прежнему восстанавливать исходный текст.

**Existing:**

```
export function tokenize(text: string): string[] {
	return text.match(/\S+\s*/g) ?? []
}
```

**Suggestion:**

```
const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null

export function tokenize(text: string): string[] {
	if (!segmenter) return text.match(/\S+\s*/g) ?? []
	//Intl.Segmenter с granularity 'word': пробельные сегменты присоединять
	//к хвосту предыдущего токена, чтобы join() восстанавливал текст
	...
}
```

### [low/maintainability] scripts/check_docs_pages.py:30-30

Проверка сверяет множества пар category/slug, но не защищает инвариант, от которого зависит сайт: slug должен быть уникален во всех категориях (docs.ts явно документирует это — «The slug is the deep-link anchor (/docs#slug), so it is unique across all categories»). В Docs.tsx поиск страницы идёт по «голому» slug (pages.find((doc) => doc.slug === slug)) и key={entry.slug}. Если в pageOrder появится одинаковый slug в двух категориях (и его же добавят в DOC_PAGES в content_i18n.py), обе проверки пройдут, но на сайте будет дублирующийся React key, find() всегда станет возвращать первую страницу, а вторая станет недостижимой по глубинной ссылке. Стоит добавить сюда же проверку уникальности slug.

**Existing:**

```
    site = {f"{category}/{slug}.md" for category, slug in ENTRY.findall(text[start:end])}
```

**Suggestion:**

```
    pages = ENTRY.findall(text[start:end])
    slugs = [slug for _, slug in pages]
    duplicates = sorted({slug for slug in slugs if slugs.count(slug) > 1})
    if duplicates:
        print("check_docs_pages: slugs must be unique across categories:", *duplicates, sep="\n  ")
        return 1
    site = {f"{category}/{slug}.md" for category, slug in pages}
```

### [medium/bug] website/src/pages/Docs.tsx:16-19

decodeURIComponent бросает URIError на некорректной %-последовательности в хэше (например, `/docs#%`, `/docs#100%` или усечённый `%E0%A4`). slugFromHash вызывается в ленивом инициализаторе useState (строка 28) — исключение во время рендера уронит всю страницу /docs, а также упадёт обработчик hashchange (строка 45). Хэш контролируется пользователем через URL, старый код (replace без декодирования) такой ошибки не имел. Стоит безопасно декодировать с fallback на исходную строку.

**Existing:**

```
function slugFromHash(hash: string) {
	const wanted = decodeURIComponent(hash.replace(/^#/, '')).toLowerCase()
	return englishDocs.find((doc) => doc.slug === wanted)?.slug ?? englishDocs[0].slug
}
```

**Suggestion:**

```
function slugFromHash(hash: string) {
	const raw = hash.replace(/^#/, '')
	let wanted = raw
	try {
		wanted = decodeURIComponent(raw)
	} catch {
		// A malformed %-sequence (e.g. `#100%`) must not take the page down.
	}
	return englishDocs.find((doc) => doc.slug === wanted.toLowerCase())?.slug ?? englishDocs[0].slug
}
```

### [low/maintainability] website/src/components/LanguageSelector.tsx:10-12

Проп `compact` фактически ни на что не влияет: он меняет только атрибут `data-placement` (используется тестами), а вся видимая разница между мобильной и десктопной версиями задаётся родителем через `className` (`"sm:hidden"` / `"hidden sm:block"`). Док-комментарий «the same list, less chrome» вводит в заблуждение — «меньше хрома» внутри компонента не реализовано. Лучше либо убрать `compact` (и в тестах выбирать экземпляр по классам контейнера), либо перенести визуальные отличия компактного режима внутрь компонента, чтобы проп соответствовал своему названию.

**Existing:**

```
	/** Compact trigger for the small-screen header: the same list, less chrome. */
	compact?: boolean
	className?: string
```

### [low/other] website/src/components/LanguageSelector.tsx:21-27

Селектор языка в этом изменении становится продакшн-контролом (раньше рендерился только при import.meta.env.DEV), но поповер закрывается только по mousedown вне элемента: не обрабатывается Escape, меню не закрывается при уходе фокуса по Tab и не управляется фокус внутри списка. Для клавиатурных пользователей и скринридеров меню остаётся «залипшим» после навигации по Tab. Стоит добавить закрытие по Escape (и, в идеале, возврат фокуса на триггер), например через keydown-обработчик рядом с существующим closeOnOutsideClick.

**Existing:**

```
	useEffect(() => {
		function closeOnOutsideClick(event: MouseEvent) {
			if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
		}
		document.addEventListener('mousedown', closeOnOutsideClick)
		return () => document.removeEventListener('mousedown', closeOnOutsideClick)
	}, [])
```

**Suggestion:**

```
	useEffect(() => {
		function closeOnOutsideClick(event: MouseEvent) {
			if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
		}
		function closeOnEscape(event: KeyboardEvent) {
			if (event.key !== 'Escape') return
			setOpen(false)
			menuRef.current?.querySelector<HTMLButtonElement>('button[type="button"]')?.focus()
		}
		document.addEventListener('mousedown', closeOnOutsideClick)
		document.addEventListener('keydown', closeOnEscape)
		return () => {
			document.removeEventListener('mousedown', closeOnOutsideClick)
			document.removeEventListener('keydown', closeOnEscape)
		}
	}, [])
```

### [medium/bug] website/src/components/Layout.tsx:15-19

Вызов `setLocale(initial, { reload: false })` внутри инициализатора `useState` — это побочный эффект (запись в глобальное состояние Paraglide и localStorage) во время рендера. Инициализатор должен быть чистой функцией: в dev-режиме включён StrictMode (main.tsx), поэтому он вызывается дважды, а при concurrent-рендеринге React вправе отбросить рендер, оставив глобальную локаль уже изменённой. Надёжнее синхронизировать Paraglide до первого рендера приложения (например, в точке входа до `createRoot`: `setLocale(localeFromSearch(window.location.search) ?? getLocale(), { reload: false })`), а в Layout оставить только чтение значения — это сохранит корректный первый paint без побочного эффекта в рендере.

**Existing:**

```
	const [locale, setCurrentLocale] = useState<Locale>(() => {
		const initial = localeFromSearch(location.search) ?? getLocale()
		setLocale(initial, { reload: false })
		return initial
	})
```

**Suggestion:**

```
	const [locale, setCurrentLocale] = useState<Locale>(() => localeFromSearch(location.search) ?? getLocale())
```

### [medium/maintainability] website/src/components/Layout.tsx:25-29

Двойной механизм синхронизации локали с URL: `writeLocaleToUrl` использует `history.replaceState`, который не уведомляет react-router, поэтому после переключения языка `location.search` роутера продолжает держать старый `?lang=` до следующей навигации. Следствие — новому хуку `useLocale` пришлось читать `window.location` напрямую вместо `useLocation` (обходной путь задокументирован в самом хуке), а любой будущий потребитель `useSearchParams`/`useLocation().search` получит устаревшее значение. Синхронизируйте язык через сам роутер — тогда оба источника всегда согласованы и `useLocale` упрощается до `localeFromSearch(location.search) ?? getLocale()`:

**Existing:**

```
	const onLocaleChange = useCallback((nextLocale: Locale) => {
		setLocale(nextLocale, { reload: false })
		setCurrentLocale(nextLocale)
		writeLocaleToUrl(nextLocale)
	}, [])
```

**Suggestion:**

```
	const onLocaleChange = useCallback((nextLocale: Locale) => {
		setLocale(nextLocale, { reload: false })
		setCurrentLocale(nextLocale)
		// replace-навигация роутера держит window.location и router location согласованно,
		// поэтому writeLocaleToUrl и обходной путь с window.location в useLocale не нужны.
		navigate(
			{ pathname: location.pathname, search: `?${new URLSearchParams({ [websiteLocaleParam]: nextLocale }).toString()}` },
			{ replace: true },
		)
	}, [location.pathname, navigate])
```

### [medium/bug] website/src/components/Layout.tsx:39-42

Гонка между двумя соседними эффектами при навигации на URL с другим `?lang=` (например, popstate назад/вперёд на более старую запись истории или переход по ссылке с новой локалью). В момент, когда роутер уже отдал `location.search` с новой локалью, эффект выше (строки 32–37) только планирует `setCurrentLocale(fromUrl)`, а состояние `locale` в текущем коммите ещё старое — `localeRef.current` содержит предыдущую локаль. Эффект записи выполняется в том же коммите и вызывает `writeLocaleToUrl(localeRef.current)`, то есть на один цикл перезаписывает свежий `?lang=` в адресной строке предыдущим языком; восстановление происходит лишь на повторном рендере после применения состояния. Любой код, читающий URL в этом окне (например, `useLocale` читает `window.location.search`), может увидеть неверную локаль. Стоит в эффекте записи отдавать приоритет значению из URL: `const fromUrl = localeFromSearch(location.search); writeLocaleToUrl(fromUrl ?? localeRef.current)` — либо объединить оба эффекта в один.

**Existing:**

```
	// Keep lang in the URL so in-site navigation and shared links carry the choice.
	useEffect(() => {
		writeLocaleToUrl(localeRef.current)
	}, [location.pathname, location.search, locale])
```

**Suggestion:**

```
	// Keep lang in the URL so in-site navigation and shared links carry the choice.
	useEffect(() => {
		// A fresh ?lang= from the URL outranks the not-yet-committed locale state.
		const fromUrl = localeFromSearch(location.search)
		writeLocaleToUrl(fromUrl ?? localeRef.current)
	}, [location.pathname, location.search, locale])
```

### [low/maintainability] website/src/components/Nav.tsx:55-56

Оба экземпляра LanguageSelector смонтированы одновременно (скрываются только CSS-классами) и держат независимые состояния `open` с собственными слушателями клика по document. Если открыть меню на одном брейкпоинте и изменить размер окна, скрытый экземпляр останется открытым — при возврате к брейкпоинту меню внезапно окажется раскрытым. Стоит либо сделать состояние управляемым на уровне Nav (общий `open`/`onOpenChange`), либо сбрасывать `open` при смене видимости.

**Existing:**

```
				<LanguageSelector compact className="sm:hidden" locale={locale} availableLocales={availableLocales} onLocaleChange={onLocaleChange} />
				<LanguageSelector className="hidden sm:block" locale={locale} availableLocales={availableLocales} onLocaleChange={onLocaleChange} />
```

**Suggestion:**

```
				{/* Единое состояние открытия, чтобы меню не оставалось раскрытым в скрытом экземпляре. */}
				<LanguageSelector compact open={langOpen} onOpenChange={setLangOpen} className="sm:hidden" locale={locale} availableLocales={availableLocales} onLocaleChange={onLocaleChange} />
				<LanguageSelector open={langOpen} onOpenChange={setLangOpen} className="hidden sm:block" locale={locale} availableLocales={availableLocales} onLocaleChange={onLocaleChange} />
```

### [low/performance] website/src/lib/roadmap.ts:60-66

`roadmap.json` не зависит от локали (переводы уже в бандле через eager-glob), но `loadRoadmap` при каждой смене языка заново fetch'ит тот же URL и сбрасывает карточки в skeleton. Стоит закэшировать результат fetch на уровне модуля и выполнять только локализацию при смене локали; при ошибке/аборте кэш сбрасывается.

**Existing:**

```
export async function loadRoadmap(locale: string, signal?: AbortSignal): Promise<RoadmapEntry[]> {
	const response = await fetch(`${import.meta.env.BASE_URL}roadmap.json`, { signal })
	if (!response.ok) throw new Error(`roadmap: ${response.status}`)
	const data: unknown = await response.json()
	if (!Array.isArray(data) || !data.every(isEntry)) throw new Error('roadmap: unexpected JSON')
	return localizeRoadmap(data, locale)
}
```

**Suggestion:**

```
let roadmapCache: Promise<unknown> | undefined

/** The JSON is locale-independent — translations ship in the bundle — so one fetch serves every language. */
function fetchRoadmap(signal?: AbortSignal): Promise<unknown> {
	roadmapCache ??= fetch(`${import.meta.env.BASE_URL}roadmap.json`, { signal })
		.then(async (response) => {
			if (!response.ok) throw new Error(`roadmap: ${response.status}`)
			return response.json()
		})
		.catch((error) => {
			roadmapCache = undefined
			throw error
		})
	return roadmapCache
}

export async function loadRoadmap(locale: string, signal?: AbortSignal): Promise<RoadmapEntry[]> {
	const data = await fetchRoadmap(signal)
	if (!Array.isArray(data) || !data.every(isEntry)) throw new Error('roadmap: unexpected JSON')
	return localizeRoadmap(data, locale)
}
```

### [medium/style] website/src/pages/Changelog.tsx:125-125

Вложенный тернарный оператор: `dev ? (devEntry ? … : …) : one ? … : …` — три ветви в одном выражении, что запрещено чек-листом и затрудняет чтение при добавлении новых состояний загрузки (например, состояние ошибки). Стоит развернуть в именованные ветви.

**Existing:**

```
	const shown = dev ? (devEntry ? [devEntry.release] : []) : one ? [one] : (list ?? [])
```

**Suggestion:**

```
	let shown: Release[] = list ?? []
	if (dev) shown = devEntry ? [devEntry.release] : []
	else if (one) shown = [one]
```

### [low/bug] website/src/pages/Changelog.tsx:150-155

Заголовок вкладки учитывает только `one`, а на dev-URL (`/changelog/dev`, включая fallback на конкретный релиз) `one` всегда `undefined` — заголовок остаётся generic «Vibe Changelog», тогда как версионные страницы получают персонализированный. Стоит включить dev-запись в вычисление и в зависимости эффекта.

**Existing:**

```
	useEffect(() => {
		document.title = one ? `Vibe v${one.version}: ${one.title}` : `Vibe ${m.changelog()}`
		return () => {
			document.title = 'Vibe'
		}
	}, [one])
```

**Suggestion:**

```
	const headline = one ?? devEntry?.release
	useEffect(() => {
		document.title = headline
			? `Vibe ${headline.version === 'unreleased' ? m.changelogUnreleased() : `v${headline.version}`}: ${headline.title}`
			: `Vibe ${m.changelog()}`
		return () => {
			document.title = 'Vibe'
		}
	}, [headline])
```

### [medium/bug] website/src/pages/Changelog.tsx:55-55

Локализованное сообщение используется как DOM `id` статьи (`<article id={id}>`, строка 60). Значения `changelogUnreleased` во многих локалях содержат пробелы — «Не выпущено» (ru), «Sin publicar» (es-MX), «Non publié» (fr), «Ikke utgitt» (no), «טרם פורסם» (he) — а HTML-спецификация запрещает пробелы в значении id, поэтому атрибут становится невалидным (CSS-селектор `#...` по нему уже не сработает). Кроме того, id теперь меняется вместе с языком страницы: анкор `#Unreleased`, стабильный до этого изменения, перестаёт существовать в не-английских локалях, хотя `scroll-mt-24` на статье показывает, что она задумана как цель якорной ссылки. Стоит разделить видимый текст и машинный идентификатор: id оставить постоянным (`unreleased`), а локализованную строку выводить только в ссылке.

**Existing:**

```
	const id = release.version === 'unreleased' ? m.changelogUnreleased() : `v${release.version}`
```

**Suggestion:**

```
	const id = release.version === 'unreleased' ? 'unreleased' : `v${release.version}`
	const label = release.version === 'unreleased' ? m.changelogUnreleased() : `v${release.version}`
	// далее в <Link> выводить {label}, а id={id} оставить машинным
```

### [low/maintainability] website/src/pages/Changelog.tsx:56-57

Маршрут дев-линии захардкожен литералом `'/changelog/dev'` и продублирован: здесь в `Entry` и в `devPath` (строка 38, собирается из `BASE_URL`), хотя в `changelog.ts` уже есть экспортированная константа `devAlias`. При переименовании алиаса придётся синхронно править несколько несвязанных мест (включая `isDevVersion` и `changelogURL` в desktop), и рассинхронизация сломает редирект `replaceState` молча. Стоит собирать путь из `devAlias` в одном месте.

**Existing:**

```
	// The unreleased entry is the dev line, so its heading opens the permanent alias.
	const href = release.version === 'unreleased' ? '/changelog/dev' : `/changelog/${release.version}`
```

**Suggestion:**

```
	// The unreleased entry is the dev line, so its heading opens the permanent alias.
	const href = release.version === 'unreleased' ? `/changelog/${devAlias}` : `/changelog/${release.version}`
```

### [low/other] website/src/pages/Roadmap.tsx:39-40

Во время загрузки `roadmap.json` (первый заход и каждая смена локали) `entries === null` и страница ниже заголовка пустая — футер «прыгает» вверх и обратно. Changelog.tsx в этом же PR прямо защищается от этого (`min-h-[100vh]` с комментарием «Holds the page's height while translations load, so the footer does not jump up and back»), а Roadmap такой заглушки не имеет; кэширование fetch (см. замечание по roadmap.ts) уберёт мерцание при смене языка, но не при первой загрузке.

**Existing:**

```
			{failed && (
				<p role="alert" className="mt-14 rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">
```

**Suggestion:**

```
			{/* Holds the page's height while roadmap.json loads, so the footer does not jump up and back. */}
			{entries === null && !failed && <div className="mt-14 min-h-[60vh]" aria-hidden="true" />}

			{failed && (
				<p role="alert" className="mt-14 rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">
```

### [high/bug] scripts/package_server_release.sh:47-49

`mv "$found" "$stage/ffmpeg"` безусловно лишает ffmpeg расширения `.exe` на Windows. Потребитель архива — scripts/setup_sidecars.sh — ищет члены по имени `vibe-server$exe` / `ffmpeg$exe` (для windows-триплета это `ffmpeg.exe`), и приложение (desktop/src-tauri/src/cmd/server_cmd.rs, resolve_ffmpeg_path) тоже ожидает `ffmpeg.exe`. Zip gyan.dev содержит бинарник вложенно (`ffmpeg-release-essentials/bin/ffmpeg.exe`), поэтому find вернёт `ffmpeg.exe`, а mv переименует его в `ffmpeg` — релизный архив Windows выйдет без `ffmpeg.exe`, и setup_sidecars.sh упадёт с «ffmpeg.exe is missing from …». Дополнительно на macOS zip-ы osxexperts держат `ffmpeg` в корне архива: первый unzip распакует его сразу в `$stage/ffmpeg`, и `mv "$stage/ffmpeg" "$stage/ffmpeg"` завершится ошибкой «same file», прервав скрипт из-за `set -e`.

**Existing:**

```
mv "$found" "$stage/ffmpeg"
rm -f "$stage/ffmpeg.zip"
chmod 755 "$stage/ffmpeg"
```

**Suggestion:**

```
ffmpeg_name="ffmpeg"
case "$goos" in
windows) ffmpeg_name="ffmpeg.exe" ;;
esac
if [ "$found" != "$stage/$ffmpeg_name" ]; then
    mv "$found" "$stage/$ffmpeg_name"
fi
rm -f "$stage/ffmpeg.zip"
chmod 755 "$stage/$ffmpeg_name"
```

### [medium/maintainability] scripts/package_server_release.sh:40-41

Для Windows-цели первый unzip с шаблонами 'ffmpeg'/'ffmpeg.exe' не совпадает с вложенной структурой архива gyan.dev (`ffmpeg-release-essentials/bin/…`), поэтому запасная распаковка всего архива становится штатным путём: в stage остаются `bin/ffprobe.exe`, `bin/ffplay.exe`, документация и лицензии, и финальная упаковка `zip -q -r "$out" .` / `tar -czf … .` кладёт всё это в релизный архив — лишние исполняемые файлы и заметно раздутый артефакт. Стоит очищать stage до двух нужных файлов перед упаковкой.

**Existing:**

```
unzip -q -o "$stage/ffmpeg.zip" 'ffmpeg' 'ffmpeg.exe' -d "$stage" 2>/dev/null ||
    unzip -q -o "$stage/ffmpeg.zip" -d "$stage"
```

**Suggestion:**

```
unzip -q -o "$stage/ffmpeg.zip" 'ffmpeg' 'ffmpeg.exe' -d "$stage" 2>/dev/null ||
    unzip -q -o "$stage/ffmpeg.zip" -d "$stage"
# после извлечения и mv:
find "$stage" -mindepth 1 -maxdepth 1 ! -name "$name" ! -name "$ffmpeg_name" -exec rm -rf {} +
```

### [high/security] scripts/package_server_release.sh:39-39

ffmpeg скачивается со сторонних хостов (osxexperts.net, gyan.dev) по HTTPS, но без какой-либо проверки контрольной суммы или подписи, и упаковывается в релизный архив, который приложение затем распаковывает и исполняет: при компрометации источника или тихой замене файла вредоносный бинарник транзитом уйдёт всем пользователям (supply-chain). Ссылка gyan.dev «ffmpeg-release-essentials» к тому же плавающая — содержимое меняется с каждым апстрим-релизом, поэтому сборка ещё и невоспроизводима (нигде в scripts/ и .github/workflows проверок sha256/checksum нет). Стоит закрепить ожидаемые SHA-256 на target и сверять их после загрузки (для osxexperts это заодно фиксирует версию «80», зашитую в имя файла).

**Existing:**

```
curl -fsSL --retry 3 --connect-timeout 20 --max-time 180 -o "$stage/ffmpeg.zip" "$url"
```

**Suggestion:**

```
case "$goos/$goarch" in
darwin/amd64) sha256="<pin>" ;;
darwin/arm64) sha256="<pin>" ;;
windows/amd64) sha256="<pin>" ;;
esac
curl -fsSL --retry 3 --connect-timeout 20 --max-time 180 -o "$stage/ffmpeg.zip" "$url"
echo "$sha256  $stage/ffmpeg.zip" | sha256sum -c
```

### [low/maintainability] scripts/package_server_release.sh:29-32

URL конкретных сторонних сборок ffmpeg зашиты прямо в case-блоке, включая номер версии («ffmpeg80») в имени файла у osxexperts и плавающий «release-essentials» у gyan.dev; тот же ffmpeg для CI скачивает scripts/ci/fetch_ffmpeg.py, получая URL из FFMPEG_URL. Версия/источник ffmpeg сейчас не управляются из одной точки: при выходе новой сборки или изменении структуры ссылок упаковка релиза молча сломается в двух местах независимо. Стоит вынести URL (вместе с контрольными суммами) в единое место и переиспользовать его в обоих скриптах.

**Existing:**

```
case "$goos/$goarch" in
darwin/amd64) url="https://www.osxexperts.net/ffmpeg80intel.zip" ;;
darwin/arm64) url="https://www.osxexperts.net/ffmpeg80arm.zip" ;;
windows/amd64) url="https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip" ;;
```

### [low/bug] scripts/package_server_release.sh:58-59

`zip -q -r` по уже существующему архиву работает в режиме update: добавляет и обновляет члены, но не удаляет лишние. Если по пути `$out` остался архив предыдущего прогона (например, повторный локальный `task server:package-release` с тем же именем файла), в релизный архив попадут члены прошлой итерации — `bin/ffprobe.exe` и прочие остатки fallback-распаковки gyan-архива или `vibe-server.exe` от другого таргета, — и они уедут в публикуемый артефакт. Ветка с `tar -czf` безопасна: она пересоздаёт файл. Стоит явно удалять существующий `$out` перед упаковкой.

**Existing:**

```
*.zip) (cd "$stage" && zip -q -r "$out" .) ;;
*) tar -czf "$out" -C "$stage" . ;;
```

**Suggestion:**

```
rm -f "$out"
case "$archive" in
*.zip) (cd "$stage" && zip -q -r "$out" .) ;;
*) tar -czf "$out" -C "$stage" . ;;
esac
```

### [low/maintainability] scripts/release_set_version.py:21-23

Прямое обращение `os.environ["VERSION"]` / `os.environ["GITHUB_REF"]` без обработки отсутствия: при незаданной переменной CI получит сырой KeyError-traceback вместо аккуратного сообщения `::error::` — в соседнем release_notes.py из этого же PR для того есть helper env(). Заодно для консистентности с release_notes.py стоит передавать encoding="utf-8" в read_text/write_text: сейчас tauri.conf.json чисто ASCII, но на раннере с cp1252-локалью не-ASCII-содержимое конфига исказится при круговой перезаписи.

**Existing:**

```
def main() -> int:
    version = os.environ["VERSION"]
    ref = os.environ["GITHUB_REF"]
```

**Suggestion:**

```
def env(name: str) -> str:
    value = os.environ.get(name)
    if value is None:
        raise SystemExit(f"{name} is required")
    return value


def main() -> int:
    version = env("VERSION")
    ref = env("GITHUB_REF")
```

### [low/maintainability] scripts/release_set_version.py:30-32

Применение override через полный цикл json.loads → json.dumps(indent=2) перезаписывает весь tauri.conf.json, а не только строку версии: json.dumps с indent разворачивает все однострочные массивы ("targets": ["nsis", "deb", ...], "endpoints": [...], "externalBin": [...]) в многострочные. Для эфемерной CI-копии это безвредно, но задача task release:set-version запускается и локально — закоммиченный после неё файл даст шумный diff по всему файлу вместо одной строки. Дополнительно: read_text()/write_text() без encoding="utf-8" (в release_notes.py из того же PR encoding указывается везде) — на не-UTF-8 локали (Windows-раннер) чтение может упасть с UnicodeDecodeError. Надёжнее точечно заменить значение поля version с сохранением форматирования файла.

**Existing:**

```
    config = json.loads(TAURI_CONFIG.read_text())
    config["version"] = version
    TAURI_CONFIG.write_text(json.dumps(config, indent=2) + "\n")
```

**Suggestion:**

```
    text = TAURI_CONFIG.read_text(encoding="utf-8")
    updated, count = re.subn(
        r'("version"\s*:\s*")[^"]*"', rf'\g<1>{version}"', text, count=1
    )
    if count != 1:
        print("::error::no version field to override in tauri.conf.json")
        return 1
    TAURI_CONFIG.write_text(updated, encoding="utf-8")
```

### [high/bug] scripts/sign.py:1-2

Удалён PEP 723-заголовок с зависимостями (httpx, flask, python-dotenv), но способ запуска не поменялся: докстринг ниже по-прежнему предписывает `uv run --env-file .env.local scripts/sign.py serve` и `uv run scripts/sign.py sign <file>`, подсказка сервера печатает `SIGN_ENABLED=true uv run scripts/sign.py sign main.exe`, а tauri.windows.signing.conf.json вызывает именно `uv run ../../scripts/sign.py sign %1` как signCommand релизного job'а. Без inline-метаданных uv больше не устанавливает зависимости, и скрипт упадёт с ModuleNotFoundError: при включённой подписи (`import httpx` в upload_for_signing) и сразу на старте `serve` (`from dotenv import load_dotenv`, `from flask import …`). Нужно либо вернуть заголовок, либо перейти на другой способ доставки зависимостей и поправить докстринг/signCommand.

**Existing:**

```
"""
Windows code signing over a YubiKey, in two halves of one script.
```

**Suggestion:**

```
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "httpx==0.28.1",
#     "flask==3.1.2",
#     "python-dotenv==1.2.1",
# ]
# ///
"""
Windows code signing over a YubiKey, in two halves of one script.
```

### [low/documentation] .github/ISSUE_TEMPLATE/bug_report.yaml:16-16

Ссылка в этой строке переведена на репозиторий форка (`kisev/vibe`), но соседняя строка того же вводного блока — поиск уже существующих багов — осталась на апстриме: `https://github.com/thewh1teagle/vibe/issues?q=is:issue+label:bug+`. README при этом направляет баг-репорты в трекер форка (`kisev/vibe/issues/new`...). Пользователь, отправивший репорт по этому шаблону, будет искать дубликаты в чужом трекере, где его отчёт не появится. Стоит заменить и вторую ссылку на `kisev/vibe`.

**Existing:**

```
              If not reported, if possible please check the [crash troubleshooting guide](https://github.com/kisev/vibe/blob/main/docs/how-to/troubleshoot-a-crash.md) and add comments with more info.
```

**Suggestion:**

```
              One second before you create, search if it's already reported [issues](https://github.com/kisev/vibe/issues?q=is:issue+label:bug+)
```

### [medium/bug] lefthook.yml:80-80

Glob расширен до всех `**/*.rs`, но команда `cargo fmt --all` выполняется из корня репозитория, чей workspace исключает server/ (отдельный workspace). Итог: закоммиченный изменённый файл в server/ триггерит хук, но фактически не проверяется — ложный пропуск (false negative) гейта, и неформатированный серверный код проходит pre-commit. CI повторяет ту же команду (`task rust:fmt-check`), так что пробел не компенсируется. Стоит проверять оба workspace (или вернуть исходный scoped glob).

**Existing:**

```
      glob: "**/*.rs"
```

**Suggestion:**

```
      glob: "**/*.rs"
      run: cargo fmt --all -- --check && cargo fmt --all --manifest-path server/Cargo.toml -- --check
```

### [medium/maintainability] pyproject.toml:7-15

Шесть из девяти зависимостей нигде не используются: поиск по всему репозиторию не находит ни одного импорта pandas, pyarrow, bs4, curl_cffi, pyjwt или pyperclip (вероятно, их потребители удалены вместе с scripts/export_analytics.py и export_kofi_supports.py). Реально нужны только httpx, flask и python-dotenv. Лишние pandas+pyarrow — это ~100+ МБ окружения при каждом `uv sync`/`uv run` в CI и локально. Кроме того, `bs4` — это устаревший stub-пакет, каноничное имя — `beautifulsoup4`; зависимость от stub-пакета — антипаттерн.

**Existing:**

```
  "bs4>=0.0.2",
  "curl-cffi>=0.7",
  "flask>=3.1",
  "httpx>=0.28",
  "pandas>=3.0",
  "pyarrow>=23",
  "pyjwt>=2.11",
  "pyperclip>=1.9",
  "python-dotenv>=1.2.1",
```

**Suggestion:**

```
  "flask>=3.1",
  "httpx>=0.28",
  "python-dotenv>=1.2.1",
```

### [medium/bug] renovate.json:13-15

Верхнеуровневый ключ `"mise"` — не существующая опция конфигурации Renovate: менеджеры отключаются только через `packageRules` + `matchManagers` (или через `enabledManagers`). Нераспознанный ключ Renovate молча игнорирует (остаётся лишь config warning в логе), поэтому встроенный менеджер `mise` останется включённым и будет обрабатывать `mise.toml` параллельно с пятью customManagers из этого же файла — каждую неделю будут создаваться дублирующиеся ветки/PR на одни и те же пины (например, два PR на обновление `npm:oxfmt`), конфликтующие между собой. Судя по описанию конфига («every [tools] pin below is covered by a regex manager»), отключение встроенного менеджера и было целью этой записи.

**Existing:**

```
  "mise": {
    "enabled": false
  },
```

**Suggestion:**

```
  "packageRules": [
    {
      "matchManagers": ["mise"],
      "enabled": false
    },
    // ...остальные правила
  ]
```

### [high/bug] taskfile.yml:606-606

Задача `release:set-version` жёстко вызывает `python3`, но release.yml запускает её на матрице, включающей `windows-latest` (шаг "Apply the version override", `shell: bash`, `mise exec -- task release:set-version`). На Windows-образах доступен только `python` — на это прямо указывает комментарий к переменной `{{.PYTHON}}` в этом же файле (её уже применили в `release:notes`, но пропустили здесь). Любой запуск Release с непустым `inputs.version` (например, rc-сборка) будет детерминированно падать на Windows-ячейке матрицы, и релиз потеряет Windows-артефакты. Нужно использовать `{{.PYTHON}}`.

**Existing:**

```
      - python3 scripts/release_set_version.py
```

**Suggestion:**

```
      - '{{.PYTHON}} scripts/release_set_version.py'
```

### [low/documentation] taskfile.yml:252-252

Описание `rust:fmt-check` утверждает «desktop app, CLI, server», но корневой workspace (корневой Cargo.toml: members = ["crates/meeting-detect", "desktop/src-tauri"], exclude = ["server"]) не включает server/, поэтому `cargo fmt --all` не проверяет серверные файлы. Тот же пробел остаётся в хуке `rust-format` в lefthook.yml (glob `**/*.rs` при команде, покрывающей только корневой workspace) и в CI (`lint_rust.yml` вызывает именно эту задачу) — форматирование server/ не проверяется нигде. Стоит либо убрать «server» из описания, либо добавить вторую проверку по манифесту server/Cargo.toml.

**Existing:**

```
    desc: Format check over the root workspace (desktop app, CLI, server)
```

**Suggestion:**

```
    desc: Format check over the root workspace (desktop app, CLI); server/ is a separate workspace
    cmds:
      - mise exec -- cargo fmt --all -- --check
      - mise exec -- cargo fmt --all --manifest-path server/Cargo.toml -- --check
```

### [medium/bug] taskfile.yml:434-434

Несогласованная семантика exit-кодов: `cargo outdated` по умолчанию завершается с кодом 1, просто если НАЙДЕНЫ устаревшие зависимости (не только при ошибке). Эта строка превращает любой такой «найденный» результат в status=1, тогда как ветка pnpm ниже явно допускает rc=1 («pnpm exits 1 when it found outdated packages; anything higher is a failure»), а `uv pip list --outdated` вообще всегда возвращает 0. В итоге задача с desc «Report outdated dependencies … (read-only)» почти всегда будет завершаться кодом 1 (устаревшие cargo-зависимости есть почти всегда), что делает её бесполезной как отчёт и не позволяет использовать её в скриптах без `|| true`. Нужно tolerate rc\<=1 для cargo так же, как для pnpm.

**Existing:**

```
          mise exec -- cargo outdated --workspace --manifest-path "$manifest" || status=1
```

**Suggestion:**

```
          rc=0
          mise exec -- cargo outdated --workspace --manifest-path "$manifest" || rc=$?
          # cargo-outdated exits 1 when it found outdated packages; anything higher is a failure.
          [ "$rc" -le 1 ] || status=$rc
```

### [medium/bug] taskfile.yml:543-545

Задача хардкодит `python`, хотя она выполняется в dev-build.yml на матрице, включающей macos-latest (ячейки с ffmpeg != ''), где шаг идёт через дефолтный bash-шелл: `mise exec -- task ci:fetch-ffmpeg`. Собственная конвенция этого же PR (переменная PYTHON наверху файла) прямо утверждает: «Windows images expose `python`, while Unix runners use `python3`» — т.е. на Unix-раннерах бинаря `python` может не быть. Комментарий про «old Actions `shell: python`» тут не применим: `shell: python` резолвит интерпретатор сам раннер, а здесь команда запускается из bash/pwsh через task, полагаясь на PATH. Нужно использовать ту же переменную {{.PYTHON}}, что и в dev:guard/dev:prepare/release:notes.

**Existing:**

```
    cmds:
      # `python` is what the old Actions `shell: python` used on every platform.
      - python scripts/ci/fetch_ffmpeg.py
```

**Suggestion:**

```
    cmds:
      - '{{.PYTHON}} scripts/ci/fetch_ffmpeg.py'
```

### [low/bug] scripts/content_i18n.py:163-165

В `docs_audit` нет проверки существования английского оригинала перед `source_hash(english)`. Если страница из `DOC_RELATIVE` отсутствует в `i18n/docs/en-US` (это уже помечается как issue в первом цикле), но у локали остался её перевод, `source_hash(english)` бросит необработанный `FileNotFoundError` — аудит упадёт с traceback вместо аккуратного отчёта «content i18n failed with N issue(s)». Ср. с `changelog_audit`, где аналогичный случай явно обработан (`if not english.exists(): issues.append(...); continue`), и с `stamp()`, где тоже стоит `if not english.exists(): continue`. Стоит добавить такой же guard для симметрии.

**Existing:**

```
            english = DOCS / "en-US" / relative
            match = DOC_STAMP.match((directory / relative).read_text())
            if not match or match.group(1) != source_hash(english):
```

**Suggestion:**

```
            english = DOCS / "en-US" / relative
            if not english.exists():
                issues.append(f"docs: {locale}/{relative} translates a page with no English original")
                continue
            match = DOC_STAMP.match((directory / relative).read_text())
            if not match or match.group(1) != source_hash(english):
```

### [low/bug] scripts/phone_probe.sh:16-18

Безусловный префикс `../../$file` ломает абсолютные пути: probe разрешает `--file` относительно CWD процесса (tokio::fs::read в handoff/probe/src/main.rs), которым после `cd handoff/probe` становится `handoff/probe`, поэтому `--file /tmp/a.wav` превратится в `..//tmp/a.wav` и разрешится в `<repo-root>/tmp/a.wav`. Аналогично, относительный путь при запуске скрипта не из корня репо молча интерпретируется относительно корня репо, а не CWD вызывающего, и сообщение `failed to read ../../..//...` вводит в заблуждение. Стоит пропускать абсолютные пути без префикса и упомянуть в комментарии, что относительные пути отсчитываются от корня репо.

**Existing:**

```
url="${1:?usage: phone_probe.sh <pairing-url> [file]}"
file="${2:?usage: phone_probe.sh <pairing-url> [file]}"
exec cargo run --quiet -- --pair --url "$url" --file "../../$file"
```

**Suggestion:**

```
# Relative paths are resolved against the repo root (the probe's cwd is handoff/probe).
url="${1:?usage: phone_probe.sh <pairing-url> [file]}"
file="${2:?usage: phone_probe.sh <pairing-url> [file]}"
case "$file" in /*) ;; *) file="../../$file" ;; esac
exec cargo run --quiet -- --pair --url "$url" --file "$file"
```

### [low/maintainability] scripts/phone_probe.sh:4-5

Все четыре новых скрипта (phone_probe.sh, phone_pwa.sh, phone_tunnel.sh, phone_wasm.sh) закоммичены с режимом 100644 (неисполняемые), при этом комментарии использования внутри скриптов предполагают прямой запуск `scripts/phone_probe.sh <pairing-url> [file]`, который завершится «Permission denied». Taskfile и CI обходят это через `bash scripts/...`, так что либо стоит сделать файлы исполняемыми (chmod +x), либо согласовать комментарии с фактическим способом вызова (`task phone:probe -- ...`).

**Existing:**

```
#     scripts/phone_probe.sh <pairing-url> [file]      # send an audio file
#     scripts/phone_probe.sh --capabilities <pairing-url>
```

**Suggestion:**

```
#     bash scripts/phone_probe.sh <pairing-url> [file]      # send an audio file
#     bash scripts/phone_probe.sh --capabilities <pairing-url>
#     # or: task phone:probe -- <pairing-url> <file>
```

### [low/documentation] scripts/phone_probe.sh:16-17

Нотация `[file]` в заголовочном комментарии и в сообщениях `:?` помечает аргумент файла как необязательный, но `file="${2:?...}"` жёстко требует его наличия — контракт использования и поведение расходятся. Стоит либо убрать квадратные скобки (`<pairing-url> <file>`), либо действительно сделать файл опциональным (`file="${2:-}"` + условная передача `--file`), тем более что CLI пробы сам даёт понятную ошибку при отсутствии `--file`.

**Existing:**

```
url="${1:?usage: phone_probe.sh <pairing-url> [file]}"
file="${2:?usage: phone_probe.sh <pairing-url> [file]}"
```

**Suggestion:**

```
url="${1:?usage: phone_probe.sh <pairing-url> <file>}"
file="${2:?usage: phone_probe.sh <pairing-url> <file>}"
```

### [medium/bug] scripts/dev_build.py:78-82

Счётчик `delimiters` продолжает расти после второго `---`, поэтому любой дефис-разделитель `---` внутри тела записи (markdown thematic break или подчёркивание setext-заголовка — обычное в changelog) увеличивает его до 3, и все последующие строки молча выпадают из тела dev-релиза. Замысел (и докстринг «Drops everything through the second `---` delimiter») — убрать только frontmatter, а не обрезать тело на первом встреченном разделителе. Стоит после второго делимитера перестать считать и брать остаток целиком.

**Existing:**

```
    for record in records:
        if delimiters == 2:
            body.append(record + b"\n")
        if record == b"---":
            delimiters += 1
```

**Suggestion:**

```
    for record in records:
        if delimiters < 2:
            if record == b"---":
                delimiters += 1
            continue
        body.append(record + b"\n")
```

### [medium/bug] scripts/local_windows_build.sh:116-116

Путь поиска инсталлятора не совпадает с фактическим расположением артефактов сборки. desktop/src-tauri — член корневого workspace (корневой Cargo.toml: members = ["crates/meeting-detect", "desktop/src-tauri"]), поэтому cargo (и tauri CLI через cargo metadata) кладёт бандлы в target/ корня workspace, а не в desktop/src-tauri/target/. Это подтверждают docs/tutorials/build-and-run.md:57 («The bundle lands under `target/release/bundle/`»), путь в scripts/upgrade_app.sh и маппинг `workspaces: . -> target` в rust-cache dev-build.yml. Чекаут на Windows-стороне синхронизируется вместе с корневым Cargo.toml, так что layout тот же — find ничего не найдёт, `2>/dev/null ... || true` замаскирует это, и успешная сборка не напечатает путь к инсталлятору (заявленная цель шага).

**Existing:**

```
find "$checkout/desktop/src-tauri/target/release/bundle/nsis" -name '*.exe' -maxdepth 1 -print 2>/dev/null | sed 's|^|    |' || true
```

**Suggestion:**

```
find "$checkout/target/release/bundle/nsis" -name '*.exe' -maxdepth 1 -print 2>/dev/null | sed 's|^|    |' || true
```

### [high/bug] scripts/server_build.sh:21-25

Аргумент triple используется только для имени итогового файла, но не передаётся в cargo как --target. Если передать кросс-триплет (например, `task server:build -- x86_64-apple-darwin` с Apple Silicon), соберётся бинарник хост-платформы, который будет молча переименован в vibe-server-<triple>. Tauri подберёт его по суффиксу имени в externalBin (tauri.conf.json:39), сборка приложения пройдёт, а собранный сайдкар не запустится на целевой платформе. CI-эквивалент scripts/ci/build-server.sh делает это правильно: `cargo build -p vibe-server --release --target "$triple"` с копированием из `target/$triple/release/`.

**Existing:**

```
cargo build --manifest-path server/Cargo.toml -p vibe-server --release

bin="$ROOT/desktop/src-tauri/binaries"
mkdir -p "$bin"
cp "server/target/release/vibe-server$exe" "$bin/vibe-server-$triple$exe"
```

**Suggestion:**

```
cargo build --manifest-path server/Cargo.toml -p vibe-server --release --target "$triple"

bin="$ROOT/desktop/src-tauri/binaries"
mkdir -p "$bin"
cp "server/target/$triple/release/vibe-server$exe" "$bin/vibe-server-$triple$exe"
```

### [medium/bug] scripts/setup_sidecars.sh:51-55

Неполный набор сайдкаров для Linux: `tauri.conf.json` перечисляет в `externalBin` не только `binaries/vibe-server`, но и `binaries/vibe-diarize-native`, и по собственным артефактам проекта десктоп-крейт отказывается компилироваться без `vibe-diarize-native-<triple>` (scripts/ci/desktop-check.sh создаёт заглушки для обоих сайдкаров ради `cargo check`; комментарий у задачи rust:clippy: «tauri.conf names both sidecars in externalBin, so the crate refuses to compile until the diarization helper is staged as well»). На Linux этот скрипт кладёт только vibe-server и объявляет директорию «уже на месте» — то есть допускает ровно тот «half-populated directory», против которого направлен комментарий выше. В результате на свежем чекауте `task dev` / `task app:build` (setup → tauri dev/build; хелпер нигде больше в dev-цикле не собирается — только в CI и в local_windows_build.sh) падают на сборке с недостающим сайдкаром. На macOS проблема скрыта overlay-конфигом (externalBin без diarize). Предложение: включить `vibe-diarize-native-$triple` в проверку «уже на месте» и либо собирать его здесь (TRIPLE=... bash scripts/ci/diarize-helper.sh после ci:ggml-libs), либо явно предупреждать, что нужно запустить `task ci:diarize-helper`.

**Existing:**

```
if $is_linux; then
    if [ -f "$bin/vibe-server-$triple" ]; then
        echo "sidecars for $triple are already in place"
        exit 0
    fi
```

**Suggestion:**

```
if $is_linux; then
    if [ -f "$bin/vibe-server-$triple" ] && [ -f "$bin/vibe-diarize-native-$triple" ]; then
        echo "sidecars for $triple are already in place"
        exit 0
    fi
```

### [low/bug] scripts/upgrade_app.sh:17-18

`osascript -e 'quit app "vibe"` доставляет AppleEvent и возвращается немедленно, не дожидаясь завершения процесса. rm -rf /Applications/vibe.app и open выполнятся, пока приложение ещё дописывает своё состояние (window-state, конфиги) и держит бандл; worse — при живом старом экземпляре single-instance-плагин может перехватить relaunch и forwards его в удаляемый процесс, и пользователь не увидит нового окна. Стоит дождаться фактического завершения процесса перед удалением.

**Existing:**

```
osascript -e 'quit app "vibe"' 2>/dev/null || true
rm -rf /Applications/vibe.app
```

**Suggestion:**

```
osascript -e 'quit app "vibe"' 2>/dev/null || true
for _ in $(seq 1 50); do
    pgrep -x vibe >/dev/null 2>&1 || break
    sleep 0.2
done
rm -rf /Applications/vibe.app
```

### [high/bug] scripts/upgrade_app.sh:14-15

Сборка падает без сайдкара vibe-diarize-native: в tauri.conf.json externalBin перечислены оба — `binaries/vibe-server` и `binaries/vibe-diarize-native`, и build script Tauri требует их наличия с суффиксом триплета (см. desktop-check.sh, который для `cargo check` создаёт оба плейсхолдера). Но setup_sidecars.sh ставит только vibe-server (+ffmpeg), а vibe-diarize-native-<triple> в этом скрипте никто не собирает — в отличие от CI (dev-build.yml: ci:ggml-libs → ci:diarize-helper перед tauri build) и local_windows_build.sh, где эти шаги есть. На чистом чекауте `tauri build` упадёт, а на «грязном» — молча соберёт приложение с устаревшим diarize-хелпером.

**Existing:**

```
bash scripts/setup_sidecars.sh
pnpm --dir desktop exec tauri build --bundles app --config '{"bundle":{"createUpdaterArtifacts":false}}'
```

**Suggestion:**

```
bash scripts/setup_sidecars.sh
TRIPLE="$(rustc -vV | sed -n 's/^host: //p')" bash scripts/ci/ggml-libs.sh
bash scripts/ci/diarize-helper.sh
pnpm --dir desktop exec tauri build --bundles app --config '{"bundle":{"createUpdaterArtifacts":false}}'
```
