# 第 8.10 章：创建自定义载具模组

[首页](../../README.md) | [<< 上一章：专业模组模板](09-professional-template.md) | **创建自定义载具** | [下一章：创建自定义服装 >>](11-clothing-mod.md)

---

> **摘要：** 本教程将引导你通过扩展现有的原版载具来创建自定义载具变体。你将在 config.cpp 中定义载具、自定义其属性和贴图、编写车门和引擎的脚本行为、将其添加到服务器生成表中并预装配零件，最后在游戏中进行测试。完成后，你将拥有一辆性能和外观都经过修改的、可以正常驾驶的自定义 Offroad Hatchback 变体。

---

## 目录

- [我们要构建什么](#what-we-are-building)
- [前提条件](#prerequisites)
- [步骤 1：创建配置文件（config.cpp）](#step-1-create-the-config-configcpp)
- [步骤 2：自定义贴图](#step-2-custom-textures)
- [步骤 3：脚本行为（CarScript）](#step-3-script-behavior-carscript)
- [步骤 4：types.xml 条目](#step-4-typesxml-entry)
- [步骤 5：构建和测试](#step-5-build-and-test)
- [步骤 6：完善](#step-6-polish)
- [完整代码参考](#complete-code-reference)
- [最佳实践](#best-practices)
- [理论与实践](#theory-vs-practice)
- [你学到了什么](#what-you-learned)
- [常见错误](#common-mistakes)

---

## 我们要构建什么

我们将创建一辆名为 **MFM Rally Hatchback** 的载具——这是原版 Offroad Hatchback（Niva）的改装版本，具有：

- 使用隐藏选区重新贴图的自定义车身面板
- 修改后的引擎性能（更高的最高速度，更高的油耗）
- 调整后的伤害区域生命值（更坚固的引擎，更脆弱的车门）
- 所有标准载具行为：开关车门、引擎启停、燃油、灯光、乘员上下车
- 生成表条目，带有预装配的车轮和零件

我们扩展 `OffroadHatchback` 而不是从零开始构建载具。这是载具模组的标准工作流程，因为它继承了模型、动画、物理几何体和所有现有行为。你只需覆盖想要更改的部分。

---

## 前提条件

- 一个可用的模组结构（先完成[第 8.1 章](01-first-mod.md)和[第 8.2 章](02-custom-item.md)）
- 一个文本编辑器
- 已安装 DayZ Tools（用于贴图转换，可选）
- 基本了解 config.cpp 类继承的工作方式

你的模组应具有以下起始结构：

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
    Data/
        config.cpp
```

---

## 步骤 1：创建配置文件（config.cpp）

载具定义位于 `CfgVehicles` 中，就像物品一样。尽管类名如此，`CfgVehicles` 包含所有内容——物品、建筑和实际载具都在其中。载具的关键区别在于父类以及伤害区域、附件和模拟参数的额外配置。

### 更新你的 Data config.cpp

打开 `MyFirstMod/Data/config.cpp` 并添加载具类。如果你已经有第 8.2 章的物品定义，请将载具类添加到现有的 `CfgVehicles` 块中。

```cpp
class CfgPatches
{
    class MyFirstMod_Vehicles
    {
        units[] = { "MFM_RallyHatchback" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Vehicles_Wheeled"
        };
    };
};

class CfgVehicles
{
    class OffroadHatchback;

    class MFM_RallyHatchback : OffroadHatchback
    {
        scope = 2;
        displayName = "Rally Hatchback";
        descriptionShort = "A modified offroad hatchback built for speed.";

        // --- 用于重新贴图的隐藏选区 ---
        hiddenSelections[] =
        {
            "camoGround",
            "camoMale",
            "driverDoors",
            "coDriverDoors",
            "intHood",
            "intTrunk"
        };
        hiddenSelectionsTextures[] =
        {
            "MyFirstMod\Data\Textures\rally_body_co.paa",
            "MyFirstMod\Data\Textures\rally_body_co.paa",
            "",
            "",
            "",
            ""
        };

        // --- 模拟（物理和引擎） ---
        class SimulationModule : SimulationModule
        {
            // 驱动类型：0 = 后驱，1 = 前驱，2 = 四驱
            drive = 2;

            class Throttle
            {
                reactionTime = 0.75;
                defaultThrust = 0.85;
                gentleThrust = 0.65;
                turboCoef = 4.0;
                gentleCoef = 0.5;
            };

            class Engine
            {
                inertia = 0.15;
                torqueMax = 160;
                torqueRpm = 4200;
                powerMax = 95;
                powerRpm = 5600;
                rpmIdle = 850;
                rpmMin = 900;
                rpmClutch = 1400;
                rpmRedline = 6500;
                rpmMax = 7500;
            };

            class Gearbox
            {
                reverse = 3.526;
                ratios[] = { 3.667, 2.1, 1.361, 1.0 };
                transmissionRatio = 3.857;
            };

            braking[] = { 0.0, 0.1, 0.8, 0.9, 0.95, 1.0 };
        };

        // --- 伤害区域 ---
        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 1000;
                    healthLevels[] =
                    {
                        { 1.0, {} },
                        { 0.7, {} },
                        { 0.5, {} },
                        { 0.3, {} },
                        { 0.0, {} }
                    };
                };
            };

            class DamageZones
            {
                class Chassis
                {
                    class Health
                    {
                        hitpoints = 3000;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_chassis" };
                    inventorySlots[] = {};
                };

                class Engine
                {
                    class Health
                    {
                        hitpoints = 1200;
                        transferToGlobalCoef = 1;
                    };
                    fatalInjuryCoef = 0.001;
                    componentNames[] = { "yourcar_engine" };
                    inventorySlots[] = {};
                };

                class FuelTank
                {
                    class Health
                    {
                        hitpoints = 600;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_fueltank" };
                    inventorySlots[] = {};
                };

                class Front
                {
                    class Health
                    {
                        hitpoints = 1500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_front" };
                    inventorySlots[] = { "NivaHood" };
                };

                class Rear
                {
                    class Health
                    {
                        hitpoints = 1500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_rear" };
                    inventorySlots[] = { "NivaTrunk" };
                };

                class Body
                {
                    class Health
                    {
                        hitpoints = 2000;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_body" };
                    inventorySlots[] = {};
                };

                class WindowFront
                {
                    class Health
                    {
                        hitpoints = 150;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_windowfront" };
                    inventorySlots[] = {};
                };

                class WindowLR
                {
                    class Health
                    {
                        hitpoints = 150;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_windowLR" };
                    inventorySlots[] = {};
                };

                class WindowRR
                {
                    class Health
                    {
                        hitpoints = 150;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_windowRR" };
                    inventorySlots[] = {};
                };

                class Door_1_1
                {
                    class Health
                    {
                        hitpoints = 500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_door_1_1" };
                    inventorySlots[] = { "NivaDriverDoors" };
                };

                class Door_2_1
                {
                    class Health
                    {
                        hitpoints = 500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_door_2_1" };
                    inventorySlots[] = { "NivaCoDriverDoors" };
                };
            };
        };
    };
};
```

### 关键字段说明

| 字段 | 用途 |
|-------|---------|
| `scope = 2` | 使载具可以生成。对于不应直接生成的基类使用 `0`。 |
| `displayName` | 在管理工具和游戏中显示的名称。可以使用 `$STR_` 引用来实现本地化。 |
| `requiredAddons[]` | 必须包含 `"DZ_Vehicles_Wheeled"`，这样父类 `OffroadHatchback` 会在你的类之前加载。 |
| `hiddenSelections[]` | 模型上你想要覆盖的贴图槽位。必须与模型的命名选区匹配。 |
| `SimulationModule` | 物理和引擎配置。控制速度、扭矩、齿轮比和制动。 |
| `DamageSystem` | 定义载具各部分（引擎、车门、车窗、车身）的生命值池。 |

### 关于父类

```cpp
class OffroadHatchback;
```

这个前向声明告诉配置解析器 `OffroadHatchback` 存在于原版 DayZ 中。然后你的载具继承自它，获得完整的 Niva 模型、动画、物理几何体、附件点和代理定义。你只需要覆盖想要更改的部分。

你可以扩展的其他原版载具父类：

| 父类 | 载具 |
|-------------|---------|
| `OffroadHatchback` | Niva（4 座掀背车） |
| `CivilianSedan` | Olga（4 座轿车） |
| `Hatchback_02` | Golf/Gunter（4 座掀背车） |
| `Sedan_02` | Sarka 120（4 座轿车） |
| `Offroad_02` | Humvee（4 座越野车） |
| `Truck_01_Base` | V3S（卡车） |

### 关于 SimulationModule

`SimulationModule` 控制载具的驾驶方式。关键参数：

| 参数 | 效果 |
|-----------|--------|
| `drive` | `0` = 后轮驱动，`1` = 前轮驱动，`2` = 全轮驱动 |
| `torqueMax` | 最大引擎扭矩（牛顿米）。越高 = 加速越快。原版 Niva 约 114。 |
| `powerMax` | 最大马力。越高 = 最高速度越快。原版 Niva 约 68。 |
| `rpmRedline` | 引擎红线转速。超过此值，引擎会触发转速限制器。 |
| `ratios[]` | 齿轮比。数值越小 = 齿轮越长 = 最高速度越高但加速越慢。 |
| `transmissionRatio` | 最终传动比。作为所有齿轮的乘数。 |

### 关于伤害区域

每个伤害区域都有自己的生命值池。当一个区域的生命值降至零时，该组件被损毁：

| 区域 | 损毁时的效果 |
|------|-------------------|
| `Engine` | 载具无法启动 |
| `FuelTank` | 燃油泄漏 |
| `Front` / `Rear` | 外观损坏，防护降低 |
| `Door_1_1` / `Door_2_1` | 车门脱落 |
| `WindowFront` | 车窗破碎（影响隔音效果） |

`transferToGlobalCoef` 值决定了该区域承受的伤害有多少转移到载具的全局生命值。`1` 表示 100% 转移（引擎伤害影响整体健康），`0` 表示不转移。

`componentNames[]` 必须匹配载具几何 LOD 中的命名组件。由于我们继承了 Niva 模型，这里使用占位符名称——父类的几何组件才是碰撞检测的实际依据。如果你使用的是未经修改的原版模型，父类的组件映射会自动生效。

---

## 步骤 2：自定义贴图

### 载具隐藏选区的工作方式

载具隐藏选区的工作方式与物品贴图相同，但载具通常有更多的选区槽位。Offroad Hatchback 模型使用选区来区分不同的车身面板，从而在原版中实现颜色变体（白色、蓝色）。

### 使用原版贴图（最快上手）

在初始测试时，将你的隐藏选区指向现有的原版贴图。这可以在创建自定义美术资源之前确认你的配置是否正常：

```cpp
hiddenSelectionsTextures[] =
{
    "\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa",
    "\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa",
    "",
    "",
    "",
    ""
};
```

空字符串 `""` 表示"对该选区使用模型的默认贴图"。

### 创建自定义贴图集

要创建独特的外观：

1. **提取原版贴图**，使用 DayZ Tools 的 Addon Builder 或 P: 盘来找到：
   ```
   P:\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa
   ```

2. **转换为可编辑格式**，使用 TexView2：
   - 在 TexView2 中打开 `.paa` 文件
   - 导出为 `.tga` 或 `.png`

3. **在图像编辑器中编辑**（GIMP、Photoshop、Paint.NET）：
   - 载具贴图通常为 **2048x2048** 或 **4096x4096**
   - 修改颜色、添加贴花、赛车条纹或锈蚀效果
   - 保持 UV 布局不变——只更改颜色和细节

4. **转换回 `.paa`**：
   - 在 TexView2 中打开你编辑的图像
   - 保存为 `.paa` 格式
   - 保存到 `MyFirstMod/Data/Textures/rally_body_co.paa`

### 载具贴图命名规范

| 后缀 | 类型 | 用途 |
|--------|------|---------|
| `_co` | 颜色（漫反射） | 主要颜色和外观 |
| `_nohq` | 法线贴图 | 表面凹凸、面板线条、铆钉细节 |
| `_smdi` | 高光 | 金属光泽、油漆反射 |
| `_as` | Alpha/表面 | 车窗透明度 |
| `_de` | 损坏 | 损坏覆盖贴图 |

对于第一个载具模组，只需要 `_co` 贴图。模型会使用其默认的法线和高光贴图。

### 匹配材质（可选）

要完全控制材质，创建一个 `.rvmat` 文件：

```cpp
hiddenSelectionsMaterials[] =
{
    "MyFirstMod\Data\Textures\rally_body.rvmat",
    "MyFirstMod\Data\Textures\rally_body.rvmat",
    "",
    "",
    "",
    ""
};
```

---

## 步骤 3：脚本行为（CarScript）

载具脚本类控制引擎声音、车门逻辑、乘员上下车行为和座位动画。由于我们扩展了 `OffroadHatchback`，我们继承了所有原版行为，只需覆盖想要自定义的部分。

### 创建脚本文件

创建文件夹结构和脚本文件：

```
MyFirstMod/
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_RallyHatchback.c
```

### 更新 Scripts config.cpp

你的 `Scripts/config.cpp` 必须注册 `4_World` 层级，以便引擎加载你的脚本：

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
            "DZ_Data",
            "DZ_Vehicles_Wheeled"
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

        dependencies[] = { "World" };

        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/4_World" };
            };
        };
    };
};
```

### 编写载具脚本

创建 `4_World/MyFirstMod/MFM_RallyHatchback.c`：

```c
class MFM_RallyHatchback extends OffroadHatchback
{
    void MFM_RallyHatchback()
    {
        // 覆盖引擎声音（复用原版 Niva 声音）
        m_EngineStartOK         = "offroad_engine_start_SoundSet";
        m_EngineStartBattery    = "offroad_engine_failed_start_battery_SoundSet";
        m_EngineStartPlug       = "offroad_engine_failed_start_sparkplugs_SoundSet";
        m_EngineStartFuel       = "offroad_engine_failed_start_fuel_SoundSet";
        m_EngineStop            = "offroad_engine_stop_SoundSet";
        m_EngineStopFuel        = "offroad_engine_stop_fuel_SoundSet";

        m_CarDoorOpenSound      = "offroad_door_open_SoundSet";
        m_CarDoorCloseSound     = "offroad_door_close_SoundSet";
        m_CarSeatShiftInSound   = "Offroad_SeatShiftIn_SoundSet";
        m_CarSeatShiftOutSound  = "Offroad_SeatShiftOut_SoundSet";

        m_CarHornShortSoundName = "Offroad_Horn_Short_SoundSet";
        m_CarHornLongSoundName  = "Offroad_Horn_SoundSet";

        // 模型空间中的引擎位置（x, y, z）——用于
        // 温度源、淹水检测和粒子效果
        SetEnginePos("0 0.7 1.2");
    }

    // --- 动画实例 ---
    // 决定玩家上下车时使用哪套动画集。
    // 必须匹配载具骨骼。由于我们使用 Niva 模型，保持 HATCHBACK。
    override int GetAnimInstance()
    {
        return VehicleAnimInstances.HATCHBACK;
    }

    // --- 摄像机距离 ---
    // 第三人称摄像机位于载具后方的距离。
    // 原版 Niva 为 3.5。增大可获得更宽的视野。
    override float GetTransportCameraDistance()
    {
        return 4.0;
    }

    // --- 座位动画类型 ---
    // 将每个座位索引映射到玩家动画类型。
    // 0 = 驾驶员，1 = 副驾驶，2 = 后排左，3 = 后排右。
    override int GetSeatAnimationType(int posIdx)
    {
        switch (posIdx)
        {
        case 0:
            return DayZPlayerConstants.VEHICLESEAT_DRIVER;
        case 1:
            return DayZPlayerConstants.VEHICLESEAT_CODRIVER;
        case 2:
            return DayZPlayerConstants.VEHICLESEAT_PASSENGER_L;
        case 3:
            return DayZPlayerConstants.VEHICLESEAT_PASSENGER_R;
        }

        return 0;
    }

    // --- 车门状态 ---
    // 返回车门是缺失、打开还是关闭。
    // 槽位名称（NivaDriverDoors、NivaCoDriverDoors、NivaHood、NivaTrunk）
    // 由模型的库存槽位代理定义。
    override int GetCarDoorsState(string slotType)
    {
        CarDoor carDoor;

        Class.CastTo(carDoor, FindAttachmentBySlotName(slotType));
        if (!carDoor)
        {
            return CarDoorState.DOORS_MISSING;
        }

        switch (slotType)
        {
            case "NivaDriverDoors":
                return TranslateAnimationPhaseToCarDoorState("DoorsDriver");

            case "NivaCoDriverDoors":
                return TranslateAnimationPhaseToCarDoorState("DoorsCoDriver");

            case "NivaHood":
                return TranslateAnimationPhaseToCarDoorState("DoorsHood");

            case "NivaTrunk":
                return TranslateAnimationPhaseToCarDoorState("DoorsTrunk");
        }

        return CarDoorState.DOORS_MISSING;
    }

    // --- 乘员上下车 ---
    // 判断玩家是否可以进出特定座位。
    // 检查车门状态和座位折叠动画阶段。
    // 前排座位（0、1）需要车门打开。
    // 后排座位（2、3）需要车门打开且前排座位向前折叠。
    override bool CrewCanGetThrough(int posIdx)
    {
        switch (posIdx)
        {
            case 0:
                if (GetCarDoorsState("NivaDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatDriver") > 0.5)
                    return false;
                return true;

            case 1:
                if (GetCarDoorsState("NivaCoDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatCoDriver") > 0.5)
                    return false;
                return true;

            case 2:
                if (GetCarDoorsState("NivaDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatDriver") <= 0.5)
                    return false;
                return true;

            case 3:
                if (GetCarDoorsState("NivaCoDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatCoDriver") <= 0.5)
                    return false;
                return true;
        }

        return false;
    }

    // --- 引擎盖附件检查 ---
    // 当引擎盖关闭时，阻止玩家取出引擎零件。
    override bool CanReleaseAttachment(EntityAI attachment)
    {
        if (!super.CanReleaseAttachment(attachment))
        {
            return false;
        }

        if (EngineIsOn() || GetCarDoorsState("NivaHood") == CarDoorState.DOORS_CLOSED)
        {
            string attType = attachment.GetType();
            if (attType == "CarRadiator" || attType == "CarBattery" || attType == "SparkPlug")
            {
                return false;
            }
        }

        return true;
    }

    // --- 货物访问 ---
    // 后备箱必须打开才能访问载具货物。
    override bool CanDisplayCargo()
    {
        if (!super.CanDisplayCargo())
        {
            return false;
        }

        if (GetCarDoorsState("NivaTrunk") == CarDoorState.DOORS_CLOSED)
        {
            return false;
        }

        return true;
    }

    // --- 引擎舱访问 ---
    // 引擎盖必须打开才能看到引擎附件槽位。
    override bool CanDisplayAttachmentCategory(string category_name)
    {
        if (!super.CanDisplayAttachmentCategory(category_name))
        {
            return false;
        }

        category_name.ToLower();
        if (category_name.Contains("engine"))
        {
            if (GetCarDoorsState("NivaHood") == CarDoorState.DOORS_CLOSED)
            {
                return false;
            }
        }

        return true;
    }

    // --- 调试生成 ---
    // 从调试菜单生成时调用。生成时所有零件已安装
    // 且液位已满，便于立即测试。
    override void OnDebugSpawn()
    {
        SpawnUniversalParts();
        SpawnAdditionalItems();
        FillUpCarFluids();

        GameInventory inventory = GetInventory();
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");

        inventory.CreateInInventory("HatchbackDoors_Driver");
        inventory.CreateInInventory("HatchbackDoors_CoDriver");
        inventory.CreateInInventory("HatchbackHood");
        inventory.CreateInInventory("HatchbackTrunk");

        // 货物中的备用轮
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
    }
};
```

### 理解关键覆盖

**GetAnimInstance** -- 返回玩家坐在载具中时使用的动画集。枚举值包括：

| 值 | 常量 | 载具类型 |
|-------|----------|-------------|
| 0 | `CIVVAN` | 厢式货车 |
| 1 | `V3S` | V3S 卡车 |
| 2 | `SEDAN` | Olga 轿车 |
| 3 | `HATCHBACK` | Niva 掀背车 |
| 5 | `S120` | Sarka 120 |
| 7 | `GOLF` | Gunter 2 |
| 8 | `HMMWV` | Humvee |

如果你将此值设置为错误的值，玩家的动画会穿过载具或看起来不正确。始终匹配你使用的模型。

**CrewCanGetThrough** -- 每帧调用以判断玩家是否可以进出座位。Niva 的后排座位（索引 2 和 3）与前排座位的工作方式不同：前排座椅靠背必须向前折叠（动画阶段 > 0.5），后排乘客才能通过。这模拟了现实中两门掀背车的行为，后排乘客必须倾斜前排座位。

**OnDebugSpawn** -- 当你使用调试生成菜单时调用。`SpawnUniversalParts()` 添加前灯灯泡和汽车电池。`FillUpCarFluids()` 将燃油、冷却液、机油和制动液填充至最大值。然后我们创建车轮、车门、引擎盖和后备箱盖。这为你提供了一辆可以立即驾驶的测试载具。

---

## 步骤 4：types.xml 条目

### 载具生成配置

`types.xml` 中的载具使用与物品相同的格式，但有一些重要区别。将以下内容添加到你服务器的 `types.xml` 中：

```xml
<type name="MFM_RallyHatchback">
    <nominal>3</nominal>
    <lifetime>3888000</lifetime>
    <restock>0</restock>
    <min>1</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="vehicles" />
    <usage name="Coast" />
    <usage name="Farm" />
    <usage name="Village" />
    <value name="Tier1" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

### types.xml 中载具与物品的区别

| 设置 | 物品 | 载具 |
|---------|-------|----------|
| `nominal` | 10-50+ | 1-5（载具很稀有） |
| `lifetime` | 3600-14400 | 3888000（45 天——载具存在时间很长） |
| `restock` | 1800 | 0（载具不会自动补充；只有在之前的载具被摧毁并消失后才会重新生成） |
| `category` | `tools`、`weapons` 等 | `vehicles` |

### 使用 cfgspawnabletypes.xml 预装配零件

载具默认以空壳状态生成——没有车轮、车门或引擎零件。要使它们在生成时预装配零件，在服务器任务文件夹的 `cfgspawnabletypes.xml` 中添加条目：

```xml
<type name="MFM_RallyHatchback">
    <attachments chance="1.00">
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.60" />
        <item name="HatchbackWheel" chance="0.40" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackDoors_Driver" chance="0.50" />
        <item name="HatchbackDoors_CoDriver" chance="0.50" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackHood" chance="0.60" />
        <item name="HatchbackTrunk" chance="0.60" />
    </attachments>
    <attachments chance="0.70">
        <item name="CarBattery" chance="0.30" />
        <item name="SparkPlug" chance="0.30" />
    </attachments>
    <attachments chance="0.50">
        <item name="CarRadiator" chance="0.40" />
    </attachments>
    <attachments chance="0.30">
        <item name="HeadlightH7" chance="0.50" />
        <item name="HeadlightH7" chance="0.50" />
    </attachments>
</type>
```

### cfgspawnabletypes 的工作方式

每个 `<attachments>` 块独立计算：
- 外层的 `chance` 决定这组附件是否被考虑
- 其中每个 `<item>` 都有自己的 `chance` 来决定是否被放置
- 物品被放入载具上第一个可用的匹配槽位

这意味着一辆载具可能带着 3 个车轮和无车门生成，或者带着所有车轮和电池但没有火花塞。这创造了搜刮的游戏循环——玩家必须找到缺失的零件。

---

## 步骤 5：构建和测试

### 打包 PBO

这个模组需要两个 PBO：

```
@MyFirstMod/
    mod.cpp
    Addons/
        Scripts.pbo          <-- 包含 Scripts/config.cpp 和 4_World/
        Data.pbo             <-- 包含 Data/config.cpp 和 Textures/
```

使用 DayZ Tools 中的 Addon Builder：
1. **Scripts PBO：** Source = `MyFirstMod/Scripts/`，Prefix = `MyFirstMod/Scripts`
2. **Data PBO：** Source = `MyFirstMod/Data/`，Prefix = `MyFirstMod/Data`

或者在开发期间使用文件补丁：

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

### 使用脚本控制台生成载具

1. 加载你的模组启动 DayZ
2. 加入你的服务器或启动离线模式
3. 打开脚本控制台
4. 在你的角色附近生成一辆完整装备的载具：

```c
EntityAI vehicle;
vector pos = GetGame().GetPlayer().GetPosition();
pos[2] = pos[2] + 5;
vehicle = EntityAI.Cast(GetGame().CreateObject("MFM_RallyHatchback", pos, false, false, true));
```

5. 按 **Execute**

载具应该出现在你前方 5 米处。

### 生成即可驾驶的载具

为了更快的测试，生成载具并使用调试生成方法来装配所有零件：

```c
vector pos = GetGame().GetPlayer().GetPosition();
pos[2] = pos[2] + 5;
Object obj = GetGame().CreateObject("MFM_RallyHatchback", pos, false, false, true);
CarScript car = CarScript.Cast(obj);
if (car)
{
    car.OnDebugSpawn();
}
```

这会调用你的 `OnDebugSpawn()` 覆盖，它会填充液位并装配车轮、车门、引擎盖和后备箱盖。

### 测试内容

| 检查项 | 注意事项 |
|-------|-----------------|
| **载具生成** | 在世界中出现，脚本日志无错误 |
| **贴图应用** | 自定义车身颜色可见（如果使用了自定义贴图） |
| **引擎启动** | 上车，按住引擎启动键。聆听启动声音。 |
| **驾驶** | 加速、最高速度、操控感与原版不同 |
| **车门** | 可以开关驾驶员和副驾驶车门 |
| **引擎盖/后备箱** | 可以打开引擎盖访问引擎零件。可以打开后备箱存取货物。 |
| **后排座位** | 折叠前排座位，然后进入后排座位 |
| **油耗** | 驾驶并观察燃油表 |
| **损坏** | 射击载具。零件应该受到伤害并最终损坏。 |
| **灯光** | 前灯和尾灯在夜间正常工作 |

### 查看脚本日志

如果载具未生成或行为不正确，请检查脚本日志：

```
%localappdata%\DayZ\<YourProfile>\script.log
```

常见错误：

| 日志消息 | 原因 |
|-------------|-------|
| `Cannot create object type MFM_RallyHatchback` | config.cpp 类名不匹配或 Data PBO 未加载 |
| `Undefined variable 'OffroadHatchback'` | `requiredAddons` 缺少 `"DZ_Vehicles_Wheeled"` |
| `Member not found` 方法调用 | 覆盖方法名拼写错误 |

---

## 步骤 6：完善

### 自定义喇叭声音

要给你的载具一个独特的喇叭声，在你的 Data config.cpp 中定义自定义声音集：

```cpp
class CfgSoundShaders
{
    class MFM_RallyHorn_SoundShader
    {
        samples[] = {{ "MyFirstMod\Data\Sounds\rally_horn", 1 }};
        volume = 1.0;
        range = 150;
        limitation = 0;
    };
    class MFM_RallyHornShort_SoundShader
    {
        samples[] = {{ "MyFirstMod\Data\Sounds\rally_horn_short", 1 }};
        volume = 1.0;
        range = 100;
        limitation = 0;
    };
};

class CfgSoundSets
{
    class MFM_RallyHorn_SoundSet
    {
        soundShaders[] = { "MFM_RallyHorn_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 1;
    };
    class MFM_RallyHornShort_SoundSet
    {
        soundShaders[] = { "MFM_RallyHornShort_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 1;
    };
};
```

然后在你的脚本构造函数中引用它们：

```c
m_CarHornShortSoundName = "MFM_RallyHornShort_SoundSet";
m_CarHornLongSoundName  = "MFM_RallyHorn_SoundSet";
```

声音文件必须是 `.ogg` 格式。`samples[]` 中的路径不包含文件扩展名。

### 自定义前灯

你可以创建自定义灯光类来更改前灯的亮度、颜色或范围：

```c
class MFM_RallyFrontLight extends CarLightBase
{
    void MFM_RallyFrontLight()
    {
        // 近光灯（分离式）
        m_SegregatedBrightness = 7;
        m_SegregatedRadius = 65;
        m_SegregatedAngle = 110;
        m_SegregatedColorRGB = Vector(0.9, 0.9, 1.0);

        // 远光灯（聚合式）
        m_AggregatedBrightness = 14;
        m_AggregatedRadius = 90;
        m_AggregatedAngle = 120;
        m_AggregatedColorRGB = Vector(0.9, 0.9, 1.0);

        FadeIn(0.3);
        SetFadeOutTime(0.25);

        SegregateLight();
    }
};
```

在你的载具类中覆盖：

```c
override CarLightBase CreateFrontLight()
{
    return CarLightBase.Cast(ScriptedLightBase.CreateLight(MFM_RallyFrontLight));
}
```

### 隔音效果（OnSound）

`OnSound` 覆盖根据车门和车窗状态控制车厢对引擎噪音的隔音程度：

```c
override float OnSound(CarSoundCtrl ctrl, float oldValue)
{
    switch (ctrl)
    {
    case CarSoundCtrl.DOORS:
        float newValue = 0;
        if (GetCarDoorsState("NivaDriverDoors") == CarDoorState.DOORS_CLOSED)
        {
            newValue = newValue + 0.5;
        }
        if (GetCarDoorsState("NivaCoDriverDoors") == CarDoorState.DOORS_CLOSED)
        {
            newValue = newValue + 0.5;
        }
        if (GetCarDoorsState("NivaTrunk") == CarDoorState.DOORS_CLOSED)
        {
            newValue = newValue + 0.3;
        }
        if (GetHealthLevel("WindowFront") == GameConstants.STATE_RUINED)
        {
            newValue = newValue - 0.6;
        }
        if (GetHealthLevel("WindowLR") == GameConstants.STATE_RUINED)
        {
            newValue = newValue - 0.2;
        }
        if (GetHealthLevel("WindowRR") == GameConstants.STATE_RUINED)
        {
            newValue = newValue - 0.2;
        }
        return Math.Clamp(newValue, 0, 1);
    }

    return super.OnSound(ctrl, oldValue);
}
```

值 `1.0` 表示完全隔音（安静的车厢），`0.0` 表示无隔音（露天感觉）。

---

## 完整代码参考

### 最终目录结构

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_RallyHatchback.c
    Data/
        config.cpp
        Textures/
            rally_body_co.paa
        Sounds/
            rally_horn.ogg           （可选）
            rally_horn_short.ogg     （可选）
```

### MyFirstMod/mod.cpp

```cpp
name = "My First Mod";
author = "YourName";
version = "1.2";
overview = "My first DayZ mod with a custom rally hatchback vehicle.";
```

### MyFirstMod/Scripts/config.cpp

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
            "DZ_Data",
            "DZ_Vehicles_Wheeled"
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

        dependencies[] = { "World" };

        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/4_World" };
            };
        };
    };
};
```

### 服务器任务 types.xml 条目

```xml
<type name="MFM_RallyHatchback">
    <nominal>3</nominal>
    <lifetime>3888000</lifetime>
    <restock>0</restock>
    <min>1</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="vehicles" />
    <usage name="Coast" />
    <usage name="Farm" />
    <usage name="Village" />
    <value name="Tier1" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

### 服务器任务 cfgspawnabletypes.xml 条目

```xml
<type name="MFM_RallyHatchback">
    <attachments chance="1.00">
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.60" />
        <item name="HatchbackWheel" chance="0.40" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackDoors_Driver" chance="0.50" />
        <item name="HatchbackDoors_CoDriver" chance="0.50" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackHood" chance="0.60" />
        <item name="HatchbackTrunk" chance="0.60" />
    </attachments>
    <attachments chance="0.70">
        <item name="CarBattery" chance="0.30" />
        <item name="SparkPlug" chance="0.30" />
    </attachments>
    <attachments chance="0.50">
        <item name="CarRadiator" chance="0.40" />
    </attachments>
    <attachments chance="0.30">
        <item name="HeadlightH7" chance="0.50" />
        <item name="HeadlightH7" chance="0.50" />
    </attachments>
</type>
```

---

## 最佳实践

- **始终扩展现有的载具类。** 从零开始创建载具需要具有正确几何 LOD、代理、记忆点和物理模拟配置的自定义 3D 模型。扩展原版载具可以免费获得所有这些。
- **先用 `OnDebugSpawn()` 测试。** 在设置 types.xml 和 cfgspawnabletypes.xml 之前，通过调试菜单或脚本控制台生成完整装备的载具来验证其是否正常工作。
- **保持与父类相同的 `GetAnimInstance()`。** 如果在没有匹配动画集的情况下更改此值，玩家会出现 T-pose 或穿过载具。
- **不要更改车门槽位名称。** Niva 使用 `NivaDriverDoors`、`NivaCoDriverDoors`、`NivaHood`、`NivaTrunk`。这些与模型的代理名称和库存槽位定义绑定。在不更改模型的情况下更改它们会破坏车门功能。
- **对内部基类使用 `scope = 0`。** 如果你创建了一个其他变体继承的抽象基础载具，设置 `scope = 0` 使其永远不会直接生成。
- **正确设置 `requiredAddons`。** 你的 Data config.cpp 必须列出 `"DZ_Vehicles_Wheeled"`，这样父类 `OffroadHatchback` 才会在你的类之前加载。
- **彻底测试车门逻辑。** 进出每个座位，开关每扇门，尝试在引擎盖关闭时访问引擎舱。CrewCanGetThrough 的 bug 是最常见的载具模组问题。

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| config.cpp 中的 `SimulationModule` | 完全控制载具物理 | 在扩展父类时，并非所有参数都能干净地覆盖。如果你的速度/扭矩更改似乎没有效果，尝试调整 `transmissionRatio` 和齿轮 `ratios[]`，而不仅仅是 `torqueMax`。 |
| 带有 `componentNames[]` 的伤害区域 | 每个区域映射到一个几何组件 | 扩展原版载具时，父模型的组件名称已经设置好了。你在 config 中的 `componentNames[]` 值只在提供自定义模型时才重要。父级的几何 LOD 决定实际的碰撞检测。 |
| 通过隐藏选区的自定义贴图 | 自由替换任何贴图 | 只有模型作者标记为 "hidden" 的选区才能被覆盖。如果你需要重新贴图一个不在 `hiddenSelections[]` 中的部分，你必须创建新模型或在 Object Builder 中修改现有模型。 |
| `cfgspawnabletypes.xml` 中的预装配零件 | 物品附加到匹配的槽位 | 如果车轮类与载具不兼容（错误的附件槽位），它会静默失败。始终使用父载具接受的零件——对于 Niva，这意味着 `HatchbackWheel`，而不是 `CivSedanWheel`。 |
| 引擎声音 | 设置任何 SoundSet 名称 | 声音集必须在加载的配置中的 `CfgSoundSets` 某处定义。如果你引用了一个不存在的声音集，引擎会静默回退到无声——日志中没有错误。 |

---

## 你学到了什么

在本教程中你学到了：

- 如何通过在 config.cpp 中扩展现有的原版载具来定义自定义载具类
- 伤害区域的工作方式以及如何为每个载具组件配置生命值
- 载具隐藏选区如何在不需要自定义 3D 模型的情况下重新贴图车身
- 如何编写包含车门状态逻辑、乘员进出检查和引擎行为的载具脚本
- `types.xml` 和 `cfgspawnabletypes.xml` 如何协同工作以实现带有随机预装配零件的载具生成
- 如何使用脚本控制台和 `OnDebugSpawn()` 方法在游戏中测试载具
- 如何为喇叭添加自定义声音以及为前灯添加自定义灯光类

**下一步：** 用自定义车门模型、内饰贴图，甚至使用 Blender 和 Object Builder 创建全新的载具车身来扩展你的载具模组。

---

## 常见错误

### 载具生成后立即掉入地面

物理几何体未加载。这通常意味着 `requiredAddons[]` 缺少 `"DZ_Vehicles_Wheeled"`，导致父类的物理配置未被继承。

### 载具生成但无法进入

检查 `GetAnimInstance()` 是否返回了你模型的正确枚举值。如果你扩展了 `OffroadHatchback` 但返回 `VehicleAnimInstances.SEDAN`，进入动画会指向错误的车门位置，玩家无法上车。

### 车门无法打开或关闭

验证 `GetCarDoorsState()` 使用了正确的槽位名称。Niva 使用 `"NivaDriverDoors"`、`"NivaCoDriverDoors"`、`"NivaHood"` 和 `"NivaTrunk"`。这些必须完全匹配，包括大小写。

### 引擎启动但载具不移动

检查你的 `SimulationModule` 齿轮比。如果 `ratios[]` 为空或值为零，载具没有前进挡。同时验证车轮是否已安装——没有车轮的载具会空转但不会移动。

### 载具没有声音

引擎声音在构造函数中分配。如果你拼错了 SoundSet 名称（例如 `"offroad_engine_Start_SoundSet"` 而不是 `"offroad_engine_start_SoundSet"`），引擎会静默使用无声音。声音集名称区分大小写。

### 自定义贴图不显示

按顺序验证三件事：（1）隐藏选区名称与模型完全匹配，（2）贴图路径在 config.cpp 中使用反斜杠，（3）`.paa` 文件在打包的 PBO 中。如果在开发期间使用文件补丁，确保路径从模组根目录开始，而不是绝对路径。

### 后排乘客无法进入

Niva 的后排座位需要前排座位向前折叠。如果你对座位索引 2 和 3 的 `CrewCanGetThrough()` 覆盖没有检查 `GetAnimationPhase("SeatDriver")` 和 `GetAnimationPhase("SeatCoDriver")`，后排乘客将永久被锁定在外。

### 载具在多人游戏中生成时没有零件

`OnDebugSpawn()` 仅用于调试/测试。在真正的服务器上，零件来自 `cfgspawnabletypes.xml`。如果你的载具以空壳状态生成，请添加步骤 4 中描述的 `cfgspawnabletypes.xml` 条目。

---

**上一章：** [第 8.9 章：专业模组模板](09-professional-template.md)
