# 常见问题

[Home](../README.md) | **常见问题**

---

## 入门

### 问：开始DayZ Modding需要什么？
**答：** 你需要Steam、DayZ（零售版）、DayZ Tools（Steam工具区免费）和文本编辑器（推荐VS Code）。严格来说不需要编程经验 — start with [Chapter 8.1: Your First Mod](08-tutorials/01-first-mod.md). DayZ Tools包含Object Builder、Addon Builder、TexView2和Workbench IDE。

### 问：DayZ使用什么编程语言？
**答：** DayZ使用**Enforce Script**，这是Bohemia Interactive的专有语言。 它具有类似C#的C风格语法，但有自己的规则和限制（没有三元运算符、没有try/catch、没有lambda）。 参见[第 1: Enforce Script](01-enforce-script/01-variables-types.md) 获取完整的语言指南。

### 问：如何设置P:驱动器？
**答：** 从Steam打开DayZ Tools，点击 "Workdrive" or "Setup Workdrive" 来挂载P:驱动器。 这将创建一个指向你的Modding工作区的虚拟驱动器， 引擎 在开发期间在此查找源文件。 你也可以使用 `subst P: "C:\Your\Path"` 从命令行操作。 参见[第 4.5](04-file-formats/05-dayz-tools.md).

### 问：可以不用专用服务器测试Mod吗？
**答：** 可以。使用 `-filePatching` 参数和你的Mod加载启动DayZ。 快速测试请使用Listen Server（从游戏内菜单托管）。 生产测试时，请务必也在专用服务器上验证，因为某些代码路径不同。 参见[第 8.1](08-tutorials/01-first-mod.md).

### 问：在哪里可以找到原版DayZ脚本文件来学习？
**答：** 通过DayZ Tools挂载P:驱动器后，原版脚本位于 `P:\DZ\scripts\` 按层级组织 (`3_Game`, `4_World`, `5_Mission`). 这些是每个引擎类、方法和事件的权威参考。 另请参阅 [Cheat Sheet](cheatsheet.md) and [API Quick Reference](06-engine-api/quick-reference.md).

---

## 常见错误和修复

### 问：我的Mod加载了但什么都没发生。日志中没有错误。
**答：** 很可能你的 `config.cpp` 有一个不正确的 `requiredAddons[]` 条目，导致你的脚本加载太早或根本没有加载。 Verify that each addon name in `requiredAddons` matches an existing `CfgPatches` class name exactly (case-sensitive). Check the script log at `%localappdata%/DayZ/` for silent warnings. 参见[第 2.2](02-mod-structure/02-config-cpp.md).

### Q: I get "Cannot find variable" or "Undefined variable" errors.
**A:** This usually means you are referencing a class or variable from a higher script layer. Lower layers (`3_Game`) cannot see types defined in higher layers (`4_World`, `5_Mission`). Move your class definition to the correct layer, or use `typename` reflection for loose coupling. 参见[第 2.1](02-mod-structure/01-five-layers.md).

### Q: Why does `JsonFileLoader<T>.JsonLoadFile()` not return my data?
**A:** `JsonLoadFile()` returns `void`, not the loaded object. You must pre-allocate your object and pass it as a reference parameter: `ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`. Assigning the return value silently gives you `null`. 参见[第 6.8](06-engine-api/08-file-io.md).

### Q: My RPC is sent but never received on the other side.
**A:** Check these common causes: (1) The RPC ID does not match between sender and receiver. (2) You are sending from client but listening on client (or server-to-server). (3) You forgot to register the RPC handler in `OnRPC()` or your custom handler. (4) The target entity is `null` or not network-synced. 参见[第 6.9](06-engine-api/09-networking.md) and [Chapter 7.3](07-patterns/03-rpc-patterns.md).

### Q: I get "Error: Member already defined" in an else-if block.
**A:** Enforce Script does not allow variable redeclaration in sibling `else if` blocks within the same scope. Declare the variable once before the `if` chain, or use separate scopes with braces. 参见[第 1.12](01-enforce-script/12-gotchas.md).

### Q: My UI layout shows nothing / widgets are invisible.
**A:** Common causes: (1) Widget has zero size — check that width/height are set correctly (no negative values). (2) The widget is not `Show(true)`. (3) Text color alpha is 0 (fully transparent). (4) The layout path in `CreateWidgets()` is wrong (no error is thrown, it just returns `null`). 参见[第 3.3](03-gui-system/03-sizing-positioning.md).

### Q: My mod causes a crash on server startup.
**A:** Check for: (1) Calling client-only methods (`GetGame().GetPlayer()`, UI code) on the server. (2) `null` reference in `OnInit` or `OnMissionStart` before the world is ready. (3) Infinite recursion in a `modded class` override that forgot to call `super`. Always add guard clauses since there is no try/catch. 参见[第 1.11](01-enforce-script/11-error-handling.md).

### Q: Backslash or quote characters in my strings cause parse errors.
**A:** Enforce Script's parser (CParser) does not support `\\` or `\"` escape sequences in string literals. Avoid backslashes entirely. For file paths, use forward slashes (`"my/path/file.json"`). For quotes in strings, use single-quote characters or string concatenation. 参见[第 1.12](01-enforce-script/12-gotchas.md).

---

## 架构决策

### Q: What is the 5-layer script hierarchy and why does it matter?
**A:** DayZ scripts compile in five numbered layers: `1_Core`, `2_GameLib`, `3_Game`, `4_World`, `5_Mission`. Each layer can only reference types from the same or lower-numbered layers. This enforces architectural boundaries — put shared enums and constants in `3_Game`, entity logic in `4_World`, and UI/mission hooks in `5_Mission`. 参见[第 2.1](02-mod-structure/01-five-layers.md).

### Q: Should I use `modded class` or create new classes?
**A:** Use `modded class` when you need to change or extend existing vanilla behavior (adding a method to `PlayerBase`, hooking into `MissionServer`). Create new classes for self-contained systems that do not need to override anything. Modded classes chain automatically — always call `super` to avoid breaking other mods. 参见[第 1.4](01-enforce-script/04-modded-classes.md).

### Q: How should I organize client vs. server code?
**A:** Use `#ifdef SERVER` and `#ifdef CLIENT` preprocessor guards for code that must only run on one side. For larger mods, split into separate PBOs: a client mod (UI, rendering, local effects) and a server mod (spawning, logic, persistence). This prevents leaking server logic to clients. 参见[第 2.5](02-mod-structure/05-file-organization.md) and [Chapter 6.9](06-engine-api/09-networking.md).

### Q: When should I use a Singleton vs. a Module/Plugin?
**A:** Use a Module (registered with CF's `PluginManager` or your own module system) when you need lifecycle management (`OnInit`, `OnUpdate`, `OnMissionFinish`). Use a standalone Singleton for stateless utility services that just need global access. Modules are preferred for anything with state or cleanup needs. 参见[第 7.1](07-patterns/01-singletons.md) and [Chapter 7.2](07-patterns/02-module-systems.md).

### Q: How do I safely store per-player data that survives server restarts?
**A:** Save JSON files to the server's `$profile:` directory using `JsonFileLoader`. Use the player's Steam UID (from `PlayerIdentity.GetId()`) as the filename. Load on player connect, save on disconnect and periodically. Always handle missing/corrupted files gracefully with guard clauses. 参见[第 7.4](07-patterns/04-config-persistence.md) and [Chapter 6.8](06-engine-api/08-file-io.md).

---

## 发布和分发

### Q: How do I pack my mod into a PBO?
**A:** Use Addon Builder (from DayZ Tools) or third-party tools like PBO Manager. Point it at your mod's source folder, set the correct prefix (matching your `config.cpp` addon prefix), and build. The output `.pbo` file goes into your mod's `Addons/` folder. 参见[第 4.6](04-file-formats/06-pbo-packing.md).

### Q: How do I sign my mod for server use?
**A:** Generate a keypair with DayZ Tools' DSSignFile or DSCreateKey: this produces a `.biprivatekey` and `.bikey`. Sign each PBO with the private key (creates `.bisign` files next to each PBO). Distribute the `.bikey` to server admins for their `keys/` folder. Never share your `.biprivatekey`. 参见[第 4.6](04-file-formats/06-pbo-packing.md).

### Q: How do I publish to the Steam Workshop?
**A:** Use the DayZ Tools Publisher or the Steam Workshop uploader. You need a `mod.cpp` file in your mod root defining the name, author, and description. The publisher uploads your packed PBOs, and Steam assigns a Workshop ID. Update by re-publishing from the same account. 参见[第 2.3](02-mod-structure/03-mod-cpp.md) and [Chapter 8.7](08-tutorials/07-publishing-workshop.md).

### Q: Can my mod require other mods as dependencies?
**A:** Yes. In `config.cpp`, add the dependency mod's `CfgPatches` class name to your `requiredAddons[]` array. In `mod.cpp`, there is no formal dependency system — document required mods in your Workshop description. Players must subscribe to and load all required mods. 参见[第 2.2](02-mod-structure/02-config-cpp.md).

---

## 高级主题

### Q: How do I create custom player actions (interactions)?
**A:** Extend `ActionBase` (or a subclass like `ActionInteractBase`), define `CreateConditionComponents()` for preconditions, override `OnStart`/`OnExecute`/`OnEnd` for logic, and register it in `SetActions()` on the target entity. Actions support continuous (hold) and instant (click) modes. 参见[第 6.12](06-engine-api/12-action-system.md).

### Q: How does the damage system work for custom items?
**A:** Define a `DamageSystem` class in your item's config.cpp with `DamageZones` (named regions) and `ArmorType` values. Each zone tracks its own health. Override `EEHitBy()` and `EEKilled()` in script for custom damage reactions. The engine maps model Fire Geometry components to zone names. 参见[第 6.1](06-engine-api/01-entity-system.md).

### Q: How can I add custom keybindings to my mod?
**A:** Create an `inputs.xml` file defining your input actions with default key assignments. Register them in script via `GetUApi().RegisterInput()`. Query state with `GetUApi().GetInputByName("your_action").LocalPress()`. Add localized names in your `stringtable.csv`. 参见[第 5.2](05-config-files/02-inputs-xml.md) and [Chapter 6.13](06-engine-api/13-input-system.md).

### Q: How do I make my mod compatible with other mods?
**A:** Follow these principles: (1) Always call `super` in modded class overrides. (2) Use unique class names with a mod prefix (e.g., `MyMod_Manager`). (3) Use unique RPC IDs. (4) Do not override vanilla methods without calling `super`. (5) Use `#ifdef` to detect optional dependencies. (6) Test with popular mod combinations (CF, Expansion, etc.). 参见[第 7.2](07-patterns/02-module-systems.md).

### Q: How do I optimize my mod for server performance?
**A:** Key strategies: (1) Avoid per-frame (`OnUpdate`) logic — use timers or event-driven design. (2) Cache references instead of calling `GetGame().GetPlayer()` repeatedly. (3) Use `GetGame().IsServer()` / `GetGame().IsClient()` guards to skip unnecessary code. (4) Profile with `int start = TickCount(0);` benchmarks. (5) Limit network traffic — batch RPCs and use Net Sync Variables for frequent small updates. 参见[第 7.7](07-patterns/07-performance.md).

---

*有未涵盖的问题？请在仓库中创建 issue。*
