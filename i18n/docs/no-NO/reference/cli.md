<!-- source: 82b1f22a4618 -->

# Kommandolinje

Den kjørbare filen `vibe` er skrivebordsappen. Når den mottar et argument annet enn `--hidden`, videresender den argumentene til den innebygde `vibe-server` og skriver ut prosessens utdata, slik at CLI-en og vinduet bruker samme motor og modeller.

Serverbinæren er `vibe-server`; en utviklingskopi kan kalle den direkte. `--help` på hvilket som helst inngangspunkt skriver ut de gjeldende flaggene.

## Underkommandoer

| Kommando | Formål |
| --- | --- |
| `transcribe <model> <audio>` | Transkriber én fil og skriv ut eller lagre resultatet |
| `serve [model]` | Start den lokale HTTP-serveren, med Swagger-dokumentasjon |
| `pull <url>` | Last ned en modell eller annen fil |
| `devices` | List opp GPU-enheter som JSON |

## Transkriberingsalternativer

| Alternativ | Effekt |
| --- | --- |
| `--format <txt\|markdown\|md\|json\|srt\|vtt>` | Utdataformat; standard `txt` |
| `--output <path>` | Skriv til en ny fil; nekter å overskrive |
| `-l`, `--language <code>` | Språkkode |
| `--detect-language` | Gjenkjenn språket |
| `--translate` | Oversett til engelsk der modellen støtter det |
| `--vad-model <path>` | Silero VAD-modell, påkrevd av noen familier for lang lyd |
| `--diarize-model <path>` | Modell for talergjenkjenning |
| `--prompt <text>` | Startprompt, for modeller som bruker en |
| `--word-timestamps` | Skriv ut ordnivå-tidsstempler der det støttes |
| `--threads <n>` | CPU-tråder |
| `--gpu-device <n>` | GPU-enhetsindeks, 1-basert; `0` eller negativ betyr automatisk |
| `--cache-dir <dir>` | Behold ferdige fragmenter så en avbrutt kjøring fortsetter |
| `--chunk-seconds <n>` | Planlagt fragmentlengde, begrenset av modellvinduet |

`--enhance-audio`, `--temperature`, `--max-text-ctx`, `--max-segment-len`, `--best-of` og `--beam-size` justerer motoren; kjør `--help` for standardverdiene deres.

## Serve-alternativer

| Alternativ | Effekt |
| --- | --- |
| `--host <ip>` | Bindeadresse; standard `127.0.0.1` |
| `-p`, `--port <port>` | Port; `0` velger en ledig |
| `--exit-with-parent` | Stopp med overordnet prosess |
| `--unload-timeout <value>` | Frigjør en inaktiv modell |
| `--cache-dir <dir>` | Mappe for fragmentcache |

**Innstillinger → Agenter** starter samme server fra appen og lenker til Swagger-dokumentasjonen.

## Eksempler

```console
vibe transcribe model.gguf recording.wav --format srt --output recording.srt
vibe transcribe model.gguf recording.wav --language ru --vad-model ggml-silero-v6.2.0.bin
vibe devices
vibe serve --port 0
```

## Relaterte sider

- [Modeller](/vibe/docs#models) for modellvalg og grenser per familie.
- [Støttede formater](/vibe/docs#formats) for inndataendelser og eksportformater.
