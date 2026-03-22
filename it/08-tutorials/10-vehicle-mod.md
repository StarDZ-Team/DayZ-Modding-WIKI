# Capitolo 8.10: Creare una Mod Veicolo Personalizzato

[Home](../README.md) | [<< Precedente: Template Mod Professionale](09-professional-template.md) | **Creare un Veicolo Personalizzato** | [Successivo: Creare Abbigliamento Personalizzato >>](11-clothing-mod.md)

---

> **Riepilogo:** Questo tutorial ti guida nella creazione di una variante di veicolo personalizzato in DayZ estendendo un veicolo vanilla esistente. Definirai il veicolo in config.cpp, personalizzerai le sue statistiche e texture, scriverai il comportamento tramite script per le porte e il motore, lo aggiungerai alla tabella di spawn del server con parti pre-attaccate e lo testerai in gioco. Alla fine, avrai una variante personalizzata della Offroad Hatchback completamente guidabile con prestazioni e aspetto modificati.

---

## Indice dei Contenuti

- [Cosa Stiamo Costruendo](#cosa-stiamo-costruendo)
- [Prerequisiti](#prerequisiti)
- [Step 1: Creare il Config (config.cpp)](#step-1-creare-il-config-configcpp)
- [Step 2: Texture Personalizzate](#step-2-texture-personalizzate)
- [Step 3: Comportamento Script (CarScript)](#step-3-comportamento-script-carscript)
- [Step 4: Voce types.xml](#step-4-voce-typesxml)
- [Step 5: Compilare e Testare](#step-5-compilare-e-testare)
- [Step 6: Rifinitura](#step-6-rifinitura)
- [Riferimento Completo del Codice](#riferimento-completo-del-codice)
- [Buone Pratiche](#buone-pratiche)
- [Teoria vs Pratica](#teoria-vs-pratica)
- [Cosa Hai Imparato](#cosa-hai-imparato)
- [Errori Comuni](#errori-comuni)

---

## Cosa Stiamo Costruendo

Creeremo un veicolo chiamato **MFM Rally Hatchback** -- una versione modificata della Offroad Hatchback vanilla (la Niva) con:

- Pannelli carrozzeria ritexturizzati usando le hidden selection
- Prestazioni motore modificate (velocità massima più alta, consumo carburante maggiore)
- Valori di salute delle zone di danno regolati (motore più resistente, porte più deboli)
- Tutto il comportamento standard del veicolo: apertura porte, avvio/arresto motore, carburante, luci, entrata/uscita equipaggio
- Voce nella tabella di spawn con ruote e parti pre-attaccate

Estendiamo `OffroadHatchback` piuttosto che costruire un veicolo da zero. Questo è il flusso di lavoro standard per le mod veicolo perché eredita il modello, le animazioni, la geometria fisica e tutto il comportamento esistente. Devi sovrascrivere solo ciò che vuoi cambiare.

---

## Prerequisiti

- Una struttura mod funzionante (completa prima il [Capitolo 8.1](01-first-mod.md) e il [Capitolo 8.2](02-custom-item.md))
- Un editor di testo
- DayZ Tools installato (per la conversione delle texture, opzionale)
- Familiarità di base con il funzionamento dell'ereditarietà delle classi in config.cpp

La tua mod dovrebbe avere questa struttura di partenza:

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
    Data/
        config.cpp
```

---

## Step 1: Creare il Config (config.cpp)

Le definizioni dei veicoli risiedono in `CfgVehicles`, proprio come gli oggetti. Nonostante il nome della classe, `CfgVehicles` contiene tutto -- oggetti, edifici e veicoli veri e propri. La differenza chiave per i veicoli è la classe genitore e la configurazione aggiuntiva per le zone di danno, gli attaccamenti e i parametri di simulazione.

### Aggiorna il tuo config.cpp Data

Apri `MyFirstMod/Data/config.cpp` e aggiungi la classe veicolo. Se hai già definizioni di oggetti qui dal Capitolo 8.2, aggiungi la classe veicolo all'interno del blocco `CfgVehicles` esistente.

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

        // --- Hidden Selection per la ritexturizzazione ---
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

        // --- Simulazione (fisica e motore) ---
        class SimulationModule : SimulationModule
        {
            // Tipo di trazione: 0 = RWD, 1 = FWD, 2 = AWD
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

        // --- Zone di Danno ---
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

### Spiegazione dei Campi Chiave

| Campo | Scopo |
|-------|-------|
| `scope = 2` | Rende il veicolo spawnabile. Usa `0` per le classi base che non dovrebbero mai spawnare direttamente. |
| `displayName` | Nome mostrato negli strumenti admin e in gioco. Puoi usare riferimenti `$STR_` per la localizzazione. |
| `requiredAddons[]` | Deve includere `"DZ_Vehicles_Wheeled"` così la classe genitore `OffroadHatchback` viene caricata prima della tua classe. |
| `hiddenSelections[]` | Slot di texture sul modello che vuoi sovrascrivere. Devono corrispondere alle selezioni nominate del modello. |
| `SimulationModule` | Configurazione fisica e motore. Controlla velocità, coppia, rapporti e frenata. |
| `DamageSystem` | Definisce le riserve di salute per ogni parte del veicolo (motore, porte, finestrini, carrozzeria). |

### Riguardo la Classe Genitore

```cpp
class OffroadHatchback;
```

Questa dichiarazione forward dice al parser del config che `OffroadHatchback` esiste nel DayZ vanilla. Il tuo veicolo eredita poi da essa, ottenendo il modello completo della Niva, le animazioni, la geometria fisica, i punti di attacco e le definizioni dei proxy. Devi sovrascrivere solo ciò che vuoi cambiare.

Altre classi genitore di veicoli vanilla che potresti estendere:

| Classe Genitore | Veicolo |
|----------------|---------|
| `OffroadHatchback` | Niva (hatchback a 4 posti) |
| `CivilianSedan` | Olga (berlina a 4 posti) |
| `Hatchback_02` | Golf/Gunter (hatchback a 4 posti) |
| `Sedan_02` | Sarka 120 (berlina a 4 posti) |
| `Offroad_02` | Humvee (fuoristrada a 4 posti) |
| `Truck_01_Base` | V3S (camion) |

### Riguardo il SimulationModule

Il `SimulationModule` controlla come il veicolo si guida. Parametri chiave:

| Parametro | Effetto |
|-----------|---------|
| `drive` | `0` = trazione posteriore, `1` = trazione anteriore, `2` = trazione integrale |
| `torqueMax` | Coppia massima del motore in Nm. Più alta = più accelerazione. La Niva vanilla è ~114. |
| `powerMax` | Potenza massima in cavalli. Più alta = velocità massima più elevata. La Niva vanilla è ~68. |
| `rpmRedline` | RPM al limitatore del motore. Oltre questo, il motore rimbalza sul limitatore di giri. |
| `ratios[]` | Rapporti delle marce. Numeri più bassi = marce più lunghe = velocità massima più alta ma accelerazione più lenta. |
| `transmissionRatio` | Rapporto del differenziale finale. Agisce come moltiplicatore su tutte le marce. |

### Riguardo le Zone di Danno

Ogni zona di danno ha la propria riserva di salute. Quando la salute di una zona raggiunge zero, quel componente è distrutto:

| Zona | Effetto Quando Distrutta |
|------|--------------------------|
| `Engine` | Il veicolo non può avviarsi |
| `FuelTank` | Il carburante fuoriesce |
| `Front` / `Rear` | Danno visivo, protezione ridotta |
| `Door_1_1` / `Door_2_1` | La porta cade |
| `WindowFront` | Il finestrino si frantuma (influisce sull'isolamento acustico) |

Il valore `transferToGlobalCoef` determina quanto danno viene trasferito da questa zona alla salute globale del veicolo. `1` significa trasferimento al 100% (il danno al motore danneggia la salute complessiva), `0` significa nessun trasferimento.

I `componentNames[]` devono corrispondere ai componenti nominati nel LOD geometria del veicolo. Poiché ereditiamo il modello della Niva, usiamo nomi segnaposto qui -- i componenti geometrici della classe genitore sono quelli che contano effettivamente per il rilevamento delle collisioni. Se usi il modello vanilla senza modifiche, la mappatura dei componenti del genitore si applica automaticamente.

---

## Step 2: Texture Personalizzate

### Come Funzionano le Hidden Selection dei Veicoli

Le hidden selection dei veicoli funzionano allo stesso modo delle texture degli oggetti, ma i veicoli hanno tipicamente più slot di selezione. Il modello della Offroad Hatchback usa selezioni per diversi pannelli della carrozzeria, permettendo varianti di colore (Bianco, Blu) nel vanilla.

### Usare Texture Vanilla (Avvio Più Veloce)

Per i test iniziali, punta le tue hidden selection verso le texture vanilla esistenti. Questo conferma che il tuo config funziona prima di creare arte personalizzata:

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

Le stringhe vuote `""` significano "usa la texture predefinita del modello per questa selezione."

### Creare un Set di Texture Personalizzate

Per creare un aspetto unico:

1. **Estrai la texture vanilla** usando l'Addon Builder di DayZ Tools o il drive P: per trovare:
   ```
   P:\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa
   ```

2. **Converti in formato modificabile** usando TexView2:
   - Apri il file `.paa` in TexView2
   - Esporta come `.tga` o `.png`

3. **Modifica nel tuo editor di immagini** (GIMP, Photoshop, Paint.NET):
   - Le texture dei veicoli sono tipicamente **2048x2048** o **4096x4096**
   - Modifica i colori, aggiungi decal, strisce da corsa o effetti ruggine
   - Mantieni intatto il layout UV -- cambia solo i colori e i dettagli

4. **Riconverti in `.paa`**:
   - Apri la tua immagine modificata in TexView2
   - Salva in formato `.paa`
   - Salva in `MyFirstMod/Data/Textures/rally_body_co.paa`

### Convenzioni di Denominazione delle Texture per i Veicoli

| Suffisso | Tipo | Scopo |
|----------|------|-------|
| `_co` | Colore (Diffuse) | Colore e aspetto principale |
| `_nohq` | Normal Map | Rilievi superficiali, linee dei pannelli, dettagli dei rivetti |
| `_smdi` | Specular | Lucentezza metallica, riflessi della vernice |
| `_as` | Alpha/Superficie | Trasparenza per i finestrini |
| `_de` | Destruct | Texture overlay per il danno |

Per una prima mod veicolo, è richiesta solo la texture `_co`. Il modello usa le sue mappe normali e speculari predefinite.

### Materiali Corrispondenti (Opzionale)

Per un controllo completo dei materiali, crea un file `.rvmat`:

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

## Step 3: Comportamento Script (CarScript)

Le classi script dei veicoli controllano i suoni del motore, la logica delle porte, il comportamento di entrata/uscita dell'equipaggio e le animazioni dei sedili. Poiché estendiamo `OffroadHatchback`, ereditiamo tutto il comportamento vanilla e sovrascriviamo solo ciò che vogliamo personalizzare.

### Crea il File Script

Crea la struttura delle cartelle e il file script:

```
MyFirstMod/
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_RallyHatchback.c
```

### Aggiorna Scripts config.cpp

Il tuo `Scripts/config.cpp` deve registrare il layer `4_World` perché il motore carichi il tuo script:

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

### Scrivi lo Script del Veicolo

Crea `4_World/MyFirstMod/MFM_RallyHatchback.c`:

```c
class MFM_RallyHatchback extends OffroadHatchback
{
    void MFM_RallyHatchback()
    {
        // Sovrascrivi i suoni del motore (riutilizza i suoni vanilla della Niva)
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

        // Posizione del motore nello spazio del modello (x, y, z) -- usata per
        // la sorgente di temperatura, rilevamento annegamento ed effetti particellari
        SetEnginePos("0 0.7 1.2");
    }

    // --- Istanza Animazione ---
    // Determina quale set di animazioni del giocatore viene usato durante entrata/uscita.
    // Deve corrispondere allo scheletro del veicolo. Poiché usiamo il modello Niva, manteniamo HATCHBACK.
    override int GetAnimInstance()
    {
        return VehicleAnimInstances.HATCHBACK;
    }

    // --- Distanza Camera ---
    // Quanto è distante la camera in terza persona dietro il veicolo.
    // La Niva vanilla è 3.5. Aumenta per una visuale più ampia.
    override float GetTransportCameraDistance()
    {
        return 4.0;
    }

    // --- Tipi di Animazione dei Sedili ---
    // Mappa ogni indice di sedile a un tipo di animazione del giocatore.
    // 0 = guidatore, 1 = passeggero anteriore, 2 = posteriore sinistro, 3 = posteriore destro.
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

    // --- Stato delle Porte ---
    // Restituisce se una porta è mancante, aperta o chiusa.
    // I nomi degli slot (NivaDriverDoors, NivaCoDriverDoors, NivaHood, NivaTrunk)
    // sono definiti dai proxy degli slot dell'inventario del modello.
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

    // --- Entrata/Uscita Equipaggio ---
    // Determina se un giocatore può entrare o uscire da un sedile specifico.
    // Controlla lo stato della porta e la fase di animazione del ribaltamento del sedile.
    // I sedili anteriori (0, 1) richiedono che la porta sia aperta.
    // I sedili posteriori (2, 3) richiedono la porta aperta E il sedile anteriore ribaltato in avanti.
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

    // --- Controllo Cofano per Attaccamenti ---
    // Impedisce ai giocatori di rimuovere parti del motore quando il cofano è chiuso.
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

    // --- Accesso al Cargo ---
    // Il bagagliaio deve essere aperto per accedere al cargo del veicolo.
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

    // --- Accesso al Vano Motore ---
    // Il cofano deve essere aperto per vedere gli slot di attacco del motore.
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

    // --- Debug Spawn ---
    // Chiamato quando si spawna dal menu debug. Spawna con tutte le parti attaccate
    // e i fluidi riempiti per il test immediato.
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

        // Ruote di scorta nel cargo
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
    }
};
```

### Comprendere gli Override Chiave

**GetAnimInstance** -- Restituisce quale set di animazioni il giocatore usa quando è seduto nel veicolo. I valori dell'enum sono:

| Valore | Costante | Tipo di Veicolo |
|--------|----------|----------------|
| 0 | `CIVVAN` | Furgone |
| 1 | `V3S` | Camion V3S |
| 2 | `SEDAN` | Berlina Olga |
| 3 | `HATCHBACK` | Hatchback Niva |
| 5 | `S120` | Sarka 120 |
| 7 | `GOLF` | Gunter 2 |
| 8 | `HMMWV` | Humvee |

Se cambi questo al valore sbagliato, l'animazione del giocatore penetrerà attraverso il veicolo o apparirà scorretta. Fai sempre corrispondere al modello che stai usando.

**CrewCanGetThrough** -- Viene chiamato ogni frame per determinare se un giocatore può entrare o uscire da un sedile. I sedili posteriori della Niva (indici 2 e 3) funzionano diversamente da quelli anteriori: lo schienale del sedile anteriore deve essere ribaltato in avanti (fase di animazione > 0.5) prima che i passeggeri posteriori possano passare. Questo rispecchia il comportamento nel mondo reale di una hatchback a 2 porte dove i passeggeri posteriori devono inclinare il sedile anteriore.

**OnDebugSpawn** -- Chiamato quando usi il menu di spawn debug. `SpawnUniversalParts()` aggiunge lampadine dei fari e una batteria. `FillUpCarFluids()` riempie al massimo carburante, liquido di raffreddamento, olio e liquido dei freni. Poi creiamo ruote, porte, cofano e bagagliaio. Questo ti dà un veicolo immediatamente guidabile per i test.

---

## Step 4: Voce types.xml

### Configurazione dello Spawn del Veicolo

I veicoli in `types.xml` usano lo stesso formato degli oggetti, ma con alcune differenze importanti. Aggiungi questo al `types.xml` del tuo server:

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

### Differenze tra Veicoli e Oggetti in types.xml

| Impostazione | Oggetti | Veicoli |
|-------------|---------|---------|
| `nominal` | 10-50+ | 1-5 (i veicoli sono rari) |
| `lifetime` | 3600-14400 | 3888000 (45 giorni -- i veicoli persistono a lungo) |
| `restock` | 1800 | 0 (i veicoli non si riforniscono automaticamente; rispawnano solo dopo che il precedente è distrutto e despawnato) |
| `category` | `tools`, `weapons`, ecc. | `vehicles` |

### Parti Pre-Attaccate con cfgspawnabletypes.xml

I veicoli spawnano come gusci vuoti per impostazione predefinita -- niente ruote, porte o parti del motore. Per farli spawnare con parti pre-attaccate, aggiungi le voci a `cfgspawnabletypes.xml` nella cartella della missione del server:

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

### Come Funziona cfgspawnabletypes

Ogni blocco `<attachments>` viene valutato indipendentemente:
- La `chance` esterna determina se questo gruppo di attaccamenti viene considerato
- Ogni `<item>` all'interno ha la propria `chance` di essere posizionato
- Gli oggetti vengono posizionati nel primo slot corrispondente disponibile sul veicolo

Questo significa che un veicolo potrebbe spawnare con 3 ruote e nessuna porta, o con tutte le ruote e una batteria ma senza candela. Questo crea il ciclo di gameplay basato sulla raccolta -- i giocatori devono trovare le parti mancanti.

---

## Step 5: Compilare e Testare

### Impacchettare i PBO

Hai bisogno di due PBO per questa mod:

```
@MyFirstMod/
    mod.cpp
    Addons/
        Scripts.pbo          <-- Contiene Scripts/config.cpp e 4_World/
        Data.pbo             <-- Contiene Data/config.cpp e Textures/
```

Usa Addon Builder dai DayZ Tools:
1. **PBO Scripts:** Source = `MyFirstMod/Scripts/`, Prefix = `MyFirstMod/Scripts`
2. **PBO Data:** Source = `MyFirstMod/Data/`, Prefix = `MyFirstMod/Data`

Oppure usa il file patching durante lo sviluppo:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

### Spawnare il Veicolo Usando la Console Script

1. Avvia DayZ con la tua mod caricata
2. Entra nel tuo server o avvia la modalità offline
3. Apri la console script
4. Per spawnare un veicolo completamente equipaggiato vicino al tuo personaggio:

```c
EntityAI vehicle;
vector pos = GetGame().GetPlayer().GetPosition();
pos[2] = pos[2] + 5;
vehicle = EntityAI.Cast(GetGame().CreateObject("MFM_RallyHatchback", pos, false, false, true));
```

5. Premi **Execute**

Il veicolo dovrebbe apparire 5 metri davanti a te.

### Spawnare un Veicolo Pronto per Guidare

Per test più veloci, spawna il veicolo e usa il metodo debug spawn che attacca tutte le parti:

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

Questo chiama il tuo override `OnDebugSpawn()`, che riempie i fluidi e attacca ruote, porte, cofano e bagagliaio.

### Cosa Testare

| Controllo | Cosa Cercare |
|-----------|-------------|
| **Il veicolo spawna** | Appare nel mondo senza errori nel log degli script |
| **Texture applicate** | Il colore personalizzato della carrozzeria è visibile (se usi texture personalizzate) |
| **Il motore si avvia** | Entra, tieni premuto il tasto di avvio motore. Ascolta il suono di avviamento. |
| **Guida** | Accelerazione, velocità massima, maneggevolezza sono diverse dal vanilla |
| **Porte** | Puoi aprire/chiudere le porte del guidatore e del passeggero |
| **Cofano/Bagagliaio** | Puoi aprire il cofano per accedere alle parti del motore. Puoi aprire il bagagliaio per il cargo. |
| **Sedili posteriori** | Ribalta il sedile anteriore, poi entra nel sedile posteriore |
| **Consumo carburante** | Guida e osserva l'indicatore del carburante |
| **Danno** | Spara al veicolo. Le parti dovrebbero subire danni e alla fine rompersi. |
| **Luci** | I fari anteriori e le luci posteriori funzionano di notte |

### Leggere il Log degli Script

Se il veicolo non spawna o si comporta in modo scorretto, controlla il log degli script in:

```
%localappdata%\DayZ\<TuoProfilo>\script.log
```

Errori comuni:

| Messaggio nel Log | Causa |
|-------------------|-------|
| `Cannot create object type MFM_RallyHatchback` | Nome della classe in config.cpp non corrispondente o PBO Data non caricato |
| `Undefined variable 'OffroadHatchback'` | `requiredAddons` manca `"DZ_Vehicles_Wheeled"` |
| `Member not found` sulla chiamata del metodo | Errore di battitura nel nome del metodo sovrascritto |

---

## Step 6: Rifinitura

### Suono del Clacson Personalizzato

Per dare al tuo veicolo un clacson unico, definisci sound set personalizzati nel tuo config.cpp Data:

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

Poi fai riferimento ad essi nel costruttore del tuo script:

```c
m_CarHornShortSoundName = "MFM_RallyHornShort_SoundSet";
m_CarHornLongSoundName  = "MFM_RallyHorn_SoundSet";
```

I file audio devono essere in formato `.ogg`. Il percorso in `samples[]` NON include l'estensione del file.

### Fari Personalizzati

Puoi creare una classe di luce personalizzata per cambiare luminosità, colore o portata dei fari:

```c
class MFM_RallyFrontLight extends CarLightBase
{
    void MFM_RallyFrontLight()
    {
        // Anabbaglianti (segregati)
        m_SegregatedBrightness = 7;
        m_SegregatedRadius = 65;
        m_SegregatedAngle = 110;
        m_SegregatedColorRGB = Vector(0.9, 0.9, 1.0);

        // Abbaglianti (aggregati)
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

Sovrascrivi nella tua classe veicolo:

```c
override CarLightBase CreateFrontLight()
{
    return CarLightBase.Cast(ScriptedLightBase.CreateLight(MFM_RallyFrontLight));
}
```

### Isolamento Acustico (OnSound)

L'override `OnSound` controlla quanto l'abitacolo attenua il rumore del motore in base allo stato di porte e finestrini:

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

Un valore di `1.0` significa isolamento completo (abitacolo silenzioso), `0.0` significa nessun isolamento (sensazione all'aperto).

---

## Riferimento Completo del Codice

### Struttura Directory Finale

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
            rally_horn.ogg           (opzionale)
            rally_horn_short.ogg     (opzionale)
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

### Voce types.xml della Missione Server

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

### Voce cfgspawnabletypes.xml della Missione Server

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

## Buone Pratiche

- **Estendi sempre una classe veicolo esistente.** Creare un veicolo da zero richiede un modello 3D personalizzato con LOD geometria corretti, proxy, punti memoria e una configurazione di simulazione fisica. Estendere un veicolo vanilla ti dà tutto questo gratuitamente.
- **Testa prima con `OnDebugSpawn()`.** Prima di configurare types.xml e cfgspawnabletypes.xml, verifica che il veicolo funzioni spawnandolo completamente equipaggiato tramite il menu debug o la console script.
- **Mantieni lo stesso `GetAnimInstance()` del genitore.** Se lo cambi senza un set di animazioni corrispondente, i giocatori faranno il T-pose o penetreranno attraverso il veicolo.
- **Non cambiare i nomi degli slot delle porte.** La Niva usa `NivaDriverDoors`, `NivaCoDriverDoors`, `NivaHood`, `NivaTrunk`. Questi sono legati ai nomi dei proxy del modello e alle definizioni degli slot dell'inventario. Cambiarli senza cambiare il modello romperà la funzionalità delle porte.
- **Usa `scope = 0` per le classi base interne.** Se crei un veicolo base astratto che altre varianti estendono, imposta `scope = 0` così non spawna mai direttamente.
- **Imposta `requiredAddons` correttamente.** Il tuo config.cpp Data deve elencare `"DZ_Vehicles_Wheeled"` così la classe genitore `OffroadHatchback` viene caricata prima della tua.
- **Testa la logica delle porte accuratamente.** Entra/esci da ogni sedile, apri/chiudi ogni porta, prova ad accedere al vano motore con il cofano chiuso. I bug di CrewCanGetThrough sono il problema più comune nelle mod veicolo.

---

## Teoria vs Pratica

| Concetto | Teoria | Realtà |
|----------|--------|--------|
| `SimulationModule` in config.cpp | Pieno controllo sulla fisica del veicolo | Non tutti i parametri vengono sovrascritti in modo pulito quando si estende una classe genitore. Se le tue modifiche a velocità/coppia sembrano non avere effetto, prova a regolare `transmissionRatio` e i `ratios[]` delle marce invece del solo `torqueMax`. |
| Zone di danno con `componentNames[]` | Ogni zona mappa a un componente geometrico | Quando estendi un veicolo vanilla, i nomi dei componenti del modello genitore sono già impostati. I tuoi valori `componentNames[]` nel config contano solo se fornisci un modello personalizzato. Il LOD geometria del genitore determina il rilevamento effettivo dei colpi. |
| Texture personalizzate tramite hidden selection | Sostituisci qualsiasi texture liberamente | Solo le selezioni che l'autore del modello ha marcato come "hidden" possono essere sovrascritte. Se hai bisogno di ritexturizzare una parte non presente in `hiddenSelections[]`, devi creare un nuovo modello o modificare quello esistente in Object Builder. |
| Parti pre-attaccate in `cfgspawnabletypes.xml` | Gli oggetti si attaccano agli slot corrispondenti | Se una classe di ruota è incompatibile con il veicolo (slot di attacco sbagliato), fallisce silenziosamente. Usa sempre parti che il veicolo genitore accetta -- per la Niva, questo significa `HatchbackWheel`, non `CivSedanWheel`. |
| Suoni del motore | Imposta qualsiasi nome di SoundSet | I sound set devono essere definiti in `CfgSoundSets` da qualche parte nei config caricati. Se fai riferimento a un sound set che non esiste, il motore usa silenziosamente nessun suono -- nessun errore nel log. |

---

## Cosa Hai Imparato

In questo tutorial hai imparato:

- Come definire una classe veicolo personalizzata estendendo un veicolo vanilla esistente in config.cpp
- Come funzionano le zone di danno e come configurare i valori di salute per ogni componente del veicolo
- Come le hidden selection dei veicoli permettono la ritexturizzazione della carrozzeria senza un modello 3D personalizzato
- Come scrivere uno script del veicolo con logica dello stato delle porte, controlli di entrata dell'equipaggio e comportamento del motore
- Come `types.xml` e `cfgspawnabletypes.xml` lavorano insieme per lo spawn dei veicoli con parti pre-attaccate randomizzate
- Come testare i veicoli in gioco usando la console script e il metodo `OnDebugSpawn()`
- Come aggiungere suoni personalizzati per i clacson e classi di luce personalizzate per i fari

**Successivo:** Espandi la tua mod veicolo con modelli di porte personalizzati, texture degli interni o persino una carrozzeria completamente nuova usando Blender e Object Builder.

---

## Errori Comuni

### Il Veicolo Spawna Ma Cade Immediatamente Attraverso il Terreno

La geometria fisica non si sta caricando. Questo di solito significa che `requiredAddons[]` manca `"DZ_Vehicles_Wheeled"`, quindi il config fisico della classe genitore non viene ereditato.

### Il Veicolo Spawna Ma Non Si Può Entrare

Controlla che `GetAnimInstance()` restituisca il valore enum corretto per il tuo modello. Se estendi `OffroadHatchback` ma restituisci `VehicleAnimInstances.SEDAN`, l'animazione di entrata punta alle posizioni sbagliate delle porte e il giocatore non riesce a entrare.

### Le Porte Non Si Aprono o Chiudono

Verifica che `GetCarDoorsState()` usi i nomi degli slot corretti. La Niva usa `"NivaDriverDoors"`, `"NivaCoDriverDoors"`, `"NivaHood"` e `"NivaTrunk"`. Questi devono corrispondere esattamente, inclusa la capitalizzazione.

### Il Motore Si Avvia Ma il Veicolo Non Si Muove

Controlla i rapporti delle marce nel tuo `SimulationModule`. Se `ratios[]` è vuoto o ha valori zero, il veicolo non ha marce avanti. Verifica anche che le ruote siano attaccate -- un veicolo senza ruote accelererà ma non si muoverà.

### Il Veicolo Non Ha Suono

I suoni del motore vengono assegnati nel costruttore. Se scrivi male il nome di un SoundSet (ad esempio `"offroad_engine_Start_SoundSet"` invece di `"offroad_engine_start_SoundSet"`), il motore usa silenziosamente nessun suono. I nomi dei sound set sono case-sensitive.

### La Texture Personalizzata Non Si Mostra

Verifica tre cose in ordine: (1) il nome della hidden selection corrisponde esattamente al modello, (2) il percorso della texture usa le barre rovesciate in config.cpp, e (3) il file `.paa` è dentro il PBO impacchettato. Se usi il file patching durante lo sviluppo, assicurati che il percorso parta dalla radice della mod, non un percorso assoluto.

### I Passeggeri Posteriori Non Possono Entrare

I sedili posteriori della Niva richiedono che il sedile anteriore sia ribaltato in avanti. Se il tuo override `CrewCanGetThrough()` per gli indici dei sedili 2 e 3 non controlla `GetAnimationPhase("SeatDriver")` e `GetAnimationPhase("SeatCoDriver")`, i passeggeri posteriori saranno permanentemente bloccati fuori.

### Il Veicolo Spawna Senza Parti nel Multiplayer

`OnDebugSpawn()` è solo per il debug/test. In un server reale, le parti provengono da `cfgspawnabletypes.xml`. Se il tuo veicolo spawna come guscio nudo, aggiungi la voce `cfgspawnabletypes.xml` descritta nello Step 4.

---

**Precedente:** [Capitolo 8.9: Template Mod Professionale](09-professional-template.md)
