<!-- source: 82b1f22a4618 -->

# Wiersz poleceń

Plik wykonywalny `vibe` to aplikacja desktopowa. Gdy otrzyma dowolny argument poza `--hidden`, przekazuje argumenty do dołączonego `vibe-server` i wypisuje dane wyjściowe tego procesu, więc CLI i okno korzystają z tego samego silnika i tych samych modeli.

Plik binarny serwera to `vibe-server`; kopia robocza dla programistów może wywoływać go bezpośrednio. `--help` w obu punktach wejścia wypisuje bieżące flagi.

## Podpolecenia

| Polecenie | Przeznaczenie |
| --- | --- |
| `transcribe <model> <audio>` | Transkrybuj jeden plik i wypisz lub zapisz wynik |
| `serve [model]` | Uruchom lokalny serwer HTTP z dokumentacją Swagger |
| `pull <url>` | Pobierz model lub inny plik |
| `devices` | Wypisz urządzenia GPU jako JSON |

## Opcje transkrypcji

| Opcja | Efekt |
| --- | --- |
| `--format <txt\|markdown\|md\|json\|srt\|vtt>` | Format wyjścia; domyślnie `txt` |
| `--output <path>` | Zapisz do nowego pliku; odmawia nadpisania |
| `-l`, `--language <code>` | Kod języka |
| `--detect-language` | Wykryj język |
| `--translate` | Przetłumacz na angielski, jeśli model to obsługuje |
| `--vad-model <path>` | Model Silero VAD, wymagany przez niektóre rodziny dla długiego dźwięku |
| `--diarize-model <path>` | Model rozpoznawania mówców |
| `--prompt <text>` | Początkowy monit dla modeli, które go używają |
| `--word-timestamps` | Emituj znaczniki czasu słów, jeśli są obsługiwane |
| `--threads <n>` | Wątki CPU |
| `--gpu-device <n>` | Indeks urządzenia GPU, liczony od 1; `0` lub wartość ujemna oznacza automatyczny wybór |
| `--cache-dir <dir>` | Zachowaj ukończone fragmenty, aby przerwane uruchomienie mogło zostać wznowione |
| `--chunk-seconds <n>` | Planowana długość fragmentu, ograniczona oknem modelu |

`--enhance-audio`, `--temperature`, `--max-text-ctx`, `--max-segment-len`, `--best-of` i `--beam-size` dostrajają silnik; uruchom `--help`, aby poznać ich wartości domyślne.

## Opcje serwera

| Opcja | Efekt |
| --- | --- |
| `--host <ip>` | Adres wiązania; domyślnie `127.0.0.1` |
| `-p`, `--port <port>` | Port; `0` wybiera wolny |
| `--exit-with-parent` | Zatrzymaj razem z procesem nadrzędnym |
| `--unload-timeout <value>` | Zwolnij bezczynny model |
| `--cache-dir <dir>` | Katalog pamięci podręcznej fragmentów |

**Ustawienia → Agenci** uruchamiają ten sam serwer z aplikacji i linkują do jego dokumentacji Swagger.

## Przykłady

```console
vibe transcribe model.gguf recording.wav --format srt --output recording.srt
vibe transcribe model.gguf recording.wav --language ru --vad-model ggml-silero-v6.2.0.bin
vibe devices
vibe serve --port 0
```

## Powiązane strony

- [Modele](/vibe/docs#models) dla wyboru modeli i limitów poszczególnych rodzin.
- [Obsługiwane formaty](/vibe/docs#formats) dla rozszerzeń wejściowych i formatów eksportu.
