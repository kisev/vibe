<!-- source: 82b1f22a4618 -->

# Befehlszeile

Die ausführbare Datei `vibe` ist die Desktop-App. Erhält sie ein beliebiges Argument außer `--hidden`, reicht sie die Argumente an das mitgelieferte `vibe-server` weiter und gibt dessen Ausgabe aus, sodass CLI und Fenster dieselbe Engine und dieselben Modelle nutzen.

Die Server-Binärdatei ist `vibe-server`; ein Entwicklungs-Checkout kann sie direkt aufrufen. `--help` an beiden Einstiegspunkten gibt die aktuellen Flags aus.

## Unterbefehle

| Befehl | Zweck |
| --- | --- |
| `transcribe <model> <audio>` | Transkribiert eine Datei und gibt das Ergebnis aus oder schreibt es |
| `serve [model]` | Startet den lokalen HTTP-Server mit Swagger-Dokumentation |
| `pull <url>` | Lädt ein Modell oder eine andere Datei herunter |
| `devices` | Listet GPU-Geräte als JSON auf |

## Optionen für transcribe

| Option | Wirkung |
| --- | --- |
| `--format <txt\|markdown\|md\|json\|srt\|vtt>` | Ausgabeformat; Standard `txt` |
| `--output <path>` | In eine neue Datei schreiben; verweigert das Überschreiben |
| `-l`, `--language <code>` | Sprachcode |
| `--detect-language` | Die Sprache erkennen |
| `--translate` | Ins Englische übersetzen, wo das Modell es unterstützt |
| `--vad-model <path>` | Silero-VAD-Modell, von manchen Familien für langes Audio benötigt |
| `--diarize-model <path>` | Modell für die Sprecherdiarisierung |
| `--prompt <text>` | Anfänglicher Prompt für Modelle, die einen nutzen |
| `--word-timestamps` | Wortgenaue Zeitstempel ausgeben, wo unterstützt |
| `--threads <n>` | CPU-Threads |
| `--gpu-device <n>` | GPU-Geräteindex, 1-basiert; `0` oder negativ bedeutet automatisch |
| `--cache-dir <dir>` | Fertige Chunks behalten, damit ein unterbrochener Lauf fortsetzt |
| `--chunk-seconds <n>` | Geplante Chunk-Länge, begrenzt durch das Modellfenster |

`--enhance-audio`, `--temperature`, `--max-text-ctx`, `--max-segment-len`, `--best-of` und `--beam-size` stimmen die Engine ab; führen Sie `--help` für ihre Standardwerte aus.

## Optionen für serve

| Option | Wirkung |
| --- | --- |
| `--host <ip>` | Bindeadresse; Standard `127.0.0.1` |
| `-p`, `--port <port>` | Port; `0` wählt einen freien |
| `--exit-with-parent` | Mit dem übergeordneten Prozess stoppen |
| `--unload-timeout <value>` | Ein untätiges Modell entladen |
| `--cache-dir <dir>` | Verzeichnis für den Chunk-Cache |

**Einstellungen → Agenten** startet denselben Server aus der App und verlinkt auf seine Swagger-Dokumentation.

## Beispiele

```console
vibe transcribe model.gguf recording.wav --format srt --output recording.srt
vibe transcribe model.gguf recording.wav --language ru --vad-model ggml-silero-v6.2.0.bin
vibe devices
vibe serve --port 0
```

## Verwandte Seiten

- [Modelle](/vibe/docs#models) für die Modellwahl und die Grenzen pro Familie.
- [Unterstützte Formate](/vibe/docs#formats) für Eingabeerweiterungen und Exportformate.
