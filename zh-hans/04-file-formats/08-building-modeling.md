# 第 4.8 章：建筑建模 -- 门与梯子

[首页](../README.md) | [<< 上一章：Workbench 指南](07-workbench-guide.md) | **建筑建模**

---

## 简介

DayZ 中的建筑不仅仅是静态场景。玩家不断与它们互动——开门、爬梯子、在墙后掩护。创建支持这些交互的自定义建筑需要精心设置模型：门需要旋转轴和跨多个 LOD 的命名选择，梯子需要通过 Memory LOD 顶点精确放置的攀爬路径。

本章涵盖向自定义建筑模型添加交互式门和可攀爬梯子的完整工作流程，基于 Bohemia Interactive 的官方文档。

### 先决条件

- 一个正常工作的 **Work-drive**，包含你的自定义模组文件夹结构。
- 已配置 **Buldozer**（模型预览）的 **Object Builder**（来自 DayZ Tools 包）。
- 能够将自定义模组文件二进制化并打包为 PBO。
- 熟悉 LOD 系统和命名选择（在[第 4.2 章：3D 模型](02-models.md)中有介绍）。

---

## 目录

- [概述](#introduction)
- [门的配置](#door-configuration)
  - [模型设置](#model-setup-for-doors)
  - [model.cfg -- 骨骼和动画](#modelcfg----skeletons-and-animations)
  - [游戏配置 (config.cpp)](#game-config-configcpp)
  - [双开门](#double-doors)
  - [滑动门](#shifting-doors)
  - [包围球问题](#bounding-sphere-issues)
- [梯子配置](#ladder-configuration)
  - [支持的梯子类型](#supported-ladder-types)
  - [Memory LOD 命名选择](#memory-lod-named-selections)
  - [View Geometry 要求](#view-geometry-requirements)
  - [梯子尺寸](#ladder-dimensions)
  - [碰撞空间](#collision-space)
  - [梯子的配置要求](#config-requirements-for-ladders)
- [模型要求总结](#model-requirements-summary)
- [最佳实践](#best-practices)
- [常见错误](#common-mistakes)
- [参考资料](#references)

---

## 门的配置

交互式门需要三个部分配合：带有正确命名选择和记忆点的 P3D 模型、定义动画骨骼和旋转参数的 `model.cfg`，以及将门与声音、伤害区域和游戏逻辑关联的 `config.cpp` 游戏配置。

### 门的模型设置

P3D 模型中的门必须包含以下内容：

1. **跨所有相关 LOD 的命名选择。** 代表门的几何体必须在以下每个 LOD 中被分配到一个命名选择（例如 `door1`）：
   - **Resolution LOD** -- 玩家看到的视觉网格。
   - **Geometry LOD** -- 物理碰撞形状。还必须包含一个值为 `house` 的命名属性 `class`。
   - **View Geometry LOD** -- 用于可见性检查和动作射线投射。此处的选择名称对应于游戏配置中的 `component` 参数。
   - **Fire Geometry LOD** -- 用于弹道命中检测。

2. **Memory LOD 顶点**，定义：
   - **旋转轴** -- 两个顶点组成旋转轴，分配到像 `door1_axis` 这样的命名选择。此轴定义了门围绕其旋转的铰链线。
   - **声音位置** -- 一个顶点分配到像 `door1_action` 这样的命名选择，标记门声音的来源位置。
   - **动作小部件位置** -- 向玩家显示交互小部件的位置。

#### 推荐门尺寸

原版 DayZ 中几乎所有门都是 **120 x 220 厘米**（宽 x 高）。使用这些标准尺寸可确保动画看起来正确，角色能自然通过开口。将你的门建模为**默认关闭状态**，并设置动画打开——Bohemia 计划将来支持门向两个方向打开。

### model.cfg -- 骨骼和动画

任何动画门都需要一个 `model.cfg` 文件。此配置定义骨骼结构（skeleton）和动画参数。将 `model.cfg` 放在模型文件附近，或放在文件夹结构的更高层——只要二进制化工具能找到它，具体位置是灵活的。

`model.cfg` 有两个部分：

#### CfgSkeletons

定义动画骨骼。每个门获得一个骨骼条目。骨骼以成对方式列出：骨骼名称后跟其父级（空字符串 `""` 表示根级骨骼）。

```cpp
class CfgSkeletons
{
    class Default
    {
        isDiscrete = 1;
        skeletonInherit = "";
        skeletonBones[] = {};
    };
    class Skeleton_2door: Default
    {
        skeletonInherit = "Default";
        skeletonBones[] =
        {
            "door1", "",
            "door2", ""
        };
    };
};
```

#### CfgModels

定义每个骨骼的动画。`CfgModels` 下的类名 **必须与你的模型文件名匹配**（不包含扩展名）才能正确链接。

```cpp
class CfgModels
{
    class Default
    {
        sectionsInherit = "";
        sections[] = {};
        skeletonName = "";
    };
    class yourmodelname: Default
    {
        skeletonName = "Skeleton_2door";
        class Animations
        {
            class Door1
            {
                type = "rotation";
                selection = "door1";
                source = "door1";
                axis = "door1_axis";
                memory = 1;
                minValue = 0;
                maxValue = 1;
                angle0 = 0;
                angle1 = 1.4;
            };
            class Door2
            {
                type = "rotation";
                selection = "door2";
                source = "door2";
                axis = "door2_axis";
                memory = 1;
                minValue = 0;
                maxValue = 1;
                angle0 = 0;
                angle1 = -1.4;
            };
        };
    };
};
```

**关键参数说明：**

| 参数 | 说明 |
|-----------|-------------|
| `type` | 动画类型。旋转门使用 `"rotation"`，滑动门使用 `"translation"`。 |
| `selection` | 模型中应被动画化的命名选择。 |
| `source` | 链接到游戏配置的 `Doors` 类。必须与 `config.cpp` 中的类名匹配。 |
| `axis` | Memory LOD 中定义旋转轴的命名选择（两个顶点）。 |
| `memory` | 设置为 `1` 表示轴在 Memory LOD 中定义。 |
| `minValue` / `maxValue` | 动画阶段范围。通常为 `0` 到 `1`。 |
| `angle0` / `angle1` | 旋转角度，单位为**弧度**。`angle1` 定义门打开的角度。使用负值反转方向。`1.4` 弧度大约为 80 度。 |

#### 在 Buldozer 中验证

编写 `model.cfg` 后，在运行 Buldozer 的 Object Builder 中打开你的模型。使用 `[` 和 `]` 键循环可用的动画源，使用 `;` / `'`（或鼠标滚轮上/下）来推进或后退动画。这让你可以验证门是否在其轴上正确旋转。

### 游戏配置 (config.cpp)

游戏配置将动画模型连接到游戏系统——声音、伤害和门状态逻辑。配置类名 **必须** 遵循 `land_modelname` 模式才能正确链接模型。

```cpp
class CfgPatches
{
    class yourcustombuilding
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = {"DZ_Data"};
        author = "yourname";
        name = "addonname";
        url = "";
    };
};

class CfgVehicles
{
    class HouseNoDestruct;
    class land_modelname: HouseNoDestruct
    {
        model = "\path\to\your\model\file.p3d";
        class Doors
        {
            class Door1
            {
                displayName = "door 1";
                component = "Door1";
                soundPos = "door1_action";
                animPeriod = 1;
                initPhase = 0;
                initOpened = 0.5;
                soundOpen = "sound open";
                soundClose = "sound close";
                soundLocked = "sound locked";
                soundOpenABit = "sound openabit";
            };
            class Door2
            {
                displayName = "door 2";
                component = "Door2";
                soundPos = "door2_action";
                animPeriod = 1;
                initPhase = 0;
                initOpened = 0.5;
                soundOpen = "sound open";
                soundClose = "sound close";
                soundLocked = "sound locked";
                soundOpenABit = "sound openabit";
            };
        };
        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 1000;
                };
            };
            class GlobalArmor
            {
                class Projectile
                {
                    class Health { damage = 0; };
                    class Blood { damage = 0; };
                    class Shock { damage = 0; };
                };
                class Melee
                {
                    class Health { damage = 0; };
                    class Blood { damage = 0; };
                    class Shock { damage = 0; };
                };
            };
            class DamageZones
            {
                class Door1
                {
                    class Health
                    {
                        hitpoints = 1000;
                        transferToGlobalCoef = 0;
                    };
                    componentNames[] = {"door1"};
                    fatalInjuryCoef = -1;
                    class ArmorType
                    {
                        class Projectile
                        {
                            class Health { damage = 2; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                        class Melee
                        {
                            class Health { damage = 2.5; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                    };
                };
                class Door2
                {
                    class Health
                    {
                        hitpoints = 1000;
                        transferToGlobalCoef = 0;
                    };
                    componentNames[] = {"door2"};
                    fatalInjuryCoef = -1;
                    class ArmorType
                    {
                        class Projectile
                        {
                            class Health { damage = 2; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                        class Melee
                        {
                            class Health { damage = 2.5; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                    };
                };
            };
        };
    };
};
```

**门配置参数说明：**

| 参数 | 说明 |
|-----------|-------------|
| `component` | 用于该门的 **View Geometry LOD** 中的命名选择。 |
| `soundPos` | **Memory LOD** 中播放门声音的命名选择。 |
| `animPeriod` | 门动画的速度（秒）。 |
| `initPhase` | 初始动画阶段（`0` = 关闭，`1` = 完全打开）。在 Buldozer 中测试以验证哪个值对应哪个状态。 |
| `initOpened` | 门在世界中生成时打开的概率。`0.5` 表示 50% 的几率。 |
| `soundOpen` | 门打开时从 `CfgActionSounds` 播放的声音类。可用声音集请参见 `DZ\sounds\hpp\config.cpp`。 |
| `soundClose` | 门关闭时播放的声音类。 |
| `soundLocked` | 玩家尝试打开锁着的门时播放的声音类。 |
| `soundOpenABit` | 玩家破开锁着的门时播放的声音类。 |

**配置的重要注意事项：**

- DayZ 中所有建筑都继承自 `HouseNoDestruct`。
- `class Doors` 下的每个类名必须对应 `model.cfg` 中定义的 `source` 参数。
- `DamageSystem` 部分必须为每个门包含一个 `DamageZones` 子类。`componentNames[]` 数组引用模型 Fire Geometry LOD 中的命名选择。
- 添加 `class=house` 命名属性和游戏配置类需要重新二进制化你的地形（`.wrp` 文件中的模型路径会被替换为游戏配置类引用）。

### 双开门

双开门（两扇从单次交互中一起打开的门翼）在 DayZ 中很常见。它们需要特殊设置：

**在模型中：**
- 将每扇门翼配置为具有自己命名选择的独立门（例如 `door3_1` 和 `door3_2`）。
- 在 **Memory LOD** 中，动作点必须在两扇门翼之间 **共享** ——使用一个命名选择和一个顶点作为动作位置。
- 无后缀的命名选择（例如没有门翼后缀的 `door3`）必须覆盖 **两个** 门把手。
- **View Geometry** 和 **Fire Geometry** 需要一个覆盖两扇门翼的附加命名选择。

**在 model.cfg 中：**
- 将每扇门翼定义为单独的动画类，但为两扇门翼设置 **相同的 `source` 参数**（例如两者都设为 `"doors34"`）。
- 一扇门翼的 `angle1` 设为 **正值**，另一扇设为 **负值**，使它们向相反方向摆动。

**在 config.cpp 中：**
- 在 `class Doors` 下只定义 **一个** 类，其名称与共享的 `source` 参数匹配。
- 类似地，在 `DamageZones` 中只为双开门对定义 **一个** 条目。

### 滑动门

对于沿轨道滑动而非摆动的门（如谷仓门或滑动面板），将 `model.cfg` 中的动画 `type` 从 `"rotation"` 改为 `"translation"`。Memory LOD 中的轴顶点然后定义移动方向而非旋转线。

### 包围球问题

默认情况下，模型的包围球大小设置为包含整个物体。当门在关闭位置建模时，打开位置可能会 **延伸到** 此包围球之外。这会导致问题：

- **动作停止工作** -- 从某些角度进行门交互的射线投射失败。
- **弹道忽略门** -- 子弹穿过位于包围球之外的几何体。

**解决方案：** 在 Memory LOD 中创建一个覆盖门完全打开时建筑占据的更大区域的命名选择。然后在你的游戏配置类中添加 `bounding` 参数：

```cpp
class land_modelname: HouseNoDestruct
{
    bounding = "selection_name";
    // ... 其余配置
};
```

这会用一个包含所有门位置的包围球覆盖自动包围球计算。

---

## 梯子配置

与门不同，DayZ 中的梯子 **不需要动画配置** 和 **不需要基础建筑类之外的特殊游戏配置条目**。整个梯子设置通过 Memory LOD 顶点放置和一个 View Geometry 选择完成。这使得梯子比门更容易设置，但顶点放置必须精确。

### 支持的梯子类型

DayZ 支持两种类型的梯子：

1. **前方底部进入，侧面顶部退出** -- 玩家从底部正面接近，在顶部从侧面退出（靠墙）。
2. **前方底部进入，前方顶部退出** -- 玩家从底部正面接近，在顶部向前退出（到屋顶或平台上）。

两种类型还支持 **中间侧面进出点**，允许玩家在中间楼层上下梯子。梯子也可以 **以一定角度** 放置，而不仅仅是严格垂直。

### Memory LOD 命名选择

梯子完全由 Memory LOD 中的命名顶点定义。每个选择名称以 `ladderN_` 开头，其中 **N** 是梯子 ID，从 `1` 开始。一栋建筑可以有多个梯子（`ladder1_`、`ladder2_`、`ladder3_` 等）。

以下是梯子的完整命名选择集：

| 命名选择 | 说明 |
|----------------|-------------|
| `ladderN_bottom_front` | 定义底部进入台阶——玩家开始攀爬的位置。 |
| `ladderN_middle_left` | 定义中间进出点（左侧）。如果梯子经过多个楼层，可以包含多个顶点。 |
| `ladderN_middle_right` | 定义中间进出点（右侧）。多楼层梯子可包含多个顶点。 |
| `ladderN_top_front` | 定义上方退出台阶——玩家完成攀爬的位置（前方退出类型）。 |
| `ladderN_top_left` | 定义靠墙梯子的上方退出方向（左侧）。必须比地板至少高 **5 个梯子台阶**（大约是站在梯子上的玩家的高度）。 |
| `ladderN_top_right` | 定义靠墙梯子的上方退出方向（右侧）。高度要求与 `top_left` 相同。 |
| `ladderN` | 定义"进入梯子"动作小部件向玩家显示的位置。 |
| `ladderN_dir` | 定义可以攀爬梯子的方向（接近方向）。 |
| `ladderN_con` | 进入动作的测量点。**必须放置在地板水平面。** |
| `ladderN_con_dir` | 定义以 `ladderN_con` 为原点的 180 度锥体方向，在此锥体内进入梯子的动作可用。 |

这些都是你在 Object Builder 的 Memory LOD 中手动放置的顶点（或中间点的顶点集）。

### View Geometry 要求

除了 Memory LOD 设置外，你还必须创建一个名为 `ladderN` 的命名选择的 **View Geometry** 组件。此选择必须覆盖梯子的 **整个体积** ——可攀爬区域的完整高度和宽度。没有此 View Geometry 选择，梯子将无法正常工作。

### 梯子尺寸

梯子攀爬动画设计为 **固定尺寸**。你的梯子横档和间距应与原版梯子的比例匹配，以确保动画正确对齐。请参阅官方 DayZ Samples 仓库获取精确测量值——示例梯子部件与大多数原版建筑使用的相同。

### 碰撞空间

角色在攀爬梯子时 **会与几何体碰撞**。这意味着你必须确保在以下两个 LOD 中梯子周围有足够的清晰空间供攀爬角色使用：

- **Geometry LOD** -- 物理碰撞。
- **Roadway LOD** -- 表面交互。

如果空间太紧，角色在攀爬动画中会穿入墙壁或卡住。

### 梯子的配置要求

与 Arma 系列不同，DayZ **不** 要求游戏配置类中有 `ladders[]` 数组。但是，仍然需要两件事：

1. 你的模型必须有一个 **配置表示** —— 一个包含 `CfgVehicles` 类的 `config.cpp`（与门使用的相同基类；参见上面的门配置部分）。
2. **Geometry LOD** 必须包含值为 `house` 的命名属性 `class`。

除了这两个要求之外，梯子完全由 Memory LOD 顶点和 View Geometry 选择定义。不需要 `model.cfg` 动画条目。

---

## 模型要求总结

具有门和梯子的建筑必须包含多个 LOD，每个 LOD 服务于不同的目的。下表总结了每个 LOD 必须包含的内容：

| LOD | 用途 | 门的要求 | 梯子的要求 |
|-----|---------|-------------------|---------------------|
| **Resolution LOD** | 显示给玩家的视觉网格。 | 门几何体的命名选择（例如 `door1`）。 | 无特殊要求。 |
| **Geometry LOD** | 物理碰撞检测。 | 门几何体的命名选择。命名属性 `class = "house"`。 | 命名属性 `class = "house"`。梯子周围有足够空间供攀爬角色使用。 |
| **Fire Geometry LOD** | 弹道命中检测（子弹、弹药）。 | 与伤害区域配置中 `componentNames[]` 匹配的命名选择。 | 无特殊要求。 |
| **View Geometry LOD** | 可见性检查，动作射线投射。 | 与门配置中 `component` 参数匹配的命名选择。 | 覆盖梯子完整体积的命名选择 `ladderN`。 |
| **Memory LOD** | 轴定义、动作点、声音位置。 | 轴顶点（`door1_axis`）、声音位置（`door1_action`）、动作小部件位置。 | 完整的梯子顶点集（`ladderN_bottom_front`、`ladderN_top_left`、`ladderN_dir`、`ladderN_con` 等）。 |
| **Roadway LOD** | 角色的表面交互。 | 通常不需要。 | 梯子周围有足够空间供攀爬角色使用。 |

### 命名选择一致性

一个关键要求是 **命名选择在引用它们的所有 LOD 中必须保持一致**。如果一个选择在 Resolution LOD 中叫 `door1`，它在 Geometry、Fire Geometry 和 View Geometry LOD 中也必须叫 `door1`。LOD 之间名称不匹配会导致门或梯子静默失败。

---

## 最佳实践

1. **将门建模为默认关闭状态。** 从关闭状态动画到打开状态。Bohemia 计划支持门向两个方向打开，因此从关闭状态开始是面向未来的。

2. **使用标准门尺寸。** 除非有特定的设计理由，否则门开口应保持 120 x 220 厘米。这与原版建筑匹配，确保角色动画看起来正确。

3. **在打包前在 Buldozer 中测试动画。** 使用 `[` / `]` 循环源，使用 `;` / `'` 或鼠标滚轮来擦洗动画。在此处捕获轴或角度错误可以节省大量时间。

4. **为大型建筑覆盖包围球。** 如果你的建筑有明显向外摆动的门，请在 Memory LOD 中创建一个覆盖完整动画范围的选择，并使用 `bounding` 配置参数链接它。

5. **精确放置梯子顶点。** 攀爬动画固定于特定尺寸。顶点间距太远或未对齐会导致角色浮动、穿模或卡住。

6. **确保梯子周围有间隙。** 在 Geometry 和 Roadway LOD 中为攀爬中的角色模型留出足够空间。

7. **每个模型或文件夹保持一个 `model.cfg`。** `model.cfg` 不需要紧挨着 `.p3d` 文件放置，但将它们放在一起使组织更容易。它也可以放在文件夹结构的更高层以覆盖多个模型。

8. **使用 DayZ Samples 仓库。** Bohemia 在 `https://github.com/BohemiaInteractive/DayZ-Samples` 提供了门（`Test_Building`）和梯子（`Test_Ladders`）的工作示例。在构建自己的之前先研究这些。

9. **添加建筑配置后重新二进制化地形。** 添加 `class=house` 和游戏配置类意味着 `.wrp` 文件中的模型路径会被替换为类引用。你的地形必须重新二进制化才能生效。

10. **放置建筑后更新导航网格。** 重建地形但没有更新导航网格可能导致 AI 穿过门而不是正确使用它们。

---

## 常见错误

### 门

| 错误 | 症状 | 修复方法 |
|---------|---------|-----|
| `CfgModels` 类名与模型文件名不匹配。 | 门动画不播放。 | 将类名重命名为与 `.p3d` 文件名完全匹配（不含扩展名）。 |
| 一个或多个 LOD 中缺少命名选择。 | 门可见但不可交互，或子弹穿过。 | 确保选择存在于 Resolution、Geometry、View Geometry 和 Fire Geometry LOD 中。 |
| 轴顶点缺失或只定义了一个顶点。 | 门从错误的点旋转或根本不旋转。 | 在 Memory LOD 中为轴选择（例如 `door1_axis`）放置恰好两个顶点。 |
| `model.cfg` 中的 `source` 与 `config.cpp` Doors 中的类名不匹配。 | 门未链接到游戏逻辑——没有声音，没有状态变化。 | 确保 `source` 参数和 Doors 类名完全相同。 |
| 忘记在 Geometry LOD 中添加 `class = "house"` 命名属性。 | 建筑未被识别为交互式结构。 | 在 Object Builder 的 Geometry LOD 中添加命名属性。 |
| 包围球太小。 | 从某些角度门动作或弹道失败。 | 在 Memory LOD 中添加 `bounding` 选择并在配置中引用它。 |
| 双开门的 `angle1` 正负值混淆。 | 两扇门翼向同一方向摆动并相互穿透。 | 一扇门翼需要正值 `angle1`，另一扇需要负值。 |

### 梯子

| 错误 | 症状 | 修复方法 |
|---------|---------|-----|
| `ladderN_con` 未放置在地板水平面。 | "进入梯子"动作不出现或出现在错误的高度。 | 将顶点移至地面/地板水平面。 |
| 缺少 View Geometry 选择 `ladderN`。 | 梯子无法交互。 | 创建一个覆盖完整梯子体积的命名选择的 View Geometry 组件。 |
| `ladderN_top_left` / `ladderN_top_right` 太低。 | 角色在顶部出口穿过墙壁或地板。 | 这些必须至少比地板水平面高 5 个梯子台阶。 |
| Geometry LOD 中间隙不足。 | 角色在攀爬时卡住或穿入墙壁。 | 加宽 Geometry 和 Roadway LOD 中梯子周围的间隙。 |
| 梯子编号从 0 开始。 | 梯子不工作。 | 编号从 `1` 开始（`ladder1_`，而不是 `ladder0_`）。 |
| 在游戏配置中指定 `ladders[]`。 | 浪费精力（无害但不必要）。 | DayZ 不使用 `ladders[]` 数组。删除它并依赖 Memory LOD 顶点放置。 |

---

## 参考资料

- [Bohemia Interactive -- 建筑上的门](https://community.bistudio.com/wiki/DayZ:Doors_on_buildings)（官方 BI 文档）
- [Bohemia Interactive -- 建筑上的梯子](https://community.bistudio.com/wiki/DayZ:Ladders_on_buildings)（官方 BI 文档）
- [DayZ Samples -- Test_Building](https://github.com/BohemiaInteractive/DayZ-Samples/tree/master/Test_Building)（可工作的门示例）
- [DayZ Samples -- Test_Ladders](https://github.com/BohemiaInteractive/DayZ-Samples/tree/master/Test_Ladders)（可工作的梯子示例）
- [第 4.2 章：3D 模型](02-models.md) -- LOD 系统、命名选择、`model.cfg` 基础

---

## 导航

| 上一章 | 上级 | 下一章 |
|----------|----|------|
| [4.7 Workbench 指南](07-workbench-guide.md) | [第 4 部分：文件格式与 DayZ Tools](01-textures.md) | -- |
