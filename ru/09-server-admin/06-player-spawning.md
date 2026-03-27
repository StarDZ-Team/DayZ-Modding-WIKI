# Глава 9.6: Спавн игроков

[Главная](../README.md) | [<< Назад: Спавн транспорта](05-vehicle-spawning.md) | [Далее: Персистентность >>](07-persistence.md)

---

> **Краткое содержание:** Точки появления игроков управляются файлом **cfgplayerspawnpoints.xml** (пузыри позиций) и **init.c** (стартовое снаряжение). Эта глава охватывает оба файла с реальными ванильными значениями из Чернаруси.

---

## Содержание

- [Обзор cfgplayerspawnpoints.xml](#обзор-cfgplayerspawnpointsxml)
- [Параметры спавна](#параметры-спавна)
- [Параметры генератора](#параметры-генератора)
- [Параметры группы](#параметры-группы)
- [Пузыри свежего спавна](#пузыри-свежего-спавна)
- [Спавн хопперов](#спавн-хопперов)
- [init.c -- стартовое снаряжение](#initc----стартовое-снаряжение)
- [Добавление пользовательских точек спавна](#добавление-пользовательских-точек-спавна)
- [Распространённые ошибки](#распространённые-ошибки)

---

## Обзор cfgplayerspawnpoints.xml

Этот файл находится в вашей папке миссии (например, `dayzOffline.chernarusplus/cfgplayerspawnpoints.xml`). Он имеет два раздела, каждый со своими параметрами и пузырями позиций:

- **`<fresh>`** -- новые персонажи (первая жизнь или после смерти)
- **`<hop>`** -- серверхопперы (игрок имел персонажа на другом сервере)

---

## Параметры спавна

Ванильные значения свежего спавна:

```xml
<spawn_params>
    <min_dist_infected>30</min_dist_infected>
    <max_dist_infected>70</max_dist_infected>
    <min_dist_player>65</min_dist_player>
    <max_dist_player>150</max_dist_player>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
</spawn_params>
```

| Параметр | Значение | Описание |
|-----------|-------|---------|
| `min_dist_infected` | 30 | Игрок должен появиться минимум в 30 м от ближайшего заражённого |
| `max_dist_infected` | 70 | Если нет позиции на 30+ м, принимаются позиции до 70 м как запасной вариант |
| `min_dist_player` | 65 | Игрок должен появиться минимум в 65 м от любого другого игрока |
| `max_dist_player` | 150 | Запасной диапазон -- принимаются позиции до 150 м от других игроков |
| `min_dist_static` | 0 | Минимальное расстояние от статических объектов (зданий, стен) |
| `max_dist_static` | 2 | Максимальное расстояние от статических объектов -- удерживает игроков вблизи строений |

Движок сначала пробует значения `min_dist_*`; если нет подходящей позиции, он ослабляет условия до `max_dist_*`.

---

## Параметры генератора

Генератор создаёт сетку позиций-кандидатов вокруг каждого пузыря:

```xml
<generator_params>
    <grid_density>4</grid_density>
    <grid_width>200</grid_width>
    <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>
    <max_steepness>45</max_steepness>
</generator_params>
```

| Параметр | Значение | Описание |
|-----------|-------|---------|
| `grid_density` | 4 | Расстояние между точками сетки в метрах -- ниже = больше кандидатов, выше нагрузка на CPU |
| `grid_width` | 200 | Сетка простирается на 200 м по оси X вокруг центра каждого пузыря |
| `grid_height` | 200 | Сетка простирается на 200 м по оси Z вокруг центра каждого пузыря |
| `min_steepness` / `max_steepness` | -45 / 45 | Диапазон уклона рельефа в градусах -- отклоняет обрывы и крутые холмы |

Каждый пузырь получает сетку 200x200 м с точкой каждые 4 м (~2500 кандидатов). Движок фильтрует по крутизне и расстоянию до статических объектов, затем применяет `spawn_params` в момент спавна.

#### Параметр `allow_in_water` (1.28+)

Начиная с DayZ 1.28, в `generator_params` добавлен новый булев параметр `allow_in_water` (по умолчанию: `false`). Когда установлен в `true`, генератор точек спавна считает позиции в воде допустимыми:

```xml
<generator_params>
    <grid_density>4</grid_density>
    <grid_width>200</grid_width>
    <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>
    <max_steepness>45</max_steepness>
    <allow_in_water>false</allow_in_water>
</generator_params>
```

По умолчанию движок отклоняет любую позицию-кандидат, попадающую в воду (пруды, реки, океан). Установка `allow_in_water` в `true` убирает этот фильтр. Это полезно прежде всего для пользовательских карт с островными спавнами или сценариев, где прибрежные спавны в воде являются намеренными. Для большинства серверов оставляйте значение `false`, чтобы избежать появления игроков в озёрах или океане.

---

## Параметры группы

```xml
<group_params>
    <enablegroups>true</enablegroups>
    <groups_as_regular>true</groups_as_regular>
    <lifetime>240</lifetime>
    <counter>-1</counter>
</group_params>
```

| Параметр | Значение | Описание |
|-----------|-------|---------|
| `enablegroups` | true | Пузыри позиций организованы в именованные группы |
| `groups_as_regular` | true | Группы рассматриваются как обычные точки спавна (может быть выбрана любая группа) |
| `lifetime` | 240 | Секунды до того, как использованная точка спавна снова станет доступной |
| `counter` | -1 | Сколько раз может быть использована точка спавна. -1 = неограниченно |

Использованная позиция блокируется на 240 секунд, предотвращая появление двух игроков друг на друге.

---

## Пузыри свежего спавна

Ванильная Чернарусь определяет 11 групп вдоль побережья для свежих спавнов. Каждая группа группирует 3-8 позиций вокруг города:

| Группа | Позиций | Область |
|-------|-----------|------|
| WestCherno | 4 | Западная сторона Черногорска |
| EastCherno | 4 | Восточная сторона Черногорска |
| WestElektro | 5 | Западный Электрозаводск |
| EastElektro | 4 | Восточный Электрозаводск |
| Kamyshovo | 5 | Побережье Камышово |
| Solnechny | 5 | Район фабрики Солнечного |
| Orlovets | 4 | Между Солнечным и Нижним |
| Nizhnee | 4 | Побережье Нижнего |
| SouthBerezino | 3 | Южное Березино |
| NorthBerezino | 8 | Северное Березино + расширенное побережье |
| Svetlojarsk | 3 | Гавань Светлоярска |

### Реальные примеры групп

```xml
<generator_posbubbles>
    <group name="WestCherno">
        <pos x="6063.018555" z="1931.907227" />
        <pos x="5933.964844" z="2171.072998" />
        <pos x="6199.782715" z="2241.805176" />
        <pos x="13552.5654" z="5955.893066" />
    </group>
    <group name="WestElektro">
        <pos x="8747.670898" z="2357.187012" />
        <pos x="9363.6533" z="2017.953613" />
        <pos x="9488.868164" z="1898.900269" />
        <pos x="9675.2216" z="1817.324585" />
        <pos x="9821.274414" z="2194.003662" />
    </group>
    <group name="Kamyshovo">
        <pos x="11830.744141" z="3400.428955" />
        <pos x="11930.805664" z="3484.882324" />
        <pos x="11961.211914" z="3419.867676" />
        <pos x="12222.977539" z="3454.867188" />
        <pos x="12336.774414" z="3503.847168" />
    </group>
</generator_posbubbles>
```

Координаты используют `x` (восток-запад) и `z` (север-юг). Ось Y (высота) вычисляется автоматически по карте высот рельефа.

---

## Спавн хопперов

Спавн хопперов менее строг к расстоянию до игроков и использует меньшие сетки:

```xml
<!-- Отличия hop spawn_params от fresh -->
<min_dist_player>25.0</min_dist_player>   <!-- fresh: 65 -->
<max_dist_player>70.0</max_dist_player>   <!-- fresh: 150 -->
<min_dist_static>0.5</min_dist_static>    <!-- fresh: 0 -->

<!-- Отличия hop generator_params -->
<grid_width>150</grid_width>              <!-- fresh: 200 -->
<grid_height>150</grid_height>            <!-- fresh: 200 -->

<!-- Отличия hop group_params -->
<enablegroups>false</enablegroups>        <!-- fresh: true -->
<lifetime>360</lifetime>                  <!-- fresh: 240 -->
```

Группы хопперов распределены **вглубь материка**: Balota (6), Cherno (5), Pusta (5), Kamyshovo (4), Solnechny (5), Nizhnee (6), Berezino (5), Olsha (4), Svetlojarsk (5), Dobroye (5). С `enablegroups=false` движок рассматривает все 50 позиций как единый пул.

---

## init.c -- стартовое снаряжение

Файл **init.c** в вашей папке миссии управляет созданием персонажа и стартовым снаряжением. Два важных переопределения:

- **`CreateCharacter`** -- вызывает `GetGame().CreatePlayer()`. Движок определяет позицию из **cfgplayerspawnpoints.xml** до выполнения этого метода; вы не задаёте позицию спавна здесь.
- **`StartingEquipSetup`** -- выполняется после создания персонажа. У игрока уже есть стандартная одежда (рубашка, джинсы, кроссовки). Этот метод добавляет стартовые предметы.

### Ванильный StartingEquipSetup (Чернарусь)

```c
override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
{
    EntityAI itemClothing;
    EntityAI itemEnt;
    float rand;

    itemClothing = player.FindAttachmentBySlotName( "Body" );
    if ( itemClothing )
    {
        SetRandomHealth( itemClothing );  // 0.45 - 0.65 здоровья

        itemEnt = itemClothing.GetInventory().CreateInInventory( "BandageDressing" );
        player.SetQuickBarEntityShortcut(itemEnt, 2);

        string chemlightArray[] = { "Chemlight_White", "Chemlight_Yellow", "Chemlight_Green", "Chemlight_Red" };
        int rndIndex = Math.RandomInt( 0, 4 );
        itemEnt = itemClothing.GetInventory().CreateInInventory( chemlightArray[rndIndex] );
        SetRandomHealth( itemEnt );
        player.SetQuickBarEntityShortcut(itemEnt, 1);

        rand = Math.RandomFloatInclusive( 0.0, 1.0 );
        if ( rand < 0.35 )
            itemEnt = player.GetInventory().CreateInInventory( "Apple" );
        else if ( rand > 0.65 )
            itemEnt = player.GetInventory().CreateInInventory( "Pear" );
        else
            itemEnt = player.GetInventory().CreateInInventory( "Plum" );
        player.SetQuickBarEntityShortcut(itemEnt, 3);
        SetRandomHealth( itemEnt );
    }

    itemClothing = player.FindAttachmentBySlotName( "Legs" );
    if ( itemClothing )
        SetRandomHealth( itemClothing );
}
```

Что каждый игрок получает: **BandageDressing** (быстрый слот 3), случайный **Chemlight** (быстрый слот 2), случайный фрукт -- 35% Apple, 30% Plum, 35% Pear (быстрый слот 1). `SetRandomHealth` устанавливает 45-65% состояния для всех предметов.

### Добавление пользовательского стартового снаряжения

```c
// Добавьте после блока с фруктами, внутри проверки слота Body
itemEnt = player.GetInventory().CreateInInventory( "KitchenKnife" );
SetRandomHealth( itemEnt );
```

---

## Добавление пользовательских точек спавна

Чтобы добавить пользовательскую группу спавна, отредактируйте раздел `<fresh>` файла **cfgplayerspawnpoints.xml**:

```xml
<group name="MyCustomSpawn">
    <pos x="7500.0" z="7500.0" />
    <pos x="7550.0" z="7520.0" />
    <pos x="7480.0" z="7540.0" />
    <pos x="7520.0" z="7480.0" />
</group>
```

Шаги:

1. Откройте карту в игре или используйте iZurvive для определения координат
2. Выберите 3-5 позиций, распределённых на 100-200 м в безопасной зоне (без обрывов, без воды)
3. Добавьте блок `<group>` внутри `<generator_posbubbles>`
4. Используйте `x` для восток-запад и `z` для север-юг -- движок вычисляет Y (высоту) по рельефу
5. Перезапустите сервер -- вайп персистентности не требуется

Для сбалансированного спавна держите минимум 4 позиции на группу, чтобы 240-секундная блокировка не заняла все позиции, когда несколько игроков погибают одновременно.

---

## Распространённые ошибки

### Игроки появляются в океане

Вы перепутали `z` (север-юг) с Y (высота) или использовали координаты за пределами диапазона 0-15360. Позиции побережья имеют низкие значения `z` (южный край). Перепроверьте с помощью iZurvive.

### Недостаточно точек спавна

С только 2-3 позициями 240-секундная блокировка вызывает скопление. Ванильная версия использует 49 свежих позиций в 11 группах. Стремитесь к минимум 20 позициям в 4+ группах.

### Забыли раздел hop

Пустой раздел `<hop>` означает, что серверхопперы появляются в `0,0,0` -- это океан на Чернаруси. Всегда определяйте точки хопа, даже если вы копируете их из `<fresh>`.

### Точки спавна на крутом рельефе

Генератор отклоняет уклоны свыше 45 градусов. Если все пользовательские позиции на склонах, нет подходящих кандидатов. Используйте ровную поверхность вблизи дорог.

### Игроки всегда появляются в одном и том же месте

Группы с 1-2 позициями блокируются 240-секундным кулдауном. Добавьте больше позиций в группу.

---

[Главная](../README.md) | [<< Назад: Спавн транспорта](05-vehicle-spawning.md) | [Далее: Персистентность >>](07-persistence.md)
