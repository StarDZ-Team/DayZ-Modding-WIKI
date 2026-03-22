# 第 8.1 章：你的第一个 Mod（Hello World）

[首页](../README.md) | **你的第一个 Mod** | [下一章：创建自定义物品 >>](02-custom-item.md)

---

> **概要：** 本教程将引导你从零开始创建你的第一个 DayZ Mod。你将安装工具、设置工作区、编写三个文件、打包 PBO、在 DayZ 中加载 Mod，并通过读取脚本日志验证它是否工作。无需任何 DayZ Modding 经验。

---

## 目录

- [先决条件](#先决条件)
- [步骤 1：安装 DayZ Tools](#步骤-1安装-dayz-tools)
- [步骤 2：设置 P: 驱动器（Workdrive）](#步骤-2设置-p-驱动器workdrive)
- [步骤 3：创建 Mod 目录结构](#步骤-3创建-mod-目录结构)
- [步骤 4：编写 mod.cpp](#步骤-4编写-modcpp)
- [步骤 5：编写 config.cpp](#步骤-5编写-configcpp)
- [步骤 6：编写你的第一个脚本](#步骤-6编写你的第一个脚本)
- [步骤 7：使用 Addon Builder 打包 PBO](#步骤-7使用-addon-builder-打包-pbo)
- [步骤 8：在 DayZ 中加载 Mod](#步骤-8在-dayz-中加载-mod)
- [步骤 9：在脚本日志中验证](#步骤-9在脚本日志中验证)
- [步骤 10：常见问题排查](#步骤-10常见问题排查)
- [完整文件参考](#完整文件参考)
- [下一步](#下一步)

---

## 先决条件

在开始之前，确保你具备以下条件：

- **Steam** 已安装并登录
- **DayZ** 游戏已安装（来自 Steam 的零售版）
- 一个**文本编辑器**（VS Code、Notepad++ 或甚至记事本）
- 约 **15 GB 可用磁盘空间**（用于 DayZ Tools）

这就是全部。本教程不需要任何编程经验 --- 每一行代码都会得到解释。

---

## 步骤 1：安装 DayZ Tools

DayZ Tools 是 Steam 上的免费应用程序，包含构建 Mod 所需的一切：Workbench 脚本编辑器、用于 PBO 打包的 Addon Builder、Terrain Builder 和 Object Builder。

### 安装方法

1. 打开 **Steam**
2. 转到**库**
3. 在顶部的下拉筛选器中，将**游戏**更改为**工具**
4. 搜索 **DayZ Tools**
5. 点击**安装**
6. 等待下载完成（大约 12-15 GB）

安装后，你会在 Steam 库的工具下找到 DayZ Tools。默认安装路径：

```
C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\
```

### 安装的工具

| 工具 | 用途 |
|------|---------|
| **Addon Builder** | 将 Mod 文件打包为 `.pbo` 归档 |
| **Workbench** | 带语法高亮的脚本编辑器 |
| **Object Builder** | `.p3d` 文件的 3D 模型查看器/编辑器 |
| **Terrain Builder** | 地图/地形编辑器 |
| **TexView2** | 纹理查看器/转换器（`.paa`、`.edds`） |

本教程只需要 **Addon Builder**。其他工具以后会用到。

---

## 步骤 2：设置 P: 驱动器（Workdrive）

DayZ Modding 使用虚拟驱动器盘符 **P:** 作为共享工作区。所有 Mod 和游戏数据引用以 P: 开头的路径，这样可以保持不同机器之间路径的一致性。

### 创建 P: 驱动器

1. 从 Steam 打开 **DayZ Tools**
2. 在 DayZ Tools 主窗口中，点击 **P: Drive Management**
3. 点击 **Create/Mount P: Drive**
4. 选择 P: 驱动器数据的位置（默认即可，或选择有足够空间的驱动器）
5. 等待过程完成

### 验证是否工作

打开**文件资源管理器**并导航到 `P:\`。你应该能看到包含 DayZ 游戏数据的目录。如果 P: 驱动器存在并且可以浏览，你就可以继续了。

### 替代方法：手动 P: 驱动器

如果 DayZ Tools GUI 不工作，你可以使用 Windows 命令提示符（以管理员身份运行）手动创建 P: 驱动器：

```batch
subst P: "C:\DayZWorkdrive"
```

将 `C:\DayZWorkdrive` 替换为你想要的任何文件夹。这将创建一个临时驱动器映射，持续到重启为止。

---

## 步骤 3：创建 Mod 目录结构

每个 DayZ Mod 都遵循特定的文件夹结构。在 P: 驱动器上创建以下目录和文件：

```
P:\MyFirstMod\
    mod.cpp
    Scripts\
        config.cpp
        5_Mission\
            MyFirstMod\
                MissionHello.c
```

### 创建文件夹

1. 打开**文件资源管理器**
2. 导航到 `P:\`
3. 创建名为 `MyFirstMod` 的新文件夹
4. 在 `MyFirstMod` 内创建 `Scripts` 文件夹
5. 在 `Scripts` 内创建 `5_Mission` 文件夹
6. 在 `5_Mission` 内创建 `MyFirstMod` 文件夹

### 理解结构

| 路径 | 用途 |
|------|---------|
| `MyFirstMod/` | Mod 的根目录 |
| `mod.cpp` | DayZ 启动器中显示的元数据（名称、作者） |
| `Scripts/config.cpp` | 告诉引擎你的 Mod 依赖什么以及脚本在哪里 |
| `Scripts/5_Mission/` | 任务脚本层（UI、启动钩子） |
| `Scripts/5_Mission/MyFirstMod/MissionHello.c` | 你的实际脚本文件 |

你只需要 **3 个文件**。让我们逐个创建它们。

---

## 步骤 4：编写 mod.cpp

在文本编辑器中创建文件 `P:\MyFirstMod\mod.cpp` 并粘贴以下内容：

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### 每行的含义

- **`name`** -- 在 DayZ 启动器 Mod 列表中显示的名称。
- **`author`** -- 你的名称或团队名称。
- **`version`** -- 任何版本字符串。引擎不会解析它。
- **`overview`** -- 展开 Mod 详情时显示的描述。

保存文件。这就是你的 Mod 的身份卡。

---

## 步骤 5：编写 config.cpp

创建文件 `P:\MyFirstMod\Scripts\config.cpp` 并粘贴以下内容：

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
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
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### 各部分的含义

**CfgPatches** 向 DayZ 引擎声明你的 Mod：

- `class MyFirstMod_Scripts` -- 你的 Mod 脚本包的唯一标识符。
- `requiredAddons[] = { "DZ_Data" };` -- 依赖项。确保你的 Mod 在基础游戏之后加载。

**CfgMods** 告诉引擎你的脚本在哪里：

- `type = "mod";` -- 客户端+服务器 Mod。
- `class missionScriptModule` -- 编译 `MyFirstMod/Scripts/5_Mission/` 中的所有 `.c` 文件。

---

## 步骤 6：编写你的第一个脚本

创建文件 `P:\MyFirstMod\Scripts\5_Mission\MyFirstMod\MissionHello.c` 并粘贴以下内容：

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

### 逐行解释

`modded` 关键字是 DayZ Modding 的核心。它表示：「获取原版游戏中现有的类，并在其上添加我的修改。」

`override` 告诉编译器这个方法已经存在于父类中，我们用自己的版本替换它。

`super.OnInit()` **至关重要** --- 它调用原始的原版实现。如果跳过这一行，游戏会出错。始终首先调用 `super`。

`Print()` 将消息写入脚本日志文件。`[MyFirstMod]` 前缀让你在日志中轻松找到消息。

---

## 步骤 7：使用 Addon Builder 打包 PBO

1. 从 Steam 打开 **DayZ Tools** 并启动 **Addon Builder**
2. 将 **Source directory** 设置为：`P:\MyFirstMod\Scripts\`
3. 将 **Output directory** 设置为：`P:\@MyFirstMod\Addons\`
4. 将 **Prefix** 设置为：`MyFirstMod\Scripts`
5. 点击 **Pack**

成功后将 `mod.cpp` 复制到 `@MyFirstMod\` 文件夹中。

**开发替代方案：** 使用 `-filePatching` 跳过 PBO 打包，直接从源文件夹加载：

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

---

## 步骤 8：在 DayZ 中加载 Mod

**启动器方式：** 在 DayZ 启动器的 Mods 标签中添加本地 Mod。

**命令行方式（推荐）：**

```batch
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching -server -port=2302
```

---

## 步骤 9：在脚本日志中验证

日志位于 `%localappdata%\DayZ\`，文件名类似 `script_2025-01-15_14-30-22.log`。

搜索 `[MyFirstMod]`。如果看到你的消息，恭喜 --- 你的第一个 Mod 正在工作！

---

## 步骤 10：常见问题排查

| 问题 | 原因 | 修复 |
|------|------|------|
| 没有日志输出 | `-mod=` 路径错误或 config.cpp 位置不对 | 验证路径和文件位置 |
| `Undefined variable` 错误 | 类名拼写错误或脚本层错误 | 检查拼写和文件位置 |
| `Member not found` 错误 | 方法名不存在 | 检查原版 API 中的正确方法名 |
| Mod 加载但不执行 | 文件扩展名为 `.c.txt` | 确保扩展名是 `.c` |
| 启动时崩溃 | config.cpp 语法错误 | 检查分号和花括号 |

---

## 完整文件参考

### `MyFirstMod/mod.cpp`

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### `MyFirstMod/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data" };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";
        dependencies[] = { "Mission" };
        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### `MyFirstMod/Scripts/5_Mission/MyFirstMod/MissionHello.c`

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

---

## 下一步

1. **[第 8.2 章：创建自定义物品](02-custom-item.md)** -- 定义新的游戏内物品。
2. **添加脚本层** -- 创建 `3_Game` 和 `4_World` 文件夹。参见 [第 2.1 章](../02-mod-structure/01-five-layers.md)。
3. **添加按键绑定** -- 创建 `Inputs.xml` 文件。
4. **创建 UI** -- 参见 [第 3 章：GUI 系统](../03-gui-system/01-widget-types.md)。

---

## 最佳实践

- **在构建 PBO 之前始终使用 `-filePatching` 测试。**
- **从 `5_Mission` 层开始。**
- **在重写方法中始终先调用 `super`。**
- **在 Print 输出中使用唯一前缀**（如 `[MyFirstMod]`）。
- **保持 `config.cpp` 语法简单有效。**

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| `mod.cpp` 的 `version` | 用于依赖关系解析 | 引擎完全忽略版本字符串 |
| `requiredAddons` | 确保正确加载顺序 | 拼错名称会导致 PBO 被静默跳过 |
| File Patching | 即时看到更改 | `config.cpp` 和新文件不受覆盖 |
| 离线模式 | 快速验证方式 | 某些 API 返回 NULL |

---

**下一章：** [第 8.2 章：创建自定义物品](02-custom-item.md)
