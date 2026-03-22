# 第 8.9 章：专业模组模板

[首页](../README.md) | [<< 上一章：构建 HUD 覆盖层](08-hud-overlay.md) | **专业模组模板** | [下一章：创建自定义载具 >>](10-vehicle-mod.md)

---

> **摘要：** 本章提供了一个完整的、可用于生产环境的模组模板，包含专业 DayZ 模组所需的每个文件。与介绍 InclementDab 入门骨架的[第 8.5 章](05-mod-template.md)不同，这是一个功能完整的模板，包含配置系统、单例管理器、客户端-服务器 RPC、UI 面板、快捷键绑定、本地化和构建自动化。每个文件都可以直接复制粘贴使用，并附有详细注释来解释**每一行存在的原因**。

---

## 目录

- [概述](#overview)
- [完整目录结构](#complete-directory-structure)
- [mod.cpp](#modcpp)
- [config.cpp](#configcpp)
- [常量文件（3_Game）](#constants-file-3_game)
- [配置数据类（3_Game）](#config-data-class-3_game)
- [RPC 定义（3_Game）](#rpc-definitions-3_game)
- [管理器单例（4_World）](#manager-singleton-4_world)
- [玩家事件处理器（4_World）](#player-event-handler-4_world)
- [任务钩子：服务器（5_Mission）](#mission-hook-server-5_mission)
- [任务钩子：客户端（5_Mission）](#mission-hook-client-5_mission)
- [UI 面板脚本（5_Mission）](#ui-panel-script-5_mission)
- [布局文件](#layout-file)
- [stringtable.csv](#stringtablecsv)
- [Inputs.xml](#inputsxml)
- [构建脚本](#build-script)
- [自定义指南](#customization-guide)
- [功能扩展指南](#feature-expansion-guide)
- [下一步](#next-steps)

---

## 概述

"Hello World" 模组证明了工具链能正常工作。但专业模组需要更多：

| 关注点 | Hello World | 专业模板 |
|---------|-------------|----------------------|
| 配置 | 硬编码值 | 带有加载/保存/默认值的 JSON 配置 |
| 通信 | Print 语句 | 字符串路由的 RPC（客户端到服务器及返回） |
| 架构 | 一个文件，一个函数 | 单例管理器、分层脚本、干净的生命周期 |
| 用户界面 | 无 | 布局驱动的 UI 面板，支持打开/关闭 |
| 输入绑定 | 无 | 在选项 > 控制中显示的自定义快捷键 |
| 本地化 | 无 | 支持 13 种语言的 stringtable.csv |
| 构建流水线 | 手动 Addon Builder | 一键批处理脚本 |
| 清理 | 无 | 任务结束时正确关闭，无泄漏 |

此模板为你提供了开箱即用的所有这些。你只需重命名标识符，删除不需要的系统，然后在坚实的基础上开始构建你的实际功能。

---

## 完整目录结构

这是完整的源代码布局。下面列出的每个文件都作为完整模板在本章中提供。

```
MyProfessionalMod/                          <-- 源代码根目录（位于 P: 盘）
    mod.cpp                                 <-- 启动器元数据
    Scripts/
        config.cpp                          <-- 引擎注册（CfgPatches + CfgMods）
        Inputs.xml                          <-- 快捷键定义
        stringtable.csv                     <-- 本地化字符串（13 种语言）
        3_Game/
            MyMod/
                MyModConstants.c            <-- 枚举、版本字符串、共享常量
                MyModConfig.c               <-- 可 JSON 序列化的配置（带默认值）
                MyModRPC.c                  <-- RPC 路由名称和注册
        4_World/
            MyMod/
                MyModManager.c              <-- 单例管理器（生命周期、配置、状态）
                MyModPlayerHandler.c        <-- 玩家连接/断开钩子
        5_Mission/
            MyMod/
                MyModMissionServer.c        <-- modded MissionServer（服务器初始化/关闭）
                MyModMissionClient.c        <-- modded MissionGameplay（客户端初始化/关闭）
                MyModUI.c                   <-- UI 面板脚本（打开/关闭/填充）
        GUI/
            layouts/
                MyModPanel.layout           <-- UI 布局定义
    build.bat                               <-- PBO 打包自动化

构建后，可分发的模组文件夹如下所示：

@MyProfessionalMod/                         <-- 放在服务器 / 创意工坊上的内容
    mod.cpp
    addons/
        MyProfessionalMod_Scripts.pbo       <-- 从 Scripts/ 打包
    keys/
        MyMod.bikey                         <-- 签名服务器的密钥
    meta.cpp                                <-- 创意工坊元数据（自动生成）
```

---

## mod.cpp

此文件控制玩家在 DayZ 启动器中看到的内容。它放在模组根目录，**不在** `Scripts/` 内部。

```cpp
// ==========================================================================
// mod.cpp - DayZ 启动器的模组身份
// 此文件由启动器读取以在模组列表中显示模组信息。
// 它不会被脚本引擎编译——它是纯元数据。
// ==========================================================================

// 在启动器模组列表和游戏内模组界面中显示的名称。
name         = "My Professional Mod";

// 你的名字或团队名称。显示在"作者"列中。
author       = "YourName";

// 语义化版本字符串。每次发布时更新。
// 启动器显示此信息以便玩家知道他们拥有哪个版本。
version      = "1.0.0";

// 在启动器中悬停在模组上时显示的简短描述。
// 保持在 200 个字符以内以保持可读性。
overview     = "A professional mod template with config, RPC, UI, and keybinds.";

// 悬停时显示的工具提示。通常与模组名称匹配。
tooltipOwned = "My Professional Mod";

// 可选：预览图像的路径（相对于模组根目录）。
// 推荐尺寸：256x256 或 512x512，PAA 或 EDDS 格式。
// 如果还没有图像，留空。
picture      = "";

// 可选：在模组详情面板中显示的 logo。
logo         = "";
logoSmall    = "";
logoOver     = "";

// 可选：玩家在启动器中点击"网站"时打开的 URL。
action       = "";
actionURL    = "";
```

---

## config.cpp

这是最关键的文件。它向引擎注册你的模组、声明依赖关系、连接脚本层级，并可选地设置预处理器定义和图像集。

放在 `Scripts/config.cpp`。

```cpp
// ==========================================================================
// config.cpp - 引擎注册
// DayZ 引擎读取此文件以了解你的模组提供了什么。
// 有两个部分重要：CfgPatches（依赖关系图）和 CfgMods（脚本加载）。
// ==========================================================================

// --------------------------------------------------------------------------
// CfgPatches - 依赖声明
// 引擎使用此来确定加载顺序。如果你的模组依赖于
// 另一个模组，在 requiredAddons[] 中列出该模组的 CfgPatches 类。
// --------------------------------------------------------------------------
class CfgPatches
{
    // 类名在所有模组中必须全局唯一。
    // 命名约定：ModName_Scripts（与 PBO 名称匹配）。
    class MyMod_Scripts
    {
        // units[] 和 weapons[] 声明此插件定义的配置类。
        // 对于纯脚本模组，留空。它们由在 config.cpp 中
        // 定义新物品、武器或载具的模组使用。
        units[] = {};
        weapons[] = {};

        // 最低引擎版本。0.1 适用于所有当前的 DayZ 版本。
        requiredVersion = 0.1;

        // 依赖项：列出其他模组的 CfgPatches 类名。
        // "DZ_Data" 是基础游戏——每个模组都应该依赖它。
        // 如果使用 Community Framework，添加 "CF_Scripts"。
        // 如果扩展其他模组，添加它们的补丁。
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

// --------------------------------------------------------------------------
// CfgMods - 脚本模块注册
// 告诉引擎每个脚本层级的位置以及要设置的定义。
// --------------------------------------------------------------------------
class CfgMods
{
    // 这里的类名是你的模组的内部标识符。
    // 它不需要与 CfgPatches 匹配——但保持相关性
    // 使代码库更容易导航。
    class MyMod
    {
        // dir：P: 盘上（或 PBO 中）的文件夹名称。
        // 必须与你的实际根文件夹名称完全匹配。
        dir = "MyProfessionalMod";

        // 显示名称（在 Workbench 和一些引擎日志中显示）。
        name = "My Professional Mod";

        // 引擎元数据的作者和描述。
        author = "YourName";
        overview = "Professional mod template";

        // 模组类型。脚本模组始终为 "mod"。
        type = "mod";

        // credits：可选的 Credits.json 文件路径。
        // creditsJson = "MyProfessionalMod/Scripts/Credits.json";

        // inputs：自定义快捷键的 Inputs.xml 路径。
        // 必须在这里设置，引擎才会加载你的快捷键。
        inputs = "MyProfessionalMod/Scripts/Inputs.xml";

        // defines：加载模组时设置的预处理器符号。
        // 其他模组可以使用 #ifdef MYMOD 来检测你的模组是否存在
        // 并有条件地编译集成代码。
        defines[] = { "MYMOD" };

        // dependencies：你的模组挂接到哪些原版脚本模块。
        // "Game" = 3_Game，"World" = 4_World，"Mission" = 5_Mission。
        // 大多数模组需要全部三个。只有使用 1_Core 时才添加 "Core"。
        dependencies[] =
        {
            "Game", "World", "Mission"
        };

        // defs：将每个脚本模块映射到其磁盘上的文件夹。
        // 引擎递归编译在这些路径中找到的所有 .c 文件。
        // Enforce Script 中没有 #include——这就是文件加载的方式。
        class defs
        {
            // imageSets：注册 .imageset 文件以在布局中使用。
            // 仅在你有自定义图标/贴图用于 UI 时才需要。
            // 如果添加了图像集，取消注释并更新路径。
            //
            // class imageSets
            // {
            //     files[] =
            //     {
            //         "MyProfessionalMod/GUI/imagesets/mymod_icons.imageset"
            //     };
            // };

            // Game 层（3_Game）：最先加载。
            // 在这里放置枚举、常量、配置类、RPC 定义。
            // 不能引用 4_World 或 5_Mission 的类型。
            class gameScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/3_Game" };
            };

            // World 层（4_World）：第二个加载。
            // 在这里放置管理器、实体修改、世界交互。
            // 可以引用 3_Game 类型。不能引用 5_Mission 类型。
            class worldScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/4_World" };
            };

            // Mission 层（5_Mission）：最后加载。
            // 在这里放置任务钩子、UI 面板、启动/关闭逻辑。
            // 可以引用所有更低层级的类型。
            class missionScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/5_Mission" };
            };
        };
    };
};
```

---

## 常量文件（3_Game）

放在 `Scripts/3_Game/MyMod/MyModConstants.c`。

此文件定义所有共享常量、枚举和版本字符串。它位于 `3_Game` 中，以便每个更高层级都能访问这些值。

```c
// ==========================================================================
// MyModConstants.c - 共享常量和枚举
// 3_Game 层：对所有更高层级（4_World、5_Mission）可用。
//
// 为什么此文件存在：
//   集中常量可以防止魔术数字分散在各个文件中。
//   枚举提供编译时安全性，而不是原始 int 比较。
//   版本字符串只定义一次，在日志和 UI 中使用。
// ==========================================================================

// ---------------------------------------------------------------------------
// 版本 - 每次发布时更新
// ---------------------------------------------------------------------------
const string MYMOD_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// 日志标签 - 此模组所有 Print/日志消息的前缀
// 使用一致的标签使过滤脚本日志变得容易。
// ---------------------------------------------------------------------------
const string MYMOD_TAG = "[MyMod]";

// ---------------------------------------------------------------------------
// 文件路径 - 集中管理以便在一个地方捕获拼写错误
// $profile: 在运行时解析为服务器的配置文件目录。
// ---------------------------------------------------------------------------
const string MYMOD_CONFIG_DIR  = "$profile:MyMod";
const string MYMOD_CONFIG_PATH = "$profile:MyMod/config.json";

// ---------------------------------------------------------------------------
// 枚举：功能模式
// 使用枚举而不是原始 int 以提高可读性和编译时检查。
// ---------------------------------------------------------------------------
enum MyModMode
{
    DISABLED = 0,    // 功能关闭
    PASSIVE  = 1,    // 功能运行但不干预
    ACTIVE   = 2     // 功能完全启用
};

// ---------------------------------------------------------------------------
// 枚举：通知类型（UI 用来选择图标/颜色）
// ---------------------------------------------------------------------------
enum MyModNotifyType
{
    INFO    = 0,
    SUCCESS = 1,
    WARNING = 2,
    ERROR   = 3
};
```

---

## 配置数据类（3_Game）

放在 `Scripts/3_Game/MyMod/MyModConfig.c`。

这是一个可 JSON 序列化的设置类。服务器在启动时加载它。如果文件不存在，使用默认值并将新配置保存到磁盘。

```c
// ==========================================================================
// MyModConfig.c - 带默认值的 JSON 配置
// 3_Game 层，以便 4_World 管理器和 5_Mission 钩子都能读取。
//
// 工作原理：
//   JsonFileLoader<MyModConfig> 使用 Enforce Script 的内置 JSON
//   序列化器。每个带默认值的字段都会写入/读取 JSON 文件。
//   添加新字段是安全的——旧配置文件对于缺失的字段
//   会简单地获取默认值。
//
// ENFORCE SCRIPT 注意事项：
//   JsonFileLoader<T>.JsonLoadFile(path, obj) 返回 VOID。
//   你不能这样做：if (JsonFileLoader<T>.JsonLoadFile(...))——它不会编译。
//   始终通过引用传递一个预创建的对象。
// ==========================================================================

class MyModConfig
{
    // --- 常规设置 ---

    // 主开关：如果为 false，整个模组被禁用。
    bool Enabled = true;

    // 管理器运行其更新周期的频率（秒）。
    // 更低的值 = 更灵敏但 CPU 成本更高。
    float UpdateInterval = 5.0;

    // 此模组同时管理的最大物品/实体数量。
    int MaxItems = 100;

    // 模式：0 = DISABLED，1 = PASSIVE，2 = ACTIVE（见 MyModMode 枚举）。
    int Mode = 2;

    // --- 消息 ---

    // 玩家连接时显示的欢迎消息。
    // 空字符串 = 不显示消息。
    string WelcomeMessage = "Welcome to the server!";

    // 是否将欢迎消息显示为通知或聊天消息。
    bool WelcomeAsNotification = true;

    // --- 日志 ---

    // 启用详细调试日志。生产服务器请关闭。
    bool DebugLogging = false;

    // -----------------------------------------------------------------------
    // Load - 从磁盘读取配置，如果缺失则返回带默认值的实例
    // -----------------------------------------------------------------------
    static MyModConfig Load()
    {
        // 始终先创建一个新实例。这确保即使 JSON 文件
        // 缺少字段（例如，更新后添加了新设置），
        // 所有默认值都已设置。
        MyModConfig cfg = new MyModConfig();

        // 在尝试加载之前检查配置文件是否存在。
        // 首次运行时，它不会存在——我们使用默认值并保存。
        if (FileExist(MYMOD_CONFIG_PATH))
        {
            // JsonLoadFile 填充现有对象。它不会返回
            // 新对象。JSON 中存在的字段覆盖默认值；
            // JSON 中缺失的字段保留其默认值。
            JsonFileLoader<MyModConfig>.JsonLoadFile(MYMOD_CONFIG_PATH, cfg);
        }
        else
        {
            // 首次运行：保存默认值，以便管理员有一个可编辑的文件。
            cfg.Save();
            Print(MYMOD_TAG + " No config found, created default at: " + MYMOD_CONFIG_PATH);
        }

        return cfg;
    }

    // -----------------------------------------------------------------------
    // Save - 将当前值作为格式化的 JSON 写入磁盘
    // -----------------------------------------------------------------------
    void Save()
    {
        // 确保目录存在。即使目录已经存在，
        // MakeDirectory 也可以安全调用。
        if (!FileExist(MYMOD_CONFIG_DIR))
        {
            MakeDirectory(MYMOD_CONFIG_DIR);
        }

        // JsonSaveFile 将所有字段写为 JSON 对象。
        // 文件被完全覆盖——不存在合并。
        JsonFileLoader<MyModConfig>.JsonSaveFile(MYMOD_CONFIG_PATH, this);
    }
};
```

磁盘上生成的 `config.json` 如下所示：

```json
{
    "Enabled": true,
    "UpdateInterval": 5.0,
    "MaxItems": 100,
    "Mode": 2,
    "WelcomeMessage": "Welcome to the server!",
    "WelcomeAsNotification": true,
    "DebugLogging": false
}
```

管理员编辑此文件，重启服务器，新值即生效。

---

## RPC 定义（3_Game）

放在 `Scripts/3_Game/MyMod/MyModRPC.c`。

RPC（远程过程调用）是 DayZ 中客户端和服务器通信的方式。此文件定义路由名称并提供注册辅助方法。

```c
// ==========================================================================
// MyModRPC.c - RPC 路由定义和辅助方法
// 3_Game 层：路由名称常量必须在任何地方都可用。
//
// DayZ 中 RPC 的工作原理：
//   引擎提供 ScriptRPC 和 OnRPC 用于发送/接收数据。
//   你调用 GetGame().RPCSingleParam() 或创建 ScriptRPC，将
//   数据写入其中，然后发送。接收方按相同顺序读取数据。
//
//   DayZ 使用整数 RPC ID。为避免模组间冲突，每个
//   模组应选择唯一的 ID 范围或使用字符串路由系统。
//   此模板使用单个唯一整数 ID 加字符串前缀
//   来标识哪个处理器应处理每条消息。
//
// 模式：
//   1. 客户端需要数据 -> 发送请求 RPC 到服务器
//   2. 服务器处理 -> 发送响应 RPC 回客户端
//   3. 客户端接收 -> 更新 UI 或状态
// ==========================================================================

// ---------------------------------------------------------------------------
// RPC ID - 选择一个不太可能与其他模组冲突的唯一数字。
// 查看 DayZ 社区 wiki 了解常用范围。
// 引擎内置 RPC 使用低数字（0-1000）。
// 命名约定：使用基于你模组名称哈希的 5 位数字。
// ---------------------------------------------------------------------------
const int MYMOD_RPC_ID = 74291;

// ---------------------------------------------------------------------------
// RPC 路由名称 - 每个 RPC 端点的字符串标识符。
// 使用常量可以防止拼写错误并启用 IDE 搜索。
// ---------------------------------------------------------------------------
const string MYMOD_RPC_CONFIG_SYNC     = "MyMod:ConfigSync";
const string MYMOD_RPC_WELCOME         = "MyMod:Welcome";
const string MYMOD_RPC_PLAYER_DATA     = "MyMod:PlayerData";
const string MYMOD_RPC_UI_REQUEST      = "MyMod:UIRequest";
const string MYMOD_RPC_UI_RESPONSE     = "MyMod:UIResponse";

// ---------------------------------------------------------------------------
// MyModRPCHelper - 用于发送 RPC 的静态工具类
// 封装了创建 ScriptRPC、写入路由字符串、写入负载和调用 Send() 的样板代码。
// ---------------------------------------------------------------------------
class MyModRPCHelper
{
    // 从服务器向特定客户端发送字符串消息。
    // identity：目标玩家。null = 广播给所有人。
    // routeName：哪个处理器应处理此消息（例如 MYMOD_RPC_WELCOME）。
    // message：字符串负载。
    static void SendStringToClient(PlayerIdentity identity, string routeName, string message)
    {
        // 创建 RPC 对象。这是信封。
        ScriptRPC rpc = new ScriptRPC();

        // 先写入路由名称。接收方读取此来决定
        // 调用哪个处理器。始终以相同顺序写入/读取。
        rpc.Write(routeName);

        // 写入负载数据。
        rpc.Write(message);

        // 发送到客户端。参数：
        //   null    = 无目标对象（自定义 RPC 不需要玩家实体）
        //   MYMOD_RPC_ID = 我们的唯一 RPC 通道
        //   true    = 保证传递（类似 TCP）。频繁更新使用 false。
        //   identity = 目标客户端。null 将广播给所有客户端。
        rpc.Send(null, MYMOD_RPC_ID, true, identity);
    }

    // 从客户端向服务器发送请求（无负载，仅路由）。
    static void SendRequestToServer(string routeName)
    {
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(routeName);
        // 发送到服务器时，identity 为 null（服务器没有 PlayerIdentity）。
        // guaranteed = true 确保消息到达。
        rpc.Send(null, MYMOD_RPC_ID, true, null);
    }
};
```

---

## 管理器单例（4_World）

放在 `Scripts/4_World/MyMod/MyModManager.c`。

这是你的模组在服务器端的中央大脑。它拥有配置、处理 RPC 并运行周期性更新。

```c
// ==========================================================================
// MyModManager.c - 服务器端单例管理器
// 4_World 层：可以引用 3_Game 类型（配置、常量、RPC）。
//
// 为什么使用单例：
//   管理器需要在整个任务期间恰好存在一个实例。
//   多个实例会导致重复处理和状态冲突。
//   单例模式保证一个实例并通过 GetInstance() 提供全局访问。
//
// 生命周期：
//   1. MissionServer.OnInit() 调用 MyModManager.GetInstance().Init()
//   2. 管理器加载配置、注册 RPC、启动计时器
//   3. 管理器在游戏过程中处理事件
//   4. MissionServer.OnMissionFinish() 调用 MyModManager.Cleanup()
//   5. 单例被销毁，所有引用被释放
// ==========================================================================

class MyModManager
{
    // 单个实例。'ref' 表示此类拥有对象。
    // 当 s_Instance 设置为 null 时，对象被销毁。
    private static ref MyModManager s_Instance;

    // 从磁盘加载的配置。
    // 'ref' 因为管理器拥有配置对象的生命周期。
    protected ref MyModConfig m_Config;

    // 自上次更新周期以来的累积时间（秒）。
    protected float m_TimeSinceUpdate;

    // 跟踪 Init() 是否已成功调用。
    protected bool m_Initialized;

    // -----------------------------------------------------------------------
    // 单例访问
    // -----------------------------------------------------------------------

    static MyModManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new MyModManager();
        }
        return s_Instance;
    }

    // 在任务结束时调用以销毁单例并释放内存。
    // 将 s_Instance 设置为 null 会触发析构函数。
    static void Cleanup()
    {
        s_Instance = null;
    }

    // -----------------------------------------------------------------------
    // 生命周期
    // -----------------------------------------------------------------------

    // 从 MissionServer.OnInit() 调用一次。
    void Init()
    {
        if (m_Initialized) return;

        // 从磁盘加载配置（首次运行时创建默认值）。
        m_Config = MyModConfig.Load();

        if (!m_Config.Enabled)
        {
            Print(MYMOD_TAG + " Mod is DISABLED in config. Skipping initialization.");
            return;
        }

        // 重置更新计时器。
        m_TimeSinceUpdate = 0;

        m_Initialized = true;

        Print(MYMOD_TAG + " Manager initialized (v" + MYMOD_VERSION + ")");

        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " Debug logging enabled");
            Print(MYMOD_TAG + " Update interval: " + m_Config.UpdateInterval.ToString() + "s");
            Print(MYMOD_TAG + " Max items: " + m_Config.MaxItems.ToString());
        }
    }

    // 每帧从 MissionServer.OnUpdate() 调用。
    // timeslice 是自上一帧以来经过的秒数。
    void OnUpdate(float timeslice)
    {
        if (!m_Initialized || !m_Config.Enabled) return;

        // 累积时间并仅在配置的间隔处理。
        // 这防止了每帧都运行昂贵的逻辑。
        m_TimeSinceUpdate += timeslice;
        if (m_TimeSinceUpdate < m_Config.UpdateInterval) return;
        m_TimeSinceUpdate = 0;

        // --- 周期性更新逻辑在这里 ---
        // 示例：遍历追踪的实体、检查条件等。
        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " Periodic update tick");
        }
    }

    // 当任务结束（服务器关闭或重启）时调用。
    void Shutdown()
    {
        if (!m_Initialized) return;

        Print(MYMOD_TAG + " Manager shutting down");

        // 如果需要，保存运行时状态。
        // m_Config.Save();

        m_Initialized = false;
    }

    // -----------------------------------------------------------------------
    // RPC 处理器
    // -----------------------------------------------------------------------

    // 当客户端请求 UI 数据时调用。
    // sender：发送请求的玩家。
    // ctx：数据流（已跳过路由名称）。
    void OnUIRequest(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender) return;

        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " UI data requested by: " + sender.GetName());
        }

        // 构建响应数据并发送回。
        // 在实际模组中，你会在这里收集实际数据。
        string responseData = "Items: " + m_Config.MaxItems.ToString();
        MyModRPCHelper.SendStringToClient(sender, MYMOD_RPC_UI_RESPONSE, responseData);
    }

    // 当玩家连接时调用。如果已配置，发送欢迎消息。
    void OnPlayerConnected(PlayerIdentity identity)
    {
        if (!m_Initialized || !m_Config.Enabled) return;
        if (!identity) return;

        // 如果已配置，发送欢迎消息。
        if (m_Config.WelcomeMessage != "")
        {
            MyModRPCHelper.SendStringToClient(identity, MYMOD_RPC_WELCOME, m_Config.WelcomeMessage);

            if (m_Config.DebugLogging)
            {
                Print(MYMOD_TAG + " Sent welcome to: " + identity.GetName());
            }
        }
    }

    // -----------------------------------------------------------------------
    // 访问器
    // -----------------------------------------------------------------------

    MyModConfig GetConfig()
    {
        return m_Config;
    }

    bool IsInitialized()
    {
        return m_Initialized;
    }
};
```

---

## 玩家事件处理器（4_World）

放在 `Scripts/4_World/MyMod/MyModPlayerHandler.c`。

这使用 `modded class` 模式挂接到原版 `PlayerBase` 实体并检测连接/断开事件。

```c
// ==========================================================================
// MyModPlayerHandler.c - 玩家生命周期钩子
// 4_World 层：modded PlayerBase 以拦截连接/断开。
//
// 为什么使用 modded class：
//   DayZ 没有 "玩家已连接" 事件回调。标准模式是
//   覆盖 MissionServer 上的方法（用于新连接）或挂接到
//   PlayerBase（用于实体级事件如死亡）。
//   我们在这里使用 modded PlayerBase 来演示实体级钩子。
//
// 重要：
//   在覆盖中始终首先调用 super.MethodName()。不这样做会
//   破坏原版行为链以及同样覆盖该方法的其他模组。
// ==========================================================================

modded class PlayerBase
{
    // 跟踪我们是否已为此玩家发送了初始化事件。
    // 这防止了 Init() 被多次调用时的重复处理。
    protected bool m_MyModPlayerReady;

    // -----------------------------------------------------------------------
    // 在玩家实体完全创建和复制后调用。
    // 在服务器上，这是玩家"准备好"接收 RPC 的地方。
    // -----------------------------------------------------------------------
    override void Init()
    {
        super.Init();

        // 仅在服务器上运行。GetGame().IsServer() 在
        // 专用服务器和监听服务器的主机上返回 true。
        if (!GetGame().IsServer()) return;

        // 防止重复初始化。
        if (m_MyModPlayerReady) return;
        m_MyModPlayerReady = true;

        // 获取玩家的网络身份。
        // 在服务器上，GetIdentity() 返回包含玩家
        // 名称、Steam ID（PlainId）和 UID 的 PlayerIdentity 对象。
        PlayerIdentity identity = GetIdentity();
        if (!identity) return;

        // 通知管理器玩家已连接。
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnPlayerConnected(identity);
        }
    }
};
```

---

## 任务钩子：服务器（5_Mission）

放在 `Scripts/5_Mission/MyMod/MyModMissionServer.c`。

这挂接到 `MissionServer` 以在服务器端初始化和关闭模组。

```c
// ==========================================================================
// MyModMissionServer.c - 服务器端任务钩子
// 5_Mission 层：最后加载，可以引用所有更低层级。
//
// 为什么使用 modded MissionServer：
//   MissionServer 是服务器端逻辑的入口点。它的 OnInit()
//   在任务开始（服务器启动）时运行一次。OnMissionFinish()
//   在服务器关闭或重启时运行。这些是设置和拆卸
//   你的模组系统的正确位置。
//
// 生命周期顺序：
//   1. 引擎加载所有脚本层级（3_Game -> 4_World -> 5_Mission）
//   2. 引擎创建 MissionServer 实例
//   3. OnInit() 被调用 -> 在这里初始化你的系统
//   4. OnMissionStart() 被调用 -> 世界准备就绪，玩家可以加入
//   5. OnUpdate() 每帧调用
//   6. OnMissionFinish() 被调用 -> 服务器正在关闭
// ==========================================================================

modded class MissionServer
{
    // -----------------------------------------------------------------------
    // 初始化
    // -----------------------------------------------------------------------
    override void OnInit()
    {
        // 始终首先调用 super。链中的其他模组依赖于此。
        super.OnInit();

        // 初始化管理器单例。这从磁盘加载配置，
        // 注册 RPC 处理器，并准备模组运行。
        MyModManager.GetInstance().Init();

        Print(MYMOD_TAG + " Server mission initialized");
    }

    // -----------------------------------------------------------------------
    // 每帧更新
    // -----------------------------------------------------------------------
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        // 委托给管理器。管理器处理自己的速率
        // 限制（来自配置的 UpdateInterval），所以这是低成本的。
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnUpdate(timeslice);
        }
    }

    // -----------------------------------------------------------------------
    // 玩家连接 - 服务器 RPC 分发
    // 当客户端向服务器发送 RPC 时由引擎调用。
    // -----------------------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        // 仅处理我们的 RPC ID。所有其他 RPC 通过。
        if (rpc_type != MYMOD_RPC_ID) return;

        // 读取路由名称（发送者写入的第一个字符串）。
        string routeName;
        if (!ctx.Read(routeName)) return;

        // 根据路由名称分发到正确的处理器。
        MyModManager mgr = MyModManager.GetInstance();
        if (!mgr) return;

        if (routeName == MYMOD_RPC_UI_REQUEST)
        {
            mgr.OnUIRequest(sender, ctx);
        }
        // 随着模组增长，在这里添加更多路由：
        // else if (routeName == MYMOD_RPC_SOME_OTHER)
        // {
        //     mgr.OnSomeOther(sender, ctx);
        // }
    }

    // -----------------------------------------------------------------------
    // 关闭
    // -----------------------------------------------------------------------
    override void OnMissionFinish()
    {
        // 在调用 super 之前关闭管理器。
        // 这确保我们的清理在引擎拆除
        // 任务基础设施之前运行。
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.Shutdown();
        }

        // 销毁单例以释放内存并防止过时状态
        // 如果任务重启（例如，服务器重启而进程不退出）。
        MyModManager.Cleanup();

        Print(MYMOD_TAG + " Server mission finished");

        super.OnMissionFinish();
    }
};
```

---

## 任务钩子：客户端（5_Mission）

放在 `Scripts/5_Mission/MyMod/MyModMissionClient.c`。

这挂接到 `MissionGameplay` 用于客户端初始化、输入处理和 RPC 接收。

```c
// ==========================================================================
// MyModMissionClient.c - 客户端任务钩子
// 5_Mission 层。
//
// 为什么使用 MissionGameplay：
//   在客户端，MissionGameplay 是游戏过程中活跃的任务类。
//   它每帧接收 OnUpdate()（用于输入轮询）
//   和 OnRPC() 用于接收服务器消息。
//
// 关于监听服务器的注意事项：
//   在监听服务器（主机 + 游玩）上，MissionServer 和
//   MissionGameplay 都是活跃的。你的客户端代码将与
//   服务器代码一起运行。如果需要特定端的逻辑，
//   使用 GetGame().IsClient() 或 GetGame().IsServer() 进行守卫。
// ==========================================================================

modded class MissionGameplay
{
    // UI 面板的引用。关闭时为 null。
    protected ref MyModUI m_MyModPanel;

    // 跟踪初始化状态。
    protected bool m_MyModInitialized;

    // -----------------------------------------------------------------------
    // 初始化
    // -----------------------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        m_MyModInitialized = true;

        Print(MYMOD_TAG + " Client mission initialized");
    }

    // -----------------------------------------------------------------------
    // 每帧更新：输入轮询和 UI 管理
    // -----------------------------------------------------------------------
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_MyModInitialized) return;

        // 轮询 Inputs.xml 中定义的快捷键。
        // GetUApi() 返回 UserActions API。
        // GetInputByName() 按 Inputs.xml 中的名称查找操作。
        // LocalPress() 在按键按下的那一帧返回 true。
        UAInput panelInput = GetUApi().GetInputByName("UAMyModPanel");
        if (panelInput && panelInput.LocalPress())
        {
            TogglePanel();
        }
    }

    // -----------------------------------------------------------------------
    // RPC 接收器：处理来自服务器的消息
    // -----------------------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        // 仅处理我们的 RPC ID。
        if (rpc_type != MYMOD_RPC_ID) return;

        // 读取路由名称。
        string routeName;
        if (!ctx.Read(routeName)) return;

        // 根据路由分发。
        if (routeName == MYMOD_RPC_WELCOME)
        {
            string welcomeMsg;
            if (ctx.Read(welcomeMsg))
            {
                // 向玩家显示欢迎消息。
                // GetGame().GetMission().OnEvent() 可以显示通知，
                // 或者你可以使用自定义 UI。为简单起见，我们使用聊天。
                GetGame().Chat(welcomeMsg, "");
                Print(MYMOD_TAG + " Welcome message: " + welcomeMsg);
            }
        }
        else if (routeName == MYMOD_RPC_UI_RESPONSE)
        {
            string responseData;
            if (ctx.Read(responseData))
            {
                // 用接收到的数据更新 UI 面板。
                if (m_MyModPanel)
                {
                    m_MyModPanel.SetData(responseData);
                }
            }
        }
    }

    // -----------------------------------------------------------------------
    // UI 面板切换
    // -----------------------------------------------------------------------
    protected void TogglePanel()
    {
        if (m_MyModPanel && m_MyModPanel.IsOpen())
        {
            m_MyModPanel.Close();
            m_MyModPanel = null;
        }
        else
        {
            // 仅在玩家活着且没有其他菜单显示时打开。
            PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
            if (!player || !player.IsAlive()) return;

            UIManager uiMgr = GetGame().GetUIManager();
            if (uiMgr && uiMgr.GetMenu()) return;

            m_MyModPanel = new MyModUI();
            m_MyModPanel.Open();

            // 从服务器请求新数据。
            MyModRPCHelper.SendRequestToServer(MYMOD_RPC_UI_REQUEST);
        }
    }

    // -----------------------------------------------------------------------
    // 关闭
    // -----------------------------------------------------------------------
    override void OnMissionFinish()
    {
        // 如果打开则关闭并销毁 UI 面板。
        if (m_MyModPanel)
        {
            m_MyModPanel.Close();
            m_MyModPanel = null;
        }

        m_MyModInitialized = false;

        Print(MYMOD_TAG + " Client mission finished");

        super.OnMissionFinish();
    }
};
```

---

## UI 面板脚本（5_Mission）

放在 `Scripts/5_Mission/MyMod/MyModUI.c`。

此脚本驱动 `.layout` 文件中定义的 UI 面板。它查找控件引用、用数据填充它们，并处理打开/关闭。

```c
// ==========================================================================
// MyModUI.c - UI 面板控制器
// 5_Mission 层：可以引用所有更低层级。
//
// DayZ UI 的工作原理：
//   1. .layout 文件定义控件层次结构（类似 HTML）。
//   2. 脚本类加载布局、按名称查找控件，并操作它们
//      （设置文本、显示/隐藏、响应点击）。
//   3. 脚本显示/隐藏根控件并管理输入焦点。
//
// 控件生命周期：
//   GetGame().GetWorkspace().CreateWidgets() 加载布局文件并
//   返回根控件。然后你使用 FindAnyWidget() 获取
//   命名子控件的引用。完成后，调用 widget.Unlink()
//   销毁整个控件树。
// ==========================================================================

class MyModUI
{
    // 面板的根控件（从 .layout 加载）。
    protected ref Widget m_Root;

    // 命名的子控件。
    protected TextWidget m_TitleText;
    protected TextWidget m_DataText;
    protected TextWidget m_VersionText;
    protected ButtonWidget m_CloseButton;

    // 状态跟踪。
    protected bool m_IsOpen;

    // -----------------------------------------------------------------------
    // 构造函数：加载布局并查找控件引用
    // -----------------------------------------------------------------------
    void MyModUI()
    {
        // CreateWidgets 加载 .layout 文件并实例化所有控件。
        // 路径相对于模组根目录（与 config.cpp 路径相同）。
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyProfessionalMod/Scripts/GUI/layouts/MyModPanel.layout"
        );

        // 在调用 Open() 之前初始隐藏。
        if (m_Root)
        {
            m_Root.Show(false);

            // 查找命名控件。这些名称必须与 .layout 文件中的
            // 控件名称完全匹配（区分大小写）。
            m_TitleText   = TextWidget.Cast(m_Root.FindAnyWidget("TitleText"));
            m_DataText    = TextWidget.Cast(m_Root.FindAnyWidget("DataText"));
            m_VersionText = TextWidget.Cast(m_Root.FindAnyWidget("VersionText"));
            m_CloseButton = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));

            // 设置静态内容。
            if (m_TitleText)
                m_TitleText.SetText("My Professional Mod");

            if (m_VersionText)
                m_VersionText.SetText("v" + MYMOD_VERSION);
        }
    }

    // -----------------------------------------------------------------------
    // 打开：显示面板并捕获输入
    // -----------------------------------------------------------------------
    void Open()
    {
        if (!m_Root) return;

        m_Root.Show(true);
        m_IsOpen = true;

        // 锁定玩家控制，这样 WASD 不会在面板打开时
        // 移动角色。这会显示光标。
        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print(MYMOD_TAG + " UI panel opened");
    }

    // -----------------------------------------------------------------------
    // 关闭：隐藏面板并释放输入
    // -----------------------------------------------------------------------
    void Close()
    {
        if (!m_Root) return;

        m_Root.Show(false);
        m_IsOpen = false;

        // 重新启用玩家控制。
        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print(MYMOD_TAG + " UI panel closed");
    }

    // -----------------------------------------------------------------------
    // 数据更新：当服务器发送 UI 数据时调用
    // -----------------------------------------------------------------------
    void SetData(string data)
    {
        if (m_DataText)
        {
            m_DataText.SetText(data);
        }
    }

    // -----------------------------------------------------------------------
    // 状态查询
    // -----------------------------------------------------------------------
    bool IsOpen()
    {
        return m_IsOpen;
    }

    // -----------------------------------------------------------------------
    // 析构函数：清理控件树
    // -----------------------------------------------------------------------
    void ~MyModUI()
    {
        // Unlink 销毁根控件及其所有子控件。
        // 这释放了控件树使用的内存。
        if (m_Root)
        {
            m_Root.Unlink();
        }
    }
};
```

---

## 布局文件

放在 `Scripts/GUI/layouts/MyModPanel.layout`。

这定义了 UI 面板的视觉结构。DayZ 布局使用自定义文本格式（不是 XML）。

```
// ==========================================================================
// MyModPanel.layout - UI 面板结构
//
// 尺寸规则：
//   hexactsize 1 + vexactsize 1 = 尺寸以像素为单位（例如 size 400 300）
//   hexactsize 0 + vexactsize 0 = 尺寸为比例值（0.0 到 1.0）
//   halign/valign 控制锚点：
//     left_ref/top_ref     = 锚定到父级的左/上边缘
//     center_ref           = 在父级中居中
//     right_ref/bottom_ref = 锚定到父级的右/下边缘
//
// 重要：
//   - 永远不要使用负尺寸。改用对齐和位置。
//   - 控件名称必须与脚本中的 FindAnyWidget() 调用完全匹配。
//   - 'ignorepointer 1' 表示控件不接收鼠标点击。
//   - 'scriptclass' 将控件链接到脚本类用于事件处理。
// ==========================================================================

// 根面板：屏幕居中，400x300 像素，半透明背景。
PanelWidgetClass MyModPanelRoot {
 position 0 0
 size 400 300
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
 color 0.1 0.1 0.12 0.92
 priority 100
 {
  // 标题栏：全宽，36px 高，在顶部。
  PanelWidgetClass TitleBar {
   position 0 0
   size 1 36
   hexactpos 1
   vexactpos 1
   hexactsize 0
   vexactsize 1
   color 0.15 0.15 0.18 1
   {
    // 标题文本：带内边距的左对齐。
    TextWidgetClass TitleText {
     position 12 0
     size 300 36
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     valign center_ref
     ignorepointer 1
     text "My Mod"
     font "gui/fonts/metron2"
     "exact size" 16
     color 1 1 1 0.9
    }
    // 版本文本：标题栏右侧。
    TextWidgetClass VersionText {
     position 0 0
     size 80 36
     halign right_ref
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     valign center_ref
     ignorepointer 1
     text "v1.0.0"
     font "gui/fonts/metron2"
     "exact size" 12
     color 0.6 0.6 0.6 0.8
    }
   }
  }
  // 内容区域：标题栏下方，填充剩余空间。
  PanelWidgetClass ContentArea {
   position 0 40
   size 380 200
   halign center_ref
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   color 0 0 0 0
   {
    // 数据文本：显示服务器数据的地方。
    TextWidgetClass DataText {
     position 12 12
     size 356 160
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     ignorepointer 1
     text "Waiting for data..."
     font "gui/fonts/metron2"
     "exact size" 14
     color 0.85 0.85 0.85 1
    }
   }
  }
  // 关闭按钮：右下角。
  ButtonWidgetClass CloseButton {
   position 0 0
   size 100 32
   halign right_ref
   valign bottom_ref
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   text "Close"
   font "gui/fonts/metron2"
   "exact size" 14
  }
 }
}
```

---

## stringtable.csv

放在 `Scripts/stringtable.csv`。

这为所有面向玩家的文本提供本地化。引擎读取与玩家游戏语言匹配的列。`original` 列是回退。

DayZ 支持 13 个语言列。每行必须有全部 13 列（对于你不翻译的语言，使用英文文本作为占位符）。

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod",
"STR_MYMOD_INPUT_PANEL","Open Panel","Open Panel","Otevrit Panel","Panel offnen","Otkryt Panel","Otworz Panel","Panel megnyitasa","Apri Pannello","Abrir Panel","Ouvrir Panneau","Open Panel","Open Panel","Abrir Painel","Open Panel",
"STR_MYMOD_TITLE","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod",
"STR_MYMOD_CLOSE","Close","Close","Zavrit","Schliessen","Zakryt","Zamknij","Bezaras","Chiudi","Cerrar","Fermer","Close","Close","Fechar","Close",
"STR_MYMOD_WELCOME","Welcome!","Welcome!","Vitejte!","Willkommen!","Dobro pozhalovat!","Witaj!","Udvozoljuk!","Benvenuto!","Bienvenido!","Bienvenue!","Welcome!","Welcome!","Bem-vindo!","Welcome!",
```

**重要：** 每行必须在最后一个语言列后以尾随逗号结束。这是 DayZ 的 CSV 解析器的要求。

---

## Inputs.xml

放在 `Scripts/Inputs.xml`。

这定义了出现在游戏的选项 > 控制菜单中的自定义快捷键。`config.cpp` CfgMods 中的 `inputs` 字段必须指向此文件。

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<!--
    Inputs.xml - 自定义快捷键定义

    结构：
    - <actions>：声明输入操作名称及其显示字符串
    - <sorting>：在控制菜单中将操作分组到一个类别下
    - <preset>：设置默认键绑定

    命名约定：
    - 操作名称以 "UA"（User Action）开头，后跟你的模组前缀。
    - "loc" 属性引用 stringtable.csv 中的字符串键。

    按键名称：
    - 键盘：kA 到 kZ，k0-k9，kInsert，kHome，kEnd，kDelete，
      kNumpad0-kNumpad9，kF1-kF12，kLControl，kRControl，kLShift，kRShift，
      kLAlt，kRAlt，kSpace，kReturn，kBack，kTab，kEscape
    - 鼠标：mouse1（左键），mouse2（右键），mouse3（中键）
    - 组合键：使用 <combo> 元素和多个 <btn> 子元素
-->
<modded_inputs>
    <inputs>
        <!-- 声明输入操作。 -->
        <actions>
            <input name="UAMyModPanel" loc="STR_MYMOD_INPUT_PANEL" />
        </actions>

        <!-- 在选项 > 控制中分组到一个类别下。 -->
        <!-- "name" 是内部 ID；"loc" 是来自 stringtable 的显示名称。 -->
        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <input name="UAMyModPanel"/>
        </sorting>
    </inputs>

    <!-- 默认按键预设。玩家可以在选项 > 控制中重新绑定。 -->
    <preset>
        <!-- 默认绑定到 Home 键。 -->
        <input name="UAMyModPanel">
            <btn name="kHome"/>
        </input>

        <!--
        组合键示例（取消注释以使用）：
        这将绑定到 Ctrl+H 而不是单个键。
        <input name="UAMyModPanel">
            <combo>
                <btn name="kLControl"/>
                <btn name="kH"/>
            </combo>
        </input>
        -->
    </preset>
</modded_inputs>
```

---

## 构建脚本

放在模组根目录的 `build.bat`。

此批处理文件使用 DayZ Tools 中的 Addon Builder 自动化 PBO 打包。

```batch
@echo off
REM ==========================================================================
REM build.bat - MyProfessionalMod 的自动 PBO 打包
REM
REM 此脚本的功能：
REM   1. 将 Scripts/ 文件夹打包为 PBO 文件
REM   2. 将 PBO 放在可分发的 @mod 文件夹中
REM   3. 将 mod.cpp 复制到可分发文件夹
REM
REM 前提条件：
REM   - 通过 Steam 安装了 DayZ Tools
REM   - 模组源代码位于 P:\MyProfessionalMod\
REM
REM 用法：
REM   双击此文件或从命令行运行：build.bat
REM ==========================================================================

REM --- 配置：更新这些路径以匹配你的设置 ---

REM DayZ Tools 的路径（检查你的 Steam 库路径）。
set DAYZ_TOOLS=C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools

REM 源文件夹：打包到 PBO 中的 Scripts 目录。
set SOURCE=P:\MyProfessionalMod\Scripts

REM 输出文件夹：打包后的 PBO 存放位置。
set OUTPUT=P:\@MyProfessionalMod\addons

REM 前缀：PBO 内的虚拟路径。必须与 config.cpp 中的路径匹配
REM（例如 "MyProfessionalMod/Scripts/3_Game" 必须能解析）。
set PREFIX=MyProfessionalMod\Scripts

REM --- 构建步骤 ---

echo ============================================
echo  Building MyProfessionalMod
echo ============================================

REM 如果输出目录不存在则创建。
if not exist "%OUTPUT%" mkdir "%OUTPUT%"

REM 运行 Addon Builder。
REM   -clear  = 打包前删除旧的 PBO
REM   -prefix = 设置 PBO 前缀（脚本路径解析所必需）
echo Packing PBO...
"%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe" "%SOURCE%" "%OUTPUT%" -prefix=%PREFIX% -clear

REM 检查 Addon Builder 是否成功。
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: PBO packing failed! Check the output above for details.
    echo Common causes:
    echo   - DayZ Tools path is wrong
    echo   - Source folder does not exist
    echo   - A .c file has a syntax error that prevents packing
    pause
    exit /b 1
)

REM 将 mod.cpp 复制到可分发文件夹。
echo Copying mod.cpp...
copy /Y "P:\MyProfessionalMod\mod.cpp" "P:\@MyProfessionalMod\mod.cpp" >nul

echo.
echo ============================================
echo  Build complete!
echo  Output: P:\@MyProfessionalMod\
echo ============================================
echo.
echo To test with file patching (no PBO needed):
echo   DayZDiag_x64.exe -mod=P:\MyProfessionalMod -filePatching
echo.
echo To test with the built PBO:
echo   DayZDiag_x64.exe -mod=P:\@MyProfessionalMod
echo.
pause
```

---

## 自定义指南

当你使用此模板用于自己的模组时，需要重命名每个占位符名称。以下是完整的清单。

### 步骤 1：选择你的名称

在进行任何编辑之前，确定这些标识符：

| 标识符 | 示例 | 规则 |
|------------|---------|-------|
| **模组文件夹名** | `MyBountySystem` | 无空格，PascalCase 或下划线 |
| **显示名称** | `"My Bounty System"` | 人类可读，用于 mod.cpp 和 config.cpp |
| **CfgPatches 类** | `MyBountySystem_Scripts` | 在所有模组中必须全局唯一 |
| **CfgMods 类** | `MyBountySystem` | 内部引擎标识符 |
| **脚本前缀** | `MyBounty` | 类的短前缀：`MyBountyManager`、`MyBountyConfig` |
| **标签常量** | `MYBOUNTY_TAG` | 用于日志消息：`"[MyBounty]"` |
| **预处理器定义** | `MYBOUNTYSYSTEM` | 用于 `#ifdef` 跨模组检测 |
| **RPC ID** | `58432` | 唯一的 5 位数字，不被其他模组使用 |
| **输入操作名** | `UAMyBountyPanel` | 以 `UA` 开头，唯一 |

### 步骤 2：重命名文件和文件夹

重命名包含 "MyMod" 或 "MyProfessionalMod" 的每个文件和文件夹：

```
MyProfessionalMod/           -> MyBountySystem/
  Scripts/3_Game/MyMod/      -> Scripts/3_Game/MyBounty/
    MyModConstants.c          -> MyBountyConstants.c
    MyModConfig.c             -> MyBountyConfig.c
    MyModRPC.c                -> MyBountyRPC.c
  Scripts/4_World/MyMod/     -> Scripts/4_World/MyBounty/
    MyModManager.c            -> MyBountyManager.c
    MyModPlayerHandler.c      -> MyBountyPlayerHandler.c
  Scripts/5_Mission/MyMod/   -> Scripts/5_Mission/MyBounty/
    MyModMissionServer.c      -> MyBountyMissionServer.c
    MyModMissionClient.c      -> MyBountyMissionClient.c
    MyModUI.c                 -> MyBountyUI.c
  Scripts/GUI/layouts/
    MyModPanel.layout          -> MyBountyPanel.layout
```

### 步骤 3：在每个文件中查找替换

**按顺序**执行这些替换（最长的字符串优先以避免部分匹配）：

| 查找 | 替换 | 影响的文件 |
|------|---------|----------------|
| `MyProfessionalMod` | `MyBountySystem` | config.cpp、mod.cpp、build.bat、UI 脚本 |
| `MyModManager` | `MyBountyManager` | 管理器、任务钩子、玩家处理器 |
| `MyModConfig` | `MyBountyConfig` | 配置类、管理器 |
| `MyModConstants` | `MyBountyConstants` | （仅文件名） |
| `MyModRPCHelper` | `MyBountyRPCHelper` | RPC 辅助、任务钩子 |
| `MyModUI` | `MyBountyUI` | UI 脚本、客户端任务钩子 |
| `MyModPanel` | `MyBountyPanel` | 布局文件、UI 脚本 |
| `MyMod_Scripts` | `MyBountySystem_Scripts` | config.cpp CfgPatches |
| `MYMOD_RPC_ID` | `MYBOUNTY_RPC_ID` | 常量、RPC、任务钩子 |
| `MYMOD_RPC_` | `MYBOUNTY_RPC_` | 所有 RPC 路由常量 |
| `MYMOD_TAG` | `MYBOUNTY_TAG` | 常量、所有使用日志标签的文件 |
| `MYMOD_CONFIG` | `MYBOUNTY_CONFIG` | 常量、配置类 |
| `MYMOD_VERSION` | `MYBOUNTY_VERSION` | 常量、UI 脚本 |
| `MYMOD` | `MYBOUNTYSYSTEM` | config.cpp defines[] |
| `MyMod` | `MyBounty` | config.cpp CfgMods 类、RPC 路由字符串 |
| `My Mod` | `My Bounty System` | 布局中的字符串、stringtable |
| `mymod` | `mybounty` | Inputs.xml 排序名称 |
| `STR_MYMOD_` | `STR_MYBOUNTY_` | stringtable.csv、Inputs.xml |
| `UAMyMod` | `UAMyBounty` | Inputs.xml、客户端任务钩子 |
| `m_MyMod` | `m_MyBounty` | 客户端任务钩子成员变量 |
| `74291` | `58432` | RPC ID（你选择的唯一数字） |

### 步骤 4：验证

重命名后，对 "MyMod" 和 "MyProfessionalMod" 进行全项目搜索以捕获遗漏。然后构建并测试：

```batch
DayZDiag_x64.exe -mod=P:\MyBountySystem -filePatching
```

在脚本日志中检查你的标签（例如 `[MyBounty]`）以确认所有内容都已加载。

---

## 功能扩展指南

一旦你的模组运行起来，以下是如何添加常见功能。

### 添加新的 RPC 端点

**1. 定义路由常量**，在 `MyModRPC.c`（3_Game）中：

```c
const string MYMOD_RPC_BOUNTY_SET = "MyMod:BountySet";
```

**2. 添加服务器处理器**，在 `MyModManager.c`（4_World）中：

```c
void OnBountySet(PlayerIdentity sender, ParamsReadContext ctx)
{
    // 读取客户端写入的参数。
    string targetName;
    int bountyAmount;
    if (!ctx.Read(targetName)) return;
    if (!ctx.Read(bountyAmount)) return;

    Print(MYMOD_TAG + " Bounty set on " + targetName + ": " + bountyAmount.ToString());
    // ... 你的逻辑在这里 ...
}
```

**3. 添加分发分支**，在 `MyModMissionServer.c`（5_Mission）的 `OnRPC()` 中：

```c
else if (routeName == MYMOD_RPC_BOUNTY_SET)
{
    mgr.OnBountySet(sender, ctx);
}
```

**4. 从客户端发送**（在触发操作的任何地方）：

```c
ScriptRPC rpc = new ScriptRPC();
rpc.Write(MYMOD_RPC_BOUNTY_SET);
rpc.Write("PlayerName");
rpc.Write(5000);
rpc.Send(null, MYMOD_RPC_ID, true, null);
```

### 添加新的配置字段

**1. 添加字段**，在 `MyModConfig.c` 中设置默认值：

```c
// 玩家可以设置的最低赏金金额。
int MinBountyAmount = 100;
```

就这样。JSON 序列化器会自动获取公共字段。磁盘上的现有配置文件将对新字段使用默认值，直到管理员编辑并保存。

**2. 引用它**，从管理器中：

```c
if (bountyAmount < m_Config.MinBountyAmount)
{
    // 拒绝：太低。
    return;
}
```

### 添加新的 UI 面板

**1. 创建布局**，在 `Scripts/GUI/layouts/MyModBountyList.layout`：

```
PanelWidgetClass BountyListRoot {
 position 0 0
 size 500 400
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
 color 0.1 0.1 0.12 0.92
 {
  TextWidgetClass BountyListTitle {
   position 12 8
   size 476 30
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   text "Active Bounties"
   font "gui/fonts/metron2"
   "exact size" 18
   color 1 1 1 0.9
  }
 }
}
```

**2. 创建脚本**，在 `Scripts/5_Mission/MyMod/MyModBountyListUI.c`：

```c
class MyModBountyListUI
{
    protected ref Widget m_Root;
    protected bool m_IsOpen;

    void MyModBountyListUI()
    {
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyProfessionalMod/Scripts/GUI/layouts/MyModBountyList.layout"
        );
        if (m_Root)
            m_Root.Show(false);
    }

    void Open()  { if (m_Root) { m_Root.Show(true); m_IsOpen = true; } }
    void Close() { if (m_Root) { m_Root.Show(false); m_IsOpen = false; } }
    bool IsOpen() { return m_IsOpen; }

    void ~MyModBountyListUI()
    {
        if (m_Root) m_Root.Unlink();
    }
};
```

### 添加新的快捷键

**1. 添加操作**，在 `Inputs.xml` 中：

```xml
<actions>
    <input name="UAMyModPanel" loc="STR_MYMOD_INPUT_PANEL" />
    <input name="UAMyModBountyList" loc="STR_MYMOD_INPUT_BOUNTYLIST" />
</actions>

<sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
    <input name="UAMyModPanel"/>
    <input name="UAMyModBountyList"/>
</sorting>
```

**2. 添加默认绑定**，在 `<preset>` 部分：

```xml
<input name="UAMyModBountyList">
    <btn name="kEnd"/>
</input>
```

**3. 添加本地化**，在 `stringtable.csv` 中：

```csv
"STR_MYMOD_INPUT_BOUNTYLIST","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List",
```

**4. 轮询输入**，在 `MyModMissionClient.c` 中：

```c
UAInput bountyInput = GetUApi().GetInputByName("UAMyModBountyList");
if (bountyInput && bountyInput.LocalPress())
{
    ToggleBountyList();
}
```

### 添加新的 stringtable 条目

**1. 添加行**，在 `stringtable.csv` 中。每行需要全部 13 个语言列加尾随逗号：

```csv
"STR_MYMOD_BOUNTY_PLACED","Bounty placed!","Bounty placed!","Odměna vypsána!","Kopfgeld gesetzt!","Награда назначена!","Nagroda wyznaczona!","Fejpénz kiírva!","Taglia piazzata!","Recompensa puesta!","Prime placée!","Bounty placed!","Bounty placed!","Recompensa colocada!","Bounty placed!",
```

**2. 在脚本代码中使用：**

```c
// Widget.SetText() 不会自动解析 stringtable 键。
// 你必须使用 Widget.SetText() 和已解析的字符串：
string localizedText = Widget.TranslateString("#STR_MYMOD_BOUNTY_PLACED");
myTextWidget.SetText(localizedText);
```

或者在 `.layout` 文件中，引擎会自动解析 `#STR_` 键：

```
text "#STR_MYMOD_BOUNTY_PLACED"
```

---

## 下一步

有了这个运行中的专业模板，你可以：

1. **研究生产级模组** -- 阅读 [DayZ Expansion](https://github.com/salutesh/DayZ-Expansion-Scripts) 和 `StarDZ_Core` 源代码了解大规模的真实世界模式。
2. **添加自定义物品** -- 按照[第 8.2 章：创建自定义物品](02-custom-item.md)操作并与你的管理器集成。
3. **构建管理员面板** -- 按照[第 8.3 章：构建管理员面板](03-admin-panel.md)使用你的配置系统。
4. **添加 HUD 覆盖层** -- 按照[第 8.8 章：构建 HUD 覆盖层](08-hud-overlay.md)实现始终可见的 UI 元素。
5. **发布到创意工坊** -- 当你的模组准备就绪时，按照[第 8.7 章：发布到创意工坊](07-publishing-workshop.md)操作。
6. **学习调试** -- 阅读[第 8.6 章：调试和测试](06-debugging-testing.md)了解日志分析和故障排除。

---

**上一章：** [第 8.8 章：构建 HUD 覆盖层](08-hud-overlay.md) | [首页](../README.md)
