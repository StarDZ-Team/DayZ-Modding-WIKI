# Глава 1.11: Обработка ошибок

[Главная](../README.md) | [<< Назад: Перечисления и препроцессор](10-enums-preprocessor.md) | **Обработка ошибок** | [Далее: Подводные камни >>](12-gotchas.md)

---

> **Цель:** Научиться обрабатывать ошибки в языке без try/catch. Освоить защитные проверки, оборонительное программирование и паттерны структурированного логирования, которые сохраняют стабильность вашего мода.

---

## Оглавление

- [Фундаментальное правило: нет try/catch](#фундаментальное-правило-нет-trycatch)
- [Паттерн защитных проверок (Guard Clause)](#паттерн-защитных-проверок-guard-clause)
  - [Одиночная проверка](#одиночная-проверка)
  - [Множественные проверки (стек)](#множественные-проверки-стек)
  - [Проверка с логированием](#проверка-с-логированием)
- [Проверка на null](#проверка-на-null)
  - [Перед каждой операцией](#перед-каждой-операцией)
  - [Цепочки проверок на null](#цепочки-проверок-на-null)
  - [Ключевое слово notnull](#ключевое-слово-notnull)
- [ErrorEx — сообщение об ошибке движка](#errorex--сообщение-об-ошибке-движка)
  - [Уровни серьёзности](#уровни-серьёзности)
  - [Когда использовать каждый уровень](#когда-использовать-каждый-уровень)
- [DumpStackString — трассировка стека](#dumpstackstring--трассировка-стека)
- [Отладочная печать](#отладочная-печать)
  - [Базовый Print](#базовый-print)
  - [Условная отладка с #ifdef](#условная-отладка-с-ifdef)
- [Паттерны структурированного логирования](#паттерны-структурированного-логирования)
  - [Простой паттерн с префиксом](#простой-паттерн-с-префиксом)
  - [Класс логгера с уровнями](#класс-логгера-с-уровнями)
  - [Стиль MyLog (продакшн-паттерн)](#стиль-mylog-продакшн-паттерн)
- [Реальные примеры](#реальные-примеры)
  - [Безопасная функция с множественными проверками](#безопасная-функция-с-множественными-проверками)
  - [Безопасная загрузка конфигурации](#безопасная-загрузка-конфигурации)
  - [Безопасный обработчик RPC](#безопасный-обработчик-rpc)
  - [Безопасная операция с инвентарём](#безопасная-операция-с-инвентарём)
- [Сводка оборонительных паттернов](#сводка-оборонительных-паттернов)
- [Частые ошибки](#частые-ошибки)
- [Итоги](#итоги)
- [Навигация](#навигация)

---

## Фундаментальное правило: нет try/catch

Enforce Script **не имеет обработки исключений**. Нет `try`, нет `catch`, нет `throw`, нет `finally`. Если что-то пошло не так во время выполнения (разыменование null, некорректное приведение типа, выход за границы массива), движок либо:

1. **Тихо падает** — функция прекращает выполнение, сообщение об ошибке отсутствует
2. **Записывает ошибку скрипта** — видимую в лог-файле `.RPT`
3. **Вызывает крах сервера/клиента** — в тяжёлых случаях

Это означает, что **каждая потенциальная точка отказа должна быть защищена вручную**. Основная защита — **паттерн защитных проверок (guard clause)**.

---

## Паттерн защитных проверок (Guard Clause)

Защитная проверка проверяет предусловие в начале функции и делает ранний возврат, если оно не выполнено. Это сохраняет «счастливый путь» ненагруженным вложенностью и читаемым.

### Одиночная проверка

```c
void TeleportPlayer(PlayerBase player, vector destination)
{
    if (!player)
        return;

    player.SetPosition(destination);
}
```

### Множественные проверки (стек)

Ставьте проверки в начале функции — каждая проверяет одно предусловие:

```c
void GiveItemToPlayer(PlayerBase player, string className, int quantity)
{
    // Проверка 1: игрок существует
    if (!player)
        return;

    // Проверка 2: игрок жив
    if (!player.IsAlive())
        return;

    // Проверка 3: корректное имя класса
    if (className == "")
        return;

    // Проверка 4: корректное количество
    if (quantity <= 0)
        return;

    // Все предусловия выполнены — можно продолжать
    for (int i = 0; i < quantity; i++)
    {
        player.GetInventory().CreateInInventory(className);
    }
}
```

### Проверка с логированием

В продакшн-коде всегда логируйте причину срабатывания проверки — тихие отказы крайне сложно отладить:

```c
void StartMission(PlayerBase initiator, string missionId)
{
    if (!initiator)
    {
        Print("[Missions] ERROR: StartMission вызван с null-инициатором");
        return;
    }

    if (missionId == "")
    {
        Print("[Missions] ERROR: StartMission вызван с пустым missionId");
        return;
    }

    if (!initiator.IsAlive())
    {
        Print("[Missions] WARN: Игрок " + initiator.GetIdentity().GetName() + " мёртв, нельзя начать миссию");
        return;
    }

    // Приступаем к запуску миссии
    Print("[Missions] Запуск миссии " + missionId);
    // ...
}
```

---

## Проверка на null

Null-ссылки — самый частый источник крашей в моддинге DayZ. Каждый ссылочный тип может быть `null`.

### Перед каждой операцией

```c
// НЕПРАВИЛЬНО — крашится, если player, identity или name равны null
string name = player.GetIdentity().GetName();

// ПРАВИЛЬНО — проверяем каждый шаг
if (!player)
    return;

PlayerIdentity identity = player.GetIdentity();
if (!identity)
    return;

string name = identity.GetName();
```

### Цепочки проверок на null

Когда нужно пройти по цепочке ссылок, проверяйте каждое звено:

```c
void PrintHandItemName(PlayerBase player)
{
    if (!player)
        return;

    HumanInventory inv = player.GetHumanInventory();
    if (!inv)
        return;

    EntityAI handItem = inv.GetEntityInHands();
    if (!handItem)
        return;

    Print("Игрок держит: " + handItem.GetType());
}
```

### Ключевое слово notnull

`notnull` — модификатор параметра, который заставляет компилятор отклонять `null`-аргументы на стороне вызова:

```c
void ProcessItem(notnull EntityAI item)
{
    // Компилятор гарантирует, что item не null
    // Проверка на null внутри функции не нужна
    Print(item.GetType());
}

// Использование:
EntityAI item = GetSomeItem();
if (item)
{
    ProcessItem(item);  // OK — компилятор знает, что item не null
}
ProcessItem(null);      // Ошибка компиляции!
```

> **Ограничение:** `notnull` ловит только литеральный `null` и очевидно-null переменные на стороне вызова. Он не предотвращает ситуацию, когда переменная, бывшая ненулевой в момент проверки, станет null из-за удаления движком.

---

## ErrorEx — сообщение об ошибке движка

`ErrorEx` записывает сообщение об ошибке в лог скриптов (файл `.RPT`). Она **не** останавливает выполнение и не выбрасывает исключение.

```c
ErrorEx("Что-то пошло не так");
```

### Уровни серьёзности

`ErrorEx` принимает необязательный второй параметр типа `ErrorExSeverity`:

```c
// INFO — информационное сообщение, не ошибка
ErrorEx("Конфигурация успешно загружена", ErrorExSeverity.INFO);

// WARNING — потенциальная проблема, выполнение продолжается
ErrorEx("Файл конфигурации не найден, используются значения по умолчанию", ErrorExSeverity.WARNING);

// ERROR — определённая проблема (серьёзность по умолчанию, если не указана)
ErrorEx("Не удалось создать объект: класс не найден");
ErrorEx("Критический сбой в обработчике RPC", ErrorExSeverity.ERROR);
```

| Серьёзность | Когда использовать |
|----------|-------------|
| `ErrorExSeverity.INFO` | Информационные сообщения, которые нужно записать в лог ошибок |
| `ErrorExSeverity.WARNING` | Восстановимые проблемы (отсутствует конфиг, используется запасной вариант) |
| `ErrorExSeverity.ERROR` | Определённые баги или невосстановимые состояния |

### Когда использовать каждый уровень

```c
void LoadConfig(string path)
{
    if (!FileExist(path))
    {
        // WARNING — восстановимо, используем значения по умолчанию
        ErrorEx("Конфигурация не найдена по пути " + path + ", используются значения по умолчанию", ErrorExSeverity.WARNING);
        UseDefaultConfig();
        return;
    }

    MyConfig cfg = new MyConfig();
    JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);

    if (cfg.Version < EXPECTED_VERSION)
    {
        // INFO — не проблема, просто заслуживает внимания
        ErrorEx("Версия конфигурации " + cfg.Version.ToString() + " старше ожидаемой", ErrorExSeverity.INFO);
    }

    if (!cfg.Validate())
    {
        // ERROR — некорректные данные, которые вызовут проблемы
        ErrorEx("Валидация конфигурации не пройдена для " + path);
        UseDefaultConfig();
        return;
    }
}
```

---

## DumpStackString — трассировка стека

`DumpStackString` захватывает текущий стек вызовов в виде строки. Это критически важно для диагностики того, где произошло неожиданное состояние:

```c
void OnUnexpectedState(string context)
{
    string stack = DumpStackString();
    Print("[ERROR] Неожиданное состояние в " + context);
    Print("[ERROR] Трассировка стека:");
    Print(stack);
}
```

Используйте в защитных проверках для отслеживания вызывающего кода:

```c
void CriticalFunction(PlayerBase player)
{
    if (!player)
    {
        string stack = DumpStackString();
        ErrorEx("CriticalFunction вызвана с null-игроком! Стек: " + stack);
        return;
    }

    // ...
}
```

---

## Отладочная печать

### Базовый Print

`Print()` записывает в лог-файл скриптов. Принимает любой тип:

```c
Print("Hello World");                    // string
Print(42);                               // int
Print(3.14);                             // float
Print(player.GetPosition());             // vector

// Форматированная печать
Print(string.Format("Игрок %1 на позиции %2 с %3 HP",
    player.GetIdentity().GetName(),
    player.GetPosition().ToString(),
    player.GetHealth("", "Health").ToString()
));
```

### Условная отладка с #ifdef

Оберните отладочную печать в директивы препроцессора, чтобы она исключалась из релизных сборок:

```c
void ProcessAI(DayZInfected zombie)
{
    #ifdef DIAG_DEVELOPER
        Print(string.Format("[AI DEBUG] Обработка %1 на %2",
            zombie.GetType(),
            zombie.GetPosition().ToString()
        ));
    #endif

    // Основная логика...
}
```

Для собственных отладочных флагов мода определите свой символ:

```c
// В вашем config.cpp:
// defines[] = { "MYMOD_DEBUG" };

#ifdef MYMOD_DEBUG
    Print("[MyMod] Debug: предмет создан на " + pos.ToString());
#endif
```

---

## Паттерны структурированного логирования

### Простой паттерн с префиксом

Простейший подход — добавлять тег к каждому вызову Print:

```c
class MissionManager
{
    static const string LOG_TAG = "[Missions] ";

    void Start()
    {
        Print(LOG_TAG + "Система миссий запускается");
    }

    void OnError(string msg)
    {
        Print(LOG_TAG + "ERROR: " + msg);
    }
}
```

### Класс логгера с уровнями

Переиспользуемый логгер с уровнями серьёзности:

```c
class ModLogger
{
    protected string m_Prefix;

    void ModLogger(string prefix)
    {
        m_Prefix = "[" + prefix + "] ";
    }

    void Info(string msg)
    {
        Print(m_Prefix + "INFO: " + msg);
    }

    void Warning(string msg)
    {
        Print(m_Prefix + "WARN: " + msg);
        ErrorEx(m_Prefix + msg, ErrorExSeverity.WARNING);
    }

    void Error(string msg)
    {
        Print(m_Prefix + "ERROR: " + msg);
        ErrorEx(m_Prefix + msg, ErrorExSeverity.ERROR);
    }

    void Debug(string msg)
    {
        #ifdef DIAG_DEVELOPER
            Print(m_Prefix + "DEBUG: " + msg);
        #endif
    }
}

// Использование:
ref ModLogger g_MissionLog = new ModLogger("Missions");
g_MissionLog.Info("Система запущена");
g_MissionLog.Error("Не удалось загрузить данные миссии");
```

### Продакшн-паттерн логгера

Для продакшн-модов — статический класс логирования с выводом в файл, ежедневной ротацией и множественными целями вывода:

```c
// Перечисление для уровней лога
enum MyLogLevel
{
    TRACE   = 0,
    DEBUG   = 1,
    INFO    = 2,
    WARNING = 3,
    ERROR   = 4,
    NONE    = 5
};

class MyLog
{
    private static MyLogLevel s_FileMinLevel = MyLogLevel.DEBUG;
    private static MyLogLevel s_ConsoleMinLevel = MyLogLevel.INFO;

    // Использование: MyLog.Info("ModuleName", "Что-то произошло");
    static void Info(string source, string message)
    {
        Log(MyLogLevel.INFO, source, message);
    }

    static void Warning(string source, string message)
    {
        Log(MyLogLevel.WARNING, source, message);
    }

    static void Error(string source, string message)
    {
        Log(MyLogLevel.ERROR, source, message);
    }

    private static void Log(MyLogLevel level, string source, string message)
    {
        if (level < s_ConsoleMinLevel)
            return;

        string levelName = typename.EnumToString(MyLogLevel, level);
        string line = string.Format("[MyMod] [%1] [%2] %3", levelName, source, message);
        Print(line);

        // Также записываем в файл, если уровень соответствует файловому порогу
        if (level >= s_FileMinLevel)
        {
            WriteToFile(line);
        }
    }

    private static void WriteToFile(string line)
    {
        // Реализация файлового ввода-вывода...
    }
}
```

Использование в нескольких модулях:

```c
MyLog.Info("MissionServer", "MyMod Core инициализирован (сервер)");
MyLog.Warning("ServerWebhooksRPC", "Неавторизованный запрос от: " + sender.GetName());
MyLog.Error("ConfigManager", "Не удалось загрузить конфигурацию: " + path);
```

---

## Реальные примеры

### Безопасная функция с множественными проверками

```c
void HealPlayer(PlayerBase player, float amount, string healerName)
{
    // Проверка: null-игрок
    if (!player)
    {
        MyLog.Error("HealSystem", "HealPlayer вызван с null-игроком");
        return;
    }

    // Проверка: игрок жив
    if (!player.IsAlive())
    {
        MyLog.Warning("HealSystem", "Нельзя вылечить мёртвого игрока: " + player.GetIdentity().GetName());
        return;
    }

    // Проверка: корректная величина
    if (amount <= 0)
    {
        MyLog.Warning("HealSystem", "Некорректная величина лечения: " + amount.ToString());
        return;
    }

    // Проверка: здоровье ещё не полное
    float currentHP = player.GetHealth("", "Health");
    float maxHP = player.GetMaxHealth("", "Health");
    if (currentHP >= maxHP)
    {
        MyLog.Info("HealSystem", player.GetIdentity().GetName() + " уже на полном здоровье");
        return;
    }

    // Все проверки пройдены — выполняем лечение
    float newHP = Math.Min(currentHP + amount, maxHP);
    player.SetHealth("", "Health", newHP);

    MyLog.Info("HealSystem", string.Format("%1 вылечил %2 на %3 HP (%4 -> %5)",
        healerName,
        player.GetIdentity().GetName(),
        amount.ToString(),
        currentHP.ToString(),
        newHP.ToString()
    ));
}
```

### Безопасная загрузка конфигурации

```c
class MyConfig
{
    int MaxPlayers = 60;
    float SpawnRadius = 100.0;
    string WelcomeMessage = "Welcome!";
}

static MyConfig LoadConfigSafe(string path)
{
    // Проверка: файл существует
    if (!FileExist(path))
    {
        Print("[Config] Файл не найден: " + path + " — создаём значения по умолчанию");
        MyConfig defaults = new MyConfig();
        JsonFileLoader<MyConfig>.JsonSaveFile(path, defaults);
        return defaults;
    }

    // Попытка загрузки (нет try/catch, поэтому проверяем после)
    MyConfig cfg = new MyConfig();
    JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);

    // Проверка: загруженный объект корректен
    if (!cfg)
    {
        Print("[Config] ERROR: Не удалось распарсить " + path + " — используются значения по умолчанию");
        return new MyConfig();
    }

    // Проверка: валидация значений
    if (cfg.MaxPlayers < 1 || cfg.MaxPlayers > 128)
    {
        Print("[Config] WARN: MaxPlayers вне диапазона (" + cfg.MaxPlayers.ToString() + "), ограничиваем");
        cfg.MaxPlayers = Math.Clamp(cfg.MaxPlayers, 1, 128);
    }

    if (cfg.SpawnRadius < 0)
    {
        Print("[Config] WARN: SpawnRadius отрицательный, используем значение по умолчанию");
        cfg.SpawnRadius = 100.0;
    }

    return cfg;
}
```

### Безопасный обработчик RPC

```c
void RPC_SpawnItem(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    // Проверка: только сервер
    if (type != CallType.Server)
        return;

    // Проверка: корректный отправитель
    if (!sender)
    {
        Print("[RPC] SpawnItem: null-идентификатор отправителя");
        return;
    }

    // Проверка: чтение параметров
    Param2<string, vector> data;
    if (!ctx.Read(data))
    {
        Print("[RPC] SpawnItem: не удалось прочитать параметры от " + sender.GetName());
        return;
    }

    string className = data.param1;
    vector position = data.param2;

    // Проверка: корректное имя класса
    if (className == "")
    {
        Print("[RPC] SpawnItem: пустой className от " + sender.GetName());
        return;
    }

    // Проверка: проверка прав доступа
    if (!HasPermission(sender.GetPlainId(), "SpawnItem"))
    {
        Print("[RPC] SpawnItem: отказано в доступе для " + sender.GetName());
        return;
    }

    // Все проверки пройдены — выполняем
    Object obj = GetGame().CreateObjectEx(className, position, ECE_PLACE_ON_SURFACE);
    if (!obj)
    {
        Print("[RPC] SpawnItem: CreateObjectEx вернул null для " + className);
        return;
    }

    Print("[RPC] SpawnItem: " + sender.GetName() + " создал " + className);
}
```

### Безопасная операция с инвентарём

```c
bool TransferItem(PlayerBase fromPlayer, PlayerBase toPlayer, EntityAI item)
{
    // Проверка: все ссылки валидны
    if (!fromPlayer || !toPlayer || !item)
    {
        Print("[Inventory] TransferItem: null-ссылка");
        return false;
    }

    // Проверка: оба игрока живы
    if (!fromPlayer.IsAlive() || !toPlayer.IsAlive())
    {
        Print("[Inventory] TransferItem: один или оба игрока мертвы");
        return false;
    }

    // Проверка: у источника действительно есть предмет
    EntityAI checkItem = fromPlayer.GetInventory().FindAttachment(
        fromPlayer.GetInventory().FindUserReservedLocationIndex(item)
    );

    // Проверка: у получателя есть место
    InventoryLocation il = new InventoryLocation();
    if (!toPlayer.GetInventory().FindFreeLocationFor(item, FindInventoryLocationType.ANY, il))
    {
        Print("[Inventory] TransferItem: нет свободного места в инвентаре получателя");
        return false;
    }

    // Выполняем передачу
    return toPlayer.GetInventory().TakeEntityToInventory(InventoryMode.SERVER, FindInventoryLocationType.ANY, item);
}
```

---

## Сводка оборонительных паттернов

| Паттерн | Назначение | Пример |
|---------|---------|---------|
| Защитная проверка | Ранний возврат при некорректном вводе | `if (!player) return;` |
| Проверка на null | Предотвращение разыменования null | `if (obj) obj.DoThing();` |
| Приведение + проверка | Безопасное приведение типа | `if (Class.CastTo(p, obj))` |
| Валидация после загрузки | Проверка данных после загрузки JSON | `if (cfg.Value < 0) cfg.Value = default;` |
| Валидация перед использованием | Проверка диапазона/границ | `if (arr.IsValidIndex(i))` |
| Логирование при отказе | Отслеживание, где что-то пошло не так | `Print("[Tag] Error: " + context);` |
| ErrorEx для движка | Запись в файл .RPT | `ErrorEx("msg", ErrorExSeverity.WARNING);` |
| DumpStackString | Захват стека вызовов | `Print(DumpStackString());` |

---

## Лучшие практики

- Используйте плоские защитные проверки (`if (!x) return;`) в начале каждой функции вместо глубоко вложенных блоков `if` — это сохраняет код читаемым, а «счастливый путь» — без вложенности.
- Всегда логируйте сообщение внутри защитных проверок — тихий `return` делает отказы невидимыми и крайне сложными для отладки.
- Используйте `ErrorEx` с соответствующими уровнями серьёзности (`INFO`, `WARNING`, `ERROR`) для сообщений, которые должны появиться в логах `.RPT`; используйте `Print` для вывода в лог скриптов.
- Оборачивайте тяжёлое отладочное логирование в `#ifdef DIAG_DEVELOPER` или собственный define, чтобы оно исключалось из релизных сборок и не снижало производительность.
- Валидируйте данные конфигурации после загрузки через `JsonFileLoader` — он возвращает `void` и тихо оставляет значения по умолчанию при ошибке парсинга.

---

## Замечено в реальных модах

> Паттерны подтверждены изучением исходного кода профессиональных модов DayZ.

| Паттерн | Мод | Подробности |
|---------|-----|--------|
| Стек защитных проверок с лог-сообщениями | COT / VPP | Каждый обработчик RPC проверяет отправителя, параметры, права доступа и логирует каждый отказ |
| Статический класс логгера с фильтрацией уровней | Expansion / Dabs | Единый класс `Log` направляет `Info`/`Warning`/`Error` в консоль, файл и опционально Discord |
| `DumpStackString()` в критических проверках | COT Admin | Захватывает стек вызовов при неожиданном null для отслеживания, какой вызывающий код передал некорректные данные |
| `#ifdef DIAG_DEVELOPER` вокруг отладочной печати | Ванильный DayZ / Expansion | Вся покадровая отладочная печать обёрнута, чтобы никогда не выполняться в релизных сборках |

---

## Теория vs практика

| Концепция | Теория | Реальность |
|---------|--------|---------|
| `try`/`catch` | Стандарт в большинстве языков | Не существует в Enforce Script — каждая точка отказа должна быть защищена вручную |
| `JsonFileLoader.JsonLoadFile` | Ожидается возврат успеха/неудачи | Возвращает `void`; при некорректном JSON объект сохраняет значения по умолчанию без ошибки |
| `ErrorEx` | Звучит как выброс ошибки | Только записывает в лог `.RPT` — выполнение продолжается нормально |

---

## Частые ошибки

### 1. Предположение, что функция выполнилась успешно

```c
// НЕПРАВИЛЬНО — JsonLoadFile возвращает void, а не индикатор успеха
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
// Если в файле некорректный JSON, cfg всё ещё хранит значения по умолчанию — без ошибки

// ПРАВИЛЬНО — валидация после загрузки
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
if (cfg.SomeCriticalField == 0)
{
    Print("[Config] Предупреждение: SomeCriticalField равно нулю — файл загружен правильно?");
}
```

### 2. Глубоко вложенные проверки на null вместо защитных проверок

```c
// НЕПРАВИЛЬНО — пирамида судьбы
void Process(PlayerBase player)
{
    if (player)
    {
        if (player.GetIdentity())
        {
            if (player.IsAlive())
            {
                // Наконец делаем что-то
            }
        }
    }
}

// ПРАВИЛЬНО — плоские защитные проверки
void Process(PlayerBase player)
{
    if (!player) return;
    if (!player.GetIdentity()) return;
    if (!player.IsAlive()) return;

    // Делаем что-то
}
```

### 3. Забыли логирование в защитных проверках

```c
// НЕПРАВИЛЬНО — тихий отказ, невозможно отладить
if (!player) return;

// ПРАВИЛЬНО — оставляем след
if (!player)
{
    Print("[MyMod] Process: null-игрок");
    return;
}
```

### 4. Использование Print в горячих путях

```c
// НЕПРАВИЛЬНО — Print каждый кадр убивает производительность
override void OnUpdate(float timeslice)
{
    Print("Updating...");  // Вызывается каждый кадр!
}

// ПРАВИЛЬНО — используйте отладочные проверки или ограничение частоты
override void OnUpdate(float timeslice)
{
    #ifdef DIAG_DEVELOPER
        m_DebugTimer += timeslice;
        if (m_DebugTimer > 5.0)
        {
            Print("[DEBUG] Update tick: " + timeslice.ToString());
            m_DebugTimer = 0;
        }
    #endif
}
```

---

## Итоги

| Инструмент | Назначение | Синтаксис |
|------|---------|--------|
| Защитная проверка | Ранний возврат при отказе | `if (!x) return;` |
| Проверка на null | Предотвращение краша | `if (obj) obj.Method();` |
| ErrorEx | Запись в лог .RPT | `ErrorEx("msg", ErrorExSeverity.WARNING);` |
| DumpStackString | Получение стека вызовов | `string s = DumpStackString();` |
| Print | Запись в лог скриптов | `Print("message");` |
| string.Format | Форматированное логирование | `string.Format("P %1 at %2", a, b)` |
| Директива #ifdef | Переключатель отладки на этапе компиляции | `#ifdef DIAG_DEVELOPER` |
| notnull | Компиляторная проверка на null | `void Fn(notnull Class obj)` |

**Золотое правило:** В Enforce Script считайте, что всё может быть null и любая операция может завершиться неудачей. Сначала проверяйте, потом действуйте, всегда логируйте.

---

## Навигация

| Назад | Наверх | Далее |
|----------|----|------|
| [1.10 Перечисления и препроцессор](10-enums-preprocessor.md) | [Часть 1: Enforce Script](../README.md) | [1.12 Чего НЕ существует](12-gotchas.md) |
