# Chapter 1.10: Enums & Preprocessor

[Home](../README.md) | [<< Previous: Casting & Reflection](09-casting-reflection.md) | **Enums & Preprocessor** | [Next: Error Handling >>](11-error-handling.md)

---

## Sumario

- [Declaracao de Enum](#declaracao-de-enum)
  - [Valores Explicitos](#valores-explicitos)
  - [Valores Implicitos](#valores-implicitos)
  - [Heranca de Enum](#heranca-de-enum)
- [Usando Enums](#usando-enums)
- [Reflexao de Enum](#reflexao-de-enum)
  - [typename.EnumToString](#typenameenumtostring)
  - [typename.StringToEnum](#typenamestringtoenum)
- [Padrao de Bitflags](#padrao-de-bitflags)
- [Constantes](#constantes)
- [Diretivas de Preprocessador](#diretivas-de-preprocessador)
  - [#ifdef / #ifndef / #endif](#ifdef--ifndef--endif)
  - [#define](#define)
  - [Defines Comuns do Engine](#defines-comuns-do-engine)
  - [Defines Customizados via config.cpp](#defines-customizados-via-configcpp)
- [Exemplos do Mundo Real](#exemplos-do-mundo-real)
  - [Codigo Especifico por Plataforma](#codigo-especifico-por-plataforma)
  - [Dependencias Opcionais de Mods](#dependencias-opcionais-de-mods)
  - [Diagnosticos Apenas em Debug](#diagnosticos-apenas-em-debug)
  - [Logica de Server vs Client](#logica-de-server-vs-client)
- [Erros Comuns](#erros-comuns)
- [Resumo](#resumo)
- [Navegacao](#navegacao)

---

## Declaracao de Enum

Enums no Enforce Script definem constantes inteiras nomeadas agrupadas sob um nome de tipo. Elas se comportam como `int` internamente.

### Valores Explicitos

```c
enum EDamageState
{
    PRISTINE  = 0,
    WORN      = 1,
    DAMAGED   = 2,
    BADLY_DAMAGED = 3,
    RUINED    = 4
};
```

### Valores Implicitos

Se voce omitir valores, eles auto-incrementam a partir do valor anterior (comecando em 0):

```c
enum EWeaponMode
{
    SEMI,       // 0
    BURST,      // 1
    AUTO,       // 2
    COUNT       // 3 -- common trick to get the total count
};
```

### Heranca de Enum

Enums podem herdar de outras enums. Os valores continuam a partir do ultimo valor do pai:

```c
enum EBaseColor
{
    RED    = 0,
    GREEN  = 1,
    BLUE   = 2
};

enum EExtendedColor : EBaseColor
{
    YELLOW,   // 3
    CYAN,     // 4
    MAGENTA   // 5
};
```

Todos os valores do pai sao acessiveis atraves do enum filho:

```c
int c = EExtendedColor.RED;      // 0 -- inherited from EBaseColor
int d = EExtendedColor.YELLOW;   // 3 -- defined in EExtendedColor
```

> **Nota:** Heranca de enum e util para estender enums vanilla em codigo moddado sem alterar o original.

---

## Usando Enums

Enums atuam como `int` -- voce pode atribui-las a variaveis `int`, compara-las e usa-las em instrucoes switch:

```c
EDamageState state = EDamageState.WORN;

// Compare
if (state == EDamageState.RUINED)
{
    Print("Item is ruined!");
}

// Use in switch
switch (state)
{
    case EDamageState.PRISTINE:
        Print("Perfect condition");
        break;
    case EDamageState.WORN:
        Print("Slightly worn");
        break;
    case EDamageState.DAMAGED:
        Print("Damaged");
        break;
    case EDamageState.BADLY_DAMAGED:
        Print("Badly damaged");
        break;
    case EDamageState.RUINED:
        Print("Ruined!");
        break;
}

// Assign to int
int stateInt = state;  // 1

// Assign from int (no validation -- any int value is accepted!)
EDamageState fromInt = 99;  // No error, even though 99 is not a valid enum value
```

> **Aviso:** O Enforce Script **nao** valida atribuicoes de enum. Atribuir um inteiro fora do intervalo a uma variavel enum compila e executa sem erro.

---

## Reflexao de Enum

O Enforce Script fornece funcoes embutidas para converter entre valores de enum e strings.

### typename.EnumToString

Converte um valor de enum para seu nome como string:

```c
EDamageState state = EDamageState.DAMAGED;
string name = typename.EnumToString(EDamageState, state);
Print(name);  // "DAMAGED"
```

Isso e inestimavel para logging e exibicao em UI:

```c
void LogDamageState(EntityAI item, EDamageState state)
{
    string stateName = typename.EnumToString(EDamageState, state);
    Print(item.GetType() + " is " + stateName);
}
```

### typename.StringToEnum

Converte uma string de volta para um valor de enum:

```c
int value;
typename.StringToEnum(EDamageState, "RUINED", value);
Print(value.ToString());  // "4"
```

Isso e usado ao carregar valores de enum de arquivos de config ou JSON:

```c
// Loading from a config string
string configValue = "BURST";
int modeInt;
if (typename.StringToEnum(EWeaponMode, configValue, modeInt))
{
    EWeaponMode mode = modeInt;
    Print("Loaded weapon mode: " + typename.EnumToString(EWeaponMode, mode));
}
```

---

## Padrao de Bitflags

Enums com valores de potencia de 2 criam bitflags -- multiplas opcoes combinadas em um unico inteiro:

```c
enum ESpawnFlags
{
    NONE            = 0,
    PLACE_ON_GROUND = 1,     // 1 << 0
    CREATE_PHYSICS  = 2,     // 1 << 1
    UPDATE_NAVMESH  = 4,     // 1 << 2
    CREATE_LOCAL    = 8,     // 1 << 3
    NO_LIFETIME     = 16     // 1 << 4
};
```

Combine com OR bit a bit, teste com AND bit a bit:

```c
// Combine flags
int flags = ESpawnFlags.PLACE_ON_GROUND | ESpawnFlags.CREATE_PHYSICS | ESpawnFlags.UPDATE_NAVMESH;

// Test a single flag
if (flags & ESpawnFlags.CREATE_PHYSICS)
{
    Print("Physics will be created");
}

// Remove a flag
flags = flags & ~ESpawnFlags.CREATE_LOCAL;

// Add a flag
flags = flags | ESpawnFlags.NO_LIFETIME;
```

O DayZ usa esse padrao extensivamente para flags de criacao de objetos (`ECE_PLACE_ON_SURFACE`, `ECE_CREATEPHYSICS`, `ECE_UPDATEPATHGRAPH`, etc.).

---

## Constantes

Use `const` para declarar valores imutaveis. Constantes devem ser inicializadas na declaracao.

```c
// Integer constants
const int MAX_PLAYERS = 60;
const int INVALID_INDEX = -1;

// Float constants
const float GRAVITY = 9.81;
const float SPAWN_RADIUS = 500.0;

// String constants
const string MOD_NAME = "MyMod";
const string CONFIG_PATH = "$profile:MyMod/config.json";
const string LOG_PREFIX = "[MyMod] ";
```

Constantes podem ser usadas como valores de case em switch e tamanhos de array:

```c
// Array with const size
const int BUFFER_SIZE = 256;
int buffer[BUFFER_SIZE];

// Switch with const values
const int CMD_HELP = 1;
const int CMD_SPAWN = 2;
const int CMD_TELEPORT = 3;

switch (command)
{
    case CMD_HELP:
        ShowHelp();
        break;
    case CMD_SPAWN:
        SpawnItem();
        break;
    case CMD_TELEPORT:
        TeleportPlayer();
        break;
}
```

> **Nota:** Nao existe `const` para tipos de referencia (objetos). Voce nao pode tornar uma referencia de objeto imutavel.

---

## Diretivas de Preprocessador

O preprocessador do Enforce Script executa antes da compilacao, permitindo inclusao condicional de codigo. Funciona de forma similar ao preprocessador C/C++ mas com menos recursos.

### #ifdef / #ifndef / #endif

Inclui codigo condicionalmente com base em um simbolo estar definido ou nao:

```c
// Include code only if DEVELOPER is defined
#ifdef DEVELOPER
    Print("[DEBUG] Diagnostics enabled");
#endif

// Include code only if a symbol is NOT defined
#ifndef SERVER
    // Client-only code
    CreateClientUI();
#endif

// If-else pattern
#ifdef SERVER
    Print("Running on server");
#else
    Print("Running on client");
#endif
```

### #define

Defina seus proprios simbolos (sem valor -- apenas existencia):

```c
#define MY_MOD_DEBUG

#ifdef MY_MOD_DEBUG
    Print("Debug mode active");
#endif
```

> **Nota:** O `#define` do Enforce Script so cria flags de existencia. Ele **nao** suporta substituicao de macro (sem `#define MAX_HP 100` -- use `const` no lugar).

### Defines Comuns do Engine

O DayZ fornece estes defines embutidos com base no tipo de build e plataforma:

| Define | Quando Disponivel | Usar Para |
|--------|-------------------|-----------|
| `SERVER` | Executando em servidor dedicado | Logica exclusiva do servidor |
| `DEVELOPER` | Build de desenvolvedor do DayZ | Recursos exclusivos de dev |
| `DIAG_DEVELOPER` | Build de diagnostico | Menus de diagnostico, ferramentas de debug |
| `PLATFORM_WINDOWS` | Plataforma Windows | Caminhos especificos por plataforma |
| `PLATFORM_XBOX` | Plataforma Xbox | UI especifica para console |
| `PLATFORM_PS4` | Plataforma PlayStation | Logica especifica para console |
| `BUILD_EXPERIMENTAL` | Branch experimental | Recursos experimentais |

```c
void InitPlatform()
{
    #ifdef PLATFORM_WINDOWS
        Print("Running on Windows");
    #endif

    #ifdef PLATFORM_XBOX
        Print("Running on Xbox");
    #endif

    #ifdef PLATFORM_PS4
        Print("Running on PlayStation");
    #endif
}
```

### Defines Customizados via config.cpp

Mods podem definir seus proprios simbolos no `config.cpp` usando o array `defines[]`. Estes ficam disponiveis para todos os scripts carregados apos este mod:

```cpp
class CfgMods
{
    class MyMissions
    {
        // ...
        defines[] = { "MYMOD_MISSIONS" };
        // ...
    };
};
```

Agora outros mods podem detectar se MyMissions esta carregado:

```c
#ifdef MYMOD_MISSIONS
    // MyMissions is loaded -- use its API
    MissionManager.Start();
#else
    // MyMissions is not loaded -- skip or use fallback
    Print("Missions mod not detected");
#endif
```

---

## Exemplos do Mundo Real

### Codigo Especifico por Plataforma

```c
string GetSavePath()
{
    #ifdef PLATFORM_WINDOWS
        return "$profile:MyMod/saves/";
    #else
        return "$saves:MyMod/";
    #endif
}
```

### Dependencias Opcionais de Mods

Este e o padrao comum para mods que opcionalmente integram com outros mods:

```c
class MyModManager
{
    void Init()
    {
        Print("[MyMod] Initializing...");

        // Core features always available
        LoadConfig();
        RegisterRPCs();

        // Optional integration with MyFramework
        #ifdef MYMOD_CORE
            MyLog.Info("MyMod", "MyFramework detected -- using unified logging");
            RegisterWithCore();
        #endif

        // Optional integration with Community Framework
        #ifdef JM_CommunityFramework
            GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);
        #endif
    }
}
```

### Diagnosticos Apenas em Debug

```c
void ProcessAI(DayZInfected zombie)
{
    vector pos = zombie.GetPosition();
    float health = zombie.GetHealth("", "Health");

    // Heavy debug logging -- only in diagnostic builds
    #ifdef DIAG_DEVELOPER
        Print(string.Format("[AI] Zombie %1 at %2, HP: %3",
            zombie.GetType(), pos.ToString(), health.ToString()));

        // Draw debug sphere (only works in diag builds)
        Debug.DrawSphere(pos, 1.0, Colors.RED, ShapeFlags.ONCE);
    #endif

    // Actual logic runs in all builds
    if (health <= 0)
    {
        HandleZombieDeath(zombie);
    }
}
```

### Logica de Server vs Client

```c
class MissionHandler
{
    void OnMissionStart()
    {
        #ifdef SERVER
            // Server: load mission data, spawn objects
            LoadMissionData();
            SpawnMissionObjects();
            NotifyAllPlayers();
        #else
            // Client: set up UI, subscribe to events
            CreateMissionHUD();
            RegisterClientRPCs();
        #endif
    }
}
```

---

## Erros Comuns

### 1. Usar enums como tipos validados

```c
// PROBLEM -- no validation, any int is accepted
EDamageState state = 999;  // Compiles fine, but 999 is not a valid state

// SOLUTION -- validate manually when loading from external data
int rawValue = LoadFromConfig();
if (rawValue >= 0 && rawValue <= EDamageState.RUINED)
{
    EDamageState state = rawValue;
}
```

### 2. Tentar usar #define para substituicao de valor

```c
// WRONG -- Enforce Script #define does NOT support values
#define MAX_HEALTH 100
int hp = MAX_HEALTH;  // Compile error!

// CORRECT -- use const instead
const int MAX_HEALTH = 100;
int hp = MAX_HEALTH;
```

### 3. Aninhar #ifdef incorretamente

```c
// CORRECT -- nested ifdefs are fine
#ifdef SERVER
    #ifdef MYMOD_CORE
        MyLog.Info("MyMod", "Server + Core");
    #endif
#endif

// WRONG -- missing #endif causes mysterious compile errors
#ifdef SERVER
    DoServerStuff();
// forgot #endif here!
```

### 4. Esquecer que switch/case nao tem fall-through

```c
// In C/C++, cases fall through without break.
// In Enforce Script, each case is INDEPENDENT -- no fall-through.

switch (state)
{
    case EDamageState.PRISTINE:
    case EDamageState.WORN:
        Print("Good condition");  // Only reached for WORN, not PRISTINE!
        break;
}
```

Se voce precisa que multiplos cases compartilhem logica, use if/else:

```c
if (state == EDamageState.PRISTINE || state == EDamageState.WORN)
{
    Print("Good condition");
}
```

---

## Resumo

### Enums

| Recurso | Sintaxe |
|---------|---------|
| Declarar | `enum EName { A = 0, B = 1 };` |
| Implicito | `enum EName { A, B, C };` (0, 1, 2) |
| Herdar | `enum EChild : EParent { D, E };` |
| Para string | `typename.EnumToString(EName, value)` |
| De string | `typename.StringToEnum(EName, "A", out val)` |
| Combinar bitflag | `flags = A | B` |
| Testar bitflag | `if (flags & A)` |

### Preprocessador

| Diretiva | Proposito |
|----------|-----------|
| `#ifdef SYMBOL` | Compilar se o simbolo existir |
| `#ifndef SYMBOL` | Compilar se o simbolo NAO existir |
| `#else` | Branch alternativo |
| `#endif` | Fim do bloco condicional |
| `#define SYMBOL` | Definir um simbolo (sem valor) |

### Defines Principais

| Define | Significado |
|--------|-------------|
| `SERVER` | Servidor dedicado |
| `DEVELOPER` | Build de desenvolvedor |
| `DIAG_DEVELOPER` | Build de diagnostico |
| `PLATFORM_WINDOWS` | Sistema operacional Windows |
| Custom: `defines[]` | config.cpp do seu mod |

---

## Navegacao

| Anterior | Acima | Proximo |
|----------|-------|---------|
| [1.9 Casting & Reflexao](09-casting-reflection.md) | [Parte 1: Enforce Script](../README.md) | [1.11 Tratamento de Erros](11-error-handling.md) |
