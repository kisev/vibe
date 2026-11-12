<!-- source: 6fd793aea9b2 -->

# Motor y opciones de GPU

Vibe separa el shell de escritorio del motor de transcripción. El shell es una aplicación Tauri en Rust y React; el motor es `vibe-server`, un proceso de Rust que llama a la biblioteca C++ transcribe.cpp sobre ggml.

## Por qué el motor es un proceso aparte

El servidor se encarga de cargar el modelo y del cómputo pesado. Mantenerlo fuera del proceso de escritorio significa:

- que la ventana puede reiniciarse sin recargar un modelo de varios gigabytes;
- que el mismo binario sirve a la aplicación, la CLI y la API HTTP local;
- que un fallo del motor no se lleva consigo la ventana;
- que el motor puede actualizarse según su propio calendario, fijado por la compilación de la aplicación.

La aplicación de escritorio se comunica con el servidor por HTTP local. Nada en esa ruta sale de la máquina; [Privacidad y diseño sin conexión](/vibe/docs#privacy) cubre la superficie de red.

## Un motor, muchas familias de modelos

Cada familia compatible se ejecuta a través de la misma compilación de ggml: Whisper, Parakeet, Nemotron, Canary, Qwen3-ASR, Voxtral y GigaAM. Silero VAD y la diarización con Nemotron-3 también se ejecutan en esa pila. Un solo motor mantiene iguales el manejo de memoria, la cuantización y el despacho a la GPU para cada modelo.

La contrapartida es el acoplamiento de versiones: un modelo cuyo GGUF necesita un transcribe.cpp más reciente que la compilación incluida aparece en [Modelos](/vibe/docs#models), pero no se puede cargar hasta que el motor avance. Esa fijación es deliberada, porque las actualizaciones del motor son eventos de paridad, no actualizaciones de dependencias en segundo plano.

## Backends de GPU

ggml elige un backend para la máquina en la que se ejecuta:

| Plataforma | Backend |
| --- | --- |
| macOS | Metal |
| Windows | Vulkan |
| Linux | Vulkan |

Una máquina sin una GPU utilizable se ejecuta en la CPU. **Configuración → Modelos** contiene **Transcribir en la CPU** y, en Windows y Linux, un selector de dispositivo GPU. Si una carga de GPU falla, la aplicación reintenta en la CPU e informa que lo hizo.

La GPU importa sobre todo para modelos grandes y archivos largos. Los modelos pequeños en una CPU moderna pueden ser lo bastante rápidos, y la ruta de CPU es el respaldo cuando falta un controlador o el cargador de Vulkan.

## Páginas relacionadas

- [Modelos](/vibe/docs#models) para el catálogo y los límites por familia.
- [Línea de comandos](/vibe/docs#cli) para las opciones de `vibe-server`, como `--gpu-device`.
- [Privacidad y diseño sin conexión](/vibe/docs#privacy) para lo que se queda en la máquina.
