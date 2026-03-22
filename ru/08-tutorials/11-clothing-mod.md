# Глава 8.11: Создание пользовательской одежды

[Главная](../README.md) | [<< Назад: Создание пользовательского транспорта](10-vehicle-mod.md) | **Создание пользовательской одежды** | [Далее: Создание торговой системы >>](12-trading-system.md)

---

> **Краткое содержание:** Это руководство проведёт вас через создание пользовательской тактической куртки для DayZ. Вы выберете базовый класс, определите одежду в config.cpp со свойствами теплоизоляции и грузоподъёмности, перетекстурируете её камуфляжным узором с помощью скрытых выделений, добавите локализацию и спавн, а также по желанию расширите её скриптовым поведением. В конце у вас будет носимая куртка, которая согревает игроков, вмещает предметы и появляется в мире.

---

## Содержание

- [Что мы создаём](#what-we-are-building)
- [Шаг 1: Выбор базового класса](#step-1-choose-a-base-class)
- [Шаг 2: config.cpp для одежды](#step-2-configcpp-for-clothing)
- [Шаг 3: Создание текстур](#step-3-create-textures)
- [Шаг 4: Добавление грузового пространства](#step-4-add-cargo-space)
- [Шаг 5: Локализация и спавн](#step-5-localization-and-spawning)
- [Шаг 6: Скриптовое поведение (необязательно)](#step-6-script-behavior-optional)
- [Шаг 7: Сборка, тестирование, полировка](#step-7-build-test-polish)
- [Полный справочник кода](#complete-code-reference)
- [Типичные ошибки](#common-mistakes)
- [Лучшие практики](#best-practices)
- [Теория и практика](#theory-vs-practice)
- [Что вы узнали](#what-you-learned)

---

## Что мы создаём

Мы создадим **тактическую камуфляжную куртку** -- военную куртку с лесным камуфляжем, которую игроки смогут находить и носить. Она будет:

- Расширять ванильную модель куртки Горка (3D-моделирование не требуется)
- Иметь пользовательную камуфляжную перетекстуровку с помощью скрытых выделений
- Обеспечивать тепло через значения `heatIsolation`
- Вмещать предметы в карманах (грузовое пространство)
- Получать повреждения с визуальной деградацией по уровням здоровья
- Появляться в военных локациях мира

**Предварительные требования:** Рабочая структура мода (сначала пройдите [Главу 8.1](01-first-mod.md) и [Главу 8.2](02-custom-item.md)), текстовый редактор, установленные DayZ Tools (для TexView2) и графический редактор для создания камуфляжных текстур.

---

## Шаг 1: Выбор базового класса

Одежда в DayZ наследуется от `Clothing_Base`, но напрямую расширять его почти никогда не нужно. DayZ предоставляет промежуточные базовые классы для каждого слота тела:

| Базовый класс | Слот тела | Примеры |
|------------|-----------|----------|
| `Top_Base` | Тело (торс) | Куртки, рубашки, худи |
| `Pants_Base` | Ноги | Джинсы, карго-штаны |
| `Shoes_Base` | Ступни | Ботинки, кроссовки |
| `HeadGear_Base` | Голова | Шлемы, шапки |
| `Mask_Base` | Лицо | Противогазы, балаклавы |
| `Gloves_Base` | Руки | Тактические перчатки |
| `Vest_Base` | Слот жилета | Бронежилеты, разгрузки |
| `Glasses_Base` | Очки | Солнцезащитные очки |
| `Backpack_Base` | Спина | Рюкзаки, сумки |

Полная цепочка наследования: `Clothing_Base -> Clothing -> Top_Base -> GorkaEJacket_ColorBase -> YourJacket`

### Зачем расширять существующий ванильный предмет

Вы можете расширять на разных уровнях:

1. **Расширить конкретный предмет** (например, `GorkaEJacket_ColorBase`) -- самый простой способ. Вы наследуете модель, анимации, слот и все свойства. Нужно лишь изменить текстуры и подстроить значения. Именно так работает пример Bohemia `Test_ClothingRetexture`.
2. **Расширить базовый класс слота** (например, `Top_Base`) -- чистая отправная точка, но необходимо указать модель и все свойства.
3. **Расширить `Clothing` напрямую** -- только для полностью пользовательского поведения слота. Требуется крайне редко.

Для нашей тактической куртки мы расширим `GorkaEJacket_ColorBase`. Посмотрим на ванильный скрипт:

```c
class GorkaEJacket_ColorBase extends Top_Base
{
    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
class GorkaEJacket_Summer extends GorkaEJacket_ColorBase {};
class GorkaEJacket_Flat extends GorkaEJacket_ColorBase {};
```

Обратите внимание на паттерн: класс `_ColorBase` обрабатывает общее поведение, а отдельные цветовые варианты расширяют его без дополнительного кода. Их записи в config.cpp предоставляют различные текстуры. Мы будем следовать тому же паттерну.

Чтобы найти базовые классы, смотрите `scripts/4_world/entities/itembase/clothing_base.c` (определяет все базы слотов) и `scripts/4_world/entities/itembase/clothing/` (один файл на семейство одежды).

---

## Шаг 2: config.cpp для одежды

Создайте `MyClothingMod/Data/config.cpp`:

```cpp
class CfgPatches
{
    class MyClothingMod_Data
    {
        units[] = { "MCM_TacticalJacket_Woodland" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Characters_Tops" };
    };
};

class CfgVehicles
{
    class GorkaEJacket_ColorBase;

    class MCM_TacticalJacket_ColorBase : GorkaEJacket_ColorBase
    {
        scope = 0;
        displayName = "";
        descriptionShort = "";

        weight = 1800;
        itemSize[] = { 3, 4 };
        absorbency = 0.3;
        heatIsolation = 0.8;
        visibilityModifier = 0.7;

        repairableWithKits[] = { 5, 2 };
        repairCosts[] = { 30.0, 25.0 };

        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 200;
                    healthLevels[] =
                    {
                        { 1.0,  { "DZ\characters\tops\Data\GorkaUpper.rvmat" } },
                        { 0.70, { "DZ\characters\tops\Data\GorkaUpper.rvmat" } },
                        { 0.50, { "DZ\characters\tops\Data\GorkaUpper_damage.rvmat" } },
                        { 0.30, { "DZ\characters\tops\Data\GorkaUpper_damage.rvmat" } },
                        { 0.01, { "DZ\characters\tops\Data\GorkaUpper_destruct.rvmat" } }
                    };
                };
            };
            class GlobalArmor
            {
                class Melee
                {
                    class Health    { damage = 0.8; };
                    class Blood     { damage = 0.8; };
                    class Shock     { damage = 0.8; };
                };
                class Infected
                {
                    class Health    { damage = 0.8; };
                    class Blood     { damage = 0.8; };
                    class Shock     { damage = 0.8; };
                };
            };
        };

        class EnvironmentWetnessIncrements
        {
            class Soaking
            {
                rain = 0.015;
                water = 0.1;
            };
            class Drying
            {
                playerHeat = -0.08;
                fireBarrel = -0.25;
                wringing = -0.15;
            };
        };
    };

    class MCM_TacticalJacket_Woodland : MCM_TacticalJacket_ColorBase
    {
        scope = 2;
        displayName = "$STR_MCM_TacticalJacket_Woodland";
        descriptionShort = "$STR_MCM_TacticalJacket_Woodland_Desc";
        hiddenSelectionsTextures[] =
        {
            "MyClothingMod\Data\Textures\tactical_jacket_g_woodland_co.paa",
            "MyClothingMod\Data\Textures\tactical_jacket_woodland_co.paa",
            "MyClothingMod\Data\Textures\tactical_jacket_woodland_co.paa"
        };
    };
};
```

### Поля, специфичные для одежды

**Тепло и скрытность:**

| Поле | Значение | Описание |
|-------|-------|-------------|
| `heatIsolation` | `0.8` | Обеспечиваемое тепло (диапазон 0.0-1.0). Движок умножает это на коэффициенты здоровья и влажности. Чистая сухая куртка даёт полное тепло; разрушенная, мокрая -- почти ничего. |
| `visibilityModifier` | `0.7` | Видимость игрока для ИИ (ниже = сложнее обнаружить). |
| `absorbency` | `0.3` | Впитывание воды (0 = водонепроницаемый, 1 = губка). Чем меньше -- тем лучше защита от дождя. |

**Справочные значения ванильного heatIsolation:** Футболка 0.2, Худи 0.5, Куртка Горка 0.7, Полевая куртка 0.8, Шерстяное пальто 0.9.

**Ремонт:** `repairableWithKits[] = { 5, 2 }` перечисляет типы наборов (5=Швейный набор, 2=Набор для кожи). `repairCosts[]` указывает расход материала на ремонт в соответствующем порядке.

**Броня:** Значение `damage` равное 0.8 означает, что игрок получает 80% входящего урона (20% поглощается). Меньшие значения = больше защиты.

**Влажность:** `Soaking` контролирует скорость намокания от дождя/воды. Отрицательные значения `Drying` представляют потерю влаги от тепла тела, костров и выжимания.

**Скрытые выделения:** Модель Горки имеет 3 выделения -- индекс 0 это наземная модель, индексы 1 и 2 -- модель при ношении. Вы переопределяете `hiddenSelectionsTextures[]` своими путями к PAA.

**Уровни здоровья:** Каждая запись -- это `{ порогЗдоровья, { путьМатериала } }`. Когда здоровье падает ниже порога, движок подменяет материал. Ванильные damage rvmat добавляют следы износа и разрывы.

---

## Шаг 3: Создание текстур

### Поиск и создание текстур

Текстуры куртки Горки находятся в `DZ\characters\tops\data\` -- извлеките `gorka_upper_summer_co.paa` (цвет), `gorka_upper_nohq.paa` (нормали) и `gorka_upper_smdi.paa` (зеркальность) с диска P:, чтобы использовать как шаблоны.

**Создание камуфляжного узора:**

1. Откройте ванильную текстуру `_co` в TexView2, экспортируйте как TGA/PNG
2. Нарисуйте лесной камуфляж в графическом редакторе, следуя UV-развёртке
3. Сохраните те же размеры (обычно 2048x2048 или 1024x1024)
4. Сохраните как TGA, конвертируйте в PAA через TexView2 (File > Save As > .paa)

### Типы текстур

| Суффикс | Назначение | Обязательно? |
|--------|---------|-----------|
| `_co` | Основной цвет/узор | Да |
| `_nohq` | Карта нормалей (детали ткани) | Нет -- используется ванильная по умолчанию |
| `_smdi` | Зеркальность (блеск) | Нет -- используется ванильная по умолчанию |
| `_as` | Альфа/маска поверхности | Нет |

Для ретекстуры вам нужны только текстуры `_co`. Карты нормалей и зеркальности из ванильной модели продолжают работать.

Для полного контроля над материалами создайте файлы `.rvmat` и укажите их в `hiddenSelectionsMaterials[]`. См. пример Bohemia `Test_ClothingRetexture` для рабочих примеров rvmat с вариантами повреждений и разрушений.

---

## Шаг 4: Добавление грузового пространства

При расширении `GorkaEJacket_ColorBase` вы наследуете его сетку инвентаря (4x3) и слот инвентаря (`"Body"`) автоматически. Свойство `itemSize[] = { 3, 4 }` определяет размер куртки при хранении как лута -- а НЕ её грузоподъёмность.

Распространённые слоты одежды: `"Body"` (куртки), `"Legs"` (штаны), `"Feet"` (ботинки), `"Headgear"` (головные уборы), `"Vest"` (разгрузки), `"Gloves"`, `"Mask"`, `"Back"` (рюкзаки).

Некоторая одежда принимает присоединения (например, подсумки бронежилета). Добавьте их с помощью `attachments[] = { "Shoulder", "Armband" };`. Для базовой куртки наследуемого грузового пространства достаточно.

---

## Шаг 5: Локализация и спавн

### Таблица строк

Создайте `MyClothingMod/Data/Stringtable.csv`:

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MCM_TacticalJacket_Woodland","Tactical Jacket (Woodland)","","","","","","","","","","","","",""
"STR_MCM_TacticalJacket_Woodland_Desc","A rugged tactical jacket with woodland camouflage. Provides good insulation and has multiple pockets.","","","","","","","","","","","","",""
```

### Спавн (types.xml)

Добавьте в `types.xml` папки миссии вашего сервера:

```xml
<type name="MCM_TacticalJacket_Woodland">
    <nominal>8</nominal>
    <lifetime>14400</lifetime>
    <restock>3600</restock>
    <min>3</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="clothes" />
    <usage name="Military" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

Используйте `category name="clothes"` для всей одежды. Установите `usage` в соответствии с местом появления (Military, Town, Police и т.д.) и `value` для тира карты (Tier1=побережье, Tier4=глубинка).

---

## Шаг 6: Скриптовое поведение (необязательно)

Для простой ретекстуры скрипты не нужны. Но чтобы добавить поведение при ношении куртки, создайте скриптовый класс.

### Scripts config.cpp

```cpp
class CfgPatches
{
    class MyClothingMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Characters_Tops" };
    };
};

class CfgMods
{
    class MyClothingMod
    {
        dir = "MyClothingMod";
        name = "My Clothing Mod";
        author = "YourName";
        type = "mod";
        dependencies[] = { "World" };
        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyClothingMod/Scripts/4_World" };
            };
        };
    };
};
```

### Скрипт пользовательской куртки

Создайте `Scripts/4_World/MyClothingMod/MCM_TacticalJacket.c`:

```c
class MCM_TacticalJacket_ColorBase extends GorkaEJacket_ColorBase
{
    override void OnWasAttached(EntityAI parent, int slot_id)
    {
        super.OnWasAttached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Player equipped Tactical Jacket");
        }
    }

    override void OnWasDetached(EntityAI parent, int slot_id)
    {
        super.OnWasDetached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Player removed Tactical Jacket");
        }
    }

    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
```

### Ключевые события одежды

| Событие | Когда срабатывает | Типичное применение |
|-------|---------------|------------|
| `OnWasAttached(parent, slot_id)` | Игрок экипирует предмет | Применить баффы, показать эффекты |
| `OnWasDetached(parent, slot_id)` | Игрок снимает предмет | Убрать баффы, очистить |
| `EEItemAttached(item, slot_name)` | Предмет прикреплён к этой одежде | Показать/скрыть выделения модели |
| `EEItemDetached(item, slot_name)` | Предмет отсоединён от этой одежды | Отменить визуальные изменения |
| `EEHealthLevelChanged(old, new, zone)` | Здоровье пересекает порог | Обновить визуальное состояние |

**Важно:** Всегда вызывайте `super` в начале каждого переопределения. Родительский класс обрабатывает критическое поведение движка.

---

## Шаг 7: Сборка, тестирование, полировка

### Сборка и спавн

Упакуйте `Data/` и `Scripts/` как отдельные PBO. Запустите DayZ с вашим модом и заспавните куртку:

```c
GetGame().GetPlayer().GetInventory().CreateInInventory("MCM_TacticalJacket_Woodland");
```

### Чек-лист проверки

1. **Появляется ли в инвентаре?** Если нет, проверьте `scope=2` и соответствие имени класса.
2. **Правильная текстура?** Текстура Горки по умолчанию = неверные пути. Белый/розовый = отсутствует файл текстуры.
3. **Можно ли экипировать?** Должна идти в слот Body. Если нет, проверьте цепочку родительских классов.
4. **Отображается ли имя?** Если вы видите сырой текст `$STR_`, таблица строк не загружается.
5. **Обеспечивает ли тепло?** Проверьте `heatIsolation` в меню отладки/инспекции.
6. **Деградируют ли текстуры при повреждении?** Протестируйте с помощью: `ItemBase.Cast(GetGame().GetPlayer().GetItemOnSlot("Body")).SetHealth("", "", 40);`

### Добавление цветовых вариантов

Следуйте паттерну `_ColorBase` -- добавьте родственные классы, отличающиеся только текстурами:

```cpp
class MCM_TacticalJacket_Desert : MCM_TacticalJacket_ColorBase
{
    scope = 2;
    displayName = "$STR_MCM_TacticalJacket_Desert";
    descriptionShort = "$STR_MCM_TacticalJacket_Desert_Desc";
    hiddenSelectionsTextures[] =
    {
        "MyClothingMod\Data\Textures\tactical_jacket_g_desert_co.paa",
        "MyClothingMod\Data\Textures\tactical_jacket_desert_co.paa",
        "MyClothingMod\Data\Textures\tactical_jacket_desert_co.paa"
    };
};
```

Каждый вариант нуждается в собственных `scope=2`, отображаемом имени, текстурах, записях в таблице строк и записи в types.xml.

---

## Полный справочник кода

### Структура каталогов

```
MyClothingMod/
    mod.cpp
    Data/
        config.cpp              <-- Определения предметов (см. Шаг 2)
        Stringtable.csv         <-- Отображаемые имена (см. Шаг 5)
        Textures/
            tactical_jacket_woodland_co.paa
            tactical_jacket_g_woodland_co.paa
    Scripts/                    <-- Нужно только для скриптового поведения
        config.cpp              <-- Запись CfgMods (см. Шаг 6)
        4_World/
            MyClothingMod/
                MCM_TacticalJacket.c
```

### mod.cpp

```cpp
name = "My Clothing Mod";
author = "YourName";
version = "1.0";
overview = "Adds a tactical jacket with camo variants to DayZ.";
```

Все остальные файлы показаны полностью в соответствующих шагах выше.

---

## Типичные ошибки

| Ошибка | Последствие | Исправление |
|---------|-------------|-----|
| Отсутствие `scope=2` на вариантах | Предмет не спавнится и не появляется в админ-инструментах | Установите `scope=0` на базовом, `scope=2` на каждом спавнящемся варианте |
| Неправильное количество текстур в массиве | Белые/розовые текстуры на некоторых частях | Сопоставьте количество `hiddenSelectionsTextures` со скрытыми выделениями модели (у Горки их 3) |
| Прямые слеши в путях текстур | Текстуры не загружаются без сообщений | Используйте обратные слеши: `"MyMod\Data\tex.paa"` |
| Отсутствие `requiredAddons` | Парсер конфига не может найти родительский класс | Включите `"DZ_Characters_Tops"` для верхней одежды |
| `heatIsolation` выше 1.0 | Игрок перегревается в тёплую погоду | Держите значения в диапазоне 0.0-1.0 |
| Пустые материалы `healthLevels` | Нет визуальной деградации при повреждении | Всегда указывайте хотя бы ванильные rvmat |
| Пропуск `super` в переопределениях | Сломанный инвентарь, повреждения или поведение присоединений | Всегда вызывайте `super.MethodName()` первым |

---

## Лучшие практики

- **Начните с простой ретекстуры.** Получите работающий мод с заменой текстуры, прежде чем добавлять пользовательские свойства или скрипты. Это изолирует проблемы конфигурации от проблем текстур.
- **Используйте паттерн _ColorBase.** Общие свойства в базе с `scope=0`, только текстуры и имена в вариантах с `scope=2`. Никакого дублирования.
- **Держите значения изоляции реалистичными.** Ориентируйтесь на ванильные предметы с аналогичными реальными аналогами.
- **Тестируйте через скриптовую консоль перед types.xml.** Убедитесь, что предмет работает, прежде чем отлаживать таблицы спавна.
- **Используйте ссылки `$STR_` для всего текста, видимого игрокам.** Это позволяет будущую локализацию без изменения конфигов.
- **Упаковывайте Data и Scripts как отдельные PBO.** Обновляйте текстуры без пересборки скриптов.
- **Предоставляйте наземные текстуры.** Текстура `_g_` делает выброшенные предметы визуально корректными.

---

## Теория и практика

| Концепция | Теория | Реальность |
|---------|--------|---------|
| `heatIsolation` | Простое число тепла | Эффективное тепло зависит от здоровья и влажности. Движок умножает его на коэффициенты из `MiscGameplayFunctions.GetCurrentItemHeatIsolation()`. |
| Значения `damage` брони | Меньше = больше защиты | Значение 0.8 означает, что игрок получает 80% урона (поглощается лишь 20%). Многие моддеры читают 0.9 как "90% защиты", тогда как на самом деле это 10%. |
| Наследование `scope` | Дочерние наследуют scope родителя | НЕ наследуют. Каждый класс должен явно устанавливать `scope`. Родительский `scope=0` по умолчанию делает всех потомков `scope=0`. |
| `absorbency` | Контролирует защиту от дождя | Контролирует впитывание влаги, что УМЕНЬШАЕТ тепло. Водонепроницаемый = НИЗКАЯ впитываемость (0.1). Высокая впитываемость (0.8+) = впитывает как губка. |
| Скрытые выделения | Работают на любой модели | Не все модели предоставляют одинаковые выделения. Проверьте через Object Builder или ванильный конфиг перед выбором базовой модели. |

---

## Что вы узнали

В этом руководстве вы узнали:

- Как одежда DayZ наследуется от базовых классов для конкретных слотов (`Top_Base`, `Pants_Base` и т.д.)
- Как определить предмет одежды в config.cpp со свойствами тепла, брони и влажности
- Как скрытые выделения позволяют ретекстурировать ванильные модели пользовательскими камуфляжными узорами
- Как `heatIsolation`, `visibilityModifier` и `absorbency` влияют на геймплей
- Как `DamageSystem` контролирует визуальную деградацию и бронезащиту
- Как создавать цветовые варианты с помощью паттерна `_ColorBase`
- Как добавлять записи спавна через `types.xml` и отображаемые имена через `Stringtable.csv`
- Как по желанию добавлять скриптовое поведение с событиями `OnWasAttached` и `OnWasDetached`

**Далее:** Применяйте те же техники для создания штанов (`Pants_Base`), ботинок (`Shoes_Base`) или жилета (`Vest_Base`). Структура конфига идентична -- меняется только родительский класс и слот инвентаря.

---

**Предыдущая:** [Глава 8.8: HUD-оверлей](08-hud-overlay.md)
**Следующая:** Скоро
