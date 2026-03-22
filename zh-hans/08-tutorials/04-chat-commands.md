# 第 8.4 章：添加聊天命令

[首页](../../README.md) | [<< 上一章：构建管理员面板](03-admin-panel.md) | **添加聊天命令** | [下一章：使用 DayZ 模组模板 >>](05-mod-template.md)

---

> **摘要：** 本教程将引导你创建一个 DayZ 聊天命令系统。你将挂接到聊天输入、解析命令前缀和参数、检查管理员权限、执行服务器端操作并向玩家发送反馈。完成后，你将拥有一个可用的 `/heal` 命令来完全治愈管理员的角色，以及一个用于添加更多命令的框架。

---

## 目录

- [我们要构建什么](#what-we-are-building)
- [前提条件](#prerequisites)
- [架构概述](#architecture-overview)
- [步骤 1：挂接聊天输入](#step-1-hook-into-chat-input)
- [步骤 2：解析命令前缀和参数](#step-2-parse-command-prefix-and-arguments)
- [步骤 3：检查管理员权限](#step-3-check-admin-permissions)
- [步骤 4：执行服务器端操作](#step-4-execute-the-server-side-action)
- [步骤 5：向管理员发送反馈](#step-5-send-feedback-to-the-admin)
- [步骤 6：注册命令](#step-6-register-commands)
- [步骤 7：添加到管理面板命令列表](#step-7-add-to-an-admin-panel-command-list)
- [完整可用代码：/heal 命令](#complete-working-code-heal-command)
- [添加更多命令](#adding-more-commands)
- [故障排除](#troubleshooting)
- [下一步](#next-steps)

---

## 我们要构建什么

一个聊天命令系统，包含：

- **`/heal`** -- 完全治愈管理员的角色（生命值、血量、震荡、饥饿、口渴）
- **`/heal PlayerName`** -- 按名称治愈特定玩家
- 一个可复用的框架，用于添加 `/kill`、`/teleport`、`/time`、`/weather` 以及任何其他命令
- 管理员权限检查，使普通玩家无法使用管理员命令
- 服务器端执行与聊天反馈消息

---

## 前提条件

- 一个可用的模组结构（先完成[第 8.1 章](01-first-mod.md)）
- 理解来自第 8.3 章的[客户端-服务器 RPC 模式](03-admin-panel.md)

### 本教程的模组结构

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

## 架构概述

聊天命令遵循以下流程：

```
客户端                                  服务器
------                                  ------

1. 管理员在聊天中输入 "/heal"
2. 聊天钩子拦截消息
   （阻止它作为聊天发送）
3. 客户端通过 RPC 发送命令  ---->  4. 服务器接收 RPC
                                            检查管理员权限
                                            查找命令处理器
                                            执行命令
                                        5. 服务器发送反馈  ---->  客户端
                                            （聊天消息 RPC）
                                                                     6. 管理员在聊天中
                                                                        看到反馈
```

**为什么要在服务器上处理命令？** 因为服务器对游戏状态拥有权威。只有服务器才能可靠地治愈玩家、改变天气、传送角色和修改世界状态。客户端的角色仅限于检测命令并转发它。

---

## 步骤 1：挂接聊天输入

我们需要在聊天消息作为常规聊天发送之前拦截它们。DayZ 为此提供了 `ChatInputMenu` 类。

### 聊天钩子方法

我们将修改 `MissionGameplay` 类来拦截聊天输入事件。当玩家提交以 `/` 开头的聊天消息时，我们拦截它，阻止它作为普通聊天发送，而是将其作为命令 RPC 发送到服务器。

### 创建 `Scripts/5_Mission/ChatCommands/CCmdChatHook.c`

```c
modded class MissionGameplay
{
    // -------------------------------------------------------
    // 拦截以 / 开头的聊天消息
    // -------------------------------------------------------
    override void OnEvent(EventType eventTypeId, Param params)
    {
        super.OnEvent(eventTypeId, params);

        // 当玩家发送聊天消息时触发 ChatMessageEventTypeID
        if (eventTypeId == ChatMessageEventTypeID)
        {
            Param3<int, string, string> chatParams;
            if (Class.CastTo(chatParams, params))
            {
                string message = chatParams.param3;

                // 检查是否以 / 开头
                if (message.Length() > 0 && message.Substring(0, 1) == "/")
                {
                    // 这是一个命令——发送到服务器
                    SendChatCommand(message);
                }
            }
        }
    }

    // -------------------------------------------------------
    // 通过 RPC 将命令字符串发送到服务器
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
    // 从服务器接收命令反馈
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

                // 将反馈显示为系统聊天消息
                GetGame().Chat(prefix + " " + message, "colorStatusChannel");

                Print("[ChatCommands] Feedback: " + prefix + " " + message);
            }
        }
    }
};
```

### 聊天拦截的工作原理

`MissionGameplay` 上的 `OnEvent` 方法会被各种游戏事件调用。当 `eventTypeId` 为 `ChatMessageEventTypeID` 时，表示玩家刚刚提交了一条聊天消息。`Param3` 包含：

- `param1` -- 频道（int）：聊天频道（全局、直接等）
- `param2` -- 发送者名称（string）
- `param3` -- 消息文本（string）

我们检查消息是否以 `/` 开头。如果是，我们通过 RPC 将整个字符串转发到服务器。消息仍然会作为普通聊天发送——在生产模组中，你会抑制它（在末尾的注释中介绍）。

---

## 步骤 2：解析命令前缀和参数

在服务器端，我们需要将像 `/heal PlayerName` 这样的命令字符串分解为各部分：命令名称（`heal`）和参数（`["PlayerName"]`）。

### 创建 `Scripts/3_Game/ChatCommands/CCmdRPC.c`

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST  = 79001;
    static const int COMMAND_FEEDBACK = 79002;
};
```

### 创建 `Scripts/3_Game/ChatCommands/CCmdBase.c`

```c
// -------------------------------------------------------
// 所有聊天命令的基类
// -------------------------------------------------------
class CCmdBase
{
    // 不带 / 前缀的命令名称（例如 "heal"）
    string GetName()
    {
        return "";
    }

    // 在帮助或命令列表中显示的简短描述
    string GetDescription()
    {
        return "";
    }

    // 命令使用不正确时显示的用法语法
    string GetUsage()
    {
        return "/" + GetName();
    }

    // 此命令是否需要管理员权限
    bool RequiresAdmin()
    {
        return true;
    }

    // 在服务器上执行命令
    // 成功返回 true，失败返回 false
    bool Execute(PlayerIdentity caller, array<string> args)
    {
        return false;
    }

    // -------------------------------------------------------
    // 辅助方法：向命令调用者发送反馈消息
    // -------------------------------------------------------
    protected void SendFeedback(PlayerIdentity caller, string prefix, string message)
    {
        if (!caller)
            return;

        // 查找调用者的玩家对象
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
    // 辅助方法：通过部分名称匹配查找玩家
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

### 创建 `Scripts/3_Game/ChatCommands/CCmdRegistry.c`

```c
// -------------------------------------------------------
// 保存所有可用命令的注册表
// -------------------------------------------------------
class CCmdRegistry
{
    protected static ref map<string, ref CCmdBase> s_Commands;

    // -------------------------------------------------------
    // 初始化注册表（启动时调用一次）
    // -------------------------------------------------------
    static void Init()
    {
        if (!s_Commands)
            s_Commands = new map<string, ref CCmdBase>;
    }

    // -------------------------------------------------------
    // 注册一个命令实例
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
    // 按名称查找命令
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
    // 获取所有已注册的命令名称
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
    // 将原始命令字符串解析为名称 + 参数
    // 示例："/heal PlayerName" --> name="heal", args=["PlayerName"]
    // -------------------------------------------------------
    static void ParseCommand(string fullCommand, out string commandName, out array<string> args)
    {
        args = new array<string>;
        commandName = "";

        if (fullCommand.Length() == 0)
            return;

        // 移除前导 /
        string raw = fullCommand;
        if (raw.Substring(0, 1) == "/")
            raw = raw.Substring(1, raw.Length() - 1);

        // 按空格分割
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

### 解析逻辑说明

给定输入 `/heal SomePlayer`，`ParseCommand` 执行以下操作：

1. 移除前导 `/` 得到 `"heal SomePlayer"`
2. 按空格分割得到 `["heal", "SomePlayer"]`
3. 取第一个元素作为命令名称：`"heal"`
4. 从数组中移除它，留下参数：`["SomePlayer"]`

命令名称转换为小写，因此 `/Heal`、`/HEAL` 和 `/heal` 都能工作。

---

## 步骤 3：检查管理员权限

管理员权限检查可以阻止普通玩家执行管理员命令。DayZ 在脚本中没有内置的管理员权限系统，因此我们根据简单的管理员列表进行检查。

### 服务器处理器中的管理员检查

最简单的方法是将玩家的 Steam64 ID 与已知管理员 ID 列表进行比较。在生产模组中，你会从配置文件加载此列表。

```c
// 简单的管理员检查——在生产环境中，从 JSON 配置文件加载
static bool IsAdmin(PlayerIdentity identity)
{
    if (!identity)
        return false;

    // 检查玩家的纯 ID（Steam64 ID）
    string playerId = identity.GetPlainId();

    // 硬编码的管理员列表——在生产环境中替换为配置文件加载
    ref array<string> adminIds = new array<string>;
    adminIds.Insert("76561198000000001");    // 替换为真实的 Steam64 ID
    adminIds.Insert("76561198000000002");

    return (adminIds.Find(playerId) != -1);
}
```

### 在哪里找到 Steam64 ID

- 在浏览器中打开你的 Steam 个人资料
- URL 包含你的 Steam64 ID：`https://steamcommunity.com/profiles/76561198XXXXXXXXX`
- 或使用 https://steamid.io 等工具来查找任何玩家

### 生产级权限

在真正的模组中，你应该：

1. 将管理员 ID 存储在 JSON 文件中（`$profile:ChatCommands/admins.json`）
2. 在服务器启动时加载该文件
3. 支持权限等级（版主、管理员、超级管理员）
4. 使用像 MyMod Core 的 `MyPermissions` 系统这样的框架来实现分级权限

---

## 步骤 4：执行服务器端操作

现在我们创建实际的 `/heal` 命令和处理传入命令 RPC 的服务器处理器。

### 创建 `Scripts/4_World/ChatCommands/commands/CCmdHeal.c`

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
    // 执行治愈命令
    // /heal         --> 治愈调用者
    // /heal Name    --> 治愈指定名称的玩家
    // -------------------------------------------------------
    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (!caller)
            return false;

        Man targetMan = null;
        string targetName = "";

        // 确定目标玩家
        if (args.Count() > 0)
        {
            // 按名称治愈特定玩家
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
            // 治愈调用者自己
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

        // 执行治愈
        PlayerBase targetPlayer;
        if (!Class.CastTo(targetPlayer, targetMan))
        {
            SendFeedback(caller, "[Heal]", "Target is not a valid player.");
            return false;
        }

        HealPlayer(targetPlayer);

        // 记录日志并发送反馈
        Print("[ChatCommands] " + caller.GetName() + " healed " + targetName);
        SendFeedback(caller, "[Heal]", "Successfully healed " + targetName + ".");

        return true;
    }

    // -------------------------------------------------------
    // 对玩家执行完全治愈
    // -------------------------------------------------------
    protected void HealPlayer(PlayerBase player)
    {
        if (!player)
            return;

        // 将生命值恢复到最大值
        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));

        // 将血量恢复到最大值
        player.SetHealth("GlobalHealth", "Blood", player.GetMaxHealth("GlobalHealth", "Blood"));

        // 移除震荡伤害
        player.SetHealth("GlobalHealth", "Shock", player.GetMaxHealth("GlobalHealth", "Shock"));

        // 将饥饿设为饱（能量值）
        // PlayerBase 有一个属性系统——设置能量属性
        player.GetStatEnergy().Set(player.GetStatEnergy().GetMax());

        // 将口渴设为满（水分值）
        player.GetStatWater().Set(player.GetStatWater().GetMax());

        // 清除所有出血源
        player.GetBleedingManagerServer().RemoveAllSources();

        Print("[ChatCommands] Healed player: " + player.GetIdentity().GetName());
    }
};
```

### 为什么是 4_World？

治愈命令引用了 `PlayerBase`，它在 `4_World` 层级中定义。它还使用了仅在世界实体上可用的玩家属性方法（`GetStatEnergy`、`GetStatWater`、`GetBleedingManagerServer`）。该命令**必须**放在 `4_World` 或更高层级。

基类 `CCmdBase` 放在 `3_Game` 中，因为它不引用任何世界类型。涉及世界实体的具体命令类放在 `4_World` 中。

---

## 步骤 5：向管理员发送反馈

反馈由 `CCmdBase` 中的 `SendFeedback()` 方法处理。让我们追踪完整的反馈路径：

### 服务器发送反馈

```c
// 在 CCmdBase.SendFeedback() 内部
Param2<string, string> data = new Param2<string, string>(prefix, message);
GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
```

服务器向发出命令的特定客户端发送 `COMMAND_FEEDBACK` RPC。数据包含前缀（如 `"[Heal]"`）和消息文本。

### 客户端接收并显示反馈

回到 `CCmdChatHook.c`（步骤 1），`OnRPC` 处理器捕获到这个：

```c
if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
{
    // 反序列化消息
    Param2<string, string> data = new Param2<string, string>("", "");
    if (ctx.Read(data))
    {
        string prefix = data.param1;
        string message = data.param2;

        // 在聊天窗口中显示
        GetGame().Chat(prefix + " " + message, "colorStatusChannel");
    }
}
```

`GetGame().Chat()` 在玩家的聊天窗口中显示消息。第二个参数是颜色通道：

| 通道 | 颜色 | 典型用途 |
|---------|-------|-------------|
| `"colorStatusChannel"` | 黄色/橙色 | 系统消息 |
| `"colorAction"` | 白色 | 操作反馈 |
| `"colorFriendly"` | 绿色 | 正面反馈 |
| `"colorImportant"` | 红色 | 警告/错误 |

---

## 步骤 6：注册命令

服务器处理器接收命令 RPC，在注册表中查找命令并执行它。

### 创建 `Scripts/4_World/ChatCommands/CCmdServerHandler.c`

```c
modded class MissionServer
{
    // -------------------------------------------------------
    // 服务器启动时注册所有命令
    // -------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        CCmdRegistry.Init();

        // 在这里注册所有命令
        CCmdRegistry.Register(new CCmdHeal());

        // 添加更多命令：
        // CCmdRegistry.Register(new CCmdKill());
        // CCmdRegistry.Register(new CCmdTeleport());
        // CCmdRegistry.Register(new CCmdTime());

        Print("[ChatCommands] Server initialized. Commands registered.");
    }
};

// -------------------------------------------------------
// 处理传入命令的服务器端 RPC 处理器
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

        // 读取命令字符串
        Param1<string> data = new Param1<string>("");
        if (!ctx.Read(data))
        {
            Print("[ChatCommands] ERROR: Failed to read command RPC data.");
            return;
        }

        string fullCommand = data.param1;
        Print("[ChatCommands] Received command from " + sender.GetName() + ": " + fullCommand);

        // 解析命令
        string commandName;
        ref array<string> args;
        CCmdRegistry.ParseCommand(fullCommand, commandName, args);

        if (commandName == "")
            return;

        // 查找命令
        CCmdBase command = CCmdRegistry.GetCommand(commandName);
        if (!command)
        {
            SendCommandFeedback(sender, "[Error]", "Unknown command: /" + commandName);
            return;
        }

        // 检查管理员权限
        if (command.RequiresAdmin() && !IsCommandAdmin(sender))
        {
            Print("[ChatCommands] Non-admin " + sender.GetName() + " tried to use /" + commandName);
            SendCommandFeedback(sender, "[Error]", "You do not have permission to use this command.");
            return;
        }

        // 执行命令
        bool success = command.Execute(sender, args);

        if (success)
            Print("[ChatCommands] Command /" + commandName + " executed successfully by " + sender.GetName());
        else
            Print("[ChatCommands] Command /" + commandName + " failed for " + sender.GetName());
    }

    // -------------------------------------------------------
    // 检查玩家是否是管理员
    // -------------------------------------------------------
    protected bool IsCommandAdmin(PlayerIdentity identity)
    {
        if (!identity)
            return false;

        string playerId = identity.GetPlainId();

        // ----------------------------------------------------------
        // 重要：将这些替换为你的实际管理员 Steam64 ID
        // 在生产环境中，改为从 JSON 配置文件加载
        // ----------------------------------------------------------
        ref array<string> adminIds = new array<string>;
        adminIds.Insert("76561198000000001");
        adminIds.Insert("76561198000000002");

        return (adminIds.Find(playerId) != -1);
    }

    // -------------------------------------------------------
    // 向特定玩家发送反馈
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

### 注册模式

命令在 `MissionServer.OnInit()` 中注册：

```c
CCmdRegistry.Init();
CCmdRegistry.Register(new CCmdHeal());
```

每次 `Register()` 调用创建一个命令类的实例，并将其存储在以命令名称为键的映射中。当命令 RPC 到达时，处理器在注册表中查找名称，并在匹配的命令对象上调用 `Execute()`。

这种模式使添加新命令变得轻而易举——创建一个扩展 `CCmdBase` 的新类，实现 `Execute()`，然后添加一行 `Register()`。

---

## 步骤 7：添加到管理面板命令列表

如果你有管理面板（来自[第 8.3 章](03-admin-panel.md)），你可以在 UI 中显示可用命令的列表。

### 从服务器请求命令列表

在 `CCmdRPC.c` 中添加新的 RPC ID：

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST   = 79001;
    static const int COMMAND_FEEDBACK  = 79002;
    static const int COMMAND_LIST_REQ  = 79003;
    static const int COMMAND_LIST_RESP = 79004;
};
```

### 服务器端：发送命令列表

在你的服务器端代码中添加此处理器：

```c
// 在服务器处理器中，添加 COMMAND_LIST_REQ 的处理分支
if (rpc_type == CCmdRPC.COMMAND_LIST_REQ)
{
    HandleCommandListRequest(sender);
}

protected void HandleCommandListRequest(PlayerIdentity requestor)
{
    if (!requestor)
        return;

    // 构建所有命令的格式化字符串
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

    // 发送回客户端
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

### 客户端：在面板中显示

在客户端，捕获响应并将其显示在文本控件中：

```c
if (rpc_type == CCmdRPC.COMMAND_LIST_RESP)
{
    Param1<string> data = new Param1<string>("");
    if (ctx.Read(data))
    {
        string commandList = data.param1;
        // 在你的管理面板文本控件中显示
        // m_CommandListText.SetText(commandList);
        Print("[ChatCommands] Command list received:\n" + commandList);
    }
}
```

---

## 完整可用代码：/heal 命令

以下是完整工作系统所需的每个文件。创建这些文件，你的模组就会拥有一个可用的 `/heal` 命令。

### config.cpp 设置

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

        // 将这些替换为你的实际管理员 STEAM64 ID
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

## 添加更多命令

注册模式使添加新命令变得简单直接。以下是一些示例：

### /kill 命令

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

### /time 命令

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

### 注册新命令

在 `MissionServer.OnInit()` 中每个命令添加一行：

```c
CCmdRegistry.Register(new CCmdHeal());
CCmdRegistry.Register(new CCmdKill());
CCmdRegistry.Register(new CCmdTime());
```

---

## 故障排除

### 命令未被识别（"Unknown command"）

- **缺少注册：** 确保在 `MissionServer.OnInit()` 中调用了 `CCmdRegistry.Register(new CCmdYourCommand())`。
- **GetName() 拼写错误：** `GetName()` 返回的字符串必须与玩家输入的内容匹配（不含 `/`）。
- **大小写不匹配：** 注册表将名称转换为小写。`/Heal`、`/HEAL` 和 `/heal` 应该都能工作。

### 管理员被拒绝权限

- **错误的 Steam64 ID：** 仔细检查 `IsCommandAdmin()` 中的管理员 ID。它们必须是精确的 Steam64 ID（以 `7656` 开头的 17 位数字）。
- **GetPlainId() 与 GetId()：** `GetPlainId()` 返回 Steam64 ID。`GetId()` 返回 DayZ 会话 ID。使用 `GetPlainId()` 进行管理员检查。

### 反馈消息未出现在聊天中

- **RPC 未到达客户端：** 在服务器上添加 `Print()` 语句以确认反馈 RPC 正在发送。
- **客户端 OnRPC 未捕获：** 验证 RPC ID 匹配（`CCmdRPC.COMMAND_FEEDBACK`）。
- **GetGame().Chat() 不工作：** 此函数需要游戏处于聊天可用的状态。在加载画面上可能不工作。

### /heal 实际上没有治愈

- **仅服务器端执行：** `SetHealth()` 和属性更改必须在服务器上运行。验证 `Execute()` 运行时 `GetGame().IsServer()` 为 true。
- **PlayerBase 转换失败：** 如果 `Class.CastTo(targetPlayer, targetMan)` 返回 false，则目标不是有效的 PlayerBase。这可能发生在 AI 或非玩家实体上。
- **属性获取器返回 null：** 如果玩家已死亡或未完全初始化，`GetStatEnergy()` 和 `GetStatWater()` 可能返回 null。在生产代码中添加 null 检查。

### 命令作为普通消息出现在聊天中

- `OnEvent` 钩子拦截消息但不会抑制它作为聊天发送。要在生产模组中抑制它，你需要修改 `ChatInputMenu` 类以在发送之前过滤 `/` 消息：

```c
modded class ChatInputMenu
{
    override void OnChatInputSend()
    {
        string text = "";
        // 从编辑控件获取当前文本
        // 如果以 / 开头，不要调用 super（它会将其作为聊天发送）
        // 而是将其作为命令处理

        // 此方法因 DayZ 版本而异——检查原版源代码
        super.OnChatInputSend();
    }
};
```

具体实现取决于 DayZ 版本以及 `ChatInputMenu` 如何暴露文本。本教程中的 `OnEvent` 方法更简单且适用于开发，代价是命令文本也会作为聊天消息出现。

---

## 下一步

1. **从配置文件加载管理员** -- 使用 `JsonFileLoader` 从 JSON 文件加载管理员 ID，而不是硬编码。
2. **添加 /help 命令** -- 列出所有可用命令及其描述和用法。
3. **添加日志记录** -- 将命令使用情况写入日志文件以供审计。
4. **与框架集成** -- MyMod Core 提供 `MyPermissions` 用于分级权限，`MyRPC` 用于字符串路由的 RPC 以避免整数 ID 冲突。
5. **添加冷却时间** -- 通过跟踪每个玩家的上次执行时间来防止命令刷屏。
6. **构建命令面板 UI** -- 创建一个管理面板，列出所有带有可点击按钮的命令（将本教程与[第 8.3 章](03-admin-panel.md)结合）。

---

## 最佳实践

- **执行管理员命令前始终检查权限。** 缺少权限检查意味着任何玩家都可以 `/heal` 或 `/kill` 任何人。在处理之前在服务器上验证调用者的 Steam64 ID（通过 `GetPlainId()`）。
- **即使命令失败也要向管理员发送反馈。** 静默失败使调试不可能。始终发送聊天消息解释出了什么问题（"Player not found"、"Permission denied"）。
- **使用 `GetPlainId()` 进行管理员检查，而不是 `GetId()`。** `GetId()` 返回每次重新连接都会改变的会话特定 DayZ ID。`GetPlainId()` 返回永久的 Steam64 ID。
- **将管理员 ID 存储在 JSON 配置文件中，而不是代码中。** 硬编码的 ID 需要重建 PBO 才能更改。`$profile:` JSON 文件可以由服务器管理员在没有模组知识的情况下编辑。
- **在匹配之前将命令名称转换为小写。** 玩家可能输入 `/Heal`、`/HEAL` 或 `/heal`。规范化为小写可以防止令人沮丧的"未知命令"错误。

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| 通过 `OnEvent` 的聊天钩子 | 拦截消息并将其作为命令处理 | 消息仍然作为聊天对所有玩家显示。抑制它需要修改 `ChatInputMenu`，这因 DayZ 版本而异。 |
| `GetGame().Chat()` | 在玩家的聊天窗口中显示消息 | 仅在聊天 UI 活动时有效。在加载画面或某些菜单状态下，消息会被静默丢弃。 |
| 命令注册模式 | 每个命令一个类的干净架构 | 每个命令类文件必须放在正确的脚本层级中。`CCmdBase` 在 `3_Game`，引用 `PlayerBase` 的具体命令在 `4_World`。放错层级会在加载时导致 "Undefined type" 错误。 |
| 按名称查找玩家 | `FindPlayerByName` 匹配部分名称 | 在有类似名称的服务器上，部分匹配可能定位到错误的玩家。在生产环境中，首选 Steam64 ID 定位或添加确认步骤。 |

---

## 你学到了什么

在本教程中你学到了：
- 如何使用 `MissionGameplay.OnEvent` 和 `ChatMessageEventTypeID` 挂接聊天输入
- 如何从聊天文本解析命令前缀和参数
- 如何使用 Steam64 ID 在服务器上检查管理员权限
- 如何通过 RPC 和 `GetGame().Chat()` 将命令反馈发送回玩家
- 如何构建可复用的命令注册模式以添加新命令

**下一章：** [第 8.6 章：调试和测试你的模组](06-debugging-testing.md)

---

**上一章：** [第 8.3 章：构建管理员面板模块](03-admin-panel.md)
