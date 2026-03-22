# 常见问题

[首页](./README.md) | **FAQ**

---

## 入门

### 问：开始 DayZ Modding 需要什么？
**答：** 你需要 Steam、DayZ（零售版）、DayZ Tools（Steam 工具区免费）和文本编辑器（推荐 VS Code）。严格来说不需要编程经验 --- 从 [第 8.1 章：你的第一个 Mod](08-tutorials/01-first-mod.md) 开始。DayZ Tools 包含 Object Builder、Addon Builder、TexView2 和 Workbench IDE。

### 问：DayZ 使用什么编程语言？
**答：** DayZ 使用 **Enforce Script**，这是 Bohemia Interactive 的专有语言。它具有类似 C# 的 C 风格语法，但有自己的规则和限制（没有三元运算符、没有 try/catch、没有 lambda）。参见 [第一部分：Enforce Script](01-enforce-script/01-variables-types.md) 获取完整的语言指南。

### 问：如何设置 P: 驱动器？
**答：** 从 Steam 打开 DayZ Tools，点击「Workdrive」或「Setup Workdrive」来挂载 P: 驱动器。这将创建一个指向你的 Modding 工作区的虚拟驱动器，引擎在开发期间在此查找源文件。你也可以从命令行使用 `subst P: "C:\Your\Path"`。参见 [第 4.5 章](04-file-formats/05-dayz-tools.md)。

### 问：可以不用专用服务器测试 Mod 吗？
**答：** 可以。使用 `-filePatching` 参数和你的 Mod 加载启动 DayZ。快速测试请使用监听服务器（从游戏内菜单托管）。生产测试时，请务必也在专用服务器上验证，因为某些代码路径不同。参见 [第 8.1 章](08-tutorials/01-first-mod.md)。

### 问：在哪里可以找到原版 DayZ 脚本文件？
**答：** 通过 DayZ Tools 挂载 P: 驱动器后，原版脚本位于 `P:\DZ\scripts\`，按层级组织（`3_Game`、`4_World`、`5_Mission`）。这些是所有引擎类、方法和事件的权威参考。另请参见 [速查表](cheatsheet.md) 和 [API 快速参考](06-engine-api/quick-reference.md)。

---

## 常见错误和修复

### 问：Mod 加载了但什么都没发生。日志中也没有错误。
**答：** 最可能的原因是 `config.cpp` 中的 `requiredAddons[]` 条目不正确，导致脚本加载过早或根本没有加载。验证 `requiredAddons` 中的每个插件名称与现有的 `CfgPatches` 类名完全匹配（区分大小写）。检查 `%localappdata%/DayZ/` 的脚本日志中是否有静默警告。参见 [第 2.2 章](02-mod-structure/02-config-cpp.md)。

### 问：我得到「Cannot find variable」或「Undefined variable」错误。
**答：** 这通常意味着你在引用来自更高脚本层的类或变量。低层（`3_Game`）无法看到高层（`4_World`、`5_Mission`）中定义的类型。将类定义移到正确的层，或使用 `typename` 反射进行松耦合。参见 [第 2.1 章](02-mod-structure/01-five-layers.md)。

### 问：为什么 `JsonFileLoader<T>.JsonLoadFile()` 不返回我的数据？
**答：** `JsonLoadFile()` 返回 `void`，不是加载的对象。你必须预分配对象并作为引用参数传递：`ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`。赋值返回值会静默地给你 `null`。参见 [第 6.8 章](06-engine-api/08-file-io.md)。

### 问：RPC 已发送但另一端从未接收到。
**答：** 检查以下常见原因：(1) 发送方和接收方之间的 RPC ID 不匹配。(2) 从客户端发送但在客户端监听（或服务器到服务器）。(3) 忘记在 `OnRPC()` 或自定义处理程序中注册 RPC 处理程序。(4) 目标实体为 `null` 或未进行网络同步。参见 [第 6.9 章](06-engine-api/09-networking.md) 和 [第 7.3 章](07-patterns/03-rpc-patterns.md)。

### 问：在 else-if 块中得到「Error: Member already defined」。
**答：** Enforce Script 不允许在同一作用域内的兄弟 `else if` 块中重新声明变量。在 `if` 链之前声明一次变量，或使用花括号创建单独的作用域。参见 [第 1.12 章](01-enforce-script/12-gotchas.md)。

### 问：我的 UI 布局什么都不显示 / 控件不可见。
**答：** 常见原因：(1) 控件大小为零 --- 检查宽度/高度是否正确设置（不要使用负值）。(2) 控件没有 `Show(true)`。(3) 文本颜色 alpha 为 0（完全透明）。(4) `CreateWidgets()` 中的布局路径错误（不会抛出错误，只是返回 `null`）。参见 [第 3.3 章](03-gui-system/03-sizing-positioning.md)。

### 问：我的 Mod 导致服务器启动时崩溃。
**答：** 检查：(1) 在服务器上调用仅客户端的方法（`GetGame().GetPlayer()`、UI 代码）。(2) 在世界准备好之前的 `OnInit` 或 `OnMissionStart` 中的 `null` 引用。(3) 忘记调用 `super` 的 `modded class` 重写中的无限递归。由于没有 try/catch，请始终添加保护子句。参见 [第 1.11 章](01-enforce-script/11-error-handling.md)。

### 问：字符串中的反斜杠或引号字符导致解析错误。
**答：** Enforce Script 的解析器（CParser）不支持字符串字面量中的 `\\` 或 `\"` 转义序列。完全避免使用反斜杠。文件路径请使用正斜杠（`"my/path/file.json"`）。字符串中的引号请使用单引号字符或字符串连接。参见 [第 1.12 章](01-enforce-script/12-gotchas.md)。

---

## 架构决策

### 问：什么是 5 层脚本层次结构，为什么重要？
**答：** DayZ 脚本在五个编号层中编译：`1_Core`、`2_GameLib`、`3_Game`、`4_World`、`5_Mission`。每层只能引用同一层或更低编号层的类型。这强制了架构边界 --- 将共享枚举和常量放在 `3_Game`，实体逻辑放在 `4_World`，UI/任务钩子放在 `5_Mission`。参见 [第 2.1 章](02-mod-structure/01-five-layers.md)。

### 问：应该使用 `modded class` 还是创建新类？
**答：** 当你需要更改或扩展现有的原版行为时（向 `PlayerBase` 添加方法、挂钩 `MissionServer`），使用 `modded class`。对于不需要重写任何内容的自包含系统，创建新类。modded class 会自动链式调用 --- 始终调用 `super` 以避免破坏其他 Mod。参见 [第 1.4 章](01-enforce-script/04-modded-classes.md)。

### 问：如何组织客户端和服务器端代码？
**答：** 对于只应在一端运行的代码，使用 `#ifdef SERVER` 和 `#ifdef CLIENT` 预处理器保护。对于较大的 Mod，分成单独的 PBO：客户端 Mod（UI、渲染、本地效果）和服务器 Mod（生成、逻辑、持久化）。这可以防止服务器逻辑泄露给客户端。参见 [第 2.5 章](02-mod-structure/05-file-organization.md) 和 [第 6.9 章](06-engine-api/09-networking.md)。

### 问：什么时候应该使用单例模式，什么时候使用模块/插件？
**答：** 当需要生命周期管理（`OnInit`、`OnUpdate`、`OnMissionFinish`）时使用模块（注册到 CF 的 `PluginManager` 或你自己的模块系统）。对于只需要全局访问的无状态工具服务，使用独立的单例。对于有状态或需要清理的任何东西，优先使用模块。参见 [第 7.1 章](07-patterns/01-singletons.md) 和 [第 7.2 章](07-patterns/02-module-systems.md)。

### 问：如何安全地存储在服务器重启后保留的玩家数据？
**答：** 使用 `JsonFileLoader` 将 JSON 文件保存到服务器的 `$profile:` 目录。使用玩家的 Steam UID（从 `PlayerIdentity.GetId()` 获取）作为文件名。在玩家连接时加载，在断开连接时和定期保存。由于没有 try/catch，始终使用保护子句优雅地处理缺失/损坏的文件。参见 [第 7.4 章](07-patterns/04-config-persistence.md) 和 [第 6.8 章](06-engine-api/08-file-io.md)。

---

## 发布与分发

### 问：如何将 Mod 打包为 PBO？
**答：** 使用 Addon Builder（来自 DayZ Tools）或第三方工具如 PBO Manager。指向你的 Mod 源文件夹，设置正确的前缀（与 `config.cpp` 插件前缀匹配），然后构建。输出的 `.pbo` 文件放入你的 Mod 的 `Addons/` 文件夹。参见 [第 4.6 章](04-file-formats/06-pbo-packing.md)。

### 问：如何为服务器使用签名我的 Mod？
**答：** 使用 DayZ Tools 的 DSSignFile 或 DSCreateKey 生成密钥对：生成 `.biprivatekey` 和 `.bikey`。用私钥签署每个 PBO（在每个 PBO 旁边创建 `.bisign` 文件）。将 `.bikey` 分发给服务器管理员放入其 `keys/` 文件夹。永远不要分享你的 `.biprivatekey`。参见 [第 4.6 章](04-file-formats/06-pbo-packing.md)。

### 问：如何发布到 Steam 创意工坊？
**答：** 使用 DayZ Tools Publisher 或 Steam 创意工坊上传器。你需要在 Mod 根目录中有一个定义名称、作者和描述的 `mod.cpp` 文件。发布器上传你打包好的 PBO，Steam 分配一个创意工坊 ID。从同一账户重新发布来更新。参见 [第 2.3 章](02-mod-structure/03-mod-cpp.md) 和 [第 8.7 章](08-tutorials/07-publishing-workshop.md)。

### 问：我的 Mod 可以要求其他 Mod 作为依赖项吗？
**答：** 可以。在 `config.cpp` 中，将依赖 Mod 的 `CfgPatches` 类名添加到你的 `requiredAddons[]` 数组。`mod.cpp` 中没有正式的依赖系统 --- 在你的创意工坊描述中记录所需的 Mod。玩家必须订阅并加载所有必需的 Mod。参见 [第 2.2 章](02-mod-structure/02-config-cpp.md)。

---

## 高级主题

### 问：如何创建自定义玩家动作（交互）？
**答：** 扩展 `ActionBase`（或子类如 `ActionInteractBase`），定义 `CreateConditionComponents()` 作为前置条件，重写 `OnStart`/`OnExecute`/`OnEnd` 实现逻辑，并在目标实体的 `SetActions()` 中注册。动作支持持续（按住）和即时（点击）模式。参见 [第 6.12 章](06-engine-api/12-action-system.md)。

### 问：自定义物品的伤害系统如何工作？
**答：** 在物品的 config.cpp 中定义带有 `DamageZones`（命名区域）和 `ArmorType` 值的 `DamageSystem` 类。每个区域跟踪自己的生命值。在脚本中重写 `EEHitBy()` 和 `EEKilled()` 实现自定义伤害反应。引擎将模型的 Fire Geometry 组件映射到区域名称。参见 [第 6.1 章](06-engine-api/01-entity-system.md)。

### 问：如何向 Mod 添加自定义按键绑定？
**答：** 创建一个定义输入动作和默认按键分配的 `inputs.xml` 文件。通过 `GetUApi().RegisterInput()` 在脚本中注册。使用 `GetUApi().GetInputByName("your_action").LocalPress()` 查询状态。在 `stringtable.csv` 中添加本地化名称。参见 [第 5.2 章](05-config-files/02-inputs-xml.md) 和 [第 6.13 章](06-engine-api/13-input-system.md)。

### 问：如何使我的 Mod 与其他 Mod 兼容？
**答：** 遵循以下原则：(1) 在 modded class 重写中始终调用 `super`。(2) 使用带有 Mod 前缀的唯一类名（如 `MyMod_Manager`）。(3) 使用唯一的 RPC ID。(4) 不要在不调用 `super` 的情况下重写原版方法。(5) 使用 `#ifdef` 检测可选依赖项。(6) 与热门 Mod 组合（CF、Expansion 等）一起测试。参见 [第 7.2 章](07-patterns/02-module-systems.md)。

### 问：如何优化 Mod 的服务器性能？
**答：** 关键策略：(1) 避免每帧（`OnUpdate`）的逻辑 --- 使用定时器或事件驱动设计。(2) 缓存引用而不是重复调用 `GetGame().GetPlayer()`。(3) 使用 `GetGame().IsServer()` / `GetGame().IsClient()` 保护跳过不必要的代码。(4) 用 `int start = TickCount(0);` 基准测试进行性能分析。(5) 限制网络流量 --- 批量处理 RPC，频繁更新的小数据使用 Net Sync Variables。参见 [第 7.7 章](07-patterns/07-performance.md)。

---

*这里没有涵盖你的问题？在仓库中打开一个 Issue。*
