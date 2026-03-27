# Chapter 1.12: What Does NOT Exist (Gotchas)

[Home](../README.md) | [<< Previous: Error Handling](11-error-handling.md) | **Gotchas** | [Next: Functions & Methods >>](13-functions-methods.md)

---

## 目次

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
- [C++ から来た方へ](#c-から来た方へ)
- [C# から来た方へ](#c-から来た方へ-1)
- [Java から来た方へ](#java-から来た方へ)
- [Python から来た方へ](#python-から来た方へ)
- [クイックリファレンス Table](#クイックリファレンス-table)
- [ナビゲーション](#ナビゲーション)

---

## 落とし穴の完全リファレンス

### 1. No Ternary Operator

**普通に書こうとするコード：**
```c
int x = (condition) ? valueA : valueB;
```

**何が起こるか：** Compile error. The `? :` operator does not exist.

**正しい解決策：**
```c
int x;
if (condition)
    x = valueA;
else
    x = valueB;
```

---

### 2. No do...while Loop

**普通に書こうとするコード：**
```c
do {
    Process();
} while (HasMore());
```

**何が起こるか：** Compile error. The `do` keyword does not exist.

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

**普通に書こうとするコード：**
```c
try {
    RiskyOperation();
} catch (Exception e) {
    HandleError(e);
}
```

**何が起こるか：** Compile error. These keywords do not exist.

**正しい解決策：** Guard clauses with early return.
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

See [Chapter 1.11 — Error Handling](11-error-handling.md) for full patterns.

---

### 4. No Multiple Inheritance

**普通に書こうとするコード：**
```c
class MyClass extends BaseA, BaseB  // Two base classes
```

**何が起こるか：** Compile error. Only single inheritance is supported.

**正しい解決策：** Inherit from one class, compose the other:
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

**普通に書こうとするコード：**
```c
Vector3 operator+(Vector3 a, Vector3 b) { ... }
bool operator==(MyClass other) { ... }
```

**何が起こるか：** Compile error. Custom operators cannot be defined.

**正しい解決策：** Use named methods:
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

**普通に書こうとするコード：**
```c
array.Sort((a, b) => a.name.CompareTo(b.name));
button.OnClick += () => { DoSomething(); };
```

**何が起こるか：** Compile error. Lambda syntax does not exist.

**正しい解決策：** Define named methods and pass them as `ScriptCaller` or use string-based callbacks:
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

**普通に書こうとするコード：**
```c
delegate void MyCallback(int value);
MyCallback cb = SomeFunction;
cb(42);
```

**何が起こるか：** Compile error. The `delegate` keyword does not exist.

**正しい解決策：** Use `ScriptCaller`, `ScriptInvoker`, or string-based method names:
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

**普通に書こうとするコード：**
```c
string path = "C:\\Users\\folder";
string quote = "He said \"hello\"";
```

**何が起こるか：** CParser crashes or produces garbled output. The `\\` and `\"` escape sequences break the string parser.

**正しい解決策：** Avoid backslash and quote characters in string literals entirely:
```c
// Use forward slashes for paths
string path = "C:/Users/folder";

// Use single quotes or rephrase to avoid embedded double quotes
string quote = "He said 'hello'";

// Use string concatenation if you absolutely need special chars
// (still risky — test thoroughly)
```

> **注意：** `\n`, `\r`, and `\t` escape sequences DO work. Only `\\` and `\"` are broken.

---

### 9. No Variable Redeclaration in else-if Blocks

**普通に書こうとするコード：**
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

**何が起こるか：** Compile error: "multiple declaration of variable 'msg'". Enforce Script treats variables in sibling `if`/`else if`/`else` blocks as sharing the same scope.

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

**普通に書こうとするコード：**
```c
string label = isAdmin ? "Admin" : "Player";
```

**正しい解決策：**
```c
string label;
if (isAdmin)
    label = "Admin";
else
    label = "Player";
```

---

### 11. No Multiline Function Calls

**普通に書こうとするコード：**
```c
GetGame().CreateObjectEx(
    "MyItem",
    pos,
    ECE_PLACE_ON_SURFACE
);
```

**何が起こるか：** パーサーが信頼性を失います。引数を複数行に分割すると、コンパイルエラーまたは予期しない動作を引き起こす可能性があります。

**正しい解決策：** 関数呼び出しを1行に記述してください。
```c
GetGame().CreateObjectEx("MyItem", pos, ECE_PLACE_ON_SURFACE);
```

行が長い場合は、引数を事前にローカル変数に格納してください。
```c
string className = "MyItem";
int flags = ECE_PLACE_ON_SURFACE;
GetGame().CreateObjectEx(className, pos, flags);
```

---

### 12. No nullptr — Use NULL or null

**普通に書こうとするコード：**
```c
if (obj == nullptr)
```

**何が起こるか：** Compile error. The `nullptr` keyword does not exist.

**正しい解決策：**
```c
if (obj == null)    // lowercase works
if (obj == NULL)    // uppercase also works
if (!obj)           // idiomatic null check (preferred)
```

---

### 13. switch/case DOES Fall Through

Enforce Script の switch/case は `break` を省略すると C/C++ と同様にフォールスルー **します**。バニラコードでもフォールスルーが意図的に使用されています（biossessionservice.c:182 に "Intentionally no break, fall through to connecting" というコメントがあります）。

**普通に書こうとするコード：**
```c
switch (value)
{
    case 1:
    case 2:
    case 3:
        Print("1, 2, or 3");  // 3つのケースすべてがここに到達 — フォールスルーが機能します
        break;
}
```

**これは期待通りに動作します。** ケース 1 と 2 はケース 3 のハンドラにフォールスルーします。

**落とし穴：** フォールスルーを意図して **いない** のに `break` を忘れること：
```c
switch (state)
{
    case 0:
        Print("Zero");
        // break を忘れた！ケース 1 にフォールスルーします
    case 1:
        Print("One");
        break;
}
// state == 0 の場合、"Zero" と "One" の両方が出力されます
```

**ルール：** 意図的にフォールスルーしたい場合を除き、すべてのケースの末尾に必ず `break` を使用してください。フォールスルーを意図する場合は、明確にするコメントを追加してください。

---

### 14. No Default Parameter Expressions

**普通に書こうとするコード：**
```c
void Spawn(vector pos = GetDefaultPos())    // Expression as default
void Spawn(vector pos = Vector(0, 100, 0))  // Constructor as default
```

**何が起こるか：** Compile error. Default parameter values must be **literals** or `NULL`.

**正しい解決策：**
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

**普通に書こうとするコード：**
```c
MyConfig cfg = JsonFileLoader<MyConfig>.JsonLoadFile(path);
// or:
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg))
```

**何が起こるか：** Compile error. `JsonLoadFile` returns `void`, not the loaded object or a bool.

**正しい解決策：**
```c
MyConfig cfg = new MyConfig();  // Create instance first with defaults
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // Populates cfg in-place
// cfg now contains loaded values (or still has defaults if file was invalid)
```

> **注意：** The newer `JsonFileLoader<T>.LoadFile()` method returns `bool`, but `JsonLoadFile` (the commonly seen version) does not.

---

### 16. No #define Value Substitution

**普通に書こうとするコード：**
```c
#define MAX_PLAYERS 60
#define VERSION_STRING "1.0.0"
int max = MAX_PLAYERS;
```

**何が起こるか：** Compile error. Enforce Script `#define` only creates existence flags for `#ifdef` checks. It does not support value substitution.

**正しい解決策：**
```c
// Use const for values
const int MAX_PLAYERS = 60;
const string VERSION_STRING = "1.0.0";

// Use #define only for conditional compilation flags
#define MY_MOD_ENABLED
```

---

### 17. No Interfaces / Abstract Classes (Enforced)

**普通に書こうとするコード：**
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

**何が起こるか：** The `interface` and `abstract` keywords do not exist.

**正しい解決策：** Use regular classes with empty base methods:
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

**普通に書こうとするコード：**
```c
class Container<T> where T : EntityAI  // Constrain T to EntityAI
```

**何が起こるか：** Compile error. The `where` clause does not exist. Template parameters accept any type.

**正しい解決策：** Validate at runtime:
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

**普通に書こうとするコード：**
```c
EDamageState state = (EDamageState)999;  // Expect error or exception
```

**何が起こるか：** No error. Any `int` value can be assigned to an enum variable, even values outside the defined range.

**正しい解決策：** Validate manually:
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

**普通に書こうとするコード：**
```c
void Log(string format, params object[] args)
void Printf(string fmt, ...)
```

**何が起こるか：** Compile error. Variadic parameters do not exist.

**正しい解決策：** Use `string.Format` with fixed parameter counts, or use `Param` classes:
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

**普通に書こうとするコード：**
```c
class Outer
{
    class Inner  // Nested class
    {
        int value;
    }
}
```

**何が起こるか：** Compile error. Classes cannot be declared inside other classes.

**正しい解決策：** Declare all classes at the top level, use naming conventions to show relationships:
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

**普通に書こうとするコード：**
```c
int size = GetCount();
int arr[size];  // Dynamic size at runtime
```

**何が起こるか：** Compile error. Static array sizes must be compile-time constants.

**正しい解決策：**
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

**何が起こるか：** `Remove(index)` swaps the element with the **last** element, then removes the last. Result: `{"A", "D", "C"}`. Order is NOT preserved.

**正しい解決策：**
```c
// Use RemoveOrdered for order preservation (slower — shifts elements)
items.RemoveOrdered(1);  // {"A", "C", "D"} — correct order

// Use RemoveItem to find and remove by value (also ordered)
items.RemoveItem("B");   // {"A", "C", "D"}
```

---

### 24. No #include — Everything via config.cpp

**普通に書こうとするコード：**
```c
#include "MyHelper.c"
#include "Utils/StringUtils.c"
```

**何が起こるか：** No effect or compile error. There is no `#include` directive.

**正しい解決策：** All script files are loaded through `config.cpp` in the mod's `CfgMods` entry. File loading order is determined by the script layer (`3_Game`, `4_World`, `5_Mission`) and alphabetical order within each layer.

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

**普通に書こうとするコード：**
```c
namespace MyMod { class Config { } }
namespace MyMod.Utils { class StringHelper { } }
```

**何が起こるか：** Compile error. The `namespace` keyword does not exist. All classes share a single global scope.

**正しい解決策：** Use naming prefixes to avoid conflicts:
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

**何が起こるか：** `ToUpper()` and `ToLower()` modify the string **in place** and return `void`.

**正しい解決策：**
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

**普通に書こうとするコード：**
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

**何が起こるか：** Neither object is ever garbage collected. The reference counts never reach zero because each holds a `ref` to the other.

**正しい解決策：** One side must use a raw (non-ref) pointer:
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

**何が起こるか：** Server shutdown may kill the process before destructors run. Your save never happens.

**正しい解決策：** Save proactively at regular intervals and on known lifecycle events:
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

**何が起こるか：** Enforce Script does not close file handles when variables go out of scope (even with `autoptr`).

**正しい解決策：** Always close resources explicitly:
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

**普通に書こうとするコード：**
```c
PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
player.DoSomething();  // CRASH on server!
```

**何が起こるか：** `GetGame().GetPlayer()` returns the **local** player. On a dedicated server, there is no local player — it returns `null`.

**正しい解決策：** On server, iterate the player list:
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

DayZ 1.28 以降、Enforce Script コンパイラは `sealed` キーワードを強制します。`sealed` でマークされたクラスまたはメソッドは、継承またはオーバーライドできません。sealed クラスを拡張しようとすると：

```c
// BI が SomeVanillaClass を sealed としてマークした場合:
class MyClass : SomeVanillaClass  // 1.28+ でコンパイルエラー
{
}
```

継承を試みる前に、バニラスクリプトダンプで `sealed` としてマークされたクラスを確認してください。sealed クラスの動作を変更する必要がある場合は、継承ではなくコンポジション（ラップする）を使用してください。

---

### 32. Method Parameter Limit: 16 Maximum (1.28+)

Enforce Script にはメソッドのパラメータ数が16個までという制限がありましたが、1.28 以前はサイレントなバッファオーバーフローによりランダムなクラッシュを引き起こしていました。1.28 以降、コンパイラが **ハードエラー** を生成します：

```c
// 1.28+ でコンパイルエラー — 16パラメータを超過
void MyMethod(int a, int b, int c, int d, int e, int f, int g, int h,
              int i, int j, int k, int l, int m, int n, int o, int p,
              int q)  // 17番目のパラメータ = エラー
{
}
```

**修正方法：** 個別のパラメータの代わりにクラスまたは配列を渡すようリファクタリングしてください。

---

### 33. `Obsolete` Attribute Warnings (1.28+)

DayZ 1.28 では `Obsolete` 属性が導入されました。`[Obsolete]` でマークされた関数やクラスはコンパイラ警告を生成します。これらの API はまだ動作しますが、将来のアップデートで削除が予定されています。ビルド出力で obsolete 警告を確認し、推奨される代替 API に移行してください。

---

### 34. `int.MIN` Comparison Bug

`int.MIN`（-2147483648）を含む比較は不正確な結果を生成します：

```c
int val = 1;
if (val < int.MIN)  // TRUE と評価される — false であるべき
{
    // このブロックが誤って実行されます
}
```

`int.MIN` との直接比較は避けてください。代わりに格納された定数を使用するか、特定の負の値と比較してください。

---

### 35. Array Element Boolean Negation Fails

配列要素の直接的なブール否定はコンパイルできません：

```c
array<int> list = {0, 1, 2};
if (!list[1])          // コンパイルできません
if (list[1] == 0)      // 動作します — 明示的な比較を使用
```

配列要素の真偽値をテストする際は、常に明示的な等値チェックを使用してください。

---

### 36. Complex Expression in Array Assignment Crashes

複雑な式を配列要素に直接代入すると、セグメンテーションフォルトが発生する可能性があります：

```c
// 実行時にクラッシュ
m_Values[index] = vector.DistanceSq(posA, posB) <= distSq;

// 安全 — 中間変数を使用
bool result = vector.DistanceSq(posA, posB) <= distSq;
m_Values[index] = result;
```

配列に代入する前に、常に複雑な式の結果をローカル変数に格納してください。

---

### 37. `foreach` on Method Return Value Crashes

メソッドの戻り値に対して `foreach` を直接使用すると、2回目のイテレーションでヌルポインタ例外が発生します：

```c
// 2番目のアイテムでクラッシュ
foreach (string item : GetMyArray())
{
}

// 安全 — まずローカル変数に格納
array<string> items = GetMyArray();
foreach (string item : items)
{
}
```

---

### 38. Bitwise vs Comparison Operator Precedence

ビット演算子は比較演算子よりも優先順位が **低く**、C/C++ のルールに従います：

```c
int flags = 5;
int mask = 4;
if (flags & mask == mask)      // 間違い: flags & (mask == mask) と評価される
if ((flags & mask) == mask)    // 正しい: 常に括弧を使用
```

---

### 39. Empty `#ifdef` / `#ifndef` Blocks Crash

空のプリプロセッサ条件ブロック --- コメントのみを含むものでも --- セグメンテーションフォルトを引き起こします：

```c
#ifdef SOME_DEFINE
    // コメントのみのこのブロックはセグフォルトを引き起こします
#endif
```

常に少なくとも1つの実行可能な文を含めるか、ブロックを完全に削除してください。

---

### 40. `GetGame().IsClient()` Returns False During Load

クライアントのロードフェーズ中、`GetGame().IsClient()` は **false** を返し、`GetGame().IsServer()` は **true** を返します --- クライアント上でもです。代わりに `IsDedicatedServer()` を使用してください：

```c
// ロードフェーズ中は信頼できません
if (GetGame().IsClient()) { }   // ロード中は false!
if (GetGame().IsServer()) { }   // クライアント上でもロード中は true!

// 信頼できます
if (!GetGame().IsDedicatedServer()) { /* クライアントコード */ }
if (GetGame().IsDedicatedServer())  { /* サーバーコード */ }
```

**例外：** オフライン/シングルプレイヤーモードをサポートする必要がある場合、`IsDedicatedServer()` はリッスンサーバーでも false を返します。

---

### 41. Compile Error Messages Report Wrong File

コンパイラが未定義のクラスや変数の名前衝突に遭遇した場合、エラーは実際のエラー位置ではなく、**最後に正常にパースされたファイルの EOF** で報告されます。変更していないファイルを指すエラーが表示された場合、実際のエラーはそのファイルの直後にパースされたファイルにあります。

---

### 42. `crash_*.log` Files Are Not Crashes

`crash_<date>_<time>.log` という名前のログファイルには、実際のセグメンテーションフォルトではなく **ランタイム例外** が含まれています。命名は誤解を招きます --- これらはスクリプトエラーであり、エンジンのクラッシュではありません。

---

## C++ から来た方へ

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

## C# から来た方へ

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

## Java から来た方へ

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

## Python から来た方へ

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

## クイックリファレンス Table

| 機能 | 存在？ | 回避策 |
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
| Multiline function calls | Unreliable parsing | Keep calls on one line |
| `nullptr` | No | `null` / `NULL` |
| switch fall-through | Yes (like C/C++) | Always use `break` unless intentional |
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
| `sealed` class inheritance (1.28+) | Compile error | Use composition instead |
| 17+ method parameters (1.28+) | Compile error | Pass a class or array |
| `[Obsolete]` APIs (1.28+) | Compiler warning | Migrate to replacement API |
| `int.MIN` comparisons | Incorrect results | Use a stored constant |
| `!array[i]` negation | Compile error | Use `array[i] == 0` |
| Complex expr in array assign | Segfault | Use intermediate variable |
| `foreach` on method return | Null pointer crash | Store in local variable first |
| Bitwise vs comparison precedence | Wrong evaluation | Always use parentheses |
| Empty `#ifdef` blocks | Segfault | Include a statement or remove block |
| `IsClient()` during load | Returns false | Use `IsDedicatedServer()` |
| Compile error wrong file | Misleading location | Check file parsed after reported one |
| `crash_*.log` files | Not actual crashes | They are runtime script exceptions |

---

## ナビゲーション

| 前 | 上 | 次 |
|----------|----|------|
| [1.11 Error Handling](11-error-handling.md) | [Part 1: Enforce Script](../README.md) | [1.13 Functions & Methods](13-functions-methods.md) |
