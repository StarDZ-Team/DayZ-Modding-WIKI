# 第 6.6 章：通知系统

[首页](../README.md) | [<< 上一章：后处理效果](05-ppe.md) | **通知系统** | [下一章：定时器与 CallQueue >>](07-timers.md)

---

## 简介

DayZ 包含一个内置的通知系统，用于向玩家显示 Toast 风格的弹出消息。`NotificationSystem` 类提供了静态方法，用于在本地（客户端）和通过 RPC 从服务端向客户端发送通知。本章涵盖发送、自定义和管理通知的完整 API。

---

## NotificationSystem

**文件：** `3_Game/client/notifications/notificationsystem.c`（320 行）

一个管理通知队列的静态类。通知以小型弹出卡片的形式出现在屏幕顶部，垂直堆叠，并在显示时间到期后淡出。

### 常量

```c
const int   DEFAULT_TIME_DISPLAYED = 10;    // 默认显示时间（秒）
const float NOTIFICATION_FADE_TIME = 3.0;   // 淡出持续时间（秒）
static const int MAX_NOTIFICATIONS = 5;     // 最大可见通知数
```

---

## 服务端到客户端的通知

这些方法在服务端调用。它们向目标玩家的客户端发送 RPC，客户端在本地显示通知。

### SendNotificationToPlayerExtended

```c
static void SendNotificationToPlayerExtended(
    Man player,            // 目标玩家（Man 或 PlayerBase）
    float show_time,       // 显示持续时间（秒）
    string title_text,     // 通知标题
    string detail_text = "",  // 可选正文
    string icon = ""       // 可选图标路径（例如 "set:dayz_gui image:icon_info"）
);
```

**示例 --- 通知特定玩家：**

```c
void NotifyPlayer(PlayerBase player, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerExtended(
        player,
        8.0,                   // 显示 8 秒
        "Server Notice",       // 标题
        message,               // 正文
        ""                     // 默认图标
    );
}
```

### SendNotificationToPlayerIdentityExtended

```c
static void SendNotificationToPlayerIdentityExtended(
    PlayerIdentity player,   // 目标身份（null = 广播给所有玩家）
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**示例 --- 广播给所有玩家：**

```c
void BroadcastNotification(string title, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerIdentityExtended(
        null,                  // null = 所有已连接的玩家
        10.0,                  // 显示 10 秒
        title,
        message,
        ""
    );
}
```

### SendNotificationToPlayer（类型化）

```c
static void SendNotificationToPlayer(
    Man player,
    NotificationType type,    // 预定义的通知类型
    float show_time,
    string detail_text = ""
);
```

此变体使用预定义的 `NotificationType` 枚举值，这些值映射到内置的标题和图标。`detail_text` 作为正文附加。

---

## 客户端（本地）通知

这些方法仅在本地客户端显示通知。它们不涉及任何网络传输。

### AddNotificationExtended

```c
static void AddNotificationExtended(
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**示例 --- 客户端本地通知：**

```c
void ShowLocalNotification(string title, string body)
{
    if (!GetGame().IsClient())
        return;

    NotificationSystem.AddNotificationExtended(
        5.0,
        title,
        body,
        "set:dayz_gui image:icon_info"
    );
}
```

### AddNotification（类型化）

```c
static void AddNotification(
    NotificationType type,
    float show_time,
    string detail_text = ""
);
```

使用预定义的 `NotificationType` 设定标题和图标。

---

## NotificationType 枚举

原版游戏定义了带有关联标题和图标的通知类型。常见值：

| 类型 | 描述 |
|------|------|
| `NotificationType.GENERIC` | 通用通知 |
| `NotificationType.FRIENDLY_FIRE` | 友军误伤警告 |
| `NotificationType.JOIN` | 玩家加入 |
| `NotificationType.LEAVE` | 玩家离开 |
| `NotificationType.STATUS` | 状态更新 |

> **注意：** 可用类型取决于游戏版本。为了最大灵活性，请使用 `Extended` 变体，它接受自定义标题和图标字符串。

---

## 图标路径

图标使用 DayZ 图像集语法：

```
"set:dayz_gui image:icon_name"
```

常用图标名称：

| 图标 | 集合路径 |
|------|----------|
| 信息 | `"set:dayz_gui image:icon_info"` |
| 警告 | `"set:dayz_gui image:icon_warning"` |
| 骷髅 | `"set:dayz_gui image:icon_skull"` |

你也可以传递 `.edds` 图片文件的直接路径：

```c
"MyMod/GUI/notification_icon.edds"
```

或者传递空字符串 `""` 表示无图标。

---

## 事件

`NotificationSystem` 暴露了用于响应通知生命周期的脚本调用器：

```c
ref ScriptInvoker m_OnNotificationAdded;
ref ScriptInvoker m_OnNotificationRemoved;
```

**示例 --- 响应通知：**

```c
void Init()
{
    NotificationSystem notifSys = GetNotificationSystem();
    if (notifSys)
    {
        notifSys.m_OnNotificationAdded.Insert(OnNotifAdded);
        notifSys.m_OnNotificationRemoved.Insert(OnNotifRemoved);
    }
}

void OnNotifAdded()
{
    Print("A notification was added");
}

void OnNotifRemoved()
{
    Print("A notification was removed");
}
```

---

## 更新循环

通知系统必须在每帧进行滴答处理，以处理淡入/淡出动画和移除过期通知：

```c
static void Update(float timeslice);
```

这由原版任务的 `OnUpdate` 方法自动调用。如果你编写了完全自定义的任务，请确保调用它。

---

## 完整的服务端到客户端示例

从服务端代码发送通知的典型模组模式：

```c
// 服务端：在任务事件处理器或模块中
class MyServerModule
{
    void OnMissionStarted(string missionName, vector location)
    {
        if (!GetGame().IsServer())
            return;

        // 广播给所有玩家
        string title = "Mission Started!";
        string body = string.Format("Go to %1!", missionName);

        NotificationSystem.SendNotificationToPlayerIdentityExtended(
            null,
            12.0,
            title,
            body,
            "set:dayz_gui image:icon_info"
        );
    }

    void OnPlayerEnteredZone(PlayerBase player, string zoneName)
    {
        if (!GetGame().IsServer())
            return;

        // 仅通知这个玩家
        NotificationSystem.SendNotificationToPlayerExtended(
            player,
            5.0,
            "Zone Entered",
            string.Format("You have entered %1", zoneName),
            ""
        );
    }
}
```

---

## CommunityFramework（CF）替代方案

如果你使用 CommunityFramework，它提供了自己的通知 API：

```c
// CF 通知（内部使用不同的 RPC）
NotificationSystem.Create(
    new StringLocaliser("Title"),
    new StringLocaliser("Body with param: %1", someValue),
    "set:dayz_gui image:icon_info",
    COLOR_GREEN,
    5,
    player.GetIdentity()
);
```

CF API 增加了颜色和本地化支持。根据你的模组栈需求选择使用哪个系统 --- 它们功能相似但使用不同的内部 RPC。

---

## 总结

| 概念 | 要点 |
|------|------|
| 服务端到玩家 | `SendNotificationToPlayerExtended(player, time, title, text, icon)` |
| 服务端到所有 | `SendNotificationToPlayerIdentityExtended(null, time, title, text, icon)` |
| 客户端本地 | `AddNotificationExtended(time, title, text, icon)` |
| 类型化 | `SendNotificationToPlayer(player, NotificationType, time, text)` |
| 最大可见数 | 5 条通知堆叠 |
| 默认时间 | 显示 10 秒，淡出 3 秒 |
| 图标 | `"set:dayz_gui image:icon_name"` 或直接 `.edds` 路径 |
| 事件 | `m_OnNotificationAdded`, `m_OnNotificationRemoved` |

---

## 最佳实践

- **使用 `Extended` 变体来创建自定义通知。** `SendNotificationToPlayerExtended` 让你完全控制标题、正文和图标。类型化的 `NotificationType` 变体仅限于原版预设。
- **尊重 5 条通知的堆叠限制。** 快速连续发送大量通知会在玩家阅读之前将旧通知推出屏幕。将相关消息合并或使用更长的显示时间。
- **始终使用 `GetGame().IsServer()` 来保护服务端通知。** 在客户端调用 `SendNotificationToPlayerExtended` 不会产生效果，只是浪费一次方法调用。
- **传递 `null` 作为身份以进行真正的广播。** `SendNotificationToPlayerIdentityExtended(null, ...)` 会发送给所有已连接的玩家。不要手动循环遍历玩家来发送相同的消息。
- **保持通知文本简洁。** Toast 弹出窗口的显示宽度有限。过长的标题或正文将被裁剪。标题控制在 30 个字符以内，正文控制在 80 个字符以内。

---

## 兼容性与影响

- **多模组：** 原版 `NotificationSystem` 被所有模组共享。多个模组同时发送通知可能超出 5 条通知的堆叠限制。CF 提供了单独的通知通道，不会与原版通知冲突。
- **性能：** 通知是轻量级的（每条通知一个 RPC）。但在 60+ 玩家的服务器上，每隔几秒向所有玩家广播会产生可测量的网络流量。
- **服务端/客户端：** `SendNotificationToPlayer*` 方法是服务端到客户端的 RPC。`AddNotificationExtended` 仅限客户端（本地）。`Update()` 滴答在客户端任务循环中运行。

---

[<< 上一章：后处理效果](05-ppe.md) | **通知系统** | [下一章：定时器与 CallQueue >>](07-timers.md)
