# 第 5.5 章：服务器配置文件

[首页](../../README.md) | [<< 上一章：ImageSet 格式](04-imagesets.md) | **服务器配置文件** | [下一章：出生装备配置 >>](06-spawning-gear.md)

---

> **摘要：** DayZ 服务器通过任务文件夹（例如 `mpmissions/dayzOffline.chernarusplus/`）中的 XML、JSON 和脚本文件进行配置。这些文件控制物品生成、经济行为、游戏规则和服务器身份标识。理解它们对于向战利品经济中添加自定义物品、调整服务器参数或构建自定义任务至关重要。

---

## 目录

- [概述](#概述)
- [init.c --- 任务入口点](#initc--任务入口点)
- [types.xml --- 物品生成定义](#typesxml--物品生成定义)
- [cfgspawnabletypes.xml --- 附件和货物](#cfgspawnabletypesxml--附件和货物)
- [cfgrandompresets.xml --- 可复用战利品池](#cfgrandompresetsxml--可复用战利品池)
- [globals.xml --- 经济参数](#globalsxml--经济参数)
- [cfggameplay.json --- 游戏设置](#cfggameplayjson--游戏设置)
- [serverDZ.cfg --- 服务器设置](#serverdzcfg--服务器设置)
- [Mod 如何与经济系统交互](#mod-如何与经济系统交互)
- [常见错误](#常见错误)

---

## 概述

每个 DayZ 服务器都从**任务文件夹**加载其配置。中央经济系统（CE）文件定义哪些物品在哪里生成、持续多长时间。服务器可执行文件本身通过 `serverDZ.cfg` 配置，该文件位于可执行文件旁边。

| 文件 | 用途 |
|------|------|
| `init.c` | 任务入口点 --- Hive 初始化、日期/时间、出生装备 |
| `db/types.xml` | 物品生成定义：数量、生存时间、位置 |
| `cfgspawnabletypes.xml` | 生成实体上预附加的物品和货物 |
| `cfgrandompresets.xml` | cfgspawnabletypes 使用的可复用物品池 |
| `db/globals.xml` | 全局经济参数：最大计数、清理计时器 |
| `cfggameplay.json` | 游戏调整：体力、基地建造、UI |
| `cfgeconomycore.xml` | 根类注册和 CE 日志 |
| `cfglimitsdefinition.xml` | 有效的类别、用途和值标签定义 |
| `serverDZ.cfg` | 服务器名称、密码、最大玩家数、Mod 加载 |

---

## init.c --- 任务入口点

`init.c` 脚本是服务器执行的第一个东西。它初始化中央经济系统并创建任务实例。

```c
void main()
{
    Hive ce = CreateHive();
    if (ce)
        ce.InitOffline();

    GetGame().GetWorld().SetDate(2024, 9, 15, 12, 0);
    CreateCustomMission("dayzOffline.chernarusplus");
}

class CustomMission: MissionServer
{
    override PlayerBase CreateCharacter(PlayerIdentity identity, vector pos,
                                        ParamsReadContext ctx, string characterName)
    {
        Entity playerEnt;
        playerEnt = GetGame().CreatePlayer(identity, characterName, pos, 0, "NONE");
        Class.CastTo(m_player, playerEnt);
        GetGame().SelectPlayer(identity, m_player);
        return m_player;
    }

    override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
    {
        EntityAI itemClothing = player.FindAttachmentBySlotName("Body");
        if (itemClothing)
        {
            itemClothing.GetInventory().CreateInInventory("BandageDressing");
        }
    }
}

Mission CreateCustomMission(string path)
{
    return new CustomMission();
}
```

`Hive` 管理 CE 数据库。没有 `CreateHive()`，物品不会生成且持久化被禁用。`CreateCharacter` 在出生时创建玩家实体，`StartingEquipSetup` 定义新角色获得的物品。其他有用的 `MissionServer` 重写包括 `OnInit()`、`OnUpdate()`、`InvokeOnConnect()` 和 `InvokeOnDisconnect()`。

---

## types.xml --- 物品生成定义

位于 `db/types.xml`，此文件是 CE 的核心。每个可以生成的物品都必须在这里有条目。

### 完整条目

```xml
<type name="AK74">
    <nominal>6</nominal>
    <lifetime>28800</lifetime>
    <restock>0</restock>
    <min>4</min>
    <quantmin>30</quantmin>
    <quantmax>80</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1"
           count_in_player="0" crafted="0" deloot="0"/>
    <category name="weapons"/>
    <usage name="Military"/>
    <value name="Tier3"/>
    <value name="Tier4"/>
</type>
```

### 字段参考

| 字段 | 说明 |
|------|------|
| `nominal` | 地图上的目标数量。CE 生成物品直到达到此值 |
| `min` | CE 触发补货前的最小数量 |
| `lifetime` | 物品在地面上消失前的持续秒数 |
| `restock` | 补货尝试之间的最小秒数（0 = 立即） |
| `quantmin/quantmax` | 具有数量的物品的填充百分比（弹匣、瓶子）。没有数量的物品使用 `-1` |
| `cost` | CE 优先级权重（越高 = 越优先）。大多数物品使用 `100` |

### 标志

| 标志 | 用途 |
|------|------|
| `count_in_cargo` | 将容器内的物品计入 nominal |
| `count_in_hoarder` | 将藏匿处/帐篷/桶中的物品计入 nominal |
| `count_in_map` | 将地面上的物品计入 nominal |
| `count_in_player` | 将玩家物品栏中的物品计入 nominal |
| `crafted` | 物品仅可制作，不自然生成 |
| `deloot` | 动态事件战利品（直升机坠毁等） |

### 类别、用途和值标签

这些标签控制物品**在哪里**生成：

- **`category`** --- 物品类型。原版：`tools`、`containers`、`clothes`、`food`、`weapons`、`books`、`explosives`、`lootdispatch`。
- **`usage`** --- 建筑类型。原版：`Military`、`Police`、`Medic`、`Firefighter`、`Industrial`、`Farm`、`Coast`、`Town`、`Village`、`Hunting`、`Office`、`School`、`Prison`、`ContaminatedArea`、`Historical`。
- **`value`** --- 地图层级区域。原版：`Tier1`（海岸）、`Tier2`（内陆）、`Tier3`（军事）、`Tier4`（深层军事）、`Unique`。

可以组合多个标签。没有 `usage` 标签 = 物品不会生成。没有 `value` 标签 = 在所有层级生成。

### 禁用物品

设置 `nominal=0` 和 `min=0`。物品永不生成但仍可通过脚本或制作存在。

---

## cfgspawnabletypes.xml --- 附件和货物

控制什么物品**已经附着在其他物品上或在其内部**生成。

### 储物标记

存储容器被标记以便 CE 知道它们持有玩家物品：

```xml
<type name="SeaChest">
    <hoarder />
</type>
```

### 生成损伤

```xml
<type name="NVGoggles">
    <damage min="0.0" max="0.32" />
</type>
```

值范围从 `0.0`（崭新）到 `1.0`（损毁）。

### 附件

```xml
<type name="PlateCarrierVest_Camo">
    <damage min="0.1" max="0.6" />
    <attachments chance="0.85">
        <item name="PlateCarrierHolster_Camo" chance="1.00" />
    </attachments>
    <attachments chance="0.85">
        <item name="PlateCarrierPouches_Camo" chance="1.00" />
    </attachments>
</type>
```

外层 `chance` 决定是否评估附件组。内层 `chance` 在一个组中列出多个物品时选择特定物品。

### 货物预设

```xml
<type name="AssaultBag_Ttsko">
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
</type>
```

每行独立掷骰预设——三行意味着三次独立的机会。

---

## cfgrandompresets.xml --- 可复用战利品池

定义 `cfgspawnabletypes.xml` 引用的命名物品池：

```xml
<randompresets>
    <cargo chance="0.16" name="foodVillage">
        <item name="SodaCan_Cola" chance="0.02" />
        <item name="TunaCan" chance="0.05" />
        <item name="PeachesCan" chance="0.05" />
        <item name="BakedBeansCan" chance="0.05" />
        <item name="Crackers" chance="0.05" />
    </cargo>

    <cargo chance="0.15" name="toolsHermit">
        <item name="WeaponCleaningKit" chance="0.10" />
        <item name="Matchbox" chance="0.15" />
        <item name="Hatchet" chance="0.07" />
    </cargo>
</randompresets>
```

预设的 `chance` 是任何东西生成的总体概率。如果掷骰成功，根据各物品的 chance 从池中选择一个物品。要添加 Mod 物品，创建一个新的 `cargo` 块并在 `cfgspawnabletypes.xml` 中引用它。

---

## globals.xml --- 经济参数

位于 `db/globals.xml`，此文件设置全局 CE 参数：

```xml
<variables>
    <var name="AnimalMaxCount" type="0" value="200"/>
    <var name="ZombieMaxCount" type="0" value="1000"/>
    <var name="CleanupLifetimeDeadPlayer" type="0" value="3600"/>
    <var name="CleanupLifetimeDeadAnimal" type="0" value="1200"/>
    <var name="CleanupLifetimeDeadInfected" type="0" value="330"/>
    <var name="CleanupLifetimeRuined" type="0" value="330"/>
    <var name="FlagRefreshFrequency" type="0" value="432000"/>
    <var name="FlagRefreshMaxDuration" type="0" value="3456000"/>
    <var name="FoodDecay" type="0" value="1"/>
    <var name="InitialSpawn" type="0" value="100"/>
    <var name="LootDamageMin" type="1" value="0.0"/>
    <var name="LootDamageMax" type="1" value="0.82"/>
    <var name="SpawnInitial" type="0" value="1200"/>
    <var name="TimeLogin" type="0" value="15"/>
    <var name="TimeLogout" type="0" value="15"/>
    <var name="TimePenalty" type="0" value="20"/>
    <var name="TimeHopping" type="0" value="60"/>
    <var name="ZoneSpawnDist" type="0" value="300"/>
</variables>
```

### 关键变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `AnimalMaxCount` | 200 | 地图上最大动物数量 |
| `ZombieMaxCount` | 1000 | 地图上最大感染者数量 |
| `CleanupLifetimeDeadPlayer` | 3600 | 死亡尸体移除时间（秒） |
| `CleanupLifetimeRuined` | 330 | 损毁物品移除时间 |
| `FlagRefreshFrequency` | 432000 | 领地旗帜刷新间隔（5 天） |
| `FlagRefreshMaxDuration` | 3456000 | 旗帜最大生存时间（40 天） |
| `FoodDecay` | 1 | 食物腐烂开关（0=关闭，1=开启） |
| `InitialSpawn` | 100 | 启动时生成 nominal 的百分比 |
| `LootDamageMax` | 0.82 | 生成战利品的最大损伤 |
| `TimeLogin` / `TimeLogout` | 15 | 登录/登出计时器（防战斗退出） |
| `TimePenalty` | 20 | 战斗退出惩罚计时器 |
| `ZoneSpawnDist` | 300 | 触发僵尸/动物生成的玩家距离 |

`type` 属性中 `0` 表示整数，`1` 表示浮点数。使用错误的类型会截断值。

---

## cfggameplay.json --- 游戏设置

仅当 `serverDZ.cfg` 中设置了 `enableCfgGameplayFile = 1` 时才加载。否则引擎使用硬编码的默认值。

### 结构

```json
{
    "version": 123,
    "GeneralData": {
        "disableBaseDamage": false,
        "disableContainerDamage": false,
        "disableRespawnDialog": false
    },
    "PlayerData": {
        "disablePersonalLight": false,
        "StaminaData": {
            "sprintStaminaModifierErc": 1.0,
            "staminaMax": 100.0,
            "staminaWeightLimitThreshold": 6000.0,
            "staminaMinCap": 5.0
        },
        "MovementData": {
            "timeToSprint": 0.45,
            "rotationSpeedSprint": 0.15,
            "allowStaminaAffectInertia": true
        }
    },
    "WorldsData": {
        "lightingConfig": 0,
        "environmentMinTemps": [-3, -2, 0, 4, 9, 14, 18, 17, 13, 11, 9, 0],
        "environmentMaxTemps": [3, 5, 7, 14, 19, 24, 26, 25, 18, 14, 10, 5]
    },
    "BaseBuildingData": {
        "HologramData": {
            "disableIsCollidingBBoxCheck": false,
            "disableIsCollidingAngleCheck": false,
            "disableHeightPlacementCheck": false,
            "disallowedTypesInUnderground": ["FenceKit", "TerritoryFlagKit"]
        }
    },
    "MapData": {
        "ignoreMapOwnership": false,
        "displayPlayerPosition": false,
        "displayNavInfo": true
    }
}
```

关键设置：`disableBaseDamage` 防止基地损伤，`disablePersonalLight` 移除新角色的光源，`staminaWeightLimitThreshold` 以克为单位（6000 = 6kg），温度数组有 12 个值（一月至十二月），`lightingConfig` 接受 `0`（默认）或 `1`（更暗的夜晚），`displayPlayerPosition` 在地图上显示玩家的点。

---

## serverDZ.cfg --- 服务器设置

此文件位于服务器可执行文件旁边，不在任务文件夹中。

### 关键设置

```
hostname = "My DayZ Server";
password = "";
passwordAdmin = "adminpass123";
maxPlayers = 60;
verifySignatures = 2;
forceSameBuild = 1;
template = "dayzOffline.chernarusplus";
enableCfgGameplayFile = 1;
storeHouseStateDisabled = false;
storageAutoFix = 1;
```

| 参数 | 说明 |
|------|------|
| `hostname` | 浏览器中的服务器名称 |
| `password` | 加入密码（空 = 开放） |
| `passwordAdmin` | RCON 管理员密码 |
| `maxPlayers` | 最大同时在线玩家数 |
| `template` | 任务文件夹名称 |
| `verifySignatures` | 签名检查级别（2 = 严格） |
| `enableCfgGameplayFile` | 加载 cfggameplay.json（0/1） |

### Mod 加载

Mod 通过启动参数指定，不在配置文件中：

```
DayZServer_x64.exe -config=serverDZ.cfg -mod=@CF;@MyMod -servermod=@MyServerMod -port=2302
```

`-mod=` Mod 必须由客户端安装。`-servermod=` Mod 仅在服务器端运行。

---

## Mod 如何与经济系统交互

### cfgeconomycore.xml --- 根类注册

每个物品类层次结构都必须追溯到已注册的根类：

```xml
<economycore>
    <classes>
        <rootclass name="DefaultWeapon" />
        <rootclass name="DefaultMagazine" />
        <rootclass name="Inventory_Base" />
        <rootclass name="SurvivorBase" act="character" reportMemoryLOD="no" />
        <rootclass name="DZ_LightAI" act="character" reportMemoryLOD="no" />
        <rootclass name="CarScript" act="car" reportMemoryLOD="no" />
    </classes>
</economycore>
```

如果你的 Mod 引入了不继承自 `Inventory_Base`、`DefaultWeapon` 或 `DefaultMagazine` 的新基类，将其添加为 `rootclass`。`act` 属性指定实体类型：`character` 用于 AI，`car` 用于载具。

### cfglimitsdefinition.xml --- 自定义标签

任何在 `types.xml` 中使用的 `category`、`usage` 或 `value` 必须在这里定义：

```xml
<lists>
    <categories>
        <category name="mymod_special"/>
    </categories>
    <usageflags>
        <usage name="MyModDungeon"/>
    </usageflags>
    <valueflags>
        <value name="MyModEndgame"/>
    </valueflags>
</lists>
```

使用 `cfglimitsdefinitionuser.xml` 添加不应覆盖原版文件的内容。

### economy.xml --- 子系统控制

控制哪些 CE 子系统处于活动状态：

```xml
<economy>
    <dynamic init="1" load="1" respawn="1" save="1"/>
    <animals init="1" load="0" respawn="1" save="0"/>
    <zombies init="1" load="0" respawn="1" save="0"/>
    <vehicles init="1" load="1" respawn="1" save="1"/>
</economy>
```

标志：`init`（启动时生成）、`load`（加载持久化数据）、`respawn`（清理后重新生成）、`save`（持久化到数据库）。

### 脚本端经济交互

通过 `CreateInInventory()` 创建的物品自动由 CE 管理。对于世界生成，使用 ECE 标志：

```c
EntityAI item = GetGame().CreateObjectEx("AK74", position, ECE_PLACE_ON_SURFACE);
```

---

## 常见错误

### XML 语法错误

一个未关闭的标签会破坏整个文件。部署前始终验证 XML。

### cfglimitsdefinition.xml 中缺少标签

在 types.xml 中使用未在 cfglimitsdefinition.xml 中定义的 `usage` 或 `value` 会导致物品静默地无法生成。检查 RPT 日志中的警告。

### Nominal 过高

所有物品的总 nominal 应保持在 10,000-15,000 以下。过高的值会降低服务器性能。

### Lifetime 过短

生存时间非常短的物品会在玩家找到之前消失。常见物品至少使用 `3600`（1 小时），武器使用 `28800`（8 小时）。

### 缺少根类

类层次结构未追溯到 `cfgeconomycore.xml` 中已注册根类的物品将永远不会生成，即使 types.xml 条目正确也是如此。

### cfggameplay.json 未启用

除非在 `serverDZ.cfg` 中设置 `enableCfgGameplayFile = 1`，否则该文件会被忽略。

### globals.xml 中类型错误

对浮点值（如 `0.82`）使用 `type="0"`（整数）会将其截断为 `0`。浮点数使用 `type="1"`。

### 直接编辑原版文件

修改原版 types.xml 可以工作但在游戏更新时会破坏。优先发布单独的类型文件并通过 cfgeconomycore 注册它们，或使用 cfglimitsdefinitionuser.xml 添加自定义标签。

---

## 最佳实践

- 随你的 Mod 发布一个 `ServerFiles/` 文件夹，包含预配置的 `types.xml` 条目，以便服务器管理员可以复制粘贴而不是从头编写。
- 使用 `cfglimitsdefinitionuser.xml` 而不是编辑原版 `cfglimitsdefinition.xml`——你的添加在游戏更新后依然存在。
- 对常见物品（食物、弹药）设置 `count_in_hoarder="0"` 以防止囤积阻塞 CE 重新生成。
- 在期望 `cfggameplay.json` 更改生效之前，始终在 `serverDZ.cfg` 中设置 `enableCfgGameplayFile = 1`。
- 保持所有 types.xml 条目的总 `nominal` 低于 12,000，以避免在人口众多的服务器上出现 CE 性能下降。

---

## 理论与实践

| 概念 | 理论 | 现实 |
|------|------|------|
| `nominal` 是硬目标 | CE 精确生成这么多物品 | CE 随时间接近 nominal 但根据玩家交互、清理周期和区域距离而波动 |
| `restock=0` 意味着立即重新生成 | 物品在消失后立即重新出现 | CE 以周期方式批量处理补货（通常每 30-60 秒），因此无论 restock 值如何，总有延迟 |
| `cfggameplay.json` 控制所有游戏玩法 | 所有调整都在这里 | 许多游戏值硬编码在脚本或 config.cpp 中，不能被 cfggameplay.json 覆盖 |
| `init.c` 仅在服务器启动时运行 | 一次性初始化 | `init.c` 在每次任务加载时运行，包括服务器重启后。持久状态由 Hive 管理，而不是 init.c |
| 多个 types.xml 文件可以干净合并 | CE 读取所有已注册的文件 | 文件必须通过 `<ce folder="custom">` 指令在 cfgeconomycore.xml 中注册。仅将额外的 XML 文件放在 `db/` 中不起作用 |

---

## 兼容性与影响

- **多 Mod 共存：** 多个 Mod 可以向 types.xml 添加条目而不冲突，只要类名唯一。如果两个 Mod 定义了具有不同 nominal/lifetime 值的相同类名，最后加载的条目获胜。
- **性能：** 过高的 nominal 计数（15,000+）导致 CE 周期峰值，表现为服务器 FPS 下降。每个 CE 周期遍历所有已注册的类型以检查生成条件。
