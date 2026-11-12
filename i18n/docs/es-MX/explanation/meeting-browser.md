<!-- source: 42d301759b1a -->

# Por qué el navegador de reuniones funciona así

Una llamada es más fácil de grabar cuando Vibe aloja la página: la aplicación controla la ventana, sabe cuándo hay una grabación en curso y puede mostrar una barra con una sola acción. El diseño está moldeado por lo que el sistema operativo permite realmente.

## Por qué un esquema de URL en lugar de clics https

Un navegador nunca entrega un enlace `https://` a una aplicación instalada a menos que esa aplicación sea el navegador predeterminado. Las aplicaciones de reuniones funcionan al revés: registran su propio esquema y sus páginas o instaladores lo invocan.

Vibe hace lo mismo:

- `vibe://open/?url=https://…` abre el destino en la ventana del navegador de Vibe. Cualquier aplicación, script o atajo puede llamarlo. Vibe valida la URL en Rust y rechaza cualquier cosa que no sea https y esté bien formada.
- **Configuración → Grabación → Abrir en Vibe** pega un enlace en la misma ruta.

Hacer clic en un enlace `https` en Chrome, Edge o Firefox sigue abriendo ese navegador. Convertir a Vibe en el navegador predeterminado queda deliberadamente fuera del alcance: tomaría cada enlace de la máquina para atender una sola función.

## Por qué la vista de contenido está aislada

La ventana de contenido es un webview normal con su propio directorio de datos. Las cookies de los servicios nunca se mezclan con el almacenamiento de la aplicación, no se inyectan scripts en la página y los avisos de cámara y micrófono vienen de la propia página, no de que Vibe los conceda en nombre del usuario. La página integrada se trata como contenido web no confiable, no como parte de la aplicación.

La barra ofrece dirección, atrás, adelante, recargar, cerrar y **Abrir en el navegador del sistema**. Esa última acción es la salida de emergencia para un servicio que se niega a ejecutarse en el webview integrado.

## Por qué la grabación sigue siendo manual

Los hosts de la lista de reuniones convierten la ventana en una sesión de reunión: la barra muestra **Grabar esta llamada**. La grabación sigue siendo manual: presiona el botón antes o durante la llamada, detén desde la barra o desde la ventana principal. El inicio automático grabaría llamadas que el usuario no pidió grabar y haría aparecer el indicador del micrófono sin una acción explícita.

Cerrar la ventana mientras se graba pregunta si detener la grabación o seguir grabando en segundo plano, así que salir de una llamada no puede descartar ni continuar una grabación en silencio.

## Límites

- Solo los enlaces `vibe://open/` se abren automáticamente. Un clic en `https` necesita la decisión de navegador predeterminado que Vibe no toma.
- Los sitios con mucho DRM o poco amigables con WebRTC pueden funcionar mejor en el navegador del sistema; **Abrir en el navegador del sistema** es el recurso de respaldo admitido.
- Windows se valida primero. Las otras plataformas usan sus propios webviews y recurren al navegador del sistema si la ventana no puede alojar la llamada.
- Registrar los esquemas de Zoom, Teams y Webex es opcional y está disponible en Windows y Linux, no en macOS.

## Páginas relacionadas

- [Usa el navegador de reuniones](/vibe/docs#use-the-meeting-browser) para los pasos.
- [Graba el micrófono y el audio del sistema](/vibe/docs#record-audio) para el grabador en sí.
