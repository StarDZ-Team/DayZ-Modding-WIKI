# Rozdział 6.4: System kamer

[Strona główna](../README.md) | [<< Poprzedni: Pogoda](03-weather.md) | **Kamery** | [Następny: Efekty post-processingu >>](05-ppe.md)

---

## Wprowadzenie

DayZ wykorzystuje wielowarstwowy system kamer. Kamera gracza jest zarządzana przez silnik za pośrednictwem podklas `DayZPlayerCamera`. Do moddingu i debugowania `FreeDebugCamera` umożliwia swobodny lot. Silnik zapewnia również globalne metody dostępu do aktualnego stanu kamery. Ten rozdział obejmuje typy kamer, sposoby dostępu do danych kamery oraz korzystanie ze skryptowanych narzędzi kamerowych.

---

## Aktualny stan kamery (globalne metody dostępu)

Te metody są dostępne z dowolnego miejsca i zwracają stan aktywnej kamery niezależnie od jej typu:

```c
// Aktualna pozycja kamery w świecie
proto native vector GetGame().GetCurrentCameraPosition();

// Aktualny kierunek kamery (wektor jednostkowy)
proto native vector GetGame().GetCurrentCameraDirection();

// Konwersja pozycji świata na współrzędne ekranu
proto native vector GetGame().GetScreenPos(vector world_pos);
// Zwraca: x = ekran X (piksele), y = ekran Y (piksele), z = głębokość (odległość od kamery)
```

**Przykład --- sprawdzanie czy pozycja jest na ekranie:**

```c
bool IsPositionOnScreen(vector worldPos)
{
    vector screenPos = GetGame().GetScreenPos(worldPos);

    // z < 0 oznacza za kamerą
    if (screenPos[2] < 0)
        return false;

    int screenW, screenH;
    GetScreenSize(screenW, screenH);

    return (screenPos[0] >= 0 && screenPos[0] <= screenW &&
            screenPos[1] >= 0 && screenPos[1] <= screenH);
}
```

**Przykład --- pobranie odległości od kamery do punktu:**

```c
float DistanceFromCamera(vector worldPos)
{
    return vector.Distance(GetGame().GetCurrentCameraPosition(), worldPos);
}
```

---

## System DayZPlayerCamera

Kamery graczy DayZ to natywne klasy zarządzane przez kontroler gracza silnika. Nie są bezpośrednio tworzone ze skryptu --- zamiast tego silnik wybiera odpowiednią kamerę na podstawie stanu gracza (stojący, leżący, pływający, w pojeździe, nieprzytomny itd.).

### Typy kamer (stałe DayZPlayerCameras)

Identyfikatory typów kamer są zdefiniowane jako stałe:

| Stała | Opis |
|-------|------|
| `DayZPlayerCameras.DAYZCAMERA_1ST` | Kamera pierwszoosobowa |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC` | Trzecia osoba na stojąco |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO` | Trzecia osoba w przysiadzie |
| `DayZPlayerCameras.DAYZCAMERA_3RD_PRO` | Trzecia osoba na leżąco |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_SPR` | Trzecia osoba sprint |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_RAISED` | Trzecia osoba z uniesioną bronią |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO_RAISED` | Trzecia osoba w przysiadzie z bronią |
| `DayZPlayerCameras.DAYZCAMERA_IRONSIGHTS` | Celowanie przez przyrządy mechaniczne |
| `DayZPlayerCameras.DAYZCAMERA_OPTICS` | Celowanie przez optykę/lunetę |
| `DayZPlayerCameras.DAYZCAMERA_3RD_VEHICLE` | Trzecia osoba w pojeździe |
| `DayZPlayerCameras.DAYZCAMERA_1ST_VEHICLE` | Pierwsza osoba w pojeździe |
| `DayZPlayerCameras.DAYZCAMERA_3RD_SWIM` | Trzecia osoba pływanie |
| `DayZPlayerCameras.DAYZCAMERA_3RD_UNCONSCIOUS` | Trzecia osoba nieprzytomny |
| `DayZPlayerCameras.DAYZCAMERA_1ST_UNCONSCIOUS` | Pierwsza osoba nieprzytomny |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CLIMB` | Trzecia osoba wspinanie |
| `DayZPlayerCameras.DAYZCAMERA_3RD_JUMP` | Trzecia osoba skok |

### Pobieranie aktualnego typu kamery

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

**Plik:** `5_Mission/gui/scriptconsole/freedebugcamera.c`

Kamera swobodnego lotu używana do debugowania i pracy filmowej. Dostępna w buildach diagnostycznych lub po włączeniu przez mody.

### Dostęp do instancji

```c
FreeDebugCamera GetFreeDebugCamera();
```

Ta globalna funkcja zwraca instancję singletona wolnej kamery (lub null, jeśli nie istnieje).

### Kluczowe metody

```c
// Włączanie/wyłączanie wolnej kamery
static void SetActive(bool active);
static bool GetActive();

// Pozycja i orientacja
vector GetPosition();
void   SetPosition(vector pos);
vector GetOrientation();
void   SetOrientation(vector ori);   // obrót, pochylenie, przechylenie

// Prędkość
void SetFlySpeed(float speed);
float GetFlySpeed();

// Kierunek kamery
vector GetDirection();
```

**Przykład --- aktywacja wolnej kamery i teleportacja:**

```c
void ActivateDebugCamera(vector pos)
{
    FreeDebugCamera.SetActive(true);

    FreeDebugCamera cam = GetFreeDebugCamera();
    if (cam)
    {
        cam.SetPosition(pos);
        cam.SetOrientation(Vector(0, -30, 0));  // Lekko w dół
        cam.SetFlySpeed(10.0);
    }
}
```

---

## Pole widzenia (FOV)

Silnik kontroluje FOV natywnie. Możesz go odczytywać i modyfikować za pośrednictwem systemu kamery gracza:

### Odczyt FOV

```c
// Pobranie aktualnego FOV kamery
float fov = GetDayZGame().GetFieldOfView();
```

### Nadpisanie FOV w DayZPlayerCamera

W niestandardowych klasach kamer rozszerzających `DayZPlayerCamera` możesz nadpisać FOV:

```c
class MyCustomCamera extends DayZPlayerCamera1stPerson
{
    override float GetCurrentFOV()
    {
        return 0.7854;  // ~45 stopni (radiany)
    }
}
```

---

## Głębia ostrości (DOF)

Głębia ostrości jest kontrolowana przez system efektów post-processingu (zobacz [Rozdział 6.5](05-ppe.md)). Jednak system kamer współpracuje z DOF za pośrednictwem tych mechanizmów:

### Ustawianie DOF przez World

```c
World world = GetGame().GetWorld();
if (world)
{
    // SetDOF(odległość_ostrości, długość_ostrości, długość_ostrości_blisko, rozmycie, offset_głębi_ostrości)
    // Wszystkie wartości w metrach
    world.SetDOF(5.0, 100.0, 0.5, 0.3, 0.0);
}
```

### Wyłączanie DOF

```c
World world = GetGame().GetWorld();
if (world)
{
    world.SetDOF(0, 0, 0, 0, 0);  // Same zera wyłączają DOF
}
```

---

## ScriptCamera (GameLib)

**Plik:** `2_GameLib/entities/scriptcamera.c`

Niskopoziomowa skryptowana encja kamery z warstwy GameLib. Stanowi bazę dla niestandardowych implementacji kamer.

### Tworzenie kamery

```c
ScriptCamera camera = ScriptCamera.Cast(
    GetGame().CreateObject("ScriptCamera", pos, true)  // tylko lokalnie
);
```

### Kluczowe metody

```c
proto native void SetFOV(float fov);          // FOV w radianach
proto native void SetNearPlane(float nearPlane);
proto native void SetFarPlane(float farPlane);
proto native void SetFocus(float dist, float len);
```

### Aktywacja kamery

```c
// Ustawienie tej kamery jako aktywnej kamery renderującej
GetGame().SelectPlayer(null, null);   // Odłącz od gracza
GetGame().ObjectRelease(camera);      // Zwolnij do silnika
```

> **Uwaga:** Przełączanie z kamery gracza wymaga starannego zarządzania wejściem i HUD-em. Większość modów używa wolnej kamery debug lub efektów nakładkowych PPE zamiast tworzenia niestandardowych kamer.

---

## Raycast z kamery

Częsty wzorzec to wykonywanie raycastu z pozycji kamery w kierunku kamery, aby znaleźć to, na co patrzy gracz:

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

## Podsumowanie

| Koncept | Kluczowy punkt |
|---------|----------------|
| Globalne metody dostępu | `GetCurrentCameraPosition()`, `GetCurrentCameraDirection()`, `GetScreenPos()` |
| Typy kamer | Stałe `DayZPlayerCameras` (1ST, 3RD_ERC, IRONSIGHTS, OPTICS, VEHICLE itd.) |
| Aktualny typ | `player.GetCurrentCameraType()` |
| Wolna kamera | `FreeDebugCamera.SetActive(true)`, potem `GetFreeDebugCamera()` |
| FOV | `GetDayZGame().GetFieldOfView()` do odczytu, nadpisanie `GetCurrentFOV()` w klasie kamery |
| DOF | `GetGame().GetWorld().SetDOF(ostrość, długość, blisko, rozmycie, offset)` |
| Konwersja ekranowa | `GetScreenPos(worldPos)` zwraca piksel XY + głębokość Z |

---

## Dobre praktyki

- **Buforuj pozycję kamery przy wielokrotnym odpytywaniu w ramach jednej klatki.** `GetGame().GetCurrentCameraPosition()` i `GetCurrentCameraDirection()` to wywołania silnika -- zapisz wynik w zmiennej lokalnej, jeśli potrzebujesz go w wielu obliczeniach w ramach tej samej klatki.
- **Sprawdzaj głębokość `GetScreenPos()` przed umieszczaniem UI.** Zawsze weryfikuj `screenPos[2] > 0` (przed kamerą) przed rysowaniem znaczników HUD na pozycjach światowych, w przeciwnym razie znaczniki pojawią się lustrzanie za graczem.
- **Unikaj tworzenia niestandardowych instancji ScriptCamera dla prostych efektów.** FreeDebugCamera i system PPE pokrywają większość potrzeb filmowych i wizualnych. Niestandardowe kamery wymagają starannego zarządzania wejściem/HUD-em, które łatwo zepsuć.
- **Respektuj przejścia typów kamer silnika.** Nie wymuszaj zmian typu kamery ze skryptu, chyba że w pełni obsługujesz stan kontrolera gracza. Nieoczekiwane przełączenia kamery mogą zablokować ruch gracza lub spowodować desynchronizację.
- **Zabezpiecz użycie wolnej kamery kontrolą uprawnień admin/debug.** FreeDebugCamera zapewnia nieograniczony wgląd w świat. Włączaj ją tylko dla uwierzytelnionych administratorów lub buildów diagnostycznych, aby zapobiec nadużyciom.

---

## Kompatybilność i wpływ

- **Multi-Mod:** Metody dostępu do kamery są globalnymi metodami tylko do odczytu, więc wiele modów może bezpiecznie odczytywać stan kamery jednocześnie. Konflikty powstają tylko gdy dwa mody próbują aktywować FreeDebugCamera lub niestandardowe instancje ScriptCamera.
- **Wydajność:** `GetScreenPos()` i `GetCurrentCameraPosition()` to lekkie wywołania silnika. Raycast z kamery (`DayZPhysics.RaycastRV`) jest bardziej kosztowny -- ogranicz do raz na klatkę, nie na encję.
- **Serwer/Klient:** Stan kamery istnieje tylko po stronie klienta. Wszystkie metody kamery zwracają bezsensowne dane na dedykowanym serwerze. Nigdy nie używaj zapytań o kamerę w logice serwerowej.

---

[<< Poprzedni: Pogoda](03-weather.md) | **Kamery** | [Następny: Efekty post-processingu >>](05-ppe.md)
