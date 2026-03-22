# Capitulo 8.5: Usando el Template de Mod para DayZ

> **Resumen:** Este tutorial te muestra como usar el template de mod open-source de InclementDab para DayZ para iniciar un nuevo proyecto de mod en segundos. En lugar de crear cada archivo desde cero, clonas un esqueleto listo que ya tiene la estructura de carpetas correcta, config.cpp, mod.cpp y stubs de capa de script. Luego renombras algunas cosas y comienzas a escribir codigo inmediatamente.

---

## Tabla de Contenidos

- [Que Es el Template de Mod para DayZ?](#que-es-el-template-de-mod-para-dayz)
- [Que Proporciona el Template](#que-proporciona-el-template)
- [Paso 1: Clonar o Descargar el Template](#paso-1-clonar-o-descargar-el-template)
- [Paso 2: Entender la Estructura de Archivos](#paso-2-entender-la-estructura-de-archivos)
- [Paso 3: Renombrar el Mod](#paso-3-renombrar-el-mod)
- [Paso 4: Actualizar config.cpp](#paso-4-actualizar-configcpp)
- [Paso 5: Actualizar mod.cpp](#paso-5-actualizar-modcpp)
- [Paso 6: Renombrar Carpetas y Archivos de Script](#paso-6-renombrar-carpetas-y-archivos-de-script)
- [Paso 7: Compilar y Probar](#paso-7-compilar-y-probar)
- [Integracion con DayZ Tools y Workbench](#integracion-con-dayz-tools-y-workbench)
- [Template vs. Configuracion Manual](#template-vs-configuracion-manual)
- [Siguientes Pasos](#siguientes-pasos)

---

## Que Es el Template de Mod para DayZ?

El **Template de Mod para DayZ** es un repositorio open-source mantenido por InclementDab que proporciona un esqueleto de mod completo y listo para usar en DayZ:

**Repositorio:** [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)

En lugar de crear cada archivo a mano (como se explica en el [Capitulo 8.1: Tu Primer Mod](01-first-mod.md)), el template te da una estructura de directorios pre-construida con todo el boilerplate ya en su lugar. Lo clonas, renombras algunos identificadores y estas listo para escribir logica de juego.

Este es el punto de partida recomendado para cualquiera que ya haya construido un mod Hello World y quiera avanzar a proyectos mas complejos.

---

## Que Proporciona el Template

El template incluye todo lo que un mod de DayZ necesita para compilar y cargar:

| Archivo / Carpeta | Proposito |
|--------------------|-----------|
| `mod.cpp` | Metadatos del mod (nombre, autor, version) mostrados en el launcher de DayZ |
| `config.cpp` | Declaraciones CfgPatches y CfgMods que registran el mod en el motor |
| `Scripts/3_Game/` | Stubs de script de la capa Game (enums, constantes, clases de config) |
| `Scripts/4_World/` | Stubs de script de la capa World (entidades, managers, interacciones con el mundo) |
| `Scripts/5_Mission/` | Stubs de script de la capa Mission (UI, hooks de mision) |
| `.gitignore` | Archivos a ignorar pre-configurados para desarrollo de DayZ (PBOs, logs, archivos temporales) |

El template sigue la jerarquia estandar de 5 capas de script documentada en el [Capitulo 2.1: La Jerarquia de 5 Capas de Script](../02-mod-structure/01-five-layers.md). Las tres capas de script estan configuradas en config.cpp para que puedas colocar codigo inmediatamente en cualquier capa sin configuracion adicional.

---

## Paso 1: Clonar o Descargar el Template

### Opcion A: Usar la Funcion "Use this template" de GitHub

1. Ve a [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)
2. Haz clic en el boton verde **"Use this template"** en la parte superior del repositorio
3. Elige **"Create a new repository"**
4. Nombra tu repositorio (ej: `MyAwesomeMod`)
5. Clona tu nuevo repositorio en tu disco P:

```bash
cd P:\
git clone https://github.com/YourUsername/MyAwesomeMod.git
```

### Opcion B: Clonacion Directa

Si no necesitas tu propio repositorio en GitHub, clona el template directamente:

```bash
cd P:\
git clone https://github.com/InclementDab/DayZ-Mod-Template.git MyAwesomeMod
```

### Opcion C: Descargar como ZIP

1. Ve a la pagina del repositorio
2. Haz clic en **Code** y luego en **Download ZIP**
3. Extrae el ZIP en `P:\MyAwesomeMod\`

---

## Paso 2: Entender la Estructura de Archivos

Despues de clonar, el directorio de tu mod se ve asi:

```
P:\MyAwesomeMod\
    mod.cpp
    Scripts\
        config.cpp
        3_Game\
            ModName\
                (scripts de la capa game)
        4_World\
            ModName\
                (scripts de la capa world)
        5_Mission\
            ModName\
                (scripts de la capa mission)
```

### Como Encaja Cada Parte

**`mod.cpp`** es la tarjeta de identidad de tu mod. Controla lo que los jugadores ven en la lista de mods del launcher de DayZ. Consulta el [Capitulo 2.3: mod.cpp y Workshop](../02-mod-structure/03-mod-cpp.md) para todos los campos disponibles.

**`Scripts/config.cpp`** es el archivo mas critico. Le dice al motor de DayZ:
- De que depende tu mod (`CfgPatches.requiredAddons[]`)
- Donde se encuentra cada capa de script (`CfgMods.class defs`)
- Que defines de preprocesador establecer (`defines[]`)

Consulta el [Capitulo 2.2: config.cpp a Fondo](../02-mod-structure/02-config-cpp.md) para una referencia completa.

**`Scripts/3_Game/`** carga primero. Coloca enums, constantes, IDs de RPC, clases de configuracion y cualquier cosa que no referencie entidades del mundo aqui.

**`Scripts/4_World/`** carga segundo. Coloca clases de entidad (`modded class ItemBase`), managers y cualquier cosa que interactue con objetos del juego aqui.

**`Scripts/5_Mission/`** carga al final. Coloca hooks de mision (`modded class MissionServer`), paneles de UI y logica de inicio aqui. Esta capa puede referenciar tipos de todas las capas inferiores.

---

## Paso 3: Renombrar el Mod

El template viene con nombres de placeholder. Necesitas reemplazarlos con el nombre real de tu mod. Aqui hay un enfoque sistematico.

### Elige Tus Nombres

Antes de hacer cualquier edicion, decide:

| Identificador | Ejemplo | Usado En |
|---------------|---------|----------|
| **Nombre de visualizacion del mod** | `"My Awesome Mod"` | mod.cpp, config.cpp |
| **Nombre del directorio** | `MyAwesomeMod` | Nombre de carpeta, rutas en config.cpp |
| **Clase CfgPatches** | `MyAwesomeMod_Scripts` | config.cpp CfgPatches |
| **Clase CfgMods** | `MyAwesomeMod` | config.cpp CfgMods |
| **Subcarpeta de script** | `MyAwesomeMod` | Dentro de 3_Game/, 4_World/, 5_Mission/ |
| **Define de preprocesador** | `MYAWESOMEMOD` | config.cpp defines[], verificaciones #ifdef |

### Reglas de Nomenclatura

- **Sin espacios ni caracteres especiales** en nombres de directorio y clase. Usa PascalCase o guiones bajos.
- **Los nombres de clase CfgPatches deben ser globalmente unicos.** Dos mods con el mismo nombre de clase CfgPatches entraran en conflicto. Usa el nombre de tu mod como prefijo.
- **Los nombres de subcarpeta de script** dentro de cada capa deben coincidir con el nombre de tu mod para mantener consistencia.

---

## Paso 4: Actualizar config.cpp

Abre `Scripts/config.cpp` y actualiza las siguientes secciones.

### CfgPatches

Reemplaza el nombre de clase del template con el tuyo:

```cpp
class CfgPatches
{
    class MyAwesomeMod_Scripts    // <-- Tu nombre de patch unico
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"            // Dependencia del juego base
        };
    };
};
```

Si tu mod depende de otro mod, agrega su nombre de clase CfgPatches a `requiredAddons[]`:

```cpp
requiredAddons[] =
{
    "DZ_Data",
    "CF_Scripts"              // Depende de Community Framework
};
```

### CfgMods

Actualiza la identidad del mod y las rutas de scripts:

```cpp
class CfgMods
{
    class MyAwesomeMod
    {
        dir = "MyAwesomeMod";
        name = "My Awesome Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/5_Mission" };
            };
        };
    };
};
```

**Puntos clave:**
- El valor de `dir` debe coincidir exactamente con el nombre de la carpeta raiz de tu mod.
- Cada ruta en `files[]` es relativa a la raiz del mod.
- El array `dependencies[]` debe listar que modulos de script vanilla utilizas. La mayoria de los mods usan los tres: `"Game"`, `"World"` y `"Mission"`.

### Defines de Preprocesador (Opcional)

Si quieres que otros mods detecten la presencia de tu mod, agrega un array `defines[]`:

```cpp
class MyAwesomeMod
{
    // ... (otros campos arriba)

    class defs
    {
        class gameScriptModule
        {
            value = "";
            files[] = { "MyAwesomeMod/Scripts/3_Game" };
        };
        // ... otros modulos ...
    };

    // Habilitar deteccion entre mods
    defines[] = { "MYAWESOMEMOD" };
};
```

Otros mods pueden entonces usar `#ifdef MYAWESOMEMOD` para compilar condicionalmente codigo que se integre con el tuyo.

---

## Paso 5: Actualizar mod.cpp

Abre `mod.cpp` en el directorio raiz y actualizalo con la informacion de tu mod:

```cpp
name         = "My Awesome Mod";
author       = "YourName";
version      = "1.0.0";
overview     = "Una breve descripcion de lo que hace tu mod.";
picture      = "";             // Opcional: ruta a una imagen de vista previa
logo         = "";             // Opcional: ruta a un logo
logoSmall    = "";             // Opcional: ruta a un logo pequeno
logoOver     = "";             // Opcional: ruta a un logo en hover
tooltip      = "My Awesome Mod";
action       = "";             // Opcional: URL al sitio web de tu mod
```

Como minimo, establece `name`, `author` y `overview`. Los demas campos son opcionales pero mejoran la presentacion en el launcher.

---

## Paso 6: Renombrar Carpetas y Archivos de Script

Renombra las subcarpetas de script dentro de cada capa para que coincidan con el nombre de tu mod:

```
Scripts/3_Game/ModName/    -->  Scripts/3_Game/MyAwesomeMod/
Scripts/4_World/ModName/   -->  Scripts/4_World/MyAwesomeMod/
Scripts/5_Mission/ModName/ -->  Scripts/5_Mission/MyAwesomeMod/
```

Dentro de estas carpetas, renombra cualquier archivo `.c` de placeholder y actualiza sus nombres de clase. Por ejemplo, si el template incluye un archivo como `ModInit.c` con una clase llamada `ModInit`, renombralo a `MyAwesomeModInit.c` y actualiza la clase:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyAwesomeMod] Server initialized!");
    }
};
```

---

## Paso 7: Compilar y Probar

### Usando File Patching (Iteracion Rapida)

La forma mas rapida de probar durante el desarrollo:

```batch
DayZDiag_x64.exe -mod=P:\MyAwesomeMod -filePatching
```

Esto carga tus scripts directamente desde las carpetas de codigo fuente sin empaquetar un PBO. Edita un archivo `.c`, reinicia el juego y ve los cambios inmediatamente.

### Usando Addon Builder (Para Distribucion)

Cuando estes listo para distribuir:

1. Abre **DayZ Tools** desde Steam
2. Inicia **Addon Builder**
3. Establece **Source directory** en `P:\MyAwesomeMod\Scripts\`
4. Establece **Output directory** en `P:\@MyAwesomeMod\Addons\`
5. Establece **Prefix** en `MyAwesomeMod\Scripts`
6. Haz clic en **Pack**

Luego copia `mod.cpp` junto a la carpeta `Addons`:

```
P:\@MyAwesomeMod\
    mod.cpp
    Addons\
        Scripts.pbo
```

### Verificar en el Log de Scripts

Despues de iniciar, revisa el log de scripts en busca de tus mensajes:

```
%localappdata%\DayZ\script_<date>_<time>.log
```

Busca la etiqueta de prefijo de tu mod (ej: `[MyAwesomeMod]`).

---

## Integracion con DayZ Tools y Workbench

### Workbench

DayZ Workbench puede abrir y editar los scripts de tu mod con resaltado de sintaxis:

1. Abre **Workbench** desde DayZ Tools
2. Ve a **File > Open** y navega hasta la carpeta `Scripts/` de tu mod
3. Abre cualquier archivo `.c` para editar con soporte basico de Enforce Script

Workbench lee el `config.cpp` para entender que archivos pertenecen a que modulo de script, asi que tener un config.cpp correctamente configurado es esencial.

### Configuracion del Disco P:

El template esta disenado para funcionar desde el disco P:. Si clonaste a otra ubicacion, crea una union:

```batch
mklink /J P:\MyAwesomeMod "D:\Projects\MyAwesomeMod"
```

Esto hace que el mod sea accesible en `P:\MyAwesomeMod` sin mover archivos.

### Automatizacion del Addon Builder

Para compilaciones repetidas, puedes crear un archivo batch en la raiz de tu mod:

```batch
@echo off
set DAYZ_TOOLS="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"
set SOURCE=P:\MyAwesomeMod\Scripts
set OUTPUT=P:\@MyAwesomeMod\Addons
set PREFIX=MyAwesomeMod\Scripts

%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe %SOURCE% %OUTPUT% -prefix=%PREFIX% -clear
echo Build complete.
pause
```

---

## Template vs. Configuracion Manual

| Aspecto | Template | Manual (Capitulo 8.1) |
|---------|----------|----------------------|
| **Tiempo hasta la primera compilacion** | ~2 minutos | ~15 minutos |
| **Las 3 capas de script** | Pre-configuradas | Las agregas segun necesites |
| **config.cpp** | Completo con todos los modulos | Minimo (solo mision) |
| **Listo para Git** | .gitignore incluido | Tu creas el tuyo |
| **Valor de aprendizaje** | Menor (archivos pre-hechos) | Mayor (construir todo desde cero) |
| **Recomendado para** | Modders experimentados, nuevos proyectos | Modders principiantes aprendiendo los fundamentos |

**Recomendacion:** Si este es tu primer mod de DayZ, comienza con el [Capitulo 8.1](01-first-mod.md) para entender cada archivo. Una vez que te sientas comodo, usa el template para todos los proyectos futuros.

---

## Siguientes Pasos

Con tu mod basado en template funcionando, puedes:

1. **Agregar un item personalizado** -- Sigue el [Capitulo 8.2: Creando un Item Personalizado](02-custom-item.md) para definir items en config.cpp.
2. **Construir un panel de admin** -- Sigue el [Capitulo 8.3: Construyendo un Panel de Admin](03-admin-panel.md) para UI de administracion del servidor.
3. **Agregar comandos de chat** -- Sigue el [Capitulo 8.4: Agregando Comandos de Chat](04-chat-commands.md) para comandos de texto en el juego.
4. **Estudiar config.cpp a fondo** -- Lee el [Capitulo 2.2: config.cpp a Fondo](../02-mod-structure/02-config-cpp.md) para entender cada campo.
5. **Aprender opciones de mod.cpp** -- Lee el [Capitulo 2.3: mod.cpp y Workshop](../02-mod-structure/03-mod-cpp.md) para publicacion en Workshop.
6. **Agregar dependencias** -- Si tu mod usa Community Framework u otro mod, actualiza `requiredAddons[]` y consulta el [Capitulo 2.4: Tu Primer Mod](../02-mod-structure/04-minimum-viable-mod.md).

---

**Anterior:** [Capitulo 8.4: Agregando Comandos de Chat](04-chat-commands.md) | [Inicio](../../README.md)
