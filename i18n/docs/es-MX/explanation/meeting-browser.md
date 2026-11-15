<!-- source: 6737f12a1fc7 -->

# Navegador de reuniones

El navegador de reuniones existe porque una llamada es más fácil de grabar cuando Vibe aloja la página: la aplicación controla la ventana, sabe cuándo hay una grabación en curso y puede mostrar su propia barra con una sola acción. El diseño está moldeado por lo que el sistema operativo permite realmente.

## Por qué un esquema de URL en lugar de clics https

Un navegador nunca entrega un enlace `https://` a una aplicación instalada a menos que esa aplicación sea el navegador predeterminado. Las aplicaciones de escritorio de reuniones funcionan al revés: registran su propio esquema (`zoommtg://`, `msteams://`, `mattermost://`), y sus propias páginas o instaladores lo invocan.

Vibe hace lo mismo, con la misma honestidad:

- Activa **Abrir enlaces de reuniones en Vibe** y Vibe registra los esquemas de reunión que Zoom, Teams y Webex ya usan (`zoommtg://`, `msteams://`, `webex://`), asignando cada uno a la URL web que transporta. La aplicación valida la URL en Rust y la abre en la ventana del navegador cuando su host puede cargarse, o en el navegador del sistema en caso contrario.
- Una URL `https` entregada como argumento de inicio sigue la misma ruta.
- Dentro de la aplicación, la fuente **Navegador de reuniones** de la página de inicio y **Configuración → Grabación → Abrir en Vibe** pegan un enlace en la misma ruta.

Vibe deliberadamente no incluye ningún enlace `vibe://open/` propio: ninguna página de reuniones emite uno, y por eso se eliminó ese primer punto de entrada. Hacer clic en un enlace `https` en Chrome, Edge o Firefox sigue abriendo ese navegador. Convertir a Vibe en el navegador predeterminado queda deliberadamente fuera del alcance: tomaría cada enlace de la máquina para atender una sola función, y aun así sería una decisión del usuario.

## Por qué la vista de contenido está aislada

La ventana contiene dos webviews hijos: la barra de Vibe y la página remota. La barra es la interfaz de la aplicación y tiene las capacidades de la aplicación; la página es contenido web no confiable ordinario sin ninguna capacidad, sin scripts inyectados en ella y con los avisos de cámara y micrófono viniendo de la propia página en lugar de que Vibe los conceda en nombre del usuario. Ambos comparten el entorno WebView2 del proceso, porque WebView2 no admite un segundo directorio de datos en un mismo proceso.

La barra ofrece dirección, atrás, adelante, recargar, cerrar y **Abrir en el navegador del sistema**. Esa última acción es la salida de emergencia para un servicio que se niega a ejecutarse en el webview integrado. La integración de múltiples webviews es una capacidad de escritorio de Windows y Linux en este caso; en macOS el navegador recurre a una ventana solo de página, sin barra, en lugar de fallar.

## Por qué el navegador es una lista de permitidos

El navegador integrado originalmente cargaba todo lo que pedía una página; la lista de hosts de reuniones solo decidía qué enlaces recibían la barra de grabación. Ahora es una verdadera frontera: solo los dominios permitidos y sus subdominios pueden cargarse por https, tanto para las páginas de nivel superior como para cada recurso que solicitan. Un recurso rechazado recibe una respuesta de error, así que la página trata el origen como no disponible en lugar de reintentar sin fin.

La rigurosidad tiene un costo: una página que toma fuentes o scripts de un CDN se rompe hasta que ese CDN se permita. La lista de bloqueados es el remedio: hosts únicos, los más recientes primero, cada uno con una acción **Permitir** que agrega el dominio y recarga la página. La lista se dibuja dentro de la barra y la barra crece para encajar, porque un menú emergente dentro de un webview de 104 píxeles quedaría recortado por la página de abajo. La barra hace la misma oferta cuando rechaza una navegación. Windows aplica el bloqueo de recursos con `WebResourceRequested` de WebView2; Linux y macOS actualmente solo bloquean la navegación de nivel superior.

El modo se almacena en caché en lugar de leerse por ventana, y el filtro de recursos se instala en ambos modos, así que cambiar entre `strict` y `trusted-site` llega a una página que ya está abierta en su siguiente solicitud en lugar de requerir reabrirla.

## Por qué la grabación sigue siendo manual

Cada página del navegador muestra **Grabar esta llamada**, y mientras haya una ventana del navegador abierta se suprime el aviso de llamada del navegador externo. La grabación sigue siendo manual: presiona el botón antes o durante la llamada, detén desde la barra o desde la ventana principal. El inicio automático grabaría llamadas que el usuario no pidió grabar y haría aparecer el indicador del micrófono sin una acción explícita.

Cerrar la ventana mientras se graba pregunta si detener la grabación o seguir grabando en segundo plano, así que salir de una llamada no puede descartar ni continuar una grabación en silencio.

## Límites

- Solo se entrega a Vibe un esquema de reunión registrado o un argumento de inicio `https`. Un clic en `https` necesita la decisión de navegador predeterminado que Vibe no toma.
- Los sitios con mucho DRM o poco amigables con WebRTC pueden funcionar mejor en el navegador del sistema; **Abrir en el navegador del sistema** es el recurso de respaldo admitido.
- Windows se valida primero. Las demás plataformas usan sus propios webviews y recurren al navegador del sistema si la ventana no puede alojar la llamada.

Los hechos y las reglas de la lista de permitidos están en [Referencia del navegador de reuniones](../reference/meeting-browser.md); los pasos están en [Usa el navegador de reuniones](../how-to/use-the-meeting-browser.md).
