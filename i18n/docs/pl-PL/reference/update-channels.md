<!-- source: 63b7a2f2736b -->

# Kanały aktualizacji

Aplikacja aktualizuje się z jednego z trzech plików kanałów w witrynie, a nie z najnowszego wydania GitHuba:

| Kanał | Plik |
| --- | --- |
| Wydanie | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

Każdy plik to `latest.json` wygenerowany przez kompilację wydania. Kanał bez pliku to linia, na której nic nie ma: aplikacja zgłasza „Aktualne”, zamiast przechodzić do innego kanału lub traktować brakujący plik jako nieudane sprawdzenie.

## Linie i wersje

| Kanał | Tag | Gałąź | Wersja | Co to jest |
| --- | --- | --- | --- | --- |
| Wydanie | `vX.Y.Z` | `main` | `X.Y.Z` | Stabilna linia |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Kandydat do następnej stabilnej wersji, publikowany jako prerelease GitHuba |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | Ruchoma kompilacja `dev` |

`beta.json` jest nieobecny, dopóki nie zostanie opublikowany żaden kandydat. Zwykłe wydanie jest odrzucane na kanale beta; akceptowane jest tam tylko `X.Y.Z-rc.<n>`.

## Skąd pochodzą manifesty

- **Wydanie i beta**: aktualizator Tauri z kompilacji wydania tworzy `latest.json`. `scripts/channel.py <version> --channel <stable|beta>` pobiera go z `https://github.com/kisev/vibe/releases/download/v<version>/latest.json`, waliduje wersję i zapisuje `website/public/updater/<channel>.json`. Zatwierdź plik w `main`; wdrożenie witryny go publikuje.
- **Dev**: `.github/workflows/dev-build.yml` publikuje prerelease z artefaktami aktualizatora i `latest.json`. `scripts/dev_manifest.py` odczytuje najnowsze kompletne wydanie dev i zapisuje `website/public/updater/dev.json`; nowa kompilacja dev wyzwala wdrożenie witryny. Jeśli najnowsze wydanie jest niekompletne lub wywołanie API się nie powiedzie, poprzedni `dev.json` pozostaje.

`channel.py` odmawia cofania kanału i rozumie kolejność `-rc.<n>`.

## W aplikacji

- **Ustawienia → Ogólne → Aktualizacje** zawiera selektor kanału, bieżącą wersję, **Sprawdź aktualizacje**, czas ostatniego sprawdzenia i wynik.
- Wybór w czasie działania znajduje się w `desktop/src-tauri/src/updater.rs`; strona webview to `desktop/src/providers/updater.tsx`.
- `desktop/src-tauri/src/updater.rs` odpytuje bezpośrednio `updater/<channel>.json`. `404` lub `410` oznacza, że kanał nigdy nie został opublikowany; każdy inny błąd to prawdziwy błąd.
- Statyczny punkt końcowy wtyczki Tauri w `tauri.conf.json` to wariant awaryjny, o którym wie sama wtyczka; wybór kanału następuje w kodzie aplikacji.

## Granice

- Aktualizator porusza się tylko do przodu. Złą kompilację naprawia się, dostarczając nowszą.
- Instalacja wydania lub beta, która wybierze Dev, widzi „Aktualne”: każda kompilacja dev sortuje się poniżej wersji, która jest już uruchomiona. Przejście na linię dev wymaga jednej ręcznej instalacji kompilacji dev; potem kanał Dev aktualizuje ją do przodu.
- Instalacja Beta przechodzi do finalnego wydania przez przełączenie na Wydanie, gdzie `X.Y.Z` sortuje się powyżej swoich wersji kandydujących.
- Aplikacje zbudowane przed wprowadzeniem plików kanałów (linia 3.x upstream) nadal odczytują to wydanie GitHuba, które jest oznaczone jako „latest”. Tym, co do nich trafia, jest `gh release edit --latest`, uruchamiane na końcu.

Procedury opisano w [Publikowaniu wydania](../how-to/publish-a-release.md) i [Tworzeniu kompilacji dev](../how-to/cut-a-dev-build.md), a [wyjaśnienie](../explanation/update-channels.md) mówi, dlaczego linie i sufiksy mają taki kształt.
