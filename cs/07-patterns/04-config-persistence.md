# Chapter 7.4: Config Persistence

[Domů](../README.md) | [<< Předchozí: Vzory RPC](03-rpc-patterns.md) | **Perzistence konfigurace** | [Další: Permission Systems >>](05-permissions.md)

---

## Úvod

Almost každý DayZ mod needs to save and load configuration data: server settings, spawn tables, ban lists, player data, teleport locations. Engine provides `JsonFileLoader` for simple JSON serialization and raw file I/O (`FileHandle`, `FPrintln`) for každýthing else. Professional mods layer config versioning and auto-migration on top.

This chapter covers the standard patterns for config persistence, from basic JSON load/save through versioned migration systems, directory management, and auto-save timers.

---

## Obsah

- [JsonFileLoader Pattern](#jsonfileloader-pattern)
- [Manual JSON Writing (FPrintln)](#manual-json-writing-fprintln)
- [The $profile Path](#the-profile-path)
- [Directory Creation](#directory-creation)
- [Config Data Classes](#config-data-classes)
- [Config Versioning and Migration](#config-versioning-and-migration)
- [Auto-Uložte Timers](#auto-save-timers)
- [Běžné Mistakes](#common-mistakes)
- [Best Practices](#best-practices)

---

## JsonFileLoader Pattern

`JsonFileLoader` is engine's vestavěný serializer. It converts mezi Enforce Script objects and JSON files using reflection --- it reads the public fields of your class and maps them to JSON keys automatickýally.

### Critical Gotcha

**`JsonFileLoader<T>.JsonLoadFile()` and `JsonFileLoader<T>.JsonSaveFile()` return `void`.** You cannot check their return value. You cannot assign them to a `bool`. You cannot use them in an `if` condition. This is one of the většina common mistakes in DayZ modding.

```c
// WRONG — will not compile
bool success = JsonFileLoader<MyConfig>.JsonLoadFile(path, config);

// WRONG — will not compile
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config))
{
    // ...
}

// RIGHT — call and then check the object state
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
// Check if the data was actually populated
if (config.m_ServerName != "")
{
    // Data loaded successfully
}
```

### Basic Load/Save

```c
// Data class — public fields are serialized to/from JSON
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
            // First run: save defaults
            Save();
        }
    }

    void Save()
    {
        JsonFileLoader<ServerSettings>.JsonSaveFile(SETTINGS_PATH, m_Settings);
    }
};
```

### What Gets Serialized

`JsonFileLoader` serializes **all public fields** of the object. It ne serialize:
- Private or protected fields
- Methods
- Static fields
- Transient/runtime-only fields (there is no `[NonSerialized]` attribute --- use access modifiers)

The resulting JSON looks like:

```json
{
    "ServerName": "My DayZ Server",
    "MaxPlayers": 60,
    "RestartInterval": 14400.0,
    "PvPEnabled": true
}
```

### Supported Field Types

| Type | JSON Representation |
|------|-------------------|
| `int` | Number |
| `float` | Number |
| `bool` | `true` / `false` |
| `string` | String |
| `vector` | Array of 3 numbers |
| `array<T>` | JSON array |
| `map<string, T>` | JSON object (string keys pouze) |
| Nested class | Nested JSON object |

### Nested Objects

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

Produces:

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

## Manual JSON Writing (FPrintln)

Sometimes `JsonFileLoader` is not flexible enough: it cannot handle arrays of mixed types, vlastní formatting, or non-class data structures. In those cases, use raw file I/O.

### Basic Pattern

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

### Reading Raw Files

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
        // Process line...
    }

    CloseFile(file);
}
```

### When to Use Manual I/O

- Writing log files (append mode)
- Writing CSV or plain-text exports
- Custom JSON formatting that `JsonFileLoader` cannot produce
- Parsing non-JSON file formats (e.g., DayZ's `.map` or `.xml` files)

For standard config files, prefer `JsonFileLoader`. It is faster to implement, less error-prone, and automatickýally handles nested objects.

---

## The $profile Path

DayZ provides the `$profile:` path prefix, which resolves to server's profile directory (typicky the folder containing `DayZServer_x64.exe`, or the profile path specified with `-profiles=`).

```c
// These resolve to the profile directory:
"$profile:MyMod/config.json"       // → C:/DayZServer/MyMod/config.json
"$profile:MyMod/Players/data.json" // → C:/DayZServer/MyMod/Players/data.json
```

### Vždy Use $profile

Nikdy use absolute paths. Nikdy use relative paths. Vždy use `$profile:` for jakýkoli file your mod creates or reads za běhu:

```c
// BAD: Absolute path — breaks on any other machine
const string CONFIG_PATH = "C:/DayZServer/MyMod/config.json";

// BAD: Relative path — depends on working directory, which varies
const string CONFIG_PATH = "MyMod/config.json";

// GOOD: $profile resolves correctly everywhere
const string CONFIG_PATH = "$profile:MyMod/config.json";
```

### Conventional Directory Structure

Most mods follow this convention:

```
$profile:
  └── YourModName/
      ├── Config.json          (main server config)
      ├── Permissions.json     (admin permissions)
      ├── Logs/
      │   └── 2025-01-15.log   (daily log files)
      └── Players/
          ├── 76561198xxxxx.json
          └── 76561198yyyyy.json
```

---

## Directory Creation

Před writing a file, musíte ensure its parent directory exists. DayZ ne auto-create directories.

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

### Important: MakeDirectory Is Not Recursive

`MakeDirectory` creates pouze the final directory in cesta. Pokud parent ne exist, it fails tiše. You must create každý level:

```c
// WRONG: Parent "MyMod" doesn't exist yet
MakeDirectory("$profile:MyMod/Data/Players");  // Fails silently

// RIGHT: Create each level
MakeDirectory("$profile:MyMod");
MakeDirectory("$profile:MyMod/Data");
MakeDirectory("$profile:MyMod/Data/Players");
```

### Konstanty for Paths Pattern

A framework mod defines all paths as constants in a dedicated class:

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

This avoids path string duplication across the codebase and makes it easy to find každý file your mod touches.

---

## Config Data Classes

A well-designed config data class provides výchozí values, version tracking, and clear documentation of každý field.

### Basic Pattern

```c
class MyModConfig
{
    // Version tracking for migrations
    int ConfigVersion = 3;

    // Gameplay settings with sensible defaults
    bool EnableFeatureX = true;
    int MaxEntities = 50;
    float SpawnRadius = 500.0;
    string WelcomeMessage = "Welcome to the server!";

    // Complex settings
    ref array<string> AllowedWeapons = new array<string>();
    ref map<string, float> ZoneRadii = new map<string, float>();

    void MyModConfig()
    {
        // Initialize collections with defaults
        AllowedWeapons.Insert("AK74");
        AllowedWeapons.Insert("M4A1");

        ZoneRadii.Set("safe_zone", 100.0);
        ZoneRadii.Set("pvp_zone", 500.0);
    }
};
```

### Reflective ConfigBase Pattern

This pattern uses a reflective config system where každý config class declares its fields as descriptors. This allows the admin panel to auto-generate UI for jakýkoli config without hardcoded field names:

```c
// Conceptual pattern (reflective config):
class MyConfigBase
{
    // Each config declares its version
    int ConfigVersion;
    string ModId;

    // Subclasses override to declare their fields
    void Init(string modId)
    {
        ModId = modId;
    }

    // Reflection: get all configurable fields
    array<ref MyConfigField> GetFields();

    // Dynamic get/set by field name (for admin panel sync)
    string GetFieldValue(string fieldName);
    void SetFieldValue(string fieldName, string value);

    // Hooks for custom logic on load/save
    void OnAfterLoad() {}
    void OnBeforeSave() {}
};
```

### VPP ConfigurablePlugin Pattern

VPP merges config management přímo into the plugin lifecycle:

```c
// VPP pattern (simplified):
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
        // ConfigurablePlugin.LoadConfig() handles the JSON load
        super.OnInit();
    }
};
```

---

## Config Versioning and Migration

As your mod evolves, config structures change. You add fields, remove fields, rename fields, change výchozís. Bez versioning, users with old config files will tiše get wrong values or crash.

### The Version Field

Every config class should have an integer version field:

```c
class MyModConfig
{
    int ConfigVersion = 5;  // Increment when the structure changes
    // ...
};
```

### Migration on Load

When loading a config, compare the on-disk version with the current code version. If they differ, run migrations:

```c
void LoadConfig()
{
    MyModConfig config = new MyModConfig();  // Has current defaults

    if (FileExist(CONFIG_PATH))
    {
        JsonFileLoader<MyModConfig>.JsonLoadFile(CONFIG_PATH, config);

        if (config.ConfigVersion < CURRENT_VERSION)
        {
            MigrateConfig(config);
            config.ConfigVersion = CURRENT_VERSION;
            SaveConfig(config);  // Re-save with updated version
        }
    }
    else
    {
        SaveConfig(config);  // First run: write defaults
    }

    m_Config = config;
}
```

### Migration Functions

```c
static const int CURRENT_VERSION = 5;

void MigrateConfig(MyModConfig config)
{
    // Run each migration step sequentially
    if (config.ConfigVersion < 2)
    {
        // v1 → v2: "SpawnDelay" was renamed to "RespawnInterval"
        // Old field is lost on load; set new default
        config.RespawnInterval = 300.0;
    }

    if (config.ConfigVersion < 3)
    {
        // v2 → v3: Added "EnableNotifications" field
        config.EnableNotifications = true;
    }

    if (config.ConfigVersion < 4)
    {
        // v3 → v4: "MaxZombies" default changed from 100 to 200
        if (config.MaxZombies == 100)
        {
            config.MaxZombies = 200;  // Only update if user hadn't changed it
        }
    }

    if (config.ConfigVersion < 5)
    {
        // v4 → v5: "DifficultyMode" changed from int to string
        // config.DifficultyMode = "Normal"; // Set new default
    }

    MyLog.Info("Config", "Migrated config from v"
        + config.ConfigVersion.ToString() + " to v" + CURRENT_VERSION.ToString());
}
```

### Expansion's Migration Example

Expansion is known for aggressive config evolution. Some Expansion configs have gone through 17+ versions. Their pattern:
1. Každý version bump has a dedicated migration function
2. Migrations run in order (1 to 2, then 2 to 3, then 3 to 4, etc.)
3. Each migration pouze changes what is nutný for that version step
4. The final version number is written to disk after all migrations complete

Toto je gold standard for config versioning in DayZ mods.

---

## Auto-Uložte Timers

For configs that change za běhu (admin edits, player data accumulation), implement an auto-save timer to prevent data loss on crashes.

### Timer-Based Auto-Save

```c
class MyDataManager
{
    protected const float AUTOSAVE_INTERVAL = 300.0;  // 5 minutes
    protected float m_AutosaveTimer;
    protected bool m_Dirty;  // Has data changed since last save?

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
        // Always save on shutdown, even if timer hasn't fired
        if (m_Dirty)
        {
            Save();
            m_Dirty = false;
        }
    }
};
```

### Dirty Flag Optimization

Only write to disk when data has actually changed. File I/O is expensive. If nothing changed, skip the save:

```c
void UpdateSetting(string key, string value)
{
    if (m_Settings.Get(key) == value) return;  // No change, no save

    m_Settings.Set(key, value);
    MarkDirty();
}
```

### Uložte on Critical Events

In addition to timed saves, save okamžitě after critical operations:

```c
void BanPlayer(string uid, string reason)
{
    m_BanList.Insert(uid);
    Save();  // Immediate save — bans must survive crashes
}
```

---

## Časté chyby

### 1. Treating JsonLoadFile as if It Returns a Value

```c
// WRONG — does not compile
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config)) { ... }
```

`JsonLoadFile` returns `void`. Call it, then check the object's state.

### 2. Not Checking FileExist Před Loading

```c
// WRONG — crashes or produces empty object with no diagnostic
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);

// RIGHT — check first, create defaults if missing
if (!FileExist("$profile:MyMod/Config.json"))
{
    SaveDefaults();
    return;
}
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);
```

### 3. Forgetting to Vytvořte Directories

`JsonSaveFile` fails tiše if the directory ne exist. Vždy ensure directories before saving.

### 4. Public Fields You Did Not Intend to Serialize

Every `public` field on a config class ends up in the JSON. Pokud have runtime-only fields, make them `protected` or `private`:

```c
class MyConfig
{
    // These go to JSON:
    int MaxPlayers = 60;
    string ServerName = "My Server";

    // This does NOT go to JSON (protected):
    protected bool m_Loaded;
    protected float m_LastSaveTime;
};
```

### 5. Backslash and Quote Characters in JSON Values

Enforce Script's CParser has trouble with `\\` and `\"` in string literals. Vyhněte se storing file paths with backslashes in configs. Use forward slashes:

```c
// BAD — backslashes may break parsing
string LogPath = "C:\\DayZ\\Logs\\server.log";

// GOOD — forward slashes work everywhere
string LogPath = "$profile:MyMod/Logs/server.log";
```

---

## Osvědčené postupy

1. **Use `$profile:` for all file paths.** Nikdy hardcode absolute paths.

2. **Vytvořte directories before writing files.** Zkontrolujte with `FileExist()`, create with `MakeDirectory()`, one level at a time.

3. **Vždy provide výchozí values in your config class constructor or field initializers.** This ensures first-run configs are sensible.

4. **Version your configs from day one.** Adding a `ConfigVersion` field costs nothing and saves hours of debugging later.

5. **Separate config data classes from manager classes.** The data class is a dumb container; the manager handles load/save/sync logic.

6. **Use auto-save with a dirty flag.** Do not write to disk každý time a value changes --- batch writes on a timer.

7. **Uložte on mission finish.** The auto-save timer is a safety net, not the primary save. Vždy save during `OnMissionFinish()`.

8. **Define path constants in one place.** A `MyModConst` class with all paths prevents string duplication and makes path changes trivial.

9. **Log load/save operations.** When debugging config issues, a log line saying "Loaded config v3 from $profile:MyMod/Config.json" is invaluable.

10. **Testujte with a deleted config file.** Your mod should handle first-run gracefully: create directories, write výchozís, log what it did.

---

## Kompatibilita a dopad

- **Více modů:** Each mod writes to its own `$profile:ModName/` directory. Conflicts pouze happen if two mods use the stejný directory name. Use a unique, recognizable prefix for your mod's folder.
- **Pořadí načítání:** Config loading happens in `OnInit` or `OnMissionStart`, both controlled by the mod's own lifecycle. No cross-mod load-order issues unless two mods try to read/write the same file (which they should never do).
- **Listen Server:** Config files are server-side pouze (`$profile:` resolves on server). On listen servers, client-side code can technically access `$profile:`, but configs should pouze be loaded by server modules to avoid ambiguity.
- **Výkon:** `JsonFileLoader` is synchronous and blocks the main thread. For large configs (100+ KB), load during `OnInit` (before gameplay starts). Auto-save timers prevent repeated writes; the dirty-flag pattern ensures disk I/O pouze happens when data has actually changed.
- **Migration:** Adding nový fields to a config class is safe --- `JsonFileLoader` ignores chybějící JSON keys and leaves třída výchozí value. Removing or renaming fields requires a versioned migration step to avoid silent data loss.

---

## Teorie vs praxe

| Textbook Says | DayZ Reality |
|---------------|-------------|
| Use async file I/O to avoid blocking | Enforce Script has no async file I/O; all reads/writes are synchronous. Načtěte při startu, save on timers. |
| Validate JSON with a schema | No JSON schema platnýation exists; platnýate fields in `OnAfterLoad()` or with guard clauses after loading. |
| Use a database for structured data | No database access from Enforce Script; JSON files in `$profile:` are the pouze persistence mechanism. |

---

[Domů](../README.md) | [<< Předchozí: Vzory RPC](03-rpc-patterns.md) | **Perzistence konfigurace** | [Další: Permission Systems >>](05-permissions.md)
