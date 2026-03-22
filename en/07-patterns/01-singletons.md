# Chapter 7.1: Singleton Pattern

[Home](../README.md) | **Singleton Pattern** | [Next: Module Systems >>](02-module-systems.md)

---

## Introduction

The singleton pattern guarantees that a class has exactly one instance, accessible globally. In DayZ modding it is the most common architectural pattern --- virtually every manager, cache, registry, and subsystem uses it. COT, VPP, Expansion, Dabs Framework, and others all rely on singletons to coordinate state across the engine's script layers.

This chapter covers the canonical implementation, lifecycle management, when the pattern is appropriate, and where it goes wrong.

---

## Table of Contents

- [The Canonical Implementation](#the-canonical-implementation)
- [Lazy vs Eager Initialization](#lazy-vs-eager-initialization)
- [Lifecycle Management](#lifecycle-management)
- [When to Use Singletons](#when-to-use-singletons)
- [Real-World Examples](#real-world-examples)
- [Thread Safety Considerations](#thread-safety-considerations)
- [Anti-Patterns](#anti-patterns)
- [Alternative: Static-Only Classes](#alternative-static-only-classes)
- [Checklist](#checklist)

---

## The Canonical Implementation

The standard DayZ singleton follows a simple formula: a `private static ref` field, a static `GetInstance()` accessor, and a static `DestroyInstance()` for cleanup.

```c
class LootManager
{
    // The single instance. 'ref' keeps it alive; 'private' prevents external tampering.
    private static ref LootManager s_Instance;

    // Private data owned by the singleton
    protected ref map<string, int> m_SpawnCounts;

    // Constructor — called exactly once
    void LootManager()
    {
        m_SpawnCounts = new map<string, int>();
    }

    // Destructor — called when s_Instance is set to null
    void ~LootManager()
    {
        m_SpawnCounts = null;
    }

    // Lazy accessor: creates on first call
    static LootManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new LootManager();
        }
        return s_Instance;
    }

    // Explicit teardown
    static void DestroyInstance()
    {
        s_Instance = null;
    }

    // --- Public API ---

    void RecordSpawn(string className)
    {
        int count = 0;
        m_SpawnCounts.Find(className, count);
        m_SpawnCounts.Set(className, count + 1);
    }

    int GetSpawnCount(string className)
    {
        int count = 0;
        m_SpawnCounts.Find(className, count);
        return count;
    }
};
```

### Why `private static ref`?

| Keyword | Purpose |
|---------|---------|
| `private` | Prevents other classes from setting `s_Instance` to null or replacing it |
| `static` | Shared across all code --- no instance needed to access it |
| `ref` | Strong reference --- keeps the object alive as long as `s_Instance` is non-null |

Without `ref`, the instance would be a weak reference and could be garbage-collected while still in use.

---

## Lazy vs Eager Initialization

### Lazy Initialization (Recommended Default)

The `GetInstance()` method creates the instance on first access. This is the approach used by most DayZ mods.

```c
static LootManager GetInstance()
{
    if (!s_Instance)
    {
        s_Instance = new LootManager();
    }
    return s_Instance;
}
```

**Advantages:**
- No work done until actually needed
- No dependency on initialization order between mods
- Safe if the singleton is optional (some server configurations may never call it)

**Disadvantage:**
- First caller pays the construction cost (usually negligible)

### Eager Initialization

Some singletons are created explicitly during mission startup, typically from `MissionServer.OnInit()` or a module's `OnMissionStart()`.

```c
// In your modded MissionServer.OnInit():
void OnInit()
{
    super.OnInit();
    LootManager.Create();  // Eager: constructed now, not on first use
}

// In LootManager:
static void Create()
{
    if (!s_Instance)
    {
        s_Instance = new LootManager();
    }
}
```

**When to prefer eager:**
- The singleton loads data from disk (configs, JSON files) and you want load errors to surface at startup
- The singleton registers RPC handlers that must be in place before any client connects
- Initialization order matters and you need to control it explicitly

---

## Lifecycle Management

The most common source of singleton bugs in DayZ is failing to clean up on mission end. DayZ servers can restart missions without restarting the process, which means static fields survive across mission restarts. If you do not null out `s_Instance` in `OnMissionFinish`, you carry stale references, dead objects, and orphaned callbacks into the next mission.

### The Lifecycle Contract

```
Server Process Start
  └─ MissionServer.OnInit()
       └─ Create singletons (eager) or let them self-create (lazy)
  └─ MissionServer.OnMissionStart()
       └─ Singletons begin operation
  └─ ... server runs ...
  └─ MissionServer.OnMissionFinish()
       └─ DestroyInstance() on every singleton
       └─ All static refs set to null
  └─ (Mission may restart)
       └─ Fresh singletons created again
```

### Cleanup Pattern

Always pair your singleton with a `DestroyInstance()` method and call it during shutdown:

```c
class VehicleRegistry
{
    private static ref VehicleRegistry s_Instance;
    protected ref array<ref VehicleData> m_Vehicles;

    static VehicleRegistry GetInstance()
    {
        if (!s_Instance) s_Instance = new VehicleRegistry();
        return s_Instance;
    }

    static void DestroyInstance()
    {
        s_Instance = null;  // Drops the ref, destructor runs
    }

    void ~VehicleRegistry()
    {
        if (m_Vehicles) m_Vehicles.Clear();
        m_Vehicles = null;
    }
};

// In your modded MissionServer:
modded class MissionServer
{
    override void OnMissionFinish()
    {
        VehicleRegistry.DestroyInstance();
        super.OnMissionFinish();
    }
};
```

### Centralized Shutdown Pattern

A framework mod can consolidate all singleton cleanup into `MyFramework.ShutdownAll()`, which is called from the modded `MissionServer.OnMissionFinish()`. This prevents the common mistake of forgetting one singleton:

```c
// Conceptual pattern (centralized shutdown):
static void ShutdownAll()
{
    MyRPC.Cleanup();
    MyEventBus.Cleanup();
    MyModuleManager.Cleanup();
    MyConfigManager.DestroyInstance();
    MyPermissions.DestroyInstance();
}
```

---

## When to Use Singletons

### Good Candidates

| Use Case | Why Singleton Works |
|----------|-------------------|
| **Manager classes** (LootManager, VehicleManager) | Exactly one coordinator for a domain |
| **Caches** (CfgVehicles cache, icon cache) | Single source of truth avoids redundant computation |
| **Registries** (RPC handler registry, module registry) | Central lookup must be globally accessible |
| **Config holders** (server settings, permissions) | One config per mod, loaded once from disk |
| **RPC dispatchers** | Single entry point for all incoming RPCs |

### Poor Candidates

| Use Case | Why Not |
|----------|---------|
| **Per-player data** | One instance per player, not one global instance |
| **Temporary computations** | Create, use, discard --- no global state needed |
| **UI views / dialogs** | Multiple can coexist; use the view stack instead |
| **Entity components** | Attached to individual objects, not global |

---

## Real-World Examples

### COT (Community Online Tools)

COT uses a module-based singleton pattern through the CF framework. Each tool is a `JMModuleBase` singleton registered at startup:

```c
// COT pattern: CF auto-instantiates modules declared in config.cpp
class JM_COT_ESP : JMModuleBase
{
    // CF manages the singleton lifecycle
    // Access via: JM_COT_ESP.Cast(GetModuleManager().GetModule(JM_COT_ESP));
}
```

### VPP Admin Tools

VPP uses explicit `GetInstance()` on manager classes:

```c
// VPP pattern (simplified)
class VPPATBanManager
{
    private static ref VPPATBanManager m_Instance;

    static VPPATBanManager GetInstance()
    {
        if (!m_Instance)
            m_Instance = new VPPATBanManager();
        return m_Instance;
    }
}
```

### Expansion

Expansion declares singletons for each subsystem and hooks into the mission lifecycle for cleanup:

```c
// Expansion pattern (simplified)
class ExpansionMarketModule : CF_ModuleWorld
{
    // CF_ModuleWorld is itself a singleton managed by the CF module system
    // ExpansionMarketModule.Cast(CF_ModuleCoreManager.Get(ExpansionMarketModule));
}
```

---

## Thread Safety Considerations

Enforce Script is single-threaded. All script execution happens on the main thread within the Enfusion engine's game loop. This means:

- There are **no race conditions** between concurrent threads
- You do **not** need mutexes, locks, or atomic operations
- `GetInstance()` with lazy initialization is always safe

However, **re-entrancy** can still cause problems. If `GetInstance()` triggers code that calls `GetInstance()` again during construction, you can get a partially-initialized singleton:

```c
// DANGEROUS: re-entrant singleton construction
class BadManager
{
    private static ref BadManager s_Instance;

    void BadManager()
    {
        // This calls GetInstance() during construction!
        OtherSystem.Register(BadManager.GetInstance());
    }

    static BadManager GetInstance()
    {
        if (!s_Instance)
        {
            // s_Instance is still null here during construction
            s_Instance = new BadManager();
        }
        return s_Instance;
    }
};
```

The fix is to assign `s_Instance` before running any initialization that might re-enter:

```c
static BadManager GetInstance()
{
    if (!s_Instance)
    {
        s_Instance = new BadManager();  // Assign first
        s_Instance.Initialize();         // Then run initialization that may call GetInstance()
    }
    return s_Instance;
}
```

Or better yet, avoid circular initialization entirely.

---

## Anti-Patterns

### 1. Global Mutable State Without Encapsulation

The singleton pattern gives you global access. That does not mean the data should be globally writable.

```c
// BAD: Public fields invite uncontrolled mutation
class GameState
{
    private static ref GameState s_Instance;
    int PlayerCount;         // Anyone can write this
    bool ServerLocked;       // Anyone can write this
    string CurrentWeather;   // Anyone can write this

    static GameState GetInstance() { ... }
};

// Any code can do:
GameState.GetInstance().PlayerCount = -999;  // Chaos
```

```c
// GOOD: Controlled access through methods
class GameState
{
    private static ref GameState s_Instance;
    protected int m_PlayerCount;
    protected bool m_ServerLocked;

    int GetPlayerCount() { return m_PlayerCount; }

    void IncrementPlayerCount()
    {
        m_PlayerCount++;
    }

    static GameState GetInstance() { ... }
};
```

### 2. Missing DestroyInstance

If you forget cleanup, the singleton persists across mission restarts with stale data:

```c
// BAD: No cleanup path
class ZombieTracker
{
    private static ref ZombieTracker s_Instance;
    ref array<Object> m_TrackedZombies;  // These objects get deleted on mission end!

    static ZombieTracker GetInstance() { ... }
    // No DestroyInstance() — m_TrackedZombies now holds dead references
};
```

### 3. Singletons That Own Everything

When a singleton accumulates too many responsibilities, it becomes a "God object" that is impossible to reason about:

```c
// BAD: One singleton doing everything
class ServerManager
{
    // Manages loot AND vehicles AND weather AND spawns AND bans AND...
    ref array<Object> m_Loot;
    ref array<Object> m_Vehicles;
    ref WeatherData m_Weather;
    ref array<string> m_BannedPlayers;

    void SpawnLoot() { ... }
    void DespawnVehicle() { ... }
    void SetWeather() { ... }
    void BanPlayer() { ... }
    // 2000 lines later...
};
```

Split into focused singletons: `LootManager`, `VehicleManager`, `WeatherManager`, `BanManager`. Each one is small, testable, and has a clear domain.

### 4. Accessing Singletons in Constructors of Other Singletons

This creates hidden initialization-order dependencies:

```c
// BAD: Constructor depends on another singleton
class ModuleA
{
    void ModuleA()
    {
        // What if ModuleB hasn't been created yet?
        ModuleB.GetInstance().Register(this);
    }
};
```

Defer cross-singleton registration to `OnInit()` or `OnMissionStart()`, where initialization order is controlled.

---

## Alternative: Static-Only Classes

Some "singletons" do not need an instance at all. If the class holds no instance state and only has static methods and static fields, skip the `GetInstance()` ceremony entirely:

```c
// No instance needed — all static
class MyLog
{
    private static FileHandle s_LogFile;
    private static int s_LogLevel;

    static void Info(string tag, string msg)
    {
        WriteLog("INFO", tag, msg);
    }

    static void Error(string tag, string msg)
    {
        WriteLog("ERROR", tag, msg);
    }

    static void Cleanup()
    {
        if (s_LogFile) CloseFile(s_LogFile);
        s_LogFile = null;
    }

    private static void WriteLog(string level, string tag, string msg)
    {
        // ...
    }
};
```

This is the approach used by `MyLog`, `MyRPC`, `MyEventBus`, and `MyModuleManager` in a framework mod. It is simpler, avoids the `GetInstance()` null-check overhead, and makes the intent clear: there is no instance, only shared state.

**Use a static-only class when:**
- All methods are stateless or operate on static fields
- There is no meaningful constructor/destructor logic
- You never need to pass the "instance" as a parameter

**Use a true singleton when:**
- The class has instance state that benefits from encapsulation (`protected` fields)
- You need polymorphism (a base class with overridden methods)
- The object needs to be passed to other systems by reference

---

## Checklist

Before shipping a singleton, verify:

- [ ] `s_Instance` is declared `private static ref`
- [ ] `GetInstance()` handles the null case (lazy init) or you have an explicit `Create()` call
- [ ] `DestroyInstance()` exists and sets `s_Instance = null`
- [ ] `DestroyInstance()` is called from `OnMissionFinish()` or a centralized shutdown method
- [ ] The destructor cleans up owned collections (`.Clear()`, set to `null`)
- [ ] No public fields --- all mutation goes through methods
- [ ] The constructor does not call `GetInstance()` on other singletons (defer to `OnInit()`)

---

## Compatibility & Impact

- **Multi-Mod:** Multiple mods each defining their own singletons coexist safely --- each has its own `s_Instance`. Conflicts only arise if two mods define the same class name, which Enforce Script will flag as a redefinition error at load time.
- **Load Order:** Lazy singletons are unaffected by mod load order. Eager singletons created in `OnInit()` depend on the `modded class` chain order, which follows `config.cpp` `requiredAddons`.
- **Listen Server:** Static fields are shared between client and server contexts in the same process. A singleton that should only exist server-side must guard construction with `GetGame().IsServer()`, or it will be accessible (and potentially initialized) from client code as well.
- **Performance:** Singleton access is a static null check + method call --- negligible overhead. The cost is in what the singleton *does*, not in accessing it.
- **Migration:** Singletons survive DayZ version updates as long as the APIs they call (e.g., `GetGame()`, `JsonFileLoader`) remain stable. No special migration is needed for the pattern itself.

---

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Missing `DestroyInstance()` call in `OnMissionFinish` | Stale data and dead entity references carry over across mission restarts, causing crashes or ghost state | Always call `DestroyInstance()` from `OnMissionFinish` or a centralized `ShutdownAll()` |
| Calling `GetInstance()` inside another singleton's constructor | Triggers re-entrant construction; `s_Instance` is still null, so a second instance is created | Defer cross-singleton access to an `Initialize()` method called after construction |
| Using `public static ref` instead of `private static ref` | Any code can set `s_Instance = null` or replace it, breaking the single-instance guarantee | Always declare `s_Instance` as `private static ref` |
| Not guarding eager init on listen servers | Singleton is constructed twice (once from server path, once from client path) if `Create()` lacks a null check | Always check `if (!s_Instance)` inside `Create()` |
| Accumulating state without bounds (unbounded caches) | Memory grows indefinitely on long-running servers; eventual OOM or severe lag | Cap collections with a max size or periodic eviction in `OnUpdate` |

---

## Theory vs Practice

| Textbook Says | DayZ Reality |
|---------------|-------------|
| Singletons are an anti-pattern; use dependency injection | Enforce Script has no DI container. Singletons are the standard approach for global managers across all major mods. |
| Lazy initialization is always sufficient | RPC handlers must be registered before any client connects, so eager init in `OnInit()` is often necessary. |
| Singletons should never be destroyed | DayZ missions restart without restarting the server process; singletons *must* be destroyed and recreated on each mission cycle. |

---

[Home](../README.md) | **Singleton Pattern** | [Next: Module Systems >>](02-module-systems.md)
