# Chapter 7.2: Module / Plugin Systems

[Home](../README.md) | [<< Previous: Singleton Pattern](01-singletons.md) | **Module / Plugin Systems** | [Next: RPC Patterns >>](03-rpc-patterns.md)

---

## Einführung

Every serious DayZ mod framework uses a module or plugin system to organize code into self-contained units with defined lifecycle hooks. Rather than scattering initialization logic across modded mission classes, modules register themselves with a central manager that dispatches lifecycle events --- `OnInit`, `OnMissionStart`, `OnUpdate`, `OnMissionFinish` --- to each module in a predictable order.

This chapter examines four real-world approaches: Community Framework's `CF_ModuleCore`, VPP's `PluginBase` / `ConfigurablePlugin`, Dabs Framework's attribute-based registration, and MyMod's `MyModuleManager`. Each solves the same problem differently; understanding all four will help you choose the right pattern for your own mod or integrate cleanly with an existing framework.

---

## Inhaltsverzeichnis

- [Why Modules?](#why-modules)
- [CF_ModuleCore (COT / Expansion)](#cf_modulecore-cot--expansion)
- [VPP PluginBase / ConfigurablePlugin](#vpp-pluginbase--configurableplugin)
- [Dabs Attribute-Based Registration](#dabs-attribute-based-registration)
- [MyMod MyModuleManager](#custom-static-module-manager)
- [Module Lifecycle: The Universal Contract](#module-lifecycle-the-universal-contract)
- [Best Practices for Module Design](#best-practices-for-module-design)
- [Comparison Table](#comparison-table)

---

## Why Modules?

Without a module system, a DayZ mod typically ends up with a monolithic modded `MissionServer` or `MissionGameplay` class that grows until it becomes unmanageable:

```c
// BAD: Everything crammed into one modded class
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
        // ... 20 more systems
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        TickLootSystem(timeslice);
        TickVehicleTracker(timeslice);
        TickWeatherController(timeslice);
        // ... 20 more ticks
    }
};
```

A module system replaces this with a single, stable hook point:

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
        MyModuleManager.OnMissionStart();  // Dispatches to all modules
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        MyModuleManager.OnServerUpdate(timeslice);  // Dispatches to all modules
    }
};
```

Each module is an independent class with its own file, its own state, and its own lifecycle hooks. Adding a new feature means adding a new module --- not editing a 3000-line mission class.

---

## CF_ModuleCore (COT / Expansion)

Community Framework (CF) provides the most widely-used module system in the DayZ modding ecosystem. Both COT and Expansion build on it.

### How It Works

1. You declare a module class that extends one of CF's module base classes
2. You register it in `config.cpp` under `CfgPatches` / `CfgMods`
3. CF's `CF_ModuleCoreManager` auto-discovers and instantiates all registered module classes at startup
4. Lifecycle events are dispatched automatically

### Module Base Classes

CF provides three base classes corresponding to DayZ's script layers:

| Base Class | Layer | Typical Use |
|-----------|-------|-------------|
| `CF_ModuleGame` | 3_Game | Early init, RPC registration, data classes |
| `CF_ModuleWorld` | 4_World | Entity interaction, gameplay systems |
| `CF_ModuleMission` | 5_Mission | UI, HUD, mission-level hooks |

### Example: A CF Module

```c
class MyLootModule : CF_ModuleWorld
{
    // CF calls this once during module initialization
    override void OnInit()
    {
        super.OnInit();
        // Register RPC handlers, allocate data structures
    }

    // CF calls this when the mission starts
    override void OnMissionStart(Class sender, CF_EventArgs args)
    {
        super.OnMissionStart(sender, args);
        // Load configs, spawn initial loot
    }

    // CF calls this every frame on the server
    override void OnUpdate(Class sender, CF_EventArgs args)
    {
        super.OnUpdate(sender, args);
        // Tick loot respawn timers
    }

    // CF calls this when the mission ends
    override void OnMissionFinish(Class sender, CF_EventArgs args)
    {
        super.OnMissionFinish(sender, args);
        // Save state, release resources
    }
};
```

### Accessing a CF Module

```c
// Get a reference to a running module by type
MyLootModule lootMod;
CF_Modules<MyLootModule>.Get(lootMod);
if (lootMod)
{
    lootMod.ForceRespawn();
}
```

### Key Characteristics

- **Auto-discovery**: modules are instantiated by CF based on `config.cpp` declarations --- no manual `new` calls
- **Event args**: lifecycle hooks receive `CF_EventArgs` with context data
- **Dependency on CF**: your mod requires Community Framework as a dependency
- **Widely supported**: if your mod targets servers that already run COT or Expansion, CF is already present

---

## VPP PluginBase / ConfigurablePlugin

VPP Admin Tools uses a plugin architecture where each admin tool is a plugin class registered with a central manager.

### Plugin Base

```c
// VPP pattern (simplified)
class PluginBase : Managed
{
    void OnInit();
    void OnUpdate(float dt);
    void OnDestroy();

    // Plugin identity
    string GetPluginName();
    bool IsServerOnly();
};
```

### ConfigurablePlugin

VPP extends the base with a config-aware variant that automatically loads/saves settings:

```c
class ConfigurablePlugin : PluginBase
{
    // VPP auto-loads this from JSON on init
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

### Registration

VPP registers plugins in the modded `MissionServer.OnInit()`:

```c
// VPP pattern
GetPluginManager().RegisterPlugin(new VPPESPPlugin());
GetPluginManager().RegisterPlugin(new VPPTeleportPlugin());
GetPluginManager().RegisterPlugin(new VPPWeatherPlugin());
```

### Key Characteristics

- **Manual registration**: each plugin is explicitly `new`-ed and registered
- **Config integration**: `ConfigurablePlugin` merges config management with the module lifecycle
- **Self-contained**: no dependency on CF; VPP's plugin manager is its own system
- **Clear ownership**: the plugin manager holds `ref` to all plugins, controlling their lifetime

---

## Dabs Attribute-Based Registration

The Dabs Framework (used in Dabs Framework Admin Tools) uses a more modern approach: C#-style attributes for auto-registration.

### The Concept

Instead of manually registering modules, you annotate a class with an attribute, and the framework discovers it at startup using reflection:

```c
// Dabs pattern (conceptual)
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

The `CF_RegisterModule` attribute tells CF's module manager to instantiate this class automatically. No manual `Register()` call needed.

### How Discovery Works

At startup, CF scans all loaded script classes for the registration attribute. For each match, it creates an instance and adds it to the module manager. This happens before `OnInit()` is called on any module.

### Key Characteristics

- **Zero boilerplate**: no registration code in mission classes
- **Declarative**: the class itself declares that it is a module
- **Relies on CF**: only works with Community Framework's attribute processing
- **Discoverability**: you can find all modules by searching for the attribute in the codebase

---

## MyMod MyModuleManager

MyFramework uses an explicit registration pattern with a static manager class. There is no instance of the manager --- it is entirely static methods and static storage.

### Module Base Classes

```c
// Base: lifecycle hooks
class MyModuleBase : Managed
{
    bool IsServer();       // Override in subclass
    bool IsClient();       // Override in subclass
    string GetModuleName();
    void OnInit();
    void OnMissionStart();
    void OnMissionFinish();
};

// Server-side module: adds OnUpdate + player events
class MyServerModule : MyModuleBase
{
    void OnUpdate(float dt);
    void OnPlayerConnect(PlayerIdentity identity);
    void OnPlayerDisconnect(PlayerIdentity identity, string uid);
};

// Client-side module: adds OnUpdate
class MyClientModule : MyModuleBase
{
    void OnUpdate(float dt);
};
```

### Registration

Modules register themselves explicitly, typically from modded mission classes:

```c
// In modded MissionServer.OnInit():
MyModuleManager.Register(new MyMissionServerModule());
MyModuleManager.Register(new MyAIServerModule());
```

### Lifecycle Dispatch

The modded mission classes call into `MyModuleManager` at each lifecycle point:

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

### Listen-Server Safety

MyMod's module base classes enforce a critical invariant: `MyServerModule` returns `true` from `IsServer()` and `false` from `IsClient()`, while `MyClientModule` does the opposite. The manager uses these flags to avoid dispatching lifecycle events twice on listen servers (where both `MissionServer` and `MissionGameplay` run in the same process).

The base `MyModuleBase` returns `true` from both --- which is why the codebase warns against subclassing it directly.

### Key Characteristics

- **Zero dependencies**: no CF, no external frameworks
- **Static manager**: no `GetInstance()` needed; purely static API
- **Explicit registration**: full control over what gets registered and when
- **Listen-server safe**: typed subclasses prevent double-dispatch
- **Centralized cleanup**: `MyModuleManager.Cleanup()` tears down all modules and core timers

---

## Module Lifecycle: The Universal Contract

Despite implementation differences, all four frameworks follow the same lifecycle contract:

```
┌─────────────────────────────────────────────────────┐
│  Registration / Discovery                            │
│  Module instance is created and registered            │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnInit()                                            │
│  One-time setup: allocate collections, register RPCs │
│  Called once per module after registration            │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionStart()                                    │
│  Mission is live: load configs, start timers,        │
│  subscribe to events, spawn initial entities         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnUpdate(float dt)         [repeating every frame]  │
│  Per-frame tick: process queues, update timers,      │
│  check conditions, advance state machines            │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionFinish()                                   │
│  Teardown: save state, unsubscribe events,           │
│  clear collections, null out references              │
└─────────────────────────────────────────────────────┘
```

### Rules

1. **OnInit comes before OnMissionStart.** Never load configs or spawn entities in `OnInit()` --- the world may not be ready yet.
2. **OnUpdate receives delta time.** Always use `dt` for time-based logic, never assume a fixed frame rate.
3. **OnMissionFinish must clean up everything.** Every `ref` collection must be cleared. Every event subscription must be removed. Every singleton must be destroyed. This is the only reliable teardown point.
4. **Modules should not depend on each other's initialization order.** If Module A needs Module B, use lazy access (`GetModule()`) rather than assuming B was registered first.

---

## Best Practices for Module Design

### 1. One Module, One Responsibility

A module should own exactly one domain. If you find yourself writing `VehicleAndWeatherAndLootModule`, split it.

```c
// GOOD: Focused modules
class MyLootModule : MyServerModule { ... }
class MyVehicleModule : MyServerModule { ... }
class MyWeatherModule : MyServerModule { ... }

// BAD: God module
class MyEverythingModule : MyServerModule { ... }
```

### 2. Keep OnUpdate Cheap

`OnUpdate` runs every frame. If your module does expensive work (file I/O, world scans, pathfinding), do it on a timer or batch it across frames:

```c
class MyCleanupModule : MyServerModule
{
    protected float m_CleanupTimer;
    protected const float CLEANUP_INTERVAL = 300.0;  // Every 5 minutes

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

### 3. Register RPCs in OnInit, Not OnMissionStart

RPC handlers must be in place before any client can send a message. `OnInit()` runs during module registration, which happens early in the mission setup. `OnMissionStart()` may be too late if clients connect fast.

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
        // Handle RPC
    }
};
```

### 4. Use the Module Manager for Cross-Module Access

Do not hold direct references to other modules. Use the manager's lookup:

```c
// GOOD: Loose coupling through the manager
MyModuleBase mod = MyModuleManager.GetModule("MyAIServerModule");
MyAIServerModule aiMod;
if (Class.CastTo(aiMod, mod))
{
    aiMod.PauseSpawning();
}

// BAD: Direct static reference creates hard coupling
MyAIServerModule.s_Instance.PauseSpawning();
```

### 5. Guard Against Missing Dependencies

Not every server runs every mod. If your module optionally integrates with another mod, use preprocessor checks:

```c
override void OnMissionStart()
{
    super.OnMissionStart();

    #ifdef MyAI
    MyEventBus.OnMissionStarted.Insert(OnAIMissionStarted);
    #endif
}
```

### 6. Log Module Lifecycle Events

Logging makes debugging straightforward. Every module should log when it initializes and shuts down:

```c
override void OnInit()
{
    super.OnInit();
    MyLog.Info("MyModule", "Initialized");
}

override void OnMissionFinish()
{
    MyLog.Info("MyModule", "Shutting down");
    // Cleanup...
}
```

---

## Comparison Table

| Feature | CF_ModuleCore | VPP Plugin | Dabs Attribute | MyMod Module |
|---------|--------------|------------|----------------|---------------|
| **Discovery** | config.cpp + auto | Manual `Register()` | Attribute scan | Manual `Register()` |
| **Base classes** | Game / World / Mission | PluginBase / ConfigurablePlugin | CF_ModuleWorld + attribute | ServerModule / ClientModule |
| **Dependencies** | Requires CF | Self-contained | Requires CF | Self-contained |
| **Listen-server safe** | CF handles it | Manual check | CF handles it | Typed subclasses |
| **Config integration** | Separate | Built into ConfigurablePlugin | Separate | Via MyConfigManager |
| **Update dispatch** | Automatic | Manager calls `OnUpdate` | Automatic | Manager calls `OnUpdate` |
| **Cleanup** | CF handles it | Manual `OnDestroy` | CF handles it | `MyModuleManager.Cleanup()` |
| **Cross-mod access** | `CF_Modules<T>.Get()` | `GetPluginManager().Get()` | `CF_Modules<T>.Get()` | `MyModuleManager.GetModule()` |

Choose the approach that matches your mod's dependency profile. If you already depend on CF, use `CF_ModuleCore`. If you want zero external dependencies, build your own system following the MyMod or VPP pattern.

---

[<< Zurück: Singleton Pattern](01-singletons.md) | [Startseite](../README.md) | [Next: RPC Patterns >>](03-rpc-patterns.md)
