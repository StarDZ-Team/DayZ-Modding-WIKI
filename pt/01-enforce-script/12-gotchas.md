# Chapter 1.12: What Does NOT Exist (Gotchas)

[Home](../README.md) | [<< Previous: Error Handling](11-error-handling.md) | **Gotchas** | [Next: Functions & Methods >>](13-functions-methods.md)

---

## Sumario

- [Referencia Completa de Gotchas](#referencia-completa-de-gotchas)
  1. [Sem Operador Ternario](#1-sem-operador-ternario)
  2. [Sem Loop do...while](#2-sem-loop-dowhile)
  3. [Sem try/catch/throw](#3-sem-trycatchthrow)
  4. [Sem Heranca Multipla](#4-sem-heranca-multipla)
  5. [Sem Sobrecarga de Operadores (Exceto Index)](#5-sem-sobrecarga-de-operadores-exceto-index)
  6. [Sem Lambdas / Funcoes Anonimas](#6-sem-lambdas--funcoes-anonimas)
  7. [Sem Delegates / Ponteiros de Funcao (Nativos)](#7-sem-delegates--ponteiros-de-funcao-nativos)
  8. [Sem Escape de String para Barra Invertida/Aspas](#8-sem-escape-de-string-para-barra-invertidaaspas)
  9. [Sem Redeclaracao de Variavel em Blocos else-if](#9-sem-redeclaracao-de-variavel-em-blocos-else-if)
  10. [Sem Ternario em Declaracao de Variavel](#10-sem-ternario-em-declaracao-de-variavel)
  11. [Object.IsAlive() NAO Existe no Object Base](#11-objectisalive-nao-existe-no-object-base)
  12. [Sem nullptr -- Use NULL ou null](#12-sem-nullptr----use-null-ou-null)
  13. [switch/case NAO Tem Fall-Through](#13-switchcase-nao-tem-fall-through)
  14. [Sem Expressoes em Parametros Default](#14-sem-expressoes-em-parametros-default)
  15. [JsonFileLoader.JsonLoadFile Retorna void](#15-jsonfileloaderjsonloadfile-retorna-void)
  16. [Sem Substituicao de Valor em #define](#16-sem-substituicao-de-valor-em-define)
  17. [Sem Interfaces / Classes Abstratas (Impostas)](#17-sem-interfaces--classes-abstratas-impostas)
  18. [Sem Restricoes em Generics](#18-sem-restricoes-em-generics)
  19. [Sem Validacao de Enum](#19-sem-validacao-de-enum)
  20. [Sem Parametros Variadicos](#20-sem-parametros-variadicos)
  21. [Sem Declaracoes de Classe Aninhadas](#21-sem-declaracoes-de-classe-aninhadas)
  22. [Arrays Estaticos Sao de Tamanho Fixo](#22-arrays-estaticos-sao-de-tamanho-fixo)
  23. [array.Remove Nao Preserva Ordem](#23-arrayremove-nao-preserva-ordem)
  24. [Sem #include -- Tudo via config.cpp](#24-sem-include----tudo-via-configcpp)
  25. [Sem Namespaces](#25-sem-namespaces)
  26. [Metodos de String Modificam In-Place](#26-metodos-de-string-modificam-in-place)
  27. [Ciclos de ref Causam Vazamentos de Memoria](#27-ciclos-de-ref-causam-vazamentos-de-memoria)
  28. [Sem Garantia de Destrutor no Shutdown do Servidor](#28-sem-garantia-de-destrutor-no-shutdown-do-servidor)
  29. [Sem Gerenciamento de Recursos Baseado em Escopo (RAII)](#29-sem-gerenciamento-de-recursos-baseado-em-escopo-raii)
  30. [GetGame().GetPlayer() Retorna null no Servidor](#30-getgamegetplayer-retorna-null-no-servidor)
- [Vindo do C++](#vindo-do-c)
- [Vindo do C#](#vindo-do-c-1)
- [Vindo do Java](#vindo-do-java)
- [Vindo do Python](#vindo-do-python)
- [Tabela de Referencia Rapida](#tabela-de-referencia-rapida)
- [Navegacao](#navegacao)

---

## Referencia Completa de Gotchas

### 1. Sem Operador Ternario

**O que voce escreveria:**
```c
int x = (condition) ? valueA : valueB;
```

**O que acontece:** Erro de compilacao. O operador `? :` nao existe.

**Solucao correta:**
```c
int x;
if (condition)
    x = valueA;
else
    x = valueB;
```

---

### 2. Sem Loop do...while

**O que voce escreveria:**
```c
do {
    Process();
} while (HasMore());
```

**O que acontece:** Erro de compilacao. A palavra-chave `do` nao existe.

**Solucao correta -- padrao com flag:**
```c
bool first = true;
while (first || HasMore())
{
    first = false;
    Process();
}
```

**Solucao correta -- padrao com break:**
```c
while (true)
{
    Process();
    if (!HasMore())
        break;
}
```

---

### 3. Sem try/catch/throw

**O que voce escreveria:**
```c
try {
    RiskyOperation();
} catch (Exception e) {
    HandleError(e);
}
```

**O que acontece:** Erro de compilacao. Essas palavras-chave nao existem.

**Solucao correta:** Guard clauses com retorno antecipado.
```c
void DoOperation()
{
    if (!CanDoOperation())
    {
        ErrorEx("Cannot perform operation", ErrorExSeverity.WARNING);
        return;
    }

    // Proceed safely
    RiskyOperation();
}
```

Veja o [Capitulo 1.11 -- Tratamento de Erros](11-error-handling.md) para padroes completos.

---

### 4. Sem Heranca Multipla

**O que voce escreveria:**
```c
class MyClass extends BaseA, BaseB  // Two base classes
```

**O que acontece:** Erro de compilacao. Apenas heranca simples e suportada.

**Solucao correta:** Herde de uma classe, componha a outra:
```c
class MyClass extends BaseA
{
    ref BaseB m_Helper;

    void MyClass()
    {
        m_Helper = new BaseB();
    }
}
```

---

### 5. Sem Sobrecarga de Operadores (Exceto Index)

**O que voce escreveria:**
```c
Vector3 operator+(Vector3 a, Vector3 b) { ... }
bool operator==(MyClass other) { ... }
```

**O que acontece:** Erro de compilacao. Operadores customizados nao podem ser definidos.

**Solucao correta:** Use metodos nomeados:
```c
class MyVector
{
    float x, y, z;

    MyVector Add(MyVector other)
    {
        MyVector result = new MyVector();
        result.x = x + other.x;
        result.y = y + other.y;
        result.z = z + other.z;
        return result;
    }

    bool Equals(MyVector other)
    {
        return (x == other.x && y == other.y && z == other.z);
    }
}
```

**Excecao:** O operador de indice `[]` pode ser sobrecarregado via metodos `Get(index)` e `Set(index, value)`:
```c
class MyContainer
{
    int data[10];

    int Get(int index) { return data[index]; }
    void Set(int index, int value) { data[index] = value; }
}

MyContainer c = new MyContainer();
c[3] = 42;        // Calls Set(3, 42)
int v = c[3];     // Calls Get(3)
```

---

### 6. Sem Lambdas / Funcoes Anonimas

**O que voce escreveria:**
```c
array.Sort((a, b) => a.name.CompareTo(b.name));
button.OnClick += () => { DoSomething(); };
```

**O que acontece:** Erro de compilacao. A sintaxe de lambda nao existe.

**Solucao correta:** Defina metodos nomeados e passe-os como `ScriptCaller` ou use callbacks baseados em string:
```c
// Named method
void OnButtonClick()
{
    DoSomething();
}

// String-based callback (used by CallLater, timers, etc.)
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.OnButtonClick, 1000, false);
```

---

### 7. Sem Delegates / Ponteiros de Funcao (Nativos)

**O que voce escreveria:**
```c
delegate void MyCallback(int value);
MyCallback cb = SomeFunction;
cb(42);
```

**O que acontece:** Erro de compilacao. A palavra-chave `delegate` nao existe.

**Solucao correta:** Use `ScriptCaller`, `ScriptInvoker` ou nomes de metodos baseados em string:
```c
// ScriptCaller (single callback)
ScriptCaller caller = ScriptCaller.Create(MyFunction);

// ScriptInvoker (event with multiple subscribers)
ref ScriptInvoker m_OnEvent = new ScriptInvoker();
m_OnEvent.Insert(MyHandler);
m_OnEvent.Invoke();  // Calls all registered handlers
```

---

### 8. Sem Escape de String para Barra Invertida/Aspas

**O que voce escreveria:**
```c
string path = "C:\\Users\\folder";
string quote = "He said \"hello\"";
```

**O que acontece:** O CParser trava ou produz saida ilegivel. As sequencias de escape `\\` e `\"` quebram o parser de string.

**Solucao correta:** Evite totalmente caracteres de barra invertida e aspas em literais de string:
```c
// Use forward slashes for paths
string path = "C:/Users/folder";

// Use single quotes or rephrase to avoid embedded double quotes
string quote = "He said 'hello'";

// Use string concatenation if you absolutely need special chars
// (still risky -- test thoroughly)
```

> **Nota:** As sequencias de escape `\n`, `\r` e `\t` funcionam normalmente. Apenas `\\` e `\"` estao quebradas.

---

### 9. Sem Redeclaracao de Variavel em Blocos else-if

**O que voce escreveria:**
```c
if (condA)
{
    string msg = "Case A";
    Print(msg);
}
else if (condB)
{
    string msg = "Case B";  // Same variable name in sibling block
    Print(msg);
}
```

**O que acontece:** Erro de compilacao: "multiple declaration of variable 'msg'". O Enforce Script trata variaveis em blocos irmao `if`/`else if`/`else` como compartilhando o mesmo escopo.

**Solucao correta -- nomes unicos:**
```c
if (condA)
{
    string msgA = "Case A";
    Print(msgA);
}
else if (condB)
{
    string msgB = "Case B";
    Print(msgB);
}
```

**Solucao correta -- declarar antes do if:**
```c
string msg;
if (condA)
{
    msg = "Case A";
}
else if (condB)
{
    msg = "Case B";
}
Print(msg);
```

---

### 10. Sem Ternario em Declaracao de Variavel

Relacionado ao gotcha #1, mas especifico para declaracoes:

**O que voce escreveria:**
```c
string label = isAdmin ? "Admin" : "Player";
```

**Solucao correta:**
```c
string label;
if (isAdmin)
    label = "Admin";
else
    label = "Player";
```

---

### 11. Object.IsAlive() NAO Existe no Object Base

**O que voce escreveria:**
```c
Object obj = GetSomething();
if (obj.IsAlive())  // Check if alive
```

**O que acontece:** Erro de compilacao ou travamento em tempo de execucao. `IsAlive()` e definido em `EntityAI`, nao em `Object`.

**Solucao correta:**
```c
Object obj = GetSomething();
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive())
{
    // Safely alive
}
```

---

### 12. Sem nullptr -- Use NULL ou null

**O que voce escreveria:**
```c
if (obj == nullptr)
```

**O que acontece:** Erro de compilacao. A palavra-chave `nullptr` nao existe.

**Solucao correta:**
```c
if (obj == null)    // lowercase works
if (obj == NULL)    // uppercase also works
if (!obj)           // idiomatic null check (preferred)
```

---

### 13. switch/case NAO Tem Fall-Through

**O que voce escreveria (esperando fall-through do C/C++):**
```c
switch (value)
{
    case 1:
    case 2:
    case 3:
        Print("1, 2, or 3");  // In C++, cases 1 and 2 fall through to here
        break;
}
```

**O que acontece:** Apenas o case 3 executa o Print. Cases 1 e 2 estao vazios -- nao fazem nada e NAO tem fall-through.

**Solucao correta:**
```c
if (value >= 1 && value <= 3)
{
    Print("1, 2, or 3");
}

// Or handle each case explicitly:
switch (value)
{
    case 1:
        Print("1, 2, or 3");
        break;
    case 2:
        Print("1, 2, or 3");
        break;
    case 3:
        Print("1, 2, or 3");
        break;
}
```

> **Nota:** `break` e tecnicamente opcional no Enforce Script ja que nao ha fall-through, mas e convencional inclui-lo.

---

### 14. Sem Expressoes em Parametros Default

**O que voce escreveria:**
```c
void Spawn(vector pos = GetDefaultPos())    // Expression as default
void Spawn(vector pos = Vector(0, 100, 0))  // Constructor as default
```

**O que acontece:** Erro de compilacao. Valores default de parametros devem ser **literais** ou `NULL`.

**Solucao correta:**
```c
void Spawn(vector pos = "0 100 0")    // String literal for vector -- OK
void Spawn(int count = 5)             // Integer literal -- OK
void Spawn(float radius = 10.0)      // Float literal -- OK
void Spawn(string name = "default")   // String literal -- OK
void Spawn(Object obj = NULL)         // NULL -- OK

// For complex defaults, use overloads:
void Spawn()
{
    Spawn(GetDefaultPos());  // Call the parametric version
}

void Spawn(vector pos)
{
    // Actual implementation
}
```

---

### 15. JsonFileLoader.JsonLoadFile Retorna void

**O que voce escreveria:**
```c
MyConfig cfg = JsonFileLoader<MyConfig>.JsonLoadFile(path);
// or:
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg))
```

**O que acontece:** Erro de compilacao. `JsonLoadFile` retorna `void`, nao o objeto carregado ou um bool.

**Solucao correta:**
```c
MyConfig cfg = new MyConfig();  // Create instance first with defaults
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // Populates cfg in-place
// cfg now contains loaded values (or still has defaults if file was invalid)
```

> **Nota:** O metodo mais recente `JsonFileLoader<T>.LoadFile()` retorna `bool`, mas `JsonLoadFile` (a versao comumente vista) nao retorna.

---

### 16. Sem Substituicao de Valor em #define

**O que voce escreveria:**
```c
#define MAX_PLAYERS 60
#define VERSION_STRING "1.0.0"
int max = MAX_PLAYERS;
```

**O que acontece:** Erro de compilacao. O `#define` do Enforce Script so cria flags de existencia para verificacoes `#ifdef`. Nao suporta substituicao de valor.

**Solucao correta:**
```c
// Use const for values
const int MAX_PLAYERS = 60;
const string VERSION_STRING = "1.0.0";

// Use #define only for conditional compilation flags
#define MY_MOD_ENABLED
```

---

### 17. Sem Interfaces / Classes Abstratas (Impostas)

**O que voce escreveria:**
```c
interface ISerializable
{
    void Serialize();
    void Deserialize();
}

abstract class BaseProcessor
{
    abstract void Process();
}
```

**O que acontece:** As palavras-chave `interface` e `abstract` nao existem.

**Solucao correta:** Use classes regulares com metodos base vazios:
```c
// "Interface" -- base class with empty methods
class ISerializable
{
    void Serialize() {}     // Override in subclass
    void Deserialize() {}   // Override in subclass
}

// "Abstract" class -- same pattern
class BaseProcessor
{
    void Process()
    {
        ErrorEx("BaseProcessor.Process() must be overridden!", ErrorExSeverity.ERROR);
    }
}

class ConcreteProcessor extends BaseProcessor
{
    override void Process()
    {
        // Actual implementation
    }
}
```

O compilador NAO impoe que subclasses facam override dos metodos base. Esquecer de fazer override silenciosamente usa a implementacao base vazia.

---

### 18. Sem Restricoes em Generics

**O que voce escreveria:**
```c
class Container<T> where T : EntityAI  // Constrain T to EntityAI
```

**O que acontece:** Erro de compilacao. A clausula `where` nao existe. Parametros de template aceitam qualquer tipo.

**Solucao correta:** Valide em tempo de execucao:
```c
class EntityContainer<Class T>
{
    void Add(T item)
    {
        // Runtime type check instead of compile-time constraint
        EntityAI eai;
        if (!Class.CastTo(eai, item))
        {
            ErrorEx("EntityContainer only accepts EntityAI subclasses");
            return;
        }
        // proceed
    }
}
```

---

### 19. Sem Validacao de Enum

**O que voce escreveria:**
```c
EDamageState state = (EDamageState)999;  // Expect error or exception
```

**O que acontece:** Sem erro. Qualquer valor `int` pode ser atribuido a uma variavel enum, mesmo valores fora do intervalo definido.

**Solucao correta:** Valide manualmente:
```c
bool IsValidDamageState(int value)
{
    return (value >= EDamageState.PRISTINE && value <= EDamageState.RUINED);
}

int rawValue = LoadFromConfig();
if (IsValidDamageState(rawValue))
{
    EDamageState state = rawValue;
}
else
{
    Print("Invalid damage state: " + rawValue.ToString());
    EDamageState state = EDamageState.PRISTINE;  // fallback
}
```

---

### 20. Sem Parametros Variadicos

**O que voce escreveria:**
```c
void Log(string format, params object[] args)
void Printf(string fmt, ...)
```

**O que acontece:** Erro de compilacao. Parametros variadicos nao existem.

**Solucao correta:** Use `string.Format` com contagem fixa de parametros, ou use classes `Param`:
```c
// string.Format supports up to 9 positional arguments
string msg = string.Format("Player %1 at %2 with %3 HP", name, pos, hp);

// For variable-count data, pass an array
void LogMultiple(string tag, array<string> messages)
{
    foreach (string msg : messages)
    {
        Print("[" + tag + "] " + msg);
    }
}
```

---

### 21. Sem Declaracoes de Classe Aninhadas

**O que voce escreveria:**
```c
class Outer
{
    class Inner  // Nested class
    {
        int value;
    }
}
```

**O que acontece:** Erro de compilacao. Classes nao podem ser declaradas dentro de outras classes.

**Solucao correta:** Declare todas as classes no nivel superior, use convencoes de nomenclatura para mostrar relacionamentos:
```c
class MySystem_Config
{
    int value;
}

class MySystem
{
    ref MySystem_Config m_Config;
}
```

---

### 22. Arrays Estaticos Sao de Tamanho Fixo

**O que voce escreveria:**
```c
int size = GetCount();
int arr[size];  // Dynamic size at runtime
```

**O que acontece:** Erro de compilacao. Tamanhos de arrays estaticos devem ser constantes em tempo de compilacao.

**Solucao correta:**
```c
// Use a const for static arrays
const int BUFFER_SIZE = 64;
int arr[BUFFER_SIZE];

// Or use dynamic arrays for runtime sizing
array<int> arr = new array<int>;
arr.Resize(GetCount());
```

---

### 23. array.Remove Nao Preserva Ordem

**O que voce escreveria (esperando preservacao de ordem):**
```c
array<string> items = {"A", "B", "C", "D"};
items.Remove(1);  // Expect: {"A", "C", "D"}
```

**O que acontece:** `Remove(index)` troca o elemento com o **ultimo** elemento, depois remove o ultimo. Resultado: `{"A", "D", "C"}`. A ordem NAO e preservada.

**Solucao correta:**
```c
// Use RemoveOrdered for order preservation (slower -- shifts elements)
items.RemoveOrdered(1);  // {"A", "C", "D"} -- correct order

// Use RemoveItem to find and remove by value (also ordered)
items.RemoveItem("B");   // {"A", "C", "D"}
```

---

### 24. Sem #include -- Tudo via config.cpp

**O que voce escreveria:**
```c
#include "MyHelper.c"
#include "Utils/StringUtils.c"
```

**O que acontece:** Sem efeito ou erro de compilacao. Nao existe diretiva `#include`.

**Solucao correta:** Todos os arquivos de script sao carregados atraves do `config.cpp` na entrada `CfgMods` do mod. A ordem de carregamento dos arquivos e determinada pela camada de script (`3_Game`, `4_World`, `5_Mission`) e ordem alfabetica dentro de cada camada.

```cpp
// config.cpp
class CfgMods
{
    class MyMod
    {
        type = "mod";
        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                files[] = { "MyMod/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                files[] = { "MyMod/Scripts/4_World" };
            };
            class missionScriptModule
            {
                files[] = { "MyMod/Scripts/5_Mission" };
            };
        };
    };
};
```

---

### 25. Sem Namespaces

**O que voce escreveria:**
```c
namespace MyMod { class Config { } }
namespace MyMod.Utils { class StringHelper { } }
```

**O que acontece:** Erro de compilacao. A palavra-chave `namespace` nao existe. Todas as classes compartilham um unico escopo global.

**Solucao correta:** Use prefixos de nomenclatura para evitar conflitos:
```c
class MyConfig { }          // MyFramework
class MyAI_Config { }       // MyAI Mod
class MyM_MissionData { }   // MyMissions Mod
class VPP_AdminConfig { }     // VPP Admin
```

---

### 26. Metodos de String Modificam In-Place

**O que voce escreveria (esperando um valor de retorno):**
```c
string upper = myString.ToUpper();  // Expect: returns new string
```

**O que acontece:** `ToUpper()` e `ToLower()` modificam a string **in place** e retornam `void`.

**Solucao correta:**
```c
// Make a copy first if you need the original preserved
string original = "Hello World";
string upper = original;
upper.ToUpper();  // upper is now "HELLO WORLD", original unchanged

// Same for TrimInPlace
string trimmed = "  hello  ";
trimmed.TrimInPlace();  // "hello"
```

---

### 27. Ciclos de ref Causam Vazamentos de Memoria

**O que voce escreveria:**
```c
class Parent
{
    ref Child m_Child;
}
class Child
{
    ref Parent m_Parent;  // Circular ref -- both ref each other
}
```

**O que acontece:** Nenhum dos objetos e coletado. As contagens de referencia nunca chegam a zero porque cada um mantem um `ref` para o outro.

**Solucao correta:** Um lado deve usar um ponteiro bruto (sem ref):
```c
class Parent
{
    ref Child m_Child;  // Parent OWNS the child (ref)
}
class Child
{
    Parent m_Parent;    // Child REFERENCES the parent (raw -- no ref)
}
```

---

### 28. Sem Garantia de Destrutor no Shutdown do Servidor

**O que voce escreveria (esperando limpeza):**
```c
void ~MyManager()
{
    SaveData();  // Expect this runs on shutdown
}
```

**O que acontece:** O shutdown do servidor pode matar o processo antes dos destrutores executarem. Seu save nunca acontece.

**Solucao correta:** Salve proativamente em intervalos regulares e em eventos de ciclo de vida conhecidos:
```c
class MyManager
{
    void OnMissionFinish()  // Called before shutdown
    {
        SaveData();  // Reliable save point
    }

    void OnUpdate(float dt)
    {
        m_SaveTimer += dt;
        if (m_SaveTimer > 300.0)  // Every 5 minutes
        {
            SaveData();
            m_SaveTimer = 0;
        }
    }
}
```

---

### 29. Sem Gerenciamento de Recursos Baseado em Escopo (RAII)

**O que voce escreveria (em C++):**
```c
{
    FileHandle f = OpenFile("test.txt", FileMode.WRITE);
    // f automatically closed when scope ends
}
```

**O que acontece:** O Enforce Script nao fecha file handles quando variaveis saem do escopo (mesmo com `autoptr`).

**Solucao correta:** Sempre feche recursos explicitamente:
```c
FileHandle fh = OpenFile("$profile:MyMod/data.txt", FileMode.WRITE);
if (fh != 0)
{
    FPrintln(fh, "data");
    CloseFile(fh);  // Must close manually!
}
```

---

### 30. GetGame().GetPlayer() Retorna null no Servidor

**O que voce escreveria:**
```c
PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
player.DoSomething();  // CRASH on server!
```

**O que acontece:** `GetGame().GetPlayer()` retorna o jogador **local**. Em um servidor dedicado, nao ha jogador local -- retorna `null`.

**Solucao correta:** No servidor, itere a lista de jogadores:
```c
#ifdef SERVER
    array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);
    foreach (Man man : players)
    {
        PlayerBase player;
        if (Class.CastTo(player, man))
        {
            player.DoSomething();
        }
    }
#else
    PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
    if (player)
    {
        player.DoSomething();
    }
#endif
```

---

## Vindo do C++

Se voce e um desenvolvedor C++, aqui estao os maiores ajustes:

| Recurso C++ | Equivalente no Enforce Script |
|-------------|-------------------------------|
| `std::vector` | `array<T>` |
| `std::map` | `map<K,V>` |
| `std::unique_ptr` | `ref` / `autoptr` |
| `dynamic_cast<T*>` | `Class.CastTo()` ou `T.Cast()` |
| `try/catch` | Guard clauses |
| `operator+` | Metodos nomeados (`Add()`) |
| `namespace` | Prefixos de nome (`My`, `VPP_`) |
| `#include` | config.cpp `files[]` |
| RAII | Limpeza manual em metodos de ciclo de vida |
| Heranca multipla | Heranca simples + composicao |
| `nullptr` | `null` / `NULL` |
| Templates com restricoes | Templates sem restricoes + verificacoes em tempo de execucao |
| `do...while` | `while (true) { ... if (!cond) break; }` |

---

## Vindo do C#

| Recurso C# | Equivalente no Enforce Script |
|------------|-------------------------------|
| `interface` | Classe base com metodos vazios |
| `abstract` | Classe base + ErrorEx nos metodos base |
| `delegate` / `event` | `ScriptInvoker` |
| Lambda `=>` | Metodos nomeados |
| `?.` condicional de null | Verificacoes manuais de null |
| `??` coalescencia de null | `if (!x) x = default;` |
| `try/catch` | Guard clauses |
| `using` (IDisposable) | Limpeza manual |
| Properties `{ get; set; }` | Campos publicos ou metodos getter/setter explicitos |
| LINQ | Loops manuais |
| `nameof()` | Strings hardcoded |
| `async/await` | CallLater / timers |

---

## Vindo do Java

| Recurso Java | Equivalente no Enforce Script |
|-------------|-------------------------------|
| `interface` | Classe base com metodos vazios |
| `try/catch/finally` | Guard clauses |
| Coleta de lixo | `ref` + contagem de referencias (sem GC para ciclos) |
| `@Override` | Palavra-chave `override` |
| `instanceof` | `obj.IsInherited(typename)` |
| `package` | Prefixos de nome |
| `import` | config.cpp `files[]` |
| `enum` com metodos | `enum` (apenas int) + classe auxiliar |
| `final` | `const` (apenas para variaveis) |
| Annotations | Nao disponivel |

---

## Vindo do Python

| Recurso Python | Equivalente no Enforce Script |
|---------------|-------------------------------|
| Tipagem dinamica | Tipagem estatica (todas variaveis tipadas) |
| `try/except` | Guard clauses |
| `lambda` | Metodos nomeados |
| List comprehension | Loops manuais |
| `**kwargs` / `*args` | Parametros fixos |
| Duck typing | `IsInherited()` / `Class.CastTo()` |
| `__init__` | Construtor (mesmo nome da classe) |
| `__del__` | Destrutor (`~NomeDaClasse()`) |
| `import` | config.cpp `files[]` |
| Heranca multipla | Heranca simples + composicao |
| `None` | `null` / `NULL` |
| Blocos baseados em indentacao | Chaves `{ }` |
| f-strings | `string.Format("text %1 %2", a, b)` |

---

## Tabela de Referencia Rapida

| Recurso | Existe? | Solucao |
|---------|---------|---------|
| Ternario `? :` | Nao | if/else |
| `do...while` | Nao | while + break |
| `try/catch` | Nao | Guard clauses |
| Heranca multipla | Nao | Composicao |
| Sobrecarga de operadores | Apenas index | Metodos nomeados |
| Lambdas | Nao | Metodos nomeados |
| Delegates | Nao | `ScriptInvoker` |
| `\\` / `\"` em strings | Quebrado | Evite-os |
| Redeclaracao de variavel | Quebrado em else-if | Nomes unicos ou declarar antes do if |
| `Object.IsAlive()` | Nao no Object base | Cast para `EntityAI` primeiro |
| `nullptr` | Nao | `null` / `NULL` |
| Fall-through em switch | Nao | Cada case e independente |
| Expressoes em parametros default | Nao | Apenas literais ou NULL |
| Valores em `#define` | Nao | `const` |
| Interfaces | Nao | Classe base vazia |
| Restricoes em generics | Nao | Verificacoes de tipo em tempo de execucao |
| Validacao de enum | Nao | Verificacao manual de intervalo |
| Parametros variadicos | Nao | `string.Format` ou arrays |
| Classes aninhadas | Nao | Nivel superior com nomes prefixados |
| Arrays estaticos de tamanho variavel | Nao | `array<T>` |
| `#include` | Nao | config.cpp `files[]` |
| Namespaces | Nao | Prefixos de nome |
| RAII | Nao | Limpeza manual |
| `GetGame().GetPlayer()` no servidor | Retorna null | Iterar `GetPlayers()` |

---

## Navegacao

| Anterior | Acima | Proximo |
|----------|-------|---------|
| [1.11 Tratamento de Erros](11-error-handling.md) | [Parte 1: Enforce Script](../README.md) | [Parte 2: Estrutura de Mods](../02-mod-structure/01-five-layers.md) |
