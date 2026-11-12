<!-- source: 03e5a04c40fd -->

# Zainstaluj Vibe

Ten samouczek prowadzi nową maszynę od pobrania do działającego okna Vibe. Zakłada komputer stacjonarny z połączeniem internetowym i bez istniejącej instalacji. [Transkrypcja pierwszego nagrania](/vibe/docs#first-transcription) to następny krok.

## Pobierz instalator

Otwórz [stronę pobierania](https://kisev.github.io/vibe/) i wybierz kompilację dla tej maszyny:

| Platforma | Kompilacja |
| --- | --- |
| Windows | instalator `.exe` |
| macOS, Apple silicon | `aarch64.dmg` |
| macOS, Intel | `x64.dmg` |
| Linux | `.deb` lub `.rpm`, x86-64 lub arm64 |

Te same pliki są dołączone do każdego [wydania GitHub](https://github.com/kisev/vibe/releases). Pakiet `.deb` dla Linuksa deklaruje swoje zależności uruchomieniowe, w tym `ffmpeg`.

## Zainstaluj i otwórz

1. Uruchom instalator i postępuj zgodnie z jego wskazówkami.
1. Otwórz Vibe z menu aplikacji lub uruchom `vibe` w terminalu.

Kompilacje wydania są niepodpisane. W macOS pierwsze uruchomienie wymaga kliknięcia prawym przyciskiem → **Otwórz** w Finderze, aby przejść przez Gatekeeper; kolejne uruchomienia otwierają się normalnie. Windows SmartScreen może wyświetlić ostrzeżenie z tego samego powodu.

## Zakończ konfigurację

Przy pierwszym uruchomieniu Vibe proponuje domyślny model. Zaakceptuj pobieranie i poczekaj na jego zakończenie. Model jest przechowywany lokalnie i używany przy każdym kolejnym uruchomieniu; [Modele](/vibe/docs#models) zawierają listę alternatyw.

Okno jest gotowe, gdy widoczne są obszar upuszczania oraz akcje **Nagraj** i **Z linku**.

## Dalsze kroki

- [Transkrypcja pierwszego nagrania](/vibe/docs#first-transcription) korzysta z tej instalacji.
- [Obsługiwane formaty](/vibe/docs#formats) zawierają listę tego, co Vibe potrafi otworzyć i wyeksportować.
- [Rozwiązywanie problemów z awarią](https://github.com/kisev/vibe/blob/main/docs/how-to/troubleshoot-a-crash.md) obejmuje logi i diagnostykę, jeśli okno się nie otwiera.
