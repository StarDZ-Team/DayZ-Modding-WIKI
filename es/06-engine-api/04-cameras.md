# Capítulo 6.4: Sistema de Cámaras

[Inicio](../README.md) | [<< Anterior: Clima](03-weather.md) | **Cámaras** | [Siguiente: Efectos de Post-Procesado >>](05-ppe.md)

---

## Introducción

DayZ utiliza un sistema de cámaras multicapa. La cámara del jugador es gestionada por el motor a través de subclases de `DayZPlayerCamera`. Para modding y depuración, la `FreeDebugCamera` permite vuelo libre. El motor también proporciona accesores globales para el estado actual de la cámara. Este capítulo cubre los tipos de cámara, cómo acceder a los datos de la cámara y cómo usar las herramientas de cámara por script.

---

## Estado Actual de la Cámara (Accesores Globales)

Estos métodos están disponibles en cualquier lugar y devuelven el estado de la cámara activa independientemente del tipo de cámara:

```c
// Posición mundial actual de la cámara
proto native vector GetGame().GetCurrentCameraPosition();

// Dirección frontal actual de la cámara (vector unitario)
proto native vector GetGame().GetCurrentCameraDirection();

// Convertir posición mundial a coordenadas de pantalla
proto native vector GetGame().GetScreenPos(vector world_pos);
// Retorna: x = X de pantalla (píxeles), y = Y de pantalla (píxeles), z = profundidad (distancia desde la cámara)
```

**Ejemplo --- verificar si una posición está en pantalla:**

```c
bool IsPositionOnScreen(vector worldPos)
{
    vector screenPos = GetGame().GetScreenPos(worldPos);

    // z < 0 significa detrás de la cámara
    if (screenPos[2] < 0)
        return false;

    int screenW, screenH;
    GetScreenSize(screenW, screenH);

    return (screenPos[0] >= 0 && screenPos[0] <= screenW &&
            screenPos[1] >= 0 && screenPos[1] <= screenH);
}
```

**Ejemplo --- obtener distancia desde la cámara a un punto:**

```c
float DistanceFromCamera(vector worldPos)
{
    return vector.Distance(GetGame().GetCurrentCameraPosition(), worldPos);
}
```

---

## Sistema DayZPlayerCamera

Las cámaras del jugador en DayZ son clases nativas gestionadas por el controlador del jugador del motor. No se instancian directamente desde script --- en su lugar, el motor selecciona la cámara apropiada según el estado del jugador (de pie, tumbado, nadando, en vehículo, inconsciente, etc.).

### Tipos de Cámara (Constantes de DayZPlayerCameras)

Los IDs de tipo de cámara se definen como constantes:

| Constante | Descripción |
|----------|-------------|
| `DayZPlayerCameras.DAYZCAMERA_1ST` | Cámara en primera persona |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC` | Tercera persona erguido (de pie) |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO` | Tercera persona agachado |
| `DayZPlayerCameras.DAYZCAMERA_3RD_PRO` | Tercera persona tumbado |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_SPR` | Tercera persona corriendo |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_RAISED` | Tercera persona arma levantada |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO_RAISED` | Tercera persona agachado arma levantada |
| `DayZPlayerCameras.DAYZCAMERA_IRONSIGHTS` | Apuntando con mira de hierro |
| `DayZPlayerCameras.DAYZCAMERA_OPTICS` | Apuntando con óptica/mira |
| `DayZPlayerCameras.DAYZCAMERA_3RD_VEHICLE` | Tercera persona en vehículo |
| `DayZPlayerCameras.DAYZCAMERA_1ST_VEHICLE` | Primera persona en vehículo |
| `DayZPlayerCameras.DAYZCAMERA_3RD_SWIM` | Tercera persona nadando |
| `DayZPlayerCameras.DAYZCAMERA_3RD_UNCONSCIOUS` | Tercera persona inconsciente |
| `DayZPlayerCameras.DAYZCAMERA_1ST_UNCONSCIOUS` | Primera persona inconsciente |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CLIMB` | Tercera persona escalando |
| `DayZPlayerCameras.DAYZCAMERA_3RD_JUMP` | Tercera persona saltando |

### Obtener el Tipo de Cámara Actual

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

**Archivo:** `5_Mission/gui/scriptconsole/freedebugcamera.c`

La cámara de vuelo libre utilizada para depuración y trabajo cinemático. Disponible en compilaciones de diagnóstico o cuando es habilitada por mods.

### Acceder a la Instancia

```c
FreeDebugCamera GetFreeDebugCamera();
```

Esta función global retorna la instancia singleton de la cámara libre (o null si no existe).

### Métodos Principales

```c
// Habilitar/deshabilitar la cámara libre
static void SetActive(bool active);
static bool GetActive();

// Posición y orientación
vector GetPosition();
void   SetPosition(vector pos);
vector GetOrientation();
void   SetOrientation(vector ori);   // yaw, pitch, roll

// Velocidad
void SetFlySpeed(float speed);
float GetFlySpeed();

// Dirección de la cámara
vector GetDirection();
```

**Ejemplo --- activar cámara libre y teletransportarla:**

```c
void ActivateDebugCamera(vector pos)
{
    FreeDebugCamera.SetActive(true);

    FreeDebugCamera cam = GetFreeDebugCamera();
    if (cam)
    {
        cam.SetPosition(pos);
        cam.SetOrientation(Vector(0, -30, 0));  // Mirar ligeramente hacia abajo
        cam.SetFlySpeed(10.0);
    }
}
```

---

## Campo de Visión (FOV)

El motor controla el FOV de forma nativa. Puedes leerlo y modificarlo a través del sistema de cámara del jugador:

### Leer el FOV

```c
// Obtener el FOV actual de la cámara
float fov = GetDayZGame().GetFieldOfView();
```

### Sobreescritura de FOV en DayZPlayerCamera

En clases de cámara personalizadas que extienden `DayZPlayerCamera`, puedes sobreescribir el FOV:

```c
class MyCustomCamera extends DayZPlayerCamera1stPerson
{
    override float GetCurrentFOV()
    {
        return 0.7854;  // ~45 grados (radianes)
    }
}
```

---

## Profundidad de Campo (DOF)

La profundidad de campo se controla a través del sistema de Efectos de Post-Procesado (ver [Capítulo 6.5](05-ppe.md)). Sin embargo, el sistema de cámaras trabaja con DOF mediante estos mecanismos:

### Configurar DOF vía World

```c
World world = GetGame().GetWorld();
if (world)
{
    // SetDOF(distancia_enfoque, longitud_enfoque, longitud_enfoque_cercano, desenfoque, offset_profundidad)
    // Todos los valores en metros
    world.SetDOF(5.0, 100.0, 0.5, 0.3, 0.0);
}
```

### Deshabilitar DOF

```c
World world = GetGame().GetWorld();
if (world)
{
    world.SetDOF(0, 0, 0, 0, 0);  // Todos en cero deshabilita DOF
}
```

---

## ScriptCamera (GameLib)

**Archivo:** `2_GameLib/entities/scriptcamera.c`

Una entidad de cámara con script de nivel más bajo de la capa GameLib. Esta es la base para implementaciones de cámara personalizadas.

### Crear una Cámara

```c
ScriptCamera camera = ScriptCamera.Cast(
    GetGame().CreateObject("ScriptCamera", pos, true)  // solo local
);
```

### Métodos Principales

```c
proto native void SetFOV(float fov);          // FOV en radianes
proto native void SetNearPlane(float nearPlane);
proto native void SetFarPlane(float farPlane);
proto native void SetFocus(float dist, float len);
```

### Activar una Cámara

```c
// Hacer que esta cámara sea la cámara de renderizado activa
GetGame().SelectPlayer(null, null);   // Desacoplar del jugador
GetGame().ObjectRelease(camera);      // Liberar al motor
```

> **Nota:** Cambiar de la cámara del jugador requiere un manejo cuidadoso del input y el HUD. La mayoría de los mods usan la cámara libre de depuración o efectos de overlay PPE en lugar de crear cámaras personalizadas.

---

## Raycasting desde la Cámara

Un patrón común es hacer raycast desde la posición de la cámara en la dirección de la cámara para encontrar qué está mirando el jugador:

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

## Resumen

| Concepto | Punto Clave |
|---------|-----------|
| Accesores globales | `GetCurrentCameraPosition()`, `GetCurrentCameraDirection()`, `GetScreenPos()` |
| Tipos de cámara | Constantes de `DayZPlayerCameras` (1ST, 3RD_ERC, IRONSIGHTS, OPTICS, VEHICLE, etc.) |
| Tipo actual | `player.GetCurrentCameraType()` |
| Cámara libre | `FreeDebugCamera.SetActive(true)`, luego `GetFreeDebugCamera()` |
| FOV | `GetDayZGame().GetFieldOfView()` para leer, sobreescribir `GetCurrentFOV()` en clase de cámara |
| DOF | `GetGame().GetWorld().SetDOF(enfoque, longitud, cercano, desenfoque, offset)` |
| Conversión de pantalla | `GetScreenPos(worldPos)` retorna XY en píxeles + profundidad Z |

---

## Mejores Prácticas

- **Almacena en caché la posición de la cámara cuando la consultes múltiples veces por frame.** `GetGame().GetCurrentCameraPosition()` y `GetCurrentCameraDirection()` son llamadas al motor --- guarda el resultado en una variable local si lo necesitas en múltiples cálculos dentro del mismo frame.
- **Usa la verificación de profundidad de `GetScreenPos()` antes de colocar UI.** Siempre verifica que `screenPos[2] > 0` (delante de la cámara) antes de dibujar marcadores HUD en posiciones del mundo, o los marcadores aparecerán reflejados detrás del jugador.
- **Evita crear instancias de ScriptCamera personalizadas para efectos simples.** La FreeDebugCamera y el sistema PPE cubren la mayoría de las necesidades cinemáticas y visuales. Las cámaras personalizadas requieren un manejo cuidadoso del input/HUD que es fácil de romper.
- **Respeta las transiciones de tipo de cámara del motor.** No fuerces cambios de tipo de cámara desde script a menos que manejes completamente el estado del controlador del jugador. Cambios inesperados de cámara pueden bloquear el movimiento del jugador o causar desincronización.
- **Protege el uso de la cámara libre detrás de verificaciones de admin/depuración.** FreeDebugCamera proporciona inspección del mundo con capacidades de dios. Solo habilítala para administradores autenticados o compilaciones de diagnóstico para prevenir abuso.

---

## Compatibilidad e Impacto

- **Multi-Mod:** Los accesores de cámara son globales de solo lectura, por lo que múltiples mods pueden leer el estado de la cámara simultáneamente de forma segura. Los conflictos surgen solo si dos mods intentan activar FreeDebugCamera o instancias de ScriptCamera personalizadas al mismo tiempo.
- **Rendimiento:** `GetScreenPos()` y `GetCurrentCameraPosition()` son llamadas ligeras al motor. El raycasting desde la cámara (`DayZPhysics.RaycastRV`) es más costoso --- limítalo a una vez por frame, no por entidad.
- **Servidor/Cliente:** El estado de la cámara existe solo en el cliente. Todos los métodos de cámara devuelven datos sin sentido en un servidor dedicado. Nunca uses consultas de cámara en lógica del lado del servidor.

---

[<< Anterior: Clima](03-weather.md) | **Cámaras** | [Siguiente: Efectos de Post-Procesado >>](05-ppe.md)
