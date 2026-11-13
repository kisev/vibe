<!-- source: cc4651e4e37d -->

# Usa el navegador de reuniones

Vibe puede alojar una llamada en su propia ventana con una barra siempre en primer plano cuya acción principal es **Grabar esta llamada**. La ventana usa el webview de la plataforma; [Por qué el navegador de reuniones funciona así](/vibe/docs#meeting-browser) cubre el aislamiento y los límites.

## Abre una llamada en Vibe

Usa una de estas rutas:

- Abre **Configuración → Grabación → Abrir en Vibe**, pega el enlace y ábrelo.
- Desde otra aplicación, script o atajo, llama a `vibe://open/?url=https://…`. Vibe solo acepta URL https bien formadas y rechaza cualquier otra cosa con un diálogo.
- Activa **Abrir enlaces de reuniones en Vibe** en **Configuración → Grabación** para registrar los enlaces de Zoom, Teams y Webex. Está disponible en Windows y Linux, no en macOS.

Hacer clic en un enlace https en Chrome, Edge o Firefox sigue abriendo ese navegador. Vibe no se registra como navegador predeterminado.

## Permite los sitios que usas

**Configuración → Grabación → Dominios permitidos** es la lista de permitidos del navegador. Empieza vacía: agrega cada dominio que quieras abrir y sus subdominios se incluyen automáticamente. La coincidencia es por nombre de host sobre https: una URL `http` nunca se carga.

La lista es una frontera, no un filtro. Se rechaza un enlace a un host fuera de ella, y también cualquier script, fuente o imagen que una página permitida solicite a un origen no listado. Cada host rechazado aparece en **Bloqueados** con una acción **Permitir**; permitirlo agrega el dominio y recarga la página para que los recursos rechazados se reintenten.

Una lista estricta puede romper una página cuyos recursos vienen de un CDN hasta que ese CDN se permita. La lista Bloqueados es el remedio, y la barra del navegador ofrece lo mismo cuando rechaza una navegación. Mientras haya una ventana del navegador abierta, Vibe suprime su propia petición de llamada.

## Graba una llamada

Los controles de grabación de la barra del navegador están presentes en cada página permitida, no solo en una lista de hosts.

1. Abre la reunión en Vibe.
1. Presiona **Grabar esta llamada** antes o durante la llamada.
1. Detén desde la barra del navegador o desde la ventana principal.

La grabación es manual; una ventana de reunión nunca empieza a grabar por sí sola. El grabador captura el micrófono configurado y, cuando está activado, el flujo de retorno del audio del sistema, así que se graban ambos lados de la llamada.

Cerrar la ventana mientras se graba pregunta si detener la grabación o seguir grabando en segundo plano.

## Recurre al navegador del sistema

Si un servicio se niega a ejecutarse en el webview integrado, usa **Abrir en el navegador del sistema** en la barra. Es el recurso de respaldo admitido para sitios con mucho DRM o poco amigables con WebRTC.

## Próximos pasos

- [Por qué el navegador de reuniones funciona así](/vibe/docs#meeting-browser) explica el esquema de URL, el webview aislado, la disyuntiva de la lista de permitidos y la regla de grabación manual.
- [Graba el micrófono y el audio del sistema](/vibe/docs#record-audio) cubre la grabación fuera de una llamada.
