# Chapter 6.4: Camera System

[<< Предыдущая: Weather](03-weather.md) | **Cameras** | [Следующая: Post-Process Effects >>](05-ppe.md)

---

## Введение


DayZ uses a multi-layered camera system. The player camera is managed by the engine through `DayZPlayerCamera` subclasses. For modding and debugging, the `FreeDebugCamera` allows free-flight. The engine also provides global accessors for the current camera state. Эта глава охватывает camera types, how to access camera data, and how to use the scripted camera tools.

---

## Current Camera State (Global Accessors)

These methods are available anywhere and return the active camera's state regardless of camera type:

```c
// Current camera world position
proto native vector GetGame().GetCurrentCameraPosition();

// Current camera forward direction (unit vector)
proto native vector GetGame().GetCurrentCameraDirection();

// Convert world position to screen coordinates
proto native vector GetGame().GetScreenPos(vector world_pos);
// Returns: x = screen X (pixels), y = screen Y (pixels), z = depth (distance from camera)
```

**Example --- check if a position is on screen:**

```c
bool IsPositionOnScreen(vector worldPos)
{
    vector screenPos = GetGame().GetScreenPos(worldPos);

    // z < 0 means behind the camera
    if (screenPos[2] < 0)
        return false;

    int screenW, screenH;
    GetScreenSize(screenW, screenH);

    return (screenPos[0] >= 0 && screenPos[0] <= screenW &&
            screenPos[1] >= 0 && screenPos[1] <= screenH);
}
```

**Example --- get distance from camera to a point:**

```c
float DistanceFromCamera(vector worldPos)
{
    return vector.Distance(GetGame().GetCurrentCameraPosition(), worldPos);
}
```

---

## DayZPlayerCamera System

DayZ player cameras are native classes managed by the engine's player controller. They are not directly instantiated from script --- instead, the engine selects the appropriate camera based on the player's state (standing, prone, swimming, vehicle, unconscious, etc.).

### Camera Types (DayZPlayerCameras Constants)

The camera type IDs are defined as constants:

| Constant | Description |
|----------|-------------|
| `DayZPlayerCameras.DAYZCAMERA_1ST` | First-person camera |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC` | Third-person erect (standing) |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO` | Third-person crouched |
| `DayZPlayerCameras.DAYZCAMERA_3RD_PRO` | Third-person prone |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_SPR` | Third-person sprint |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_RAISED` | Third-person raised weapon |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO_RAISED` | Third-person crouched raised |
| `DayZPlayerCameras.DAYZCAMERA_IRONSIGHTS` | Ironsight aiming |
| `DayZPlayerCameras.DAYZCAMERA_OPTICS` | Optic/scope aiming |
| `DayZPlayerCameras.DAYZCAMERA_3RD_VEHICLE` | Third-person vehicle |
| `DayZPlayerCameras.DAYZCAMERA_1ST_VEHICLE` | First-person vehicle |
| `DayZPlayerCameras.DAYZCAMERA_3RD_SWIM` | Third-person swimming |
| `DayZPlayerCameras.DAYZCAMERA_3RD_UNCONSCIOUS` | Third-person unconscious |
| `DayZPlayerCameras.DAYZCAMERA_1ST_UNCONSCIOUS` | First-person unconscious |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CLIMB` | Third-person climbing |
| `DayZPlayerCameras.DAYZCAMERA_3RD_JUMP` | Third-person jumping |

### Getting the Current Camera Type

```c
DayZPlayer player = GetGame().GetPlayer();
if (player)
{
    int cameraType = player.GetCurrentCameraType();
    if (cameraType == DayZPlayerCameras.DAYZCAMERA_1ST)
    {
        Print("Player is in first person");
    }
}
```

---

## FreeDebugCamera

**File:** `5_Mission/gui/scriptconsole/freedebugcamera.c`

The free-flight camera used for debugging and cinematic work. Available in diagnostic builds or when enabled by mods.

### Accessing the Instance

```c
FreeDebugCamera GetFreeDebugCamera();
```

This global function returns the singleton free camera instance (or null if it does not exist).

### Key Methods

```c
// Enable/disable the free camera
static void SetActive(bool active);
static bool GetActive();

// Position and orientation
vector GetPosition();
void   SetPosition(vector pos);
vector GetOrientation();
void   SetOrientation(vector ori);   // yaw, pitch, roll

// Speed
void SetFlySpeed(float speed);
float GetFlySpeed();

// Camera direction
vector GetDirection();
```

**Example ---- ctivate free camera and teleport it:**

```c
void ActivateDebugCamera(vector pos)
{
    FreeDebugCamera.SetActive(true);

    FreeDebugCamera cam = GetFreeDebugCamera();
    if (cam)
    {
        cam.SetPosition(pos);
        cam.SetOrientation(Vector(0, -30, 0));  // Look slightly down
        cam.SetFlySpeed(10.0);
    }
}
```

---

## Field of View (FOV)

The engine controls FOV natively. You can read and modify it through the player camera system:

### Reading FOV

```c
// Get current camera FOV
float fov = GetDayZGame().GetFieldOfView();
```

### DayZPlayerCamera FOV Override

In custom camera classes that extend `DayZPlayerCamera`, you can override the FOV:

```c
class MyCustomCamera extends DayZPlayerCamera1stPerson
{
    override float GetCurrentFOV()
    {
        return 0.7854;  // ~45 degrees (radians)
    }
}
```

---

## Depth of Field (DOF)

Depth of field is controlled through the Post-Process Effects system (см. [Chapter 6.5](05-ppe.md)). However, the camera system works with DOF through these mechanisms:

### Setting DOF via World

```c
World world = GetGame().GetWorld();
if (world)
{
    // SetDOF(focus_distance, focus_length, focus_length_near, blur, focus_depth_offset)
    // All values in meters
    world.SetDOF(5.0, 100.0, 0.5, 0.3, 0.0);
}
```

### Disabling DOF

```c
World world = GetGame().GetWorld();
if (world)
{
    world.SetDOF(0, 0, 0, 0, 0);  // All zeros disables DOF
}
```

---

## ScriptCamera (GameLib)

**File:** `2_GameLib/entities/scriptcamera.c`

A lower-level scripted camera entity from the GameLib layer. Это base for custom camera implementations.

### Creating a Camera

```c
ScriptCamera camera = ScriptCamera.Cast(
    GetGame().CreateObject("ScriptCamera", pos, true)  // local only
);
```

### Key Methods

```c
proto native void SetFOV(float fov);          // FOV in radians
proto native void SetNearPlane(float nearPlane);
proto native void SetFarPlane(float farPlane);
proto native void SetFocus(float dist, float len);
```

### Activating a Camera

```c
// Make this camera the active rendering camera
GetGame().SelectPlayer(null, null);   // Detach from player
GetGame().ObjectRelease(camera);      // Release to engine
```

> **Примечание:** Switching away from the player camera requires careful handling of input and HUD. Most mods use the free debug camera or PPE overlay effects instead of creating custom cameras.

---

## Raycasting from Camera

A common pattern is to raycast from the camera position in the camera direction to find what the player is looking at:

```c
Object GetObjectInCrosshair(float maxDistance)
{
    vector from = GetGame().GetCurrentCameraPosition();
    vector to = from + (GetGame().GetCurrentCameraDirection() * maxDistance);

    vector contactPos;
    vector contactDir;
    int contactComponent;
    set<Object> hitObjects = new set<Object>;

    if (DayZPhysics.RaycastRV(from, to, contactPos, contactDir,
                               contactComponent, hitObjects, null, null,
                               false, false, ObjIntersectView, 0.0))
    {
        if (hitObjects.Count() > 0)
            return hitObjects[0];
    }

    return null;
}
```

---

## Итоги


| Concept | Key Point |
|---------|-----------|
| Global accessors | `GetCurrentCameraPosition()`, `GetCurrentCameraDirection()`, `GetScreenPos()` |
| Camera types | `DayZPlayerCameras` constants (1ST, 3RD_ERC, IRONSIGHTS, OPTICS, VEHICLE, etc.) |
| Current type | `player.GetCurrentCameraType()` |
| Free camera | `FreeDebugCamera.SetActive(true)`, then `GetFreeDebugCamera()` |
| FOV | `GetDayZGame().GetFieldOfView()` to read, override `GetCurrentFOV()` in camera class |
| DOF | `GetGame().GetWorld().SetDOF(focus, length, near, blur, offset)` |
| Screen conversion | `GetScreenPos(worldPos)` returns pixel XY + depth Z |

---

[<< Предыдущая: Weather](03-weather.md) | **Cameras** | [Следующая: Post-Process Effects >>](05-ppe.md)
