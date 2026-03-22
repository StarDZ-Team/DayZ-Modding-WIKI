# Chapter 1.9: Casting & Reflection

[Home](../README.md) | [<< Previous: Memory Management](08-memory-management.md) | **Casting & Reflection** | [Next: Enums & Preprocessor >>](10-enums-preprocessor.md)

---

## Sumario

- [Por Que Casting Importa](#por-que-casting-importa)
- [Class.CastTo -- Downcast Seguro](#classcastto--downcast-seguro)
- [Type.Cast -- Casting Alternativo](#typecast--casting-alternativo)
- [CastTo vs Type.Cast -- Quando Usar Qual](#castto-vs-typecast--quando-usar-qual)
- [obj.IsInherited -- Verificacao de Tipo em Tempo de Execucao](#obisinherited--verificacao-de-tipo-em-tempo-de-execucao)
- [obj.IsKindOf -- Verificacao de Tipo por String](#obiskindof--verificacao-de-tipo-por-string)
- [obj.Type -- Obter Tipo em Tempo de Execucao](#objtype--obter-tipo-em-tempo-de-execucao)
- [typename -- Armazenando Referencias de Tipo](#typename--armazenando-referencias-de-tipo)
- [API de Reflexao](#api-de-reflexao)
  - [Inspecionando Variaveis](#inspecionando-variaveis)
  - [EnScript.GetClassVar / SetClassVar](#enscriptgetclassvar--setclassvar)
- [Exemplos do Mundo Real](#exemplos-do-mundo-real)
  - [Encontrando Todos os Veiculos no Mundo](#encontrando-todos-os-veiculos-no-mundo)
  - [Helper Seguro de Object com Cast](#helper-seguro-de-object-com-cast)
  - [Sistema de Config Baseado em Reflexao](#sistema-de-config-baseado-em-reflexao)
  - [Dispatch de Eventos com Seguranca de Tipo](#dispatch-de-eventos-com-seguranca-de-tipo)
- [Erros Comuns](#erros-comuns)
- [Resumo](#resumo)
- [Navegacao](#navegacao)

---

## Por Que Casting Importa

A hierarquia de entidades do DayZ e profunda. A maioria das APIs do engine retorna um tipo base generico (`Object`, `Man`, `Class`), mas voce precisa de um tipo especifico (`PlayerBase`, `ItemBase`, `CarScript`) para acessar metodos especializados. Casting converte uma referencia base em uma referencia derivada -- de forma segura.

```
Class (root)
  +-- Object
       +-- Entity
            +-- EntityAI
                 |-- InventoryItem -> ItemBase
                 |-- DayZCreatureAI
                 |    |-- DayZInfected
                 |    +-- DayZAnimal
                 +-- Man
                      +-- DayZPlayer -> PlayerBase
```

Chamar um metodo que nao existe no tipo base causa um **travamento em tempo de execucao** -- nao ha erro de compilacao porque o Enforce Script resolve chamadas virtuais em tempo de execucao.

---

## Class.CastTo -- Downcast Seguro

`Class.CastTo` e o metodo de casting **preferido** no DayZ. E um metodo estatico que escreve o resultado em um parametro `out` e retorna `bool`.

```c
// Signature:
// static bool Class.CastTo(out Class target, Class source)

Object obj = GetSomeObject();
PlayerBase player;

if (Class.CastTo(player, obj))
{
    // Cast succeeded -- player is valid
    string name = player.GetIdentity().GetName();
    Print("Found player: " + name);
}
else
{
    // Cast failed -- obj is not a PlayerBase
    // player is null here
}
```

**Por que e preferido:**
- Retorna `false` em caso de falha ao inves de travar
- O parametro `out` e definido como `null` em caso de falha -- seguro para verificar
- Funciona em toda a hierarquia de classes (nao apenas `Object`)

### Padrao: Cast-e-Continue

Em loops, use falha de cast para pular objetos irrelevantes:

```c
array<Object> nearObjects = new array<Object>;
array<CargoBase> proxyCargos = new array<CargoBase>;
GetGame().GetObjectsAtPosition(pos, 50.0, nearObjects, proxyCargos);

foreach (Object obj : nearObjects)
{
    EntityAI entity;
    if (!Class.CastTo(entity, obj))
        continue;  // Skip non-EntityAI objects (buildings, terrain, etc.)

    // Now safe to call EntityAI methods
    if (entity.IsAlive())
    {
        Print(entity.GetType() + " is alive at " + entity.GetPosition().ToString());
    }
}
```

---

## Type.Cast -- Casting Alternativo

Toda classe tem um metodo estatico `Cast` que retorna o resultado do cast diretamente (ou `null` em caso de falha).

```c
// Syntax: TargetType.Cast(source)

Object obj = GetSomeObject();
PlayerBase player = PlayerBase.Cast(obj);

if (player)
{
    player.DoSomething();
}
```

Este e um one-liner que combina cast e atribuicao, mas voce **deve** ainda verificar null no resultado.

### Casting de Primitivos e Params

`Type.Cast` tambem e usado com classes `Param` (usadas intensamente em RPCs e eventos):

```c
override void OnEvent(EventType eventTypeId, Param params)
{
    if (eventTypeId == ClientReadyEventTypeID)
    {
        Param2<PlayerIdentity, Man> readyParams = Param2<PlayerIdentity, Man>.Cast(params);
        if (readyParams)
        {
            PlayerIdentity identity = readyParams.param1;
            Man player = readyParams.param2;
        }
    }
}
```

---

## CastTo vs Type.Cast -- Quando Usar Qual

| Caracteristica | `Class.CastTo` | `Type.Cast` |
|---------------|----------------|-------------|
| Tipo de retorno | `bool` | Tipo alvo ou `null` |
| Null em falha | Sim (parametro out definido como null) | Sim (retorna null) |
| Melhor para | Blocos if com logica de ramificacao | Atribuicoes em uma linha |
| Usado no DayZ vanilla | Em todo lugar | Em todo lugar |
| Funciona com nao-Object | Sim (qualquer `Class`) | Sim (qualquer `Class`) |

**Regra pratica:** Use `Class.CastTo` quando voce ramifica com base em sucesso/falha. Use `Type.Cast` quando voce so precisa da referencia tipada e vai verificar null depois.

```c
// CastTo -- branch on result
PlayerBase player;
if (Class.CastTo(player, obj))
{
    // handle player
}

// Type.Cast -- assign and check later
PlayerBase player = PlayerBase.Cast(obj);
if (!player) return;
```

---

## obj.IsInherited -- Verificacao de Tipo em Tempo de Execucao

`IsInherited` verifica se um objeto e uma instancia de um dado tipo **sem** realizar um cast. Ele recebe um argumento `typename`.

```c
Object obj = GetSomeObject();

if (obj.IsInherited(PlayerBase))
{
    Print("This is a player!");
}

if (obj.IsInherited(DayZInfected))
{
    Print("This is a zombie!");
}

if (obj.IsInherited(CarScript))
{
    Print("This is a vehicle!");
}
```

`IsInherited` retorna `true` para o tipo exato **e** quaisquer tipos pai na hierarquia. Um objeto `PlayerBase` retorna `true` para `IsInherited(Man)`, `IsInherited(EntityAI)`, `IsInherited(Object)`, etc.

---

## obj.IsKindOf -- Verificacao de Tipo por String

`IsKindOf` faz a mesma verificacao mas com um nome de classe em **string**. Util quando voce tem o nome do tipo como dado (ex.: de arquivos de configuracao).

```c
Object obj = GetSomeObject();

if (obj.IsKindOf("ItemBase"))
{
    Print("This is an item");
}

if (obj.IsKindOf("DayZAnimal"))
{
    Print("This is an animal");
}
```

**Importante:** `IsKindOf` verifica toda a cadeia de heranca, assim como `IsInherited`. Um `Mag_STANAG_30Rnd` retorna `true` para `IsKindOf("Magazine_Base")`, `IsKindOf("InventoryItem")`, `IsKindOf("EntityAI")`, etc.

### IsInherited vs IsKindOf

| Caracteristica | `IsInherited(typename)` | `IsKindOf(string)` |
|---------------|------------------------|---------------------|
| Argumento | Tipo em tempo de compilacao | Nome em string |
| Velocidade | Mais rapido (comparacao de tipo) | Mais lento (busca por string) |
| Use quando | Voce sabe o tipo em tempo de compilacao | O tipo vem de dados/config |

---

## obj.Type -- Obter Tipo em Tempo de Execucao

`Type()` retorna o `typename` da classe real em tempo de execucao do objeto -- nao o tipo declarado da variavel.

```c
Object obj = GetSomeObject();
typename t = obj.Type();

Print(t.ToString());  // e.g., "PlayerBase", "AK101", "LandRover"
```

Use para logging, depuracao ou comparacao dinamica de tipos:

```c
void ProcessEntity(EntityAI entity)
{
    typename t = entity.Type();
    Print("Processing entity of type: " + t.ToString());

    if (t == PlayerBase)
    {
        Print("It's a player");
    }
}
```

---

## typename -- Armazenando Referencias de Tipo

`typename` e um tipo de primeira classe no Enforce Script. Voce pode armazena-lo em variaveis, passa-lo como parametros e compara-lo.

```c
// Declare a typename variable
typename playerType = PlayerBase;
typename vehicleType = CarScript;

// Compare
typename objType = obj.Type();
if (objType == playerType)
{
    Print("Match!");
}

// Use in collections
array<typename> allowedTypes = new array<typename>;
allowedTypes.Insert(PlayerBase);
allowedTypes.Insert(DayZInfected);
allowedTypes.Insert(DayZAnimal);

// Check membership
foreach (typename t : allowedTypes)
{
    if (obj.IsInherited(t))
    {
        Print("Object matches allowed type: " + t.ToString());
        break;
    }
}
```

### Criando Instancias a partir de typename

Voce pode criar objetos a partir de um `typename` em tempo de execucao:

```c
typename t = PlayerBase;
Class instance = t.Spawn();  // Creates a new instance

// Or use the string-based approach:
Class instance2 = GetGame().CreateObjectEx("AK101", pos, ECE_PLACE_ON_SURFACE);
```

> **Nota:** `typename.Spawn()` so funciona para classes com um construtor sem parametros. Para entidades do DayZ, use `GetGame().CreateObject()` ou `CreateObjectEx()`.

---

## API de Reflexao

O Enforce Script fornece reflexao basica -- a capacidade de inspecionar e modificar propriedades de um objeto em tempo de execucao sem conhecer seu tipo em tempo de compilacao.

### Inspecionando Variaveis

O `Type()` de cada objeto retorna um `typename` que expoe metadados das variaveis:

```c
void InspectObject(Class obj)
{
    typename t = obj.Type();

    int varCount = t.GetVariableCount();
    Print("Class: " + t.ToString() + " has " + varCount.ToString() + " variables");

    for (int i = 0; i < varCount; i++)
    {
        string varName = t.GetVariableName(i);
        typename varType = t.GetVariableType(i);

        Print("  [" + i.ToString() + "] " + varName + " : " + varType.ToString());
    }
}
```

**Metodos de reflexao disponiveis em `typename`:**

| Metodo | Retorna | Descricao |
|--------|---------|-----------|
| `GetVariableCount()` | `int` | Numero de variaveis membro |
| `GetVariableName(int index)` | `string` | Nome da variavel no indice |
| `GetVariableType(int index)` | `typename` | Tipo da variavel no indice |
| `ToString()` | `string` | Nome da classe como string |

### EnScript.GetClassVar / SetClassVar

`EnScript.GetClassVar` e `EnScript.SetClassVar` permitem ler/escrever variaveis membro por **nome** em tempo de execucao. Este e o equivalente do Enforce Script ao acesso dinamico de propriedades.

```c
// Signature:
// static void EnScript.GetClassVar(Class instance, string varName, int index, out T value)
// static bool EnScript.SetClassVar(Class instance, string varName, int index, T value)
// 'index' is the array element index -- use 0 for non-array fields.

class MyConfig
{
    int MaxSpawns = 10;
    float SpawnRadius = 100.0;
    string WelcomeMsg = "Hello!";
}

void DemoReflection()
{
    MyConfig cfg = new MyConfig();

    // Read values by name
    int maxVal;
    EnScript.GetClassVar(cfg, "MaxSpawns", 0, maxVal);
    Print("MaxSpawns = " + maxVal.ToString());  // "MaxSpawns = 10"

    float radius;
    EnScript.GetClassVar(cfg, "SpawnRadius", 0, radius);
    Print("SpawnRadius = " + radius.ToString());  // "SpawnRadius = 100"

    string msg;
    EnScript.GetClassVar(cfg, "WelcomeMsg", 0, msg);
    Print("WelcomeMsg = " + msg);  // "WelcomeMsg = Hello!"

    // Write values by name
    EnScript.SetClassVar(cfg, "MaxSpawns", 0, 50);
    EnScript.SetClassVar(cfg, "SpawnRadius", 0, 250.0);
    EnScript.SetClassVar(cfg, "WelcomeMsg", 0, "Welcome!");
}
```

> **Aviso:** `GetClassVar`/`SetClassVar` falham silenciosamente se o nome da variavel estiver errado ou o tipo nao corresponder. Sempre valide os nomes das variaveis antes de usar.

---

## Exemplos do Mundo Real

### Encontrando Todos os Veiculos no Mundo

```c
static array<CarScript> FindAllVehicles()
{
    array<CarScript> vehicles = new array<CarScript>;
    array<Object> allObjects = new array<Object>;
    array<CargoBase> proxyCargos = new array<CargoBase>;

    // Search a large area (or use mission-specific logic)
    vector center = "7500 0 7500";
    GetGame().GetObjectsAtPosition(center, 15000.0, allObjects, proxyCargos);

    foreach (Object obj : allObjects)
    {
        CarScript car;
        if (Class.CastTo(car, obj))
        {
            vehicles.Insert(car);
        }
    }

    Print("Found " + vehicles.Count().ToString() + " vehicles");
    return vehicles;
}
```

### Helper Seguro de Object com Cast

Este padrao e usado em todo o modding DayZ -- uma funcao utilitaria que verifica com seguranca se um `Object` esta vivo fazendo cast para `EntityAI`:

```c
// Object.IsAlive() does NOT exist on the base Object class!
// You must cast to EntityAI first.

static bool IsObjectAlive(Object obj)
{
    if (!obj)
        return false;

    EntityAI eai;
    if (Class.CastTo(eai, obj))
    {
        return eai.IsAlive();
    }

    return false;  // Non-EntityAI objects (buildings, etc.) -- treat as "not alive"
}
```

### Sistema de Config Baseado em Reflexao

Este padrao (usado no MyFramework) constroi um sistema de config generico onde campos sao lidos/escritos por nome, permitindo que paineis de administracao editem qualquer config sem conhecer sua classe especifica:

```c
class ConfigBase
{
    // Find a member variable index by name
    protected int FindVarIndex(string fieldName)
    {
        typename t = Type();
        int count = t.GetVariableCount();
        for (int i = 0; i < count; i++)
        {
            if (t.GetVariableName(i) == fieldName)
                return i;
        }
        return -1;
    }

    // Get any field value as string
    string GetFieldValue(string fieldName)
    {
        if (FindVarIndex(fieldName) == -1)
            return "";

        int iVal;
        EnScript.GetClassVar(this, fieldName, 0, iVal);
        return iVal.ToString();
    }

    // Set any field value from string
    void SetFieldValue(string fieldName, string value)
    {
        if (FindVarIndex(fieldName) == -1)
            return;

        int iVal = value.ToInt();
        EnScript.SetClassVar(this, fieldName, 0, iVal);
    }
}

class MyModConfig : ConfigBase
{
    int MaxPlayers = 60;
    int RespawnTime = 300;
}

void AdminPanelSave(ConfigBase config, string fieldName, string newValue)
{
    // Works for ANY config subclass -- no type-specific code needed
    config.SetFieldValue(fieldName, newValue);
}
```

### Dispatch de Eventos com Seguranca de Tipo

Use `typename` para construir um dispatcher que roteia eventos para o handler correto:

```c
class EventDispatcher
{
    protected ref map<typename, ref array<ref EventHandler>> m_Handlers;

    void EventDispatcher()
    {
        m_Handlers = new map<typename, ref array<ref EventHandler>>;
    }

    void Register(typename eventType, EventHandler handler)
    {
        if (!m_Handlers.Contains(eventType))
        {
            m_Handlers.Insert(eventType, new array<ref EventHandler>);
        }

        m_Handlers.Get(eventType).Insert(handler);
    }

    void Dispatch(EventBase event)
    {
        typename eventType = event.Type();

        array<ref EventHandler> handlers;
        if (m_Handlers.Find(eventType, handlers))
        {
            foreach (EventHandler handler : handlers)
            {
                handler.Handle(event);
            }
        }
    }
}
```

---

## Erros Comuns

### 1. Esquecer de verificar null apos cast

```c
// WRONG -- crashes if obj is not a PlayerBase
PlayerBase player = PlayerBase.Cast(obj);
player.GetIdentity();  // CRASH if cast failed!

// CORRECT
PlayerBase player = PlayerBase.Cast(obj);
if (player)
{
    player.GetIdentity();
}
```

### 2. Chamar IsAlive() no Object base

```c
// WRONG -- Object.IsAlive() does not exist
Object obj = GetSomeObject();
if (obj.IsAlive())  // Compile error or runtime crash!

// CORRECT
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive())
{
    // Safe
}
```

### 3. Usar reflexao com nome de variavel errado

```c
// SILENT FAILURE -- no error, just returns zero/empty
int val;
EnScript.GetClassVar(obj, "NonExistentField", 0, val);
// val is 0, no error thrown
```

Sempre valide com `FindVarIndex` ou `GetVariableCount`/`GetVariableName` primeiro.

### 4. Confundir Type() com literal typename

```c
// Type() -- returns the RUNTIME type of an instance
typename t = myObj.Type();  // e.g., PlayerBase

// typename literal -- a compile-time type reference
typename t = PlayerBase;    // Always PlayerBase

// They are comparable
if (myObj.Type() == PlayerBase)  // true if myObj IS a PlayerBase
```

---

## Resumo

| Operacao | Sintaxe | Retorna |
|----------|---------|---------|
| Downcast seguro | `Class.CastTo(out target, source)` | `bool` |
| Cast inline | `TargetType.Cast(source)` | Tipo alvo ou `null` |
| Verificacao de tipo (typename) | `obj.IsInherited(typename)` | `bool` |
| Verificacao de tipo (string) | `obj.IsKindOf("ClassName")` | `bool` |
| Obter tipo em tempo de execucao | `obj.Type()` | `typename` |
| Contagem de variaveis | `obj.Type().GetVariableCount()` | `int` |
| Nome da variavel | `obj.Type().GetVariableName(i)` | `string` |
| Tipo da variavel | `obj.Type().GetVariableType(i)` | `typename` |
| Ler propriedade | `EnScript.GetClassVar(obj, name, 0, out val)` | `void` |
| Escrever propriedade | `EnScript.SetClassVar(obj, name, 0, val)` | `bool` |

---

## Navegacao

| Anterior | Acima | Proximo |
|----------|-------|---------|
| [1.8 Gerenciamento de Memoria](08-memory-management.md) | [Parte 1: Enforce Script](../README.md) | [1.10 Enums & Preprocessador](10-enums-preprocessor.md) |
