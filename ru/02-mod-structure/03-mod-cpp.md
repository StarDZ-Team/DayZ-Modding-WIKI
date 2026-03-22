# Глава 2.3: mod.cpp и Workshop

[Главная](../README.md) | [<< Предыдущая: config.cpp подробно](02-config-cpp.md) | **mod.cpp и Workshop** | [Следующая: Минимальный мод >>](04-minimum-viable-mod.md)

---

> **Краткое описание:** Файл `mod.cpp` --- это чистые метаданные. Он управляет тем, как ваш мод отображается в лаунчере DayZ, в игровом списке модов и в Steam Workshop. Он не влияет на геймплей, скриптинг или порядок загрузки. Если `config.cpp` --- это двигатель, то `mod.cpp` --- это покраска кузова.

---

## Содержание

- [Обзор](#обзор)
- [Расположение mod.cpp](#расположение-modcpp)
- [Справочник по всем полям](#справочник-по-всем-полям)
- [Подробности полей](#подробности-полей)
- [Клиентский мод vs серверный мод](#клиентский-мод-vs-серверный-мод)
- [Метаданные Workshop](#метаданные-workshop)
- [Обязательные vs необязательные поля](#обязательные-vs-необязательные-поля)
- [Реальные примеры](#реальные-примеры)
- [Советы и лучшие практики](#советы-и-лучшие-практики)

---

## Обзор

`mod.cpp` находится в корне папки вашего мода (рядом с каталогом `Addons/`). Лаунчер DayZ читает его для отображения названия мода, логотипа, описания и автора на экране выбора модов.

**Ключевой момент:** `mod.cpp` НЕ компилируется. Это не Enforce Script. Это простой файл вида «ключ-значение», читаемый лаунчером. Здесь нет классов, нет точек с запятой после закрывающих скобок, нет массивов с синтаксисом `[]` (за одним исключением для скриптовых модулей Workshop --- см. ниже).

---

## Расположение mod.cpp

```
@MyMod/                       <-- Папка Workshop/запуска (с префиксом @)
  mod.cpp                     <-- Этот файл
  Addons/
    MyMod_Scripts.pbo
    MyMod_Data.pbo
  Keys/
    MyMod.bikey
  meta.cpp                    <-- Автоматически генерируется публикатором Workshop
```

Префикс `@` в названии папки --- это соглашение для модов Steam Workshop, но он не является строго обязательным.

---

## Справочник по всем полям

| Поле | Тип | Назначение | Обязательное |
|------|-----|------------|-------------|
| `name` | string | Отображаемое название мода | Да |
| `picture` | string | Большое изображение в развёрнутом описании | Нет |
| `logo` | string | Логотип под игровым меню | Нет |
| `logoSmall` | string | Маленькая иконка рядом с названием (свёрнутый вид) | Нет |
| `logoOver` | string | Логотип при наведении мыши | Нет |
| `tooltip` | string | Всплывающая подсказка при наведении | Нет |
| `tooltipOwned` | string | Подсказка когда мод установлен | Нет |
| `overview` | string | Развёрнутое описание в панели деталей мода | Нет |
| `action` | string | URL-ссылка (сайт, Discord, GitHub) | Нет |
| `actionURL` | string | Альтернатива `action` (то же назначение) | Нет |
| `author` | string | Имя автора | Нет |
| `authorID` | string | Steam64 ID автора | Нет |
| `version` | string | Строка версии | Нет |
| `type` | string | `"mod"` или `"servermod"` | Нет |
| `extra` | int | Зарезервированное поле (всегда 0) | Нет |

---

## Подробности полей

### name

Отображаемое название, показываемое в списке модов лаунчера DayZ и на внутриигровом экране модов.

```cpp
name = "My Framework";
```

Можно использовать ссылки на таблицу строк для локализации:

```cpp
name = "$STR_DF_NAME";    // Разрешается через stringtable.csv
```

### picture

Путь к большому изображению, отображаемому при развёрнутом описании мода. Поддерживаются форматы `.paa`, `.edds` и `.tga`.

```cpp
picture = "MyMod/GUI/images/logo_large.edds";
```

Путь относителен корня мода. Если пуст или пропущен, изображение не показывается.

### logo

Основной логотип, отображаемый под игровым меню при загруженном моде.

```cpp
logo = "MyMod/GUI/images/logo.edds";
```

### logoSmall

Маленькая иконка рядом с названием мода в свёрнутом (не развёрнутом) виде.

```cpp
logoSmall = "MyMod/GUI/images/logo_small.edds";
```

### logoOver

Логотип, появляющийся при наведении мыши на логотип мода. Часто совпадает с `logo`, но может быть подсвеченным/светящимся вариантом.

```cpp
logoOver = "MyMod/GUI/images/logo_hover.edds";
```

### tooltip / tooltipOwned

Короткий текст при наведении на мод в лаунчере. `tooltipOwned` показывается когда мод установлен (загружен из Workshop).

```cpp
tooltip = "MyMod Core - Admin Panel & Framework";
tooltipOwned = "My Framework - Central Admin Panel & Shared Library";
```

### overview

Развёрнутое описание в панели деталей мода. Это ваш текст «о моде».

```cpp
overview = "My Framework provides a centralized admin panel and shared library for all framework mods. Manage configurations, permissions, and mod integration from a single in-game interface.";
```

### action / actionURL

Кликабельный URL, связанный с модом (обычно сайт, приглашение в Discord или репозиторий GitHub). Оба поля служат одной цели --- используйте то, которое предпочитаете.

```cpp
action = "https://github.com/mymod/repo";
// ИЛИ
actionURL = "https://discord.gg/mymod";
```

### author / authorID

Имя автора и его Steam64 ID.

```cpp
author = "Documentation Team";
authorID = "76561198000000000";
```

`authorID` используется Workshop для ссылки на профиль автора в Steam.

### version

Строка версии. Может быть любого формата --- движок не парсит и не валидирует её.

```cpp
version = "1.0.0";
```

Некоторые моды указывают на файл версии в config.cpp:

```cpp
versionPath = "MyMod/Scripts/Data/Version.hpp";   // Это идёт в config.cpp, НЕ в mod.cpp
```

### type

Объявляет, является ли это обычным модом или серверным. При отсутствии значение по умолчанию --- `"mod"`.

```cpp
type = "mod";           // Загружается через -mod= (клиент + сервер)
type = "servermod";     // Загружается через -servermod= (только сервер, не отправляется клиентам)
```

### extra

Зарезервированное поле. Всегда устанавливайте в `0` или полностью пропускайте.

```cpp
extra = 0;
```

---

## Клиентский мод vs серверный мод

DayZ поддерживает два механизма загрузки модов:

### Клиентский мод (`-mod=`)

- Загружается клиентами из Steam Workshop
- Скрипты выполняются как на клиенте, так и на сервере
- Может включать UI, HUD, модели, текстуры, звуки
- Требуется подпись ключом (`.bikey`) для подключения к серверу

```
// Параметр запуска:
-mod=@MyMod

// mod.cpp:
type = "mod";
```

### Серверный мод (`-servermod=`)

- Работает ТОЛЬКО на выделенном сервере
- Клиенты никогда его не загружают
- Не может включать клиентский UI или клиентский код `5_Mission`
- Подпись ключом не требуется

```
// Параметр запуска:
-servermod=@MyModServer

// mod.cpp:
type = "servermod";
```

### Паттерн разделённого мода

Многие моды поставляются в ДВУХ пакетах --- клиентский мод и серверный мод:

```
@MyMod_Missions/           <-- Клиентский мод (-mod=)
  mod.cpp                   type = "mod"
  Addons/
    MyMod_Missions.pbo     Скрипты: UI, рендеринг сущностей, приём RPC

@MyMod_MissionsServer/     <-- Серверный мод (-servermod=)
  mod.cpp                   type = "servermod"
  Addons/
    MyMod_MissionsServer.pbo   Скрипты: спавн, логика, управление состоянием
```

Это сохраняет серверную логику приватной (никогда не отправляется клиентам) и уменьшает размер загрузки для клиентов.

---

## Метаданные Workshop

### meta.cpp (автоматически генерируемый)

При публикации в Steam Workshop инструменты DayZ автоматически генерируют файл `meta.cpp`:

```cpp
protocol = 2;
publishedid = 2900000000;    // ID элемента Steam Workshop
timestamp = 1711000000;       // Unix-метка времени последнего обновления
```

Не редактируйте `meta.cpp` вручную. Он управляется инструментами публикации.

### Взаимодействие с Workshop

Лаунчер DayZ читает оба файла --- `mod.cpp` и `meta.cpp`:

- `mod.cpp` предоставляет визуальные метаданные (название, логотип, описание)
- `meta.cpp` связывает локальные файлы с элементом Steam Workshop
- Страница Steam Workshop имеет собственные название, описание и изображения (управляются через веб-интерфейс Steam)

Поля `mod.cpp` --- это то, что игроки видят в **внутриигровом** списке модов. Страница Workshop --- это то, что они видят в **Steam**. Поддерживайте их согласованными.

### Рекомендации по изображениям Workshop

| Изображение | Назначение | Рекомендуемый размер |
|-------------|-----------|---------------------|
| `picture` | Развёрнутое описание мода | 512x512 или аналогичный |
| `logo` | Логотип меню | от 128x128 до 256x256 |
| `logoSmall` | Иконка в свёрнутом списке | от 64x64 до 128x128 |

Используйте формат `.edds` для лучшей совместимости. `.paa` и `.tga` тоже работают. PNG и JPG НЕ работают в полях изображений mod.cpp.

---

## Обязательные vs необязательные поля

### Абсолютный минимум

Функциональный `mod.cpp` требует только:

```cpp
name = "My Mod";
```

Это всё. Одна строка. Мод загрузится и будет работать. Всё остальное --- косметика.

### Рекомендуемый минимум

Для мода, публикуемого в Workshop, включите как минимум:

```cpp
name = "My Mod Name";
author = "YourName";
version = "1.0";
overview = "What this mod does in one sentence.";
```

### Полная профессиональная настройка

```cpp
name = "My Mod Name";
picture = "MyMod/GUI/images/logo_large.edds";
logo = "MyMod/GUI/images/logo.edds";
logoSmall = "MyMod/GUI/images/logo_small.edds";
logoOver = "MyMod/GUI/images/logo_hover.edds";
tooltip = "Short description";
overview = "Full description of your mod's features.";
action = "https://discord.gg/mymod";
author = "YourName";
authorID = "76561198000000000";
version = "1.2.3";
type = "mod";
```

---

## Реальные примеры

### Мод-фреймворк (клиентский мод)

```cpp
name = "My Framework";
picture = "";
actionURL = "";
tooltipOwned = "My Framework - Central Admin Panel & Shared Library";
overview = "My Framework provides a centralized admin panel and shared library for all framework mods. Manage configurations, permissions, and mod integration from a single in-game interface.";
author = "Documentation Team";
version = "1.0.0";
```

### Серверный мод фреймворка (минимальный)

```cpp
name = "My Framework Server";
author = "Documentation Team";
version = "1.0.0";
extra = 0;
type = "mod";
```

### Community Framework

```cpp
name = "Community Framework";
picture = "JM/CF/GUI/textures/cf_icon.edds";
logo = "JM/CF/GUI/textures/cf_icon.edds";
logoSmall = "JM/CF/GUI/textures/cf_icon.edds";
logoOver = "JM/CF/GUI/textures/cf_icon.edds";
tooltip = "Community Framework";
overview = "This is a Community Framework for DayZ SA. One notable feature is it aims to resolve the issue of conflicting RPC type ID's and mods.";
action = "https://github.com/Arkensor/DayZ-CommunityFramework";
author = "CF Mod Team";
authorID = "76561198103677868";
version = "1.5.8";
```

### VPP Admin Tools

```cpp
picture = "VPPAdminTools/data/vpp_logo_m.paa";
logoSmall = "VPPAdminTools/data/vpp_logo_ss.paa";
logo = "VPPAdminTools/data/vpp_logo_s.paa";
logoOver = "VPPAdminTools/data/vpp_logo_s.paa";
tooltip = "Tools helping in administrative DayZ server tasks";
overview = "V++ Admin Tools built for the DayZ community servers!";
action = "https://discord.dayzvpp.com";
```

Заметьте: VPP пропускает `name` и `author` --- мод всё равно работает, но название мода в лаунчере заменяется именем папки.

### DabsFramework (с локализацией)

```cpp
name = "$STR_DF_NAME";
picture = "DabsFramework/gui/images/dabs_framework_logo.paa";
logo = "DabsFramework/gui/images/dabs_framework_logo.paa";
logoSmall = "DabsFramework/gui/images/dabs_framework_logo.paa";
logoOver = "DabsFramework/gui/images/dabs_framework_logo.paa";
tooltip = "$STR_DF_TOOLTIP";
overview = "$STR_DF_DESCRIPTION";
action = "https://dab.dev";
author = "$STR_DF_AUTHOR";
authorID = "76561198247958888";
version = "1.0";
```

DabsFramework использует ссылки на таблицу строк `$STR_` для всех текстовых полей, обеспечивая многоязычную поддержку самого листинга мода.

### Мод AI (клиентский мод со скриптовыми модулями в mod.cpp)

```cpp
name = "My AI Mod";
picture = "";
actionURL = "";
tooltipOwned = "My AI Mod - Intelligent Bot Framework for DayZ";
overview = "Advanced AI bot framework with human-like perception, combat tactics, and developer API";
author = "YourName";
version = "1.0.0";
type = "mod";
dependencies[] = {"Game", "World", "Mission"};
class Defs
{
    class gameScriptModule
    {
        value = "";
        files[] = {"MyMod_AI/Scripts/3_Game"};
    };
    class worldScriptModule
    {
        value = "";
        files[] = {"MyMod_AI/Scripts/4_World"};
    };
    class missionScriptModule
    {
        value = "";
        files[] = {"MyMod_AI/Scripts/5_Mission"};
    };
};
```

Заметьте: этот мод размещает определения скриптовых модулей в `mod.cpp`, а не в `config.cpp`. Оба расположения работают --- движок читает оба файла. Однако стандартное соглашение --- помещать `CfgMods` и определения скриптовых модулей в `config.cpp`. Размещение их в `mod.cpp` --- альтернативный подход, используемый некоторыми модами.

---

## Советы и лучшие практики

### 1. Держите mod.cpp простым

`mod.cpp` --- это только метаданные. Не пытайтесь помещать сюда игровую логику, определения классов или что-либо сложное. Если нужны скриптовые модули --- помещайте их в `config.cpp`.

### 2. Используйте .edds для изображений

`.edds` --- стандартный формат текстур DayZ для элементов UI. Используйте DayZ Tools (TexView2) для конвертации из PNG/TGA в .edds.

### 3. Согласуйте со страницей Workshop

Поддерживайте согласованность полей `name`, `overview` и `author` со страницей Steam Workshop. Игроки видят оба места.

### 4. Версионируйте последовательно

Выберите схему версионирования (напр., семантическое версионирование `1.0.0`) и обновляйте с каждым выпуском. Некоторые моды используют файл `Version.hpp`, на который ссылаются в `config.cpp`, для централизованного управления версиями.

### 5. Сначала тестируйте без изображений

При разработке оставляйте пути к изображениям пустыми. Добавляйте логотипы в последнюю очередь, после того как всё заработает. Отсутствующие изображения не мешают загрузке мода.

### 6. Серверным модам нужно меньше

Серверным модам нужен минимальный mod.cpp, так как игроки никогда не видят их в лаунчере:

```cpp
name = "My Server Mod";
author = "YourName";
version = "1.0.0";
type = "servermod";
```

---

## Лучшие практики

- Всегда включайте как минимум `name` и `author` --- даже для серверных модов, это помогает идентифицировать их в логах и инструментах администрирования.
- Используйте формат `.edds` для всех полей изображений (`picture`, `logo`, `logoSmall`, `logoOver`). PNG и JPG не поддерживаются.
- Сохраняйте `mod.cpp` только для метаданных. Помещайте `CfgMods`, скриптовые модули и `defines[]` в `config.cpp`.
- Используйте семантическое версионирование (`1.2.3`) в поле `version` и обновляйте его с каждым выпуском в Workshop.
- Сначала тестируйте мод без изображений; добавляйте логотипы как финальный штрих после подтверждения работоспособности.

---

## Примеры из реальных модов

| Паттерн | Мод | Детали |
|---------|-----|--------|
| Локализованное поле `name` | DabsFramework | Использует ссылку на таблицу строк `$STR_DF_NAME` для многоязычного листинга мода |
| Скриптовые модули в mod.cpp | Некоторые AI-моды | Помещают `class Defs` с путями скриптовых модулей напрямую в mod.cpp вместо config.cpp |
| Отсутствует поле `name` | VPP Admin Tools | Полностью пропускает `name`; лаунчер использует имя папки как отображаемый текст |
| Все поля изображений одинаковы | Community Framework | Устанавливает `logo`, `logoSmall` и `logoOver` в один и тот же файл `.edds` |
| Пустые пути к изображениям | Многие моды на ранней стадии | Оставляют `picture=""` при разработке; добавляют брендинг перед публикацией в Workshop |

---

## Теория vs Практика

| Концепция | Теория | Реальность |
|-----------|--------|------------|
| `mod.cpp` обязателен | Каждая папка мода должна иметь его | Мод загружается нормально без него, но лаунчер не показывает название или метаданные |
| Поле `type` управляет загрузкой | `"mod"` vs `"servermod"` | Параметр запуска (`-mod=` vs `-servermod=`) --- это то, что реально управляет загрузкой; поле `type` --- только метаданные |
| Пути к изображениям поддерживают распространённые форматы | Все форматы текстур работают | Работают только `.edds`, `.paa` и `.tga`; `.png` и `.jpg` молча игнорируются |
| `authorID` ссылается на Steam | Steam64 ID создаёт кликабельную ссылку | Работает только на странице Workshop; внутриигровой список модов не рендерит её как ссылку |
| `version` валидируется | Движок проверяет формат версии | Движок обрабатывает его как простую строку; `"banana"` технически допустимо |

---

## Совместимость и влияние

- **Мультимод:** `mod.cpp` не влияет на порядок загрузки или зависимости. Два мода с идентичными значениями полей не будут конфликтовать --- столкнуться могут только имена классов `CfgPatches` в `config.cpp`.
- **Производительность:** `mod.cpp` читается один раз при запуске. Файлы изображений, на которые он ссылается, загружаются в память для UI лаунчера, но не влияют на внутриигровую производительность.

---

**Предыдущая:** [Глава 2.2: config.cpp подробно](02-config-cpp.md)
**Следующая:** [Глава 2.4: Ваш первый мод --- минимальный жизнеспособный](04-minimum-viable-mod.md)
