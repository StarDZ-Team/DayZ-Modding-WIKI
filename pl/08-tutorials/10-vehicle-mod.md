# Rozdział 8.10: Tworzenie niestandardowego moda pojazdów

[Strona główna](../../README.md) | [<< Poprzedni: Profesjonalny szablon moda](09-professional-template.md) | **Tworzenie niestandardowego pojazdu** | [Następny: Tworzenie niestandardowej odzieży >>](11-clothing-mod.md)

---

> **Podsumowanie:** Ten tutorial przeprowadzi cię przez tworzenie niestandardowego wariantu pojazdu w DayZ poprzez rozszerzenie istniejącego pojazdu vanilla. Zdefiniujesz pojazd w config.cpp, dostosujesz jego statystyki i tekstury, napiszesz zachowanie skryptowe dla drzwi i silnika, dodasz go do tabeli spawnowania serwera z wcześniej zamontowanymi częściami i przetestujesz go w grze. Na koniec będziesz miał w pełni jezdny, niestandardowy wariant Offroad Hatchback ze zmodyfikowaną wydajnością i wyglądem.

---

## Spis treści

- [Co budujemy](#what-we-are-building)
- [Wymagania wstępne](#prerequisites)
- [Krok 1: Tworzenie konfiguracji (config.cpp)](#step-1-create-the-config-configcpp)
- [Krok 2: Niestandardowe tekstury](#step-2-custom-textures)
- [Krok 3: Zachowanie skryptowe (CarScript)](#step-3-script-behavior-carscript)
- [Krok 4: Wpis types.xml](#step-4-typesxml-entry)
- [Krok 5: Budowanie i testowanie](#step-5-build-and-test)
- [Krok 6: Polerowanie](#step-6-polish)
- [Kompletna dokumentacja kodu](#complete-code-reference)
- [Najlepsze praktyki](#best-practices)
- [Teoria vs praktyka](#theory-vs-practice)
- [Czego się nauczyłeś](#what-you-learned)
- [Częste błędy](#common-mistakes)

---

## Co budujemy

Stworzymy pojazd o nazwie **MFM Rally Hatchback** -- zmodyfikowaną wersję vanilla Offroad Hatchback (Niva) z:

- Niestandardowe reteksturowane panele nadwozia za pomocą ukrytych selekcji
- Zmodyfikowana wydajność silnika (wyższa prędkość maksymalna, wyższe zużycie paliwa)
- Zmienione wartości zdrowia stref uszkodzeń (mocniejszy silnik, słabsze drzwi)
- Wszystkie standardowe zachowania pojazdu: otwieranie drzwi, start/stop silnika, paliwo, światła, wchodzenie/wychodzenie załogi
- Wpis w tabeli spawnowania z wcześniej zamontowanymi kołami i częściami

Rozszerzamy `OffroadHatchback` zamiast budować pojazd od zera. Jest to standardowy workflow dla modów pojazdów, ponieważ dziedziczy model, animacje, geometrię fizyki i wszystkie istniejące zachowania. Nadpisujesz tylko to, co chcesz zmienić.

---

## Wymagania wstępne

- Działająca struktura moda (najpierw ukończ [Rozdział 8.1](01-first-mod.md) i [Rozdział 8.2](02-custom-item.md))
- Edytor tekstu
- Zainstalowane DayZ Tools (do konwersji tekstur, opcjonalnie)
- Podstawowa znajomość działania dziedziczenia klas w config.cpp

Twój mod powinien mieć tę początkową strukturę:

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
    Data/
        config.cpp
```

---

## Krok 1: Tworzenie konfiguracji (config.cpp)

Definicje pojazdów znajdują się w `CfgVehicles`, tak jak przedmioty. Pomimo nazwy klasy, `CfgVehicles` przechowuje wszystko -- przedmioty, budynki i rzeczywiste pojazdy. Kluczową różnicą dla pojazdów jest klasa nadrzędna oraz dodatkowa konfiguracja stref uszkodzeń, załączników i parametrów symulacji.

### Zaktualizuj swój Data config.cpp

Otwórz `MyFirstMod/Data/config.cpp` i dodaj klasę pojazdu. Jeśli masz tu już definicje przedmiotów z Rozdziału 8.2, dodaj klasę pojazdu wewnątrz istniejącego bloku `CfgVehicles`.

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

        // --- Ukryte selekcje do reteksturowania ---
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

        // --- Symulacja (fizyka i silnik) ---
        class SimulationModule : SimulationModule
        {
            // Typ napędu: 0 = tylny, 1 = przedni, 2 = na wszystkie koła
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

        // --- Strefy uszkodzeń ---
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

### Wyjaśnienie kluczowych pól

| Pole | Przeznaczenie |
|------|---------------|
| `scope = 2` | Umożliwia spawnowanie pojazdu. Użyj `0` dla klas bazowych, które nigdy nie powinny się spawnować bezpośrednio. |
| `displayName` | Nazwa wyświetlana w narzędziach administracyjnych i w grze. Możesz użyć referencji `$STR_` do lokalizacji. |
| `requiredAddons[]` | Musi zawierać `"DZ_Vehicles_Wheeled"`, aby klasa nadrzędna `OffroadHatchback` została załadowana przed twoją klasą. |
| `hiddenSelections[]` | Sloty tekstur na modelu, które chcesz nadpisać. Muszą pasować do nazwanych selekcji modelu. |
| `SimulationModule` | Konfiguracja fizyki i silnika. Kontroluje prędkość, moment obrotowy, przełożenia i hamowanie. |
| `DamageSystem` | Definiuje pule zdrowia dla każdej części pojazdu (silnik, drzwi, okna, nadwozie). |

### O klasie nadrzędnej

```cpp
class OffroadHatchback;
```

Ta deklaracja zapowiadająca informuje parser konfiguracji, że `OffroadHatchback` istnieje w vanilla DayZ. Twój pojazd następnie po nim dziedziczy, otrzymując kompletny model Nivy, animacje, geometrię fizyki, punkty mocowania i definicje proxy. Musisz nadpisać tylko to, co chcesz zmienić.

Inne klasy nadrzędne pojazdów vanilla, które możesz rozszerzyć:

| Klasa nadrzędna | Pojazd |
|-------------|---------|
| `OffroadHatchback` | Niva (4-miejscowy hatchback) |
| `CivilianSedan` | Olga (4-miejscowy sedan) |
| `Hatchback_02` | Golf/Gunter (4-miejscowy hatchback) |
| `Sedan_02` | Sarka 120 (4-miejscowy sedan) |
| `Offroad_02` | Humvee (4-miejscowy terenowy) |
| `Truck_01_Base` | V3S (ciężarówka) |

### O SimulationModule

`SimulationModule` kontroluje sposób jazdy pojazdu. Kluczowe parametry:

| Parametr | Efekt |
|-----------|--------|
| `drive` | `0` = napęd na tylne koła, `1` = napęd na przednie koła, `2` = napęd na wszystkie koła |
| `torqueMax` | Maksymalny moment obrotowy silnika w Nm. Wyższy = większe przyspieszenie. Vanilla Niva to ~114. |
| `powerMax` | Maksymalna moc. Wyższa = wyższa prędkość maksymalna. Vanilla Niva to ~68. |
| `rpmRedline` | Obroty redline silnika. Powyżej tego silnik odbija się od ogranicznika obrotów. |
| `ratios[]` | Przełożenia biegów. Niższe liczby = wyższe biegi = wyższa prędkość maksymalna, ale wolniejsze przyspieszenie. |
| `transmissionRatio` | Przełożenie końcowe. Działa jako mnożnik dla wszystkich biegów. |

### O strefach uszkodzeń

Każda strefa uszkodzeń ma własną pulę zdrowia. Gdy zdrowie strefy spadnie do zera, ten komponent jest zniszczony:

| Strefa | Efekt po zniszczeniu |
|--------|-------------------|
| `Engine` | Pojazd nie może się uruchomić |
| `FuelTank` | Paliwo wycieka |
| `Front` / `Rear` | Wizualne uszkodzenia, zmniejszona ochrona |
| `Door_1_1` / `Door_2_1` | Drzwi odpadają |
| `WindowFront` | Szyba się rozbija (wpływa na izolację dźwięku) |

Wartość `transferToGlobalCoef` określa, ile uszkodzeń przenosi się z tej strefy na globalne zdrowie pojazdu. `1` oznacza 100% transfer (uszkodzenie silnika wpływa na ogólne zdrowie), `0` oznacza brak transferu.

`componentNames[]` muszą odpowiadać nazwanym komponentom w LOD geometrii pojazdu. Ponieważ dziedziczymy model Nivy, używamy tu zastępczych nazw -- mapowanie komponentów klasy nadrzędnej jest tym, co faktycznie ma znaczenie dla detekcji kolizji. Jeśli używasz modelu vanilla bez modyfikacji, mapowanie komponentów rodzica stosuje się automatycznie.

---

## Krok 2: Niestandardowe tekstury

### Jak działają ukryte selekcje pojazdów

Ukryte selekcje pojazdów działają tak samo jak tekstury przedmiotów, ale pojazdy zazwyczaj mają więcej slotów selekcji. Model Offroad Hatchback używa selekcji dla różnych paneli nadwozia, umożliwiając warianty kolorystyczne (Biały, Niebieski) w vanilla.

### Użycie tekstur vanilla (najszybszy start)

Do wstępnego testowania skieruj swoje ukryte selekcje na istniejące tekstury vanilla. Potwierdza to, że twoja konfiguracja działa, zanim stworzysz niestandardową grafikę:

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

Puste ciągi `""` oznaczają "użyj domyślnej tekstury modelu dla tej selekcji."

### Tworzenie niestandardowego zestawu tekstur

Aby stworzyć unikalny wygląd:

1. **Wyodrębnij teksturę vanilla** za pomocą Addon Builder z DayZ Tools lub dysku P:, aby znaleźć:
   ```
   P:\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa
   ```

2. **Przekonwertuj do edytowalnego formatu** za pomocą TexView2:
   - Otwórz plik `.paa` w TexView2
   - Eksportuj jako `.tga` lub `.png`

3. **Edytuj w swoim edytorze graficznym** (GIMP, Photoshop, Paint.NET):
   - Tekstury pojazdów mają zazwyczaj **2048x2048** lub **4096x4096**
   - Modyfikuj kolory, dodawaj kalkomanie, paski wyścigowe lub efekty rdzy
   - Zachowaj układ UV -- zmieniaj tylko kolory i detale

4. **Przekonwertuj z powrotem do `.paa`**:
   - Otwórz edytowany obraz w TexView2
   - Zapisz w formacie `.paa`
   - Zapisz do `MyFirstMod/Data/Textures/rally_body_co.paa`

### Konwencje nazewnictwa tekstur dla pojazdów

| Przyrostek | Typ | Przeznaczenie |
|--------|------|---------------|
| `_co` | Color (Diffuse) | Główny kolor i wygląd |
| `_nohq` | Normal Map | Nierówności powierzchni, linie paneli, detale nitów |
| `_smdi` | Specular | Metaliczny połysk, odbicia lakieru |
| `_as` | Alpha/Surface | Przezroczystość dla okien |
| `_de` | Destruct | Tekstury nakładki uszkodzeń |

Dla pierwszego moda pojazdu wymagana jest tylko tekstura `_co`. Model używa swoich domyślnych map normalnych i specularnych.

### Dopasowywanie materiałów (opcjonalnie)

Dla pełnej kontroli nad materiałami, utwórz plik `.rvmat`:

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

## Krok 3: Zachowanie skryptowe (CarScript)

Klasy skryptów pojazdów kontrolują dźwięki silnika, logikę drzwi, zachowanie wchodzenia/wychodzenia załogi i animacje siedzeń. Ponieważ rozszerzamy `OffroadHatchback`, dziedziczymy wszystkie zachowania vanilla i nadpisujemy tylko to, co chcemy dostosować.

### Utwórz plik skryptu

Utwórz strukturę folderów i plik skryptu:

```
MyFirstMod/
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_RallyHatchback.c
```

### Zaktualizuj Scripts config.cpp

Twój `Scripts/config.cpp` musi zarejestrować warstwę `4_World`, aby silnik załadował twój skrypt:

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

### Napisz skrypt pojazdu

Utwórz `4_World/MyFirstMod/MFM_RallyHatchback.c`:

```c
class MFM_RallyHatchback extends OffroadHatchback
{
    void MFM_RallyHatchback()
    {
        // Nadpisanie dźwięków silnika (ponowne użycie dźwięków vanilla Nivy)
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

        // Pozycja silnika w przestrzeni modelu (x, y, z) -- używana do
        // źródła temperatury, detekcji tonięcia i efektów cząsteczkowych
        SetEnginePos("0 0.7 1.2");
    }

    // --- Instancja animacji ---
    // Określa, który zestaw animacji gracza jest używany przy wchodzeniu/wychodzeniu.
    // Musi pasować do szkieletu pojazdu. Ponieważ używamy modelu Nivy, zachowaj HATCHBACK.
    override int GetAnimInstance()
    {
        return VehicleAnimInstances.HATCHBACK;
    }

    // --- Odległość kamery ---
    // Jak daleko kamera trzeciej osoby znajduje się za pojazdem.
    // Vanilla Niva to 3.5. Zwiększ dla szerszego widoku.
    override float GetTransportCameraDistance()
    {
        return 4.0;
    }

    // --- Typy animacji siedzeń ---
    // Mapuje każdy indeks siedzenia na typ animacji gracza.
    // 0 = kierowca, 1 = pasażer, 2 = tylne lewe, 3 = tylne prawe.
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

    // --- Stan drzwi ---
    // Zwraca, czy drzwi są brakujące, otwarte lub zamknięte.
    // Nazwy slotów (NivaDriverDoors, NivaCoDriverDoors, NivaHood, NivaTrunk)
    // są zdefiniowane przez proxy slotów ekwipunku modelu.
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

    // --- Wchodzenie/wychodzenie załogi ---
    // Określa, czy gracz może wsiąść lub wysiąść z danego siedzenia.
    // Sprawdza stan drzwi i fazę animacji składania siedzenia.
    // Przednie siedzenia (0, 1) wymagają otwarcia drzwi.
    // Tylne siedzenia (2, 3) wymagają otwarcia drzwi ORAZ złożenia przedniego siedzenia.
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

    // --- Sprawdzanie maski dla załączników ---
    // Zapobiega usuwaniu części silnika przy zamkniętej masce.
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

    // --- Dostęp do ładunku ---
    // Bagażnik musi być otwarty, aby uzyskać dostęp do ładunku pojazdu.
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

    // --- Dostęp do komory silnika ---
    // Maska musi być otwarta, aby zobaczyć sloty załączników silnika.
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

    // --- Spawn debugowy ---
    // Wywoływane przy spawnowaniu z menu debug. Spawnuje ze wszystkimi zamontowanymi
    // częściami i uzupełnionymi płynami do natychmiastowego testowania.
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

        // Zapasowe koła w ładunku
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
    }
};
```

### Zrozumienie kluczowych nadpisań

**GetAnimInstance** -- Zwraca, który zestaw animacji gracz używa siedząc w pojeździe. Wartości enum to:

| Wartość | Stała | Typ pojazdu |
|---------|----------|-------------|
| 0 | `CIVVAN` | Van |
| 1 | `V3S` | Ciężarówka V3S |
| 2 | `SEDAN` | Sedan Olga |
| 3 | `HATCHBACK` | Hatchback Niva |
| 5 | `S120` | Sarka 120 |
| 7 | `GOLF` | Gunter 2 |
| 8 | `HMMWV` | Humvee |

Jeśli zmienisz to na niewłaściwą wartość, animacja gracza będzie przechodzić przez pojazd lub wyglądać niepoprawnie. Zawsze dopasowuj do używanego modelu.

**CrewCanGetThrough** -- Jest wywoływane co klatkę, aby określić, czy gracz może wsiąść lub wysiąść z siedzenia. Tylne siedzenia Nivy (indeksy 2 i 3) działają inaczej niż przednie: oparcie przedniego siedzenia musi być złożone do przodu (faza animacji > 0.5), zanim tylni pasażerowie mogą się przedostać. Odpowiada to rzeczywistemu zachowaniu 2-drzwiowego hatchbacka, gdzie tylni pasażerowie muszą odchylić przednie siedzenie.

**OnDebugSpawn** -- Wywoływane przy użyciu menu debug spawn. `SpawnUniversalParts()` dodaje żarówki reflektorów i akumulator samochodowy. `FillUpCarFluids()` uzupełnia paliwo, płyn chłodzący, olej i płyn hamulcowy do maksimum. Następnie tworzymy koła, drzwi, maskę i bagażnik. Daje to natychmiast jezdny pojazd do testowania.

---

## Krok 4: Wpis types.xml

### Konfiguracja spawnowania pojazdu

Pojazdy w `types.xml` używają tego samego formatu co przedmioty, ale z pewnymi ważnymi różnicami. Dodaj to do `types.xml` swojego serwera:

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

### Różnice między pojazdami a przedmiotami w types.xml

| Ustawienie | Przedmioty | Pojazdy |
|---------|-------|----------|
| `nominal` | 10-50+ | 1-5 (pojazdy są rzadkie) |
| `lifetime` | 3600-14400 | 3888000 (45 dni -- pojazdy utrzymują się długo) |
| `restock` | 1800 | 0 (pojazdy nie odnawiają się automatycznie; respawnują się dopiero po zniszczeniu i despawnie poprzedniego) |
| `category` | `tools`, `weapons`, itd. | `vehicles` |

### Wstępnie zamontowane części z cfgspawnabletypes.xml

Pojazdy domyślnie spawnują się jako puste szkielety -- bez kół, drzwi ani części silnika. Aby spawnowały się z wstępnie zamontowanymi częściami, dodaj wpisy do `cfgspawnabletypes.xml` w folderze misji serwera:

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

### Jak działa cfgspawnabletypes

Każdy blok `<attachments>` jest ewaluowany niezależnie:
- Zewnętrzny `chance` określa, czy ta grupa załączników jest w ogóle brana pod uwagę
- Każdy `<item>` w środku ma własne `chance` na umieszczenie
- Przedmioty są umieszczane w pierwszym dostępnym pasującym slocie pojazdu

Oznacza to, że pojazd może się zrespawnować z 3 kołami i bez drzwi, lub ze wszystkimi kołami i akumulatorem, ale bez świecy zapłonowej. Tworzy to pętlę rozgrywki opartą na zbieractwie -- gracze muszą znaleźć brakujące części.

---

## Krok 5: Budowanie i testowanie

### Spakuj PBO

Potrzebujesz dwóch PBO dla tego moda:

```
@MyFirstMod/
    mod.cpp
    Addons/
        Scripts.pbo          <-- Zawiera Scripts/config.cpp i 4_World/
        Data.pbo             <-- Zawiera Data/config.cpp i Textures/
```

Użyj Addon Builder z DayZ Tools:
1. **Scripts PBO:** Source = `MyFirstMod/Scripts/`, Prefix = `MyFirstMod/Scripts`
2. **Data PBO:** Source = `MyFirstMod/Data/`, Prefix = `MyFirstMod/Data`

Lub użyj file patchingu podczas rozwoju:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

### Zespawnuj pojazd za pomocą konsoli skryptów

1. Uruchom DayZ z załadowanym modem
2. Dołącz do serwera lub uruchom tryb offline
3. Otwórz konsolę skryptów
4. Aby zespawnować w pełni wyposażony pojazd w pobliżu twojej postaci:

```c
EntityAI vehicle;
vector pos = GetGame().GetPlayer().GetPosition();
pos[2] = pos[2] + 5;
vehicle = EntityAI.Cast(GetGame().CreateObject("MFM_RallyHatchback", pos, false, false, true));
```

5. Naciśnij **Execute**

Pojazd powinien pojawić się 5 metrów przed tobą.

### Zespawnuj pojazd gotowy do jazdy

Dla szybszego testowania zespawnuj pojazd i użyj metody debug spawn, która montuje wszystkie części:

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

Wywołuje to twoje nadpisanie `OnDebugSpawn()`, które uzupełnia płyny i montuje koła, drzwi, maskę i bagażnik.

### Co testować

| Sprawdzenie | Na co zwracać uwagę |
|-------|-----------------|
| **Pojazd się spawnuje** | Pojawia się w świecie bez błędów w logu skryptów |
| **Tekstury zastosowane** | Niestandardowy kolor nadwozia jest widoczny (jeśli używasz niestandardowych tekstur) |
| **Silnik się uruchamia** | Wsiądź, przytrzymaj klawisz startu silnika. Nasłuchuj dźwięku startu. |
| **Jazda** | Przyspieszenie, prędkość maksymalna, prowadzenie odczuwalnie różnią się od vanilla |
| **Drzwi** | Można otwierać/zamykać drzwi kierowcy i pasażera |
| **Maska/Bagażnik** | Można otworzyć maskę, aby uzyskać dostęp do części silnika. Można otworzyć bagażnik dla ładunku. |
| **Tylne siedzenia** | Złóż przednie siedzenie, potem wsiądź na tylne siedzenie |
| **Zużycie paliwa** | Jedź i obserwuj wskaźnik paliwa |
| **Uszkodzenia** | Strzelaj do pojazdu. Części powinny ulegać uszkodzeniom i w końcu się psuć. |
| **Światła** | Reflektory przednie i tylne światła działają w nocy |

### Czytanie logu skryptów

Jeśli pojazd się nie spawnuje lub zachowuje się nieprawidłowo, sprawdź log skryptów w:

```
%localappdata%\DayZ\<YourProfile>\script.log
```

Typowe błędy:

| Komunikat w logu | Przyczyna |
|-------------|-------|
| `Cannot create object type MFM_RallyHatchback` | Niezgodność nazwy klasy w config.cpp lub Data PBO nie załadowane |
| `Undefined variable 'OffroadHatchback'` | Brakujący `"DZ_Vehicles_Wheeled"` w `requiredAddons` |
| `Member not found` przy wywołaniu metody | Literówka w nazwie nadpisanej metody |

---

## Krok 6: Polerowanie

### Niestandardowy dźwięk klaksonu

Aby nadać pojazdowi unikalny klakson, zdefiniuj niestandardowe zestawy dźwięków w swoim Data config.cpp:

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

Następnie odwołaj się do nich w konstruktorze skryptu:

```c
m_CarHornShortSoundName = "MFM_RallyHornShort_SoundSet";
m_CarHornLongSoundName  = "MFM_RallyHorn_SoundSet";
```

Pliki dźwiękowe muszą być w formacie `.ogg`. Ścieżka w `samples[]` NIE zawiera rozszerzenia pliku.

### Niestandardowe reflektory

Możesz stworzyć niestandardową klasę świateł, aby zmienić jasność, kolor lub zasięg reflektorów:

```c
class MFM_RallyFrontLight extends CarLightBase
{
    void MFM_RallyFrontLight()
    {
        // Światła mijania (segregated)
        m_SegregatedBrightness = 7;
        m_SegregatedRadius = 65;
        m_SegregatedAngle = 110;
        m_SegregatedColorRGB = Vector(0.9, 0.9, 1.0);

        // Światła drogowe (aggregated)
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

Nadpisanie w klasie pojazdu:

```c
override CarLightBase CreateFrontLight()
{
    return CarLightBase.Cast(ScriptedLightBase.CreateLight(MFM_RallyFrontLight));
}
```

### Izolacja dźwiękowa (OnSound)

Nadpisanie `OnSound` kontroluje, jak bardzo kabina tłumi hałas silnika w zależności od stanu drzwi i okien:

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

Wartość `1.0` oznacza pełną izolację (cicha kabina), `0.0` oznacza brak izolacji (uczucie na otwartej przestrzeni).

---

## Kompletna dokumentacja kodu

### Ostateczna struktura katalogów

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
            rally_horn.ogg           (opcjonalnie)
            rally_horn_short.ogg     (opcjonalnie)
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

### Wpis types.xml w misji serwera

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

### Wpis cfgspawnabletypes.xml w misji serwera

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

## Najlepsze praktyki

- **Zawsze rozszerzaj istniejącą klasę pojazdu.** Tworzenie pojazdu od zera wymaga niestandardowego modelu 3D z poprawnymi LOD-ami geometrii, proxy, punktami pamięci i konfiguracją symulacji fizyki. Rozszerzenie pojazdu vanilla daje ci to wszystko za darmo.
- **Najpierw testuj z `OnDebugSpawn()`.** Przed skonfigurowaniem types.xml i cfgspawnabletypes.xml zweryfikuj, że pojazd działa, spawnując go w pełni wyposażonego przez menu debug lub konsolę skryptów.
- **Zachowaj ten sam `GetAnimInstance()` co rodzic.** Jeśli zmienisz to bez pasującego zestawu animacji, gracze będą w T-pose lub przechodzić przez pojazd.
- **Nie zmieniaj nazw slotów drzwi.** Niva używa `NivaDriverDoors`, `NivaCoDriverDoors`, `NivaHood`, `NivaTrunk`. Są one powiązane z nazwami proxy modelu i definicjami slotów ekwipunku. Zmiana ich bez zmiany modelu zepsuje funkcjonalność drzwi.
- **Używaj `scope = 0` dla wewnętrznych klas bazowych.** Jeśli tworzysz abstrakcyjny bazowy pojazd, po którym inne warianty dziedziczą, ustaw `scope = 0`, aby nigdy się nie spawnował bezpośrednio.
- **Ustaw `requiredAddons` poprawnie.** Twój Data config.cpp musi wymieniać `"DZ_Vehicles_Wheeled"`, aby klasa nadrzędna `OffroadHatchback` załadowała się przed twoją.
- **Testuj logikę drzwi dokładnie.** Wchodź/wychodź z każdego siedzenia, otwieraj/zamykaj każde drzwi, próbuj dostać się do komory silnika z zamkniętą maską. Błędy CrewCanGetThrough to najczęstszy problem modów pojazdów.

---

## Teoria vs praktyka

| Koncepcja | Teoria | Rzeczywistość |
|---------|--------|---------|
| `SimulationModule` w config.cpp | Pełna kontrola nad fizyką pojazdu | Nie wszystkie parametry nadpisują się czysto przy rozszerzaniu klasy nadrzędnej. Jeśli zmiany prędkości/momentu obrotowego wydają się nie mieć efektu, spróbuj dostosować `transmissionRatio` i `ratios[]` biegów zamiast samego `torqueMax`. |
| Strefy uszkodzeń z `componentNames[]` | Każda strefa mapuje się na komponent geometrii | Przy rozszerzaniu pojazdu vanilla nazwy komponentów modelu nadrzędnego są już ustawione. Wartości `componentNames[]` w konfiguracji mają znaczenie tylko wtedy, gdy dostarczasz niestandardowy model. LOD geometrii rodzica określa faktyczną detekcję trafień. |
| Niestandardowe tekstury przez ukryte selekcje | Swobodna wymiana dowolnej tekstury | Tylko selekcje, które autor modelu oznaczył jako "ukryte", mogą być nadpisane. Jeśli musisz reteksturować część niebędącą w `hiddenSelections[]`, musisz stworzyć nowy model lub zmodyfikować istniejący w Object Builder. |
| Wstępnie zamontowane części w `cfgspawnabletypes.xml` | Przedmioty montują się do pasujących slotów | Jeśli klasa koła jest niekompatybilna z pojazdem (zły slot montażowy), cicho zawiedzie. Zawsze używaj części, które pojazd nadrzędny akceptuje -- dla Nivy to `HatchbackWheel`, nie `CivSedanWheel`. |
| Dźwięki silnika | Ustaw dowolną nazwę SoundSet | Zestawy dźwięków muszą być zdefiniowane w `CfgSoundSets` gdzieś w załadowanych konfiguracjach. Jeśli odwołujesz się do zestawu dźwięków, który nie istnieje, silnik cicho wraca do braku dźwięku -- bez błędu w logu. |

---

## Czego się nauczyłeś

W tym tutorialu nauczyłeś się:

- Jak zdefiniować niestandardową klasę pojazdu, rozszerzając istniejący pojazd vanilla w config.cpp
- Jak działają strefy uszkodzeń i jak konfigurować wartości zdrowia dla każdego komponentu pojazdu
- Jak ukryte selekcje pojazdu pozwalają na reteksturowanie nadwozia bez niestandardowego modelu 3D
- Jak napisać skrypt pojazdu z logiką stanów drzwi, sprawdzaniem wchodzenia załogi i zachowaniem silnika
- Jak `types.xml` i `cfgspawnabletypes.xml` współpracują przy spawnowaniu pojazdów z losowo zamontowanymi częściami
- Jak testować pojazdy w grze za pomocą konsoli skryptów i metody `OnDebugSpawn()`
- Jak dodawać niestandardowe dźwięki klaksonów i niestandardowe klasy świateł reflektorów

**Następny:** Rozszerz swój mod pojazdu o niestandardowe modele drzwi, tekstury wnętrza lub nawet zupełnie nowe nadwozie pojazdu za pomocą Blender i Object Builder.

---

## Częste błędy

### Pojazd spawnuje się, ale natychmiast wpada pod ziemię

Geometria fizyki się nie ładuje. Zwykle oznacza to, że w `requiredAddons[]` brakuje `"DZ_Vehicles_Wheeled"`, więc konfiguracja fizyki klasy nadrzędnej nie jest dziedziczona.

### Pojazd spawnuje się, ale nie można do niego wsiąść

Sprawdź, czy `GetAnimInstance()` zwraca poprawną wartość enum dla twojego modelu. Jeśli rozszerzasz `OffroadHatchback`, ale zwracasz `VehicleAnimInstances.SEDAN`, animacja wchodzenia celuje w złe pozycje drzwi i gracz nie może wsiąść.

### Drzwi się nie otwierają ani nie zamykają

Zweryfikuj, że `GetCarDoorsState()` używa poprawnych nazw slotów. Niva używa `"NivaDriverDoors"`, `"NivaCoDriverDoors"`, `"NivaHood"` i `"NivaTrunk"`. Muszą pasować dokładnie, włącznie z wielkością liter.

### Silnik się uruchamia, ale pojazd się nie rusza

Sprawdź przełożenia biegów `SimulationModule`. Jeśli `ratios[]` jest puste lub ma wartości zerowe, pojazd nie ma biegów do przodu. Zweryfikuj również, czy koła są zamontowane -- pojazd bez kół będzie gazował, ale się nie ruszy.

### Pojazd nie ma dźwięku

Dźwięki silnika są przypisywane w konstruktorze. Jeśli źle napiszesz nazwę SoundSet (na przykład `"offroad_engine_Start_SoundSet"` zamiast `"offroad_engine_start_SoundSet"`), silnik cicho używa braku dźwięku. Nazwy zestawów dźwięków rozróżniają wielkość liter.

### Niestandardowa tekstura się nie wyświetla

Zweryfikuj trzy rzeczy w kolejności: (1) nazwa ukrytej selekcji pasuje dokładnie do modelu, (2) ścieżka tekstury używa backslashy w config.cpp i (3) plik `.paa` znajduje się wewnątrz spakowanego PBO. Jeśli używasz file patchingu podczas rozwoju, upewnij się, że ścieżka zaczyna się od katalogu głównego moda, a nie od ścieżki bezwzględnej.

### Tylni pasażerowie nie mogą wsiąść

Tylne siedzenia Nivy wymagają złożenia przedniego siedzenia do przodu. Jeśli twoje nadpisanie `CrewCanGetThrough()` dla indeksów siedzeń 2 i 3 nie sprawdza `GetAnimationPhase("SeatDriver")` i `GetAnimationPhase("SeatCoDriver")`, tylni pasażerowie będą trwale zablokowani.

### Pojazd spawnuje się bez części w trybie wieloosobowym

`OnDebugSpawn()` jest tylko do debugowania/testowania. Na prawdziwym serwerze części pochodzą z `cfgspawnabletypes.xml`. Jeśli twój pojazd spawnuje się jako goły szkielet, dodaj wpis `cfgspawnabletypes.xml` opisany w Kroku 4.

---

**Poprzedni:** [Rozdział 8.9: Profesjonalny szablon moda](09-professional-template.md)
