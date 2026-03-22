# 第 7.1 章：单例模式

[首页](../README.md) | **单例模式** | [下一章：模块系统 >>](02-module-systems.md)

---

## 简介

单例模式保证一个类恰好有一个实例，可以全局访问。在 DayZ 模组开发中，它是最常见的架构模式 --- 几乎每个管理器、缓存、注册表和子系统都使用它。COT、VPP、Expansion、Dabs Framework 等都依赖单例来协调引擎脚本层之间的状态。

本章介绍规范实现、生命周期管理、适用场景以及常见出错情况。

---

## 目录

- [规范实现](#规范实现)
- [惰性初始化 vs 急切初始化](#惰性初始化-vs-急切初始化)
- [生命周期管理](#生命周期管理)
- [何时使用单例](#何时使用单例)
- [真实示例](#真实示例)
- [线程安全考虑](#线程安全考虑)
- [反模式](#反模式)
- [替代方案：纯静态类](#替代方案纯静态类)
- [检查清单](#检查清单)

---

## 规范实现

标准 DayZ 单例遵循一个简单公式：一个 `private static ref` 字段、一个静态 `GetInstance()` 访问器，以及一个用于清理的静态 `DestroyInstance()`。

```c
class LootManager
{
    // 唯一实例。'ref' 使其保持存活；'private' 防止外部篡改。
    private static ref LootManager s_Instance;

    // 单例拥有的私有数据
    protected ref map<string, int> m_SpawnCounts;

    // 构造函数 — 只调用一次
    void LootManager()
    {
        m_SpawnCounts = new map<string, int>();
    }

    // 析构函数 — 当 s_Instance 被设为 null 时调用
    void ~LootManager()
    {
        m_SpawnCounts = null;
    }

    // 惰性访问器：首次调用时创建
    static LootManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new LootManager();
        }
        return s_Instance;
    }

    // 显式销毁
    static void DestroyInstance()
    {
        s_Instance = null;
    }

    // --- 公共 API ---

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

### 为什么是 `private static ref`？

| 关键字 | 目的 |
|--------|------|
| `private` | 防止其他类将 `s_Instance` 设为 null 或替换它 |
| `static` | 跨所有代码共享 --- 无需实例即可访问 |
| `ref` | 强引用 --- 只要 `s_Instance` 非 null 就保持对象存活 |

没有 `ref`，实例将是弱引用，可能在仍在使用时被垃圾回收。

---

## 惰性初始化 vs 急切初始化

### 惰性初始化（推荐默认方式）

`GetInstance()` 方法在首次访问时创建实例。这是大多数 DayZ 模组使用的方法。

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

**优点：**
- 在实际需要之前不做任何工作
- 不依赖模组间的初始化顺序
- 如果单例是可选的（某些服务器配置可能永远不会调用它），则是安全的

**缺点：**
- 首次调用者承担构造成本（通常可以忽略）

### 急切初始化

某些单例在任务启动期间显式创建，通常从 `MissionServer.OnInit()` 或模块的 `OnMissionStart()` 中创建。

```c
// 在你的 modded MissionServer.OnInit() 中：
void OnInit()
{
    super.OnInit();
    LootManager.Create();  // 急切：现在构造，而非首次使用时
}

// 在 LootManager 中：
static void Create()
{
    if (!s_Instance)
    {
        s_Instance = new LootManager();
    }
}
```

**何时倾向于急切初始化：**
- 单例从磁盘加载数据（配置、JSON 文件），你希望加载错误在启动时暴露
- 单例注册 RPC 处理器，这些处理器必须在任何客户端连接之前就位
- 初始化顺序很重要，你需要显式控制它

---

## 生命周期管理

DayZ 中单例 bug 最常见的来源是在任务结束时未能清理。DayZ 服务器可以在不重启进程的情况下重启任务，这意味着静态字段在任务重启间保留。如果你在 `OnMissionFinish` 中没有将 `s_Instance` 置空，你会将过时的引用、已删除的对象和孤立的回调带入下一个任务。

### 生命周期契约

```
服务器进程启动
  └─ MissionServer.OnInit()
       └─ 创建单例（急切）或让它们自行创建（惰性）
  └─ MissionServer.OnMissionStart()
       └─ 单例开始运行
  └─ ... 服务器运行中 ...
  └─ MissionServer.OnMissionFinish()
       └─ 对每个单例调用 DestroyInstance()
       └─ 所有静态引用设为 null
  └─ （任务可能重启）
       └─ 重新创建新的单例
```

### 清理模式

始终将你的单例与 `DestroyInstance()` 方法配对，并在关闭期间调用它：

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
        s_Instance = null;  // 释放引用，析构函数运行
    }

    void ~VehicleRegistry()
    {
        if (m_Vehicles) m_Vehicles.Clear();
        m_Vehicles = null;
    }
};

// 在你的 modded MissionServer 中：
modded class MissionServer
{
    override void OnMissionFinish()
    {
        VehicleRegistry.DestroyInstance();
        super.OnMissionFinish();
    }
};
```

### 集中关闭模式

框架模组可以将所有单例清理整合到 `MyFramework.ShutdownAll()` 中，从 modded `MissionServer.OnMissionFinish()` 调用。这可以防止遗忘某个单例的常见错误：

```c
// 概念模式（集中关闭）：
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

## 何时使用单例

### 好的候选

| 用例 | 为什么单例有效 |
|------|---------------|
| **管理器类**（LootManager、VehicleManager） | 一个领域恰好一个协调器 |
| **缓存**（CfgVehicles 缓存、图标缓存） | 单一事实来源避免冗余计算 |
| **注册表**（RPC 处理器注册表、模块注册表） | 中央查找必须全局可访问 |
| **配置持有者**（服务器设置、权限） | 每个模组一个配置，从磁盘加载一次 |
| **RPC 分发器** | 所有传入 RPC 的单一入口点 |

### 不好的候选

| 用例 | 为什么不适合 |
|------|-------------|
| **每个玩家的数据** | 每个玩家一个实例，而非一个全局实例 |
| **临时计算** | 创建、使用、丢弃 --- 不需要全局状态 |
| **UI 视图/对话框** | 可以同时存在多个；使用视图堆栈 |
| **实体组件** | 附加到单个对象，而非全局 |

---

## 真实示例

### COT（Community Online Tools）

COT 通过 CF 框架使用基于模块的单例模式。每个工具都是在启动时注册的 `JMModuleBase` 单例：

```c
// COT 模式：CF 自动实例化在 config.cpp 中声明的模块
class JM_COT_ESP : JMModuleBase
{
    // CF 管理单例生命周期
    // 通过以下方式访问：JM_COT_ESP.Cast(GetModuleManager().GetModule(JM_COT_ESP));
}
```

### VPP Admin Tools

VPP 在管理器类上使用显式 `GetInstance()`：

```c
// VPP 模式（简化）
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

Expansion 为每个子系统声明单例，并挂钩到任务生命周期进行清理：

```c
// Expansion 模式（简化）
class ExpansionMarketModule : CF_ModuleWorld
{
    // CF_ModuleWorld 本身就是由 CF 模块系统管理的单例
    // ExpansionMarketModule.Cast(CF_ModuleCoreManager.Get(ExpansionMarketModule));
}
```

---

## 线程安全考虑

Enforce Script 是单线程的。所有脚本执行发生在 Enfusion 引擎游戏循环的主线程上。这意味着：

- 并发线程之间**不存在竞态条件**
- 你**不需要**互斥锁、锁或原子操作
- 带惰性初始化的 `GetInstance()` 始终是安全的

然而，**重入**仍然可能导致问题。如果 `GetInstance()` 在构造期间触发了再次调用 `GetInstance()` 的代码，你可能得到一个部分初始化的单例：

```c
// 危险：重入单例构造
class BadManager
{
    private static ref BadManager s_Instance;

    void BadManager()
    {
        // 这在构造期间调用了 GetInstance()！
        OtherSystem.Register(BadManager.GetInstance());
    }

    static BadManager GetInstance()
    {
        if (!s_Instance)
        {
            // s_Instance 在构造期间仍然为 null
            s_Instance = new BadManager();
        }
        return s_Instance;
    }
};
```

修复方法是在运行任何可能重入的初始化之前先赋值 `s_Instance`：

```c
static BadManager GetInstance()
{
    if (!s_Instance)
    {
        s_Instance = new BadManager();  // 先赋值
        s_Instance.Initialize();         // 然后运行可能调用 GetInstance() 的初始化
    }
    return s_Instance;
}
```

或者更好的做法是完全避免循环初始化。

---

## 反模式

### 1. 没有封装的全局可变状态

单例模式给你全局访问。但这并不意味着数据应该全局可写。

```c
// 不好：公共字段导致不受控的修改
class GameState
{
    private static ref GameState s_Instance;
    int PlayerCount;         // 任何人都可以写
    bool ServerLocked;       // 任何人都可以写
    string CurrentWeather;   // 任何人都可以写

    static GameState GetInstance() { ... }
};

// 任何代码都可以执行：
GameState.GetInstance().PlayerCount = -999;  // 混乱
```

```c
// 好：通过方法控制访问
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

### 2. 缺少 DestroyInstance

如果你忘记清理，单例会在任务重启间持续存在，带有过时数据：

```c
// 不好：没有清理路径
class ZombieTracker
{
    private static ref ZombieTracker s_Instance;
    ref array<Object> m_TrackedZombies;  // 这些对象在任务结束时会被删除！

    static ZombieTracker GetInstance() { ... }
    // 没有 DestroyInstance() — m_TrackedZombies 现在持有死引用
};
```

### 3. 承担所有职责的单例

当一个单例累积太多职责时，它变成一个无法理解的"上帝对象"：

```c
// 不好：一个单例做所有事
class ServerManager
{
    // 管理战利品 AND 载具 AND 天气 AND 生成 AND 封禁 AND...
    ref array<Object> m_Loot;
    ref array<Object> m_Vehicles;
    ref WeatherData m_Weather;
    ref array<string> m_BannedPlayers;

    void SpawnLoot() { ... }
    void DespawnVehicle() { ... }
    void SetWeather() { ... }
    void BanPlayer() { ... }
    // 2000 行之后...
};
```

拆分为专注的单例：`LootManager`、`VehicleManager`、`WeatherManager`、`BanManager`。每个都很小、可测试且有清晰的领域。

### 4. 在其他单例的构造函数中访问单例

这会创建隐藏的初始化顺序依赖：

```c
// 不好：构造函数依赖另一个单例
class ModuleA
{
    void ModuleA()
    {
        // 如果 ModuleB 还没有创建呢？
        ModuleB.GetInstance().Register(this);
    }
};
```

将跨单例注册推迟到 `OnInit()` 或 `OnMissionStart()`，在那里初始化顺序是受控的。

---

## 替代方案：纯静态类

某些"单例"根本不需要实例。如果类不持有实例状态，只有静态方法和静态字段，完全跳过 `GetInstance()` 的仪式：

```c
// 不需要实例 — 全部静态
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

这是框架模组中 `MyLog`、`MyRPC`、`MyEventBus` 和 `MyModuleManager` 使用的方法。它更简单，避免了 `GetInstance()` 的空检查开销，并使意图清晰：没有实例，只有共享状态。

**在以下情况使用纯静态类：**
- 所有方法都是无状态的或操作静态字段
- 没有有意义的构造函数/析构函数逻辑
- 你永远不需要将"实例"作为参数传递

**在以下情况使用真正的单例：**
- 类有受益于封装的实例状态（`protected` 字段）
- 你需要多态（具有重写方法的基类）
- 对象需要通过引用传递给其他系统

---

## 检查清单

发布单例之前，请验证：

- [ ] `s_Instance` 声明为 `private static ref`
- [ ] `GetInstance()` 处理了 null 情况（惰性初始化）或你有显式的 `Create()` 调用
- [ ] `DestroyInstance()` 存在且将 `s_Instance` 设为 `null`
- [ ] `DestroyInstance()` 从 `OnMissionFinish()` 或集中关闭方法中调用
- [ ] 析构函数清理拥有的集合（`.Clear()`，设为 `null`）
- [ ] 没有公共字段 --- 所有修改通过方法进行
- [ ] 构造函数不在其他单例上调用 `GetInstance()`（推迟到 `OnInit()`）

---

## 兼容性与影响

- **多模组：** 每个模组定义各自的单例可以安全共存 --- 每个都有自己的 `s_Instance`。只有当两个模组定义相同的类名时才会产生冲突，Enforce Script 会在加载时将其标记为重定义错误。
- **加载顺序：** 惰性单例不受模组加载顺序的影响。在 `OnInit()` 中创建的急切单例取决于 `modded class` 链的顺序，该顺序遵循 `config.cpp` 的 `requiredAddons`。
- **监听服务器：** 在同一进程中，静态字段在客户端和服务端上下文之间共享。仅应存在于服务端的单例必须使用 `GetGame().IsServer()` 来保护构造，否则它也可以从客户端代码访问（并可能初始化）。
- **性能：** 单例访问是一次静态空检查 + 方法调用 --- 开销可忽略不计。成本在于单例*做什么*，而不是访问它。
- **迁移：** 只要单例调用的 API（例如 `GetGame()`、`JsonFileLoader`）保持稳定，单例就能在 DayZ 版本更新中存活。模式本身不需要特殊迁移。

---

## 常见错误

| 错误 | 影响 | 修复 |
|------|------|------|
| `OnMissionFinish` 中缺少 `DestroyInstance()` 调用 | 过时数据和已删除实体引用在任务重启间保留，导致崩溃或幽灵状态 | 始终从 `OnMissionFinish` 或集中的 `ShutdownAll()` 调用 `DestroyInstance()` |
| 在另一个单例的构造函数中调用 `GetInstance()` | 触发重入构造；`s_Instance` 仍然为 null，因此创建了第二个实例 | 将跨单例访问推迟到构造后调用的 `Initialize()` 方法 |
| 使用 `public static ref` 而非 `private static ref` | 任何代码都可以将 `s_Instance` 设为 null 或替换它，破坏单实例保证 | 始终将 `s_Instance` 声明为 `private static ref` |
| 在监听服务器上未保护急切初始化 | 如果 `Create()` 缺少空检查，单例会被构造两次（一次来自服务端路径，一次来自客户端路径） | 始终在 `Create()` 内部检查 `if (!s_Instance)` |
| 无限制地累积状态（无界缓存） | 在长时间运行的服务器上内存无限增长；最终 OOM 或严重延迟 | 用最大大小限制集合或在 `OnUpdate` 中定期驱逐 |

---

## 理论 vs 实践

| 教科书说 | DayZ 现实 |
|----------|----------|
| 单例是反模式；使用依赖注入 | Enforce Script 没有 DI 容器。单例是所有主要模组中全局管理器的标准方法。 |
| 惰性初始化始终足够 | RPC 处理器必须在任何客户端连接之前注册，因此在 `OnInit()` 中急切初始化通常是必要的。 |
| 单例永远不应被销毁 | DayZ 任务在不重启服务器进程的情况下重启；单例*必须*在每个任务周期被销毁和重新创建。 |

---

[首页](../README.md) | **单例模式** | [下一章：模块系统 >>](02-module-systems.md)
