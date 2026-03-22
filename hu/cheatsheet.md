# Enforce Script gyorsreferencia

[Kezdőlap](./README.md) | **Gyorsreferencia**

---

> Egyoldalas gyorsreferencia a DayZ Enforce Scripthez. Mentsd el a könyvjelzők közé.

---

## Típusok

| Típus | Leírás | Alapérték | Példa |
|-------|--------|-----------|-------|
| `int` | 32 bites előjeles egész szám | `0` | `int x = 42;` |
| `float` | 32 bites lebegőpontos | `0.0` | `float f = 3.14;` |
| `bool` | Logikai | `false` | `bool b = true;` |
| `string` | Megváltoztathatatlan értéktípus | `""` | `string s = "hello";` |
| `vector` | 3 komponensű float (x,y,z) | `"0 0 0"` | `vector v = "1 2 3";` |
| `typename` | Típus referencia | `null` | `typename t = PlayerBase;` |
| `Class` | Minden referencia típus gyökere | `null` | --- |
| `void` | Nincs visszatérési érték | --- | --- |

**Határértékek:** `int.MAX` = 2147483647, `int.MIN` = -2147483648, `float.MAX`, `float.MIN`

---

## Tömb metódusok (`array<T>`)

| Metódus | Visszatérés | Megjegyzés |
|---------|-------------|------------|
| `Insert(item)` | `int` (index) | Hozzáfűzés |
| `InsertAt(item, idx)` | `void` | Beszúrás pozícióra |
| `Get(idx)` / `arr[idx]` | `T` | Hozzáférés index alapján |
| `Set(idx, item)` | `void` | Csere az indexen |
| `Find(item)` | `int` | Index vagy -1 |
| `Count()` | `int` | Elemek száma |
| `IsValidIndex(idx)` | `bool` | Határok ellenőrzése |
| `Remove(idx)` | `void` | **Rendezetlen** (utolsóval cseréli!) |
| `RemoveOrdered(idx)` | `void` | Megőrzi a sorrendet |
| `RemoveItem(item)` | `void` | Keresés + eltávolítás (rendezett) |
| `Clear()` | `void` | Mindent eltávolít |
| `Sort()` / `Sort(true)` | `void` | Növekvő / csökkenő |
| `ShuffleArray()` | `void` | Véletlenszerű keverés |
| `Invert()` | `void` | Megfordítás |
| `GetRandomElement()` | `T` | Véletlenszerű választás |
| `InsertAll(other)` | `void` | Mindent hozzáfűz a másikból |
| `Copy(other)` | `void` | Csere másolattal |
| `Resize(n)` | `void` | Átméretezés (alapértékekkel tölt) |
| `Reserve(n)` | `void` | Kapacitás előfoglalása |

**Típusdefiníciók:** `TStringArray`, `TIntArray`, `TFloatArray`, `TBoolArray`, `TVectorArray`

---

## Map metódusok (`map<K,V>`)

| Metódus | Visszatérés | Megjegyzés |
|---------|-------------|------------|
| `Insert(key, val)` | `bool` | Új hozzáadása |
| `Set(key, val)` | `void` | Beszúrás vagy frissítés |
| `Get(key)` | `V` | Alapértéket ad vissza, ha hiányzik |
| `Find(key, out val)` | `bool` | Biztonságos lekérés |
| `Contains(key)` | `bool` | Létezés ellenőrzése |
| `Remove(key)` | `void` | Eltávolítás kulcs alapján |
| `Count()` | `int` | Bejegyzések száma |
| `GetKey(idx)` | `K` | Kulcs az indexen (O(n)) |
| `GetElement(idx)` | `V` | Érték az indexen (O(n)) |
| `GetKeyArray()` | `array<K>` | Összes kulcs |
| `GetValueArray()` | `array<V>` | Összes érték |
| `Clear()` | `void` | Mindent eltávolít |

---

## Set metódusok (`set<T>`)

| Metódus | Visszatérés |
|---------|-------------|
| `Insert(item)` | `int` (index) |
| `Find(item)` | `int` (index vagy -1) |
| `Get(idx)` | `T` |
| `Remove(idx)` | `void` |
| `RemoveItem(item)` | `void` |
| `Count()` | `int` |
| `Clear()` | `void` |

---

## Osztály szintaxis

```c
class MyClass extends BaseClass
{
    protected int m_Value;                  // mező
    private ref array<string> m_List;       // birtokolt ref

    void MyClass() { m_List = new array<string>; }  // konstruktor
    void ~MyClass() { }                              // destruktor

    override void OnInit() { super.OnInit(); }       // felülírás
    static int GetCount() { return 0; }              // statikus metódus
};
```

**Hozzáférés:** `private` | `protected` | (alapértelmezetten publikus)
**Módosítók:** `static` | `override` | `ref` | `const` | `out` | `notnull`
**Modded:** `modded class MissionServer { override void OnInit() { super.OnInit(); } }`

---

## Vezérlési szerkezetek

```c
// if / else if / else
if (a > 0) { } else if (a == 0) { } else { }

// for
for (int i = 0; i < count; i++) { }

// foreach (érték)
foreach (string item : myArray) { }

// foreach (index + érték)
foreach (int i, string item : myArray) { }

// foreach (map: kulcs + érték)
foreach (string key, int val : myMap) { }

// while
while (condition) { }

// switch (NINCS fall-through!)
switch (val) { case 0: Print("zero"); break; default: break; }
```

---

## String metódusok

| Metódus | Visszatérés | Példa |
|---------|-------------|-------|
| `s.Length()` | `int` | `"hello".Length()` = 5 |
| `s.Substring(start, len)` | `string` | `"hello".Substring(1,3)` = `"ell"` |
| `s.IndexOf(sub)` | `int` | -1 ha nem található |
| `s.LastIndexOf(sub)` | `int` | Keresés a végéről |
| `s.Contains(sub)` | `bool` | |
| `s.Replace(old, new)` | `int` | Helyben módosít, visszaadja a darabszámot |
| `s.ToLower()` | `void` | **Helyben!** |
| `s.ToUpper()` | `void` | **Helyben!** |
| `s.TrimInPlace()` | `void` | **Helyben!** |
| `s.Split(delim, out arr)` | `void` | TStringArray-re bontja |
| `s.Get(idx)` | `string` | Egyetlen karakter |
| `s.Set(idx, ch)` | `void` | Karakter cseréje |
| `s.ToInt()` | `int` | Int értelmezés |
| `s.ToFloat()` | `float` | Float értelmezés |
| `s.ToVector()` | `vector` | `"1 2 3"` értelmezés |
| `string.Format(fmt, ...)` | `string` | `%1`..`%9` helyettesítők |
| `string.Join(sep, arr)` | `string` | Tömb elemek összefűzése |

---

## Math metódusok

| Metódus | Leírás |
|---------|--------|
| `Math.RandomInt(min, max)` | `[min, max)` kizáró max |
| `Math.RandomIntInclusive(min, max)` | `[min, max]` |
| `Math.RandomFloat01()` | `[0, 1]` |
| `Math.RandomBool()` | Véletlenszerű true/false |
| `Math.Round(f)` / `Floor(f)` / `Ceil(f)` | Kerekítés |
| `Math.AbsFloat(f)` / `AbsInt(i)` | Abszolút érték |
| `Math.Clamp(val, min, max)` | Tartományba szorítás |
| `Math.Min(a, b)` / `Max(a, b)` | Min/max |
| `Math.Lerp(a, b, t)` | Lineáris interpoláció |
| `Math.InverseLerp(a, b, val)` | Inverz lerp |
| `Math.Pow(base, exp)` / `Sqrt(f)` | Hatvány/gyök |
| `Math.Sin(r)` / `Cos(r)` / `Tan(r)` | Trigonometria (radián) |
| `Math.Atan2(y, x)` | Szög komponensekből |
| `Math.NormalizeAngle(deg)` | 0-360 közé zárás |
| `Math.SqrFloat(f)` / `SqrInt(i)` | Négyzetre emelés |

**Konstansok:** `Math.PI`, `Math.PI2`, `Math.PI_HALF`, `Math.DEG2RAD`, `Math.RAD2DEG`

**Vektor:** `vector.Distance(a,b)`, `vector.DistanceSq(a,b)`, `vector.Direction(a,b)`, `vector.Dot(a,b)`, `vector.Lerp(a,b,t)`, `v.Length()`, `v.Normalized()`

---

## Gyakori minták

### Biztonságos lefelé típuskonverzió

```c
PlayerBase player;
if (Class.CastTo(player, obj))
{
    player.DoSomething();
}
```

### Inline típuskonverzió

```c
PlayerBase player = PlayerBase.Cast(obj);
if (player) player.DoSomething();
```

### Null ellenőrzés

```c
if (!player) return;
if (!player.GetIdentity()) return;
string name = player.GetIdentity().GetName();
```

### IsAlive ellenőrzés (EntityAI szükséges)

```c
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive()) { }
```

### Foreach map iteráció

```c
foreach (string key, int value : myMap)
{
    Print(key + " = " + value.ToString());
}
```

### Enum konverzió

```c
string name = typename.EnumToString(EDamageState, state);
int val; typename.StringToEnum(EDamageState, "RUINED", val);
```

### Bit jelzőbitek

```c
int flags = FLAG_A | FLAG_B;       // összekombinálás
if (flags & FLAG_A) { }           // tesztelés
flags = flags & ~FLAG_B;          // eltávolítás
```

---

## Ami NEM létezik

| Hiányzó funkció | Megoldás |
|-----------------|----------|
| Ternáris `? :` | `if/else` |
| `do...while` | `while(true) { ... break; }` |
| `try/catch` | Ellenőrző feltételek + korai return |
| Többszörös öröklés | Egyszeres + kompozíció |
| Operátor túlterhelés | Névvel ellátott metódusok (kivéve `[]` Get/Set-tel) |
| Lambda kifejezések | Névvel ellátott metódusok |
| `nullptr` | `null` / `NULL` |
| `\\` / `\"` stringekben | Kerülendő (CParser elromlik) |
| `#include` | config.cpp `files[]` |
| Névterek | Névelőtagok (`MyMod_`, `VPP_`) |
| Interfészek / absztrakt | Üres alap metódusok |
| switch fall-through | Minden case független |
| `#define` értékek | Használj `const`-ot |
| Alapértelmezett param kifejezések | Csak literálok/NULL |
| Változó argumentumszám | `string.Format` vagy tömbök |
| Változó újradeklarálás else-if ágakban | Egyedi nevek ágaként |

---

## Widget létrehozás (programatikus)

```c
// Munkaterület lekérése
WorkspaceWidget ws = GetGame().GetWorkspace();

// Létrehozás layoutból
Widget root = ws.CreateWidgets("MyMod/gui/layouts/MyPanel.layout");

// Gyermek widget keresése
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
if (title) title.SetText("Hello World");

// Megjelenítés/elrejtés
root.Show(true);
root.Show(false);
```

---

## RPC minta

**Regisztráció (szerver):**
```c
// 3_Game vagy 4_World inicializálásban:
GetGame().RPCSingleParam(null, MY_RPC_ID, null, true, identity);  // Motor RPC

// Vagy string-routed RPC-vel (MyRPC / CF):
GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);  // CF
MyRPC.Register("MyMod", "MyRoute", this, MyRPCSide.SERVER);  // MyMod
```

**Küldés (kliensről szerverre):**
```c
Param2<string, int> data = new Param2<string, int>("itemName", 5);
GetGame().RPCSingleParam(null, MY_RPC_ID, data, true);
```

**Fogadás (szerver kezelő):**
```c
void RPC_Handler(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    if (type != CallType.Server) return;
    if (!sender) return;

    Param2<string, int> data;
    if (!ctx.Read(data)) return;

    string itemName = data.param1;
    int quantity = data.param2;
    // Feldolgozás...
}
```

---

## Hibakezelés

```c
ErrorEx("message");                              // Alapértelmezett ERROR súlyosság
ErrorEx("info", ErrorExSeverity.INFO);           // Info
ErrorEx("warning", ErrorExSeverity.WARNING);     // Figyelmeztetés
Print("debug output");                           // Szkript napló
string stack = DumpStackString();                // Hívási verem lekérése
```

---

## Fájl I/O

```c
// Útvonalak: "$profile:", "$saves:", "$mission:", "$CurrentDir:"
bool exists = FileExist("$profile:MyMod/config.json");
MakeDirectory("$profile:MyMod");

// JSON
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // VOID-ot ad vissza!
JsonFileLoader<MyConfig>.JsonSaveFile(path, cfg);

// Nyers fájl
FileHandle fh = OpenFile(path, FileMode.WRITE);
if (fh != 0) { FPrintln(fh, "line"); CloseFile(fh); }
```

---

## Objektum létrehozás

```c
// Alap
Object obj = GetGame().CreateObject("AK101", pos, false, false, true);

// Jelzőbitekkel
Object obj = GetGame().CreateObjectEx("Barrel_Green", pos, ECE_PLACE_ON_SURFACE);

// Játékos leltárába
player.GetInventory().CreateInInventory("BandageDressing");

// Csatolmányként
weapon.GetInventory().CreateAttachment("ACOGOptic");

// Törlés
GetGame().ObjectDelete(obj);
```

---

## Fő globális függvények

```c
GetGame()                          // CGame példány
GetGame().GetPlayer()              // Helyi játékos (CSAK KLIENS, szerveren null!)
GetGame().GetPlayers(out arr)      // Összes játékos (szerver)
GetGame().GetWorld()               // World példány
GetGame().GetTickTime()            // Szerver idő (float)
GetGame().GetWorkspace()           // UI munkaterület
GetGame().SurfaceY(x, z)          // Terep magasság
GetGame().IsServer()               // true a szerveren
GetGame().IsClient()               // true a kliensen
GetGame().IsMultiplayer()          // true ha többjátékos
```

---

*Teljes dokumentáció: [DayZ Modding Wiki](./README.md) | [Buktatók](01-enforce-script/12-gotchas.md) | [Hibakezelés](01-enforce-script/11-error-handling.md)*
