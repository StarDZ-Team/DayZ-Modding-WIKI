# Hoja de Referencia de Enforce Script

[Inicio](./README.md) | **Hoja de Referencia**

---

> Referencia rápida de una sola página para Enforce Script de DayZ. Guarda esta página en favoritos.

---

## Tipos

| Tipo | Descripción | Predeterminado | Ejemplo |
|------|-------------|---------|---------|
| `int` | Entero con signo de 32 bits | `0` | `int x = 42;` |
| `float` | Flotante de 32 bits | `0.0` | `float f = 3.14;` |
| `bool` | Booleano | `false` | `bool b = true;` |
| `string` | Tipo valor inmutable | `""` | `string s = "hello";` |
| `vector` | 3 componentes flotantes (x,y,z) | `"0 0 0"` | `vector v = "1 2 3";` |
| `typename` | Referencia de tipo | `null` | `typename t = PlayerBase;` |
| `Class` | Raíz de todos los tipos por referencia | `null` | — |
| `void` | Sin retorno | — | — |

**Límites:** `int.MAX` = 2147483647, `int.MIN` = -2147483648, `float.MAX`, `float.MIN`

---

## Métodos de Array (`array<T>`)

| Método | Retorna | Notas |
|--------|---------|-------|
| `Insert(item)` | `int` (índice) | Agregar al final |
| `InsertAt(item, idx)` | `void` | Insertar en posición |
| `Get(idx)` / `arr[idx]` | `T` | Acceso por índice |
| `Set(idx, item)` | `void` | Reemplazar en índice |
| `Find(item)` | `int` | Índice o -1 |
| `Count()` | `int` | Cantidad de elementos |
| `IsValidIndex(idx)` | `bool` | Verificación de límites |
| `Remove(idx)` | `void` | **Sin orden** (¡intercambia con el último!) |
| `RemoveOrdered(idx)` | `void` | Preserva el orden |
| `RemoveItem(item)` | `void` | Buscar + eliminar (con orden) |
| `Clear()` | `void` | Eliminar todos |
| `Sort()` / `Sort(true)` | `void` | Ascendente / descendente |
| `ShuffleArray()` | `void` | Aleatorizar |
| `Invert()` | `void` | Invertir |
| `GetRandomElement()` | `T` | Selección aleatoria |
| `InsertAll(other)` | `void` | Agregar todos desde otro |
| `Copy(other)` | `void` | Reemplazar con copia |
| `Resize(n)` | `void` | Redimensionar (rellena con valores predeterminados) |
| `Reserve(n)` | `void` | Pre-asignar capacidad |

**Typedefs:** `TStringArray`, `TIntArray`, `TFloatArray`, `TBoolArray`, `TVectorArray`

---

## Métodos de Map (`map<K,V>`)

| Método | Retorna | Notas |
|--------|---------|-------|
| `Insert(key, val)` | `bool` | Agregar nuevo |
| `Set(key, val)` | `void` | Insertar o actualizar |
| `Get(key)` | `V` | Retorna valor predeterminado si no existe |
| `Find(key, out val)` | `bool` | Obtención segura |
| `Contains(key)` | `bool` | Verificar existencia |
| `Remove(key)` | `void` | Eliminar por clave |
| `Count()` | `int` | Cantidad de entradas |
| `GetKey(idx)` | `K` | Clave en índice (O(n)) |
| `GetElement(idx)` | `V` | Valor en índice (O(n)) |
| `GetKeyArray()` | `array<K>` | Todas las claves |
| `GetValueArray()` | `array<V>` | Todos los valores |
| `Clear()` | `void` | Eliminar todo |

---

## Métodos de Set (`set<T>`)

| Método | Retorna |
|--------|---------|
| `Insert(item)` | `int` (índice) |
| `Find(item)` | `int` (índice o -1) |
| `Get(idx)` | `T` |
| `Remove(idx)` | `void` |
| `RemoveItem(item)` | `void` |
| `Count()` | `int` |
| `Clear()` | `void` |

---

## Sintaxis de Clases

```c
class MyClass extends BaseClass
{
    protected int m_Value;                  // campo
    private ref array<string> m_List;       // referencia propia

    void MyClass() { m_List = new array<string>; }  // constructor
    void ~MyClass() { }                              // destructor

    override void OnInit() { super.OnInit(); }       // sobreescritura
    static int GetCount() { return 0; }              // método estático
};
```

**Acceso:** `private` | `protected` | (público por defecto)
**Modificadores:** `static` | `override` | `ref` | `const` | `out` | `notnull`
**Modded:** `modded class MissionServer { override void OnInit() { super.OnInit(); } }`

---

## Flujo de Control

```c
// if / else if / else
if (a > 0) { } else if (a == 0) { } else { }

// for
for (int i = 0; i < count; i++) { }

// foreach (valor)
foreach (string item : myArray) { }

// foreach (índice + valor)
foreach (int i, string item : myArray) { }

// foreach (map: clave + valor)
foreach (string key, int val : myMap) { }

// while
while (condition) { }

// switch (¡NO hay fall-through!)
switch (val) { case 0: Print("zero"); break; default: break; }
```

---

## Métodos de String

| Método | Retorna | Ejemplo |
|--------|---------|---------|
| `s.Length()` | `int` | `"hello".Length()` = 5 |
| `s.Substring(start, len)` | `string` | `"hello".Substring(1,3)` = `"ell"` |
| `s.IndexOf(sub)` | `int` | -1 si no se encuentra |
| `s.LastIndexOf(sub)` | `int` | Búsqueda desde el final |
| `s.Contains(sub)` | `bool` | |
| `s.Replace(old, new)` | `int` | Modifica in situ, retorna cantidad |
| `s.ToLower()` | `void` | **¡In situ!** |
| `s.ToUpper()` | `void` | **¡In situ!** |
| `s.TrimInPlace()` | `void` | **¡In situ!** |
| `s.Split(delim, out arr)` | `void` | Divide en TStringArray |
| `s.Get(idx)` | `string` | Carácter individual |
| `s.Set(idx, ch)` | `void` | Reemplazar carácter |
| `s.ToInt()` | `int` | Parsear int |
| `s.ToFloat()` | `float` | Parsear float |
| `s.ToVector()` | `vector` | Parsear `"1 2 3"` |
| `string.Format(fmt, ...)` | `string` | Marcadores `%1`..`%9` |
| `string.Join(sep, arr)` | `string` | Unir elementos de array |

---

## Métodos Matemáticos

| Método | Descripción |
|--------|-------------|
| `Math.RandomInt(min, max)` | `[min, max)` máximo exclusivo |
| `Math.RandomIntInclusive(min, max)` | `[min, max]` |
| `Math.RandomFloat01()` | `[0, 1]` |
| `Math.RandomBool()` | true/false aleatorio |
| `Math.Round(f)` / `Floor(f)` / `Ceil(f)` | Redondeo |
| `Math.AbsFloat(f)` / `AbsInt(i)` | Valor absoluto |
| `Math.Clamp(val, min, max)` | Restringir a rango |
| `Math.Min(a, b)` / `Max(a, b)` | Mínimo/máximo |
| `Math.Lerp(a, b, t)` | Interpolación lineal |
| `Math.InverseLerp(a, b, val)` | Lerp inverso |
| `Math.Pow(base, exp)` / `Sqrt(f)` | Potencia/raíz |
| `Math.Sin(r)` / `Cos(r)` / `Tan(r)` | Trigonometría (radianes) |
| `Math.Atan2(y, x)` | Ángulo desde componentes |
| `Math.NormalizeAngle(deg)` | Ajustar a 0-360 |
| `Math.SqrFloat(f)` / `SqrInt(i)` | Cuadrado |

**Constantes:** `Math.PI`, `Math.PI2`, `Math.PI_HALF`, `Math.DEG2RAD`, `Math.RAD2DEG`

**Vector:** `vector.Distance(a,b)`, `vector.DistanceSq(a,b)`, `vector.Direction(a,b)`, `vector.Dot(a,b)`, `vector.Lerp(a,b,t)`, `v.Length()`, `v.Normalized()`

---

## Patrones Comunes

### Downcast Seguro

```c
PlayerBase player;
if (Class.CastTo(player, obj))
{
    player.DoSomething();
}
```

### Cast en Línea

```c
PlayerBase player = PlayerBase.Cast(obj);
if (player) player.DoSomething();
```

### Guardia contra Null

```c
if (!player) return;
if (!player.GetIdentity()) return;
string name = player.GetIdentity().GetName();
```

### Verificar IsAlive (Requiere EntityAI)

```c
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive()) { }
```

### Iteración de Map con Foreach

```c
foreach (string key, int value : myMap)
{
    Print(key + " = " + value.ToString());
}
```

### Conversión de Enum

```c
string name = typename.EnumToString(EDamageState, state);
int val; typename.StringToEnum(EDamageState, "RUINED", val);
```

### Banderas de Bits

```c
int flags = FLAG_A | FLAG_B;       // combinar
if (flags & FLAG_A) { }           // probar
flags = flags & ~FLAG_B;          // eliminar
```

---

## Lo que NO Existe

| Característica Ausente | Alternativa |
|----------------|------------|
| Ternario `? :` | `if/else` |
| `do...while` | `while(true) { ... break; }` |
| `try/catch` | Cláusulas de guardia + retorno temprano |
| Herencia múltiple | Simple + composición |
| Sobrecarga de operadores | Métodos con nombre (excepto `[]` vía Get/Set) |
| Lambdas | Métodos con nombre |
| `nullptr` | `null` / `NULL` |
| `\\` / `\"` en strings | Evitar (CParser se rompe) |
| `#include` | config.cpp `files[]` |
| Namespaces | Prefijos de nombre (`MyMod_`, `VPP_`) |
| Interfaces / abstract | Métodos base vacíos |
| Fall-through en switch | Cada caso es independiente |
| Valores en `#define` | Usar `const` |
| Expresiones en parámetros por defecto | Solo literales/NULL |
| Parámetros variádicos | `string.Format` o arrays |
| Redeclaración de variables en else-if | Nombres únicos por rama |

---

## Creación de Widgets (Programática)

```c
// Obtener workspace
WorkspaceWidget ws = GetGame().GetWorkspace();

// Crear desde layout
Widget root = ws.CreateWidgets("MyMod/gui/layouts/MyPanel.layout");

// Buscar widget hijo
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
if (title) title.SetText("Hello World");

// Mostrar/ocultar
root.Show(true);
root.Show(false);
```

---

## Patrón RPC

**Registrar (servidor):**
```c
// En init de 3_Game o 4_World:
GetGame().RPCSingleParam(null, MY_RPC_ID, null, true, identity);  // RPC del motor

// O con RPC enrutado por string (MyRPC / CF):
GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);  // CF
MyRPC.Register("MyMod", "MyRoute", this, MyRPCSide.SERVER);  // MyMod
```

**Enviar (cliente a servidor):**
```c
Param2<string, int> data = new Param2<string, int>("itemName", 5);
GetGame().RPCSingleParam(null, MY_RPC_ID, data, true);
```

**Recibir (handler del servidor):**
```c
void RPC_Handler(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    if (type != CallType.Server) return;
    if (!sender) return;

    Param2<string, int> data;
    if (!ctx.Read(data)) return;

    string itemName = data.param1;
    int quantity = data.param2;
    // Procesar...
}
```

---

## Manejo de Errores

```c
ErrorEx("message");                              // Severidad ERROR por defecto
ErrorEx("info", ErrorExSeverity.INFO);           // Info
ErrorEx("warning", ErrorExSeverity.WARNING);     // Advertencia
Print("debug output");                           // Log de script
string stack = DumpStackString();                // Obtener pila de llamadas
```

---

## E/S de Archivos

```c
// Rutas: "$profile:", "$saves:", "$mission:", "$CurrentDir:"
bool exists = FileExist("$profile:MyMod/config.json");
MakeDirectory("$profile:MyMod");

// JSON
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // ¡Retorna VOID!
JsonFileLoader<MyConfig>.JsonSaveFile(path, cfg);

// Archivo crudo
FileHandle fh = OpenFile(path, FileMode.WRITE);
if (fh != 0) { FPrintln(fh, "line"); CloseFile(fh); }
```

---

## Creación de Objetos

```c
// Básico
Object obj = GetGame().CreateObject("AK101", pos, false, false, true);

// Con banderas
Object obj = GetGame().CreateObjectEx("Barrel_Green", pos, ECE_PLACE_ON_SURFACE);

// En inventario del jugador
player.GetInventory().CreateInInventory("BandageDressing");

// Como accesorio
weapon.GetInventory().CreateAttachment("ACOGOptic");

// Eliminar
GetGame().ObjectDelete(obj);
```

---

## Funciones Globales Clave

```c
GetGame()                          // Instancia de CGame
GetGame().GetPlayer()              // Jugador local (¡SOLO CLIENTE, null en servidor!)
GetGame().GetPlayers(out arr)      // Todos los jugadores (servidor)
GetGame().GetWorld()               // Instancia del mundo
GetGame().GetTickTime()            // Tiempo del servidor (float)
GetGame().GetWorkspace()           // Workspace de UI
GetGame().SurfaceY(x, z)          // Altura del terreno
GetGame().IsServer()               // true en servidor
GetGame().IsClient()               // true en cliente
GetGame().IsMultiplayer()          // true si es multijugador
```

---

*Documentación completa: [Wiki de Modding de DayZ](./README.md) | [Errores Comunes](01-enforce-script/12-gotchas.md) | [Manejo de Errores](01-enforce-script/11-error-handling.md)*
