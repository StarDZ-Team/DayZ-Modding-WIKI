# 第 8.8 章：构建 HUD 覆盖层

[首页](../../README.md) | [<< 上一章：发布到 Steam 创意工坊](07-publishing-workshop.md) | **构建 HUD 覆盖层** | [下一章：专业模组模板 >>](09-professional-template.md)

---

> **摘要：** 本教程将引导你构建一个在屏幕右上角显示服务器信息的自定义 HUD 覆盖层。你将创建布局文件、编写控制器类、挂接到任务生命周期、通过 RPC 从服务器请求数据、添加切换快捷键，并通过淡入淡出动画和智能可见性来完善结果。完成后，你将拥有一个非侵入式的服务器信息 HUD，显示服务器名称、玩家数量和当前游戏内时间——以及对 DayZ 中 HUD 覆盖层工作原理的深入理解。

---

## 目录

- [我们要构建什么](#what-we-are-building)
- [前提条件](#prerequisites)
- [模组结构](#mod-structure)
- [步骤 1：创建布局文件](#step-1-create-the-layout-file)
- [步骤 2：创建 HUD 控制器类](#step-2-create-the-hud-controller-class)
- [步骤 3：挂接到 MissionGameplay](#step-3-hook-into-missiongameplay)
- [步骤 4：从服务器请求数据](#step-4-request-data-from-server)
- [步骤 5：添加快捷键切换](#step-5-add-toggle-with-keybind)
- [步骤 6：完善](#step-6-polish)
- [完整代码参考](#complete-code-reference)
- [扩展 HUD](#extending-the-hud)
- [常见错误](#common-mistakes)
- [下一步](#next-steps)

---

## 我们要构建什么

一个锚定在屏幕右上角的小型半透明面板，显示三行信息：

```
  Aurora Survival [Official]
  Players: 24 / 60
  Time: 14:35
```

面板位于状态指示器下方和快捷栏上方。它每秒更新一次（不是每帧），显示时淡入，隐藏时淡出，并在打开背包或暂停菜单时自动隐藏。玩家可以用一个可配置的按键（默认：**F7**）来切换它的开关。

### 预期效果

加载后，你将在屏幕右上角看到一个深色半透明矩形。白色文本在第一行显示服务器名称，第二行显示当前玩家数量，第三行显示游戏内世界时间。按下 F7 平滑地淡出；再次按下 F7 淡入恢复。

---

## 前提条件

- 一个可用的模组结构（先完成[第 8.1 章](01-first-mod.md)）
- 基本了解 Enforce Script 语法
- 熟悉 DayZ 的客户端-服务器模型（HUD 在客户端运行；玩家数量来自服务器）

---

## 模组结构

创建以下目录树：

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

`3_Game` 层定义常量（我们的 RPC ID）。`4_World` 层处理服务器端响应。`5_Mission` 层包含 HUD 类和任务钩子。布局文件定义控件树。

---

## 步骤 1：创建布局文件

布局文件（`.layout`）用 XML 定义控件层次结构。DayZ 的 GUI 系统使用坐标模型，其中每个控件的位置和大小以比例值（父级的 0.0 到 1.0）加像素偏移来表示。

### `GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <!-- 根框架：覆盖全屏，不消费输入 -->
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
        <!-- 背景面板：右上角 -->
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
            <!-- 服务器名称文本 -->
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
            <!-- 玩家数量文本 -->
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
            <!-- 游戏内时间文本 -->
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

### 关键布局概念

| 属性 | 含义 |
|-----------|---------|
| `halign="2"` | 水平对齐：**右对齐**。控件锚定到其父级的右边缘。 |
| `valign="0"` | 垂直对齐：**顶部**。 |
| `hexactpos="0"` + `vexactpos="1"` | 水平位置是比例值（1.0 = 右边缘），垂直位置是像素值。 |
| `hexactsize="1"` + `vexactsize="1"` | 宽度和高度是像素值（220 x 70）。 |
| `color="0 0 0 0.55"` | RGBA 浮点值。背景面板为 55% 不透明度的黑色。 |

`ServerInfoPanel` 位于比例 X=1.0（右边缘），`halign="2"`（右对齐），因此面板的右边缘与屏幕右侧齐平。Y 位置距顶部 0 像素。这将我们的 HUD 放在右上角。

**为什么面板使用像素大小？** 比例大小会让面板随分辨率缩放，但对于小型信息控件，你需要固定的像素占用空间，这样文本在所有分辨率下都保持可读。

---

## 步骤 2：创建 HUD 控制器类

控制器类加载布局、按名称查找控件，并暴露更新显示文本的方法。它扩展 `ScriptedWidgetEventHandler`，以便在需要时可以接收控件事件。

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

    // 刷新显示数据的频率（秒）
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

    // 创建并显示 HUD
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

        // 从服务器请求初始数据
        RequestServerInfo();
    }

    // 移除所有控件
    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    // 每帧从 MissionGameplay.OnUpdate 调用
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

    // 更新游戏内时间显示（客户端，不需要 RPC）
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

    // 向服务器发送 RPC 请求玩家数量和服务器名称
    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            // 离线模式：只显示本地信息
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

    // --- 数据到达时调用的设置方法 ---

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

    // 切换可见性
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (m_Root)
            m_Root.Show(m_IsVisible);
    }

    // 菜单打开时隐藏
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

### 重要细节

1. **`CreateWidgets` 路径**：路径相对于模组根目录。由于我们将 `GUI/` 文件夹打包在 PBO 中，引擎使用模组前缀来解析 `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout`。
2. **`FindAnyWidget`**：按名称递归搜索控件树。转换后始终检查 NULL。
3. **`Widget.Unlink()`**：正确地从 UI 树中移除控件及其所有子控件。清理时始终调用此方法。
4. **计时器累加器模式**：我们每帧添加 `timeslice`，只有当累积时间超过 `UPDATE_INTERVAL` 时才执行操作。这防止了每帧都做额外工作。

---

## 步骤 3：挂接到 MissionGameplay

`MissionGameplay` 类是客户端的任务控制器。我们使用 `modded class` 将 HUD 注入其生命周期，而不需要替换原版文件。

### `Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        // 创建 HUD 覆盖层
        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        // 在调用 super 之前清理
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

        // 当背包或任何菜单打开时隐藏 HUD
        UIManager uiMgr = GetGame().GetUIManager();
        bool menuOpen = false;

        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);

        // 更新 HUD 数据（内部节流）
        m_ServerInfoHUD.Update(timeslice);

        // 检查切换按键
        Input input = GetGame().GetInput();
        if (input)
        {
            if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
            {
                m_ServerInfoHUD.ToggleVisibility();
            }
        }
    }

    // 访问器，以便 RPC 处理器可以访问 HUD
    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### 为什么这种模式有效

- **`OnInit`** 在玩家进入游戏时运行一次。我们在这里创建和初始化 HUD。
- **`OnUpdate`** 每帧运行。我们将 `timeslice` 传递给 HUD，HUD 内部节流为每秒一次。我们还在这里检查切换按键和菜单可见性。
- **`OnMissionFinish`** 在玩家断开连接或任务结束时运行。我们在这里销毁控件以防止内存泄漏。

### 关键规则：始终清理

如果你忘记在 `OnMissionFinish` 中销毁控件，控件根节点会泄漏到下一个会话。经过几次服务器跳转后，玩家最终会有堆叠的幽灵控件消耗内存。始终将 `Init()` 与 `Destroy()` 配对。

---

## 步骤 4：从服务器请求数据

玩家数量只有服务器知道。我们需要一个简单的 RPC（远程过程调用）往返：客户端发送请求，服务器读取数据并发回。

### 步骤 4a：定义 RPC ID

RPC ID 在所有模组中必须唯一。我们在 `3_Game` 层定义，以便客户端和服务器代码都能引用。

### `Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// Server Info HUD 的 RPC ID。
// 使用较大的数字以避免与原版和其他模组冲突。

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

**为什么是 `3_Game`？** 常量和枚举属于客户端和服务器都能访问的最低层级。`3_Game` 层在 `4_World` 和 `5_Mission` 之前加载，因此双方都能看到这些值。

### 步骤 4b：服务器端处理器

服务器监听 `SIH_RPC_REQUEST_INFO`，收集数据，并用 `SIH_RPC_RESPONSE_INFO` 响应。

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

        // 收集服务器信息
        string serverName = "";
        GetGame().GetHostName(serverName);

        int playerCount = 0;
        int maxPlayers = 0;

        // 获取玩家列表
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        playerCount = players.Count();

        // 从服务器配置获取最大玩家数
        maxPlayers = GetGame().GetMaxPlayers();

        // 将响应发送回请求客户端
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### 步骤 4c：客户端 RPC 接收器

客户端接收响应并更新 HUD。

将以下内容添加到 `ServerInfoHUD.c` 文件底部（在类外部），或在 `5_Mission/ServerInfoHUD/` 中创建单独的文件：

在 `ServerInfoHUD.c` 中的 `ServerInfoHUD` 类**下方**添加以下内容：

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

        // 通过 MissionGameplay 访问 HUD
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

### RPC 流程如何工作

```
客户端                           服务器
  |                                |
  |--- SIH_RPC_REQUEST_INFO ----->|
  |                                | 读取 serverName、playerCount、maxPlayers
  |<-- SIH_RPC_RESPONSE_INFO ----|
  |                                |
  | 更新 HUD 文本                |
```

客户端每秒发送一次请求（由更新计时器节流）。服务器用三个值打包在 RPC 上下文中进行响应。客户端按写入的相同顺序读取它们。

**重要：** `rpc.Write()` 和 `ctx.Read()` 必须使用相同类型和相同顺序。如果服务器写入一个 `string` 然后两个 `int` 值，客户端必须读取一个 `string` 然后两个 `int` 值。

---

## 步骤 5：添加快捷键切换

### 步骤 5a：在 `inputs.xml` 中定义输入

DayZ 使用 `inputs.xml` 来注册自定义按键操作。该文件必须放在 `Scripts/data/inputs.xml` 中，并在 `config.cpp` 中引用。

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

| 元素 | 用途 |
|---------|---------|
| `<actions>` | 按名称声明输入操作。`loc` 是在按键绑定选项菜单中显示的字符串。 |
| `<preset>` | 分配默认按键。`kF7` 映射到 F7 键。 |

### 步骤 5b：在 `config.cpp` 中引用 `inputs.xml`

你的 `config.cpp` 必须告诉引擎在哪里找到输入文件。在 `defs` 块中添加 `inputs` 条目：

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

### 步骤 5c：读取按键

我们已经在步骤 3 的 `MissionGameplay` 钩子中处理了这个：

```c
if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
{
    m_ServerInfoHUD.ToggleVisibility();
}
```

`GetUApi()` 返回输入 API 单例。`GetInputByName` 查找我们注册的操作。`LocalPress()` 在按键被按下时恰好返回一帧 `true`。

### 按键名称参考

`<btn>` 的常用按键名称：

| 按键名称 | 按键 |
|----------|-----|
| `kF1` 到 `kF12` | 功能键 |
| `kH`、`kI` 等 | 字母键 |
| `kNumpad0` 到 `kNumpad9` | 数字键盘 |
| `kLControl` | 左 Control |
| `kLShift` | 左 Shift |
| `kLAlt` | 左 Alt |

修饰键组合使用嵌套：

```xml
<input name="UAServerInfoToggle">
    <btn name="kLControl">
        <btn name="kH" />
    </btn>
</input>
```

这意味着"按住左 Control 并按 H"。

---

## 步骤 6：完善

### 6a：淡入/淡出动画

DayZ 提供 `WidgetFadeTimer` 用于平滑的透明度过渡。更新 `ServerInfoHUD` 类来使用它：

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    // ... 现有字段 ...

    protected ref WidgetFadeTimer m_FadeTimer;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    // 替换 ToggleVisibility 方法：
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

    // ... 类的其余部分 ...
};
```

`FadeIn(widget, duration)` 在给定的秒数内将控件的透明度从 0 动画到 1。`FadeOut` 从 1 到 0，完成后隐藏控件。

### 6b：带透明度的背景面板

我们已经在布局中设置了这个（`color="0 0 0 0.55"`），给出 55% 不透明度的深色覆盖。如果你想在运行时调整透明度：

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

`ARGB()` 函数接受 0-255 的整数值，分别对应透明度、红、绿和蓝。

### 6c：字体和颜色选择

DayZ 附带了几种你可以在布局中引用的字体：

| 字体路径 | 风格 |
|-----------|-------|
| `gui/fonts/MetronBook` | 简洁的无衬线字体（用于原版 HUD） |
| `gui/fonts/MetronMedium` | MetronBook 的加粗版本 |
| `gui/fonts/Metron` | 最细的变体 |
| `gui/fonts/luxuriousscript` | 装饰性手写体（避免用于 HUD） |

在运行时更改文本颜色：

```c
void SetTextColor(TextWidget widget, int r, int g, int b, int a)
{
    if (widget)
        widget.SetColor(ARGB(a, r, g, b));
}
```

### 6d：尊重其他 UI

我们的 `MissionHook.c` 已经检测菜单何时打开并调用 `SetMenuState(true)`。以下是一种更全面的方法，专门检查背包：

```c
// 在 modded MissionGameplay 的 OnUpdate 覆盖中：
bool menuOpen = false;

UIManager uiMgr = GetGame().GetUIManager();
if (uiMgr)
{
    UIScriptedMenu topMenu = uiMgr.GetMenu();
    if (topMenu)
        menuOpen = true;
}

// 也检查背包是否打开
if (uiMgr && uiMgr.FindMenu(MENU_INVENTORY))
    menuOpen = true;

m_ServerInfoHUD.SetMenuState(menuOpen);
```

这确保你的 HUD 隐藏在背包界面、暂停菜单、选项界面和任何其他脚本菜单后面。

---

## 完整代码参考

以下是模组中每个文件的最终形式，包含所有完善的内容。

### 文件 1：`ServerInfoHUD/mod.cpp`

```cpp
name = "Server Info HUD";
author = "YourName";
version = "1.0";
overview = "Displays server name, player count, and in-game time.";
```

### 文件 2：`ServerInfoHUD/Scripts/config.cpp`

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

### 文件 3：`ServerInfoHUD/Scripts/data/inputs.xml`

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

### 文件 4：`ServerInfoHUD/Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// Server Info HUD 的 RPC ID。
// 使用较大的数字以避免与原版 ERPC 和其他模组冲突。

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

### 文件 5：`ServerInfoHUD/Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

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

        // 只有服务器处理此 RPC
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

        // 获取服务器名称
        string serverName = "";
        GetGame().GetHostName(serverName);

        // 计数玩家
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        int playerCount = players.Count();

        // 获取最大玩家槽位
        int maxPlayers = GetGame().GetMaxPlayers();

        // 将数据发送回请求客户端
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### 文件 6：`ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

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
// 客户端 RPC 接收器
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

### 文件 7：`ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

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

        // 检测打开的菜单
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

        // 切换按键
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

### 文件 8：`ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout`

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

## 扩展 HUD

一旦基本 HUD 正常工作，以下是一些自然的扩展。

### 添加 FPS 显示

FPS 可以在客户端直接读取，不需要任何 RPC：

```c
// 添加一个 TextWidget m_FPSText 字段并在 Init() 中查找它

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    float fps = 1.0 / GetGame().GetDeltaT();
    m_FPSText.SetText("FPS: " + Math.Round(fps).ToString());
}
```

在更新方法中与 `RefreshTime()` 一起调用 `RefreshFPS()`。注意 `GetDeltaT()` 返回当前帧的时间，因此 FPS 值会波动。为了更平滑的显示，可以在几帧内取平均值：

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

    // 每秒重置（当主计时器触发时）
    m_FPSAccum = 0;
    m_FPSFrames = 0;
}
```

### 添加玩家位置

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

### 多个 HUD 面板

对于多个面板（指南针、状态、小地图），创建一个持有 HUD 元素数组的父管理器类：

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

### 可拖拽的 HUD 元素

使控件可拖拽需要通过 `ScriptedWidgetEventHandler` 处理鼠标事件：

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

注意：要使拖拽工作，控件必须调用 `SetHandler(this)` 以便事件处理器接收事件。此外，光标必须可见，这将可拖拽的 HUD 限制在菜单或编辑模式活动的情况下。

---

## 常见错误

### 1. 每帧更新而不是节流

**错误：**

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);
    m_ServerInfoHUD.RefreshTime();      // 每秒运行 60+ 次！
    m_ServerInfoHUD.RequestServerInfo(); // 每秒发送 60+ 个 RPC！
}
```

**正确：** 使用计时器累加器（如教程所示），使昂贵的操作最多每秒运行一次。每帧变化的 HUD 文本（如 FPS 计数器）可以每帧更新，但 RPC 请求必须节流。

### 2. 没有在 OnMissionFinish 中清理

**错误：**

```c
modded class MissionGameplay
{
    ref ServerInfoHUD m_HUD;

    override void OnInit()
    {
        super.OnInit();
        m_HUD = new ServerInfoHUD();
        m_HUD.Init();
        // 没有任何清理——断开连接时控件泄漏！
    }
};
```

**正确：** 始终在 `OnMissionFinish()` 中销毁控件并将引用置为 null。析构函数（`~ServerInfoHUD`）是安全网，但不要依赖它——`OnMissionFinish` 才是显式清理的正确位置。

### 3. HUD 在其他 UI 元素后面

后创建的控件渲染在先创建的控件上面。如果你的 HUD 出现在原版 UI 后面，说明它创建得太早了。解决方案：

- 在初始化序列的后期创建 HUD（例如，在第一次 `OnUpdate` 调用而不是在 `OnInit` 中）。
- 使用 `m_Root.SetSort(100)` 强制更高的排序顺序，将你的控件推到其他控件上面。

### 4. 过于频繁地请求数据（RPC 刷屏）

每帧发送一个 RPC 会为每个连接的玩家创建每秒 60+ 个网络数据包。在一个 60 人的服务器上，这是每秒 3,600 个不必要的数据包。始终节流 RPC 请求。对于非关键信息，每秒一次是合理的。对于很少变化的数据（如服务器名称），你可以只在初始化时请求一次并缓存。

### 5. 忘记调用 `super`

```c
// 错误：破坏原版 HUD 功能
override void OnInit()
{
    m_HUD = new ServerInfoHUD();
    m_HUD.Init();
    // 缺少 super.OnInit()！原版 HUD 将不会初始化。
}
```

始终首先调用 `super.OnInit()`（以及 `super.OnUpdate()`、`super.OnMissionFinish()`）。省略 super 调用会破坏原版实现以及挂接同一方法的所有其他模组。

### 6. 使用错误的脚本层级

如果你尝试从 `4_World` 引用 `MissionGameplay`，你会得到 "Undefined type" 错误，因为 `5_Mission` 类型对 `4_World` 不可见。RPC 常量放在 `3_Game`，服务器处理器放在 `4_World`（修改位于该层的 `PlayerBase`），HUD 类和任务钩子放在 `5_Mission`。

### 7. 硬编码的布局路径

`CreateWidgets()` 中的布局路径相对于游戏的搜索路径。如果你的 PBO 前缀与路径字符串不匹配，布局将无法加载，`CreateWidgets` 返回 NULL。始终在 `CreateWidgets` 后检查 NULL 并在失败时记录错误。

---

## 下一步

现在你有了一个可用的 HUD 覆盖层，考虑以下进阶：

1. **保存用户偏好** -- 将 HUD 是否可见存储在本地 JSON 文件中，以便切换状态在会话间保持。
2. **添加服务器端配置** -- 让服务器管理员通过 JSON 配置文件启用/禁用 HUD 或选择显示哪些字段。
3. **构建管理员覆盖层** -- 扩展 HUD 以显示仅管理员可见的信息（服务器性能、实体数量、重启计时器），使用权限检查。
4. **创建指南针 HUD** -- 使用 `GetGame().GetCurrentCameraDirection()` 计算朝向，并在屏幕顶部显示指南针条。
5. **研究现有模组** -- 查看 DayZ Expansion 的任务 HUD 和 Colorful UI 的覆盖层系统，了解生产级的 HUD 实现。

---

## 最佳实践

- **将 `OnUpdate` 节流到至少 1 秒间隔。** 使用计时器累加器避免每秒运行 60+ 次昂贵的操作（RPC 请求、文本格式化）。只有像 FPS 计数器这样的逐帧视觉效果应该每帧更新。
- **当背包或任何菜单打开时隐藏 HUD。** 在每次更新时检查 `GetGame().GetUIManager().GetMenu()` 并抑制你的覆盖层。重叠的 UI 元素会让玩家困惑并阻碍交互。
- **始终在 `OnMissionFinish` 中清理控件。** 泄漏的控件根节点在服务器跳转间持续存在，堆叠幽灵面板消耗内存并最终导致视觉故障。
- **使用 `SetSort()` 控制渲染顺序。** 如果你的 HUD 出现在原版元素后面，调用 `m_Root.SetSort(100)` 将其推到上面。没有显式的排序顺序，创建时间决定分层。
- **缓存很少变化的服务器数据。** 服务器名称在会话期间不会改变。在初始化时请求一次并本地缓存，而不是每秒重新请求。

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| `OnUpdate(float timeslice)` | 每帧调用一次，参数为帧时间差 | 在 144 FPS 的客户端上，这每秒触发 144 次。每次调用发送一个 RPC 会为每个玩家每秒创建 144 个网络数据包。始终累积 `timeslice` 并仅在总和超过你的间隔时执行操作。 |
| `CreateWidgets()` 布局路径 | 从你提供的路径加载布局 | 路径相对于 PBO 前缀，而不是文件系统。如果你的 PBO 前缀与路径字符串不匹配，`CreateWidgets` 静默返回 NULL，日志中没有错误。 |
| `WidgetFadeTimer` | 平滑地动画化控件透明度 | `FadeOut` 在动画完成后隐藏控件，但 `FadeIn` 不会先调用 `Show(true)`。你必须在调用 `FadeIn` 之前手动显示控件，否则什么都不会出现。 |
| `GetUApi().GetInputByName()` | 返回你自定义按键绑定的输入操作 | 如果 `inputs.xml` 没有在 `config.cpp` 的 `class inputs` 中引用，操作名称未知，`GetInputByName` 返回 null，导致在 `.LocalPress()` 上崩溃。 |

---

## 你学到了什么

在本教程中你学到了：
- 如何创建带有锚定、半透明面板的 HUD 布局
- 如何构建将更新节流到固定间隔的控制器类
- 如何挂接到 `MissionGameplay` 进行 HUD 生命周期管理（初始化、更新、清理）
- 如何通过 RPC 请求服务器数据并在客户端显示
- 如何通过 `inputs.xml` 注册自定义按键绑定，并使用淡入淡出动画切换 HUD 可见性

**上一章：** [第 8.7 章：发布到 Steam 创意工坊](07-publishing-workshop.md)
