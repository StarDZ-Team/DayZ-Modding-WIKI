# 第 7.2 章：模块/插件系统

[首页](../README.md) | [<< 上一章：单例模式](01-singletons.md) | **模块/插件系统** | [下一章：RPC 模式 >>](03-rpc-patterns.md)

---

## 简介

每一个严肃的 DayZ mod 框架都使用模块或插件系统，将代码组织成自包含的单元，并具有定义好的生命周期钩子。模块系统不是将初始化逻辑分散在各种 modded mission 类中，而是将自身注册到一个中央管理器，该管理器以可预测的顺序向每个模块分发生命周期事件——`OnInit`、`OnMissionStart`、`OnUpdate`、`OnMissionFinish`。

本章研究四种实际方案：Community Framework 的 `CF_ModuleCore`、VPP 的 `PluginBase` / `ConfigurablePlugin`、Dabs Framework 基于属性的注册，以及自定义的静态模块管理器。每种方案以不同方式解决同样的问题；理解所有四种将帮助你为自己的 mod 选择正确的模式，或与现有框架进行整合。

---

## 目录

- [为什么需要模块？](#为什么需要模块)
- [CF_ModuleCore（COT / Expansion）](#cf_modulecorecot--expansion)
- [VPP PluginBase / ConfigurablePlugin](#vpp-pluginbase--configurableplugin)
- [Dabs 基于属性的注册](#dabs-基于属性的注册)
- [自定义静态模块管理器](#自定义静态模块管理器)
- [模块生命周期：通用契约](#模块生命周期通用契约)
- [模块设计最佳实践](#模块设计最佳实践)
- [对比表](#对比表)

---

## 为什么需要模块？

没有模块系统时，DayZ mod 通常会以一个庞大的 modded `MissionServer` 或 `MissionGameplay` 类告终，不断增长直到无法管理：

```c
// 差：所有东西塞进一个 modded 类
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        InitLootSystem();
        InitVehicleTracker();
        InitBanManager();
        InitWeatherController();
        InitAdminPanel();
        InitKillfeedHUD();
        // ... 还有 20 多个系统
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        TickLootSystem(timeslice);
        TickVehicleTracker(timeslice);
        TickWeatherController(timeslice);
        // ... 还有 20 多个 tick
    }
};
```

模块系统用一个稳定的钩子点取代了这些：

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        MyModuleManager.Register(new LootModule());
        MyModuleManager.Register(new VehicleModule());
        MyModuleManager.Register(new WeatherModule());
    }

    override void OnMissionStart()
    {
        super.OnMissionStart();
        MyModuleManager.OnMissionStart();  // 分发到所有模块
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        MyModuleManager.OnServerUpdate(timeslice);  // 分发到所有模块
    }
};
```

每个模块都是一个独立的类，拥有自己的文件、自己的状态和自己的生命周期钩子。添加新功能意味着添加新模块——而不是编辑一个 3000 行的 mission 类。

---

## CF_ModuleCore（COT / Expansion）

Community Framework（CF）提供了 DayZ modding 生态系统中使用最广泛的模块系统。COT 和 Expansion 都建立在它之上。

### 工作原理

1. 你声明一个继承自 CF 模块基类的模块类
2. 你在 `config.cpp` 的 `CfgPatches` / `CfgMods` 中注册它
3. CF 的 `CF_ModuleCoreManager` 在启动时自动发现并实例化所有注册的模块类
4. 生命周期事件自动分发

### 模块基类

CF 提供了三个对应 DayZ 脚本层的基类：

| 基类 | 层 | 典型用途 |
|-----------|-------|-------------|
| `CF_ModuleGame` | 3_Game | 早期初始化、RPC 注册、数据类 |
| `CF_ModuleWorld` | 4_World | 实体交互、游戏系统 |
| `CF_ModuleMission` | 5_Mission | UI、HUD、任务级钩子 |

### 示例：一个 CF 模块

```c
class MyLootModule : CF_ModuleWorld
{
    // CF 在模块初始化时调用一次
    override void OnInit()
    {
        super.OnInit();
        // 注册 RPC 处理程序，分配数据结构
    }

    // CF 在任务开始时调用
    override void OnMissionStart(Class sender, CF_EventArgs args)
    {
        super.OnMissionStart(sender, args);
        // 加载配置，生成初始战利品
    }

    // CF 在服务器端每帧调用
    override void OnUpdate(Class sender, CF_EventArgs args)
    {
        super.OnUpdate(sender, args);
        // 更新战利品刷新计时器
    }

    // CF 在任务结束时调用
    override void OnMissionFinish(Class sender, CF_EventArgs args)
    {
        super.OnMissionFinish(sender, args);
        // 保存状态，释放资源
    }
};
```

### 访问 CF 模块

```c
// 按类型获取正在运行的模块的引用
MyLootModule lootMod;
CF_Modules<MyLootModule>.Get(lootMod);
if (lootMod)
{
    lootMod.ForceRespawn();
}
```

### 主要特点

- **自动发现**：模块由 CF 根据 `config.cpp` 声明实例化——无需手动 `new` 调用
- **事件参数**：生命周期钩子接收包含上下文数据的 `CF_EventArgs`
- **依赖 CF**：你的 mod 需要 Community Framework 作为依赖
- **广泛支持**：如果你的 mod 面向已经运行 COT 或 Expansion 的服务器，CF 已经存在

---

## VPP PluginBase / ConfigurablePlugin

VPP Admin Tools 使用插件架构，每个管理工具都是一个注册到中央管理器的插件类。

### 插件基类

```c
// VPP 模式（简化版）
class PluginBase : Managed
{
    void OnInit();
    void OnUpdate(float dt);
    void OnDestroy();

    // 插件身份
    string GetPluginName();
    bool IsServerOnly();
};
```

### ConfigurablePlugin

VPP 用一个配置感知的变体扩展了基类，自动加载/保存设置：

```c
class ConfigurablePlugin : PluginBase
{
    // VPP 在初始化时自动从 JSON 加载
    ref PluginConfigBase m_Config;

    override void OnInit()
    {
        super.OnInit();
        LoadConfig();
    }

    void LoadConfig()
    {
        string path = "$profile:VPPAdminTools/" + GetPluginName() + ".json";
        if (FileExist(path))
        {
            JsonFileLoader<PluginConfigBase>.JsonLoadFile(path, m_Config);
        }
    }

    void SaveConfig()
    {
        string path = "$profile:VPPAdminTools/" + GetPluginName() + ".json";
        JsonFileLoader<PluginConfigBase>.JsonSaveFile(path, m_Config);
    }
};
```

### 注册

VPP 在 modded `MissionServer.OnInit()` 中注册插件：

```c
// VPP 模式
GetPluginManager().RegisterPlugin(new VPPESPPlugin());
GetPluginManager().RegisterPlugin(new VPPTeleportPlugin());
GetPluginManager().RegisterPlugin(new VPPWeatherPlugin());
```

### 主要特点

- **手动注册**：每个插件显式 `new` 并注册
- **配置集成**：`ConfigurablePlugin` 将配置管理与模块生命周期合并
- **自包含**：不依赖 CF；VPP 的插件管理器是自有系统
- **明确所有权**：插件管理器持有所有插件的 `ref`，控制其生命周期

---

## Dabs 基于属性的注册

Dabs Framework（用于 Dabs Framework Admin Tools）使用更现代的方式：C# 风格的属性进行自动注册。

### 概念

不再手动注册模块，你用属性注解一个类，框架在启动时通过反射发现它：

```c
// Dabs 模式（概念性的）
[CF_RegisterModule(DabsAdminESP)]
class DabsAdminESP : CF_ModuleWorld
{
    override void OnInit()
    {
        super.OnInit();
        // ...
    }
};
```

`CF_RegisterModule` 属性告诉 CF 的模块管理器自动实例化这个类。不需要手动 `Register()` 调用。

### 发现机制

在启动时，CF 扫描所有加载的脚本类以查找注册属性。对于每个匹配项，它创建一个实例并添加到模块管理器。这在任何模块的 `OnInit()` 被调用之前发生。

### 主要特点

- **零样板代码**：不需要在 mission 类中编写注册代码
- **声明式**：类本身声明它是一个模块
- **依赖 CF**：仅适用于 Community Framework 的属性处理
- **可发现性**：你可以通过搜索代码库中的属性来找到所有模块

---

## 自定义静态模块管理器

这种方式使用显式注册模式和静态管理器类。管理器没有实例——它完全是静态方法和静态存储。当你想要零外部框架依赖时，这很有用。

### 模块基类

```c
// 基类：生命周期钩子
class MyModuleBase : Managed
{
    bool IsServer();       // 在子类中覆盖
    bool IsClient();       // 在子类中覆盖
    string GetModuleName();
    void OnInit();
    void OnMissionStart();
    void OnMissionFinish();
};

// 服务器端模块：添加 OnUpdate + 玩家事件
class MyServerModule : MyModuleBase
{
    void OnUpdate(float dt);
    void OnPlayerConnect(PlayerIdentity identity);
    void OnPlayerDisconnect(PlayerIdentity identity, string uid);
};

// 客户端模块：添加 OnUpdate
class MyClientModule : MyModuleBase
{
    void OnUpdate(float dt);
};
```

### 注册

模块显式注册自身，通常从 modded mission 类：

```c
// 在 modded MissionServer.OnInit() 中：
MyModuleManager.Register(new MyMissionServerModule());
MyModuleManager.Register(new MyAIServerModule());
```

### 生命周期分发

modded mission 类在每个生命周期点调用 `MyModuleManager`：

```c
modded class MissionServer
{
    override void OnMissionStart()
    {
        super.OnMissionStart();
        MyModuleManager.OnMissionStart();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        MyModuleManager.OnServerUpdate(timeslice);
    }

    override void OnMissionFinish()
    {
        MyModuleManager.OnMissionFinish();
        MyModuleManager.Cleanup();
        super.OnMissionFinish();
    }
};
```

### Listen 服务器安全性

自定义模块系统的模块基类强制执行一个关键不变量：`MyServerModule` 从 `IsServer()` 返回 `true`，从 `IsClient()` 返回 `false`，而 `MyClientModule` 相反。管理器使用这些标志来避免在 listen 服务器上重复分发生命周期事件（在 listen 服务器上，`MissionServer` 和 `MissionGameplay` 在同一进程中运行）。

基类 `MyModuleBase` 两者都返回 `true`——这就是代码库警告不要直接从它派生子类的原因。

### 主要特点

- **零依赖**：不需要 CF，不需要外部框架
- **静态管理器**：不需要 `GetInstance()`；纯静态 API
- **显式注册**：完全控制注册什么以及何时注册
- **Listen 服务器安全**：类型化子类防止双重分发
- **集中清理**：`MyModuleManager.Cleanup()` 拆除所有模块和核心计时器

---

## 模块生命周期：通用契约

尽管实现不同，四种框架都遵循相同的生命周期契约：

```
┌─────────────────────────────────────────────────────┐
│  注册/发现                                           │
│  模块实例被创建并注册                                  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnInit()                                            │
│  一次性设置：分配集合，注册 RPC                         │
│  在注册后对每个模块调用一次                              │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionStart()                                    │
│  任务已启动：加载配置，启动计时器，                      │
│  订阅事件，生成初始实体                                 │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnUpdate(float dt)         [每帧重复]                │
│  逐帧更新：处理队列，更新计时器，                        │
│  检查条件，推进状态机                                   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionFinish()                                   │
│  拆除：保存状态，取消订阅事件，                          │
│  清空集合，将引用置空                                   │
└─────────────────────────────────────────────────────┘
```

### 规则

1. **OnInit 在 OnMissionStart 之前。** 永远不要在 `OnInit()` 中加载配置或生成实体——世界可能尚未就绪。
2. **OnUpdate 接收 delta time。** 始终使用 `dt` 进行基于时间的逻辑，永远不要假设固定帧率。
3. **OnMissionFinish 必须清理一切。** 每个 `ref` 集合必须被清空。每个事件订阅必须被移除。每个单例必须被销毁。这是唯一可靠的拆除点。
4. **模块不应依赖彼此的初始化顺序。** 如果模块 A 需要模块 B，使用延迟访问（`GetModule()`）而不是假设 B 已经先注册。

---

## 模块设计最佳实践

### 1. 一个模块，一个职责

一个模块应该恰好拥有一个领域。如果你发现自己在写 `VehicleAndWeatherAndLootModule`，就拆分它。

```c
// 好：专注的模块
class MyLootModule : MyServerModule { ... }
class MyVehicleModule : MyServerModule { ... }
class MyWeatherModule : MyServerModule { ... }

// 差：上帝模块
class MyEverythingModule : MyServerModule { ... }
```

### 2. 保持 OnUpdate 轻量

`OnUpdate` 每帧运行。如果你的模块做昂贵的工作（文件 I/O、世界扫描、寻路），就用计时器或跨帧批处理：

```c
class MyCleanupModule : MyServerModule
{
    protected float m_CleanupTimer;
    protected const float CLEANUP_INTERVAL = 300.0;  // 每 5 分钟

    override void OnUpdate(float dt)
    {
        m_CleanupTimer += dt;
        if (m_CleanupTimer >= CLEANUP_INTERVAL)
        {
            m_CleanupTimer = 0;
            RunCleanup();
        }
    }
};
```

### 3. 在 OnInit 中注册 RPC，而不是 OnMissionStart

RPC 处理程序必须在任何客户端能发送消息之前就位。`OnInit()` 在模块注册期间运行，发生在任务设置的早期。如果客户端连接快，`OnMissionStart()` 可能太晚了。

```c
class MyModule : MyServerModule
{
    override void OnInit()
    {
        super.OnInit();
        MyRPC.Register("MyMod", "RPC_DoThing", this, MyRPCSide.SERVER);
    }

    void RPC_DoThing(PlayerIdentity sender, Object target, ParamsReadContext ctx)
    {
        // 处理 RPC
    }
};
```

### 4. 使用模块管理器进行跨模块访问

不要持有对其他模块的直接引用。使用管理器的查找功能：

```c
// 好：通过管理器实现松耦合
MyModuleBase mod = MyModuleManager.GetModule("MyAIServerModule");
MyAIServerModule aiMod;
if (Class.CastTo(aiMod, mod))
{
    aiMod.PauseSpawning();
}

// 差：直接静态引用造成硬耦合
MyAIServerModule.s_Instance.PauseSpawning();
```

### 5. 防范缺失的依赖

并非每个服务器都运行每个 mod。如果你的模块可选地与另一个 mod 集成，使用预处理器检查：

```c
override void OnMissionStart()
{
    super.OnMissionStart();

    #ifdef MYMOD_AI
    MyEventBus.OnMissionStarted.Insert(OnAIMissionStarted);
    #endif
}
```

### 6. 记录模块生命周期事件

日志使调试变得简单。每个模块应在初始化和关闭时记录日志：

```c
override void OnInit()
{
    super.OnInit();
    MyLog.Info("MyModule", "Initialized");
}

override void OnMissionFinish()
{
    MyLog.Info("MyModule", "Shutting down");
    // 清理...
}
```

---

## 对比表

| 功能 | CF_ModuleCore | VPP Plugin | Dabs 属性 | 自定义模块 |
|---------|--------------|------------|----------------|---------------|
| **发现** | config.cpp + 自动 | 手动 `Register()` | 属性扫描 | 手动 `Register()` |
| **基类** | Game / World / Mission | PluginBase / ConfigurablePlugin | CF_ModuleWorld + 属性 | ServerModule / ClientModule |
| **依赖** | 需要 CF | 自包含 | 需要 CF | 自包含 |
| **Listen 服务器安全** | CF 处理 | 手动检查 | CF 处理 | 类型化子类 |
| **配置集成** | 独立 | 内置于 ConfigurablePlugin | 独立 | 通过 MyConfigManager |
| **Update 分发** | 自动 | 管理器调用 `OnUpdate` | 自动 | 管理器调用 `OnUpdate` |
| **清理** | CF 处理 | 手动 `OnDestroy` | CF 处理 | `MyModuleManager.Cleanup()` |
| **跨 mod 访问** | `CF_Modules<T>.Get()` | `GetPluginManager().Get()` | `CF_Modules<T>.Get()` | `MyModuleManager.GetModule()` |

选择与你 mod 的依赖情况匹配的方式。如果你已经依赖 CF，使用 `CF_ModuleCore`。如果你想要零外部依赖，按照自定义管理器或 VPP 模式构建自己的系统。

---

## 兼容性与影响

- **多 Mod：** 多个 mod 可以各自向同一管理器（CF、VPP 或自定义）注册自己的模块。只有两个 mod 注册相同的类类型时才会发生命名冲突——使用带有你 mod 标签前缀的唯一类名。
- **加载顺序：** CF 从 `config.cpp` 自动发现模块，因此加载顺序遵循 `requiredAddons`。自定义管理器在 `OnInit()` 中注册模块，其中 `modded class` 链决定顺序。模块不应依赖注册顺序——使用延迟访问模式。
- **Listen 服务器：** 在 listen 服务器上，`MissionServer` 和 `MissionGameplay` 在同一进程中运行。如果你的模块管理器从两者都分发 `OnUpdate`，模块会收到双倍的 tick。使用返回 `IsServer()` 或 `IsClient()` 的类型化子类（`ServerModule` / `ClientModule`）来防止这种情况。
- **性能：** 模块分发为每个注册模块的每个生命周期调用增加一次循环迭代。对于 10-20 个模块，这可以忽略不计。确保单个模块的 `OnUpdate` 方法开销小（见第 7.7 章）。
- **迁移：** 升级 DayZ 版本时，只要基类 API（`CF_ModuleWorld`、`PluginBase` 等）没有变化，模块系统就是稳定的。固定你的 CF 依赖版本以避免破坏。

---

## 常见错误

| 错误 | 影响 | 修复 |
|---------|--------|-----|
| 模块中缺少 `OnMissionFinish` 清理 | 集合、计时器和事件订阅在任务重启之间存活，导致过期数据或崩溃 | 覆盖 `OnMissionFinish`，清空所有 `ref` 集合，取消订阅所有事件 |
| 在 listen 服务器上双重分发生命周期事件 | 服务器模块运行客户端逻辑，反之亦然；重复生成，双重 RPC 发送 | 使用 `IsServer()` / `IsClient()` 守卫或强制分离的类型化模块子类 |
| 在 `OnMissionStart` 而不是 `OnInit` 中注册 RPC | 在任务设置期间连接的客户端可以在处理程序准备好之前发送 RPC——消息被静默丢弃 | 始终在 `OnInit()` 中注册 RPC 处理程序，它在模块注册期间、任何客户端连接之前运行 |
| 一个处理所有事情的"上帝模块" | 无法调试、测试或扩展；多个开发者同时工作时发生合并冲突 | 拆分为各自承担单一职责的专注模块 |
| 持有对另一个模块实例的直接 `ref` | 造成硬耦合和潜在的 ref 循环内存泄漏 | 使用模块管理器的查找功能（`GetModule()`、`CF_Modules<T>.Get()`）进行跨模块访问 |

---

## 理论与实践

| 教科书说 | DayZ 现实 |
|---------------|-------------|
| 模块发现应通过反射自动进行 | Enforce Script 反射有限；基于 `config.cpp` 的发现（CF）或显式 `Register()` 调用是唯一可靠的方式 |
| 模块应在运行时可热交换 | DayZ 不支持脚本热重载；模块在整个任务生命周期中存活 |
| 使用接口定义模块契约 | Enforce Script 没有 `interface` 关键字；使用基类虚方法（`override`）替代 |
| 依赖注入解耦模块 | 不存在 DI 框架；使用管理器查找和 `#ifdef` 守卫处理可选的跨 mod 依赖 |

---

[首页](../README.md) | [<< 上一章：单例模式](01-singletons.md) | **模块/插件系统** | [下一章：RPC 模式 >>](03-rpc-patterns.md)
