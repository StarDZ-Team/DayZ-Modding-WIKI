# Chapter 6.2: Vehicle System

[Home](../README.md) | [<< Previous: Entity System](01-entity-system.md) | **Vehicles** | [Next: Weather >>](03-weather.md)

---

## Introdução

Veículos no DayZ são entidades que estendem o sistema de transporte. Carros estendem `CarScript`, barcos estendem `BoatScript`, e ambos herdam de `Transport`. Veículos possuem sistemas de fluidos, peças com vida independente, simulação de marchas e física gerenciada pela engine. Este capítulo cobre os métodos da API que você precisa para interagir com veículos em scripts.

---

## Hierarquia de Classes

```
EntityAI
└── Transport                    // 3_Game - base para todos os veículos
    ├── Car                      // 3_Game - física nativa de carro da engine
    │   └── CarScript            // 4_World - base scriptável de carro
    │       ├── CivilianSedan
    │       ├── OffroadHatchback
    │       ├── Hatchback_02
    │       ├── Sedan_02
    │       ├── Truck_01_Base
    │       └── ...
    └── Boat                     // 3_Game - física nativa de barco da engine
        └── BoatScript           // 4_World - base scriptável de barco
```

---

## Transport (Base)

**Arquivo:** `3_Game/entities/transport.c`

A base abstrata para todos os veículos. Fornece gerenciamento de assentos e acesso à tripulação.

### Gerenciamento de Tripulação

```c
proto native int   CrewSize();                          // Número total de assentos
proto native int   CrewMemberIndex(Human crew_member);  // Obter índice do assento de um humano
proto native Human CrewMember(int posIdx);              // Obter humano no índice do assento
proto native void  CrewGetOut(int posIdx);              // Forçar membro da tripulação a sair
proto native void  CrewDeath(int posIdx);               // Matar membro no assento
```

### Entrada da Tripulação

```c
proto native int  GetAnimInstance();
proto native int  CrewPositionIndex(int componentIdx);  // Componente para índice do assento
proto native vector CrewEntryPoint(int posIdx);         // Posição de entrada no mundo para o assento
```

**Exemplo --- ejetar todos os passageiros:**

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

## Car (Nativo da Engine)

**Arquivo:** `3_Game/entities/car.c`

Física de carro em nível de engine. Todos são métodos `proto native` que controlam a simulação do veículo.

### Motor

```c
proto native bool  EngineIsOn();
proto native void  EngineStart();
proto native void  EngineStop();
proto native float EngineGetRPM();
proto native float EngineGetRPMRedline();
proto native float EngineGetRPMMax();
proto native int   GetGear();
```

### Fluidos

Veículos DayZ possuem quatro tipos de fluido definidos no enum `CarFluid`:

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

**Exemplo --- reabastecer um veículo:**

```c
void RefuelVehicle(Car car)
{
    float capacity = car.GetFluidCapacity(CarFluid.FUEL);
    float current = car.GetFluidFraction(CarFluid.FUEL) * capacity;
    float needed = capacity - current;
    car.Fill(CarFluid.FUEL, needed);
}
```

### Velocidade

```c
proto native float GetSpeedometer();    // Velocidade em km/h (valor absoluto)
```

### Controles (Simulação)

```c
proto native void  SetBrake(float value, int wheel = -1);    // 0.0 - 1.0, -1 = todas as rodas
proto native void  SetHandbrake(float value);                 // 0.0 - 1.0
proto native void  SetSteering(float value, bool analog = true);
proto native void  SetThrust(float value, int wheel = -1);    // 0.0 - 1.0
proto native void  SetClutchState(bool engaged);
```

### Rodas

```c
proto native int   WheelCount();
proto native bool  WheelIsAnyLocked();
proto native float WheelGetSurface(int wheelIdx);
```

### Callbacks (Sobrescreva em CarScript)

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

**Arquivo:** `4_World/entities/vehicles/carscript.c`

A classe de carro scriptável que a maioria dos mods de veículos estende. Adiciona peças, portas, luzes e gerenciamento de som.

### Vida das Peças

CarScript usa zonas de dano para representar peças do veículo. Cada peça pode ser danificada independentemente:

```c
// Verificar vida da peça via API padrão do EntityAI
float engineHP = car.GetHealth("Engine", "Health");
float fuelTankHP = car.GetHealth("FuelTank", "Health");

// Definir vida da peça
car.SetHealth("Engine", "Health", 0);       // Destruir o motor
car.SetHealth("FuelTank", "Health", 100);   // Reparar o tanque de combustível
```

Zonas de dano comuns para veículos:

| Zona | Descrição |
|------|-------------|
| `""` (global) | Vida geral do veículo |
| `"Engine"` | Peça do motor |
| `"FuelTank"` | Tanque de combustível |
| `"Radiator"` | Radiador (refrigerante) |
| `"Battery"` | Batéria |
| `"SparkPlug"` | Vela de ignição |
| `"FrontLeft"` / `"FrontRight"` | Rodas dianteiras |
| `"RearLeft"` / `"RearRight"` | Rodas traseiras |
| `"DriverDoor"` / `"CoDriverDoor"` | Portas dianteiras |
| `"Hood"` / `"Trunk"` | Capô e porta-malas |

### Luzes

```c
void SetLightsState(int state);   // 0 = desligado, 1 = ligado
int  GetLightsState();
```

### Controle de Portas

```c
bool IsDoorOpen(string doorSource);
void OpenDoor(string doorSource);
void CloseDoor(string doorSource);
```

### Sobrescritas Importantes para Veículos Personalizados

```c
override void EEInit();                    // Inicializar peças do veículo, fluidos
override void OnEngineStart();             // Comportamento personalizado ao ligar motor
override void OnEngineStop();              // Comportamento personalizado ao desligar motor
override void EOnSimulate(IEntity other, float dt);  // Simulação por tick
override bool CanObjectAttachWeapon(string slot_name);
```

**Exemplo --- criar um veículo com fluidos cheios:**

```c
void SpawnReadyVehicle(vector pos)
{
    Car car = Car.Cast(GetGame().CreateObjectEx("CivilianSedan", pos,
                        ECE_PLACE_ON_SURFACE | ECE_INITAI | ECE_CREATEPHYSICS));
    if (!car)
        return;

    // Encher todos os fluidos
    car.Fill(CarFluid.FUEL, car.GetFluidCapacity(CarFluid.FUEL));
    car.Fill(CarFluid.OIL, car.GetFluidCapacity(CarFluid.OIL));
    car.Fill(CarFluid.BRAKE, car.GetFluidCapacity(CarFluid.BRAKE));
    car.Fill(CarFluid.COOLANT, car.GetFluidCapacity(CarFluid.COOLANT));

    // Spawnar peças necessárias
    EntityAI carEntity = EntityAI.Cast(car);
    carEntity.GetInventory().CreateAttachment("CarBattery");
    carEntity.GetInventory().CreateAttachment("SparkPlug");
    carEntity.GetInventory().CreateAttachment("CarRadiator");
    carEntity.GetInventory().CreateAttachment("HatchbackWheel");
}
```

---

## BoatScript

**Arquivo:** `4_World/entities/vehicles/boatscript.c`

Base scriptável para entidades de barco. API similar ao CarScript mas com física baseada em hélice.

### Motor e Propulsão

```c
proto native bool  EngineIsOn();
proto native void  EngineStart();
proto native void  EngineStop();
proto native float EngineGetRPM();
```

### Fluidos

Barcos usam o mesmo enum `CarFluid` mas típicamente só usam `FUEL`:

```c
float fuel = boat.GetFluidFraction(CarFluid.FUEL);
boat.Fill(CarFluid.FUEL, boat.GetFluidCapacity(CarFluid.FUEL));
```

### Velocidade

```c
proto native float GetSpeedometer();   // Velocidade em km/h
```

**Exemplo --- spawnar um barco:**

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

## Verificações de Interação com Veículos

### Verificando se um Jogador Está em um Veículo

```c
PlayerBase player;
if (player.IsInVehicle())
{
    EntityAI vehicle = player.GetDrivingVehicle();
    CarScript car;
    if (Class.CastTo(car, vehicle))
    {
        float speed = car.GetSpeedometer();
        Print(string.Format("Dirigindo a %1 km/h", speed));
    }
}
```

### Encontrando Todos os Veículos no Mundo

```c
void FindAllVehicles(out array<Transport> vehicles)
{
    vehicles = new array<Transport>;
    array<Object> objects = new array<Object>;
    array<CargoBase> proxyCargos = new array<CargoBase>;

    // Usar um raio grande a partir do centro do mapa
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

## Resumo

| Conceito | Ponto-chave |
|---------|-----------|
| Hierarquia | `Transport` > `Car`/`Boat` > `CarScript`/`BoatScript` |
| Motor | `EngineStart()`, `EngineStop()`, `EngineIsOn()`, `EngineGetRPM()` |
| Fluidos | enum `CarFluid`: `FUEL`, `OIL`, `BRAKE`, `COOLANT` |
| Encher/Vazar | `Fill(fluid, amount)`, `Leak(fluid, amount)`, `GetFluidFraction(fluid)` |
| Velocidade | `GetSpeedometer()` retorna km/h |
| Tripulação | `CrewSize()`, `CrewMember(idx)`, `CrewGetOut(idx)` |
| Peças | Zonas de dano padrão: `"Engine"`, `"FuelTank"`, `"Radiator"`, etc. |
| Criação | `CreateObjectEx` com `ECE_PLACE_ON_SURFACE \| ECE_INITAI \| ECE_CREATEPHYSICS` |

---

[<< Anterior: Sistema de Entidades](01-entity-system.md) | **Veículos** | [Próximo: Clima >>](03-weather.md)
