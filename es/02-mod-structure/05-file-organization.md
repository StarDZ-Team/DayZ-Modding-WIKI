# Capítulo 2.5: File Organization Best Practices

[Inicio](../README.md) | [<< Anterior: Minimum Viable Mod](04-minimum-viable-mod.md) | **File Organization** | [Siguiente: Server vs Client Architecture >>](06-server-client-split.md)

---

> **Resumen:** How you organize files determines whether your mod is maintainable at 10 files or 1,000. This chapter covers the canonical directory structure, naming conventions, content vs script vs framework mods, client-server splits, and lessons from professional DayZ mods.

---

## Tabla de Contenidos

- [The Canonical Directory Structure](#the-canonical-directory-structure)
- [Naming Conventions](#naming-conventions)
- [Three Types of Mods](#three-types-of-mods)
- [Client-Server Split Mods](#client-server-split-mods)
- [What Goes Where](#what-goes-where)
- [PBO Naming and @mod Folder Naming](#pbo-naming-and-mod-folder-naming)
- [Real Examples from Professional Mods](#real-examples-from-professional-mods)
- [Anti-Patterns](#anti-patterns)

---

## The Canonical Directory Structure

This is the standard layout used by professional DayZ mods. Not every folder is required -- only create what you need.

```
MyMod/                                    <-- Project root (development)
  mod.cpp                                 <-- Launcher metadata
  stringtable.csv                         <-- Localization (at mod root, NOT in Scripts/)

  Scripts/                                <-- Script PBO root
    config.cpp                            <-- CfgPatches + CfgMods + script module defs
    Inputs.xml                            <-- Custom keybindings (optional)
    Data/
      Credits.json                        <-- Author credits
      Version.hpp                         <-- Version string (optional)

    1_Core/                               <-- engineScriptModule (rare)
      MyMod/
        Constants.c

    3_Game/                               <-- gameScriptModule
      MyMod/
        MyModConfig.c                     <-- Configuration class
        MyModRPCs.c                       <-- RPC identifiers / registration
        Data/
          SomeDataClass.c                 <-- Pure data structures

    4_World/                              <-- worldScriptModule
      MyMod/
        Entities/
          MyCustomItem.c                  <-- Custom items
          MyCustomVehicle.c
        Managers/
          MyModManager.c                  <-- World-aware managers
        Actions/
          ActionMyCustom.c                <-- Custom player actions

    5_Mission/                            <-- missionScriptModule
      MyMod/
        MyModRegister.c                   <-- Mod registration (startup hook)
        GUI/
          MyModPanel.c                    <-- UI panel scripts
          MyModHUD.c                      <-- HUD overlay scripts

  GUI/                                    <-- GUI PBO root (separate from Scripts)
    config.cpp                            <-- GUI-specific config (imageSets, styles)
    layouts/                              <-- .layout files
      mymod_panel.layout
      mymod_hud.layout
    imagesets/                            <-- .imageset files + texture atlases
      mymod_icons.imageset
      mymod_icons.edds
    looknfeel/                            <-- .styles files
      mymod.styles

  Data/                                   <-- Data PBO root (models, textures, items)
    config.cpp                            <-- CfgVehicles, CfgWeapons, etc.
    Models/
      my_item.p3d                         <-- 3D models
    Textures/
      my_item_co.paa                      <-- Color textures
      my_item_nohq.paa                    <-- Normal maps
    Materials/
      my_item.rvmat                       <-- Material definitions

  Sounds/                                 <-- Sound files
    alert.ogg                             <-- Audio files (always .ogg)
    ambient.ogg

  ServerFiles/                            <-- Files for server admins to copy
    types.xml                             <-- Central Economy spawn definitions
    cfgspawnabletypes.xml                 <-- Attachment presets
    README.md                             <-- Installation guide

  Keys/                                   <-- Signature keys
    MyMod.bikey                           <-- Public key for server verification
```

---

## Naming Conventions

### Mod/Project Names

Use PascalCase with a clear prefix:

```
MyFramework          <-- Framework, prefix: MyFW_
MyMod_Missions      <-- Feature mod
MyMod_Weapons       <-- Content mod
VPPAdminTools        <-- Some mods skip underscores
DabsFramework        <-- PascalCase without separator
```

### Class Names

Use a short prefix unique to your mod, followed by an underscore and the class purpose:

```c
// MyMod pattern: MyMod_[Subsystem]_[Name]
class MyLog             // Core logging
class MyRPC             // Core RPC
class MyW_Config        // Weapons config
class MyM_MissionBase   // Missions base

// CF pattern: CF_[Name]
class CF_ModuleWorld
class CF_EventArgs

// COT pattern: JM_COT_[Name]
class JM_COT_Menu

// VPP pattern: [Name] (no prefix)
class ChatCommandBase
class WebhookManager
```

**Rules:**
- Prefix prevents collisions with other mods
- Keep it short (2-4 characters)
- Be consistent within your mod

### File Names

Name each file after the primary class it contains:

```
MyLog.c            <-- Contains class MyLog
MyRPC.c            <-- Contains class MyRPC
MyModConfig.c        <-- Contains class MyModConfig
ActionMyCustom.c     <-- Contains class ActionMyCustom
```

One class per file is the ideal. Multiple small helper classes in one file is acceptable when they are tightly coupled.

### Layout Files

Use lowercase with your mod prefix:

```
my_admin_panel.layout
my_killfeed_overlay.layout
mymod_settings_dialog.layout
```

### Variable Names

```c
// Member variables: m_ prefix
protected int m_Count;
protected ref array<string> m_Items;
protected ref MyConfig m_Config;

// Static variables: s_ prefix
static int s_InstanceCount;
static ref MyLog s_Logger;

// Constants: ALL_CAPS
const int MAX_PLAYERS = 60;
const float UPDATE_INTERVAL = 0.5;
const string MOD_NAME = "MyMod";

// Local variables: camelCase (no prefix)
int count = 0;
string playerName = identity.GetName();
float deltaTime = timeArgs.DeltaTime;

// Parameters: camelCase (no prefix)
void SetConfig(MyConfig config, bool forceReload)
```

---

## Three Types of Mods

DayZ mods fall into three categories. Each has a different structure emphasis.

### 1. Content Mod

Adds items, weapons, vehicles, buildings -- primarily 3D assets with minimal scripting.

```
MyWeaponPack/
  mod.cpp
  Data/
    config.cpp                <-- CfgVehicles, CfgWeapons, CfgMagazines, CfgAmmo
    Weapons/
      MyRifle/
        MyRifle.p3d
        MyRifle_co.paa
        MyRifle_nohq.paa
        MyRifle.rvmat
    Ammo/
      MyAmmo/
        MyAmmo.p3d
  Scripts/                    <-- Minimal (may not even exist)
    config.cpp
    4_World/
      MyWeaponPack/
        MyRifle.c             <-- Only if the weapon needs custom behavior
  ServerFiles/
    types.xml
```

**Characteristics:**
- Heavy on `Data/` (models, textures, materials)
- Heavy on `Data/config.cpp` (CfgVehicles, CfgWeapons definitions)
- Minimal or no scripting
- Scripts only when items need custom behavior beyond what config defines

### 2. Script Mod

Adds gameplay features, admin tools, systems -- primarily code with minimal assets.

```
MyAdminTools/
  mod.cpp
  stringtable.csv
  Scripts/
    config.cpp
    3_Game/
      MyAdminTools/
        Config.c
        RPCHandler.c
        Permissions.c
    4_World/
      MyAdminTools/
        PlayerManager.c
        VehicleManager.c
    5_Mission/
      MyAdminTools/
        AdminMenu.c
        AdminHUD.c
  GUI/
    layouts/
      admin_menu.layout
      admin_hud.layout
    imagesets/
      admin_icons.imageset
```

**Characteristics:**
- Heavy on `Scripts/` (most code in 3_Game, 4_World, 5_Mission)
- GUI layouts and imagesets for UI
- Little or no `Data/` (no 3D models)
- Usually depends on a framework (CF, DabsFramework, or a custom framework)

### 3. Framework Mod

Provides shared infrastructure for other mods -- logging, RPC, configuration, UI systems.

```
MyFramework/
  mod.cpp
  stringtable.csv
  Scripts/
    config.cpp
    Data/
      Credits.json
    1_Core/                     <-- Frameworks often use 1_Core
      MyFramework/
        Constants.c
        LogLevel.c
    3_Game/
      MyFramework/
        Config/
          ConfigManager.c
          ConfigBase.c
        RPC/
          RPCManager.c
        Events/
          EventBus.c
        Logging/
          Logger.c
        Permissions/
          PermissionManager.c
        UI/
          ViewBase.c
          DialogBase.c
    4_World/
      MyFramework/
        Module/
          ModuleManager.c
          ModuleBase.c
        Player/
          PlayerData.c
    5_Mission/
      MyFramework/
        MissionHooks.c
        ModRegistration.c
  GUI/
    config.cpp
    layouts/
    imagesets/
    icons/
    looknfeel/
```

**Characteristics:**
- Uses all script layers (1_Core through 5_Mission)
- Deep subdirectory hierarchy in each layer
- Defines `defines[]` for feature detection
- Other mods depend on it via `requiredAddons`
- Provides base classes that other mods extend

---

## Client-Server Split Mods

When a mod has both client-visible behavior (UI, entity rendering) and server-only logic (spawning, AI brains, secure state), it should split into two packages.

### Directory Structure

```
MyMod/                                    <-- Project root (development repo)
  MyMod_Sub/                           <-- Client package (loaded via -mod=)
    mod.cpp
    stringtable.csv
    Scripts/
      config.cpp                          <-- type = "mod"
      3_Game/MyMod/                       <-- Shared data classes, RPCs
      4_World/MyMod/                      <-- Client-side entity rendering
      5_Mission/MyMod/                    <-- Client UI, HUD
    GUI/
      layouts/
    Sounds/

  MyMod_SubServer/                     <-- Server package (loaded via -servermod=)
    mod.cpp
    Scripts/
      config.cpp                          <-- type = "servermod"
      3_Game/MyModServer/                 <-- Server-side data classes
      4_World/MyModServer/                <-- Spawning, AI logic, state management
      5_Mission/MyModServer/              <-- Server startup/shutdown hooks
```

### Key Rules for Split Mods

1. **The client package is loaded by everyone** (server and all clients via `-mod=`)
2. **The server package is loaded only by the server** (via `-servermod=`)
3. **The server package depends on the client package** (via `requiredAddons`)
4. **Never put UI code in the server package** -- clients will not receive it
5. **Keep secure/private logic in the server package** -- it is never sent to clients

### Dependency Chain

```cpp
// Client package config.cpp
class CfgPatches
{
    class MyMod_Sub_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "MyMod_Core_Scripts" };
    };
};

// Server package config.cpp
class CfgPatches
{
    class MyMod_SubServer_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "MyMod_Sub_Scripts", "MyMod_Core_Scripts" };
        //                                  ^^^ depends on client package
    };
};
```

### Real Example: Missions Client-Server Split

```
MyMod_Missions/
  MyMod_Missions/                        <-- Client (-mod=)
    mod.cpp                               type = "mod"
    Scripts/
      config.cpp                          requiredAddons: MyMod_Core_Scripts
      3_Game/MyMod_Missions/             Shared enums, config, RPC IDs
      4_World/MyMod_Missions/            Mission markers (client rendering)
      5_Mission/MyMod_Missions/          Mission UI, radio HUD
    GUI/layouts/                          Mission panel layouts
    Sounds/                               Radio beep sounds

  MyMod_MissionsServer/                 <-- Server (-servermod=)
    mod.cpp                               type = "servermod"
    Scripts/
      config.cpp                          requiredAddons: MyMod_Scripts, MyMod_Core_Scripts
      3_Game/MyMod_MissionsServer/       Server config extensions
      4_World/MyMod_MissionsServer/      Mission spawner, loot manager
      5_Mission/MyMod_MissionsServer/    Server mission lifecycle
```

---

## What Goes Where

### Data/ Directory

Physical assets and item definitions:

```
Data/
  config.cpp          <-- CfgVehicles, CfgWeapons, CfgMagazines, CfgAmmo
  Models/             <-- .p3d 3D model files
  Textures/           <-- .paa, .edds texture files
  Materials/          <-- .rvmat material definitions
  Animations/         <-- .anim animation files (rare)
```

### Scripts/ Directory

All Enforce Script code:

```
Scripts/
  config.cpp          <-- CfgPatches, CfgMods, script module definitions
  Inputs.xml          <-- Keybinding definitions
  Data/
    Credits.json      <-- Author credits
    Version.hpp       <-- Version string
  1_Core/             <-- Fundamental constants and utilities
  3_Game/             <-- Configs, RPCs, data classes
  4_World/            <-- Entities, managers, gameplay logic
  5_Mission/          <-- UI, HUD, mission lifecycle
```

### GUI/ Directory

User interface resources:

```
GUI/
  config.cpp          <-- GUI-specific CfgPatches (for imageset/style registration)
  layouts/            <-- .layout files (widget trees)
  imagesets/          <-- .imageset XML + .edds texture atlases
  icons/              <-- Icon imagesets (may be separate from general imagesets)
  looknfeel/          <-- .styles files (widget visual properties)
  fonts/              <-- Custom font files (rare)
  sounds/             <-- UI sound files (click, hover, etc.)
```

### Sounds/ Directory

Audio files:

```
Sounds/
  alert.ogg           <-- Always .ogg format
  ambient.ogg
  click.ogg
```

Sound config (CfgSoundSets, CfgSoundShaders) goes in `Scripts/config.cpp`, not in a separate Sounds config.

### ServerFiles/ Directory

Files that server administrators copy to their server's mission folder:

```
ServerFiles/
  types.xml                   <-- Item spawn definitions for Central Economy
  cfgspawnabletypes.xml       <-- Attachment/cargo presets
  cfgeventspawns.xml          <-- Event spawn positions (rare)
  README.md                   <-- Installation instructions
```

---

## PBO Naming and @mod Folder Naming

### PBO Names

Each PBO gets a descriptive name with the mod prefix:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo         <-- Script code
    MyMod_Data.pbo            <-- Models, textures, items
    MyMod_GUI.pbo             <-- Layouts, imagesets, styles
    MyMod_Sounds.pbo          <-- Audio (sometimes bundled with Data)
```

The PBO name does not need to match the CfgPatches class name, but keeping them aligned prevents confusion.

### @mod Folder Name

The `@` prefix is a Steam Workshop convention. During development, you may omit it:

```
Development:    MyMod/           <-- No @ prefix
Workshop:       @MyMod/          <-- With @ prefix
```

The `@` has no technical meaning to the engine. It is purely organizational convention.

### Multiple PBOs Per Mod

Large mods split into multiple PBOs for several reasons:

1. **Separate update cycles** -- update scripts without re-downloading 3D models
2. **Optional components** -- GUI PBO is optional if mod works headless
3. **Build pipeline** -- different PBOs built by different tools

```
@MyMod_Weapons/
  Addons/
    MyMod_Weapons_Scripts.pbo    <-- Script behavior
    MyMod_Weapons_Data.pbo       <-- 268 weapon models, textures, configs
```

Each PBO has its own `config.cpp` with its own `CfgPatches` entry. The `requiredAddons` between them controls the load order:

```cpp
// Scripts/config.cpp
class CfgPatches
{
    class MyMod_Weapons_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "DZ_Weapons_Firearms" };
    };
};

// Data/config.cpp
class CfgPatches
{
    class MyMod_Weapons_Data
    {
        requiredAddons[] = { "DZ_Data", "DZ_Weapons_Firearms" };
    };
};
```

---

## Real Examples from Professional Mods

### Framework Mod Example

```
MyFramework/
  MyFramework/                            <-- Client package
    mod.cpp
    stringtable.csv
    GUI/
      config.cpp
      fonts/
      icons/                              <-- 5 icon weight imagesets
      imagesets/
      layouts/
        dialogs/
        options/
        prefabs/
        MyMod/loading/hints/
        MyFramework/AdminPanel/
        MyFramework/Dialogs/
        MyFramework/Modules/
        MyFramework/Options/
        MyFramework/Prefabs/
        MyFramework/Tooltip/
      looknfeel/
      sounds/
    Scripts/
      config.cpp
      Inputs.xml
      1_Core/MyMod/                      <-- Log levels, constants
      2_GameLib/MyMod/UI/                <-- MVC attribute system
      3_Game/MyMod/                      <-- 15+ subsystem folders
        Animation/
        Branding/
        Chat/
        Collections/
        Config/
        Core/
        Events/
        Hints/
        Killfeed/
        Logging/
        Module/
        MVC/
        Notifications/
        Permissions/
        PlayerData/
        RPC/
        Settings/
        Theme/
        Timer/
        UI/
      4_World/MyMod/                     <-- Player data, world managers
      5_Mission/MyMod/                   <-- Admin panel, mod registration

  MyFramework_Server/                     <-- Server package
    mod.cpp
    Scripts/
      config.cpp
      ...
```

### Community Online Tools (COT) -- Admin Tool

```
JM/COT/
  mod.cpp
  GUI/
    config.cpp
    layouts/
      cursors/
      uiactions/
      vehicles/
    textures/
  Objects/Debug/
    config.cpp                            <-- Debug entity definitions
  Scripts/
    config.cpp
    Data/
      Credits.json
      Version.hpp
      Inputs.xml
    Common/                               <-- Shared across all layers
    1_Core/
    3_Game/
    4_World/
    5_Mission/
  languagecore/
    config.cpp                            <-- String table config
```

Note the `Common/` folder pattern: included in every script module via `files[]`, allowing shared types across all layers.

### Content Mod Example

```
MyMod_Weapons/
  MyMod_Weapons/
    mod.cpp
    Data/
      config.cpp                          <-- Merged config: 268 weapon definitions
      Ammo/                               <-- Organized by source/caliber
        BC/12.7x55/
        BC/338/
        BC/50Cal/
        GCGN/3006/
        GCGN/300AAC/
      Attachments/                        <-- Scopes, suppressors, grips
      Magazines/
      Weapons/                            <-- Weapon models organized by source
    Scripts/
      config.cpp                          <-- Script module definitions
      3_Game/                             <-- Weapon config, stat system
      4_World/                            <-- Weapon behavior overrides
      5_Mission/                          <-- Registration, UI
```

Content mods have a massive `Data/` directory and relatively small `Scripts/`.

### DabsFramework -- UI Framework

```
DabsFramework/
  mod.cpp
  gui/
    config.cpp
    imagesets/
    icons/
      brands.imageset
      light.imageset
      regular.imageset
      solid.imageset
      thin.imageset
    looknfeel/
  scripts/
    config.cpp
    Credits.json
    Version.hpp
    1_core/
    2_GameLib/                            <-- One of few mods using layer 2
    3_Game/
    4_World/
    5_Mission/
```

Note: DabsFramework uses lowercase folder names (`scripts/`, `gui/`). This works because Windows is case-insensitive, but may cause issues on Linux. The convention is to use the canonical casing (`Scripts/`, `GUI/`).

---

## Anti-Patterns

### 1. Flat Script Dump

```
Scripts/
  3_Game/
    AllMyStuff.c            <-- 2000 lines, 15 classes
    MoreStuff.c             <-- 1500 lines, 12 classes
```

**Fix:** One file per class, organized in subdirectories by subsystem.

### 2. Wrong Layer Placement

```
Scripts/
  3_Game/
    MyMod/
      PlayerManager.c       <-- References PlayerBase (defined in 4_World)
      MyPanel.c             <-- UI code (belongs in 5_Mission)
      MyItem.c              <-- Extends ItemBase (belongs in 4_World)
```

**Fix:** Follow the layer rules from Chapter 2.1. Move entity code to `4_World` and UI code to `5_Mission`.

### 3. No Mod Subdirectory in Script Layers

```
Scripts/
  3_Game/
    Config.c                <-- Name collision risk with other mods!
    RPCs.c
```

**Fix:** Always namespace with a subdirectory:

```
Scripts/
  3_Game/
    MyMod/
      Config.c
      RPCs.c
```

### 4. stringtable.csv Inside Scripts/

```
Scripts/
  stringtable.csv           <-- WRONG LOCATION
  config.cpp
```

**Fix:** `stringtable.csv` goes at the mod root (next to `mod.cpp`):

```
MyMod/
  mod.cpp
  stringtable.csv           <-- Correct
  Scripts/
    config.cpp
```

### 5. Mixed Assets and Scripts in One PBO

```
MyMod/
  config.cpp
  Scripts/3_Game/...
  Models/weapon.p3d
  Textures/weapon_co.paa
```

**Fix:** Separate into multiple PBOs:

```
MyMod/
  Scripts/
    config.cpp
    3_Game/...
  Data/
    config.cpp
    Models/weapon.p3d
    Textures/weapon_co.paa
```

### 6. Deeply Nested Subdirectories

```
Scripts/3_Game/MyMod/Systems/Core/Config/Managers/Settings/PlayerSettings.c
```

**Fix:** Keep nesting to 2-3 levels maximum. Flatten when possible:

```
Scripts/3_Game/MyMod/Config/PlayerSettings.c
```

### 7. Inconsistent Naming

```
mymod_Config.c
MyMod_rpc.c
MYMOD_Manager.c
my_mod_panel.c
```

**Fix:** Pick one convention and stick with it:

```
MyModConfig.c
MyModRPC.c
MyModManager.c
MyModPanel.c
```

---

## Summary Checklist

Before publishing your mod, verify:

- [ ] `mod.cpp` is at the mod root (next to `Addons/` or `Scripts/`)
- [ ] `stringtable.csv` is at the mod root (NOT inside `Scripts/`)
- [ ] `config.cpp` exists in every PBO root
- [ ] `requiredAddons[]` lists ALL dependencies
- [ ] Script module `files[]` paths match the actual directory structure
- [ ] Every `.c` file is inside a mod-namespaced subdirectory (e.g., `3_Game/MyMod/`)
- [ ] Class names have a unique prefix to avoid collisions
- [ ] Entity classes are in `4_World`, UI classes are in `5_Mission`, data classes are in `3_Game`
- [ ] No secrets or debug code in the published PBOs
- [ ] Server-only logic is in a separate `-servermod` package (if applicable)

---

## Observado en Mods Reales

| Patrón | Mod | Detalle |
|---------|-----|--------|
| Deep subsystem folders in `3_Game` | StarDZ Core | 15+ folders under `3_Game/` (Config, RPC, Events, Logging, Permissions, etc.) |
| `Common/` shared folder | COT | Included in every script module's `files[]` to provide cross-layer utility types |
| Lowercase folder names | DabsFramework | Uses `scripts/`, `gui/` instead of `Scripts/`, `GUI/` -- works on Windows but risks issues on Linux |
| Separate GUI PBO | Expansion, COT | GUI resources (layouts, imagesets, styles) packed into a dedicated PBO with its own config.cpp |
| Minimal Scripts for content mods | Weapon packs | `Data/` directory dominates; `Scripts/` has only a thin config.cpp and optional behavior overrides |

---

## Teoría vs Práctica

| Concepto | Teoría | Realidad |
|---------|--------|---------|
| One class per file | Each `.c` file contains one class | Small helper classes and enums are often co-located with their parent class for convenience |
| Separate PBOs for Scripts/Data/GUI | Clean separation by concern | Small mods often merge everything into a single PBO to simplify distribution |
| Mod subfolder prevents collisions | `3_Game/MyMod/` namespaces files | True, but class names still collide globally -- the subfolder only prevents file-level conflicts |
| `stringtable.csv` at mod root | Engine finds it automatically | Must be at the PBO root that gets loaded; placing it inside `Scripts/` causes it to be silently ignored |
| ServerFiles/ ships with the mod | Server admins copy types.xml | Many mod authors forget to include ServerFiles, forcing admins to create types.xml entries manually |

---

## Compatibilidad e Impacto

- **Multi-Mod:** File organization itself does not cause conflicts. However, two mods placing files with the same path inside their PBOs (e.g., both using `3_Game/Config.c` without a mod subfolder) will collide at the engine level, causing one to silently override the other.
- **Performance:** Directory depth and file count have no measurable impact on script compilation time. The engine recursively scans all listed `files[]` directories regardless of nesting.

---

**Anterior:** [Chapter 2.4: Your First Mod -- Minimum Viable](04-minimum-viable-mod.md)
**Siguiente:** [Chapter 2.6: Server vs Client Architecture](06-server-client-split.md)
