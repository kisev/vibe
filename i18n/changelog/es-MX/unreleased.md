---
version: unreleased
date: 
title: "Lo que viene"
source: 4462099ac37f
---

## New

- 🧪 **Comparación de modelos, lado a lado** — Configuración → Modelos ejecuta un clip o un archivo por cada modelo instalado que elijas y abre resultados a ventana completa: una columna por modelo con su tiempo y recuento de palabras, desplazamiento independiente, un selector de referencia y resaltado por palabra que tacha las palabras no detectadas y marca las adicionales
- 🗣️ **Separación de hablantes en la comparación** — un interruptor añade etiquetas de voz a la transcripción de cada modelo, así que la misma ejecución muestra qué modelo oyó las palabras y quién las dijo
- 🔄 **Tres canales de actualización** — sigue Release, Beta o Dev, consulta la versión actual y cuándo se ejecutó la última comprobación, e inicia una comprobación tú mismo con un botón en lugar de esperar al siguiente inicio
- 🗺️ **El sitio tiene una hoja de ruta** — una página nueva enumera cada cambio sin archivar directamente desde los archivos de planificación del proyecto, así que lo que viene nunca es una suposición escrita a mano
- 🌐 **Las reuniones se abren dentro de Vibe** — los enlaces de reuniones se abren en un navegador integrado con su propio menú (atrás, adelante, recargar, abrir en el navegador del sistema, cerrar) y una lista editable de hosts de reuniones; Vibe puede registrarse como el controlador de los enlaces de Zoom, Teams y Webex cuando se lo pidas, y una llamada detectada te propone grabarla con tu micrófono y el audio del sistema
- 🌍 **El sitio web habla tu idioma** — un selector de idioma en el encabezado cambia la página en el acto, mantiene `?lang=` en la URL para que los enlaces compartidos conserven la elección y aplica un diseño de derecha a izquierda. `/changelog/dev` es ahora la dirección permanente de las notas de desarrollo

## Improved

- 🧭 **Las actualizaciones de desarrollo tienen su propia línea** — las compilaciones de desarrollo se publican como versiones preliminares `-dev.N` en el canal Dev, se preparan versiones candidatas para Beta y el registro de cambios de desarrollo conserva una URL estable mientras las compilaciones van y vienen
- 🏷️ **Las comparaciones nombran los modelos correctamente** — los resultados y los diálogos usan el nombre canónico del modelo y la grafía de la cuantización que emplea el catálogo en lugar de convertir a mayúsculas iniciales un nombre de archivo
- 🤫 **La detección de reuniones no estorba** — la propia ventana de reuniones de Vibe suprime el aviso de detección externo, y el estado de grabación se comparte, así que una llamada ya abierta en Vibe nunca ofrece grabar dos veces
- 🕵️ **Nada sale de tu dispositivo** — toda la telemetría desapareció: sin clave de analítica, sin ping al iniciar ni al realizar una acción y sin banners de donación en el sitio. Los registros, los diagnósticos y las exportaciones permanecen en el disco y solo salen cuando tú los envías
- 📚 **La documentación sigue Diátaxis** — los tutoriales, las guías prácticas, la referencia y la explicación están separados, en el repositorio y en el sitio, así que «cómo hago…» y «qué significa esto» ya no comparten una página larga
- 🔗 **Las notas de la versión apuntan al registro de cambios traducido** — cada cuerpo de versión enlaza a `https://kisev.github.io/vibe/changelog/<version>`, así que cada lector elige su propio idioma en lugar del inglés

## Fixed

- 🎙️ **Todos los modelos pueden ejecutar la comparación** — GigaAM y Parakeet ya no rechazan una ejecución por falta de un modelo VAD; el laboratorio aporta su detector incluido, así que los resultados solo difieren por el modelo
- 📍 **La comparación va primero** — el laboratorio se movió por encima del largo catálogo de modelos en Configuración → Modelos para que sea lo primero que veas
- 🔍 **Las transcripciones largas siguen resaltándose** — el resaltado de diferencias ya no se rinde por encima de las mil palabras e informa de cero diferencias; cuando un texto es realmente demasiado largo, la columna lo indica en su lugar
- 🔁 **Los canales de actualización conservan sus nombres y su línea** — el selector dice Release, Beta y Dev en todos los idiomas, y Beta ofrece solo versiones candidatas en lugar de replicar la compilación estable
- 🔌 **El interruptor del servidor de la API se mantiene apagado** — el interruptor de Agentes es tu elección y sobrevive a un reinicio; leer los metadatos de los modelos al iniciar ya no deja un servidor ejecutándose detrás
- 🪟 **La ventana de reuniones se puede cerrar** — sus controles viven en la propia ventana, así que una página que no carga ya no deja una ventana sin salida
- 🌍 **El sitio traduce la página completa** — cambiar el idioma ya no deja secciones en inglés atrás, y el registro de cambios también sigue el idioma elegido
