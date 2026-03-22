# Capitolo 8.3: Costruire un Modulo Pannello Admin

[Home](../README.md) | [<< Precedente: Creare un Oggetto Personalizzato](02-custom-item.md) | **Costruire un Pannello Admin** | [Successivo: Aggiungere Comandi Chat >>](04-chat-commands.md)

---

> **Riepilogo:** Questo tutorial ti guida nella costruzione di un modulo pannello admin completo partendo da zero. Creerai un layout UI, collegherai i widget nello script, gestirai i clic dei pulsanti, invierai un RPC dal client al server, elaborerai la richiesta sul server, invierai una risposta indietro e visualizzerai il risultato nell'interfaccia. Questo copre l'intero ciclo client-server-client di cui ogni mod con funzionalità di rete ha bisogno.

---

## Indice dei Contenuti

- [Cosa Stiamo Costruendo](#cosa-stiamo-costruendo)
- [Prerequisiti](#prerequisiti)
- [Panoramica dell'Architettura](#panoramica-dellarchitettura)
- [Step 1: Creare la Classe Modulo](#step-1-creare-la-classe-modulo)
- [Step 2: Creare il File di Layout](#step-2-creare-il-file-di-layout)
- [Step 3: Collegare i Widget in OnActivated](#step-3-collegare-i-widget-in-onactivated)
- [Step 4: Gestire i Clic dei Pulsanti](#step-4-gestire-i-clic-dei-pulsanti)
- [Step 5: Inviare un RPC al Server](#step-5-inviare-un-rpc-al-server)
- [Step 6: Gestire la Risposta Lato Server](#step-6-gestire-la-risposta-lato-server)
- [Step 7: Aggiornare la UI con i Dati Ricevuti](#step-7-aggiornare-la-ui-con-i-dati-ricevuti)
- [Step 8: Registrare il Modulo](#step-8-registrare-il-modulo)
- [Riferimento Completo dei File](#riferimento-completo-dei-file)
- [Spiegazione del Ciclo Completo](#spiegazione-del-ciclo-completo)
- [Risoluzione dei Problemi](#risoluzione-dei-problemi)
- [Prossimi Passi](#prossimi-passi)

---

## Cosa Stiamo Costruendo

Creeremo un pannello **Admin Player Info** che:

1. Mostra un pulsante "Refresh" in un semplice pannello UI
2. Quando l'admin clicca Refresh, invia un RPC al server richiedendo i dati del conteggio giocatori
3. Il server riceve la richiesta, raccoglie le informazioni e le invia indietro
4. Il client riceve la risposta e visualizza il conteggio e la lista dei giocatori nella UI

Questo dimostra il pattern fondamentale utilizzato da ogni strumento admin di rete, pannello di configurazione mod e interfaccia multiplayer in DayZ.

---

## Prerequisiti

- Una mod funzionante dal [Capitolo 8.1](01-first-mod.md) o una nuova mod con la struttura standard
- Comprensione della [Gerarchia a 5 Layer degli Script](../02-mod-structure/01-five-layers.md) (useremo `3_Game`, `4_World` e `5_Mission`)
- Familiarità di base nella lettura del codice Enforce Script

### Struttura del Mod per Questo Tutorial

Creeremo questi nuovi file:

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

## Panoramica dell'Architettura

Prima di scrivere codice, comprendi il flusso dei dati:

```
CLIENT                              SERVER
------                              ------

1. L'admin clicca "Refresh"
2. Il client invia RPC ------>  3. Il server riceve l'RPC
   (AdminDemo_RequestInfo)         Raccoglie i dati dei giocatori
                             4. Il server invia RPC ------>  CLIENT
                                (AdminDemo_ResponseInfo)
                                                     5. Il client riceve l'RPC
                                                        Aggiorna il testo della UI
```

Il sistema RPC (Remote Procedure Call) è il modo in cui client e server comunicano in DayZ. Il motore fornisce i metodi `GetGame().RPCSingleParam()` e `GetGame().RPC()` per inviare dati, e un override `OnRPC()` per riceverli.

**Vincoli chiave:**
- I client non possono leggere direttamente i dati lato server (lista giocatori, stato del server)
- Tutta la comunicazione tra i confini deve passare attraverso RPC
- I messaggi RPC sono identificati da ID interi
- I dati vengono inviati come parametri serializzati usando le classi `Param`

---

## Step 1: Creare la Classe Modulo

Per prima cosa, definisci gli identificatori RPC in `3_Game` (il layer più basso dove i tipi di gioco sono disponibili). Gli ID RPC devono essere definiti in `3_Game` perché sia `4_World` (gestore lato server) che `5_Mission` (gestore lato client) hanno bisogno di riferirsi ad essi.

### Crea `Scripts/3_Game/AdminDemo/AdminDemoRPC.c`

```c
class AdminDemoRPC
{
    // ID RPC -- scegli numeri unici che non collidano con altre mod
    // Usare numeri alti riduce il rischio di collisione
    static const int REQUEST_PLAYER_INFO  = 78001;
    static const int RESPONSE_PLAYER_INFO = 78002;
};
```

Queste costanti saranno utilizzate sia dal client (per inviare richieste) che dal server (per identificare le richieste in arrivo e inviare risposte).

### Perché 3_Game?

Gli ID RPC sono dati puri -- interi senza dipendenze da entità del mondo o dalla UI. Posizionarli in `3_Game` li rende visibili sia a `4_World` (dove risiede il gestore lato server) che a `5_Mission` (dove risiede la UI lato client).

---

## Step 2: Creare il File di Layout

Il file di layout definisce la struttura visuale del tuo pannello. DayZ usa un formato testuale personalizzato (non XML) per i file `.layout`.

### Crea `GUI/layouts/admin_player_info.layout`

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

### Dettaglio del Layout

| Widget | Scopo |
|--------|-------|
| `AdminDemoPanel` | Frame radice, largo 40% e alto 50%, centrato sullo schermo |
| `Background` | Sfondo scuro semi-trasparente che riempie l'intero pannello |
| `Title` | Testo "Player Info Panel" in alto |
| `RefreshButton` | Pulsante che l'admin clicca per richiedere i dati |
| `PlayerCountText` | Visualizza il numero del conteggio giocatori |
| `PlayerListText` | Visualizza la lista dei nomi dei giocatori |
| `CloseButton` | Chiude il pannello |

Tutte le dimensioni usano coordinate proporzionali (da 0.0 a 1.0 relative al genitore) perché `hexactsize` e `vexactsize` sono impostati a `0`.

---

## Step 3: Collegare i Widget in OnActivated

Ora crea lo script del pannello lato client che carica il layout e collega i widget alle variabili.

### Crea `Scripts/5_Mission/AdminDemo/AdminDemoPanel.c`

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
    // Apri il pannello: crea i widget e collega i riferimenti
    // -------------------------------------------------------
    void Open()
    {
        if (m_IsOpen)
            return;

        // Carica il file di layout e ottieni il widget radice
        m_Root = GetGame().GetWorkspace().CreateWidgets("AdminDemo/GUI/layouts/admin_player_info.layout");
        if (!m_Root)
        {
            Print("[AdminDemo] ERRORE: Caricamento del file di layout fallito!");
            return;
        }

        // Collega i riferimenti ai widget per nome
        m_RefreshButton  = ButtonWidget.Cast(m_Root.FindAnyWidget("RefreshButton"));
        m_CloseButton    = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));
        m_PlayerCountText = TextWidget.Cast(m_Root.FindAnyWidget("PlayerCountText"));
        m_PlayerListText  = TextWidget.Cast(m_Root.FindAnyWidget("PlayerListText"));

        // Registra questa classe come gestore degli eventi per i nostri widget
        if (m_RefreshButton)
            m_RefreshButton.SetHandler(this);

        if (m_CloseButton)
            m_CloseButton.SetHandler(this);

        m_Root.Show(true);
        m_IsOpen = true;

        // Mostra il cursore del mouse perché l'admin possa cliccare i pulsanti
        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print("[AdminDemo] Pannello aperto.");
    }

    // -------------------------------------------------------
    // Chiudi il pannello: distruggi i widget e ripristina i controlli
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

        // Ripristina i controlli del giocatore e nascondi il cursore
        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print("[AdminDemo] Pannello chiuso.");
    }

    bool IsOpen()
    {
        return m_IsOpen;
    }

    // -------------------------------------------------------
    // Alterna apertura/chiusura
    // -------------------------------------------------------
    void Toggle()
    {
        if (m_IsOpen)
            Close();
        else
            Open();
    }

    // -------------------------------------------------------
    // Gestisci gli eventi di clic dei pulsanti
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
    // Chiamato quando l'admin clicca Refresh
    // -------------------------------------------------------
    protected void OnRefreshClicked()
    {
        Print("[AdminDemo] Refresh cliccato, invio RPC al server...");

        // Aggiorna la UI per mostrare lo stato di caricamento
        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: Loading...");

        if (m_PlayerListText)
            m_PlayerListText.SetText("Richiesta dati al server...");

        // Invia RPC al server
        // Parametri: oggetto target, ID RPC, dati, destinatario (null = server)
        Man player = GetGame().GetPlayer();
        if (player)
        {
            Param1<bool> params = new Param1<bool>(true);
            GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
        }
    }

    // -------------------------------------------------------
    // Chiamato quando arriva la risposta del server (da mission OnRPC)
    // -------------------------------------------------------
    void OnPlayerInfoReceived(int playerCount, string playerNames)
    {
        Print("[AdminDemo] Info giocatori ricevute: " + playerCount.ToString() + " giocatori");

        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: " + playerCount.ToString());

        if (m_PlayerListText)
            m_PlayerListText.SetText(playerNames);
    }
};
```

### Concetti Chiave

**`CreateWidgets()`** carica il file `.layout` e crea gli oggetti widget effettivi in memoria. Restituisce il widget radice.

**`FindAnyWidget("name")`** cerca nell'albero dei widget un widget con il nome specificato. Il nome deve corrispondere esattamente al nome del widget nel file di layout.

**`Cast()`** converte il riferimento generico `Widget` in un tipo specifico (come `ButtonWidget`). Questo è richiesto perché `FindAnyWidget` restituisce il tipo base `Widget`.

**`SetHandler(this)`** registra questa classe come gestore degli eventi per il widget. Quando il pulsante viene cliccato, il motore chiama `OnClick()` su questo oggetto.

**`PlayerControlDisable` / `PlayerControlEnable`** disabilita/riabilita il movimento e le azioni del giocatore. Senza questo, il giocatore si muoverebbe mentre cerca di cliccare i pulsanti.

---

## Step 4: Gestire i Clic dei Pulsanti

La gestione dei clic dei pulsanti è già implementata nel metodo `OnClick()` dello Step 3. Esaminiamo il pattern più da vicino.

### Il Pattern OnClick

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_RefreshButton)
    {
        OnRefreshClicked();
        return true;    // Evento consumato -- ferma la propagazione
    }

    if (w == m_CloseButton)
    {
        Close();
        return true;
    }

    return false;        // Evento non consumato -- lascialo propagare
}
```

**Parametri:**
- `w` -- Il widget che è stato cliccato
- `x`, `y` -- Coordinate del mouse al momento del clic
- `button` -- Quale pulsante del mouse (0 = sinistro, 1 = destro, 2 = centrale)

**Valore di ritorno:**
- `true` significa che hai gestito l'evento. Ferma la propagazione ai widget genitori.
- `false` significa che non l'hai gestito. Il motore lo passa al gestore successivo.

**Pattern:** Confronta il widget cliccato `w` con i tuoi riferimenti ai widget conosciuti. Chiama un metodo gestore per ogni pulsante riconosciuto. Restituisci `true` per i clic gestiti, `false` per tutto il resto.

---

## Step 5: Inviare un RPC al Server

Quando l'admin clicca Refresh, dobbiamo inviare un messaggio dal client al server. DayZ fornisce il sistema RPC per questo.

### Invio RPC (dal Client al Server)

La chiamata di invio principale dallo Step 3:

```c
Man player = GetGame().GetPlayer();
if (player)
{
    Param1<bool> params = new Param1<bool>(true);
    GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
}
```

**`GetGame().RPCSingleParam(target, rpcID, params, guaranteed)`:**

| Parametro | Significato |
|-----------|-------------|
| `target` | L'oggetto a cui questo RPC è associato. Usare il giocatore è lo standard. |
| `rpcID` | Il tuo identificatore intero unico (definito in `AdminDemoRPC`). |
| `params` | Un oggetto `Param` che trasporta il payload dei dati. |
| `guaranteed` | `true` = consegna affidabile tipo TCP. `false` = spara-e-dimentica tipo UDP. Usa sempre `true` per le operazioni admin. |

### Classi Param

DayZ fornisce classi template `Param` per l'invio dei dati:

| Classe | Utilizzo |
|--------|----------|
| `Param1<T>` | Un valore |
| `Param2<T1, T2>` | Due valori |
| `Param3<T1, T2, T3>` | Tre valori |

Puoi inviare stringhe, interi, float, booleani e vettori. Esempio con valori multipli:

```c
Param3<string, int, float> data = new Param3<string, int, float>("hello", 42, 3.14);
GetGame().RPCSingleParam(player, MY_RPC_ID, data, true);
```

---

## Step 6: Gestire la Risposta Lato Server

Il server riceve l'RPC del client, raccoglie i dati e invia una risposta indietro.

### Crea `Scripts/4_World/AdminDemo/AdminDemoServer.c`

```c
modded class PlayerBase
{
    // -------------------------------------------------------
    // Gestore RPC lato server
    // -------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        // Gestisci solo sul server
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
    // Raccoglie i dati dei giocatori e invia la risposta
    // -------------------------------------------------------
    protected void HandlePlayerInfoRequest(PlayerIdentity requestor)
    {
        if (!requestor)
            return;

        Print("[AdminDemo] Il server ha ricevuto richiesta info giocatori da: " + requestor.GetName());

        // --- Controllo permessi (opzionale ma raccomandato) ---
        // In una mod reale, controlla se il richiedente è un admin:
        // if (!IsAdmin(requestor))
        //     return;

        // --- Raccoglie i dati dei giocatori ---
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
            playerNames = "(Nessun giocatore connesso)";

        // --- Invia risposta al client richiedente ---
        Param2<int, string> responseData = new Param2<int, string>(playerCount, playerNames);

        // RPCSingleParam con l'oggetto giocatore del richiedente invia a quel client specifico
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

            Print("[AdminDemo] Il server ha inviato risposta info giocatori: " + playerCount.ToString() + " giocatori");
        }
    }
};
```

### Come Funziona la Ricezione RPC Lato Server

1. **`OnRPC()` viene chiamato sull'oggetto target.** Quando il client ha inviato l'RPC con `target = player`, il `PlayerBase.OnRPC()` lato server si attiva.

2. **Chiama sempre `super.OnRPC()`.** Altre mod e il codice vanilla potrebbero anche gestire RPC su questo oggetto.

3. **Controlla `GetGame().IsServer()`.** Questo codice è in `4_World`, che viene compilato sia su client che su server. Il controllo `IsServer()` assicura che la richiesta venga elaborata solo sul server.

4. **Fai lo switch su `rpc_type`.** Confronta con le tue costanti ID RPC.

5. **Invia la risposta.** Usa `RPCSingleParam` con il quinto parametro (`recipient`) impostato sull'identità del giocatore richiedente. Questo invia la risposta solo a quel client specifico.

### Firma della Risposta RPCSingleParam

```c
GetGame().RPCSingleParam(
    requestorPlayer,                        // Oggetto target (il giocatore)
    AdminDemoRPC.RESPONSE_PLAYER_INFO,      // ID RPC
    responseData,                           // Payload dei dati
    true,                                   // Consegna garantita
    requestor                               // Identità del destinatario (client specifico)
);
```

Il quinto parametro `requestor` (un `PlayerIdentity`) è ciò che rende questa una risposta mirata. Senza di esso, l'RPC verrebbe inviato a tutti i client.

---

## Step 7: Aggiornare la UI con i Dati Ricevuti

Lato client, dobbiamo intercettare l'RPC di risposta del server e indirizzarlo al pannello.

### Crea `Scripts/5_Mission/AdminDemo/AdminDemoMission.c`

```c
modded class MissionGameplay
{
    protected ref AdminDemoPanel m_AdminDemoPanel;

    // -------------------------------------------------------
    // Inizializza il pannello all'avvio della missione
    // -------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        if (!m_AdminDemoPanel)
            m_AdminDemoPanel = new AdminDemoPanel();

        Print("[AdminDemo] Missione client inizializzata.");
    }

    // -------------------------------------------------------
    // Pulisci alla fine della missione
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
    // Gestisci l'input da tastiera per alternare il pannello
    // -------------------------------------------------------
    override void OnKeyPress(int key)
    {
        super.OnKeyPress(key);

        // Il tasto F5 alterna il pannello admin
        if (key == KeyCode.KC_F5)
        {
            if (m_AdminDemoPanel)
                m_AdminDemoPanel.Toggle();
        }
    }

    // -------------------------------------------------------
    // Ricevi RPC dal server sul lato client
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
    // Deserializza la risposta del server e aggiorna il pannello
    // -------------------------------------------------------
    protected void HandlePlayerInfoResponse(ParamsReadContext ctx)
    {
        Param2<int, string> data = new Param2<int, string>(0, "");
        if (!ctx.Read(data))
        {
            Print("[AdminDemo] ERRORE: Lettura risposta info giocatori fallita!");
            return;
        }

        int playerCount = data.param1;
        string playerNames = data.param2;

        Print("[AdminDemo] Client ha ricevuto info giocatori: " + playerCount.ToString() + " giocatori");

        if (m_AdminDemoPanel)
            m_AdminDemoPanel.OnPlayerInfoReceived(playerCount, playerNames);
    }
};
```

### Come Funziona la Ricezione RPC Lato Client

1. **`MissionGameplay.OnRPC()`** è un gestore generico per gli RPC ricevuti sul client. Si attiva per ogni RPC in arrivo.

2. **`ParamsReadContext ctx`** contiene i dati serializzati inviati dal server. Devi deserializzarli usando `ctx.Read()` con un tipo `Param` corrispondente.

3. **La corrispondenza dei tipi Param è critica.** Il server ha inviato `Param2<int, string>`. Il client deve leggere con `Param2<int, string>`. Una mancata corrispondenza fa restituire `false` a `ctx.Read()` e nessun dato viene recuperato.

4. **Indirizza i dati al pannello.** Dopo la deserializzazione, chiama un metodo sull'oggetto pannello per aggiornare la UI.

### Il Gestore OnKeyPress

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

Questo si aggancia all'input da tastiera della missione. Quando l'admin preme F5, il pannello si apre o si chiude. `KeyCode.KC_F5` è una costante integrata per il tasto F5.

---

## Step 8: Registrare il Modulo

Infine, collega tutto insieme in config.cpp.

### Crea `AdminDemo/mod.cpp`

```cpp
name = "Admin Demo";
author = "YourName";
version = "1.0";
overview = "Tutorial admin panel demonstrating the full RPC roundtrip pattern.";
```

### Crea `AdminDemo/Scripts/config.cpp`

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

### Perché Tre Layer?

| Layer | Contiene | Motivo |
|-------|----------|--------|
| `3_Game` | `AdminDemoRPC.c` | Le costanti ID RPC devono essere visibili sia a `4_World` che a `5_Mission` |
| `4_World` | `AdminDemoServer.c` | Gestore lato server che modda `PlayerBase` (un'entità del mondo) |
| `5_Mission` | `AdminDemoPanel.c`, `AdminDemoMission.c` | UI lato client e hook della missione |

---

## Riferimento Completo dei File

### Struttura Directory Finale

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

        Print("[AdminDemo] Il server ha ricevuto richiesta info giocatori da: " + requestor.GetName());

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
            playerNames = "(Nessun giocatore connesso)";

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
            Print("[AdminDemo] Il server ha inviato risposta info giocatori: " + playerCount.ToString() + " giocatori");
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
            Print("[AdminDemo] ERRORE: Caricamento del file di layout fallito!");
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

        Print("[AdminDemo] Pannello aperto.");
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

        Print("[AdminDemo] Pannello chiuso.");
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
        Print("[AdminDemo] Refresh cliccato, invio RPC al server...");

        if (m_PlayerCountText)
            m_PlayerCountText.SetText("Player Count: Loading...");

        if (m_PlayerListText)
            m_PlayerListText.SetText("Richiesta dati al server...");

        Man player = GetGame().GetPlayer();
        if (player)
        {
            Param1<bool> params = new Param1<bool>(true);
            GetGame().RPCSingleParam(player, AdminDemoRPC.REQUEST_PLAYER_INFO, params, true);
        }
    }

    void OnPlayerInfoReceived(int playerCount, string playerNames)
    {
        Print("[AdminDemo] Info giocatori ricevute: " + playerCount.ToString() + " giocatori");

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

        Print("[AdminDemo] Missione client inizializzata.");
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
            Print("[AdminDemo] ERRORE: Lettura risposta info giocatori fallita!");
            return;
        }

        int playerCount = data.param1;
        string playerNames = data.param2;

        Print("[AdminDemo] Client ha ricevuto info giocatori: " + playerCount.ToString() + " giocatori");

        if (m_AdminDemoPanel)
            m_AdminDemoPanel.OnPlayerInfoReceived(playerCount, playerNames);
    }
};
```

---

## Spiegazione del Ciclo Completo

Ecco la sequenza esatta degli eventi quando l'admin preme F5 e clicca Refresh:

```
1. [CLIENT] L'admin preme F5
   --> MissionGameplay.OnKeyPress(KC_F5) si attiva
   --> AdminDemoPanel.Toggle() viene chiamato
   --> Il pannello si apre, il layout viene creato, il cursore appare

2. [CLIENT] L'admin clicca il pulsante "Refresh"
   --> AdminDemoPanel.OnClick() si attiva con w == m_RefreshButton
   --> OnRefreshClicked() viene chiamato
   --> La UI mostra "Loading..."
   --> RPCSingleParam invia REQUEST_PLAYER_INFO (78001) al server

3. [RETE] L'RPC viaggia dal client al server

4. [SERVER] PlayerBase.OnRPC() si attiva
   --> rpc_type corrisponde a REQUEST_PLAYER_INFO
   --> HandlePlayerInfoRequest(sender) viene chiamato
   --> Il server itera tutti i giocatori connessi
   --> Costruisce il conteggio e la lista dei nomi
   --> RPCSingleParam invia RESPONSE_PLAYER_INFO (78002) al client

5. [RETE] L'RPC viaggia dal server al client

6. [CLIENT] MissionGameplay.OnRPC() si attiva
   --> rpc_type corrisponde a RESPONSE_PLAYER_INFO
   --> HandlePlayerInfoResponse(ctx) viene chiamato
   --> I dati vengono deserializzati da ParamsReadContext
   --> AdminDemoPanel.OnPlayerInfoReceived() viene chiamato
   --> La UI si aggiorna con il conteggio e i nomi dei giocatori

Tempo totale: tipicamente sotto i 100ms su una rete locale.
```

---

## Risoluzione dei Problemi

### Il Pannello Non Si Apre Premendo F5

- **Controlla l'override di OnKeyPress:** Assicurati che `super.OnKeyPress(key)` venga chiamato per primo.
- **Controlla il codice del tasto:** `KeyCode.KC_F5` è la costante corretta. Se usi un tasto diverso, trova la costante giusta nell'API di Enforce Script.
- **Controlla l'inizializzazione:** Assicurati che `m_AdminDemoPanel` venga creato in `OnInit()`.

### Il Pannello Si Apre Ma i Pulsanti Non Funzionano

- **Controlla SetHandler:** Ogni pulsante necessita che `button.SetHandler(this)` venga chiamato su di esso.
- **Controlla i nomi dei widget:** `FindAnyWidget("RefreshButton")` è case-sensitive. Il nome deve corrispondere esattamente al file di layout.
- **Controlla il ritorno di OnClick:** Assicurati che `OnClick` restituisca `true` per i pulsanti gestiti.

### L'RPC Non Raggiunge Mai il Server

- **Controlla l'unicità degli ID RPC:** Se un'altra mod usa lo stesso numero ID RPC, ci saranno conflitti. Usa numeri alti e unici.
- **Controlla il riferimento al giocatore:** `GetGame().GetPlayer()` restituisce `null` se chiamato prima che il giocatore sia completamente inizializzato. Assicurati che il pannello si apra solo dopo che il giocatore è spawnato.
- **Controlla che il codice server compili:** Cerca nel log degli script del server errori `SCRIPT (E)` nel tuo codice `4_World`.

### La Risposta del Server Non Raggiunge Mai il Client

- **Controlla il parametro destinatario:** Il quinto parametro di `RPCSingleParam` deve essere il `PlayerIdentity` del client destinatario.
- **Controlla la corrispondenza dei tipi Param:** Il server invia `Param2<int, string>`, il client legge `Param2<int, string>`. Una mancata corrispondenza dei tipi causa il fallimento di `ctx.Read()`.
- **Controlla l'override di MissionGameplay.OnRPC:** Assicurati di chiamare `super.OnRPC()` e che la firma del metodo sia corretta.

### La UI Si Mostra Ma i Dati Non Si Aggiornano

- **Riferimenti widget null:** Se `FindAnyWidget` restituisce `null` (nome del widget errato), le chiamate a `SetText()` falliscono silenziosamente.
- **Controlla il riferimento al pannello:** Assicurati che `m_AdminDemoPanel` nella classe mission sia lo stesso oggetto che è stato aperto.
- **Aggiungi istruzioni Print:** Traccia il flusso dei dati aggiungendo chiamate `Print()` ad ogni passo.

---

## Prossimi Passi

1. **[Capitolo 8.4: Aggiungere Comandi Chat](04-chat-commands.md)** -- Crea comandi chat lato server per operazioni admin.
2. **Aggiungi i permessi** -- Controlla se il giocatore richiedente è un admin prima di elaborare gli RPC.
3. **Aggiungi più funzionalità** -- Estendi il pannello con schede per il controllo meteo, teletrasporto giocatori, spawn di oggetti.
4. **Usa un framework** -- Framework come MyMod Core forniscono routing RPC integrato, gestione configurazione e infrastruttura per pannelli admin che elimina gran parte di questo codice boilerplate.
5. **Personalizza la UI** -- Scopri gli stili dei widget, gli imageset e i font nel [Capitolo 3: Sistema GUI](../03-gui-system/01-widget-types.md).

---

## Buone Pratiche

- **Valida tutti i dati RPC sul server prima dell'esecuzione.** Non fidarti mai dei dati provenienti dal client -- controlla sempre i permessi, valida i parametri e proteggi dai valori null prima di eseguire qualsiasi azione sul server.
- **Memorizza i riferimenti ai widget nelle variabili membro invece di chiamare `FindAnyWidget` ogni frame.** La ricerca dei widget non è gratuita; chiamarla ripetutamente in `OnUpdate` o `OnClick` spreca prestazioni.
- **Chiama sempre `SetHandler(this)` sui widget interattivi.** Senza di esso, `OnClick()` non si attiverà mai, e non c'è nessun messaggio di errore -- i pulsanti semplicemente non fanno nulla silenziosamente.
- **Usa numeri ID RPC alti e unici.** Il DayZ vanilla usa ID bassi. Altre mod scelgono intervalli comuni. Usa numeri sopra 70000 e aggiungi il prefisso della tua mod nei commenti così le collisioni sono tracciabili.
- **Pulisci i widget in `OnMissionFinish`.** I widget root non eliminati si accumulano tra i cambi di server, consumando memoria e causando elementi UI fantasma.

---

## Teoria vs Pratica

| Concetto | Teoria | Realtà |
|----------|--------|--------|
| Consegna di `RPCSingleParam` | Impostare `guaranteed=true` significa che l'RPC arriva sempre | Gli RPC possono comunque essere persi se il giocatore si disconnette durante il transito o il server crasha. Gestisci sempre il caso "nessuna risposta" nella tua UI (es. un messaggio di timeout). |
| Corrispondenza widget in `OnClick` | Confronta `w == m_Button` per identificare i clic | Se `FindAnyWidget` ha restituito NULL (errore di battitura nel nome del widget), `m_Button` è NULL e il confronto fallisce silenziosamente. Logga sempre un avviso se il collegamento del widget fallisce in `Open()`. |
| Corrispondenza dei tipi Param | Client e server usano lo stesso `Param2<int, string>` | Se i tipi o l'ordine non corrispondono esattamente, `ctx.Read()` restituisce false e i dati vengono persi silenziosamente. Non c'è nessun messaggio di errore di controllo dei tipi a runtime. |
| Test su listen server | Sufficiente per iterazione rapida | I listen server eseguono client e server in un unico processo, quindi gli RPC arrivano istantaneamente e non attraversano mai la rete. Bug di temporizzazione, perdita di pacchetti e problemi di autorità compaiono solo su un vero server dedicato. |

---

## Cosa Hai Imparato

In questo tutorial hai imparato:
- Come creare un pannello UI con file di layout e collegare i widget nello script
- Come gestire i clic dei pulsanti con `OnClick()` e `SetHandler()`
- Come inviare RPC dal client al server e viceversa usando `RPCSingleParam` e le classi `Param`
- Il pattern completo del ciclo client-server-client utilizzato da ogni strumento admin di rete
- Come registrare il pannello in `MissionGameplay` con una gestione corretta del ciclo di vita

**Successivo:** [Capitolo 8.4: Aggiungere Comandi Chat](04-chat-commands.md)

---

**Precedente:** [Capitolo 8.2: Creare un Oggetto Personalizzato](02-custom-item.md)
**Successivo:** [Capitolo 8.4: Aggiungere Comandi Chat](04-chat-commands.md)
