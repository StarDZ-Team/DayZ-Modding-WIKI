# Chapter 1.7: Math & Vector Operations

[Home](../README.md) | [<< Previous: String Operations](06-strings.md) | **Math & Vector Operations** | [Next: Memory Management >>](08-memory-management.md)

---

## Introduzione

DayZ modding frequently requires mathematical calculations: finding distances between players, randomizing spawn positions, interpolating camera movements, computing angles for AI targeting. Enforce Script provides the `Math` class for scalar operations and the `vector` type with static helpers for 3D math. This chapter is a complete reference for both, organized by category.

---

## Math Class

All methods on the `Math` class are **static**. You call them as `Math.MethodName()`.

### Costanti

| Constant | Value | Descrizione |
|----------|-------|-------------|
| `Math.PI` | 3.14159265... | Pi |
| `Math.PI2` | 6.28318530... | 2 * Pi (full circle in radians) |
| `Math.PI_HALF` | 1.57079632... | Pi / 2 (quarter circle) |
| `Math.EULER` | 2.71828182... | Euler's number |
| `Math.DEG2RAD` | 0.01745329... | Multiply degrees by this to get radians |
| `Math.RAD2DEG` | 57.29577951... | Multiply radians by this to get degrees |

```c
// Convert 90 degrees to radians
float rad = 90 * Math.DEG2RAD; // 1.5707...

// Convert PI radians to degrees
float deg = Math.PI * Math.RAD2DEG; // 180.0
```

---

### Random Numbers

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

#### DayZ example: Random loot chance

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

#### DayZ example: Random position within radius

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

### Rounding

```c
float rounded = Math.Round(5.6);   // 6.0
float rounded2 = Math.Round(5.4);  // 5.0
float floored = Math.Floor(5.9);   // 5.0
float ceiled = Math.Ceil(5.1);     // 6.0
```

#### DayZ example: Grid-snapped building placement

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

### Absolute Value & Sign

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

### Power, Root & Logarithm

```c
float pw = Math.Pow(2, 10);        // 1024.0
float sq = Math.Sqrt(25);          // 5.0
float lg = Math.Log2(8);           // 3.0
```

---

### Trigonometry

All trigonometric functions work in **radians**. Use `Math.DEG2RAD` and `Math.RAD2DEG` to convert.

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

#### DayZ example: Direction angle between two positions

```c
float GetAngleBetween(vector from, vector to)
{
    float dx = to[0] - from[0];
    float dz = to[2] - from[2];
    float angleRad = Math.Atan2(dx, dz);
    return angleRad * Math.RAD2DEG; // Return in degrees
}
```

#### DayZ example: Spawn objects in a circle

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

#### DayZ example: Clamping player health

```c
void ApplyDamage(PlayerBase player, float damage)
{
    float currentHealth = player.GetHealth("", "Health");
    float newHealth = Math.Clamp(currentHealth - damage, 0, 100);
    player.SetHealth("", "Health", newHealth);
}
```

---

### Interpolation

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

#### SmoothCD (Smooth Critical Damping)

`SmoothCD` provides smooth, framerate-independent interpolation. E' the best choice for camera smoothing, UI animations, and any value that should approach a target gradually without oscillation.

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

#### DayZ example: Smooth camera zoom

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

### Angle Operations

```c
// Normalize angle to [0, 360)
float norm = Math.NormalizeAngle(370);   // 10
float norm2 = Math.NormalizeAngle(-30);  // 330

// Difference between two angles (shortest path)
float diff = Math.DiffAngle(350, 10);   // -20
float diff2 = Math.DiffAngle(10, 350);  // 20
```

---

### Squared & Modulo

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

## Vector Type

The `vector` type is a built-in tipo valore with three float components (x, y, z). E' used everywhere in DayZ for positions, directions, orientations, and scales.

### Creating Vectors

```c
// String initialization (x y z separated by spaces)
vector pos = "100.5 0 200.3";

// Constructor function
vector pos2 = Vector(100.5, 0, 200.3);

// Default value (zero vector)
vector zero;           // "0 0 0"
```

### Accessing Components

```c
vector pos = Vector(10, 25, 30);

float x = pos[0]; // 10
float y = pos[1]; // 25 (height in DayZ)
float z = pos[2]; // 30

pos[1] = 50.0;    // Set y component
```

> **DayZ coordinate system:** `[0]` is East-West (X), `[1]` is height (Y), `[2]` is North-South (Z).

### Vector Constants

| Constant | Value | Descrizione |
|----------|-------|-------------|
| `vector.Zero` | `"0 0 0"` | Zero vector (origin) |
| `vector.Up` | `"0 1 0"` | Points upward |
| `vector.Aside` | `"1 0 0"` | Points east (X+) |
| `vector.Forward` | `"0 0 1"` | Points north (Z+) |

---

### Vector Operations (Static Methods)

#### Distance

```c
vector a = Vector(0, 0, 0);
vector b = Vector(100, 0, 100);

float dist = vector.Distance(a, b);     // ~141.42
float distSq = vector.DistanceSq(a, b); // 20000 (no sqrt, faster)
```

> **Suggerimento per le prestazioni:** Use `DistanceSq` when comparing distances. Comparing squared values avoids the expensive square root calculation.

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

#### Direction

Restituisce the direction vector from one point to another (not normalized).

```c
vector dir = vector.Direction(from, to);
// Equivalent to: to - from
```

#### Dot Product

```c
float dot = vector.Dot(a, b);
// dot > 0: vectors point in similar directions
// dot = 0: vectors are perpendicular
// dot < 0: vectors point in opposite directions
```

#### DayZ example: Is target in front of player?

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

Converts a vector to unit length (length of 1).

```c
vector dir = Vector(3, 0, 4);
float len = dir.Length();      // 5.0

vector norm = dir.Normalized(); // Vector(0.6, 0, 0.8)
// norm.Length() == 1.0

// In-place normalization
dir.Normalize();
// dir is now Vector(0.6, 0, 0.8)
```

#### Length

```c
vector v = Vector(3, 4, 0);
float len = v.Length();        // 5.0
float lenSq = v.LengthSq();   // 25.0 (faster, no sqrt)
```

#### Lerp (static)

Linear interpolation between two vectors.

```c
vector start = Vector(0, 0, 0);
vector end = Vector(100, 50, 200);

vector mid = vector.Lerp(start, end, 0.5);
// mid = Vector(50, 25, 100)

vector quarter = vector.Lerp(start, end, 0.25);
// quarter = Vector(25, 12.5, 50)
```

#### RotateAroundZeroDeg (static)

Rotates a vector around an axis by a given angle in degrees.

```c
vector original = Vector(1, 0, 0); // pointing east
vector axis = Vector(0, 1, 0);     // rotate around Y axis
float angle = 90;                  // 90 degrees

vector rotated = vector.RotateAroundZeroDeg(original, axis, angle);
// rotated is approximately Vector(0, 0, 1) -- now pointing north
```

#### Random Direction

```c
vector rdir = vector.RandomDir();    // Random 3D direction (unit vector)
vector rdir2d = vector.RandomDir2D(); // Random direction in XZ plane
```

---

### Vector Arithmetic

Vectors support standard arithmetic operators:

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

### Converting Vector to String

```c
vector pos = Vector(100.5, 25.3, 200.7);
string s = pos.ToString(); // "<100.5, 25.3, 200.7>"
```

---

## Math3D Class

For advanced 3D operations, the `Math3D` class provides matrix and rotation utilities.

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

## Esempi dal Mondo Reale

### Calculating distance between two players

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

### Finding the closest object

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

### Moving an object along a path

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

### Calculating a spawn ring around a point

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

## Errori Comuni

| Errore | Problema | Soluzione |
|---------|---------|-----|
| Passing degrees to `Math.Sin()` / `Math.Cos()` | Trig functions expect radians | Multiply by `Math.DEG2RAD` first |
| Using `Math.RandomInt(0, 10)` and expecting 10 | Max is exclusive | Use `Math.RandomIntInclusive(0, 10)` for inclusive max |
| Computing `vector.Distance()` in a tight loop | `Distance` uses `sqrt`, which is slow | Use `vector.DistanceSq()` and compare against squared distance |
| Normalizing a zero-length vector | Division by zero, produces NaN | Controlla `v.Length() > 0` before normalizing |
| Forgetting that DayZ Y is up | `pos[1]` is height, not Z | `[0]` = X (East), `[1]` = Y (Up), `[2]` = Z (North) |
| Using `Lerp` with t outside [0,1] | Extrapolates beyond the range | Clamp t with `Math.Clamp(t, 0, 1)` |
| Confusing `SqrFloat` with `Sqrt` | `SqrFloat` squares the value; `Sqrt` takes the square root | `Math.SqrFloat(5)` = 25, `Math.Sqrt(25)` = 5 |

---

## Riferimento Rapido

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

[<< 1.6: String Operations](06-strings.md) | [Home](../../it/README.md) | [1.8: Memory Management >>](08-memory-management.md)
