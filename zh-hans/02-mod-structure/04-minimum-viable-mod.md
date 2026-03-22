# 第 2.4 章：你的第一个模组 -- 最小可行模组

[首页](../README.md) | [<< 上一章：mod.cpp 与 Workshop](03-mod-cpp.md) | **最小可行模组** | [下一章：文件组织 >>](05-file-organization.md)

---

> **摘要：** 本章将引导你从零开始创建最小的 DayZ 模组。完成后，你将拥有一个可以在游戏启动时向脚本日志打印消息的工作模组。三个文件，零依赖，五分钟以内。

---

## 目录

- [你需要什么](#你需要什么)
- [目标](#目标)
- [步骤 1：创建目录结构](#步骤-1创建目录结构)
- [步骤 2：创建 mod.cpp](#步骤-2创建-modcpp)
- [步骤 3：创建 config.cpp](#步骤-3创建-configcpp)
- [步骤 4：创建你的第一个脚本](#步骤-4创建你的第一个脚本)
- [步骤 5：打包与测试](#步骤-5打包与测试)
- [步骤 6：验证是否正常工作](#步骤-6验证是否正常工作)
- [理解发生了什么](#理解发生了什么)
- [下一步](#下一步)
- [故障排除](#故障排除)

---

## 你需要什么

- 已安装 DayZ 游戏（零售版或 DayZ Tools/Diag）
- 文本编辑器（VS Code、Notepad++ 或任何纯文本编辑器）
- 已安装 DayZ Tools（用于 PBO 打包）-- 或者你可以不打包直接测试（参见步骤 5）

---

## 目标

我们将创建一个名为 **HelloMod** 的模组，它：
1. 加载到 DayZ 中不报错
2. 在脚本日志中打印 `"[HelloMod] Mission started!"`
3. 使用正确的标准结构

这是 DayZ 版的"Hello World"。

---

## 步骤 1：创建目录结构

创建以下文件夹和文件。你总共需要 **3 个文件**：

```
HelloMod/
  mod.cpp
  Scripts/
    config.cpp
    5_Mission/
      HelloMod/
        HelloMission.c
```

这就是完整的结构。让我们逐个创建每个文件。

---

## 步骤 2：创建 mod.cpp

创建 `HelloMod/mod.cpp`，内容如下：

```cpp
name = "Hello Mod";
author = "YourName";
version = "1.0";
overview = "My first DayZ mod - prints a message on mission start.";
```

这是最基本的元数据。DayZ 启动器会在模组列表中显示"Hello Mod"。

---

## 步骤 3：创建 config.cpp

创建 `HelloMod/Scripts/config.cpp`，内容如下：

```cpp
class CfgPatches
{
    class HelloMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class HelloMod
    {
        dir = "HelloMod";
        name = "Hello Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "HelloMod/Scripts/5_Mission" };
            };
        };
    };
};
```

让我们分解每个部分的作用：

- **CfgPatches** 向引擎声明该模组。`requiredAddons` 表示我们依赖 `DZ_Data`（原版 DayZ 数据），确保我们在基础游戏之后加载。
- **CfgMods** 告诉引擎我们的脚本所在位置。我们只使用 `5_Mission`，因为那里提供了任务生命周期钩子。
- **dependencies** 列出了 `"Mission"`，因为我们的代码挂钩到任务脚本模块。

---

## 步骤 4：创建你的第一个脚本

创建 `HelloMod/Scripts/5_Mission/HelloMod/HelloMission.c`，内容如下：

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Server is running.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Client is running.");
    }
};
```

这段代码的作用：

- `modded class MissionServer` 扩展了原版服务器任务类。当服务器启动任务时，`OnInit()` 被触发，我们的消息就会被打印。
- `modded class MissionGameplay` 对客户端做了同样的事情。
- `super.OnInit()` 首先调用原始（原版）实现 -- 这非常重要。永远不要跳过它。
- `Print()` 将内容写入 DayZ 脚本日志文件。

---

## 步骤 5：打包与测试

你有两种测试选择：

### 选项 A：文件补丁（无需 PBO -- 仅限开发阶段）

DayZ 支持在开发期间加载未打包的模组。这是最快的迭代方式。

1. 将你的 `HelloMod/` 文件夹放在 DayZ 安装目录中（或使用 P: 驱动器和工作台）
2. 使用 `-filePatching` 参数启动 DayZ 并加载你的模组：

```
DayZDiag_x64.exe -mod=HelloMod -filePatching
```

这将直接从文件夹加载脚本，无需 PBO 打包。

### 选项 B：PBO 打包（发布所需）

对于 Workshop 发布或服务器部署，你需要打包成 PBO：

1. 打开 **DayZ Tools**（从 Steam）
2. 打开 **Addon Builder**
3. 将源目录设置为 `HelloMod/Scripts/`
4. 将输出设置为 `@HelloMod/Addons/HelloMod_Scripts.pbo`
5. 点击 **Pack**

或使用命令行打包工具如 `PBOConsole`：

```
PBOConsole.exe -pack HelloMod/Scripts @HelloMod/Addons/HelloMod_Scripts.pbo
```

将 `mod.cpp` 放在 `Addons/` 文件夹旁边：

```
@HelloMod/
  mod.cpp
  Addons/
    HelloMod_Scripts.pbo
```

然后启动 DayZ：

```
DayZDiag_x64.exe -mod=@HelloMod
```

---

## 步骤 6：验证是否正常工作

### 查找脚本日志

DayZ 将脚本输出写入你的配置文件目录中的日志文件：

```
Windows: C:\Users\YourName\AppData\Local\DayZ\
```

查找最新的 `.RPT` 或 `.log` 文件。脚本日志通常命名为：

```
script_<date>_<time>.log
```

### 要查找什么

打开日志文件并搜索 `[HelloMod]`。你应该看到：

```
[HelloMod] Mission started! Server is running.
```

或（如果你以客户端身份加入）：

```
[HelloMod] Mission started! Client is running.
```

如果你看到了这条消息，恭喜 -- 你的模组正常工作了。

### 如果你看到错误

如果日志中包含以 `SCRIPT (E):` 开头的行，说明出了问题。请参阅下面的[故障排除](#故障排除)部分。

---

## 理解发生了什么

以下是 DayZ 加载你的模组时的事件顺序：

```
1. 引擎启动，从所有 PBO 中读取 config.cpp 文件
2. CfgPatches "HelloMod_Scripts" 被注册
   --> requiredAddons 确保它在 DZ_Data 之后加载
3. CfgMods "HelloMod" 被注册
   --> 引擎知道了 missionScriptModule 路径
4. 引擎编译所有模组的 5_Mission 脚本
   --> HelloMission.c 被编译
   --> "modded class MissionServer" 修补原版类
5. 服务器启动任务
   --> MissionServer.OnInit() 被调用
   --> 你的覆写运行，首先调用 super.OnInit()
   --> Print() 写入脚本日志
6. 客户端连接并加载
   --> MissionGameplay.OnInit() 被调用
   --> 你的覆写运行
   --> Print() 写入客户端日志
```

`modded` 关键字是关键机制。它告诉引擎"取现有的类，并在其上添加我的更改"。这是每个 DayZ 模组与原版代码集成的方式。

---

## 下一步

现在你有了一个工作模组，以下是自然的进阶方向：

### 添加 3_Game 层

添加不依赖于世界实体的配置数据或常量：

```
HelloMod/
  Scripts/
    config.cpp              <-- 添加 gameScriptModule 条目
    3_Game/
      HelloMod/
        HelloConfig.c       <-- 配置类
    5_Mission/
      HelloMod/
        HelloMission.c      <-- 现有文件
```

更新 `config.cpp` 以包含新层：

```cpp
dependencies[] = { "Game", "Mission" };

class defs
{
    class gameScriptModule
    {
        value = "";
        files[] = { "HelloMod/Scripts/3_Game" };
    };
    class missionScriptModule
    {
        value = "";
        files[] = { "HelloMod/Scripts/5_Mission" };
    };
};
```

### 添加 4_World 层

创建自定义物品、扩展玩家或添加世界管理器：

```
HelloMod/
  Scripts/
    config.cpp              <-- 添加 worldScriptModule 条目
    3_Game/
      HelloMod/
        HelloConfig.c
    4_World/
      HelloMod/
        HelloManager.c      <-- 世界感知逻辑
    5_Mission/
      HelloMod/
        HelloMission.c
```

### 添加 UI

创建简单的游戏内面板（在本指南的第 3 部分中介绍）：

```
HelloMod/
  GUI/
    layouts/
      hello_panel.layout    <-- UI 布局文件
  Scripts/
    5_Mission/
      HelloMod/
        HelloPanel.c        <-- UI 脚本
```

### 添加自定义物品

在 `Data/config.cpp` 中定义物品，并在 `4_World` 中创建其脚本行为：

```
HelloMod/
  Data/
    config.cpp              <-- 包含物品定义的 CfgVehicles
    Models/
      hello_item.p3d        <-- 3D 模型
  Scripts/
    4_World/
      HelloMod/
        HelloItem.c         <-- 物品行为脚本
```

### 依赖框架

如果你想使用 Community Framework (CF) 的功能，添加依赖：

```cpp
// 在 config.cpp 中
requiredAddons[] = { "DZ_Data", "JM_CF_Scripts" };
```

---

## 故障排除

### "Addon HelloMod_Scripts requires addon DZ_Data which is not loaded"

你的 `requiredAddons` 引用了一个不存在的插件。确保 `DZ_Data` 拼写正确且 DayZ 基础游戏已加载。

### 没有日志输出（模组似乎没有加载）

按以下顺序检查：

1. **模组是否在启动参数中？** 验证你的启动命令中是否有 `-mod=HelloMod` 或 `-mod=@HelloMod`。
2. **config.cpp 位置是否正确？** 它必须在 PBO 的根目录（或使用文件补丁时在 `Scripts/` 文件夹的根目录）。
3. **脚本路径是否正确？** `config.cpp` 中 `files[]` 的路径必须与实际目录结构匹配。`"HelloMod/Scripts/5_Mission"` 意味着引擎会查找该确切路径。
4. **是否有 CfgPatches 类？** 没有它，PBO 会被忽略。

### SCRIPT (E): Undefined variable / Undefined type

你的代码引用了该层中不存在的内容。常见原因：

- 从 `3_Game` 引用 `PlayerBase`（它定义在 `4_World` 中）
- 类名或变量名拼写错误
- 缺少 `super.OnInit()` 调用（导致级联故障）

### SCRIPT (E): Member not found

你调用的方法或属性在该类上不存在。仔细检查原版 API。常见错误：在运行旧版本 DayZ 时调用新版本的方法。

### 模组加载了但脚本不运行

- 检查你的 `.c` 文件是否在 `files[]` 列出的目录中
- 确保文件扩展名为 `.c`（不是 `.txt` 或 `.cs`）
- 验证 `modded class` 名称与原版类完全匹配（区分大小写）

### PBO 打包错误

- 确保 `config.cpp` 在 PBO 内部的根级别
- PBO 内部的文件路径使用正斜杠（`/`），而不是反斜杠
- 确保 Scripts 文件夹中没有二进制文件（只有 `.c` 和 `.cpp`）

---

## 最佳实践

- 在修改的任务类中，始终在自定义代码之前调用 `super.OnInit()` -- 跳过它会破坏其他模组的初始化。
- 在 `Print()` 消息中使用唯一前缀（例如 `[HelloMod]`），以便你可以快速搜索日志文件。
- 从仅使用 `5_Mission` 开始。随着模组的增长，逐步添加 `3_Game` 和 `4_World` 层。
- 在开发期间使用 `-filePatching`，避免每次修改都重新打包 PBO。
- 在第一个模组工作之前，将文件数量保持在 3 个以内，然后再扩展。调试最小结构要容易得多。

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| `Print()` 输出到日志 | 消息出现在脚本日志中 | 输出到 `.RPT` 文件，而不是单独的脚本日志。在专用服务器上，检查配置文件夹中的服务器 RPT |
| `-filePatching` 加载松散文件 | 未打包的模组立即可用 | 某些资源（模型、纹理）仍然需要 PBO 打包；脚本可以松散加载，但 `.layout` 文件可能不会在所有设置中从未打包的文件夹加载 |
| `modded class` 修补原版 | 你的覆写替换原始的 | 多个模组可以对同一个类使用 `modded class`；它们按加载顺序链接。如果一个跳过了 `super.OnInit()`，所有后续模组都会中断 |
| `DZ_Data` 是唯一需要的依赖 | 最小的 `requiredAddons` | 对于纯脚本模组有效，但如果你引用了任何原版武器/物品类，你还需要 `DZ_Scripts` 或特定的原版 PBO |
| 三个文件就够了 | 模组用 mod.cpp + config.cpp + 一个 .c 文件加载 | 对于纯脚本模组是正确的，但添加物品或 UI 需要额外的 PBO（Data、GUI） |

---

## 完整文件列表

作为参考，以下是所有三个文件的完整内容：

### HelloMod/mod.cpp

```cpp
name = "Hello Mod";
author = "YourName";
version = "1.0";
overview = "My first DayZ mod - prints a message on mission start.";
```

### HelloMod/Scripts/config.cpp

```cpp
class CfgPatches
{
    class HelloMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class HelloMod
    {
        dir = "HelloMod";
        name = "Hello Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "HelloMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### HelloMod/Scripts/5_Mission/HelloMod/HelloMission.c

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Server is running.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Client is running.");
    }
};
```

---

**上一章：** [第 2.3 章：mod.cpp 与 Workshop](03-mod-cpp.md)
**下一章：** [第 2.5 章：文件组织最佳实践](05-file-organization.md)
