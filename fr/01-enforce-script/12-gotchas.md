# Chapter 1.12: What Does NOT Exist (Gotchas)

[Home](../README.md) | [<< Previous: Error Handling](11-error-handling.md) | **Gotchas** | [Next: Functions & Methods >>](13-functions-methods.md)

---

## Table des matieres

- [Reference complete des pieges](#reference-complete-des-pieges)
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
  11. [No Multiline Function Calls](#11-no-multiline-function-calls)
  12. [No nullptr — Use NULL or null](#12-no-nullptr--use-null-or-null)
  13. [switch/case DOES Fall Through](#13-switchcase-does-fall-through)
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
  31. [`sealed` Classes Cannot Be Extended (1.28+)](#31-sealed-classes-cannot-be-extended-128)
  32. [Method Parameter Limit: 16 Maximum (1.28+)](#32-method-parameter-limit-16-maximum-128)
  33. [`Obsolete` Attribute Warnings (1.28+)](#33-obsolete-attribute-warnings-128)
  34. [`int.MIN` Comparison Bug](#34-intmin-comparison-bug)
  35. [Array Element Boolean Negation Fails](#35-array-element-boolean-negation-fails)
  36. [Complex Expression in Array Assignment Crashes](#36-complex-expression-in-array-assignment-crashes)
  37. [`foreach` on Method Return Value Crashes](#37-foreach-on-method-return-value-crashes)
  38. [Bitwise vs Comparison Operator Precedence](#38-bitwise-vs-comparison-operator-precedence)
  39. [Empty `#ifdef` / `#ifndef` Blocks Crash](#39-empty-ifdef--ifndef-blocks-crash)
  40. [`GetGame().IsClient()` Returns False During Load](#40-getgameisclient-returns-false-during-load)
  41. [Compile Error Messages Report Wrong File](#41-compile-error-messages-report-wrong-file)
  42. [`crash_*.log` Files Are Not Crashes](#42-crashlog-files-are-not-crashes)
- [Venant de C++](#venant-de-c)
- [Venant de C#](#venant-de-c-1)
- [Venant de Java](#venant-de-java)
- [Venant de Python](#venant-de-python)
- [Tableau de reference rapide](#tableau-de-reference-rapide)
- [Navigation](#navigation)

---

## Reference complete des pieges

### 1. No Ternary Operator

**Ce que vous ecririez :**
```c
int x = (condition) ? valueA : valueB;
```

**Ce qui se passe :** Compile error. The `? :` operator does not exist.

**Solution correcte :**
```c
int x;
if (condition)
    x = valueA;
else
    x = valueB;
```

---

### 2. No do...while Loop

**Ce que vous ecririez :**
```c
do {
    Process();
} while (HasMore());
```

**Ce qui se passe :** Compile error. The `do` keyword does not exist.

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

**Ce que vous ecririez :**
```c
try {
    RiskyOperation();
} catch (Exception e) {
    HandleError(e);
}
```

**Ce qui se passe :** Compile error. These keywords do not exist.

**Solution correcte :** Guard clauses with early return.
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

Voir [Chapitre 1.11 — Gestion des erreurs](11-error-handling.md) pour les patterns complets.

---

### 4. No Multiple Inheritance

**Ce que vous ecririez :**
```c
class MyClass extends BaseA, BaseB  // Two base classes
```

**Ce qui se passe :** Compile error. Only single inheritance is supported.

**Solution correcte :** Inherit from one class, compose the other:
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

**Ce que vous ecririez :**
```c
Vector3 operator+(Vector3 a, Vector3 b) { ... }
bool operator==(MyClass other) { ... }
```

**Ce qui se passe :** Compile error. Custom operators cannot be defined.

**Solution correcte :** Use named methods:
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

**Ce que vous ecririez :**
```c
array.Sort((a, b) => a.name.CompareTo(b.name));
button.OnClick += () => { DoSomething(); };
```

**Ce qui se passe :** Compile error. Lambda syntax does not exist.

**Solution correcte :** Define named methods and pass them as `ScriptCaller` or use string-based callbacks:
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

**Ce que vous ecririez :**
```c
delegate void MyCallback(int value);
MyCallback cb = SomeFunction;
cb(42);
```

**Ce qui se passe :** Compile error. The `delegate` keyword does not exist.

**Solution correcte :** Use `ScriptCaller`, `ScriptInvoker`, or string-based method names:
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

**Ce que vous ecririez :**
```c
string path = "C:\\Users\\folder";
string quote = "He said \"hello\"";
```

**Ce qui se passe :** CParser crashes or produces garbled output. The `\\` and `\"` escape sequences break the string parser.

**Solution correcte :** Avoid backslash and quote characters in string literals entirely:
```c
// Use forward slashes for paths
string path = "C:/Users/folder";

// Use single quotes or rephrase to avoid embedded double quotes
string quote = "He said 'hello'";

// Use string concatenation if you absolutely need special chars
// (still risky — test thoroughly)
```

> **Remarque :** `\n`, `\r`, and `\t` escape sequences DO work. Only `\\` and `\"` are broken.

---

### 9. No Variable Redeclaration in else-if Blocks

**Ce que vous ecririez :**
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

**Ce qui se passe :** Compile error: "multiple declaration of variable 'msg'". Enforce Script treats variables in sibling `if`/`else if`/`else` blocks as sharing the same scope.

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

**Ce que vous ecririez :**
```c
string label = isAdmin ? "Admin" : "Player";
```

**Solution correcte :**
```c
string label;
if (isAdmin)
    label = "Admin";
else
    label = "Player";
```

---

### 11. No Multiline Function Calls

**Ce que vous ecririez :**
```c
string msg = string.Format(
    "Player %1 at %2",
    name,
    pos
);
```

**Ce qui se passe :** Erreur de compilation. Le parseur d'Enforce Script ne gere pas de maniere fiable les appels de fonction repartis sur plusieurs lignes.

**Solution correcte :**
```c
string msg = string.Format("Player %1 at %2", name, pos);
```

Gardez les appels de fonction sur une seule ligne. Si la ligne est trop longue, decoupez le travail en variables intermediaires.

---

### 12. No nullptr — Use NULL or null

**Ce que vous ecririez :**
```c
if (obj == nullptr)
```

**Ce qui se passe :** Compile error. The `nullptr` keyword does not exist.

**Solution correcte :**
```c
if (obj == null)    // lowercase works
if (obj == NULL)    // uppercase also works
if (!obj)           // idiomatic null check (preferred)
```

---

### 13. switch/case DOES Fall Through

Le switch/case d'Enforce Script **effectue** le fall-through quand `break` est omis, comme en C/C++. Le code vanilla utilise intentionnellement le fall-through (biossessionservice.c:182 contient le commentaire "Intentionally no break, fall through to connecting").

**Ce que vous ecririez :**
```c
switch (value)
{
    case 1:
    case 2:
    case 3:
        Print("1, 2, or 3");  // Les trois cases atteignent ceci — le fall-through fonctionne
        break;
}
```

**Cela fonctionne comme prevu.** Les cases 1 et 2 tombent dans le handler du case 3.

**Le piege :** Oublier `break` quand vous ne voulez PAS de fall-through :
```c
switch (state)
{
    case 0:
        Print("Zero");
        // break manquant ! Tombe dans le case 1
    case 1:
        Print("One");
        break;
}
// Si state == 0, affiche "Zero" ET "One"
```

**Regle :** Utilisez toujours `break` a la fin de chaque case, sauf si vous voulez intentionnellement un fall-through. Quand vous voulez un fall-through, ajoutez un commentaire pour le rendre clair.

---

### 14. No Default Parameter Expressions

**Ce que vous ecririez :**
```c
void Spawn(vector pos = GetDefaultPos())    // Expression as default
void Spawn(vector pos = Vector(0, 100, 0))  // Constructor as default
```

**Ce qui se passe :** Compile error. Default parameter values must be **literals** or `NULL`.

**Solution correcte :**
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

**Ce que vous ecririez :**
```c
MyConfig cfg = JsonFileLoader<MyConfig>.JsonLoadFile(path);
// or:
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg))
```

**Ce qui se passe :** Compile error. `JsonLoadFile` returns `void`, not the loaded object or a bool.

**Solution correcte :**
```c
MyConfig cfg = new MyConfig();  // Create instance first with defaults
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // Populates cfg in-place
// cfg now contains loaded values (or still has defaults if file was invalid)
```

> **Remarque :** The newer `JsonFileLoader<T>.LoadFile()` method returns `bool`, but `JsonLoadFile` (the commonly seen version) does not.

---

### 16. No #define Value Substitution

**Ce que vous ecririez :**
```c
#define MAX_PLAYERS 60
#define VERSION_STRING "1.0.0"
int max = MAX_PLAYERS;
```

**Ce qui se passe :** Compile error. Enforce Script `#define` only creates existence flags for `#ifdef` checks. It does not support value substitution.

**Solution correcte :**
```c
// Use const for values
const int MAX_PLAYERS = 60;
const string VERSION_STRING = "1.0.0";

// Use #define only for conditional compilation flags
#define MY_MOD_ENABLED
```

---

### 17. No Interfaces / Abstract Classes (Enforced)

**Ce que vous ecririez :**
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

**Ce qui se passe :** The `interface` and `abstract` keywords do not exist.

**Solution correcte :** Use regular classes with empty base methods:
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

**Ce que vous ecririez :**
```c
class Container<T> where T : EntityAI  // Constrain T to EntityAI
```

**Ce qui se passe :** Compile error. The `where` clause does not exist. Template parameters accept any type.

**Solution correcte :** Validate at runtime:
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

**Ce que vous ecririez :**
```c
EDamageState state = (EDamageState)999;  // Expect error or exception
```

**Ce qui se passe :** No error. Any `int` value can be assigned to an enum variable, even values outside the defined range.

**Solution correcte :** Validate manually:
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

**Ce que vous ecririez :**
```c
void Log(string format, params object[] args)
void Printf(string fmt, ...)
```

**Ce qui se passe :** Compile error. Variadic parameters do not exist.

**Solution correcte :** Use `string.Format` with fixed parameter counts, or use `Param` classes:
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

**Ce que vous ecririez :**
```c
class Outer
{
    class Inner  // Nested class
    {
        int value;
    }
}
```

**Ce qui se passe :** Compile error. Classes cannot be declared inside other classes.

**Solution correcte :** Declare all classes at the top level, use naming conventions to show relationships:
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

**Ce que vous ecririez :**
```c
int size = GetCount();
int arr[size];  // Dynamic size at runtime
```

**Ce qui se passe :** Compile error. Static array sizes must be compile-time constants.

**Solution correcte :**
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

**Ce qui se passe :** `Remove(index)` swaps the element with the **last** element, then removes the last. Result: `{"A", "D", "C"}`. Order is NOT preserved.

**Solution correcte :**
```c
// Use RemoveOrdered for order preservation (slower — shifts elements)
items.RemoveOrdered(1);  // {"A", "C", "D"} — correct order

// Use RemoveItem to find and remove by value (also ordered)
items.RemoveItem("B");   // {"A", "C", "D"}
```

---

### 24. No #include — Everything via config.cpp

**Ce que vous ecririez :**
```c
#include "MyHelper.c"
#include "Utils/StringUtils.c"
```

**Ce qui se passe :** No effect or compile error. There is no `#include` directive.

**Solution correcte :** All script files are loaded through `config.cpp` in the mod's `CfgMods` entry. File loading order is determined by the script layer (`3_Game`, `4_World`, `5_Mission`) and alphabetical order within each layer.

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

**Ce que vous ecririez :**
```c
namespace MyMod { class Config { } }
namespace MyMod.Utils { class StringHelper { } }
```

**Ce qui se passe :** Compile error. The `namespace` keyword does not exist. All classes share a single global scope.

**Solution correcte :** Use naming prefixes to avoid conflicts:
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

**Ce qui se passe :** `ToUpper()` et `ToLower()` modifient la chaine **sur place** et retournent `int` (la longueur de la chaine modifiee), pas une nouvelle chaine. Depuis enstring.c : `proto int ToLower();` et `proto int ToUpper();`.

**Solution correcte :**
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

**Ce que vous ecririez :**
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

**Ce qui se passe :** Neither object is ever garbage collected. The reference counts never reach zero because each holds a `ref` to the other.

**Solution correcte :** One side must use a raw (non-ref) pointer:
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

**Ce qui se passe :** Server shutdown may kill the process before destructors run. Your save never happens.

**Solution correcte :** Save proactively at regular intervals and on known lifecycle events:
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

**Ce qui se passe :** Enforce Script does not close file handles when variables go out of scope (even with `autoptr`).

**Solution correcte :** Always close resources explicitly:
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

**Ce que vous ecririez :**
```c
PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
player.DoSomething();  // CRASH on server!
```

**Ce qui se passe :** `GetGame().GetPlayer()` returns the **local** player. On a dedicated server, there is no local player — it returns `null`.

**Solution correcte :** On server, iterate the player list:
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

### 31. `sealed` Classes Cannot Be Extended (1.28+)

A partir de DayZ 1.28, le compilateur Enforce Script applique le mot-cle `sealed`. Une classe ou methode marquee `sealed` ne peut pas etre heritee ou redefinie. Si vous tentez d'etendre une classe sealed :

```c
// Si BI marque SomeVanillaClass comme sealed :
class MyClass : SomeVanillaClass  // ERREUR DE COMPILATION en 1.28+
{
}
```

Verifiez le dump des scripts vanilla pour toute classe marquee `sealed` avant de tenter d'en heriter. Si vous devez modifier le comportement d'une classe sealed, utilisez la composition (encapsulez-la) plutot que l'heritage.

---

### 32. Method Parameter Limit: 16 Maximum (1.28+)

Enforce Script a toujours eu une limite de 16 parametres sur les methodes, mais avant 1.28 c'etait un debordement de tampon silencieux causant des crashs aleatoires. A partir de 1.28, le compilateur produit une **erreur fatale** :

```c
// ERREUR DE COMPILATION en 1.28+ — depasse 16 parametres
void MyMethod(int a, int b, int c, int d, int e, int f, int g, int h,
              int i, int j, int k, int l, int m, int n, int o, int p,
              int q)  // 17eme parametre = erreur
{
}
```

**Correction :** Refactorisez pour passer une classe ou un tableau au lieu de parametres individuels.

---

### 33. `Obsolete` Attribute Warnings (1.28+)

DayZ 1.28 a introduit l'attribut `Obsolete`. Les fonctions et classes marquees `[Obsolete]` generent des avertissements du compilateur. Ces API fonctionnent encore mais sont planifiees pour etre supprimees dans une future mise a jour. Verifiez la sortie de votre build pour les avertissements d'obsolescence et migrez vers le remplacement recommande.

---

### 34. `int.MIN` Comparison Bug

Les comparaisons impliquant `int.MIN` (-2147483648) produisent des resultats incorrects :

```c
int val = 1;
if (val < int.MIN)  // S'evalue a TRUE — devrait etre false
{
    // Ce bloc s'execute incorrectement
}
```

Evitez les comparaisons directes avec `int.MIN`. Utilisez une constante stockee a la place ou comparez avec une valeur negative specifique.

---

### 35. Array Element Boolean Negation Fails

La negation booleenne directe d'elements de tableau ne compile pas :

```c
array<int> list = {0, 1, 2};
if (!list[1])          // NE COMPILE PAS
if (list[1] == 0)      // Fonctionne — utilisez une comparaison explicite
```

Utilisez toujours des verifications d'egalite explicites pour tester les elements de tableau.

---

### 36. Complex Expression in Array Assignment Crashes

Assigner une expression complexe directement a un element de tableau peut causer une erreur de segmentation :

```c
// CRASH a l'execution
m_Values[index] = vector.DistanceSq(posA, posB) <= distSq;

// SUR — utilisez une variable intermediaire
bool result = vector.DistanceSq(posA, posB) <= distSq;
m_Values[index] = result;
```

Stockez toujours les resultats d'expressions complexes dans une variable locale avant de les assigner a un tableau.

---

### 37. `foreach` on Method Return Value Crashes

Utiliser `foreach` directement sur la valeur de retour d'une methode cause une exception de pointeur null a la deuxieme iteration :

```c
// CRASH au 2eme element
foreach (string item : GetMyArray())
{
}

// SUR — stockez d'abord dans une variable locale
array<string> items = GetMyArray();
foreach (string item : items)
{
}
```

---

### 38. Bitwise vs Comparison Operator Precedence

Les operateurs bit a bit ont une priorite **plus basse** que les operateurs de comparaison, suivant les regles C/C++ :

```c
int flags = 5;
int mask = 4;
if (flags & mask == mask)      // FAUX : evalue comme flags & (mask == mask)
if ((flags & mask) == mask)    // CORRECT : utilisez toujours les parentheses
```

---

### 39. Empty `#ifdef` / `#ifndef` Blocks Crash

Les blocs conditionnels de preprocesseur vides — meme ceux contenant uniquement des commentaires — causent des erreurs de segmentation :

```c
#ifdef SOME_DEFINE
    // Ce bloc avec seulement un commentaire cause un SEGFAULT
#endif
```

Incluez toujours au moins une instruction executable ou supprimez le bloc entierement.

---

### 40. `GetGame().IsClient()` Returns False During Load

Pendant la phase de chargement du client, `GetGame().IsClient()` retourne **false** et `GetGame().IsServer()` retourne **true** — meme sur les clients. Utilisez `IsDedicatedServer()` a la place :

```c
// PEU FIABLE pendant la phase de chargement
if (GetGame().IsClient()) { }   // false pendant le chargement !
if (GetGame().IsServer()) { }   // true pendant le chargement, meme sur le client !

// FIABLE
if (!GetGame().IsDedicatedServer()) { /* code client */ }
if (GetGame().IsDedicatedServer())  { /* code serveur */ }
```

**Exception :** Si vous devez supporter le mode hors ligne/solo, `IsDedicatedServer()` retourne false pour les serveurs listen aussi.

---

### 41. Compile Error Messages Report Wrong File

Quand le compilateur rencontre une classe indefinie ou un conflit de nommage de variable, il signale l'erreur a la **fin du dernier fichier parse avec succes** — pas a l'emplacement reel de l'erreur. Si vous voyez une erreur pointant vers un fichier que vous n'avez pas modifie, l'erreur reelle est dans un fichier qui etait en cours de parsing juste apres.

---

### 42. `crash_*.log` Files Are Not Crashes

Les fichiers de log nommes `crash_<date>_<time>.log` contiennent des **exceptions d'execution**, pas de veritables erreurs de segmentation. Le nommage est trompeur — ce sont des erreurs de script, pas des crashs du moteur.

---

## Venant de C++

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

## Venant de C#

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

## Venant de Java

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

## Venant de Python

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

## Tableau de reference rapide

| Fonctionnalite | Existe ? | Solution |
|----------------|----------|----------|
| Ternaire `? :` | Non | if/else |
| `do...while` | Non | while + break |
| `try/catch` | Non | Clauses de garde |
| Heritage multiple | Non | Composition |
| Surcharge d'operateurs | Index seulement | Methodes nommees |
| Lambdas | Non | Methodes nommees |
| Delegates | Non | `ScriptInvoker` |
| `\\` / `\"` dans les chaines | Casse | Les eviter |
| Redeclaration de variable | Casse dans else-if | Noms uniques ou declarer avant le if |
| Appels de fonction multiligne | Parsing non fiable | Garder les appels sur une ligne |
| `nullptr` | Non | `null` / `NULL` |
| Fall-through du switch | Oui (comme C/C++) | Toujours utiliser `break` sauf intentionnel |
| Expressions par defaut des params | Non | Litteraux ou NULL uniquement |
| Valeurs `#define` | Non | `const` |
| Interfaces | Non | Classe de base vide |
| Contraintes de generiques | Non | Verifications de type a l'execution |
| Validation des enums | Non | Verification manuelle de plage |
| Params variadiques | Non | `string.Format` ou tableaux |
| Classes imbriquees | Non | Niveau superieur avec noms prefixes |
| Tableaux statiques de taille variable | Non | `array<T>` |
| `#include` | Non | config.cpp `files[]` |
| Namespaces | Non | Prefixes de noms |
| RAII | Non | Nettoyage manuel |
| `GetGame().GetPlayer()` serveur | Retourne null | Iterer `GetPlayers()` |
| Heritage de classe `sealed` (1.28+) | Erreur de compilation | Utiliser la composition |
| 17+ parametres de methode (1.28+) | Erreur de compilation | Passer une classe ou un tableau |
| API `[Obsolete]` (1.28+) | Avertissement du compilateur | Migrer vers l'API de remplacement |
| Comparaisons `int.MIN` | Resultats incorrects | Utiliser une constante stockee |
| Negation `!array[i]` | Erreur de compilation | Utiliser `array[i] == 0` |
| Expression complexe dans assign. tableau | Segfault | Utiliser une variable intermediaire |
| `foreach` sur retour de methode | Crash pointeur null | Stocker d'abord dans une variable locale |
| Priorite bit a bit vs comparaison | Evaluation incorrecte | Toujours utiliser les parentheses |
| Blocs `#ifdef` vides | Segfault | Inclure une instruction ou supprimer le bloc |
| `IsClient()` pendant le chargement | Retourne false | Utiliser `IsDedicatedServer()` |
| Erreur compil. mauvais fichier | Emplacement trompeur | Verifier le fichier parse apres celui signale |
| Fichiers `crash_*.log` | Pas de vrais crashs | Ce sont des exceptions script d'execution |

---

## Navigation

| Previous | Up | Next |
|----------|----|------|
| [1.11 Gestion des erreurs](11-error-handling.md) | [Part 1: Enforce Script](../README.md) | [Part 2: Mod Structure](../02-mod-structure/01-five-layers.md) |
