<!-- source: dd9e41dac7e3 -->

# Configuración y ajustes

La configuración se guarda en `app_config.json` en el directorio de configuración de la aplicación. El archivo está pensado para leerse y editarse: Vibe lo vigila y aplica un cambio externo sin reiniciar. **Configuración → Agentes → Archivo de configuración** lo abre.

## Ubicación del archivo de configuración

| Plataforma | Directorio |
| --- | --- |
| macOS | `~/Library/Application Support/github.com.thewh1teagle.vibe` |
| Windows | `%appdata%\github.com.thewh1teagle.vibe` |
| Linux | `~/.config/github.com.thewh1teagle.vibe` |

El directorio conserva su identificador de origen, así que el nombre no cambió respecto de compilaciones anteriores.

## Secciones de ajustes

| Sección | Contiene |
| --- | --- |
| General | Idioma de la interfaz, tema, actualizaciones, mantener en la bandeja, iniciar al arrancar, impedir que se suspenda |
| Privacidad | Si se guardan los proyectos y la política de privacidad |
| Transcripción | Idioma, exportación automática, sonido y foco al terminar, carpeta de proyectos |
| Modelos | Elección de CPU/GPU, dispositivo GPU, catálogo de modelos, modelo de separación de hablantes |
| Ajuste fino | Opciones de Whisper, procesamiento de audio, memoria del modelo y tiempo de espera antes de descargarlo |
| Grabación | Navegador de reuniones, detección de reuniones, transcripción automática, atajo de grabación, permisos en macOS |
| Dictado | Atajo de dictado y modo de activación |
| Asistente de IA | Tareas de resúmenes y dictado, conexión con la plataforma |
| Celular | Transferencia desde el celular, vinculación, dispositivos vinculados |
| Agentes | API local, habilidad de agente, archivo de configuración |
| Avanzado | Registros, diagnóstico y controles para desarrolladores |

## Valores que conviene conocer

| Grupo de claves | Significado |
| --- | --- |
| `transcription.*` | Idioma, prompt, diarización, marcas de tiempo, división de grabaciones largas |
| `model.*` | Modelo seleccionado, nombres visibles, dispositivo GPU, opción de solo CPU, tiempo de espera antes de descargarlo |
| `transcript.*` | Formato de exportación, marcas de tiempo, hablantes, exportación automática |
| `recording.*` | Dispositivos de entrada y salida, detección de reuniones, atajo de grabación |
| `ai.*` | Plataforma, URL base, clave, modelo, prompt y opciones por tarea |
| `general.updateChannel` | `stable`, `beta` o `dev` |
| `handoff.pairing` | Dispositivos de celular vinculados y hashes de credenciales |

Los nombres exactos de los campos son lo bastante estables para editarlos, pero la aplicación controla el esquema: cambia un valor desde la interfaz de ajustes cuando exista esa opción y deja que la aplicación reescriba el archivo en lugar de reemplazarlo por completo.

## Páginas relacionadas

- [Cambia de canal de actualización](/vibe/docs#switch-update-channels) para el ajuste de canal.
- [Resume una transcripción](/vibe/docs#summarize-transcripts) para la conexión de IA.
- [Transcribe desde tu celular](/vibe/docs#transcribe-from-a-phone) para los ajustes de transferencia.
