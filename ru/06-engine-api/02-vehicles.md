# Chapter 6.2: Vehicle System

[<< Предыдущая: Entity System](01-entity-system.md) | **Vehicles** | [Следующая: Weather >>](03-weather.md)

---

## Введение


DayZ vehicles are entities that extend the transport system. Cars extend `CarScript`, boats extend `BoatScript`, and both inherit from `Transport`. Vehicles have fluid systems, parts with independent health, gear simulation, and physics managed by the engine. Эта глава охватывает the API methods you need to interact with vehicles in scripts.

---

## Class Hierarchy

```
EntityAI
└── Transport                    // 3_Game - base for all vehicles
    ├── Car                      // 3_Game - engine-native car physics
    │   └── CarScript            // 4_World - scriptable car base
    │       ├── CivilianSedan
    │       ├── OffroadHatchback
    │       ├── Hatchback_02
    │       ├── Sedan_02
    │       ├── Truck_01_Base
    │       └── ...
    └── Boat                     // 3_Game - engine-native boat physics
        └── BoatScript           // 4_World - scriptable boat base
```

---

## Transport (Base)

**File:** `3_Game/entities/transport.c`

The abstract base for all vehicles. Provides seat management and crew access.

### Crew Management

```c
proto native int   CrewSize();                          // Total number of seats
proto native int   CrewMemberIndex(Human crew_member);  // Get seat index of a human
proto native Human CrewMember(int posIdx);              // Get human at seat index
proto native void  CrewGetOut(int posIdx);              // Force crew member out of seat
proto native void  CrewDeath(int posIdx);               // Kill crew member in seat
```

### Crew Entry

```c
proto native int  GetAnimInstance();
proto native int  CrewPositionIndex(int componentIdx);  // Component to seat index
proto native vector CrewEntryPoint(int posIdx);         // World entry position for seat
```

**Example --- eject all passengers:**

```c
void EjectAllCrew(Transport vehicle)
{
    for (int i = 0; i < vehicle.CrewSize(); i++)
    {
        Human crew = vehicle.CrewMember(i);
        if (crew)
        {
            vehicle.CrewGetOut(i);
        }
    }
}
```

---

## Car (Engine Native)

**File:** `3_Game/entities/car.c`

Engine-level car physics. All `proto native` methods that drive the vehicle simulation.

### Engine

```c
proto native bool  EngineIsOn();
proto native void  EngineStart();
proto native void  EngineStop();
proto native float EngineGetRPM();
proto native float EngineGetRPMRedline();
proto native float EngineGetRPMMax();
proto native int   GetGear();
```

### Fluids

DayZ vehicles have four fluid types defined in the `CarFluid` enum:

```c
enum CarFluid
{
    FUEL,
    OIL,
    BRAKE,
    COOLANT
}
```

```c
proto native float GetFluidCapacity(CarFluid fluid);
proto native float GetFluidFraction(CarFluid fluid);     // 0.0 - 1.0
proto native void  Fill(CarFluid fluid, float amount);
proto native void  Leak(CarFluid fluid, float amount);
proto native void  LeakAll(CarFluid fluid);
```

**Example --- refuel a vehicle:**

```c
void RefuelVehicle(Car car)
{
    float capacity = car.GetFluidCapacity(CarFluid.FUEL);
    float current = car.GetFluidFraction(CarFluid.FUEL) * capacity;
    float needed = capacity - current;
    car.Fill(CarFluid.FUEL, needed);
}
```

### Speed

```c
proto native float GetSpeedometer();    // Speed in km/h (absolute value)
```

### Controls (Simulation)

```c
proto native void  SetBrake(float value, int wheel = -1);    // 0.0 - 1.0, -1 = all wheels
proto native void  SetHandbrake(float value);                 // 0.0 - 1.0
proto native void  SetSteering(float value, bool analog = true);
proto native void  SetThrust(float value, int wheel = -1);    // 0.0 - 1.0
proto native void  SetClutchState(bool engaged);
```

### Wheels

```c
proto native int   WheelCount();
proto native bool  WheelIsAnyLocked();
proto native float WheelGetSurface(int wheelIdx);
```

### Callbacks (Override in CarScript)

```c
void OnEngineStart();
void OnEngineStop();
void OnContact(string zoneName, vector localPos, IEntity other, Contact data);
void OnFluidChanged(CarFluid fluid, float newValue, float oldValue);
void OnGearChanged(int newGear, int oldGear);
void OnSound(CarSoundCtrl ctrl, float oldValue);
```

---

## CarScript


**File:** `4_World/entities/vehicles/carscript.c`

The scriptable car class that most vehicle mods extend. Adds parts, doors, lights, and sound management.

### Part Health

CarScript uses damage zones to represent vehicle parts. Each part can be independently damaged:

```c
// Check part health via the standard EntityAI API
float engineHP = car.GetHealth("Engine", "Health");
float fuelTankHP = car.GetHealth("FuelTank", "Health");

// Set part health
car.SetHealth("Engine", "Health", 0);       // Destroy the engine
car.SetHealth("FuelTank", "Health", 100);   // Repair the fuel tank
```

Common damage zones for vehicles:

| Zone | Description |
|------|-------------|
| `""` (global) | Overall vehicle health |
| `"Engine"` | Engine part |
| `"FuelTank"` | Fuel tank |
| `"Radiator"` | Radiator (coolant) |
| `"Battery"` | Battery |
| `"SparkPlug"` | Spark plug |
| `"FrontLeft"` / `"FrontRight"` | Front wheels |
| `"RearLeft"` / `"RearRight"` | Rear wheels |
| `"DriverDoor"` / `"CoDriverDoor"` | Front doors |
| `"Hood"` / `"Trunk"` | Hood and trunk |

### Lights

```c
void SetLightsState(int state);   // 0 = off, 1 = on
int  GetLightsState();
```

### Door Control

```c
bool IsDoorOpen(string doorSource);
void OpenDoor(string doorSource);
void CloseDoor(string doorSource);
```

### Key Overrides for Custom Vehicles

```c
override void EEInit();                    // Initialize vehicle parts, fluids
override void OnEngineStart();             // Custom engine start behavior
override void OnEngineStop();              // Custom engine stop behavior
override void EOnSimulate(IEntity other, float dt);  // Per-tick simulation
override bool CanObjectAttachWeapon(string slot_name);
```

**Example --- create a vehicle with full fluids:**

```c
void SpawnReadyVehicle(vector pos)
{
    Car car = Car.Cast(GetGame().CreateObjectEx("CivilianSedan", pos,
                        ECE_PLACE_ON_SURFACE | ECE_INITAI | ECE_CREATEPHYSICS));
    if (!car)
        return;

    // Fill all fluids
    car.Fill(CarFluid.FUEL, car.GetFluidCapacity(CarFluid.FUEL));
    car.Fill(CarFluid.OIL, car.GetFluidCapacity(CarFluid.OIL));
    car.Fill(CarFluid.BRAKE, car.GetFluidCapacity(CarFluid.BRAKE));
    car.Fill(CarFluid.COOLANT, car.GetFluidCapacity(CarFluid.COOLANT));

    // Spawn required parts
    EntityAI carEntity = EntityAI.Cast(car);
    carEntity.GetInventory().CreateAttachment("CarBattery");
    carEntity.GetInventory().CreateAttachment("SparkPlug");
    carEntity.GetInventory().CreateAttachment("CarRadiator");
    carEntity.GetInventory().CreateAttachment("HatchbackWheel");
}
```

---

## BoatScript

**File:** `4_World/entities/vehicles/boatscript.c`

Scriptable base for boat entities. Similar API to CarScript but with propeller-based physics.

### Engine & Propulsion

```c
proto native bool  EngineIsOn();
proto native void  EngineStart();
proto native void  EngineStop();
proto native float EngineGetRPM();
```

### Fluids

Boats use the same `CarFluid` enum but typically only use `FUEL`:

```c
float fuel = boat.GetFluidFraction(CarFluid.FUEL);
boat.Fill(CarFluid.FUEL, boat.GetFluidCapacity(CarFluid.FUEL));
```

### Speed

```c
proto native float GetSpeedometer();   // Speed in km/h
```

**Example --- spawn a boat:**

```c
void SpawnBoat(vector waterPos)
{
    BoatScript boat = BoatScript.Cast(
        GetGame().CreateObjectEx("Boat_01", waterPos,
                                  ECE_CREATEPHYSICS | ECE_INITAI)
    );
    if (boat)
    {
        boat.Fill(CarFluid.FUEL, boat.GetFluidCapacity(CarFluid.FUEL));
    }
}
```

---

## Vehicle Interaction Checks

### Checking if a Player is in a Vehicle

```c
PlayerBase player;
if (player.IsInVehicle())
{
    EntityAI vehicle = player.GetDrivingVehicle();
    CarScript car;
    if (Class.CastTo(car, vehicle))
    {
        float speed = car.GetSpeedometer();
        Print(string.Format("Driving at %1 km/h", speed));
    }
}
```

### Поиск всех транспортных средств в мире


```c
void FindAllVehicles(out array<Transport> vehicles)
{
    vehicles = new array<Transport>;
    array<Object> objects = new array<Object>;
    array<CargoBase> proxyCargos = new array<CargoBase>;

    // Use a large radius from center of map
    GetGame().GetObjectsAtPosition(Vector(7500, 0, 7500), 15000, objects, proxyCargos);

    foreach (Object obj : objects)
    {
        Transport transport;
        if (Class.CastTo(transport, obj))
        {
            vehicles.Insert(transport);
        }
    }
}
```

---

## Итоги


| Concept | Key Point |
|---------|-----------|
| Hierarchy | `Transport` > `Car`/`Boat` > `CarScript`/`BoatScript` |
| Engine | `EngineStart()`, `EngineОстановить()`, `EngineIsOn()`, `EngineGetRPM()` |
| Fluids | `CarFluid` enum: `FUEL`, `OIL`, `BRAKE`, `COOLANT` |
| Fill/Leak | `Fill(fluid, amount)`, `Leak(fluid, amount)`, `GetFluidFraction(fluid)` |
| Speed | `GetSpeedometer()` returns km/h |
| Crew | `CrewSize()`, `CrewMember(idx)`, `CrewGetOut(idx)` |
| Parts | Standard damage zones: `"Engine"`, `"FuelTank"`, `"Radiator"`, etc. |
| Creation | `CreateObjectEx` with `ECE_PLACE_ON_SURFACE \| ECE_INITAI \| ECE_CREATEPHYSICS` |

---

[<< Предыдущая: Entity System](01-entity-system.md) | **Vehicles** | [Следующая: Weather >>](03-weather.md)
