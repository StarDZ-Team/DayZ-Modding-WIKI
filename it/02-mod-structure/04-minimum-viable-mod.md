# Chapter 2.4: Your First Mod -- Minimum Viable

[Home](../README.md) | [<< Previous: mod.cpp & Workshop](03-mod-cpp.md) | **Minimum Viable Mod** | [Next: File Organization >>](05-file-organization.md)

---

## Indice dei Contenuti

- [What You Need](#what-you-need)
- [The Goal](#the-goal)
- [Step 1: Create the Directory Structure](#step-1-create-the-directory-structure)
- [Step 2: Create mod.cpp](#step-2-create-modcpp)
- [Step 3: Create config.cpp](#step-3-create-configcpp)
- [Step 4: Create Your First Script](#step-4-create-your-first-script)
- [Step 5: Pack and Test](#step-5-pack-and-test)
- [Step 6: Verify It Works](#step-6-verify-it-works)
- [Understanding What Happened](#understanding-what-happened)
- [Next Steps](#next-steps)
- [Troubleshooting](#troubleshooting)

---

## Cosa Serve

- DayZ game installed (retail or DayZ Tools/Diag)
- A text editor (VS Code, Notepad++, or any plain text editor)
- DayZ Tools installed (for PBO packing) -- OR you can test without packing (vedi Step 5)

---

## L'Obiettivo

Noi create a mod called **HelloMod** that:
1. Loads into DayZ without errors
2. Prints `"[HelloMod] Mission started!"` to the script log
3. Uses the correct standard structure

Questo e' the DayZ equivalent of "Hello World."

---

## Step 1: Create the Directory Structure

Create the following folders and files. You need exactly **3 files**:

```
HelloMod/
  mod.cpp
  Scripts/
    config.cpp
    5_Mission/
      HelloMod/
        HelloMission.c
```

Cioe' the complete structure. Let us create each file.

---

## Step 2: Create mod.cpp

Create `HelloMod/mod.cpp` with this content:

```cpp
name = "Hello Mod";
author = "YourName";
version = "1.0";
overview = "My first DayZ mod - prints a message on mission start.";
```

Questo e' the minimum metadata. The DayZ launcher will show "Hello Mod" in the mod list.

---

## Step 3: Create config.cpp

Create `HelloMod/Scripts/config.cpp` with this content:

```cpp
class CfgPatches
{
    class HelloMod_Scripts
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
    class HelloMod
    {
        dir = "HelloMod";
        name = "Hello Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "HelloMod/Scripts/5_Mission" };
            };
        };
    };
};
```

Let us break down what each part does:

- **CfgPatches** declares the mod to the engine. `requiredAddons` says we depend on `DZ_Data` (vanilla DayZ data), which ensures we load after the base game.
- **CfgMods** tells the engine where our scripts live. We only use `5_Mission` perche' that is where mission lifecycle hooks are available.
- **dependencies** lists `"Mission"` perche' our code hooks into the mission script module.

---

## Step 4: Create Your First Script

Create `HelloMod/Scripts/5_Mission/HelloMod/HelloMission.c` with this content:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Server is running.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Client is running.");
    }
};
```

What this does:

- `modded class MissionServer` extends the vanilla server mission class. When the server starts a mission, `OnInit()` fires and our message prints.
- `modded class MissionGameplay` does the same for the client side.
- `super.OnInit()` calls the original (vanilla) implementation first -- this is critical. Mai skip it.
- `Print()` writes to the DayZ script log file.

---

## Step 5: Pack and Test

You have two options for testing:

### Option A: File Patching (No PBO Obbligatorio -- Development Only)

DayZ supports loading unpacked mods during development. Questo e' the fastest way to iterate.

1. Place your `HelloMod/` folder inside your DayZ installation directory (or use the P: drive with workbench)
2. Launch DayZ with the `-filePatching` parameter and load your mod:

```
DayZDiag_x64.exe -mod=HelloMod -filePatching
```

This loads scripts directly from the folder without PBO packing.

### Option B: PBO Packing (Obbligatorio for Distribution)

For Workshop publishing or server deployment, you need to pack into a PBO:

1. Open **DayZ Tools** (from Steam)
2. Open **Addon Builder**
3. Set the source directory to `HelloMod/Scripts/`
4. Set the output to `@HelloMod/Addons/HelloMod_Scripts.pbo`
5. Click **Pack**

Or use a command-line packer like `PBOConsole`:

```
PBOConsole.exe -pack HelloMod/Scripts @HelloMod/Addons/HelloMod_Scripts.pbo
```

Place the `mod.cpp` next to the `Addons/` folder:

```
@HelloMod/
  mod.cpp
  Addons/
    HelloMod_Scripts.pbo
```

Then launch DayZ:

```
DayZDiag_x64.exe -mod=@HelloMod
```

---

## Step 6: Verifica It Works

### Finding the Script Log

DayZ writes script output to log files in your profile directory:

```
Windows: C:\Users\YourName\AppData\Local\DayZ\
```

Look for the most recent `.RPT` or `.log` file. The script log is typically named:

```
script_<date>_<time>.log
```

### What to Look For

Open the log file and search for `[HelloMod]`. Dovresti vedi:

```
[HelloMod] Mission started! Server is running.
```

or (if you joined as a client):

```
[HelloMod] Mission started! Client is running.
```

Se vedi this message, congratulations -- your mod is working.

### If You Vedi Errors

If the log contains lines starting with `SCRIPT (E):`, something went wrong. Vedi the [Troubleshooting](#troubleshooting) section below.

---

## Capire Cosa e' Successo

Ecco il sequence of events when DayZ loaded your mod:

```
1. Engine starts, reads config.cpp files from all PBOs
2. CfgPatches "HelloMod_Scripts" is registered
   --> requiredAddons ensures it loads after DZ_Data
3. CfgMods "HelloMod" is registered
   --> Engine knows about the missionScriptModule path
4. Engine compiles all mods' 5_Mission scripts
   --> HelloMission.c is compiled
   --> "modded class MissionServer" patches the vanilla class
5. Server starts a mission
   --> MissionServer.OnInit() is called
   --> Your override runs, calling super.OnInit() first
   --> Print() writes to the script log
6. Client connects and loads
   --> MissionGameplay.OnInit() is called
   --> Your override runs
   --> Print() writes to the client log
```

The `modded` keyword is the key mechanism. It tells the engine "take the existing class and add my changes on top." Questo e' how every DayZ mod integrates with vanilla code.

---

## Prossimi Passi

Now that you have a working mod, here are natural progressions:

### Add a 3_Game Layer

Add configuration data or constants that do not depend on world entities:

```
HelloMod/
  Scripts/
    config.cpp              <-- Add gameScriptModule entry
    3_Game/
      HelloMod/
        HelloConfig.c       <-- Configuration class
    5_Mission/
      HelloMod/
        HelloMission.c      <-- Existing file
```

Update `config.cpp` to include the new layer:

```cpp
dependencies[] = { "Game", "Mission" };

class defs
{
    class gameScriptModule
    {
        value = "";
        files[] = { "HelloMod/Scripts/3_Game" };
    };
    class missionScriptModule
    {
        value = "";
        files[] = { "HelloMod/Scripts/5_Mission" };
    };
};
```

### Add a 4_World Layer

Create custom items, extend players, or add world managers:

```
HelloMod/
  Scripts/
    config.cpp              <-- Add worldScriptModule entry
    3_Game/
      HelloMod/
        HelloConfig.c
    4_World/
      HelloMod/
        HelloManager.c      <-- World-aware logic
    5_Mission/
      HelloMod/
        HelloMission.c
```

### Add UI

Create a simple in-game panel (covered in Part 3 of this guide):

```
HelloMod/
  GUI/
    layouts/
      hello_panel.layout    <-- UI layout file
  Scripts/
    5_Mission/
      HelloMod/
        HelloPanel.c        <-- UI script
```

### Add a Custom Item

Define an item in `Data/config.cpp` and create its script comportamento in `4_World`:

```
HelloMod/
  Data/
    config.cpp              <-- CfgVehicles with item definition
    Models/
      hello_item.p3d        <-- 3D model
  Scripts/
    4_World/
      HelloMod/
        HelloItem.c         <-- Item behavior script
```

### Depend on a Framework

Se want to use Community Framework (CF) features, add the dependency:

```cpp
// In config.cpp
requiredAddons[] = { "DZ_Data", "JM_CF_Scripts" };
```

---

## Risoluzione dei Problemi

### "Addon HelloMod_Scripts requires addon DZ_Data which is not loaded"

Your `requiredAddons` references an addon that is not present. Make sure `DZ_Data` is spelled correctly and DayZ base game is loaded.

### No Log Output (Mod Seems to Not Load)

Controlla these in order:

1. **Is the mod in the launch parameter?** Verifica `-mod=HelloMod` or `-mod=@HelloMod` is in your launch command.
2. **Is config.cpp in the right place?** It must be at the root of the PBO (or the root of the `Scripts/` folder when file-patching).
3. **Are the script paths correct?** The `files[]` paths in `config.cpp` must match the actual directory structure. `"HelloMod/Scripts/5_Mission"` means the engine looks for that exact path.
4. **Is there a CfgPatches class?** Without it, the PBO is ignored.

### SCRIPT (E): Undefined variable / Undefined type

Your code references something that does not exist at that layer. Comune causes:

- Referencing `PlayerBase` from `3_Game` (it is defined in `4_World`)
- Typo in a class or variable name
- Missing `super.OnInit()` call (causes cascade failures)

### SCRIPT (E): Member not found

The method or property you are calling does not exist on that class. Double-check the vanilla API. Comune mistake: calling methods from a newer DayZ version when running an older one.

### Mod Loads But Script Does Not Run

- Controlla that your `.c` file is inside the directory listed in `files[]`
- Assicurati the file has a `.c` extension (not `.txt` or `.cs`)
- Verifica the `modded class` name matches the vanilla class exactly (case-sensitive)

### PBO Packing Errors

- Assicurati `config.cpp` is at the root level inside the PBO
- File paths inside PBOs use forward slashes (`/`), not backslashes
- Make sure there are no binary files in the Scripts folder (only `.c` and `.cpp`)

---

## Elenco Completo dei File

Per riferimento, here are all three files in their entirety:

### HelloMod/mod.cpp

```cpp
name = "Hello Mod";
author = "YourName";
version = "1.0";
overview = "My first DayZ mod - prints a message on mission start.";
```

### HelloMod/Scripts/config.cpp

```cpp
class CfgPatches
{
    class HelloMod_Scripts
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
    class HelloMod
    {
        dir = "HelloMod";
        name = "Hello Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "HelloMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### HelloMod/Scripts/5_Mission/HelloMod/HelloMission.c

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Server is running.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Client is running.");
    }
};
```

---

**Precedente:** [Chapter 2.3: mod.cpp & Workshop](03-mod-cpp.md)
**Successivo:** [Chapter 2.5: File Organization Best Practices](05-file-organization.md)
