# Capitulo 1.1: Variables y Tipos

[Inicio](../README.md) | **Variables y Tipos** | [Siguiente: Arrays, Maps & Sets >>](02-arrays-maps-sets.md)

---

## Introduccion

Enforce Script es el lenguaje de scripting del motor Enfusion, utilizado por DayZ Standalone. Es un lenguaje orientado a objetos con sintaxis similar a C, parecido a C# en muchos aspectos pero con su propio conjunto de tipos, reglas y limitaciones. Si tienes experiencia con C#, Java o C++, te sentiras comodo rapidamente --- pero presta mucha atencion a las diferencias, porque los puntos donde Enforce Script difiere de esos lenguajes son exactamente los lugares donde se esconden los bugs.

Este capitulo cubre los bloques fundamentales: tipos primitivos, como declarar e inicializar variables, y como funciona la conversion de tipos. Cada linea de codigo de un mod de DayZ comienza aqui.

---

## Tipos Primitivos

Enforce Script tiene un conjunto pequeno y fijo de tipos primitivos. No puedes definir nuevos tipos de valor --- solo clases (cubiertas en el [Capitulo 1.3](03-classes-inheritance.md)).

| Tipo | Tamano | Valor Predeterminado | Descripcion |
|------|------|---------------|-------------|
| `int` | 32 bits con signo | `0` | Numeros enteros de -2,147,483,648 a 2,147,483,647 |
| `float` | 32 bits IEEE 754 | `0.0` | Numeros de punto flotante |
| `bool` | 1 bit logico | `false` | `true` o `false` |
| `string` | Variable | `""` (vacio) | Texto. Tipo de valor inmutable --- se pasa por valor, no por referencia |
| `vector` | 3x float | `"0 0 0"` | Tres componentes float (x, y, z). Se pasa por valor |
| `typename` | Ref del motor | `null` | Una referencia al tipo en si, usada para reflexion |
| `void` | N/A | N/A | Se usa solo como tipo de retorno para indicar "no retorna nada" |

### Constantes de Tipos

```mermaid
graph TD
    subgraph "Value Types (passed by copy)"
        INT[int<br/>32-bit signed]
        FLOAT[float<br/>32-bit IEEE 754]
        BOOL[bool<br/>true / false]
        STRING[string<br/>immutable text]
        VECTOR[vector<br/>3x float xyz]
    end

    subgraph "Reference Types (passed by reference)"
        CLASS[Class<br/>root of all ref types]
        MANAGED[Managed<br/>no engine ref-counting]
        TYPENAME[typename<br/>type reflection]
    end

    CLASS --> MANAGED
    CLASS --> ENTITYAI[EntityAI]
    ENTITYAI --> ITEMBASE[ItemBase]
    ENTITYAI --> MANBASE[ManBase / PlayerBase]
    MANAGED --> SCRIPTHANDLER[ScriptedWidgetEventHandler]
    MANAGED --> CUSTOMCLASS[Your Custom Classes]

    style INT fill:#4A90D9,color:#fff
    style FLOAT fill:#4A90D9,color:#fff
    style BOOL fill:#4A90D9,color:#fff
    style STRING fill:#4A90D9,color:#fff
    style VECTOR fill:#4A90D9,color:#fff
    style CLASS fill:#D94A4A,color:#fff
    style MANAGED fill:#D97A4A,color:#fff
```

Varios tipos exponen constantes utiles:

```c
// limites de int
int maxInt = int.MAX;    // 2147483647
int minInt = int.MIN;    // -2147483648

// limites de float
float smallest = float.MIN;     // float positivo mas pequeno (~1.175e-38)
float largest  = float.MAX;     // float mas grande (~3.403e+38)
float lowest   = float.LOWEST;  // float mas negativo (-3.403e+38)
```

---

## Declaracion de Variables

Las variables se declaran escribiendo el tipo seguido del nombre. Puedes declarar y asignar en una sola instruccion o por separado.

```c
void MyFunction()
{
    // Solo declaracion (inicializado al valor predeterminado)
    int health;          // health == 0
    float speed;         // speed == 0.0
    bool isAlive;        // isAlive == false
    string name;         // name == ""

    // Declaracion con inicializacion
    int maxPlayers = 60;
    float gravity = 9.81;
    bool debugMode = true;
    string serverName = "My DayZ Server";
}
```

### La Palabra Clave `auto`

Cuando el tipo es obvio por el lado derecho, puedes usar `auto` para que el compilador lo infiera:

```c
void Example()
{
    auto count = 10;           // int
    auto ratio = 0.75;         // float
    auto label = "Hello";      // string
    auto player = GetGame().GetPlayer();  // DayZPlayer (o lo que sea que retorne GetPlayer)
}
```

Esto es puramente una conveniencia --- el compilador resuelve el tipo en tiempo de compilacion. No hay diferencia de rendimiento.

### Constantes

Usa la palabra clave `const` para valores que nunca deben cambiar despues de la inicializacion:

```c
const int MAX_SQUAD_SIZE = 8;
const float SPAWN_RADIUS = 150.0;
const string MOD_PREFIX = "[MyMod]";

void Example()
{
    int a = MAX_SQUAD_SIZE;  // OK: leyendo una constante
    MAX_SQUAD_SIZE = 10;     // ERROR: no se puede asignar a una constante
}
```

Las constantes se declaran tipicamente en el ambito del archivo (fuera de cualquier funcion) o como miembros de clase. Convencion de nombres: `UPPER_SNAKE_CASE`.

---

## Trabajando con `int`

Los enteros son el tipo de trabajo pesado. DayZ los usa para conteos de items, IDs de jugadores, valores de salud (cuando se discretizan), valores de enum, bitflags, y mas.

```c
void IntExamples()
{
    int count = 5;
    int total = count + 10;     // 15
    int doubled = count * 2;    // 10
    int remainder = 17 % 5;     // 2 (modulo)

    // Incremento y decremento
    count++;    // count ahora es 6
    count--;    // count ahora es 5 de nuevo

    // Asignacion compuesta
    count += 3;  // count ahora es 8
    count -= 2;  // count ahora es 6
    count *= 4;  // count ahora es 24
    count /= 6;  // count ahora es 4

    // La division entera trunca (sin redondeo)
    int result = 7 / 2;    // result == 3, no 3.5

    // Operaciones bitwise (usadas para flags)
    int flags = 0;
    flags = flags | 0x01;   // activar bit 0
    flags = flags | 0x04;   // activar bit 2
    bool hasBit0 = (flags & 0x01) != 0;  // true
}
```

### Ejemplo del Mundo Real: Conteo de Jugadores

```c
void PrintPlayerCount()
{
    array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);
    int count = players.Count();
    Print(string.Format("Players online: %1", count));
}
```

---

## Trabajando con `float`

Los floats representan numeros decimales. DayZ los usa extensivamente para posiciones, distancias, porcentajes de salud, valores de dano y temporizadores.

```c
void FloatExamples()
{
    float health = 100.0;
    float damage = 25.5;
    float remaining = health - damage;   // 74.5

    // Especifico de DayZ: multiplicador de dano
    float headMultiplier = 3.0;
    float actualDamage = damage * headMultiplier;  // 76.5

    // La division float da resultados decimales
    float ratio = 7.0 / 2.0;   // 3.5

    // Matematicas utiles
    float dist = 150.7;
    float rounded = Math.Round(dist);    // 151
    float floored = Math.Floor(dist);    // 150
    float ceiled  = Math.Ceil(dist);     // 151
    float clamped = Math.Clamp(dist, 0.0, 100.0);  // 100
}
```

### Ejemplo del Mundo Real: Verificacion de Distancia

```c
bool IsPlayerNearby(PlayerBase player, vector targetPos, float radius)
{
    if (!player)
        return false;

    vector playerPos = player.GetPosition();
    float distance = vector.Distance(playerPos, targetPos);
    return distance <= radius;
}
```

---

## Trabajando con `bool`

Los booleanos contienen `true` o `false`. Se usan en condiciones, flags y seguimiento de estado.

```c
void BoolExamples()
{
    bool isAdmin = true;
    bool isBanned = false;

    // Operadores logicos
    bool canPlay = isAdmin || !isBanned;    // true (OR, NOT)
    bool isSpecial = isAdmin && !isBanned;  // true (AND)

    // Negacion
    bool notAdmin = !isAdmin;   // false

    // Los resultados de comparacion son bool
    int health = 50;
    bool isLow = health < 25;       // false
    bool isHurt = health < 100;     // true
    bool isDead = health == 0;      // false
    bool isAlive = health != 0;     // true
}
```

### Veracidad en Condiciones

En Enforce Script, puedes usar valores no booleanos en condiciones. Los siguientes se consideran `false`:
- `0` (int)
- `0.0` (float)
- `""` (string vacio)
- `null` (referencia de objeto nula)

Todo lo demas es `true`. Esto se usa comunmente para verificaciones de null:

```c
void SafeCheck(PlayerBase player)
{
    // Estas dos son equivalentes:
    if (player != null)
        Print("Player exists");

    if (player)
        Print("Player exists");

    // Y estas dos:
    if (player == null)
        Print("No player");

    if (!player)
        Print("No player");
}
```

---

## Trabajando con `string`

Los strings en Enforce Script son **tipos de valor** --- se copian cuando se asignan o se pasan a funciones, igual que `int` o `float`. Esto es diferente de C# o Java donde los strings son tipos de referencia.

```c
void StringExamples()
{
    string greeting = "Hello";
    string name = "Survivor";

    // Concatenacion con +
    string message = greeting + ", " + name + "!";  // "Hello, Survivor!"

    // Formateo de strings (placeholders con indice desde 1)
    string formatted = string.Format("Player %1 has %2 health", name, 75);
    // Resultado: "Player Survivor has 75 health"

    // Longitud
    int len = message.Length();    // 17

    // Comparacion
    bool same = (greeting == "Hello");  // true

    // Conversion desde otros tipos
    string fromInt = "Score: " + 42;     // NO funciona -- debes convertir explicitamente
    string correct = "Score: " + 42.ToString();  // "Score: 42"

    // Usar Format es el enfoque preferido
    string best = string.Format("Score: %1", 42);  // "Score: 42"
}
```

### Secuencias de Escape

Los strings soportan secuencias de escape estandar:

| Secuencia | Significado |
|----------|---------|
| `\n` | Nueva linea |
| `\r` | Retorno de carro |
| `\t` | Tabulacion |
| `\\` | Barra invertida literal |
| `\"` | Comilla doble literal |

**Advertencia:** Aunque estan documentadas, la barra invertida (`\\`) y las comillas escapadas (`\"`) son conocidas por causar problemas con el CParser en algunos contextos, especialmente en operaciones relacionadas con JSON. Cuando trabajes con rutas de archivos o strings JSON, evita las barras invertidas cuando sea posible. Usa barras normales para las rutas --- DayZ las acepta en todas las plataformas.

### Ejemplo del Mundo Real: Mensaje de Chat

```c
void SendAdminMessage(string adminName, string text)
{
    string msg = string.Format("[ADMIN] %1: %2", adminName, text);
    Print(msg);
}
```

---

## Trabajando con `vector`

El tipo `vector` contiene tres componentes `float` (x, y, z). Es el tipo fundamental de DayZ para posiciones, direcciones, rotaciones y velocidades. Como los strings y los primitivos, los vectores son **tipos de valor** --- se copian al asignarse.

### Inicializacion

Los vectores se pueden inicializar de dos formas:

```c
void VectorInit()
{
    // Metodo 1: Inicializacion por string (tres numeros separados por espacios)
    vector pos1 = "100.5 0 200.3";

    // Metodo 2: Funcion constructora Vector()
    vector pos2 = Vector(100.5, 0, 200.3);

    // El valor predeterminado es "0 0 0"
    vector empty;   // empty == <0, 0, 0>
}
```

**Importante:** El formato de inicializacion por string usa **espacios** como separadores, no comas. `"1 2 3"` es valido; `"1,2,3"` no lo es.

### Acceso a Componentes

Accede a componentes individuales usando indexacion estilo array:

```c
void VectorComponents()
{
    vector pos = Vector(100.5, 25.0, 200.3);

    // Lectura de componentes
    float x = pos[0];   // 100.5  (Este/Oeste)
    float y = pos[1];   // 25.0   (Arriba/Abajo, altitud)
    float z = pos[2];   // 200.3  (Norte/Sur)

    // Escritura de componentes
    pos[1] = 50.0;      // Cambiar altitud a 50
}
```

Sistema de coordenadas de DayZ:
- `[0]` = X = Este(+) / Oeste(-)
- `[1]` = Y = Arriba(+) / Abajo(-) (altitud sobre el nivel del mar)
- `[2]` = Z = Norte(+) / Sur(-)

### Constantes Estaticas

```c
vector zero    = vector.Zero;      // "0 0 0"
vector up      = vector.Up;        // "0 1 0"
vector right   = vector.Aside;     // "1 0 0"
vector forward = vector.Forward;   // "0 0 1"
```

### Operaciones Comunes con Vectores

```c
void VectorOps()
{
    vector pos1 = Vector(100, 0, 200);
    vector pos2 = Vector(150, 0, 250);

    // Distancia entre dos puntos
    float dist = vector.Distance(pos1, pos2);

    // Distancia al cuadrado (mas rapida, buena para comparaciones)
    float distSq = vector.DistanceSq(pos1, pos2);

    // Direccion de pos1 a pos2
    vector dir = vector.Direction(pos1, pos2);

    // Normalizar un vector (hacer que la longitud sea 1)
    vector norm = dir.Normalized();

    // Longitud de un vector
    float len = dir.Length();

    // Interpolacion lineal (50% entre pos1 y pos2)
    vector midpoint = vector.Lerp(pos1, pos2, 0.5);

    // Producto punto
    float dot = vector.Dot(dir, vector.Up);
}
```

### Ejemplo del Mundo Real: Posicion de Spawn

```c
// Obtener una posicion en el suelo en coordenadas X,Z dadas
vector GetGroundPosition(float x, float z)
{
    vector pos = Vector(x, 0, z);
    pos[1] = GetGame().SurfaceY(x, z);  // Establecer Y a la altura del terreno
    return pos;
}

// Obtener una posicion aleatoria dentro de un radio desde un punto central
vector GetRandomPositionAround(vector center, float radius)
{
    float angle = Math.RandomFloat(0, Math.PI2);
    float dist = Math.RandomFloat(0, radius);

    vector offset = Vector(Math.Cos(angle) * dist, 0, Math.Sin(angle) * dist);
    vector pos = center + offset;
    pos[1] = GetGame().SurfaceY(pos[0], pos[2]);
    return pos;
}
```

---

## Trabajando con `typename`

El tipo `typename` contiene una referencia a un tipo en si. Se usa para reflexion --- inspeccionar y trabajar con tipos en tiempo de ejecucion. Lo encontraras al escribir sistemas genericos, cargadores de configuracion y patrones factory.

```c
void TypenameExamples()
{
    // Obtener el typename de una clase
    typename t = PlayerBase;

    // Obtener typename desde un string
    typename t2 = t.StringToEnum(PlayerBase, "PlayerBase");

    // Comparar tipos
    if (t == PlayerBase)
        Print("It's PlayerBase!");

    // Obtener el typename de una instancia de objeto
    PlayerBase player;
    // ... asumiendo que player es valido ...
    typename objType = player.Type();

    // Verificar herencia
    bool isMan = objType.IsInherited(Man);

    // Convertir typename a string
    string name = t.ToString();  // "PlayerBase"

    // Crear una instancia desde typename (patron factory)
    Class instance = t.Spawn();
}
```

### Conversion de Enum con typename

```c
enum DamageType
{
    MELEE = 0,
    BULLET = 1,
    EXPLOSION = 2
};

void EnumConvert()
{
    // Enum a string
    string name = typename.EnumToString(DamageType, DamageType.BULLET);
    // name == "BULLET"

    // String a enum
    int value;
    typename.StringToEnum(DamageType, "EXPLOSION", value);
    // value == 2
}
```

---

## Conversion de Tipos

Enforce Script soporta conversiones tanto implicitas como explicitas entre tipos.

### Conversiones Implicitas

Algunas conversiones ocurren automaticamente:

```c
void ImplicitConversions()
{
    // int a float (siempre seguro, sin perdida de datos)
    int count = 42;
    float fCount = count;    // 42.0

    // float a int (TRUNCA, no redondea!)
    float precise = 3.99;
    int truncated = precise;  // 3, NO 4

    // int/float a bool
    bool fromInt = 5;      // true (distinto de cero)
    bool fromZero = 0;     // false
    bool fromFloat = 0.1;  // true (distinto de cero)

    // bool a int
    int fromBool = true;   // 1
    int fromFalse = false; // 0
}
```

### Conversiones Explicitas (Parsing)

Para convertir entre strings y tipos numericos, usa metodos de parsing:

```c
void ExplicitConversions()
{
    // String a int
    int num = "42".ToInt();           // 42
    int bad = "hello".ToInt();        // 0 (falla silenciosamente)

    // String a float
    float f = "3.14".ToFloat();       // 3.14

    // String a vector
    vector v = "100 25 200".ToVector();  // <100, 25, 200>

    // Numero a string (usando Format)
    string s1 = string.Format("%1", 42);       // "42"
    string s2 = string.Format("%1", 3.14);     // "3.14"

    // int/float .ToString()
    string s3 = (42).ToString();     // "42"
}
```

### Casteo de Objetos

Para tipos de clase, usa `Class.CastTo()` o `ClassName.Cast()`. Esto se cubre en detalle en el [Capitulo 1.3](03-classes-inheritance.md), pero aqui esta el patron esencial:

```c
void CastExample()
{
    Object obj = GetSomeObject();

    // Casteo seguro (preferido)
    PlayerBase player;
    if (Class.CastTo(player, obj))
    {
        // player es valido y seguro de usar
        string name = player.GetIdentity().GetName();
    }

    // Sintaxis de casteo alternativa
    PlayerBase player2 = PlayerBase.Cast(obj);
    if (player2)
    {
        // player2 es valido
    }
}
```

---

## Ambito de Variables

Las variables existen solo dentro del bloque de codigo (llaves) donde se declaran. Enforce Script **no** permite redeclarar un nombre de variable dentro de ambitos anidados o hermanos.

```c
void ScopeExample()
{
    int x = 10;

    if (true)
    {
        // int x = 20;  // ERROR: redeclaracion de 'x' en ambito anidado
        x = 20;         // OK: modificando el x externo
        int y = 30;     // OK: nueva variable en este ambito
    }

    // y NO es accesible aqui (declarada en ambito interno)
    // Print(y);  // ERROR: identificador no declarado 'y'

    // IMPORTANTE: esto tambien aplica a los bucles for
    for (int i = 0; i < 5; i++)
    {
        // i existe aqui
    }
    // for (int i = 0; i < 3; i++)  // ERROR en DayZ: 'i' ya declarada
    // Usa un nombre diferente:
    for (int j = 0; j < 3; j++)
    {
        // j existe aqui
    }
}
```

### La Trampa del Ambito Hermano

Esta es una de las peculiaridades mas notorias de Enforce Script. Declarar el mismo nombre de variable en bloques `if` y `else` causa un error de compilacion:

```c
void SiblingTrap()
{
    if (someCondition)
    {
        int result = 10;    // Declarada aqui
        Print(result);
    }
    else
    {
        // int result = 20; // ERROR: declaracion multiple de 'result'
        // Aunque este es un ambito hermano, no el mismo ambito
    }

    // SOLUCION: declarar antes del if/else
    int result;
    if (someCondition)
    {
        result = 10;
    }
    else
    {
        result = 20;
    }
}
```

---

## Errores Comunes

### 1. Variables No Inicializadas Usadas en Logica

Los primitivos obtienen valores predeterminados (`0`, `0.0`, `false`, `""`), pero depender de esto hace que el codigo sea fragil y dificil de leer. Siempre inicializa explicitamente.

```c
// MAL: dependiendo del cero implicito
int count;
if (count > 0)  // Esto funciona porque count == 0, pero la intencion no es clara
    DoThing();

// BIEN: inicializacion explicita
int count = 0;
if (count > 0)
    DoThing();
```

### 2. Truncamiento de Float a Int

La conversion de float a int trunca (redondea hacia cero), no redondea al mas cercano:

```c
float f = 3.99;
int i = f;         // i == 3, NO 4

// Si quieres redondeo:
int rounded = Math.Round(f);  // 4
```

### 3. Precision de Float en Comparaciones

Nunca compares floats por igualdad exacta:

```c
float a = 0.1 + 0.2;
// MAL: puede fallar por la representacion de punto flotante
if (a == 0.3)
    Print("Equal");

// BIEN: usa una tolerancia (epsilon)
if (Math.AbsFloat(a - 0.3) < 0.001)
    Print("Close enough");
```

### 4. Concatenacion de Strings con Numeros

No puedes simplemente concatenar un numero a un string con `+`. Usa `string.Format()`:

```c
int kills = 5;
// Potencialmente problematico:
// string msg = "Kills: " + kills;

// CORRECTO: usa Format
string msg = string.Format("Kills: %1", kills);
```

### 5. Formato de String de Vector

La inicializacion de vector por string requiere espacios, no comas:

```c
vector good = "100 25 200";     // CORRECTO
// vector bad = "100, 25, 200"; // INCORRECTO: las comas no se parsean correctamente
// vector bad2 = "100,25,200";  // INCORRECTO
```

### 6. Olvidar que los Strings y Vectores son Tipos de Valor

A diferencia de los objetos de clase, los strings y vectores se copian al asignar. Modificar una copia no afecta al original:

```c
vector posA = "10 20 30";
vector posB = posA;       // posB es una COPIA
posB[1] = 99;             // Solo posB cambia
// posA sigue siendo "10 20 30"
```

---

## Ejercicios Practicos

### Ejercicio 1: Basicos de Variables
Declara variables para almacenar:
- El nombre de un jugador (string)
- Su porcentaje de salud (float, 0-100)
- Su conteo de kills (int)
- Si es admin (bool)
- Su posicion en el mundo (vector)

Imprime un resumen formateado usando `string.Format()`.

### Ejercicio 2: Convertidor de Temperatura
Escribe una funcion `float CelsiusToFahrenheit(float celsius)` y su inversa `float FahrenheitToCelsius(float fahrenheit)`. Prueba con el punto de ebullicion (100C = 212F) y el punto de congelacion (0C = 32F).

### Ejercicio 3: Calculadora de Distancia
Escribe una funcion que tome dos vectores y retorne:
- La distancia 3D entre ellos
- La distancia 2D (ignorando la altura/eje Y)
- La diferencia de altura

Pista: Para la distancia 2D, crea nuevos vectores con `[1]` establecido en `0` antes de calcular la distancia.

### Ejercicio 4: Malabarismo de Tipos
Dado el string `"42"`, conviertelo a:
1. Un `int`
2. Un `float`
3. De vuelta a un `string` usando `string.Format()`
4. Un `bool` (deberia ser `true` ya que el valor int es distinto de cero)

### Ejercicio 5: Posicion en el Suelo
Escribe una funcion `vector SnapToGround(vector pos)` que tome cualquier posicion y la retorne con el componente Y establecido a la altura del terreno en esa ubicacion X,Z. Usa `GetGame().SurfaceY()`.

---

## Resumen

| Concepto | Punto Clave |
|---------|-----------|
| Tipos | `int`, `float`, `bool`, `string`, `vector`, `typename`, `void` |
| Predeterminados | `0`, `0.0`, `false`, `""`, `"0 0 0"`, `null` |
| Constantes | Palabra clave `const`, convencion `UPPER_SNAKE_CASE` |
| Vectores | Inicializar con string `"x y z"` o `Vector(x,y,z)`, acceder con `[0]`, `[1]`, `[2]` |
| Ambito | Variables con ambito a bloques `{}`; sin redeclaracion en bloques anidados/hermanos |
| Conversion | `float` a `int` trunca; usa `.ToInt()`, `.ToFloat()`, `.ToVector()` para parseo de strings |
| Formateo | Siempre usa `string.Format()` para construir strings desde tipos mixtos |

---

[Inicio](../README.md) | **Variables y Tipos** | [Siguiente: Arrays, Maps & Sets >>](02-arrays-maps-sets.md)
