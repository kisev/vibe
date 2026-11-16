<!-- source: e0f14454bcc5 -->

# Obsługiwane formaty

Vibe akceptuje pliki audio i wideo oraz eksportuje transkrypcje w kilku formatach tekstowych. Aplikacja desktopowa normalizuje multimedia za pomocą ffmpeg przed transkrypcją; w Linux wymagany jest systemowy `ffmpeg`, natomiast pakiety dla macOS i Windows zawierają własny.

## Wejście

| Rodzaj | Rozszerzenia |
| --- | --- |
| Audio | `mp3`, `wav`, `aac`, `flac`, `oga`, `ogg`, `opus`, `m4a`, `m4b`, `wma` |
| Wideo | `mp4`, `mkv`, `avi`, `mov`, `wmv`, `webm`, `mxf` |

Kontener spoza tej listy może nadal działać, jeśli ffmpeg potrafi go zdekodować; najpierw go przekonwertuj, jeśli aplikacja go odrzuci.

## Eksport z aplikacji desktopowej

Otwórz okno eksportu w transkrypcji i wybierz jeden z tych formatów:

| Format | Zawartość |
| --- | --- |
| TXT | Zwykły tekst bez formatowania |
| Markdown | Nagłówki i sformatowany tekst |
| SRT | Numerowane napisy ze znacznikami czasu |
| VTT | Napisy WebVTT ze znacznikami czasu |
| HTML | Stylizowana strona internetowa |
| JSON | Ustrukturyzowane dane transkrypcji i czasu |
| CSV | Wiersze gotowe do arkusza kalkulacyjnego |
| DOCX | Sformatowany dokument Word |
| PDF | Dokument gotowy do druku |

Opcje eksportu przełączają też znaczniki czasu i etykiety mówców tam, gdzie format je obsługuje. Automatyczny eksport może zapisać każdy z tych formatów obok nagrania, do folderu projektów lub do wybranego folderu.

## Wynik CLI

`vibe-server transcribe` zapisuje `txt` (domyślnie), `markdown` (alias `md`), `json`, `srt` lub `vtt`. `--output` zapisuje nowy plik i odmawia nadpisania istniejącej ścieżki. Zobacz [Wiersz poleceń](/vibe/docs#cli).

## Powiązane strony

- [Modele](/vibe/docs#models) dla rodzin modeli i ich ograniczeń.
- [Transkrypcja pierwszego nagrania](/vibe/docs#first-transcription) dla przepływu w aplikacji desktopowej.
