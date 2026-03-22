# Capitulo 1.12: Lo que NO Existe (Gotchas)

[Inicio](../README.md) | [<< Anterior: Manejo de Errores](11-error-handling.md) | **Gotchas** | [Siguiente: Funciones y Metodos >>](13-functions-methods.md)

---

## Tabla de Contenidos

- [Referencia Completa de Gotchas](#referencia-completa-de-gotchas)
  1. [Sin Operador Ternario](#1-sin-operador-ternario)
  2. [Sin Bucle do...while](#2-sin-bucle-dowhile)
  3. [Sin try/catch/throw](#3-sin-trycatchthrow)
  4. [Sin Herencia Multiple](#4-sin-herencia-multiple)
  5. [Sin Sobrecarga de Operadores (Excepto Index)](#5-sin-sobrecarga-de-operadores-excepto-index)
  6. [Sin Lambdas / Funciones Anonimas](#6-sin-lambdas--funciones-anonimas)
  7. [Sin Delegates / Punteros a Funcion (Nativos)](#7-sin-delegates--punteros-a-funcion-nativos)
  8. [Sin Escape de String para Backslash/Comilla](#8-sin-escape-de-string-para-backslashcomilla)
  9. [Sin Redeclaracion de Variables en Bloques else-if](#9-sin-redeclaracion-de-variables-en-bloques-else-if)
  10. [Sin Ternario en Declaracion de Variable](#10-sin-ternario-en-declaracion-de-variable)
  11. [Object.IsAlive() NO Existe en Object Base](#11-objectisalive-no-existe-en-object-base)
  12. [Sin nullptr --- Usa NULL o null](#12-sin-nullptr--usa-null-o-null)
  13. [switch/case NO Tiene Fall-Through](#13-switchcase-no-tiene-fall-through)
  14. [Sin Expresiones en Parametros Predeterminados](#14-sin-expresiones-en-parametros-predeterminados)
  15. [JsonFileLoader.JsonLoadFile Retorna void](#15-jsonfileloaderjsonloadfile-retorna-void)
  16. [Sin Sustitucion de Valores con #define](#16-sin-sustitucion-de-valores-con-define)
  17. [Sin Interfaces / Clases Abstractas (Forzado)](#17-sin-interfaces--clases-abstractas-forzado)
  18. [Sin Restricciones de Generics](#18-sin-restricciones-de-generics)
  19. [Sin Validacion de Enum](#19-sin-validacion-de-enum)
  20. [Sin Parametros Variadicos](#20-sin-parametros-variadicos)
  21. [Sin Declaraciones de Clases Anidadas](#21-sin-declaraciones-de-clases-anidadas)
  22. [Los Arrays Estaticos Son de Tamano Fijo](#22-los-arrays-estaticos-son-de-tamano-fijo)
  23. [array.Remove Es Desordenado](#23-arrayremove-es-desordenado)
  24. [Sin #include --- Todo via config.cpp](#24-sin-include--todo-via-configcpp)
  25. [Sin Namespaces](#25-sin-namespaces)
  26. [Los Metodos de String Modifican In-Place](#26-los-metodos-de-string-modifican-in-place)
  27. [Los Ciclos de ref Causan Fugas de Memoria](#27-los-ciclos-de-ref-causan-fugas-de-memoria)
  28. [Sin Garantia de Destructor en Apagado del Servidor](#28-sin-garantia-de-destructor-en-apagado-del-servidor)
  29. [Sin Gestion de Recursos Basada en Ambito (RAII)](#29-sin-gestion-de-recursos-basada-en-ambito-raii)
  30. [GetGame().GetPlayer() Retorna null en el Servidor](#30-getgamegetplayer-retorna-null-en-el-servidor)
- [Viniendo de C++](#viniendo-de-c)
- [Viniendo de C#](#viniendo-de-c-1)
- [Viniendo de Java](#viniendo-de-java)
- [Viniendo de Python](#viniendo-de-python)
- [Tabla de Referencia Rapida](#tabla-de-referencia-rapida)
- [Navegacion](#navegacion)

---

## Referencia Completa de Gotchas

### 1. Sin Operador Ternario

**Lo que escribirias:**
```c
int x = (condition) ? valueA : valueB;
```

**Lo que ocurre:** Error de compilacion. El operador `? :` no existe.

**Solucion correcta:**
```c
int x;
if (condition)
    x = valueA;
else
    x = valueB;
```

---

### 2. Sin Bucle do...while

**Lo que escribirias:**
```c
do {
    Process();
} while (HasMore());
```

**Lo que ocurre:** Error de compilacion. La palabra clave `do` no existe.

**Solucion correcta --- patron con flag:**
```c
bool first = true;
while (first || HasMore())
{
    first = false;
    Process();
}
```

**Solucion correcta --- patron con break:**
```c
while (true)
{
    Process();
    if (!HasMore())
        break;
}
```

---

### 3. Sin try/catch/throw

**Lo que escribirias:**
```c
try {
    RiskyOperation();
} catch (Exception e) {
    HandleError(e);
}
```

**Lo que ocurre:** Error de compilacion. Estas palabras clave no existen.

**Solucion correcta:** Clausulas de guarda con retorno temprano.
```c
void DoOperation()
{
    if (!CanDoOperation())
    {
        ErrorEx("Cannot perform operation", ErrorExSeverity.WARNING);
        return;
    }

    // Proceder de forma segura
    RiskyOperation();
}
```

Consulta el [Capitulo 1.11 --- Manejo de Errores](11-error-handling.md) para patrones completos.

---

### 4. Sin Herencia Multiple

**Lo que escribirias:**
```c
class MyClass extends BaseA, BaseB  // Dos clases base
```

**Lo que ocurre:** Error de compilacion. Solo se soporta herencia simple.

**Solucion correcta:** Heredar de una clase, componer la otra:
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

### 5. Sin Sobrecarga de Operadores (Excepto Index)

**Lo que escribirias:**
```c
Vector3 operator+(Vector3 a, Vector3 b) { ... }
bool operator==(MyClass other) { ... }
```

**Lo que ocurre:** Error de compilacion. No se pueden definir operadores personalizados.

**Solucion correcta:** Usa metodos con nombre:
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

**Excepcion:** El operador de indice `[]` se puede sobrecargar via metodos `Get(index)` y `Set(index, value)`:
```c
class MyContainer
{
    int data[10];

    int Get(int index) { return data[index]; }
    void Set(int index, int value) { data[index] = value; }
}

MyContainer c = new MyContainer();
c[3] = 42;        // Llama a Set(3, 42)
int v = c[3];     // Llama a Get(3)
```

---

### 6. Sin Lambdas / Funciones Anonimas

**Lo que escribirias:**
```c
array.Sort((a, b) => a.name.CompareTo(b.name));
button.OnClick += () => { DoSomething(); };
```

**Lo que ocurre:** Error de compilacion. La sintaxis lambda no existe.

**Solucion correcta:** Define metodos con nombre y pasalos como `ScriptCaller` o usa callbacks basados en strings:
```c
// Metodo con nombre
void OnButtonClick()
{
    DoSomething();
}

// Callback basado en string (usado por CallLater, timers, etc.)
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.OnButtonClick, 1000, false);
```

---

### 7. Sin Delegates / Punteros a Funcion (Nativos)

**Lo que escribirias:**
```c
delegate void MyCallback(int value);
MyCallback cb = SomeFunction;
cb(42);
```

**Lo que ocurre:** Error de compilacion. La palabra clave `delegate` no existe.

**Solucion correcta:** Usa `ScriptCaller`, `ScriptInvoker`, o nombres de metodos basados en strings:
```c
// ScriptCaller (callback individual)
ScriptCaller caller = ScriptCaller.Create(MyFunction);

// ScriptInvoker (evento con multiples suscriptores)
ref ScriptInvoker m_OnEvent = new ScriptInvoker();
m_OnEvent.Insert(MyHandler);
m_OnEvent.Invoke();  // Llama a todos los handlers registrados
```

---

### 8. Sin Escape de String para Backslash/Comilla

**Lo que escribirias:**
```c
string path = "C:\\Users\\folder";
string quote = "He said \"hello\"";
```

**Lo que ocurre:** CParser crashea o produce salida ilegible. Las secuencias de escape `\\` y `\"` rompen el parser de strings.

**Solucion correcta:** Evita completamente los caracteres de barra invertida y comillas en literales de string:
```c
// Usa barras normales para rutas
string path = "C:/Users/folder";

// Usa comillas simples o reformula para evitar comillas dobles incrustadas
string quote = "He said 'hello'";

// Usa concatenacion de strings si absolutamente necesitas caracteres especiales
// (aun asi es riesgoso --- prueba exhaustivamente)
```

> **Nota:** Las secuencias de escape `\n`, `\r` y `\t` SI funcionan. Solo `\\` y `\"` estan rotas.

---

### 9. Sin Redeclaracion de Variables en Bloques else-if

**Lo que escribirias:**
```c
if (condA)
{
    string msg = "Case A";
    Print(msg);
}
else if (condB)
{
    string msg = "Case B";  // Mismo nombre de variable en bloque hermano
    Print(msg);
}
```

**Lo que ocurre:** Error de compilacion: "multiple declaration of variable 'msg'". Enforce Script trata las variables en bloques `if`/`else if`/`else` hermanos como si compartieran el mismo ambito.

**Solucion correcta --- nombres unicos:**
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

**Solucion correcta --- declarar antes del if:**
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

### 10. Sin Ternario en Declaracion de Variable

Relacionado con la gotcha #1, pero especifico para declaraciones:

**Lo que escribirias:**
```c
string label = isAdmin ? "Admin" : "Player";
```

**Solucion correcta:**
```c
string label;
if (isAdmin)
    label = "Admin";
else
    label = "Player";
```

---

### 11. Object.IsAlive() NO Existe en Object Base

**Lo que escribirias:**
```c
Object obj = GetSomething();
if (obj.IsAlive())  // Verificar si esta vivo
```

**Lo que ocurre:** Error de compilacion o crash en tiempo de ejecucion. `IsAlive()` esta definido en `EntityAI`, no en `Object`.

**Solucion correcta:**
```c
Object obj = GetSomething();
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive())
{
    // Confirmado vivo de forma segura
}
```

---

### 12. Sin nullptr --- Usa NULL o null

**Lo que escribirias:**
```c
if (obj == nullptr)
```

**Lo que ocurre:** Error de compilacion. La palabra clave `nullptr` no existe.

**Solucion correcta:**
```c
if (obj == null)    // minusculas funciona
if (obj == NULL)    // mayusculas tambien funciona
if (!obj)           // verificacion de null idiomatica (preferida)
```

---

### 13. switch/case NO Tiene Fall-Through

**Lo que escribirias (esperando fall-through de C/C++):**
```c
switch (value)
{
    case 1:
    case 2:
    case 3:
        Print("1, 2, or 3");  // En C++, los casos 1 y 2 caen hasta aqui
        break;
}
```

**Lo que ocurre:** Solo el caso 3 ejecuta el Print. Los casos 1 y 2 estan vacios --- no hacen nada y NO caen al siguiente.

**Solucion correcta:**
```c
if (value >= 1 && value <= 3)
{
    Print("1, 2, or 3");
}

// O manejar cada caso explicitamente:
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

> **Nota:** `break` es tecnicamente opcional en Enforce Script ya que no hay fall-through, pero es convencional incluirlo.

---

### 14. Sin Expresiones en Parametros Predeterminados

**Lo que escribirias:**
```c
void Spawn(vector pos = GetDefaultPos())    // Expresion como predeterminado
void Spawn(vector pos = Vector(0, 100, 0))  // Constructor como predeterminado
```

**Lo que ocurre:** Error de compilacion. Los valores predeterminados de parametros deben ser **literales** o `NULL`.

**Solucion correcta:**
```c
void Spawn(vector pos = "0 100 0")    // Literal de string para vector --- OK
void Spawn(int count = 5)             // Literal entero --- OK
void Spawn(float radius = 10.0)      // Literal float --- OK
void Spawn(string name = "default")   // Literal de string --- OK
void Spawn(Object obj = NULL)         // NULL --- OK

// Para predeterminados complejos, usa sobrecargas:
void Spawn()
{
    Spawn(GetDefaultPos());  // Llama a la version con parametros
}

void Spawn(vector pos)
{
    // Implementacion real
}
```

---

### 15. JsonFileLoader.JsonLoadFile Retorna void

**Lo que escribirias:**
```c
MyConfig cfg = JsonFileLoader<MyConfig>.JsonLoadFile(path);
// o:
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg))
```

**Lo que ocurre:** Error de compilacion. `JsonLoadFile` retorna `void`, no el objeto cargado ni un bool.

**Solucion correcta:**
```c
MyConfig cfg = new MyConfig();  // Crear instancia primero con predeterminados
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // Llena cfg in-place
// cfg ahora contiene los valores cargados (o aun tiene predeterminados si el archivo era invalido)
```

> **Nota:** El metodo mas nuevo `JsonFileLoader<T>.LoadFile()` retorna `bool`, pero `JsonLoadFile` (la version comunmente vista) no.

---

### 16. Sin Sustitucion de Valores con #define

**Lo que escribirias:**
```c
#define MAX_PLAYERS 60
#define VERSION_STRING "1.0.0"
int max = MAX_PLAYERS;
```

**Lo que ocurre:** Error de compilacion. El `#define` de Enforce Script solo crea flags de existencia para verificaciones `#ifdef`. No soporta sustitucion de valores.

**Solucion correcta:**
```c
// Usa const para valores
const int MAX_PLAYERS = 60;
const string VERSION_STRING = "1.0.0";

// Usa #define solo para flags de compilacion condicional
#define MY_MOD_ENABLED
```

---

### 17. Sin Interfaces / Clases Abstractas (Forzado)

**Lo que escribirias:**
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

**Lo que ocurre:** Las palabras clave `interface` y `abstract` no existen.

**Solucion correcta:** Usa clases regulares con metodos base vacios:
```c
// "Interface" --- clase base con metodos vacios
class ISerializable
{
    void Serialize() {}     // Sobreescribir en subclase
    void Deserialize() {}   // Sobreescribir en subclase
}

// Clase "abstracta" --- mismo patron
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
        // Implementacion real
    }
}
```

El compilador NO fuerza que las subclases sobreescriban los metodos base. Olvidar sobreescribir silenciosamente usa la implementacion base vacia.

---

### 18. Sin Restricciones de Generics

**Lo que escribirias:**
```c
class Container<T> where T : EntityAI  // Restringir T a EntityAI
```

**Lo que ocurre:** Error de compilacion. La clausula `where` no existe. Los parametros de template aceptan cualquier tipo.

**Solucion correcta:** Validar en tiempo de ejecucion:
```c
class EntityContainer<Class T>
{
    void Add(T item)
    {
        // Verificacion de tipo en runtime en lugar de restriccion en compilacion
        EntityAI eai;
        if (!Class.CastTo(eai, item))
        {
            ErrorEx("EntityContainer only accepts EntityAI subclasses");
            return;
        }
        // proceder
    }
}
```

---

### 19. Sin Validacion de Enum

**Lo que escribirias:**
```c
EDamageState state = (EDamageState)999;  // Esperar error o excepcion
```

**Lo que ocurre:** Sin error. Cualquier valor `int` se puede asignar a una variable enum, incluso valores fuera del rango definido.

**Solucion correcta:** Validar manualmente:
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
    EDamageState state = EDamageState.PRISTINE;  // valor de respaldo
}
```

---

### 20. Sin Parametros Variadicos

**Lo que escribirias:**
```c
void Log(string format, params object[] args)
void Printf(string fmt, ...)
```

**Lo que ocurre:** Error de compilacion. Los parametros variadicos no existen.

**Solucion correcta:** Usa `string.Format` con conteos de parametros fijos, o usa clases `Param`:
```c
// string.Format soporta hasta 9 argumentos posicionales
string msg = string.Format("Player %1 at %2 with %3 HP", name, pos, hp);

// Para datos de conteo variable, pasa un array
void LogMultiple(string tag, array<string> messages)
{
    foreach (string msg : messages)
    {
        Print("[" + tag + "] " + msg);
    }
}
```

---

### 21. Sin Declaraciones de Clases Anidadas

**Lo que escribirias:**
```c
class Outer
{
    class Inner  // Clase anidada
    {
        int value;
    }
}
```

**Lo que ocurre:** Error de compilacion. Las clases no pueden ser declaradas dentro de otras clases.

**Solucion correcta:** Declara todas las clases en el nivel superior, usa convenciones de nombres para mostrar relaciones:
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

### 22. Los Arrays Estaticos Son de Tamano Fijo

**Lo que escribirias:**
```c
int size = GetCount();
int arr[size];  // Tamano dinamico en runtime
```

**Lo que ocurre:** Error de compilacion. Los tamanos de arrays estaticos deben ser constantes en tiempo de compilacion.

**Solucion correcta:**
```c
// Usa un const para arrays estaticos
const int BUFFER_SIZE = 64;
int arr[BUFFER_SIZE];

// O usa arrays dinamicos para tamanos en runtime
array<int> arr = new array<int>;
arr.Resize(GetCount());
```

---

### 23. array.Remove Es Desordenado

**Lo que escribirias (esperando preservacion del orden):**
```c
array<string> items = {"A", "B", "C", "D"};
items.Remove(1);  // Esperar: {"A", "C", "D"}
```

**Lo que ocurre:** `Remove(index)` intercambia el elemento con el **ultimo** elemento, luego elimina el ultimo. Resultado: `{"A", "D", "C"}`. El orden NO se preserva.

**Solucion correcta:**
```c
// Usa RemoveOrdered para preservar el orden (mas lento --- desplaza elementos)
items.RemoveOrdered(1);  // {"A", "C", "D"} --- orden correcto

// Usa RemoveItem para buscar y eliminar por valor (tambien ordenado)
items.RemoveItem("B");   // {"A", "C", "D"}
```

---

### 24. Sin #include --- Todo via config.cpp

**Lo que escribirias:**
```c
#include "MyHelper.c"
#include "Utils/StringUtils.c"
```

**Lo que ocurre:** Sin efecto o error de compilacion. No existe la directiva `#include`.

**Solucion correcta:** Todos los archivos de script se cargan a traves de `config.cpp` en la entrada `CfgMods` del mod. El orden de carga de archivos esta determinado por la capa de script (`3_Game`, `4_World`, `5_Mission`) y el orden alfabetico dentro de cada capa.

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

### 25. Sin Namespaces

**Lo que escribirias:**
```c
namespace MyMod { class Config { } }
namespace MyMod.Utils { class StringHelper { } }
```

**Lo que ocurre:** Error de compilacion. La palabra clave `namespace` no existe. Todas las clases comparten un unico ambito global.

**Solucion correcta:** Usa prefijos de nombres para evitar conflictos:
```c
class MyConfig { }          // MyFramework
class MyAI_Config { }       // MyAI Mod
class MyM_MissionData { }   // MyMissions Mod
class VPP_AdminConfig { }     // VPP Admin
```

---

### 26. Los Metodos de String Modifican In-Place

**Lo que escribirias (esperando un valor de retorno):**
```c
string upper = myString.ToUpper();  // Esperar: retorna nuevo string
```

**Lo que ocurre:** `ToUpper()` y `ToLower()` modifican el string **in place** y retornan `void`.

**Solucion correcta:**
```c
// Haz una copia primero si necesitas preservar el original
string original = "Hello World";
string upper = original;
upper.ToUpper();  // upper ahora es "HELLO WORLD", original sin cambios

// Igual para TrimInPlace
string trimmed = "  hello  ";
trimmed.TrimInPlace();  // "hello"
```

---

### 27. Los Ciclos de ref Causan Fugas de Memoria

**Lo que escribirias:**
```c
class Parent
{
    ref Child m_Child;
}
class Child
{
    ref Parent m_Parent;  // Ref circular --- ambos referencian al otro
}
```

**Lo que ocurre:** Ningun objeto es jamas recolectado por el garbage collector. Los conteos de referencia nunca llegan a cero porque cada uno tiene un `ref` al otro.

**Solucion correcta:** Un lado debe usar un puntero crudo (sin ref):
```c
class Parent
{
    ref Child m_Child;  // El padre POSEE al hijo (ref)
}
class Child
{
    Parent m_Parent;    // El hijo REFERENCIA al padre (crudo --- sin ref)
}
```

---

### 28. Sin Garantia de Destructor en Apagado del Servidor

**Lo que escribirias (esperando limpieza):**
```c
void ~MyManager()
{
    SaveData();  // Esperar que esto se ejecute al apagar
}
```

**Lo que ocurre:** El apagado del servidor puede matar el proceso antes de que los destructores se ejecuten. Tu guardado nunca ocurre.

**Solucion correcta:** Guarda proactivamente a intervalos regulares y en eventos de ciclo de vida conocidos:
```c
class MyManager
{
    void OnMissionFinish()  // Se llama antes del apagado
    {
        SaveData();  // Punto de guardado confiable
    }

    void OnUpdate(float dt)
    {
        m_SaveTimer += dt;
        if (m_SaveTimer > 300.0)  // Cada 5 minutos
        {
            SaveData();
            m_SaveTimer = 0;
        }
    }
}
```

---

### 29. Sin Gestion de Recursos Basada en Ambito (RAII)

**Lo que escribirias (en C++):**
```c
{
    FileHandle f = OpenFile("test.txt", FileMode.WRITE);
    // f se cierra automaticamente cuando el ambito termina
}
```

**Lo que ocurre:** Enforce Script no cierra handles de archivo cuando las variables salen del ambito (incluso con `autoptr`).

**Solucion correcta:** Siempre cierra recursos explicitamente:
```c
FileHandle fh = OpenFile("$profile:MyMod/data.txt", FileMode.WRITE);
if (fh != 0)
{
    FPrintln(fh, "data");
    CloseFile(fh);  // Debes cerrar manualmente!
}
```

---

### 30. GetGame().GetPlayer() Retorna null en el Servidor

**Lo que escribirias:**
```c
PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
player.DoSomething();  // CRASH en el servidor!
```

**Lo que ocurre:** `GetGame().GetPlayer()` retorna el jugador **local**. En un servidor dedicado, no hay jugador local --- retorna `null`.

**Solucion correcta:** En el servidor, itera la lista de jugadores:
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

## Viniendo de C++

Si eres desarrollador C++, aqui estan los ajustes mas grandes:

| Caracteristica C++ | Equivalente en Enforce Script |
|-------------|--------------------------|
| `std::vector` | `array<T>` |
| `std::map` | `map<K,V>` |
| `std::unique_ptr` | `ref` / `autoptr` |
| `dynamic_cast<T*>` | `Class.CastTo()` o `T.Cast()` |
| `try/catch` | Clausulas de guarda |
| `operator+` | Metodos con nombre (`Add()`) |
| `namespace` | Prefijos de nombre (`My`, `VPP_`) |
| `#include` | config.cpp `files[]` |
| RAII | Limpieza manual en metodos de ciclo de vida |
| Herencia multiple | Herencia simple + composicion |
| `nullptr` | `null` / `NULL` |
| Templates con restricciones | Templates sin restricciones + verificaciones en runtime |
| `do...while` | `while (true) { ... if (!cond) break; }` |

---

## Viniendo de C#

| Caracteristica C# | Equivalente en Enforce Script |
|-------------|--------------------------|
| `interface` | Clase base con metodos vacios |
| `abstract` | Clase base + ErrorEx en metodos base |
| `delegate` / `event` | `ScriptInvoker` |
| Lambda `=>` | Metodos con nombre |
| `?.` condicional de null | Verificaciones manuales de null |
| `??` coalescencia de null | `if (!x) x = default;` |
| `try/catch` | Clausulas de guarda |
| `using` (IDisposable) | Limpieza manual |
| Properties `{ get; set; }` | Campos publicos o metodos getter/setter explicitos |
| LINQ | Bucles manuales |
| `nameof()` | Strings hardcodeados |
| `async/await` | CallLater / timers |

---

## Viniendo de Java

| Caracteristica Java | Equivalente en Enforce Script |
|-------------|--------------------------|
| `interface` | Clase base con metodos vacios |
| `try/catch/finally` | Clausulas de guarda |
| Garbage collection | `ref` + conteo de referencias (sin GC para ciclos) |
| `@Override` | Palabra clave `override` |
| `instanceof` | `obj.IsInherited(typename)` |
| `package` | Prefijos de nombre |
| `import` | config.cpp `files[]` |
| `enum` con metodos | `enum` (solo int) + clase auxiliar |
| `final` | `const` (solo para variables) |
| Annotations | No disponibles |

---

## Viniendo de Python

| Caracteristica Python | Equivalente en Enforce Script |
|-------------|--------------------------|
| Tipado dinamico | Tipado estatico (todas las variables tipadas) |
| `try/except` | Clausulas de guarda |
| `lambda` | Metodos con nombre |
| List comprehension | Bucles manuales |
| `**kwargs` / `*args` | Parametros fijos |
| Duck typing | `IsInherited()` / `Class.CastTo()` |
| `__init__` | Constructor (mismo nombre que la clase) |
| `__del__` | Destructor (`~ClassName()`) |
| `import` | config.cpp `files[]` |
| Herencia multiple | Herencia simple + composicion |
| `None` | `null` / `NULL` |
| Bloques por indentacion | Llaves `{ }` |
| f-strings | `string.Format("text %1 %2", a, b)` |

---

## Tabla de Referencia Rapida

| Caracteristica | Existe? | Alternativa |
|---------|---------|------------|
| Ternario `? :` | No | if/else |
| `do...while` | No | while + break |
| `try/catch` | No | Clausulas de guarda |
| Herencia multiple | No | Composicion |
| Sobrecarga de operadores | Solo index | Metodos con nombre |
| Lambdas | No | Metodos con nombre |
| Delegates | No | `ScriptInvoker` |
| `\\` / `\"` en strings | Roto | Evitalos |
| Redeclaracion de variables | Roto en else-if | Nombres unicos o declarar antes del if |
| `Object.IsAlive()` | No en Object base | Castear a `EntityAI` primero |
| `nullptr` | No | `null` / `NULL` |
| Fall-through en switch | No | Cada case es independiente |
| Expresiones en parametros predeterminados | No | Solo literales o NULL |
| Valores en `#define` | No | `const` |
| Interfaces | No | Clase base vacia |
| Restricciones de generics | No | Verificaciones de tipo en runtime |
| Validacion de enum | No | Verificacion manual de rango |
| Parametros variadicos | No | `string.Format` o arrays |
| Clases anidadas | No | Nivel superior con nombres prefijados |
| Arrays estaticos de tamano variable | No | `array<T>` |
| `#include` | No | config.cpp `files[]` |
| Namespaces | No | Prefijos de nombre |
| RAII | No | Limpieza manual |
| `GetGame().GetPlayer()` en servidor | Retorna null | Iterar `GetPlayers()` |

---

## Navegacion

| Anterior | Arriba | Siguiente |
|----------|----|------|
| [1.11 Manejo de Errores](11-error-handling.md) | [Parte 1: Enforce Script](../README.md) | [Parte 2: Estructura de Mods](../02-mod-structure/01-five-layers.md) |
