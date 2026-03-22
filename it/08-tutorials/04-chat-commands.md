# Capitolo 8.4: Aggiungere Comandi Chat

[Home](../README.md) | [<< Precedente: Costruire un Pannello Admin](03-admin-panel.md) | **Aggiungere Comandi Chat** | [Successivo: Usare il Template Mod DayZ >>](05-mod-template.md)

---

> **Riepilogo:** Questo tutorial ti guida nella creazione di un sistema di comandi chat per DayZ. Aggancerai l'input della chat, analizzerai i prefissi dei comandi e gli argomenti, controllerai i permessi admin, eseguirai un'azione lato server e invierai un feedback al giocatore. Alla fine, avrai un comando `/heal` funzionante che cura completamente il personaggio dell'admin, insieme a un framework per aggiungere altri comandi.

---

## Indice dei Contenuti

- [Cosa Stiamo Costruendo](#cosa-stiamo-costruendo)
- [Prerequisiti](#prerequisiti)
- [Panoramica dell'Architettura](#panoramica-dellarchitettura)
- [Step 1: Agganciarsi all'Input Chat](#step-1-agganciarsi-allinput-chat)
- [Step 2: Analizzare Prefisso e Argomenti del Comando](#step-2-analizzare-prefisso-e-argomenti-del-comando)
- [Step 3: Controllare i Permessi Admin](#step-3-controllare-i-permessi-admin)
- [Step 4: Eseguire l'Azione Lato Server](#step-4-eseguire-lazione-lato-server)
- [Step 5: Inviare Feedback all'Admin](#step-5-inviare-feedback-alladmin)
- [Step 6: Registrare i Comandi](#step-6-registrare-i-comandi)
- [Step 7: Aggiungere alla Lista Comandi del Pannello Admin](#step-7-aggiungere-alla-lista-comandi-del-pannello-admin)
- [Codice Completo Funzionante: Comando /heal](#codice-completo-funzionante-comando-heal)
- [Aggiungere Più Comandi](#aggiungere-più-comandi)
- [Risoluzione dei Problemi](#risoluzione-dei-problemi)
- [Prossimi Passi](#prossimi-passi)

---

## Cosa Stiamo Costruendo

Un sistema di comandi chat con:

- **`/heal`** -- Cura completamente il personaggio dell'admin (salute, sangue, shock, fame, sete)
- **`/heal NomeGiocatore`** -- Cura un giocatore specifico per nome
- Un framework riutilizzabile per aggiungere `/kill`, `/teleport`, `/time`, `/weather` e qualsiasi altro comando
- Controllo dei permessi admin affinché i giocatori normali non possano usare i comandi admin
- Esecuzione lato server con messaggi di feedback nella chat

---

## Prerequisiti

- Una struttura mod funzionante (completa prima il [Capitolo 8.1](01-first-mod.md))
- Comprensione del [pattern RPC client-server](03-admin-panel.md) dal Capitolo 8.3

### Struttura del Mod per Questo Tutorial

```
ChatCommands/
    mod.cpp
    Scripts/
        config.cpp
        3_Game/
            ChatCommands/
                CCmdRPC.c
                CCmdBase.c
                CCmdRegistry.c
        4_World/
            ChatCommands/
                CCmdServerHandler.c
                commands/
                    CCmdHeal.c
        5_Mission/
            ChatCommands/
                CCmdChatHook.c
```

---

## Panoramica dell'Architettura

I comandi chat seguono questo flusso:

```
CLIENT                                  SERVER
------                                  ------

1. L'admin scrive "/heal" nella chat
2. L'hook della chat intercetta il messaggio
   (impedisce che venga inviato come chat)
3. Il client invia il comando via RPC  ---->  4. Il server riceve l'RPC
                                                  Controlla i permessi admin
                                                  Cerca il gestore del comando
                                                  Esegue il comando
                                              5. Il server invia il feedback  ---->  CLIENT
                                                  (RPC messaggio chat)
                                                                               6. L'admin vede
                                                                                  il feedback nella chat
```

**Perché elaborare i comandi sul server?** Perché il server ha autorità sullo stato del gioco. Solo il server può curare in modo affidabile i giocatori, cambiare il meteo, teletrasportare i personaggi e modificare lo stato del mondo. Il ruolo del client è limitato a rilevare il comando e inoltrarlo.

---

## Step 1: Agganciarsi all'Input Chat

Dobbiamo intercettare i messaggi della chat prima che vengano inviati come chat normale. DayZ fornisce la classe `ChatInputMenu` per questo scopo.

### L'Approccio Hook della Chat

Modderemo la classe `MissionGameplay` per intercettare gli eventi di input della chat. Quando il giocatore invia un messaggio chat che inizia con `/`, lo intercettiamo, impediamo che venga inviato come chat normale e lo inviamo invece come RPC di comando al server.

### Crea `Scripts/5_Mission/ChatCommands/CCmdChatHook.c`

```c
modded class MissionGameplay
{
    // -------------------------------------------------------
    // Intercetta i messaggi chat che iniziano con /
    // -------------------------------------------------------
    override void OnEvent(EventType eventTypeId, Param params)
    {
        super.OnEvent(eventTypeId, params);

        // ChatMessageEventTypeID si attiva quando il giocatore invia un messaggio chat
        if (eventTypeId == ChatMessageEventTypeID)
        {
            Param3<int, string, string> chatParams;
            if (Class.CastTo(chatParams, params))
            {
                string message = chatParams.param3;

                // Controlla se inizia con /
                if (message.Length() > 0 && message.Substring(0, 1) == "/")
                {
                    // Questo è un comando -- invialo al server
                    SendChatCommand(message);
                }
            }
        }
    }

    // -------------------------------------------------------
    // Invia la stringa del comando al server via RPC
    // -------------------------------------------------------
    protected void SendChatCommand(string fullCommand)
    {
        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        Print("[ChatCommands] Invio comando al server: " + fullCommand);

        Param1<string> data = new Param1<string>(fullCommand);
        GetGame().RPCSingleParam(player, CCmdRPC.COMMAND_REQUEST, data, true);
    }

    // -------------------------------------------------------
    // Ricevi il feedback del comando dal server
    // -------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
        {
            Param2<string, string> data = new Param2<string, string>("", "");
            if (ctx.Read(data))
            {
                string prefix = data.param1;
                string message = data.param2;

                // Visualizza il feedback come messaggio di sistema nella chat
                GetGame().Chat(prefix + " " + message, "colorStatusChannel");

                Print("[ChatCommands] Feedback: " + prefix + " " + message);
            }
        }
    }
};
```

### Come Funziona l'Intercettazione della Chat

Il metodo `OnEvent` su `MissionGameplay` viene chiamato per vari eventi di gioco. Quando `eventTypeId` è `ChatMessageEventTypeID`, significa che il giocatore ha appena inviato un messaggio chat. Il `Param3` contiene:

- `param1` -- Canale (int): il canale della chat (globale, diretto, ecc.)
- `param2` -- Nome del mittente (string)
- `param3` -- Testo del messaggio (string)

Controlliamo se il messaggio inizia con `/`. Se sì, inoltriamo l'intera stringa al server via RPC. Il messaggio viene comunque inviato anche come chat normale -- in una mod di produzione, lo sopprimeresti (trattato nelle note alla fine).

---

## Step 2: Analizzare Prefisso e Argomenti del Comando

Lato server, dobbiamo scomporre una stringa di comando come `/heal NomeGiocatore` nelle sue parti: il nome del comando (`heal`) e gli argomenti (`["NomeGiocatore"]`).

### Crea `Scripts/3_Game/ChatCommands/CCmdRPC.c`

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST  = 79001;
    static const int COMMAND_FEEDBACK = 79002;
};
```

### Crea `Scripts/3_Game/ChatCommands/CCmdBase.c`

```c
// -------------------------------------------------------
// Classe base per tutti i comandi chat
// -------------------------------------------------------
class CCmdBase
{
    // Il nome del comando senza il prefisso / (es. "heal")
    string GetName()
    {
        return "";
    }

    // Breve descrizione mostrata nell'aiuto o nella lista comandi
    string GetDescription()
    {
        return "";
    }

    // Sintassi d'uso mostrata quando il comando viene usato in modo errato
    string GetUsage()
    {
        return "/" + GetName();
    }

    // Se questo comando richiede privilegi admin
    bool RequiresAdmin()
    {
        return true;
    }

    // Esegui il comando sul server
    // Restituisce true se riuscito, false se fallito
    bool Execute(PlayerIdentity caller, array<string> args)
    {
        return false;
    }

    // -------------------------------------------------------
    // Helper: Invia messaggio di feedback al chiamante del comando
    // -------------------------------------------------------
    protected void SendFeedback(PlayerIdentity caller, string prefix, string message)
    {
        if (!caller)
            return;

        // Trova l'oggetto giocatore del chiamante
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        Man callerPlayer = null;
        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == caller.GetId())
                {
                    callerPlayer = candidate;
                    break;
                }
            }
        }

        if (callerPlayer)
        {
            Param2<string, string> data = new Param2<string, string>(prefix, message);
            GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
        }
    }

    // -------------------------------------------------------
    // Helper: Trova un giocatore per corrispondenza parziale del nome
    // -------------------------------------------------------
    protected Man FindPlayerByName(string partialName)
    {
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        string searchLower = partialName;
        searchLower.ToLower();

        for (int i = 0; i < players.Count(); i++)
        {
            Man man = players.Get(i);
            if (man && man.GetIdentity())
            {
                string playerName = man.GetIdentity().GetName();
                string playerNameLower = playerName;
                playerNameLower.ToLower();

                if (playerNameLower.Contains(searchLower))
                    return man;
            }
        }

        return null;
    }
};
```

### Crea `Scripts/3_Game/ChatCommands/CCmdRegistry.c`

```c
// -------------------------------------------------------
// Registro che contiene tutti i comandi disponibili
// -------------------------------------------------------
class CCmdRegistry
{
    protected static ref map<string, ref CCmdBase> s_Commands;

    // -------------------------------------------------------
    // Inizializza il registro (chiamare una volta all'avvio)
    // -------------------------------------------------------
    static void Init()
    {
        if (!s_Commands)
            s_Commands = new map<string, ref CCmdBase>;
    }

    // -------------------------------------------------------
    // Registra un'istanza di comando
    // -------------------------------------------------------
    static void Register(CCmdBase command)
    {
        if (!s_Commands)
            Init();

        if (!command)
            return;

        string name = command.GetName();
        name.ToLower();

        if (s_Commands.Contains(name))
        {
            Print("[ChatCommands] ATTENZIONE: Comando '" + name + "' già registrato, sovrascrittura in corso.");
        }

        s_Commands.Set(name, command);
        Print("[ChatCommands] Comando registrato: /" + name);
    }

    // -------------------------------------------------------
    // Cerca un comando per nome
    // -------------------------------------------------------
    static CCmdBase GetCommand(string name)
    {
        if (!s_Commands)
            return null;

        string nameLower = name;
        nameLower.ToLower();

        CCmdBase cmd;
        if (s_Commands.Find(nameLower, cmd))
            return cmd;

        return null;
    }

    // -------------------------------------------------------
    // Ottieni tutti i nomi dei comandi registrati
    // -------------------------------------------------------
    static array<string> GetCommandNames()
    {
        ref array<string> names = new array<string>;

        if (s_Commands)
        {
            for (int i = 0; i < s_Commands.Count(); i++)
            {
                names.Insert(s_Commands.GetKey(i));
            }
        }

        return names;
    }

    // -------------------------------------------------------
    // Analizza una stringa di comando grezza in nome + argomenti
    // Esempio: "/heal NomeGiocatore" --> nome="heal", args=["NomeGiocatore"]
    // -------------------------------------------------------
    static void ParseCommand(string fullCommand, out string commandName, out array<string> args)
    {
        args = new array<string>;
        commandName = "";

        if (fullCommand.Length() == 0)
            return;

        // Rimuovi il / iniziale
        string raw = fullCommand;
        if (raw.Substring(0, 1) == "/")
            raw = raw.Substring(1, raw.Length() - 1);

        // Dividi per spazi
        raw.Split(" ", args);

        if (args.Count() > 0)
        {
            commandName = args.Get(0);
            commandName.ToLower();
            args.RemoveOrdered(0);
        }
    }
};
```

### Spiegazione della Logica di Analisi

Dato l'input `/heal UnGiocatore`, `ParseCommand` esegue:

1. Rimuove il `/` iniziale per ottenere `"heal UnGiocatore"`
2. Divide per spazi per ottenere `["heal", "UnGiocatore"]`
3. Prende il primo elemento come nome del comando: `"heal"`
4. Lo rimuove dall'array, lasciando gli argomenti: `["UnGiocatore"]`

Il nome del comando viene convertito in minuscolo così `/Heal`, `/HEAL` e `/heal` funzionano tutti.

---

## Step 3: Controllare i Permessi Admin

Il controllo dei permessi admin impedisce ai giocatori normali di eseguire comandi admin. DayZ non ha un sistema di permessi admin integrato negli script, quindi controlliamo confrontando con una semplice lista admin.

### Il Controllo Admin nel Gestore del Server

L'approccio più semplice è controllare lo Steam64 ID del giocatore confrontandolo con una lista di ID admin conosciuti. In una mod di produzione, caricheresti questa lista da un file di configurazione.

```c
// Semplice controllo admin -- in produzione, carica da un file di configurazione JSON
static bool IsAdmin(PlayerIdentity identity)
{
    if (!identity)
        return false;

    // Controlla l'ID piano del giocatore (Steam64 ID)
    string playerId = identity.GetPlainId();

    // Lista admin codificata -- sostituisci con il caricamento da file config in produzione
    ref array<string> adminIds = new array<string>;
    adminIds.Insert("76561198000000001");    // Sostituisci con Steam64 ID reali
    adminIds.Insert("76561198000000002");

    return (adminIds.Find(playerId) != -1);
}
```

### Dove Trovare gli Steam64 ID

- Apri il tuo profilo Steam in un browser
- L'URL contiene il tuo Steam64 ID: `https://steamcommunity.com/profiles/76561198XXXXXXXXX`
- Oppure usa uno strumento come https://steamid.io per cercare qualsiasi giocatore

### Permessi di Livello Produzione

In una mod reale, dovresti:

1. Memorizzare gli ID admin in un file JSON (`$profile:ChatCommands/admins.json`)
2. Caricare il file all'avvio del server
3. Supportare livelli di permessi (moderatore, admin, superadmin)
4. Usare un framework come il sistema `MyPermissions` di MyMod Core per permessi gerarchici

---

## Step 4: Eseguire l'Azione Lato Server

Ora creiamo il comando `/heal` effettivo e il gestore del server che elabora gli RPC dei comandi in arrivo.

### Crea `Scripts/4_World/ChatCommands/commands/CCmdHeal.c`

```c
class CCmdHeal extends CCmdBase
{
    override string GetName()
    {
        return "heal";
    }

    override string GetDescription()
    {
        return "Cura completamente un giocatore (salute, sangue, shock, fame, sete)";
    }

    override string GetUsage()
    {
        return "/heal [NomeGiocatore]";
    }

    override bool RequiresAdmin()
    {
        return true;
    }

    // -------------------------------------------------------
    // Esegui il comando di cura
    // /heal         --> cura il chiamante
    // /heal Nome    --> cura il giocatore nominato
    // -------------------------------------------------------
    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (!caller)
            return false;

        Man targetMan = null;
        string targetName = "";

        // Determina il giocatore bersaglio
        if (args.Count() > 0)
        {
            // Cura un giocatore specifico per nome
            string searchName = args.Get(0);
            targetMan = FindPlayerByName(searchName);

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Giocatore '" + searchName + "' non trovato.");
                return false;
            }

            targetName = targetMan.GetIdentity().GetName();
        }
        else
        {
            // Cura il chiamante stesso
            ref array<Man> allPlayers = new array<Man>;
            GetGame().GetPlayers(allPlayers);

            for (int i = 0; i < allPlayers.Count(); i++)
            {
                Man candidate = allPlayers.Get(i);
                if (candidate && candidate.GetIdentity())
                {
                    if (candidate.GetIdentity().GetId() == caller.GetId())
                    {
                        targetMan = candidate;
                        break;
                    }
                }
            }

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Impossibile trovare il tuo oggetto giocatore.");
                return false;
            }

            targetName = "te stesso";
        }

        // Esegui la cura
        PlayerBase targetPlayer;
        if (!Class.CastTo(targetPlayer, targetMan))
        {
            SendFeedback(caller, "[Heal]", "Il bersaglio non è un giocatore valido.");
            return false;
        }

        HealPlayer(targetPlayer);

        // Logga e invia feedback
        Print("[ChatCommands] " + caller.GetName() + " ha curato " + targetName);
        SendFeedback(caller, "[Heal]", "Curato con successo " + targetName + ".");

        return true;
    }

    // -------------------------------------------------------
    // Applica la cura completa a un giocatore
    // -------------------------------------------------------
    protected void HealPlayer(PlayerBase player)
    {
        if (!player)
            return;

        // Ripristina la salute al massimo
        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));

        // Ripristina il sangue al massimo
        player.SetHealth("GlobalHealth", "Blood", player.GetMaxHealth("GlobalHealth", "Blood"));

        // Rimuovi il danno da shock
        player.SetHealth("GlobalHealth", "Shock", player.GetMaxHealth("GlobalHealth", "Shock"));

        // Imposta la fame al pieno (valore di energia)
        // PlayerBase ha un sistema di statistiche -- imposta la statistica energia
        player.GetStatEnergy().Set(player.GetStatEnergy().GetMax());

        // Imposta la sete al pieno (valore di acqua)
        player.GetStatWater().Set(player.GetStatWater().GetMax());

        // Rimuovi tutte le fonti di sanguinamento
        player.GetBleedingManagerServer().RemoveAllSources();

        Print("[ChatCommands] Giocatore curato: " + player.GetIdentity().GetName());
    }
};
```

### Perché 4_World?

Il comando heal fa riferimento a `PlayerBase`, che è definito nel layer `4_World`. Usa anche metodi delle statistiche del giocatore (`GetStatEnergy`, `GetStatWater`, `GetBleedingManagerServer`) che sono disponibili solo sulle entità del mondo. Il comando **deve** risiedere in `4_World` o superiore.

La classe base `CCmdBase` risiede in `3_Game` perché non fa riferimento ad alcun tipo del mondo. Le classi concrete dei comandi che toccano entità del mondo risiedono in `4_World`.

---

## Step 5: Inviare Feedback all'Admin

Il feedback è gestito dal metodo `SendFeedback()` in `CCmdBase`. Tracciamo il percorso completo del feedback:

### Il Server Invia il Feedback

```c
// All'interno di CCmdBase.SendFeedback()
Param2<string, string> data = new Param2<string, string>(prefix, message);
GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
```

Il server invia un RPC `COMMAND_FEEDBACK` al client specifico che ha emesso il comando. I dati contengono un prefisso (come `"[Heal]"`) e il testo del messaggio.

### Il Client Riceve e Visualizza il Feedback

Di ritorno in `CCmdChatHook.c` (Step 1), il gestore `OnRPC` cattura questo:

```c
if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
{
    // Deserializza il messaggio
    Param2<string, string> data = new Param2<string, string>("", "");
    if (ctx.Read(data))
    {
        string prefix = data.param1;
        string message = data.param2;

        // Visualizza nella finestra della chat
        GetGame().Chat(prefix + " " + message, "colorStatusChannel");
    }
}
```

`GetGame().Chat()` visualizza un messaggio nella finestra chat del giocatore. Il secondo parametro è il canale colore:

| Canale | Colore | Uso Tipico |
|--------|--------|------------|
| `"colorStatusChannel"` | Giallo/arancione | Messaggi di sistema |
| `"colorAction"` | Bianco | Feedback azioni |
| `"colorFriendly"` | Verde | Feedback positivo |
| `"colorImportant"` | Rosso | Avvisi/errori |

---

## Step 6: Registrare i Comandi

Il gestore del server riceve gli RPC dei comandi, cerca il comando nel registro e lo esegue.

### Crea `Scripts/4_World/ChatCommands/CCmdServerHandler.c`

```c
modded class MissionServer
{
    // -------------------------------------------------------
    // Registra tutti i comandi quando il server si avvia
    // -------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        CCmdRegistry.Init();

        // Registra tutti i comandi qui
        CCmdRegistry.Register(new CCmdHeal());

        // Aggiungi altri comandi:
        // CCmdRegistry.Register(new CCmdKill());
        // CCmdRegistry.Register(new CCmdTeleport());
        // CCmdRegistry.Register(new CCmdTime());

        Print("[ChatCommands] Server inizializzato. Comandi registrati.");
    }
};

// -------------------------------------------------------
// Gestore RPC lato server per i comandi in arrivo
// -------------------------------------------------------
modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == CCmdRPC.COMMAND_REQUEST)
        {
            HandleCommandRPC(sender, ctx);
        }
    }

    protected void HandleCommandRPC(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender)
            return;

        // Leggi la stringa del comando
        Param1<string> data = new Param1<string>("");
        if (!ctx.Read(data))
        {
            Print("[ChatCommands] ERRORE: Lettura dati RPC del comando fallita.");
            return;
        }

        string fullCommand = data.param1;
        Print("[ChatCommands] Comando ricevuto da " + sender.GetName() + ": " + fullCommand);

        // Analizza il comando
        string commandName;
        ref array<string> args;
        CCmdRegistry.ParseCommand(fullCommand, commandName, args);

        if (commandName == "")
            return;

        // Cerca il comando
        CCmdBase command = CCmdRegistry.GetCommand(commandName);
        if (!command)
        {
            SendCommandFeedback(sender, "[Errore]", "Comando sconosciuto: /" + commandName);
            return;
        }

        // Controlla i permessi admin
        if (command.RequiresAdmin() && !IsCommandAdmin(sender))
        {
            Print("[ChatCommands] Non-admin " + sender.GetName() + " ha tentato di usare /" + commandName);
            SendCommandFeedback(sender, "[Errore]", "Non hai il permesso di usare questo comando.");
            return;
        }

        // Esegui il comando
        bool success = command.Execute(sender, args);

        if (success)
            Print("[ChatCommands] Comando /" + commandName + " eseguito con successo da " + sender.GetName());
        else
            Print("[ChatCommands] Comando /" + commandName + " fallito per " + sender.GetName());
    }

    // -------------------------------------------------------
    // Controlla se un giocatore è admin
    // -------------------------------------------------------
    protected bool IsCommandAdmin(PlayerIdentity identity)
    {
        if (!identity)
            return false;

        string playerId = identity.GetPlainId();

        // ----------------------------------------------------------
        // IMPORTANTE: Sostituisci questi con i tuoi Steam64 ID admin reali
        // In produzione, carica da un file di configurazione JSON
        // ----------------------------------------------------------
        ref array<string> adminIds = new array<string>;
        adminIds.Insert("76561198000000001");
        adminIds.Insert("76561198000000002");

        return (adminIds.Find(playerId) != -1);
    }

    // -------------------------------------------------------
    // Invia feedback a un giocatore specifico
    // -------------------------------------------------------
    protected void SendCommandFeedback(PlayerIdentity target, string prefix, string message)
    {
        if (!target)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == target.GetId())
                {
                    Param2<string, string> data = new Param2<string, string>(prefix, message);
                    GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_FEEDBACK, data, true, target);
                    return;
                }
            }
        }
    }
};
```

### Il Pattern di Registrazione

I comandi vengono registrati in `MissionServer.OnInit()`:

```c
CCmdRegistry.Init();
CCmdRegistry.Register(new CCmdHeal());
```

Ogni chiamata `Register()` crea un'istanza della classe comando e la memorizza in una mappa indicizzata dal nome del comando. Quando arriva un RPC di comando, il gestore cerca il nome nel registro e chiama `Execute()` sull'oggetto comando corrispondente.

Questo pattern rende banale aggiungere nuovi comandi -- crea una nuova classe che estende `CCmdBase`, implementa `Execute()` e aggiungi una riga `Register()`.

---

## Step 7: Aggiungere alla Lista Comandi del Pannello Admin

Se hai un pannello admin (dal [Capitolo 8.3](03-admin-panel.md)), puoi visualizzare la lista dei comandi disponibili nella UI.

### Richiedere la Lista Comandi dal Server

Aggiungi un nuovo ID RPC in `CCmdRPC.c`:

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST   = 79001;
    static const int COMMAND_FEEDBACK  = 79002;
    static const int COMMAND_LIST_REQ  = 79003;
    static const int COMMAND_LIST_RESP = 79004;
};
```

### Lato Server: Inviare la Lista Comandi

Aggiungi questo gestore nel tuo codice lato server:

```c
// Nel gestore del server, aggiungi un caso per COMMAND_LIST_REQ
if (rpc_type == CCmdRPC.COMMAND_LIST_REQ)
{
    HandleCommandListRequest(sender);
}

protected void HandleCommandListRequest(PlayerIdentity requestor)
{
    if (!requestor)
        return;

    // Costruisci una stringa formattata di tutti i comandi
    array<string> names = CCmdRegistry.GetCommandNames();
    string commandList = "Comandi Disponibili:\n";

    for (int i = 0; i < names.Count(); i++)
    {
        CCmdBase cmd = CCmdRegistry.GetCommand(names.Get(i));
        if (cmd)
        {
            commandList = commandList + cmd.GetUsage() + " - " + cmd.GetDescription() + "\n";
        }
    }

    // Rinvia al client
    ref array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);

    for (int j = 0; j < players.Count(); j++)
    {
        Man candidate = players.Get(j);
        if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == requestor.GetId())
        {
            Param1<string> data = new Param1<string>(commandList);
            GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_LIST_RESP, data, true, requestor);
            return;
        }
    }
}
```

### Lato Client: Visualizzare in un Pannello

Sul client, cattura la risposta e visualizzala in un widget di testo:

```c
if (rpc_type == CCmdRPC.COMMAND_LIST_RESP)
{
    Param1<string> data = new Param1<string>("");
    if (ctx.Read(data))
    {
        string commandList = data.param1;
        // Visualizza nel widget di testo del tuo pannello admin
        // m_CommandListText.SetText(commandList);
        Print("[ChatCommands] Lista comandi ricevuta:\n" + commandList);
    }
}
```

---

## Codice Completo Funzionante: Comando /heal

Ecco tutti i file necessari per il sistema completo funzionante. Crea questi file e la tua mod avrà un comando `/heal` funzionale.

### Configurazione config.cpp

```cpp
class CfgPatches
{
    class ChatCommands_Scripts
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
    class ChatCommands
    {
        dir = "ChatCommands";
        name = "Chat Commands";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/5_Mission" };
            };
        };
    };
};
```

### 3_Game/ChatCommands/CCmdRPC.c

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST  = 79001;
    static const int COMMAND_FEEDBACK = 79002;
};
```

### 3_Game/ChatCommands/CCmdBase.c

```c
class CCmdBase
{
    string GetName()
    {
        return "";
    }

    string GetDescription()
    {
        return "";
    }

    string GetUsage()
    {
        return "/" + GetName();
    }

    bool RequiresAdmin()
    {
        return true;
    }

    bool Execute(PlayerIdentity caller, array<string> args)
    {
        return false;
    }

    protected void SendFeedback(PlayerIdentity caller, string prefix, string message)
    {
        if (!caller)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        Man callerPlayer = null;
        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == caller.GetId())
                {
                    callerPlayer = candidate;
                    break;
                }
            }
        }

        if (callerPlayer)
        {
            Param2<string, string> data = new Param2<string, string>(prefix, message);
            GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
        }
    }

    protected Man FindPlayerByName(string partialName)
    {
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        string searchLower = partialName;
        searchLower.ToLower();

        for (int i = 0; i < players.Count(); i++)
        {
            Man man = players.Get(i);
            if (man && man.GetIdentity())
            {
                string playerName = man.GetIdentity().GetName();
                string playerNameLower = playerName;
                playerNameLower.ToLower();

                if (playerNameLower.Contains(searchLower))
                    return man;
            }
        }

        return null;
    }
};
```

### 3_Game/ChatCommands/CCmdRegistry.c

```c
class CCmdRegistry
{
    protected static ref map<string, ref CCmdBase> s_Commands;

    static void Init()
    {
        if (!s_Commands)
            s_Commands = new map<string, ref CCmdBase>;
    }

    static void Register(CCmdBase command)
    {
        if (!s_Commands)
            Init();

        if (!command)
            return;

        string name = command.GetName();
        name.ToLower();

        s_Commands.Set(name, command);
        Print("[ChatCommands] Comando registrato: /" + name);
    }

    static CCmdBase GetCommand(string name)
    {
        if (!s_Commands)
            return null;

        string nameLower = name;
        nameLower.ToLower();

        CCmdBase cmd;
        if (s_Commands.Find(nameLower, cmd))
            return cmd;

        return null;
    }

    static array<string> GetCommandNames()
    {
        ref array<string> names = new array<string>;

        if (s_Commands)
        {
            for (int i = 0; i < s_Commands.Count(); i++)
            {
                names.Insert(s_Commands.GetKey(i));
            }
        }

        return names;
    }

    static void ParseCommand(string fullCommand, out string commandName, out array<string> args)
    {
        args = new array<string>;
        commandName = "";

        if (fullCommand.Length() == 0)
            return;

        string raw = fullCommand;
        if (raw.Substring(0, 1) == "/")
            raw = raw.Substring(1, raw.Length() - 1);

        raw.Split(" ", args);

        if (args.Count() > 0)
        {
            commandName = args.Get(0);
            commandName.ToLower();
            args.RemoveOrdered(0);
        }
    }
};
```

### 4_World/ChatCommands/commands/CCmdHeal.c

```c
class CCmdHeal extends CCmdBase
{
    override string GetName()
    {
        return "heal";
    }

    override string GetDescription()
    {
        return "Cura completamente un giocatore (salute, sangue, shock, fame, sete)";
    }

    override string GetUsage()
    {
        return "/heal [NomeGiocatore]";
    }

    override bool RequiresAdmin()
    {
        return true;
    }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (!caller)
            return false;

        Man targetMan = null;
        string targetName = "";

        if (args.Count() > 0)
        {
            string searchName = args.Get(0);
            targetMan = FindPlayerByName(searchName);

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Giocatore '" + searchName + "' non trovato.");
                return false;
            }

            targetName = targetMan.GetIdentity().GetName();
        }
        else
        {
            ref array<Man> allPlayers = new array<Man>;
            GetGame().GetPlayers(allPlayers);

            for (int i = 0; i < allPlayers.Count(); i++)
            {
                Man candidate = allPlayers.Get(i);
                if (candidate && candidate.GetIdentity())
                {
                    if (candidate.GetIdentity().GetId() == caller.GetId())
                    {
                        targetMan = candidate;
                        break;
                    }
                }
            }

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Impossibile trovare il tuo oggetto giocatore.");
                return false;
            }

            targetName = "te stesso";
        }

        PlayerBase targetPlayer;
        if (!Class.CastTo(targetPlayer, targetMan))
        {
            SendFeedback(caller, "[Heal]", "Il bersaglio non è un giocatore valido.");
            return false;
        }

        HealPlayer(targetPlayer);

        Print("[ChatCommands] " + caller.GetName() + " ha curato " + targetName);
        SendFeedback(caller, "[Heal]", "Curato con successo " + targetName + ".");

        return true;
    }

    protected void HealPlayer(PlayerBase player)
    {
        if (!player)
            return;

        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));
        player.SetHealth("GlobalHealth", "Blood", player.GetMaxHealth("GlobalHealth", "Blood"));
        player.SetHealth("GlobalHealth", "Shock", player.GetMaxHealth("GlobalHealth", "Shock"));

        player.GetStatEnergy().Set(player.GetStatEnergy().GetMax());
        player.GetStatWater().Set(player.GetStatWater().GetMax());

        player.GetBleedingManagerServer().RemoveAllSources();
    }
};
```

### 4_World/ChatCommands/CCmdServerHandler.c

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();

        CCmdRegistry.Init();
        CCmdRegistry.Register(new CCmdHeal());

        Print("[ChatCommands] Server inizializzato. Comandi registrati.");
    }
};

modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == CCmdRPC.COMMAND_REQUEST)
        {
            HandleCommandRPC(sender, ctx);
        }
    }

    protected void HandleCommandRPC(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender)
            return;

        Param1<string> data = new Param1<string>("");
        if (!ctx.Read(data))
        {
            Print("[ChatCommands] ERRORE: Lettura dati RPC del comando fallita.");
            return;
        }

        string fullCommand = data.param1;
        Print("[ChatCommands] Comando ricevuto da " + sender.GetName() + ": " + fullCommand);

        string commandName;
        ref array<string> args;
        CCmdRegistry.ParseCommand(fullCommand, commandName, args);

        if (commandName == "")
            return;

        CCmdBase command = CCmdRegistry.GetCommand(commandName);
        if (!command)
        {
            SendCommandFeedback(sender, "[Errore]", "Comando sconosciuto: /" + commandName);
            return;
        }

        if (command.RequiresAdmin() && !IsCommandAdmin(sender))
        {
            Print("[ChatCommands] Non-admin " + sender.GetName() + " ha tentato di usare /" + commandName);
            SendCommandFeedback(sender, "[Errore]", "Non hai il permesso di usare questo comando.");
            return;
        }

        command.Execute(sender, args);
    }

    protected bool IsCommandAdmin(PlayerIdentity identity)
    {
        if (!identity)
            return false;

        string playerId = identity.GetPlainId();

        // SOSTITUISCI QUESTI CON I TUOI STEAM64 ID ADMIN REALI
        ref array<string> adminIds = new array<string>;
        adminIds.Insert("76561198000000001");
        adminIds.Insert("76561198000000002");

        return (adminIds.Find(playerId) != -1);
    }

    protected void SendCommandFeedback(PlayerIdentity target, string prefix, string message)
    {
        if (!target)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == target.GetId())
            {
                Param2<string, string> data = new Param2<string, string>(prefix, message);
                GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_FEEDBACK, data, true, target);
                return;
            }
        }
    }
};
```

### 5_Mission/ChatCommands/CCmdChatHook.c

```c
modded class MissionGameplay
{
    override void OnEvent(EventType eventTypeId, Param params)
    {
        super.OnEvent(eventTypeId, params);

        if (eventTypeId == ChatMessageEventTypeID)
        {
            Param3<int, string, string> chatParams;
            if (Class.CastTo(chatParams, params))
            {
                string message = chatParams.param3;

                if (message.Length() > 0 && message.Substring(0, 1) == "/")
                {
                    SendChatCommand(message);
                }
            }
        }
    }

    protected void SendChatCommand(string fullCommand)
    {
        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        Print("[ChatCommands] Invio comando al server: " + fullCommand);

        Param1<string> data = new Param1<string>(fullCommand);
        GetGame().RPCSingleParam(player, CCmdRPC.COMMAND_REQUEST, data, true);
    }

    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
        {
            Param2<string, string> data = new Param2<string, string>("", "");
            if (ctx.Read(data))
            {
                string prefix = data.param1;
                string message = data.param2;

                GetGame().Chat(prefix + " " + message, "colorStatusChannel");
                Print("[ChatCommands] Feedback: " + prefix + " " + message);
            }
        }
    }
};
```

---

## Aggiungere Più Comandi

Il pattern del registro rende semplice aggiungere nuovi comandi. Ecco degli esempi:

### Comando /kill

```c
class CCmdKill extends CCmdBase
{
    override string GetName()        { return "kill"; }
    override string GetDescription() { return "Uccide un giocatore"; }
    override string GetUsage()       { return "/kill [NomeGiocatore]"; }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        Man targetMan = null;

        if (args.Count() > 0)
            targetMan = FindPlayerByName(args.Get(0));
        else
        {
            ref array<Man> players = new array<Man>;
            GetGame().GetPlayers(players);
            for (int i = 0; i < players.Count(); i++)
            {
                if (players.Get(i).GetIdentity() && players.Get(i).GetIdentity().GetId() == caller.GetId())
                {
                    targetMan = players.Get(i);
                    break;
                }
            }
        }

        if (!targetMan)
        {
            SendFeedback(caller, "[Kill]", "Giocatore non trovato.");
            return false;
        }

        PlayerBase targetPlayer;
        if (Class.CastTo(targetPlayer, targetMan))
        {
            targetPlayer.SetHealth("GlobalHealth", "Health", 0);
            SendFeedback(caller, "[Kill]", "Ucciso " + targetMan.GetIdentity().GetName() + ".");
            return true;
        }

        return false;
    }
};
```

### Comando /time

```c
class CCmdTime extends CCmdBase
{
    override string GetName()        { return "time"; }
    override string GetDescription() { return "Imposta l'ora del server (0-23)"; }
    override string GetUsage()       { return "/time <ora>"; }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (args.Count() < 1)
        {
            SendFeedback(caller, "[Time]", "Uso: " + GetUsage());
            return false;
        }

        int hour = args.Get(0).ToInt();
        if (hour < 0 || hour > 23)
        {
            SendFeedback(caller, "[Time]", "L'ora deve essere tra 0 e 23.");
            return false;
        }

        GetGame().GetWorld().SetDate(2024, 6, 15, hour, 0);
        SendFeedback(caller, "[Time]", "Ora del server impostata a " + hour.ToString() + ":00.");
        return true;
    }
};
```

### Registrare Nuovi Comandi

Aggiungi una riga per comando in `MissionServer.OnInit()`:

```c
CCmdRegistry.Register(new CCmdHeal());
CCmdRegistry.Register(new CCmdKill());
CCmdRegistry.Register(new CCmdTime());
```

---

## Risoluzione dei Problemi

### Il Comando Non Viene Riconosciuto ("Comando sconosciuto")

- **Registrazione mancante:** Assicurati che `CCmdRegistry.Register(new CCmdTuoComando())` venga chiamato in `MissionServer.OnInit()`.
- **Errore di battitura in GetName():** La stringa restituita da `GetName()` deve corrispondere a ciò che il giocatore digita (senza il `/`).
- **Mancata corrispondenza maiuscole/minuscole:** Il registro converte i nomi in minuscolo. `/Heal`, `/HEAL` e `/heal` dovrebbero funzionare tutti.

### Permesso Negato per gli Admin

- **Steam64 ID errato:** Ricontrolla gli ID admin in `IsCommandAdmin()`. Devono essere Steam64 ID esatti (numeri di 17 cifre che iniziano con `7656`).
- **GetPlainId() vs GetId():** `GetPlainId()` restituisce lo Steam64 ID. `GetId()` restituisce l'ID di sessione DayZ. Usa `GetPlainId()` per i controlli admin.

### Il Messaggio di Feedback Non Appare nella Chat

- **L'RPC non raggiunge il client:** Aggiungi istruzioni `Print()` sul server per confermare che l'RPC di feedback viene inviato.
- **OnRPC del client non lo cattura:** Verifica che l'ID RPC corrisponda (`CCmdRPC.COMMAND_FEEDBACK`).
- **GetGame().Chat() non funziona:** Questa funzione richiede che il gioco sia in uno stato dove la chat è disponibile. Potrebbe non funzionare nella schermata di caricamento.

### /heal Non Cura Effettivamente

- **Esecuzione solo sul server:** `SetHealth()` e le modifiche alle statistiche devono essere eseguite sul server. Verifica che `GetGame().IsServer()` sia true quando `Execute()` viene eseguito.
- **Il cast a PlayerBase fallisce:** Se `Class.CastTo(targetPlayer, targetMan)` restituisce false, il bersaglio non è un PlayerBase valido. Questo può succedere con AI o entità non-giocatore.
- **I getter delle statistiche restituiscono null:** `GetStatEnergy()` e `GetStatWater()` possono restituire null se il giocatore è morto o non completamente inizializzato. Aggiungi controlli null nel codice di produzione.

### Il Comando Appare nella Chat Come Messaggio Normale

- L'hook `OnEvent` intercetta il messaggio ma non lo sopprime dall'essere inviato come chat. Per sopprimerlo in una mod di produzione, dovresti moddare la classe `ChatInputMenu` per filtrare i messaggi `/` prima che vengano inviati:

```c
modded class ChatInputMenu
{
    override void OnChatInputSend()
    {
        string text = "";
        // Ottieni il testo corrente dal widget di input
        // Se inizia con /, NON chiamare super (che lo invia come chat)
        // Invece, gestiscilo come comando

        // Questo approccio varia in base alla versione di DayZ -- controlla i sorgenti vanilla
        super.OnChatInputSend();
    }
};
```

L'implementazione esatta dipende dalla versione di DayZ e da come `ChatInputMenu` espone il testo. L'approccio `OnEvent` in questo tutorial è più semplice e funziona per lo sviluppo, con il compromesso che il testo del comando appare anche come messaggio chat.

---

## Prossimi Passi

1. **Carica gli admin da un file di configurazione** -- Usa `JsonFileLoader` per caricare gli ID admin da un file JSON invece di codificarli nel codice.
2. **Aggiungi un comando /help** -- Elenca tutti i comandi disponibili con le loro descrizioni e l'utilizzo.
3. **Aggiungi il logging** -- Scrivi l'utilizzo dei comandi in un file di log per scopi di controllo.
4. **Integra con un framework** -- MyMod Core fornisce `MyPermissions` per permessi gerarchici e `MyRPC` per RPC con routing a stringa che evitano collisioni di ID interi.
5. **Aggiungi i cooldown** -- Previeni lo spam dei comandi tracciando l'ultimo tempo di esecuzione per giocatore.
6. **Costruisci una UI palette comandi** -- Crea un pannello admin che elenca tutti i comandi con pulsanti cliccabili (combinando questo tutorial con il [Capitolo 8.3](03-admin-panel.md)).

---

## Buone Pratiche

- **Controlla sempre i permessi prima di eseguire comandi admin.** Un controllo permessi mancante significa che qualsiasi giocatore può usare `/heal` o `/kill` su chiunque. Valida lo Steam64 ID del chiamante (tramite `GetPlainId()`) sul server prima di elaborare.
- **Invia feedback all'admin anche per i comandi falliti.** I fallimenti silenziosi rendono impossibile il debug. Invia sempre un messaggio chat che spiega cosa è andato storto ("Giocatore non trovato", "Permesso negato").
- **Usa `GetPlainId()` per i controlli admin, non `GetId()`.** `GetId()` restituisce un ID DayZ specifico della sessione che cambia ad ogni riconnessione. `GetPlainId()` restituisce lo Steam64 ID permanente.
- **Memorizza gli ID admin in un file di configurazione JSON, non nel codice.** Gli ID codificati richiedono una ricostruzione del PBO per essere modificati. Un file JSON in `$profile:` può essere modificato dagli admin del server senza conoscenze di modding.
- **Converti i nomi dei comandi in minuscolo prima del confronto.** I giocatori possono digitare `/Heal`, `/HEAL` o `/heal`. Normalizzare in minuscolo previene frustranti errori "comando sconosciuto".

---

## Teoria vs Pratica

| Concetto | Teoria | Realtà |
|----------|--------|--------|
| Hook della chat tramite `OnEvent` | Intercetta il messaggio e gestiscilo come comando | Il messaggio appare comunque nella chat per tutti i giocatori. Sopprimerlo richiede il modding di `ChatInputMenu`, che varia in base alla versione di DayZ. |
| `GetGame().Chat()` | Visualizza un messaggio nella finestra chat del giocatore | Funziona solo quando la UI della chat è attiva. Nella schermata di caricamento o in certi stati del menu, il messaggio viene silenziosamente scartato. |
| Pattern del registro comandi | Architettura pulita con una classe per comando | Ogni file della classe comando deve andare nel layer di script corretto. `CCmdBase` in `3_Game`, comandi concreti che fanno riferimento a `PlayerBase` in `4_World`. Un posizionamento nel layer sbagliato causa "Undefined type" al caricamento. |
| Ricerca giocatore per nome | `FindPlayerByName` fa corrispondenza parziale sui nomi | La corrispondenza parziale può colpire il giocatore sbagliato su un server con nomi simili. In produzione, preferisci il targeting tramite Steam64 ID o aggiungi un passaggio di conferma. |

---

## Cosa Hai Imparato

In questo tutorial hai imparato:
- Come agganciarsi all'input della chat usando `MissionGameplay.OnEvent` con `ChatMessageEventTypeID`
- Come analizzare i prefissi dei comandi e gli argomenti dal testo della chat
- Come controllare i permessi admin sul server usando gli Steam64 ID
- Come inviare feedback dei comandi al giocatore tramite RPC e `GetGame().Chat()`
- Come costruire un pattern di registro comandi riutilizzabile per aggiungere nuovi comandi

**Successivo:** [Capitolo 8.6: Debug e Test della Tua Mod](06-debugging-testing.md)

---

**Precedente:** [Capitolo 8.3: Costruire un Modulo Pannello Admin](03-admin-panel.md)
