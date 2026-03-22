# Chapter 1.10: Enums & Preprocessor

[Home](../README.md) | [<< Previous: Casting & Reflection](09-casting-reflection.md) | **Enums & Preprocessor** | [Next: Error Handling >>](11-error-handling.md)

---

> **Goal:** Understand enum declarations, enum reflection tools, bitflag patterns, constants, and the preprocessor system for conditional compilation.

---

## Table of Contents

- [Enum Declaration](#enum-declaration)
  - [Explicit Values](#explicit-values)
  - [Implicit Values](#implicit-values)
  - [Enum Inheritance](#enum-inheritance)
- [Using Enums](#using-enums)
- [Enum Reflection](#enum-reflection)
  - [typename.EnumToString](#typenameenumtostring)
  - [typename.StringToEnum](#typenamestringtoenum)
- [Bitflags Pattern](#bitflags-pattern)
- [Constants](#constants)
- [Preprocessor Directives](#preprocessor-directives)
  - [#ifdef / #ifndef / #endif](#ifdef--ifndef--endif)
  - [#define](#define)
  - [Common Engine Defines](#common-engine-defines)
  - [Custom Defines via config.cpp](#custom-defines-via-configcpp)
- [Real-World Examples](#real-world-examples)
  - [Platform-Specific Code](#platform-specific-code)
  - [Optional Mod Dependencies](#optional-mod-dependencies)
  - [Debug-Only Diagnostics](#debug-only-diagnostics)
  - [Server vs Client Logic](#server-vs-client-logic)
- [Common Mistakes](#common-mistakes)
- [Summary](#summary)
- [Navigation](#navigation)

---

## Enum Declaration

Enums in Enforce Script define named integer constants grouped under a type name. They behave like `int` under the hood.

### Explicit Values

```c
enum EDamageState
{
    PRISTINE  = 0,
    WORN      = 1,
    DAMAGED   = 2,
    BADLY_DAMAGED = 3,
    RUINED    = 4
};
```

### Implicit Values

If you omit values, they auto-increment from the previous value (starting at 0):

```c
enum EWeaponMode
{
    SEMI,       // 0
    BURST,      // 1
    AUTO,       // 2
    COUNT       // 3 — common trick to get the total count
};
```

### Enum Inheritance

Enums can inherit from other enums. Values continue from the last parent value:

```c
enum EBaseColor
{
    RED    = 0,
    GREEN  = 1,
    BLUE   = 2
};

enum EExtendedColor : EBaseColor
{
    YELLOW,   // 3
    CYAN,     // 4
    MAGENTA   // 5
};
```

All parent values are accessible through the child enum:

```c
int c = EExtendedColor.RED;      // 0 — inherited from EBaseColor
int d = EExtendedColor.YELLOW;   // 3 — defined in EExtendedColor
```

> **Note:** Enum inheritance is useful for extending vanilla enums in modded code without changing the original.

---

## Using Enums

Enums act as `int` — you can assign them to `int` variables, compare them, and use them in switch statements:

```c
EDamageState state = EDamageState.WORN;

// Compare
if (state == EDamageState.RUINED)
{
    Print("Item is ruined!");
}

// Use in switch
switch (state)
{
    case EDamageState.PRISTINE:
        Print("Perfect condition");
        break;
    case EDamageState.WORN:
        Print("Slightly worn");
        break;
    case EDamageState.DAMAGED:
        Print("Damaged");
        break;
    case EDamageState.BADLY_DAMAGED:
        Print("Badly damaged");
        break;
    case EDamageState.RUINED:
        Print("Ruined!");
        break;
}

// Assign to int
int stateInt = state;  // 1

// Assign from int (no validation — any int value is accepted!)
EDamageState fromInt = 99;  // No error, even though 99 is not a valid enum value
```

> **Warning:** Enforce Script does **not** validate enum assignments. Assigning an out-of-range integer to an enum variable compiles and runs without error.

---

## Enum Reflection

Enforce Script provides built-in functions to convert between enum values and strings.

### typename.EnumToString

Convert an enum value to its name as a string:

```c
EDamageState state = EDamageState.DAMAGED;
string name = typename.EnumToString(EDamageState, state);
Print(name);  // "DAMAGED"
```

This is invaluable for logging and UI display:

```c
void LogDamageState(EntityAI item, EDamageState state)
{
    string stateName = typename.EnumToString(EDamageState, state);
    Print(item.GetType() + " is " + stateName);
}
```

### typename.StringToEnum

Convert a string back to an enum value:

```c
int value;
typename.StringToEnum(EDamageState, "RUINED", value);
Print(value.ToString());  // "4"
```

This is used when loading enum values from config files or JSON:

```c
// Loading from a config string
string configValue = "BURST";
int modeInt;
if (typename.StringToEnum(EWeaponMode, configValue, modeInt))
{
    EWeaponMode mode = modeInt;
    Print("Loaded weapon mode: " + typename.EnumToString(EWeaponMode, mode));
}
```

---

## Bitflags Pattern

Enums with power-of-2 values create bitflags — multiple options combined in a single integer:

```c
enum ESpawnFlags
{
    NONE            = 0,
    PLACE_ON_GROUND = 1,     // 1 << 0
    CREATE_PHYSICS  = 2,     // 1 << 1
    UPDATE_NAVMESH  = 4,     // 1 << 2
    CREATE_LOCAL    = 8,     // 1 << 3
    NO_LIFETIME     = 16     // 1 << 4
};
```

Combine with bitwise OR, test with bitwise AND:

```c
// Combine flags
int flags = ESpawnFlags.PLACE_ON_GROUND | ESpawnFlags.CREATE_PHYSICS | ESpawnFlags.UPDATE_NAVMESH;

// Test a single flag
if (flags & ESpawnFlags.CREATE_PHYSICS)
{
    Print("Physics will be created");
}

// Remove a flag
flags = flags & ~ESpawnFlags.CREATE_LOCAL;

// Add a flag
flags = flags | ESpawnFlags.NO_LIFETIME;
```

DayZ uses this pattern extensively for object creation flags (`ECE_PLACE_ON_SURFACE`, `ECE_CREATEPHYSICS`, `ECE_UPDATEPATHGRAPH`, etc.).

---

## Constants

Use `const` to declare immutable values. Constants must be initialized at declaration.

```c
// Integer constants
const int MAX_PLAYERS = 60;
const int INVALID_INDEX = -1;

// Float constants
const float GRAVITY = 9.81;
const float SPAWN_RADIUS = 500.0;

// String constants
const string MOD_NAME = "MyMod";
const string CONFIG_PATH = "$profile:MyMod/config.json";
const string LOG_PREFIX = "[MyMod] ";
```

Constants can be used as switch case values and array sizes:

```c
// Array with const size
const int BUFFER_SIZE = 256;
int buffer[BUFFER_SIZE];

// Switch with const values
const int CMD_HELP = 1;
const int CMD_SPAWN = 2;
const int CMD_TELEPORT = 3;

switch (command)
{
    case CMD_HELP:
        ShowHelp();
        break;
    case CMD_SPAWN:
        SpawnItem();
        break;
    case CMD_TELEPORT:
        TeleportPlayer();
        break;
}
```

> **Note:** There is no `const` for reference types (objects). You cannot make an object reference immutable.

---

## Preprocessor Directives

The Enforce Script preprocessor runs before compilation, enabling conditional code inclusion. It works similarly to C/C++ preprocessor but with fewer features.

### #ifdef / #ifndef / #endif

Conditionally include code based on whether a symbol is defined:

```c
// Include code only if DEVELOPER is defined
#ifdef DEVELOPER
    Print("[DEBUG] Diagnostics enabled");
#endif

// Include code only if a symbol is NOT defined
#ifndef SERVER
    // Client-only code
    CreateClientUI();
#endif

// If-else pattern
#ifdef SERVER
    Print("Running on server");
#else
    Print("Running on client");
#endif
```

### #define

Define your own symbols (no value — just existence):

```c
#define MY_MOD_DEBUG

#ifdef MY_MOD_DEBUG
    Print("Debug mode active");
#endif
```

> **Note:** Enforce Script `#define` only creates existence flags. It does **not** support macro substitution (no `#define MAX_HP 100` — use `const` instead).

### Common Engine Defines

DayZ provides these built-in defines based on build type and platform:

| Define | When Available | Use For |
|--------|---------------|---------|
| `SERVER` | Running on dedicated server | Server-only logic |
| `DEVELOPER` | Developer build of DayZ | Dev-only features |
| `DIAG_DEVELOPER` | Diagnostic build | Diagnostic menus, debug tools |
| `PLATFORM_WINDOWS` | Windows platform | Platform-specific paths |
| `PLATFORM_XBOX` | Xbox platform | Console-specific UI |
| `PLATFORM_PS4` | PlayStation platform | Console-specific logic |
| `BUILD_EXPERIMENTAL` | Experimental branch | Experimental features |

```c
void InitPlatform()
{
    #ifdef PLATFORM_WINDOWS
        Print("Running on Windows");
    #endif

    #ifdef PLATFORM_XBOX
        Print("Running on Xbox");
    #endif

    #ifdef PLATFORM_PS4
        Print("Running on PlayStation");
    #endif
}
```

### Custom Defines via config.cpp

Mods can define their own symbols in `config.cpp` using the `defines[]` array. These are available to all scripts loaded after this mod:

```cpp
class CfgMods
{
    class MyMod_MissionSystem
    {
        // ...
        defines[] = { "MY_MISSIONS_LOADED" };
        // ...
    };
};
```

Now other mods can detect whether your missions mod is loaded:

```c
#ifdef MY_MISSIONS_LOADED
    // Missions mod is loaded — use its API
    MyMissionManager.Start();
#else
    // Missions mod is not loaded — skip or use fallback
    Print("Mission system not detected");
#endif
```

---

## Real-World Examples

### Platform-Specific Code

```c
string GetSavePath()
{
    #ifdef PLATFORM_WINDOWS
        return "$profile:MyMod/saves/";
    #else
        return "$saves:MyMod/";
    #endif
}
```

### Optional Mod Dependencies

This is the standard pattern for mods that optionally integrate with other mods:

```c
class MyModManager
{
    void Init()
    {
        Print("[MyMod] Initializing...");

        // Core features always available
        LoadConfig();
        RegisterRPCs();

        // Optional integration with MyFramework
        #ifdef MY_FRAMEWORK
            Print("[MyMod] Framework detected — using unified logging");
            RegisterWithCore();
        #endif

        // Optional integration with Community Framework
        #ifdef JM_CommunityFramework
            GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);
        #endif
    }
}
```

### Debug-Only Diagnostics

```c
void ProcessAI(DayZInfected zombie)
{
    vector pos = zombie.GetPosition();
    float health = zombie.GetHealth("", "Health");

    // Heavy debug logging — only in diagnostic builds
    #ifdef DIAG_DEVELOPER
        Print(string.Format("[AI] Zombie %1 at %2, HP: %3",
            zombie.GetType(), pos.ToString(), health.ToString()));

        // Draw debug sphere (only works in diag builds)
        Debug.DrawSphere(pos, 1.0, Colors.RED, ShapeFlags.ONCE);
    #endif

    // Actual logic runs in all builds
    if (health <= 0)
    {
        HandleZombieDeath(zombie);
    }
}
```

### Server vs Client Logic

```c
class MissionHandler
{
    void OnMissionStart()
    {
        #ifdef SERVER
            // Server: load mission data, spawn objects
            LoadMissionData();
            SpawnMissionObjects();
            NotifyAllPlayers();
        #else
            // Client: set up UI, subscribe to events
            CreateMissionHUD();
            RegisterClientRPCs();
        #endif
    }
}
```

---

## Best Practices

- Add a `COUNT` sentinel value as the last enum entry to easily iterate or validate ranges (e.g., `for (int i = 0; i < EMode.COUNT; i++)`).
- Use power-of-2 values for bitflag enums and combine them with `|`; test with `&`; remove with `& ~FLAG`.
- Use `const` instead of `#define` for numeric constants -- Enforce Script `#define` only creates existence flags, not value macros.
- Define a `defines[]` array in your mod's `config.cpp` to expose cross-mod detection symbols (e.g., `"STARDZ_CORE"`).
- Always validate enum values loaded from external data (configs, RPCs) -- Enforce Script accepts any `int` as an enum with no range check.

---

## Observed in Real Mods

> Patterns confirmed by studying professional DayZ mod source code.

| Pattern | Mod | Detail |
|---------|-----|--------|
| `#ifdef` for optional mod integration | Expansion / COT | Checks `#ifdef JM_CF` or `#ifdef EXPANSIONMOD` before calling cross-mod APIs |
| Bitflag enums for spawn options | Vanilla DayZ | `ECE_PLACE_ON_SURFACE`, `ECE_CREATEPHYSICS` etc. combined with `\|` for `CreateObjectEx` |
| `typename.EnumToString` for logging | Expansion / Dabs | Damage states and event types are logged as readable strings instead of raw ints |
| `defines[]` in config.cpp | StarDZ Core / Expansion | Each mod declares its own symbol so other mods can detect it with `#ifdef` |

---

## Theory vs Practice

| Concept | Theory | Reality |
|---------|--------|---------|
| Enum assignment validation | Expect compiler to reject invalid values | `EDamageState state = 999` compiles fine -- no range checking whatsoever |
| `#define MAX_HP 100` | Works like C/C++ macro | Enforce Script `#define` creates only existence flags; use `const int` for values |
| `switch` case stacking | Multiple cases sharing one handler | No fall-through in Enforce Script -- each `case` is independent; use `if`/`\|\|` instead |

---

## Common Mistakes

### 1. Using enums as validated types

```c
// PROBLEM — no validation, any int is accepted
EDamageState state = 999;  // Compiles fine, but 999 is not a valid state

// SOLUTION — validate manually when loading from external data
int rawValue = LoadFromConfig();
if (rawValue >= 0 && rawValue <= EDamageState.RUINED)
{
    EDamageState state = rawValue;
}
```

### 2. Trying to use #define for value substitution

```c
// WRONG — Enforce Script #define does NOT support values
#define MAX_HEALTH 100
int hp = MAX_HEALTH;  // Compile error!

// CORRECT — use const instead
const int MAX_HEALTH = 100;
int hp = MAX_HEALTH;
```

### 3. Nesting #ifdef incorrectly

```c
// CORRECT — nested ifdefs are fine
#ifdef SERVER
    #ifdef MY_FRAMEWORK
        MyLog.Info("MyMod", "Server + Core");
    #endif
#endif

// WRONG — missing #endif causes mysterious compile errors
#ifdef SERVER
    DoServerStuff();
// forgot #endif here!
```

### 4. Forgetting that switch/case has no fall-through

```c
// In C/C++, cases fall through without break.
// In Enforce Script, each case is INDEPENDENT — no fall-through.

switch (state)
{
    case EDamageState.PRISTINE:
    case EDamageState.WORN:
        Print("Good condition");  // Only reached for WORN, not PRISTINE!
        break;
}
```

If you need multiple cases to share logic, use if/else:

```c
if (state == EDamageState.PRISTINE || state == EDamageState.WORN)
{
    Print("Good condition");
}
```

---

## Summary

### Enums

| Feature | Syntax |
|---------|--------|
| Declare | `enum EName { A = 0, B = 1 };` |
| Implicit | `enum EName { A, B, C };` (0, 1, 2) |
| Inherit | `enum EChild : EParent { D, E };` |
| To string | `typename.EnumToString(EName, value)` |
| From string | `typename.StringToEnum(EName, "A", out val)` |
| Bitflag combine | `flags = A | B` |
| Bitflag test | `if (flags & A)` |

### Preprocessor

| Directive | Purpose |
|-----------|---------|
| `#ifdef SYMBOL` | Compile if symbol exists |
| `#ifndef SYMBOL` | Compile if symbol does NOT exist |
| `#else` | Alternate branch |
| `#endif` | End conditional block |
| `#define SYMBOL` | Define a symbol (no value) |

### Key Defines

| Define | Meaning |
|--------|---------|
| `SERVER` | Dedicated server |
| `DEVELOPER` | Developer build |
| `DIAG_DEVELOPER` | Diagnostic build |
| `PLATFORM_WINDOWS` | Windows OS |
| Custom: `defines[]` | Your mod's config.cpp |

---

## Navigation

| Previous | Up | Next |
|----------|----|------|
| [1.9 Casting & Reflection](09-casting-reflection.md) | [Part 1: Enforce Script](../README.md) | [1.11 Error Handling](11-error-handling.md) |
