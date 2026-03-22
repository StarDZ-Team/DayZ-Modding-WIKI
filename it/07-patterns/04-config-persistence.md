# Capitolo 7.4: Persistenza della Configurazione

[Home](../README.md) | [<< Precedente: Pattern RPC](03-rpc-patterns.md) | **Persistenza della Configurazione** | [Successivo: Sistemi di Permessi >>](05-permissions.md)

---

## Introduzione

Quasi ogni mod DayZ ha bisogno di salvare e caricare dati di configurazione: impostazioni del server, tabelle di spawn, liste ban, dati giocatore, posizioni di teletrasporto. Il motore fornisce `JsonFileLoader` per la serializzazione JSON semplice e I/O su file raw (`FileHandle`, `FPrintln`) per tutto il resto. I mod professionali aggiungono un layer di versioning della configurazione e migrazione automatica.

Questo capitolo copre i pattern standard per la persistenza della configurazione, dal load/save JSON di base attraverso i sistemi di migrazione versionata, la gestione delle directory e i timer di auto-save.

---

## Indice

- [Pattern JsonFileLoader](#pattern-jsonfileloader)
- [Scrittura JSON Manuale (FPrintln)](#scrittura-json-manuale-fprintln)
- [Il Percorso $profile](#il-percorso-profile)
- [Creazione delle Directory](#creazione-delle-directory)
- [Classi Dati di Configurazione](#classi-dati-di-configurazione)
- [Versioning e Migrazione della Configurazione](#versioning-e-migrazione-della-configurazione)
- [Timer di Auto-Save](#timer-di-auto-save)
- [Errori Comuni](#errori-comuni)
- [Best Practice](#best-practice)

---

## Pattern JsonFileLoader

`JsonFileLoader` è il serializzatore built-in del motore. Converte tra oggetti Enforce Script e file JSON usando la reflection --- legge i campi pubblici della tua classe e li mappa automaticamente alle chiavi JSON.

### Avvertenza Critica

**`JsonFileLoader<T>.JsonLoadFile()` e `JsonFileLoader<T>.JsonSaveFile()` restituiscono `void`.** Non puoi controllare il loro valore di ritorno. Non puoi assegnarli a un `bool`. Non puoi usarli in una condizione `if`. Questo è uno degli errori più comuni nel modding di DayZ.

```c
// SBAGLIATO — non compila
bool success = JsonFileLoader<MyConfig>.JsonLoadFile(path, config);

// SBAGLIATO — non compila
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config))
{
    // ...
}

// CORRETTO — chiama e poi controlla lo stato dell'oggetto
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
// Controlla se i dati sono stati effettivamente popolati
if (config.m_ServerName != "")
{
    // Dati caricati con successo
}
```

### Load/Save di Base

```c
// Classe dati — i campi pubblici vengono serializzati da/a JSON
class ServerSettings
{
    string ServerName = "My DayZ Server";
    int MaxPlayers = 60;
    float RestartInterval = 14400.0;
    bool PvPEnabled = true;
};

class SettingsManager
{
    private static const string SETTINGS_PATH = "$profile:MyMod/ServerSettings.json";
    protected ref ServerSettings m_Settings;

    void Load()
    {
        m_Settings = new ServerSettings();

        if (FileExist(SETTINGS_PATH))
        {
            JsonFileLoader<ServerSettings>.JsonLoadFile(SETTINGS_PATH, m_Settings);
        }
        else
        {
            // Prima esecuzione: salva i valori predefiniti
            Save();
        }
    }

    void Save()
    {
        JsonFileLoader<ServerSettings>.JsonSaveFile(SETTINGS_PATH, m_Settings);
    }
};
```

### Cosa Viene Serializzato

`JsonFileLoader` serializza **tutti i campi pubblici** dell'oggetto. Non serializza:
- Campi privati o protetti
- Metodi
- Campi statici
- Campi transitori/solo-runtime (non esiste un attributo `[NonSerialized]` --- usa i modificatori di accesso)

Il JSON risultante appare così:

```json
{
    "ServerName": "My DayZ Server",
    "MaxPlayers": 60,
    "RestartInterval": 14400.0,
    "PvPEnabled": true
}
```

### Tipi di Campo Supportati

| Tipo | Rappresentazione JSON |
|------|-------------------|
| `int` | Numero |
| `float` | Numero |
| `bool` | `true` / `false` |
| `string` | Stringa |
| `vector` | Array di 3 numeri |
| `array<T>` | Array JSON |
| `map<string, T>` | Oggetto JSON (solo chiavi stringa) |
| Classe annidata | Oggetto JSON annidato |

### Oggetti Annidati

```c
class SpawnPoint
{
    string Name;
    vector Position;
    float Radius;
};

class SpawnConfig
{
    ref array<ref SpawnPoint> SpawnPoints = new array<ref SpawnPoint>();
};
```

Produce:

```json
{
    "SpawnPoints": [
        {
            "Name": "Coast",
            "Position": [13000, 0, 3500],
            "Radius": 100.0
        },
        {
            "Name": "Airfield",
            "Position": [4500, 0, 9500],
            "Radius": 50.0
        }
    ]
}
```

---

## Scrittura JSON Manuale (FPrintln)

A volte `JsonFileLoader` non è abbastanza flessibile: non può gestire array di tipi misti, formattazione personalizzata o strutture dati non-classe. In quei casi, usa I/O su file raw.

### Pattern di Base

```c
void WriteCustomData(string path, array<string> lines)
{
    FileHandle file = OpenFile(path, FileMode.WRITE);
    if (!file) return;

    FPrintln(file, "{");
    FPrintln(file, "    \"entries\": [");

    for (int i = 0; i < lines.Count(); i++)
    {
        string comma = "";
        if (i < lines.Count() - 1) comma = ",";
        FPrintln(file, "        \"" + lines[i] + "\"" + comma);
    }

    FPrintln(file, "    ]");
    FPrintln(file, "}");

    CloseFile(file);
}
```

### Lettura di File Raw

```c
void ReadCustomData(string path)
{
    FileHandle file = OpenFile(path, FileMode.READ);
    if (!file) return;

    string line;
    while (FGets(file, line) >= 0)
    {
        line = line.Trim();
        if (line == "") continue;
        // Elabora la riga...
    }

    CloseFile(file);
}
```

### Quando Usare l'I/O Manuale

- Scrittura di file di log (modalità append)
- Scrittura di esportazioni CSV o in testo puro
- Formattazione JSON personalizzata che `JsonFileLoader` non può produrre
- Parsing di formati file non-JSON (es. file `.map` o `.xml` di DayZ)

Per i file di configurazione standard, preferisci `JsonFileLoader`. È più veloce da implementare, meno soggetto a errori e gestisce automaticamente gli oggetti annidati.

---

## Il Percorso $profile

DayZ fornisce il prefisso di percorso `$profile:`, che si risolve nella directory del profilo del server (tipicamente la cartella contenente `DayZServer_x64.exe`, o il percorso del profilo specificato con `-profiles=`).

```c
// Questi si risolvono nella directory del profilo:
"$profile:MyMod/config.json"       // → C:/DayZServer/MyMod/config.json
"$profile:MyMod/Players/data.json" // → C:/DayZServer/MyMod/Players/data.json
```

### Usa Sempre $profile

Non usare mai percorsi assoluti. Non usare mai percorsi relativi. Usa sempre `$profile:` per qualsiasi file che il tuo mod crea o legge in runtime:

```c
// MALE: Percorso assoluto — non funziona su nessun'altra macchina
const string CONFIG_PATH = "C:/DayZServer/MyMod/config.json";

// MALE: Percorso relativo — dipende dalla directory di lavoro, che varia
const string CONFIG_PATH = "MyMod/config.json";

// BENE: $profile si risolve correttamente ovunque
const string CONFIG_PATH = "$profile:MyMod/config.json";
```

### Struttura Directory Convenzionale

La maggior parte dei mod segue questa convenzione:

```
$profile:
  └── YourModName/
      ├── Config.json          (configurazione principale del server)
      ├── Permissions.json     (permessi admin)
      ├── Logs/
      │   └── 2025-01-15.log   (file di log giornalieri)
      └── Players/
          ├── 76561198xxxxx.json
          └── 76561198yyyyy.json
```

---

## Creazione delle Directory

Prima di scrivere un file, devi assicurarti che la directory padre esista. DayZ non crea automaticamente le directory.

### MakeDirectory

```c
void EnsureDirectories()
{
    string baseDir = "$profile:MyMod";
    if (!FileExist(baseDir))
    {
        MakeDirectory(baseDir);
    }

    string playersDir = baseDir + "/Players";
    if (!FileExist(playersDir))
    {
        MakeDirectory(playersDir);
    }

    string logsDir = baseDir + "/Logs";
    if (!FileExist(logsDir))
    {
        MakeDirectory(logsDir);
    }
}
```

### Importante: MakeDirectory Non È Ricorsiva

`MakeDirectory` crea solo la directory finale nel percorso. Se la directory padre non esiste, fallisce silenziosamente. Devi creare ogni livello:

```c
// SBAGLIATO: Il padre "MyMod" non esiste ancora
MakeDirectory("$profile:MyMod/Data/Players");  // Fallisce silenziosamente

// CORRETTO: Crea ogni livello
MakeDirectory("$profile:MyMod");
MakeDirectory("$profile:MyMod/Data");
MakeDirectory("$profile:MyMod/Data/Players");
```

### Pattern delle Costanti per i Percorsi

Un mod framework definisce tutti i percorsi come costanti in una classe dedicata:

```c
class MyModConst
{
    static const string PROFILE_DIR    = "$profile:MyMod";
    static const string CONFIG_DIR     = "$profile:MyMod/Configs";
    static const string LOG_DIR        = "$profile:MyMod/Logs";
    static const string PLAYERS_DIR    = "$profile:MyMod/Players";
    static const string PERMISSIONS_FILE = "$profile:MyMod/Permissions.json";
};
```

Questo evita la duplicazione delle stringhe di percorso nel codice sorgente e rende facile trovare ogni file che il tuo mod tocca.

---

## Classi Dati di Configurazione

Una classe dati di configurazione ben progettata fornisce valori predefiniti, tracciamento della versione e documentazione chiara di ogni campo.

### Pattern di Base

```c
class MyModConfig
{
    // Tracciamento versione per le migrazioni
    int ConfigVersion = 3;

    // Impostazioni di gameplay con valori predefiniti sensati
    bool EnableFeatureX = true;
    int MaxEntities = 50;
    float SpawnRadius = 500.0;
    string WelcomeMessage = "Welcome to the server!";

    // Impostazioni complesse
    ref array<string> AllowedWeapons = new array<string>();
    ref map<string, float> ZoneRadii = new map<string, float>();

    void MyModConfig()
    {
        // Inizializza le collezioni con valori predefiniti
        AllowedWeapons.Insert("AK74");
        AllowedWeapons.Insert("M4A1");

        ZoneRadii.Set("safe_zone", 100.0);
        ZoneRadii.Set("pvp_zone", 500.0);
    }
};
```

### Pattern ConfigBase Riflessivo

Questo pattern usa un sistema di configurazione riflessivo dove ogni classe config dichiara i suoi campi come descrittori. Questo permette al pannello admin di auto-generare UI per qualsiasi config senza nomi di campo hardcoded:

```c
// Pattern concettuale (config riflessiva):
class MyConfigBase
{
    // Ogni config dichiara la sua versione
    int ConfigVersion;
    string ModId;

    // Le sottoclassi sovrascrivono per dichiarare i loro campi
    void Init(string modId)
    {
        ModId = modId;
    }

    // Reflection: ottieni tutti i campi configurabili
    array<ref MyConfigField> GetFields();

    // Get/set dinamico per nome campo (per sync pannello admin)
    string GetFieldValue(string fieldName);
    void SetFieldValue(string fieldName, string value);

    // Hook per logica personalizzata su load/save
    void OnAfterLoad() {}
    void OnBeforeSave() {}
};
```

### Pattern VPP ConfigurablePlugin

VPP unisce la gestione della configurazione direttamente nel ciclo di vita del plugin:

```c
// Pattern VPP (semplificato):
class VPPESPConfig
{
    bool EnableESP = true;
    float MaxDistance = 1000.0;
    int RefreshRate = 5;
};

class VPPESPPlugin : ConfigurablePlugin
{
    ref VPPESPConfig m_ESPConfig;

    override void OnInit()
    {
        m_ESPConfig = new VPPESPConfig();
        // ConfigurablePlugin.LoadConfig() gestisce il load JSON
        super.OnInit();
    }
};
```

---

## Versioning e Migrazione della Configurazione

Man mano che il tuo mod evolve, le strutture di configurazione cambiano. Aggiungi campi, rimuovi campi, rinomini campi, cambi i valori predefiniti. Senza versioning, gli utenti con vecchi file di configurazione otterranno silenziosamente valori sbagliati o crash.

### Il Campo Versione

Ogni classe config dovrebbe avere un campo versione intero:

```c
class MyModConfig
{
    int ConfigVersion = 5;  // Incrementa quando la struttura cambia
    // ...
};
```

### Migrazione al Caricamento

Quando carichi una config, confronta la versione su disco con la versione corrente nel codice. Se differiscono, esegui le migrazioni:

```c
void LoadConfig()
{
    MyModConfig config = new MyModConfig();  // Ha i valori predefiniti correnti

    if (FileExist(CONFIG_PATH))
    {
        JsonFileLoader<MyModConfig>.JsonLoadFile(CONFIG_PATH, config);

        if (config.ConfigVersion < CURRENT_VERSION)
        {
            MigrateConfig(config);
            config.ConfigVersion = CURRENT_VERSION;
            SaveConfig(config);  // Ri-salva con versione aggiornata
        }
    }
    else
    {
        SaveConfig(config);  // Prima esecuzione: scrivi i valori predefiniti
    }

    m_Config = config;
}
```

### Funzioni di Migrazione

```c
static const int CURRENT_VERSION = 5;

void MigrateConfig(MyModConfig config)
{
    // Esegui ogni passo di migrazione sequenzialmente
    if (config.ConfigVersion < 2)
    {
        // v1 → v2: "SpawnDelay" è stato rinominato in "RespawnInterval"
        // Il vecchio campo è perso al load; imposta il nuovo valore predefinito
        config.RespawnInterval = 300.0;
    }

    if (config.ConfigVersion < 3)
    {
        // v2 → v3: Aggiunto campo "EnableNotifications"
        config.EnableNotifications = true;
    }

    if (config.ConfigVersion < 4)
    {
        // v3 → v4: Il valore predefinito di "MaxZombies" è cambiato da 100 a 200
        if (config.MaxZombies == 100)
        {
            config.MaxZombies = 200;  // Aggiorna solo se l'utente non l'aveva cambiato
        }
    }

    if (config.ConfigVersion < 5)
    {
        // v4 → v5: "DifficultyMode" cambiato da int a string
        // config.DifficultyMode = "Normal"; // Imposta nuovo valore predefinito
    }

    MyLog.Info("Config", "Migrated config from v"
        + config.ConfigVersion.ToString() + " to v" + CURRENT_VERSION.ToString());
}
```

### Esempio di Migrazione di Expansion

Expansion è noto per l'evoluzione aggressiva delle configurazioni. Alcune config di Expansion hanno superato le 17+ versioni. Il loro pattern:
1. Ogni incremento di versione ha una funzione di migrazione dedicata
2. Le migrazioni vengono eseguite in ordine (1 a 2, poi 2 a 3, poi 3 a 4, ecc.)
3. Ogni migrazione cambia solo ciò che è necessario per quel passo di versione
4. Il numero di versione finale viene scritto su disco dopo che tutte le migrazioni sono completate

Questo è lo standard di riferimento per il versioning delle configurazioni nei mod DayZ.

---

## Timer di Auto-Save

Per le configurazioni che cambiano in runtime (modifiche dell'admin, accumulo di dati giocatore), implementa un timer di auto-save per prevenire la perdita di dati in caso di crash.

### Auto-Save Basato su Timer

```c
class MyDataManager
{
    protected const float AUTOSAVE_INTERVAL = 300.0;  // 5 minuti
    protected float m_AutosaveTimer;
    protected bool m_Dirty;  // I dati sono cambiati dall'ultimo salvataggio?

    void MarkDirty()
    {
        m_Dirty = true;
    }

    void OnUpdate(float dt)
    {
        m_AutosaveTimer += dt;
        if (m_AutosaveTimer >= AUTOSAVE_INTERVAL)
        {
            m_AutosaveTimer = 0;

            if (m_Dirty)
            {
                Save();
                m_Dirty = false;
            }
        }
    }

    void OnMissionFinish()
    {
        // Salva sempre allo shutdown, anche se il timer non ha ancora sparato
        if (m_Dirty)
        {
            Save();
            m_Dirty = false;
        }
    }
};
```

### Ottimizzazione con Flag Dirty

Scrivi su disco solo quando i dati sono effettivamente cambiati. L'I/O su file è costoso. Se nulla è cambiato, salta il salvataggio:

```c
void UpdateSetting(string key, string value)
{
    if (m_Settings.Get(key) == value) return;  // Nessun cambiamento, nessun salvataggio

    m_Settings.Set(key, value);
    MarkDirty();
}
```

### Salvataggio su Eventi Critici

Oltre ai salvataggi temporizzati, salva immediatamente dopo operazioni critiche:

```c
void BanPlayer(string uid, string reason)
{
    m_BanList.Insert(uid);
    Save();  // Salvataggio immediato — i ban devono sopravvivere ai crash
}
```

---

## Errori Comuni

### 1. Trattare JsonLoadFile Come Se Restituisse un Valore

```c
// SBAGLIATO — non compila
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config)) { ... }
```

`JsonLoadFile` restituisce `void`. Chiamalo, poi controlla lo stato dell'oggetto.

### 2. Non Controllare FileExist Prima di Caricare

```c
// SBAGLIATO — crash o produce oggetto vuoto senza diagnostica
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);

// CORRETTO — controlla prima, crea i valori predefiniti se mancante
if (!FileExist("$profile:MyMod/Config.json"))
{
    SaveDefaults();
    return;
}
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);
```

### 3. Dimenticare di Creare le Directory

`JsonSaveFile` fallisce silenziosamente se la directory non esiste. Assicura sempre le directory prima di salvare.

### 4. Campi Pubblici Che Non Intendevi Serializzare

Ogni campo `public` su una classe config finisce nel JSON. Se hai campi solo-runtime, rendili `protected` o `private`:

```c
class MyConfig
{
    // Questi vanno nel JSON:
    int MaxPlayers = 60;
    string ServerName = "My Server";

    // Questo NON va nel JSON (protetto):
    protected bool m_Loaded;
    protected float m_LastSaveTime;
};
```

### 5. Caratteri Backslash e Virgolette nei Valori JSON

Il CParser di Enforce Script ha problemi con `\\` e `\"` nelle stringhe letterali. Evita di salvare percorsi file con backslash nelle config. Usa le barre in avanti:

```c
// MALE — i backslash possono rompere il parsing
string LogPath = "C:\\DayZ\\Logs\\server.log";

// BENE — le barre in avanti funzionano ovunque
string LogPath = "$profile:MyMod/Logs/server.log";
```

---

## Best Practice

1. **Usa `$profile:` per tutti i percorsi file.** Non hardcodare mai percorsi assoluti.

2. **Crea le directory prima di scrivere file.** Controlla con `FileExist()`, crea con `MakeDirectory()`, un livello alla volta.

3. **Fornisci sempre valori predefiniti nel costruttore della tua classe config o negli inizializzatori dei campi.** Questo assicura che le config alla prima esecuzione siano sensate.

4. **Versiona le tue config dal primo giorno.** Aggiungere un campo `ConfigVersion` non costa nulla e risparmia ore di debug dopo.

5. **Separa le classi dati config dalle classi manager.** La classe dati è un contenitore stupido; il manager gestisce la logica load/save/sync.

6. **Usa auto-save con un flag dirty.** Non scrivere su disco ogni volta che un valore cambia --- raggruppa le scritture su un timer.

7. **Salva alla fine della missione.** Il timer di auto-save è una rete di sicurezza, non il salvataggio primario. Salva sempre durante `OnMissionFinish()`.

8. **Definisci le costanti dei percorsi in un unico posto.** Una classe `MyModConst` con tutti i percorsi previene la duplicazione delle stringhe e rende i cambiamenti di percorso banali.

9. **Logga le operazioni di load/save.** Quando fai debug dei problemi di configurazione, una riga di log che dice "Loaded config v3 from $profile:MyMod/Config.json" è inestimabile.

10. **Testa con un file config cancellato.** Il tuo mod dovrebbe gestire la prima esecuzione con grazia: crea le directory, scrivi i valori predefiniti, logga cosa ha fatto.

---

## Compatibilità e Impatto

- **Multi-Mod:** Ogni mod scrive nella propria directory `$profile:NomeMod/`. I conflitti si verificano solo se due mod usano lo stesso nome di directory. Usa un prefisso unico e riconoscibile per la cartella del tuo mod.
- **Ordine di Caricamento:** Il caricamento della configurazione avviene in `OnInit` o `OnMissionStart`, entrambi controllati dal ciclo di vita del mod stesso. Nessun problema di ordine di caricamento cross-mod a meno che due mod non provino a leggere/scrivere lo stesso file (cosa che non dovrebbero mai fare).
- **Listen Server:** I file di configurazione sono solo lato server (`$profile:` si risolve sul server). Sui listen server, il codice lato client può tecnicamente accedere a `$profile:`, ma le configurazioni dovrebbero essere caricate solo dai moduli server per evitare ambiguità.
- **Prestazioni:** `JsonFileLoader` è sincrono e blocca il thread principale. Per configurazioni grandi (100+ KB), carica durante `OnInit` (prima che il gameplay inizi). I timer di auto-save prevengono scritture ripetute; il pattern del flag dirty assicura che l'I/O su disco avvenga solo quando i dati sono effettivamente cambiati.
- **Migrazione:** Aggiungere nuovi campi a una classe config è sicuro --- `JsonFileLoader` ignora le chiavi JSON mancanti e lascia il valore predefinito della classe. Rimuovere o rinominare campi richiede un passo di migrazione versionata per evitare la perdita silenziosa di dati.

---

## Teoria vs Pratica

| Il Libro Dice | Realtà DayZ |
|---------------|-------------|
| Usa I/O su file asincrono per evitare il blocking | Enforce Script non ha I/O su file asincrono; tutte le letture/scritture sono sincrone. Carica all'avvio, salva su timer. |
| Valida il JSON con uno schema | Non esiste validazione di schema JSON; valida i campi in `OnAfterLoad()` o con guard clause dopo il caricamento. |
| Usa un database per dati strutturati | Nessun accesso database da Enforce Script; i file JSON in `$profile:` sono l'unico meccanismo di persistenza. |

---

[Home](../README.md) | [<< Precedente: Pattern RPC](03-rpc-patterns.md) | **Persistenza della Configurazione** | [Successivo: Sistemi di Permessi >>](05-permissions.md)
