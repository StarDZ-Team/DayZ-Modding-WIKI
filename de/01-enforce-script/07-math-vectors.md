# Kapitel 1.7: Mathematik & Vektor-Operationen

[Startseite](../README.md) | [<< Zurück: String-Operationen](06-strings.md) | **Mathematik & Vektor-Operationen** | [Weiter: Speicherverwaltung >>](08-memory-management.md)

---

## Einführung

DayZ-Modding erfordert häufig mathematische Berechnungen: Entfernungen zwischen Spielern finden, Spawn-Positionen randomisieren, Kamerabewegungen interpolieren, Winkel für KI-Zielen berechnen. Enforce Script bietet die `Math`-Klasse für skalare Operationen und den `vector`-Typ mit statischen Hilfsfunktionen für 3D-Mathematik. Dieses Kapitel ist eine vollständige Referenz für beides, nach Kategorie geordnet.

---

## Math-Klasse

Alle Methoden der `Math`-Klasse sind **statisch**. Sie rufen sie als `Math.MethodenName()` auf.

### Konstanten

| Konstante | Wert | Beschreibung |
|----------|-------|-------------|
| `Math.PI` | 3,14159265... | Pi |
| `Math.PI2` | 6,28318530... | 2 * Pi (voller Kreis in Radiant) |
| `Math.PI_HALF` | 1,57079632... | Pi / 2 (Viertelkreis) |
| `Math.EULER` | 2,71828182... | Eulersche Zahl |
| `Math.DEG2RAD` | 0,01745329... | Grad damit multiplizieren, um Radiant zu erhalten |
| `Math.RAD2DEG` | 57,29577951... | Radiant damit multiplizieren, um Grad zu erhalten |

```c
// 90 Grad in Radiant umwandeln
float rad = 90 * Math.DEG2RAD; // 1.5707...

// PI Radiant in Grad umwandeln
float deg = Math.PI * Math.RAD2DEG; // 180.0
```

---

### Zufallszahlen

```c
// Zufällige Ganzzahl im Bereich [min, max) -- max ist EXKLUSIV
int roll = Math.RandomInt(0, 10);           // 0 bis 9

// Zufällige Ganzzahl im Bereich [min, max] -- max ist INKLUSIV
int dice = Math.RandomIntInclusive(1, 6);   // 1 bis 6

// Zufällige Gleitkommazahl im Bereich [min, max) -- max ist EXKLUSIV
float rf = Math.RandomFloat(0.0, 1.0);

// Zufällige Gleitkommazahl im Bereich [min, max] -- max ist INKLUSIV
float rf2 = Math.RandomFloatInclusive(0.0, 1.0);

// Zufällige Gleitkommazahl [0, 1] inklusiv (Kurzform)
float chance = Math.RandomFloat01();

// Zufälliger Bool
bool coinFlip = Math.RandomBool();

// Zufallszahlengenerator initialisieren (-1 initialisiert mit Systemzeit)
Math.Randomize(-1);
```

#### DayZ-Beispiel: Zufällige Loot-Chance

```c
bool ShouldSpawnRareLoot(float rarity)
{
    // rarity: 0.0 = nie, 1.0 = immer
    return Math.RandomFloat01() < rarity;
}

// 15% Chance für seltene Waffe
if (ShouldSpawnRareLoot(0.15))
{
    GetGame().CreateObject("VSS", position, false, false, true);
}
```

#### DayZ-Beispiel: Zufällige Position innerhalb eines Radius

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

### Runden

```c
float rounded = Math.Round(5.6);   // 6.0
float rounded2 = Math.Round(5.4);  // 5.0
float floored = Math.Floor(5.9);   // 5.0
float ceiled = Math.Ceil(5.1);     // 6.0
```

#### DayZ-Beispiel: Rasterausgerichtete Gebäudeplatzierung

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

### Absolutwert & Vorzeichen

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

### Potenz, Wurzel & Logarithmus

```c
float pw = Math.Pow(2, 10);        // 1024.0
float sq = Math.Sqrt(25);          // 5.0
float lg = Math.Log2(8);           // 3.0
```

---

### Trigonometrie

Alle trigonometrischen Funktionen arbeiten in **Radiant**. Verwenden Sie `Math.DEG2RAD` und `Math.RAD2DEG` zum Konvertieren.

```c
// Grundlegende Trigonometrie
float s = Math.Sin(Math.PI / 4);     // ~0.707
float c = Math.Cos(Math.PI / 4);     // ~0.707
float t = Math.Tan(Math.PI / 4);     // ~1.0

// Inverse Trigonometrie
float asin = Math.Asin(0.5);         // ~0.5236 rad (30 Grad)
float acos = Math.Acos(0.5);         // ~1.0472 rad (60 Grad)

// Atan2 -- Winkel von der x-Achse zum Punkt (y, x)
float angle = Math.Atan2(1, 1);      // PI/4 (~0.785 rad = 45 Grad)
```

#### DayZ-Beispiel: Richtungswinkel zwischen zwei Positionen

```c
float GetAngleBetween(vector from, vector to)
{
    float dx = to[0] - from[0];
    float dz = to[2] - from[2];
    float angleRad = Math.Atan2(dx, dz);
    return angleRad * Math.RAD2DEG; // In Grad zurückgeben
}
```

#### DayZ-Beispiel: Objekte im Kreis spawnen

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
// Wert auf einen Bereich begrenzen
float clamped = Math.Clamp(15, 0, 10);  // 10 (am Maximum gekappt)
float clamped2 = Math.Clamp(-5, 0, 10); // 0  (am Minimum gekappt)
float clamped3 = Math.Clamp(5, 0, 10);  // 5  (innerhalb des Bereichs)

// Min und Max
float mn = Math.Min(3, 7);              // 3
float mx = Math.Max(3, 7);              // 7

// Prüfen, ob Wert im Bereich liegt
bool inRange = Math.IsInRange(5, 0, 10); // true
bool outRange = Math.IsInRange(15, 0, 10); // false
```

#### DayZ-Beispiel: Spielergesundheit begrenzen

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
// Lineare Interpolation (Lerp)
// Gibt a + (b - a) * t zurück, wobei t im Bereich [0, 1] liegt
float lerped = Math.Lerp(0, 100, 0.5);     // 50
float lerped2 = Math.Lerp(0, 100, 0.25);   // 25

// Inverses Lerp -- findet den t-Wert
// Gibt (value - a) / (b - a) zurück
float t = Math.InverseLerp(0, 100, 50);    // 0.5
float t2 = Math.InverseLerp(0, 100, 75);   // 0.75
```

#### SmoothCD (Sanfte kritische Dämpfung)

`SmoothCD` bietet sanfte, bildfrequenzunabhängige Interpolation. Es ist die beste Wahl für Kamera-Glättung, UI-Animationen und jeden Wert, der sich einem Ziel schrittweise ohne Oszillation nähern soll.

```c
// SmoothCD(aktuell, ziel, geschwindigkeit, glättungszeit, maxGeschwindigkeit, dt)
// geschwindigkeit wird per Referenz übergeben und bei jedem Aufruf aktualisiert
float currentVal = 0;
float velocity = 0;
float target = 100;
float smoothTime = 0.3;

// Wird jeden Frame aufgerufen:
currentVal = Math.SmoothCD(currentVal, target, velocity, smoothTime, 1000, 0.016);
```

#### DayZ-Beispiel: Sanfter Kamera-Zoom

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

### Winkel-Operationen

```c
// Winkel auf [0, 360) normalisieren
float norm = Math.NormalizeAngle(370);   // 10
float norm2 = Math.NormalizeAngle(-30);  // 330

// Differenz zwischen zwei Winkeln (kürzester Weg)
float diff = Math.DiffAngle(350, 10);   // -20
float diff2 = Math.DiffAngle(10, 350);  // 20
```

---

### Quadrat & Modulo

```c
// Quadrat (schneller als Pow(x, 2))
float sqf = Math.SqrFloat(5);          // 25.0
int sqi = Math.SqrInt(5);              // 25

// Gleitkomma-Modulo
float mod = Math.ModFloat(5.5, 2.0);   // 1.5

// Ganzzahl in einen Bereich einwickeln
int wrapped = Math.WrapInt(12, 0, 10);  // 2
int wrapped2 = Math.WrapInt(-1, 0, 10); // 9
```

---

## Vektor-Typ

Der `vector`-Typ ist ein eingebauter Werttyp mit drei Float-Komponenten (x, y, z). Er wird überall in DayZ für Positionen, Richtungen, Orientierungen und Skalierungen verwendet.

### Vektoren erstellen

```c
// String-Initialisierung (x y z durch Leerzeichen getrennt)
vector pos = "100.5 0 200.3";

// Konstruktor-Funktion
vector pos2 = Vector(100.5, 0, 200.3);

// Standardwert (Nullvektor)
vector zero;           // "0 0 0"
```

### Auf Komponenten zugreifen

```c
vector pos = Vector(10, 25, 30);

float x = pos[0]; // 10
float y = pos[1]; // 25 (Höhe in DayZ)
float z = pos[2]; // 30

pos[1] = 50.0;    // y-Komponente setzen
```

> **DayZ-Koordinatensystem:** `[0]` ist Ost-West (X), `[1]` ist Höhe (Y), `[2]` ist Nord-Süd (Z).

### Vektor-Konstanten

| Konstante | Wert | Beschreibung |
|----------|-------|-------------|
| `vector.Zero` | `"0 0 0"` | Nullvektor (Ursprung) |
| `vector.Up` | `"0 1 0"` | Zeigt nach oben |
| `vector.Aside` | `"1 0 0"` | Zeigt nach Osten (X+) |
| `vector.Forward` | `"0 0 1"` | Zeigt nach Norden (Z+) |

---

### Vektor-Operationen (Statische Methoden)

#### Entfernung

```c
vector a = Vector(0, 0, 0);
vector b = Vector(100, 0, 100);

float dist = vector.Distance(a, b);     // ~141.42
float distSq = vector.DistanceSq(a, b); // 20000 (keine Quadratwurzel, schneller)
```

> **Leistungstipp:** Verwenden Sie `DistanceSq` beim Vergleichen von Entfernungen. Der Vergleich quadrierter Werte vermeidet die teure Quadratwurzel-Berechnung.

```c
// GUT -- quadrierte Entfernungen vergleichen
float maxDistSq = 100 * 100; // 10000
if (vector.DistanceSq(playerPos, targetPos) < maxDistSq)
{
    Print("Ziel ist innerhalb von 100m");
}

// LANGSAMER -- tatsächliche Entfernung berechnen
if (vector.Distance(playerPos, targetPos) < 100)
{
    Print("Ziel ist innerhalb von 100m");
}
```

#### Richtung

Gibt den Richtungsvektor von einem Punkt zum anderen zurück (nicht normalisiert).

```c
vector dir = vector.Direction(from, to);
// Äquivalent zu: to - from
```

#### Skalarprodukt

```c
float dot = vector.Dot(a, b);
// dot > 0: Vektoren zeigen in ähnliche Richtungen
// dot = 0: Vektoren stehen senkrecht aufeinander
// dot < 0: Vektoren zeigen in entgegengesetzte Richtungen
```

#### DayZ-Beispiel: Ist das Ziel vor dem Spieler?

```c
bool IsTargetInFront(PlayerBase player, vector targetPos)
{
    vector playerDir = player.GetDirection();
    vector toTarget = vector.Direction(player.GetPosition(), targetPos);
    toTarget.Normalize();

    float dot = vector.Dot(playerDir, toTarget);
    return dot > 0; // Positiv bedeutet vor dem Spieler
}
```

#### Normalisieren

Konvertiert einen Vektor auf Einheitslänge (Länge von 1).

```c
vector dir = Vector(3, 0, 4);
float len = dir.Length();      // 5.0

vector norm = dir.Normalized(); // Vector(0.6, 0, 0.8)
// norm.Length() == 1.0

// In-Place-Normalisierung
dir.Normalize();
// dir ist jetzt Vector(0.6, 0, 0.8)
```

#### Länge

```c
vector v = Vector(3, 4, 0);
float len = v.Length();        // 5.0
float lenSq = v.LengthSq();   // 25.0 (schneller, keine Quadratwurzel)
```

#### Lerp (statisch)

Lineare Interpolation zwischen zwei Vektoren.

```c
vector start = Vector(0, 0, 0);
vector end = Vector(100, 50, 200);

vector mid = vector.Lerp(start, end, 0.5);
// mid = Vector(50, 25, 100)

vector quarter = vector.Lerp(start, end, 0.25);
// quarter = Vector(25, 12.5, 50)
```

#### RotateAroundZeroDeg (statisch)

Rotiert einen Vektor um eine Achse um einen bestimmten Winkel in Grad.

```c
vector original = Vector(1, 0, 0); // zeigt nach Osten
vector axis = Vector(0, 1, 0);     // um Y-Achse rotieren
float angle = 90;                  // 90 Grad

vector rotated = vector.RotateAroundZeroDeg(original, axis, angle);
// rotated ist ungefähr Vector(0, 0, 1) -- zeigt jetzt nach Norden
```

#### Zufällige Richtung

```c
vector rdir = vector.RandomDir();    // Zufällige 3D-Richtung (Einheitsvektor)
vector rdir2d = vector.RandomDir2D(); // Zufällige Richtung in der XZ-Ebene
```

---

### Vektor-Arithmetik

Vektoren unterstützen Standard-Arithmetikoperatoren:

```c
vector a = Vector(1, 2, 3);
vector b = Vector(4, 5, 6);

vector sum = a + b;         // Vector(5, 7, 9)
vector diff = a - b;        // Vector(-3, -3, -3)
vector scaled = a * 2;      // Vector(2, 4, 6)

// Eine Position vorwärts bewegen
vector pos = player.GetPosition();
vector dir = player.GetDirection();
vector ahead = pos + dir * 5; // 5 Meter vor dem Spieler
```

### Vektor in String konvertieren

```c
vector pos = Vector(100.5, 25.3, 200.7);
string s = pos.ToString(); // "<100.5, 25.3, 200.7>"
```

---

## Math3D-Klasse

Für erweiterte 3D-Operationen bietet die `Math3D`-Klasse Matrix- und Rotations-Hilfsfunktionen.

```c
// Rotationsmatrix aus Yaw/Pitch/Roll erstellen (Grad)
vector mat[3];
Math3D.YawPitchRollMatrix("45 0 0", mat);

// Rotationsmatrix zurück in Winkel konvertieren
vector angles = Math3D.MatrixToAngles(mat);

// Einheitsmatrix (4x4)
vector mat4[4];
Math3D.MatrixIdentity4(mat4);
```

---

## Praxisbeispiele

### Entfernung zwischen zwei Spielern berechnen

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
            Print(string.Format("Spieler in der Nähe! Entfernung: %1m",
                vector.Distance(myPos, man.GetPosition())));
        }
    }
}
```

### Das nächste Objekt finden

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

### Ein Objekt entlang eines Pfades bewegen

```c
class PathMover
{
    protected ref array<vector> m_Waypoints;
    protected int m_CurrentWaypoint;
    protected float m_Progress; // 0.0 bis 1.0 zwischen Wegpunkten
    protected float m_Speed;    // Meter pro Sekunde

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
            return Update(0); // Mit dem nächsten Segment neu berechnen
        }

        return vector.Lerp(from, to, m_Progress);
    }
}
```

### Einen Spawn-Ring um einen Punkt berechnen

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

## Bewährte Praktiken

- Verwenden Sie `vector.DistanceSq()` und vergleichen Sie mit `radius * radius` in engen Schleifen -- es vermeidet die teure `sqrt`-Operation in `Distance()`.
- Multiplizieren Sie immer mit `Math.DEG2RAD`, bevor Sie Winkel an `Sin()`/`Cos()` übergeben -- alle trigonometrischen Funktionen arbeiten in Radiant.
- Prüfen Sie `v.Length() > 0`, bevor Sie `Normalize()` aufrufen -- das Normalisieren eines Nulllänge-Vektors erzeugt `NaN`-Werte.
- Verwenden Sie `Math.Clamp()`, um Gesundheits-, Schadens- und UI-Werte zu begrenzen, anstatt manuelle `if`-Ketten zu schreiben.
- Bevorzugen Sie `Math.RandomIntInclusive()`, wenn der Maximalwert erreichbar sein soll (z.B. Würfelwürfe) -- bei `RandomInt()` ist das Maximum exklusiv.

---

## In echten Mods beobachtet

> Muster bestätigt durch die Untersuchung professioneller DayZ-Mod-Quellcodes.

| Muster | Mod | Detail |
|---------|-----|--------|
| `DistanceSq` mit vorquadriertem Schwellenwert | Expansion / COT | Näherungsprüfungen speichern `float maxDistSq = range * range` und vergleichen mit `DistanceSq` |
| `Math.Atan2(dx, dz) * RAD2DEG` für Kurs | Expansion AI | Richtung-zum-Ziel berechnet als Winkel in Grad für Orientierungszuweisung |
| `Math.RandomFloat(0, Math.PI2)` für Spawn-Ring | Dabs / Expansion | Zufälliger Winkel + `Cos`/`Sin` um kreisförmige Spawn-Positionen zu generieren |
| `Math.Clamp` bei Gesundheits-/Schadenswerten | VPP / COT | Jede Schadensanwendung begrenzt das Ergebnis auf `[0, maxHealth]`, um negative oder Überlaufwerte zu verhindern |

---

## Theorie vs. Praxis

| Konzept | Theorie | Realität |
|---------|---------|---------|
| `Math.RandomInt(0, 10)` | Man könnte 0-10 inklusiv erwarten | Maximum ist exklusiv -- gibt 0-9 zurück; verwenden Sie `RandomIntInclusive` für inklusives Maximum |
| `vector[1]` ist die Y-Achse | Standard-XYZ-Zuordnung | In DayZ ist Y die vertikale Höhe -- leicht mit Z-nach-oben-Konventionen anderer Engines zu verwechseln |
| `Math.SqrFloat` vs `Math.Sqrt` | Namen sehen ähnlich aus | `SqrFloat(5)` = 25 (quadriert den Wert), `Sqrt(25)` = 5 (Quadratwurzel) -- entgegengesetzte Operationen |

---

## Häufige Fehler

| Fehler | Problem | Lösung |
|---------|---------|-----|
| Grad an `Math.Sin()` / `Math.Cos()` übergeben | Trigonometrische Funktionen erwarten Radiant | Zuerst mit `Math.DEG2RAD` multiplizieren |
| `Math.RandomInt(0, 10)` verwenden und 10 erwarten | Maximum ist exklusiv | Verwenden Sie `Math.RandomIntInclusive(0, 10)` für inklusives Maximum |
| `vector.Distance()` in einer engen Schleife berechnen | `Distance` verwendet `sqrt`, was langsam ist | Verwenden Sie `vector.DistanceSq()` und vergleichen Sie mit quadrierter Entfernung |
| Einen Nulllänge-Vektor normalisieren | Division durch null, erzeugt NaN | Prüfen Sie `v.Length() > 0` vor dem Normalisieren |
| Vergessen, dass DayZ Y nach oben ist | `pos[1]` ist Höhe, nicht Z | `[0]` = X (Osten), `[1]` = Y (Oben), `[2]` = Z (Norden) |
| `Lerp` mit t außerhalb von [0,1] verwenden | Extrapoliert über den Bereich hinaus | Begrenzen Sie t mit `Math.Clamp(t, 0, 1)` |
| `SqrFloat` mit `Sqrt` verwechseln | `SqrFloat` quadriert den Wert; `Sqrt` zieht die Quadratwurzel | `Math.SqrFloat(5)` = 25, `Math.Sqrt(25)` = 5 |

---

## Kurzreferenz

```c
// Konstanten
Math.PI  Math.PI2  Math.PI_HALF  Math.EULER  Math.DEG2RAD  Math.RAD2DEG

// Zufall
Math.RandomInt(min, max)              // [min, max)
Math.RandomIntInclusive(min, max)     // [min, max]
Math.RandomFloat(min, max)            // [min, max)
Math.RandomFloatInclusive(min, max)   // [min, max]
Math.RandomFloat01()                  // [0, 1]
Math.RandomBool()
Math.Randomize(-1)                    // Von der Zeit initialisieren

// Runden
Math.Round(f)  Math.Floor(f)  Math.Ceil(f)

// Absolutwert & Vorzeichen
Math.AbsFloat(f)  Math.AbsInt(i)  Math.SignFloat(f)  Math.SignInt(i)

// Potenz & Wurzel
Math.Pow(base, exp)  Math.Sqrt(f)  Math.Log2(f)  Math.SqrFloat(f)

// Trigonometrie (Radiant)
Math.Sin(r) Math.Cos(r) Math.Tan(r) Math.Asin(f) Math.Acos(f) Math.Atan2(y, x)

// Clamp & Interpolation
Math.Clamp(val, min, max)  Math.Min(a, b)  Math.Max(a, b)
Math.Lerp(a, b, t)  Math.InverseLerp(a, b, val)
Math.SmoothCD(cur, target, vel, smoothTime, maxSpeed, dt)
Math.IsInRange(val, min, max)

// Winkel
Math.NormalizeAngle(deg)  Math.DiffAngle(a, b)

// Vektor
vector.Distance(a, b)    vector.DistanceSq(a, b)
vector.Direction(from, to)
vector.Dot(a, b)          vector.Lerp(a, b, t)
vector.RotateAroundZeroDeg(vec, axis, angleDeg)
vector.RandomDir()        vector.RandomDir2D()
v.Length()  v.LengthSq()  v.Normalized()  v.Normalize()

// Vektor-Konstanten
vector.Zero  vector.Up  vector.Aside  vector.Forward
```

---

[<< 1.6: String-Operationen](06-strings.md) | [Startseite](../README.md) | [1.8: Speicherverwaltung >>](08-memory-management.md)
