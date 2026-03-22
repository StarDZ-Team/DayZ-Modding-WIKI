# Tahák pro Enforce Script

[Domů](./README.md) | **Tahák**

---

> Jednostránkový rychlý přehled pro DayZ Enforce Script. Uložte si do záložek.

---

## Typy

| Typ | Popis | Výchozí | Příklad |
|-----|-------|---------|---------|
| `int` | 32bitové celé číslo se znaménkem | `0` | `int x = 42;` |
| `float` | 32bitové desetinné číslo | `0.0` | `float f = 3.14;` |
| `bool` | Logická hodnota | `false` | `bool b = true;` |
| `string` | Neměnný hodnotový typ | `""` | `string s = "hello";` |
| `vector` | 3složkový float (x,y,z) | `"0 0 0"` | `vector v = "1 2 3";` |
| `typename` | Reference na typ | `null` | `typename t = PlayerBase;` |
| `Class` | Kořen všech referenčních typů | `null` | — |
| `void` | Bez návratové hodnoty | — | — |

**Limity:** `int.MAX` = 2147483647, `int.MIN` = -2147483648, `float.MAX`, `float.MIN`

---

## Metody pole (`array<T>`)

| Metoda | Vrací | Poznámky |
|--------|-------|----------|
| `Insert(item)` | `int` (index) | Připojit na konec |
| `InsertAt(item, idx)` | `void` | Vložit na pozici |
| `Get(idx)` / `arr[idx]` | `T` | Přístup podle indexu |
| `Set(idx, item)` | `void` | Nahradit na indexu |
| `Find(item)` | `int` | Index nebo -1 |
| `Count()` | `int` | Počet prvků |
| `IsValidIndex(idx)` | `bool` | Kontrola mezí |
| `Remove(idx)` | `void` | **Neseřazené** (prohodí s posledním!) |
| `RemoveOrdered(idx)` | `void` | Zachovává pořadí |
| `RemoveItem(item)` | `void` | Najde a odstraní (seřazeně) |
| `Clear()` | `void` | Odstranit vše |
| `Sort()` / `Sort(true)` | `void` | Vzestupně / sestupně |
| `ShuffleArray()` | `void` | Zamíchat |
| `Invert()` | `void` | Obrátit |
| `GetRandomElement()` | `T` | Náhodný výběr |
| `InsertAll(other)` | `void` | Připojit vše z jiného |
| `Copy(other)` | `void` | Nahradit kopií |
| `Resize(n)` | `void` | Změnit velikost (doplní výchozí hodnoty) |
| `Reserve(n)` | `void` | Předem alokovat kapacitu |

**Typové aliasy:** `TStringArray`, `TIntArray`, `TFloatArray`, `TBoolArray`, `TVectorArray`

---

## Metody mapy (`map<K,V>`)

| Metoda | Vrací | Poznámky |
|--------|-------|----------|
| `Insert(key, val)` | `bool` | Přidat nový |
| `Set(key, val)` | `void` | Vložit nebo aktualizovat |
| `Get(key)` | `V` | Vrátí výchozí pokud chybí |
| `Find(key, out val)` | `bool` | Bezpečné získání |
| `Contains(key)` | `bool` | Kontrola existence |
| `Remove(key)` | `void` | Odstranit podle klíče |
| `Count()` | `int` | Počet záznamů |
| `GetKey(idx)` | `K` | Klíč na indexu (O(n)) |
| `GetElement(idx)` | `V` | Hodnota na indexu (O(n)) |
| `GetKeyArray()` | `array<K>` | Všechny klíče |
| `GetValueArray()` | `array<V>` | Všechny hodnoty |
| `Clear()` | `void` | Odstranit vše |

---

## Metody množiny (`set<T>`)

| Metoda | Vrací |
|--------|-------|
| `Insert(item)` | `int` (index) |
| `Find(item)` | `int` (index nebo -1) |
| `Get(idx)` | `T` |
| `Remove(idx)` | `void` |
| `RemoveItem(item)` | `void` |
| `Count()` | `int` |
| `Clear()` | `void` |

---

## Syntaxe tříd

```c
class MyClass extends BaseClass
{
    protected int m_Value;                  // pole
    private ref array<string> m_List;       // vlastněná reference

    void MyClass() { m_List = new array<string>; }  // konstruktor
    void ~MyClass() { }                              // destruktor

    override void OnInit() { super.OnInit(); }       // přepsání
    static int GetCount() { return 0; }              // statická metoda
};
```

**Přístup:** `private` | `protected` | (veřejné ve výchozím stavu)
**Modifikátory:** `static` | `override` | `ref` | `const` | `out` | `notnull`
**Modded:** `modded class MissionServer { override void OnInit() { super.OnInit(); } }`

---

## Řízení toku

```c
// if / else if / else
if (a > 0) { } else if (a == 0) { } else { }

// for
for (int i = 0; i < count; i++) { }

// foreach (hodnota)
foreach (string item : myArray) { }

// foreach (index + hodnota)
foreach (int i, string item : myArray) { }

// foreach (mapa: klíč + hodnota)
foreach (string key, int val : myMap) { }

// while
while (condition) { }

// switch (BEZ propadávání!)
switch (val) { case 0: Print("zero"); break; default: break; }
```

---

## Metody řetězců

| Metoda | Vrací | Příklad |
|--------|-------|---------|
| `s.Length()` | `int` | `"hello".Length()` = 5 |
| `s.Substring(start, len)` | `string` | `"hello".Substring(1,3)` = `"ell"` |
| `s.IndexOf(sub)` | `int` | -1 pokud nenalezeno |
| `s.LastIndexOf(sub)` | `int` | Hledá od konce |
| `s.Contains(sub)` | `bool` | |
| `s.Replace(old, new)` | `int` | Modifikuje na místě, vrací počet |
| `s.ToLower()` | `void` | **Na místě!** |
| `s.ToUpper()` | `void` | **Na místě!** |
| `s.TrimInPlace()` | `void` | **Na místě!** |
| `s.Split(delim, out arr)` | `void` | Rozdělí do TStringArray |
| `s.Get(idx)` | `string` | Jeden znak |
| `s.Set(idx, ch)` | `void` | Nahradit znak |
| `s.ToInt()` | `int` | Parsovat celé číslo |
| `s.ToFloat()` | `float` | Parsovat desetinné číslo |
| `s.ToVector()` | `vector` | Parsovat `"1 2 3"` |
| `string.Format(fmt, ...)` | `string` | Zástupné znaky `%1`..`%9` |
| `string.Join(sep, arr)` | `string` | Spojit prvky pole |

---

## Matematické metody

| Metoda | Popis |
|--------|-------|
| `Math.RandomInt(min, max)` | `[min, max)` max je exkluzivní |
| `Math.RandomIntInclusive(min, max)` | `[min, max]` |
| `Math.RandomFloat01()` | `[0, 1]` |
| `Math.RandomBool()` | Náhodné true/false |
| `Math.Round(f)` / `Floor(f)` / `Ceil(f)` | Zaokrouhlení |
| `Math.AbsFloat(f)` / `AbsInt(i)` | Absolutní hodnota |
| `Math.Clamp(val, min, max)` | Omezit na rozsah |
| `Math.Min(a, b)` / `Max(a, b)` | Min/max |
| `Math.Lerp(a, b, t)` | Lineární interpolace |
| `Math.InverseLerp(a, b, val)` | Inverzní lerp |
| `Math.Pow(base, exp)` / `Sqrt(f)` | Mocnina/odmocnina |
| `Math.Sin(r)` / `Cos(r)` / `Tan(r)` | Goniometrie (radiány) |
| `Math.Atan2(y, x)` | Úhel ze složek |
| `Math.NormalizeAngle(deg)` | Normalizovat na 0-360 |
| `Math.SqrFloat(f)` / `SqrInt(i)` | Druhá mocnina |

**Konstanty:** `Math.PI`, `Math.PI2`, `Math.PI_HALF`, `Math.DEG2RAD`, `Math.RAD2DEG`

**Vektor:** `vector.Distance(a,b)`, `vector.DistanceSq(a,b)`, `vector.Direction(a,b)`, `vector.Dot(a,b)`, `vector.Lerp(a,b,t)`, `v.Length()`, `v.Normalized()`

---

## Běžné vzory

### Bezpečné přetypování

```c
PlayerBase player;
if (Class.CastTo(player, obj))
{
    player.DoSomething();
}
```

### Inline přetypování

```c
PlayerBase player = PlayerBase.Cast(obj);
if (player) player.DoSomething();
```

### Kontrola null

```c
if (!player) return;
if (!player.GetIdentity()) return;
string name = player.GetIdentity().GetName();
```

### Kontrola IsAlive (vyžaduje EntityAI)

```c
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive()) { }
```

### Iterace přes mapu pomocí foreach

```c
foreach (string key, int value : myMap)
{
    Print(key + " = " + value.ToString());
}
```

### Konverze výčtového typu

```c
string name = typename.EnumToString(EDamageState, state);
int val; typename.StringToEnum(EDamageState, "RUINED", val);
```

### Bitové příznaky

```c
int flags = FLAG_A | FLAG_B;       // kombinovat
if (flags & FLAG_A) { }           // testovat
flags = flags & ~FLAG_B;          // odebrat
```

---

## Co NEEXISTUJE

| Chybějící funkce | Řešení |
|-------------------|--------|
| Ternární `? :` | `if/else` |
| `do...while` | `while(true) { ... break; }` |
| `try/catch` | Ochranné podmínky + early return |
| Vícenásobná dědičnost | Jednoduchá + kompozice |
| Přetěžování operátorů | Pojmenované metody (kromě `[]` přes Get/Set) |
| Lambdy | Pojmenované metody |
| `nullptr` | `null` / `NULL` |
| `\\` / `\"` v řetězcích | Nepoužívat (CParser se rozbije) |
| `#include` | config.cpp `files[]` |
| Jmenné prostory | Předpony názvů (`MyMod_`, `VPP_`) |
| Rozhraní / abstraktní | Prázdné základní metody |
| Propadávání switch | Každý case je nezávislý |
| `#define` hodnoty | Použijte `const` |
| Výrazy ve výchozích parametrech | Pouze literály/NULL |
| Variabilní parametry | `string.Format` nebo pole |
| Redeklarace proměnných v else-if | Unikátní názvy pro každou větev |

---

## Vytváření widgetů (programově)

```c
// Získat pracovní prostor
WorkspaceWidget ws = GetGame().GetWorkspace();

// Vytvořit z rozložení
Widget root = ws.CreateWidgets("MyMod/gui/layouts/MyPanel.layout");

// Najít podřízený widget
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
if (title) title.SetText("Hello World");

// Zobrazit/skrýt
root.Show(true);
root.Show(false);
```

---

## Vzor RPC

**Registrace (server):**
```c
// V 3_Game nebo 4_World init:
GetGame().RPCSingleParam(null, MY_RPC_ID, null, true, identity);  // Engine RPC

// Nebo s řetězcově směrovaným RPC (MyRPC / CF):
GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);  // CF
MyRPC.Register("MyMod", "MyRoute", this, MyRPCSide.SERVER);  // MyMod
```

**Odeslání (klient na server):**
```c
Param2<string, int> data = new Param2<string, int>("itemName", 5);
GetGame().RPCSingleParam(null, MY_RPC_ID, data, true);
```

**Příjem (handler na serveru):**
```c
void RPC_Handler(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    if (type != CallType.Server) return;
    if (!sender) return;

    Param2<string, int> data;
    if (!ctx.Read(data)) return;

    string itemName = data.param1;
    int quantity = data.param2;
    // Zpracovat...
}
```

---

## Zpracování chyb

```c
ErrorEx("message");                              // Výchozí závažnost ERROR
ErrorEx("info", ErrorExSeverity.INFO);           // Info
ErrorEx("warning", ErrorExSeverity.WARNING);     // Varování
Print("debug output");                           // Skriptový log
string stack = DumpStackString();                // Získat zásobník volání
```

---

## Souborové I/O

```c
// Cesty: "$profile:", "$saves:", "$mission:", "$CurrentDir:"
bool exists = FileExist("$profile:MyMod/config.json");
MakeDirectory("$profile:MyMod");

// JSON
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // Vrací VOID!
JsonFileLoader<MyConfig>.JsonSaveFile(path, cfg);

// Surový soubor
FileHandle fh = OpenFile(path, FileMode.WRITE);
if (fh != 0) { FPrintln(fh, "line"); CloseFile(fh); }
```

---

## Vytváření objektů

```c
// Základní
Object obj = GetGame().CreateObject("AK101", pos, false, false, true);

// S příznaky
Object obj = GetGame().CreateObjectEx("Barrel_Green", pos, ECE_PLACE_ON_SURFACE);

// Do inventáře hráče
player.GetInventory().CreateInInventory("BandageDressing");

// Jako příslušenství
weapon.GetInventory().CreateAttachment("ACOGOptic");

// Smazat
GetGame().ObjectDelete(obj);
```

---

## Klíčové globální funkce

```c
GetGame()                          // Instance CGame
GetGame().GetPlayer()              // Lokální hráč (pouze KLIENT, null na serveru!)
GetGame().GetPlayers(out arr)      // Všichni hráči (server)
GetGame().GetWorld()               // Instance světa
GetGame().GetTickTime()            // Čas serveru (float)
GetGame().GetWorkspace()           // UI pracovní prostor
GetGame().SurfaceY(x, z)          // Výška terénu
GetGame().IsServer()               // true na serveru
GetGame().IsClient()               // true na klientovi
GetGame().IsMultiplayer()          // true pokud multiplayer
```

---

*Kompletní dokumentace: [Wiki pro moddování DayZ](./README.md) | [Úskalí](01-enforce-script/12-gotchas.md) | [Zpracování chyb](01-enforce-script/11-error-handling.md)*
