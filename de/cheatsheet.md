# Enforce Script Cheat Sheet

[Home](../README.md) | **Cheat Sheet**

---

## Typen

| Typ | Beschreibung | Standard | Beispiel |
|-----|-------------|----------|----------|
| `int` | 32-Bit vorzeichenbehaftete Ganzzahl | `0` | `int x = 42;` |
| `float` | 32-Bit Gleitkommazahl | `0.0` | `float f = 3.14;` |
| `bool` | Boolescher Wert | `false` | `bool b = true;` |
| `string` | Unveränderlicher Werttyp | `""` | `string s = "hello";` |
| `vector` | 3-Komponenten-Float (x,y,z) | `"0 0 0"` | `vector v = "1 2 3";` |
| `typename` | Typreferenz | `null` | `typename t = PlayerBase;` |
| `Class` | Wurzel aller Referenztypen | `null` | -- |
| `void` | Kein Rückgabewert | -- | -- |

**Grenzen:** `int.MAX` = 2147483647, `int.MIN` = -2147483648, `float.MAX`, `float.MIN`

---

## Array-Methoden (`array<T>`)

| Methode | Rückgabe | Hinweise |
|---------|-----------|----------|
| `Insert(item)` | `int` (Index) | Anfügen |
| `InsertAt(item, idx)` | `void` | An Position einfügen |
| `Get(idx)` / `arr[idx]` | `T` | Zugriff per Index |
| `Set(idx, item)` | `void` | An Index ersetzen |
| `Find(item)` | `int` | Index oder -1 |
| `Count()` | `int` | Elementanzahl |
| `IsValidIndex(idx)` | `bool` | Grenzpruefung |
| `Remove(idx)` | `void` | **Ungeordnet** (tauscht mit letztem!) |
| `RemoveOrdered(idx)` | `void` | Behält Reihenfolge bei |
| `RemoveItem(item)` | `void` | Suchen + Entfernen (geordnet) |
| `Clear()` | `void` | Alle entfernen |
| `Sort()` / `Sort(true)` | `void` | Aufsteigend / absteigend |
| `ShuffleArray()` | `void` | Zufällig mischen |
| `Invert()` | `void` | Umkehren |
| `GetRandomElement()` | `T` | Zufällige Auswahl |
| `InsertAll(other)` | `void` | Alle aus anderem anfügen |
| `Copy(other)` | `void` | Mit Kopie ersetzen |
| `Resize(n)` | `void` | Größe ändern (fuellt mit Standardwerten) |
| `Reserve(n)` | `void` | Kapazität vorab reservieren |

**Typedefs:** `TStringArray`, `TIntArray`, `TFloatArray`, `TBoolArray`, `TVectorArray`

---

## Map-Methoden (`map<K,V>`)

| Methode | Rückgabe | Hinweise |
|---------|-----------|----------|
| `Insert(key, val)` | `bool` | Neuen hinzufügen |
| `Set(key, val)` | `void` | Einfügen oder aktualisieren |
| `Get(key)` | `V` | Gibt Standard zurück wenn fehlend |
| `Find(key, out val)` | `bool` | Sicherer Zugriff |
| `Contains(key)` | `bool` | Existenz prüfen |
| `Remove(key)` | `void` | Nach Schlüssel entfernen |
| `Count()` | `int` | Eintragsanzahl |
| `GetKey(idx)` | `K` | Schlüssel am Index (O(n)) |
| `GetElement(idx)` | `V` | Wert am Index (O(n)) |
| `GetKeyArray()` | `array<K>` | Alle Schlüssel |
| `GetValueArray()` | `array<V>` | Alle Werte |
| `Clear()` | `void` | Alle entfernen |

---

## Set-Methoden (`set<T>`)

| Methode | Rückgabe |
|---------|-----------|
| `Insert(item)` | `int` (Index) |
| `Find(item)` | `int` (Index oder -1) |
| `Get(idx)` | `T` |
| `Remove(idx)` | `void` |
| `RemoveItem(item)` | `void` |
| `Count()` | `int` |
| `Clear()` | `void` |

---

## Klassen-Syntax

```c
class MyClass extends BaseClass
{
    protected int m_Value;                  // Feld
    private ref array<string> m_List;       // Eigene Referenz

    void MyClass() { m_List = new array<string>; }  // Konstruktor
    void ~MyClass() { }                              // Destruktor

    override void OnInit() { super.OnInit(); }       // Override
    static int GetCount() { return 0; }              // Statische Methode
};
```

**Zugriff:** `private` | `protected` | (standardmäßig public)
**Modifikatoren:** `static` | `override` | `ref` | `const` | `out` | `notnull`
**Modded:** `modded class MissionServer { override void OnInit() { super.OnInit(); } }`

---

## Kontrollfluss

```c
// if / else if / else
if (a > 0) { } else if (a == 0) { } else { }

// for
for (int i = 0; i < count; i++) { }

// foreach (Wert)
foreach (string item : myArray) { }

// foreach (Index + Wert)
foreach (int i, string item : myArray) { }

// foreach (Map: Schlüssel + Wert)
foreach (string key, int val : myMap) { }

// while
while (condition) { }

// switch (KEIN Fall-Through!)
switch (val) { case 0: Print("zero"); break; default: break; }
```

---

## String-Methoden

| Methode | Rückgabe | Beispiel |
|---------|-----------|----------|
| `s.Length()` | `int` | `"hello".Length()` = 5 |
| `s.Substring(start, len)` | `string` | `"hello".Substring(1,3)` = `"ell"` |
| `s.IndexOf(sub)` | `int` | -1 wenn nicht gefunden |
| `s.LastIndexOf(sub)` | `int` | Suche vom Ende |
| `s.Contains(sub)` | `bool` | |
| `s.Replace(old, new)` | `int` | Ändert in-place, gibt Anzahl zurück |
| `s.ToLower()` | `void` | **In-place!** |
| `s.ToUpper()` | `void` | **In-place!** |
| `s.TrimInPlace()` | `void` | **In-place!** |
| `s.Split(delim, out arr)` | `void` | Teilt in TStringArray |
| `s.Get(idx)` | `string` | Einzelnes Zeichen |
| `s.Set(idx, ch)` | `void` | Zeichen ersetzen |
| `s.ToInt()` | `int` | Int parsen |
| `s.ToFloat()` | `float` | Float parsen |
| `s.ToVector()` | `vector` | `"1 2 3"` parsen |
| `string.Format(fmt, ...)` | `string` | `%1`..`%9` Platzhalter |
| `string.Join(sep, arr)` | `string` | Array-Elemente verbinden |

---

## Math-Methoden

| Methode | Beschreibung |
|---------|-------------|
| `Math.RandomInt(min, max)` | `[min, max)` max exklusiv |
| `Math.RandomIntInclusive(min, max)` | `[min, max]` |
| `Math.RandomFloat01()` | `[0, 1]` |
| `Math.RandomBool()` | Zufälliges true/false |
| `Math.Round(f)` / `Floor(f)` / `Ceil(f)` | Rundung |
| `Math.AbsFloat(f)` / `AbsInt(i)` | Absolutwert |
| `Math.Clamp(val, min, max)` | Auf Bereich begrenzen |
| `Math.Min(a, b)` / `Max(a, b)` | Min/Max |
| `Math.Lerp(a, b, t)` | Lineare Interpolation |
| `Math.InverseLerp(a, b, val)` | Inverse Interpolation |
| `Math.Pow(base, exp)` / `Sqrt(f)` | Potenz/Wurzel |
| `Math.Sin(r)` / `Cos(r)` / `Tan(r)` | Trigonometrie (Bogenmass) |
| `Math.Atan2(y, x)` | Winkel aus Komponenten |
| `Math.NormalizeAngle(deg)` | Auf 0-360 normalisieren |
| `Math.SqrFloat(f)` / `SqrInt(i)` | Quadrat |

**Konstanten:** `Math.PI`, `Math.PI2`, `Math.PI_HALF`, `Math.DEG2RAD`, `Math.RAD2DEG`

**Vektor:** `vector.Distance(a,b)`, `vector.DistanceSq(a,b)`, `vector.Direction(a,b)`, `vector.Dot(a,b)`, `vector.Lerp(a,b,t)`, `v.Length()`, `v.Normalized()`

---

## Häufige Muster

### Sicherer Downcast

```c
PlayerBase player;
if (Class.CastTo(player, obj))
{
    player.DoSomething();
}
```

### Inline-Cast

```c
PlayerBase player = PlayerBase.Cast(obj);
if (player) player.DoSomething();
```

### Null-Pruefung

```c
if (!player) return;
if (!player.GetIdentity()) return;
string name = player.GetIdentity().GetName();
```

### IsAlive prüfen (erfordert EntityAI)

```c
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive()) { }
```

### Foreach Map-Iteration

```c
foreach (string key, int value : myMap)
{
    Print(key + " = " + value.ToString());
}
```

### Enum-Konvertierung

```c
string name = typename.EnumToString(EDamageState, state);
int val; typename.StringToEnum(EDamageState, "RUINED", val);
```

### Bitflags

```c
int flags = FLAG_A | FLAG_B;       // Kombinieren
if (flags & FLAG_A) { }           // Testen
flags = flags & ~FLAG_B;          // Entfernen
```

---

## Was es NICHT gibt

| Fehlendes Feature | Workaround |
|-------------------|------------|
| Ternär `? :` | `if/else` |
| `do...while` | `while(true) { ... break; }` |
| `try/catch` | Guard Clauses + frühes return |
| Mehrfachvererbung | Einfach + Komposition |
| Operatorüberladung | Benannte Methoden (ausser `[]` über Get/Set) |
| Lambdas | Benannte Methoden |
| `nullptr` | `null` / `NULL` |
| `\\` / `\"` in Strings | Vermeiden (CParser bricht) |
| `#include` | config.cpp `files[]` |
| Namensräume | Namenspräfix (`My`, `VPP_`) |
| Interfaces / abstract | Leere Basismethoden |
| switch Fall-Through | Jeder case ist unabhängig |
| `#define` Werte | `const` verwenden |
| Standard-Param-Ausdrücke | Nur Literale/NULL |
| Variadische Parameter | `string.Format` oder Arrays |
| Variablen-Neudeklaration in else-if | Eindeutige Namen pro Zweig |

---

## Widget-Erstellung (Programmatisch)

```c
// Workspace holen
WorkspaceWidget ws = GetGame().GetWorkspace();

// Aus Layout erstellen
Widget root = ws.CreateWidgets("MyMod/gui/layouts/MyPanel.layout");

// Kind-Widget finden
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
if (title) title.SetText("Hello World");

// Anzeigen/Verbergen
root.Show(true);
root.Show(false);
```

---

## RPC-Muster

**Registrieren (Server):**
```c
// In 3_Game oder 4_World Init:
GetGame().RPCSingleParam(null, MY_RPC_ID, null, true, identity);  // Engine-RPC

// Oder mit String-geroutetem RPC (MyRPC / CF):
GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);  // CF
MyRPC.Register("MyMod", "MyRoute", this, MyRPCSide.SERVER);  // MyMod
```

**Senden (Client an Server):**
```c
Param2<string, int> data = new Param2<string, int>("itemName", 5);
GetGame().RPCSingleParam(null, MY_RPC_ID, data, true);
```

**Empfangen (Server-Handler):**
```c
void RPC_Handler(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    if (type != CallType.Server) return;
    if (!sender) return;

    Param2<string, int> data;
    if (!ctx.Read(data)) return;

    string itemName = data.param1;
    int quantity = data.param2;
    // Verarbeiten...
}
```

---

## Fehlerbehandlung

```c
ErrorEx("message");                              // Standard ERROR Schweregrad
ErrorEx("info", ErrorExSeverity.INFO);           // Info
ErrorEx("warning", ErrorExSeverity.WARNING);     // Warnung
Print("debug output");                           // Skript-Log
string stack = DumpStackString();                // Aufrufstapel holen
```

---

## Datei-I/O

```c
// Pfade: "$profile:", "$saves:", "$mission:", "$CurrentDir:"
bool exists = FileExist("$profile:MyMod/config.json");
MakeDirectory("$profile:MyMod");

// JSON
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // Gibt VOID zurück!
JsonFileLoader<MyConfig>.JsonSaveFile(path, cfg);

// Rohe Datei
FileHandle fh = OpenFile(path, FileMode.WRITE);
if (fh != 0) { FPrintln(fh, "line"); CloseFile(fh); }
```

---

## Objekt-Erstellung

```c
// Einfach
Object obj = GetGame().CreateObject("AK101", pos, false, false, true);

// Mit Flags
Object obj = GetGame().CreateObjectEx("Barrel_Green", pos, ECE_PLACE_ON_SURFACE);

// Im Spielerinventar
player.GetInventory().CreateInInventory("BandageDressing");

// Als Aufsatz
weapon.GetInventory().CreateAttachment("ACOGOptic");

// Löschen
GetGame().ObjectDelete(obj);
```

---

## Wichtige globale Funktionen

```c
GetGame()                          // CGame-Instanz
GetGame().GetPlayer()              // Lokaler Spieler (nur CLIENT, null auf Server!)
GetGame().GetPlayers(out arr)      // Alle Spieler (Server)
GetGame().GetWorld()               // Welt-Instanz
GetGame().GetTickTime()            // Serverzeit (float)
GetGame().GetWorkspace()           // UI-Workspace
GetGame().SurfaceY(x, z)          // Geländehöhe
GetGame().IsServer()               // true auf dem Server
GetGame().IsClient()               // true auf dem Client
GetGame().IsMultiplayer()          // true wenn Mehrspieler
```

---

*Vollständige Dokumentation: [DayZ Modding Wiki](../README.md) | [Fallstricke](01-enforce-script/12-gotchas.md) | [Fehlerbehandlung](01-enforce-script/11-error-handling.md)*
