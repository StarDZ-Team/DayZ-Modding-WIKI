# Capitulo 1.13: Funciones y Metodos

[Home](../../README.md) | [<< Previous: Gotchas](12-gotchas.md) | **Funciones y Metodos**

---

## Introduccion

Las funciones son la unidad fundamental de comportamiento en Enforce Script. Toda accion que un mod realiza --- spawnear un item, verificar la salud de un jugador, enviar un RPC, dibujar un elemento de UI --- vive dentro de una funcion. Entender como declararlas, pasar datos de entrada y salida, y trabajar con los modificadores especiales del motor es esencial para escribir mods de DayZ correctos.

Este capitulo cubre function mechanics in depth: declaration syntax, parameter passing modes, return values, default parameters, proto native bindings, static vs instance methods, overriding, the `thread` keyword, and the `event` keyword. Si el Capitulo 1.3 (Clases) te enseno donde viven las funciones, este capitulo te ensena como funcionan.

---

## Tabla de Contenidos

- [Function Declaration Syntax](#function-declaration-syntax)
  - [Standalone Functions](#standalone-functions)
  - [Instance Methods](#instance-methods)
  - [Static Methods](#static-methods)
- [Parameter Passing Modes](#parameter-passing-modes)
  - [By Value (Default)](#by-value-default)
  - [out Parameters](#out-parameters)
  - [inout Parameters](#inout-parameters)
  - [notnull Parameters](#notnull-parameters)
- [Return Values](#return-values)
- [Default Parameter Values](#default-parameter-values)
- [Proto Native Methods (Engine Bindings)](#proto-native-methods-engine-bindings)
- [Static vs Instance Methods](#static-vs-instance-methods)
- [Method Overriding](#method-overriding)
- [Method Overloading (Not Supported)](#method-overloading-not-supported)
- [The event Keyword](#the-event-keyword)
- [Thread Methods (Coroutines)](#thread-methods-coroutines)
- [Deferred Calls with CallLater](#deferred-calls-with-calllater)
- [Best Practices](#best-practices)
- [Observed in Real Mods](#observed-in-real-mods)
- [Theory vs Practice](#theory-vs-practice)
- [Common Mistakes](#common-mistakes)
- [Quick Reference Table](#quick-reference-table)

---

## Sintaxis de Declaracion de Funciones

Toda funcion tiene un tipo de retorno, un nombre y una lista de parametros. El cuerpo esta encerrado entre llaves.

```
ReturnType FunctionName(ParamType paramName, ...)
{
    // body
}
```

### Standalone Functions

Las funciones independientes (globales) existen fuera de cualquier clase. Son raras en el modding de DayZ --- casi todo el codigo vive dentro de clases --- pero encontraras algunas en los scripts vanilla.

```c
// Standalone function (global scope)
void PrintPlayerCount()
{
    int count = GetGame().GetPlayers().Count();
    Print(string.Format("Players online: %1", count));
}

// Standalone function with return value
string FormatTimestamp(int hours, int minutes)
{
    return string.Format("%1:%2", hours.ToStringLen(2), minutes.ToStringLen(2));
}
```

El motor vanilla define varias funciones de utilidad independientes:

```c
// From enscript.c — helper for string expressions
string String(string s)
{
    return s;
}
```

### Instance Methods

La gran mayoria de funciones en mods de DayZ son metodos de instancia --- pertenecen a una clase y operan sobre los datos de esa instancia.

```c
class LootSpawner
{
    protected vector m_Position;
    protected float m_Radius;

    void SetPosition(vector pos)
    {
        m_Position = pos;
    }

    float GetRadius()
    {
        return m_Radius;
    }

    bool IsNearby(vector testPos)
    {
        return vector.Distance(m_Position, testPos) <= m_Radius;
    }
}
```

Los metodos de instancia tienen acceso implicito a `this` --- una referencia al objeto actual. Raramente necesitas escribir `this.` explicitamente, pero puede ayudar a desambiguar cuando un parametro tiene un nombre similar.

### Static Methods

Los metodos estaticos pertenecen a la clase misma, no a ninguna instancia. Call them via `ClassName.Method()`. No pueden acceder a campos de instancia ni a `this`.

```c
class MathHelper
{
    static float Clamp01(float value)
    {
        if (value < 0) return 0;
        if (value > 1) return 1;
        return value;
    }

    static float Lerp(float a, float b, float t)
    {
        return a + (b - a) * Clamp01(t);
    }
}

// Usage:
float result = MathHelper.Lerp(0, 100, 0.75);  // 75.0
```

Los metodos estaticos son ideales para funciones de utilidad, metodos de fabrica y accesores singleton. El codigo vanilla de DayZ los usa extensivamente:

```c
// From DamageSystem (3_game/damagesystem.c)
class DamageSystem
{
    static bool GetDamageZoneMap(EntityAI entity, out DamageZoneMap zoneMap)
    {
        // ...
    }

    static string GetDamageDisplayName(EntityAI entity, string zone)
    {
        // ...
    }
}
```

---

## Modos de Paso de Parametros

Enforce Script soporta cuatro modos de paso de parametros. Entenderlos es critico porque el modo incorrecto lleva a bugs silenciosos donde los datos nunca llegan al llamador.

### By Value (Default)

Cuando no se especifica ningun modificador, el parametro se pasa **by value**. Para tipos primitivos (`int`, `float`, `bool`, `string`, `vector`), se hace una copia. Las modificaciones dentro de la funcion no afectan la variable del que la llama.

```c
void DoubleValue(int x)
{
    x = x * 2;  // modifies local copy only
}

// Usage:
int n = 5;
DoubleValue(n);
Print(n);  // still 5 --- the original is unchanged
```

Para tipos de clase (objetos), el paso por valor aun pasa una **referencia al objeto** --- pero la referencia misma se copia. Puedes modificar los campos del objeto, pero no puedes reasignar la referencia para apuntar a un objeto diferente.

```c
void RenameZone(SpawnZone zone)
{
    zone.SetName("NewName");  // this WORKS --- modifies the same object
    zone = null;              // this does NOT affect the caller's variable
}
```

### out Parameters

The `out` keyword marca un parametro como **solo de salida**. La funcion escribe un valor en el, y el llamador recibe ese valor. El valor inicial del parametro es indefinido --- no lo leas antes de escribir.

```c
// out parameter — function fills the value
bool TryFindPlayer(string name, out PlayerBase player)
{
    array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);

    for (int i = 0; i < players.Count(); i++)
    {
        PlayerBase pb = PlayerBase.Cast(players[i]);
        if (pb && pb.GetIdentity() && pb.GetIdentity().GetName() == name)
        {
            player = pb;
            return true;
        }
    }

    player = null;
    return false;
}

// Usage:
PlayerBase result;
if (TryFindPlayer("John", result))
{
    Print(result.GetIdentity().GetName());
}
```

Los scripts vanilla usan `out` extensively for engine-to-script data flow:

```c
// From DayZPlayer (3_game/dayzplayer.c)
proto native void GetCurrentCameraTransform(out vector position, out vector direction, out vector rotation);

// From AIWorld (3_game/ai/aiworld.c)
proto native bool RaycastNavMesh(vector from, vector to, PGFilter pgFilter, out vector hitPos, out vector hitNormal);

// Multiple out parameters for look limits
proto void GetLookLimits(out float pDown, out float pUp, out float pLeft, out float pRight);
```

### inout Parameters

The `inout` keyword marca un parametro que es **tanto leido como escrito** por la funcion. El valor del llamador esta disponible dentro de la funcion, y cualquier modificacion es visible para el llamador despues.

```c
// inout — the function reads the current value and modifies it
void ClampHealth(inout float health)
{
    if (health < 0)
        health = 0;
    if (health > 100)
        health = 100;
}

// Usage:
float hp = 150.0;
ClampHealth(hp);
Print(hp);  // 100.0
```

Ejemplos vanilla de `inout`:

```c
// From enmath.c — smoothing function reads and writes velocity
proto static float SmoothCD(float val, float target, inout float velocity[],
    float smoothTime, float maxVelocity, float dt);

// From enscript.c — parsing modifies the input string
proto int ParseStringEx(inout string input, string token);

// From Pawn (3_game/entities/pawn.c) — transform is read and modified
event void GetTransform(inout vector transform[4])
```

### notnull Parameters

The `notnull` keyword le dice al compilador (y al motor) que el parametro no debe ser `null`. Si se pasa un valor null, el juego crasheara con un error en lugar de proceder silenciosamente con datos invalidos.

```c
void ProcessEntity(notnull EntityAI entity)
{
    // Safe to use entity without null-checking — engine guarantees it
    string name = entity.GetType();
    Print(name);
}
```

Vanilla uses `notnull` heavily in engine-facing functions:

```c
// From envisual.c
proto native void SetBone(notnull IEntity ent, int bone, vector angles, vector trans, float scale);
proto native bool GetBoneMatrix(notnull IEntity ent, int bone, vector mat[4]);

// From DamageSystem
static bool GetDamageZoneFromComponentName(notnull EntityAI entity, string component, out string damageZone);
```

Puedes combinar `notnull` with `out`:

```c
// From universaltemperaturesourcelambdabaseimpl.c
override void DryItemsInVicinity(UniversalTemperatureSourceSettings pSettings, vector position,
    out notnull array<EntityAI> nearestObjects);
```

---

## Valores de Retorno

### Single Return Value

Las funciones retornan un solo valor. El tipo de retorno se declara antes del nombre de la funcion.

```c
float GetDistanceBetween(vector a, vector b)
{
    return vector.Distance(a, b);
}
```

### void (No Return)

Usa `void` para funciones que realizan una accion sin retornar datos.

```c
void LogMessage(string msg)
{
    Print(string.Format("[MyMod] %1", msg));
}
```

### Returning Objects

Cuando una funcion retorna un objeto, retorna una **referencia** (no una copia). El llamador recibe un puntero al mismo objeto en memoria.

```c
EntityAI SpawnItem(string className, vector pos)
{
    EntityAI item = EntityAI.Cast(GetGame().CreateObject(className, pos, false, false, true));
    return item;  // caller gets a reference to the same object
}
```

### Multiple Return Values via out Parameters

Cuando necesitas retornar mas de un valor, usa parametros `out`. Este es un patron universal en scripting de DayZ.

```c
void GetTimeComponents(float totalSeconds, out int hours, out int minutes, out int seconds)
{
    hours = (int)(totalSeconds / 3600);
    minutes = (int)((totalSeconds % 3600) / 60);
    seconds = (int)(totalSeconds % 60);
}

// Usage:
int h, m, s;
GetTimeComponents(3725, h, m, s);
// h == 1, m == 2, s == 5
```

### GOTCHA: JsonFileLoader Retorna void

Una trampa comun: `JsonFileLoader<T>.JsonLoadFile()` retorna `void`, no el objeto cargado. Debes pasar un objeto pre-creado como parametro `ref`.

```c
// WRONG — will not compile
MyConfig config = JsonFileLoader<MyConfig>.JsonLoadFile(path);

// CORRECT — pass a ref object
MyConfig config = new MyConfig;
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
```

---

## Valores de Parametros por Defecto

Enforce Script soporta valores por defecto para parametros. Los parametros con valores por defecto deben ir **despues** de todos los parametros requeridos.

```c
void SpawnItem(string className, vector pos, float quantity = -1, bool withAttachments = true)
{
    // quantity defaults to -1 (full), withAttachments defaults to true
    EntityAI item = EntityAI.Cast(GetGame().CreateObject(className, pos, false, false, true));
    if (item && quantity >= 0)
        item.SetQuantity(quantity);
}

// All of these are valid calls:
SpawnItem("AKM", myPos);                   // uses both defaults
SpawnItem("AKM", myPos, 0.5);             // custom quantity, default attachments
SpawnItem("AKM", myPos, -1, false);        // must specify quantity to reach attachments
```

### Default Values From Vanilla

Los scripts vanilla usan default parameters extensively:

```c
// From Weather (3_game/weather.c)
proto native void Set(float forecast, float time = 0, float minDuration = 0);
proto native void SetDynVolFogDistanceDensity(float value, float time = 0);

// From UAInput (3_game/inputapi/uainput.c)
proto native float SyncedValue_ID(int action, bool check_focus = true);
proto native bool SyncedPress(string action, bool check_focus = true);

// From DbgUI (1_core/proto/dbgui.c)
static bool FloatOverride(string id, inout float value, float min, float max,
    int precision = 1000, bool sameLine = true);

// From InputManager (2_gamelib/inputmanager.c)
proto native external bool ActivateAction(string actionName, int duration = 0);
```

### Limitations

1. **Literal values only** --- you cannot use expressions, function calls, or other variables as defaults:

```c
// WRONG — no expressions in defaults
void MyFunc(float speed = Math.PI * 2)  // COMPILE ERROR

// CORRECT — use a literal
void MyFunc(float speed = 6.283)
```

2. **No named parameters** --- you cannot skip a parameter by name. To set the third default, you must provide all preceding parameters:

```c
void Configure(int a = 1, int b = 2, int c = 3) {}

Configure(1, 2, 10);  // must specify a and b to set c
// There is no syntax like Configure(c: 10)
```

3. **Default values for class types are restricted to `null` or `NULL`:**

```c
void DoWork(EntityAI target = null, string name = "")
{
    if (!target) return;
    // ...
}
```

---

## Metodos Proto Native (Bindings del Motor)

Los metodos proto native se declaran en script pero **se implementan en el motor C++**. Forman el puente entre tu codigo de Enforce Script y el motor de juego de DayZ. Los llamas como metodos normales, pero no puedes ver o modificar su implementacion.

### Modifier Reference

| Modificador | Significado | Ejemplo |
|----------|---------|---------|
| `proto native` | Implemented in C++ engine code | `proto native void SetPosition(vector pos);` |
| `proto native owned` | Returns a value the caller owns (manages memory) | `proto native owned string GetType();` |
| `proto native external` | Defined in another module | `proto native external bool AddSettings(typename cls);` |
| `proto volatile` | Has side effects; compiler must not optimize away | `proto volatile int Call(Class inst, string fn, void parm);` |
| `proto` (without `native`) | Internal function, may or may not be native | `proto int ParseString(string input, out string tokens[]);` |

### proto native

El modificador mas comun. Estas son llamadas directas al motor.

```c
// Setting/getting position (Object)
proto native void SetPosition(vector pos);
proto native vector GetPosition();

// AI pathfinding (AIWorld)
proto native bool FindPath(vector from, vector to, PGFilter pgFilter, out TVectorArray waypoints);
proto native bool SampleNavmeshPosition(vector position, float maxDistance, PGFilter pgFilter,
    out vector sampledPosition);
```

### proto native owned

The `owned` modifier means the return value is allocated by the engine and **ownership is transferred to the script**. This is primarily used for `string` returns, where the engine creates a new string that the script's garbage collector must later free.

```c
// From Class (enscript.c) — returns a string the script now owns
proto native owned external string ClassName();

// From Widget (enwidgets.c)
proto native owned string GetName();
proto native owned string GetTypeName();
proto native owned string GetStyleName();

// From Object (3_game/entities/object.c)
proto native owned string GetLODName(LOD lod);
proto native owned string GetActionComponentName(int componentIndex, string geometry = "");
```

### proto native external

The `external` modifier indicates the function is defined in a different script module. This allows cross-module method declarations.

```c
// From Settings (2_gamelib/settings.c)
proto native external bool AddSettings(typename settingsClass);

// From InputManager (2_gamelib/inputmanager.c)
proto native external bool RegisterAction(string actionName);
proto native external float LocalValue(string actionName);
proto native external bool ActivateAction(string actionName, int duration = 0);

// From Workbench API (1_core/workbenchapi.c)
proto native external bool SetOpenedResource(string filename);
proto native external bool Save();
```

### proto volatile

The `volatile` modifier tells the compiler the function may have **side effects** or may **call back into script** (creating re-entrancy). The compiler must preserve full context when calling these.

```c
// From ScriptModule (enscript.c) — dynamic function calls that may invoke script
proto volatile int Call(Class inst, string function, void parm);
proto volatile int CallFunction(Class inst, string function, out void returnVal, void parm);

// From typename (enconvert.c) — creates a new instance dynamically
proto volatile Class Spawn();

// Yielding control
proto volatile void Idle();
```

### Calling Proto Native Methods

You call them like any other method. La regla clave: **nunca intentes sobreescribir o redefinir un metodo proto native**. Son bindings fijos del motor.

```c
// Calling proto native methods — no different from script methods
Object obj = GetGame().CreateObject("AKM", pos, false, false, true);
vector position = obj.GetPosition();
string typeName = obj.GetType();     // owned string — returned to you
obj.SetPosition(newPos);             // native void — no return
```

---

## Metodos Estaticos vs de Instancia

### When to Use Static

Usa metodos estaticos cuando la funcion no necesita ningun dato de instancia:

```c
class StringUtils
{
    // Pure utility — no state needed
    static bool IsNullOrEmpty(string s)
    {
        return s == "" || s.Length() == 0;
    }

    static string PadLeft(string s, int totalWidth, string padChar = "0")
    {
        while (s.Length() < totalWidth)
            s = padChar + s;
        return s;
    }
}
```

**Casos de uso comunes de static:**
- **Funciones de utilidad** --- math helpers, string formatters, validation checks
- **Metodos de fabrica** --- `Create()` that returns a new configured instance
- **Accesores de singleton** --- `GetInstance()` that returns the single instance
- **Constantes/busquedas** --- `Init()` + `Cleanup()` for static data tables

### Singleton Pattern (Static + Instance)

Muchos managers de DayZ combinan static e instance:

```c
class NotificationManager
{
    private static ref NotificationManager s_Instance;

    static NotificationManager GetInstance()
    {
        if (!s_Instance)
            s_Instance = new NotificationManager;
        return s_Instance;
    }

    // Instance methods for actual work
    void ShowNotification(string text, float duration)
    {
        // ...
    }
}

// Usage:
NotificationManager.GetInstance().ShowNotification("Hello", 5.0);
```

### When to Use Instance

Usa metodos de instancia cuando la funcion necesita acceso al estado del objeto:

```c
class SupplyDrop
{
    protected vector m_DropPosition;
    protected float m_DropRadius;
    protected ref array<string> m_LootTable;

    // Needs m_DropPosition, m_DropRadius — must be instance
    bool IsInDropZone(vector testPos)
    {
        return vector.Distance(m_DropPosition, testPos) <= m_DropRadius;
    }

    // Needs m_LootTable — must be instance
    string GetRandomItem()
    {
        return m_LootTable.GetRandomElement();
    }
}
```

---

## Sobreescritura de Metodos

Cuando una clase hija necesita cambiar el comportamiento de un metodo padre, usa la palabra clave `override`.

### Basic Override

```c
class BaseModule
{
    void OnInit()
    {
        Print("[BaseModule] Initialized");
    }

    void OnUpdate(float dt)
    {
        // default: do nothing
    }
}

class CombatModule extends BaseModule
{
    override void OnInit()
    {
        super.OnInit();  // call parent first
        Print("[CombatModule] Combat system ready");
    }

    override void OnUpdate(float dt)
    {
        super.OnUpdate(dt);
        // custom combat logic
        CheckCombatState();
    }
}
```

### Rules for Overriding

1. **`override` keyword is required** --- without it, you create a new method that hides the parent's, instead of replacing it.

2. **Signature must match exactly** --- same return type, same parameter types, same parameter count.

3. **`super.MethodName()` calls the parent** --- use this to extend behavior rather than completely replace it.

4. **Private methods cannot be overridden** --- they are invisible to child classes.

5. **Protected methods can be overridden** --- child classes see and can override them.

```c
class Parent
{
    private void SecretMethod() {}    // cannot be overridden
    protected void InternalWork() {}  // can be overridden by children
    void PublicWork() {}              // can be overridden by anyone
}

class Child extends Parent
{
    // override void SecretMethod() {}   // COMPILE ERROR — private
    override void InternalWork() {}      // OK — protected is visible
    override void PublicWork() {}        // OK — public
}
```

### GOTCHA: Olvidar override

Si omites `override`, el compilador puede emitir una advertencia pero **no** un error. Tu metodo silenciosamente se convierte en un nuevo metodo en lugar de reemplazar el del padre. The parent's version runs whenever the object is referenced through a parent-type variable.

```c
class Animal
{
    void Speak() { Print("..."); }
}

class Dog extends Animal
{
    // BAD: Missing override — creates a NEW method
    void Speak() { Print("Woof!"); }

    // GOOD: Properly overrides
    override void Speak() { Print("Woof!"); }
}
```

---

## Sobrecarga de Metodos (No Soportada)

**Enforce Script no soporta sobrecarga de metodos.** No puedes tener dos metodos con el mismo nombre pero diferentes listas de parametros. Intentar esto causara un error de compilacion.

```c
class Calculator
{
    // COMPILE ERROR — duplicate method name
    int Add(int a, int b) { return a + b; }
    float Add(float a, float b) { return a + b; }  // NOT ALLOWED
}
```

### Workaround 1: Different Method Names

El enfoque mas comun es usar nombres descriptivos:

```c
class Calculator
{
    int AddInt(int a, int b) { return a + b; }
    float AddFloat(float a, float b) { return a + b; }
}
```

### Workaround 2: The Ex() Convention

DayZ vanilla y los mods siguen una convencion de nombres donde una version extendida de un metodo agrega `Ex` al nombre:

```c
// From vanilla scripts — base version vs extended version
void ExplosionEffects(Object source, Object directHit, int componentIndex);
void ExplosionEffectsEx(Object source, Object directHit, int componentIndex,
    float energyFactor, float explosionFactor, HitInfo hitInfo);

// From EffectManager
static void EffectUnregister(Effect effect);
static void EffectUnregisterEx(Effect effect);

// From EntityAI
void SplitIntoStackMax(EntityAI destination_entity, int slot_id);
void SplitIntoStackMaxEx(EntityAI destination_entity, int slot_id);
```

### Workaround 3: Default Parameters

Si la diferencia es solo parametros opcionales, usa valores por defecto en su lugar:

```c
class Spawner
{
    // Instead of overloads, use defaults
    void SpawnAt(vector pos, float radius = 0, string filter = "")
    {
        // one method handles all cases
    }
}
```

---

## La Palabra Clave event

The `event` keyword marca un metodo como un **handler de evento del motor** --- una funcion que el motor C++ llama en momentos especificos (entity creation, animation events, physics callbacks, etc.). Es una indicacion para herramientas (como Workbench) de que el metodo debe exponerse como un evento de script.

```c
// From Pawn (3_game/entities/pawn.c)
protected event void OnPossess()
{
    // called by engine when a controller possesses this pawn
}

protected event void OnUnPossess()
{
    // called by engine when the controller releases this pawn
}

event void GetTransform(inout vector transform[4])
{
    // engine calls this to get the entity's transform
}

// Event methods that supply data for networking
protected event void ObtainMove(PawnMove pMove)
{
    // called by engine to gather movement input
}
```

You typically `override` event methods in child classes rather than defining them from scratch:

```c
class MyVehicle extends Transport
{
    override event void GetTransform(inout vector transform[4])
    {
        // provide custom transform logic
        super.GetTransform(transform);
    }
}
```

El punto clave: `event` is a declaration modifier, not something you invoke. The engine calls event methods at the appropriate time.

---

## Metodos Thread (Corrutinas)

The `thread` keyword crea una **corrutina** --- una funcion que puede ceder la ejecucion y resumir despues. A pesar del nombre, Enforce Script es **single-threaded**. Los metodos thread son corrutinas cooperativas, no hilos a nivel del sistema operativo.

### Declaring and Starting a Thread

You start a thread by calling a function with the `thread` keyword preceding the call:

```c
class Monitor
{
    void Start()
    {
        thread MonitorLoop();
    }

    void MonitorLoop()
    {
        while (true)
        {
            CheckStatus();
            Sleep(1000);  // yield for 1000 milliseconds
        }
    }
}
```

The `thread` keyword goes on the **call**, not the function declaration. The function itself is a normal function --- what makes it a coroutine is how you invoke it.

### Sleep() and Yielding

Inside a thread function, `Sleep(milliseconds)` pauses execution and yields to other code. When the sleep time elapses, the thread resumes from where it left off.

### Killing Threads

You can terminate a running thread with `KillThread()`:

```c
// From enscript.c
proto native int KillThread(Class owner, string name);

// Usage:
KillThread(this, "MonitorLoop");  // stops the MonitorLoop coroutine
```

The `owner` is the object that started the thread (or `null` for global threads). The `name` is the function name.

### When to Use Threads (and When Not To)

**Prefiere `CallLater` y timers sobre threads.** Las corrutinas de thread tienen limitaciones:
- Son mas dificiles de depurar (los stack traces son menos claros)
- Consumen un slot de corrutina que persiste hasta completarse o terminarse
- No pueden ser serializadas o transferidas a traves de limites de red

Usa threads solo cuando genuinamente necesites un bucle de larga duracion con yields intermedios. Para acciones retrasadas de una sola vez, usa `CallLater` (ver abajo).

---

## Llamadas Diferidas con CallLater

`CallLater` programa una llamada a funcion para ejecutarse despues de un retraso. Es la alternativa principal a las corrutinas de thread y se usa extensivamente en DayZ vanilla.

### Syntax

```c
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(FunctionToCall, delayMs, repeat, ...params);
```

| Parametro | Type | Descripcion |
|-----------|------|-------------|
| Function | `func` | The method to call |
| Delay | `int` | Milliseconds before calling |
| Repeat | `bool` | `true` to repeat at interval, `false` for one-shot |
| Params | variadic | Parameters to pass to the function |

### Call Categories

| Categoria | Proposito |
|----------|---------|
| `CALL_CATEGORY_SYSTEM` | General-purpose, runs every frame |
| `CALL_CATEGORY_GUI` | UI-related callbacks |
| `CALL_CATEGORY_GAMEPLAY` | Gameplay logic callbacks |

### Examples from Vanilla

```c
// One-shot delayed call (3_game/entities/entityai.c)
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(DeferredInit, 34);

// Repeated call — login countdown every 1 second (3_game/dayzgame.c)
GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(this.LoginTimeCountdown, 1000, true);

// Delayed deletion with parameter (4_world/entities/explosivesbase)
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(DeleteSafe, delayFor * 1000, false);

// UI delayed callback (3_game/gui/hints/uihintpanel.c)
m_Game.GetCallQueue(CALL_CATEGORY_GUI).CallLater(SlideshowThread, m_SlideShowDelay);
```

### Removing Queued Calls

Para cancelar una llamada programada antes de que se ejecute:

```c
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).Remove(FunctionToCall);
```

---

## Mejores Practicas

1. **Manten las funciones cortas** --- aim for under 50 lines. If a function is longer, extract helper methods.

2. **Usa clausulas de guardia para retorno temprano** --- check preconditions at the top and return early. This reduces nesting and makes the "happy path" easier to read.

```c
void ProcessPlayer(PlayerBase player)
{
    if (!player) return;
    if (!player.IsAlive()) return;
    if (!player.GetIdentity()) return;

    // actual logic here, unnested
    string name = player.GetIdentity().GetName();
    // ...
}
```

3. **Prefiere parametros out sobre tipos de retorno complejos** --- when a function needs to communicate success/failure plus data, use a `bool` return with `out` parameters.

4. **Usa static para utilidades sin estado** --- if a method does not access `this`, make it `static`. This documents intent and allows calling without an instance.

5. **Documenta las limitaciones de proto native** --- when wrapping a proto native call, note in comments what the engine function can and cannot do.

6. **Prefiere CallLater sobre corrutinas de thread** --- `CallLater` is simpler, easier to cancel, and less error-prone.

7. **Siempre llama a super en los overrides** --- a menos que intencionalmente quieras reemplazar completamente el comportamiento del padre. Las cadenas de herencia profundas de DayZ dependen de que las llamadas a `super` se propaguen a traves de la jerarquia.

---

## Observado en Mods Reales

> Patrones confirmados al estudiar codigo fuente de mods profesionales de DayZ.

| Patron | Mod | Detalle |
|---------|-----|--------|
| `TryGet___()` returning `bool` with `out` param | COT / Expansion | Consistent pattern for nullable lookups: return `true`/`false`, fill `out` param on success |
| `MethodEx()` for extended signatures | Vanilla / Expansion Market | When an API needs more parameters, append `Ex` rather than breaking existing callers |
| Static `Init()` + `Cleanup()` class methods | Expansion / VPP | Manager classes initialize static data in `Init()` and tear down in `Cleanup()`, called from mission lifecycle |
| Guard clause `if (!GetGame()) return` at method start | COT Admin Tools | Every method that touches the engine starts with null checks to avoid crashes during shutdown |
| Singleton `GetInstance()` with lazy creation | COT / Expansion / Dabs | Managers expose `static ref` instance with `GetInstance()` accessor, created on first access |

---

## Teoria vs Practica

| Concepto | Teoria | Realidad |
|---------|--------|---------|
| Method overloading | Standard OOP feature | Not supported; use `Ex()` suffix or default parameters instead |
| `thread` creates OS threads | Keyword suggests parallelism | Single-threaded coroutines with cooperative yielding via `Sleep()` |
| `out` parameters are write-only | Should not read initial value | Some vanilla code reads the `out` param before writing; safer to always treat as `inout` defensively |
| `override` is optional | Could be inferred | Omitting it silently creates a new method instead of overriding; always include it |
| Default parameter expressions | Should support function calls | Only literal values (`42`, `true`, `null`, `""`) are allowed; no expressions |

---

## Errores Comunes

### 1. Olvidar override al Reemplazar un Metodo Padre

Sin `override`, tu metodo se convierte en un nuevo metodo que oculta el del padre. La version del padre aun se llamara cuando el objeto sea referenciado a traves de un tipo padre.

```c
// BAD — silently creates a new method
class CustomPlayer extends PlayerBase
{
    void OnConnect() { Print("Custom!"); }
}

// GOOD — properly overrides
class CustomPlayer extends PlayerBase
{
    override void OnConnect() { Print("Custom!"); }
}
```

### 2. Esperar que los Parametros out Esten Pre-inicializados

An `out` parameter has no guaranteed initial value. Never read it before writing.

```c
// BAD — reading out param before it's set
void GetData(out int value)
{
    if (value > 0)  // WRONG — value is undefined here
        return;
    value = 42;
}

// GOOD — always write first, then read
void GetData(out int value)
{
    value = 42;
}
```

### 3. Intentar Sobrecargar Metodos

Enforce Script no soporta sobrecarga. Dos metodos con el mismo nombre causan un error de compilacion.

```c
// COMPILE ERROR
void Process(int id) {}
void Process(string name) {}

// CORRECT — use different names
void ProcessById(int id) {}
void ProcessByName(string name) {}
```

### 4. Asignar el Retorno de una Funcion void

Some functions (notably `JsonFileLoader.JsonLoadFile`) return `void`. Trying to assign their result causes a compile error.

```c
// COMPILE ERROR — JsonLoadFile returns void
MyConfig cfg = JsonFileLoader<MyConfig>.JsonLoadFile(path);

// CORRECT
MyConfig cfg = new MyConfig;
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
```

### 5. Usar Expresiones en Parametros por Defecto

Default parameter values must be compile-time literals. Expressions, function calls, and variable references are not allowed.

```c
// COMPILE ERROR — expression in default
void SetTimeout(float seconds = GetDefaultTimeout()) {}
void SetAngle(float rad = Math.PI) {}

// CORRECT — literal values only
void SetTimeout(float seconds = 30.0) {}
void SetAngle(float rad = 3.14159) {}
```

### 6. Olvidar super en Cadenas de Override

DayZ's class hierarchies are deep. Omitting `super` in an override can break functionality several layers up the chain that you never even knew existed.

```c
// BAD — breaks parent initialization
class MyMission extends MissionServer
{
    override void OnInit()
    {
        // forgot super.OnInit() — vanilla initialization never runs!
        Print("My mission started");
    }
}

// GOOD
class MyMission extends MissionServer
{
    override void OnInit()
    {
        super.OnInit();  // let vanilla + other mods initialize first
        Print("My mission started");
    }
}
```

---

## Tabla de Referencia Rapida

| Caracteristica | Syntax | Notas |
|---------|--------|-------|
| Instance method | `void DoWork()` | Has access to `this` |
| Static method | `static void DoWork()` | Called via `ClassName.DoWork()` |
| By-value param | `void Fn(int x)` | Copy for primitives; ref copy for objects |
| `out` param | `void Fn(out int x)` | Write-only; caller receives value |
| `inout` param | `void Fn(inout float x)` | Read + write; caller sees changes |
| `notnull` param | `void Fn(notnull EntityAI e)` | Crashes on null |
| Default value | `void Fn(int x = 5)` | Literals only, no expressions |
| Override | `override void Fn()` | Must match parent signature |
| Call parent | `super.Fn()` | Inside override body |
| Proto native | `proto native void Fn()` | Implemented in C++ |
| Owned return | `proto native owned string Fn()` | Script manages returned memory |
| External | `proto native external void Fn()` | Defined in another module |
| Volatile | `proto volatile void Fn()` | May callback into script |
| Evento | `event void Fn()` | Engine-invoked callback |
| Thread start | `thread MyFunc()` | Starts coroutine (not OS thread) |
| Kill thread | `KillThread(owner, "FnName")` | Stops a running coroutine |
| Deferred call | `CallLater(Fn, delay, repeat)` | Preferred over threads |
| `Ex()` convention | `void FnEx(...)` | Extended version of `Fn` |

---

## Navegacion

| Anterior | Arriba | Siguiente |
|----------|----|------|
| [1.12 Gotchas](12-gotchas.md) | [Part 1: Enforce Script](../README.md) | -- |
