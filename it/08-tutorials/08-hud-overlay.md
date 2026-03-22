# Capitolo 8.8: Costruire un Overlay HUD

[Home](../README.md) | [<< Precedente: Pubblicazione sullo Steam Workshop](07-publishing-workshop.md) | **Costruire un Overlay HUD** | [Successivo: Template Professionale per Mod >>](09-professional-template.md)

---

> **Riepilogo:** Questo tutorial ti guida nella costruzione di un overlay HUD personalizzato che mostra informazioni sul server nell'angolo in alto a destra dello schermo. Creerai un file layout, scriverai una classe controller, ti aggancerai al ciclo di vita della missione, richiederai dati dal server tramite RPC, aggiungerai un tasto di attivazione, e rifinrai il risultato con animazioni di dissolvenza e visibilità intelligente. Alla fine, avrai un HUD Informazioni Server discreto che mostra il nome del server, il conteggio giocatori e l'orario di gioco corrente -- oltre a una solida comprensione di come funzionano gli overlay HUD in DayZ.

---

## Indice dei Contenuti

- [Cosa Stiamo Costruendo](#cosa-stiamo-costruendo)
- [Prerequisiti](#prerequisiti)
- [Struttura del Mod](#struttura-del-mod)
- [Step 1: Creare il File Layout](#step-1-creare-il-file-layout)
- [Step 2: Creare la Classe Controller HUD](#step-2-creare-la-classe-controller-hud)
- [Step 3: Agganciarsi a MissionGameplay](#step-3-agganciarsi-a-missiongameplay)
- [Step 4: Richiedere Dati dal Server](#step-4-richiedere-dati-dal-server)
- [Step 5: Aggiungere il Toggle con Tasto](#step-5-aggiungere-il-toggle-con-tasto)
- [Step 6: Rifinitura](#step-6-rifinitura)
- [Riferimento Codice Completo](#riferimento-codice-completo)
- [Estendere l'HUD](#estendere-lhud)
- [Errori Comuni](#errori-comuni)
- [Prossimi Passi](#prossimi-passi)

---

## Cosa Stiamo Costruendo

Un piccolo pannello semi-trasparente ancorato all'angolo in alto a destra dello schermo che mostra tre righe di informazioni:

```
  Aurora Survival [Official]
  Players: 24 / 60
  Time: 14:35
```

Il pannello si trova sotto gli indicatori di stato e sopra la quickbar. Si aggiorna una volta al secondo (non ad ogni frame), appare con dissolvenza quando viene mostrato e scompare con dissolvenza quando viene nascosto, e si nasconde automaticamente quando l'inventario o il menù di pausa sono aperti. Il giocatore può attivarlo e disattivarlo con un tasto configurabile (predefinito: **F7**).

### Risultato Atteso

Quando caricato, vedrai un rettangolo scuro semi-trasparente nell'area in alto a destra dello schermo. Il testo bianco mostra il nome del server sulla prima riga, il conteggio giocatori corrente sulla seconda riga e l'orario di gioco corrente sulla terza riga. Premendo F7 si dissolve dolcemente; premendo F7 di nuovo riappare con dissolvenza.

---

## Prerequisiti

- Una struttura mod funzionante (completa prima il [Capitolo 8.1](01-first-mod.md))
- Comprensione di base della sintassi Enforce Script
- Familiarità con il modello client-server di DayZ (l'HUD gira sul client; il conteggio giocatori viene dal server)

---

## Struttura del Mod

Crea la seguente struttura di directory:

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

Il layer `3_Game` definisce le costanti (il nostro ID RPC). Il layer `4_World` gestisce la risposta lato server. Il layer `5_Mission` contiene la classe HUD e l'hook alla missione. Il file layout definisce l'albero dei widget.

---

## Step 1: Creare il File Layout

I file layout (`.layout`) definiscono la gerarchia dei widget in XML. Il sistema GUI di DayZ utilizza un modello a coordinate dove ogni widget ha una posizione e una dimensione espresse come valori proporzionali (da 0.0 a 1.0 del genitore) più offset in pixel.

### `GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <!-- Frame radice: copre l'intero schermo, non consuma input -->
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
        <!-- Pannello di sfondo: angolo in alto a destra -->
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
            <!-- Testo nome server -->
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
            <!-- Testo conteggio giocatori -->
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
            <!-- Testo orario di gioco -->
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

### Concetti Chiave del Layout

| Attributo | Significato |
|-----------|-------------|
| `halign="2"` | Allineamento orizzontale: **destra**. Il widget si ancora al bordo destro del genitore. |
| `valign="0"` | Allineamento verticale: **alto**. |
| `hexactpos="0"` + `vexactpos="1"` | La posizione orizzontale è proporzionale (1.0 = bordo destro), la posizione verticale è in pixel. |
| `hexactsize="1"` + `vexactsize="1"` | Larghezza e altezza sono in pixel (220 x 70). |
| `color="0 0 0 0.55"` | RGBA come float. Nero al 55% di opacità per il pannello di sfondo. |

Il `ServerInfoPanel` è posizionato a X proporzionale=1.0 (bordo destro) con `halign="2"` (allineato a destra), quindi il bordo destro del pannello tocca il lato destro dello schermo. La posizione Y è 0 pixel dall'alto. Questo posiziona il nostro HUD nell'angolo in alto a destra.

**Perché dimensioni in pixel per il pannello?** Il dimensionamento proporzionale farebbe scalare il pannello con la risoluzione, ma per piccoli widget informativi si vuole un'impronta fissa in pixel così il testo resta leggibile a tutte le risoluzioni.

---

## Step 2: Creare la Classe Controller HUD

La classe controller carica il layout, trova i widget per nome ed espone metodi per aggiornare il testo visualizzato. Estende `ScriptedWidgetEventHandler` così può ricevere eventi dei widget se necessario in futuro.

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

    // Quanto spesso aggiornare i dati visualizzati (secondi)
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

    // Crea e mostra l'HUD
    void Init()
    {
        if (m_Root)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout"
        );

        if (!m_Root)
        {
            Print("[ServerInfoHUD] ERRORE: Impossibile caricare il file layout.");
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

        // Richiedi i dati iniziali dal server
        RequestServerInfo();
    }

    // Rimuovi tutti i widget
    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    // Chiamato ogni frame da MissionGameplay.OnUpdate
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

    // Aggiorna la visualizzazione dell'orario di gioco (lato client, nessun RPC necessario)
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

    // Invia RPC al server chiedendo conteggio giocatori e nome server
    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            // Modalità offline: mostra solo info locali
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

    // --- Setter chiamati quando arrivano i dati ---

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

    // Alterna visibilità
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (m_Root)
            m_Root.Show(m_IsVisible);
    }

    // Nascondi quando i menù sono aperti
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

### Dettagli Importanti

1. **Percorso `CreateWidgets`**: Il percorso è relativo alla radice del mod. Poiché impacchettiamo la cartella `GUI/` dentro il PBO, il motore risolve `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout` usando il prefisso del mod.
2. **`FindAnyWidget`**: Cerca nell'albero dei widget ricorsivamente per nome. Controlla sempre per NULL dopo il casting.
3. **`Widget.Unlink()`**: Rimuove correttamente il widget e tutti i suoi figli dall'albero UI. Chiamalo sempre durante la pulizia.
4. **Pattern dell'accumulatore di tempo**: Aggiungiamo `timeslice` ad ogni frame e agiamo solo quando il tempo accumulato supera `UPDATE_INTERVAL`. Questo evita di fare lavoro ad ogni singolo frame.

---

## Step 3: Agganciarsi a MissionGameplay

La classe `MissionGameplay` è il controller della missione lato client. Usiamo `modded class` per iniettare il nostro HUD nel suo ciclo di vita senza sostituire il file vanilla.

### `Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        // Crea l'overlay HUD
        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        // Pulisci PRIMA di chiamare super
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

        // Nascondi l'HUD quando l'inventario o qualsiasi menù è aperto
        UIManager uiMgr = GetGame().GetUIManager();
        bool menuOpen = false;

        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);

        // Aggiorna i dati dell'HUD (limitato internamente)
        m_ServerInfoHUD.Update(timeslice);

        // Controlla il tasto di toggle
        Input input = GetGame().GetInput();
        if (input)
        {
            if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
            {
                m_ServerInfoHUD.ToggleVisibility();
            }
        }
    }

    // Accessor così il gestore RPC può raggiungere l'HUD
    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### Perché Questo Pattern Funziona

- **`OnInit`** viene eseguito una volta quando il giocatore entra nel gameplay. Creiamo e inizializziamo l'HUD qui.
- **`OnUpdate`** viene eseguito ogni frame. Passiamo `timeslice` all'HUD, che internamente limita a una volta al secondo. Controlliamo anche la pressione del tasto di toggle e la visibilità dei menù qui.
- **`OnMissionFinish`** viene eseguito quando il giocatore si disconnette o la missione finisce. Distruggiamo i nostri widget qui per prevenire perdite di memoria.

### Regola Critica: Pulisci Sempre

Se dimentichi di distruggere i tuoi widget in `OnMissionFinish`, il root del widget rimarrà nella sessione successiva. Dopo qualche cambio di server, il giocatore si ritroverà con widget fantasma impilati che consumano memoria. Associa sempre `Init()` con `Destroy()`.

---

## Step 4: Richiedere Dati dal Server

Il conteggio giocatori è noto solo al server. Abbiamo bisogno di un semplice RPC (Remote Procedure Call) andata e ritorno: il client invia una richiesta, il server legge i dati e li rimanda indietro.

### Step 4a: Definire l'ID RPC

Gli ID RPC devono essere unici tra tutti i mod. Definiamo il nostro nel layer `3_Game` così sia il codice client che server possono riferirlo.

### `Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// ID RPC per il Server Info HUD.
// Uso di numeri alti per evitare conflitti con vanilla e altri mod.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

**Perché `3_Game`?** Le costanti e gli enum appartengono al layer più basso a cui sia il client che il server possono accedere. Il layer `3_Game` si carica prima di `4_World` e `5_Mission`, quindi entrambi i lati possono vedere questi valori.

### Step 4b: Gestore Lato Server

Il server ascolta `SIH_RPC_REQUEST_INFO`, raccoglie i dati e risponde con `SIH_RPC_RESPONSE_INFO`.

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

        // Raccogliere informazioni del server
        string serverName = "";
        GetGame().GetHostName(serverName);

        int playerCount = 0;
        int maxPlayers = 0;

        // Ottenere la lista giocatori
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        playerCount = players.Count();

        // Massimo giocatori dalla configurazione del server
        maxPlayers = GetGame().GetMaxPlayers();

        // Inviare la risposta al client richiedente
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### Step 4c: Ricevitore RPC Lato Client

Il client riceve la risposta e aggiorna l'HUD.

Aggiungi questo allo stesso file `ServerInfoHUD.c` (in fondo, fuori dalla classe), oppure crea un file separato in `5_Mission/ServerInfoHUD/`:

Aggiungi quanto segue **sotto** la classe `ServerInfoHUD` in `ServerInfoHUD.c`:

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

        // Accedere all'HUD tramite MissionGameplay
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

### Come Funziona il Flusso RPC

```
CLIENT                           SERVER
  |                                |
  |--- SIH_RPC_REQUEST_INFO ----->|
  |                                | legge serverName, playerCount, maxPlayers
  |<-- SIH_RPC_RESPONSE_INFO ----|
  |                                |
  | aggiorna il testo dell'HUD   |
```

Il client invia la richiesta una volta al secondo (limitata dal timer di aggiornamento). Il server risponde con tre valori impacchettati nel contesto RPC. Il client li legge nello stesso ordine in cui sono stati scritti.

**Importante:** `rpc.Write()` e `ctx.Read()` devono usare gli stessi tipi nello stesso ordine. Se il server scrive una `string` e poi due valori `int`, il client deve leggere una `string` e poi due valori `int`.

---

## Step 5: Aggiungere il Toggle con Tasto

### Step 5a: Definire l'Input in `inputs.xml`

DayZ usa `inputs.xml` per registrare azioni personalizzate dei tasti. Il file deve essere posizionato in `Scripts/data/inputs.xml` e referenziato da `config.cpp`.

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

| Elemento | Scopo |
|----------|-------|
| `<actions>` | Dichiara l'azione di input per nome. `loc` è la stringa di visualizzazione mostrata nel menù delle opzioni di binding dei tasti. |
| `<preset>` | Assegna il tasto predefinito. `kF7` corrisponde al tasto F7. |

### Step 5b: Referenziare `inputs.xml` in `config.cpp`

Il tuo `config.cpp` deve dire al motore dove trovare il file degli input. Aggiungi una voce `inputs` dentro il blocco `defs`:

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

### Step 5c: Leggere la Pressione del Tasto

Gestiamo già questo nell'hook `MissionGameplay` dallo Step 3:

```c
if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
{
    m_ServerInfoHUD.ToggleVisibility();
}
```

`GetUApi()` restituisce il singleton dell'API di input. `GetInputByName` cerca la nostra azione registrata. `LocalPress()` restituisce `true` per esattamente un frame quando il tasto viene premuto.

### Riferimento Nomi Tasti

Nomi dei tasti comuni per `<btn>`:

| Nome Tasto | Tasto |
|------------|-------|
| `kF1` fino a `kF12` | Tasti funzione |
| `kH`, `kI`, ecc. | Tasti lettera |
| `kNumpad0` fino a `kNumpad9` | Tastierino numerico |
| `kLControl` | Control sinistro |
| `kLShift` | Shift sinistro |
| `kLAlt` | Alt sinistro |

Le combinazioni con modificatori usano l'annidamento:

```xml
<input name="UAServerInfoToggle">
    <btn name="kLControl">
        <btn name="kH" />
    </btn>
</input>
```

Questo significa "tieni premuto Control sinistro e premi H."

---

## Step 6: Rifinitura

### 6a: Animazione di Dissolvenza In/Out

DayZ fornisce `WidgetFadeTimer` per transizioni fluide dell'alfa. Aggiorna la classe `ServerInfoHUD` per usarlo:

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    // ... campi esistenti ...

    protected ref WidgetFadeTimer m_FadeTimer;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    // Sostituisci il metodo ToggleVisibility:
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

    // ... resto della classe ...
};
```

`FadeIn(widget, duration)` anima l'alfa del widget da 0 a 1 per la durata specificata in secondi. `FadeOut` va da 1 a 0 e nasconde il widget quando termina.

### 6b: Pannello di Sfondo con Alfa

Lo abbiamo già impostato nel layout (`color="0 0 0 0.55"`), dando un overlay scuro al 55% di opacità. Se vuoi regolare l'alfa a runtime:

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

La funzione `ARGB()` accetta valori interi da 0 a 255 per alfa, rosso, verde e blu.

### 6c: Scelte di Font e Colore

DayZ include diversi font che puoi referenziare nei layout:

| Percorso Font | Stile |
|---------------|-------|
| `gui/fonts/MetronBook` | Sans-serif pulito (usato nell'HUD vanilla) |
| `gui/fonts/MetronMedium` | Versione più grassetta di MetronBook |
| `gui/fonts/Metron` | Variante più sottile |
| `gui/fonts/luxuriousscript` | Script decorativo (evitare per l'HUD) |

Per cambiare il colore del testo a runtime:

```c
void SetTextColor(TextWidget widget, int r, int g, int b, int a)
{
    if (widget)
        widget.SetColor(ARGB(a, r, g, b));
}
```

### 6d: Rispettare le Altre UI

Il nostro `MissionHook.c` già rileva quando un menù è aperto e chiama `SetMenuState(true)`. Ecco un approccio più accurato che controlla specificatamente l'inventario:

```c
// Nell'override OnUpdate della modded MissionGameplay:
bool menuOpen = false;

UIManager uiMgr = GetGame().GetUIManager();
if (uiMgr)
{
    UIScriptedMenu topMenu = uiMgr.GetMenu();
    if (topMenu)
        menuOpen = true;
}

// Controllare anche se l'inventario è aperto
if (uiMgr && uiMgr.FindMenu(MENU_INVENTORY))
    menuOpen = true;

m_ServerInfoHUD.SetMenuState(menuOpen);
```

Questo assicura che il tuo HUD si nasconda dietro la schermata dell'inventario, il menù di pausa, la schermata delle opzioni e qualsiasi altro menù scriptato.

---

## Riferimento Codice Completo

Di seguito ogni file nel mod, nella sua forma finale con tutte le rifiniture applicate.

### File 1: `ServerInfoHUD/mod.cpp`

```cpp
name = "Server Info HUD";
author = "YourName";
version = "1.0";
overview = "Displays server name, player count, and in-game time.";
```

### File 2: `ServerInfoHUD/Scripts/config.cpp`

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

### File 3: `ServerInfoHUD/Scripts/data/inputs.xml`

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

### File 4: `ServerInfoHUD/Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// ID RPC per il Server Info HUD.
// Usa numeri alti per evitare conflitti con gli ERPC vanilla e altri mod.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

### File 5: `ServerInfoHUD/Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

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

        // Solo il server gestisce questo RPC
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

        // Ottenere il nome del server
        string serverName = "";
        GetGame().GetHostName(serverName);

        // Contare i giocatori
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        int playerCount = players.Count();

        // Ottenere gli slot giocatori massimi
        int maxPlayers = GetGame().GetMaxPlayers();

        // Inviare i dati al client richiedente
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### File 6: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

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
            Print("[ServerInfoHUD] ERRORE: Impossibile caricare il layout.");
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
// Ricevitore RPC lato client
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

### File 7: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

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

        // Rilevare menù aperti
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

        // Tasto di toggle
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

### File 8: `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout`

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

## Estendere l'HUD

Una volta che l'HUD di base funziona, ecco le estensioni naturali.

### Aggiungere la Visualizzazione degli FPS

Gli FPS possono essere letti lato client senza alcun RPC:

```c
// Aggiungi un campo TextWidget m_FPSText e trovalo in Init()

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    float fps = 1.0 / GetGame().GetDeltaT();
    m_FPSText.SetText("FPS: " + Math.Round(fps).ToString());
}
```

Chiama `RefreshFPS()` insieme a `RefreshTime()` nel metodo di aggiornamento. Nota che `GetDeltaT()` restituisce il tempo del frame corrente, quindi il valore degli FPS oscillerà. Per una visualizzazione più fluida, calcola la media su diversi frame:

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

    // Resetta ogni secondo (quando il timer principale scatta)
    m_FPSAccum = 0;
    m_FPSFrames = 0;
}
```

### Aggiungere la Posizione del Giocatore

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

### Pannelli HUD Multipli

Per pannelli multipli (bussola, stato, minimappa), crea una classe manager genitore che contiene un array di elementi HUD:

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

### Elementi HUD Trascinabili

Rendere un widget trascinabile richiede la gestione degli eventi del mouse tramite `ScriptedWidgetEventHandler`:

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

Nota: affinché il trascinamento funzioni, il widget deve avere `SetHandler(this)` chiamato su di esso così l'event handler riceve gli eventi. Inoltre, il cursore deve essere visibile, il che limita gli HUD trascinabili a situazioni in cui un menù o una modalità di modifica è attiva.

---

## Errori Comuni

### 1. Aggiornamento ad Ogni Frame Invece che Limitato

**Sbagliato:**

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);
    m_ServerInfoHUD.RefreshTime();      // Eseguito 60+ volte al secondo!
    m_ServerInfoHUD.RequestServerInfo(); // Invia 60+ RPC al secondo!
}
```

**Corretto:** Usa un accumulatore di tempo (come mostrato nel tutorial) così le operazioni costose vengono eseguite al massimo una volta al secondo. Il testo dell'HUD che cambia ogni frame (come un contatore FPS) va bene aggiornare per-frame, ma le richieste RPC devono essere limitate.

### 2. Non Pulire in OnMissionFinish

**Sbagliato:**

```c
modded class MissionGameplay
{
    ref ServerInfoHUD m_HUD;

    override void OnInit()
    {
        super.OnInit();
        m_HUD = new ServerInfoHUD();
        m_HUD.Init();
        // Nessuna pulizia da nessuna parte -- il widget perde memoria alla disconnessione!
    }
};
```

**Corretto:** Distruggi sempre i widget e annulla i riferimenti in `OnMissionFinish()`. Il distruttore (`~ServerInfoHUD`) è una rete di sicurezza, ma non fare affidamento su di esso -- `OnMissionFinish` è il posto corretto per la pulizia esplicita.

### 3. HUD Dietro Altri Elementi UI

I widget creati successivamente vengono renderizzati sopra i widget creati prima. Se il tuo HUD appare dietro la UI vanilla, è stato creato troppo presto. Soluzioni:

- Crea l'HUD più tardi nella sequenza di inizializzazione (ad esempio, alla prima chiamata `OnUpdate` piuttosto che in `OnInit`).
- Usa `m_Root.SetSort(100)` per forzare un ordine di ordinamento più alto, spingendo il tuo widget sopra gli altri.

### 4. Richiedere Dati Troppo Frequentemente (Spam RPC)

Inviare un RPC ogni frame crea 60+ pacchetti di rete al secondo per giocatore connesso. Su un server da 60 giocatori, sono 3.600 pacchetti al secondo di traffico non necessario. Limita sempre le richieste RPC. Una volta al secondo è ragionevole per informazioni non critiche. Per dati che cambiano raramente (come il nome del server), potresti richiederli solo una volta all'init e salvarli in cache.

### 5. Dimenticare la Chiamata `super`

```c
// SBAGLIATO: rompe la funzionalità dell'HUD vanilla
override void OnInit()
{
    m_HUD = new ServerInfoHUD();
    m_HUD.Init();
    // Manca super.OnInit()! L'HUD vanilla non si inizializzerà.
}
```

Chiama sempre `super.OnInit()` (e `super.OnUpdate()`, `super.OnMissionFinish()`) per primo. Omettere la chiamata super rompe l'implementazione vanilla e ogni altro mod che aggancia lo stesso metodo.

### 6. Usare il Layer di Script Sbagliato

Se provi a referenziare `MissionGameplay` da `4_World`, otterrai un errore "Undefined type" perché i tipi di `5_Mission` non sono visibili a `4_World`. Le costanti RPC vanno in `3_Game`, il gestore server va in `4_World` (moddando `PlayerBase` che risiede lì), e la classe HUD e l'hook alla missione vanno in `5_Mission`.

### 7. Percorso Layout Hardcoded

Il percorso del layout in `CreateWidgets()` è relativo ai percorsi di ricerca del gioco. Se il prefisso del PBO non corrisponde alla stringa del percorso, il layout non verrà caricato e `CreateWidgets` restituirà NULL. Controlla sempre per NULL dopo `CreateWidgets` e registra un errore se fallisce.

---

## Prossimi Passi

Ora che hai un overlay HUD funzionante, considera queste progressioni:

1. **Salvare le preferenze utente** -- Memorizza se l'HUD è visibile in un file JSON locale così lo stato del toggle persiste tra le sessioni.
2. **Aggiungere configurazione lato server** -- Permetti agli admin del server di abilitare/disabilitare l'HUD o scegliere quali campi mostrare tramite un file di configurazione JSON.
3. **Costruire un overlay admin** -- Espandi l'HUD per mostrare informazioni riservate agli admin (prestazioni del server, conteggio entità, timer di riavvio) usando controlli di permessi.
4. **Creare un HUD bussola** -- Usa `GetGame().GetCurrentCameraDirection()` per calcolare la direzione e mostrare una barra bussola nella parte superiore dello schermo.
5. **Studiare i mod esistenti** -- Guarda l'HUD missioni di DayZ Expansion e il sistema overlay di Colorful UI per implementazioni HUD di qualità produzione.

---

## Buone Pratiche

- **Limita `OnUpdate` a intervalli minimi di 1 secondo.** Usa un accumulatore di tempo per evitare di eseguire operazioni costose (richieste RPC, formattazione testo) 60+ volte al secondo. Solo gli elementi visivi per-frame come i contatori FPS dovrebbero aggiornarsi ogni frame.
- **Nascondi l'HUD quando l'inventario o qualsiasi menù è aperto.** Controlla `GetGame().GetUIManager().GetMenu()` ad ogni aggiornamento e sopprimi il tuo overlay. Elementi UI sovrapposti confondono i giocatori e bloccano l'interazione.
- **Pulisci sempre i widget in `OnMissionFinish`.** I root dei widget non distrutti persistono tra i cambi di server, accumulando pannelli fantasma che consumano memoria e alla fine causano glitch visivi.
- **Usa `SetSort()` per controllare l'ordine di rendering.** Se il tuo HUD appare dietro gli elementi vanilla, chiama `m_Root.SetSort(100)` per spingerlo sopra. Senza un ordine di ordinamento esplicito, la tempistica di creazione determina la stratificazione.
- **Salva in cache i dati del server che cambiano raramente.** Il nome del server non cambia durante una sessione. Richiedilo una volta all'init e salvalo localmente in cache invece di ri-richiederlo ogni secondo.

---

## Teoria vs Pratica

| Concetto | Teoria | Realtà |
|----------|--------|--------|
| `OnUpdate(float timeslice)` | Chiamato una volta per frame con il delta time del frame | Su un client a 144 FPS, questo scatta 144 volte al secondo. Inviare un RPC ad ogni chiamata crea 144 pacchetti di rete/secondo per giocatore. Accumula sempre `timeslice` e agisci solo quando la somma supera il tuo intervallo. |
| Percorso layout di `CreateWidgets()` | Carica il layout dal percorso fornito | Il percorso è relativo al prefisso del PBO, non al file system. Se il prefisso del PBO non corrisponde alla stringa del percorso, `CreateWidgets` restituisce silenziosamente NULL senza errori nel log. |
| `WidgetFadeTimer` | Anima fluidamente l'opacità del widget | `FadeOut` nasconde il widget dopo il completamento dell'animazione, ma `FadeIn` NON chiama `Show(true)` prima. Devi mostrare manualmente il widget prima di chiamare `FadeIn`, o non appare nulla. |
| `GetUApi().GetInputByName()` | Restituisce l'azione di input per il tuo keybind personalizzato | Se `inputs.xml` non è referenziato in `config.cpp` sotto `class inputs`, il nome dell'azione è sconosciuto e `GetInputByName` restituisce null, causando un crash su `.LocalPress()`. |

---

## Cosa Hai Imparato

In questo tutorial hai imparato:
- Come creare un layout HUD con pannelli ancorati e semi-trasparenti
- Come costruire una classe controller che limita gli aggiornamenti a un intervallo fisso
- Come agganciarsi a `MissionGameplay` per la gestione del ciclo di vita dell'HUD (init, aggiornamento, pulizia)
- Come richiedere dati dal server tramite RPC e visualizzarli sul client
- Come registrare un keybind personalizzato tramite `inputs.xml` e alternare la visibilità dell'HUD con animazioni di dissolvenza

---

**Precedente:** [Capitolo 8.7: Pubblicazione sullo Steam Workshop](07-publishing-workshop.md)
