<!-- source: a039b159d4fd -->

# Usa el navegador de reuniones

Vibe puede alojar una llamada en su propia ventana basada en Chromium: la barra de la aplicación (dirección, atrás, adelante, recargar, abrir externo, cerrar y **Grabar esta llamada**) está en la parte superior, y la página llena el resto de esa misma ventana. No hay una ventana de barra separada. Consulta [Referencia del navegador de reuniones](../reference/meeting-browser.md) para los esquemas de URL y la lista de permitidos, y [la explicación](../explanation/meeting-browser.md) para saber por qué el mecanismo funciona así.

## Abre una llamada en Vibe

Usa una de estas rutas:

- Desde otra aplicación o el sistema: activa **Abrir enlaces de reuniones en Vibe** en **Configuración → Grabación** para registrar los enlaces de Zoom, Teams y Webex (Windows y Linux, no macOS). La aplicación valida la URL asignada y la abre en la ventana del navegador cuando su host puede cargarse, o en el navegador del sistema en caso contrario.
- Dentro de Vibe: la fuente **Navegador de reuniones** de la página de inicio, o **Configuración → Grabación → Abrir en Vibe**; pega el enlace y presiona **Abrir en Vibe**.
- El host del enlace debe estar en la lista de permitidos; la navegación de nivel superior y los recursos de origen cruzado fuera de ella se rechazan. Los controles de grabación de la barra están presentes en cada página permitida.

Hacer clic en un enlace https en Chrome, Edge o Firefox sigue abriendo ese navegador. Vibe no se registra como navegador predeterminado.

## Graba una llamada

1. Abre la reunión en Vibe.
1. Presiona **Grabar esta llamada** en la barra de la ventana antes o durante la llamada.
1. Detén desde la barra o desde la ventana principal.

La grabación es manual; una ventana de reunión nunca empieza a grabar por sí sola. El grabador captura el micrófono configurado y, cuando está activado, el flujo de retorno del audio del sistema, así que se graban ambos lados de la llamada.

Los selectores de micrófono y altavoz de la barra cambian los mismos dispositivos que usa la ventana principal, así que una llamada puede dirigirse sin salir de ella. Mientras hay una grabación en curso están desactivados y nombran los dispositivos que está capturando; una fuente que la grabación no captura muestra **Ninguno**.

Cerrar la ventana mientras se graba pregunta si detener la grabación o seguir grabando en segundo plano.

## Permite los sitios que usas

**Configuración → Grabación → Dominios permitidos** es la lista de permitidos del navegador; empieza vacía. Agrega cada dominio que necesites y sus subdominios quedan incluidos por https.

Solo los dominios listados pueden cargarse. Se rechaza un enlace a otro host, y también cualquier script, fuente o imagen que una página permitida solicite a un origen no listado. Los hosts rechazados aparecen en **Bloqueados** con una acción **Permitir** que agrega el dominio y recarga la página. La barra muestra la misma oferta cuando rechaza una navegación.

La lista estricta puede romper una página cuyos recursos vienen de un CDN hasta que ese CDN se permita; esa es la contrapartida prevista, y la lista Bloqueados hace que la solución sea un solo clic.

## Recurre al navegador del sistema

Si un servicio se niega a ejecutarse en el webview integrado, usa **Abrir en el navegador del sistema** en la barra. El navegador del sistema es el recurso de respaldo admitido para sitios con mucho DRM o poco amigables con WebRTC.

En macOS el navegador integrado no tiene barra dentro de la ventana: la página se abre en una ventana solo de página, la grabación sigue disponible desde la ventana principal, y el navegador del sistema es el recurso de respaldo para toda la llamada.
