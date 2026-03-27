# Chapitre 6.2 : Systeme de vehicules

[Accueil](../README.md) | [<< Precedent : Systeme d'entites](01-entity-system.md) | **Vehicules** | [Suivant : Meteo >>](03-weather.md)

---

## Introduction

Les vehicules DayZ sont des entites qui etendent le systeme de transport. Les voitures etendent `CarScript`, les bateaux etendent `BoatScript`, et les deux heritent de `Transport`. Les vehicules disposent de systemes de fluides, de pieces avec une sante independante, d'une simulation de vitesses et d'une physique geree par le moteur. Ce chapitre couvre les methodes API dont vous avez besoin pour interagir avec les vehicules en script.

---

## Hierarchie de classes

```
EntityAI
└── Transport                    // 3_Game - base pour tous les vehicules
    ├── Car                      // 3_Game - physique native de voiture du moteur
    │   └── CarScript            // 4_World - base de voiture scriptable
    │       ├── CivilianSedan
    │       ├── OffroadHatchback
    │       ├── Hatchback_02
    │       ├── Sedan_02
    │       ├── Truck_01_Base
    │       └── ...
    └── Boat                     // 3_Game - physique native de bateau du moteur
        └── BoatScript           // 4_World - base de bateau scriptable
```

---

## Transport (base)

**Fichier :** `3_Game/entities/transport.c`

La base abstraite pour tous les vehicules. Fournit la gestion des sieges et l'acces a l'equipage.

### Gestion de l'equipage

```c
proto native int   CrewSize();                          // Nombre total de sieges
proto native int   CrewMemberIndex(Human crew_member);  // Obtenir l'indice de siege d'un humain
proto native Human CrewMember(int posIdx);              // Obtenir l'humain a l'indice de siege
proto native void  CrewGetOut(int posIdx);              // Forcer un membre d'equipage a sortir
proto native void  CrewDeath(int posIdx);               // Tuer le membre d'equipage au siege
```

### Entree de l'equipage

```c
proto native int  GetAnimInstance();
proto native int  CrewPositionIndex(int componentIdx);  // Composant vers indice de siege
proto native vector CrewEntryPoint(int posIdx);         // Position d'entree monde pour un siege
```

**Exemple -- ejecter tous les passagers :**

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

## Car (natif du moteur)

**Fichier :** `3_Game/entities/car.c`

Physique de voiture au niveau du moteur. Toutes les methodes `proto native` qui pilotent la simulation du vehicule.

### Moteur

```c
proto native bool  EngineIsOn();
proto native void  EngineStart();
proto native void  EngineStop();
proto native float EngineGetRPM();
proto native float EngineGetRPMRedline();
proto native float EngineGetRPMMax();
proto native int   GetGear();
```

### Fluides

Les vehicules DayZ ont quatre types de fluides definis dans l'enumeration `CarFluid` :

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

**Exemple -- faire le plein d'un vehicule :**

```c
void RefuelVehicle(Car car)
{
    float capacity = car.GetFluidCapacity(CarFluid.FUEL);
    float current = car.GetFluidFraction(CarFluid.FUEL) * capacity;
    float needed = capacity - current;
    car.Fill(CarFluid.FUEL, needed);
}
```

### Vitesse

```c
proto native float GetSpeedometer();    // Vitesse en km/h (valeur absolue)
```

### Controles (simulation)

```c
proto native void  SetBrake(float value, int wheel = -1);    // 0.0 - 1.0, -1 = toutes les roues
proto native void  SetHandbrake(float value);                 // 0.0 - 1.0
proto native void  SetSteering(float value, bool analog = true);
proto native void  SetThrust(float value, int wheel = -1);    // 0.0 - 1.0
proto native void  SetClutchState(bool engaged);
```

### Roues

```c
proto native int   WheelCount();
proto native bool  WheelIsAnyLocked();
proto native float WheelGetSurface(int wheelIdx);
```

### Callbacks (a redefinir dans CarScript)

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

**Fichier :** `4_World/entities/vehicles/carscript.c`

La classe de voiture scriptable que la plupart des mods de vehicules etendent. Ajoute la gestion des pieces, des portes, des feux et du son.

### Sante des pieces

CarScript utilise des zones de degats pour representer les pieces du vehicule. Chaque piece peut etre endommagee independamment :

```c
// Verifier la sante d'une piece via l'API standard EntityAI
float engineHP = car.GetHealth("Engine", "Health");
float fuelTankHP = car.GetHealth("FuelTank", "Health");

// Definir la sante d'une piece
car.SetHealth("Engine", "Health", 0);       // Detruire le moteur
car.SetHealth("FuelTank", "Health", 100);   // Reparer le reservoir
```

### Diagramme des zones de degats

```mermaid
graph TD
    V[Vehicule] --> E[Engine]
    V --> FT[FuelTank]
    V --> R[Radiator]
    V --> B[Battery]
    V --> W1[Wheel_1_1]
    V --> W2[Wheel_1_2]
    V --> W3[Wheel_2_1]
    V --> W4[Wheel_2_2]
    V --> D1[Door_1_1]
    V --> D2[Door_2_1]
    V --> H[Hood]
    V --> T[Trunk]

    style E fill:#ff6b6b,color:#fff
    style FT fill:#ffa07a,color:#fff
    style R fill:#87ceeb,color:#fff
```

Zones de degats courantes pour les vehicules :

| Zone | Description |
|------|-------------|
| `""` (globale) | Sante globale du vehicule |
| `"Engine"` | Piece moteur |
| `"FuelTank"` | Reservoir de carburant |
| `"Radiator"` | Radiateur (liquide de refroidissement) |
| `"Battery"` | Batterie |
| `"SparkPlug"` | Bougie d'allumage |
| `"FrontLeft"` / `"FrontRight"` | Roues avant |
| `"RearLeft"` / `"RearRight"` | Roues arriere |
| `"DriverDoor"` / `"CoDriverDoor"` | Portes avant |
| `"Hood"` / `"Trunk"` | Capot et coffre |

### Feux

```c
void SetLightsState(int state);   // 0 = eteints, 1 = allumes
int  GetLightsState();
```

### Controle des portes

```c
bool IsDoorOpen(string doorSource);
void OpenDoor(string doorSource);
void CloseDoor(string doorSource);
```

### Redefinitions cles pour les vehicules personnalises

```c
override void EEInit();                    // Initialiser pieces et fluides du vehicule
override void OnEngineStart();             // Comportement personnalise au demarrage
override void OnEngineStop();              // Comportement personnalise a l'arret
override void EOnSimulate(IEntity other, float dt);  // Simulation par tick
override bool CanObjectAttachWeapon(string slot_name);
```

**Exemple -- creer un vehicule avec tous les fluides pleins :**

```c
void SpawnReadyVehicle(vector pos)
{
    Car car = Car.Cast(GetGame().CreateObjectEx("CivilianSedan", pos,
                        ECE_PLACE_ON_SURFACE | ECE_INITAI | ECE_CREATEPHYSICS));
    if (!car)
        return;

    // Remplir tous les fluides
    car.Fill(CarFluid.FUEL, car.GetFluidCapacity(CarFluid.FUEL));
    car.Fill(CarFluid.OIL, car.GetFluidCapacity(CarFluid.OIL));
    car.Fill(CarFluid.BRAKE, car.GetFluidCapacity(CarFluid.BRAKE));
    car.Fill(CarFluid.COOLANT, car.GetFluidCapacity(CarFluid.COOLANT));

    // Faire apparaitre les pieces requises
    EntityAI carEntity = EntityAI.Cast(car);
    carEntity.GetInventory().CreateAttachment("CarBattery");
    carEntity.GetInventory().CreateAttachment("SparkPlug");
    carEntity.GetInventory().CreateAttachment("CarRadiator");
    carEntity.GetInventory().CreateAttachment("HatchbackWheel");
}
```

---

## BoatScript

**Fichier :** `4_World/entities/vehicles/boatscript.c`

Base scriptable pour les entites bateau. API similaire a CarScript mais avec une physique basee sur l'helice.

### Moteur et propulsion

```c
proto native bool  EngineIsOn();
proto native void  EngineStart();
proto native void  EngineStop();
proto native float EngineGetRPM();
```

### Fluides

Les bateaux utilisent la meme enumeration `CarFluid` mais n'utilisent generalement que `FUEL` :

```c
float fuel = boat.GetFluidFraction(CarFluid.FUEL);
boat.Fill(CarFluid.FUEL, boat.GetFluidCapacity(CarFluid.FUEL));
```

### Vitesse

```c
proto native float GetSpeedometer();   // Vitesse en km/h
```

**Exemple -- faire apparaitre un bateau :**

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

## Verifications d'interaction vehicule

### Verifier si un joueur est dans un vehicule

```c
PlayerBase player;
if (player.IsInVehicle())
{
    EntityAI vehicle = player.GetDrivingVehicle();
    CarScript car;
    if (Class.CastTo(car, vehicle))
    {
        float speed = car.GetSpeedometer();
        Print(string.Format("Conduit a %1 km/h", speed));
    }
}
```

### Trouver tous les vehicules dans le monde

```c
void FindAllVehicles(out array<Transport> vehicles)
{
    vehicles = new array<Transport>;
    array<Object> objects = new array<Object>;
    array<CargoBase> proxyCargos = new array<CargoBase>;

    // Utiliser un grand rayon depuis le centre de la carte
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

## Resume

| Concept | Point cle |
|---------|-----------|
| Hierarchie | `Transport` > `Car`/`Boat` > `CarScript`/`BoatScript` |
| Moteur | `EngineStart()`, `EngineStop()`, `EngineIsOn()`, `EngineGetRPM()` |
| Fluides | Enumeration `CarFluid` : `FUEL`, `OIL`, `BRAKE`, `COOLANT` |
| Remplir/Fuir | `Fill(fluid, amount)`, `Leak(fluid, amount)`, `GetFluidFraction(fluid)` |
| Vitesse | `GetSpeedometer()` retourne des km/h |
| Equipage | `CrewSize()`, `CrewMember(idx)`, `CrewGetOut(idx)` |
| Pieces | Zones de degats standard : `"Engine"`, `"FuelTank"`, `"Radiator"`, etc. |
| Creation | `CreateObjectEx` avec `ECE_PLACE_ON_SURFACE \| ECE_INITAI \| ECE_CREATEPHYSICS` |
| Config 1.28 | `useNewNetworking`, `wheelHubFriction`, valeurs de couple de frein doublees |
| Physique 1.28 | Bullet Physics mis a jour, nouveaux champs API `Contact`, suspension toujours active |
| 1.29 Experimental | Multithreading physique, sleep `Transport`, collision dynamique pour tout transport |

---

## Bonnes pratiques

- **Incluez toujours `ECE_CREATEPHYSICS | ECE_INITAI` lors de l'apparition de vehicules.** Sans physique, le vehicule tombe a travers le sol. Sans initialisation IA, la simulation du moteur ne demarre pas et le vehicule ne peut pas etre conduit.
- **Remplissez les quatre fluides apres l'apparition.** Un vehicule manquant d'huile, de liquide de frein ou de liquide de refroidissement s'endommagera immediatement au demarrage du moteur. Utilisez `GetFluidCapacity()` pour obtenir les valeurs maximales correctes par type de vehicule.
- **Verifiez la nullite de `CrewMember()` avant d'operer sur l'equipage.** Les sieges vides retournent `null`. Iterer `CrewSize()` sans verifier chaque indice provoque des crashs quand les sieges sont inoccupes.
- **Utilisez `GetSpeedometer()` au lieu de calculer la vitesse manuellement.** Le compteur de vitesse du moteur prend en compte le contact des roues, l'etat de la transmission et la physique correctement. Les calculs manuels de vitesse a partir des deltas de position sont peu fiables.

---

## Compatibilite et impact

> **Compatibilite des mods :** Les mods de vehicules etendent couramment `CarScript` avec des classes moddees. Les conflits surviennent lorsque plusieurs mods redefinissent les memes callbacks comme `OnEngineStart()` ou `EOnSimulate()`.

- **Ordre de chargement :** Si deux mods utilisent `modded class CarScript` et redefinissent `OnEngineStart()`, seul le dernier mod charge s'execute a moins que les deux n'appellent `super`. Les mods de refonte de vehicules doivent toujours appeler `super` dans chaque callback.
- **Conflits de classes moddees :** Expansion Vehicles et les mods de vehicules vanilla entrent frequemment en conflit sur `EEInit()` et l'initialisation des fluides. Testez avec les deux charges.
- **Impact sur les performances :** `EOnSimulate()` s'execute a chaque tick physique pour chaque vehicule actif. Gardez la logique minimale dans ce callback ; utilisez des accumulateurs de timer pour les operations couteuses.
- **Serveur/Client :** `EngineStart()`, `EngineStop()`, `Fill()`, `Leak()` et `CrewGetOut()` sont autoritatifs cote serveur. `GetSpeedometer()`, `EngineIsOn()` et `GetFluidFraction()` sont surs a lire des deux cotes.

---

## Changements de configuration des vehicules (1.28+)

> **Avertissement (1.28) :** DayZ 1.28 a introduit des changements significatifs de physique des vehicules. Si vous mettez a jour un mod de vehicule depuis la 1.27 ou anterieur, lisez cette section attentivement.

### Parametre `useNewNetworking`

DayZ 1.28 a ajoute le parametre de config `useNewNetworking` pour toutes les classes `CarScript`. La valeur par defaut est **1** (active).

```cpp
class CfgVehicles
{
    class CarScript;
    class MyVehicle : CarScript
    {
        // Le nouveau networking ameliore le rubber-banding a haut ping
        useNewNetworking = 1;  // defaut — laissez active pour la plupart des mods

        // Desactivez UNIQUEMENT si votre mod modifie la physique du vehicule
        // en dehors de la config SimulationModule :
        // useNewNetworking = 0;
    };
};
```

**Quand desactiver :** Si votre mod manipule directement la physique du vehicule via script (overrides personnalises de `EOnSimulate`, application de force directe, logique de roue personnalisee) plutot que via le `SimulationModule` base sur la config, le nouveau systeme de reconciliation peut entrer en conflit avec vos changements. Definissez `useNewNetworking = 0;` dans ce cas.

### Parametre `wheelHubFriction` (1.28+)

Nouvelle variable de config qui definit la trainee d'essieu quand **aucune roue n'est attachee** :

```cpp
class SimulationModule
{
    class Axles
    {
        class Front
        {
            wheelHubFriction = 0.5;  // Vitesse de deceleration du vehicule sans roues
        };
    };
};
```

### Migration du couple de frein (1.28)

> **Changement majeur :** Avant la 1.28, le couple de frein et de frein a main etait applique **deux fois** a cause d'un bug. Cela a ete corrige en 1.28. Si vous migrez un mod de vehicule, **doublez** vos valeurs `maxBrakeTorque` et `maxHandbrakeTorque` pour conserver le meme ressenti de freinage.

```cpp
// Pre-1.28 (bug : applique deux fois, donc valeur effective etait 2x)
maxBrakeTorque = 2000;
maxHandbrakeTorque = 3000;

// Post-1.28 (correction : applique une fois, donc doublez pour correspondre a l'ancien comportement)
maxBrakeTorque = 4000;
maxHandbrakeTorque = 6000;
```

### Suspension toujours active (1.28+)

La suspension du vehicule est desormais toujours active quand le vehicule est eveille. Auparavant, la suspension pouvait etre inactive dans certains etats. Cela ameliore la stabilite mais peut changer le ressenti des reglages de suspension personnalises.

### Mise a jour de Bullet Physics (1.28)

La bibliotheque Bullet Physics a ete mise a jour vers la derniere version Enfusion. Des differences subtiles dans la reponse aux collisions, la friction et la restitution peuvent survenir. Testez toutes les configurations de vehicules personnalises de maniere approfondie.

### Changements de l'API Contact physique (1.28)

La classe `Contact` a ete modifiee :

**Supprime :**
- `MaterialIndex1`, `MaterialIndex2`
- `Index1`, `Index2`

**Ajoute :**
- `ShapeIndex1`, `ShapeIndex2` --- identifient quelle forme dans un corps compose a ete touchee
- `VelocityBefore1`, `VelocityBefore2` --- velocites pre-collision
- `VelocityAfter1`, `VelocityAfter2` --- velocites post-collision

**Modifie :**
- `Material1`, `Material2` --- type change de `dMaterial` a `SurfaceProperties`

Les mods qui lisent les donnees `Contact` dans `EOnContact` doivent mettre a jour vers les nouveaux noms de variables et types.

---

## Changements des vehicules en 1.29 (Experimental)

> **Note :** Ces changements proviennent de DayZ 1.29 experimental et peuvent changer avant la version stable.

### Multithreading Bullet Physics (1.29 Experimental)

Le support du multithreading a ete active pour la bibliotheque Bullet Physics. Les tests de stress serveur ont montre jusqu'a 400% d'amelioration des FPS (9 FPS a 50 FPS). Les mods de vehicules qui dependent d'un timing physique specifique ou font des appels physiques depuis les callbacks de script doivent etre testes de maniere approfondie.

### Sleep du Transport (1.29 Experimental)

Des fonctions physiques ont ete ajoutees directement sur `Transport` pour permettre aux vehicules de **dormir** au repos. Les corps inactifs ne recoivent plus les callbacks `EOnSimulate` / `EOnPostSimulate`. Si votre mod de vehicule depend de ces callbacks en execution continue, testez sur la 1.29 experimental.

### Collision dynamique pour tout Transport (1.29 Experimental)

La classe `Transport` (parent de `CarScript` et `BoatScript`) a desormais une resolution de collision dynamique. Auparavant, seul `CarScript` en disposait. Les mods de bateaux beneficient d'une gestion correcte des collisions.

---

## Observe dans les mods reels

> Ces patrons ont ete confirmes en etudiant le code source de mods DayZ professionnels.

| Patron | Mod | Fichier/Emplacement |
|--------|-----|---------------------|
| Redefinition `EEInit()` pour definir des capacites de fluides personnalisees et faire apparaitre des pieces | Expansion Vehicles | Sous-classes `CarScript` |
| Accumulateur `EOnSimulate` pour des verifications periodiques de consommation de carburant | Mods Vanilla+ vehicules | Redefinitions `CarScript` |
| Boucle `CrewGetOut()` dans la commande admin d'ejection totale | VPP Admin Tools | Module de gestion des vehicules |
| Redefinition personnalisee `OnContact()` pour le reglage des degats de collision | Expansion | `ExpansionCarScript` |

---

[Accueil](../README.md) | [<< Precedent : Systeme d'entites](01-entity-system.md) | **Vehicules** | [Suivant : Meteo >>](03-weather.md)
