# Chapter 8.11: Creating Custom Clothing

[Home](../README.md) | [<< Previous: Creating a Custom Vehicle](10-vehicle-mod.md) | **Creating Custom Clothing** | [Next: Building a Trading System >>](12-trading-system.md)

---

> **Summary:** This tutorial walks you through creating a custom tactical jacket for DayZ. You will choose a base class, define the clothing in config.cpp with insulation and cargo properties, retexture it with a camo pattern using hidden selections, add localization and spawning, and optionally extend it with scripted behavior. By the end, you will have a wearable jacket that keeps players warm, holds items, and spawns in the world.

---

## Table of Contents

- [What We Are Building](#what-we-are-building)
- [Step 1: Choose a Base Class](#step-1-choose-a-base-class)
- [Step 2: config.cpp for Clothing](#step-2-configcpp-for-clothing)
- [Step 3: Create Textures](#step-3-create-textures)
- [Step 4: Add Cargo Space](#step-4-add-cargo-space)
- [Step 5: Localization and Spawning](#step-5-localization-and-spawning)
- [Step 6: Script Behavior (Optional)](#step-6-script-behavior-optional)
- [Step 7: Build, Test, Polish](#step-7-build-test-polish)
- [Complete Code Reference](#complete-code-reference)
- [Common Mistakes](#common-mistakes)
- [Best Practices](#best-practices)
- [Theory vs Practice](#theory-vs-practice)
- [What You Learned](#what-you-learned)

---

## What We Are Building

We will create a **Tactical Camo Jacket** -- a military-style jacket with woodland camouflage that players can find and wear. It will:

- Extend the vanilla Gorka jacket model (no 3D modeling required)
- Have a custom camo retexture using hidden selections
- Provide warmth through `heatIsolation` values
- Carry items in its pockets (cargo space)
- Take damage with visual degradation across health states
- Spawn at military locations in the world

**Prerequisites:** A working mod structure (complete [Chapter 8.1](01-first-mod.md) and [Chapter 8.2](02-custom-item.md) first), a text editor, DayZ Tools installed (for TexView2), and an image editor for creating camo textures.

---

## Step 1: Choose a Base Class

Clothing in DayZ inherits from `Clothing_Base`, but you almost never extend that directly. DayZ provides intermediate base classes for each body slot:

| Base Class | Body Slot | Examples |
|------------|-----------|----------|
| `Top_Base` | Body (torso) | Jackets, shirts, hoodies |
| `Pants_Base` | Legs | Jeans, cargo pants |
| `Shoes_Base` | Feet | Boots, sneakers |
| `HeadGear_Base` | Head | Helmets, hats |
| `Mask_Base` | Face | Gas masks, balaclavas |
| `Gloves_Base` | Hands | Tactical gloves |
| `Vest_Base` | Vest slot | Plate carriers, chest rigs |
| `Glasses_Base` | Eyewear | Sunglasses |
| `Backpack_Base` | Back | Backpacks, bags |

The full inheritance chain is: `Clothing_Base -> Clothing -> Top_Base -> GorkaEJacket_ColorBase -> YourJacket`

### Why Extend an Existing Vanilla Item

You can extend at different levels:

1. **Extend a specific item** (like `GorkaEJacket_ColorBase`) -- easiest. You inherit the model, animations, slot, and all properties. Only change textures and tweak values. This is what Bohemia's `Test_ClothingRetexture` sample does.
2. **Extend a slot base** (like `Top_Base`) -- clean starting point, but you must specify a model and all properties.
3. **Extend `Clothing` directly** -- only for completely custom slot behavior. Rarely needed.

For our tactical jacket, we will extend `GorkaEJacket_ColorBase`. Looking at the vanilla script:

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

Notice the pattern: a `_ColorBase` class handles shared behavior, and individual color variants extend it with no additional code. Their config.cpp entries provide different textures. We will follow the same pattern.

To find base classes, look in `scripts/4_world/entities/itembase/clothing_base.c` (defines all slot bases) and `scripts/4_world/entities/itembase/clothing/` (one file per clothing family).

---

## Step 2: config.cpp for Clothing

Create `MyClothingMod/Data/config.cpp`:

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

### Clothing-Specific Fields Explained

**Thermal and stealth:**

| Field | Value | Explanation |
|-------|-------|-------------|
| `heatIsolation` | `0.8` | Warmth provided (0.0-1.0 range). The engine multiplies this by health and wetness factors. A pristine dry jacket gives full warmth; a ruined, soaked one gives almost none. |
| `visibilityModifier` | `0.7` | Player visibility to AI (lower = harder to detect). |
| `absorbency` | `0.3` | Water absorption (0 = waterproof, 1 = sponge). Lower is better for rain resistance. |

**Vanilla heatIsolation reference:** T-shirt 0.2, Hoodie 0.5, Gorka Jacket 0.7, Field Jacket 0.8, Wool Coat 0.9.

**Repair:** `repairableWithKits[] = { 5, 2 }` lists kit types (5=Sewing Kit, 2=Leather Sewing Kit). `repairCosts[]` gives material consumed per repair, in matching order.

**Armor:** A `damage` value of 0.8 means the player receives 80% of incoming damage (20% absorbed). Lower values = more protection.

**Wetness:** `Soaking` controls how fast rain/water soaks the item. `Drying` negative values represent moisture loss from body heat, fires, and wringing.

**Hidden selections:** The Gorka model has 3 selections -- index 0 is the ground model, indices 1 and 2 are the worn model. You override `hiddenSelectionsTextures[]` with your custom PAA paths.

**Health levels:** Each entry is `{ healthThreshold, { materialPath } }`. When health drops below a threshold, the engine swaps the material. Vanilla damage rvmats add wear marks and tears.

---

## Step 3: Create Textures

### Finding and Creating Textures

The Gorka jacket textures live at `DZ\characters\tops\data\` -- extract the `gorka_upper_summer_co.paa` (color), `gorka_upper_nohq.paa` (normal), and `gorka_upper_smdi.paa` (specular) from the P: drive to use as templates.

**Creating the camo pattern:**

1. Open the vanilla `_co` texture in TexView2, export as TGA/PNG
2. Paint your woodland camo in your image editor, following the UV layout
3. Keep the same dimensions (typically 2048x2048 or 1024x1024)
4. Save as TGA, convert to PAA using TexView2 (File > Save As > .paa)

### Texture Types

| Suffix | Purpose | Required? |
|--------|---------|-----------|
| `_co` | Main color/pattern | Yes |
| `_nohq` | Normal map (fabric detail) | No -- uses vanilla default |
| `_smdi` | Specular (shininess) | No -- uses vanilla default |
| `_as` | Alpha/surface mask | No |

For a retexture, you only need `_co` textures. The normal and specular maps from the vanilla model continue to work.

For full material control, create `.rvmat` files and reference them in `hiddenSelectionsMaterials[]`. See Bohemia's `Test_ClothingRetexture` sample for working rvmat examples with damage and destruct variants.

---

## Step 4: Add Cargo Space

When extending `GorkaEJacket_ColorBase`, you inherit its cargo grid (4x3) and inventory slot (`"Body"`) automatically. The `itemSize[] = { 3, 4 }` property defines how large the jacket is when stored as loot -- NOT its cargo capacity.

Common clothing slots: `"Body"` (jackets), `"Legs"` (pants), `"Feet"` (boots), `"Headgear"` (hats), `"Vest"` (chest rigs), `"Gloves"`, `"Mask"`, `"Back"` (backpacks).

Some clothing accepts attachments (like Plate Carrier pouches). Add them with `attachments[] = { "Shoulder", "Armband" };`. For a basic jacket, the inherited cargo is sufficient.

---

## Step 5: Localization and Spawning

### Stringtable

Create `MyClothingMod/Data/Stringtable.csv`:

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MCM_TacticalJacket_Woodland","Tactical Jacket (Woodland)","","","","","","","","","","","","",""
"STR_MCM_TacticalJacket_Woodland_Desc","A rugged tactical jacket with woodland camouflage. Provides good insulation and has multiple pockets.","","","","","","","","","","","","",""
```

### Spawning (types.xml)

Add to your server's mission folder `types.xml`:

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

Use `category name="clothes"` for all clothing. Set `usage` to match where the item should spawn (Military, Town, Police, etc.) and `value` for the map tier (Tier1=coast through Tier4=deep inland).

---

## Step 6: Script Behavior (Optional)

For a simple retexture, you do not need scripts. But to add behavior when the jacket is worn, create a script class.

### Scripts config.cpp

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

### Custom Jacket Script

Create `Scripts/4_World/MyClothingMod/MCM_TacticalJacket.c`:

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

### Key Clothing Events

| Event | When It Fires | Common Use |
|-------|---------------|------------|
| `OnWasAttached(parent, slot_id)` | Player equips the item | Apply buffs, show effects |
| `OnWasDetached(parent, slot_id)` | Player unequips the item | Remove buffs, clean up |
| `EEItemAttached(item, slot_name)` | Item attached to this clothing | Show/hide model selections |
| `EEItemDetached(item, slot_name)` | Item detached from this clothing | Reverse visual changes |
| `EEHealthLevelChanged(old, new, zone)` | Health crosses a threshold | Update visual state |

**Important:** Always call `super` at the start of every override. The parent class handles critical engine behavior.

---

## Step 7: Build, Test, Polish

### Build and Spawn

Pack `Data/` and `Scripts/` as separate PBOs. Launch DayZ with your mod and spawn the jacket:

```c
GetGame().GetPlayer().GetInventory().CreateInInventory("MCM_TacticalJacket_Woodland");
```

### Verification Checklist

1. **Does it appear in inventory?** If not, check `scope=2` and class name match.
2. **Correct texture?** Default Gorka texture = wrong paths. White/pink = missing texture file.
3. **Can you equip it?** Should go to Body slot. If not, check the parent class chain.
4. **Display name shows?** If you see raw `$STR_` text, the stringtable is not loading.
5. **Provides warmth?** Check `heatIsolation` in the debug/inspect menu.
6. **Damage degrades visuals?** Test with: `ItemBase.Cast(GetGame().GetPlayer().GetItemOnSlot("Body")).SetHealth("", "", 40);`

### Adding Color Variants

Follow the `_ColorBase` pattern -- add sibling classes that only differ in textures:

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

Each variant needs its own `scope=2`, display name, textures, stringtable entries, and types.xml entry.

---

## Complete Code Reference

### Directory Structure

```
MyClothingMod/
    mod.cpp
    Data/
        config.cpp              <-- Item definitions (see Step 2)
        Stringtable.csv         <-- Display names (see Step 5)
        Textures/
            tactical_jacket_woodland_co.paa
            tactical_jacket_g_woodland_co.paa
    Scripts/                    <-- Only needed for script behavior
        config.cpp              <-- CfgMods entry (see Step 6)
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

All other files are shown in full in their respective steps above.

---

## Common Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Forgetting `scope=2` on variants | Item does not spawn or appear in admin tools | Set `scope=0` on base, `scope=2` on each spawnable variant |
| Wrong texture array count | White/pink textures on some parts | Match `hiddenSelectionsTextures` count to the model's hidden selections (Gorka has 3) |
| Forward slashes in texture paths | Textures fail to load silently | Use backslashes: `"MyMod\Data\tex.paa"` |
| Missing `requiredAddons` | Config parser cannot resolve parent class | Include `"DZ_Characters_Tops"` for tops |
| `heatIsolation` above 1.0 | Player overheats in warm weather | Keep values in 0.0-1.0 range |
| Empty `healthLevels` materials | No visual damage degradation | Always reference at least vanilla rvmats |
| Skipping `super` in overrides | Broken inventory, damage, or attachment behavior | Always call `super.MethodName()` first |

---

## Best Practices

- **Start with a simple retexture.** Get a working mod with a texture swap before adding custom properties or scripts. This isolates config issues from texture issues.
- **Use the _ColorBase pattern.** Shared properties in `scope=0` base, only textures and names in `scope=2` variants. No duplication.
- **Keep insulation values realistic.** Reference vanilla items with similar real-world equivalents.
- **Test with script console before types.xml.** Confirm the item works before debugging spawn tables.
- **Use `$STR_` references for all player-facing text.** Enables future localization without config changes.
- **Pack Data and Scripts as separate PBOs.** Update textures without rebuilding scripts.
- **Provide ground textures.** The `_g_` texture makes dropped items look correct.

---

## Theory vs Practice

| Concept | Theory | Reality |
|---------|--------|---------|
| `heatIsolation` | A simple warmth number | Effective warmth depends on health and wetness. The engine multiplies it by factors in `MiscGameplayFunctions.GetCurrentItemHeatIsolation()`. |
| Armor `damage` values | Lower = more protection | A value of 0.8 means the player receives 80% damage (only 20% absorbed). Many modders read 0.9 as "90% protection" when it is actually 10%. |
| `scope` inheritance | Children inherit parent scope | They do NOT. Each class must explicitly set `scope`. Parent `scope=0` defaults all children to `scope=0`. |
| `absorbency` | Controls rain protection | It controls moisture absorption, which REDUCES warmth. Waterproof = LOW absorbency (0.1). High absorbency (0.8+) = soaks like a sponge. |
| Hidden selections | Work on any model | Not all models expose the same selections. Check with Object Builder or vanilla config before choosing a base model. |

---

## What You Learned

In this tutorial you learned:

- How DayZ clothing inherits from slot-specific base classes (`Top_Base`, `Pants_Base`, etc.)
- How to define a clothing item in config.cpp with thermal, armor, and wetness properties
- How hidden selections allow retexturing vanilla models with custom camo patterns
- How `heatIsolation`, `visibilityModifier`, and `absorbency` affect gameplay
- How the `DamageSystem` controls visual degradation and armor protection
- How to create color variants using the `_ColorBase` pattern
- How to add spawn entries with `types.xml` and display names with `Stringtable.csv`
- How to optionally add script behavior with `OnWasAttached` and `OnWasDetached` events

**Next:** Apply the same techniques to create pants (`Pants_Base`), boots (`Shoes_Base`), or a vest (`Vest_Base`). The config structure is identical -- only the parent class and inventory slot change.

---

**Previous:** [Chapter 8.8: HUD Overlay](08-hud-overlay.md)
**Next:** Coming soon
