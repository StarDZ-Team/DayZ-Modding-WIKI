# Capitolo 6.8: I/O File e JSON

[Home](../README.md) | [<< Precedente: Timer e CallQueue](07-timers.md) | **I/O File e JSON** | [Successivo: Networking e RPC >>](09-networking.md)

---

## Introduzione

DayZ fornisce operazioni di I/O file per leggere e scrivere file di testo, serializzazione/deserializzazione JSON, gestione delle directory e enumerazione dei file. Tutte le operazioni sui file usano prefissi di percorso speciali (`$profile:`, `$saves:`, `$mission:`) anziché percorsi assoluti del filesystem. Questo capitolo copre ogni operazione sui file disponibile in Enforce Script.

---

## Prefissi di Percorso

| Prefisso | Posizione | Scrivibile |
|----------|-----------|------------|
| `$profile:` | Directory del profilo server/client (es. `DayZServer/profiles/`) | Sì |
| `$saves:` | Directory dei salvataggi | Sì |
| `$mission:` | Cartella della missione corrente (es. `mpmissions/dayzOffline.chernarusplus/`) | Tipicamente in lettura |
| `$CurrentDir:` | Directory di lavoro corrente | Dipende |
| Nessun prefisso | Relativo alla radice del gioco | Solo lettura |

> **Importante:** La maggior parte delle operazioni di scrittura file è limitata a `$profile:` e `$saves:`. Tentare di scrivere altrove potrebbe fallire silenziosamente.

---

## Controllo Esistenza File

```c
proto bool FileExist(string name);
```

Restituisce `true` se il file esiste al percorso dato.

**Esempio:**

```c
if (FileExist("$profile:MyMod/config.json"))
{
    Print("File di configurazione trovato");
}
else
{
    Print("File di configurazione non trovato, creazione predefiniti");
}
```

---

## Apertura e Chiusura File

```c
proto FileHandle OpenFile(string name, FileMode mode);
proto void CloseFile(FileHandle file);
```

### Enum FileMode

```c
enum FileMode
{
    READ,     // Apri per lettura (il file deve esistere)
    WRITE,    // Apri per scrittura (crea nuovo / sovrascrive esistente)
    APPEND    // Apri per aggiunta (crea se non esiste)
}
```

`FileHandle` è un handle intero. Un valore di ritorno di `0` indica fallimento.

**Esempio:**

```c
FileHandle fh = OpenFile("$profile:MyMod/log.txt", FileMode.WRITE);
if (fh != 0)
{
    // File aperto con successo
    // ... esegui lavoro ...
    CloseFile(fh);
}
```

> **Critico:** Chiama sempre `CloseFile()` quando hai finito. Non chiudere i file può causare perdita di dati e perdite di risorse.

---

## Scrittura File

### FPrintln (Scrivi Riga)

```c
proto void FPrintln(FileHandle file, void var);
```

Scrive il valore seguito da un carattere di nuova riga.

### FPrint (Scrivi Senza Nuova Riga)

```c
proto void FPrint(FileHandle file, void var);
```

Scrive il valore senza una nuova riga finale.

**Esempio --- scrivere un file di log:**

```c
void WriteLog(string message)
{
    FileHandle fh = OpenFile("$profile:MyMod/log.txt", FileMode.APPEND);
    if (fh != 0)
    {
        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);
        string timestamp = string.Format("[%1-%2-%3 %4:%5]", year, month, day, hour, minute);

        FPrintln(fh, timestamp + " " + message);
        CloseFile(fh);
    }
}
```

---

## Lettura File

### FGets (Leggi Riga)

```c
proto int FGets(FileHandle file, string var);
```

Legge una riga dal file in `var`. Restituisce il numero di caratteri letti, o `-1` alla fine del file.

**Esempio --- leggere un file riga per riga:**

```c
void ReadConfigFile()
{
    FileHandle fh = OpenFile("$profile:MyMod/settings.txt", FileMode.READ);
    if (fh != 0)
    {
        string line;
        while (FGets(fh, line) >= 0)
        {
            Print("Riga: " + line);
            ProcessLine(line);
        }
        CloseFile(fh);
    }
}
```

### ReadFile (Lettura Binaria Grezza)

```c
proto int ReadFile(FileHandle file, void param_array, int length);
```

Legge byte grezzi in un buffer. Usato per dati binari.

---

## Operazioni sulle Directory

### MakeDirectory

```c
proto native bool MakeDirectory(string name);
```

Crea una directory. Restituisce `true` in caso di successo. Crea solo la directory finale --- le directory genitori devono già esistere.

**Esempio --- assicurare la struttura delle directory:**

```c
void EnsureDirectories()
{
    MakeDirectory("$profile:MyMod");
    MakeDirectory("$profile:MyMod/data");
    MakeDirectory("$profile:MyMod/logs");
}
```

### DeleteFile

```c
proto native bool DeleteFile(string name);
```

Elimina un file. Funziona solo nelle directory `$profile:` e `$saves:`.

### CopyFile

```c
proto native bool CopyFile(string sourceName, string destName);
```

Copia un file dalla sorgente alla destinazione.

**Esempio:**

```c
// Backup prima di sovrascrivere
if (FileExist("$profile:MyMod/config.json"))
{
    CopyFile("$profile:MyMod/config.json", "$profile:MyMod/config.json.bak");
}
```

---

## Enumerazione File (FindFile / FindNextFile)

Enumera i file corrispondenti a un pattern in una directory.

```c
proto FindFileHandle FindFile(string pattern, out string fileName,
                               out FileAttr fileAttributes, FindFileFlags flags);
proto bool FindNextFile(FindFileHandle handle, out string fileName,
                         out FileAttr fileAttributes);
proto native void CloseFindFile(FindFileHandle handle);
```

### Enum FileAttr

```c
enum FileAttr
{
    DIRECTORY,   // La voce è una directory
    HIDDEN,      // La voce è nascosta
    READONLY,    // La voce è in sola lettura
    INVALID      // Voce non valida
}
```

### Enum FindFileFlags

```c
enum FindFileFlags
{
    DIRECTORIES,  // Restituisce solo directory
    ARCHIVES,     // Restituisce solo file
    ALL           // Restituisce entrambi
}
```

**Esempio --- enumerare tutti i file JSON in una directory:**

```c
void ListJsonFiles()
{
    string fileName;
    FileAttr fileAttr;
    FindFileHandle handle = FindFile(
        "$profile:MyMod/missions/*.json", fileName, fileAttr, FindFileFlags.ALL
    );

    if (handle)
    {
        // Elabora il primo risultato
        if (!(fileAttr & FileAttr.DIRECTORY))
        {
            Print("Trovato: " + fileName);
        }

        // Elabora i risultati rimanenti
        while (FindNextFile(handle, fileName, fileAttr))
        {
            if (!(fileAttr & FileAttr.DIRECTORY))
            {
                Print("Trovato: " + fileName);
            }
        }

        CloseFindFile(handle);
    }
}
```

> **Importante:** `FindFile` restituisce solo il nome del file, non il percorso completo. Devi preporre il percorso della directory tu stesso quando elabori i file.

**Esempio --- contare i file in una directory:**

```c
int CountFiles(string pattern)
{
    int count = 0;
    string fileName;
    FileAttr fileAttr;
    FindFileHandle handle = FindFile(pattern, fileName, fileAttr, FindFileFlags.ARCHIVES);

    if (handle)
    {
        count++;
        while (FindNextFile(handle, fileName, fileAttr))
        {
            count++;
        }
        CloseFindFile(handle);
    }

    return count;
}
```

---

## JsonFileLoader (JSON Generico)

**File:** `3_Game/tools/jsonfileloader.c` (173 righe)

Il modo consigliato per caricare e salvare dati JSON. Funziona con qualsiasi classe che abbia campi pubblici.

### API Moderna (Preferita)

```c
class JsonFileLoader<Class T>
{
    // Carica file JSON nell'oggetto
    static bool LoadFile(string filename, out T data, out string errorMessage);

    // Salva oggetto nel file JSON
    static bool SaveFile(string filename, T data, out string errorMessage);

    // Analizza stringa JSON nell'oggetto
    static bool LoadData(string string_data, out T data, out string errorMessage);

    // Serializza oggetto in stringa JSON
    static bool MakeData(T inputData, out string outputData,
                          out string errorMessage, bool prettyPrint = true);
}
```

Tutti i metodi restituiscono `bool` --- `true` in caso di successo, `false` in caso di fallimento con l'errore in `errorMessage`.

### API Legacy (Deprecata)

```c
class JsonFileLoader<Class T>
{
    static void JsonLoadFile(string filename, out T data);    // Restituisce void!
    static void JsonSaveFile(string filename, T data);
    static void JsonLoadData(string string_data, out T data);
    static string JsonMakeData(T data);
}
```

> **Insidia Critica:** `JsonLoadFile()` restituisce `void`. NON PUOI usarlo in una condizione `if`:
> ```c
> // SBAGLIATO - non compilerà o sarà sempre false
> if (JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg)) { }
>
> // CORRETTO - usa il moderno LoadFile() che restituisce bool
> if (JsonFileLoader<MyConfig>.LoadFile(path, cfg, error)) { }
> ```

### Requisiti della Classe Dati

La classe di destinazione deve avere **campi pubblici** con valori predefiniti. Il serializzatore JSON mappa i nomi dei campi direttamente alle chiavi JSON.

```c
class MyConfig
{
    int MaxPlayers = 60;
    float SpawnRadius = 150.0;
    string ServerName = "My Server";
    bool EnablePVP = true;
    ref array<string> AllowedItems = new array<string>;
    ref map<string, int> ItemPrices = new map<string, int>;

    void MyConfig()
    {
        AllowedItems.Insert("BandageDressing");
        AllowedItems.Insert("Canteen");
    }
}
```

Questo produce JSON:

```json
{
    "MaxPlayers": 60,
    "SpawnRadius": 150.0,
    "ServerName": "My Server",
    "EnablePVP": true,
    "AllowedItems": ["BandageDressing", "Canteen"],
    "ItemPrices": {}
}
```

### Esempio Completo Caricamento/Salvataggio

```c
class MyModConfig
{
    int Version = 1;
    float RespawnTime = 300.0;
    ref array<string> SpawnItems = new array<string>;
}

class MyModConfigManager
{
    protected static const string CONFIG_PATH = "$profile:MyMod/config.json";
    protected ref MyModConfig m_Config;

    void Init()
    {
        MakeDirectory("$profile:MyMod");
        m_Config = new MyModConfig();
        Load();
    }

    void Load()
    {
        if (!FileExist(CONFIG_PATH))
        {
            Save();  // Crea config predefinito
            return;
        }

        string error;
        if (!JsonFileLoader<MyModConfig>.LoadFile(CONFIG_PATH, m_Config, error))
        {
            Print("[MyMod] Errore caricamento config: " + error);
            m_Config = new MyModConfig();  // Ripristina ai predefiniti
            Save();
        }
    }

    void Save()
    {
        string error;
        if (!JsonFileLoader<MyModConfig>.SaveFile(CONFIG_PATH, m_Config, error))
        {
            Print("[MyMod] Errore salvataggio config: " + error);
        }
    }

    MyModConfig GetConfig()
    {
        return m_Config;
    }
}
```

---

## JsonSerializer (Uso Diretto)

**File:** `3_Game/gameplay.c`

Per i casi in cui devi serializzare/deserializzare stringhe JSON direttamente senza operazioni sui file:

```c
class JsonSerializer : Serializer
{
    proto bool WriteToString(void variable_out, bool nice, out string result);
    proto bool ReadFromString(void variable_in, string jsonString, out string error);
}
```

**Esempio:**

```c
MyConfig cfg = new MyConfig();
cfg.MaxPlayers = 100;

JsonSerializer js = new JsonSerializer();

// Serializza in stringa
string jsonOutput;
js.WriteToString(cfg, true, jsonOutput);  // true = formattazione leggibile
Print(jsonOutput);

// Deserializza da stringa
MyConfig parsed = new MyConfig();
string parseError;
js.ReadFromString(parsed, jsonOutput, parseError);
Print("MaxPlayers: " + parsed.MaxPlayers);
```

---

## Riepilogo

| Operazione | Funzione | Note |
|------------|----------|------|
| Controlla esistenza | `FileExist(path)` | Restituisce bool |
| Apri | `OpenFile(path, FileMode)` | Restituisce handle (0 = fallimento) |
| Chiudi | `CloseFile(handle)` | Chiama sempre quando finito |
| Scrivi riga | `FPrintln(handle, data)` | Con nuova riga |
| Scrivi | `FPrint(handle, data)` | Senza nuova riga |
| Leggi riga | `FGets(handle, out line)` | Restituisce -1 a EOF |
| Crea directory | `MakeDirectory(path)` | Solo un livello |
| Elimina | `DeleteFile(path)` | Solo `$profile:` / `$saves:` |
| Copia | `CopyFile(src, dst)` | -- |
| Cerca file | `FindFile(pattern, ...)` | Restituisce handle, itera con `FindNextFile` |
| Carica JSON | `JsonFileLoader<T>.LoadFile(path, data, error)` | API moderna, restituisce bool |
| Salva JSON | `JsonFileLoader<T>.SaveFile(path, data, error)` | API moderna, restituisce bool |
| Stringa JSON | `JsonSerializer.WriteToString()` / `ReadFromString()` | Operazioni dirette su stringhe |

| Concetto | Punto Chiave |
|----------|-------------|
| Prefissi di percorso | `$profile:` (scrivibile), `$mission:` (lettura), `$saves:` (scrivibile) |
| JsonLoadFile | **Restituisce void** --- usa `LoadFile()` (bool) invece |
| Classi dati | Campi pubblici con predefiniti, `ref` per array/map |
| Chiudi sempre | Ogni `OpenFile` deve avere un `CloseFile` corrispondente |
| FindFile | Restituisce solo nomi file, non percorsi completi |

---

## Buone Pratiche

- **Avvolgi sempre le operazioni sui file in controlli di esistenza e chiudi gli handle in tutti i percorsi del codice.** Un `FileHandle` non chiuso perde risorse e può impedire la scrittura del file su disco. Usa pattern di guardia: controlla `fh != 0`, esegui il lavoro, poi `CloseFile(fh)` prima di ogni `return`.
- **Usa il moderno `JsonFileLoader<T>.LoadFile()` (restituisce bool) invece del legacy `JsonLoadFile()` (restituisce void).** L'API legacy non può riportare errori, e tentare di usare il suo ritorno void in una condizione fallisce silenziosamente.
- **Crea le directory con `MakeDirectory()` nell'ordine dal genitore al figlio.** `MakeDirectory` crea solo il segmento finale della directory. `MakeDirectory("$profile:A/B/C")` fallisce se `A/B` non esiste. Crea ogni livello sequenzialmente.
- **Usa `CopyFile()` per creare backup prima di sovrascrivere i file di configurazione.** Gli errori di parsing JSON da salvataggi corrotti sono irrecuperabili. Una copia `.bak` permette ai proprietari del server di ripristinare l'ultimo stato valido.
- **Ricorda che `FindFile()` restituisce solo nomi file, non percorsi completi.** Devi concatenare il prefisso della directory tu stesso quando carichi file trovati tramite `FindFile`/`FindNextFile`.

---

## Compatibilità e Impatto

> **Compatibilità Mod:** L'I/O file è intrinsecamente isolato per mod quando ogni mod usa la propria sottodirectory `$profile:`. I conflitti si verificano solo quando due mod leggono/scrivono lo stesso percorso file.

- **Ordine di Caricamento:** L'I/O file non ha dipendenze dall'ordine di caricamento. Le mod leggono e scrivono indipendentemente.
- **Conflitti di Classi Moddate:** Nessun conflitto di classi. Il rischio è che due mod usino lo stesso nome di sottodirectory o filename in `$profile:`, causando corruzione dei dati.
- **Impatto sulle Prestazioni:** La serializzazione JSON tramite `JsonFileLoader` è sincrona e blocca il thread principale. Caricare file JSON grandi (>100KB) durante il gameplay causa scatti nei frame. Carica le configurazioni in `OnInit()` o `OnMissionStart()`, mai in `OnUpdate()`.
- **Server/Client:** Le scritture file sono limitate a `$profile:` e `$saves:`. Sui client, `$profile:` punta alla directory del profilo client. Sui server dedicati, punta al profilo server. `$mission:` è tipicamente in sola lettura su entrambi i lati.

---

## Osservato nelle Mod Reali

> Questi pattern sono stati confermati studiando il codice sorgente di mod DayZ professionali.

| Pattern | Mod | File/Posizione |
|---------|-----|---------------|
| Catena `MakeDirectory` + controllo `FileExist` + `LoadFile` con fallback ai predefiniti | Expansion | Settings manager (`ExpansionSettings`) |
| Backup con `CopyFile` prima del salvataggio config | COT | Gestione file permessi |
| `FindFile`/`FindNextFile` per enumerare file JSON per-giocatore in `$profile:` | VPP Admin Tools | Caricatore dati giocatore |
| `JsonSerializer.WriteToString()` per serializzazione payload RPC (nessun file) | Dabs Framework | Sincronizzazione config di rete |

---

[<< Precedente: Timer e CallQueue](07-timers.md) | **I/O File e JSON** | [Successivo: Networking e RPC >>](09-networking.md)
