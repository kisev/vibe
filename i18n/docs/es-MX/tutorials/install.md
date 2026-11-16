<!-- source: 03e5a04c40fd -->

# Instala Vibe

Este tutorial lleva una computadora nueva desde la descarga hasta una ventana de Vibe en funcionamiento. Supone un equipo de escritorio con conexión a internet y sin una instalación existente. [Transcribe tu primera grabación](/vibe/docs#first-transcription) es el siguiente paso.

## Descarga el instalador

Abre la [página de descarga](https://kisev.github.io/vibe/) y elige la compilación para esta computadora:

| Plataforma | Compilación |
| --- | --- |
| Windows | instalador `.exe` |
| macOS, Apple silicon | `aarch64.dmg` |
| macOS, Intel | `x64.dmg` |
| Linux | `.deb` o `.rpm`, x86-64 o arm64 |

Los mismos archivos se adjuntan a cada [versión de GitHub](https://github.com/kisev/vibe/releases). El `.deb` de Linux declara sus dependencias de tiempo de ejecución, incluido `ffmpeg`.

## Instala y abre

1. Ejecuta el instalador y sigue sus indicaciones.
1. Abre Vibe desde el menú de aplicaciones o ejecuta `vibe` desde una terminal.

Las compilaciones de versión final no están firmadas. En macOS, el primer inicio necesita clic derecho → **Abrir** en Finder para pasar Gatekeeper; los inicios posteriores se abren normalmente. Windows SmartScreen puede mostrar una advertencia por el mismo motivo.

## Termina la configuración

En el primer inicio, Vibe ofrece el modelo predeterminado. Acepta la descarga y espera a que termine. El modelo se almacena localmente y se reutiliza en cada ejecución posterior; [Modelos](/vibe/docs#models) enumera las alternativas.

La ventana está lista cuando el área para soltar archivos y las acciones **Grabar** y **Desde enlace** son visibles.

## Próximos pasos

- [Transcribe tu primera grabación](/vibe/docs#first-transcription) usa esta instalación.
- [Formatos compatibles](/vibe/docs#formats) enumera lo que Vibe puede abrir y exportar.
- [Solución de problemas de bloqueos](https://github.com/kisev/vibe/blob/main/docs/how-to/troubleshoot-a-crash.md) cubre los registros y el diagnóstico si la ventana no se abre.
