<!-- source: 82b1f22a4618 -->

# Příkazový řádek

Spustitelný soubor `vibe` je desktopová aplikace. Když obdrží jakýkoli argument kromě `--hidden`, předá argumenty přibalenému `vibe-server` a vypíše výstup tohoto procesu, takže CLI i okno používají stejné jádro a modely.

Serverová binárka je `vibe-server`; vývojový checkout ji může volat přímo. `--help` u obou vstupních bodů vypíše aktuální přepínače.

## Podpříkazy

| Příkaz | Účel |
| --- | --- |
| `transcribe <model> <audio>` | Přepíše jeden soubor a vypíše nebo zapíše výsledek |
| `serve [model]` | Spustí lokální HTTP server s dokumentací Swagger |
| `pull <url>` | Stáhne model nebo jiný soubor |
| `devices` | Vypíše zařízení GPU jako JSON |

## Přepínače příkazu transcribe

| Přepínač | Účinek |
| --- | --- |
| `--format <txt\|markdown\|md\|json\|srt\|vtt>` | Formát výstupu; výchozí `txt` |
| `--output <path>` | Zápis do nového souboru; odmítá přepsat |
| `-l`, `--language <code>` | Kód jazyka |
| `--detect-language` | Rozpozná jazyk |
| `--translate` | Přeloží do angličtiny tam, kde to model podporuje |
| `--vad-model <path>` | Model Silero VAD; některé rodiny jej vyžadují pro dlouhý zvuk |
| `--diarize-model <path>` | Model diarizace mluvčích |
| `--prompt <text>` | Počáteční zadání (prompt) pro modely, které jej používají |
| `--word-timestamps` | Vypisuje časové značky slov tam, kde jsou podporované |
| `--threads <n>` | Vlákna CPU |
| `--gpu-device <n>` | Index zařízení GPU, počínaje 1; `0` nebo záporné číslo znamená automaticky |
| `--cache-dir <dir>` | Uchová dokončené úseky, aby přerušené spuštění pokračovalo |
| `--chunk-seconds <n>` | Plánovaná délka úseku, omezená oknem modelu |

`--enhance-audio`, `--temperature`, `--max-text-ctx`, `--max-segment-len`, `--best-of` a `--beam-size` ladí jádro; jejich výchozí hodnoty vypíše `--help`.

## Přepínače příkazu serve

| Přepínač | Účinek |
| --- | --- |
| `--host <ip>` | Adresa pro navázání; výchozí `127.0.0.1` |
| `-p`, `--port <port>` | Port; `0` zvolí volný |
| `--exit-with-parent` | Zastaví se s nadřazeným procesem |
| `--unload-timeout <value>` | Uvolní nečinný model |
| `--cache-dir <dir>` | Adresář mezipaměti úseků |

**Nastavení → Agenti** spouští stejný server z aplikace a odkazuje na jeho dokumentaci Swagger.

## Příklady

```console
vibe transcribe model.gguf recording.wav --format srt --output recording.srt
vibe transcribe model.gguf recording.wav --language ru --vad-model ggml-silero-v6.2.0.bin
vibe devices
vibe serve --port 0
```

## Související stránky

- [Modely](/vibe/docs#models) pro volbu modelů a limity jednotlivých rodin.
- [Podporované formáty](/vibe/docs#formats) pro vstupní přípony a formáty exportu.
