<!-- source: dc7efd39c01b -->

# Por qué los canales de actualización funcionan así

GitHub tiene una sola «última versión». Vibe necesita tres líneas —Release, Beta y Dev— entre las que un usuario pueda cambiar, incluso desde una instalación anterior. Esa discrepancia impulsa el diseño de los canales.

## Por qué el sitio web y no GitHub

La aplicación lee `updater/<channel>.json` del sitio web. Cada archivo es el `latest.json` que produjo una compilación de versión final, copiado junto a los demás:

- Release → `stable.json`
- Beta → `beta.json`
- Dev → `dev.json`

Un archivo de canal es un recurso estático desplegado con el sitio, así que apuntar una línea a una compilación es un commit, no una edición de la versión. También permite que un canal ausente signifique algo preciso: un `404` o un `410` es "nada en esta línea", que la aplicación informa como actualizado. Si la aplicación recurriera a otro canal cuando falta un archivo, un usuario de Beta sin candidata pasaría silenciosamente a Release.

## Por qué el sufijo beta es `-rc.<n>`

Semver ordena:

```text
X.Y.Z-dev.N < X.Y.Z-rc.N < X.Y.Z
```

Ese orden es la razón completa de la grafía. Con la comparación estricta del actualizador, Dev → Beta → Release siempre avanza hacia adelante; no se necesita ninguna excepción especial.

Una línea anterior usaba `-beta.N`, pero no tenía canal dev. `X.Y.Z-beta.N` se ordena por encima de `X.Y.Z-dev.N`, así que una compilación beta parecería más nueva que todas las compilaciones dev y rompería el cambio. El canal beta conserva su nombre; solo el sufijo de versión es `-rc.<n>`.

## Por qué beta solo contiene candidatas

Solo una versión `X.Y.Z-rc.<n>` se escribe en `beta.json`; una versión final sin sufijo se rechaza. Esto mantiene significativa la línea beta: es la línea de candidatas, no una segunda línea estable. Después de una versión estable, una instalación Beta pasa a la final al cambiar su canal a Release, donde `X.Y.Z` se ordena por encima de sus candidatas.

## Actualizaciones solo hacia adelante

El actualizador solo avanza hacia adelante. Una versión defectuosa se corrige enviando una más nueva, que es para lo que sirve la línea beta: detectarla antes de que llegue a Release. Por eso también una instalación de Release o Beta que selecciona Dev ve "Actualizado": cada compilación de dev se ordena debajo de la versión que ya ejecuta. Cambiar a la línea de dev requiere instalar manualmente una compilación de dev; después, el canal Dev la actualiza hacia adelante.

## Contrapartidas

- **Manifiestos copiados** significan que un cambio de canal es un commit en `main` más un despliegue del sitio, no una llamada a la API. La demora es de minutos y el historial se puede revisar.
- **Sin respaldo entre canales** significa que el usuario ve un "Actualizado" preciso en lugar de una degradación inesperada o un salto entre líneas.
- **Dev requiere una instalación manual** es el precio de mantener honesto el orden de semver. Automatizarlo necesitaría un concepto de canal que los clientes antiguos no tienen.

## Páginas relacionadas

- [Canales de actualización](/vibe/docs#update-channels) para los archivos y las reglas de versiones.
- [Cambia de canal de actualización](/vibe/docs#switch-update-channels) para los pasos.
