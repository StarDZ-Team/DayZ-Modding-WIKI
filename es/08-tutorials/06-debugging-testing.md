# Capitulo 8.6: Depuracion y Pruebas de Tu Mod

[Inicio](../README.md) | [<< Anterior: Usar la Plantilla de Mod de DayZ](05-mod-template.md) | **Depuracion y Pruebas** | [Siguiente: Publicar en el Steam Workshop >>](07-publishing-workshop.md)

---

## Tabla de Contenidos

- [Introduccion](#introduccion)
- [El Script Log -- Tu Mejor Amigo](#el-script-log----tu-mejor-amigo)
- [Depuracion con Print (El Metodo Confiable)](#depuracion-con-print-el-metodo-confiable)
- [DayZDiag -- El Ejecutable de Depuracion](#dayzdiag----el-ejecutable-de-depuracion)
- [File Patching -- Editar Sin Reconstruir](#file-patching----editar-sin-reconstruir)
- [Workbench -- Editor de Scripts y Depurador](#workbench----editor-de-scripts-y-depurador)
- [Patrones de Error Comunes y Soluciones](#patrones-de-error-comunes-y-soluciones)
- [Flujo de Trabajo de Pruebas](#flujo-de-trabajo-de-pruebas)
- [Herramientas de Depuracion en el Juego](#herramientas-de-depuracion-en-el-juego)
- [Lista de Verificacion Pre-Release](#lista-de-verificacion-pre-release)
- [Errores Comunes](#errores-comunes)
- [Siguientes Pasos](#siguientes-pasos)

---

## Introduccion

A diferencia de Unity o Unreal, el ejecutable retail de DayZ no soporta adjuntar un depurador a Enforce Script. En su lugar, dependes de cinco herramientas:

1. **Script logs** -- Archivos de texto que capturan cada error, advertencia y salida de Print
2. **Sentencias Print** -- Rastrear el flujo de ejecucion e inspeccionar valores de variables
3. **DayZDiag** -- Build diagnostico con reporte de errores mejorado y herramientas de depuracion
4. **File patching** -- Editar scripts sin reconstruir tu PBO cada vez
5. **Workbench** -- Editor de scripts oficial con verificacion de sintaxis y consola de script

Juntos forman un toolkit poderoso. Este capitulo te ensena como usar cada uno.

---

## El Script Log -- Tu Mejor Amigo

Cada vez que DayZ se ejecuta, escribe un archivo de script log. Este archivo captura cada error de script, advertencia y salida de Print(). Cuando algo sale mal, el script log es el primer lugar donde mirar.

### Donde Encontrar los Script Logs

**Logs del cliente:** `%LocalAppData%\DayZ\` (presiona `Win+R`, pega, Enter)

**Logs del servidor:** Dentro de la carpeta de perfil de tu servidor (configurada via `-profiles=serverprofile`)

Los archivos se nombran `script_YYYY-MM-DD_HH-MM-SS.log` -- la marca de tiempo mas reciente es tu ultima sesion.

### Que Buscar

Los script logs contienen miles de lineas. Necesitas saber que buscar.

**Los errores** estan marcados con `SCRIPT (E)`:

```
SCRIPT (E): MyMod/Scripts/4_World/MyManager.c :: OnInit -- Null pointer access
```

Esto es un error critico. Tu codigo intento hacer algo invalido y DayZ detuvo la ejecucion de esa ruta de codigo. Estos deben ser corregidos.

**Las advertencias** estan marcadas con `SCRIPT (W)`:

```
SCRIPT (W): MyMod/Scripts/4_World/MyManager.c :: Load -- Cannot open file "$profile:MyMod/config.json"
```

Las advertencias no crashean tu codigo, pero a menudo indican un problema que causara problemas mas adelante. No las ignores.

**La salida de Print** aparece como texto plano sin ningun prefijo:

```
[MyMod] Manager initialized with 5 items
```

Esto es salida de tus propias llamadas `Print()`. Es la forma principal en que rastraras lo que tu codigo esta haciendo.

### Como Buscar Eficientemente

Los script logs pueden tener decenas de miles de lineas. Nunca leas linea por linea -- busca tu prefijo de mod o marcadores de error:

```powershell
# PowerShell -- encontrar todos los errores en el log mas reciente
Select-String -Path "$env:LOCALAPPDATA\DayZ\script*.log" -Pattern "SCRIPT \(E\)" | Select-Object -Last 20

# PowerShell -- encontrar todas las lineas de tu mod
Select-String -Path "$env:LOCALAPPDATA\DayZ\script*.log" -Pattern "MyMod" | Select-Object -Last 30
```

```cmd
:: Alternativa con Command Prompt
findstr "SCRIPT (E)" "%LocalAppData%\DayZ\script_2026-03-21_14-30-05.log"
```

### Entender Entradas de Log Comunes

| Entrada de Log | Significado |
|-----------|---------|
| `SCRIPT (E): Cannot convert string to int` | Desajuste de tipos -- pasando o asignando el tipo incorrecto |
| `SCRIPT (E): Null pointer access in ... :: Update` | Llamando a un metodo en un objeto NULL (error mas comun) |
| `SCRIPT (E): Undefined variable 'manger'` | Typo en nombre de variable o ambito incorrecto |
| `SCRIPT (E): Method 'GetHelth' not found in class 'EntityAI'` | El metodo no existe -- verifica la ortografia y la clase padre |

### Observacion de Log en Tiempo Real

Observa el log en vivo en una ventana separada de PowerShell mientras DayZ se ejecuta:

```powershell
# Seguir el script log mas reciente en tiempo real
Get-ChildItem "$env:LOCALAPPDATA\DayZ\script*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object {
    Get-Content $_.FullName -Wait -Tail 50
}
```

Filtrar para mostrar solo errores y salida de tu mod:

```powershell
Get-ChildItem "$env:LOCALAPPDATA\DayZ\script*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object {
    Get-Content $_.FullName -Wait -Tail 50 | Where-Object { $_ -match "SCRIPT \(E\)|SCRIPT \(W\)|\[MyMod\]" }
}
```

---

## Depuracion con Print (El Metodo Confiable)

Cuando necesitas saber que esta haciendo tu codigo en runtime, `Print()` es tu herramienta principal. Escribe una linea al script log que puedes leer despues u observar en tiempo real.

### Uso Basico de Print

```c
class MyManager
{
    void Init()
    {
        Print("[MyMod] MyManager.Init() called");

        int count = LoadItems();
        Print("[MyMod] Loaded " + count.ToString() + " items");
    }
}
```

Esto produce lineas en el script log como:

```
[MyMod] MyManager.Init() called
[MyMod] Loaded 5 items
```

### Salida Formateada

Usa concatenacion de strings para construir mensajes informativos con suficiente contexto para ser utiles por si solos:

```c
void ProcessPlayer(PlayerBase player)
{
    if (!player)
    {
        Print("[MyMod] ProcessPlayer: player is NULL, aborting");
        return;
    }

    string name = player.GetIdentity().GetName();
    vector pos = player.GetPosition();
    Print("[MyMod] Processing: " + name + " at " + pos.ToString());
}
```

### Crear un Logger de Depuracion

En lugar de esparcir llamadas crudas de `Print()`, crea un logger activable:

```c
class MyModDebug
{
    static bool s_Enabled = true;

    static void Log(string msg)
    {
        if (s_Enabled)
            Print("[MyMod:DEBUG] " + msg);
    }

    static void Error(string msg)
    {
        // Los errores siempre se imprimen sin importar el flag de debug
        Print("[MyMod:ERROR] " + msg);
    }
}
```

Usalo a lo largo de tu codigo: `MyModDebug.Log("Player connected: " + name);`

### Usar Defines de Preprocesador para Codigo Solo de Debug

Enforce Script soporta `#ifdef` para incluir codigo solo en builds de desarrollo:

```c
void Update()
{
    #ifdef DEVELOPER
    Print("[MyMod] Update tick, active items: " + m_Items.Count().ToString());
    #endif

    // Codigo normal aqui...
}
```

`DEVELOPER` esta configurado en DayZDiag y Workbench pero no en DayZ retail. `DIAG_DEVELOPER` es otro define util disponible solo en builds diagnosticos. El codigo dentro de estas guardas tiene cero costo en builds de release.

### Eliminar Debug Prints Antes del Release

Si no usas guardas `#ifdef`, elimina todas las llamadas `Print()` antes de publicar. La salida excesiva hincha los logs, afecta el rendimiento del servidor y puede exponer informacion interna. Un prefijo consistente como `[MyMod:DEBUG]` los hace faciles de encontrar y eliminar.

---

## DayZDiag -- El Ejecutable de Depuracion

DayZDiag es un build diagnostico especial de DayZ con funciones que la version retail no tiene.

### Que Hace Diferente a DayZDiag

| Caracteristica | DayZ Retail | DayZDiag |
|---------|-------------|----------|
| Soporte de file patching | No | Si |
| Define `DEVELOPER` activo | No | Si |
| Define `DIAG_DEVELOPER` activo | No | Si |
| Detalle de error adicional en logs | Basico | Detallado |
| Acceso a consola de admin | No | Si |
| Consola de script | No | Si |
| Camara libre | No | Si |

### Como Obtener DayZDiag

DayZDiag se incluye con DayZ Tools (no es una descarga separada). Despues de instalar DayZ Tools desde Steam, encuentra `DayZDiag_x64.exe` en:

```
C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\
```

### Parametros de Lanzamiento

Crea un archivo batch o acceso directo con estos parametros:

**Cliente (un jugador con servidor):**

```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -profiles=clientprofile -server -port=2302
```

**Cliente (conectar a servidor separado):**

```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -connect=127.0.0.1 -port=2302
```

**Servidor dedicado:**

```batch
DayZDiag_x64.exe -filePatching -server -mod=P:\MyMod -config=serverDZ.cfg -port=2302 -profiles=serverprofile
```

Parametros clave:

| Parametro | Proposito |
|-----------|---------|
| `-filePatching` | Habilitar carga de archivos sueltos desde la unidad P: (ver siguiente seccion) |
| `-mod=P:\MyMod` | Cargar tu mod desde la unidad P: |
| `-profiles=folder` | Establecer la carpeta de perfil para logs y configs |
| `-server` | Ejecutar como listen server local (pruebas de un jugador) |
| `-connect=IP` | Conectar a un servidor en la IP dada |
| `-port=PORT` | Establecer el puerto de red (predeterminado 2302) |

### Cuando Usar DayZDiag vs Retail

- **Durante el desarrollo:** Siempre usa DayZDiag. Te da file patching, mejores errores y herramientas de depuracion.
- **Antes del release:** Prueba con el ejecutable retail de DayZ para asegurarte de que todo funciona para los jugadores. Algunos comportamientos difieren entre DayZDiag y retail (por ejemplo, el codigo con `#ifdef DEVELOPER` no se ejecutara en retail).

---

## File Patching -- Editar Sin Reconstruir

El file patching es el mayor ahorro de tiempo en el modding de DayZ. Sin el, cada cambio de script requiere: editar archivo, reconstruir PBO, copiar PBO, reiniciar DayZ. Con file patching puedes: editar archivo, reiniciar la mision. Eso es todo.

### Como Funciona

Cuando DayZ carga con el parametro `-filePatching`, verifica la unidad P: buscando archivos sueltos antes de cargar archivos de PBOs. Si encuentra un archivo en P: que coincide con un archivo en un PBO, el archivo suelto tiene prioridad.

Esto significa:

1. Tu mod esta configurado en la unidad P: (via `SetupWorkdrive.bat` o junction manual)
2. Lanzas DayZDiag con `-filePatching -mod=P:\MyMod`
3. DayZ carga tus scripts desde la unidad P: directamente -- no desde el PBO
4. Editas un archivo `.c` en la unidad P:, lo guardas
5. Te reconectas o reinicias la mision en el juego
6. DayZ recoge tu archivo modificado inmediatamente

No se necesita reconstruir PBO. El ciclo de edicion-prueba pasa de minutos a segundos.

### Configurar File Patching

1. Asegurate de que el codigo fuente de tu mod este en la unidad P: (desde el [Capitulo 8.1](01-first-mod.md))
2. Lanza: `DayZDiag_x64.exe -filePatching -mod=P:\MyMod -server -port=2302`
3. Edita un archivo `.c`, guarda, reconecta en el juego -- tus cambios estan en vivo

### Que Funciona Con File Patching

| Tipo de Archivo | Funciona File Patching? |
|-----------|---------------------|
| Archivos de script (`.c`) | Si |
| Archivos de layout (`.layout`) | Si |
| Texturas (`.edds`, `.paa`) | Si |
| Archivos de sonido | Si |
| `config.cpp` | **No** -- debe reconstruir PBO |
| `mod.cpp` | **No** -- debe reconstruir PBO |
| Archivos nuevos (no en PBO) | **No** -- debe reconstruir PBO para registrarlos |

La limitacion clave: los cambios a `config.cpp` siempre requieren reconstruir el PBO. Esto incluye agregar nuevas clases, cambiar `requiredAddons` o modificar `CfgMods`. Si agregas un archivo `.c` completamente nuevo, tambien necesitas reconstruir el PBO para que la carga de scripts de `config.cpp` sepa del nuevo archivo.

### El Flujo de Trabajo de File Patching

Aqui esta el ciclo de desarrollo ideal:

```
1. Construir tu PBO una vez (para establecer la lista de archivos en config.cpp)
2. Lanzar DayZDiag con -filePatching -mod=P:\MyMod
3. Editar un archivo .c en la unidad P:
4. Guardar el archivo
5. En el juego: desconectar y reconectar (o reiniciar mision)
6. Verificar el script log buscando tus cambios
7. Repetir desde el paso 3
```

Este ciclo puede tomar menos de 30 segundos por iteracion comparado con varios minutos al reconstruir PBOs cada vez.

---

## Workbench -- Editor de Scripts y Depurador

Workbench es el entorno de desarrollo oficial de DayZ incluido con DayZ Tools.

### Lanzar y Configurar

1. Abre **DayZ Tools** desde Steam, haz clic en **Workbench**
2. Ve a **File > Open Project** y apuntalo al directorio de scripts de tu mod en la unidad P:
3. Workbench indexa tus archivos `.c` y provee awareness de sintaxis

### Funciones Clave

- **Resaltado de sintaxis** -- Palabras clave, tipos, strings y comentarios tienen colores
- **Completado de codigo** -- Escribe un nombre de clase seguido de un punto para ver los metodos disponibles
- **Resaltado de errores** -- Los errores de sintaxis se subrayan en rojo antes de ejecutar nada
- **Consola de Script** -- Ejecuta comandos de Enforce Script en vivo:

```c
// Imprimir la posicion del jugador
Print(GetGame().GetPlayer().GetPosition().ToString());

// Spawnear un item en tu posicion
GetGame().GetPlayer().SpawnEntityOnGroundPos("AKM", GetGame().GetPlayer().GetPosition());
```

### Limitaciones

- **No es un entorno de juego completo:** Algunas APIs solo funcionan en el juego real, no en la simulacion de Workbench
- **Separado del runtime del juego:** Aun necesitas guardar archivos y reiniciar la mision para ver cambios en el juego
- **Contexto de mod incompleto:** Las referencias entre mods pueden mostrarse como errores incluso cuando funcionan en el juego

---

## Patrones de Error Comunes y Soluciones

Tablas de referencia de los errores mas comunes y como corregirlos. Guarda esta seccion en favoritos.

### Errores de Script

| Mensaje de Error | Causa | Solucion |
|---------------|-------|-----|
| `Null pointer access` | Llamar a un metodo en una variable que es NULL | Agrega una verificacion de null antes de usar: `if (obj) { obj.DoThing(); }` |
| `Cannot convert X to Y` | Desajuste de tipos en asignacion o llamada a funcion | Verifica el tipo esperado. Usa `Class.CastTo()` para casteo seguro. |
| `Undefined variable 'xyz'` | Typo en nombre de variable o ambito incorrecto | Verifica la ortografia. Asegurate de que la variable esta declarada en el ambito actual. |
| `Method 'xyz' not found in class 'Abc'` | Llamar a un metodo que no existe en esa clase | Verifica la jerarquia de clases. Busca el nombre correcto del metodo en la API. |
| `Division by zero` | Dividir por una variable que es igual a 0 | Agrega una guarda: `if (divisor != 0) { result = value / divisor; }` |
| `Stack overflow` | Recursion infinita en tu codigo | Verifica metodos que se llaman a si mismos sin una condicion de salida apropiada. |
| `Type 'MyClass' not found` | El archivo que define MyClass no esta cargado o esta en una capa de script superior | Verifica el orden de carga de scripts en config.cpp. Las capas inferiores no pueden ver las superiores. |

### Errores de Config

| Mensaje de Error | Causa | Solucion |
|---------------|-------|-----|
| `Config parse error` | Punto y coma, llave o comilla faltante en config.cpp | Verifica la sintaxis de config.cpp cuidadosamente. Cada propiedad necesita un punto y coma. Cada clase necesita llaves de apertura y cierre. |
| `Addon 'X' requires addon 'Y'` | Dependencia faltante en requiredAddons | Agrega el addon requerido a tu array `requiredAddons[]`. |
| `Cannot find mod` | Nombre o ruta de la carpeta del mod incorrecto | Verifica que el parametro `-mod=` coincida exactamente con el nombre de tu carpeta de mod. |

### Errores de Carga de Mod

| Sintoma | Causa | Solucion |
|---------|-------|-----|
| El mod no aparece en el launcher | `mod.cpp` faltante o invalido | Verifica que `mod.cpp` existe en la raiz del mod y tiene campos `name` y `dir` validos. |
| Los scripts no se ejecutan | config.cpp no registra scripts | Verifica que la clase `CfgMods` en config.cpp tiene la ruta `Script` correcta apuntando a tu config.cpp de scripts. |
| El mod carga pero faltan funciones | Problema de capa de script | Verifica que los archivos estan en las carpetas de capa correctas (3_Game, 4_World, 5_Mission). |

### Problemas de Runtime

| Sintoma | Causa | Solucion |
|---------|-------|-----|
| RPC no recibido en servidor | Registro de RPC incorrecto o desajuste de identidad | Verifica que el RPC esta registrado tanto en cliente como en servidor. Verifica que el ID de RPC coincida. |
| RPC no recibido en cliente | Servidor no envia, o cliente no registrado | Agrega Print() en el lado del servidor para confirmar el envio. Verifica el codigo de registro del cliente. |
| UI no se muestra | Ruta de layout incorrecta o widget padre es null | Verifica que la ruta del archivo `.layout` es correcta relativa al mod. Verifica que el widget padre existe. |
| Config JSON no carga | Ruta de archivo incorrecta o error de sintaxis JSON | Verifica la ruta del archivo. Valida la sintaxis JSON (sin comas al final, comillas apropiadas). |
| Datos de jugador no se guardan | Permisos de carpeta de perfil o problema de ruta | Verifica que la ruta `$profile:` es accesible y que la carpeta existe. |

### Null Pointers y Casteo Seguro -- Ejemplos Detallados

Estos dos errores son tan comunes que merecen ejemplos trabajados.

**Codigo inseguro (crashea si GetPlayer() o GetIdentity() retorna NULL):**

```c
void DoSomething()
{
    PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
    string name = player.GetIdentity().GetName();  // crash si player o identity es NULL
}
```

**Codigo seguro (proteger cada potencial null):**

```c
void DoSomething()
{
    Man man = GetGame().GetPlayer();
    if (!man)
        return;

    PlayerBase player;
    if (!Class.CastTo(player, man))
        return;

    PlayerIdentity identity = player.GetIdentity();
    if (!identity)
        return;

    Print("[MyMod] Player: " + identity.GetName());
}
```

**Patron de casteo seguro con `Class.CastTo()`:**

```c
void ProcessEntity(Object obj)
{
    ItemBase item;
    if (Class.CastTo(item, obj))
    {
        item.SetQuantity(1);
    }
    else
    {
        Print("[MyMod] Object is not an ItemBase: " + obj.GetType());
    }
}
```

`Class.CastTo()` retorna `true` en exito, `false` en fallo. Siempre verifica el valor de retorno.

---

## Flujo de Trabajo de Pruebas

El modding de DayZ no tiene un framework de pruebas automatizadas. Las pruebas son manuales: construir, lanzar, jugar, observar, verificar logs. Un flujo de trabajo eficiente es critico.

### El Ciclo Basico de Pruebas

```
Editar Codigo --> Construir PBO --> Lanzar DayZ --> Probar en el Juego --> Verificar Log --> Corregir --> Repetir
```

Con file patching, omite la construccion de PBO: edita `.c` en la unidad P:, reconecta, verifica log. Esto reduce la iteracion de minutos a segundos.

### Probar Server Mods

Si tu mod tiene logica del lado del servidor, necesitas un servidor dedicado local.

**Opcion 1: Listen server (mas simple)**

Lanza DayZDiag con `-server` para ejecutar tanto cliente como servidor en un solo proceso:

```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -server -port=2302
```

Esta es la forma mas rapida de probar, pero no replica perfectamente un entorno de servidor dedicado.

**Opcion 2: Servidor dedicado local (mas preciso)**

Ejecuta un proceso de servidor DayZDiag separado, luego conectate con un cliente DayZDiag:

Servidor:
```batch
DayZDiag_x64.exe -filePatching -server -mod=P:\MyMod -config=serverDZ.cfg -port=2302 -profiles=serverprofile
```

Cliente:
```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -connect=127.0.0.1 -port=2302
```

Esto te da logs separados de cliente y servidor, lo cual es esencial para depurar comunicacion RPC y logica de division cliente-servidor.

### Probar Solo Cliente y Multijugador

Para mods solo de cliente (UI, HUD), un listen server es suficiente: agrega `-server` a tus parametros de lanzamiento.

Para pruebas multijugador, tienes tres opciones:
- **Dos instancias en una maquina:** Ejecuta servidor DayZDiag + dos clientes con diferentes carpetas `-profiles`
- **Probar con un amigo:** Hostea un servidor DayZDiag, abre el puerto 2302 del firewall
- **Servidor en la nube:** Configura un servidor dedicado remoto

### Usar Scripts de Construccion

Si tu proyecto tiene un script de construccion (como `dev.py`), usalo para automatizar el ciclo:

```bash
python dev.py build     # Construir todos los PBOs
python dev.py server    # Construir + lanzar servidor + monitorear logs
python dev.py client    # Lanzar cliente (conecta a localhost:2302)
python dev.py full      # Construir + servidor + monitorear + auto-lanzar cliente
python dev.py check     # Verificar ultimo script log buscando errores (offline)
python dev.py watch     # Seguimiento de log en tiempo real, filtrado para errores y salida del mod
python dev.py kill      # Matar procesos de DayZ para reiniciar
```

El comando `watch` es especialmente valioso -- filtra el log en vivo para mostrar solo salida relevante.

---

## Herramientas de Depuracion en el Juego

DayZDiag provee varias herramientas en el juego para pruebas. Estas no estan disponibles en builds retail.

### Consola de Script

Abre con la tecla de acento grave (`` ` ``) o verifica tus keybindings para "Script Console". Ejecuta comandos de Enforce Script en vivo:

```c
// Spawnear un item en tu posicion
GetGame().GetPlayer().SpawnEntityOnGroundPos("AKM", GetGame().GetPlayer().GetPosition());

// Teletransportar a coordenadas
GetGame().GetPlayer().SetPosition("8000 0 10000");

// Imprimir tu posicion actual
Print(GetGame().GetPlayer().GetPosition().ToString());
```

### Camara Libre

Activa a traves del menu de herramientas de admin. Vuela alrededor separado de tu personaje para inspeccionar objetos spawneados, verificar ubicacion o observar comportamiento de AI.

### Spawn de Objetos

```c
// Spawnear un zombie
GetGame().CreateObjectEx("ZmbM_HermitSkinny_Base", "8000 0 10000", ECE_PLACE_ON_SURFACE);

// Spawnear un vehiculo
GetGame().CreateObjectEx("OffroadHatchback", "8000 0 10000", ECE_PLACE_ON_SURFACE);
```

### Manipulacion de Tiempo y Clima

```c
// Establecer a mediodia / medianoche
GetGame().GetWorld().SetDate(2026, 6, 15, 12, 0);
GetGame().GetWorld().SetDate(2026, 6, 15, 0, 0);

// Sobreescribir clima
Weather weather = GetGame().GetWeather();
weather.GetOvercast().Set(0.8, 0, 0);
weather.GetRain().Set(1.0, 0, 0);
weather.GetFog().Set(0.5, 0, 0);
```

---

## Lista de Verificacion Pre-Release

Antes de publicar en el Steam Workshop, revisa cada punto.

### 1. Eliminar o Proteger Toda la Salida de Debug

Busca `Print(` y asegurate de que cada print de debug se elimine o se envuelva en `#ifdef DEVELOPER`.

### 2. Probar Con un Perfil Limpio

Renombra `%LocalAppData%\DayZ\` a `DayZ_backup` y prueba desde cero. Esto detecta suposiciones sobre datos en cache o archivos de configuracion existentes.

### 3. Probar el Orden de Carga del Mod

Prueba tu mod cargado antes y despues de otros mods populares. Verifica colisiones de nombres de clase, conflictos de ID de RPC y sobreescrituras de config.cpp.

### 4. Verificar Fugas de Memoria

Observa la memoria del servidor con el tiempo. Causas comunes de fugas: objetos creados en bucles sin limpieza, referencias `ref` circulares (un lado debe ser crudo), arrays que crecen sin limites.

### 5. Verificar Entradas de Stringtable

Cada `#key_name` referenciado en el codigo necesita una fila correspondiente en `stringtable.csv`. Las entradas faltantes se muestran como strings de clave crudos en el juego.

### 6. Probar en un Servidor Dedicado

Las pruebas en listen server ocultan problemas de timing de RPC, diferencias de autoridad y bugs de sincronizacion multi-cliente. Siempre haz una prueba final en un servidor dedicado real.

### 7. Probar una Instalacion Limpia del Workshop

Desuscribete, elimina la carpeta del mod local, vuelve a suscribirte y prueba. Esto verifica que la subida al Workshop esta completa.

---

## Errores Comunes

Errores que todo modder de DayZ comete al menos una vez. Aprende de ellos.

### 1. Dejar Debug Prints en Builds de Release

Los jugadores no necesitan `[MyMod:DEBUG] Tick count: 14523` en sus logs. Envuelve en `#ifdef DEVELOPER` o elimina completamente.

### 2. Probar Solo en Un Jugador

Los listen servers ejecutan cliente y servidor en un proceso, ocultando RPCs que nunca cruzan la red, condiciones de carrera, diferencias de verificacion de autoridad y referencias de identidad nulas. Prueba con un servidor dedicado separado.

### 3. No Probar Con Otros Mods

Tu mod puede conflictuar con CF, Expansion u otros mods populares via IDs de RPC duplicados, llamadas a `super` faltantes en overrides, o colisiones de clases de config. Prueba combinaciones antes del release.

### 4. Ignorar Advertencias

Las advertencias `SCRIPT (W)` a menudo predicen crashes futuros. Una advertencia de archivo faltante hoy se convierte en un null pointer manana.

### 5. No Usar File Patching

Reconstruir PBOs para cada cambio de una sola linea desperdicia un tiempo enorme. Configura file patching una vez (ver [arriba](#file-patching----editar-sin-reconstruir)).

### 6. No Verificar Tanto Logs de Cliente como de Servidor

Para problemas de RPC/cliente-servidor, el error a menudo esta en un lado y el sintoma en el otro. Verifica tanto `%LocalAppData%\DayZ\` (cliente) como la carpeta de perfil de tu servidor.

### 7. Cambiar config.cpp Sin Reconstruir

El file patching no aplica a `config.cpp`. Nuevas clases, cambios de `requiredAddons` y ediciones de `CfgMods` siempre requieren reconstruir el PBO.

### 8. Capa de Script Incorrecta

Las capas inferiores no pueden ver las superiores. Si codigo en `3_Game/` referencia `PlayerBase` (definido en `4_World/`), falla:

```
3_Game/   -- No puede referenciar tipos de 4_World o 5_Mission
4_World/  -- Puede referenciar 3_Game, no puede referenciar 5_Mission
5_Mission/-- Puede referenciar 3_Game y 4_World
```

---

## Siguientes Pasos

1. **Configura file patching** si aun no lo has hecho. Es la mejora individual mas impactante para tu flujo de trabajo de desarrollo.
2. **Crea una clase de debug logger** para tu mod con un prefijo consistente para que puedas filtrar facilmente la salida del log.
3. **Practica leyendo el script log.** Abrelo despues de cada sesion de prueba y busca errores y advertencias, incluso si todo parecio funcionar. Los errores silenciosos pueden causar bugs sutiles que aparecen despues.
4. **Explora Workbench.** Abre los scripts de tu mod en Workbench y prueba la Consola de Script. Toma tiempo acostumbrarse, pero vale la pena.
5. **Construye un escenario de prueba.** Crea una mision guardada o script que configure un entorno de prueba especifico (spawnea items, establece hora del dia, teletransporta a una ubicacion) para que puedas reproducir bugs rapidamente.
6. **Lee el [Capitulo 8.1](01-first-mod.md)** si aun no has construido tu primer mod. La depuracion es mucho mas facil cuando entiendes la estructura completa del mod.

---

## Mejores Practicas

- **Verifica el script log PRIMERO antes de cambiar codigo.** La mayoria de los bugs tienen un mensaje de error claro en el log. Cambiar codigo sin leer el log lleva a adivinanzas ciegas y nuevos bugs.
- **Usa guardas `#ifdef DEVELOPER` para todos los debug prints.** Esto asegura cero costo de rendimiento en builds retail y previene spam de logs para los jugadores. Reserva los `Print()` sin guarda solo para errores criticos.
- **Siempre verifica tanto los logs de cliente como de servidor para problemas de RPC.** El error a menudo esta en un lado y el sintoma en el otro. Un null pointer del lado del servidor silenciosamente descarta la respuesta, y el cliente solo ve "no data received."
- **Configura file patching desde el dia uno.** El ciclo de editar-reiniciar-verificar baja de 3-5 minutos (reconstruir PBO) a menos de 30 segundos (guardar y reconectar). Esta es la mejora de productividad individual mas grande.
- **Usa un prefijo de log consistente como `[MyMod]` en cada llamada a Print.** Los script logs contienen salida del codigo vanilla, el motor y cada mod cargado. Sin un prefijo, tu salida es invisible en el ruido.

---

## Teoria vs Practica

| Concepto | Teoria | Realidad |
|---------|--------|---------|
| Advertencias `SCRIPT (W)` | Las advertencias no son fatales y pueden ignorarse con seguridad | Las advertencias a menudo predicen crashes futuros. Una advertencia "Cannot open file" hoy se convierte en un crash de null pointer manana cuando el codigo asume que el archivo fue cargado. |
| Pruebas en listen server | Suficientemente bueno para verificar que los scripts funcionan | Los listen servers ocultan categorias enteras de bugs: RPCs que nunca cruzan la red, verificaciones de autoridad faltantes, `PlayerIdentity` null en el servidor, y condiciones de carrera entre el init del cliente y del servidor. |
| File patching | Editar cualquier archivo y ver cambios instantaneamente | `config.cpp` nunca se aplica file patching. Los archivos `.c` nuevos tampoco se recogen. Ambos requieren reconstruir el PBO. Solo las modificaciones a archivos de script y layout existentes se recargan en vivo. |
| Depurador de Workbench | Experiencia de depuracion de IDE completa | Workbench puede verificar sintaxis y ejecutar scripts aislados, pero no replica el entorno de juego completo. Muchas APIs retornan null o se comportan diferente fuera del juego. |

---

## Lo que Aprendiste

En este tutorial aprendiste:
- Como encontrar y leer los script logs de DayZ, y que significan los marcadores `SCRIPT (E)` y `SCRIPT (W)`
- Como usar depuracion con `Print()` con prefijos, formateadores y loggers de debug activables
- Como configurar DayZDiag con file patching para iteracion rapida
- Como diagnosticar los patrones de error mas comunes: null pointers, desajustes de tipo, variables no definidas y violaciones de capas de script
- Como establecer un flujo de trabajo de pruebas confiable desde la edicion hasta la verificacion

**Siguiente:** [Capitulo 8.8: Construir un HUD Overlay](08-hud-overlay.md)

---
