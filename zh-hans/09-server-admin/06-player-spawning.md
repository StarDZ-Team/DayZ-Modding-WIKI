# Chapter 9.6: 玩家出生

[首页](../README.md) | [<< 上一章: 载具刷新](05-vehicle-spawning.md) | [下一章: 持久化 >>](07-persistence.md)

---

> **摘要:** 玩家出生位置由 **cfgplayerspawnpoints.xml**（位置气泡）和 **init.c**（初始装备）控制。本章用切尔诺鲁斯的原版真实数据介绍这两个文件。

---

## 目录

- [cfgplayerspawnpoints.xml 概述](#cfgplayerspawnpointsxml-概述)
- [出生参数](#出生参数)
- [生成器参数](#生成器参数)
- [组参数](#组参数)
- [新生出生气泡](#新生出生气泡)
- [跳服出生点](#跳服出生点)
- [init.c -- 初始装备](#initc----初始装备)
- [添加自定义出生点](#添加自定义出生点)
- [常见错误](#常见错误)

---

## cfgplayerspawnpoints.xml 概述

此文件位于你的任务文件夹中（例如 `dayzOffline.chernarusplus/cfgplayerspawnpoints.xml`）。它有两个部分，各自有独立的参数和位置气泡：

- **`<fresh>`** -- 全新角色（首次生命或死亡后）
- **`<hop>`** -- 跳服玩家（在其他服务器上已有角色）

---

## 出生参数

原版新生出生参数值：

```xml
<spawn_params>
    <min_dist_infected>30</min_dist_infected>
    <max_dist_infected>70</max_dist_infected>
    <min_dist_player>65</min_dist_player>
    <max_dist_player>150</max_dist_player>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
</spawn_params>
```

| 参数 | 值 | 含义 |
|------|------|------|
| `min_dist_infected` | 30 | 玩家必须距最近的感染者至少 30 米出生 |
| `max_dist_infected` | 70 | 如果找不到 30 米以上的位置，接受最远 70 米作为备用范围 |
| `min_dist_player` | 65 | 玩家必须距任何其他玩家至少 65 米出生 |
| `max_dist_player` | 150 | 备用范围——接受距其他玩家最远 150 米的位置 |
| `min_dist_static` | 0 | 距静态物体（建筑、墙壁）的最小距离 |
| `max_dist_static` | 2 | 距静态物体的最大距离——保持玩家靠近建筑 |

引擎首先尝试 `min_dist_*` 值；如果找不到有效位置，则放宽到 `max_dist_*`。

---

## 生成器参数

生成器在每个气泡周围创建候选位置网格：

```xml
<generator_params>
    <grid_density>4</grid_density>
    <grid_width>200</grid_width>
    <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>
    <max_steepness>45</max_steepness>
</generator_params>
```

| 参数 | 值 | 含义 |
|------|------|------|
| `grid_density` | 4 | 网格点之间的间距（米）——越低候选点越多，CPU 消耗越高 |
| `grid_width` | 200 | 网格在每个气泡中心的 X 轴方向延伸 200 米 |
| `grid_height` | 200 | 网格在每个气泡中心的 Z 轴方向延伸 200 米 |
| `min_steepness` / `max_steepness` | -45 / 45 | 地形坡度范围（度）——排除悬崖面和陡坡 |

每个气泡获得一个 200x200 米的网格，每 4 米一个点（约 2,500 个候选位置）。引擎按坡度和静态距离过滤，然后在出生时应用 `spawn_params`。

#### `allow_in_water` 参数 (1.28+)

从 DayZ 1.28 开始，`generator_params` 中新增了布尔参数 `allow_in_water`（默认值：`false`）。当设为 `true` 时，出生点生成器会将水中的位置视为有效出生点：

```xml
<generator_params>
    <grid_density>4</grid_density>
    <grid_width>200</grid_width>
    <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>
    <max_steepness>45</max_steepness>
    <allow_in_water>false</allow_in_water>
</generator_params>
```

默认情况下，引擎会拒绝落在水中（池塘、河流、海洋）的任何候选位置。将 `allow_in_water` 设为 `true` 会移除此过滤器。这主要适用于具有岛屿出生点的自定义地图，或有意设置海岸水中出生的场景。对于大多数服务器，保持 `false` 以避免玩家在湖中或海洋中出生。

---

## 组参数

```xml
<group_params>
    <enablegroups>true</enablegroups>
    <groups_as_regular>true</groups_as_regular>
    <lifetime>240</lifetime>
    <counter>-1</counter>
</group_params>
```

| 参数 | 值 | 含义 |
|------|------|------|
| `enablegroups` | true | 位置气泡被组织为命名组 |
| `groups_as_regular` | true | 组被视为常规出生点（可以选择任意组） |
| `lifetime` | 240 | 已使用的出生点再次可用前的秒数 |
| `counter` | -1 | 出生点可使用的次数。-1 = 无限制 |

已使用的位置被锁定 240 秒，防止两个玩家在同一位置出生。

---

## 新生出生气泡

原版切尔诺鲁斯定义了沿海岸的 11 个组用于新生出生。每个组围绕一个城镇聚集 3-8 个位置：

| 组 | 位置数 | 区域 |
|------|--------|------|
| WestCherno | 4 | 切尔诺戈尔斯克西侧 |
| EastCherno | 4 | 切尔诺戈尔斯克东侧 |
| WestElektro | 5 | 电力站西部 |
| EastElektro | 4 | 电力站东部 |
| Kamyshovo | 5 | 卡梅绍沃海岸线 |
| Solnechny | 5 | 索尔尼切尼工厂区域 |
| Orlovets | 4 | 索尔尼切尼和尼日涅之间 |
| Nizhnee | 4 | 尼日涅海岸 |
| SouthBerezino | 3 | 别列日诺南部 |
| NorthBerezino | 8 | 别列日诺北部 + 延伸海岸 |
| Svetlojarsk | 3 | 斯维特洛亚尔斯克港口 |

### 真实组示例

```xml
<generator_posbubbles>
    <group name="WestCherno">
        <pos x="6063.018555" z="1931.907227" />
        <pos x="5933.964844" z="2171.072998" />
        <pos x="6199.782715" z="2241.805176" />
        <pos x="13552.5654" z="5955.893066" />
    </group>
    <group name="WestElektro">
        <pos x="8747.670898" z="2357.187012" />
        <pos x="9363.6533" z="2017.953613" />
        <pos x="9488.868164" z="1898.900269" />
        <pos x="9675.2216" z="1817.324585" />
        <pos x="9821.274414" z="2194.003662" />
    </group>
    <group name="Kamyshovo">
        <pos x="11830.744141" z="3400.428955" />
        <pos x="11930.805664" z="3484.882324" />
        <pos x="11961.211914" z="3419.867676" />
        <pos x="12222.977539" z="3454.867188" />
        <pos x="12336.774414" z="3503.847168" />
    </group>
</generator_posbubbles>
```

坐标使用 `x`（东西方向）和 `z`（南北方向）。Y 轴（海拔）从地形高度图自动计算。

---

## 跳服出生点

跳服出生点对玩家距离更宽松，使用更小的网格：

```xml
<!-- 跳服 spawn_params 与新生的差异 -->
<min_dist_player>25.0</min_dist_player>   <!-- 新生: 65 -->
<max_dist_player>70.0</max_dist_player>   <!-- 新生: 150 -->
<min_dist_static>0.5</min_dist_static>    <!-- 新生: 0 -->

<!-- 跳服 generator_params 差异 -->
<grid_width>150</grid_width>              <!-- 新生: 200 -->
<grid_height>150</grid_height>            <!-- 新生: 200 -->

<!-- 跳服 group_params 差异 -->
<enablegroups>false</enablegroups>        <!-- 新生: true -->
<lifetime>360</lifetime>                  <!-- 新生: 240 -->
```

跳服组分布在**内陆**：Balota (6)、Cherno (5)、Pusta (5)、Kamyshovo (4)、Solnechny (5)、Nizhnee (6)、Berezino (5)、Olsha (4)、Svetlojarsk (5)、Dobroye (5)。设置 `enablegroups=false` 后，引擎将所有 50 个位置视为平面池。

---

## init.c -- 初始装备

你任务文件夹中的 **init.c** 文件控制角色创建和初始装备。两个重要的覆盖方法：

- **`CreateCharacter`** -- 调用 `GetGame().CreatePlayer()`。引擎在此方法运行之前从 **cfgplayerspawnpoints.xml** 选取位置；你不在此设置出生位置。
- **`StartingEquipSetup`** -- 在角色创建后运行。玩家已有默认服装（衬衫、牛仔裤、运动鞋）。此方法添加初始物品。

### 原版 StartingEquipSetup（切尔诺鲁斯）

```c
override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
{
    EntityAI itemClothing;
    EntityAI itemEnt;
    float rand;

    itemClothing = player.FindAttachmentBySlotName( "Body" );
    if ( itemClothing )
    {
        SetRandomHealth( itemClothing );  // 0.45 - 0.65 血量

        itemEnt = itemClothing.GetInventory().CreateInInventory( "BandageDressing" );
        player.SetQuickBarEntityShortcut(itemEnt, 2);

        string chemlightArray[] = { "Chemlight_White", "Chemlight_Yellow", "Chemlight_Green", "Chemlight_Red" };
        int rndIndex = Math.RandomInt( 0, 4 );
        itemEnt = itemClothing.GetInventory().CreateInInventory( chemlightArray[rndIndex] );
        SetRandomHealth( itemEnt );
        player.SetQuickBarEntityShortcut(itemEnt, 1);

        rand = Math.RandomFloatInclusive( 0.0, 1.0 );
        if ( rand < 0.35 )
            itemEnt = player.GetInventory().CreateInInventory( "Apple" );
        else if ( rand > 0.65 )
            itemEnt = player.GetInventory().CreateInInventory( "Pear" );
        else
            itemEnt = player.GetInventory().CreateInInventory( "Plum" );
        player.SetQuickBarEntityShortcut(itemEnt, 3);
        SetRandomHealth( itemEnt );
    }

    itemClothing = player.FindAttachmentBySlotName( "Legs" );
    if ( itemClothing )
        SetRandomHealth( itemClothing );
}
```

每个玩家获得的物品：**BandageDressing**（快捷栏 3）、随机 **Chemlight**（快捷栏 2）、随机水果——35% 苹果、30% 李子、35% 梨（快捷栏 1）。`SetRandomHealth` 将所有物品设置为 45-65% 的耐久度。

### 添加自定义初始装备

```c
// 在水果代码块之后、Body 槽位检查内部添加
itemEnt = player.GetInventory().CreateInInventory( "KitchenKnife" );
SetRandomHealth( itemEnt );
```

---

## 添加自定义出生点

要添加自定义出生组，编辑 **cfgplayerspawnpoints.xml** 的 `<fresh>` 部分：

```xml
<group name="MyCustomSpawn">
    <pos x="7500.0" z="7500.0" />
    <pos x="7550.0" z="7520.0" />
    <pos x="7480.0" z="7540.0" />
    <pos x="7520.0" z="7480.0" />
</group>
```

步骤：

1. 在游戏中打开地图或使用 iZurvive 查找坐标
2. 在安全区域（无悬崖、无水域）选择分布在 100-200 米范围内的 3-5 个位置
3. 将 `<group>` 块添加到 `<generator_posbubbles>` 内
4. `x` 用于东西方向，`z` 用于南北方向——引擎从地形计算 Y（海拔）
5. 重启服务器——不需要清除持久化数据

为了均衡出生，每组保持至少 4 个位置，这样 240 秒的锁定不会在多个玩家同时死亡时阻塞所有位置。

---

## 常见错误

### 玩家在海中出生

你将 `z`（南北方向）与 Y（海拔）混淆了，或使用了超出 0-15360 范围的坐标。海岸位置的 `z` 值较低（南边缘）。用 iZurvive 仔细检查。

### 出生点不够

只有 2-3 个位置时，240 秒的锁定会导致聚集。原版使用 49 个新生位置分布在 11 个组中。至少设置 4 个以上的组共 20 个位置。

### 忘记跳服部分

空的 `<hop>` 部分意味着跳服玩家在 `0,0,0` 出生——在切尔诺鲁斯就是海洋。始终定义跳服点，即使你从 `<fresh>` 复制也可以。

### 出生点在陡峭地形上

生成器会拒绝超过 45 度的斜坡。如果所有自定义位置都在山坡上，则没有有效候选位置。使用道路附近的平坦地面。

### 玩家总是在同一地点出生

只有 1-2 个位置的组会被 240 秒的冷却锁定。每组添加更多位置。

---

[首页](../README.md) | [<< 上一章: 载具刷新](05-vehicle-spawning.md) | [下一章: 持久化 >>](07-persistence.md)
