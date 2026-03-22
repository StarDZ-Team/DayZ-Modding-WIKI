# Chapter 8.6: Debugging & Testing Your Mod

[Home](../README.md) | [<< Previous: Using the DayZ Mod Template](05-mod-template.md) | **Debugging & Testing** | [Next: Publishing to the Steam Workshop >>](07-publishing-workshop.md)

---

## Содержание

- [Introduction](#introduction)
- [The Script Log -- Your Best Friend](#the-script-log----your-best-friend)
- [Print Debugging (The Reliable Method)](#print-debugging-the-reliable-method)
- [DayZDiag -- The Debug Executable](#dayzdiag----the-debug-executable)
- [File Patching -- Edit Without Rebuilding](#file-patching----edit-without-rebuilding)
- [Workbench -- Script Editor and Debugger](#workbench----script-editor-and-debugger)
- [Common Error Patterns and Solutions](#common-error-patterns-and-solutions)
- [Testing Workflow](#testing-workflow)
- [In-Game Debug Tools](#in-game-debug-tools)
- [Pre-Release Checklist](#pre-release-checklist)
- [Common Mistakes](#common-mistakes)
- [Next Steps](#next-steps)

---

## Введение

Unlike Unity or Unreal, the retail DayZ executable does not support attaching a debugger to Enforce Script. Instead, you rely on five tools:

1. **Script logs** -- Text files capturing every error, warning, and Print output
2. **Print statements** -- Trace execution flow and inspect variable values
3. **DayZDiag** -- Diagnostic build with enhanced error reporting and debug tools
4. **File patching** -- Edit scripts without rebuilding your PBO every time
5. **Workbench** -- Official script editor with syntax checking and a script console

Together they form a powerful toolkit. This chapter teaches you how to use each one.

---

## The Script Log -- Your Best Friend

Every time DayZ runs, it writes a script log file. This file captures every script error, warning, and Print() output. When something goes wrong, the script log is the first place to look.

### Where to Find Script Logs

**Client logs:** `%LocalAppData%\DayZ\` (press `Win+R`, paste, Enter)

**Server logs:** Inside your server's profile folder (set via `-profiles=serverprofile`)

Files are named `script_YYYY-MM-DD_HH-MM-SS.log` ---  most recent timestamp is your latest session.

### What to Look For

Script logs contain thousands of lines. You need to know what to search for.

**Errors** are marked with `SCRIPT (E)`:

```
SCRIPT (E): MyMod/Scripts/4_World/MyManager.c :: OnInit -- Null pointer access
```

This is a hard error. Your code tried to do something invalid and DayZ stopped executing that code path. These must be fixed.

**Warnings** are marked with `SCRIPT (W)`:

```
SCRIPT (W): MyMod/Scripts/4_World/MyManager.c :: Load -- Cannot open file "$profile:MyMod/config.json"
```

Warnings do not crash your code, but they often indicate a problem that will cause issues later. Do not ignore them.

**Print output** appears as plain text without any prefix:

```
[MyMod] Manager initialized with 5 items
```

This is output from your own `Print()` calls. It is the primary way you will trace what your code is doing.

### How to Search Efficiently

Script logs can be tens of thousands of lines. Never read line by line -- search for your mod prefix or error markers:

```powershell
# PowerShell -- find all errors in the latest log
Select-String -Path "$env:LOCALAPPDATA\DayZ\script*.log" -Pattern "SCRIPT \(E\)" | Select-Object -Last 20

# PowerShell -- find all lines from your mod
Select-String -Path "$env:LOCALAPPDATA\DayZ\script*.log" -Pattern "MyMod" | Select-Object -Last 30
```

```cmd
:: Command Prompt alternative
findstr "SCRIPT (E)" "%LocalAppData%\DayZ\script_2026-03-21_14-30-05.log"
```

### Understanding Common Log Entries

| Log Entry | Meaning |
|-----------|---------|
| `SCRIPT (E): Cannot convert string to int` | Несоответствие типов -- passing or assigning the wrong type |
| `SCRIPT (E): Null pointer access in ... :: Update` | Calling a method on a NULL object (most common error) |
| `SCRIPT (E): Undefined variable 'manger'` | Typo in a variable name or wrong scope |
| `SCRIPT (E): Method 'GetHelth' not found in class 'EntityAI'` | Method does not exist -- check spelling and parent class |

### Real-Time Log Watching

Watch the log live in a separate PowerShell window while DayZ runs:

```powershell
# Tail the latest script log in real time
Get-ChildItem "$env:LOCALAPPDATA\DayZ\script*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object {
    Get-Content $_.FullName -Wait -Tail 50
}
```

Filter to only show errors and your mod output:

```powershell
Get-ChildItem "$env:LOCALAPPDATA\DayZ\script*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object {
    Get-Content $_.FullName -Wait -Tail 50 | Where-Object { $_ -match "SCRIPT \(E\)|SCRIPT \(W\)|\[MyMod\]" }
}
```

---

## Print Debugging (The Reliable Method)

When you need to know what your code is doing at runtime, `Print()` is your primary tool. It writes a line to the script log that you can read afterward or watch in real time.

### Basic Print Usage

```c
class MyManager
{
    void Init()
    {
        Print("[MyMod] MyManager.Init() called");

        int count = LoadItems();
        Print("[MyMod] Loaded " + count.ToString() + " items");
    }
}
```

This produces lines in the script log like:

```
[MyMod] MyManager.Init() called
[MyMod] Loaded 5 items
```

### Formatted Output

Use string concatenation to build informative messages with enough context to be useful on their own:

```c
void ProcessPlayer(PlayerBase player)
{
    if (!player)
    {
        Print("[MyMod] ProcessPlayer: player is NULL, aborting");
        return;
    }

    string name = player.GetIdentity().GetName();
    vector pos = player.GetPosition();
    Print("[MyMod] Processing: " + name + " at " + pos.ToString());
}
```

### Creating a Debug Logger

Instead of scattering raw `Print()` calls, create a toggleable logger:

```c
class MyModDebug
{
    static bool s_Enabled = true;

    static void Log(string msg)
    {
        if (s_Enabled)
            Print("[MyMod:DEBUG] " + msg);
    }

    static void Error(string msg)
    {
        // Errors always print regardless of debug flag
        Print("[MyMod:ERROR] " + msg);
    }
}
```

Use it throughout your code: `MyModDebug.Log("Player connected: " + name);`

### Using Preprocessor Defines for Debug-Only Code

Enforce Script supports `#ifdef` to include code only in development builds:

```c
void Update()
{
    #ifdef DEVELOPER
    Print("[MyMod] Update tick, active items: " + m_Items.Count().ToString());
    #endif

    // Normal code here...
}
```

`DEVELOPER` is set in DayZDiag and Workbench but not in retail DayZ. `DIAG_DEVELOPER` is another useful define available only in diagnostic builds. Code inside these guards has zero cost in release builds.

### Removing Debug Prints Before Release

If you do not use `#ifdef` guards, remove all `Print()` calls before publishing. Excessive output bloats logs, hurts server performance, and may expose internal information. A consistent prefix like `[MyMod:DEBUG]` makes them easy to find and remove.

---

## DayZDiag -- The Debug Executable

DayZDiag is a special diagnostic build of DayZ with features the retail version lacks.

### What Makes DayZDiag Different

| Feature | Retail DayZ | DayZDiag |
|---------|-------------|----------|
| File patching support | No | Yes |
| `DEVELOPER` define active | No | Yes |
| `DIAG_DEVELOPER` define active | No | Yes |
| Additional error detail in logs | Basic | Verbose |
| Admin console access | No | Yes |
| Консоль скриптов | No | Yes |
| Free camera | No | Yes |

### How to Get DayZDiag

DayZDiag is included with DayZ Tools (not a separate download). After installing DayZ Tools from Steam, find `DayZDiag_x64.exe` in:

```
C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\
```

### Launch Parameters

Create a batch file or shortcut with these parameters:

**Client (singleplayer with server):**

```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -profiles=clientprofile -server -port=2302
```

**Client (connect to separate server):**

```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -connect=127.0.0.1 -port=2302
```

**Dedicated server:**

```batch
DayZDiag_x64.exe -filePatching -server -mod=P:\MyMod -config=serverDZ.cfg -port=2302 -profiles=serverprofile
```

Key parameters:

| Parameter | Purpose |
|-----------|---------|
| `-filePatching` | Enable loading loose files from P: drive (see next section) |
| `-mod=P:\MyMod` | Load your mod from the P: drive |
| `-profiles=folder` | Set the profile folder for logs and configs |
| `-server` | Run as a local listen server (singleplayer testing) |
| `-connect=IP` | Connect to a server at the given IP |
| `-port=PORT` | Set the network port (default 2302) |

### When to Use DayZDiag vs Retail

- **During development:** Always use DayZDiag. It gives you file patching, better errors, and debug tools.
- **Before release:** Test with the retail DayZ executable to make sure everything works for players. Some behaviors differ between DayZDiag and retail (for example, `#ifdef DEVELOPER` code will not run in retail).

---

## File Patching -- Edit Without Rebuilding

File patching is the single biggest time-saver in DayZ modding. Without it, every script change requires: edit file, rebuild PBO, copy PBO, restart DayZ. With file patching, you can: edit file, restart the mission. That is it.

### Как это работает

When DayZ loads with the `-filePatching` parameter, it checks the P: drive for loose files before loading files from PBOs. If it finds a file on P: that matches a file in a PBO, the loose file takes priority.

Это означает:

1. Your mod is set up on P: drive (via `SetupWorkdrive.bat` or manual junction)
2. You launch DayZDiag with `-filePatching -mod=P:\MyMod`
3. DayZ loads your scripts from P: drive directly --- нетt from the PBO
4. You edit a `.c` file on P: drive, save it
5. You reconnect or restart the mission in-game
6. DayZ picks up your changed file immediately

No PBO rebuild needed. The edit-test cycle goes from minutes to seconds.

### Setting Up File Patching

1. Make sure your mod source is on the P: drive (from [Chapter 8.1](01-first-mod.md))
2. Launch: `DayZDiag_x64.exe -filePatching -mod=P:\MyMod -server -port=2302`
3. Edit a `.c` file, save, reconnect in-game --- выr changes are live

### What Works With File Patching

| File Type | File Patching Works? |
|-----------|---------------------|
| Script files (`.c`) | Yes |
| Файлы макетов (`.layout`) | Yes |
| Текстуры (`.edds`, `.paa`) | Yes |
| Sound files | Yes |
| `config.cpp` | **No** -- must rebuild PBO |
| `mod.cpp` | **No** -- must rebuild PBO |
| New files (not in PBO) | **No** -- must rebuild PBO to register them |

The key limitation: `config.cpp` changes always require a PBO rebuild. This includes adding new classes, changing `requiredAddons`, or modifying `CfgMods`. If you add a brand new `.c` file, you also need a PBO rebuild so that the `config.cpp` script loading knows about the new file.

### The File Patching Workflow

Here is the ideal development cycle:

```
1. Build your PBO once (to establish the file list in config.cpp)
2. Launch DayZDiag with -filePatching -mod=P:\MyMod
3. Edit a .c file on P: drive
4. Save the file
5. In-game: disconnect and reconnect (or restart mission)
6. Check the script log for your changes
7. Repeat from step 3
```

This loop can take under 30 seconds per iteration compared to several minutes when rebuilding PBOs every time.

---

## Workbench -- Script Editor and Debugger

Workbench is the official DayZ development environment included with DayZ Tools.

### Launching and Setup

1. Open **DayZ Tools** from Steam, click **Workbench**
2. Go to **File > Open Project** and point it to your mod's script directory on P: drive
3. Workbench indexes your `.c` files and provides syntax awareness

### Key Features

- **Syntax highlighting** -- Keywords, types, strings, and comments are color-coded
- **Автодополнение кода** -- Type a class name followed by a dot to see available methods
- **Error highlighting** -- Syntax errors are underlined in red before you run anything
- **Script Console** -- Run Enforce Script commands live:

```c
// Print the player's position
Print(GetGame().GetPlayer().GetPosition().ToString());

// Spawn an item at your position
GetGame().GetPlayer().SpawnEntityOnGroundPos("AKM", GetGame().GetPlayer().GetPosition());
```

### Ограничения

- **Not a full game environment:** Some APIs only work in the actual game, not in Workbench's simulation
- **Separate from game runtime:** You still need to save files and restart the mission to see changes in-game
- **Incomplete mod context:** Cross-mod references may show as errors even when they work in-game

---

## Common Error Patterns and Solutions

Reference tables of the most common errors and how to fix them. Закладка this section.

### Script Errors

| Error Message | Cause | Fix |
|---------------|-------|-----|
| `Null pointer access` | Calling a method on a variable that is NULL | Add a null check before use: `if (obj) { obj.DoThing(); }` |
| `Cannot convert X to Y` | Несоответствие типов in assignment or function call | Check the expected type. Use `Class.CastTo()` for safe casting. |
| `Undefined variable 'xyz'` | Typo in variable name or wrong scope | Check spelling. Make sure the variable is declared in the current scope. |
| `Method 'xyz' not found in class 'Abc'` | Calling a method that does not exist on that class | Check the class hierarchy. Look up the correct method name in the API. |
| `Division by zero` | Dividing by a variable that equals 0 | Add a guard: `if (divisor != 0) { result = value / divisor; }` |
| `Stack overflow` | Infinite recursion in your code | Check for methods calling themselves without a proper exit condition. |
| `Type 'MyClass' not found` | The file defining MyClass is not loaded or is in a higher script layer | Check config.cpp script loading order. Lower layers cannot see higher layers. |

### Config Errors

| Error Message | Cause | Fix |
|---------------|-------|-----|
| `Config parse error` | Missing semicolon, brace, or quote in config.cpp | Check config.cpp syntax carefully. Every property needs a semicolon. Every class needs opening and closing braces. |
| `Addon 'X' requires addon 'Y'` | Missing dependency in requiredAddons | Add the required addon to your `requiredAddons[]` array. |
| `Cannot find mod` | Mod folder name or path is wrong | Verify the `-mod=` parameter matches your mod folder name exactly. |

### Загрузка модов Errors

| Симптом | Причина | Исправление |
|---------|-------|-----|
| Mod does not appear in launcher | Missing or invalid `mod.cpp` | Check that `mod.cpp` exists in the mod root and has valid `name` and `dir` fields. |
| Scripts not executing | config.cpp not registering scripts | Verify `CfgMods` class in config.cpp has correct `Script` path pointing to your script config.cpp. |
| Mod loads but features missing | Script layer issue | Verify files are in correct layer folders (3_Game, 4_World, 5_Mission). |

### Runtime Issues

| Симптом | Причина | Исправление |
|---------|-------|-----|
| RPC not received on server | Wrong RPC registration or identity mismatch | Check that RPC is registered on both client and server. Verify the RPC ID matches. |
| RPC not received on client | Server not sending, or client not registered | Add Print() on server side to confirm send. Check client registration code. |
| UI not showing | Layout path wrong or parent widget is null | Verify the `.layout` file path is correct relative to the mod. Check that the parent widget exists. |
| JSON config not loading | File path wrong or JSON syntax error | Check the file path. Validate JSON syntax (no trailing commas, proper quoting). |
| Player data not saving | Profile folder permissions or path issue | Check that the `$profile:` path is accessible and the folder exists. |

### Null Pointers and Safe Casting -- Detailed Examples

These two errors are so common they deserve worked examples.

**Unsafe code (crashes if GetPlayer() or GetIdentity() returns NULL):**

```c
void DoSomething()
{
    PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
    string name = player.GetIdentity().GetName();  // crash if player or identity is NULL
}
```

**Safe code (guard every potential null):**

```c
void DoSomething()
{
    Man man = GetGame().GetPlayer();
    if (!man)
        return;

    PlayerBase player;
    if (!Class.CastTo(player, man))
        return;

    PlayerIdentity identity = player.GetIdentity();
    if (!identity)
        return;

    Print("[MyMod] Player: " + identity.GetName());
}
```

**Safe casting pattern with `Class.CastTo()`:**

```c
void ProcessEntity(Object obj)
{
    ItemBase item;
    if (Class.CastTo(item, obj))
    {
        item.SetQuantity(1);
    }
    else
    {
        Print("[MyMod] Object is not an ItemBase: " + obj.GetType());
    }
}
```

`Class.CastTo()` returns `true` on success, `false` on failure. Always check the return value.

---

## Testing Workflow

DayZ modding has no automated test framework. Testing is manual: build, launch, play, observe, check logs. An efficient workflow is critical.

### The Basic Testing Cycle

```
Edit Code --> Build PBO --> Launch DayZ --> Test In-Game --> Check Log --> Fix --> Repeat
```

With file patching, skip the PBO build: edit `.c` on P: drive, reconnect, check log. This reduces iteration from minutes to seconds.

### Testing Server Mods

If your mod has server-side logic, you need a local dedicated server.

**Option 1: Listen server (simplest)**

Launch DayZDiag with `-server` to run both client and server in a single process:

```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -server -port=2302
```

Это fastest way to test, but it does not perfectly replicate a dedicated server environment.

**Option 2: Local dedicated server (most accurate)**

Run a separate DayZDiag server process, then connect to it with a DayZDiag client:

Server:
```batch
DayZDiag_x64.exe -filePatching -server -mod=P:\MyMod -config=serverDZ.cfg -port=2302 -profiles=serverprofile
```

Client:
```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -connect=127.0.0.1 -port=2302
```

This gives you separate client and server logs, which is essential for debugging RPC communication and client-server split logic.

### Testing Client-Only and Multiplayer

For client-only mods (UI, HUD), a listen server is sufficient: add `-server` to your launch parameters.

For multiplayer testing, you have three options:
- **Two instances on one machine:** Run DayZDiag server + two clients with different `-profiles` folders
- **Test with a friend:** Host a DayZDiag server, open firewall port 2302
- **Cloud server:** Set up a remote dedicated server

### Using Build Scripts

If your project has a build script (like `dev.py`), use it to automate the cycle:

```bash
python dev.py build     # Build all PBOs
python dev.py server    # Build + launch server + monitor logs
python dev.py client    # Launch client (connects localhost:2302)
python dev.py full      # Build + server + monitor + auto-launch client
python dev.py check     # Check latest script log for errors (offline)
python dev.py watch     # Real-time log tail, filtered for errors and mod output
python dev.py kill      # Kill DayZ processes for restart
```

The `watch` command is especially valuable --- он filters the live log to only show relevant output.

---

## In-Game Debug Tools

DayZDiag provides several in-game tools for testing. These are not available in retail builds.

### Script Console

Open with the backtick key (`` ` ``) or check your keybindings for "Script Console". Run Enforce Script commands live:

```c
// Spawn an item at your position
GetGame().GetPlayer().SpawnEntityOnGroundPos("AKM", GetGame().GetPlayer().GetPosition());

// Teleport to coordinates
GetGame().GetPlayer().SetPosition("8000 0 10000");

// Print your current position
Print(GetGame().GetPlayer().GetPosition().ToString());
```

### Free Camera

Toggle through the admin tools menu. Fly around detached from your character to inspect spawned objects, check placement, or observe AI behavior.

### Object Spawning

```c
// Spawn a zombie
GetGame().CreateObjectEx("ZmbM_HermitSkinny_Base", "8000 0 10000", ECE_PLACE_ON_SURFACE);

// Spawn a vehicle
GetGame().CreateObjectEx("OffroadHatchback", "8000 0 10000", ECE_PLACE_ON_SURFACE);
```

### Time and Weather Manipulation

```c
// Set to noon / midnight
GetGame().GetWorld().SetDate(2026, 6, 15, 12, 0);
GetGame().GetWorld().SetDate(2026, 6, 15, 0, 0);

// Override weather
Weather weather = GetGame().GetWeather();
weather.GetOvercast().Set(0.8, 0, 0);
weather.GetRain().Set(1.0, 0, 0);
weather.GetFog().Set(0.5, 0, 0);
```

---

## Pre-Release Checklist

Before publishing to the Steam Workshop, go through every item.

### 1. Remove or Guard All Debug Output

Search for `Print(` and ensure every debug print is removed or wrapped in `#ifdef DEVELOPER`.

### 2. Test With a Clean Profile

Rename `%LocalAppData%\DayZ\` to `DayZ_backup` and test from scratch. This catches assumptions about cached data or existing config files.

### 3. Test Mod Loading Order

Test your mod loaded before and after other popular mods. Check for class name collisions, RPC ID conflicts, and config.cpp overwrites.

### 4. Check for Memory Leaks

Watch server memory over time. Common leak causes: objects created in loops without cleanup, circular `ref` references (one side must be raw), arrays that grow without bounds.

### 5. Verify Stringtable Entries

Every `#key_name` referenced in code needs a matching row in `stringtable.csv`. Missing entries show as raw key strings in-game.

### 6. Test on a Dedicated Server

Listen server testing hides RPC timing issues, authority differences, and multi-client sync bugs. Always do a final test on a real dedicated server.

### 7. Test a Fresh Workshop Install

Unsubscribe, delete the local mod folder, resubscribe, and test. This verifies the Workshop upload is complete.

---

## Типичные ошибки

Mistakes every DayZ modder makes at least once. Learn from them.

### 1. Leaving Debug Prints in Release Builds

Players do not need `[MyMod:DEBUG] Tick count: 14523` in their logs. Wrap in `#ifdef DEVELOPER` or remove entirely.

### 2. Testing Only in Singleplayer

Listen servers run client and server in one process, hiding RPCs that never cross the network, race conditions, authority check differences, and null identity references. Test with a separate dedicated server.

### 3. Not Testing With Other Mods

Your mod may conflict with CF, Expansion, or other popular mods via duplicate RPC IDs, missing `super` calls in overrides, or config class collisions. Test combinations before release.

### 4. Ignoring Warnings

`SCRIPT (W)` warnings often predict future crashes. A missing file warning today becomes a null pointer tomorrow.

### 5. Not Using File Patching

Rebuilding PBOs for every single-line change wastes enormous time. Set up file patching once (см. [above](#file-patching----edit-without-rebuilding)).

### 6. Not Checking Both Client and Server Logs

For RPC/client-server issues, the error is often on one side and the symptom on the other. Check both `%LocalAppData%\DayZ\` (client) and your server's profile folder.

### 7. Changing config.cpp Without Rebuilding

File patching does not apply to `config.cpp`. New classes, `requiredAddons` changes, and `CfgMods` edits always require a PBO rebuild.

### 8. Wrong Script Layer

Lower layers cannot see higher layers. If `3_Game/` code references `PlayerBase` (defined in `4_World/`), it fails:

```
3_Game/   -- Cannot reference 4_World or 5_Mission types
4_World/  -- Can reference 3_Game, cannot reference 5_Mission
5_Mission/-- Can reference 3_Game and 4_World
```

---

## Следующие шаги

1. **Set up file patching** if you have not already. It is the single most impactful improvement to your development workflow.
2. **Create a debug logger class** for your mod with a consistent prefix so you can easily filter log output.
3. **Practice reading the script log.** Open it after every test session and look for errors and warnings, even if everything seemed to work. Silent errors can cause subtle bugs that surface later.
4. **Explore Workbench.** Open your mod's scripts in Workbench and try the Script Console. It takes time to get comfortable, but it pays off.
5. **Build a test scenario.** Create a saved mission or script that sets up a specific test environment (spawns items, sets time of day, teleports to a location) so you can reproduce bugs quickly.
6. **Read [Chapter 8.1](01-first-mod.md)** if you have not already built your first mod. Debugging is much easier when you understand the full mod structure.

---

## Лучшие практики

- **Check the script log FIRST before changing code.** Most bugs have a clear error message in the log. Changing code without reading the log leads to blind guessing and new bugs.
- **Use `#ifdef DEVELOPER` guards for all debug prints.** Это обеспечивает zero performance cost in retail builds and prevents log spam for players. Reserve unguarded `Print()` for critical errors only.
- **Always check both client and server logs for RPC issues.** The error is often on one side and the symptom on the other. A server-side null pointer silently drops the response, and the client just sees "no data received."
- **Set up file patching on day one.** The edit-restart-check cycle drops from 3-5 minutes (PBO rebuild) to under 30 seconds (save and reconnect). Это single biggest productivity improvement.
- **Use a consistent log prefix like `[MyMod]` in every Print call.** Script logs contain output from vanilla code, the engine, and every loaded mod. Without a prefix, your output is invisible in the noise.

---

## Теория и практика

| Концепция | Теория | Реальность |
|---------|--------|---------|
| `SCRIPT (W)` warnings | Warnings are non-fatal and can be safely ignored | Warnings often predict future crashes. A "Cannot open file" warning today becomes a null pointer crash tomorrow when code assumes the file was loaded. |
| Listen server testing | Good enough to verify scripts work | Listen servers hide entire categories of bugs: RPCs that never cross the network, missing authority checks, null `PlayerIdentity` on the server, and race conditions between client and server init. |
| File patching | Edit any file and see changes instantly | `config.cpp` is never file-patched. New `.c` files are not picked up either. Both require a PBO rebuild. Only modifications to existing script and layout files are live-reloaded. |
| Workbench debugger | Full IDE debugging experience | Workbench can syntax-check and run isolated scripts, but it does not replicate the full game environment. Many APIs return null or behave differently outside the game. |

---

## What You Learned

In this tutorial you learned:
- How to find and read DayZ script logs, and what `SCRIPT (E)` and `SCRIPT (W)` markers mean
- How to use `Print()` debugging with prefixes, formatters, and toggleable debug loggers
- How to set up DayZDiag with file patching for rapid iteration
- How to diagnose the most common error patterns: null pointers, type mismatches, undefined variables, and script layer violations
- How to establish a reliable testing workflow from edit to verification

**Next:** [Chapter 8.8: Building a HUD Overlay](08-hud-overlay.md)

---
