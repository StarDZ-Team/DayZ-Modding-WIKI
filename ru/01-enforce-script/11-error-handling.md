# Глава 1.11 — Обработка ошибок


> **Цель:** Научиться обрабатывать ошибки в языке без try/catch. Освоить защитные проверки, защитное программирование и паттерны структурированного логирования для стабильности мода.


---

## Содержание


- [The Fundamental Rule: No try/catch](#the-fundamental-rule-no-trycatch)
- [Guard Clause Pattern](#guard-clause-pattern)
  - [Single Guard](#single-guard)
  - [Multiple Guards (Stacked)](#multiple-guards-stacked)
  - [Guard With Logging](#guard-with-logging)
- [Null Checking](#null-checking)
  - [Before Every Operation](#before-every-operation)
  - [Chained Null Checks](#chained-null-checks)
  - [The notnull Keyword](#the-notnull-keyword)
- [ErrorEx — Engine Error Reporting](#errorex--engine-error-reporting)
  - [Severity Levels](#severity-levels)
  - [When to Use Each Level](#when-to-use-each-level)
- [DumpStackString — Stack Traces](#dumpstackstring--stack-traces)
- [Debug Printing](#debug-printing)
  - [Basic Print](#basic-print)
  - [Conditional Debug with #ifdef](#conditional-debug-with-ifdef)
- [Structured Logging Patterns](#structured-logging-patterns)
  - [Simple Prefix Pattern](#simple-prefix-pattern)
  - [Level-Based Logger Class](#level-based-logger-class)
  - [MyLog Style (Production Pattern)](#mylog-style-production-pattern)
- [Real-World Examples](#real-world-examples)
  - [Safe Function With Multiple Guards](#safe-function-with-multiple-guards)
  - [Safe Config Loading](#safe-config-loading)
  - [Safe RPC Handler](#safe-rpc-handler)
  - [Safe Inventory Operation](#safe-inventory-operation)
- [Defensive Patterns Summary](#defensive-patterns-summary)
- [Common Mistakes](#common-mistakes)
- [Summary](#summary)
- [Navigation](#navigation)

---

## Фундаментальное правило: нет try/catch


Enforce Script has **no exception handling**. There is no `try`, no `catch`, no `throw`, no `finally`. If something goes wrong at runtime (null dereference, invalid cast, array out of bounds), the engine either:

1. **Crashes silently** — the function stops executing, no error message
2. **Logs a script error** — visible in the `.RPT` log file
3. **Crashes the server/client** — in severe cases

Это означает **every potential failure point must be guarded manually**. The primary defense is the **guard clause pattern**.

---

## Паттерн защитных проверок


A guard clause checks a precondition at the top of a function and returns early if it fails. This keeps the "happy path" un-nested and readable.

### Одиночная проверка


```c
void TeleportPlayer(PlayerBase player, vector destination)
{
    if (!player)
        return;

    player.SetPosition(destination);
}
```

### Множественные проверки (стек)


Stack guards at the top of the function — each checks one precondition:

```c
void GiveItemToPlayer(PlayerBase player, string className, int quantity)
{
    // Guard 1: player exists
    if (!player)
        return;

    // Guard 2: player is alive
    if (!player.IsAlive())
        return;

    // Guard 3: valid class name
    if (className == "")
        return;

    // Guard 4: valid quantity
    if (quantity <= 0)
        return;

    // All preconditions met — safe to proceed
    for (int i = 0; i < quantity; i++)
    {
        player.GetInventory().CreateInInventory(className);
    }
}
```

### Проверка с логированием


In production code, always log why a guard triggered — silent failures are hard to debug:

```c
void StartMission(PlayerBase initiator, string missionId)
{
    if (!initiator)
    {
        Print("[Missions] ERROR: StartMission called with null initiator");
        return;
    }

    if (missionId == "")
    {
        Print("[Missions] ERROR: StartMission called with empty missionId");
        return;
    }

    if (!initiator.IsAlive())
    {
        Print("[Missions] WARN: Player " + initiator.GetIdentity().GetName() + " is dead, cannot start mission");
        return;
    }

    // Proceed with mission start
    Print("[Missions] Starting mission " + missionId);
    // ...
}
```

---

## Проверка на null


Null references are the most common crash source in DayZ modding. Every reference type can be `null`.

### Перед каждой операцией


```c
// WRONG — crashes if player, identity, or name is null at any point
string name = player.GetIdentity().GetName();

// CORRECT — check at each step
if (!player)
    return;

PlayerIdentity identity = player.GetIdentity();
if (!identity)
    return;

string name = identity.GetName();
```

### Цепочка проверок на null


When you need to traverse a chain of references, check each link:

```c
void PrintHandItemName(PlayerBase player)
{
    if (!player)
        return;

    HumanInventory inv = player.GetHumanInventory();
    if (!inv)
        return;

    EntityAI handItem = inv.GetEntityInHands();
    if (!handItem)
        return;

    Print("Player is holding: " + handItem.GetType());
}
```

### Ключевое слово notnull


`notnull` is a parameter modifier that makes the compiler reject `null` arguments at the call site:

```c
void ProcessItem(notnull EntityAI item)
{
    // Compiler guarantees item is not null
    // No null check needed inside the function
    Print(item.GetType());
}

// Usage:
EntityAI item = GetSomeItem();
if (item)
{
    ProcessItem(item);  // OK — compiler knows item is not null here
}
ProcessItem(null);      // Compile error!
```

> **Limitation:** `notnull` only catches literal `null` and obviously-null variables at the call site. It does not prevent a variable that was non-null at check time from becoming null due to engine deletion.

---

## ErrorEx — отчёты об ошибках движка


`ErrorEx` writes an error message to the script log (`.RPT` file). It does **not** stop execution or throw an exception.

```c
ErrorEx("Something went wrong");
```

### Уровни серьёзности


`ErrorEx` accepts an optional second parameter of type `ErrorExSeverity`:

```c
// INFO — informational, not an error
ErrorEx("Config loaded successfully", ErrorExSeverity.INFO);

// WARNING — potential problem, execution continues
ErrorEx("Config file not found, using defaults", ErrorExSeverity.WARNING);

// ERROR — definite problem (default severity if omitted)
ErrorEx("Failed to create object: class not found");
ErrorEx("Critical failure in RPC handler", ErrorExSeverity.ERROR);
```

| Severity | When to Use |
|----------|-------------|
| `ErrorExSeverity.INFO` | Informational messages you want in the error log |
| `ErrorExSeverity.WARNING` | Recoverable problems (missing config, fallback used) |
| `ErrorExSeverity.ERROR` | Definite bugs or unrecoverable states |

### Когда использовать каждый уровень


```c
void LoadConfig(string path)
{
    if (!FileExist(path))
    {
        // WARNING — recoverable, we'll use defaults
        ErrorEx("Config not found at " + path + ", using defaults", ErrorExSeverity.WARNING);
        UseDefaultConfig();
        return;
    }

    MyConfig cfg = new MyConfig();
    JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);

    if (cfg.Version < EXPECTED_VERSION)
    {
        // INFO — not a problem, just noteworthy
        ErrorEx("Config version " + cfg.Version.ToString() + " is older than expected", ErrorExSeverity.INFO);
    }

    if (!cfg.Validate())
    {
        // ERROR — bad data that will cause problems
        ErrorEx("Config validation failed for " + path);
        UseDefaultConfig();
        return;
    }
}
```

---

## DumpStackString — трассировки стека


`DumpStackString` captures the current call stack as a string. This is crucial for diagnosing where an unexpected state occurred:

```c
void OnUnexpectedState(string context)
{
    string stack = DumpStackString();
    Print("[ERROR] Unexpected state in " + context);
    Print("[ERROR] Stack trace:");
    Print(stack);
}
```

Use it in guard clauses to trace the caller:

```c
void CriticalFunction(PlayerBase player)
{
    if (!player)
    {
        string stack = DumpStackString();
        ErrorEx("CriticalFunction called with null player! Stack: " + stack);
        return;
    }

    // ...
}
```

---

## Отладочный вывод


### Базовый Print


`Print()` writes to the script log file. It accepts any type:

```c
Print("Hello World");                    // string
Print(42);                               // int
Print(3.14);                             // float
Print(player.GetPosition());             // vector

// Formatted print
Print(string.Format("Player %1 at position %2 with %3 HP",
    player.GetIdentity().GetName(),
    player.GetPosition().ToString(),
    player.GetHealth("", "Health").ToString()
));
```

### Условная отладка с #ifdef


Wrap debug prints in preprocessor guards so they compile out of release builds:

```c
void ProcessAI(DayZInfected zombie)
{
    #ifdef DIAG_DEVELOPER
        Print(string.Format("[AI DEBUG] Processing %1 at %2",
            zombie.GetType(),
            zombie.GetPosition().ToString()
        ));
    #endif

    // Actual logic...
}
```

For mod-specific debug flags, define your own symbol:

```c
// In your config.cpp:
// defines[] = { "MYMOD_DEBUG" };

#ifdef MYMOD_DEBUG
    Print("[MyMod] Debug: item spawned at " + pos.ToString());
#endif
```

---

## Паттерны структурированного логирования


### Паттерн простого префикса


The simplest approach — prepend a tag to every Print call:

```c
class MissionManager
{
    static const string LOG_TAG = "[Missions] ";

    void Start()
    {
        Print(LOG_TAG + "Mission system starting");
    }

    void OnError(string msg)
    {
        Print(LOG_TAG + "ERROR: " + msg);
    }
}
```

### Класс логгера с уровнями


A reusable logger with severity levels:

```c
class ModLogger
{
    protected string m_Prefix;

    void ModLogger(string prefix)
    {
        m_Prefix = "[" + prefix + "] ";
    }

    void Info(string msg)
    {
        Print(m_Prefix + "INFO: " + msg);
    }

    void Warning(string msg)
    {
        Print(m_Prefix + "WARN: " + msg);
        ErrorEx(m_Prefix + msg, ErrorExSeverity.WARNING);
    }

    void Error(string msg)
    {
        Print(m_Prefix + "ERROR: " + msg);
        ErrorEx(m_Prefix + msg, ErrorExSeverity.ERROR);
    }

    void Debug(string msg)
    {
        #ifdef DIAG_DEVELOPER
            Print(m_Prefix + "DEBUG: " + msg);
        #endif
    }
}

// Usage:
ref ModLogger g_MissionLog = new ModLogger("Missions");
g_MissionLog.Info("System started");
g_MissionLog.Error("Failed to load mission data");
```

### Стиль MyLog (продакшен-паттерн)


For production mods, a static logging class with file output, daily rotation, and multiple output targets:

```c
// Enum for log levels
enum MyLogLevel
{
    TRACE   = 0,
    DEBUG   = 1,
    INFO    = 2,
    WARNING = 3,
    ERROR   = 4,
    NONE    = 5
};

class MyLog
{
    private static MyLogLevel s_FileMinLevel = MyLogLevel.DEBUG;
    private static MyLogLevel s_ConsoleMinLevel = MyLogLevel.INFO;

    // Usage: MyLog.Info("ModuleName", "Something happened");
    static void Info(string source, string message)
    {
        Log(MyLogLevel.INFO, source, message);
    }

    static void Warning(string source, string message)
    {
        Log(MyLogLevel.WARNING, source, message);
    }

    static void Error(string source, string message)
    {
        Log(MyLogLevel.ERROR, source, message);
    }

    private static void Log(MyLogLevel level, string source, string message)
    {
        if (level < s_ConsoleMinLevel)
            return;

        string levelName = typename.EnumToString(MyLogLevel, level);
        string line = string.Format("[MyMod] [%1] [%2] %3", levelName, source, message);
        Print(line);

        // Also write to file if level meets file threshold
        if (level >= s_FileMinLevel)
        {
            WriteToFile(line);
        }
    }

    private static void WriteToFile(string line)
    {
        // File I/O implementation...
    }
}
```

Usage across multiple modules:

```c
MyLog.Info("MissionServer", "MyFramework initialized (server)");
MyLog.Warning("ServerWebhooksRPC", "Unauthorized request from: " + sender.GetName());
MyLog.Error("ConfigManager", "Failed to load config: " + path);
```

---

## Примеры из практики


### Безопасная функция с множеством проверок


```c
void HealPlayer(PlayerBase player, float amount, string healerName)
{
    // Guard: null player
    if (!player)
    {
        MyLog.Error("HealSystem", "HealPlayer called with null player");
        return;
    }

    // Guard: player alive
    if (!player.IsAlive())
    {
        MyLog.Warning("HealSystem", "Cannot heal dead player: " + player.GetIdentity().GetName());
        return;
    }

    // Guard: valid amount
    if (amount <= 0)
    {
        MyLog.Warning("HealSystem", "Invalid heal amount: " + amount.ToString());
        return;
    }

    // Guard: not already at full health
    float currentHP = player.GetHealth("", "Health");
    float maxHP = player.GetMaxHealth("", "Health");
    if (currentHP >= maxHP)
    {
        MyLog.Info("HealSystem", player.GetIdentity().GetName() + " already at full health");
        return;
    }

    // All guards passed — perform the heal
    float newHP = Math.Min(currentHP + amount, maxHP);
    player.SetHealth("", "Health", newHP);

    MyLog.Info("HealSystem", string.Format("%1 healed %2 for %3 HP (%4 -> %5)",
        healerName,
        player.GetIdentity().GetName(),
        amount.ToString(),
        currentHP.ToString(),
        newHP.ToString()
    ));
}
```

### Безопасная загрузка конфигурации


```c
class MyConfig
{
    int MaxPlayers = 60;
    float SpawnRadius = 100.0;
    string WelcomeMessage = "Welcome!";
}

static MyConfig LoadConfigSafe(string path)
{
    // Guard: file exists
    if (!FileExist(path))
    {
        Print("[Config] File not found: " + path + " — creating defaults");
        MyConfig defaults = new MyConfig();
        JsonFileLoader<MyConfig>.JsonSaveFile(path, defaults);
        return defaults;
    }

    // Attempt load (no try/catch, so we validate after)
    MyConfig cfg = new MyConfig();
    JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);

    // Guard: loaded object is valid
    if (!cfg)
    {
        Print("[Config] ERROR: Failed to parse " + path + " — using defaults");
        return new MyConfig();
    }

    // Guard: validate values
    if (cfg.MaxPlayers < 1 || cfg.MaxPlayers > 128)
    {
        Print("[Config] WARN: MaxPlayers out of range (" + cfg.MaxPlayers.ToString() + "), clamping");
        cfg.MaxPlayers = Math.Clamp(cfg.MaxPlayers, 1, 128);
    }

    if (cfg.SpawnRadius < 0)
    {
        Print("[Config] WARN: SpawnRadius negative, using default");
        cfg.SpawnRadius = 100.0;
    }

    return cfg;
}
```

### Безопасный обработчик RPC


```c
void RPC_SpawnItem(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    // Guard: server only
    if (type != CallType.Server)
        return;

    // Guard: valid sender
    if (!sender)
    {
        Print("[RPC] SpawnItem: null sender identity");
        return;
    }

    // Guard: read params
    Param2<string, vector> data;
    if (!ctx.Read(data))
    {
        Print("[RPC] SpawnItem: failed to read params from " + sender.GetName());
        return;
    }

    string className = data.param1;
    vector position = data.param2;

    // Guard: valid class name
    if (className == "")
    {
        Print("[RPC] SpawnItem: empty className from " + sender.GetName());
        return;
    }

    // Guard: permission check
    if (!HasPermission(sender.GetPlainId(), "SpawnItem"))
    {
        Print("[RPC] SpawnItem: unauthorized by " + sender.GetName());
        return;
    }

    // All guards passed — execute
    Object obj = GetGame().CreateObjectEx(className, position, ECE_PLACE_ON_SURFACE);
    if (!obj)
    {
        Print("[RPC] SpawnItem: CreateObjectEx returned null for " + className);
        return;
    }

    Print("[RPC] SpawnItem: " + sender.GetName() + " spawned " + className);
}
```

### Безопасная операция с инвентарём


```c
bool TransferItem(PlayerBase fromPlayer, PlayerBase toPlayer, EntityAI item)
{
    // Guard: all references valid
    if (!fromPlayer || !toPlayer || !item)
    {
        Print("[Inventory] TransferItem: null reference");
        return false;
    }

    // Guard: both players alive
    if (!fromPlayer.IsAlive() || !toPlayer.IsAlive())
    {
        Print("[Inventory] TransferItem: one or both players are dead");
        return false;
    }

    // Guard: source actually has the item
    EntityAI checkItem = fromPlayer.GetInventory().FindAttachment(
        fromPlayer.GetInventory().FindUserReservedLocationIndex(item)
    );

    // Guard: target has space
    InventoryLocation il = new InventoryLocation();
    if (!toPlayer.GetInventory().FindFreeLocationFor(item, FindInventoryLocationType.ANY, il))
    {
        Print("[Inventory] TransferItem: no free space in target inventory");
        return false;
    }

    // Execute transfer
    return toPlayer.GetInventory().TakeEntityToInventory(InventoryMode.SERVER, FindInventoryLocationType.ANY, item);
}
```

---

## Итоги по защитным паттернам


| Pattern | Purpose | Example |
|---------|---------|---------|
| Guard clause | Early return on invalid input | `if (!player) return;` |
| Null check | Prevent null dereference | `if (obj) obj.DoThing();` |
| Cast + check | Safe downcast | `if (Class.CastTo(p, obj))` |
| Validate after load | Check data after JSON load | `if (cfg.Value < 0) cfg.Value = default;` |
| Validate before use | Range/bounds check | `if (arr.IsValidIndex(i))` |
| Log on failure | Trace where things went wrong | `Print("[Tag] Error: " + context);` |
| ErrorEx for engine | Write to .RPT file | `ErrorEx("msg", ErrorExSeverity.WARNING);` |
| DumpStackString | Capture call stack | `Print(DumpStackString());` |

---

## Распространённые ошибки


### 1. Assuming a function ran successfully

```c
// WRONG — JsonLoadFile returns void, not a success indicator
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
// If the file has bad JSON, cfg still has default values — no error

// CORRECT — validate after loading
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
if (cfg.SomeCriticalField == 0)
{
    Print("[Config] Warning: SomeCriticalField is zero — was the file loaded correctly?");
}
```

### 2. Deeply nested null checks instead of guards

```c
// WRONG — pyramid of doom
void Process(PlayerBase player)
{
    if (player)
    {
        if (player.GetIdentity())
        {
            if (player.IsAlive())
            {
                // Finally do something
            }
        }
    }
}

// CORRECT — flat guard clauses
void Process(PlayerBase player)
{
    if (!player) return;
    if (!player.GetIdentity()) return;
    if (!player.IsAlive()) return;

    // Do something
}
```

### 3. Forgetting to log in guard clauses

```c
// WRONG — silent failure, impossible to debug
if (!player) return;

// CORRECT — leaves a trail
if (!player)
{
    Print("[MyMod] Process: null player");
    return;
}
```

### 4. Using Print in hot paths

```c
// WRONG — Print every frame kills performance
override void OnUpdate(float timeslice)
{
    Print("Updating...");  // Called every frame!
}

// CORRECT — use debug guards or rate-limit
override void OnUpdate(float timeslice)
{
    #ifdef DIAG_DEVELOPER
        m_DebugTimer += timeslice;
        if (m_DebugTimer > 5.0)
        {
            Print("[DEBUG] Update tick: " + timeslice.ToString());
            m_DebugTimer = 0;
        }
    #endif
}
```

---

## Итоги


| Tool | Purpose | Syntax |
|------|---------|--------|
| Guard clause | Early return on failure | `if (!x) return;` |
| Null check | Prevent crash | `if (obj) obj.Method();` |
| ErrorEx | Write to .RPT log | `ErrorEx("msg", ErrorExSeverity.WARNING);` |
| DumpStackString | Get call stack | `string s = DumpStackString();` |
| Print | Write to script log | `Print("message");` |
| string.Format | Formatted logging | `string.Format("P %1 at %2", a, b)` |
| #ifdef guard | Compile-time debug switch | `#ifdef DIAG_DEVELOPER` |
| notnull | Compiler null check | `void Fn(notnull Class obj)` |

**The golden rule:** In Enforce Script, assume everything can be null and every operation can fail. Check first, act second, log always.

---

## Навигация


| Предыдущая | Вверх | Следующая |
|----------|----|------|
| [1.10 Enums & Preprocessor](10-enums-preprocessor.md) | [Part 1: Enforce Script](../README.md) | [1.12 What Does NOT Exist](12-gotchas.md) |
