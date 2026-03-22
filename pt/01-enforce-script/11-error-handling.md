# Chapter 1.11: Error Handling

[Home](../README.md) | [<< Previous: Enums & Preprocessor](10-enums-preprocessor.md) | **Error Handling** | [Next: Gotchas >>](12-gotchas.md)

---

## Sumario

- [A Regra Fundamental: Sem try/catch](#a-regra-fundamental-sem-trycatch)
- [Padrao Guard Clause](#padrao-guard-clause)
  - [Guard Simples](#guard-simples)
  - [Guards Multiplos (Empilhados)](#guards-multiplos-empilhados)
  - [Guard com Logging](#guard-com-logging)
- [Verificacao de Null](#verificacao-de-null)
  - [Antes de Cada Operacao](#antes-de-cada-operacao)
  - [Verificacoes de Null Encadeadas](#verificacoes-de-null-encadeadas)
  - [A Palavra-chave notnull](#a-palavra-chave-notnull)
- [ErrorEx -- Relatorio de Erros do Engine](#errorex--relatorio-de-erros-do-engine)
  - [Niveis de Severidade](#niveis-de-severidade)
  - [Quando Usar Cada Nivel](#quando-usar-cada-nivel)
- [DumpStackString -- Stack Traces](#dumpstackstring--stack-traces)
- [Impressao de Debug](#impressao-de-debug)
  - [Print Basico](#print-basico)
  - [Debug Condicional com #ifdef](#debug-condicional-com-ifdef)
- [Padroes de Logging Estruturado](#padroes-de-logging-estruturado)
  - [Padrao de Prefixo Simples](#padrao-de-prefixo-simples)
  - [Classe Logger Baseada em Niveis](#classe-logger-baseada-em-niveis)
  - [Estilo MyLog (Padrao de Producao)](#estilo-mylog-padrao-de-producao)
- [Exemplos do Mundo Real](#exemplos-do-mundo-real)
  - [Funcao Segura com Multiplos Guards](#funcao-segura-com-multiplos-guards)
  - [Carregamento Seguro de Config](#carregamento-seguro-de-config)
  - [Handler de RPC Seguro](#handler-de-rpc-seguro)
  - [Operacao de Inventario Segura](#operacao-de-inventario-segura)
- [Resumo dos Padroes Defensivos](#resumo-dos-padroes-defensivos)
- [Erros Comuns](#erros-comuns)
- [Resumo](#resumo)
- [Navegacao](#navegacao)

---

## A Regra Fundamental: Sem try/catch

O Enforce Script **nao tem tratamento de excecoes**. Nao existe `try`, `catch`, `throw` nem `finally`. Se algo der errado em tempo de execucao (desreferencia de null, cast invalido, array fora dos limites), o engine pode:

1. **Travar silenciosamente** -- a funcao para de executar, sem mensagem de erro
2. **Registrar um erro de script** -- visivel no arquivo de log `.RPT`
3. **Travar o servidor/cliente** -- em casos severos

Isso significa que **todo ponto potencial de falha deve ser protegido manualmente**. A defesa principal e o **padrao guard clause**.

---

## Padrao Guard Clause

Uma guard clause verifica uma pre-condicao no inicio de uma funcao e retorna antecipadamente se ela falhar. Isso mantem o "caminho feliz" sem aninhamento e legivel.

### Guard Simples

```c
void TeleportPlayer(PlayerBase player, vector destination)
{
    if (!player)
        return;

    player.SetPosition(destination);
}
```

### Guards Multiplos (Empilhados)

Empilhe guards no inicio da funcao -- cada um verifica uma pre-condicao:

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

    // All preconditions met -- safe to proceed
    for (int i = 0; i < quantity; i++)
    {
        player.GetInventory().CreateInInventory(className);
    }
}
```

### Guard com Logging

Em codigo de producao, sempre registre por que um guard foi acionado -- falhas silenciosas sao dificeis de depurar:

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

## Verificacao de Null

Referencias null sao a fonte mais comum de travamentos em modding DayZ. Todo tipo de referencia pode ser `null`.

### Antes de Cada Operacao

```c
// WRONG -- crashes if player, identity, or name is null at any point
string name = player.GetIdentity().GetName();

// CORRECT -- check at each step
if (!player)
    return;

PlayerIdentity identity = player.GetIdentity();
if (!identity)
    return;

string name = identity.GetName();
```

### Verificacoes de Null Encadeadas

Quando voce precisa percorrer uma cadeia de referencias, verifique cada elo:

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

### A Palavra-chave notnull

`notnull` e um modificador de parametro que faz o compilador rejeitar argumentos `null` no ponto de chamada:

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
    ProcessItem(item);  // OK -- compiler knows item is not null here
}
ProcessItem(null);      // Compile error!
```

> **Limitacao:** `notnull` so captura `null` literal e variaveis obviamente nulas no ponto de chamada. Nao impede que uma variavel que era nao-null no momento da verificacao se torne null devido a delecao pelo engine.

---

## ErrorEx -- Relatorio de Erros do Engine

`ErrorEx` escreve uma mensagem de erro no log de script (arquivo `.RPT`). Ele **nao** interrompe a execucao nem lanca uma excecao.

```c
ErrorEx("Something went wrong");
```

### Niveis de Severidade

`ErrorEx` aceita um segundo parametro opcional do tipo `ErrorExSeverity`:

```c
// INFO -- informational, not an error
ErrorEx("Config loaded successfully", ErrorExSeverity.INFO);

// WARNING -- potential problem, execution continues
ErrorEx("Config file not found, using defaults", ErrorExSeverity.WARNING);

// ERROR -- definite problem (default severity if omitted)
ErrorEx("Failed to create object: class not found");
ErrorEx("Critical failure in RPC handler", ErrorExSeverity.ERROR);
```

| Severidade | Quando Usar |
|------------|-------------|
| `ErrorExSeverity.INFO` | Mensagens informativas que voce quer no log de erros |
| `ErrorExSeverity.WARNING` | Problemas recuperaveis (config ausente, fallback usado) |
| `ErrorExSeverity.ERROR` | Bugs definitivos ou estados irrecuperaveis |

### Quando Usar Cada Nivel

```c
void LoadConfig(string path)
{
    if (!FileExist(path))
    {
        // WARNING -- recoverable, we'll use defaults
        ErrorEx("Config not found at " + path + ", using defaults", ErrorExSeverity.WARNING);
        UseDefaultConfig();
        return;
    }

    MyConfig cfg = new MyConfig();
    JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);

    if (cfg.Version < EXPECTED_VERSION)
    {
        // INFO -- not a problem, just noteworthy
        ErrorEx("Config version " + cfg.Version.ToString() + " is older than expected", ErrorExSeverity.INFO);
    }

    if (!cfg.Validate())
    {
        // ERROR -- bad data that will cause problems
        ErrorEx("Config validation failed for " + path);
        UseDefaultConfig();
        return;
    }
}
```

---

## DumpStackString -- Stack Traces

`DumpStackString` captura a pilha de chamadas atual como string. Isso e crucial para diagnosticar onde um estado inesperado ocorreu:

```c
void OnUnexpectedState(string context)
{
    string stack = DumpStackString();
    Print("[ERROR] Unexpected state in " + context);
    Print("[ERROR] Stack trace:");
    Print(stack);
}
```

Use em guard clauses para rastrear o chamador:

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

## Impressao de Debug

### Print Basico

`Print()` escreve no arquivo de log de script. Aceita qualquer tipo:

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

### Debug Condicional com #ifdef

Envolva prints de debug em guards de preprocessador para que sejam removidos de builds de release:

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

Para flags de debug especificas do mod, defina seu proprio simbolo:

```c
// In your config.cpp:
// defines[] = { "MYMOD_DEBUG" };

#ifdef MYMOD_DEBUG
    Print("[MyMod] Debug: item spawned at " + pos.ToString());
#endif
```

---

## Padroes de Logging Estruturado

### Padrao de Prefixo Simples

A abordagem mais simples -- adicionar uma tag antes de cada chamada Print:

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

### Classe Logger Baseada em Niveis

Um logger reutilizavel com niveis de severidade:

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

### Estilo MyLog (Padrao de Producao)

Para mods de producao, uma classe de logging estatica com saida para arquivo, rotacao diaria e multiplos alvos de saida:

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

Uso em multiplos modulos:

```c
MyLog.Info("MissionServer", "MyFramework initialized (server)");
MyLog.Warning("ServerWebhooksRPC", "Unauthorized request from: " + sender.GetName());
MyLog.Error("ConfigManager", "Failed to load config: " + path);
```

---

## Exemplos do Mundo Real

### Funcao Segura com Multiplos Guards

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

    // All guards passed -- perform the heal
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

### Carregamento Seguro de Config

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
        Print("[Config] File not found: " + path + " -- creating defaults");
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
        Print("[Config] ERROR: Failed to parse " + path + " -- using defaults");
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

### Handler de RPC Seguro

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

    // All guards passed -- execute
    Object obj = GetGame().CreateObjectEx(className, position, ECE_PLACE_ON_SURFACE);
    if (!obj)
    {
        Print("[RPC] SpawnItem: CreateObjectEx returned null for " + className);
        return;
    }

    Print("[RPC] SpawnItem: " + sender.GetName() + " spawned " + className);
}
```

### Operacao de Inventario Segura

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

## Resumo dos Padroes Defensivos

| Padrao | Proposito | Exemplo |
|--------|-----------|---------|
| Guard clause | Retorno antecipado em entrada invalida | `if (!player) return;` |
| Verificacao de null | Prevenir desreferencia de null | `if (obj) obj.DoThing();` |
| Cast + verificacao | Downcast seguro | `if (Class.CastTo(p, obj))` |
| Validar apos carregar | Verificar dados apos carga de JSON | `if (cfg.Value < 0) cfg.Value = default;` |
| Validar antes de usar | Verificacao de intervalo/limites | `if (arr.IsValidIndex(i))` |
| Logar em falha | Rastrear onde as coisas deram errado | `Print("[Tag] Error: " + context);` |
| ErrorEx para engine | Escrever no arquivo .RPT | `ErrorEx("msg", ErrorExSeverity.WARNING);` |
| DumpStackString | Capturar pilha de chamadas | `Print(DumpStackString());` |

---

## Erros Comuns

### 1. Assumir que uma funcao executou com sucesso

```c
// WRONG -- JsonLoadFile returns void, not a success indicator
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
// If the file has bad JSON, cfg still has default values -- no error

// CORRECT -- validate after loading
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
if (cfg.SomeCriticalField == 0)
{
    Print("[Config] Warning: SomeCriticalField is zero -- was the file loaded correctly?");
}
```

### 2. Verificacoes de null profundamente aninhadas ao inves de guards

```c
// WRONG -- pyramid of doom
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

// CORRECT -- flat guard clauses
void Process(PlayerBase player)
{
    if (!player) return;
    if (!player.GetIdentity()) return;
    if (!player.IsAlive()) return;

    // Do something
}
```

### 3. Esquecer de logar em guard clauses

```c
// WRONG -- silent failure, impossible to debug
if (!player) return;

// CORRECT -- leaves a trail
if (!player)
{
    Print("[MyMod] Process: null player");
    return;
}
```

### 4. Usar Print em caminhos criticos de performance

```c
// WRONG -- Print every frame kills performance
override void OnUpdate(float timeslice)
{
    Print("Updating...");  // Called every frame!
}

// CORRECT -- use debug guards or rate-limit
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

## Resumo

| Ferramenta | Proposito | Sintaxe |
|------------|-----------|---------|
| Guard clause | Retorno antecipado em falha | `if (!x) return;` |
| Verificacao de null | Prevenir travamento | `if (obj) obj.Method();` |
| ErrorEx | Escrever no log .RPT | `ErrorEx("msg", ErrorExSeverity.WARNING);` |
| DumpStackString | Obter pilha de chamadas | `string s = DumpStackString();` |
| Print | Escrever no log de script | `Print("message");` |
| string.Format | Logging formatado | `string.Format("P %1 at %2", a, b)` |
| Guard #ifdef | Chave de debug em tempo de compilacao | `#ifdef DIAG_DEVELOPER` |
| notnull | Verificacao de null pelo compilador | `void Fn(notnull Class obj)` |

**A regra de ouro:** No Enforce Script, assuma que tudo pode ser null e toda operacao pode falhar. Verifique primeiro, aja depois, registre sempre.

---

## Navegacao

| Anterior | Acima | Proximo |
|----------|-------|---------|
| [1.10 Enums & Preprocessador](10-enums-preprocessor.md) | [Parte 1: Enforce Script](../README.md) | [1.12 O Que NAO Existe](12-gotchas.md) |
