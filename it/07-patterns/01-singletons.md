# Capitolo 7.1: Pattern Singleton

[Home](../README.md) | **Pattern Singleton** | [Successivo: Sistemi a Moduli >>](02-module-systems.md)

---

## Introduzione

Il pattern singleton garantisce che una classe abbia esattamente una sola istanza, accessibile globalmente. Nel modding di DayZ è il pattern architetturale più comune --- praticamente ogni manager, cache, registro e sottosistema lo utilizza. COT, VPP, Expansion, Dabs Framework e altri si affidano tutti ai singleton per coordinare lo stato tra i layer script del motore.

Questo capitolo copre l'implementazione canonica, la gestione del ciclo di vita, quando il pattern è appropriato e dove va storto.

---

## Indice

- [L'Implementazione Canonica](#limplementazione-canonica)
- [Inizializzazione Lazy vs Eager](#inizializzazione-lazy-vs-eager)
- [Gestione del Ciclo di Vita](#gestione-del-ciclo-di-vita)
- [Quando Usare i Singleton](#quando-usare-i-singleton)
- [Esempi dal Mondo Reale](#esempi-dal-mondo-reale)
- [Considerazioni sulla Thread Safety](#considerazioni-sulla-thread-safety)
- [Anti-Pattern](#anti-pattern)
- [Alternativa: Classi Solo Statiche](#alternativa-classi-solo-statiche)
- [Checklist](#checklist)

---

## L'Implementazione Canonica

Il singleton DayZ standard segue una formula semplice: un campo `private static ref`, un accessore statico `GetInstance()` e un `DestroyInstance()` statico per la pulizia.

```c
class LootManager
{
    // L'unica istanza. 'ref' la mantiene viva; 'private' impedisce manomissioni esterne.
    private static ref LootManager s_Instance;

    // Dati privati posseduti dal singleton
    protected ref map<string, int> m_SpawnCounts;

    // Costruttore — chiamato esattamente una volta
    void LootManager()
    {
        m_SpawnCounts = new map<string, int>();
    }

    // Distruttore — chiamato quando s_Instance viene impostato a null
    void ~LootManager()
    {
        m_SpawnCounts = null;
    }

    // Accessore lazy: crea alla prima chiamata
    static LootManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new LootManager();
        }
        return s_Instance;
    }

    // Smontaggio esplicito
    static void DestroyInstance()
    {
        s_Instance = null;
    }

    // --- API Pubblica ---

    void RecordSpawn(string className)
    {
        int count = 0;
        m_SpawnCounts.Find(className, count);
        m_SpawnCounts.Set(className, count + 1);
    }

    int GetSpawnCount(string className)
    {
        int count = 0;
        m_SpawnCounts.Find(className, count);
        return count;
    }
};
```

### Perché `private static ref`?

| Parola chiave | Scopo |
|---------------|-------|
| `private` | Impedisce ad altre classi di impostare `s_Instance` a null o sostituirla |
| `static` | Condiviso in tutto il codice --- non serve un'istanza per accedervi |
| `ref` | Riferimento forte --- mantiene l'oggetto vivo finché `s_Instance` non è null |

Senza `ref`, l'istanza sarebbe un riferimento debole e potrebbe essere raccolta dal garbage collector mentre è ancora in uso.

---

## Inizializzazione Lazy vs Eager

### Inizializzazione Lazy (Default Consigliato)

Il metodo `GetInstance()` crea l'istanza al primo accesso. Questo è l'approccio usato dalla maggior parte delle mod DayZ.

```c
static LootManager GetInstance()
{
    if (!s_Instance)
    {
        s_Instance = new LootManager();
    }
    return s_Instance;
}
```

**Vantaggi:**
- Nessun lavoro eseguito finché non è effettivamente necessario
- Nessuna dipendenza dall'ordine di inizializzazione tra mod
- Sicuro se il singleton è opzionale (alcune configurazioni server potrebbero non chiamarlo mai)

**Svantaggio:**
- Il primo chiamante paga il costo di costruzione (solitamente trascurabile)

### Inizializzazione Eager

Alcuni singleton vengono creati esplicitamente durante l'avvio della missione, tipicamente da `MissionServer.OnInit()` o da `OnMissionStart()` di un modulo.

```c
// Nel tuo MissionServer moddato OnInit():
void OnInit()
{
    super.OnInit();
    LootManager.Create();  // Eager: costruito ora, non al primo uso
}

// In LootManager:
static void Create()
{
    if (!s_Instance)
    {
        s_Instance = new LootManager();
    }
}
```

**Quando preferire eager:**
- Il singleton carica dati dal disco (config, file JSON) e vuoi che gli errori di caricamento emergano all'avvio
- Il singleton registra gestori RPC che devono essere attivi prima che qualsiasi client si connetta
- L'ordine di inizializzazione è importante e devi controllarlo esplicitamente

---

## Gestione del Ciclo di Vita

La fonte più comune di bug dei singleton in DayZ è la mancata pulizia alla fine della missione. I server DayZ possono riavviare le missioni senza riavviare il processo, il che significa che i campi statici sopravvivono tra i riavvii delle missioni. Se non azzeri `s_Instance` in `OnMissionFinish`, porti riferimenti obsoleti, oggetti morti e callback orfane nella missione successiva.

### Il Contratto del Ciclo di Vita

```
Avvio del Processo Server
  └─ MissionServer.OnInit()
       └─ Crea singleton (eager) o lasciali creare da soli (lazy)
  └─ MissionServer.OnMissionStart()
       └─ I singleton iniziano a operare
  └─ ... il server gira ...
  └─ MissionServer.OnMissionFinish()
       └─ DestroyInstance() su ogni singleton
       └─ Tutti i ref statici impostati a null
  └─ (La missione può riavviarsi)
       └─ Singleton freschi creati di nuovo
```

### Pattern di Pulizia

Abbina sempre il tuo singleton con un metodo `DestroyInstance()` e chiamalo durante lo shutdown:

```c
class VehicleRegistry
{
    private static ref VehicleRegistry s_Instance;
    protected ref array<ref VehicleData> m_Vehicles;

    static VehicleRegistry GetInstance()
    {
        if (!s_Instance) s_Instance = new VehicleRegistry();
        return s_Instance;
    }

    static void DestroyInstance()
    {
        s_Instance = null;  // Rilascia il ref, il distruttore viene eseguito
    }

    void ~VehicleRegistry()
    {
        if (m_Vehicles) m_Vehicles.Clear();
        m_Vehicles = null;
    }
};

// Nel tuo MissionServer moddato:
modded class MissionServer
{
    override void OnMissionFinish()
    {
        VehicleRegistry.DestroyInstance();
        super.OnMissionFinish();
    }
};
```

### Pattern di Shutdown Centralizzato

Una mod framework può consolidare tutta la pulizia dei singleton in `MyFramework.ShutdownAll()`, che viene chiamata dal `MissionServer.OnMissionFinish()` moddato. Questo previene l'errore comune di dimenticare un singleton:

```c
// Pattern concettuale (shutdown centralizzato):
static void ShutdownAll()
{
    MyRPC.Cleanup();
    MyEventBus.Cleanup();
    MyModuleManager.Cleanup();
    MyConfigManager.DestroyInstance();
    MyPermissions.DestroyInstance();
}
```

---

## Quando Usare i Singleton

### Buoni Candidati

| Caso d'Uso | Perché il Singleton Funziona |
|------------|------------------------------|
| **Classi manager** (LootManager, VehicleManager) | Esattamente un coordinatore per dominio |
| **Cache** (cache CfgVehicles, cache icone) | Un'unica fonte di verità evita calcoli ridondanti |
| **Registri** (registro gestori RPC, registro moduli) | La ricerca centrale deve essere accessibile globalmente |
| **Contenitori di configurazione** (impostazioni server, permessi) | Una config per mod, caricata una volta dal disco |
| **Dispatcher RPC** | Punto di ingresso unico per tutti gli RPC in arrivo |

### Candidati Scadenti

| Caso d'Uso | Perché No |
|------------|-----------|
| **Dati per-giocatore** | Un'istanza per giocatore, non un'istanza globale |
| **Calcoli temporanei** | Crea, usa, scarta --- nessuno stato globale necessario |
| **Viste/dialoghi UI** | Ne possono coesistere più; usa lo stack delle viste |
| **Componenti di entità** | Collegati a oggetti individuali, non globali |

---

## Esempi dal Mondo Reale

### COT (Community Online Tools)

COT usa un pattern singleton basato su moduli attraverso il framework CF. Ogni strumento è un singleton `JMModuleBase` registrato all'avvio:

```c
// Pattern COT: CF istanzia automaticamente i moduli dichiarati in config.cpp
class JM_COT_ESP : JMModuleBase
{
    // CF gestisce il ciclo di vita del singleton
    // Accesso tramite: JM_COT_ESP.Cast(GetModuleManager().GetModule(JM_COT_ESP));
}
```

### VPP Admin Tools

VPP usa `GetInstance()` esplicito sulle classi manager:

```c
// Pattern VPP (semplificato)
class VPPATBanManager
{
    private static ref VPPATBanManager m_Instance;

    static VPPATBanManager GetInstance()
    {
        if (!m_Instance)
            m_Instance = new VPPATBanManager();
        return m_Instance;
    }
}
```

### Expansion

Expansion dichiara singleton per ogni sottosistema e si aggancia al ciclo di vita della missione per la pulizia:

```c
// Pattern Expansion (semplificato)
class ExpansionMarketModule : CF_ModuleWorld
{
    // CF_ModuleWorld è esso stesso un singleton gestito dal sistema di moduli CF
    // ExpansionMarketModule.Cast(CF_ModuleCoreManager.Get(ExpansionMarketModule));
}
```

---

## Considerazioni sulla Thread Safety

Enforce Script è single-threaded. Tutta l'esecuzione degli script avviene sul thread principale all'interno del game loop del motore Enfusion. Questo significa:

- **Non ci sono race condition** tra thread concorrenti
- **Non** servono mutex, lock o operazioni atomiche
- `GetInstance()` con inizializzazione lazy è sempre sicuro

Tuttavia, la **rientranza** può ancora causare problemi. Se `GetInstance()` innesca codice che chiama di nuovo `GetInstance()` durante la costruzione, puoi ottenere un singleton parzialmente inizializzato:

```c
// PERICOLOSO: costruzione singleton rientrante
class BadManager
{
    private static ref BadManager s_Instance;

    void BadManager()
    {
        // Questo chiama GetInstance() durante la costruzione!
        OtherSystem.Register(BadManager.GetInstance());
    }

    static BadManager GetInstance()
    {
        if (!s_Instance)
        {
            // s_Instance è ancora null qui durante la costruzione
            s_Instance = new BadManager();
        }
        return s_Instance;
    }
};
```

La correzione è assegnare `s_Instance` prima di eseguire qualsiasi inizializzazione che potrebbe rientrare:

```c
static BadManager GetInstance()
{
    if (!s_Instance)
    {
        s_Instance = new BadManager();  // Assegna prima
        s_Instance.Initialize();         // Poi esegui l'inizializzazione che potrebbe chiamare GetInstance()
    }
    return s_Instance;
}
```

O meglio ancora, evita del tutto l'inizializzazione circolare.

---

## Anti-Pattern

### 1. Stato Mutabile Globale Senza Incapsulamento

Il pattern singleton ti dà accesso globale. Questo non significa che i dati debbano essere globalmente scrivibili.

```c
// MALE: Campi pubblici invitano a mutazioni incontrollate
class GameState
{
    private static ref GameState s_Instance;
    int PlayerCount;         // Chiunque può scrivere questo
    bool ServerLocked;       // Chiunque può scrivere questo
    string CurrentWeather;   // Chiunque può scrivere questo

    static GameState GetInstance() { ... }
};

// Qualsiasi codice può fare:
GameState.GetInstance().PlayerCount = -999;  // Caos
```

```c
// BENE: Accesso controllato tramite metodi
class GameState
{
    private static ref GameState s_Instance;
    protected int m_PlayerCount;
    protected bool m_ServerLocked;

    int GetPlayerCount() { return m_PlayerCount; }

    void IncrementPlayerCount()
    {
        m_PlayerCount++;
    }

    static GameState GetInstance() { ... }
};
```

### 2. DestroyInstance Mancante

Se dimentichi la pulizia, il singleton persiste tra i riavvii delle missioni con dati obsoleti:

```c
// MALE: Nessun percorso di pulizia
class ZombieTracker
{
    private static ref ZombieTracker s_Instance;
    ref array<Object> m_TrackedZombies;  // Questi oggetti vengono eliminati alla fine della missione!

    static ZombieTracker GetInstance() { ... }
    // Nessun DestroyInstance() — m_TrackedZombies ora contiene riferimenti morti
};
```

### 3. Singleton Che Possiedono Tutto

Quando un singleton accumula troppe responsabilità, diventa un "God object" impossibile da ragionare:

```c
// MALE: Un singleton che fa tutto
class ServerManager
{
    // Gestisce loot E veicoli E meteo E spawn E ban E...
    ref array<Object> m_Loot;
    ref array<Object> m_Vehicles;
    ref WeatherData m_Weather;
    ref array<string> m_BannedPlayers;

    void SpawnLoot() { ... }
    void DespawnVehicle() { ... }
    void SetWeather() { ... }
    void BanPlayer() { ... }
    // 2000 righe dopo...
};
```

Dividi in singleton focalizzati: `LootManager`, `VehicleManager`, `WeatherManager`, `BanManager`. Ognuno è piccolo, testabile e ha un dominio chiaro.

### 4. Accedere ai Singleton nei Costruttori di Altri Singleton

Questo crea dipendenze nascoste nell'ordine di inizializzazione:

```c
// MALE: Il costruttore dipende da un altro singleton
class ModuleA
{
    void ModuleA()
    {
        // E se ModuleB non è stato ancora creato?
        ModuleB.GetInstance().Register(this);
    }
};
```

Rinvia la registrazione cross-singleton a `OnInit()` o `OnMissionStart()`, dove l'ordine di inizializzazione è controllato.

---

## Alternativa: Classi Solo Statiche

Alcuni "singleton" non hanno bisogno di un'istanza affatto. Se la classe non contiene stato di istanza e ha solo metodi statici e campi statici, salta completamente la cerimonia di `GetInstance()`:

```c
// Nessuna istanza necessaria — tutto statico
class MyLog
{
    private static FileHandle s_LogFile;
    private static int s_LogLevel;

    static void Info(string tag, string msg)
    {
        WriteLog("INFO", tag, msg);
    }

    static void Error(string tag, string msg)
    {
        WriteLog("ERROR", tag, msg);
    }

    static void Cleanup()
    {
        if (s_LogFile) CloseFile(s_LogFile);
        s_LogFile = null;
    }

    private static void WriteLog(string level, string tag, string msg)
    {
        // ...
    }
};
```

Questo è l'approccio usato da `MyLog`, `MyRPC`, `MyEventBus` e `MyModuleManager` in una mod framework. È più semplice, evita il sovraccarico del controllo null di `GetInstance()` e rende chiara l'intenzione: non c'è nessuna istanza, solo stato condiviso.

**Usa una classe solo statica quando:**
- Tutti i metodi sono senza stato o operano su campi statici
- Non c'è logica significativa di costruttore/distruttore
- Non hai mai bisogno di passare l'"istanza" come parametro

**Usa un vero singleton quando:**
- La classe ha stato di istanza che beneficia dell'incapsulamento (campi `protected`)
- Hai bisogno di polimorfismo (una classe base con metodi sovrascritti)
- L'oggetto deve essere passato ad altri sistemi per riferimento

---

## Checklist

Prima di distribuire un singleton, verifica:

- [ ] `s_Instance` è dichiarato `private static ref`
- [ ] `GetInstance()` gestisce il caso null (init lazy) o hai una chiamata esplicita `Create()`
- [ ] `DestroyInstance()` esiste e imposta `s_Instance = null`
- [ ] `DestroyInstance()` viene chiamato da `OnMissionFinish()` o da un metodo di shutdown centralizzato
- [ ] Il distruttore pulisce le collezioni possedute (`.Clear()`, impostare a `null`)
- [ ] Nessun campo pubblico --- tutta la mutazione passa attraverso metodi
- [ ] Il costruttore non chiama `GetInstance()` su altri singleton (rinviare a `OnInit()`)

---

## Compatibilità e Impatto

- **Multi-Mod:** Più mod che definiscono ciascuna i propri singleton coesistono in sicurezza --- ognuna ha la propria `s_Instance`. I conflitti sorgono solo se due mod definiscono lo stesso nome di classe, che Enforce Script segnalerà come errore di ridefinizione al caricamento.
- **Ordine di Caricamento:** I singleton lazy non sono influenzati dall'ordine di caricamento delle mod. I singleton eager creati in `OnInit()` dipendono dall'ordine della catena `modded class`, che segue `requiredAddons` di `config.cpp`.
- **Listen Server:** I campi statici sono condivisi tra i contesti client e server nello stesso processo. Un singleton che dovrebbe esistere solo lato server deve proteggere la costruzione con `GetGame().IsServer()`, altrimenti sarà accessibile (e potenzialmente inizializzato) anche dal codice client.
- **Prestazioni:** L'accesso al singleton è un controllo null statico + chiamata di metodo --- sovraccarico trascurabile. Il costo sta in ciò che il singleton *fa*, non nell'accedervi.
- **Migrazione:** I singleton sopravvivono agli aggiornamenti di versione di DayZ finché le API che chiamano (es. `GetGame()`, `JsonFileLoader`) rimangono stabili. Non è necessaria nessuna migrazione speciale per il pattern stesso.

---

## Errori Comuni

| Errore | Impatto | Correzione |
|--------|---------|------------|
| Chiamata `DestroyInstance()` mancante in `OnMissionFinish` | Dati obsoleti e riferimenti a entità morte si trascinano tra i riavvii delle missioni, causando crash o stato fantasma | Chiama sempre `DestroyInstance()` da `OnMissionFinish` o da uno `ShutdownAll()` centralizzato |
| Chiamare `GetInstance()` dentro il costruttore di un altro singleton | Innesca costruzione rientrante; `s_Instance` è ancora null, quindi viene creata una seconda istanza | Rinvia l'accesso cross-singleton a un metodo `Initialize()` chiamato dopo la costruzione |
| Usare `public static ref` invece di `private static ref` | Qualsiasi codice può impostare `s_Instance = null` o sostituirla, rompendo la garanzia di istanza unica | Dichiara sempre `s_Instance` come `private static ref` |
| Non proteggere l'init eager su listen server | Il singleton viene costruito due volte (una dal percorso server, una dal percorso client) se `Create()` non ha un controllo null | Controlla sempre `if (!s_Instance)` dentro `Create()` |
| Accumulare stato senza limiti (cache senza limiti) | La memoria cresce indefinitamente su server a lunga esecuzione; eventuale OOM o lag grave | Limita le collezioni con una dimensione massima o evacuazione periodica in `OnUpdate` |

---

## Teoria vs Pratica

| Il Manuale Dice | La Realtà di DayZ |
|-----------------|-------------------|
| I singleton sono un anti-pattern; usa l'iniezione di dipendenze | Enforce Script non ha un contenitore DI. I singleton sono l'approccio standard per i manager globali in tutte le mod principali. |
| L'inizializzazione lazy è sempre sufficiente | I gestori RPC devono essere registrati prima che qualsiasi client si connetta, quindi l'init eager in `OnInit()` è spesso necessario. |
| I singleton non dovrebbero mai essere distrutti | Le missioni DayZ si riavviano senza riavviare il processo server; i singleton *devono* essere distrutti e ricreati ad ogni ciclo di missione. |

---

[Home](../README.md) | **Pattern Singleton** | [Successivo: Sistemi a Moduli >>](02-module-systems.md)
