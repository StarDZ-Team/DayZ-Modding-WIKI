# 第 4.5 章：DayZ Tools 工作流程

[首页](../../README.md) | [<< 上一章：音频](04-audio.md) | **DayZ Tools** | [下一章：PBO 打包 >>](06-pbo-packing.md)

---

## 简介

DayZ Tools 是一套通过 Steam 分发的免费开发应用程序套件，由 Bohemia Interactive 为模组制作者提供。它包含创建、转换和打包游戏资产所需的一切：3D 模型编辑器、纹理查看器、地形编辑器、脚本调试器，以及将人类可读的源文件转换为优化的游戏就绪格式的二进制化管线。没有 DayZ 模组可以在不与这些工具进行至少一些交互的情况下构建。

本章提供套件中每个工具的概述，解释支撑整个工作流程的 P: 驱动器（workdrive）系统，涵盖用于快速开发迭代的文件补丁，并详细介绍从源文件到可玩模组的完整资产管线。

---

## 目录

- [DayZ Tools 套件概述](#dayz-tools-suite-overview)
- [安装和设置](#installation-and-setup)
- [P: 驱动器 (Workdrive)](#p-drive-workdrive)
- [Object Builder](#object-builder)
- [TexView2](#texview2)
- [Terrain Builder](#terrain-builder)
- [Binarize](#binarize)
- [AddonBuilder](#addonbuilder)
- [Workbench](#workbench)
- [文件补丁模式](#file-patching-mode)
- [完整工作流程：从源文件到游戏](#complete-workflow-source-to-game)
- [常见错误](#common-mistakes)
- [最佳实践](#best-practices)

---

## DayZ Tools 套件概述

DayZ Tools 可在 Steam 的 **Tools** 分类下免费下载。它安装了一系列应用程序，每个程序在模组管线中扮演特定角色。

| 工具 | 用途 | 主要用户 |
|------|---------|---------------|
| **Object Builder** | 3D 模型创建和编辑 (.p3d) | 3D 美术师，建模师 |
| **TexView2** | 纹理查看和转换 (.paa, .tga, .png) | 纹理美术师，所有模组制作者 |
| **Terrain Builder** | 地形/地图创建和编辑 | 地图制作者 |
| **Binarize** | 源文件到游戏格式的转换 | 构建管线（通常自动化） |
| **AddonBuilder** | PBO 打包，可选二进制化 | 所有模组制作者 |
| **Workbench** | 脚本调试、测试、性能分析 | 脚本编写者 |
| **DayZ Tools Launcher** | 启动工具和配置 P: 驱动器的中央枢纽 | 所有模组制作者 |

### 它们在磁盘上的位置

Steam 安装后，工具通常位于：

```
C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\
  Bin\
    AddonBuilder\
      AddonBuilder.exe          <-- PBO 打包器
    Binarize\
      Binarize.exe              <-- 资产转换器
    TexView2\
      TexView2.exe              <-- 纹理工具
    ObjectBuilder\
      ObjectBuilder.exe         <-- 3D 模型编辑器
    Workbench\
      workbenchApp.exe          <-- 脚本调试器
  TerrainBuilder\
    TerrainBuilder.exe          <-- 地形编辑器
```

---

## 安装和设置

### 第 1 步：从 Steam 安装 DayZ Tools

1. 打开 Steam 库。
2. 在下拉菜单中启用 **Tools** 过滤器。
3. 搜索 "DayZ Tools"。
4. 安装（免费，大约 2 GB）。

### 第 2 步：启动 DayZ Tools

1. 从 Steam 启动 "DayZ Tools"。
2. DayZ Tools Launcher 打开——一个中央枢纽应用程序。
3. 从这里你可以启动任何单独的工具并配置设置。

### 第 3 步：配置 P: 驱动器

启动器提供一个按钮来创建和挂载 P: 驱动器（workdrive）。这是所有 DayZ 工具用作根路径的虚拟驱动器。

1. 点击 **Setup Workdrive**（或 P: 驱动器配置按钮）。
2. 工具创建一个 subst 映射的 P: 驱动器，指向你真实磁盘上的目录。
3. 将原版 DayZ 数据提取或符号链接到 P:，以便工具可以引用游戏资产。

---

## P: 驱动器 (Workdrive)

**P: 驱动器** 是一个 Windows 虚拟驱动器（通过 `subst` 或 junction 创建），作为所有 DayZ 模组制作的统一根路径。P3D 模型、RVMAT 材质、config.cpp 引用和构建脚本中的每个路径都相对于 P:。

### 为什么存在 P: 驱动器

DayZ 的资产管线围绕固定根路径设计。当材质引用 `MyMod\data\texture_co.paa` 时，引擎查找 `P:\MyMod\data\texture_co.paa`。此约定确保：

- 所有工具对文件位置达成一致。
- 打包 PBO 中的路径与开发期间的路径匹配。
- 多个模组可以在一个根目录下共存。

### 结构

```
P:\
  DZ\                          <-- 原版 DayZ 提取的数据
    characters\
    weapons\
    data\
    ...
  DayZ Tools\                  <-- 工具安装（或符号链接）
  MyMod\                       <-- 你的模组源文件
    config.cpp
    Scripts\
    data\
  AnotherMod\                  <-- 另一个模组的源文件
    ...
```

### SetupWorkdrive.bat

许多模组项目包含一个 `SetupWorkdrive.bat` 脚本来自动化 P: 驱动器创建和 junction 设置。一个典型的脚本：

```batch
@echo off
REM 创建指向工作空间的 P: 驱动器
subst P: "D:\DayZModding"

REM 为原版游戏数据创建 junction
mklink /J "P:\DZ" "C:\Program Files (x86)\Steam\steamapps\common\DayZ\dta"

REM 为工具创建 junction
mklink /J "P:\DayZ Tools" "C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"

echo Workdrive P: 已配置。
pause
```

> **提示：** 在启动任何 DayZ 工具之前必须挂载 workdrive。如果 Object Builder 或 Binarize 找不到文件，首先检查 P: 是否已挂载。

---

## Object Builder

Object Builder 是用于 P3D 文件的 3D 模型编辑器。在[第 4.2 章：3D 模型](02-models.md)中有详细介绍。以下是其在工具链中角色的总结。

### 主要功能

- 创建和编辑 P3D 模型文件。
- 定义 LOD（细节级别）用于视觉、碰撞和阴影网格。
- 将材质（RVMAT）和纹理（PAA）分配给模型面。
- 创建用于动画和纹理交换的命名选择。
- 放置记忆点和代理对象。
- 从 FBX、OBJ 和 3DS 格式导入几何体。
- 验证模型的引擎兼容性。

### 启动

```
DayZ Tools Launcher --> Object Builder
```

或直接：`P:\DayZ Tools\Bin\ObjectBuilder\ObjectBuilder.exe`

### 与其他工具的集成

- **引用 TexView2** 进行纹理预览（在面属性中双击纹理）。
- **输出 P3D 文件** 供 Binarize 和 AddonBuilder 使用。
- **读取 P3D 文件** 从 P: 驱动器上的原版数据作为参考。

---

## TexView2

TexView2 是纹理查看和转换工具。它处理 DayZ 模组制作所需的所有纹理格式转换。

### 主要功能

- 打开和预览 PAA、TGA、PNG、EDDS 和 DDS 文件。
- 在格式之间转换（TGA/PNG 到 PAA，PAA 到 TGA 等）。
- 单独查看各个通道（R、G、B、A）。
- 显示 Mipmap 级别。
- 显示纹理尺寸和压缩类型。
- 通过命令行批量转换。

### 启动

```
DayZ Tools Launcher --> TexView2
```

或直接：`P:\DayZ Tools\Bin\TexView2\TexView2.exe`

### 常用操作

**将 TGA 转换为 PAA：**
1. File --> Open --> 选择你的 TGA 文件。
2. 验证图像是否正确。
3. File --> Save As --> 选择 PAA 格式。
4. 选择压缩（不透明用 DXT1，Alpha 用 DXT5）。
5. 保存。

**检查原版 PAA 纹理：**
1. File --> Open --> 浏览到 `P:\DZ\...` 并选择一个 PAA 文件。
2. 查看图像。点击通道按钮（R、G、B、A）检查各个通道。
3. 注意状态栏中显示的尺寸和压缩类型。

**命令行转换：**
```bash
TexView2.exe -i "P:\MyMod\data\texture_co.tga" -o "P:\MyMod\data\texture_co.paa"
```

---

## Terrain Builder

Terrain Builder 是一个用于创建自定义地图（地形）的专用工具。地图制作是 DayZ 中最复杂的模组制作任务之一，涉及卫星图像、高度图、表面遮罩和物体放置。

### 主要功能

- 导入卫星图像和高度图。
- 定义地形层（草地、泥土、岩石、沙子等）。
- 在地图上放置物体（建筑、树木、岩石）。
- 配置表面纹理和材质。
- 导出地形数据供 Binarize 使用。

### 何时需要 Terrain Builder

- 从头创建新地图。
- 修改现有地形（添加/移除物体，改变地形形状）。
- Terrain Builder 对于物品模组、武器模组、UI 模组或纯脚本模组 **不** 需要。

### 启动

```
DayZ Tools Launcher --> Terrain Builder
```

> **注意：** 地形创建是一个高级话题，值得单独的专用指南。本章仅在工具概述中介绍 Terrain Builder。

---

## Binarize

Binarize 是核心转换引擎，将人类可读的源文件转换为优化的、游戏就绪的二进制格式。它在 PBO 打包期间（通过 AddonBuilder）在后台运行，但也可以直接调用。

### Binarize 转换什么

| 源格式 | 输出格式 | 说明 |
|---------------|---------------|-------------|
| MLOD `.p3d` | ODOL `.p3d` | 优化的 3D 模型 |
| `.tga` / `.png` / `.edds` | `.paa` | 压缩纹理 |
| `.cpp`（配置） | `.bin` | 二进制化配置（更快的解析） |
| `.rvmat` | `.rvmat`（已处理） | 路径已解析的材质 |
| `.wrp` | `.wrp`（已优化） | 地形世界 |

### 何时需要二进制化

| 内容类型 | 二进制化？ | 原因 |
|-------------|-----------|--------|
| 包含 CfgVehicles 的 Config.cpp | **是** | 引擎要求物品定义使用二进制化配置 |
| 纯脚本的 Config.cpp | 可选 | 纯脚本配置可以不二进制化工作 |
| P3D 模型 | **是** | ODOL 加载更快、更小、引擎优化 |
| 纹理 (TGA/PNG) | **是** | 运行时需要 PAA |
| 脚本 (.c 文件) | **否** | 脚本以文本形式加载 |
| 音频 (.ogg) | **否** | OGG 已经是游戏就绪格式 |
| 布局 (.layout) | **否** | 按原样加载 |

### 直接调用

```bash
Binarize.exe -targetPath="P:\build\MyMod" -sourcePath="P:\MyMod" -noLogs
```

在实践中，你很少直接调用 Binarize——AddonBuilder 将其作为 PBO 打包过程的一部分进行封装。

---

## AddonBuilder

AddonBuilder 是 PBO 打包工具。它接收源目录并创建 `.pbo` 存档，可选地先对内容运行 Binarize。在[第 4.6 章：PBO 打包](06-pbo-packing.md)中有详细介绍。

### 快速参考

```bash
# 带二进制化打包（用于包含配置、模型、纹理的物品/武器模组）
AddonBuilder.exe "P:\MyMod" "P:\output" -prefix="MyMod" -sign="MyKey"

# 不带二进制化打包（用于纯脚本模组）
AddonBuilder.exe "P:\MyMod" "P:\output" -prefix="MyMod" -packonly
```

### 启动

从 DayZ Tools Launcher，或直接：
```
P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe
```

AddonBuilder 有 GUI 模式和命令行模式。GUI 提供可视化文件浏览器和选项复选框。命令行模式由自动化构建脚本使用。

---

## Workbench

Workbench 是 DayZ Tools 中包含的脚本开发环境。它提供脚本编辑、调试和性能分析功能。

### 主要功能

- **脚本编辑**，为 Enforce Script 提供语法高亮。
- **调试**，具有断点、逐步执行和变量检查功能。
- **性能分析**，用于识别脚本中的性能瓶颈。
- **控制台**，用于评估表达式和测试代码片段。
- **资源浏览器**，用于检查游戏数据。

### 启动

```
DayZ Tools Launcher --> Workbench
```

或直接：`P:\DayZ Tools\Bin\Workbench\workbenchApp.exe`

### 调试工作流程

1. 打开 Workbench。
2. 将项目配置为指向你的模组脚本。
3. 在 `.c` 文件中设置断点。
4. 通过 Workbench 启动游戏（它以调试模式启动 DayZ）。
5. 当执行到达断点时，Workbench 暂停游戏并显示调用堆栈、局部变量，并允许逐步执行。

### 限制

- Workbench 的 Enforce Script 支持有一些缺陷——不是所有引擎 API 都在其自动完成中有完整文档。
- 一些模组制作者偏好使用外部编辑器（带有社区 Enforce Script 扩展的 VS Code）编写代码，仅在调试时使用 Workbench。
- 对于大型模组或复杂的断点配置，Workbench 可能不稳定。

---

## 文件补丁模式

**文件补丁** 是一种开发快捷方式，允许游戏从磁盘加载松散文件，而不需要将它们打包到 PBO 中。这在开发过程中大大加速了迭代。

### 文件补丁的工作原理

当 DayZ 使用 `-filePatching` 参数启动时，引擎在查看 PBO 之前先检查 P: 驱动器上的文件。如果文件存在于 P: 上，则加载松散版本而不是 PBO 版本。

```
正常模式：   游戏加载 --> PBO --> 文件
文件补丁：   游戏加载 --> P: 驱动器（如果文件存在） --> PBO（回退）
```

### 启用文件补丁

将 `-filePatching` 启动参数添加到 DayZ：

```bash
# 客户端
DayZDiag_x64.exe -filePatching -mod="MyMod" -connect=127.0.0.1

# 服务器
DayZDiag_x64.exe -filePatching -server -mod="MyMod" -config=serverDZ.cfg
```

> **重要：** 文件补丁需要 **Diag**（诊断）可执行文件（`DayZDiag_x64.exe`），而不是零售版可执行文件。零售版出于安全原因忽略 `-filePatching`。

### 文件补丁能做什么

| 资产类型 | 文件补丁可用？ | 备注 |
|------------|---------------------|-------|
| 脚本 (.c) | **是** | 最快的迭代——编辑、重启、测试 |
| 布局 (.layout) | **是** | 无需重建即可更改 UI |
| 纹理 (.paa) | **是** | 无需重建即可替换纹理 |
| Config.cpp | **部分** | 仅限未二进制化的配置 |
| 模型 (.p3d) | **是** | 仅限未二进制化的 MLOD P3D |
| 音频 (.ogg) | **是** | 无需重建即可替换声音 |

### 使用文件补丁的工作流程

1. 在 P: 驱动器上设置你的模组源文件。
2. 使用 `-filePatching` 启动服务器和客户端。
3. 在编辑器中编辑脚本文件。
4. 重启游戏（或重新连接）以获取更改。
5. 无需 PBO 重建。

> **提示：** 对于纯脚本更改，文件补丁完全消除了构建步骤。你编辑 `.c` 文件、重启并测试。这是可用的最快开发循环。

### 限制

- **无二进制化内容。** 包含 `CfgVehicles` 条目的 Config.cpp 可能在没有二进制化的情况下无法正常工作。纯脚本配置可以正常工作。
- **无密钥签名。** 文件补丁的内容未签名，因此只在开发中有效（不能用于公共服务器）。
- **仅限 Diag 版本。** 零售版可执行文件忽略文件补丁。
- **P: 驱动器必须挂载。** 如果 workdrive 未挂载，文件补丁没有可读取的内容。

---

## 完整工作流程：从源文件到游戏

以下是将源资产转变为可玩模组的端到端管线：

### 第 1 阶段：创建源资产

```
3D 软件 (Blender/3dsMax)    -->  FBX 导出
图像编辑器 (Photoshop/GIMP) -->  TGA/PNG 导出
音频编辑器 (Audacity)       -->  OGG 导出
文本编辑器 (VS Code)        -->  .c 脚本, config.cpp, .layout 文件
```

### 第 2 阶段：导入和转换

```
FBX  -->  Object Builder  -->  P3D（带 LOD、选择、材质）
TGA  -->  TexView2         -->  PAA（压缩纹理）
PNG  -->  TexView2         -->  PAA（压缩纹理）
OGG  -->  （无需转换，游戏就绪）
```

### 第 3 阶段：在 P: 驱动器上组织

```
P:\MyMod\
  config.cpp                    <-- 模组配置
  Scripts\
    3_Game\                     <-- 早期加载脚本
    4_World\                    <-- 实体/管理器脚本
    5_Mission\                  <-- UI/任务脚本
  data\
    models\
      my_item.p3d               <-- 3D 模型
    textures\
      my_item_co.paa            <-- 漫反射纹理
      my_item_nohq.paa          <-- 法线贴图
      my_item_smdi.paa          <-- 高光贴图
    materials\
      my_item.rvmat             <-- 材质定义
  sound\
    my_sound.ogg                <-- 音频文件
  GUI\
    layouts\
      my_panel.layout           <-- UI 布局
```

### 第 4 阶段：使用文件补丁测试（开发）

```
使用 -filePatching 启动 DayZDiag
  |
  |--> 引擎从 P:\MyMod\ 读取松散文件
  |--> 在游戏中测试
  |--> 直接在 P: 上编辑文件
  |--> 重启以获取更改
  |--> 快速迭代
```

### 第 5 阶段：打包 PBO（发布）

```
AddonBuilder / 构建脚本
  |
  |--> 从 P:\MyMod\ 读取源文件
  |--> Binarize 转换：P3D-->ODOL, TGA-->PAA, config.cpp-->.bin
  |--> 将所有内容打包到 MyMod.pbo
  |--> 使用密钥签名：MyMod.pbo.MyKey.bisign
  |--> 输出：@MyMod\addons\MyMod.pbo
```

### 第 6 阶段：分发

```
@MyMod\
  addons\
    MyMod.pbo                   <-- 打包的模组
    MyMod.pbo.MyKey.bisign      <-- 服务器验证的签名
  keys\
    MyKey.bikey                 <-- 供服务器管理员使用的公钥
  mod.cpp                       <-- 模组元数据（名称、作者等）
```

玩家在 Steam 创意工坊订阅模组，或服务器管理员手动安装。

---

## 常见错误

### 1. P: 驱动器未挂载

**症状：** 所有工具报告"文件未找到"错误。Object Builder 显示空白纹理。
**修复：** 在启动任何工具之前运行你的 `SetupWorkdrive.bat` 或通过 DayZ Tools Launcher 挂载 P:。

### 2. 使用了错误的工具

**症状：** 尝试在文本编辑器中编辑 PAA 文件，或在 Notepad 中打开 P3D。
**修复：** PAA 是二进制格式——使用 TexView2。P3D 是二进制格式——使用 Object Builder。Config.cpp 是文本——使用任何文本编辑器。

### 3. 忘记提取原版数据

**症状：** Object Builder 无法在引用的模型上显示原版纹理。材质显示粉色/品红色。
**修复：** 将原版 DayZ 数据提取到 `P:\DZ\`，以便工具可以解析对游戏内容的交叉引用。

### 4. 使用零售版可执行文件进行文件补丁

**症状：** 对 P: 驱动器上文件的更改未在游戏中反映。
**修复：** 使用 `DayZDiag_x64.exe`，而不是 `DayZ_x64.exe`。只有 Diag 版本支持 `-filePatching`。

### 5. 没有 P: 驱动器就构建

**症状：** AddonBuilder 或 Binarize 因路径解析错误而失败。
**修复：** 在运行任何构建工具之前挂载 P: 驱动器。模型和材质中的所有路径都是相对于 P: 的。

---

## 最佳实践

1. **始终使用 P: 驱动器。** 抵制使用绝对路径的诱惑。P: 是标准，所有工具都期望它。

2. **在开发期间使用文件补丁。** 它将迭代时间从几分钟（PBO 重建）缩短到几秒钟（游戏重启）。只在发布测试和分发时才构建 PBO。

3. **自动化你的构建管线。** 使用脚本（`build_pbos.bat`、`dev.py`）来自动化 AddonBuilder 调用。手动 GUI 打包对于多 PBO 模组容易出错且缓慢。

4. **保持源文件和输出分离。** 源文件在 P: 上。构建的 PBO 放在单独的输出目录。永远不要混合它们。

5. **学习键盘快捷键。** Object Builder 和 TexView2 有大量键盘快捷键，可以显著加速工作。投入时间学习它们。

6. **提取并研究原版数据。** 学习 DayZ 资产结构的最佳方式是检查现有的。提取原版 PBO 并在适当的工具中打开模型、材质和纹理。

7. **使用 Workbench 调试，使用外部编辑器编写。** 带有 Enforce Script 扩展的 VS Code 提供更好的编辑体验。Workbench 提供更好的调试体验。两者结合使用。

---

## 导航

| 上一章 | 上级 | 下一章 |
|----------|----|------|
| [4.4 音频](04-audio.md) | [第 4 部分：文件格式与 DayZ Tools](01-textures.md) | [4.6 PBO 打包](06-pbo-packing.md) |
