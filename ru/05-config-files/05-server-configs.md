# Глава 5.5: Файлы конфигурации сервера

[Главная](../../README.md) | [<< Previous: ImageSet Format](04-imagesets.md) | **Server Configuration Files** | [Next: Spawning Gear Configuration >>](06-spawning-gear.md)

> **Краткое описание:** Серверы DayZ настраиваются через файлы XML, JSON и скриптов в папке миссии (e.g., `mpmissions/dayzOffline.chernarusplus/`). Эти файлы управляют спавном предметов, поведением экономики, правилами геймплея и идентификацией сервера. Их понимание необходимо для добавления пользовательских предметов в экономику лута, настройки параметров сервера или создания пользовательской миссии.

---

## Содержание

- [Overview](#overview)
- [init.c --- Mission Entry Point](#initc--mission-entry-point)
- [types.xml --- Item Spawn Definitions](#typesxml--item-spawn-definitions)
- [cfgspawnabletypes.xml --- Attachments and Cargo](#cfgspawnabletypesxml--attachments-and-cargo)
- [cfgrandompresets.xml --- Reusable Loot Pools](#cfgrandompresetsxml--reusable-loot-pools)
- [globals.xml --- Economy Parameters](#globalsxml--economy-parameters)
- [cfggameplay.json --- Gameplay Settings](#cfggameplayjson--gameplay-settings)
- [serverDZ.cfg --- Server Settings](#serverdzcfg--server-settings)
- [How Mods Interact with the Economy](#how-mods-interact-with-the-economy)
- [Common Mistakes](#common-mistakes)

---

## Обзор

Каждый сервер DayZ загружает конфигурацию из **папки миссии**. Файлы Центральной экономики (CE) определяют, какие предметы спавнятся, где и на какое время. Сам исполняемый файл сервера настраивается через `serverDZ.cfg`, который находится рядом с исполняемым файлом.

| Файл | Назначение |
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

## init.c --- Точка входа миссии

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

## types.xml --- Определения спавна предметов

Расположенный в `db/types.xml`, этот файл --- сердце CE. Каждый предмет, который может появиться, должен иметь здесь запись.

### Полная запись

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

### Справка по полям

| Поле | Описание |
|-------|-------------|
| `nominal` | Целевое количество на карте. CE spawns items until this is reached |
| `min` | Минимальное количество до пополнения CE |
| `lifetime` | Секунды нахождения предмета на земле до исчезновения |
| `restock` | Минимальные секунды между попытками пополнения (0 = immediate) |
| `quantmin/quantmax` | Fill percentage for items with quantity (magazines, bottles). Use `-1` for items without quantity |
| `cost` | Приоритетный вес CE (higher = prioritized). Most items use `100` |

### Флаги

| Флаг | Назначение |
|------|---------|
| `count_in_cargo` | Считать предметы в контейнерах к номиналу |
| `count_in_hoarder` | Считать предметы в тайниках/палатках/бочках к номиналу |
| `count_in_map` | Считать предметы на земле к номиналу |
| `count_in_player` | Считать предметы в инвентаре игрока к номиналу |
| `crafted` | Предмет только крафтится, не спавнится естественным образом |
| `deloot` | Лут динамических событий (heli crashes, etc.) |

### Теги категорий, использования и значений

These tags control **where** items spawn:

- **`category`** --- Item type. Vanilla: `tools`, `containers`, `clothes`, `food`, `weapons`, `books`, `explosives`, `lootdispatch`.
- **`usage`** --- Building types. Vanilla: `Military`, `Police`, `Medic`, `Firefighter`, `Industrial`, `Farm`, `Coast`, `Town`, `Village`, `Hunting`, `Office`, `School`, `Prison`, `ContaminatedArea`, `Historical`.
- **`value`** --- Map tier zones. Vanilla: `Tier1` (coast), `Tier2` (inland), `Tier3` (military), `Tier4` (deep military), `Unique`.

Multiple tags can be combined. No `usage` tags = item will not spawn. No `value` tags = spawns in all tiers.

### Отключение предмета

Set `nominal=0` and `min=0`. The item never spawns but can still exist through scripts or crafting.

---

## cfgspawnabletypes.xml --- Вложения и груз

Controls what spawns **already attached to or inside** other items.

### Маркировка хранилищ

Storage containers are tagged so the CE knows they hold player items:

```xml
<type name="SeaChest">
    <hoarder />
</type>
```

### Урон при спавне

```xml
<type name="NVGoggles">
    <damage min="0.0" max="0.32" />
</type>
```

Values range from `0.0` (pristine) to `1.0` (ruined).

### Вложения

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

### Пресеты груза

```xml
<type name="AssaultBag_Ttsko">
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
</type>
```

Each line rolls the preset independently --- three lines means three separate chances.

---

## cfgrandompresets.xml --- Переиспользуемые пулы лута

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

## globals.xml --- Параметры экономики

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

### Ключевые переменные

| Переменная | По умолчанию | Описание |
|----------|---------|-------------|
| `AnimalMaxCount` | 200 | Максимум животных на карте |
| `ZombieMaxCount` | 1000 | Максимум зараженных на карте |
| `CleanupLifetimeDeadPlayer` | 3600 | Время удаления мертвых тел (секунды) |
| `CleanupLifetimeRuined` | 330 | Время удаления разрушенных предметов |
| `FlagRefreshFrequency` | 432000 | Интервал обновления флага территории (5 days) |
| `FlagRefreshMaxDuration` | 3456000 | Максимальное время жизни флага (40 days) |
| `FoodDecay` | 1 | Переключатель порчи еды (0=off, 1=on) |
| `InitialSpawn` | 100 | Процент номинала при спавне на запуске |
| `LootDamageMax` | 0.82 | Максимальный урон на спавненном луте |
| `TimeLogin` / `TimeLogout` | 15 | Таймер входа/выхода (анти-комбат-лог) |
| `TimePenalty` | 20 | Таймер штрафа за комбат-лог |
| `ZoneSpawnDist` | 300 | Дистанция игрока для триггера спавна зомби/животных |

The `type` attribute is `0` for integer, `1` for float. Using the wrong type truncates the value.

---

## cfggameplay.json --- Настройки геймплея

Загружается только при `enableCfgGameplayFile = 1` в `serverDZ.cfg`. Без этого движок использует жестко заданные значения по умолчанию.

### Структура

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

## serverDZ.cfg --- Настройки сервера

Этот файл находится рядом с исполняемым файлом сервера, а не в папке миссии.

### Ключевые настройки

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

| Параметр | Описание |
|-----------|-------------|
| `hostname` | Имя сервера в браузере |
| `password` | Пароль для входа (пустой = открытый) |
| `passwordAdmin` | Пароль администратора RCON |
| `maxPlayers` | Максимум одновременных игроков |
| `template` | Имя папки миссии |
| `verifySignatures` | Уровень проверки подписи (2 = strict) |
| `enableCfgGameplayFile` | Load cfggameplay.json (0/1) |

### Загрузка модов

Моды указываются через параметры запуска, а не в файле конфигурации:

```
DayZServer_x64.exe -config=serverDZ.cfg -mod=@CF;@MyMod -servermod=@MyServerMod -port=2302
```

`-mod=` mods must be installed by clients. `-servermod=` mods run server-side only.

---

## Как моды взаимодействуют с экономикой

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

If your mod introduces a new base class not inheriting from `Inventory_Base`, `DefaultWeapon`, or `DefaultMagazine`, add it as a `rootclass`. The `act` attribute specifies entity type: `character` for AI, `car` for vehicles.

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

Flags: `init` (spawn on startup), `load` (load persistence), `respawn` (respawn after cleanup), `save` (persist to database).

### Взаимодействие с экономикой на стороне скриптов

Items created via `CreateInInventory()` are automatically CE-managed. For world spawns, use ECE flags:

```c
EntityAI item = GetGame().CreateObjectEx("AK74", position, ECE_PLACE_ON_SURFACE);
```

---

## Типичные ошибки

### Ошибки синтаксиса XML

Один незакрытый тег ломает весь файл. Всегда проверяйте XML перед развертыванием.

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

## Лучшие практики

- Ship a `ServerFiles/` folder with your mod containing pre-configured `types.xml` entries so server admins can copy-paste rather than write from scratch.
- Use `cfglimitsdefinitionuser.xml` instead of editing the vanilla `cfglimitsdefinition.xml` --- выr additions survive game updates.
- Set `count_in_hoarder="0"` for common items (food, ammo) to prevent hoarding from blocking CE respawns.
- Always set `enableCfgGameplayFile = 1` in `serverDZ.cfg` before expecting `cfggameplay.json` changes to take effect.
- Keep total `nominal` across all types.xml entries below 12,000 to avoid CE performance degradation on populated servers.

---

## Теория и практика

| Концепция | Теория | Реальность |
|---------|--------|---------|
| `nominal` is a hard target | CE spawns exactly this many items | CE approaches nominal over time but fluctuates based on player interaction, cleanup cycles, and zone distance |
| `restock=0` means instant respawn | Items reappear immediately after despawn | The CE batch processes restocking in cycles (typically every 30-60 seconds), so there is always a delay regardless of the restock value |
| `cfggameplay.json` controls all gameplay | All tuning goes here | Many gameplay values are hardcoded in script or config.cpp and cannot be overridden by cfggameplay.json |
| `init.c` runs only on server start | One-time initialization | `init.c` runs every time the mission loads, including after server restarts. Persistent state is managed by the Hive, not init.c |
| Multiple types.xml files merge cleanly | CE reads all registered files | Files must be registered in cfgeconomycore.xml via `<ce folder="custom">` directives. Simply placing extra XML files in `db/` does nothing |

---

## Совместимость и влияние

- **Multi-Mod:** Multiple mods can add entries to types.xml without conflict as long as classnames are unique. If two mods define the same classname with different nominal/lifetime values, the last-loaded entry wins.
- **Performance:** Excessive nominal counts (15,000+) cause CE tick spikes visible as server FPS drops. Each CE cycle iterates all registered types to check spawn conditions.
