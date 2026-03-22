# Capitolo 4.7: Workbench Guide

[Home](../../README.md) | [<< Precedente: PBO Packing](06-pbo-packing.md) | **Workbench Guide** | [Successivo: Building Modeling >>](08-building-modeling.md)

---

## Introduzione

Workbench is Bohemia Interactive's integrated development environment for the Enfusion engine. It ships with DayZ Tools and is the only official tool that understands Enforce Script at a language level. While many modders write code in VS Code or other editors, Workbench remains indispensable for tasks no other tool can perform: attaching a debugger to a running DayZ instance, setting breakpoints, stepping through code, inspecting variables at runtime, previewing `.layout` UI files, browsing game resources, and running live script commands through the built-in console.

---

## Indice

- [What is Workbench?](#what-is-workbench)
- [Installation and Setup](#installation-and-setup)
- [Project Files (.gproj)](#project-files-gproj)
- [The Workbench Interface](#the-workbench-interface)
- [Script Editing](#script-editing)
- [Debugging Scripts](#debugging-scripts)
- [Script Console -- Live Testing](#script-console----live-testing)
- [UI / Layout Preview](#ui--layout-preview)
- [Resource Browser](#resource-browser)
- [Performance Profiling](#performance-profiling)
- [Integration with File Patching](#integration-with-file-patching)
- [Common Workbench Issues](#common-workbench-issues)
- [Tips and Best Practices](#tips-and-best-practices)

---

## Cos'e Workbench?

Workbench is Bohemia's IDE for Enfusion engine development. It is the only tool in the DayZ Tools suite that can compile, analyze, and debug Enforce Script. It serves six purposes:

| Scopo | Descrizione |
|---------|-------------|
| **Script editing** | Sintassi highlighting, code completion, and error checking for `.c` files |
| **Script debugging** | Breakpoints, variable inspection, call stack, step-through execution |
| **Resource browsing** | Navigate and preview game assets -- models, textures, configs, layouts |
| **UI / layout preview** | Visual preview of `.layout` widget hierarchies with property inspection |
| **Performance profiling** | Script profiling, frame time analysis, memory monitoring |
| **Script console** | Execute Enforce Script commands live against a running game instance |

Workbench uses the same Enfusion script compiler as DayZ itself. When Workbench reports a errore di compilazione, that error will also occur in-game -- making it a reliable pre-flight check before launching.

### Cosa NON e Workbench

- **Not a general-purpose code editor.** It lacks refactoring tools, Git integration, multi-cursor editing, and the extension ecosystem of VS Code.
- **Not a game launcher.** You still run `DayZDiag_x64.exe` separately; Workbench connects to it.
- **Not required for building PBOs.** AddonBuilder and build scripts handle PBO packing independently.

---

## Installazione e Configurazione

### Step 1: Install DayZ Tools

Workbench is included with DayZ Tools, distributed free through Steam. Open Steam Library, enable the **Tools** filter, search for **DayZ Tools**, and install (~2 GB).

### Step 2: Locate Workbench

```
Steam\steamapps\common\DayZ Tools\Bin\Workbench\
  workbenchApp.exe          <-- The Workbench executable
  dayz.gproj                <-- Default project file
```

### Step 3: Mount the P: Drive

Workbench requires the P: drive (workdrive) to be mounted. Without it, Workbench fails to start or shows an empty resource browser. Mount via DayZ Tools Launcher, your project's `SetupWorkdrive.bat`, or manually: `subst P: "D:\YourWorkDir"`.

### Step 4: Extract Vanilla Scripts

Workbench needs vanilla DayZ scripts on P: to compile your mod (since your code extends vanilla classes):

```
P:\scripts\
  1_Core\
  2_GameLib\
  3_Game\
  4_World\
  5_Mission\
```

Extract these via the DayZ Tools Launcher, or create a symbolic link to the extracted scripts directory.

### Step 4b: Link Game Install to Project Drive (for Live Hotloading)

To allow DayZDiag to load scripts directly from your Project Drive (enabling live editing without PBO rebuilds), create a symbolic link from the DayZ installation folder to `P:\scripts`:

1. Navigate to your DayZ installation folder (typically `Steam\steamapps\common\DayZ`).
2. Delete any existing `scripts` folder inside it.
3. Open a command prompt **as Administrator** and run:

```batch
mklink /J "C:\...\steamapps\common\DayZ\scripts" "P:\scripts"
```

Replace the first path with your actual DayZ installation path. After this, the DayZ install folder will contain a `scripts` junction that points to `P:\scripts`. Any changes you make on the Project Drive are immediately visible to the game.

### Step 5: Configure Source Data Directory

1. Launch `workbenchApp.exe`.
2. Click **Workbench > Options** in the menu bar.
3. Set **Source data directory** to `P:\`.
4. Click **OK** and allow Workbench to restart.

---

## Project Files (.gproj)

The `.gproj` file is Workbench's project configuration. It tells Workbench where to find scripts, which image sets to load for layout preview, and which widget styles are available.

### File Location

Convention is to place it in a `Workbench/` directory inside your mod:

```
P:\MyMod\
  Workbench\
    dayz.gproj
  Scripts\
    3_Game\
    4_World\
    5_Mission\
  config.cpp
```

### Struttura Overview

A `.gproj` uses a proprietary text format (not JSON, not XML):

```
GameProjectClass {
    ID "MyMod"
    TITLE "My Mod Name"
    Configurations {
        GameProjectConfigClass PC {
            platformHardware PC
            skeletonDefinitions "DZ/Anims/cfg/skeletons.anim.xml"

            FileSystem {
                FileSystemPathClass {
                    Name "Workdrive"
                    Directory "P:/"
                }
            }

            imageSets {
                "gui/imagesets/ccgui_enforce.imageset"
                "gui/imagesets/dayz_gui.imageset"
                "gui/imagesets/dayz_inventory.imageset"
                // ... other vanilla image sets ...
                "MyMod/gui/imagesets/my_imageset.imageset"
            }

            widgetStyles {
                "gui/looknfeel/dayzwidgets.styles"
                "gui/looknfeel/widgets.styles"
            }

            ScriptModules {
                ScriptModulePathClass {
                    Name "core"
                    Paths {
                        "scripts/1_Core"
                        "MyMod/Scripts/1_Core"
                    }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "gameLib"
                    Paths { "scripts/2_GameLib" }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "game"
                    Paths {
                        "scripts/3_Game"
                        "MyMod/Scripts/3_Game"
                    }
                    EntryPoint "CreateGame"
                }
                ScriptModulePathClass {
                    Name "world"
                    Paths {
                        "scripts/4_World"
                        "MyMod/Scripts/4_World"
                    }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "mission"
                    Paths {
                        "scripts/5_Mission"
                        "MyMod/Scripts/5_Mission"
                    }
                    EntryPoint "CreateMission"
                }
                ScriptModulePathClass {
                    Name "workbench"
                    Paths { "MyMod/Workbench/ToolAddons" }
                    EntryPoint ""
                }
            }
        }
        GameProjectConfigClass XBOX_ONE { platformHardware XBOX_ONE }
        GameProjectConfigClass PS4 { platformHardware PS4 }
        GameProjectConfigClass LINUX { platformHardware LINUX }
    }
}
```

### Key Sections Explained

**FileSystem** -- Root directories where Workbench searches for files. At minimum, include `P:/`. You can add additional paths (e.g., Steam DayZ install directory) if files live outside the workdrive.

**ScriptModules** -- The most important section. Maps each engine layer to script directories:

| Modulo | Layer | Punto di Ingresso | Scopo |
|--------|-------|------------|---------|
| `core` | `1_Core` | `""` | Engine core, basic types |
| `gameLib` | `2_GameLib` | `""` | Game library utilities |
| `game` | `3_Game` | `"CreateGame"` | Enums, constants, game init |
| `world` | `4_World` | `""` | Entities, managers |
| `mission` | `5_Mission` | `"CreateMission"` | Mission hooks, UI panels |
| `workbench` | (tools) | `""` | Workbench plugins |

Vanilla paths come first, then your mod paths. If your mod depends on other mods (like Community Framework), add their paths too:

```
ScriptModulePathClass {
    Name "game"
    Paths {
        "scripts/3_Game"              // Vanilla
        "JM/CF/Scripts/3_Game"        // Community Framework
        "MyMod/Scripts/3_Game"        // Your mod
    }
    EntryPoint "CreateGame"
}
```

Some frameworks override entry points (CF uses `"CF_CreateGame"`).

**imageSets / widgetStyles** -- Required for layout preview. Without vanilla image sets, layout files show missing images. Always include the standard 14 vanilla image sets listed in the example above.

### Path Prefix Resolution

When Workbench auto-resolves script paths from a mod's `config.cpp`, the FileSystem path is prepended. If your mod is at `P:\OtherMods\MyMod` and config.cpp declares `MyMod/scripts/3_Game`, the FileSystem must include `P:\OtherMods` for correct resolution.

### Creating and Launching

**Create a .gproj:** Copy the default `dayz.gproj` from `DayZ Tools\Bin\Workbench\`, update `ID`/`TITLE`, and add your mod's script paths to each module.

**Launch with custom project:**
```batch
workbenchApp.exe -project="P:\MyMod\Workbench\dayz.gproj"
```

**Launch with -mod (auto-configure from config.cpp):**
```batch
workbenchApp.exe -mod=P:\MyMod
workbenchApp.exe -mod=P:\CommunityFramework;P:\MyMod
```

The `-mod` approach is simpler but gives less control. For complex multi-mod setups, a custom `.gproj` is more reliable.

---

## L'Interfaccia di Workbench

### Barra del Menu Principale

| Menu | Elementi Chiave |
|------|-----------|
| **File** | Open project, recent projects, save |
| **Edit** | Cut, copy, paste, find, replace |
| **View** | Toggle panels on/off, reset layout |
| **Workbench** | Options (source data directory, preferences) |
| **Debug** | Start/stop debugging, client/server toggle, breakpoint management |
| **Plugins** | Installed Workbench plugins and tool addons |

### Pannelli

- **Resource Browser** (left) -- File tree of the P: drive. Double-click `.c` files to edit, `.layout` files to preview, `.p3d` to view models, `.paa` to view textures.
- **Script Editor** (center) -- Code editing area with syntax highlighting, code completion, error underlines, line numbers, breakpoint markers, and tabbed multi-file editing.
- **Output** (bottom) -- Compiler errors/warnings, `Print()` output from a connected game, debug messages. When connected to DayZDiag, this window streams all text that the diagnostic executable prints for debug purposes in real time -- the same output you would see in script logs. Double-click errors to navigate to the source line.
- **Properties** (right) -- Properties of the selected object. Most useful in the Layout Editor for widget inspection.
- **Console** -- Live Enforce Script command execution.
- **Debug panels** (when debugging) -- **Locals** (current scope variables), **Watch** (user expressions), **Call Stack** (function chain), **Breakpoints** (list with enable/disable toggles).

---

## Modifica degli Script

### Apertura dei File

1. **Resource Browser:** Double-click a `.c` file. This automatically opens the Script Editor module and loads the file.
2. **Script Editor Resource Browser:** The Script Editor has its own built-in Resource Browser panel, separate from the main Workbench Resource Browser. You can use either to navigate and open script files.
3. **File > Open:** Standard file dialog.
4. **Error output:** Double-click a compiler error to jump to the file and line.

### Evidenziazione della Sintassi

| Element | Highlighted |
|---------|-------------|
| Keywords (`class`, `if`, `while`, `return`, `modded`, `override`) | Bold / keyword color |
| Types (`int`, `float`, `string`, `bool`, `vector`, `void`) | Tipo color |
| Strings, comments, preprocessor directives | Distinct colors |

### Completamento del Codice

Type a class name followed by `.` to see methods and fields, or press `Ctrl+Space` for suggestions. Completion is based on the compiled script context. It is functional but limited compared to VS Code -- best for quick API lookups.

### Feedback del Compilatore

Workbench compiles on save. Common errors:

| Messaggio | Significato |
|---------|---------|
| `Undefiniscid variable 'xyz'` | Not declared or typo |
| `Method 'Foo' not found in class 'Bar'` | Wrong method name or class |
| `Cannot convert 'string' to 'int'` | Tipo mismatch |
| `Type 'MyClass' not found` | File not in project |

### Find, Replace, and Go-to-Definition

- `Ctrl+F` / `Ctrl+H` -- find/replace in current file.
- `Ctrl+Shift+F` -- search across all project files.
- Right-click a symbol and select **Go to Definition** to jump to its declaration, even into vanilla scripts.

---

## Debug degli Script

Debugging is Workbench's most powerful feature -- pause a running DayZ instance, inspect every variable, and step through code line by line.

### Prerequisiti

- **DayZDiag_x64.exe** (not retail DayZ) -- only the Diag build supports debugging.
- **P: drive mounted** with vanilla scripts extracted.
- **Scripts must match** -- if you edit after game loads, line numbers will not align.

### Configurazione di una Sessione di Debug

1. Open Workbench and load your project.
2. Open the **Script Editor** module (from the menu bar or by double-clicking any `.c` file in the Resource Browser -- this automatically opens the Script Editor and loads the file).
3. Launch DayZDiag separately:

```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -connect=127.0.0.1 -port=2302
```

4. Workbench auto-detects DayZDiag and connects. A brief popup appears in the lower-right corner of the screen confirming the connection.

> **Suggerimento:** If you only need to see console output (no breakpoints or stepping), you do not need to extract PBOs or load scripts into Workbench. The Script Editor will still connect to DayZDiag and display the Output stream. Tuttavia, breakpoints and code navigation require the matching script files to be loaded in the project.

### Punti di Interruzione

Click the left margin next to a line number. A red dot appears.

| Marcatore | Significato |
|--------|---------|
| Red dot | Active breakpoint -- execution pauses here |
| Yellow exclamation | Invalid -- this line never executes |
| Blue dot | Bookmark -- navigation marker only |

Toggle with `F9`. You can also left-click directly in the margin area (where the red dots appear) to add or remove breakpoints. Right-clicking in the margin adds a blue **Bookmark** instead -- bookmarks have no effect on execution but mark places you want to revisit. Right-click a breakpoint to set a **condition** (e.g., `i == 10` or `player.GetIdentity().GetName() == "TestPlayer"`).

### Esecuzione Passo Passo

| Azione | Scorciatoia | Descrizione |
|--------|----------|-------------|
| Continue | `F5` | Run until next breakpoint |
| Step Over | `F10` | Execute current line, move to next |
| Step Into | `F11` | Enter the called function |
| Step Out | `Shift+F11` | Run until current function returns |
| Stop | `Shift+F5` | Disconnect and resume game |

### Ispezione delle Variabili

The **Locals** panel shows all variables in scope -- primitives with values, objects with class names (expandable), arrays with lengths, and NULL references clearly marked. The **Watch** panel evaluates custom expressions at each pause. The **Call Stack** shows la funzione chain; click entries to navigate.

### Debug Client vs Server

`DayZDiag_x64.exe` can act as either a client or a server (by adding the `-server` launch parameter). It accepts all the same parameters as the retail executable. Workbench can connect to either instance.

Use **Debug > Debug Client** or **Debug > Debug Server** in the Script Editor menu to choose which side to debug. On a listen server, you can switch freely. The stepping controls, breakpoints, and variable inspection all apply to whichever side is currently selected.

### Limitazioni

- Only `DayZDiag_x64.exe` supports debugging, not retail builds.
- Engine-internal C++ functions cannot be stepped into.
- Many breakpoints in high-frequency functions (`OnUpdate`) cause severe lag.
- Large mod projects may slow Workbench indexing.

---

## Console degli Script -- Test in Tempo Reale

The Script Console lets you execute Enforce Script commands against a running game instance -- invaluable for API experimentation without editing files.

### Opening

Look for the **Console** tab in the bottom panel, or enable via **View > Console**.

### Comandi Comuni

```c
// Print player position
Print(GetGame().GetPlayer().GetPosition().ToString());

// Spawn an item at player feet
GetGame().CreateObject("AKM", GetGame().GetPlayer().GetPosition(), false, false, true);

// Test math
float dist = vector.Distance("0 0 0", "100 0 100");
Print("Distance: " + dist.ToString());

// Teleport player
GetGame().GetPlayer().SetPosition("6737 0 2505");

// Spawn zombies nearby
vector pos = GetGame().GetPlayer().GetPosition();
for (int i = 0; i < 5; i++)
{
    vector offset = Vector(Math.RandomFloat(-5, 5), 0, Math.RandomFloat(-5, 5));
    GetGame().CreateObject("ZmbF_JournalistNormal_Blue", pos + offset, false, false, true);
}
```

### Limitazioni

- **Client-side only** per impostazione predefinita (server-side code needs a listen server).
- **No persistent state** -- variables do not carry between executions.
- **Some APIs unavailable** until the game reaches a specific state (player spawned, mission loaded).
- **No error recovery** -- null pointers simply fail silently.

---

## Anteprima UI / Layout

Workbench can open `.layout` files for visual inspection.

### Cosa Puoi Fare

- **View widget hierarchy** -- see parent-child nesting and widget names.
- **Inspect properties** -- position, size, color, alpha, alignment, image source, text, font.
- **Find widget names** used by `FindAnyWidget()` in script code.
- **Check image references** -- which image set entries or textures a widget uses.

### Cosa Non Puoi Fare

- **No runtime behavior** -- ScriptClass handlers and dynamic content do not execute.
- **Rendering differences** -- transparency, layering, and resolution may differ from in-game.
- **Limited editing** -- Workbench is primarily a viewer, not a visual designer.

**Buona pratica:** Use the Layout Editor for inspection. Build and edit `.layout` files in a text editor. Test in-game with file patching.

---

## Browser delle Risorse

The Resource Browser navigates the P: drive with game-aware file previews.

### Funzionalita

| Tipo di File | Azione on Double-Click |
|-----------|----------------------|
| `.c` | Opens in Script Editor |
| `.layout` | Opens in Layout Editor |
| `.p3d` | 3D model preview (rotate, zoom, inspect LODs) |
| `.paa` / `.edds` | Texture viewer with channel inspection (R, G, B, A) |
| Config classes | Browse parsed CfgVehicles, CfgWeapons hierarchies |

### Trovare Risorse Vanilla

One of the most valuable uses -- study how Bohemia structures assets:

```
P:\DZ\weapons\        <-- Vanilla weapon models and textures
P:\DZ\characters\     <-- Character models and clothing
P:\scripts\4_World\   <-- Vanilla world scripts
P:\scripts\5_Mission\  <-- Vanilla mission scripts
```

---

## Profilazione delle Prestazioni

When connected to DayZDiag, Workbench can profile script execution.

### Cosa Mostra il Profiler

- **Function call counts** -- how often each function runs per frame.
- **Execution time** -- milliseconds per function.
- **Call hierarchy** -- which functions call which, with time attribution.
- **Frame time breakdown** -- script time vs engine time. At 60 FPS, each frame has ~16.6ms budget.
- **Memory** -- allocation counts by class, detection of ref-cycle leaks.

### In-Game Script Profiler (Diag Menu)

In addition to Workbench's profiler, `DayZDiag_x64.exe` has a built-in Script Profiler accessible through the Diag Menu (under Statistics). It shows top-20 lists for time per class, time per function, class allocations, count per function, and class instance counts. Use the `-profile` launch parameter to enable profiling from startup. The profiler only measures Enforce Script -- proto (engine) methods are not measured as separate entries, but their execution time is included in the total time of the script method that calls them. See `EnProfiler.c` in vanilla scripts for the programmatic API (`EnProfiler.Enable`, `EnProfiler.SetModule`, flag constants).

### Colli di Bottiglia Comuni

| Problema | Sintomo del Profiler | Soluzione |
|---------|-----------------|-----|
| Expensive per-frame code | High time in `OnUpdate` | Move to timers, reduce frequency |
| Excessive iteration | Loop with thousands of calls | Cache results, use spatial queries |
| String concatenation in loops | High allocation count | Reduce logging, batch strings |

---

## Integrazione con il File Patching

The fastest development workflow combines Workbench with file patching, eliminating PBO rebuilds for script changes.

### Configurazione

1. Scripts on P: drive as loose files (not in PBOs).
2. Symlink DayZ install scripts: `mklink /J "...\DayZ\scripts" "P:\scripts"`
3. Launch with `-filePatching`: both client and server use `DayZDiag_x64.exe`.

### Il Ciclo di Iterazione Rapida

```
1. Edit .c file in your editor
2. Save (file is already on P: drive)
3. Restart mission in DayZDiag (no PBO rebuild)
4. Test in-game
5. Set breakpoints in Workbench if needed
6. Repeat
```

### Cosa Deve Essere Ricostruito?

| Modifica | Ricostruire? |
|--------|----------|
| Script logica (`.c`) | No -- restart mission |
| Layout files (`.layout`) | No -- restart mission |
| Config.cpp (script-only) | No -- restart mission |
| Config.cpp (with CfgVehicles) | Yes -- binarized configs require PBO |
| Textures (`.paa`) | No -- engine reloads from P: |
| Models (`.p3d`) | Maybe -- unbinarized MLOD only |

---

## Problemi Comuni di Workbench

### Workbench Crashes on Startup

**Cause:** P: drive not mounted or `.gproj` references nonexistent paths.
**Fix:** Mount P: first. Check **Workbench > Options** source directory. Verify `.gproj` FileSystem paths exist.

### No Code Completion

**Cause:** Project misconfigured -- Workbench cannot compile scripts.
**Fix:** Verify `.gproj` ScriptModules include vanilla paths (`scripts/1_Core`, etc.). Check Output for compiler errori. Ensure vanilla scripts are on P:.

### Scripts Do Not Compile

**Fix:** Check Output panel for exact errori. Verify all dependency mod paths are in ScriptModules. Ensure no cross-layer references (3_Game cannot use 4_World types).

### Punti di Interruzione Not Hitting

**Checklist:**
1. Connected to DayZDiag (not retail)?
2. Red dot (valid) or yellow exclamation (invalid)?
3. Scripts match between Workbench and game?
4. Debugging the right side (client vs server)?
5. Code path actually reached? (Add `Print()` to verify.)

### Cannot Find Files in Resource Browser

**Fix:** Check `.gproj` FileSystem includes the directory where your files live. Restart Workbench after modifying `.gproj`.

### "Plugin Not Found" Errors

**Fix:** Verify DayZ Tools integrity via Steam (right-click > Properties > Installed Files > Verify). Reinstall if needed.

### Connection to DayZDiag Fails

**Fix:** Both processes must be on the same machine. Check firewalls. Ensure Script Editor module is open before launching DayZDiag. Try restarting both.

---

## Suggerimenti e Buone Pratiche

1. **Use Workbench for debugging, VS Code for writing.** Workbench's editor is basic. Use external editors for daily coding; switch to Workbench for debugging and layout preview.

2. **Keep a .gproj per mod.** Each mod should have its own project file to compile exactly the right script context without indexing unrelated mods.

3. **Use the console for API experimentation.** Test API calls in the console before writing them into files. Faster than edit-restart-test cycles.

4. **Profile before optimizing.** Do not guess bottlenecks. The profiler shows where time is actually spent.

5. **Set breakpoints strategically.** Avoid `OnUpdate()` breakpoints unless conditional. They fire ogni frame and freeze the game constantly.

6. **Use bookmarks for navigation.** Blue bookmark dots mark interesting vanilla script locations you reference frequently.

7. **Check compiler output before launching.** If Workbench reports errors, the game will fail too. Fix errors in Workbench first -- faster than waiting for game boot.

8. **Use -mod for simple setups, .gproj for complex.** Single-mod with no dependencies: `-mod=P:\MyMod`. Multi-mod with CF/Dabs: custom `.gproj`.

9. **Keep Workbench updated.** Update DayZ Tools through Steam when DayZ updates. Mismatched versions cause compilation failures.

---

## Riferimento Rapido: Keyboard Shortcuts

| Scorciatoia | Azione |
|----------|--------|
| `F5` | Start / Continue debugging |
| `Shift+F5` | Stop debugging |
| `F9` | Toggle breakpoint |
| `F10` | Step Over |
| `F11` | Step Into |
| `Shift+F11` | Step Out |
| `Ctrl+F` | Find in file |
| `Ctrl+H` | Find and replace |
| `Ctrl+Shift+F` | Find in project |
| `Ctrl+S` | Save |
| `Ctrl+Space` | Code completion |

## Riferimento Rapido: Launch Parameters

| Parametro | Descrizione |
|-----------|-------------|
| `-project="path/dayz.gproj"` | Load specific project file |
| `-mod=P:\MyMod` | Auto-configure from mod's config.cpp |
| `-mod=P:\ModA;P:\ModB` | Multiple mods (semicolon-separated) |

---

## Navigazione

| Precedente | Su | Successivo |
|----------|----|------|
| [4.6 PBO Packing](06-pbo-packing.md) | [Part 4: File Formats & DayZ Tools](01-textures.md) | [4.8 Building Modeling](08-building-modeling.md) |
