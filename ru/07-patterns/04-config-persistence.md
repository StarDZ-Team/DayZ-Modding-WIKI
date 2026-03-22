# Глава 7.4: Сохранение конфигураций

[Главная](../../README.md) | [<< Предыдущая: Паттерны RPC](03-rpc-patterns.md) | **Сохранение конфигураций** | [Следующая: Системы прав доступа >>](05-permissions.md)

---

## Введение

Почти каждому моду DayZ необходимо сохранять и загружать конфигурационные данные: настройки сервера, таблицы спавна, списки банов, данные игроков, точки телепортации. Движок предоставляет `JsonFileLoader` для простой JSON-сериализации и низкоуровневый файловый ввод/вывод (`FileHandle`, `FPrintln`) для всего остального. Профессиональные моды дополнительно реализуют версионирование конфигураций и автоматическую миграцию.

Эта глава охватывает стандартные паттерны сохранения конфигураций, от базовой загрузки/сохранения JSON до систем версионированной миграции, управления директориями и таймеров автосохранения.

---

## Содержание

- [Паттерн JsonFileLoader](#паттерн-jsonfileloader)
- [Ручная запись JSON (FPrintln)](#ручная-запись-json-fprintln)
- [Путь $profile](#путь-profile)
- [Создание директорий](#создание-директорий)
- [Классы данных конфигурации](#классы-данных-конфигурации)
- [Версионирование и миграция конфигураций](#версионирование-и-миграция-конфигураций)
- [Таймеры автосохранения](#таймеры-автосохранения)
- [Типичные ошибки](#типичные-ошибки)
- [Лучшие практики](#лучшие-практики)

---

## Паттерн JsonFileLoader

`JsonFileLoader` --- это встроенный сериализатор движка. Он преобразует объекты Enforce Script в JSON-файлы и обратно, используя рефлексию --- он читает публичные поля вашего класса и автоматически сопоставляет их с ключами JSON.

### Критически важная особенность

**`JsonFileLoader<T>.JsonLoadFile()` и `JsonFileLoader<T>.JsonSaveFile()` возвращают `void`.** Вы не можете проверить их возвращаемое значение. Вы не можете присвоить его в `bool`. Вы не можете использовать их в условии `if`. Это одна из самых частых ошибок в моддинге DayZ.

```c
// НЕПРАВИЛЬНО — не скомпилируется
bool success = JsonFileLoader<MyConfig>.JsonLoadFile(path, config);

// НЕПРАВИЛЬНО — не скомпилируется
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config))
{
    // ...
}

// ПРАВИЛЬНО — вызываем и затем проверяем состояние объекта
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
// Проверяем, были ли данные фактически заполнены
if (config.m_ServerName != "")
{
    // Данные успешно загружены
}
```

### Базовая загрузка/сохранение

```c
// Класс данных — публичные поля сериализуются в/из JSON
class ServerSettings
{
    string ServerName = "My DayZ Server";
    int MaxPlayers = 60;
    float RestartInterval = 14400.0;
    bool PvPEnabled = true;
};

class SettingsManager
{
    private static const string SETTINGS_PATH = "$profile:MyMod/ServerSettings.json";
    protected ref ServerSettings m_Settings;

    void Load()
    {
        m_Settings = new ServerSettings();

        if (FileExist(SETTINGS_PATH))
        {
            JsonFileLoader<ServerSettings>.JsonLoadFile(SETTINGS_PATH, m_Settings);
        }
        else
        {
            // Первый запуск: сохраняем значения по умолчанию
            Save();
        }
    }

    void Save()
    {
        JsonFileLoader<ServerSettings>.JsonSaveFile(SETTINGS_PATH, m_Settings);
    }
};
```

### Что сериализуется

`JsonFileLoader` сериализует **все публичные поля** объекта. Он не сериализует:
- Приватные или защищённые поля
- Методы
- Статические поля
- Временные/рантайм-поля (атрибута `[NonSerialized]` не существует --- используйте модификаторы доступа)

Результирующий JSON выглядит так:

```json
{
    "ServerName": "My DayZ Server",
    "MaxPlayers": 60,
    "RestartInterval": 14400.0,
    "PvPEnabled": true
}
```

### Поддерживаемые типы полей

| Тип | Представление в JSON |
|------|-------------------|
| `int` | Число |
| `float` | Число |
| `bool` | `true` / `false` |
| `string` | Строка |
| `vector` | Массив из 3 чисел |
| `array<T>` | JSON-массив |
| `map<string, T>` | JSON-объект (только строковые ключи) |
| Вложенный класс | Вложенный JSON-объект |

### Вложенные объекты

```c
class SpawnPoint
{
    string Name;
    vector Position;
    float Radius;
};

class SpawnConfig
{
    ref array<ref SpawnPoint> SpawnPoints = new array<ref SpawnPoint>();
};
```

Генерирует:

```json
{
    "SpawnPoints": [
        {
            "Name": "Coast",
            "Position": [13000, 0, 3500],
            "Radius": 100.0
        },
        {
            "Name": "Airfield",
            "Position": [4500, 0, 9500],
            "Radius": 50.0
        }
    ]
}
```

---

## Ручная запись JSON (FPrintln)

Иногда `JsonFileLoader` недостаточно гибок: он не может обрабатывать массивы смешанных типов, пользовательское форматирование или структуры данных без классов. В таких случаях используйте низкоуровневый файловый ввод/вывод.

### Базовый паттерн

```c
void WriteCustomData(string path, array<string> lines)
{
    FileHandle file = OpenFile(path, FileMode.WRITE);
    if (!file) return;

    FPrintln(file, "{");
    FPrintln(file, "    \"entries\": [");

    for (int i = 0; i < lines.Count(); i++)
    {
        string comma = "";
        if (i < lines.Count() - 1) comma = ",";
        FPrintln(file, "        \"" + lines[i] + "\"" + comma);
    }

    FPrintln(file, "    ]");
    FPrintln(file, "}");

    CloseFile(file);
}
```

### Чтение сырых файлов

```c
void ReadCustomData(string path)
{
    FileHandle file = OpenFile(path, FileMode.READ);
    if (!file) return;

    string line;
    while (FGets(file, line) >= 0)
    {
        line = line.Trim();
        if (line == "") continue;
        // Обработка строки...
    }

    CloseFile(file);
}
```

### Когда использовать ручной ввод/вывод

- Запись лог-файлов (режим дописывания)
- Запись CSV или текстовых экспортов
- Пользовательское форматирование JSON, которое `JsonFileLoader` не может создать
- Парсинг не-JSON форматов файлов (например, файлы `.map` или `.xml` от DayZ)

Для стандартных конфигурационных файлов предпочитайте `JsonFileLoader`. Его быстрее реализовать, он менее подвержен ошибкам и автоматически обрабатывает вложенные объекты.

---

## Путь $profile

DayZ предоставляет префикс пути `$profile:`, который разрешается в директорию профиля сервера (обычно папка, содержащая `DayZServer_x64.exe`, или путь профиля, указанный через `-profiles=`).

```c
// Эти пути разрешаются в директорию профиля:
"$profile:MyMod/config.json"       // → C:/DayZServer/MyMod/config.json
"$profile:MyMod/Players/data.json" // → C:/DayZServer/MyMod/Players/data.json
```

### Всегда используйте $profile

Никогда не используйте абсолютные пути. Никогда не используйте относительные пути. Всегда используйте `$profile:` для любых файлов, которые ваш мод создаёт или читает во время выполнения:

```c
// ПЛОХО: Абсолютный путь — сломается на любой другой машине
const string CONFIG_PATH = "C:/DayZServer/MyMod/config.json";

// ПЛОХО: Относительный путь — зависит от рабочей директории, которая может меняться
const string CONFIG_PATH = "MyMod/config.json";

// ХОРОШО: $profile разрешается корректно везде
const string CONFIG_PATH = "$profile:MyMod/config.json";
```

### Типичная структура директорий

Большинство модов следуют этому соглашению:

```
$profile:
  └── YourModName/
      ├── Config.json          (основная конфигурация сервера)
      ├── Permissions.json     (права администраторов)
      ├── Logs/
      │   └── 2025-01-15.log   (ежедневные лог-файлы)
      └── Players/
          ├── 76561198xxxxx.json
          └── 76561198yyyyy.json
```

---

## Создание директорий

Перед записью файла вы должны убедиться, что его родительская директория существует. DayZ не создаёт директории автоматически.

### MakeDirectory

```c
void EnsureDirectories()
{
    string baseDir = "$profile:MyMod";
    if (!FileExist(baseDir))
    {
        MakeDirectory(baseDir);
    }

    string playersDir = baseDir + "/Players";
    if (!FileExist(playersDir))
    {
        MakeDirectory(playersDir);
    }

    string logsDir = baseDir + "/Logs";
    if (!FileExist(logsDir))
    {
        MakeDirectory(logsDir);
    }
}
```

### Важно: MakeDirectory не рекурсивна

`MakeDirectory` создаёт только последнюю директорию в пути. Если родительская директория не существует, вызов молча завершается неудачей. Вы должны создавать каждый уровень:

```c
// НЕПРАВИЛЬНО: Родительская директория "MyMod" ещё не существует
MakeDirectory("$profile:MyMod/Data/Players");  // Молча не срабатывает

// ПРАВИЛЬНО: Создаём каждый уровень
MakeDirectory("$profile:MyMod");
MakeDirectory("$profile:MyMod/Data");
MakeDirectory("$profile:MyMod/Data/Players");
```

### Паттерн: Константы для путей

Фреймворк-мод определяет все пути как константы в выделенном классе:

```c
class MyModConst
{
    static const string PROFILE_DIR    = "$profile:MyMod";
    static const string CONFIG_DIR     = "$profile:MyMod/Configs";
    static const string LOG_DIR        = "$profile:MyMod/Logs";
    static const string PLAYERS_DIR    = "$profile:MyMod/Players";
    static const string PERMISSIONS_FILE = "$profile:MyMod/Permissions.json";
};
```

Это позволяет избежать дублирования строк путей по всей кодовой базе и упрощает поиск всех файлов, с которыми работает ваш мод.

---

## Классы данных конфигурации

Хорошо спроектированный класс данных конфигурации предоставляет значения по умолчанию, отслеживание версий и чёткую документацию каждого поля.

### Базовый паттерн

```c
class MyModConfig
{
    // Отслеживание версий для миграции
    int ConfigVersion = 3;

    // Игровые настройки с разумными значениями по умолчанию
    bool EnableFeatureX = true;
    int MaxEntities = 50;
    float SpawnRadius = 500.0;
    string WelcomeMessage = "Welcome to the server!";

    // Сложные настройки
    ref array<string> AllowedWeapons = new array<string>();
    ref map<string, float> ZoneRadii = new map<string, float>();

    void MyModConfig()
    {
        // Инициализация коллекций значениями по умолчанию
        AllowedWeapons.Insert("AK74");
        AllowedWeapons.Insert("M4A1");

        ZoneRadii.Set("safe_zone", 100.0);
        ZoneRadii.Set("pvp_zone", 500.0);
    }
};
```

### Рефлективный паттерн ConfigBase

Этот паттерн использует рефлективную систему конфигурации, где каждый класс конфигурации объявляет свои поля как дескрипторы. Это позволяет панели администратора автоматически генерировать UI для любой конфигурации без жёстко заданных имён полей:

```c
// Концептуальный паттерн (рефлективная конфигурация):
class MyConfigBase
{
    // Каждая конфигурация объявляет свою версию
    int ConfigVersion;
    string ModId;

    // Подклассы переопределяют для объявления своих полей
    void Init(string modId)
    {
        ModId = modId;
    }

    // Рефлексия: получить все настраиваемые поля
    array<ref MyConfigField> GetFields();

    // Динамическое получение/установка по имени поля (для синхронизации панели администратора)
    string GetFieldValue(string fieldName);
    void SetFieldValue(string fieldName, string value);

    // Хуки для пользовательской логики при загрузке/сохранении
    void OnAfterLoad() {}
    void OnBeforeSave() {}
};
```

### Паттерн VPP ConfigurablePlugin

VPP объединяет управление конфигурацией непосредственно с жизненным циклом плагина:

```c
// Паттерн VPP (упрощённо):
class VPPESPConfig
{
    bool EnableESP = true;
    float MaxDistance = 1000.0;
    int RefreshRate = 5;
};

class VPPESPPlugin : ConfigurablePlugin
{
    ref VPPESPConfig m_ESPConfig;

    override void OnInit()
    {
        m_ESPConfig = new VPPESPConfig();
        // ConfigurablePlugin.LoadConfig() обрабатывает загрузку JSON
        super.OnInit();
    }
};
```

---

## Версионирование и миграция конфигураций

По мере развития вашего мода структуры конфигурации меняются. Вы добавляете поля, удаляете поля, переименовываете поля, меняете значения по умолчанию. Без версионирования пользователи со старыми конфигурационными файлами будут молча получать неправильные значения или краши.

### Поле версии

Каждый класс конфигурации должен иметь целочисленное поле версии:

```c
class MyModConfig
{
    int ConfigVersion = 5;  // Увеличивайте при изменении структуры
    // ...
};
```

### Миграция при загрузке

При загрузке конфигурации сравните версию на диске с текущей версией кода. Если они отличаются, запустите миграцию:

```c
void LoadConfig()
{
    MyModConfig config = new MyModConfig();  // Содержит текущие значения по умолчанию

    if (FileExist(CONFIG_PATH))
    {
        JsonFileLoader<MyModConfig>.JsonLoadFile(CONFIG_PATH, config);

        if (config.ConfigVersion < CURRENT_VERSION)
        {
            MigrateConfig(config);
            config.ConfigVersion = CURRENT_VERSION;
            SaveConfig(config);  // Пересохраняем с обновлённой версией
        }
    }
    else
    {
        SaveConfig(config);  // Первый запуск: записываем значения по умолчанию
    }

    m_Config = config;
}
```

### Функции миграции

```c
static const int CURRENT_VERSION = 5;

void MigrateConfig(MyModConfig config)
{
    // Выполняем каждый шаг миграции последовательно
    if (config.ConfigVersion < 2)
    {
        // v1 → v2: "SpawnDelay" переименован в "RespawnInterval"
        // Старое поле теряется при загрузке; устанавливаем новое значение по умолчанию
        config.RespawnInterval = 300.0;
    }

    if (config.ConfigVersion < 3)
    {
        // v2 → v3: Добавлено поле "EnableNotifications"
        config.EnableNotifications = true;
    }

    if (config.ConfigVersion < 4)
    {
        // v3 → v4: Значение по умолчанию "MaxZombies" изменено со 100 на 200
        if (config.MaxZombies == 100)
        {
            config.MaxZombies = 200;  // Обновляем только если пользователь не менял значение
        }
    }

    if (config.ConfigVersion < 5)
    {
        // v4 → v5: "DifficultyMode" изменён с int на string
        // config.DifficultyMode = "Normal"; // Устанавливаем новое значение по умолчанию
    }

    MyLog.Info("Config", "Migrated config from v"
        + config.ConfigVersion.ToString() + " to v" + CURRENT_VERSION.ToString());
}
```

### Пример миграции Expansion

Expansion известен агрессивной эволюцией конфигураций. Некоторые конфигурации Expansion прошли через 17+ версий. Их паттерн:
1. Каждое повышение версии имеет выделенную функцию миграции
2. Миграции выполняются по порядку (1 к 2, затем 2 к 3, затем 3 к 4 и т.д.)
3. Каждая миграция изменяет только то, что необходимо для данного шага версии
4. Финальный номер версии записывается на диск после завершения всех миграций

Это золотой стандарт версионирования конфигураций в модах DayZ.

---

## Таймеры автосохранения

Для конфигураций, которые изменяются во время выполнения (правки администратора, накопление данных игроков), реализуйте таймер автосохранения для предотвращения потери данных при крашах.

### Автосохранение на основе таймера

```c
class MyDataManager
{
    protected const float AUTOSAVE_INTERVAL = 300.0;  // 5 минут
    protected float m_AutosaveTimer;
    protected bool m_Dirty;  // Изменились ли данные с последнего сохранения?

    void MarkDirty()
    {
        m_Dirty = true;
    }

    void OnUpdate(float dt)
    {
        m_AutosaveTimer += dt;
        if (m_AutosaveTimer >= AUTOSAVE_INTERVAL)
        {
            m_AutosaveTimer = 0;

            if (m_Dirty)
            {
                Save();
                m_Dirty = false;
            }
        }
    }

    void OnMissionFinish()
    {
        // Всегда сохраняем при завершении, даже если таймер не сработал
        if (m_Dirty)
        {
            Save();
            m_Dirty = false;
        }
    }
};
```

### Оптимизация с флагом изменений (Dirty Flag)

Записывайте на диск только когда данные фактически изменились. Файловый ввод/вывод затратен. Если ничего не изменилось, пропустите сохранение:

```c
void UpdateSetting(string key, string value)
{
    if (m_Settings.Get(key) == value) return;  // Нет изменений — нет сохранения

    m_Settings.Set(key, value);
    MarkDirty();
}
```

### Сохранение при критических событиях

Помимо сохранения по таймеру, сохраняйте немедленно после критических операций:

```c
void BanPlayer(string uid, string reason)
{
    m_BanList.Insert(uid);
    Save();  // Немедленное сохранение — баны должны пережить краши
}
```

---

## Типичные ошибки

### 1. Обращение с JsonLoadFile как если бы он возвращал значение

```c
// НЕПРАВИЛЬНО — не скомпилируется
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config)) { ... }
```

`JsonLoadFile` возвращает `void`. Вызовите его, затем проверьте состояние объекта.

### 2. Отсутствие проверки FileExist перед загрузкой

```c
// НЕПРАВИЛЬНО — краш или пустой объект без диагностики
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);

// ПРАВИЛЬНО — сначала проверяем, создаём значения по умолчанию если файл отсутствует
if (!FileExist("$profile:MyMod/Config.json"))
{
    SaveDefaults();
    return;
}
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);
```

### 3. Забывание создать директории

`JsonSaveFile` молча не срабатывает, если директория не существует. Всегда убеждайтесь в существовании директорий перед сохранением.

### 4. Публичные поля, которые вы не собирались сериализовать

Каждое `public` поле класса конфигурации попадает в JSON. Если у вас есть поля только для рантайма, сделайте их `protected` или `private`:

```c
class MyConfig
{
    // Эти попадают в JSON:
    int MaxPlayers = 60;
    string ServerName = "My Server";

    // Это НЕ попадает в JSON (protected):
    protected bool m_Loaded;
    protected float m_LastSaveTime;
};
```

### 5. Символы обратной косой черты и кавычек в значениях JSON

CParser Enforce Script имеет проблемы с `\\` и `\"` в строковых литералах. Избегайте хранения путей файлов с обратными косыми чертами в конфигурациях. Используйте прямые косые черты:

```c
// ПЛОХО — обратные косые черты могут сломать парсинг
string LogPath = "C:\\DayZ\\Logs\\server.log";

// ХОРОШО — прямые косые черты работают везде
string LogPath = "$profile:MyMod/Logs/server.log";
```

---

## Лучшие практики

1. **Используйте `$profile:` для всех путей файлов.** Никогда не хардкодите абсолютные пути.

2. **Создавайте директории перед записью файлов.** Проверяйте с помощью `FileExist()`, создавайте с помощью `MakeDirectory()`, по одному уровню за раз.

3. **Всегда предоставляйте значения по умолчанию в конструкторе класса конфигурации или инициализаторах полей.** Это гарантирует, что конфигурации при первом запуске будут разумными.

4. **Версионируйте свои конфигурации с первого дня.** Добавление поля `ConfigVersion` ничего не стоит, но экономит часы отладки в будущем.

5. **Разделяйте классы данных конфигурации и классы менеджеров.** Класс данных --- это простой контейнер; менеджер обрабатывает логику загрузки/сохранения/синхронизации.

6. **Используйте автосохранение с флагом изменений.** Не записывайте на диск каждый раз при изменении значения --- группируйте записи на таймере.

7. **Сохраняйте при завершении миссии.** Таймер автосохранения --- это страховочная сеть, а не основное сохранение. Всегда сохраняйте во время `OnMissionFinish()`.

8. **Определяйте константы путей в одном месте.** Класс `MyModConst` со всеми путями предотвращает дублирование строк и упрощает изменение путей.

9. **Логируйте операции загрузки/сохранения.** При отладке проблем с конфигурацией строка лога "Loaded config v3 from $profile:MyMod/Config.json" бесценна.

10. **Тестируйте с удалённым конфигурационным файлом.** Ваш мод должен корректно обрабатывать первый запуск: создавать директории, записывать значения по умолчанию, логировать свои действия.

---

## Совместимость и влияние

- **Мульти-мод:** Каждый мод пишет в свою собственную директорию `$profile:ModName/`. Конфликты возникают только если два мода используют одно и то же имя директории. Используйте уникальный, узнаваемый префикс для папки вашего мода.
- **Порядок загрузки:** Загрузка конфигураций происходит в `OnInit` или `OnMissionStart`, оба управляются собственным жизненным циклом мода. Проблем с порядком загрузки между модами не возникает, если только два мода не пытаются читать/записывать один и тот же файл (чего они не должны делать).
- **Listen-сервер:** Конфигурационные файлы предназначены только для серверной стороны (`$profile:` разрешается на сервере). На listen-серверах клиентский код технически может обращаться к `$profile:`, но конфигурации должны загружаться только серверными модулями во избежание неоднозначности.
- **Производительность:** `JsonFileLoader` синхронный и блокирует основной поток. Для больших конфигураций (100+ КБ) загружайте во время `OnInit` (до начала геймплея). Таймеры автосохранения предотвращают повторные записи; паттерн с флагом изменений гарантирует, что дисковый ввод/вывод происходит только когда данные фактически изменились.
- **Миграция:** Добавление новых полей в класс конфигурации безопасно --- `JsonFileLoader` игнорирует отсутствующие ключи JSON и оставляет значение класса по умолчанию. Удаление или переименование полей требует шага версионированной миграции во избежание тихой потери данных.

---

## Теория и практика

| В учебнике написано | Реальность DayZ |
|---------------|-------------|
| Используйте асинхронный файловый ввод/вывод для избежания блокировок | В Enforce Script нет асинхронного файлового ввода/вывода; все чтения/записи синхронны. Загружайте при запуске, сохраняйте по таймерам. |
| Валидируйте JSON с помощью схемы | Валидации JSON-схем не существует; проверяйте поля в `OnAfterLoad()` или с помощью guard-проверок после загрузки. |
| Используйте базу данных для структурированных данных | Доступа к базам данных из Enforce Script нет; JSON-файлы в `$profile:` --- единственный механизм персистентности. |

---

[Главная](../../README.md) | [<< Предыдущая: Паттерны RPC](03-rpc-patterns.md) | **Сохранение конфигураций** | [Следующая: Системы прав доступа >>](05-permissions.md)
