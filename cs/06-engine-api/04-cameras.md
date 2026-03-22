# Kapitola 6.4: Systém kamer

[Domů](../README.md) | [<< Předchozí: Počasí](03-weather.md) | **Kamery** | [Další: Post-processingové efekty >>](05-ppe.md)

---

## Úvod

DayZ používá vícevrstvý systém kamer. Kamera hráče je spravována enginem prostřednictvím podtříd `DayZPlayerCamera`. Pro moddování a ladění umožňuje `FreeDebugCamera` volný let. Engine také poskytuje globální přístupové metody pro aktuální stav kamery. Tato kapitola pokrývá typy kamer, jak přistupovat k datům kamery a jak používat skriptované kamerové nástroje.

---

## Aktuální stav kamery (globální přístupové metody)

Tyto metody jsou dostupné odkudkoli a vracejí stav aktivní kamery bez ohledu na její typ:

```c
// Aktuální světová pozice kamery
proto native vector GetGame().GetCurrentCameraPosition();

// Aktuální směr kamery (jednotkový vektor)
proto native vector GetGame().GetCurrentCameraDirection();

// Převod světové pozice na souřadnice obrazovky
proto native vector GetGame().GetScreenPos(vector world_pos);
// Vrací: x = obrazovka X (pixely), y = obrazovka Y (pixely), z = hloubka (vzdálenost od kamery)
```

**Příklad --- kontrola, zda je pozice na obrazovce:**

```c
bool IsPositionOnScreen(vector worldPos)
{
    vector screenPos = GetGame().GetScreenPos(worldPos);

    // z < 0 znamená za kamerou
    if (screenPos[2] < 0)
        return false;

    int screenW, screenH;
    GetScreenSize(screenW, screenH);

    return (screenPos[0] >= 0 && screenPos[0] <= screenW &&
            screenPos[1] >= 0 && screenPos[1] <= screenH);
}
```

**Příklad --- získání vzdálenosti od kamery k bodu:**

```c
float DistanceFromCamera(vector worldPos)
{
    return vector.Distance(GetGame().GetCurrentCameraPosition(), worldPos);
}
```

---

## Systém DayZPlayerCamera

Kamery hráčů DayZ jsou nativní třídy spravované řídicím systémem hráče enginu. Nejsou přímo vytvářeny ze skriptu --- místo toho engine vybere vhodnou kameru na základě stavu hráče (stojící, ležící, plavání, vozidlo, v bezvědomí atd.).

### Typy kamer (konstanty DayZPlayerCameras)

ID typů kamer jsou definovány jako konstanty:

| Konstanta | Popis |
|-----------|-------|
| `DayZPlayerCameras.DAYZCAMERA_1ST` | Kamera z pohledu první osoby |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC` | Třetí osoba vzpřímeně (stojící) |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO` | Třetí osoba v podřepu |
| `DayZPlayerCameras.DAYZCAMERA_3RD_PRO` | Třetí osoba vleže |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_SPR` | Třetí osoba sprint |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_RAISED` | Třetí osoba se zdviženou zbraní |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO_RAISED` | Třetí osoba v podřepu se zbraní |
| `DayZPlayerCameras.DAYZCAMERA_IRONSIGHTS` | Míření přes mířidla |
| `DayZPlayerCameras.DAYZCAMERA_OPTICS` | Míření přes optiku/puškohled |
| `DayZPlayerCameras.DAYZCAMERA_3RD_VEHICLE` | Třetí osoba ve vozidle |
| `DayZPlayerCameras.DAYZCAMERA_1ST_VEHICLE` | První osoba ve vozidle |
| `DayZPlayerCameras.DAYZCAMERA_3RD_SWIM` | Třetí osoba plavání |
| `DayZPlayerCameras.DAYZCAMERA_3RD_UNCONSCIOUS` | Třetí osoba v bezvědomí |
| `DayZPlayerCameras.DAYZCAMERA_1ST_UNCONSCIOUS` | První osoba v bezvědomí |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CLIMB` | Třetí osoba lezení |
| `DayZPlayerCameras.DAYZCAMERA_3RD_JUMP` | Třetí osoba skok |

### Získání aktuálního typu kamery

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

**Soubor:** `5_Mission/gui/scriptconsole/freedebugcamera.c`

Kamera volného letu používaná pro ladění a filmovou práci. Dostupná v diagnostických buildech nebo při povolení mody.

### Přístup k instanci

```c
FreeDebugCamera GetFreeDebugCamera();
```

Tato globální funkce vrací singleton instanci volné kamery (nebo null, pokud neexistuje).

### Klíčové metody

```c
// Povolit/zakázat volnou kameru
static void SetActive(bool active);
static bool GetActive();

// Pozice a orientace
vector GetPosition();
void   SetPosition(vector pos);
vector GetOrientation();
void   SetOrientation(vector ori);   // otočení, náklon, naklonění

// Rychlost
void SetFlySpeed(float speed);
float GetFlySpeed();

// Směr kamery
vector GetDirection();
```

**Příklad --- aktivace volné kamery a teleportace:**

```c
void ActivateDebugCamera(vector pos)
{
    FreeDebugCamera.SetActive(true);

    FreeDebugCamera cam = GetFreeDebugCamera();
    if (cam)
    {
        cam.SetPosition(pos);
        cam.SetOrientation(Vector(0, -30, 0));  // Mírně pohled dolů
        cam.SetFlySpeed(10.0);
    }
}
```

---

## Zorné pole (FOV)

Engine řídí FOV nativně. Můžete jej číst a upravovat prostřednictvím systému kamery hráče:

### Čtení FOV

```c
// Získat aktuální FOV kamery
float fov = GetDayZGame().GetFieldOfView();
```

### Přepsání FOV v DayZPlayerCamera

Ve vlastních třídách kamery, které rozšiřují `DayZPlayerCamera`, můžete přepsat FOV:

```c
class MyCustomCamera extends DayZPlayerCamera1stPerson
{
    override float GetCurrentFOV()
    {
        return 0.7854;  // ~45 stupňů (radiány)
    }
}
```

---

## Hloubka ostrosti (DOF)

Hloubka ostrosti je řízena prostřednictvím systému post-processingových efektů (viz [Kapitola 6.5](05-ppe.md)). Systém kamer však pracuje s DOF prostřednictvím těchto mechanismů:

### Nastavení DOF přes World

```c
World world = GetGame().GetWorld();
if (world)
{
    // SetDOF(vzdálenost_zaostření, délka_zaostření, délka_zaostření_blízko, rozmazání, offset_hloubky_zaostření)
    // Všechny hodnoty v metrech
    world.SetDOF(5.0, 100.0, 0.5, 0.3, 0.0);
}
```

### Vypnutí DOF

```c
World world = GetGame().GetWorld();
if (world)
{
    world.SetDOF(0, 0, 0, 0, 0);  // Samé nuly vypnou DOF
}
```

---

## ScriptCamera (GameLib)

**Soubor:** `2_GameLib/entities/scriptcamera.c`

Nízkoúrovňová skriptovaná entita kamery z vrstvy GameLib. Toto je základ pro vlastní implementace kamer.

### Vytvoření kamery

```c
ScriptCamera camera = ScriptCamera.Cast(
    GetGame().CreateObject("ScriptCamera", pos, true)  // pouze lokální
);
```

### Klíčové metody

```c
proto native void SetFOV(float fov);          // FOV v radiánech
proto native void SetNearPlane(float nearPlane);
proto native void SetFarPlane(float farPlane);
proto native void SetFocus(float dist, float len);
```

### Aktivace kamery

```c
// Nastavit tuto kameru jako aktivní renderovací kameru
GetGame().SelectPlayer(null, null);   // Odpojit od hráče
GetGame().ObjectRelease(camera);      // Uvolnit pro engine
```

> **Poznámka:** Přepnutí z kamery hráče vyžaduje pečlivé zacházení se vstupy a HUD. Většina modů používá volnou debug kameru nebo PPE překryvné efekty místo vytváření vlastních kamer.

---

## Raycast z kamery

Běžný vzor je provádění raycastu z pozice kamery ve směru kamery pro nalezení toho, na co se hráč dívá:

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

## Shrnutí

| Koncept | Klíčový bod |
|---------|-------------|
| Globální přístupové metody | `GetCurrentCameraPosition()`, `GetCurrentCameraDirection()`, `GetScreenPos()` |
| Typy kamer | Konstanty `DayZPlayerCameras` (1ST, 3RD_ERC, IRONSIGHTS, OPTICS, VEHICLE atd.) |
| Aktuální typ | `player.GetCurrentCameraType()` |
| Volná kamera | `FreeDebugCamera.SetActive(true)`, pak `GetFreeDebugCamera()` |
| FOV | `GetDayZGame().GetFieldOfView()` pro čtení, přepsat `GetCurrentFOV()` ve třídě kamery |
| DOF | `GetGame().GetWorld().SetDOF(zaostření, délka, blízko, rozmazání, offset)` |
| Převod na obrazovku | `GetScreenPos(worldPos)` vrací pixel XY + hloubku Z |

---

## Osvědčené postupy

- **Cachujte pozici kamery při opakovaném dotazování v rámci jednoho snímku.** `GetGame().GetCurrentCameraPosition()` a `GetCurrentCameraDirection()` jsou volání enginu -- uložte výsledek do lokální proměnné, pokud ho potřebujete ve více výpočtech v rámci jednoho snímku.
- **Používejte kontrolu hloubky `GetScreenPos()` před umístěním UI.** Vždy ověřte `screenPos[2] > 0` (před kamerou) před vykreslováním HUD značek na světových pozicích, jinak se značky objeví zrcadlově za hráčem.
- **Vyhněte se vytváření vlastních instancí ScriptCamera pro jednoduché efekty.** FreeDebugCamera a systém PPE pokrývají většinu filmových a vizuálních potřeb. Vlastní kamery vyžadují pečlivou správu vstupů/HUD, která se snadno rozbije.
- **Respektujte přechody typů kamer enginu.** Nevynucujte změny typu kamery ze skriptu, pokud plně nezvládáte stav řídicího systému hráče. Neočekávané přepnutí kamery může zablokovat pohyb hráče nebo způsobit desynchronizaci.
- **Zabezpečte použití volné kamery za kontrolou admin/debug oprávnění.** FreeDebugCamera poskytuje neomezený pohled na svět. Povolte ji pouze pro ověřené administrátory nebo diagnostické buildy, aby se předešlo zneužití.

---

## Kompatibilita a dopad

- **Multi-Mod:** Přístupové metody kamery jsou globální jen pro čtení, takže více modů může bezpečně číst stav kamery současně. Konflikty vznikají pouze pokud dva mody oba aktivují FreeDebugCamera nebo vlastní instance ScriptCamera.
- **Výkon:** `GetScreenPos()` a `GetCurrentCameraPosition()` jsou lehká volání enginu. Raycast z kamery (`DayZPhysics.RaycastRV`) je náročnější -- omezte na jednou za snímek, ne za entitu.
- **Server/Klient:** Stav kamery existuje pouze na klientovi. Všechny metody kamery vracejí bezvýznamná data na dedikovaném serveru. Nikdy nepoužívejte dotazy na kameru v serverové logice.

---

[<< Předchozí: Počasí](03-weather.md) | **Kamery** | [Další: Post-processingové efekty >>](05-ppe.md)
