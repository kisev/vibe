<!-- source: 18fa449ab772 -->

# Kanały aktualizacji

Aplikacja aktualizuje się z jednego z trzech plików kanałów w witrynie, a nie z „najnowszego wydania” GitHuba:

| Kanał | Plik |
| --- | --- |
| Wydanie | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

Każdy plik to `latest.json` wygenerowany przez kompilację wydania. Brakujący plik oznacza, że linia nie ma nic do zaoferowania: aplikacja zgłasza „Aktualne”, zamiast przechodzić do innego kanału.

## Linie i wersje

| Kanał | Tag | Gałąź | Wersja | Co to jest |
| --- | --- | --- | --- | --- |
| Wydanie | `vX.Y.Z` | `main` | `X.Y.Z` | Stabilna linia |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Kandydat do następnej stabilnej wersji, publikowany jako prerelease |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | Ruchoma kompilacja `dev` |

Zwykłe wydanie jest odrzucane na kanale beta; akceptowane jest tam tylko `X.Y.Z-rc.<n>`. Kanał bez kandydata jest nieobecny, a nie pusty.

## W aplikacji

- **Ustawienia → Ogólne → Aktualizacje** zawiera selektor kanału, bieżącą wersję, **Sprawdź aktualizacje**, czas ostatniego sprawdzenia i wynik.
- Aplikacja sama odpytuje `updater/<channel>.json`. `404` lub `410` oznacza, że kanał nigdy nie został opublikowany; każdy inny błąd to prawdziwy błąd.
- Sprawdzanie uruchamia się przy starcie i po przełączeniu kanału.

## Granice

- Aktualizator porusza się tylko do przodu. Złą kompilację naprawia się, dostarczając nowszą.
- Instalacja Wydania lub Beta, która wybierze Dev, widzi „Aktualne”: każda kompilacja dev sortuje się poniżej wersji, która jest już uruchomiona. Przejście na linię dev wymaga jednej ręcznej instalacji kompilacji dev; potem kanał Dev aktualizuje ją do przodu.
- Instalacja Beta przechodzi do finalnego wydania przez przełączenie na Wydanie, gdzie `X.Y.Z` sortuje się powyżej swoich wersji kandydujących.

## Powiązane strony

- [Przełączanie kanałów aktualizacji](/vibe/docs#switch-update-channels) dla kroków.
- [Dlaczego kanały aktualizacji działają w ten sposób](/vibe/docs#update-channels-design) dla projektu.
