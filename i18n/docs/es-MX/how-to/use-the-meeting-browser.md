<!-- source: fa863fbcee4b -->

# Usa el navegador de reuniones

Vibe puede alojar una llamada en su propia ventana con una barra siempre visible cuya acción principal es **Grabar esta llamada**. La ventana usa el webview de la plataforma; [Por qué el navegador de reuniones funciona así](/vibe/docs#meeting-browser) cubre el aislamiento y los límites.

## Abre una llamada en Vibe

Usa una de estas rutas:

- Abre **Configuración → Grabación → Abrir en Vibe**, pega el enlace y ábrelo.
- Desde otra aplicación, script o atajo, llama a `vibe://open/?url=https://…`. Vibe solo acepta URL https bien formadas y rechaza cualquier otra cosa con un diálogo.
- Activa **Abrir enlaces de reuniones en Vibe** en **Configuración → Grabación** para registrar los enlaces de Zoom, Teams y Webex. Está disponible en Windows y Linux, no en macOS.

Hacer clic en un enlace https en Chrome, Edge o Firefox sigue abriendo ese navegador. Vibe no se registra como navegador predeterminado.

## Obtén la barra de grabación

**Configuración → Grabación → Hosts de reuniones** enumera los hosts que obtienen la barra de reuniones. Los predeterminados son `telemost.yandex.ru` y `stream.wb.ru`.

- Agrega un host para que sus enlaces sean sesiones grabables.
- Quita un host para perder la barra; sus enlaces se siguen abriendo en la ventana del navegador.

La coincidencia es por nombre de host sobre https, así que `sub.telemost.yandex.ru` coincide con una entrada de `telemost.yandex.ru`, mientras que una URL `http` no. La lista es un filtro de comodidad, no una frontera de seguridad: cada enlace https se abre en la ventana, pero solo los hosts enumerados obtienen la barra.

## Graba una llamada

1. Abre la reunión en Vibe.
1. Presiona **Grabar esta llamada** antes o durante la llamada.
1. Detén desde la barra o desde la ventana principal.

La grabación es manual; una ventana de reunión nunca empieza a grabar por sí sola. El grabador captura el micrófono configurado y, cuando está activado, el flujo de retorno del audio del sistema, así que se graban ambos lados de la llamada.

Cerrar la ventana mientras se graba pregunta si detener la grabación o seguir grabando en segundo plano.

## Recurre al navegador del sistema

Si un servicio se niega a ejecutarse en el webview integrado, usa **Abrir en el navegador del sistema** en la barra. Es el recurso de respaldo admitido para sitios con mucho DRM o poco amigables con WebRTC.

## Próximos pasos

- [Por qué el navegador de reuniones funciona así](/vibe/docs#meeting-browser) explica el esquema de URL, el webview aislado y la regla de grabación manual.
- [Graba el micrófono y el audio del sistema](/vibe/docs#record-audio) cubre la grabación fuera de una llamada.
