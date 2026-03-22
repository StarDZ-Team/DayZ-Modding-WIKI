# Enforce Script Cheat Sheet

[Home](./README.md) | **Cheat Sheet**

---

> Single-page quick reference for DayZ Enforce Script. Bookmark this.

---

## Types

| Type | Description | Default | Example |
|------|-------------|---------|---------|
| `int` | 32-bit signed integer | `0` | `int x = 42;` |
| `float` | 32-bit float | `0.0` | `float f = 3.14;` |
| `bool` | Boolean | `false` | `bool b = true;` |
| `string` | Immutable value type | `""` | `string s = "hello";` |
| `vector` | 3-component float (x,y,z) | `"0 0 0"` | `vector v = "1 2 3";` |
| `typename` | Type reference | `null` | `typename t = PlayerBase;` |
| `Class` | Root of all reference types | `null` | — |
| `void` | No return | — | — |

**Limits:** `int.MAX` = 2147483647, `int.MIN` = -2147483648, `float.MAX`, `float.MIN`

---

## Array Methods (`array<T>`)

| Method | Returns | Notes |
|--------|---------|-------|
| `Insert(item)` | `int` (index) | Append |
| `InsertAt(item, idx)` | `void` | Insert at position |
| `Get(idx)` / `arr[idx]` | `T` | Access by index |
| `Set(idx, item)` | `void` | Replace at index |
| `Find(item)` | `int` | Index or -1 |
| `Count()` | `int` | Element count |
| `IsValidIndex(idx)` | `bool` | Bounds check |
| `Remove(idx)` | `void` | **Unordered** (swaps with last!) |
| `RemoveOrdered(idx)` | `void` | Preserves order |
| `RemoveItem(item)` | `void` | Find + remove (ordered) |
| `Clear()` | `void` | Remove all |
| `Sort()` / `Sort(true)` | `void` | Ascending / descending |
| `ShuffleArray()` | `void` | Randomize |
| `Invert()` | `void` | Reverse |
| `GetRandomElement()` | `T` | Random pick |
| `InsertAll(other)` | `void` | Append all from other |
| `Copy(other)` | `void` | Replace with copy |
| `Resize(n)` | `void` | Resize (fills defaults) |
| `Reserve(n)` | `void` | Pre-allocate capacity |

**Typedefs:** `TStringArray`, `TIntArray`, `TFloatArray`, `TBoolArray`, `TVectorArray`

---

## Map Methods (`map<K,V>`)

| Method | Returns | Notes |
|--------|---------|-------|
| `Insert(key, val)` | `bool` | Add new |
| `Set(key, val)` | `void` | Insert or update |
| `Get(key)` | `V` | Returns default if missing |
| `Find(key, out val)` | `bool` | Safe get |
| `Contains(key)` | `bool` | Check existence |
| `Remove(key)` | `void` | Remove by key |
| `Count()` | `int` | Entry count |
| `GetKey(idx)` | `K` | Key at index (O(n)) |
| `GetElement(idx)` | `V` | Value at index (O(n)) |
| `GetKeyArray()` | `array<K>` | All keys |
| `GetValueArray()` | `array<V>` | All values |
| `Clear()` | `void` | Remove all |

---

## Set Methods (`set<T>`)

| Method | Returns |
|--------|---------|
| `Insert(item)` | `int` (index) |
| `Find(item)` | `int` (index or -1) |
| `Get(idx)` | `T` |
| `Remove(idx)` | `void` |
| `RemoveItem(item)` | `void` |
| `Count()` | `int` |
| `Clear()` | `void` |

---

## Class Syntax

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

**Access:** `private` | `protected` | (public by default)
**Modifiers:** `static` | `override` | `ref` | `const` | `out` | `notnull`
**Modded:** `modded class MissionServer { override void OnInit() { super.OnInit(); } }`

---

## Control Flow

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

// switch (NO fall-through!)
switch (val) { case 0: Print("zero"); break; default: break; }
```

---

## String Methods

| Method | Returns | Example |
|--------|---------|---------|
| `s.Length()` | `int` | `"hello".Length()` = 5 |
| `s.Substring(start, len)` | `string` | `"hello".Substring(1,3)` = `"ell"` |
| `s.IndexOf(sub)` | `int` | -1 if not found |
| `s.LastIndexOf(sub)` | `int` | Search from end |
| `s.Contains(sub)` | `bool` | |
| `s.Replace(old, new)` | `int` | Modifies in-place, returns count |
| `s.ToLower()` | `void` | **In-place!** |
| `s.ToUpper()` | `void` | **In-place!** |
| `s.TrimInPlace()` | `void` | **In-place!** |
| `s.Split(delim, out arr)` | `void` | Splits into TStringArray |
| `s.Get(idx)` | `string` | Single char |
| `s.Set(idx, ch)` | `void` | Replace char |
| `s.ToInt()` | `int` | Parse int |
| `s.ToFloat()` | `float` | Parse float |
| `s.ToVector()` | `vector` | Parse `"1 2 3"` |
| `string.Format(fmt, ...)` | `string` | `%1`..`%9` placeholders |
| `string.Join(sep, arr)` | `string` | Join array elements |

---

## Math Methods

| Method | Description |
|--------|-------------|
| `Math.RandomInt(min, max)` | `[min, max)` exclusive max |
| `Math.RandomIntInclusive(min, max)` | `[min, max]` |
| `Math.RandomFloat01()` | `[0, 1]` |
| `Math.RandomBool()` | Random true/false |
| `Math.Round(f)` / `Floor(f)` / `Ceil(f)` | Rounding |
| `Math.AbsFloat(f)` / `AbsInt(i)` | Absolute value |
| `Math.Clamp(val, min, max)` | Clamp to range |
| `Math.Min(a, b)` / `Max(a, b)` | Min/max |
| `Math.Lerp(a, b, t)` | Linear interpolation |
| `Math.InverseLerp(a, b, val)` | Inverse lerp |
| `Math.Pow(base, exp)` / `Sqrt(f)` | Power/root |
| `Math.Sin(r)` / `Cos(r)` / `Tan(r)` | Trig (radians) |
| `Math.Atan2(y, x)` | Angle from components |
| `Math.NormalizeAngle(deg)` | Wrap to 0-360 |
| `Math.SqrFloat(f)` / `SqrInt(i)` | Square |

**Constants:** `Math.PI`, `Math.PI2`, `Math.PI_HALF`, `Math.DEG2RAD`, `Math.RAD2DEG`

**Vector:** `vector.Distance(a,b)`, `vector.DistanceSq(a,b)`, `vector.Direction(a,b)`, `vector.Dot(a,b)`, `vector.Lerp(a,b,t)`, `v.Length()`, `v.Normalized()`

---

## Common Patterns

### Safe Downcast

```c
PlayerBase player;
if (Class.CastTo(player, obj))
{
    player.DoSomething();
}
```

### Inline Cast

```c
PlayerBase player = PlayerBase.Cast(obj);
if (player) player.DoSomething();
```

### Null Guard

```c
if (!player) return;
if (!player.GetIdentity()) return;
string name = player.GetIdentity().GetName();
```

### Check IsAlive (Requires EntityAI)

```c
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive()) { }
```

### Foreach Map Iteration

```c
foreach (string key, int value : myMap)
{
    Print(key + " = " + value.ToString());
}
```

### Enum Conversion

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

## What Does NOT Exist

| Missing Feature | Workaround |
|----------------|------------|
| Ternary `? :` | `if/else` |
| `do...while` | `while(true) { ... break; }` |
| `try/catch` | Guard clauses + early return |
| Multiple inheritance | Single + composition |
| Operator overloading | Named methods (except `[]` via Get/Set) |
| Lambdas | Named methods |
| `nullptr` | `null` / `NULL` |
| `\\` / `\"` in strings | Avoid (CParser breaks) |
| `#include` | config.cpp `files[]` |
| Namespaces | Name prefixes (`MyMod_`, `VPP_`) |
| Interfaces / abstract | Empty base methods |
| switch fall-through | Each case is independent |
| `#define` values | Use `const` |
| Default param expressions | Literals/NULL only |
| Variadic params | `string.Format` or arrays |
| Variable redeclaration in else-if | Unique names per branch |

---

## Widget Creation (Programmatic)

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

## RPC Pattern

**Register (server):**
```c
// In 3_Game or 4_World init:
GetGame().RPCSingleParam(null, MY_RPC_ID, null, true, identity);  // Engine RPC

// Or with string-routed RPC (MyRPC / CF):
GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);  // CF
MyRPC.Register("MyMod", "MyRoute", this, MyRPCSide.SERVER);  // MyMod
```

**Send (client to server):**
```c
Param2<string, int> data = new Param2<string, int>("itemName", 5);
GetGame().RPCSingleParam(null, MY_RPC_ID, data, true);
```

**Receive (server handler):**
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

## Error Handling

```c
ErrorEx("message");                              // Default ERROR severity
ErrorEx("info", ErrorExSeverity.INFO);           // Info
ErrorEx("warning", ErrorExSeverity.WARNING);     // Warning
Print("debug output");                           // Script log
string stack = DumpStackString();                // Get call stack
```

---

## File I/O

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

## Object Creation

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

## Key Global Functions

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

*Full documentation: [DayZ Modding Wiki](./README.md) | [Gotchas](01-enforce-script/12-gotchas.md) | [Error Handling](01-enforce-script/11-error-handling.md)*
