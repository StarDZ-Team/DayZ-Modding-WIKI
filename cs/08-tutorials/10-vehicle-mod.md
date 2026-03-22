# Chapter 8.10: Creating a Custom Vehicle Mod

> **Shrnuti:** This tutorial walks you through creating a custom vehicle variant in DayZ by extending an existing vanilla vehicle. You will define the vehicle in config.cpp, customize its stats and textures, write script behavior for doors and engine, add it to the server spawn table with pre-attached parts, and test it in-game. By the end, you will have a fully drivable custom Offroad Hatchback variant with modified performance and appearance.

---

## Obsah

- [What We Are Building](#what-we-are-building)
- [Predpoklady](#prerequisites)
- [Step 1: Create the Config (config.cpp)](#step-1-create-the-config-configcpp)
- [Step 2: Custom Textures](#step-2-custom-textures)
- [Step 3: Script Behavior (CarScript)](#step-3-script-behavior-carscript)
- [Step 4: types.xml Entry](#step-4-typesxml-entry)
- [Step 5: Build and Test](#step-5-build-and-test)
- [Step 6: Polish](#step-6-polish)
- [Complete Code Reference](#complete-code-reference)
- [Doporucene postupy](#best-practices)
- [Teorie vs praxe](#theory-vs-practice)
- [What You Learned](#what-you-learned)
- [Caste chyby](#common-mistakes)

---

## What We Are Building

We will create a vehicle called **MFM Rally Hatchback** -- a modified version of the vanilla Offroad Hatchback (the Niva) with:

- Custom retextured body panels using hidden selections
- Modified engine performance (faster top speed, higher fuel consumption)
- Adjusted damage zone health values (tougher engine, weaker doors)
- All standard vehicle behavior: opening doors, engine start/stop, fuel, lights, crew entry/exit
- Spawn table entry with pre-attached wheels and parts

We extend `OffroadHatchback` rather than building a vehicle from scratch. This is the standard workflow for vehicle mods because it inherits the model, animations, physics geometry, and all existing behavior. You only override what you want to change.

---

## Predpoklady

- A working mod structure (complete [Chapter 8.1](01-first-mod.md) and [Chapter 8.2](02-custom-item.md) first)
- A text editor
- DayZ Tools installed (for texture conversion, optional)
- Basic familiarity with how config.cpp class inheritance works

Your mod should have this starting structure:

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
    Data/
        config.cpp
```

---

## Step 1: Create the Config (config.cpp)

Vehicle definitions live in `CfgVehicles`, just like items. Despite the class name, `CfgVehicles` holds everything -- items, buildings, and actual vehicles alike. The key difference for vehicles is the parent class and the additional configuration for damage zones, attachments, and simulation parameters.

### Update Your Data config.cpp

Open `MyFirstMod/Data/config.cpp` and add the vehicle class. If you already have item definitions here from Chapter 8.2, add the vehicle class inside the existing `CfgVehicles` block.

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

        // --- Hidden Selections for retexturing ---
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

        // --- Simulation (physics and engine) ---
        class SimulationModule : SimulationModule
        {
            // Drive type: 0 = RWD, 1 = FWD, 2 = AWD
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

        // --- Damage Zones ---
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

### Key Poles Explained

| Pole | Ucel |
|-------|---------|
| `scope = 2` | Makes the vehicle spawnable. Use `0` for base classes that should never spawn directly. |
| `displayName` | Name shown in admin tools and in-game. You can use `$STR_` references for localization. |
| `requiredAddons[]` | Must include `"DZ_Vehicles_Wheeled"` so the parent class `OffroadHatchback` is loaded before your class. |
| `hiddenSelections[]` | Texture slots on the model you want to override. Must match the model's named selections. |
| `SimulationModule` | Physics and engine configuration. Controls speed, torque, gearing, and braking. |
| `DamageSystem` | Defines health pools for each part of the vehicle (engine, doors, windows, body). |

### About the Parent Class

```cpp
class OffroadHatchback;
```

This forward declaration tells the config parser that `OffroadHatchback` exists in vanilla DayZ. Your vehicle then inherits from it, getting the complete Niva model, animations, physics geometry, attachment points, and proxy definitions. You only need to override what you want to change.

Other vanilla vehicle parent classes you could extend:

| Parent Class | Vehicle |
|-------------|---------|
| `OffroadHatchback` | Niva (4-seat hatchback) |
| `CivilianSedan` | Olga (4-seat sedan) |
| `Hatchback_02` | Golf/Gunter (4-seat hatchback) |
| `Sedan_02` | Sarka 120 (4-seat sedan) |
| `Offroad_02` | Humvee (4-seat offroad) |
| `Truck_01_Base` | V3S (truck) |

### About SimulationModule

The `SimulationModule` controls how the vehicle drives. Key parameters:

| Parametr | Effect |
|-----------|--------|
| `drive` | `0` = rear-wheel drive, `1` = front-wheel drive, `2` = all-wheel drive |
| `torqueMax` | Peak engine torque in Nm. Higher = more acceleration. Vanilla Niva is ~114. |
| `powerMax` | Peak horsepower. Higher = faster top speed. Vanilla Niva is ~68. |
| `rpmRedline` | Engine redline RPM. Beyond this, the engine bounces off the rev limiter. |
| `ratios[]` | Gear ratios. Lower numbers = taller gears = higher top speed but slower acceleration. |
| `transmissionRatio` | Final drive ratio. Acts as a multiplier on all gears. |

### About DamageZones

Each damage zone has its own health pool. When a zone's health reaches zero, that component is ruined:

| Zone | Effect When Ruined |
|------|-------------------|
| `Engine` | Vehicle cannot start |
| `FuelTank` | Fuel leaks out |
| `Front` / `Rear` | Visual damage, reduced protection |
| `Door_1_1` / `Door_2_1` | Door falls off |
| `WindowFront` | Window shatters (affects sound insulation) |

The `transferToGlobalCoef` value determines how much damage transfers from this zone to the vehicle's global health. `1` means 100% transfer (engine damage hurts overall health), `0` means no transfer.

The `componentNames[]` must match named components in the vehicle's geometry LOD. Since we inherit the Niva model, we use placeholder names here -- the parent class's geometry components are what actually matter for collision detection. If you are using the vanilla model without modification, the parent's component mapping applies automatically.

---

## Step 2: Custom Textures

### How Vehicle Hidden Selections Work

Vehicle hidden selections work the same way as item textures, but vehicles typically have more selection slots. The Offroad Hatchback model uses selections for different body panels, allowing color variants (White, Blue) in vanilla.

### Using Vanilla Textures (Fastest Start)

For initial testing, point your hidden selections at existing vanilla textures. This confirms your config works before you create custom art:

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

Empty strings `""` mean "use the model's default texture for this selection."

### Creating a Custom Texture Set

To create a unique appearance:

1. **Extract the vanilla texture** using DayZ Tools' Addon Builder or P: drive to find:
   ```
   P:\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa
   ```

2. **Convert to editable format** using TexView2:
   - Open the `.paa` file in TexView2
   - Export as `.tga` or `.png`

3. **Edit in your image editor** (GIMP, Photoshop, Paint.NET):
   - Vehicle textures are typically **2048x2048** or **4096x4096**
   - Modify colors, add decals, racing stripes, or rust effects
   - Keep the UV layout intact -- only change colors and details

4. **Convert back to `.paa`**:
   - Open your edited image in TexView2
   - Save as `.paa` format
   - Save to `MyFirstMod/Data/Textures/rally_body_co.paa`

### Texture Naming Conventions for Vehicles

| Suffix | Typ | Ucel |
|--------|------|---------|
| `_co` | Color (Diffuse) | Main color and appearance |
| `_nohq` | Normal Map | Surface bumps, panel lines, rivet detail |
| `_smdi` | Specular | Metallic shine, paint reflections |
| `_as` | Alpha/Surface | Transparency for windows |
| `_de` | Destruct | Damage overlay textures |

For a first vehicle mod, only the `_co` texture is required. The model uses its default normal and specular maps.

### Matching Materials (Optional)

For full material control, create an `.rvmat` file:

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

## Step 3: Script Behavior (CarScript)

Vehicle script classes control engine sounds, door logic, crew entry/exit behavior, and seat animations. Since we extend `OffroadHatchback`, we inherit all vanilla behavior and only override what we want to customize.

### Create the Script File

Create the folder structure and script file:

```
MyFirstMod/
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_RallyHatchback.c
```

### Update Scripts config.cpp

Your `Scripts/config.cpp` must register the `4_World` layer so the engine loads your script:

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

### Write the Vehicle Script

Create `4_World/MyFirstMod/MFM_RallyHatchback.c`:

```c
class MFM_RallyHatchback extends OffroadHatchback
{
    void MFM_RallyHatchback()
    {
        // Override engine sounds (reuse vanilla Niva sounds)
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

        // Engine position in model space (x, y, z) -- used for
        // temperature source, drowning detection, and particle effects
        SetEnginePos("0 0.7 1.2");
    }

    // --- Animation Instance ---
    // Determines which player animation set is used when entering/exiting.
    // Must match the vehicle skeleton. Since we use the Niva model, keep HATCHBACK.
    override int GetAnimInstance()
    {
        return VehicleAnimInstances.HATCHBACK;
    }

    // --- Camera Distance ---
    // How far the third-person camera sits behind the vehicle.
    // Vanilla Niva is 3.5. Increase for a wider view.
    override float GetTransportCameraDistance()
    {
        return 4.0;
    }

    // --- Seat Animation Types ---
    // Maps each seat index to a player animation type.
    // 0 = driver, 1 = co-driver, 2 = rear left, 3 = rear right.
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

    // --- Door State ---
    // Returns whether a door is missing, open, or closed.
    // Slot names (NivaDriverDoors, NivaCoDriverDoors, NivaHood, NivaTrunk)
    // are defined by the model's inventory slot proxies.
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

    // --- Crew Entry/Exit ---
    // Determines whether a player can get in or out of a specific seat.
    // Checks door state and seat-fold animation phase.
    // Front seats (0, 1) require the door to be open.
    // Rear seats (2, 3) require the door open AND the front seat folded forward.
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

    // --- Hood Check for Attachments ---
    // Prevents players from removing engine parts when the hood is closed.
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

    // --- Cargo Access ---
    // Trunk must be open to access vehicle cargo.
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

    // --- Engine Compartment Access ---
    // Hood must be open to see engine attachment slots.
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

    // --- Debug Spawn ---
    // Called when spawning from debug menu. Spawns with all parts attached
    // and fluids filled for immediate testing.
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

        // Spare wheels in cargo
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
    }
};
```

### Understanding Key Overrides

**GetAnimInstance** -- Vraci which animation set the player uses when sitting in the vehicle. The enum values are:

| Hodnota | Konstanta | Vehicle Typ |
|-------|----------|-------------|
| 0 | `CIVVAN` | Van |
| 1 | `V3S` | V3S Truck |
| 2 | `SEDAN` | Olga Sedan |
| 3 | `HATCHBACK` | Niva Hatchback |
| 5 | `S120` | Sarka 120 |
| 7 | `GOLF` | Gunter 2 |
| 8 | `HMMWV` | Humvee |

If you change this to the wrong value, the player's animation will clip through the vehicle or look incorrect. Always match the model you are using.

**CrewCanGetThrough** -- This is called every frame to determine if a player can enter or exit a seat. The Niva's rear seats (indices 2 and 3) work differently from the front seats: the front seatback must be folded forward (animation phase > 0.5) before rear passengers can get through. This matches the real-world behavior of a 2-door hatchback where rear passengers must tilt the front seat.

**OnDebugSpawn** -- Called when you use the debug spawn menu. `SpawnUniversalParts()` adds headlight bulbs and a car battery. `FillUpCarFluids()` fills fuel, coolant, oil, and brake fluid to maximum. We then create wheels, doors, hood, and trunk. This gives you an immediately drivable vehicle for testing.

---

## Step 4: types.xml Entry

### Vehicle Spawn Configuration

Vehicles in `types.xml` use the same format as items, but with some important differences. Add this to your server's `types.xml`:

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

### Vehicle vs Item Differences in types.xml

| Setting | Items | Vehicles |
|---------|-------|----------|
| `nominal` | 10-50+ | 1-5 (vehicles are rare) |
| `lifetime` | 3600-14400 | 3888000 (45 days -- vehicles persist a long time) |
| `restock` | 1800 | 0 (vehicles do not restock automatically; they respawn only after the previous one is destroyed and despawned) |
| `category` | `tools`, `weapons`, etc. | `vehicles` |

### Pre-Attached Parts with cfgspawnabletypes.xml

Vehicles spawn as empty shells by default -- no wheels, doors, or engine parts. To make them spawn with parts pre-attached, add entries to `cfgspawnabletypes.xml` in the server mission folder:

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

### How cfgspawnabletypes Works

Each `<attachments>` block is evaluated independently:
- The outer `chance` determines if this group of attachments is considered at all
- Each `<item>` within has its own `chance` of being placed
- Items are placed into the first available matching slot on the vehicle

This means a vehicle might spawn with 3 wheels and no doors, or with all wheels and a battery but no spark plug. This creates the scavenging gameplay loop -- players must find the missing parts.

---

## Step 5: Build and Test

### Pack the PBOs

You need two PBOs for this mod:

```
@MyFirstMod/
    mod.cpp
    Addons/
        Scripts.pbo          <-- Contains Scripts/config.cpp and 4_World/
        Data.pbo             <-- Contains Data/config.cpp and Textures/
```

Use Addon Builder from DayZ Tools:
1. **Scripts PBO:** Source = `MyFirstMod/Scripts/`, Prefix = `MyFirstMod/Scripts`
2. **Data PBO:** Source = `MyFirstMod/Data/`, Prefix = `MyFirstMod/Data`

Or use file patching during development:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

### Spawn the Vehicle Using the Script Console

1. Launch DayZ with your mod loaded
2. Join your server or start offline mode
3. Open the script console
4. To spawn a fully equipped vehicle near your character:

```c
EntityAI vehicle;
vector pos = GetGame().GetPlayer().GetPosition();
pos[2] = pos[2] + 5;
vehicle = EntityAI.Cast(GetGame().CreateObject("MFM_RallyHatchback", pos, false, false, true));
```

5. Press **Execute**

The vehicle should appear 5 meters in front of you.

### Spawn a Ready-to-Drive Vehicle

For faster testing, spawn the vehicle and use the debug spawn method that attaches all parts:

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

This calls your `OnDebugSpawn()` override, which fills fluids and attaches wheels, doors, hood, and trunk.

### What to Test

| Check | What to Look For |
|-------|-----------------|
| **Vehicle spawns** | Appears in the world without errors in the script log |
| **Textures applied** | Custom body color is visible (if using custom textures) |
| **Engine starts** | Get in, hold the engine start key. Listen for start sound. |
| **Driving** | Acceleration, top speed, handling feel different from vanilla |
| **Doors** | Can open/close driver and co-driver doors |
| **Hood/Trunk** | Can open hood to access engine parts. Can open trunk for cargo. |
| **Rear seats** | Fold front seat, then enter rear seat |
| **Fuel consumption** | Drive and watch the fuel gauge |
| **Damage** | Shoot the vehicle. Parts should take damage and eventually break. |
| **Lights** | Headlights and rear lights work at night |

### Reading the Script Log

If the vehicle does not spawn or behaves incorrectly, check the script log at:

```
%localappdata%\DayZ\<YourProfile>\script.log
```

Common errors:

| Log Zprava | Pricina |
|-------------|-------|
| `Cannot create object type MFM_RallyHatchback` | config.cpp class name mismatch or Data PBO not loaded |
| `Undefined variable 'OffroadHatchback'` | `requiredAddons` missing `"DZ_Vehicles_Wheeled"` |
| `Member not found` on method call | Typo in override method name |

---

## Step 6: Polish

### Custom Horn Sound

To give your vehicle a unique horn, define custom sound sets in your Data config.cpp:

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

Then reference them in your script constructor:

```c
m_CarHornShortSoundName = "MFM_RallyHornShort_SoundSet";
m_CarHornLongSoundName  = "MFM_RallyHorn_SoundSet";
```

Sound files must be `.ogg` format. The path in `samples[]` does NOT include the file extension.

### Custom Headlights

You can create a custom light class to change headlight brightness, color, or range:

```c
class MFM_RallyFrontLight extends CarLightBase
{
    void MFM_RallyFrontLight()
    {
        // Low beam (segregated)
        m_SegregatedBrightness = 7;
        m_SegregatedRadius = 65;
        m_SegregatedAngle = 110;
        m_SegregatedColorRGB = Vector(0.9, 0.9, 1.0);

        // High beam (aggregated)
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

Override in your vehicle class:

```c
override CarLightBase CreateFrontLight()
{
    return CarLightBase.Cast(ScriptedLightBase.CreateLight(MFM_RallyFrontLight));
}
```

### Sound Insulation (OnSound)

The `OnSound` override controls how much the cabin muffles engine noise based on door and window state:

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

A value of `1.0` means full insulation (quiet cabin), `0.0` means no insulation (open-air feeling).

---

## Complete Code Reference

### Final Directory Structure

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
            rally_horn.ogg           (optional)
            rally_horn_short.ogg     (optional)
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

### Server Mission types.xml Entry

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

### Server Mission cfgspawnabletypes.xml Entry

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

## Doporucene postupy

- **Always extend an existing vehicle class.** Creating a vehicle from scratch requires a custom 3D model with correct geometry LODs, proxies, memory points, and a physics simulation config. Extending a vanilla vehicle gives you all of this for free.
- **Test with `OnDebugSpawn()` first.** Before setting up types.xml and cfgspawnabletypes.xml, verify the vehicle works by spawning it fully equipped via the debug menu or script console.
- **Keep the same `GetAnimInstance()` as the parent.** If you change this without a matching animation set, players will T-pose or clip through the vehicle.
- **Do not change door slot names.** The Niva uses `NivaDriverDoors`, `NivaCoDriverDoors`, `NivaHood`, `NivaTrunk`. These are tied to the model's proxy names and inventory slot definitions. Changing them without changing the model will break door functionality.
- **Use `scope = 0` for internal base classes.** If you create an abstract base vehicle that other variants extend, set `scope = 0` so it never spawns directly.
- **Set `requiredAddons` correctly.** Your Data config.cpp must list `"DZ_Vehicles_Wheeled"` so the parent `OffroadHatchback` class loads before yours.
- **Test door logic thoroughly.** Enter/exit every seat, open/close every door, try accessing the engine bay with the hood closed. CrewCanGetThrough bugs are the most common vehicle mod issue.

---

## Teorie vs praxe

| Koncept | Teorie | Realita |
|---------|--------|---------|
| `SimulationModule` in config.cpp | Full control over vehicle physics | Not all parameters override cleanly when extending a parent class. If your speed/torque changes seem to have no effect, try adjusting `transmissionRatio` and gear `ratios[]` instead of just `torqueMax`. |
| Damage zones with `componentNames[]` | Each zone maps to a geometry component | When extending a vanilla vehicle, the parent model's component names are already set. Your `componentNames[]` values in config only matter if you provide a custom model. The parent's geometry LOD determines actual hit detection. |
| Custom textures via hidden selections | Swap any texture freely | Only selections the model author marked as "hidden" can be overridden. If you need to retexture a part not in `hiddenSelections[]`, you must create a new model or modify the existing one in Object Builder. |
| Pre-attached parts in `cfgspawnabletypes.xml` | Items attach to matching slots | If a wheel class is incompatible with the vehicle (wrong attachment slot), it silently fails. Always use parts that the parent vehicle accepts -- for the Niva, that means `HatchbackWheel`, not `CivSedanWheel`. |
| Engine sounds | Set any SoundSet name | Sound sets must be defined in `CfgSoundSets` somewhere in the loaded configs. If you reference a sound set that does not exist, the engine silently falls back to no sound -- no error in the log. |

---

## What You Learned

In this tutorial you learned:

- How to define a custom vehicle class by extending an existing vanilla vehicle in config.cpp
- How damage zones work and how to configure health values for each vehicle component
- How vehicle hidden selections allow retexturing the body without a custom 3D model
- How to write a vehicle script with door state logic, crew entry checks, and engine behavior
- How `types.xml` and `cfgspawnabletypes.xml` work together for vehicle spawning with randomized pre-attached parts
- How to test vehicles in-game using the script console and the `OnDebugSpawn()` method
- How to add custom sounds for horns and custom light classes for headlights

**Dalsi:** Expand your vehicle mod with custom door models, interior textures, or even a completely new vehicle body using Blender and Object Builder.

---

## Caste chyby

### Vehicle Spawns But Immediately Falls Through the Ground

The physics geometry is not loading. This usually means `requiredAddons[]` is missing `"DZ_Vehicles_Wheeled"`, so the parent class physics config is not inherited.

### Vehicle Spawns But Cannot Be Entered

Check that `GetAnimInstance()` returns the correct enum value for your model. If you extend `OffroadHatchback` but return `VehicleAnimInstances.SEDAN`, the entry animation targets the wrong door positions and the player cannot get in.

### Doors Do Not Open or Close

Verify that `GetCarDoorsState()` uses the correct slot names. The Niva uses `"NivaDriverDoors"`, `"NivaCoDriverDoors"`, `"NivaHood"`, and `"NivaTrunk"`. These must match exactly, including capitalization.

### Engine Starts But Vehicle Does Not Move

Check your `SimulationModule` gear ratios. If `ratios[]` is empty or has zero values, the vehicle has no forward gears. Also verify the wheels are attached -- a vehicle with no wheels will rev but not move.

### Vehicle Has No Sound

Engine sounds are assigned in the constructor. If you misspell a SoundSet name (for example `"offroad_engine_Start_SoundSet"` instead of `"offroad_engine_start_SoundSet"`), the engine silently uses no sound. Sound set names are case-sensitive.

### Custom Texture Not Showing

Verify three things in order: (1) the hidden selection name matches the model exactly, (2) the texture path uses backslashes in config.cpp, and (3) the `.paa` file is inside the packed PBO. If using file patching during development, ensure the path starts from the mod root, not an absolute path.

### Rear Seat Passengers Cannot Enter

The Niva rear seats require the front seat to be folded forward. If your `CrewCanGetThrough()` override for seat indices 2 and 3 does not check `GetAnimationPhase("SeatDriver")` and `GetAnimationPhase("SeatCoDriver")`, rear passengers will be permanently locked out.

### Vehicle Spawns Without Parts in Multiplayer

`OnDebugSpawn()` is only for debug/testing. In a real server, parts come from `cfgspawnabletypes.xml`. If your vehicle spawns as a bare shell, add the `cfgspawnabletypes.xml` entry described in Step 4.

---

**Predchozi:** [Chapter 8.9: Professional Mod Template](09-professional-template.md)
