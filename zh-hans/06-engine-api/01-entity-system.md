# Chapter 6.1: Entity System

[Home](../README.md) | **Entity System** | [Next: Vehicles >>](02-vehicles.md)

---

## 简介

Every object in the DayZ world --- items, players, zombies, animals, buildings, vehicles --- descends from a single class hierarchy rooted at `IEntity`. Understanding this hierarchy and the methods available at each level is the foundation of all DayZ modding. This chapter is an API reference for the core entity classes: what methods exist, what their signatures are, and how to use them correctly.

---

## Class Hierarchy

```
Class (root of all Enforce Script classes)
└── Managed
    └── IEntity                              // 1_Core/proto/enentity.c
        └── Object                           // 3_Game/entities/object.c
            └── ObjectTyped
                └── Entity
                    └── EntityAI             // 3_Game/entities/entityai.c
                        ├── InventoryItem    // 3_Game/entities/inventoryitem.c
                        │   └── ItemBase     // 4_World/entities/itembase.c
                        │       ├── Weapon_Base, Magazine_Base
                        │       └── (all inventory items)
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

Key points:

- **IEntity** is the engine-level base. It provides transform, physics, and hierarchy methods.
- **Object** adds position/orientation helpers, health, config access, hidden selections, and type checking (`IsMan()`, `IsBuilding()`, etc.).
- **EntityAI** adds inventory, damage zones, attachments, energy manager, net sync variables, and lifecycle events (`EEInit`, `EEKilled`, `EEHitBy`).
- **ItemBase**, **PlayerBase**, **ZombieBase**, and **AnimalBase** are the concrete bases you work with daily.

---

## IEntity

**File:** `1_Core/proto/enentity.c`

The engine-native entity. All proto native methods --- you cannot see their implementation in script.

### Transform

```mermaid
classDiagram
    IEntity <|-- Object
    Object <|-- ObjectTyped
    ObjectTyped <|-- Entity
    Entity <|-- EntityAI
    EntityAI <|-- ItemBase
    EntityAI <|-- ManBase
    EntityAI <|-- Building
    EntityAI <|-- DayZInfected
    EntityAI <|-- DayZAnimal
    EntityAI <|-- Transport
    ManBase <|-- PlayerBase
    ItemBase <|-- Weapon_Base
    ItemBase <|-- Magazine_Base
    ItemBase <|-- Clothing_Base
    Transport <|-- CarScript
    Transport <|-- BoatScript
    Weapon_Base <|-- Rifle_Base
    Weapon_Base <|-- Pistol_Base

    class EntityAI {
        +GetHealth()
        +SetHealth()
        +IsAlive()
        +Delete()
    }
    class PlayerBase {
        +GetIdentity()
        +GetBleeding()
        +IsRestrained()
    }
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `GetOrigin` | `proto native vector GetOrigin()` | World position of the entity |
| `SetOrigin` | `proto native external void SetOrigin(vector orig)` | Set world position |
| `GetYawPitchRoll` | `proto native vector GetYawPitchRoll()` | Rotation as yaw/pitch/roll in degrees |
| `GetTransform` | `proto native external void GetTransform(out vector mat[4])` | Full 4x3 transform matrix |
| `SetTransform` | `proto native external void SetTransform(vector mat[4])` | Set full transform |

### Coordinate Conversion

| Method | Signature | Description |
|--------|-----------|-------------|
| `VectorToParent` | `proto native vector VectorToParent(vector vec)` | Transform direction from local to world space |
| `CoordToParent` | `proto native vector CoordToParent(vector coord)` | Transform point from local to world space |
| `VectorToLocal` | `proto native vector VectorToLocal(vector vec)` | Transform direction from world to local space |
| `CoordToLocal` | `proto native vector CoordToLocal(vector coord)` | Transform point from world to local space |

### Hierarchy

| Method | Signature | Description |
|--------|-----------|-------------|
| `AddChild` | `proto native external void AddChild(IEntity child, int pivot, bool positionOnly = false)` | Attach child entity to a bone pivot |
| `RemoveChild` | `proto native external void RemoveChild(IEntity child, bool keepTransform = false)` | Detach child entity |
| `GetParent` | `proto native IEntity GetParent()` | Parent entity (or null) |
| `GetChildren` | `proto native IEntity GetChildren()` | First child entity |
| `GetSibling` | `proto native IEntity GetSibling()` | 下一章 sibling entity |

### Events

| Method | Signature | Description |
|--------|-----------|-------------|
| `SetEventMask` | `proto native external void SetEventMask(EntityEvent e)` | Enable event callbacks |
| `ClearEventMask` | `proto native external void ClearEventMask(EntityEvent e)` | Disable event callbacks |
| `SetFlags` | `proto native external EntityFlags SetFlags(EntityFlags flags, bool recursivelyApply)` | Set entity flags (VISIBLE, SOLID, etc.) |
| `ClearFlags` | `proto native external EntityFlags ClearFlags(EntityFlags flags, bool recursivelyApply)` | Clear entity flags |

### Event Callbacks

These are called by the engine when the corresponding event mask is set:

```c
// Per-frame callback (requires EntityEvent.FRAME)
event protected void EOnFrame(IEntity other, float timeSlice);

// Contact callback (requires EntityEvent.CONTACT)
event protected void EOnContact(IEntity other, Contact extra);

// Trigger callbacks (requires EntityEvent.ENTER / EntityEvent.LEAVE)
event protected void EOnEnter(IEntity other, int extra);
event protected void EOnLeave(IEntity other, int extra);
```

---

## Object

**File:** `3_Game/entities/object.c` (1455 lines)

Base class for all spatial objects in the game world. This is the first script-accessible level of the hierarchy --- `IEntity` is purely engine-native.

### Position & Orientation

```c
proto native void SetPosition(vector pos);
proto native vector GetPosition();
proto native void SetOrientation(vector ori);     // ori = "yaw pitch roll" in degrees
proto native vector GetOrientation();              // returns "yaw pitch roll"
proto native void SetDirection(vector direction);
proto native vector GetDirection();                // forward direction vector
```

**Example --- teleport an object:**

```c
Object obj = GetSomeObject();
vector newPos = Vector(6543.0, 0, 2872.0);
newPos[1] = GetGame().SurfaceY(newPos[0], newPos[2]);
obj.SetPosition(newPos);
```

### Health & Damage

```c
// Zone-based health system. Use "" for global zone, "Health" for default health type.
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

| Parameter | Meaning |
|-----------|---------|
| `zoneName` | Damage zone name (e.g., `""` for global, `"Engine"`, `"FuelTank"`, `"LeftArm"`) |
| `healthType` | Type of health stat (usually `"Health"`, but also `"Blood"`, `"Shock"` for players) |

**Example --- set an item to half health:**

```c
float maxHP = obj.GetMaxHealth("", "Health");
obj.SetHealth("", "Health", maxHP * 0.5);
```

### IsAlive

```c
proto native bool IsAlive();
```

> **Gotcha:** The vanilla reference shows `IsAlive()` on `Object`, but in practice many modders have found it unreliable on the base `Object` class. The safe pattern is to cast to `EntityAI` first:

```c
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive())
{
    // Confirmed alive
}
```

### Type Checking

```c
proto native bool IsMan();
proto native bool IsDayZCreature();
proto native bool IsBuilding();
proto native bool IsTransport();
proto native bool IsKindOf(string type);     // Check config inheritance
```

**Example:**

```c
if (obj.IsKindOf("Weapon_Base"))
{
    Print("This is a weapon!");
}
```

### Type & Display Name

```c
// GetType() returns the config class name (e.g., "AKM", "SurvivorM_Mirek")
string GetType();

// GetDisplayName() returns the localized display name
string GetDisplayName();
```

### Scale

```c
proto native void  SetScale(float scale);
proto native float GetScale();
```

### Bone Positions

```c
proto native vector GetBonePositionLS(int pivot);   // Local space
proto native vector GetBonePositionMS(int pivot);   // Model space
proto native vector GetBonePositionWS(int pivot);   // World space
```

### Hidden Selections (Texture/Material Swaps)

```c
TStringArray GetHiddenSelections();
TStringArray GetHiddenSelectionsTextures();
TStringArray GetHiddenSelectionsMaterials();
```

### Config Access (on the entity itself)

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

### Network ID

```c
proto native int GetNetworkID(out int id_low, out int id_high);
```

### Deletion

```c
void Delete();                    // Deferred delete (next frame, via CallQueue)
proto native bool ToDelete();     // Is this object marked for deletion?
```

### Geometry & Components

```c
proto native owned string GetActionComponentName(int componentIndex, string geometry = "");
proto native owned vector GetActionComponentPosition(int componentIndex, string geometry = "");
proto native owned string GetDamageZoneNameByComponentIndex(int componentIndex);
proto native vector GetBoundingCenter();
```

---

## EntityAI

**File:** `3_Game/entities/entityai.c` (4719 lines)

The workhorse base for all interactive game entities. Adds inventory, damage events, temperature, energy management, and network synchronization.

### Inventory Access

```c
proto native GameInventory GetInventory();
```

Common inventory operations through the returned `GameInventory`:

```c
// Enumerate all items in this entity's inventory
array<EntityAI> items = new array<EntityAI>;
eai.GetInventory().EnumerateInventory(InventoryTraversalType.PREORDER, items);

// Count items
int count = eai.GetInventory().CountInventory();

// Check if entity has a specific item
bool has = eai.GetInventory().HasEntityInInventory(someItem);

// Create item in cargo
EntityAI newItem = eai.GetInventory().CreateEntityInCargo("BandageDressing");

// Create item as attachment
EntityAI attachment = eai.GetInventory().CreateAttachment("ACOGOptic");

// Find attachment by slot name
EntityAI att = eai.GetInventory().FindAttachmentByName("Hands");

// Get attachment count and iterate
int attCount = eai.GetInventory().AttachmentCount();
for (int i = 0; i < attCount; i++)
{
    EntityAI att = eai.GetInventory().GetAttachmentFromIndex(i);
}
```

### Damage System

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

### Lifecycle Events

Override these in your subclass to hook into the entity lifecycle:

```c
void EEInit();                                    // Called after entity initialization
void EEDelete(EntityAI parent);                   // Called before deletion
void EEKilled(Object killer);                     // Called when entity dies
void EEHitBy(TotalDamageResult damageResult,      // Called when entity takes damage
             int damageType, EntityAI source,
             int component, string dmgZone,
             string ammo, vector modelPos,
             float speedCoef);
void EEItemAttached(EntityAI item, string slot_name);   // Attachment added
void EEItemDetached(EntityAI item, string slot_name);   // Attachment removed
```

### Network Sync Variables

Register variables in the constructor to automatically synchronize them between server and client:

```c
proto native void RegisterNetSyncVariableBool(string variableName);
proto native void RegisterNetSyncVariableInt(string variableName, int minValue = 0, int maxValue = 0);
proto native void RegisterNetSyncVariableFloat(string variableName, float minValue = 0, float maxValue = 0);
```

Override `OnVariablesSynchronized()` on the client to react to changes:

```c
void OnVariablesSynchronized();
```

**Example --- synced state variable:**

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
        // Update visuals based on m_State
        UpdateVisualState();
    }
}
```

### Energy Manager

```c
proto native ComponentEnergyManager GetCompEM();
```

Usage:

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

### ScriptInvokers (Event Hooks)

```c
protected ref ScriptInvoker m_OnItemAttached;
protected ref ScriptInvoker m_OnItemDetached;
protected ref ScriptInvoker m_OnItemAddedIntoCargo;
protected ref ScriptInvoker m_OnItemRemovedFromCargo;
protected ref ScriptInvoker m_OnHitByInvoker;
protected ref ScriptInvoker m_OnKilledInvoker;
```

### Type Checks

```c
bool IsItemBase();
bool IsClothing();
bool IsContainer();
bool IsWeapon();
bool IsMagazine();
bool IsTransport();
bool IsFood();
```

### Spawning Entities

```c
EntityAI SpawnEntityOnGroundPos(string object_name, vector pos);
EntityAI SpawnEntity(string object_name, notnull InventoryLocation inv_loc,
                     int iSetupFlags, int iRotation);
```

---

## ItemBase

**File:** `4_World/entities/itembase.c` (4986 lines)

Base for all inventory items. `typedef ItemBase Inventory_Base;` is used throughout vanilla code.

### Quantity System

```c
void  SetQuantity(float value, bool destroy_config = true, bool destroy_forced = false);
float GetQuantity();
int   GetQuantityMin();
int   GetQuantityMax();
float GetQuantityNormalized();   // 0.0 - 1.0
bool  CanBeSplit();
void  SplitIntoStackMax(EntityAI destination_entity, int slot_id, PlayerBase player);
```

**Example --- fill a canteen:**

```c
ItemBase canteen = ItemBase.Cast(player.GetInventory().CreateInInventory("Canteen"));
if (canteen)
{
    canteen.SetQuantity(canteen.GetQuantityMax());
}
```

### Condition / Wetness / Temperature

```c
// Wetness
float m_VarWet, m_VarWetMin, m_VarWetMax;

// Temperature
float m_VarTemperature;

// Cleanness
int m_Cleanness;

// Liquid
int m_VarLiquidType;
```

### Actions

```c
void SetActions();                     // Override to register actions for this item
void AddAction(typename actionName);   // Register an action
void RemoveAction(typename actionName);
```

**Example --- custom item with action:**

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

### Sound

```c
void PlaySoundSet(out EffectSound effect_sound, string sound_set,
                  float fade_in, float fade_out);
void PlaySoundSetLoop(out EffectSound effect_sound, string sound_set,
                      float fade_in, float fade_out);
void StopSoundSet(EffectSound effect_sound);
```

### Economy / Persistence

```c
override void InitItemVariables();     // Reads all config values (quantity, wet, etc.)
```

Items inherit CE (Central Economy) lifetime and persistence from their `types.xml` entry. Use `ECE_NOLIFETIME` flag when creating objects that should never despawn.

---

## PlayerBase

**File:** `4_World/entities/manbase/playerbase.c` (9776 lines)

The player entity. The largest class in the codebase.

### Identity

```c
PlayerIdentity GetIdentity();
```

From `PlayerIdentity`:

```c
string GetName();       // Steam/platform display name
string GetId();         // Unique player ID (BI ID)
string GetPlainId();    // Steam64 ID
int    GetPlayerId();   // Session player ID (int)
```

**Example --- get player info on server:**

```c
PlayerBase player;  // from event
PlayerIdentity identity = player.GetIdentity();
if (identity)
{
    string name = identity.GetName();
    string steamId = identity.GetPlainId();
    Print(string.Format("Player: %1 (Steam: %2)", name, steamId));
}
```

### Health / Blood / Shock

Player uses the zone-based health system from EntityAI, with special health types:

```c
// Global health (0-100 by default)
float hp = player.GetHealth("", "Health");

// Blood (0-5000)
float blood = player.GetHealth("", "Blood");

// Shock (0-100)
float shock = player.GetHealth("", "Shock");

// Set values
player.SetHealth("", "Health", 100);
player.SetHealth("", "Blood", 5000);
player.SetHealth("", "Shock", 0);
```

### Position & Inventory

```c
vector pos = player.GetPosition();
player.SetPosition(newPos);

// Item in hands
EntityAI inHands = player.GetHumanInventory().GetEntityInHands();

// Driving vehicle
EntityAI vehicle = player.GetDrivingVehicle();
bool inVehicle = player.IsInVehicle();
```

### State Checks

```c
bool IsAlive();
bool IsUnconscious();
bool IsRestrained();
bool IsInVehicle();
```

### Managers

`PlayerBase` holds references to many gameplay subsystems:

```c
ref ModifiersManager   m_ModifiersManager;
ref ActionManagerBase  m_ActionManager;
ref PlayerAgentPool    m_AgentPool;
ref Environment        m_Environment;
ref EmoteManager       m_EmoteManager;
ref StaminaHandler     m_StaminaHandler;
ref WeaponManager      m_WeaponManager;
```

### Server Lifecycle Events

```c
void OnConnect();
void OnDisconnect();
void OnScheduledTick(float deltaTime);
override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx);
```

### Spawning Items Near Player

```c
EntityAI SpawnEntityOnGroundOnCursorDir(string object_name, float distance);
```

---

## ZombieBase

**File:** `4_World/entities/creatures/infected/zombiebase.c` (1150 lines)

Base for all infected (zombie) entities.

### Key Properties

```c
protected int   m_MindState;       // AI state (-1 to 4)
protected float m_MovementSpeed;   // Movement speed (-1 to 3)
protected bool  m_IsCrawling;      // Crawler zombie
```

### 初始化

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

**File:** `4_World/entities/creatures/animals/`

Base for all animal entities. Extends `DayZAnimal` which extends `EntityAI`.

Animals use the same health, position, and damage APIs as other entities. Their behavior is driven by the AI system and CE-configured territory files.

---

## Creating Entities

### GetGame().CreateObject()

```c
proto native Object CreateObject(string type, vector pos,
                                  bool create_local = false,
                                  bool init_ai = false,
                                  bool create_physics = true);
```

| Parameter | Description |
|-----------|-------------|
| `type` | Config class name (e.g., `"AKM"`, `"ZmbF_JournalistNormal_Blue"`) |
| `pos` | World position |
| `create_local` | `true` = client-only, not replicated to server |
| `init_ai` | `true` = initialize AI (for zombies, animals) |
| `create_physics` | `true` = create collision geometry |

**Example:**

```c
Object obj = GetGame().CreateObject("AKM", player.GetPosition(), false, false, true);
```

### GetGame().CreateObjectEx()

```c
proto native Object CreateObjectEx(string type, vector pos, int iFlags,
                                    int iRotation = RF_DEFAULT);
```

This is the preferred API. The `iFlags` parameter uses ECE (Entity Creation Event) flags.

### ECE Flags

| Flag | Value | Description |
|------|-------|-------------|
| `ECE_NONE` | `0` | No special behavior |
| `ECE_SETUP` | `2` | Full entity setup |
| `ECE_TRACE` | `4` | Trace placement to surface |
| `ECE_CENTER` | `8` | Use center from model shape |
| `ECE_UPDATEPATHGRAPH` | `32` | 上级date navigation mesh |
| `ECE_CREATEPHYSICS` | `1024` | Create physics/collision |
| `ECE_INITAI` | `2048` | Initialize AI |
| `ECE_EQUIP_ATTACHMENTS` | `8192` | Spawn configured attachments |
| `ECE_EQUIP_CARGO` | `16384` | Spawn configured cargo |
| `ECE_EQUIP` | `24576` | `ATTACHMENTS + CARGO` |
| `ECE_LOCAL` | `1073741824` | Create locally only (not replicated) |
| `ECE_NOSURFACEALIGN` | `262144` | Do not align to surface normal |
| `ECE_KEEPHEIGHT` | `524288` | Keep Y position (no trace) |
| `ECE_NOLIFETIME` | `4194304` | No CE lifetime (will not despawn) |
| `ECE_DYNAMIC_PERSISTENCY` | `33554432` | Persistent only after player interaction |

### Pre-defined Flag Combinations

| Constant | Flags | Use Case |
|----------|-------|----------|
| `ECE_IN_INVENTORY` | `CREATEPHYSICS \| KEEPHEIGHT \| NOSURFACEALIGN` | Items created in inventory |
| `ECE_PLACE_ON_SURFACE` | `CREATEPHYSICS \| UPDATEPATHGRAPH \| TRACE` | Items placed on ground |
| `ECE_FULL` | `SETUP \| TRACE \| ROTATIONFLAGS \| UPDATEPATHGRAPH \| EQUIP` | Full setup with equipment |

### RF (Rotation) Flags

| Flag | Value | Description |
|------|-------|-------------|
| `RF_DEFAULT` | `512` | Use default config placement |
| `RF_ORIGINAL` | `128` | Use default config placement |
| `RF_IGNORE` | `64` | Spawn as model was created |
| `RF_ALL` | `63` | All rotation directions |

### Common Patterns

**Spawn item on ground:**

```c
vector pos = player.GetPosition();
Object item = GetGame().CreateObjectEx("AKM", pos, ECE_PLACE_ON_SURFACE);
```

**Spawn zombie with AI:**

```c
EntityAI zombie = EntityAI.Cast(
    GetGame().CreateObjectEx("ZmbF_JournalistNormal_Blue", pos,
                              ECE_PLACE_ON_SURFACE | ECE_INITAI)
);
```

**Spawn persistent building:**

```c
int flags = ECE_SETUP | ECE_UPDATEPATHGRAPH | ECE_CREATEPHYSICS | ECE_NOLIFETIME;
Object building = GetGame().CreateObjectEx("Land_House", pos, flags, RF_IGNORE);
```

**Spawn local-only (client side):**

```c
Object local = GetGame().CreateObjectEx("HelpDeskItem", pos, ECE_LOCAL | ECE_CREATEPHYSICS);
```

**Spawn item directly into player inventory:**

```c
EntityAI item = player.GetInventory().CreateInInventory("BandageDressing");
```

---

## Destroying Entities

### Object.Delete()

```c
void Delete();
```

Deferred deletion --- the object is removed on the next frame via `CallQueue`. This is the safest way to delete objects because it avoids issues with deleting objects while they are being iterated.

### GetGame().ObjectDelete()

```c
proto native void ObjectDelete(Object obj);
```

Immediate server-authoritative deletion. Removes the object from the server and replicates the removal to all clients.

### GetGame().ObjectDeleteOnClient()

```c
proto native void ObjectDeleteOnClient(Object obj);
```

Deletes the object only on clients. The server still keeps the object.

**Example --- cleanup spawned objects:**

```c
// Preferred: deferred delete
obj.Delete();

// Immediate: when you need it gone right now
GetGame().ObjectDelete(obj);
```

---

## Practical Examples

### Find All Players Near a Position

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

### Spawn a Fully Equipped Weapon

```c
void SpawnEquippedAKM(vector pos)
{
    EntityAI weapon = EntityAI.Cast(
        GetGame().CreateObjectEx("AKM", pos, ECE_PLACE_ON_SURFACE)
    );
    if (!weapon)
        return;

    // Add attachments
    weapon.GetInventory().CreateAttachment("AK_WoodBttstck");
    weapon.GetInventory().CreateAttachment("AK_WoodHndgrd");

    // Create a magazine in cargo
    weapon.GetInventory().CreateEntityInCargo("Mag_AKM_30Rnd");
}
```

### Damage and Kill an Entity

```c
void DamageEntity(EntityAI target, float amount)
{
    float currentHP = target.GetHealth("", "Health");
    float newHP = currentHP - amount;

    if (newHP <= 0)
    {
        target.SetHealth("", "Health", 0);
        // EEKilled will be called automatically by the engine
    }
    else
    {
        target.SetHealth("", "Health", newHP);
    }
}
```

---

## 总结

| 概念 | 要点 |
|---------|-----------|
| Hierarchy | `IEntity` > `Object` > `EntityAI` > `ItemBase` / `PlayerBase` / `ZombieBase` |
| Position | `GetPosition()` / `SetPosition()` available from `Object` upward |
| Health | Zone-based: `GetHealth(zone, type)` / `SetHealth(zone, type, value)` |
| IsAlive | Use on `EntityAI` or cast first: `EntityAI eai; Class.CastTo(eai, obj)` |
| Inventory | `eai.GetInventory()` returns `GameInventory` with full CRUD |
| Creating | `GetGame().CreateObjectEx(type, pos, ECE_flags)` is the preferred API |
| Deleting | `obj.Delete()` (deferred) or `GetGame().ObjectDelete(obj)` (immediate) |
| Net Sync | `RegisterNetSyncVariable*()` in constructor, react in `OnVariablesSynchronized()` |
| Type Check | `obj.IsKindOf("ClassName")`, `obj.IsMan()`, `obj.IsBuilding()` |

---

[Home](../README.md) | **Entity System** | [下一章: Vehicles >>](02-vehicles.md)
