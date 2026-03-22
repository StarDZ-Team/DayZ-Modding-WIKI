# Chapter 5.5: Server Configuration Files

[Domu](../../README.md) | [<< Predchozi: ImageSet Format](04-imagesets.md) | **Server Configuration Files** | [Dalsi: Spawning Gear Configuration >>](06-spawning-gear.md)

> **Shrnuti:** DayZ servers are configured through XML, JSON, and script files in the mission folder (e.g., `mpmissions/dayzOffline.chernarusplus/`). These files control item spawns, economy behavior, gameplay rules, and server identity. Understanding them is essential for adding custom items to the loot economy, tuning server parameters, or building a custom mission.

---

## Obsah

- [Prehled](#overview)
- [init.c --- Mission Entry Point](#initc--mission-entry-point)
- [types.xml --- Item Spawn Definitions](#typesxml--item-spawn-definitions)
- [cfgspawnabletypes.xml --- Attachments and Cargo](#cfgspawnabletypesxml--attachments-and-cargo)
- [cfgrandompresets.xml --- Reusable Loot Pools](#cfgrandompresetsxml--reusable-loot-pools)
- [globals.xml --- Economy Parametry](#globalsxml--economy-parameters)
- [cfggameplay.json --- Gameplay Settings](#cfggameplayjson--gameplay-settings)
- [serverDZ.cfg --- Server Settings](#serverdzcfg--server-settings)
- [How Mods Interact with the Economy](#how-mods-interact-with-the-economy)
- [Caste chyby](#common-mistakes)

---

## Prehled

Every DayZ server loads its configuration from a **mission folder**. The Central Economy (CE) files define what items spawn, where, and for how long. The server executable itself is configured through `serverDZ.cfg`, which lives alongside the executable.

| File | Ucel |
|------|---------|
| `init.c` | Mission entry point --- Hive init, date/time, spawn loadout |
| `db/types.xml` | Item spawn definitions: quantities, lifetimes, locations |
| `cfgspawnabletypes.xml` | Pre-attached items and cargo on spawned entities |
| `cfgrandompresets.xml` | Reusable item pools for cfgspawnabletypes |
| `db/globals.xml` | Global economy parameters: max counts, cleanup timers |
| `cfggameplay.json` | Gameplay tuning: stamina, base building, UI |
| `cfgeconomycore.xml` | Root class registration and CE logging |
| `cfglimitsdefinition.xml` | Valid category, usage, and value tag definitions |
| `serverDZ.cfg` | Server name, password, max players, mod loading |

---

## init.c --- Mission Entry Point

The `init.c` script is the first thing the server executes. It initializes the Central Economy and creates the mission instance.

```c
void main()
{
    Hive ce = CreateHive();
    if (ce)
        ce.InitOffline();

    GetGame().GetWorld().SetDate(2024, 9, 15, 12, 0);
    CreateCustomMission("dayzOffline.chernarusplus");
}

class CustomMission: MissionServer
{
    override PlayerBase CreateCharacter(PlayerIdentity identity, vector pos,
                                        ParamsReadContext ctx, string characterName)
    {
        Entity playerEnt;
        playerEnt = GetGame().CreatePlayer(identity, characterName, pos, 0, "NONE");
        Class.CastTo(m_player, playerEnt);
        GetGame().SelectPlayer(identity, m_player);
        return m_player;
    }

    override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
    {
        EntityAI itemClothing = player.FindAttachmentBySlotName("Body");
        if (itemClothing)
        {
            itemClothing.GetInventory().CreateInInventory("BandageDressing");
        }
    }
}

Mission CreateCustomMission(string path)
{
    return new CustomMission();
}
```

The `Hive` manages the CE database. Without `CreateHive()`, no items spawn and persistence is disabled. `CreateCharacter` creates the player entity at spawn, and `StartingEquipSetup` defines the items a fresh character receives. Other useful `MissionServer` overrides include `OnInit()`, `OnUpdate()`, `InvokeOnConnect()`, and `InvokeOnDisconnect()`.

---

## types.xml --- Item Spawn Definitions

Located at `db/types.xml`, this file is the heart of the CE. Every item that can spawn must have an entry here.

### Complete Entry

```xml
<type name="AK74">
    <nominal>6</nominal>
    <lifetime>28800</lifetime>
    <restock>0</restock>
    <min>4</min>
    <quantmin>30</quantmin>
    <quantmax>80</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1"
           count_in_player="0" crafted="0" deloot="0"/>
    <category name="weapons"/>
    <usage name="Military"/>
    <value name="Tier3"/>
    <value name="Tier4"/>
</type>
```

### Pole Reference

| Pole | Popis |
|-------|-------------|
| `nominal` | Target count on the map. CE spawns items until this is reached |
| `min` | Minimum count before CE triggers restocking |
| `lifetime` | Seconds an item persists on the ground before despawning |
| `restock` | Minimum seconds between restock attempts (0 = immediate) |
| `quantmin/quantmax` | Fill percentage for items with quantity (magazines, bottles). Use `-1` for items without quantity |
| `cost` | CE priority weight (higher = prioritized). Most items use `100` |

### Priznaks

| Priznak | Ucel |
|------|---------|
| `count_in_cargo` | Count items inside containers toward nominal |
| `count_in_hoarder` | Count items in stashes/tents/barrels toward nominal |
| `count_in_map` | Count items on the ground toward nominal |
| `count_in_player` | Count items in player inventory toward nominal |
| `crafted` | Item is crafted only, not naturally spawned |
| `deloot` | Dynamic Event loot (heli crashes, etc.) |

### Kategorie, Pouziti, and Hodnota Tags

These tags control **where** items spawn:

- **`category`** --- Item type. Vanilla: `tools`, `containers`, `clothes`, `food`, `weapons`, `books`, `explosives`, `lootdispatch`.
- **`usage`** --- Building types. Vanilla: `Military`, `Police`, `Medic`, `Firefighter`, `Industrial`, `Farm`, `Coast`, `Town`, `Village`, `Hunting`, `Office`, `School`, `Prison`, `ContaminatedArea`, `Historical`.
- **`value`** --- Map tier zones. Vanilla: `Tier1` (coast), `Tier2` (inland), `Tier3` (military), `Tier4` (deep military), `Unique`.

Multiple tags can be combined. No `usage` tags = item will not spawn. No `value` tags = spawns in all tiers.

### Disabling an Item

Set `nominal=0` and `min=0`. The item never spawns but can still exist through scripts or crafting.

---

## cfgspawnabletypes.xml --- Attachments and Cargo

Controls what spawns **already attached to or inside** other items.

### Hoarder Marking

Storage containers are tagged so the CE knows they hold player items:

```xml
<type name="SeaChest">
    <hoarder />
</type>
```

### Spawn Damage

```xml
<type name="NVGoggles">
    <damage min="0.0" max="0.32" />
</type>
```

Hodnotas range from `0.0` (pristine) to `1.0` (ruined).

### Attachments

```xml
<type name="PlateCarrierVest_Camo">
    <damage min="0.1" max="0.6" />
    <attachments chance="0.85">
        <item name="PlateCarrierHolster_Camo" chance="1.00" />
    </attachments>
    <attachments chance="0.85">
        <item name="PlateCarrierPouches_Camo" chance="1.00" />
    </attachments>
</type>
```

The outer `chance` determines if the attachment group is evaluated. The inner `chance` selects the specific item when multiple items are listed in one group.

### Cargo Presets

```xml
<type name="AssaultBag_Ttsko">
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
</type>
```

Each line rolls the preset independently --- three lines means three separate chances.

---

## cfgrandompresets.xml --- Reusable Loot Pools

Defines named item pools referenced by `cfgspawnabletypes.xml`:

```xml
<randompresets>
    <cargo chance="0.16" name="foodVillage">
        <item name="SodaCan_Cola" chance="0.02" />
        <item name="TunaCan" chance="0.05" />
        <item name="PeachesCan" chance="0.05" />
        <item name="BakedBeansCan" chance="0.05" />
        <item name="Crackers" chance="0.05" />
    </cargo>

    <cargo chance="0.15" name="toolsHermit">
        <item name="WeaponCleaningKit" chance="0.10" />
        <item name="Matchbox" chance="0.15" />
        <item name="Hatchet" chance="0.07" />
    </cargo>
</randompresets>
```

The preset's `chance` is the overall probability anything spawns. If the roll succeeds, one item is selected from the pool based on individual item chances. To add modded items, create a new `cargo` block and reference it in `cfgspawnabletypes.xml`.

---

## globals.xml --- Economy Parametry

Located at `db/globals.xml`, this file sets global CE parameters:

```xml
<variables>
    <var name="AnimalMaxCount" type="0" value="200"/>
    <var name="ZombieMaxCount" type="0" value="1000"/>
    <var name="CleanupLifetimeDeadPlayer" type="0" value="3600"/>
    <var name="CleanupLifetimeDeadAnimal" type="0" value="1200"/>
    <var name="CleanupLifetimeDeadInfected" type="0" value="330"/>
    <var name="CleanupLifetimeRuined" type="0" value="330"/>
    <var name="FlagRefreshFrequency" type="0" value="432000"/>
    <var name="FlagRefreshMaxDuration" type="0" value="3456000"/>
    <var name="FoodDecay" type="0" value="1"/>
    <var name="InitialSpawn" type="0" value="100"/>
    <var name="LootDamageMin" type="1" value="0.0"/>
    <var name="LootDamageMax" type="1" value="0.82"/>
    <var name="SpawnInitial" type="0" value="1200"/>
    <var name="TimeLogin" type="0" value="15"/>
    <var name="TimeLogout" type="0" value="15"/>
    <var name="TimePenalty" type="0" value="20"/>
    <var name="TimeHopping" type="0" value="60"/>
    <var name="ZoneSpawnDist" type="0" value="300"/>
</variables>
```

### Key Variables

| Variable | Vychozi | Popis |
|----------|---------|-------------|
| `AnimalMaxCount` | 200 | Maximum animals on the map |
| `ZombieMaxCount` | 1000 | Maximum infected on the map |
| `CleanupLifetimeDeadPlayer` | 3600 | Dead body removal time (seconds) |
| `CleanupLifetimeRuined` | 330 | Ruined item removal time |
| `PriznakRefreshFrequency` | 432000 | Territory flag refresh interval (5 days) |
| `PriznakRefreshMaxDuration` | 3456000 | Max flag lifetime (40 days) |
| `FoodDecay` | 1 | Food spoilage toggle (0=off, 1=on) |
| `InitialSpawn` | 100 | Percentage of nominal spawned on startup |
| `LootDamageMax` | 0.82 | Maximum damage on spawned loot |
| `TimeLogin` / `TimeLogout` | 15 | Login/logout timer (anti-combat-log) |
| `TimePenalty` | 20 | Combat log penalty timer |
| `ZoneSpawnDist` | 300 | Player distance triggering zombie/animal spawns |

The `type` attribute is `0` for integer, `1` for float. Using the wrong type truncates the value.

---

## cfggameplay.json --- Gameplay Settings

Loaded only when `enableCfgGameplayFile = 1` in `serverDZ.cfg`. Without this, the engine uses hardcoded defaults.

### Structure

```json
{
    "version": 123,
    "GeneralData": {
        "disableBaseDamage": false,
        "disableContainerDamage": false,
        "disableRespawnDialog": false
    },
    "PlayerData": {
        "disablePersonalLight": false,
        "StaminaData": {
            "sprintStaminaModifierErc": 1.0,
            "staminaMax": 100.0,
            "staminaWeightLimitThreshold": 6000.0,
            "staminaMinCap": 5.0
        },
        "MovementData": {
            "timeToSprint": 0.45,
            "rotationSpeedSprint": 0.15,
            "allowStaminaAffectInertia": true
        }
    },
    "WorldsData": {
        "lightingConfig": 0,
        "environmentMinTemps": [-3, -2, 0, 4, 9, 14, 18, 17, 13, 11, 9, 0],
        "environmentMaxTemps": [3, 5, 7, 14, 19, 24, 26, 25, 18, 14, 10, 5]
    },
    "BaseBuildingData": {
        "HologramData": {
            "disableIsCollidingBBoxCheck": false,
            "disableIsCollidingAngleCheck": false,
            "disableHeightPlacementCheck": false,
            "disallowedTypesInUnderground": ["FenceKit", "TerritoryFlagKit"]
        }
    },
    "MapData": {
        "ignoreMapOwnership": false,
        "displayPlayerPosition": false,
        "displayNavInfo": true
    }
}
```

Key settings: `disableBaseDamage` prevents base damage, `disablePersonalLight` removes the fresh-spawn light, `staminaWeightLimitThreshold` is in grams (6000 = 6kg), temperature arrays have 12 values (January--December), `lightingConfig` accepts `0` (default) or `1` (darker nights), and `displayPlayerPosition` shows the player dot on the map.

---

## serverDZ.cfg --- Server Settings

This file sits next to the server executable, not in the mission folder.

### Klicova nastaveni

```
hostname = "My DayZ Server";
password = "";
passwordAdmin = "adminpass123";
maxPlayers = 60;
verifySignatures = 2;
forceSameBuild = 1;
template = "dayzOffline.chernarusplus";
enableCfgGameplayFile = 1;
storeHouseStateDisabled = false;
storageAutoFix = 1;
```

| Parametr | Popis |
|-----------|-------------|
| `hostname` | Server name in the browser |
| `password` | Join password (empty = open) |
| `passwordAdmin` | RCON admin password |
| `maxPlayers` | Maximum concurrent players |
| `template` | Mission folder name |
| `verifySignatures` | Signature check level (2 = strict) |
| `enableCfgGameplayFile` | Load cfggameplay.json (0/1) |

### Mod Loading

Mods are specified via launch parameters, not in the config file:

```
DayZServer_x64.exe -config=serverDZ.cfg -mod=@CF;@MyMod -servermod=@MyServerMod -port=2302
```

`-mod=` mods must be installed by clients. `-servermod=` mods run server-side only.

---

## How Mods Interact with the Economy

### cfgeconomycore.xml --- Root Class Registration

Every item class hierarchy must trace back to a registered root class:

```xml
<economycore>
    <classes>
        <rootclass name="DefaultWeapon" />
        <rootclass name="DefaultMagazine" />
        <rootclass name="Inventory_Base" />
        <rootclass name="SurvivorBase" act="character" reportMemoryLOD="no" />
        <rootclass name="DZ_LightAI" act="character" reportMemoryLOD="no" />
        <rootclass name="CarScript" act="car" reportMemoryLOD="no" />
    </classes>
</economycore>
```

If your mod introduces a new base class not inheriting from `Inventory_Base`, `VychoziWeapon`, or `VychoziMagazine`, add it as a `rootclass`. The `act` attribute specifies entity type: `character` for AI, `car` for vehicles.

### cfglimitsdefinition.xml --- Custom Tags

Any `category`, `usage`, or `value` used in `types.xml` must be defined here:

```xml
<lists>
    <categories>
        <category name="mymod_special"/>
    </categories>
    <usageflags>
        <usage name="MyModDungeon"/>
    </usageflags>
    <valueflags>
        <value name="MyModEndgame"/>
    </valueflags>
</lists>
```

Use `cfglimitsdefinitionuser.xml` for additions that should not overwrite the vanilla file.

### economy.xml --- Subsystem Control

Controls which CE subsystems are active:

```xml
<economy>
    <dynamic init="1" load="1" respawn="1" save="1"/>
    <animals init="1" load="0" respawn="1" save="0"/>
    <zombies init="1" load="0" respawn="1" save="0"/>
    <vehicles init="1" load="1" respawn="1" save="1"/>
</economy>
```

Priznaks: `init` (spawn on startup), `load` (load persistence), `respawn` (respawn after cleanup), `save` (persist to database).

### Script-Side Economy Interaction

Items created via `CreateInInventory()` are automatically CE-managed. For world spawns, use ECE flags:

```c
EntityAI item = GetGame().CreateObjectEx("AK74", position, ECE_PLACE_ON_SURFACE);
```

---

## Caste chyby

### XML Syntaxe Errors

A single unclosed tag breaks the entire file. Always validate XML before deploying.

### Missing Tags in cfglimitsdefinition.xml

Using a `usage` or `value` in types.xml that is not defined in cfglimitsdefinition.xml causes the item to silently fail to spawn. Check RPT logs for warnings.

### Nominal Too High

Total nominal across all items should stay below 10,000--15,000. Excessive values degrade server performance.

### Lifetime Too Short

Items with very short lifetimes disappear before players find them. Use at least `3600` (1 hour) for common items, `28800` (8 hours) for weapons.

### Missing Root Class

Items whose class hierarchy does not trace to a registered root class in `cfgeconomycore.xml` will never spawn, even with correct types.xml entries.

### cfggameplay.json Not Enabled

The file is ignored unless `enableCfgGameplayFile = 1` is set in `serverDZ.cfg`.

### Wrong type in globals.xml

Using `type="0"` (integer) for a float value like `0.82` truncates it to `0`. Use `type="1"` for floats.

### Editing Vanilla Files Directly

Modifying vanilla types.xml works but breaks on game updates. Prefer shipping separate type files and registering them through cfgeconomycore, or use cfglimitsdefinitionuser.xml for custom tags.

---

## Doporucene postupy

- Ship a `ServerFiles/` folder with your mod containing pre-configured `types.xml` entries so server admins can copy-paste rather than write from scratch.
- Use `cfglimitsdefinitionuser.xml` instead of editing the vanilla `cfglimitsdefinition.xml` -- your additions survive game updates.
- Set `count_in_hoarder="0"` for common items (food, ammo) to prevent hoarding from blocking CE respawns.
- Always set `enableCfgGameplayFile = 1` in `serverDZ.cfg` before expecting `cfggameplay.json` changes to take effect.
- Keep total `nominal` across all types.xml entries below 12,000 to avoid CE performance degradation on populated servers.

---

## Teorie vs praxe

| Koncept | Teorie | Realita |
|---------|--------|---------|
| `nominal` is a hard target | CE spawns exactly this many items | CE approaches nominal over time but fluctuates based on player interaction, cleanup cycles, and zone distance |
| `restock=0` means instant respawn | Items reappear immediately after despawn | The CE batch processes restocking in cycles (typically every 30-60 seconds), so there is always a delay regardless of the restock value |
| `cfggameplay.json` controls all gameplay | All tuning goes here | Many gameplay values are hardcoded in script or config.cpp and cannot be overridden by cfggameplay.json |
| `init.c` runs only on server start | One-time initialization | `init.c` runs every time the mission loads, including after server restarts. Persistent state is managed by the Hive, not init.c |
| Multiple types.xml files merge cleanly | CE reads all registered files | Files must be registered in cfgeconomycore.xml via `<ce folder="custom">` directives. Simply placing extra XML files in `db/` does nothing |

---

## Kompatibilita a dopad

- **Multi-Mod:** Multiple mods can add entries to types.xml without conflict as long as classnames are unique. If two mods define the same classname with different nominal/lifetime values, the last-loaded entry wins.
- **Performance:** Excessive nominal counts (15,000+) cause CE tick spikes visible as server FPS drops. Each CE cycle iterates all registered types to check spawn conditions.
