# Chapter 1.12: What Does NOT Exist (Gotchas)

[Home](../README.md) | [<< Previous: Error Handling](11-error-handling.md) | **Gotchas** | [Next: Functions & Methods >>](13-functions-methods.md)

---

## 目录

- [完整陷阱参考](#完整陷阱参考)
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
- [从 C++ 转来](#从-c-转来)
- [从 C# 转来](#从-c-转来-1)
- [从 Java 转来](#从-java-转来)
- [从 Python 转来](#从-python-转来)
- [快速参考表](#快速参考表)
- [导航](#导航)

---

## 完整陷阱参考

### 1. No Ternary Operator

**你会写：**
```c
int x = (condition) ? valueA : valueB;
```

**实际结果：** Compile error. The `? :` operator does not exist.

**正确方案：**
```c
int x;
if (condition)
    x = valueA;
else
    x = valueB;
```

---

### 2. No do...while Loop

**你会写：**
```c
do {
    Process();
} while (HasMore());
```

**实际结果：** Compile error. The `do` keyword does not exist.

**正确方案 — flag pattern:**
```c
bool first = true;
while (first || HasMore())
{
    first = false;
    Process();
}
```

**正确方案 — break pattern:**
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

**你会写：**
```c
try {
    RiskyOperation();
} catch (Exception e) {
    HandleError(e);
}
```

**实际结果：** Compile error. These keywords do not exist.

**正确方案：** Guard clauses with early return.
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

**你会写：**
```c
class MyClass extends BaseA, BaseB  // Two base classes
```

**实际结果：** Compile error. Only single inheritance is supported.

**正确方案：** Inherit from one class, compose the other:
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

**你会写：**
```c
Vector3 operator+(Vector3 a, Vector3 b) { ... }
bool operator==(MyClass other) { ... }
```

**实际结果：** Compile error. Custom operators cannot be defined.

**正确方案：** Use named methods:
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

**例外：** The index operator `[]` can be overloaded via `Get(index)` and `Set(index, value)` methods:
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

**你会写：**
```c
array.Sort((a, b) => a.name.CompareTo(b.name));
button.OnClick += () => { DoSomething(); };
```

**实际结果：** Compile error. Lambda syntax does not exist.

**正确方案：** Define named methods and pass them as `ScriptCaller` or use string-based callbacks:
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

**你会写：**
```c
delegate void MyCallback(int value);
MyCallback cb = SomeFunction;
cb(42);
```

**实际结果：** Compile error. The `delegate` keyword does not exist.

**正确方案：** Use `ScriptCaller`, `ScriptInvoker`, or string-based method names:
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

**你会写：**
```c
string path = "C:\\Users\\folder";
string quote = "He said \"hello\"";
```

**实际结果：** CParser crashes or produces garbled output. The `\\` and `\"` escape sequences break the string parser.

**正确方案：** Avoid backslash and quote characters in string literals entirely:
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

**你会写：**
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

**实际结果：** Compile error: "multiple declaration of variable 'msg'". Enforce Script treats variables in sibling `if`/`else if`/`else` blocks as sharing the same scope.

**正确方案 — unique names:**
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

**正确方案 — declare before the if:**
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

**你会写：**
```c
string label = isAdmin ? "Admin" : "Player";
```

**正确方案：**
```c
string label;
if (isAdmin)
    label = "Admin";
else
    label = "Player";
```

---

### 11. No Multiline Function Calls

**你会写：**
```c
string msg = string.Format(
    "Player %1 at %2",
    name,
    pos
);
```

**实际结果：** 编译错误。Enforce Script 的解析器无法可靠地处理跨多行拆分的函数调用。

**正确方案：**
```c
string msg = string.Format("Player %1 at %2", name, pos);
```

保持函数调用在单行上。如果行太长，将工作拆分为中间变量。

---

### 12. No nullptr — Use NULL or null

**你会写：**
```c
if (obj == nullptr)
```

**实际结果：** Compile error. The `nullptr` keyword does not exist.

**正确方案：**
```c
if (obj == null)    // lowercase works
if (obj == NULL)    // uppercase also works
if (!obj)           // idiomatic null check (preferred)
```

---

### 13. switch/case 确实会贯穿

Enforce Script 的 switch/case 在省略 `break` 时**确实会**贯穿（fall through），与 C/C++ 相同。原版代码有意使用贯穿（biossessionservice.c:182 有注释 "Intentionally no break, fall through to connecting"）。

**你会写：**
```c
switch (value)
{
    case 1:
    case 2:
    case 3:
        Print("1, 2, or 3");  // 所有三个 case 都会到达此处——贯穿有效
        break;
}
```

**这按预期工作。** case 1 和 2 贯穿到 case 3 的处理程序。

**陷阱：** 在不想贯穿时忘记 `break`：
```c
switch (state)
{
    case 0:
        Print("Zero");
        // 缺少 break！贯穿到 case 1
    case 1:
        Print("One");
        break;
}
// 如果 state == 0，会同时打印 "Zero" 和 "One"
```

**规则：** 始终在每个 case 末尾使用 `break`，除非你有意需要贯穿。当你确实需要贯穿时，添加注释以明确说明。

---

### 14. No Default Parameter Expressions

**你会写：**
```c
void Spawn(vector pos = GetDefaultPos())    // Expression as default
void Spawn(vector pos = Vector(0, 100, 0))  // Constructor as default
```

**实际结果：** Compile error. Default parameter values must be **literals** or `NULL`.

**正确方案：**
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

**你会写：**
```c
MyConfig cfg = JsonFileLoader<MyConfig>.JsonLoadFile(path);
// or:
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg))
```

**实际结果：** Compile error. `JsonLoadFile` returns `void`, not the loaded object or a bool.

**正确方案：**
```c
MyConfig cfg = new MyConfig();  // Create instance first with defaults
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // Populates cfg in-place
// cfg now contains loaded values (or still has defaults if file was invalid)
```

> **注意：** The newer `JsonFileLoader<T>.LoadFile()` method returns `bool`, but `JsonLoadFile` (the commonly seen version) does not.

---

### 16. No #define Value Substitution

**你会写：**
```c
#define MAX_PLAYERS 60
#define VERSION_STRING "1.0.0"
int max = MAX_PLAYERS;
```

**实际结果：** Compile error. Enforce Script `#define` only creates existence flags for `#ifdef` checks. It does not support value substitution.

**正确方案：**
```c
// Use const for values
const int MAX_PLAYERS = 60;
const string VERSION_STRING = "1.0.0";

// Use #define only for conditional compilation flags
#define MY_MOD_ENABLED
```

---

### 17. No Interfaces / Abstract Classes (Enforced)

**你会写：**
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

**实际结果：** The `interface` and `abstract` keywords do not exist.

**正确方案：** Use regular classes with empty base methods:
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

**你会写：**
```c
class Container<T> where T : EntityAI  // Constrain T to EntityAI
```

**实际结果：** Compile error. The `where` clause does not exist. Template parameters accept any type.

**正确方案：** Validate at runtime:
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

**你会写：**
```c
EDamageState state = (EDamageState)999;  // Expect error or exception
```

**实际结果：** No error. Any `int` value can be assigned to an enum variable, even values outside the defined range.

**正确方案：** Validate manually:
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

**你会写：**
```c
void Log(string format, params object[] args)
void Printf(string fmt, ...)
```

**实际结果：** Compile error. Variadic parameters do not exist.

**正确方案：** Use `string.Format` with fixed parameter counts, or use `Param` classes:
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

**你会写：**
```c
class Outer
{
    class Inner  // Nested class
    {
        int value;
    }
}
```

**实际结果：** Compile error. Classes cannot be declared inside other classes.

**正确方案：** Declare all classes at the top level, use naming conventions to show relationships:
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

**你会写：**
```c
int size = GetCount();
int arr[size];  // Dynamic size at runtime
```

**实际结果：** Compile error. Static array sizes must be compile-time constants.

**正确方案：**
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

**你会写 (expecting order preservation):**
```c
array<string> items = {"A", "B", "C", "D"};
items.Remove(1);  // Expect: {"A", "C", "D"}
```

**实际结果：** `Remove(index)` swaps the element with the **last** element, then removes the last. Result: `{"A", "D", "C"}`. Order is NOT preserved.

**正确方案：**
```c
// Use RemoveOrdered for order preservation (slower — shifts elements)
items.RemoveOrdered(1);  // {"A", "C", "D"} — correct order

// Use RemoveItem to find and remove by value (also ordered)
items.RemoveItem("B");   // {"A", "C", "D"}
```

---

### 24. No #include — Everything via config.cpp

**你会写：**
```c
#include "MyHelper.c"
#include "Utils/StringUtils.c"
```

**实际结果：** No effect or compile error. There is no `#include` directive.

**正确方案：** All script files are loaded through `config.cpp` in the mod's `CfgMods` entry. File loading order is determined by the script layer (`3_Game`, `4_World`, `5_Mission`) and alphabetical order within each layer.

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

**你会写：**
```c
namespace MyMod { class Config { } }
namespace MyMod.Utils { class StringHelper { } }
```

**实际结果：** Compile error. The `namespace` keyword does not exist. All classes share a single global scope.

**正确方案：** Use naming prefixes to avoid conflicts:
```c
class MyConfig { }          // MyFramework
class MyAI_Config { }       // MyAI Mod
class MyM_MissionData { }   // MyMissions Mod
class VPP_AdminConfig { }     // VPP Admin
```

---

### 26. String Methods Modify In-Place

**你会写 (expecting a return value):**
```c
string upper = myString.ToUpper();  // Expect: returns new string
```

**实际结果：** `To上级per()` and `ToLower()` modify the string **in place** and return `void`.

**正确方案：**
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

**你会写：**
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

**实际结果：** Neither object is ever garbage collected. The reference counts never reach zero because each holds a `ref` to the other.

**正确方案：** One side must use a raw (non-ref) pointer:
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

**你会写 (expecting cleanup):**
```c
void ~MyManager()
{
    SaveData();  // Expect this runs on shutdown
}
```

**实际结果：** Server shutdown may kill the process before destructors run. Your save never happens.

**正确方案：** Save proactively at regular intervals and on known lifecycle events:
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

**你会写 (in C++):**
```c
{
    FileHandle f = OpenFile("test.txt", FileMode.WRITE);
    // f automatically closed when scope ends
}
```

**实际结果：** Enforce Script does not close file handles when variables go out of scope (even with `autoptr`).

**正确方案：** Always close resources explicitly:
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

**你会写：**
```c
PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
player.DoSomething();  // CRASH on server!
```

**实际结果：** `GetGame().GetPlayer()` returns the **local** player. On a dedicated server, there is no local player — it returns `null`.

**正确方案：** On server, iterate the player list:
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

### 31. `sealed` 类不能被继承 (1.28+)

从 DayZ 1.28 开始，Enforce Script 编译器强制执行 `sealed` 关键字。标记为 `sealed` 的类或方法不能被继承或覆盖。如果你尝试继承一个密封类：

```c
// 如果 BI 将 SomeVanillaClass 标记为 sealed：
class MyClass : SomeVanillaClass  // 1.28+ 编译错误
{
}
```

在尝试继承之前，检查原版脚本转储中是否有标记为 `sealed` 的类。如果需要修改密封类的行为，使用组合（包装它）而不是继承。

---

### 32. 方法参数限制：最多 16 个 (1.28+)

Enforce Script 一直有 16 个参数的方法限制，但在 1.28 之前这是一个静默的缓冲区溢出，会导致随机崩溃。从 1.28 开始，编译器产生**硬错误**：

```c
// 1.28+ 编译错误——超过 16 个参数
void MyMethod(int a, int b, int c, int d, int e, int f, int g, int h,
              int i, int j, int k, int l, int m, int n, int o, int p,
              int q)  // 第 17 个参数 = 错误
{
}
```

**修复：** 重构为传递一个类或数组，而不是单个参数。

---

### 33. `Obsolete` 属性警告 (1.28+)

DayZ 1.28 引入了 `Obsolete` 属性。标记为 `[Obsolete]` 的函数和类会生成编译器警告。这些 API 仍然有效，但计划在未来的更新中移除。检查你的构建输出中的弃用警告，并迁移到推荐的替代方案。

---

### 34. `int.MIN` 比较 Bug

涉及 `int.MIN`（-2147483648）的比较会产生不正确的结果：

```c
int val = 1;
if (val < int.MIN)  // 求值为 TRUE——应该是 false
{
    // 此代码块错误地执行
}
```

避免直接与 `int.MIN` 进行比较。使用存储的常量代替，或与特定的负值进行比较。

---

### 35. 数组元素布尔取反失败

对数组元素的直接布尔取反无法编译：

```c
array<int> list = {0, 1, 2};
if (!list[1])          // 无法编译
if (list[1] == 0)      // 有效——使用显式比较
```

测试数组元素的真假值时，始终使用显式相等检查。

---

### 36. 数组赋值中的复杂表达式导致崩溃

将复杂表达式直接赋值给数组元素可能导致段错误：

```c
// 运行时崩溃
m_Values[index] = vector.DistanceSq(posA, posB) <= distSq;

// 安全——使用中间变量
bool result = vector.DistanceSq(posA, posB) <= distSq;
m_Values[index] = result;
```

始终将复杂表达式的结果存储在局部变量中，然后再赋值给数组。

---

### 37. `foreach` 对方法返回值崩溃

直接对方法的返回值使用 `foreach` 会在第二次迭代时导致空指针异常：

```c
// 在第 2 个元素时崩溃
foreach (string item : GetMyArray())
{
}

// 安全——先存储到局部变量
array<string> items = GetMyArray();
foreach (string item : items)
{
}
```

---

### 38. 位运算与比较运算符优先级

位运算符的优先级**低于**比较运算符，遵循 C/C++ 规则：

```c
int flags = 5;
int mask = 4;
if (flags & mask == mask)      // 错误：被求值为 flags & (mask == mask)
if ((flags & mask) == mask)    // 正确：始终使用括号
```

---

### 39. 空的 `#ifdef` / `#ifndef` 块导致崩溃

空的预处理器条件块——即使只包含注释——也会导致段错误：

```c
#ifdef SOME_DEFINE
    // 这个仅含注释的块导致段错误
#endif
```

始终包含至少一条可执行语句，或完全删除该块。

---

### 40. `GetGame().IsClient()` 在加载期间返回 False

在客户端加载阶段，`GetGame().IsClient()` 返回 **false**，而 `GetGame().IsServer()` 返回 **true**——即使在客户端上也是如此。请改用 `IsDedicatedServer()`：

```c
// 加载阶段不可靠
if (GetGame().IsClient()) { }   // 加载期间为 false！
if (GetGame().IsServer()) { }   // 加载期间为 true，即使在客户端上！

// 可靠的方法
if (!GetGame().IsDedicatedServer()) { /* 客户端代码 */ }
if (GetGame().IsDedicatedServer())  { /* 服务端代码 */ }
```

**例外：** 如果需要支持离线/单人模式，`IsDedicatedServer()` 对本地服务器也返回 false。

---

### 41. 编译错误消息报告错误的文件

当编译器遇到未定义的类或变量命名冲突时，它会在**最后成功解析的文件的 EOF** 处报告错误——而不是实际的错误位置。如果你看到指向未修改文件的错误，真正的错误在紧随其后被解析的文件中。

---

### 42. `crash_*.log` 文件不是崩溃

名为 `crash_<date>_<time>.log` 的日志文件包含**运行时异常**，而不是实际的段错误。命名具有误导性——这些是脚本错误，不是引擎崩溃。

---

## 从 C++ 转来

如果你是 C++ 开发者，以下是最大的调整：

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

## 从 C# 转来

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

## 从 Java 转来

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

## 从 Python 转来

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

## 快速参考表

| 特性 | 是否存在？ | 解决方法 |
|---------|---------|------------|
| Ternary `? :` | 不存在 | if/else |
| `do...while` | 不存在 | while + break |
| `try/catch` | 不存在 | 守卫子句 |
| Multiple inheritance | 不存在 | 组合 |
| Operator overloading | 仅索引 | 命名方法 |
| Lambdas | 不存在 | 命名方法 |
| Delegates | 不存在 | `ScriptInvoker` |
| `\\` / `\"` in strings | 损坏 | 避免使用 |
| Variable redeclaration | else-if 中损坏 | 唯一名称或在 if 前声明 |
| 多行函数调用 | 解析不可靠 | 保持调用在一行 |
| `nullptr` | 不存在 | `null` / `NULL` |
| switch fall-through | 存在（与 C/C++ 相同） | 始终使用 `break`，除非有意贯穿 |
| Default param expressions | 不存在 | 仅字面量或 NULL |
| `#define` values | 不存在 | `const` |
| Interfaces | 不存在 | 空基类 |
| Generic constraints | 不存在 | 运行时类型检查 |
| Enum validation | 不存在 | 手动范围检查 |
| Variadic params | 不存在 | `string.Format` 或数组 |
| Nested classes | 不存在 | 带前缀名称的顶层类 |
| Variable-size static arrays | 不存在 | `array<T>` |
| `#include` | 不存在 | config.cpp `files[]` |
| Namespaces | 不存在 | 名称前缀 |
| RAII | 不存在 | 手动清理 |
| `GetGame().GetPlayer()` server | 返回 null | 遍历 `GetPlayers()` |
| `sealed` 类继承 (1.28+) | 编译错误 | 使用组合代替 |
| 17+ 方法参数 (1.28+) | 编译错误 | 传递类或数组 |
| `[Obsolete]` API (1.28+) | 编译器警告 | 迁移到替代 API |
| `int.MIN` 比较 | 结果不正确 | 使用存储的常量 |
| `!array[i]` 取反 | 编译错误 | 使用 `array[i] == 0` |
| 数组赋值中的复杂表达式 | 段错误 | 使用中间变量 |
| `foreach` 对方法返回值 | 空指针崩溃 | 先存储到局部变量 |
| 位运算与比较优先级 | 错误求值 | 始终使用括号 |
| 空的 `#ifdef` 块 | 段错误 | 包含语句或删除块 |
| `IsClient()` 加载期间 | 返回 false | 使用 `IsDedicatedServer()` |
| 编译错误定位错误文件 | 误导性位置 | 检查报告文件之后被解析的文件 |
| `crash_*.log` 文件 | 不是实际崩溃 | 它们是运行时脚本异常 |

---

## 导航

| 上一章 | 上级 | 下一章 |
|----------|----|------|
| [1.11 错误处理](11-error-handling.md) | [第一部分：Enforce Script](../README.md) | [第二部分：Mod 结构](../02-mod-structure/01-five-layers.md) |
