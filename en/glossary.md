# DayZ Modding Glossary & Page Index

[Home](./README.md) | **Glossary & Index**

---

> This glossary defines every key term in DayZ modding and links to the chapter where it is explained in depth. Use Ctrl+F to search.

---

## How to Use

- **Bold terms** are defined inline
- **[Chapter links]** point to the full documentation
- **See also** connects related concepts

---

## A

### Action System
The system that handles player interactions with items and the world -- eating, opening doors, repairing, etc. Actions are registered on items via `SetActions()` and extend `ActionBase`.

**Chapter:** [6.12 Action System](06-engine-api/12-action-system.md)
**See also:** [SetActions](#setactions), [ActionBase](#actionbase)

### ActionBase
Base class for all player actions. Three subtypes: `ActionSingleUseBase` (instant), `ActionContinuousBase` (progress bar), `ActionInteractBase` (world interaction).

**Chapter:** [6.12 Action System](06-engine-api/12-action-system.md)

### AddAction
Method called inside `SetActions()` to register an action on an item. Always call `super.SetActions()` first.

**Chapter:** [6.12 Action System](06-engine-api/12-action-system.md)

### AddonBuilder
DayZ Tools application that packs source files into PBO archives. Handles binarization, prefix assignment, and signature generation.

**Chapter:** [4.5 DayZ Tools Workflow](04-file-formats/05-dayz-tools.md) | [4.6 PBO Packing](04-file-formats/06-pbo-packing.md)
**See also:** [PBO](#pbo), [Binarize](#binarize)

### Admin Panel
A server-side UI for managing players, spawning items, controlling weather, etc. Built with modded MissionServer + RPC + UI layout.

**Chapter:** [8.3 Building an Admin Panel](08-tutorials/03-admin-panel.md) | [6.22 Admin & Server](06-engine-api/22-admin-server.md)

### AdminLog
`GetGame().AdminLog(string)` -- writes to the server admin log file for auditing admin actions.

**Chapter:** [6.22 Admin & Server](06-engine-api/22-admin-server.md)

### Animation System
Controls player stances, movements, gestures, and object animations via `model.cfg` animation definitions and script-level commands.

**Chapter:** [6.18 Animation System](06-engine-api/18-animation-system.md)
**See also:** [model.cfg](#modelcfg), [P3D](#p3d)

### AnimalBase
Base class for wildlife entities (deer, wolves, bears, chickens). Extends the AI system shared with infected.

**Chapter:** [6.21 Zombie & AI System](06-engine-api/21-zombie-ai-system.md)
**See also:** [ZombieBase](#zombiebase)

### ARC (Automatic Reference Counting)
Enforce Script's memory management model. Objects are destroyed when their strong reference count drops to zero. Not garbage collected.

**Chapter:** [1.8 Memory Management](01-enforce-script/08-memory-management.md)
**See also:** [ref](#ref), [autoptr](#autoptr)

### Array
Dynamic resizable collection `array<T>`. Methods: `Insert`, `Get`, `Find`, `Remove`, `Sort`, `Count`. Note: `Remove` is unordered (swaps with last element).

**Chapter:** [1.2 Arrays, Maps & Sets](01-enforce-script/02-arrays-maps-sets.md)
**See also:** [map](#map)

### autoptr
Scoped strong reference pointer. Object is destroyed when `autoptr` goes out of scope. Rarely used in DayZ -- prefer `ref`.

**Chapter:** [1.8 Memory Management](01-enforce-script/08-memory-management.md)
**See also:** [ref](#ref), [ARC](#arc-automatic-reference-counting)

## B

### BaseBuildingBase
Entity base class for player-built structures (fences, watchtowers, shelters). Uses the construction part system for assembly and dismantling.

**Chapter:** [6.17 Construction System](06-engine-api/17-construction-system.md)
**See also:** [Construction](#construction)

### BattlEye
DayZ's anti-cheat system. Managed at the engine level; scripts interact with it through kick/ban APIs.

**Chapter:** [6.22 Admin & Server](06-engine-api/22-admin-server.md)

### Binarize
The DayZ Tools process that converts human-readable source files (config.cpp, model.cfg, .p3d) into optimized binary format for game loading.

**Chapter:** [4.5 DayZ Tools Workflow](04-file-formats/05-dayz-tools.md) | [4.6 PBO Packing](04-file-formats/06-pbo-packing.md)
**See also:** [AddonBuilder](#addonbuilder), [PBO](#pbo)

### Bitflags
Pattern using enum values as powers of two, combined with bitwise OR. Used for flags like `ECE_CREATEPHYSICS | ECE_UPDATEPATHGRAPH`.

**Chapter:** [1.10 Enums & Preprocessor](01-enforce-script/10-enums-preprocessor.md)

### bool
Primitive type for true/false values. Default value is `false`.

**Chapter:** [1.1 Variables & Types](01-enforce-script/01-variables-types.md)

### Building
Entity class for static structures in the world. Inherits from `EntityAI`.

**Chapter:** [6.1 Entity System](06-engine-api/01-entity-system.md) | [4.8 Building Modeling](04-file-formats/08-building-modeling.md)

### ButtonWidget
Interactive widget for clickable buttons. Handles click events via `OnClick` in `ScriptedWidgetEventHandler`.

**Chapter:** [3.1 Widget Types](03-gui-system/01-widget-types.md) | [3.6 Event Handling](03-gui-system/06-event-handling.md)

## C

### CallLater
`GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(method, delay, repeat)` -- schedules a deferred function call with a millisecond delay and optional repeat.

**Chapter:** [6.7 Timers & CallQueue](06-engine-api/07-timers.md)
**See also:** [ScriptCallQueue](#scriptcallqueue), [Timer](#timer)

### Camera System
Multi-layered camera system. Player cameras are managed via `DayZPlayerCamera` subclasses. `FreeDebugCamera` enables free-flight for debugging.

**Chapter:** [6.4 Camera System](06-engine-api/04-cameras.md)

### CarScript
Scriptable base class for drivable vehicles. Extends `Car` (engine-native physics). Defines doors, fluids, parts, and engine behavior.

**Chapter:** [6.2 Vehicle System](06-engine-api/02-vehicles.md) | [8.10 Vehicle Mod](08-tutorials/10-vehicle-mod.md)
**See also:** [Transport](#transport)

### CastTo
`Class.CastTo(target, source)` -- safe downcast that returns true/false and sets the target variable. Preferred over direct casting.

**Chapter:** [1.9 Casting & Reflection](01-enforce-script/09-casting-reflection.md)
**See also:** [typename](#typename)

### Central Economy (CE)
DayZ's server-side system for managing loot, vehicle, and infected spawning. Configured through XML files (`types.xml`, `events.xml`, `mapgroupproto.xml`).

**Chapter:** [6.10 Central Economy](06-engine-api/10-central-economy.md) | [5.5 Server Configs](05-config-files/05-server-configs.md)
**See also:** [types.xml](#typesxml)

### CfgMods
Block in `config.cpp` that defines mod metadata, script module paths, imageset paths, and preprocessor defines.

**Chapter:** [2.2 config.cpp Deep Dive](02-mod-structure/02-config-cpp.md)
**See also:** [config.cpp](#configcpp), [CfgPatches](#cfgpatches)

### CfgPatches
Block in `config.cpp` that declares the addon name, required addons (dependencies), and units/weapons it provides.

**Chapter:** [2.2 config.cpp Deep Dive](02-mod-structure/02-config-cpp.md)
**See also:** [config.cpp](#configcpp), [requiredAddons](#requiredaddons)

### CfgSoundSets
Config class in `config.cpp` that defines playable sound configurations: volume, distance attenuation, spatial behavior. Referenced by `SEffectManager.PlaySound`.

**Chapter:** [4.4 Audio](04-file-formats/04-audio.md) | [6.15 Sound System](06-engine-api/15-sound-system.md)
**See also:** [CfgSoundShaders](#cfgsoundshaders)

### CfgSoundShaders
Config class in `config.cpp` that maps sound samples (.ogg/.wss files) to playback parameters like volume range. Used inside `CfgSoundSets`.

**Chapter:** [4.4 Audio](04-file-formats/04-audio.md) | [6.15 Sound System](06-engine-api/15-sound-system.md)
**See also:** [CfgSoundSets](#cfgsoundsets)

### CfgVehicles
Config class in `config.cpp` where items, entities, and objects are defined. Despite the name, all entities (not just vehicles) are declared here.

**Chapter:** [2.2 config.cpp Deep Dive](02-mod-structure/02-config-cpp.md)
**See also:** [config.cpp](#configcpp)

### cfgweather.xml
Mission folder XML file that controls weather parameters, overcast thresholds, and atmospheric conditions.

**Chapter:** [6.23 World Systems](06-engine-api/23-world-systems.md) | [6.3 Weather System](06-engine-api/03-weather.md)

### Chat Commands
Custom commands (e.g., `/heal`, `/tp`) implemented by hooking into `MissionServer.OnClientNewEvent()` and parsing chat text.

**Chapter:** [8.4 Adding Chat Commands](08-tutorials/04-chat-commands.md)

### Class
The root of all Enforce Script class hierarchies. Every object inherits from `Class`.

**Chapter:** [1.3 Classes & Inheritance](01-enforce-script/03-classes-inheritance.md)

### Clothing Mod
A mod that adds wearable items with insulation, cargo, and hidden selection textures. Created by subclassing vanilla clothing bases in `CfgVehicles`.

**Chapter:** [8.11 Creating a Clothing Mod](08-tutorials/11-clothing-mod.md)
**See also:** [Hidden Selections](#hidden-selections), [CfgVehicles](#cfgvehicles)

### Community Framework (CF)
Jacob_Mango's open-source framework mod providing module lifecycle, RPC, permissions, and logging. Foundation for COT and many community mods.

**Chapter:** [7.2 Module Systems](07-patterns/02-module-systems.md) | [3.9 Real Mod Patterns](03-gui-system/09-real-mod-patterns.md)
**See also:** [COT](#cot)

### config.cpp
The heart of every DayZ mod PBO. Declares dependencies, script paths, item definitions, sound sets, and preprocessor defines.

**Chapter:** [2.2 config.cpp Deep Dive](02-mod-structure/02-config-cpp.md)
**See also:** [CfgPatches](#cfgpatches), [CfgMods](#cfgmods), [CfgVehicles](#cfgvehicles)

### Config Persistence
Pattern for saving and loading mod settings to JSON files using `JsonFileLoader<T>`. Professional mods add versioning and auto-migration.

**Chapter:** [7.4 Config Persistence](07-patterns/04-config-persistence.md)
**See also:** [JsonFileLoader](#jsonfileloader)

### Construction
DayZ's base building manager class. Tracks construction parts, material requirements, and build progress for `BaseBuildingBase` entities.

**Chapter:** [6.17 Construction System](06-engine-api/17-construction-system.md)
**See also:** [BaseBuildingBase](#basebuildingbase)

### Container Widgets
Widgets that organize child widgets: `FrameWidget` (absolute), `WrapSpacerWidget` (flow), `GridSpacerWidget` (grid), `ScrollWidget` (scrollable).

**Chapter:** [3.4 Container Widgets](03-gui-system/04-containers.md)
**See also:** [FrameWidget](#framewidget), [WrapSpacerWidget](#wrapspacerwidget)

### Contaminated Areas
Toxic gas zones configured via `cfgEffectArea.json`. Apply PPE effects and damage to players within the zone.

**Chapter:** [6.23 World Systems](06-engine-api/23-world-systems.md)

### Control Flow
`if/else`, `for`, `while`, `foreach`, `switch` constructs. Key difference: no `do...while`, no ternary operator, `switch` does not fall through.

**Chapter:** [1.5 Control Flow](01-enforce-script/05-control-flow.md) | [1.12 Gotchas](01-enforce-script/12-gotchas.md)

### COT (Community Online Tools)
Major open-source admin mod by Jacob_Mango. Built on Community Framework. Provides ESP, teleport, spawning, and player management.

**Chapter:** [3.9 Real Mod UI Patterns](03-gui-system/09-real-mod-patterns.md) | [7.2 Module Systems](07-patterns/02-module-systems.md)

### Crafting System
Handles combining items via `PluginRecipesManager` and `RecipeBase` subclasses, or via custom `ActionContinuousBase` actions.

**Chapter:** [6.16 Crafting System](06-engine-api/16-crafting-system.md)
**See also:** [RecipeBase](#recipebase), [Action System](#action-system)

### CreateWidgets
`GetGame().GetWorkspace().CreateWidgets(path, parent)` -- loads a `.layout` file and instantiates its widget tree at runtime.

**Chapter:** [3.5 Programmatic Widgets](03-gui-system/05-programmatic-widgets.md)
**See also:** [Widget](#widget), [Layout File](#layout-file)

### Credits.json
JSON file in the mod root that defines credits displayed in the game's mod menu. Lists team members organized by departments.

**Chapter:** [5.3 Credits.json](05-config-files/03-credits-json.md)

### Custom Item
A new item added to DayZ by defining it in `CfgVehicles`, adding textures, and registering it in `types.xml` for server spawning.

**Chapter:** [8.2 Creating a Custom Item](08-tutorials/02-custom-item.md)
**See also:** [CfgVehicles](#cfgvehicles), [types.xml](#typesxml)

## D

### DayZDiag
Debug executable that enables the Diagnostic Menu, file patching, script profiling, and Workbench debugging. Essential for mod development.

**Chapter:** [8.6 Debugging & Testing](08-tutorials/06-debugging-testing.md) | [8.13 Diag Menu](08-tutorials/13-diag-menu.md)
**See also:** [Diag Menu](#diag-menu), [File Patching](#file-patching)

### DayZPlayer
Engine-level player class above `PlayerBase` in the hierarchy. Provides animation state machine, command system, and input processing.

**Chapter:** [6.14 Player System](06-engine-api/14-player-system.md)

### DayZ Tools
Free Steam-distributed suite of development applications from Bohemia Interactive: Object Builder, TexView2, Terrain Builder, AddonBuilder, Workbench.

**Chapter:** [4.5 DayZ Tools Workflow](04-file-formats/05-dayz-tools.md)
**See also:** [Workbench](#workbench), [AddonBuilder](#addonbuilder), [Object Builder](#object-builder)

### Debugging
Process of finding and fixing errors in DayZ mods. Primary tools: script logs, Print statements, DayZDiag, file patching, and Workbench debugger.

**Chapter:** [8.6 Debugging & Testing](08-tutorials/06-debugging-testing.md)
**See also:** [DayZDiag](#dayzdiag), [Script Log](#script-log)

### Defines
Preprocessor symbols declared in `config.cpp`'s `defines[]` array. Used with `#ifdef`/`#ifndef` for conditional compilation and optional mod dependencies.

**Chapter:** [1.10 Enums & Preprocessor](01-enforce-script/10-enums-preprocessor.md) | [2.2 config.cpp Deep Dive](02-mod-structure/02-config-cpp.md)

### Destructor
`void ~ClassName()` -- called when an object's reference count reaches zero. Used for cleanup. No try/catch protection.

**Chapter:** [1.3 Classes & Inheritance](01-enforce-script/03-classes-inheritance.md) | [1.8 Memory Management](01-enforce-script/08-memory-management.md)

### Diag Menu
DayZ's built-in diagnostic tool, available only in DayZDiag. Provides FPS counters, script profiling, weather control, free camera, AI debugging.

**Chapter:** [8.13 Diag Menu Reference](08-tutorials/13-diag-menu.md)
**See also:** [DayZDiag](#dayzdiag)

### Dialog
Temporary overlay window for user interaction -- confirmations, alerts, input forms. Uses `UIScriptedMenu` or manual widget management.

**Chapter:** [3.8 Dialogs & Modals](03-gui-system/08-dialogs-modals.md)

## E

### EDDS
Extended DirectDraw Surface format. High-quality texture format used as a development intermediate. Supports all DXT compression types and mipmaps.

**Chapter:** [4.1 Textures](04-file-formats/01-textures.md)
**See also:** [PAA](#paa), [TGA](#tga)

### EffectParticle
High-level wrapper around `Particle` for lifecycle-managed visual effects with events and auto-destroy.

**Chapter:** [6.20 Particle & Effect System](06-engine-api/20-particle-effects.md)

### EffectSound
High-level wrapper around `AbstractWave` for managed sound playback. Created via `SEffectManager.PlaySound`.

**Chapter:** [6.15 Sound System](06-engine-api/15-sound-system.md)
**See also:** [SEffectManager](#seffectmanager)

### Enforce Script
DayZ's scripting language, powered by the Enfusion engine. Object-oriented, C-like syntax, single inheritance, automatic reference counting.

**Chapter:** [1.1 Variables & Types](01-enforce-script/01-variables-types.md)

### EntityAI
Key class in the entity hierarchy. All interactive world objects (items, players, zombies, vehicles, buildings) inherit from `EntityAI`.

**Chapter:** [6.1 Entity System](06-engine-api/01-entity-system.md)
**See also:** [ItemBase](#itembase), [PlayerBase](#playerbase)

### Entity System
The class hierarchy for all world objects, rooted at `IEntity`. Provides health, position, physics, attachment, and inventory functionality.

**Chapter:** [6.1 Entity System](06-engine-api/01-entity-system.md)

### Enum
Named integer constants. Support explicit values, implicit auto-increment, inheritance, bitflag patterns, and reflection via `typename.EnumToString()`.

**Chapter:** [1.10 Enums & Preprocessor](01-enforce-script/10-enums-preprocessor.md)

### Error Handling
No try/catch in Enforce Script. Use guard clauses with early return and `Print()` or structured logging for error reporting.

**Chapter:** [1.11 Error Handling](01-enforce-script/11-error-handling.md) | [1.12 Gotchas](01-enforce-script/12-gotchas.md)

### Event-Driven Architecture
Pattern that decouples event producers from consumers using `ScriptInvoker` or custom event bus systems. Foundation for extensible mod design.

**Chapter:** [7.6 Event-Driven Architecture](07-patterns/06-events.md)
**See also:** [ScriptInvoker](#scriptinvoker)

### Event Handling (GUI)
Widgets generate events for user interactions. Handled via `ScriptedWidgetEventHandler` with `SetHandler()` or through `UIScriptedMenu` overrides.

**Chapter:** [3.6 Event Handling](03-gui-system/06-event-handling.md)
**See also:** [ScriptedWidgetEventHandler](#scriptedwidgeteventhandler)

### event Keyword
Method modifier indicating an engine callback. Methods marked `event` are called by the engine at specific lifecycle points (e.g., `OnInit`, `OnUpdate`).

**Chapter:** [1.13 Functions & Methods](01-enforce-script/13-functions-methods.md)

### events.xml
Central Economy file that defines dynamic event spawns -- helicopter crashes, vehicle wrecks, infected groups.

**Chapter:** [6.10 Central Economy](06-engine-api/10-central-economy.md) | [5.5 Server Configs](05-config-files/05-server-configs.md)

## F

### File I/O
Reading and writing files via `FileHandle`, `FPrintln`, `ReadFile`, and path prefixes (`$profile:`, `$saves:`, `$mission:`).

**Chapter:** [6.8 File I/O & JSON](06-engine-api/08-file-io.md)
**See also:** [JsonFileLoader](#jsonfileloader), [Path Prefixes](#path-prefixes)

### File Organization
Best practices for structuring a mod directory: Scripts folder by layer, naming conventions, content vs script vs framework mods.

**Chapter:** [2.5 File Organization](02-mod-structure/05-file-organization.md)

### File Patching
Development mode (`-filePatching`) that lets DayZ load loose files from the P: drive instead of packed PBOs. Enables edit-and-reload without rebuilding.

**Chapter:** [4.5 DayZ Tools Workflow](04-file-formats/05-dayz-tools.md) | [8.6 Debugging & Testing](08-tutorials/06-debugging-testing.md)
**See also:** [P Drive](#p-drive)

### Five-Layer Hierarchy
DayZ's script compilation layers: `1_Core`, `2_GameLib`, `3_Game`, `4_World`, `5_Mission`. Lower layers cannot reference higher layers.

**Chapter:** [2.1 The 5-Layer Script Hierarchy](02-mod-structure/01-five-layers.md)

### float
Primitive 32-bit IEEE 754 floating-point type. Default value is `0.0`.

**Chapter:** [1.1 Variables & Types](01-enforce-script/01-variables-types.md)

### Font
DayZ uses proprietary `.fnt` font files. Common fonts: `gui/fonts/MetroItalic` and `gui/fonts/MetroSuide`. Not user-definable -- only engine-bundled fonts.

**Chapter:** [3.7 Styles, Fonts & Images](03-gui-system/07-styles-fonts.md)

### foreach
Loop construct: `foreach (Type element : collection)`. Works with `array`, `map`, and static arrays.

**Chapter:** [1.5 Control Flow](01-enforce-script/05-control-flow.md)
**See also:** [Array](#array), [map](#map)

### FrameWidget
General-purpose invisible container widget. The most commonly used widget in DayZ. Children are positioned absolutely within it.

**Chapter:** [3.1 Widget Types](03-gui-system/01-widget-types.md) | [3.4 Container Widgets](03-gui-system/04-containers.md)

### FreeDebugCamera
Free-flight camera for debugging. Available in DayZDiag builds. Accessed via the Diag Menu or scripted activation.

**Chapter:** [6.4 Camera System](06-engine-api/04-cameras.md) | [8.13 Diag Menu](08-tutorials/13-diag-menu.md)

### Functions & Methods
Enforce Script function declaration, parameter modes (`out`, `inout`, `notnull`), static vs instance, overriding, `thread`, and `event` keywords.

**Chapter:** [1.13 Functions & Methods](01-enforce-script/13-functions-methods.md)

## G

### GetGame()
Global accessor for the `CGame` singleton. Entry point for most engine APIs: `GetGame().GetPlayer()`, `GetGame().GetWeather()`, `GetGame().IsServer()`.

**Chapter:** [6.1 Entity System](06-engine-api/01-entity-system.md) | [1.1 Variables & Types](01-enforce-script/01-variables-types.md)

### GetPlayer()
`GetGame().GetPlayer()` -- returns the local player entity as `Man`. Cast to `PlayerBase` for gameplay methods.

**Chapter:** [6.14 Player System](06-engine-api/14-player-system.md)

### Gotchas
Enforce Script features that do NOT exist or behave unexpectedly: no ternary, no `do...while`, no try/catch, no namespaces, no `#include`.

**Chapter:** [1.12 What Does NOT Exist](01-enforce-script/12-gotchas.md)

### GridSpacerWidget
Container widget that arranges children in a grid defined by `Columns` and `Rows` properties.

**Chapter:** [3.1 Widget Types](03-gui-system/01-widget-types.md) | [3.4 Container Widgets](03-gui-system/04-containers.md)
**See also:** [WrapSpacerWidget](#wrapspacerwidget)

### Guard Clause
Defensive pattern: check preconditions at the top of a function and return early on failure. The standard error-handling pattern in Enforce Script (no try/catch).

**Chapter:** [1.11 Error Handling](01-enforce-script/11-error-handling.md)

## H

### Hello World
The simplest possible DayZ mod: prints a message to the script log when the game starts. Three files, zero dependencies.

**Chapter:** [8.1 Your First Mod](08-tutorials/01-first-mod.md) | [2.4 Minimum Viable Mod](02-mod-structure/04-minimum-viable-mod.md)

### Hidden Selections
Named texture regions on a P3D model that can be re-skinned via config.cpp. Used for clothing retextures, vehicle skins, and item variants.

**Chapter:** [8.2 Custom Item](08-tutorials/02-custom-item.md) | [8.11 Clothing Mod](08-tutorials/11-clothing-mod.md)
**See also:** [P3D](#p3d)

### Hive
The DayZ persistence database. Stores player positions, health, inventory across server restarts. Accessed indirectly via `GetHive()`.

**Chapter:** [6.22 Admin & Server](06-engine-api/22-admin-server.md)

### HUD Overlay
Custom always-visible UI element layered over the game view. Created by hooking into `MissionGameplay` and managing widget visibility.

**Chapter:** [8.8 Building a HUD Overlay](08-tutorials/08-hud-overlay.md)
**See also:** [MissionGameplay](#missiongameplay)

## I

### IEntity
Lowest engine-level entity class. All world objects ultimately inherit from `IEntity` via the `Object` chain.

**Chapter:** [6.1 Entity System](06-engine-api/01-entity-system.md)

### ImageSet
Named sprite regions within a texture atlas. DayZ's mechanism for referencing icons and UI graphics. Defined in `.imageset` or `.edds` files and registered in `config.cpp`.

**Chapter:** [5.4 ImageSet Format](05-config-files/04-imagesets.md) | [3.7 Styles, Fonts & Images](03-gui-system/07-styles-fonts.md)

### ImageWidget
Widget for displaying images from texture files or imageset sprites. Supports `SetImage()` and `LoadImageFile()`.

**Chapter:** [3.1 Widget Types](03-gui-system/01-widget-types.md) | [3.7 Styles, Fonts & Images](03-gui-system/07-styles-fonts.md)

### init.c
Mission entry point script. Located in the mission folder. Creates the `MissionServer`/`MissionGameplay` instances and initializes the world.

**Chapter:** [5.5 Server Configs](05-config-files/05-server-configs.md) | [6.11 Mission Hooks](06-engine-api/11-mission-hooks.md)

### inout Parameter
Function parameter modifier. The value is passed by reference and can be both read and modified by the function.

**Chapter:** [1.13 Functions & Methods](01-enforce-script/13-functions-methods.md)

### Input System
Two-layer system: `inputs.xml` declares named actions and keybindings; `UAInput` API queries input state at runtime.

**Chapter:** [6.13 Input System](06-engine-api/13-input-system.md) | [5.2 inputs.xml](05-config-files/02-inputs-xml.md)

### inputs.xml
XML file that registers custom keybindings. Actions appear in the player's Controls settings menu and are queryable via `UAInput`.

**Chapter:** [5.2 inputs.xml](05-config-files/02-inputs-xml.md)
**See also:** [Input System](#input-system), [UAInput](#uainput)

### int
Primitive 32-bit signed integer type. Range: -2,147,483,648 to 2,147,483,647. Default value is `0`.

**Chapter:** [1.1 Variables & Types](01-enforce-script/01-variables-types.md)

### Inventory
The entity attachment and cargo system. Key methods: `GetInventory().CreateAttachment()`, `GetInventory().CreateInInventory()`, `LocalDestroyEntity()`.

**Chapter:** [6.1 Entity System](06-engine-api/01-entity-system.md) | [6.14 Player System](06-engine-api/14-player-system.md)

### IsInherited
`obj.IsInherited(SomeClass)` -- runtime type check returning true if the object is an instance of the specified class or any subclass of it.

**Chapter:** [1.9 Casting & Reflection](01-enforce-script/09-casting-reflection.md)

### IsKindOf
`obj.IsKindOf("ClassName")` -- string-based runtime type check. Useful when you do not have the class available at compile time.

**Chapter:** [1.9 Casting & Reflection](01-enforce-script/09-casting-reflection.md)

### ItemBase
Base class for all inventory items (weapons, tools, food, clothing). Extends `InventoryItem` in the `4_World` layer.

**Chapter:** [6.1 Entity System](06-engine-api/01-entity-system.md) | [8.2 Custom Item](08-tutorials/02-custom-item.md)
**See also:** [EntityAI](#entityai)

## J

### JsonFileLoader
`JsonFileLoader<T>.JsonLoadFile(path, data)` -- loads a JSON file and deserializes it into an object. Returns `void` (pass a ref object, do not assign return). Also `JsonSaveFile()` for saving.

**Chapter:** [6.8 File I/O & JSON](06-engine-api/08-file-io.md) | [7.4 Config Persistence](07-patterns/04-config-persistence.md)
**See also:** [File I/O](#file-io)

## K

### Key Pair
RSA key pair (`.bikey` + `.biprivatekey`) used to sign PBOs. Servers verify mod signatures to prevent tampering. Generated via DayZ Tools DSSignFile.

**Chapter:** [8.7 Publishing to Workshop](08-tutorials/07-publishing-workshop.md)
**See also:** [PBO](#pbo)

## L

### Layout File
DayZ's `.layout` format for defining UI widget trees. Brace-delimited text format (not XML). Edited in Workbench or by hand.

**Chapter:** [3.2 Layout File Format](03-gui-system/02-layout-files.md)
**See also:** [Widget](#widget), [CreateWidgets](#createwidgets)

### Listen Server
A server where one player also acts as the host. Both `GetGame().IsServer()` and `GetGame().IsClient()` return true. Requires special guard logic.

**Chapter:** [2.6 Server/Client Architecture](02-mod-structure/06-server-client-split.md)

### LOD (Level of Detail)
Multiple mesh resolutions within a single P3D model. The engine selects the appropriate LOD based on camera distance. Includes geometry, fire geometry, view geometry, shadow, and memory LODs.

**Chapter:** [4.2 3D Models](04-file-formats/02-models.md)
**See also:** [P3D](#p3d)

### Localization
Multi-language text support via `stringtable.csv`. The engine resolves translation keys based on the player's language setting.

**Chapter:** [5.1 stringtable.csv](05-config-files/01-stringtable.md)
**See also:** [stringtable.csv](#stringtablecsv)

## M

### Managed
Base class that enables weak reference zeroing. When a `Managed` object is deleted, all raw pointers to it are set to `null` instead of dangling.

**Chapter:** [1.8 Memory Management](01-enforce-script/08-memory-management.md)
**See also:** [ref](#ref)

### map
Associative collection `map<KeyType, ValueType>`. Methods: `Insert`, `Get`, `Find`, `Remove`, `Contains`, `Count`. Key types must be value types or class references.

**Chapter:** [1.2 Arrays, Maps & Sets](01-enforce-script/02-arrays-maps-sets.md)
**See also:** [Array](#array)

### MapWidget
Advanced widget that renders the game's 2D map. Used by mods to display markers, waypoints, and player positions.

**Chapter:** [3.10 Advanced Widgets](03-gui-system/10-advanced-widgets.md)

### Math
Static utility class for scalar operations: `Math.AbsFloat()`, `Math.Clamp()`, `Math.Lerp()`, `Math.RandomFloat()`, `Math.Floor()`, etc.

**Chapter:** [1.7 Math & Vectors](01-enforce-script/07-math-vectors.md)

### Memory Management
Enforce Script uses ARC (automatic reference counting) with three pointer types: raw (weak), `ref` (strong), `autoptr` (scoped strong).

**Chapter:** [1.8 Memory Management](01-enforce-script/08-memory-management.md)
**See also:** [ARC](#arc-automatic-reference-counting), [ref](#ref)

### Memory Points
Named vertices in a P3D model's Memory LOD used to position effects, attachments, lights, and interaction points.

**Chapter:** [4.2 3D Models](04-file-formats/02-models.md) | [4.8 Building Modeling](04-file-formats/08-building-modeling.md)

### Mission Hooks
Entry points for mod initialization via `MissionServer` and `MissionGameplay`. Lifecycle methods: `OnInit`, `OnMissionStart`, `OnUpdate`, `OnMissionFinish`.

**Chapter:** [6.11 Mission Hooks](06-engine-api/11-mission-hooks.md)
**See also:** [MissionServer](#missionserver), [MissionGameplay](#missiongameplay)

### MissionGameplay
Client-side mission class. Hook via `modded class` to add client initialization, HUD elements, and UI management.

**Chapter:** [6.11 Mission Hooks](06-engine-api/11-mission-hooks.md)

### MissionServer
Server-side mission class. Hook via `modded class` to add server initialization, player connection handling, and admin functionality.

**Chapter:** [6.11 Mission Hooks](06-engine-api/11-mission-hooks.md)

### mod.cpp
Metadata file in the mod root. Controls launcher display name, icon, description, action URL, and type (client/server/both). No gameplay effect.

**Chapter:** [2.3 mod.cpp & Workshop](02-mod-structure/03-mod-cpp.md)
**See also:** [config.cpp](#configcpp)

### Mod Template
Pre-made skeleton project with correct folder structure, config.cpp, mod.cpp, and script stubs. See InclementDab's open-source template or the professional template.

**Chapter:** [8.5 Using the Mod Template](08-tutorials/05-mod-template.md) | [8.9 Professional Template](08-tutorials/09-professional-template.md)

### model.cfg
Configuration file that defines animations (rotation, translation, hide) for P3D models. Controls doors, turrets, and visual state changes.

**Chapter:** [4.2 3D Models](04-file-formats/02-models.md) | [6.18 Animation System](06-engine-api/18-animation-system.md)

### Modded Class
`modded class ClassName` -- replaces an existing class in the engine's hierarchy with your version. The single most important concept in DayZ modding. Always call `super` in overrides.

**Chapter:** [1.4 Modded Classes](01-enforce-script/04-modded-classes.md)
**See also:** [super](#super), [Override](#override)

### Module System
Architectural pattern for organizing code into lifecycle-managed units registered with a central manager. Four approaches documented: CF, VPP, Dabs, and custom.

**Chapter:** [7.2 Module / Plugin Systems](07-patterns/02-module-systems.md)
**See also:** [Singleton](#singleton)

## N

### Named Selections
Named groups of faces in a P3D model used for texturing, animation, and damage visualization. Referenced in config.cpp `hiddenSelections[]`.

**Chapter:** [4.2 3D Models](04-file-formats/02-models.md)
**See also:** [Hidden Selections](#hidden-selections)

### Networking
Client-server communication via `ScriptRPC`. All authoritative logic runs on the server; clients communicate through RPCs.

**Chapter:** [6.9 Networking & RPC](06-engine-api/09-networking.md)
**See also:** [RPC](#rpc-remote-procedure-call), [ScriptRPC](#scriptrpc)

### Notification System
`NotificationSystem` class for displaying toast-style popup messages. `AddNotification()` for local, `SendNotificationToPlayerExtended()` for server-to-client.

**Chapter:** [6.6 Notification System](06-engine-api/06-notifications.md)

### notnull Parameter
Function parameter modifier that guarantees the argument is not null at the engine level. Passing null to a `notnull` parameter causes a script error.

**Chapter:** [1.13 Functions & Methods](01-enforce-script/13-functions-methods.md)

### NULL / null
Enforce Script's null reference value. Used interchangeably. No `nullptr` keyword exists.

**Chapter:** [1.12 Gotchas](01-enforce-script/12-gotchas.md) | [1.1 Variables & Types](01-enforce-script/01-variables-types.md)

## O

### Object
Engine class above `ObjectTyped` in the hierarchy. Provides position (`GetPosition()`), orientation, and basic world interaction.

**Chapter:** [6.1 Entity System](06-engine-api/01-entity-system.md)

### Object Builder
DayZ Tools application for creating and editing P3D models. Used to define LODs, named selections, memory points, proxies, and UV mapping.

**Chapter:** [4.5 DayZ Tools Workflow](04-file-formats/05-dayz-tools.md) | [4.2 3D Models](04-file-formats/02-models.md)

### OGG
OGG Vorbis -- DayZ's primary audio format. Lossy compression, open-source. All custom sounds should be 44.1kHz mono or stereo `.ogg` files.

**Chapter:** [4.4 Audio](04-file-formats/04-audio.md)
**See also:** [WSS](#wss), [CfgSoundSets](#cfgsoundsets)

### OnClick
Widget event handler method. Called when a button or interactive widget is clicked. Override in `ScriptedWidgetEventHandler` or `UIScriptedMenu`.

**Chapter:** [3.6 Event Handling](03-gui-system/06-event-handling.md)

### out Parameter
Function parameter modifier. Value is passed by reference but only written to (not read). Used for multi-return patterns.

**Chapter:** [1.13 Functions & Methods](01-enforce-script/13-functions-methods.md)

### Override
Redefining a parent class method in a child or modded class. Must call `super.MethodName()` to preserve original behavior in modded classes.

**Chapter:** [1.4 Modded Classes](01-enforce-script/04-modded-classes.md) | [1.3 Classes & Inheritance](01-enforce-script/03-classes-inheritance.md)
**See also:** [super](#super), [Modded Class](#modded-class)

## P

### P Drive (Workdrive)
Virtual P: drive created by DayZ Tools. Contains unpacked game data and mod source files. Required for the asset pipeline and file patching.

**Chapter:** [4.5 DayZ Tools Workflow](04-file-formats/05-dayz-tools.md) | [8.1 Your First Mod](08-tutorials/01-first-mod.md)

### P3D
Bohemia's proprietary 3D model format. Encodes mesh LODs, collision geometry, named selections, memory points, and proxy positions.

**Chapter:** [4.2 3D Models](04-file-formats/02-models.md)
**See also:** [LOD](#lod-level-of-detail), [Object Builder](#object-builder)

### PAA
DayZ's runtime compressed texture format. Converted from TGA/PNG via TexView2 during the build process. Power-of-two dimensions required.

**Chapter:** [4.1 Textures](04-file-formats/01-textures.md)
**See also:** [TexView2](#texview2), [EDDS](#edds)

### PanelWidget
Widget that draws a solid colored rectangle. Used for backgrounds, dividers, and separators.

**Chapter:** [3.1 Widget Types](03-gui-system/01-widget-types.md)

### Particle System
Engine system for fire, smoke, blood, explosions, and weather effects. Two layers: low-level `Particle`/`ParticleManager` and high-level `EffectParticle`/`SEffectManager`.

**Chapter:** [6.20 Particle & Effect System](06-engine-api/20-particle-effects.md)

### Path Prefixes
Special prefixes for file operations: `$profile:` (user profile), `$saves:` (save data), `$mission:` (mission folder). No absolute filesystem paths.

**Chapter:** [6.8 File I/O & JSON](06-engine-api/08-file-io.md)

### PBO (Packed Bank of Objects)
DayZ's archive format for mod delivery. Equivalent to a zip file. Every mod the game loads is one or more PBO files.

**Chapter:** [4.6 PBO Packing](04-file-formats/06-pbo-packing.md)
**See also:** [AddonBuilder](#addonbuilder), [Binarize](#binarize)

### Performance Optimization
Patterns for keeping script execution fast: caching, spatial partitioning, frame-spreading, object pooling, avoiding per-frame allocations.

**Chapter:** [7.7 Performance Optimization](07-patterns/07-performance.md)

### Permission System
Mechanism for restricting privileged actions to authorized players. Three patterns: hierarchical dot-separated, user-group roles, framework-level RBAC.

**Chapter:** [7.5 Permission Systems](07-patterns/05-permissions.md)

### PlayerBase
The most important class in DayZ modding. Every player entity is a `PlayerBase`. Contains health, stamina, bleeding, inventory, and all gameplay state.

**Chapter:** [6.14 Player System](06-engine-api/14-player-system.md)
**See also:** [EntityAI](#entityai)

### PluginRecipesManager
Central registry for crafting recipes. Discovers `RecipeBase` subclasses and presents valid combinations when items are used together.

**Chapter:** [6.16 Crafting System](06-engine-api/16-crafting-system.md)
**See also:** [RecipeBase](#recipebase)

### Post-Process Effects (PPE)
Visual effects applied after scene rendering: blur, color grading, vignette, chromatic aberration, night vision. Driven by `PPERequester` classes.

**Chapter:** [6.5 Post-Process Effects](06-engine-api/05-ppe.md)
**See also:** [PPERequester](#pperequester)

### PPERequester
Base class for requesting post-process visual effects. Multiple requesters can be active simultaneously and the engine blends their contributions.

**Chapter:** [6.5 Post-Process Effects](06-engine-api/05-ppe.md)

### Preprocessor
`#ifdef`, `#ifndef`, `#endif`, `#define` directives for conditional compilation. Common defines: `SERVER`, `DEVELOPER`, `DIAG_DEVELOPER`.

**Chapter:** [1.10 Enums & Preprocessor](01-enforce-script/10-enums-preprocessor.md)
**See also:** [Defines](#defines)

### Print()
`Print(string)` -- writes a message to the script log. The primary debugging tool in Enforce Script (no IDE debugger in retail builds).

**Chapter:** [8.6 Debugging & Testing](08-tutorials/06-debugging-testing.md) | [1.11 Error Handling](01-enforce-script/11-error-handling.md)

### Professional Template
A full-featured mod template with config system, singleton manager, RPC, UI panel, keybinds, localization, and build automation. Copy-paste ready.

**Chapter:** [8.9 Professional Mod Template](08-tutorials/09-professional-template.md)
**See also:** [Mod Template](#mod-template)

### Proportional Sizing
Widget dimension expressed as 0.0 to 1.0 relative to the parent widget. Example: `width = 0.5` means 50% of parent's width.

**Chapter:** [3.3 Sizing & Positioning](03-gui-system/03-sizing-positioning.md)

### proto native
Method modifier indicating a C++ engine binding. The method signature is declared in script but the implementation lives in the native engine.

**Chapter:** [1.13 Functions & Methods](01-enforce-script/13-functions-methods.md)

### Proxy
Named attachment point in a P3D model's Memory LOD. Used for scope mounts, muzzle devices, flashlights, and other mountable items.

**Chapter:** [4.2 3D Models](04-file-formats/02-models.md)
**See also:** [Memory Points](#memory-points)

### Publishing
Process of uploading a finished mod to Steam Workshop: prepare mod folder, sign PBOs, create Workshop item, upload via DayZ Tools or SteamCMD.

**Chapter:** [8.7 Publishing to Workshop](08-tutorials/07-publishing-workshop.md)
**See also:** [Key Pair](#key-pair), [Steam Workshop](#steam-workshop)

## R

### Raycasting
Tracing a line through the world to detect collisions. Provided by `DayZPhysics.RaycastRV()` and `DayZPhysics.RayCastBullet()`.

**Chapter:** [6.19 Terrain & World Queries](06-engine-api/19-terrain-queries.md)

### RecipeBase
Base class for crafting recipes. Defines ingredients, results, conditions, and transformations for the recipe-based crafting system.

**Chapter:** [6.16 Crafting System](06-engine-api/16-crafting-system.md)
**See also:** [PluginRecipesManager](#pluginrecipesmanager)

### ref
Strong reference keyword. Keeps the referenced object alive (increments its reference count). Standard practice for owned members and collections.

**Chapter:** [1.8 Memory Management](01-enforce-script/08-memory-management.md)
**See also:** [ARC](#arc-automatic-reference-counting), [autoptr](#autoptr)

### Reference Counting
See [ARC](#arc-automatic-reference-counting).

### Reference Cycle
When two objects hold `ref` pointers to each other, neither can be destroyed. One side must use a raw (weak) pointer to break the cycle.

**Chapter:** [1.8 Memory Management](01-enforce-script/08-memory-management.md) | [1.12 Gotchas](01-enforce-script/12-gotchas.md)

### Reflection
Runtime type inspection via `typename`, `obj.Type()`, `EnScript.GetClassVar()`, `EnScript.SetClassVar()`. Used for dynamic config systems and serialization.

**Chapter:** [1.9 Casting & Reflection](01-enforce-script/09-casting-reflection.md)

### requiredAddons
Array in `CfgPatches` that lists addon dependencies. Controls PBO load order. If a required addon is missing, your PBO silently fails to load.

**Chapter:** [2.2 config.cpp Deep Dive](02-mod-structure/02-config-cpp.md)
**See also:** [CfgPatches](#cfgpatches)

### RichTextWidget
Widget that supports inline markup tags for formatted text with embedded images, variable font sizes, and line breaks.

**Chapter:** [3.10 Advanced Widgets](03-gui-system/10-advanced-widgets.md)

### RPC (Remote Procedure Call)
The mechanism for sending data between client and server. Uses `ScriptRPC` to write/read serialized data. Every networked mod relies on RPCs.

**Chapter:** [6.9 Networking & RPC](06-engine-api/09-networking.md) | [7.3 RPC Patterns](07-patterns/03-rpc-patterns.md)
**See also:** [ScriptRPC](#scriptrpc), [ScriptInputUserData](#scriptinputuserdata)

### RVMAT
Real Virtuality Material file. Defines how textures are combined, which shader to use, and surface properties (shininess, transparency, self-illumination).

**Chapter:** [4.3 Materials](04-file-formats/03-materials.md)
**See also:** [PAA](#paa), [P3D](#p3d)

## S

### ScriptCallQueue
Primary deferred call system. `GetGame().GetCallQueue(category).Call()` / `.CallLater()` / `.CallByName()`. Used for scheduling delayed logic.

**Chapter:** [6.7 Timers & CallQueue](06-engine-api/07-timers.md)
**See also:** [CallLater](#calllater)

### ScriptedWidgetEventHandler
Base class for widget event handlers. Override methods like `OnClick`, `OnMouseEnter`, `OnChange`, then attach to a widget via `SetHandler()`.

**Chapter:** [3.6 Event Handling](03-gui-system/06-event-handling.md)

### ScriptInputUserData
Input-verified client-to-server message system. Used for gameplay-critical actions where the engine must validate timing and authority.

**Chapter:** [6.9 Networking & RPC](06-engine-api/09-networking.md)

### ScriptInvoker
Built-in event primitive. `Insert()` adds a callback, `Invoke()` fires all callbacks. Foundation for event-driven architecture.

**Chapter:** [7.6 Event-Driven Architecture](07-patterns/06-events.md) | [6.7 Timers & CallQueue](06-engine-api/07-timers.md)

### ScriptRPC
Primary RPC class. `Write()` serializes data, `Send()` transmits to the other side. Received via `OnRPC()` override on entities.

**Chapter:** [6.9 Networking & RPC](06-engine-api/09-networking.md) | [7.3 RPC Patterns](07-patterns/03-rpc-patterns.md)

### Script Log
Text file where `Print()` output and engine errors are written. Located at `%localappdata%/DayZ/` or in `$profile:`. Primary debugging tool.

**Chapter:** [8.6 Debugging & Testing](08-tutorials/06-debugging-testing.md)

### ScrollWidget
Container widget that provides scrollable content area. Wrap content in a `ScrollWidget` to enable vertical or horizontal scrolling.

**Chapter:** [3.4 Container Widgets](03-gui-system/04-containers.md)

### SEffectManager
Static manager for creating, playing, and stopping managed effects (`EffectSound`, `EffectParticle`). Handles lifecycle and cleanup.

**Chapter:** [6.15 Sound System](06-engine-api/15-sound-system.md) | [6.20 Particle & Effect System](06-engine-api/20-particle-effects.md)

### Server/Client Architecture
DayZ's fundamental split: server owns game state, client renders and sends input. Code runs in one of three contexts: server, client, or both (listen server).

**Chapter:** [2.6 Server/Client Architecture](02-mod-structure/06-server-client-split.md)
**See also:** [Listen Server](#listen-server), [RPC](#rpc-remote-procedure-call)

### Server Configuration
XML, JSON, and script files in the mission folder that control server behavior: `serverDZ.cfg`, `types.xml`, `init.c`, `cfgeconomycore.xml`.

**Chapter:** [5.5 Server Configuration Files](05-config-files/05-server-configs.md)

### SetActions
Method on `ItemBase` where actions are registered. Override it, call `super.SetActions()`, then `AddAction(ActionClass)`.

**Chapter:** [6.12 Action System](06-engine-api/12-action-system.md)
**See also:** [ActionBase](#actionbase), [AddAction](#addaction)

### SetHandler
`widget.SetHandler(handlerInstance)` -- attaches a `ScriptedWidgetEventHandler` to a widget to receive its events.

**Chapter:** [3.6 Event Handling](03-gui-system/06-event-handling.md)
**See also:** [ScriptedWidgetEventHandler](#scriptedwidgeteventhandler)

### Singleton
Pattern guaranteeing a class has exactly one instance, globally accessible. The most common architectural pattern in DayZ mods.

**Chapter:** [7.1 Singleton Pattern](07-patterns/01-singletons.md)

### Sizing & Positioning
Widget sizing uses a dual coordinate mode -- proportional (0.0 to 1.0 relative to parent) or pixel-based (absolute screen pixels). Each dimension is independent.

**Chapter:** [3.3 Sizing & Positioning](03-gui-system/03-sizing-positioning.md)

### Sound System
Two approaches: high-level `EffectSound`/`SEffectManager` API, and config-driven `PlaySoundSet()`/`StopSoundSet()` on entities. All sound is client-side only.

**Chapter:** [6.15 Sound System](06-engine-api/15-sound-system.md)
**See also:** [CfgSoundSets](#cfgsoundsets), [EffectSound](#effectsound)

### Spawning Gear
Two systems: **spawn points** determine where characters appear; **spawn gear** (`cfgPlayerSpawnGear.json`) determines what equipment they carry.

**Chapter:** [5.6 Spawning Gear Configuration](05-config-files/06-spawning-gear.md)

### static
Method/field modifier. Static members belong to the class itself, not to instances. Accessed via `ClassName.Member`.

**Chapter:** [1.3 Classes & Inheritance](01-enforce-script/03-classes-inheritance.md) | [1.13 Functions & Methods](01-enforce-script/13-functions-methods.md)

### Steam Workshop
Valve's mod distribution platform. DayZ mods are uploaded via DayZ Tools publisher or SteamCMD and downloaded by players through Steam.

**Chapter:** [8.7 Publishing to Workshop](08-tutorials/07-publishing-workshop.md)
**See also:** [Publishing](#publishing)

### string
Immutable value type for text. Passed by value, compared by value. Rich built-in methods: `Substring`, `IndexOf`, `Replace`, `ToLower`, `Length`, `Split`.

**Chapter:** [1.1 Variables & Types](01-enforce-script/01-variables-types.md) | [1.6 String Operations](01-enforce-script/06-strings.md)

### stringtable.csv
CSV file providing localized text. Columns for 13 languages. Keys are referenced in layouts and scripts for user-facing strings.

**Chapter:** [5.1 stringtable.csv](05-config-files/01-stringtable.md)
**See also:** [Localization](#localization)

### Styles (GUI)
Predefined visual appearances applied to widgets via the `style` attribute. Control backgrounds, borders, and overall look without manual configuration.

**Chapter:** [3.7 Styles, Fonts & Images](03-gui-system/07-styles-fonts.md)

### super
Keyword used inside method overrides to call the parent class implementation. Critical in modded classes to preserve original behavior.

**Chapter:** [1.4 Modded Classes](01-enforce-script/04-modded-classes.md) | [1.3 Classes & Inheritance](01-enforce-script/03-classes-inheritance.md)

### switch/case
Control flow construct for multi-branch selection. Key difference: cases do NOT fall through in Enforce Script.

**Chapter:** [1.5 Control Flow](01-enforce-script/05-control-flow.md) | [1.12 Gotchas](01-enforce-script/12-gotchas.md)

## T

### Terrain Builder
DayZ Tools application for creating and editing terrain data (heightmaps, surface masks, object placement).

**Chapter:** [4.5 DayZ Tools Workflow](04-file-formats/05-dayz-tools.md)

### Terrain Queries
Engine APIs for querying terrain height, surface type, and surface normals. Accessed via `GetGame().SurfaceY()`, `GetGame().SurfaceGetType()`, etc.

**Chapter:** [6.19 Terrain & World Queries](06-engine-api/19-terrain-queries.md)

### TextWidget
Widget for displaying text. Key methods: `SetText(string)`, `SetColor(int)`. Use `RichTextWidget` for formatted text with inline markup.

**Chapter:** [3.1 Widget Types](03-gui-system/01-widget-types.md)
**See also:** [RichTextWidget](#richtextwidget)

### TexView2
DayZ Tools texture viewer and converter. Converts between PAA, TGA, PNG, and EDDS formats. Essential for texture workflow.

**Chapter:** [4.5 DayZ Tools Workflow](04-file-formats/05-dayz-tools.md) | [4.1 Textures](04-file-formats/01-textures.md)

### TGA
Truevision TGA -- uncompressed texture source format. Common starting point for texture creation. Converted to PAA for game use.

**Chapter:** [4.1 Textures](04-file-formats/01-textures.md)
**See also:** [PAA](#paa), [TexView2](#texview2)

### thread
Method modifier that marks a function as a coroutine. `thread` methods can yield execution and resume later. Spawned via direct call.

**Chapter:** [1.13 Functions & Methods](01-enforce-script/13-functions-methods.md)

### Timer
Managed timer class for repeating or delayed function calls. Alternative to `ScriptCallQueue` with built-in start/stop lifecycle.

**Chapter:** [6.7 Timers & CallQueue](06-engine-api/07-timers.md)
**See also:** [CallLater](#calllater), [ScriptCallQueue](#scriptcallqueue)

### Trading System
A shop system with JSON config, server-validated buy/sell, categorized UI, and currency-based transactions.

**Chapter:** [8.12 Building a Trading System](08-tutorials/12-trading-system.md)

### Transport
Base class for all vehicle entities. Subclasses: `Car` (land vehicles via `CarScript`) and `Boat` (watercraft via `BoatScript`).

**Chapter:** [6.2 Vehicle System](06-engine-api/02-vehicles.md)
**See also:** [CarScript](#carscript)

### typename
Primitive type that holds a reference to a type itself. Used for reflection: `typename t = MyClass;`, then `t.Spawn()` creates an instance dynamically.

**Chapter:** [1.1 Variables & Types](01-enforce-script/01-variables-types.md) | [1.9 Casting & Reflection](01-enforce-script/09-casting-reflection.md)

### types.xml
Central Economy file that defines every spawnable item's nominal count, min count, lifetime, restock rate, category, usage flags, and value flags.

**Chapter:** [6.10 Central Economy](06-engine-api/10-central-economy.md) | [5.5 Server Configs](05-config-files/05-server-configs.md)
**See also:** [Central Economy](#central-economy-ce)

## U

### UAInput
Script-level API for querying input state at runtime. `GetUApi().GetInputByName("UAMyAction")` returns a `UAInput` object with press/release/hold methods.

**Chapter:** [6.13 Input System](06-engine-api/13-input-system.md) | [5.2 inputs.xml](05-config-files/02-inputs-xml.md)
**See also:** [inputs.xml](#inputsxml)

### UI Patterns
Real-world UI techniques from professional mods: tab navigation, list pooling, context menus, drag-and-drop, tooltip management.

**Chapter:** [3.9 Real Mod UI Patterns](03-gui-system/09-real-mod-patterns.md)

### UIScriptedMenu
Base class for full-screen or modal UI panels. Provides lifecycle methods (`OnShow`, `OnHide`, `Update`) and built-in widget event routing.

**Chapter:** [3.8 Dialogs & Modals](03-gui-system/08-dialogs-modals.md) | [3.6 Event Handling](03-gui-system/06-event-handling.md)

## V

### Value Types
Types passed by copy, not by reference: `int`, `float`, `bool`, `string`, `vector`. Modifications to a copy do not affect the original.

**Chapter:** [1.1 Variables & Types](01-enforce-script/01-variables-types.md)

### vector
Primitive three-component float type (x, y, z). Passed by value. Constructed from string: `vector v = "1 2 3";`. Access components via index: `v[0]`, `v[1]`, `v[2]`.

**Chapter:** [1.1 Variables & Types](01-enforce-script/01-variables-types.md) | [1.7 Math & Vectors](01-enforce-script/07-math-vectors.md)

### Vehicle Mod
A mod that creates custom drivable vehicles by extending `CarScript` or `BoatScript` in `CfgVehicles` with custom stats, textures, and scripted behavior.

**Chapter:** [8.10 Creating a Vehicle Mod](08-tutorials/10-vehicle-mod.md) | [6.2 Vehicle System](06-engine-api/02-vehicles.md)

### Vehicle System
DayZ's transport system. Vehicles have fluid systems (fuel, oil, brake, coolant), parts with health, gear simulation, and engine-managed physics.

**Chapter:** [6.2 Vehicle System](06-engine-api/02-vehicles.md)
**See also:** [CarScript](#carscript), [Transport](#transport)

### VPP (VPP Admin Tools)
Major community admin mod by DaOne and GravityWolf. Provides player management, chat commands, webhooks, ESP, and a permission system.

**Chapter:** [3.9 Real Mod UI Patterns](03-gui-system/09-real-mod-patterns.md) | [7.5 Permission Systems](07-patterns/05-permissions.md)

## W

### Weather System
Fully dynamic system controlling overcast, rain, snowfall, fog, wind, and thunderstorms. Accessed via `GetGame().GetWeather()`.

**Chapter:** [6.3 Weather System](06-engine-api/03-weather.md) | [6.23 World Systems](06-engine-api/23-world-systems.md)

### Widget
Base class for all UI elements. Every visible element on screen is a widget in a parent-child tree rooted at `WorkspaceWidget`.

**Chapter:** [3.1 Widget Types](03-gui-system/01-widget-types.md)
**See also:** [Layout File](#layout-file)

### WidgetFadeTimer
Specialized timer for animating widget alpha transitions (fade in/out). Simpler than manual alpha interpolation.

**Chapter:** [6.7 Timers & CallQueue](06-engine-api/07-timers.md)

### Workbench
Bohemia's IDE for the Enfusion engine. Provides script editing, debugger (breakpoints, stepping, variable inspection), layout preview, resource browser, and live console.

**Chapter:** [4.7 Workbench Guide](04-file-formats/07-workbench-guide.md) | [4.5 DayZ Tools Workflow](04-file-formats/05-dayz-tools.md)
**See also:** [DayZDiag](#dayzdiag)

### WorkspaceWidget
Root widget obtained via `GetGame().GetWorkspace()`. Used to create widgets programmatically with `CreateWidgets()` and `CreateWidget()`.

**Chapter:** [3.1 Widget Types](03-gui-system/01-widget-types.md) | [3.5 Programmatic Widgets](03-gui-system/05-programmatic-widgets.md)

### World Systems
Mission-folder configurations for contaminated areas, underground darkness, weather overrides, gameplay rules, and object placement.

**Chapter:** [6.23 World Systems](06-engine-api/23-world-systems.md)

### WrapSpacerWidget
Container widget that arranges children sequentially with wrapping, padding, and margins. The flow layout equivalent.

**Chapter:** [3.1 Widget Types](03-gui-system/01-widget-types.md) | [3.4 Container Widgets](03-gui-system/04-containers.md)
**See also:** [GridSpacerWidget](#gridspacerwidget)

### WSS
Bohemia's proprietary audio format. Legacy format still used in some vanilla sound definitions. Prefer OGG Vorbis for new content.

**Chapter:** [4.4 Audio](04-file-formats/04-audio.md)
**See also:** [OGG](#ogg)

## X

### XComboBoxWidget
Dropdown selection widget. Used for settings panels and property editors where the user selects from predefined options.

**Chapter:** [3.10 Advanced Widgets](03-gui-system/10-advanced-widgets.md)

## Z

### ZombieBase
Base class for infected entities. Extends `DayZInfected` with scriptable behavior: mind states, movement commands, attack patterns, and perception.

**Chapter:** [6.21 Zombie & AI System](06-engine-api/21-zombie-ai-system.md)
**See also:** [AnimalBase](#animalbase)

### Zombie & AI System
DayZ's hostile AI framework. Infected patrol, detect players through sight/sound/proximity, transition through behavioral states, attack, and die.

**Chapter:** [6.21 Zombie & AI System](06-engine-api/21-zombie-ai-system.md)

---

## Chapter Index

Quick reference to all 92 chapters plus supplementary pages:

### Part 1: Enforce Script Language
| # | Chapter | Page |
|---|---------|------|
| 1.1 | Variables & Types | [01-enforce-script/01-variables-types.md](01-enforce-script/01-variables-types.md) |
| 1.2 | Arrays, Maps & Sets | [01-enforce-script/02-arrays-maps-sets.md](01-enforce-script/02-arrays-maps-sets.md) |
| 1.3 | Classes & Inheritance | [01-enforce-script/03-classes-inheritance.md](01-enforce-script/03-classes-inheritance.md) |
| 1.4 | Modded Classes | [01-enforce-script/04-modded-classes.md](01-enforce-script/04-modded-classes.md) |
| 1.5 | Control Flow | [01-enforce-script/05-control-flow.md](01-enforce-script/05-control-flow.md) |
| 1.6 | String Operations | [01-enforce-script/06-strings.md](01-enforce-script/06-strings.md) |
| 1.7 | Math & Vectors | [01-enforce-script/07-math-vectors.md](01-enforce-script/07-math-vectors.md) |
| 1.8 | Memory Management | [01-enforce-script/08-memory-management.md](01-enforce-script/08-memory-management.md) |
| 1.9 | Casting & Reflection | [01-enforce-script/09-casting-reflection.md](01-enforce-script/09-casting-reflection.md) |
| 1.10 | Enums & Preprocessor | [01-enforce-script/10-enums-preprocessor.md](01-enforce-script/10-enums-preprocessor.md) |
| 1.11 | Error Handling | [01-enforce-script/11-error-handling.md](01-enforce-script/11-error-handling.md) |
| 1.12 | What Does NOT Exist | [01-enforce-script/12-gotchas.md](01-enforce-script/12-gotchas.md) |
| 1.13 | Functions & Methods | [01-enforce-script/13-functions-methods.md](01-enforce-script/13-functions-methods.md) |

### Part 2: Mod Structure
| # | Chapter | Page |
|---|---------|------|
| 2.1 | The 5-Layer Script Hierarchy | [02-mod-structure/01-five-layers.md](02-mod-structure/01-five-layers.md) |
| 2.2 | config.cpp Deep Dive | [02-mod-structure/02-config-cpp.md](02-mod-structure/02-config-cpp.md) |
| 2.3 | mod.cpp & Workshop | [02-mod-structure/03-mod-cpp.md](02-mod-structure/03-mod-cpp.md) |
| 2.4 | Your First Mod | [02-mod-structure/04-minimum-viable-mod.md](02-mod-structure/04-minimum-viable-mod.md) |
| 2.5 | File Organization | [02-mod-structure/05-file-organization.md](02-mod-structure/05-file-organization.md) |
| 2.6 | Server/Client Architecture | [02-mod-structure/06-server-client-split.md](02-mod-structure/06-server-client-split.md) |

### Part 3: GUI & Layout System
| # | Chapter | Page |
|---|---------|------|
| 3.1 | Widget Types | [03-gui-system/01-widget-types.md](03-gui-system/01-widget-types.md) |
| 3.2 | Layout File Format | [03-gui-system/02-layout-files.md](03-gui-system/02-layout-files.md) |
| 3.3 | Sizing & Positioning | [03-gui-system/03-sizing-positioning.md](03-gui-system/03-sizing-positioning.md) |
| 3.4 | Container Widgets | [03-gui-system/04-containers.md](03-gui-system/04-containers.md) |
| 3.5 | Programmatic Creation | [03-gui-system/05-programmatic-widgets.md](03-gui-system/05-programmatic-widgets.md) |
| 3.6 | Event Handling | [03-gui-system/06-event-handling.md](03-gui-system/06-event-handling.md) |
| 3.7 | Styles, Fonts & Images | [03-gui-system/07-styles-fonts.md](03-gui-system/07-styles-fonts.md) |
| 3.8 | Dialogs & Modals | [03-gui-system/08-dialogs-modals.md](03-gui-system/08-dialogs-modals.md) |
| 3.9 | Real Mod UI Patterns | [03-gui-system/09-real-mod-patterns.md](03-gui-system/09-real-mod-patterns.md) |
| 3.10 | Advanced Widgets | [03-gui-system/10-advanced-widgets.md](03-gui-system/10-advanced-widgets.md) |

### Part 4: File Formats & Tools
| # | Chapter | Page |
|---|---------|------|
| 4.1 | Textures (.paa, .edds, .tga) | [04-file-formats/01-textures.md](04-file-formats/01-textures.md) |
| 4.2 | 3D Models (.p3d) | [04-file-formats/02-models.md](04-file-formats/02-models.md) |
| 4.3 | Materials (.rvmat) | [04-file-formats/03-materials.md](04-file-formats/03-materials.md) |
| 4.4 | Audio (.ogg, .wss) | [04-file-formats/04-audio.md](04-file-formats/04-audio.md) |
| 4.5 | DayZ Tools Workflow | [04-file-formats/05-dayz-tools.md](04-file-formats/05-dayz-tools.md) |
| 4.6 | PBO Packing | [04-file-formats/06-pbo-packing.md](04-file-formats/06-pbo-packing.md) |
| 4.7 | Workbench Guide | [04-file-formats/07-workbench-guide.md](04-file-formats/07-workbench-guide.md) |
| 4.8 | Building Modeling | [04-file-formats/08-building-modeling.md](04-file-formats/08-building-modeling.md) |

### Part 5: Configuration Files
| # | Chapter | Page |
|---|---------|------|
| 5.1 | stringtable.csv | [05-config-files/01-stringtable.md](05-config-files/01-stringtable.md) |
| 5.2 | inputs.xml | [05-config-files/02-inputs-xml.md](05-config-files/02-inputs-xml.md) |
| 5.3 | Credits.json | [05-config-files/03-credits-json.md](05-config-files/03-credits-json.md) |
| 5.4 | ImageSet Format | [05-config-files/04-imagesets.md](05-config-files/04-imagesets.md) |
| 5.5 | Server Configuration Files | [05-config-files/05-server-configs.md](05-config-files/05-server-configs.md) |
| 5.6 | Spawning Gear Configuration | [05-config-files/06-spawning-gear.md](05-config-files/06-spawning-gear.md) |

### Part 6: Engine API Reference
| # | Chapter | Page |
|---|---------|------|
| 6.1 | Entity System | [06-engine-api/01-entity-system.md](06-engine-api/01-entity-system.md) |
| 6.2 | Vehicle System | [06-engine-api/02-vehicles.md](06-engine-api/02-vehicles.md) |
| 6.3 | Weather System | [06-engine-api/03-weather.md](06-engine-api/03-weather.md) |
| 6.4 | Camera System | [06-engine-api/04-cameras.md](06-engine-api/04-cameras.md) |
| 6.5 | Post-Process Effects | [06-engine-api/05-ppe.md](06-engine-api/05-ppe.md) |
| 6.6 | Notification System | [06-engine-api/06-notifications.md](06-engine-api/06-notifications.md) |
| 6.7 | Timers & CallQueue | [06-engine-api/07-timers.md](06-engine-api/07-timers.md) |
| 6.8 | File I/O & JSON | [06-engine-api/08-file-io.md](06-engine-api/08-file-io.md) |
| 6.9 | Networking & RPC | [06-engine-api/09-networking.md](06-engine-api/09-networking.md) |
| 6.10 | Central Economy | [06-engine-api/10-central-economy.md](06-engine-api/10-central-economy.md) |
| 6.11 | Mission Hooks | [06-engine-api/11-mission-hooks.md](06-engine-api/11-mission-hooks.md) |
| 6.12 | Action System | [06-engine-api/12-action-system.md](06-engine-api/12-action-system.md) |
| 6.13 | Input System | [06-engine-api/13-input-system.md](06-engine-api/13-input-system.md) |
| 6.14 | Player System | [06-engine-api/14-player-system.md](06-engine-api/14-player-system.md) |
| 6.15 | Sound System | [06-engine-api/15-sound-system.md](06-engine-api/15-sound-system.md) |
| 6.16 | Crafting System | [06-engine-api/16-crafting-system.md](06-engine-api/16-crafting-system.md) |
| 6.17 | Construction System | [06-engine-api/17-construction-system.md](06-engine-api/17-construction-system.md) |
| 6.18 | Animation System | [06-engine-api/18-animation-system.md](06-engine-api/18-animation-system.md) |
| 6.19 | Terrain & World Queries | [06-engine-api/19-terrain-queries.md](06-engine-api/19-terrain-queries.md) |
| 6.20 | Particle & Effect System | [06-engine-api/20-particle-effects.md](06-engine-api/20-particle-effects.md) |
| 6.21 | Zombie & AI System | [06-engine-api/21-zombie-ai-system.md](06-engine-api/21-zombie-ai-system.md) |
| 6.22 | Admin & Server Management | [06-engine-api/22-admin-server.md](06-engine-api/22-admin-server.md) |
| 6.23 | World Systems | [06-engine-api/23-world-systems.md](06-engine-api/23-world-systems.md) |

### Part 7: Patterns & Best Practices
| # | Chapter | Page |
|---|---------|------|
| 7.1 | Singleton Pattern | [07-patterns/01-singletons.md](07-patterns/01-singletons.md) |
| 7.2 | Module / Plugin Systems | [07-patterns/02-module-systems.md](07-patterns/02-module-systems.md) |
| 7.3 | RPC Communication | [07-patterns/03-rpc-patterns.md](07-patterns/03-rpc-patterns.md) |
| 7.4 | Config Persistence | [07-patterns/04-config-persistence.md](07-patterns/04-config-persistence.md) |
| 7.5 | Permission Systems | [07-patterns/05-permissions.md](07-patterns/05-permissions.md) |
| 7.6 | Event-Driven Architecture | [07-patterns/06-events.md](07-patterns/06-events.md) |
| 7.7 | Performance Optimization | [07-patterns/07-performance.md](07-patterns/07-performance.md) |

### Part 8: Tutorials
| # | Chapter | Page |
|---|---------|------|
| 8.1 | Your First Mod (Hello World) | [08-tutorials/01-first-mod.md](08-tutorials/01-first-mod.md) |
| 8.2 | Creating a Custom Item | [08-tutorials/02-custom-item.md](08-tutorials/02-custom-item.md) |
| 8.3 | Building an Admin Panel | [08-tutorials/03-admin-panel.md](08-tutorials/03-admin-panel.md) |
| 8.4 | Adding Chat Commands | [08-tutorials/04-chat-commands.md](08-tutorials/04-chat-commands.md) |
| 8.5 | Using the DayZ Mod Template | [08-tutorials/05-mod-template.md](08-tutorials/05-mod-template.md) |
| 8.6 | Debugging & Testing | [08-tutorials/06-debugging-testing.md](08-tutorials/06-debugging-testing.md) |
| 8.7 | Publishing to Steam Workshop | [08-tutorials/07-publishing-workshop.md](08-tutorials/07-publishing-workshop.md) |
| 8.8 | Building a HUD Overlay | [08-tutorials/08-hud-overlay.md](08-tutorials/08-hud-overlay.md) |
| 8.9 | Professional Mod Template | [08-tutorials/09-professional-template.md](08-tutorials/09-professional-template.md) |
| 8.10 | Creating a Vehicle Mod | [08-tutorials/10-vehicle-mod.md](08-tutorials/10-vehicle-mod.md) |
| 8.11 | Creating a Clothing Mod | [08-tutorials/11-clothing-mod.md](08-tutorials/11-clothing-mod.md) |
| 8.12 | Building a Trading System | [08-tutorials/12-trading-system.md](08-tutorials/12-trading-system.md) |
| 8.13 | Diag Menu Reference | [08-tutorials/13-diag-menu.md](08-tutorials/13-diag-menu.md) |

### Supplementary Pages
| Page | Link |
|------|------|
| Enforce Script Cheat Sheet | [cheatsheet.md](cheatsheet.md) |
| API Quick Reference | [06-engine-api/quick-reference.md](06-engine-api/quick-reference.md) |
| FAQ | [faq.md](faq.md) |
| Troubleshooting Guide | [troubleshooting.md](troubleshooting.md) |

---

*This glossary covers 160+ terms across all 92 chapters and 4 supplementary pages of the DayZ Modding Complete Guide.*
