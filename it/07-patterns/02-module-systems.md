# Capitolo 7.2: Sistemi a Moduli / Plugin

[Home](../README.md) | [<< Precedente: Pattern Singleton](01-singletons.md) | **Sistemi a Moduli / Plugin** | [Successivo: Pattern RPC >>](03-rpc-patterns.md)

---

## Introduzione

Ogni framework serio per il modding di DayZ utilizza un sistema a moduli o plugin per organizzare il codice in unità autonome con hook del ciclo di vita ben definiti. Invece di sparpagliare la logica di inizializzazione tra classi mission moddificate, i moduli si registrano presso un manager centrale che distribuisce gli eventi del ciclo di vita --- `OnInit`, `OnMissionStart`, `OnUpdate`, `OnMissionFinish` --- a ciascun modulo in un ordine prevedibile.

Questo capitolo esamina quattro approcci reali: `CF_ModuleCore` del Community Framework, `PluginBase` / `ConfigurablePlugin` di VPP, la registrazione basata su attributi del Dabs Framework, e un module manager statico personalizzato. Ciascuno risolve lo stesso problema in modo diverso; comprendere tutti e quattro ti aiuterà a scegliere il pattern giusto per il tuo mod o a integrarti correttamente con un framework esistente.

---

## Indice

- [Perché i Moduli?](#perché-i-moduli)
- [CF_ModuleCore (COT / Expansion)](#cf_modulecore-cot--expansion)
- [VPP PluginBase / ConfigurablePlugin](#vpp-pluginbase--configurableplugin)
- [Dabs Registrazione Basata su Attributi](#dabs-registrazione-basata-su-attributi)
- [Module Manager Statico Personalizzato](#module-manager-statico-personalizzato)
- [Ciclo di Vita dei Moduli: Il Contratto Universale](#ciclo-di-vita-dei-moduli-il-contratto-universale)
- [Best Practice per la Progettazione dei Moduli](#best-practice-per-la-progettazione-dei-moduli)
- [Tabella Comparativa](#tabella-comparativa)

---

## Perché i Moduli?

Senza un sistema a moduli, un mod DayZ tipicamente finisce con una classe `MissionServer` o `MissionGameplay` moddificata e monolitica che cresce fino a diventare ingestibile:

```c
// MALE: Tutto stipato in una sola classe moddificata
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        InitLootSystem();
        InitVehicleTracker();
        InitBanManager();
        InitWeatherController();
        InitAdminPanel();
        InitKillfeedHUD();
        // ... altri 20 sistemi
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        TickLootSystem(timeslice);
        TickVehicleTracker(timeslice);
        TickWeatherController(timeslice);
        // ... altri 20 tick
    }
};
```

Un sistema a moduli sostituisce tutto questo con un singolo punto di hook stabile:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        MyModuleManager.Register(new LootModule());
        MyModuleManager.Register(new VehicleModule());
        MyModuleManager.Register(new WeatherModule());
    }

    override void OnMissionStart()
    {
        super.OnMissionStart();
        MyModuleManager.OnMissionStart();  // Distribuisce a tutti i moduli
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        MyModuleManager.OnServerUpdate(timeslice);  // Distribuisce a tutti i moduli
    }
};
```

Ogni modulo è una classe indipendente con il proprio file, il proprio stato e i propri hook del ciclo di vita. Aggiungere una nuova funzionalità significa aggiungere un nuovo modulo --- non modificare una classe mission da 3000 righe.

---

## CF_ModuleCore (COT / Expansion)

Il Community Framework (CF) fornisce il sistema a moduli più utilizzato nell'ecosistema del modding di DayZ. Sia COT che Expansion si basano su di esso.

### Come Funziona

1. Si dichiara una classe modulo che estende una delle classi base del CF
2. Si registra in `config.cpp` sotto `CfgPatches` / `CfgMods`
3. Il `CF_ModuleCoreManager` del CF scopre e istanzia automaticamente tutte le classi modulo registrate all'avvio
4. Gli eventi del ciclo di vita vengono distribuiti automaticamente

### Classi Base del Modulo

CF fornisce tre classi base corrispondenti ai layer script di DayZ:

| Classe Base | Layer | Uso Tipico |
|-----------|-------|-------------|
| `CF_ModuleGame` | 3_Game | Inizializzazione anticipata, registrazione RPC, classi dati |
| `CF_ModuleWorld` | 4_World | Interazione con entità, sistemi di gameplay |
| `CF_ModuleMission` | 5_Mission | UI, HUD, hook a livello di missione |

### Esempio: Un Modulo CF

```c
class MyLootModule : CF_ModuleWorld
{
    // CF chiama questo una volta durante l'inizializzazione del modulo
    override void OnInit()
    {
        super.OnInit();
        // Registra handler RPC, alloca strutture dati
    }

    // CF chiama questo quando la missione inizia
    override void OnMissionStart(Class sender, CF_EventArgs args)
    {
        super.OnMissionStart(sender, args);
        // Carica configurazioni, genera il loot iniziale
    }

    // CF chiama questo ogni frame sul server
    override void OnUpdate(Class sender, CF_EventArgs args)
    {
        super.OnUpdate(sender, args);
        // Aggiorna i timer di respawn del loot
    }

    // CF chiama questo quando la missione termina
    override void OnMissionFinish(Class sender, CF_EventArgs args)
    {
        super.OnMissionFinish(sender, args);
        // Salva lo stato, rilascia le risorse
    }
};
```

### Accedere a un Modulo CF

```c
// Ottieni un riferimento a un modulo in esecuzione per tipo
MyLootModule lootMod;
CF_Modules<MyLootModule>.Get(lootMod);
if (lootMod)
{
    lootMod.ForceRespawn();
}
```

### Caratteristiche Principali

- **Scoperta automatica**: i moduli vengono istanziati dal CF in base alle dichiarazioni nel `config.cpp` --- nessuna chiamata manuale a `new`
- **Argomenti evento**: gli hook del ciclo di vita ricevono `CF_EventArgs` con dati di contesto
- **Dipendenza dal CF**: il tuo mod richiede il Community Framework come dipendenza
- **Ampiamente supportato**: se il tuo mod è destinato a server che già eseguono COT o Expansion, CF è già presente

---

## VPP PluginBase / ConfigurablePlugin

VPP Admin Tools utilizza un'architettura a plugin dove ogni strumento di amministrazione è una classe plugin registrata presso un manager centrale.

### Plugin Base

```c
// Pattern VPP (semplificato)
class PluginBase : Managed
{
    void OnInit();
    void OnUpdate(float dt);
    void OnDestroy();

    // Identità del plugin
    string GetPluginName();
    bool IsServerOnly();
};
```

### ConfigurablePlugin

VPP estende la base con una variante consapevole della configurazione che carica/salva automaticamente le impostazioni:

```c
class ConfigurablePlugin : PluginBase
{
    // VPP carica automaticamente questo dal JSON all'inizializzazione
    ref PluginConfigBase m_Config;

    override void OnInit()
    {
        super.OnInit();
        LoadConfig();
    }

    void LoadConfig()
    {
        string path = "$profile:VPPAdminTools/" + GetPluginName() + ".json";
        if (FileExist(path))
        {
            JsonFileLoader<PluginConfigBase>.JsonLoadFile(path, m_Config);
        }
    }

    void SaveConfig()
    {
        string path = "$profile:VPPAdminTools/" + GetPluginName() + ".json";
        JsonFileLoader<PluginConfigBase>.JsonSaveFile(path, m_Config);
    }
};
```

### Registrazione

VPP registra i plugin nel metodo `MissionServer.OnInit()` moddificato:

```c
// Pattern VPP
GetPluginManager().RegisterPlugin(new VPPESPPlugin());
GetPluginManager().RegisterPlugin(new VPPTeleportPlugin());
GetPluginManager().RegisterPlugin(new VPPWeatherPlugin());
```

### Caratteristiche Principali

- **Registrazione manuale**: ogni plugin viene esplicitamente creato con `new` e registrato
- **Integrazione della configurazione**: `ConfigurablePlugin` unisce la gestione della configurazione al ciclo di vita del modulo
- **Autosufficiente**: nessuna dipendenza dal CF; il plugin manager di VPP è un sistema a sé
- **Proprietà chiara**: il plugin manager mantiene `ref` a tutti i plugin, controllandone la durata di vita

---

## Dabs Registrazione Basata su Attributi

Il Dabs Framework (usato nei Dabs Framework Admin Tools) utilizza un approccio più moderno: attributi in stile C# per la registrazione automatica.

### Il Concetto

Invece di registrare manualmente i moduli, si annota una classe con un attributo, e il framework la scopre all'avvio usando la reflection:

```c
// Pattern Dabs (concettuale)
[CF_RegisterModule(DabsAdminESP)]
class DabsAdminESP : CF_ModuleWorld
{
    override void OnInit()
    {
        super.OnInit();
        // ...
    }
};
```

L'attributo `CF_RegisterModule` dice al module manager del CF di istanziare automaticamente questa classe. Nessuna chiamata manuale a `Register()` necessaria.

### Come Funziona la Scoperta

All'avvio, CF scansiona tutte le classi script caricate alla ricerca dell'attributo di registrazione. Per ogni corrispondenza, crea un'istanza e la aggiunge al module manager. Questo avviene prima che `OnInit()` venga chiamato su qualsiasi modulo.

### Caratteristiche Principali

- **Zero boilerplate**: nessun codice di registrazione nelle classi mission
- **Dichiarativo**: la classe stessa dichiara di essere un modulo
- **Dipende dal CF**: funziona solo con l'elaborazione degli attributi del Community Framework
- **Scopribilità**: puoi trovare tutti i moduli cercando l'attributo nel codice sorgente

---

## Module Manager Statico Personalizzato

Questo approccio usa un pattern di registrazione esplicita con una classe manager statica. Non c'è un'istanza del manager --- è composto interamente da metodi statici e storage statico. Questo è utile quando si vogliono zero dipendenze da framework esterni.

### Classi Base del Modulo

```c
// Base: hook del ciclo di vita
class MyModuleBase : Managed
{
    bool IsServer();       // Da sovrascrivere nella sottoclasse
    bool IsClient();       // Da sovrascrivere nella sottoclasse
    string GetModuleName();
    void OnInit();
    void OnMissionStart();
    void OnMissionFinish();
};

// Modulo lato server: aggiunge OnUpdate + eventi giocatore
class MyServerModule : MyModuleBase
{
    void OnUpdate(float dt);
    void OnPlayerConnect(PlayerIdentity identity);
    void OnPlayerDisconnect(PlayerIdentity identity, string uid);
};

// Modulo lato client: aggiunge OnUpdate
class MyClientModule : MyModuleBase
{
    void OnUpdate(float dt);
};
```

### Registrazione

I moduli si registrano esplicitamente, tipicamente dalle classi mission moddificate:

```c
// Nel MissionServer.OnInit() moddificato:
MyModuleManager.Register(new MyMissionServerModule());
MyModuleManager.Register(new MyAIServerModule());
```

### Distribuzione del Ciclo di Vita

Le classi mission moddificate chiamano `MyModuleManager` ad ogni punto del ciclo di vita:

```c
modded class MissionServer
{
    override void OnMissionStart()
    {
        super.OnMissionStart();
        MyModuleManager.OnMissionStart();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        MyModuleManager.OnServerUpdate(timeslice);
    }

    override void OnMissionFinish()
    {
        MyModuleManager.OnMissionFinish();
        MyModuleManager.Cleanup();
        super.OnMissionFinish();
    }
};
```

### Sicurezza Listen-Server

Le classi base del sistema a moduli personalizzato impongono un invariante critico: `MyServerModule` restituisce `true` da `IsServer()` e `false` da `IsClient()`, mentre `MyClientModule` fa il contrario. Il manager usa questi flag per evitare di distribuire gli eventi del ciclo di vita due volte sui listen server (dove sia `MissionServer` che `MissionGameplay` girano nello stesso processo).

Il `MyModuleBase` base restituisce `true` da entrambi --- motivo per cui il codice sorgente avverte di non estenderlo direttamente.

### Caratteristiche Principali

- **Zero dipendenze**: nessun CF, nessun framework esterno
- **Manager statico**: nessun `GetInstance()` necessario; API puramente statica
- **Registrazione esplicita**: pieno controllo su cosa viene registrato e quando
- **Sicuro per listen-server**: le sottoclassi tipizzate prevengono la doppia distribuzione
- **Pulizia centralizzata**: `MyModuleManager.Cleanup()` smonta tutti i moduli e i timer core

---

## Ciclo di Vita dei Moduli: Il Contratto Universale

Nonostante le differenze implementative, tutti e quattro i framework seguono lo stesso contratto del ciclo di vita:

```
┌─────────────────────────────────────────────────────┐
│  Registrazione / Scoperta                            │
│  L'istanza del modulo viene creata e registrata      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnInit()                                            │
│  Setup una-tantum: alloca collezioni, registra RPC   │
│  Chiamato una volta per modulo dopo la registrazione │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionStart()                                    │
│  La missione è attiva: carica config, avvia timer,   │
│  sottoscrivi eventi, genera le entità iniziali       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnUpdate(float dt)         [ripetuto ogni frame]    │
│  Tick per-frame: elabora code, aggiorna timer,       │
│  controlla condizioni, avanza macchine a stati       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionFinish()                                   │
│  Smontaggio: salva stato, annulla sottoscrizioni,    │
│  svuota collezioni, annulla i riferimenti            │
└─────────────────────────────────────────────────────┘
```

### Regole

1. **OnInit viene prima di OnMissionStart.** Non caricare mai configurazioni o generare entità in `OnInit()` --- il mondo potrebbe non essere ancora pronto.
2. **OnUpdate riceve il delta time.** Usa sempre `dt` per la logica basata sul tempo, non assumere mai un frame rate fisso.
3. **OnMissionFinish deve pulire tutto.** Ogni collezione `ref` deve essere svuotata. Ogni sottoscrizione ad eventi deve essere rimossa. Ogni singleton deve essere distrutto. Questo è l'unico punto di smontaggio affidabile.
4. **I moduli non dovrebbero dipendere dall'ordine di inizializzazione degli altri.** Se il Modulo A ha bisogno del Modulo B, usa l'accesso lazy (`GetModule()`) invece di assumere che B sia stato registrato prima.

---

## Best Practice per la Progettazione dei Moduli

### 1. Un Modulo, Una Responsabilità

Un modulo dovrebbe possedere esattamente un dominio. Se ti ritrovi a scrivere `VehicleAndWeatherAndLootModule`, dividilo.

```c
// BENE: Moduli focalizzati
class MyLootModule : MyServerModule { ... }
class MyVehicleModule : MyServerModule { ... }
class MyWeatherModule : MyServerModule { ... }

// MALE: Modulo dio
class MyEverythingModule : MyServerModule { ... }
```

### 2. Mantieni OnUpdate Leggero

`OnUpdate` viene eseguito ogni frame. Se il tuo modulo fa lavoro costoso (I/O su file, scansioni del mondo, pathfinding), fallo su un timer o distribuiscilo tra i frame:

```c
class MyCleanupModule : MyServerModule
{
    protected float m_CleanupTimer;
    protected const float CLEANUP_INTERVAL = 300.0;  // Ogni 5 minuti

    override void OnUpdate(float dt)
    {
        m_CleanupTimer += dt;
        if (m_CleanupTimer >= CLEANUP_INTERVAL)
        {
            m_CleanupTimer = 0;
            RunCleanup();
        }
    }
};
```

### 3. Registra gli RPC in OnInit, Non in OnMissionStart

Gli handler RPC devono essere al loro posto prima che qualsiasi client possa inviare un messaggio. `OnInit()` viene eseguito durante la registrazione del modulo, che avviene nelle prime fasi del setup della missione. `OnMissionStart()` potrebbe essere troppo tardi se i client si connettono velocemente.

```c
class MyModule : MyServerModule
{
    override void OnInit()
    {
        super.OnInit();
        MyRPC.Register("MyMod", "RPC_DoThing", this, MyRPCSide.SERVER);
    }

    void RPC_DoThing(PlayerIdentity sender, Object target, ParamsReadContext ctx)
    {
        // Gestisci l'RPC
    }
};
```

### 4. Usa il Module Manager per l'Accesso Cross-Modulo

Non mantenere riferimenti diretti ad altri moduli. Usa il lookup del manager:

```c
// BENE: Accoppiamento lasco attraverso il manager
MyModuleBase mod = MyModuleManager.GetModule("MyAIServerModule");
MyAIServerModule aiMod;
if (Class.CastTo(aiMod, mod))
{
    aiMod.PauseSpawning();
}

// MALE: Riferimento statico diretto crea accoppiamento stretto
MyAIServerModule.s_Instance.PauseSpawning();
```

### 5. Proteggiti Dalle Dipendenze Mancanti

Non tutti i server eseguono tutti i mod. Se il tuo modulo si integra opzionalmente con un altro mod, usa controlli del preprocessore:

```c
override void OnMissionStart()
{
    super.OnMissionStart();

    #ifdef MYMOD_AI
    MyEventBus.OnMissionStarted.Insert(OnAIMissionStarted);
    #endif
}
```

### 6. Logga gli Eventi del Ciclo di Vita del Modulo

Il logging rende il debug immediato. Ogni modulo dovrebbe loggare quando si inizializza e quando si spegne:

```c
override void OnInit()
{
    super.OnInit();
    MyLog.Info("MyModule", "Initialized");
}

override void OnMissionFinish()
{
    MyLog.Info("MyModule", "Shutting down");
    // Pulizia...
}
```

---

## Tabella Comparativa

| Caratteristica | CF_ModuleCore | VPP Plugin | Dabs Attributo | Modulo Personalizzato |
|---------|--------------|------------|----------------|---------------|
| **Scoperta** | config.cpp + auto | `Register()` manuale | Scansione attributi | `Register()` manuale |
| **Classi base** | Game / World / Mission | PluginBase / ConfigurablePlugin | CF_ModuleWorld + attributo | ServerModule / ClientModule |
| **Dipendenze** | Richiede CF | Autosufficiente | Richiede CF | Autosufficiente |
| **Sicuro per listen-server** | CF lo gestisce | Controllo manuale | CF lo gestisce | Sottoclassi tipizzate |
| **Integrazione config** | Separata | Integrata in ConfigurablePlugin | Separata | Tramite MyConfigManager |
| **Distribuzione update** | Automatica | Il manager chiama `OnUpdate` | Automatica | Il manager chiama `OnUpdate` |
| **Pulizia** | CF la gestisce | `OnDestroy` manuale | CF la gestisce | `MyModuleManager.Cleanup()` |
| **Accesso cross-mod** | `CF_Modules<T>.Get()` | `GetPluginManager().Get()` | `CF_Modules<T>.Get()` | `MyModuleManager.GetModule()` |

Scegli l'approccio che corrisponde al profilo di dipendenze del tuo mod. Se dipendi già dal CF, usa `CF_ModuleCore`. Se vuoi zero dipendenze esterne, costruisci il tuo sistema seguendo il pattern del manager personalizzato o di VPP.

---

## Compatibilità e Impatto

- **Multi-Mod:** Più mod possono registrare ciascuno i propri moduli con lo stesso manager (CF, VPP o personalizzato). Collisioni di nomi si verificano solo se due mod registrano lo stesso tipo di classe --- usa nomi di classe unici con il prefisso del tuo mod.
- **Ordine di Caricamento:** CF scopre automaticamente i moduli dal `config.cpp`, quindi l'ordine di caricamento segue `requiredAddons`. I manager personalizzati registrano i moduli in `OnInit()`, dove la catena `modded class` determina l'ordine. I moduli non dovrebbero dipendere dall'ordine di registrazione --- usa pattern di accesso lazy.
- **Listen Server:** Sui listen server, sia `MissionServer` che `MissionGameplay` girano nello stesso processo. Se il tuo module manager distribuisce `OnUpdate` da entrambi, i moduli ricevono tick doppi. Usa sottoclassi tipizzate (`ServerModule` / `ClientModule`) che restituiscono `IsServer()` o `IsClient()` per prevenire questo.
- **Prestazioni:** La distribuzione dei moduli aggiunge un'iterazione di loop per modulo registrato per chiamata del ciclo di vita. Con 10--20 moduli questo è trascurabile. Assicurati che i singoli metodi `OnUpdate` dei moduli siano leggeri (vedi Capitolo 7.7).
- **Migrazione:** Quando si aggiorna la versione di DayZ, i sistemi a moduli sono stabili fintanto che l'API della classe base (`CF_ModuleWorld`, `PluginBase`, ecc.) non cambia. Fissa la versione della dipendenza CF per evitare rotture.

---

## Errori Comuni

| Errore | Impatto | Soluzione |
|---------|--------|-----|
| Mancata pulizia in `OnMissionFinish` di un modulo | Collezioni, timer e sottoscrizioni di eventi sopravvivono ai riavvii della missione, causando dati obsoleti o crash | Sovrascrivi `OnMissionFinish`, svuota tutte le collezioni `ref`, annulla la sottoscrizione di tutti gli eventi |
| Distribuzione degli eventi del ciclo di vita due volte sui listen server | I moduli server eseguono logica client e viceversa; spawn duplicati, invii RPC doppi | Usa guard `IsServer()` / `IsClient()` o sottoclassi di modulo tipizzate che impongono la separazione |
| Registrazione degli RPC in `OnMissionStart` invece che in `OnInit` | I client che si connettono durante il setup della missione possono inviare RPC prima che gli handler siano pronti --- i messaggi vengono silenziosamente scartati | Registra sempre gli handler RPC in `OnInit()`, che viene eseguito durante la registrazione del modulo prima che qualsiasi client si connetta |
| Un unico "modulo dio" che gestisce tutto | Impossibile da debuggare, testare o estendere; conflitti di merge quando più sviluppatori ci lavorano | Dividi in moduli focalizzati con una singola responsabilità ciascuno |
| Mantenere un `ref` diretto a un'altra istanza di modulo | Crea accoppiamento stretto e potenziali memory leak da cicli di ref | Usa il lookup del module manager (`GetModule()`, `CF_Modules<T>.Get()`) per l'accesso cross-modulo |

---

## Teoria vs Pratica

| Il Libro Dice | Realtà DayZ |
|---------------|-------------|
| La scoperta dei moduli dovrebbe essere automatica tramite reflection | La reflection di Enforce Script è limitata; la scoperta basata su `config.cpp` (CF) o le chiamate esplicite a `Register()` sono gli unici approcci affidabili |
| I moduli dovrebbero essere sostituibili a caldo in runtime | DayZ non supporta il hot-reloading degli script; i moduli vivono per l'intero ciclo di vita della missione |
| Usa interfacce per i contratti dei moduli | Enforce Script non ha la keyword `interface`; usa metodi virtuali della classe base (`override`) al suo posto |
| La dependency injection disaccoppia i moduli | Non esiste un framework DI; usa lookup del manager e guard `#ifdef` per le dipendenze cross-mod opzionali |

---

[Home](../README.md) | [<< Precedente: Pattern Singleton](01-singletons.md) | **Sistemi a Moduli / Plugin** | [Successivo: Pattern RPC >>](03-rpc-patterns.md)
