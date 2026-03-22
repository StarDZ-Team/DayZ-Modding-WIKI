# Kapitel 6.6: Benachrichtigungssystem

[Startseite](../README.md) | [<< Zurück: Nachbearbeitungseffekte](05-ppe.md) | **Benachrichtigungen** | [Weiter: Timer und CallQueue >>](07-timers.md)

---

## Einführung

DayZ enthält ein eingebautes Benachrichtigungssystem zur Anzeige von Toast-artigen Popup-Nachrichten für Spieler. Die `NotificationSystem`-Klasse bietet statische Methoden zum Senden von Benachrichtigungen sowohl lokal (clientseitig) als auch vom Server zum Client über RPC. Dieses Kapitel behandelt die vollständige API zum Senden, Anpassen und Verwalten von Benachrichtigungen.

---

## NotificationSystem

**Datei:** `3_Game/client/notifications/notificationsystem.c` (320 Zeilen)

Eine statische Klasse, die die Benachrichtigungswarteschlange verwaltet. Benachrichtigungen erscheinen als kleine Popup-Karten oben auf dem Bildschirm, vertikal gestapelt, und blenden nach Ablauf ihrer Anzeigezeit aus.

### Konstanten

```c
const int   DEFAULT_TIME_DISPLAYED = 10;    // Standard-Anzeigezeit in Sekunden
const float NOTIFICATION_FADE_TIME = 3.0;   // Ausblendedauer in Sekunden
static const int MAX_NOTIFICATIONS = 5;     // Maximale sichtbare Benachrichtigungen
```

---

## Server-zu-Client-Benachrichtigungen

Diese Methoden werden auf dem Server aufgerufen. Sie senden einen RPC an den Client des Zielspielers, der die Benachrichtigung lokal anzeigt.

### SendNotificationToPlayerExtended

```c
static void SendNotificationToPlayerExtended(
    Man player,            // Zielspieler (Man oder PlayerBase)
    float show_time,       // Anzeigedauer in Sekunden
    string title_text,     // Benachrichtigungstitel
    string detail_text = "",  // Optionaler Textkörper
    string icon = ""       // Optionaler Icon-Pfad (z.B. "set:dayz_gui image:icon_info")
);
```

**Beispiel --- einen bestimmten Spieler benachrichtigen:**

```c
void NotifyPlayer(PlayerBase player, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerExtended(
        player,
        8.0,                   // 8 Sekunden anzeigen
        "Serverhinweis",       // Titel
        message,               // Textkörper
        ""                     // Standard-Icon
    );
}
```

### SendNotificationToPlayerIdentityExtended

```c
static void SendNotificationToPlayerIdentityExtended(
    PlayerIdentity player,   // Ziel-Identität (null = an ALLE Spieler senden)
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Beispiel --- an alle Spieler senden:**

```c
void BroadcastNotification(string title, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerIdentityExtended(
        null,                  // null = alle verbundenen Spieler
        10.0,                  // 10 Sekunden anzeigen
        title,
        message,
        ""
    );
}
```

### SendNotificationToPlayer (Typisiert)

```c
static void SendNotificationToPlayer(
    Man player,
    NotificationType type,    // Vordefinierter Benachrichtigungstyp
    float show_time,
    string detail_text = ""
);
```

Diese Variante verwendet vordefinierte `NotificationType`-Enum-Werte, die auf eingebaute Titel und Icons abgebildet werden. Der `detail_text` wird als Textkörper angehängt.

---

## Clientseitige (Lokale) Benachrichtigungen

Diese Methoden zeigen Benachrichtigungen nur auf dem lokalen Client an. Sie beinhalten kein Netzwerk.

### AddNotificationExtended

```c
static void AddNotificationExtended(
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Beispiel --- lokale Benachrichtigung auf dem Client:**

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

### AddNotification (Typisiert)

```c
static void AddNotification(
    NotificationType type,
    float show_time,
    string detail_text = ""
);
```

Verwendet einen vordefinierten `NotificationType` für Titel und Icon.

---

## NotificationType-Enum

Das Vanilla-Spiel definiert Benachrichtigungstypen mit zugehörigen Titeln und Icons. Häufige Werte:

| Typ | Beschreibung |
|-----|--------------|
| `NotificationType.GENERIC` | Allgemeine Benachrichtigung |
| `NotificationType.FRIENDLY_FIRE` | Friendly-Fire-Warnung |
| `NotificationType.JOIN` | Spieler beigetreten |
| `NotificationType.LEAVE` | Spieler verlassen |
| `NotificationType.STATUS` | Status-Aktualisierung |

> **Hinweis:** Die verfügbaren Typen hängen von der Spielversion ab. Für maximale Flexibilität verwenden Sie die `Extended`-Varianten, die benutzerdefinierte Titel- und Icon-Strings akzeptieren.

---

## Icon-Pfade

Icons verwenden die DayZ-Image-Set-Syntax:

```
"set:dayz_gui image:icon_name"
```

Häufige Icon-Namen:

| Icon | Set-Pfad |
|------|----------|
| Info | `"set:dayz_gui image:icon_info"` |
| Warnung | `"set:dayz_gui image:icon_warning"` |
| Totenkopf | `"set:dayz_gui image:icon_skull"` |

Sie können auch einen direkten Pfad zu einer `.edds`-Bilddatei übergeben:

```c
"MyMod/GUI/notification_icon.edds"
```

Oder einen leeren String `""` für kein Icon übergeben.

---

## Ereignisse

Das `NotificationSystem` stellt Script-Invoker bereit, um auf den Benachrichtigungs-Lebenszyklus zu reagieren:

```c
ref ScriptInvoker m_OnNotificationAdded;
ref ScriptInvoker m_OnNotificationRemoved;
```

**Beispiel --- auf Benachrichtigungen reagieren:**

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
    Print("Eine Benachrichtigung wurde hinzugefügt");
}

void OnNotifRemoved()
{
    Print("Eine Benachrichtigung wurde entfernt");
}
```

---

## Update-Schleife

Das Benachrichtigungssystem muss jeden Frame getaktet werden, um Ein-/Ausblendanimationen und das Entfernen abgelaufener Benachrichtigungen zu handhaben:

```c
static void Update(float timeslice);
```

Dies wird automatisch von der `OnUpdate`-Methode der Vanilla-Mission aufgerufen. Wenn Sie eine vollständig benutzerdefinierte Mission schreiben, stellen Sie sicher, dass Sie es aufrufen.

---

## Vollständiges Server-zu-Client-Beispiel

Ein typisches Mod-Muster zum Senden von Benachrichtigungen aus Server-Code:

```c
// Serverseitig: in einem Mission-Event-Handler oder Modul
class MyServerModule
{
    void OnMissionStarted(string missionName, vector location)
    {
        if (!GetGame().IsServer())
            return;

        // An alle Spieler senden
        string title = "Mission gestartet!";
        string body = string.Format("Geh zu %1!", missionName);

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

        // Nur diesen Spieler benachrichtigen
        NotificationSystem.SendNotificationToPlayerExtended(
            player,
            5.0,
            "Zone betreten",
            string.Format("Du hast %1 betreten", zoneName),
            ""
        );
    }
}
```

---

## CommunityFramework (CF) Alternative

Wenn Sie CommunityFramework verwenden, bietet es seine eigene Benachrichtigungs-API:

```c
// CF-Benachrichtigung (intern anderer RPC)
NotificationSystem.Create(
    new StringLocaliser("Titel"),
    new StringLocaliser("Text mit Parameter: %1", someValue),
    "set:dayz_gui image:icon_info",
    COLOR_GREEN,
    5,
    player.GetIdentity()
);
```

Die CF-API fügt Farb- und Lokalisierungsunterstützung hinzu. Verwenden Sie das System, das Ihr Mod-Stack erfordert --- sie sind funktional ähnlich, verwenden aber unterschiedliche interne RPCs.

---

## Zusammenfassung

| Konzept | Kernpunkt |
|---------|-----------|
| Server an Spieler | `SendNotificationToPlayerExtended(Spieler, Zeit, Titel, Text, Icon)` |
| Server an alle | `SendNotificationToPlayerIdentityExtended(null, Zeit, Titel, Text, Icon)` |
| Client lokal | `AddNotificationExtended(Zeit, Titel, Text, Icon)` |
| Typisiert | `SendNotificationToPlayer(Spieler, NotificationType, Zeit, Text)` |
| Max sichtbar | 5 gestapelte Benachrichtigungen |
| Standardzeit | 10 Sekunden Anzeige, 3 Sekunden Ausblenden |
| Icons | `"set:dayz_gui image:icon_name"` oder direkter `.edds`-Pfad |
| Ereignisse | `m_OnNotificationAdded`, `m_OnNotificationRemoved` |

---

## Bewährte Praktiken

- **Verwenden Sie die `Extended`-Varianten für benutzerdefinierte Benachrichtigungen.** `SendNotificationToPlayerExtended` gibt Ihnen volle Kontrolle über Titel, Text und Icon. Die typisierten `NotificationType`-Varianten sind auf Vanilla-Voreinstellungen beschränkt.
- **Beachten Sie das 5-Benachrichtigungen-Stapellimit.** Das schnelle Senden vieler Benachrichtigungen hintereinander schiebt ältere vom Bildschirm, bevor Spieler sie lesen können. Fassen Sie verwandte Nachrichten zusammen oder verwenden Sie längere Anzeigezeiten.
- **Schützen Sie Server-Benachrichtigungen immer mit `GetGame().IsServer()`.** Der Aufruf von `SendNotificationToPlayerExtended` auf dem Client hat keine Wirkung und verschwendet einen Methodenaufruf.
- **Übergeben Sie `null` als Identität für echte Broadcasts.** `SendNotificationToPlayerIdentityExtended(null, ...)` liefert an alle verbundenen Spieler. Schleifen Sie nicht manuell durch die Spieler, um dieselbe Nachricht zu senden.
- **Halten Sie Benachrichtigungstext kurz.** Das Toast-Popup hat eine begrenzte Anzeigebreite. Lange Titel oder Texte werden abgeschnitten. Streben Sie Titel unter 30 Zeichen und Textkörper unter 80 Zeichen an.

---

## Kompatibilität und Auswirkungen

- **Multi-Mod:** Das Vanilla-`NotificationSystem` wird von allen Mods geteilt. Mehrere Mods, die gleichzeitig Benachrichtigungen senden, können den 5-Benachrichtigungen-Stapel überfluten. CF bietet einen separaten Benachrichtigungskanal, der nicht mit Vanilla-Benachrichtigungen kollidiert.
- **Leistung:** Benachrichtigungen sind leichtgewichtig (ein einzelner RPC pro Benachrichtigung). Allerdings erzeugt das Senden an alle Spieler alle paar Sekunden messbaren Netzwerkverkehr auf Servern mit 60+ Spielern.
- **Server/Client:** `SendNotificationToPlayer*`-Methoden sind Server-zu-Client-RPCs. `AddNotificationExtended` ist nur Client-seitig (lokal). Der `Update()`-Tick läuft in der Client-Mission-Schleife.

---

[<< Zurück: Nachbearbeitungseffekte](05-ppe.md) | **Benachrichtigungen** | [Weiter: Timer und CallQueue >>](07-timers.md)
