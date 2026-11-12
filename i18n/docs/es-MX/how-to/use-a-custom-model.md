<!-- source: aa8415261690 -->

# Importa un modelo personalizado

Vibe ejecuta modelos GGUF a través del motor incluido. El catálogo en **Configuración → Modelos** cubre las familias probadas; esta guía agrega uno que el catálogo no incluye. [Modelos](/vibe/docs#models) es la referencia de lo que admite cada familia.

## Descarga desde una URL

1. Abre **Configuración → Modelos**.
1. Pega un enlace directo al modelo en **Descargar modelo** y confirma.
1. Espera a que termine la descarga; el archivo queda en el directorio de modelos.
1. Selecciona el nuevo modelo en la lista de modelos.

Vibe también acepta la misma solicitud como enlace profundo:

```text
vibe://download/?url=https://example.com/model.gguf
```

Una URL pegada no incluye tamaño ni suma de comprobación, así que Vibe verifica los bytes descargados y la cabecera GGUF/BIN antes de aceptar el archivo. Las entradas del catálogo en [Modelos](/vibe/docs#models) incluyen una revisión fijada, el tamaño y el SHA-256.

## Usa un archivo en disco

1. Coloca el archivo `.gguf` en el directorio de modelos. La ruta del directorio está en **Configuración → Modelos → Directorio de Modelos**, que también lo abre.
1. Vuelve a **Configuración → Modelos**; el archivo aparece en la lista de instalados.
1. Selecciónalo.

Mueve o cambia el nombre del directorio solo con **Cambiar el directorio de los modelos** y luego vuelve a seleccionar el modelo.

## Cuando un modelo no se carga

- El archivo debe ser GGUF o el contenedor `.bin` heredado que acepta el motor.
- Un modelo que requiere un transcribe.cpp más reciente que el incluido aparece en el catálogo, pero aún no se puede cargar.
- Un modelo con un idioma fijo rechaza otro idioma; el error indica el admitido.

## Próximos pasos

- [Modelos](/vibe/docs#models) para el catálogo probado y los límites por familia.
- [Línea de comandos](/vibe/docs#cli) para ejecutar un modelo sin la ventana.
