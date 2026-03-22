# 第 8.11 章：创建自定义服装

[首页](../README.md) | [<< 上一章：创建自定义载具](10-vehicle-mod.md) | **创建自定义服装** | [下一章：构建交易系统 >>](12-trading-system.md)

---

> **摘要：** 本教程将引导你为 DayZ 创建一款自定义战术夹克。你将选择一个基类，在 config.cpp 中定义服装的保暖和储物属性，使用隐藏选区重新贴图为迷彩样式，添加本地化和刷新配置，并可选地通过脚本扩展行为。完成后，你将拥有一件可穿戴的夹克，能为玩家保暖、存放物品并在世界中刷新。

---

## 目录

- [我们要构建什么](#what-we-are-building)
- [步骤 1：选择基类](#step-1-choose-a-base-class)
- [步骤 2：服装的 config.cpp](#step-2-configcpp-for-clothing)
- [步骤 3：创建贴图](#step-3-create-textures)
- [步骤 4：添加储物空间](#step-4-add-cargo-space)
- [步骤 5：本地化和刷新](#step-5-localization-and-spawning)
- [步骤 6：脚本行为（可选）](#step-6-script-behavior-optional)
- [步骤 7：构建、测试、完善](#step-7-build-test-polish)
- [完整代码参考](#complete-code-reference)
- [常见错误](#common-mistakes)
- [最佳实践](#best-practices)
- [理论与实践](#theory-vs-practice)
- [学到了什么](#what-you-learned)

---

## 我们要构建什么

我们将创建一件**战术迷彩夹克** —— 一件带有林地迷彩的军用风格夹克，玩家可以在游戏中找到并穿戴。它将：

- 继承原版 Gorka 夹克模型（无需 3D 建模）
- 使用隐藏选区进行自定义迷彩贴图
- 通过 `heatIsolation` 值提供保暖
- 口袋可存放物品（储物空间）
- 受损时出现视觉退化效果
- 在世界的军事地点刷新

**前置条件：** 一个可用的 mod 结构（先完成[第 8.1 章](01-first-mod.md)和[第 8.2 章](02-custom-item.md)），一个文本编辑器，已安装 DayZ Tools（用于 TexView2），以及一个图像编辑器来创建迷彩贴图。

---

## 步骤 1：选择基类

DayZ 中的服装继承自 `Clothing_Base`，但你几乎不会直接继承它。DayZ 为每个身体部位提供了中间基类：

| 基类 | 身体部位 | 示例 |
|------------|-----------|----------|
| `Top_Base` | 躯干 | 夹克、衬衫、连帽衫 |
| `Pants_Base` | 腿部 | 牛仔裤、工装裤 |
| `Shoes_Base` | 脚部 | 靴子、运动鞋 |
| `HeadGear_Base` | 头部 | 头盔、帽子 |
| `Mask_Base` | 面部 | 防毒面具、巴拉克拉瓦头套 |
| `Gloves_Base` | 手部 | 战术手套 |
| `Vest_Base` | 背心栏位 | 板甲载体、胸挂 |
| `Glasses_Base` | 眼部 | 太阳镜 |
| `Backpack_Base` | 背部 | 背包、提包 |

完整的继承链为：`Clothing_Base -> Clothing -> Top_Base -> GorkaEJacket_ColorBase -> YourJacket`

### 为什么要继承现有的原版物品

你可以在不同层级继承：

1. **继承特定物品**（如 `GorkaEJacket_ColorBase`）—— 最简单。你继承模型、动画、栏位和所有属性，只需更改贴图和调整数值。这也是 Bohemia 的 `Test_ClothingRetexture` 示例所做的。
2. **继承栏位基类**（如 `Top_Base`）—— 起点干净，但必须指定模型和所有属性。
3. **直接继承 `Clothing`** —— 仅用于完全自定义的栏位行为，很少需要。

对于我们的战术夹克，我们将继承 `GorkaEJacket_ColorBase`。查看原版脚本：

```c
class GorkaEJacket_ColorBase extends Top_Base
{
    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
class GorkaEJacket_Summer extends GorkaEJacket_ColorBase {};
class GorkaEJacket_Flat extends GorkaEJacket_ColorBase {};
```

注意这个模式：`_ColorBase` 类处理共享行为，各颜色变体继承它且不添加额外代码。它们的 config.cpp 条目提供不同的贴图。我们将遵循相同的模式。

要查找基类，请查看 `scripts/4_world/entities/itembase/clothing_base.c`（定义所有栏位基类）和 `scripts/4_world/entities/itembase/clothing/`（每个服装系列一个文件）。

---

## 步骤 2：服装的 config.cpp

创建 `MyClothingMod/Data/config.cpp`：

```cpp
class CfgPatches
{
    class MyClothingMod_Data
    {
        units[] = { "MCM_TacticalJacket_Woodland" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Characters_Tops" };
    };
};

class CfgVehicles
{
    class GorkaEJacket_ColorBase;

    class MCM_TacticalJacket_ColorBase : GorkaEJacket_ColorBase
    {
        scope = 0;
        displayName = "";
        descriptionShort = "";

        weight = 1800;
        itemSize[] = { 3, 4 };
        absorbency = 0.3;
        heatIsolation = 0.8;
        visibilityModifier = 0.7;

        repairableWithKits[] = { 5, 2 };
        repairCosts[] = { 30.0, 25.0 };

        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 200;
                    healthLevels[] =
                    {
                        { 1.0,  { "DZ\characters\tops\Data\GorkaUpper.rvmat" } },
                        { 0.70, { "DZ\characters\tops\Data\GorkaUpper.rvmat" } },
                        { 0.50, { "DZ\characters\tops\Data\GorkaUpper_damage.rvmat" } },
                        { 0.30, { "DZ\characters\tops\Data\GorkaUpper_damage.rvmat" } },
                        { 0.01, { "DZ\characters\tops\Data\GorkaUpper_destruct.rvmat" } }
                    };
                };
            };
            class GlobalArmor
            {
                class Melee
                {
                    class Health    { damage = 0.8; };
                    class Blood     { damage = 0.8; };
                    class Shock     { damage = 0.8; };
                };
                class Infected
                {
                    class Health    { damage = 0.8; };
                    class Blood     { damage = 0.8; };
                    class Shock     { damage = 0.8; };
                };
            };
        };

        class EnvironmentWetnessIncrements
        {
            class Soaking
            {
                rain = 0.015;
                water = 0.1;
            };
            class Drying
            {
                playerHeat = -0.08;
                fireBarrel = -0.25;
                wringing = -0.15;
            };
        };
    };

    class MCM_TacticalJacket_Woodland : MCM_TacticalJacket_ColorBase
    {
        scope = 2;
        displayName = "$STR_MCM_TacticalJacket_Woodland";
        descriptionShort = "$STR_MCM_TacticalJacket_Woodland_Desc";
        hiddenSelectionsTextures[] =
        {
            "MyClothingMod\Data\Textures\tactical_jacket_g_woodland_co.paa",
            "MyClothingMod\Data\Textures\tactical_jacket_woodland_co.paa",
            "MyClothingMod\Data\Textures\tactical_jacket_woodland_co.paa"
        };
    };
};
```

### 服装特有字段详解

**保暖与隐蔽：**

| 字段 | 值 | 说明 |
|-------|-------|-------------|
| `heatIsolation` | `0.8` | 提供的保暖值（0.0-1.0 范围）。引擎将此值与耐久度和潮湿度因子相乘。一件崭新干燥的夹克提供完整保暖；破损湿透的几乎不提供任何保暖。 |
| `visibilityModifier` | `0.7` | 玩家对 AI 的可见度（越低 = 越难被发现）。 |
| `absorbency` | `0.3` | 吸水性（0 = 防水，1 = 海绵）。越低抗雨性越好。 |

**原版 heatIsolation 参考值：** T 恤 0.2，连帽衫 0.5，Gorka 夹克 0.7，野战夹克 0.8，羊毛大衣 0.9。

**修复：** `repairableWithKits[] = { 5, 2 }` 列出工具包类型（5=缝纫包，2=皮革缝纫包）。`repairCosts[]` 给出每次修复消耗的材料，按对应顺序。

**护甲：** `damage` 值为 0.8 表示玩家承受 80% 的传入伤害（吸收了 20%）。值越低 = 防护越强。

**潮湿度：** `Soaking` 控制雨水/水浸泡物品的速度。`Drying` 的负值表示通过体温、火桶和拧干散失水分。

**隐藏选区：** Gorka 模型有 3 个选区 —— 索引 0 是地面模型，索引 1 和 2 是穿着模型。你用自定义 PAA 路径覆盖 `hiddenSelectionsTextures[]`。

**耐久等级：** 每个条目格式为 `{ 耐久阈值, { 材质路径 } }`。当耐久度降到阈值以下时，引擎会切换材质。原版伤损 rvmat 会添加磨损痕迹和撕裂效果。

---

## 步骤 3：创建贴图

### 查找和创建贴图

Gorka 夹克的贴图位于 `DZ\characters\tops\data\` —— 从 P: 盘提取 `gorka_upper_summer_co.paa`（颜色）、`gorka_upper_nohq.paa`（法线）和 `gorka_upper_smdi.paa`（高光）作为模板。

**创建迷彩图案：**

1. 在 TexView2 中打开原版 `_co` 贴图，导出为 TGA/PNG
2. 按照 UV 布局在图像编辑器中绘制林地迷彩
3. 保持相同尺寸（通常为 2048x2048 或 1024x1024）
4. 保存为 TGA，使用 TexView2 转换为 PAA（文件 > 另存为 > .paa）

### 贴图类型

| 后缀 | 用途 | 是否必需？ |
|--------|---------|-----------|
| `_co` | 主色彩/图案 | 是 |
| `_nohq` | 法线贴图（织物细节） | 否 —— 使用原版默认 |
| `_smdi` | 高光贴图（光泽度） | 否 —— 使用原版默认 |
| `_as` | Alpha/表面遮罩 | 否 |

对于贴图替换，你只需要 `_co` 贴图。原版模型的法线和高光贴图会继续生效。

要完全控制材质，请创建 `.rvmat` 文件并在 `hiddenSelectionsMaterials[]` 中引用。参见 Bohemia 的 `Test_ClothingRetexture` 示例，其中有可用的 rvmat 示例，包含伤损和毁坏变体。

---

## 步骤 4：添加储物空间

继承 `GorkaEJacket_ColorBase` 时，你会自动继承其储物网格（4x3）和物品栏栏位（`"Body"`）。`itemSize[] = { 3, 4 }` 属性定义的是夹克作为掉落物时的大小 —— 而**不是**其储物容量。

常见服装栏位：`"Body"`（夹克）、`"Legs"`（裤子）、`"Feet"`（靴子）、`"Headgear"`（帽子）、`"Vest"`（胸挂）、`"Gloves"`、`"Mask"`、`"Back"`（背包）。

某些服装可接受附件（如板甲载体的附袋）。通过 `attachments[] = { "Shoulder", "Armband" };` 添加。对于基本夹克，继承的储物空间已经足够。

---

## 步骤 5：本地化和刷新

### 字符串表

创建 `MyClothingMod/Data/Stringtable.csv`：

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MCM_TacticalJacket_Woodland","Tactical Jacket (Woodland)","","","","","","","","","","","","",""
"STR_MCM_TacticalJacket_Woodland_Desc","A rugged tactical jacket with woodland camouflage. Provides good insulation and has multiple pockets.","","","","","","","","","","","","",""
```

### 刷新（types.xml）

添加到你的服务器任务文件夹 `types.xml`：

```xml
<type name="MCM_TacticalJacket_Woodland">
    <nominal>8</nominal>
    <lifetime>14400</lifetime>
    <restock>3600</restock>
    <min>3</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="clothes" />
    <usage name="Military" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

所有服装使用 `category name="clothes"`。将 `usage` 设置为物品应刷新的位置（Military、Town、Police 等），`value` 设置为地图层级（Tier1=沿海 到 Tier4=深内陆）。

---

## 步骤 6：脚本行为（可选）

对于简单的贴图替换，你不需要脚本。但如果要在穿戴夹克时添加行为，需要创建一个脚本类。

### 脚本 config.cpp

```cpp
class CfgPatches
{
    class MyClothingMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Characters_Tops" };
    };
};

class CfgMods
{
    class MyClothingMod
    {
        dir = "MyClothingMod";
        name = "My Clothing Mod";
        author = "YourName";
        type = "mod";
        dependencies[] = { "World" };
        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyClothingMod/Scripts/4_World" };
            };
        };
    };
};
```

### 自定义夹克脚本

创建 `Scripts/4_World/MyClothingMod/MCM_TacticalJacket.c`：

```c
class MCM_TacticalJacket_ColorBase extends GorkaEJacket_ColorBase
{
    override void OnWasAttached(EntityAI parent, int slot_id)
    {
        super.OnWasAttached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Player equipped Tactical Jacket");
        }
    }

    override void OnWasDetached(EntityAI parent, int slot_id)
    {
        super.OnWasDetached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Player removed Tactical Jacket");
        }
    }

    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
```

### 关键服装事件

| 事件 | 触发时机 | 常见用途 |
|-------|---------------|------------|
| `OnWasAttached(parent, slot_id)` | 玩家装备该物品 | 应用增益效果、显示特效 |
| `OnWasDetached(parent, slot_id)` | 玩家卸下该物品 | 移除增益效果、清理资源 |
| `EEItemAttached(item, slot_name)` | 物品附着到此服装 | 显示/隐藏模型选区 |
| `EEItemDetached(item, slot_name)` | 物品从此服装脱离 | 恢复视觉变化 |
| `EEHealthLevelChanged(old, new, zone)` | 耐久度越过阈值 | 更新视觉状态 |

**重要：** 在每个重写方法开头始终调用 `super`。父类处理关键的引擎行为。

---

## 步骤 7：构建、测试、完善

### 构建和生成

将 `Data/` 和 `Scripts/` 分别打包为 PBO。启动加载了你 mod 的 DayZ 并生成夹克：

```c
GetGame().GetPlayer().GetInventory().CreateInInventory("MCM_TacticalJacket_Woodland");
```

### 验证清单

1. **是否出现在物品栏中？** 如果没有，检查 `scope=2` 和类名是否匹配。
2. **贴图是否正确？** 显示默认 Gorka 贴图 = 路径错误。白色/粉色 = 贴图文件缺失。
3. **能否装备？** 应放入 Body 栏位。如果不能，检查父类继承链。
4. **显示名称是否正确？** 如果看到原始 `$STR_` 文本，说明字符串表未加载。
5. **是否提供保暖？** 在调试/检查菜单中检查 `heatIsolation`。
6. **受损后视觉是否退化？** 使用以下命令测试：`ItemBase.Cast(GetGame().GetPlayer().GetItemOnSlot("Body")).SetHealth("", "", 40);`

### 添加颜色变体

遵循 `_ColorBase` 模式 —— 添加仅在贴图上不同的同级类：

```cpp
class MCM_TacticalJacket_Desert : MCM_TacticalJacket_ColorBase
{
    scope = 2;
    displayName = "$STR_MCM_TacticalJacket_Desert";
    descriptionShort = "$STR_MCM_TacticalJacket_Desert_Desc";
    hiddenSelectionsTextures[] =
    {
        "MyClothingMod\Data\Textures\tactical_jacket_g_desert_co.paa",
        "MyClothingMod\Data\Textures\tactical_jacket_desert_co.paa",
        "MyClothingMod\Data\Textures\tactical_jacket_desert_co.paa"
    };
};
```

每个变体需要自己的 `scope=2`、显示名称、贴图、字符串表条目和 types.xml 条目。

---

## 完整代码参考

### 目录结构

```
MyClothingMod/
    mod.cpp
    Data/
        config.cpp              <-- 物品定义（见步骤 2）
        Stringtable.csv         <-- 显示名称（见步骤 5）
        Textures/
            tactical_jacket_woodland_co.paa
            tactical_jacket_g_woodland_co.paa
    Scripts/                    <-- 仅在需要脚本行为时使用
        config.cpp              <-- CfgMods 条目（见步骤 6）
        4_World/
            MyClothingMod/
                MCM_TacticalJacket.c
```

### mod.cpp

```cpp
name = "My Clothing Mod";
author = "YourName";
version = "1.0";
overview = "Adds a tactical jacket with camo variants to DayZ.";
```

所有其他文件均已在上述各步骤中完整展示。

---

## 常见错误

| 错误 | 后果 | 修复方法 |
|---------|-------------|-----|
| 忘记在变体上设置 `scope=2` | 物品不会刷新或出现在管理工具中 | 基类设为 `scope=0`，每个可刷新变体设为 `scope=2` |
| 贴图数组数量错误 | 部分区域显示白色/粉色贴图 | 使 `hiddenSelectionsTextures` 数量与模型的隐藏选区数匹配（Gorka 有 3 个） |
| 贴图路径使用正斜杠 | 贴图静默加载失败 | 使用反斜杠：`"MyMod\Data\tex.paa"` |
| 缺少 `requiredAddons` | 配置解析器无法解析父类 | 上衣需要包含 `"DZ_Characters_Tops"` |
| `heatIsolation` 超过 1.0 | 玩家在温暖天气中过热 | 保持值在 0.0-1.0 范围内 |
| `healthLevels` 材质为空 | 无视觉伤损退化效果 | 始终至少引用原版 rvmat |
| 重写方法中跳过 `super` | 物品栏、伤害或附件行为异常 | 始终首先调用 `super.MethodName()` |

---

## 最佳实践

- **从简单的贴图替换开始。** 在添加自定义属性或脚本之前，先让一个带贴图替换的 mod 正常工作。这可以将配置问题与贴图问题隔离开。
- **使用 _ColorBase 模式。** 共享属性放在 `scope=0` 的基类中，仅贴图和名称放在 `scope=2` 的变体中。避免重复。
- **保持保暖值的真实性。** 参考具有类似现实对应物的原版物品。
- **在配置 types.xml 之前先用脚本控制台测试。** 确认物品可用后再调试刷新表。
- **所有面向玩家的文本使用 `$STR_` 引用。** 无需修改配置即可支持未来的本地化。
- **将 Data 和 Scripts 打包为单独的 PBO。** 更新贴图无需重新构建脚本。
- **提供地面贴图。** `_g_` 贴图使掉落物品看起来更正确。

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| `heatIsolation` | 一个简单的保暖数值 | 实际保暖效果取决于耐久度和潮湿度。引擎通过 `MiscGameplayFunctions.GetCurrentItemHeatIsolation()` 中的因子与之相乘。 |
| 护甲 `damage` 值 | 越低 = 防护越强 | 0.8 表示玩家承受 80% 的伤害（仅吸收了 20%）。许多模组制作者将 0.9 理解为"90% 防护"，但实际上只有 10%。 |
| `scope` 继承 | 子类继承父类的 scope | 实际上**不会**。每个类必须显式设置 `scope`。父类 `scope=0` 会使所有子类默认为 `scope=0`。 |
| `absorbency` | 控制防雨能力 | 它控制的是吸水性，这会**降低**保暖效果。防水 = 低吸水性（0.1）。高吸水性（0.8+）= 像海绵一样吸水。 |
| 隐藏选区 | 适用于任何模型 | 并非所有模型都公开相同的选区。在选择基础模型之前，请使用 Object Builder 或原版配置进行检查。 |

---

## 学到了什么

在本教程中你学到了：

- DayZ 服装如何从特定栏位的基类继承（`Top_Base`、`Pants_Base` 等）
- 如何在 config.cpp 中定义具有保暖、护甲和潮湿属性的服装物品
- 隐藏选区如何允许使用自定义迷彩图案为原版模型重新贴图
- `heatIsolation`、`visibilityModifier` 和 `absorbency` 如何影响游戏
- `DamageSystem` 如何控制视觉退化和护甲防护
- 如何使用 `_ColorBase` 模式创建颜色变体
- 如何通过 `types.xml` 添加刷新条目和通过 `Stringtable.csv` 添加显示名称
- 如何可选地通过 `OnWasAttached` 和 `OnWasDetached` 事件添加脚本行为

**下一步：** 运用相同的技术创建裤子（`Pants_Base`）、靴子（`Shoes_Base`）或背心（`Vest_Base`）。配置结构完全相同 —— 只有父类和物品栏栏位不同。

---

**上一章：** [第 8.8 章：HUD 覆盖层](08-hud-overlay.md)
**下一章：** 即将推出
