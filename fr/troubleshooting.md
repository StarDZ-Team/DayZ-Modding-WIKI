# Troubleshooting Guide

[Home](./README.md) | **Troubleshooting Guide**

---

> Quand quelque chose ne fonctionne pas, commencez ici. Ce guide est organise par **ce que vous voyez** (le symptome), pas par systeme. Trouvez votre probleme, lisez la cause, appliquez la correction.

---

## Table des Matieres

1. [Mod Won't Load](#1-mod-wont-load)
2. [Script Errors](#2-script-errors)
3. [RPC and Network Issues](#3-rpc-and-network-issues)
4. [UI Problems](#4-ui-problems)
5. [Build and PBO Issues](#5-build-and-pbo-issues)
6. [Performance Issues](#6-performance-issues)
7. [Item, Vehicle, and Entity Issues](#7-item-vehicle-and-entity-issues)
8. [Config and Types Issues](#8-config-and-types-issues)
9. [Persistence Issues](#9-persistence-issues)
10. [Decision Flowcharts](#10-decision-flowcharts)
11. [Debug Commands Quick Reference](#11-debug-commands-quick-reference)
12. [Log File Locations](#12-log-file-locations)
13. [Where to Get Help](#13-where-to-get-help)

---

## 1. Mod Won't Load

These are problems where the mod does not appear, does not activate, or is rejected by the game at startup.

| Symptome | Cause | Correction |
|---------|-------|-----|
| "Addon requires addon X" error at startup | Missing or incorrect `requiredAddons[]` entry | Add the exact `CfgPatches` class name of the dependency to your `requiredAddons[]`. Names are case-sensitive. Voir [Chapitre 2.2](02-mod-structure/02-config-cpp.md). |
| Mod not visible in launcher | `mod.cpp` file is missing or has syntax errors | Create or fix `mod.cpp` in your mod root. It must contain `name`, `author`, and `dir` fields. Voir [Chapitre 2.3](02-mod-structure/03-mod-cpp.md). |
| "Config parse error" on startup | Syntax error in `config.cpp` | Check for missing semicolons after class closings (`};`), unclosed braces, or unbalanced quotes. Every class body ends with `};`, every property ends with `;`. |
| No script log entries at all | `CfgMods` `defs` block points to wrong path | Verify that your `config.cpp` `CfgMods` entry has the correct `dir` and that the script defs file matches your folder structure. The engine silently ignores wrong paths. |
| Mod loads but nothing happens | Scripts compile but never execute | Check that your mod has an entry point: a `modded class MissionServer` or `MissionGameplay`, a registered module, or a plugin. Scripts do not run by themselves. Voir [Chapitre 7.2](07-patterns/02-module-systems.md). |
| "Cannot register cfg class X" | Duplicate `CfgPatches` class name | Another mod already uses that class name. Rename your `CfgPatches` class to something unique with your mod prefix. |
| Mod loads only in singleplayer | Server does not have the mod installed | Ensure the server's `-mod=` launch parameter includes your mod path, and the PBO is in the server's `@YourMod/Addons/` folder. |
| "Addon X is not signed" | Server requires signed addons | Sign your PBOs with your private key and provide the `.bikey` to the server's `keys/` folder. Voir [Chapitre 4.6](04-file-formats/06-pbo-packing.md). |

---

## 2. Script Errors

These appear in the script log as `SCRIPT (E):` or `SCRIPT ERROR:` lines.

| Symptome | Cause | Correction |
|---------|-------|-----|
| `Null pointer access` | Accessing a variable that is `null` | Add a null check before using the variable: `if (myVar) { myVar.DoSomething(); }`. C'est l'erreur d'execution la plus courante. |
| `Cannot convert type 'X' to type 'Y'` | Direct cast between incompatible types | Use `Class.CastTo()` for safe downcasting: `Class.CastTo(result, source);`. Never assume a cast will succeed. Voir [Chapitre 1.9](01-enforce-script/09-casting-reflection.md). |
| `Undefined variable 'X'` | Typo, wrong scope, or wrong layer | Check spelling first. If the variable is a class from another file, ensure it is defined in the same or lower layer. `3_Game` cannot see `4_World` types. Voir [Chapitre 2.1](02-mod-structure/01-five-layers.md). |
| `Method 'X' not found` | Calling a method that does not exist on that class | Verify the method name and check the parent class. You may need to cast to a more specific type first. Check vanilla scripts at `P:\DZ\scripts\` for the correct API. |
| `Division by zero` | Dividing by a variable that equals `0` | Add a guard: `if (divisor != 0) result = value / divisor;`. This also applies to modulo (`%`) operations. |
| `Redeclaration of variable 'X'` | Same variable name declared in sibling `else if` blocks | Declare the variable once before the `if`/`else` chain, then assign inside each branch. Voir [Chapitre 1.12](01-enforce-script/12-gotchas.md). |
| `Member already defined` | Duplicate variable or method name in a class | Check for copy/paste errors. Each member name must be unique within a class hierarchy (including parent classes). |
| `Cannot create instance of type 'X'` | Trying to `new` an abstract class or an interface | Check that the class is not abstract (no `proto` methods without bodies). Instantiate a concrete subclass instead. |
| `Stack overflow` | Infinite recursion | A method calls itself without a base case, or a `modded class` override does not properly guard against re-entry. Add a depth check or fix the recursive call. |
| `Index out of range` | Array access with invalid index | Always check `array.Count()` or use `array.IsValidIndex(idx)` before accessing by index. |
| `String conversion error` | Using `string.ToInt()` or `string.ToFloat()` on non-numeric text | Validate string content before conversion. There is no try/catch, so you must guard manually. |
| `Error: Serializer X mismatch` | Read/write order does not match in serialization | Ensure `OnStoreSave()` and `OnStoreLoad()` write and read the same types in the same order, including version checks. |
| Syntax error with no clear message | Backslash `\` or escaped quote `\"` in string literal | Enforce Script's CParser does not support `\\` or `\"`. Use forward slashes for paths (`"my/path/file"`). For quotes, use single-quote characters. Voir [Chapitre 1.12](01-enforce-script/12-gotchas.md). |
| `JsonFileLoader` returns null data | Assigning the return value of `JsonLoadFile()` | `JsonLoadFile()` returns `void`. Pre-allocate the object and pass it by reference: `ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`. Voir [Chapitre 6.8](06-engine-api/08-file-io.md). |
| `Object.IsAlive()` does not exist | Calling `IsAlive()` on base `Object` | `IsAlive()` is only on `EntityAI`. Cast first: `EntityAI entity; if (Class.CastTo(entity, obj) && entity.IsAlive()) { ... }` |
| No ternary operator support | Using `condition ? a : b` syntax | Enforce Script has no ternary operator. Use an `if`/`else` block instead. Voir [Chapitre 1.12](01-enforce-script/12-gotchas.md). |
| `do...while` loop error | Using `do { } while(cond)` | Enforce Script does not support `do...while`. Use a `while` loop with a `break` condition instead. Voir [Chapitre 1.12](01-enforce-script/12-gotchas.md). |
| Multiline method call fails | Splitting a single method call across lines incorrectly | Avoid splitting chained calls with comments or preprocessor directives between lines. Keep method call chains on one line or use intermediate variables. |

---

## 3. RPC and Network Issues

Problems with Remote Procedure Calls and client-server communication.

| Symptome | Cause | Correction |
|---------|-------|-----|
| RPC sent but never received | Registration mismatch | Both sender and receiver must register the same RPC ID. Verify the ID matches exactly on both client and server. Voir [Chapitre 6.9](06-engine-api/09-networking.md). |
| RPC received but data is corrupted | Read/write parameter mismatch | The sender's `Write()` calls and receiver's `Read()` calls must have the same types in the same order. A single mismatch corrupts all subsequent reads. |
| RPC crashes the server | Null entity target or wrong parameter types | Ensure the target entity exists on both sides. Never send `null` as the RPC target. Validate all read parameters before use. |
| Data not syncing to clients | Missing `SetSynchDirty()` | After changing any variable registered for synchronization, call `SetSynchDirty()` on the entity. Without it, the engine does not broadcast changes. |
| Works in singleplayer / listen server, fails on dedicated | Different code paths for listen vs. dedicated | On a listen server, both client and server run in the same process, hiding timing and null issues. Always test on a dedicated server. Check `GetGame().IsServer()` and `GetGame().IsMultiplayer()` guards. |
| RPC floods and server lag | Sending RPCs every frame or in tight loops | Throttle RPC calls with timers or accumulators. Batch multiple small updates into a single RPC. Use Net Sync Variables for data that changes frequently. |
| Client receives RPC meant for all clients | Using `RPCSingleParam` with wrong target | Use `null` as the identity parameter to broadcast, or provide a specific `PlayerIdentity` to send to one client. |
| `OnRPC()` never called | Override is in the wrong class or layer | `OnRPC()` must be overridden on the entity that receives the RPC. If overriding on `PlayerBase`, ensure you call `super.OnRPC()` so other mods still work. |
| Net Sync Variables not updating on client | Missing `RegisterNetSyncVariable*()` or wrong type | Register each variable in the constructor with the correct method (`RegisterNetSyncVariableInt`, `RegisterNetSyncVariableFloat`, `RegisterNetSyncVariableBool`). Override `OnVariablesSynchronized()` to react to changes on the client side. |
| RPC works for host but not other players | Using player object reference instead of identity | On dedicated servers, the host player is not special. Ensure you are using `PlayerIdentity` for targeting and not relying on local player references that only exist on the sender's machine. |

---

## 4. UI Problems

Issues with GUI layouts, widgets, menus, and input.

| Symptome | Cause | Correction |
|---------|-------|-----|
| Layout loads but nothing is visible | Widget size is zero | Check `hexactsize` and `vexactsize` values. Both must be greater than zero. Do not use negative sizes. Voir [Chapitre 3.3](03-gui-system/03-sizing-positioning.md). |
| `CreateWidgets()` returns null | Layout file path is wrong or file is missing | Verify the `.layout` file path is correct (forward slashes, no typos). The engine returns `null` silently on bad paths, no error is logged. |
| Widgets exist but cannot be clicked | Another widget is covering the button | Check widget `priority` (z-order). Higher priority widgets render on top and capture input first. Also check that the button has `ButtonWidget` as its `ScriptClass` or is a `ButtonWidget` type. |
| Game input is stuck / cannot move after closing UI | `ChangeGameFocus()` calls are imbalanced | Every `GetGame().GetInput().ChangeGameFocus(1)` must be paired with `ChangeGameFocus(-1)`. Track your focus changes and ensure cleanup happens even if the UI is force-closed. |
| Text shows `#STR_some_key` literally | Stringtable entry is missing or file is not loaded | Add the key to your `stringtable.csv`. Check that the CSV is in your mod root and has the correct `Language,Key,Original` header format. Voir [Chapitre 5.2](05-config-files/02-inputs-xml.md). |
| Mouse cursor does not appear | `ShowUICursor()` not called | Call `GetGame().GetUIManager().ShowUICursor(true)` when opening your UI. Call it with `false` when closing. |
| UI flickers or renders behind game world | Layout is not attached to correct parent widget | Attach your layout to a proper parent. For fullscreen overlays, use `GetGame().GetWorkspace()` as the parent. |
| ScrollWidget content does not scroll | Content is not inside a WrapSpacer or child widget | ScrollWidget needs a single child (usually a `WrapSpacer` or `FrameWidget`) that is larger than the scroll area. Put your content widgets inside that child. Voir [Chapitre 3.3](03-gui-system/03-sizing-positioning.md). |
| Image or icon not showing | Path uses backslashes or wrong extension | Use forward slashes in image paths. Verify the file exists and is in a recognized format (`.paa`, `.edds`). Use `ImageWidget` for images, not `TextWidget`. |
| Slider does not respond to input | Missing script handler or wrong widget type | Ensure the slider widget has a `ScriptClass` assigned and that your handler processes `OnChange` events. Initialize the slider range in script. |
| UI looks different at other resolutions | Using hardcoded pixel values | Use proportional sizing (`halign`, `valign`, `hfill`, `vfill`) instead of fixed pixel values. Test at multiple resolutions. Voir [Chapitre 3.3](03-gui-system/03-sizing-positioning.md). |

---

## 5. Build and PBO Issues

Problems with packing, binarizing, and deploying mods.

| Symptome | Cause | Correction |
|---------|-------|-----|
| "Include file not found" during binarize | Config references a file that does not exist | Check that all `#include` paths in model configs and rvmats are correct. Ensure the P: drive is mounted and source files are accessible. |
| PBO builds successfully but mod crashes on load | `config.cpp` binarization error | Try building with binarization disabled to isolate the issue. If it works unbinarized, the problem is in a config that the binarizer rejects silently. |
| "Signature check failed" on server connect | PBO is unsigned or signed with wrong key | Re-sign the PBO with your private key using DSSignFile. Ensure the server has the matching `.bikey` in its `keys/` folder. |
| File patching changes not taking effect | Not using the diagnostic executable | File patching only works with `DayZDiag_x64.exe`, not the retail `DayZ_x64.exe`. Launch with `-filePatching` parameter. |
| "Prefix mismatch" warning | PBO prefix does not match `config.cpp` | Ensure the `$PBOPREFIX$` file content matches the addon prefix defined in your `config.cpp` `CfgPatches`. |
| Addon Builder fails silently | Path contains special characters or spaces | Move your project to a path without spaces or special characters. Use short folder names. |
| Binarized model looks wrong in-game | LOD or geometry issues in P3D | Check model LODs in Object Builder. Ensure the Fire Geometry and View Geometry LODs are correct. Rebuild the model. |
| Old version of mod loads despite changes | Cached PBO or workshop version overriding | Delete the old PBO. Check that the game is not loading a cached workshop version. Verify the `-mod=` path points to your development folder, not the workshop folder. |
| Addon Builder reports "no entry" warnings | Config references a property that does not exist | These warnings are usually non-fatal. Check that all `CfgVehicles` base classes exist. Missing entries in inherited configs cause cascading warnings. |
| PBO packing includes unwanted files | No `.pboignore` or filter set | Addon Builder packs everything in the source folder. Use a `.pboignore` file or explicitly exclude file types (`.psd`, `.blend`, `.bak`) in the builder settings. |

---

## 6. Performance Issues

Server or client FPS drops, memory problems, and slow operations.

| Symptome | Cause | Correction |
|---------|-------|-----|
| Low server FPS (below 20) | Heavy processing in `OnUpdate()` or per-frame methods | Use a delta-time accumulator to throttle work: only execute logic every N seconds. Move expensive operations to timers or scheduled callbacks. Voir [Chapitre 7.7](07-patterns/07-performance.md). |
| Memory grows over time (memory leak) | `ref` reference cycles preventing garbage collection | When two objects hold `ref` references to each other, neither is ever freed. Make one side a raw (non-`ref`) reference. Break cycles in cleanup methods. Voir [Chapitre 1.8](01-enforce-script/08-memory-management.md). |
| Slow server startup | Heavy initialization in `OnInit` | Defer non-critical initialization with `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater()`. Load configs lazily on first use instead of all at startup. |
| Client FPS drops near specific objects | Complex model with too many polygons or bad LODs | Add proper LOD levels to your model. The engine uses LODs to reduce poly count at distance. Ensure LOD transitions are smooth. |
| Stutter every few seconds | Periodic garbage collection spikes | Reduce object churn. Reuse objects via pooling instead of constantly creating and destroying them. Pre-allocate arrays. |
| Network lag spikes | Too many RPCs or large RPC payloads | Batch small updates into fewer RPCs. Use Net Sync Variables for frequently changing values. Compress data where possible. |
| Log file growing very large | Excessive `Print()` or debug logging | Remove or guard debug `Print()` calls behind `#ifdef DEVELOPER` or a debug flag. Large log files can slow disk I/O. |
| High entity count causing server lag | Too many spawned entities in the world | Reduce `nominal` values in `types.xml`. Clean up dynamic objects with lifetime management. Limit AI spawn density. |

---

## 7. Item, Vehicle, and Entity Issues

Problems with custom items, vehicles, and world entities.

| Symptome | Cause | Correction |
|---------|-------|-----|
| Item will not spawn (admin tools say "cannot create") | `scope=0` in config or missing from `types.xml` | Set `scope=2` in your item's `CfgVehicles` config for items that should be spawnable. Add an entry to your server's `types.xml` if the item should appear in loot. |
| Item spawns but is invisible | Model path (`.p3d`) is wrong or missing | Check the `model` path in your `CfgVehicles` class. Use forward slashes. Verify the `.p3d` file exists and is packed in your PBO. |
| Item has no inventory icon | Missing or wrong `inventorySlot` or icon config | Define the `picture` path in your config pointing to a valid `.paa` or `.edds` icon file. Check `rotationFlags` for correct icon orientation. |
| Vehicle spawns but will not drive | Missing engine, wheels, or parts | Ensure all required parts are attached. Use `OnDebugSpawn()` to spawn a fully assembled vehicle for testing. Check that simulation type is correct in config. |
| Item cannot be picked up | Incorrect geometry or wrong `inventorySlot` | Verify the item has proper Fire Geometry in the model. Check that the `itemSize[]` is set correctly and the item fits in available inventory slots. |
| Entity immediately deleted after spawn | `lifetime` is zero in `types.xml` or scope issue | Set appropriate `lifetime` value in `types.xml`. Ensure `scope=2` in config. Check server cleanup settings in `globals.xml`. |
| Custom animal/zombie does not move | AI config missing or broken | Verify `AIAgentType` in config. Check that the entity has proper NavMesh-compatible geometry. Test with vanilla AI configs first. |
| Attachments do not snap to item | Wrong `inventorySlot` names | Attachment slot names must match exactly between the parent item's `attachments[]` and the child item's `inventorySlot[]`. Names are case-sensitive. |
| Item damage zones not working | `DamageSystem` config mismatch with model | Each `DamageZone` name must match a named selection in the model's Fire Geometry LOD. Check with Object Builder. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md). |
| Custom sound does not play | Sound shader or config path wrong | Verify the sound shader class name in `CfgSoundShaders` and `CfgSoundSets`. Check that the `.ogg` file path is correct and the file is packed in the PBO. |
| Item has wrong weight or size | `weight` and `itemSize[]` config values | `weight` is in grams (integer). `itemSize[]` defines the inventory grid slots as `{width, height}`. Check parent class values if inheriting. |
| Crafting recipe not appearing | Recipe config or condition wrong | Check `CfgRecipes` registration. Verify both ingredient items have correct `canBeSplit`, `isMeleeWeapon`, or other required properties. Test with vanilla recipe configs as reference. |

---

## 8. Config and Types Issues

Problems with `config.cpp`, `types.xml`, and other configuration files.

| Symptome | Cause | Correction |
|---------|-------|-----|
| Config values not taking effect | Using binarized config but editing source | Rebuild your PBO after config changes. If using file patching, ensure `DayZDiag_x64.exe` and `-filePatching` are active. |
| `types.xml` changes ignored | Editing the wrong `types.xml` file | The server loads types from `mpmissions/your_mission/db/types.xml`. Editing a types file elsewhere has no effect. Check the server's active mission folder. |
| "Error loading types" on server start | XML syntax error in `types.xml` | Validate your XML. Common issues: unclosed tags, missing quotes on attribute values, or `&` instead of `&amp;`. Use an XML validator. |
| Items spawn with wrong quantities | `quantmin`/`quantmax` values incorrect | Values are percentages (0-100) in `types.xml`, not absolute counts. `-1` means "use default". |
| Loot table not spawning items | `nominal` is 0 or missing `category`/`usage`/`tag` | Set `nominal` above 0. Add at least one `<usage>` and `<category>` tag so the Central Economy knows where to spawn items. |
| JSON config file not loading | Malformed JSON or wrong path | Validate JSON syntax (no trailing commas, proper quoting). Use `$profile:` prefix for server profile paths. Check that the file exists with `FileExist()`. |
| `cfgGameplay.json` changes ignored | File not enabled or wrong location | Place the file in the mission folder. Set `enableCustomGameplay` to `1` in `serverDZ.cfg`. Restart the server (not just reload). |
| Class inheritance not working in config | `baseClass` misspelled or not loaded | The parent class must exist in the same or earlier addon. Check that `requiredAddons[]` includes the addon defining the parent class. |

---

## 9. Persistence Issues

Problems with data saving and loading across server restarts.

| Symptome | Cause | Correction |
|---------|-------|-----|
| Player data lost on restart | Not saving to `$profile:` directory | Use `JsonFileLoader<T>.JsonSaveFile()` with a `$profile:` path. Save on player disconnect (`PlayerDisconnected`) and periodically during gameplay. |
| Saved file is empty or corrupt | Crash during write, or serialization error | Write to a temporary file first, then rename to the final path. Validate data before saving. Always handle `FileExist()` checks on load. |
| `OnStoreSave`/`OnStoreLoad` mismatch | Version changed but no migration | Always write a version number first. On load, read the version and handle old formats: `if (version < CURRENT) { /* read old format */ }`. |
| Items disappear from storage | `lifetime` expired in `types.xml` | Increase `lifetime` for persistent items. Default is often too short for base-building containers. Check `globals.xml` `cleanupLifetimeRuin` value. |
| Custom variables reset on relog | Variables not synced or stored | Register variables for network sync with `RegisterNetSyncVariable*()`. For persistence, save/load in `OnStoreSave()`/`OnStoreLoad()`. |

---

## 10. Decision Flowcharts

Step-by-step diagnostic processes for common "it doesn't work" situations.

### "My mod doesn't work at all"

1. **Check the script log** for `SCRIPT (E)` errors. Fix the first error you find. (Section 2)
2. **Is the mod listed in the launcher?** If not, check that `mod.cpp` exists and is valid. (Section 1)
3. **Does the log mention your CfgPatches class?** If not, check `config.cpp` syntax, `requiredAddons[]`, and the `-mod=` launch parameter.
4. **Do scripts compile?** Look for compile errors in the RPT. Fix any syntax errors. (Section 2)
5. **Is there an entry point?** You need a `modded class MissionServer`/`MissionGameplay`, a registered module, or a plugin. Scripts without an entry point never run.
6. **Still nothing?** Add `Print("MY_MOD: Init reached");` at your entry point to confirm execution.

### "Works offline but not on a dedicated server"

1. **Is the mod installed on the server?** Check that `-mod=` includes your mod path and the PBO is in `@YourMod/Addons/`.
2. **Client-only code on server?** `GetGame().GetPlayer()` returns `null` during server init. Add `GetGame().IsServer()` / `GetGame().IsClient()` guards.
3. **RPCs working?** Add `Print()` on both send and receive sides. Check that RPC IDs match and target entity exists on both sides. (Section 3)
4. **Data syncing?** Verify `SetSynchDirty()` is called after changes. Check read/write parameter order matches.
5. **Timing issues?** Listen servers hide race conditions because client and server share a process. Dedicated servers expose these. Add null checks and readiness guards.

### "My UI is broken"

1. **Does `CreateWidgets()` return null?** The layout path is wrong or the file is missing. Check forward slashes, verify the `.layout` is packed in the PBO.
2. **Widgets exist but invisible?** Check sizes (must be > 0, no negative values). Check `Show(true)` is called. Check text/widget alpha is not 0.
3. **Visible but not clickable?** Check widget `priority` (z-order). Verify `ScriptClass` is assigned. Confirm the handler is set.
4. **Input stuck after closing UI?** `ChangeGameFocus()` calls are imbalanced. Every `ChangeGameFocus(1)` needs a matching `ChangeGameFocus(-1)`. Check cleanup runs even on force-close.

---

## 11. Debug Commands Quick Reference

Use these in the DayZDiag debug console or admin tools.

| Action | Command |
|--------|---------|
| Spawn item on ground | `GetGame().CreateObject("AKM", GetGame().GetPlayer().GetPosition());` |
| Spawn vehicle (assembled) | `EntityAI car = EntityAI.Cast(GetGame().CreateObject("OffroadHatchback", GetGame().GetPlayer().GetPosition())); if (car) car.OnDebugSpawn();` |
| Spawn zombie | `GetGame().CreateObject("ZmbM_Normal_00", GetGame().GetPlayer().GetPosition());` |
| Teleport to coords | `GetGame().GetPlayer().SetPosition("6543 0 2114".ToVector());` |
| Heal fully | `GetGame().GetPlayer().SetHealth("", "", 5000);` |
| Full blood | `GetGame().GetPlayer().SetHealth("", "Blood", 5000);` |
| Stop unconscious | `GetGame().GetPlayer().SetHealth("", "Shock", 0);` |
| Set noon | `GetGame().GetWorld().SetDate(2024, 9, 15, 12, 0);` |
| Set night | `GetGame().GetWorld().SetDate(2024, 9, 15, 2, 0);` |
| Clear weather | `GetGame().GetWeather().GetOvercast().Set(0,0,0); GetGame().GetWeather().GetRain().Set(0,0,0);` |
| Heavy rain | `GetGame().GetWeather().GetOvercast().Set(1,0,0); GetGame().GetWeather().GetRain().Set(1,0,0);` |
| Print position | `Print(GetGame().GetPlayer().GetPosition());` |
| Check server/client | `Print("IsServer: " + GetGame().IsServer().ToString());` |
| Print FPS | `Print("FPS: " + (1.0 / GetGame().GetDeltaT()).ToString());` |

**Common Chernarus locations:** Elektro `"10570 0 2354"`, Cherno `"6649 0 2594"`, NWAF `"4494 0 10365"`, Tisy `"1693 0 13575"`, Berezino `"12121 0 9216"`

### Launch Parameters

| Parametre | But |
|-----------|---------|
| `-filePatching` | Load unpacked files (requires DayZDiag) |
| `-scriptDebug=true` | Enable script debug features |
| `-doLogs` | Enable detailed logging |
| `-adminLog` | Enable admin log on server |
| `-freezeCheck` | Detect and log script freezes |
| `-noSound` | Disable sound (faster testing) |
| `-noPause` | Server does not pause when empty |
| `-profiles=<path>` | Custom profile/log directory |
| `-connect=<ip>` | Auto-connect to server on launch |
| `-port=<port>` | Server port (default 2302) |
| `-mod=@Mod1;@Mod2` | Load mods (semicolon-separated) |
| `-serverMod=@Mod` | Server-only mods (not sent to clients) |

---

## 12. Log File Locations

Knowing where to look is half the battle.

### Client Logs

| Log | Emplacement | Contient |
|-----|----------|----------|
| Script log | `%localappdata%\DayZ\` (most recent `.RPT` file) | Script errors, warnings, `Print()` output |
| Crash dumps | `%localappdata%\DayZ\` (`.mdmp` files) | Crash analysis data |
| Workbench log | Workbench IDE output panel | Compile errors during development |

### Server Logs

| Log | Emplacement | Contient |
|-----|----------|----------|
| Script log | `<server_root>\profiles\` (most recent `.RPT` file) | Script errors, server-side `Print()` |
| Admin log | `<server_root>\profiles\` (`.ADM` file) | Player connections, kills, chat |
| Crash dumps | `<server_root>\profiles\` (`.mdmp` files) | Server crash data |
| Custom logs | `<server_root>\profiles\` | Any logs written with `FileHandle` |

### Reading Logs Effectively

- Search for `SCRIPT (E)` to find script errors
- Search for `SCRIPT ERROR` to find fatal script problems
- Search for your mod name or class names to filter relevant entries
- Errors often cascade -- fix the **first** error in the log, not the last
- Timestamp each log read: the most recent `.RPT` file has the latest session

---

## 13. Where to Get Help

When this guide does not solve your problem, these are the best resources.

### Community Resources

| Ressource | URL | Ideal Pour |
|----------|-----|----------|
| DayZ Modding Discord | `discord.gg/dayzmods` | Real-time help from experienced modders |
| Bohemia Interactive Forums | `forums.bohemia.net/forums/forum/231-dayz-modding/` | Official forums, announcements |
| DayZ Feedback Tracker | `feedback.bistudio.com/tag/dayz/` | Official bug reports |
| DayZ Workshop | Steam Workshop (DayZ) | Browse published mods for reference |
| Bohemia Wiki | `community.bistudio.com/wiki/DayZ:Modding_Basics` | Official modding basics |

### Reference Source Code

Study these mods to learn patterns from experienced modders:

| Mod | Ce qu'on Apprend |
|-----|---------------|
| **Community Framework (CF)** | Module lifecycle, RPC management, logging, managed pointers |
| **DayZ Expansion** | Large-scale mod architecture, market system, vehicles, parties |
| **Community Online Tools (COT)** | Admin tools, permissions, UI patterns, player management |
| **VPP Admin Tools** | Server administration, permissions, ESP, teleportation |
| **Dabs Framework** | MVC pattern, data binding, UI component framework |
| **BuilderItems** | Simple item mod structure (good starting example) |
| **BaseBuildingPlus** | Building system, placement mechanics, persistence |

### Vanilla Script Reference

The authoritative reference for all engine classes and methods:

- Mount P: drive via DayZ Tools
- Navigate to `P:\DZ\scripts\`
- Organized by layer: `3_Game/`, `4_World/`, `5_Mission/`
- Use your editor's search to find any vanilla class, method, or enum

### Quick Checklist Before Asking for Help

Before posting in a community forum or Discord, gather this information:

1. **What you expected** to happen
2. **What actually happened** (exact error messages, behavior)
3. **Script log excerpt** (the relevant `SCRIPT (E)` lines, not the entire log)
4. **Your code** (the relevant section, not the entire mod)
5. **What you already tried** (saves everyone time)
6. **DayZ version and mod list** (compatibility matters)
7. **Client or server** (specify which side has the problem)

---

## Quick Symptom Index

Cannot find your problem in the sections above? Try this alphabetical index.

| Symptom (what you see) | Go to |
|-------------------------|-------|
| Addon Builder fails | [Section 5](#5-build-and-pbo-issues) |
| Array index out of range | [Section 2](#2-script-errors) |
| Buttons not clickable | [Section 4](#4-ui-problems) |
| Cannot convert type | [Section 2](#2-script-errors) |
| Cannot create instance | [Section 2](#2-script-errors) |
| Config parse error | [Section 1](#1-mod-wont-load) |
| Cursor missing | [Section 4](#4-ui-problems) |
| Division by zero | [Section 2](#2-script-errors) |
| Data lost on restart | [Section 9](#9-persistence-issues) |
| Entity deleted after spawn | [Section 7](#7-item-vehicle-and-entity-issues) |
| File patching not working | [Section 5](#5-build-and-pbo-issues) |
| FPS drops | [Section 6](#6-performance-issues) |
| Game input stuck | [Section 4](#4-ui-problems) |
| Image not showing | [Section 4](#4-ui-problems) |
| Item invisible | [Section 7](#7-item-vehicle-and-entity-issues) |
| Item won't spawn | [Section 7](#7-item-vehicle-and-entity-issues) |
| JSON not loading | [Section 8](#8-config-and-types-issues) |
| Layout returns null | [Section 4](#4-ui-problems) |
| Loot not spawning | [Section 8](#8-config-and-types-issues) |
| Member already defined | [Section 2](#2-script-errors) |
| Memory leak | [Section 6](#6-performance-issues) |
| Method not found | [Section 2](#2-script-errors) |
| Mod not in launcher | [Section 1](#1-mod-wont-load) |
| Null pointer access | [Section 2](#2-script-errors) |
| Player data lost | [Section 9](#9-persistence-issues) |
| PBO signature failed | [Section 5](#5-build-and-pbo-issues) |
| Prefix mismatch | [Section 5](#5-build-and-pbo-issues) |
| RPC not received | [Section 3](#3-rpc-and-network-issues) |
| Scroll not working | [Section 4](#4-ui-problems) |
| Save file corrupt | [Section 9](#9-persistence-issues) |
| Server crash on startup | [Section 2](#2-script-errors) |
| Slider not responding | [Section 4](#4-ui-problems) |
| Stack overflow | [Section 2](#2-script-errors) |
| Text shows STR key | [Section 4](#4-ui-problems) |
| Types.xml ignored | [Section 8](#8-config-and-types-issues) |
| Undefined variable | [Section 2](#2-script-errors) |
| Variable redeclaration | [Section 2](#2-script-errors) |
| Vehicle won't drive | [Section 7](#7-item-vehicle-and-entity-issues) |
| Widget invisible | [Section 4](#4-ui-problems) |
| Works offline fails online | [Section 3](#3-rpc-and-network-issues) |

---

*Probleme toujours non resolu ? Check the [FAQ](faq.md) for additional answers, the [Cheat Sheet](cheatsheet.md) for syntax reference, or ask in the DayZ Modding Discord.*
