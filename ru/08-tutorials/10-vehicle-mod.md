# Глава 8.10: Создание мода на пользовательское транспортное средство

[Главная](../../README.md) | [<< Назад: Профессиональный шаблон мода](09-professional-template.md) | **Создание пользовательского транспорта** | [Далее: Создание пользовательской одежды >>](11-clothing-mod.md)

---

> **Краткое описание:** В этом руководстве вы пошагово создадите пользовательский вариант транспортного средства в DayZ, расширив существующее ванильное транспортное средство. Вы определите транспорт в config.cpp, настроите его характеристики и текстуры, напишете скриптовое поведение для дверей и двигателя, добавите его в таблицу спавна сервера с предустановленными деталями и протестируете в игре. В итоге у вас будет полностью управляемый пользовательский вариант Offroad Hatchback с изменёнными характеристиками и внешним видом.

---

## Содержание

- [Что мы создаём](#что-мы-создаём)
- [Предварительные требования](#предварительные-требования)
- [Шаг 1: Создание конфигурации (config.cpp)](#шаг-1-создание-конфигурации-configcpp)
- [Шаг 2: Пользовательские текстуры](#шаг-2-пользовательские-текстуры)
- [Шаг 3: Скриптовое поведение (CarScript)](#шаг-3-скриптовое-поведение-carscript)
- [Шаг 4: Запись в types.xml](#шаг-4-запись-в-typesxml)
- [Шаг 5: Сборка и тестирование](#шаг-5-сборка-и-тестирование)
- [Шаг 6: Доработка](#шаг-6-доработка)
- [Полный справочник по коду](#полный-справочник-по-коду)
- [Лучшие практики](#лучшие-практики)
- [Теория и практика](#теория-и-практика)
- [Что вы изучили](#что-вы-изучили)
- [Типичные ошибки](#типичные-ошибки)

---

## Что мы создаём

Мы создадим транспортное средство под названием **MFM Rally Hatchback** -- модифицированную версию ванильного Offroad Hatchback (Нива) со следующими особенностями:

- Пользовательные перетекстурированные кузовные панели с использованием скрытых выделений (hidden selections)
- Изменённые характеристики двигателя (более высокая максимальная скорость, повышенный расход топлива)
- Скорректированные значения здоровья зон повреждений (более прочный двигатель, более слабые двери)
- Всё стандартное поведение транспорта: открытие дверей, запуск/остановка двигателя, топливо, фары, посадка/высадка экипажа
- Запись в таблице спавна с предустановленными колёсами и деталями

Мы расширяем `OffroadHatchback`, а не создаём транспорт с нуля. Это стандартный рабочий процесс для модов на транспорт, поскольку он наследует модель, анимации, физическую геометрию и всё существующее поведение. Вы переопределяете только то, что хотите изменить.

---

## Предварительные требования

- Работающая структура мода (сначала пройдите [Главу 8.1](01-first-mod.md) и [Главу 8.2](02-custom-item.md))
- Текстовый редактор
- Установленные DayZ Tools (для конвертации текстур, необязательно)
- Базовое понимание работы наследования классов в config.cpp

Ваш мод должен иметь следующую начальную структуру:

```
MyFirstMod/
    mod.cpp
    Scripts/
        config.cpp
    Data/
        config.cpp
```

---

## Шаг 1: Создание конфигурации (config.cpp)

Определения транспортных средств располагаются в `CfgVehicles`, так же как и предметы. Несмотря на название класса, `CfgVehicles` содержит всё -- предметы, здания и собственно транспортные средства. Ключевое отличие для транспорта -- это родительский класс и дополнительная конфигурация зон повреждений, вложений и параметров симуляции.

### Обновление Data config.cpp

Откройте `MyFirstMod/Data/config.cpp` и добавьте класс транспортного средства. Если у вас уже есть определения предметов из Главы 8.2, добавьте класс транспорта внутрь существующего блока `CfgVehicles`.

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

        // --- Скрытые выделения для перетекстурирования ---
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

        // --- Симуляция (физика и двигатель) ---
        class SimulationModule : SimulationModule
        {
            // Тип привода: 0 = задний, 1 = передний, 2 = полный
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

        // --- Зоны повреждений ---
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

### Описание ключевых полей

| Поле | Назначение |
|------|-----------|
| `scope = 2` | Делает транспорт доступным для спавна. Используйте `0` для базовых классов, которые не должны спавниться напрямую. |
| `displayName` | Название, отображаемое в инструментах администратора и в игре. Можно использовать ссылки `$STR_` для локализации. |
| `requiredAddons[]` | Должен включать `"DZ_Vehicles_Wheeled"`, чтобы родительский класс `OffroadHatchback` загружался перед вашим классом. |
| `hiddenSelections[]` | Слоты текстур на модели, которые вы хотите переопределить. Должны совпадать с именованными выделениями модели. |
| `SimulationModule` | Конфигурация физики и двигателя. Управляет скоростью, крутящим моментом, передаточными числами и торможением. |
| `DamageSystem` | Определяет пулы здоровья для каждой части транспорта (двигатель, двери, окна, кузов). |

### О родительском классе

```cpp
class OffroadHatchback;
```

Это предварительное объявление сообщает парсеру конфигурации, что `OffroadHatchback` существует в ванильном DayZ. Ваш транспорт затем наследуется от него, получая полную модель Нивы, анимации, физическую геометрию, точки крепления и определения прокси. Вам нужно переопределить только то, что вы хотите изменить.

Другие ванильные родительские классы транспорта, которые можно расширить:

| Родительский класс | Транспорт |
|-------------------|-----------|
| `OffroadHatchback` | Нива (4-местный хетчбэк) |
| `CivilianSedan` | Ольга (4-местный седан) |
| `Hatchback_02` | Golf/Gunter (4-местный хетчбэк) |
| `Sedan_02` | Sarka 120 (4-местный седан) |
| `Offroad_02` | Humvee (4-местный внедорожник) |
| `Truck_01_Base` | V3S (грузовик) |

### О SimulationModule

`SimulationModule` управляет поведением транспорта при вождении. Ключевые параметры:

| Параметр | Эффект |
|----------|--------|
| `drive` | `0` = задний привод, `1` = передний привод, `2` = полный привод |
| `torqueMax` | Пиковый крутящий момент двигателя в Нм. Больше = больше ускорение. У ванильной Нивы ~114. |
| `powerMax` | Пиковая мощность в лошадиных силах. Больше = выше максимальная скорость. У ванильной Нивы ~68. |
| `rpmRedline` | Красная зона оборотов двигателя. Выше этого значения двигатель упирается в ограничитель. |
| `ratios[]` | Передаточные числа. Меньшие значения = более длинные передачи = выше максимальная скорость, но медленнее ускорение. |
| `transmissionRatio` | Передаточное число главной передачи. Действует как множитель на все передачи. |

### О зонах повреждений

Каждая зона повреждений имеет собственный пул здоровья. Когда здоровье зоны достигает нуля, этот компонент разрушается:

| Зона | Эффект при разрушении |
|------|----------------------|
| `Engine` | Транспорт не может завестись |
| `FuelTank` | Топливо вытекает |
| `Front` / `Rear` | Визуальные повреждения, сниженная защита |
| `Door_1_1` / `Door_2_1` | Дверь отпадает |
| `WindowFront` | Стекло разбивается (влияет на звукоизоляцию) |

Значение `transferToGlobalCoef` определяет, какая доля урона передаётся от этой зоны к общему здоровью транспорта. `1` означает 100% передачу (повреждение двигателя снижает общее здоровье), `0` означает отсутствие передачи.

`componentNames[]` должны совпадать с именованными компонентами в геометрическом LOD транспорта. Поскольку мы наследуем модель Нивы, здесь мы используем имена-заполнители -- геометрические компоненты родительского класса определяют фактическое обнаружение столкновений. Если вы используете ванильную модель без модификаций, маппинг компонентов родителя применяется автоматически.

---

## Шаг 2: Пользовательские текстуры

### Как работают скрытые выделения транспорта

Скрытые выделения транспорта работают так же, как текстуры предметов, но у транспорта обычно больше слотов выделений. Модель Offroad Hatchback использует выделения для различных кузовных панелей, что позволяет создавать цветовые варианты (белый, синий) в ванильной версии.

### Использование ванильных текстур (самый быстрый старт)

Для начального тестирования укажите в скрытых выделениях существующие ванильные текстуры. Это подтвердит, что ваша конфигурация работает, прежде чем создавать пользовательную графику:

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

Пустые строки `""` означают "использовать текстуру модели по умолчанию для этого выделения."

### Создание набора пользовательских текстур

Для создания уникального внешнего вида:

1. **Извлеките ванильную текстуру**, используя Addon Builder из DayZ Tools или P: диск, чтобы найти:
   ```
   P:\DZ\vehicles\wheeled\offroadhatchback\data\niva_body_co.paa
   ```

2. **Конвертируйте в редактируемый формат** с помощью TexView2:
   - Откройте файл `.paa` в TexView2
   - Экспортируйте как `.tga` или `.png`

3. **Отредактируйте в графическом редакторе** (GIMP, Photoshop, Paint.NET):
   - Текстуры транспорта обычно имеют размер **2048x2048** или **4096x4096**
   - Измените цвета, добавьте декали, гоночные полосы или эффекты ржавчины
   - Сохраните UV-развёртку без изменений -- меняйте только цвета и детали

4. **Конвертируйте обратно в `.paa`**:
   - Откройте отредактированное изображение в TexView2
   - Сохраните в формате `.paa`
   - Сохраните в `MyFirstMod/Data/Textures/rally_body_co.paa`

### Соглашения об именовании текстур для транспорта

| Суффикс | Тип | Назначение |
|---------|-----|-----------|
| `_co` | Color (Diffuse) | Основной цвет и внешний вид |
| `_nohq` | Normal Map | Неровности поверхности, линии панелей, детали заклёпок |
| `_smdi` | Specular | Металлический блеск, отражения краски |
| `_as` | Alpha/Surface | Прозрачность для окон |
| `_de` | Destruct | Текстуры наложения повреждений |

Для первого мода на транспорт требуется только текстура `_co`. Модель использует свои карты нормалей и спекулярности по умолчанию.

### Соответствие материалов (необязательно)

Для полного контроля над материалами создайте файл `.rvmat`:

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

## Шаг 3: Скриптовое поведение (CarScript)

Скриптовые классы транспорта управляют звуками двигателя, логикой дверей, поведением посадки/высадки экипажа и анимациями сидений. Поскольку мы расширяем `OffroadHatchback`, мы наследуем всё ванильное поведение и переопределяем только то, что хотим настроить.

### Создание файла скрипта

Создайте структуру папок и файл скрипта:

```
MyFirstMod/
    Scripts/
        config.cpp
        4_World/
            MyFirstMod/
                MFM_RallyHatchback.c
```

### Обновление Scripts config.cpp

Ваш `Scripts/config.cpp` должен зарегистрировать слой `4_World`, чтобы движок загрузил ваш скрипт:

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

### Написание скрипта транспорта

Создайте `4_World/MyFirstMod/MFM_RallyHatchback.c`:

```c
class MFM_RallyHatchback extends OffroadHatchback
{
    void MFM_RallyHatchback()
    {
        // Переопределение звуков двигателя (используем ванильные звуки Нивы)
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

        // Позиция двигателя в пространстве модели (x, y, z) -- используется для
        // источника температуры, обнаружения затопления и эффектов частиц
        SetEnginePos("0 0.7 1.2");
    }

    // --- Экземпляр анимации ---
    // Определяет, какой набор анимаций игрока используется при посадке/высадке.
    // Должен соответствовать скелету транспорта. Поскольку мы используем модель Нивы, оставляем HATCHBACK.
    override int GetAnimInstance()
    {
        return VehicleAnimInstances.HATCHBACK;
    }

    // --- Дистанция камеры ---
    // На каком расстоянии камера от третьего лица располагается за транспортом.
    // У ванильной Нивы 3.5. Увеличьте для более широкого обзора.
    override float GetTransportCameraDistance()
    {
        return 4.0;
    }

    // --- Типы анимаций сидений ---
    // Сопоставляет каждый индекс сиденья с типом анимации игрока.
    // 0 = водитель, 1 = пассажир спереди, 2 = задний левый, 3 = задний правый.
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

    // --- Состояние дверей ---
    // Возвращает, отсутствует ли дверь, открыта или закрыта.
    // Имена слотов (NivaDriverDoors, NivaCoDriverDoors, NivaHood, NivaTrunk)
    // определяются прокси слотов инвентаря модели.
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

    // --- Посадка/высадка экипажа ---
    // Определяет, может ли игрок сесть или выйти из определённого сиденья.
    // Проверяет состояние двери и фазу анимации складывания сиденья.
    // Передние сиденья (0, 1) требуют открытой двери.
    // Задние сиденья (2, 3) требуют открытой двери И откинутого вперёд переднего сиденья.
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

    // --- Проверка капота для вложений ---
    // Предотвращает снятие деталей двигателя, когда капот закрыт.
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

    // --- Доступ к грузу ---
    // Багажник должен быть открыт для доступа к грузовому пространству транспорта.
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

    // --- Доступ к моторному отсеку ---
    // Капот должен быть открыт для отображения слотов вложений двигателя.
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

    // --- Отладочный спавн ---
    // Вызывается при спавне из меню отладки. Спавнит со всеми прикреплёнными деталями
    // и заполненными жидкостями для немедленного тестирования.
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

        // Запасные колёса в грузовом отсеке
        inventory.CreateInInventory("HatchbackWheel");
        inventory.CreateInInventory("HatchbackWheel");
    }
};
```

### Описание ключевых переопределений

**GetAnimInstance** -- Возвращает, какой набор анимаций использует игрок, сидя в транспорте. Значения перечисления:

| Значение | Константа | Тип транспорта |
|----------|-----------|---------------|
| 0 | `CIVVAN` | Фургон |
| 1 | `V3S` | Грузовик V3S |
| 2 | `SEDAN` | Седан Olga |
| 3 | `HATCHBACK` | Хетчбэк Нива |
| 5 | `S120` | Sarka 120 |
| 7 | `GOLF` | Gunter 2 |
| 8 | `HMMWV` | Humvee |

Если вы измените это на неправильное значение, анимация игрока будет проходить сквозь транспорт или выглядеть некорректно. Всегда выбирайте значение, соответствующее используемой модели.

**CrewCanGetThrough** -- Вызывается каждый кадр для определения, может ли игрок войти или выйти из сиденья. Задние сиденья Нивы (индексы 2 и 3) работают иначе, чем передние: спинка переднего сиденья должна быть откинута вперёд (фаза анимации > 0.5), прежде чем задние пассажиры смогут пройти. Это соответствует реальному поведению 2-дверного хетчбэка, где задним пассажирам необходимо откинуть переднее сиденье.

**OnDebugSpawn** -- Вызывается при использовании меню отладочного спавна. `SpawnUniversalParts()` добавляет лампочки фар и автомобильный аккумулятор. `FillUpCarFluids()` заполняет топливо, охлаждающую жидкость, масло и тормозную жидкость до максимума. Затем мы создаём колёса, двери, капот и багажник. Это даёт вам сразу управляемый транспорт для тестирования.

---

## Шаг 4: Запись в types.xml

### Конфигурация спавна транспорта

Транспорт в `types.xml` использует тот же формат, что и предметы, но с некоторыми важными отличиями. Добавьте это в `types.xml` вашего сервера:

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

### Отличия транспорта от предметов в types.xml

| Настройка | Предметы | Транспорт |
|-----------|----------|-----------|
| `nominal` | 10-50+ | 1-5 (транспорт встречается редко) |
| `lifetime` | 3600-14400 | 3888000 (45 дней -- транспорт сохраняется долго) |
| `restock` | 1800 | 0 (транспорт не пополняется автоматически; он респавнится только после уничтожения и деспавна предыдущего) |
| `category` | `tools`, `weapons` и т.д. | `vehicles` |

### Предустановленные детали с cfgspawnabletypes.xml

По умолчанию транспорт спавнится как пустая оболочка -- без колёс, дверей или деталей двигателя. Чтобы они спавнились с предустановленными деталями, добавьте записи в `cfgspawnabletypes.xml` в папке миссии сервера:

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

### Как работает cfgspawnabletypes

Каждый блок `<attachments>` обрабатывается независимо:
- Внешний `chance` определяет, будет ли эта группа вложений рассмотрена вообще
- Каждый `<item>` внутри имеет свой собственный `chance` размещения
- Предметы размещаются в первый доступный подходящий слот на транспорте

Это означает, что транспорт может заспавниться с 3 колёсами и без дверей, или со всеми колёсами и аккумулятором, но без свечи зажигания. Это создаёт игровой цикл поиска ресурсов -- игроки должны найти недостающие детали.

---

## Шаг 5: Сборка и тестирование

### Упаковка PBO

Для этого мода вам нужны два PBO:

```
@MyFirstMod/
    mod.cpp
    Addons/
        Scripts.pbo          <-- Содержит Scripts/config.cpp и 4_World/
        Data.pbo             <-- Содержит Data/config.cpp и Textures/
```

Используйте Addon Builder из DayZ Tools:
1. **Scripts PBO:** Source = `MyFirstMod/Scripts/`, Prefix = `MyFirstMod/Scripts`
2. **Data PBO:** Source = `MyFirstMod/Data/`, Prefix = `MyFirstMod/Data`

Или используйте file patching во время разработки:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

### Спавн транспорта через консоль скриптов

1. Запустите DayZ с загруженным модом
2. Подключитесь к серверу или запустите офлайн-режим
3. Откройте консоль скриптов
4. Чтобы заспавнить полностью укомплектованный транспорт рядом с вашим персонажем:

```c
EntityAI vehicle;
vector pos = GetGame().GetPlayer().GetPosition();
pos[2] = pos[2] + 5;
vehicle = EntityAI.Cast(GetGame().CreateObject("MFM_RallyHatchback", pos, false, false, true));
```

5. Нажмите **Execute**

Транспорт должен появиться в 5 метрах перед вами.

### Спавн готового к поездке транспорта

Для более быстрого тестирования заспавните транспорт и используйте метод отладочного спавна, который прикрепляет все детали:

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

Это вызывает ваше переопределение `OnDebugSpawn()`, которое заполняет жидкости и прикрепляет колёса, двери, капот и багажник.

### Что тестировать

| Проверка | На что обращать внимание |
|----------|------------------------|
| **Транспорт спавнится** | Появляется в мире без ошибок в логе скриптов |
| **Текстуры применены** | Виден пользовательский цвет кузова (при использовании пользовательских текстур) |
| **Двигатель заводится** | Сядьте и удерживайте клавишу запуска двигателя. Слушайте звук запуска. |
| **Вождение** | Ускорение, максимальная скорость, управляемость отличаются от ванильных |
| **Двери** | Можно открывать/закрывать двери водителя и пассажира |
| **Капот/Багажник** | Можно открыть капот для доступа к деталям двигателя. Можно открыть багажник для грузов. |
| **Задние сиденья** | Откиньте переднее сиденье, затем сядьте на заднее |
| **Расход топлива** | Ведите и наблюдайте за указателем топлива |
| **Повреждения** | Стреляйте по транспорту. Детали должны получать урон и в итоге ломаться. |
| **Фары** | Передние и задние фары работают ночью |

### Чтение лога скриптов

Если транспорт не спавнится или ведёт себя некорректно, проверьте лог скриптов по пути:

```
%localappdata%\DayZ\<YourProfile>\script.log
```

Типичные ошибки:

| Сообщение в логе | Причина |
|-----------------|---------|
| `Cannot create object type MFM_RallyHatchback` | Несоответствие имени класса в config.cpp или Data PBO не загружен |
| `Undefined variable 'OffroadHatchback'` | В `requiredAddons` отсутствует `"DZ_Vehicles_Wheeled"` |
| `Member not found` при вызове метода | Опечатка в имени переопределяемого метода |

---

## Шаг 6: Доработка

### Пользовательский звук сигнала

Чтобы дать вашему транспорту уникальный сигнал, определите пользовательские наборы звуков в Data config.cpp:

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

Затем укажите их в конструкторе вашего скрипта:

```c
m_CarHornShortSoundName = "MFM_RallyHornShort_SoundSet";
m_CarHornLongSoundName  = "MFM_RallyHorn_SoundSet";
```

Звуковые файлы должны быть в формате `.ogg`. Путь в `samples[]` НЕ включает расширение файла.

### Пользовательные фары

Вы можете создать пользовательский класс освещения для изменения яркости, цвета или дальности фар:

```c
class MFM_RallyFrontLight extends CarLightBase
{
    void MFM_RallyFrontLight()
    {
        // Ближний свет (раздельный)
        m_SegregatedBrightness = 7;
        m_SegregatedRadius = 65;
        m_SegregatedAngle = 110;
        m_SegregatedColorRGB = Vector(0.9, 0.9, 1.0);

        // Дальний свет (объединённый)
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

Переопределение в классе вашего транспорта:

```c
override CarLightBase CreateFrontLight()
{
    return CarLightBase.Cast(ScriptedLightBase.CreateLight(MFM_RallyFrontLight));
}
```

### Звукоизоляция (OnSound)

Переопределение `OnSound` управляет тем, насколько кабина глушит шум двигателя в зависимости от состояния дверей и окон:

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

Значение `1.0` означает полную изоляцию (тихая кабина), `0.0` означает отсутствие изоляции (ощущение открытого воздуха).

---

## Полный справочник по коду

### Итоговая структура каталогов

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
            rally_horn.ogg           (необязательно)
            rally_horn_short.ogg     (необязательно)
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

### Запись в types.xml серверной миссии

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

### Запись в cfgspawnabletypes.xml серверной миссии

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

## Лучшие практики

- **Всегда расширяйте существующий класс транспорта.** Создание транспорта с нуля требует пользовательской 3D-модели с правильными геометрическими LOD, прокси, точками памяти и конфигурацией физической симуляции. Расширение ванильного транспорта даёт вам всё это бесплатно.
- **Сначала тестируйте с `OnDebugSpawn()`.** Прежде чем настраивать types.xml и cfgspawnabletypes.xml, убедитесь, что транспорт работает, заспавнив его полностью укомплектованным через меню отладки или консоль скриптов.
- **Сохраняйте тот же `GetAnimInstance()`, что и у родителя.** Если вы измените его без соответствующего набора анимаций, игроки будут стоять в Т-позе или проходить сквозь транспорт.
- **Не изменяйте имена слотов дверей.** Нива использует `NivaDriverDoors`, `NivaCoDriverDoors`, `NivaHood`, `NivaTrunk`. Они привязаны к именам прокси модели и определениям слотов инвентаря. Их изменение без изменения модели сломает функциональность дверей.
- **Используйте `scope = 0` для внутренних базовых классов.** Если вы создаёте абстрактный базовый транспорт, от которого наследуются другие варианты, установите `scope = 0`, чтобы он никогда не спавнился напрямую.
- **Правильно устанавливайте `requiredAddons`.** Ваш Data config.cpp должен содержать `"DZ_Vehicles_Wheeled"`, чтобы родительский класс `OffroadHatchback` загружался перед вашим.
- **Тщательно тестируйте логику дверей.** Входите/выходите из каждого сиденья, открывайте/закрывайте каждую дверь, попробуйте получить доступ к моторному отсеку с закрытым капотом. Ошибки в CrewCanGetThrough -- самая распространённая проблема модов на транспорт.

---

## Теория и практика

| Концепция | Теория | Реальность |
|-----------|--------|------------|
| `SimulationModule` в config.cpp | Полный контроль над физикой транспорта | Не все параметры корректно переопределяются при расширении родительского класса. Если ваши изменения скорости/крутящего момента не дают эффекта, попробуйте настроить `transmissionRatio` и `ratios[]` передач вместо простого изменения `torqueMax`. |
| Зоны повреждений с `componentNames[]` | Каждая зона привязана к геометрическому компоненту | При расширении ванильного транспорта имена компонентов родительской модели уже заданы. Ваши значения `componentNames[]` в конфигурации имеют значение, только если вы предоставляете пользовательскую модель. Геометрический LOD родителя определяет фактическое обнаружение попаданий. |
| Пользовательские текстуры через скрытые выделения | Свободная замена любой текстуры | Переопределить можно только выделения, которые автор модели отметил как "скрытые". Если вам нужно перетекстурировать часть, не входящую в `hiddenSelections[]`, необходимо создать новую модель или изменить существующую в Object Builder. |
| Предустановленные детали в `cfgspawnabletypes.xml` | Предметы прикрепляются к подходящим слотам | Если класс колеса несовместим с транспортом (неподходящий слот крепления), он молча не применяется. Всегда используйте детали, которые принимает родительский транспорт -- для Нивы это `HatchbackWheel`, а не `CivSedanWheel`. |
| Звуки двигателя | Установка любого имени SoundSet | Наборы звуков должны быть определены в `CfgSoundSets` где-то в загруженных конфигурациях. Если вы ссылаетесь на несуществующий набор звуков, движок молча использует отсутствие звука -- ошибки в логе не будет. |

---

## Что вы изучили

В этом руководстве вы научились:

- Как определить пользовательский класс транспорта, расширив существующее ванильное транспортное средство в config.cpp
- Как работают зоны повреждений и как настроить значения здоровья для каждого компонента транспорта
- Как скрытые выделения транспорта позволяют перетекстурировать кузов без пользовательской 3D-модели
- Как написать скрипт транспорта с логикой состояния дверей, проверками входа экипажа и поведением двигателя
- Как `types.xml` и `cfgspawnabletypes.xml` работают вместе для спавна транспорта с рандомизированными предустановленными деталями
- Как тестировать транспорт в игре, используя консоль скриптов и метод `OnDebugSpawn()`
- Как добавить пользовательские звуки сигнала и пользовательские классы освещения для фар

**Далее:** Расширьте ваш мод на транспорт пользовательскими моделями дверей, текстурами интерьера или даже полностью новым кузовом с помощью Blender и Object Builder.

---

## Типичные ошибки

### Транспорт спавнится, но сразу проваливается сквозь землю

Физическая геометрия не загружается. Обычно это означает, что в `requiredAddons[]` отсутствует `"DZ_Vehicles_Wheeled"`, поэтому конфигурация физики родительского класса не наследуется.

### Транспорт спавнится, но в него нельзя сесть

Проверьте, что `GetAnimInstance()` возвращает правильное значение перечисления для вашей модели. Если вы расширяете `OffroadHatchback`, но возвращаете `VehicleAnimInstances.SEDAN`, анимация входа нацелена на неправильные позиции дверей, и игрок не может сесть.

### Двери не открываются и не закрываются

Убедитесь, что `GetCarDoorsState()` использует правильные имена слотов. Нива использует `"NivaDriverDoors"`, `"NivaCoDriverDoors"`, `"NivaHood"` и `"NivaTrunk"`. Они должны совпадать точно, включая регистр букв.

### Двигатель заводится, но транспорт не двигается

Проверьте передаточные числа в `SimulationModule`. Если `ratios[]` пуст или содержит нулевые значения, у транспорта нет передач переднего хода. Также убедитесь, что колёса прикреплены -- транспорт без колёс будет газовать, но не двигаться.

### У транспорта нет звука

Звуки двигателя назначаются в конструкторе. Если вы допустите опечатку в имени SoundSet (например, `"offroad_engine_Start_SoundSet"` вместо `"offroad_engine_start_SoundSet"`), движок молча использует отсутствие звука. Имена наборов звуков чувствительны к регистру.

### Пользовательская текстура не отображается

Проверьте три вещи по порядку: (1) имя скрытого выделения точно совпадает с моделью, (2) путь к текстуре использует обратные косые черты в config.cpp, и (3) файл `.paa` находится внутри упакованного PBO. При использовании file patching во время разработки убедитесь, что путь начинается от корня мода, а не является абсолютным путём.

### Задние пассажиры не могут сесть

Задние сиденья Нивы требуют, чтобы переднее сиденье было откинуто вперёд. Если ваше переопределение `CrewCanGetThrough()` для индексов сидений 2 и 3 не проверяет `GetAnimationPhase("SeatDriver")` и `GetAnimationPhase("SeatCoDriver")`, задние пассажиры будут навсегда заблокированы.

### Транспорт спавнится без деталей в мультиплеере

`OnDebugSpawn()` предназначен только для отладки/тестирования. На реальном сервере детали берутся из `cfgspawnabletypes.xml`. Если ваш транспорт спавнится как пустая оболочка, добавьте запись `cfgspawnabletypes.xml`, описанную в Шаге 4.

---

**Предыдущая:** [Глава 8.9: Профессиональный шаблон мода](09-professional-template.md)
