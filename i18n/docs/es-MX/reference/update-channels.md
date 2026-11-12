<!-- source: 18fa449ab772 -->

# Canales de actualización

La aplicación se actualiza desde uno de tres archivos de canal en el sitio web, no desde la «última versión» de GitHub:

| Canal | Archivo |
| --- | --- |
| Release | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

Cada archivo es el `latest.json` que produjo una compilación de versión final. Un archivo ausente significa que la línea no tiene nada: la aplicación informa "Actualizado" en lugar de recurrir a otro canal.

## Líneas y versiones

| Canal | Etiqueta | Rama | Versión | Qué es |
| --- | --- | --- | --- | --- |
| Release | `vX.Y.Z` | `main` | `X.Y.Z` | La línea estable |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Candidata a la siguiente versión estable, publicada como versión preliminar |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | La compilación en constante cambio de `dev` |

Una versión final sin sufijo se rechaza en el canal beta; allí solo se acepta `X.Y.Z-rc.<n>`. Un canal sin candidata está ausente, no vacío.

## En la aplicación

- **Configuración → General → Actualizaciones** contiene el selector de canal, la versión actual, **Buscar actualizaciones**, la hora de la última comprobación y el resultado.
- La aplicación consulta por sí misma `updater/<channel>.json`. Un `404` o un `410` significan que el canal nunca se publicó; cualquier otro fallo es un error real.
- La comprobación se ejecuta al iniciar y después de cambiar de canal.

## Límites

- El actualizador solo avanza hacia adelante. Una compilación defectuosa se corrige enviando una más nueva.
- Una instalación de Release o Beta que selecciona Dev ve "Actualizado": cada compilación de dev se ordena debajo de la versión que ya ejecuta. Cambiar a la línea de dev requiere instalar manualmente una compilación de dev; después, el canal Dev la actualiza hacia adelante.
- Una instalación Beta pasa a la versión final al cambiar a Release, donde `X.Y.Z` se ordena por encima de sus candidatas.

## Páginas relacionadas

- [Cambia de canal de actualización](/vibe/docs#switch-update-channels) para los pasos.
- [Por qué los canales de actualización funcionan así](/vibe/docs#update-channels-design) para el diseño.
