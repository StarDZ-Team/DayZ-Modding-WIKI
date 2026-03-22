# 6.4. fejezet: Kamerarendszer

[Kezdőlap](../README.md) | [<< Előző: Időjárás](03-weather.md) | **Kamerák** | [Következő: Utófeldolgozási effektek >>](05-ppe.md)

---

## Bevezetés

A DayZ többrétegű kamerarendszert használ. A játékos kameráját a motor a `DayZPlayerCamera` alosztályokon keresztül kezeli. Modoláshoz és hibakereséshez a `FreeDebugCamera` szabad repülést tesz lehetővé. A motor globális hozzáférőket is biztosít az aktuális kameraállapothoz. Ez a fejezet a kameratípusokat, a kameraadatok elérését és a szkriptelt kameraeszközök használatát tárgyalja.

---

## Aktuális kameraállapot (Globális hozzáférők)

Ezek a metódusok bárhonnan elérhetők, és az aktív kamera állapotát adják vissza a kameratípustól függetlenül:

```c
// Aktuális kamera világpozíciója
proto native vector GetGame().GetCurrentCameraPosition();

// Aktuális kamera előre irányuló irányvektora (egységvektor)
proto native vector GetGame().GetCurrentCameraDirection();

// Világpozíció átváltása képernyőkoordinátákra
proto native vector GetGame().GetScreenPos(vector world_pos);
// Visszatérés: x = képernyő X (pixel), y = képernyő Y (pixel), z = mélység (távolság a kamerától)
```

**Példa --- pozíció ellenőrzése, hogy a képernyőn van-e:**

```c
bool IsPositionOnScreen(vector worldPos)
{
    vector screenPos = GetGame().GetScreenPos(worldPos);

    // z < 0 azt jelenti, hogy a kamera mögött van
    if (screenPos[2] < 0)
        return false;

    int screenW, screenH;
    GetScreenSize(screenW, screenH);

    return (screenPos[0] >= 0 && screenPos[0] <= screenW &&
            screenPos[1] >= 0 && screenPos[1] <= screenH);
}
```

**Példa --- távolság lekérése a kamerától egy pontig:**

```c
float DistanceFromCamera(vector worldPos)
{
    return vector.Distance(GetGame().GetCurrentCameraPosition(), worldPos);
}
```

---

## DayZPlayerCamera rendszer

A DayZ játékos kamerái a motor játékosvezérlője által kezelt natív osztályok. Nem közvetlenül példányosíthatók szkriptből --- ehelyett a motor a játékos állapota alapján választja ki a megfelelő kamerát (álló, fekvő, úszó, járműben, eszméletlen stb.).

### Kameratípusok (DayZPlayerCameras konstansok)

A kameratípus-azonosítók konstansként vannak definiálva:

| Konstans | Leírás |
|----------|--------|
| `DayZPlayerCameras.DAYZCAMERA_1ST` | Első személyű kamera |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC` | Harmadik személyű álló |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO` | Harmadik személyű guggolás |
| `DayZPlayerCameras.DAYZCAMERA_3RD_PRO` | Harmadik személyű fekvés |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_SPR` | Harmadik személyű sprint |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_RAISED` | Harmadik személyű felemelt fegyver |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO_RAISED` | Harmadik személyű guggolás felemelt fegyverrel |
| `DayZPlayerCameras.DAYZCAMERA_IRONSIGHTS` | Irányzékos célzás |
| `DayZPlayerCameras.DAYZCAMERA_OPTICS` | Optikai/távcsöves célzás |
| `DayZPlayerCameras.DAYZCAMERA_3RD_VEHICLE` | Harmadik személyű jármű |
| `DayZPlayerCameras.DAYZCAMERA_1ST_VEHICLE` | Első személyű jármű |
| `DayZPlayerCameras.DAYZCAMERA_3RD_SWIM` | Harmadik személyű úszás |
| `DayZPlayerCameras.DAYZCAMERA_3RD_UNCONSCIOUS` | Harmadik személyű eszméletlen |
| `DayZPlayerCameras.DAYZCAMERA_1ST_UNCONSCIOUS` | Első személyű eszméletlen |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CLIMB` | Harmadik személyű mászás |
| `DayZPlayerCameras.DAYZCAMERA_3RD_JUMP` | Harmadik személyű ugrás |

### Az aktuális kameratípus lekérése

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

**Fájl:** `5_Mission/gui/scriptconsole/freedebugcamera.c`

A hibakereséshez és filmes munkához használt szabadon repülő kamera. Diagnosztikai buildekben vagy modok által engedélyezve érhető el.

### A példány elérése

```c
FreeDebugCamera GetFreeDebugCamera();
```

Ez a globális függvény a szabad kamera singleton példányát adja vissza (vagy null-t, ha nem létezik).

### Fő metódusok

```c
// Szabad kamera engedélyezése/letiltása
static void SetActive(bool active);
static bool GetActive();

// Pozíció és orientáció
vector GetPosition();
void   SetPosition(vector pos);
vector GetOrientation();
void   SetOrientation(vector ori);   // fordulás, dőlés, billentés

// Sebesség
void SetFlySpeed(float speed);
float GetFlySpeed();

// Kamera iránya
vector GetDirection();
```

**Példa --- szabad kamera aktiválása és teleportálása:**

```c
void ActivateDebugCamera(vector pos)
{
    FreeDebugCamera.SetActive(true);

    FreeDebugCamera cam = GetFreeDebugCamera();
    if (cam)
    {
        cam.SetPosition(pos);
        cam.SetOrientation(Vector(0, -30, 0));  // Enyhén lefelé nézés
        cam.SetFlySpeed(10.0);
    }
}
```

---

## Látómező (FOV)

A motor natívan vezérli a FOV-ot. A játékos kamerarendszeren keresztül olvasható és módosítható:

### FOV olvasása

```c
// Aktuális kamera FOV lekérése
float fov = GetDayZGame().GetFieldOfView();
```

### DayZPlayerCamera FOV felülírás

A `DayZPlayerCamera`-t kiterjesztő egyéni kameraosztályokban felülírhatod a FOV-ot:

```c
class MyCustomCamera extends DayZPlayerCamera1stPerson
{
    override float GetCurrentFOV()
    {
        return 0.7854;  // ~45 fok (radiánban)
    }
}
```

---

## Mélységélesség (DOF)

A mélységélességet az utófeldolgozási effektrendszer vezérli (lásd [6.5. fejezet](05-ppe.md)). A kamerarendszer azonban a DOF-fal az alábbi mechanizmusokon keresztül működik együtt:

### DOF beállítása a World-ön keresztül

```c
World world = GetGame().GetWorld();
if (world)
{
    // SetDOF(fókusztávolság, fókuszhossz, fókuszhossz_közeli, elmosódás, fókuszmélység_eltolás)
    // Minden érték méterben
    world.SetDOF(5.0, 100.0, 0.5, 0.3, 0.0);
}
```

### DOF letiltása

```c
World world = GetGame().GetWorld();
if (world)
{
    world.SetDOF(0, 0, 0, 0, 0);  // Csupa nulla letiltja a DOF-ot
}
```

---

## ScriptCamera (GameLib)

**Fájl:** `2_GameLib/entities/scriptcamera.c`

Egy alacsonyabb szintű szkriptelt kameraentitás a GameLib rétegből. Ez az egyéni kamera-implementációk alapja.

### Kamera létrehozása

```c
ScriptCamera camera = ScriptCamera.Cast(
    GetGame().CreateObject("ScriptCamera", pos, true)  // csak helyi
);
```

### Fő metódusok

```c
proto native void SetFOV(float fov);          // FOV radiánban
proto native void SetNearPlane(float nearPlane);
proto native void SetFarPlane(float farPlane);
proto native void SetFocus(float dist, float len);
```

### Kamera aktiválása

```c
// Ennek a kamerának a beállítása aktív renderelő kameraként
GetGame().SelectPlayer(null, null);   // Lecsatolás a játékosról
GetGame().ObjectRelease(camera);      // Átadás a motornak
```

> **Megjegyzés:** A játékos kamerától való elváltás a bemenet és a HUD gondos kezelését igényli. A legtöbb mod a szabad hibakereső kamerát vagy a PPE felületi effekteket használja egyéni kamerák létrehozása helyett.

---

## Sugárvetés a kamerából

Gyakori minta a sugárvetés a kamera pozíciójából a kamera irányába, hogy megtaláljuk, mire néz a játékos:

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

## Összefoglalás

| Fogalom | Lényeg |
|---------|--------|
| Globális hozzáférők | `GetCurrentCameraPosition()`, `GetCurrentCameraDirection()`, `GetScreenPos()` |
| Kameratípusok | `DayZPlayerCameras` konstansok (1ST, 3RD_ERC, IRONSIGHTS, OPTICS, VEHICLE stb.) |
| Aktuális típus | `player.GetCurrentCameraType()` |
| Szabad kamera | `FreeDebugCamera.SetActive(true)`, majd `GetFreeDebugCamera()` |
| FOV | `GetDayZGame().GetFieldOfView()` olvasáshoz, `GetCurrentFOV()` felülírása a kameraosztályban |
| DOF | `GetGame().GetWorld().SetDOF(fókusz, hossz, közeli, elmosódás, eltolás)` |
| Képernyő konverzió | `GetScreenPos(worldPos)` pixel XY + mélység Z értéket ad vissza |

---

## Bevált gyakorlatok

- **Gyorsítótárazd a kamera pozícióját, ha képkockánként többször kérdezed le.** A `GetGame().GetCurrentCameraPosition()` és `GetCurrentCameraDirection()` motorhívások --- tárold az eredményt lokális változóban, ha ugyanazon képkockán belül több számításhoz szükséged van rá.
- **Használd a `GetScreenPos()` mélységellenőrzést UI elhelyezés előtt.** Mindig ellenőrizd, hogy `screenPos[2] > 0` (a kamera előtt van) mielőtt HUD jelölőket rajzolsz világpozíciókra, különben a jelölők tükrözve jelennek meg a játékos mögött.
- **Kerüld az egyéni ScriptCamera példányok létrehozását egyszerű effektekhez.** A FreeDebugCamera és a PPE rendszer lefedi a legtöbb filmes és vizuális igényt. Az egyéni kamerák gondos bemenet/HUD kezelést igényelnek, ami könnyen elromolhat.
- **Tartsd tiszteletben a motor kameratípus-átmeneteit.** Ne kényszeríts kameratípus-váltást szkriptből, hacsak nem kezeled teljesen a játékosvezérlő állapotát. A váratlan kameraváltások blokkolhatják a játékos mozgását vagy deszinkront okozhatnak.
- **Védd a szabad kamera használatát admin/hibakeresési ellenőrzésekkel.** A FreeDebugCamera isteni világ-átvizsgálást tesz lehetővé. Csak hitelesített adminok vagy diagnosztikai buildek számára engedélyezd a visszaélés megelőzése érdekében.

---

## Kompatibilitás és hatás

- **Több mod együtt:** A kamera hozzáférők csak olvasható globálisak, így több mod is biztonságosan olvashatja a kameraállapotot egyidejűleg. Konfliktus csak akkor merül fel, ha két mod egyszerre próbálja aktiválni a FreeDebugCamera-t vagy egyéni ScriptCamera példányokat.
- **Teljesítmény:** A `GetScreenPos()` és `GetCurrentCameraPosition()` könnyű motorhívások. A kamerából történő sugárvetés (`DayZPhysics.RaycastRV`) drágább --- korlátozd képkockánként egyre, ne entitásonként.
- **Szerver/Kliens:** A kameraállapot csak a kliensen létezik. Minden kamera metódus értelmetlen adatot ad vissza dedikált szerveren. Soha ne használj kameralekérdezéseket szerver oldali logikában.

---

[<< Előző: Időjárás](03-weather.md) | **Kamerák** | [Következő: Utófeldolgozási effektek >>](05-ppe.md)
