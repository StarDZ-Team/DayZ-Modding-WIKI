# 第 8.3 章：构建管理员面板模块

[首页](../../README.md) | [<< 上一章：创建自定义物品](02-custom-item.md) | **构建管理员面板** | [下一章：添加聊天命令 >>](04-chat-commands.md)

---

> **摘要：** 本教程将引导你从零开始构建一个完整的管理员面板模块。你将创建 UI 布局、在脚本中绑定控件、处理按钮点击、从客户端向服务器发送 RPC、在服务器上处理请求、将响应发送回客户端，并在 UI 中显示结果。这涵盖了每个联网模组都需要的完整客户端-服务器-客户端往返流程。

---

## 目录

- [我们要构建什么](#what-we-are-building)
- [前提条件](#prerequisites)
- [架构概述](#architecture-overview)
- [步骤 1：创建模块类](#step-1-create-the-module-class)
- [步骤 2：创建布局文件](#step-2-create-the-layout-file)
- [步骤 3：在 OnActivated 中绑定控件](#step-3-bind-widgets-in-onactivated)
- [步骤 4：处理按钮点击](#step-4-handle-button-clicks)
- [步骤 5：向服务器发送 RPC](#step-5-send-an-rpc-to-the-server)
- [步骤 6：处理服务器端响应](#step-6-handle-the-server-side-response)
- [步骤 7：用接收到的数据更新 UI](#step-7-update-the-ui-with-received-data)
- [步骤 8：注册模块](#step-8-register-the-module)
- [完整文件参考](#complete-file-reference)
- [完整往返流程解析](#the-full-roundtrip-explained)
- [故障排除](#troubleshooting)
- [下一步](#next-steps)

---

## 我们要构建什么

我们将创建一个 **管理员玩家信息** 面板，它能够：

1. 在一个简单的 UI 面板中显示"刷新"按钮
2. 当管理员点击"刷新"时，向服务器发送一个请求玩家数量数据的 RPC
3. 服务器接收请求，收集信息，然后将其发送回来
4. 客户端接收响应并在 UI 中显示玩家数量和列表

这演示了 DayZ 中每个联网管理工具、模组配置面板和多人 UI 所使用的基本模式。

---

## 前提条件

- 来自[第 8.1 章](01-first-mod.md)的可用模组，或具有标准结构的新模组
- 理解[5 层脚本层级](../02-mod-structure/01-five-layers.md)（我们将使用 `3_Game`、`4_World` 和 `5_Mission`）
- 能够基本阅读 Enforce Script 代码

### 本教程的模组结构

我们将创建以下新文件：

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

## 架构概述

在编写代码之前，先了解数据流向：

```
客户端                              服务器
------                              ------

1. 管理员点击"刷新"
2. 客户端发送 RPC ------>  3. 服务器接收 RPC
   (AdminDemo_RequestInfo)       收集玩家数据
                             4. 服务器发送 RPC ------>  客户端
                                (AdminDemo_ResponseInfo)
                                                     5. 客户端接收 RPC
                                                        更新 UI 文本
```

RPC（远程过程调用）系统是 DayZ 中客户端和服务器通信的方式。引擎提供了 `GetGame().RPCSingleParam()` 和 `GetGame().RPC()` 方法来发送数据，以及 `OnRPC()` 重写来接收数据。

**关键约束：**
- 客户端无法直接读取服务器端数据（玩家列表、服务器状态）
- 所有跨边界通信必须通过 RPC 进行
- RPC 消息通过整数 ID 来标识
- 数据使用 `Param` 类进行序列化后发送

---

## 步骤 1：创建模块类

首先，在 `3_Game` 中定义 RPC 标识符（这是游戏类型可用的最早层级）。RPC ID 必须在 `3_Game` 中定义，因为 `4_World`（服务器处理器）和 `5_Mission`（客户端处理器）都需要引用它们。

### 创建 `Scripts/3_Game/AdminDemo/AdminDemoRPC.c`

```c
class AdminDemoRPC
{
    // RPC ID -- 选择不与其他模组冲突的唯一数字
    // 使用较大的数字可以降低冲突风险
    static const int REQUEST_PLAYER_INFO  = 78001;
    static const int RESPONSE_PLAYER_INFO = 78002;
};
```

这些常量将被客户端（用于发送请求）和服务器（用于识别传入请求和发送响应）共同使用。

### 为什么是 3_Game？

RPC ID 是纯数据——不依赖于世界实体或 UI 的整数。将它们放在 `3_Game` 中使其对 `4_World`（服务器处理器所在层）和 `5_Mission`（客户端 UI 所在层）都可见。

---

## 步骤 2：创建布局文件

布局文件定义了面板的视觉结构。DayZ 使用自定义的基于文本的格式（不是 XML）来定义 `.layout` 文件。

### 创建 `GUI/layouts/admin_player_info.layout`

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

### 布局详解

| 控件 | 用途 |
|--------|---------|
| `AdminDemoPanel` | 根框架，宽 40%、高 50%，屏幕居中 |
| `Background` | 深色半透明背景，填充整个面板 |
| `Title` | 顶部的 "Player Info Panel" 文本 |
| `RefreshButton` | 管理员点击以请求数据的按钮 |
| `PlayerCountText` | 显示玩家数量 |
| `PlayerListText` | 显示玩家名称列表 |
| `CloseButton` | 关闭面板 |

所有尺寸使用比例坐标（相对于父级的 0.0 到 1.0），因为 `hexactsize` 和 `vexactsize` 设置为 `0`。

---

## 步骤 3：在 OnActivated 中绑定控件

现在创建客户端面板脚本，加载布局并将控件连接到变量。

### 创建 `Scripts/5_Mission/AdminDemo/AdminDemoPanel.c`

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
    // 打开面板：创建控件并绑定引用
    // -------------------------------------------------------
    void Open()
    {
        if (m_IsOpen)
            return;

        // 加载布局文件并获取根控件
        m_Root = GetGame().GetWorkspace().CreateWidgets("AdminDemo/GUI/layouts/admin_player_info.layout");
        if (!m_Root)
        {
            Print("[AdminDemo] ERROR: Failed to load layout file!");
            return;
        }

        // 按名称绑定控件引用
        m_RefreshButton  = ButtonWidget.Cast(m_Root.FindAnyWidget("RefreshButton"));
        m_CloseButton    = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));
        m_PlayerCountText = TextWidget.Cast(m_Root.FindAnyWidget("PlayerCountText"));
        m_PlayerListText  = TextWidget.Cast(m_Root.FindAnyWidget("PlayerListText"));

        // 将此类注册为控件的事件处理器
        if (m_RefreshButton)
            m_RefreshButton.SetHandler(this);

        if (m_CloseButton)
            m_CloseButton.SetHandler(this);

        m_Root.Show(true);
        m_IsOpen = true;

        // 显示鼠标光标以便管理员可以点击按钮
        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print("[AdminDemo] Panel opened.");
    }

    // -------------------------------------------------------
    // 关闭面板：销毁控件并恢复控制
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

        // 恢复玩家控制并隐藏光标
        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print("[AdminDemo] Panel closed.");
    }

    bool IsOpen()
    {
        return m_IsOpen;
    }

    // -------------------------------------------------------
    // 切换打开/关闭
    // -------------------------------------------------------
    void Toggle()
    {
        if (m_IsOpen)
            Close();
        else
            Open();
    }

    // -------------------------------------------------------
    // 处理按钮点击事件
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
    // 当管理员点击刷新时调用
    // -------------------------------------------------------
    protected void OnRefreshClicked()
    {
        Print("[AdminDemo] Refresh clicked, sending RPC to server...");

        // 更新 UI 显示加载状态
        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: Loading...");

        if (m_PlayerListText)
            m_PlayerListText.SetText("Requesting data from server...");

        // 向服务器发送 RPC
        // 参数：目标对象，RPC ID，数据，接收者（null = 服务器）
        Man player = GetGame().GetPlayer();
        if (player)
        {
            Param1<bool> params = new Param1<bool>(true);
            GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
        }
    }

    // -------------------------------------------------------
    // 当服务器响应到达时调用（来自 Mission 的 OnRPC）
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

### 关键概念

**`CreateWidgets()`** 加载 `.layout` 文件并在内存中创建实际的控件对象。它返回根控件。

**`FindAnyWidget("name")`** 在控件树中搜索具有给定名称的控件。名称必须与布局文件中的控件名称完全匹配。

**`Cast()`** 将通用的 `Widget` 引用转换为特定类型（如 `ButtonWidget`）。这是必需的，因为 `FindAnyWidget` 返回的是基类 `Widget` 类型。

**`SetHandler(this)`** 将此类注册为控件的事件处理器。当按钮被点击时，引擎会在此对象上调用 `OnClick()`。

**`PlayerControlDisable` / `PlayerControlEnable`** 禁用/重新启用玩家移动和操作。如果不这样做，玩家在尝试点击按钮时会四处走动。

---

## 步骤 4：处理按钮点击

按钮点击处理已经在步骤 3 的 `OnClick()` 方法中实现了。让我们更仔细地研究这个模式。

### OnClick 模式

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_RefreshButton)
    {
        OnRefreshClicked();
        return true;    // 事件已消费——停止传播
    }

    if (w == m_CloseButton)
    {
        Close();
        return true;
    }

    return false;        // 事件未消费——继续传播
}
```

**参数：**
- `w` -- 被点击的控件
- `x`、`y` -- 点击时的鼠标坐标
- `button` -- 哪个鼠标按键（0 = 左键，1 = 右键，2 = 中键）

**返回值：**
- `true` 表示你处理了该事件。它将停止向父控件传播。
- `false` 表示你没有处理它。引擎将其传递给下一个处理器。

**模式：** 将被点击的控件 `w` 与你已知的控件引用进行比较。为每个识别的按钮调用处理方法。对已处理的点击返回 `true`，对其他所有情况返回 `false`。

---

## 步骤 5：向服务器发送 RPC

当管理员点击刷新时，我们需要从客户端向服务器发送一条消息。DayZ 为此提供了 RPC 系统。

### RPC 发送（客户端到服务器）

步骤 3 中的核心发送调用：

```c
Man player = GetGame().GetPlayer();
if (player)
{
    Param1<bool> params = new Param1<bool>(true);
    GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
}
```

**`GetGame().RPCSingleParam(target, rpcID, params, guaranteed)`：**

| 参数 | 含义 |
|-----------|---------|
| `target` | 此 RPC 关联的对象。使用玩家对象是标准做法。 |
| `rpcID` | 你的唯一整数标识符（在 `AdminDemoRPC` 中定义）。 |
| `params` | 携带数据负载的 `Param` 对象。 |
| `guaranteed` | `true` = 类似 TCP 的可靠传输。`false` = 类似 UDP 的即发即忘。管理员操作始终使用 `true`。 |

### Param 类

DayZ 提供了用于发送数据的模板 `Param` 类：

| 类 | 用法 |
|-------|-------|
| `Param1<T>` | 一个值 |
| `Param2<T1, T2>` | 两个值 |
| `Param3<T1, T2, T3>` | 三个值 |

你可以发送字符串、整数、浮点数、布尔值和向量。多值示例：

```c
Param3<string, int, float> data = new Param3<string, int, float>("hello", 42, 3.14);
GetGame().RPCSingleParam(player, MY_RPC_ID, data, true);
```

---

## 步骤 6：处理服务器端响应

服务器接收客户端的 RPC，收集数据，并发送响应。

### 创建 `Scripts/4_World/AdminDemo/AdminDemoServer.c`

```c
modded class PlayerBase
{
    // -------------------------------------------------------
    // 服务器端 RPC 处理器
    // -------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        // 仅在服务器上处理
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
    // 收集玩家数据并发送响应
    // -------------------------------------------------------
    protected void HandlePlayerInfoRequest(PlayerIdentity requestor)
    {
        if (!requestor)
            return;

        Print("[AdminDemo] Server received player info request from: " + requestor.GetName());

        // --- 权限检查（可选但推荐） ---
        // 在实际模组中，检查请求者是否是管理员：
        // if (!IsAdmin(requestor))
        //     return;

        // --- 收集玩家数据 ---
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

        // --- 将响应发送回请求客户端 ---
        Param2<int, string> responseData = new Param2<int, string>(playerCount, playerNames);

        // 使用请求者的玩家对象调用 RPCSingleParam 以发送到特定客户端
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

### 服务器端 RPC 接收的工作原理

1. **`OnRPC()` 在目标对象上被调用。** 当客户端使用 `target = player` 发送 RPC 时，服务器端的 `PlayerBase.OnRPC()` 触发。

2. **始终调用 `super.OnRPC()`。** 其他模组和原版代码也可能在此对象上处理 RPC。

3. **检查 `GetGame().IsServer()`。** 此代码在 `4_World` 中，它在客户端和服务器上都会编译。`IsServer()` 检查确保我们只在服务器上处理请求。

4. **根据 `rpc_type` 进行 switch 判断。** 与你的 RPC ID 常量进行匹配。

5. **发送响应。** 使用 `RPCSingleParam`，将第五个参数（`recipient`）设置为请求玩家的身份标识。这会将响应仅发送给该特定客户端。

### RPCSingleParam 响应签名

```c
GetGame().RPCSingleParam(
    requestorPlayer,                        // 目标对象（玩家）
    AdminDemoRPC.RESPONSE_PLAYER_INFO,      // RPC ID
    responseData,                           // 数据负载
    true,                                   // 保证送达
    requestor                               // 接收者身份标识（特定客户端）
);
```

第五个参数 `requestor`（一个 `PlayerIdentity`）使其成为定向响应。没有它，RPC 将发送给所有客户端。

---

## 步骤 7：用接收到的数据更新 UI

回到客户端，我们需要拦截服务器的响应 RPC 并将其路由到面板。

### 创建 `Scripts/5_Mission/AdminDemo/AdminDemoMission.c`

```c
modded class MissionGameplay
{
    protected ref AdminDemoPanel m_AdminDemoPanel;

    // -------------------------------------------------------
    // 在任务开始时初始化面板
    // -------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        if (!m_AdminDemoPanel)
            m_AdminDemoPanel = new AdminDemoPanel();

        Print("[AdminDemo] Client mission initialized.");
    }

    // -------------------------------------------------------
    // 在任务结束时清理
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
    // 处理键盘输入以切换面板
    // -------------------------------------------------------
    override void OnKeyPress(int key)
    {
        super.OnKeyPress(key);

        // F5 键切换管理员面板
        if (key == KeyCode.KC_F5)
        {
            if (m_AdminDemoPanel)
                m_AdminDemoPanel.Toggle();
        }
    }

    // -------------------------------------------------------
    // 在客户端接收服务器 RPC
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
    // 反序列化服务器响应并更新面板
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

### 客户端 RPC 接收的工作原理

1. **`MissionGameplay.OnRPC()`** 是客户端接收 RPC 的通用处理器。它会为每个传入的 RPC 触发。

2. **`ParamsReadContext ctx`** 包含服务器发送的序列化数据。你必须使用匹配的 `Param` 类型通过 `ctx.Read()` 来反序列化它。

3. **匹配 Param 类型至关重要。** 服务器发送了 `Param2<int, string>`。客户端必须用 `Param2<int, string>` 来读取。类型不匹配会导致 `ctx.Read()` 返回 `false`，无法获取任何数据。

4. **将数据路由到面板。** 反序列化后，调用面板对象上的方法来更新 UI。

### OnKeyPress 处理器

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

这挂接到任务的键盘输入。当管理员按下 F5 时，面板打开或关闭。`KeyCode.KC_F5` 是 F5 键的内置常量。

---

## 步骤 8：注册模块

最后，在 config.cpp 中将所有内容关联起来。

### 创建 `AdminDemo/mod.cpp`

```cpp
name = "Admin Demo";
author = "YourName";
version = "1.0";
overview = "Tutorial admin panel demonstrating the full RPC roundtrip pattern.";
```

### 创建 `AdminDemo/Scripts/config.cpp`

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

### 为什么需要三个层级？

| 层级 | 包含 | 原因 |
|-------|----------|--------|
| `3_Game` | `AdminDemoRPC.c` | RPC ID 常量需要对 `4_World` 和 `5_Mission` 都可见 |
| `4_World` | `AdminDemoServer.c` | 修改 `PlayerBase`（世界实体）的服务器端处理器 |
| `5_Mission` | `AdminDemoPanel.c`、`AdminDemoMission.c` | 客户端 UI 和任务钩子 |

---

## 完整文件参考

### 最终目录结构

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

## 完整往返流程解析

以下是管理员按下 F5 并点击刷新时的确切事件序列：

```
1. [客户端] 管理员按下 F5
   --> MissionGameplay.OnKeyPress(KC_F5) 触发
   --> AdminDemoPanel.Toggle() 被调用
   --> 面板打开，布局被创建，光标出现

2. [客户端] 管理员点击"刷新"按钮
   --> AdminDemoPanel.OnClick() 触发，w == m_RefreshButton
   --> OnRefreshClicked() 被调用
   --> UI 显示"加载中..."
   --> RPCSingleParam 发送 REQUEST_PLAYER_INFO (78001) 到服务器

3. [网络] RPC 从客户端传输到服务器

4. [服务器] PlayerBase.OnRPC() 触发
   --> rpc_type 匹配 REQUEST_PLAYER_INFO
   --> HandlePlayerInfoRequest(sender) 被调用
   --> 服务器遍历所有已连接的玩家
   --> 构建玩家数量和名称列表
   --> RPCSingleParam 发送 RESPONSE_PLAYER_INFO (78002) 回客户端

5. [网络] RPC 从服务器传输到客户端

6. [客户端] MissionGameplay.OnRPC() 触发
   --> rpc_type 匹配 RESPONSE_PLAYER_INFO
   --> HandlePlayerInfoResponse(ctx) 被调用
   --> 从 ParamsReadContext 反序列化数据
   --> AdminDemoPanel.OnPlayerInfoReceived() 被调用
   --> UI 更新显示玩家数量和名称

总耗时：在局域网上通常不到 100 毫秒。
```

---

## 故障排除

### 按 F5 时面板不打开

- **检查 OnKeyPress 重写：** 确保首先调用了 `super.OnKeyPress(key)`。
- **检查键码：** `KeyCode.KC_F5` 是正确的常量。如果使用其他键，请在 Enforce Script API 中找到正确的常量。
- **检查初始化：** 确保在 `OnInit()` 中创建了 `m_AdminDemoPanel`。

### 面板打开但按钮不工作

- **检查 SetHandler：** 每个按钮都需要调用 `button.SetHandler(this)`。
- **检查控件名称：** `FindAnyWidget("RefreshButton")` 区分大小写。名称必须与布局文件完全匹配。
- **检查 OnClick 返回值：** 确保 `OnClick` 对已处理的按钮返回 `true`。

### RPC 从未到达服务器

- **检查 RPC ID 唯一性：** 如果另一个模组使用相同的 RPC ID 数字，将会产生冲突。使用较大的唯一数字。
- **检查玩家引用：** 如果在玩家完全初始化之前调用 `GetGame().GetPlayer()`，它会返回 `null`。确保面板仅在玩家生成后才打开。
- **检查服务器代码是否编译：** 在服务器脚本日志中查找 `4_World` 代码的 `SCRIPT (E)` 错误。

### 服务器响应从未到达客户端

- **检查接收者参数：** `RPCSingleParam` 的第五个参数必须是目标客户端的 `PlayerIdentity`。
- **检查 Param 类型匹配：** 服务器发送 `Param2<int, string>`，客户端读取 `Param2<int, string>`。类型不匹配会导致 `ctx.Read()` 失败。
- **检查 MissionGameplay.OnRPC 重写：** 确保你调用了 `super.OnRPC()` 并且方法签名正确。

### UI 显示但数据不更新

- **空控件引用：** 如果 `FindAnyWidget` 返回 `null`（控件名称拼写错误），`SetText()` 调用将静默失败。
- **检查面板引用：** 确保任务类中的 `m_AdminDemoPanel` 是已打开的同一对象。
- **添加 Print 语句：** 通过在每个步骤添加 `Print()` 调用来追踪数据流。

---

## 下一步

1. **[第 8.4 章：添加聊天命令](04-chat-commands.md)** -- 创建服务器端聊天命令用于管理员操作。
2. **添加权限** -- 在处理 RPC 之前检查请求玩家是否是管理员。
3. **添加更多功能** -- 使用选项卡扩展面板，用于天气控制、玩家传送、物品生成。
4. **使用框架** -- 像 MyMod Core 这样的框架提供了内置的 RPC 路由、配置管理和管理面板基础设施，可以消除大量样板代码。
5. **美化 UI** -- 在[第 3 章：GUI 系统](../03-gui-system/01-widget-types.md)中学习控件样式、图像集和字体。

---

## 最佳实践

- **在执行前始终在服务器上验证所有 RPC 数据。** 永远不要信任来自客户端的数据——在执行任何服务器操作之前，始终检查权限、验证参数并防范空值。
- **将控件引用缓存到成员变量中，而不是每帧调用 `FindAnyWidget`。** 控件查找不是免费的；在 `OnUpdate` 或 `OnClick` 中反复调用会浪费性能。
- **始终对交互控件调用 `SetHandler(this)`。** 没有它，`OnClick()` 永远不会触发，而且没有错误消息——按钮只是静默地不做任何事。
- **使用较大的唯一 RPC ID 数字。** 原版 DayZ 使用小的 ID。其他模组选择常见范围。使用 70000 以上的数字，并在注释中添加你的模组前缀，这样冲突可以被追踪。
- **在 `OnMissionFinish` 中清理控件。** 泄漏的控件根节点会在服务器跳转间累积，消耗内存并导致幽灵 UI 元素。

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| `RPCSingleParam` 传输 | 设置 `guaranteed=true` 意味着 RPC 总会到达 | 如果玩家在传输过程中断开连接或服务器崩溃，RPC 仍然可能丢失。始终在 UI 中处理"无响应"的情况（例如，超时消息）。 |
| `OnClick` 控件匹配 | 比较 `w == m_Button` 来识别点击 | 如果 `FindAnyWidget` 返回了 NULL（控件名称拼写错误），`m_Button` 为 NULL，比较会静默失败。始终在 `Open()` 中记录控件绑定失败的警告。 |
| Param 类型匹配 | 客户端和服务器使用相同的 `Param2<int, string>` | 如果类型或顺序不完全匹配，`ctx.Read()` 返回 false，数据将被静默丢失。运行时没有类型检查错误消息。 |
| 监听服务器测试 | 足以进行快速迭代 | 监听服务器在一个进程中运行客户端和服务器，所以 RPC 即时到达且不经过网络。时序错误、丢包和权限问题只会在真正的专用服务器上出现。 |

---

## 你学到了什么

在本教程中你学到了：
- 如何使用布局文件创建 UI 面板并在脚本中绑定控件
- 如何使用 `OnClick()` 和 `SetHandler()` 处理按钮点击
- 如何使用 `RPCSingleParam` 和 `Param` 类在客户端和服务器之间发送 RPC
- 每个联网管理工具使用的完整客户端-服务器-客户端往返模式
- 如何在 `MissionGameplay` 中注册面板并进行正确的生命周期管理

**下一章：** [第 8.4 章：添加聊天命令](04-chat-commands.md)

---

**上一章：** [第 8.2 章：创建自定义物品](02-custom-item.md)
**下一章：** [第 8.4 章：添加聊天命令](04-chat-commands.md)
