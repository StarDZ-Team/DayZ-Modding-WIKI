# Capitulo 7.2: Sistemas de Modulos / Plugins

[Inicio](../README.md) | [<< Anterior: Patron Singleton](01-singletons.md) | **Sistemas de Modulos / Plugins** | [Siguiente: Patrones RPC >>](03-rpc-patterns.md)

---

## Introduccion

Todo framework serio de mods de DayZ utiliza un sistema de modulos o plugins para organizar el codigo en unidades autocontenidas con hooks de ciclo de vida definidos. En lugar de dispersar la logica de inicializacion a traves de clases de mision con modded, los modulos se registran con un manager central que despacha eventos del ciclo de vida --- `OnInit`, `OnMissionStart`, `OnUpdate`, `OnMissionFinish` --- a cada modulo en un orden predecible.

Este capitulo examina cuatro enfoques del mundo real: `CF_ModuleCore` del Community Framework, `PluginBase` / `ConfigurablePlugin` de VPP, el registro basado en atributos de Dabs Framework y un manager de modulos estatico personalizado. Cada uno resuelve el mismo problema de forma diferente; entender los cuatro te ayudara a elegir el patron correcto para tu propio mod o integrarte limpiamente con un framework existente.

---

## Tabla de Contenidos

- [Por que Modulos?](#por-que-modulos)
- [CF_ModuleCore (COT / Expansion)](#cf_modulecore-cot--expansion)
- [VPP PluginBase / ConfigurablePlugin](#vpp-pluginbase--configurableplugin)
- [Registro Basado en Atributos de Dabs](#registro-basado-en-atributos-de-dabs)
- [Manager de Modulos Estatico Personalizado](#manager-de-modulos-estatico-personalizado)
- [Ciclo de Vida del Modulo: El Contrato Universal](#ciclo-de-vida-del-modulo-el-contrato-universal)
- [Mejores Practicas para Diseno de Modulos](#mejores-practicas-para-diseno-de-modulos)
- [Tabla Comparativa](#tabla-comparativa)

---

## Por que Modulos?

Sin un sistema de modulos, un mod de DayZ tipicamente termina con una clase `MissionServer` o `MissionGameplay` con modded monolitica que crece hasta volverse inmanejable:

```c
// MAL: Todo metido en una clase con modded
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        InitLootSystem();
        InitVehicleTracker();
        InitBanManager();
        InitWeatherController();
        InitAdminPanel();
        InitKillfeedHUD();
        // ... 20 sistemas mas
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        TickLootSystem(timeslice);
        TickVehicleTracker(timeslice);
        TickWeatherController(timeslice);
        // ... 20 ticks mas
    }
};
```

Un sistema de modulos reemplaza esto con un unico punto de enganche estable:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        MyModuleManager.Register(new LootModule());
        MyModuleManager.Register(new VehicleModule());
        MyModuleManager.Register(new WeatherModule());
    }

    override void OnMissionStart()
    {
        super.OnMissionStart();
        MyModuleManager.OnMissionStart();  // Despacha a todos los modulos
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        MyModuleManager.OnServerUpdate(timeslice);  // Despacha a todos los modulos
    }
};
```

Cada modulo es una clase independiente con su propio archivo, su propio estado y sus propios hooks de ciclo de vida. Agregar una nueva funcionalidad significa agregar un nuevo modulo --- no editar una clase de mision de 3000 lineas.

---

## CF_ModuleCore (COT / Expansion)

Community Framework (CF) proporciona el sistema de modulos mas ampliamente utilizado en el ecosistema de modding de DayZ. Tanto COT como Expansion se construyen sobre el.

### Como Funciona

1. Declaras una clase de modulo que extiende una de las clases base de modulo de CF
2. La registras en `config.cpp` bajo `CfgPatches` / `CfgMods`
3. El `CF_ModuleCoreManager` de CF auto-descubre e instancia todas las clases de modulo registradas al inicio
4. Los eventos del ciclo de vida se despachan automaticamente

### Clases Base de Modulo

CF proporciona tres clases base correspondientes a las capas de scripts de DayZ:

| Clase Base | Capa | Uso Tipico |
|-----------|-------|-------------|
| `CF_ModuleGame` | 3_Game | Init temprano, registro RPC, clases de datos |
| `CF_ModuleWorld` | 4_World | Interaccion con entidades, sistemas de gameplay |
| `CF_ModuleMission` | 5_Mission | UI, HUD, hooks de nivel de mision |

### Ejemplo: Un Modulo CF

```c
class MyLootModule : CF_ModuleWorld
{
    // CF llama esto una vez durante la inicializacion del modulo
    override void OnInit()
    {
        super.OnInit();
        // Registrar manejadores RPC, asignar estructuras de datos
    }

    // CF llama esto cuando la mision comienza
    override void OnMissionStart(Class sender, CF_EventArgs args)
    {
        super.OnMissionStart(sender, args);
        // Cargar configs, generar loot inicial
    }

    // CF llama esto cada frame en el servidor
    override void OnUpdate(Class sender, CF_EventArgs args)
    {
        super.OnUpdate(sender, args);
        // Hacer tick de temporizadores de respawn de loot
    }

    // CF llama esto cuando la mision termina
    override void OnMissionFinish(Class sender, CF_EventArgs args)
    {
        super.OnMissionFinish(sender, args);
        // Guardar estado, liberar recursos
    }
};
```

### Acceder a un Modulo CF

```c
// Obtener una referencia a un modulo en ejecucion por tipo
MyLootModule lootMod;
CF_Modules<MyLootModule>.Get(lootMod);
if (lootMod)
{
    lootMod.ForceRespawn();
}
```

### Caracteristicas Clave

- **Auto-descubrimiento**: los modulos son instanciados por CF basandose en declaraciones de `config.cpp` --- sin llamadas manuales a `new`
- **Argumentos de evento**: los hooks de ciclo de vida reciben `CF_EventArgs` con datos de contexto
- **Dependencia de CF**: tu mod requiere Community Framework como dependencia
- **Amplio soporte**: si tu mod apunta a servidores que ya ejecutan COT o Expansion, CF ya esta presente

---

## VPP PluginBase / ConfigurablePlugin

VPP Admin Tools usa una arquitectura de plugins donde cada herramienta de administracion es una clase de plugin registrada con un manager central.

### Plugin Base

```c
// Patron VPP (simplificado)
class PluginBase : Managed
{
    void OnInit();
    void OnUpdate(float dt);
    void OnDestroy();

    // Identidad del plugin
    string GetPluginName();
    bool IsServerOnly();
};
```

### ConfigurablePlugin

VPP extiende la base con una variante consciente de configuracion que automaticamente carga/guarda ajustes:

```c
class ConfigurablePlugin : PluginBase
{
    // VPP auto-carga esto desde JSON en init
    ref PluginConfigBase m_Config;

    override void OnInit()
    {
        super.OnInit();
        LoadConfig();
    }

    void LoadConfig()
    {
        string path = "$profile:VPPAdminTools/" + GetPluginName() + ".json";
        if (FileExist(path))
        {
            JsonFileLoader<PluginConfigBase>.JsonLoadFile(path, m_Config);
        }
    }

    void SaveConfig()
    {
        string path = "$profile:VPPAdminTools/" + GetPluginName() + ".json";
        JsonFileLoader<PluginConfigBase>.JsonSaveFile(path, m_Config);
    }
};
```

### Registro

VPP registra plugins en el `MissionServer.OnInit()` con modded:

```c
// Patron VPP
GetPluginManager().RegisterPlugin(new VPPESPPlugin());
GetPluginManager().RegisterPlugin(new VPPTeleportPlugin());
GetPluginManager().RegisterPlugin(new VPPWeatherPlugin());
```

### Caracteristicas Clave

- **Registro manual**: cada plugin se instancia explicitamente con `new` y se registra
- **Integracion de config**: `ConfigurablePlugin` fusiona la gestion de configuracion con el ciclo de vida del modulo
- **Autocontenido**: sin dependencia de CF; el manager de plugins de VPP es su propio sistema
- **Propiedad clara**: el manager de plugins mantiene `ref` a todos los plugins, controlando su tiempo de vida

---

## Registro Basado en Atributos de Dabs

El Dabs Framework (utilizado en Dabs Framework Admin Tools) usa un enfoque mas moderno: atributos estilo C# para auto-registro.

### El Concepto

En lugar de registrar modulos manualmente, anotas una clase con un atributo, y el framework la descubre al inicio usando reflexion:

```c
// Patron Dabs (conceptual)
[CF_RegisterModule(DabsAdminESP)]
class DabsAdminESP : CF_ModuleWorld
{
    override void OnInit()
    {
        super.OnInit();
        // ...
    }
};
```

El atributo `CF_RegisterModule` le dice al manager de modulos de CF que instancie esta clase automaticamente. No se necesita llamada manual a `Register()`.

### Como Funciona el Descubrimiento

Al inicio, CF escanea todas las clases de script cargadas buscando el atributo de registro. Por cada coincidencia, crea una instancia y la agrega al manager de modulos. Esto sucede antes de que `OnInit()` sea llamado en cualquier modulo.

### Caracteristicas Clave

- **Cero boilerplate**: sin codigo de registro en clases de mision
- **Declarativo**: la propia clase declara que es un modulo
- **Depende de CF**: solo funciona con el procesamiento de atributos del Community Framework
- **Descubrimiento**: puedes encontrar todos los modulos buscando el atributo en el codebase

---

## Manager de Modulos Estatico Personalizado

Este enfoque usa un patron de registro explicito con una clase manager estatica. No hay instancia del manager --- son completamente metodos estaticos y almacenamiento estatico. Esto es util cuando quieres cero dependencias de frameworks externos.

### Clases Base de Modulo

```c
// Base: hooks de ciclo de vida
class MyModuleBase : Managed
{
    bool IsServer();       // Sobreescribir en subclase
    bool IsClient();       // Sobreescribir en subclase
    string GetModuleName();
    void OnInit();
    void OnMissionStart();
    void OnMissionFinish();
};

// Modulo del lado servidor: agrega OnUpdate + eventos de jugador
class MyServerModule : MyModuleBase
{
    void OnUpdate(float dt);
    void OnPlayerConnect(PlayerIdentity identity);
    void OnPlayerDisconnect(PlayerIdentity identity, string uid);
};

// Modulo del lado cliente: agrega OnUpdate
class MyClientModule : MyModuleBase
{
    void OnUpdate(float dt);
};
```

### Registro

Los modulos se registran explicitamente, tipicamente desde clases de mision con modded:

```c
// En MissionServer.OnInit() con modded:
MyModuleManager.Register(new MyMissionServerModule());
MyModuleManager.Register(new MyAIServerModule());
```

### Despacho del Ciclo de Vida

Las clases de mision con modded llaman a `MyModuleManager` en cada punto del ciclo de vida:

```c
modded class MissionServer
{
    override void OnMissionStart()
    {
        super.OnMissionStart();
        MyModuleManager.OnMissionStart();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        MyModuleManager.OnServerUpdate(timeslice);
    }

    override void OnMissionFinish()
    {
        MyModuleManager.OnMissionFinish();
        MyModuleManager.Cleanup();
        super.OnMissionFinish();
    }
};
```

### Seguridad en Listen-Server

Las clases base de modulo del sistema de modulos personalizado imponen una invariante critica: `MyServerModule` retorna `true` de `IsServer()` y `false` de `IsClient()`, mientras que `MyClientModule` hace lo opuesto. El manager usa estos flags para evitar despachar eventos del ciclo de vida dos veces en listen servers (donde tanto `MissionServer` como `MissionGameplay` se ejecutan en el mismo proceso).

La base `MyModuleBase` retorna `true` de ambos --- por eso el codebase advierte contra hacer subclases directas de ella.

### Caracteristicas Clave

- **Cero dependencias**: sin CF, sin frameworks externos
- **Manager estatico**: no se necesita `GetInstance()`; API puramente estatica
- **Registro explicito**: control total sobre que se registra y cuando
- **Seguro en listen-server**: subclases tipadas previenen doble despacho
- **Limpieza centralizada**: `MyModuleManager.Cleanup()` desmonta todos los modulos y temporizadores del core

---

## Ciclo de Vida del Modulo: El Contrato Universal

A pesar de las diferencias de implementacion, los cuatro frameworks siguen el mismo contrato de ciclo de vida:

```
+-----------------------------------------------------+
|  Registro / Descubrimiento                           |
|  La instancia del modulo es creada y registrada      |
+------------------------+----------------------------+
                         |
                         v
+-----------------------------------------------------+
|  OnInit()                                            |
|  Config unica: asignar colecciones, registrar RPCs   |
|  Se llama una vez por modulo despues del registro    |
+------------------------+----------------------------+
                         |
                         v
+-----------------------------------------------------+
|  OnMissionStart()                                    |
|  La mision esta activa: cargar configs, iniciar      |
|  temporizadores, suscribirse a eventos, generar      |
|  entidades iniciales                                 |
+------------------------+----------------------------+
                         |
                         v
+-----------------------------------------------------+
|  OnUpdate(float dt)         [repite cada frame]      |
|  Tick por frame: procesar colas, actualizar          |
|  temporizadores, verificar condiciones, avanzar      |
|  maquinas de estado                                  |
+------------------------+----------------------------+
                         |
                         v
+-----------------------------------------------------+
|  OnMissionFinish()                                   |
|  Desmontaje: guardar estado, desuscribir eventos,    |
|  limpiar colecciones, poner referencias a null       |
+-----------------------------------------------------+
```

### Reglas

1. **OnInit viene antes de OnMissionStart.** Nunca cargues configs o generes entidades en `OnInit()` --- el mundo puede no estar listo aun.
2. **OnUpdate recibe tiempo delta.** Siempre usa `dt` para logica basada en tiempo, nunca asumas una tasa de frames fija.
3. **OnMissionFinish debe limpiar todo.** Cada coleccion `ref` debe ser limpiada. Cada suscripcion a eventos debe ser removida. Cada singleton debe ser destruido. Este es el unico punto de desmontaje confiable.
4. **Los modulos no deberian depender del orden de inicializacion de otros.** Si el Modulo A necesita al Modulo B, usa acceso lazy (`GetModule()`) en lugar de asumir que B fue registrado primero.

---

## Mejores Practicas para Diseno de Modulos

### 1. Un Modulo, Una Responsabilidad

Un modulo deberia poseer exactamente un dominio. Si te encuentras escribiendo `VehicleAndWeatherAndLootModule`, dividelo.

```c
// BIEN: Modulos enfocados
class MyLootModule : MyServerModule { ... }
class MyVehicleModule : MyServerModule { ... }
class MyWeatherModule : MyServerModule { ... }

// MAL: Modulo dios
class MyEverythingModule : MyServerModule { ... }
```

### 2. Mantener OnUpdate Barato

`OnUpdate` se ejecuta cada frame. Si tu modulo hace trabajo costoso (I/O de archivos, escaneos del mundo, pathfinding), hazlo con un temporizador o distribuyelo entre frames:

```c
class MyCleanupModule : MyServerModule
{
    protected float m_CleanupTimer;
    protected const float CLEANUP_INTERVAL = 300.0;  // Cada 5 minutos

    override void OnUpdate(float dt)
    {
        m_CleanupTimer += dt;
        if (m_CleanupTimer >= CLEANUP_INTERVAL)
        {
            m_CleanupTimer = 0;
            RunCleanup();
        }
    }
};
```

### 3. Registrar RPCs en OnInit, No en OnMissionStart

Los manejadores RPC deben estar en su lugar antes de que cualquier cliente pueda enviar un mensaje. `OnInit()` se ejecuta durante el registro del modulo, que ocurre temprano en la configuracion de la mision. `OnMissionStart()` puede ser demasiado tarde si los clientes se conectan rapido.

```c
class MyModule : MyServerModule
{
    override void OnInit()
    {
        super.OnInit();
        MyRPC.Register("MyMod", "RPC_DoThing", this, MyRPCSide.SERVER);
    }

    void RPC_DoThing(PlayerIdentity sender, Object target, ParamsReadContext ctx)
    {
        // Manejar RPC
    }
};
```

### 4. Usar el Module Manager para Acceso Entre Modulos

No mantengas referencias directas a otros modulos. Usa la busqueda del manager:

```c
// BIEN: Acoplamiento debil a traves del manager
MyModuleBase mod = MyModuleManager.GetModule("MyAIServerModule");
MyAIServerModule aiMod;
if (Class.CastTo(aiMod, mod))
{
    aiMod.PauseSpawning();
}

// MAL: Referencia estatica directa crea acoplamiento fuerte
MyAIServerModule.s_Instance.PauseSpawning();
```

### 5. Protegerse Contra Dependencias Faltantes

No todo servidor ejecuta todos los mods. Si tu modulo se integra opcionalmente con otro mod, usa verificaciones de preprocesador:

```c
override void OnMissionStart()
{
    super.OnMissionStart();

    #ifdef MYMOD_AI
    MyEventBus.OnMissionStarted.Insert(OnAIMissionStarted);
    #endif
}
```

### 6. Registrar Eventos del Ciclo de Vida del Modulo

El logging hace que la depuracion sea directa. Cada modulo deberia registrar cuando se inicializa y cuando se apaga:

```c
override void OnInit()
{
    super.OnInit();
    MyLog.Info("MyModule", "Inicializado");
}

override void OnMissionFinish()
{
    MyLog.Info("MyModule", "Apagando");
    // Limpieza...
}
```

---

## Tabla Comparativa

| Caracteristica | CF_ModuleCore | VPP Plugin | Dabs Attribute | Modulo Personalizado |
|---------|--------------|------------|----------------|---------------|
| **Descubrimiento** | config.cpp + auto | `Register()` manual | Escaneo de atributos | `Register()` manual |
| **Clases base** | Game / World / Mission | PluginBase / ConfigurablePlugin | CF_ModuleWorld + atributo | ServerModule / ClientModule |
| **Dependencias** | Requiere CF | Autocontenido | Requiere CF | Autocontenido |
| **Seguro en listen-server** | CF lo maneja | Verificacion manual | CF lo maneja | Subclases tipadas |
| **Integracion de config** | Separada | Incorporada en ConfigurablePlugin | Separada | Via MyConfigManager |
| **Despacho de update** | Automatico | Manager llama `OnUpdate` | Automatico | Manager llama `OnUpdate` |
| **Limpieza** | CF lo maneja | `OnDestroy` manual | CF lo maneja | `MyModuleManager.Cleanup()` |
| **Acceso entre mods** | `CF_Modules<T>.Get()` | `GetPluginManager().Get()` | `CF_Modules<T>.Get()` | `MyModuleManager.GetModule()` |

Elige el enfoque que coincida con el perfil de dependencias de tu mod. Si ya dependes de CF, usa `CF_ModuleCore`. Si quieres cero dependencias externas, construye tu propio sistema siguiendo el patron del manager personalizado o de VPP.

---

## Compatibilidad e Impacto

- **Multi-Mod:** Multiples mods pueden registrar sus propios modulos con el mismo manager (CF, VPP o personalizado). Las colisiones de nombres solo ocurren si dos mods registran el mismo tipo de clase --- usa nombres de clase unicos con prefijo de tu etiqueta de mod.
- **Orden de Carga:** CF auto-descubre modulos desde `config.cpp`, asi que el orden de carga sigue `requiredAddons`. Los managers personalizados registran modulos en `OnInit()`, donde la cadena `modded class` determina el orden. Los modulos no deberian depender del orden de registro --- usa patrones de acceso lazy.
- **Listen Server:** En listen servers, tanto `MissionServer` como `MissionGameplay` se ejecutan en el mismo proceso. Si tu manager de modulos despacha `OnUpdate` desde ambos, los modulos reciben ticks dobles. Usa subclases tipadas (`ServerModule` / `ClientModule`) que retornen `IsServer()` o `IsClient()` para prevenir esto.
- **Rendimiento:** El despacho de modulos agrega una iteracion de bucle por modulo registrado por llamada de ciclo de vida. Con 10--20 modulos esto es insignificante. Asegurate de que los metodos individuales `OnUpdate` de los modulos sean baratos (ver Capitulo 7.7).
- **Migracion:** Al actualizar versiones de DayZ, los sistemas de modulos son estables mientras la API de la clase base (`CF_ModuleWorld`, `PluginBase`, etc.) no cambie. Fija la version de tu dependencia de CF para evitar rupturas.

---

## Errores Comunes

| Error | Impacto | Solucion |
|---------|--------|-----|
| Falta limpieza en `OnMissionFinish` en un modulo | Colecciones, temporizadores y suscripciones a eventos sobreviven entre reinicios de mision, causando datos obsoletos o crashes | Sobreescribir `OnMissionFinish`, limpiar todas las colecciones `ref`, desuscribir todos los eventos |
| Despachar eventos del ciclo de vida dos veces en listen servers | Modulos del servidor ejecutan logica de cliente y viceversa; spawns duplicados, envios dobles de RPC | Usar guards `IsServer()` / `IsClient()` o subclases de modulo tipadas que impongan la separacion |
| Registrar RPCs en `OnMissionStart` en vez de `OnInit` | Clientes que se conectan durante la configuracion de la mision pueden enviar RPCs antes de que los manejadores esten listos --- mensajes se descartan silenciosamente | Siempre registrar manejadores RPC en `OnInit()`, que se ejecuta durante el registro del modulo antes de que cualquier cliente se conecte |
| Un "modulo Dios" manejando todo | Imposible de depurar, probar o extender; conflictos de merge cuando multiples desarrolladores trabajan en el | Dividir en modulos enfocados con una unica responsabilidad cada uno |
| Mantener `ref` directa a otra instancia de modulo | Crea acoplamiento fuerte y potenciales fugas de memoria por ciclo de ref | Usar la busqueda del manager de modulos (`GetModule()`, `CF_Modules<T>.Get()`) para acceso entre modulos |

---

## Teoria vs Practica

| Los Libros Dicen | Realidad en DayZ |
|---------------|-------------|
| El descubrimiento de modulos deberia ser automatico via reflexion | La reflexion de Enforce Script es limitada; el descubrimiento basado en `config.cpp` (CF) o llamadas explicitas a `Register()` son los unicos enfoques confiables |
| Los modulos deberian ser intercambiables en caliente en tiempo de ejecucion | DayZ no soporta recarga en caliente de scripts; los modulos viven durante todo el ciclo de vida de la mision |
| Usar interfaces para contratos de modulos | Enforce Script no tiene palabra clave `interface`; usa metodos virtuales de clase base (`override`) en su lugar |
| La inyeccion de dependencias desacopla modulos | No existe framework DI; usa busquedas del manager y guards `#ifdef` para dependencias opcionales entre mods |

---

[Inicio](../README.md) | [<< Anterior: Patron Singleton](01-singletons.md) | **Sistemas de Modulos / Plugins** | [Siguiente: Patrones RPC >>](03-rpc-patterns.md)
