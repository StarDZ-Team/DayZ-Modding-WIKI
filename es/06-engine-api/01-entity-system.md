# Capitulo 6.1: Sistema de Entidades

[Inicio](../README.md) | **Sistema de Entidades** | [Siguiente: Vehiculos >>](02-vehicles.md)

---

## Introduccion

Cada objeto en el mundo de DayZ --- items, jugadores, zombies, animales, edificios, vehiculos --- desciende de una unica jerarquia de clases con raiz en `IEntity`. Entender esta jerarquia y los metodos disponibles en cada nivel es la base de todo el modding de DayZ. Este capitulo es una referencia de API para las clases de entidades principales: que metodos existen, cuales son sus firmas y como usarlos correctamente.

---

## Jerarquia de Clases

```
Class (raiz de todas las clases de Enforce Script)
└── Managed
    └── IEntity                              // 1_Core/proto/enentity.c
        └── Object                           // 3_Game/entities/object.c
            └── ObjectTyped
                └── Entity
                    └── EntityAI             // 3_Game/entities/entityai.c
                        ├── InventoryItem    // 3_Game/entities/inventoryitem.c
                        │   └── ItemBase     // 4_World/entities/itembase.c
                        │       ├── Weapon_Base, Magazine_Base
                        │       └── (todos los items de inventario)
                        ├── Man              // 3_Game/entities/man.c
                        │   └── DayZPlayer
                        │       └── DayZPlayerImplement
                        │           └── ManBase
                        │               └── PlayerBase  // 4_World/entities/manbase/playerbase.c
                        ├── Building         // 3_Game/entities/building.c
                        ├── DayZInfected
                        │   └── ZombieBase   // 4_World/entities/creatures/infected/zombiebase.c
                        ├── DayZAnimal
                        │   └── AnimalBase   // 4_World
                        └── AdvancedCommunication
```

Puntos clave:

- **IEntity** es la base a nivel del motor. Provee metodos de transformacion, fisica y jerarquia.
- **Object** agrega helpers de posicion/orientacion, salud, acceso a config, selecciones ocultas y verificacion de tipos (`IsMan()`, `IsBuilding()`, etc.).
- **EntityAI** agrega inventario, zonas de dano, accesorios, administrador de energia, variables de sincronizacion de red y eventos de ciclo de vida (`EEInit`, `EEKilled`, `EEHitBy`).
- **ItemBase**, **PlayerBase**, **ZombieBase** y **AnimalBase** son las bases concretas con las que trabajas a diario.

---

## IEntity

**Archivo:** `1_Core/proto/enentity.c`

La entidad nativa del motor. Todos los metodos son proto native --- no puedes ver su implementacion en script.

### Transformacion

| Metodo | Firma | Descripcion |
|--------|-----------|-------------|
| `GetOrigin` | `proto native vector GetOrigin()` | Posicion mundial de la entidad |
| `SetOrigin` | `proto native external void SetOrigin(vector orig)` | Establecer posicion mundial |
| `GetYawPitchRoll` | `proto native vector GetYawPitchRoll()` | Rotacion como yaw/pitch/roll en grados |
| `GetTransform` | `proto native external void GetTransform(out vector mat[4])` | Matriz de transformacion completa 4x3 |
| `SetTransform` | `proto native external void SetTransform(vector mat[4])` | Establecer transformacion completa |

### Conversion de Coordenadas

| Metodo | Firma | Descripcion |
|--------|-----------|-------------|
| `VectorToParent` | `proto native vector VectorToParent(vector vec)` | Transformar direccion de espacio local a mundial |
| `CoordToParent` | `proto native vector CoordToParent(vector coord)` | Transformar punto de espacio local a mundial |
| `VectorToLocal` | `proto native vector VectorToLocal(vector vec)` | Transformar direccion de espacio mundial a local |
| `CoordToLocal` | `proto native vector CoordToLocal(vector coord)` | Transformar punto de espacio mundial a local |

### Jerarquia

| Metodo | Firma | Descripcion |
|--------|-----------|-------------|
| `AddChild` | `proto native external void AddChild(IEntity child, int pivot, bool positionOnly = false)` | Adjuntar entidad hija a un pivote de hueso |
| `RemoveChild` | `proto native external void RemoveChild(IEntity child, bool keepTransform = false)` | Separar entidad hija |
| `GetParent` | `proto native IEntity GetParent()` | Entidad padre (o null) |
| `GetChildren` | `proto native IEntity GetChildren()` | Primera entidad hija |
| `GetSibling` | `proto native IEntity GetSibling()` | Siguiente entidad hermana |

### Eventos

| Metodo | Firma | Descripcion |
|--------|-----------|-------------|
| `SetEventMask` | `proto native external void SetEventMask(EntityEvent e)` | Habilitar callbacks de eventos |
| `ClearEventMask` | `proto native external void ClearEventMask(EntityEvent e)` | Deshabilitar callbacks de eventos |
| `SetFlags` | `proto native external EntityFlags SetFlags(EntityFlags flags, bool recursivelyApply)` | Establecer flags de entidad (VISIBLE, SOLID, etc.) |
| `ClearFlags` | `proto native external EntityFlags ClearFlags(EntityFlags flags, bool recursivelyApply)` | Limpiar flags de entidad |

### Callbacks de Eventos

Estos son llamados por el motor cuando la mascara de evento correspondiente esta establecida:

```c
// Callback por frame (requiere EntityEvent.FRAME)
event protected void EOnFrame(IEntity other, float timeSlice);

// Callback de contacto (requiere EntityEvent.CONTACT)
event protected void EOnContact(IEntity other, Contact extra);

// Callbacks de trigger (requiere EntityEvent.ENTER / EntityEvent.LEAVE)
event protected void EOnEnter(IEntity other, int extra);
event protected void EOnLeave(IEntity other, int extra);
```

---

## Object

**Archivo:** `3_Game/entities/object.c` (1455 lineas)

Clase base para todos los objetos espaciales en el mundo del juego. Este es el primer nivel accesible por script de la jerarquia --- `IEntity` es puramente nativo del motor.

### Posicion y Orientacion

```c
proto native void SetPosition(vector pos);
proto native vector GetPosition();
proto native void SetOrientation(vector ori);     // ori = "yaw pitch roll" en grados
proto native vector GetOrientation();              // retorna "yaw pitch roll"
proto native void SetDirection(vector direction);
proto native vector GetDirection();                // vector de direccion hacia adelante
```

**Ejemplo --- teletransportar un objeto:**

```c
Object obj = GetSomeObject();
vector newPos = Vector(6543.0, 0, 2872.0);
newPos[1] = GetGame().SurfaceY(newPos[0], newPos[2]);
obj.SetPosition(newPos);
```

### Salud y Dano

```c
// Sistema de salud basado en zonas. Usa "" para zona global, "Health" para tipo de salud predeterminado.
proto native float GetHealth(string zoneName, string healthType);
proto native float GetMaxHealth(string zoneName, string healthType);
proto native void  SetHealth(string zoneName, string healthType, float value);
proto native void  SetHealthMax(string zoneName, string healthType);
proto native void  DecreaseHealth(string zoneName, string healthType, float value,
                                   bool auto_delete = false);
proto native void  AddHealth(string zoneName, string healthType, float value);
proto native void  SetAllowDamage(bool val);
proto native bool  GetAllowDamage();
```

| Parametro | Significado |
|-----------|---------|
| `zoneName` | Nombre de zona de dano (ej., `""` para global, `"Engine"`, `"FuelTank"`, `"LeftArm"`) |
| `healthType` | Tipo de estadistica de salud (usualmente `"Health"`, pero tambien `"Blood"`, `"Shock"` para jugadores) |

**Ejemplo --- establecer un item a la mitad de salud:**

```c
float maxHP = obj.GetMaxHealth("", "Health");
obj.SetHealth("", "Health", maxHP * 0.5);
```

### IsAlive

```c
proto native bool IsAlive();
```

> **Gotcha:** La referencia vanilla muestra `IsAlive()` en `Object`, pero en la practica muchos modders han encontrado que no es confiable en la clase base `Object`. El patron seguro es castear a `EntityAI` primero:

```c
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive())
{
    // Confirmado vivo
}
```

### Verificacion de Tipo

```c
proto native bool IsMan();
proto native bool IsDayZCreature();
proto native bool IsBuilding();
proto native bool IsTransport();
proto native bool IsKindOf(string type);     // Verificar herencia de config
```

**Ejemplo:**

```c
if (obj.IsKindOf("Weapon_Base"))
{
    Print("This is a weapon!");
}
```

### Tipo y Nombre para Mostrar

```c
// GetType() retorna el nombre de clase de config (ej., "AKM", "SurvivorM_Mirek")
string GetType();

// GetDisplayName() retorna el nombre localizado para mostrar
string GetDisplayName();
```

### Escala

```c
proto native void  SetScale(float scale);
proto native float GetScale();
```

### Posiciones de Huesos

```c
proto native vector GetBonePositionLS(int pivot);   // Espacio local
proto native vector GetBonePositionMS(int pivot);   // Espacio del modelo
proto native vector GetBonePositionWS(int pivot);   // Espacio mundial
```

### Selecciones Ocultas (Intercambios de Textura/Material)

```c
TStringArray GetHiddenSelections();
TStringArray GetHiddenSelectionsTextures();
TStringArray GetHiddenSelectionsMaterials();
```

### Acceso a Config (en la entidad misma)

```c
proto native bool   ConfigGetBool(string entryName);
proto native int    ConfigGetInt(string entryName);
proto native float  ConfigGetFloat(string entryName);
proto native owned string ConfigGetString(string entryName);
proto native void   ConfigGetTextArray(string entryName, out TStringArray values);
proto native void   ConfigGetIntArray(string entryName, out TIntArray values);
proto native void   ConfigGetFloatArray(string entryName, out TFloatArray values);
proto native bool   ConfigIsExisting(string entryName);
```

### ID de Red

```c
proto native int GetNetworkID(out int id_low, out int id_high);
```

### Eliminacion

```c
void Delete();                    // Eliminacion diferida (proximo frame, via CallQueue)
proto native bool ToDelete();     // Esta este objeto marcado para eliminacion?
```

### Geometria y Componentes

```c
proto native owned string GetActionComponentName(int componentIndex, string geometry = "");
proto native owned vector GetActionComponentPosition(int componentIndex, string geometry = "");
proto native owned string GetDamageZoneNameByComponentIndex(int componentIndex);
proto native vector GetBoundingCenter();
```

---

## EntityAI

**Archivo:** `3_Game/entities/entityai.c` (4719 lineas)

La base de trabajo para todas las entidades interactivas del juego. Agrega inventario, eventos de dano, temperatura, gestion de energia y sincronizacion de red.

### Acceso al Inventario

```c
proto native GameInventory GetInventory();
```

Operaciones comunes de inventario a traves del `GameInventory` retornado:

```c
// Enumerar todos los items en el inventario de esta entidad
array<EntityAI> items = new array<EntityAI>;
eai.GetInventory().EnumerateInventory(InventoryTraversalType.PREORDER, items);

// Contar items
int count = eai.GetInventory().CountInventory();

// Verificar si la entidad tiene un item especifico
bool has = eai.GetInventory().HasEntityInInventory(someItem);

// Crear item en cargo
EntityAI newItem = eai.GetInventory().CreateEntityInCargo("BandageDressing");

// Crear item como accesorio
EntityAI attachment = eai.GetInventory().CreateAttachment("ACOGOptic");

// Buscar accesorio por nombre de slot
EntityAI att = eai.GetInventory().FindAttachmentByName("Hands");

// Obtener conteo de accesorios e iterar
int attCount = eai.GetInventory().AttachmentCount();
for (int i = 0; i < attCount; i++)
{
    EntityAI att = eai.GetInventory().GetAttachmentFromIndex(i);
}
```

### Sistema de Dano

```c
proto native void SetHealth(string zoneName, string healthType, float value);
proto native float GetHealth(string zoneName, string healthType);
proto native float GetMaxHealth(string zoneName, string healthType);
proto native void SetHealthMax(string zoneName, string healthType);
proto native void DecreaseHealth(string zoneName, string healthType, float value,
                                  bool auto_delete = false);
proto native void ProcessDirectDamage(int damageType, EntityAI source, string component,
                                       string ammoType, vector modelPos,
                                       float damageCoef = 1.0, int flags = 0);
```

### Eventos de Ciclo de Vida

Sobreescribe estos en tu subclase para engancharte al ciclo de vida de la entidad:

```c
void EEInit();                                    // Se llama despues de la inicializacion de la entidad
void EEDelete(EntityAI parent);                   // Se llama antes de la eliminacion
void EEKilled(Object killer);                     // Se llama cuando la entidad muere
void EEHitBy(TotalDamageResult damageResult,      // Se llama cuando la entidad recibe dano
             int damageType, EntityAI source,
             int component, string dmgZone,
             string ammo, vector modelPos,
             float speedCoef);
void EEItemAttached(EntityAI item, string slot_name);   // Accesorio agregado
void EEItemDetached(EntityAI item, string slot_name);   // Accesorio removido
```

### Variables de Sincronizacion de Red

Registra variables en el constructor para sincronizarlas automaticamente entre servidor y cliente:

```c
proto native void RegisterNetSyncVariableBool(string variableName);
proto native void RegisterNetSyncVariableInt(string variableName, int minValue = 0, int maxValue = 0);
proto native void RegisterNetSyncVariableFloat(string variableName, float minValue = 0, float maxValue = 0);
```

Sobreescribe `OnVariablesSynchronized()` en el cliente para reaccionar a cambios:

```c
void OnVariablesSynchronized();
```

**Ejemplo --- variable de estado sincronizada:**

```c
class MyItem extends ItemBase
{
    protected int m_State;

    void MyItem()
    {
        RegisterNetSyncVariableInt("m_State", 0, 5);
    }

    override void OnVariablesSynchronized()
    {
        super.OnVariablesSynchronized();
        // Actualizar visuales basado en m_State
        UpdateVisualState();
    }
}
```

### Administrador de Energia

```c
proto native ComponentEnergyManager GetCompEM();
```

Uso:

```c
ComponentEnergyManager em = eai.GetCompEM();
if (em)
{
    bool working = em.IsWorking();
    float energy = em.GetEnergy();
    em.SwitchOn();
    em.SwitchOff();
}
```

### ScriptInvokers (Hooks de Eventos)

```c
protected ref ScriptInvoker m_OnItemAttached;
protected ref ScriptInvoker m_OnItemDetached;
protected ref ScriptInvoker m_OnItemAddedIntoCargo;
protected ref ScriptInvoker m_OnItemRemovedFromCargo;
protected ref ScriptInvoker m_OnHitByInvoker;
protected ref ScriptInvoker m_OnKilledInvoker;
```

### Verificaciones de Tipo

```c
bool IsItemBase();
bool IsClothing();
bool IsContainer();
bool IsWeapon();
bool IsMagazine();
bool IsTransport();
bool IsFood();
```

### Spawnear Entidades

```c
EntityAI SpawnEntityOnGroundPos(string object_name, vector pos);
EntityAI SpawnEntity(string object_name, notnull InventoryLocation inv_loc,
                     int iSetupFlags, int iRotation);
```

---

## ItemBase

**Archivo:** `4_World/entities/itembase.c` (4986 lineas)

Base para todos los items de inventario. `typedef ItemBase Inventory_Base;` se usa a traves del codigo vanilla.

### Sistema de Cantidad

```c
void  SetQuantity(float value, bool destroy_config = true, bool destroy_forced = false);
float GetQuantity();
int   GetQuantityMin();
int   GetQuantityMax();
float GetQuantityNormalized();   // 0.0 - 1.0
bool  CanBeSplit();
void  SplitIntoStackMax(EntityAI destination_entity, int slot_id, PlayerBase player);
```

**Ejemplo --- llenar una cantimplora:**

```c
ItemBase canteen = ItemBase.Cast(player.GetInventory().CreateInInventory("Canteen"));
if (canteen)
{
    canteen.SetQuantity(canteen.GetQuantityMax());
}
```

### Condicion / Humedad / Temperatura

```c
// Humedad
float m_VarWet, m_VarWetMin, m_VarWetMax;

// Temperatura
float m_VarTemperature;

// Limpieza
int m_Cleanness;

// Liquido
int m_VarLiquidType;
```

### Acciones

```c
void SetActions();                     // Sobreescribir para registrar acciones para este item
void AddAction(typename actionName);   // Registrar una accion
void RemoveAction(typename actionName);
```

**Ejemplo --- item personalizado con accion:**

```c
class MyItem extends ItemBase
{
    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionDrinkSelf);
    }
}
```

### Sonido

```c
void PlaySoundSet(out EffectSound effect_sound, string sound_set,
                  float fade_in, float fade_out);
void PlaySoundSetLoop(out EffectSound effect_sound, string sound_set,
                      float fade_in, float fade_out);
void StopSoundSet(EffectSound effect_sound);
```

### Economia / Persistencia

```c
override void InitItemVariables();     // Lee todos los valores de config (cantidad, humedad, etc.)
```

Los items heredan el tiempo de vida y persistencia del CE (Central Economy) de su entrada en `types.xml`. Usa el flag `ECE_NOLIFETIME` al crear objetos que nunca deberian despawnear.

---

## PlayerBase

**Archivo:** `4_World/entities/manbase/playerbase.c` (9776 lineas)

La entidad del jugador. La clase mas grande en el codigo base.

### Identidad

```c
PlayerIdentity GetIdentity();
```

Desde `PlayerIdentity`:

```c
string GetName();       // Nombre de Steam/plataforma
string GetId();         // ID unico del jugador (BI ID)
string GetPlainId();    // Steam64 ID
int    GetPlayerId();   // ID de jugador de sesion (int)
```

**Ejemplo --- obtener info del jugador en el servidor:**

```c
PlayerBase player;  // desde evento
PlayerIdentity identity = player.GetIdentity();
if (identity)
{
    string name = identity.GetName();
    string steamId = identity.GetPlainId();
    Print(string.Format("Player: %1 (Steam: %2)", name, steamId));
}
```

### Salud / Sangre / Shock

El jugador usa el sistema de salud basado en zonas de EntityAI, con tipos de salud especiales:

```c
// Salud global (0-100 por defecto)
float hp = player.GetHealth("", "Health");

// Sangre (0-5000)
float blood = player.GetHealth("", "Blood");

// Shock (0-100)
float shock = player.GetHealth("", "Shock");

// Establecer valores
player.SetHealth("", "Health", 100);
player.SetHealth("", "Blood", 5000);
player.SetHealth("", "Shock", 0);
```

### Posicion e Inventario

```c
vector pos = player.GetPosition();
player.SetPosition(newPos);

// Item en manos
EntityAI inHands = player.GetHumanInventory().GetEntityInHands();

// Vehiculo que conduce
EntityAI vehicle = player.GetDrivingVehicle();
bool inVehicle = player.IsInVehicle();
```

### Verificaciones de Estado

```c
bool IsAlive();
bool IsUnconscious();
bool IsRestrained();
bool IsInVehicle();
```

### Managers

`PlayerBase` contiene referencias a muchos subsistemas de gameplay:

```c
ref ModifiersManager   m_ModifiersManager;
ref ActionManagerBase  m_ActionManager;
ref PlayerAgentPool    m_AgentPool;
ref Environment        m_Environment;
ref EmoteManager       m_EmoteManager;
ref StaminaHandler     m_StaminaHandler;
ref WeaponManager      m_WeaponManager;
```

### Eventos de Ciclo de Vida del Servidor

```c
void OnConnect();
void OnDisconnect();
void OnScheduledTick(float deltaTime);
override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx);
```

### Spawnear Items Cerca del Jugador

```c
EntityAI SpawnEntityOnGroundOnCursorDir(string object_name, float distance);
```

---

## ZombieBase

**Archivo:** `4_World/entities/creatures/infected/zombiebase.c` (1150 lineas)

Base para todas las entidades infectadas (zombie).

### Propiedades Clave

```c
protected int   m_MindState;       // Estado de AI (-1 a 4)
protected float m_MovementSpeed;   // Velocidad de movimiento (-1 a 3)
protected bool  m_IsCrawling;      // Zombie arrastrante
```

### Inicializacion

```c
void Init()
{
    RegisterNetSyncVariableInt("m_MindState", -1, 4);
    RegisterNetSyncVariableFloat("m_MovementSpeed", -1, 3);
    RegisterNetSyncVariableBool("m_IsCrawling");

    m_TargetableObjects.Insert(PlayerBase);
    m_TargetableObjects.Insert(AnimalBase);
}
```

---

## AnimalBase

**Archivo:** `4_World/entities/creatures/animals/`

Base para todas las entidades animales. Extiende `DayZAnimal` que extiende `EntityAI`.

Los animales usan las mismas APIs de salud, posicion y dano que otras entidades. Su comportamiento es controlado por el sistema de AI y archivos de territorio configurados en el CE.

---

## Crear Entidades

### GetGame().CreateObject()

```c
proto native Object CreateObject(string type, vector pos,
                                  bool create_local = false,
                                  bool init_ai = false,
                                  bool create_physics = true);
```

| Parametro | Descripcion |
|-----------|-------------|
| `type` | Nombre de clase de config (ej., `"AKM"`, `"ZmbF_JournalistNormal_Blue"`) |
| `pos` | Posicion mundial |
| `create_local` | `true` = solo cliente, no replicado al servidor |
| `init_ai` | `true` = inicializar AI (para zombies, animales) |
| `create_physics` | `true` = crear geometria de colision |

**Ejemplo:**

```c
Object obj = GetGame().CreateObject("AKM", player.GetPosition(), false, false, true);
```

### GetGame().CreateObjectEx()

```c
proto native Object CreateObjectEx(string type, vector pos, int iFlags,
                                    int iRotation = RF_DEFAULT);
```

Esta es la API preferida. El parametro `iFlags` usa flags ECE (Entity Creation Event).

### Flags ECE

| Flag | Valor | Descripcion |
|------|-------|-------------|
| `ECE_NONE` | `0` | Sin comportamiento especial |
| `ECE_SETUP` | `2` | Setup completo de entidad |
| `ECE_TRACE` | `4` | Trazar ubicacion a la superficie |
| `ECE_CENTER` | `8` | Usar centro de la forma del modelo |
| `ECE_UPDATEPATHGRAPH` | `32` | Actualizar malla de navegacion |
| `ECE_CREATEPHYSICS` | `1024` | Crear fisica/colision |
| `ECE_INITAI` | `2048` | Inicializar AI |
| `ECE_EQUIP_ATTACHMENTS` | `8192` | Spawnear accesorios configurados |
| `ECE_EQUIP_CARGO` | `16384` | Spawnear cargo configurado |
| `ECE_EQUIP` | `24576` | `ATTACHMENTS + CARGO` |
| `ECE_LOCAL` | `1073741824` | Crear solo localmente (no replicado) |
| `ECE_NOSURFACEALIGN` | `262144` | No alinear a la normal de la superficie |
| `ECE_KEEPHEIGHT` | `524288` | Mantener posicion Y (sin traza) |
| `ECE_NOLIFETIME` | `4194304` | Sin tiempo de vida del CE (no despawneara) |
| `ECE_DYNAMIC_PERSISTENCY` | `33554432` | Persistente solo despues de interaccion del jugador |

### Combinaciones Predefinidas de Flags

| Constante | Flags | Caso de Uso |
|----------|-------|----------|
| `ECE_IN_INVENTORY` | `CREATEPHYSICS \| KEEPHEIGHT \| NOSURFACEALIGN` | Items creados en inventario |
| `ECE_PLACE_ON_SURFACE` | `CREATEPHYSICS \| UPDATEPATHGRAPH \| TRACE` | Items colocados en el suelo |
| `ECE_FULL` | `SETUP \| TRACE \| ROTATIONFLAGS \| UPDATEPATHGRAPH \| EQUIP` | Setup completo con equipamiento |

### Flags RF (Rotacion)

| Flag | Valor | Descripcion |
|------|-------|-------------|
| `RF_DEFAULT` | `512` | Usar ubicacion predeterminada de config |
| `RF_ORIGINAL` | `128` | Usar ubicacion predeterminada de config |
| `RF_IGNORE` | `64` | Spawnear tal como fue creado el modelo |
| `RF_ALL` | `63` | Todas las direcciones de rotacion |

### Patrones Comunes

**Spawnear item en el suelo:**

```c
vector pos = player.GetPosition();
Object item = GetGame().CreateObjectEx("AKM", pos, ECE_PLACE_ON_SURFACE);
```

**Spawnear zombie con AI:**

```c
EntityAI zombie = EntityAI.Cast(
    GetGame().CreateObjectEx("ZmbF_JournalistNormal_Blue", pos,
                              ECE_PLACE_ON_SURFACE | ECE_INITAI)
);
```

**Spawnear edificio persistente:**

```c
int flags = ECE_SETUP | ECE_UPDATEPATHGRAPH | ECE_CREATEPHYSICS | ECE_NOLIFETIME;
Object building = GetGame().CreateObjectEx("Land_House", pos, flags, RF_IGNORE);
```

**Spawnear solo local (lado del cliente):**

```c
Object local = GetGame().CreateObjectEx("HelpDeskItem", pos, ECE_LOCAL | ECE_CREATEPHYSICS);
```

**Spawnear item directamente en el inventario del jugador:**

```c
EntityAI item = player.GetInventory().CreateInInventory("BandageDressing");
```

---

## Destruir Entidades

### Object.Delete()

```c
void Delete();
```

Eliminacion diferida --- el objeto es removido en el proximo frame via `CallQueue`. Esta es la forma mas segura de eliminar objetos porque evita problemas al eliminar objetos mientras se estan iterando.

### GetGame().ObjectDelete()

```c
proto native void ObjectDelete(Object obj);
```

Eliminacion inmediata autoritativa del servidor. Remueve el objeto del servidor y replica la eliminacion a todos los clientes.

### GetGame().ObjectDeleteOnClient()

```c
proto native void ObjectDeleteOnClient(Object obj);
```

Elimina el objeto solo en los clientes. El servidor aun mantiene el objeto.

**Ejemplo --- limpiar objetos spawneados:**

```c
// Preferido: eliminacion diferida
obj.Delete();

// Inmediato: cuando necesitas que desaparezca ahora mismo
GetGame().ObjectDelete(obj);
```

---

## Ejemplos Practicos

### Encontrar Todos los Jugadores Cerca de una Posicion

```c
void FindNearbyPlayers(vector center, float radius, out array<PlayerBase> result)
{
    result = new array<PlayerBase>;
    array<Man> allPlayers = new array<Man>;
    GetGame().GetPlayers(allPlayers);

    foreach (Man man : allPlayers)
    {
        if (vector.Distance(man.GetPosition(), center) <= radius)
        {
            PlayerBase pb;
            if (Class.CastTo(pb, man))
            {
                result.Insert(pb);
            }
        }
    }
}
```

### Spawnear un Arma Completamente Equipada

```c
void SpawnEquippedAKM(vector pos)
{
    EntityAI weapon = EntityAI.Cast(
        GetGame().CreateObjectEx("AKM", pos, ECE_PLACE_ON_SURFACE)
    );
    if (!weapon)
        return;

    // Agregar accesorios
    weapon.GetInventory().CreateAttachment("AK_WoodBttstck");
    weapon.GetInventory().CreateAttachment("AK_WoodHndgrd");

    // Crear un cargador en cargo
    weapon.GetInventory().CreateEntityInCargo("Mag_AKM_30Rnd");
}
```

### Danar y Matar una Entidad

```c
void DamageEntity(EntityAI target, float amount)
{
    float currentHP = target.GetHealth("", "Health");
    float newHP = currentHP - amount;

    if (newHP <= 0)
    {
        target.SetHealth("", "Health", 0);
        // EEKilled sera llamado automaticamente por el motor
    }
    else
    {
        target.SetHealth("", "Health", newHP);
    }
}
```

---

## Resumen

| Concepto | Punto Clave |
|---------|-----------|
| Jerarquia | `IEntity` > `Object` > `EntityAI` > `ItemBase` / `PlayerBase` / `ZombieBase` |
| Posicion | `GetPosition()` / `SetPosition()` disponible desde `Object` hacia arriba |
| Salud | Basada en zonas: `GetHealth(zone, type)` / `SetHealth(zone, type, value)` |
| IsAlive | Usar en `EntityAI` o castear primero: `EntityAI eai; Class.CastTo(eai, obj)` |
| Inventario | `eai.GetInventory()` retorna `GameInventory` con CRUD completo |
| Crear | `GetGame().CreateObjectEx(type, pos, ECE_flags)` es la API preferida |
| Eliminar | `obj.Delete()` (diferido) o `GetGame().ObjectDelete(obj)` (inmediato) |
| Sync de Red | `RegisterNetSyncVariable*()` en constructor, reaccionar en `OnVariablesSynchronized()` |
| Verificar Tipo | `obj.IsKindOf("ClassName")`, `obj.IsMan()`, `obj.IsBuilding()` |

---

[Inicio](../README.md) | **Sistema de Entidades** | [Siguiente: Vehiculos >>](02-vehicles.md)
