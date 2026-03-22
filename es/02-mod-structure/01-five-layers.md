# Capitulo 2.1: La Jerarquia de 5 Capas de Scripts

[Inicio](../README.md) | **La Jerarquia de 5 Capas de Scripts** | [Siguiente: config.cpp a Fondo >>](02-config-cpp.md)

---

## Tabla de Contenidos

- [Vision General](#vision-general)
- [La Pila de Capas](#la-pila-de-capas)
- [Capa 1: 1_Core (engineScriptModule)](#capa-1-1_core-enginescriptmodule)
- [Capa 2: 2_GameLib (gameLibScriptModule)](#capa-2-2_gamelib-gamelibscriptmodule)
- [Capa 3: 3_Game (gameScriptModule)](#capa-3-3_game-gamescriptmodule)
- [Capa 4: 4_World (worldScriptModule)](#capa-4-4_world-worldscriptmodule)
- [Capa 5: 5_Mission (missionScriptModule)](#capa-5-5_mission-missionscriptmodule)
- [La Regla Critica](#la-regla-critica)
- [Orden de Carga y Sincronizacion](#orden-de-carga-y-sincronizacion)
- [Cuando se Ejecuta el Codigo de Cada Capa](#cuando-se-ejecuta-el-codigo-de-cada-capa)
- [Guias Practicas](#guias-practicas)
- [Guia Rapida de Decision](#guia-rapida-de-decision)
- [Errores Comunes](#errores-comunes)

---

## Vision General

El motor de DayZ compila los scripts en cinco pasadas distintas llamadas **modulos de script**. Cada modulo corresponde a una carpeta numerada en el directorio `Scripts/` de tu mod:

```
Scripts/
  1_Core/          --> engineScriptModule
  2_GameLib/       --> gameLibScriptModule
  3_Game/          --> gameScriptModule
  4_World/         --> worldScriptModule
  5_Mission/       --> missionScriptModule
```

Cada capa se construye sobre las anteriores. Los numeros no son arbitrarios -- definen un orden estricto de compilacion y dependencia impuesto por el motor.

---

## La Pila de Capas

```
+---------------------------------------------------------------+
|                                                               |
|   5_Mission   (missionScriptModule)                           |
|   UI, HUD, ciclo de vida de mision, pantallas de menu         |
|   Puede referenciar: todo lo de abajo (1-4)                   |
|                                                               |
+---------------------------------------------------------------+
|                                                               |
|   4_World     (worldScriptModule)                             |
|   Entidades, items, vehiculos, managers, logica de gameplay   |
|   Puede referenciar: 1_Core, 2_GameLib, 3_Game                |
|                                                               |
+---------------------------------------------------------------+
|                                                               |
|   3_Game      (gameScriptModule)                              |
|   Configs, registro de RPC, clases de datos, input bindings   |
|   Puede referenciar: 1_Core, 2_GameLib                        |
|                                                               |
+---------------------------------------------------------------+
|                                                               |
|   2_GameLib   (gameLibScriptModule)                           |
|   Bindings del motor de bajo nivel (raramente usado por mods) |
|   Puede referenciar: solo 1_Core                              |
|                                                               |
+---------------------------------------------------------------+
|                                                               |
|   1_Core      (engineScriptModule)                            |
|   Tipos fundamentales, constantes, funciones de utilidad pura |
|   Puede referenciar: nada (esta es la base)                   |
|                                                               |
+---------------------------------------------------------------+

        ORDEN DE COMPILACION: 1 --> 2 --> 3 --> 4 --> 5
        DIRECCION DE DEPENDENCIA: solo hacia arriba (las inferiores no pueden ver las superiores)
```

---

## Capa 1: 1_Core (engineScriptModule)

### Proposito

```mermaid
graph TB
    subgraph "Script Module Load Order"
        M5["5_Mission<br/>UI, HUD, Mission hooks<br/>MissionServer, MissionGameplay"]
        M4["4_World<br/>Entities, Managers<br/>PlayerBase, ItemBase, CarScript"]
        M3["3_Game<br/>Game init, Configs, RPC<br/>DayZGame, Constants, Enums"]
        M2["2_GameLib<br/>Engine library<br/>Input, Settings, Components"]
        M1["1_Core<br/>Engine bindings<br/>Proto declarations, Math, Physics"]
    end

    M1 --> M2 --> M3 --> M4 --> M5

    M5 -.->|"can reference"| M4
    M5 -.->|"can reference"| M3
    M4 -.->|"can reference"| M3
    M4 -.-x|"CANNOT reference"| M5

    style M5 fill:#4A90D9,color:#fff
    style M4 fill:#2D8A4E,color:#fff
    style M3 fill:#D97A4A,color:#fff
    style M2 fill:#8B5CF6,color:#fff
    style M1 fill:#6B7280,color:#fff
```

La base absoluta. El codigo aqui se ejecuta a nivel del motor antes de que exista cualquier sistema del juego. Este es el punto mas temprano donde el codigo de un mod puede ejecutarse.

### Que Va Aqui

- Constantes y enums compartidos entre todas las capas
- Funciones de utilidad pura (helpers matematicos, utilidades de strings)
- Infraestructura de logging (el logger en si, no lo que registra)
- Defines de preprocesador y typedefs
- Definiciones de clases base que necesitan ser visibles en todas partes

### Ejemplos Reales

**Community Framework** coloca su sistema de modulos central aqui:

```c
// 1_Core/CF_ModuleCoreManager.c
class CF_ModuleCoreManager
{
    static ref array<typename> s_Modules = new array<typename>;

    static void _Insert(typename module)
    {
        s_Modules.Insert(module);
    }
};
```

**MyFramework** coloca sus constantes de logging aqui:

```c
// 1_Core/MyLogLevel.c
enum MyLogLevel
{
    TRACE = 0,
    DEBUG = 1,
    INFO  = 2,
    WARN  = 3,
    ERROR = 4
};
```

### Cuando Usar

Usa `1_Core` solo cuando necesites algo disponible para **todas** las otras capas, y que tenga cero dependencia en tipos del juego como `PlayerBase`, `ItemBase` o `MissionBase`. La mayoria de los mods no necesitan esta capa en absoluto.

---

## Capa 2: 2_GameLib (gameLibScriptModule)

### Proposito

Bindings de la biblioteca del motor de bajo nivel. Esta capa existe en la jerarquia de scripts vanilla pero es **raramente usada por mods**. Se ubica entre el motor crudo y la logica del juego.

### Que Va Aqui

- Abstracciones a nivel de motor (renderizado, bindings del motor de sonido)
- Bibliotecas matematicas mas alla de lo que provee `1_Core`
- Tipos base de widgets/UI del motor

### Ejemplos Reales

**DabsFramework** es uno de los pocos mods que usa esta capa:

```c
// 2_GameLib/DabsFramework/MVC/ScriptView.c
// Infraestructura de binding de vistas de bajo nivel
class ScriptView : ScriptedWidgetEventHandler
{
    // ...
};
```

### Cuando Usar

Casi nunca. A menos que estes construyendo un framework que necesite bindings a nivel de motor por debajo de la capa del juego, omite `2_GameLib` completamente. La gran mayoria de mods usa solo las capas 3, 4 y 5.

---

## Capa 3: 3_Game (gameScriptModule)

### Proposito

La capa de trabajo pesado para configuracion, definiciones de datos y sistemas que no interactuan directamente con entidades del mundo. Esta es la primera capa donde los tipos del juego estan disponibles.

### Que Va Aqui

- Clases de configuracion (settings que se pueden cargar/guardar)
- Registro de RPC e identificadores
- Clases de datos y DTOs (objetos de transferencia de datos)
- Registro de input bindings
- Sistemas de registro de plugins/modulos
- Enums y constantes compartidos que dependen de tipos del juego
- Handlers de keybinds personalizados

### Ejemplos Reales

Sistema de configuracion de **MyFramework**:

```c
// 3_Game/MyMod/Config/MyConfigBase.c
class MyConfigBase
{
    // Configuracion base con persistencia JSON automatica
    void Load();
    void Save();
    string GetConfigPath();
};
```

**COT** define sus identificadores de RPC aqui:

```c
// 3_Game/COT/RPCData.c
class JMRPCData
{
    static const int WEATHER_SET  = 0x1001;
    static const int PLAYER_HEAL  = 0x1002;
    // ...
};
```

**VPP Admin Tools** registra sus comandos de chat:

```c
// 3_Game/VPPAdminTools/ChatCommands/ChatCommandBase.c
class ChatCommandBase
{
    string GetCommand();
    bool Execute(PlayerIdentity sender, array<string> args);
};
```

### Cuando Usar

**Si tienes dudas, ponlo en `3_Game`.** Esta es la capa predeterminada para la mayoria del codigo que no es de entidades. Clases de configuracion, enums, constantes, definiciones de RPC, clases de datos -- todo pertenece aqui.

---

## Capa 4: 4_World (worldScriptModule)

### Proposito

Logica de gameplay que interactua con el mundo 3D. Esta capa tiene acceso a entidades, items, vehiculos, edificios y todos los objetos del mundo.

### Que Va Aqui

- Items y armas personalizados (extendiendo `ItemBase`, `Weapon_Base`)
- Entidades personalizadas (extendiendo `Building`, `DayZAnimal`, etc.)
- Managers del mundo (sistemas de spawn, managers de loot, directores de AI)
- Extensiones de jugador (comportamiento modded de `PlayerBase`)
- Personalizacion de vehiculos
- Sistemas de acciones (extendiendo `ActionBase`)
- Zonas trigger y efectos de area

### Ejemplos Reales

**MyMissions Mod** spawnea marcadores de mision en el mundo:

```c
// 4_World/Missions/MyMissionMarker.c
class MyMissionMarker : House
{
    void MyMissionMarker()
    {
        SetFlags(EntityFlags.VISIBLE, true);
    }

    void SetPosition(vector pos)
    {
        SetPosition(pos);
    }
};
```

**MyAI Mod** implementa entidades de bots aqui:

```c
// 4_World/AI/MyAIBot.c
class MyAIBot : SurvivorBase
{
    protected ref MyAIBrain m_Brain;

    override void EOnInit(IEntity other, int extra)
    {
        super.EOnInit(other, extra);
        m_Brain = new MyAIBrain(this);
    }
};
```

**DayZ Vanilla** define todos los items aqui:

```c
// 4_World/Entities/ItemBase/Edible_Base.c
class Edible_Base extends ItemBase
{
    // Todos los items de comida heredan de esto
};
```

### Cuando Usar

Cualquier cosa que toque el mundo fisico del juego: crear entidades, modificar items, manejar interacciones de jugadores, gestionar estado del mundo. Si tu clase extiende `EntityAI`, `ItemBase`, `PlayerBase`, `Building` o interactua con `GetGame().GetWorld()`, pertenece en `4_World`.

---

## Capa 5: 5_Mission (missionScriptModule)

### Proposito

La capa mas alta. Ciclo de vida de la mision, paneles de UI, overlays de HUD y el punto de inicializacion final. Aqui es donde vive el codigo de arranque del lado del cliente y del servidor.

### Que Va Aqui

- Hooks de la clase de mision (overrides de `MissionServer`, `MissionGameplay`)
- Paneles de HUD y UI
- Pantallas de menu
- Registro e inicializacion de mods (la secuencia de "arranque")
- Overlays de renderizado del lado del cliente
- Handlers de arranque/apagado del servidor

### Ejemplos Reales

**MyFramework** se engancha a la mision para inicializar todos los subsistemas:

```c
// 5_Mission/MyMod/MyModMissionClient.c
modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        MyFramework.Init();
    }

    override void OnMissionFinish()
    {
        MyFramework.ShutdownAll();
        super.OnMissionFinish();
    }
};
```

**COT** agrega su menu de admin aqui:

```c
// 5_Mission/COT/gui/COT_Menu.c
class COT_Menu : UIScriptedMenu
{
    override Widget Init()
    {
        // Construir UI del panel de admin
    }
};
```

**MyMissions Mod** se registra con Core:

```c
// 5_Mission/Missions/MyMissionsRegister.c
class MyMissionsRegister
{
    void MyMissionsRegister()
    {
        MyFramework.RegisterMod("Missions", "1.0.0");
        MyFramework.RegisterModConfig(new MyMissionsConfig());
    }
};
```

### Cuando Usar

UI, HUD, pantallas de menu e inicializacion de mods que depende de que la mision este activa. Tambien el ultimo lugar donde el servidor se engancha al ciclo de vida de arranque/apagado.

---

## La Regla Critica

> **Las capas inferiores NO PUEDEN referenciar tipos de las capas superiores.**

Esta es la regla mas importante en la arquitectura de scripts de DayZ. El motor la impone en tiempo de compilacion.

```
PERMITIDO:
  Codigo de 5_Mission referencia una clase de 4_World       OK
  Codigo de 4_World referencia una clase de 3_Game           OK
  Codigo de 3_Game referencia una clase de 1_Core            OK

PROHIBIDO:
  Codigo de 3_Game referencia una clase de 4_World           ERROR DE COMPILACION
  Codigo de 4_World referencia una clase de 5_Mission        ERROR DE COMPILACION
  Codigo de 1_Core referencia una clase de 3_Game            ERROR DE COMPILACION
```

### Por que Existe

Cada capa se compila por separado y secuencialmente. Cuando `3_Game` se esta compilando, `4_World` y `5_Mission` aun no existen. El compilador no tiene conocimiento de esos tipos.

### Que Pasa Cuando la Violas

El mensaje de error a menudo no es util:

```
SCRIPT (E): Undefined type 'PlayerBase'
```

Esto tipicamente significa que colocaste codigo en `3_Game` que referencia `PlayerBase`, que esta definido en `4_World`. La solucion es mover tu codigo a `4_World` o superior.

### La Solucion: Castear a Traves de Tipos Base

Cuando el codigo de `3_Game` necesita manejar un objeto que sera un `PlayerBase` en runtime, usa el tipo base `Object` o `Man` (definido en `3_Game`) y castea despues:

```c
// En 3_Game -- no podemos referenciar PlayerBase directamente
class MyConfig
{
    void HandlePlayer(Man player)
    {
        // 'Man' esta disponible en 3_Game
        // En runtime, esto sera un PlayerBase, pero no podemos nombrarlo aqui
    }
};

// En 4_World -- ahora podemos castear de forma segura
class MyWorldLogic
{
    void ProcessPlayer(Man player)
    {
        PlayerBase pb;
        if (Class.CastTo(pb, player))
        {
            // Ahora tenemos acceso completo a PlayerBase
        }
    }
};
```

---

## Orden de Carga y Sincronizacion

### Orden de Compilacion

El motor compila todos los scripts de los mods para cada capa antes de pasar a la siguiente:

```
Paso 1: Compilar scripts de 1_Core de TODOS los mods
Paso 2: Compilar scripts de 2_GameLib de TODOS los mods
Paso 3: Compilar scripts de 3_Game de TODOS los mods
Paso 4: Compilar scripts de 4_World de TODOS los mods
Paso 5: Compilar scripts de 5_Mission de TODOS los mods
```

Dentro de cada paso, los mods se ordenan por su cadena de dependencia `requiredAddons` en `config.cpp`. Si ModB depende de ModA, los scripts de ModA para esa capa se compilan primero.

### Orden de Inicializacion

Despues de la compilacion, la inicializacion en runtime sigue una secuencia diferente:

```
1. El motor arranca, carga configs
2. Los scripts de 1_Core estan disponibles (constructores estaticos se ejecutan)
3. Los scripts de 2_GameLib estan disponibles
4. Los scripts de 3_Game estan disponibles
   --> Las funciones de entrada de CfgMods se ejecutan (ej., "CreateGameMod")
   --> Los input bindings se registran
5. Los scripts de 4_World estan disponibles
   --> Las entidades pueden ser creadas
6. La mision se carga
7. Los scripts de 5_Mission estan disponibles
   --> MissionServer.OnInit() / MissionGameplay.OnInit() se disparan
   --> La UI y HUD se vuelven disponibles
```

---

## Cuando se Ejecuta el Codigo de Cada Capa

| Capa | Init Estatico | Listo en Runtime | Evento Clave |
|-------|------------|---------------|-----------|
| `1_Core` | Primero | Inmediatamente | Arranque del motor |
| `2_GameLib` | Segundo | Despues del init del motor | Subsistemas del motor listos |
| `3_Game` | Tercero | Despues del init del juego | `CreateGame()` / funcion de entrada personalizada |
| `4_World` | Cuarto | Despues de que el mundo carga | Las entidades comienzan a spawnearse |
| `5_Mission` | Quinto (ultimo) | Despues de que la mision inicia | `MissionServer.OnInit()` / `MissionGameplay.OnInit()` |

**Importante:** Las variables estaticas y el codigo de ambito global en cada capa se ejecutan durante la fase de compilacion/enlace, antes de que `OnInit()` sea llamado. No pongas logica de inicializacion compleja en inicializadores estaticos.

---

## Guias Practicas

### "Si Tienes Dudas, Ponlo en 3_Game"

Esta es la capa mas comun para codigo de mods. A menos que tu codigo:
- Necesite estar disponible antes de que existan tipos del juego --> `1_Core`
- Extienda una entidad/item/vehiculo/jugador --> `4_World`
- Toque UI, HUD o ciclo de vida de mision --> `5_Mission`

...entonces pertenece en `3_Game`.

### La Lista de Verificacion de Capas

Antes de colocar un archivo, hazte estas preguntas:

1. **Extiende `EntityAI`, `ItemBase`, `PlayerBase`, `Building` o cualquier entidad del mundo?**
   Ponlo en `4_World`.

2. **Referencia `MissionServer`, `MissionGameplay` o crea widgets de UI?**
   Ponlo en `5_Mission`.

3. **Es una clase de datos pura, config, enum o definicion de RPC?**
   Ponlo en `3_Game`.

4. **Es una constante fundamental o utilidad con cero dependencias del juego?**
   Ponlo en `1_Core`.

5. **Ninguna de las anteriores?**
   Predeterminado a `3_Game`.

### Manten tus Capas Delgadas

Un error comun es poner todo en `4_World`. Esto crea codigo fuertemente acoplado. En su lugar:

```
BIEN:
  3_Game/  --> Clase de config, enums, IDs de RPC, structs de datos
  4_World/ --> Manager que usa la config, clases de entidades
  5_Mission/ --> UI que muestra el estado del manager

MAL:
  4_World/ --> Config, enums, RPCs, managers Y clases de entidades todo mezclado
```

---

## Guia Rapida de Decision

```
                    Extiende una entidad del mundo?
                          (EntityAI, ItemBase, etc.)
                         /                    \
                       SI                     NO
                        |                      |
                    4_World              Toca UI/HUD/Mission?
                                        /                    \
                                      SI                     NO
                                       |                      |
                                   5_Mission          Es una utilidad pura
                                                      con cero deps del juego?
                                                      /                \
                                                    SI                 NO
                                                     |                  |
                                                  1_Core            3_Game
```

---

## Errores Comunes

### 1. Referenciar PlayerBase desde 3_Game

```c
// INCORRECTO: en 3_Game/MyConfig.c
class MyConfig
{
    void ApplyToPlayer(PlayerBase player)  // ERROR: PlayerBase no esta definido aun
    {
    }
};

// CORRECTO: en 3_Game/MyConfig.c
class MyConfig
{
    ref array<float> m_Values;  // Datos puros, sin referencias a entidades
};

// CORRECTO: en 4_World/MyManager.c
class MyManager
{
    void ApplyConfig(PlayerBase player, MyConfig config)
    {
        // Ahora podemos usar ambos
    }
};
```

### 2. Poner Codigo de UI en 4_World

```c
// INCORRECTO: en 4_World/MyPanel.c
class MyPanel : UIScriptedMenu  // UIScriptedMenu funciona en 4_World,
{                                // pero los hooks de MissionGameplay estan en 5_Mission
    // Esto causara problemas al intentar registrar la UI
};

// CORRECTO: en 5_Mission/MyPanel.c
class MyPanel : UIScriptedMenu
{
    // La UI pertenece en 5_Mission donde el ciclo de vida de mision esta disponible
};
```

### 3. Poner Constantes en 4_World Cuando 3_Game las Necesita

```c
// INCORRECTO: Constantes definidas en 4_World
// 4_World/MyConstants.c
const int MY_RPC_ID = 12345;

// 3_Game/MyRPCHandler.c
class MyRPCHandler
{
    void Register()
    {
        // ERROR: MY_RPC_ID no es visible aqui (definida en capa superior)
    }
};

// CORRECTO: Constantes definidas en 3_Game (o 1_Core)
// 3_Game/MyConstants.c
const int MY_RPC_ID = 12345;  // Ahora visible en 3_Game Y 4_World Y 5_Mission
```

### 4. Sobrecomplicar con 1_Core

Si tus "constantes" referencian cualquier tipo del juego, no pueden ir en `1_Core`. Incluso algo como `const string PLAYER_CONFIG_PATH` esta bien en `1_Core`, pero una clase que toma un parametro `CGame` no lo esta.

---

## Resumen

| Capa | Carpeta | Entrada de Config | Uso Principal | Frecuencia |
|-------|--------|-------------|-------------|-----------|
| 1 | `1_Core/` | `engineScriptModule` | Constantes, utilidades, base de logging | Rara |
| 2 | `2_GameLib/` | `gameLibScriptModule` | Bindings del motor | Muy rara |
| 3 | `3_Game/` | `gameScriptModule` | Configs, RPCs, clases de datos | **Mas comun** |
| 4 | `4_World/` | `worldScriptModule` | Entidades, items, managers | Comun |
| 5 | `5_Mission/` | `missionScriptModule` | UI, HUD, hooks de mision | Comun |

**Recuerda:** Las capas inferiores no pueden ver las superiores. En caso de duda, usa `3_Game`. Mueve el codigo hacia arriba solo cuando necesites acceso a tipos definidos en una capa superior.

---

**Siguiente:** [Capitulo 2.2: config.cpp a Fondo](02-config-cpp.md)
