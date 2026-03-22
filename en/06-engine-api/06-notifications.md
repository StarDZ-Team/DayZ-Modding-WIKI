# Chapter 6.6: Notification System

[<< Previous: Post-Process Effects](05-ppe.md) | **Notifications** | [Next: Timers & CallQueue >>](07-timers.md)

---

## Introduction

DayZ includes a built-in notification system for displaying toast-style popup messages to players. The `NotificationSystem` class provides static methods for sending notifications both locally (client-side) and from server to client via RPC. This chapter covers the full API for sending, customizing, and managing notifications.

---

## NotificationSystem

**File:** `3_Game/client/notifications/notificationsystem.c` (320 lines)

A static class that manages the notification queue. Notifications appear as small popup cards at the top of the screen, stacked vertically, and fade out after their display time expires.

### Constants

```c
const int   DEFAULT_TIME_DISPLAYED = 10;    // Default display time in seconds
const float NOTIFICATION_FADE_TIME = 3.0;   // Fade-out duration in seconds
static const int MAX_NOTIFICATIONS = 5;     // Maximum visible notifications
```

---

## Server-to-Client Notifications

These methods are called on the server. They send an RPC to the target player's client, which displays the notification locally.

### SendNotificationToPlayerExtended

```c
static void SendNotificationToPlayerExtended(
    Man player,            // Target player (Man or PlayerBase)
    float show_time,       // Display duration in seconds
    string title_text,     // Notification title
    string detail_text = "",  // Optional body text
    string icon = ""       // Optional icon path (e.g., "set:dayz_gui image:icon_info")
);
```

**Example --- notify a specific player:**

```c
void NotifyPlayer(PlayerBase player, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerExtended(
        player,
        8.0,                   // Show for 8 seconds
        "Server Notice",       // Title
        message,               // Body
        ""                     // Default icon
    );
}
```

### SendNotificationToPlayerIdentityExtended

```c
static void SendNotificationToPlayerIdentityExtended(
    PlayerIdentity player,   // Target identity (null = broadcast to ALL players)
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Example --- broadcast to all players:**

```c
void BroadcastNotification(string title, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerIdentityExtended(
        null,                  // null = all connected players
        10.0,                  // Show for 10 seconds
        title,
        message,
        ""
    );
}
```

### SendNotificationToPlayer (Typed)

```c
static void SendNotificationToPlayer(
    Man player,
    NotificationType type,    // Predefined notification type
    float show_time,
    string detail_text = ""
);
```

This variant uses predefined `NotificationType` enum values that map to built-in titles and icons. The `detail_text` is appended as the body.

---

## Client-Side (Local) Notifications

These methods display notifications only on the local client. They do not involve any networking.

### AddNotificationExtended

```c
static void AddNotificationExtended(
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Example --- local notification on client:**

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

### AddNotification (Typed)

```c
static void AddNotification(
    NotificationType type,
    float show_time,
    string detail_text = ""
);
```

Uses a predefined `NotificationType` for the title and icon.

---

## NotificationType Enum

The vanilla game defines notification types with associated titles and icons. Common values:

| Type | Description |
|------|-------------|
| `NotificationType.GENERIC` | Generic notification |
| `NotificationType.FRIENDLY_FIRE` | Friendly fire warning |
| `NotificationType.JOIN` | Player join |
| `NotificationType.LEAVE` | Player leave |
| `NotificationType.STATUS` | Status update |

> **Note:** The available types depend on the game version. For maximum flexibility, use the `Extended` variants which accept custom title and icon strings.

---

## Icon Paths

Icons use the DayZ image set syntax:

```
"set:dayz_gui image:icon_name"
```

Common icon names:

| Icon | Set Path |
|------|----------|
| Info | `"set:dayz_gui image:icon_info"` |
| Warning | `"set:dayz_gui image:icon_warning"` |
| Skull | `"set:dayz_gui image:icon_skull"` |

You can also pass a direct path to an `.edds` image file:

```c
"MyMod/GUI/notification_icon.edds"
```

Or pass an empty string `""` for no icon.

---

## Events

The `NotificationSystem` exposes script invokers for reacting to notification lifecycle:

```c
ref ScriptInvoker m_OnNotificationAdded;
ref ScriptInvoker m_OnNotificationRemoved;
```

**Example --- react to notifications:**

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

## Update Loop

The notification system must be ticked each frame to handle fade-in/fade-out animations and removal of expired notifications:

```c
static void Update(float timeslice);
```

This is called automatically by the vanilla mission's `OnUpdate` method. If you are writing a completely custom mission, make sure to call it.

---

## Complete Server-to-Client Example

A typical mod pattern for sending notifications from server code:

```c
// Server-side: in a mission event handler or module
class MyServerModule
{
    void OnMissionStarted(string missionName, vector location)
    {
        if (!GetGame().IsServer())
            return;

        // Broadcast to all players
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

        // Notify just this player
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

## CommunityFramework (CF) Alternative

If you use CommunityFramework, it provides its own notification API:

```c
// CF notification (different RPC internally)
NotificationSystem.Create(
    new StringLocaliser("Title"),
    new StringLocaliser("Body with param: %1", someValue),
    "set:dayz_gui image:icon_info",
    COLOR_GREEN,
    5,
    player.GetIdentity()
);
```

The CF API adds color and localization support. Use whichever system your mod stack requires --- they are functionally similar but use different internal RPCs.

---

## Summary

| Concept | Key Point |
|---------|-----------|
| Server to player | `SendNotificationToPlayerExtended(player, time, title, text, icon)` |
| Server to all | `SendNotificationToPlayerIdentityExtended(null, time, title, text, icon)` |
| Client local | `AddNotificationExtended(time, title, text, icon)` |
| Typed | `SendNotificationToPlayer(player, NotificationType, time, text)` |
| Max visible | 5 notifications stacked |
| Default time | 10 seconds display, 3 seconds fade |
| Icons | `"set:dayz_gui image:icon_name"` or direct `.edds` path |
| Events | `m_OnNotificationAdded`, `m_OnNotificationRemoved` |

---

## Best Practices

- **Use the `Extended` variants for custom notifications.** `SendNotificationToPlayerExtended` gives you full control over title, body, and icon. The typed `NotificationType` variants are limited to vanilla presets.
- **Respect the 5-notification stack limit.** Sending many notifications in rapid succession pushes older ones off screen before players can read them. Batch related messages or use longer display times.
- **Always guard server notifications with `GetGame().IsServer()`.** Calling `SendNotificationToPlayerExtended` on the client has no effect and wastes a method call.
- **Pass `null` as the identity for true broadcasts.** `SendNotificationToPlayerIdentityExtended(null, ...)` delivers to all connected players. Do not loop through players manually to send the same message.
- **Keep notification text concise.** The toast popup has limited display width. Long titles or bodies will be clipped. Aim for titles under 30 characters and body text under 80 characters.

---

## Compatibility & Impact

- **Multi-Mod:** The vanilla `NotificationSystem` is shared by all mods. Multiple mods sending notifications simultaneously can overflow the 5-notification stack. CF provides a separate notification channel that does not conflict with vanilla notifications.
- **Performance:** Notifications are lightweight (a single RPC per notification). However, broadcasting to all players every few seconds generates measurable network traffic on servers with 60+ players.
- **Server/Client:** `SendNotificationToPlayer*` methods are server-to-client RPCs. `AddNotificationExtended` is client-only (local). The `Update()` tick runs on the client mission loop.

---

[<< Previous: Post-Process Effects](05-ppe.md) | **Notifications** | [Next: Timers & CallQueue >>](07-timers.md)
