# Полное руководство по моддингу DayZ

> Исчерпывающая документация по моддингу DayZ — 92 главы, от нуля до опубликованного мода.

<p align="center">
  <a href="../en/README.md"><img src="https://flagsapi.com/US/flat/48.png" alt="English" /></a>
  <a href="../pt/README.md"><img src="https://flagsapi.com/BR/flat/48.png" alt="Portugues" /></a>
  <a href="../de/README.md"><img src="https://flagsapi.com/DE/flat/48.png" alt="Deutsch" /></a>
  <a href="README.md"><img src="https://flagsapi.com/RU/flat/48.png" alt="Russki" /></a>
  <a href="../es/README.md"><img src="https://flagsapi.com/ES/flat/48.png" alt="Espanol" /></a>
  <a href="../fr/README.md"><img src="https://flagsapi.com/FR/flat/48.png" alt="Francais" /></a>
  <a href="../ja/README.md"><img src="https://flagsapi.com/JP/flat/48.png" alt="Nihongo" /></a>
  <a href="../zh-hans/README.md"><img src="https://flagsapi.com/CN/flat/48.png" alt="Jiantizi Zhongwen" /></a>
  <a href="../cs/README.md"><img src="https://flagsapi.com/CZ/flat/48.png" alt="Cestina" /></a>
  <a href="../pl/README.md"><img src="https://flagsapi.com/PL/flat/48.png" alt="Polski" /></a>
  <a href="../hu/README.md"><img src="https://flagsapi.com/HU/flat/48.png" alt="Magyar" /></a>
  <a href="../it/README.md"><img src="https://flagsapi.com/IT/flat/48.png" alt="Italiano" /></a>
</p>

---

## Полный указатель страниц

### Часть 1: Язык Enforce Script (13 глав)

| # | Глава | Описание |
|---|-------|----------|
| 1.1 | [Переменные и типы](01-enforce-script/01-variables-types.md) | Примитивные типы, объявление переменных, преобразования и значения по умолчанию |
| 1.2 | [Массивы, Map и Set](01-enforce-script/02-arrays-maps-sets.md) | Коллекции данных: array, map, set — итерация, поиск, сортировка |
| 1.3 | [Классы и наследование](01-enforce-script/03-classes-inheritance.md) | Определение классов, наследование, конструкторы, полиморфизм |
| 1.4 | [Modded-классы](01-enforce-script/04-modded-classes.md) | Система modded class, переопределение методов, вызовы super |
| 1.5 | [Управление потоком](01-enforce-script/05-control-flow.md) | If/else, switch, циклы while/for, break, continue |
| 1.6 | [Операции со строками](01-enforce-script/06-strings.md) | Манипуляции со строками, форматирование, поиск, сравнение |
| 1.7 | [Математика и векторы](01-enforce-script/07-math-vectors.md) | Математические функции, 3D-векторы, расстояния, направления |
| 1.8 | [Управление памятью](01-enforce-script/08-memory-management.md) | Подсчёт ссылок, ref, предотвращение утечек, циклы ссылок |
| 1.9 | [Приведение типов и рефлексия](01-enforce-script/09-casting-reflection.md) | Приведение типов, Class.CastTo, проверка типа во время выполнения |
| 1.10 | [Перечисления и препроцессор](01-enforce-script/10-enums-preprocessor.md) | Перечисления, #ifdef, #define, условная компиляция |
| 1.11 | [Обработка ошибок](01-enforce-script/11-error-handling.md) | Паттерны обработки ошибок без try/catch, guard clauses |
| 1.12 | [Чего НЕ существует](01-enforce-script/12-gotchas.md) | 30+ подводных камней и ограничений языка Enforce Script |
| 1.13 | [Функции и методы](01-enforce-script/13-functions-methods.md) | Объявление функций, параметры, возвращаемые значения, static, proto |

### Часть 2: Структура мода (6 глав)

| # | Глава | Описание |
|---|-------|----------|
| 2.1 | [5-уровневая иерархия](02-mod-structure/01-five-layers.md) | 5 уровней скриптов DayZ и порядок компиляции |
| 2.2 | [config.cpp подробно](02-mod-structure/02-config-cpp.md) | Полная структура config.cpp, CfgPatches, CfgMods |
| 2.3 | [mod.cpp и Workshop](02-mod-structure/03-mod-cpp.md) | Файл mod.cpp, публикация в Steam Workshop |
| 2.4 | [Ваш первый мод](02-mod-structure/04-minimum-viable-mod.md) | Минимальный жизнеспособный мод — необходимые файлы и структура |
| 2.5 | [Организация файлов](02-mod-structure/05-file-organization.md) | Соглашения об именовании, рекомендуемая структура папок |
| 2.6 | [Архитектура сервер/клиент](02-mod-structure/06-server-client-split.md) | Разделение серверного и клиентского кода, безопасность |

### Часть 3: Система GUI и Layout (10 глав)

| # | Глава | Описание |
|---|-------|----------|
| 3.1 | [Типы виджетов](03-gui-system/01-widget-types.md) | Все доступные типы виджетов: текст, изображение, кнопка и т.д. |
| 3.2 | [Формат файлов Layout](03-gui-system/02-layout-files.md) | Структура XML-файлов .layout для интерфейсов |
| 3.3 | [Размеры и позиционирование](03-gui-system/03-sizing-positioning.md) | Система координат, флаги размеров, привязка |
| 3.4 | [Контейнеры](03-gui-system/04-containers.md) | Виджеты-контейнеры: WrapSpacer, GridSpacer, ScrollWidget |
| 3.5 | [Программное создание](03-gui-system/05-programmatic-widgets.md) | Создание виджетов из кода, GetWidgetUnderCursor, SetHandler |
| 3.6 | [Обработка событий](03-gui-system/06-event-handling.md) | UI-колбэки: OnClick, OnChange, OnMouseEnter |
| 3.7 | [Стили, шрифты и изображения](03-gui-system/07-styles-fonts.md) | Доступные шрифты, стили, загрузка изображений |
| 3.8 | [Диалоги и модальные окна](03-gui-system/08-dialogs-modals.md) | Создание диалогов, модальные меню, подтверждения |
| 3.9 | [Реальные UI-паттерны](03-gui-system/09-real-mod-patterns.md) | Паттерны UI из COT, VPP, Expansion, Dabs Framework |
| 3.10 | [Продвинутые виджеты](03-gui-system/10-advanced-widgets.md) | MapWidget, RenderTargetWidget, специализированные виджеты |

### Часть 4: Форматы файлов и инструменты (8 глав)

| # | Глава | Описание |
|---|-------|----------|
| 4.1 | [Текстуры](04-file-formats/01-textures.md) | Форматы .paa, .edds, .tga — конвертация и использование |
| 4.2 | [3D-модели](04-file-formats/02-models.md) | Формат .p3d, LOD, геометрия, memory-точки |
| 4.3 | [Материалы](04-file-formats/03-materials.md) | Файлы .rvmat, шейдеры, свойства поверхности |
| 4.4 | [Аудио](04-file-formats/04-audio.md) | Форматы .ogg и .wss, настройка звука |
| 4.5 | [DayZ Tools](04-file-formats/05-dayz-tools.md) | Рабочий процесс с официальными DayZ Tools |
| 4.6 | [Упаковка PBO](04-file-formats/06-pbo-packing.md) | Создание и извлечение файлов PBO |
| 4.7 | [Руководство по Workbench](04-file-formats/07-workbench-guide.md) | Использование Workbench для редактирования скриптов и ассетов |
| 4.8 | [Моделирование зданий](04-file-formats/08-building-modeling.md) | Моделирование зданий с дверями и лестницами |

### Часть 5: Файлы конфигурации (6 глав)

| # | Глава | Описание |
|---|-------|----------|
| 5.1 | [stringtable.csv](05-config-files/01-stringtable.md) | Локализация с stringtable.csv на 13 языков |
| 5.2 | [inputs.xml](05-config-files/02-inputs-xml.md) | Настройка клавиш и пользовательские привязки |
| 5.3 | [credits.json](05-config-files/03-credits-json.md) | Файл титров мода |
| 5.4 | [ImageSets](05-config-files/04-imagesets.md) | Формат ImageSet для иконок и спрайтов |
| 5.5 | [Конфигурация сервера](05-config-files/05-server-configs.md) | Файлы конфигурации сервера DayZ |
| 5.6 | [Конфигурация спавна](05-config-files/06-spawning-gear.md) | Настройка начального снаряжения и точек спавна |

### Часть 6: Справочник API движка (23 главы)

| # | Глава | Описание |
|---|-------|----------|
| 6.1 | [Система сущностей](06-engine-api/01-entity-system.md) | Иерархия сущностей, EntityAI, ItemBase, Object |
| 6.2 | [Система транспорта](06-engine-api/02-vehicles.md) | API транспорта, двигатели, жидкости, физическая симуляция |
| 6.3 | [Система погоды](06-engine-api/03-weather.md) | Управление погодой, дождь, туман, облачность |
| 6.4 | [Система камер](06-engine-api/04-cameras.md) | Пользовательские камеры, позиция, вращение, переходы |
| 6.5 | [Эффекты постобработки](06-engine-api/05-ppe.md) | PPE: размытие, хроматическая аберрация, цветокоррекция |
| 6.6 | [Система уведомлений](06-engine-api/06-notifications.md) | Уведомления на экране, сообщения игрокам |
| 6.7 | [Таймеры и CallQueue](06-engine-api/07-timers.md) | Таймеры, отложенные вызовы, повторения |
| 6.8 | [Файловый ввод-вывод и JSON](06-engine-api/08-file-io.md) | Чтение/запись файлов, парсинг JSON |
| 6.9 | [Сеть и RPC](06-engine-api/09-networking.md) | Сетевое взаимодействие, RPC, синхронизация клиент-сервер |
| 6.10 | [Центральная экономика](06-engine-api/10-central-economy.md) | Система лута, категории, флаги, min/max |
| 6.11 | [Хуки миссий](06-engine-api/11-mission-hooks.md) | Хуки миссий, MissionBase, MissionServer |
| 6.12 | [Система действий](06-engine-api/12-action-system.md) | Действия игрока, ActionBase, цели, условия |
| 6.13 | [Система ввода](06-engine-api/13-input-system.md) | Захват клавиш, маппинг, UAInput |
| 6.14 | [Система игрока](06-engine-api/14-player-system.md) | PlayerBase, инвентарь, здоровье, выносливость, статистика |
| 6.15 | [Звуковая система](06-engine-api/15-sound-system.md) | Воспроизведение аудио, SoundOnVehicle, окружение |
| 6.16 | [Система крафтинга](06-engine-api/16-crafting-system.md) | Рецепты крафтинга, ингредиенты, результаты |
| 6.17 | [Система строительства](06-engine-api/17-construction-system.md) | Строительство баз, детали, состояния |
| 6.18 | [Система анимации](06-engine-api/18-animation-system.md) | Анимация игрока, ID команд, колбэки |
| 6.19 | [Запросы к рельефу](06-engine-api/19-terrain-queries.md) | Рейкасты, позиция на рельефе, поверхности |
| 6.20 | [Эффекты частиц](06-engine-api/20-particle-effects.md) | Система частиц, эмиттеры, визуальные эффекты |
| 6.21 | [Система зомби и ИИ](06-engine-api/21-zombie-ai-system.md) | ZombieBase, ИИ заражённых, поведение |
| 6.22 | [Админ и сервер](06-engine-api/22-admin-server.md) | Управление сервером, баны, кики, RCON |
| 6.23 | [Мировые системы](06-engine-api/23-world-systems.md) | Время суток, дата, функции мира |

### Часть 7: Паттерны и лучшие практики (7 глав)

| # | Глава | Описание |
|---|-------|----------|
| 7.1 | [Паттерн Singleton](07-patterns/01-singletons.md) | Единственные экземпляры, глобальный доступ, инициализация |
| 7.2 | [Системы модулей](07-patterns/02-module-systems.md) | Регистрация модулей, жизненный цикл, CF-модули |
| 7.3 | [RPC-коммуникация](07-patterns/03-rpc-patterns.md) | Паттерны для безопасных и эффективных RPC |
| 7.4 | [Сохранение конфигурации](07-patterns/04-config-persistence.md) | Сохранение/загрузка JSON-конфигов, версионирование |
| 7.5 | [Системы прав доступа](07-patterns/05-permissions.md) | Иерархические права, wildcards, группы |
| 7.6 | [Событийная архитектура](07-patterns/06-events.md) | Event bus, publish/subscribe, развязка |
| 7.7 | [Оптимизация производительности](07-patterns/07-performance.md) | Профилирование, кэш, пулинг, сокращение RPC |

### Часть 8: Уроки (13 глав)

| # | Глава | Описание |
|---|-------|----------|
| 8.1 | [Ваш первый мод (Hello World)](08-tutorials/01-first-mod.md) | Пошаговое руководство: создание и загрузка мода |
| 8.2 | [Создание пользовательского предмета](08-tutorials/02-custom-item.md) | Создание предмета с моделью, текстурой и конфигом |
| 8.3 | [Создание админ-панели](08-tutorials/03-admin-panel.md) | Админ-UI с телепортом, спавном, управлением |
| 8.4 | [Добавление чат-команд](08-tutorials/04-chat-commands.md) | Пользовательские команды в чате игры |
| 8.5 | [Использование шаблона мода](08-tutorials/05-mod-template.md) | Как использовать официальный шаблон модов DayZ |
| 8.6 | [Отладка и тестирование](08-tutorials/06-debugging-testing.md) | Логи, отладка, диагностические инструменты |
| 8.7 | [Публикация в Workshop](08-tutorials/07-publishing-workshop.md) | Публикация мода в Steam Workshop |
| 8.8 | [Создание HUD-оверлея](08-tutorials/08-hud-overlay.md) | Пользовательский HUD-оверлей поверх игры |
| 8.9 | [Профессиональный шаблон мода](08-tutorials/09-professional-template.md) | Полный шаблон, готовый к продакшену |
| 8.10 | [Создание мода транспорта](08-tutorials/10-vehicle-mod.md) | Пользовательский транспорт с физикой и конфигом |
| 8.11 | [Создание мода одежды](08-tutorials/11-clothing-mod.md) | Пользовательская одежда с текстурами и слотами |
| 8.12 | [Создание торговой системы](08-tutorials/12-trading-system.md) | Система торговли между игроками/NPC |
| 8.13 | [Справка по Diag Menu](08-tutorials/13-diag-menu.md) | Диагностические меню для разработки |

### Быстрая справка

| Страница | Описание |
|----------|----------|
| [Шпаргалка](cheatsheet.md) | Краткий обзор синтаксиса Enforce Script |
| [Быстрая справка по API](06-engine-api/quick-reference.md) | Наиболее используемые методы API движка |
| [Глоссарий](glossary.md) | Определения терминов моддинга DayZ |
| [FAQ](faq.md) | Часто задаваемые вопросы о моддинге |
| [Устранение неполадок](troubleshooting.md) | 91 распространённая проблема с решениями |

---

## Авторы

| Разработчик | Проекты | Основные вклады |
|-------------|---------|-----------------|
| [**Jacob_Mango**](https://github.com/Jacob-Mango) | Community Framework, COT | Система модулей, RPC, права доступа, ESP |
| [**InclementDab**](https://github.com/InclementDab) | Dabs Framework, DayZ Editor, Mod Template | MVC, ViewBinding, UI редактора |
| [**salutesh**](https://github.com/salutesh) | DayZ Expansion | Маркет, группы, маркеры карты, транспорт |
| [**Arkensor**](https://github.com/Arkensor) | DayZ Expansion | Центральная экономика, версионирование настроек |
| [**DaOne**](https://github.com/Da0ne) | VPP Admin Tools | Управление игроками, вебхуки, ESP |
| [**GravityWolf**](https://github.com/GravityWolfNotAmused) | VPP Admin Tools | Права доступа, управление сервером |
| [**Brian Orr (DrkDevil)**](https://github.com/DrkDevil) | Colorful UI | Цветовые темы, паттерны modded class UI |
| [**lothsun**](https://github.com/lothsun) | Colorful UI | Цветовые системы UI, визуальные улучшения |
| [**Bohemia Interactive**](https://github.com/BohemiaInteractive) | DayZ Engine & Samples | Enforce Script, ванильные скрипты, DayZ Tools |
| [**StarDZ Team**](https://github.com/StarDZ-Team) | Эта вики | Документация, перевод и организация |

## Лицензия

Документация лицензирована под [**CC BY-SA 4.0**](https://creativecommons.org/licenses/by-sa/4.0/).
Примеры кода лицензированы под [**MIT**](../LICENCE).
