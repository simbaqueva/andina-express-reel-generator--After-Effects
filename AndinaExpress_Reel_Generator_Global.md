# Análisis del script `AndinaExpress_Reel_Generator_Global.jsx`

## ¿Qué hace este script?

Es un **generador automático de reels de productos** para la empresa **Andina Express**. Su función es crear automáticamente una composición de video vertical (1080×1920, formato tipo Instagram Reels) en Adobe After Effects, donde:

- **Cada imagen PNG** que encuentres en las carpetas seleccionadas se convierte en un **producto** del reel.
- Cada producto se muestra durante un segmento del video con su **nombre** (texto blanco) y su **precio** (texto rojo).
- Puedes elegir una **imagen de fondo** (JPG) y un **audio** (música) opcionales.
- Puedes configurar la **duración total** del reel y las **fuentes tipográficas** para nombre y precio.

Es la versión "Global/Dinámica": **no tiene productos fijos** — funciona con cualquier cantidad de imágenes, carpetas y subcarpetas.

## ¿Para qué programa es?

Es un script de **Adobe After Effects** escrito en **ExtendScript** (JavaScript de Adobe, extensión `.jsx`). Utiliza APIs exclusivas de After Effects como `app.project`, `app.beginUndoGroup()`, `project.items.addComp()`, `project.importFile()`, `myComp.layers.addText()`, y ventanas de interfaz **ScriptUI** (`new Window("dialog", ...)`).

## ¿Cómo funciona? (flujo paso a paso)

1. **Paso 1 — Selección de carpetas**: Se abre una ventana donde eliges una o varias carpetas. El script las escanea **recursivamente** (incluye subcarpetas) buscando:
   - Imágenes **PNG** → cada una será un producto
   - Imágenes **JPG/JPEG** → fondo opcional
   - Archivos de **audio** (MP3, MPEG, WAV, M4A, AAC, OGG, MP4) → música opcional

2. **Paso 2 — Configuración**: Se abre una segunda ventana donde:
   - Seleccionas cada producto de la lista y editas su **nombre** y **precio**
   - Eliges el **fondo**, el **audio**, la **duración total** (por defecto 60 s) y las **fuentes** de nombre/precio (lista de fuentes del sistema, disponible en AE 2024+)

3. **Generación**: Al pulsar "Generar Reel", el script:
   - Crea una composición de **1080×1920 px a 30 fps** con la duración indicada
   - Divide el tiempo total **equitativamente** entre todos los productos
   - Importa y coloca cada imagen PNG centrada (escalada a 400 px de ancho)
   - Añade el **texto del nombre** (tamaño 60, blanco, centrado) debajo de la imagen
   - Añade el **texto del precio** (tamaño 80, rojo, centrado) más abajo
   - Añade el fondo y el audio si fueron seleccionados
   - Muestra un resumen final con la cantidad de productos, duración, etc.

## ¿Cómo ejecutarlo?

1. Abre **Adobe After Effects**.
2. Ve a **Archivo → Scripts → Run Script File…** (File → Scripts → Run Script File…).
3. Selecciona el archivo `AndinaExpress_Reel_Generator_Global.jsx`.
4. Sigue los dos pasos de las ventanas que aparecen.

**Alternativas**:
- Coloca el archivo en la carpeta de scripts de AE (`.../Support Files/Scripts/ScriptUI Panels` o `.../Scripts`) para que aparezca en el menú de Scripts.
- También puedes ejecutarlo desde el **ExtendScript Toolkit** o desde **VS Code con la extensión ExtendScript Debugger**.

## Requisitos previos

| Requisito | Detalle |
|---|---|
| **Adobe After Effects** | Cualquier versión reciente. La lista de fuentes del sistema requiere **AE 2024 o superior** (si no, el script usa la fuente predeterminada sin fallar). |
| **Imágenes de producto** | Al menos **1 archivo PNG** (obligatorio). Cada PNG = 1 producto. |
| **Imagen de fondo** | Opcional — archivo **JPG/JPEG**. |
| **Audio** | Opcional — **MP3, MPEG, WAV, M4A, AAC, OGG o MP4**. |
| **Carpetas organizadas** | Los archivos pueden estar en cualquier carpeta o subcarpeta; se escanean recursivamente. |
| **Sistema operativo** | Windows o macOS (usa diálogos nativos de AE). |

**Nota importante**: El script no exporta el video final — solo **crea la composición** dentro de After Effects. Para obtener el archivo de video (MP4), deberás renderizarlo manualmente con el **Render Queue** o **Adobe Media Encoder** después de ejecutar el script.