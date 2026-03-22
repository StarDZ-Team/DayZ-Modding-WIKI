# Глава 1.9: Приведение типов и рефлексия

[Главная](../README.md) | [<< Назад: Управление памятью](08-memory-management.md) | **Приведение типов и рефлексия** | [Далее: Перечисления и препроцессор >>](10-enums-preprocessor.md)

---

> **Цель:** Освоить безопасное приведение типов, проверки типов во время выполнения и API рефлексии Enforce Script для динамического доступа к свойствам.

---

## Оглавление

- [Зачем нужно приведение типов](#зачем-нужно-приведение-типов)
- [Class.CastTo — безопасное приведение вниз](#classcastto--безопасное-приведение-вниз)
- [Type.Cast — альтернативное приведение](#typecast--альтернативное-приведение)
- [CastTo vs Type.Cast — когда что использовать](#castto-vs-typecast--когда-что-использовать)
- [obj.IsInherited — проверка типа во время выполнения](#obisinherited--проверка-типа-во-время-выполнения)
- [obj.IsKindOf — строковая проверка типа](#obiskindof--строковая-проверка-типа)
- [obj.Type — получение типа во время выполнения](#objtype--получение-типа-во-время-выполнения)
- [typename — хранение ссылок на типы](#typename--хранение-ссылок-на-типы)
- [API рефлексии](#api-рефлексии)
  - [Инспекция переменных](#инспекция-переменных)
  - [EnScript.GetClassVar / SetClassVar](#enscriptgetclassvar--setclassvar)
- [Реальные примеры](#реальные-примеры)
  - [Поиск всех транспортных средств в мире](#поиск-всех-транспортных-средств-в-мире)
  - [Безопасный хелпер для объектов с приведением](#безопасный-хелпер-для-объектов-с-приведением)
  - [Система конфигурации на основе рефлексии](#система-конфигурации-на-основе-рефлексии)
  - [Типобезопасная диспетчеризация событий](#типобезопасная-диспетчеризация-событий)
- [Частые ошибки](#частые-ошибки)
- [Итоги](#итоги)
- [Навигация](#навигация)

---

## Зачем нужно приведение типов

Иерархия сущностей DayZ глубока. Большинство API движка возвращают обобщённый базовый тип (`Object`, `Man`, `Class`), но вам нужен конкретный тип (`PlayerBase`, `ItemBase`, `CarScript`) для доступа к специализированным методам. Приведение типов преобразует базовую ссылку в производную — безопасно.

```
Class (корень)
  └─ Object
       └─ Entity
            └─ EntityAI
                 ├─ InventoryItem → ItemBase
                 ├─ DayZCreatureAI
                 │    ├─ DayZInfected
                 │    └─ DayZAnimal
                 └─ Man
                      └─ DayZPlayer → PlayerBase
```

Вызов метода, которого нет у базового типа, вызывает **крах во время выполнения** — ошибки компиляции не будет, поскольку Enforce Script разрешает виртуальные вызовы во время выполнения.

---

## Class.CastTo — безопасное приведение вниз

`Class.CastTo` — **предпочтительный** метод приведения типов в DayZ. Это статический метод, который записывает результат в `out`-параметр и возвращает `bool`.

```c
// Сигнатура:
// static bool Class.CastTo(out Class target, Class source)

Object obj = GetSomeObject();
PlayerBase player;

if (Class.CastTo(player, obj))
{
    // Приведение успешно — player валиден
    string name = player.GetIdentity().GetName();
    Print("Найден игрок: " + name);
}
else
{
    // Приведение не удалось — obj не является PlayerBase
    // player равен null
}
```

**Почему предпочтителен:**
- Возвращает `false` при неудаче вместо краша
- `out`-параметр устанавливается в `null` при неудаче — безопасно для проверки
- Работает по всей иерархии классов (не только `Object`)

### Паттерн: приведение и продолжение

В циклах используйте неудачу приведения для пропуска нерелевантных объектов:

```c
array<Object> nearObjects = new array<Object>;
array<CargoBase> proxyCargos = new array<CargoBase>;
GetGame().GetObjectsAtPosition(pos, 50.0, nearObjects, proxyCargos);

foreach (Object obj : nearObjects)
{
    EntityAI entity;
    if (!Class.CastTo(entity, obj))
        continue;  // Пропускаем объекты, не являющиеся EntityAI (здания, ландшафт и т.д.)

    // Теперь безопасно вызывать методы EntityAI
    if (entity.IsAlive())
    {
        Print(entity.GetType() + " жив на " + entity.GetPosition().ToString());
    }
}
```

---

## Type.Cast — альтернативное приведение

Каждый класс имеет статический метод `Cast`, который возвращает результат приведения напрямую (или `null` при неудаче).

```c
// Синтаксис: TargetType.Cast(source)

Object obj = GetSomeObject();
PlayerBase player = PlayerBase.Cast(obj);

if (player)
{
    player.DoSomething();
}
```

Это однострочная запись, совмещающая приведение и присваивание, но вы **обязаны** проверить результат на null.

### Приведение примитивов и Param

`Type.Cast` также используется с классами `Param` (активно применяемыми в RPC и событиях):

```c
override void OnEvent(EventType eventTypeId, Param params)
{
    if (eventTypeId == ClientReadyEventTypeID)
    {
        Param2<PlayerIdentity, Man> readyParams = Param2<PlayerIdentity, Man>.Cast(params);
        if (readyParams)
        {
            PlayerIdentity identity = readyParams.param1;
            Man player = readyParams.param2;
        }
    }
}
```

---

## CastTo vs Type.Cast — когда что использовать

| Свойство | `Class.CastTo` | `Type.Cast` |
|---------|----------------|-------------|
| Тип возврата | `bool` | Целевой тип или `null` |
| Null при неудаче | Да (out-параметр устанавливается в null) | Да (возвращает null) |
| Лучше для | if-блоков с ветвлением логики | Однострочных присваиваний |
| Используется в ванильном DayZ | Повсеместно | Повсеместно |
| Работает с не-Object | Да (любой `Class`) | Да (любой `Class`) |

**Практическое правило:** Используйте `Class.CastTo`, когда нужно ветвление по результату. Используйте `Type.Cast`, когда просто нужна типизированная ссылка с последующей проверкой на null.

```c
// CastTo — ветвление по результату
PlayerBase player;
if (Class.CastTo(player, obj))
{
    // обработка игрока
}

// Type.Cast — присвоить и проверить позже
PlayerBase player = PlayerBase.Cast(obj);
if (!player) return;
```

---

## obj.IsInherited — проверка типа во время выполнения

`IsInherited` проверяет, является ли объект экземпляром данного типа **без** выполнения приведения. Принимает аргумент `typename`.

```c
Object obj = GetSomeObject();

if (obj.IsInherited(PlayerBase))
{
    Print("Это игрок!");
}

if (obj.IsInherited(DayZInfected))
{
    Print("Это зомби!");
}

if (obj.IsInherited(CarScript))
{
    Print("Это транспортное средство!");
}
```

`IsInherited` возвращает `true` для точного типа **и** любых родительских типов в иерархии. Объект `PlayerBase` вернёт `true` для `IsInherited(Man)`, `IsInherited(EntityAI)`, `IsInherited(Object)` и т.д.

---

## obj.IsKindOf — строковая проверка типа

`IsKindOf` выполняет ту же проверку, но с **строковым** именем класса. Полезно, когда имя типа приходит из данных (например, из файлов конфигурации).

```c
Object obj = GetSomeObject();

if (obj.IsKindOf("ItemBase"))
{
    Print("Это предмет");
}

if (obj.IsKindOf("DayZAnimal"))
{
    Print("Это животное");
}
```

**Важно:** `IsKindOf` проверяет всю цепочку наследования, как и `IsInherited`. `Mag_STANAG_30Rnd` вернёт `true` для `IsKindOf("Magazine_Base")`, `IsKindOf("InventoryItem")`, `IsKindOf("EntityAI")` и т.д.

### IsInherited vs IsKindOf

| Свойство | `IsInherited(typename)` | `IsKindOf(string)` |
|---------|------------------------|---------------------|
| Аргумент | Тип на этапе компиляции | Строковое имя |
| Скорость | Быстрее (сравнение типов) | Медленнее (строковый поиск) |
| Когда использовать | Тип известен на этапе компиляции | Тип приходит из данных/конфигурации |

---

## obj.Type — получение типа во время выполнения

`Type()` возвращает `typename` фактического класса объекта во время выполнения — не объявленный тип переменной.

```c
Object obj = GetSomeObject();
typename t = obj.Type();

Print(t.ToString());  // например, "PlayerBase", "AK101", "LandRover"
```

Используйте для логирования, отладки или динамического сравнения типов:

```c
void ProcessEntity(EntityAI entity)
{
    typename t = entity.Type();
    Print("Обработка сущности типа: " + t.ToString());

    if (t == PlayerBase)
    {
        Print("Это игрок");
    }
}
```

---

## typename — хранение ссылок на типы

`typename` — полноценный тип в Enforce Script. Его можно хранить в переменных, передавать как параметры и сравнивать.

```c
// Объявление переменной typename
typename playerType = PlayerBase;
typename vehicleType = CarScript;

// Сравнение
typename objType = obj.Type();
if (objType == playerType)
{
    Print("Совпадение!");
}

// Использование в коллекциях
array<typename> allowedTypes = new array<typename>;
allowedTypes.Insert(PlayerBase);
allowedTypes.Insert(DayZInfected);
allowedTypes.Insert(DayZAnimal);

// Проверка принадлежности
foreach (typename t : allowedTypes)
{
    if (obj.IsInherited(t))
    {
        Print("Объект соответствует разрешённому типу: " + t.ToString());
        break;
    }
}
```

### Создание экземпляров из typename

Можно создавать объекты из `typename` во время выполнения:

```c
typename t = PlayerBase;
Class instance = t.Spawn();  // Создаёт новый экземпляр

// Или строковый подход:
Class instance2 = GetGame().CreateObjectEx("AK101", pos, ECE_PLACE_ON_SURFACE);
```

> **Примечание:** `typename.Spawn()` работает только для классов с конструктором без параметров. Для сущностей DayZ используйте `GetGame().CreateObject()` или `CreateObjectEx()`.

---

## API рефлексии

Enforce Script предоставляет базовую рефлексию — возможность инспектировать и модифицировать свойства объекта во время выполнения без знания его типа на этапе компиляции.

### Инспекция переменных

`Type()` каждого объекта возвращает `typename`, предоставляющий метаданные переменных:

```c
void InspectObject(Class obj)
{
    typename t = obj.Type();

    int varCount = t.GetVariableCount();
    Print("Класс: " + t.ToString() + " имеет " + varCount.ToString() + " переменных");

    for (int i = 0; i < varCount; i++)
    {
        string varName = t.GetVariableName(i);
        typename varType = t.GetVariableType(i);

        Print("  [" + i.ToString() + "] " + varName + " : " + varType.ToString());
    }
}
```

**Доступные методы рефлексии на `typename`:**

| Метод | Возвращает | Описание |
|--------|---------|-------------|
| `GetVariableCount()` | `int` | Количество переменных-членов |
| `GetVariableName(int index)` | `string` | Имя переменной по индексу |
| `GetVariableType(int index)` | `typename` | Тип переменной по индексу |
| `ToString()` | `string` | Имя класса в виде строки |

### EnScript.GetClassVar / SetClassVar

`EnScript.GetClassVar` и `EnScript.SetClassVar` позволяют читать/записывать переменные-члены по **имени** во время выполнения. Это аналог динамического доступа к свойствам в Enforce Script.

```c
// Сигнатура:
// static void EnScript.GetClassVar(Class instance, string varName, int index, out T value)
// static bool EnScript.SetClassVar(Class instance, string varName, int index, T value)
// 'index' — индекс элемента массива — используйте 0 для не-массивных полей.

class MyConfig
{
    int MaxSpawns = 10;
    float SpawnRadius = 100.0;
    string WelcomeMsg = "Hello!";
}

void DemoReflection()
{
    MyConfig cfg = new MyConfig();

    // Чтение значений по имени
    int maxVal;
    EnScript.GetClassVar(cfg, "MaxSpawns", 0, maxVal);
    Print("MaxSpawns = " + maxVal.ToString());  // "MaxSpawns = 10"

    float radius;
    EnScript.GetClassVar(cfg, "SpawnRadius", 0, radius);
    Print("SpawnRadius = " + radius.ToString());  // "SpawnRadius = 100"

    string msg;
    EnScript.GetClassVar(cfg, "WelcomeMsg", 0, msg);
    Print("WelcomeMsg = " + msg);  // "WelcomeMsg = Hello!"

    // Запись значений по имени
    EnScript.SetClassVar(cfg, "MaxSpawns", 0, 50);
    EnScript.SetClassVar(cfg, "SpawnRadius", 0, 250.0);
    EnScript.SetClassVar(cfg, "WelcomeMsg", 0, "Welcome!");
}
```

> **Предупреждение:** `GetClassVar`/`SetClassVar` молча завершаются неудачей, если имя переменной неверно или тип не совпадает. Всегда валидируйте имена переменных перед использованием.

---

## Реальные примеры

### Поиск всех транспортных средств в мире

```c
static array<CarScript> FindAllVehicles()
{
    array<CarScript> vehicles = new array<CarScript>;
    array<Object> allObjects = new array<Object>;
    array<CargoBase> proxyCargos = new array<CargoBase>;

    // Поиск на большой площади (или используйте логику, специфичную для миссии)
    vector center = "7500 0 7500";
    GetGame().GetObjectsAtPosition(center, 15000.0, allObjects, proxyCargos);

    foreach (Object obj : allObjects)
    {
        CarScript car;
        if (Class.CastTo(car, obj))
        {
            vehicles.Insert(car);
        }
    }

    Print("Найдено " + vehicles.Count().ToString() + " транспортных средств");
    return vehicles;
}
```

### Безопасный хелпер для объектов с приведением

Этот паттерн используется повсеместно в моддинге DayZ — утилитарная функция, безопасно проверяющая, жив ли `Object`, через приведение к `EntityAI`:

```c
// Object.IsAlive() НЕ существует у базового класса Object!
// Нужно сначала привести к EntityAI.

static bool IsObjectAlive(Object obj)
{
    if (!obj)
        return false;

    EntityAI eai;
    if (Class.CastTo(eai, obj))
    {
        return eai.IsAlive();
    }

    return false;  // Объекты, не являющиеся EntityAI (здания и т.д.) — считаем «не живыми»
}
```

### Система конфигурации на основе рефлексии

Этот паттерн (используемый в MyMod Core) создаёт универсальную систему конфигурации, где поля читаются/записываются по имени, позволяя админ-панелям редактировать любую конфигурацию без знания её конкретного класса:

```c
class ConfigBase
{
    // Поиск индекса переменной-члена по имени
    protected int FindVarIndex(string fieldName)
    {
        typename t = Type();
        int count = t.GetVariableCount();
        for (int i = 0; i < count; i++)
        {
            if (t.GetVariableName(i) == fieldName)
                return i;
        }
        return -1;
    }

    // Получение значения любого поля в виде строки
    string GetFieldValue(string fieldName)
    {
        if (FindVarIndex(fieldName) == -1)
            return "";

        int iVal;
        EnScript.GetClassVar(this, fieldName, 0, iVal);
        return iVal.ToString();
    }

    // Установка значения любого поля из строки
    void SetFieldValue(string fieldName, string value)
    {
        if (FindVarIndex(fieldName) == -1)
            return;

        int iVal = value.ToInt();
        EnScript.SetClassVar(this, fieldName, 0, iVal);
    }
}

class MyModConfig : ConfigBase
{
    int MaxPlayers = 60;
    int RespawnTime = 300;
}

void AdminPanelSave(ConfigBase config, string fieldName, string newValue)
{
    // Работает для ЛЮБОГО подкласса конфигурации — никакого типоспецифичного кода
    config.SetFieldValue(fieldName, newValue);
}
```

### Типобезопасная диспетчеризация событий

Используйте `typename` для создания диспетчера, направляющего события в правильный обработчик:

```c
class EventDispatcher
{
    protected ref map<typename, ref array<ref EventHandler>> m_Handlers;

    void EventDispatcher()
    {
        m_Handlers = new map<typename, ref array<ref EventHandler>>;
    }

    void Register(typename eventType, EventHandler handler)
    {
        if (!m_Handlers.Contains(eventType))
        {
            m_Handlers.Insert(eventType, new array<ref EventHandler>);
        }

        m_Handlers.Get(eventType).Insert(handler);
    }

    void Dispatch(EventBase event)
    {
        typename eventType = event.Type();

        array<ref EventHandler> handlers;
        if (m_Handlers.Find(eventType, handlers))
        {
            foreach (EventHandler handler : handlers)
            {
                handler.Handle(event);
            }
        }
    }
}
```

---

## Лучшие практики

- Всегда проверяйте на null после каждого приведения — и `Class.CastTo`, и `Type.Cast` возвращают null при неудаче, и использование результата без проверки вызывает крах.
- Используйте `Class.CastTo`, когда нужно ветвление по успеху/неудаче; используйте `Type.Cast` для краткого однострочного присваивания с последующей проверкой на null.
- Предпочитайте `IsInherited(typename)` вместо `IsKindOf(string)`, когда тип известен на этапе компиляции — это быстрее и ловит опечатки на этапе компиляции.
- Приводите к `EntityAI` перед вызовом `IsAlive()` — базовый класс `Object` не имеет этого метода.
- Валидируйте имена переменных через `GetVariableCount`/`GetVariableName` перед использованием `EnScript.GetClassVar` — он молча завершается неудачей при неверных именах.

---

## Замечено в реальных модах

> Паттерны подтверждены изучением исходного кода профессиональных модов DayZ.

| Паттерн | Мод | Подробности |
|---------|-----|--------|
| `Class.CastTo` + `continue` в циклах по сущностям | COT / Expansion | Каждый цикл по массивам `Object` использует приведение и continue для пропуска несовпадающих типов |
| `IsKindOf` для проверок типов из конфигурации | Expansion Market | Категории предметов, загруженные из JSON, используют строковый `IsKindOf`, потому что типы — это данные |
| `EnScript.GetClassVar`/`SetClassVar` для админ-панелей | Dabs Framework | Универсальные редакторы конфигураций читают/записывают поля по имени, так что один UI работает для всех классов конфигурации |
| `obj.Type().ToString()` для логирования | VPP Admin | Отладочные логи всегда включают `entity.Type().ToString()` для идентификации обработанного объекта |

---

## Теория vs практика

| Концепция | Теория | Реальность |
|---------|--------|---------|
| `Object.IsAlive()` | Ожидается на `Object` | Доступен только на `EntityAI` и подклассах — вызов на `Object` вызывает крах |
| `EnScript.SetClassVar` возвращает `bool` | Должен указывать успех/неудачу | Молча возвращает `false` при неверном имени поля без сообщения об ошибке — легко пропустить |
| `typename.Spawn()` | Создаёт экземпляр любого класса | Работает только для классов с конструктором без параметров; для игровых сущностей используйте `CreateObject` |

---

## Частые ошибки

### 1. Забыли проверку на null после приведения

```c
// НЕПРАВИЛЬНО — крашится, если obj не PlayerBase
PlayerBase player = PlayerBase.Cast(obj);
player.GetIdentity();  // КРАХ, если приведение не удалось!

// ПРАВИЛЬНО
PlayerBase player = PlayerBase.Cast(obj);
if (player)
{
    player.GetIdentity();
}
```

### 2. Вызов IsAlive() у базового Object

```c
// НЕПРАВИЛЬНО — Object.IsAlive() не существует
Object obj = GetSomeObject();
if (obj.IsAlive())  // Ошибка компиляции или крах в рантайме!

// ПРАВИЛЬНО
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive())
{
    // Безопасно
}
```

### 3. Использование рефлексии с неверным именем переменной

```c
// ТИХАЯ НЕУДАЧА — нет ошибки, возвращается ноль/пустое значение
int val;
EnScript.GetClassVar(obj, "NonExistentField", 0, val);
// val равен 0, ошибки нет
```

Всегда валидируйте через `FindVarIndex` или `GetVariableCount`/`GetVariableName`.

### 4. Путаница между Type() и литералом typename

```c
// Type() — возвращает РАНТАЙМ-тип экземпляра
typename t = myObj.Type();  // например, PlayerBase

// Литерал typename — ссылка на тип на этапе компиляции
typename t = PlayerBase;    // Всегда PlayerBase

// Они сравнимы
if (myObj.Type() == PlayerBase)  // true, если myObj ЯВЛЯЕТСЯ PlayerBase
```

---

## Итоги

| Операция | Синтаксис | Возвращает |
|-----------|--------|---------|
| Безопасное приведение вниз | `Class.CastTo(out target, source)` | `bool` |
| Инлайн-приведение | `TargetType.Cast(source)` | Целевой тип или `null` |
| Проверка типа (typename) | `obj.IsInherited(typename)` | `bool` |
| Проверка типа (строка) | `obj.IsKindOf("ClassName")` | `bool` |
| Получение рантайм-типа | `obj.Type()` | `typename` |
| Количество переменных | `obj.Type().GetVariableCount()` | `int` |
| Имя переменной | `obj.Type().GetVariableName(i)` | `string` |
| Тип переменной | `obj.Type().GetVariableType(i)` | `typename` |
| Чтение свойства | `EnScript.GetClassVar(obj, name, 0, out val)` | `void` |
| Запись свойства | `EnScript.SetClassVar(obj, name, 0, val)` | `bool` |

---

## Навигация

| Назад | Наверх | Далее |
|----------|----|------|
| [1.8 Управление памятью](08-memory-management.md) | [Часть 1: Enforce Script](../README.md) | [1.10 Перечисления и препроцессор](10-enums-preprocessor.md) |
