# DayZ Modding 用語集

[Home](../README.md) | **用語集**

---

このwikiとDayZ Moddingで使用される用語の包括的なリファレンスです。

---

## A

**Action** — A player interaction with an item or the world (eating, opening doors, repairing). Actions are built using `ActionBase` with conditions and callback stages. [第 6.12](06-engine-api/12-action-system.md).

**Addon Builder** — DayZ Tools application that packs mod files into PBO archives. Handles binarization, file signing, and prefix mapping. [第 4.6](04-file-formats/06-pbo-packing.md).

**autoptr** — Scoped strong reference pointer in Enforce Script. The referenced object is automatically destroyed when the `autoptr` goes out of scope. Rarely used DayZ Moddingにおいて (prefer explicit `ref`). [第 1.8](01-enforce-script/08-memory-management.md).

---

## B

**Binarize** — Process of converting source files (`config.cpp`, `.p3d`, `.tga`) into optimized engine-ready formats (`.bin`, ODOL, `.paa`). Performed automatically by Addon Builder or the Binarize tool in DayZ Tools. [第 4.6](04-file-formats/06-pbo-packing.md).

**bikey / biprivatekey / bisign** — See [Key Signing](#k).

---

## C

**CallQueue** — DayZ engine utility for scheduling delayed or repeating function calls. Accessed via `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)`. [第 6.7](06-engine-api/07-timers.md).

**CastTo** — See [Class.CastTo](#classcasto).

**Central Economy (CE)** — DayZ's loot distribution and persistence system. Configured through XML files (`types.xml`, `mapgrouppos.xml`, `cfglimitsdefinition.xml`) that define what spawns, where, and how often. [第 6.10](06-engine-api/10-central-economy.md).

**CfgMods** — Top-level config.cpp class that registers a mod with エンジン. Defines the mod name, script directories, required dependencies, and addon loading order. [第 2.2](02-mod-structure/02-config-cpp.md).

**CfgPatches** — Config.cpp class that registers individual addons (script packages, models, textures) within a mod. The `requiredAddons[]` array controls loading order between mods. [第 2.2](02-mod-structure/02-config-cpp.md).

**CfgVehicles** — Config.cpp class hierarchy that defines all game entities: items, buildings, vehicles, animals, and players. Despite the name, it contains far more than vehicles. [第 2.2](02-mod-structure/02-config-cpp.md).

**Class.CastTo** — Static method for safe downcasting in Enforce Script. Returns `true` if the cast succeeds. Required because Enforce Script has no `as` keyword. 使い方： `Class.CastTo(result, source)`. [第 1.9](01-enforce-script/09-casting-reflection.md).

**CommunityFramework (CF)** — Third-party framework mod by Jacob_Mango providing module lifecycle management, logging, RPC helpers, file I/O utilities, and doubly-linked list data structures. Many popular mods depend on it. [第 7.2](07-patterns/02-module-systems.md).

**config.cpp** — The central configuration file for every DayZ mod. Defines `CfgPatches`, `CfgMods`, `CfgVehicles`, and other class hierarchies that エンジン reads at startup. This is NOT C++ code despite the extension. [第 2.2](02-mod-structure/02-config-cpp.md).

---

## D

**DamageSystem** — Engine subsystem that handles hit registration, damage zones, health/blood/shock values, and armor calculations on entities. Configured through config.cpp `DamageSystem` class with zones and hit components. [第 6.1](06-engine-api/01-entity-system.md).

**DayZ Tools** — Free Steam application containing the official modding toolkit: Object Builder, Terrain Builder, Addon Builder, TexView2, Workbench, and P: drive management. [第 4.5](04-file-formats/05-dayz-tools.md).

**DayZPlayer** — Base class for all player entities in エンジン. Provides access to movement, animation, inventory, and input systems. `PlayerBase` extends this class and is the typical modding entry point. [第 6.1](06-engine-api/01-entity-system.md).

**Dedicated Server** — Standalone headless server process (`DayZServer_x64.exe`) used for multiplayer hosting. Runs server-side scripts only. Contrast with [Listen Server](#l).

---

## E

**EEInit** — Engine event method called when an entity is initialized after creation. Override this in your entity class to perform setup logic. Called on both client and server. [第 6.1](06-engine-api/01-entity-system.md).

**EEKilled** — Engine event method called when an entity's health reaches zero. Used for death logic, loot drops, and kill tracking. [第 6.1](06-engine-api/01-entity-system.md).

**EEHitBy** — Engine event method called when an entity receives damage. Parameters include the damage source, component hit, damage type, and damage zones. [第 6.1](06-engine-api/01-entity-system.md).

**EEItemAttached** — Engine event method called when an item is attached to an entity's inventory slot (e.g., attaching a scope to a weapon). Paired with `EEItemDetached`. [第 6.1](06-engine-api/01-entity-system.md).

**Enforce Script** — Bohemia Interactive's proprietary scripting language used in DayZ and Enfusion engine games. C-like syntax similar to C#, but with unique limitations (no ternary, no try/catch, no lambdas). [パート 1](01-enforce-script/01-variables-types.md).

**EntityAI** — Base class for all "intelligent" entities in DayZ (players, animals, zombies, items). Extends `Entity` with inventory, damage system, and AI interfaces. Most item and character modding starts here. [第 6.1](06-engine-api/01-entity-system.md).

**EventBus** — A publish-subscribe pattern for decoupled communication between systems. Modules subscribe to named events and receive callbacks when events are fired, without direct dependencies. [第 7.6](07-patterns/06-events.md).

---

## F

**File Patching** — Launch parameter (`-filePatching`) that allows エンジン to load loose files from the P: drive instead of packed PBOs. Essential for rapid development iteration. Must be enabled on both client and server. [第 4.6](04-file-formats/06-pbo-packing.md).

**Fire Geometry** — Specialized LOD in a 3D model (`.p3d`) that defines surfaces where bullets can impact and deal damage. Distinct from View Geometry and Geometry LOD. [第 4.2](04-file-formats/02-models.md).

---

## G

**GameInventory** — Engine class managing an entity's inventory system. Provides methods for adding, removing, finding, and transferring items between containers and slots. [第 6.1](06-engine-api/01-entity-system.md).

**GetGame()** — Global function returning the `CGame` singleton. Entry point for accessing mission, players, call queues, RPC, weather, and other engine systems. Available everywhere in script. [第 6.1](06-engine-api/01-entity-system.md).

**GetUApi()** — Global function returning the `UAInputAPI` singleton for the input system. Used to register and query custom keybindings. [第 6.13](06-engine-api/13-input-system.md).

**Geometry LOD** — 3D model level-of-detail used for physical collision detection (player movement, vehicle physics). Separate from View Geometry and Fire Geometry. [第 4.2](04-file-formats/02-models.md).

**Guard Clause** — Defensive programming pattern: check preconditions at the start of a method and return early if they fail. Essential in Enforce Script because there is no try/catch. [第 1.11](01-enforce-script/11-error-handling.md).

---

## H

**Hidden Selections** — Named texture/material slots on a 3D model that can be swapped at runtime via script. Used for camouflage variants, team colors, damage states, and dynamic appearance changes. Defined in config.cpp and the model's named selections. [第 4.2](04-file-formats/02-models.md).

**HUD** — Heads-Up Display: on-screen UI elements visible during gameplay (health indicators, hotbar, compass, notifications). Built using `.layout` files and scripted widget classes. [第 3.1](03-gui-system/01-widget-types.md).

---

## I

**IEntity** — The lowest-level entity interface in the Enfusion engine. Provides transform (position/rotation), visual, and physics access. Most modders work with `EntityAI` or higher classes instead. [第 6.1](06-engine-api/01-entity-system.md).

**ImageSet** — XML file (`.imageset`) defining named rectangular regions within a texture atlas (`.edds` or `.paa`). Used to reference icons, button graphics, and UI elements without separate image files. [第 5.4](05-config-files/04-imagesets.md).

**InventoryLocation** — Engine class describing a specific position in the inventory system: which entity, which slot, which cargo row/column. Used for precise inventory manipulation and transfers. [第 6.1](06-engine-api/01-entity-system.md).

**ItemBase** — The standard 基底クラス for all in-game items (extends `EntityAI`). Weapons, tools, food, clothing, containers, and attachments all inherit from `ItemBase`. [第 6.1](06-engine-api/01-entity-system.md).

---

## J

**JsonFileLoader** — Engine utility class for loading and saving JSON files in Enforce Script. Important gotcha: `JsonLoadFile()` returns `void` — you must pass a pre-allocated object by reference, not assign the return value. [第 6.8](06-engine-api/08-file-io.md).

---

## K

**Key Signing (.bikey, .biprivatekey, .bisign)** — DayZ's mod verification system. A `.biprivatekey` is used to sign PBOs (producing `.bisign` files). The matching `.bikey` public key is placed in the server's `keys/` folder. Servers only load mods whose signatures match an installed key. [第 4.6](04-file-formats/06-pbo-packing.md).

---

## L

**Layout (.layout file)** — XML-based UI definition file used by DayZ's GUI system. Defines widget hierarchy, positioning, sizing, and style properties. Loaded at runtime with `GetGame().GetWorkspace().CreateWidgets()`. [第 3.2](03-gui-system/02-layout-files.md).

**Listen Server** — A server hosted within the game client (player acts as both server and client). Useful for solo testing. Some code paths differ from dedicated servers — always test both. [第 8.1](08-tutorials/01-first-mod.md).

**LOD (Level of Detail)** — Multiple versions of a 3D model at different polygon counts. The engine switches between them based on camera distance to optimize performance. DayZ models also have special-purpose LODs: Geometry, Fire Geometry, View Geometry, Memory, and Shadow. [第 4.2](04-file-formats/02-models.md).

---

## M

**Managed** — Enforce Script keyword indicating a class whose instances are reference-counted and automatically garbage collected. Most DayZ classes inherit from `Managed`. Contrast with `Class` (manually managed). [第 1.8](01-enforce-script/08-memory-management.md).

**Memory Point** — Named point embedded in a 3D model's Memory LOD. Used by scripts to locate positions on an object (muzzle flash origin, attachment points, proxy positions). Accessed via `GetMemoryPointPosition()`. [第 4.2](04-file-formats/02-models.md).

**Mission (MissionServer / MissionGameplay)** — The top-level game state controller. `MissionServer` runs on the server, `MissionGameplay` runs on the client. Override these to hook into game startup, player connections, and shutdown. [第 6.11](06-engine-api/11-mission-hooks.md).

**mod.cpp** — File placed in a mod's root folder that defines its Steam Workshop metadata: name, author, description, icon, and action URL. Not to be confused with `config.cpp`. [第 2.3](02-mod-structure/03-mod-cpp.md).

**Modded Class** — Enforce Script mechanism (`modded class X extends X`) for extending or overriding existing classes without modifying original files. The engine chains all modded class definitions together. This is the primary way mods interact with vanilla and other mods. [第 1.4](01-enforce-script/04-modded-classes.md).

**Module** — A self-contained unit of functionality registered with a module manager (like CF's `PluginManager`). Modules have lifecycle methods (`OnInit`, `OnUpdate`, `OnMissionFinish`) and are the standard architecture for mod systems. [第 7.2](07-patterns/02-module-systems.md).

---

## N

**Named Selection** — A named group of vertices/faces in a 3D model, created in Object Builder. Used for Hidden Selections (texture swapping), damage zones, and animation targets. [第 4.2](04-file-formats/02-models.md).

**Net Sync Variable** — A variable automatically synchronized from server to all clients by エンジン's network replication system. Registered via `RegisterNetSyncVariable*()` methods and received in `OnVariablesSynchronized()`. [第 6.9](06-engine-api/09-networking.md).

**notnull** — Enforce Script parameter modifier that tells コンパイラ a reference parameter must not be `null`. Provides compile-time safety and documents intent. 使い方： `void DoWork(notnull MyClass obj)`. [第 1.3](01-enforce-script/03-classes-inheritance.md).

---

## O

**Object Builder** — DayZ Tools application for creating and editing 3D models (`.p3d`). Used to define LODs, named selections, memory points, and geometry components. [第 4.5](04-file-formats/05-dayz-tools.md).

**OnInit** — Lifecycle method called when a module or plugin is first initialized. Used for registration, subscription to events, and one-time setup. [第 7.2](07-patterns/02-module-systems.md).

**OnUpdate** — Lifecycle method called 毎フレーム (or at a fixed interval) on modules and certain entities. Use sparingly — per-frame code is a performance concern. [第 7.7](07-patterns/07-performance.md).

**OnMissionFinish** — Lifecycle method called when a mission ends (server shutdown, disconnect). Used for cleanup, saving state, and releasing resources. [第 6.11](06-engine-api/11-mission-hooks.md).

**Override** — The `override` keyword in Enforce Script, marking a method that replaces a 親クラス method. Required (or strongly recommended) when overriding virtual methods. Always call `super.MethodName()` to preserve parent behavior unless intentionally replacing it. [第 1.3](01-enforce-script/03-classes-inheritance.md).

---

## P

**P: Drive (Workdrive)** — Virtual drive letter mapped by DayZ Tools to your mod project directory. The engine uses `P:\` paths internally to locate source files during development. Set up via DayZ Tools or manual `subst` commands. [第 4.5](04-file-formats/05-dayz-tools.md).

**PAA** — Bohemia's proprietary texture format (`.paa`). Converted from `.tga` or `.png` source files using TexView2 or Addon Builder's binarization step. Supports DXT1, DXT5, and ARGB compression. [第 4.1](04-file-formats/01-textures.md).

**PBO** — Packed Bohemia Object (`.pbo`): the archive format for distributing DayZ mod content. Contains scripts, configs, textures, models, and data files. Built with Addon Builder or third-party tools. [第 4.6](04-file-formats/06-pbo-packing.md).

**PlayerBase** — The primary player entity class modders work with. Extends `DayZPlayer` and provides access to inventory, damage, status effects, and all player-related functionality. [第 6.1](06-engine-api/01-entity-system.md).

**PlayerIdentity** — Engine class containing a connected player's metadata: Steam UID, name, network ID, and ping. Accessed server-side from `PlayerBase.GetIdentity()`. Essential for admin tools and persistence. [第 6.9](06-engine-api/09-networking.md).

**PPE (Post-Process Effects)** — Engine system for screen-space visual effects: blur, color grading, chromatic aberration, vignette, film grain. Controlled via `PPERequester` classes. [第 6.5](06-engine-api/05-ppe.md).

**Print** — Built-in function for outputting text to the script log (`%localappdata%/DayZ/` log files). Useful for debugging but should be removed or guarded in production code. [第 1.11](01-enforce-script/11-error-handling.md).

**Proto Native** — Functions declared with `proto native` are implemented in the C++ engine, not in script. They bridge Enforce Script to engine internals and オーバーライドできません. [第 1.3](01-enforce-script/03-classes-inheritance.md).

---

## Q

**Quaternion** — A four-component rotation representation used internally by エンジン. 実際には, DayZ modders typically work with Euler angles (`vector` of pitch/yaw/roll) and エンジン converts internally. [第 1.7](01-enforce-script/07-math-vectors.md).

---

## R

**ref** — Enforce Script keyword declaring a strong reference to a managed object. Prevents garbage collection while the reference exists. Use `ref` for ownership; raw references for non-owning pointers. Beware of `ref` cycles (A refs B, B refs A) which cause メモリリークs. [第 1.8](01-enforce-script/08-memory-management.md).

**requiredAddons** — Array in `CfgPatches` specifying which addons must load before yours. Controls script compilation and config inheritance order between mods. Getting this wrong causes "missing class" or silent load failures. [第 2.2](02-mod-structure/02-config-cpp.md).

**RPC (Remote Procedure Call)** — Mechanism for sending data between server and client. DayZ provides `GetGame().RPCSingleParam()` and `ScriptRPC` for custom communication. Requires matching sender and receiver on the correct machine. [第 6.9](06-engine-api/09-networking.md).

**RVMAT** — Material definition file (`.rvmat`) used by DayZ's renderer. Specifies textures, shaders, and surface properties for 3D models. [第 4.3](04-file-formats/03-materials.md).

---

## S

**Scope (config)** — Integer value in `CfgVehicles` controlling item visibility: `0` = hidden/abstract (never spawns), `1` = only accessible via script, `2` = visible in-game and spawnable by Central Economy. [第 2.2](02-mod-structure/02-config-cpp.md).

**ScriptRPC** — Enforce Script class for building and sending custom RPC messages. Allows writing multiple parameters (ints, floats, strings, vectors) into a single network packet. [第 6.9](06-engine-api/09-networking.md).

**SEffectManager** — Singleton manager for visual and sound effects. Handles particle creation, sound playback, and effect lifecycle. Use `SEffectManager.PlayInWorld()` for positioned effects. [第 6.1](06-engine-api/01-entity-system.md).

**Singleton** — Design pattern ensuring only one instance of a class exists. In Enforce Script, commonly implemented with a static `GetInstance()` method storing the instance in a `static ref` variable. [第 7.1](07-patterns/01-singletons.md).

**Slot** — A named attachment point on an entity (e.g., `"Shoulder"`, `"Hands"`, `"Slot_Magazine"`). Defined in config.cpp under `InventorySlots` and the entity's `attachments[]` array. [第 6.1](06-engine-api/01-entity-system.md).

**stringtable.csv** — CSV file providing localized strings for up to 13 languages. Referenced in code via `#STR_` prefixed keys. The engine automatically selects the correct language column. [第 5.1](05-config-files/01-stringtable.md).

**super** — Keyword used inside a method override to call the 親クラス implementation. Always call `super.MethodName()` in overridden methods unless you intentionally want to skip parent logic. [第 1.3](01-enforce-script/03-classes-inheritance.md).

---

## T

**TexView2** — DayZ Tools utility for viewing and converting textures between `.tga`, `.png`, `.paa`, and `.edds` formats. Also used to inspect PAA compression, mipmaps, and alpha channels. [第 4.5](04-file-formats/05-dayz-tools.md).

**typename** — Enforce Script type representing a class reference at runtime. Used for reflection, factory patterns, and dynamic type checking. Obtained from an instance with `obj.Type()` or from a class name directly: `typename t = PlayerBase;`. [第 1.9](01-enforce-script/09-casting-reflection.md).

**types.xml** — Central Economy XML file defining every spawnable item's nominal count, lifetime, restock behavior, spawn categories, and tier zones. Located in the mission's `db/` folder. [第 6.10](06-engine-api/10-central-economy.md).

---

## U

**UAInput** — Engine class representing a single input action (keybinding). Created from `GetUApi().RegisterInput()` and used to detect key presses, holds, and releases. Defined alongside `inputs.xml`. [第 6.13](06-engine-api/13-input-system.md).

**Unlink** — Method to safely destroy and dereference a managed object. Preferred over setting to `null` when you need to ensure immediate cleanup. Called as `GetGame().ObjectDelete(obj)` for entities. [第 1.8](01-enforce-script/08-memory-management.md).

---

## V

**View Geometry** — 3D model LOD used for visual occlusion tests (AI sight checks, player line-of-sight). Determines whether an object blocks vision. Separate from Geometry LOD (collision) and Fire Geometry (ballistics). [第 4.2](04-file-formats/02-models.md).

---

## W

**Widget** — Base class for all UI elements in DayZ's GUI system. Subtypes include `TextWidget`, `ImageWidget`, `ButtonWidget`, `EditBoxWidget`, `ScrollWidget`, and container types like `WrapSpacerWidget`. [第 3.1](03-gui-system/01-widget-types.md).

**Workbench** — DayZ Tools IDE for editing scripts, configs, and running the game in development mode. Provides script compilation, breakpoints, and the Resource Browser. [第 4.5](04-file-formats/05-dayz-tools.md).

**WrapSpacer** — Container widget that wraps its children into rows/columns (like CSS flexbox wrap). Essential for dynamic lists, inventory grids, and any layout where child count varies. [第 3.4](03-gui-system/04-containers.md).

---

## X

**XML Configs** — Collective term for the many XML configuration files used by DayZ servers: `types.xml`, `globals.xml`, `economy.xml`, `events.xml`, `cfglimitsdefinition.xml`, `mapgrouppos.xml`, and others. [第 6.10](06-engine-api/10-central-economy.md).

---

## Z

**Zone (Damage Zone)** — A named region on an entity's model that receives independent health tracking. Defined in config.cpp under `DamageSystem` with `class DamageZones`. Common zones on players: `Head`, `Torso`, `LeftArm`, `LeftLeg`, etc. [第 6.1](06-engine-api/01-entity-system.md).

---

*用語が見つかりませんか？issueを開くかプルリクエストを送信してください。*
