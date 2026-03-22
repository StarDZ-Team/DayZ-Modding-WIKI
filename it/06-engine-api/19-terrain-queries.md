# Capitolo 6.19: Terrain & World Queries

[Home](../../README.md) | [<< Precedente: Animation System](18-animation-system.md) | **Terrain & World Queries**

---

## Introduzione

Every spatial operation in DayZ --- spawning objects on the ground, checking line of sight, detecting nearby entities, determining surface type for footstep sounds --- depends on querying the world. The engine exposes three categories of spatial API: **terrain queries** (height, surface type, normals), **object queries** (finding entities near a position), and **raycasting** (tracing a line through the world to detect collisions). This chapter documents every available method, its exact signature, and the practical patterns found in vanilla code.

All terrain and surface functions live on the `CGame` class, accessed via `GetGame()` or the global `g_Game`. Raycasting is provided by the static `DayZPhysics` class. World state (time, date, coordinates) is accessed through the `World` object returned by `GetGame().GetWorld()`.

---

## Terrain Height Queries

### SurfaceY --- Ground Height at X,Z

The most commonly used terrain query. Returns the Y (vertical) coordinate of the terrain at a given X,Z position. This ignores objects, roads, and water --- it returns raw terrain height only.

```c
// Signature (CGame)
proto native float SurfaceY(float x, float z);
```

**Utilizzo:**

```c
// Get terrain height at a world position
float groundY = GetGame().SurfaceY(x, z);

// Snap a position to the ground
vector pos = "100 0 200";
pos[1] = GetGame().SurfaceY(pos[0], pos[2]);

// Common pattern: spawn position adjustment
vector spawnPos = somePosition;
spawnPos[1] = GetGame().SurfaceY(spawnPos[0], spawnPos[2]);
```

**Vanilla example** (`effectarea.c`):

```c
partPos[1] = g_Game.SurfaceY(partPos[0], partPos[2]); // Snap particles to ground
```

### SurfaceRoadY --- Height Including Roads

Returns height including road surfaces (bridges, elevated roads). Use this when you need the actual walkable surface, not raw terrain.

```c
// Signatures (CGame)
proto native float SurfaceRoadY(float x, float z, RoadSurfaceDetection rsd = RoadSurfaceDetection.LEGACY);
proto native float SurfaceRoadY3D(float x, float y, float z, RoadSurfaceDetection rsd);
```

The `RoadSurfaceDetection` enum controls search direction:

```c
enum RoadSurfaceDetection
{
    UNDER,    // Find nearest surface under given point
    ABOVE,    // Find nearest surface above given point
    CLOSEST,  // Find nearest surface to given point
    LEGACY,   // UNDER but without proxy support (default)
}
```

### GetSurface --- Modern Surface Detection API

The newer, more flexible surface detection API that combines height, normal, and surface type into one call.

```c
// Signature (CGame)
proto native bool GetSurface(SurfaceDetectionParameters params, SurfaceDetectionResult result);
```

**Parameter class:**

```c
class SurfaceDetectionParameters
{
    SurfaceDetectionType type = SurfaceDetectionType.Scenery; // Scenery or Roadway
    vector position;                                          // 3D position to trace from
    bool includeWater = false;                                // Return water if higher than surface
    UseObjectsMode syncMode = UseObjectsMode.Wait;            // Wait, NoWait, or NoLock
    Object ignore = null;                                     // Object to ignore (Roadway only)
    RoadSurfaceDetection rsd = RoadSurfaceDetection.ABOVE;    // Search direction (Roadway only)
};
```

**Result class:**

```c
class SurfaceDetectionResult
{
    float height = 0;          // Y position of detected surface
    float normalX = 0;         // Surface normal X component
    float normalZ = 0;         // Surface normal Z component
    SurfaceInfo surface = null; // Surface material info handle
    bool aboveWater = false;   // Whether water was the returned surface
};
```

**Vanilla example** (`transport.c`):

```c
VehicleFlippedContext ctx;
ctx.m_SurfaceParams = new SurfaceDetectionParameters();
ctx.m_SurfaceResult = new SurfaceDetectionResult();
ctx.m_SurfaceParams.rsd = RoadSurfaceDetection.CLOSEST;
ctx.m_SurfaceParams.position = corners[i];
g_Game.GetSurface(ctx.m_SurfaceParams, ctx.m_SurfaceResult);
```

### GetHighestSurfaceYDifference

Utility method on `CGame` that returns the largest height difference between a set of positions. Useful for slope checks.

```c
float GetHighestSurfaceYDifference(array<vector> positions);
```

---

## Surface Type Queries

### SurfaceGetType --- Material at Position

Returns the surface material name at a given X,Z coordinate. The return value is the Y position where the surface was found.

```c
// Signatures (CGame)
proto float SurfaceGetType(float x, float z, out string type);
proto float SurfaceGetType3D(float x, float y, float z, out string type);
```

**Utilizzo:**

```c
string surfaceType;
GetGame().SurfaceGetType(x, z, surfaceType);
// surfaceType is now e.g.: "cp_gravel", "cp_concrete", "cp_grass",
//   "cp_dirt", "cp_broadleaf_dense1", "cp_asphalt", etc.
```

**Vanilla example** (`carscript.c`):

```c
string surface;
g_Game.SurfaceGetType(wheelPos[0], wheelPos[2], surface);
```

The `3D` variant traces downward from the given Y position, useful when you want to detect the surface under a specific height (e.g., under a bridge):

```c
// Detect surface at exact 3D position
string surfaceType;
g_Game.SurfaceGetType3D(pos[0], pos[1], pos[2], surfaceType);
```

### SurfaceUnderObject --- Material Under an Entity

Returns the surface type and liquid type directly under a specific object.

```c
// Signatures (CGame)
proto void SurfaceUnderObject(notnull Object object, out string type, out int liquidType);
proto void SurfaceUnderObjectEx(notnull Object object, out string type, out string impact, out int liquidType);
proto void SurfaceUnderObjectByBone(notnull Object object, int boneType, out string type, out int liquidType);
```

There are also `CorrectedLiquid` variants that normalize the liquid type values:

```c
void SurfaceUnderObjectCorrectedLiquid(notnull Object object, out string type, out int liquidType);
void SurfaceUnderObjectExCorrectedLiquid(notnull Object object, out string type, out string impact, out int liquidType);
void SurfaceUnderObjectByBoneCorrectedLiquid(notnull Object object, int boneType, out string type, out int liquidType);
```

### Surface Normal --- Slope Direction

Returns the normal vector of the terrain surface, pointing away from the ground. Essential for aligning objects to slopes.

```c
// Signature (CGame)
proto native vector SurfaceGetNormal(float x, float z);
```

**Utilizzo:**

```c
vector normal = GetGame().SurfaceGetNormal(x, z);
// normal is approximately "0 1 0" on flat ground
// On a slope, X and Z components indicate tilt direction
```

**Vanilla example** (`hologram.c` --- building placement):

```c
normal = g_Game.SurfaceGetNormal(projection_position[0], projection_position[2]);
vector angles = normal.VectorToAngles();
angles[1] = angles[1] + 270; // Correct rotation for vertical alignment
```

### GetSurfaceOrientation --- Tilt as Angles

A convenience method on `CGame` that converts the surface normal to Euler angles, ready for `SetOrientation()`.

```c
vector GetSurfaceOrientation(float x, float z)
{
    vector normal = g_Game.SurfaceGetNormal(x, z);
    vector angles = normal.VectorToAngles();
    angles[1] = angles[1] + 270;
    return angles;
}
```

### SurfaceGetNoiseMultiplier

Returns a noise multiplier for a surface at a given position, used by the stealth/sound system.

```c
proto native float SurfaceGetNoiseMultiplier(Object directHit, vector pos, int componentIndex);
```

---

## Water Queries

### Sea and Pond Detection

```c
// Signatures (CGame)
proto native bool SurfaceIsSea(float x, float z);    // True if position is over the sea
proto native bool SurfaceIsPond(float x, float z);    // True if position is over a pond/lake
```

There is no single `SurfaceIsWater` function in il motore. To check for any water, combine both:

```c
bool IsOverWater(float x, float z)
{
    return GetGame().SurfaceIsSea(x, z) || GetGame().SurfaceIsPond(x, z);
}
```

### Sea Level and Wave Data

```c
// Signatures (CGame)
proto native float SurfaceGetSeaLevel();        // Current sea level height
proto native float SurfaceGetSeaLevelMin();     // Minimum sea level
proto native float SurfaceGetSeaLevelMax();     // Maximum sea level
proto native float SurfaceGetSeaWaveMax();      // Max sea wave height
proto native float SurfaceGetSeaWaveCurrent();  // Current sea wave height
```

### Water Depth

```c
// Signature (CGame)
proto native float GetWaterDepth(vector posWS);
```

Returns the water depth at a world-space position. Returns 0 or negative if the position is above water.

### Water Surface Height

```c
proto native float GetWaterSurfaceHeightNoFakeWave(vector posWS); // Without visual wave offset
proto native float GetWaterSurfaceHeight(vector posWS);           // With visual wave offset
```

---

## Object Queries

### GetObjectsAtPosition --- Cylinder Search

Finds all objects within a horizontal radius of a position. The search is a vertical cylinder (infinite height), meaning objects above and below the position are included regardless of vertical distance.

```c
// Signatures (CGame)
proto native void GetObjectsAtPosition(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargos);
proto native void GetObjectsAtPosition3D(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargos);
```

The `3D` variant searches a sphere instead of a cylinder, respecting vertical distance.

**Utilizzo:**

```c
array<Object> objects = new array<Object>();
array<CargoBase> proxyCargo = new array<CargoBase>();
GetGame().GetObjectsAtPosition(position, radius, objects, proxyCargo);

// proxyCargo can be null if you don't need cargo info
GetGame().GetObjectsAtPosition(position, radius, objects, null);
```

**Vanilla examples:**

```c
// GeyserArea --- kill entities in area
array<Object> nearestObjects = new array<Object>();
g_Game.GetObjectsAtPosition(m_Position, m_Radius, nearestObjects, null);
foreach (Object obj : nearestObjects)
{
    // process objects...
}

// Bot hunt system --- find nearest target within 100m
array<Object> objects = new array<Object>;
array<CargoBase> proxyCargos = new array<CargoBase>;
g_Game.GetObjectsAtPosition(pos, 100.0, objects, proxyCargos);
```

> **ATTENZIONE: Performance.** `GetObjectsAtPosition` queries every object in range. A radius of 100m in a populated area can return hundreds or thousands of objects. Always:
> - Use the smallest radius that serves your purpose
> - Cache results; do not call ogni frame
> - Filter results immediately and discard the array
> - Prefer the `3D` variant when vertical filtering matters

---

## Raycasting --- DayZPhysics

Raycasting traces a line (or thick line) through the world and reports what it hits. DayZ provides several raycast methods on the static `DayZPhysics` class, each suited to different use cases.

### ObjIntersect Modes

Every raycast must specify which geometry to test against. These are definiscid in `3_game/constants.c`:

```c
enum ObjIntersect
{
    Fire,   // ObjIntersectFire(0):  Fire Geometry (bullet collision)
    View,   // ObjIntersectView(1):  View Geometry (visual/rendering)
    Geom,   // ObjIntersectGeom(2):  Geometry (physical collision)
    IFire,  // ObjIntersectIFire(3): Indirect Fire Geometry
    None    // ObjIntersectNone(4):  No geometry testing
}
```

| Mode | Use Case |
|------|----------|
| `ObjIntersectFire` | Bullet collision, damage traces |
| `ObjIntersectView` | Visual obstruction checks, action targeting |
| `ObjIntersectGeom` | Physical collision, placement validation |
| `ObjIntersectIFire` | Indirect fire geometry (rangefinder, raycaster item) |
| `ObjIntersectNone` | Ground-only raycasts |

### CollisionFlags

Controls what the raycast reports. Defined in `1_core/proto/endebug.c`:

```c
enum CollisionFlags
{
    FIRSTCONTACT,   // Stop at first hit (any), fastest
    NEARESTCONTACT, // Return only the nearest contact (default)
    ONLYSTATIC,     // Only static/terrain objects
    ONLYDYNAMIC,    // Only dynamic objects (players, items, vehicles)
    ONLYWATER,      // Only water components
    ALLOBJECTS,     // Return first contact for EACH object hit
}
```

### PhxInteractionLayers

Defines which physics layers participate in bullet-type raycasts. Defined in `3_game/global/dayzphysics.c`:

```c
enum PhxInteractionLayers
{
    NOCOLLISION,
    DEFAULT,
    BUILDING,
    CHARACTER,
    VEHICLE,
    DYNAMICITEM,
    DYNAMICITEM_NOCHAR,
    ROADWAY,
    VEHICLE_NOTERRAIN,
    CHARACTER_NO_GRAVITY,
    RAGDOLL_NO_CHARACTER,
    FIREGEOM,       // Redefinition of RAGDOLL_NO_CHARACTER
    DOOR,
    RAGDOLL,
    WATERLAYER,
    TERRAIN,
    GHOST,
    WORLDBOUNDS,
    FENCE,
    AI,
    AI_NO_COLLISION,
    AI_COMPLEX,
    TINYCAPSULE,
    TRIGGER,
    TRIGGER_NOTERRAIN,
    ITEM_SMALL,
    ITEM_LARGE,
    CAMERA,
    TEMP
};
```

Layers are combined with bitwise OR for `RayCastBullet` and related methods:

```c
PhxInteractionLayers hitMask = PhxInteractionLayers.BUILDING
    | PhxInteractionLayers.DOOR
    | PhxInteractionLayers.VEHICLE
    | PhxInteractionLayers.ROADWAY
    | PhxInteractionLayers.TERRAIN;
```

---

### RaycastRV --- Simple Raycast

The most commonly used raycast function. Traces a line and returns the first (or nearest) hit.

```c
// Signature (DayZPhysics)
proto static bool RaycastRV(
    vector begPos,
    vector endPos,
    out vector contactPos,
    out vector contactDir,
    out int contactComponent,
    set<Object> results = NULL,
    Object with = NULL,
    Object ignore = NULL,
    bool sorted = false,
    bool ground_only = false,
    int iType = ObjIntersectView,
    float radius = 0.0,
    CollisionFlags flags = CollisionFlags.NEARESTCONTACT
);
```

**Parametri:**

| Parametro | Tipo | Descrizione |
|-----------|------|-------------|
| `begPos` | `vector` | Start position of the ray |
| `endPos` | `vector` | End position of the ray |
| `contactPos` | `out vector` | World position of first contact |
| `contactDir` | `out vector` | Normal direction at contact point |
| `contactComponent` | `out int` | Index of hit component on the object |
| `results` | `set<Object>` | Set of all objects hit (can be NULL) |
| `with` | `Object` | Ignore collisions with this object |
| `ignore` | `Object` | Ignore collisions with this object |
| `sorted` | `bool` | Sort results by distance (only if `ground_only = false`) |
| `ground_only` | `bool` | Only test against the ground, ignore all objects |
| `iType` | `int` | Intersection mode (`ObjIntersectView`, etc.) |
| `radius` | `float` | Radius of the ray (0 = line, >0 = thick ray) |
| `flags` | `CollisionFlags` | What to report |

**Restituisce:** `true` if the ray hit something.

**Vanilla example** (rangefinder --- measure distance):

```c
vector from = g_Game.GetCurrentCameraPosition();
vector fromDirection = g_Game.GetCurrentCameraDirection();
vector to = from + (fromDirection * RANGEFINDER_MAX_DISTANCE);
vector contact_pos;
vector contact_dir;
int contactComponent;

bool hit = DayZPhysics.RaycastRV(
    from, to,
    contact_pos, contact_dir, contactComponent,
    NULL, NULL, player,
    false, false,
    ObjIntersectIFire
);

if (hit)
{
    float distance = vector.Distance(from, contact_pos);
}
```

**Vanilla example** (raycaster item --- visual beam):

```c
bool is_collision = DayZPhysics.RaycastRV(
    from, to,
    contact_pos, contact_dir, contactComponent,
    NULL, NULL, GetHierarchyRootPlayer(),
    false, false,
    ObjIntersectIFire
);
```

---

### RaycastRVProxy --- Structured Raycast

The structured version of raycasting that returns detailed results including proxy objects (attached items, vehicle parts), hierarchy levels, and surface information. Preferred for complex queries like action targeting.

```c
// Signature (DayZPhysics)
proto static bool RaycastRVProxy(
    notnull RaycastRVParams in,
    out notnull array<ref RaycastRVResult> results,
    array<Object> excluded = null
);
```

**RaycastRVParams** (input):

```c
class RaycastRVParams
{
    vector begPos;          // Start position
    vector endPos;          // End position
    Object ignore;          // Ignore this object
    Object with;            // Ignore collisions with this object
    float radius;           // Ray thickness (0 = line)
    CollisionFlags flags;   // Default: NEARESTCONTACT
    int type;               // Default: ObjIntersectView
    bool sorted;            // Default: false
    bool groundOnly;        // Default: false

    void RaycastRVParams(vector vBeg, vector vEnd, Object pIgnore = null, float fRadius = 0.0)
    {
        begPos = vBeg;
        endPos = vEnd;
        ignore = pIgnore;
        radius = fRadius;
        with       = null;
        flags      = CollisionFlags.NEARESTCONTACT;
        type       = ObjIntersectView;
        sorted     = false;
        groundOnly = false;
    }
};
```

**RaycastRVResult** (output --- one per hit):

```c
class RaycastRVResult
{
    Object obj;        // Object hit (NULL if terrain only). If hierLevel > 0, this is the proxy
    Object parent;     // If hierLevel > 0, the root parent of the proxy
    vector pos;        // World position of the collision
    vector dir;        // Normal direction at collision (or intersection direction)
    int hierLevel;     // 0 = landscape/world object, > 0 = proxy (attachment, component)
    int component;     // Index of component in the geometry level
    SurfaceInfo surface; // Surface material info handle
    bool entry;        // false if the start point was inside the object
    bool exit;         // false if the end point was inside the object
};
```

**Vanilla example** (action targeting --- find what player is looking at):

```c
RaycastRVParams rayInput = new RaycastRVParams(m_RayStart, m_RayEnd, m_Player);
rayInput.flags = CollisionFlags.ALLOBJECTS;
array<ref RaycastRVResult> results = new array<ref RaycastRVResult>;

if (DayZPhysics.RaycastRVProxy(rayInput, results))
{
    for (int i = 0; i < results.Count(); i++)
    {
        float distance = vector.DistanceSq(results[i].pos, m_RayStart);
        Object cursorTarget = results[i].obj;

        // Check if hit is a proxy (attachment on another object)
        if (results[i].hierLevel > 0)
        {
            // results[i].parent is the root object
        }
    }
}
```

**Vanilla example** (flashbang --- line-of-sight check with exclusions):

```c
array<Object> excluded = new array<Object>;
excluded.Insert(this); // Ignore the grenade itself
array<ref RaycastRVResult> results = new array<ref RaycastRVResult>;

RaycastRVParams rayParams = new RaycastRVParams(pos, headPos, excluded[0]);
rayParams.flags = CollisionFlags.ALLOBJECTS;
DayZPhysics.RaycastRVProxy(rayParams, results, excluded);
```

---

### RayCastBullet and SphereCastBullet --- Physics-Layer Raycasts

These use the physics interaction layer system instead of geometry intersection modes. They are more appropriate for bullet trajectory simulation and physics-aware queries.

```c
// Signatures (DayZPhysics)
proto static bool RayCastBullet(
    vector begPos, vector endPos,
    PhxInteractionLayers layerMask,
    Object ignoreObj,
    out Object hitObject,
    out vector hitPosition,
    out vector hitNormal,
    out float hitFraction
);

proto static bool SphereCastBullet(
    vector begPos, vector endPos,
    float radius,
    PhxInteractionLayers layerMask,
    Object ignoreObj,
    out Object hitObject,
    out vector hitPosition,
    out vector hitNormal,
    out float hitFraction
);
```

The `hitFraction` output is a value from 0.0 to 1.0 indicating where along the ray the hit occurred (0 = at start, 1 = at end).

**Vanilla example** (developer teleport):

```c
PhxInteractionLayers layers = 0;
layers |= PhxInteractionLayers.TERRAIN;
layers |= PhxInteractionLayers.BUILDING;
layers |= PhxInteractionLayers.VEHICLE;
layers |= PhxInteractionLayers.RAGDOLL;

Object hitObj;
vector hitPos, hitNormal;
float hitFraction;

if (DayZPhysics.SphereCastBullet(rayStart, rayEnd, 0.01, layers, ignore, hitObj, hitPos, hitNormal, hitFraction))
{
    // hitPos contains the world position of the hit
}
```

**Vanilla example** (target temperature debug --- find entity under cursor):

```c
PhxInteractionLayers hitMask = PhxInteractionLayers.BUILDING
    | PhxInteractionLayers.DOOR
    | PhxInteractionLayers.VEHICLE
    | PhxInteractionLayers.ROADWAY
    | PhxInteractionLayers.TERRAIN
    | PhxInteractionLayers.CHARACTER
    | PhxInteractionLayers.AI
    | PhxInteractionLayers.RAGDOLL
    | PhxInteractionLayers.RAGDOLL_NO_CHARACTER;
DayZPhysics.RayCastBullet(from, to, hitMask, player, obj, hitPos, hitNormal, hitFraction);
```

---

### Overlap Queries --- Volume Intersection Tests

`DayZPhysics` also provides overlap tests that check if a volume intersects any physics objects. All use the bullet physics layer system and return results through a callback.

```c
// Signatures (DayZPhysics)
proto static bool SphereOverlapBullet(vector position, float radius, PhxInteractionLayers layerMask, notnull CollisionOverlapCallback callback);
proto static bool CylinderOverlapBullet(vector transform[4], vector extents, PhxInteractionLayers layerMask, notnull CollisionOverlapCallback callback);
proto static bool CapsuleOverlapBullet(vector transform[4], float radius, float height, PhxInteractionLayers layerMask, notnull CollisionOverlapCallback callback);
proto static bool BoxOverlapBullet(vector transform[4], vector extents, PhxInteractionLayers layerMask, notnull CollisionOverlapCallback callback);
proto static bool EntityOverlapBullet(vector transform[4], IEntity entity, PhxInteractionLayers layerMask, notnull CollisionOverlapCallback callback);
proto static bool EntityOverlapSingleBullet(vector transform[4], IEntity entity, IEntity other, PhxInteractionLayers layerMask, notnull CollisionOverlapCallback callback);
proto static bool GeometryOverlapBullet(vector transform[4], dGeom geometry, PhxInteractionLayers layerMask, notnull CollisionOverlapCallback callback);
```

**Callback class:**

```c
class CollisionOverlapCallback : Managed
{
    bool OnContact(IEntity other, Contact contact)
    {
        return true; // Return true to continue checking, false to stop
    }
};
```

**Utilizzo:**

```c
class MyOverlapCallback : CollisionOverlapCallback
{
    ref array<IEntity> m_Hits = new array<IEntity>();

    override bool OnContact(IEntity other, Contact contact)
    {
        m_Hits.Insert(other);
        return true; // Continue checking
    }
};

MyOverlapCallback callback = new MyOverlapCallback();
DayZPhysics.SphereOverlapBullet(position, 5.0, PhxInteractionLayers.CHARACTER, callback);

foreach (IEntity hit : callback.m_Hits)
{
    // Process each entity in the sphere
}
```

---

### GetHitSurface --- Surface at Raycast Hit

Checks whether a specific surface type was hit between two points on an object.

```c
// Signatures (DayZPhysics)
proto static bool GetHitSurface(Object other, vector begPos, vector endPos, string surface);
proto static bool GetHitSurfaceAndLiquid(Object other, vector begPos, vector endPos, string surface, out int liquidType);
```

---

## Distance and Position Utilities

### vector.Distance and vector.DistanceSq

```c
// Exact distance between two points
float dist = vector.Distance(posA, posB);

// Squared distance --- MUCH faster, use for comparisons
float distSq = vector.DistanceSq(posA, posB);
```

**Always prefer `DistanceSq` for distance comparisons.** It avoids the expensive square root operation:

```c
// GOOD: compare squared distances
float maxRangeSq = maxRange * maxRange;
if (vector.DistanceSq(myPos, targetPos) < maxRangeSq)
{
    // Within range
}

// BAD: computing square root every check
if (vector.Distance(myPos, targetPos) < maxRange)
{
    // Works but slower
}
```

### Direction Vectors

```c
// Get direction from A to B (normalized)
vector dir = targetPos - myPos;
dir.Normalize();

// Get player's facing direction
vector playerDir = player.GetDirection();

// Convert angles to direction vector
vector dir = orientation.AnglesToVector();

// Convert direction to angles
vector angles = direction.VectorToAngles();
```

### Position Arithmetic

```c
// Offset a position along a direction
vector newPos = origin + (direction * distance);

// Get a position at eye level
vector eyePos = player.GetPosition() + "0 1.5 0";

// Vector component access
float x = pos[0];
float y = pos[1];
float z = pos[2];

// Create vector from components
vector v = Vector(x, y, z);
```

---

## World Queries

The `World` object provides access to time, date, geographic coordinates, and other global world state.

```c
World world = GetGame().GetWorld();
```

### Date and Time

```c
// Get current in-game date and time
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);

// Set in-game date and time (server only)
GetGame().GetWorld().SetDate(2024, 6, 15, 14, 30);

// Get world time in milliseconds (since world start)
float worldTimeMs = GetWorldTime(); // Global function from 1_Core
```

### Day/Night and Celestial

```c
// Check if it is currently nighttime
bool nighttime = GetGame().GetWorld().IsNight();

// Get sun/moon state (0 = full sun, 1 = full moon)
float sunOrMoon = GetGame().GetWorld().GetSunOrMoon();

// Moon brightness
float moonIntensity = GetGame().GetWorld().GetMoonIntensity();
```

### Geographic Coordinates

```c
// Get map latitude and longitude (affects sun position, season behavior)
float lat = GetGame().GetWorld().GetLatitude();
float lon = GetGame().GetWorld().GetLongitude();
```

### World Size and Grid

```c
// Get world size in meters (e.g., 15360 for Chernarus)
int worldSize = GetGame().GetWorld().GetWorldSize();

// Convert world position to grid coordinates
int gridX, gridZ;
GetGame().GetWorld().GetGridCoords(player.GetPosition(), 100, gridX, gridZ);
```

### World Name

```c
// Get the name of the currently loaded world
string worldName;
GetGame().GetWorldName(worldName);
// Returns: "chernarusplus", "enoch" (Livonia), etc.
```

---

## WorldData --- Environment Configuration

The `WorldData` class holds environment configuration for the current map: temperature curves, sunrise/sunset times, weather settings. It is subclassed per map (e.g., `ChernarusPlusData`, `EnochData`).

```c
// Access current WorldData (only available in 4_World and above)
WorldData worldData = g_Game.GetWorldData(); // if available
```

Key properties include monthly min/max temperatures, sunrise/sunset hours, and weather probability settings. These are set in the `Init()` method per map:

```c
m_Sunrise_Jan = 8.54;
m_Sunset_Jan = 15.52;
m_Sunrise_Jul = 3.26;
m_Sunset_Jul = 20.73;
m_MaxTemps = {3,5,7,14,19,24,26,25,21,16,10,5};
m_MinTemps = {-3,-2,0,4,9,14,18,17,12,7,4,0};
```

---

## Practical Examples

### Spawn an Object on the Ground

```c
void SpawnOnGround(string className, vector pos)
{
    // Snap Y to terrain
    pos[1] = GetGame().SurfaceY(pos[0], pos[2]);

    Object obj = GetGame().CreateObjectEx(className, pos, ECE_CREATEPHYSICS | ECE_UPDATEPATHGRAPH);
}
```

### Check Line of Sight Between Two Points

```c
bool HasLineOfSight(vector from, vector to, Object ignoreObj)
{
    vector contactPos;
    vector contactDir;
    int contactComponent;

    bool hit = DayZPhysics.RaycastRV(
        from, to,
        contactPos, contactDir, contactComponent,
        NULL, NULL, ignoreObj,
        false, false,
        ObjIntersectView
    );

    // If nothing was hit, there is clear line of sight
    return !hit;
}
```

### Find Nearest Building

```c
Object FindNearestBuilding(vector pos, float searchRadius)
{
    array<Object> objects = new array<Object>();
    GetGame().GetObjectsAtPosition(pos, searchRadius, objects, null);

    Object nearest = null;
    float nearestDistSq = float.MAX;

    foreach (Object obj : objects)
    {
        if (!obj.IsBuilding())
            continue;

        float distSq = vector.DistanceSq(pos, obj.GetPosition());
        if (distSq < nearestDistSq)
        {
            nearestDistSq = distSq;
            nearest = obj;
        }
    }

    return nearest;
}
```

### Check if Position is Indoors

A common technique is to raycast straight up. If something is above you within a reasonable distance, you are likely indoors.

```c
bool IsIndoors(vector pos)
{
    vector from = pos + "0 0.5 0";   // Slightly above ground
    vector to = pos + "0 20.0 0";    // 20m straight up
    vector contactPos, contactDir;
    int contactComponent;

    return DayZPhysics.RaycastRV(
        from, to,
        contactPos, contactDir, contactComponent,
        NULL, NULL, null,
        false, false,
        ObjIntersectGeom
    );
}
```

### Ground Slope Check for Placement

```c
bool IsSlopeTooSteep(vector pos, float maxSlopeDegrees)
{
    vector normal = GetGame().SurfaceGetNormal(pos[0], pos[2]);

    // The Y component of the normal indicates how vertical the surface is
    // Y = 1.0 means perfectly flat, Y = 0.0 means vertical wall
    float slopeAngle = Math.Acos(normal[1]) * Math.RAD2DEG;

    return slopeAngle > maxSlopeDegrees;
}
```

### Check if Position is Over Water

```c
bool IsOverWater(vector pos)
{
    float x = pos[0];
    float z = pos[2];

    if (GetGame().SurfaceIsSea(x, z))
        return true;

    if (GetGame().SurfaceIsPond(x, z))
        return true;

    return false;
}
```

### Obstruction Check (Vanilla Pattern)

The vanilla `MiscGameplayFunctions` class provides ready-made obstruction checks that combine `RaycastRVProxy` and `RaycastRV`:

```c
// Simple obstruction check
bool obstructed = MiscGameplayFunctions.IsObjectObstructed(targetObject);

// With distance check
bool obstructed = MiscGameplayFunctions.IsObjectObstructed(
    targetObject,
    true,            // doDistanceCheck
    playerPos,       // distanceCheckPos
    5.0              // maxDist
);
```

### Melee Targeting Layer Mask

The vanilla melee system definiscis a practical layer mask for obstruction checks. This is a good reference for which layers to include:

```c
// From meleetargeting.c
const static PhxInteractionLayers MELEE_TARGET_OBSTRUCTION_LAYERS =
    PhxInteractionLayers.BUILDING
    | PhxInteractionLayers.DOOR
    | PhxInteractionLayers.VEHICLE
    | PhxInteractionLayers.ROADWAY
    | PhxInteractionLayers.TERRAIN
    | PhxInteractionLayers.ITEM_SMALL
    | PhxInteractionLayers.ITEM_LARGE
    | PhxInteractionLayers.FENCE;
```

---

## Buone Pratiche

- **Use `DistanceSq` instead of `Distance` for comparisons.** The square root in `Distance` is expensive. Pre-compute `maxRange * maxRange` and compare against `DistanceSq`. The vanilla codebase does this extensively in action targeting and vicinity checks.
- **Keep `GetObjectsAtPosition` radius as small as possible.** Every meter of radius dramatically increases the number of objects returned. A 100m radius in a city can return thousands of objects. Cache results and reuse them within the same frame.
- **Never raycast ogni frame without throttling.** Even `RaycastRV` is expensive at scale. Use timers (0.1--0.5 second intervals) for periodic checks. The rangefinder uses a 0.5-second timer for its measurements.
- **Prefer `RaycastRVProxy` over `RaycastRV` for complex queries.** The proxy version returns structured results with hierarchy information, surface data, and component indices. It is what the vanilla action system uses for cursor targeting.
- **Use `ground_only = true` when you only need terrain height.** This skips all object intersection tests and is significantly faster than a full raycast.
- **Combine `SurfaceIsSea` and `SurfaceIsPond` for water checks.** There is no single `SurfaceIsWater` function. Always check both unless you specifically need to distinguish between sea and pond.

---

## Compatibilita e Impatto

> **Mod Compatibility:** Terrain and raycast queries are read-only operations that do not modify world state. Multiple mods can safely call these functions simultaneously without conflicts.

- **Server/Client:** All terrain queries (`SurfaceY`, `SurfaceGetType`, `SurfaceGetNormal`, `SurfaceIsSea`, `SurfaceIsPond`) are safe to call on both server and client. World modification methods like `SetDate()` are server-authoritative.
- **Performance Impact:** `GetObjectsAtPosition` with large radii is the most common performance mistake. A mod that calls it ogni frame with a 50m+ radius will cause noticeable server lag. Raycast operations are cheaper but still should not run ogni frame on many entities.
- **Map Dependency:** `SurfaceGetType` returns different surface names depending on the map. Chernarus and Livonia share most surface type names (`cp_gravel`, `cp_concrete`, etc.), but custom maps may definisci their own. Always handle unknown surface types gracefully.
- **WorldData Subclassing:** If your mod needs to read or override temperature or weather data, note that `WorldData` is subclassed per map. Modding the classe base affects all maps; modding `ChernarusPlusData` only affects Chernarus.

---

## Teoria vs Pratica

| Documentation/Expectation | Actual Behavior |
|--------------------------|-----------------|
| `SurfaceY` returns ground height | Returns raw terrain height, ignoring roads, bridges, and objects. Use `SurfaceRoadY` for surfaces that include roads. |
| `RaycastRV` `ignore` parameter ignores one object | Only ignores one object. For multiple exclusions, use `RaycastRVProxy` with the `excluded` array parameter. |
| `GetObjectsAtPosition` returns all objects | Returns objects with physics bodies. Pure visual objects (particles, effects) are not returned. |
| `RaycastRVResult.obj` is always the world object | When `hierLevel > 0`, `obj` is the proxy (attachment/component) and `parent` is the actual world object. Always check `hierLevel`. |
| `CollisionFlags.ALLOBJECTS` returns everything | Returns the first contact per object, not all contacts per object. Multiple results come from multiple distinct objects. |
| Surface type names are standardized | Surface names are map-dependent configuration values from CfgSurfaces. Custom maps definisci custom surface names. |

---

## Errori Comuni

| Errore | Soluzione |
|---------|-----|
| Calling `GetObjectsAtPosition` ogni frame with a large radius | Use a timer (0.25--1.0 second interval). Cache the results array. |
| Using `vector.Distance` in a loop comparing many objects | Use `vector.DistanceSq` and compare against `maxRange * maxRange`. |
| Ignoring the `hierLevel` field in `RaycastRVResult` | When `hierLevel > 0`, the hit is on a proxy. Use `parent` to get the actual world entity. |
| Using `SurfaceY` for spawn placement on bridges or buildings | `SurfaceY` returns terrain height only. For structures, raycast downward with `ObjIntersectGeom` or use `SurfaceRoadY`. |
| Assuming `RaycastRV` `contactDir` is always valid | `contactDir` is only populated when an object is hit, not when hitting bare terrain with `ground_only = true`. |
| Not null-checking `RaycastRVResult.obj` | Terrain-only hits return `obj = NULL`. Always check before casting or accessing properties. |
| Passing `null` for `ignore` when the player could self-intersect | Always pass the player (or the casting entity) as `ignore` to prevent the ray from hitting the caster's own collision geometry. |
| Using `ObjIntersectFire` for visual obstruction checks | `Fire` geometry is optimized for bullet paths and may have gaps that `View` geometry covers. Use `ObjIntersectView` for line-of-sight checks. |

---

## Osservato in Mod Reali

> These patterns were confirmed by studying the source code of professional DayZ mods and vanilla game scripts.

| Pattern | Source | File/Location |
|---------|--------|---------------|
| `SurfaceY` snap for ground-level particle placement | Vanilla | `4_World/classes/contaminatedarea/effectarea.c` |
| `SurfaceGetType` for vehicle wheel surface detection | Vanilla | `4_World/entities/vehicles/carscript.c` |
| `SurfaceGetNormal` + `VectorToAngles` for terrain-aligned placement | Vanilla | `4_World/classes/hologram.c` |
| `RaycastRV` with `ObjIntersectIFire` for rangefinder measurement | Vanilla | `4_World/entities/itembase/rangefinder.c` |
| `RaycastRVProxy` with `ALLOBJECTS` for action cursor targeting | Vanilla | `4_World/classes/useractionscomponent/actiontargets.c` |
| `RayCastBullet` with combined `PhxInteractionLayers` for teleport | Vanilla | `4_World/plugins/plugindeveloper/developerteleport.c` |
| `SphereCastBullet` with small radius for precise hit detection | Vanilla | `4_World/plugins/plugindeveloper/developerteleport.c` |
| `GetObjectsAtPosition` with `null` proxyCargo for area kill zones | Vanilla | `4_World/classes/contaminatedarea/geyserarea.c` |
| `IsObjectObstructedCache` to batch raycast calls per frame | Vanilla | `4_World/static/miscgameplayfunctions.c` |
| Combined `PhxInteractionLayers` bitmask for melee obstruction | Vanilla | `4_World/classes/meleetargeting.c` |

---

[Home](../../README.md) | [<< Precedente: Animation System](18-animation-system.md) | **Terrain & World Queries**
