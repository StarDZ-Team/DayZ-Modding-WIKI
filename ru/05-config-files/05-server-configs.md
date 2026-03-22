# Глава 5.5: Конфигурационные файлы сервера

[Главная](../README.md) | [<< Назад: Формат ImageSet](04-imagesets.md) | **Конфигурационные файлы сервера** | [Далее: Конфигурация спавна и экипировки >>](06-spawning-gear.md)

---

> **Краткое содержание:** Серверы DayZ настраиваются через файлы XML, JSON и скрипты в папке миссии (например, `mpmissions/dayzOffline.chernarusplus/`). Эти файлы управляют спавном предметов, поведением экономики, правилами геймплея и идентификацией сервера. Их понимание необходимо для добавления пользовательских предметов в экономику лута, настройки параметров сервера или создания пользовательской миссии.

---

## Содержание

- [Обзор](#обзор)
- [init.c --- Точка входа миссии](#initc----точка-входа-миссии)
- [types.xml --- Определения спавна предметов](#typesxml----определения-спавна-предметов)
- [cfgspawnabletypes.xml --- Вложения и груз](#cfgspawnabletypesxml----вложения-и-груз)
- [cfgrandompresets.xml --- Повторно используемые пулы лута](#cfgrandompresetsxml----повторно-используемые-пулы-лута)
- [globals.xml --- Параметры экономики](#globalsxml----параметры-экономики)
- [cfggameplay.json --- Настройки геймплея](#cfggameplayjson----настройки-геймплея)
- [serverDZ.cfg --- Настройки сервера](#serverdzcfg----настройки-сервера)
- [Как моды взаимодействуют с экономикой](#как-моды-взаимодействуют-с-экономикой)
- [Распространённые ошибки](#распространённые-ошибки)

---

## Обзор

Каждый сервер DayZ загружает свою конфигурацию из **папки миссии**. Файлы Центральной экономики (CE) определяют, какие предметы спавнятся, где и как долго. Сам исполняемый файл сервера настраивается через `serverDZ.cfg`, который находится рядом с исполняемым файлом.

| Файл | Назначение |
|------|------------|
| `init.c` | Точка входа миссии --- инициализация Hive, дата/время, экипировка спавна |
| `db/types.xml` | Определения спавна предметов: количества, времена жизни, локации |
| `cfgspawnabletypes.xml` | Предустановленные вложения и груз на заспавненных сущностях |
| `cfgrandompresets.xml` | Повторно используемые пулы предметов для cfgspawnabletypes |
| `db/globals.xml` | Глобальные параметры экономики: максимальные количества, таймеры очистки |
| `cfggameplay.json` | Настройка геймплея: выносливость, строительство баз, UI |
| `cfgeconomycore.xml` | Регистрация корневых классов и логирование CE |
| `cfglimitsdefinition.xml` | Определения допустимых тегов категорий, использования и значений |
| `serverDZ.cfg` | Имя сервера, пароль, максимум игроков, загрузка модов |

---

## init.c --- Точка входа миссии

Скрипт `init.c` --- первое, что сервер выполняет. Он инициализирует Центральную экономику и создаёт экземпляр миссии.

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

`Hive` управляет базой данных CE. Без `CreateHive()` предметы не спавнятся и персистентность отключена. `CreateCharacter` создаёт сущность игрока при спавне, а `StartingEquipSetup` определяет предметы, которые получает свежий персонаж. Другие полезные переопределения `MissionServer` включают `OnInit()`, `OnUpdate()`, `InvokeOnConnect()` и `InvokeOnDisconnect()`.

---

## types.xml --- Определения спавна предметов

Находится в `db/types.xml` --- это сердце CE. Каждый предмет, который может спавниться, должен иметь запись здесь.

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

### Справочник полей

| Поле | Описание |
|------|----------|
| `nominal` | Целевое количество на карте. CE спавнит предметы, пока не достигнет этого числа |
| `min` | Минимальное количество, после которого CE запускает пополнение |
| `lifetime` | Секунды существования предмета на земле до исчезновения |
| `restock` | Минимальное количество секунд между попытками пополнения (0 = немедленно) |
| `quantmin/quantmax` | Процент заполнения для предметов с количеством (магазины, бутылки). Используйте `-1` для предметов без количества |
| `cost` | Весовой приоритет CE (выше = приоритетнее). Большинство предметов используют `100` |

### Флаги

| Флаг | Назначение |
|------|------------|
| `count_in_cargo` | Считать предметы внутри контейнеров для nominal |
| `count_in_hoarder` | Считать предметы в тайниках/палатках/бочках для nominal |
| `count_in_map` | Считать предметы на земле для nominal |
| `count_in_player` | Считать предметы в инвентаре игроков для nominal |
| `crafted` | Предмет только крафтится, не спавнится естественным образом |
| `deloot` | Лут динамических событий (крушения вертолётов и т.д.) |

### Теги Category, Usage и Value

Эти теги управляют тем, **где** спавнятся предметы:

- **`category`** --- Тип предмета. Ванильные: `tools`, `containers`, `clothes`, `food`, `weapons`, `books`, `explosives`, `lootdispatch`.
- **`usage`** --- Типы зданий. Ванильные: `Military`, `Police`, `Medic`, `Firefighter`, `Industrial`, `Farm`, `Coast`, `Town`, `Village`, `Hunting`, `Office`, `School`, `Prison`, `ContaminatedArea`, `Historical`.
- **`value`** --- Тировые зоны карты. Ванильные: `Tier1` (побережье), `Tier2` (внутренние районы), `Tier3` (военные), `Tier4` (глубокие военные), `Unique`.

Можно комбинировать несколько тегов. Отсутствие тегов `usage` = предмет не заспавнится. Отсутствие тегов `value` = спавнится во всех тирах.

### Отключение предмета

Установите `nominal=0` и `min=0`. Предмет никогда не спавнится, но может существовать через скрипты или крафт.

---

## cfgspawnabletypes.xml --- Вложения и груз

Управляет тем, что спавнится **уже прикреплённым или внутри** других предметов.

### Маркировка хранилищ

Контейнеры для хранения помечаются, чтобы CE знала, что они содержат предметы игроков:

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

Значения варьируются от `0.0` (отличное) до `1.0` (разрушено).

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

Внешний `chance` определяет, будет ли группа вложений обработана. Внутренний `chance` выбирает конкретный предмет, когда в одной группе перечислено несколько предметов.

### Пресеты груза

```xml
<type name="AssaultBag_Ttsko">
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
    <cargo preset="mixArmy" />
</type>
```

Каждая строка разыгрывает пресет независимо --- три строки означают три отдельных шанса.

---

## cfgrandompresets.xml --- Повторно используемые пулы лута

Определяет именованные пулы предметов, на которые ссылается `cfgspawnabletypes.xml`:

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

`chance` пресета --- это общая вероятность того, что что-то заспавнится. Если розыгрыш успешен, один предмет выбирается из пула на основе индивидуальных шансов предметов. Чтобы добавить моддированные предметы, создайте новый блок `cargo` и сошлитесь на него в `cfgspawnabletypes.xml`.

---

## globals.xml --- Параметры экономики

Находится в `db/globals.xml`, этот файл устанавливает глобальные параметры CE:

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
|------------|-------------|----------|
| `AnimalMaxCount` | 200 | Максимум животных на карте |
| `ZombieMaxCount` | 1000 | Максимум заражённых на карте |
| `CleanupLifetimeDeadPlayer` | 3600 | Время удаления мёртвого тела (секунды) |
| `CleanupLifetimeRuined` | 330 | Время удаления разрушенного предмета |
| `FlagRefreshFrequency` | 432000 | Интервал обновления флага территории (5 дней) |
| `FlagRefreshMaxDuration` | 3456000 | Максимальное время жизни флага (40 дней) |
| `FoodDecay` | 1 | Переключатель порчи еды (0=выкл, 1=вкл) |
| `InitialSpawn` | 100 | Процент от nominal, спавнящийся при запуске |
| `LootDamageMax` | 0.82 | Максимальный урон на заспавненном луте |
| `TimeLogin` / `TimeLogout` | 15 | Таймер входа/выхода (анти-боевой-выход) |
| `TimePenalty` | 20 | Штрафной таймер за боевой выход |
| `ZoneSpawnDist` | 300 | Расстояние игрока, запускающее спавн зомби/животных |

Атрибут `type` --- это `0` для целого числа, `1` для числа с плавающей точкой. Использование неверного типа обрезает значение.

---

## cfggameplay.json --- Настройки геймплея

Загружается только когда `enableCfgGameplayFile = 1` установлен в `serverDZ.cfg`. Без этого движок использует жёстко заданные значения по умолчанию.

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

Ключевые настройки: `disableBaseDamage` предотвращает урон базам, `disablePersonalLight` убирает свет свежего спавна, `staminaWeightLimitThreshold` указывается в граммах (6000 = 6 кг), массивы температур имеют 12 значений (январь---декабрь), `lightingConfig` принимает `0` (по умолчанию) или `1` (более тёмные ночи), а `displayPlayerPosition` показывает точку игрока на карте.

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
|----------|----------|
| `hostname` | Имя сервера в браузере |
| `password` | Пароль для входа (пустой = открытый) |
| `passwordAdmin` | Пароль RCON-администратора |
| `maxPlayers` | Максимум одновременных игроков |
| `template` | Имя папки миссии |
| `verifySignatures` | Уровень проверки подписей (2 = строгий) |
| `enableCfgGameplayFile` | Загружать cfggameplay.json (0/1) |

### Загрузка модов

Моды указываются через параметры запуска, а не в файле конфигурации:

```
DayZServer_x64.exe -config=serverDZ.cfg -mod=@CF;@MyMod -servermod=@MyServerMod -port=2302
```

Моды в `-mod=` должны быть установлены клиентами. Моды в `-servermod=` работают только на стороне сервера.

---

## Как моды взаимодействуют с экономикой

### cfgeconomycore.xml --- Регистрация корневых классов

Иерархия каждого класса предметов должна восходить к зарегистрированному корневому классу:

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

Если ваш мод вводит новый базовый класс, не наследующий от `Inventory_Base`, `DefaultWeapon` или `DefaultMagazine`, добавьте его как `rootclass`. Атрибут `act` указывает тип сущности: `character` для ИИ, `car` для транспорта.

### cfglimitsdefinition.xml --- Пользовательские теги

Любой `category`, `usage` или `value`, используемый в `types.xml`, должен быть определён здесь:

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

Используйте `cfglimitsdefinitionuser.xml` для дополнений, которые не должны перезаписывать ванильный файл.

### economy.xml --- Управление подсистемами

Управляет тем, какие подсистемы CE активны:

```xml
<economy>
    <dynamic init="1" load="1" respawn="1" save="1"/>
    <animals init="1" load="0" respawn="1" save="0"/>
    <zombies init="1" load="0" respawn="1" save="0"/>
    <vehicles init="1" load="1" respawn="1" save="1"/>
</economy>
```

Флаги: `init` (спавн при запуске), `load` (загрузка персистентности), `respawn` (респавн после очистки), `save` (сохранение в базу данных).

### Взаимодействие с экономикой через скрипты

Предметы, созданные через `CreateInInventory()`, автоматически управляются CE. Для мировых спавнов используйте флаги ECE:

```c
EntityAI item = GetGame().CreateObjectEx("AK74", position, ECE_PLACE_ON_SURFACE);
```

---

## Распространённые ошибки

### Синтаксические ошибки XML

Один незакрытый тег ломает весь файл. Всегда проверяйте XML перед развёртыванием.

### Отсутствующие теги в cfglimitsdefinition.xml

Использование `usage` или `value` в types.xml, которые не определены в cfglimitsdefinition.xml, приводит к тому, что предмет молча не спавнится. Проверяйте RPT-логи на предупреждения.

### Слишком высокий nominal

Общий nominal по всем предметам должен оставаться ниже 10 000--15 000. Чрезмерные значения снижают производительность сервера.

### Слишком короткий lifetime

Предметы с очень коротким временем жизни исчезают до того, как игроки их найдут. Используйте минимум `3600` (1 час) для обычных предметов, `28800` (8 часов) для оружия.

### Отсутствующий корневой класс

Предметы, чья иерархия классов не восходит к зарегистрированному корневому классу в `cfgeconomycore.xml`, никогда не заспавнятся, даже с правильными записями в types.xml.

### cfggameplay.json не включён

Файл игнорируется, если `enableCfgGameplayFile = 1` не установлен в `serverDZ.cfg`.

### Неверный type в globals.xml

Использование `type="0"` (целое число) для значения с плавающей точкой, такого как `0.82`, обрезает его до `0`. Используйте `type="1"` для чисел с плавающей точкой.

### Прямое редактирование ванильных файлов

Модификация ванильного types.xml работает, но ломается при обновлениях игры. Предпочтительнее поставлять отдельные файлы типов и регистрировать их через cfgeconomycore, или использовать cfglimitsdefinitionuser.xml для пользовательских тегов.

---

## Лучшие практики

- Поставляйте папку `ServerFiles/` с вашим модом, содержащую предварительно настроенные записи `types.xml`, чтобы администраторы серверов могли копировать их, а не писать с нуля.
- Используйте `cfglimitsdefinitionuser.xml` вместо редактирования ванильного `cfglimitsdefinition.xml` --- ваши дополнения переживут обновления игры.
- Устанавливайте `count_in_hoarder="0"` для обычных предметов (еда, боеприпасы), чтобы накопление не блокировало респавны CE.
- Всегда устанавливайте `enableCfgGameplayFile = 1` в `serverDZ.cfg`, прежде чем ожидать, что изменения в `cfggameplay.json` вступят в силу.
- Держите общий `nominal` по всем записям types.xml ниже 12 000, чтобы избежать деградации производительности CE на заполненных серверах.

---

## Теория и практика

| Концепция | Теория | Реальность |
|-----------|--------|------------|
| `nominal` --- жёсткая цель | CE спавнит ровно столько предметов | CE приближается к nominal со временем, но колеблется в зависимости от взаимодействия игроков, циклов очистки и расстояния до зон |
| `restock=0` означает мгновенный респавн | Предметы появляются сразу после исчезновения | CE обрабатывает пополнение пакетами в циклах (обычно каждые 30--60 секунд), поэтому задержка присутствует всегда, независимо от значения restock |
| `cfggameplay.json` управляет всем геймплеем | Вся настройка здесь | Многие значения геймплея жёстко заданы в скриптах или config.cpp и не могут быть переопределены через cfggameplay.json |
| `init.c` выполняется только при запуске сервера | Одноразовая инициализация | `init.c` выполняется каждый раз при загрузке миссии, включая перезапуски сервера. Персистентным состоянием управляет Hive, а не init.c |
| Множество файлов types.xml чисто объединяются | CE читает все зарегистрированные файлы | Файлы должны быть зарегистрированы в cfgeconomycore.xml через директивы `<ce folder="custom">`. Простое размещение дополнительных XML-файлов в `db/` ничего не даёт |

---

## Совместимость и влияние

- **Мультимод:** Несколько модов могут добавлять записи в types.xml без конфликтов, если имена классов уникальны. Если два мода определяют одно имя класса с разными значениями nominal/lifetime, побеждает последняя загруженная запись.
- **Производительность:** Чрезмерные значения nominal (15 000+) вызывают скачки тиков CE, видимые как падение FPS сервера. Каждый цикл CE перебирает все зарегистрированные типы для проверки условий спавна.
