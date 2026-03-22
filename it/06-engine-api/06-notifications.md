# Capitolo 6.6: Sistema di notifiche

[Home](../README.md) | [<< Precedente: Effetti di post-elaborazione](05-ppe.md) | **Notifiche** | [Successivo: Timer e CallQueue >>](07-timers.md)

---

## Introduzione

DayZ include un sistema di notifiche integrato per visualizzare messaggi popup in stile toast ai giocatori. La classe `NotificationSystem` fornisce metodi statici per inviare notifiche sia localmente (lato client) sia da server a client tramite RPC. Questo capitolo copre l'API completa per inviare, personalizzare e gestire le notifiche.

---

## NotificationSystem

**File:** `3_Game/client/notifications/notificationsystem.c` (320 righe)

Una classe statica che gestisce la coda delle notifiche. Le notifiche appaiono come piccole schede popup nella parte superiore dello schermo, impilate verticalmente, e svaniscono dopo la scadenza del tempo di visualizzazione.

### Costanti

```c
const int   DEFAULT_TIME_DISPLAYED = 10;    // Tempo di visualizzazione predefinito in secondi
const float NOTIFICATION_FADE_TIME = 3.0;   // Durata della dissolvenza in secondi
static const int MAX_NOTIFICATIONS = 5;     // Notifiche visibili massime
```

---

## Notifiche server-client

Questi metodi vengono chiamati sul server. Inviano un RPC al client del giocatore di destinazione, che visualizza la notifica localmente.

### SendNotificationToPlayerExtended

```c
static void SendNotificationToPlayerExtended(
    Man player,            // Giocatore di destinazione (Man o PlayerBase)
    float show_time,       // Durata visualizzazione in secondi
    string title_text,     // Titolo della notifica
    string detail_text = "",  // Testo del corpo opzionale
    string icon = ""       // Percorso icona opzionale (es. "set:dayz_gui image:icon_info")
);
```

**Esempio --- notificare un giocatore specifico:**

```c
void NotifyPlayer(PlayerBase player, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerExtended(
        player,
        8.0,                   // Mostra per 8 secondi
        "Server Notice",       // Titolo
        message,               // Corpo
        ""                     // Icona predefinita
    );
}
```

### SendNotificationToPlayerIdentityExtended

```c
static void SendNotificationToPlayerIdentityExtended(
    PlayerIdentity player,   // Identita di destinazione (null = broadcast a TUTTI i giocatori)
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Esempio --- broadcast a tutti i giocatori:**

```c
void BroadcastNotification(string title, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerIdentityExtended(
        null,                  // null = tutti i giocatori connessi
        10.0,                  // Mostra per 10 secondi
        title,
        message,
        ""
    );
}
```

### SendNotificationToPlayer (tipizzato)

```c
static void SendNotificationToPlayer(
    Man player,
    NotificationType type,    // Tipo di notifica predefinito
    float show_time,
    string detail_text = ""
);
```

Questa variante usa valori enum `NotificationType` predefiniti che mappano a titoli e icone integrati. Il `detail_text` viene aggiunto come corpo.

---

## Notifiche lato client (locali)

Questi metodi visualizzano notifiche solo sul client locale. Non coinvolgono alcuna comunicazione di rete.

### AddNotificationExtended

```c
static void AddNotificationExtended(
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Esempio --- notifica locale sul client:**

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

### AddNotification (tipizzato)

```c
static void AddNotification(
    NotificationType type,
    float show_time,
    string detail_text = ""
);
```

Usa un `NotificationType` predefinito per il titolo e l'icona.

---

## Enum NotificationType

Il gioco vanilla definisce tipi di notifica con titoli e icone associati. Valori comuni:

| Tipo | Descrizione |
|------|-------------|
| `NotificationType.GENERIC` | Notifica generica |
| `NotificationType.FRIENDLY_FIRE` | Avviso fuoco amico |
| `NotificationType.JOIN` | Giocatore si e unito |
| `NotificationType.LEAVE` | Giocatore ha lasciato |
| `NotificationType.STATUS` | Aggiornamento di stato |

> **Nota:** I tipi disponibili dipendono dalla versione del gioco. Per la massima flessibilita, usa le varianti `Extended` che accettano stringhe personalizzate per titolo e icona.

---

## Percorsi delle icone

Le icone usano la sintassi dell'image set di DayZ:

```
"set:dayz_gui image:icon_name"
```

Nomi di icone comuni:

| Icona | Percorso set |
|-------|-------------|
| Info | `"set:dayz_gui image:icon_info"` |
| Avviso | `"set:dayz_gui image:icon_warning"` |
| Teschio | `"set:dayz_gui image:icon_skull"` |

Puoi anche passare un percorso diretto a un file immagine `.edds`:

```c
"MyMod/GUI/notification_icon.edds"
```

Oppure passa una stringa vuota `""` per nessuna icona.

---

## Eventi

Il `NotificationSystem` espone script invoker per reagire al ciclo di vita delle notifiche:

```c
ref ScriptInvoker m_OnNotificationAdded;
ref ScriptInvoker m_OnNotificationRemoved;
```

**Esempio --- reagire alle notifiche:**

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

## Ciclo di aggiornamento

Il sistema di notifiche deve essere aggiornato ogni frame per gestire le animazioni di apparizione/dissolvenza e la rimozione delle notifiche scadute:

```c
static void Update(float timeslice);
```

Viene chiamato automaticamente dal metodo `OnUpdate` della missione vanilla. Se stai scrivendo una missione completamente personalizzata, assicurati di chiamarlo.

---

## Esempio completo server-client

Un tipico pattern mod per inviare notifiche dal codice server:

```c
// Lato server: in un gestore eventi missione o modulo
class MyServerModule
{
    void OnMissionStarted(string missionName, vector location)
    {
        if (!GetGame().IsServer())
            return;

        // Broadcast a tutti i giocatori
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

        // Notifica solo a questo giocatore
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

Se usi CommunityFramework, fornisce la propria API per le notifiche:

```c
// Notifica CF (RPC interno diverso)
NotificationSystem.Create(
    new StringLocaliser("Title"),
    new StringLocaliser("Body with param: %1", someValue),
    "set:dayz_gui image:icon_info",
    COLOR_GREEN,
    5,
    player.GetIdentity()
);
```

L'API CF aggiunge supporto per colori e localizzazione. Usa qualsiasi sistema richieda il tuo stack di mod --- sono funzionalmente simili ma usano RPC interni diversi.

---

## Riepilogo

| Concetto | Punto chiave |
|----------|-------------|
| Server a giocatore | `SendNotificationToPlayerExtended(player, tempo, titolo, testo, icona)` |
| Server a tutti | `SendNotificationToPlayerIdentityExtended(null, tempo, titolo, testo, icona)` |
| Client locale | `AddNotificationExtended(tempo, titolo, testo, icona)` |
| Tipizzato | `SendNotificationToPlayer(player, NotificationType, tempo, testo)` |
| Max visibili | 5 notifiche impilate |
| Tempo predefinito | 10 secondi visualizzazione, 3 secondi dissolvenza |
| Icone | `"set:dayz_gui image:nome_icona"` o percorso `.edds` diretto |
| Eventi | `m_OnNotificationAdded`, `m_OnNotificationRemoved` |

---

## Buone pratiche

- **Usa le varianti `Extended` per notifiche personalizzate.** `SendNotificationToPlayerExtended` ti da il pieno controllo su titolo, corpo e icona. Le varianti tipizzate `NotificationType` sono limitate ai preset vanilla.
- **Rispetta il limite di 5 notifiche nello stack.** Inviare molte notifiche in rapida successione spinge quelle piu vecchie fuori dallo schermo prima che i giocatori possano leggerle. Raggruppa i messaggi correlati o usa tempi di visualizzazione piu lunghi.
- **Proteggi sempre le notifiche server con `GetGame().IsServer()`.** Chiamare `SendNotificationToPlayerExtended` sul client non ha effetto e spreca una chiamata di metodo.
- **Passa `null` come identita per i veri broadcast.** `SendNotificationToPlayerIdentityExtended(null, ...)` consegna a tutti i giocatori connessi. Non iterare manualmente sui giocatori per inviare lo stesso messaggio.
- **Mantieni il testo delle notifiche conciso.** Il popup toast ha una larghezza di visualizzazione limitata. Titoli o corpi lunghi verranno tagliati. Punta a titoli sotto i 30 caratteri e testo del corpo sotto gli 80 caratteri.

---

## Compatibilita e impatto

- **Multi-Mod:** Il `NotificationSystem` vanilla e condiviso da tutti i mod. Piu mod che inviano notifiche simultaneamente possono far traboccare lo stack di 5 notifiche. CF fornisce un canale di notifica separato che non entra in conflitto con le notifiche vanilla.
- **Prestazioni:** Le notifiche sono leggere (un singolo RPC per notifica). Tuttavia, il broadcast a tutti i giocatori ogni pochi secondi genera traffico di rete misurabile su server con 60+ giocatori.
- **Server/Client:** I metodi `SendNotificationToPlayer*` sono RPC server-to-client. `AddNotificationExtended` e solo client (locale). Il tick `Update()` viene eseguito nel ciclo missione del client.

---

[<< Precedente: Effetti di post-elaborazione](05-ppe.md) | **Notifiche** | [Successivo: Timer e CallQueue >>](07-timers.md)
