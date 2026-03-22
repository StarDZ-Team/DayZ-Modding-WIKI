# 第 1.11 章：错误处理

[首页](../README.md) | [<< 上一章：枚举与预处理器](10-enums-preprocessor.md) | **错误处理** | [下一章：注意事项 >>](12-gotchas.md)

---

> **目标：**学习如何在没有 try/catch 的语言中处理错误。掌握守卫子句、防御性编程和结构化日志模式，使你的模组保持稳定。

---

## 目录

- [基本规则：没有 try/catch](#基本规则没有-trycatch)
- [守卫子句模式](#守卫子句模式)
  - [单个守卫](#单个守卫)
  - [多个守卫（堆叠）](#多个守卫堆叠)
  - [带日志的守卫](#带日志的守卫)
- [空值检查](#空值检查)
  - [每次操作前检查](#每次操作前检查)
  - [链式空值检查](#链式空值检查)
  - [notnull 关键字](#notnull-关键字)
- [ErrorEx——引擎错误报告](#errorex引擎错误报告)
  - [严重级别](#严重级别)
  - [何时使用每个级别](#何时使用每个级别)
- [DumpStackString——堆栈跟踪](#dumpstackstring堆栈跟踪)
- [调试打印](#调试打印)
  - [基本 Print](#基本-print)
  - [使用 #ifdef 的条件调试](#使用-ifdef-的条件调试)
- [结构化日志模式](#结构化日志模式)
  - [简单前缀模式](#简单前缀模式)
  - [基于级别的日志类](#基于级别的日志类)
  - [生产日志模式](#生产日志模式)
- [真实案例](#真实案例)
  - [带多个守卫的安全函数](#带多个守卫的安全函数)
  - [安全的配置加载](#安全的配置加载)
  - [安全的 RPC 处理器](#安全的-rpc-处理器)
  - [安全的物品栏操作](#安全的物品栏操作)
- [防御性模式总结](#防御性模式总结)
- [常见错误](#常见错误)
- [总结](#总结)
- [导航](#导航)

---

## 基本规则：没有 try/catch

Enforce Script **没有异常处理**。没有 `try`、没有 `catch`、没有 `throw`、没有 `finally`。如果运行时出现问题（空引用、无效类型转换、数组越界），引擎要么：

1. **静默崩溃**——函数停止执行，没有错误消息
2. **记录脚本错误**——在 `.RPT` 日志文件中可见
3. **使服务器/客户端崩溃**——在严重的情况下

这意味着**每个潜在的失败点都必须手动守卫**。主要的防御手段是**守卫子句模式**。

---

## 守卫子句模式

守卫子句在函数顶部检查前置条件，如果检查失败则提前返回。这使"正常路径"保持不嵌套且可读。

### 单个守卫

```c
void TeleportPlayer(PlayerBase player, vector destination)
{
    if (!player)
        return;

    player.SetPosition(destination);
}
```

### 多个守卫（堆叠）

在函数顶部堆叠守卫——每个守卫检查一个前置条件：

```c
void GiveItemToPlayer(PlayerBase player, string className, int quantity)
{
    // 守卫 1：玩家存在
    if (!player)
        return;

    // 守卫 2：玩家存活
    if (!player.IsAlive())
        return;

    // 守卫 3：有效的类名
    if (className == "")
        return;

    // 守卫 4：有效的数量
    if (quantity <= 0)
        return;

    // 所有前置条件满足——可以安全继续
    for (int i = 0; i < quantity; i++)
    {
        player.GetInventory().CreateInInventory(className);
    }
}
```

### 带日志的守卫

在生产代码中，始终记录守卫触发的原因——静默失败很难调试：

```c
void StartMission(PlayerBase initiator, string missionId)
{
    if (!initiator)
    {
        Print("[Missions] ERROR: StartMission called with null initiator");
        return;
    }

    if (missionId == "")
    {
        Print("[Missions] ERROR: StartMission called with empty missionId");
        return;
    }

    if (!initiator.IsAlive())
    {
        Print("[Missions] WARN: Player " + initiator.GetIdentity().GetName() + " is dead, cannot start mission");
        return;
    }

    // 继续启动任务
    Print("[Missions] Starting mission " + missionId);
    // ...
}
```

---

## 空值检查

空引用是 DayZ 模组开发中最常见的崩溃原因。每个引用类型都可以是 `null`。

### 每次操作前检查

```c
// 错误——如果 player、identity 或 name 在任何点为 null 都会崩溃
string name = player.GetIdentity().GetName();

// 正确——在每一步检查
if (!player)
    return;

PlayerIdentity identity = player.GetIdentity();
if (!identity)
    return;

string name = identity.GetName();
```

### 链式空值检查

当你需要遍历引用链时，检查每个环节：

```c
void PrintHandItemName(PlayerBase player)
{
    if (!player)
        return;

    HumanInventory inv = player.GetHumanInventory();
    if (!inv)
        return;

    EntityAI handItem = inv.GetEntityInHands();
    if (!handItem)
        return;

    Print("Player is holding: " + handItem.GetType());
}
```

### notnull 关键字

`notnull` 是一个参数修饰符，使编译器在调用处拒绝 `null` 参数：

```c
void ProcessItem(notnull EntityAI item)
{
    // 编译器保证 item 不为 null
    // 函数内部不需要空值检查
    Print(item.GetType());
}

// 用法：
EntityAI item = GetSomeItem();
if (item)
{
    ProcessItem(item);  // OK——编译器知道此处 item 不为 null
}
ProcessItem(null);      // 编译错误！
```

> **限制：**`notnull` 只能在调用处捕获字面 `null` 和明显为 null 的变量。它无法防止在检查时非 null 的变量因引擎删除而变为 null。

---

## ErrorEx——引擎错误报告

`ErrorEx` 将错误消息写入脚本日志（`.RPT` 文件）。它**不会**停止执行或抛出异常。

```c
ErrorEx("Something went wrong");
```

### 严重级别

`ErrorEx` 接受一个可选的第二个参数，类型为 `ErrorExSeverity`：

```c
// INFO——信息性的，不是错误
ErrorEx("Config loaded successfully", ErrorExSeverity.INFO);

// WARNING——潜在问题，执行继续
ErrorEx("Config file not found, using defaults", ErrorExSeverity.WARNING);

// ERROR——确定的问题（省略时的默认严重级别）
ErrorEx("Failed to create object: class not found");
ErrorEx("Critical failure in RPC handler", ErrorExSeverity.ERROR);
```

| 严重级别 | 何时使用 |
|----------|-------------|
| `ErrorExSeverity.INFO` | 你想要在错误日志中看到的信息性消息 |
| `ErrorExSeverity.WARNING` | 可恢复的问题（缺少配置、使用了回退） |
| `ErrorExSeverity.ERROR` | 确定的错误或不可恢复的状态 |

### 何时使用每个级别

```c
void LoadConfig(string path)
{
    if (!FileExist(path))
    {
        // WARNING——可恢复，我们将使用默认值
        ErrorEx("Config not found at " + path + ", using defaults", ErrorExSeverity.WARNING);
        UseDefaultConfig();
        return;
    }

    MyConfig cfg = new MyConfig();
    JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);

    if (cfg.Version < EXPECTED_VERSION)
    {
        // INFO——不是问题，只是值得注意
        ErrorEx("Config version " + cfg.Version.ToString() + " is older than expected", ErrorExSeverity.INFO);
    }

    if (!cfg.Validate())
    {
        // ERROR——坏数据会导致问题
        ErrorEx("Config validation failed for " + path);
        UseDefaultConfig();
        return;
    }
}
```

---

## DumpStackString——堆栈跟踪

`DumpStackString` 将当前调用堆栈捕获为字符串。这对于诊断意外状态出现的位置至关重要：

```c
void OnUnexpectedState(string context)
{
    string stack = DumpStackString();
    Print("[ERROR] Unexpected state in " + context);
    Print("[ERROR] Stack trace:");
    Print(stack);
}
```

在守卫子句中使用它来跟踪调用者：

```c
void CriticalFunction(PlayerBase player)
{
    if (!player)
    {
        string stack = DumpStackString();
        ErrorEx("CriticalFunction called with null player! Stack: " + stack);
        return;
    }

    // ...
}
```

---

## 调试打印

### 基本 Print

`Print()` 写入脚本日志文件。它接受任何类型：

```c
Print("Hello World");                    // string
Print(42);                               // int
Print(3.14);                             // float
Print(player.GetPosition());             // vector

// 格式化打印
Print(string.Format("Player %1 at position %2 with %3 HP",
    player.GetIdentity().GetName(),
    player.GetPosition().ToString(),
    player.GetHealth("", "Health").ToString()
));
```

### 使用 #ifdef 的条件调试

用预处理器守卫包裹调试打印，使它们在发布版本中被编译排除：

```c
void ProcessAI(DayZInfected zombie)
{
    #ifdef DIAG_DEVELOPER
        Print(string.Format("[AI DEBUG] Processing %1 at %2",
            zombie.GetType(),
            zombie.GetPosition().ToString()
        ));
    #endif

    // 实际逻辑...
}
```

对于模组特定的调试标志，定义你自己的符号：

```c
// 在你的 config.cpp 中：
// defines[] = { "MYMOD_DEBUG" };

#ifdef MYMOD_DEBUG
    Print("[MyMod] Debug: item spawned at " + pos.ToString());
#endif
```

---

## 结构化日志模式

### 简单前缀模式

最简单的方法——在每个 Print 调用前加上标签：

```c
class MissionManager
{
    static const string LOG_TAG = "[Missions] ";

    void Start()
    {
        Print(LOG_TAG + "Mission system starting");
    }

    void OnError(string msg)
    {
        Print(LOG_TAG + "ERROR: " + msg);
    }
}
```

### 基于级别的日志类

带有严重级别的可复用日志器：

```c
class ModLogger
{
    protected string m_Prefix;

    void ModLogger(string prefix)
    {
        m_Prefix = "[" + prefix + "] ";
    }

    void Info(string msg)
    {
        Print(m_Prefix + "INFO: " + msg);
    }

    void Warning(string msg)
    {
        Print(m_Prefix + "WARN: " + msg);
        ErrorEx(m_Prefix + msg, ErrorExSeverity.WARNING);
    }

    void Error(string msg)
    {
        Print(m_Prefix + "ERROR: " + msg);
        ErrorEx(m_Prefix + msg, ErrorExSeverity.ERROR);
    }

    void Debug(string msg)
    {
        #ifdef DIAG_DEVELOPER
            Print(m_Prefix + "DEBUG: " + msg);
        #endif
    }
}

// 用法：
ref ModLogger g_MissionLog = new ModLogger("Missions");
g_MissionLog.Info("System started");
g_MissionLog.Error("Failed to load mission data");
```

### 生产日志模式

对于生产模组，带有文件输出、每日轮转和多个输出目标的静态日志类：

```c
// 日志级别枚举
enum MyLogLevel
{
    TRACE   = 0,
    DEBUG   = 1,
    INFO    = 2,
    WARNING = 3,
    ERROR   = 4,
    NONE    = 5
};

class MyLog
{
    private static MyLogLevel s_FileMinLevel = MyLogLevel.DEBUG;
    private static MyLogLevel s_ConsoleMinLevel = MyLogLevel.INFO;

    // 用法：MyLog.Info("ModuleName", "Something happened");
    static void Info(string source, string message)
    {
        Log(MyLogLevel.INFO, source, message);
    }

    static void Warning(string source, string message)
    {
        Log(MyLogLevel.WARNING, source, message);
    }

    static void Error(string source, string message)
    {
        Log(MyLogLevel.ERROR, source, message);
    }

    private static void Log(MyLogLevel level, string source, string message)
    {
        if (level < s_ConsoleMinLevel)
            return;

        string levelName = typename.EnumToString(MyLogLevel, level);
        string line = string.Format("[MyMod] [%1] [%2] %3", levelName, source, message);
        Print(line);

        // 如果级别满足文件阈值，也写入文件
        if (level >= s_FileMinLevel)
        {
            WriteToFile(line);
        }
    }

    private static void WriteToFile(string line)
    {
        // 文件 I/O 实现...
    }
}
```

跨多个模块使用：

```c
MyLog.Info("MissionServer", "MyMod Core initialized (server)");
MyLog.Warning("ServerWebhooksRPC", "Unauthorized request from: " + sender.GetName());
MyLog.Error("ConfigManager", "Failed to load config: " + path);
```

---

## 真实案例

### 带多个守卫的安全函数

```c
void HealPlayer(PlayerBase player, float amount, string healerName)
{
    // 守卫：空玩家
    if (!player)
    {
        MyLog.Error("HealSystem", "HealPlayer called with null player");
        return;
    }

    // 守卫：玩家存活
    if (!player.IsAlive())
    {
        MyLog.Warning("HealSystem", "Cannot heal dead player: " + player.GetIdentity().GetName());
        return;
    }

    // 守卫：有效数量
    if (amount <= 0)
    {
        MyLog.Warning("HealSystem", "Invalid heal amount: " + amount.ToString());
        return;
    }

    // 守卫：未满血
    float currentHP = player.GetHealth("", "Health");
    float maxHP = player.GetMaxHealth("", "Health");
    if (currentHP >= maxHP)
    {
        MyLog.Info("HealSystem", player.GetIdentity().GetName() + " already at full health");
        return;
    }

    // 所有守卫通过——执行治疗
    float newHP = Math.Min(currentHP + amount, maxHP);
    player.SetHealth("", "Health", newHP);

    MyLog.Info("HealSystem", string.Format("%1 healed %2 for %3 HP (%4 -> %5)",
        healerName,
        player.GetIdentity().GetName(),
        amount.ToString(),
        currentHP.ToString(),
        newHP.ToString()
    ));
}
```

### 安全的配置加载

```c
class MyConfig
{
    int MaxPlayers = 60;
    float SpawnRadius = 100.0;
    string WelcomeMessage = "Welcome!";
}

static MyConfig LoadConfigSafe(string path)
{
    // 守卫：文件存在
    if (!FileExist(path))
    {
        Print("[Config] File not found: " + path + " — creating defaults");
        MyConfig defaults = new MyConfig();
        JsonFileLoader<MyConfig>.JsonSaveFile(path, defaults);
        return defaults;
    }

    // 尝试加载（没有 try/catch，所以之后验证）
    MyConfig cfg = new MyConfig();
    JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);

    // 守卫：加载的对象有效
    if (!cfg)
    {
        Print("[Config] ERROR: Failed to parse " + path + " — using defaults");
        return new MyConfig();
    }

    // 守卫：验证值
    if (cfg.MaxPlayers < 1 || cfg.MaxPlayers > 128)
    {
        Print("[Config] WARN: MaxPlayers out of range (" + cfg.MaxPlayers.ToString() + "), clamping");
        cfg.MaxPlayers = Math.Clamp(cfg.MaxPlayers, 1, 128);
    }

    if (cfg.SpawnRadius < 0)
    {
        Print("[Config] WARN: SpawnRadius negative, using default");
        cfg.SpawnRadius = 100.0;
    }

    return cfg;
}
```

### 安全的 RPC 处理器

```c
void RPC_SpawnItem(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    // 守卫：仅服务器
    if (type != CallType.Server)
        return;

    // 守卫：有效的发送者
    if (!sender)
    {
        Print("[RPC] SpawnItem: null sender identity");
        return;
    }

    // 守卫：读取参数
    Param2<string, vector> data;
    if (!ctx.Read(data))
    {
        Print("[RPC] SpawnItem: failed to read params from " + sender.GetName());
        return;
    }

    string className = data.param1;
    vector position = data.param2;

    // 守卫：有效的类名
    if (className == "")
    {
        Print("[RPC] SpawnItem: empty className from " + sender.GetName());
        return;
    }

    // 守卫：权限检查
    if (!HasPermission(sender.GetPlainId(), "SpawnItem"))
    {
        Print("[RPC] SpawnItem: unauthorized by " + sender.GetName());
        return;
    }

    // 所有守卫通过——执行
    Object obj = GetGame().CreateObjectEx(className, position, ECE_PLACE_ON_SURFACE);
    if (!obj)
    {
        Print("[RPC] SpawnItem: CreateObjectEx returned null for " + className);
        return;
    }

    Print("[RPC] SpawnItem: " + sender.GetName() + " spawned " + className);
}
```

### 安全的物品栏操作

```c
bool TransferItem(PlayerBase fromPlayer, PlayerBase toPlayer, EntityAI item)
{
    // 守卫：所有引用有效
    if (!fromPlayer || !toPlayer || !item)
    {
        Print("[Inventory] TransferItem: null reference");
        return false;
    }

    // 守卫：两个玩家都存活
    if (!fromPlayer.IsAlive() || !toPlayer.IsAlive())
    {
        Print("[Inventory] TransferItem: one or both players are dead");
        return false;
    }

    // 守卫：源确实有该物品
    EntityAI checkItem = fromPlayer.GetInventory().FindAttachment(
        fromPlayer.GetInventory().FindUserReservedLocationIndex(item)
    );

    // 守卫：目标有空间
    InventoryLocation il = new InventoryLocation();
    if (!toPlayer.GetInventory().FindFreeLocationFor(item, FindInventoryLocationType.ANY, il))
    {
        Print("[Inventory] TransferItem: no free space in target inventory");
        return false;
    }

    // 执行转移
    return toPlayer.GetInventory().TakeEntityToInventory(InventoryMode.SERVER, FindInventoryLocationType.ANY, item);
}
```

---

## 防御性模式总结

| 模式 | 用途 | 示例 |
|---------|---------|---------|
| 守卫子句 | 无效输入时提前返回 | `if (!player) return;` |
| 空值检查 | 防止空引用 | `if (obj) obj.DoThing();` |
| 类型转换 + 检查 | 安全的向下转换 | `if (Class.CastTo(p, obj))` |
| 加载后验证 | JSON 加载后检查数据 | `if (cfg.Value < 0) cfg.Value = default;` |
| 使用前验证 | 范围/边界检查 | `if (arr.IsValidIndex(i))` |
| 失败时记录 | 追踪出错位置 | `Print("[Tag] Error: " + context);` |
| ErrorEx 用于引擎 | 写入 .RPT 文件 | `ErrorEx("msg", ErrorExSeverity.WARNING);` |
| DumpStackString | 捕获调用堆栈 | `Print(DumpStackString());` |

---

## 最佳实践

- 在每个函数顶部使用扁平的守卫子句（`if (!x) return;`），而不是深度嵌套的 `if` 块——它保持代码可读且正常路径不嵌套。
- 始终在守卫子句中记录消息——静默的 `return` 使失败不可见且极难调试。
- 对应该出现在 `.RPT` 日志中的消息使用带有适当严重级别（`INFO`、`WARNING`、`ERROR`）的 `ErrorEx`；对脚本日志输出使用 `Print`。
- 将大量调试日志包裹在 `#ifdef DIAG_DEVELOPER` 或自定义定义中，使其在发布版本中被编译排除且不影响性能。
- 使用 `JsonFileLoader` 加载后验证配置数据——它返回 `void` 并在解析失败时静默保留默认值。

---

## 真实模组中的观察

> 通过研究专业 DayZ 模组源代码确认的模式。

| 模式 | 模组 | 细节 |
|---------|-----|--------|
| 带日志消息的堆叠守卫子句 | COT / VPP | 每个 RPC 处理器检查发送者、参数、权限，并在每次失败时记录 |
| 带级别过滤的静态日志类 | Expansion / Dabs | 单个 `Log` 类将 `Info`/`Warning`/`Error` 路由到控制台、文件和可选的 Discord |
| 在关键守卫中使用 `DumpStackString()` | COT Admin | 在意外的 null 上捕获调用堆栈以追踪哪个调用者传递了错误数据 |
| 调试打印周围使用 `#ifdef DIAG_DEVELOPER` | Vanilla DayZ / Expansion | 所有逐帧调试输出都被包裹，使其永远不会在发布版本中运行 |

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| `try`/`catch` | 大多数语言的标准 | 在 Enforce Script 中不存在——每个失败点都必须手动守卫 |
| `JsonFileLoader.JsonLoadFile` | 期望返回成功/失败 | 返回 `void`；在 JSON 无效时对象保留其默认值，没有错误 |
| `ErrorEx` | 听起来像抛出错误 | 它只写入 `.RPT` 日志——执行正常继续 |

---

## 常见错误

### 1. 假设函数成功运行

```c
// 错误——JsonLoadFile 返回 void，不是成功指示器
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
// 如果文件有无效的 JSON，cfg 仍然有默认值——没有错误

// 正确——加载后验证
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
if (cfg.SomeCriticalField == 0)
{
    Print("[Config] Warning: SomeCriticalField is zero — was the file loaded correctly?");
}
```

### 2. 深度嵌套的空值检查而非守卫

```c
// 错误——厄运金字塔
void Process(PlayerBase player)
{
    if (player)
    {
        if (player.GetIdentity())
        {
            if (player.IsAlive())
            {
                // 终于可以做些事情
            }
        }
    }
}

// 正确——扁平的守卫子句
void Process(PlayerBase player)
{
    if (!player) return;
    if (!player.GetIdentity()) return;
    if (!player.IsAlive()) return;

    // 做些事情
}
```

### 3. 忘记在守卫子句中记录

```c
// 错误——静默失败，无法调试
if (!player) return;

// 正确——留下踪迹
if (!player)
{
    Print("[MyMod] Process: null player");
    return;
}
```

### 4. 在热路径中使用 Print

```c
// 错误——每帧 Print 会影响性能
override void OnUpdate(float timeslice)
{
    Print("Updating...");  // 每帧调用！
}

// 正确——使用调试守卫或限制频率
override void OnUpdate(float timeslice)
{
    #ifdef DIAG_DEVELOPER
        m_DebugTimer += timeslice;
        if (m_DebugTimer > 5.0)
        {
            Print("[DEBUG] Update tick: " + timeslice.ToString());
            m_DebugTimer = 0;
        }
    #endif
}
```

---

## 总结

| 工具 | 用途 | 语法 |
|------|---------|--------|
| 守卫子句 | 失败时提前返回 | `if (!x) return;` |
| 空值检查 | 防止崩溃 | `if (obj) obj.Method();` |
| ErrorEx | 写入 .RPT 日志 | `ErrorEx("msg", ErrorExSeverity.WARNING);` |
| DumpStackString | 获取调用堆栈 | `string s = DumpStackString();` |
| Print | 写入脚本日志 | `Print("message");` |
| string.Format | 格式化日志 | `string.Format("P %1 at %2", a, b)` |
| #ifdef 守卫 | 编译时调试开关 | `#ifdef DIAG_DEVELOPER` |
| notnull | 编译器空值检查 | `void Fn(notnull Class obj)` |

**黄金法则：**在 Enforce Script 中，假设一切都可能是 null，每个操作都可能失败。先检查，后操作，始终记录。

---

## 导航

| 上一章 | 上级 | 下一章 |
|----------|----|------|
| [1.10 枚举与预处理器](10-enums-preprocessor.md) | [第一部分：Enforce Script](../README.md) | [1.12 不存在的特性](12-gotchas.md) |
