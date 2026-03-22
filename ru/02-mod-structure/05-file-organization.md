# Глава 2.5: Лучшие практики организации файлов

[Главная](../README.md) | [<< Назад: Минимально жизнеспособный мод](04-minimum-viable-mod.md) | **Организация файлов** | [Далее: Архитектура сервера и клиента >>](06-server-client-split.md)

---

> **Резюме:** То, как вы организуете файлы, определяет, будет ли ваш мод поддерживаемым при 10 файлах или 1000. Эта глава охватывает каноническую структуру каталогов, соглашения об именовании, контентные, скриптовые и фреймворк-моды, клиент-серверное разделение и уроки из профессиональных модов DayZ.

---

## Содержание

- [Каноническая структура каталогов](#каноническая-структура-каталогов)
- [Соглашения об именовании](#соглашения-об-именовании)
- [Три типа модов](#три-типа-модов)
- [Клиент-серверное разделение модов](#клиент-серверное-разделение-модов)
- [Что куда размещать](#что-куда-размещать)
- [Именование PBO и папки @mod](#именование-pbo-и-папки-mod)
- [Реальные примеры из профессиональных модов](#реальные-примеры-из-профессиональных-модов)
- [Антипаттерны](#антипаттерны)

---

## Каноническая структура каталогов

Это стандартная структура, используемая профессиональными модами DayZ. Не каждая папка обязательна -- создавайте только то, что вам нужно.

```
MyMod/                                    <-- Корень проекта (разработка)
  mod.cpp                                 <-- Метаданные лаунчера
  stringtable.csv                         <-- Локализация (в корне мода, НЕ в Scripts/)

  Scripts/                                <-- Корень PBO скриптов
    config.cpp                            <-- CfgPatches + CfgMods + определения модулей скриптов
    Inputs.xml                            <-- Пользовательские привязки клавиш (опционально)
    Data/
      Credits.json                        <-- Авторы
      Version.hpp                         <-- Строка версии (опционально)

    1_Core/                               <-- engineScriptModule (редко)
      MyMod/
        Constants.c

    3_Game/                               <-- gameScriptModule
      MyMod/
        MyModConfig.c                     <-- Класс конфигурации
        MyModRPCs.c                       <-- Идентификаторы / регистрация RPC
        Data/
          SomeDataClass.c                 <-- Чистые структуры данных

    4_World/                              <-- worldScriptModule
      MyMod/
        Entities/
          MyCustomItem.c                  <-- Пользовательские предметы
          MyCustomVehicle.c
        Managers/
          MyModManager.c                  <-- Менеджеры, работающие с миром
        Actions/
          ActionMyCustom.c                <-- Пользовательские действия игрока

    5_Mission/                            <-- missionScriptModule
      MyMod/
        MyModRegister.c                   <-- Регистрация мода (хук запуска)
        GUI/
          MyModPanel.c                    <-- Скрипты UI-панелей
          MyModHUD.c                      <-- Скрипты HUD-оверлея

  GUI/                                    <-- Корень PBO GUI (отдельно от Scripts)
    config.cpp                            <-- GUI-специфичный config (imagesets, styles)
    layouts/                              <-- Файлы .layout
      mymod_panel.layout
      mymod_hud.layout
    imagesets/                            <-- Файлы .imageset + атласы текстур
      mymod_icons.imageset
      mymod_icons.edds
    looknfeel/                            <-- Файлы .styles
      mymod.styles

  Data/                                   <-- Корень PBO данных (модели, текстуры, предметы)
    config.cpp                            <-- CfgVehicles, CfgWeapons и т.д.
    Models/
      my_item.p3d                         <-- 3D-модели
    Textures/
      my_item_co.paa                      <-- Цветовые текстуры
      my_item_nohq.paa                    <-- Карты нормалей
    Materials/
      my_item.rvmat                       <-- Определения материалов

  Sounds/                                 <-- Звуковые файлы
    alert.ogg                             <-- Аудиофайлы (всегда .ogg)
    ambient.ogg

  ServerFiles/                            <-- Файлы для администраторов серверов
    types.xml                             <-- Определения спауна Центральной экономики
    cfgspawnabletypes.xml                 <-- Пресеты вложений
    README.md                             <-- Руководство по установке

  Keys/                                   <-- Ключи подписи
    MyMod.bikey                           <-- Открытый ключ для верификации сервером
```

---

## Соглашения об именовании

### Имена мода/проекта

Используйте PascalCase с чётким префиксом:

```
MyFramework          <-- Фреймворк, префикс: MyFW_
MyMod_Missions      <-- Функциональный мод
MyMod_Weapons       <-- Контентный мод
VPPAdminTools        <-- Некоторые моды опускают подчёркивания
DabsFramework        <-- PascalCase без разделителя
```

### Имена классов

Используйте короткий префикс, уникальный для вашего мода, затем подчёркивание и назначение класса:

```c
// Паттерн MyMod: MyMod_[Подсистема]_[Имя]
class MyLog             // Логирование ядра
class MyRPC             // RPC ядра
class MyW_Config        // Конфиг оружия
class MyM_MissionBase   // Базовый класс миссий

// Паттерн CF: CF_[Имя]
class CF_ModuleWorld
class CF_EventArgs

// Паттерн COT: JM_COT_[Имя]
class JM_COT_Menu

// Паттерн VPP: [Имя] (без префикса)
class ChatCommandBase
class WebhookManager
```

**Правила:**
- Префикс предотвращает коллизии с другими модами
- Держите его коротким (2-4 символа)
- Будьте последовательны в рамках своего мода

### Имена файлов

Называйте каждый файл по основному классу, который он содержит:

```
MyLog.c            <-- Содержит класс MyLog
MyRPC.c            <-- Содержит класс MyRPC
MyModConfig.c        <-- Содержит класс MyModConfig
ActionMyCustom.c     <-- Содержит класс ActionMyCustom
```

Один класс на файл -- идеал. Несколько маленьких вспомогательных классов в одном файле допустимо, когда они тесно связаны.

### Файлы макетов

Используйте нижний регистр с префиксом мода:

```
my_admin_panel.layout
my_killfeed_overlay.layout
mymod_settings_dialog.layout
```

### Имена переменных

```c
// Переменные-члены: префикс m_
protected int m_Count;
protected ref array<string> m_Items;
protected ref MyConfig m_Config;

// Статические переменные: префикс s_
static int s_InstanceCount;
static ref MyLog s_Logger;

// Константы: ВСЕ_ЗАГЛАВНЫЕ
const int MAX_PLAYERS = 60;
const float UPDATE_INTERVAL = 0.5;
const string MOD_NAME = "MyMod";

// Локальные переменные: camelCase (без префикса)
int count = 0;
string playerName = identity.GetName();
float deltaTime = timeArgs.DeltaTime;

// Параметры: camelCase (без префикса)
void SetConfig(MyConfig config, bool forceReload)
```

---

## Три типа модов

Моды DayZ делятся на три категории. У каждой свой акцент в структуре.

### 1. Контентный мод

Добавляет предметы, оружие, транспорт, здания -- в основном 3D-ассеты с минимальным скриптингом.

```
MyWeaponPack/
  mod.cpp
  Data/
    config.cpp                <-- CfgVehicles, CfgWeapons, CfgMagazines, CfgAmmo
    Weapons/
      MyRifle/
        MyRifle.p3d
        MyRifle_co.paa
        MyRifle_nohq.paa
        MyRifle.rvmat
    Ammo/
      MyAmmo/
        MyAmmo.p3d
  Scripts/                    <-- Минимум (может вообще не существовать)
    config.cpp
    4_World/
      MyWeaponPack/
        MyRifle.c             <-- Только если оружию нужно пользовательское поведение
  ServerFiles/
    types.xml
```

**Характеристики:**
- Основной объём в `Data/` (модели, текстуры, материалы)
- Основной объём в `Data/config.cpp` (определения CfgVehicles, CfgWeapons)
- Минимум скриптинга или его отсутствие
- Скрипты только когда предметам нужно поведение за пределами того, что определяет конфиг

### 2. Скриптовый мод

Добавляет игровые функции, инструменты администратора, системы -- в основном код с минимальными ассетами.

```
MyAdminTools/
  mod.cpp
  stringtable.csv
  Scripts/
    config.cpp
    3_Game/
      MyAdminTools/
        Config.c
        RPCHandler.c
        Permissions.c
    4_World/
      MyAdminTools/
        PlayerManager.c
        VehicleManager.c
    5_Mission/
      MyAdminTools/
        AdminMenu.c
        AdminHUD.c
  GUI/
    layouts/
      admin_menu.layout
      admin_hud.layout
    imagesets/
      admin_icons.imageset
```

**Характеристики:**
- Основной объём в `Scripts/` (большая часть кода в 3_Game, 4_World, 5_Mission)
- GUI-макеты и наборы изображений для UI
- Мало или совсем нет `Data/` (нет 3D-моделей)
- Обычно зависит от фреймворка (CF, DabsFramework или пользовательского фреймворка)

### 3. Фреймворк-мод

Предоставляет общую инфраструктуру для других модов -- логирование, RPC, конфигурация, UI-системы.

```
MyFramework/
  mod.cpp
  stringtable.csv
  Scripts/
    config.cpp
    Data/
      Credits.json
    1_Core/                     <-- Фреймворки часто используют 1_Core
      MyFramework/
        Constants.c
        LogLevel.c
    3_Game/
      MyFramework/
        Config/
          ConfigManager.c
          ConfigBase.c
        RPC/
          RPCManager.c
        Events/
          EventBus.c
        Logging/
          Logger.c
        Permissions/
          PermissionManager.c
        UI/
          ViewBase.c
          DialogBase.c
    4_World/
      MyFramework/
        Module/
          ModuleManager.c
          ModuleBase.c
        Player/
          PlayerData.c
    5_Mission/
      MyFramework/
        MissionHooks.c
        ModRegistration.c
  GUI/
    config.cpp
    layouts/
    imagesets/
    icons/
    looknfeel/
```

**Характеристики:**
- Использует все слои скриптов (от 1_Core до 5_Mission)
- Глубокая иерархия подкаталогов в каждом слое
- Определяет `defines[]` для обнаружения функций
- Другие моды зависят от него через `requiredAddons`
- Предоставляет базовые классы, которые другие моды расширяют

---

## Клиент-серверное разделение модов

Когда мод имеет и клиентское поведение (UI, рендеринг сущностей), и серверную логику (спаун, ИИ-мозги, защищённое состояние), его следует разделить на два пакета.

### Структура каталогов

```
MyMod/                                    <-- Корень проекта (репозиторий разработки)
  MyMod_Sub/                           <-- Клиентский пакет (загружается через -mod=)
    mod.cpp
    stringtable.csv
    Scripts/
      config.cpp                          <-- type = "mod"
      3_Game/MyMod/                       <-- Общие классы данных, RPC
      4_World/MyMod/                      <-- Рендеринг сущностей на клиенте
      5_Mission/MyMod/                    <-- Клиентский UI, HUD
    GUI/
      layouts/
    Sounds/

  MyMod_SubServer/                     <-- Серверный пакет (загружается через -servermod=)
    mod.cpp
    Scripts/
      config.cpp                          <-- type = "servermod"
      3_Game/MyModServer/                 <-- Серверные классы данных
      4_World/MyModServer/                <-- Спаун, логика ИИ, управление состоянием
      5_Mission/MyModServer/              <-- Серверные хуки запуска/завершения
```

### Ключевые правила для разделённых модов

1. **Клиентский пакет загружается всеми** (сервером и всеми клиентами через `-mod=`)
2. **Серверный пакет загружается только сервером** (через `-servermod=`)
3. **Серверный пакет зависит от клиентского** (через `requiredAddons`)
4. **Никогда не помещайте UI-код в серверный пакет** -- клиенты его не получат
5. **Держите защищённую/приватную логику в серверном пакете** -- она никогда не отправляется клиентам

### Цепочка зависимостей

```cpp
// config.cpp клиентского пакета
class CfgPatches
{
    class MyMod_Sub_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "MyMod_Core_Scripts" };
    };
};

// config.cpp серверного пакета
class CfgPatches
{
    class MyMod_SubServer_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "MyMod_Sub_Scripts", "MyMod_Core_Scripts" };
        //                                  ^^^ зависит от клиентского пакета
    };
};
```

### Реальный пример: клиент-серверное разделение миссий

```
MyMod_Missions/
  MyMod_Missions/                        <-- Клиент (-mod=)
    mod.cpp                               type = "mod"
    Scripts/
      config.cpp                          requiredAddons: MyMod_Core_Scripts
      3_Game/MyMod_Missions/             Общие перечисления, конфиг, ID RPC
      4_World/MyMod_Missions/            Маркеры миссий (клиентский рендеринг)
      5_Mission/MyMod_Missions/          UI миссий, HUD рации
    GUI/layouts/                          Макеты панелей миссий
    Sounds/                               Звуки рации

  MyMod_MissionsServer/                 <-- Сервер (-servermod=)
    mod.cpp                               type = "servermod"
    Scripts/
      config.cpp                          requiredAddons: MyMod_Scripts, MyMod_Core_Scripts
      3_Game/MyMod_MissionsServer/       Серверные расширения конфига
      4_World/MyMod_MissionsServer/      Спаунер миссий, менеджер лута
      5_Mission/MyMod_MissionsServer/    Серверный жизненный цикл миссий
```

---

## Что куда размещать

### Каталог Data/

Физические ассеты и определения предметов:

```
Data/
  config.cpp          <-- CfgVehicles, CfgWeapons, CfgMagazines, CfgAmmo
  Models/             <-- Файлы 3D-моделей .p3d
  Textures/           <-- Файлы текстур .paa, .edds
  Materials/          <-- Определения материалов .rvmat
  Animations/         <-- Файлы анимаций .anim (редко)
```

### Каталог Scripts/

Весь код на Enforce Script:

```
Scripts/
  config.cpp          <-- CfgPatches, CfgMods, определения модулей скриптов
  Inputs.xml          <-- Определения привязок клавиш
  Data/
    Credits.json      <-- Авторы
    Version.hpp       <-- Строка версии
  1_Core/             <-- Фундаментальные константы и утилиты
  3_Game/             <-- Конфиги, RPC, классы данных
  4_World/            <-- Сущности, менеджеры, игровая логика
  5_Mission/          <-- UI, HUD, жизненный цикл миссии
```

### Каталог GUI/

Ресурсы пользовательского интерфейса:

```
GUI/
  config.cpp          <-- GUI-специфичный CfgPatches (для регистрации imageset/style)
  layouts/            <-- Файлы .layout (деревья виджетов)
  imagesets/          <-- XML .imageset + атласы текстур .edds
  icons/              <-- Наборы иконок (могут быть отдельно от общих imagesets)
  looknfeel/          <-- Файлы .styles (визуальные свойства виджетов)
  fonts/              <-- Пользовательские файлы шрифтов (редко)
  sounds/             <-- Звуковые файлы UI (клик, наведение и т.д.)
```

### Каталог Sounds/

Аудиофайлы:

```
Sounds/
  alert.ogg           <-- Всегда формат .ogg
  ambient.ogg
  click.ogg
```

Конфигурация звука (CfgSoundSets, CfgSoundShaders) помещается в `Scripts/config.cpp`, а не в отдельный конфиг Sounds.

### Каталог ServerFiles/

Файлы, которые администраторы серверов копируют в папку миссии своего сервера:

```
ServerFiles/
  types.xml                   <-- Определения спауна предметов для Центральной экономики
  cfgspawnabletypes.xml       <-- Пресеты вложений/груза
  cfgeventspawns.xml          <-- Позиции спауна событий (редко)
  README.md                   <-- Инструкции по установке
```

---

## Именование PBO и папки @mod

### Имена PBO

Каждый PBO получает описательное имя с префиксом мода:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo         <-- Код скриптов
    MyMod_Data.pbo            <-- Модели, текстуры, предметы
    MyMod_GUI.pbo             <-- Макеты, наборы изображений, стили
    MyMod_Sounds.pbo          <-- Аудио (иногда объединяется с Data)
```

Имя PBO не обязано совпадать с именем класса CfgPatches, но их согласованность предотвращает путаницу.

### Имя папки @mod

Префикс `@` -- это соглашение Steam Workshop. Во время разработки вы можете его опустить:

```
Разработка:    MyMod/           <-- Без префикса @
Workshop:      @MyMod/          <-- С префиксом @
```

`@` не имеет технического значения для движка. Это чисто организационное соглашение.

### Несколько PBO на мод

Крупные моды разбиваются на несколько PBO по нескольким причинам:

1. **Раздельные циклы обновления** -- обновление скриптов без повторной загрузки 3D-моделей
2. **Опциональные компоненты** -- GUI PBO опционален, если мод работает безголовым
3. **Конвейер сборки** -- разные PBO собираются разными инструментами

```
@MyMod_Weapons/
  Addons/
    MyMod_Weapons_Scripts.pbo    <-- Поведение скриптов
    MyMod_Weapons_Data.pbo       <-- 268 моделей оружия, текстуры, конфиги
```

Каждый PBO имеет собственный `config.cpp` со своей записью `CfgPatches`. `requiredAddons` между ними контролирует порядок загрузки:

```cpp
// Scripts/config.cpp
class CfgPatches
{
    class MyMod_Weapons_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "DZ_Weapons_Firearms" };
    };
};

// Data/config.cpp
class CfgPatches
{
    class MyMod_Weapons_Data
    {
        requiredAddons[] = { "DZ_Data", "DZ_Weapons_Firearms" };
    };
};
```

---

## Реальные примеры из профессиональных модов

### Пример фреймворк-мода

```
MyFramework/
  MyFramework/                            <-- Клиентский пакет
    mod.cpp
    stringtable.csv
    GUI/
      config.cpp
      fonts/
      icons/                              <-- 5 наборов иконок разного веса
      imagesets/
      layouts/
        dialogs/
        options/
        prefabs/
        MyMod/loading/hints/
        MyFramework/AdminPanel/
        MyFramework/Dialogs/
        MyFramework/Modules/
        MyFramework/Options/
        MyFramework/Prefabs/
        MyFramework/Tooltip/
      looknfeel/
      sounds/
    Scripts/
      config.cpp
      Inputs.xml
      1_Core/MyMod/                      <-- Уровни логирования, константы
      2_GameLib/MyMod/UI/                <-- Система атрибутов MVC
      3_Game/MyMod/                      <-- 15+ папок подсистем
        Animation/
        Branding/
        Chat/
        Collections/
        Config/
        Core/
        Events/
        Hints/
        Killfeed/
        Logging/
        Module/
        MVC/
        Notifications/
        Permissions/
        PlayerData/
        RPC/
        Settings/
        Theme/
        Timer/
        UI/
      4_World/MyMod/                     <-- Данные игроков, менеджеры мира
      5_Mission/MyMod/                   <-- Админ-панель, регистрация модов

  MyFramework_Server/                     <-- Серверный пакет
    mod.cpp
    Scripts/
      config.cpp
      ...
```

### Community Online Tools (COT) -- инструмент администратора

```
JM/COT/
  mod.cpp
  GUI/
    config.cpp
    layouts/
      cursors/
      uiactions/
      vehicles/
    textures/
  Objects/Debug/
    config.cpp                            <-- Определения отладочных сущностей
  Scripts/
    config.cpp
    Data/
      Credits.json
      Version.hpp
      Inputs.xml
    Common/                               <-- Общее для всех слоёв
    1_Core/
    3_Game/
    4_World/
    5_Mission/
  languagecore/
    config.cpp                            <-- Конфиг таблицы строк
```

Обратите внимание на паттерн папки `Common/`: она включается в каждый модуль скриптов через `files[]`, что позволяет использовать общие типы во всех слоях.

### Пример контентного мода

```
MyMod_Weapons/
  MyMod_Weapons/
    mod.cpp
    Data/
      config.cpp                          <-- Объединённый конфиг: 268 определений оружия
      Ammo/                               <-- Организовано по источнику/калибру
        BC/12.7x55/
        BC/338/
        BC/50Cal/
        GCGN/3006/
        GCGN/300AAC/
      Attachments/                        <-- Прицелы, глушители, рукоятки
      Magazines/
      Weapons/                            <-- Модели оружия, организованные по источнику
    Scripts/
      config.cpp                          <-- Определения модулей скриптов
      3_Game/                             <-- Конфиг оружия, система характеристик
      4_World/                            <-- Переопределения поведения оружия
      5_Mission/                          <-- Регистрация, UI
```

Контентные моды имеют массивный каталог `Data/` и относительно небольшой `Scripts/`.

### DabsFramework -- UI-фреймворк

```
DabsFramework/
  mod.cpp
  gui/
    config.cpp
    imagesets/
    icons/
      brands.imageset
      light.imageset
      regular.imageset
      solid.imageset
      thin.imageset
    looknfeel/
  scripts/
    config.cpp
    Credits.json
    Version.hpp
    1_core/
    2_GameLib/                            <-- Один из немногих модов, использующих слой 2
    3_Game/
    4_World/
    5_Mission/
```

Примечание: DabsFramework использует имена папок в нижнем регистре (`scripts/`, `gui/`). Это работает, потому что Windows нечувствительна к регистру, но может вызвать проблемы на Linux. Соглашение -- использовать каноническое написание (`Scripts/`, `GUI/`).

---

## Антипаттерны

### 1. Плоский дамп скриптов

```
Scripts/
  3_Game/
    AllMyStuff.c            <-- 2000 строк, 15 классов
    MoreStuff.c             <-- 1500 строк, 12 классов
```

**Исправление:** один файл на класс, организованный в подкаталоги по подсистемам.

### 2. Неправильное размещение в слоях

```
Scripts/
  3_Game/
    MyMod/
      PlayerManager.c       <-- Ссылается на PlayerBase (определён в 4_World)
      MyPanel.c             <-- UI-код (относится к 5_Mission)
      MyItem.c              <-- Расширяет ItemBase (относится к 4_World)
```

**Исправление:** следуйте правилам слоёв из главы 2.1. Переместите код сущностей в `4_World`, а UI-код -- в `5_Mission`.

### 3. Отсутствие подкаталога мода в слоях скриптов

```
Scripts/
  3_Game/
    Config.c                <-- Риск коллизии имён с другими модами!
    RPCs.c
```

**Исправление:** всегда используйте пространство имён через подкаталог:

```
Scripts/
  3_Game/
    MyMod/
      Config.c
      RPCs.c
```

### 4. stringtable.csv внутри Scripts/

```
Scripts/
  stringtable.csv           <-- НЕПРАВИЛЬНОЕ РАСПОЛОЖЕНИЕ
  config.cpp
```

**Исправление:** `stringtable.csv` помещается в корень мода (рядом с `mod.cpp`):

```
MyMod/
  mod.cpp
  stringtable.csv           <-- Правильно
  Scripts/
    config.cpp
```

### 5. Смешивание ассетов и скриптов в одном PBO

```
MyMod/
  config.cpp
  Scripts/3_Game/...
  Models/weapon.p3d
  Textures/weapon_co.paa
```

**Исправление:** разделите на несколько PBO:

```
MyMod/
  Scripts/
    config.cpp
    3_Game/...
  Data/
    config.cpp
    Models/weapon.p3d
    Textures/weapon_co.paa
```

### 6. Глубоко вложенные подкаталоги

```
Scripts/3_Game/MyMod/Systems/Core/Config/Managers/Settings/PlayerSettings.c
```

**Исправление:** ограничьте вложенность 2-3 уровнями максимум. Уплощайте, где возможно:

```
Scripts/3_Game/MyMod/Config/PlayerSettings.c
```

### 7. Непоследовательное именование

```
mymod_Config.c
MyMod_rpc.c
MYMOD_Manager.c
my_mod_panel.c
```

**Исправление:** выберите одно соглашение и придерживайтесь его:

```
MyModConfig.c
MyModRPC.c
MyModManager.c
MyModPanel.c
```

---

## Контрольный список

Перед публикацией мода проверьте:

- [ ] `mod.cpp` находится в корне мода (рядом с `Addons/` или `Scripts/`)
- [ ] `stringtable.csv` находится в корне мода (НЕ внутри `Scripts/`)
- [ ] `config.cpp` существует в корне каждого PBO
- [ ] `requiredAddons[]` перечисляет ВСЕ зависимости
- [ ] Пути `files[]` модуля скриптов совпадают с фактической структурой каталогов
- [ ] Каждый файл `.c` находится внутри подкаталога с пространством имён мода (например, `3_Game/MyMod/`)
- [ ] Имена классов имеют уникальный префикс для избежания коллизий
- [ ] Классы сущностей в `4_World`, UI-классы в `5_Mission`, классы данных в `3_Game`
- [ ] Нет секретов или отладочного кода в опубликованных PBO
- [ ] Серверная логика в отдельном пакете `-servermod` (если применимо)

---

## Замечено в реальных модах

| Паттерн | Мод | Детали |
|---------|-----|--------|
| Глубокие папки подсистем в `3_Game` | StarDZ Core | 15+ папок в `3_Game/` (Config, RPC, Events, Logging, Permissions и т.д.) |
| Общая папка `Common/` | COT | Включена в `files[]` каждого модуля скриптов для предоставления кросс-слойных утилитных типов |
| Имена папок в нижнем регистре | DabsFramework | Использует `scripts/`, `gui/` вместо `Scripts/`, `GUI/` -- работает на Windows, но рискованно на Linux |
| Отдельный GUI PBO | Expansion, COT | GUI-ресурсы (макеты, наборы изображений, стили) упакованы в выделенный PBO со своим config.cpp |
| Минимум скриптов для контентных модов | Паки оружия | Каталог `Data/` доминирует; в `Scripts/` только тонкий config.cpp и опциональные переопределения поведения |

---

## Теория и практика

| Концепция | Теория | Реальность |
|---------|--------|---------|
| Один класс на файл | Каждый файл `.c` содержит один класс | Маленькие вспомогательные классы и перечисления часто размещаются вместе с родительским классом для удобства |
| Отдельные PBO для Scripts/Data/GUI | Чистое разделение по назначению | Маленькие моды часто объединяют всё в один PBO для упрощения дистрибуции |
| Подпапка мода предотвращает коллизии | `3_Game/MyMod/` создаёт пространство имён для файлов | Верно, но имена классов всё равно конфликтуют глобально -- подпапка предотвращает только коллизии на уровне файлов |
| `stringtable.csv` в корне мода | Движок находит его автоматически | Должен быть в корне PBO, который загружается; размещение внутри `Scripts/` приводит к тихому игнорированию |
| ServerFiles/ поставляется с модом | Администраторы копируют types.xml | Многие авторы модов забывают включить ServerFiles, вынуждая администраторов создавать записи types.xml вручную |

---

## Совместимость и влияние

- **Мульти-мод:** организация файлов сама по себе не вызывает конфликтов. Однако два мода, размещающих файлы с одинаковым путём внутри своих PBO (например, оба используют `3_Game/Config.c` без подпапки мода), столкнутся на уровне движка, что приведёт к тихой перезаписи одного другим.
- **Производительность:** глубина каталогов и количество файлов не оказывают измеримого влияния на время компиляции скриптов. Движок рекурсивно сканирует все перечисленные каталоги `files[]` независимо от вложенности.

---

**Предыдущая:** [Глава 2.4: Ваш первый мод -- минимально жизнеспособный](04-minimum-viable-mod.md)
**Следующая:** [Глава 2.6: Архитектура сервера и клиента](06-server-client-split.md)
