# Chapter 2.2: config.cpp Deep Dive

[Home](../README.md) | [<< Previous: The 5-Layer Script Hierarchy](01-five-layers.md) | **config.cpp Deep Dive** | [Next: mod.cpp & Workshop >>](03-mod-cpp.md)

---

## 目次

- [Overview](#overview)
- [Where config.cpp Lives](#where-configcpp-lives)
- [CfgPatches Block](#cfgpatches-block)
- [CfgMods Block](#cfgmods-block)
- [class defs: Script Module Paths](#class-defs-script-module-paths)
- [class defs: imageSets and widgetStyles](#class-defs-imagesets-and-widgetstyles)
- [defines Array](#defines-array)
- [CfgVehicles: Item and Entity Definitions](#cfgvehicles-item-and-entity-definitions)
- [CfgSoundSets and CfgSoundShaders](#cfgsoundsets-and-cfgsoundshaders)
- [CfgAddons: Preload Declarations](#cfgaddons-preload-declarations)
- [Real Examples from Professional Mods](#real-examples-from-professional-mods)
- [Common Mistakes](#common-mistakes)
- [Complete Template](#complete-template)

---

## 概要

A DayZ mod typically has one or more PBO files, each containing a `config.cpp` at its root. The engine reads these configs during startup to determine:

1. **What your mod depends on** (CfgPatches)
2. **Where your scripts are** (CfgMods class defs)
3. **What items/entities it adds** (CfgVehicles, CfgWeapons, etc.)
4. **What sounds it adds** (CfgSoundSets, CfgSoundShaders)
5. **What preprocessor symbols it defines** (defines[])

A mod usually has separate PBOs for different concerns:
- `MyMod/Scripts/config.cpp` -- script definitions and module paths
- `MyMod/Data/config.cpp` -- item/vehicle/weapon definitions
- `MyMod/GUI/config.cpp` -- imageset and style declarations

---

## config.cpp の配置場所

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo         --> contains Scripts/config.cpp
    MyMod_Data.pbo            --> contains Data/config.cpp (items, vehicles)
    MyMod_GUI.pbo             --> contains GUI/config.cpp (imagesets, styles)
```

Each PBO has its own `config.cpp`. The engine reads them all. Multiple PBOs from the same mod are common -- this is standard practice, not an exception.

---

## CfgPatches ブロック

`CfgPatches` is **required** in every config.cpp. It declares a named patch and its dependencies.

### 構文

```cpp
class CfgPatches
{
    class MyMod_Scripts          // Unique patch name (must not collide with other mods)
    {
        units[] = {};            // Entity classnames this PBO adds (for editor/spawner)
        weapons[] = {};          // Weapon classnames this PBO adds
        requiredVersion = 0.1;   // Minimum game version (always 0.1 in practice)
        requiredAddons[] =       // PBO dependencies -- CONTROLS LOAD ORDER
        {
            "DZ_Data"            // Almost always needed
        };
    };
};
```

### requiredAddons: The Dependency Chain

This is the most critical field in the entire config. `requiredAddons` tells the engine:

1. **Load order:** Your PBO's scripts compile AFTER all listed addons
2. **Hard dependency:** If a listed addon is missing, your mod fails to load

Each entry must match a `CfgPatches` class name from another mod:

| Dependency | requiredAddons Entry | When to Use |
|-----------|---------------------|-------------|
| Vanilla DayZ data | `"DZ_Data"` | Almost always (items, configs) |
| Vanilla DayZ scripts | `"DZ_Scripts"` | When extending vanilla script classes |
| Vanilla weapons | `"DZ_Weapons_Firearms"` | When adding weapons/attachments |
| Vanilla magazines | `"DZ_Weapons_Magazines"` | When adding magazines/ammo |
| Community Framework | `"JM_CF_Scripts"` | When using CF module system |
| DabsFramework | `"DF_Scripts"` | When using Dabs MVC/framework |
| MyFramework | `"MyCore_Scripts"` | When building a MyMod mod |

**Example: Multiple dependencies**

```cpp
requiredAddons[] =
{
    "DZ_Scripts",
    "DZ_Data",
    "DZ_Weapons_Firearms",
    "DZ_Weapons_Ammunition",
    "DZ_Weapons_Magazines",
    "MyCore_Scripts"
};
```

### units[] and weapons[]

These arrays list the classnames of entities and weapons defined in this PBO. They serve two purposes:

1. The DayZ editor uses them to populate spawn lists
2. Other tools (like admin panels) use them for item discovery

```cpp
units[] = { "MyMod_SomeBuilding", "MyMod_SomeVehicle" };
weapons[] = { "MyMod_CustomRifle", "MyMod_CustomPistol" };
```

For script-only PBOs, leave both empty.

---

## CfgMods ブロック

`CfgMods` is required when your PBO adds or modifies scripts, inputs, or GUI resources. It defines the mod identity and its script module structure.

### 基本構造

```cpp
class CfgMods
{
    class MyMod                   // Mod identifier (used internally)
    {
        dir = "MyMod";            // Root directory of the mod (PBO prefix path)
        name = "My Mod Name";     // Human-readable name
        author = "AuthorName";    // Author string
        credits = "AuthorName";   // Credits string
        creditsJson = "MyMod/Scripts/Data/Credits.json";  // Path to credits file
        versionPath = "MyMod/Scripts/Data/Version.hpp";   // Path to version file
        overview = "Description"; // Mod description
        picture = "";             // Logo image path
        action = "";              // URL (website/Discord)
        type = "mod";             // "mod" for client, "servermod" for server-only
        extra = 0;                // Reserved, always 0
        hideName = 0;             // Hide mod name in launcher (0 = show, 1 = hide)
        hidePicture = 0;          // Hide mod picture in launcher

        // Keybind definitions (optional)
        inputs = "MyMod/Scripts/Data/Inputs.xml";

        // Preprocessor symbols (optional)
        defines[] = { "MYMOD_LOADED" };

        // Script module dependencies
        dependencies[] = { "Game", "World", "Mission" };

        // Script module paths
        class defs
        {
            // ... (covered in next section)
        };
    };
};
```

### 主要フィールドの説明

**`dir`** -- The root path prefix for all file paths in this config. When the engine sees `files[] = { "MyMod/Scripts/3_Game" }`, it uses `dir` as the base.

**`type`** -- Either `"mod"` (loaded via `-mod=`) or `"servermod"` (loaded via `-servermod=`). Server mods run only on the dedicated server. This is how you separate server-only logic from client code.

**`dependencies`** -- Which vanilla script modules your mod extends. Almost always `{ "Game", "World", "Mission" }`. Possible values: `"Core"`, `"GameLib"`, `"Game"`, `"World"`, `"Mission"`.

**`inputs`** -- Path to an `Inputs.xml` file that defines custom keybindings. The path is relative to the PBO root.

---

## class defs：スクリプトモジュールパス

The `class defs` block inside `CfgMods` is where you tell the engine which folders contain your scripts for each layer.

### 利用可能な全スクリプトモジュール

```cpp
class defs
{
    class engineScriptModule        // 1_Core
    {
        value = "";                 // Entry function (empty = default)
        files[] = { "MyMod/Scripts/1_Core" };
    };
    class gameLibScriptModule       // 2_GameLib (rarely used)
    {
        value = "";
        files[] = { "MyMod/Scripts/2_GameLib" };
    };
    class gameScriptModule          // 3_Game
    {
        value = "";
        files[] = { "MyMod/Scripts/3_Game" };
    };
    class worldScriptModule         // 4_World
    {
        value = "";
        files[] = { "MyMod/Scripts/4_World" };
    };
    class missionScriptModule       // 5_Mission
    {
        value = "";
        files[] = { "MyMod/Scripts/5_Mission" };
    };
};
```

### The `value` Field

The `value` field specifies a custom entry function name for that script module. When empty (`""`), the engine uses the default entry point. When set (e.g., `value = "CreateGameMod"`), the engine calls that global function when initializing the module.

Community Framework uses this:

```cpp
class gameScriptModule
{
    value = "CF_CreateGame";    // Custom entry point
    files[] = { "JM/CF/Scripts/3_Game" };
};
```

For most mods, leave `value` empty.

### The `files` Array

Each entry is a **directory path** (not individual files). The engine recursively compiles all `.c` files in the listed directories:

```cpp
class gameScriptModule
{
    value = "";
    files[] =
    {
        "MyMod/Scripts/3_Game"      // All .c files in this directory tree
    };
};
```

You can list multiple directories. This is how the "Common folder" pattern works:

```cpp
class gameScriptModule
{
    value = "";
    files[] =
    {
        "MyMod/Scripts/Common",     // Shared code compiled into EVERY module
        "MyMod/Scripts/3_Game"      // Layer-specific code
    };
};
class worldScriptModule
{
    value = "";
    files[] =
    {
        "MyMod/Scripts/Common",     // Same shared code, also available here
        "MyMod/Scripts/4_World"
    };
};
```

### 使用するものだけ定義する

You do not need to declare all five script modules. Only declare the ones your mod actually uses:

```cpp
// A simple mod that only has 3_Game and 5_Mission code
class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    class missionScriptModule
    {
        files[] = { "MyMod/Scripts/5_Mission" };
    };
};
```

---

## class defs：imageSets と widgetStyles

If your mod uses custom icons or GUI styles, declare them inside `class defs`:

### imageSets

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "MyMod/GUI/imagesets/icons.imageset",
            "MyMod/GUI/imagesets/items.imageset"
        };
    };
    // ... script modules ...
};
```

ImageSets are XML files that map named regions of a texture atlas to sprite names. Once declared here, any script can reference the icons by name.

### widgetStyles

```cpp
class defs
{
    class widgetStyles
    {
        files[] =
        {
            "MyMod/GUI/looknfeel/custom.styles"
        };
    };
    // ... script modules ...
};
```

Widget styles define reusable visual properties (colors, fonts, padding) for GUI widgets.

### Real Example: MyFramework

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "MyFramework/GUI/imagesets/prefabs.imageset",
            "MyFramework/GUI/imagesets/CUI.imageset",
            "MyFramework/GUI/icons/thin.imageset",
            "MyFramework/GUI/icons/light.imageset",
            "MyFramework/GUI/icons/regular.imageset",
            "MyFramework/GUI/icons/solid.imageset",
            "MyFramework/GUI/icons/brands.imageset"
        };
    };
    class widgetStyles
    {
        files[] =
        {
            "MyFramework/GUI/looknfeel/prefabs.styles"
        };
    };
    // ... script modules ...
};
```

---

## defines 配列

The `defines[]` array in `CfgMods` creates preprocessor symbols that other mods can check with `#ifdef`:

```cpp
defines[] =
{
    "MYMOD_CORE",           // Other mods can do: #ifdef MYMOD_CORE
    // "MYMOD_DEBUG"        // Commented out = disabled in release
};
```

### Use Cases

**Feature detection across mods:**

```c
// In another mod's code:
#ifdef MYMOD_CORE
    MyLog.Info("MyMod", "MyFramework detected, enabling integration");
#else
    Print("[MyMod] Running without MyFramework");
#endif
```

**Debug/release builds:**

```cpp
defines[] =
{
    "MYMOD_LOADED",
    // "MYMOD_DEBUG",        // Uncomment for debug logging
    // "MYMOD_VERBOSE"       // Uncomment for verbose output
};
```

### 実際の例

**COT** uses defines extensively for feature flags:

```cpp
defines[] =
{
    "JM_COT",
    "JM_COT_VEHICLE_ONSPAWNVEHICLE",
    "COT_BUGFIX_REF",
    "COT_BUGFIX_REF_UIACTIONS",
    "COT_UIACTIONS_SETWIDTH",
    "COT_REFRESHSTATS_NEW",
    "JM_COT_VEHICLEMANAGER",
    "JM_COT_INVISIBILITY"
};
```

**CF** uses defines for enabling/disabling subsystems:

```cpp
defines[] =
{
    "CF_MODULE_CONFIG",
    "CF_EXPRESSION",
    "CF_GHOSTICONS",
    "CF_MODSTORAGE",
    "CF_SURFACES",
    "CF_MODULES"
};
```

---

## CfgVehicles：アイテムとエンティティの定義

`CfgVehicles` is the primary config class for defining in-game items, buildings, vehicles, and other entities. Despite the name "vehicles", it covers ALL entity types.

### Basic Item Definition

```cpp
class CfgVehicles
{
    class ItemBase;                          // Forward-declare the parent class
    class MyMod_CustomItem : ItemBase        // Inherit from vanilla base
    {
        scope = 2;                           // 0=hidden, 1=editor-only, 2=public
        displayName = "Custom Item";
        descriptionShort = "A custom item.";
        model = "MyMod/Data/Models/item.p3d";
        weight = 500;                        // Grams
        itemSize[] = { 2, 3 };               // Inventory slots (width, height)
        rotationFlags = 17;                   // Allowed rotation in inventory
        inventorySlot[] = {};                 // Which attachment slots it fits
    };
};
```

### scope Values

| 値 | 意味 | 使い方 |
|-------|---------|-------|
| `0` | Hidden | Base classes, abstract parents -- never spawnable |
| `1` | Editor only | Visible in DayZ Editor but not in normal gameplay |
| `2` | Public | Fully spawnable, appears in admin tools and spawners |

### Building/Structure Definition

```cpp
class CfgVehicles
{
    class HouseNoDestruct;
    class MyMod_Bunker : HouseNoDestruct
    {
        scope = 2;
        displayName = "Military Bunker";
        model = "MyMod/Data/Models/bunker.p3d";
    };
};
```

### Vehicle Definition (Simplified)

```cpp
class CfgVehicles
{
    class CarScript;
    class MyMod_Truck : CarScript
    {
        scope = 2;
        displayName = "Custom Truck";
        model = "MyMod/Data/Models/truck.p3d";

        class Cargo
        {
            itemsCargoSize[] = { 10, 50 };   // Cargo dimensions
        };
    };
};
```

### DabsFramework Entity Example

```cpp
class CfgVehicles
{
    class HouseNoDestruct;
    class NetworkLightBase : HouseNoDestruct
    {
        scope = 1;
    };
    class NetworkPointLight : NetworkLightBase
    {
        scope = 1;
    };
    class NetworkSpotLight : NetworkLightBase
    {
        scope = 1;
    };
};
```

---

## CfgSoundSets と CfgSoundShaders

Custom audio requires two config classes working together: a SoundShader (the audio file reference) and a SoundSet (the playback configuration).

### CfgSoundShaders

```cpp
class CfgSoundShaders
{
    class MyMod_Alert_SoundShader
    {
        samples[] = {{ "MyMod/Sounds/alert", 1 }};  // Path to .ogg file, probability
        volume = 0.8;                                 // Base volume (0.0 to 1.0)
        range = 50;                                   // Audible range in meters (3D only)
        limitation = 0;                               // 0 = no limit on concurrent plays
    };
};
```

The `samples` array uses double braces. Each entry is `{ "path_without_extension", probability }`. If you list multiple samples, the engine picks randomly based on probability weights.

### CfgSoundSets

```cpp
class CfgSoundSets
{
    class MyMod_Alert_SoundSet
    {
        soundShaders[] = { "MyMod_Alert_SoundShader" };
        volumeFactor = 1.0;                           // Multiplier on shader volume
        frequencyFactor = 1.0;                        // Pitch multiplier
        spatial = 1;                                  // 0 = 2D (UI sounds), 1 = 3D (world)
    };
};
```

### Playing Sounds in Script

```c
// 2D UI sound (spatial = 0)
SEffectManager.PlaySound("MyMod_Alert_SoundSet", vector.Zero);

// 3D world sound (spatial = 1)
SEffectManager.PlaySound("MyMod_Alert_SoundSet", GetPosition());
```

### Real Example: MyMissions Mod Radio Beep

```cpp
class CfgSoundShaders
{
    class MyBeep_SoundShader
    {
        samples[] = {{ "MyMissions\Sounds\bip", 1 }};
        volume = 0.6;
        range = 5;
        limitation = 0;
    };
};

class CfgSoundSets
{
    class MyBeep_SoundSet
    {
        soundShaders[] = { "MyBeep_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 0;      // 2D -- plays as UI sound
    };
};
```

---

## CfgAddons：プリロード宣言

`CfgAddons` is an optional block that hints to the engine about preloading assets:

```cpp
class CfgAddons
{
    class PreloadAddons
    {
        class MyMod
        {
            list[] = {};       // List of addon names to preload (usually empty)
        };
    };
};
```

In practice, most mods declare this with an empty `list[]`. It ensures the engine recognizes the mod during the preload phase. Some mods skip it entirely without issues.

---

## 実際の例 from Professional Mods

### MyFramework (Script-only, Framework)

```cpp
class CfgPatches
{
    class MyCore_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Scripts" };
    };
};

class CfgMods
{
    class MyMod
    {
        name = "MyFramework";
        dir = "MyFramework";
        author = "MyMod Team";
        overview = "MyFramework - Central Admin Panel and Shared Library";
        inputs = "MyFramework/Scripts/Inputs.xml";
        creditsJson = "MyFramework/Scripts/Credits.json";
        type = "mod";
        defines[] = { "MYMOD_CORE" };
        dependencies[] = { "Core", "Game", "World", "Mission" };

        class defs
        {
            class imageSets
            {
                files[] =
                {
                    "MyFramework/GUI/imagesets/prefabs.imageset",
                    "MyFramework/GUI/imagesets/CUI.imageset",
                    "MyFramework/GUI/icons/thin.imageset",
                    "MyFramework/GUI/icons/light.imageset",
                    "MyFramework/GUI/icons/regular.imageset",
                    "MyFramework/GUI/icons/solid.imageset",
                    "MyFramework/GUI/icons/brands.imageset"
                };
            };
            class widgetStyles
            {
                files[] =
                {
                    "MyFramework/GUI/looknfeel/prefabs.styles"
                };
            };
            class engineScriptModule
            {
                files[] = { "MyFramework/Scripts/1_Core" };
            };
            class gameScriptModule
            {
                files[] = { "MyFramework/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                files[] = { "MyFramework/Scripts/4_World" };
            };
            class missionScriptModule
            {
                files[] = { "MyFramework/Scripts/5_Mission" };
            };
        };
    };
};
```

### COT (Depends on CF, Uses Common Folder)

```cpp
class CfgPatches
{
    class JM_COT_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "JM_CF_Scripts", "JM_COT_GUI", "DZ_Data" };
    };
};

class CfgMods
{
    class JM_CommunityOnlineTools
    {
        dir = "JM";
        name = "Community Online Tools";
        credits = "Jacob_Mango, DannyDog, Arkensor";
        creditsJson = "JM/COT/Scripts/Data/Credits.json";
        author = "Jacob_Mango";
        versionPath = "JM/COT/Scripts/Data/Version.hpp";
        inputs = "JM/COT/Scripts/Data/Inputs.xml";
        type = "mod";
        defines[] = { "JM_COT", "JM_COT_VEHICLEMANAGER", "JM_COT_INVISIBILITY" };
        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class engineScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",     // Shared code
                    "JM/COT/Scripts/1_Core"
                };
            };
            class gameScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",
                    "JM/COT/Scripts/3_Game"
                };
            };
            class worldScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",
                    "JM/COT/Scripts/4_World"
                };
            };
            class missionScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",
                    "JM/COT/Scripts/5_Mission"
                };
            };
        };
    };
};
```

### MyMissions Mod Server (Server-Only Mod)

```cpp
class CfgPatches
{
    class SDZS_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Scripts", "MyScripts", "MyCore_Scripts" };
    };
};

class CfgMods
{
    class MyMissionsServer
    {
        name = "MyMissions Mod Server";
        dir = "MyMissions_Server";
        author = "MyMod";
        type = "servermod";              // <-- Server-only mod
        defines[] = { "MYMOD_MISSIONS" };
        dependencies[] = { "Core", "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                files[] = { "MyMissions_Server/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                files[] = { "MyMissions_Server/Scripts/4_World" };
            };
            class missionScriptModule
            {
                files[] = { "MyMissions_Server/Scripts/5_Mission" };
            };
        };
    };
};
```

### DabsFramework (Uses gameLibScriptModule + CfgVehicles)

```cpp
class CfgPatches
{
    class DF_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "DF_GUI" };
    };
};

class CfgMods
{
    class DabsFramework
    {
        name = "Dabs Framework";
        dir = "DabsFramework";
        credits = "InclementDab";
        author = "InclementDab";
        creditsJson = "DabsFramework/Scripts/Credits.json";
        versionPath = "DabsFramework/Scripts/Version.hpp";
        type = "mod";
        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class imageSets
            {
                files[] =
                {
                    "DabsFramework/gui/imagesets/prefabs.imageset",
                    "DabsFramework/gui/icons/brands.imageset",
                    "DabsFramework/gui/icons/light.imageset",
                    "DabsFramework/gui/icons/regular.imageset",
                    "DabsFramework/gui/icons/solid.imageset",
                    "DabsFramework/gui/icons/thin.imageset"
                };
            };
            class widgetStyles
            {
                files[] =
                {
                    "DabsFramework/gui/looknfeel/prefabs.styles"
                };
            };
            class engineScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/1_core" };
            };
            class gameLibScriptModule      // Rare: Dabs uses layer 2
            {
                value = "";
                files[] = { "DabsFramework/scripts/2_GameLib" };
            };
            class gameScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/5_Mission" };
            };
        };
    };
};

class CfgVehicles
{
    class HouseNoDestruct;
    class NetworkLightBase : HouseNoDestruct
    {
        scope = 1;
    };
    class NetworkPointLight : NetworkLightBase
    {
        scope = 1;
    };
    class NetworkSpotLight : NetworkLightBase
    {
        scope = 1;
    };
};
```

---

## よくある間違い

### 1. Wrong requiredAddons -- Mod Loads Before Its Dependency

```cpp
// WRONG: Missing dependency on CF, so your mod may load before CF
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = { "DZ_Data" };  // CF not listed!
    };
};

// RIGHT: Declare ALL dependencies
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = { "DZ_Data", "JM_CF_Scripts" };
    };
};
```

**症状：** Undefined type errors for classes from the dependency. The mod loaded before the dependency was compiled.

### 2. Missing Script Module Paths

```cpp
// WRONG: You have a Scripts/4_World/ folder but forgot to declare it
class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    // 4_World is missing! All .c files in 4_World/ are ignored.
};

// RIGHT: Declare every layer you use
class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    class worldScriptModule
    {
        files[] = { "MyMod/Scripts/4_World" };
    };
};
```

**症状：** Classes you defined simply do not exist. No error -- they are silently not compiled.

### 3. Wrong File Paths (Case Sensitivity)

While Windows is case-insensitive, DayZ paths can be case-sensitive in certain contexts (Linux servers, PBO packing):

```cpp
// RISKY: Mixed case that may fail on Linux
files[] = { "mymod/scripts/3_game" };   // Folder is actually "MyMod/Scripts/3_Game"

// SAFE: Match the actual directory case exactly
files[] = { "MyMod/Scripts/3_Game" };
```

### 4. CfgPatches Class Name Collision

```cpp
// WRONG: Using a common name that might collide with another mod
class CfgPatches
{
    class Scripts              // Too generic! Will collide.
    {
        // ...
    };
};

// RIGHT: Use a unique prefix
class CfgPatches
{
    class MyMod_Scripts        // Unique to your mod
    {
        // ...
    };
};
```

### 5. Circular requiredAddons

```cpp
// ModA config.cpp
requiredAddons[] = { "ModB_Scripts" };

// ModB config.cpp
requiredAddons[] = { "ModA_Scripts" };  // CIRCULAR! Engine fails to resolve.
```

### 6. Declaring dependencies[] Without Matching Script Modules

```cpp
// WRONG: Listed "World" as dependency but have no worldScriptModule
dependencies[] = { "Game", "World", "Mission" };

class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    // No worldScriptModule declared -- "World" dependency is misleading
    class missionScriptModule
    {
        files[] = { "MyMod/Scripts/5_Mission" };
    };
};
```

This does not cause an error, but it is misleading. Only list dependencies you actually use.

### 7. Putting CfgVehicles in the Scripts config.cpp

It works, but is poor practice. Keep item/entity definitions in a separate PBO (`Data/config.cpp`) and script definitions in `Scripts/config.cpp`.

---

## 完全なテンプレート

Here is a production-ready `Scripts/config.cpp` template you can copy and modify:

```cpp
// ============================================================================
// Scripts/config.cpp -- MyMod Script Module Definitions
// ============================================================================

class CfgPatches
{
    class MyMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Scripts"
            // Add framework dependencies here:
            // "JM_CF_Scripts",         // Community Framework
            // "MyCore_Scripts",      // MyFramework
        };
    };
};

class CfgMods
{
    class MyMod
    {
        dir = "MyMod";
        name = "My Mod";
        author = "YourName";
        credits = "YourName";
        creditsJson = "MyMod/Scripts/Data/Credits.json";
        overview = "A brief description of what this mod does.";
        type = "mod";

        defines[] =
        {
            "MYMOD_LOADED"
            // "MYMOD_DEBUG"      // Uncomment for debug builds
        };

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class imageSets
            {
                files[] = {};     // Add .imageset paths here
            };

            class widgetStyles
            {
                files[] = {};     // Add .styles paths here
            };

            class gameScriptModule
            {
                value = "";
                files[] = { "MyMod/Scripts/3_Game" };
            };

            class worldScriptModule
            {
                value = "";
                files[] = { "MyMod/Scripts/4_World" };
            };

            class missionScriptModule
            {
                value = "";
                files[] = { "MyMod/Scripts/5_Mission" };
            };
        };
    };
};
```

---

**前：** [Chapter 2.1: The 5-Layer Script Hierarchy](01-five-layers.md)
**次：** [Chapter 2.3: mod.cpp & Workshop](03-mod-cpp.md)
