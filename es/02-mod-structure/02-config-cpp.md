# Capitulo 2.2: config.cpp a Fondo

[Inicio](../README.md) | [<< Anterior: La Jerarquia de 5 Capas de Scripts](01-five-layers.md) | **config.cpp a Fondo** | [Siguiente: mod.cpp & Workshop >>](03-mod-cpp.md)

---

## Tabla de Contenidos

- [Vision General](#vision-general)
- [Donde Reside config.cpp](#donde-reside-configcpp)
- [Bloque CfgPatches](#bloque-cfgpatches)
- [Bloque CfgMods](#bloque-cfgmods)
- [class defs: Rutas de Modulos de Script](#class-defs-rutas-de-modulos-de-script)
- [class defs: imageSets y widgetStyles](#class-defs-imagesets-y-widgetstyles)
- [Array defines](#array-defines)
- [CfgVehicles: Definiciones de Items y Entidades](#cfgvehicles-definiciones-de-items-y-entidades)
- [CfgSoundSets y CfgSoundShaders](#cfgsoundsets-y-cfgsoundshaders)
- [CfgAddons: Declaraciones de Precarga](#cfgaddons-declaraciones-de-precarga)
- [Ejemplos Reales de Mods Profesionales](#ejemplos-reales-de-mods-profesionales)
- [Errores Comunes](#errores-comunes)
- [Plantilla Completa](#plantilla-completa)

---

## Vision General

Un mod de DayZ tipicamente tiene uno o mas archivos PBO, cada uno conteniendo un `config.cpp` en su raiz. El motor lee estos configs durante el arranque para determinar:

1. **De que depende tu mod** (CfgPatches)
2. **Donde estan tus scripts** (definiciones de clase en CfgMods)
3. **Que items/entidades agrega** (CfgVehicles, CfgWeapons, etc.)
4. **Que sonidos agrega** (CfgSoundSets, CfgSoundShaders)
5. **Que simbolos de preprocesador define** (defines[])

Un mod usualmente tiene PBOs separados para diferentes preocupaciones:
- `MyMod/Scripts/config.cpp` -- definiciones de scripts y rutas de modulos
- `MyMod/Data/config.cpp` -- definiciones de items/vehiculos/armas
- `MyMod/GUI/config.cpp` -- declaraciones de imagesets y estilos

---

## Donde Reside config.cpp

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo         --> contiene Scripts/config.cpp
    MyMod_Data.pbo            --> contiene Data/config.cpp (items, vehiculos)
    MyMod_GUI.pbo             --> contiene GUI/config.cpp (imagesets, estilos)
```

Cada PBO tiene su propio `config.cpp`. El motor los lee todos. Multiples PBOs del mismo mod son comunes -- esta es la practica estandar, no una excepcion.

---

## Bloque CfgPatches

`CfgPatches` es **requerido** en todo config.cpp. Declara un parche nombrado y sus dependencias.

### Sintaxis

```cpp
class CfgPatches
{
    class MyMod_Scripts          // Nombre unico de parche (no debe colisionar con otros mods)
    {
        units[] = {};            // Classnames de entidades que este PBO agrega (para editor/spawner)
        weapons[] = {};          // Classnames de armas que este PBO agrega
        requiredVersion = 0.1;   // Version minima del juego (siempre 0.1 en la practica)
        requiredAddons[] =       // Dependencias de PBO -- CONTROLA EL ORDEN DE CARGA
        {
            "DZ_Data"            // Casi siempre necesario
        };
    };
};
```

### requiredAddons: La Cadena de Dependencias

Este es el campo mas critico en toda la configuracion. `requiredAddons` le dice al motor:

1. **Orden de carga:** Los scripts de tu PBO se compilan DESPUES de todos los addons listados
2. **Dependencia dura:** Si un addon listado falta, tu mod falla al cargar

Cada entrada debe coincidir con un nombre de clase `CfgPatches` de otro mod:

| Dependencia | Entrada en requiredAddons | Cuando Usar |
|-----------|---------------------|-------------|
| Datos vanilla de DayZ | `"DZ_Data"` | Casi siempre (items, configs) |
| Scripts vanilla de DayZ | `"DZ_Scripts"` | Al extender clases de script vanilla |
| Armas vanilla | `"DZ_Weapons_Firearms"` | Al agregar armas/accesorios |
| Cargadores vanilla | `"DZ_Weapons_Magazines"` | Al agregar cargadores/municion |
| Community Framework | `"JM_CF_Scripts"` | Al usar el sistema de modulos de CF |
| DabsFramework | `"DF_Scripts"` | Al usar el MVC/framework de Dabs |
| MyFramework | `"MyCore_Scripts"` | Al construir un mod de MyMod |

**Ejemplo: Multiples dependencias**

```cpp
requiredAddons[] =
{
    "DZ_Scripts",
    "DZ_Data",
    "DZ_Weapons_Firearms",
    "DZ_Weapons_Ammunition",
    "DZ_Weapons_Magazines",
    "MyCore_Scripts"
};
```

### units[] y weapons[]

Estos arrays listan los classnames de entidades y armas definidas en este PBO. Sirven para dos propositos:

1. El editor de DayZ los usa para poblar listas de spawn
2. Otras herramientas (como paneles de admin) los usan para descubrimiento de items

```cpp
units[] = { "MyMod_SomeBuilding", "MyMod_SomeVehicle" };
weapons[] = { "MyMod_CustomRifle", "MyMod_CustomPistol" };
```

Para PBOs solo de scripts, deja ambos vacios.

---

## Bloque CfgMods

`CfgMods` se requiere cuando tu PBO agrega o modifica scripts, inputs o recursos de GUI. Define la identidad del mod y su estructura de modulos de script.

### Estructura Basica

```cpp
class CfgMods
{
    class MyMod                   // Identificador del mod (usado internamente)
    {
        dir = "MyMod";            // Directorio raiz del mod (ruta de prefijo de PBO)
        name = "My Mod Name";     // Nombre legible
        author = "AuthorName";    // String de autor
        credits = "AuthorName";   // String de creditos
        creditsJson = "MyMod/Scripts/Data/Credits.json";  // Ruta a archivo de creditos
        versionPath = "MyMod/Scripts/Data/Version.hpp";   // Ruta a archivo de version
        overview = "Description"; // Descripcion del mod
        picture = "";             // Ruta de imagen del logo
        action = "";              // URL (sitio web/Discord)
        type = "mod";             // "mod" para cliente, "servermod" para solo servidor
        extra = 0;                // Reservado, siempre 0
        hideName = 0;             // Ocultar nombre del mod en launcher (0 = mostrar, 1 = ocultar)
        hidePicture = 0;          // Ocultar imagen del mod en launcher

        // Definiciones de keybinds (opcional)
        inputs = "MyMod/Scripts/Data/Inputs.xml";

        // Simbolos de preprocesador (opcional)
        defines[] = { "MYMOD_LOADED" };

        // Dependencias de modulos de script
        dependencies[] = { "Game", "World", "Mission" };

        // Rutas de modulos de script
        class defs
        {
            // ... (cubierto en la siguiente seccion)
        };
    };
};
```

### Campos Clave Explicados

**`dir`** -- La ruta de prefijo raiz para todas las rutas de archivos en este config. Cuando el motor ve `files[] = { "MyMod/Scripts/3_Game" }`, usa `dir` como base.

**`type`** -- Ya sea `"mod"` (cargado via `-mod=`) o `"servermod"` (cargado via `-servermod=`). Los server mods se ejecutan solo en el servidor dedicado. Asi es como separas la logica solo del servidor del codigo del cliente.

**`dependencies`** -- Que modulos de script vanilla extiende tu mod. Casi siempre `{ "Game", "World", "Mission" }`. Valores posibles: `"Core"`, `"GameLib"`, `"Game"`, `"World"`, `"Mission"`.

**`inputs`** -- Ruta a un archivo `Inputs.xml` que define keybindings personalizados. La ruta es relativa a la raiz del PBO.

---

## class defs: Rutas de Modulos de Script

El bloque `class defs` dentro de `CfgMods` es donde le dices al motor que carpetas contienen tus scripts para cada capa.

### Todos los Modulos de Script Disponibles

```cpp
class defs
{
    class engineScriptModule        // 1_Core
    {
        value = "";                 // Funcion de entrada (vacio = predeterminada)
        files[] = { "MyMod/Scripts/1_Core" };
    };
    class gameLibScriptModule       // 2_GameLib (raramente usado)
    {
        value = "";
        files[] = { "MyMod/Scripts/2_GameLib" };
    };
    class gameScriptModule          // 3_Game
    {
        value = "";
        files[] = { "MyMod/Scripts/3_Game" };
    };
    class worldScriptModule         // 4_World
    {
        value = "";
        files[] = { "MyMod/Scripts/4_World" };
    };
    class missionScriptModule       // 5_Mission
    {
        value = "";
        files[] = { "MyMod/Scripts/5_Mission" };
    };
};
```

### El Campo `value`

El campo `value` especifica un nombre de funcion de entrada personalizada para ese modulo de script. Cuando esta vacio (`""`), el motor usa el punto de entrada predeterminado. Cuando esta configurado (ej., `value = "CreateGameMod"`), el motor llama a esa funcion global al inicializar el modulo.

Community Framework usa esto:

```cpp
class gameScriptModule
{
    value = "CF_CreateGame";    // Punto de entrada personalizado
    files[] = { "JM/CF/Scripts/3_Game" };
};
```

Para la mayoria de mods, deja `value` vacio.

### El Array `files`

Cada entrada es una **ruta de directorio** (no archivos individuales). El motor compila recursivamente todos los archivos `.c` en los directorios listados:

```cpp
class gameScriptModule
{
    value = "";
    files[] =
    {
        "MyMod/Scripts/3_Game"      // Todos los archivos .c en este arbol de directorios
    };
};
```

Puedes listar multiples directorios. Asi es como funciona el patron de "carpeta Common":

```cpp
class gameScriptModule
{
    value = "";
    files[] =
    {
        "MyMod/Scripts/Common",     // Codigo compartido compilado en CADA modulo
        "MyMod/Scripts/3_Game"      // Codigo especifico de la capa
    };
};
class worldScriptModule
{
    value = "";
    files[] =
    {
        "MyMod/Scripts/Common",     // Mismo codigo compartido, tambien disponible aqui
        "MyMod/Scripts/4_World"
    };
};
```

### Solo Declara lo que Usas

No necesitas declarar los cinco modulos de script. Solo declara los que tu mod realmente usa:

```cpp
// Un mod simple que solo tiene codigo de 3_Game y 5_Mission
class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    class missionScriptModule
    {
        files[] = { "MyMod/Scripts/5_Mission" };
    };
};
```

---

## class defs: imageSets y widgetStyles

Si tu mod usa iconos personalizados o estilos de GUI, declaralos dentro de `class defs`:

### imageSets

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "MyMod/GUI/imagesets/icons.imageset",
            "MyMod/GUI/imagesets/items.imageset"
        };
    };
    // ... modulos de script ...
};
```

Los ImageSets son archivos XML que mapean regiones nombradas de un atlas de texturas a nombres de sprites. Una vez declarados aqui, cualquier script puede referenciar los iconos por nombre.

### widgetStyles

```cpp
class defs
{
    class widgetStyles
    {
        files[] =
        {
            "MyMod/GUI/looknfeel/custom.styles"
        };
    };
    // ... modulos de script ...
};
```

Los estilos de widget definen propiedades visuales reutilizables (colores, fuentes, padding) para widgets de GUI.

### Ejemplo Real: MyFramework

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "MyFramework/GUI/imagesets/prefabs.imageset",
            "MyFramework/GUI/imagesets/CUI.imageset",
            "MyFramework/GUI/icons/thin.imageset",
            "MyFramework/GUI/icons/light.imageset",
            "MyFramework/GUI/icons/regular.imageset",
            "MyFramework/GUI/icons/solid.imageset",
            "MyFramework/GUI/icons/brands.imageset"
        };
    };
    class widgetStyles
    {
        files[] =
        {
            "MyFramework/GUI/looknfeel/prefabs.styles"
        };
    };
    // ... modulos de script ...
};
```

---

## Array defines

El array `defines[]` en `CfgMods` crea simbolos de preprocesador que otros mods pueden verificar con `#ifdef`:

```cpp
defines[] =
{
    "MYMOD_CORE",           // Otros mods pueden hacer: #ifdef MYMOD_CORE
    // "MYMOD_DEBUG"        // Comentado = deshabilitado en release
};
```

### Casos de Uso

**Deteccion de funciones entre mods:**

```c
// En el codigo de otro mod:
#ifdef MYMOD_CORE
    MyLog.Info("MyMod", "MyFramework detected, enabling integration");
#else
    Print("[MyMod] Running without MyFramework");
#endif
```

**Builds de debug/release:**

```cpp
defines[] =
{
    "MYMOD_LOADED",
    // "MYMOD_DEBUG",        // Descomentar para logging de debug
    // "MYMOD_VERBOSE"       // Descomentar para salida detallada
};
```

### Ejemplos Reales

**COT** usa defines extensivamente para flags de funciones:

```cpp
defines[] =
{
    "JM_COT",
    "JM_COT_VEHICLE_ONSPAWNVEHICLE",
    "COT_BUGFIX_REF",
    "COT_BUGFIX_REF_UIACTIONS",
    "COT_UIACTIONS_SETWIDTH",
    "COT_REFRESHSTATS_NEW",
    "JM_COT_VEHICLEMANAGER",
    "JM_COT_INVISIBILITY"
};
```

**CF** usa defines para habilitar/deshabilitar subsistemas:

```cpp
defines[] =
{
    "CF_MODULE_CONFIG",
    "CF_EXPRESSION",
    "CF_GHOSTICONS",
    "CF_MODSTORAGE",
    "CF_SURFACES",
    "CF_MODULES"
};
```

---

## CfgVehicles: Definiciones de Items y Entidades

`CfgVehicles` es la clase de config principal para definir items en el juego, edificios, vehiculos y otras entidades. A pesar del nombre "vehicles", cubre TODOS los tipos de entidades.

### Definicion Basica de Item

```cpp
class CfgVehicles
{
    class ItemBase;                          // Declaracion anticipada de la clase padre
    class MyMod_CustomItem : ItemBase        // Heredar de la base vanilla
    {
        scope = 2;                           // 0=oculto, 1=solo editor, 2=publico
        displayName = "Custom Item";
        descriptionShort = "A custom item.";
        model = "MyMod/Data/Models/item.p3d";
        weight = 500;                        // Gramos
        itemSize[] = { 2, 3 };               // Slots de inventario (ancho, alto)
        rotationFlags = 17;                   // Rotacion permitida en inventario
        inventorySlot[] = {};                 // En que slots de accesorios cabe
    };
};
```

### Valores de scope

| Valor | Significado | Uso |
|-------|---------|-------|
| `0` | Oculto | Clases base, padres abstractos -- nunca spawneables |
| `1` | Solo editor | Visible en DayZ Editor pero no en gameplay normal |
| `2` | Publico | Completamente spawneable, aparece en herramientas de admin y spawners |

### Definicion de Edificio/Estructura

```cpp
class CfgVehicles
{
    class HouseNoDestruct;
    class MyMod_Bunker : HouseNoDestruct
    {
        scope = 2;
        displayName = "Military Bunker";
        model = "MyMod/Data/Models/bunker.p3d";
    };
};
```

### Definicion de Vehiculo (Simplificada)

```cpp
class CfgVehicles
{
    class CarScript;
    class MyMod_Truck : CarScript
    {
        scope = 2;
        displayName = "Custom Truck";
        model = "MyMod/Data/Models/truck.p3d";

        class Cargo
        {
            itemsCargoSize[] = { 10, 50 };   // Dimensiones de carga
        };
    };
};
```

### Ejemplo de Entidad de DabsFramework

```cpp
class CfgVehicles
{
    class HouseNoDestruct;
    class NetworkLightBase : HouseNoDestruct
    {
        scope = 1;
    };
    class NetworkPointLight : NetworkLightBase
    {
        scope = 1;
    };
    class NetworkSpotLight : NetworkLightBase
    {
        scope = 1;
    };
};
```

---

## CfgSoundSets y CfgSoundShaders

El audio personalizado requiere dos clases de config trabajando juntas: un SoundShader (la referencia al archivo de audio) y un SoundSet (la configuracion de reproduccion).

### CfgSoundShaders

```cpp
class CfgSoundShaders
{
    class MyMod_Alert_SoundShader
    {
        samples[] = {{ "MyMod/Sounds/alert", 1 }};  // Ruta al archivo .ogg, probabilidad
        volume = 0.8;                                 // Volumen base (0.0 a 1.0)
        range = 50;                                   // Rango audible en metros (solo 3D)
        limitation = 0;                               // 0 = sin limite de reproducciones simultaneas
    };
};
```

El array `samples` usa doble llave. Cada entrada es `{ "ruta_sin_extension", probabilidad }`. Si listas multiples samples, el motor elige aleatoriamente basado en los pesos de probabilidad.

### CfgSoundSets

```cpp
class CfgSoundSets
{
    class MyMod_Alert_SoundSet
    {
        soundShaders[] = { "MyMod_Alert_SoundShader" };
        volumeFactor = 1.0;                           // Multiplicador sobre el volumen del shader
        frequencyFactor = 1.0;                        // Multiplicador de pitch
        spatial = 1;                                  // 0 = 2D (sonidos UI), 1 = 3D (mundo)
    };
};
```

### Reproducir Sonidos en Script

```c
// Sonido UI 2D (spatial = 0)
SEffectManager.PlaySound("MyMod_Alert_SoundSet", vector.Zero);

// Sonido del mundo 3D (spatial = 1)
SEffectManager.PlaySound("MyMod_Alert_SoundSet", GetPosition());
```

### Ejemplo Real: Beep de Radio de MyMissions Mod

```cpp
class CfgSoundShaders
{
    class MyBeep_SoundShader
    {
        samples[] = {{ "MyMissions\Sounds\bip", 1 }};
        volume = 0.6;
        range = 5;
        limitation = 0;
    };
};

class CfgSoundSets
{
    class MyBeep_SoundSet
    {
        soundShaders[] = { "MyBeep_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 0;      // 2D -- se reproduce como sonido de UI
    };
};
```

---

## CfgAddons: Declaraciones de Precarga

`CfgAddons` es un bloque opcional que le sugiere al motor sobre la precarga de assets:

```cpp
class CfgAddons
{
    class PreloadAddons
    {
        class MyMod
        {
            list[] = {};       // Lista de nombres de addons a precargar (usualmente vacia)
        };
    };
};
```

En la practica, la mayoria de mods declaran esto con un `list[]` vacio. Asegura que el motor reconozca el mod durante la fase de precarga. Algunos mods lo omiten completamente sin problemas.

---

## Ejemplos Reales de Mods Profesionales

### MyFramework (Solo Scripts, Framework)

```cpp
class CfgPatches
{
    class MyCore_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Scripts" };
    };
};

class CfgMods
{
    class MyMod
    {
        name = "MyFramework";
        dir = "MyFramework";
        author = "MyMod Team";
        overview = "MyFramework - Central Admin Panel and Shared Library";
        inputs = "MyFramework/Scripts/Inputs.xml";
        creditsJson = "MyFramework/Scripts/Credits.json";
        type = "mod";
        defines[] = { "MYMOD_CORE" };
        dependencies[] = { "Core", "Game", "World", "Mission" };

        class defs
        {
            class imageSets
            {
                files[] =
                {
                    "MyFramework/GUI/imagesets/prefabs.imageset",
                    "MyFramework/GUI/imagesets/CUI.imageset",
                    "MyFramework/GUI/icons/thin.imageset",
                    "MyFramework/GUI/icons/light.imageset",
                    "MyFramework/GUI/icons/regular.imageset",
                    "MyFramework/GUI/icons/solid.imageset",
                    "MyFramework/GUI/icons/brands.imageset"
                };
            };
            class widgetStyles
            {
                files[] =
                {
                    "MyFramework/GUI/looknfeel/prefabs.styles"
                };
            };
            class engineScriptModule
            {
                files[] = { "MyFramework/Scripts/1_Core" };
            };
            class gameScriptModule
            {
                files[] = { "MyFramework/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                files[] = { "MyFramework/Scripts/4_World" };
            };
            class missionScriptModule
            {
                files[] = { "MyFramework/Scripts/5_Mission" };
            };
        };
    };
};
```

### COT (Depende de CF, Usa Carpeta Common)

```cpp
class CfgPatches
{
    class JM_COT_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "JM_CF_Scripts", "JM_COT_GUI", "DZ_Data" };
    };
};

class CfgMods
{
    class JM_CommunityOnlineTools
    {
        dir = "JM";
        name = "Community Online Tools";
        credits = "Jacob_Mango, DannyDog, Arkensor";
        creditsJson = "JM/COT/Scripts/Data/Credits.json";
        author = "Jacob_Mango";
        versionPath = "JM/COT/Scripts/Data/Version.hpp";
        inputs = "JM/COT/Scripts/Data/Inputs.xml";
        type = "mod";
        defines[] = { "JM_COT", "JM_COT_VEHICLEMANAGER", "JM_COT_INVISIBILITY" };
        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class engineScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",     // Codigo compartido
                    "JM/COT/Scripts/1_Core"
                };
            };
            class gameScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",
                    "JM/COT/Scripts/3_Game"
                };
            };
            class worldScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",
                    "JM/COT/Scripts/4_World"
                };
            };
            class missionScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",
                    "JM/COT/Scripts/5_Mission"
                };
            };
        };
    };
};
```

### MyMissions Mod Server (Mod Solo de Servidor)

```cpp
class CfgPatches
{
    class SDZS_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Scripts", "MyScripts", "MyCore_Scripts" };
    };
};

class CfgMods
{
    class MyMissionsServer
    {
        name = "MyMissions Mod Server";
        dir = "MyMissions_Server";
        author = "MyMod";
        type = "servermod";              // <-- Mod solo de servidor
        defines[] = { "MYMOD_MISSIONS" };
        dependencies[] = { "Core", "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                files[] = { "MyMissions_Server/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                files[] = { "MyMissions_Server/Scripts/4_World" };
            };
            class missionScriptModule
            {
                files[] = { "MyMissions_Server/Scripts/5_Mission" };
            };
        };
    };
};
```

### DabsFramework (Usa gameLibScriptModule + CfgVehicles)

```cpp
class CfgPatches
{
    class DF_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "DF_GUI" };
    };
};

class CfgMods
{
    class DabsFramework
    {
        name = "Dabs Framework";
        dir = "DabsFramework";
        credits = "InclementDab";
        author = "InclementDab";
        creditsJson = "DabsFramework/Scripts/Credits.json";
        versionPath = "DabsFramework/Scripts/Version.hpp";
        type = "mod";
        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class imageSets
            {
                files[] =
                {
                    "DabsFramework/gui/imagesets/prefabs.imageset",
                    "DabsFramework/gui/icons/brands.imageset",
                    "DabsFramework/gui/icons/light.imageset",
                    "DabsFramework/gui/icons/regular.imageset",
                    "DabsFramework/gui/icons/solid.imageset",
                    "DabsFramework/gui/icons/thin.imageset"
                };
            };
            class widgetStyles
            {
                files[] =
                {
                    "DabsFramework/gui/looknfeel/prefabs.styles"
                };
            };
            class engineScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/1_core" };
            };
            class gameLibScriptModule      // Raro: Dabs usa la capa 2
            {
                value = "";
                files[] = { "DabsFramework/scripts/2_GameLib" };
            };
            class gameScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/5_Mission" };
            };
        };
    };
};

class CfgVehicles
{
    class HouseNoDestruct;
    class NetworkLightBase : HouseNoDestruct
    {
        scope = 1;
    };
    class NetworkPointLight : NetworkLightBase
    {
        scope = 1;
    };
    class NetworkSpotLight : NetworkLightBase
    {
        scope = 1;
    };
};
```

---

## Errores Comunes

### 1. requiredAddons Incorrecto -- El Mod Se Carga Antes de su Dependencia

```cpp
// INCORRECTO: Falta dependencia de CF, asi que tu mod puede cargar antes que CF
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = { "DZ_Data" };  // CF no listado!
    };
};

// CORRECTO: Declarar TODAS las dependencias
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = { "DZ_Data", "JM_CF_Scripts" };
    };
};
```

**Sintoma:** Errores de tipo no definido para clases de la dependencia. El mod cargo antes de que la dependencia fuera compilada.

### 2. Rutas de Modulos de Script Faltantes

```cpp
// INCORRECTO: Tienes una carpeta Scripts/4_World/ pero olvidaste declararla
class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    // Falta 4_World! Todos los archivos .c en 4_World/ son ignorados.
};

// CORRECTO: Declarar cada capa que uses
class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    class worldScriptModule
    {
        files[] = { "MyMod/Scripts/4_World" };
    };
};
```

**Sintoma:** Las clases que definiste simplemente no existen. Sin error -- simplemente no se compilan silenciosamente.

### 3. Rutas de Archivos Incorrectas (Sensibilidad a Mayusculas/Minusculas)

Aunque Windows no distingue mayusculas de minusculas, las rutas de DayZ pueden ser sensibles en ciertos contextos (servidores Linux, empaquetado de PBO):

```cpp
// RIESGOSO: Mayusculas mixtas que pueden fallar en Linux
files[] = { "mymod/scripts/3_game" };   // La carpeta en realidad es "MyMod/Scripts/3_Game"

// SEGURO: Coincidir exactamente con las mayusculas del directorio real
files[] = { "MyMod/Scripts/3_Game" };
```

### 4. Colision de Nombres de Clase CfgPatches

```cpp
// INCORRECTO: Usando un nombre comun que podria colisionar con otro mod
class CfgPatches
{
    class Scripts              // Demasiado generico! Colisionara.
    {
        // ...
    };
};

// CORRECTO: Usar un prefijo unico
class CfgPatches
{
    class MyMod_Scripts        // Unico para tu mod
    {
        // ...
    };
};
```

### 5. requiredAddons Circular

```cpp
// config.cpp de ModA
requiredAddons[] = { "ModB_Scripts" };

// config.cpp de ModB
requiredAddons[] = { "ModA_Scripts" };  // CIRCULAR! El motor falla al resolver.
```

### 6. Declarar dependencies[] Sin Modulos de Script Correspondientes

```cpp
// INCORRECTO: Listaste "World" como dependencia pero no tienes worldScriptModule
dependencies[] = { "Game", "World", "Mission" };

class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    // No se declaro worldScriptModule -- la dependencia "World" es enganosa
    class missionScriptModule
    {
        files[] = { "MyMod/Scripts/5_Mission" };
    };
};
```

Esto no causa un error, pero es enganoso. Solo lista dependencias que realmente uses.

### 7. Poner CfgVehicles en el config.cpp de Scripts

Funciona, pero es mala practica. Manten las definiciones de items/entidades en un PBO separado (`Data/config.cpp`) y las definiciones de scripts en `Scripts/config.cpp`.

---

## Plantilla Completa

Aqui hay una plantilla de `Scripts/config.cpp` lista para produccion que puedes copiar y modificar:

```cpp
// ============================================================================
// Scripts/config.cpp -- Definiciones de Modulos de Script de MyMod
// ============================================================================

class CfgPatches
{
    class MyMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Scripts"
            // Agregar dependencias de framework aqui:
            // "JM_CF_Scripts",         // Community Framework
            // "MyCore_Scripts",      // MyFramework
        };
    };
};

class CfgMods
{
    class MyMod
    {
        dir = "MyMod";
        name = "My Mod";
        author = "YourName";
        credits = "YourName";
        creditsJson = "MyMod/Scripts/Data/Credits.json";
        overview = "A brief description of what this mod does.";
        type = "mod";

        defines[] =
        {
            "MYMOD_LOADED"
            // "MYMOD_DEBUG"      // Descomentar para builds de debug
        };

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class imageSets
            {
                files[] = {};     // Agregar rutas de .imageset aqui
            };

            class widgetStyles
            {
                files[] = {};     // Agregar rutas de .styles aqui
            };

            class gameScriptModule
            {
                value = "";
                files[] = { "MyMod/Scripts/3_Game" };
            };

            class worldScriptModule
            {
                value = "";
                files[] = { "MyMod/Scripts/4_World" };
            };

            class missionScriptModule
            {
                value = "";
                files[] = { "MyMod/Scripts/5_Mission" };
            };
        };
    };
};
```

---

**Anterior:** [Capitulo 2.1: La Jerarquia de 5 Capas de Scripts](01-five-layers.md)
**Siguiente:** [Capitulo 2.3: mod.cpp & Workshop](03-mod-cpp.md)
