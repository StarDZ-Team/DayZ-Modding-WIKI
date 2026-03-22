# Enforce Script Cheat Sheet

[Home](./README.md) | **Cheat Sheet**

---

## Tipos

| Tipo | Descricao | Padrao | Exemplo |
|------|-----------|--------|---------|
| `int` | Inteiro com sinal de 32 bits | `0` | `int x = 42;` |
| `float` | Float de 32 bits | `0.0` | `float f = 3.14;` |
| `bool` | Booleano | `false` | `bool b = true;` |
| `string` | Tipo de valor imutavel | `""` | `string s = "hello";` |
| `vector` | 3 componentes float (x,y,z) | `"0 0 0"` | `vector v = "1 2 3";` |
| `typename` | Referencia de tipo | `null` | `typename t = PlayerBase;` |
| `Class` | Raiz de todos os tipos de referencia | `null` | -- |
| `void` | Sem retorno | -- | -- |

**Limites:** `int.MAX` = 2147483647, `int.MIN` = -2147483648, `float.MAX`, `float.MIN`

---

## Metodos de Array (`array<T>`)

| Metodo | Retorna | Notas |
|--------|---------|-------|
| `Insert(item)` | `int` (indice) | Adiciona ao final |
| `InsertAt(item, idx)` | `void` | Insere na posicao |
| `Get(idx)` / `arr[idx]` | `T` | Acesso por indice |
| `Set(idx, item)` | `void` | Substitui no indice |
| `Find(item)` | `int` | Indice ou -1 |
| `Count()` | `int` | Quantidade de elementos |
| `IsValidIndex(idx)` | `bool` | Verificacao de limites |
| `Remove(idx)` | `void` | **Sem ordem** (troca com o ultimo!) |
| `RemoveOrdered(idx)` | `void` | Preserva ordem |
| `RemoveItem(item)` | `void` | Busca + remove (ordenado) |
| `Clear()` | `void` | Remove todos |
| `Sort()` / `Sort(true)` | `void` | Crescente / decrescente |
| `ShuffleArray()` | `void` | Aleatorizar |
| `Invert()` | `void` | Reverter |
| `GetRandomElement()` | `T` | Escolha aleatoria |
| `InsertAll(other)` | `void` | Adiciona todos de outro |
| `Copy(other)` | `void` | Substitui com copia |
| `Resize(n)` | `void` | Redimensiona (preenche com padroes) |
| `Reserve(n)` | `void` | Pre-aloca capacidade |

**Typedefs:** `TStringArray`, `TIntArray`, `TFloatArray`, `TBoolArray`, `TVectorArray`

---

## Metodos de Map (`map<K,V>`)

| Metodo | Retorna | Notas |
|--------|---------|-------|
| `Insert(key, val)` | `bool` | Adiciona novo |
| `Set(key, val)` | `void` | Insere ou atualiza |
| `Get(key)` | `V` | Retorna padrao se ausente |
| `Find(key, out val)` | `bool` | Get seguro |
| `Contains(key)` | `bool` | Verifica existencia |
| `Remove(key)` | `void` | Remove por chave |
| `Count()` | `int` | Quantidade de entradas |
| `GetKey(idx)` | `K` | Chave no indice (O(n)) |
| `GetElement(idx)` | `V` | Valor no indice (O(n)) |
| `GetKeyArray()` | `array<K>` | Todas as chaves |
| `GetValueArray()` | `array<V>` | Todos os valores |
| `Clear()` | `void` | Remove todos |

---

## Metodos de Set (`set<T>`)

| Metodo | Retorna |
|--------|---------|
| `Insert(item)` | `int` (indice) |
| `Find(item)` | `int` (indice ou -1) |
| `Get(idx)` | `T` |
| `Remove(idx)` | `void` |
| `RemoveItem(item)` | `void` |
| `Count()` | `int` |
| `Clear()` | `void` |

---

## Sintaxe de Classe

```c
class MyClass extends BaseClass
{
    protected int m_Value;                  // field
    private ref array<string> m_List;       // owned ref

    void MyClass() { m_List = new array<string>; }  // constructor
    void ~MyClass() { }                              // destructor

    override void OnInit() { super.OnInit(); }       // override
    static int GetCount() { return 0; }              // static method
};
```

**Acesso:** `private` | `protected` | (publico por padrao)
**Modificadores:** `static` | `override` | `ref` | `const` | `out` | `notnull`
**Modded:** `modded class MissionServer { override void OnInit() { super.OnInit(); } }`

---

## Fluxo de Controle

```c
// if / else if / else
if (a > 0) { } else if (a == 0) { } else { }

// for
for (int i = 0; i < count; i++) { }

// foreach (value)
foreach (string item : myArray) { }

// foreach (index + value)
foreach (int i, string item : myArray) { }

// foreach (map: key + value)
foreach (string key, int val : myMap) { }

// while
while (condition) { }

// switch (SEM fall-through!)
switch (val) { case 0: Print("zero"); break; default: break; }
```

---

## Metodos de String

| Metodo | Retorna | Exemplo |
|--------|---------|---------|
| `s.Length()` | `int` | `"hello".Length()` = 5 |
| `s.Substring(start, len)` | `string` | `"hello".Substring(1,3)` = `"ell"` |
| `s.IndexOf(sub)` | `int` | -1 se nao encontrado |
| `s.LastIndexOf(sub)` | `int` | Busca do final |
| `s.Contains(sub)` | `bool` | |
| `s.Replace(old, new)` | `int` | Modifica in-place, retorna contagem |
| `s.ToLower()` | `void` | **In-place!** |
| `s.ToUpper()` | `void` | **In-place!** |
| `s.TrimInPlace()` | `void` | **In-place!** |
| `s.Split(delim, out arr)` | `void` | Divide em TStringArray |
| `s.Get(idx)` | `string` | Caractere unico |
| `s.Set(idx, ch)` | `void` | Substitui caractere |
| `s.ToInt()` | `int` | Converte para int |
| `s.ToFloat()` | `float` | Converte para float |
| `s.ToVector()` | `vector` | Converte `"1 2 3"` |
| `string.Format(fmt, ...)` | `string` | Placeholders `%1`..`%9` |
| `string.Join(sep, arr)` | `string` | Junta elementos do array |

---

## Metodos Matematicos

| Metodo | Descricao |
|--------|-----------|
| `Math.RandomInt(min, max)` | `[min, max)` maximo exclusivo |
| `Math.RandomIntInclusive(min, max)` | `[min, max]` |
| `Math.RandomFloat01()` | `[0, 1]` |
| `Math.RandomBool()` | true/false aleatorio |
| `Math.Round(f)` / `Floor(f)` / `Ceil(f)` | Arredondamento |
| `Math.AbsFloat(f)` / `AbsInt(i)` | Valor absoluto |
| `Math.Clamp(val, min, max)` | Limitar ao intervalo |
| `Math.Min(a, b)` / `Max(a, b)` | Minimo/maximo |
| `Math.Lerp(a, b, t)` | Interpolacao linear |
| `Math.InverseLerp(a, b, val)` | Lerp inverso |
| `Math.Pow(base, exp)` / `Sqrt(f)` | Potencia/raiz |
| `Math.Sin(r)` / `Cos(r)` / `Tan(r)` | Trigonometria (radianos) |
| `Math.Atan2(y, x)` | Angulo a partir dos componentes |
| `Math.NormalizeAngle(deg)` | Normalizar para 0-360 |
| `Math.SqrFloat(f)` / `SqrInt(i)` | Quadrado |

**Constantes:** `Math.PI`, `Math.PI2`, `Math.PI_HALF`, `Math.DEG2RAD`, `Math.RAD2DEG`

**Vector:** `vector.Distance(a,b)`, `vector.DistanceSq(a,b)`, `vector.Direction(a,b)`, `vector.Dot(a,b)`, `vector.Lerp(a,b,t)`, `v.Length()`, `v.Normalized()`

---

## Padroes Comuns

### Downcast Seguro

```c
PlayerBase player;
if (Class.CastTo(player, obj))
{
    player.DoSomething();
}
```

### Cast Inline

```c
PlayerBase player = PlayerBase.Cast(obj);
if (player) player.DoSomething();
```

### Guard de Null

```c
if (!player) return;
if (!player.GetIdentity()) return;
string name = player.GetIdentity().GetName();
```

### Verificar IsAlive (Requer EntityAI)

```c
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive()) { }
```

### Iteracao de Map com Foreach

```c
foreach (string key, int value : myMap)
{
    Print(key + " = " + value.ToString());
}
```

### Conversao de Enum

```c
string name = typename.EnumToString(EDamageState, state);
int val; typename.StringToEnum(EDamageState, "RUINED", val);
```

### Bitflags

```c
int flags = FLAG_A | FLAG_B;       // combine
if (flags & FLAG_A) { }           // test
flags = flags & ~FLAG_B;          // remove
```

---

## O Que NAO Existe

| Recurso Ausente | Solucao |
|----------------|---------|
| Ternario `? :` | `if/else` |
| `do...while` | `while(true) { ... break; }` |
| `try/catch` | Guard clauses + retorno antecipado |
| Heranca multipla | Simples + composicao |
| Sobrecarga de operadores | Metodos nomeados (exceto `[]` via Get/Set) |
| Lambdas | Metodos nomeados |
| `nullptr` | `null` / `NULL` |
| `\\` / `\"` em strings | Evitar (CParser quebra) |
| `#include` | config.cpp `files[]` |
| Namespaces | Prefixos de nome (`My`, `VPP_`) |
| Interfaces / abstract | Metodos base vazios |
| Fall-through em switch | Cada case e independente |
| Valores em `#define` | Use `const` |
| Expressoes em parametros default | Apenas literais/NULL |
| Parametros variadicos | `string.Format` ou arrays |
| Redeclaracao de variavel em else-if | Nomes unicos por branch |

---

## Criacao de Widget (Programatica)

```c
// Get workspace
WorkspaceWidget ws = GetGame().GetWorkspace();

// Create from layout
Widget root = ws.CreateWidgets("MyMod/gui/layouts/MyPanel.layout");

// Find child widget
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
if (title) title.SetText("Hello World");

// Show/hide
root.Show(true);
root.Show(false);
```

---

## Padrao RPC

**Registrar (servidor):**
```c
// In 3_Game or 4_World init:
GetGame().RPCSingleParam(null, MY_RPC_ID, null, true, identity);  // Engine RPC

// Or with string-routed RPC (MyRPC / CF):
GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);  // CF
MyRPC.Register("MyMod", "MyRoute", this, MyRPCSide.SERVER);  // MyMod
```

**Enviar (client para servidor):**
```c
Param2<string, int> data = new Param2<string, int>("itemName", 5);
GetGame().RPCSingleParam(null, MY_RPC_ID, data, true);
```

**Receber (handler no servidor):**
```c
void RPC_Handler(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    if (type != CallType.Server) return;
    if (!sender) return;

    Param2<string, int> data;
    if (!ctx.Read(data)) return;

    string itemName = data.param1;
    int quantity = data.param2;
    // Process...
}
```

---

## Tratamento de Erros

```c
ErrorEx("message");                              // Default ERROR severity
ErrorEx("info", ErrorExSeverity.INFO);           // Info
ErrorEx("warning", ErrorExSeverity.WARNING);     // Warning
Print("debug output");                           // Script log
string stack = DumpStackString();                // Get call stack
```

---

## I/O de Arquivos

```c
// Paths: "$profile:", "$saves:", "$mission:", "$CurrentDir:"
bool exists = FileExist("$profile:MyMod/config.json");
MakeDirectory("$profile:MyMod");

// JSON
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // Returns VOID!
JsonFileLoader<MyConfig>.JsonSaveFile(path, cfg);

// Raw file
FileHandle fh = OpenFile(path, FileMode.WRITE);
if (fh != 0) { FPrintln(fh, "line"); CloseFile(fh); }
```

---

## Criacao de Objetos

```c
// Basic
Object obj = GetGame().CreateObject("AK101", pos, false, false, true);

// With flags
Object obj = GetGame().CreateObjectEx("Barrel_Green", pos, ECE_PLACE_ON_SURFACE);

// In player inventory
player.GetInventory().CreateInInventory("BandageDressing");

// As attachment
weapon.GetInventory().CreateAttachment("ACOGOptic");

// Delete
GetGame().ObjectDelete(obj);
```

---

## Funcoes Globais Principais

```c
GetGame()                          // CGame instance
GetGame().GetPlayer()              // Local player (CLIENT only, null on server!)
GetGame().GetPlayers(out arr)      // All players (server)
GetGame().GetWorld()               // World instance
GetGame().GetTickTime()            // Server time (float)
GetGame().GetWorkspace()           // UI workspace
GetGame().SurfaceY(x, z)          // Terrain height
GetGame().IsServer()               // true on server
GetGame().IsClient()               // true on client
GetGame().IsMultiplayer()          // true if multiplayer
```

---

*Documentacao completa: [Wiki de Modding DayZ](./README.md) | [Gotchas](01-enforce-script/12-gotchas.md) | [Tratamento de Erros](01-enforce-script/11-error-handling.md)*
