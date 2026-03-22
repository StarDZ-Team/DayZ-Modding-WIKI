# Глава 1.10: Перечисления и препроцессор

[Главная](../README.md) | [<< Назад: Приведение типов и рефлексия](09-casting-reflection.md) | **Перечисления и препроцессор** | [Далее: Обработка ошибок >>](11-error-handling.md)

---

> **Цель:** Изучить объявление перечислений, инструменты рефлексии перечислений, паттерны битовых флагов, константы и систему препроцессора для условной компиляции.

---

## Оглавление

- [Объявление перечислений](#объявление-перечислений)
- [Использование перечислений](#использование-перечислений)
- [Рефлексия перечислений](#рефлексия-перечислений)
- [Паттерн битовых флагов](#паттерн-битовых-флагов)
- [Константы](#константы)
- [Директивы препроцессора](#директивы-препроцессора)
- [Примеры из реальной практики](#примеры-из-реальной-практики)
- [Распространённые ошибки](#распространённые-ошибки)
- [Итоги](#итоги)
- [Навигация](#навигация)

---

## Объявление перечислений

Перечисления в Enforce Script определяют именованные целочисленные константы, объединённые под одним именем типа. Внутренне они ведут себя как `int`.

### Явные значения

```c
enum EDamageState
{
    PRISTINE  = 0,
    WORN      = 1,
    DAMAGED   = 2,
    BADLY_DAMAGED = 3,
    RUINED    = 4
};
```

### Неявные значения

Если значения опущены, они автоматически увеличиваются от предыдущего (начиная с 0):

```c
enum EWeaponMode
{
    SEMI,       // 0
    BURST,      // 1
    AUTO,       // 2
    COUNT       // 3 — распространённый приём для получения общего количества
};
```

### Наследование перечислений

Перечисления могут наследоваться от других перечислений. Значения продолжаются от последнего значения родителя:

```c
enum EBaseColor
{
    RED    = 0,
    GREEN  = 1,
    BLUE   = 2
};

enum EExtendedColor : EBaseColor
{
    YELLOW,   // 3
    CYAN,     // 4
    MAGENTA   // 5
};
```

Все значения родителя доступны через дочернее перечисление:

```c
int c = EExtendedColor.RED;      // 0 — унаследовано от EBaseColor
int d = EExtendedColor.YELLOW;   // 3 — определено в EExtendedColor
```

> **Примечание:** Наследование перечислений полезно для расширения ванильных перечислений в моддинг-коде без изменения оригинала.

---

## Использование перечислений

Перечисления действуют как `int` — их можно присваивать переменным `int`, сравнивать и использовать в операторах switch:

```c
EDamageState state = EDamageState.WORN;

// Сравнение
if (state == EDamageState.RUINED)
{
    Print("Предмет разрушен!");
}

// Использование в switch
switch (state)
{
    case EDamageState.PRISTINE:
        Print("Идеальное состояние");
        break;
    case EDamageState.WORN:
        Print("Слегка изношен");
        break;
    case EDamageState.DAMAGED:
        Print("Повреждён");
        break;
    case EDamageState.BADLY_DAMAGED:
        Print("Сильно повреждён");
        break;
    case EDamageState.RUINED:
        Print("Разрушен!");
        break;
}

// Присвоение в int
int stateInt = state;  // 1

// Присвоение из int (без проверки — принимается любое значение!)
EDamageState fromInt = 99;  // Ошибки нет, хотя 99 не является допустимым значением
```

> **Предупреждение:** Enforce Script **не** проверяет присвоения перечислений. Присвоение целого числа вне диапазона переменной перечисления компилируется и выполняется без ошибок.

---

## Рефлексия перечислений

Enforce Script предоставляет встроенные функции для преобразования между значениями перечислений и строками.

### typename.EnumToString

Преобразование значения перечисления в его имя в виде строки:

```c
EDamageState state = EDamageState.DAMAGED;
string name = typename.EnumToString(EDamageState, state);
Print(name);  // "DAMAGED"
```

Незаменимо для логирования и отображения в интерфейсе:

```c
void LogDamageState(EntityAI item, EDamageState state)
{
    string stateName = typename.EnumToString(EDamageState, state);
    Print(item.GetType() + " имеет состояние " + stateName);
}
```

### typename.StringToEnum

Преобразование строки обратно в значение перечисления:

```c
int value;
typename.StringToEnum(EDamageState, "RUINED", value);
Print(value.ToString());  // "4"
```

Используется при загрузке значений перечислений из файлов конфигурации или JSON:

```c
// Загрузка из строки конфигурации
string configValue = "BURST";
int modeInt;
if (typename.StringToEnum(EWeaponMode, configValue, modeInt))
{
    EWeaponMode mode = modeInt;
    Print("Загружен режим оружия: " + typename.EnumToString(EWeaponMode, mode));
}
```

---

## Паттерн битовых флагов

Перечисления со значениями степени двойки создают битовые флаги — несколько опций, объединённых в одном целом числе:

```c
enum ESpawnFlags
{
    NONE            = 0,
    PLACE_ON_GROUND = 1,     // 1 << 0
    CREATE_PHYSICS  = 2,     // 1 << 1
    UPDATE_NAVMESH  = 4,     // 1 << 2
    CREATE_LOCAL    = 8,     // 1 << 3
    NO_LIFETIME     = 16     // 1 << 4
};
```

Комбинирование побитовым ИЛИ, проверка побитовым И:

```c
// Комбинирование флагов
int flags = ESpawnFlags.PLACE_ON_GROUND | ESpawnFlags.CREATE_PHYSICS | ESpawnFlags.UPDATE_NAVMESH;

// Проверка одного флага
if (flags & ESpawnFlags.CREATE_PHYSICS)
{
    Print("Будет создана физика");
}

// Удаление флага
flags = flags & ~ESpawnFlags.CREATE_LOCAL;

// Добавление флага
flags = flags | ESpawnFlags.NO_LIFETIME;
```

DayZ широко использует этот паттерн для флагов создания объектов (`ECE_PLACE_ON_SURFACE`, `ECE_CREATEPHYSICS`, `ECE_UPDATEPATHGRAPH` и т.д.).

---

## Константы

Используйте `const` для объявления неизменяемых значений. Константы должны быть инициализированы при объявлении.

```c
// Целочисленные константы
const int MAX_PLAYERS = 60;
const int INVALID_INDEX = -1;

// Константы с плавающей точкой
const float GRAVITY = 9.81;
const float SPAWN_RADIUS = 500.0;

// Строковые константы
const string MOD_NAME = "MyMod";
const string CONFIG_PATH = "$profile:MyMod/config.json";
const string LOG_PREFIX = "[MyMod] ";
```

Константы можно использовать как значения case в switch и размеры массивов:

```c
// Массив с размером по константе
const int BUFFER_SIZE = 256;
int buffer[BUFFER_SIZE];

// Switch с константными значениями
const int CMD_HELP = 1;
const int CMD_SPAWN = 2;
const int CMD_TELEPORT = 3;

switch (command)
{
    case CMD_HELP:
        ShowHelp();
        break;
    case CMD_SPAWN:
        SpawnItem();
        break;
    case CMD_TELEPORT:
        TeleportPlayer();
        break;
}
```

> **Примечание:** Для ссылочных типов (объектов) `const` не существует. Сделать ссылку на объект неизменяемой нельзя.

---

## Директивы препроцессора

Препроцессор Enforce Script выполняется перед компиляцией, обеспечивая условное включение кода. Работает аналогично препроцессору C/C++, но с меньшим набором возможностей.

### #ifdef / #ifndef / #endif

Условное включение кода в зависимости от того, определён ли символ:

```c
// Включить код только если определён DEVELOPER
#ifdef DEVELOPER
    Print("[DEBUG] Диагностика включена");
#endif

// Включить код только если символ НЕ определён
#ifndef SERVER
    // Код только для клиента
    CreateClientUI();
#endif

// Паттерн if-else
#ifdef SERVER
    Print("Выполняется на сервере");
#else
    Print("Выполняется на клиенте");
#endif
```

### #define

Определение собственных символов (без значения — только существование):

```c
#define MY_MOD_DEBUG

#ifdef MY_MOD_DEBUG
    Print("Режим отладки активен");
#endif
```

> **Примечание:** `#define` в Enforce Script создаёт только флаги существования. Макроподстановка **не** поддерживается (нет `#define MAX_HP 100` — используйте вместо этого `const`).

### Стандартные определения движка

DayZ предоставляет встроенные определения в зависимости от типа сборки и платформы:

| Определение | Когда доступно | Для чего |
|--------|---------------|---------|
| `SERVER` | На выделенном сервере | Серверная логика |
| `DEVELOPER` | Сборка для разработчика | Функции только для разработки |
| `DIAG_DEVELOPER` | Диагностическая сборка | Диагностические меню, инструменты отладки |
| `PLATFORM_WINDOWS` | Платформа Windows | Платформо-зависимые пути |
| `PLATFORM_XBOX` | Платформа Xbox | UI для консолей |
| `PLATFORM_PS4` | Платформа PlayStation | Логика для консолей |
| `BUILD_EXPERIMENTAL` | Экспериментальная ветка | Экспериментальные функции |

```c
void InitPlatform()
{
    #ifdef PLATFORM_WINDOWS
        Print("Запуск на Windows");
    #endif

    #ifdef PLATFORM_XBOX
        Print("Запуск на Xbox");
    #endif

    #ifdef PLATFORM_PS4
        Print("Запуск на PlayStation");
    #endif
}
```

### Пользовательские определения через config.cpp

Моды могут определять собственные символы в `config.cpp` через массив `defines[]`. Они доступны для всех скриптов, загружаемых после этого мода:

```cpp
class CfgMods
{
    class MyMod_MissionSystem
    {
        // ...
        defines[] = { "MY_MISSIONS_LOADED" };
        // ...
    };
};
```

Теперь другие моды могут определить, загружен ли ваш мод миссий:

```c
#ifdef MY_MISSIONS_LOADED
    // Мод миссий загружен — используем его API
    MyMissionManager.Start();
#else
    // Мод миссий не загружен — пропускаем или используем запасной вариант
    Print("Система миссий не обнаружена");
#endif
```

---

## Примеры из реальной практики

### Платформо-зависимый код

```c
string GetSavePath()
{
    #ifdef PLATFORM_WINDOWS
        return "$profile:MyMod/saves/";
    #else
        return "$saves:MyMod/";
    #endif
}
```

### Опциональные зависимости модов

Стандартный паттерн для модов, которые опционально интегрируются с другими модами:

```c
class MyModManager
{
    void Init()
    {
        Print("[MyMod] Инициализация...");

        // Базовые функции всегда доступны
        LoadConfig();
        RegisterRPCs();

        // Опциональная интеграция с MyFramework
        #ifdef MY_FRAMEWORK
            Print("[MyMod] Фреймворк обнаружен — используем унифицированное логирование");
            RegisterWithCore();
        #endif

        // Опциональная интеграция с Community Framework
        #ifdef JM_CommunityFramework
            GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);
        #endif
    }
}
```

### Диагностика только для отладки

```c
void ProcessAI(DayZInfected zombie)
{
    vector pos = zombie.GetPosition();
    float health = zombie.GetHealth("", "Health");

    // Подробное отладочное логирование — только в диагностических сборках
    #ifdef DIAG_DEVELOPER
        Print(string.Format("[AI] Зомби %1 в позиции %2, HP: %3",
            zombie.GetType(), pos.ToString(), health.ToString()));

        // Отрисовка отладочной сферы (работает только в диагностических сборках)
        Debug.DrawSphere(pos, 1.0, Colors.RED, ShapeFlags.ONCE);
    #endif

    // Фактическая логика выполняется во всех сборках
    if (health <= 0)
    {
        HandleZombieDeath(zombie);
    }
}
```

### Логика сервера и клиента

```c
class MissionHandler
{
    void OnMissionStart()
    {
        #ifdef SERVER
            // Сервер: загрузка данных миссии, спавн объектов
            LoadMissionData();
            SpawnMissionObjects();
            NotifyAllPlayers();
        #else
            // Клиент: настройка UI, подписка на события
            CreateMissionHUD();
            RegisterClientRPCs();
        #endif
    }
}
```

---

## Лучшие практики

- Добавляйте элемент-страж `COUNT` последним значением перечисления для удобной итерации или проверки диапазона (например, `for (int i = 0; i < EMode.COUNT; i++)`).
- Используйте значения степени двойки для перечислений битовых флагов и комбинируйте их через `|`; проверяйте через `&`; удаляйте через `& ~FLAG`.
- Используйте `const` вместо `#define` для числовых констант — `#define` в Enforce Script создаёт только флаги существования, а не макросы со значениями.
- Определяйте массив `defines[]` в `config.cpp` вашего мода для создания символов обнаружения между модами (например, `"STARDZ_CORE"`).
- Всегда проверяйте значения перечислений, загруженные из внешних данных (конфигурации, RPC) — Enforce Script принимает любой `int` как перечисление без проверки диапазона.

---

## Подтверждено в реальных модах

> Паттерны, подтверждённые изучением исходного кода профессиональных модов DayZ.

| Паттерн | Мод | Детали |
|---------|-----|--------|
| `#ifdef` для опциональной интеграции модов | Expansion / COT | Проверяет `#ifdef JM_CF` или `#ifdef EXPANSIONMOD` перед вызовом межмодовых API |
| Битовые перечисления для параметров спавна | Ванильный DayZ | `ECE_PLACE_ON_SURFACE`, `ECE_CREATEPHYSICS` и др. комбинируются через `\|` для `CreateObjectEx` |
| `typename.EnumToString` для логирования | Expansion / Dabs | Состояния повреждения и типы событий логируются как читаемые строки вместо сырых int |
| `defines[]` в config.cpp | StarDZ Core / Expansion | Каждый мод объявляет свой символ, чтобы другие моды могли обнаружить его через `#ifdef` |

---

## Теория и практика

| Концепция | Теория | Реальность |
|---------|--------|---------|
| Проверка присвоения перечислений | Ожидается, что компилятор отклонит недопустимые значения | `EDamageState state = 999` компилируется без проблем — никакой проверки диапазона |
| `#define MAX_HP 100` | Работает как макрос C/C++ | `#define` в Enforce Script создаёт только флаги существования; используйте `const int` для значений |
| Сквозное выполнение `switch` case | Несколько case для одного обработчика | В Enforce Script нет сквозного выполнения — каждый `case` независим; используйте `if`/`\|\|` вместо этого |

---

## Распространённые ошибки

### 1. Использование перечислений как проверенных типов

```c
// ПРОБЛЕМА — нет проверки, принимается любой int
EDamageState state = 999;  // Компилируется, но 999 — недопустимое состояние

// РЕШЕНИЕ — проверяйте вручную при загрузке из внешних данных
int rawValue = LoadFromConfig();
if (rawValue >= 0 && rawValue <= EDamageState.RUINED)
{
    EDamageState state = rawValue;
}
```

### 2. Попытка использовать #define для подстановки значений

```c
// НЕПРАВИЛЬНО — #define в Enforce Script НЕ поддерживает значения
#define MAX_HEALTH 100
int hp = MAX_HEALTH;  // Ошибка компиляции!

// ПРАВИЛЬНО — используйте const
const int MAX_HEALTH = 100;
int hp = MAX_HEALTH;
```

### 3. Неправильная вложенность #ifdef

```c
// ПРАВИЛЬНО — вложенные ifdef допустимы
#ifdef SERVER
    #ifdef MY_FRAMEWORK
        MyLog.Info("MyMod", "Сервер + Core");
    #endif
#endif

// НЕПРАВИЛЬНО — отсутствие #endif вызывает загадочные ошибки компиляции
#ifdef SERVER
    DoServerStuff();
// здесь забыли #endif!
```

### 4. Забыли, что switch/case не имеет сквозного выполнения

```c
// В C/C++ case проваливаются без break.
// В Enforce Script каждый case НЕЗАВИСИМ — сквозного выполнения нет.

switch (state)
{
    case EDamageState.PRISTINE:
    case EDamageState.WORN:
        Print("Хорошее состояние");  // Достигается только для WORN, не для PRISTINE!
        break;
}
```

Если нужно, чтобы несколько case делили логику, используйте if/else:

```c
if (state == EDamageState.PRISTINE || state == EDamageState.WORN)
{
    Print("Хорошее состояние");
}
```

---

## Итоги

### Перечисления

| Возможность | Синтаксис |
|---------|--------|
| Объявление | `enum EName { A = 0, B = 1 };` |
| Неявные значения | `enum EName { A, B, C };` (0, 1, 2) |
| Наследование | `enum EChild : EParent { D, E };` |
| В строку | `typename.EnumToString(EName, value)` |
| Из строки | `typename.StringToEnum(EName, "A", out val)` |
| Комбинирование битфлагов | `flags = A | B` |
| Проверка битфлага | `if (flags & A)` |

### Препроцессор

| Директива | Назначение |
|-----------|---------|
| `#ifdef SYMBOL` | Компилировать, если символ существует |
| `#ifndef SYMBOL` | Компилировать, если символ НЕ существует |
| `#else` | Альтернативная ветка |
| `#endif` | Конец условного блока |
| `#define SYMBOL` | Определить символ (без значения) |

### Ключевые определения

| Определение | Значение |
|--------|---------|
| `SERVER` | Выделенный сервер |
| `DEVELOPER` | Сборка разработчика |
| `DIAG_DEVELOPER` | Диагностическая сборка |
| `PLATFORM_WINDOWS` | ОС Windows |
| Пользовательское: `defines[]` | config.cpp вашего мода |

---

## Навигация

| Назад | Вверх | Далее |
|----------|----|------|
| [1.9 Приведение типов и рефлексия](09-casting-reflection.md) | [Часть 1: Enforce Script](../README.md) | [1.11 Обработка ошибок](11-error-handling.md) |
