# Rozdział 6.6: System powiadomień

[Strona główna](../README.md) | [<< Poprzedni: Efekty post-processingu](05-ppe.md) | **Powiadomienia** | [Następny: Liczniki czasu i CallQueue >>](07-timers.md)

---

## Wprowadzenie

DayZ zawiera wbudowany system powiadomień do wyświetlania graczom komunikatów w stylu toast. Klasa `NotificationSystem` udostępnia metody statyczne do wysyłania powiadomień zarówno lokalnie (po stronie klienta), jak i z serwera do klienta przez RPC. Ten rozdział obejmuje pełne API do wysyłania, dostosowywania i zarządzania powiadomieniami.

---

## NotificationSystem

**Plik:** `3_Game/client/notifications/notificationsystem.c` (320 linii)

Klasa statyczna zarządzająca kolejką powiadomień. Powiadomienia pojawiają się jako małe karty wyskakujące w górnej części ekranu, ułożone pionowo, i znikają po upływie czasu wyświetlania.

### Stałe

```c
const int   DEFAULT_TIME_DISPLAYED = 10;    // Domyślny czas wyświetlania w sekundach
const float NOTIFICATION_FADE_TIME = 3.0;   // Czas zanikania w sekundach
static const int MAX_NOTIFICATIONS = 5;     // Maksymalna liczba widocznych powiadomień
```

---

## Powiadomienia z serwera do klienta

Te metody są wywoływane na serwerze. Wysyłają RPC do klienta docelowego gracza, który wyświetla powiadomienie lokalnie.

### SendNotificationToPlayerExtended

```c
static void SendNotificationToPlayerExtended(
    Man player,            // Docelowy gracz (Man lub PlayerBase)
    float show_time,       // Czas wyświetlania w sekundach
    string title_text,     // Tytuł powiadomienia
    string detail_text = "",  // Opcjonalny tekst treści
    string icon = ""       // Opcjonalna ścieżka ikony (np. "set:dayz_gui image:icon_info")
);
```

**Przykład --- powiadomienie konkretnego gracza:**

```c
void NotifyPlayer(PlayerBase player, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerExtended(
        player,
        8.0,                   // Pokaż na 8 sekund
        "Server Notice",       // Tytuł
        message,               // Treść
        ""                     // Domyślna ikona
    );
}
```

### SendNotificationToPlayerIdentityExtended

```c
static void SendNotificationToPlayerIdentityExtended(
    PlayerIdentity player,   // Docelowa tożsamość (null = broadcast do WSZYSTKICH graczy)
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Przykład --- broadcast do wszystkich graczy:**

```c
void BroadcastNotification(string title, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerIdentityExtended(
        null,                  // null = wszyscy połączeni gracze
        10.0,                  // Pokaż na 10 sekund
        title,
        message,
        ""
    );
}
```

### SendNotificationToPlayer (z typem)

```c
static void SendNotificationToPlayer(
    Man player,
    NotificationType type,    // Predefiniowany typ powiadomienia
    float show_time,
    string detail_text = ""
);
```

Ta wariant używa predefiniowanych wartości wyliczenia `NotificationType`, które mapują na wbudowane tytuły i ikony. `detail_text` jest dodawany jako treść.

---

## Powiadomienia po stronie klienta (lokalne)

Te metody wyświetlają powiadomienia tylko na lokalnym kliencie. Nie obejmują żadnej komunikacji sieciowej.

### AddNotificationExtended

```c
static void AddNotificationExtended(
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Przykład --- lokalne powiadomienie na kliencie:**

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

### AddNotification (z typem)

```c
static void AddNotification(
    NotificationType type,
    float show_time,
    string detail_text = ""
);
```

Używa predefiniowanego `NotificationType` dla tytułu i ikony.

---

## Wyliczenie NotificationType

Gra vanilla definiuje typy powiadomień z przypisanymi tytułami i ikonami. Typowe wartości:

| Typ | Opis |
|-----|------|
| `NotificationType.GENERIC` | Ogólne powiadomienie |
| `NotificationType.FRIENDLY_FIRE` | Ostrzeżenie o ogniu przyjaznym |
| `NotificationType.JOIN` | Dołączenie gracza |
| `NotificationType.LEAVE` | Opuszczenie przez gracza |
| `NotificationType.STATUS` | Aktualizacja statusu |

> **Uwaga:** Dostępne typy zależą od wersji gry. Dla maksymalnej elastyczności używaj wariantów `Extended`, które przyjmują niestandardowe łańcuchy tytułu i ikony.

---

## Ścieżki ikon

Ikony używają składni image set DayZ:

```
"set:dayz_gui image:icon_name"
```

Typowe nazwy ikon:

| Ikona | Ścieżka zestawu |
|-------|-----------------|
| Info | `"set:dayz_gui image:icon_info"` |
| Ostrzeżenie | `"set:dayz_gui image:icon_warning"` |
| Czaszka | `"set:dayz_gui image:icon_skull"` |

Możesz też podać bezpośrednią ścieżkę do pliku `.edds`:

```c
"MyMod/GUI/notification_icon.edds"
```

Lub pusty łańcuch `""` dla braku ikony.

---

## Zdarzenia

`NotificationSystem` udostępnia invokery skryptowe do reagowania na cykl życia powiadomień:

```c
ref ScriptInvoker m_OnNotificationAdded;
ref ScriptInvoker m_OnNotificationRemoved;
```

**Przykład --- reagowanie na powiadomienia:**

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

## Pętla aktualizacji

System powiadomień musi być aktualizowany co klatkę, aby obsłużyć animacje pojawiania się/zanikania i usuwanie wygasłych powiadomień:

```c
static void Update(float timeslice);
```

Jest to wywoływane automatycznie przez metodę `OnUpdate` misji vanilla. Jeśli piszesz całkowicie niestandardową misję, upewnij się, że ją wywołujesz.

---

## Kompletny przykład serwer-klient

Typowy wzorzec moda do wysyłania powiadomień z kodu serwerowego:

```c
// Strona serwerowa: w handlerze zdarzeń misji lub module
class MyServerModule
{
    void OnMissionStarted(string missionName, vector location)
    {
        if (!GetGame().IsServer())
            return;

        // Broadcast do wszystkich graczy
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

        // Powiadom tylko tego gracza
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

## Alternatywa CommunityFramework (CF)

Jeśli używasz CommunityFramework, zapewnia on własne API powiadomień:

```c
// Powiadomienie CF (wewnętrznie inne RPC)
NotificationSystem.Create(
    new StringLocaliser("Title"),
    new StringLocaliser("Body with param: %1", someValue),
    "set:dayz_gui image:icon_info",
    COLOR_GREEN,
    5,
    player.GetIdentity()
);
```

API CF dodaje obsługę kolorów i lokalizacji. Używaj tego systemu, którego wymaga twój mod --- są funkcjonalnie podobne, ale używają różnych wewnętrznych RPC.

---

## Podsumowanie

| Koncept | Kluczowy punkt |
|---------|----------------|
| Serwer do gracza | `SendNotificationToPlayerExtended(player, czas, tytuł, tekst, ikona)` |
| Serwer do wszystkich | `SendNotificationToPlayerIdentityExtended(null, czas, tytuł, tekst, ikona)` |
| Klient lokalnie | `AddNotificationExtended(czas, tytuł, tekst, ikona)` |
| Z typem | `SendNotificationToPlayer(player, NotificationType, czas, tekst)` |
| Max widocznych | 5 powiadomień w stosie |
| Domyślny czas | 10 sekund wyświetlania, 3 sekundy zanikania |
| Ikony | `"set:dayz_gui image:icon_name"` lub bezpośrednia ścieżka `.edds` |
| Zdarzenia | `m_OnNotificationAdded`, `m_OnNotificationRemoved` |

---

## Dobre praktyki

- **Do niestandardowych powiadomień używaj wariantów `Extended`.** `SendNotificationToPlayerExtended` daje pełną kontrolę nad tytułem, treścią i ikoną. Warianty z `NotificationType` są ograniczone do presetów vanilla.
- **Respektuj limit 5 powiadomień w stosie.** Wysyłanie wielu powiadomień w szybkim tempie wypycha starsze z ekranu, zanim gracze zdążą je przeczytać. Grupuj powiązane wiadomości lub używaj dłuższych czasów wyświetlania.
- **Zawsze zabezpieczaj powiadomienia serwerowe sprawdzeniem `GetGame().IsServer()`.** Wywołanie `SendNotificationToPlayerExtended` na kliencie nie ma żadnego efektu i marnuje wywołanie metody.
- **Dla prawdziwych broadcastów podawaj `null` jako tożsamość.** `SendNotificationToPlayerIdentityExtended(null, ...)` dostarcza do wszystkich połączonych graczy. Nie iteruj ręcznie po graczach, aby wysłać tę samą wiadomość.
- **Utrzymuj tekst powiadomień zwięzły.** Wyskakujące okno toast ma ograniczoną szerokość wyświetlania. Długie tytuły lub treści będą obcinane. Celuj w tytuły poniżej 30 znaków i tekst treści poniżej 80 znaków.

---

## Kompatybilność i wpływ

- **Multi-Mod:** Vanilla `NotificationSystem` jest współdzielony przez wszystkie mody. Wiele modów wysyłających powiadomienia jednocześnie może przepełnić stos 5 powiadomień. CF zapewnia oddzielny kanał powiadomień, który nie koliduje z powiadomieniami vanilla.
- **Wydajność:** Powiadomienia są lekkie (jedno RPC na powiadomienie). Jednak broadcastowanie do wszystkich graczy co kilka sekund generuje mierzalny ruch sieciowy na serwerach z 60+ graczami.
- **Serwer/Klient:** Metody `SendNotificationToPlayer*` to RPC z serwera do klienta. `AddNotificationExtended` jest tylko po stronie klienta (lokalne). Tik `Update()` działa w pętli misji klienta.

---

[<< Poprzedni: Efekty post-processingu](05-ppe.md) | **Powiadomienia** | [Następny: Liczniki czasu i CallQueue >>](07-timers.md)
