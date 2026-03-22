# Chapter 1.8: Memory Management

[Home](../README.md) | [<< Previous: Math & Vectors](07-math-vectors.md) | **Memory Management** | [Next: Casting & Reflection >>](09-casting-reflection.md)

---

## Introducao

O Enforce Script usa **contagem automatica de referencias (ARC)** para gerenciamento de memoria -- nao e coleta de lixo no sentido tradicional. Entender como `ref`, `autoptr` e ponteiros brutos funcionam e essencial para escrever mods estaveis para DayZ. Erre nisso e voce ira ou vazar memoria (seu servidor consome gradualmente mais RAM ate travar) ou acessar objetos deletados (travamento instantaneo sem mensagem de erro util). Este capitulo explica cada tipo de ponteiro, quando usar cada um, e como evitar a armadilha mais perigosa: ciclos de referencia.

---

## Os Tres Tipos de Ponteiro

O Enforce Script tem tres formas de manter uma referencia a um objeto:

| Tipo de Ponteiro | Palavra-chave | Mantem Objeto Vivo? | Zerado ao Deletar? | Uso Principal |
|-----------------|---------------|---------------------|---------------------|---------------|
| **Ponteiro bruto** | *(nenhuma)* | Nao (referencia fraca) | Somente se a classe estende `Managed` | Back-references, observadores, caches |
| **Referencia forte** | `ref` | Sim | Sim | Membros que o objeto possui, colecoes |
| **Ponteiro automatico** | `autoptr` | Sim, deletado ao sair do escopo | Sim | Variaveis locais |

### Como o ARC Funciona

Cada objeto tem uma **contagem de referencias** -- o numero de referencias fortes (`ref`, `autoptr`, variaveis locais, argumentos de funcao) apontando para ele. Quando a contagem chega a zero, o objeto e automaticamente destruido e seu destrutor e chamado.

**Referencias fracas** (ponteiros brutos) NAO incrementam a contagem de referencias. Elas observam o objeto sem mante-lo vivo.

---

## Ponteiros Brutos (Referencias Fracas)

Um ponteiro bruto e qualquer variavel declarada sem `ref` ou `autoptr`. Para membros de classe, isso cria uma **referencia fraca**: ela aponta para o objeto mas NAO o mantem vivo.

```c
class Observer
{
    PlayerBase m_WatchedPlayer;  // Weak reference -- does NOT keep player alive

    void Watch(PlayerBase player)
    {
        m_WatchedPlayer = player;
    }

    void Report()
    {
        if (m_WatchedPlayer) // ALWAYS null-check weak references
        {
            Print("Watching: " + m_WatchedPlayer.GetIdentity().GetName());
        }
        else
        {
            Print("Player no longer exists");
        }
    }
}
```

### Classes Managed vs Nao-Managed

A seguranca de referencias fracas depende de a classe do objeto estender `Managed`:

- **Classes Managed** (maioria das classes de gameplay do DayZ): Quando o objeto e deletado, todas as referencias fracas sao automaticamente definidas como `null`. Isso e seguro.
- **Classes nao-Managed** (`class` pura sem herdar de `Managed`): Quando o objeto e deletado, referencias fracas se tornam **ponteiros danificados** -- elas ainda mantem o endereco de memoria antigo. Acessa-las causa um travamento.

```c
// SAFE -- Managed class, weak refs are zeroed
class SafeData : Managed
{
    int m_Value;
}

void TestManaged()
{
    SafeData data = new SafeData();
    SafeData weakRef = data;
    delete data;

    if (weakRef) // false -- weakRef was automatically set to null
    {
        Print(weakRef.m_Value); // Never reached
    }
}
```

```c
// DANGEROUS -- Non-Managed class, weak refs become dangling
class UnsafeData
{
    int m_Value;
}

void TestNonManaged()
{
    UnsafeData data = new UnsafeData();
    UnsafeData weakRef = data;
    delete data;

    if (weakRef) // TRUE -- weakRef still holds old address!
    {
        Print(weakRef.m_Value); // CRASH! Accessing deleted memory
    }
}
```

> **Regra:** Se voce esta escrevendo suas proprias classes, sempre estenda `Managed` por seguranca. A maioria das classes do engine do DayZ (EntityAI, ItemBase, PlayerBase, etc.) ja herda de `Managed`.

---

## ref (Referencia Forte)

A palavra-chave `ref` marca uma variavel como uma **referencia forte**. O objeto permanece vivo enquanto pelo menos uma referencia forte existir. Quando a ultima referencia forte e destruida ou sobrescrita, o objeto e deletado.

### Membros de classe

Use `ref` para objetos que sua classe **possui** e e responsavel por criar e destruir.

```c
class MissionManager
{
    protected ref array<ref MissionBase> m_ActiveMissions;
    protected ref map<string, ref MissionConfig> m_Configs;
    protected ref MyLog m_Logger;

    void MissionManager()
    {
        m_ActiveMissions = new array<ref MissionBase>;
        m_Configs = new map<string, ref MissionConfig>;
        m_Logger = new MyLog;
    }

    // No destructor needed! When MissionManager is deleted:
    // 1. m_Logger ref is released -> MyLog is deleted
    // 2. m_Configs ref is released -> map is deleted -> each MissionConfig is deleted
    // 3. m_ActiveMissions ref is released -> array is deleted -> each MissionBase is deleted
}
```

### Colecoes de objetos possuidos

Quando voce armazena objetos em um array ou map e quer que a colecao os possua, use `ref` tanto na colecao QUANTO nos elementos:

```c
class ZoneManager
{
    // The array is owned (ref), and each zone inside is owned (ref)
    protected ref array<ref SafeZone> m_Zones;

    void ZoneManager()
    {
        m_Zones = new array<ref SafeZone>;
    }

    void AddZone(vector center, float radius)
    {
        ref SafeZone zone = new SafeZone(center, radius);
        m_Zones.Insert(zone);
    }
}
```

**Distincao critica:** Um `array<SafeZone>` mantem referencias **fracas**. Um `array<ref SafeZone>` mantem referencias **fortes**. Se voce usar a versao fraca, objetos inseridos no array podem ser imediatamente deletados porque nenhuma referencia forte os mantem vivos.

```c
// WRONG -- Objects are deleted immediately after insertion!
ref array<MyClass> weakArray = new array<MyClass>;
weakArray.Insert(new MyClass()); // Object created, inserted as weak ref,
                                  // no strong ref exists -> IMMEDIATELY deleted

// CORRECT -- Objects are kept alive by the array
ref array<ref MyClass> strongArray = new array<ref MyClass>;
strongArray.Insert(new MyClass()); // Object lives as long as it's in the array
```

---

## autoptr (Referencia Forte com Escopo)

`autoptr` e identico a `ref` mas e destinado a **variaveis locais**. O objeto e automaticamente deletado quando a variavel sai do escopo (quando a funcao retorna).

```c
void ProcessData()
{
    autoptr JsonSerializer serializer = new JsonSerializer;
    // Use serializer...

    // serializer is automatically deleted here when the function exits
}
```

### Quando usar autoptr

Na pratica, **variaveis locais ja sao referencias fortes por padrao** no Enforce Script. A palavra-chave `autoptr` torna isso explicito e autodocumentado. Voce pode usar qualquer uma das formas:

```c
void Example()
{
    // These are functionally equivalent:
    MyClass a = new MyClass();       // Local var = strong ref (implicit)
    autoptr MyClass b = new MyClass(); // Local var = strong ref (explicit)

    // Both a and b are deleted when this function exits
}
```

> **Convencao em modding DayZ:** A maioria das codebases usa `ref` para membros de classe e omite `autoptr` para variaveis locais (confiando no comportamento implicito de referencia forte). O CLAUDE.md deste projeto nota: "**`autoptr` NAO e usado** -- use `ref` explicito." Siga a convencao que seu projeto estabelecer.

---

## Modificador de Parametro notnull

O modificador `notnull` em um parametro de funcao informa ao compilador que null nao e um argumento valido. O compilador impoe isso nos pontos de chamada.

```c
void ProcessPlayer(notnull PlayerBase player)
{
    // No need to check for null -- the compiler guarantees it
    string name = player.GetIdentity().GetName();
    Print("Processing: " + name);
}

void CallExample(PlayerBase maybeNull)
{
    if (maybeNull)
    {
        ProcessPlayer(maybeNull); // OK -- we checked first
    }

    // ProcessPlayer(null); // COMPILE ERROR: cannot pass null to notnull parameter
}
```

Use `notnull` em parametros onde null sempre seria um erro de programacao. Ele captura bugs em tempo de compilacao ao inves de causar travamentos em tempo de execucao.

---

## Ciclos de Referencia (ALERTA DE VAZAMENTO DE MEMORIA)

Um ciclo de referencia ocorre quando dois objetos mantem referencias fortes (`ref`) um para o outro. Nenhum objeto pode ser deletado porque cada um mantem o outro vivo. Esta e a fonte mais comum de vazamentos de memoria em mods de DayZ.

### O problema

```c
class Parent
{
    ref Child m_Child; // Strong reference to Child
}

class Child
{
    ref Parent m_Parent; // Strong reference to Parent -- CYCLE!
}

void CreateCycle()
{
    ref Parent parent = new Parent();
    ref Child child = new Child();

    parent.m_Child = child;
    child.m_Parent = parent;

    // When this function exits:
    // - The local 'parent' ref is released, but child.m_Parent still holds parent alive
    // - The local 'child' ref is released, but parent.m_Child still holds child alive
    // NEITHER object is ever deleted! This is a permanent memory leak.
}
```

### A correcao: Um lado deve ser uma referencia bruta (fraca)

Quebre o ciclo fazendo um lado usar referencia fraca. O "filho" deve manter uma referencia fraca para seu "pai":

```c
class Parent
{
    ref Child m_Child; // Strong -- parent OWNS the child
}

class Child
{
    Parent m_Parent; // Weak (raw) -- child OBSERVES the parent
}

void NoCycle()
{
    ref Parent parent = new Parent();
    ref Child child = new Child();

    parent.m_Child = child;
    child.m_Parent = parent;

    // When this function exits:
    // - Local 'parent' ref is released -> parent's ref count = 0 -> DELETED
    // - Parent destructor releases m_Child -> child's ref count = 0 -> DELETED
    // Both objects are properly cleaned up!
}
```

### Exemplo do mundo real: Paineis de UI

Um padrao comum no codigo de UI do DayZ e um painel que mantem widgets, onde widgets precisam de uma referencia de volta ao painel. O painel possui os widgets (ref forte), e os widgets observam o painel (ref fraca).

```c
class AdminPanel
{
    protected ref array<ref AdminPanelTab> m_Tabs; // Owns the tabs

    void AdminPanel()
    {
        m_Tabs = new array<ref AdminPanelTab>;
    }

    void AddTab(string name)
    {
        ref AdminPanelTab tab = new AdminPanelTab(name, this);
        m_Tabs.Insert(tab);
    }
}

class AdminPanelTab
{
    protected string m_Name;
    protected AdminPanel m_Owner; // WEAK -- avoids cycle

    void AdminPanelTab(string name, AdminPanel owner)
    {
        m_Name = name;
        m_Owner = owner; // Weak reference back to parent
    }

    AdminPanel GetOwner()
    {
        return m_Owner; // May be null if panel was deleted
    }
}
```

---

## A Palavra-chave delete

Voce pode deletar manualmente um objeto a qualquer momento usando `delete`. Isso destroi o objeto **imediatamente**, independentemente de sua contagem de referencias. Todas as referencias (tanto fortes quanto fracas, em classes Managed) sao definidas como null.

```c
void ManualDelete()
{
    ref MyClass obj = new MyClass();
    ref MyClass anotherRef = obj;

    Print(obj != null);        // true
    Print(anotherRef != null); // true

    delete obj;

    Print(obj != null);        // false
    Print(anotherRef != null); // false (also nulled, on Managed classes)
}
```

### Quando usar delete

```mermaid
sequenceDiagram
    participant Code as Your Code
    participant Obj as MyObject
    participant GC as Garbage Collector

    Code->>Obj: ref MyObject obj = new MyObject()
    Note over Obj: refcount = 1

    Code->>Obj: ref MyObject copy = obj
    Note over Obj: refcount = 2

    Code->>Obj: copy = null
    Note over Obj: refcount = 1

    Code->>Obj: obj = null
    Note over Obj: refcount = 0

    Obj->>GC: ~MyObject() destructor called
    GC->>GC: Memory freed
```

- Quando voce precisa liberar um recurso **imediatamente** (sem esperar pelo ARC)
- Quando faz limpeza em um metodo de shutdown/destroy
- Quando remove objetos do mundo do jogo (`GetGame().ObjectDelete(obj)` para entidades do jogo)

### Quando NAO usar delete

```mermaid
graph LR
    A[Object A<br/>ref m_B] -->|"strong ref"| B[Object B<br/>ref m_A]
    B -->|"strong ref"| A

    style A fill:#D94A4A,color:#fff
    style B fill:#D94A4A,color:#fff

    C["Neither can be freed!<br/>Both refcount = 1 forever"]

    style C fill:#FFD700,color:#000
```

- Em objetos pertencentes a outra coisa (o `ref` do dono se tornara null inesperadamente)
- Em objetos ainda em uso por outros sistemas (timers, callbacks, UI)
- Em entidades gerenciadas pelo engine sem passar pelos canais adequados

---

## Comportamento da Coleta de Lixo

O Enforce Script NAO tem um coletor de lixo tradicional que periodicamente varre objetos inalcancaveis. Ao inves disso, ele usa **contagem de referencias deterministica:**

1. Quando uma referencia forte e criada (atribuicao a `ref`, variavel local, argumento de funcao), a contagem de referencias do objeto aumenta.
2. Quando uma referencia forte sai do escopo ou e sobrescrita, a contagem de referencias diminui.
3. Quando a contagem de referencias chega a zero, o objeto e **imediatamente** destruido (destrutor e chamado, memoria e liberada).
4. `delete` ignora a contagem de referencias e destroi o objeto imediatamente.

Isso significa:
- Tempos de vida dos objetos sao previsiveis e deterministicos
- Nao ha "pausas do GC" ou atrasos imprevisiveis
- Ciclos de referencia NUNCA sao coletados -- sao vazamentos permanentes
- A ordem de destruicao e bem definida: objetos sao destruidos na ordem inversa da liberacao de sua ultima referencia

---

## Exemplo do Mundo Real: Classe Manager Adequada

Aqui esta um exemplo completo mostrando padroes adequados de gerenciamento de memoria para um manager tipico de mod DayZ:

```c
class MyZoneManager
{
    // Singleton instance -- the only strong ref keeping this alive
    private static ref MyZoneManager s_Instance;

    // Owned collections -- manager is responsible for these
    protected ref array<ref MyZone> m_Zones;
    protected ref map<string, ref MyZoneConfig> m_Configs;

    // Weak reference to external system -- we don't own this
    protected PlayerBase m_LastEditor;

    void MyZoneManager()
    {
        m_Zones = new array<ref MyZone>;
        m_Configs = new map<string, ref MyZoneConfig>;
    }

    void ~MyZoneManager()
    {
        // Explicit cleanup (optional -- ARC handles it, but good practice)
        m_Zones.Clear();
        m_Configs.Clear();
        m_LastEditor = null;

        Print("[MyZoneManager] Destroyed");
    }

    static MyZoneManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new MyZoneManager();
        }
        return s_Instance;
    }

    static void DestroyInstance()
    {
        s_Instance = null; // Releases the strong ref, triggers destructor
    }

    void CreateZone(string name, vector center, float radius, PlayerBase editor)
    {
        ref MyZoneConfig config = new MyZoneConfig(name, center, radius);
        m_Configs.Set(name, config);

        ref MyZone zone = new MyZone(config);
        m_Zones.Insert(zone);

        m_LastEditor = editor; // Weak reference -- we don't own the player
    }

    void RemoveZone(int index)
    {
        if (!m_Zones.IsValidIndex(index))
            return;

        MyZone zone = m_Zones.Get(index);
        string name = zone.GetName();

        m_Zones.RemoveOrdered(index); // Strong ref released, zone may be deleted
        m_Configs.Remove(name);       // Config ref released, config deleted
    }

    MyZone FindZoneAtPosition(vector pos)
    {
        foreach (MyZone zone : m_Zones)
        {
            if (zone.ContainsPosition(pos))
                return zone; // Return weak reference to caller
        }
        return null;
    }
}

class MyZone
{
    protected string m_Name;
    protected vector m_Center;
    protected float m_Radius;
    protected MyZoneConfig m_Config; // Weak -- config is owned by manager

    void MyZone(MyZoneConfig config)
    {
        m_Config = config; // Weak reference
        m_Name = config.GetName();
        m_Center = config.GetCenter();
        m_Radius = config.GetRadius();
    }

    string GetName() { return m_Name; }

    bool ContainsPosition(vector pos)
    {
        return vector.Distance(m_Center, pos) <= m_Radius;
    }
}

class MyZoneConfig
{
    protected string m_Name;
    protected vector m_Center;
    protected float m_Radius;

    void MyZoneConfig(string name, vector center, float radius)
    {
        m_Name = name;
        m_Center = center;
        m_Radius = radius;
    }

    string GetName() { return m_Name; }
    vector GetCenter() { return m_Center; }
    float GetRadius() { return m_Radius; }
}
```

### Diagrama de propriedade de memoria para este exemplo

```
MyZoneManager (singleton, owned by static s_Instance)
  |
  |-- ref array<ref MyZone>   m_Zones     [STRONG -> STRONG elements]
  |     |
  |     +-- MyZone
  |           |-- MyZoneConfig m_Config    [WEAK -- owned by m_Configs]
  |
  |-- ref map<string, ref MyZoneConfig> m_Configs  [STRONG -> STRONG elements]
  |     |
  |     +-- MyZoneConfig                   [OWNED here]
  |
  +-- PlayerBase m_LastEditor                [WEAK -- owned by engine]
```

Quando `DestroyInstance()` e chamado:
1. `s_Instance` e definido como null, liberando a referencia forte
2. O destrutor de `MyZoneManager` executa
3. `m_Zones` e liberado -> array e deletado -> cada `MyZone` e deletado
4. `m_Configs` e liberado -> map e deletado -> cada `MyZoneConfig` e deletado
5. `m_LastEditor` e uma referencia fraca, nada a limpar
6. Toda a memoria e liberada. Sem vazamentos.

---

## Erros Comuns

| Erro | Problema | Correcao |
|------|----------|----------|
| Dois objetos com `ref` um para o outro | Ciclo de referencia, vazamento de memoria permanente | Um lado deve ser uma referencia bruta (fraca) |
| `array<MyClass>` ao inves de `array<ref MyClass>` | Elementos sao referencias fracas, objetos podem ser deletados imediatamente | Use `array<ref MyClass>` para elementos possuidos |
| Acessar ponteiro bruto apos o objeto ser deletado | Travamento (ponteiro danificado em classes nao-Managed) | Estenda `Managed` e sempre verifique null em referencias fracas |
| Nao verificar null em referencias fracas | Travamento quando o objeto referenciado foi deletado | Sempre: `if (weakRef) { weakRef.DoThing(); }` |
| Usar `delete` em objetos pertencentes a outro sistema | O `ref` do dono se torna null inesperadamente | Deixe o dono liberar o objeto atraves do ARC |
| Armazenar `ref` para entidades do engine (jogadores, itens) | Pode conflitar com o gerenciamento de tempo de vida do engine | Use ponteiros brutos para entidades do engine |
| Esquecer `ref` em colecoes de membros de classe | Colecao e uma referencia fraca, pode ser coletada | Sempre: `protected ref array<...> m_List;` |
| Parent-child circular com `ref` em ambos os lados | Ciclo classico; nem pai nem filho sao liberados | Pai possui filho (`ref`), filho observa pai (bruto) |

---

## Guia de Decisao: Qual Tipo de Ponteiro?

```
Esta e um membro de classe que esta classe CRIA e POSSUI?
  -> SIM: Use ref
  -> NAO: Esta e uma back-reference ou observacao externa?
    -> SIM: Use ponteiro bruto (sem palavra-chave), sempre verifique null
    -> NAO: Esta e uma variavel local em uma funcao?
      -> SIM: Bruto e suficiente (variaveis locais sao implicitamente fortes)
      -> autoptr explicito e opcional para clareza

Armazenando objetos em uma colecao (array/map)?
  -> Objetos POSSUIDOS pela colecao: array<ref MyClass>
  -> Objetos OBSERVADOS pela colecao: array<MyClass>

Parametro de funcao que nunca deve ser null?
  -> Use o modificador notnull
```

---

## Referencia Rapida

```c
// Raw pointer (weak reference for class members)
MyClass m_Observer;              // Does NOT keep object alive
                                 // Set to null on delete (Managed only)

// Strong reference (keeps object alive)
ref MyClass m_Owned;             // Object lives until ref is released
ref array<ref MyClass> m_List;   // Array AND elements are strongly held

// Auto pointer (scoped strong reference)
autoptr MyClass local;           // Deleted when scope exits

// notnull (compile-time null guard)
void Func(notnull MyClass obj);  // Compiler rejects null arguments

// Manual delete (immediate, bypasses ARC)
delete obj;                      // Destroys immediately, nulls all refs (Managed)

// Break reference cycles: one side must be weak
class Parent { ref Child m_Child; }      // Strong -- parent owns child
class Child  { Parent m_Parent; }        // Weak   -- child observes parent
```

---

[<< 1.7: Matematica & Vetores](07-math-vectors.md) | [Inicio](../README.md) | [1.9: Casting & Reflexao >>](09-casting-reflection.md)
