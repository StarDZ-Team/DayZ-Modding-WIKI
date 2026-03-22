# 第 8.13 章：诊断菜单（Diag Menu）

[首页](../../README.md) | [<< 上一章：构建交易系统](12-trading-system.md) | **诊断菜单**

---

> **摘要：** 诊断菜单是 DayZ 内置的诊断工具，仅在 DayZDiag 可执行文件中可用。它提供 FPS 计数器、脚本性能分析、渲染调试、自由摄像机、物理可视化、天气控制、中央经济工具、AI 导航调试和声音诊断等功能。本章根据 Bohemia Interactive 的官方文档，记录了每个菜单类别、选项和键盘快捷键。

---

## 目录

- [什么是诊断菜单？](#what-is-the-diag-menu)
- [如何访问](#how-to-access)
- [导航控制](#navigation-controls)
- [快捷键盘快捷键](#quick-access-keyboard-shortcuts)
- [菜单类别概览](#menu-categories-overview)
- [统计信息](#statistics)
- [Enfusion 渲染器](#enfusion-renderer)
- [Enfusion 世界（物理）](#enfusion-world-physics)
- [DayZ 渲染](#dayz-render)
- [游戏](#game)
- [AI](#ai)
- [声音](#sounds)
- [模组制作者常用功能](#useful-features-for-modders)
- [何时使用诊断菜单](#when-to-use-the-diag-menu)
- [常见错误](#common-mistakes)
- [下一步](#next-steps)

---

## 什么是诊断菜单？

诊断菜单是内置于 DayZ 诊断可执行文件中的分层调试菜单。它列出了用于调试游戏脚本和资源的选项，涵盖七大类别：统计信息、Enfusion 渲染器、Enfusion 世界、DayZ 渲染、游戏、AI 和声音。

诊断菜单在零售版 DayZ 可执行文件（`DayZ_x64.exe`）中**不可用**。你必须使用 `DayZDiag_x64.exe` —— 诊断版本，它与零售版一起安装在你的 DayZ 安装目录或 DayZ 服务器目录中。

---

## 如何访问

### 前提条件

- **DayZDiag_x64.exe** —— 诊断可执行文件。位于你的 DayZ 安装文件夹中，与常规的 `DayZ_x64.exe` 并列。
- 你必须正在运行游戏（而不是停留在加载界面上）。该菜单在任何 3D 视口中都可用。

### 打开菜单

按 **Win + Alt** 打开诊断菜单。

另一个快捷键是 **Ctrl + Win**，但这与 Windows 11 的系统快捷键冲突，不建议在该平台上使用。

### 启用鼠标光标

某些诊断菜单选项需要你使用鼠标与屏幕交互。可以通过按以下键来切换鼠标光标：

**LCtrl + Numpad 9**

此快捷键通过脚本（`PluginKeyBinding`）注册。

---

## 导航控制

打开诊断菜单后：

| 按键 | 操作 |
|------|------|
| **上/下方向键** | 在菜单项之间导航 |
| **右方向键** | 进入子菜单，或切换选项值 |
| **左方向键** | 反向切换选项值 |
| **Backspace** | 退出当前子菜单（返回上一级） |

当选项显示多个值时，它们按菜单中出现的顺序列出。第一个选项通常是默认值。

---

## 快捷键盘快捷键

这些快捷键在运行 DayZDiag 时随时有效，无需打开菜单：

| 快捷键 | 功能 |
|--------|------|
| **LCtrl + Numpad 1** | 切换 FPS 计数器 |
| **LCtrl + Numpad 9** | 切换屏幕上的鼠标光标 |
| **RCtrl + RAlt + W** | 循环渲染调试模式 |
| **LCtrl + LAlt + P** | 切换后处理效果 |
| **LAlt + Numpad 6** | 切换物理体可视化 |
| **Page Up** | 自由摄像机：切换玩家移动 |
| **Page Down** | 自由摄像机：冻结/解冻摄像机 |
| **Insert** | 将玩家传送到光标位置（在自由摄像机模式下） |
| **Home** | 切换自由摄像机 / 禁用并将玩家传送到光标位置 |
| **Numpad /** | 切换自由摄像机（不传送） |
| **End** | 禁用自由摄像机（返回玩家摄像机） |

> **注意：** 官方文档中提到的"Cheat Inputs"指的是在 C++ 端硬编码的输入，不可通过脚本访问。

---

## 菜单类别概览

诊断菜单包含七个顶级类别：

1. **Statistics** —— FPS 计数器和脚本性能分析器
2. **Enfusion Renderer** —— 光照、阴影、材质、遮挡、后处理、地形、控件
3. **Enfusion World** —— 物理引擎（Bullet）可视化和调试
4. **DayZ Render** —— 天空渲染、几何体诊断
5. **Game** —— 天气、自由摄像机、载具、战斗、中央经济、地表声音
6. **AI** —— 导航网格、寻路、AI 代理行为
7. **Sounds** —— 播放样本调试、声音系统信息

---

## 统计信息

### 菜单结构

```
Statistics
  FPS                              [LCtrl + Numpad 1]
  Script profiler UI
  > Script profiler settings
      Always enabled
      Flags
      Module
      Update interval
      Average
      Time resolution
      (UI) Scale
```

### FPS

在屏幕左上角启用 FPS 计数器。

FPS 值根据最近 10 帧之间的时间计算，因此它反映的是短期滚动平均值，而不是瞬时读数。

### 脚本性能分析器 UI

开启屏幕上的脚本性能分析器，显示脚本执行的实时性能数据。

分析器显示六个数据部分：

| 部分 | 显示内容 |
|------|----------|
| **Time per class** | 属于某个类的所有函数调用的总时间（前 20） |
| **Time per function** | 某个特定函数所有调用的总时间（前 20） |
| **Class allocations** | 某个类的分配次数（前 20） |
| **Count per function** | 某个函数被调用的次数（前 20） |
| **Class count** | 某个类的活跃实例数（前 40） |
| **Stats and settings** | 当前分析器配置和帧计数器 |

Stats and settings 面板显示：

| 字段 | 含义 |
|------|------|
| UI enabled (DIAG) | 脚本分析器 UI 是否处于活动状态 |
| Profiling enabled (SCRP) | 即使 UI 未活动，分析是否在运行 |
| Profiling enabled (SCRC) | 分析是否实际在进行 |
| Flags | 当前数据收集标志 |
| Module | 当前被分析的模块 |
| Interval | 当前更新间隔 |
| Time Resolution | 当前时间分辨率 |
| Average | 显示的值是否为平均值 |
| Game Frame | 已过去的总帧数 |
| Session Frame | 本次分析会话中的总帧数 |
| Total Frames | 所有分析会话的总帧数 |
| Profiled Sess Frms | 本次会话中已分析的帧数 |
| Profiled Frames | 所有会话中已分析的帧数 |

> **重要：** 脚本性能分析器仅分析脚本代码。Proto（引擎绑定）方法不会作为单独条目被测量，但它们的执行时间包含在调用它们的脚本方法的总时间中。

> **重要：** `EnProfiler` API 和脚本性能分析器本身仅在诊断可执行文件中可用。

### 脚本性能分析器设置

这些设置控制分析数据的收集方式。它们也可以通过 `EnProfiler` API（记录在 `EnProfiler.c` 中）以编程方式调整。

#### Always Enabled

分析数据收集默认情况下未启用。此开关显示它是否当前处于活动状态。

要在启动时启用分析，请使用启动参数 `-profile`。

脚本性能分析器 UI 忽略此设置 —— 它在 UI 可见时始终强制进行分析。当 UI 关闭时，分析再次停止（除非"Always enabled"设置为 true）。

#### 标志

控制数据的收集方式。有四种组合可用：

| 标志组合 | 范围 | 数据生命周期 |
|----------|------|-------------|
| `SPF_RESET \| SPF_RECURSIVE` | 选定模块 + 子模块 | 每帧（每帧重置） |
| `SPF_RECURSIVE` | 选定模块 + 子模块 | 跨帧累积 |
| `SPF_RESET` | 仅选定模块 | 每帧（每帧重置） |
| `SPF_NONE` | 仅选定模块 | 跨帧累积 |

- **SPF_RECURSIVE**：启用子模块的分析（递归）
- **SPF_RESET**：在每帧结束时清除数据

#### Module

选择要分析的脚本模块：

| 选项 | 脚本层 |
|------|--------|
| CORE | 1_Core |
| GAMELIB | 2_GameLib |
| GAME | 3_Game |
| WORLD | 4_World |
| MISSION | 5_Mission |
| MISSION_CUSTOM | init.c |

#### Update Interval

在更新排序数据显示之前等待的帧数。这也会延迟 `SPF_RESET` 引起的重置。

可用值：0、5、10、20、30、50、60、120、144

#### Average

启用或禁用平均值的显示。

- 使用 `SPF_RESET` 且无间隔时：值为每帧的原始值
- 不使用 `SPF_RESET` 时：将累积值除以会话帧数
- 设置了间隔时：除以间隔值

类计数永远不会被平均 —— 它始终显示当前实例数。分配次数将显示实例创建的平均次数。

#### Time Resolution

设置显示的时间单位。该值表示分母（秒的几分之几）：

| 值 | 单位 |
|----|------|
| 1 | 秒 |
| 1000 | 毫秒 |
| 1000000 | 微秒 |

可用值：1、10、100、1000、10000、100000、1000000

#### (UI) Scale

调整屏幕上分析器显示的视觉缩放，以适应不同的屏幕尺寸和分辨率。

范围：0.5 到 1.5（默认：1.0，步长：0.05）

---

## Enfusion 渲染器

### 菜单结构

```
Enfusion Renderer
  Lights
  > Lighting
      Ambient lighting
      Ground lighting
      Directional lighting
      Bidirectional lighting
      Specular lighting
      Reflection
      Emission lighting
  Shadows
  Terrain shadows
  Render debug mode                [RCtrl + RAlt + W]
  Occluders
  Occlude entities
  Occlude proxies
  Show occluder volumes
  Show active occluders
  Show occluded
  Widgets
  Postprocess                      [LCtrl + LAlt + P]
  Terrain
  > Materials
      Common, TreeTrunk, TreeCrown, Grass, Basic, Normal,
      Super, Skin, Multi, Old Terrain, Old Roads, Water,
      Sky, Sky clouds, Sky stars, Sky flares,
      Particle Sprite, Particle Streak
```

### 光源

切换实际光源（如 `PersonalLight` 或游戏中的物品如手电筒）。这不影响环境光照 —— 请使用 Lighting 子菜单。

### Lighting 子菜单

每个开关控制特定的光照组件：

| 选项 | 禁用时的效果 |
|------|-------------|
| **Ambient lighting** | 移除场景中的通用环境光 |
| **Ground lighting** | 移除从地面反射的光线（在屋顶、角色腋下可见） |
| **Directional lighting** | 移除主方向光（太阳/月亮）。同时禁用双向光照 |
| **Bidirectional lighting** | 移除双向光照组件 |
| **Specular lighting** | 移除高光（在橱柜、汽车等光滑表面上可见） |
| **Reflection** | 移除反射光照（在金属/光泽表面上可见） |
| **Emission lighting** | 移除材质的自发光 |

这些开关在调试自定义模型或场景中的视觉问题时，有助于隔离特定的光照贡献。

### 阴影

启用或禁用阴影渲染。禁用后还会移除建筑物内部的雨水遮挡（雨水会穿过屋顶）。

### 地形阴影

控制地形阴影的生成方式。

选项：`on (slice)`、`on (full)`、`no update`、`disabled`

### 渲染调试模式

在渲染可视化模式之间切换，以在游戏中检查网格几何体。

选项：`normal`、`wire`、`wire only`、`overdraw`、`overdrawZ`

不同材质以不同的线框颜色显示：

| 材质 | 颜色 (RGB) |
|------|-----------|
| TreeTrunk | 179, 126, 55 |
| TreeCrown | 143, 227, 94 |
| Grass | 41, 194, 53 |
| Basic | 208, 87, 87 |
| Normal | 204, 66, 107 |
| Super | 234, 181, 181 |
| Skin | 252, 170, 18 |
| Multi | 143, 185, 248 |
| Terrain | 255, 127, 127 |
| Water | 51, 51, 255 |
| Ocean | 51, 128, 255 |
| Sky | 143, 185, 248 |

### 遮挡器

一组遮挡剔除系统的开关：

| 选项 | 效果 |
|------|------|
| **Occluders** | 启用/禁用对象遮挡 |
| **Occlude entities** | 启用/禁用实体遮挡 |
| **Occlude proxies** | 启用/禁用代理遮挡 |
| **Show occluder volumes** | 拍摄快照并绘制可视化遮挡体积的调试形状 |
| **Show active occluders** | 用调试形状显示当前活动的遮挡器 |
| **Show occluded** | 用调试形状可视化被遮挡的对象 |

### 控件

启用或禁用所有 UI 控件的渲染。适用于截取纯净的截图或隔离渲染问题。

### 后处理

启用或禁用后处理效果（泛光、颜色校正、暗角等）。

### 地形

完全启用或禁用地形渲染。

### Materials 子菜单

切换特定材质类型的渲染。大部分不言自明。值得注意的条目：

- **Super** —— 一个涵盖所有与"super"着色器相关材质的总开关
- **Old Terrain** —— 同时涵盖 Terrain 和 Terrain Simple 材质
- **Water** —— 涵盖所有与水相关的材质（海洋、海岸、河流）

---

## Enfusion 世界（物理）

### 菜单结构

```
Enfusion World
  Show Bullet
  > Bullet
      Draw Char Ctrl
      Draw Simple Char Ctrl
      Max. Collider Distance
      Draw Bullet shape
      Draw Bullet wireframe
      Draw Bullet shape AABB
      Draw obj center of mass
      Draw Bullet contacts
      Force sleep Bullet
      Show stats
  Show bodies                      [LAlt + Numpad 6]
```

> **注意：** 这里的"Bullet"指的是 Bullet 物理引擎，而不是弹药。

### Show Bullet

开启 Bullet 物理引擎的调试可视化。

### Bullet 子菜单

| 选项 | 说明 |
|------|------|
| **Draw Char Ctrl** | 可视化玩家角色控制器。依赖于"Draw Bullet shape" |
| **Draw Simple Char Ctrl** | 可视化 AI 角色控制器。依赖于"Draw Bullet shape" |
| **Max. Collider Distance** | 可视化碰撞体的最大距离（值：0、1、2、5、10、20、50、100、200、500）。默认为 0 |
| **Draw Bullet shape** | 可视化物理碰撞体形状 |
| **Draw Bullet wireframe** | 仅以线框形式显示碰撞体。依赖于"Draw Bullet shape" |
| **Draw Bullet shape AABB** | 显示碰撞体的轴对齐包围盒 |
| **Draw obj center of mass** | 显示对象的质心 |
| **Draw Bullet contacts** | 可视化正在接触的碰撞体 |
| **Force sleep Bullet** | 强制所有物理体进入休眠状态 |
| **Show stats** | 显示调试统计信息（选项：disabled、basic、all）。禁用后统计信息仍可见 10 秒 |

> **警告：** Max. Collider Distance 默认为 0，因为此可视化开销很大。将其设置为较大的距离会导致严重的性能下降。

### Show Bodies

可视化 Bullet 物理体。选项：`disabled`、`only`、`all`

---

## DayZ 渲染

### 菜单结构

```
DayZ Render
  > Sky
      Space
      Stars
      > Planets
          Sun
          Moon
      Atmosphere
      > Clouds
          Far
          Near
          Physical
      Horizon
      > Post Process
          God Rays
  > Geometry diagnostic
      diagnostic mode
```

### Sky 子菜单

切换各个天空渲染组件：

| 选项 | 控制内容 |
|------|----------|
| **Space** | 星星背后的背景纹理 |
| **Stars** | 星星渲染 |
| **Sun** | 太阳及其光晕效果（不是 God Rays） |
| **Moon** | 月亮及其光晕效果（不是 God Rays） |
| **Atmosphere** | 天空中的大气纹理 |
| **Far (Clouds)** | 高层/远处的云。不影响光轴（密度较低） |
| **Near (Clouds)** | 低层/近处的云。密度较高，会作为光轴的遮挡 |
| **Physical (Clouds)** | 已弃用的基于对象的云。在 DayZ 1.23 中已从 Chernarus 和 Livonia 移除 |
| **Horizon** | 地平线渲染。地平线会阻挡光轴 |
| **God Rays** | 光轴后处理效果 |

### 几何体诊断

启用调试形状绘制，以可视化对象的几何体在游戏中的外观。

几何体类型：`normal`、`roadway`、`geometry`、`viewGeometry`、`fireGeometry`、`paths`、`memory`、`wreck`

绘制模式：`solid+wire`、`Zsolid+wire`、`wire`、`ZWire`、`geom only`

这对于创建自定义模型的模组制作者极其有用 —— 你可以在不离开游戏的情况下验证你的 fire geometry、view geometry 和 memory points 是否正确配置。

---

## 游戏

### 菜单结构

```
Game
  > Weather & environment
      Display
      Force fog at camera
      Override fog
        Distance density
        Height density
        Distance offset
        Height bias
  Free Camera
    FrCam Player Move              [Page Up]
    FrCam NoClip
    FrCam Freeze                   [Page Down]
  > Vehicles
      Audio
      Simulation
  > Combat
      DECombat
      DEShots
      DEHitpoints
      DEExplosions
  > Legacy/obsolete
      DEAmbient
      DELight
  DESurfaceSound
  > Central Economy
      > Loot Spawn Edit
          Spawn Volume Vis
          Setup Vis
          Edit Volume
          Re-Trace Group Points
          Spawn Candy
          Spawn Rotation Test
          Placement Test
          Export Group
          Export All Groups
          Export Map
          Export Clusters
          Export Economy [csv]
          Export Respawn Queue [csv]
      > Loot Tool
          Deplete Lifetime
          Set Damage = 1.0
          Damage + Deplete
          Invert Avoidance
          Project Target Loot
      > Infected
          Infected Vis
          Infected Zone Info
          Infected Spawn
          Reset Cleanup
      > Animal
          Animal Vis
          Animal Spawn
          Ambient Spawn
      > Building
          Building Stats
      Vehicle&Wreck Vis
      Loot Vis
      Cluster Vis
      Dynamic Events Status
      Dynamic Events Vis
      Dynamic Events Spawn
      Export Dyn Event
      Overall Stats
      Updaters State
      Idle Mode
      Force Save
```

### 天气与环境

天气系统的调试功能。

#### Display

启用天气调试可视化。这会显示雾/视距的屏幕调试信息，并打开一个包含详细天气数据的独立实时窗口。

要在作为服务器运行时启用独立窗口，请使用启动参数 `-debugweather`。

窗口设置保存在配置文件中的 `weather_client_imgui.ini` / `weather_client_imgui.bin`（服务器为 `weather_server_*`）。

#### Force Fog at Camera

强制雾高度匹配玩家摄像机高度。优先级高于 Height bias 设置。

#### Override Fog

启用手动设置覆盖雾值：

| 参数 | 范围 | 步长 |
|------|------|------|
| Distance density | 0 -- 1 | 0.01 |
| Height density | 0 -- 1 | 0.01 |
| Distance offset | 0 -- 1 | 0.01 |
| Height bias | -500 -- 500 | 5 |

### 自由摄像机

自由摄像机将视角从玩家角色分离，允许在世界中自由飞行。这是模组制作者最有用的调试工具之一。

#### 自由摄像机控制

| 按键 | 来源 | 功能 |
|------|------|------|
| **W / A / S / D** | Inputs (xml) | 前/左/后/右移动 |
| **Q** | Inputs (xml) | 向上移动 |
| **Z** | Inputs (xml) | 向下移动 |
| **鼠标** | Inputs (xml) | 环顾四周 |
| **鼠标滚轮向上** | Inputs (C++) | 加速 |
| **鼠标滚轮向下** | Inputs (C++) | 减速 |
| **空格键** | Cheat Inputs (C++) | 切换目标对象的屏幕调试信息 |
| **Ctrl / Shift** | Cheat Inputs (C++) | 当前速度 x 10 |
| **Alt** | Cheat Inputs (C++) | 当前速度 / 10 |
| **End** | Cheat Inputs (C++) | 禁用自由摄像机（返回玩家） |
| **Enter** | Cheat Inputs (C++) | 将摄像机链接到目标对象 |
| **Page Up** | Cheat Inputs (C++) | 在自由摄像机模式下切换玩家移动 |
| **Page Down** | Cheat Inputs (C++) | 冻结/解冻摄像机位置 |
| **Insert** | PluginKeyBinding (Script) | 将玩家传送到光标位置 |
| **Home** | PluginKeyBinding (Script) | 切换自由摄像机 / 禁用并传送到光标位置 |
| **Numpad /** | PluginKeyBinding (Script) | 切换自由摄像机（不传送） |

#### 自由摄像机选项

| 选项 | 说明 |
|------|------|
| **FrCam Player Move** | 在自由摄像机模式下启用/禁用玩家输入（WASD）移动玩家 |
| **FrCam NoClip** | 启用/禁用摄像机穿过地形 |
| **FrCam Freeze** | 启用/禁用输入移动摄像机 |

### 载具

载具的扩展调试功能。仅在玩家位于载具内时有效。

- **Audio** —— 打开一个独立窗口，实时调整声音设置。包含音频控制器的可视化。
- **Simulation** —— 打开一个包含汽车模拟调试的独立窗口：调整物理参数和可视化。

### 战斗

战斗、射击和命中点的调试工具：

| 选项 | 说明 |
|------|------|
| **DECombat** | 显示到汽车、AI 和玩家的距离的屏幕文本 |
| **DEShots** | 弹道调试子菜单（见下文） |
| **DEHitpoints** | 显示玩家和其正在查看的对象的 DamageSystem |
| **DEExplosions** | 显示爆炸穿透数据。数字显示减速值。红色叉号 = 被阻挡。绿色叉号 = 已穿透 |

**DEShots 子菜单：**

| 选项 | 说明 |
|------|------|
| Clear vis. | 清除任何现有的射击可视化 |
| Vis. trajectory | 追踪射击路径，显示出口点和停止点 |
| Always Deflect | 强制所有客户端发射的射击偏转 |

### Legacy/Obsolete

- **DEAmbient** —— 显示影响环境声音的变量
- **DELight** —— 显示当前光照环境的统计信息

### DESurfaceSound

显示玩家站立的地表类型和衰减类型。

### 中央经济

中央经济（CE）系统的全面调试工具集。

> **重要：** 大多数 CE 调试选项仅在启用了 CE 的单人客户端中有效。只有"Building Stats"在多人环境或 CE 关闭时有效。

> **注意：** 许多这些功能也可以通过脚本中的 `CEApi`（`CentralEconomy.c`）使用。

#### Loot Spawn Edit

创建和编辑对象上战利品生成点的工具。必须启用自由摄像机才能使用 Edit Volume 工具。

| 选项 | 说明 | 脚本等效 |
|------|------|----------|
| **Spawn Volume Vis** | 可视化战利品生成点。选项：Off、Adaptive、Volume、Occupied | `GetCEApi().LootSetSpawnVolumeVisualisation()` |
| **Setup Vis** | 在屏幕上显示带有颜色编码容器的 CE 设置属性 | `GetCEApi().LootToggleSpawnSetup()` |
| **Edit Volume** | 交互式战利品点编辑器（需要自由摄像机） | `GetCEApi().LootToggleVolumeEditing()` |
| **Re-Trace Group Points** | 重新追踪战利品点以修复悬浮问题 | `GetCEApi().LootRetraceGroupPoints()` |
| **Spawn Candy** | 在选定组的所有生成点生成战利品 | -- |
| **Spawn Rotation Test** | 在光标位置测试旋转标志 | -- |
| **Placement Test** | 用球体圆柱可视化放置 | -- |
| **Export Group** | 将选定组导出到 `storage/export/mapGroup_CLASSNAME.xml` | `GetCEApi().LootExportGroup()` |
| **Export All Groups** | 将所有组导出到 `storage/export/mapgroupproto.xml` | `GetCEApi().LootExportAllGroups()` |
| **Export Map** | 生成 `storage/export/mapgrouppos.xml` | `GetCEApi().LootExportMap()` |
| **Export Clusters** | 生成 `storage/export/mapgroupcluster.xml` | `GetCEApi().ExportClusterData()` |
| **Export Economy [csv]** | 将经济数据导出到 `storage/log/economy.csv` | `GetCEApi().EconomyLog(EconomyLogCategories.Economy)` |
| **Export Respawn Queue [csv]** | 将重生队列导出到 `storage/log/respawn_queue.csv` | `GetCEApi().EconomyLog(EconomyLogCategories.RespawnQueue)` |

**Edit Volume 按键绑定：**

| 按键 | 功能 |
|------|------|
| **[** | 向后遍历容器 |
| **]** | 向前遍历容器 |
| **鼠标左键** | 插入新点 |
| **鼠标右键** | 删除点 |
| **;** | 增大点的大小 |
| **'** | 减小点的大小 |
| **Insert** | 在点上生成战利品 |
| **M** | 生成 48 个"AmmoBox_762x54_20Rnd" |
| **Backspace** | 标记附近的战利品进行清理（消耗生命周期，不是立即生效） |

#### Loot Tool

| 选项 | 说明 | 脚本等效 |
|------|------|----------|
| **Deplete Lifetime** | 将生命周期消耗到 3 秒（计划清理） | `GetCEApi().LootDepleteLifetime()` |
| **Set Damage = 1.0** | 将生命值设为 0 | `GetCEApi().LootSetDamageToOne()` |
| **Damage + Deplete** | 执行以上两项操作 | `GetCEApi().LootDepleteAndDamage()` |
| **Invert Avoidance** | 切换玩家规避（检测附近玩家） | -- |
| **Project Target Loot** | 模拟目标物品的生成，生成图像和日志。需要启用"Loot Vis" | `GetCEApi().SpawnAnalyze()` 和 `GetCEApi().EconomyMap()` |

#### Infected

| 选项 | 说明 | 脚本等效 |
|------|------|----------|
| **Infected Vis** | 可视化僵尸区域、位置、存活/死亡状态 | `GetCEApi().InfectedToggleVisualisation()` |
| **Infected Zone Info** | 当摄像机在感染区域内时显示屏幕调试信息 | `GetCEApi().InfectedToggleZoneInfo()` |
| **Infected Spawn** | 在选定区域生成感染者（或在光标处生成"InfectedArmy"） | `GetCEApi().InfectedSpawn()` |
| **Reset Cleanup** | 将清理计时器设为 3 秒 | `GetCEApi().InfectedResetCleanup()` |

#### Animal

| 选项 | 说明 | 脚本等效 |
|------|------|----------|
| **Animal Vis** | 可视化动物区域、位置、存活/死亡状态 | `GetCEApi().AnimalToggleVisualisation()` |
| **Animal Spawn** | 在选定区域生成动物（或在光标处生成"AnimalGoat"） | `GetCEApi().AnimalSpawn()` |
| **Ambient Spawn** | 在光标目标处生成"AmbientHen" | `GetCEApi().AnimalAmbientSpawn()` |

#### Building

**Building Stats** 显示关于建筑门状态的屏幕调试信息：

- 左侧：每扇门是打开/关闭以及是否空闲/锁定
- 中间：关于 `buildings.bin`（建筑持久化）的统计信息

门的随机化使用 `initOpened` 配置值。当 `rand < initOpened` 时，门以打开状态生成（所以 `initOpened=0` 意味着门永远不会以打开状态生成）。

economy.xml 中常见的 `<building/>` 设置：

| 设置 | 行为 |
|------|------|
| `init="0" load="0" respawn="0" save="0"` | 无持久化，无随机化，重启后为默认状态 |
| `init="1" load="0" respawn="0" save="0"` | 无持久化，门由 initOpened 随机化 |
| `init="1" load="1" respawn="0" save="1"` | 仅保存锁定的门，门由 initOpened 随机化 |
| `init="0" load="1" respawn="0" save="1"` | 完全持久化，保存精确的门状态，无随机化 |

#### 其他中央经济工具

| 选项 | 说明 | 脚本等效 |
|------|------|----------|
| **Vehicle&Wreck Vis** | 可视化注册到"Vehicle"规避的对象。黄色 = 汽车，粉色 = 残骸（Building），蓝色 = InventoryItem | `GetCEApi().ToggleVehicleAndWreckVisualisation()` |
| **Loot Vis** | 显示你正在查看的任何东西（战利品、感染者、动态事件）的屏幕经济数据 | `GetCEApi().ToggleLootVisualisation()` |
| **Cluster Vis** | 屏幕上的轨迹 DE 统计信息 | `GetCEApi().ToggleClusterVisualisation()` |
| **Dynamic Events Status** | 屏幕上的 DE 统计信息 | `GetCEApi().ToggleDynamicEventStatus()` |
| **Dynamic Events Vis** | 可视化和编辑 DE 生成点 | `GetCEApi().ToggleDynamicEventVisualisation()` |
| **Dynamic Events Spawn** | 在最近的点生成动态事件，或以"StaticChristmasTree"作为后备 | `GetCEApi().DynamicEventSpawn()` |
| **Export Dyn Event** | 将 DE 点导出到 `storage/export/eventSpawn_CLASSNAME.xml` | `GetCEApi().DynamicEventExport()` |
| **Overall Stats** | 屏幕上的 CE 统计信息 | `GetCEApi().ToggleOverallStats()` |
| **Updaters State** | 显示 CE 当前正在处理什么 | -- |
| **Idle Mode** | 使 CE 进入休眠状态（停止处理） | -- |
| **Force Save** | 强制保存整个 `storage/data` 文件夹（不包括玩家数据库） | -- |

**Dynamic Events Vis 按键绑定：**

| 按键 | 功能 |
|------|------|
| **[** | 向后遍历可用的 DE |
| **]** | 向前遍历可用的 DE |
| **鼠标左键** | 为选定的 DE 插入新点 |
| **鼠标右键** | 删除最近光标的点 |
| **鼠标中键** | 按住或点击以旋转角度 |

---

## AI

### 菜单结构

```
AI
  Show NavMesh
  Debug Pathgraph World
  Debug Path Agent
  Debug AI Agent
```

> **重要：** AI 调试目前在多人环境中不可用。

### Show NavMesh

绘制调试形状以可视化导航网格。显示带有统计信息的屏幕调试信息。

| 按键 | 功能 |
|------|------|
| **Numpad 0** | 在摄像机位置注册"Test start" |
| **Numpad 1** | 在摄像机位置重新生成瓦片 |
| **Numpad 2** | 在摄像机位置周围重新生成瓦片 |
| **Numpad 3** | 向前遍历可视化类型 |
| **LAlt + Numpad 3** | 向后遍历可视化类型 |
| **Numpad 4** | 在摄像机位置注册"Test end"。绘制起点和终点之间的球体和线条。绿色 = 找到路径，红色 = 无路径 |
| **Numpad 5** | NavMesh 最近位置测试（SamplePosition）。蓝色球体 = 查询，粉色球体 = 结果 |
| **Numpad 6** | NavMesh 射线投射测试。蓝色球体 = 查询，粉色球体 = 结果 |

### Debug Pathgraph World

显示已完成多少路径作业请求以及当前有多少待处理的屏幕调试信息。

### Debug Path Agent

AI 寻路的屏幕调试信息和调试形状。瞄准一个 AI 实体来选择它进行跟踪。当你特别关注 AI 如何找到路径时使用此功能。

### Debug AI Agent

AI 警觉度和行为的屏幕调试信息和调试形状。瞄准一个 AI 实体来选择它进行跟踪。当你想了解 AI 的决策制定和感知状态时使用此功能。

---

## 声音

### 菜单结构

```
Sounds
  Show playing samples
  Show system info
```

### Show Playing Samples

当前播放声音的调试可视化。

| 选项 | 说明 |
|------|------|
| **none** | 默认，无调试 |
| **ImGui** | 独立窗口（最新版本）。支持过滤，完整的类别覆盖。设置保存为配置文件中的 `playing_sounds_imgui.ini` / `.bin` |
| **DbgUI** | 旧版。有类别过滤，更易读，但会超出屏幕且缺少载具类别 |
| **Engine** | 旧版。显示带有统计信息的实时颜色编码数据，但会超出屏幕且没有颜色图例 |

### Show System Info

声音系统的屏幕调试统计信息（缓冲区计数、活动源等）。

---

## 模组制作者常用功能

虽然每个选项都有用处，但以下是模组制作者最常使用的功能：

### 性能分析

1. **FPS 计数器**（LCtrl + Numpad 1）—— 快速检查你的 mod 是否在拖垮帧率
2. **脚本性能分析器** —— 找出你的哪些类或函数消耗了最多的 CPU 时间。将模块设置为 WORLD 或 MISSION 以聚焦于你的 mod 脚本层

### 视觉调试

1. **自由摄像机** —— 飞行查看生成的对象、验证位置、从远处检查 AI 行为
2. **几何体诊断** —— 在不离开游戏的情况下验证你的自定义模型的 fire geometry、view geometry、roadway LOD 和 memory points
3. **渲染调试模式**（RCtrl + RAlt + W）—— 查看线框覆盖以检查网格密度和材质分配

### 游戏测试

1. **自由摄像机 + Insert** —— 将玩家即时传送到地图上的任何位置
2. **天气覆盖** —— 强制特定的雾条件以测试依赖能见度的功能
3. **中央经济工具** —— 按需生成感染者、动物、战利品和动态事件
4. **战斗调试** —— 追踪射击轨迹、检查命中点伤害系统、测试爆炸穿透

### AI 开发

1. **Show NavMesh** —— 验证 AI 是否真的能导航到你期望的位置
2. **Debug AI Agent** —— 查看感染者或动物在想什么、处于什么警觉级别
3. **Debug Path Agent** —— 查看 AI 正在走的实际路径以及寻路是否成功

---

## 何时使用诊断菜单

### 开发期间

- 优化每帧代码（OnUpdate、EOnFrame）时使用**脚本性能分析器**
- 用**自由摄像机**定位对象、验证生成位置、检查模型放置
- 导入新模型后立即使用**几何体诊断**验证 LOD 和几何体类型
- 添加新功能前后用 **FPS 计数器**作为基准

### 测试期间

- 用**战斗调试**验证武器伤害、弹道行为、爆炸效果
- 用 **CE 工具**测试战利品分布、生成点、动态事件
- 用 **AI 调试**验证感染者/动物行为是否正确响应玩家存在
- 用**天气调试**在不同天气条件下测试你的 mod

### Bug 排查期间

- 玩家报告性能问题时使用 **FPS 计数器 + 脚本性能分析器**
- 用**自由摄像机 + 空格键**（对象调试）检查行为异常的对象
- 用**渲染调试模式**诊断视觉伪影或材质问题
- 用 **Show Bullet** 调试物理碰撞问题

---

## 常见错误

**使用零售版可执行文件。** 诊断菜单仅在 `DayZDiag_x64.exe` 中可用。如果你按 Win+Alt 没有反应，说明你运行的是零售版。

**忘记 Max. Collider Distance 为 0。** 物理可视化（Draw Bullet shape）如果 Max. Collider Distance 仍为默认值 0，将不会显示任何内容。将其设置为至少 10-20 以查看周围的碰撞体。

**多人模式下的 CE 工具。** 大多数中央经济调试选项仅在启用了 CE 的单人模式下有效。不要期望它们在专用服务器上工作。

**多人模式下的 AI 调试。** AI 调试目前在多人环境中不可用。在单人模式下测试 AI 行为。

**将"Bullet"与弹药混淆。** "Enfusion World"类别的"Bullet"选项指的是 Bullet 物理引擎，而不是武器弹药。与战斗相关的调试在 Game > Combat 下。

**忘记关闭分析器。** 脚本性能分析器有明显的开销。完成分析后请关闭它，以获得准确的 FPS 读数。

**碰撞体距离值过大。** 将 Max. Collider Distance 设为 200 或 500 会严重拖垮帧率。使用覆盖你感兴趣区域的最小值。

**未启用前置条件。** 几个选项依赖于其他选项先被启用：
- "Draw Char Ctrl"和"Draw Bullet wireframe"依赖于"Draw Bullet shape"
- "Edit Volume"需要自由摄像机
- "Project Target Loot"需要启用"Loot Vis"

---

## 下一步

- **第 8.6 章：[调试与测试](06-debugging-testing.md)** —— 脚本日志、Print 调试、文件补丁和 Workbench
- **第 8.7 章：[发布到创意工坊](07-publishing-workshop.md)** —— 打包并发布你测试过的 mod
