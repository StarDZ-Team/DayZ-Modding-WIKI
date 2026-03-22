# Chapter 8.8: Building a HUD Overlay

> **Shrnuti:** This tutorial walks you through building a custom HUD overlay that displays server information in the top-right corner of the screen. You will create a layout file, write a controller class, hook into the mission lifecycle, request data from the server via RPC, add a toggle keybind, and polish the result with fade animations and smart visibility. By the end, you will have a non-intrusive Server Info HUD showing the server name, player count, and current in-game time -- plus a solid understanding of how HUD overlays work in DayZ.

---

## Obsah

- [What We Are Building](#what-we-are-building)
- [Predpoklady](#prerequisites)
- [Mod Structure](#mod-structure)
- [Step 1: Create the Layout File](#step-1-create-the-layout-file)
- [Step 2: Create the HUD Controller Class](#step-2-create-the-hud-controller-class)
- [Step 3: Hook into MissionGameplay](#step-3-hook-into-missiongameplay)
- [Step 4: Request Data from Server](#step-4-request-data-from-server)
- [Step 5: Add Toggle with Keybind](#step-5-add-toggle-with-keybind)
- [Step 6: Polish](#step-6-polish)
- [Complete Code Reference](#complete-code-reference)
- [Extending the HUD](#extending-the-hud)
- [Caste chyby](#common-mistakes)
- [Dalsi kroky](#next-steps)

---

## What We Are Building

A small, semi-transparent panel anchored to the top-right corner of the screen that displays three lines of information:

```
  Aurora Survival [Official]
  Players: 24 / 60
  Time: 14:35
```

The panel sits below the status indicators and above the quickbar. It updates once per second (not every frame), fades in when shown and fades out when hidden, and automatically hides when the inventory or pause menu is open. The player can toggle it on and off with a configurable key (default: **F7**).

### Expected Result

When loaded, you will see a dark semi-transparent rectangle in the top-right area of the screen. White text shows the server name on the first line, the current player count on the second line, and the in-game world time on the third line. Pressing F7 smoothly fades it out; pressing F7 again fades it back in.

---

## Predpoklady

- A working mod structure (complete [Chapter 8.1](01-first-mod.md) first)
- Basic understanding of Enforce Script syntax
- Familiarity with DayZ's client-server model (the HUD runs on the client; player count comes from the server)

---

## Mod Structure

Create the following directory tree:

```
ServerInfoHUD/
    mod.cpp
    Scripts/
        config.cpp
        data/
            inputs.xml
        3_Game/
            ServerInfoHUD/
                ServerInfoRPC.c
        4_World/
            ServerInfoHUD/
                ServerInfoServer.c
        5_Mission/
            ServerInfoHUD/
                ServerInfoHUD.c
                MissionHook.c
    GUI/
        layouts/
            ServerInfoHUD.layout
```

The `3_Game` layer defines constants (our RPC ID). The `4_World` layer handles the server-side response. The `5_Mission` layer contains the HUD class and the mission hook. The layout file defines the widget tree.

---

## Step 1: Create the Layout File

Layout files (`.layout`) define the widget hierarchy in XML. DayZ's GUI system uses a coordinate model where each widget has a position and size expressed as proportional values (0.0 to 1.0 of the parent) plus pixel offsets.

### `GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <!-- Root frame: covers the full screen, does not consume input -->
    <Widget name="ServerInfoRoot" type="FrameWidgetClass">
      <Attribute name="position" value="0 0" />
      <Attribute name="size" value="1 1" />
      <Attribute name="halign" value="0" />
      <Attribute name="valign" value="0" />
      <Attribute name="hexactpos" value="0" />
      <Attribute name="vexactpos" value="0" />
      <Attribute name="hexactsize" value="0" />
      <Attribute name="vexactsize" value="0" />
      <children>
        <!-- Background panel: top-right corner -->
        <Widget name="ServerInfoPanel" type="ImageWidgetClass">
          <Attribute name="position" value="1 0" />
          <Attribute name="size" value="220 70" />
          <Attribute name="halign" value="2" />
          <Attribute name="valign" value="0" />
          <Attribute name="hexactpos" value="0" />
          <Attribute name="vexactpos" value="1" />
          <Attribute name="hexactsize" value="1" />
          <Attribute name="vexactsize" value="1" />
          <Attribute name="color" value="0 0 0 0.55" />
          <children>
            <!-- Server name text -->
            <Widget name="ServerNameText" type="TextWidgetClass">
              <Attribute name="position" value="8 6" />
              <Attribute name="size" value="204 20" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="14" />
              <Attribute name="text" value="Server Name" />
              <Attribute name="color" value="1 1 1 0.9" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
            <!-- Player count text -->
            <Widget name="PlayerCountText" type="TextWidgetClass">
              <Attribute name="position" value="8 28" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Players: - / -" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
            <!-- In-game time text -->
            <Widget name="TimeText" type="TextWidgetClass">
              <Attribute name="position" value="8 48" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Time: --:--" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
          </children>
        </Widget>
      </children>
    </Widget>
  </children>
</layoutset>
```

### Key Layout Koncepts

| Attribute | Vyznam |
|-----------|---------|
| `halign="2"` | Horizontal alignment: **right**. The widget anchors to the right edge of its parent. |
| `valign="0"` | Vertical alignment: **top**. |
| `hexactpos="0"` + `vexactpos="1"` | Horizontal position is proportional (1.0 = right edge), vertical position is in pixels. |
| `hexactsize="1"` + `vexactsize="1"` | Width and height are in pixels (220 x 70). |
| `color="0 0 0 0.55"` | RGBA as floats. Black at 55% opacity for the background panel. |

The `ServerInfoPanel` is positioned at proportional X=1.0 (right edge) with `halign="2"` (right-aligned), so the panel's right edge touches the right side of the screen. The Y position is 0 pixels from the top. This places our HUD in the top-right corner.

**Why pixel sizes for the panel?** Proportional sizing would make the panel scale with resolution, but for small info widgets you want a fixed pixel footprint so the text stays readable at all resolutions.

---

## Step 2: Create the HUD Controller Class

The controller class loads the layout, finds widgets by name, and exposes methods to update the displayed text. It extends `ScriptedWidgetEventHandler` so it can receive widget events if needed later.

### `Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Panel;
    protected TextWidget m_ServerNameText;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_TimeText;

    protected bool m_IsVisible;
    protected float m_UpdateTimer;

    // How often to refresh displayed data (seconds)
    static const float UPDATE_INTERVAL = 1.0;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
    }

    void ~ServerInfoHUD()
    {
        Destroy();
    }

    // Create and show the HUD
    void Init()
    {
        if (m_Root)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout"
        );

        if (!m_Root)
        {
            Print("[ServerInfoHUD] ERROR: Failed to load layout file.");
            return;
        }

        m_Panel = m_Root.FindAnyWidget("ServerInfoPanel");
        m_ServerNameText = TextWidget.Cast(
            m_Root.FindAnyWidget("ServerNameText")
        );
        m_PlayerCountText = TextWidget.Cast(
            m_Root.FindAnyWidget("PlayerCountText")
        );
        m_TimeText = TextWidget.Cast(
            m_Root.FindAnyWidget("TimeText")
        );

        m_Root.Show(true);
        m_IsVisible = true;

        // Request initial data from server
        RequestServerInfo();
    }

    // Remove all widgets
    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    // Called every frame from MissionGameplay.OnUpdate
    void Update(float timeslice)
    {
        if (!m_Root)
            return;

        if (!m_IsVisible)
            return;

        m_UpdateTimer += timeslice;

        if (m_UpdateTimer >= UPDATE_INTERVAL)
        {
            m_UpdateTimer = 0;
            RefreshTime();
            RequestServerInfo();
        }
    }

    // Update the in-game time display (client-side, no RPC needed)
    protected void RefreshTime()
    {
        if (!m_TimeText)
            return;

        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);

        string hourStr = hour.ToString();
        string minStr = minute.ToString();

        if (hour < 10)
            hourStr = "0" + hourStr;

        if (minute < 10)
            minStr = "0" + minStr;

        m_TimeText.SetText("Time: " + hourStr + ":" + minStr);
    }

    // Send RPC to server asking for player count and server name
    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            // Offline mode: just show local info
            SetServerName("Offline Mode");
            SetPlayerCount(1, 1);
            return;
        }

        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        ScriptRPC rpc = new ScriptRPC();
        rpc.Send(player, SIH_RPC_REQUEST_INFO, true, NULL);
    }

    // --- Setters called when data arrives ---

    void SetServerName(string name)
    {
        if (m_ServerNameText)
            m_ServerNameText.SetText(name);
    }

    void SetPlayerCount(int current, int max)
    {
        if (m_PlayerCountText)
        {
            string text = "Players: " + current.ToString()
                + " / " + max.ToString();
            m_PlayerCountText.SetText(text);
        }
    }

    // Toggle visibility
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (m_Root)
            m_Root.Show(m_IsVisible);
    }

    // Hide when menus are open
    void SetMenuState(bool menuOpen)
    {
        if (!m_Root)
            return;

        if (menuOpen)
        {
            m_Root.Show(false);
        }
        else if (m_IsVisible)
        {
            m_Root.Show(true);
        }
    }

    bool IsVisible()
    {
        return m_IsVisible;
    }

    Widget GetRoot()
    {
        return m_Root;
    }
};
```

### Important Details

1. **`CreateWidgets` path**: The path is relative to the mod root. Since we pack the `GUI/` folder inside the PBO, the engine resolves `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout` using the mod prefix.
2. **`FindAnyWidget`**: Searches the widget tree recursively by name. Always check for NULL after casting.
3. **`Widget.Unlink()`**: Properly removes the widget and all its children from the UI tree. Always call this in cleanup.
4. **Timer accumulator pattern**: We add `timeslice` each frame and act only when the accumulated time exceeds `UPDATE_INTERVAL`. This prevents doing work every single frame.

---

## Step 3: Hook into MissionGameplay

The `MissionGameplay` class is the mission controller on the client side. We use `modded class` to inject our HUD into its lifecycle without replacing the vanilla file.

### `Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        // Create the HUD overlay
        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        // Clean up BEFORE calling super
        if (m_ServerInfoHUD)
        {
            m_ServerInfoHUD.Destroy();
            m_ServerInfoHUD = NULL;
        }

        super.OnMissionFinish();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_ServerInfoHUD)
            return;

        // Hide HUD when inventory or any menu is open
        UIManager uiMgr = GetGame().GetUIManager();
        bool menuOpen = false;

        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);

        // Update HUD data (throttled internally)
        m_ServerInfoHUD.Update(timeslice);

        // Check toggle key
        Input input = GetGame().GetInput();
        if (input)
        {
            if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
            {
                m_ServerInfoHUD.ToggleVisibility();
            }
        }
    }

    // Accessor so the RPC handler can reach the HUD
    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### Why This Vzor Works

- **`OnInit`** runs once when the player enters gameplay. We create and initialize the HUD here.
- **`OnUpdate`** runs every frame. We pass `timeslice` to the HUD, which internally throttles to once per second. We also check for the toggle key press and menu visibility here.
- **`OnMissionFinish`** runs when the player disconnects or the mission ends. We destroy our widgets here to prevent memory leaks.

### Critical Rule: Always Clean Up

If you forget to destroy your widgets in `OnMissionFinish`, the widget root will leak into the next session. After a few server hops, the player ends up with stacked ghost widgets consuming memory. Always pair `Init()` with `Destroy()`.

---

## Step 4: Request Data from Server

The player count is only known on the server. We need a simple RPC (Remote Procedure Call) round-trip: the client sends a request, the server reads the data and sends it back.

### Step 4a: Define the RPC ID

RPC IDs must be unique across all mods. We define ours in the `3_Game` layer so both client and server code can reference it.

### `Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// RPC IDs for the Server Info HUD.
// Using high numbers to avoid conflicts with vanilla and other mods.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

**Why `3_Game`?** Konstanty and enums belong in the lowest layer that both client and server can access. The `3_Game` layer loads before `4_World` and `5_Mission`, so both sides can see these values.

### Step 4b: Server-Side Handler

The server listens for `SIH_RPC_REQUEST_INFO`, gathers the data, and responds with `SIH_RPC_RESPONSE_INFO`.

### `Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_REQUEST_INFO)
        {
            HandleServerInfoRequest(sender);
        }
    }

    protected void HandleServerInfoRequest(PlayerIdentity sender)
    {
        if (!sender)
            return;

        // Gather server info
        string serverName = "";
        GetGame().GetHostName(serverName);

        int playerCount = 0;
        int maxPlayers = 0;

        // Get the player list
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        playerCount = players.Count();

        // Max players from server config
        maxPlayers = GetGame().GetMaxPlayers();

        // Send response back to the requesting client
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### Step 4c: Client-Side RPC Receiver

The client receives the response and updates the HUD.

Add this to the same `ServerInfoHUD.c` file (at the bottom, outside the class), or create a separate file in `5_Mission/ServerInfoHUD/`:

Add the following **below** the `ServerInfoHUD` class in `ServerInfoHUD.c`:

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_RESPONSE_INFO)
        {
            HandleServerInfoResponse(ctx);
        }
    }

    protected void HandleServerInfoResponse(ParamsReadContext ctx)
    {
        string serverName;
        int playerCount;
        int maxPlayers;

        if (!ctx.Read(serverName))
            return;
        if (!ctx.Read(playerCount))
            return;
        if (!ctx.Read(maxPlayers))
            return;

        // Access the HUD through MissionGameplay
        MissionGameplay mission = MissionGameplay.Cast(
            GetGame().GetMission()
        );

        if (!mission)
            return;

        ServerInfoHUD hud = mission.GetServerInfoHUD();
        if (!hud)
            return;

        hud.SetServerName(serverName);
        hud.SetPlayerCount(playerCount, maxPlayers);
    }
};
```

### How the RPC Flow Works

```
CLIENT                           SERVER
  |                                |
  |--- SIH_RPC_REQUEST_INFO ----->|
  |                                | reads serverName, playerCount, maxPlayers
  |<-- SIH_RPC_RESPONSE_INFO ----|
  |                                |
  | updates HUD text              |
```

The client sends the request once per second (throttled by the update timer). The server responds with three values packed into the RPC context. The client reads them in the same order they were written.

**Dulezite:** `rpc.Write()` and `ctx.Read()` must use the same types in the same order. If the server writes a `string` then two `int` values, the client must read a `string` then two `int` values.

---

## Step 5: Add Toggle with Keybind

### Step 5a: Define the Input in `inputs.xml`

DayZ uses `inputs.xml` to register custom key actions. The file must be placed in `Scripts/data/inputs.xml` and referenced from `config.cpp`.

### `Scripts/data/inputs.xml`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAServerInfoToggle" loc="Toggle Server Info HUD" />
        </actions>
    </inputs>
    <preset>
        <input name="UAServerInfoToggle">
            <btn name="kF7" />
        </input>
    </preset>
</modded_inputs>
```

| Prvek | Ucel |
|---------|---------|
| `<actions>` | Declares the input action by name. `loc` is the display string shown in the keybinding options menu. |
| `<preset>` | Assigns the default key. `kF7` maps to the F7 key. |

### Step 5b: Reference `inputs.xml` in `config.cpp`

Your `config.cpp` must tell the engine where to find the inputs file. Add an `inputs` entry inside the `defs` block:

```cpp
class defs
{
    class gameScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/3_Game" };
    };

    class worldScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/4_World" };
    };

    class missionScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/5_Mission" };
    };

    class inputs
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/data" };
    };
};
```

### Step 5c: Read the Key Press

We already handle this in the `MissionGameplay` hook from Step 3:

```c
if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
{
    m_ServerInfoHUD.ToggleVisibility();
}
```

`GetUApi()` returns the input API singleton. `GetInputByName` looks up our registered action. `LocalPress()` returns `true` for exactly one frame when the key is pressed down.

### Key Name Reference

Common key names for `<btn>`:

| Key Name | Key |
|----------|-----|
| `kF1` through `kF12` | Function keys |
| `kH`, `kI`, etc. | Letter keys |
| `kNumpad0` through `kNumpad9` | Numpad |
| `kLControl` | Left Control |
| `kLShift` | Left Shift |
| `kLAlt` | Left Alt |

Modifikator combos use nesting:

```xml
<input name="UAServerInfoToggle">
    <btn name="kLControl">
        <btn name="kH" />
    </btn>
</input>
```

This means "hold Left Control and press H."

---

## Step 6: Polish

### 6a: Fade In/Out Animation

DayZ provides `WidgetFadeTimer` for smooth alpha transitions. Update the `ServerInfoHUD` class to use it:

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    // ... existing fields ...

    protected ref WidgetFadeTimer m_FadeTimer;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    // Replace the ToggleVisibility method:
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (!m_Root)
            return;

        if (m_IsVisible)
        {
            m_Root.Show(true);
            m_FadeTimer.FadeIn(m_Root, 0.3);
        }
        else
        {
            m_FadeTimer.FadeOut(m_Root, 0.3);
        }
    }

    // ... rest of class ...
};
```

`FadeIn(widget, duration)` animates the widget's alpha from 0 to 1 over the given duration in seconds. `FadeOut` goes from 1 to 0 and hides the widget when done.

### 6b: Background Panel with Alpha

We already set this in the layout (`color="0 0 0 0.55"`), giving a dark overlay at 55% opacity. If you want to adjust the alpha at runtime:

```c
void SetBackgroundAlpha(float alpha)
{
    if (m_Panel)
    {
        int color = ARGB(
            (int)(alpha * 255),
            0, 0, 0
        );
        m_Panel.SetColor(color);
    }
}
```

The `ARGB()` function takes integer values 0-255 for alpha, red, green, and blue.

### 6c: Font and Color Choices

DayZ ships several fonts you can reference in layouts:

| Font Path | Style |
|-----------|-------|
| `gui/fonts/MetronBook` | Clean sans-serif (used in vanilla HUD) |
| `gui/fonts/MetronMedium` | Bolder version of MetronBook |
| `gui/fonts/Metron` | Thinnest variant |
| `gui/fonts/luxuriousscript` | Decorative script (avoid for HUD) |

To change text color at runtime:

```c
void SetTextColor(TextWidget widget, int r, int g, int b, int a)
{
    if (widget)
        widget.SetColor(ARGB(a, r, g, b));
}
```

### 6d: Respecting Other UI

Our `MissionHook.c` already detects when a menu is open and calls `SetMenuState(true)`. Here is a more thorough approach that checks the inventory specifically:

```c
// In the OnUpdate override of modded MissionGameplay:
bool menuOpen = false;

UIManager uiMgr = GetGame().GetUIManager();
if (uiMgr)
{
    UIScriptedMenu topMenu = uiMgr.GetMenu();
    if (topMenu)
        menuOpen = true;
}

// Also check if inventory is open
if (uiMgr && uiMgr.FindMenu(MENU_INVENTORY))
    menuOpen = true;

m_ServerInfoHUD.SetMenuState(menuOpen);
```

This ensures your HUD hides behind the inventory screen, the pause menu, the options screen, and any other scripted menu.

---

## Complete Code Reference

Below is every file in the mod, in its final form with all polish applied.

### File 1: `ServerInfoHUD/mod.cpp`

```cpp
name = "Server Info HUD";
author = "YourName";
version = "1.0";
overview = "Displays server name, player count, and in-game time.";
```

### File 2: `ServerInfoHUD/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class ServerInfoHUD_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Scripts"
        };
    };
};

class CfgMods
{
    class ServerInfoHUD
    {
        dir = "ServerInfoHUD";
        name = "Server Info HUD";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/3_Game" };
            };

            class worldScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/4_World" };
            };

            class missionScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/5_Mission" };
            };

            class inputs
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/data" };
            };
        };
    };
};
```

### File 3: `ServerInfoHUD/Scripts/data/inputs.xml`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAServerInfoToggle" loc="Toggle Server Info HUD" />
        </actions>
    </inputs>
    <preset>
        <input name="UAServerInfoToggle">
            <btn name="kF7" />
        </input>
    </preset>
</modded_inputs>
```

### File 4: `ServerInfoHUD/Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// RPC IDs for Server Info HUD.
// Use high numbers to avoid collisions with vanilla ERPCs and other mods.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

### File 5: `ServerInfoHUD/Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        // Only the server handles this RPC
        if (!GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_REQUEST_INFO)
        {
            HandleServerInfoRequest(sender);
        }
    }

    protected void HandleServerInfoRequest(PlayerIdentity sender)
    {
        if (!sender)
            return;

        // Get server name
        string serverName = "";
        GetGame().GetHostName(serverName);

        // Count players
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        int playerCount = players.Count();

        // Get max player slots
        int maxPlayers = GetGame().GetMaxPlayers();

        // Send the data back to the requesting client
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### File 6: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Panel;
    protected TextWidget m_ServerNameText;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_TimeText;

    protected bool m_IsVisible;
    protected float m_UpdateTimer;
    protected ref WidgetFadeTimer m_FadeTimer;

    static const float UPDATE_INTERVAL = 1.0;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    void ~ServerInfoHUD()
    {
        Destroy();
    }

    void Init()
    {
        if (m_Root)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout"
        );

        if (!m_Root)
        {
            Print("[ServerInfoHUD] ERROR: Failed to load layout.");
            return;
        }

        m_Panel = m_Root.FindAnyWidget("ServerInfoPanel");
        m_ServerNameText = TextWidget.Cast(
            m_Root.FindAnyWidget("ServerNameText")
        );
        m_PlayerCountText = TextWidget.Cast(
            m_Root.FindAnyWidget("PlayerCountText")
        );
        m_TimeText = TextWidget.Cast(
            m_Root.FindAnyWidget("TimeText")
        );

        m_Root.Show(true);
        m_IsVisible = true;

        RequestServerInfo();
    }

    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    void Update(float timeslice)
    {
        if (!m_Root || !m_IsVisible)
            return;

        m_UpdateTimer += timeslice;

        if (m_UpdateTimer >= UPDATE_INTERVAL)
        {
            m_UpdateTimer = 0;
            RefreshTime();
            RequestServerInfo();
        }
    }

    protected void RefreshTime()
    {
        if (!m_TimeText)
            return;

        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);

        string hourStr = hour.ToString();
        string minStr = minute.ToString();

        if (hour < 10)
            hourStr = "0" + hourStr;

        if (minute < 10)
            minStr = "0" + minStr;

        m_TimeText.SetText("Time: " + hourStr + ":" + minStr);
    }

    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            SetServerName("Offline Mode");
            SetPlayerCount(1, 1);
            return;
        }

        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        ScriptRPC rpc = new ScriptRPC();
        rpc.Send(player, SIH_RPC_REQUEST_INFO, true, NULL);
    }

    void SetServerName(string name)
    {
        if (m_ServerNameText)
            m_ServerNameText.SetText(name);
    }

    void SetPlayerCount(int current, int max)
    {
        if (m_PlayerCountText)
        {
            string text = "Players: " + current.ToString()
                + " / " + max.ToString();
            m_PlayerCountText.SetText(text);
        }
    }

    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (!m_Root)
            return;

        if (m_IsVisible)
        {
            m_Root.Show(true);
            m_FadeTimer.FadeIn(m_Root, 0.3);
        }
        else
        {
            m_FadeTimer.FadeOut(m_Root, 0.3);
        }
    }

    void SetMenuState(bool menuOpen)
    {
        if (!m_Root)
            return;

        if (menuOpen)
        {
            m_Root.Show(false);
        }
        else if (m_IsVisible)
        {
            m_Root.Show(true);
        }
    }

    bool IsVisible()
    {
        return m_IsVisible;
    }

    Widget GetRoot()
    {
        return m_Root;
    }
};

// -----------------------------------------------
// Client-side RPC receiver
// -----------------------------------------------
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_RESPONSE_INFO)
        {
            HandleServerInfoResponse(ctx);
        }
    }

    protected void HandleServerInfoResponse(ParamsReadContext ctx)
    {
        string serverName;
        int playerCount;
        int maxPlayers;

        if (!ctx.Read(serverName))
            return;
        if (!ctx.Read(playerCount))
            return;
        if (!ctx.Read(maxPlayers))
            return;

        MissionGameplay mission = MissionGameplay.Cast(
            GetGame().GetMission()
        );
        if (!mission)
            return;

        ServerInfoHUD hud = mission.GetServerInfoHUD();
        if (!hud)
            return;

        hud.SetServerName(serverName);
        hud.SetPlayerCount(playerCount, maxPlayers);
    }
};
```

### File 7: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        if (m_ServerInfoHUD)
        {
            m_ServerInfoHUD.Destroy();
            m_ServerInfoHUD = NULL;
        }

        super.OnMissionFinish();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_ServerInfoHUD)
            return;

        // Detect open menus
        bool menuOpen = false;
        UIManager uiMgr = GetGame().GetUIManager();
        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);
        m_ServerInfoHUD.Update(timeslice);

        // Toggle key
        if (GetUApi().GetInputByName(
            "UAServerInfoToggle"
        ).LocalPress())
        {
            m_ServerInfoHUD.ToggleVisibility();
        }
    }

    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### File 8: `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <Widget name="ServerInfoRoot" type="FrameWidgetClass">
      <Attribute name="position" value="0 0" />
      <Attribute name="size" value="1 1" />
      <Attribute name="halign" value="0" />
      <Attribute name="valign" value="0" />
      <Attribute name="hexactpos" value="0" />
      <Attribute name="vexactpos" value="0" />
      <Attribute name="hexactsize" value="0" />
      <Attribute name="vexactsize" value="0" />
      <children>
        <Widget name="ServerInfoPanel" type="ImageWidgetClass">
          <Attribute name="position" value="1 0" />
          <Attribute name="size" value="220 70" />
          <Attribute name="halign" value="2" />
          <Attribute name="valign" value="0" />
          <Attribute name="hexactpos" value="0" />
          <Attribute name="vexactpos" value="1" />
          <Attribute name="hexactsize" value="1" />
          <Attribute name="vexactsize" value="1" />
          <Attribute name="color" value="0 0 0 0.55" />
          <children>
            <Widget name="ServerNameText" type="TextWidgetClass">
              <Attribute name="position" value="8 6" />
              <Attribute name="size" value="204 20" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="14" />
              <Attribute name="text" value="Server Name" />
              <Attribute name="color" value="1 1 1 0.9" />
            </Widget>
            <Widget name="PlayerCountText" type="TextWidgetClass">
              <Attribute name="position" value="8 28" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Players: - / -" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
            </Widget>
            <Widget name="TimeText" type="TextWidgetClass">
              <Attribute name="position" value="8 48" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Time: --:--" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
            </Widget>
          </children>
        </Widget>
      </children>
    </Widget>
  </children>
</layoutset>
```

---

## Extending the HUD

Once you have the basic HUD working, here are natural extensions.

### Adding FPS Display

FPS can be read client-side without any RPC:

```c
// Add a TextWidget m_FPSText field and find it in Init()

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    float fps = 1.0 / GetGame().GetDeltaT();
    m_FPSText.SetText("FPS: " + Math.Round(fps).ToString());
}
```

Call `RefreshFPS()` alongside `RefreshTime()` in the update method. Note that `GetDeltaT()` returns the time of the current frame, so the FPS value will fluctuate. For a smoother display, average over several frames:

```c
protected float m_FPSAccum;
protected int m_FPSFrames;

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    m_FPSAccum += GetGame().GetDeltaT();
    m_FPSFrames++;

    float avgFPS = m_FPSFrames / m_FPSAccum;
    m_FPSText.SetText("FPS: " + Math.Round(avgFPS).ToString());

    // Reset every second (when main timer fires)
    m_FPSAccum = 0;
    m_FPSFrames = 0;
}
```

### Adding Player Position

```c
protected void RefreshPosition()
{
    if (!m_PositionText)
        return;

    Man player = GetGame().GetPlayer();
    if (!player)
        return;

    vector pos = player.GetPosition();
    string text = "Pos: " + Math.Round(pos[0]).ToString()
        + " / " + Math.Round(pos[2]).ToString();
    m_PositionText.SetText(text);
}
```

### Multiple HUD Panels

For multiple panels (compass, status, minimap), create a parent manager class that holds an array of HUD elements:

```c
class HUDManager
{
    protected ref array<ref ServerInfoHUD> m_Panels;

    void HUDManager()
    {
        m_Panels = new array<ref ServerInfoHUD>();
    }

    void AddPanel(ServerInfoHUD panel)
    {
        m_Panels.Insert(panel);
    }

    void UpdateAll(float timeslice)
    {
        int count = m_Panels.Count();
        int i = 0;
        while (i < count)
        {
            m_Panels.Get(i).Update(timeslice);
            i++;
        }
    }
};
```

### Draggable HUD Prveks

Making a widget draggable requires handling mouse events via `ScriptedWidgetEventHandler`:

```c
class DraggableHUD : ScriptedWidgetEventHandler
{
    protected bool m_Dragging;
    protected float m_OffsetX;
    protected float m_OffsetY;
    protected Widget m_DragWidget;

    override bool OnMouseButtonDown(Widget w, int x, int y, int button)
    {
        if (w == m_DragWidget && button == 0)
        {
            m_Dragging = true;
            float wx, wy;
            m_DragWidget.GetScreenPos(wx, wy);
            m_OffsetX = x - wx;
            m_OffsetY = y - wy;
            return true;
        }
        return false;
    }

    override bool OnMouseButtonUp(Widget w, int x, int y, int button)
    {
        if (button == 0)
            m_Dragging = false;
        return false;
    }

    override bool OnUpdate(Widget w, int x, int y, int oldX, int oldY)
    {
        if (m_Dragging && m_DragWidget)
        {
            m_DragWidget.SetPos(x - m_OffsetX, y - m_OffsetY);
            return true;
        }
        return false;
    }
};
```

Poznamka: for dragging to work, the widget must have `SetHandler(this)` called on it so the event handler receives events. Also, the cursor must be visible, which limits draggable HUDs to situations where a menu or edit mode is active.

---

## Caste chyby

### 1. Updating Every Frame Instead of Throttled

**Wrong:**

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);
    m_ServerInfoHUD.RefreshTime();      // Runs 60+ times per second!
    m_ServerInfoHUD.RequestServerInfo(); // Sends 60+ RPCs per second!
}
```

**Right:** Use a timer accumulator (as shown in the tutorial) so expensive operations run at most once per second. HUD text that changes every frame (like an FPS counter) is fine to update per-frame, but RPC requests must be throttled.

### 2. Not Cleaning Up in OnMissionFinish

**Wrong:**

```c
modded class MissionGameplay
{
    ref ServerInfoHUD m_HUD;

    override void OnInit()
    {
        super.OnInit();
        m_HUD = new ServerInfoHUD();
        m_HUD.Init();
        // No cleanup anywhere -- widget leaks on disconnect!
    }
};
```

**Right:** Always destroy widgets and null references in `OnMissionFinish()`. The destructor (`~ServerInfoHUD`) is a safety net, but do not rely on it -- `OnMissionFinish` is the correct place for explicit cleanup.

### 3. HUD Behind Other UI Prveks

Widgets created later render on top of widgets created earlier. If your HUD appears behind vanilla UI, it was created too early. Solutions:

- Create the HUD later in the initialization sequence (e.g., on the first `OnUpdate` call rather than in `OnInit`).
- Use `m_Root.SetSort(100)` to force a higher sort order, pushing your widget above others.

### 4. Requesting Data Too Frequently (RPC Spam)

Sending an RPC every frame creates 60+ network packets per second per connected player. On a 60-player server, that is 3,600 packets per second of unnecessary traffic. Always throttle RPC requests. Once per second is reasonable for non-critical info. For data that rarely changes (like server name), you could request it only once at init and cache it.

### 5. Forgetting the `super` Call

```c
// WRONG: breaks vanilla HUD functionality
override void OnInit()
{
    m_HUD = new ServerInfoHUD();
    m_HUD.Init();
    // Missing super.OnInit()! Vanilla HUD will not initialize.
}
```

Always call `super.OnInit()` (and `super.OnUpdate()`, `super.OnMissionFinish()`) first. Omitting the super call breaks the vanilla implementation and every other mod that hooks the same method.

### 6. Using Wrong Script Layer

If you try to reference `MissionGameplay` from `4_World`, you will get an "Undefined type" error because `5_Mission` types are not visible to `4_World`. The RPC constants go in `3_Game`, the server handler goes in `4_World` (modding `PlayerBase` which lives there), and the HUD class and mission hook go in `5_Mission`.

### 7. Hardcoded Layout Path

The layout path in `CreateWidgets()` is relative to the game's search paths. If your PBO prefix does not match the path string, the layout will not load and `CreateWidgets` returns NULL. Always check for NULL after `CreateWidgets` and log an error if it fails.

---

## Dalsi kroky

Now that you have a working HUD overlay, consider these progressions:

1. **Save user preferences** -- Store whether the HUD is visible in a local JSON file so the toggle state persists across sessions. See [Chapter 4.5: Player Data](../04-scripting-guide/05-persistence.md).
2. **Add server-side configuration** -- Let server admins enable/disable the HUD or choose which fields to show via a JSON config file.
3. **Build an admin overlay** -- Expand the HUD to show admin-only information (server performance, entity count, restart timer) using permission checks.
4. **Create a compass HUD** -- Use `GetGame().GetCurrentCameraDirection()` to calculate heading and display a compass bar at the top of the screen.
5. **Study existing mods** -- Look at DayZ Expansion's quest HUD and Colorful UI's overlay system for production-quality HUD implementations.

---

## Doporucene postupy

- **Throttle `OnUpdate` to 1-second intervals minimum.** Use a timer accumulator to avoid running expensive operations (RPC requests, text formatting) 60+ times per second. Only per-frame visuals like FPS counters should update every frame.
- **Hide the HUD when inventory or any menu is open.** Check `GetGame().GetUIManager().GetMenu()` on each update and suppress your overlay. Overlapping UI elements confuse players and block interaction.
- **Always clean up widgets in `OnMissionFinish`.** Leaked widget roots persist across server hops, stacking ghost panels that consume memory and eventually cause visual glitches.
- **Use `SetSort()` to control render order.** If your HUD appears behind vanilla elements, call `m_Root.SetSort(100)` to push it above. Without explicit sort order, creation timing determines layering.
- **Cache server data that rarely changes.** The server name does not change during a session. Request it once at init and cache it locally instead of re-requesting it every second.

---

## Teorie vs praxe

| Koncept | Teorie | Realita |
|---------|--------|---------|
| `OnUpdate(float timeslice)` | Called once per frame with the frame delta time | On a 144 FPS client, this fires 144 times per second. Sending an RPC each call creates 144 network packets/second per player. Always accumulate `timeslice` and act only when the sum exceeds your interval. |
| `CreateWidgets()` layout path | Loads the layout from the path you provide | The path is relative to the PBO prefix, not the file system. If your PBO prefix does not match the path string, `CreateWidgets` silently returns NULL with no error in the log. |
| `WidgetFadeTimer` | Smoothly animates widget opacity | `FadeOut` hides the widget after the animation completes, but `FadeIn` does NOT call `Show(true)` first. You must manually show the widget before calling `FadeIn`, or nothing appears. |
| `GetUApi().GetInputByName()` | Vraci the input action for your custom keybind | If `inputs.xml` is not referenced in `config.cpp` under `class inputs`, the action name is unknown and `GetInputByName` returns null, causing a crash on `.LocalPress()`. |

---

## What You Learned

In this tutorial you learned:
- How to create a HUD layout with anchored, semi-transparent panels
- How to build a controller class that throttles updates to a fixed interval
- How to hook into `MissionGameplay` for HUD lifecycle management (init, update, cleanup)
- How to request server data via RPC and display it on the client
- How to register a custom keybind via `inputs.xml` and toggle HUD visibility with fade animations

**Predchozi:** [Chapter 8.7: Publishing to Steam Workshop](07-publishing-workshop.md)
