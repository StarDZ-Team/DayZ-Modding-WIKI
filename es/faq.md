# Preguntas Frecuentes

[Home](../README.md) | **Preguntas Frecuentes**

---

## Primeros Pasos

### P: What do I need to start modding DayZ?
**R:** You need Steam, DayZ (retail copy), DayZ Tools (free on Steam under Tools), and a text editor (VS Code recommended). No programming experience is strictly required — start with [Chapter 8.1: Your First Mod](08-tutorials/01-first-mod.md). DayZ Tools includes Object Builder, Addon Builder, TexView2, and the Workbench IDE.

### P: What programming language does DayZ use?
**R:** DayZ uses **Enforce Script**, a proprietary language by Bohemia Interactive. It has C-like syntax similar to C#, but with its own rules and limitations (no ternary operator, no try/catch, no lambdas). See [Part 1: Enforce Script](01-enforce-script/01-variables-types.md) for a complete language guide.

### P: How do I set up the P: drive?
**R:** Open DayZ Tools from Steam, click "Workdrive" or "Setup Workdrive" to mount the P: drive. This creates a virtual drive pointing to your modding workspace where the engine looks for source files during development. You can also use `subst P: "C:\Your\Path"` from the command line. Ver [Capitulo 4.5](04-file-formats/05-dayz-tools.md).

### P: Can I test my mod without a dedicated server?
**R:** Yes. Launch DayZ with the `-filePatching` parameter and your mod loaded. For quick testing, use a Listen Server (host from the in-game menu). For production testing, always verify on a dedicated server too, as some code paths differ. Ver [Capitulo 8.1](08-tutorials/01-first-mod.md).

### P: Where do I find vanilla DayZ script files to study?
**R:** After mounting the P: drive via DayZ Tools, vanilla scripts are at `P:\DZ\scripts\` organized by layer (`3_Game`, `4_World`, `5_Mission`). These are the authoritative reference for every engine class, method, and event. Also see the [Cheat Sheet](cheatsheet.md) and [API Quick Reference](06-engine-api/quick-reference.md).

---

## Errores Comunes y Soluciones

### P: My mod loads but nothing happens. No errors in the log.
**R:** Most likely your `config.cpp` has an incorrect `requiredAddons[]` entry, so your scripts load too early or not at all. Verify that each addon name in `requiredAddons` matches an existing `CfgPatches` class name exactly (case-sensitive). Check the script log at `%localappdata%/DayZ/` for silent warnings. Ver [Capitulo 2.2](02-mod-structure/02-config-cpp.md).

### P: I get "Cannot find variable" or "Undefined variable" errors.
**R:** This usually means you are referencing a class or variable from a higher script layer. Lower layers (`3_Game`) cannot see types defined in higher layers (`4_World`, `5_Mission`). Move your class definition to the correct layer, or use `typename` reflection for loose coupling. Ver [Capitulo 2.1](02-mod-structure/01-five-layers.md).

### P: Why does `JsonFileLoader<T>.JsonLoadFile()` not return my data?
**R:** `JsonLoadFile()` retorna `void`, no el objeto cargado. You must pre-allocate your object and pass it as a reference parameter: `ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`. Assigning the return value silently gives you `null`. Ver [Capitulo 6.8](06-engine-api/08-file-io.md).

### P: My RPC is sent but never received on the other side.
**R:** Check these common causes: (1) The RPC ID does not match between sender and receiver. (2) You are sending from client but listening on client (or server-to-server). (3) You forgot to register the RPC handler in `OnRPC()` or your custom handler. (4) The target entity is `null` or not network-synced. Ver [Capitulo 6.9](06-engine-api/09-networking.md) and [Chapter 7.3](07-patterns/03-rpc-patterns.md).

### P: I get "Error: Member already defined" in an else-if block.
**R:** Enforce Script does not allow variable redeclaration in sibling `else if` blocks within the same scope. Declare the variable once before the `if` chain, or use separate scopes with braces. Ver [Capitulo 1.12](01-enforce-script/12-gotchas.md).

### P: My UI layout shows nothing / widgets are invisible.
**R:** Common causes: (1) Widget has zero size — check that width/height are set correctly (no negative values). (2) The widget is not `Show(true)`. (3) Text color alpha is 0 (fully transparent). (4) The layout path in `CreateWidgets()` is wrong (no error is thrown, it just returns `null`). Ver [Capitulo 3.3](03-gui-system/03-sizing-positioning.md).

### P: My mod causes a crash on server startup.
**R:** Check for: (1) Calling client-only methods (`GetGame().GetPlayer()`, UI code) on the server. (2) `null` reference in `OnInit` or `OnMissionStart` before the world is ready. (3) Infinite recursion in a `modded class` override that forgot to call `super`. Always add guard clauses since there is no try/catch. Ver [Capitulo 1.11](01-enforce-script/11-error-handling.md).

### P: Backslash or quote characters in my strings cause parse errors.
**R:** Enforce Script's parser (CParser) does not support `\\` or `\"` escape sequences in string literals. Avoid backslashes entirely. For file paths, use forward slashes (`"my/path/file.json"`). For quotes in strings, use single-quote characters or string concatenation. Ver [Capitulo 1.12](01-enforce-script/12-gotchas.md).

---

## Decisiones de Arquitectura

### P: What is the 5-layer script hierarchy and why does it matter?
**R:** DayZ scripts compile in five numbered layers: `1_Core`, `2_GameLib`, `3_Game`, `4_World`, `5_Mission`. Each layer can only reference types from the same or lower-numbered layers. This enforces architectural boundaries — put shared enums and constants in `3_Game`, entity logic in `4_World`, and UI/mission hooks in `5_Mission`. Ver [Capitulo 2.1](02-mod-structure/01-five-layers.md).

### P: Should I use `modded class` or create new classes?
**R:** Use `modded class` when you need to change or extend existing vanilla behavior (adding a method to `PlayerBase`, hooking into `MissionServer`). Create new classes for self-contained systems that do not need to override anything. Modded classes chain automatically — always call `super` to avoid breaking other mods. Ver [Capitulo 1.4](01-enforce-script/04-modded-classes.md).

### P: How should I organize client vs. server code?
**R:** Use `#ifdef SERVER` and `#ifdef CLIENT` preprocessor guards for code that must only run on one side. For larger mods, split into separate PBOs: a client mod (UI, rendering, local effects) and a server mod (spawning, logic, persistence). This prevents leaking server logic to clients. Ver [Capitulo 2.5](02-mod-structure/05-file-organization.md) and [Chapter 6.9](06-engine-api/09-networking.md).

### P: When should I use a Singleton vs. a Module/Plugin?
**R:** Use a Module (registered with CF's `PluginManager` or your own module system) when you need lifecycle management (`OnInit`, `OnUpdate`, `OnMissionFinish`). Use a standalone Singleton for stateless utility services that just need global access. Modules are preferred for anything with state or cleanup needs. Ver [Capitulo 7.1](07-patterns/01-singletons.md) and [Chapter 7.2](07-patterns/02-module-systems.md).

### P: How do I safely store per-player data that survives server restarts?
**R:** Save JSON files to the server's `$profile:` directory using `JsonFileLoader`. Use the player's Steam UID (from `PlayerIdentity.GetId()`) as the filename. Load on player connect, save on disconnect and periodically. Always handle missing/corrupted files gracefully with guard clauses. Ver [Capitulo 7.4](07-patterns/04-config-persistence.md) and [Chapter 6.8](06-engine-api/08-file-io.md).

---

## Publicacion y Distribucion

### P: How do I pack my mod into a PBO?
**R:** Use Addon Builder (from DayZ Tools) or third-party tools like PBO Manager. Point it at your mod's source folder, set the correct prefix (matching your `config.cpp` addon prefix), and build. The output `.pbo` file goes into your mod's `Addons/` folder. Ver [Capitulo 4.6](04-file-formats/06-pbo-packing.md).

### P: How do I sign my mod for server use?
**R:** Generate a keypair with DayZ Tools' DSSignFile or DSCreateKey: this produces a `.biprivatekey` and `.bikey`. Sign each PBO with the private key (creates `.bisign` files next to each PBO). Distribute the `.bikey` to server admins for their `keys/` folder. Never share your `.biprivatekey`. Ver [Capitulo 4.6](04-file-formats/06-pbo-packing.md).

### P: How do I publish to the Steam Workshop?
**R:** Use the DayZ Tools Publisher or the Steam Workshop uploader. You need a `mod.cpp` file in your mod root defining the name, author, and description. The publisher uploads your packed PBOs, and Steam assigns a Workshop ID. Update by re-publishing from the same account. Ver [Capitulo 2.3](02-mod-structure/03-mod-cpp.md) and [Chapter 8.7](08-tutorials/07-publishing-workshop.md).

### P: Can my mod require other mods as dependencies?
**R:** Yes. In `config.cpp`, add the dependency mod's `CfgPatches` class name to your `requiredAddons[]` array. In `mod.cpp`, there is no formal dependency system — document required mods in your Workshop description. Players must subscribe to and load all required mods. Ver [Capitulo 2.2](02-mod-structure/02-config-cpp.md).

---

## Temas Avanzados

### P: How do I create custom player actions (interactions)?
**R:** Extend `ActionBase` (or a subclass like `ActionInteractBase`), define `CreateConditionComponents()` for preconditions, override `OnStart`/`OnExecute`/`OnEnd` for logic, and register it in `SetActions()` on the target entity. Actions support continuous (hold) and instant (click) modes. Ver [Capitulo 6.12](06-engine-api/12-action-system.md).

### P: How does the damage system work for custom items?
**R:** Define a `DamageSystem` class in your item's config.cpp with `DamageZones` (named regions) and `ArmorType` values. Each zone tracks its own health. Override `EEHitBy()` and `EEKilled()` in script for custom damage reactions. The engine maps model Fire Geometry components to zone names. Ver [Capitulo 6.1](06-engine-api/01-entity-system.md).

### P: How can I add custom keybindings to my mod?
**R:** Create an `inputs.xml` file defining your input actions with default key assignments. Register them in script via `GetUApi().RegisterInput()`. Query state with `GetUApi().GetInputByName("your_action").LocalPress()`. Add localized names in your `stringtable.csv`. Ver [Capitulo 5.2](05-config-files/02-inputs-xml.md) and [Chapter 6.13](06-engine-api/13-input-system.md).

### P: How do I make my mod compatible with other mods?
**R:** Follow these principles: (1) Always call `super` in modded class overrides. (2) Use unique class names with a mod prefix (e.g., `MyMod_Manager`). (3) Use unique RPC IDs. (4) Do not override vanilla methods without calling `super`. (5) Use `#ifdef` to detect optional dependencies. (6) Test with popular mod combinations (CF, Expansion, etc.). Ver [Capitulo 7.2](07-patterns/02-module-systems.md).

### P: How do I optimize my mod for server performance?
**R:** Key strategies: (1) Avoid per-frame (`OnUpdate`) logic — use timers or event-driven design. (2) Cache references instead of calling `GetGame().GetPlayer()` repeatedly. (3) Use `GetGame().IsServer()` / `GetGame().IsClient()` guards to skip unnecessary code. (4) Profile with `int start = TickCount(0);` benchmarks. (5) Limit network traffic — batch RPCs and use Net Sync Variables for frequent small updates. Ver [Capitulo 7.7](07-patterns/07-performance.md).

---

*Tienes una pregunta que no se cubre aqui? Abre un issue en el repositorio.*
