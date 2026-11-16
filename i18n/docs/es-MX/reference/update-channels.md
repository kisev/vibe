<!-- source: 63b7a2f2736b -->

# Canales de actualización

La aplicación se actualiza desde uno de tres archivos de canal en el sitio web, no desde la «última versión» de GitHub:

| Canal | Archivo |
| --- | --- |
| Release | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

Cada archivo es el `latest.json` que produjo una compilación de versión final. Un canal sin archivo es una línea sin nada: la aplicación informa «Actualizado» en lugar de recurrir a otro canal o de tratar el archivo ausente como una comprobación fallida.

## Líneas y versiones

| Canal | Etiqueta | Rama | Versión | Qué es |
| --- | --- | --- | --- | --- |
| Release | `vX.Y.Z` | `main` | `X.Y.Z` | La línea estable |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Candidata a la siguiente versión estable, publicada como versión preliminar de GitHub |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | La compilación en constante cambio de `dev` |

`beta.json` está ausente mientras no se publique ninguna candidata. Una versión final sin sufijo se rechaza en el canal beta; allí solo se acepta `X.Y.Z-rc.<n>`.

## De dónde vienen los manifiestos

- **Release y beta**: el actualizador de Tauri de la compilación de versión final genera `latest.json`. `scripts/channel.py <version> --channel <stable|beta>` lo descarga desde `https://github.com/kisev/vibe/releases/download/v<version>/latest.json`, valida la versión y escribe `website/public/updater/<channel>.json`. Haz commit del archivo en `main`; el despliegue del sitio web lo publica.
- **Dev**: `.github/workflows/dev-build.yml` publica una versión preliminar con artefactos del actualizador y `latest.json`. `scripts/dev_manifest.py` lee la versión de dev completa más reciente y escribe `website/public/updater/dev.json`; una compilación de dev nueva despacha el despliegue del sitio web. Si la versión más reciente está incompleta o la llamada a la API falla, el `dev.json` anterior se mantiene.

`channel.py` se niega a mover un canal hacia atrás y entiende el orden de `-rc.<n>`.

## En la aplicación

- **Configuración → General → Actualizaciones** contiene el selector de canal, la versión actual, **Buscar actualizaciones**, la hora de la última comprobación y el resultado.
- La selección en tiempo de ejecución vive en `desktop/src-tauri/src/updater.rs`; el lado del webview es `desktop/src/providers/updater.tsx`.
- `desktop/src-tauri/src/updater.rs` consulta `updater/<channel>.json` directamente. Un `404` o `410` significa que el canal nunca se publicó; cualquier otro fallo es un error real.
- El punto de conexión estático del complemento de Tauri en `tauri.conf.json` es el respaldo que el propio complemento conoce; la elección de canal ocurre en el código de la aplicación.

## Límites

- El actualizador solo avanza hacia adelante. Una compilación defectuosa se corrige enviando una más nueva.
- Una instalación de Release o Beta que selecciona Dev ve «Actualizado»: cada compilación de dev se ordena por debajo de la versión que ya ejecuta. Cambiar a la línea de dev requiere una instalación manual de una compilación de dev; después, el canal Dev la actualiza hacia adelante.
- Una instalación Beta pasa a la versión final al cambiar a Release, donde `X.Y.Z` se ordena por encima de sus candidatas.
- Las aplicaciones compiladas antes de los archivos de canal (la línea 3.x original) siguen leyendo la versión de GitHub que esté marcada como «latest». `gh release edit --latest` es lo que se les envía, ejecutado al final.

Consulta [Publica una versión](../how-to/publish-a-release.md) y [Corta una compilación de dev](../how-to/cut-a-dev-build.md) para los procedimientos, y [la explicación](../explanation/update-channels.md) para saber por qué las líneas y los sufijos tienen esta forma.
