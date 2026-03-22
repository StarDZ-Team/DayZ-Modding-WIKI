# Глава 2.2: Подробный разбор config.cpp

[Главная](../README.md) | [<< Предыдущая: 5-уровневая иерархия скриптов](01-five-layers.md) | **Подробный разбор config.cpp** | [Следующая: mod.cpp и Workshop >>](03-mod-cpp.md)

---

---

## Содержание


- [Обзор](#обзор)
- [Где находится config.cpp](#где-находится-configcpp)
- [Блок CfgPatches](#блок-cfgpatches)
- [Блок CfgMods](#блок-cfgmods)
- [class defs: пути модулей скриптов](#class-defs-пути-модулей-скриптов)
- [class defs: imageSets и widgetStyles](#class-defs-imagesets-и-widgetstyles)
- [Массив defines](#массив-defines)
- [CfgVehicles: определения предметов и сущностей](#cfgvehicles-определения-предметов-и-сущностей)
- [CfgSoundSets и CfgSoundShaders](#cfgsoundsets-и-cfgsoundshaders)
- [CfgAddons: объявления предзагрузки](#cfgaddons-объявления-предзагрузки)
- [Реальные примеры из профессиональных модов](#реальные-примеры-из-профессиональных-модов)
- [Распространённые ошибки](#распространённые-ошибки)
- [Полный шаблон](#полный-шаблон)

---

## Обзор


Мод DayZ обычно содержит один или несколько PBO-файлов, каждый из которых содержит `config.cpp` в корне. Движок считывает эти конфиги при запуске для определения:

1. **От чего зависит ваш мод** (CfgPatches)
2. **Где находятся ваши скрипты** (определения классов CfgMods)
3. **Какие предметы/сущности он добавляет** (CfgVehicles, CfgWeapons и т.д.)
4. **Какие звуки он добавляет** (CfgSoundSets, CfgSoundShaders)
5. **Какие символы препроцессора он определяет** (defines[])

Мод обычно имеет отдельные PBO для разных задач:
- `MyMod/Scripts/config.cpp` --- определения скриптов и пути модулей
- `MyMod/Data/config.cpp` --- определения предметов/транспорта/оружия
- `MyMod/GUI/config.cpp` --- объявления imageset и стилей

---

## Где находится config.cpp


```
@MyMod/
  Addons/
    MyMod_Scripts.pbo         --> содержит Scripts/config.cpp
    MyMod_Data.pbo            --> содержит Data/config.cpp (предметы, транспорт)
    MyMod_GUI.pbo             --> содержит GUI/config.cpp (imagesets, стили)
```

Каждый PBO имеет собственный `config.cpp`. Движок считывает их все. Несколько PBO от одного мода --- обычная практика, а не исключение.

---

## Блок CfgPatches


`CfgPatches` **обязателен** в каждом config.cpp. Он объявляет именованный патч и его зависимости.

### Синтаксис


```cpp
class CfgPatches
{
    class MyMod_Scripts          // Уникальное имя патча (не должно совпадать с другими модами)
    {
        units[] = {};            // Имена классов сущностей, которые добавляет этот PBO (для редактора/спавнера)
        weapons[] = {};          // Имена классов оружия, которое добавляет этот PBO
        requiredVersion = 0.1;   // Минимальная версия игры (на практике всегда 0.1)
        requiredAddons[] =       // Зависимости PBO -- КОНТРОЛИРУЮТ ПОРЯДОК ЗАГРУЗКИ
        {
            "DZ_Data"            // Почти всегда необходим
        };
    };
};
```

### requiredAddons: цепочка зависимостей


Это самое критичное поле во всём конфиге. `requiredAddons` сообщает движку:

1. **Порядок загрузки:** Скрипты вашего PBO компилируются ПОСЛЕ всех перечисленных аддонов
2. **Жёсткая зависимость:** Если перечисленный аддон отсутствует, ваш мод не загрузится

Каждая запись должна совпадать с именем класса `CfgPatches` из другого мода:

| Зависимость | Запись requiredAddons | Когда использовать |
|-----------|---------------------|-------------|
| Ванильные данные DayZ | `"DZ_Data"` | Почти всегда (предметы, конфиги) |
| Ванильные скрипты DayZ | `"DZ_Scripts"` | При расширении ванильных классов скриптов |
| Ванильное оружие | `"DZ_Weapons_Firearms"` | При добавлении оружия/навесного оборудования |
| Ванильные магазины | `"DZ_Weapons_Magazines"` | При добавлении магазинов/боеприпасов |
| Community Framework | `"JM_CF_Scripts"` | При использовании системы модулей CF |
| DabsFramework | `"DF_Scripts"` | При использовании Dabs MVC/фреймворка |
| MyFramework | `"MyCore_Scripts"` | При создании мода MyMod |

**Пример: несколько зависимостей**

```cpp
requiredAddons[] =
{
    "DZ_Scripts",
    "DZ_Data",
    "DZ_Weapons_Firearms",
    "DZ_Weapons_Ammunition",
    "DZ_Weapons_Magazines",
    "MyCore_Scripts"
};
```

### units[] и weapons[]

Эти массивы перечисляют имена классов сущностей и оружия, определённых в этом PBO. Они служат двум целям:

1. Редактор DayZ использует их для заполнения списков спавна
2. Другие инструменты (например, панели администратора) используют их для обнаружения предметов

```cpp
units[] = { "MyMod_SomeBuilding", "MyMod_SomeVehicle" };
weapons[] = { "MyMod_CustomRifle", "MyMod_CustomPistol" };
```

Для PBO, содержащих только скрипты, оставьте оба пустыми.

---

## Блок CfgMods


`CfgMods` необходим, когда ваш PBO добавляет или модифицирует скрипты, ввод или ресурсы GUI. Он определяет идентичность мода и структуру его модулей скриптов.

### Базовая структура

```cpp
class CfgMods
{
    class MyMod                   // Идентификатор мода (используется внутренне)
    {
        dir = "MyMod";            // Корневая директория мода (путь-префикс PBO)
        name = "My Mod Name";     // Читаемое имя
        author = "AuthorName";    // Строка автора
        credits = "AuthorName";   // Строка авторских прав
        creditsJson = "MyMod/Scripts/Data/Credits.json";  // Путь к файлу авторских прав
        versionPath = "MyMod/Scripts/Data/Version.hpp";   // Путь к файлу версии
        overview = "Description"; // Описание мода
        picture = "";             // Путь к изображению логотипа
        action = "";              // URL (веб-сайт/Discord)
        type = "mod";             // "mod" для клиентского, "servermod" для серверного
        extra = 0;                // Зарезервировано, всегда 0
        hideName = 0;             // Скрыть имя мода в лаунчере (0 = показать, 1 = скрыть)
        hidePicture = 0;          // Скрыть изображение мода в лаунчере

        // Определения горячих клавиш (опционально)
        inputs = "MyMod/Scripts/Data/Inputs.xml";

        // Символы препроцессора (опционально)
        defines[] = { "MYMOD_LOADED" };

        // Зависимости модулей скриптов
        dependencies[] = { "Game", "World", "Mission" };

        // Пути модулей скриптов
        class defs
        {
            // ... (рассмотрено в следующем разделе)
        };
    };
};
```

### Пояснение ключевых полей


**`dir`** --- корневой путь-префикс для всех путей файлов в этом конфиге. Когда движок видит `files[] = { "MyMod/Scripts/3_Game" }`, он использует `dir` как базу.

**`type`** --- либо `"mod"` (загружается через `-mod=`), либо `"servermod"` (загружается через `-servermod=`). Серверные моды выполняются только на выделенном сервере. Так вы разделяете серверную логику от клиентского кода.

**`dependencies`** --- какие ванильные модули скриптов расширяет ваш мод. Почти всегда `{ "Game", "World", "Mission" }`. Возможные значения: `"Core"`, `"GameLib"`, `"Game"`, `"World"`, `"Mission"`.

**`inputs`** --- путь к файлу `Inputs.xml`, определяющему пользовательские горячие клавиши. Путь относительный к корню PBO.

---

## class defs: пути модулей скриптов


Блок `class defs` внутри `CfgMods` --- то место, где вы указываете движку, какие папки содержат ваши скрипты для каждого уровня.

### Все доступные модули скриптов


```cpp
class defs
{
    class engineScriptModule        // 1_Core
    {
        value = "";                 // Функция входа (пустая = по умолчанию)
        files[] = { "MyMod/Scripts/1_Core" };
    };
    class gameLibScriptModule       // 2_GameLib (редко используется)
    {
        value = "";
        files[] = { "MyMod/Scripts/2_GameLib" };
    };
    class gameScriptModule          // 3_Game
    {
        value = "";
        files[] = { "MyMod/Scripts/3_Game" };
    };
    class worldScriptModule         // 4_World
    {
        value = "";
        files[] = { "MyMod/Scripts/4_World" };
    };
    class missionScriptModule       // 5_Mission
    {
        value = "";
        files[] = { "MyMod/Scripts/5_Mission" };
    };
};
```

### Поле `value`

Поле `value` указывает имя пользовательской функции входа для данного модуля скриптов. Когда оно пустое (`""`), движок использует точку входа по умолчанию. Когда задано (например, `value = "CreateGameMod"`), движок вызывает эту глобальную функцию при инициализации модуля.

Community Framework использует это:

```cpp
class gameScriptModule
{
    value = "CF_CreateGame";    // Пользовательская точка входа
    files[] = { "JM/CF/Scripts/3_Game" };
};
```

Для большинства модов оставляйте `value` пустым.

### Массив `files`

Каждая запись --- это **путь к директории** (не к отдельным файлам). Движок рекурсивно компилирует все `.c` файлы в указанных директориях:

```cpp
class gameScriptModule
{
    value = "";
    files[] =
    {
        "MyMod/Scripts/3_Game"      // Все .c файлы в этом дереве директорий
    };
};
```

Можно указать несколько директорий. Так работает паттерн «Общая папка»:

```cpp
class gameScriptModule
{
    value = "";
    files[] =
    {
        "MyMod/Scripts/Common",     // Общий код, компилируемый в КАЖДЫЙ модуль
        "MyMod/Scripts/3_Game"      // Код, специфичный для уровня
    };
};
class worldScriptModule
{
    value = "";
    files[] =
    {
        "MyMod/Scripts/Common",     // Тот же общий код, также доступен здесь
        "MyMod/Scripts/4_World"
    };
};
```

### Объявляйте только то, что используете


Не нужно объявлять все пять модулей скриптов. Объявляйте только те, которые ваш мод реально использует:

```cpp
// Простой мод, имеющий только код 3_Game и 5_Mission
class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    class missionScriptModule
    {
        files[] = { "MyMod/Scripts/5_Mission" };
    };
};
```

---

## class defs: imageSets и widgetStyles


Если ваш мод использует пользовательские иконки или стили GUI, объявите их внутри `class defs`:

### imageSets

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "MyMod/GUI/imagesets/icons.imageset",
            "MyMod/GUI/imagesets/items.imageset"
        };
    };
    // ... модули скриптов ...
};
```

ImageSets --- это XML-файлы, которые сопоставляют именованные регионы текстурного атласа с именами спрайтов. После объявления здесь любой скрипт может ссылаться на иконки по имени.

### widgetStyles

```cpp
class defs
{
    class widgetStyles
    {
        files[] =
        {
            "MyMod/GUI/looknfeel/custom.styles"
        };
    };
    // ... модули скриптов ...
};
```

Стили виджетов определяют повторно используемые визуальные свойства (цвета, шрифты, отступы) для виджетов GUI.

### Реальный пример: MyFramework

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "MyFramework/GUI/imagesets/prefabs.imageset",
            "MyFramework/GUI/imagesets/CUI.imageset",
            "MyFramework/GUI/icons/thin.imageset",
            "MyFramework/GUI/icons/light.imageset",
            "MyFramework/GUI/icons/regular.imageset",
            "MyFramework/GUI/icons/solid.imageset",
            "MyFramework/GUI/icons/brands.imageset"
        };
    };
    class widgetStyles
    {
        files[] =
        {
            "MyFramework/GUI/looknfeel/prefabs.styles"
        };
    };
    // ... модули скриптов ...
};
```

---

## Массив defines


Массив `defines[]` в `CfgMods` создаёт символы препроцессора, которые другие моды могут проверять с помощью `#ifdef`:

```cpp
defines[] =
{
    "MYMOD_CORE",           // Другие моды могут использовать: #ifdef MYMOD_CORE
    // "MYMOD_DEBUG"        // Закомментировано = отключено в релизе
};
```

### Варианты использования


**Определение наличия мода между модами:**

```c
// В коде другого мода:
#ifdef MYMOD_CORE
    MyLog.Info("MyMod", "MyFramework detected, enabling integration");
#else
    Print("[MyMod] Running without MyFramework");
#endif
```

**Отладочные/релизные сборки:**

```cpp
defines[] =
{
    "MYMOD_LOADED",
    // "MYMOD_DEBUG",        // Раскомментируйте для отладочного логирования
    // "MYMOD_VERBOSE"       // Раскомментируйте для подробного вывода
};
```

### Реальные примеры


**COT** активно использует defines для флагов функций:

```cpp
defines[] =
{
    "JM_COT",
    "JM_COT_VEHICLE_ONSPAWNVEHICLE",
    "COT_BUGFIX_REF",
    "COT_BUGFIX_REF_UIACTIONS",
    "COT_UIACTIONS_SETWIDTH",
    "COT_REFRESHSTATS_NEW",
    "JM_COT_VEHICLEMANAGER",
    "JM_COT_INVISIBILITY"
};
```

**CF** использует defines для включения/отключения подсистем:

```cpp
defines[] =
{
    "CF_MODULE_CONFIG",
    "CF_EXPRESSION",
    "CF_GHOSTICONS",
    "CF_MODSTORAGE",
    "CF_SURFACES",
    "CF_MODULES"
};
```

---

## CfgVehicles: определения предметов и сущностей


`CfgVehicles` --- основной конфигурационный класс для определения игровых предметов, зданий, транспорта и других сущностей. Несмотря на название «vehicles», он охватывает ВСЕ типы сущностей.

### Базовое определение предмета


```cpp
class CfgVehicles
{
    class ItemBase;                          // Предварительное объявление родительского класса
    class MyMod_CustomItem : ItemBase        // Наследование от ванильной базы
    {
        scope = 2;                           // 0=скрыт, 1=только редактор, 2=публичный
        displayName = "Custom Item";
        descriptionShort = "A custom item.";
        model = "MyMod/Data/Models/item.p3d";
        weight = 500;                        // Граммы
        itemSize[] = { 2, 3 };               // Слоты инвентаря (ширина, высота)
        rotationFlags = 17;                   // Допустимое вращение в инвентаре
        inventorySlot[] = {};                 // В какие слоты прикрепления помещается
    };
};
```

### Значения scope


| Значение | Смысл | Использование |
|-------|---------|-------|
| `0` | Скрыт | Базовые классы, абстрактные родители --- никогда не спавнятся |
| `1` | Только редактор | Виден в редакторе DayZ, но не в обычном геймплее |
| `2` | Публичный | Полностью спавнится, появляется в инструментах администратора и спавнерах |

### Определение здания/структуры

```cpp
class CfgVehicles
{
    class HouseNoDestruct;
    class MyMod_Bunker : HouseNoDestruct
    {
        scope = 2;
        displayName = "Military Bunker";
        model = "MyMod/Data/Models/bunker.p3d";
    };
};
```

### Определение транспорта (упрощённое)

```cpp
class CfgVehicles
{
    class CarScript;
    class MyMod_Truck : CarScript
    {
        scope = 2;
        displayName = "Custom Truck";
        model = "MyMod/Data/Models/truck.p3d";

        class Cargo
        {
            itemsCargoSize[] = { 10, 50 };   // Размеры грузового отсека
        };
    };
};
```

### Пример сущности DabsFramework

```cpp
class CfgVehicles
{
    class HouseNoDestruct;
    class NetworkLightBase : HouseNoDestruct
    {
        scope = 1;
    };
    class NetworkPointLight : NetworkLightBase
    {
        scope = 1;
    };
    class NetworkSpotLight : NetworkLightBase
    {
        scope = 1;
    };
};
```

---

## CfgSoundSets и CfgSoundShaders


Пользовательское аудио требует совместной работы двух классов конфигурации: SoundShader (ссылка на аудиофайл) и SoundSet (конфигурация воспроизведения).

### CfgSoundShaders

```cpp
class CfgSoundShaders
{
    class MyMod_Alert_SoundShader
    {
        samples[] = {{ "MyMod/Sounds/alert", 1 }};  // Путь к файлу .ogg, вероятность
        volume = 0.8;                                 // Базовая громкость (0.0 до 1.0)
        range = 50;                                   // Дальность слышимости в метрах (только 3D)
        limitation = 0;                               // 0 = без ограничения одновременных воспроизведений
    };
};
```

Массив `samples` использует двойные фигурные скобки. Каждая запись --- `{ "путь_без_расширения", вероятность }`. При нескольких записях движок выбирает случайно на основе весов вероятности.

### CfgSoundSets

```cpp
class CfgSoundSets
{
    class MyMod_Alert_SoundSet
    {
        soundShaders[] = { "MyMod_Alert_SoundShader" };
        volumeFactor = 1.0;                           // Множитель громкости шейдера
        frequencyFactor = 1.0;                        // Множитель высоты тона
        spatial = 1;                                  // 0 = 2D (звуки UI), 1 = 3D (мировые)
    };
};
```

### Воспроизведение звуков в скрипте


```c
// 2D звук UI (spatial = 0)
SEffectManager.PlaySound("MyMod_Alert_SoundSet", vector.Zero);

// 3D мировой звук (spatial = 1)
SEffectManager.PlaySound("MyMod_Alert_SoundSet", GetPosition());
```

### Реальный пример: звуковой сигнал рации MyMissions Mod

```cpp
class CfgSoundShaders
{
    class MyBeep_SoundShader
    {
        samples[] = {{ "MyMissions\Sounds\bip", 1 }};
        volume = 0.6;
        range = 5;
        limitation = 0;
    };
};

class CfgSoundSets
{
    class MyBeep_SoundSet
    {
        soundShaders[] = { "MyBeep_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 0;      // 2D -- воспроизводится как звук UI
    };
};
```

---

## CfgAddons: объявления предзагрузки


`CfgAddons` --- необязательный блок, подсказывающий движку о предзагрузке ресурсов:

```cpp
class CfgAddons
{
    class PreloadAddons
    {
        class MyMod
        {
            list[] = {};       // Список имён аддонов для предзагрузки (обычно пустой)
        };
    };
};
```

На практике большинство модов объявляют это с пустым `list[]`. Это гарантирует, что движок распознаёт мод на этапе предзагрузки. Некоторые моды пропускают его полностью без проблем.

---

## Реальные примеры из профессиональных модов


### MyFramework (только скрипты, фреймворк)

```cpp
class CfgPatches
{
    class MyCore_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Scripts" };
    };
};

class CfgMods
{
    class MyMod
    {
        name = "MyFramework";
        dir = "MyFramework";
        author = "MyMod Team";
        overview = "MyFramework - Central Admin Panel and Shared Library";
        inputs = "MyFramework/Scripts/Inputs.xml";
        creditsJson = "MyFramework/Scripts/Credits.json";
        type = "mod";
        defines[] = { "MYMOD_CORE" };
        dependencies[] = { "Core", "Game", "World", "Mission" };

        class defs
        {
            class imageSets
            {
                files[] =
                {
                    "MyFramework/GUI/imagesets/prefabs.imageset",
                    "MyFramework/GUI/imagesets/CUI.imageset",
                    "MyFramework/GUI/icons/thin.imageset",
                    "MyFramework/GUI/icons/light.imageset",
                    "MyFramework/GUI/icons/regular.imageset",
                    "MyFramework/GUI/icons/solid.imageset",
                    "MyFramework/GUI/icons/brands.imageset"
                };
            };
            class widgetStyles
            {
                files[] =
                {
                    "MyFramework/GUI/looknfeel/prefabs.styles"
                };
            };
            class engineScriptModule
            {
                files[] = { "MyFramework/Scripts/1_Core" };
            };
            class gameScriptModule
            {
                files[] = { "MyFramework/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                files[] = { "MyFramework/Scripts/4_World" };
            };
            class missionScriptModule
            {
                files[] = { "MyFramework/Scripts/5_Mission" };
            };
        };
    };
};
```

### COT (зависит от CF, использует общую папку)

```cpp
class CfgPatches
{
    class JM_COT_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "JM_CF_Scripts", "JM_COT_GUI", "DZ_Data" };
    };
};

class CfgMods
{
    class JM_CommunityOnlineTools
    {
        dir = "JM";
        name = "Community Online Tools";
        credits = "Jacob_Mango, DannyDog, Arkensor";
        creditsJson = "JM/COT/Scripts/Data/Credits.json";
        author = "Jacob_Mango";
        versionPath = "JM/COT/Scripts/Data/Version.hpp";
        inputs = "JM/COT/Scripts/Data/Inputs.xml";
        type = "mod";
        defines[] = { "JM_COT", "JM_COT_VEHICLEMANAGER", "JM_COT_INVISIBILITY" };
        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class engineScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",     // Общий код
                    "JM/COT/Scripts/1_Core"
                };
            };
            class gameScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",
                    "JM/COT/Scripts/3_Game"
                };
            };
            class worldScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",
                    "JM/COT/Scripts/4_World"
                };
            };
            class missionScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",
                    "JM/COT/Scripts/5_Mission"
                };
            };
        };
    };
};
```

### Серверный мод MyMissions (только серверный мод)

```cpp
class CfgPatches
{
    class SDZS_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Scripts", "MyScripts", "MyCore_Scripts" };
    };
};

class CfgMods
{
    class MyMissionsServer
    {
        name = "MyMissions Mod Server";
        dir = "MyMissions_Server";
        author = "MyMod";
        type = "servermod";              // <-- Только серверный мод
        defines[] = { "MYMOD_MISSIONS" };
        dependencies[] = { "Core", "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                files[] = { "MyMissions_Server/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                files[] = { "MyMissions_Server/Scripts/4_World" };
            };
            class missionScriptModule
            {
                files[] = { "MyMissions_Server/Scripts/5_Mission" };
            };
        };
    };
};
```

### DabsFramework (использует gameLibScriptModule + CfgVehicles)

```cpp
class CfgPatches
{
    class DF_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "DF_GUI" };
    };
};

class CfgMods
{
    class DabsFramework
    {
        name = "Dabs Framework";
        dir = "DabsFramework";
        credits = "InclementDab";
        author = "InclementDab";
        creditsJson = "DabsFramework/Scripts/Credits.json";
        versionPath = "DabsFramework/Scripts/Version.hpp";
        type = "mod";
        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class imageSets
            {
                files[] =
                {
                    "DabsFramework/gui/imagesets/prefabs.imageset",
                    "DabsFramework/gui/icons/brands.imageset",
                    "DabsFramework/gui/icons/light.imageset",
                    "DabsFramework/gui/icons/regular.imageset",
                    "DabsFramework/gui/icons/solid.imageset",
                    "DabsFramework/gui/icons/thin.imageset"
                };
            };
            class widgetStyles
            {
                files[] =
                {
                    "DabsFramework/gui/looknfeel/prefabs.styles"
                };
            };
            class engineScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/1_core" };
            };
            class gameLibScriptModule      // Редкость: Dabs использует уровень 2
            {
                value = "";
                files[] = { "DabsFramework/scripts/2_GameLib" };
            };
            class gameScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/5_Mission" };
            };
        };
    };
};

class CfgVehicles
{
    class HouseNoDestruct;
    class NetworkLightBase : HouseNoDestruct
    {
        scope = 1;
    };
    class NetworkPointLight : NetworkLightBase
    {
        scope = 1;
    };
    class NetworkSpotLight : NetworkLightBase
    {
        scope = 1;
    };
};
```

---

## Распространённые ошибки


### 1. Неправильный requiredAddons --- мод загружается до своей зависимости

```cpp
// НЕПРАВИЛЬНО: Отсутствует зависимость от CF, поэтому ваш мод может загрузиться до CF
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = { "DZ_Data" };  // CF не указан!
    };
};

// ПРАВИЛЬНО: Объявите ВСЕ зависимости
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = { "DZ_Data", "JM_CF_Scripts" };
    };
};
```

**Симптом:** Ошибки неопределённого типа для классов из зависимости. Мод загрузился до компиляции зависимости.

### 2. Отсутствующие пути модулей скриптов

```cpp
// НЕПРАВИЛЬНО: У вас есть папка Scripts/4_World/, но вы забыли объявить её
class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    // 4_World отсутствует! Все .c файлы в 4_World/ игнорируются.
};

// ПРАВИЛЬНО: Объявите каждый используемый уровень
class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    class worldScriptModule
    {
        files[] = { "MyMod/Scripts/4_World" };
    };
};
```

**Симптом:** Определённые вами классы просто не существуют. Без ошибки --- они молча не компилируются.

### 3. Неправильные пути файлов (чувствительность к регистру)

Хотя Windows нечувствительна к регистру, пути DayZ могут быть чувствительны к регистру в определённых контекстах (серверы Linux, упаковка PBO):

```cpp
// РИСКОВАННО: Смешанный регистр, который может не сработать на Linux
files[] = { "mymod/scripts/3_game" };   // Папка на самом деле "MyMod/Scripts/3_Game"

// БЕЗОПАСНО: Точное совпадение регистра директории
files[] = { "MyMod/Scripts/3_Game" };
```

### 4. Коллизия имён классов CfgPatches

```cpp
// НЕПРАВИЛЬНО: Использование общего имени, которое может совпасть с другим модом
class CfgPatches
{
    class Scripts              // Слишком обобщённо! Будет коллизия.
    {
        // ...
    };
};

// ПРАВИЛЬНО: Используйте уникальный префикс
class CfgPatches
{
    class MyMod_Scripts        // Уникально для вашего мода
    {
        // ...
    };
};
```

### 5. Циклический requiredAddons

```cpp
// config.cpp ModA
requiredAddons[] = { "ModB_Scripts" };

// config.cpp ModB
requiredAddons[] = { "ModA_Scripts" };  // ЦИКЛ! Движок не может разрешить.
```

### 6. Объявление dependencies[] без соответствующих модулей скриптов

```cpp
// НЕПРАВИЛЬНО: Указали "World" как зависимость, но нет worldScriptModule
dependencies[] = { "Game", "World", "Mission" };

class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    // Нет worldScriptModule --- зависимость "World" вводит в заблуждение
    class missionScriptModule
    {
        files[] = { "MyMod/Scripts/5_Mission" };
    };
};
```

Это не вызывает ошибку, но вводит в заблуждение. Указывайте только реально используемые зависимости.

### 7. Размещение CfgVehicles в Scripts config.cpp

Это работает, но считается плохой практикой. Храните определения предметов/сущностей в отдельном PBO (`Data/config.cpp`), а определения скриптов --- в `Scripts/config.cpp`.

---

## Полный шаблон


Вот готовый к продакшену шаблон `Scripts/config.cpp`, который можно скопировать и модифицировать:

```cpp
// ============================================================================
// Scripts/config.cpp -- Определения модулей скриптов MyMod
// ============================================================================

class CfgPatches
{
    class MyMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Scripts"
            // Добавьте зависимости фреймворка здесь:
            // "JM_CF_Scripts",         // Community Framework
            // "MyCore_Scripts",      // MyFramework
        };
    };
};

class CfgMods
{
    class MyMod
    {
        dir = "MyMod";
        name = "My Mod";
        author = "YourName";
        credits = "YourName";
        creditsJson = "MyMod/Scripts/Data/Credits.json";
        overview = "A brief description of what this mod does.";
        type = "mod";

        defines[] =
        {
            "MYMOD_LOADED"
            // "MYMOD_DEBUG"      // Раскомментируйте для отладочных сборок
        };

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class imageSets
            {
                files[] = {};     // Добавьте пути .imageset сюда
            };

            class widgetStyles
            {
                files[] = {};     // Добавьте пути .styles сюда
            };

            class gameScriptModule
            {
                value = "";
                files[] = { "MyMod/Scripts/3_Game" };
            };

            class worldScriptModule
            {
                value = "";
                files[] = { "MyMod/Scripts/4_World" };
            };

            class missionScriptModule
            {
                value = "";
                files[] = { "MyMod/Scripts/5_Mission" };
            };
        };
    };
};
```

---

**Предыдущая:** [Глава 2.1: 5-уровневая иерархия скриптов](01-five-layers.md)
**Следующая:** [Глава 2.3: mod.cpp и Workshop](03-mod-cpp.md)
