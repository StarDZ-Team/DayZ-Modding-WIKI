# 第 1.10 章：枚举与预处理器

[首页](../README.md) | [<< 上一章：类型转换与反射](09-casting-reflection.md) | **枚举与预处理器** | [下一章：错误处理 >>](11-error-handling.md)

---

> **目标：** 理解枚举声明、枚举反射工具、位标志模式、常量以及用于条件编译的预处理器系统。

---

## 目录

- [枚举声明](#枚举声明)
  - [显式值](#显式值)
  - [隐式值](#隐式值)
  - [枚举继承](#枚举继承)
- [使用枚举](#使用枚举)
- [枚举反射](#枚举反射)
  - [typename.EnumToString](#typenameenumtostring)
  - [typename.StringToEnum](#typenamestringtoenum)
- [位标志模式](#位标志模式)
- [常量](#常量)
- [预处理器指令](#预处理器指令)
  - [#ifdef / #ifndef / #endif](#ifdef--ifndef--endif)
  - [#define](#define)
  - [常用引擎定义](#常用引擎定义)
  - [通过 config.cpp 自定义定义](#通过-configcpp-自定义定义)
- [实际示例](#实际示例)
  - [平台特定代码](#平台特定代码)
  - [可选 Mod 依赖](#可选-mod-依赖)
  - [仅调试诊断](#仅调试诊断)
  - [服务器与客户端逻辑](#服务器与客户端逻辑)
- [常见错误](#常见错误)
- [总结](#总结)
- [导航](#导航)

---

## 枚举声明

Enforce Script 中的枚举定义了分组在一个类型名称下的命名整数常量。它们本质上表现为 `int`。

### 显式值

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

### 隐式值

如果省略值，它们会从前一个值自动递增（从 0 开始）：

```c
enum EWeaponMode
{
    SEMI,       // 0
    BURST,      // 1
    AUTO,       // 2
    COUNT       // 3 — 获取总数的常见技巧
};
```

### 枚举继承

枚举可以从其他枚举继承。值从最后一个父值继续：

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

所有父值都可以通过子枚举访问：

```c
int c = EExtendedColor.RED;      // 0 — 从 EBaseColor 继承
int d = EExtendedColor.YELLOW;   // 3 — 在 EExtendedColor 中定义
```

> **注意：** 枚举继承对于在 modded 代码中扩展原版枚举非常有用，而无需更改原始枚举。

---

## 使用枚举

枚举作为 `int` 行为——你可以将它们赋值给 `int` 变量、进行比较，以及在 switch 语句中使用：

```c
EDamageState state = EDamageState.WORN;

// 比较
if (state == EDamageState.RUINED)
{
    Print("Item is ruined!");
}

// 在 switch 中使用
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

// 赋值给 int
int stateInt = state;  // 1

// 从 int 赋值（不验证——任何 int 值都被接受！）
EDamageState fromInt = 99;  // 无错误，即使 99 不是有效的枚举值
```

> **警告：** Enforce Script **不会** 验证枚举赋值。将超出范围的整数赋给枚举变量可以编译并运行，不会报错。

---

## 枚举反射

Enforce Script 提供了内置函数来在枚举值和字符串之间转换。

### typename.EnumToString

将枚举值转换为其名称字符串：

```c
EDamageState state = EDamageState.DAMAGED;
string name = typename.EnumToString(EDamageState, state);
Print(name);  // "DAMAGED"
```

这对于日志记录和 UI 显示非常有价值：

```c
void LogDamageState(EntityAI item, EDamageState state)
{
    string stateName = typename.EnumToString(EDamageState, state);
    Print(item.GetType() + " is " + stateName);
}
```

### typename.StringToEnum

将字符串转换回枚举值：

```c
int value;
typename.StringToEnum(EDamageState, "RUINED", value);
Print(value.ToString());  // "4"
```

当从配置文件或 JSON 加载枚举值时使用：

```c
// 从配置字符串加载
string configValue = "BURST";
int modeInt;
if (typename.StringToEnum(EWeaponMode, configValue, modeInt))
{
    EWeaponMode mode = modeInt;
    Print("Loaded weapon mode: " + typename.EnumToString(EWeaponMode, mode));
}
```

---

## 位标志模式

使用 2 的幂次值的枚举创建位标志——在单个整数中组合多个选项：

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

用按位或组合，用按位与测试：

```c
// 组合标志
int flags = ESpawnFlags.PLACE_ON_GROUND | ESpawnFlags.CREATE_PHYSICS | ESpawnFlags.UPDATE_NAVMESH;

// 测试单个标志
if (flags & ESpawnFlags.CREATE_PHYSICS)
{
    Print("Physics will be created");
}

// 移除一个标志
flags = flags & ~ESpawnFlags.CREATE_LOCAL;

// 添加一个标志
flags = flags | ESpawnFlags.NO_LIFETIME;
```

DayZ 广泛使用此模式用于对象创建标志（`ECE_PLACE_ON_SURFACE`、`ECE_CREATEPHYSICS`、`ECE_UPDATEPATHGRAPH` 等）。

---

## 常量

使用 `const` 声明不可变值。常量必须在声明时初始化。

```c
// 整数常量
const int MAX_PLAYERS = 60;
const int INVALID_INDEX = -1;

// 浮点常量
const float GRAVITY = 9.81;
const float SPAWN_RADIUS = 500.0;

// 字符串常量
const string MOD_NAME = "MyMod";
const string CONFIG_PATH = "$profile:MyMod/config.json";
const string LOG_PREFIX = "[MyMod] ";
```

常量可以作为 switch case 值和数组大小使用：

```c
// 使用 const 大小的数组
const int BUFFER_SIZE = 256;
int buffer[BUFFER_SIZE];

// 使用 const 值的 switch
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

> **注意：** 引用类型（对象）没有 `const`。你无法使对象引用不可变。

---

## 预处理器指令

Enforce Script 预处理器在编译之前运行，启用条件代码包含。它的工作方式类似于 C/C++ 预处理器，但功能较少。

### #ifdef / #ifndef / #endif

根据是否定义了某个符号来有条件地包含代码：

```c
// 仅当 DEVELOPER 已定义时包含代码
#ifdef DEVELOPER
    Print("[DEBUG] Diagnostics enabled");
#endif

// 仅当某个符号未定义时包含代码
#ifndef SERVER
    // 仅客户端代码
    CreateClientUI();
#endif

// If-else 模式
#ifdef SERVER
    Print("Running on server");
#else
    Print("Running on client");
#endif
```

### #define

定义你自己的符号（没有值——只是存在性）：

```c
#define MY_MOD_DEBUG

#ifdef MY_MOD_DEBUG
    Print("Debug mode active");
#endif
```

> **注意：** Enforce Script 的 `#define` 只创建存在性标志。它**不**支持宏替换（没有 `#define MAX_HP 100`——改用 `const`）。

### 常用引擎定义

DayZ 根据构建类型和平台提供以下内置定义：

| 定义 | 可用时 | 用途 |
|--------|---------------|---------|
| `SERVER` | 在专用服务器上运行时 | 仅服务器逻辑 |
| `DEVELOPER` | DayZ 开发者版本 | 仅开发功能 |
| `DIAG_DEVELOPER` | 诊断版本 | 诊断菜单、调试工具 |
| `PLATFORM_WINDOWS` | Windows 平台 | 平台特定路径 |
| `PLATFORM_XBOX` | Xbox 平台 | 主机特定 UI |
| `PLATFORM_PS4` | PlayStation 平台 | 主机特定逻辑 |
| `BUILD_EXPERIMENTAL` | 实验性分支 | 实验性功能 |

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

### 通过 config.cpp 自定义定义

Mod 可以在 `config.cpp` 中使用 `defines[]` 数组定义自己的符号。这些符号对在该 mod 之后加载的所有脚本可用：

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

现在其他 mod 可以检测你的任务 mod 是否已加载：

```c
#ifdef MY_MISSIONS_LOADED
    // 任务 mod 已加载——使用其 API
    MyMissionManager.Start();
#else
    // 任务 mod 未加载——跳过或使用后备方案
    Print("Mission system not detected");
#endif
```

---

## 实际示例

### 平台特定代码

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

### 可选 Mod 依赖

这是可选集成其他 mod 的标准模式：

```c
class MyModManager
{
    void Init()
    {
        Print("[MyMod] Initializing...");

        // 始终可用的核心功能
        LoadConfig();
        RegisterRPCs();

        // 与 MyFramework 的可选集成
        #ifdef MY_FRAMEWORK
            Print("[MyMod] Framework detected — using unified logging");
            RegisterWithCore();
        #endif

        // 与 Community Framework 的可选集成
        #ifdef JM_CommunityFramework
            GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);
        #endif
    }
}
```

### 仅调试诊断

```c
void ProcessAI(DayZInfected zombie)
{
    vector pos = zombie.GetPosition();
    float health = zombie.GetHealth("", "Health");

    // 大量调试日志——仅在诊断版本中
    #ifdef DIAG_DEVELOPER
        Print(string.Format("[AI] Zombie %1 at %2, HP: %3",
            zombie.GetType(), pos.ToString(), health.ToString()));

        // 绘制调试球体（仅在 diag 版本中有效）
        Debug.DrawSphere(pos, 1.0, Colors.RED, ShapeFlags.ONCE);
    #endif

    // 实际逻辑在所有版本中运行
    if (health <= 0)
    {
        HandleZombieDeath(zombie);
    }
}
```

### 服务器与客户端逻辑

```c
class MissionHandler
{
    void OnMissionStart()
    {
        #ifdef SERVER
            // 服务器：加载任务数据，生成对象
            LoadMissionData();
            SpawnMissionObjects();
            NotifyAllPlayers();
        #else
            // 客户端：设置 UI，订阅事件
            CreateMissionHUD();
            RegisterClientRPCs();
        #endif
    }
}
```

---

## 最佳实践

- 添加 `COUNT` 哨兵值作为最后一个枚举条目，便于迭代或验证范围（例如 `for (int i = 0; i < EMode.COUNT; i++)`）。
- 对位标志枚举使用 2 的幂次值，用 `|` 组合；用 `&` 测试；用 `& ~FLAG` 移除。
- 对数值常量使用 `const` 而不是 `#define`——Enforce Script 的 `#define` 只创建存在性标志，不是值宏。
- 在你 mod 的 `config.cpp` 中定义 `defines[]` 数组，以暴露跨 mod 检测符号（例如 `"STARDZ_CORE"`）。
- 始终验证从外部数据（配置、RPC）加载的枚举值——Enforce Script 接受任何 `int` 作为枚举，没有范围检查。

---

## 在实际 Mod 中的观察

> 通过研究专业 DayZ mod 源代码确认的模式。

| 模式 | Mod | 详情 |
|---------|-----|--------|
| 用 `#ifdef` 进行可选 mod 集成 | Expansion / COT | 在调用跨 mod API 之前检查 `#ifdef JM_CF` 或 `#ifdef EXPANSIONMOD` |
| 用于生成选项的位标志枚举 | 原版 DayZ | `ECE_PLACE_ON_SURFACE`、`ECE_CREATEPHYSICS` 等，用 `\|` 组合用于 `CreateObjectEx` |
| 用 `typename.EnumToString` 进行日志记录 | Expansion / Dabs | 损伤状态和事件类型记录为可读字符串，而不是原始整数 |
| config.cpp 中的 `defines[]` | StarDZ Core / Expansion | 每个 mod 声明自己的符号，以便其他 mod 可以用 `#ifdef` 检测 |

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| 枚举赋值验证 | 期望编译器拒绝无效值 | `EDamageState state = 999` 可以正常编译——完全没有范围检查 |
| `#define MAX_HP 100` | 像 C/C++ 宏一样工作 | Enforce Script 的 `#define` 只创建存在性标志；对值使用 `const int` |
| `switch` case 堆叠 | 多个 case 共享一个处理程序 | Enforce Script 中没有穿透——每个 `case` 是独立的；改用 `if`/`\|\|` |

---

## 常见错误

### 1. 将枚举用作验证类型

```c
// 问题——没有验证，任何 int 都被接受
EDamageState state = 999;  // 编译正常，但 999 不是有效的状态

// 解决方案——从外部数据加载时手动验证
int rawValue = LoadFromConfig();
if (rawValue >= 0 && rawValue <= EDamageState.RUINED)
{
    EDamageState state = rawValue;
}
```

### 2. 试图用 #define 进行值替换

```c
// 错误——Enforce Script 的 #define 不支持值
#define MAX_HEALTH 100
int hp = MAX_HEALTH;  // 编译错误！

// 正确——改用 const
const int MAX_HEALTH = 100;
int hp = MAX_HEALTH;
```

### 3. 不正确地嵌套 #ifdef

```c
// 正确——嵌套 ifdef 没问题
#ifdef SERVER
    #ifdef MY_FRAMEWORK
        MyLog.Info("MyMod", "Server + Core");
    #endif
#endif

// 错误——缺少 #endif 导致神秘的编译错误
#ifdef SERVER
    DoServerStuff();
// 这里忘记了 #endif！
```

### 4. 忘记 switch/case 没有穿透

```c
// 在 C/C++ 中，没有 break 的 case 会穿透。
// 在 Enforce Script 中，每个 case 是独立的——没有穿透。

switch (state)
{
    case EDamageState.PRISTINE:
    case EDamageState.WORN:
        Print("Good condition");  // 只有 WORN 才到达这里，不是 PRISTINE！
        break;
}
```

如果需要多个 case 共享逻辑，使用 if/else：

```c
if (state == EDamageState.PRISTINE || state == EDamageState.WORN)
{
    Print("Good condition");
}
```

---

## 总结

### 枚举

| 功能 | 语法 |
|---------|--------|
| 声明 | `enum EName { A = 0, B = 1 };` |
| 隐式 | `enum EName { A, B, C };`（0, 1, 2）|
| 继承 | `enum EChild : EParent { D, E };` |
| 转字符串 | `typename.EnumToString(EName, value)` |
| 从字符串 | `typename.StringToEnum(EName, "A", out val)` |
| 位标志组合 | `flags = A | B` |
| 位标志测试 | `if (flags & A)` |

### 预处理器

| 指令 | 用途 |
|-----------|---------|
| `#ifdef SYMBOL` | 如果符号存在则编译 |
| `#ifndef SYMBOL` | 如果符号不存在则编译 |
| `#else` | 替代分支 |
| `#endif` | 结束条件块 |
| `#define SYMBOL` | 定义符号（无值）|

### 关键定义

| 定义 | 含义 |
|--------|---------|
| `SERVER` | 专用服务器 |
| `DEVELOPER` | 开发者版本 |
| `DIAG_DEVELOPER` | 诊断版本 |
| `PLATFORM_WINDOWS` | Windows 操作系统 |
| 自定义：`defines[]` | 你 mod 的 config.cpp |

---

## 导航

| 上一章 | 上级 | 下一章 |
|----------|----|------|
| [1.9 类型转换与反射](09-casting-reflection.md) | [第 1 部分：Enforce Script](../README.md) | [1.11 错误处理](11-error-handling.md) |
