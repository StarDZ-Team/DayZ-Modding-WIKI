# 8.10. fejezet: Egyéni jármű mod készítése

[Főoldal](../../README.md) | [<< Előző: Professzionális mod sablon](09-professional-template.md) | **Egyéni jármű készítése** | [Következő: Egyéni ruházat készítése >>](11-clothing-mod.md)

---

> **Összefoglaló:** Ez a bemutató végigvezet egy egyéni járművariáns létrehozásán a DayZ-ben egy meglévő vanilla jármű kiterjesztésével. A járművet a config.cpp-ben definiálod, testreszabod a statisztikáit és textúráit, szkript viselkedést írsz az ajtókhoz és a motorhoz, hozzáadod a szerver spawn táblához előre csatolt alkatrészekkel, és teszteled játékon belül. A végére egy teljesen vezethető egyéni Offroad Hatchback variánsod lesz módosított teljesítménnyel és megjelenéssel.

---

## Tartalomjegyzék

- [Mit építünk](#mit-építünk)
- [Előfeltételek](#előfeltételek)
- [1. lépés: A config létrehozása (config.cpp)](#1-lépés-a-config-létrehozása-configcpp)
- [2. lépés: Egyéni textúrák](#2-lépés-egyéni-textúrák)
- [3. lépés: Szkript viselkedés (CarScript)](#3-lépés-szkript-viselkedés-carscript)
- [4. lépés: types.xml bejegyzés](#4-lépés-typesxml-bejegyzés)
- [5. lépés: Összeállítás és tesztelés](#5-lépés-összeállítás-és-tesztelés)
- [6. lépés: Finomhangolás](#6-lépés-finomhangolás)
- [Teljes kód referencia](#teljes-kód-referencia)
- [Legjobb gyakorlatok](#legjobb-gyakorlatok)
- [Elmélet vs gyakorlat](#elmélet-vs-gyakorlat)
- [Amit tanultál](#amit-tanultál)
- [Gyakori hibák](#gyakori-hibák)

---

## Mit építünk

Egy **MFM Rally Hatchback** nevű járművet hozunk létre -- a vanilla Offroad Hatchback (a Niva) módosított változatát a következőkkel:

- Egyéni újratextúrázott karosszéria panelek rejtett szelekciókat használva
- Módosított motor teljesítmény (gyorsabb végsebesség, magasabb üzemanyag-fogyasztás)
- Módosított sérülési zóna életerő értékek (ellenállóbb motor, gyengébb ajtók)
- Minden szabványos jármű viselkedés: ajtók nyitása, motor indítás/leállítás, üzemanyag, fények, legénység be/kiszállás
- Spawn tábla bejegyzés előre csatolt kerekekkel és alkatrészekkel

Az `OffroadHatchback` osztályt terjesztjük ki ahelyett, hogy nulláról építenénk járművet. Ez a szokásos munkafolyamat jármű modoknál, mert örökli a modellt, animációkat, fizikai geometriát és az összes meglévő viselkedést. Csak azt kell felülírnod, amit változtatni szeretnél.

---

## Előfeltételek

- Működő mod struktúra (először végezd el a [8.1. fejezetet](01-first-mod.md) és a [8.2. fejezetet](02-custom-item.md))
- Egy szövegszerkesztő
- DayZ Tools telepítve (textúra konverzióhoz, opcionális)
- Alapvető ismeretek a config.cpp osztályöröklés működéséről

A modod kiinduló struktúrája legyen ilyen:

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
    Data/
        config.cpp
```

---

## 1. lépés: A config létrehozása (config.cpp)

A jármű definíciók a `CfgVehicles`-ben élnek, akárcsak a tárgyak. Az osztálynév ellenére a `CfgVehicles` mindent tartalmaz -- tárgyakat, épületeket és valódi járműveket egyaránt. A járművek esetében a kulcskülönbség a szülőosztály és a sérülési zónák, csatolmányok és szimulációs paraméterek kiegészítő konfigurációja.

### A Data config.cpp frissítése

Nyisd meg a `MyFirstMod/Data/config.cpp` fájlt és add hozzá a jármű osztályt. Ha már vannak tárgy definícióid a 8.2. fejezetből, add hozzá a jármű osztályt a meglévő `CfgVehicles` blokkba.

```cpp
class CfgPatches
{
    class MyFirstMod_Vehicles
    {
        units[] = { "MFM_RallyHatchback" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Vehicles_Wheeled"
        };
    };
};

class CfgVehicles
{
    class OffroadHatchback;

    class MFM_RallyHatchback : OffroadHatchback
    {
        scope = 2;
        displayName = "Rally Hatchback";
        descriptionShort = "A modified offroad hatchback built for speed.";

        // --- Rejtett szekciók az újratextúrázáshoz ---
        hiddenSelections[] =
        {
            "camoGround",
            "camoMale",
            "driverDoors",
            "coDriverDoors",
            "intHood",
            "intTrunk"
        };
        hiddenSelectionsTextures[] =
        {
            "MyFirstMod\Data\Textures\rally_body_co.paa",
            "MyFirstMod\Data\Textures\rally_body_co.paa",
            "",
            "",
            "",
            ""
        };

        // --- Szimuláció (fizika és motor) ---
        class SimulationModule : SimulationModule
        {
            // Meghajtás típusa: 0 = hátsókerék, 1 = elsőkerék, 2 = összkerék
            drive = 2;

            class Throttle
            {
                reactionTime = 0.75;
                defaultThrust = 0.85;
                gentleThrust = 0.65;
                turboCoef = 4.0;
                gentleCoef = 0.5;
            };

            class Engine
            {
                inertia = 0.15;
                torqueMax = 160;
                torqueRpm = 4200;
                powerMax = 95;
                powerRpm = 5600;
                rpmIdle = 850;
                rpmMin = 900;
                rpmClutch = 1400;
                rpmRedline = 6500;
                rpmMax = 7500;
            };

            class Gearbox
            {
                reverse = 3.526;
                ratios[] = { 3.667, 2.1, 1.361, 1.0 };
                transmissionRatio = 3.857;
            };

            braking[] = { 0.0, 0.1, 0.8, 0.9, 0.95, 1.0 };
        };

        // --- Sérülési zónák ---
        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 1000;
                    healthLevels[] =
                    {
                        { 1.0, {} },
                        { 0.7, {} },
                        { 0.5, {} },
                        { 0.3, {} },
                        { 0.0, {} }
                    };
                };
            };

            class DamageZones
            {
                class Chassis
                {
                    class Health
                    {
                        hitpoints = 3000;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_chassis" };
                    inventorySlots[] = {};
                };

                class Engine
                {
                    class Health
                    {
                        hitpoints = 1200;
                        transferToGlobalCoef = 1;
                    };
                    fatalInjuryCoef = 0.001;
                    componentNames[] = { "yourcar_engine" };
                    inventorySlots[] = {};
                };

                class FuelTank
                {
                    class Health
                    {
                        hitpoints = 600;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_fueltank" };
                    inventorySlots[] = {};
                };

                class Front
                {
                    class Health
                    {
                        hitpoints = 1500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_front" };
                    inventorySlots[] = { "NivaHood" };
                };

                class Rear
                {
                    class Health
                    {
                        hitpoints = 1500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_rear" };
                    inventorySlots[] = { "NivaTrunk" };
                };

                class Body
                {
                    class Health
                    {
                        hitpoints = 2000;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_body" };
                    inventorySlots[] = {};
                };

                class WindowFront
                {
                    class Health
                    {
                        hitpoints = 150;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_windowfront" };
                    inventorySlots[] = {};
                };

                class WindowLR
                {
                    class Health
                    {
                        hitpoints = 150;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_windowLR" };
                    inventorySlots[] = {};
                };

                class WindowRR
                {
                    class Health
                    {
                        hitpoints = 150;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_windowRR" };
                    inventorySlots[] = {};
                };

                class Door_1_1
                {
                    class Health
                    {
                        hitpoints = 500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_door_1_1" };
                    inventorySlots[] = { "NivaDriverDoors" };
                };

                class Door_2_1
                {
                    class Health
                    {
                        hitpoints = 500;
                        transferToGlobalCoef = 0;
                    };
                    fatalInjuryCoef = -1;
                    componentNames[] = { "yourcar_dmgzone_door_2_1" };
                    inventorySlots[] = { "NivaCoDriverDoors" };
                };
            };
        };
    };
};
```

### Kulcsmezők magyarázata

| Mező | Cél |
|-------|---------|
| `scope = 2` | Spawnolhatóvá teszi a járművet. Használj `0`-t olyan alaposztályokhoz, amelyek soha nem spawnolhatnak közvetlenül. |
| `displayName` | Az admin eszközökben és játékon belül megjelenő név. Használhatsz `$STR_` hivatkozásokat lokalizációhoz. |
| `requiredAddons[]` | Tartalmaznia kell a `"DZ_Vehicles_Wheeled"` értéket, hogy az `OffroadHatchback` szülőosztály a te osztályod előtt töltődjön be. |
| `hiddenSelections[]` | Textúra slotok a modellen, amelyeket felül szeretnél írni. Meg kell egyezniük a modell nevesített szelekcióival. |
| `SimulationModule` | Fizika és motor konfiguráció. Szabályozza a sebességet, nyomatékot, áttételt és fékezést. |
| `DamageSystem` | Meghatározza az életerő készleteket a jármű minden egyes alkatrészéhez (motor, ajtók, ablakok, karosszéria). |

### A szülőosztályról

```cpp
class OffroadHatchback;
```

Ez az előzetes deklaráció közli a config feldolgozóval, hogy az `OffroadHatchback` létezik a vanilla DayZ-ben. A járműved ezután ebből öröklődik, megkapva a teljes Niva modellt, animációkat, fizikai geometriát, csatolási pontokat és proxy definíciókat. Csak azt kell felülírnod, amit változtatni akarsz.

Más vanilla jármű szülőosztályok, amelyeket kiterjeszthetsz:

| Szülőosztály | Jármű |
|-------------|---------|
| `OffroadHatchback` | Niva (4 üléses ferdehátú) |
| `CivilianSedan` | Olga (4 üléses szedán) |
| `Hatchback_02` | Golf/Gunter (4 üléses ferdehátú) |
| `Sedan_02` | Sarka 120 (4 üléses szedán) |
| `Offroad_02` | Humvee (4 üléses terepjáró) |
| `Truck_01_Base` | V3S (teherautó) |

### A SimulationModule-ról

A `SimulationModule` szabályozza, hogyan vezethető a jármű. Kulcsparaméterek:

| Paraméter | Hatás |
|-----------|--------|
| `drive` | `0` = hátsókerék-hajtás, `1` = elsőkerék-hajtás, `2` = összkerék-hajtás |
| `torqueMax` | Csúcsnyomaték Nm-ben. Magasabb = több gyorsulás. A vanilla Niva ~114. |
| `powerMax` | Csúcs lóerő. Magasabb = gyorsabb végsebesség. A vanilla Niva ~68. |
| `rpmRedline` | Motor piros zóna fordulatszám. Ezen túl a motor a fordulatszám-korlátozóhoz ér. |
| `ratios[]` | Áttételi arányok. Alacsonyabb számok = hosszabb fokozatok = magasabb végsebesség, de lassabb gyorsulás. |
| `transmissionRatio` | Végáttétel arány. Szorzóként hat az összes fokozatra. |

### A sérülési zónákról

Minden sérülési zónának saját életerő készlete van. Amikor egy zóna életereje eléri a nullát, az adott alkatrész tönkremegy:

| Zóna | Hatás tönkremenéskor |
|------|-------------------|
| `Engine` | A jármű nem indítható |
| `FuelTank` | Üzemanyag szivárog |
| `Front` / `Rear` | Vizuális sérülés, csökkentett védelem |
| `Door_1_1` / `Door_2_1` | Az ajtó leesik |
| `WindowFront` | Az ablak betörik (hangszigetelés csökken) |

A `transferToGlobalCoef` érték meghatározza, mennyi sérülés kerül át erről a zónáról a jármű globális életerejére. `1` azt jelenti 100% átvitel (a motor sérülése az összállapotot rontja), `0` azt jelenti nincs átvitel.

A `componentNames[]` értékeknek egyezniük kell a jármű geometria LOD-jában található nevesített komponensekkel. Mivel a Niva modellt örököljük, itt helyőrző neveket használunk -- a szülőosztály geometria komponensei számítanak az ütközésérzékeléshez. Ha a vanilla modellt módosítás nélkül használod, a szülő komponens-hozzárendelése automatikusan érvényes.

---

## 2. lépés: Egyéni textúrák

### Hogyan működnek a jármű rejtett szekciók

A jármű rejtett szekciók ugyanúgy működnek, mint a tárgy textúrák, de a járműveknek jellemzően több szekció slotjuk van. Az Offroad Hatchback modell szekciókat használ különböző karosszéria panelekhez, lehetővé téve a szín variánsokat (Fehér, Kék) a vanillában.

### Vanilla textúrák használata (leggyorsabb kezdés)

Kezdeti teszteléshez irányítsd a rejtett szelekcióidat meglévő vanilla textúrákra. Ez megerősíti, hogy a configod működik, mielőtt egyéni grafikát hoznál létre:

```cpp
hiddenSelectionsTextures[] =
{
    "\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa",
    "\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa",
    "",
    "",
    "",
    ""
};
```

Az üres sztringek `""` azt jelentik, hogy "használd a modell alapértelmezett textúráját ehhez a szelekcióhoz."

### Egyéni textúra készlet létrehozása

Egyedi megjelenés létrehozásához:

1. **Csomagold ki a vanilla textúrát** a DayZ Tools Addon Builder-ével vagy a P: meghajtóval, keresve:
   ```
   P:\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa
   ```

2. **Konvertáld szerkeszthető formátumba** a TexView2 segítségével:
   - Nyisd meg a `.paa` fájlt a TexView2-ben
   - Exportáld `.tga` vagy `.png` formátumba

3. **Szerkeszd a képszerkesztődben** (GIMP, Photoshop, Paint.NET):
   - A jármű textúrák jellemzően **2048x2048** vagy **4096x4096** méretűek
   - Módosítsd a színeket, adj hozzá matricákat, versenycsíkokat vagy rozsda effekteket
   - Tartsd meg az UV elrendezést -- csak a színeket és részleteket változtasd

4. **Konvertáld vissza `.paa` formátumba**:
   - Nyisd meg a szerkesztett képet a TexView2-ben
   - Mentsd `.paa` formátumban
   - Mentsd ide: `MyFirstMod/Data/Textures/rally_body_co.paa`

### Textúra elnevezési konvenciók járművekhez

| Utótag | Típus | Cél |
|--------|------|---------|
| `_co` | Szín (Diffuse) | Fő szín és megjelenés |
| `_nohq` | Normal Map | Felületi egyenetlenségek, panel vonalak, szegecs részletek |
| `_smdi` | Specular | Fémes csillogás, festék visszaverődések |
| `_as` | Alpha/Surface | Átlátszóság ablakokhoz |
| `_de` | Destruct | Sérülés overlay textúrák |

Első jármű modhoz csak a `_co` textúra szükséges. A modell az alapértelmezett normal és specular térképeit használja.

### Anyagok egyeztetése (opcionális)

Teljes anyagvezérléshez hozz létre egy `.rvmat` fájlt:

```cpp
hiddenSelectionsMaterials[] =
{
    "MyFirstMod\Data\Textures\rally_body.rvmat",
    "MyFirstMod\Data\Textures\rally_body.rvmat",
    "",
    "",
    "",
    ""
};
```

---

## 3. lépés: Szkript viselkedés (CarScript)

A jármű szkript osztályok vezérlik a motor hangokat, ajtó logikát, legénység be/kiszállási viselkedést és ülés animációkat. Mivel az `OffroadHatchback`-et terjesztjük ki, örököljük az összes vanilla viselkedést és csak azt írjuk felül, amit testreszabni akarunk.

### A szkript fájl létrehozása

Hozd létre a mappastruktúrát és a szkript fájlt:

```
MyFirstMod/
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_RallyHatchback.c
```

### A Scripts config.cpp frissítése

A `Scripts/config.cpp` fájlnak regisztrálnia kell a `4_World` réteget, hogy a motor betöltse a szkriptedet:

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Vehicles_Wheeled"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "World" };

        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/4_World" };
            };
        };
    };
};
```

### A jármű szkript megírása

Hozd létre a `4_World/MyFirstMod/MFM_RallyHatchback.c` fájlt:

```c
class MFM_RallyHatchback extends OffroadHatchback
{
    void MFM_RallyHatchback()
    {
        // Motor hangok felülírása (vanilla Niva hangok újrafelhasználása)
        m_EngineStartOK         = "offroad_engine_start_SoundSet";
        m_EngineStartBattery    = "offroad_engine_failed_start_battery_SoundSet";
        m_EngineStartPlug       = "offroad_engine_failed_start_sparkplugs_SoundSet";
        m_EngineStartFuel       = "offroad_engine_failed_start_fuel_SoundSet";
        m_EngineStop            = "offroad_engine_stop_SoundSet";
        m_EngineStopFuel        = "offroad_engine_stop_fuel_SoundSet";

        m_CarDoorOpenSound      = "offroad_door_open_SoundSet";
        m_CarDoorCloseSound     = "offroad_door_close_SoundSet";
        m_CarSeatShiftInSound   = "Offroad_SeatShiftIn_SoundSet";
        m_CarSeatShiftOutSound  = "Offroad_SeatShiftOut_SoundSet";

        m_CarHornShortSoundName = "Offroad_Horn_Short_SoundSet";
        m_CarHornLongSoundName  = "Offroad_Horn_SoundSet";

        // Motor pozíció a modell térben (x, y, z) -- hőmérséklet
        // forráshoz, vízbemerülés érzékeléshez és részecskehatásokhoz
        SetEnginePos("0 0.7 1.2");
    }

    // --- Animáció példány ---
    // Meghatározza, melyik játékos animáció készlet használatos be/kiszálláskor.
    // Egyeznie kell a jármű csontvázával. Mivel a Niva modellt használjuk, HATCHBACK marad.
    override int GetAnimInstance()
    {
        return VehicleAnimInstances.HATCHBACK;
    }

    // --- Kamera távolság ---
    // Milyen messze van a harmadik személyű kamera a jármű mögött.
    // A vanilla Niva 3.5. Növeld a szélesebb nézethez.
    override float GetTransportCameraDistance()
    {
        return 4.0;
    }

    // --- Ülés animáció típusok ---
    // Minden ülésindexet hozzárendel egy játékos animáció típushoz.
    // 0 = vezető, 1 = utastárs, 2 = hátsó bal, 3 = hátsó jobb.
    override int GetSeatAnimationType(int posIdx)
    {
        switch (posIdx)
        {
        case 0:
            return DayZPlayerConstants.VEHICLESEAT_DRIVER;
        case 1:
            return DayZPlayerConstants.VEHICLESEAT_CODRIVER;
        case 2:
            return DayZPlayerConstants.VEHICLESEAT_PASSENGER_L;
        case 3:
            return DayZPlayerConstants.VEHICLESEAT_PASSENGER_R;
        }

        return 0;
    }

    // --- Ajtó állapot ---
    // Visszaadja, hogy egy ajtó hiányzik, nyitva vagy csukva van.
    // A slot nevek (NivaDriverDoors, NivaCoDriverDoors, NivaHood, NivaTrunk)
    // a modell inventory slot proxy-jai által vannak definiálva.
    override int GetCarDoorsState(string slotType)
    {
        CarDoor carDoor;

        Class.CastTo(carDoor, FindAttachmentBySlotName(slotType));
        if (!carDoor)
        {
            return CarDoorState.DOORS_MISSING;
        }

        switch (slotType)
        {
            case "NivaDriverDoors":
                return TranslateAnimationPhaseToCarDoorState("DoorsDriver");

            case "NivaCoDriverDoors":
                return TranslateAnimationPhaseToCarDoorState("DoorsCoDriver");

            case "NivaHood":
                return TranslateAnimationPhaseToCarDoorState("DoorsHood");

            case "NivaTrunk":
                return TranslateAnimationPhaseToCarDoorState("DoorsTrunk");
        }

        return CarDoorState.DOORS_MISSING;
    }

    // --- Legénység be/kiszállás ---
    // Meghatározza, hogy egy játékos be tud-e szállni egy adott ülésbe,
    // illetve ki tud-e szállni belőle.
    // Ellenőrzi az ajtó állapotot és az ülés-hajtogatás animáció fázisát.
    // Az első ülések (0, 1) megkövetelik, hogy az ajtó nyitva legyen.
    // A hátsó ülések (2, 3) megkövetelik, hogy az ajtó nyitva legyen ÉS az első ülés előre legyen hajtva.
    override bool CrewCanGetThrough(int posIdx)
    {
        switch (posIdx)
        {
            case 0:
                if (GetCarDoorsState("NivaDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatDriver") > 0.5)
                    return false;
                return true;

            case 1:
                if (GetCarDoorsState("NivaCoDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatCoDriver") > 0.5)
                    return false;
                return true;

            case 2:
                if (GetCarDoorsState("NivaDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatDriver") <= 0.5)
                    return false;
                return true;

            case 3:
                if (GetCarDoorsState("NivaCoDriverDoors") == CarDoorState.DOORS_CLOSED)
                    return false;
                if (GetAnimationPhase("SeatCoDriver") <= 0.5)
                    return false;
                return true;
        }

        return false;
    }

    // --- Motorháztető ellenőrzés csatolmányokhoz ---
    // Megakadályozza, hogy a játékosok eltávolítsák a motor alkatrészeket csukott motorháznál.
    override bool CanReleaseAttachment(EntityAI attachment)
    {
        if (!super.CanReleaseAttachment(attachment))
        {
            return false;
        }

        if (EngineIsOn() || GetCarDoorsState("NivaHood") == CarDoorState.DOORS_CLOSED)
        {
            string attType = attachment.GetType();
            if (attType == "CarRadiator" || attType == "CarBattery" || attType == "SparkPlug")
            {
                return false;
            }
        }

        return true;
    }

    // --- Rakodótér hozzáférés ---
    // A csomagtartónak nyitva kell lennie a jármű rakodóteréhez való hozzáféréshez.
    override bool CanDisplayCargo()
    {
        if (!super.CanDisplayCargo())
        {
            return false;
        }

        if (GetCarDoorsState("NivaTrunk") == CarDoorState.DOORS_CLOSED)
        {
            return false;
        }

        return true;
    }

    // --- Motortér hozzáférés ---
    // A motorháznak nyitva kell lennie a motor csatolmány slotok megjelenítéséhez.
    override bool CanDisplayAttachmentCategory(string category_name)
    {
        if (!super.CanDisplayAttachmentCategory(category_name))
        {
            return false;
        }

        category_name.ToLower();
        if (category_name.Contains("engine"))
        {
            if (GetCarDoorsState("NivaHood") == CarDoorState.DOORS_CLOSED)
            {
                return false;
            }
        }

        return true;
    }

    // --- Debug spawn ---
    // Meghívásra kerül a debug menüből történő spawnoláskor. Minden alkatrésszel
    // és feltöltött folyadékokkal spawnol az azonnali teszteléshez.
    override void OnDebugSpawn()
    {
        SpawnUniversalParts();
        SpawnAdditionalItems();
        FillUpCarFluids();

        GameInventory inventory = GetInventory();
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");

        inventory.CreateInInventory("HatchbackDoors_Driver");
        inventory.CreateInInventory("HatchbackDoors_CoDriver");
        inventory.CreateInInventory("HatchbackHood");
        inventory.CreateInInventory("HatchbackTrunk");

        // Pótkerekek a rakodótérben
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
    }
};
```

### Kulcs felülírások megértése

**GetAnimInstance** -- Visszaadja, melyik animáció készletet használja a játékos a járműben ülve. Az enum értékek:

| Érték | Konstans | Jármű típus |
|-------|----------|-------------|
| 0 | `CIVVAN` | Furgon |
| 1 | `V3S` | V3S teherautó |
| 2 | `SEDAN` | Olga szedán |
| 3 | `HATCHBACK` | Niva ferdehátú |
| 5 | `S120` | Sarka 120 |
| 7 | `GOLF` | Gunter 2 |
| 8 | `HMMWV` | Humvee |

Ha ezt rossz értékre állítod, a játékos animációja átlóg a járművön vagy helytelenül jelenik meg. Mindig egyeztesd a használt modellel.

**CrewCanGetThrough** -- Minden frame-ben meghívásra kerül annak meghatározására, hogy egy játékos be tud-e szállni vagy ki tud-e szállni egy ülésből. A Niva hátsó ülései (2-es és 3-as index) másként működnek, mint az első ülések: az első ülés háttámláját előre kell hajtani (animáció fázis > 0.5), mielőtt a hátsó utasok átjuthatnának. Ez megegyezik a 2 ajtós ferdehátú valós viselkedésével, ahol a hátsó utasoknak meg kell dönteniük az első ülést.

**OnDebugSpawn** -- A debug spawn menü használatakor hívódik meg. A `SpawnUniversalParts()` hozzáad fényszóró izzókat és akkumulátort. A `FillUpCarFluids()` feltölti az üzemanyagot, hűtőfolyadékot, olajat és fékfolyadékot maximumra. Ezután kerekeket, ajtókat, motorházat és csomagtartót hozunk létre. Így azonnal vezethető járművet kapsz teszteléshez.

---

## 4. lépés: types.xml bejegyzés

### Jármű spawn konfiguráció

A járművek a `types.xml`-ben ugyanazt a formátumot használják, mint a tárgyak, de néhány fontos különbséggel. Add hozzá ezt a szervered `types.xml` fájljához:

```xml
<type name="MFM_RallyHatchback">
    <nominal>3</nominal>
    <lifetime>3888000</lifetime>
    <restock>0</restock>
    <min>1</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="vehicles" />
    <usage name="Coast" />
    <usage name="Farm" />
    <usage name="Village" />
    <value name="Tier1" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

### Jármű vs tárgy különbségek a types.xml-ben

| Beállítás | Tárgyak | Járművek |
|---------|-------|----------|
| `nominal` | 10-50+ | 1-5 (a járművek ritkák) |
| `lifetime` | 3600-14400 | 3888000 (45 nap -- a járművek sokáig megmaradnak) |
| `restock` | 1800 | 0 (a járművek nem töltődnek automatikusan újra; csak az előző megsemmisülése és eltűnése után spawnolnak újra) |
| `category` | `tools`, `weapons`, stb. | `vehicles` |

### Előre csatolt alkatrészek a cfgspawnabletypes.xml-lel

A járművek alapértelmezetten üres vázként spawnolnak -- kerekek, ajtók vagy motor alkatrészek nélkül. Ahhoz, hogy előre csatolt alkatrészekkel spawnoljanak, adj hozzá bejegyzéseket a `cfgspawnabletypes.xml` fájlhoz a szerver mission mappában:

```xml
<type name="MFM_RallyHatchback">
    <attachments chance="1.00">
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.60" />
        <item name="HatchbackWheel" chance="0.40" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackDoors_Driver" chance="0.50" />
        <item name="HatchbackDoors_CoDriver" chance="0.50" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackHood" chance="0.60" />
        <item name="HatchbackTrunk" chance="0.60" />
    </attachments>
    <attachments chance="0.70">
        <item name="CarBattery" chance="0.30" />
        <item name="SparkPlug" chance="0.30" />
    </attachments>
    <attachments chance="0.50">
        <item name="CarRadiator" chance="0.40" />
    </attachments>
    <attachments chance="0.30">
        <item name="HeadlightH7" chance="0.50" />
        <item name="HeadlightH7" chance="0.50" />
    </attachments>
</type>
```

### Hogyan működik a cfgspawnabletypes

Minden `<attachments>` blokk függetlenül kerül kiértékelésre:
- A külső `chance` határozza meg, hogy ez a csatolmánycsoport egyáltalán figyelembe vételre kerül-e
- Minden egyes `<item>` elemnek saját `chance` értéke van az elhelyezésre
- Az elemek a jármű első elérhető, megfelelő slotjába kerülnek

Ez azt jelenti, hogy egy jármű spawnolhat 3 kerékkel és ajtók nélkül, vagy minden kerékkel és akkumulátorral, de gyertya nélkül. Ez hozza létre az alkatrész-kereső játékmenetet -- a játékosoknak meg kell találniuk a hiányzó alkatrészeket.

---

## 5. lépés: Összeállítás és tesztelés

### PBO-k csomagolása

Két PBO-ra van szükséged ehhez a modhoz:

```
@MyFirstMod/
    mod.cpp
    Addons/
        Scripts.pbo          <-- A Scripts/config.cpp és 4_World/ tartalmazza
        Data.pbo             <-- A Data/config.cpp és Textures/ tartalmazza
```

Használd a DayZ Tools Addon Builder-ét:
1. **Scripts PBO:** Forrás = `MyFirstMod/Scripts/`, Prefix = `MyFirstMod/Scripts`
2. **Data PBO:** Forrás = `MyFirstMod/Data/`, Prefix = `MyFirstMod/Data`

Vagy használj fájl javítást fejlesztés közben:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

### A jármű spawnolása a szkript konzolon

1. Indítsd el a DayZ-t a betöltött moddal
2. Csatlakozz a szerveredhez vagy indíts offline módot
3. Nyisd meg a szkript konzolt
4. Teljesen felszerelt jármű spawnolásához a karaktered közelében:

```c
EntityAI vehicle;
vector pos = GetGame().GetPlayer().GetPosition();
pos[2] = pos[2] + 5;
vehicle = EntityAI.Cast(GetGame().CreateObject("MFM_RallyHatchback", pos, false, false, true));
```

5. Nyomd meg az **Execute** gombot

A járműnek 5 méterrel előtted kell megjelennie.

### Azonnal vezethető jármű spawnolása

Gyorsabb teszteléshez spawnold a járművet és használd a debug spawn metódust, ami csatolja az összes alkatrészt:

```c
vector pos = GetGame().GetPlayer().GetPosition();
pos[2] = pos[2] + 5;
Object obj = GetGame().CreateObject("MFM_RallyHatchback", pos, false, false, true);
CarScript car = CarScript.Cast(obj);
if (car)
{
    car.OnDebugSpawn();
}
```

Ez meghívja az `OnDebugSpawn()` felülírásodat, ami feltölti a folyadékokat és csatolja a kerekeket, ajtókat, motorházat és csomagtartót.

### Mit tesztelj

| Ellenőrzés | Mire figyelj |
|-------|-----------------|
| **Jármű spawnol** | Megjelenik a világban a szkript naplóban hibák nélkül |
| **Textúrák alkalmazva** | Az egyéni karosszéria szín látható (egyéni textúrák használata esetén) |
| **Motor indul** | Szállj be, tartsd a motor indítás gombot. Hallgasd az indítás hangját. |
| **Vezetés** | A gyorsulás, végsebesség, kezelhetőség érezhetően eltér a vanillától |
| **Ajtók** | Nyitható/csukható a vezető és utastárs ajtaja |
| **Motorház/Csomagtartó** | Nyitható a motorház a motor alkatrészek eléréséhez. Nyitható a csomagtartó a rakodótérért. |
| **Hátsó ülések** | Hajtsd előre az első ülést, majd szállj be a hátsó ülésbe |
| **Üzemanyag-fogyasztás** | Vezess és figyeld az üzemanyag mérőt |
| **Sérülés** | Lődd meg a járművet. Az alkatrészeknek sérülniük és végül tönkremenniük kell. |
| **Fények** | A fényszórók és hátsó lámpák működnek éjszaka |

### A szkript napló olvasása

Ha a jármű nem spawnol vagy helytelenül viselkedik, ellenőrizd a szkript naplót itt:

```
%localappdata%\DayZ\<YourProfile>\script.log
```

Gyakori hibák:

| Napló üzenet | Ok |
|-------------|-------|
| `Cannot create object type MFM_RallyHatchback` | config.cpp osztálynév eltérés vagy a Data PBO nincs betöltve |
| `Undefined variable 'OffroadHatchback'` | A `requiredAddons`-ból hiányzik a `"DZ_Vehicles_Wheeled"` |
| `Member not found` metódus hívásnál | Elgépelés a felülírt metódus nevében |

---

## 6. lépés: Finomhangolás

### Egyéni kürt hang

Egyedi kürt adásához a járművednek definiálj egyéni hangkészleteket a Data config.cpp fájlodban:

```cpp
class CfgSoundShaders
{
    class MFM_RallyHorn_SoundShader
    {
        samples[] = {{ "MyFirstMod\Data\Sounds\rally_horn", 1 }};
        volume = 1.0;
        range = 150;
        limitation = 0;
    };
    class MFM_RallyHornShort_SoundShader
    {
        samples[] = {{ "MyFirstMod\Data\Sounds\rally_horn_short", 1 }};
        volume = 1.0;
        range = 100;
        limitation = 0;
    };
};

class CfgSoundSets
{
    class MFM_RallyHorn_SoundSet
    {
        soundShaders[] = { "MFM_RallyHorn_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 1;
    };
    class MFM_RallyHornShort_SoundSet
    {
        soundShaders[] = { "MFM_RallyHornShort_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 1;
    };
};
```

Ezután hivatkozd meg a szkript konstruktorodban:

```c
m_CarHornShortSoundName = "MFM_RallyHornShort_SoundSet";
m_CarHornLongSoundName  = "MFM_RallyHorn_SoundSet";
```

A hangfájloknak `.ogg` formátumúaknak kell lenniük. A `samples[]`-ban lévő útvonal NEM tartalmazza a fájl kiterjesztést.

### Egyéni fényszórók

Létrehozhatsz egyéni fény osztályt a fényszóró fényerő, szín vagy hatótáv módosításához:

```c
class MFM_RallyFrontLight extends CarLightBase
{
    void MFM_RallyFrontLight()
    {
        // Tompított fény (szegregált)
        m_SegregatedBrightness = 7;
        m_SegregatedRadius = 65;
        m_SegregatedAngle = 110;
        m_SegregatedColorRGB = Vector(0.9, 0.9, 1.0);

        // Távolsági fény (aggregált)
        m_AggregatedBrightness = 14;
        m_AggregatedRadius = 90;
        m_AggregatedAngle = 120;
        m_AggregatedColorRGB = Vector(0.9, 0.9, 1.0);

        FadeIn(0.3);
        SetFadeOutTime(0.25);

        SegregateLight();
    }
};
```

Felülírás a jármű osztályodban:

```c
override CarLightBase CreateFrontLight()
{
    return CarLightBase.Cast(ScriptedLightBase.CreateLight(MFM_RallyFrontLight));
}
```

### Hangszigetelés (OnSound)

Az `OnSound` felülírás szabályozza, mennyire tompítja a kabin a motor zaját az ajtó és ablak állapot alapján:

```c
override float OnSound(CarSoundCtrl ctrl, float oldValue)
{
    switch (ctrl)
    {
    case CarSoundCtrl.DOORS:
        float newValue = 0;
        if (GetCarDoorsState("NivaDriverDoors") == CarDoorState.DOORS_CLOSED)
        {
            newValue = newValue + 0.5;
        }
        if (GetCarDoorsState("NivaCoDriverDoors") == CarDoorState.DOORS_CLOSED)
        {
            newValue = newValue + 0.5;
        }
        if (GetCarDoorsState("NivaTrunk") == CarDoorState.DOORS_CLOSED)
        {
            newValue = newValue + 0.3;
        }
        if (GetHealthLevel("WindowFront") == GameConstants.STATE_RUINED)
        {
            newValue = newValue - 0.6;
        }
        if (GetHealthLevel("WindowLR") == GameConstants.STATE_RUINED)
        {
            newValue = newValue - 0.2;
        }
        if (GetHealthLevel("WindowRR") == GameConstants.STATE_RUINED)
        {
            newValue = newValue - 0.2;
        }
        return Math.Clamp(newValue, 0, 1);
    }

    return super.OnSound(ctrl, oldValue);
}
```

Az `1.0` érték teljes szigetelést jelent (csendes kabin), a `0.0` nincs szigetelést (szabad levegős érzés).

---

## Teljes kód referencia

### Végleges könyvtárstruktúra

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_RallyHatchback.c
    Data/
        config.cpp
        Textures/
            rally_body_co.paa
        Sounds/
            rally_horn.ogg           (opcionális)
            rally_horn_short.ogg     (opcionális)
```

### MyFirstMod/mod.cpp

```cpp
name = "My First Mod";
author = "YourName";
version = "1.2";
overview = "My first DayZ mod with a custom rally hatchback vehicle.";
```

### MyFirstMod/Scripts/config.cpp

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Vehicles_Wheeled"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "World" };

        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/4_World" };
            };
        };
    };
};
```

### Szerver mission types.xml bejegyzés

```xml
<type name="MFM_RallyHatchback">
    <nominal>3</nominal>
    <lifetime>3888000</lifetime>
    <restock>0</restock>
    <min>1</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="vehicles" />
    <usage name="Coast" />
    <usage name="Farm" />
    <usage name="Village" />
    <value name="Tier1" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

### Szerver mission cfgspawnabletypes.xml bejegyzés

```xml
<type name="MFM_RallyHatchback">
    <attachments chance="1.00">
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.75" />
        <item name="HatchbackWheel" chance="0.60" />
        <item name="HatchbackWheel" chance="0.40" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackDoors_Driver" chance="0.50" />
        <item name="HatchbackDoors_CoDriver" chance="0.50" />
    </attachments>
    <attachments chance="1.00">
        <item name="HatchbackHood" chance="0.60" />
        <item name="HatchbackTrunk" chance="0.60" />
    </attachments>
    <attachments chance="0.70">
        <item name="CarBattery" chance="0.30" />
        <item name="SparkPlug" chance="0.30" />
    </attachments>
    <attachments chance="0.50">
        <item name="CarRadiator" chance="0.40" />
    </attachments>
    <attachments chance="0.30">
        <item name="HeadlightH7" chance="0.50" />
        <item name="HeadlightH7" chance="0.50" />
    </attachments>
</type>
```

---

## Legjobb gyakorlatok

- **Mindig terjessz ki meglévő jármű osztályt.** Egy jármű létrehozása nulláról egyéni 3D modellt igényel megfelelő geometria LOD-okkal, proxy-kkal, memóriapontokkal és fizikai szimuláció konfigurációval. Egy vanilla jármű kiterjesztése mindezt ingyen adja.
- **Először tesztelj `OnDebugSpawn()`-nal.** A types.xml és cfgspawnabletypes.xml beállítása előtt ellenőrizd, hogy a jármű működik a debug menü vagy szkript konzol segítségével, teljesen felszerelten spawnolva.
- **Tartsd meg ugyanazt a `GetAnimInstance()` értéket, mint a szülő.** Ha ezt megfelelő animáció készlet nélkül változtatod meg, a játékosok T-pózt vesznek fel vagy átlógnak a járművön.
- **Ne változtasd meg az ajtó slot neveket.** A Niva ezeket használja: `NivaDriverDoors`, `NivaCoDriverDoors`, `NivaHood`, `NivaTrunk`. Ezek a modell proxy neveihez és inventory slot definícióihoz vannak kötve. A modell módosítása nélkül való megváltoztatásuk elrontja az ajtó funkcionalitást.
- **Használj `scope = 0`-t belső alaposztályokhoz.** Ha létrehozol egy absztrakt alap járművet, amelyet más variánsok terjesztenek ki, állítsd be `scope = 0`-ra, hogy soha ne spawnoljon közvetlenül.
- **Állítsd be helyesen a `requiredAddons`-t.** A Data config.cpp fájlodnak tartalmaznia kell a `"DZ_Vehicles_Wheeled"` értéket, hogy az `OffroadHatchback` szülőosztály a tiéd előtt töltődjön be.
- **Alaposan teszteld az ajtó logikát.** Szállj be/ki minden ülésből, nyisd/csukd meg minden ajtót, próbáld meg elérni a motorteret csukott motorháztetővel. A CrewCanGetThrough hibák a leggyakoribb jármű mod problémák.

---

## Elmélet vs gyakorlat

| Koncepció | Elmélet | Valóság |
|---------|--------|---------|
| `SimulationModule` a config.cpp-ben | Teljes kontroll a jármű fizika felett | Nem minden paraméter íródik felül tisztán egy szülőosztály kiterjesztésekor. Ha a sebesség/nyomaték változtatásaid hatástalannak tűnnek, próbáld inkább a `transmissionRatio` és a fokozat `ratios[]` beállítását a `torqueMax` helyett. |
| Sérülési zónák `componentNames[]`-szel | Minden zóna egy geometria komponenshez van társítva | Vanilla jármű kiterjesztésekor a szülő modell komponensnevei már be vannak állítva. A te `componentNames[]` értékeid a configban csak akkor számítanak, ha egyéni modellt biztosítasz. A szülő geometria LOD-ja határozza meg a tényleges találat érzékelést. |
| Egyéni textúrák rejtett szelekciókkal | Bármely textúra szabadon cserélhető | Csak azok a szekciók írhatók felül, amelyeket a modell szerzője "rejtettnek" jelölt. Ha olyan részt kell újratextúráznod, ami nincs a `hiddenSelections[]`-ben, új modellt kell létrehoznod vagy módosítanod a meglévőt az Object Builder-ben. |
| Előre csatolt alkatrészek a `cfgspawnabletypes.xml`-ben | Az elemek a megfelelő slotokhoz csatolódnak | Ha egy kerék osztály inkompatibilis a járművel (rossz csatolási slot), csendben meghiúsul. Mindig a szülő jármű által elfogadott alkatrészeket használd -- a Niva esetében ez `HatchbackWheel`, nem `CivSedanWheel`. |
| Motor hangok | Bármilyen SoundSet név beállítható | A hangkészleteket `CfgSoundSets`-ben kell definiálni valahol a betöltött konfigurációkban. Ha nem létező hangkészletre hivatkozol, a motor csendben visszaáll hang nélkülire -- nincs hiba a naplóban. |

---

## Amit tanultál

Ebben a bemutatóban megtanultad:

- Hogyan definiálj egyéni jármű osztályt egy meglévő vanilla jármű kiterjesztésével a config.cpp-ben
- Hogyan működnek a sérülési zónák és hogyan konfiguráld az életerő értékeket a jármű minden egyes alkatrészéhez
- Hogyan teszik lehetővé a jármű rejtett szekciók a karosszéria újratextúrázását egyéni 3D modell nélkül
- Hogyan írj jármű szkriptet ajtó állapot logikával, legénység belépési ellenőrzésekkel és motor viselkedéssel
- Hogyan működik együtt a `types.xml` és a `cfgspawnabletypes.xml` a jármű spawnoláshoz véletlenszerűen előre csatolt alkatrészekkel
- Hogyan tesztelj járműveket játékon belül a szkript konzol és az `OnDebugSpawn()` metódus segítségével
- Hogyan adj hozzá egyéni hangokat kürtökhöz és egyéni fényosztályokat fényszórókhoz

**Következő:** Bővítsd a jármű mododat egyéni ajtó modellekkel, belső textúrákkal, vagy akár teljesen új jármű karosszériával a Blender és az Object Builder használatával.

---

## Gyakori hibák

### A jármű spawnol, de azonnal átesik a talajon

A fizikai geometria nem töltődik be. Ez általában azt jelenti, hogy a `requiredAddons[]`-ból hiányzik a `"DZ_Vehicles_Wheeled"`, így a szülőosztály fizikai konfigurációja nem öröklődik.

### A jármű spawnol, de nem lehet beszállni

Ellenőrizd, hogy a `GetAnimInstance()` a modellhez megfelelő enum értéket adja vissza. Ha az `OffroadHatchback`-et terjeszted ki, de `VehicleAnimInstances.SEDAN`-t adsz vissza, a belépési animáció rossz ajtópozíciókat céloz meg és a játékos nem tud beszállni.

### Az ajtók nem nyílnak és nem csukódnak

Ellenőrizd, hogy a `GetCarDoorsState()` a helyes slot neveket használja. A Niva ezeket használja: `"NivaDriverDoors"`, `"NivaCoDriverDoors"`, `"NivaHood"` és `"NivaTrunk"`. Ezeknek pontosan egyezniük kell, beleértve a kis- és nagybetűket is.

### A motor indul, de a jármű nem mozdul

Ellenőrizd a `SimulationModule` áttételi arányait. Ha a `ratios[]` üres vagy nulla értékeket tartalmaz, a járműnek nincsenek előremenetei. Szintén ellenőrizd, hogy a kerekek csatolva vannak -- kerekek nélküli jármű pörög, de nem mozog.

### A járműnek nincs hangja

A motor hangok a konstruktorban vannak hozzárendelve. Ha elgépelsz egy SoundSet nevet (például `"offroad_engine_Start_SoundSet"` helyett `"offroad_engine_start_SoundSet"`), a motor csendben hang nélkül működik. A hangkészlet nevek kis- és nagybetű-érzékenyek.

### Az egyéni textúra nem jelenik meg

Ellenőrizd sorrendben három dolgot: (1) a rejtett szekció neve pontosan egyezik a modellel, (2) a textúra útvonal backslash-eket használ a config.cpp-ben, és (3) a `.paa` fájl a csomagolt PBO-ban van. Ha fájl javítást használsz fejlesztés közben, győződj meg róla, hogy az útvonal a mod gyökerétől indul, nem abszolút útvonalról.

### A hátsó ülés utasok nem tudnak beszállni

A Niva hátsó ülések megkövetelik, hogy az első ülés előre legyen hajtva. Ha a `CrewCanGetThrough()` felülírásod a 2-es és 3-as ülésindexekhez nem ellenőrzi a `GetAnimationPhase("SeatDriver")` és `GetAnimationPhase("SeatCoDriver")` értékeket, a hátsó utasok véglegesen ki lesznek zárva.

### A jármű alkatrészek nélkül spawnol többjátékos módban

Az `OnDebugSpawn()` csak debug/tesztelési célokra való. Valódi szerveren az alkatrészek a `cfgspawnabletypes.xml`-ből jönnek. Ha a járműved csupasz vázként spawnol, add hozzá a 4. lépésben leírt `cfgspawnabletypes.xml` bejegyzést.

---

**Előző:** [8.9. fejezet: Professzionális mod sablon](09-professional-template.md)
