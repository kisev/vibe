<!-- source: a0b0bbb0302c -->

# Transcribe tu primera grabación

Este tutorial transcribe un archivo multimedia con el modelo predeterminado. Supone que Vibe está instalado y que el modelo predeterminado ya se descargó; [Instala Vibe](/vibe/docs#install) cubre eso.

## Agrega un archivo

1. Abre Vibe.
1. Suelta un archivo de audio o video en el área para soltar archivos, o elige **Archivo** y selecciona uno.
1. Espera a que el archivo aparezca en la cola.

Vibe acepta los formatos de [Formatos compatibles](/vibe/docs#formats). Normaliza el contenido multimedia con ffmpeg antes de la transcripción, así que un contenedor poco común puede funcionar igualmente.

## Inicia la transcripción

1. Deja el idioma en automático o elige uno cuando la detección se equivoque.
1. Presiona **Transcribir**.
1. Observa la vista previa en tiempo real. **Cancelar** detiene la ejecución sin eliminar la grabación.

La aplicación de escritorio inicia `vibe-server` en segundo plano y le envía el audio por HTTP local. El servidor carga el modelo seleccionado, transcribe y devuelve segmentos con marcas de tiempo.

## Lee el resultado

La transcripción se abre cuando termina la ejecución. Cada línea se puede editar en el lugar y el cambio se guarda con el proyecto.

Para etiquetar a los hablantes, activa **Reconocer hablantes** en **Más Opciones** antes de la ejecución. La diarización usa el modelo Nemotron-3 y etiqueta hasta 8 hablantes.

## Exporta

Abre el diálogo de exportación y elige un formato: TXT, Markdown, SRT, VTT, HTML, JSON, CSV, DOCX o PDF. [Formatos compatibles](/vibe/docs#formats) explica qué contiene cada uno.

## Próximos pasos

- [Graba el micrófono y el audio del sistema](/vibe/docs#record-audio) cuando el audio sea una llamada en vivo en lugar de un archivo.
- [Modelos](/vibe/docs#models) cuando necesites otro idioma, velocidad o precisión.
- [Línea de comandos](/vibe/docs#cli) para ejecutar el mismo motor sin la ventana.
