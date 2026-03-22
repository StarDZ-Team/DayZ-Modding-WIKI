# Chapter 6.8: File I/O & JSON

[Home](../README.md) | [<< Previous: Timers & CallQueue](07-timers.md) | **File I/O & JSON** | [Next: Networking & RPC >>](09-networking.md)

---

## Bevezetes

DayZ provides file I/O operations for reading and writing text files, JSON serialization/deserialization, directory management, and file enumeration. All file operations use special path prefixes (`$profile:`, `$saves:`, `$mission:`) rather than absolute filesystem paths. This chapter covers every file operation available in Enforce Script.

---

## Path Prefixes

| Prefix | Location | Writable |
|--------|----------|----------|
| `$profile:` | Server/client profile directory (e.g., `DayZServer/profiles/`) | Yes |
| `$saves:` | Save directory | Yes |
| `$mission:` | Current mission folder (e.g., `mpmissions/dayzOffline.chernarusplus/`) | Read typically |
| `$CurrentDir:` | Current working directory | Depends |
| No prefix | Relative to game root | Read only |

> **Fontos:** Most file write operations are restricted to `$profile:` and `$saves:`. Attempting to write elsewhere may silently fail.

---

## File Existence Check

```c
proto bool FileExist(string name);
```

Returns `true` if the file exists at the given path.

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

> **Critical:** Always call `CloseFile()` when done. Failure to close files can cause data loss and resource leaks.

---

## Writing Files

### FPrintln (Write Line)

```c
proto void FPrintln(FileHandle file, void var);
```

Writes the value followed by a newline character.

### FPrint (Write Without Newline)

```c
proto void FPrint(FileHandle file, void var);
```

Writes the value without a trailing newline.

**Example --- write a log file:**

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

### FGets (Read Line)

```c
proto int FGets(FileHandle file, string var);
```

Reads one line from the file into `var`. Returns the number of characters read, or `-1` at end of file.

**Example --- read a file line by line:**

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

Creates a directory. Returns `true` on success. Creates only the final directory --- parent directories must already exist.

**Example --- ensure directory structure:**

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

**Example --- enumerate all JSON files in a directory:**

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

> **Fontos:** `FindFile` returns just the file name, not the full path. You must prepend the directory path yourself when processing the files.

**Example --- count files in a directory:**

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

**File:** `3_Game/tools/jsonfileloader.c` (173 lines)

The recommended way to load and save JSON data. Works with any class that has public fields.

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
> // WRONG - will not compile or will always be false
> if (JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg)) { }
>
> // CORRECT - use the modern LoadFile() which returns bool
> if (JsonFileLoader<MyConfig>.LoadFile(path, cfg, error)) { }
> ```

### Data Class Requirements

The target class must have **public fields** with default values. The JSON serializer maps field names directly to JSON keys.

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

### Complete Load/Save Example

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

**File:** `3_Game/gameplay.c`

For cases where you need to serialize/deserialize JSON strings directly without file operations:

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

## Osszefoglalas

| Muvelet | Function | Megjegyzesek |
|-----------|----------|-------|
| Check exists | `FileExist(path)` | Returns bool |
| Open | `OpenFile(path, FileMode)` | Returns handle (0 = fail) |
| Close | `CloseFile(handle)` | Always call when done |
| Write line | `FPrintln(handle, data)` | With newline |
| Write | `FPrint(handle, data)` | Without newline |
| Read line | `FGets(handle, out line)` | Returns -1 at EOF |
| Make dir | `MakeDirectory(path)` | Single level only |
| Delete | `DeleteFile(path)` | Only `$profile:` / `$saves:` |
| Copy | `CopyFile(src, dst)` | -- |
| Find files | `FindFile(pattern, ...)` | Returns handle, iterate with `FindNextFile` |
| JSON load | `JsonFileLoader<T>.LoadFile(path, data, error)` | Modern API, returns bool |
| JSON save | `JsonFileLoader<T>.SaveFile(path, data, error)` | Modern API, returns bool |
| JSON string | `JsonSerializer.WriteToString()` / `ReadFromString()` | Direct string operations |

| Fogalom | Kulcspont |
|---------|-----------|
| Path prefixes | `$profile:` (writable), `$mission:` (read), `$saves:` (writable) |
| JsonLoadFile | **Returns void** --- use `LoadFile()` (bool) instead |
| Data classes | Public fields with defaults, `ref` for arrays/maps |
| Always close | Every `OpenFile` must have a matching `CloseFile` |
| FindFile | Returns only filenames, not full paths |

---

[<< Elozo: Idozitok & CallQueue](07-timers.md) | **Fajl I/O & JSON** | [Kovetkezo: Halozatkezeles & RPC >>](09-networking.md)
