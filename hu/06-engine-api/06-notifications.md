# 6.6. fejezet: Értesítési rendszer

[Kezdőlap](../README.md) | [<< Előző: Utófeldolgozási effektek](05-ppe.md) | **Értesítések** | [Következő: Időzítők és CallQueue >>](07-timers.md)

---

## Bevezetés

A DayZ beépített értesítési rendszerrel rendelkezik, amely toast-stílusú felugró üzeneteket jelenít meg a játékosoknak. A `NotificationSystem` osztály statikus metódusokat biztosít értesítések küldéséhez helyben (kliens oldalon) és szerverről kliensre RPC-n keresztül. Ez a fejezet az értesítések küldésének, testreszabásának és kezelésének teljes API-ját tárgyalja.

---

## NotificationSystem

**Fájl:** `3_Game/client/notifications/notificationsystem.c` (320 sor)

Statikus osztály, amely az értesítési sort kezeli. Az értesítések kis felugró kártyaként jelennek meg a képernyő tetején, függőlegesen egymásra rakva, és a megjelenítési idő lejárta után elhalványulnak.

### Konstansok

```c
const int   DEFAULT_TIME_DISPLAYED = 10;    // Alapértelmezett megjelenítési idő másodpercben
const float NOTIFICATION_FADE_TIME = 3.0;   // Elhalványulási időtartam másodpercben
static const int MAX_NOTIFICATIONS = 5;     // Maximum látható értesítések száma
```

---

## Szerver-kliens értesítések

Ezeket a metódusokat a szerveren hívjuk meg. RPC-t küldenek a céljátékos kliensének, amely helyileg megjeleníti az értesítést.

### SendNotificationToPlayerExtended

```c
static void SendNotificationToPlayerExtended(
    Man player,            // Céljátékos (Man vagy PlayerBase)
    float show_time,       // Megjelenítés időtartama másodpercben
    string title_text,     // Értesítés címe
    string detail_text = "",  // Opcionális szövegtörzs
    string icon = ""       // Opcionális ikon útvonal (pl. "set:dayz_gui image:icon_info")
);
```

**Példa --- egy adott játékos értesítése:**

```c
void NotifyPlayer(PlayerBase player, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerExtended(
        player,
        8.0,                   // Megjelenítés 8 másodpercig
        "Server Notice",       // Cím
        message,               // Szövegtörzs
        ""                     // Alapértelmezett ikon
    );
}
```

### SendNotificationToPlayerIdentityExtended

```c
static void SendNotificationToPlayerIdentityExtended(
    PlayerIdentity player,   // Célidentitás (null = közvetítés MINDEN játékosnak)
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Példa --- közvetítés minden játékosnak:**

```c
void BroadcastNotification(string title, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerIdentityExtended(
        null,                  // null = minden csatlakozott játékos
        10.0,                  // Megjelenítés 10 másodpercig
        title,
        message,
        ""
    );
}
```

### SendNotificationToPlayer (típusos)

```c
static void SendNotificationToPlayer(
    Man player,
    NotificationType type,    // Előre definiált értesítés típus
    float show_time,
    string detail_text = ""
);
```

Ez a változat előre definiált `NotificationType` enum értékeket használ, amelyek beépített címekhez és ikonokhoz rendelődnek. A `detail_text` szövegtörzsként jelenik meg.

---

## Kliens oldali (helyi) értesítések

Ezek a metódusok csak a helyi kliensen jelenítenek meg értesítéseket. Nem igényelnek hálózati kommunikációt.

### AddNotificationExtended

```c
static void AddNotificationExtended(
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Példa --- helyi értesítés a kliensen:**

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

### AddNotification (típusos)

```c
static void AddNotification(
    NotificationType type,
    float show_time,
    string detail_text = ""
);
```

Előre definiált `NotificationType` értéket használ a címhez és ikonhoz.

---

## NotificationType felsorolás

A vanilla játék előre definiált értesítés típusokat tartalmaz társított címekkel és ikonokkal. Gyakori értékek:

| Típus | Leírás |
|-------|--------|
| `NotificationType.GENERIC` | Általános értesítés |
| `NotificationType.FRIENDLY_FIRE` | Baráti tűz figyelmeztetés |
| `NotificationType.JOIN` | Játékos csatlakozás |
| `NotificationType.LEAVE` | Játékos kilépés |
| `NotificationType.STATUS` | Állapotfrissítés |

> **Megjegyzés:** Az elérhető típusok a játék verziójától függenek. A maximális rugalmasság érdekében használd az `Extended` változatokat, amelyek egyéni cím és ikon sztringeket fogadnak.

---

## Ikon útvonalak

Az ikonok a DayZ képkészlet szintaxist használják:

```
"set:dayz_gui image:icon_name"
```

Gyakori ikonnevek:

| Ikon | Készlet útvonal |
|------|----------------|
| Információ | `"set:dayz_gui image:icon_info"` |
| Figyelmeztetés | `"set:dayz_gui image:icon_warning"` |
| Koponya | `"set:dayz_gui image:icon_skull"` |

Megadhatsz közvetlen útvonalat egy `.edds` képfájlhoz is:

```c
"MyMod/GUI/notification_icon.edds"
```

Vagy adj át üres sztringet `""` ikon nélkül.

---

## Események

A `NotificationSystem` szkript invokereket tesz elérhetővé az értesítés életciklusára való reagáláshoz:

```c
ref ScriptInvoker m_OnNotificationAdded;
ref ScriptInvoker m_OnNotificationRemoved;
```

**Példa --- reagálás értesítésekre:**

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

## Frissítési ciklus

Az értesítési rendszert minden képkockában frissíteni kell a belépési/kilépési animációk kezeléséhez és a lejárt értesítések eltávolításához:

```c
static void Update(float timeslice);
```

Ezt automatikusan a vanilla misszió `OnUpdate` metódusa hívja. Ha teljesen egyéni missziót írsz, győződj meg róla, hogy meghívod.

---

## Teljes szerver-kliens példa

Tipikus mod minta értesítések küldéséhez szerver kódból:

```c
// Szerver oldali: misszió eseménykezelőben vagy modulban
class MyServerModule
{
    void OnMissionStarted(string missionName, vector location)
    {
        if (!GetGame().IsServer())
            return;

        // Közvetítés minden játékosnak
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

        // Csak ennek a játékosnak értesítés
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

## CommunityFramework (CF) alternatíva

Ha CommunityFramework-öt használsz, az saját értesítési API-t biztosít:

```c
// CF értesítés (belsőleg eltérő RPC)
NotificationSystem.Create(
    new StringLocaliser("Title"),
    new StringLocaliser("Body with param: %1", someValue),
    "set:dayz_gui image:icon_info",
    COLOR_GREEN,
    5,
    player.GetIdentity()
);
```

A CF API szín és lokalizáció támogatást ad hozzá. Használd azt a rendszert, amelyet a mod készleted igényel --- funkcionálisan hasonlóak, de eltérő belső RPC-ket használnak.

---

## Összefoglalás

| Fogalom | Lényeg |
|---------|--------|
| Szerver játékosnak | `SendNotificationToPlayerExtended(player, idő, cím, szöveg, ikon)` |
| Szerver mindenkinek | `SendNotificationToPlayerIdentityExtended(null, idő, cím, szöveg, ikon)` |
| Kliens helyi | `AddNotificationExtended(idő, cím, szöveg, ikon)` |
| Típusos | `SendNotificationToPlayer(player, NotificationType, idő, szöveg)` |
| Max látható | 5 értesítés egymásra rakva |
| Alapértelmezett idő | 10 másodperc megjelenítés, 3 másodperc elhalványulás |
| Ikonok | `"set:dayz_gui image:ikon_név"` vagy közvetlen `.edds` útvonal |
| Események | `m_OnNotificationAdded`, `m_OnNotificationRemoved` |

---

## Bevált gyakorlatok

- **Használd az `Extended` változatokat egyéni értesítésekhez.** A `SendNotificationToPlayerExtended` teljes kontrollt ad a cím, szövegtörzs és ikon felett. A típusos `NotificationType` változatok a vanilla előbeállításokra korlátozódnak.
- **Tartsd tiszteletben az 5 értesítéses verem korlátot.** Sok értesítés gyors egymásutánban való küldése kinyomja a régebbieket a képernyőről, mielőtt a játékosok el tudnák olvasni. Csoportosítsd a kapcsolódó üzeneteket vagy használj hosszabb megjelenítési időt.
- **Mindig védd a szerver értesítéseket `GetGame().IsServer()` ellenőrzéssel.** A `SendNotificationToPlayerExtended` hívása a kliensen nem fejt ki hatást, és felesleges metódushívást jelent.
- **Adj meg `null`-t identitásként valódi közvetítésekhez.** A `SendNotificationToPlayerIdentityExtended(null, ...)` minden csatlakozott játékosnak kézbesít. Ne iterálj manuálisan a játékosokon, hogy ugyanazt az üzenetet küldd.
- **Tartsd az értesítési szövegeket tömörnek.** A felugró toast korlátozott megjelenítési szélességgel rendelkezik. A hosszú címek vagy szövegtörzsek levágásra kerülnek. Célozz meg 30 karakternél rövidebb címeket és 80 karakternél rövidebb szövegtörzset.

---

## Kompatibilitás és hatás

- **Több mod együtt:** A vanilla `NotificationSystem`-et minden mod közösen használja. Több mod egyidejű értesítés küldése túlcsordultathatja az 5 értesítéses vermet. A CF külön értesítési csatornát biztosít, amely nem ütközik a vanilla értesítésekkel.
- **Teljesítmény:** Az értesítések könnyűek (egyetlen RPC értesítésenként). Azonban a néhány másodpercenkénti közvetítés minden játékosnak mérhető hálózati forgalmat generál 60+ játékosos szervereken.
- **Szerver/Kliens:** A `SendNotificationToPlayer*` metódusok szerver-kliens RPC-k. Az `AddNotificationExtended` csak kliens oldali (helyi). Az `Update()` frissítés a kliens misszió ciklusában fut.

---

[<< Előző: Utófeldolgozási effektek](05-ppe.md) | **Értesítések** | [Következő: Időzítők és CallQueue >>](07-timers.md)
