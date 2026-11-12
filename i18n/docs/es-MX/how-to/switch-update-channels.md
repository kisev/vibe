<!-- source: bc1a1519974a -->

# Cambia de canal de actualización

Vibe consulta uno de tres canales de actualización: Release, Beta o Dev. El canal decide qué compilaciones ofrece la aplicación y solo avanza hacia adelante.

## Elige un canal

1. Abre **Configuración → General → Actualizaciones**.
1. Elige **Release**, **Beta** o **Dev**.
1. Presiona **Buscar actualizaciones**.

La misma sección muestra la versión instalada, la hora de la última comprobación y el resultado. La comprobación también se ejecuta al iniciar.

## Qué ofrece cada canal

| Canal | Compilaciones |
| --- | --- |
| Release | Versiones estables |
| Beta | Candidatas a versión final de la siguiente versión estable |
| Dev | Las compilaciones `dev` más recientes |

Una instalación de Release o Beta que selecciona Dev ve **Actualizado**: cada compilación de dev se ordena debajo de la versión que ya ejecuta. Cambiar a la línea de dev requiere instalar manualmente una compilación de dev; después, el canal Dev la actualiza hacia adelante.

Una instalación Beta pasa a la versión final al cambiar a Release, donde la versión estable se ordena por encima de sus candidatas.

## Próximos pasos

- [Canales de actualización](/vibe/docs#update-channels) para los archivos de canal y las reglas de etiquetas.
- [Por qué los canales de actualización funcionan así](/vibe/docs#update-channels-design) para el orden de versiones.
