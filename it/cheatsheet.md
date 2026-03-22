# Scheda di Riferimento Rapido di Enforce Script

[Home](./README.md) | **Scheda di Riferimento Rapido**

---

> Riferimento rapido su una singola pagina per Enforce Script di DayZ. Aggiungilo ai segnalibri.

---

## Tipi

| Tipo | Descrizione | Predefinito | Esempio |
|------|-------------|-------------|---------|
| `int` | Intero con segno a 32 bit | `0` | `int x = 42;` |
| `float` | Float a 32 bit | `0.0` | `float f = 3.14;` |
| `bool` | Booleano | `false` | `bool b = true;` |
| `string` | Tipo valore immutabile | `""` | `string s = "hello";` |
| `vector` | Float a 3 componenti (x,y,z) | `"0 0 0"` | `vector v = "1 2 3";` |
| `typename` | Riferimento al tipo | `null` | `typename t = PlayerBase;` |
| `Class` | Radice di tutti i tipi riferimento | `null` | --- |
| `void` | Nessun valore di ritorno | --- | --- |

**Limiti:** `int.MAX` = 2147483647, `int.MIN` = -2147483648, `float.MAX`, `float.MIN`

---

## Metodi Array (`array<T>`)

| Metodo | Restituisce | Note |
|--------|-------------|------|
| `Insert(item)` | `int` (indice) | Aggiunge in coda |
| `InsertAt(item, idx)` | `void` | Inserisce alla posizione |
| `Get(idx)` / `arr[idx]` | `T` | Accesso per indice |
| `Set(idx, item)` | `void` | Sostituisce all'indice |
| `Find(item)` | `int` | Indice o -1 |
| `Count()` | `int` | Conteggio elementi |
| `IsValidIndex(idx)` | `bool` | Controllo limiti |
| `Remove(idx)` | `void` | **Non ordinato** (scambia con l'ultimo!) |
| `RemoveOrdered(idx)` | `void` | Preserva l'ordine |
| `RemoveItem(item)` | `void` | Trova + rimuovi (ordinato) |
| `Clear()` | `void` | Rimuove tutto |
| `Sort()` / `Sort(true)` | `void` | Crescente / decrescente |
| `ShuffleArray()` | `void` | Mescola casualmente |
| `Invert()` | `void` | Inverti |
| `GetRandomElement()` | `T` | Scelta casuale |
| `InsertAll(other)` | `void` | Aggiunge tutti dall'altro |
| `Copy(other)` | `void` | Sostituisci con copia |
| `Resize(n)` | `void` | Ridimensiona (riempie con valori predefiniti) |
| `Reserve(n)` | `void` | Pre-alloca capacita |

**Typedef:** `TStringArray`, `TIntArray`, `TFloatArray`, `TBoolArray`, `TVectorArray`

---

## Metodi Map (`map<K,V>`)

| Metodo | Restituisce | Note |
|--------|-------------|------|
| `Insert(key, val)` | `bool` | Aggiunge nuovo |
| `Set(key, val)` | `void` | Inserisce o aggiorna |
| `Get(key)` | `V` | Restituisce predefinito se mancante |
| `Find(key, out val)` | `bool` | Get sicuro |
| `Contains(key)` | `bool` | Controlla esistenza |
| `Remove(key)` | `void` | Rimuove per chiave |
| `Count()` | `int` | Conteggio voci |
| `GetKey(idx)` | `K` | Chiave all'indice (O(n)) |
| `GetElement(idx)` | `V` | Valore all'indice (O(n)) |
| `GetKeyArray()` | `array<K>` | Tutte le chiavi |
| `GetValueArray()` | `array<V>` | Tutti i valori |
| `Clear()` | `void` | Rimuove tutto |

---

## Metodi Set (`set<T>`)

| Metodo | Restituisce |
|--------|-------------|
| `Insert(item)` | `int` (indice) |
| `Find(item)` | `int` (indice o -1) |
| `Get(idx)` | `T` |
| `Remove(idx)` | `void` |
| `RemoveItem(item)` | `void` |
| `Count()` | `int` |
| `Clear()` | `void` |

---

## Sintassi delle classi

```c
class MyClass extends BaseClass
{
    protected int m_Value;                  // campo
    private ref array<string> m_List;       // ref posseduto

    void MyClass() { m_List = new array<string>; }  // costruttore
    void ~MyClass() { }                              // distruttore

    override void OnInit() { super.OnInit(); }       // override
    static int GetCount() { return 0; }              // metodo statico
};
```

**Accesso:** `private` | `protected` | (pubblico per impostazione predefinita)
**Modificatori:** `static` | `override` | `ref` | `const` | `out` | `notnull`
**Modded:** `modded class MissionServer { override void OnInit() { super.OnInit(); } }`

---

## Flusso di controllo

```c
// if / else if / else
if (a > 0) { } else if (a == 0) { } else { }

// for
for (int i = 0; i < count; i++) { }

// foreach (valore)
foreach (string item : myArray) { }

// foreach (indice + valore)
foreach (int i, string item : myArray) { }

// foreach (map: chiave + valore)
foreach (string key, int val : myMap) { }

// while
while (condition) { }

// switch (NESSUN fall-through!)
switch (val) { case 0: Print("zero"); break; default: break; }
```

---

## Metodi String

| Metodo | Restituisce | Esempio |
|--------|-------------|---------|
| `s.Length()` | `int` | `"hello".Length()` = 5 |
| `s.Substring(start, len)` | `string` | `"hello".Substring(1,3)` = `"ell"` |
| `s.IndexOf(sub)` | `int` | -1 se non trovato |
| `s.LastIndexOf(sub)` | `int` | Cerca dalla fine |
| `s.Contains(sub)` | `bool` | |
| `s.Replace(old, new)` | `int` | Modifica in-place, restituisce il conteggio |
| `s.ToLower()` | `void` | **In-place!** |
| `s.ToUpper()` | `void` | **In-place!** |
| `s.TrimInPlace()` | `void` | **In-place!** |
| `s.Split(delim, out arr)` | `void` | Divide in TStringArray |
| `s.Get(idx)` | `string` | Singolo carattere |
| `s.Set(idx, ch)` | `void` | Sostituisce carattere |
| `s.ToInt()` | `int` | Analizza int |
| `s.ToFloat()` | `float` | Analizza float |
| `s.ToVector()` | `vector` | Analizza `"1 2 3"` |
| `string.Format(fmt, ...)` | `string` | Segnaposto `%1`..`%9` |
| `string.Join(sep, arr)` | `string` | Unisce elementi array |

---

## Metodi Math

| Metodo | Descrizione |
|--------|-------------|
| `Math.RandomInt(min, max)` | `[min, max)` max escluso |
| `Math.RandomIntInclusive(min, max)` | `[min, max]` |
| `Math.RandomFloat01()` | `[0, 1]` |
| `Math.RandomBool()` | true/false casuale |
| `Math.Round(f)` / `Floor(f)` / `Ceil(f)` | Arrotondamento |
| `Math.AbsFloat(f)` / `AbsInt(i)` | Valore assoluto |
| `Math.Clamp(val, min, max)` | Limita all'intervallo |
| `Math.Min(a, b)` / `Max(a, b)` | Min/max |
| `Math.Lerp(a, b, t)` | Interpolazione lineare |
| `Math.InverseLerp(a, b, val)` | Lerp inverso |
| `Math.Pow(base, exp)` / `Sqrt(f)` | Potenza/radice |
| `Math.Sin(r)` / `Cos(r)` / `Tan(r)` | Trigonometria (radianti) |
| `Math.Atan2(y, x)` | Angolo dalle componenti |
| `Math.NormalizeAngle(deg)` | Normalizza a 0-360 |
| `Math.SqrFloat(f)` / `SqrInt(i)` | Elevamento al quadrato |

**Costanti:** `Math.PI`, `Math.PI2`, `Math.PI_HALF`, `Math.DEG2RAD`, `Math.RAD2DEG`

**Vettori:** `vector.Distance(a,b)`, `vector.DistanceSq(a,b)`, `vector.Direction(a,b)`, `vector.Dot(a,b)`, `vector.Lerp(a,b,t)`, `v.Length()`, `v.Normalized()`

---

## Pattern comuni

### Downcast sicuro

```c
PlayerBase player;
if (Class.CastTo(player, obj))
{
    player.DoSomething();
}
```

### Cast inline

```c
PlayerBase player = PlayerBase.Cast(obj);
if (player) player.DoSomething();
```

### Controllo null

```c
if (!player) return;
if (!player.GetIdentity()) return;
string name = player.GetIdentity().GetName();
```

### Controllo IsAlive (richiede EntityAI)

```c
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive()) { }
```

### Iterazione foreach su Map

```c
foreach (string key, int value : myMap)
{
    Print(key + " = " + value.ToString());
}
```

### Conversione Enum

```c
string name = typename.EnumToString(EDamageState, state);
int val; typename.StringToEnum(EDamageState, "RUINED", val);
```

### Flag di bit

```c
int flags = FLAG_A | FLAG_B;       // combina
if (flags & FLAG_A) { }           // testa
flags = flags & ~FLAG_B;          // rimuovi
```

---

## Cosa NON esiste

| Funzionalita mancante | Soluzione alternativa |
|------------------------|----------------------|
| Ternario `? :` | `if/else` |
| `do...while` | `while(true) { ... break; }` |
| `try/catch` | Clausole di guardia + return anticipato |
| Ereditarieta multipla | Singola + composizione |
| Overloading operatori | Metodi con nome (tranne `[]` tramite Get/Set) |
| Lambda | Metodi con nome |
| `nullptr` | `null` / `NULL` |
| `\\` / `\"` nelle stringhe | Evitare (CParser si rompe) |
| `#include` | config.cpp `files[]` |
| Namespace | Prefissi di nome (`MyMod_`, `VPP_`) |
| Interfacce / abstract | Metodi base vuoti |
| Switch fall-through | Ogni case e indipendente |
| Valori `#define` | Usa `const` |
| Espressioni parametri predefiniti | Solo letterali/NULL |
| Parametri variadici | `string.Format` o array |
| Ridichiarazione variabili in else-if | Nomi unici per ramo |

---

## Creazione Widget (programmatica)

```c
// Ottenere il workspace
WorkspaceWidget ws = GetGame().GetWorkspace();

// Creare da layout
Widget root = ws.CreateWidgets("MyMod/gui/layouts/MyPanel.layout");

// Trovare widget figlio
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
if (title) title.SetText("Hello World");

// Mostrare/nascondere
root.Show(true);
root.Show(false);
```

---

## Pattern RPC

**Registrazione (server):**
```c
// Nell'init di 3_Game o 4_World:
GetGame().RPCSingleParam(null, MY_RPC_ID, null, true, identity);  // RPC del motore

// Oppure con RPC a routing stringa (MyRPC / CF):
GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);  // CF
MyRPC.Register("MyMod", "MyRoute", this, MyRPCSide.SERVER);  // MyMod
```

**Invio (client al server):**
```c
Param2<string, int> data = new Param2<string, int>("itemName", 5);
GetGame().RPCSingleParam(null, MY_RPC_ID, data, true);
```

**Ricezione (handler server):**
```c
void RPC_Handler(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    if (type != CallType.Server) return;
    if (!sender) return;

    Param2<string, int> data;
    if (!ctx.Read(data)) return;

    string itemName = data.param1;
    int quantity = data.param2;
    // Elabora...
}
```

---

## Gestione errori

```c
ErrorEx("message");                              // Severita ERROR predefinita
ErrorEx("info", ErrorExSeverity.INFO);           // Info
ErrorEx("warning", ErrorExSeverity.WARNING);     // Avviso
Print("debug output");                           // Log script
string stack = DumpStackString();                // Ottieni stack delle chiamate
```

---

## I/O File

```c
// Percorsi: "$profile:", "$saves:", "$mission:", "$CurrentDir:"
bool exists = FileExist("$profile:MyMod/config.json");
MakeDirectory("$profile:MyMod");

// JSON
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // Restituisce VOID!
JsonFileLoader<MyConfig>.JsonSaveFile(path, cfg);

// File raw
FileHandle fh = OpenFile(path, FileMode.WRITE);
if (fh != 0) { FPrintln(fh, "line"); CloseFile(fh); }
```

---

## Creazione oggetti

```c
// Base
Object obj = GetGame().CreateObject("AK101", pos, false, false, true);

// Con flag
Object obj = GetGame().CreateObjectEx("Barrel_Green", pos, ECE_PLACE_ON_SURFACE);

// Nell'inventario del giocatore
player.GetInventory().CreateInInventory("BandageDressing");

// Come allegato
weapon.GetInventory().CreateAttachment("ACOGOptic");

// Eliminare
GetGame().ObjectDelete(obj);
```

---

## Funzioni globali principali

```c
GetGame()                          // Istanza CGame
GetGame().GetPlayer()              // Giocatore locale (SOLO CLIENT, null sul server!)
GetGame().GetPlayers(out arr)      // Tutti i giocatori (server)
GetGame().GetWorld()               // Istanza World
GetGame().GetTickTime()            // Tempo del server (float)
GetGame().GetWorkspace()           // Workspace UI
GetGame().SurfaceY(x, z)          // Altezza del terreno
GetGame().IsServer()               // true sul server
GetGame().IsClient()               // true sul client
GetGame().IsMultiplayer()          // true se multiplayer
```

---

*Documentazione completa: [DayZ Modding Wiki](./README.md) | [Insidie](01-enforce-script/12-gotchas.md) | [Gestione errori](01-enforce-script/11-error-handling.md)*
