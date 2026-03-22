# Kapitola 8.10: Vytvoření vlastního modu vozidla

[Domů](../../README.md) | [<< Předchozí: Profesionální šablona modu](09-professional-template.md) | **Vytvoření vlastního vozidla** | [Další: Vytvoření vlastního oblečení >>](11-clothing-mod.md)

---

> **Shrnutí:** Tento tutoriál vás provede vytvořením vlastního modu vozidla pro DayZ. Rozšíříte vanilkový Offroad Hatchback (Nivu) s vlastními texturami, upraveným výkonem motoru a pozměněnými hodnotami zdraví poškozených zón. Naučíte se konfiguraci vozidla v config.cpp, skriptové chování, nastavení spawnování a testování ve hře.

---

## Obsah

- [Co budeme vytvářet](#co-budeme-vytvářet)
- [Předpoklady](#předpoklady)
- [Krok 1: Vytvoření konfigurace (config.cpp)](#krok-1-vytvoření-konfigurace-configcpp)
- [Krok 2: Vlastní textury](#krok-2-vlastní-textury)
- [Krok 3: Skriptové chování (CarScript)](#krok-3-skriptové-chování-carscript)
- [Krok 4: Záznam v types.xml](#krok-4-záznam-v-typesxml)
- [Krok 5: Sestavení a testování](#krok-5-sestavení-a-testování)
- [Krok 6: Doladění](#krok-6-doladění)
- [Kompletní referenční kód](#kompletní-referenční-kód)
- [Doporučené postupy](#doporučené-postupy)
- [Teorie vs praxe](#teorie-vs-praxe)
- [Co jste se naučili](#co-jste-se-naučili)
- [Časté chyby](#časté-chyby)

---

## Co budeme vytvářet

Vytvoříme vozidlo nazvané **MFM Rally Hatchback** -- upravenou verzi vanilkového Offroad Hatchback (Nivy) s:

- Vlastními přetexturovanými karosářskými panely pomocí skrytých výběrů
- Upraveným výkonem motoru (vyšší maximální rychlost, vyšší spotřeba paliva)
- Pozměněnými hodnotami zdraví zón poškození (odolnější motor, slabší dveře)
- Veškerým standardním chováním vozidla: otevírání dveří, start/stop motoru, palivo, světla, nastupování/vystupování posádky
- Záznamem ve spawn tabulce s předpřipojenými koly a díly

Rozšiřujeme `OffroadHatchback` místo stavby vozidla od nuly. Toto je standardní pracovní postup pro mody vozidel, protože se dědí model, animace, fyzikální geometrie a veškeré stávající chování. Přepíšete pouze to, co chcete změnit.

---

## Předpoklady

- Funkční struktura modu (nejprve dokončete [Kapitolu 8.1](01-first-mod.md) a [Kapitolu 8.2](02-custom-item.md))
- Textový editor
- Nainstalované DayZ Tools (pro konverzi textur, volitelné)
- Základní znalost fungování dědičnosti tříd v config.cpp

Váš mod by měl mít tuto výchozí strukturu:

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
    Data/
        config.cpp
```

---

## Krok 1: Vytvoření konfigurace (config.cpp)

Definice vozidel žijí v `CfgVehicles`, stejně jako předměty. Navzdory názvu třídy `CfgVehicles` obsahuje vše -- předměty, budovy i skutečná vozidla. Klíčový rozdíl u vozidel je rodičovská třída a dodatečná konfigurace pro zóny poškození, příslušenství a parametry simulace.

### Aktualizace vašeho Data config.cpp

Otevřete `MyFirstMod/Data/config.cpp` a přidejte třídu vozidla. Pokud zde již máte definice předmětů z Kapitoly 8.2, přidejte třídu vozidla do stávajícího bloku `CfgVehicles`.

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

        // --- Skryté výběry pro přetexturování ---
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

        // --- Simulace (fyzika a motor) ---
        class SimulationModule : SimulationModule
        {
            // Typ pohonu: 0 = zadní, 1 = přední, 2 = pohon všech kol
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

        // --- Zóny poškození ---
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

### Vysvětlení klíčových polí

| Pole | Účel |
|------|------|
| `scope = 2` | Zpřístupní vozidlo pro spawn. Použijte `0` pro základní třídy, které by nikdy neměly být spawnovány přímo. |
| `displayName` | Název zobrazený v administrátorských nástrojích a ve hře. Můžete použít reference `$STR_` pro lokalizaci. |
| `requiredAddons[]` | Musí obsahovat `"DZ_Vehicles_Wheeled"`, aby se rodičovská třída `OffroadHatchback` načetla před vaší třídou. |
| `hiddenSelections[]` | Texturové sloty na modelu, které chcete přepsat. Musí odpovídat pojmenovaným výběrům modelu. |
| `SimulationModule` | Konfigurace fyziky a motoru. Řídí rychlost, točivý moment, převodovku a brzdění. |
| `DamageSystem` | Definuje zásoby zdraví pro každou část vozidla (motor, dveře, okna, karoserie). |

### O rodičovské třídě

```cpp
class OffroadHatchback;
```

Tato dopředná deklarace říká parseru konfigurace, že `OffroadHatchback` existuje ve vanilkovém DayZ. Vaše vozidlo pak z něj dědí a získává kompletní model Nivy, animace, fyzikální geometrii, body pro příslušenství a definice proxy. Potřebujete přepsat pouze to, co chcete změnit.

Další vanilkové rodičovské třídy vozidel, které můžete rozšířit:

| Rodičovská třída | Vozidlo |
|-----------------|---------|
| `OffroadHatchback` | Niva (4-místný hatchback) |
| `CivilianSedan` | Olga (4-místný sedan) |
| `Hatchback_02` | Golf/Gunter (4-místný hatchback) |
| `Sedan_02` | Sarka 120 (4-místný sedan) |
| `Offroad_02` | Humvee (4-místný terénní vůz) |
| `Truck_01_Base` | V3S (nákladní automobil) |

### O SimulationModule

`SimulationModule` řídí, jak vozidlo jezdí. Klíčové parametry:

| Parametr | Efekt |
|----------|-------|
| `drive` | `0` = zadní pohon, `1` = přední pohon, `2` = pohon všech kol |
| `torqueMax` | Špičkový točivý moment motoru v Nm. Vyšší = větší zrychlení. Vanilková Niva je ~114. |
| `powerMax` | Špičkový výkon. Vyšší = vyšší maximální rychlost. Vanilková Niva je ~68. |
| `rpmRedline` | Otáčky červené zóny motoru. Za nimi motor naráží na omezovač otáček. |
| `ratios[]` | Převodové poměry. Nižší čísla = delší převody = vyšší maximální rychlost, ale pomalejší zrychlení. |
| `transmissionRatio` | Koncový převodový poměr. Funguje jako násobič všech převodů. |

### O zónách poškození

Každá zóna poškození má vlastní zásobu zdraví. Když zdraví zóny dosáhne nuly, tento komponent je zničen:

| Zóna | Efekt při zničení |
|------|-------------------|
| `Engine` | Vozidlo nelze nastartovat |
| `FuelTank` | Palivo uniká |
| `Front` / `Rear` | Vizuální poškození, snížená ochrana |
| `Door_1_1` / `Door_2_1` | Dveře odpadnou |
| `WindowFront` | Okno se roztříští (ovlivňuje zvukovou izolaci) |

Hodnota `transferToGlobalCoef` určuje, kolik poškození se přenáší z této zóny na celkové zdraví vozidla. `1` znamená 100% přenos (poškození motoru škodí celkovému zdraví), `0` znamená žádný přenos.

`componentNames[]` musí odpovídat pojmenovaným komponentům v geometrickém LOD vozidla. Jelikož dědíme model Nivy, používáme zde zástupné názvy -- mapování komponentů rodičovské třídy je to, co skutečně záleží na detekci kolizí. Pokud používáte vanilkový model bez úprav, mapování geometrie rodiče se aplikuje automaticky.

---

## Krok 2: Vlastní textury

### Jak fungují skryté výběry vozidel

Skryté výběry vozidel fungují stejně jako textury předmětů, ale vozidla mají typicky více výběrových slotů. Model Offroad Hatchback používá výběry pro různé karosářské panely, což umožňuje barevné varianty (bílá, modrá) ve vanilce.

### Použití vanilkových textur (nejrychlejší start)

Pro počáteční testování nasměrujte vaše skryté výběry na existující vanilkové textury. Tím potvrdíte, že vaše konfigurace funguje, než vytvoříte vlastní grafiku:

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

Prázdné řetězce `""` znamenají "použít výchozí texturu modelu pro tento výběr."

### Vytvoření vlastní sady textur

Pro vytvoření unikátního vzhledu:

1. **Extrahujte vanilkovou texturu** pomocí Addon Builderu z DayZ Tools nebo P: disku k nalezení:
   ```
   P:\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa
   ```

2. **Převeďte do editovatelného formátu** pomocí TexView2:
   - Otevřete soubor `.paa` v TexView2
   - Exportujte jako `.tga` nebo `.png`

3. **Upravte ve vašem grafickém editoru** (GIMP, Photoshop, Paint.NET):
   - Textury vozidel mají typicky rozlišení **2048x2048** nebo **4096x4096**
   - Upravte barvy, přidejte polepy, závodní pruhy nebo efekty rzi
   - Zachovejte UV rozložení nedotčené -- měňte pouze barvy a detaily

4. **Převeďte zpět na `.paa`**:
   - Otevřete váš upravený obrázek v TexView2
   - Uložte ve formátu `.paa`
   - Uložte do `MyFirstMod/Data/Textures/rally_body_co.paa`

### Konvence pojmenování textur pro vozidla

| Přípona | Typ | Účel |
|---------|-----|------|
| `_co` | Barva (Diffuse) | Hlavní barva a vzhled |
| `_nohq` | Normálová mapa | Povrchové nerovnosti, panelové linie, detaily nýtů |
| `_smdi` | Spekulární | Kovový lesk, odrazy laku |
| `_as` | Alpha/Povrch | Průhlednost pro okna |
| `_de` | Destrukce | Textury překryvu poškození |

Pro první mod vozidla je vyžadována pouze textura `_co`. Model používá své výchozí normálové a spekulární mapy.

### Přiřazení materiálů (volitelné)

Pro plnou kontrolu materiálu vytvořte soubor `.rvmat`:

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

## Krok 3: Skriptové chování (CarScript)

Skriptové třídy vozidel řídí zvuky motoru, logiku dveří, chování nastupování/vystupování posádky a animace sedadel. Jelikož rozšiřujeme `OffroadHatchback`, dědíme veškeré vanilkové chování a přepisujeme pouze to, co chceme přizpůsobit.

### Vytvoření souboru skriptu

Vytvořte strukturu adresářů a soubor skriptu:

```
MyFirstMod/
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_RallyHatchback.c
```

### Aktualizace Scripts config.cpp

Váš `Scripts/config.cpp` musí registrovat vrstvu `4_World`, aby engine načetl váš skript:

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

### Napsání skriptu vozidla

Vytvořte `4_World/MyFirstMod/MFM_RallyHatchback.c`:

```c
class MFM_RallyHatchback extends OffroadHatchback
{
    void MFM_RallyHatchback()
    {
        // Přepsání zvuků motoru (opětovné použití vanilkových zvuků Nivy)
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

        // Pozice motoru v prostoru modelu (x, y, z) -- používá se pro
        // zdroj teploty, detekci topení a částicové efekty
        SetEnginePos("0 0.7 1.2");
    }

    // --- Instance animace ---
    // Určuje, která sada animací hráče se použije při nastupování/vystupování.
    // Musí odpovídat kostře vozidla. Jelikož používáme model Nivy, zachováme HATCHBACK.
    override int GetAnimInstance()
    {
        return VehicleAnimInstances.HATCHBACK;
    }

    // --- Vzdálenost kamery ---
    // Jak daleko sedí kamera třetí osoby za vozidlem.
    // Vanilková Niva je 3.5. Zvyšte pro širší pohled.
    override float GetTransportCameraDistance()
    {
        return 4.0;
    }

    // --- Typy animací sedadel ---
    // Mapuje každý index sedadla na typ animace hráče.
    // 0 = řidič, 1 = spolujezdec, 2 = zadní levé, 3 = zadní pravé.
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

    // --- Stav dveří ---
    // Vrací, zda dveře chybí, jsou otevřené nebo zavřené.
    // Názvy slotů (NivaDriverDoors, NivaCoDriverDoors, NivaHood, NivaTrunk)
    // jsou definovány proxy sloty inventáře modelu.
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

    // --- Nastupování/vystupování posádky ---
    // Určuje, zda hráč může nastoupit nebo vystoupit z konkrétního sedadla.
    // Kontroluje stav dveří a fázi animace sklopení sedadla.
    // Přední sedadla (0, 1) vyžadují otevřené dveře.
    // Zadní sedadla (2, 3) vyžadují otevřené dveře A sklopené přední sedadlo dopředu.
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

    // --- Kontrola kapoty pro příslušenství ---
    // Zabraňuje hráčům odejmout díly motoru, když je kapota zavřená.
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

    // --- Přístup k nákladu ---
    // Kufr musí být otevřený pro přístup k nákladu vozidla.
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

    // --- Přístup k motorovému prostoru ---
    // Kapota musí být otevřená pro zobrazení slotů příslušenství motoru.
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

    // --- Ladící spawn ---
    // Voláno při spawnu z ladícího menu. Spawnuje se všemi připojenými díly
    // a naplněnými kapalinami pro okamžité testování.
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

        // Náhradní kola v nákladu
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
    }
};
```

### Pochopení klíčových overridů

**GetAnimInstance** -- Vrací, kterou sadu animací hráč použije při sezení ve vozidle. Hodnoty enumu jsou:

| Hodnota | Konstanta | Typ vozidla |
|---------|-----------|-------------|
| 0 | `CIVVAN` | Dodávka |
| 1 | `V3S` | Nákladní automobil V3S |
| 2 | `SEDAN` | Sedan Olga |
| 3 | `HATCHBACK` | Hatchback Niva |
| 5 | `S120` | Sarka 120 |
| 7 | `GOLF` | Gunter 2 |
| 8 | `HMMWV` | Humvee |

Pokud toto změníte na špatnou hodnotu, animace hráče bude prostupovat vozidlem nebo vypadat nesprávně. Vždy shodujte s modelem, který používáte.

**CrewCanGetThrough** -- Voláno každý snímek pro určení, zda hráč může nastoupit nebo vystoupit z sedadla. Zadní sedadla Nivy (indexy 2 a 3) fungují odlišně od předních: opěradlo předního sedadla musí být sklopeno dopředu (fáze animace > 0.5), než mohou zadní cestující projít. To odpovídá chování skutečného 2-dveřového hatchbacku, kde zadní cestující musí sklopit přední sedadlo.

**OnDebugSpawn** -- Voláno při použití ladícího spawn menu. `SpawnUniversalParts()` přidá žárovky světlometů a autobaterii. `FillUpCarFluids()` naplní palivo, chladicí kapalinu, olej a brzdovou kapalinu na maximum. Poté vytvoříme kola, dveře, kapotu a kufr. To vám dá okamžitě řiditelné vozidlo pro testování.

---

## Krok 4: Záznam v types.xml

### Konfigurace spawnu vozidla

Vozidla v `types.xml` používají stejný formát jako předměty, ale s některými důležitými rozdíly. Přidejte toto do `types.xml` vašeho serveru:

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

### Rozdíly mezi vozidly a předměty v types.xml

| Nastavení | Předměty | Vozidla |
|-----------|----------|---------|
| `nominal` | 10-50+ | 1-5 (vozidla jsou vzácná) |
| `lifetime` | 3600-14400 | 3888000 (45 dní -- vozidla přetrvávají dlouho) |
| `restock` | 1800 | 0 (vozidla se nedoplňují automaticky; respawnují se až poté, co je předchozí zničeno a despawnováno) |
| `category` | `tools`, `weapons` atd. | `vehicles` |

### Předpřipojené díly s cfgspawnabletypes.xml

Vozidla se ve výchozím stavu spawnují jako prázdné skořápky -- bez kol, dveří nebo dílů motoru. Aby se spawnovala s předpřipojenými díly, přidejte záznamy do `cfgspawnabletypes.xml` ve složce mise serveru:

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

### Jak cfgspawnabletypes funguje

Každý blok `<attachments>` se vyhodnocuje nezávisle:
- Vnější `chance` určuje, zda se tato skupina příslušenství vůbec zvažuje
- Každý `<item>` uvnitř má vlastní `chance` umístění
- Předměty se umisťují do prvního dostupného odpovídajícího slotu na vozidle

To znamená, že vozidlo se může spawnovat se 3 koly a žádnými dveřmi, nebo se všemi koly a baterií, ale bez zapalovací svíčky. To vytváří herní smyčku sběru -- hráči musí najít chybějící díly.

---

## Krok 5: Sestavení a testování

### Zabalení PBO

Pro tento mod potřebujete dvě PBO:

```
@MyFirstMod/
    mod.cpp
    Addons/
        Scripts.pbo          <-- Obsahuje Scripts/config.cpp a 4_World/
        Data.pbo             <-- Obsahuje Data/config.cpp a Textures/
```

Použijte Addon Builder z DayZ Tools:
1. **Scripts PBO:** Source = `MyFirstMod/Scripts/`, Prefix = `MyFirstMod/Scripts`
2. **Data PBO:** Source = `MyFirstMod/Data/`, Prefix = `MyFirstMod/Data`

Nebo použijte file patching během vývoje:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

### Spawn vozidla pomocí skriptové konzole

1. Spusťte DayZ s načteným vaším modem
2. Připojte se k serveru nebo spusťte offline režim
3. Otevřete skriptovou konzoli
4. Pro spawn plně vybaveného vozidla poblíž vaší postavy:

```c
EntityAI vehicle;
vector pos = GetGame().GetPlayer().GetPosition();
pos[2] = pos[2] + 5;
vehicle = EntityAI.Cast(GetGame().CreateObject("MFM_RallyHatchback", pos, false, false, true));
```

5. Stiskněte **Execute**

Vozidlo by se mělo objevit 5 metrů před vámi.

### Spawn vozidla připraveného k jízdě

Pro rychlejší testování spawnujte vozidlo a použijte metodu debug spawnu, která připojí všechny díly:

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

To zavolá váš override `OnDebugSpawn()`, který naplní kapaliny a připojí kola, dveře, kapotu a kufr.

### Co testovat

| Kontrola | Na co se dívat |
|----------|----------------|
| **Vozidlo se spawnuje** | Objeví se ve světě bez chyb v logu skriptů |
| **Textury aplikovány** | Vlastní barva karoserie je viditelná (při použití vlastních textur) |
| **Motor startuje** | Nasedněte, podržte klávesu startu motoru. Poslouchejte zvuk startu. |
| **Jízda** | Zrychlení, maximální rychlost, chování řízení se liší od vanilky |
| **Dveře** | Lze otevírat/zavírat dveře řidiče a spolujezdce |
| **Kapota/kufr** | Lze otevřít kapotu pro přístup k dílům motoru. Lze otevřít kufr pro náklad. |
| **Zadní sedadla** | Sklopte přední sedadlo, pak nastupte na zadní sedadlo |
| **Spotřeba paliva** | Jeďte a sledujte ukazatel paliva |
| **Poškození** | Střelte do vozidla. Díly by měly přijímat poškození a nakonec se rozbít. |
| **Světla** | Přední a zadní světla fungují v noci |

### Čtení logu skriptů

Pokud se vozidlo nespawnuje nebo se chová nesprávně, zkontrolujte log skriptů na:

```
%localappdata%\DayZ\<VášProfil>\script.log
```

Běžné chyby:

| Zpráva v logu | Příčina |
|---------------|---------|
| `Cannot create object type MFM_RallyHatchback` | Nesoulad názvu třídy v config.cpp nebo Data PBO není načteno |
| `Undefined variable 'OffroadHatchback'` | V `requiredAddons` chybí `"DZ_Vehicles_Wheeled"` |
| `Member not found` u volání metody | Překlep v názvu override metody |

---

## Krok 6: Doladění

### Vlastní zvuk klaksonu

Pro udělení unikátního klaksonu vašemu vozidlu definujte vlastní sound sety ve vašem Data config.cpp:

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

Poté na ně odkažte v konstruktoru vašeho skriptu:

```c
m_CarHornShortSoundName = "MFM_RallyHornShort_SoundSet";
m_CarHornLongSoundName  = "MFM_RallyHorn_SoundSet";
```

Zvukové soubory musí být ve formátu `.ogg`. Cesta v `samples[]` NEobsahuje příponu souboru.

### Vlastní světlomety

Můžete vytvořit vlastní třídu světel pro změnu jasu, barvy nebo dosahu světlometů:

```c
class MFM_RallyFrontLight extends CarLightBase
{
    void MFM_RallyFrontLight()
    {
        // Potkávací světla (segregované)
        m_SegregatedBrightness = 7;
        m_SegregatedRadius = 65;
        m_SegregatedAngle = 110;
        m_SegregatedColorRGB = Vector(0.9, 0.9, 1.0);

        // Dálková světla (agregované)
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

Override ve vaší třídě vozidla:

```c
override CarLightBase CreateFrontLight()
{
    return CarLightBase.Cast(ScriptedLightBase.CreateLight(MFM_RallyFrontLight));
}
```

### Zvuková izolace (OnSound)

Override `OnSound` řídí, jak moc kabina tlumí hluk motoru na základě stavu dveří a oken:

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

Hodnota `1.0` znamená plnou izolaci (tichá kabina), `0.0` znamená žádnou izolaci (pocit otevřeného prostoru).

---

## Kompletní referenční kód

### Finální adresářová struktura

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
            rally_horn.ogg           (volitelné)
            rally_horn_short.ogg     (volitelné)
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

### Záznam types.xml mise serveru

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

### Záznam cfgspawnabletypes.xml mise serveru

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

## Doporučené postupy

- **Vždy rozšiřujte existující třídu vozidla.** Vytvoření vozidla od nuly vyžaduje vlastní 3D model se správnými geometrickými LOD, proxy, paměťovými body a konfigurací fyzikální simulace. Rozšíření vanilkového vozidla vám toto vše dá zdarma.
- **Testujte nejprve s `OnDebugSpawn()`.** Než nastavíte types.xml a cfgspawnabletypes.xml, ověřte, že vozidlo funguje spawnem plně vybaveného vozidla přes ladící menu nebo skriptovou konzoli.
- **Zachovejte stejný `GetAnimInstance()` jako rodič.** Pokud toto změníte bez odpovídající sady animací, hráči budou v T-póze nebo budou prostupovat vozidlem.
- **Neměňte názvy slotů dveří.** Niva používá `NivaDriverDoors`, `NivaCoDriverDoors`, `NivaHood`, `NivaTrunk`. Ty jsou vázány na proxy názvy modelu a definice slotů inventáře. Jejich změna bez změny modelu rozbije funkčnost dveří.
- **Použijte `scope = 0` pro interní základní třídy.** Pokud vytváříte abstraktní základní vozidlo, ze kterého dědí další varianty, nastavte `scope = 0`, aby se nikdy nespawnilo přímo.
- **Nastavte `requiredAddons` správně.** Váš Data config.cpp musí uvádět `"DZ_Vehicles_Wheeled"`, aby se rodičovská třída `OffroadHatchback` načetla před vaší.
- **Důkladně testujte logiku dveří.** Nastupte/vystupte z každého sedadla, otevřete/zavřete každé dveře, zkuste přistoupit k motorovému prostoru se zavřenou kapotou. Chyby v CrewCanGetThrough jsou nejčastějším problémem modů vozidel.

---

## Teorie vs praxe

| Koncept | Teorie | Realita |
|---------|--------|---------|
| `SimulationModule` v config.cpp | Plná kontrola nad fyzikou vozidla | Ne všechny parametry se čistě přepisují při rozšiřování rodičovské třídy. Pokud se zdá, že vaše změny rychlosti/točivého momentu nemají efekt, zkuste upravit `transmissionRatio` a `ratios[]` převodovky místo pouhého `torqueMax`. |
| Zóny poškození s `componentNames[]` | Každá zóna mapuje na geometrický komponent | Při rozšiřování vanilkového vozidla jsou názvy komponentů rodičovského modelu již nastaveny. Vaše hodnoty `componentNames[]` v konfiguraci záleží pouze tehdy, pokud poskytnete vlastní model. Geometrický LOD rodiče určuje skutečnou detekci zásahů. |
| Vlastní textury přes skryté výběry | Libovolná výměna textur | Přepsat lze pouze výběry, které autor modelu označil jako "skryté". Pokud potřebujete přetexturovat část, která není v `hiddenSelections[]`, musíte vytvořit nový model nebo upravit stávající v Object Builderu. |
| Předpřipojené díly v `cfgspawnabletypes.xml` | Předměty se připojí k odpovídajícím slotům | Pokud je třída kola nekompatibilní s vozidlem (špatný slot příslušenství), tiše selže. Vždy používejte díly, které rodičovské vozidlo přijímá -- pro Nivu to znamená `HatchbackWheel`, nikoliv `CivSedanWheel`. |
| Zvuky motoru | Nastavte libovolný název SoundSet | Sound sety musí být definovány v `CfgSoundSets` někde v načtených konfiguracích. Pokud odkážete na sound set, který neexistuje, engine tiše přepne na žádný zvuk -- v logu se neobjeví žádná chyba. |

---

## Co jste se naučili

V tomto tutoriálu jste se naučili:

- Jak definovat vlastní třídu vozidla rozšířením existujícího vanilkového vozidla v config.cpp
- Jak fungují zóny poškození a jak konfigurovat hodnoty zdraví pro každý komponent vozidla
- Jak skryté výběry vozidel umožňují přetexturování karoserie bez vlastního 3D modelu
- Jak napsat skript vozidla s logikou stavu dveří, kontrolami nastupování posádky a chováním motoru
- Jak `types.xml` a `cfgspawnabletypes.xml` spolupracují při spawnování vozidel s náhodně předpřipojenými díly
- Jak testovat vozidla ve hře pomocí skriptové konzole a metody `OnDebugSpawn()`
- Jak přidat vlastní zvuky pro klaksony a vlastní třídy světel pro světlomety

**Další:** Rozšiřte svůj mod vozidla o vlastní modely dveří, interiérové textury nebo dokonce zcela novou karoserii vozidla pomocí Blenderu a Object Builderu.

---

## Časté chyby

### Vozidlo se spawnuje, ale okamžitě propadne zemí

Fyzikální geometrie se nenačítá. To obvykle znamená, že v `requiredAddons[]` chybí `"DZ_Vehicles_Wheeled"`, takže konfigurace fyziky rodičovské třídy není zděděna.

### Vozidlo se spawnuje, ale nelze do něj nastoupit

Zkontrolujte, že `GetAnimInstance()` vrací správnou hodnotu enumu pro váš model. Pokud rozšiřujete `OffroadHatchback`, ale vracíte `VehicleAnimInstances.SEDAN`, animace nastupování cílí na špatné pozice dveří a hráč nemůže nastoupit.

### Dveře se neotevírají ani nezavírají

Ověřte, že `GetCarDoorsState()` používá správné názvy slotů. Niva používá `"NivaDriverDoors"`, `"NivaCoDriverDoors"`, `"NivaHood"` a `"NivaTrunk"`. Ty musí odpovídat přesně, včetně velkých a malých písmen.

### Motor startuje, ale vozidlo se nepohybuje

Zkontrolujte převodové poměry ve vašem `SimulationModule`. Pokud je `ratios[]` prázdné nebo má nulové hodnoty, vozidlo nemá žádné dopředné převody. Také ověřte, že jsou připojena kola -- vozidlo bez kol bude točit motorem, ale nepohne se.

### Vozidlo nemá žádný zvuk

Zvuky motoru se přiřazují v konstruktoru. Pokud překlepete název SoundSet (například `"offroad_engine_Start_SoundSet"` místo `"offroad_engine_start_SoundSet"`), engine tiše použije žádný zvuk. Názvy sound setů rozlišují velká a malá písmena.

### Vlastní textura se nezobrazuje

Ověřte tři věci v pořadí: (1) název skrytého výběru přesně odpovídá modelu, (2) cesta k textuře používá zpětná lomítka v config.cpp a (3) soubor `.paa` je uvnitř zabaleného PBO. Pokud používáte file patching během vývoje, ujistěte se, že cesta začíná od kořene modu, nikoliv jako absolutní cesta.

### Cestující na zadních sedadlech nemohou nastoupit

Zadní sedadla Nivy vyžadují sklopení předního sedadla dopředu. Pokud váš override `CrewCanGetThrough()` pro indexy sedadel 2 a 3 nekontroluje `GetAnimationPhase("SeatDriver")` a `GetAnimationPhase("SeatCoDriver")`, zadní cestující budou trvale uzamčeni.

### Vozidlo se spawnuje bez dílů v multiplayeru

`OnDebugSpawn()` je pouze pro ladění/testování. Na skutečném serveru díly pocházejí z `cfgspawnabletypes.xml`. Pokud se vaše vozidlo spawnuje jako holá skořápka, přidejte záznam `cfgspawnabletypes.xml` popsaný v kroku 4.

---

**Předchozí:** [Kapitola 8.9: Profesionální šablona modu](09-professional-template.md)
