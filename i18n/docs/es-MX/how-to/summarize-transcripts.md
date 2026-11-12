<!-- source: f5e20b838770 -->

# Resume una transcripción

Vibe puede convertir una transcripción terminada en un resumen, notas o una traducción. La solicitud va a la plataforma de IA que configures: un modelo local de Ollama, Claude o cualquier endpoint compatible con OpenAI. [Configuración y ajustes](/vibe/docs#settings) indica dónde se guarda la conexión.

## Usa un modelo local de Ollama

1. Instala [Ollama](https://ollama.com) y descarga un modelo, por ejemplo `ollama pull llama3.1`.
1. Abre **Configuración → Asistente de IA**.
1. Establece **Plataforma** en **Ollama**. La URL predeterminada es `http://localhost:11434`.
1. Elige el nombre del modelo.
1. Activa **Resúmenes** y, si quieres, **Resumir automáticamente las transcripciones nuevas**.

Ollama se ejecuta en esta máquina, así que la transcripción permanece local.

## Usa Claude o un endpoint compatible con OpenAI

1. Abre **Configuración → Asistente de IA** y elige la plataforma.
1. Pega la clave de API y cambia la URL base si el endpoint no es el predeterminado.
1. Elige el modelo.
1. Activa **Resúmenes**.

Para un endpoint no predeterminado, la URL base y la clave son la conexión que usa la aplicación tanto para los resúmenes como para el dictado.

## Resume

1. Termina una transcripción.
1. Abre la acción de resumen en la vista de transcripción.
1. Elige una opción predefinida y, si hace falta, edita el prompt.
1. Ejecútala; el resultado se guarda con el proyecto y se puede exportar junto a la transcripción.

Con **Resumir automáticamente las transcripciones nuevas** activado, el resumen se ejecuta en cuanto termina una transcripción.

## Próximos pasos

- [Configuración y ajustes](/vibe/docs#settings) para el archivo de configuración y las secciones de ajustes.
- [Privacidad y diseño sin conexión](/vibe/docs#privacy) para saber qué plataformas mantienen el texto en la máquina.
