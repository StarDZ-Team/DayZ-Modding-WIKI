# Chapitre 1.7 : Math & Opérations vectorielles

[Accueil](../README.md) | [<< Précédent : Opérations sur les chaînes](06-strings.md) | **Math & Opérations vectorielles** | [Suivant : Gestion de la mémoire >>](08-memory-management.md)

---

## Introduction

Le modding DayZ nécessite fréquemment des calculs mathématiques : trouver la distance entre des joueurs, randomiser les positions de spawn, interpoler les mouvements de caméra, calculer les angles pour le ciblage IA. Enforce Script fournit la classe `Math` pour les opérations scalaires et le type `vector` avec des helpers statiques pour les mathématiques 3D. Ce chapitre est une référence complète pour les deux, organisée par catégorie.

---

## Classe Math

Toutes les méthodes de la classe `Math` sont **statiques**. Vous les appelez avec `Math.NomDeLaMethode()`.

### Constantes

| Constante | Valeur | Description |
|-----------|--------|-------------|
| `Math.PI` | 3.14159265... | Pi |
| `Math.PI2` | 6.28318530... | 2 * Pi (cercle complet en radians) |
| `Math.PI_HALF` | 1.57079632... | Pi / 2 (quart de cercle) |
| `Math.EULER` | 2.71828182... | Nombre d'Euler |
| `Math.DEG2RAD` | 0.01745329... | Multiplier les degrés par ceci pour obtenir des radians |
| `Math.RAD2DEG` | 57.29577951... | Multiplier les radians par ceci pour obtenir des degrés |

```c
// Convertir 90 degrés en radians
float rad = 90 * Math.DEG2RAD; // 1.5707...

// Convertir PI radians en degrés
float deg = Math.PI * Math.RAD2DEG; // 180.0
```

---

### Nombres aléatoires

```c
// Entier aléatoire dans l'intervalle [min, max) -- max est EXCLUSIF
int roll = Math.RandomInt(0, 10);           // 0 à 9

// Entier aléatoire dans l'intervalle [min, max] -- max est INCLUSIF
int dice = Math.RandomIntInclusive(1, 6);   // 1 à 6

// Flottant aléatoire dans l'intervalle [min, max) -- max est EXCLUSIF
float rf = Math.RandomFloat(0.0, 1.0);

// Flottant aléatoire dans l'intervalle [min, max] -- max est INCLUSIF
float rf2 = Math.RandomFloatInclusive(0.0, 1.0);

// Flottant aléatoire [0, 1] inclusif (raccourci)
float chance = Math.RandomFloat01();

// Bool aléatoire
bool coinFlip = Math.RandomBool();

// Initialiser le générateur de nombres aléatoires (-1 s'initialise depuis l'heure système)
Math.Randomize(-1);
```

#### Exemple DayZ : Chance de loot aléatoire

```c
bool ShouldSpawnRareLoot(float rarity)
{
    // rarity : 0.0 = jamais, 1.0 = toujours
    return Math.RandomFloat01() < rarity;
}

// 15% de chance pour une arme rare
if (ShouldSpawnRareLoot(0.15))
{
    GetGame().CreateObject("VSS", position, false, false, true);
}
```

#### Exemple DayZ : Position aléatoire dans un rayon

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

### Arrondis

```c
float rounded = Math.Round(5.6);   // 6.0
float rounded2 = Math.Round(5.4);  // 5.0
float floored = Math.Floor(5.9);   // 5.0
float ceiled = Math.Ceil(5.1);     // 6.0
```

#### Exemple DayZ : Placement de construction aligné sur la grille

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

### Valeur absolue & Signe

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

### Puissance, Racine & Logarithme

```c
float pw = Math.Pow(2, 10);        // 1024.0
float sq = Math.Sqrt(25);          // 5.0
float lg = Math.Log2(8);           // 3.0
```

---

### Trigonométrie

Toutes les fonctions trigonométriques fonctionnent en **radians**. Utilisez `Math.DEG2RAD` et `Math.RAD2DEG` pour convertir.

```c
// Trigonométrie de base
float s = Math.Sin(Math.PI / 4);     // ~0.707
float c = Math.Cos(Math.PI / 4);     // ~0.707
float t = Math.Tan(Math.PI / 4);     // ~1.0

// Trigonométrie inverse
float asin = Math.Asin(0.5);         // ~0.5236 rad (30 degrés)
float acos = Math.Acos(0.5);         // ~1.0472 rad (60 degrés)

// Atan2 -- angle depuis l'axe x vers le point (y, x)
float angle = Math.Atan2(1, 1);      // PI/4 (~0.785 rad = 45 degrés)
```

#### Exemple DayZ : Angle de direction entre deux positions

```c
float GetAngleBetween(vector from, vector to)
{
    float dx = to[0] - from[0];
    float dz = to[2] - from[2];
    float angleRad = Math.Atan2(dx, dz);
    return angleRad * Math.RAD2DEG; // Retourne en degrés
}
```

#### Exemple DayZ : Placer des objets en cercle

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

### Bornage & Min/Max

```c
// Borner une valeur à un intervalle
float clamped = Math.Clamp(15, 0, 10);  // 10 (plafonné au max)
float clamped2 = Math.Clamp(-5, 0, 10); // 0  (plafonné au min)
float clamped3 = Math.Clamp(5, 0, 10);  // 5  (dans l'intervalle)

// Min et Max
float mn = Math.Min(3, 7);              // 3
float mx = Math.Max(3, 7);              // 7

// Vérifier si une valeur est dans l'intervalle
bool inRange = Math.IsInRange(5, 0, 10); // true
bool outRange = Math.IsInRange(15, 0, 10); // false
```

#### Exemple DayZ : Borner la santé du joueur

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
// Interpolation linéaire (Lerp)
// Retourne a + (b - a) * t, où t est [0, 1]
float lerped = Math.Lerp(0, 100, 0.5);     // 50
float lerped2 = Math.Lerp(0, 100, 0.25);   // 25

// Inverse Lerp -- trouve la valeur t
// Retourne (value - a) / (b - a)
float t = Math.InverseLerp(0, 100, 50);    // 0.5
float t2 = Math.InverseLerp(0, 100, 75);   // 0.75
```

#### SmoothCD (Amortissement critique lisse)

`SmoothCD` fournit une interpolation lisse et indépendante du framerate. C'est le meilleur choix pour le lissage de caméra, les animations UI et toute valeur qui doit approcher une cible graduellement sans oscillation.

```c
// SmoothCD(current, target, velocity, smoothTime, maxSpeed, dt)
// velocity est passé par référence et mis à jour à chaque appel
float currentVal = 0;
float velocity = 0;
float target = 100;
float smoothTime = 0.3;

// Appelé à chaque frame :
currentVal = Math.SmoothCD(currentVal, target, velocity, smoothTime, 1000, 0.016);
```

#### Exemple DayZ : Zoom de caméra lisse

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

### Opérations sur les angles

```c
// Normaliser un angle à [0, 360)
float norm = Math.NormalizeAngle(370);   // 10
float norm2 = Math.NormalizeAngle(-30);  // 330

// Différence entre deux angles (chemin le plus court)
float diff = Math.DiffAngle(350, 10);   // -20
float diff2 = Math.DiffAngle(10, 350);  // 20
```

---

### Carré & Modulo

```c
// Carré (plus rapide que Pow(x, 2))
float sqf = Math.SqrFloat(5);          // 25.0
int sqi = Math.SqrInt(5);              // 25

// Modulo flottant
float mod = Math.ModFloat(5.5, 2.0);   // 1.5

// Enrouler un entier dans un intervalle
int wrapped = Math.WrapInt(12, 0, 10);  // 2
int wrapped2 = Math.WrapInt(-1, 0, 10); // 9
```

---

## Type vector

Le type `vector` est un type valeur intégré avec trois composantes flottantes (x, y, z). Il est utilisé partout dans DayZ pour les positions, directions, orientations et échelles.

### Créer des vecteurs

```c
// Initialisation par chaîne (x y z séparés par des espaces)
vector pos = "100.5 0 200.3";

// Fonction constructeur
vector pos2 = Vector(100.5, 0, 200.3);

// Valeur par défaut (vecteur zéro)
vector zero;           // "0 0 0"
```

### Accéder aux composantes

```c
vector pos = Vector(10, 25, 30);

float x = pos[0]; // 10
float y = pos[1]; // 25 (hauteur dans DayZ)
float z = pos[2]; // 30

pos[1] = 50.0;    // Définir la composante y
```

> **Système de coordonnées DayZ :** `[0]` est Est-Ouest (X), `[1]` est la hauteur (Y), `[2]` est Nord-Sud (Z).

### Constantes vectorielles

| Constante | Valeur | Description |
|-----------|--------|-------------|
| `vector.Zero` | `"0 0 0"` | Vecteur zéro (origine) |
| `vector.Up` | `"0 1 0"` | Pointe vers le haut |
| `vector.Aside` | `"1 0 0"` | Pointe vers l'est (X+) |
| `vector.Forward` | `"0 0 1"` | Pointe vers le nord (Z+) |

---

### Opérations vectorielles (Méthodes statiques)

#### Distance

```c
vector a = Vector(0, 0, 0);
vector b = Vector(100, 0, 100);

float dist = vector.Distance(a, b);     // ~141.42
float distSq = vector.DistanceSq(a, b); // 20000 (pas de sqrt, plus rapide)
```

> **Astuce performance :** Utilisez `DistanceSq` quand vous comparez des distances. Comparer des valeurs au carré évite le calcul coûteux de la racine carrée.

```c
// BON -- comparer les distances au carré
float maxDistSq = 100 * 100; // 10000
if (vector.DistanceSq(playerPos, targetPos) < maxDistSq)
{
    Print("Target is within 100m");
}

// PLUS LENT -- calculer la distance réelle
if (vector.Distance(playerPos, targetPos) < 100)
{
    Print("Target is within 100m");
}
```

#### Direction

Retourne le vecteur de direction d'un point vers un autre (non normalisé).

```c
vector dir = vector.Direction(from, to);
// Équivalent à : to - from
```

#### Produit scalaire

```c
float dot = vector.Dot(a, b);
// dot > 0 : les vecteurs pointent dans des directions similaires
// dot = 0 : les vecteurs sont perpendiculaires
// dot < 0 : les vecteurs pointent dans des directions opposées
```

#### Exemple DayZ : La cible est-elle devant le joueur ?

```c
bool IsTargetInFront(PlayerBase player, vector targetPos)
{
    vector playerDir = player.GetDirection();
    vector toTarget = vector.Direction(player.GetPosition(), targetPos);
    toTarget.Normalize();

    float dot = vector.Dot(playerDir, toTarget);
    return dot > 0; // Positif signifie devant
}
```

#### Normaliser

Convertit un vecteur en longueur unitaire (longueur de 1).

```c
vector dir = Vector(3, 0, 4);
float len = dir.Length();      // 5.0

vector norm = dir.Normalized(); // Vector(0.6, 0, 0.8)
// norm.Length() == 1.0

// Normalisation sur place
dir.Normalize();
// dir est maintenant Vector(0.6, 0, 0.8)
```

#### Longueur

```c
vector v = Vector(3, 4, 0);
float len = v.Length();        // 5.0
float lenSq = v.LengthSq();   // 25.0 (plus rapide, pas de sqrt)
```

#### Lerp (statique)

Interpolation linéaire entre deux vecteurs.

```c
vector start = Vector(0, 0, 0);
vector end = Vector(100, 50, 200);

vector mid = vector.Lerp(start, end, 0.5);
// mid = Vector(50, 25, 100)

vector quarter = vector.Lerp(start, end, 0.25);
// quarter = Vector(25, 12.5, 50)
```

#### RotateAroundZeroDeg (statique)

Fait pivoter un vecteur autour d'un axe d'un angle donné en degrés.

```c
vector original = Vector(1, 0, 0); // pointe vers l'est
vector axis = Vector(0, 1, 0);     // pivoter autour de l'axe Y
float angle = 90;                  // 90 degrés

vector rotated = vector.RotateAroundZeroDeg(original, axis, angle);
// rotated est approximativement Vector(0, 0, 1) -- pointe maintenant vers le nord
```

#### Direction aléatoire

```c
vector rdir = vector.RandomDir();    // Direction 3D aléatoire (vecteur unitaire)
vector rdir2d = vector.RandomDir2D(); // Direction aléatoire dans le plan XZ
```

---

### Arithmétique vectorielle

Les vecteurs supportent les opérateurs arithmétiques standards :

```c
vector a = Vector(1, 2, 3);
vector b = Vector(4, 5, 6);

vector sum = a + b;         // Vector(5, 7, 9)
vector diff = a - b;        // Vector(-3, -3, -3)
vector scaled = a * 2;      // Vector(2, 4, 6)

// Déplacer une position vers l'avant
vector pos = player.GetPosition();
vector dir = player.GetDirection();
vector ahead = pos + dir * 5; // 5 mètres devant le joueur
```

### Convertir un vecteur en chaîne

```c
vector pos = Vector(100.5, 25.3, 200.7);
string s = pos.ToString(); // "<100.5, 25.3, 200.7>"
```

---

## Classe Math3D

Pour les opérations 3D avancées, la classe `Math3D` fournit des utilitaires de matrice et de rotation.

```c
// Créer une matrice de rotation à partir de yaw/pitch/roll (degrés)
vector mat[3];
Math3D.YawPitchRollMatrix("45 0 0", mat);

// Convertir une matrice de rotation en angles
vector angles = Math3D.MatrixToAngles(mat);

// Matrice identité (4x4)
vector mat4[4];
Math3D.MatrixIdentity4(mat4);
```

---

## Exemples du monde réel

### Calculer la distance entre deux joueurs

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

### Trouver l'objet le plus proche

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

### Déplacer un objet le long d'un chemin

```c
class PathMover
{
    protected ref array<vector> m_Waypoints;
    protected int m_CurrentWaypoint;
    protected float m_Progress; // 0.0 à 1.0 entre les waypoints
    protected float m_Speed;    // mètres par seconde

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
            return Update(0); // Recalculer avec le segment suivant
        }

        return vector.Lerp(from, to, m_Progress);
    }
}
```

### Calculer un anneau de spawn autour d'un point

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

## Bonnes pratiques

- Utilisez `vector.DistanceSq()` et comparez contre `radius * radius` dans les boucles serrées -- cela évite le `sqrt` coûteux à l'intérieur de `Distance()`.
- Multipliez toujours par `Math.DEG2RAD` avant de passer des angles à `Sin()`/`Cos()` -- toutes les fonctions trig fonctionnent en radians.
- Vérifiez `v.Length() > 0` avant d'appeler `Normalize()` -- normaliser un vecteur de longueur zéro produit des valeurs `NaN`.
- Utilisez `Math.Clamp()` pour borner la santé, les dégâts et les valeurs UI plutôt que d'écrire des chaînes `if` manuelles.
- Préférez `Math.RandomIntInclusive()` quand la valeur max doit être atteignable (par exemple, les lancers de dés) -- le max de `RandomInt()` est exclusif.

---

## Observé dans les mods réels

> Patterns confirmés par l'étude du code source de mods DayZ professionnels.

| Pattern | Mod | Détail |
|---------|-----|--------|
| `DistanceSq` avec seuil pré-carré | Expansion / COT | Les vérifications de proximité stockent `float maxDistSq = range * range` et comparent avec `DistanceSq` |
| `Math.Atan2(dx, dz) * RAD2DEG` pour le cap | Expansion AI | La direction vers la cible est calculée comme angle en degrés pour l'assignation d'orientation |
| `Math.RandomFloat(0, Math.PI2)` pour l'anneau de spawn | Dabs / Expansion | Angle aléatoire + `Cos`/`Sin` pour générer des positions de spawn circulaires |
| `Math.Clamp` sur les valeurs de santé/dégâts | VPP / COT | Chaque application de dégâts borne le résultat à `[0, maxHealth]` pour empêcher les valeurs négatives ou le dépassement |

---

## Théorie vs Pratique

| Concept | Théorie | Réalité |
|---------|---------|---------|
| `Math.RandomInt(0, 10)` | On pourrait s'attendre à 0-10 inclusif | Le max est exclusif -- retourne 0-9 ; utilisez `RandomIntInclusive` pour un max inclusif |
| `vector[1]` est l'axe Y | Mapping XYZ standard | Dans DayZ, Y est la hauteur verticale -- facile à confondre avec les conventions Z-up d'autres moteurs |
| `Math.SqrFloat` vs `Math.Sqrt` | Les noms semblent similaires | `SqrFloat(5)` = 25 (met au carré la valeur), `Sqrt(25)` = 5 (racine carrée) -- opérations opposées |

---

## Erreurs courantes

| Erreur | Problème | Solution |
|--------|----------|----------|
| Passer des degrés à `Math.Sin()` / `Math.Cos()` | Les fonctions trig attendent des radians | Multipliez par `Math.DEG2RAD` d'abord |
| Utiliser `Math.RandomInt(0, 10)` en s'attendant à 10 | Le max est exclusif | Utilisez `Math.RandomIntInclusive(0, 10)` pour un max inclusif |
| Calculer `vector.Distance()` dans une boucle serrée | `Distance` utilise `sqrt`, qui est lent | Utilisez `vector.DistanceSq()` et comparez contre la distance au carré |
| Normaliser un vecteur de longueur zéro | Division par zéro, produit NaN | Vérifiez `v.Length() > 0` avant de normaliser |
| Oublier que le Y de DayZ est vers le haut | `pos[1]` est la hauteur, pas Z | `[0]` = X (Est), `[1]` = Y (Haut), `[2]` = Z (Nord) |
| Utiliser `Lerp` avec t en dehors de [0,1] | Extrapole au-delà de l'intervalle | Bornez t avec `Math.Clamp(t, 0, 1)` |
| Confondre `SqrFloat` avec `Sqrt` | `SqrFloat` met au carré la valeur ; `Sqrt` prend la racine carrée | `Math.SqrFloat(5)` = 25, `Math.Sqrt(25)` = 5 |

---

## Référence rapide

```c
// Constantes
Math.PI  Math.PI2  Math.PI_HALF  Math.EULER  Math.DEG2RAD  Math.RAD2DEG

// Aléatoire
Math.RandomInt(min, max)              // [min, max)
Math.RandomIntInclusive(min, max)     // [min, max]
Math.RandomFloat(min, max)            // [min, max)
Math.RandomFloatInclusive(min, max)   // [min, max]
Math.RandomFloat01()                  // [0, 1]
Math.RandomBool()
Math.Randomize(-1)                    // Graine depuis l'heure

// Arrondis
Math.Round(f)  Math.Floor(f)  Math.Ceil(f)

// Absolu & Signe
Math.AbsFloat(f)  Math.AbsInt(i)  Math.SignFloat(f)  Math.SignInt(i)

// Puissance & Racine
Math.Pow(base, exp)  Math.Sqrt(f)  Math.Log2(f)  Math.SqrFloat(f)

// Trig (radians)
Math.Sin(r) Math.Cos(r) Math.Tan(r) Math.Asin(f) Math.Acos(f) Math.Atan2(y, x)

// Bornage & Interpolation
Math.Clamp(val, min, max)  Math.Min(a, b)  Math.Max(a, b)
Math.Lerp(a, b, t)  Math.InverseLerp(a, b, val)
Math.SmoothCD(cur, target, vel, smoothTime, maxSpeed, dt)
Math.IsInRange(val, min, max)

// Angle
Math.NormalizeAngle(deg)  Math.DiffAngle(a, b)

// Vecteur
vector.Distance(a, b)    vector.DistanceSq(a, b)
vector.Direction(from, to)
vector.Dot(a, b)          vector.Lerp(a, b, t)
vector.RotateAroundZeroDeg(vec, axis, angleDeg)
vector.RandomDir()        vector.RandomDir2D()
v.Length()  v.LengthSq()  v.Normalized()  v.Normalize()

// Constantes vectorielles
vector.Zero  vector.Up  vector.Aside  vector.Forward
```

---

[<< 1.6 : Opérations sur les chaînes](06-strings.md) | [Accueil](../README.md) | [1.8 : Gestion de la mémoire >>](08-memory-management.md)
