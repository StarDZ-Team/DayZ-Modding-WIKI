# Chapter 1.12: What Does NOT Exist (Gotchas)

[Home](../README.md) | [<< Previous: Error Handling](11-error-handling.md) | **Gotchas** | [Next: Functions & Methods >>](13-functions-methods.md)

---

## Tartalomjegyzek

- [Complete Gotchas Reference](#complete-gotchas-reference)
  1. [No Ternary Operator](#1-no-ternary-operator)
  2. [No do...while Loop](#2-no-dowhile-loop)
  3. [No try/catch/throw](#3-no-trycatchthrow)
  4. [No Multiple Inheritance](#4-no-multiple-inheritance)
  5. [No Operator Overloading (Except Index)](#5-no-operator-overloading-except-index)
  6. [No Lambdas / Anonymous Functions](#6-no-lambdas--anonymous-functions)
  7. [No Delegates / Function Pointers (Native)](#7-no-delegates--function-pointers-native)
  8. [No String Escape for Backslash/Quote](#8-no-string-escape-for-backslashquote)
  9. [No Variable Redeclaration in else-if Blocks](#9-no-variable-redeclaration-in-else-if-blocks)
  10. [No Ternary in Variable Declaration](#10-no-ternary-in-variable-declaration)
  11. [Object.IsAlive() Does NOT Exist on Base Object](#11-objectisalive-does-not-exist-on-base-object)
  12. [No nullptr — Use NULL or null](#12-no-nullptr--use-null-or-null)
  13. [switch/case Does NOT Fall Through](#13-switchcase-does-not-fall-through)
  14. [No Default Parameter Expressions](#14-no-default-parameter-expressions)
  15. [JsonFileLoader.JsonLoadFile Returns void](#15-jsonfileloaderjsonloadfile-returns-void)
  16. [No #define Value Substitution](#16-no-define-value-substitution)
  17. [No Interfaces / Abstract Classes (Enforced)](#17-no-interfaces--abstract-classes-enforced)
  18. [No Generics Constraints](#18-no-generics-constraints)
  19. [No Enum Validation](#19-no-enum-validation)
  20. [No Variadic Parameters](#20-no-variadic-parameters)
  21. [No Nested Class Declarations](#21-no-nested-class-declarations)
  22. [Static Arrays Are Fixed-Size](#22-static-arrays-are-fixed-size)
  23. [array.Remove Is Unordered](#23-arrayremove-is-unordered)
  24. [No #include — Everything via config.cpp](#24-no-include--everything-via-configcpp)
  25. [No Namespaces](#25-no-namespaces)
  26. [String Methods Modify In-Place](#26-string-methods-modify-in-place)
  27. [ref Cycles Cause Memory Leaks](#27-ref-cycles-cause-memory-leaks)
  28. [No Destructor Guarantee on Server Shutdown](#28-no-destructor-guarantee-on-server-shutdown)
  29. [No Scope-Based Resource Management (RAII)](#29-no-scope-based-resource-management-raii)
  30. [GetGame().GetPlayer() Returns null on Server](#30-getgamegetplayer-returns-null-on-server)
  31. [`sealed` osztalyok nem bovithetok (1.28+)](#31-sealed-osztalyok-nem-bovithetok-128)
  32. [Metodus parameter limit: maximum 16 (1.28+)](#32-metodus-parameter-limit-maximum-16-128)
  33. [`Obsolete` attributum figyelmeztetesek (1.28+)](#33-obsolete-attributum-figyelmeztetesek-128)
  34. [`int.MIN` osszehasonlitasi hiba](#34-intmin-osszehasonlitasi-hiba)
  35. [Tomb elem boolean negacio nem mukodik](#35-tomb-elem-boolean-negacio-nem-mukodik)
  36. [Osszetett kifejezes tomb ertekadasban osszeomlast okoz](#36-osszetett-kifejezes-tomb-ertekadasban-osszeomlast-okoz)
  37. [`foreach` metodus visszateresi erteken osszeomlast okoz](#37-foreach-metodus-visszateresi-erteken-osszeomlast-okoz)
  38. [Bitmuveleti vs osszehasonlito operator precedencia](#38-bitmuveleti-vs-osszehasonlito-operator-precedencia)
  39. [Ures `#ifdef` / `#ifndef` blokkok osszeomlast okoznak](#39-ures-ifdef--ifndef-blokkok-osszeomlast-okoznak)
  40. [`GetGame().IsClient()` False-t ad vissza betoltes kozben](#40-getgameisclient-false-t-ad-vissza-betoltes-kozben)
  41. [Forditasi hibauzenet rossz fajlt jelol](#41-forditasi-hibauzenet-rossz-fajlt-jelol)
  42. [`crash_*.log` fajlok nem valos osszeomlasok](#42-crashlog-fajlok-nem-valos-osszeomlasok)
- [Coming From C++](#coming-from-c)
- [Coming From C#](#coming-from-c-1)
- [Coming From Java](#coming-from-java)
- [Coming From Python](#coming-from-python)
- [Quick Reference Table](#quick-reference-table)
- [Navigation](#navigation)

---

## Teljes buktatok referencialista

### 1. No Ternary Operator

**What you would write:**
```c
int x = (condition) ? valueA : valueB;
```

**What happens:** Compile error. The `? :` operator does not exist.

**Correct solution:**
```c
int x;
if (condition)
    x = valueA;
else
    x = valueB;
```

---

### 2. No do...while Loop

**What you would write:**
```c
do {
    Process();
} while (HasMore());
```

**What happens:** Compile error. The `do` keyword does not exist.

**Correct solution — flag pattern:**
```c
bool first = true;
while (first || HasMore())
{
    first = false;
    Process();
}
```

**Correct solution — break pattern:**
```c
while (true)
{
    Process();
    if (!HasMore())
        break;
}
```

---

### 3. No try/catch/throw

**What you would write:**
```c
try {
    RiskyOperation();
} catch (Exception e) {
    HandleError(e);
}
```

**What happens:** Compile error. These keywords do not exist.

**Correct solution:** Guard clauses with early return.
```c
void DoOperation()
{
    if (!CanDoOperation())
    {
        ErrorEx("Cannot perform operation", ErrorExSeverity.WARNING);
        return;
    }

    // Proceed safely
    RiskyOperation();
}
```

See [Chapter 1.11 — Hibakezelees](11-error-handling.md) for full patterns.

---

### 4. No Multiple Inheritance

**What you would write:**
```c
class MyClass extends BaseA, BaseB  // Two base classes
```

**What happens:** Compile error. Only single inheritance is supported.

**Correct solution:** Inherit from one class, compose the other:
```c
class MyClass extends BaseA
{
    ref BaseB m_Helper;

    void MyClass()
    {
        m_Helper = new BaseB();
    }
}
```

---

### 5. No Operator Overloading (Except Index)

**What you would write:**
```c
Vector3 operator+(Vector3 a, Vector3 b) { ... }
bool operator==(MyClass other) { ... }
```

**What happens:** Compile error. Custom operators cannot be defined.

**Correct solution:** Use named methods:
```c
class MyVector
{
    float x, y, z;

    MyVector Add(MyVector other)
    {
        MyVector result = new MyVector();
        result.x = x + other.x;
        result.y = y + other.y;
        result.z = z + other.z;
        return result;
    }

    bool Equals(MyVector other)
    {
        return (x == other.x && y == other.y && z == other.z);
    }
}
```

**Exception:** The index operator `[]` can be overloaded via `Get(index)` and `Set(index, value)` methods:
```c
class MyContainer
{
    int data[10];

    int Get(int index) { return data[index]; }
    void Set(int index, int value) { data[index] = value; }
}

MyContainer c = new MyContainer();
c[3] = 42;        // Calls Set(3, 42)
int v = c[3];     // Calls Get(3)
```

---

### 6. No Lambdas / Anonymous Functions

**What you would write:**
```c
array.Sort((a, b) => a.name.CompareTo(b.name));
button.OnClick += () => { DoSomething(); };
```

**What happens:** Compile error. Lambda syntax does not exist.

**Correct solution:** Define named methods and pass them as `ScriptCaller` or use string-based callbacks:
```c
// Named method
void OnButtonClick()
{
    DoSomething();
}

// String-based callback (used by CallLater, timers, etc.)
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.OnButtonClick, 1000, false);
```

---

### 7. No Delegates / Function Pointers (Native)

**What you would write:**
```c
delegate void MyCallback(int value);
MyCallback cb = SomeFunction;
cb(42);
```

**What happens:** Compile error. The `delegate` keyword does not exist.

**Correct solution:** Use `ScriptCaller`, `ScriptInvoker`, or string-based method names:
```c
// ScriptCaller (single callback)
ScriptCaller caller = ScriptCaller.Create(MyFunction);

// ScriptInvoker (event with multiple subscribers)
ref ScriptInvoker m_OnEvent = new ScriptInvoker();
m_OnEvent.Insert(MyHandler);
m_OnEvent.Invoke();  // Calls all registered handlers
```

---

### 8. No String Escape for Backslash/Quote

**What you would write:**
```c
string path = "C:\\Users\\folder";
string quote = "He said \"hello\"";
```

**What happens:** CParser crashes or produces garbled output. The `\\` and `\"` escape sequences break the string parser.

**Correct solution:** Avoid backslash and quote characters in string literals entirely:
```c
// Use forward slashes for paths
string path = "C:/Users/folder";

// Use single quotes or rephrase to avoid embedded double quotes
string quote = "He said 'hello'";

// Use string concatenation if you absolutely need special chars
// (still risky — test thoroughly)
```

> **Megjegyzes:** `\n`, `\r`, and `\t` escape sequences DO work. Only `\\` and `\"` are broken.

---

### 9. No Variable Redeclaration in else-if Blocks

**What you would write:**
```c
if (condA)
{
    string msg = "Case A";
    Print(msg);
}
else if (condB)
{
    string msg = "Case B";  // Same variable name in sibling block
    Print(msg);
}
```

**What happens:** Compile error: "multiple declaration of variable 'msg'". Enforce Script treats variables in sibling `if`/`else if`/`else` blocks as sharing the same scope.

**Correct solution — unique names:**
```c
if (condA)
{
    string msgA = "Case A";
    Print(msgA);
}
else if (condB)
{
    string msgB = "Case B";
    Print(msgB);
}
```

**Correct solution — declare before the if:**
```c
string msg;
if (condA)
{
    msg = "Case A";
}
else if (condB)
{
    msg = "Case B";
}
Print(msg);
```

---

### 10. No Ternary in Variable Declaration

Related to gotcha #1, but specific to declarations:

**What you would write:**
```c
string label = isAdmin ? "Admin" : "Player";
```

**Correct solution:**
```c
string label;
if (isAdmin)
    label = "Admin";
else
    label = "Player";
```

---

### 11. Object.IsAlive() Does NOT Exist on Base Object

**What you would write:**
```c
Object obj = GetSomething();
if (obj.IsAlive())  // Check if alive
```

**What happens:** Compile error or runtime crash. `IsAlive()` is defined on `EntityAI`, not on `Object`.

**Correct solution:**
```c
Object obj = GetSomething();
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive())
{
    // Safely alive
}
```

---

### 12. No nullptr — Use NULL or null

**What you would write:**
```c
if (obj == nullptr)
```

**What happens:** Compile error. The `nullptr` keyword does not exist.

**Correct solution:**
```c
if (obj == null)    // lowercase works
if (obj == NULL)    // uppercase also works
if (!obj)           // idiomatic null check (preferred)
```

---

### 13. switch/case Does NOT Fall Through

**What you would write (expecting C/C++ fall-through):**
```c
switch (value)
{
    case 1:
    case 2:
    case 3:
        Print("1, 2, or 3");  // In C++, cases 1 and 2 fall through to here
        break;
}
```

**What happens:** Only case 3 executes the Print. Cases 1 and 2 are empty — they do nothing and do NOT fall through.

**Correct solution:**
```c
if (value >= 1 && value <= 3)
{
    Print("1, 2, or 3");
}

// Or handle each case explicitly:
switch (value)
{
    case 1:
        Print("1, 2, or 3");
        break;
    case 2:
        Print("1, 2, or 3");
        break;
    case 3:
        Print("1, 2, or 3");
        break;
}
```

> **Megjegyzes:** `break` is technically optional in Enforce Script since there is no fall-through, but it is conventional to include it.

---

### 14. No Default Parameter Expressions

**What you would write:**
```c
void Spawn(vector pos = GetDefaultPos())    // Expression as default
void Spawn(vector pos = Vector(0, 100, 0))  // Constructor as default
```

**What happens:** Compile error. Default parameter values must be **literals** or `NULL`.

**Correct solution:**
```c
void Spawn(vector pos = "0 100 0")    // String literal for vector — OK
void Spawn(int count = 5)             // Integer literal — OK
void Spawn(float radius = 10.0)      // Float literal — OK
void Spawn(string name = "default")   // String literal — OK
void Spawn(Object obj = NULL)         // NULL — OK

// For complex defaults, use overloads:
void Spawn()
{
    Spawn(GetDefaultPos());  // Call the parametric version
}

void Spawn(vector pos)
{
    // Actual implementation
}
```

---

### 15. JsonFileLoader.JsonLoadFile Returns void

**What you would write:**
```c
MyConfig cfg = JsonFileLoader<MyConfig>.JsonLoadFile(path);
// or:
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg))
```

**What happens:** Compile error. `JsonLoadFile` returns `void`, not the loaded object or a bool.

**Correct solution:**
```c
MyConfig cfg = new MyConfig();  // Create instance first with defaults
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // Populates cfg in-place
// cfg now contains loaded values (or still has defaults if file was invalid)
```

> **Megjegyzes:** The newer `JsonFileLoader<T>.LoadFile()` method returns `bool`, but `JsonLoadFile` (the commonly seen version) does not.

---

### 16. No #define Value Substitution

**What you would write:**
```c
#define MAX_PLAYERS 60
#define VERSION_STRING "1.0.0"
int max = MAX_PLAYERS;
```

**What happens:** Compile error. Enforce Script `#define` only creates existence flags for `#ifdef` checks. It does not support value substitution.

**Correct solution:**
```c
// Use const for values
const int MAX_PLAYERS = 60;
const string VERSION_STRING = "1.0.0";

// Use #define only for conditional compilation flags
#define MY_MOD_ENABLED
```

---

### 17. No Interfaces / Abstract Classes (Enforced)

**What you would write:**
```c
interface ISerializable
{
    void Serialize();
    void Deserialize();
}

abstract class BaseProcessor
{
    abstract void Process();
}
```

**What happens:** The `interface` and `abstract` keywords do not exist.

**Correct solution:** Use regular classes with empty base methods:
```c
// "Interface" — base class with empty methods
class ISerializable
{
    void Serialize() {}     // Override in subclass
    void Deserialize() {}   // Override in subclass
}

// "Abstract" class — same pattern
class BaseProcessor
{
    void Process()
    {
        ErrorEx("BaseProcessor.Process() must be overridden!", ErrorExSeverity.ERROR);
    }
}

class ConcreteProcessor extends BaseProcessor
{
    override void Process()
    {
        // Actual implementation
    }
}
```

The compiler does NOT enforce that subclasses override the base methods. Forgetting to override silently uses the empty base implementation.

---

### 18. No Generics Constraints

**What you would write:**
```c
class Container<T> where T : EntityAI  // Constrain T to EntityAI
```

**What happens:** Compile error. The `where` clause does not exist. Template parameters accept any type.

**Correct solution:** Validate at runtime:
```c
class EntityContainer<Class T>
{
    void Add(T item)
    {
        // Runtime type check instead of compile-time constraint
        EntityAI eai;
        if (!Class.CastTo(eai, item))
        {
            ErrorEx("EntityContainer only accepts EntityAI subclasses");
            return;
        }
        // proceed
    }
}
```

---

### 19. No Enum Validation

**What you would write:**
```c
EDamageState state = (EDamageState)999;  // Expect error or exception
```

**What happens:** No error. Any `int` value can be assigned to an enum variable, even values outside the defined range.

**Correct solution:** Validate manually:
```c
bool IsValidDamageState(int value)
{
    return (value >= EDamageState.PRISTINE && value <= EDamageState.RUINED);
}

int rawValue = LoadFromConfig();
if (IsValidDamageState(rawValue))
{
    EDamageState state = rawValue;
}
else
{
    Print("Invalid damage state: " + rawValue.ToString());
    EDamageState state = EDamageState.PRISTINE;  // fallback
}
```

---

### 20. No Variadic Parameters

**What you would write:**
```c
void Log(string format, params object[] args)
void Printf(string fmt, ...)
```

**What happens:** Compile error. Variadic parameters do not exist.

**Correct solution:** Use `string.Format` with fixed parameter counts, or use `Param` classes:
```c
// string.Format supports up to 9 positional arguments
string msg = string.Format("Player %1 at %2 with %3 HP", name, pos, hp);

// For variable-count data, pass an array
void LogMultiple(string tag, array<string> messages)
{
    foreach (string msg : messages)
    {
        Print("[" + tag + "] " + msg);
    }
}
```

---

### 21. No Nested Class Declarations

**What you would write:**
```c
class Outer
{
    class Inner  // Nested class
    {
        int value;
    }
}
```

**What happens:** Compile error. Classes cannot be declared inside other classes.

**Correct solution:** Declare all classes at the top level, use naming conventions to show relationships:
```c
class MySystem_Config
{
    int value;
}

class MySystem
{
    ref MySystem_Config m_Config;
}
```

---

### 22. Static Arrays Are Fixed-Size

**What you would write:**
```c
int size = GetCount();
int arr[size];  // Dynamic size at runtime
```

**What happens:** Compile error. Static array sizes must be compile-time constants.

**Correct solution:**
```c
// Use a const for static arrays
const int BUFFER_SIZE = 64;
int arr[BUFFER_SIZE];

// Or use dynamic arrays for runtime sizing
array<int> arr = new array<int>;
arr.Resize(GetCount());
```

---

### 23. array.Remove Is Unordered

**What you would write (expecting order preservation):**
```c
array<string> items = {"A", "B", "C", "D"};
items.Remove(1);  // Expect: {"A", "C", "D"}
```

**What happens:** `Remove(index)` swaps the element with the **last** element, then removes the last. Result: `{"A", "D", "C"}`. Order is NOT preserved.

**Correct solution:**
```c
// Use RemoveOrdered for order preservation (slower — shifts elements)
items.RemoveOrdered(1);  // {"A", "C", "D"} — correct order

// Use RemoveItem to find and remove by value (also ordered)
items.RemoveItem("B");   // {"A", "C", "D"}
```

---

### 24. No #include — Everything via config.cpp

**What you would write:**
```c
#include "MyHelper.c"
#include "Utils/StringUtils.c"
```

**What happens:** No effect or compile error. There is no `#include` directive.

**Correct solution:** All script files are loaded through `config.cpp` in the mod's `CfgMods` entry. File loading order is determined by the script layer (`3_Game`, `4_World`, `5_Mission`) and alphabetical order within each layer.

```cpp
// config.cpp
class CfgMods
{
    class MyMod
    {
        type = "mod";
        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                files[] = { "MyMod/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                files[] = { "MyMod/Scripts/4_World" };
            };
            class missionScriptModule
            {
                files[] = { "MyMod/Scripts/5_Mission" };
            };
        };
    };
};
```

---

### 25. No Namespaces

**What you would write:**
```c
namespace MyMod { class Config { } }
namespace MyMod.Utils { class StringHelper { } }
```

**What happens:** Compile error. The `namespace` keyword does not exist. All classes share a single global scope.

**Correct solution:** Use naming prefixes to avoid conflicts:
```c
class MyConfig { }          // MyFramework
class MyAI_Config { }       // MyAI Mod
class MyM_MissionData { }   // MyMissions Mod
class VPP_AdminConfig { }     // VPP Admin
```

---

### 26. String Methods Modify In-Place

**What you would write (expecting a return value):**
```c
string upper = myString.ToUpper();  // Expect: returns new string
```

**What happens:** `ToUpper()` and `ToLower()` modify the string **in place** and return `void`.

**Correct solution:**
```c
// Make a copy first if you need the original preserved
string original = "Hello World";
string upper = original;
upper.ToUpper();  // upper is now "HELLO WORLD", original unchanged

// Same for TrimInPlace
string trimmed = "  hello  ";
trimmed.TrimInPlace();  // "hello"
```

---

### 27. ref Cycles Cause Memory Leaks

**What you would write:**
```c
class Parent
{
    ref Child m_Child;
}
class Child
{
    ref Parent m_Parent;  // Circular ref — both ref each other
}
```

**What happens:** Neither object is ever garbage collected. The reference counts never reach zero because each holds a `ref` to the other.

**Correct solution:** One side must use a raw (non-ref) pointer:
```c
class Parent
{
    ref Child m_Child;  // Parent OWNS the child (ref)
}
class Child
{
    Parent m_Parent;    // Child REFERENCES the parent (raw — no ref)
}
```

---

### 28. No Destructor Guarantee on Server Shutdown

**What you would write (expecting cleanup):**
```c
void ~MyManager()
{
    SaveData();  // Expect this runs on shutdown
}
```

**What happens:** Server shutdown may kill the process before destructors run. Your save never happens.

**Correct solution:** Save proactively at regular intervals and on known lifecycle events:
```c
class MyManager
{
    void OnMissionFinish()  // Called before shutdown
    {
        SaveData();  // Reliable save point
    }

    void OnUpdate(float dt)
    {
        m_SaveTimer += dt;
        if (m_SaveTimer > 300.0)  // Every 5 minutes
        {
            SaveData();
            m_SaveTimer = 0;
        }
    }
}
```

---

### 29. No Scope-Based Resource Management (RAII)

**What you would write (in C++):**
```c
{
    FileHandle f = OpenFile("test.txt", FileMode.WRITE);
    // f automatically closed when scope ends
}
```

**What happens:** Enforce Script does not close file handles when variables go out of scope (even with `autoptr`).

**Correct solution:** Always close resources explicitly:
```c
FileHandle fh = OpenFile("$profile:MyMod/data.txt", FileMode.WRITE);
if (fh != 0)
{
    FPrintln(fh, "data");
    CloseFile(fh);  // Must close manually!
}
```

---

### 30. GetGame().GetPlayer() Returns null on Server

**What you would write:**
```c
PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
player.DoSomething();  // CRASH on server!
```

**What happens:** `GetGame().GetPlayer()` returns the **local** player. On a dedicated server, there is no local player — it returns `null`.

**Correct solution:** On server, iterate the player list:
```c
#ifdef SERVER
    array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);
    foreach (Man man : players)
    {
        PlayerBase player;
        if (Class.CastTo(player, man))
        {
            player.DoSomething();
        }
    }
#else
    PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
    if (player)
    {
        player.DoSomething();
    }
#endif
```

---

### 31. `sealed` osztalyok nem bovithetok (1.28+)

A DayZ 1.28-tol kezdve az Enforce Script fordito ervenyesiti a `sealed` kulcsszot. Egy `sealed` jelolesu osztaly vagy metodus nem orokolheto es nem irhato felul. Ha megprobalod boviteni egy sealed osztalyt:

```c
// Ha a BI SomeVanillaClass-t sealed-kent jeloli:
class MyClass : SomeVanillaClass  // FORDITASI HIBA 1.28+-ban
{
}
```

Ellenorizd a vanilla script dump-ot, hogy van-e `sealed` jeloles az osztlyon, mielott megprobalnal orokolni belole. Ha modositanod kell egy sealed osztaly viselkedeset, hasznalj kompoziciot (burkold be tagvaltozokent) az oroklodes helyett.

---

### 32. Metodus parameter limit: maximum 16 (1.28+)

Az Enforce Script-ben mindig volt egy 16 parameteres limit a metodusokon, de 1.28 elott ez nema buffer tulcsordulas volt, ami veletlenszeru osszeomlasokat okozott. 1.28-tol a fordito **kemeny hibat** ad:

```c
// FORDITASI HIBA 1.28+-ban — tobb mint 16 parameter
void MyMethod(int a, int b, int c, int d, int e, int f, int g, int h,
              int i, int j, int k, int l, int m, int n, int o, int p,
              int q)  // 17. parameter = hiba
{
}
```

**Javitas:** Refaktorald ugy, hogy osztalyt vagy tombot adsz at az egyedi parameterek helyett.

---

### 33. `Obsolete` attributum figyelmeztetesek (1.28+)

A DayZ 1.28 bevezette az `Obsolete` attributumot. A `[Obsolete]` jelolesu fuggvenyek es osztalyok fordito figyelmezteteseket generalnak. Ezek az API-k meg mukodnek, de egy jovobeli frissitesben eltavolitasra kerulnek. Ellenorizd a build kimenetet elavult figyelmeztetesekert es migrald az ajanlott alternativara.

---

### 34. `int.MIN` osszehasonlitasi hiba

Az `int.MIN` (-2147483648) ertekkel valo osszehasonlitasok helytelen eredmenyt adnak:

```c
int val = 1;
if (val < int.MIN)  // TRUE-ra ertekelodik — pedig false kellene legyen
{
    // Ez a blokk helytelenul lefut
}
```

Keruid a kozvetlen osszehasonlitast `int.MIN`-nel. Hasznalj tarolt konstanst, vagy hasonlitsd ossze egy konkret negativ ertekkel.

---

### 35. Tomb elem boolean negacio nem mukodik

A tomb elemek kozvetlen boolean negacioja nem fordithato:

```c
array<int> list = {0, 1, 2};
if (!list[1])          // NEM FORDITHATO
if (list[1] == 0)      // Mukodik — hasznalj explicit osszehasonlitast
```

Mindig hasznalj explicit egyenloseg-ellenorzest, amikor tomb elemeket tesztelsz igaz/hamis ertekre.

---

### 36. Osszetett kifejezes tomb ertekadasban osszeomlast okoz

Osszetett kifejezes kozvetlen hozzarendelese egy tomb elemhez szegmentacios hibat okozhat:

```c
// OSSZEOMLAS futasidokor
m_Values[index] = vector.DistanceSq(posA, posB) <= distSq;

// BIZTONSAGOS — hasznalj koztes valtozot
bool result = vector.DistanceSq(posA, posB) <= distSq;
m_Values[index] = result;
```

Mindig tarold az osszetett kifejezes eredmenyet lokalis valtozoba, mielott tombhoz rendeled.

---

### 37. `foreach` metodus visszateresi erteken osszeomlast okoz

Ha a `foreach`-et kozvetlenul egy metodus visszateresi erteken hasznalod, null pointer kivetelt kapsz a masodik iteracioban:

```c
// OSSZEOMLAST OKOZ a 2. elemnel
foreach (string item : GetMyArray())
{
}

// BIZTONSAGOS — elobb tarold lokalis valtozoba
array<string> items = GetMyArray();
foreach (string item : items)
{
}
```

---

### 38. Bitmuveleti vs osszehasonlito operator precedencia

A bitmuveleti operatorok **alacsonyabb** precedenciaval rendelkeznek, mint az osszehasonlito operatorok, a C/C++ szabalyokat kovetve:

```c
int flags = 5;
int mask = 4;
if (flags & mask == mask)      // HELYTELEN: ugy ertekelodik, mint flags & (mask == mask)
if ((flags & mask) == mask)    // HELYES: mindig hasznalj zarojelet
```

---

### 39. Ures `#ifdef` / `#ifndef` blokkok osszeomlast okoznak

Az ures preprocesszor felteteles blokkok — meg azok is, amelyek csak megjegyzeseket tartalmaznak — szegmentacios hibat okoznak:

```c
#ifdef SOME_DEFINE
    // Ez a csak-megjegyzeses blokk SEGFAULT-ot okoz
#endif
```

Mindig tartalmazz legalabb egy vegrehajtando utasitast, vagy hagyd el teljesen a blokkot.

---

### 40. `GetGame().IsClient()` False-t ad vissza betoltes kozben

A kliens betoltesi fazisaban a `GetGame().IsClient()` **false**-t ad vissza, es a `GetGame().IsServer()` **true**-t — meg klienseken is. Hasznald helyette az `IsDedicatedServer()` metodust:

```c
// MEGBIZHATATLAN betoltes kozben
if (GetGame().IsClient()) { }   // false betoltes kozben!
if (GetGame().IsServer()) { }   // true betoltes kozben, meg kliensen is!

// MEGBIZHATO
if (!GetGame().IsDedicatedServer()) { /* kliens kod */ }
if (GetGame().IsDedicatedServer())  { /* szerver kod */ }
```

**Kivetel:** Ha tamogatnod kell az offline/egyjatekos modot, az `IsDedicatedServer()` false-t ad listen szervereknel is.

---

### 41. Forditasi hibauzenet rossz fajlt jelol

Amikor a fordito meghatarozott osztalyt vagy valtozonevu utkozest talal, a hibat az **utolso sikeresen feldolgozott fajl EOF poziciojanal** jelzi — nem a tenyleges hiba helyenel. Ha olyan fajlra mutato hibat latsz, amelyet nem modositottal, a valos hiba az utana kovetkezo, feldolgozas alatt allo fajlban van.

---

### 42. `crash_*.log` fajlok nem valos osszeomlasok

A `crash_<datum>_<ido>.log` nevu naplofajlok **futasideju kiveteleket** tartalmaznak, nem valos szegmentacios hibakat. Az elnevezes felrevezeto — ezek script hibak, nem motor osszeomalsok.

---

## C++-bol erkezo fejlesztoknek

If you are a C++ developer, here are the biggest adjustments:

| C++ Feature | Enforce Script Equivalent |
|-------------|--------------------------|
| `std::vector` | `array<T>` |
| `std::map` | `map<K,V>` |
| `std::unique_ptr` | `ref` / `autoptr` |
| `dynamic_cast<T*>` | `Class.CastTo()` or `T.Cast()` |
| `try/catch` | Guard clauses |
| `operator+` | Named methods (`Add()`) |
| `namespace` | Name prefixes (`My`, `VPP_`) |
| `#include` | config.cpp `files[]` |
| RAII | Manual cleanup in lifecycle methods |
| Multiple inheritance | Single inheritance + composition |
| `nullptr` | `null` / `NULL` |
| Templates with constraints | Templates without constraints + runtime checks |
| `do...while` | `while (true) { ... if (!cond) break; }` |

---

## C#-bol erkezo fejlesztoknek

| C# Feature | Enforce Script Equivalent |
|-------------|--------------------------|
| `interface` | Base class with empty methods |
| `abstract` | Base class + ErrorEx in base methods |
| `delegate` / `event` | `ScriptInvoker` |
| Lambda `=>` | Named methods |
| `?.` null conditional | Manual null checks |
| `??` null coalescing | `if (!x) x = default;` |
| `try/catch` | Guard clauses |
| `using` (IDisposable) | Manual cleanup |
| Properties `{ get; set; }` | Public fields or explicit getter/setter methods |
| LINQ | Manual loops |
| `nameof()` | Hardcoded strings |
| `async/await` | CallLater / timers |

---

## Java-bol erkezo fejlesztoknek

| Java Feature | Enforce Script Equivalent |
|-------------|--------------------------|
| `interface` | Base class with empty methods |
| `try/catch/finally` | Guard clauses |
| Garbage collection | `ref` + reference counting (no GC for cycles) |
| `@Override` | `override` keyword |
| `instanceof` | `obj.IsInherited(typename)` |
| `package` | Name prefixes |
| `import` | config.cpp `files[]` |
| `enum` with methods | `enum` (int-only) + helper class |
| `final` | `const` (for variables only) |
| Annotations | Not available |

---

## Python-bol erkezo fejlesztoknek

| Python Feature | Enforce Script Equivalent |
|-------------|--------------------------|
| Dynamic typing | Static typing (all variables typed) |
| `try/except` | Guard clauses |
| `lambda` | Named methods |
| List comprehension | Manual loops |
| `**kwargs` / `*args` | Fixed parameters |
| Duck typing | `IsInherited()` / `Class.CastTo()` |
| `__init__` | Constructor (same name as class) |
| `__del__` | Destructor (`~ClassName()`) |
| `import` | config.cpp `files[]` |
| Multiple inheritance | Single inheritance + composition |
| `None` | `null` / `NULL` |
| Indentation-based blocks | `{ }` braces |
| f-strings | `string.Format("text %1 %2", a, b)` |

---

## Gyors referencia Table

| Funkcio | Letezik? | Megkerulesi megoldas |
|---------|---------|------------|
| Ternary `? :` | No | if/else |
| `do...while` | No | while + break |
| `try/catch` | No | Guard clauses |
| Multiple inheritance | No | Composition |
| Operator overloading | Index only | Named methods |
| Lambdas | No | Named methods |
| Delegates | No | `ScriptInvoker` |
| `\\` / `\"` in strings | Broken | Avoid them |
| Variable redeclaration | Broken in else-if | Unique names or declare before if |
| `Object.IsAlive()` | Not on base Object | Cast to `EntityAI` first |
| `nullptr` | No | `null` / `NULL` |
| switch fall-through | No | Each case is independent |
| Default param expressions | No | Literals or NULL only |
| `#define` values | No | `const` |
| Interfaces | No | Empty base class |
| Generic constraints | No | Runtime type checks |
| Enum validation | No | Manual range check |
| Variadic params | No | `string.Format` or arrays |
| Nested classes | No | Top-level with prefixed names |
| Variable-size static arrays | No | `array<T>` |
| `#include` | No | config.cpp `files[]` |
| Namespaces | No | Name prefixes |
| RAII | No | Manual cleanup |
| `GetGame().GetPlayer()` server | Returns null | Iterate `GetPlayers()` |
| `sealed` osztaly oroklodes (1.28+) | Forditasi hiba | Hasznalj kompoziciot |
| 17+ metodus parameter (1.28+) | Forditasi hiba | Adj at osztalyt vagy tombot |
| `[Obsolete]` API-k (1.28+) | Fordito figyelmezetes | Migrald az uj API-ra |
| `int.MIN` osszehasonlitas | Helytelen eredmeny | Hasznalj tarolt konstanst |
| `!array[i]` negacio | Forditasi hiba | Hasznalj `array[i] == 0` format |
| Osszetett kif. tomb ertekadasban | Segfault | Hasznalj koztes valtozot |
| `foreach` metodus visszateresre | Null pointer osszeomals | Tarold lokalis valtozoba elobb |
| Bitmuveleti vs osszehasonlito precedencia | Hibas kiertekelees | Mindig hasznalj zarojelet |
| Ures `#ifdef` blokkok | Segfault | Adj hozza utasitast vagy torold a blokkot |
| `IsClient()` betoltes kozben | False-t ad | Hasznald az `IsDedicatedServer()` metodust |
| Forditasi hiba rossz fajl | Felrevezeto hely | Ellenorizd a jelzett utan kovetkezo fajlt |
| `crash_*.log` fajlok | Nem valos osszeomlasok | Futasideju script kiveteleket tartalmaznak |

---

## Navigacio

| Elozo | Fel | Kovetkezo |
|----------|----|------|
| [1.11 Hibakezelees](11-error-handling.md) | [Part 1: Enforce Script](../README.md) | [1.13 Fuggvenyek es metodusok](13-functions-methods.md) |
