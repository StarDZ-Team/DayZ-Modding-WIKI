# Chapter 1.9: Casting & Reflection

[Domů](../README.md) | [<< Předchozí: Správa paměti](08-memory-management.md) | **Přetypování a reflexe** | [Další: Výčty a preprocesor >>](10-enums-preprocessor.md)

---

> **Goal:** Master safe type casting, runtime type checks, and Enforce Script's reflection API for dynamic property access.

---

## Obsah

- [Why Casting Matters](#why-casting-matters)
- [Class.CastTo — Safe Downcasting](#classcastto--safe-downcasting)
- [Type.Cast — Alternative Casting](#typecast--alternative-casting)
- [CastTo vs Type.Cast — When to Use Which](#castto-vs-typecast--when-to-use-which)
- [obj.IsInherited — Runtime Type Checking](#obisinherited--runtime-type-checking)
- [obj.IsKindOf — String-Based Type Checking](#obiskindof--string-based-type-checking)
- [obj.Type — Get Runtime Type](#objtype--get-runtime-type)
- [typename — Storing Type References](#typename--storing-type-references)
- [Reflection API](#reflection-api)
  - [Inspecting Variables](#inspecting-variables)
  - [EnScript.GetClassVar / SetClassVar](#enscriptgetclassvar--setclassvar)
- [Real-World Examples](#real-world-examples)
  - [Finding All Vehicles in the World](#finding-all-vehicles-in-the-world)
  - [Safe Object Helper With Cast](#safe-object-helper-with-cast)
  - [Reflection-Based Config System](#reflection-based-config-system)
  - [Type-Safe Event Dispatch](#type-safe-event-dispatch)
- [Běžné Mistakes](#common-mistakes)
- [Summary](#summary)
- [Navigation](#navigation)

---

## Why Casting Matters

DayZ's entity hierarchy is deep. Most engine APIs return a generic base type (`Object`, `Man`, `Class`), but potřebujete a specifický type (`PlayerBase`, `ItemBase`, `CarScript`) to access specialized methods. Casting converts a base reference into a derived reference — safely.

```
Class (root)
  └─ Object
       └─ Entity
            └─ EntityAI
                 ├─ InventoryItem → ItemBase
                 ├─ DayZCreatureAI
                 │    ├─ DayZInfected
                 │    └─ DayZAnimal
                 └─ Man
                      └─ DayZPlayer → PlayerBase
```

Calling a method that doesn't exist on the base type causes a **runtime crash** — there is no compiler error protože Enforce Script resolves virtual calls za běhu.

---

## Class.CastTo — Safe Downcasting

`Class.CastTo` is the **preferred** casting method in DayZ. It is a statická method that writes výsledek to an `out` parameter and returns `bool`.

```c
// Signature:
// static bool Class.CastTo(out Class target, Class source)

Object obj = GetSomeObject();
PlayerBase player;

if (Class.CastTo(player, obj))
{
    // Cast succeeded — player is valid
    string name = player.GetIdentity().GetName();
    Print("Found player: " + name);
}
else
{
    // Cast failed — obj is not a PlayerBase
    // player is null here
}
```

**Why preferred:**
- Returns `false` on failure místo crashing
- The `out` parameter is set to `null` on failure — safe to check
- Works across the celý class hierarchy (not jen `Object`)

### Pattern: Cast-and-Continue

In loops, use cast failure to skip irrelevant objects:

```c
array<Object> nearObjects = new array<Object>;
array<CargoBase> proxyCargos = new array<CargoBase>;
GetGame().GetObjectsAtPosition(pos, 50.0, nearObjects, proxyCargos);

foreach (Object obj : nearObjects)
{
    EntityAI entity;
    if (!Class.CastTo(entity, obj))
        continue;  // Skip non-EntityAI objects (buildings, terrain, etc.)

    // Now safe to call EntityAI methods
    if (entity.IsAlive())
    {
        Print(entity.GetType() + " is alive at " + entity.GetPosition().ToString());
    }
}
```

---

## Type.Cast — Alternative Casting

Every class has a statická `Cast` method that vrací cast result přímo (or `null` on failure).

```c
// Syntax: TargetType.Cast(source)

Object obj = GetSomeObject();
PlayerBase player = PlayerBase.Cast(obj);

if (player)
{
    player.DoSomething();
}
```

This is a one-liner that combines cast and assignment, but you **must** stále null-check výsledek.

### Casting Primitives and Params

`Type.Cast` is také used with `Param` classes (used heavily in RPCs and dokoncets):

```c
override void OnEvent(EventType eventTypeId, Param params)
{
    if (eventTypeId == ClientReadyEventTypeID)
    {
        Param2<PlayerIdentity, Man> readyParams = Param2<PlayerIdentity, Man>.Cast(params);
        if (readyParams)
        {
            PlayerIdentity identity = readyParams.param1;
            Man player = readyParams.param2;
        }
    }
}
```

---

## CastTo vs Type.Cast — When to Use Which

| Feature | `Class.CastTo` | `Type.Cast` |
|---------|----------------|-------------|
| Return type | `bool` | Target type or `null` |
| Null on failure | Yes (out param set to null) | Yes (returns null) |
| Best for | if-blocks with branching logic | One-liner assignments |
| Used in DayZ vanilla | Everywhere | Everywhere |
| Works with non-Object | Yes (any `Class`) | Yes (any `Class`) |

**Rule of thumb:** Use `Class.CastTo` when you branch on success/failure. Use `Type.Cast` when you jen need typd reference and will null-check later.

```c
// CastTo — branch on result
PlayerBase player;
if (Class.CastTo(player, obj))
{
    // handle player
}

// Type.Cast — assign and check later
PlayerBase player = PlayerBase.Cast(obj);
if (!player) return;
```

---

## obj.IsInherited — Runtime Type Checking

`IsInherited` checks if an object is an instance of a given type **without** performing a cast. It takes a `typename` argument.

```c
Object obj = GetSomeObject();

if (obj.IsInherited(PlayerBase))
{
    Print("This is a player!");
}

if (obj.IsInherited(DayZInfected))
{
    Print("This is a zombie!");
}

if (obj.IsInherited(CarScript))
{
    Print("This is a vehicle!");
}
```

`IsInherited` returns `true` for the exact type **and** jakýkoli parent types in the hierarchy. A `PlayerBase` object returns `true` for `IsInherited(Man)`, `IsInherited(EntityAI)`, `IsInherited(Object)`, etc.

---

## obj.IsKindOf — String-Based Type Checking

`IsKindOf` does the stejný check but with a **string** class name. Useful when you have typ name as data (e.g., from config files).

```c
Object obj = GetSomeObject();

if (obj.IsKindOf("ItemBase"))
{
    Print("This is an item");
}

if (obj.IsKindOf("DayZAnimal"))
{
    Print("This is an animal");
}
```

**Important:** `IsKindOf` checks the plný inheritance chain, jen like `IsInherited`. A `Mag_STANAG_30Rnd` returns `true` for `IsKindOf("Magazine_Base")`, `IsKindOf("InventoryItem")`, `IsKindOf("EntityAI")`, etc.

### IsInherited vs IsKindOf

| Feature | `IsInherited(typename)` | `IsKindOf(string)` |
|---------|------------------------|---------------------|
| Argument | Compile-time type | String name |
| Speed | Faster (type comparison) | Slower (string lookup) |
| Use when | You know typ at compile time | Type comes from data/config |

---

## obj.Type — Get Runtime Type

`Type()` vrací `typename` of an object's actual runtime class — not the declared variable type.

```c
Object obj = GetSomeObject();
typename t = obj.Type();

Print(t.ToString());  // e.g., "PlayerBase", "AK101", "LandRover"
```

Use this for logging, debugging, or comparing types dynamically:

```c
void ProcessEntity(EntityAI entity)
{
    typename t = entity.Type();
    Print("Processing entity of type: " + t.ToString());

    if (t == PlayerBase)
    {
        Print("It's a player");
    }
}
```

---

## typename — Storing Type References

`typename` is a first-class type in Enforce Script. You can store it in variables, pass it as parameters, and compare it.

```c
// Declare a typename variable
typename playerType = PlayerBase;
typename vehicleType = CarScript;

// Compare
typename objType = obj.Type();
if (objType == playerType)
{
    Print("Match!");
}

// Use in collections
array<typename> allowedTypes = new array<typename>;
allowedTypes.Insert(PlayerBase);
allowedTypes.Insert(DayZInfected);
allowedTypes.Insert(DayZAnimal);

// Check membership
foreach (typename t : allowedTypes)
{
    if (obj.IsInherited(t))
    {
        Print("Object matches allowed type: " + t.ToString());
        break;
    }
}
```

### Creating Instances from typename

You can create objects from a `typename` za běhu:

```c
typename t = PlayerBase;
Class instance = t.Spawn();  // Creates a new instance

// Or use the string-based approach:
Class instance2 = GetGame().CreateObjectEx("AK101", pos, ECE_PLACE_ON_SURFACE);
```

> **Poznámka:** `typename.Spawn()` pouze works for classes with a parameterless constructor. For DayZ entities, use `GetGame().CreateObject()` or `CreateObjectEx()`.

---

## Reflection API

Enforce Script provides basic reflection — the ability to inspect and modify an object's properties za běhu without knowing its type at compile time.

### Inspecting Variables

Every object's `Type()` vrací `typename` that exposes variable metadata:

```c
void InspectObject(Class obj)
{
    typename t = obj.Type();

    int varCount = t.GetVariableCount();
    Print("Class: " + t.ToString() + " has " + varCount.ToString() + " variables");

    for (int i = 0; i < varCount; i++)
    {
        string varName = t.GetVariableName(i);
        typename varType = t.GetVariableType(i);

        Print("  [" + i.ToString() + "] " + varName + " : " + varType.ToString());
    }
}
```

**Available reflection methods on `typename`:**

| Method | Returns | Description |
|--------|---------|-------------|
| `GetVariableCount()` | `int` | Number of member variables |
| `GetVariableName(int index)` | `string` | Variable name at index |
| `GetVariableType(int index)` | `typename` | Variable type at index |
| `ToString()` | `string` | Class name as string |

### EnScript.GetClassVar / SetClassVar

`EnScript.GetClassVar` and `EnScript.SetClassVar` let you read/write member variables by **name** za běhu. This is Enforce Script's equivalent of dynamic property access.

```c
// Signature:
// static void EnScript.GetClassVar(Class instance, string varName, int index, out T value)
// static bool EnScript.SetClassVar(Class instance, string varName, int index, T value)
// 'index' is the array element index — use 0 for non-array fields.

class MyConfig
{
    int MaxSpawns = 10;
    float SpawnRadius = 100.0;
    string WelcomeMsg = "Hello!";
}

void DemoReflection()
{
    MyConfig cfg = new MyConfig();

    // Read values by name
    int maxVal;
    EnScript.GetClassVar(cfg, "MaxSpawns", 0, maxVal);
    Print("MaxSpawns = " + maxVal.ToString());  // "MaxSpawns = 10"

    float radius;
    EnScript.GetClassVar(cfg, "SpawnRadius", 0, radius);
    Print("SpawnRadius = " + radius.ToString());  // "SpawnRadius = 100"

    string msg;
    EnScript.GetClassVar(cfg, "WelcomeMsg", 0, msg);
    Print("WelcomeMsg = " + msg);  // "WelcomeMsg = Hello!"

    // Write values by name
    EnScript.SetClassVar(cfg, "MaxSpawns", 0, 50);
    EnScript.SetClassVar(cfg, "SpawnRadius", 0, 250.0);
    EnScript.SetClassVar(cfg, "WelcomeMsg", 0, "Welcome!");
}
```

> **Varování:** `GetClassVar`/`SetClassVar` tiše fail if the variable name is wrong or typ doesn't match. Vždy platnýate variable names before use.

---

## Příklady z praxe

### Nalezení všech vozidel ve světě

```c
static array<CarScript> FindAllVehicles()
{
    array<CarScript> vehicles = new array<CarScript>;
    array<Object> allObjects = new array<Object>;
    array<CargoBase> proxyCargos = new array<CargoBase>;

    // Search a large area (or use mission-specific logic)
    vector center = "7500 0 7500";
    GetGame().GetObjectsAtPosition(center, 15000.0, allObjects, proxyCargos);

    foreach (Object obj : allObjects)
    {
        CarScript car;
        if (Class.CastTo(car, obj))
        {
            vehicles.Insert(car);
        }
    }

    Print("Found " + vehicles.Count().ToString() + " vehicles");
    return vehicles;
}
```

### Safe Object Helper With Cast

This pattern is used throughout DayZ modding — a utility function that safely checks if an `Object` is alive by casting to `EntityAI`:

```c
// Object.IsAlive() does NOT exist on the base Object class!
// You must cast to EntityAI first.

static bool IsObjectAlive(Object obj)
{
    if (!obj)
        return false;

    EntityAI eai;
    if (Class.CastTo(eai, obj))
    {
        return eai.IsAlive();
    }

    return false;  // Non-EntityAI objects (buildings, etc.) — treat as "not alive"
}
```

### Reflection-Based Config System

This pattern (used in MyMod Core) builds a generic config system where fields are read/written by name, enabling admin panels to edit jakýkoli config without knowing its specifický class:

```c
class ConfigBase
{
    // Find a member variable index by name
    protected int FindVarIndex(string fieldName)
    {
        typename t = Type();
        int count = t.GetVariableCount();
        for (int i = 0; i < count; i++)
        {
            if (t.GetVariableName(i) == fieldName)
                return i;
        }
        return -1;
    }

    // Get any field value as string
    string GetFieldValue(string fieldName)
    {
        if (FindVarIndex(fieldName) == -1)
            return "";

        int iVal;
        EnScript.GetClassVar(this, fieldName, 0, iVal);
        return iVal.ToString();
    }

    // Set any field value from string
    void SetFieldValue(string fieldName, string value)
    {
        if (FindVarIndex(fieldName) == -1)
            return;

        int iVal = value.ToInt();
        EnScript.SetClassVar(this, fieldName, 0, iVal);
    }
}

class MyModConfig : ConfigBase
{
    int MaxPlayers = 60;
    int RespawnTime = 300;
}

void AdminPanelSave(ConfigBase config, string fieldName, string newValue)
{
    // Works for ANY config subclass — no type-specific code needed
    config.SetFieldValue(fieldName, newValue);
}
```

### Type-Safe Event Dispatch

Use `typename` to build a dispatcher that routes dokoncets to the correct handler:

```c
class EventDispatcher
{
    protected ref map<typename, ref array<ref EventHandler>> m_Handlers;

    void EventDispatcher()
    {
        m_Handlers = new map<typename, ref array<ref EventHandler>>;
    }

    void Register(typename eventType, EventHandler handler)
    {
        if (!m_Handlers.Contains(eventType))
        {
            m_Handlers.Insert(eventType, new array<ref EventHandler>);
        }

        m_Handlers.Get(eventType).Insert(handler);
    }

    void Dispatch(EventBase event)
    {
        typename eventType = event.Type();

        array<ref EventHandler> handlers;
        if (m_Handlers.Find(eventType, handlers))
        {
            foreach (EventHandler handler : handlers)
            {
                handler.Handle(event);
            }
        }
    }
}
```

---

## Osvědčené postupy

- Vždy null-check after každý cast -- oba `Class.CastTo` and `Type.Cast` return null on failure, and using výsledek unchecked causes crashes.
- Use `Class.CastTo` when potřebujete to branch on success/failure; use `Type.Cast` for concise one-liner assignments followed by a null check.
- Preferujte `IsInherited(typename)` over `IsKindOf(string)` when typ is known at compile time -- it is faster and catches typos at compile time.
- Cast to `EntityAI` before calling `IsAlive()` -- the base `Object` class ne have tato metoda.
- Validate variable names with `GetVariableCount`/`GetVariableName` before using `EnScript.GetClassVar` -- it fails tiše on wrong names.

---

## Pozorováno v reálných modech

> Patterns confirmed by studying professional DayZ mod source code.

| Vzor | Mod | Detail |
|---------|-----|--------|
| `Class.CastTo` + `continue` in entity loops | COT / Expansion | Every loop over `Object` arrays uses cast-and-continue to skip non-matching types |
| `IsKindOf` for config-driven type checks | Expansion Market | Item categories loaded from JSON use string-based `IsKindOf` protože types are data |
| `EnScript.GetClassVar`/`SetClassVar` for admin panels | Dabs Framework | Generic config editors read/write fields by name so one UI works for all config classes |
| `obj.Type().ToString()` for logging | VPP Admin | Debug logs vždy include `entity.Type().ToString()` to identify what was processed |

---

## Teorie vs praxe

| Concept | Theory | Reality |
|---------|--------|---------|
| `Object.IsAlive()` | Expect it to exist on `Object` | Only dostupný on `EntityAI` and subclasses -- calling it on `Object` crashes |
| `EnScript.SetClassVar` returns `bool` | Should indicate success/failure | Returns `false` tiše on wrong field name with no error message -- easy to miss |
| `typename.Spawn()` | Creates jakýkoli class instance | Only works for classes with a parameterless constructor; for game entities use `CreateObject` |

---

## Časté chyby

### 1. Forgetting to null-check after cast

```c
// WRONG — crashes if obj is not a PlayerBase
PlayerBase player = PlayerBase.Cast(obj);
player.GetIdentity();  // CRASH if cast failed!

// CORRECT
PlayerBase player = PlayerBase.Cast(obj);
if (player)
{
    player.GetIdentity();
}
```

### 2. Calling IsAlive() on base Object

```c
// WRONG — Object.IsAlive() does not exist
Object obj = GetSomeObject();
if (obj.IsAlive())  // Compile error or runtime crash!

// CORRECT
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive())
{
    // Safe
}
```

### 3. Using reflection with wrong variable name

```c
// SILENT FAILURE — no error, just returns zero/empty
int val;
EnScript.GetClassVar(obj, "NonExistentField", 0, val);
// val is 0, no error thrown
```

Vždy platnýate with `FindVarIndex` or `GetVariableCount`/`GetVariableName` first.

### 4. Confusing Type() with typename literal

```c
// Type() — returns the RUNTIME type of an instance
typename t = myObj.Type();  // e.g., PlayerBase

// typename literal — a compile-time type reference
typename t = PlayerBase;    // Always PlayerBase

// They are comparable
if (myObj.Type() == PlayerBase)  // true if myObj IS a PlayerBase
```

---

## Shrnutí

| Operation | Syntax | Returns |
|-----------|--------|---------|
| Safe downcast | `Class.CastTo(out target, source)` | `bool` |
| Inline cast | `TargetType.Cast(source)` | Target or `null` |
| Type check (typename) | `obj.IsInherited(typename)` | `bool` |
| Type check (string) | `obj.IsKindOf("ClassName")` | `bool` |
| Get runtime type | `obj.Type()` | `typename` |
| Variable count | `obj.Type().GetVariableCount()` | `int` |
| Variable name | `obj.Type().GetVariableName(i)` | `string` |
| Variable type | `obj.Type().GetVariableType(i)` | `typename` |
| Přečtěte property | `EnScript.GetClassVar(obj, name, 0, out val)` | `void` |
| Zapište property | `EnScript.SetClassVar(obj, name, 0, val)` | `bool` |

---

## Navigace

| Previous | Up | Next |
|----------|----|------|
| [1.8 Memory Management](08-memory-management.md) | [Part 1: Enforce Script](../README.md) | [1.10 Enums & Preprocessor](10-enums-preprocessor.md) |
