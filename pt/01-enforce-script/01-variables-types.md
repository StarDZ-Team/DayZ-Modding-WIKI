# Chapter 1.1: Variables & Types

[Home](../README.md) | **Variables & Types** | [Next: Arrays, Maps & Sets >>](02-arrays-maps-sets.md)

---

## Introdução

Enforce Script é a linguagem de script do motor Enfusion, utilizada pelo DayZ Standalone. É uma linguagem orientada a objetos com sintaxe parecida com C, similar ao C# em vários aspectos, mas com seu próprio conjunto de tipos, regras e limitações. Se você tem experiência com C#, Java ou C++, vai se sentir em casa rapidamente --- mas preste bastante atenção nas diferenças, porque os pontos onde Enforce Script diverge dessas linguagens são exatamente onde os bugs se escondem.

Este capítulo cobre os blocos fundamentais: tipos primitivos, como declarar e inicializar variáveis, e como a conversão de tipos funciona. Toda linha de código de mod para DayZ começa aqui.

---

## Tipos Primitivos

Enforce Script tem um conjunto pequeno e fixo de tipos primitivos. Você não pode definir novos tipos de valor --- apenas classes (abordado no [Capítulo 1.3](03-classes-inheritance.md)).

| Tipo | Tamanho | Valor Padrão | Descrição |
|------|---------|--------------|-----------|
| `int` | 32-bit com sinal | `0` | Números inteiros de -2.147.483.648 a 2.147.483.647 |
| `float` | 32-bit IEEE 754 | `0.0` | Números de ponto flutuante |
| `bool` | 1 bit lógico | `false` | `true` ou `false` |
| `string` | Variável | `""` (vazio) | Texto. Tipo de valor imutável --- passado por valor, não por referência |
| `vector` | 3x float | `"0 0 0"` | Três componentes float (x, y, z). Passado por valor |
| `typename` | Referência do engine | `null` | Uma referência ao tipo em si, usado para reflexão |
| `void` | N/A | N/A | Usado apenas como tipo de retorno para indicar "não retorna nada" |

### Constantes de Tipo

Vários tipos expõem constantes úteis:

```c
// int bounds
int maxInt = int.MAX;    // 2147483647
int minInt = int.MIN;    // -2147483648

// float bounds
float smallest = float.MIN;     // smallest positive float (~1.175e-38)
float largest  = float.MAX;     // largest float (~3.403e+38)
float lowest   = float.LOWEST;  // most negative float (-3.403e+38)
```

---

## Declarando Variáveis

Variáveis são declaradas escrevendo o tipo seguido do nome. Você pode declarar e atribuir na mesma instrução ou separadamente.

```c
void MyFunction()
{
    // Declaration only (initialized to default value)
    int health;          // health == 0
    float speed;         // speed == 0.0
    bool isAlive;        // isAlive == false
    string name;         // name == ""

    // Declaration with initialization
    int maxPlayers = 60;
    float gravity = 9.81;
    bool debugMode = true;
    string serverName = "My DayZ Server";
}
```

### A Palavra-chave `auto`

Quando o tipo é óbvio pelo lado direito, você pode usar `auto` para deixar o compilador inferir:

```c
void Example()
{
    auto count = 10;           // int
    auto ratio = 0.75;         // float
    auto label = "Hello";      // string
    auto player = GetGame().GetPlayer();  // DayZPlayer (or whatever GetPlayer returns)
}
```

Isso é puramente uma conveniência --- o compilador resolve o tipo em tempo de compilação. Não há diferença de performance.

### Constantes

Use a palavra-chave `const` para valores que nunca devem mudar após a inicialização:

```c
const int MAX_SQUAD_SIZE = 8;
const float SPAWN_RADIUS = 150.0;
const string MOD_PREFIX = "[MyMod]";

void Example()
{
    int a = MAX_SQUAD_SIZE;  // OK: reading a constant
    MAX_SQUAD_SIZE = 10;     // ERROR: cannot assign to a constant
}
```

Constantes são tipicamente declaradas no escopo do arquivo (fora de qualquer função) ou como membros de classe. Convenção de nomenclatura: `UPPER_SNAKE_CASE`.

---

## Trabalhando com `int`

Inteiros são o tipo mais usado. DayZ os utiliza para contagem de itens, IDs de jogadores, valores de saúde (quando discretizados), valores de enum, bitflags, e mais.

```c
void IntExamples()
{
    int count = 5;
    int total = count + 10;     // 15
    int doubled = count * 2;    // 10
    int remainder = 17 % 5;     // 2 (modulo)

    // Increment and decrement
    count++;    // count is now 6
    count--;    // count is now 5 again

    // Compound assignment
    count += 3;  // count is now 8
    count -= 2;  // count is now 6
    count *= 4;  // count is now 24
    count /= 6;  // count is now 4

    // Integer division truncates (no rounding)
    int result = 7 / 2;    // result == 3, not 3.5

    // Bitwise operations (used for flags)
    int flags = 0;
    flags = flags | 0x01;   // set bit 0
    flags = flags | 0x04;   // set bit 2
    bool hasBit0 = (flags & 0x01) != 0;  // true
}
```

### Exemplo Real: Contagem de Jogadores

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

## Trabalhando com `float`

Floats representam números decimais. DayZ os usa extensivamente para posições, distâncias, porcentagens de saúde, valores de dano e timers.

```c
void FloatExamples()
{
    float health = 100.0;
    float damage = 25.5;
    float remaining = health - damage;   // 74.5

    // DayZ-specific: damage multiplier
    float headMultiplier = 3.0;
    float actualDamage = damage * headMultiplier;  // 76.5

    // Float division gives decimal results
    float ratio = 7.0 / 2.0;   // 3.5

    // Useful math
    float dist = 150.7;
    float rounded = Math.Round(dist);    // 151
    float floored = Math.Floor(dist);    // 150
    float ceiled  = Math.Ceil(dist);     // 151
    float clamped = Math.Clamp(dist, 0.0, 100.0);  // 100
}
```

### Exemplo Real: Verificação de Distância

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

## Trabalhando com `bool`

Booleanos guardam `true` ou `false`. São usados em condições, flags e rastreamento de estado.

```c
void BoolExamples()
{
    bool isAdmin = true;
    bool isBanned = false;

    // Logical operators
    bool canPlay = isAdmin || !isBanned;    // true (OR, NOT)
    bool isSpecial = isAdmin && !isBanned;  // true (AND)

    // Negation
    bool notAdmin = !isAdmin;   // false

    // Comparison results are bool
    int health = 50;
    bool isLow = health < 25;       // false
    bool isHurt = health < 100;     // true
    bool isDead = health == 0;      // false
    bool isAlive = health != 0;     // true
}
```

### Truthiness em Condições

Em Enforce Script, você pode usar valores não-bool em condições. Os seguintes são considerados `false`:
- `0` (int)
- `0.0` (float)
- `""` (string vazia)
- `null` (referência de objeto nula)

Todo o resto é `true`. Isso é comumente usado para verificações de null:

```c
void SafeCheck(PlayerBase player)
{
    // These two are equivalent:
    if (player != null)
        Print("Player exists");

    if (player)
        Print("Player exists");

    // And these two:
    if (player == null)
        Print("No player");

    if (!player)
        Print("No player");
}
```

---

## Trabalhando com `string`

Strings em Enforce Script são **tipos de valor** --- são copiadas quando atribuídas ou passadas para funções, assim como `int` ou `float`. Isso é diferente do C# ou Java onde strings são tipos de referência.

```c
void StringExamples()
{
    string greeting = "Hello";
    string name = "Survivor";

    // Concatenation with +
    string message = greeting + ", " + name + "!";  // "Hello, Survivor!"

    // String formatting (1-indexed placeholders)
    string formatted = string.Format("Player %1 has %2 health", name, 75);
    // Result: "Player Survivor has 75 health"

    // Length
    int len = message.Length();    // 17

    // Comparison
    bool same = (greeting == "Hello");  // true

    // Conversion from other types
    string fromInt = "Score: " + 42;     // does NOT work -- must convert explicitly
    string correct = "Score: " + 42.ToString();  // "Score: 42"

    // Using Format is the preferred approach
    string best = string.Format("Score: %1", 42);  // "Score: 42"
}
```

### Sequências de Escape

Strings suportam sequências de escape padrão:

| Sequência | Significado |
|-----------|-------------|
| `\n` | Nova linha |
| `\r` | Retorno de carro |
| `\t` | Tabulação |
| `\\` | Barra invertida literal |
| `\"` | Aspas duplas literal |

**Aviso:** Embora documentadas, a barra invertida (`\\`) e aspas escapadas (`\"`) podem causar problemas com o CParser em alguns contextos, especialmente em operações relacionadas a JSON. Ao trabalhar com caminhos de arquivo ou strings JSON, evite barras invertidas quando possível. Use barras normais para caminhos --- DayZ as aceita em todas as plataformas.

### Exemplo Real: Mensagem de Chat

```c
void SendAdminMessage(string adminName, string text)
{
    string msg = string.Format("[ADMIN] %1: %2", adminName, text);
    Print(msg);
}
```

---

## Trabalhando com `vector`

O tipo `vector` armazena três componentes `float` (x, y, z). É o tipo fundamental do DayZ para posições, direções, rotações e velocidades. Assim como strings e primitivos, vectors são **tipos de valor** --- são copiados na atribuição.

### Inicialização

Vectors podem ser inicializados de duas formas:

```c
void VectorInit()
{
    // Method 1: String initialization (three space-separated numbers)
    vector pos1 = "100.5 0 200.3";

    // Method 2: Vector() constructor function
    vector pos2 = Vector(100.5, 0, 200.3);

    // Default value is "0 0 0"
    vector empty;   // empty == <0, 0, 0>
}
```

**Importante:** O formato de inicialização por string usa **espaços** como separadores, não vírgulas. `"1 2 3"` é válido; `"1,2,3"` não é.

### Acesso a Componentes

Acesse componentes individuais usando indexação estilo array:

```c
void VectorComponents()
{
    vector pos = Vector(100.5, 25.0, 200.3);

    // Reading components
    float x = pos[0];   // 100.5  (East/West)
    float y = pos[1];   // 25.0   (Up/Down, altitude)
    float z = pos[2];   // 200.3  (North/South)

    // Writing components
    pos[1] = 50.0;      // Change altitude to 50
}
```

Sistema de coordenadas do DayZ:
- `[0]` = X = Leste(+) / Oeste(-)
- `[1]` = Y = Cima(+) / Baixo(-) (altitude acima do nível do mar)
- `[2]` = Z = Norte(+) / Sul(-)

### Constantes Estáticas

```c
vector zero    = vector.Zero;      // "0 0 0"
vector up      = vector.Up;        // "0 1 0"
vector right   = vector.Aside;     // "1 0 0"
vector forward = vector.Forward;   // "0 0 1"
```

### Operações Comuns com Vector

```c
void VectorOps()
{
    vector pos1 = Vector(100, 0, 200);
    vector pos2 = Vector(150, 0, 250);

    // Distance between two points
    float dist = vector.Distance(pos1, pos2);

    // Squared distance (faster, good for comparisons)
    float distSq = vector.DistanceSq(pos1, pos2);

    // Direction from pos1 to pos2
    vector dir = vector.Direction(pos1, pos2);

    // Normalize a vector (make length = 1)
    vector norm = dir.Normalized();

    // Length of a vector
    float len = dir.Length();

    // Linear interpolation (50% between pos1 and pos2)
    vector midpoint = vector.Lerp(pos1, pos2, 0.5);

    // Dot product
    float dot = vector.Dot(dir, vector.Up);
}
```

### Exemplo Real: Posição de Spawn

```c
// Get a position on the ground at given X,Z coordinates
vector GetGroundPosition(float x, float z)
{
    vector pos = Vector(x, 0, z);
    pos[1] = GetGame().SurfaceY(x, z);  // Set Y to terrain height
    return pos;
}

// Get a random position within a radius of a center point
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

## Trabalhando com `typename`

O tipo `typename` armazena uma referência ao tipo em si. É usado para reflexão --- inspecionar e trabalhar com tipos em tempo de execução. Você vai encontrá-lo ao escrever sistemas genéricos, carregadores de config e padrões factory.

```c
void TypenameExamples()
{
    // Get the typename of a class
    typename t = PlayerBase;

    // Get typename from a string
    typename t2 = t.StringToEnum(PlayerBase, "PlayerBase");

    // Compare types
    if (t == PlayerBase)
        Print("It's PlayerBase!");

    // Get the typename of an object instance
    PlayerBase player;
    // ... assume player is valid ...
    typename objType = player.Type();

    // Check inheritance
    bool isMan = objType.IsInherited(Man);

    // Convert typename to string
    string name = t.ToString();  // "PlayerBase"

    // Create an instance from typename (factory pattern)
    Class instance = t.Spawn();
}
```

### Conversão de Enum com typename

```c
enum DamageType
{
    MELEE = 0,
    BULLET = 1,
    EXPLOSION = 2
};

void EnumConvert()
{
    // Enum to string
    string name = typename.EnumToString(DamageType, DamageType.BULLET);
    // name == "BULLET"

    // String to enum
    int value;
    typename.StringToEnum(DamageType, "EXPLOSION", value);
    // value == 2
}
```

---

## Conversão de Tipos

Enforce Script suporta tanto conversões implícitas quanto explícitas entre tipos.

### Conversões Implícitas

Algumas conversões acontecem automaticamente:

```c
void ImplicitConversions()
{
    // int to float (always safe, no data loss)
    int count = 42;
    float fCount = count;    // 42.0

    // float to int (TRUNCATES, does not round!)
    float precise = 3.99;
    int truncated = precise;  // 3, NOT 4

    // int/float to bool
    bool fromInt = 5;      // true (non-zero)
    bool fromZero = 0;     // false
    bool fromFloat = 0.1;  // true (non-zero)

    // bool to int
    int fromBool = true;   // 1
    int fromFalse = false; // 0
}
```

### Conversões Explícitas (Parsing)

Para converter entre strings e tipos numéricos, use métodos de parsing:

```c
void ExplicitConversions()
{
    // String to int
    int num = "42".ToInt();           // 42
    int bad = "hello".ToInt();        // 0 (fails silently)

    // String to float
    float f = "3.14".ToFloat();       // 3.14

    // String to vector
    vector v = "100 25 200".ToVector();  // <100, 25, 200>

    // Number to string (using Format)
    string s1 = string.Format("%1", 42);       // "42"
    string s2 = string.Format("%1", 3.14);     // "3.14"

    // int/float .ToString()
    string s3 = (42).ToString();     // "42"
}
```

### Casting de Objetos

Para tipos de classe, use `Class.CastTo()` ou `ClassName.Cast()`. Isso é abordado em detalhes no [Capítulo 1.3](03-classes-inheritance.md), mas aqui está o padrão essencial:

```c
void CastExample()
{
    Object obj = GetSomeObject();

    // Safe cast (preferred)
    PlayerBase player;
    if (Class.CastTo(player, obj))
    {
        // player is valid and safe to use
        string name = player.GetIdentity().GetName();
    }

    // Alternative cast syntax
    PlayerBase player2 = PlayerBase.Cast(obj);
    if (player2)
    {
        // player2 is valid
    }
}
```

---

## Escopo de Variáveis

Variáveis existem apenas dentro do bloco de código (chaves) onde são declaradas. Enforce Script **não** permite redeclarar o nome de uma variável dentro de escopos aninhados ou irmãos.

```c
void ScopeExample()
{
    int x = 10;

    if (true)
    {
        // int x = 20;  // ERROR: redeclaration of 'x' in nested scope
        x = 20;         // OK: modifying the outer x
        int y = 30;     // OK: new variable in this scope
    }

    // y is NOT accessible here (declared in inner scope)
    // Print(y);  // ERROR: undeclared identifier 'y'

    // IMPORTANT: this also applies to for loops
    for (int i = 0; i < 5; i++)
    {
        // i exists here
    }
    // for (int i = 0; i < 3; i++)  // ERROR in DayZ: 'i' already declared
    // Use a different name:
    for (int j = 0; j < 3; j++)
    {
        // j exists here
    }
}
```

### A Armadilha do Escopo Irmão

Esta é uma das peculiaridades mais notórias do Enforce Script. Declarar o mesmo nome de variável em blocos `if` e `else` causa erro de compilação:

```c
void SiblingTrap()
{
    if (someCondition)
    {
        int result = 10;    // Declared here
        Print(result);
    }
    else
    {
        // int result = 20; // ERROR: multiple declaration of 'result'
        // Even though this is a sibling scope, not the same scope
    }

    // FIX: declare above the if/else
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

## Erros Comuns

### 1. Variáveis Não Inicializadas Usadas em Lógica

Primitivos recebem valores padrão (`0`, `0.0`, `false`, `""`), mas depender disso torna o código frágil e difícil de ler. Sempre inicialize explicitamente.

```c
// BAD: relying on implicit zero
int count;
if (count > 0)  // This works because count == 0, but intent is unclear
    DoThing();

// GOOD: explicit initialization
int count = 0;
if (count > 0)
    DoThing();
```

### 2. Truncamento de Float para Int

A conversão de float para int trunca (arredonda em direção a zero), não arredonda para o mais próximo:

```c
float f = 3.99;
int i = f;         // i == 3, NOT 4

// If you want rounding:
int rounded = Math.Round(f);  // 4
```

### 3. Precisão de Float em Comparações

Nunca compare floats por igualdade exata:

```c
float a = 0.1 + 0.2;
// BAD: may fail due to floating-point representation
if (a == 0.3)
    Print("Equal");

// GOOD: use a tolerance (epsilon)
if (Math.AbsFloat(a - 0.3) < 0.001)
    Print("Close enough");
```

### 4. Concatenação de String com Números

Você não pode simplesmente concatenar um número em uma string com `+`. Use `string.Format()`:

```c
int kills = 5;
// Potentially problematic:
// string msg = "Kills: " + kills;

// CORRECT: use Format
string msg = string.Format("Kills: %1", kills);
```

### 5. Formato de String para Vector

A inicialização de vector por string requer espaços, não vírgulas:

```c
vector good = "100 25 200";     // CORRECT
// vector bad = "100, 25, 200"; // WRONG: commas are not parsed correctly
// vector bad2 = "100,25,200";  // WRONG
```

### 6. Esquecendo que Strings e Vectors são Tipos de Valor

Diferente de objetos de classe, strings e vectors são copiados na atribuição. Modificar uma cópia não afeta o original:

```c
vector posA = "10 20 30";
vector posB = posA;       // posB is a COPY
posB[1] = 99;             // Only posB changes
// posA is still "10 20 30"
```

---

## Exercícios Práticos

### Exercício 1: Básico de Variáveis
Declare variáveis para armazenar:
- O nome de um jogador (string)
- Sua porcentagem de saúde (float, 0-100)
- Sua contagem de kills (int)
- Se ele é admin (bool)
- Sua posição no mundo (vector)

Imprima um resumo formatado usando `string.Format()`.

### Exercício 2: Conversor de Temperatura
Escreva uma função `float CelsiusToFahrenheit(float celsius)` e sua inversa `float FahrenheitToCelsius(float fahrenheit)`. Teste com ponto de ebulição (100C = 212F) e ponto de congelamento (0C = 32F).

### Exercício 3: Calculadora de Distância
Escreva uma função que recebe dois vectors e retorna:
- A distância 3D entre eles
- A distância 2D (ignorando altura/eixo Y)
- A diferença de altura

Dica: Para distância 2D, crie novos vectors com `[1]` definido como `0` antes de calcular a distância.

### Exercício 4: Malabarismo de Tipos
Dada a string `"42"`, converta-a para:
1. Um `int`
2. Um `float`
3. De volta para `string` usando `string.Format()`
4. Um `bool` (deve ser `true` já que o valor int é diferente de zero)

### Exercício 5: Posição no Chão
Escreva uma função `vector SnapToGround(vector pos)` que recebe qualquer posição e retorna ela com o componente Y definido para a altura do terreno naquela localização X,Z. Use `GetGame().SurfaceY()`.

---

## Resumo

| Conceito | Ponto-chave |
|----------|-------------|
| Tipos | `int`, `float`, `bool`, `string`, `vector`, `typename`, `void` |
| Padrões | `0`, `0.0`, `false`, `""`, `"0 0 0"`, `null` |
| Constantes | Palavra-chave `const`, convenção `UPPER_SNAKE_CASE` |
| Vectors | Inicialize com string `"x y z"` ou `Vector(x,y,z)`, acesse com `[0]`, `[1]`, `[2]` |
| Escopo | Variáveis com escopo em blocos `{}`; sem redeclaração em blocos aninhados/irmãos |
| Conversão | `float` para `int` trunca; use `.ToInt()`, `.ToFloat()`, `.ToVector()` para parsing de string |
| Formatação | Sempre use `string.Format()` para construir strings de tipos mistos |

---

[Início](../README.md) | **Variáveis & Tipos** | [Próximo: Arrays, Maps & Sets >>](02-arrays-maps-sets.md)
