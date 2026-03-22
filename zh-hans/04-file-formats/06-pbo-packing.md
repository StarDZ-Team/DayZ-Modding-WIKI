# 第4.6章：PBO 打包

[首页](../README.md) | [<< 上一章：DayZ Tools 工作流](05-dayz-tools.md) | **PBO 打包** | [下一章：Workbench 指南 >>](07-workbench-guide.md)

---

## 简介

**PBO**（Packed Bank of Objects）是 DayZ 的存档格式——相当于游戏内容的 `.zip` 文件。游戏加载的每个模组都以一个或多个 PBO 文件的形式提供。当玩家在 Steam Workshop 订阅模组时，他们下载的是 PBO。当服务器加载模组时，它读取的是 PBO。PBO 是整个模组开发流程的最终交付物。

了解如何正确创建 PBO——何时二进制化、如何设置前缀、如何组织输出以及如何自动化流程——是你的源文件与工作模组之间的最后一步。本章涵盖了从基本概念到高级自动化构建工作流的所有内容。

---

## 目录

- [什么是 PBO？](#what-is-a-pbo)
- [PBO 内部结构](#pbo-internal-structure)
- [AddonBuilder：打包工具](#addonbuilder-the-packing-tool)
- [-packonly 标志](#the--packonly-flag)
- [-prefix 标志](#the--prefix-flag)
- [二进制化：何时需要，何时不需要](#binarization-when-needed-vs-not)
- [密钥签名](#key-signing)
- [@mod 文件夹结构](#mod-folder-structure)
- [自动化构建脚本](#automated-build-scripts)
- [多 PBO 模组构建](#multi-pbo-mod-builds)
- [常见构建错误和解决方案](#common-build-errors-and-solutions)
- [测试：文件补丁 vs PBO 加载](#testing-file-patching-vs-pbo-loading)
- [最佳实践](#best-practices)

---

## 什么是 PBO？

PBO 是一个扁平的存档文件，包含游戏资源的目录树。它没有压缩（与 ZIP 不同）——内部文件以原始大小存储。"打包"纯粹是组织性的：将许多文件变成一个具有内部路径结构的文件。

### 主要特征

- **无压缩：** 文件按原样存储。PBO 的大小等于其内容总和加上一个小的头部。
- **扁平头部：** 一个包含路径、大小和偏移量的文件条目列表。
- **前缀元数据：** 每个 PBO 声明一个内部路径前缀，将其内容映射到引擎的虚拟文件系统中。
- **运行时只读：** 引擎从 PBO 读取但从不写入它们。
- **为多人游戏签名：** PBO 可以使用 Bohemia 风格的密钥对进行签名，用于服务器签名验证。

### 为什么使用 PBO 而非松散文件

- **分发：** 每个模组组件一个文件比数千个松散文件更简单。
- **完整性：** 密钥签名确保模组未被篡改。
- **性能：** 引擎的文件 I/O 针对从 PBO 读取进行了优化。
- **组织：** 前缀系统确保模组之间不会发生路径冲突。

---

## PBO 内部结构

当你打开一个 PBO（使用 PBO Manager 或 MikeroTools 等工具）时，你会看到一个目录树：

```
MyMod.pbo
  $PBOPREFIX$                    <-- 包含前缀路径的文本文件
  config.bin                      <-- 二进制化的 config.cpp（如果使用 -packonly 则为 config.cpp）
  Scripts/
    3_Game/
      MyConstants.c
    4_World/
      MyManager.c
    5_Mission/
      MyUI.c
  data/
    models/
      my_item.p3d                 <-- 二进制化的 ODOL（如果使用 -packonly 则为 MLOD）
    textures/
      my_item_co.paa
      my_item_nohq.paa
      my_item_smdi.paa
    materials/
      my_item.rvmat
  sound/
    gunshot_01.ogg
  GUI/
    layouts/
      my_panel.layout
```

### $PBOPREFIX$

`$PBOPREFIX$` 文件是 PBO 根目录下的一个小文本文件，声明模组的路径前缀。例如：

```
MyMod
```

这告诉引擎："当某些东西引用 `MyMod\data\textures\my_item_co.paa` 时，在这个 PBO 中查找 `data\textures\my_item_co.paa`。"

### config.bin vs. config.cpp

- **config.bin：** config.cpp 的二进制化（二进制）版本，由 Binarize 创建。加载时解析更快。
- **config.cpp：** 原始文本格式配置。在引擎中可用，但解析稍慢。

当你使用二进制化构建时，config.cpp 变成 config.bin。当你使用 `-packonly` 时，config.cpp 按原样包含。

---

## AddonBuilder：打包工具

**AddonBuilder** 是 Bohemia 的官方 PBO 打包工具，包含在 DayZ Tools 中。它可以在 GUI 模式或命令行模式下运行。

### GUI 模式

1. 从 DayZ Tools Launcher 启动 AddonBuilder。
2. **Source directory：** 浏览到 P: 上的模组文件夹（例如，`P:\MyMod`）。
3. **Output directory：** 浏览到输出文件夹（例如，`P:\output`）。
4. **Options：**
   - **Binarize：** 勾选以对内容运行 Binarize（转换 P3D、纹理、配置）。
   - **Sign：** 勾选并选择密钥来签名 PBO。
   - **Prefix：** 输入模组前缀（例如，`MyMod`）。
5. 点击 **Pack**。

### 命令行模式

命令行模式是自动化构建的首选：

```bash
AddonBuilder.exe [source_path] [output_path] [options]
```

**完整示例：**
```bash
"P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe" ^
    "P:\MyMod" ^
    "P:\output" ^
    -prefix="MyMod" ^
    -sign="P:\keys\MyKey"
```

### 命令行选项

| 标志 | 说明 |
|------|-------------|
| `-prefix=<path>` | 设置 PBO 内部前缀（对路径解析至关重要） |
| `-packonly` | 跳过二进制化，按原样打包文件 |
| `-sign=<key_path>` | 使用指定的 BI 密钥签名 PBO（私钥路径，无扩展名） |
| `-include=<path>` | 包含文件列表——仅打包匹配此过滤器的文件 |
| `-exclude=<path>` | 排除文件列表——跳过匹配此过滤器的文件 |
| `-binarize=<path>` | Binarize.exe 的路径（如果不在默认位置） |
| `-temp=<path>` | Binarize 输出的临时目录 |
| `-clear` | 打包前清除输出目录 |
| `-project=<path>` | 项目盘路径（通常为 `P:\`） |

---

## -packonly 标志

`-packonly` 标志是 AddonBuilder 中最重要的选项之一。它告诉工具跳过所有二进制化，按原样打包源文件。

### 何时使用 -packonly

| 模组内容 | 使用 -packonly？ | 原因 |
|-------------|---------------|--------|
| 仅脚本（.c 文件） | **是** | 脚本从不二进制化 |
| UI 布局（.layout） | **是** | 布局从不二进制化 |
| 仅音频（.ogg） | **是** | OGG 已是游戏就绪格式 |
| 预转换纹理（.paa） | **是** | 已是最终格式 |
| Config.cpp（无 CfgVehicles） | **是** | 简单配置可以不二进制化使用 |
| Config.cpp（含 CfgVehicles） | **否** | 物品定义需要二进制化配置 |
| P3D 模型（MLOD） | **否** | 应二进制化为 ODOL 以提升性能 |
| TGA/PNG 纹理（需要转换） | **否** | 必须转换为 PAA |

### 实用指南

对于**仅脚本的模组**（如没有自定义物品的框架或工具模组）：
```bash
AddonBuilder.exe "P:\MyScriptMod" "P:\output" -prefix="MyScriptMod" -packonly
```

对于**物品模组**（有模型和纹理的武器、服装、载具）：
```bash
AddonBuilder.exe "P:\MyItemMod" "P:\output" -prefix="MyItemMod" -sign="P:\keys\MyKey"
```

> **提示：** 许多模组正是为了优化构建过程而分成多个 PBO。脚本 PBO 使用 `-packonly`（快速），而包含模型和纹理的数据 PBO 进行完整二进制化（较慢但必要）。

---

## -prefix 标志

`-prefix` 标志设置 PBO 的内部路径前缀，该前缀被写入 PBO 内的 `$PBOPREFIX$` 文件。此前缀至关重要——它决定引擎如何解析 PBO 内容的路径。

### 前缀如何工作

```
源：P:\MyMod\data\textures\item_co.paa
前缀：MyMod
PBO 内部路径：data\textures\item_co.paa

引擎解析：MyMod\data\textures\item_co.paa
  --> 在 MyMod.pbo 中查找：data\textures\item_co.paa
  --> 找到了！
```

### 多级前缀

对于使用子文件夹结构的模组，前缀可以包含多个级别：

```bash
# P: 盘上的源
P:\MyMod\MyMod\Scripts\3_Game\MyClass.c

# 如果前缀是 "MyMod\MyMod\Scripts"
# PBO 内部：3_Game\MyClass.c
# 引擎路径：MyMod\MyMod\Scripts\3_Game\MyClass.c
```

### 前缀必须匹配引用

如果你的 config.cpp 引用了 `MyMod\data\texture_co.paa`，那么包含该纹理的 PBO 必须有前缀 `MyMod`，并且文件必须在 PBO 内的 `data\texture_co.paa`。不匹配会导致引擎找不到文件。

### 常见前缀模式

| 模组结构 | 源路径 | 前缀 | 配置引用 |
|---------------|-------------|--------|-----------------|
| 简单模组 | `P:\MyMod\` | `MyMod` | `MyMod\data\item.p3d` |
| 命名空间模组 | `P:\MyMod_Weapons\` | `MyMod_Weapons` | `MyMod_Weapons\data\rifle.p3d` |
| 脚本子包 | `P:\MyFramework\MyMod\Scripts\` | `MyFramework\MyMod\Scripts` | （通过 config.cpp `CfgMods` 引用） |

---

## 二进制化：何时需要，何时不需要

二进制化是将人类可读的源格式转换为引擎优化的二进制格式的过程。它是构建过程中最耗时的步骤，也是构建错误最常见的来源。

### 哪些会被二进制化

| 文件类型 | 二进制化为 | 是否必须？ |
|-----------|-------------|-----------|
| `config.cpp` | `config.bin` | 定义物品的模组必须（CfgVehicles, CfgWeapons） |
| `.p3d`（MLOD） | `.p3d`（ODOL） | 推荐——ODOL 加载更快且更小 |
| `.tga` / `.png` | `.paa` | 必须——引擎运行时需要 PAA |
| `.edds` | `.paa` | 必须——同上 |
| `.rvmat` | `.rvmat`（已处理） | 路径已解析，轻微优化 |
| `.wrp` | `.wrp`（已优化） | 地形/地图模组必须 |

### 哪些不会被二进制化

| 文件类型 | 原因 |
|-----------|--------|
| `.c` 脚本 | 脚本由引擎作为文本加载 |
| `.ogg` 音频 | 已是游戏就绪格式 |
| `.layout` 文件 | 已是游戏就绪格式 |
| `.paa` 纹理 | 已是最终格式（预转换） |
| `.json` 数据 | 由脚本代码作为文本读取 |

### Config.cpp 二进制化详情

Config.cpp 二进制化是大多数模组开发者遇到问题的步骤。二进制化器解析 config.cpp 文本，验证其结构，解析继承链，并输出二进制 config.bin。

**何时 config.cpp 需要二进制化：**
- 配置定义了 `CfgVehicles` 条目（物品、武器、载具、建筑）。
- 配置定义了 `CfgWeapons` 条目。
- 配置定义了引用模型或纹理的条目。

**何时 config.cpp 不需要二进制化：**
- 配置仅定义 `CfgPatches` 和 `CfgMods`（模组注册）。
- 配置仅定义声音配置。
- 仅脚本的模组，配置最小。

> **经验法则：** 如果你的 config.cpp 向游戏世界添加了物理物品，你需要二进制化。如果它只注册脚本和定义非物品数据，`-packonly` 就可以了。

---

## 密钥签名

PBO 可以使用加密密钥对进行签名。服务器使用签名验证来确保所有连接的客户端拥有相同的（未修改的）模组文件。

### 密钥对组件

| 文件 | 扩展名 | 用途 | 谁拥有它 |
|------|-----------|---------|------------|
| 私钥 | `.biprivatekey` | 构建时签名 PBO | 仅模组作者（保密） |
| 公钥 | `.bikey` | 验证签名 | 服务器管理员，随模组分发 |

### 生成密钥

使用 DayZ Tools 的 **DSSignFile** 或 **DSCreateKey** 工具：

```bash
# 生成密钥对
DSCreateKey.exe MyModKey

# 这会创建：
#   MyModKey.biprivatekey   （保密，不要分发）
#   MyModKey.bikey          （分发给服务器管理员）
```

### 构建时签名

```bash
AddonBuilder.exe "P:\MyMod" "P:\output" ^
    -prefix="MyMod" ^
    -sign="P:\keys\MyModKey"
```

这会生成：
```
P:\output\
  MyMod.pbo
  MyMod.pbo.MyModKey.bisign    <-- 签名文件
```

### 服务器端密钥安装

服务器管理员将公钥（`.bikey`）放在服务器的 `keys/` 目录中：

```
DayZServer/
  keys/
    MyModKey.bikey             <-- 允许拥有此模组的客户端连接
```

---

## @mod 文件夹结构

DayZ 期望模组按照使用 `@` 前缀约定的特定目录结构组织：

```
@MyMod/
  addons/
    MyMod.pbo                  <-- 打包的模组内容
    MyMod.pbo.MyKey.bisign     <-- PBO 签名（可选）
  keys/
    MyKey.bikey                <-- 服务器公钥（可选）
  mod.cpp                      <-- 模组元数据
```

### mod.cpp

`mod.cpp` 文件提供在 DayZ 启动器中显示的元数据：

```cpp
name = "My Awesome Mod";
author = "ModAuthor";
version = "1.0.0";
url = "https://steamcommunity.com/sharedfiles/filedetails/?id=XXXXXXXXX";
```

### 多 PBO 模组

大型模组通常在单个 `@mod` 文件夹内分成多个 PBO：

```
@MyFramework/
  addons/
    MyMod_Core_Scripts.pbo        <-- 脚本层
    MyMod_Core_Data.pbo           <-- 纹理、模型、材质
    MyMod_Core_GUI.pbo            <-- 布局文件、图像集
  keys/
    MyMod.bikey
  mod.cpp
```

### 加载模组

模组通过 `-mod` 参数加载：

```bash
# 单个模组
DayZDiag_x64.exe -mod="@MyMod"

# 多个模组（分号分隔）
DayZDiag_x64.exe -mod="@MyFramework;@MyMod_Weapons;@MyMod_Missions"
```

`@` 文件夹必须在游戏的根目录中，或者必须提供绝对路径。

---

## 自动化构建脚本

通过 AddonBuilder 的 GUI 手动打包 PBO 对于小型、简单的模组是可以接受的。对于具有多个 PBO 的大型项目，自动化构建脚本是必不可少的。

### 批处理脚本模式

一个典型的 `build_pbos.bat`：

```batch
@echo off
setlocal

set TOOLS="P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe"
set OUTPUT="P:\@MyMod\addons"
set KEY="P:\keys\MyKey"

echo === Building Scripts PBO ===
%TOOLS% "P:\MyMod\Scripts" %OUTPUT% -prefix="MyMod\Scripts" -packonly -clear

echo === Building Data PBO ===
%TOOLS% "P:\MyMod\Data" %OUTPUT% -prefix="MyMod\Data" -sign=%KEY% -clear

echo === Build Complete ===
pause
```

### Python 构建脚本模式（dev.py）

对于更复杂的构建，Python 脚本提供更好的错误处理、日志记录和条件逻辑：

```python
import subprocess
import os
import sys

ADDON_BUILDER = r"P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe"
OUTPUT_DIR = r"P:\@MyMod\addons"
KEY_PATH = r"P:\keys\MyKey"

PBOS = [
    {
        "name": "Scripts",
        "source": r"P:\MyMod\Scripts",
        "prefix": r"MyMod\Scripts",
        "packonly": True,
    },
    {
        "name": "Data",
        "source": r"P:\MyMod\Data",
        "prefix": r"MyMod\Data",
        "packonly": False,
    },
]

def build_pbo(pbo_config):
    """Build a single PBO."""
    cmd = [
        ADDON_BUILDER,
        pbo_config["source"],
        OUTPUT_DIR,
        f"-prefix={pbo_config['prefix']}",
    ]

    if pbo_config.get("packonly"):
        cmd.append("-packonly")
    else:
        cmd.append(f"-sign={KEY_PATH}")

    print(f"Building {pbo_config['name']}...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"ERROR building {pbo_config['name']}:")
        print(result.stderr)
        return False

    print(f"  {pbo_config['name']} built successfully.")
    return True

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    success = True
    for pbo in PBOS:
        if not build_pbo(pbo):
            success = False

    if success:
        print("\nAll PBOs built successfully.")
    else:
        print("\nBuild completed with errors.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### 与 dev.py 的集成

MyMod 项目使用 `dev.py` 作为中央构建编排器：

```bash
python dev.py build          # 构建所有 PBO
python dev.py server         # 构建 + 启动服务器 + 监控日志
python dev.py full           # 构建 + 服务器 + 客户端
```

此模式推荐用于任何多模组工作区。一条命令构建所有内容、启动服务器并开始监控——消除手动步骤并减少人为错误。

---

## 多 PBO 模组构建

大型模组受益于分成多个 PBO。这有几个优势：

### 为什么分成多个 PBO

1. **更快的重建。** 如果你只更改了脚本，只重建脚本 PBO（使用 `-packonly`，只需几秒钟）。数据 PBO（需要二进制化）需要几分钟且不需要重建。
2. **模块化加载。** 仅服务器的 PBO 可以从客户端下载中排除。
3. **更清晰的组织。** 脚本、数据和 GUI 被清晰分离。
4. **并行构建。** 独立的 PBO 可以同时构建。

### 典型分割模式

```
@MyMod/
  addons/
    MyMod_Core.pbo           <-- config.cpp, CfgPatches（二进制化）
    MyMod_Scripts.pbo         <-- 所有 .c 脚本文件（-packonly）
    MyMod_Data.pbo            <-- 模型、纹理、材质（二进制化）
    MyMod_GUI.pbo             <-- 布局、图像集（-packonly）
    MyMod_Sounds.pbo          <-- OGG 音频文件（-packonly）
```

### PBO 之间的依赖

当一个 PBO 依赖另一个时（例如，脚本引用了配置 PBO 中定义的物品），`CfgPatches` 中的 `requiredAddons[]` 确保正确的加载顺序：

```cpp
// 在 MyMod_Scripts 的 config.cpp 中
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = {"MyMod_Core"};   // 在核心 PBO 之后加载
    };
};
```

---

## 常见构建错误和解决方案

### 错误："Include file not found"

**原因：** Config.cpp 引用了不存在于预期路径的文件（模型、纹理）。
**解决方案：** 验证文件是否存在于 P: 上引用的确切路径。检查拼写和大小写。

### 错误："Binarize failed" 且无详细信息

**原因：** Binarize 在损坏或无效的源文件上崩溃。
**解决方案：**
1. 检查 Binarize 正在处理哪个文件（查看其日志输出）。
2. 在相应工具中打开有问题的文件（Object Builder 用于 P3D，TexView2 用于纹理）。
3. 验证文件。
4. 常见原因：非 2 的幂次纹理、损坏的 P3D 文件、无效的 config.cpp 语法。

### 错误："Addon requires addon X"

**原因：** CfgPatches `requiredAddons[]` 列出了不存在的附加组件。
**解决方案：** 安装所需的附加组件、将其添加到构建中，或者如果实际上不需要则删除该要求。

### 错误：Config.cpp 解析错误（行 X）

**原因：** config.cpp 中的语法错误。
**解决方案：** 在文本编辑器中打开 config.cpp 并检查第 X 行。常见问题：
- 类定义后缺少分号。
- 未关闭的花括号 `{}`。
- 字符串值缺少引号。
- 行末的反斜杠（不支持行续接）。

### 错误：PBO 前缀不匹配

**原因：** PBO 中的前缀与 config.cpp 或材质中使用的路径不匹配。
**解决方案：** 确保 `-prefix` 与所有引用期望的路径结构匹配。如果 config.cpp 引用了 `MyMod\data\item.p3d`，PBO 前缀必须是 `MyMod`，文件必须在 PBO 内的 `data\item.p3d`。

### 错误：服务器上"Signature check failed"

**原因：** 客户端的 PBO 与服务器期望的签名不匹配。
**解决方案：**
1. 确保服务器和客户端拥有相同的 PBO 版本。
2. 如需要，使用新密钥重新签名 PBO。
3. 更新服务器上的 `.bikey`。

### 错误：Binarize 期间"Cannot open file"

**原因：** P: 盘未挂载或文件路径不正确。
**解决方案：** 挂载 P: 盘并验证源路径是否存在。

---

## 测试：文件补丁 vs PBO 加载

开发涉及两种测试模式。为每种情况选择正确的模式可以节省大量时间。

### 文件补丁（开发阶段）

| 方面 | 详情 |
|--------|--------|
| **速度** | 即时——编辑文件，重启游戏 |
| **设置** | 挂载 P: 盘，使用 `-filePatching` 标志启动 |
| **可执行文件** | `DayZDiag_x64.exe`（需要 Diag 版本） |
| **签名** | 不适用（没有 PBO 需要签名） |
| **限制** | 无二进制化配置，仅 Diag 版本 |
| **最适合** | 脚本开发、UI 迭代、快速原型制作 |

### PBO 加载（发布测试）

| 方面 | 详情 |
|--------|--------|
| **速度** | 较慢——每次更改必须重建 PBO |
| **设置** | 构建 PBO，放在 `@mod/addons/` 中 |
| **可执行文件** | `DayZDiag_x64.exe` 或零售版 `DayZ_x64.exe` |
| **签名** | 支持（多人游戏必须） |
| **限制** | 每次更改都需要重建 |
| **最适合** | 最终测试、多人游戏测试、发布验证 |

### 推荐工作流

1. **使用文件补丁开发：** 编写脚本、调整布局、迭代纹理。重启游戏测试。无构建步骤。
2. **定期构建 PBO：** 测试二进制化构建以捕捉二进制化特定的问题（配置解析错误、纹理转换问题）。
3. **最终仅用 PBO 测试：** 发布前，专门从 PBO 测试以确保打包的模组与文件补丁版本工作相同。
4. **签名并分发 PBO：** 生成签名以实现多人游戏兼容性。

---

## 最佳实践

1. **对脚本 PBO 使用 `-packonly`。** 脚本从不二进制化，所以 `-packonly` 始终正确且快得多。

2. **始终设置前缀。** 没有前缀，引擎无法解析你模组内容的路径。每个 PBO 都必须有正确的 `-prefix`。

3. **自动化你的构建。** 从第一天起创建构建脚本（批处理或 Python）。手动打包无法扩展且容易出错。

4. **保持源和输出分离。** 源在 P: 上，构建的 PBO 在单独的输出目录或 `@mod/addons/` 中。永远不要从输出目录打包。

5. **为任何多人游戏测试签名你的 PBO。** 未签名的 PBO 会被启用签名验证的服务器拒绝。即使看起来不必要，也在开发期间签名——这可以防止别人测试时出现"在我这里可以"的问题。

6. **对你的密钥进行版本控制。** 当你做出破坏性更改时，生成新的密钥对。这迫使所有客户端和服务器一起更新。

7. **测试文件补丁和 PBO 两种模式。** 某些 bug 只在一种模式下出现。二进制化配置在边缘情况下与文本配置表现不同。

8. **定期清理你的输出目录。** 来自先前构建的陈旧 PBO 可能导致令人困惑的行为。使用 `-clear` 标志或在构建前手动清理。

9. **将大型模组分成多个 PBO。** 增量重建节省的时间在第一天的开发中就能收回成本。

10. **阅读构建日志。** Binarize 和 AddonBuilder 生成日志文件。当出问题时，答案几乎总是在日志中。检查 `%TEMP%\AddonBuilder\` 和 `%TEMP%\Binarize\` 获取详细输出。

---

## 在实际模组中观察到的

| 模式 | 模组 | 详情 |
|---------|-----|--------|
| 每个模组 20+ 个 PBO，细粒度分割 | Expansion（所有模块） | 分为 Scripts、Data、GUI、Vehicles、Book、Market 等独立 PBO，实现独立重建和可选的客户端/服务器分离 |
| Scripts/Data/GUI 三重分割 | StarDZ（Core、Missions、AI） | 每个模组产生 2-3 个 PBO：`_Scripts.pbo`（packonly）、`_Data.pbo`（二进制化模型/纹理）、`_GUI.pbo`（packonly 布局） |
| 单个整体 PBO | 简单重新贴图模组 | 仅有 config.cpp 和几个 PAA 纹理的小型模组将所有内容打包到一个带二进制化的 PBO 中 |
| 每个主要版本的密钥版本控制 | Expansion | 为破坏性更新生成新的密钥对，迫使所有客户端和服务器同步更新 |

---

## 兼容性与影响

- **多模组：** PBO 前缀冲突会导致引擎加载一个模组的文件而不是另一个的。每个模组必须使用唯一的前缀。在多模组环境中调试"文件未找到"错误时，仔细检查 `$PBOPREFIX$`。
- **性能：** PBO 加载速度快（顺序文件读取），但拥有许多大型 PBO 的模组会增加服务器启动时间。二进制化内容比未二进制化的加载更快。发布版本使用 ODOL 模型和 PAA 纹理。
- **版本：** PBO 格式本身没有改变。AddonBuilder 通过 DayZ Tools 更新接收定期修复，但命令行标志和打包行为自 DayZ 1.0 以来一直稳定。

---

## 导航

| 上一章 | 上级 | 下一章 |
|----------|----|------|
| [4.5 DayZ Tools 工作流](05-dayz-tools.md) | [第4部分：文件格式与 DayZ Tools](01-textures.md) | [下一章：Workbench 指南](07-workbench-guide.md) |
