# Chapter 1.13: Functions & Methods

[Home](../README.md) | [<< Previous: Gotchas](12-gotchas.md) | **Functions & Methods**

---

## Introduzione

Le funzioni sono l'unita fondamentale di comportamento in Enforce Script. Ogni azione che un mod esegue --- spawning an item, checking a player's health, sending an RPC, drawing a UI element --- risiede all'interno di una funzione. Capire come dichiararle, pass data in and out, and work with il motore's special modifiers is essential for writing correct DayZ mods.

Questo capitolo tratta function mechanics in depth: declaration syntax, parameter passing modes, return values, default parameters, proto native bindings, static vs instance methods, overriding, the `thread` keyword, and the `event` keyword. If Chapter 1.3 (Classes) taught you where functions live, this chapter teaches you how they work.

---

## Indice

- [Function Declaration Syntax](#function-declaration-syntax)
  - [Standalone Functions](#standalone-functions)
  - [Instance Methods](#instance-methods)
  - [Static Methods](#static-methods)
- [Parameter Passing Modes](#parameter-passing-modes)
  - [By Value (Default)](#by-value-default)
  - [out Parameters](#out-parameters)
  - [inout Parameters](#inout-parameters)
  - [notnull Parameters](#notnull-parameters)
- [Return Values](#return-values)
- [Default Parameter Values](#default-parameter-values)
- [Proto Native Methods (Engine Bindings)](#proto-native-methods-engine-bindings)
- [Static vs Instance Methods](#static-vs-instance-methods)
- [Method Overriding](#method-overriding)
- [Method Overloading (Not Supported)](#method-overloading-not-supported)
- [The event Keyword](#the-event-keyword)
- [Thread Methods (Coroutines)](#thread-methods-coroutines)
- [Deferred Calls with CallLater](#deferred-calls-with-calllater)
- [Best Practices](#best-practices)
- [Observed in Real Mods](#observed-in-real-mods)
- [Theory vs Practice](#theory-vs-practice)
- [Common Mistakes](#common-mistakes)
- [Quick Reference Table](#quick-reference-table)

---

## Sintassi di Dichiarazione delle Funzioni

Ogni funzione ha a tipo di ritorno, a name, and a lista dei parametri. Il corpo e racchiuso tra parentesi graffe.

```
ReturnType FunctionName(ParamType paramName, ...)
{
    // body
}
```

### Funzioni Standalone

Standalone (global) functions exist outside any class. They are rare nel modding di DayZ --- nearly all code lives inside classes --- but incontrerai a few in the vanilla scripts.

```c
// Standalone function (global scope)
void PrintPlayerCount()
{
    int count = GetGame().GetPlayers().Count();
    Print(string.Format("Players online: %1", count));
}

// Standalone function with return value
string FormatTimestamp(int hours, int minutes)
{
    return string.Format("%1:%2", hours.ToStringLen(2), minutes.ToStringLen(2));
}
```

The vanilla engine definiscis several standalone utility functions:

```c
// From enscript.c — helper for string expressions
string String(string s)
{
    return s;
}
```

### Metodi di Istanza

La stragrande maggioranza di functions nei mod di DayZ are instance methods --- they belong to a class and operate on that instance's data.

```c
class LootSpawner
{
    protected vector m_Position;
    protected float m_Radius;

    void SetPosition(vector pos)
    {
        m_Position = pos;
    }

    float GetRadius()
    {
        return m_Radius;
    }

    bool IsNearby(vector testPos)
    {
        return vector.Distance(m_Position, testPos) <= m_Radius;
    }
}
```

Instance methods have implicit access to `this` --- a reference to the current object. Raramente e necessario write `this.` explicitly, but it can help disambiguate when a parameter has a similar name.

### Metodi Statici

Static methods belong to the class itself, not to any instance. Call them via `ClassName.Method()`. They cannot access instance fields or `this`.

```c
class MathHelper
{
    static float Clamp01(float value)
    {
        if (value < 0) return 0;
        if (value > 1) return 1;
        return value;
    }

    static float Lerp(float a, float b, float t)
    {
        return a + (b - a) * Clamp01(t);
    }
}

// Usage:
float result = MathHelper.Lerp(0, 100, 0.75);  // 75.0
```

Static methods are ideal for utility functions, factory methods, and singleton accessors. DayZ's vanilla code uses them extensively:

```c
// From DamageSystem (3_game/damagesystem.c)
class DamageSystem
{
    static bool GetDamageZoneMap(EntityAI entity, out DamageZoneMap zoneMap)
    {
        // ...
    }

    static string GetDamageDisplayName(EntityAI entity, string zone)
    {
        // ...
    }
}
```

---

## Modalita di Passaggio dei Parametri

Enforce Script supports four parameter passing modes. Understanding them is critical because the wrong mode leads to silent bugs where data never reaches il chiamante.

### Per Valore (Predefinito)

Quando nessun modificatore e specificato, the parameter is passed **by value**. For primitives (`int`, `float`, `bool`, `string`, `vector`), viene creata una copia. Le modifiche all'interno della funzione non influenzano il chiamante's variable.

```c
void DoubleValue(int x)
{
    x = x * 2;  // modifies local copy only
}

// Usage:
int n = 5;
DoubleValue(n);
Print(n);  // still 5 --- the original is unchanged
```

Per i tipi classe (objects), by-value passing still passes a **reference to the object** --- but the reference itself is copied. You can modify the object's fields, but you cannot reassign the reference to point to a different object.

```c
void RenameZone(SpawnZone zone)
{
    zone.SetName("NewName");  // this WORKS --- modifies the same object
    zone = null;              // this does NOT affect the caller's variable
}
```

### Parametri out

The `out` keyword marks a parameter as **output-only**. The function writes a value into it, and il chiamante riceve that value. The initial value of the parameter is undefiniscid --- do not read it before writing.

```c
// out parameter — function fills the value
bool TryFindPlayer(string name, out PlayerBase player)
{
    array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);

    for (int i = 0; i < players.Count(); i++)
    {
        PlayerBase pb = PlayerBase.Cast(players[i]);
        if (pb && pb.GetIdentity() && pb.GetIdentity().GetName() == name)
        {
            player = pb;
            return true;
        }
    }

    player = null;
    return false;
}

// Usage:
PlayerBase result;
if (TryFindPlayer("John", result))
{
    Print(result.GetIdentity().GetName());
}
```

Gli script vanilla usano `out` extensively for engine-to-script data flow:

```c
// From DayZPlayer (3_game/dayzplayer.c)
proto native void GetCurrentCameraTransform(out vector position, out vector direction, out vector rotation);

// From AIWorld (3_game/ai/aiworld.c)
proto native bool RaycastNavMesh(vector from, vector to, PGFilter pgFilter, out vector hitPos, out vector hitNormal);

// Multiple out parameters for look limits
proto void GetLookLimits(out float pDown, out float pUp, out float pLeft, out float pRight);
```

### Parametri inout

The `inout` keyword marks a parameter that is **both read and written** by la funzione. The caller's value is available inside la funzione, and any modifications are visible to il chiamante afterward.

```c
// inout — the function reads the current value and modifies it
void ClampHealth(inout float health)
{
    if (health < 0)
        health = 0;
    if (health > 100)
        health = 100;
}

// Usage:
float hp = 150.0;
ClampHealth(hp);
Print(hp);  // 100.0
```

Esempi vanilla di `inout`:

```c
// From enmath.c — smoothing function reads and writes velocity
proto static float SmoothCD(float val, float target, inout float velocity[],
    float smoothTime, float maxVelocity, float dt);

// From enscript.c — parsing modifies the input string
proto int ParseStringEx(inout string input, string token);

// From Pawn (3_game/entities/pawn.c) — transform is read and modified
event void GetTransform(inout vector transform[4])
```

### Parametri notnull

The `notnull` keyword tells il compilatore (and il motore) that the parameter must not be `null`. If a null value is passed, the game will crash with an error rather than silently proceeding with invalid data.

```c
void ProcessEntity(notnull EntityAI entity)
{
    // Safe to use entity without null-checking — engine guarantees it
    string name = entity.GetType();
    Print(name);
}
```

Vanilla uses `notnull` heavily in engine-facing functions:

```c
// From envisual.c
proto native void SetBone(notnull IEntity ent, int bone, vector angles, vector trans, float scale);
proto native bool GetBoneMatrix(notnull IEntity ent, int bone, vector mat[4]);

// From DamageSystem
static bool GetDamageZoneFromComponentName(notnull EntityAI entity, string component, out string damageZone);
```

You can combine `notnull` with `out`:

```c
// From universaltemperaturesourcelambdabaseimpl.c
override void DryItemsInVicinity(UniversalTemperatureSourceSettings pSettings, vector position,
    out notnull array<EntityAI> nearestObjects);
```

---

## Valori di Ritorno

### Valore di Ritorno Singolo

Functions return a single value. The tipo di ritorno is declared before la funzione name.

```c
float GetDistanceBetween(vector a, vector b)
{
    return vector.Distance(a, b);
}
```

### void (Nessun Ritorno)

Use `void` for functions that perform an action without returning data.

```c
void LogMessage(string msg)
{
    Print(string.Format("[MyMod] %1", msg));
}
```

### Restituzione di Oggetti

When a function returns an object, it returns a **reference** (non una copia). The caller receives a pointer to the same object in memory.

```c
EntityAI SpawnItem(string className, vector pos)
{
    EntityAI item = EntityAI.Cast(GetGame().CreateObject(className, pos, false, false, true));
    return item;  // caller gets a reference to the same object
}
```

### Valori di Ritorno Multipli tramite Parametri out

When you need to return more than one value, use `out` parameters. This is a universal pattern in DayZ scripting.

```c
void GetTimeComponents(float totalSeconds, out int hours, out int minutes, out int seconds)
{
    hours = (int)(totalSeconds / 3600);
    minutes = (int)((totalSeconds % 3600) / 60);
    seconds = (int)(totalSeconds % 60);
}

// Usage:
int h, m, s;
GetTimeComponents(3725, h, m, s);
// h == 1, m == 2, s == 5
```

### GOTCHA: JsonFileLoader Returns void

Una trappola comune: `JsonFileLoader<T>.JsonLoadFile()` restituisce `void`, non l'oggetto caricato. You must pass a pre-created object as a `ref` parameter.

```c
// WRONG — will not compile
MyConfig config = JsonFileLoader<MyConfig>.JsonLoadFile(path);

// CORRECT — pass a ref object
MyConfig config = new MyConfig;
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
```

---

## Valori Predefiniti dei Parametri

Enforce Script supports default values for parameters. Parameters with defaults must come **after** all required parameters.

```c
void SpawnItem(string className, vector pos, float quantity = -1, bool withAttachments = true)
{
    // quantity defaults to -1 (full), withAttachments defaults to true
    EntityAI item = EntityAI.Cast(GetGame().CreateObject(className, pos, false, false, true));
    if (item && quantity >= 0)
        item.SetQuantity(quantity);
}

// All of these are valid calls:
SpawnItem("AKM", myPos);                   // uses both defaults
SpawnItem("AKM", myPos, 0.5);             // custom quantity, default attachments
SpawnItem("AKM", myPos, -1, false);        // must specify quantity to reach attachments
```

### Valori Predefiniti da Vanilla

Gli script vanilla usano default parameters extensively:

```c
// From Weather (3_game/weather.c)
proto native void Set(float forecast, float time = 0, float minDuration = 0);
proto native void SetDynVolFogDistanceDensity(float value, float time = 0);

// From UAInput (3_game/inputapi/uainput.c)
proto native float SyncedValue_ID(int action, bool check_focus = true);
proto native bool SyncedPress(string action, bool check_focus = true);

// From DbgUI (1_core/proto/dbgui.c)
static bool FloatOverride(string id, inout float value, float min, float max,
    int precision = 1000, bool sameLine = true);

// From InputManager (2_gamelib/inputmanager.c)
proto native external bool ActivateAction(string actionName, int duration = 0);
```

### Limitazioni

1. **Literal values only** --- you cannot use expressions, function calls, or other variables as defaults:

```c
// WRONG — no expressions in defaults
void MyFunc(float speed = Math.PI * 2)  // COMPILE ERROR

// CORRECT — use a literal
void MyFunc(float speed = 6.283)
```

2. **No named parameters** --- you cannot skip a parameter by name. To set the third default, you must provide all preceding parameters:

```c
void Configure(int a = 1, int b = 2, int c = 3) {}

Configure(1, 2, 10);  // must specify a and b to set c
// There is no syntax like Configure(c: 10)
```

3. **Default values for class types are restricted to `null` or `NULL`:**

```c
void DoWork(EntityAI target = null, string name = "")
{
    if (!target) return;
    // ...
}
```

---

## Metodi Proto Native (Binding del Motore)

Proto native methods are declared in script but **implemented in the C++ engine**. They form the bridge between your Enforce Script code and the DayZ game engine. You call them like normal methods, but non puoi vederne o modificarne l'implementazione.

### Riferimento dei Modificatori

| Modificatore | Significato | Esempio |
|----------|---------|---------|
| `proto native` | Implemented in C++ engine code | `proto native void SetPosition(vector pos);` |
| `proto native owned` | Returns a value il chiamante owns (manages memory) | `proto native owned string GetType();` |
| `proto native external` | Defined in another module | `proto native external bool AddSettings(typename cls);` |
| `proto volatile` | Has side effects; compiler must not optimize away | `proto volatile int Call(Class inst, string fn, void parm);` |
| `proto` (without `native`) | Internal function, may or may not be native | `proto int ParseString(string input, out string tokens[]);` |

### proto native

Il modificatore piu comune. These are straightforward engine calls.

```c
// Setting/getting position (Object)
proto native void SetPosition(vector pos);
proto native vector GetPosition();

// AI pathfinding (AIWorld)
proto native bool FindPath(vector from, vector to, PGFilter pgFilter, out TVectorArray waypoints);
proto native bool SampleNavmeshPosition(vector position, float maxDistance, PGFilter pgFilter,
    out vector sampledPosition);
```

### proto native owned

The `owned` modifier means the return value is allocated by il motore and **ownership is transferred to the script**. This is primarily used for `string` returns, where il motore creates a new string that the script's garbage collector must later free.

```c
// From Class (enscript.c) — returns a string the script now owns
proto native owned external string ClassName();

// From Widget (enwidgets.c)
proto native owned string GetName();
proto native owned string GetTypeName();
proto native owned string GetStyleName();

// From Object (3_game/entities/object.c)
proto native owned string GetLODName(LOD lod);
proto native owned string GetActionComponentName(int componentIndex, string geometry = "");
```

### proto native external

The `external` modifier indicates la funzione is definiscid in a different script module. This allows cross-module method declarations.

```c
// From Settings (2_gamelib/settings.c)
proto native external bool AddSettings(typename settingsClass);

// From InputManager (2_gamelib/inputmanager.c)
proto native external bool RegisterAction(string actionName);
proto native external float LocalValue(string actionName);
proto native external bool ActivateAction(string actionName, int duration = 0);

// From Workbench API (1_core/workbenchapi.c)
proto native external bool SetOpenedResource(string filename);
proto native external bool Save();
```

### proto volatile

The `volatile` modifier tells il compilatore la funzione may have **side effects** or may **call back into script** (creating re-entrancy). The compiler must preserve full context when calling these.

```c
// From ScriptModule (enscript.c) — dynamic function calls that may invoke script
proto volatile int Call(Class inst, string function, void parm);
proto volatile int CallFunction(Class inst, string function, out void returnVal, void parm);

// From typename (enconvert.c) — creates a new instance dynamically
proto volatile Class Spawn();

// Yielding control
proto volatile void Idle();
```

### Chiamata dei Metodi Proto Native

Si chiamano come qualsiasi altro metodo. La regola fondamentale: **non provare mai a override or redefinisci a proto native method**. They are fixed engine bindings.

```c
// Calling proto native methods — no different from script methods
Object obj = GetGame().CreateObject("AKM", pos, false, false, true);
vector position = obj.GetPosition();
string typeName = obj.GetType();     // owned string — returned to you
obj.SetPosition(newPos);             // native void — no return
```

---

## Metodi Statici vs Metodi di Istanza

### Quando Usare Static

Use static methods when la funzione does not need any dati di istanza:

```c
class StringUtils
{
    // Pure utility — no state needed
    static bool IsNullOrEmpty(string s)
    {
        return s == "" || s.Length() == 0;
    }

    static string PadLeft(string s, int totalWidth, string padChar = "0")
    {
        while (s.Length() < totalWidth)
            s = padChar + s;
        return s;
    }
}
```

**Casi d'uso comuni dei metodi statici:**
- **Utility functions** --- math helpers, string formatters, validation checks
- **Factory methods** --- `Create()` that returns a new configured instance
- **Singleton accessors** --- `GetInstance()` that returns the single instance
- **Constants/lookups** --- `Init()` + `Cleanup()` for static data tables

### Pattern Singleton (Statico + Istanza)

Many DayZ managers combine static and instance:

```c
class NotificationManager
{
    private static ref NotificationManager s_Instance;

    static NotificationManager GetInstance()
    {
        if (!s_Instance)
            s_Instance = new NotificationManager;
        return s_Instance;
    }

    // Instance methods for actual work
    void ShowNotification(string text, float duration)
    {
        // ...
    }
}

// Usage:
NotificationManager.GetInstance().ShowNotification("Hello", 5.0);
```

### Quando Usare Instance

Use instance methods when la funzione needs access to the object's state:

```c
class SupplyDrop
{
    protected vector m_DropPosition;
    protected float m_DropRadius;
    protected ref array<string> m_LootTable;

    // Needs m_DropPosition, m_DropRadius — must be instance
    bool IsInDropZone(vector testPos)
    {
        return vector.Distance(m_DropPosition, testPos) <= m_DropRadius;
    }

    // Needs m_LootTable — must be instance
    string GetRandomItem()
    {
        return m_LootTable.GetRandomElement();
    }
}
```

---

## Sovrascrivi dei Metodi

When a classe figlia needs to change the behavior of a parent method, it uses the `override` keyword.

### Sovrascrivi di Base

```c
class BaseModule
{
    void OnInit()
    {
        Print("[BaseModule] Initialized");
    }

    void OnUpdate(float dt)
    {
        // default: do nothing
    }
}

class CombatModule extends BaseModule
{
    override void OnInit()
    {
        super.OnInit();  // call parent first
        Print("[CombatModule] Combat system ready");
    }

    override void OnUpdate(float dt)
    {
        super.OnUpdate(dt);
        // custom combat logic
        CheckCombatState();
    }
}
```

### Regole per l'Sovrascrivi

1. **`override` keyword is required** --- without it, you create a new method that hides the parent's, instead of replacing it.

2. **Signature deve corrispondere esattamente** --- same tipo di ritorno, same parameter types, same parameter count.

3. **`super.MethodName()` calls the parent** --- use this to extend behavior rather than completely replace it.

4. **Private methods non puo essere sovrascritto** --- they are invisible to classe figliaes.

5. **Protected methods puo essere sovrascritto** --- classe figliaes see and can override them.

```c
class Parent
{
    private void SecretMethod() {}    // cannot be overridden
    protected void InternalWork() {}  // can be overridden by children
    void PublicWork() {}              // can be overridden by anyone
}

class Child extends Parent
{
    // override void SecretMethod() {}   // COMPILE ERROR — private
    override void InternalWork() {}      // OK — protected is visible
    override void PublicWork() {}        // OK — public
}
```

### GOTCHA: Forgetting override

Se si omette `override`, il compilatore may emit a warning but will **not** error. Your method silently becomes a new method instead of replacing the parent's. The parent's version runs whenever the object is referenced through a parent-type variable.

```c
class Animal
{
    void Speak() { Print("..."); }
}

class Dog extends Animal
{
    // BAD: Missing override — creates a NEW method
    void Speak() { Print("Woof!"); }

    // GOOD: Properly overrides
    override void Speak() { Print("Woof!"); }
}
```

---

## Overloading dei Metodi (Non Supportato)

**Enforce Script non supporta method overloading.** You cannot have two methods with the same name but different lista dei parametris. Attempting this causera un errore di compilazione.

```c
class Calculator
{
    // COMPILE ERROR — duplicate method name
    int Add(int a, int b) { return a + b; }
    float Add(float a, float b) { return a + b; }  // NOT ALLOWED
}
```

### Soluzione 1: Nomi di Metodo Diversi

The most common approach is to use descriptive names:

```c
class Calculator
{
    int AddInt(int a, int b) { return a + b; }
    float AddFloat(float a, float b) { return a + b; }
}
```

### Soluzione 2: La Convenzione Ex()

DayZ vanilla and mods follow a naming convention where an extended version of a method appends `Ex` to the name:

```c
// From vanilla scripts — base version vs extended version
void ExplosionEffects(Object source, Object directHit, int componentIndex);
void ExplosionEffectsEx(Object source, Object directHit, int componentIndex,
    float energyFactor, float explosionFactor, HitInfo hitInfo);

// From EffectManager
static void EffectUnregister(Effect effect);
static void EffectUnregisterEx(Effect effect);

// From EntityAI
void SplitIntoStackMax(EntityAI destination_entity, int slot_id);
void SplitIntoStackMaxEx(EntityAI destination_entity, int slot_id);
```

### Soluzione 3: Parametri Predefiniti

If the difference is just optional parameters, use defaults instead:

```c
class Spawner
{
    // Instead of overloads, use defaults
    void SpawnAt(vector pos, float radius = 0, string filter = "")
    {
        // one method handles all cases
    }
}
```

---

## La Keyword event

The `event` keyword marks a method as an **engine event handler** --- a function that the C++ engine calls at specific moments (entity creation, animation events, physics callbacks, etc.). It is a hint for tooling (like Workbench) that the method should be exposed as a script event.

```c
// From Pawn (3_game/entities/pawn.c)
protected event void OnPossess()
{
    // called by engine when a controller possesses this pawn
}

protected event void OnUnPossess()
{
    // called by engine when the controller releases this pawn
}

event void GetTransform(inout vector transform[4])
{
    // engine calls this to get the entity's transform
}

// Event methods that supply data for networking
protected event void ObtainMove(PawnMove pMove)
{
    // called by engine to gather movement input
}
```

You typically `override` event methods in classe figliaes rather than defining them from scratch:

```c
class MyVehicle extends Transport
{
    override event void GetTransform(inout vector transform[4])
    {
        // provide custom transform logic
        super.GetTransform(transform);
    }
}
```

The key takeaway: `event` is a declaration modifier, not something you invoke. Il motore chiama event methods at the appropriate time.

---

## Metodi Thread (Coroutine)

The `thread` keyword creates a **coroutine** --- a function that can yield execution and resume later. Despite the name, Enforce Script is **single-threaded**. Thread methods are cooperative coroutines, not OS-level threads.

### Dichiarazione e Avvio di un Thread

You start a thread by calling a function with the `thread` keyword preceding the call:

```c
class Monitor
{
    void Start()
    {
        thread MonitorLoop();
    }

    void MonitorLoop()
    {
        while (true)
        {
            CheckStatus();
            Sleep(1000);  // yield for 1000 milliseconds
        }
    }
}
```

The `thread` keyword goes on the **call**, not la funzione declaration. The function itself is a normal function --- what makes it a coroutine is how you invoke it.

### Sleep() e Yield

Inside a thread function, `Sleep(milliseconds)` pauses execution and yields to other code. When the sleep time elapses, the thread resumes from where it left off.

### Terminazione dei Thread

You can terminate a running thread with `KillThread()`:

```c
// From enscript.c
proto native int KillThread(Class owner, string name);

// Usage:
KillThread(this, "MonitorLoop");  // stops the MonitorLoop coroutine
```

The `owner` is the object that started the thread (or `null` for global threads). The `name` is la funzione name.

### Quando Usare Threads (and When Not To)

**Prefer `CallLater` and timers over threads.** Thread coroutines have limitations:
- They are harder to debug (stack traces are less clear)
- They consume a coroutine slot that persists until completion or kill
- They cannot be serialized or transferred across network boundaries

Use threads only when you genuinely need a long-running loop with intermediate yields. For one-shot delayed actions, use `CallLater` (see below).

---

## Chiamate Differite con CallLater

`CallLater` schedules a function call to execute after a delay. It is the primary alternative to thread coroutines and is used extensively in vanilla DayZ.

### Sintassi

```c
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(FunctionToCall, delayMs, repeat, ...params);
```

| Parametro | Tipo | Descrizione |
|-----------|------|-------------|
| Function | `func` | The method to call |
| Delay | `int` | Milliseconds before calling |
| Repeat | `bool` | `true` to repeat at interval, `false` for one-shot |
| Params | variadic | Parameters to pass to la funzione |

### Categorie di Chiamata

| Categoria | Scopo |
|----------|---------|
| `CALL_CATEGORY_SYSTEM` | General-purpose, runs ogni frame |
| `CALL_CATEGORY_GUI` | UI-related callbacks |
| `CALL_CATEGORY_GAMEPLAY` | Gameplay logica callbacks |

### Esempi da Vanilla

```c
// One-shot delayed call (3_game/entities/entityai.c)
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(DeferredInit, 34);

// Repeated call — login countdown every 1 second (3_game/dayzgame.c)
GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(this.LoginTimeCountdown, 1000, true);

// Delayed deletion with parameter (4_world/entities/explosivesbase)
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(DeleteSafe, delayFor * 1000, false);

// UI delayed callback (3_game/gui/hints/uihintpanel.c)
m_Game.GetCallQueue(CALL_CATEGORY_GUI).CallLater(SlideshowThread, m_SlideShowDelay);
```

### Rimozione delle Chiamate in Coda

To cancel a scheduled call before it fires:

```c
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).Remove(FunctionToCall);
```

---

## Buone Pratiche

1. **Keep functions short** --- aim for under 50 lines. If a function is longer, extract helper methods.

2. **Use guard clauses for early return** --- check preconditions at the top and return early. This reduces nesting and makes the "happy path" easier to read.

```c
void ProcessPlayer(PlayerBase player)
{
    if (!player) return;
    if (!player.IsAlive()) return;
    if (!player.GetIdentity()) return;

    // actual logic here, unnested
    string name = player.GetIdentity().GetName();
    // ...
}
```

3. **Prefer out parameters over complex tipo di ritornos** --- when a function needs to communicate success/failure plus data, use a `bool` return with `out` parameters.

4. **Use static for stateless utilities** --- if a method does not access `this`, make it `static`. This documents intent and allows calling without an instance.

5. **Document proto native limitations** --- when wrapping a proto native call, note in comments what il motore function can and cannot do.

6. **Prefer CallLater over thread coroutines** --- `CallLater` is simpler, easier to cancel, and less error-prone.

7. **Always call super in overrides** --- unless you intentionally want to completely replace the parent behavior. DayZ's deep inheritance chains depend on `super` calls propagating through the hierarchy.

---

## Osservato in Mod Reali

> Pattern confermati dallo studio del codice sorgente di mod DayZ professionali.

| Pattern | Mod | Dettaglio |
|---------|-----|--------|
| `TryGet___()` returning `bool` with `out` param | COT / Expansion | Consistent pattern for nullable lookups: return `true`/`false`, fill `out` param on success |
| `MethodEx()` for extended signatures | Vanilla / Expansion Market | When an API needs more parameters, append `Ex` rather than breaking existing callers |
| Static `Init()` + `Cleanup()` class methods | Expansion / VPP | Manager classes initialize static data in `Init()` and tear down in `Cleanup()`, called from mission lifecycle |
| Guard clause `if (!GetGame()) return` at method start | COT Admin Tools | Every method that touches il motore starts with null checks to avoid crashes during shutdown |
| Singleton `GetInstance()` with lazy creation | COT / Expansion / Dabs | Managers expose `static ref` instance with `GetInstance()` accessor, created on first access |

---

## Teoria vs Pratica

| Concetto | Teoria | Realta |
|---------|--------|---------|
| Method overloading | Standard OOP feature | Not supported; use `Ex()` suffix or default parameters instead |
| `thread` creates OS threads | Keyword suggests parallelism | Single-threaded coroutines with cooperative yielding via `Sleep()` |
| `out` parameters are write-only | Should not read initial value | Some vanilla code reads the `out` param before writing; safer to always treat as `inout` defensively |
| `override` is optional | Could be inferred | Omitting it silently creates a new method instead of overriding; includilo sempre |
| Predefinito parameter expressions | Should support function calls | Only literal values (`42`, `true`, `null`, `""`) are allowed; no expressions |

---

## Errori Comuni

### 1. Forgetting override When Replacing a Parent Method

Without `override`, your method becomes a new method that hides the parent's. The parent's version will still be called when the object is referenced through a parent type.

```c
// BAD — silently creates a new method
class CustomPlayer extends PlayerBase
{
    void OnConnect() { Print("Custom!"); }
}

// GOOD — properly overrides
class CustomPlayer extends PlayerBase
{
    override void OnConnect() { Print("Custom!"); }
}
```

### 2. Expecting out Parameters to Be Pre-initialized

An `out` parameter has no guaranteed initial value. Never read it before writing.

```c
// BAD — reading out param before it's set
void GetData(out int value)
{
    if (value > 0)  // WRONG — value is undefined here
        return;
    value = 42;
}

// GOOD — always write first, then read
void GetData(out int value)
{
    value = 42;
}
```

### 3. Trying to Overload Methods

Enforce Script non supporta overloading. Two methods with the same name cause a errore di compilazione.

```c
// COMPILE ERROR
void Process(int id) {}
void Process(string name) {}

// CORRECT — use different names
void ProcessById(int id) {}
void ProcessByName(string name) {}
```

### 4. Assigning the Return of a void Function

Some functions (notably `JsonFileLoader.JsonLoadFile`) return `void`. Trying to assign their result causes a errore di compilazione.

```c
// COMPILE ERROR — JsonLoadFile returns void
MyConfig cfg = JsonFileLoader<MyConfig>.JsonLoadFile(path);

// CORRECT
MyConfig cfg = new MyConfig;
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
```

### 5. Using Expressions in Default Parameters

Default parameter values must be compile-time literals. Expressions, function calls, and variable references are not allowed.

```c
// COMPILE ERROR — expression in default
void SetTimeout(float seconds = GetDefaultTimeout()) {}
void SetAngle(float rad = Math.PI) {}

// CORRECT — literal values only
void SetTimeout(float seconds = 30.0) {}
void SetAngle(float rad = 3.14159) {}
```

### 6. Forgetting super in Sovrascrivi Chains

DayZ's class hierarchies are deep. Omitting `super` in an override can break functionality several layers up the chain that you never even knew existed.

```c
// BAD — breaks parent initialization
class MyMission extends MissionServer
{
    override void OnInit()
    {
        // forgot super.OnInit() — vanilla initialization never runs!
        Print("My mission started");
    }
}

// GOOD
class MyMission extends MissionServer
{
    override void OnInit()
    {
        super.OnInit();  // let vanilla + other mods initialize first
        Print("My mission started");
    }
}
```

---

## Riferimento Rapido Table

| Funzionalita | Sintassi | Note |
|---------|--------|-------|
| Instance method | `void DoWork()` | Has access to `this` |
| Static method | `static void DoWork()` | Called via `ClassName.DoWork()` |
| By-value param | `void Fn(int x)` | Copy for primitives; ref copy for objects |
| `out` param | `void Fn(out int x)` | Write-only; caller receives value |
| `inout` param | `void Fn(inout float x)` | Read + write; caller sees changes |
| `notnull` param | `void Fn(notnull EntityAI e)` | Crashes on null |
| Predefinito value | `void Fn(int x = 5)` | Literals only, no expressions |
| Sovrascrivi | `override void Fn()` | Must match parent signature |
| Call parent | `super.Fn()` | Inside override body |
| Proto native | `proto native void Fn()` | Implemented in C++ |
| Owned return | `proto native owned string Fn()` | Script manages returned memory |
| External | `proto native external void Fn()` | Defined in another module |
| Volatile | `proto volatile void Fn()` | May callback into script |
| Event | `event void Fn()` | Engine-invoked callback |
| Thread start | `thread MyFunc()` | Starts coroutine (not OS thread) |
| Kill thread | `KillThread(owner, "FnName")` | Stops a running coroutine |
| Deferred call | `CallLater(Fn, delay, repeat)` | Preferred over threads |
| `Ex()` convention | `void FnEx(...)` | Extended version of `Fn` |

---

## Navigazione

| Precedente | Su | Successivo |
|----------|----|------|
| [1.12 Gotchas](12-gotchas.md) | [Part 1: Enforce Script](../README.md) | -- |
