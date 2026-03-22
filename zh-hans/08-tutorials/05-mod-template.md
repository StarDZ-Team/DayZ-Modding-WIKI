# 第 8.5 章：使用 DayZ Mod 模板

> **摘要：** 本教程说明如何使用 InclementDab 的开源 DayZ Mod 模板，在数秒内创建新的 Mod 项目。您不需要从零创建每个文件，只需克隆一个已包含正确文件夹结构、config.cpp、mod.cpp 和脚本层级存根的现成骨架。重命名几个项目后，即可立即开始编写代码。

---

## 目录

- [什么是 DayZ Mod 模板？](#什么是-dayz-mod-模板)
- [模板提供的内容](#模板提供的内容)
- [步骤 1：克隆或下载模板](#步骤-1克隆或下载模板)
- [步骤 2：了解文件结构](#步骤-2了解文件结构)
- [步骤 3：重命名 Mod](#步骤-3重命名-mod)
- [步骤 4：更新 config.cpp](#步骤-4更新-configcpp)
- [步骤 5：更新 mod.cpp](#步骤-5更新-modcpp)
- [步骤 6：重命名脚本文件夹和文件](#步骤-6重命名脚本文件夹和文件)
- [步骤 7：构建与测试](#步骤-7构建与测试)
- [与 DayZ Tools 和 Workbench 的集成](#与-dayz-tools-和-workbench-的集成)
- [模板 vs 手动设置](#模板-vs-手动设置)
- [后续步骤](#后续步骤)

---

## 什么是 DayZ Mod 模板？

**DayZ Mod 模板**是由 InclementDab 维护的开源仓库，提供完整的、可直接使用的 DayZ Mod 骨架：

**仓库：** [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)

与手动创建每个文件（如 [第 8.1 章：你的第一个 Mod](01-first-mod.md) 所述）不同，模板提供了一个预建的目录结构，所有样板代码已就位。您只需克隆它、重命名几个标识符，即可准备编写游戏逻辑。

这是任何已创建过 Hello World Mod 并希望进入更复杂项目的人的推荐起点。

---

## 模板提供的内容

模板包含 DayZ Mod 编译和加载所需的一切：

| 文件 / 文件夹 | 用途 |
|---------------|---------|
| `mod.cpp` | 在 DayZ 启动器中显示的 Mod 元数据（名称、作者、版本） |
| `config.cpp` | 向引擎注册 Mod 的 CfgPatches 和 CfgMods 声明 |
| `Scripts/3_Game/` | Game 层脚本存根（枚举、常量、配置类） |
| `Scripts/4_World/` | World 层脚本存根（实体、管理器、世界交互） |
| `Scripts/5_Mission/` | Mission 层脚本存根（UI、任务钩子） |
| `.gitignore` | 为 DayZ 开发预先配置的忽略规则（PBO、日志、临时文件） |

模板遵循 [第 2.1 章：五层脚本层次结构](../02-mod-structure/01-five-layers.md) 中记载的标准五层脚本层级。所有三个脚本层都在 config.cpp 中连接，因此您可以在不进行额外配置的情况下，立即在任何层中放置代码。

---

## 步骤 1：克隆或下载模板

### 选项 A：使用 GitHub 的「Use this template」功能

1. 前往 [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)
2. 点击仓库顶部的绿色 **「Use this template」** 按钮
3. 选择 **「Create a new repository」**
4. 为您的仓库命名（例如：`MyAwesomeMod`）
5. 将新仓库克隆至 P: 驱动器：

```bash
cd P:\
git clone https://github.com/YourUsername/MyAwesomeMod.git
```

### 选项 B：直接克隆

如果您不需要自己的 GitHub 仓库，可直接克隆模板：

```bash
cd P:\
git clone https://github.com/InclementDab/DayZ-Mod-Template.git MyAwesomeMod
```

### 选项 C：下载为 ZIP

1. 前往仓库页面
2. 点击 **Code**，然后点击 **Download ZIP**
3. 将 ZIP 解压至 `P:\MyAwesomeMod\`

---

## 步骤 2：了解文件结构

克隆后，您的 Mod 目录如下：

```
P:\MyAwesomeMod\
    mod.cpp
    Scripts\
        config.cpp
        3_Game\
            ModName\
                (game-layer scripts)
        4_World\
            ModName\
                (world-layer scripts)
        5_Mission\
            ModName\
                (mission-layer scripts)
```

### 各部分的作用

**`mod.cpp`** 是 Mod 的身份证。它控制玩家在 DayZ 启动器 Mod 列表中看到的内容。所有可用字段请参阅 [第 2.3 章：mod.cpp 与 Workshop](../02-mod-structure/03-mod-cpp.md)。

**`Scripts/config.cpp`** 是最关键的文件。它告诉 DayZ 引擎：
- 您的 Mod 依赖什么（`CfgPatches.requiredAddons[]`）
- 每个脚本层在哪里（`CfgMods.class defs`）
- 要设置哪些预处理器定义（`defines[]`）

完整参考请见 [第 2.2 章：config.cpp 深入解析](../02-mod-structure/02-config-cpp.md)。

**`Scripts/3_Game/`** 最先加载。在此放置枚举、常量、RPC ID、配置类，以及不引用世界实体的任何内容。

**`Scripts/4_World/`** 第二个加载。在此放置实体类（`modded class ItemBase`）、管理器，以及与游戏对象交互的任何内容。

**`Scripts/5_Mission/`** 最后加载。在此放置任务钩子（`modded class MissionServer`）、UI 面板和启动逻辑。此层可以引用所有较低层的类型。

---

## 步骤 3：重命名 Mod

模板附带了占位名称。您需要将它们替换为 Mod 的实际名称。以下是系统化的方法。

### 选择名称

在进行任何编辑之前，决定以下内容：

| 标识符 | 示例 | 使用于 |
|------------|---------|---------|
| **Mod 显示名称** | `"My Awesome Mod"` | mod.cpp、config.cpp |
| **目录名称** | `MyAwesomeMod` | 文件夹名称、config.cpp 路径 |
| **CfgPatches 类** | `MyAwesomeMod_Scripts` | config.cpp CfgPatches |
| **CfgMods 类** | `MyAwesomeMod` | config.cpp CfgMods |
| **脚本子文件夹** | `MyAwesomeMod` | 3_Game/、4_World/、5_Mission/ 内 |
| **预处理器定义** | `MYAWESOMEMOD` | config.cpp defines[]、#ifdef 检查 |

### 命名规则

- 目录名称和类名中**不可使用空格或特殊字符**。请使用 PascalCase 或下划线。
- **CfgPatches 类名必须全局唯一。** 两个具有相同 CfgPatches 类名的 Mod 会冲突。请使用 Mod 名称作为前缀。
- 每个层级内的**脚本子文件夹名称**应与 Mod 名称一致以保持一致性。

---

## 步骤 4：更新 config.cpp

打开 `Scripts/config.cpp` 并更新以下部分。

### CfgPatches

将模板类名替换为您自己的：

```cpp
class CfgPatches
{
    class MyAwesomeMod_Scripts    // <-- Your unique patch name
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"            // Base game dependency
        };
    };
};
```

如果您的 Mod 依赖另一个 Mod，请将其 CfgPatches 类名加入 `requiredAddons[]`：

```cpp
requiredAddons[] =
{
    "DZ_Data",
    "CF_Scripts"              // Depends on Community Framework
};
```

### CfgMods

更新 Mod 的身份和脚本路径：

```cpp
class CfgMods
{
    class MyAwesomeMod
    {
        dir = "MyAwesomeMod";
        name = "My Awesome Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/5_Mission" };
            };
        };
    };
};
```

**要点：**
- `dir` 的值必须与 Mod 的根文件夹名称完全一致。
- 每个 `files[]` 路径相对于 Mod 根目录。
- `dependencies[]` 数组应列出您钩入的原版脚本模块。大多数 Mod 使用全部三个：`"Game"`、`"World"` 和 `"Mission"`。

### 预处理器定义（可选）

如果您希望其他 Mod 能检测到您的 Mod，请添加 `defines[]` 数组：

```cpp
class MyAwesomeMod
{
    // ... (other fields above)

    class defs
    {
        class gameScriptModule
        {
            value = "";
            files[] = { "MyAwesomeMod/Scripts/3_Game" };
        };
        // ... other modules ...
    };

    // Enable cross-mod detection
    defines[] = { "MYAWESOMEMOD" };
};
```

其他 Mod 可以使用 `#ifdef MYAWESOMEMOD` 来条件编译与您的 Mod 集成的代码。

---

## 步骤 5：更新 mod.cpp

打开根目录中的 `mod.cpp`，使用 Mod 的信息进行更新：

```cpp
name         = "My Awesome Mod";
author       = "YourName";
version      = "1.0.0";
overview     = "A brief description of what your mod does.";
picture      = "";             // Optional: path to a preview image
logo         = "";             // Optional: path to a logo
logoSmall    = "";             // Optional: path to a small logo
logoOver     = "";             // Optional: path to a logo hover state
tooltip      = "My Awesome Mod";
action       = "";             // Optional: URL to your mod's website
```

至少设置 `name`、`author` 和 `overview`。其他字段为可选，但可改善启动器中的展示效果。

---

## 步骤 6：重命名脚本文件夹和文件

将每个层级内的脚本子文件夹重命名以匹配 Mod 名称：

```
Scripts/3_Game/ModName/    -->  Scripts/3_Game/MyAwesomeMod/
Scripts/4_World/ModName/   -->  Scripts/4_World/MyAwesomeMod/
Scripts/5_Mission/ModName/ -->  Scripts/5_Mission/MyAwesomeMod/
```

在这些文件夹内，重命名任何占位 `.c` 文件并更新类名。例如，如果模板包含一个名为 `ModInit` 的类的 `ModInit.c` 文件，将其重命名为 `MyAwesomeModInit.c` 并更新类：

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyAwesomeMod] Server initialized!");
    }
};
```

---

## 步骤 7：构建与测试

### 使用文件修补（快速迭代）

开发期间最快的测试方式：

```batch
DayZDiag_x64.exe -mod=P:\MyAwesomeMod -filePatching
```

这会直接从源码文件夹加载脚本，而不需打包 PBO。编辑 `.c` 文件，重启游戏，即可立即看到更改。

### 使用 Addon Builder（用于分发）

准备好分发时：

1. 从 Steam 打开 **DayZ Tools**
2. 启动 **Addon Builder**
3. 将 **Source directory** 设为 `P:\MyAwesomeMod\Scripts\`
4. 将 **Output directory** 设为 `P:\@MyAwesomeMod\Addons\`
5. 将 **Prefix** 设为 `MyAwesomeMod\Scripts`
6. 点击 **Pack**

然后将 `mod.cpp` 复制到 `Addons` 文件夹旁边：

```
P:\@MyAwesomeMod\
    mod.cpp
    Addons\
        Scripts.pbo
```

### 在脚本日志中验证

启动后，检查脚本日志中的消息：

```
%localappdata%\DayZ\script_<date>_<time>.log
```

搜索 Mod 的前缀标签（例如：`[MyAwesomeMod]`）。

---

## 与 DayZ Tools 和 Workbench 的集成

### Workbench

DayZ Workbench 可以使用语法高亮打开和编辑 Mod 的脚本：

1. 从 DayZ Tools 打开 **Workbench**
2. 前往 **File > Open** 并导航至 Mod 的 `Scripts/` 文件夹
3. 打开任何 `.c` 文件，使用基本的 Enforce Script 支持进行编辑

Workbench 会读取 `config.cpp` 来了解哪些文件属于哪个脚本模块，因此正确配置 config.cpp 是必要的。

### P: 驱动器设置

模板设计为从 P: 驱动器运行。如果您克隆到其他位置，请创建链接：

```batch
mklink /J P:\MyAwesomeMod "D:\Projects\MyAwesomeMod"
```

这使得 Mod 可在 `P:\MyAwesomeMod` 访问而无需移动文件。

### Addon Builder 自动化

对于重复构建，您可以在 Mod 的根目录创建批处理文件：

```batch
@echo off
set DAYZ_TOOLS="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"
set SOURCE=P:\MyAwesomeMod\Scripts
set OUTPUT=P:\@MyAwesomeMod\Addons
set PREFIX=MyAwesomeMod\Scripts

%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe %SOURCE% %OUTPUT% -prefix=%PREFIX% -clear
echo Build complete.
pause
```

---

## 模板 vs 手动设置

| 方面 | 模板 | 手动（第 8.1 章） |
|--------|----------|----------------------|
| **首次构建时间** | 约 2 分钟 | 约 15 分钟 |
| **全部 3 个脚本层** | 预先配置 | 按需添加 |
| **config.cpp** | 包含所有模块的完整版 | 最简版（仅 mission） |
| **Git 就绪** | 包含 .gitignore | 自行创建 |
| **学习价值** | 较低（文件已预建） | 较高（自己构建一切） |
| **推荐对象** | 有经验的模组者、新项目 | 学习基础的初学者 |

**建议：** 如果这是您的第一个 DayZ Mod，请先阅读 [第 8.1 章](01-first-mod.md) 以了解每个文件。熟悉后，在所有未来项目中使用模板。

---

## 后续步骤

当您的模板式 Mod 启动运行后，您可以：

1. **添加自定义物品** -- 按照 [第 8.2 章：创建自定义物品](02-custom-item.md) 在 config.cpp 中定义物品。
2. **构建管理面板** -- 按照 [第 8.3 章：构建管理面板](03-admin-panel.md) 创建服务器管理 UI。
3. **添加聊天命令** -- 按照 [第 8.4 章：添加聊天命令](04-chat-commands.md) 实现游戏内文本命令。
4. **深入学习 config.cpp** -- 阅读 [第 2.2 章：config.cpp 深入解析](../02-mod-structure/02-config-cpp.md) 以了解每个字段。
5. **学习 mod.cpp 选项** -- 阅读 [第 2.3 章：mod.cpp 与 Workshop](../02-mod-structure/03-mod-cpp.md) 以了解 Workshop 发布。
6. **添加依赖项** -- 如果 Mod 使用 Community Framework 或其他 Mod，请更新 `requiredAddons[]` 并参阅 [第 2.4 章：你的第一个 Mod](../02-mod-structure/04-minimum-viable-mod.md)。

---

**上一篇：** [第 8.4 章：添加聊天命令](04-chat-commands.md) | [首页](../../README.md)
