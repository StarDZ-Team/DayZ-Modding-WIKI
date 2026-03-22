# Chapter 8.9: Professional Mod Template

> **Summary:** This chapter provides a complete, production-ready mod template with every file you need for a professional DayZ mod. Unlike [Chapter 8.5](05-mod-template.md) which introduces InclementDab's starter skeleton, this is a full-featured template with a config system, singleton manager, client-server RPC, UI panel, keybinds, localization, and build automation. Every file is copy-paste ready and heavily commented to explain **why** each line exists.

---

## Table of Contents

- [Overview](#overview)
- [Complete Directory Structure](#complete-directory-structure)
- [mod.cpp](#modcpp)
- [config.cpp](#configcpp)
- [Constants File (3_Game)](#constants-file-3_game)
- [Config Data Class (3_Game)](#config-data-class-3_game)
- [RPC Definitions (3_Game)](#rpc-definitions-3_game)
- [Manager Singleton (4_World)](#manager-singleton-4_world)
- [Player Event Handler (4_World)](#player-event-handler-4_world)
- [Mission Hook: Server (5_Mission)](#mission-hook-server-5_mission)
- [Mission Hook: Client (5_Mission)](#mission-hook-client-5_mission)
- [UI Panel Script (5_Mission)](#ui-panel-script-5_mission)
- [Layout File](#layout-file)
- [stringtable.csv](#stringtablecsv)
- [Inputs.xml](#inputsxml)
- [Build Script](#build-script)
- [Customization Guide](#customization-guide)
- [Feature Expansion Guide](#feature-expansion-guide)
- [Next Steps](#next-steps)

---

## Overview

A "Hello World" mod proves the toolchain works. A professional mod needs much more:

| Concern | Hello World | Professional Template |
|---------|-------------|----------------------|
| Configuration | Hardcoded values | JSON config with load/save/defaults |
| Communication | Print statements | String-routed RPC (client to server and back) |
| Architecture | One file, one function | Singleton manager, layered scripts, clean lifecycle |
| User interface | None | Layout-driven UI panel with open/close |
| Input binding | None | Custom keybind in Options > Controls |
| Localization | None | stringtable.csv with 13 languages |
| Build pipeline | Manual Addon Builder | One-click batch script |
| Cleanup | None | Proper shutdown on mission end, no leaks |

This template gives you all of these out of the box. You rename the identifiers, delete the systems you do not need, and start building your actual feature on a solid foundation.

---

## Complete Directory Structure

This is the full source layout. Every file listed below is provided as a complete template in this chapter.

```
MyProfessionalMod/                          <-- Source root (lives on P: drive)
    mod.cpp                                 <-- Launcher metadata
    Scripts/
        config.cpp                          <-- Engine registration (CfgPatches + CfgMods)
        Inputs.xml                          <-- Keybind definitions
        stringtable.csv                     <-- Localized strings (13 languages)
        3_Game/
            MyMod/
                MyModConstants.c            <-- Enums, version string, shared constants
                MyModConfig.c               <-- JSON-serializable config with defaults
                MyModRPC.c                  <-- RPC route names and registration
        4_World/
            MyMod/
                MyModManager.c              <-- Singleton manager (lifecycle, config, state)
                MyModPlayerHandler.c        <-- Player connect/disconnect hooks
        5_Mission/
            MyMod/
                MyModMissionServer.c        <-- modded MissionServer (server init/shutdown)
                MyModMissionClient.c        <-- modded MissionGameplay (client init/shutdown)
                MyModUI.c                   <-- UI panel script (open/close/populate)
        GUI/
            layouts/
                MyModPanel.layout           <-- UI layout definition
    build.bat                               <-- PBO packing automation

After building, the distributable mod folder looks like this:

@MyProfessionalMod/                         <-- What goes on the server / Workshop
    mod.cpp
    addons/
        MyProfessionalMod_Scripts.pbo       <-- Packed from Scripts/
    keys/
        MyMod.bikey                         <-- Key for signed servers
    meta.cpp                                <-- Workshop metadata (auto-generated)
```

---

## mod.cpp

This file controls what players see in the DayZ launcher. It is placed at the mod root, **not** inside `Scripts/`.

```cpp
// ==========================================================================
// mod.cpp - Mod identity for the DayZ launcher
// This file is read by the launcher to display mod info in the mod list.
// It is NOT compiled by the script engine -- it is pure metadata.
// ==========================================================================

// Display name shown in the launcher mod list and in-game mod screen.
name         = "My Professional Mod";

// Your name or team name. Shows in the "Author" column.
author       = "YourName";

// Semantic version string. Update this with every release.
// The launcher displays this so players know which version they have.
version      = "1.0.0";

// Short description shown when hovering over the mod in the launcher.
// Keep it under 200 characters for readability.
overview     = "A professional mod template with config, RPC, UI, and keybinds.";

// Tooltip shown on hover. Usually matches the mod name.
tooltipOwned = "My Professional Mod";

// Optional: path to a preview image (relative to mod root).
// Recommended size: 256x256 or 512x512, PAA or EDDS format.
// Leave empty if you have no image yet.
picture      = "";

// Optional: logo displayed in the mod details panel.
logo         = "";
logoSmall    = "";
logoOver     = "";

// Optional: URL opened when the player clicks "Website" in the launcher.
action       = "";
actionURL    = "";
```

---

## config.cpp

This is the most critical file. It registers your mod with the engine, declares dependencies, wires up script layers, and optionally sets preprocessor defines and image sets.

Place this at `Scripts/config.cpp`.

```cpp
// ==========================================================================
// config.cpp - Engine registration
// The DayZ engine reads this to know what your mod provides.
// Two sections matter: CfgPatches (dependency graph) and CfgMods (script loading).
// ==========================================================================

// --------------------------------------------------------------------------
// CfgPatches - Dependency Declaration
// The engine uses this to determine load order. If your mod depends on
// another mod, list that mod's CfgPatches class in requiredAddons[].
// --------------------------------------------------------------------------
class CfgPatches
{
    // Class name MUST be globally unique across all mods.
    // Convention: ModName_Scripts (matches the PBO name).
    class MyMod_Scripts
    {
        // units[] and weapons[] declare config classes defined by this addon.
        // For script-only mods, leave these empty. They are used by mods
        // that define new items, weapons, or vehicles in config.cpp.
        units[] = {};
        weapons[] = {};

        // Minimum engine version. 0.1 works for all current DayZ versions.
        requiredVersion = 0.1;

        // Dependencies: list CfgPatches class names from other mods.
        // "DZ_Data" is the base game -- every mod should depend on it.
        // Add "CF_Scripts" if you use Community Framework.
        // Add other mod patches if you extend them.
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

// --------------------------------------------------------------------------
// CfgMods - Script Module Registration
// Tells the engine where each script layer lives and what defines to set.
// --------------------------------------------------------------------------
class CfgMods
{
    // Class name here is your mod's internal identifier.
    // It does NOT need to match CfgPatches -- but keeping them related
    // makes the codebase easier to navigate.
    class MyMod
    {
        // dir: the folder name on the P: drive (or in the PBO).
        // Must match your actual root folder name exactly.
        dir = "MyProfessionalMod";

        // Display name (shown in Workbench and some engine logs).
        name = "My Professional Mod";

        // Author and description for engine metadata.
        author = "YourName";
        overview = "Professional mod template";

        // Mod type. Always "mod" for script mods.
        type = "mod";

        // credits: optional path to a Credits.json file.
        // creditsJson = "MyProfessionalMod/Scripts/Credits.json";

        // inputs: path to your Inputs.xml for custom keybinds.
        // This MUST be set here for the engine to load your keybinds.
        inputs = "MyProfessionalMod/Scripts/Inputs.xml";

        // defines: preprocessor symbols set when your mod is loaded.
        // Other mods can use #ifdef MYMOD to detect your mod's presence
        // and conditionally compile integration code.
        defines[] = { "MYMOD" };

        // dependencies: which vanilla script modules your mod hooks into.
        // "Game" = 3_Game, "World" = 4_World, "Mission" = 5_Mission.
        // Most mods need all three. Add "Core" only if you use 1_Core.
        dependencies[] =
        {
            "Game", "World", "Mission"
        };

        // defs: maps each script module to its folder on disk.
        // The engine compiles all .c files found recursively in these paths.
        // There is no #include in Enforce Script -- this is how files are loaded.
        class defs
        {
            // imageSets: register .imageset files for use in layouts.
            // Only needed if you have custom icons/textures for UI.
            // Uncomment and update paths if you add an imageset.
            //
            // class imageSets
            // {
            //     files[] =
            //     {
            //         "MyProfessionalMod/GUI/imagesets/mymod_icons.imageset"
            //     };
            // };

            // Game layer (3_Game): loads first.
            // Place enums, constants, config classes, RPC definitions here.
            // CANNOT reference types from 4_World or 5_Mission.
            class gameScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/3_Game" };
            };

            // World layer (4_World): loads second.
            // Place managers, entity modifications, world interactions here.
            // CAN reference 3_Game types. CANNOT reference 5_Mission types.
            class worldScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/4_World" };
            };

            // Mission layer (5_Mission): loads last.
            // Place mission hooks, UI panels, startup/shutdown logic here.
            // CAN reference types from all lower layers.
            class missionScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/5_Mission" };
            };
        };
    };
};
```

---

## Constants File (3_Game)

Place at `Scripts/3_Game/MyMod/MyModConstants.c`.

This file defines all shared constants, enums, and the version string. It lives in `3_Game` so every higher layer can access these values.

```c
// ==========================================================================
// MyModConstants.c - Shared constants and enums
// 3_Game layer: available to all higher layers (4_World, 5_Mission).
//
// WHY this file exists:
//   Centralizing constants prevents magic numbers scattered across files.
//   Enums give compile-time safety instead of raw int comparisons.
//   The version string is defined once and used in logs and UI.
// ==========================================================================

// ---------------------------------------------------------------------------
// Version - update this with every release
// ---------------------------------------------------------------------------
const string MYMOD_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Log tag - prefix for all Print/log messages from this mod
// Using a consistent tag makes it easy to filter the script log.
// ---------------------------------------------------------------------------
const string MYMOD_TAG = "[MyMod]";

// ---------------------------------------------------------------------------
// File paths - centralized so typos are caught in one place
// $profile: resolves to the server's profile directory at runtime.
// ---------------------------------------------------------------------------
const string MYMOD_CONFIG_DIR  = "$profile:MyMod";
const string MYMOD_CONFIG_PATH = "$profile:MyMod/config.json";

// ---------------------------------------------------------------------------
// Enum: Feature modes
// Use enums instead of raw ints for readability and compile-time checks.
// ---------------------------------------------------------------------------
enum MyModMode
{
    DISABLED = 0,    // Feature is off
    PASSIVE  = 1,    // Feature runs but does not interfere
    ACTIVE   = 2     // Feature is fully enabled
};

// ---------------------------------------------------------------------------
// Enum: Notification types (used by UI to pick icon/color)
// ---------------------------------------------------------------------------
enum MyModNotifyType
{
    INFO    = 0,
    SUCCESS = 1,
    WARNING = 2,
    ERROR   = 3
};
```

---

## Config Data Class (3_Game)

Place at `Scripts/3_Game/MyMod/MyModConfig.c`.

This is a JSON-serializable settings class. The server loads it on startup. If no file exists, defaults are used and a fresh config is saved to disk.

```c
// ==========================================================================
// MyModConfig.c - JSON configuration with defaults
// 3_Game layer so both 4_World managers and 5_Mission hooks can read it.
//
// HOW IT WORKS:
//   JsonFileLoader<MyModConfig> uses Enforce Script's built-in JSON
//   serializer. Every field with a default value is written to / read from
//   the JSON file. Adding a new field is safe -- old config files simply
//   get the default value for any missing fields.
//
// ENFORCE SCRIPT GOTCHA:
//   JsonFileLoader<T>.JsonLoadFile(path, obj) returns VOID.
//   You CANNOT do: if (JsonFileLoader<T>.JsonLoadFile(...)) -- it will not compile.
//   Always pass a pre-created object by reference.
// ==========================================================================

class MyModConfig
{
    // --- General Settings ---

    // Master switch: if false, the entire mod is disabled.
    bool Enabled = true;

    // How often (in seconds) the manager runs its update tick.
    // Lower values = more responsive but higher CPU cost.
    float UpdateInterval = 5.0;

    // Maximum number of items/entities this mod manages simultaneously.
    int MaxItems = 100;

    // Mode: 0 = DISABLED, 1 = PASSIVE, 2 = ACTIVE (see MyModMode enum).
    int Mode = 2;

    // --- Messages ---

    // Welcome message shown to players when they connect.
    // Empty string = no message.
    string WelcomeMessage = "Welcome to the server!";

    // Whether to show the welcome message as a notification or chat message.
    bool WelcomeAsNotification = true;

    // --- Logging ---

    // Enable verbose debug logging. Turn off for production servers.
    bool DebugLogging = false;

    // -----------------------------------------------------------------------
    // Load - reads config from disk, returns instance with defaults if missing
    // -----------------------------------------------------------------------
    static MyModConfig Load()
    {
        // Always create a fresh instance first. This ensures all defaults
        // are set even if the JSON file is missing fields (e.g., after
        // an update that added new settings).
        MyModConfig cfg = new MyModConfig();

        // Check if the config file exists before trying to load.
        // On first run, it will not exist -- we use defaults and save.
        if (FileExist(MYMOD_CONFIG_PATH))
        {
            // JsonLoadFile populates the existing object. It does NOT return
            // a new object. Fields present in the JSON overwrite defaults;
            // fields missing from the JSON keep their default values.
            JsonFileLoader<MyModConfig>.JsonLoadFile(MYMOD_CONFIG_PATH, cfg);
        }
        else
        {
            // First run: save defaults so the admin has a file to edit.
            cfg.Save();
            Print(MYMOD_TAG + " No config found, created default at: " + MYMOD_CONFIG_PATH);
        }

        return cfg;
    }

    // -----------------------------------------------------------------------
    // Save - writes current values to disk as formatted JSON
    // -----------------------------------------------------------------------
    void Save()
    {
        // Ensure the directory exists. MakeDirectory is safe to call
        // even if the directory already exists.
        if (!FileExist(MYMOD_CONFIG_DIR))
        {
            MakeDirectory(MYMOD_CONFIG_DIR);
        }

        // JsonSaveFile writes all fields as a JSON object.
        // The file is overwritten entirely -- there is no merge.
        JsonFileLoader<MyModConfig>.JsonSaveFile(MYMOD_CONFIG_PATH, this);
    }
};
```

The resulting `config.json` on disk looks like this:

```json
{
    "Enabled": true,
    "UpdateInterval": 5.0,
    "MaxItems": 100,
    "Mode": 2,
    "WelcomeMessage": "Welcome to the server!",
    "WelcomeAsNotification": true,
    "DebugLogging": false
}
```

Admins edit this file, restart the server, and the new values take effect.

---

## RPC Definitions (3_Game)

Place at `Scripts/3_Game/MyMod/MyModRPC.c`.

RPC (Remote Procedure Call) is how the client and server communicate in DayZ. This file defines route names and provides helper methods for registration.

```c
// ==========================================================================
// MyModRPC.c - RPC route definitions and helpers
// 3_Game layer: route name constants must be available everywhere.
//
// HOW RPC WORKS IN DAYZ:
//   The engine provides ScriptRPC and OnRPC for sending/receiving data.
//   You call GetGame().RPCSingleParam() or create a ScriptRPC, write
//   data into it, and send it. The receiver reads data in the same order.
//
//   DayZ uses integer RPC IDs. To avoid collisions between mods, each
//   mod should pick a unique ID range or use a string-routing system.
//   This template uses a single unique int ID with a string prefix
//   to identify which handler should process each message.
//
// PATTERN:
//   1. Client wants data -> sends request RPC to server
//   2. Server processes  -> sends response RPC back to client
//   3. Client receives   -> updates UI or state
// ==========================================================================

// ---------------------------------------------------------------------------
// RPC ID - pick a unique number unlikely to collide with other mods.
// Check the DayZ community wiki for commonly used ranges.
// Engine built-in RPCs use low numbers (0-1000).
// Convention: use a 5-digit number based on your mod name's hash.
// ---------------------------------------------------------------------------
const int MYMOD_RPC_ID = 74291;

// ---------------------------------------------------------------------------
// RPC Route Names - string identifiers for each RPC endpoint.
// Using constants prevents typos and enables IDE search.
// ---------------------------------------------------------------------------
const string MYMOD_RPC_CONFIG_SYNC     = "MyMod:ConfigSync";
const string MYMOD_RPC_WELCOME         = "MyMod:Welcome";
const string MYMOD_RPC_PLAYER_DATA     = "MyMod:PlayerData";
const string MYMOD_RPC_UI_REQUEST      = "MyMod:UIRequest";
const string MYMOD_RPC_UI_RESPONSE     = "MyMod:UIResponse";

// ---------------------------------------------------------------------------
// MyModRPCHelper - static utility class for sending RPCs
// Wraps the boilerplate of creating a ScriptRPC, writing the route
// string, writing payload, and calling Send().
// ---------------------------------------------------------------------------
class MyModRPCHelper
{
    // Send a string message from server to a specific client.
    // identity: the target player. null = broadcast to all.
    // routeName: which handler should process this (e.g., MYMOD_RPC_WELCOME).
    // message: the string payload.
    static void SendStringToClient(PlayerIdentity identity, string routeName, string message)
    {
        // Create the RPC object. This is the envelope.
        ScriptRPC rpc = new ScriptRPC();

        // Write the route name first. The receiver reads this to decide
        // which handler to call. Always write/read in the same order.
        rpc.Write(routeName);

        // Write the payload data.
        rpc.Write(message);

        // Send to the client. Parameters:
        //   null    = no target object (player entity not needed for custom RPCs)
        //   MYMOD_RPC_ID = our unique RPC channel
        //   true    = guaranteed delivery (TCP-like). Use false for frequent updates.
        //   identity = target client. null would broadcast to ALL clients.
        rpc.Send(null, MYMOD_RPC_ID, true, identity);
    }

    // Send a request from client to server (no payload, just the route).
    static void SendRequestToServer(string routeName)
    {
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(routeName);
        // When sending TO the server, identity is null (server has no PlayerIdentity).
        // guaranteed = true ensures the message arrives.
        rpc.Send(null, MYMOD_RPC_ID, true, null);
    }
};
```

---

## Manager Singleton (4_World)

Place at `Scripts/4_World/MyMod/MyModManager.c`.

This is the central brain of your mod on the server side. It owns the config, processes RPC, and runs periodic updates.

```c
// ==========================================================================
// MyModManager.c - Server-side singleton manager
// 4_World layer: can reference 3_Game types (config, constants, RPC).
//
// WHY a singleton:
//   The manager needs exactly one instance that persists for the entire
//   mission. Multiple instances would cause duplicate processing and
//   conflicting state. The singleton pattern guarantees one instance
//   and provides global access via GetInstance().
//
// LIFECYCLE:
//   1. MissionServer.OnInit() calls MyModManager.GetInstance().Init()
//   2. Manager loads config, registers RPCs, starts timers
//   3. Manager processes events during gameplay
//   4. MissionServer.OnMissionFinish() calls MyModManager.Cleanup()
//   5. Singleton is destroyed, all references are released
// ==========================================================================

class MyModManager
{
    // The single instance. 'ref' means this class OWNS the object.
    // When s_Instance is set to null, the object is destroyed.
    private static ref MyModManager s_Instance;

    // Configuration loaded from disk.
    // 'ref' because the manager owns the config object's lifetime.
    protected ref MyModConfig m_Config;

    // Accumulated time since last update tick (seconds).
    protected float m_TimeSinceUpdate;

    // Tracks whether Init() has been called successfully.
    protected bool m_Initialized;

    // -----------------------------------------------------------------------
    // Singleton access
    // -----------------------------------------------------------------------

    static MyModManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new MyModManager();
        }
        return s_Instance;
    }

    // Call this on mission end to destroy the singleton and free memory.
    // Setting s_Instance to null triggers the destructor.
    static void Cleanup()
    {
        s_Instance = null;
    }

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    // Called once from MissionServer.OnInit().
    void Init()
    {
        if (m_Initialized) return;

        // Load config from disk (or create defaults on first run).
        m_Config = MyModConfig.Load();

        if (!m_Config.Enabled)
        {
            Print(MYMOD_TAG + " Mod is DISABLED in config. Skipping initialization.");
            return;
        }

        // Reset the update timer.
        m_TimeSinceUpdate = 0;

        m_Initialized = true;

        Print(MYMOD_TAG + " Manager initialized (v" + MYMOD_VERSION + ")");

        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " Debug logging enabled");
            Print(MYMOD_TAG + " Update interval: " + m_Config.UpdateInterval.ToString() + "s");
            Print(MYMOD_TAG + " Max items: " + m_Config.MaxItems.ToString());
        }
    }

    // Called every frame from MissionServer.OnUpdate().
    // timeslice is the seconds elapsed since the last frame.
    void OnUpdate(float timeslice)
    {
        if (!m_Initialized || !m_Config.Enabled) return;

        // Accumulate time and only process at the configured interval.
        // This prevents running expensive logic every single frame.
        m_TimeSinceUpdate += timeslice;
        if (m_TimeSinceUpdate < m_Config.UpdateInterval) return;
        m_TimeSinceUpdate = 0;

        // --- Periodic update logic goes here ---
        // Example: iterate tracked entities, check conditions, etc.
        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " Periodic update tick");
        }
    }

    // Called when the mission ends (server shutdown or restart).
    void Shutdown()
    {
        if (!m_Initialized) return;

        Print(MYMOD_TAG + " Manager shutting down");

        // Save any runtime state if needed.
        // m_Config.Save();

        m_Initialized = false;
    }

    // -----------------------------------------------------------------------
    // RPC Handlers
    // -----------------------------------------------------------------------

    // Called when a client requests UI data.
    // sender: the player who sent the request.
    // ctx: the data stream (already past the route name).
    void OnUIRequest(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender) return;

        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " UI data requested by: " + sender.GetName());
        }

        // Build response data and send it back.
        // In a real mod, you would gather actual data here.
        string responseData = "Items: " + m_Config.MaxItems.ToString();
        MyModRPCHelper.SendStringToClient(sender, MYMOD_RPC_UI_RESPONSE, responseData);
    }

    // Called when a player connects. Sends welcome message if configured.
    void OnPlayerConnected(PlayerIdentity identity)
    {
        if (!m_Initialized || !m_Config.Enabled) return;
        if (!identity) return;

        // Send welcome message if configured.
        if (m_Config.WelcomeMessage != "")
        {
            MyModRPCHelper.SendStringToClient(identity, MYMOD_RPC_WELCOME, m_Config.WelcomeMessage);

            if (m_Config.DebugLogging)
            {
                Print(MYMOD_TAG + " Sent welcome to: " + identity.GetName());
            }
        }
    }

    // -----------------------------------------------------------------------
    // Accessors
    // -----------------------------------------------------------------------

    MyModConfig GetConfig()
    {
        return m_Config;
    }

    bool IsInitialized()
    {
        return m_Initialized;
    }
};
```

---

## Player Event Handler (4_World)

Place at `Scripts/4_World/MyMod/MyModPlayerHandler.c`.

This uses the `modded class` pattern to hook into the vanilla `PlayerBase` entity and detect connect/disconnect events.

```c
// ==========================================================================
// MyModPlayerHandler.c - Player lifecycle hooks
// 4_World layer: modded PlayerBase to intercept connect/disconnect.
//
// WHY modded class:
//   DayZ does not have a "player connected" event callback. The standard
//   pattern is to override methods on MissionServer (for new connections)
//   or hook into PlayerBase (for entity-level events like death).
//   We use modded PlayerBase here to demonstrate entity-level hooks.
//
// IMPORTANT:
//   Always call super.MethodName() first in overrides. Failing to do so
//   breaks the vanilla behavior chain and other mods that also override
//   the same method.
// ==========================================================================

modded class PlayerBase
{
    // Track whether we have sent the init event for this player.
    // This prevents duplicate processing if Init() is called multiple times.
    protected bool m_MyModPlayerReady;

    // -----------------------------------------------------------------------
    // Called after the player entity is fully created and replicated.
    // On the server, this is where the player is "ready" to receive RPCs.
    // -----------------------------------------------------------------------
    override void Init()
    {
        super.Init();

        // Only run on the server. GetGame().IsServer() returns true on
        // dedicated servers and on the host of a listen server.
        if (!GetGame().IsServer()) return;

        // Guard against double-init.
        if (m_MyModPlayerReady) return;
        m_MyModPlayerReady = true;

        // Get the player's network identity.
        // On the server, GetIdentity() returns the PlayerIdentity object
        // containing the player's name, Steam ID (PlainId), and UID.
        PlayerIdentity identity = GetIdentity();
        if (!identity) return;

        // Notify the manager that a player has connected.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnPlayerConnected(identity);
        }
    }
};
```

---

## Mission Hook: Server (5_Mission)

Place at `Scripts/5_Mission/MyMod/MyModMissionServer.c`.

This hooks into `MissionServer` to initialize and shut down the mod on the server side.

```c
// ==========================================================================
// MyModMissionServer.c - Server-side mission hooks
// 5_Mission layer: last to load, can reference all lower layers.
//
// WHY modded MissionServer:
//   MissionServer is the entry point for server-side logic. Its OnInit()
//   runs once when the mission starts (server boot). OnMissionFinish()
//   runs when the server shuts down or restarts. These are the correct
//   places to set up and tear down your mod's systems.
//
// LIFECYCLE ORDER:
//   1. Engine loads all script layers (3_Game -> 4_World -> 5_Mission)
//   2. Engine creates MissionServer instance
//   3. OnInit() is called -> initialize your systems here
//   4. OnMissionStart() is called -> world is ready, players can join
//   5. OnUpdate() is called every frame
//   6. OnMissionFinish() is called -> server is shutting down
// ==========================================================================

modded class MissionServer
{
    // -----------------------------------------------------------------------
    // Initialization
    // -----------------------------------------------------------------------
    override void OnInit()
    {
        // ALWAYS call super first. Other mods in the chain depend on this.
        super.OnInit();

        // Initialize the manager singleton. This loads config from disk,
        // registers RPC handlers, and prepares the mod for operation.
        MyModManager.GetInstance().Init();

        Print(MYMOD_TAG + " Server mission initialized");
    }

    // -----------------------------------------------------------------------
    // Per-frame update
    // -----------------------------------------------------------------------
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        // Delegate to the manager. The manager handles its own rate
        // limiting (UpdateInterval from config) so this is cheap.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnUpdate(timeslice);
        }
    }

    // -----------------------------------------------------------------------
    // Player connection - server RPC dispatch
    // Called by the engine when a client sends an RPC to the server.
    // -----------------------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        // Only handle our RPC ID. All other RPCs pass through.
        if (rpc_type != MYMOD_RPC_ID) return;

        // Read the route name (first string written by the sender).
        string routeName;
        if (!ctx.Read(routeName)) return;

        // Dispatch to the correct handler based on route name.
        MyModManager mgr = MyModManager.GetInstance();
        if (!mgr) return;

        if (routeName == MYMOD_RPC_UI_REQUEST)
        {
            mgr.OnUIRequest(sender, ctx);
        }
        // Add more routes here as your mod grows:
        // else if (routeName == MYMOD_RPC_SOME_OTHER)
        // {
        //     mgr.OnSomeOther(sender, ctx);
        // }
    }

    // -----------------------------------------------------------------------
    // Shutdown
    // -----------------------------------------------------------------------
    override void OnMissionFinish()
    {
        // Shut down the manager before calling super.
        // This ensures our cleanup runs before the engine tears down
        // the mission infrastructure.
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.Shutdown();
        }

        // Destroy the singleton to free memory and prevent stale state
        // if the mission restarts (e.g., server restart without process exit).
        MyModManager.Cleanup();

        Print(MYMOD_TAG + " Server mission finished");

        super.OnMissionFinish();
    }
};
```

---

## Mission Hook: Client (5_Mission)

Place at `Scripts/5_Mission/MyMod/MyModMissionClient.c`.

This hooks into `MissionGameplay` for client-side initialization, input handling, and RPC receiving.

```c
// ==========================================================================
// MyModMissionClient.c - Client-side mission hooks
// 5_Mission layer.
//
// WHY MissionGameplay:
//   On the client, MissionGameplay is the active mission class during
//   gameplay. It receives OnUpdate() every frame (for input polling)
//   and OnRPC() for incoming server messages.
//
// NOTE ON LISTEN SERVERS:
//   On a listen server (host + play), BOTH MissionServer and
//   MissionGameplay are active. Your client code will run alongside
//   server code. Guard with GetGame().IsClient() or GetGame().IsServer()
//   if you need side-specific logic.
// ==========================================================================

modded class MissionGameplay
{
    // Reference to the UI panel. null when closed.
    protected ref MyModUI m_MyModPanel;

    // Track initialization state.
    protected bool m_MyModInitialized;

    // -----------------------------------------------------------------------
    // Initialization
    // -----------------------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        m_MyModInitialized = true;

        Print(MYMOD_TAG + " Client mission initialized");
    }

    // -----------------------------------------------------------------------
    // Per-frame update: input polling and UI management
    // -----------------------------------------------------------------------
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_MyModInitialized) return;

        // Poll for the keybind defined in Inputs.xml.
        // GetUApi() returns the UserActions API.
        // GetInputByName() looks up the action by the name in Inputs.xml.
        // LocalPress() returns true on the frame the key is pressed down.
        UAInput panelInput = GetUApi().GetInputByName("UAMyModPanel");
        if (panelInput && panelInput.LocalPress())
        {
            TogglePanel();
        }
    }

    // -----------------------------------------------------------------------
    // RPC receiver: handles messages from the server
    // -----------------------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        // Only handle our RPC ID.
        if (rpc_type != MYMOD_RPC_ID) return;

        // Read the route name.
        string routeName;
        if (!ctx.Read(routeName)) return;

        // Dispatch based on route.
        if (routeName == MYMOD_RPC_WELCOME)
        {
            string welcomeMsg;
            if (ctx.Read(welcomeMsg))
            {
                // Display the welcome message to the player.
                // GetGame().GetMission().OnEvent() can show notifications,
                // or you can use a custom UI. For simplicity, we use chat.
                GetGame().Chat(welcomeMsg, "");
                Print(MYMOD_TAG + " Welcome message: " + welcomeMsg);
            }
        }
        else if (routeName == MYMOD_RPC_UI_RESPONSE)
        {
            string responseData;
            if (ctx.Read(responseData))
            {
                // Update the UI panel with received data.
                if (m_MyModPanel)
                {
                    m_MyModPanel.SetData(responseData);
                }
            }
        }
    }

    // -----------------------------------------------------------------------
    // UI Panel toggle
    // -----------------------------------------------------------------------
    protected void TogglePanel()
    {
        if (m_MyModPanel && m_MyModPanel.IsOpen())
        {
            m_MyModPanel.Close();
            m_MyModPanel = null;
        }
        else
        {
            // Only open if the player is alive and no other menu is showing.
            PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
            if (!player || !player.IsAlive()) return;

            UIManager uiMgr = GetGame().GetUIManager();
            if (uiMgr && uiMgr.GetMenu()) return;

            m_MyModPanel = new MyModUI();
            m_MyModPanel.Open();

            // Request fresh data from the server.
            MyModRPCHelper.SendRequestToServer(MYMOD_RPC_UI_REQUEST);
        }
    }

    // -----------------------------------------------------------------------
    // Shutdown
    // -----------------------------------------------------------------------
    override void OnMissionFinish()
    {
        // Close and destroy the UI panel if open.
        if (m_MyModPanel)
        {
            m_MyModPanel.Close();
            m_MyModPanel = null;
        }

        m_MyModInitialized = false;

        Print(MYMOD_TAG + " Client mission finished");

        super.OnMissionFinish();
    }
};
```

---

## UI Panel Script (5_Mission)

Place at `Scripts/5_Mission/MyMod/MyModUI.c`.

This script drives the UI panel defined in the `.layout` file. It finds widget references, populates them with data, and handles open/close.

```c
// ==========================================================================
// MyModUI.c - UI panel controller
// 5_Mission layer: can reference all lower layers.
//
// HOW DayZ UI WORKS:
//   1. A .layout file defines the widget hierarchy (like HTML).
//   2. A script class loads the layout, finds widgets by name, and
//      manipulates them (set text, show/hide, respond to clicks).
//   3. The script shows/hides the root widget and manages input focus.
//
// WIDGET LIFECYCLE:
//   GetGame().GetWorkspace().CreateWidgets() loads the layout file and
//   returns the root widget. You then use FindAnyWidget() to get
//   references to named child widgets. When done, call widget.Unlink()
//   to destroy the entire widget tree.
// ==========================================================================

class MyModUI
{
    // Root widget of the panel (loaded from .layout).
    protected ref Widget m_Root;

    // Named child widgets.
    protected TextWidget m_TitleText;
    protected TextWidget m_DataText;
    protected TextWidget m_VersionText;
    protected ButtonWidget m_CloseButton;

    // State tracking.
    protected bool m_IsOpen;

    // -----------------------------------------------------------------------
    // Constructor: load the layout and find widget references
    // -----------------------------------------------------------------------
    void MyModUI()
    {
        // CreateWidgets loads the .layout file and instantiates all widgets.
        // The path is relative to the mod root (same as config.cpp paths).
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyProfessionalMod/Scripts/GUI/layouts/MyModPanel.layout"
        );

        // Initially hidden until Open() is called.
        if (m_Root)
        {
            m_Root.Show(false);

            // Find named widgets. These names MUST match the widget names
            // in the .layout file exactly (case-sensitive).
            m_TitleText   = TextWidget.Cast(m_Root.FindAnyWidget("TitleText"));
            m_DataText    = TextWidget.Cast(m_Root.FindAnyWidget("DataText"));
            m_VersionText = TextWidget.Cast(m_Root.FindAnyWidget("VersionText"));
            m_CloseButton = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));

            // Set static content.
            if (m_TitleText)
                m_TitleText.SetText("My Professional Mod");

            if (m_VersionText)
                m_VersionText.SetText("v" + MYMOD_VERSION);
        }
    }

    // -----------------------------------------------------------------------
    // Open: show the panel and capture input
    // -----------------------------------------------------------------------
    void Open()
    {
        if (!m_Root) return;

        m_Root.Show(true);
        m_IsOpen = true;

        // Lock player controls so WASD does not move the character
        // while the panel is open. This shows a cursor.
        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print(MYMOD_TAG + " UI panel opened");
    }

    // -----------------------------------------------------------------------
    // Close: hide the panel and release input
    // -----------------------------------------------------------------------
    void Close()
    {
        if (!m_Root) return;

        m_Root.Show(false);
        m_IsOpen = false;

        // Re-enable player controls.
        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print(MYMOD_TAG + " UI panel closed");
    }

    // -----------------------------------------------------------------------
    // Data update: called when the server sends UI data
    // -----------------------------------------------------------------------
    void SetData(string data)
    {
        if (m_DataText)
        {
            m_DataText.SetText(data);
        }
    }

    // -----------------------------------------------------------------------
    // State query
    // -----------------------------------------------------------------------
    bool IsOpen()
    {
        return m_IsOpen;
    }

    // -----------------------------------------------------------------------
    // Destructor: clean up the widget tree
    // -----------------------------------------------------------------------
    void ~MyModUI()
    {
        // Unlink destroys the root widget and all its children.
        // This frees the memory used by the widget tree.
        if (m_Root)
        {
            m_Root.Unlink();
        }
    }
};
```

---

## Layout File

Place at `Scripts/GUI/layouts/MyModPanel.layout`.

This defines the visual structure of the UI panel. DayZ layouts use a custom text format (not XML).

```
// ==========================================================================
// MyModPanel.layout - UI panel structure
//
// SIZING RULES:
//   hexactsize 1 + vexactsize 1 = size is in pixels (e.g., size 400 300)
//   hexactsize 0 + vexactsize 0 = size is proportional (0.0 to 1.0)
//   halign/valign control anchor point:
//     left_ref/top_ref     = anchored to parent's left/top edge
//     center_ref           = centered in parent
//     right_ref/bottom_ref = anchored to parent's right/bottom edge
//
// IMPORTANT:
//   - Never use negative sizes. Use alignment and position instead.
//   - Widget names must match FindAnyWidget() calls in the script exactly.
//   - 'ignorepointer 1' means the widget does not receive mouse clicks.
//   - 'scriptclass' links a widget to a script class for event handling.
// ==========================================================================

// Root panel: centered on screen, 400x300 pixels, semi-transparent background.
PanelWidgetClass MyModPanelRoot {
 position 0 0
 size 400 300
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
 color 0.1 0.1 0.12 0.92
 priority 100
 {
  // Title bar: full width, 36px tall, at the top.
  PanelWidgetClass TitleBar {
   position 0 0
   size 1 36
   hexactpos 1
   vexactpos 1
   hexactsize 0
   vexactsize 1
   color 0.15 0.15 0.18 1
   {
    // Title text: left-aligned with padding.
    TextWidgetClass TitleText {
     position 12 0
     size 300 36
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     valign center_ref
     ignorepointer 1
     text "My Mod"
     font "gui/fonts/metron2"
     "exact size" 16
     color 1 1 1 0.9
    }
    // Version text: right side of title bar.
    TextWidgetClass VersionText {
     position 0 0
     size 80 36
     halign right_ref
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     valign center_ref
     ignorepointer 1
     text "v1.0.0"
     font "gui/fonts/metron2"
     "exact size" 12
     color 0.6 0.6 0.6 0.8
    }
   }
  }
  // Content area: below title bar, fills remaining space.
  PanelWidgetClass ContentArea {
   position 0 40
   size 380 200
   halign center_ref
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   color 0 0 0 0
   {
    // Data text: where server data is displayed.
    TextWidgetClass DataText {
     position 12 12
     size 356 160
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     ignorepointer 1
     text "Waiting for data..."
     font "gui/fonts/metron2"
     "exact size" 14
     color 0.85 0.85 0.85 1
    }
   }
  }
  // Close button: bottom-right corner.
  ButtonWidgetClass CloseButton {
   position 0 0
   size 100 32
   halign right_ref
   valign bottom_ref
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   text "Close"
   font "gui/fonts/metron2"
   "exact size" 14
  }
 }
}
```

---

## stringtable.csv

Place at `Scripts/stringtable.csv`.

This provides localization for all player-facing text. The engine reads the column matching the player's game language. The `original` column is the fallback.

DayZ supports 13 language columns. Every row must have all 13 columns (use the English text as placeholder for languages you do not translate).

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod",
"STR_MYMOD_INPUT_PANEL","Open Panel","Open Panel","Otevrit Panel","Panel offnen","Otkryt Panel","Otworz Panel","Panel megnyitasa","Apri Pannello","Abrir Panel","Ouvrir Panneau","Open Panel","Open Panel","Abrir Painel","Open Panel",
"STR_MYMOD_TITLE","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod",
"STR_MYMOD_CLOSE","Close","Close","Zavrit","Schliessen","Zakryt","Zamknij","Bezaras","Chiudi","Cerrar","Fermer","Close","Close","Fechar","Close",
"STR_MYMOD_WELCOME","Welcome!","Welcome!","Vitejte!","Willkommen!","Dobro pozhalovat!","Witaj!","Udvozoljuk!","Benvenuto!","Bienvenido!","Bienvenue!","Welcome!","Welcome!","Bem-vindo!","Welcome!",
```

**Important:** Each line must end with a trailing comma after the last language column. This is a requirement of DayZ's CSV parser.

---

## Inputs.xml

Place at `Scripts/Inputs.xml`.

This defines custom keybinds that appear in the game's Options > Controls menu. The `inputs` field in `config.cpp` CfgMods must point to this file.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<!--
    Inputs.xml - Custom keybind definitions

    STRUCTURE:
    - <actions>:  declares input action names and their display strings
    - <sorting>:  groups actions under a category in the Controls menu
    - <preset>:   sets the default key binding

    NAMING CONVENTION:
    - Action names start with "UA" (User Action) followed by your mod prefix.
    - The "loc" attribute references a string key from stringtable.csv.

    KEY NAMES:
    - Keyboard: kA through kZ, k0-k9, kInsert, kHome, kEnd, kDelete,
      kNumpad0-kNumpad9, kF1-kF12, kLControl, kRControl, kLShift, kRShift,
      kLAlt, kRAlt, kSpace, kReturn, kBack, kTab, kEscape
    - Mouse: mouse1 (left), mouse2 (right), mouse3 (middle)
    - Combo keys: use <combo> element with multiple <btn> children
-->
<modded_inputs>
    <inputs>
        <!-- Declare the input action. -->
        <actions>
            <input name="UAMyModPanel" loc="STR_MYMOD_INPUT_PANEL" />
        </actions>

        <!-- Group under a category in Options > Controls. -->
        <!-- The "name" is an internal ID; "loc" is the display name from stringtable. -->
        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <input name="UAMyModPanel"/>
        </sorting>
    </inputs>

    <!-- Default key preset. Players can rebind in Options > Controls. -->
    <preset>
        <!-- Bind to the Home key by default. -->
        <input name="UAMyModPanel">
            <btn name="kHome"/>
        </input>

        <!--
        COMBO KEY EXAMPLE (uncomment to use):
        This would bind to Ctrl+H instead of a single key.
        <input name="UAMyModPanel">
            <combo>
                <btn name="kLControl"/>
                <btn name="kH"/>
            </combo>
        </input>
        -->
    </preset>
</modded_inputs>
```

---

## Build Script

Place at `build.bat` in the mod root.

This batch file automates PBO packing using Addon Builder from DayZ Tools.

```batch
@echo off
REM ==========================================================================
REM build.bat - Automated PBO packing for MyProfessionalMod
REM
REM WHAT THIS DOES:
REM   1. Packs the Scripts/ folder into a PBO file
REM   2. Places the PBO in the distributable @mod folder
REM   3. Copies mod.cpp to the distributable folder
REM
REM PREREQUISITES:
REM   - DayZ Tools installed via Steam
REM   - Mod source at P:\MyProfessionalMod\
REM
REM USAGE:
REM   Double-click this file or run from command line: build.bat
REM ==========================================================================

REM --- Configuration: update these paths to match your setup ---

REM Path to DayZ Tools (check your Steam library path).
set DAYZ_TOOLS=C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools

REM Source folder: the Scripts directory that gets packed into the PBO.
set SOURCE=P:\MyProfessionalMod\Scripts

REM Output folder: where the packed PBO goes.
set OUTPUT=P:\@MyProfessionalMod\addons

REM Prefix: the virtual path inside the PBO. Must match the paths
REM in config.cpp (e.g., "MyProfessionalMod/Scripts/3_Game" must resolve).
set PREFIX=MyProfessionalMod\Scripts

REM --- Build Steps ---

echo ============================================
echo  Building MyProfessionalMod
echo ============================================

REM Create output directory if it does not exist.
if not exist "%OUTPUT%" mkdir "%OUTPUT%"

REM Run Addon Builder.
REM   -clear  = remove old PBO before packing
REM   -prefix = set the PBO prefix (required for script paths to resolve)
echo Packing PBO...
"%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe" "%SOURCE%" "%OUTPUT%" -prefix=%PREFIX% -clear

REM Check if Addon Builder succeeded.
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: PBO packing failed! Check the output above for details.
    echo Common causes:
    echo   - DayZ Tools path is wrong
    echo   - Source folder does not exist
    echo   - A .c file has a syntax error that prevents packing
    pause
    exit /b 1
)

REM Copy mod.cpp to the distributable folder.
echo Copying mod.cpp...
copy /Y "P:\MyProfessionalMod\mod.cpp" "P:\@MyProfessionalMod\mod.cpp" >nul

echo.
echo ============================================
echo  Build complete!
echo  Output: P:\@MyProfessionalMod\
echo ============================================
echo.
echo To test with file patching (no PBO needed):
echo   DayZDiag_x64.exe -mod=P:\MyProfessionalMod -filePatching
echo.
echo To test with the built PBO:
echo   DayZDiag_x64.exe -mod=P:\@MyProfessionalMod
echo.
pause
```

---

## Customization Guide

When you use this template for your own mod, you need to rename every occurrence of the placeholder names. Here is a complete checklist.

### Step 1: Choose Your Names

Decide on these identifiers before making any edits:

| Identifier | Example | Rules |
|------------|---------|-------|
| **Mod folder name** | `MyBountySystem` | No spaces, PascalCase or underscores |
| **Display name** | `"My Bounty System"` | Human-readable, for mod.cpp and config.cpp |
| **CfgPatches class** | `MyBountySystem_Scripts` | Must be globally unique across all mods |
| **CfgMods class** | `MyBountySystem` | Internal engine identifier |
| **Script prefix** | `MyBounty` | Short prefix for classes: `MyBountyManager`, `MyBountyConfig` |
| **Tag constant** | `MYBOUNTY_TAG` | For log messages: `"[MyBounty]"` |
| **Preprocessor define** | `MYBOUNTYSYSTEM` | For `#ifdef` cross-mod detection |
| **RPC ID** | `58432` | Unique 5-digit number, not used by other mods |
| **Input action name** | `UAMyBountyPanel` | Starts with `UA`, unique |

### Step 2: Rename Files and Folders

Rename every file and folder that contains "MyMod" or "MyProfessionalMod":

```
MyProfessionalMod/           -> MyBountySystem/
  Scripts/3_Game/MyMod/      -> Scripts/3_Game/MyBounty/
    MyModConstants.c          -> MyBountyConstants.c
    MyModConfig.c             -> MyBountyConfig.c
    MyModRPC.c                -> MyBountyRPC.c
  Scripts/4_World/MyMod/     -> Scripts/4_World/MyBounty/
    MyModManager.c            -> MyBountyManager.c
    MyModPlayerHandler.c      -> MyBountyPlayerHandler.c
  Scripts/5_Mission/MyMod/   -> Scripts/5_Mission/MyBounty/
    MyModMissionServer.c      -> MyBountyMissionServer.c
    MyModMissionClient.c      -> MyBountyMissionClient.c
    MyModUI.c                 -> MyBountyUI.c
  Scripts/GUI/layouts/
    MyModPanel.layout          -> MyBountyPanel.layout
```

### Step 3: Find-and-Replace in Every File

Perform these replacements **in order** (longest strings first to avoid partial matches):

| Find | Replace | Files Affected |
|------|---------|----------------|
| `MyProfessionalMod` | `MyBountySystem` | config.cpp, mod.cpp, build.bat, UI script |
| `MyModManager` | `MyBountyManager` | Manager, mission hooks, player handler |
| `MyModConfig` | `MyBountyConfig` | Config class, manager |
| `MyModConstants` | `MyBountyConstants` | (filename only) |
| `MyModRPCHelper` | `MyBountyRPCHelper` | RPC helper, mission hooks |
| `MyModUI` | `MyBountyUI` | UI script, client mission hook |
| `MyModPanel` | `MyBountyPanel` | Layout file, UI script |
| `MyMod_Scripts` | `MyBountySystem_Scripts` | config.cpp CfgPatches |
| `MYMOD_RPC_ID` | `MYBOUNTY_RPC_ID` | Constants, RPC, mission hooks |
| `MYMOD_RPC_` | `MYBOUNTY_RPC_` | All RPC route constants |
| `MYMOD_TAG` | `MYBOUNTY_TAG` | Constants, all files using the log tag |
| `MYMOD_CONFIG` | `MYBOUNTY_CONFIG` | Constants, config class |
| `MYMOD_VERSION` | `MYBOUNTY_VERSION` | Constants, UI script |
| `MYMOD` | `MYBOUNTYSYSTEM` | config.cpp defines[] |
| `MyMod` | `MyBounty` | config.cpp CfgMods class, RPC route strings |
| `My Mod` | `My Bounty System` | Strings in layouts, stringtable |
| `mymod` | `mybounty` | Inputs.xml sorting name |
| `STR_MYMOD_` | `STR_MYBOUNTY_` | stringtable.csv, Inputs.xml |
| `UAMyMod` | `UAMyBounty` | Inputs.xml, client mission hook |
| `m_MyMod` | `m_MyBounty` | Client mission hook member variables |
| `74291` | `58432` | RPC ID (your chosen unique number) |

### Step 4: Verify

After renaming, do a project-wide search for "MyMod" and "MyProfessionalMod" to catch anything you missed. Then build and test:

```batch
DayZDiag_x64.exe -mod=P:\MyBountySystem -filePatching
```

Check the script log for your tag (e.g., `[MyBounty]`) to confirm everything loaded.

---

## Feature Expansion Guide

Once your mod is running, here is how to add common features.

### Adding a New RPC Endpoint

**1. Define the route constant** in `MyModRPC.c` (3_Game):

```c
const string MYMOD_RPC_BOUNTY_SET = "MyMod:BountySet";
```

**2. Add the server handler** in `MyModManager.c` (4_World):

```c
void OnBountySet(PlayerIdentity sender, ParamsReadContext ctx)
{
    // Read parameters written by the client.
    string targetName;
    int bountyAmount;
    if (!ctx.Read(targetName)) return;
    if (!ctx.Read(bountyAmount)) return;

    Print(MYMOD_TAG + " Bounty set on " + targetName + ": " + bountyAmount.ToString());
    // ... your logic here ...
}
```

**3. Add the dispatch case** in `MyModMissionServer.c` (5_Mission), inside `OnRPC()`:

```c
else if (routeName == MYMOD_RPC_BOUNTY_SET)
{
    mgr.OnBountySet(sender, ctx);
}
```

**4. Send from the client** (wherever the action is triggered):

```c
ScriptRPC rpc = new ScriptRPC();
rpc.Write(MYMOD_RPC_BOUNTY_SET);
rpc.Write("PlayerName");
rpc.Write(5000);
rpc.Send(null, MYMOD_RPC_ID, true, null);
```

### Adding a New Config Field

**1. Add the field** in `MyModConfig.c` with a default value:

```c
// Minimum bounty amount players can set.
int MinBountyAmount = 100;
```

That is all. The JSON serializer picks up public fields automatically. Existing config files on disk will use the default value for the new field until the admin edits and saves.

**2. Reference it** from the manager:

```c
if (bountyAmount < m_Config.MinBountyAmount)
{
    // Reject: too low.
    return;
}
```

### Adding a New UI Panel

**1. Create the layout** at `Scripts/GUI/layouts/MyModBountyList.layout`:

```
PanelWidgetClass BountyListRoot {
 position 0 0
 size 500 400
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
 color 0.1 0.1 0.12 0.92
 {
  TextWidgetClass BountyListTitle {
   position 12 8
   size 476 30
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   text "Active Bounties"
   font "gui/fonts/metron2"
   "exact size" 18
   color 1 1 1 0.9
  }
 }
}
```

**2. Create the script** at `Scripts/5_Mission/MyMod/MyModBountyListUI.c`:

```c
class MyModBountyListUI
{
    protected ref Widget m_Root;
    protected bool m_IsOpen;

    void MyModBountyListUI()
    {
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyProfessionalMod/Scripts/GUI/layouts/MyModBountyList.layout"
        );
        if (m_Root)
            m_Root.Show(false);
    }

    void Open()  { if (m_Root) { m_Root.Show(true); m_IsOpen = true; } }
    void Close() { if (m_Root) { m_Root.Show(false); m_IsOpen = false; } }
    bool IsOpen() { return m_IsOpen; }

    void ~MyModBountyListUI()
    {
        if (m_Root) m_Root.Unlink();
    }
};
```

### Adding a New Keybind

**1. Add the action** in `Inputs.xml`:

```xml
<actions>
    <input name="UAMyModPanel" loc="STR_MYMOD_INPUT_PANEL" />
    <input name="UAMyModBountyList" loc="STR_MYMOD_INPUT_BOUNTYLIST" />
</actions>

<sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
    <input name="UAMyModPanel"/>
    <input name="UAMyModBountyList"/>
</sorting>
```

**2. Add the default binding** in the `<preset>` section:

```xml
<input name="UAMyModBountyList">
    <btn name="kEnd"/>
</input>
```

**3. Add the localization** in `stringtable.csv`:

```csv
"STR_MYMOD_INPUT_BOUNTYLIST","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List",
```

**4. Poll for the input** in `MyModMissionClient.c`:

```c
UAInput bountyInput = GetUApi().GetInputByName("UAMyModBountyList");
if (bountyInput && bountyInput.LocalPress())
{
    ToggleBountyList();
}
```

### Adding a New stringtable Entry

**1. Add the row** in `stringtable.csv`. Every row needs all 13 language columns plus a trailing comma:

```csv
"STR_MYMOD_BOUNTY_PLACED","Bounty placed!","Bounty placed!","Odměna vypsána!","Kopfgeld gesetzt!","Награда назначена!","Nagroda wyznaczona!","Fejpénz kiírva!","Taglia piazzata!","Recompensa puesta!","Prime placée!","Bounty placed!","Bounty placed!","Recompensa colocada!","Bounty placed!",
```

**2. Use it** in script code:

```c
// Widget.SetText() does NOT auto-resolve stringtable keys.
// You must use Widget.SetText() with the resolved string:
string localizedText = Widget.TranslateString("#STR_MYMOD_BOUNTY_PLACED");
myTextWidget.SetText(localizedText);
```

Or in a `.layout` file, the engine resolves `#STR_` keys automatically:

```
text "#STR_MYMOD_BOUNTY_PLACED"
```

---

## Next Steps

With this professional template running, you can:

1. **Study production mods** -- Read [DayZ Expansion](https://github.com/salutesh/DayZ-Expansion-Scripts) and the `StarDZ_Core` source for real-world patterns at scale.
2. **Add custom items** -- Follow [Chapter 8.2: Creating a Custom Item](02-custom-item.md) and integrate them with your manager.
3. **Build an admin panel** -- Follow [Chapter 8.3: Building an Admin Panel](03-admin-panel.md) using your config system.
4. **Add a HUD overlay** -- Follow [Chapter 8.8: Building a HUD Overlay](08-hud-overlay.md) for always-visible UI elements.
5. **Publish to the Workshop** -- Follow [Chapter 8.7: Publishing to Workshop](07-publishing-workshop.md) when your mod is ready.
6. **Learn debugging** -- Read [Chapter 8.6: Debugging & Testing](06-debugging-testing.md) for log analysis and troubleshooting.

---

**Previous:** [Chapter 8.8: Building a HUD Overlay](08-hud-overlay.md) | [Home](../../README.md)
