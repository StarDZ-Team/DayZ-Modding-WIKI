# Chapter 8.13: The Diagnostic Menu (Diag Menu)

> **Краткое описание:** The Diag Menu is DayZ's built-in diagnostic tool, available only through the DayZDiag executable. It provides FPS counters, script profiling, render debugging, free camera, physics visualization, weather control, Central Economy tools, AI navigation debugging, and sound diagnostics. This chapter documents every menu category, option, and keyboard shortcut based on the official Bohemia Interactive documentation.

---

## Содержание

- [What is the Diag Menu?](#what-is-the-diag-menu)
- [How to Access](#how-to-access)
- [Navigation Controls](#navigation-controls)
- [Quick-Access Keyboard Shortcuts](#quick-access-keyboard-shortcuts)
- [Menu Categories Overview](#menu-categories-overview)
- [Statistics](#statistics)
- [Enfusion Renderer](#enfusion-renderer)
- [Enfusion World (Physics)](#enfusion-world-physics)
- [DayZ Render](#dayz-render)
- [Game](#game)
- [AI](#ai)
- [Sounds](#sounds)
- [Useful Features for Modders](#useful-features-for-modders)
- [When to Use the Diag Menu](#when-to-use-the-diag-menu)
- [Common Mistakes](#common-mistakes)
- [Next Steps](#next-steps)

---

## What is the Diag Menu?

The Diag Menu is a hierarchical debug menu built into the DayZ diagnostic executable. It lists options used to debug game scripting and assets across seven major categories: Statistics, Enfusion Renderer, Enfusion World, DayZ Render, Game, AI, and Sounds.

The Diag Menu is **not available** in the retail DayZ executable (`DayZ_x64.exe`). You must use `DayZDiag_x64.exe` ---  diagnostic build that ships alongside the retail version in your DayZ installation or DayZ Server directories.

---

## How to Access

### Requirements

- **DayZDiag_x64.exe** -- The diagnostic executable. Found in your DayZ installation folder alongside the regular `DayZ_x64.exe`.
- You must be running the game (not sitting in a loading screen). The menu is available in any 3D viewport.

### Открытие the Menu

Press **Win + Alt** to open the Diag Menu.

An alternative shortcut is **Ctrl + Win**, but this conflicts with a Windows 11 system shortcut and is not recommended on that platform.

### Enabling Mouse Cursor

Some Diag Menu options require you to interact with the screen using your mouse. The mouse cursor can be toggled by pressing:

**LCtrl + Numpad 9**

This key binding is registered through script (`PluginKeyBinding`).

---

## Навигация Controls

Once the Diag Menu is open:

| Key | Action |
|-----|--------|
| **Up / Down arrow** | Navigate between menu items |
| **Right arrow** | Enter a sub-menu, or cycle through option values |
| **Left arrow** | Cycle option values in reverse direction |
| **Backspace** | Leave the current sub-menu (go back one level) |

When options show multiple values, they are listed in the order they appear in the menu. The first option is typically the default.

---

## Quick-Access Keyboard Shortcuts

These shortcuts work at any time while running DayZDiag, without needing to open the menu:

| Shortcut | Function |
|----------|----------|
| **LCtrl + Numpad 1** | Toggle FPS counter |
| **LCtrl + Numpad 9** | Toggle mouse cursor on screen |
| **RCtrl + RAlt + W** | Cycle render debug mode |
| **LCtrl + LAlt + P** | Toggle postprocess effects |
| **LAlt + Numpad 6** | Toggle physics body visualization |
| **Page Up** | Free Camera: toggle player movement |
| **Page Down** | Free Camera: freeze/unfreeze camera |
| **Insert** | Teleport player to cursor position (while in free camera) |
| **Home** | Toggle free camera / disable and teleport player to cursor |
| **Numpad /** | Toggle free camera (without teleport) |
| **End** | Disable free camera (return to player camera) |

> **Примечание:** Any mention of "Cheat Inputs" in the official documentation refers to inputs hardcoded on the C++ side, not accessible through script.

---

## Menu Categories Overview

The Diag Menu contains seven top-level categories:

1. **Statistics** -- FPS counter and script profiler
2. **Enfusion Renderer** -- Lighting, shadows, materials, occlusion, postprocess, terrain, widgets
3. **Enfusion World** -- Physics engine (Bullet) visualization and debug
4. **DayZ Render** -- Sky rendering, geometry diagnostics
5. **Game** -- Weather, free camera, vehicles, combat, Central Economy, surface sounds
6. **AI** -- Navigation mesh, pathfinding, AI agent behavior
7. **Sounds** -- Playing samples debug, sound system info

---

## Statistics

### Menu Structure

```
Statistics
  FPS                              [LCtrl + Numpad 1]
  Script profiler UI
  > Script profiler settings
      Always enabled
      Flags
      Module
      Update interval
      Average
      Time resolution
      (UI) Scale
```

### FPS

Enables the FPS counter in the top-left corner of the screen.

The FPS value is calculated from the time between the last 10 frames, so it reflects a short rolling average rather than an instantaneous reading.

### Script Profiler UI

Turns on the on-screen Script Profiler, which displays real-time performance data for script execution.

The profiler shows six data sections:

| Section | What It Shows |
|---------|---------------|
| **Time per class** | Total time of all function calls belonging to a class (top 20) |
| **Time per function** | Total time of all calls to a specific function (top 20) |
| **Class allocations** | Number of allocations of a class (top 20) |
| **Count per function** | Number of times a function was called (top 20) |
| **Class count** | Number of live instances of a class (top 40) |
| **Stats and settings** | Current profiler configuration and frame counters |

The Stats and settings panel shows:

| Field | Meaning |
|-------|---------|
| UI enabled (DIAG) | Whether the script profiler UI is active |
| Profiling enabled (SCRP) | Whether profiling runs even when UI is not active |
| Profiling enabled (SCRC) | Whether profiling is actually occurring |
| Flags | Current data gathering flags |
| Module | Currently profiled module |
| Interval | Current update interval |
| Time Resolution | Current time resolution |
| Average | Whether values displayed are averages |
| Game Frame | Total frames passed |
| Session Frame | Total frames in this profiling session |
| Total Frames | Total frames across all profiling sessions |
| Profiled Sess Frms | Frames profiled in this session |
| Profiled Frames | Frames profiled across all sessions |

> **Важно:** The Script Profiler only profiles script code. Proto (engine-bound) methods are not measured as separate entries, but their execution time is included in the total time of the script method that calls them.

> **Важно:** The EnProfiler API and the script profiler itself are only available on the diagnostic executable.

### Script Profiler Settings

These settings control how profiling data is gathered. They can also be adjusted programmatically through the `EnProfiler` API (documented in `EnProfiler.c`).

#### Always Enabled

Profiling data gathering is not enabled by default. This toggle shows whether it is currently active.

To enable profiling at startup, use the launch parameter `-profile`.

The Script Profiler UI ignores this setting --- он always forces profiling while the UI is visible. When the UI is turned off, profiling stops again (unless "Always enabled" is set to true).

#### Флаги

Controls how data is gathered. Four combinations are available:

| Flag Combination | Scope | Data Lifetime |
|-----------------|-------|---------------|
| `SPF_RESET \| SPF_RECURSIVE` | Selected module + children | Per frame (reset each frame) |
| `SPF_RECURSIVE` | Selected module + children | Accumulated across frames |
| `SPF_RESET` | Selected module only | Per frame (reset each frame) |
| `SPF_NONE` | Selected module only | Accumulated across frames |

- **SPF_RECURSIVE**: Enables profiling of child modules (recursively)
- **SPF_RESET**: Clears data at the end of each frame

#### Module

Selects which script module to profile:

| Option | Script Layer |
|--------|-------------|
| CORE | 1_Core |
| GAMELIB | 2_GameLib |
| GAME | 3_Game |
| WORLD | 4_World |
| MISSION | 5_Mission |
| MISSION_CUSTOM | init.c |

#### Update Interval

The number of frames to wait before updating the sorted data display. This also delays the reset caused by `SPF_RESET`.

Available values: 0, 5, 10, 20, 30, 50, 60, 120, 144

#### Average

Enable or disable the displaying of average values.

- With `SPF_RESET` and no interval: values are the raw per-frame value
- Without `SPF_RESET`: divides accumulated value by session frame count
- With an interval set: divides by the interval

Class count is never averaged --- он always shows the current instance count. Allocations will show the average number of times an instance was created.

#### Time Resolution

Sets the time unit for display. The value represents the denominator (nth of a second):

| Value | Unit |
|-------|------|
| 1 | Seconds |
| 1000 | Milliseconds |
| 1000000 | Microseconds |

Available values: 1, 10, 100, 1000, 10000, 100000, 1000000

#### (UI) Scale

Adjusts the visual scale of the on-screen profiler display for different screen sizes and resolutions.

Range: 0.5 to 1.5 (default: 1.0, step: 0.05)

---

## Enfusion Renderer

### Menu Structure

```
Enfusion Renderer
  Lights
  > Lighting
      Ambient lighting
      Ground lighting
      Directional lighting
      Bidirectional lighting
      Specular lighting
      Reflection
      Emission lighting
  Shadows
  Terrain shadows
  Render debug mode                [RCtrl + RAlt + W]
  Occluders
  Occlude entities
  Occlude proxies
  Show occluder volumes
  Show active occluders
  Show occluded
  Widgets
  Postprocess                      [LCtrl + LAlt + P]
  Terrain
  > Materials
      Common, TreeTrunk, TreeCrown, Grass, Basic, Normal,
      Super, Skin, Multi, Old Terrain, Old Roads, Water,
      Sky, Sky clouds, Sky stars, Sky flares,
      Particle Sprite, Particle Streak
```

### Lights

Toggles actual light sources (such as `PersonalLight` or in-game items like flashlights). This does not affect environment lighting -- use the Lighting sub-menu for that.

### Lighting Sub-Menu

Each toggle controls a specific lighting component:

| Option | Effect When Disabled |
|--------|---------------------|
| **Ambient lighting** | Removes the general ambient light in the scene |
| **Ground lighting** | Removes light reflected from the ground (visible on roofs, character underarms) |
| **Directional lighting** | Removes main directional (sun/moon) light. Also disables bidirectional lighting |
| **Bidirectional lighting** | Removes bidirectional light component |
| **Specular lighting** | Removes specular highlights (visible on shiny surfaces like cupboards, cars) |
| **Reflection** | Removes reflection lighting (visible on metallic/glossy surfaces) |
| **Emission lighting** | Removes emission (self-illumination) from materials |

These toggles are useful for isolating specific lighting contributions when debugging visual issues in custom models or scenes.

### Shadows

Enables or disables shadow rendering. Disabling also removes the culling of rain inside objects (rain will fall through roofs).

### Terrain Shadows

Controls how terrain shadows are generated.

Options: `on (slice)`, `on (full)`, `no update`, `disabled`

### Render Debug Mode

Switches between render visualization modes to inspect mesh geometry in-game.

Options: `normal`, `wire`, `wire only`, `overdraw`, `overdrawZ`

Different materials display in different wireframe colors:

| Material | Color (RGB) |
|----------|-------------|
| TreeTrunk | 179, 126, 55 |
| TreeCrown | 143, 227, 94 |
| Grass | 41, 194, 53 |
| Basic | 208, 87, 87 |
| Normal | 204, 66, 107 |
| Super | 234, 181, 181 |
| Skin | 252, 170, 18 |
| Multi | 143, 185, 248 |
| Terrain | 255, 127, 127 |
| Water | 51, 51, 255 |
| Ocean | 51, 128, 255 |
| Sky | 143, 185, 248 |

### Occluders

A set of toggles for the occlusion culling system:

| Option | Effect |
|--------|--------|
| **Occluders** | Enable/disable object occlusion |
| **Occlude entities** | Enable/disable entity occlusion |
| **Occlude proxies** | Enable/disable proxy occlusion |
| **Show occluder volumes** | Takes a snapshot and draws debug shapes visualizing occlusion volumes |
| **Show active occluders** | Shows currently active occluders with debug shapes |
| **Show occluded** | Visualizes occluded objects with debug shapes |

### Widgets

Enable or disable the rendering of all UI widgets. Useful for taking clean screenshots or isolating rendering issues.

### Postprocess

Enable or disable post-processing effects (bloom, color correction, vignette, etc.).

### Terrain

Enable or disable terrain rendering entirely.

### Materials Sub-Menu

Toggle the rendering of specific material types. Most are self-explanatory. Notable entries:

- **Super** -- An overarching toggle that covers every material related to the "super" shader
- **Old Terrain** -- Covers both Terrain and Terrain Simple materials
- **Water** -- Covers every material related to water (ocean, shore, rivers)

---

## Enfusion World (Physics)

### Menu Structure

```
Enfusion World
  Show Bullet
  > Bullet
      Draw Char Ctrl
      Draw Simple Char Ctrl
      Max. Collider Distance
      Draw Bullet shape
      Draw Bullet wireframe
      Draw Bullet shape AABB
      Draw obj center of mass
      Draw Bullet contacts
      Force sleep Bullet
      Show stats
  Show bodies                      [LAlt + Numpad 6]
```

> **Примечание:** "Bullet" here refers to the Bullet physics engine, not ammunition.

### Show Bullet

Turns on the debug visualization for the Bullet physics engine.

### Bullet Sub-Menu

| Option | Description |
|--------|-------------|
| **Draw Char Ctrl** | Visualize the player character controller. Depends on "Draw Bullet shape" |
| **Draw Simple Char Ctrl** | Visualize the AI character controller. Depends on "Draw Bullet shape" |
| **Max. Collider Distance** | Maximum distance from player to visualize colliders (values: 0, 1, 2, 5, 10, 20, 50, 100, 200, 500). Default is 0 |
| **Draw Bullet shape** | Visualize physics collider shapes |
| **Draw Bullet wireframe** | Show colliders as wireframe only. Depends on "Draw Bullet shape" |
| **Draw Bullet shape AABB** | Show axis-aligned bounding boxes of colliders |
| **Draw obj center of mass** | Show object centers of mass |
| **Draw Bullet contacts** | Visualize colliders making contact |
| **Force sleep Bullet** | Force all physics bodies to sleep |
| **Show stats** | Show debug stats (options: disabled, basic, all). Stats remain visible for 10 seconds after disabling |

> **Внимание:** Max. Collider Distance is 0 by default because this visualization is expensive. Setting it to a large distance will cause significant performance degradation.

### Show Bodies

Visualize Bullet physics bodies. Options: `disabled`, `only`, `all`

---

## DayZ Render

### Menu Structure

```
DayZ Render
  > Sky
      Space
      Stars
      > Planets
          Sun
          Moon
      Atmosphere
      > Clouds
          Far
          Near
          Physical
      Horizon
      > Post Process
          God Rays
  > Geometry diagnostic
      diagnostic mode
```

### Sky Sub-Menu

Toggle individual sky rendering components:

| Option | What It Controls |
|--------|-----------------|
| **Space** | The background texture behind the stars |
| **Stars** | Star rendering |
| **Sun** | Sun and its halo effect (not god rays) |
| **Moon** | Moon and its halo effect (not god rays) |
| **Atmosphere** | The atmosphere texture in the sky |
| **Far (Clouds)** | Upper/distant clouds. These do not affect light shafts (less dense) |
| **Near (Clouds)** | Lower/closer clouds. These are denser and act as occlusion for light shafts |
| **Physical (Clouds)** | Deprecated object-based clouds. Removed from Chernarus and Livonia in DayZ 1.23 |
| **Horizon** | Horizon rendering. The horizon will prevent light shafts |
| **God Rays** | Light shaft post-process effect |

### Geometry Diagnostic

Enables debug shape drawing to visualize how an object's geometry looks in-game.

Geometry types: `normal`, `roadway`, `geometry`, `viewGeometry`, `fireGeometry`, `paths`, `memory`, `wreck`

Drawing modes: `solid+wire`, `Zsolid+wire`, `wire`, `ZWire`, `geom only`

This is extremely useful for modders creating custom models --- вы can verify that your fire geometry, view geometry, and memory points are correctly configured without leaving the game.

---

## Game

### Menu Structure

```
Game
  > Weather & environment
      Display
      Force fog at camera
      Override fog
        Distance density
        Height density
        Distance offset
        Height bias
  Free Camera
    FrCam Player Move              [Page Up]
    FrCam NoClip
    FrCam Freeze                   [Page Down]
  > Vehicles
      Audio
      Simulation
  > Combat
      DECombat
      DEShots
      DEHitpoints
      DEExplosions
  > Legacy/obsolete
      DEAmbient
      DELight
  DESurfaceSound
  > Central Economy
      > Loot Spawn Edit
          Spawn Volume Vis
          Setup Vis
          Edit Volume
          Re-Trace Group Points
          Spawn Candy
          Spawn Rotation Test
          Placement Test
          Export Group
          Export All Groups
          Export Map
          Export Clusters
          Export Economy [csv]
          Export Respawn Queue [csv]
      > Loot Tool
          Deplete Lifetime
          Set Damage = 1.0
          Damage + Deplete
          Invert Avoidance
          Project Target Loot
      > Infected
          Infected Vis
          Infected Zone Info
          Infected Spawn
          Reset Cleanup
      > Animal
          Animal Vis
          Animal Spawn
          Ambient Spawn
      > Building
          Building Stats
      Vehicle&Wreck Vis
      Loot Vis
      Cluster Vis
      Dynamic Events Status
      Dynamic Events Vis
      Dynamic Events Spawn
      Export Dyn Event
      Overall Stats
      Updaters State
      Idle Mode
      Force Save
```

### Weather & Environment

Debug functionality for the weather system.

#### Display

Enables the weather debug visualization. This shows an on-screen debug of fog/view distance and opens a separate real-time window with detailed weather data.

To enable the separate window while running as a server, use the launch parameter `-debugweather`.

Window settings are stored in profiles as `weather_client_imgui.ini` / `weather_client_imgui.bin` (or `weather_server_*` for servers).

#### Force Fog at Camera

Forces the fog height to match the player camera height. Has priority over the Height bias setting.

#### Override Fog

Enables overriding fog values with manual settings:

| Parameter | Range | Step |
|-----------|-------|------|
| Distance density | 0 -- 1 | 0.01 |
| Height density | 0 -- 1 | 0.01 |
| Distance offset | 0 -- 1 | 0.01 |
| Height bias | -500 -- 500 | 5 |

### Free Camera

The free camera detaches the view from the player character and allows flying through the world. This is one of the most useful debug tools for modders.

#### Free Camera Controls

| Key | Origin | Function |
|-----|--------|----------|
| **W / A / S / D** | Inputs (xml) | Move forward / left / backward / right |
| **Q** | Inputs (xml) | Move up |
| **Z** | Inputs (xml) | Move down |
| **Mouse** | Inputs (xml) | Look around |
| **Mouse wheel up** | Inputs (C++) | Increase speed |
| **Mouse wheel down** | Inputs (C++) | Decrease speed |
| **Spacebar** | Cheat Inputs (C++) | Toggle on-screen debug of targeted object |
| **Ctrl / Shift** | Cheat Inputs (C++) | Current speed x 10 |
| **Alt** | Cheat Inputs (C++) | Current speed / 10 |
| **End** | Cheat Inputs (C++) | Disable free camera (return to player) |
| **Enter** | Cheat Inputs (C++) | Link camera to target object |
| **Page Up** | Cheat Inputs (C++) | Toggle player movement while in free camera |
| **Page Down** | Cheat Inputs (C++) | Freeze/unfreeze camera position |
| **Insert** | PluginKeyBinding (Script) | Teleport player to cursor position |
| **Home** | PluginKeyBinding (Script) | Toggle free camera / disable and teleport to cursor |
| **Numpad /** | PluginKeyBinding (Script) | Toggle free camera (no teleport) |

#### Free Camera Options

| Option | Description |
|--------|-------------|
| **FrCam Player Move** | Enable/disable player inputs (WASD) moving the player while in free camera |
| **FrCam NoClip** | Enable/disable the camera passing through terrain |
| **FrCam Freeze** | Enable/disable inputs moving the camera |

### Vehicles

Extended debug functionality for vehicles. These only work while the player is inside a vehicle.

- **Audio** -- Opens a separate window to tweak sound settings in real time. Includes visualization of audio controllers.
- **Simulation** -- Opens a separate window with car simulation debug: tweaking physics parameters and visualization.

### Combat

Debug tools for combat, shooting, and hitpoints:

| Option | Description |
|--------|-------------|
| **DECombat** | Shows on-screen text with distances to cars, AI, and players |
| **DEShots** | Projectile debug sub-menu (see below) |
| **DEHitpoints** | Displays the DamageSystem of the player and the object they are looking at |
| **DEExplosions** | Shows explosion penetration data. Numbers show slowdown values. Red cross = stopped. Green cross = penetrated |

**DEShots sub-menu:**

| Option | Description |
|--------|-------------|
| Clear vis. | Clear any existing shot visualization |
| Vis. trajectory | Trace the path of a shot, showing exit points and stop point |
| Always Deflect | Forces all client-fired shots to deflect |

### Legacy/Obsolete

- **DEAmbient** -- Displays variables influencing ambient sounds
- **DELight** -- Displays stats regarding the current lighting environment

### DESurfaceSound

Displays the surface type the player is standing on and the attenuation type.

### Central Economy

A comprehensive set of debugging tools for the Central Economy (CE) system.

> **Важно:** Most CE debug options only work in single-player client with CE enabled. Only "Building Stats" works in a multiplayer environment or when CE is turned off.

> **Примечание:** Many of these functions are also available through the `CEApi` in script (`CentralEconomy.c`).

#### Loot Spawn Edit

Tools for creating and editing loot spawn points on objects. Free camera must be enabled to use the Edit Volume tool.

| Option | Description | Script Equivalent |
|--------|-------------|-------------------|
| **Spawn Volume Vis** | Visualize loot spawn points. Options: Off, Adaptive, Volume, Occupied | `GetCEApi().LootSetSpawnVolumeVisualisation()` |
| **Setup Vis** | Show CE setup properties on screen with color-coded containers | `GetCEApi().LootToggleSpawnSetup()` |
| **Edit Volume** | Interactive loot point editor (requires free camera) | `GetCEApi().LootToggleVolumeEditing()` |
| **Re-Trace Group Points** | Re-trace loot points to fix hovering issues | `GetCEApi().LootRetraceGroupPoints()` |
| **Spawn Candy** | Spawn loot in all spawn points of selected group | -- |
| **Spawn Rotation Test** | Test rotation flags at cursor position | -- |
| **Placement Test** | Visualize placement with sphere cylinder | -- |
| **Export Group** | Export selected group to `storage/export/mapGroup_CLASSNAME.xml` | `GetCEApi().LootExportGroup()` |
| **Export All Groups** | Export all groups to `storage/export/mapgroupproto.xml` | `GetCEApi().LootExportAllGroups()` |
| **Export Map** | Generate `storage/export/mapgrouppos.xml` | `GetCEApi().LootExportMap()` |
| **Export Clusters** | Generate `storage/export/mapgroupcluster.xml` | `GetCEApi().ExportClusterData()` |
| **Export Economy [csv]** | Export economy to `storage/log/economy.csv` | `GetCEApi().EconomyLog(EconomyLogCategories.Economy)` |
| **Export Respawn Queue [csv]** | Export respawn queue to `storage/log/respawn_queue.csv` | `GetCEApi().EconomyLog(EconomyLogCategories.RespawnQueue)` |

**Edit Volume key bindings:**

| Key | Function |
|-----|----------|
| **[** | Iterate backwards through containers |
| **]** | Iterate forwards through containers |
| **LMB** | Insert new point |
| **RMB** | Delete point |
| **;** | Increase point size |
| **'** | Decrease point size |
| **Insert** | Spawn loot at point |
| **M** | Spawn 48 "AmmoBox_762x54_20Rnd" |
| **Backspace** | Mark nearby loot for cleanup (depletes lifetime, not instant) |

#### Loot Tool

| Option | Description | Script Equivalent |
|--------|-------------|-------------------|
| **Deplete Lifetime** | Depletes lifetime to 3 seconds (scheduled for cleanup) | `GetCEApi().LootDepleteLifetime()` |
| **Set Damage = 1.0** | Sets health to 0 | `GetCEApi().LootSetDamageToOne()` |
| **Damage + Deplete** | Performs both of the above | `GetCEApi().LootDepleteAndDamage()` |
| **Invert Avoidance** | Toggles player avoidance (detection of nearby players) | -- |
| **Project Target Loot** | Emulates spawning of targeted item, generates images and logs. Requires "Loot Vis" enabled | `GetCEApi().SpawnAnalyze()` and `GetCEApi().EconomyMap()` |

#### Infected

| Option | Description | Script Equivalent |
|--------|-------------|-------------------|
| **Infected Vis** | Visualize zombie zones, locations, alive/dead status | `GetCEApi().InfectedToggleVisualisation()` |
| **Infected Zone Info** | On-screen debug when camera is inside an infected zone | `GetCEApi().InfectedToggleZoneInfo()` |
| **Infected Spawn** | Spawn infected in selected zone (or "InfectedArmy" at cursor) | `GetCEApi().InfectedSpawn()` |
| **Reset Cleanup** | Sets cleanup timer to 3 seconds | `GetCEApi().InfectedResetCleanup()` |

#### Animal

| Option | Description | Script Equivalent |
|--------|-------------|-------------------|
| **Animal Vis** | Visualize animal zones, locations, alive/dead status | `GetCEApi().AnimalToggleVisualisation()` |
| **Animal Spawn** | Spawn animal in selected zone (or "AnimalGoat" at cursor) | `GetCEApi().AnimalSpawn()` |
| **Ambient Spawn** | Spawn "AmbientHen" at cursor target | `GetCEApi().AnimalAmbientSpawn()` |

#### Building

**Building Stats** shows on-screen debug about building door states:

- Left side: whether each door is open/closed and free/locked
- Middle: stats regarding `buildings.bin` (building persistence)

Door randomization uses the `initOpened` config value. When `rand < initOpened`, the door spawns opened (so `initOpened=0` means doors never spawn open).

Common `<building/>` setups in economy.xml:

| Setup | Behavior |
|-------|----------|
| `init="0" load="0" respawn="0" save="0"` | No persistence, no randomization, default state after restart |
| `init="1" load="0" respawn="0" save="0"` | No persistence, doors randomized by initOpened |
| `init="1" load="1" respawn="0" save="1"` | Сохранитьs only locked doors, doors randomized by initOpened |
| `init="0" load="1" respawn="0" save="1"` | Full persistence, saves exact door state, no randomization |

#### Other Central Economy Tools

| Option | Description | Script Equivalent |
|--------|-------------|-------------------|
| **Vehicle&Wreck Vis** | Visualize objects registered to "Vehicle" avoidance. Yellow = Car, Pink = Wrecks (Building), Blue = InventoryItem | `GetCEApi().ToggleVehicleAndWreckVisualisation()` |
| **Loot Vis** | On-screen Economy Data for anything you look at (loot, infected, dynamic events) | `GetCEApi().ToggleLootVisualisation()` |
| **Cluster Vis** | On-screen Trajectory DE stats | `GetCEApi().ToggleClusterVisualisation()` |
| **Dynamic Events Status** | On-screen DE statistics | `GetCEApi().ToggleDynamicEventStatus()` |
| **Dynamic Events Vis** | Visualize and edit DE spawn points | `GetCEApi().ToggleDynamicEventVisualisation()` |
| **Dynamic Events Spawn** | Spawn a dynamic event at nearest point or "StaticChristmasTree" as fallback | `GetCEApi().DynamicEventSpawn()` |
| **Export Dyn Event** | Export DE points to `storage/export/eventSpawn_CLASSNAME.xml` | `GetCEApi().DynamicEventExport()` |
| **Overall Stats** | On-screen CE statistics | `GetCEApi().ToggleOverallStats()` |
| **Updaters State** | Shows what the CE is currently processing | -- |
| **Idle Mode** | Puts CE to sleep (stops processing) | -- |
| **Force Сохранить** | Forces saving of the entire `storage/data` folder (excludes player database) | -- |

**Dynamic Events Vis key bindings:**

| Key | Function |
|-----|----------|
| **[** | Iterate backwards through available DE |
| **]** | Iterate forwards through available DE |
| **LMB** | Insert new point for selected DE |
| **RMB** | Delete point nearest to cursor |
| **MMB** | Hold or click to rotate angle |

---

## AI

### Menu Structure

```
AI
  Show NavMesh
  Debug Pathgraph World
  Debug Path Agent
  Debug AI Agent
```

> **Важно:** AI debugging currently does not work in a multiplayer environment.

### Show NavMesh

Draws debug shapes to visualize the navigation mesh. Shows an on-screen debug with stats.

| Key | Function |
|-----|----------|
| **Numpad 0** | Register "Test start" at camera position |
| **Numpad 1** | Regenerate tile at camera position |
| **Numpad 2** | Regenerate tiles around camera position |
| **Numpad 3** | Iterate forwards through visualization types |
| **LAlt + Numpad 3** | Iterate backwards through visualization types |
| **Numpad 4** | Register "Test end" at camera position. Draws spheres and a line between start and end. Green = path found, Red = no path |
| **Numpad 5** | NavMesh nearest position test (SamplePosition). Blue sphere = query, pink sphere = result |
| **Numpad 6** | NavMesh raycast test. Blue sphere = query, pink sphere = result |

### Debug Pathgraph World

On-screen debug showing how many path job requests have been completed and how many are currently pending.

### Debug Path Agent

On-screen debug and debug shapes for an AI's pathing. Target an AI entity to select it for tracking. Use this when you are specifically interested in how an AI finds its path.

### Debug AI Agent

On-screen debug and debug shapes for an AI's alertness and behavior. Target an AI entity to select it for tracking. Use this when you want to understand an AI's decision-making and awareness state.

---

## Sounds

### Menu Structure

```
Sounds
  Show playing samples
  Show system info
```

### Show Playing Samples

Debug visualization for currently playing sounds.

| Option | Description |
|--------|-------------|
| **none** | Default, no debug |
| **ImGui** | Separate window (newest iteration). Supports filtering, full category coverage. Settings saved as `playing_sounds_imgui.ini` / `.bin` in profiles |
| **DbgUI** | Legacy. Has category filtering, more readable, but goes off-screen and lacks vehicle category |
| **Engine** | Legacy. Shows real-time color-coded data with stats, but goes off-screen and has no color legend |

### Show System Info

On-screen debug stats of the sound system (buffer counts, active sources, etc.).

---

## Useful Features for Modders

While every option has its use, these are the ones modders reach for most frequently:

### Performance Analysis

1. **FPS counter** (LCtrl + Numpad 1) -- Quick check that your mod is not destroying frame rate
2. **Script Profiler** -- Find which of your classes or functions consume the most CPU time. Set module to WORLD or MISSION to focus on your mod's script layer

### Visual Debugging

1. **Free Camera** -- Fly around to inspect spawned objects, verify positions, check AI behavior from a distance
2. **Geometry Diagnostic** -- Verify your custom model's fire geometry, view geometry, roadway LOD, and memory points without leaving the game
3. **Render Debug Mode** (RCtrl + RAlt + W) -- See wireframe overlays to check mesh density and material assignments

### Gameplay Testing

1. **Free Camera + Insert** -- Teleport your player anywhere on the map instantly
2. **Weather Override** -- Force specific fog conditions to test visibility-dependent features
3. **Central Economy tools** -- Spawn infected, animals, loot, and dynamic events on demand
4. **Combat debug** -- Trace shot trajectories, inspect hitpoint damage systems, test explosion penetration

### AI Development

1. **Show NavMesh** -- Verify that AI can actually navigate to where you expect
2. **Debug AI Agent** -- See what an infected or animal is thinking, what alert level it is at
3. **Debug Path Agent** -- См. actual path an AI is taking and whether pathfinding succeeds

---

## When to Use the Diag Menu

### During Development

- **Script Profiler** when optimizing per-frame code (OnUpdate, EOnFrame)
- **Free Camera** for positioning objects, verifying spawn locations, inspecting model placement
- **Geometry Diagnostic** immediately after importing a new model to verify LODs and geometry types
- **FPS counter** as a baseline before and after adding new features

### During Testing

- **Combat debug** to verify weapon damage, projectile behavior, explosion effects
- **CE tools** to test loot distribution, spawn points, dynamic events
- **AI debug** to verify infected/animal behavior responds correctly to player presence
- **Weather debug** to test your mod under different weather conditions

### During Bug Investigation

- **FPS counter + Script Profiler** when players report performance issues
- **Free Camera + Spacebar** (object debug) to inspect objects that are not behaving correctly
- **Render Debug Mode** to diagnose visual artifacts or material issues
- **Show Bullet** to debug physics collision problems

---

## Типичные ошибки

**Using retail executable.** The Diag Menu is only available in `DayZDiag_x64.exe`. If you press Win+Alt and nothing happens, you are running the retail build.

**Forgetting Max. Collider Distance is 0.** The physics visualization (Draw Bullet shape) will show nothing if Max. Collider Distance is still at its default of 0. Set it to at least 10-20 to see colliders around you.

**CE tools in multiplayer.** Most Central Economy debug options only work in single-player with CE enabled. Do not expect them to function on a dedicated server.

**AI debug in multiplayer.** AI debugging currently does not work in a multiplayer environment. Test AI behavior in single-player.

**Confusing "Bullet" with ammunition.** The "Enfusion World" category's "Bullet" options refer to the Bullet physics engine, not weapon ammunition. Combat-related debugging is under Game > Combat.

**Leaving profiler on.** The Script Profiler has measurable overhead. Turn it off when you are done profiling to get accurate FPS readings.

**Large collider distance values.** Setting Max. Collider Distance to 200 or 500 will tank your frame rate. Use the smallest value that covers your area of interest.

**Not enabling prerequisites.** Several options depend on others being enabled first:
- "Draw Char Ctrl" and "Draw Bullet wireframe" depend on "Draw Bullet shape"
- "Edit Volume" requires free camera
- "Project Target Loot" requires "Loot Vis" to be enabled

---

## Следующие шаги

- **Chapter 8.6: [Debugging & Testing](06-debugging-testing.md)** -- Script logs, Print debugging, file patching, and Workbench
- **Chapter 8.7: [Publishing to Workshop](07-publishing-workshop.md)** -- Package and publish your tested mod
