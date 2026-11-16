<!-- source: 2459ffcb4329 -->

# Privacidad y diseño sin conexión

Vibe está diseñado para que la ruta normal de transcripción no necesite cuenta ni servicio en la nube. La aplicación inicia un servidor local, el servidor carga un modelo desde el disco y el audio se decodifica y transcribe en la misma máquina.

## Qué se queda en local

- Archivos de audio, grabaciones, exportaciones y transcripciones.
- Los modelos y los binarios de ffmpeg.
- El historial de proyectos en la carpeta de proyectos.
- La API HTTP local entre la aplicación de escritorio y `vibe-server`, enlazada a la interfaz de loopback.

La aplicación no envía telemetría. **Reportar Problema** prepara un informe rellenado con el diagnóstico local y abre GitHub; no se envía nada hasta que lo revises y lo envíes.

## Dónde se usa la red

| Función | Contacto de red |
| --- | --- |
| Descarga de modelos | El host que sirve el archivo del modelo |
| Transcripción desde un enlace | El host del contenido multimedia y GitHub para el binario de yt-dlp |
| Comprobación de actualizaciones | El archivo de canal del sitio web |
| Resumen con IA con Claude u OpenAI | El proveedor configurado |
| Resumen con IA con Ollama | La URL de Ollama, local por defecto |
| Transferencia desde el celular | Un servidor de retransmisión cifrado de extremo a extremo entre el celular y esta computadora |

El motor de transcripción en sí no tiene ruta de red.

## Transferencia desde el celular

El celular y el escritorio se conectan mediante iroh. El servidor de retransmisión transporta tráfico cifrado de extremo a extremo, así que reenvía bytes que no puede leer; la transcripción sigue ocurriendo en esta computadora y Vibe debe permanecer abierto para que la transferencia funcione.

## Contrapartidas

- Los modelos locales ocupan espacio en disco y usan la CPU o la GPU de la máquina. [Motor y opciones de GPU](/vibe/docs#engine) explica la separación.
- Un resumen en la nube envía el texto de la transcripción al proveedor que elijas. Deja la plataforma en Ollama para mantenerlo local.
- Las actualizaciones se comprueban desde archivos estáticos en el sitio web, lo que revela que la aplicación consultó un canal, no lo que transcribió.

## Páginas relacionadas

- [Configuración y ajustes](/vibe/docs#settings) para el archivo de configuración local.
- [Transcribe desde tu celular](/vibe/docs#transcribe-from-a-phone) para los pasos de la transferencia.
- [Resume una transcripción](/vibe/docs#summarize-transcripts) para las plataformas de IA.
