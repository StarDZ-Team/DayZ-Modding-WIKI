# Capitulo 8.1: Tu Primer Mod (Hello World)

[Inicio](../README.md) | **Tu Primer Mod** | [Siguiente: Crear un Item Personalizado >>](02-custom-item.md)

---

## Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Paso 1: Instalar DayZ Tools](#paso-1-instalar-dayz-tools)
- [Paso 2: Configurar la Unidad P: (Workdrive)](#paso-2-configurar-la-unidad-p-workdrive)
- [Paso 3: Crear la Estructura de Directorios del Mod](#paso-3-crear-la-estructura-de-directorios-del-mod)
- [Paso 4: Escribir mod.cpp](#paso-4-escribir-modcpp)
- [Paso 5: Escribir config.cpp](#paso-5-escribir-configcpp)
- [Paso 6: Escribir Tu Primer Script](#paso-6-escribir-tu-primer-script)
- [Paso 7: Empaquetar el PBO con Addon Builder](#paso-7-empaquetar-el-pbo-con-addon-builder)
- [Paso 8: Cargar el Mod en DayZ](#paso-8-cargar-el-mod-en-dayz)
- [Paso 9: Verificar en el Script Log](#paso-9-verificar-en-el-script-log)
- [Paso 10: Solucion de Problemas Comunes](#paso-10-solucion-de-problemas-comunes)
- [Referencia Completa de Archivos](#referencia-completa-de-archivos)
- [Siguientes Pasos](#siguientes-pasos)

---

## Requisitos Previos

Antes de comenzar, asegurate de tener:

- **Steam** instalado y con sesion iniciada
- **DayZ** instalado (version retail de Steam)
- Un **editor de texto** (VS Code, Notepad++, o incluso Notepad)
- Aproximadamente **15 GB de espacio libre en disco** para DayZ Tools

Eso es todo. No se requiere experiencia en programacion para este tutorial -- cada linea de codigo esta explicada.

---

## Paso 1: Instalar DayZ Tools

DayZ Tools es una aplicacion gratuita en Steam que incluye todo lo que necesitas para construir mods: el editor de scripts Workbench, Addon Builder para empaquetar PBOs, Terrain Builder y Object Builder.

### Como Instalar

1. Abre **Steam**
2. Ve a **Biblioteca**
3. En el filtro desplegable de arriba, cambia **Juegos** a **Herramientas**
4. Busca **DayZ Tools**
5. Haz clic en **Instalar**
6. Espera a que la descarga se complete (son aproximadamente 12-15 GB)

Una vez instalado, encontraras DayZ Tools en tu biblioteca de Steam bajo Herramientas. La ruta de instalacion predeterminada es:

```
C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\
```

### Que Se Instala

| Herramienta | Proposito |
|------|---------|
| **Addon Builder** | Empaqueta los archivos de tu mod en archivos `.pbo` |
| **Workbench** | Editor de scripts con resaltado de sintaxis |
| **Object Builder** | Visor y editor de modelos 3D para archivos `.p3d` |
| **Terrain Builder** | Editor de mapas/terreno |
| **TexView2** | Visor/convertidor de texturas (`.paa`, `.edds`) |

Para este tutorial, solo necesitas **Addon Builder**. Los otros son utiles mas adelante.

---

## Paso 2: Configurar la Unidad P: (Workdrive)

El modding de DayZ usa una letra de unidad virtual **P:** como espacio de trabajo compartido. Todos los mods y datos del juego referencian rutas que comienzan desde P:, lo que mantiene las rutas consistentes entre diferentes maquinas.

### Crear la Unidad P:

1. Abre **DayZ Tools** desde Steam
2. En la ventana principal de DayZ Tools, haz clic en **P: Drive Management** (o busca un boton etiquetado "Mount P drive" / "Setup P drive")
3. Haz clic en **Create/Mount P: Drive**
4. Elige una ubicacion para los datos de la unidad P: (la predeterminada esta bien, o elige una unidad con suficiente espacio)
5. Espera a que el proceso se complete

### Verificar que Funciona

Abre el **Explorador de Archivos** y navega a `P:\`. Deberias ver un directorio que contiene datos del juego DayZ. Si la unidad P: existe y puedes navegarla, estas listo para continuar.

### Alternativa: Unidad P: Manual

Si la GUI de DayZ Tools no funciona, puedes crear una unidad P: manualmente usando un simbolo del sistema de Windows (ejecutar como Administrador):

```batch
subst P: "C:\DayZWorkdrive"
```

Reemplaza `C:\DayZWorkdrive` con cualquier carpeta que quieras. Esto crea un mapeo de unidad temporal que dura hasta que reinicies. Para un mapeo permanente, usa `net use` o la GUI de DayZ Tools.

### Que Pasa Si No Quiero Usar la Unidad P:?

Puedes desarrollar sin la unidad P: colocando tu carpeta de mod directamente en el directorio del juego DayZ y usando el modo `-filePatching`. Sin embargo, la unidad P: es el flujo de trabajo estandar y toda la documentacion oficial la asume. Recomendamos fuertemente configurarla.

---

## Paso 3: Crear la Estructura de Directorios del Mod

Todo mod de DayZ sigue una estructura de carpetas especifica. Crea los siguientes directorios y archivos en tu unidad P: (o en tu directorio del juego DayZ si no usas P:):

```
P:\MyFirstMod\
    mod.cpp
    Scripts\
        config.cpp
        5_Mission\
            MyFirstMod\
                MissionHello.c
```

### Crear las Carpetas

1. Abre el **Explorador de Archivos**
2. Navega a `P:\`
3. Crea una nueva carpeta llamada `MyFirstMod`
4. Dentro de `MyFirstMod`, crea una carpeta llamada `Scripts`
5. Dentro de `Scripts`, crea una carpeta llamada `5_Mission`
6. Dentro de `5_Mission`, crea una carpeta llamada `MyFirstMod`

### Entendiendo la Estructura

| Ruta | Proposito |
|------|---------|
| `MyFirstMod/` | Raiz de tu mod |
| `mod.cpp` | Metadatos (nombre, autor) mostrados en el launcher de DayZ |
| `Scripts/config.cpp` | Le dice al motor de que depende tu mod y donde estan los scripts |
| `Scripts/5_Mission/` | La capa de script de mision (UI, hooks de arranque) |
| `Scripts/5_Mission/MyFirstMod/` | Subcarpeta para los scripts de mision de tu mod |
| `Scripts/5_Mission/MyFirstMod/MissionHello.c` | Tu archivo de script real |

Necesitas exactamente **3 archivos**. Vamos a crearlos uno por uno.

---

## Paso 4: Escribir mod.cpp

Crea el archivo `P:\MyFirstMod\mod.cpp` en tu editor de texto y pega este contenido:

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### Que Hace Cada Linea

- **`name`** -- El nombre que se muestra en la lista de mods del launcher de DayZ. Los jugadores ven esto al seleccionar mods.
- **`author`** -- Tu nombre o nombre de equipo.
- **`version`** -- Cualquier string de version que quieras. El motor no lo parsea.
- **`overview`** -- Una descripcion mostrada al expandir los detalles del mod.

Guarda el archivo. Esa es la tarjeta de identidad de tu mod.

---

## Paso 5: Escribir config.cpp

Crea el archivo `P:\MyFirstMod\Scripts\config.cpp` y pega este contenido:

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### Que Hace Cada Seccion

**CfgPatches** declara tu mod al motor de DayZ:

- `class MyFirstMod_Scripts` -- Un identificador unico para el paquete de scripts de tu mod. No debe colisionar con ningun otro mod.
- `units[] = {}; weapons[] = {};` -- Listas de entidades y armas que tu mod agrega. Vacias por ahora.
- `requiredVersion = 0.1;` -- Version minima del juego. Siempre `0.1`.
- `requiredAddons[] = { "DZ_Data" };` -- Dependencias. `DZ_Data` son los datos base del juego. Esto asegura que tu mod se cargue **despues** del juego base.

**CfgMods** le dice al motor donde estan tus scripts:

- `dir = "MyFirstMod";` -- Directorio raiz del mod.
- `type = "mod";` -- Este es un mod de cliente+servidor (a diferencia de `"servermod"` para solo servidor).
- `dependencies[] = { "Mission" };` -- Tu codigo se engancha al modulo de script de Mission.
- `class missionScriptModule` -- Le dice al motor que compile todos los archivos `.c` encontrados en `MyFirstMod/Scripts/5_Mission/`.

**Por que solo `5_Mission`?** Porque nuestro script Hello World se engancha al evento de arranque de la mision, que vive en la capa de mision. La mayoria de los mods simples empiezan aqui.

---

## Paso 6: Escribir Tu Primer Script

Crea el archivo `P:\MyFirstMod\Scripts\5_Mission\MyFirstMod\MissionHello.c` y pega este contenido:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

### Explicacion Linea por Linea

```c
modded class MissionServer
```
La palabra clave `modded` es el corazon del modding de DayZ. Dice: "Toma la clase existente `MissionServer` del juego vanilla y agrega mis cambios encima." No estas creando una nueva clase -- estas extendiendo la existente.

```c
    override void OnInit()
```
`OnInit()` es llamado por el motor cuando una mision empieza. `override` le dice al compilador que este metodo ya existe en la clase padre y lo estamos reemplazando con nuestra version.

```c
        super.OnInit();
```
**Esta linea es critica.** `super.OnInit()` llama a la implementacion vanilla original. Si omites esto, el codigo de inicializacion de la mision vanilla nunca se ejecuta y el juego se rompe. Siempre llama a `super` primero.

```c
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
```
`Print()` escribe un mensaje al archivo de log de scripts de DayZ. El prefijo `[MyFirstMod]` hace facil encontrar tus mensajes en el log.

```c
modded class MissionGameplay
```
`MissionGameplay` es el equivalente del lado del cliente de `MissionServer`. Cuando un jugador se une a un servidor, `MissionGameplay.OnInit()` se dispara en su maquina. Al moddear ambas clases, tu mensaje aparece tanto en los logs del servidor como del cliente.

### Sobre los Archivos `.c`

Los scripts de DayZ usan la extension de archivo `.c`. A pesar de verse como C, esto es **Enforce Script**, el lenguaje de scripting propio de DayZ. Tiene clases, herencia, arrays y maps, pero no es C, C++ ni C#. Tu IDE puede mostrar errores de sintaxis -- eso es normal y esperado.

---

## Paso 7: Empaquetar el PBO con Addon Builder

DayZ carga mods desde archivos `.pbo` (similar a .zip pero en un formato que el motor entiende). Necesitas empaquetar tu carpeta `Scripts` en un PBO.

### Usando Addon Builder (GUI)

1. Abre **DayZ Tools** desde Steam
2. Haz clic en **Addon Builder** para lanzarlo
3. Establece **Source directory** a: `P:\MyFirstMod\Scripts\`
4. Establece **Output/Destination directory** a una nueva carpeta: `P:\@MyFirstMod\Addons\`

   Crea la carpeta `@MyFirstMod\Addons\` primero si no existe.

5. En **Addon Builder Options**:
   - Establece **Prefix** a: `MyFirstMod\Scripts`
   - Deja las otras opciones en sus valores predeterminados
6. Haz clic en **Pack**

Si tiene exito, veras un archivo en:

```
P:\@MyFirstMod\Addons\Scripts.pbo
```

### Configurar la Estructura Final del Mod

Ahora copia tu `mod.cpp` junto a la carpeta `Addons`:

```
P:\@MyFirstMod\
    mod.cpp                         <-- Copiar de P:\MyFirstMod\mod.cpp
    Addons\
        Scripts.pbo                 <-- Creado por Addon Builder
```

El prefijo `@` en el nombre de la carpeta es una convencion para mods distribuibles. Senala a los administradores de servidores y al launcher que este es un paquete de mod.

### Alternativa: Probar Sin Empaquetar (File Patching)

Durante el desarrollo, puedes omitir el empaquetado PBO completamente usando el modo file patching. Esto carga scripts directamente de tus carpetas fuente:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

El file patching es mas rapido para iteracion porque editas un archivo `.c`, reinicias el juego y ves los cambios inmediatamente. No se necesita paso de empaquetado. Sin embargo, el file patching solo funciona con el ejecutable diagnostico (`DayZDiag_x64.exe`) y no es adecuado para distribucion.

---

## Paso 8: Cargar el Mod en DayZ

Hay dos formas de cargar tu mod: a traves del launcher o via parametros de linea de comandos.

### Opcion A: Launcher de DayZ

1. Abre el **Launcher de DayZ** desde Steam
2. Ve a la pestana **Mods**
3. Haz clic en **Add local mod** (o "Add mod from local storage")
4. Navega a `P:\@MyFirstMod\`
5. Habilita el mod marcando su casilla
6. Haz clic en **Play** (asegurate de conectarte a un servidor local/offline, o lanzar en modo un jugador)

### Opcion B: Linea de Comandos (Recomendado para Desarrollo)

Para iteracion mas rapida, lanza DayZ directamente con parametros de linea de comandos. Crea un acceso directo o archivo batch:

**Usando el Ejecutable Diagnostico (con file patching, sin PBO necesario):**

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ\DayZDiag_x64.exe" -mod=P:\MyFirstMod -filePatching -server -config=serverDZ.cfg -port=2302
```

**Usando el PBO empaquetado:**

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ\DayZDiag_x64.exe" -mod=P:\@MyFirstMod -server -config=serverDZ.cfg -port=2302
```

El flag `-server` lanza un listen server local. El flag `-filePatching` permite cargar scripts desde carpetas sin empaquetar.

### Prueba Rapida: Modo Offline

La forma mas rapida de probar es lanzar DayZ en modo offline:

```batch
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

Luego en el menu principal, haz clic en **Play** y selecciona **Offline Mode** (o **Community Offline**). Esto inicia una sesion local de un jugador sin necesitar un servidor.

---

## Paso 9: Verificar en el Script Log

Despues de lanzar DayZ con tu mod, el motor escribe toda la salida de `Print()` en archivos de log.

### Encontrar los Archivos de Log

DayZ almacena logs en tu directorio AppData local:

```
C:\Users\<TuNombreDeUsuarioDeWindows>\AppData\Local\DayZ\
```

Para llegar alli rapidamente:
1. Presiona **Win + R** para abrir el dialogo Ejecutar
2. Escribe `%localappdata%\DayZ` y presiona Enter

Busca el archivo mas reciente con nombre como:

```
script_<fecha>_<hora>.log
```

Por ejemplo: `script_2025-01-15_14-30-22.log`

### Que Buscar

Abre el archivo de log en tu editor de texto y busca `[MyFirstMod]`. Deberias ver uno de estos mensajes:

```
[MyFirstMod] Hello World! The SERVER mission has started.
```

o (si cargaste como cliente):

```
[MyFirstMod] Hello World! The CLIENT mission has started.
```

**Si ves tu mensaje: felicitaciones.** Tu primer mod de DayZ esta funcionando. Has logrado exitosamente:

1. Crear una estructura de directorios de mod
2. Escribir una config que el motor lee
3. Engancharte a codigo vanilla del juego con `modded class`
4. Imprimir salida al script log

### Que Pasa Si Ves Errores?

Si el log contiene lineas que empiezan con `SCRIPT (E):`, algo salio mal. Lee la siguiente seccion.

---

## Paso 10: Solucion de Problemas Comunes

### Problema: Sin Salida en el Log (El Mod No Parece Cargar)

**Verifica tus parametros de lanzamiento.** La ruta de `-mod=` debe apuntar a la carpeta correcta. Si usas file patching, verifica que la ruta apunte a la carpeta que contiene `Scripts/config.cpp` directamente (no la carpeta `@`).

**Verifica que config.cpp existe en el nivel correcto.** Debe estar en `Scripts/config.cpp` dentro de la raiz de tu mod. Si esta en la carpeta equivocada, el motor ignora silenciosamente tu mod.

**Verifica el nombre de clase CfgPatches.** Si no hay bloque `CfgPatches`, o su sintaxis esta mal, el PBO completo se omite.

**Mira el log principal de DayZ** (no solo el script log). Verifica:
```
C:\Users\<TuNombre>\AppData\Local\DayZ\DayZ_<fecha>_<hora>.RPT
```
Busca el nombre de tu mod. Puedes ver mensajes como "Addon MyFirstMod_Scripts requires addon DZ_Data which is not loaded."

### Problema: `SCRIPT (E): Undefined variable` o `Undefined type`

Esto significa que tu codigo referencia algo que el motor no reconoce. Causas comunes:

- **Typo en un nombre de clase.** `MisionServer` en lugar de `MissionServer` (nota la doble 's').
- **Capa de script equivocada.** Si referencias `PlayerBase` desde `5_Mission`, deberia funcionar. Pero si accidentalmente colocaste tu archivo en `3_Game` y referencias tipos de mision, obtendras este error.
- **Falta la llamada a `super.OnInit()`.** Omitirla puede causar fallas en cascada.

### Problema: `SCRIPT (E): Member not found`

El metodo que estas llamando no existe en la clase. Verifica el nombre del metodo y asegurate de estar sobreescribiendo un metodo real de vanilla. `OnInit` existe en `MissionServer` y `MissionGameplay` -- pero no en todas las clases.

### Problema: El Mod Carga Pero el Script Nunca Se Ejecuta

- **Extension de archivo:** Asegurate de que tu archivo de script termine en `.c` (no `.c.txt` o `.cs`). Windows puede ocultar extensiones por defecto.
- **Desajuste de ruta de script:** La ruta de `files[]` en `config.cpp` debe coincidir con tu directorio real. `"MyFirstMod/Scripts/5_Mission"` significa que el motor busca una carpeta en esa ruta exacta relativa a la raiz del mod.
- **Nombre de clase:** `modded class MissionServer` distingue mayusculas de minusculas. Debe coincidir exactamente con el nombre de la clase vanilla.

### Problema: Errores de Empaquetado PBO

- Asegurate de que `config.cpp` esta al nivel raiz de lo que estas empaquetando (la carpeta `Scripts/`).
- Verifica que el prefix en Addon Builder coincida con la ruta de tu mod.
- Asegurate de que no haya archivos que no sean de texto mezclados en la carpeta Scripts (sin `.exe`, `.dll`, o archivos binarios).

### Problema: El Juego Crashea al Iniciar

- Verifica errores de sintaxis en `config.cpp`. Un punto y coma, llave o comilla faltante puede crashear el parser de config.
- Verifica que `requiredAddons` liste nombres de addon validos. Un nombre de addon mal escrito causa un fallo critico.
- Remueve tu mod de los parametros de lanzamiento y confirma que el juego inicia sin el. Luego vuelve a agregarlo para aislar el problema.

---

## Referencia Completa de Archivos

Aqui estan los tres archivos en su forma completa, para copiar y pegar facilmente:

### Archivo 1: `MyFirstMod/mod.cpp`

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### Archivo 2: `MyFirstMod/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### Archivo 3: `MyFirstMod/Scripts/5_Mission/MyFirstMod/MissionHello.c`

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

---

## Siguientes Pasos

Ahora que tienes un mod funcional, aqui estan las progresiones naturales:

1. **[Capitulo 8.2: Crear un Item Personalizado](02-custom-item.md)** -- Definir un nuevo item en el juego con texturas y spawn.
2. **Agregar mas capas de script** -- Crea carpetas `3_Game` y `4_World` para organizar configuracion, clases de datos y logica de entidades. Consulta [Capitulo 2.1: La Jerarquia de 5 Capas de Scripts](../02-mod-structure/01-five-layers.md).
3. **Agregar keybindings** -- Crea un archivo `Inputs.xml` y registra acciones de teclas personalizadas.
4. **Crear UI** -- Construye paneles dentro del juego usando archivos layout y `ScriptedWidgetEventHandler`. Consulta [Capitulo 3: Sistema de GUI](../03-gui-system/01-widget-types.md).
5. **Usar un framework** -- Integra con Community Framework (CF) o MyFramework para funciones avanzadas como RPC, gestion de config y paneles de admin.

---

**Siguiente:** [Capitulo 8.2: Crear un Item Personalizado](02-custom-item.md)
