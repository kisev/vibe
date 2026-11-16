<!-- source: e0f14454bcc5 -->

# Formatos compatibles

Vibe acepta archivos de audio y video y exporta transcripciones en varios formatos de texto. La aplicación de escritorio normaliza el contenido multimedia con ffmpeg antes de la transcripción; en Linux se requiere el `ffmpeg` del sistema, mientras que las compilaciones de macOS y Windows incluyen el suyo.

## Entrada

| Tipo | Extensiones |
| --- | --- |
| Audio | `mp3`, `wav`, `aac`, `flac`, `oga`, `ogg`, `opus`, `m4a`, `m4b`, `wma` |
| Video | `mp4`, `mkv`, `avi`, `mov`, `wmv`, `webm`, `mxf` |

Un contenedor fuera de esta lista puede funcionar igualmente si ffmpeg puede decodificarlo; conviértelo primero si la aplicación lo rechaza.

## Exportación de escritorio

Abre el diálogo de exportación en una transcripción y elige uno de estos:

| Formato | Contenido |
| --- | --- |
| TXT | Texto sin formato |
| Markdown | Encabezados y texto con formato |
| SRT | Subtítulos numerados con marcas de tiempo |
| VTT | Subtítulos WebVTT con marcas de tiempo |
| HTML | Una página web con estilo |
| JSON | Datos estructurados de transcripción y tiempos |
| CSV | Filas listas para una hoja de cálculo |
| DOCX | Un documento de Word con formato |
| PDF | Un documento listo para imprimir |

Las opciones de exportación también permiten activar o desactivar las marcas de tiempo y las etiquetas de hablante donde el formato lo admite. La exportación automática puede escribir cualquiera de estos formatos junto a la grabación, en la carpeta de proyectos o en una carpeta que elijas.

## Salida de la CLI

`vibe-server transcribe` escribe `txt` (predeterminado), `markdown` (alias `md`), `json`, `srt` o `vtt`. `--output` escribe un archivo nuevo y se niega a sobrescribir una ruta existente. Consulta [Línea de comandos](/vibe/docs#cli).

## Páginas relacionadas

- [Modelos](/vibe/docs#models) para las familias de modelos y sus límites.
- [Transcribe tu primera grabación](/vibe/docs#first-transcription) para el flujo de escritorio.
