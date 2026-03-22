# Chapitre 8.5: Using the DayZ Mod Template

[Accueil](../README.md) | [<< Précédent : Adding Chat Commands](04-chat-commands.md) | **Using the DayZ Mod Template** | [Suivant : Debugging & Testing >>](06-debugging-testing.md)

---

> **Résumé :** Ce tutoriel montre you how to use InclementDab's open-source DayZ Mod Template to bootstrap a new mod project in seconds. Instead of creating every file from scratch, you clone a ready-made skeleton that already has the correct folder structure, config.cpp, mod.cpp, and script layer stubs. You then rename a few things and start writing code immediately.

---

## Table des matières

- [What Is the DayZ Mod Template?](#what-is-the-dayz-mod-template)
- [What the Template Provides](#what-the-template-provides)
- [Step 1: Clone or Download the Template](#step-1-clone-or-download-the-template)
- [Step 2: Understand the File Structure](#step-2-understand-the-file-structure)
- [Step 3: Rename the Mod](#step-3-rename-the-mod)
- [Step 4: Update config.cpp](#step-4-update-configcpp)
- [Step 5: Update mod.cpp](#step-5-update-modcpp)
- [Step 6: Rename Script Folders and Files](#step-6-rename-script-folders-and-files)
- [Step 7: Build and Test](#step-7-build-and-test)
- [Integration with DayZ Tools and Workbench](#integration-with-dayz-tools-and-workbench)
- [Template vs. Manual Setup](#template-vs-manual-setup)
- [Next Steps](#next-steps)

---

## What Is the DayZ Mod Template?

The **DayZ Mod Template** is an open-source repository maintained by InclementDab that provides a complete, ready-to-use mod skeleton for DayZ:

**Dépôt :** [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)

Rather than creating every file by hand (as covered in [Chapter 8.1: Your First Mod](01-first-mod.md)), the template gives you a pre-built directory structure with all the boilerplate already in place. You clone it, rename a few identifiers, and you are ready to write game logic.

This is the recommended starting point for anyone who has already built a Hello World mod and wants to move on to more complex projects.

---

## What the Template Provides

The template includes everything a DayZ mod needs to compile and load:

| Fichier / Dossier | Objectif |
|---------------|---------|
| `mod.cpp` | Mod metadata (name, author, version) displayed in the DayZ launcher |
| `config.cpp` | CfgPatches and CfgMods declarations that register the mod with le moteur |
| `Scripts/3_Game/` | Game-layer script stubs (enums, constants, config classes) |
| `Scripts/4_World/` | World-layer script stubs (entities, managers, world interactions) |
| `Scripts/5_Mission/` | Mission-layer script stubs (UI, mission hooks) |
| `.gitignore` | Pre-configured ignores for DayZ development (PBOs, logs, temp files) |

The template follows the standard 5-layer script hierarchy documented in [Chapter 2.1: The 5-Layer Script Hierarchy](../02-mod-structure/01-five-layers.md). All three script layers are wired up in config.cpp so you can immediately place code in any layer without additional configuration.

---

## Step 1: Clone or Download the Template

### Option A: Use GitHub's "Use this template" Feature

1. Go to [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)
2. Click the green **"Use this template"** button at the top of the repository
3. Choose **"Create a new repository"**
4. Name your repository (e.g., `MyAwesomeMod`)
5. Clone your new repository to your P: drive:

```bash
cd P:\
git clone https://github.com/YourUsername/MyAwesomeMod.git
```

### Option B: Direct Clone

If you do not need your own GitHub repository, clone the template directly:

```bash
cd P:\
git clone https://github.com/InclementDab/DayZ-Mod-Template.git MyAwesomeMod
```

### Option C: Download as ZIP

1. Go to the repository page
2. Click **Code** then **Download ZIP**
3. Extract the ZIP to `P:\MyAwesomeMod\`

---

## Step 2: Understand the File Structure

After cloning, your mod directory looks like this:

```
P:\MyAwesomeMod\
    mod.cpp
    Scripts\
        config.cpp
        3_Game\
            ModName\
                (game-layer scripts)
        4_World\
            ModName\
                (world-layer scripts)
        5_Mission\
            ModName\
                (mission-layer scripts)
```

### How Each Piece Fits Together

**`mod.cpp`** is the identity card of your mod. It controls what players see in the DayZ launcher mod list. See [Chapter 2.3: mod.cpp & Workshop](../02-mod-structure/03-mod-cpp.md) for all available fields.

**`Scripts/config.cpp`** is the most critical file. It tells the DayZ engine:
- What your mod depends on (`CfgPatches.requiredAddons[]`)
- Where each script layer lives (`CfgMods.class defs`)
- What preprocessor defines to set (`defines[]`)

See [Chapter 2.2: config.cpp Deep Dive](../02-mod-structure/02-config-cpp.md) for a complete reference.

**`Scripts/3_Game/`** loads first. Place enums, constants, RPC IDs, configuration classes, and anything that does not reference world entities here.

**`Scripts/4_World/`** loads second. Place entity classes (`modded class ItemBase`), managers, and anything that interacts with game objects here.

**`Scripts/5_Mission/`** loads last. Place mission hooks (`modded class MissionServer`), UI panels, and startup logic here. This layer can reference types from all lower layers.

---

## Step 3: Rename the Mod

The template ships with placeholder names. You need to replace them with your mod's actual name. Here is a systematic approach.

### Choose Your Names

Before making any edits, decide on:

| Identifier | Example | Used In |
|------------|---------|---------|
| **Mod display name** | `"My Awesome Mod"` | mod.cpp, config.cpp |
| **Directory name** | `MyAwesomeMod` | Folder name, config.cpp paths |
| **CfgPatches class** | `MyAwesomeMod_Scripts` | config.cpp CfgPatches |
| **CfgMods class** | `MyAwesomeMod` | config.cpp CfgMods |
| **Script subfolder** | `MyAwesomeMod` | Inside 3_Game/, 4_World/, 5_Mission/ |
| **Preprocessor define** | `MYAWESOMEMOD` | config.cpp defines[], #ifdef checks |

### Naming Rules

- **No spaces or special characters** in directory and class names. Use PascalCase or underscores.
- **CfgPatches class names must be globally unique.** Two mods with the same CfgPatches class name will conflict. Use your mod name as a prefix.
- **Script subfolder names** inside each layer should match your mod name for consistency.

---

## Step 4: Update config.cpp

Open `Scripts/config.cpp` and update the following sections.

### CfgPatches

Replace the template class name with your own:

```cpp
class CfgPatches
{
    class MyAwesomeMod_Scripts    // <-- Your unique patch name
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"            // Base game dependency
        };
    };
};
```

If your mod depends on another mod, add its CfgPatches class name to `requiredAddons[]`:

```cpp
requiredAddons[] =
{
    "DZ_Data",
    "CF_Scripts"              // Depends on Community Framework
};
```

### CfgMods

Update the mod identity and script paths:

```cpp
class CfgMods
{
    class MyAwesomeMod
    {
        dir = "MyAwesomeMod";
        name = "My Awesome Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/5_Mission" };
            };
        };
    };
};
```

**Points clés :**
- The `dir` value must match your mod's root folder name exactly.
- Each `files[]` path is relative to the mod root.
- The `dependencies[]` array should list which vanilla script modules you hook into. Most mods use all three: `"Game"`, `"World"`, and `"Mission"`.

### Preprocessor Defines (Optional)

If you want other mods to detect your mod's presence, add a `defines[]` array:

```cpp
class MyAwesomeMod
{
    // ... (other fields above)

    class defs
    {
        class gameScriptModule
        {
            value = "";
            files[] = { "MyAwesomeMod/Scripts/3_Game" };
        };
        // ... other modules ...
    };

    // Enable cross-mod detection
    defines[] = { "MYAWESOMEMOD" };
};
```

Other mods can then use `#ifdef MYAWESOMEMOD` to conditionally compile code that integrates with yours.

---

## Step 5: Update mod.cpp

Open `mod.cpp` in the root directory and update it with your mod's information:

```cpp
name         = "My Awesome Mod";
author       = "YourName";
version      = "1.0.0";
overview     = "A brief description of what your mod does.";
picture      = "";             // Optional: path to a preview image
logo         = "";             // Optional: path to a logo
logoSmall    = "";             // Optional: path to a small logo
logoOver     = "";             // Optional: path to a logo hover state
tooltip      = "My Awesome Mod";
action       = "";             // Optional: URL to your mod's website
```

At minimum, set `name`, `author`, and `overview`. The other fields are optional but improve presentation in the launcher.

---

## Step 6: Rename Script Folders and Files

Rename the script subfolders inside each layer to match your mod name:

```
Scripts/3_Game/ModName/    -->  Scripts/3_Game/MyAwesomeMod/
Scripts/4_World/ModName/   -->  Scripts/4_World/MyAwesomeMod/
Scripts/5_Mission/ModName/ -->  Scripts/5_Mission/MyAwesomeMod/
```

Inside these folders, rename any placeholder `.c` files and update their class names. Par exemple, if the template includes a file like `ModInit.c` with a class named `ModInit`, rename it to `MyAwesomeModInit.c` and update the class:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyAwesomeMod] Server initialized!");
    }
};
```

---

## Step 7: Build and Test

### Using File Patching (Fast Iteration)

The fastest way to test during development:

```batch
DayZDiag_x64.exe -mod=P:\MyAwesomeMod -filePatching
```

This loads your scripts directly from the source folders without packing a PBO. Edit a `.c` file, restart le jeu, and see changes immediately.

### Using Addon Builder (For Distribution)

When you are ready to distribute:

1. Open **DayZ Tools** from Steam
2. Launch **Addon Builder**
3. Set **Source directory** to `P:\MyAwesomeMod\Scripts\`
4. Set **Output directory** to `P:\@MyAwesomeMod\Addons\`
5. Set **Prefix** to `MyAwesomeMod\Scripts`
6. Click **Pack**

Then copy `mod.cpp` next to the `Addons` folder:

```
P:\@MyAwesomeMod\
    mod.cpp
    Addons\
        Scripts.pbo
```

### Verify in the Script Log

After launching, check the script log for your messages:

```
%localappdata%\DayZ\script_<date>_<time>.log
```

Search for your mod's prefix tag (e.g., `[MyAwesomeMod]`).

---

## Integration with DayZ Tools and Workbench

### Workbench

DayZ Workbench can open and edit your mod's scripts with syntax highlighting:

1. Open **Workbench** from DayZ Tools
2. Go to **File > Open** and navigate to your mod's `Scripts/` folder
3. Open any `.c` file to edit with basic Enforce Script support

Workbench reads the `config.cpp` to understand which files belong to which script module, so having a correctly configured config.cpp is essential.

### P: Drive Setup

The template is designed to work from the P: drive. If you cloned to another location, create a junction:

```batch
mklink /J P:\MyAwesomeMod "D:\Projects\MyAwesomeMod"
```

This makes the mod accessible at `P:\MyAwesomeMod` without moving files.

### Addon Builder Automation

For repeated builds, you can create a batch file in your mod's root:

```batch
@echo off
set DAYZ_TOOLS="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"
set SOURCE=P:\MyAwesomeMod\Scripts
set OUTPUT=P:\@MyAwesomeMod\Addons
set PREFIX=MyAwesomeMod\Scripts

%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe %SOURCE% %OUTPUT% -prefix=%PREFIX% -clear
echo Build complete.
pause
```

---

## Template vs. Manual Setup

| Aspect | Template | Manuel (Chapter 8.1) |
|--------|----------|----------------------|
| **Time to first build** | ~2 minutes | ~15 minutes |
| **All 3 script layers** | Pre-configured | You add them as needed |
| **config.cpp** | Complete with all modules | Minimal (mission only) |
| **Git ready** | .gitignore included | You create your own |
| **Learning value** | Lower (files pre-made) | Higher (build everything yourself) |
| **Recommended for** | Experienced modders, new projects | First-time modders learning the ropes |

**Recommandation :** If this is your very first DayZ mod, start with [Chapter 8.1](01-first-mod.md) to understand every file. Once you are comfortable, use the template for all future projects.

---

## Prochaines étapes

With your template-based mod up and running, you can:

1. **Add a custom item** -- Follow [Chapter 8.2: Creating a Custom Item](02-custom-item.md) to define items in config.cpp.
2. **Build an admin panel** -- Follow [Chapter 8.3: Building an Admin Panel](03-admin-panel.md) for server management UI.
3. **Add chat commands** -- Follow [Chapter 8.4: Adding Chat Commands](04-chat-commands.md) for in-game text commands.
4. **Study config.cpp in depth** -- Read [Chapter 2.2: config.cpp Deep Dive](../02-mod-structure/02-config-cpp.md) to understand every field.
5. **Learn mod.cpp options** -- Read [Chapter 2.3: mod.cpp & Workshop](../02-mod-structure/03-mod-cpp.md) for Workshop publishing.
6. **Add dependencies** -- If your mod uses Community Framework or another mod, update `requiredAddons[]` and see [Chapter 2.4: Your First Mod](../02-mod-structure/04-minimum-viable-mod.md).

---

**Précédent :** [Chapter 8.4: Adding Chat Commands](04-chat-commands.md) | [Accueil](../README.md)
