# Kapitel 6.4: Kamerasystem

[Startseite](../README.md) | [<< Zurück: Wetter](03-weather.md) | **Kameras** | [Weiter: Nachbearbeitungseffekte >>](05-ppe.md)

---

## Einführung

DayZ verwendet ein mehrschichtiges Kamerasystem. Die Spielerkamera wird von der Engine über `DayZPlayerCamera`-Unterklassen verwaltet. Zum Modding und Debuggen ermöglicht die `FreeDebugCamera` freien Flug. Die Engine stellt außerdem globale Zugriffsmethoden für den aktuellen Kamerazustand bereit. Dieses Kapitel behandelt Kameratypen, den Zugriff auf Kameradaten und die Verwendung der geskripteten Kamerawerkzeuge.

---

## Aktueller Kamerazustand (Globale Zugriffsmethoden)

Diese Methoden sind überall verfügbar und geben den Zustand der aktiven Kamera zurück, unabhängig vom Kameratyp:

```c
// Aktuelle Kamera-Weltposition
proto native vector GetGame().GetCurrentCameraPosition();

// Aktuelle Kamera-Blickrichtung (Einheitsvektor)
proto native vector GetGame().GetCurrentCameraDirection();

// Weltposition in Bildschirmkoordinaten umrechnen
proto native vector GetGame().GetScreenPos(vector world_pos);
// Rückgabe: x = Bildschirm X (Pixel), y = Bildschirm Y (Pixel), z = Tiefe (Entfernung zur Kamera)
```

**Beispiel --- prüfen ob eine Position auf dem Bildschirm ist:**

```c
bool IsPositionOnScreen(vector worldPos)
{
    vector screenPos = GetGame().GetScreenPos(worldPos);

    // z < 0 bedeutet hinter der Kamera
    if (screenPos[2] < 0)
        return false;

    int screenW, screenH;
    GetScreenSize(screenW, screenH);

    return (screenPos[0] >= 0 && screenPos[0] <= screenW &&
            screenPos[1] >= 0 && screenPos[1] <= screenH);
}
```

**Beispiel --- Entfernung von der Kamera zu einem Punkt ermitteln:**

```c
float DistanceFromCamera(vector worldPos)
{
    return vector.Distance(GetGame().GetCurrentCameraPosition(), worldPos);
}
```

---

## DayZPlayerCamera-System

DayZ-Spielerkameras sind native Klassen, die vom Player-Controller der Engine verwaltet werden. Sie werden nicht direkt aus dem Script instanziiert --- stattdessen wählt die Engine die passende Kamera basierend auf dem Spielerzustand aus (stehend, liegend, schwimmend, Fahrzeug, bewusstlos usw.).

### Kameratypen (DayZPlayerCameras-Konstanten)

Die Kameratyp-IDs sind als Konstanten definiert:

| Konstante | Beschreibung |
|-----------|--------------|
| `DayZPlayerCameras.DAYZCAMERA_1ST` | Erste-Person-Kamera |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC` | Dritte-Person aufrecht (stehend) |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO` | Dritte-Person geduckt |
| `DayZPlayerCameras.DAYZCAMERA_3RD_PRO` | Dritte-Person liegend |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_SPR` | Dritte-Person Sprint |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_RAISED` | Dritte-Person Waffe erhoben |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO_RAISED` | Dritte-Person geduckt Waffe erhoben |
| `DayZPlayerCameras.DAYZCAMERA_IRONSIGHTS` | Kimme-und-Korn-Zielen |
| `DayZPlayerCameras.DAYZCAMERA_OPTICS` | Optik-/Zielfernrohr-Zielen |
| `DayZPlayerCameras.DAYZCAMERA_3RD_VEHICLE` | Dritte-Person Fahrzeug |
| `DayZPlayerCameras.DAYZCAMERA_1ST_VEHICLE` | Erste-Person Fahrzeug |
| `DayZPlayerCameras.DAYZCAMERA_3RD_SWIM` | Dritte-Person Schwimmen |
| `DayZPlayerCameras.DAYZCAMERA_3RD_UNCONSCIOUS` | Dritte-Person Bewusstlos |
| `DayZPlayerCameras.DAYZCAMERA_1ST_UNCONSCIOUS` | Erste-Person Bewusstlos |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CLIMB` | Dritte-Person Klettern |
| `DayZPlayerCameras.DAYZCAMERA_3RD_JUMP` | Dritte-Person Springen |

### Aktuellen Kameratyp abfragen

```c
DayZPlayer player = GetGame().GetPlayer();
if (player)
{
    int cameraType = player.GetCurrentCameraType();
    if (cameraType == DayZPlayerCameras.DAYZCAMERA_1ST)
    {
        Print("Spieler ist in der Ersten Person");
    }
}
```

---

## FreeDebugCamera

**Datei:** `5_Mission/gui/scriptconsole/freedebugcamera.c`

Die Freiflugkamera wird für Debugging und Filmaufnahmen verwendet. Verfügbar in Diagnose-Builds oder wenn sie durch Mods aktiviert wird.

### Zugriff auf die Instanz

```c
FreeDebugCamera GetFreeDebugCamera();
```

Diese globale Funktion gibt die Singleton-Freikamera-Instanz zurück (oder null, wenn sie nicht existiert).

### Wichtige Methoden

```c
// Freikamera aktivieren/deaktivieren
static void SetActive(bool active);
static bool GetActive();

// Position und Ausrichtung
vector GetPosition();
void   SetPosition(vector pos);
vector GetOrientation();
void   SetOrientation(vector ori);   // Gier, Neigung, Rolle

// Geschwindigkeit
void SetFlySpeed(float speed);
float GetFlySpeed();

// Kamerarichtung
vector GetDirection();
```

**Beispiel --- Freikamera aktivieren und teleportieren:**

```c
void ActivateDebugCamera(vector pos)
{
    FreeDebugCamera.SetActive(true);

    FreeDebugCamera cam = GetFreeDebugCamera();
    if (cam)
    {
        cam.SetPosition(pos);
        cam.SetOrientation(Vector(0, -30, 0));  // Leicht nach unten schauen
        cam.SetFlySpeed(10.0);
    }
}
```

---

## Sichtfeld (FOV)

Die Engine steuert das FOV nativ. Sie können es über das Spielerkamerasystem lesen und ändern:

### FOV auslesen

```c
// Aktuelles Kamera-FOV abfragen
float fov = GetDayZGame().GetFieldOfView();
```

### DayZPlayerCamera FOV-Überschreibung

In benutzerdefinierten Kameraklassen, die `DayZPlayerCamera` erweitern, können Sie das FOV überschreiben:

```c
class MyCustomCamera extends DayZPlayerCamera1stPerson
{
    override float GetCurrentFOV()
    {
        return 0.7854;  // ~45 Grad (Bogenmaß)
    }
}
```

---

## Tiefenschärfe (DOF)

Die Tiefenschärfe wird über das Nachbearbeitungseffekte-System gesteuert (siehe [Kapitel 6.5](05-ppe.md)). Das Kamerasystem arbeitet jedoch über diese Mechanismen mit DOF zusammen:

### DOF über World setzen

```c
World world = GetGame().GetWorld();
if (world)
{
    // SetDOF(Fokusentfernung, Fokuslänge, Fokuslänge_nah, Unschärfe, Fokustiefenversatz)
    // Alle Werte in Metern
    world.SetDOF(5.0, 100.0, 0.5, 0.3, 0.0);
}
```

### DOF deaktivieren

```c
World world = GetGame().GetWorld();
if (world)
{
    world.SetDOF(0, 0, 0, 0, 0);  // Alle Nullen deaktivieren DOF
}
```

---

## ScriptCamera (GameLib)

**Datei:** `2_GameLib/entities/scriptcamera.c`

Eine niedrigere Ebene der geskripteten Kamera-Entity aus der GameLib-Schicht. Dies ist die Basis für benutzerdefinierte Kamera-Implementierungen.

### Eine Kamera erstellen

```c
ScriptCamera camera = ScriptCamera.Cast(
    GetGame().CreateObject("ScriptCamera", pos, true)  // nur lokal
);
```

### Wichtige Methoden

```c
proto native void SetFOV(float fov);          // FOV in Bogenmaß
proto native void SetNearPlane(float nearPlane);
proto native void SetFarPlane(float farPlane);
proto native void SetFocus(float dist, float len);
```

### Eine Kamera aktivieren

```c
// Diese Kamera zur aktiven Rendering-Kamera machen
GetGame().SelectPlayer(null, null);   // Vom Spieler lösen
GetGame().ObjectRelease(camera);      // An die Engine freigeben
```

> **Hinweis:** Das Umschalten von der Spielerkamera erfordert sorgfältige Handhabung von Eingabe und HUD. Die meisten Mods verwenden die Freiflug-Debug-Kamera oder PPE-Overlay-Effekte anstatt benutzerdefinierte Kameras zu erstellen.

---

## Raycasting von der Kamera

Ein häufiges Muster ist es, von der Kameraposition in Kamerarichtung einen Raycast durchzuführen, um zu ermitteln, worauf der Spieler schaut:

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

## Zusammenfassung

| Konzept | Kernpunkt |
|---------|-----------|
| Globale Zugriffsmethoden | `GetCurrentCameraPosition()`, `GetCurrentCameraDirection()`, `GetScreenPos()` |
| Kameratypen | `DayZPlayerCameras`-Konstanten (1ST, 3RD_ERC, IRONSIGHTS, OPTICS, VEHICLE, usw.) |
| Aktueller Typ | `player.GetCurrentCameraType()` |
| Freie Kamera | `FreeDebugCamera.SetActive(true)`, dann `GetFreeDebugCamera()` |
| FOV | `GetDayZGame().GetFieldOfView()` zum Lesen, `GetCurrentFOV()` in der Kameraklasse überschreiben |
| DOF | `GetGame().GetWorld().SetDOF(Fokus, Länge, Nah, Unschärfe, Versatz)` |
| Bildschirmumrechnung | `GetScreenPos(worldPos)` gibt Pixel-XY + Tiefe Z zurück |

---

## Bewährte Praktiken

- **Kameraposition zwischenspeichern, wenn sie mehrmals pro Frame abgefragt wird.** `GetGame().GetCurrentCameraPosition()` und `GetCurrentCameraDirection()` sind Engine-Aufrufe -- speichern Sie das Ergebnis in einer lokalen Variablen, wenn Sie es für mehrere Berechnungen im selben Frame benötigen.
- **`GetScreenPos()`-Tiefenprüfung vor UI-Platzierung verwenden.** Überprüfen Sie immer `screenPos[2] > 0` (vor der Kamera), bevor Sie HUD-Markierungen an Weltpositionen zeichnen, sonst erscheinen Markierungen gespiegelt hinter dem Spieler.
- **Vermeiden Sie die Erstellung benutzerdefinierter ScriptCamera-Instanzen für einfache Effekte.** Die FreeDebugCamera und das PPE-System decken die meisten filmischen und visuellen Anforderungen ab. Benutzerdefinierte Kameras erfordern sorgfältige Eingabe-/HUD-Verwaltung, die leicht zu Fehlern führt.
- **Respektieren Sie die Kameratyp-Übergänge der Engine.** Erzwingen Sie keine Kameratypwechsel aus dem Script, es sei denn, Sie verwalten den Player-Controller-Zustand vollständig. Unerwartete Kamerawechsel können die Bewegung des Spielers blockieren oder Desync verursachen.
- **Freikamera-Nutzung hinter Admin-/Debug-Prüfungen absichern.** Die FreeDebugCamera bietet gottähnliche Weltinspektion. Aktivieren Sie sie nur für authentifizierte Admins oder Diagnose-Builds, um Missbrauch zu verhindern.

---

## Kompatibilität und Auswirkungen

- **Multi-Mod:** Kamera-Zugriffsmethoden sind schreibgeschützte Globals, sodass mehrere Mods sicher gleichzeitig den Kamerazustand lesen können. Konflikte entstehen nur, wenn zwei Mods beide versuchen, FreeDebugCamera oder benutzerdefinierte ScriptCamera-Instanzen zu aktivieren.
- **Leistung:** `GetScreenPos()` und `GetCurrentCameraPosition()` sind leichtgewichtige Engine-Aufrufe. Raycasting von der Kamera (`DayZPhysics.RaycastRV`) ist teurer -- begrenzen Sie es auf einmal pro Frame, nicht pro Entity.
- **Server/Client:** Der Kamerazustand existiert nur auf dem Client. Alle Kameramethoden geben auf einem dedizierten Server bedeutungslose Daten zurück. Verwenden Sie niemals Kameraabfragen in serverseitiger Logik.

---

[<< Zurück: Wetter](03-weather.md) | **Kameras** | [Weiter: Nachbearbeitungseffekte >>](05-ppe.md)
