# 第4.7章：Workbench 指南

[首页](../README.md) | [<< 上一章：PBO 打包](06-pbo-packing.md) | **Workbench 指南** | [下一章：建筑建模 >>](08-building-modeling.md)

---

## 简介

Workbench 是 Bohemia Interactive 为 Enfusion 引擎开发的集成开发环境。它随 DayZ Tools 一起发行，是唯一在语言层面理解 Enforce Script 的官方工具。虽然许多模组开发者使用 VS Code 或其他编辑器编写代码，但 Workbench 在其他工具无法完成的任务上仍然不可或缺：将调试器附加到正在运行的 DayZ 实例、设置断点、逐步执行代码、在运行时检查变量、预览 `.layout` UI 文件、浏览游戏资源，以及通过内置控制台运行实时脚本命令。

---

## 目录

- [什么是 Workbench？](#what-is-workbench)
- [安装和设置](#installation-and-setup)
- [项目文件（.gproj）](#project-files-gproj)
- [Workbench 界面](#the-workbench-interface)
- [脚本编辑](#script-editing)
- [脚本调试](#debugging-scripts)
- [脚本控制台——实时测试](#script-console----live-testing)
- [UI / 布局预览](#ui--layout-preview)
- [资源浏览器](#resource-browser)
- [性能分析](#performance-profiling)
- [与文件补丁的集成](#integration-with-file-patching)
- [常见 Workbench 问题](#common-workbench-issues)
- [提示和最佳实践](#tips-and-best-practices)

---

## 什么是 Workbench？

Workbench 是 Bohemia 为 Enfusion 引擎开发的 IDE。它是 DayZ Tools 套件中唯一能够编译、分析和调试 Enforce Script 的工具。它有六个用途：

| 用途 | 说明 |
|---------|-------------|
| **脚本编辑** | `.c` 文件的语法高亮、代码补全和错误检查 |
| **脚本调试** | 断点、变量检查、调用栈、逐步执行 |
| **资源浏览** | 浏览和预览游戏资源——模型、纹理、配置、布局 |
| **UI / 布局预览** | `.layout` 控件层级的可视化预览及属性检查 |
| **性能分析** | 脚本性能分析、帧时间分析、内存监控 |
| **脚本控制台** | 对正在运行的游戏实例实时执行 Enforce Script 命令 |

Workbench 使用与 DayZ 相同的 Enfusion 脚本编译器。当 Workbench 报告编译错误时，该错误也会在游戏中出现——使其成为启动前的可靠预检工具。

### Workbench 不是什么

- **不是通用代码编辑器。** 它缺乏重构工具、Git 集成、多光标编辑以及 VS Code 的扩展生态系统。
- **不是游戏启动器。** 你仍然需要单独运行 `DayZDiag_x64.exe`；Workbench 连接到它。
- **不是构建 PBO 所必需的。** AddonBuilder 和构建脚本独立处理 PBO 打包。

---

## 安装和设置

### 步骤 1：安装 DayZ Tools

Workbench 包含在 DayZ Tools 中，通过 Steam 免费分发。打开 Steam 库，启用 **工具** 过滤器，搜索 **DayZ Tools**，然后安装（约 2 GB）。

### 步骤 2：定位 Workbench

```
Steam\steamapps\common\DayZ Tools\Bin\Workbench\
  workbenchApp.exe          <-- Workbench 可执行文件
  dayz.gproj                <-- 默认项目文件
```

### 步骤 3：挂载 P: 盘

Workbench 需要挂载 P: 盘（工作盘）。没有它，Workbench 无法启动或显示空的资源浏览器。通过 DayZ Tools Launcher、你项目的 `SetupWorkdrive.bat` 或手动挂载：`subst P: "D:\YourWorkDir"`。

### 步骤 4：提取原版脚本

Workbench 需要 P: 盘上的原版 DayZ 脚本来编译你的模组（因为你的代码扩展了原版类）：

```
P:\scripts\
  1_Core\
  2_GameLib\
  3_Game\
  4_World\
  5_Mission\
```

通过 DayZ Tools Launcher 提取这些脚本，或创建到已提取脚本目录的符号链接。

### 步骤 4b：将游戏安装目录链接到项目盘（用于实时热加载）

要允许 DayZDiag 直接从你的项目盘加载脚本（无需 PBO 重建即可实时编辑），创建从 DayZ 安装文件夹到 `P:\scripts` 的符号链接：

1. 导航到你的 DayZ 安装文件夹（通常是 `Steam\steamapps\common\DayZ`）。
2. 删除其中已有的 `scripts` 文件夹。
3. 以**管理员身份**打开命令提示符并运行：

```batch
mklink /J "C:\...\steamapps\common\DayZ\scripts" "P:\scripts"
```

将第一个路径替换为你实际的 DayZ 安装路径。完成后，DayZ 安装文件夹将包含一个指向 `P:\scripts` 的 `scripts` 联接。你在项目盘上所做的任何更改都会立即对游戏可见。

### 步骤 5：配置源数据目录

1. 启动 `workbenchApp.exe`。
2. 在菜单栏点击 **Workbench > Options**。
3. 将 **Source data directory** 设置为 `P:\`。
4. 点击 **OK** 并允许 Workbench 重新启动。

---

## 项目文件（.gproj）

`.gproj` 文件是 Workbench 的项目配置。它告诉 Workbench 在哪里找到脚本、加载哪些图像集用于布局预览，以及哪些控件样式可用。

### 文件位置

约定是将其放在模组内的 `Workbench/` 目录中：

```
P:\MyMod\
  Workbench\
    dayz.gproj
  Scripts\
    3_Game\
    4_World\
    5_Mission\
  config.cpp
```

### 结构概述

`.gproj` 使用专有文本格式（不是 JSON，不是 XML）：

```
GameProjectClass {
    ID "MyMod"
    TITLE "My Mod Name"
    Configurations {
        GameProjectConfigClass PC {
            platformHardware PC
            skeletonDefinitions "DZ/Anims/cfg/skeletons.anim.xml"

            FileSystem {
                FileSystemPathClass {
                    Name "Workdrive"
                    Directory "P:/"
                }
            }

            imageSets {
                "gui/imagesets/ccgui_enforce.imageset"
                "gui/imagesets/dayz_gui.imageset"
                "gui/imagesets/dayz_inventory.imageset"
                // ... 其他原版图像集 ...
                "MyMod/gui/imagesets/my_imageset.imageset"
            }

            widgetStyles {
                "gui/looknfeel/dayzwidgets.styles"
                "gui/looknfeel/widgets.styles"
            }

            ScriptModules {
                ScriptModulePathClass {
                    Name "core"
                    Paths {
                        "scripts/1_Core"
                        "MyMod/Scripts/1_Core"
                    }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "gameLib"
                    Paths { "scripts/2_GameLib" }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "game"
                    Paths {
                        "scripts/3_Game"
                        "MyMod/Scripts/3_Game"
                    }
                    EntryPoint "CreateGame"
                }
                ScriptModulePathClass {
                    Name "world"
                    Paths {
                        "scripts/4_World"
                        "MyMod/Scripts/4_World"
                    }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "mission"
                    Paths {
                        "scripts/5_Mission"
                        "MyMod/Scripts/5_Mission"
                    }
                    EntryPoint "CreateMission"
                }
                ScriptModulePathClass {
                    Name "workbench"
                    Paths { "MyMod/Workbench/ToolAddons" }
                    EntryPoint ""
                }
            }
        }
        GameProjectConfigClass XBOX_ONE { platformHardware XBOX_ONE }
        GameProjectConfigClass PS4 { platformHardware PS4 }
        GameProjectConfigClass LINUX { platformHardware LINUX }
    }
}
```

### 关键部分说明

**FileSystem** -- Workbench 搜索文件的根目录。至少包含 `P:/`。如果文件位于工作盘之外，你可以添加其他路径（例如，Steam DayZ 安装目录）。

**ScriptModules** -- 最重要的部分。将每个引擎层映射到脚本目录：

| 模块 | 层级 | 入口点 | 用途 |
|--------|-------|------------|---------|
| `core` | `1_Core` | `""` | 引擎核心，基本类型 |
| `gameLib` | `2_GameLib` | `""` | 游戏库工具 |
| `game` | `3_Game` | `"CreateGame"` | 枚举、常量、游戏初始化 |
| `world` | `4_World` | `""` | 实体、管理器 |
| `mission` | `5_Mission` | `"CreateMission"` | 任务钩子、UI 面板 |
| `workbench` | （工具） | `""` | Workbench 插件 |

原版路径在前，然后是你的模组路径。如果你的模组依赖其他模组（如 Community Framework），也要添加它们的路径：

```
ScriptModulePathClass {
    Name "game"
    Paths {
        "scripts/3_Game"              // 原版
        "JM/CF/Scripts/3_Game"        // Community Framework
        "MyMod/Scripts/3_Game"        // 你的模组
    }
    EntryPoint "CreateGame"
}
```

某些框架会覆盖入口点（CF 使用 `"CF_CreateGame"`）。

**imageSets / widgetStyles** -- 布局预览所必需。没有原版图像集，布局文件会显示缺失的图像。始终包含上述示例中列出的标准 14 个原版图像集。

### 路径前缀解析

当 Workbench 从模组的 `config.cpp` 自动解析脚本路径时，会在前面加上 FileSystem 路径。如果你的模组在 `P:\OtherMods\MyMod`，而 config.cpp 声明了 `MyMod/scripts/3_Game`，则 FileSystem 必须包含 `P:\OtherMods` 才能正确解析。

### 创建和启动

**创建 .gproj：** 从 `DayZ Tools\Bin\Workbench\` 复制默认的 `dayz.gproj`，更新 `ID`/`TITLE`，并将你的模组脚本路径添加到每个模块。

**使用自定义项目启动：**
```batch
workbenchApp.exe -project="P:\MyMod\Workbench\dayz.gproj"
```

**使用 -mod 启动（从 config.cpp 自动配置）：**
```batch
workbenchApp.exe -mod=P:\MyMod
workbenchApp.exe -mod=P:\CommunityFramework;P:\MyMod
```

`-mod` 方式更简单但控制力较弱。对于复杂的多模组设置，自定义 `.gproj` 更可靠。

---

## Workbench 界面

### 主菜单栏

| 菜单 | 关键项目 |
|------|-----------|
| **File** | 打开项目、最近项目、保存 |
| **Edit** | 剪切、复制、粘贴、查找、替换 |
| **View** | 切换面板开/关、重置布局 |
| **Workbench** | 选项（源数据目录、首选项） |
| **Debug** | 开始/停止调试、客户端/服务器切换、断点管理 |
| **Plugins** | 已安装的 Workbench 插件和工具附件 |

### 面板

- **资源浏览器**（左侧）-- P: 盘的文件树。双击 `.c` 文件编辑，`.layout` 文件预览，`.p3d` 查看模型，`.paa` 查看纹理。
- **脚本编辑器**（中间）-- 代码编辑区域，具有语法高亮、代码补全、错误下划线、行号、断点标记和多标签文件编辑。
- **输出**（底部）-- 编译器错误/警告、来自已连接游戏的 `Print()` 输出、调试消息。当连接到 DayZDiag 时，此窗口实时流式传输诊断可执行文件为调试目的打印的所有文本——与你在脚本日志中看到的输出相同。双击错误可导航到源代码行。
- **属性**（右侧）-- 选定对象的属性。在布局编辑器中用于控件检查时最有用。
- **控制台** -- 实时 Enforce Script 命令执行。
- **调试面板**（调试时）-- **Locals**（当前作用域变量）、**Watch**（用户表达式）、**Call Stack**（函数链）、**Breakpoints**（带启用/禁用切换的列表）。

---

## 脚本编辑

### 打开文件

1. **资源浏览器：** 双击 `.c` 文件。这会自动打开脚本编辑器模块并加载文件。
2. **脚本编辑器资源浏览器：** 脚本编辑器有自己的内置资源浏览器面板，与主 Workbench 资源浏览器分开。你可以使用任一个来导航和打开脚本文件。
3. **File > Open：** 标准文件对话框。
4. **错误输出：** 双击编译器错误可跳转到文件和行号。

### 语法高亮

| 元素 | 高亮方式 |
|---------|-------------|
| 关键字（`class`、`if`、`while`、`return`、`modded`、`override`） | 粗体 / 关键字颜色 |
| 类型（`int`、`float`、`string`、`bool`、`vector`、`void`） | 类型颜色 |
| 字符串、注释、预处理器指令 | 不同颜色 |

### 代码补全

在类名后输入 `.` 可查看方法和字段，或按 `Ctrl+Space` 获取建议。补全基于已编译的脚本上下文。功能可用但与 VS Code 相比有限——最适合快速 API 查找。

### 编译器反馈

Workbench 在保存时编译。常见错误：

| 消息 | 含义 |
|---------|---------|
| `Undefined variable 'xyz'` | 未声明或拼写错误 |
| `Method 'Foo' not found in class 'Bar'` | 错误的方法名或类 |
| `Cannot convert 'string' to 'int'` | 类型不匹配 |
| `Type 'MyClass' not found` | 文件不在项目中 |

### 查找、替换和转到定义

- `Ctrl+F` / `Ctrl+H` -- 在当前文件中查找/替换。
- `Ctrl+Shift+F` -- 在所有项目文件中搜索。
- 右键点击符号并选择 **Go to Definition** 可跳转到其声明，甚至可以跳转到原版脚本中。

---

## 脚本调试

调试是 Workbench 最强大的功能——暂停正在运行的 DayZ 实例，检查每个变量，逐行执行代码。

### 先决条件

- **DayZDiag_x64.exe**（不是零售版 DayZ）-- 仅 Diag 版本支持调试。
- **P: 盘已挂载** 且已提取原版脚本。
- **脚本必须匹配** -- 如果你在游戏加载后编辑，行号将不对齐。

### 设置调试会话

1. 打开 Workbench 并加载你的项目。
2. 打开 **Script Editor** 模块（从菜单栏或双击资源浏览器中的任何 `.c` 文件——这会自动打开脚本编辑器并加载文件）。
3. 单独启动 DayZDiag：

```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -connect=127.0.0.1 -port=2302
```

4. Workbench 自动检测 DayZDiag 并连接。屏幕右下角会出现一个简短的弹出窗口确认连接。

> **提示：** 如果你只需要查看控制台输出（不需要断点或逐步执行），则不需要提取 PBO 或将脚本加载到 Workbench 中。脚本编辑器仍会连接到 DayZDiag 并显示输出流。但是，断点和代码导航需要将匹配的脚本文件加载到项目中。

### 断点

点击行号旁边的左边距。会出现一个红点。

| 标记 | 含义 |
|--------|---------|
| 红点 | 活动断点——执行在此暂停 |
| 黄色感叹号 | 无效——此行从不执行 |
| 蓝点 | 书签——仅用于导航标记 |

使用 `F9` 切换。你还可以直接在边距区域（红点出现的位置）左键点击来添加或删除断点。在边距区域右键点击会添加蓝色**书签**——书签对执行没有影响，但标记你想要回访的位置。右键点击断点可设置**条件**（例如，`i == 10` 或 `player.GetIdentity().GetName() == "TestPlayer"`）。

### 逐步执行代码

| 操作 | 快捷键 | 说明 |
|--------|----------|-------------|
| 继续 | `F5` | 运行到下一个断点 |
| 单步跳过 | `F10` | 执行当前行，移到下一行 |
| 单步进入 | `F11` | 进入被调用的函数 |
| 单步跳出 | `Shift+F11` | 运行直到当前函数返回 |
| 停止 | `Shift+F5` | 断开连接并恢复游戏 |

### 变量检查

**Locals** 面板显示作用域中的所有变量——原始类型带值、对象带类名（可展开）、数组带长度，NULL 引用清晰标记。**Watch** 面板在每次暂停时评估自定义表达式。**Call Stack** 显示函数链；点击条目可导航。

### 客户端 vs 服务器调试

`DayZDiag_x64.exe` 可以作为客户端或服务器运行（通过添加 `-server` 启动参数）。它接受与零售版可执行文件相同的所有参数。Workbench 可以连接到任一实例。

使用脚本编辑器菜单中的 **Debug > Debug Client** 或 **Debug > Debug Server** 选择调试哪一端。在监听服务器上，你可以自由切换。逐步控制、断点和变量检查都适用于当前选择的一端。

### 限制

- 仅 `DayZDiag_x64.exe` 支持调试，零售版不支持。
- 无法逐步进入引擎内部 C++ 函数。
- 在高频函数（`OnUpdate`）中设置大量断点会导致严重卡顿。
- 大型模组项目可能会减慢 Workbench 索引速度。

---

## 脚本控制台——实时测试

脚本控制台允许你对正在运行的游戏实例执行 Enforce Script 命令——对于不编辑文件的 API 实验来说非常有价值。

### 打开方式

在底部面板中查找 **Console** 标签页，或通过 **View > Console** 启用。

### 常用命令

```c
// 打印玩家位置
Print(GetGame().GetPlayer().GetPosition().ToString());

// 在玩家脚下生成物品
GetGame().CreateObject("AKM", GetGame().GetPlayer().GetPosition(), false, false, true);

// 测试数学运算
float dist = vector.Distance("0 0 0", "100 0 100");
Print("Distance: " + dist.ToString());

// 传送玩家
GetGame().GetPlayer().SetPosition("6737 0 2505");

// 在附近生成僵尸
vector pos = GetGame().GetPlayer().GetPosition();
for (int i = 0; i < 5; i++)
{
    vector offset = Vector(Math.RandomFloat(-5, 5), 0, Math.RandomFloat(-5, 5));
    GetGame().CreateObject("ZmbF_JournalistNormal_Blue", pos + offset, false, false, true);
}
```

### 限制

- **默认仅客户端**（服务器端代码需要监听服务器）。
- **无持久状态** -- 变量不会在执行之间保留。
- **某些 API 不可用**，直到游戏达到特定状态（玩家已生成、任务已加载）。
- **无错误恢复** -- 空指针简单地静默失败。

---

## UI / 布局预览

Workbench 可以打开 `.layout` 文件进行可视化检查。

### 你可以做什么

- **查看控件层级** -- 查看父子嵌套和控件名称。
- **检查属性** -- 位置、大小、颜色、透明度、对齐、图像源、文本、字体。
- **查找控件名称** -- 用于脚本代码中的 `FindAnyWidget()`。
- **检查图像引用** -- 控件使用哪些图像集条目或纹理。

### 你不能做什么

- **无运行时行为** -- ScriptClass 处理程序和动态内容不会执行。
- **渲染差异** -- 透明度、分层和分辨率可能与游戏内不同。
- **有限的编辑功能** -- Workbench 主要是查看器，而非可视化设计器。

**最佳实践：** 使用布局编辑器进行检查。在文本编辑器中构建和编辑 `.layout` 文件。使用文件补丁在游戏内测试。

---

## 资源浏览器

资源浏览器使用游戏感知的文件预览浏览 P: 盘。

### 功能

| 文件类型 | 双击操作 |
|-----------|----------------------|
| `.c` | 在脚本编辑器中打开 |
| `.layout` | 在布局编辑器中打开 |
| `.p3d` | 3D 模型预览（旋转、缩放、检查 LOD） |
| `.paa` / `.edds` | 纹理查看器，带通道检查（R、G、B、A） |
| Config 类 | 浏览已解析的 CfgVehicles、CfgWeapons 层级 |

### 查找原版资源

最有价值的用途之一——研究 Bohemia 如何组织资源：

```
P:\DZ\weapons\        <-- 原版武器模型和纹理
P:\DZ\characters\     <-- 角色模型和服装
P:\scripts\4_World\   <-- 原版 World 层脚本
P:\scripts\5_Mission\  <-- 原版 Mission 层脚本
```

---

## 性能分析

当连接到 DayZDiag 时，Workbench 可以分析脚本执行。

### 分析器显示的内容

- **函数调用计数** -- 每帧每个函数运行的频率。
- **执行时间** -- 每个函数的毫秒数。
- **调用层级** -- 哪些函数调用了哪些函数，带时间归因。
- **帧时间分解** -- 脚本时间 vs 引擎时间。在 60 FPS 下，每帧有约 16.6ms 的预算。
- **内存** -- 按类统计的分配计数，检测引用循环泄漏。

### 游戏内脚本分析器（诊断菜单）

除了 Workbench 的分析器之外，`DayZDiag_x64.exe` 还有一个内置脚本分析器，可通过诊断菜单（在 Statistics 下）访问。它显示每类时间、每函数时间、类分配、每函数计数和类实例计数的前 20 名列表。使用 `-profile` 启动参数从启动时启用分析。分析器仅测量 Enforce Script -- proto（引擎）方法不作为单独条目测量，但其执行时间包含在调用它们的脚本方法的总时间中。参见原版脚本中的 `EnProfiler.c` 了解编程 API（`EnProfiler.Enable`、`EnProfiler.SetModule`、标志常量）。

### 常见瓶颈

| 问题 | 分析器症状 | 修复方法 |
|---------|-----------------|-----|
| 昂贵的每帧代码 | `OnUpdate` 中的高时间 | 移至计时器，降低频率 |
| 过度迭代 | 循环中有数千次调用 | 缓存结果，使用空间查询 |
| 循环中的字符串连接 | 高分配计数 | 减少日志，批量处理字符串 |

---

## 与文件补丁的集成

最快的开发工作流将 Workbench 与文件补丁结合，消除脚本更改的 PBO 重建。

### 设置

1. 脚本在 P: 盘上作为松散文件（不在 PBO 中）。
2. 符号链接 DayZ 安装的脚本：`mklink /J "...\DayZ\scripts" "P:\scripts"`
3. 使用 `-filePatching` 启动：客户端和服务器都使用 `DayZDiag_x64.exe`。

### 快速迭代循环

```
1. 在编辑器中编辑 .c 文件
2. 保存（文件已经在 P: 盘上）
3. 在 DayZDiag 中重启任务（无需 PBO 重建）
4. 在游戏中测试
5. 如需要在 Workbench 中设置断点
6. 重复
```

### 什么需要重建？

| 更改 | 需要重建？ |
|--------|----------|
| 脚本逻辑（`.c`） | 否——重启任务 |
| 布局文件（`.layout`） | 否——重启任务 |
| Config.cpp（仅脚本） | 否——重启任务 |
| Config.cpp（含 CfgVehicles） | 是——二进制化配置需要 PBO |
| 纹理（`.paa`） | 否——引擎从 P: 重新加载 |
| 模型（`.p3d`） | 可能——仅未二进制化的 MLOD |

---

## 常见 Workbench 问题

### Workbench 启动时崩溃

**原因：** P: 盘未挂载或 `.gproj` 引用了不存在的路径。
**修复：** 先挂载 P: 盘。检查 **Workbench > Options** 源目录。验证 `.gproj` FileSystem 路径是否存在。

### 没有代码补全

**原因：** 项目配置错误——Workbench 无法编译脚本。
**修复：** 验证 `.gproj` ScriptModules 是否包含原版路径（`scripts/1_Core` 等）。检查输出中的编译器错误。确保 P: 盘上有原版脚本。

### 脚本无法编译

**修复：** 检查输出面板中的确切错误。验证所有依赖模组路径是否在 ScriptModules 中。确保没有跨层引用（3_Game 不能使用 4_World 类型）。

### 断点未命中

**检查清单：**
1. 连接到 DayZDiag（不是零售版）？
2. 红点（有效）还是黄色感叹号（无效）？
3. Workbench 和游戏之间的脚本是否匹配？
4. 调试的是正确的一端（客户端 vs 服务器）？
5. 代码路径确实被执行到了？（添加 `Print()` 来验证。）

### 在资源浏览器中找不到文件

**修复：** 检查 `.gproj` FileSystem 是否包含文件所在的目录。修改 `.gproj` 后重启 Workbench。

### "Plugin Not Found" 错误

**修复：** 通过 Steam 验证 DayZ Tools 完整性（右键 > 属性 > 已安装的文件 > 验证）。如需要则重新安装。

### 连接 DayZDiag 失败

**修复：** 两个进程必须在同一台机器上。检查防火墙。确保在启动 DayZDiag 之前打开了脚本编辑器模块。尝试重启两者。

---

## 提示和最佳实践

1. **使用 Workbench 调试，VS Code 编写。** Workbench 的编辑器很基础。使用外部编辑器进行日常编码；切换到 Workbench 进行调试和布局预览。

2. **每个模组保留一个 .gproj。** 每个模组应有自己的项目文件，以便在不索引无关模组的情况下编译正确的脚本上下文。

3. **使用控制台进行 API 实验。** 在控制台中测试 API 调用，然后再写入文件。比编辑-重启-测试循环更快。

4. **优化前先分析。** 不要猜测瓶颈。分析器显示时间实际花在哪里。

5. **策略性地设置断点。** 避免 `OnUpdate()` 断点，除非带条件。它们每帧触发，会不断冻结游戏。

6. **使用书签进行导航。** 蓝色书签点标记你经常引用的有趣的原版脚本位置。

7. **启动前检查编译器输出。** 如果 Workbench 报告错误，游戏也会失败。先在 Workbench 中修复错误——比等待游戏启动更快。

8. **简单设置用 -mod，复杂设置用 .gproj。** 无依赖的单模组：`-mod=P:\MyMod`。多模组与 CF/Dabs：自定义 `.gproj`。

9. **保持 Workbench 更新。** 当 DayZ 更新时通过 Steam 更新 DayZ Tools。版本不匹配会导致编译失败。

---

## 快速参考：键盘快捷键

| 快捷键 | 操作 |
|----------|--------|
| `F5` | 开始 / 继续调试 |
| `Shift+F5` | 停止调试 |
| `F9` | 切换断点 |
| `F10` | 单步跳过 |
| `F11` | 单步进入 |
| `Shift+F11` | 单步跳出 |
| `Ctrl+F` | 在文件中查找 |
| `Ctrl+H` | 查找和替换 |
| `Ctrl+Shift+F` | 在项目中查找 |
| `Ctrl+S` | 保存 |
| `Ctrl+Space` | 代码补全 |

## 快速参考：启动参数

| 参数 | 说明 |
|-----------|-------------|
| `-project="path/dayz.gproj"` | 加载指定的项目文件 |
| `-mod=P:\MyMod` | 从模组的 config.cpp 自动配置 |
| `-mod=P:\ModA;P:\ModB` | 多个模组（分号分隔） |

---

## 导航

| 上一章 | 上级 | 下一章 |
|----------|----|------|
| [4.6 PBO 打包](06-pbo-packing.md) | [第4部分：文件格式与 DayZ Tools](01-textures.md) | [4.8 建筑建模](08-building-modeling.md) |
