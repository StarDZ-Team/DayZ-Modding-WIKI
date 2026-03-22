# Capitulo 8.7: Publicar en el Steam Workshop

[Inicio](../README.md) | [<< Anterior: Depuracion y Pruebas](06-debugging-testing.md) | **Publicar en el Steam Workshop** | [Siguiente: Construyendo un HUD Overlay >>](08-hud-overlay.md)

---

> **Resumen:** Tu mod esta construido, probado y listo para el mundo. Este tutorial te guia a traves del proceso completo de publicacion de principio a fin: preparar tu carpeta de mod, firmar PBOs para compatibilidad multijugador, crear un item de Steam Workshop, subir via DayZ Tools o linea de comandos, y mantener actualizaciones a lo largo del tiempo. Al final, tu mod estara en vivo en el Workshop y sera jugable por cualquiera.

---

## Tabla de Contenidos

- [Introduccion](#introduccion)
- [Lista de Verificacion Pre-Publicacion](#lista-de-verificacion-pre-publicacion)
- [Paso 1: Preparar Tu Carpeta de Mod](#paso-1-preparar-tu-carpeta-de-mod)
- [Paso 2: Escribir un mod.cpp Completo](#paso-2-escribir-un-modcpp-completo)
- [Paso 3: Preparar Logo e Imagenes de Vista Previa](#paso-3-preparar-logo-e-imagenes-de-vista-previa)
- [Paso 4: Generar un Par de Claves](#paso-4-generar-un-par-de-claves)
- [Paso 5: Firmar Tus PBOs](#paso-5-firmar-tus-pbos)
- [Paso 6: Publicar via DayZ Tools Publisher](#paso-6-publicar-via-dayz-tools-publisher)
- [Publicar via Linea de Comandos (Alternativa)](#publicar-via-linea-de-comandos-alternativa)
- [Actualizar Tu Mod](#actualizar-tu-mod)
- [Mejores Practicas de Gestion de Versiones](#mejores-practicas-de-gestion-de-versiones)
- [Mejores Practicas para la Pagina del Workshop](#mejores-practicas-para-la-pagina-del-workshop)
- [Guia para Operadores de Servidor](#guia-para-operadores-de-servidor)
- [Distribucion Sin el Workshop](#distribucion-sin-el-workshop)
- [Problemas Comunes y Soluciones](#problemas-comunes-y-soluciones)
- [El Ciclo de Vida Completo del Mod](#el-ciclo-de-vida-completo-del-mod)
- [Proximos Pasos](#proximos-pasos)

---

## Introduccion

Publicar en el Steam Workshop es el paso final en el viaje del modding de DayZ. Todo lo que has aprendido en capitulos anteriores culmina aqui. Una vez que tu mod esta en el Workshop, cualquier jugador de DayZ puede suscribirse, descargarlo y jugar con el. Este capitulo cubre el proceso completo: preparar tu mod, firmar PBOs, subir y mantener actualizaciones.

---

## Lista de Verificacion Pre-Publicacion

Antes de subir cualquier cosa, revisa esta lista. Omitir items aqui causa los dolores de cabeza post-publicacion mas comunes.

- [ ] Todas las funcionalidades probadas en un **servidor dedicado** (no solo en un solo jugador)
- [ ] Multijugador probado: otro cliente puede unirse y usar las funcionalidades del mod
- [ ] Sin errores que rompan el juego en logs de script (`DayZDiag_x64.RPT` o `script_*.log`)
- [ ] Todas las declaraciones `Print()` de debug removidas o envueltas en `#ifdef DEVELOPER`
- [ ] Sin valores de prueba hardcodeados ni codigo experimental sobrante
- [ ] `stringtable.csv` contiene todos los strings visibles al usuario con traducciones
- [ ] `credits.json` llenado con informacion del autor y contribuidores
- [ ] Imagen de logo preparada (ver [Paso 3](#paso-3-preparar-logo-e-imagenes-de-vista-previa) para tamanos)
- [ ] Todas las texturas convertidas a formato `.paa` (no `.png`/`.tga` crudos en PBOs)
- [ ] Descripcion del Workshop e instrucciones de instalacion escritas
- [ ] Changelog iniciado (aunque sea solo "1.0.0 - Lanzamiento inicial")

---

## Paso 1: Preparar Tu Carpeta de Mod

Tu carpeta final de mod debe seguir exactamente la estructura esperada por DayZ.

### Estructura Requerida

```
@MyMod/
+-- addons/
|   +-- MyMod_Scripts.pbo
|   +-- MyMod_Scripts.pbo.MyMod.bisign
|   +-- MyMod_Data.pbo
|   +-- MyMod_Data.pbo.MyMod.bisign
+-- keys/
|   +-- MyMod.bikey
+-- mod.cpp
+-- meta.cpp  (auto-generado por el DayZ Launcher en la primera carga)
```

### Desglose de Carpetas

| Carpeta / Archivo | Proposito |
|---------------|---------|
| `addons/` | Contiene todos los archivos `.pbo` (contenido empacado del mod) y sus archivos de firma `.bisign` |
| `keys/` | Contiene la clave publica (`.bikey`) que los servidores usan para verificar tus PBOs |
| `mod.cpp` | Metadatos del mod: nombre, autor, version, descripcion, rutas de iconos |
| `meta.cpp` | Auto-generado por el DayZ Launcher; contiene el Workshop ID despues de publicar |

### Reglas Importantes

- El nombre de la carpeta **debe** comenzar con `@`. Asi es como DayZ identifica los directorios de mods.
- Cada `.pbo` en `addons/` debe tener un archivo `.bisign` correspondiente junto a el.
- El archivo `.bikey` en `keys/` debe corresponder a la clave privada usada para crear los archivos `.bisign`.
- **No** incluyas archivos fuente (scripts `.c`, texturas crudas, proyectos de Workbench) en la carpeta de subida. Solo los PBOs empacados pertenecen aqui.

---

## Paso 2: Escribir un mod.cpp Completo

El archivo `mod.cpp` le dice a DayZ y al launcher todo sobre tu mod. Un `mod.cpp` incompleto causa iconos faltantes, descripciones en blanco y problemas de visualizacion.

### Ejemplo Completo de mod.cpp

```cpp
name         = "My Awesome Mod";
picture      = "MyMod/Data/Textures/logo_co.paa";
logo         = "MyMod/Data/Textures/logo_co.paa";
logoSmall    = "MyMod/Data/Textures/logo_small_co.paa";
logoOver     = "MyMod/Data/Textures/logo_co.paa";
tooltip      = "My Awesome Mod - Adds cool features to DayZ";
overview     = "A comprehensive mod that adds new items, mechanics, and UI elements to DayZ.";
author       = "YourName";
overviewPicture = "MyMod/Data/Textures/overview_co.paa";
action       = "https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_WORKSHOP_ID";
version      = "1.0.0";
versionPath  = "MyMod/Data/version.txt";
```

### Referencia de Campos

| Campo | Obligatorio | Descripcion |
|-------|----------|-------------|
| `name` | Si | Nombre de display mostrado en la lista de mods del DayZ Launcher |
| `picture` | Si | Ruta a la imagen principal del logo (mostrada en el launcher). Relativa a la unidad P: o raiz del mod |
| `logo` | Si | Igual que picture en la mayoria de los casos; usado en algunos contextos de UI |
| `logoSmall` | No | Version mas pequena del logo para vistas compactas |
| `logoOver` | No | Estado hover del logo (frecuentemente igual que `logo`) |
| `tooltip` | Si | Descripcion corta de una linea mostrada al pasar el mouse en el launcher |
| `overview` | Si | Descripcion mas larga mostrada en el panel de detalles del mod |
| `author` | Si | Tu nombre o nombre de equipo |
| `overviewPicture` | No | Imagen grande mostrada en el panel de resumen del mod |
| `action` | No | URL abierta cuando el jugador hace clic en "Website" (tipicamente tu pagina del Workshop o GitHub) |
| `version` | Si | String de version actual (ej., `"1.0.0"`) |
| `versionPath` | No | Ruta a un archivo de texto que contiene el numero de version (para builds automatizados) |

### Errores Comunes

- **Punto y coma faltantes** al final de cada linea. Cada linea debe terminar con `;`.
- **Rutas de imagen incorrectas.** Las rutas son relativas a la raiz de la unidad P: al compilar. Despues de empacar, la ruta debe reflejar el prefijo del PBO. Prueba cargando el mod localmente antes de subir.
- **Olvidar actualizar la version** antes de re-subir. Siempre incrementa el string de version.

---

## Paso 3: Preparar Logo e Imagenes de Vista Previa

### Requisitos de Imagen

| Imagen | Tamano | Formato | Usado Para |
|-------|------|--------|----------|
| Logo del mod (`picture` / `logo`) | 512 x 512 px | `.paa` (en juego) | Lista de mods del DayZ Launcher |
| Logo pequeno (`logoSmall`) | 128 x 128 px | `.paa` (en juego) | Vistas compactas del launcher |
| Vista previa de Steam Workshop | 512 x 512 px | `.png` o `.jpg` | Miniatura de la pagina del Workshop |
| Imagen de resumen | 1024 x 512 px | `.paa` (en juego) | Panel de detalles del mod |

### Convertir Imagenes a PAA

DayZ usa texturas `.paa` internamente. Para convertir imagenes PNG/TGA:

1. Abre **TexView2** (incluido con DayZ Tools)
2. File > Open tu imagen `.png` o `.tga`
3. File > Save As > elige formato `.paa`
4. Guarda en el directorio `Data/Textures/` de tu mod

Addon Builder tambien puede auto-convertir texturas al empacar PBOs si esta configurado para binarizar.

### Consejos

- Usa un icono claro y reconocible que se lea bien en tamanos pequenos.
- Mantiene el texto en logos al minimo -- se vuelve ilegible a 128x128.
- La imagen de vista previa del Steam Workshop (`.png`/`.jpg`) es separada del logo en juego (`.paa`). La subes a traves del Publisher.

---

## Paso 4: Generar un Par de Claves

La firma de claves es **esencial** para multijugador. Casi todos los servidores publicos habilitan la verificacion de firmas, asi que sin firmas apropiadas los jugadores seran expulsados al unirse con tu mod.

### Como Funciona la Firma de Claves

- Creas un **par de claves**: un `.biprivatekey` (privado) y un `.bikey` (publico)
- Firmas cada `.pbo` con la clave privada, produciendo un archivo `.bisign`
- Distribuyes el `.bikey` con tu mod; los operadores de servidor lo colocan en su carpeta `keys/`
- Cuando un jugador se une, el servidor verifica cada `.pbo` contra su `.bisign` usando el `.bikey`

### Generar Claves con DayZ Tools

1. Abre **DayZ Tools** desde Steam
2. En la ventana principal, encuentra y haz clic en **DS Create Key** (a veces listado bajo Tools o Utilities)
3. Ingresa un **nombre de clave** -- usa el nombre de tu mod (ej., `MyMod`)
4. Elige donde guardar los archivos
5. Se crean dos archivos:
   - `MyMod.bikey` -- la **clave publica** (distribuye esta)
   - `MyMod.biprivatekey` -- la **clave privada** (mantiene esta en secreto)

### Generar Claves via Linea de Comandos

Tambien puedes usar la herramienta `DSCreateKey` directamente desde una terminal:

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSCreateKey.exe" MyMod
```

Esto crea `MyMod.bikey` y `MyMod.biprivatekey` en el directorio actual.

### Regla de Seguridad Critica

> **NUNCA compartas tu archivo `.biprivatekey`.** Cualquiera que tenga tu clave privada puede firmar PBOs modificados que los servidores aceptaran como legitimos. Almacenalo de forma segura y haz respaldo. Si lo pierdes, debes generar un nuevo par de claves, re-firmar todo, y los operadores de servidor deben actualizar sus claves.

---

## Paso 5: Firmar Tus PBOs

Cada archivo `.pbo` en tu mod debe ser firmado con tu clave privada. Esto produce archivos `.bisign` que se ubican junto a los PBOs.

### Firmar con DayZ Tools

1. Abre **DayZ Tools**
2. Encuentra y haz clic en **DS Sign File** (bajo Tools o Utilities)
3. Selecciona tu archivo `.biprivatekey`
4. Selecciona el archivo `.pbo` a firmar
5. Se crea un archivo `.bisign` junto al PBO (ej., `MyMod_Scripts.pbo.MyMod.bisign`)
6. Repite para cada `.pbo` en tu carpeta `addons/`

### Firmar via Linea de Comandos

Para automatizacion o multiples PBOs, usa la linea de comandos:

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe" MyMod.biprivatekey MyMod_Scripts.pbo
```

Para firmar todos los PBOs en una carpeta con un script batch:

```batch
@echo off
set DSSIGN="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe"
set KEY="path\to\MyMod.biprivatekey"

for %%f in (addons\*.pbo) do (
    echo Firmando %%f ...
    %DSSIGN% %KEY% "%%f"
)

echo Todos los PBOs firmados.
pause
```

### Despues de Firmar: Verificar Tu Carpeta

Tu carpeta `addons/` deberia verse asi:

```
addons/
+-- MyMod_Scripts.pbo
+-- MyMod_Scripts.pbo.MyMod.bisign
+-- MyMod_Data.pbo
+-- MyMod_Data.pbo.MyMod.bisign
```

Cada `.pbo` debe tener un `.bisign` correspondiente. Si falta algun `.bisign`, los jugadores seran expulsados de servidores con verificacion de firmas.

### Colocar la Clave Publica

Copia `MyMod.bikey` en tu carpeta `@MyMod/keys/`. Esto es lo que los operadores de servidor copiaran en el directorio `keys/` de su servidor para permitir tu mod.

---

## Paso 6: Publicar via DayZ Tools Publisher

DayZ Tools incluye un publisher de Workshop incorporado -- la forma mas facil de poner tu mod en Steam.

### Abrir el Publisher

1. Abre **DayZ Tools** desde Steam
2. Haz clic en **Publisher** en la ventana principal (tambien puede estar etiquetado como "Workshop Tool")
3. La ventana del Publisher se abre con campos para los detalles de tu mod

### Llenar los Detalles

| Campo | Que Ingresar |
|-------|---------------|
| **Title** | El nombre de display de tu mod (ej., "My Awesome Mod") |
| **Description** | Resumen detallado de lo que hace tu mod. Soporta formato BB code de Steam (ver abajo) |
| **Preview Image** | Navega a tu imagen de vista previa de 512 x 512 `.png` o `.jpg` |
| **Mod Folder** | Navega a tu carpeta completa `@MyMod` |
| **Tags** | Selecciona etiquetas relevantes (ej., Weapons, Vehicles, UI, Server, Gear, Maps) |
| **Visibility** | **Public** (cualquiera puede encontrarlo), **Friends Only**, o **Unlisted** (solo accesible via enlace directo) |

### Referencia Rapida de BB Code de Steam

La descripcion del Workshop soporta BB code:

```
[h1]Funcionalidades[/h1]
[list]
[*] Funcionalidad uno
[*] Funcionalidad dos
[/list]

[b]Negrita[/b]  [i]Cursiva[/i]  [code]Codigo[/code]
[url=https://example.com]Texto del enlace[/url]
[img]https://example.com/image.png[/img]
```

### Publicar

1. Revisa todos los campos una ultima vez
2. Haz clic en **Publish** (o **Upload**)
3. Espera a que la subida se complete. Mods grandes pueden tomar varios minutos dependiendo de tu conexion.
4. Una vez completo, veras una confirmacion con tu **Workshop ID** (un ID numerico largo como `2345678901`)
5. **Guarda este Workshop ID.** Lo necesitas para enviar actualizaciones despues.

### Despues de Publicar: Verificar

No omitas esto. Prueba tu mod como lo haria un jugador regular:

1. Visita `https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_ID` y verifica titulo, descripcion, imagen de vista previa
2. **Suscribete** a tu propio mod en el Workshop
3. Lanza DayZ, confirma que el mod aparece en el launcher
4. Habilitalo, lanza el juego, unete a un servidor (o ejecuta tu propio servidor de prueba)
5. Confirma que todas las funcionalidades funcionan
6. Actualiza el campo `action` en `mod.cpp` para apuntar a la URL de tu pagina del Workshop

Si algo esta roto, actualiza y re-sube antes de anunciar publicamente.

---

## Publicar via Linea de Comandos (Alternativa)

Para automatizacion, CI/CD o subidas en lote, SteamCMD proporciona una alternativa por linea de comandos.

### Instalar SteamCMD

Descarga desde el [sitio de desarrolladores de Valve](https://developer.valvesoftware.com/wiki/SteamCMD) y extrae a una carpeta como `C:\SteamCMD\`.

### Crear un Archivo VDF

SteamCMD usa un archivo `.vdf` para describir que subir. Crea un archivo llamado `workshop_publish.vdf`:

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "0"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "previewfile"    "C:\\Path\\To\\preview.png"
    "visibility"     "0"
    "title"          "My Awesome Mod"
    "description"    "A comprehensive mod for DayZ."
    "changenote"     "Initial release"
}
```

### Referencia de Campos

| Campo | Valor |
|-------|-------|
| `appid` | Siempre `221100` para DayZ |
| `publishedfileid` | `0` para un item nuevo; usa el Workshop ID para actualizaciones |
| `contentfolder` | Ruta absoluta a tu carpeta `@MyMod` |
| `previewfile` | Ruta absoluta a tu imagen de vista previa |
| `visibility` | `0` = Publico, `1` = Solo Amigos, `2` = No Listado, `3` = Privado |
| `title` | Nombre del mod |
| `description` | Descripcion del mod (texto plano) |
| `changenote` | Texto mostrado en el historial de cambios de la pagina del Workshop |

### Ejecutar SteamCMD

```batch
C:\SteamCMD\steamcmd.exe +login TuNombreDeUsuarioSteam +workshop_build_item "C:\Path\To\workshop_publish.vdf" +quit
```

SteamCMD pedira tu contrasena y codigo de Steam Guard en el primer uso. Despues de la autenticacion, sube el mod e imprime el Workshop ID.

### Cuando Usar Linea de Comandos

- **Builds automatizados:** integrar en un script de build que empaca PBOs, los firma y sube en un paso
- **Operaciones en lote:** subir multiples mods a la vez
- **Servidores headless:** ambientes sin GUI
- **Pipelines CI/CD:** GitHub Actions o similar pueden llamar SteamCMD

---

## Actualizar Tu Mod

### Proceso de Actualizacion Paso a Paso

1. **Haz tus cambios de codigo** y prueba exhaustivamente
2. **Incrementa la version** en `mod.cpp` (ej., `"1.0.0"` se convierte en `"1.0.1"`)
3. **Reconstruye todos los PBOs** usando Addon Builder o tu script de build
4. **Re-firma todos los PBOs** con la **misma clave privada** que usaste originalmente
5. **Abre el DayZ Tools Publisher**
6. Ingresa tu **Workshop ID** existente (o selecciona el item existente)
7. Apunta a tu carpeta actualizada `@MyMod`
8. Escribe una **nota de cambio** describiendo que cambio
9. Haz clic en **Publish / Update**

### Usar SteamCMD para Actualizaciones

Actualiza el archivo VDF con tu Workshop ID y una nueva nota de cambio:

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "2345678901"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "changenote"     "v1.0.1 - Corregido bug de duplicacion de items, agregada traduccion al frances"
}
```

Luego ejecuta SteamCMD como antes. El `publishedfileid` le dice a Steam que actualice el item existente en lugar de crear uno nuevo.

### Importante: Usar la Misma Clave

Siempre firma las actualizaciones con la **misma clave privada** que usaste para el lanzamiento original. Si firmas con una clave diferente, los operadores de servidor deben reemplazar el `.bikey` viejo con el nuevo -- lo que significa tiempo de inactividad y confusion. Solo genera un nuevo par de claves si tu clave privada esta comprometida.

---

## Mejores Practicas de Gestion de Versiones

### Versionado Semantico

Usa formato **MAJOR.MINOR.PATCH**:

| Componente | Cuando Incrementar | Ejemplo |
|-----------|-------------------|---------|
| **MAJOR** | Cambios que rompen compatibilidad: cambios de formato de config, funcionalidades removidas, revisiones de API | `1.0.0` a `2.0.0` |
| **MINOR** | Nuevas funcionalidades que son retrocompatibles | `1.0.0` a `1.1.0` |
| **PATCH** | Correcciones de bugs, ajustes pequenos, actualizaciones de traduccion | `1.0.0` a `1.0.1` |

### Formato de Changelog

Mantiene un changelog en tu descripcion del Workshop o un archivo separado. Un formato limpio:

```
v1.2.0 (2025-06-15)
- Agregado: Toggle de vision nocturna con keybind
- Agregado: Traducciones al aleman y espanol
- Corregido: Crash de inventario al soltar items apilados
- Cambiado: Reducida tasa de spawn por defecto de 5 a 3

v1.1.0 (2025-05-01)
- Agregado: Nuevas recetas de crafteo para 4 items
- Corregido: Crash del servidor al desconectar jugador durante comercio

v1.0.0 (2025-04-01)
- Lanzamiento inicial
```

### Retrocompatibilidad

Cuando tu mod guarda datos persistentes (configs JSON, archivos de datos de jugador), piensa cuidadosamente antes de cambiar el formato:

- **Agregar nuevos campos** es seguro. Usa valores por defecto para campos faltantes al cargar archivos viejos.
- **Renombrar o eliminar campos** es un cambio que rompe compatibilidad. Incrementa la version MAJOR.
- **Considera un patron de migracion:** detectar el formato viejo, convertir al nuevo formato, guardar.

Ejemplo de verificacion de migracion en Enforce Script:

```csharp
// En tu funcion de carga de config
if (config.configVersion < 2)
{
    // Migrar de v1 a v2: renombrar "oldField" a "newField"
    config.newField = config.oldField;
    config.configVersion = 2;
    SaveConfig(config);
    SDZ_Log.Info("MyMod", "Config migrada de v1 a v2");
}
```

### Etiquetado Git

Si usas Git para control de versiones (y deberias), etiqueta cada lanzamiento:

```bash
git tag -a v1.0.0 -m "Lanzamiento inicial"
git push origin v1.0.0
```

Esto crea un punto de referencia permanente para que siempre puedas volver al codigo exacto de cualquier version publicada.

---

## Mejores Practicas para la Pagina del Workshop

### Estructura de la Descripcion

Organiza tu descripcion con estas secciones:

1. **Resumen** -- que hace el mod, en 2-3 oraciones
2. **Funcionalidades** -- lista con vinetas de funcionalidades clave
3. **Requisitos** -- lista todos los mods dependencia con enlaces del Workshop
4. **Instalacion** -- paso a paso para jugadores (usualmente solo "suscribirse y habilitar")
5. **Configuracion del Servidor** -- instrucciones para operadores de servidor (ubicacion de claves, archivos de config)
6. **FAQ** -- preguntas comunes respondidas preventivamente
7. **Problemas Conocidos** -- se honesto sobre limitaciones actuales
8. **Soporte** -- enlace a tu Discord, issues de GitHub o hilo del foro
9. **Changelog** -- historial de versiones reciente
10. **Licencia** -- como otros pueden (o no) usar tu trabajo

### Capturas de Pantalla y Medios

- Incluye **3-5 capturas de pantalla en juego** mostrando tu mod en accion
- Si tu mod agrega UI, muestra los paneles de UI claramente
- Si tu mod agrega items, muestralos en juego (no solo en el editor)
- Un video corto de gameplay aumenta dramaticamente las suscripciones

### Dependencias

Si tu mod requiere otros mods, listalos claramente con enlaces del Workshop. Usa la funcionalidad "Required Items" del Steam Workshop para que el launcher cargue automaticamente las dependencias.

### Calendario de Actualizaciones

Establece expectativas. Si actualizas semanalmente, dilo. Si las actualizaciones son ocasionales, di "actualizaciones segun sea necesario." Los jugadores son mas comprensivos cuando saben que esperar.

---

## Guia para Operadores de Servidor

Incluye esta informacion en tu descripcion del Workshop para admins de servidor.

### Instalar un Mod del Workshop en un Servidor Dedicado

1. **Descarga el mod** usando SteamCMD o el cliente de Steam:
   ```batch
   steamcmd +login anonymous +workshop_download_item 221100 WORKSHOP_ID +quit
   ```
2. **Copia** (o crea un symlink) la carpeta `@ModName` al directorio del DayZ Server
3. **Copia el archivo `.bikey`** de `@ModName/keys/` a la carpeta `keys/` del servidor
4. **Agrega el mod** al parametro de lanzamiento `-mod=`

### Sintaxis del Parametro de Lanzamiento

Los mods se cargan via el parametro `-mod=`, separados por punto y coma:

```
-mod=@CF;@VPPAdminTools;@MyMod
```

Usa la **ruta relativa completa** desde la raiz del servidor. En Linux, las rutas distinguen mayusculas y minusculas.

### Orden de Carga

Los mods se cargan en el orden listado en `-mod=`. Esto importa cuando los mods dependen unos de otros:

- **Dependencias primero.** Si `@MyMod` requiere `@CF`, lista `@CF` antes de `@MyMod`.
- **Regla general:** frameworks primero, mods de contenido al final.
- Si tu mod declara `requiredAddons` en `config.cpp`, DayZ intentara resolver el orden de carga automaticamente, pero el ordenamiento explicito en `-mod=` es mas seguro.

### Gestion de Claves

- Coloca **un `.bikey` por mod** en el directorio `keys/` del servidor
- Cuando un mod se actualiza con la misma clave, no se necesita accion -- el `.bikey` existente sigue funcionando
- Si un autor de mod cambia claves, debes reemplazar el `.bikey` viejo con el nuevo
- La ruta de la carpeta `keys/` es relativa a la raiz del servidor (ej., `DayZServer/keys/`)

---

## Distribucion Sin el Workshop

### Cuando Omitir el Workshop

- **Mods privados** para tu propia comunidad de servidor
- **Pruebas beta** con un grupo pequeno antes del lanzamiento publico
- **Mods comerciales o licenciados** distribuidos por otros canales
- **Iteracion rapida** durante el desarrollo (mas rapido que re-subir cada vez)

### Crear un ZIP de Lanzamiento

Empaqueta tu mod para distribucion manual:

```
MyMod_v1.0.0.zip
+-- @MyMod/
    +-- addons/
    |   +-- MyMod_Scripts.pbo
    |   +-- MyMod_Scripts.pbo.MyMod.bisign
    |   +-- MyMod_Data.pbo
    |   +-- MyMod_Data.pbo.MyMod.bisign
    +-- keys/
    |   +-- MyMod.bikey
    +-- mod.cpp
```

Incluye un `README.txt` con instrucciones de instalacion:

```
INSTALACION:
1. Extrae la carpeta @MyMod en tu directorio del juego DayZ
2. (Operadores de servidor) Copia MyMod.bikey de @MyMod/keys/ a la carpeta keys/ de tu servidor
3. Agrega @MyMod a tu parametro de lanzamiento -mod=
```

### GitHub Releases

Si tu mod es de codigo abierto, usa GitHub Releases para alojar descargas versionadas:

1. Etiqueta el lanzamiento en Git (`git tag v1.0.0`)
2. Compila y firma PBOs
3. Crea un ZIP de la carpeta `@MyMod`
4. Crea un GitHub Release y adjunta el ZIP
5. Escribe notas de lanzamiento en la descripcion del release

Esto te da historial de versiones, conteo de descargas y una URL estable para cada lanzamiento.

---

## Problemas Comunes y Soluciones

| Problema | Causa | Solucion |
|---------|-------|-----|
| "Addon rejected by server" | Servidor sin `.bikey`, o `.bisign` no coincide con `.pbo` | Confirmar que `.bikey` esta en la carpeta `keys/` del servidor. Re-firmar PBOs con el `.biprivatekey` correcto. |
| "Signature check failed" | PBO modificado despues de firmar, o firmado con clave incorrecta | Reconstruir PBO desde fuente limpia. Re-firmar con la **misma clave** que genero el `.bikey` del servidor. |
| Mod no aparece en DayZ Launcher | `mod.cpp` malformado o estructura de carpeta incorrecta | Verificar `mod.cpp` por errores de sintaxis (`;` faltante). Asegurar que la carpeta comience con `@`. Reiniciar launcher. |
| La subida falla en Publisher | Problema de autenticacion, conexion o bloqueo de archivo | Verificar login de Steam. Cerrar Workbench/Addon Builder. Intentar ejecutar DayZ Tools como Administrador. |
| Icono del Workshop incorrecto/faltante | Ruta incorrecta en `mod.cpp` o formato de imagen incorrecto | Verificar que las rutas `picture`/`logo` apunten a archivos `.paa` reales. La vista previa del Workshop (`.png`) es separada. |
| Conflictos con otros mods | Redefinir clases vanilla en lugar de modificarlas | Usar `modded class`, llamar `super` en overrides, establecer `requiredAddons` para orden de carga. |
| Jugadores crashean al cargar | Errores de script, PBOs corruptos o dependencias faltantes | Verificar logs `.RPT`. Reconstruir PBOs desde fuente limpia. Verificar que las dependencias carguen primero. |

---

## El Ciclo de Vida Completo del Mod

```
IDEA -> SETUP (8.1) -> ESTRUCTURA (8.1, 8.5) -> CODIGO (8.2, 8.3, 8.4) -> BUILD (8.1)
  -> PROBAR -> DEBUG (8.6) -> PULIR -> FIRMAR (8.7) -> PUBLICAR (8.7) -> MANTENER (8.7)
                                    ^                                    |
                                    +------ bucle de feedback -----------+
```

Despues de publicar, el feedback de los jugadores te envia de vuelta a CODIGO, PROBAR y DEBUG. Ese ciclo de publicar-feedback-mejorar es como se construyen los grandes mods.

---

## Proximos Pasos

Has completado la serie completa de tutoriales de modding de DayZ -- desde un espacio de trabajo vacio hasta un mod publicado, firmado y mantenido en el Steam Workshop. Desde aqui:

- **Explora los capitulos de referencia** (Capitulos 1-7) para conocimiento mas profundo sobre el sistema de GUI, config.cpp y Enforce Script
- **Estudia mods de codigo abierto** como CF, Community Online Tools y Expansion para patrones avanzados
- **Unete a la comunidad de modding de DayZ** en Discord y los foros de Bohemia Interactive
- **Construye mas grande.** Tu primer mod fue Hello World. El siguiente podria ser una revision completa del gameplay.

Las herramientas estan en tus manos. Construye algo grandioso.
