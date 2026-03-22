# 第 4.3 章：材质 (.rvmat)

[首页](../README.md) | [<< 上一章：3D 模型](02-models.md) | **材质** | [下一章：音频 >>](04-audio.md)

---

## 简介

DayZ 中的材质是 3D 模型和其视觉外观之间的桥梁。纹理提供原始图像数据，而 **RVMAT**（Real Virtuality Material）文件定义了这些纹理如何组合、哪个着色器解释它们，以及引擎应模拟什么表面属性——光泽度、透明度、自发光等。游戏中每个 P3D 模型的每个面都引用一个 RVMAT 文件，理解如何创建和配置它们对于任何视觉模组都是必不可少的。

本章涵盖 RVMAT 文件格式、着色器类型、纹理阶段配置、材质属性、伤害级别材质交换系统，以及来自 DayZ-Samples 的实际示例。

---

## 目录

- [RVMAT 格式概述](#rvmat-format-overview)
- [文件结构](#file-structure)
- [着色器类型](#shader-types)
- [纹理阶段](#texture-stages)
- [材质属性](#material-properties)
- [健康等级（伤害材质交换）](#health-levels-damage-material-swaps)
- [材质如何引用纹理](#how-materials-reference-textures)
- [从零创建 RVMAT](#creating-an-rvmat-from-scratch)
- [实际示例](#real-examples)
- [常见错误](#common-mistakes)
- [最佳实践](#best-practices)

---

## RVMAT 格式概述

**RVMAT** 文件是一个基于文本的配置文件（非二进制），用于定义材质。尽管有自定义扩展名，但其格式是纯文本，使用 Bohemia 的配置风格语法，包含类和键值对。

### 关键特征

- **文本格式：** 可在任何文本编辑器中编辑（Notepad++、VS Code）。
- **着色器绑定：** 每个 RVMAT 指定使用哪个渲染着色器。
- **纹理映射：** 定义哪些纹理文件分配给哪些着色器输入（漫反射、法线、高光等）。
- **表面属性：** 控制高光强度、自发光、透明度等。
- **由 P3D 模型引用：** Object Builder Resolution LOD 中的面被分配一个 RVMAT。引擎加载 RVMAT 及其引用的所有纹理。
- **由 config.cpp 引用：** `hiddenSelectionsMaterials[]` 可以在运行时覆盖材质。

### 路径约定

RVMAT 文件与其纹理一起存放，通常在 `data/` 目录中：

```
MyMod/
  data/
    my_item.rvmat              <-- 材质定义
    my_item_co.paa             <-- 漫反射纹理（由 RVMAT 引用）
    my_item_nohq.paa           <-- 法线贴图（由 RVMAT 引用）
    my_item_smdi.paa           <-- 高光贴图（由 RVMAT 引用）
```

---

## 文件结构

RVMAT 文件有一致的结构。以下是一个完整的、带注释的示例：

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};        // 环境光颜色乘数 (RGBA)
diffuse[] = {1.0, 1.0, 1.0, 1.0};        // 漫反射颜色乘数 (RGBA)
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};  // 附加漫反射覆盖
emmisive[] = {0.0, 0.0, 0.0, 0.0};       // 自发光（自照明）颜色
specular[] = {0.7, 0.7, 0.7, 1.0};       // 高光反射颜色
specularPower = 80;                        // 高光锐度（越高 = 越紧凑的高光）
PixelShaderID = "Super";                   // 使用的着色器程序
VertexShaderID = "Super";                  // 顶点着色器程序

class Stage1                               // 纹理阶段：法线贴图
{
    texture = "MyMod\data\my_item_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2                               // 纹理阶段：漫反射/颜色贴图
{
    texture = "MyMod\data\my_item_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3                               // 纹理阶段：高光/金属贴图
{
    texture = "MyMod\data\my_item_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

### 顶层属性

这些在 Stage 类之前声明，控制材质的整体行为：

| 属性 | 类型 | 说明 |
|----------|------|-------------|
| `ambient[]` | float[4] | 环境光颜色乘数。`{1,1,1,1}` = 全量，`{0,0,0,0}` = 无环境光。 |
| `diffuse[]` | float[4] | 漫反射光颜色乘数。通常 `{1,1,1,1}`。 |
| `forcedDiffuse[]` | float[4] | 漫反射的附加覆盖。通常 `{0,0,0,0}`。 |
| `emmisive[]` | float[4] | 自照明颜色。非零值使表面发光。注意：Bohemia 使用拼写错误 `emmisive`，而不是 `emissive`。 |
| `specular[]` | float[4] | 高光颜色和强度。 |
| `specularPower` | float | 高光锐度。范围 1-200。越高 = 越紧凑、越集中的反射。 |
| `PixelShaderID` | string | 像素着色器程序的名称。 |
| `VertexShaderID` | string | 顶点着色器程序的名称。 |

---

## 着色器类型

`PixelShaderID` 和 `VertexShaderID` 的值决定了哪个渲染管线处理该材质。两者通常应设置为相同的值。

### 可用着色器

| 着色器 | 使用场景 | 需要的纹理阶段 |
|--------|----------|------------------------|
| **Super** | 标准不透明表面（武器、服装、物品） | 法线、漫反射、高光/金属 |
| **Multi** | 多层地形和复杂表面 | 多个漫反射/法线对 |
| **Glass** | 透明和半透明表面 | 带 Alpha 的漫反射 |
| **Water** | 带反射和折射的水面 | 特殊水纹理 |
| **Terrain** | 地形地面表面 | 卫星、遮罩、材质层 |
| **NormalMap** | 简化的法线映射表面 | 法线、漫反射 |
| **NormalMapSpecular** | 带高光的法线映射 | 法线、漫反射、高光 |
| **Hair** | 角色头发渲染 | 带 Alpha 的漫反射，特殊半透明 |
| **Skin** | 带次表面散射的角色皮肤 | 漫反射、法线、高光 |
| **AlphaTest** | 硬边缘透明度（植被、栅栏） | 带 Alpha 的漫反射 |
| **AlphaBlend** | 平滑透明度（玻璃、烟雾） | 带 Alpha 的漫反射 |

### Super 着色器（最常用）

**Super** 着色器是 DayZ 中绝大多数物品使用的标准物理渲染着色器。它期望三个纹理阶段：

```
Stage1 = 法线贴图 (_nohq)
Stage2 = 漫反射/颜色贴图 (_co)
Stage3 = 高光/金属贴图 (_smdi)
```

如果你正在创建模组物品（武器、服装、工具、容器），你几乎总是会使用 Super 着色器。

### Glass 着色器

**Glass** 着色器处理透明表面。它从漫反射纹理读取 Alpha 以确定透明度：

```cpp
PixelShaderID = "Glass";
VertexShaderID = "Glass";

class Stage1
{
    texture = "MyMod\data\glass_nohq.paa";
    uvSource = "tex";
    class uvTransform { /* ... */ };
};

class Stage2
{
    texture = "MyMod\data\glass_ca.paa";    // 注意：_ca 后缀表示颜色+Alpha
    uvSource = "tex";
    class uvTransform { /* ... */ };
};
```

---

## 纹理阶段

RVMAT 中的每个 `Stage` 类将纹理分配给特定的着色器输入。阶段号决定纹理扮演的角色。

### Super 着色器的阶段分配

| 阶段 | 纹理角色 | 典型后缀 | 说明 |
|-------|-------------|----------------|-------------|
| **Stage1** | 法线贴图 | `_nohq` | 表面细节、凹凸、凹槽 |
| **Stage2** | 漫反射 / 颜色贴图 | `_co` 或 `_ca` | 表面的基础颜色 |
| **Stage3** | 高光 / 金属贴图 | `_smdi` | 光泽度、金属属性、细节 |
| **Stage4** | 环境阴影 | `_as` | 预烘焙环境光遮蔽（可选） |
| **Stage5** | 宏观贴图 | `_mc` | 大尺度颜色变化（可选） |
| **Stage6** | 细节贴图 | `_de` | 平铺微细节（可选） |
| **Stage7** | 自发光 / 光照贴图 | `_li` | 自照明（可选） |

### 阶段属性

每个阶段包含：

```cpp
class Stage1
{
    texture = "path\to\texture.paa";    // 相对于 P: 驱动器的路径
    uvSource = "tex";                    // UV 源："tex"（模型 UV）或 "tex1"（第 2 套 UV）
    class uvTransform                    // UV 变换矩阵
    {
        aside[] = {1.0, 0.0, 0.0};     // U 轴缩放和方向
        up[] = {0.0, 1.0, 0.0};        // V 轴缩放和方向
        dir[] = {0.0, 0.0, 0.0};       // 通常不使用
        pos[] = {0.0, 0.0, 0.0};       // UV 偏移（平移）
    };
};
```

### 用于平铺的 UV 变换

要平铺纹理（在表面上重复），修改 `aside` 和 `up` 值：

```cpp
class uvTransform
{
    aside[] = {4.0, 0.0, 0.0};     // 水平平铺 4 次
    up[] = {0.0, 4.0, 0.0};        // 垂直平铺 4 次
    dir[] = {0.0, 0.0, 0.0};
    pos[] = {0.0, 0.0, 0.0};
};
```

这常用于地形材质和建筑表面，其中相同的细节纹理会重复。

---

## 材质属性

### 高光控制

`specular[]` 和 `specularPower` 值共同定义表面的光泽外观：

| 材质类型 | specular[] | specularPower | 外观 |
|---------------|-----------|---------------|------------|
| **哑光塑料** | `{0.1, 0.1, 0.1, 1.0}` | 10 | 暗淡，宽高光 |
| **磨损金属** | `{0.3, 0.3, 0.3, 1.0}` | 40 | 中等光泽 |
| **抛光金属** | `{0.8, 0.8, 0.8, 1.0}` | 120 | 明亮，紧凑高光 |
| **铬** | `{1.0, 1.0, 1.0, 1.0}` | 200 | 镜面反射 |
| **橡胶** | `{0.02, 0.02, 0.02, 1.0}` | 5 | 几乎无高光 |
| **湿表面** | `{0.6, 0.6, 0.6, 1.0}` | 80 | 光滑，中等锐利高光 |

### 自发光（自照明）

要使表面发光（LED 灯、屏幕、发光元素）：

```cpp
emmisive[] = {0.2, 0.8, 0.2, 1.0};   // 绿色发光
```

自发光颜色会被添加到最终像素颜色中，无论光照如何。后续纹理阶段中的 `_li` 自发光贴图可以遮罩表面哪些部分发光。

### 双面渲染

对于应从两面可见的薄表面（旗帜、植被、布料）：

```cpp
renderFlags[] = {"noZWrite", "noAlpha", "twoSided"};
```

这不是顶层 RVMAT 属性，而是在 config.cpp 中或通过材质的着色器设置配置，取决于使用场景。

---

## 健康等级（伤害材质交换）

DayZ 物品随时间退化。引擎支持在不同伤害阈值自动交换材质，在 `config.cpp` 中使用 `healthLevels[]` 数组定义。这创建了从全新到损毁的视觉渐进。

### healthLevels[] 结构

```cpp
class MyItem: Inventory_Base
{
    // ... 其他配置 ...

    healthLevels[] =
    {
        // {健康阈值, {"材质集"}},

        {1.0, {"MyMod\data\my_item.rvmat"}},           // 全新（100% 健康）
        {0.7, {"MyMod\data\my_item_worn.rvmat"}},       // 磨损（70% 健康）
        {0.5, {"MyMod\data\my_item_damaged.rvmat"}},     // 受损（50% 健康）
        {0.3, {"MyMod\data\my_item_badly_damaged.rvmat"}},// 严重受损（30% 健康）
        {0.0, {"MyMod\data\my_item_ruined.rvmat"}}       // 损毁（0% 健康）
    };
};
```

### 工作原理

1. 引擎监视物品的健康值（0.0 到 1.0）。
2. 当健康值降至阈值以下时，引擎将材质交换为对应的 RVMAT。
3. 每个 RVMAT 可以引用不同的纹理——通常是逐渐更加损坏的变体。
4. 交换是自动的。不需要脚本代码。

### 伤害纹理渐进

典型的伤害渐进：

| 等级 | 健康值 | 视觉变化 |
|-------|--------|---------------|
| **全新** | 1.0 | 干净，出厂新品外观 |
| **磨损** | 0.7 | 轻微磨损，小划痕 |
| **受损** | 0.5 | 可见划痕，变色，灰尘 |
| **严重受损** | 0.3 | 严重磨损，锈蚀，裂缝，油漆剥落 |
| **损毁** | 0.0 | 严重退化，破碎外观 |

### 创建伤害材质

为每个伤害等级创建引用逐渐更加损坏纹理的单独 RVMAT：

```
data/
  my_item.rvmat                    --> my_item_co.paa（干净）
  my_item_worn.rvmat               --> my_item_worn_co.paa（轻微损伤）
  my_item_damaged.rvmat            --> my_item_damaged_co.paa（中度损伤）
  my_item_badly_damaged.rvmat      --> my_item_badly_damaged_co.paa（重度损伤）
  my_item_ruined.rvmat             --> my_item_ruined_co.paa（损毁）
```

> **提示：** 你不需要为每个伤害等级创建唯一纹理。一种常见的优化是在所有等级之间共享法线和高光贴图，只改变漫反射纹理：
>
> ```
> my_item.rvmat           --> my_item_co.paa
> my_item_worn.rvmat      --> my_item_co.paa（相同漫反射，较低高光）
> my_item_damaged.rvmat   --> my_item_damaged_co.paa
> my_item_ruined.rvmat    --> my_item_ruined_co.paa
> ```

### 使用原版伤害材质

DayZ 提供了一套通用伤害覆盖材质，如果你不想创建自定义伤害纹理可以使用：

```cpp
healthLevels[] =
{
    {1.0, {"MyMod\data\my_item.rvmat"}},
    {0.7, {"DZ\data\data\default_worn.rvmat"}},
    {0.5, {"DZ\data\data\default_damaged.rvmat"}},
    {0.3, {"DZ\data\data\default_badly_damaged.rvmat"}},
    {0.0, {"DZ\data\data\default_ruined.rvmat"}}
};
```

---

## 材质如何引用纹理

模型、材质和纹理之间的连接形成一条链：

```
P3D 模型 (Object Builder)
  |
  |--> 面分配给 RVMAT
         |
         |--> Stage1.texture = "path\to\normal_nohq.paa"
         |--> Stage2.texture = "path\to\color_co.paa"
         |--> Stage3.texture = "path\to\specular_smdi.paa"
```

### 路径解析

RVMAT 文件中的所有纹理路径都相对于 **P: 驱动器** 根目录：

```cpp
// 正确：相对于 P: 驱动器
texture = "MyMod\data\textures\my_item_co.paa";

// 这意味着：P:\MyMod\data\textures\my_item_co.paa
```

当打包到 PBO 中时，路径前缀必须与 PBO 的前缀匹配：

```
PBO 前缀：MyMod
内部路径：data\textures\my_item_co.paa
完整引用：MyMod\data\textures\my_item_co.paa
```

### hiddenSelectionsMaterials 覆盖

Config.cpp 可以在运行时覆盖应用于命名选择的材质：

```cpp
class MyItem_Green: MyItem
{
    hiddenSelections[] = {"camo"};
    hiddenSelectionsTextures[] = {"MyMod\data\my_item_green_co.paa"};
    hiddenSelectionsMaterials[] = {"MyMod\data\my_item_green.rvmat"};
};
```

这允许创建共享同一 P3D 模型但使用不同材质的物品变体（配色方案、迷彩图案）。

---

## 从零创建 RVMAT

### 分步指南：标准不透明物品

1. **创建你的纹理文件：**
   - `my_item_co.paa`（漫反射颜色）
   - `my_item_nohq.paa`（法线贴图）
   - `my_item_smdi.paa`（高光/金属）

2. **创建 RVMAT 文件**（纯文本）：

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.0, 0.0, 0.0, 0.0};
specular[] = {0.5, 0.5, 0.5, 1.0};
specularPower = 60;
PixelShaderID = "Super";
VertexShaderID = "Super";

class Stage1
{
    texture = "MyMod\data\my_item_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2
{
    texture = "MyMod\data\my_item_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3
{
    texture = "MyMod\data\my_item_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

3. **在 Object Builder 中分配：**
   - 打开你的 P3D 模型。
   - 在 Resolution LOD 中选择面。
   - 右键点击 --> **Face Properties**。
   - 浏览到你的 RVMAT 文件。

4. **在游戏中测试** 通过文件补丁或 PBO 构建。

---

## 实际示例

### DayZ-Samples Test_ClothingRetexture

官方 DayZ-Samples 包含一个 `Test_ClothingRetexture` 示例，演示了标准材质工作流程：

```cpp
// 来自 DayZ-Samples 重新纹理示例
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.0, 0.0, 0.0, 0.0};
specular[] = {0.3, 0.3, 0.3, 1.0};
specularPower = 50;
PixelShaderID = "Super";
VertexShaderID = "Super";

class Stage1
{
    texture = "DZ_Samples\Test_ClothingRetexture\data\tshirt_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2
{
    texture = "DZ_Samples\Test_ClothingRetexture\data\tshirt_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3
{
    texture = "DZ_Samples\Test_ClothingRetexture\data\tshirt_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

### 金属武器材质

具有高金属响应的抛光武器枪管：

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.0, 0.0, 0.0, 0.0};
specular[] = {0.9, 0.9, 0.9, 1.0};        // 金属的高高光
specularPower = 150;                        // 紧凑、集中的高光
PixelShaderID = "Super";
VertexShaderID = "Super";

// ... 武器纹理的 Stage 定义 ...
```

### 自发光材质（发光屏幕）

用于发光设备屏幕的材质：

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.05, 0.3, 0.05, 1.0};      // 柔和的绿色发光
specular[] = {0.5, 0.5, 0.5, 1.0};
specularPower = 80;
PixelShaderID = "Super";
VertexShaderID = "Super";

// ... 包含 Stage7 中 _li 自发光贴图的 Stage 定义 ...
```

---

## 常见错误

### 1. 阶段顺序错误

**症状：** 纹理显示混乱，法线贴图显示为颜色，颜色显示为凹凸。
**修复：** 确保 Stage1 = 法线，Stage2 = 漫反射，Stage3 = 高光（对于 Super 着色器）。

### 2. `emmisive` 拼写错误

**症状：** 自发光不工作。
**修复：** Bohemia 使用 `emmisive`（双 m，单 s）。使用正确的英语拼写 `emissive` 不会工作。这是一个已知的历史怪癖。

### 3. 纹理路径不匹配

**症状：** 模型显示默认灰色或品红色材质。
**修复：** 验证 RVMAT 中的纹理路径与相对于 P: 驱动器的文件位置完全匹配。路径使用反斜杠。检查大小写——某些系统区分大小写。

### 4. P3D 中缺少 RVMAT 分配

**症状：** 模型以无材质渲染（平坦灰色或默认着色器）。
**修复：** 在 Object Builder 中打开模型，选择面，通过 **Face Properties** 分配 RVMAT。

### 5. 透明物品使用了错误的着色器

**症状：** 透明纹理显示为不透明，或整个表面消失。
**修复：** 对透明表面使用 `Glass`、`AlphaTest` 或 `AlphaBlend` 着色器而不是 `Super`。使用带有正确 Alpha 通道的 `_ca` 后缀纹理。

---

## 最佳实践

1. **从工作示例开始。** 从 DayZ-Samples 或原版物品复制 RVMAT 并修改它。从头开始容易出现拼写错误。

2. **将材质和纹理放在一起。** 将 RVMAT 存储在与其纹理相同的 `data/` 目录中。这使关系显而易见并简化路径管理。

3. **除非有理由，否则使用 Super 着色器。** 它正确处理 95% 的使用场景。

4. **即使是简单物品也创建伤害材质。** 玩家会注意到物品不会视觉退化。至少为较低健康等级使用原版默认伤害材质。

5. **在游戏中测试高光，不仅在 Object Builder 中。** 编辑器光照和游戏内光照产生非常不同的结果。在 Object Builder 中看起来完美的东西可能在 DayZ 的动态光照下太亮或太暗。

6. **记录你的材质设置。** 当你找到适合某种表面类型的高光/功率值时，记录下来。你会在许多物品中重复使用这些设置。

---

## 导航

| 上一章 | 上级 | 下一章 |
|----------|----|------|
| [4.2 3D 模型](02-models.md) | [第 4 部分：文件格式与 DayZ Tools](01-textures.md) | [4.4 音频](04-audio.md) |
