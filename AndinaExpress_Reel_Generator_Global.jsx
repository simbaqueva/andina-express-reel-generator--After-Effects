{
    // ============================================================================
    // ANDINA EXPRESS REEL GENERATOR — VERSIÓN GLOBAL/DINÁMICA
    // ----------------------------------------------------------------------------
    // - CERO productos fijos: cada imagen PNG encontrada se convierte en un
    //   producto automáticamente (la cantidad depende solo de las imágenes).
    // - Tú defines el nombre y el precio de cada producto en la ventana.
    // - Tú eliges la imagen de fondo, el audio y la duración del reel.
    // - Funciona con cualquier cantidad de carpetas y cualquier cantidad de
    //   archivos (más, menos, u otros productos).
    // ============================================================================

    // ============================================================================
    // UTILIDADES DE BÚSQUEDA DE ARCHIVOS (recursivas)
    // ============================================================================

    function getFilesRecursive(folder, extensions, fileList) {
        if (fileList === undefined) fileList = [];
        var files = folder.getFiles();
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f instanceof Folder) {
                getFilesRecursive(f, extensions, fileList);
            } else if (f instanceof File) {
                if (f.name.indexOf("~") === 0) continue; // omitir temporales
                var dot = f.name.lastIndexOf(".");
                if (dot < 0) continue;
                var ext = f.name.substr(dot + 1).toLowerCase();
                for (var j = 0; j < extensions.length; j++) {
                    if (ext === extensions[j]) {
                        fileList.push(f);
                        break;
                    }
                }
            }
        }
        return fileList;
    }

    // ============================================================================
    // VENTANA 1 — SELECCIÓN DE CARPETAS
    // ============================================================================

    var win1 = new Window("dialog", "Paso 1 de 2 — Seleccionar Carpetas");
    win1.orientation = "column";
    win1.alignChildren = ["fill", "fill"];
    win1.spacing = 8;
    win1.margins = 14;

    var header1 = win1.add("statictext", undefined,
        "Seleccione UNA o VARIAS carpetas que contengan los recursos:\n" +
        "- Imágenes de productos (PNG)  ->  cada PNG sera un producto del reel\n" +
        "- Imagen de fondo (JPG/JPEG)   ->  opcional\n" +
        "- Audio (MP3/MPEG/WAV/M4A)     ->  opcional\n\n" +
        "Se buscara en las carpetas y en todas sus subcarpetas.");
    header1.alignment = "left";

    var list1 = win1.add("listbox", undefined, "", { numberOfColumns: 1, showHeaders: false });
    list1.preferredSize = [520, 140];
    list1.alignment = "fill";

    var btnRow1 = win1.add("group");
    btnRow1.alignment = "left";
    btnRow1.spacing = 6;

    var addBtn1 = btnRow1.add("button", undefined, "Agregar carpeta...");
    var remBtn1 = btnRow1.add("button", undefined, "Quitar seleccionada");
    var clrBtn1 = btnRow1.add("button", undefined, "Limpiar todas");

    var actionRow1 = win1.add("group");
    actionRow1.alignment = "right";
    actionRow1.spacing = 8;
    var okBtn1 = actionRow1.add("button", undefined, "Listo (continuar)", { name: "ok" });
    var cancelBtn1 = actionRow1.add("button", undefined, "Cancelar", { name: "cancel" });

    var selectedFolders = [];
    var continueFlow = false;

    function refreshList1() {
        list1.removeAll();
        for (var i = 0; i < selectedFolders.length; i++) {
            list1.add("item", selectedFolders[i].fsName);
        }
    }

    addBtn1.onClick = function () {
        var folder = Folder.selectDialog("Seleccione una carpeta con recursos");
        if (folder != null) {
            var dup = false;
            for (var i = 0; i < selectedFolders.length; i++) {
                if (selectedFolders[i].fsName === folder.fsName) { dup = true; break; }
            }
            if (!dup) {
                selectedFolders.push(folder);
                refreshList1();
            }
        }
    };

    remBtn1.onClick = function () {
        if (list1.selection != null) {
            selectedFolders.splice(list1.selection.index, 1);
            refreshList1();
        }
    };

    clrBtn1.onClick = function () {
        selectedFolders = [];
        refreshList1();
    };

    okBtn1.onClick = function () {
        if (selectedFolders.length === 0) {
            alert("Debe seleccionar al menos una carpeta.");
            return;
        }
        continueFlow = true;
        win1.close();
    };

    cancelBtn1.onClick = function () {
        win1.close();
    };

    win1.center();
    win1.show();

    // ============================================================================
    // SI EL USUARIO CANCELO EN EL PASO 1, SALIR
    // ============================================================================

    if (!continueFlow) {
        // No hacer nada
    } else {

        // ---- Escanear archivos en todas las carpetas seleccionadas ----
        var pngFiles = [];
        var jpgFiles = [];
        var audioFiles = [];

        var pngExts   = ["png"];
        var jpgExts   = ["jpg", "jpeg"];
        var audioExts = ["mpeg", "mp3", "wav", "m4a", "aac", "ogg", "mp4"];

        for (var s = 0; s < selectedFolders.length; s++) {
            getFilesRecursive(selectedFolders[s], pngExts, pngFiles);
            getFilesRecursive(selectedFolders[s], jpgExts, jpgFiles);
            getFilesRecursive(selectedFolders[s], audioExts, audioFiles);
        }

        if (pngFiles.length === 0) {
            alert("No se encontraron imagenes PNG en las carpetas seleccionadas.\n" +
                  "El reel necesita al menos una imagen de producto (PNG).");
        } else {

            // ---- Obtener lista de fuentes instaladas en el sistema (AE 2024+) ----
            var fontList = []; // { label: "Familia - Estilo", psName: "PostScriptName" }
            try {
                if (app.fonts && app.fonts.allFonts) {
                    var allFontsArr = app.fonts.allFonts;
                    for (var fi = 0; fi < allFontsArr.length; fi++) {
                        var fo = allFontsArr[fi];
                        var label = fo.fontFamilyName;
                        if (fo.fontStyleName && fo.fontStyleName !== "") {
                            label += " - " + fo.fontStyleName;
                        }
                        fontList.push({ label: label, psName: fo.postscriptName });
                    }
                    fontList.sort(function (a, b) {
                        if (a.label < b.label) return -1;
                        if (a.label > b.label) return 1;
                        return 0;
                    });
                }
            } catch (eFonts) {
                fontList = [];
            }

            // ====================================================================
            // VENTANA 2 — CONFIGURACION DE PRODUCTOS, FONDO, AUDIO Y DURACION
            // ====================================================================

            var win2 = new Window("dialog", "Paso 2 de 2 — Configurar Reel (" + pngFiles.length + " productos)");
            win2.orientation = "column";
            win2.alignChildren = ["fill", "fill"];
            win2.spacing = 8;
            win2.margins = 14;

            // --- Seccion: productos ---
            var prodHeader = win2.add("statictext", undefined,
                "Cada imagen PNG encontrada es un producto.\n" +
                "Seleccione un producto en la lista y edite su nombre y precio.");
            prodHeader.alignment = "left";

            var prodList = win2.add("listbox", undefined, "", { numberOfColumns: 1, showHeaders: false });
            prodList.preferredSize = [560, 160];
            prodList.alignment = "fill";

            var editRow = win2.add("group");
            editRow.alignment = "fill";
            editRow.spacing = 8;
            editRow.margins = 0;

            var nameGroup = editRow.add("group");
            nameGroup.orientation = "column";
            nameGroup.alignment = "left";
            nameGroup.spacing = 3;
            nameGroup.add("statictext", undefined, "Nombre del producto:");
            var nameInput = nameGroup.add("edittext", undefined, "");
            nameInput.preferredSize = [320, 24];
            nameInput.alignment = "fill";

            var priceGroup = editRow.add("group");
            priceGroup.orientation = "column";
            priceGroup.alignment = "left";
            priceGroup.spacing = 3;
            priceGroup.add("statictext", undefined, "Precio:");
            var priceInput = priceGroup.add("edittext", undefined, "$");
            priceInput.preferredSize = [160, 24];
            priceInput.alignment = "fill";

            // --- Seccion: fondo, audio, duracion ---
            var cfgPanel = win2.add("panel", undefined, "Configuracion general");
            cfgPanel.orientation = "column";
            cfgPanel.alignment = "fill";
            cfgPanel.spacing = 8;
            cfgPanel.margins = 12;

            var bgRow = cfgPanel.add("group");
            bgRow.alignment = "left";
            bgRow.spacing = 8;
            bgRow.add("statictext", undefined, "Fondo (JPG):");
            var bgDropdown = bgRow.add("dropdownlist", undefined, []);
            bgDropdown.preferredSize = [420, 22];
            bgDropdown.alignment = "fill";

            var audioRow = cfgPanel.add("group");
            audioRow.alignment = "left";
            audioRow.spacing = 8;
            audioRow.add("statictext", undefined, "Audio:");
            var audioDropdown = audioRow.add("dropdownlist", undefined, []);
            audioDropdown.preferredSize = [420, 22];
            audioDropdown.alignment = "fill";

            var durRow = cfgPanel.add("group");
            durRow.alignment = "left";
            durRow.spacing = 8;
            durRow.add("statictext", undefined, "Duracion total (segundos):");
            var durInput = durRow.add("edittext", undefined, "60");
            durInput.preferredSize = [80, 24];

            var nameFontRow = cfgPanel.add("group");
            nameFontRow.alignment = "left";
            nameFontRow.spacing = 8;
            nameFontRow.add("statictext", undefined, "Fuente del nombre:");
            var nameFontDropdown = nameFontRow.add("dropdownlist", undefined, []);
            nameFontDropdown.preferredSize = [420, 22];
            nameFontDropdown.alignment = "fill";

            var priceFontRow = cfgPanel.add("group");
            priceFontRow.alignment = "left";
            priceFontRow.spacing = 8;
            priceFontRow.add("statictext", undefined, "Fuente del precio:");
            var priceFontDropdown = priceFontRow.add("dropdownlist", undefined, []);
            priceFontDropdown.preferredSize = [420, 22];
            priceFontDropdown.alignment = "fill";

            // --- Llenar dropdowns de fuente ---
            nameFontDropdown.add("item", "(Predeterminada de After Effects)");
            priceFontDropdown.add("item", "(Predeterminada de After Effects)");
            if (fontList.length === 0) {
                nameFontDropdown.add("item", "(No se pudo leer la lista de fuentes del sistema)");
                priceFontDropdown.add("item", "(No se pudo leer la lista de fuentes del sistema)");
            } else {
                for (var fl = 0; fl < fontList.length; fl++) {
                    nameFontDropdown.add("item", fontList[fl].label);
                    priceFontDropdown.add("item", fontList[fl].label);
                }
            }
            nameFontDropdown.selection = 0;
            priceFontDropdown.selection = 0;

            // --- Botones finales ---
            var actionRow2 = win2.add("group");
            actionRow2.alignment = "right";
            actionRow2.spacing = 8;
            var okBtn2 = actionRow2.add("button", undefined, "Generar Reel", { name: "ok" });
            var cancelBtn2 = actionRow2.add("button", undefined, "Cancelar", { name: "cancel" });

            // --- Datos de productos (nombres y precios editables) ---
            var productNames = [];
            var productPrices = [];
            for (var pi = 0; pi < pngFiles.length; pi++) {
                var baseName = pngFiles[pi].name.replace(/\.[^\.]+$/, "");
                baseName = baseName.replace(/[-_]+/g, " ");
                productNames.push(baseName);
                productPrices.push("$");
                prodList.add("item", pngFiles[pi].name + "   ->   " + baseName);
            }

            // --- Llenar dropdowns de fondo y audio (opcion "(Ninguno)" primero) ---
            bgDropdown.add("item", "(Ninguno)");
            for (var b = 0; b < jpgFiles.length; b++) {
                bgDropdown.add("item", jpgFiles[b].name);
            }
            bgDropdown.selection = 0;

            audioDropdown.add("item", "(Ninguno)");
            for (var a = 0; a < audioFiles.length; a++) {
                audioDropdown.add("item", audioFiles[a].name);
            }
            audioDropdown.selection = 0;

            // --- Cargar nombre/precio al seleccionar un producto ---
            var lastSelectedIndex = -1;

            function saveProductAt(idx) {
                if (idx != null && idx >= 0) {
                    productNames[idx] = nameInput.text;
                    productPrices[idx] = priceInput.text;
                }
            }

            function loadCurrentProduct() {
                if (prodList.selection != null) {
                    var idx = prodList.selection.index;
                    nameInput.text = productNames[idx];
                    priceInput.text = productPrices[idx];
                    lastSelectedIndex = idx;
                }
            }

            prodList.onChange = function () {
                saveProductAt(lastSelectedIndex);
                loadCurrentProduct();
            };

            // Cargar el primer producto por defecto
            if (prodList.items.length > 0) {
                prodList.selection = prodList.items[0];
                loadCurrentProduct();
            }

            var generateReel = false;

            okBtn2.onClick = function () {
                saveProductAt(lastSelectedIndex);

                // Validar nombres
                var emptyNames = 0;
                for (var n = 0; n < productNames.length; n++) {
                    if (productNames[n] === "") emptyNames++;
                }
                if (emptyNames > 0) {
                    if (!confirm(emptyNames + " producto(s) no tienen nombre.\n" +
                        "Desea continuar de todas formas con esos productos vacios?")) {
                        return;
                    }
                }

                // Validar duracion
                var durVal = parseFloat(durInput.text);
                if (isNaN(durVal) || durVal <= 0) {
                    alert("La duracion debe ser un numero mayor que 0.");
                    return;
                }

                generateReel = true;
                win2.close();
            };

            cancelBtn2.onClick = function () {
                win2.close();
            };

            win2.center();
            win2.show();

            // ====================================================================
            // GENERAR EL REEL (solo si el usuario pulso "Generar Reel")
            // ====================================================================

            if (generateReel) {

                var compName = "Product Reel";
                var compWidth = 1080;
                var compHeight = 1920; // Vertical para Reel
                var durationTotal = parseFloat(durInput.text);
                var frameRate = 30;
                var numProducts = pngFiles.length;

                app.beginUndoGroup("Andina Express Product Reel (Global)");

                var project = app.project;
                var myComp = project.items.addComp(compName, compWidth, compHeight, 1, durationTotal, frameRate);

                // Distribuir los productos uniformemente a lo largo del video
                var segment = durationTotal / numProducts;

                // Fondo
                var bgFile = null;
                if (bgDropdown.selection != null && bgDropdown.selection.index > 0) {
                    bgFile = jpgFiles[bgDropdown.selection.index - 1];
                    var bgImport = project.importFile(new ImportOptions(bgFile));
                    var bgLayer = myComp.layers.add(bgImport);
                    bgLayer.scale.setValue([100, 100]);
                }

                // Audio
                var audioFile = null;
                if (audioDropdown.selection != null && audioDropdown.selection.index > 0) {
                    audioFile = audioFiles[audioDropdown.selection.index - 1];
                    var audioImport = project.importFile(new ImportOptions(audioFile));
                    myComp.layers.add(audioImport);
                }

                // Productos (uno por cada PNG)
                for (var i = 0; i < numProducts; i++) {
                    var startTime = i * segment;
                    var endTime = (i < numProducts - 1) ? (i + 1) * segment : durationTotal;

                    var imgImport = project.importFile(new ImportOptions(pngFiles[i]));
                    var imgLayer = myComp.layers.add(imgImport);

                    imgLayer.startTime = startTime;
                    imgLayer.inPoint = startTime;
                    imgLayer.outPoint = endTime;

                    imgLayer.property("Position").setValue([compWidth / 2, compHeight / 2 - 100]);
                    var scaleFactor = 400 / imgLayer.width * 100;
                    imgLayer.property("Scale").setValue([scaleFactor, scaleFactor]);

                    // Texto del nombre
                    var nameText = myComp.layers.addText(productNames[i]);
                    nameText.startTime = startTime;
                    nameText.inPoint = startTime;
                    nameText.outPoint = endTime;
                    nameText.property("Position").setValue([compWidth / 2, compHeight / 2 + 250]);

                    var nameDoc = nameText.property("Source Text").value;
                    nameDoc.fontSize = 60;
                    nameDoc.fillColor = [1, 1, 1];
                    nameDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
                    if (nameFontDropdown.selection != null && nameFontDropdown.selection.index > 0 && fontList.length > 0) {
                        try {
                            nameDoc.font = fontList[nameFontDropdown.selection.index - 1].psName;
                        } catch (eNameFont) {}
                    }
                    nameText.property("Source Text").setValue(nameDoc);

                    // Texto del precio
                    var priceText = myComp.layers.addText(productPrices[i]);
                    priceText.startTime = startTime;
                    priceText.inPoint = startTime;
                    priceText.outPoint = endTime;
                    priceText.property("Position").setValue([compWidth / 2, compHeight / 2 + 350]);

                    var priceDoc = priceText.property("Source Text").value;
                    priceDoc.fontSize = 80;
                    priceDoc.fillColor = [1, 0, 0]; // Precio en rojo
                    priceDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
                    if (priceFontDropdown.selection != null && priceFontDropdown.selection.index > 0 && fontList.length > 0) {
                        try {
                            priceDoc.font = fontList[priceFontDropdown.selection.index - 1].psName;
                        } catch (ePriceFont) {}
                    }
                    priceText.property("Source Text").setValue(priceDoc);
                }

                alert(
                    "Reel generado correctamente.\n\n" +
                    "- Productos: " + numProducts + "\n" +
                    "- Duracion: " + durationTotal + " segundos (" + (segment).toFixed(1) + " s por producto)\n" +
                    "- Fondo: " + (bgFile != null ? "Si" : "No") + "\n" +
                    "- Audio: " + (audioFile != null ? "Si" : "No")
                );

                app.endUndoGroup();
            }
        }
    }
}