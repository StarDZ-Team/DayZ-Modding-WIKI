# Ściągawka Enforce Script

[Strona główna](./README.md) | **Ściągawka**

---

> Jednostronicowa ściągawka dla DayZ Enforce Script. Dodaj do zakładek.

---

## Typy

| Typ | Opis | Domyślna | Przykład |
|-----|------|----------|---------|
| `int` | 32-bitowa liczba całkowita ze znakiem | `0` | `int x = 42;` |
| `float` | 32-bitowa liczba zmiennoprzecinkowa | `0.0` | `float f = 3.14;` |
| `bool` | Wartość logiczna | `false` | `bool b = true;` |
| `string` | Niezmienny typ wartościowy | `""` | `string s = "hello";` |
| `vector` | 3-składnikowy float (x,y,z) | `"0 0 0"` | `vector v = "1 2 3";` |
| `typename` | Referencja do typu | `null` | `typename t = PlayerBase;` |
| `Class` | Korzeń wszystkich typów referencyjnych | `null` | — |
| `void` | Brak wartości zwracanej | — | — |

**Limity:** `int.MAX` = 2147483647, `int.MIN` = -2147483648, `float.MAX`, `float.MIN`

---

## Metody tablicy (`array<T>`)

| Metoda | Zwraca | Uwagi |
|--------|--------|-------|
| `Insert(item)` | `int` (indeks) | Dodaj na koniec |
| `InsertAt(item, idx)` | `void` | Wstaw na pozycję |
| `Get(idx)` / `arr[idx]` | `T` | Dostęp po indeksie |
| `Set(idx, item)` | `void` | Zastąp na indeksie |
| `Find(item)` | `int` | Indeks lub -1 |
| `Count()` | `int` | Liczba elementów |
| `IsValidIndex(idx)` | `bool` | Sprawdzenie zakresu |
| `Remove(idx)` | `void` | **Nieuporządkowane** (zamienia z ostatnim!) |
| `RemoveOrdered(idx)` | `void` | Zachowuje kolejność |
| `RemoveItem(item)` | `void` | Znajdź i usuń (uporządkowane) |
| `Clear()` | `void` | Usuń wszystko |
| `Sort()` / `Sort(true)` | `void` | Rosnąco / malejąco |
| `ShuffleArray()` | `void` | Losowe przemieszanie |
| `Invert()` | `void` | Odwróć |
| `GetRandomElement()` | `T` | Losowy wybór |
| `InsertAll(other)` | `void` | Dodaj wszystko z innej |
| `Copy(other)` | `void` | Zastąp kopią |
| `Resize(n)` | `void` | Zmień rozmiar (wypełnia domyślnymi) |
| `Reserve(n)` | `void` | Wstępna alokacja pojemności |

**Aliasy typów:** `TStringArray`, `TIntArray`, `TFloatArray`, `TBoolArray`, `TVectorArray`

---

## Metody mapy (`map<K,V>`)

| Metoda | Zwraca | Uwagi |
|--------|--------|-------|
| `Insert(key, val)` | `bool` | Dodaj nowy |
| `Set(key, val)` | `void` | Wstaw lub zaktualizuj |
| `Get(key)` | `V` | Zwraca domyślną jeśli brak |
| `Find(key, out val)` | `bool` | Bezpieczne pobranie |
| `Contains(key)` | `bool` | Sprawdź istnienie |
| `Remove(key)` | `void` | Usuń po kluczu |
| `Count()` | `int` | Liczba wpisów |
| `GetKey(idx)` | `K` | Klucz na indeksie (O(n)) |
| `GetElement(idx)` | `V` | Wartość na indeksie (O(n)) |
| `GetKeyArray()` | `array<K>` | Wszystkie klucze |
| `GetValueArray()` | `array<V>` | Wszystkie wartości |
| `Clear()` | `void` | Usuń wszystko |

---

## Metody zbioru (`set<T>`)

| Metoda | Zwraca |
|--------|--------|
| `Insert(item)` | `int` (indeks) |
| `Find(item)` | `int` (indeks lub -1) |
| `Get(idx)` | `T` |
| `Remove(idx)` | `void` |
| `RemoveItem(item)` | `void` |
| `Count()` | `int` |
| `Clear()` | `void` |

---

## Składnia klas

```c
class MyClass extends BaseClass
{
    protected int m_Value;                  // pole
    private ref array<string> m_List;       // posiadana referencja

    void MyClass() { m_List = new array<string>; }  // konstruktor
    void ~MyClass() { }                              // destruktor

    override void OnInit() { super.OnInit(); }       // nadpisanie
    static int GetCount() { return 0; }              // metoda statyczna
};
```

**Dostęp:** `private` | `protected` | (publiczne domyślnie)
**Modyfikatory:** `static` | `override` | `ref` | `const` | `out` | `notnull`
**Modded:** `modded class MissionServer { override void OnInit() { super.OnInit(); } }`

---

## Sterowanie przepływem

```c
// if / else if / else
if (a > 0) { } else if (a == 0) { } else { }

// for
for (int i = 0; i < count; i++) { }

// foreach (wartość)
foreach (string item : myArray) { }

// foreach (indeks + wartość)
foreach (int i, string item : myArray) { }

// foreach (mapa: klucz + wartość)
foreach (string key, int val : myMap) { }

// while
while (condition) { }

// switch (BEZ przenikania!)
switch (val) { case 0: Print("zero"); break; default: break; }
```

---

## Metody łańcuchów znaków

| Metoda | Zwraca | Przykład |
|--------|--------|---------|
| `s.Length()` | `int` | `"hello".Length()` = 5 |
| `s.Substring(start, len)` | `string` | `"hello".Substring(1,3)` = `"ell"` |
| `s.IndexOf(sub)` | `int` | -1 jeśli nie znaleziono |
| `s.LastIndexOf(sub)` | `int` | Szuka od końca |
| `s.Contains(sub)` | `bool` | |
| `s.Replace(old, new)` | `int` | Modyfikuje w miejscu, zwraca liczbę |
| `s.ToLower()` | `void` | **W miejscu!** |
| `s.ToUpper()` | `void` | **W miejscu!** |
| `s.TrimInPlace()` | `void` | **W miejscu!** |
| `s.Split(delim, out arr)` | `void` | Dzieli na TStringArray |
| `s.Get(idx)` | `string` | Pojedynczy znak |
| `s.Set(idx, ch)` | `void` | Zastąp znak |
| `s.ToInt()` | `int` | Parsuj liczbę całkowitą |
| `s.ToFloat()` | `float` | Parsuj liczbę zmiennoprzecinkową |
| `s.ToVector()` | `vector` | Parsuj `"1 2 3"` |
| `string.Format(fmt, ...)` | `string` | Symbole zastępcze `%1`..`%9` |
| `string.Join(sep, arr)` | `string` | Połącz elementy tablicy |

---

## Metody matematyczne

| Metoda | Opis |
|--------|------|
| `Math.RandomInt(min, max)` | `[min, max)` max wyłączne |
| `Math.RandomIntInclusive(min, max)` | `[min, max]` |
| `Math.RandomFloat01()` | `[0, 1]` |
| `Math.RandomBool()` | Losowe true/false |
| `Math.Round(f)` / `Floor(f)` / `Ceil(f)` | Zaokrąglanie |
| `Math.AbsFloat(f)` / `AbsInt(i)` | Wartość bezwzględna |
| `Math.Clamp(val, min, max)` | Ogranicz do zakresu |
| `Math.Min(a, b)` / `Max(a, b)` | Min/max |
| `Math.Lerp(a, b, t)` | Interpolacja liniowa |
| `Math.InverseLerp(a, b, val)` | Odwrotna interpolacja |
| `Math.Pow(base, exp)` / `Sqrt(f)` | Potęga/pierwiastek |
| `Math.Sin(r)` / `Cos(r)` / `Tan(r)` | Trygonometria (radiany) |
| `Math.Atan2(y, x)` | Kąt ze składowych |
| `Math.NormalizeAngle(deg)` | Normalizuj do 0-360 |
| `Math.SqrFloat(f)` / `SqrInt(i)` | Podniesienie do kwadratu |

**Stałe:** `Math.PI`, `Math.PI2`, `Math.PI_HALF`, `Math.DEG2RAD`, `Math.RAD2DEG`

**Wektor:** `vector.Distance(a,b)`, `vector.DistanceSq(a,b)`, `vector.Direction(a,b)`, `vector.Dot(a,b)`, `vector.Lerp(a,b,t)`, `v.Length()`, `v.Normalized()`

---

## Typowe wzorce

### Bezpieczne rzutowanie w dół

```c
PlayerBase player;
if (Class.CastTo(player, obj))
{
    player.DoSomething();
}
```

### Rzutowanie inline

```c
PlayerBase player = PlayerBase.Cast(obj);
if (player) player.DoSomething();
```

### Sprawdzenie null

```c
if (!player) return;
if (!player.GetIdentity()) return;
string name = player.GetIdentity().GetName();
```

### Sprawdzenie IsAlive (wymaga EntityAI)

```c
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive()) { }
```

### Iteracja po mapie za pomocą foreach

```c
foreach (string key, int value : myMap)
{
    Print(key + " = " + value.ToString());
}
```

### Konwersja typu wyliczeniowego

```c
string name = typename.EnumToString(EDamageState, state);
int val; typename.StringToEnum(EDamageState, "RUINED", val);
```

### Flagi bitowe

```c
int flags = FLAG_A | FLAG_B;       // łączenie
if (flags & FLAG_A) { }           // testowanie
flags = flags & ~FLAG_B;          // usuwanie
```

---

## Czego NIE MA

| Brakująca funkcja | Obejście |
|--------------------|----------|
| Operator trójargumentowy `? :` | `if/else` |
| `do...while` | `while(true) { ... break; }` |
| `try/catch` | Klauzule ochronne + wczesny return |
| Dziedziczenie wielokrotne | Pojedyncze + kompozycja |
| Przeciążanie operatorów | Nazwane metody (oprócz `[]` przez Get/Set) |
| Lambdy | Nazwane metody |
| `nullptr` | `null` / `NULL` |
| `\\` / `\"` w łańcuchach | Unikać (CParser się psuje) |
| `#include` | config.cpp `files[]` |
| Przestrzenie nazw | Prefiksy nazw (`MyMod_`, `VPP_`) |
| Interfejsy / abstrakcyjne | Puste metody bazowe |
| Przenikanie switch | Każdy case jest niezależny |
| Wartości `#define` | Używaj `const` |
| Wyrażenia w parametrach domyślnych | Tylko literały/NULL |
| Parametry wariadyczne | `string.Format` lub tablice |
| Redeklaracja zmiennych w else-if | Unikalne nazwy dla każdej gałęzi |

---

## Tworzenie widgetów (programowo)

```c
// Pobierz przestrzeń roboczą
WorkspaceWidget ws = GetGame().GetWorkspace();

// Utwórz z layoutu
Widget root = ws.CreateWidgets("MyMod/gui/layouts/MyPanel.layout");

// Znajdź widget potomny
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
if (title) title.SetText("Hello World");

// Pokaż/ukryj
root.Show(true);
root.Show(false);
```

---

## Wzorzec RPC

**Rejestracja (serwer):**
```c
// W 3_Game lub 4_World init:
GetGame().RPCSingleParam(null, MY_RPC_ID, null, true, identity);  // Engine RPC

// Lub z RPC kierowanym przez łańcuch znaków (MyRPC / CF):
GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);  // CF
MyRPC.Register("MyMod", "MyRoute", this, MyRPCSide.SERVER);  // MyMod
```

**Wysyłanie (klient do serwera):**
```c
Param2<string, int> data = new Param2<string, int>("itemName", 5);
GetGame().RPCSingleParam(null, MY_RPC_ID, data, true);
```

**Odbieranie (handler na serwerze):**
```c
void RPC_Handler(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    if (type != CallType.Server) return;
    if (!sender) return;

    Param2<string, int> data;
    if (!ctx.Read(data)) return;

    string itemName = data.param1;
    int quantity = data.param2;
    // Przetwarzanie...
}
```

---

## Obsługa błędów

```c
ErrorEx("message");                              // Domyślna ważność ERROR
ErrorEx("info", ErrorExSeverity.INFO);           // Info
ErrorEx("warning", ErrorExSeverity.WARNING);     // Ostrzeżenie
Print("debug output");                           // Log skryptu
string stack = DumpStackString();                // Pobierz stos wywołań
```

---

## Operacje na plikach

```c
// Ścieżki: "$profile:", "$saves:", "$mission:", "$CurrentDir:"
bool exists = FileExist("$profile:MyMod/config.json");
MakeDirectory("$profile:MyMod");

// JSON
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // Zwraca VOID!
JsonFileLoader<MyConfig>.JsonSaveFile(path, cfg);

// Surowy plik
FileHandle fh = OpenFile(path, FileMode.WRITE);
if (fh != 0) { FPrintln(fh, "line"); CloseFile(fh); }
```

---

## Tworzenie obiektów

```c
// Podstawowe
Object obj = GetGame().CreateObject("AK101", pos, false, false, true);

// Z flagami
Object obj = GetGame().CreateObjectEx("Barrel_Green", pos, ECE_PLACE_ON_SURFACE);

// W ekwipunku gracza
player.GetInventory().CreateInInventory("BandageDressing");

// Jako załącznik
weapon.GetInventory().CreateAttachment("ACOGOptic");

// Usunięcie
GetGame().ObjectDelete(obj);
```

---

## Kluczowe funkcje globalne

```c
GetGame()                          // Instancja CGame
GetGame().GetPlayer()              // Lokalny gracz (tylko KLIENT, null na serwerze!)
GetGame().GetPlayers(out arr)      // Wszyscy gracze (serwer)
GetGame().GetWorld()               // Instancja świata
GetGame().GetTickTime()            // Czas serwera (float)
GetGame().GetWorkspace()           // Przestrzeń robocza UI
GetGame().SurfaceY(x, z)          // Wysokość terenu
GetGame().IsServer()               // true na serwerze
GetGame().IsClient()               // true na kliencie
GetGame().IsMultiplayer()          // true jeśli multiplayer
```

---

*Pełna dokumentacja: [Wiki moddingu DayZ](./README.md) | [Pułapki](01-enforce-script/12-gotchas.md) | [Obsługa błędów](01-enforce-script/11-error-handling.md)*
