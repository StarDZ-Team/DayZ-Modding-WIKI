# Глава 1.13: Функции и методы

[Главная](../../README.md) | [<< Назад: Подводные камни](12-gotchas.md) | **Функции и методы**

---

## Введение

Функции --- это базовая единица поведения в Enforce Script. Каждое действие, которое выполняет мод --- создание предмета, проверка здоровья игрока, отправка RPC, отрисовка элемента интерфейса --- находится внутри функции. Понимание того, как их объявлять, передавать данные и работать со специальными модификаторами движка, необходимо для написания корректных модов DayZ.

В этой главе подробно рассматривается механика функций: синтаксис объявления, режимы передачи параметров, возвращаемые значения, параметры по умолчанию, привязки proto native, статические и экземплярные методы, переопределение, ключевое слово `thread` и ключевое слово `event`. Если глава 1.3 (Классы) объясняла, где живут функции, то эта глава учит, как они работают.

---

## Содержание

- [Синтаксис объявления функций](#синтаксис-объявления-функций)
  - [Автономные функции](#автономные-функции)
  - [Методы экземпляра](#методы-экземпляра)
  - [Статические методы](#статические-методы)
- [Режимы передачи параметров](#режимы-передачи-параметров)
  - [По значению (по умолчанию)](#по-значению-по-умолчанию)
  - [Параметры out](#параметры-out)
  - [Параметры inout](#параметры-inout)
  - [Параметры notnull](#параметры-notnull)
- [Возвращаемые значения](#возвращаемые-значения)
- [Значения параметров по умолчанию](#значения-параметров-по-умолчанию)
- [Методы Proto Native (привязки к движку)](#методы-proto-native-привязки-к-движку)
- [Статические методы vs методы экземпляра](#статические-методы-vs-методы-экземпляра)
- [Переопределение методов](#переопределение-методов)
- [Перегрузка методов (не поддерживается)](#перегрузка-методов-не-поддерживается)
- [Ключевое слово event](#ключевое-слово-event)
- [Потоковые методы (корутины)](#потоковые-методы-корутины)
- [Отложенные вызовы с CallLater](#отложенные-вызовы-с-calllater)
- [Лучшие практики](#лучшие-практики)
- [Наблюдения из реальных модов](#наблюдения-из-реальных-модов)
- [Теория и практика](#теория-и-практика)
- [Типичные ошибки](#типичные-ошибки)
- [Краткая справочная таблица](#краткая-справочная-таблица)

---

## Синтаксис объявления функций

Каждая функция имеет тип возвращаемого значения, имя и список параметров. Тело заключено в фигурные скобки.

```
ReturnType FunctionName(ParamType paramName, ...)
{
    // тело
}
```

### Автономные функции

Автономные (глобальные) функции существуют вне классов. Они редко встречаются в моддинге DayZ --- практически весь код находится внутри классов --- но вы встретите несколько таких функций в ванильных скриптах.

```c
// Автономная функция (глобальная область видимости)
void PrintPlayerCount()
{
    int count = GetGame().GetPlayers().Count();
    Print(string.Format("Players online: %1", count));
}

// Автономная функция с возвращаемым значением
string FormatTimestamp(int hours, int minutes)
{
    return string.Format("%1:%2", hours.ToStringLen(2), minutes.ToStringLen(2));
}
```

Ванильный движок определяет несколько глобальных утилитарных функций:

```c
// Из enscript.c --- вспомогательная функция для строковых выражений
string String(string s)
{
    return s;
}
```

### Методы экземпляра

Подавляющее большинство функций в модах DayZ --- это методы экземпляра, принадлежащие классу и работающие с данными этого экземпляра.

```c
class LootSpawner
{
    protected vector m_Position;
    protected float m_Radius;

    void SetPosition(vector pos)
    {
        m_Position = pos;
    }

    float GetRadius()
    {
        return m_Radius;
    }

    bool IsNearby(vector testPos)
    {
        return vector.Distance(m_Position, testPos) <= m_Radius;
    }
}
```

Методы экземпляра имеют неявный доступ к `this` --- ссылке на текущий объект. Явно писать `this.` редко нужно, но это может помочь в разрешении неоднозначности, когда параметр имеет похожее имя.

### Статические методы

Статические методы принадлежат самому классу, а не какому-либо экземпляру. Вызываются через `ClassName.Method()`. Они не могут обращаться к полям экземпляра или к `this`.

```c
class MathHelper
{
    static float Clamp01(float value)
    {
        if (value < 0) return 0;
        if (value > 1) return 1;
        return value;
    }

    static float Lerp(float a, float b, float t)
    {
        return a + (b - a) * Clamp01(t);
    }
}

// Использование:
float result = MathHelper.Lerp(0, 100, 0.75);  // 75.0
```

Статические методы идеальны для утилитарных функций, фабричных методов и аксессоров синглтонов. Ванильный код DayZ активно их использует:

```c
// Из DamageSystem (3_game/damagesystem.c)
class DamageSystem
{
    static bool GetDamageZoneMap(EntityAI entity, out DamageZoneMap zoneMap)
    {
        // ...
    }

    static string GetDamageDisplayName(EntityAI entity, string zone)
    {
        // ...
    }
}
```

---

## Режимы передачи параметров

Enforce Script поддерживает четыре режима передачи параметров. Понимание их критически важно, так как неправильный режим приводит к тихим ошибкам, когда данные никогда не достигают вызывающего кода.

### По значению (по умолчанию)

Когда модификатор не указан, параметр передается **по значению**. Для примитивов (`int`, `float`, `bool`, `string`, `vector`) создается копия. Изменения внутри функции не влияют на переменную вызывающего кода.

```c
void DoubleValue(int x)
{
    x = x * 2;  // изменяет только локальную копию
}

// Использование:
int n = 5;
DoubleValue(n);
Print(n);  // по-прежнему 5 --- оригинал не изменился
```

Для типов-классов (объектов) передача по значению все равно передает **ссылку на объект**, но сама ссылка копируется. Вы можете изменять поля объекта, но не можете переназначить ссылку на другой объект.

```c
void RenameZone(SpawnZone zone)
{
    zone.SetName("NewName");  // это РАБОТАЕТ --- изменяет тот же объект
    zone = null;              // это НЕ влияет на переменную вызывающего кода
}
```

### Параметры out

Ключевое слово `out` помечает параметр как **только для записи**. Функция записывает в него значение, и вызывающий код получает это значение. Начальное значение параметра не определено --- не читайте его до записи.

```c
// Параметр out --- функция заполняет значение
bool TryFindPlayer(string name, out PlayerBase player)
{
    array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);

    for (int i = 0; i < players.Count(); i++)
    {
        PlayerBase pb = PlayerBase.Cast(players[i]);
        if (pb && pb.GetIdentity() && pb.GetIdentity().GetName() == name)
        {
            player = pb;
            return true;
        }
    }

    player = null;
    return false;
}

// Использование:
PlayerBase result;
if (TryFindPlayer("John", result))
{
    Print(result.GetIdentity().GetName());
}
```

Ванильные скрипты активно используют `out` для передачи данных от движка к скриптам:

```c
// Из DayZPlayer (3_game/dayzplayer.c)
proto native void GetCurrentCameraTransform(out vector position, out vector direction, out vector rotation);

// Из AIWorld (3_game/ai/aiworld.c)
proto native bool RaycastNavMesh(vector from, vector to, PGFilter pgFilter, out vector hitPos, out vector hitNormal);

// Множественные параметры out для ограничений обзора
proto void GetLookLimits(out float pDown, out float pUp, out float pLeft, out float pRight);
```

### Параметры inout

Ключевое слово `inout` помечает параметр, который функция **читает и записывает**. Значение вызывающего кода доступно внутри функции, и любые модификации видны вызывающему коду после возврата.

```c
// inout --- функция читает текущее значение и изменяет его
void ClampHealth(inout float health)
{
    if (health < 0)
        health = 0;
    if (health > 100)
        health = 100;
}

// Использование:
float hp = 150.0;
ClampHealth(hp);
Print(hp);  // 100.0
```

Ванильные примеры `inout`:

```c
// Из enmath.c --- функция сглаживания читает и записывает скорость
proto static float SmoothCD(float val, float target, inout float velocity[],
    float smoothTime, float maxVelocity, float dt);

// Из enscript.c --- парсинг модифицирует входную строку
proto int ParseStringEx(inout string input, string token);

// Из Pawn (3_game/entities/pawn.c) --- трансформация читается и модифицируется
event void GetTransform(inout vector transform[4])
```

### Параметры notnull

Ключевое слово `notnull` сообщает компилятору (и движку), что параметр не должен быть `null`. Если передано значение null, игра завершится с ошибкой, а не продолжит молча работать с некорректными данными.

```c
void ProcessEntity(notnull EntityAI entity)
{
    // Безопасно использовать entity без проверки на null --- движок гарантирует это
    string name = entity.GetType();
    Print(name);
}
```

Ванильный код активно использует `notnull` в функциях, обращенных к движку:

```c
// Из envisual.c
proto native void SetBone(notnull IEntity ent, int bone, vector angles, vector trans, float scale);
proto native bool GetBoneMatrix(notnull IEntity ent, int bone, vector mat[4]);

// Из DamageSystem
static bool GetDamageZoneFromComponentName(notnull EntityAI entity, string component, out string damageZone);
```

Можно комбинировать `notnull` с `out`:

```c
// Из universaltemperaturesourcelambdabaseimpl.c
override void DryItemsInVicinity(UniversalTemperatureSourceSettings pSettings, vector position,
    out notnull array<EntityAI> nearestObjects);
```

---

## Возвращаемые значения

### Одно возвращаемое значение

Функции возвращают одно значение. Тип возвращаемого значения объявляется перед именем функции.

```c
float GetDistanceBetween(vector a, vector b)
{
    return vector.Distance(a, b);
}
```

### void (без возвращаемого значения)

Используйте `void` для функций, которые выполняют действие без возврата данных.

```c
void LogMessage(string msg)
{
    Print(string.Format("[MyMod] %1", msg));
}
```

### Возврат объектов

Когда функция возвращает объект, она возвращает **ссылку** (не копию). Вызывающий код получает указатель на тот же объект в памяти.

```c
EntityAI SpawnItem(string className, vector pos)
{
    EntityAI item = EntityAI.Cast(GetGame().CreateObject(className, pos, false, false, true));
    return item;  // вызывающий код получает ссылку на тот же объект
}
```

### Множественные возвращаемые значения через параметры out

Когда нужно вернуть более одного значения, используйте параметры `out`. Это универсальный паттерн в скриптах DayZ.

```c
void GetTimeComponents(float totalSeconds, out int hours, out int minutes, out int seconds)
{
    hours = (int)(totalSeconds / 3600);
    minutes = (int)((totalSeconds % 3600) / 60);
    seconds = (int)(totalSeconds % 60);
}

// Использование:
int h, m, s;
GetTimeComponents(3725, h, m, s);
// h == 1, m == 2, s == 5
```

### ПОДВОДНЫЙ КАМЕНЬ: JsonFileLoader возвращает void

Распространенная ловушка: `JsonFileLoader<T>.JsonLoadFile()` возвращает `void`, а не загруженный объект. Нужно передать заранее созданный объект как параметр `ref`.

```c
// НЕПРАВИЛЬНО --- не скомпилируется
MyConfig config = JsonFileLoader<MyConfig>.JsonLoadFile(path);

// ПРАВИЛЬНО --- передаем объект-ссылку
MyConfig config = new MyConfig;
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
```

---

## Значения параметров по умолчанию

Enforce Script поддерживает значения по умолчанию для параметров. Параметры со значениями по умолчанию должны идти **после** всех обязательных параметров.

```c
void SpawnItem(string className, vector pos, float quantity = -1, bool withAttachments = true)
{
    // quantity по умолчанию -1 (полная), withAttachments по умолчанию true
    EntityAI item = EntityAI.Cast(GetGame().CreateObject(className, pos, false, false, true));
    if (item && quantity >= 0)
        item.SetQuantity(quantity);
}

// Все эти вызовы корректны:
SpawnItem("AKM", myPos);                   // используются оба значения по умолчанию
SpawnItem("AKM", myPos, 0.5);             // свое количество, вложения по умолчанию
SpawnItem("AKM", myPos, -1, false);        // нужно указать quantity, чтобы задать attachments
```

### Значения по умолчанию из ванильного кода

Ванильные скрипты активно используют параметры по умолчанию:

```c
// Из Weather (3_game/weather.c)
proto native void Set(float forecast, float time = 0, float minDuration = 0);
proto native void SetDynVolFogDistanceDensity(float value, float time = 0);

// Из UAInput (3_game/inputapi/uainput.c)
proto native float SyncedValue_ID(int action, bool check_focus = true);
proto native bool SyncedPress(string action, bool check_focus = true);

// Из DbgUI (1_core/proto/dbgui.c)
static bool FloatOverride(string id, inout float value, float min, float max,
    int precision = 1000, bool sameLine = true);

// Из InputManager (2_gamelib/inputmanager.c)
proto native external bool ActivateAction(string actionName, int duration = 0);
```

### Ограничения

1. **Только литеральные значения** --- нельзя использовать выражения, вызовы функций или другие переменные в качестве значений по умолчанию:

```c
// НЕПРАВИЛЬНО --- выражения в значениях по умолчанию запрещены
void MyFunc(float speed = Math.PI * 2)  // ОШИБКА КОМПИЛЯЦИИ

// ПРАВИЛЬНО --- используйте литерал
void MyFunc(float speed = 6.283)
```

2. **Нет именованных параметров** --- нельзя пропустить параметр по имени. Чтобы задать третий параметр по умолчанию, нужно указать все предыдущие:

```c
void Configure(int a = 1, int b = 2, int c = 3) {}

Configure(1, 2, 10);  // нужно указать a и b, чтобы задать c
// Синтаксис вроде Configure(c: 10) не существует
```

3. **Значения по умолчанию для типов-классов ограничены `null` или `NULL`:**

```c
void DoWork(EntityAI target = null, string name = "")
{
    if (!target) return;
    // ...
}
```

---

## Методы Proto Native (привязки к движку)

Методы proto native объявлены в скриптах, но **реализованы в движке C++**. Они образуют мост между вашим кодом Enforce Script и движком игры DayZ. Вы вызываете их как обычные методы, но не можете видеть или изменять их реализацию.

### Справка по модификаторам

| Модификатор | Значение | Пример |
|-------------|----------|--------|
| `proto native` | Реализован в коде движка C++ | `proto native void SetPosition(vector pos);` |
| `proto native owned` | Возвращает значение, которым владеет вызывающий код (управляет памятью) | `proto native owned string GetType();` |
| `proto native external` | Определен в другом модуле | `proto native external bool AddSettings(typename cls);` |
| `proto volatile` | Имеет побочные эффекты; компилятор не должен оптимизировать | `proto volatile int Call(Class inst, string fn, void parm);` |
| `proto` (без `native`) | Внутренняя функция, может быть или не быть нативной | `proto int ParseString(string input, out string tokens[]);` |

### proto native

Самый распространенный модификатор. Простые вызовы движка.

```c
// Установка/получение позиции (Object)
proto native void SetPosition(vector pos);
proto native vector GetPosition();

// Поиск пути ИИ (AIWorld)
proto native bool FindPath(vector from, vector to, PGFilter pgFilter, out TVectorArray waypoints);
proto native bool SampleNavmeshPosition(vector position, float maxDistance, PGFilter pgFilter,
    out vector sampledPosition);
```

### proto native owned

Модификатор `owned` означает, что возвращаемое значение выделено движком и **владение передается скрипту**. Это используется в основном для возвращаемых `string`, где движок создает новую строку, которую сборщик мусора скрипта должен впоследствии освободить.

```c
// Из Class (enscript.c) --- возвращает строку, которой теперь владеет скрипт
proto native owned external string ClassName();

// Из Widget (enwidgets.c)
proto native owned string GetName();
proto native owned string GetTypeName();
proto native owned string GetStyleName();

// Из Object (3_game/entities/object.c)
proto native owned string GetLODName(LOD lod);
proto native owned string GetActionComponentName(int componentIndex, string geometry = "");
```

### proto native external

Модификатор `external` указывает, что функция определена в другом модуле скриптов. Это позволяет объявлять методы между модулями.

```c
// Из Settings (2_gamelib/settings.c)
proto native external bool AddSettings(typename settingsClass);

// Из InputManager (2_gamelib/inputmanager.c)
proto native external bool RegisterAction(string actionName);
proto native external float LocalValue(string actionName);
proto native external bool ActivateAction(string actionName, int duration = 0);

// Из Workbench API (1_core/workbenchapi.c)
proto native external bool SetOpenedResource(string filename);
proto native external bool Save();
```

### proto volatile

Модификатор `volatile` сообщает компилятору, что функция может иметь **побочные эффекты** или может **вызывать обратно в скрипт** (создавая реентрантность). Компилятор должен сохранять полный контекст при вызове таких функций.

```c
// Из ScriptModule (enscript.c) --- динамические вызовы функций, которые могут вызвать скрипт
proto volatile int Call(Class inst, string function, void parm);
proto volatile int CallFunction(Class inst, string function, out void returnVal, void parm);

// Из typename (enconvert.c) --- создает новый экземпляр динамически
proto volatile Class Spawn();

// Передача управления
proto volatile void Idle();
```

### Вызов методов Proto Native

Они вызываются как любой другой метод. Ключевое правило: **никогда не пытайтесь переопределить или переобъявить метод proto native**. Это фиксированные привязки к движку.

```c
// Вызов методов proto native --- ничем не отличается от скриптовых методов
Object obj = GetGame().CreateObject("AKM", pos, false, false, true);
vector position = obj.GetPosition();
string typeName = obj.GetType();     // owned string --- возвращается вам
obj.SetPosition(newPos);             // native void --- нет возвращаемого значения
```

---

## Статические методы vs методы экземпляра

### Когда использовать статические

Используйте статические методы, когда функция не нуждается в данных экземпляра:

```c
class StringUtils
{
    // Чистая утилита --- состояние не нужно
    static bool IsNullOrEmpty(string s)
    {
        return s == "" || s.Length() == 0;
    }

    static string PadLeft(string s, int totalWidth, string padChar = "0")
    {
        while (s.Length() < totalWidth)
            s = padChar + s;
        return s;
    }
}
```

**Типичные случаи использования статических методов:**
- **Утилитарные функции** --- математические помощники, форматирование строк, проверки валидации
- **Фабричные методы** --- `Create()`, который возвращает новый настроенный экземпляр
- **Аксессоры синглтонов** --- `GetInstance()`, который возвращает единственный экземпляр
- **Константы/справочные таблицы** --- `Init()` + `Cleanup()` для статических таблиц данных

### Паттерн Синглтон (статический + экземплярный)

Многие менеджеры DayZ комбинируют статику и экземпляры:

```c
class NotificationManager
{
    private static ref NotificationManager s_Instance;

    static NotificationManager GetInstance()
    {
        if (!s_Instance)
            s_Instance = new NotificationManager;
        return s_Instance;
    }

    // Экземплярные методы для реальной работы
    void ShowNotification(string text, float duration)
    {
        // ...
    }
}

// Использование:
NotificationManager.GetInstance().ShowNotification("Hello", 5.0);
```

### Когда использовать экземплярные

Используйте методы экземпляра, когда функция нуждается в доступе к состоянию объекта:

```c
class SupplyDrop
{
    protected vector m_DropPosition;
    protected float m_DropRadius;
    protected ref array<string> m_LootTable;

    // Нужны m_DropPosition, m_DropRadius --- должен быть экземплярным
    bool IsInDropZone(vector testPos)
    {
        return vector.Distance(m_DropPosition, testPos) <= m_DropRadius;
    }

    // Нужна m_LootTable --- должен быть экземплярным
    string GetRandomItem()
    {
        return m_LootTable.GetRandomElement();
    }
}
```

---

## Переопределение методов

Когда дочерний класс должен изменить поведение метода родителя, он использует ключевое слово `override`.

### Базовое переопределение

```c
class BaseModule
{
    void OnInit()
    {
        Print("[BaseModule] Initialized");
    }

    void OnUpdate(float dt)
    {
        // по умолчанию: ничего не делать
    }
}

class CombatModule extends BaseModule
{
    override void OnInit()
    {
        super.OnInit();  // сначала вызываем родителя
        Print("[CombatModule] Combat system ready");
    }

    override void OnUpdate(float dt)
    {
        super.OnUpdate(dt);
        // пользовательская логика боя
        CheckCombatState();
    }
}
```

### Правила переопределения

1. **Ключевое слово `override` обязательно** --- без него вы создаете новый метод, который скрывает родительский, вместо того чтобы заменять его.

2. **Сигнатура должна совпадать точно** --- тот же тип возвращаемого значения, те же типы параметров, то же количество параметров.

3. **`super.MethodName()` вызывает родителя** --- используйте это для расширения поведения, а не полной замены.

4. **Приватные методы нельзя переопределить** --- они невидимы для дочерних классов.

5. **Защищенные методы можно переопределить** --- дочерние классы видят их и могут переопределять.

```c
class Parent
{
    private void SecretMethod() {}    // нельзя переопределить
    protected void InternalWork() {}  // можно переопределить дочерними классами
    void PublicWork() {}              // может переопределить кто угодно
}

class Child extends Parent
{
    // override void SecretMethod() {}   // ОШИБКА КОМПИЛЯЦИИ --- private
    override void InternalWork() {}      // OK --- protected виден
    override void PublicWork() {}        // OK --- public
}
```

### ПОДВОДНЫЙ КАМЕНЬ: Забыли override

Если вы пропустите `override`, компилятор может выдать предупреждение, но **не** ошибку. Ваш метод тихо становится новым методом вместо замены родительского. Версия родителя выполняется, когда объект используется через переменную родительского типа.

```c
class Animal
{
    void Speak() { Print("..."); }
}

class Dog extends Animal
{
    // ПЛОХО: Отсутствует override --- создает НОВЫЙ метод
    void Speak() { Print("Woof!"); }

    // ХОРОШО: Правильно переопределяет
    override void Speak() { Print("Woof!"); }
}
```

---

## Перегрузка методов (не поддерживается)

**Enforce Script не поддерживает перегрузку методов.** Нельзя иметь два метода с одинаковым именем, но разными списками параметров. Попытка вызовет ошибку компиляции.

```c
class Calculator
{
    // ОШИБКА КОМПИЛЯЦИИ --- дублирование имени метода
    int Add(int a, int b) { return a + b; }
    float Add(float a, float b) { return a + b; }  // НЕ ДОПУСКАЕТСЯ
}
```

### Обходной путь 1: Разные имена методов

Самый распространенный подход --- использование описательных имен:

```c
class Calculator
{
    int AddInt(int a, int b) { return a + b; }
    float AddFloat(float a, float b) { return a + b; }
}
```

### Обходной путь 2: Соглашение Ex()

Ванильный DayZ и моды следуют соглашению об именовании, где расширенная версия метода добавляет `Ex` к имени:

```c
// Из ванильных скриптов --- базовая версия и расширенная версия
void ExplosionEffects(Object source, Object directHit, int componentIndex);
void ExplosionEffectsEx(Object source, Object directHit, int componentIndex,
    float energyFactor, float explosionFactor, HitInfo hitInfo);

// Из EffectManager
static void EffectUnregister(Effect effect);
static void EffectUnregisterEx(Effect effect);

// Из EntityAI
void SplitIntoStackMax(EntityAI destination_entity, int slot_id);
void SplitIntoStackMaxEx(EntityAI destination_entity, int slot_id);
```

### Обходной путь 3: Параметры по умолчанию

Если разница только в необязательных параметрах, используйте значения по умолчанию:

```c
class Spawner
{
    // Вместо перегрузок используйте значения по умолчанию
    void SpawnAt(vector pos, float radius = 0, string filter = "")
    {
        // один метод обрабатывает все случаи
    }
}
```

---

## Ключевое слово event

Ключевое слово `event` помечает метод как **обработчик событий движка** --- функцию, которую движок C++ вызывает в определенные моменты (создание сущности, события анимации, обратные вызовы физики и т.д.). Это подсказка для инструментов (например, Workbench), что метод должен быть представлен как скриптовое событие.

```c
// Из Pawn (3_game/entities/pawn.c)
protected event void OnPossess()
{
    // вызывается движком, когда контроллер овладевает этим pawn
}

protected event void OnUnPossess()
{
    // вызывается движком, когда контроллер отпускает этот pawn
}

event void GetTransform(inout vector transform[4])
{
    // движок вызывает для получения трансформации сущности
}

// Методы событий, поставляющие данные для сети
protected event void ObtainMove(PawnMove pMove)
{
    // вызывается движком для сбора ввода движения
}
```

Обычно вы `override` методы событий в дочерних классах, а не определяете их с нуля:

```c
class MyVehicle extends Transport
{
    override event void GetTransform(inout vector transform[4])
    {
        // собственная логика трансформации
        super.GetTransform(transform);
    }
}
```

Ключевой вывод: `event` --- это модификатор объявления, а не то, что вы вызываете. Движок вызывает методы событий в нужный момент.

---

## Потоковые методы (корутины)

Ключевое слово `thread` создает **корутину** --- функцию, которая может приостановить выполнение и возобновить его позже. Несмотря на название, Enforce Script **однопоточный**. Потоковые методы --- это кооперативные корутины, а не потоки уровня ОС.

### Объявление и запуск потока

Вы запускаете поток, вызывая функцию с ключевым словом `thread` перед вызовом:

```c
class Monitor
{
    void Start()
    {
        thread MonitorLoop();
    }

    void MonitorLoop()
    {
        while (true)
        {
            CheckStatus();
            Sleep(1000);  // приостановка на 1000 миллисекунд
        }
    }
}
```

Ключевое слово `thread` ставится на **вызов**, а не на объявление функции. Сама функция обычная --- корутиной ее делает способ вызова.

### Sleep() и приостановка

Внутри потоковой функции `Sleep(milliseconds)` приостанавливает выполнение и передает управление другому коду. Когда время ожидания истекает, поток возобновляется с того места, где остановился.

### Завершение потоков

Вы можете прервать работающий поток с помощью `KillThread()`:

```c
// Из enscript.c
proto native int KillThread(Class owner, string name);

// Использование:
KillThread(this, "MonitorLoop");  // останавливает корутину MonitorLoop
```

`owner` --- это объект, который запустил поток (или `null` для глобальных потоков). `name` --- имя функции.

### Когда использовать потоки (и когда нет)

**Предпочитайте `CallLater` и таймеры вместо потоков.** Потоковые корутины имеют ограничения:
- Их сложнее отлаживать (трассировки стека менее понятны)
- Они занимают слот корутины, который сохраняется до завершения или принудительной остановки
- Их нельзя сериализовать или передать через сетевые границы

Используйте потоки только тогда, когда вам действительно нужен длительный цикл с промежуточными приостановками. Для одноразовых отложенных действий используйте `CallLater` (см. ниже).

---

## Отложенные вызовы с CallLater

`CallLater` планирует вызов функции после задержки. Это основная альтернатива потоковым корутинам, широко используемая в ванильном DayZ.

### Синтаксис

```c
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(FunctionToCall, delayMs, repeat, ...params);
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| Function | `func` | Метод для вызова |
| Delay | `int` | Миллисекунды до вызова |
| Repeat | `bool` | `true` для повторения с интервалом, `false` для одноразового вызова |
| Params | variadic | Параметры, передаваемые функции |

### Категории вызовов

| Категория | Назначение |
|-----------|-----------|
| `CALL_CATEGORY_SYSTEM` | Общего назначения, выполняется каждый кадр |
| `CALL_CATEGORY_GUI` | Обратные вызовы, связанные с интерфейсом |
| `CALL_CATEGORY_GAMEPLAY` | Обратные вызовы игровой логики |

### Примеры из ванильного кода

```c
// Одноразовый отложенный вызов (3_game/entities/entityai.c)
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(DeferredInit, 34);

// Повторяющийся вызов --- обратный отсчет входа каждую 1 секунду (3_game/dayzgame.c)
GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(this.LoginTimeCountdown, 1000, true);

// Отложенное удаление с параметром (4_world/entities/explosivesbase)
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(DeleteSafe, delayFor * 1000, false);

// Отложенный обратный вызов интерфейса (3_game/gui/hints/uihintpanel.c)
m_Game.GetCallQueue(CALL_CATEGORY_GUI).CallLater(SlideshowThread, m_SlideShowDelay);
```

### Удаление запланированных вызовов

Чтобы отменить запланированный вызов до его срабатывания:

```c
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).Remove(FunctionToCall);
```

---

## Лучшие практики

1. **Держите функции короткими** --- старайтесь укладываться в 50 строк. Если функция длиннее, выделяйте вспомогательные методы.

2. **Используйте проверки-ограждения для раннего возврата** --- проверяйте предусловия в начале и возвращайтесь рано. Это уменьшает вложенность и делает «счастливый путь» легче для чтения.

```c
void ProcessPlayer(PlayerBase player)
{
    if (!player) return;
    if (!player.IsAlive()) return;
    if (!player.GetIdentity()) return;

    // реальная логика здесь, без вложенности
    string name = player.GetIdentity().GetName();
    // ...
}
```

3. **Предпочитайте параметры out вместо сложных типов возврата** --- когда функция должна сообщить успех/неудачу плюс данные, используйте возврат `bool` с параметрами `out`.

4. **Используйте static для утилит без состояния** --- если метод не обращается к `this`, сделайте его `static`. Это документирует намерение и позволяет вызывать без экземпляра.

5. **Документируйте ограничения proto native** --- при оборачивании вызова proto native отмечайте в комментариях, что функция движка может и не может делать.

6. **Предпочитайте CallLater вместо потоковых корутин** --- `CallLater` проще, легче отменяется и менее подвержен ошибкам.

7. **Всегда вызывайте super в переопределениях** --- если только вы намеренно не хотите полностью заменить поведение родителя. Глубокие цепочки наследования DayZ зависят от передачи вызовов `super` по иерархии.

---

## Наблюдения из реальных модов

> Паттерны, подтвержденные изучением исходного кода профессиональных модов DayZ.

| Паттерн | Мод | Подробности |
|---------|-----|-------------|
| `TryGet___()` возвращающий `bool` с параметром `out` | COT / Expansion | Единообразный паттерн для nullable-поиска: возврат `true`/`false`, заполнение параметра `out` при успехе |
| `MethodEx()` для расширенных сигнатур | Vanilla / Expansion Market | Когда API нуждается в большем количестве параметров, добавляется `Ex` вместо ломки существующих вызовов |
| Статические методы `Init()` + `Cleanup()` класса | Expansion / VPP | Классы-менеджеры инициализируют статические данные в `Init()` и очищают в `Cleanup()`, вызываемых из жизненного цикла миссии |
| Проверка-ограждение `if (!GetGame()) return` в начале метода | COT Admin Tools | Каждый метод, обращающийся к движку, начинается с проверок на null для избежания крашей при выключении |
| Синглтон `GetInstance()` с ленивым созданием | COT / Expansion / Dabs | Менеджеры предоставляют `static ref` экземпляр с аксессором `GetInstance()`, создаваемым при первом обращении |

---

## Теория и практика

| Концепция | Теория | Реальность |
|-----------|--------|-----------|
| Перегрузка методов | Стандартная возможность ООП | Не поддерживается; используйте суффикс `Ex()` или параметры по умолчанию |
| `thread` создает потоки ОС | Ключевое слово предполагает параллелизм | Однопоточные корутины с кооперативной приостановкой через `Sleep()` |
| Параметры `out` только для записи | Не следует читать начальное значение | Некоторый ванильный код читает параметр `out` до записи; безопаснее всегда обращаться как с `inout` |
| `override` необязателен | Мог бы определяться автоматически | Его пропуск тихо создает новый метод вместо переопределения; всегда указывайте его |
| Выражения в параметрах по умолчанию | Должны поддерживать вызовы функций | Допускаются только литеральные значения (`42`, `true`, `null`, `""`) |

---

## Типичные ошибки

### 1. Забыли override при замене метода родителя

Без `override` ваш метод становится новым, скрывающим родительский. Версия родителя по-прежнему вызывается, когда объект используется через тип родителя.

```c
// ПЛОХО --- тихо создает новый метод
class CustomPlayer extends PlayerBase
{
    void OnConnect() { Print("Custom!"); }
}

// ХОРОШО --- правильно переопределяет
class CustomPlayer extends PlayerBase
{
    override void OnConnect() { Print("Custom!"); }
}
```

### 2. Ожидание предварительной инициализации параметров out

Параметр `out` не имеет гарантированного начального значения. Никогда не читайте его до записи.

```c
// ПЛОХО --- чтение параметра out до установки
void GetData(out int value)
{
    if (value > 0)  // НЕПРАВИЛЬНО --- value не определено здесь
        return;
    value = 42;
}

// ХОРОШО --- всегда сначала записываем, потом читаем
void GetData(out int value)
{
    value = 42;
}
```

### 3. Попытка перегрузить методы

Enforce Script не поддерживает перегрузку. Два метода с одинаковым именем вызывают ошибку компиляции.

```c
// ОШИБКА КОМПИЛЯЦИИ
void Process(int id) {}
void Process(string name) {}

// ПРАВИЛЬНО --- используйте разные имена
void ProcessById(int id) {}
void ProcessByName(string name) {}
```

### 4. Присвоение результата void-функции

Некоторые функции (в частности `JsonFileLoader.JsonLoadFile`) возвращают `void`. Попытка присвоить их результат вызывает ошибку компиляции.

```c
// ОШИБКА КОМПИЛЯЦИИ --- JsonLoadFile возвращает void
MyConfig cfg = JsonFileLoader<MyConfig>.JsonLoadFile(path);

// ПРАВИЛЬНО
MyConfig cfg = new MyConfig;
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
```

### 5. Использование выражений в параметрах по умолчанию

Значения по умолчанию должны быть литералами времени компиляции. Выражения, вызовы функций и ссылки на переменные не допускаются.

```c
// ОШИБКА КОМПИЛЯЦИИ --- выражение в значении по умолчанию
void SetTimeout(float seconds = GetDefaultTimeout()) {}
void SetAngle(float rad = Math.PI) {}

// ПРАВИЛЬНО --- только литеральные значения
void SetTimeout(float seconds = 30.0) {}
void SetAngle(float rad = 3.14159) {}
```

### 6. Забыли super в цепочке переопределений

Иерархии классов DayZ глубокие. Пропуск `super` в переопределении может сломать функциональность на нескольких уровнях выше, о существовании которых вы даже не знали.

```c
// ПЛОХО --- ломает инициализацию родителя
class MyMission extends MissionServer
{
    override void OnInit()
    {
        // забыли super.OnInit() --- ванильная инициализация никогда не запустится!
        Print("My mission started");
    }
}

// ХОРОШО
class MyMission extends MissionServer
{
    override void OnInit()
    {
        super.OnInit();  // пусть ванила + другие моды инициализируются первыми
        Print("My mission started");
    }
}
```

---

## Краткая справочная таблица

| Возможность | Синтаксис | Примечания |
|-------------|-----------|-----------|
| Метод экземпляра | `void DoWork()` | Имеет доступ к `this` |
| Статический метод | `static void DoWork()` | Вызывается через `ClassName.DoWork()` |
| Параметр по значению | `void Fn(int x)` | Копия для примитивов; копия ссылки для объектов |
| Параметр `out` | `void Fn(out int x)` | Только для записи; вызывающий получает значение |
| Параметр `inout` | `void Fn(inout float x)` | Чтение + запись; вызывающий видит изменения |
| Параметр `notnull` | `void Fn(notnull EntityAI e)` | Крах при null |
| Значение по умолчанию | `void Fn(int x = 5)` | Только литералы, никаких выражений |
| Переопределение | `override void Fn()` | Должна совпадать сигнатура родителя |
| Вызов родителя | `super.Fn()` | Внутри тела переопределения |
| Proto native | `proto native void Fn()` | Реализован в C++ |
| Owned возврат | `proto native owned string Fn()` | Скрипт управляет возвращенной памятью |
| External | `proto native external void Fn()` | Определен в другом модуле |
| Volatile | `proto volatile void Fn()` | Может вызвать обратно в скрипт |
| Event | `event void Fn()` | Обратный вызов, инициированный движком |
| Запуск потока | `thread MyFunc()` | Запускает корутину (не поток ОС) |
| Завершение потока | `KillThread(owner, "FnName")` | Останавливает работающую корутину |
| Отложенный вызов | `CallLater(Fn, delay, repeat)` | Предпочтительнее потоков |
| Соглашение `Ex()` | `void FnEx(...)` | Расширенная версия `Fn` |

---

## Навигация

| Назад | Вверх | Далее |
|-------|-------|-------|
| [1.12 Подводные камни](12-gotchas.md) | [Часть 1: Enforce Script](../README.md) | -- |
