# Kapitola 6.6: Systém notifikací

[Domů](../README.md) | [<< Předchozí: Post-processingové efekty](05-ppe.md) | **Notifikace** | [Další: Časovače a CallQueue >>](07-timers.md)

---

## Úvod

DayZ obsahuje vestavěný systém notifikací pro zobrazování vyskakovacích zpráv ve stylu toast hráčům. Třída `NotificationSystem` poskytuje statické metody pro odesílání notifikací lokálně (na straně klienta) i ze serveru klientovi přes RPC. Tato kapitola pokrývá kompletní API pro odesílání, přizpůsobení a správu notifikací.

---

## NotificationSystem

**Soubor:** `3_Game/client/notifications/notificationsystem.c` (320 řádků)

Statická třída, která spravuje frontu notifikací. Notifikace se zobrazují jako malé vyskakovací karty v horní části obrazovky, naskládané vertikálně, a zmizí po uplynutí doby zobrazení.

### Konstanty

```c
const int   DEFAULT_TIME_DISPLAYED = 10;    // Výchozí doba zobrazení v sekundách
const float NOTIFICATION_FADE_TIME = 3.0;   // Doba prolínání v sekundách
static const int MAX_NOTIFICATIONS = 5;     // Maximální počet viditelných notifikací
```

---

## Notifikace ze serveru klientovi

Tyto metody se volají na serveru. Odešlou RPC cílovému klientovi hráče, který notifikaci zobrazí lokálně.

### SendNotificationToPlayerExtended

```c
static void SendNotificationToPlayerExtended(
    Man player,            // Cílový hráč (Man nebo PlayerBase)
    float show_time,       // Doba zobrazení v sekundách
    string title_text,     // Titulek notifikace
    string detail_text = "",  // Volitelný text těla
    string icon = ""       // Volitelná cesta k ikoně (např. "set:dayz_gui image:icon_info")
);
```

**Příklad --- upozornit konkrétního hráče:**

```c
void NotifyPlayer(PlayerBase player, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerExtended(
        player,
        8.0,                   // Zobrazit na 8 sekund
        "Server Notice",       // Titulek
        message,               // Tělo
        ""                     // Výchozí ikona
    );
}
```

### SendNotificationToPlayerIdentityExtended

```c
static void SendNotificationToPlayerIdentityExtended(
    PlayerIdentity player,   // Cílová identita (null = broadcast VŠEM hráčům)
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Příklad --- broadcast všem hráčům:**

```c
void BroadcastNotification(string title, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerIdentityExtended(
        null,                  // null = všichni připojení hráči
        10.0,                  // Zobrazit na 10 sekund
        title,
        message,
        ""
    );
}
```

### SendNotificationToPlayer (s typem)

```c
static void SendNotificationToPlayer(
    Man player,
    NotificationType type,    // Předdefinovaný typ notifikace
    float show_time,
    string detail_text = ""
);
```

Tato varianta používá předdefinované hodnoty výčtu `NotificationType`, které mapují na vestavěné titulky a ikony. `detail_text` se připojí jako tělo.

---

## Notifikace na straně klienta (lokální)

Tyto metody zobrazují notifikace pouze na lokálním klientovi. Nezahrnují žádnou síťovou komunikaci.

### AddNotificationExtended

```c
static void AddNotificationExtended(
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Příklad --- lokální notifikace na klientovi:**

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

### AddNotification (s typem)

```c
static void AddNotification(
    NotificationType type,
    float show_time,
    string detail_text = ""
);
```

Používá předdefinovaný `NotificationType` pro titulek a ikonu.

---

## Výčet NotificationType

Vanilla hra definuje typy notifikací s přiřazenými titulky a ikonami. Běžné hodnoty:

| Typ | Popis |
|-----|-------|
| `NotificationType.GENERIC` | Obecná notifikace |
| `NotificationType.FRIENDLY_FIRE` | Varování přátelské palby |
| `NotificationType.JOIN` | Připojení hráče |
| `NotificationType.LEAVE` | Odpojení hráče |
| `NotificationType.STATUS` | Aktualizace stavu |

> **Poznámka:** Dostupné typy závisí na verzi hry. Pro maximální flexibilitu používejte varianty `Extended`, které přijímají vlastní řetězce titulku a ikony.

---

## Cesty k ikonám

Ikony používají syntaxi DayZ image set:

```
"set:dayz_gui image:icon_name"
```

Běžné názvy ikon:

| Ikona | Cesta sady |
|-------|------------|
| Info | `"set:dayz_gui image:icon_info"` |
| Varování | `"set:dayz_gui image:icon_warning"` |
| Lebka | `"set:dayz_gui image:icon_skull"` |

Můžete také předat přímou cestu k souboru `.edds`:

```c
"MyMod/GUI/notification_icon.edds"
```

Nebo prázdný řetězec `""` pro žádnou ikonu.

---

## Události

`NotificationSystem` vystavuje skriptové invokery pro reakci na životní cyklus notifikací:

```c
ref ScriptInvoker m_OnNotificationAdded;
ref ScriptInvoker m_OnNotificationRemoved;
```

**Příklad --- reakce na notifikace:**

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

## Aktualizační smyčka

Systém notifikací musí být tiknut každý snímek pro zpracování animací prolínání a odstranění expirovaných notifikací:

```c
static void Update(float timeslice);
```

Toto je automaticky voláno metodou `OnUpdate` vanilla mise. Pokud píšete zcela vlastní misi, ujistěte se, že ji voláte.

---

## Kompletní příklad server-klient

Typický vzor modu pro odesílání notifikací ze serverového kódu:

```c
// Serverová strana: v handleru událostí mise nebo modulu
class MyServerModule
{
    void OnMissionStarted(string missionName, vector location)
    {
        if (!GetGame().IsServer())
            return;

        // Broadcast všem hráčům
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

        // Upozornit pouze tohoto hráče
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

## Alternativa CommunityFramework (CF)

Pokud používáte CommunityFramework, poskytuje vlastní API notifikací:

```c
// CF notifikace (interně jiné RPC)
NotificationSystem.Create(
    new StringLocaliser("Title"),
    new StringLocaliser("Body with param: %1", someValue),
    "set:dayz_gui image:icon_info",
    COLOR_GREEN,
    5,
    player.GetIdentity()
);
```

CF API přidává podporu barev a lokalizace. Použijte systém, který váš mod vyžaduje --- jsou funkčně podobné, ale používají různá interní RPC.

---

## Shrnutí

| Koncept | Klíčový bod |
|---------|-------------|
| Server hráči | `SendNotificationToPlayerExtended(player, čas, titulek, text, ikona)` |
| Server všem | `SendNotificationToPlayerIdentityExtended(null, čas, titulek, text, ikona)` |
| Klient lokálně | `AddNotificationExtended(čas, titulek, text, ikona)` |
| S typem | `SendNotificationToPlayer(player, NotificationType, čas, text)` |
| Max viditelných | 5 notifikací naskládaných |
| Výchozí čas | 10 sekund zobrazení, 3 sekundy prolínání |
| Ikony | `"set:dayz_gui image:icon_name"` nebo přímá cesta `.edds` |
| Události | `m_OnNotificationAdded`, `m_OnNotificationRemoved` |

---

## Osvědčené postupy

- **Pro vlastní notifikace používejte varianty `Extended`.** `SendNotificationToPlayerExtended` vám dává plnou kontrolu nad titulkem, tělem a ikonou. Typované varianty `NotificationType` jsou omezeny na vanilla předvolby.
- **Respektujte limit 5 notifikací ve frontě.** Odesílání mnoha notifikací v rychlém sledu vytlačí starší z obrazovky dříve, než je hráči stihnou přečíst. Seskupte související zprávy nebo používejte delší doby zobrazení.
- **Serverové notifikace vždy chraňte kontrolou `GetGame().IsServer()`.** Volání `SendNotificationToPlayerExtended` na klientovi nemá žádný efekt a plýtvá voláním metody.
- **Pro skutečné broadcasty předávejte `null` jako identitu.** `SendNotificationToPlayerIdentityExtended(null, ...)` doručí všem připojeným hráčům. Neprocházejte hráče ručně pro odeslání stejné zprávy.
- **Text notifikací udržujte stručný.** Toast vyskakovací okno má omezenou šířku zobrazení. Dlouhé titulky nebo těla budou oříznuty. Cílte na titulky pod 30 znaků a text těla pod 80 znaků.

---

## Kompatibilita a dopad

- **Multi-Mod:** Vanilla `NotificationSystem` je sdílen všemi mody. Více modů odesílajících notifikace současně může přetečit frontu 5 notifikací. CF poskytuje oddělený kanál notifikací, který nekoliduje s vanilla notifikacemi.
- **Výkon:** Notifikace jsou lehké (jedno RPC na notifikaci). Nicméně broadcasting všem hráčům každých pár sekund generuje měřitelný síťový provoz na serverech s 60+ hráči.
- **Server/Klient:** Metody `SendNotificationToPlayer*` jsou RPC ze serveru klientovi. `AddNotificationExtended` je pouze klientské (lokální). Tik `Update()` běží v klientské smyčce mise.

---

[<< Předchozí: Post-processingové efekty](05-ppe.md) | **Notifikace** | [Další: Časovače a CallQueue >>](07-timers.md)
