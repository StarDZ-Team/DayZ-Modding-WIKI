# Chapter 1.7: Math & Vector Operations

[Home](../README.md) | [<< Previous: String Operations](06-strings.md) | **Math & Vector Operations** | [Next: Memory Management >>](08-memory-management.md)

---

## Introducao

A criacao de mods para DayZ frequentemente exige calculos matematicos: encontrar distancias entre jogadores, aleatorizar posicoes de spawn, interpolar movimentos de camera, calcular angulos para mira de IA. O Enforce Script fornece a classe `Math` para operacoes escalares e o tipo `vector` com metodos estaticos para matematica 3D. Este capitulo e uma referencia completa para ambos, organizada por categoria.

---

## Classe Math

Todos os metodos da classe `Math` sao **estaticos**. Voce os chama como `Math.NomeDoMetodo()`.

### Constantes

| Constante | Valor | Descricao |
|-----------|-------|-----------|
| `Math.PI` | 3.14159265... | Pi |
| `Math.PI2` | 6.28318530... | 2 * Pi (circulo completo em radianos) |
| `Math.PI_HALF` | 1.57079632... | Pi / 2 (quarto de circulo) |
| `Math.EULER` | 2.71828182... | Numero de Euler |
| `Math.DEG2RAD` | 0.01745329... | Multiplique graus por este valor para obter radianos |
| `Math.RAD2DEG` | 57.29577951... | Multiplique radianos por este valor para obter graus |

```c
// Convert 90 degrees to radians
float rad = 90 * Math.DEG2RAD; // 1.5707...

// Convert PI radians to degrees
float deg = Math.PI * Math.RAD2DEG; // 180.0
```

---

### Numeros Aleatorios

```c
// Random integer in range [min, max) -- max is EXCLUSIVE
int roll = Math.RandomInt(0, 10);           // 0 through 9

// Random integer in range [min, max] -- max is INCLUSIVE
int dice = Math.RandomIntInclusive(1, 6);   // 1 through 6

// Random float in range [min, max) -- max is EXCLUSIVE
float rf = Math.RandomFloat(0.0, 1.0);

// Random float in range [min, max] -- max is INCLUSIVE
float rf2 = Math.RandomFloatInclusive(0.0, 1.0);

// Random float [0, 1] inclusive (shorthand)
float chance = Math.RandomFloat01();

// Random bool
bool coinFlip = Math.RandomBool();

// Seed the random number generator (-1 seeds from system time)
Math.Randomize(-1);
```

#### Exemplo DayZ: Chance aleatoria de loot

```c
bool ShouldSpawnRareLoot(float rarity)
{
    // rarity: 0.0 = never, 1.0 = always
    return Math.RandomFloat01() < rarity;
}

// 15% chance for rare weapon
if (ShouldSpawnRareLoot(0.15))
{
    GetGame().CreateObject("VSS", position, false, false, true);
}
```

#### Exemplo DayZ: Posicao aleatoria dentro de um raio

```c
vector GetRandomPositionInRadius(vector center, float radius)
{
    float angle = Math.RandomFloat(0, Math.PI2);
    float dist = Math.RandomFloat(0, radius);

    vector pos = center;
    pos[0] = pos[0] + Math.Cos(angle) * dist;
    pos[2] = pos[2] + Math.Sin(angle) * dist;
    pos[1] = GetGame().SurfaceY(pos[0], pos[2]);

    return pos;
}
```

---

### Arredondamento

```c
float rounded = Math.Round(5.6);   // 6.0
float rounded2 = Math.Round(5.4);  // 5.0
float floored = Math.Floor(5.9);   // 5.0
float ceiled = Math.Ceil(5.1);     // 6.0
```

#### Exemplo DayZ: Posicionamento de construcao alinhado a grade

```c
vector SnapToGrid(vector pos, float gridSize)
{
    pos[0] = Math.Round(pos[0] / gridSize) * gridSize;
    pos[2] = Math.Round(pos[2] / gridSize) * gridSize;
    pos[1] = GetGame().SurfaceY(pos[0], pos[2]);
    return pos;
}
```

---

### Valor Absoluto & Sinal

```c
float af = Math.AbsFloat(-5.5);    // 5.5
int ai = Math.AbsInt(-42);         // 42

float sf = Math.SignFloat(-5.0);   // -1.0
float sf2 = Math.SignFloat(5.0);   // 1.0
float sf3 = Math.SignFloat(0.0);   // 0.0

int si = Math.SignInt(-3);         // -1
int si2 = Math.SignInt(7);         // 1
```

---

### Potencia, Raiz & Logaritmo

```c
float pw = Math.Pow(2, 10);        // 1024.0
float sq = Math.Sqrt(25);          // 5.0
float lg = Math.Log2(8);           // 3.0
```

---

### Trigonometria

Todas as funcoes trigonometricas trabalham em **radianos**. Use `Math.DEG2RAD` e `Math.RAD2DEG` para converter.

```c
// Basic trig
float s = Math.Sin(Math.PI / 4);     // ~0.707
float c = Math.Cos(Math.PI / 4);     // ~0.707
float t = Math.Tan(Math.PI / 4);     // ~1.0

// Inverse trig
float asin = Math.Asin(0.5);         // ~0.5236 rad (30 degrees)
float acos = Math.Acos(0.5);         // ~1.0472 rad (60 degrees)

// Atan2 -- angle from x-axis to point (y, x)
float angle = Math.Atan2(1, 1);      // PI/4 (~0.785 rad = 45 degrees)
```

#### Exemplo DayZ: Angulo de direcao entre duas posicoes

```c
float GetAngleBetween(vector from, vector to)
{
    float dx = to[0] - from[0];
    float dz = to[2] - from[2];
    float angleRad = Math.Atan2(dx, dz);
    return angleRad * Math.RAD2DEG; // Return in degrees
}
```

#### Exemplo DayZ: Spawnar objetos em circulo

```c
void SpawnCircleOfBarrels(vector center, float radius, int count)
{
    float angleStep = Math.PI2 / count;

    for (int i = 0; i < count; i++)
    {
        float angle = angleStep * i;
        vector pos = center;
        pos[0] = pos[0] + Math.Cos(angle) * radius;
        pos[2] = pos[2] + Math.Sin(angle) * radius;
        pos[1] = GetGame().SurfaceY(pos[0], pos[2]);

        GetGame().CreateObject("Barrel_Green", pos, false, false, true);
    }
}
```

---

### Clamping & Min/Max

```c
// Clamp a value to a range
float clamped = Math.Clamp(15, 0, 10);  // 10 (capped at max)
float clamped2 = Math.Clamp(-5, 0, 10); // 0  (capped at min)
float clamped3 = Math.Clamp(5, 0, 10);  // 5  (within range)

// Min and Max
float mn = Math.Min(3, 7);              // 3
float mx = Math.Max(3, 7);              // 7

// Check if value is in range
bool inRange = Math.IsInRange(5, 0, 10); // true
bool outRange = Math.IsInRange(15, 0, 10); // false
```

#### Exemplo DayZ: Limitando a vida do jogador

```c
void ApplyDamage(PlayerBase player, float damage)
{
    float currentHealth = player.GetHealth("", "Health");
    float newHealth = Math.Clamp(currentHealth - damage, 0, 100);
    player.SetHealth("", "Health", newHealth);
}
```

---

### Interpolacao

```c
// Linear interpolation (Lerp)
// Returns a + (b - a) * t, where t is [0, 1]
float lerped = Math.Lerp(0, 100, 0.5);     // 50
float lerped2 = Math.Lerp(0, 100, 0.25);   // 25

// Inverse Lerp -- finds the t value
// Returns (value - a) / (b - a)
float t = Math.InverseLerp(0, 100, 50);    // 0.5
float t2 = Math.InverseLerp(0, 100, 75);   // 0.75
```

#### SmoothCD (Amortecimento Critico Suave)

`SmoothCD` fornece interpolacao suave e independente de framerate. E a melhor opcao para suavizacao de camera, animacoes de UI e qualquer valor que deva se aproximar de um alvo gradualmente sem oscilacao.

```c
// SmoothCD(current, target, velocity, smoothTime, maxSpeed, dt)
// velocity is passed by reference and updated each call
float currentVal = 0;
float velocity = 0;
float target = 100;
float smoothTime = 0.3;

// Called each frame:
currentVal = Math.SmoothCD(currentVal, target, velocity, smoothTime, 1000, 0.016);
```

#### Exemplo DayZ: Zoom suave de camera

```c
class SmoothZoomCamera
{
    protected float m_CurrentFOV;
    protected float m_TargetFOV;
    protected float m_Velocity;

    void SmoothZoomCamera()
    {
        m_CurrentFOV = 70;
        m_TargetFOV = 70;
        m_Velocity = 0;
    }

    void SetZoom(float targetFOV)
    {
        m_TargetFOV = Math.Clamp(targetFOV, 20, 120);
    }

    void Update(float dt)
    {
        m_CurrentFOV = Math.SmoothCD(m_CurrentFOV, m_TargetFOV, m_Velocity, 0.2, 500, dt);
    }

    float GetFOV()
    {
        return m_CurrentFOV;
    }
}
```

---

### Operacoes com Angulos

```c
// Normalize angle to [0, 360)
float norm = Math.NormalizeAngle(370);   // 10
float norm2 = Math.NormalizeAngle(-30);  // 330

// Difference between two angles (shortest path)
float diff = Math.DiffAngle(350, 10);   // -20
float diff2 = Math.DiffAngle(10, 350);  // 20
```

---

### Quadrado & Modulo

```c
// Square (faster than Pow(x, 2))
float sqf = Math.SqrFloat(5);          // 25.0
int sqi = Math.SqrInt(5);              // 25

// Float modulo
float mod = Math.ModFloat(5.5, 2.0);   // 1.5

// Wrap an integer into a range
int wrapped = Math.WrapInt(12, 0, 10);  // 2
int wrapped2 = Math.WrapInt(-1, 0, 10); // 9
```

---

## Tipo Vector

O tipo `vector` e um tipo de valor embutido com tres componentes float (x, y, z). Ele e usado em todo o DayZ para posicoes, direcoes, orientacoes e escalas.

### Criando Vetores

```c
// String initialization (x y z separated by spaces)
vector pos = "100.5 0 200.3";

// Constructor function
vector pos2 = Vector(100.5, 0, 200.3);

// Default value (zero vector)
vector zero;           // "0 0 0"
```

### Acessando Componentes

```c
vector pos = Vector(10, 25, 30);

float x = pos[0]; // 10
float y = pos[1]; // 25 (height in DayZ)
float z = pos[2]; // 30

pos[1] = 50.0;    // Set y component
```

> **Sistema de coordenadas do DayZ:** `[0]` e Leste-Oeste (X), `[1]` e altura (Y), `[2]` e Norte-Sul (Z).

### Constantes de Vector

| Constante | Valor | Descricao |
|-----------|-------|-----------|
| `vector.Zero` | `"0 0 0"` | Vetor zero (origem) |
| `vector.Up` | `"0 1 0"` | Aponta para cima |
| `vector.Aside` | `"1 0 0"` | Aponta para leste (X+) |
| `vector.Forward` | `"0 0 1"` | Aponta para norte (Z+) |

---

### Operacoes com Vetores (Metodos Estaticos)

#### Distancia

```c
vector a = Vector(0, 0, 0);
vector b = Vector(100, 0, 100);

float dist = vector.Distance(a, b);     // ~141.42
float distSq = vector.DistanceSq(a, b); // 20000 (no sqrt, faster)
```

> **Dica de performance:** Use `DistanceSq` ao comparar distancias. Comparar valores ao quadrado evita o caro calculo de raiz quadrada.

```c
// GOOD -- compare squared distances
float maxDistSq = 100 * 100; // 10000
if (vector.DistanceSq(playerPos, targetPos) < maxDistSq)
{
    Print("Target is within 100m");
}

// SLOWER -- computing actual distance
if (vector.Distance(playerPos, targetPos) < 100)
{
    Print("Target is within 100m");
}
```

#### Direcao

Retorna o vetor de direcao de um ponto para outro (nao normalizado).

```c
vector dir = vector.Direction(from, to);
// Equivalent to: to - from
```

#### Produto Escalar (Dot Product)

```c
float dot = vector.Dot(a, b);
// dot > 0: vectors point in similar directions
// dot = 0: vectors are perpendicular
// dot < 0: vectors point in opposite directions
```

#### Exemplo DayZ: O alvo esta na frente do jogador?

```c
bool IsTargetInFront(PlayerBase player, vector targetPos)
{
    vector playerDir = player.GetDirection();
    vector toTarget = vector.Direction(player.GetPosition(), targetPos);
    toTarget.Normalize();

    float dot = vector.Dot(playerDir, toTarget);
    return dot > 0; // Positive means in front
}
```

#### Normalize

Converte um vetor para comprimento unitario (comprimento de 1).

```c
vector dir = Vector(3, 0, 4);
float len = dir.Length();      // 5.0

vector norm = dir.Normalized(); // Vector(0.6, 0, 0.8)
// norm.Length() == 1.0

// In-place normalization
dir.Normalize();
// dir is now Vector(0.6, 0, 0.8)
```

#### Comprimento

```c
vector v = Vector(3, 4, 0);
float len = v.Length();        // 5.0
float lenSq = v.LengthSq();   // 25.0 (faster, no sqrt)
```

#### Lerp (estatico)

Interpolacao linear entre dois vetores.

```c
vector start = Vector(0, 0, 0);
vector end = Vector(100, 50, 200);

vector mid = vector.Lerp(start, end, 0.5);
// mid = Vector(50, 25, 100)

vector quarter = vector.Lerp(start, end, 0.25);
// quarter = Vector(25, 12.5, 50)
```

#### RotateAroundZeroDeg (estatico)

Rotaciona um vetor ao redor de um eixo por um angulo dado em graus.

```c
vector original = Vector(1, 0, 0); // pointing east
vector axis = Vector(0, 1, 0);     // rotate around Y axis
float angle = 90;                  // 90 degrees

vector rotated = vector.RotateAroundZeroDeg(original, axis, angle);
// rotated is approximately Vector(0, 0, 1) -- now pointing north
```

#### Direcao Aleatoria

```c
vector rdir = vector.RandomDir();    // Random 3D direction (unit vector)
vector rdir2d = vector.RandomDir2D(); // Random direction in XZ plane
```

---

### Aritmetica de Vetores

Vetores suportam operadores aritmeticos padrao:

```c
vector a = Vector(1, 2, 3);
vector b = Vector(4, 5, 6);

vector sum = a + b;         // Vector(5, 7, 9)
vector diff = a - b;        // Vector(-3, -3, -3)
vector scaled = a * 2;      // Vector(2, 4, 6)

// Move a position forward
vector pos = player.GetPosition();
vector dir = player.GetDirection();
vector ahead = pos + dir * 5; // 5 meters ahead of the player
```

### Convertendo Vector para String

```c
vector pos = Vector(100.5, 25.3, 200.7);
string s = pos.ToString(); // "<100.5, 25.3, 200.7>"
```

---

## Classe Math3D

Para operacoes 3D avancadas, a classe `Math3D` fornece utilitarios de matriz e rotacao.

```c
// Create a rotation matrix from yaw/pitch/roll (degrees)
vector mat[3];
Math3D.YawPitchRollMatrix("45 0 0", mat);

// Convert a rotation matrix back to angles
vector angles = Math3D.MatrixToAngles(mat);

// Identity matrix (4x4)
vector mat4[4];
Math3D.MatrixIdentity4(mat4);
```

---

## Exemplos do Mundo Real

### Calculando distancia entre dois jogadores

```c
float GetPlayerDistance(PlayerBase player1, PlayerBase player2)
{
    if (!player1 || !player2)
        return -1;

    return vector.Distance(player1.GetPosition(), player2.GetPosition());
}

void WarnProximity(PlayerBase player, array<Man> allPlayers, float warnDistance)
{
    vector myPos = player.GetPosition();
    float warnDistSq = warnDistance * warnDistance;

    foreach (Man man : allPlayers)
    {
        if (man == player)
            continue;

        if (vector.DistanceSq(myPos, man.GetPosition()) < warnDistSq)
        {
            Print(string.Format("Player nearby! Distance: %1m",
                vector.Distance(myPos, man.GetPosition())));
        }
    }
}
```

### Encontrando o objeto mais proximo

```c
Object FindClosest(vector origin, array<Object> objects)
{
    Object closest = null;
    float closestDistSq = float.MAX;

    foreach (Object obj : objects)
    {
        if (!obj)
            continue;

        float distSq = vector.DistanceSq(origin, obj.GetPosition());
        if (distSq < closestDistSq)
        {
            closestDistSq = distSq;
            closest = obj;
        }
    }

    return closest;
}
```

### Movendo um objeto ao longo de um caminho

```c
class PathMover
{
    protected ref array<vector> m_Waypoints;
    protected int m_CurrentWaypoint;
    protected float m_Progress; // 0.0 to 1.0 between waypoints
    protected float m_Speed;    // meters per second

    void PathMover(array<vector> waypoints, float speed)
    {
        m_Waypoints = waypoints;
        m_CurrentWaypoint = 0;
        m_Progress = 0;
        m_Speed = speed;
    }

    vector Update(float dt)
    {
        if (m_CurrentWaypoint >= m_Waypoints.Count() - 1)
            return m_Waypoints.Get(m_Waypoints.Count() - 1);

        vector from = m_Waypoints.Get(m_CurrentWaypoint);
        vector to = m_Waypoints.Get(m_CurrentWaypoint + 1);
        float segmentLength = vector.Distance(from, to);

        if (segmentLength > 0)
        {
            m_Progress += (m_Speed * dt) / segmentLength;
        }

        if (m_Progress >= 1.0)
        {
            m_Progress = 0;
            m_CurrentWaypoint++;
            return Update(0); // Recalculate with next segment
        }

        return vector.Lerp(from, to, m_Progress);
    }
}
```

### Calculando um anel de spawn ao redor de um ponto

```c
array<vector> GetSpawnRing(vector center, float radius, int count)
{
    array<vector> positions = new array<vector>;
    float angleStep = Math.PI2 / count;

    for (int i = 0; i < count; i++)
    {
        float angle = angleStep * i;
        vector pos = center;
        pos[0] = pos[0] + Math.Cos(angle) * radius;
        pos[2] = pos[2] + Math.Sin(angle) * radius;
        pos[1] = GetGame().SurfaceY(pos[0], pos[2]);
        positions.Insert(pos);
    }

    return positions;
}
```

---

## Erros Comuns

| Erro | Problema | Correcao |
|------|----------|----------|
| Passar graus para `Math.Sin()` / `Math.Cos()` | Funcoes trigonometricas esperam radianos | Multiplique por `Math.DEG2RAD` primeiro |
| Usar `Math.RandomInt(0, 10)` esperando 10 | O maximo e exclusivo | Use `Math.RandomIntInclusive(0, 10)` para maximo inclusivo |
| Calcular `vector.Distance()` em um loop intenso | `Distance` usa `sqrt`, que e lento | Use `vector.DistanceSq()` e compare com a distancia ao quadrado |
| Normalizar um vetor de comprimento zero | Divisao por zero, produz NaN | Verifique `v.Length() > 0` antes de normalizar |
| Esquecer que Y e para cima no DayZ | `pos[1]` e altura, nao Z | `[0]` = X (Leste), `[1]` = Y (Cima), `[2]` = Z (Norte) |
| Usar `Lerp` com t fora de [0,1] | Extrapola alem do intervalo | Limite t com `Math.Clamp(t, 0, 1)` |
| Confundir `SqrFloat` com `Sqrt` | `SqrFloat` eleva ao quadrado; `Sqrt` calcula a raiz quadrada | `Math.SqrFloat(5)` = 25, `Math.Sqrt(25)` = 5 |

---

## Referencia Rapida

```c
// Constants
Math.PI  Math.PI2  Math.PI_HALF  Math.EULER  Math.DEG2RAD  Math.RAD2DEG

// Random
Math.RandomInt(min, max)              // [min, max)
Math.RandomIntInclusive(min, max)     // [min, max]
Math.RandomFloat(min, max)            // [min, max)
Math.RandomFloatInclusive(min, max)   // [min, max]
Math.RandomFloat01()                  // [0, 1]
Math.RandomBool()
Math.Randomize(-1)                    // Seed from time

// Rounding
Math.Round(f)  Math.Floor(f)  Math.Ceil(f)

// Absolute & Sign
Math.AbsFloat(f)  Math.AbsInt(i)  Math.SignFloat(f)  Math.SignInt(i)

// Power & Root
Math.Pow(base, exp)  Math.Sqrt(f)  Math.Log2(f)  Math.SqrFloat(f)

// Trig (radians)
Math.Sin(r) Math.Cos(r) Math.Tan(r) Math.Asin(f) Math.Acos(f) Math.Atan2(y, x)

// Clamp & Interpolation
Math.Clamp(val, min, max)  Math.Min(a, b)  Math.Max(a, b)
Math.Lerp(a, b, t)  Math.InverseLerp(a, b, val)
Math.SmoothCD(cur, target, vel, smoothTime, maxSpeed, dt)
Math.IsInRange(val, min, max)

// Angle
Math.NormalizeAngle(deg)  Math.DiffAngle(a, b)

// Vector
vector.Distance(a, b)    vector.DistanceSq(a, b)
vector.Direction(from, to)
vector.Dot(a, b)          vector.Lerp(a, b, t)
vector.RotateAroundZeroDeg(vec, axis, angleDeg)
vector.RandomDir()        vector.RandomDir2D()
v.Length()  v.LengthSq()  v.Normalized()  v.Normalize()

// Vector constants
vector.Zero  vector.Up  vector.Aside  vector.Forward
```

---

[<< 1.6: Operacoes com String](06-strings.md) | [Inicio](../README.md) | [1.8: Gerenciamento de Memoria >>](08-memory-management.md)
