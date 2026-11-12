<!-- source: b806d3524bf0 -->

# Transcribe desde un enlace

Vibe descarga el audio detrás de una URL de contenido multimedia con yt-dlp y transcribe el resultado. Los sitios compatibles son los que admite yt-dlp; cuando un sitio deja de funcionar, un yt-dlp actualizado suele arreglarlo.

## Envía el enlace

1. Abre Vibe y elige **Desde enlace**.
1. Pega una URL o varias separadas por espacios para ponerlas todas en cola.
1. Presiona **Transcribir**.

Vibe pide instalar yt-dlp la primera vez que se usa un enlace y pide actualizarlo cuando un sitio falla. El audio descargado es temporal; la transcripción se guarda como cualquier otro proyecto.

## Qué esperar

- Un solo enlace comienza en cuanto termina la descarga.
- Una cola procesa un enlace a la vez y muestra el progreso de cada elemento.
- Los pesos, los modelos y la transcripción se quedan en local. La descarga en sí contacta al host del contenido multimedia y a GitHub para obtener yt-dlp.

## Próximos pasos

- [Formatos compatibles](/vibe/docs#formats) para archivos locales y opciones de exportación.
- [Modelos](/vibe/docs#models) cuando el audio necesite otro idioma o precisión.
