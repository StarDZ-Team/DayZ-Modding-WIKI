# Capítulo 8.10: Creando un Mod de Vehículo Personalizado

[Inicio](../README.md) | [<< Anterior: Plantilla Profesional de Mod](09-professional-template.md) | **Creando un Vehículo Personalizado** | [Siguiente: Creando Ropa Personalizada >>](11-clothing-mod.md)

---

> **Resumen:** Este tutorial te guía a través de la creación de una variante de vehículo personalizado en DayZ extendiendo un vehículo vanilla existente. Definirás el vehículo en config.cpp, personalizarás sus estadísticas y texturas, escribirás el comportamiento de script para puertas y motor, lo agregarás a la tabla de aparición del servidor con partes preinstaladas y lo probarás en el juego. Al final, tendrás una variante completamente conducible del Offroad Hatchback personalizado con rendimiento y apariencia modificados.

---

## Tabla de Contenidos

- [Lo Que Vamos a Construir](#lo-que-vamos-a-construir)
- [Prerrequisitos](#prerrequisitos)
- [Paso 1: Crear la Configuración (config.cpp)](#paso-1-crear-la-configuración-configcpp)
- [Paso 2: Texturas Personalizadas](#paso-2-texturas-personalizadas)
- [Paso 3: Comportamiento del Script (CarScript)](#paso-3-comportamiento-del-script-carscript)
- [Paso 4: Entrada en types.xml](#paso-4-entrada-en-typesxml)
- [Paso 5: Compilar y Probar](#paso-5-compilar-y-probar)
- [Paso 6: Pulir](#paso-6-pulir)
- [Referencia Completa del Código](#referencia-completa-del-código)
- [Mejores Prácticas](#mejores-prácticas)
- [Teoría vs Práctica](#teoría-vs-práctica)
- [Lo Que Aprendiste](#lo-que-aprendiste)
- [Errores Comunes](#errores-comunes)

---

## Lo Que Vamos a Construir

Crearemos un vehículo llamado **MFM Rally Hatchback** -- una versión modificada del Offroad Hatchback vanilla (el Niva) con:

- Paneles de carrocería retexturizados usando selecciones ocultas
- Rendimiento del motor modificado (mayor velocidad máxima, mayor consumo de combustible)
- Valores de salud de zonas de daño ajustados (motor más resistente, puertas más débiles)
- Todo el comportamiento estándar del vehículo: abrir puertas, encender/apagar motor, combustible, luces, entrada/salida de tripulación
- Entrada en la tabla de aparición con ruedas y partes preinstaladas

Extendemos `OffroadHatchback` en lugar de construir un vehículo desde cero. Este es el flujo de trabajo estándar para mods de vehículos porque hereda el modelo, animaciones, geometría de física y todo el comportamiento existente. Solo necesitas sobreescribir lo que quieras cambiar.

---

## Prerrequisitos

- Una estructura de mod funcional (completa primero el [Capítulo 8.1](01-first-mod.md) y el [Capítulo 8.2](02-custom-item.md))
- Un editor de texto
- DayZ Tools instalado (para conversión de texturas, opcional)
- Familiaridad básica con cómo funciona la herencia de clases en config.cpp

Tu mod debería tener esta estructura inicial:

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
    Data/
        config.cpp
```

---

## Paso 1: Crear la Configuración (config.cpp)

Las definiciones de vehículos se encuentran en `CfgVehicles`, igual que los ítems. A pesar del nombre de la clase, `CfgVehicles` contiene todo -- ítems, edificios y vehículos reales por igual. La diferencia clave para los vehículos es la clase padre y la configuración adicional para zonas de daño, accesorios y parámetros de simulación.

### Actualiza Tu config.cpp de Data

Abre `MyFirstMod/Data/config.cpp` y agrega la clase del vehículo. Si ya tienes definiciones de ítems aquí del Capítulo 8.2, agrega la clase del vehículo dentro del bloque `CfgVehicles` existente.

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

        // --- Selecciones ocultas para retexturizado ---
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

        // --- Simulación (física y motor) ---
        class SimulationModule : SimulationModule
        {
            // Tipo de tracción: 0 = RWD, 1 = FWD, 2 = AWD
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

        // --- Zonas de Daño ---
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

### Campos Clave Explicados

| Campo | Propósito |
|-------|-----------|
| `scope = 2` | Hace que el vehículo sea generado. Usa `0` para clases base que nunca deberían aparecer directamente. |
| `displayName` | Nombre mostrado en herramientas de administrador y en el juego. Puedes usar referencias `$STR_` para localización. |
| `requiredAddons[]` | Debe incluir `"DZ_Vehicles_Wheeled"` para que la clase padre `OffroadHatchback` se cargue antes que tu clase. |
| `hiddenSelections[]` | Ranuras de textura en el modelo que deseas sobreescribir. Deben coincidir con las selecciones nombradas del modelo. |
| `SimulationModule` | Configuración de física y motor. Controla velocidad, torque, transmisión y frenado. |
| `DamageSystem` | Define las reservas de salud para cada parte del vehículo (motor, puertas, ventanas, carrocería). |

### Sobre la Clase Padre

```cpp
class OffroadHatchback;
```

Esta declaración adelantada le dice al analizador de config que `OffroadHatchback` existe en el DayZ vanilla. Tu vehículo luego hereda de ella, obteniendo el modelo completo del Niva, animaciones, geometría de física, puntos de anclaje y definiciones de proxy. Solo necesitas sobreescribir lo que quieras cambiar.

Otras clases padre de vehículos vanilla que podrías extender:

| Clase Padre | Vehículo |
|------------|----------|
| `OffroadHatchback` | Niva (hatchback de 4 asientos) |
| `CivilianSedan` | Olga (sedán de 4 asientos) |
| `Hatchback_02` | Golf/Gunter (hatchback de 4 asientos) |
| `Sedan_02` | Sarka 120 (sedán de 4 asientos) |
| `Offroad_02` | Humvee (todoterreno de 4 asientos) |
| `Truck_01_Base` | V3S (camión) |

### Sobre el SimulationModule

El `SimulationModule` controla cómo se conduce el vehículo. Parámetros clave:

| Parámetro | Efecto |
|-----------|--------|
| `drive` | `0` = tracción trasera, `1` = tracción delantera, `2` = tracción total |
| `torqueMax` | Torque máximo del motor en Nm. Mayor = más aceleración. El Niva vanilla es ~114. |
| `powerMax` | Caballos de fuerza máximos. Mayor = velocidad máxima más alta. El Niva vanilla es ~68. |
| `rpmRedline` | RPM de zona roja del motor. Más allá de esto, el motor rebota contra el limitador de revoluciones. |
| `ratios[]` | Relaciones de transmisión. Números más bajos = marchas más largas = mayor velocidad máxima pero aceleración más lenta. |
| `transmissionRatio` | Relación de la transmisión final. Actúa como multiplicador en todas las marchas. |

### Sobre las Zonas de Daño

Cada zona de daño tiene su propia reserva de salud. Cuando la salud de una zona llega a cero, ese componente queda arruinado:

| Zona | Efecto Cuando Se Arruina |
|------|--------------------------|
| `Engine` | El vehículo no puede arrancar |
| `FuelTank` | El combustible se fuga |
| `Front` / `Rear` | Daño visual, protección reducida |
| `Door_1_1` / `Door_2_1` | La puerta se cae |
| `WindowFront` | La ventana se rompe (afecta el aislamiento de sonido) |

El valor `transferToGlobalCoef` determina cuánto daño se transfiere desde esta zona a la salud global del vehículo. `1` significa 100% de transferencia (el daño al motor afecta la salud general), `0` significa sin transferencia.

Los `componentNames[]` deben coincidir con los componentes nombrados en el LOD de geometría del vehículo. Como heredamos el modelo del Niva, usamos nombres de marcador de posición aquí -- los componentes de geometría de la clase padre son los que realmente importan para la detección de colisiones. Si estás usando el modelo vanilla sin modificación, el mapeo de componentes del padre se aplica automáticamente.

---

## Paso 2: Texturas Personalizadas

### Cómo Funcionan las Selecciones Ocultas de Vehículos

Las selecciones ocultas de vehículos funcionan de la misma manera que las texturas de ítems, pero los vehículos típicamente tienen más ranuras de selección. El modelo del Offroad Hatchback usa selecciones para diferentes paneles de carrocería, permitiendo variantes de color (Blanco, Azul) en vanilla.

### Usando Texturas Vanilla (Inicio Más Rápido)

Para pruebas iniciales, apunta tus selecciones ocultas a texturas vanilla existentes. Esto confirma que tu config funciona antes de crear arte personalizado:

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

Las cadenas vacías `""` significan "usar la textura predeterminada del modelo para esta selección."

### Creando un Set de Texturas Personalizado

Para crear una apariencia única:

1. **Extrae la textura vanilla** usando Addon Builder de DayZ Tools o el drive P: para encontrar:
   ```
   P:\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa
   ```

2. **Convierte a formato editable** usando TexView2:
   - Abre el archivo `.paa` en TexView2
   - Exporta como `.tga` o `.png`

3. **Edita en tu editor de imágenes** (GIMP, Photoshop, Paint.NET):
   - Las texturas de vehículos típicamente son de **2048x2048** o **4096x4096**
   - Modifica colores, agrega calcomanías, franjas de carreras o efectos de óxido
   - Mantén intacto el diseño UV -- solo cambia colores y detalles

4. **Convierte de vuelta a `.paa`**:
   - Abre tu imagen editada en TexView2
   - Guarda en formato `.paa`
   - Guarda en `MyFirstMod/Data/Textures/rally_body_co.paa`

### Convenciones de Nomenclatura de Texturas para Vehículos

| Sufijo | Tipo | Propósito |
|--------|------|-----------|
| `_co` | Color (Difuso) | Color y apariencia principal |
| `_nohq` | Mapa Normal | Irregularidades de superficie, líneas de paneles, detalle de remaches |
| `_smdi` | Especular | Brillo metálico, reflejos de pintura |
| `_as` | Alfa/Superficie | Transparencia para ventanas |
| `_de` | Destrucción | Texturas de superposición de daño |

Para un primer mod de vehículo, solo se requiere la textura `_co`. El modelo usa sus mapas normales y especulares predeterminados.

### Materiales Coincidentes (Opcional)

Para control total del material, crea un archivo `.rvmat`:

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

## Paso 3: Comportamiento del Script (CarScript)

Las clases de script de vehículos controlan los sonidos del motor, la lógica de puertas, el comportamiento de entrada/salida de la tripulación y las animaciones de asientos. Como extendemos `OffroadHatchback`, heredamos todo el comportamiento vanilla y solo sobreescribimos lo que queremos personalizar.

### Crear el Archivo de Script

Crea la estructura de carpetas y el archivo de script:

```
MyFirstMod/
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_RallyHatchback.c
```

### Actualizar Scripts config.cpp

Tu `Scripts/config.cpp` debe registrar la capa `4_World` para que el motor cargue tu script:

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

### Escribir el Script del Vehículo

Crea `4_World/MyFirstMod/MFM_RallyHatchback.c`:

```c
class MFM_RallyHatchback extends OffroadHatchback
{
    void MFM_RallyHatchback()
    {
        // Sobreescribir sonidos del motor (reutilizar sonidos vanilla del Niva)
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

        // Posición del motor en espacio del modelo (x, y, z) -- se usa para
        // fuente de temperatura, detección de ahogamiento y efectos de partículas
        SetEnginePos("0 0.7 1.2");
    }

    // --- Instancia de Animación ---
    // Determina qué conjunto de animaciones del jugador se usa al entrar/salir.
    // Debe coincidir con el esqueleto del vehículo. Como usamos el modelo del Niva, mantener HATCHBACK.
    override int GetAnimInstance()
    {
        return VehicleAnimInstances.HATCHBACK;
    }

    // --- Distancia de Cámara ---
    // Qué tan lejos se ubica la cámara en tercera persona detrás del vehículo.
    // El Niva vanilla es 3.5. Aumentar para una vista más amplia.
    override float GetTransportCameraDistance()
    {
        return 4.0;
    }

    // --- Tipos de Animación de Asientos ---
    // Mapea cada índice de asiento a un tipo de animación del jugador.
    // 0 = conductor, 1 = copiloto, 2 = trasero izquierdo, 3 = trasero derecho.
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

    // --- Estado de la Puerta ---
    // Devuelve si una puerta está ausente, abierta o cerrada.
    // Los nombres de ranura (NivaDriverDoors, NivaCoDriverDoors, NivaHood, NivaTrunk)
    // están definidos por los proxies de ranura de inventario del modelo.
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

    // --- Entrada/Salida de Tripulación ---
    // Determina si un jugador puede entrar o salir de un asiento específico.
    // Verifica el estado de la puerta y la fase de animación de plegado del asiento.
    // Los asientos delanteros (0, 1) requieren que la puerta esté abierta.
    // Los asientos traseros (2, 3) requieren la puerta abierta Y el asiento delantero plegado hacia adelante.
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

    // --- Verificación del Capó para Accesorios ---
    // Evita que los jugadores retiren partes del motor cuando el capó está cerrado.
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

    // --- Acceso al Cargamento ---
    // El maletero debe estar abierto para acceder al cargamento del vehículo.
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

    // --- Acceso al Compartimento del Motor ---
    // El capó debe estar abierto para ver las ranuras de accesorios del motor.
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

    // --- Aparición de Debug ---
    // Se llama cuando se genera desde el menú de debug. Genera con todas las partes
    // adjuntas y fluidos llenos para pruebas inmediatas.
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

        // Ruedas de repuesto en el cargamento
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
    }
};
```

### Comprendiendo las Sobreescrituras Clave

**GetAnimInstance** -- Devuelve qué conjunto de animaciones usa el jugador al sentarse en el vehículo. Los valores del enum son:

| Valor | Constante | Tipo de Vehículo |
|-------|----------|-----------------|
| 0 | `CIVVAN` | Furgoneta |
| 1 | `V3S` | Camión V3S |
| 2 | `SEDAN` | Sedán Olga |
| 3 | `HATCHBACK` | Hatchback Niva |
| 5 | `S120` | Sarka 120 |
| 7 | `GOLF` | Gunter 2 |
| 8 | `HMMWV` | Humvee |

Si cambias esto al valor incorrecto, la animación del jugador atravesará el vehículo o se verá incorrecta. Siempre haz coincidir el modelo que estás usando.

**CrewCanGetThrough** -- Se llama cada frame para determinar si un jugador puede entrar o salir de un asiento. Los asientos traseros del Niva (índices 2 y 3) funcionan diferente a los delanteros: el respaldo del asiento delantero debe estar plegado hacia adelante (fase de animación > 0.5) antes de que los pasajeros traseros puedan pasar. Esto coincide con el comportamiento del mundo real de un hatchback de 2 puertas donde los pasajeros traseros deben inclinar el asiento delantero.

**OnDebugSpawn** -- Se llama cuando usas el menú de aparición de debug. `SpawnUniversalParts()` agrega bombillas de faros y una batería de auto. `FillUpCarFluids()` llena combustible, refrigerante, aceite y líquido de frenos al máximo. Luego creamos ruedas, puertas, capó y maletero. Esto te da un vehículo inmediatamente conducible para pruebas.

---

## Paso 4: Entrada en types.xml

### Configuración de Aparición del Vehículo

Los vehículos en `types.xml` usan el mismo formato que los ítems, pero con algunas diferencias importantes. Agrega esto al `types.xml` de tu servidor:

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

### Diferencias entre Vehículos e Ítems en types.xml

| Configuración | Ítems | Vehículos |
|---------------|-------|-----------|
| `nominal` | 10-50+ | 1-5 (los vehículos son raros) |
| `lifetime` | 3600-14400 | 3888000 (45 días -- los vehículos persisten mucho tiempo) |
| `restock` | 1800 | 0 (los vehículos no se reabastecen automáticamente; solo reaparecen después de que el anterior sea destruido y desaparezca) |
| `category` | `tools`, `weapons`, etc. | `vehicles` |

### Partes Preinstaladas con cfgspawnabletypes.xml

Los vehículos aparecen como carcasas vacías por defecto -- sin ruedas, puertas ni partes del motor. Para que aparezcan con partes preinstaladas, agrega entradas a `cfgspawnabletypes.xml` en la carpeta de misión del servidor:

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

### Cómo Funciona cfgspawnabletypes

Cada bloque `<attachments>` se evalúa independientemente:
- La `chance` externa determina si este grupo de accesorios se considera en absoluto
- Cada `<item>` dentro tiene su propia `chance` de ser colocado
- Los ítems se colocan en la primera ranura coincidente disponible en el vehículo

Esto significa que un vehículo podría aparecer con 3 ruedas y sin puertas, o con todas las ruedas y una batería pero sin bujía. Esto crea el ciclo de juego de búsqueda -- los jugadores deben encontrar las partes faltantes.

---

## Paso 5: Compilar y Probar

### Empaquetar los PBOs

Necesitas dos PBOs para este mod:

```
@MyFirstMod/
    mod.cpp
    Addons/
        Scripts.pbo          <-- Contiene Scripts/config.cpp y 4_World/
        Data.pbo             <-- Contiene Data/config.cpp y Textures/
```

Usa Addon Builder de DayZ Tools:
1. **PBO de Scripts:** Fuente = `MyFirstMod/Scripts/`, Prefijo = `MyFirstMod/Scripts`
2. **PBO de Data:** Fuente = `MyFirstMod/Data/`, Prefijo = `MyFirstMod/Data`

O usa file patching durante el desarrollo:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

### Generar el Vehículo Usando la Consola de Script

1. Inicia DayZ con tu mod cargado
2. Únete a tu servidor o inicia en modo offline
3. Abre la consola de script
4. Para generar un vehículo completamente equipado cerca de tu personaje:

```c
EntityAI vehicle;
vector pos = GetGame().GetPlayer().GetPosition();
pos[2] = pos[2] + 5;
vehicle = EntityAI.Cast(GetGame().CreateObject("MFM_RallyHatchback", pos, false, false, true));
```

5. Presiona **Execute**

El vehículo debería aparecer 5 metros frente a ti.

### Generar un Vehículo Listo para Conducir

Para pruebas más rápidas, genera el vehículo y usa el método de aparición de debug que adjunta todas las partes:

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

Esto llama a tu sobreescritura de `OnDebugSpawn()`, que llena fluidos y adjunta ruedas, puertas, capó y maletero.

### Qué Probar

| Verificación | Qué Buscar |
|--------------|------------|
| **El vehículo aparece** | Aparece en el mundo sin errores en el log de script |
| **Texturas aplicadas** | El color de carrocería personalizado es visible (si se usan texturas personalizadas) |
| **El motor arranca** | Entra, mantén presionada la tecla de arranque del motor. Escucha el sonido de arranque. |
| **Conducción** | Aceleración, velocidad máxima, manejo se sienten diferentes al vanilla |
| **Puertas** | Se pueden abrir/cerrar las puertas del conductor y copiloto |
| **Capó/Maletero** | Se puede abrir el capó para acceder a las partes del motor. Se puede abrir el maletero para el cargamento. |
| **Asientos traseros** | Plegar el asiento delantero, luego entrar al asiento trasero |
| **Consumo de combustible** | Conduce y observa el indicador de combustible |
| **Daño** | Dispara al vehículo. Las partes deberían recibir daño y eventualmente romperse. |
| **Luces** | Los faros delanteros y las luces traseras funcionan de noche |

### Leyendo el Log de Script

Si el vehículo no aparece o se comporta incorrectamente, revisa el log de script en:

```
%localappdata%\DayZ\<TuPerfil>\script.log
```

Errores comunes:

| Mensaje del Log | Causa |
|-----------------|-------|
| `Cannot create object type MFM_RallyHatchback` | El nombre de clase en config.cpp no coincide o el PBO de Data no está cargado |
| `Undefined variable 'OffroadHatchback'` | Falta `"DZ_Vehicles_Wheeled"` en `requiredAddons` |
| `Member not found` en llamada a método | Error tipográfico en el nombre del método sobreescrito |

---

## Paso 6: Pulir

### Sonido de Bocina Personalizado

Para darle a tu vehículo una bocina única, define sets de sonido personalizados en tu Data config.cpp:

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

Luego referéncialos en el constructor de tu script:

```c
m_CarHornShortSoundName = "MFM_RallyHornShort_SoundSet";
m_CarHornLongSoundName  = "MFM_RallyHorn_SoundSet";
```

Los archivos de sonido deben estar en formato `.ogg`. La ruta en `samples[]` NO incluye la extensión del archivo.

### Faros Personalizados

Puedes crear una clase de luz personalizada para cambiar el brillo, color o alcance de los faros:

```c
class MFM_RallyFrontLight extends CarLightBase
{
    void MFM_RallyFrontLight()
    {
        // Luz baja (segregada)
        m_SegregatedBrightness = 7;
        m_SegregatedRadius = 65;
        m_SegregatedAngle = 110;
        m_SegregatedColorRGB = Vector(0.9, 0.9, 1.0);

        // Luz alta (agregada)
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

Sobreescribe en tu clase de vehículo:

```c
override CarLightBase CreateFrontLight()
{
    return CarLightBase.Cast(ScriptedLightBase.CreateLight(MFM_RallyFrontLight));
}
```

### Aislamiento de Sonido (OnSound)

La sobreescritura de `OnSound` controla cuánto amortigua la cabina el ruido del motor según el estado de puertas y ventanas:

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

Un valor de `1.0` significa aislamiento completo (cabina silenciosa), `0.0` significa sin aislamiento (sensación al aire libre).

---

## Referencia Completa del Código

### Estructura Final del Directorio

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
            rally_horn.ogg           (opcional)
            rally_horn_short.ogg     (opcional)
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

### Entrada en types.xml de la Misión del Servidor

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

### Entrada en cfgspawnabletypes.xml de la Misión del Servidor

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

## Mejores Prácticas

- **Siempre extiende una clase de vehículo existente.** Crear un vehículo desde cero requiere un modelo 3D personalizado con LODs de geometría correctos, proxies, puntos de memoria y una configuración de simulación física. Extender un vehículo vanilla te da todo esto gratis.
- **Prueba con `OnDebugSpawn()` primero.** Antes de configurar types.xml y cfgspawnabletypes.xml, verifica que el vehículo funcione generándolo completamente equipado a través del menú de debug o la consola de script.
- **Mantén el mismo `GetAnimInstance()` que el padre.** Si cambias esto sin un conjunto de animaciones coincidente, los jugadores se quedarán en T-pose o atravesarán el vehículo.
- **No cambies los nombres de ranura de puertas.** El Niva usa `NivaDriverDoors`, `NivaCoDriverDoors`, `NivaHood`, `NivaTrunk`. Estos están vinculados a los nombres de proxy del modelo y las definiciones de ranura de inventario. Cambiarlos sin cambiar el modelo romperá la funcionalidad de las puertas.
- **Usa `scope = 0` para clases base internas.** Si creas un vehículo base abstracto del que otras variantes extienden, establece `scope = 0` para que nunca aparezca directamente.
- **Establece `requiredAddons` correctamente.** Tu config.cpp de Data debe listar `"DZ_Vehicles_Wheeled"` para que la clase padre `OffroadHatchback` se cargue antes que la tuya.
- **Prueba la lógica de puertas exhaustivamente.** Entra/sal de cada asiento, abre/cierra cada puerta, intenta acceder al compartimento del motor con el capó cerrado. Los bugs de CrewCanGetThrough son el problema más común de mods de vehículos.

---

## Teoría vs Práctica

| Concepto | Teoría | Realidad |
|----------|--------|----------|
| `SimulationModule` en config.cpp | Control total sobre la física del vehículo | No todos los parámetros se sobreescriben correctamente al extender una clase padre. Si tus cambios de velocidad/torque parecen no tener efecto, intenta ajustar `transmissionRatio` y `ratios[]` de las marchas en lugar de solo `torqueMax`. |
| Zonas de daño con `componentNames[]` | Cada zona se mapea a un componente de geometría | Al extender un vehículo vanilla, los nombres de componentes del modelo padre ya están establecidos. Tus valores de `componentNames[]` en config solo importan si proporcionas un modelo personalizado. El LOD de geometría del padre determina la detección de impactos real. |
| Texturas personalizadas vía selecciones ocultas | Intercambia cualquier textura libremente | Solo las selecciones que el autor del modelo marcó como "ocultas" se pueden sobreescribir. Si necesitas retexturizar una parte que no está en `hiddenSelections[]`, debes crear un nuevo modelo o modificar el existente en Object Builder. |
| Partes preinstaladas en `cfgspawnabletypes.xml` | Los ítems se adjuntan a las ranuras coincidentes | Si una clase de rueda es incompatible con el vehículo (ranura de adjunto incorrecta), falla silenciosamente. Siempre usa partes que el vehículo padre acepte -- para el Niva, eso significa `HatchbackWheel`, no `CivSedanWheel`. |
| Sonidos del motor | Establece cualquier nombre de SoundSet | Los sets de sonido deben estar definidos en `CfgSoundSets` en algún lugar de las configuraciones cargadas. Si referencias un set de sonido que no existe, el motor recurre silenciosamente a no tener sonido -- no hay error en el log. |

---

## Lo Que Aprendiste

En este tutorial aprendiste:

- Cómo definir una clase de vehículo personalizado extendiendo un vehículo vanilla existente en config.cpp
- Cómo funcionan las zonas de daño y cómo configurar los valores de salud para cada componente del vehículo
- Cómo las selecciones ocultas del vehículo permiten retexturizar la carrocería sin un modelo 3D personalizado
- Cómo escribir un script de vehículo con lógica de estado de puertas, verificaciones de entrada de tripulación y comportamiento del motor
- Cómo `types.xml` y `cfgspawnabletypes.xml` trabajan juntos para la aparición de vehículos con partes preinstaladas aleatorias
- Cómo probar vehículos en el juego usando la consola de script y el método `OnDebugSpawn()`
- Cómo agregar sonidos personalizados para bocinas y clases de luz personalizadas para faros

**Siguiente:** Expande tu mod de vehículo con modelos de puertas personalizados, texturas de interior, o incluso una carrocería de vehículo completamente nueva usando Blender y Object Builder.

---

## Errores Comunes

### El Vehículo Aparece Pero Inmediatamente Cae a Través del Suelo

La geometría de física no se está cargando. Esto generalmente significa que falta `"DZ_Vehicles_Wheeled"` en `requiredAddons[]`, por lo que la configuración de física de la clase padre no se hereda.

### El Vehículo Aparece Pero No Se Puede Entrar

Verifica que `GetAnimInstance()` devuelva el valor de enum correcto para tu modelo. Si extiendes `OffroadHatchback` pero devuelves `VehicleAnimInstances.SEDAN`, la animación de entrada apunta a las posiciones de puerta incorrectas y el jugador no puede entrar.

### Las Puertas No Se Abren ni Se Cierran

Verifica que `GetCarDoorsState()` use los nombres de ranura correctos. El Niva usa `"NivaDriverDoors"`, `"NivaCoDriverDoors"`, `"NivaHood"` y `"NivaTrunk"`. Estos deben coincidir exactamente, incluyendo las mayúsculas.

### El Motor Arranca Pero el Vehículo No Se Mueve

Verifica las relaciones de transmisión de tu `SimulationModule`. Si `ratios[]` está vacío o tiene valores de cero, el vehículo no tiene marchas hacia adelante. También verifica que las ruedas estén adjuntas -- un vehículo sin ruedas acelerará pero no se moverá.

### El Vehículo No Tiene Sonido

Los sonidos del motor se asignan en el constructor. Si escribes mal un nombre de SoundSet (por ejemplo `"offroad_engine_Start_SoundSet"` en lugar de `"offroad_engine_start_SoundSet"`), el motor silenciosamente usa ningún sonido. Los nombres de sets de sonido distinguen mayúsculas de minúsculas.

### La Textura Personalizada No Se Muestra

Verifica tres cosas en orden: (1) el nombre de selección oculta coincide exactamente con el modelo, (2) la ruta de textura usa barras invertidas en config.cpp, y (3) el archivo `.paa` está dentro del PBO empaquetado. Si usas file patching durante el desarrollo, asegúrate de que la ruta comience desde la raíz del mod, no una ruta absoluta.

### Los Pasajeros del Asiento Trasero No Pueden Entrar

Los asientos traseros del Niva requieren que el asiento delantero esté plegado hacia adelante. Si tu sobreescritura de `CrewCanGetThrough()` para los índices de asiento 2 y 3 no verifica `GetAnimationPhase("SeatDriver")` y `GetAnimationPhase("SeatCoDriver")`, los pasajeros traseros quedarán permanentemente bloqueados.

### El Vehículo Aparece Sin Partes en Multijugador

`OnDebugSpawn()` es solo para debug/pruebas. En un servidor real, las partes vienen de `cfgspawnabletypes.xml`. Si tu vehículo aparece como una carcasa vacía, agrega la entrada de `cfgspawnabletypes.xml` descrita en el Paso 4.

---

**Anterior:** [Capítulo 8.9: Plantilla Profesional de Mod](09-professional-template.md)
