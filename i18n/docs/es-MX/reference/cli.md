<!-- source: 82b1f22a4618 -->

# Línea de comandos

El ejecutable `vibe` es la aplicación de escritorio. Cuando recibe cualquier argumento excepto `--hidden`, reenvía los argumentos al `vibe-server` incluido e imprime la salida de ese proceso, así que la CLI y la ventana usan el mismo motor y los mismos modelos.

El binario del servidor es `vibe-server`; un checkout de desarrollo puede llamarlo directamente. `--help` en cualquiera de los dos puntos de entrada imprime las opciones actuales.

## Subcomandos

| Comando | Propósito |
| --- | --- |
| `transcribe <model> <audio>` | Transcribe un archivo e imprime o escribe el resultado |
| `serve [model]` | Inicia el servidor HTTP local, con documentación de Swagger |
| `pull <url>` | Descarga un modelo u otro archivo |
| `devices` | Enumera los dispositivos GPU como JSON |

## Opciones de transcripción

| Opción | Efecto |
| --- | --- |
| `--format <txt\|markdown\|md\|json\|srt\|vtt>` | Formato de salida; predeterminado `txt` |
| `--output <path>` | Escribe en un archivo nuevo; se niega a sobrescribir |
| `-l`, `--language <code>` | Código de idioma |
| `--detect-language` | Detecta el idioma |
| `--translate` | Traduce al inglés donde el modelo lo admite |
| `--vad-model <path>` | Modelo VAD de Silero, requerido por algunas familias para audio largo |
| `--diarize-model <path>` | Modelo de diarización de hablantes |
| `--prompt <text>` | Prompt inicial, para los modelos que usan uno |
| `--word-timestamps` | Emite marcas de tiempo a nivel de palabra donde se admita |
| `--threads <n>` | Hilos de CPU |
| `--gpu-device <n>` | Índice del dispositivo GPU, basado en 1; `0` o negativo significa automático |
| `--cache-dir <dir>` | Conserva los fragmentos terminados para que una ejecución interrumpida se reanude |
| `--chunk-seconds <n>` | Longitud planificada del fragmento, limitada por la ventana del modelo |

`--enhance-audio`, `--temperature`, `--max-text-ctx`, `--max-segment-len`, `--best-of` y `--beam-size` ajustan el motor; ejecuta `--help` para ver sus valores predeterminados.

## Opciones de serve

| Opción | Efecto |
| --- | --- |
| `--host <ip>` | Dirección de enlace; predeterminada `127.0.0.1` |
| `-p`, `--port <port>` | Puerto; `0` elige uno libre |
| `--exit-with-parent` | Se detiene junto con el proceso padre |
| `--unload-timeout <value>` | Descarga un modelo inactivo |
| `--cache-dir <dir>` | Directorio de caché de fragmentos |

**Configuración → Agentes** inicia el mismo servidor desde la aplicación y enlaza a su documentación de Swagger.

## Ejemplos

```console
vibe transcribe model.gguf recording.wav --format srt --output recording.srt
vibe transcribe model.gguf recording.wav --language ru --vad-model ggml-silero-v6.2.0.bin
vibe devices
vibe serve --port 0
```

## Páginas relacionadas

- [Modelos](/vibe/docs#models) para las opciones de modelos y los límites por familia.
- [Formatos compatibles](/vibe/docs#formats) para las extensiones de entrada y los formatos de exportación.
