<!-- source: 648b5aad742b -->

# Graba el micrófono y el audio del sistema

Vibe graba desde los dispositivos que elijas y luego transcribe la grabación. Usa esta guía para llamadas, reuniones y audio que se está reproduciendo en lugar de estar guardado como archivo. [Formatos compatibles](/vibe/docs#formats) cubre los archivos.

## Elige los dispositivos

1. Abre Vibe y elige **Grabar**.
1. En **Micrófono**, elige el dispositivo de entrada. Vibe recuerda el dispositivo por su nombre.
1. En **Altavoces**, elige el dispositivo de salida para capturar el audio del sistema. Elige **Ninguno** para grabar solo el micrófono.

Vibe combina ambos dispositivos en una sola pista con ffmpeg, así que ambos lados de una llamada quedan en la misma transcripción.

## Concede permisos en macOS

Abre **Configuración → Grabación → Permisos** y concede lo que necesita la grabación:

| Permiso | Se usa para |
| --- | --- |
| Micrófono | Audio del micrófono |
| Audio del sistema | Audio que se reproduce en la Mac (Grabación de pantalla y audio del sistema) |

Sin el permiso de audio del sistema, macOS abre el flujo de retorno pero graba silencio, así que la grabación no sirve.

## Graba y transcribe

1. Presiona **Grabar**.
1. Usa **Detener** cuando termine la llamada.
1. La grabación se abre con un selector de idioma. Elige un idioma o déjalo en automático.
1. Presiona **Transcribir**.

Si **Transcribir las grabaciones automáticamente** está activado en **Configuración → Grabación**, el último paso se inicia solo.

## Próximos pasos

- [Resume una transcripción](/vibe/docs#summarize-transcripts) cuando termine la grabación.
- [Usa el navegador de reuniones](/vibe/docs#use-the-meeting-browser) para grabar una llamada dentro de Vibe.
