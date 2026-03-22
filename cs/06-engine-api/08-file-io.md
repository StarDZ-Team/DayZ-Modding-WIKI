# Chapter 6.8: File I/O & JSON

[Domů](../README.md) | [<< Předchozí: Časovače a CallQueue](07-timers.md) | **Souborové I/O a JSON** | [Další: Síťování a RPC >>](09-networking.md)

---

## Úvod

DayZ provides file I/O operations for reading and writing text files, JSON serialization/deserialization, directory management, and file enumeration. All file operations use special path prefixes (`$profile:`, `$saves:`, `$mission:`) spíše než absolute filesystem paths. This chapter covers každý file operation dostupný in Enforce Script.

---

## Path Prefixes

| Prefix | Location | Writable |
|--------|----------|----------|
| `$profile:` | Server/client profile directory (e.g., `DayZServer/profiles/`) | Yes |
| `$saves:` | Uložte directory | Yes |
| `$mission:` | Current mission folder (e.g., `mpmissions/dayzOffline.chernarusplus/`) | Přečtěte typicky |
| `$CurrentDir:` | Current working directory | Depends |
| No prefix | Relative to game root | Přečtěte pouze |

> **Important:** Most file write operations are restricted to `$profile:` and `$saves:`. Attempting to write elsewhere may tiše fail.

---

## File Existence Check

```c
proto bool FileExist(string name);
```

Returns `true` if soubor exists at the given path.

**Example:**

```c
if (FileExist("$profile:MyMod/config.json"))
{
    Print("Config file found");
}
else
{
    Print("Config file not found, creating defaults");
}
```

---

## Opening & Closing Files

```c
proto FileHandle OpenFile(string name, FileMode mode);
proto void CloseFile(FileHandle file);
```

### FileMode Enum

```c
enum FileMode
{
    READ,     // Open for reading (file must exist)
    WRITE,    // Open for writing (creates new / overwrites existing)
    APPEND    // Open for appending (creates if not exists)
}
```

`FileHandle` is an integer handle. A return value of `0` indicates failure.

**Example:**

```c
FileHandle fh = OpenFile("$profile:MyMod/log.txt", FileMode.WRITE);
if (fh != 0)
{
    // File opened successfully
    // ... do work ...
    CloseFile(fh);
}
```

> **Critical:** Vždy call `CloseFile()` when done. Failure to close files can cause data loss and resource leaks.

---

## Writing Files

### FPrintln (Zapište Line)

```c
proto void FPrintln(FileHandle file, void var);
```

Writes hodnota followed by a novýline character.

### FPrint (Zapište Bez Newline)

```c
proto void FPrint(FileHandle file, void var);
```

Writes hodnota without a trailing novýline.

**Příklad --- write a log file:**

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

## Reading Files

### FGets (Přečtěte Line)

```c
proto int FGets(FileHandle file, string var);
```

Reads one line from soubor into `var`. Returns the number of characters read, or `-1` at end of file.

**Příklad --- read a file line by line:**

```c
void ReadConfigFile()
{
    FileHandle fh = OpenFile("$profile:MyMod/settings.txt", FileMode.READ);
    if (fh != 0)
    {
        string line;
        while (FGets(fh, line) >= 0)
        {
            Print("Line: " + line);
            ProcessLine(line);
        }
        CloseFile(fh);
    }
}
```

### ReadFile (Raw Binary Read)

```c
proto int ReadFile(FileHandle file, void param_array, int length);
```

Reads raw bytes into a buffer. Used for binary data.

---

## Directory Operations

### MakeDirectory

```c
proto native bool MakeDirectory(string name);
```

Creates a directory. Returns `true` on success. Creates pouze the final directory --- parent directories must již exist.

**Příklad --- ensure directory structure:**

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

Deletes a file. Only works in `$profile:` and `$saves:` directories.

### CopyFile

```c
proto native bool CopyFile(string sourceName, string destName);
```

Copies a file from source to destination.

**Example:**

```c
// Backup before overwriting
if (FileExist("$profile:MyMod/config.json"))
{
    CopyFile("$profile:MyMod/config.json", "$profile:MyMod/config.json.bak");
}
```

---

## File Enumeration (FindFile / FindNextFile)

Enumerate files matching a pattern in a directory.

```c
proto FindFileHandle FindFile(string pattern, out string fileName,
                               out FileAttr fileAttributes, FindFileFlags flags);
proto bool FindNextFile(FindFileHandle handle, out string fileName,
                         out FileAttr fileAttributes);
proto native void CloseFindFile(FindFileHandle handle);
```

### FileAttr Enum

```c
enum FileAttr
{
    DIRECTORY,   // Entry is a directory
    HIDDEN,      // Entry is hidden
    READONLY,    // Entry is read-only
    INVALID      // Invalid entry
}
```

### FindFileFlags Enum

```c
enum FindFileFlags
{
    DIRECTORIES,  // Return only directories
    ARCHIVES,     // Return only files
    ALL           // Return both
}
```

**Příklad --- enumerate all JSON files in a directory:**

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
        // Process first result
        if (!(fileAttr & FileAttr.DIRECTORY))
        {
            Print("Found: " + fileName);
        }

        // Process remaining results
        while (FindNextFile(handle, fileName, fileAttr))
        {
            if (!(fileAttr & FileAttr.DIRECTORY))
            {
                Print("Found: " + fileName);
            }
        }

        CloseFindFile(handle);
    }
}
```

> **Important:** `FindFile` returns jen soubor name, not the plný path. You must prepend the directory path yourself when processing soubors.

**Příklad --- count files in a directory:**

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

## JsonFileLoader (Generic JSON)

**Soubor:** `3_Game/tools/jsonfileloader.c` (173 lines)

The doporučený way to load and save JSON data. Works with jakýkoli class that has public fields.

### Modern API (Preferred)

```c
class JsonFileLoader<Class T>
{
    // Load JSON file into object
    static bool LoadFile(string filename, out T data, out string errorMessage);

    // Save object to JSON file
    static bool SaveFile(string filename, T data, out string errorMessage);

    // Parse JSON string into object
    static bool LoadData(string string_data, out T data, out string errorMessage);

    // Serialize object to JSON string
    static bool MakeData(T inputData, out string outputData,
                          out string errorMessage, bool prettyPrint = true);
}
```

All methods return `bool` --- `true` on success, `false` on failure with the error in `errorMessage`.

### Legacy API (Deprecated)

```c
class JsonFileLoader<Class T>
{
    static void JsonLoadFile(string filename, out T data);    // Returns void!
    static void JsonSaveFile(string filename, T data);
    static void JsonLoadData(string string_data, out T data);
    static string JsonMakeData(T data);
}
```

> **Critical Gotcha:** `JsonLoadFile()` returns `void`. You CANNOT use it in an `if` condition:
> ```c
> // WRONG - will not compile or will vždy be false
> if (JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg)) { }
>
> // CORRECT - use the modern LoadFile() which returns bool
> if (JsonFileLoader<MyConfig>.LoadFile(path, cfg, error)) { }
> ```

### Data Class Requirements

The target class must have **public fields** with výchozí values. The JSON serializer maps field names přímo to JSON keys.

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

This produces JSON:

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

### Complete Load/Uložte Example

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
            Save();  // Create default config
            return;
        }

        string error;
        if (!JsonFileLoader<MyModConfig>.LoadFile(CONFIG_PATH, m_Config, error))
        {
            Print("[MyMod] Config load error: " + error);
            m_Config = new MyModConfig();  // Reset to defaults
            Save();
        }
    }

    void Save()
    {
        string error;
        if (!JsonFileLoader<MyModConfig>.SaveFile(CONFIG_PATH, m_Config, error))
        {
            Print("[MyMod] Config save error: " + error);
        }
    }

    MyModConfig GetConfig()
    {
        return m_Config;
    }
}
```

---

## JsonSerializer (Direct Use)

**Soubor:** `3_Game/gameplay.c`

For cases where potřebujete to serialize/deserialize JSON strings přímo without file operations:

```c
class JsonSerializer : Serializer
{
    proto bool WriteToString(void variable_out, bool nice, out string result);
    proto bool ReadFromString(void variable_in, string jsonString, out string error);
}
```

**Example:**

```c
MyConfig cfg = new MyConfig();
cfg.MaxPlayers = 100;

JsonSerializer js = new JsonSerializer();

// Serialize to string
string jsonOutput;
js.WriteToString(cfg, true, jsonOutput);  // true = pretty print
Print(jsonOutput);

// Deserialize from string
MyConfig parsed = new MyConfig();
string parseError;
js.ReadFromString(parsed, jsonOutput, parseError);
Print("MaxPlayers: " + parsed.MaxPlayers);
```

---

## Shrnutí

| Operation | Function | Notes |
|-----------|----------|-------|
| Zkontrolujte exists | `FileExist(path)` | Returns bool |
| Otevřete | `OpenFile(path, FileMode)` | Returns handle (0 = fail) |
| Zavřete | `CloseFile(handle)` | Vždy call when done |
| Zapište line | `FPrintln(handle, data)` | With novýline |
| Zapište | `FPrint(handle, data)` | Bez novýline |
| Přečtěte line | `FGets(handle, out line)` | Returns -1 at EOF |
| Make dir | `MakeDirectory(path)` | Single level pouze |
| Delete | `DeleteFile(path)` | Only `$profile:` / `$saves:` |
| Copy | `CopyFile(src, dst)` | -- |
| Find files | `FindFile(pattern, ...)` | Returns handle, iterate with `FindNextFile` |
| JSON load | `JsonFileLoader<T>.LoadFile(path, data, error)` | Modern API, returns bool |
| JSON save | `JsonFileLoader<T>.SaveFile(path, data, error)` | Modern API, returns bool |
| JSON string | `JsonSerializer.WriteToString()` / `ReadFromString()` | Direct string operations |

| Koncept | Klíčový bod |
|---------|-----------|
| Path prefixes | `$profile:` (writable), `$mission:` (read), `$saves:` (writable) |
| JsonLoadFile | **Returns void** --- use `LoadFile()` (bool) místo toho |
| Data classes | Public fields with výchozís, `ref` for arrays/maps |
| Vždy close | Every `OpenFile` must have a matching `CloseFile` |
| FindFile | Returns pouze filenames, not plný paths |

---

## Osvědčené postupy

- **Vždy wrap file operations in existence checks and close handles in all code paths.** An unclosed `FileHandle` leaks resources and can prevent soubor from being written to disk. Use guard patterns: check `fh != 0`, do work, then `CloseFile(fh)` before každý `return`.
- **Use the modern `JsonFileLoader<T>.LoadFile()` (returns bool) místo the legacy `JsonLoadFile()` (returns void).** The legacy API cannot report errors, and attempting to use its void return in a condition tiše fails.
- **Vytvořte directories with `MakeDirectory()` in order from parent to child.** `MakeDirectory` pouze creates the final directory segment. `MakeDirectory("$profile:A/B/C")` fails if `A/B` ne exist. Vytvořte každý level sequentially.
- **Use `CopyFile()` to create backups before overwriting config files.** JSON parse errors from corrupted saves are unrecoverable. A `.bak` copy lets server owners restore the last good state.
- **Remember that `FindFile()` returns pouze filenames, not plný paths.** You must concatenate the directory prefix yourself when loading files found via `FindFile`/`FindNextFile`.

---

## Kompatibilita a dopad

> **Kompatibilita modů:** File I/O is inherently isolated per mod when každý mod uses its own `$profile:` subdirectory. Conflicts occur pouze when two mods read/write the stejný file path.

- **Pořadí načítání:** File I/O has no load-order dependency. Mods read and write independently.
- **Konflikty modifikovaných tříd:** No class conflicts. The risk is two mods using the stejný `$profile:` subdirectory name or filename, causing data corruption.
- **Dopad na výkon:** JSON serialization via `JsonFileLoader` is synchronous and blocks the main thread. Loading large JSON files (>100KB) during gameplay causes frame hitches. Načtěte configs in `OnInit()` or `OnMissionStart()`, nikdy in `OnUpdate()`.
- **Server/klient:** File writes are restricted to `$profile:` and `$saves:`. On clients, `$profile:` points to klient profile directory. On dedicated servers, it points to server profile. `$mission:` is typicky read-only na obou stranách.

---

## Pozorováno v reálných modech

> These patterns were confirmed by studying the source code of professional DayZ mods.

| Vzor | Mod | Soubor/Umístění |
|---------|-----|---------------|
| `MakeDirectory` chain + `FileExist` check + `LoadFile` with fallback to výchozís | Expansion | Settings manager (`ExpansionSettings`) |
| `CopyFile` backup before config save | COT | Permission file management |
| `FindFile`/`FindNextFile` to enumerate per-player JSON files in `$profile:` | VPP Admin Tools | Player data loader |
| `JsonSerializer.WriteToString()` for RPC payload serialization (no file) | Dabs Framework | Network config sync |

---

[<< Předchozí: Časovače a CallQueue](07-timers.md) | **Souborové I/O a JSON** | [Další: Síťování a RPC >>](09-networking.md)
