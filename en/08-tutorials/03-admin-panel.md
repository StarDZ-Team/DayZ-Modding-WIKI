# Chapter 8.3: Building an Admin Panel Module

[Home](../README.md) | [<< Previous: Creating a Custom Item](02-custom-item.md) | **Building an Admin Panel** | [Next: Adding Chat Commands >>](04-chat-commands.md)

---

> **Summary:** This tutorial walks you through building a complete admin panel module from scratch. You will create a UI layout, bind widgets in script, handle button clicks, send an RPC from client to server, process the request on the server, send a response back, and display the result in the UI. This covers the full client-server-client roundtrip that every networked mod needs.

---

## Table of Contents

- [What We Are Building](#what-we-are-building)
- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Step 1: Create the Module Class](#step-1-create-the-module-class)
- [Step 2: Create the Layout File](#step-2-create-the-layout-file)
- [Step 3: Bind Widgets in OnActivated](#step-3-bind-widgets-in-onactivated)
- [Step 4: Handle Button Clicks](#step-4-handle-button-clicks)
- [Step 5: Send an RPC to the Server](#step-5-send-an-rpc-to-the-server)
- [Step 6: Handle the Server-Side Response](#step-6-handle-the-server-side-response)
- [Step 7: Update the UI with Received Data](#step-7-update-the-ui-with-received-data)
- [Step 8: Register the Module](#step-8-register-the-module)
- [Complete File Reference](#complete-file-reference)
- [The Full Roundtrip Explained](#the-full-roundtrip-explained)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## What We Are Building

We will create an **Admin Player Info** panel that:

1. Shows a "Refresh" button in a simple UI panel
2. When the admin clicks Refresh, sends an RPC to the server requesting player count data
3. The server receives the request, gathers the information, and sends it back
4. The client receives the response and displays the player count and list in the UI

This demonstrates the fundamental pattern used by every networked admin tool, mod configuration panel, and multiplayer UI in DayZ.

---

## Prerequisites

- A working mod from [Chapter 8.1](01-first-mod.md) or a new mod with the standard structure
- Understanding of the [5-Layer Script Hierarchy](../02-mod-structure/01-five-layers.md) (we will use `3_Game`, `4_World`, and `5_Mission`)
- Basic comfort reading Enforce Script code

### Mod Structure for This Tutorial

We will create these new files:

```
AdminDemo/
    mod.cpp
    GUI/
        layouts/
            admin_player_info.layout
    Scripts/
        config.cpp
        3_Game/
            AdminDemo/
                AdminDemoRPC.c
        4_World/
            AdminDemo/
                AdminDemoServer.c
        5_Mission/
            AdminDemo/
                AdminDemoPanel.c
                AdminDemoMission.c
```

---

## Architecture Overview

Before writing code, understand the data flow:

```
CLIENT                              SERVER
------                              ------

1. Admin clicks "Refresh"
2. Client sends RPC ------>  3. Server receives RPC
   (AdminDemo_RequestInfo)       Gathers player data
                             4. Server sends RPC ------>  CLIENT
                                (AdminDemo_ResponseInfo)
                                                     5. Client receives RPC
                                                        Updates UI text
```

The RPC (Remote Procedure Call) system is how client and server communicate in DayZ. The engine provides `GetGame().RPCSingleParam()` and `GetGame().RPC()` methods to send data, and an `OnRPC()` override to receive it.

**Key constraints:**
- Clients cannot directly read server-side data (player list, server state)
- All cross-boundary communication must go through RPC
- RPC messages are identified by integer IDs
- Data is sent as serialized parameters using `Param` classes

---

## Step 1: Create the Module Class

First, define the RPC identifiers in `3_Game` (the earliest layer where game types are available). RPC IDs must be defined in `3_Game` because both `4_World` (server handler) and `5_Mission` (client handler) need to reference them.

### Create `Scripts/3_Game/AdminDemo/AdminDemoRPC.c`

```c
class AdminDemoRPC
{
    // RPC IDs -- pick unique numbers that do not collide with other mods
    // Using high numbers reduces collision risk
    static const int REQUEST_PLAYER_INFO  = 78001;
    static const int RESPONSE_PLAYER_INFO = 78002;
};
```

These constants will be used by both the client (to send requests) and the server (to identify incoming requests and send responses).

### Why 3_Game?

RPC IDs are pure data -- integers with no dependency on world entities or UI. Placing them in `3_Game` makes them visible to both `4_World` (where the server handler lives) and `5_Mission` (where the client UI lives).

---

## Step 2: Create the Layout File

The layout file defines the visual structure of your panel. DayZ uses a custom text-based format (not XML) for `.layout` files.

### Create `GUI/layouts/admin_player_info.layout`

```
FrameWidgetClass AdminDemoPanel {
 size 0.4 0.5
 position 0.3 0.25
 hexactpos 0
 vexactpos 0
 hexactsize 0
 vexactsize 0
 {
  ImageWidgetClass Background {
   size 1 1
   position 0 0
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   color 0.1 0.1 0.1 0.85
  }
  TextWidgetClass Title {
   size 1 0.08
   position 0 0.02
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Player Info Panel"
   "text halign" center
   "text valign" center
   color 1 1 1 1
   font "gui/fonts/MetronBook"
  }
  ButtonWidgetClass RefreshButton {
   size 0.3 0.08
   position 0.35 0.12
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Refresh"
   "text halign" center
   "text valign" center
   color 0.2 0.6 1.0 1.0
  }
  TextWidgetClass PlayerCountText {
   size 1 0.06
   position 0 0.22
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Player Count: --"
   "text halign" center
   "text valign" center
   color 0.9 0.9 0.9 1
   font "gui/fonts/MetronBook"
  }
  TextWidgetClass PlayerListText {
   size 0.9 0.55
   position 0.05 0.3
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Click Refresh to load player data..."
   "text halign" left
   "text valign" top
   color 0.8 0.8 0.8 1
   font "gui/fonts/MetronBook"
  }
  ButtonWidgetClass CloseButton {
   size 0.2 0.06
   position 0.4 0.9
   hexactpos 0
   vexactpos 0
   hexactsize 0
   vexactsize 0
   text "Close"
   "text halign" center
   "text valign" center
   color 1.0 0.3 0.3 1.0
  }
 }
}
```

### Layout Breakdown

| Widget | Purpose |
|--------|---------|
| `AdminDemoPanel` | Root frame, 40% wide and 50% tall, centered on screen |
| `Background` | Dark semi-transparent background filling the entire panel |
| `Title` | "Player Info Panel" text at the top |
| `RefreshButton` | Button the admin clicks to request data |
| `PlayerCountText` | Displays the player count number |
| `PlayerListText` | Displays the list of player names |
| `CloseButton` | Closes the panel |

All sizes use proportional coordinates (0.0 to 1.0 relative to parent) because `hexactsize` and `vexactsize` are set to `0`.

---

## Step 3: Bind Widgets in OnActivated

Now create the client-side panel script that loads the layout and connects widgets to variables.

### Create `Scripts/5_Mission/AdminDemo/AdminDemoPanel.c`

```c
class AdminDemoPanel extends ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected ButtonWidget m_RefreshButton;
    protected ButtonWidget m_CloseButton;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_PlayerListText;

    protected bool m_IsOpen;

    void AdminDemoPanel()
    {
        m_IsOpen = false;
    }

    void ~AdminDemoPanel()
    {
        Close();
    }

    // -------------------------------------------------------
    // Open the panel: create widgets and bind references
    // -------------------------------------------------------
    void Open()
    {
        if (m_IsOpen)
            return;

        // Load the layout file and get the root widget
        m_Root = GetGame().GetWorkspace().CreateWidgets("AdminDemo/GUI/layouts/admin_player_info.layout");
        if (!m_Root)
        {
            Print("[AdminDemo] ERROR: Failed to load layout file!");
            return;
        }

        // Bind widget references by name
        m_RefreshButton  = ButtonWidget.Cast(m_Root.FindAnyWidget("RefreshButton"));
        m_CloseButton    = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));
        m_PlayerCountText = TextWidget.Cast(m_Root.FindAnyWidget("PlayerCountText"));
        m_PlayerListText  = TextWidget.Cast(m_Root.FindAnyWidget("PlayerListText"));

        // Register this class as the event handler for our widgets
        if (m_RefreshButton)
            m_RefreshButton.SetHandler(this);

        if (m_CloseButton)
            m_CloseButton.SetHandler(this);

        m_Root.Show(true);
        m_IsOpen = true;

        // Show the mouse cursor so the admin can click buttons
        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print("[AdminDemo] Panel opened.");
    }

    // -------------------------------------------------------
    // Close the panel: destroy widgets and restore controls
    // -------------------------------------------------------
    void Close()
    {
        if (!m_IsOpen)
            return;

        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }

        m_IsOpen = false;

        // Restore player controls and hide cursor
        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print("[AdminDemo] Panel closed.");
    }

    bool IsOpen()
    {
        return m_IsOpen;
    }

    // -------------------------------------------------------
    // Toggle open/close
    // -------------------------------------------------------
    void Toggle()
    {
        if (m_IsOpen)
            Close();
        else
            Open();
    }

    // -------------------------------------------------------
    // Handle button click events
    // -------------------------------------------------------
    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_RefreshButton)
        {
            OnRefreshClicked();
            return true;
        }

        if (w == m_CloseButton)
        {
            Close();
            return true;
        }

        return false;
    }

    // -------------------------------------------------------
    // Called when admin clicks Refresh
    // -------------------------------------------------------
    protected void OnRefreshClicked()
    {
        Print("[AdminDemo] Refresh clicked, sending RPC to server...");

        // Update UI to show loading state
        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: Loading...");

        if (m_PlayerListText)
            m_PlayerListText.SetText("Requesting data from server...");

        // Send RPC to server
        // Parameters: target object, RPC ID, data, recipient (null = server)
        Man player = GetGame().GetPlayer();
        if (player)
        {
            Param1<bool> params = new Param1<bool>(true);
            GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
        }
    }

    // -------------------------------------------------------
    // Called when server response arrives (from mission OnRPC)
    // -------------------------------------------------------
    void OnPlayerInfoReceived(int playerCount, string playerNames)
    {
        Print("[AdminDemo] Received player info: " + playerCount.ToString() + " players");

        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: " + playerCount.ToString());

        if (m_PlayerListText)
            m_PlayerListText.SetText(playerNames);
    }
};
```

### Key Concepts

**`CreateWidgets()`** loads the `.layout` file and creates actual widget objects in memory. It returns the root widget.

**`FindAnyWidget("name")`** searches the widget tree for a widget with the given name. The name must match the widget name in the layout file exactly.

**`Cast()`** converts the generic `Widget` reference to a specific type (like `ButtonWidget`). This is required because `FindAnyWidget` returns the base `Widget` type.

**`SetHandler(this)`** registers this class as the event handler for the widget. When the button is clicked, the engine calls `OnClick()` on this object.

**`PlayerControlDisable` / `PlayerControlEnable`** disables/re-enables player movement and actions. Without this, the player would walk around while trying to click buttons.

---

## Step 4: Handle Button Clicks

The button click handling is already implemented in Step 3's `OnClick()` method. Let us examine the pattern more closely.

### The OnClick Pattern

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_RefreshButton)
    {
        OnRefreshClicked();
        return true;    // Event consumed -- stop propagation
    }

    if (w == m_CloseButton)
    {
        Close();
        return true;
    }

    return false;        // Event not consumed -- let it propagate
}
```

**Parameters:**
- `w` -- The widget that was clicked
- `x`, `y` -- Mouse coordinates at the time of the click
- `button` -- Which mouse button (0 = left, 1 = right, 2 = middle)

**Return value:**
- `true` means you handled the event. It stops propagating to parent widgets.
- `false` means you did not handle it. The engine passes it to the next handler.

**Pattern:** Compare the clicked widget `w` against your known widget references. Call a handler method for each recognized button. Return `true` for handled clicks, `false` for everything else.

---

## Step 5: Send an RPC to the Server

When the admin clicks Refresh, we need to send a message from the client to the server. DayZ provides the RPC system for this.

### RPC Sending (Client to Server)

The core send call from Step 3:

```c
Man player = GetGame().GetPlayer();
if (player)
{
    Param1<bool> params = new Param1<bool>(true);
    GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
}
```

**`GetGame().RPCSingleParam(target, rpcID, params, guaranteed)`:**

| Parameter | Meaning |
|-----------|---------|
| `target` | The object this RPC is associated with. Using the player is standard. |
| `rpcID` | Your unique integer identifier (defined in `AdminDemoRPC`). |
| `params` | A `Param` object carrying the data payload. |
| `guaranteed` | `true` = TCP-like reliable delivery. `false` = UDP-like fire-and-forget. Always use `true` for admin operations. |

### Param Classes

DayZ provides template `Param` classes for sending data:

| Class | Usage |
|-------|-------|
| `Param1<T>` | One value |
| `Param2<T1, T2>` | Two values |
| `Param3<T1, T2, T3>` | Three values |

You can send strings, ints, floats, bools, and vectors. Example with multiple values:

```c
Param3<string, int, float> data = new Param3<string, int, float>("hello", 42, 3.14);
GetGame().RPCSingleParam(player, MY_RPC_ID, data, true);
```

---

## Step 6: Handle the Server-Side Response

The server receives the client's RPC, gathers data, and sends a response back.

### Create `Scripts/4_World/AdminDemo/AdminDemoServer.c`

```c
modded class PlayerBase
{
    // -------------------------------------------------------
    // Server-side RPC handler
    // -------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        // Only handle on server
        if (!GetGame().IsServer())
            return;

        switch (rpc_type)
        {
            case AdminDemoRPC.REQUEST_PLAYER_INFO:
                HandlePlayerInfoRequest(sender);
                break;
        }
    }

    // -------------------------------------------------------
    // Gather player data and send response
    // -------------------------------------------------------
    protected void HandlePlayerInfoRequest(PlayerIdentity requestor)
    {
        if (!requestor)
            return;

        Print("[AdminDemo] Server received player info request from: " + requestor.GetName());

        // --- Permission check (optional but recommended) ---
        // In a real mod, check if the requestor is an admin:
        // if (!IsAdmin(requestor))
        //     return;

        // --- Gather player data ---
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        int playerCount = players.Count();
        string playerNames = "";

        for (int i = 0; i < playerCount; i++)
        {
            Man man = players.Get(i);
            if (man)
            {
                PlayerIdentity identity = man.GetIdentity();
                if (identity)
                {
                    if (playerNames != "")
                        playerNames = playerNames + "\n";

                    playerNames = playerNames + (i + 1).ToString() + ". " + identity.GetName();
                }
            }
        }

        if (playerNames == "")
            playerNames = "(No players connected)";

        // --- Send response back to the requesting client ---
        Param2<int, string> responseData = new Param2<int, string>(playerCount, playerNames);

        // RPCSingleParam with the requestor's player object sends to that specific client
        Man requestorPlayer = null;
        for (int j = 0; j < players.Count(); j++)
        {
            Man candidate = players.Get(j);
            if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == requestor.GetId())
            {
                requestorPlayer = candidate;
                break;
            }
        }

        if (requestorPlayer)
        {
            GetGame().RPCSingleParam(requestorPlayer, AdminDemoRPC.RESPONSE_PLAYER_INFO, responseData, true, requestor);

            Print("[AdminDemo] Server sent player info response: " + playerCount.ToString() + " players");
        }
    }
};
```

### How Server-Side RPC Reception Works

1. **`OnRPC()` is called on the target object.** When the client sent the RPC with `target = player`, the server-side `PlayerBase.OnRPC()` fires.

2. **Always call `super.OnRPC()`.** Other mods and vanilla code may also handle RPCs on this object.

3. **Check `GetGame().IsServer()`.** This code is in `4_World`, which compiles on both client and server. The `IsServer()` check ensures we only process the request on the server.

4. **Switch on `rpc_type`.** Match against your RPC ID constants.

5. **Send the response.** Use `RPCSingleParam` with the fifth parameter (`recipient`) set to the requesting player's identity. This sends the response only to that specific client.

### RPCSingleParam Response Signature

```c
GetGame().RPCSingleParam(
    requestorPlayer,                        // Target object (the player)
    AdminDemoRPC.RESPONSE_PLAYER_INFO,      // RPC ID
    responseData,                           // Data payload
    true,                                   // Guaranteed delivery
    requestor                               // Recipient identity (specific client)
);
```

The fifth parameter `requestor` (a `PlayerIdentity`) is what makes this a targeted response. Without it, the RPC would go to all clients.

---

## Step 7: Update the UI with Received Data

Back on the client side, we need to intercept the server's response RPC and route it to the panel.

### Create `Scripts/5_Mission/AdminDemo/AdminDemoMission.c`

```c
modded class MissionGameplay
{
    protected ref AdminDemoPanel m_AdminDemoPanel;

    // -------------------------------------------------------
    // Initialize the panel on mission start
    // -------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        if (!m_AdminDemoPanel)
            m_AdminDemoPanel = new AdminDemoPanel();

        Print("[AdminDemo] Client mission initialized.");
    }

    // -------------------------------------------------------
    // Clean up on mission end
    // -------------------------------------------------------
    override void OnMissionFinish()
    {
        if (m_AdminDemoPanel)
        {
            m_AdminDemoPanel.Close();
            m_AdminDemoPanel = null;
        }

        super.OnMissionFinish();
    }

    // -------------------------------------------------------
    // Handle keyboard input to toggle the panel
    // -------------------------------------------------------
    override void OnKeyPress(int key)
    {
        super.OnKeyPress(key);

        // F5 key toggles the admin panel
        if (key == KeyCode.KC_F5)
        {
            if (m_AdminDemoPanel)
                m_AdminDemoPanel.Toggle();
        }
    }

    // -------------------------------------------------------
    // Receive server RPCs on the client side
    // -------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        switch (rpc_type)
        {
            case AdminDemoRPC.RESPONSE_PLAYER_INFO:
                HandlePlayerInfoResponse(ctx);
                break;
        }
    }

    // -------------------------------------------------------
    // Deserialize server response and update the panel
    // -------------------------------------------------------
    protected void HandlePlayerInfoResponse(ParamsReadContext ctx)
    {
        Param2<int, string> data = new Param2<int, string>(0, "");
        if (!ctx.Read(data))
        {
            Print("[AdminDemo] ERROR: Failed to read player info response!");
            return;
        }

        int playerCount = data.param1;
        string playerNames = data.param2;

        Print("[AdminDemo] Client received player info: " + playerCount.ToString() + " players");

        if (m_AdminDemoPanel)
            m_AdminDemoPanel.OnPlayerInfoReceived(playerCount, playerNames);
    }
};
```

### How Client-Side RPC Reception Works

1. **`MissionGameplay.OnRPC()`** is a catch-all handler for RPCs received on the client. It fires for every incoming RPC.

2. **`ParamsReadContext ctx`** contains the serialized data sent by the server. You must deserialize it using `ctx.Read()` with a matching `Param` type.

3. **Matching Param types is critical.** The server sent `Param2<int, string>`. The client must read with `Param2<int, string>`. A mismatch causes `ctx.Read()` to return `false` and no data is retrieved.

4. **Route data to the panel.** After deserializing, call a method on the panel object to update the UI.

### The OnKeyPress Handler

```c
override void OnKeyPress(int key)
{
    super.OnKeyPress(key);

    if (key == KeyCode.KC_F5)
    {
        if (m_AdminDemoPanel)
            m_AdminDemoPanel.Toggle();
    }
}
```

This hooks into the mission's keyboard input. When the admin presses F5, the panel opens or closes. `KeyCode.KC_F5` is a built-in constant for the F5 key.

---

## Step 8: Register the Module

Finally, tie everything together in config.cpp.

### Create `AdminDemo/mod.cpp`

```cpp
name = "Admin Demo";
author = "YourName";
version = "1.0";
overview = "Tutorial admin panel demonstrating the full RPC roundtrip pattern.";
```

### Create `AdminDemo/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class AdminDemo_Scripts
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
    class AdminDemo
    {
        dir = "AdminDemo";
        name = "Admin Demo";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "AdminDemo/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "AdminDemo/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "AdminDemo/Scripts/5_Mission" };
            };
        };
    };
};
```

### Why Three Layers?

| Layer | Contains | Reason |
|-------|----------|--------|
| `3_Game` | `AdminDemoRPC.c` | RPC ID constants need to be visible to both `4_World` and `5_Mission` |
| `4_World` | `AdminDemoServer.c` | Server-side handler modding `PlayerBase` (a world entity) |
| `5_Mission` | `AdminDemoPanel.c`, `AdminDemoMission.c` | Client UI and mission hooks |

---

## Complete File Reference

### Final Directory Structure

```
AdminDemo/
    mod.cpp
    GUI/
        layouts/
            admin_player_info.layout
    Scripts/
        config.cpp
        3_Game/
            AdminDemo/
                AdminDemoRPC.c
        4_World/
            AdminDemo/
                AdminDemoServer.c
        5_Mission/
            AdminDemo/
                AdminDemoPanel.c
                AdminDemoMission.c
```

### AdminDemo/Scripts/3_Game/AdminDemo/AdminDemoRPC.c

```c
class AdminDemoRPC
{
    static const int REQUEST_PLAYER_INFO  = 78001;
    static const int RESPONSE_PLAYER_INFO = 78002;
};
```

### AdminDemo/Scripts/4_World/AdminDemo/AdminDemoServer.c

```c
modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        switch (rpc_type)
        {
            case AdminDemoRPC.REQUEST_PLAYER_INFO:
                HandlePlayerInfoRequest(sender);
                break;
        }
    }

    protected void HandlePlayerInfoRequest(PlayerIdentity requestor)
    {
        if (!requestor)
            return;

        Print("[AdminDemo] Server received player info request from: " + requestor.GetName());

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        int playerCount = players.Count();
        string playerNames = "";

        for (int i = 0; i < playerCount; i++)
        {
            Man man = players.Get(i);
            if (man)
            {
                PlayerIdentity identity = man.GetIdentity();
                if (identity)
                {
                    if (playerNames != "")
                        playerNames = playerNames + "\n";

                    playerNames = playerNames + (i + 1).ToString() + ". " + identity.GetName();
                }
            }
        }

        if (playerNames == "")
            playerNames = "(No players connected)";

        Param2<int, string> responseData = new Param2<int, string>(playerCount, playerNames);

        Man requestorPlayer = null;
        for (int j = 0; j < players.Count(); j++)
        {
            Man candidate = players.Get(j);
            if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == requestor.GetId())
            {
                requestorPlayer = candidate;
                break;
            }
        }

        if (requestorPlayer)
        {
            GetGame().RPCSingleParam(requestorPlayer, AdminDemoRPC.RESPONSE_PLAYER_INFO, responseData, true, requestor);
            Print("[AdminDemo] Server sent player info response: " + playerCount.ToString() + " players");
        }
    }
};
```

### AdminDemo/Scripts/5_Mission/AdminDemo/AdminDemoPanel.c

```c
class AdminDemoPanel extends ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected ButtonWidget m_RefreshButton;
    protected ButtonWidget m_CloseButton;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_PlayerListText;

    protected bool m_IsOpen;

    void AdminDemoPanel()
    {
        m_IsOpen = false;
    }

    void ~AdminDemoPanel()
    {
        Close();
    }

    void Open()
    {
        if (m_IsOpen)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets("AdminDemo/GUI/layouts/admin_player_info.layout");
        if (!m_Root)
        {
            Print("[AdminDemo] ERROR: Failed to load layout file!");
            return;
        }

        m_RefreshButton   = ButtonWidget.Cast(m_Root.FindAnyWidget("RefreshButton"));
        m_CloseButton     = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));
        m_PlayerCountText = TextWidget.Cast(m_Root.FindAnyWidget("PlayerCountText"));
        m_PlayerListText  = TextWidget.Cast(m_Root.FindAnyWidget("PlayerListText"));

        if (m_RefreshButton)
            m_RefreshButton.SetHandler(this);

        if (m_CloseButton)
            m_CloseButton.SetHandler(this);

        m_Root.Show(true);
        m_IsOpen = true;

        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print("[AdminDemo] Panel opened.");
    }

    void Close()
    {
        if (!m_IsOpen)
            return;

        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }

        m_IsOpen = false;

        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print("[AdminDemo] Panel closed.");
    }

    bool IsOpen()
    {
        return m_IsOpen;
    }

    void Toggle()
    {
        if (m_IsOpen)
            Close();
        else
            Open();
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_RefreshButton)
        {
            OnRefreshClicked();
            return true;
        }

        if (w == m_CloseButton)
        {
            Close();
            return true;
        }

        return false;
    }

    protected void OnRefreshClicked()
    {
        Print("[AdminDemo] Refresh clicked, sending RPC to server...");

        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: Loading...");

        if (m_PlayerListText)
            m_PlayerListText.SetText("Requesting data from server...");

        Man player = GetGame().GetPlayer();
        if (player)
        {
            Param1<bool> params = new Param1<bool>(true);
            GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
        }
    }

    void OnPlayerInfoReceived(int playerCount, string playerNames)
    {
        Print("[AdminDemo] Received player info: " + playerCount.ToString() + " players");

        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: " + playerCount.ToString());

        if (m_PlayerListText)
            m_PlayerListText.SetText(playerNames);
    }
};
```

### AdminDemo/Scripts/5_Mission/AdminDemo/AdminDemoMission.c

```c
modded class MissionGameplay
{
    protected ref AdminDemoPanel m_AdminDemoPanel;

    override void OnInit()
    {
        super.OnInit();

        if (!m_AdminDemoPanel)
            m_AdminDemoPanel = new AdminDemoPanel();

        Print("[AdminDemo] Client mission initialized.");
    }

    override void OnMissionFinish()
    {
        if (m_AdminDemoPanel)
        {
            m_AdminDemoPanel.Close();
            m_AdminDemoPanel = null;
        }

        super.OnMissionFinish();
    }

    override void OnKeyPress(int key)
    {
        super.OnKeyPress(key);

        if (key == KeyCode.KC_F5)
        {
            if (m_AdminDemoPanel)
                m_AdminDemoPanel.Toggle();
        }
    }

    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        switch (rpc_type)
        {
            case AdminDemoRPC.RESPONSE_PLAYER_INFO:
                HandlePlayerInfoResponse(ctx);
                break;
        }
    }

    protected void HandlePlayerInfoResponse(ParamsReadContext ctx)
    {
        Param2<int, string> data = new Param2<int, string>(0, "");
        if (!ctx.Read(data))
        {
            Print("[AdminDemo] ERROR: Failed to read player info response!");
            return;
        }

        int playerCount = data.param1;
        string playerNames = data.param2;

        Print("[AdminDemo] Client received player info: " + playerCount.ToString() + " players");

        if (m_AdminDemoPanel)
            m_AdminDemoPanel.OnPlayerInfoReceived(playerCount, playerNames);
    }
};
```

---

## The Full Roundtrip Explained

Here is the exact sequence of events when the admin presses F5 and clicks Refresh:

```
1. [CLIENT] Admin presses F5
   --> MissionGameplay.OnKeyPress(KC_F5) fires
   --> AdminDemoPanel.Toggle() is called
   --> Panel opens, layout is created, cursor appears

2. [CLIENT] Admin clicks "Refresh" button
   --> AdminDemoPanel.OnClick() fires with w == m_RefreshButton
   --> OnRefreshClicked() is called
   --> UI shows "Loading..."
   --> RPCSingleParam sends REQUEST_PLAYER_INFO (78001) to server

3. [NETWORK] RPC travels from client to server

4. [SERVER] PlayerBase.OnRPC() fires
   --> rpc_type matches REQUEST_PLAYER_INFO
   --> HandlePlayerInfoRequest(sender) is called
   --> Server iterates all connected players
   --> Builds player count and name list
   --> RPCSingleParam sends RESPONSE_PLAYER_INFO (78002) back to client

5. [NETWORK] RPC travels from server to client

6. [CLIENT] MissionGameplay.OnRPC() fires
   --> rpc_type matches RESPONSE_PLAYER_INFO
   --> HandlePlayerInfoResponse(ctx) is called
   --> Data is deserialized from ParamsReadContext
   --> AdminDemoPanel.OnPlayerInfoReceived() is called
   --> UI updates with player count and names

Total time: typically under 100ms on a local network.
```

---

## Troubleshooting

### Panel Does Not Open When Pressing F5

- **Check OnKeyPress override:** Make sure `super.OnKeyPress(key)` is called first.
- **Check key code:** `KeyCode.KC_F5` is the correct constant. If using a different key, find the right constant in the Enforce Script API.
- **Check initialization:** Ensure `m_AdminDemoPanel` is created in `OnInit()`.

### Panel Opens But Buttons Do Not Work

- **Check SetHandler:** Every button needs `button.SetHandler(this)` called on it.
- **Check widget names:** `FindAnyWidget("RefreshButton")` is case-sensitive. The name must match the layout file exactly.
- **Check OnClick return:** Make sure `OnClick` returns `true` for handled buttons.

### RPC Never Reaches the Server

- **Check RPC ID uniqueness:** If another mod uses the same RPC ID number, there will be conflicts. Use high unique numbers.
- **Check player reference:** `GetGame().GetPlayer()` returns `null` if called before the player is fully initialized. Ensure the panel only opens after the player spawns.
- **Check server code compiles:** Look at the server script log for `SCRIPT (E)` errors in your `4_World` code.

### Server Response Never Reaches the Client

- **Check the recipient parameter:** The fifth parameter of `RPCSingleParam` must be the `PlayerIdentity` of the target client.
- **Check Param type matching:** Server sends `Param2<int, string>`, client reads `Param2<int, string>`. A type mismatch causes `ctx.Read()` to fail.
- **Check MissionGameplay.OnRPC override:** Make sure you call `super.OnRPC()` and the method signature is correct.

### UI Shows But Data Does Not Update

- **Null widget references:** If `FindAnyWidget` returns `null` (widget name mismatch), `SetText()` calls silently fail.
- **Check panel reference:** Make sure `m_AdminDemoPanel` in the mission class is the same object that was opened.
- **Add Print statements:** Trace the data flow by adding `Print()` calls at each step.

---

## Next Steps

1. **[Chapter 8.4: Adding Chat Commands](04-chat-commands.md)** -- Create server-side chat commands for admin operations.
2. **Add permissions** -- Check if the requesting player is an admin before processing RPCs.
3. **Add more features** -- Extend the panel with tabs for weather control, player teleport, item spawning.
4. **Use a framework** -- Frameworks like MyMod Core provide built-in RPC routing, config management, and admin panel infrastructure that eliminates much of this boilerplate.
5. **Style the UI** -- Learn about widget styles, imagesets, and fonts in [Chapter 3: GUI System](../03-gui-system/01-widget-types.md).

---

## Best Practices

- **Validate all RPC data on the server before executing.** Never trust data from the client -- always check permissions, validate parameters, and guard against null values before performing any server action.
- **Cache widget references in member variables instead of calling `FindAnyWidget` every frame.** Widget lookup is not free; calling it in `OnUpdate` or `OnClick` repeatedly wastes performance.
- **Always call `SetHandler(this)` on interactive widgets.** Without it, `OnClick()` will never fire, and there is no error message -- buttons just silently do nothing.
- **Use high, unique RPC ID numbers.** Vanilla DayZ uses low IDs. Other mods pick common ranges. Use numbers above 70000 and add your mod prefix to comments so collisions are traceable.
- **Clean up widgets in `OnMissionFinish`.** Leaked widget roots stack up across server hops, consuming memory and causing ghost UI elements.

---

## Theory vs Practice

| Concept | Theory | Reality |
|---------|--------|---------|
| `RPCSingleParam` delivery | Setting `guaranteed=true` means the RPC always arrives | RPCs can still be lost if the player disconnects mid-flight or the server crashes. Always handle the "no response" case in your UI (e.g., a timeout message). |
| `OnClick` widget matching | Compare `w == m_Button` to identify clicks | If `FindAnyWidget` returned NULL (typo in widget name), `m_Button` is NULL and the comparison silently fails. Always log a warning if widget binding fails in `Open()`. |
| Param type matching | Client and server use the same `Param2<int, string>` | If the types or order do not match exactly, `ctx.Read()` returns false and the data is silently lost. There is no type-checking error message at runtime. |
| Listen server testing | Good enough for quick iteration | Listen servers run client and server in one process, so RPCs arrive instantly and never cross the network. Timing bugs, packet loss, and authority issues only appear on a real dedicated server. |

---

## What You Learned

In this tutorial you learned:
- How to create a UI panel with layout files and bind widgets in script
- How to handle button clicks with `OnClick()` and `SetHandler()`
- How to send RPCs from client to server and back using `RPCSingleParam` and `Param` classes
- The full client-server-client roundtrip pattern used by every networked admin tool
- How to register the panel in `MissionGameplay` with proper lifecycle management

**Next:** [Chapter 8.4: Adding Chat Commands](04-chat-commands.md)

---

**Previous:** [Chapter 8.2: Creating a Custom Item](02-custom-item.md)
**Next:** [Chapter 8.4: Adding Chat Commands](04-chat-commands.md)
