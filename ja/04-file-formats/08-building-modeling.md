# 第 4.8: Building Modeling -- Doors & Ladders

[<< 前: Workbench Guide](07-workbench-guide.md) | **Building Modeling**

---

## はじめに

Buildings in DayZ are more than static scenery. Players interact with them constantly -- opening doors, climbing ladders, taking cover behind walls. Creating a custom building that supports these interactions requires careful model setup: doors need rotation axes and named selections across multiple LODs, ladders need precisely placed climbing paths defined entirely through Memory LOD vertices.

この章では the complete workflow for adding interactive doors and climbable ladders to custom building models, based on official Bohemia Interactive documentation.

### 前提条件

- A working **Work-drive** with your custom mod folder structure.
- **Object Builder** (from the DayZ Tools package) with **Buldozer** (model preview) configured.
- The ability to binarize and pack custom mod files into PBOs.
- Familiarity with the LOD system and named selections (covered in [Chapter 4.2: 3D Models](02-models.md)).

---

## 目次

- [Overview](#introduction)
- [Door Configuration](#door-configuration)
  - [Model Setup](#model-setup-for-doors)
  - [model.cfg -- Skeletons and Animations](#modelcfg----skeletons-and-animations)
  - [Game Config (config.cpp)](#game-config-configcpp)
  - [Double Doors](#double-doors)
  - [Shifting Doors](#shifting-doors)
  - [Bounding Sphere Issues](#bounding-sphere-issues)
- [Ladder Configuration](#ladder-configuration)
  - [Supported Ladder Types](#supported-ladder-types)
  - [Memory LOD Named Selections](#memory-lod-named-selections)
  - [View Geometry Requirements](#view-geometry-requirements)
  - [Ladder Dimensions](#ladder-dimensions)
  - [Collision Space](#collision-space)
  - [Config Requirements for Ladders](#config-requirements-for-ladders)
- [Model Requirements Summary](#model-requirements-summary)
- [Best Practices](#best-practices)
- [Common Mistakes](#common-mistakes)
- [References](#references)

---

## ドアの設定

Interactive doors require three things to come together: the P3D model with correctly named selections and memory points, a `model.cfg` that defines the animation skeleton and rotation parameters, and a `config.cpp` game config that links the door to sounds, damage zones, and game logic.

### ドア用モデルセットアップ

A door in the P3D model must include the following:

1. **Named selections across all relevant LODs.** The geometry that represents the door must be assigned to a named selection (e.g., `door1`) in each of these LODs:
   - **Resolution LOD** -- the visual mesh the player sees.
   - **Geometry LOD** -- the physical collision shape. Must also contain a named property `class` with the value `house`.
   - **View Geometry LOD** -- used for visibility checks and action ray-casting. The selection name here corresponds to the `component` parameter in the game config.
   - **Fire Geometry LOD** -- used for ballistic hit detection.

2. **Memory LOD vertices** that define:
   - **Rotation axis** -- Two vertices forming the axis of rotation, assigned to a named selection like `door1_axis`. This axis defines the hinge line around which the door pivots.
   - **Sound position** -- A vertex assigned to a named selection like `door1_action`, marking where door sounds originate.
   - **Action widget position** -- Where the interaction widget is displayed to the player.

#### 推奨ドアサイズ

Almost all doors in vanilla DayZ are **120 x 220 cm** (width x height). Using these standard dimensions ensures animations look correct and characters fit through openings naturally. Model your doors **closed デフォルトでは** and animate them to the open position -- Bohemia plans to support doors opening in both directions in the future.

### model.cfg -- Skeletons and Animations

Any animated door requires a `model.cfg` file. This config defines the bone structure (skeleton) and the animation parameters. Place `model.cfg` near your model file, or higher in the folder structure -- the exact location is flexible as long as the binarizer can find it.

The `model.cfg` has two sections:

#### CfgSkeletons

Defines the animated bones. Each door gets a bone entry. Bones are listed as pairs: the bone name followed by its parent (empty string `""` for root-level bones).

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

Defines the animations for each bone. The class name under `CfgModels` **must match your model's filename** (without extension) for the link to work.

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

**主要パラメータの説明:**

| パラメータ | 説明 |
|-----------|-------------|
| `type` | Animation type. Use `"rotation"` for swinging doors, `"translation"` for sliding doors. |
| `selection` | The named selection in the model that should be animated. |
| `source` | Links to the game config's `Doors` class. Must match the class name in `config.cpp`. |
| `axis` | Named selection in the Memory LOD defining the rotation axis (two vertices). |
| `memory` | Set to `1` to indicate the axis is defined in the Memory LOD. |
| `minValue` / `maxValue` | Animation phase range. Typically `0` to `1`. |
| `angle0` / `angle1` | Rotation angles in **radians**. `angle1` defines how far the door opens. Use negative values to reverse direction. A value of `1.4` radians is approximately 80 degrees. |

#### Verifying in Buldozer

After writing the `model.cfg`, open your model in Object Builder with Buldozer running. Use the `[` and `]` keys to cycle through available animation sources, and `;` / `'` (or mouse wheel up/down) to advance or recede the animation. This lets you verify that the door pivots correctly on its axis.

### Game Config (config.cpp)

The game config connects the animated model to game systems -- sounds, damage, and door state logic. The config class name **must** follow the pattern `land_modelname` to link correctly with the model.

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

**ドア設定パラメータの説明:**

| パラメータ | 説明 |
|-----------|-------------|
| `component` | Named selection in the **View Geometry LOD** used for this door. |
| `soundPos` | Named selection in the **Memory LOD** where door sounds are played. |
| `animPeriod` | Speed of the door animation (in seconds). |
| `initPhase` | Initial animation phase (`0` = closed, `1` = fully open). Test in Buldozer to verify which value corresponds to which state. |
| `initOpened` | Probability that the door spawns open in the world. `0.5` means a 50% chance. |
| `soundOpen` | Sound class from `CfgActionSounds` played when the door opens. See `DZ\sounds\hpp\config.cpp` for available sound sets. |
| `soundClose` | Sound class played when the door closes. |
| `soundLocked` | Sound class played when a player tries to open a locked door. |
| `soundOpenABit` | Sound class played when a player breaks open a locked door. |

**設定に関する重要な注意事項:**

- All buildings in DayZ inherit from `HouseNoDestruct`.
- Each class name under `class Doors` must correspond to the `source` parameter defined in `model.cfg`.
- The `DamageSystem` section must include a `DamageZones` subclass for each door. The `componentNames[]` array references the named selection from the model's Fire Geometry LOD.
- Adding the `class=house` named property and a game config class requires your terrain to be re-binarized (model paths in `.wrp` files get replaced with game config class references).

### 両開きドア

Double doors (two wings that open together from a single interaction) are common in DayZ. They require special setup:

**In the model:**
- Configure each wing as an individual door with its own named selection (e.g., `door3_1` and `door3_2`).
- In the **Memory LOD**, the action point must be **shared** between the two wings -- use one named selection and one vertex for the action position.
- The no-suffix named selection (e.g., `door3` without wing suffix) must cover **both** door handles.
- **View Geometry** and **Fire Geometry** require an additional named selection that covers both wings together.

**In model.cfg:**
- Define each wing as a separate animation class, but set the **same `source` parameter** for both wings (e.g., `"doors34"` for both).
- Set `angle1` to a **positive** value for one wing and **negative** for the other, so they swing in opposite directions.

**In config.cpp:**
- Define only **one** class under `class Doors`, with its name matching the shared `source` parameter.
- Similarly, define only **one** entry in `DamageZones` for the double door pair.

### スライドドア

For doors that slide along a track rather than swinging (such as barn doors or sliding panels), change the animation `type` in `model.cfg` from `"rotation"` to `"translation"`. The axis vertices in the Memory LOD then define the direction of travel instead of the pivot line.

### バウンディングスフィアの問題

By default, a model's bounding sphere is sized to contain the entire object. When doors are modeled in the closed position, the open position may extend **outside** this bounding sphere. This causes problems:

- **Actions stop working** -- ray-casting for door interactions fails from certain angles.
- **Ballistics ignore the door** -- bullets pass through geometry that lies outside the bounding sphere.

**Solution:** Create a named selection in the Memory LOD that covers the larger area the building occupies when doors are fully open. Then add a `bounding` parameter to your game config class:

```cpp
class land_modelname: HouseNoDestruct
{
    bounding = "selection_name";
    // ... rest of config
};
```

This overrides the automatic bounding sphere calculation with one that encompasses all door positions.

---

## はしごの設定

Unlike doors, ladders in DayZ require **no animation config** and **no special game config entries** beyond the base building class. The entire ladder setup is done through Memory LOD vertex placement and one View Geometry selection. This makes ladders simpler to set up than doors, but the vertex placement must be precise.

### サポートされるはしごタイプ

DayZ supports two types of ladders:

1. **Front bottom enter with side-way top exit** -- The player approaches from the front at the bottom and exits to the side at the top (against a wall).
2. **Front bottom enter with front top exit** -- The player approaches from the front at the bottom and exits forward at the top (onto a roof or platform).

Both types also support **middle side-way enter and exit points**, allowing players to get on and off the ladder at intermediate floors. Ladders can also be placed **at an angle** rather than strictly vertical.

### Memory LODの名前付きセレクション

The ladder is defined entirely by named vertices in the Memory LOD. Every selection name begins with `ladderN_` where **N** is the ladder ID, starting from `1`. A building can have multiple ladders (`ladder1_`, `ladder2_`, `ladder3_`, etc.).

Here is the complete set of named selections for a ladder:

| 名前付きセレクション | 説明 |
|----------------|-------------|
| `ladderN_bottom_front` | Defines the bottom entry step -- where the player begins climbing. |
| `ladderN_middle_left` | Defines a middle entry/exit point (left side). Can contain multiple vertices if the ladder passes multiple floors. |
| `ladderN_middle_right` | Defines a middle entry/exit point (right side). Can contain multiple vertices for multi-floor ladders. |
| `ladderN_top_front` | Defines the upper exit step -- where the player finishes climbing (front exit type). |
| `ladderN_top_left` | Defines the upper exit direction for wall-mounted ladders (left side). Must be at least **5 ladder steps higher** than the floor (approximately the height of a standing player on a ladder). |
| `ladderN_top_right` | Defines the upper exit direction for wall-mounted ladders (right side). Same height requirement as `top_left`. |
| `ladderN` | Defines where the "Enter Ladder" action widget appears to the player. |
| `ladderN_dir` | Defines the direction from which the ladder can be climbed (approach direction). |
| `ladderN_con` | The measurement point for the enter action. **Must be placed at floor level.** |
| `ladderN_con_dir` | Defines the direction of a 180-degree cone (originating from `ladderN_con`) within which the action to enter the ladder is available. |

Each of these is a vertex (or set of vertices for middle points) that you place manually in Object Builder's Memory LOD.

### View Geometryの要件

In addition to the Memory LOD setup, you must create a **View Geometry** component with a named selection called `ladderN`. This selection must cover the **entire volume** of the ladder -- the full height and width of the climbable area. Without this View Geometry selection, the ladder will not function correctly.

### はしごの寸法

Ladder climbing animations are designed for **fixed dimensions**. Your ladder rungs and spacing should match the vanilla ladder proportions to ensure animations align correctly. Refer to the official DayZ Samples repository for exact measurements -- the sample ladder parts are the same ones used on most vanilla buildings.

### 衝突スペース

Characters **collide with geometry while climbing a ladder**. This means you must ensure there is enough clear space around the ladder for the climbing character in both:

- **Geometry LOD** -- physical collision.
- **Roadway LOD** -- surface interaction.

If the space is too tight, the character will clip into walls or get stuck during the climbing animation.

### はしごの設定要件

Unlike the Arma series, DayZ does **not** require a `ladders[]` array in the game config class. しかし, two things are still necessary:

1. Your model must have a **config representation** -- a `config.cpp` with a `CfgVehicles` class (the same 基底クラス used for doors; see the door config section above).
2. The **Geometry LOD** must contain the named property `class` with the value `house`.

Beyond these two requirements, the ladder is fully defined by the Memory LOD vertices and the View Geometry selection. No `model.cfg` animation entries are needed.

---

## モデル要件のまとめ

Buildings with doors and ladders must include several LODs, each serving a distinct purpose. The table below summarizes what each LOD must contain:

| LOD | 目的 | ドアの要件 | はしごの要件 |
|-----|---------|-------------------|---------------------|
| **Resolution LOD** | Visual mesh displayed to the player. | Named selection for the door geometry (e.g., `door1`). | No specific requirements. |
| **Geometry LOD** | Physical collision detection. | Named selection for the door geometry. Named property `class = "house"`. | Named property `class = "house"`. Sufficient clearance around the ladder for climbing characters. |
| **Fire Geometry LOD** | Ballistic hit detection (bullets, projectiles). | Named selection matching `componentNames[]` in the damage zone config. | No specific requirements. |
| **View Geometry LOD** | Visibility checks, action ray-casting. | Named selection matching the `component` parameter in the door config. | Named selection `ladderN` covering the full volume of the ladder. |
| **Memory LOD** | Axis definitions, action points, sound positions. | Axis vertices (`door1_axis`), sound position (`door1_action`), action widget position. | Full set of ladder vertices (`ladderN_bottom_front`, `ladderN_top_left`, `ladderN_dir`, `ladderN_con`, etc.). |
| **Roadway LOD** | Surface interaction for characters. | Not typically required. | Sufficient clearance around the ladder for climbing characters. |

### 名前付きセレクションの一貫性

A critical requirement is that **named selections must be consistent across all LODs** that reference them. If a selection is called `door1` in the Resolution LOD, it must also be `door1` in the Geometry, Fire Geometry, and View Geometry LODs. Mismatched names between LODs will cause the door or ladder to fail silently.

---

## ベストプラクティス

1. **Model doors closed デフォルトでは.** Animate from closed to open. Bohemia plans to support opening doors in both directions, so starting from closed is future-proof.

2. **Use standard door dimensions.** Stick to 120 x 220 cm for door openings unless you have a specific design reason not to. This matches vanilla buildings and ensures character animations look correct.

3. **Test animations in Buldozer before packing.** Use `[` / `]` to cycle sources and `;` / `'` or mouse wheel to scrub the animation. Catching axis or angle errors here saves significant time.

4. **Override bounding spheres for large buildings.** If your building has doors that swing outward significantly, create a Memory LOD selection covering the full animated extent and link it with the `bounding` config parameter.

5. **Place ladder vertices precisely.** Climbing animations are fixed to specific dimensions. Vertices that are too far apart or misaligned will cause the character to float, clip, or get stuck.

6. **Ensure clearance around ladders.** Leave enough space in the Geometry and Roadway LODs for the character model while climbing.

7. **Keep one `model.cfg` per model or folder.** The `model.cfg` does not need to sit next to the `.p3d` file, but keeping them close makes organization easier. It can also be placed higher in the folder structure to cover multiple models.

8. **Use the DayZ Samples repository.** Bohemia provides working samples for both doors (`Test_Building`) and ladders (`Test_Ladders`) at `https://github.com/BohemiaInteractive/DayZ-Samples`. Study these before building your own.

9. **Re-binarize terrain after adding building configs.** Adding `class=house` and a game config class means model paths in `.wrp` files are replaced with class references. Your terrain must be re-binarized for this to take effect.

10. **Update the navmesh after placing buildings.** Rebuilt terrain without an updated navmesh can cause AI to walk through doors instead of using them properly.

---

## よくある間違い

### Doors

| 間違い | 症状 | 修正方法 |
|---------|---------|-----|
| `CfgModels` class name does not match model filename. | Door animation does not play. | Rename the class to match the `.p3d` filename exactly (without extension). |
| Missing named selection in one or more LODs. | Door is visible but not interactive, or bullets pass through. | Ensure the selection exists in Resolution, Geometry, View Geometry, and Fire Geometry LODs. |
| Axis vertices missing or only one vertex defined. | Door pivots from the wrong point or does not rotate at all. | Place exactly two vertices in the Memory LOD for the axis selection (e.g., `door1_axis`). |
| `source` in `model.cfg` does not match class name in `config.cpp` Doors. | Door is not linked to game logic -- no sounds, no state changes. | Ensure the `source` parameter and the Doors class name are identical. |
| Forgetting `class = "house"` named property in Geometry LOD. | Building is not recognized as an interactive structure. | Add the named property in Object Builder's Geometry LOD. |
| Bounding sphere too small. | Door actions or ballistics fail from certain angles. | Add a `bounding` selection in Memory LOD and reference it in the config. |
| Negative vs. positive `angle1` confusion for double doors. | Both wings swing the same direction and clip through each other. | One wing needs positive `angle1`, the other negative. |

### Ladders

| 間違い | 症状 | 修正方法 |
|---------|---------|-----|
| `ladderN_con` not placed at floor level. | "Enter Ladder" action does not appear or appears at the wrong height. | Move the vertex to ground/floor level. |
| Missing View Geometry selection `ladderN`. | Ladder cannot be interacted with. | Create a View Geometry component with a named selection covering the full ladder volume. |
| `ladderN_top_left` / `ladderN_top_right` too low. | Character clips through the wall or floor at the top exit. | These must be at least 5 ladder steps higher than the floor level. |
| Insufficient clearance in Geometry LOD. | Character gets stuck or clips into walls while climbing. | Widen the gap around the ladder in the Geometry and Roadway LODs. |
| Ladder numbering starts at 0. | Ladder does not function. | Numbering starts at `1` (`ladder1_`, not `ladder0_`). |
| Specifying `ladders[]` in game config. | Wasted effort (harmless but unnecessary). | DayZ does not use the `ladders[]` array. Remove it and rely on Memory LOD vertex placement. |

---

## 参考資料

- [Bohemia Interactive -- Doors on buildings](https://community.bistudio.com/wiki/DayZ:Doors_on_buildings) (official BI documentation)
- [Bohemia Interactive -- Ladders on buildings](https://community.bistudio.com/wiki/DayZ:Ladders_on_buildings) (official BI documentation)
- [DayZ Samples -- Test_Building](https://github.com/BohemiaInteractive/DayZ-Samples/tree/master/Test_Building) (working door sample)
- [DayZ Samples -- Test_Ladders](https://github.com/BohemiaInteractive/DayZ-Samples/tree/master/Test_Ladders) (working ladder sample)
- [Chapter 4.2: 3D Models](02-models.md) -- LOD system, named selections, `model.cfg` fundamentals

---

## ナビゲーション

| 前 | 上 | 次 |
|----------|----|------|
| [4.7 Workbench Guide](07-workbench-guide.md) | [Part 4: File Formats & DayZ Tools](01-textures.md) | -- |
