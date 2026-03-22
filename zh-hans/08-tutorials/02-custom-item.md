# Chapter 8.2: Creating a Custom Item

[Home](../README.md) | [<< Previous: Your First Mod](01-first-mod.md) | **Creating a Custom Item** | [Next: Building an Admin Panel >>](03-admin-panel.md)

---

## 目录

- [What We Are Building](#what-we-are-building)
- [Prerequisites](#prerequisites)
- [Step 1: Define the Item Class in config.cpp](#step-1-define-the-item-class-in-configcpp)
- [Step 2: Set 上级 Hidden Selections for Textures](#step-2-set-up-hidden-selections-for-textures)
- [Step 3: Create Basic Textures](#step-3-create-basic-textures)
- [Step 4: Add to types.xml for Server Spawning](#step-4-add-to-typesxml-for-server-spawning)
- [Step 5: Create a Display Name with Stringtable](#step-5-create-a-display-name-with-stringtable)
- [Step 6: Test In-Game](#step-6-test-in-game)
- [Step 7: Polish -- Model, Textures, and Sounds](#step-7-polish----model-textures-and-sounds)
- [Complete File Reference](#complete-file-reference)
- [Troubleshooting](#troubleshooting)
- [下一章 Steps](#next-steps)

---

## What We Are Building

We will create an item called **Field Journal** -- a small notebook that players can find in the world, pick up, and store in their inventory. It will:

- Use a vanilla model (borrowed from an existing item) so we do not need 3D modeling
- Have a custom retextured appearance using hidden selections
- Appear in the server's spawn table
- Have a proper display name and description

This is the standard workflow for creating any item in DayZ, whether it is food, tools, clothing, or building materials.

---

## Prerequisites

- A working mod structure (complete [Chapter 8.1](01-first-mod.md) first)
- A text editor
- DayZ Tools installed (for texture conversion, optional)

We will build on top of the mod from Chapter 8.1. Your current structure should look like:

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
        5_Mission/
            MyFirstMod/
                MissionHello.c
```

---

## Step 1: Define the Item Class in config.cpp

Items in DayZ are defined in the `CfgVehicles` config class. Despite the name "Vehicles", this class holds ALL entity types: items, buildings, vehicles, animals, and everything else.

### Create a Data config.cpp

It is best practice to keep item definitions in a separate PBO from your scripts. Create a new folder structure:

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp              <-- Already exists (scripts)
    Data/
        config.cpp              <-- NEW (item definitions)
```

Create the file `MyFirstMod/Data/config.cpp` with this content:

```cpp
class CfgPatches
{
    class MyFirstMod_Data
    {
        units[] = { "MFM_FieldJournal" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Characters"
        };
    };
};

class CfgVehicles
{
    class Inventory_Base;

    class MFM_FieldJournal : Inventory_Base
    {
        scope = 2;
        displayName = "$STR_MFM_FieldJournal";
        descriptionShort = "$STR_MFM_FieldJournal_Desc";
        model = "\DZ\characters\accessories\data\Notebook\Notebook.p3d";
        rotationFlags = 17;
        weight = 200;
        itemSize[] = { 1, 2 };
        absorbency = 0.5;

        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 100;
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
        };

        hiddenSelections[] = { "camoGround" };
        hiddenSelectionsTextures[] = { "MyFirstMod\Data\Textures\field_journal_co.paa" };
    };
};
```

### What Each Field Does

| Field | Value | Explanation |
|-------|-------|-------------|
| `scope` | `2` | Makes the item public -- spawnable and visible in admin tools. Use `0` for base classes that should never spawn directly. |
| `displayName` | `"$STR_MFM_FieldJournal"` | References a string table entry for the item name. The `$STR_` prefix tells the engine to look it up in `stringtable.csv`. |
| `descriptionShort` | `"$STR_MFM_FieldJournal_Desc"` | Short description shown in the inventory tooltip. |
| `model` | Path to `.p3d` | The 3D model. We borrow the vanilla Notebook model. The `\DZ\` prefix references vanilla game files. |
| `rotationFlags` | `17` | Bitmask controlling how the item can rotate in inventory. `17` allows standard rotation. |
| `weight` | `200` | Weight in grams. |
| `itemSize[]` | `{ 1, 2 }` | Inventory grid size: 1 column wide, 2 rows tall. |
| `absorbency` | `0.5` | How much the item absorbs water (0 = none, 1 = fully). Affects item when it rains. |
| `hiddenSelections[]` | `{ "camoGround" }` | Named texture slots on the model that can be overridden. |
| `hiddenSelectionsTextures[]` | Path to `.paa` | Your custom texture for each hidden selection. |

### About the Parent Class

```cpp
class Inventory_Base;
```

This line is a **forward declaration**. It tells the config parser that `Inventory_Base` exists (it is defined in vanilla DayZ). Your item class then inherits from it:

```cpp
class MFM_FieldJournal : Inventory_Base
```

`Inventory_Base` is the standard parent for small items that go in the player's inventory. Other common parent classes include:

| Parent Class | Use For |
|-------------|---------|
| `Inventory_Base` | Generic inventory items |
| `Edible_Base` | Food and drink |
| `Clothing_Base` | Wearable clothing/armor |
| `Weapon_Base` | Firearms |
| `Magazine_Base` | Magazines and ammo boxes |
| `HouseNoDestruct` | Buildings and structures |

### About DamageSystem

The `DamageSystem` block defines how the item takes damage and degrades. The `healthLevels` array maps health percentages to texture states:

- `1.0` = pristine
- `0.7` = worn
- `0.5` = damaged
- `0.3` = badly damaged
- `0.0` = ruined

The empty `{}` after each level is where you would specify damage overlay textures. For simplicity, we leave them empty.

---

## Step 2: Set 上级 Hidden Selections for Textures

Hidden selections are the mechanism DayZ uses to swap textures on a 3D model without modifying the model file itself. The vanilla Notebook model has a hidden selection called `"camoGround"` that controls its main texture.

### How Hidden Selections Work

1. The 3D model (`.p3d`) defines named regions called **selections**
2. In config.cpp, `hiddenSelections[]` lists which selections you want to override
3. `hiddenSelectionsTextures[]` provides your replacement textures, in matching order

```cpp
hiddenSelections[] = { "camoGround" };
hiddenSelectionsTextures[] = { "MyFirstMod\Data\Textures\field_journal_co.paa" };
```

The first entry in `hiddenSelectionsTextures` replaces the first entry in `hiddenSelections`. If you had multiple selections:

```cpp
hiddenSelections[] = { "camoGround", "camoMale", "camoFemale" };
hiddenSelectionsTextures[] = { "path\tex1.paa", "path\tex2.paa", "path\tex3.paa" };
```

### Finding Hidden Selection Names

To discover what hidden selections a vanilla model supports:

1. Open **Object Builder** (from DayZ Tools)
2. Load the model `.p3d` file
3. Look at the **Named Selections** list
4. Selections starting with `"camo"` are typically the ones you can override

Alternatively, look at the vanilla `config.cpp` for the item you are basing your item on. The `hiddenSelections[]` array shows what is available.

---

## Step 3: Create Basic Textures

DayZ uses `.paa` format for textures. During development, you can start with a simple colored image and convert it later.

### Create the Texture Folder

```
MyFirstMod/
    Data/
        config.cpp
        Textures/
            field_journal_co.paa
```

### Option A: Use a Placeholder (Fastest)

For initial testing, you can point `hiddenSelectionsTextures` to a vanilla texture instead of creating your own:

```cpp
hiddenSelectionsTextures[] = { "\DZ\characters\accessories\data\Notebook\notebook_co.paa" };
```

This uses the vanilla notebook texture. Your item will look identical to the vanilla notebook but will function as your custom item. Replace it with your own texture once you confirm everything works.

### Option B: Create a Custom Texture

1. **Create a source image:**
   - Open any image editor (GIMP, Photoshop, Paint.NET, or even MS Paint)
   - Create a new image at **512x512 pixels** (power-of-2 dimensions are required: 256, 512, 1024, 2048)
   - Fill it with a color or design. For a field journal, try a dark brown or green.
   - Save as `.tga` (TGA format) or `.png`

2. **Convert to `.paa`:**
   - Open **TexView2** from DayZ Tools
   - Go to **File > Open** and select your `.tga` or `.png`
   - Go to **File > Save As** and save as `.paa` format
   - Save it to `MyFirstMod/Data/Textures/field_journal_co.paa`

   The `_co` suffix is a naming convention meaning "color" (the diffuse/albedo texture). Other suffixes include `_nohq` (normal map), `_smdi` (specular), and `_as` (alpha/transparency).

### Texture Naming Conventions

| Suffix | Type | Purpose |
|--------|------|---------|
| `_co` | Color (Diffuse) | The main color/appearance texture |
| `_nohq` | Normal Map | Surface detail and lighting normals |
| `_smdi` | Specular | Shininess and metallic properties |
| `_as` | Alpha/Surface | Transparency or surface masking |
| `_de` | Detail | Additional detail overlay |

For a first item, you only need the `_co` texture. The model will use default values for the others.

---

## Step 4: Add to types.xml for Server Spawning

The `types.xml` file controls what items spawn in the world, how many exist at once, and where they appear. This file lives in the server's **mission folder** (not in your mod).

### Locate types.xml

For a standard DayZ server, `types.xml` is at:

```
<DayZ Server>\mpmissions\dayzOffline.chernarusplus\db\types.xml
```

Or for a multiplayer mission:

```
<DayZ Server>\mpmissions\dayzOffline.chernarusplus\db\types.xml
```

### Add Your Item Entry

Open `types.xml` and add this block inside the root `<types>` element:

```xml
<type name="MFM_FieldJournal">
    <nominal>10</nominal>
    <lifetime>14400</lifetime>
    <restock>1800</restock>
    <min>5</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="tools" />
    <usage name="Town" />
    <usage name="Village" />
    <value name="Tier1" />
    <value name="Tier2" />
</type>
```

### What Each Tag Means

| Tag | Value | Explanation |
|-----|-------|-------------|
| `name` | `"MFM_FieldJournal"` | Must match your config.cpp class name exactly |
| `nominal` | `10` | Target number of this item in the world at any time |
| `lifetime` | `14400` | Seconds before a dropped item despawns (14400 = 4 hours) |
| `restock` | `1800` | Seconds between respawn checks (1800 = 30 minutes) |
| `min` | `5` | Minimum number the Central Economy tries to maintain |
| `quantmin` / `quantmax` | `-1` | Quantity range (-1 = not applicable, used for items with variable quantity like water bottles) |
| `cost` | `100` | Economy priority weight (higher = spawns more readily) |
| `flags` | Various | What counts toward the nominal limit |
| `category` | `"tools"` | Item category for economy balancing |
| `usage` | `"Town"`, `"Village"` | Where the item spawns (location categories) |
| `value` | `"Tier1"`, `"Tier2"` | Map tier zones where the item appears |

### Common Usage and Value Tags

**Usage (where it spawns):**
- `Town`, `Village`, `Farm`, `Industrial`, `Military`, `Hunting`, `Medical`, `Coast`, `Firefighter`, `Prison`, `Police`, `School`, `ContaminatedArea`

**Value (map tier):**
- `Tier1` -- coast/starter areas
- `Tier2` -- inland towns
- `Tier3` -- military/northwest
- `Tier4` -- deepest inland/endgame

---

## Step 5: Create a Display Name with Stringtable

The string table provides localized text for item names and descriptions. DayZ reads string tables from `stringtable.csv` files.

### Create the Stringtable

Create the file `MyFirstMod/Data/Stringtable.csv` with this content:

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MFM_FieldJournal","Field Journal","","","","","","","","","","","","",""
"STR_MFM_FieldJournal_Desc","A weathered leather journal used to record field notes and observations.","","","","","","","","","","","","",""
```

Each row has columns for every supported language. You only need to fill in the `"English"` column. The other columns can be empty strings -- the engine falls back to English when a translation is missing.

### How String References Work

In your config.cpp, you wrote:

```cpp
displayName = "$STR_MFM_FieldJournal";
```

The `$STR_` prefix tells the engine: "Look for a string table entry named `STR_MFM_FieldJournal`." The engine searches all loaded `Stringtable.csv` files for a matching row and returns the text for the player's language.

### CSV Format Rules

- The first row must be the header with language names (in the exact order shown above)
- Each subsequent row is: `"KEY","English text","Czech text",...`
- All values must be double-quoted
- Separate values with commas
- No trailing comma after the last value
- Save as UTF-8 encoding (important for non-ASCII characters in other languages)

---

## Step 6: Test In-Game

### 上级date Your Scripts config.cpp

Before testing, you need to update your `Scripts/config.cpp` to also pack the Data folder, OR pack the Data folder as a separate PBO.

**Option A: Separate PBO (Recommended)**

Pack `MyFirstMod/Data/` as a second PBO:

```
@MyFirstMod/
    mod.cpp
    Addons/
        Scripts.pbo          <-- Contains Scripts/config.cpp and 5_Mission/
        Data.pbo             <-- Contains Data/config.cpp, Textures/, Stringtable.csv
```

Use Addon Builder with:
- Source: `MyFirstMod/Data/`
- Prefix: `MyFirstMod/Data`

**Option B: File Patching (Development)**

During development with `-filePatching`, the engine reads directly from your folders. No additional PBO packing is needed:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

### Spawn the Item Using the Script Console

The fastest way to test your item without waiting for it to spawn naturally:

1. Launch DayZ with your mod loaded
2. Join your local server or start offline mode
3. Open the **script console** (if using DayZDiag, this is available from the debug menu)
4. In the script console, type:

```c
GetGame().GetPlayer().GetInventory().CreateInInventory("MFM_FieldJournal");
```

5. Press **Execute** (or the run button)

The item should appear in your character's inventory.

### Alternative: Spawn Near Player

If your inventory is full, spawn the item on the ground near your character:

```c
vector pos = GetGame().GetPlayer().GetPosition();
GetGame().CreateObject("MFM_FieldJournal", pos, false, false, true);
```

### What to Check

1. **Does the item appear?** If yes, the config.cpp class definition is correct.
2. **Does it have the right name?** Check that "Field Journal" appears (not `$STR_MFM_FieldJournal`). If you see the raw string reference, the stringtable is not loading.
3. **Does it have the right texture?** If using a custom texture, verify the colors match. If the item appears all white or pink, the texture path is wrong.
4. **Can you pick it up?** If the item spawns but cannot be picked up, check `itemSize` and `scope`.
5. **Does the inventory icon look correct?** The size should match your `itemSize[]` definition.

---

## Step 7: Polish -- Model, Textures, and Sounds

Once your item works with a borrowed model, you can upgrade it with custom assets.

### Custom 3D Model

Creating a custom `.p3d` model requires:

1. **Blender or 3DS Max** with the DayZ tools plugin (Blender is free)
2. Export the model as `.p3d` using Object Builder
3. Define proper geometry (visual mesh), fire geometry (collision), and view geometry (LODs)
4. Create UV maps for your textures
5. Define named selections for hidden selections

This is a significant undertaking. For most items, retexturing a vanilla model (as we did above) is sufficient.

### Improved Textures

For a professional-looking item:

1. Create a **2048x2048** texture for close-up detail (or 1024x1024 for small items)
2. Include a **normal map** (`_nohq.paa`) for surface detail without extra polygons
3. Include a **specular map** (`_smdi.paa`) for material properties (shininess, roughness)
4. 上级date your config:

```cpp
hiddenSelections[] = { "camoGround" };
hiddenSelectionsTextures[] = { "MyFirstMod\Data\Textures\field_journal_co.paa" };
hiddenSelectionsMaterials[] = { "MyFirstMod\Data\Textures\field_journal.rvmat" };
```

An `.rvmat` (Rvmat material file) ties all texture maps together:

```cpp
ambient[] = { 1.0, 1.0, 1.0, 1.0 };
diffuse[] = { 1.0, 1.0, 1.0, 1.0 };
forcedDiffuse[] = { 0.0, 0.0, 0.0, 0.0 };
emmisive[] = { 0.0, 0.0, 0.0, 0.0 };
specular[] = { 0.2, 0.2, 0.2, 1.0 };
specularPower = 40;

PixelShaderID = "NormalMap";
VertexShaderID = "NormalMap";

class Stage1
{
    texture = "MyFirstMod\Data\Textures\field_journal_nohq.paa";
    uvSource = "tex";
};

class Stage2
{
    texture = "MyFirstMod\Data\Textures\field_journal_smdi.paa";
    uvSource = "tex";
};
```

### Custom Sounds

To add a sound when the item is used or picked up:

1. Create a `.ogg` audio file (OGG Vorbis format, the only format DayZ supports for custom sounds)
2. Define `CfgSoundShaders` and `CfgSoundSets` in your Data config.cpp:

```cpp
class CfgSoundShaders
{
    class MFM_JournalOpen_SoundShader
    {
        samples[] = {{ "MyFirstMod\Data\Sounds\journal_open", 1 }};
        volume = 0.6;
        range = 3;
        limitation = 0;
    };
};

class CfgSoundSets
{
    class MFM_JournalOpen_SoundSet
    {
        soundShaders[] = { "MFM_JournalOpen_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 1;
    };
};
```

Note: Sound file paths in `samples[]` do NOT include the `.ogg` extension.

### Adding Script Behavior

To give your item custom behavior (for example, an action when the player uses it), create a script class in `4_World`:

```
MyFirstMod/
    Scripts/
        config.cpp              <-- Add worldScriptModule entry
        4_World/
            MyFirstMod/
                MFM_FieldJournal.c
        5_Mission/
            MyFirstMod/
                MissionHello.c
```

上级date `Scripts/config.cpp` to include the new layer:

```cpp
dependencies[] = { "World", "Mission" };

class defs
{
    class worldScriptModule
    {
        value = "";
        files[] = { "MyFirstMod/Scripts/4_World" };
    };
    class missionScriptModule
    {
        value = "";
        files[] = { "MyFirstMod/Scripts/5_Mission" };
    };
};
```

Create `4_World/MyFirstMod/MFM_FieldJournal.c`:

```c
class MFM_FieldJournal extends Inventory_Base
{
    override bool CanPutInCargo(EntityAI parent)
    {
        if (!super.CanPutInCargo(parent))
            return false;

        return true;
    }

    override void SetActions()
    {
        super.SetActions();
        // Add custom actions here
        // AddAction(ActionReadJournal);
    }

    override void OnInventoryEnter(Man player)
    {
        super.OnInventoryEnter(player);
        Print("[MyFirstMod] Player picked up the Field Journal!");
    }

    override void OnInventoryExit(Man player)
    {
        super.OnInventoryExit(player);
        Print("[MyFirstMod] Player dropped the Field Journal.");
    }
};
```

---

## Complete File Reference

### Final Directory Structure

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_FieldJournal.c
        5_Mission/
            MyFirstMod/
                MissionHello.c
    Data/
        config.cpp
        Stringtable.csv
        Textures/
            field_journal_co.paa
```

### MyFirstMod/mod.cpp

```cpp
name = "My First Mod";
author = "YourName";
version = "1.1";
overview = "My first DayZ mod with a custom item: the Field Journal.";
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
            "DZ_Data"
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

        dependencies[] = { "World", "Mission" };

        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### MyFirstMod/Data/config.cpp

```cpp
class CfgPatches
{
    class MyFirstMod_Data
    {
        units[] = { "MFM_FieldJournal" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Characters"
        };
    };
};

class CfgVehicles
{
    class Inventory_Base;

    class MFM_FieldJournal : Inventory_Base
    {
        scope = 2;
        displayName = "$STR_MFM_FieldJournal";
        descriptionShort = "$STR_MFM_FieldJournal_Desc";
        model = "\DZ\characters\accessories\data\Notebook\Notebook.p3d";
        rotationFlags = 17;
        weight = 200;
        itemSize[] = { 1, 2 };
        absorbency = 0.5;

        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 100;
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
        };

        hiddenSelections[] = { "camoGround" };
        hiddenSelectionsTextures[] = { "MyFirstMod\Data\Textures\field_journal_co.paa" };
    };
};
```

### MyFirstMod/Data/Stringtable.csv

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MFM_FieldJournal","Field Journal","","","","","","","","","","","","",""
"STR_MFM_FieldJournal_Desc","A weathered leather journal used to record field notes and observations.","","","","","","","","","","","","",""
```

### types.xml Entry (Server Mission Folder)

```xml
<type name="MFM_FieldJournal">
    <nominal>10</nominal>
    <lifetime>14400</lifetime>
    <restock>1800</restock>
    <min>5</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="tools" />
    <usage name="Town" />
    <usage name="Village" />
    <value name="Tier1" />
    <value name="Tier2" />
</type>
```

---

## 故障排查

### Item Does Not Appear When Spawned via Script Console

- **Class name mismatch:** The name in the spawn command must match your config.cpp class name exactly: `"MFM_FieldJournal"` (case-sensitive).
- **config.cpp not loaded:** Check that your Data PBO is packed and loaded, or that file patching is active.
- **CfgPatches missing:** Every config.cpp must have a valid `CfgPatches` block.

### Item Name Shows as `$STR_MFM_FieldJournal` (Raw String Reference)

- **Stringtable not found:** Ensure `Stringtable.csv` is in the same PBO as the config that references it, or in the mod root.
- **Wrong key name:** The key in the CSV must match exactly (without the `$` prefix): `"STR_MFM_FieldJournal"`.
- **CSV format error:** Make sure all values are double-quoted and the header row is correct.

### Item Appears All White, Pink, or Invisible

- **Texture path wrong:** Verify that `hiddenSelectionsTextures[]` points to the correct `.paa` file path. Paths use backslashes in config.cpp.
- **Hidden selection name wrong:** The selection name must match what the model defines. Check using Object Builder.
- **Texture not in PBO:** If using packed PBOs, the texture file must be inside the PBO.

### Item Cannot Be Picked 上级

- **`scope` not set to 2:** Ensure `scope = 2;` is in your item class.
- **`itemSize` too large:** If the item size exceeds the player's inventory space, they cannot pick it up.
- **Parent class wrong:** Make sure you are inheriting from `Inventory_Base` or another valid item parent.

### Item Spawns But Has Wrong Size in Inventory

- **`itemSize[]`:** The values are `{ columns, rows }`. `{ 1, 2 }` means 1 wide and 2 tall. `{ 2, 3 }` means 2 wide and 3 tall.

---

## 后续步骤

1. **[Chapter 8.3: Building an Admin Panel Module](03-admin-panel.md)** -- Create a UI panel with server-client communication.
2. **Add variants** -- Create color variants of your item using different hidden selection textures.
3. **Add crafting recipes** -- Define crafting combinations in config.cpp using `CfgRecipes`.
4. **Create clothing** -- Extend `Clothing_Base` instead of `Inventory_Base` for wearable items.
5. **Build a weapon** -- Extend `Weapon_Base` for firearms with attachments and animations.

---

**上一章：** [Chapter 8.1: Your First Mod (Hello World)](01-first-mod.md)
**下一章：** [Chapter 8.3: Building an Admin Panel Module](03-admin-panel.md)
