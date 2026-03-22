# Chapter 8.4: Adding Chat Commands

[Home](../../README.md) | [<< Previous: Building an Admin Panel](03-admin-panel.md) | **Adding Chat Commands** | [Next: Using the DayZ Mod Template >>](05-mod-template.md)

---

## Inhaltsverzeichnis

- [What We Are Building](#what-we-are-building)
- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Step 1: Hook Into Chat Input](#step-1-hook-into-chat-input)
- [Step 2: Parse Command Prefix and Arguments](#step-2-parse-command-prefix-and-arguments)
- [Step 3: Check Admin Permissions](#step-3-check-admin-permissions)
- [Step 4: Execute the Server-Side Action](#step-4-execute-the-server-side-action)
- [Step 5: Send Feedback to the Admin](#step-5-send-feedback-to-the-admin)
- [Step 6: Register Commands](#step-6-register-commands)
- [Step 7: Add to an Admin Panel Command List](#step-7-add-to-an-admin-panel-command-list)
- [Complete Working Code: /heal Command](#complete-working-code-heal-command)
- [Adding More Commands](#adding-more-commands)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## What We Are Building

A chat command system with:

- **`/heal`** -- Fully heals the admin's character (health, blood, shock, hunger, thirst)
- **`/heal PlayerName`** -- Heals a specific player by name
- A reusable framework for adding `/kill`, `/teleport`, `/time`, `/weather`, and any other command
- Admin permission checking so regular players cannot use admin commands
- Server-side execution with chat feedback messages

---

## Prerequisites

- A working mod structure (complete [Chapter 8.1](01-first-mod.md) first)
- Understanding of the [client-server RPC pattern](03-admin-panel.md) from Chapter 8.3

### Mod Structure for This Tutorial

```
ChatCommands/
    mod.cpp
    Scripts/
        config.cpp
        3_Game/
            ChatCommands/
                CCmdRPC.c
                CCmdBase.c
                CCmdRegistry.c
        4_World/
            ChatCommands/
                CCmdServerHandler.c
                commands/
                    CCmdHeal.c
        5_Mission/
            ChatCommands/
                CCmdChatHook.c
```

---

## Architecture Overview

Chat commands follow this flow:

```
CLIENT                                  SERVER
------                                  ------

1. Admin types "/heal" in chat
2. Chat hook intercepts the message
   (prevents it from being sent as chat)
3. Client sends command via RPC  ---->  4. Server receives RPC
                                            Checks admin permissions
                                            Looks up command handler
                                            Executes the command
                                        5. Server sends feedback  ---->  CLIENT
                                            (chat message RPC)
                                                                     6. Admin sees
                                                                        feedback in chat
```

**Why process commands on the server?** Because the server has authority over game state. Only the server can reliably heal players, change weather, teleport characters, and modify world state. The client's role is limited to detecting the command and forwarding it.

---

## Step 1: Hook Into Chat Input

We need to intercept chat messages before they are sent as regular chat. DayZ provides the `ChatInputMenu` class for this purpose.

### The Chat Hook Approach

We will mod the `MissionGameplay` class to intercept chat input events. When the player submits a chat message starting with `/`, we intercept it, prevent it from being sent as normal chat, and instead send it as a command RPC to the server.

### Create `Scripts/5_Mission/ChatCommands/CCmdChatHook.c`

```c
modded class MissionGameplay
{
    // -------------------------------------------------------
    // Intercept chat messages that start with /
    // -------------------------------------------------------
    override void OnEvent(EventType eventTypeId, Param params)
    {
        super.OnEvent(eventTypeId, params);

        // ChatMessageEventTypeID fires when the player sends a chat message
        if (eventTypeId == ChatMessageEventTypeID)
        {
            Param3<int, string, string> chatParams;
            if (Class.CastTo(chatParams, params))
            {
                string message = chatParams.param3;

                // Check if it starts with /
                if (message.Length() > 0 && message.Substring(0, 1) == "/")
                {
                    // This is a command -- send it to the server
                    SendChatCommand(message);
                }
            }
        }
    }

    // -------------------------------------------------------
    // Send the command string to the server via RPC
    // -------------------------------------------------------
    protected void SendChatCommand(string fullCommand)
    {
        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        Print("[ChatCommands] Sending command to server: " + fullCommand);

        Param1<string> data = new Param1<string>(fullCommand);
        GetGame().RPCSingleParam(player, CCmdRPC.COMMAND_REQUEST, data, true);
    }

    // -------------------------------------------------------
    // Receive command feedback from the server
    // -------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
        {
            Param2<string, string> data = new Param2<string, string>("", "");
            if (ctx.Read(data))
            {
                string prefix = data.param1;
                string message = data.param2;

                // Display feedback as a system chat message
                GetGame().Chat(prefix + " " + message, "colorStatusChannel");

                Print("[ChatCommands] Feedback: " + prefix + " " + message);
            }
        }
    }
};
```

### How Chat Interception Works

The `OnEvent` method on `MissionGameplay` is called for various game events. When `eventTypeId` is `ChatMessageEventTypeID`, it means the player just submitted a chat message. The `Param3` contains:

- `param1` -- Channel (int): the chat channel (global, direct, etc.)
- `param2` -- Sender name (string)
- `param3` -- Message text (string)

We check if the message starts with `/`. If it does, we forward the entire string to the server via RPC. The message is still sent as normal chat as well -- in a production mod, you would suppress it (covered in the notes at the end).

---

## Step 2: Parse Command Prefix and Arguments

On the server side, we need to break a command string like `/heal PlayerName` into its parts: the command name (`heal`) and the arguments (`["PlayerName"]`).

### Create `Scripts/3_Game/ChatCommands/CCmdRPC.c`

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST  = 79001;
    static const int COMMAND_FEEDBACK = 79002;
};
```

### Create `Scripts/3_Game/ChatCommands/CCmdBase.c`

```c
// -------------------------------------------------------
// Base class for all chat commands
// -------------------------------------------------------
class CCmdBase
{
    // The command name without the / prefix (e.g., "heal")
    string GetName()
    {
        return "";
    }

    // Short description shown in help or command list
    string GetDescription()
    {
        return "";
    }

    // Usage syntax shown when the command is used incorrectly
    string GetUsage()
    {
        return "/" + GetName();
    }

    // Whether this command requires admin privileges
    bool RequiresAdmin()
    {
        return true;
    }

    // Execute the command on the server
    // Returns true if successful, false if failed
    bool Execute(PlayerIdentity caller, array<string> args)
    {
        return false;
    }

    // -------------------------------------------------------
    // Helper: Send feedback message to the command caller
    // -------------------------------------------------------
    protected void SendFeedback(PlayerIdentity caller, string prefix, string message)
    {
        if (!caller)
            return;

        // Find the caller's player object
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        Man callerPlayer = null;
        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == caller.GetId())
                {
                    callerPlayer = candidate;
                    break;
                }
            }
        }

        if (callerPlayer)
        {
            Param2<string, string> data = new Param2<string, string>(prefix, message);
            GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
        }
    }

    // -------------------------------------------------------
    // Helper: Find a player by partial name match
    // -------------------------------------------------------
    protected Man FindPlayerByName(string partialName)
    {
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        string searchLower = partialName;
        searchLower.ToLower();

        for (int i = 0; i < players.Count(); i++)
        {
            Man man = players.Get(i);
            if (man && man.GetIdentity())
            {
                string playerName = man.GetIdentity().GetName();
                string playerNameLower = playerName;
                playerNameLower.ToLower();

                if (playerNameLower.Contains(searchLower))
                    return man;
            }
        }

        return null;
    }
};
```

### Create `Scripts/3_Game/ChatCommands/CCmdRegistry.c`

```c
// -------------------------------------------------------
// Registry that holds all available commands
// -------------------------------------------------------
class CCmdRegistry
{
    protected static ref map<string, ref CCmdBase> s_Commands;

    // -------------------------------------------------------
    // Initialize the registry (call once at startup)
    // -------------------------------------------------------
    static void Init()
    {
        if (!s_Commands)
            s_Commands = new map<string, ref CCmdBase>;
    }

    // -------------------------------------------------------
    // Register a command instance
    // -------------------------------------------------------
    static void Register(CCmdBase command)
    {
        if (!s_Commands)
            Init();

        if (!command)
            return;

        string name = command.GetName();
        name.ToLower();

        if (s_Commands.Contains(name))
        {
            Print("[ChatCommands] WARNING: Command '" + name + "' already registered, overwriting.");
        }

        s_Commands.Set(name, command);
        Print("[ChatCommands] Registered command: /" + name);
    }

    // -------------------------------------------------------
    // Look up a command by name
    // -------------------------------------------------------
    static CCmdBase GetCommand(string name)
    {
        if (!s_Commands)
            return null;

        string nameLower = name;
        nameLower.ToLower();

        CCmdBase cmd;
        if (s_Commands.Find(nameLower, cmd))
            return cmd;

        return null;
    }

    // -------------------------------------------------------
    // Get all registered command names
    // -------------------------------------------------------
    static array<string> GetCommandNames()
    {
        ref array<string> names = new array<string>;

        if (s_Commands)
        {
            for (int i = 0; i < s_Commands.Count(); i++)
            {
                names.Insert(s_Commands.GetKey(i));
            }
        }

        return names;
    }

    // -------------------------------------------------------
    // Parse a raw command string into name + args
    // Example: "/heal PlayerName" --> name="heal", args=["PlayerName"]
    // -------------------------------------------------------
    static void ParseCommand(string fullCommand, out string commandName, out array<string> args)
    {
        args = new array<string>;
        commandName = "";

        if (fullCommand.Length() == 0)
            return;

        // Remove the leading /
        string raw = fullCommand;
        if (raw.Substring(0, 1) == "/")
            raw = raw.Substring(1, raw.Length() - 1);

        // Split by spaces
        raw.Split(" ", args);

        if (args.Count() > 0)
        {
            commandName = args.Get(0);
            commandName.ToLower();
            args.RemoveOrdered(0);
        }
    }
};
```

### The Parse Logic Explained

Given the input `/heal SomePlayer`, `ParseCommand` does:

1. Removes the leading `/` to get `"heal SomePlayer"`
2. Splits by spaces to get `["heal", "SomePlayer"]`
3. Takes the first element as the command name: `"heal"`
4. Removes it from the array, leaving args: `["SomePlayer"]`

The command name is converted to lowercase so `/Heal`, `/HEAL`, and `/heal` all work.

---

## Step 3: Check Admin Permissions

Admin permission checking prevents regular players from executing admin commands. DayZ does not have a built-in admin permission system in scripts, so we check against a simple admin list.

### The Admin Check in the Server Handler

The simplest approach is to check the player's Steam64 ID against a list of known admin IDs. In a production mod, you would load this list from a config file.

```c
// Simple admin check -- in production, load from a JSON config file
static bool IsAdmin(PlayerIdentity identity)
{
    if (!identity)
        return false;

    // Check the player's plain ID (Steam64 ID)
    string playerId = identity.GetPlainId();

    // Hardcoded admin list -- replace with config file loading in production
    ref array<string> adminIds = new array<string>;
    adminIds.Insert("76561198000000001");    // Replace with real Steam64 IDs
    adminIds.Insert("76561198000000002");

    return (adminIds.Find(playerId) != -1);
}
```

### Where to Find Steam64 IDs

- Open your Steam profile in a browser
- The URL contains your Steam64 ID: `https://steamcommunity.com/profiles/76561198XXXXXXXXX`
- Or use a tool like https://steamid.io to look up any player

### Production-Grade Permissions

In a real mod, you would:

1. Store admin IDs in a JSON file (`$profile:ChatCommands/admins.json`)
2. Load the file on server startup
3. Support permission levels (moderator, admin, superadmin)
4. Use a framework like MyFramework's `MyPermissions` system for hierarchical permissions

---

## Step 4: Execute the Server-Side Action

Now we create the actual `/heal` command and the server handler that processes incoming command RPCs.

### Create `Scripts/4_World/ChatCommands/commands/CCmdHeal.c`

```c
class CCmdHeal extends CCmdBase
{
    override string GetName()
    {
        return "heal";
    }

    override string GetDescription()
    {
        return "Fully heals a player (health, blood, shock, hunger, thirst)";
    }

    override string GetUsage()
    {
        return "/heal [PlayerName]";
    }

    override bool RequiresAdmin()
    {
        return true;
    }

    // -------------------------------------------------------
    // Execute the heal command
    // /heal         --> heals the caller
    // /heal Name    --> heals the named player
    // -------------------------------------------------------
    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (!caller)
            return false;

        Man targetMan = null;
        string targetName = "";

        // Determine the target player
        if (args.Count() > 0)
        {
            // Heal a specific player by name
            string searchName = args.Get(0);
            targetMan = FindPlayerByName(searchName);

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Player '" + searchName + "' not found.");
                return false;
            }

            targetName = targetMan.GetIdentity().GetName();
        }
        else
        {
            // Heal the caller themselves
            ref array<Man> allPlayers = new array<Man>;
            GetGame().GetPlayers(allPlayers);

            for (int i = 0; i < allPlayers.Count(); i++)
            {
                Man candidate = allPlayers.Get(i);
                if (candidate && candidate.GetIdentity())
                {
                    if (candidate.GetIdentity().GetId() == caller.GetId())
                    {
                        targetMan = candidate;
                        break;
                    }
                }
            }

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Could not find your player object.");
                return false;
            }

            targetName = "yourself";
        }

        // Execute the heal
        PlayerBase targetPlayer;
        if (!Class.CastTo(targetPlayer, targetMan))
        {
            SendFeedback(caller, "[Heal]", "Target is not a valid player.");
            return false;
        }

        HealPlayer(targetPlayer);

        // Log and send feedback
        Print("[ChatCommands] " + caller.GetName() + " healed " + targetName);
        SendFeedback(caller, "[Heal]", "Successfully healed " + targetName + ".");

        return true;
    }

    // -------------------------------------------------------
    // Apply full heal to a player
    // -------------------------------------------------------
    protected void HealPlayer(PlayerBase player)
    {
        if (!player)
            return;

        // Restore health to maximum
        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));

        // Restore blood to maximum
        player.SetHealth("GlobalHealth", "Blood", player.GetMaxHealth("GlobalHealth", "Blood"));

        // Remove shock damage
        player.SetHealth("GlobalHealth", "Shock", player.GetMaxHealth("GlobalHealth", "Shock"));

        // Set hunger to full (energy value)
        // PlayerBase has a stats system -- set the energy stat
        player.GetStatEnergy().Set(player.GetStatEnergy().GetMax());

        // Set thirst to full (water value)
        player.GetStatWater().Set(player.GetStatWater().GetMax());

        // Clear any bleeding sources
        player.GetBleedingManagerServer().RemoveAllSources();

        Print("[ChatCommands] Healed player: " + player.GetIdentity().GetName());
    }
};
```

### Why 4_World?

The heal command references `PlayerBase`, which is defined in the `4_World` layer. It also uses player stat methods (`GetStatEnergy`, `GetStatWater`, `GetBleedingManagerServer`) that are only available on world entities. The command **must** live in `4_World` or higher.

The base class `CCmdBase` lives in `3_Game` because it does not reference any world types. The concrete command classes that touch world entities live in `4_World`.

---

## Step 5: Send Feedback to the Admin

Feedback is handled by the `SendFeedback()` method in `CCmdBase`. Let us trace the complete feedback path:

### Server Sends Feedback

```c
// Inside CCmdBase.SendFeedback()
Param2<string, string> data = new Param2<string, string>(prefix, message);
GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
```

The server sends a `COMMAND_FEEDBACK` RPC to the specific client who issued the command. The data contains a prefix (like `"[Heal]"`) and the message text.

### Client Receives and Displays Feedback

Back in `CCmdChatHook.c` (Step 1), the `OnRPC` handler catches this:

```c
if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
{
    // Deserialize the message
    Param2<string, string> data = new Param2<string, string>("", "");
    if (ctx.Read(data))
    {
        string prefix = data.param1;
        string message = data.param2;

        // Display in the chat window
        GetGame().Chat(prefix + " " + message, "colorStatusChannel");
    }
}
```

`GetGame().Chat()` displays a message in the player's chat window. The second parameter is the color channel:

| Channel | Color | Typical Use |
|---------|-------|-------------|
| `"colorStatusChannel"` | Yellow/orange | System messages |
| `"colorAction"` | White | Action feedback |
| `"colorFriendly"` | Green | Positive feedback |
| `"colorImportant"` | Red | Warnings/errors |

---

## Step 6: Register Commands

The server handler receives command RPCs, looks up the command in the registry, and executes it.

### Create `Scripts/4_World/ChatCommands/CCmdServerHandler.c`

```c
modded class MissionServer
{
    // -------------------------------------------------------
    // Register all commands when the server starts
    // -------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        CCmdRegistry.Init();

        // Register all commands here
        CCmdRegistry.Register(new CCmdHeal());

        // Add more commands:
        // CCmdRegistry.Register(new CCmdKill());
        // CCmdRegistry.Register(new CCmdTeleport());
        // CCmdRegistry.Register(new CCmdTime());

        Print("[ChatCommands] Server initialized. Commands registered.");
    }
};

// -------------------------------------------------------
// Server-side RPC handler for incoming commands
// -------------------------------------------------------
modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == CCmdRPC.COMMAND_REQUEST)
        {
            HandleCommandRPC(sender, ctx);
        }
    }

    protected void HandleCommandRPC(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender)
            return;

        // Read the command string
        Param1<string> data = new Param1<string>("");
        if (!ctx.Read(data))
        {
            Print("[ChatCommands] ERROR: Failed to read command RPC data.");
            return;
        }

        string fullCommand = data.param1;
        Print("[ChatCommands] Received command from " + sender.GetName() + ": " + fullCommand);

        // Parse the command
        string commandName;
        ref array<string> args;
        CCmdRegistry.ParseCommand(fullCommand, commandName, args);

        if (commandName == "")
            return;

        // Look up the command
        CCmdBase command = CCmdRegistry.GetCommand(commandName);
        if (!command)
        {
            SendCommandFeedback(sender, "[Error]", "Unknown command: /" + commandName);
            return;
        }

        // Check admin permissions
        if (command.RequiresAdmin() && !IsCommandAdmin(sender))
        {
            Print("[ChatCommands] Non-admin " + sender.GetName() + " tried to use /" + commandName);
            SendCommandFeedback(sender, "[Error]", "You do not have permission to use this command.");
            return;
        }

        // Execute the command
        bool success = command.Execute(sender, args);

        if (success)
            Print("[ChatCommands] Command /" + commandName + " executed successfully by " + sender.GetName());
        else
            Print("[ChatCommands] Command /" + commandName + " failed for " + sender.GetName());
    }

    // -------------------------------------------------------
    // Check if a player is an admin
    // -------------------------------------------------------
    protected bool IsCommandAdmin(PlayerIdentity identity)
    {
        if (!identity)
            return false;

        string playerId = identity.GetPlainId();

        // ----------------------------------------------------------
        // IMPORTANT: Replace these with your actual admin Steam64 IDs
        // In production, load from a JSON config file instead
        // ----------------------------------------------------------
        ref array<string> adminIds = new array<string>;
        adminIds.Insert("76561198000000001");
        adminIds.Insert("76561198000000002");

        return (adminIds.Find(playerId) != -1);
    }

    // -------------------------------------------------------
    // Send feedback to a specific player
    // -------------------------------------------------------
    protected void SendCommandFeedback(PlayerIdentity target, string prefix, string message)
    {
        if (!target)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == target.GetId())
                {
                    Param2<string, string> data = new Param2<string, string>(prefix, message);
                    GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_FEEDBACK, data, true, target);
                    return;
                }
            }
        }
    }
};
```

### The Registration Pattern

Commands are registered in `MissionServer.OnInit()`:

```c
CCmdRegistry.Init();
CCmdRegistry.Register(new CCmdHeal());
```

Each `Register()` call creates an instance of the command class and stores it in a map keyed by the command name. When a command RPC arrives, the handler looks up the name in the registry and calls `Execute()` on the matching command object.

This pattern makes it trivial to add new commands -- create a new class extending `CCmdBase`, implement `Execute()`, and add one `Register()` line.

---

## Step 7: Add to an Admin Panel Command List

If you have an admin panel (from [Chapter 8.3](03-admin-panel.md)), you can display the list of available commands in the UI.

### Request the Command List from the Server

Add a new RPC ID in `CCmdRPC.c`:

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST   = 79001;
    static const int COMMAND_FEEDBACK  = 79002;
    static const int COMMAND_LIST_REQ  = 79003;
    static const int COMMAND_LIST_RESP = 79004;
};
```

### Server-Side: Send the Command List

Add this handler in your server-side code:

```c
// In the server handler, add a case for COMMAND_LIST_REQ
if (rpc_type == CCmdRPC.COMMAND_LIST_REQ)
{
    HandleCommandListRequest(sender);
}

protected void HandleCommandListRequest(PlayerIdentity requestor)
{
    if (!requestor)
        return;

    // Build a formatted string of all commands
    array<string> names = CCmdRegistry.GetCommandNames();
    string commandList = "Available Commands:\n";

    for (int i = 0; i < names.Count(); i++)
    {
        CCmdBase cmd = CCmdRegistry.GetCommand(names.Get(i));
        if (cmd)
        {
            commandList = commandList + cmd.GetUsage() + " - " + cmd.GetDescription() + "\n";
        }
    }

    // Send back to client
    ref array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);

    for (int j = 0; j < players.Count(); j++)
    {
        Man candidate = players.Get(j);
        if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == requestor.GetId())
        {
            Param1<string> data = new Param1<string>(commandList);
            GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_LIST_RESP, data, true, requestor);
            return;
        }
    }
}
```

### Client-Side: Display in a Panel

On the client, catch the response and display it in a text widget:

```c
if (rpc_type == CCmdRPC.COMMAND_LIST_RESP)
{
    Param1<string> data = new Param1<string>("");
    if (ctx.Read(data))
    {
        string commandList = data.param1;
        // Display in your admin panel text widget
        // m_CommandListText.SetText(commandList);
        Print("[ChatCommands] Command list received:\n" + commandList);
    }
}
```

---

## Complete Working Code: /heal Command

Here is every file needed for the complete working system. Create these files and your mod will have a functional `/heal` command.

### config.cpp Setup

```cpp
class CfgPatches
{
    class ChatCommands_Scripts
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
    class ChatCommands
    {
        dir = "ChatCommands";
        name = "Chat Commands";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/5_Mission" };
            };
        };
    };
};
```

### 3_Game/ChatCommands/CCmdRPC.c

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST  = 79001;
    static const int COMMAND_FEEDBACK = 79002;
};
```

### 3_Game/ChatCommands/CCmdBase.c

```c
class CCmdBase
{
    string GetName()
    {
        return "";
    }

    string GetDescription()
    {
        return "";
    }

    string GetUsage()
    {
        return "/" + GetName();
    }

    bool RequiresAdmin()
    {
        return true;
    }

    bool Execute(PlayerIdentity caller, array<string> args)
    {
        return false;
    }

    protected void SendFeedback(PlayerIdentity caller, string prefix, string message)
    {
        if (!caller)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        Man callerPlayer = null;
        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == caller.GetId())
                {
                    callerPlayer = candidate;
                    break;
                }
            }
        }

        if (callerPlayer)
        {
            Param2<string, string> data = new Param2<string, string>(prefix, message);
            GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
        }
    }

    protected Man FindPlayerByName(string partialName)
    {
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        string searchLower = partialName;
        searchLower.ToLower();

        for (int i = 0; i < players.Count(); i++)
        {
            Man man = players.Get(i);
            if (man && man.GetIdentity())
            {
                string playerName = man.GetIdentity().GetName();
                string playerNameLower = playerName;
                playerNameLower.ToLower();

                if (playerNameLower.Contains(searchLower))
                    return man;
            }
        }

        return null;
    }
};
```

### 3_Game/ChatCommands/CCmdRegistry.c

```c
class CCmdRegistry
{
    protected static ref map<string, ref CCmdBase> s_Commands;

    static void Init()
    {
        if (!s_Commands)
            s_Commands = new map<string, ref CCmdBase>;
    }

    static void Register(CCmdBase command)
    {
        if (!s_Commands)
            Init();

        if (!command)
            return;

        string name = command.GetName();
        name.ToLower();

        s_Commands.Set(name, command);
        Print("[ChatCommands] Registered command: /" + name);
    }

    static CCmdBase GetCommand(string name)
    {
        if (!s_Commands)
            return null;

        string nameLower = name;
        nameLower.ToLower();

        CCmdBase cmd;
        if (s_Commands.Find(nameLower, cmd))
            return cmd;

        return null;
    }

    static array<string> GetCommandNames()
    {
        ref array<string> names = new array<string>;

        if (s_Commands)
        {
            for (int i = 0; i < s_Commands.Count(); i++)
            {
                names.Insert(s_Commands.GetKey(i));
            }
        }

        return names;
    }

    static void ParseCommand(string fullCommand, out string commandName, out array<string> args)
    {
        args = new array<string>;
        commandName = "";

        if (fullCommand.Length() == 0)
            return;

        string raw = fullCommand;
        if (raw.Substring(0, 1) == "/")
            raw = raw.Substring(1, raw.Length() - 1);

        raw.Split(" ", args);

        if (args.Count() > 0)
        {
            commandName = args.Get(0);
            commandName.ToLower();
            args.RemoveOrdered(0);
        }
    }
};
```

### 4_World/ChatCommands/commands/CCmdHeal.c

```c
class CCmdHeal extends CCmdBase
{
    override string GetName()
    {
        return "heal";
    }

    override string GetDescription()
    {
        return "Fully heals a player (health, blood, shock, hunger, thirst)";
    }

    override string GetUsage()
    {
        return "/heal [PlayerName]";
    }

    override bool RequiresAdmin()
    {
        return true;
    }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (!caller)
            return false;

        Man targetMan = null;
        string targetName = "";

        if (args.Count() > 0)
        {
            string searchName = args.Get(0);
            targetMan = FindPlayerByName(searchName);

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Player '" + searchName + "' not found.");
                return false;
            }

            targetName = targetMan.GetIdentity().GetName();
        }
        else
        {
            ref array<Man> allPlayers = new array<Man>;
            GetGame().GetPlayers(allPlayers);

            for (int i = 0; i < allPlayers.Count(); i++)
            {
                Man candidate = allPlayers.Get(i);
                if (candidate && candidate.GetIdentity())
                {
                    if (candidate.GetIdentity().GetId() == caller.GetId())
                    {
                        targetMan = candidate;
                        break;
                    }
                }
            }

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Could not find your player object.");
                return false;
            }

            targetName = "yourself";
        }

        PlayerBase targetPlayer;
        if (!Class.CastTo(targetPlayer, targetMan))
        {
            SendFeedback(caller, "[Heal]", "Target is not a valid player.");
            return false;
        }

        HealPlayer(targetPlayer);

        Print("[ChatCommands] " + caller.GetName() + " healed " + targetName);
        SendFeedback(caller, "[Heal]", "Successfully healed " + targetName + ".");

        return true;
    }

    protected void HealPlayer(PlayerBase player)
    {
        if (!player)
            return;

        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));
        player.SetHealth("GlobalHealth", "Blood", player.GetMaxHealth("GlobalHealth", "Blood"));
        player.SetHealth("GlobalHealth", "Shock", player.GetMaxHealth("GlobalHealth", "Shock"));

        player.GetStatEnergy().Set(player.GetStatEnergy().GetMax());
        player.GetStatWater().Set(player.GetStatWater().GetMax());

        player.GetBleedingManagerServer().RemoveAllSources();
    }
};
```

### 4_World/ChatCommands/CCmdServerHandler.c

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();

        CCmdRegistry.Init();
        CCmdRegistry.Register(new CCmdHeal());

        Print("[ChatCommands] Server initialized. Commands registered.");
    }
};

modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == CCmdRPC.COMMAND_REQUEST)
        {
            HandleCommandRPC(sender, ctx);
        }
    }

    protected void HandleCommandRPC(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender)
            return;

        Param1<string> data = new Param1<string>("");
        if (!ctx.Read(data))
        {
            Print("[ChatCommands] ERROR: Failed to read command RPC data.");
            return;
        }

        string fullCommand = data.param1;
        Print("[ChatCommands] Received command from " + sender.GetName() + ": " + fullCommand);

        string commandName;
        ref array<string> args;
        CCmdRegistry.ParseCommand(fullCommand, commandName, args);

        if (commandName == "")
            return;

        CCmdBase command = CCmdRegistry.GetCommand(commandName);
        if (!command)
        {
            SendCommandFeedback(sender, "[Error]", "Unknown command: /" + commandName);
            return;
        }

        if (command.RequiresAdmin() && !IsCommandAdmin(sender))
        {
            Print("[ChatCommands] Non-admin " + sender.GetName() + " tried to use /" + commandName);
            SendCommandFeedback(sender, "[Error]", "You do not have permission to use this command.");
            return;
        }

        command.Execute(sender, args);
    }

    protected bool IsCommandAdmin(PlayerIdentity identity)
    {
        if (!identity)
            return false;

        string playerId = identity.GetPlainId();

        // REPLACE THESE WITH YOUR ACTUAL ADMIN STEAM64 IDs
        ref array<string> adminIds = new array<string>;
        adminIds.Insert("76561198000000001");
        adminIds.Insert("76561198000000002");

        return (adminIds.Find(playerId) != -1);
    }

    protected void SendCommandFeedback(PlayerIdentity target, string prefix, string message)
    {
        if (!target)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == target.GetId())
            {
                Param2<string, string> data = new Param2<string, string>(prefix, message);
                GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_FEEDBACK, data, true, target);
                return;
            }
        }
    }
};
```

### 5_Mission/ChatCommands/CCmdChatHook.c

```c
modded class MissionGameplay
{
    override void OnEvent(EventType eventTypeId, Param params)
    {
        super.OnEvent(eventTypeId, params);

        if (eventTypeId == ChatMessageEventTypeID)
        {
            Param3<int, string, string> chatParams;
            if (Class.CastTo(chatParams, params))
            {
                string message = chatParams.param3;

                if (message.Length() > 0 && message.Substring(0, 1) == "/")
                {
                    SendChatCommand(message);
                }
            }
        }
    }

    protected void SendChatCommand(string fullCommand)
    {
        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        Print("[ChatCommands] Sending command to server: " + fullCommand);

        Param1<string> data = new Param1<string>(fullCommand);
        GetGame().RPCSingleParam(player, CCmdRPC.COMMAND_REQUEST, data, true);
    }

    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
        {
            Param2<string, string> data = new Param2<string, string>("", "");
            if (ctx.Read(data))
            {
                string prefix = data.param1;
                string message = data.param2;

                GetGame().Chat(prefix + " " + message, "colorStatusChannel");
                Print("[ChatCommands] Feedback: " + prefix + " " + message);
            }
        }
    }
};
```

---

## Adding More Commands

The registry pattern makes adding new commands straightforward. Here are examples:

### /kill Command

```c
class CCmdKill extends CCmdBase
{
    override string GetName()        { return "kill"; }
    override string GetDescription() { return "Kills a player"; }
    override string GetUsage()       { return "/kill [PlayerName]"; }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        Man targetMan = null;

        if (args.Count() > 0)
            targetMan = FindPlayerByName(args.Get(0));
        else
        {
            ref array<Man> players = new array<Man>;
            GetGame().GetPlayers(players);
            for (int i = 0; i < players.Count(); i++)
            {
                if (players.Get(i).GetIdentity() && players.Get(i).GetIdentity().GetId() == caller.GetId())
                {
                    targetMan = players.Get(i);
                    break;
                }
            }
        }

        if (!targetMan)
        {
            SendFeedback(caller, "[Kill]", "Player not found.");
            return false;
        }

        PlayerBase targetPlayer;
        if (Class.CastTo(targetPlayer, targetMan))
        {
            targetPlayer.SetHealth("GlobalHealth", "Health", 0);
            SendFeedback(caller, "[Kill]", "Killed " + targetMan.GetIdentity().GetName() + ".");
            return true;
        }

        return false;
    }
};
```

### /time Command

```c
class CCmdTime extends CCmdBase
{
    override string GetName()        { return "time"; }
    override string GetDescription() { return "Sets the server time (0-23)"; }
    override string GetUsage()       { return "/time <hour>"; }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (args.Count() < 1)
        {
            SendFeedback(caller, "[Time]", "Usage: " + GetUsage());
            return false;
        }

        int hour = args.Get(0).ToInt();
        if (hour < 0 || hour > 23)
        {
            SendFeedback(caller, "[Time]", "Hour must be between 0 and 23.");
            return false;
        }

        GetGame().GetWorld().SetDate(2024, 6, 15, hour, 0);
        SendFeedback(caller, "[Time]", "Server time set to " + hour.ToString() + ":00.");
        return true;
    }
};
```

### Registering New Commands

Add one line per command in `MissionServer.OnInit()`:

```c
CCmdRegistry.Register(new CCmdHeal());
CCmdRegistry.Register(new CCmdKill());
CCmdRegistry.Register(new CCmdTime());
```

---

## Fehlerbehebung

### Command Is Not Recognized ("Unknown command")

- **Registration missing:** Make sure `CCmdRegistry.Register(new CCmdYourCommand())` is called in `MissionServer.OnInit()`.
- **GetName() typo:** The string returned by `GetName()` must match what the player types (without the `/`).
- **Case mismatch:** The registry converts names to lowercase. `/Heal`, `/HEAL`, and `/heal` should all work.

### Permission Denied for Admins

- **Wrong Steam64 ID:** Double-check the admin IDs in `IsCommandAdmin()`. They must be exact Steam64 IDs (17-digit numbers starting with `7656`).
- **GetPlainId() vs GetId():** `GetPlainId()` returns the Steam64 ID. `GetId()` returns the DayZ session ID. Use `GetPlainId()` for admin checks.

### Feedback Message Does Not Appear in Chat

- **RPC not reaching client:** Add `Print()` statements on the server to confirm the feedback RPC is being sent.
- **Client OnRPC not catching it:** Verify the RPC ID matches (`CCmdRPC.COMMAND_FEEDBACK`).
- **GetGame().Chat() not working:** This function requires the game to be in a state where chat is available. It may not work on the loading screen.

### /heal Does Not Actually Heal

- **Server-only execution:** `SetHealth()` and stat changes must run on the server. Verify `GetGame().IsServer()` is true when `Execute()` runs.
- **PlayerBase cast fails:** If `Class.CastTo(targetPlayer, targetMan)` returns false, the target is not a valid PlayerBase. This can happen with AI or non-player entities.
- **Stat getters return null:** `GetStatEnergy()` and `GetStatWater()` may return null if the player is dead or not fully initialized. Add null checks in production code.

### Command Appears in Chat as Regular Message

- The `OnEvent` hook intercepts the message but does not suppress it from being sent as chat. To suppress it in a production mod, you would need to mod the `ChatInputMenu` class to filter `/` messages before they are sent:

```c
modded class ChatInputMenu
{
    override void OnChatInputSend()
    {
        string text = "";
        // Get the current text from the edit widget
        // If it starts with /, do NOT call super (which sends it as chat)
        // Instead, handle it as a command

        // This approach varies by DayZ version -- check vanilla sources
        super.OnChatInputSend();
    }
};
```

The exact implementation depends on the DayZ version and how `ChatInputMenu` exposes the text. The `OnEvent` approach in this tutorial is simpler and works for development, with the tradeoff that the command text also appears as a chat message.

---

## Nächste Schritte

1. **Load admins from a config file** -- Use `JsonFileLoader` to load admin IDs from a JSON file instead of hardcoding them.
2. **Add a /help command** -- List all available commands with their descriptions and usage.
3. **Add logging** -- Write command usage to a log file for audit purposes.
4. **Integrate with a framework** -- MyFramework provides `MyPermissions` for hierarchical permissions and `MyRPC` for string-routed RPCs that avoid integer ID collisions.
5. **Add cooldowns** -- Prevent command spam by tracking the last execution time per player.
6. **Build a command palette UI** -- Create an admin panel that lists all commands with clickable buttons (combining this tutorial with [Chapter 8.3](03-admin-panel.md)).

---

**Zurück:** [Chapter 8.3: Building an Admin Panel Module](03-admin-panel.md)
