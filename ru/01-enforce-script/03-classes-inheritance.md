# Глава 1.3: Классы и наследование

[Главная](../README.md) | [<< Предыдущая: Массивы, Map и Set](02-arrays-maps-sets.md) | **Классы и наследование** | [Следующая: Modded-классы >>](04-modded-classes.md)

---
---

## Введение


Всё в DayZ --- это класс. Каждое оружие, транспорт, зомби, UI-панель, менеджер конфигурации и игрок является экземпляром класса. Понимание того, как объявлять, расширять и работать с классами в Enforce Script, --- основа всего моддинга DayZ.

Система классов Enforce Script использует одиночное наследование, объектно-ориентированный подход с модификаторами доступа, конструкторами, деструкторами, статическими членами и переопределением методов. Если вы знаете C# или Java, концепции будут знакомы --- но синтаксис имеет свои особенности, и есть важные отличия, рассмотренные в этой главе.

---

## Объявление класса


Класс группирует связанные данные (поля) и поведение (методы) вместе.

```c
class ZombieTracker
{
    // Поля (переменные-члены)
    int m_ZombieCount;
    float m_SpawnRadius;
    string m_ZoneName;
    bool m_IsActive;
    vector m_CenterPos;

    // Методы (функции-члены)
    void Activate(vector center, float radius)
    {
        m_CenterPos = center;
        m_SpawnRadius = radius;
        m_IsActive = true;
    }

    bool IsActive()
    {
        return m_IsActive;
    }

    float GetDistanceToCenter(vector pos)
    {
        return vector.Distance(m_CenterPos, pos);
    }
}
```

### Соглашения об именовании классов


В моддинге DayZ приняты следующие соглашения:
- Имена классов: `PascalCase` (например, `PlayerTracker`, `LootManager`)
- Поля-члены: префикс `m_PascalCase` (например, `m_Health`, `m_PlayerList`)
- Статические поля: префикс `s_PascalCase` (например, `s_Instance`, `s_Counter`)
- Константы: `UPPER_SNAKE_CASE` (например, `MAX_HEALTH`, `DEFAULT_RADIUS`)
- Методы: `PascalCase` (например, `GetPosition()`, `SetHealth()`)
- Локальные переменные: `camelCase` (например, `playerCount`, `nearestDist`)

### Создание и использование экземпляров


```c
void Example()
{
    // Создание экземпляра с помощью 'new'
    ZombieTracker tracker = new ZombieTracker;

    // Вызов методов
    tracker.Activate(Vector(5000, 0, 8000), 200.0);

    if (tracker.IsActive())
    {
        float dist = tracker.GetDistanceToCenter(Vector(5050, 0, 8050));
        Print(string.Format("Distance: %1", dist));
    }

    // Уничтожение экземпляра с помощью 'delete' (обычно не нужно; см. раздел Память)
    delete tracker;
}
```

---

## Конструкторы и деструкторы


Конструкторы инициализируют объект при его создании. Деструкторы выполняют очистку при его уничтожении. В Enforce Script оба используют имя класса --- деструктор имеет префикс `~`.

### Конструктор


```c
class SpawnZone
{
    protected string m_Name;
    protected vector m_Position;
    protected float m_Radius;
    protected ref array<string> m_AllowedTypes;

    // Конструктор: то же имя, что и у класса
    void SpawnZone(string name, vector pos, float radius)
    {
        m_Name = name;
        m_Position = pos;
        m_Radius = radius;
        m_AllowedTypes = new array<string>;

        Print(string.Format("[SpawnZone] Created: %1 at %2, radius %3", m_Name, m_Position, m_Radius));
    }

    // Деструктор: префикс ~
    void ~SpawnZone()
    {
        Print(string.Format("[SpawnZone] Destroyed: %1", m_Name));
        // m_AllowedTypes --- это ref, он будет удалён автоматически
    }

    void AddAllowedType(string typeName)
    {
        m_AllowedTypes.Insert(typeName);
    }
}
```

### Конструктор по умолчанию (без параметров)


Если вы не определяете конструктор, класс получает неявный конструктор по умолчанию, который инициализирует все поля значениями по умолчанию (`0`, `0.0`, `false`, `""`, `null`).

```c
class SimpleConfig
{
    int m_MaxPlayers;      // инициализируется в 0
    float m_SpawnDelay;    // инициализируется в 0.0
    string m_ServerName;   // инициализируется в ""
    bool m_PvPEnabled;     // инициализируется в false
}

void Test()
{
    SimpleConfig cfg = new SimpleConfig;
    // Все поля имеют значения по умолчанию
    Print(cfg.m_MaxPlayers);  // 0
}
```

### Перегрузка конструкторов


Можно определить несколько конструкторов с разными списками параметров:

```c
class DamageEvent
{
    protected float m_Amount;
    protected string m_Source;
    protected vector m_Position;

    // Конструктор со всеми параметрами
    void DamageEvent(float amount, string source, vector pos)
    {
        m_Amount = amount;
        m_Source = source;
        m_Position = pos;
    }

    // Упрощённый конструктор со значениями по умолчанию
    void DamageEvent(float amount)
    {
        m_Amount = amount;
        m_Source = "Unknown";
        m_Position = vector.Zero;
    }
}

void Test()
{
    DamageEvent full = new DamageEvent(50.0, "AKM", Vector(100, 0, 200));
    DamageEvent simple = new DamageEvent(25.0);
}
```

---

## Модификаторы доступа


Модификаторы доступа контролируют, кто может видеть и использовать поля и методы.

| Модификатор | Доступно из | Синтаксис |
|----------|----------------|--------|
| `private` | Только объявляющий класс | `private int m_Secret;` |
| `protected` | Объявляющий класс + все подклассы | `protected int m_Health;` |
| *(нет)* | Отовсюду (public) | `int m_Value;` |

Явного ключевого слова `public` нет --- всё без `private` или `protected` является публичным по умолчанию.

```c
class BaseVehicle
{
    // Public: любой может обратиться
    string m_DisplayName;

    // Protected: только этот класс и подклассы
    protected float m_Fuel;
    protected float m_MaxFuel;

    // Private: только этот конкретный класс
    private int m_InternalState;

    void BaseVehicle(string name, float maxFuel)
    {
        m_DisplayName = name;
        m_MaxFuel = maxFuel;
        m_Fuel = maxFuel;
        m_InternalState = 0;
    }

    // Публичный метод
    float GetFuelPercent()
    {
        return (m_Fuel / m_MaxFuel) * 100.0;
    }

    // Защищённый метод: подклассы могут вызывать
    protected void ConsumeFuel(float amount)
    {
        m_Fuel = Math.Clamp(m_Fuel - amount, 0, m_MaxFuel);
    }

    // Приватный метод: только этот класс
    private void UpdateInternalState()
    {
        m_InternalState++;
    }
}
```

### Лучшая практика: инкапсуляция


Предоставляйте доступ к полям через методы (геттеры/сеттеры), а не делайте их публичными. Это позволяет позже добавить валидацию, логирование или побочные эффекты без нарушения кода, использующего класс.

```c
class PlayerStats
{
    protected float m_Health;
    protected float m_MaxHealth;

    void PlayerStats(float maxHealth)
    {
        m_MaxHealth = maxHealth;
        m_Health = maxHealth;
    }

    // Геттер
    float GetHealth()
    {
        return m_Health;
    }

    // Сеттер с валидацией
    void SetHealth(float value)
    {
        m_Health = Math.Clamp(value, 0, m_MaxHealth);
    }

    // Удобные методы
    void TakeDamage(float amount)
    {
        SetHealth(m_Health - amount);
    }

    void Heal(float amount)
    {
        SetHealth(m_Health + amount);
    }

    bool IsAlive()
    {
        return m_Health > 0;
    }
}
```

---

## Наследование


Наследование позволяет создавать новый класс на основе существующего. Дочерний класс наследует все поля и методы родителя и может добавлять новые или переопределять существующее поведение.

### Синтаксис: `extends` или `:`

Enforce Script поддерживает два синтаксиса для наследования. Оба эквивалентны:

```c
// Синтаксис 1: ключевое слово extends (предпочтительный, более читаемый)
class Car extends BaseVehicle
{
}

// Синтаксис 2: двоеточие (стиль C++, также распространён в коде DayZ)
class Truck : BaseVehicle
{
}
```

### Базовый пример наследования


```c
class Animal
{
    protected string m_Name;
    protected float m_Health;

    void Animal(string name, float health)
    {
        m_Name = name;
        m_Health = health;
    }

    string GetName()
    {
        return m_Name;
    }

    void Speak()
    {
        Print(m_Name + " makes a sound");
    }
}

class Dog extends Animal
{
    protected string m_Breed;

    void Dog(string name, string breed)
    {
        // Примечание: конструктор родителя вызывается автоматически без аргументов,
        // или можно инициализировать родительские поля напрямую, так как они protected
        m_Name = name;
        m_Health = 100.0;
        m_Breed = breed;
    }

    string GetBreed()
    {
        return m_Breed;
    }

    // Новый метод только в Dog
    void Fetch()
    {
        Print(m_Name + " fetches the stick!");
    }
}

void Test()
{
    Dog rex = new Dog("Rex", "German Shepherd");
    rex.Speak();         // Унаследовано от Animal: "Rex makes a sound"
    rex.Fetch();         // Собственный метод Dog: "Rex fetches the stick!"
    Print(rex.GetName()); // Унаследовано: "Rex"
    Print(rex.GetBreed()); // Собственный метод Dog: "German Shepherd"
}
```

### Только одиночное наследование


Enforce Script поддерживает **только одиночное наследование**. Класс может расширять ровно одного родителя. Множественного наследования, интерфейсов и миксинов нет.

```c
class A { }
class B extends A { }     // OK: один родитель
// class C extends A, B { }  // ОШИБКА: множественное наследование не поддерживается
class D extends B { }     // OK: B расширяет A, D расширяет B (цепочка наследования)
```

### Ключевое слово `sealed` (1.28+)

Класс, помеченный `sealed`, не может быть унаследован. Метод, помеченный `sealed`, не может быть переопределён. DayZ 1.28 применяет это на этапе компиляции.

```c
sealed class FinalClass
{
    void DoWork()
    {
        // Этот класс нельзя расширить
    }
}

class MyChild : FinalClass  // ОШИБКА КОМПИЛЯЦИИ: нельзя наследовать от sealed-класса
{
}
```

Методы тоже можно запечатывать по отдельности:

```c
class MyBase
{
    sealed void LockedMethod()
    {
        // Нельзя переопределить в дочерних классах
    }

    void OpenMethod()
    {
        // Можно переопределять как обычно
    }
}
```

> **Замечание по миграции:** Если вы обновляетесь до DayZ 1.28 и получаете ошибку компиляции о наследовании от sealed-класса, необходим рефакторинг. Используйте композицию (оберните класс как поле-член) вместо наследования.

`sealed` редко используется в моддинге DayZ, так как расширяемость --- главная цель.

---

## Переопределение методов


Когда подкласс должен изменить поведение унаследованного метода, используется ключевое слово `override`. Компилятор проверяет, что сигнатура метода совпадает с методом в родительском классе.

```c
class Weapon
{
    protected string m_Name;
    protected float m_Damage;

    void Weapon(string name, float damage)
    {
        m_Name = name;
        m_Damage = damage;
    }

    float CalculateDamage(float distance)
    {
        // Базовый урон, без падения
        return m_Damage;
    }

    string GetInfo()
    {
        return string.Format("%1 (Dmg: %2)", m_Name, m_Damage);
    }
}

class Rifle extends Weapon
{
    protected float m_MaxRange;

    void Rifle(string name, float damage, float maxRange)
    {
        m_Name = name;
        m_Damage = damage;
        m_MaxRange = maxRange;
    }

    // Переопределение: изменение расчёта урона с учётом падения по дистанции
    override float CalculateDamage(float distance)
    {
        float falloff = Math.Clamp(1.0 - (distance / m_MaxRange), 0.1, 1.0);
        return m_Damage * falloff;
    }

    // Переопределение: добавление информации о дальности
    override string GetInfo()
    {
        return string.Format("%1 (Dmg: %2, Range: %3m)", m_Name, m_Damage, m_MaxRange);
    }
}
```

### Ключевое слово `super`

`super` ссылается на родительский класс. Используйте его для вызова родительской версии метода, а затем добавляйте свою логику поверх. Это критически важно --- особенно в [modded-классах](04-modded-classes.md).

```c
class BaseLogger
{
    void Log(string message)
    {
        Print("[LOG] " + message);
    }
}

class TimestampLogger extends BaseLogger
{
    override void Log(string message)
    {
        // Сначала вызвать Log родителя
        super.Log(message);

        // Затем добавить логирование с меткой времени
        int hour, minute, second;
        GetHourMinuteSecond(hour, minute, second);
        Print(string.Format("[%1:%2:%3] %4", hour, minute, second, message));
    }
}
```

### Ключевое слово `this`

`this` ссылается на текущий экземпляр объекта. Обычно оно неявно (не нужно его писать), но может быть полезно для ясности или при передаче текущего объекта в другую функцию.

```c
class EventManager
{
    void Register(Managed handler) { /* ... */ }
}

class MyPlugin
{
    void Init(EventManager mgr)
    {
        // Передача 'this' (текущего экземпляра MyPlugin) менеджеру
        mgr.Register(this);
    }
}
```

---

## Методы Proto (привязки к движку)

Enforce Script использует `proto` для объявления методов, реализованных в движке C++:

```c
// proto native --- прямая привязка к C++, наиболее распространённый вариант
proto native void SetPosition(vector pos);
proto native vector GetPosition();
proto native float GetHealth(string zoneName, string healthType);

// proto native owned --- вызывающий владеет возвращённым объектом
proto native owned string ClassName();

// proto volatile --- функция может приостанавливаться (используется внутренностями движка)
proto volatile int Call(Class inst, string func, void param);

// proto native external --- привязка для кросс-модульных вызовов
proto native external void DoSomething();
```

Реализовать `proto`-методы нельзя --- они предоставляются движком. Вы можете только **вызывать** их.

---

## Модификаторы параметров

Помимо модификаторов доступа для полей и методов, в Enforce Script есть модификаторы уровня параметров, управляющие способом передачи аргументов в функции:

```c
// out --- параметр только для записи (заполняется функцией)
bool TryGetValue(out int result)
{
    result = 42;
    return true;
}

// inout --- параметр одновременно для ввода и вывода
void ModifyArray(inout array<int> arr)
{
    arr.Insert(99);  // изменяет массив вызывающего кода
}

// notnull --- гарантия на этапе компиляции, что параметр не null
void Process(notnull EntityAI entity)
{
    // entity гарантированно не null компилятором
}
```

| Модификатор | Значение |
|----------|---------|
| `out` | Функция записывает значение; вызывающий код читает его после вызова |
| `inout` | Вызывающий код передаёт значение; функция может его изменить |
| `notnull` | Компилятор гарантирует, что аргумент никогда не будет `null` |

Эти модификаторы часто встречаются в ванильных методах DayZ и сигнатурах API движка.

---

## Статические методы и поля


Статические члены принадлежат самому классу, а не какому-либо экземпляру. Доступ к ним осуществляется через имя класса, а не через переменную объекта.

### Статические поля


```c
class GameConfig
{
    // Статические поля: общие для всех экземпляров (и доступные без экземпляра)
    static int s_MaxPlayers = 60;
    static float s_TickRate = 30.0;
    static string s_ServerName = "My Server";

    // Обычное (экземплярное) поле
    protected bool m_IsLoaded;
}

void UseStaticFields()
{
    // Доступ без создания экземпляра
    Print(GameConfig.s_MaxPlayers);     // 60
    Print(GameConfig.s_ServerName);     // "My Server"

    // Изменение
    GameConfig.s_MaxPlayers = 40;
}
```

### Статические методы


```c
class MathUtils
{
    static float MetersToKilometers(float meters)
    {
        return meters / 1000.0;
    }

    static string FormatDistance(float meters)
    {
        if (meters >= 1000)
            return string.Format("%.1f km", meters / 1000.0);
        else
            return string.Format("%1 m", Math.Round(meters));
    }

    static bool IsInCircle(vector point, vector center, float radius)
    {
        return vector.Distance(point, center) <= radius;
    }
}

void Test()
{
    float km = MathUtils.MetersToKilometers(2500);     // 2.5
    string display = MathUtils.FormatDistance(750);      // "750 m"
    bool inside = MathUtils.IsInCircle("100 0 200", "150 0 250", 100);
}
```

### Паттерн Singleton


Наиболее распространённое использование статических полей в модах DayZ --- паттерн Singleton: класс, имеющий ровно один экземпляр, доступный глобально.

```c
class MyModManager
{
    // Статическая ссылка на единственный экземпляр
    private static ref MyModManager s_Instance;

    protected bool m_Initialized;
    protected ref array<string> m_Data;

    void MyModManager()
    {
        m_Initialized = false;
        m_Data = new array<string>;
    }

    // Статический геттер для синглтона
    static MyModManager GetInstance()
    {
        if (!s_Instance)
            s_Instance = new MyModManager;

        return s_Instance;
    }

    void Init()
    {
        if (m_Initialized)
            return;

        m_Initialized = true;
        Print("[MyMod] Manager initialized");
    }

    // Статическая очистка
    static void Destroy()
    {
        s_Instance = null;
    }
}

// Использование из любого места:
void SomeFunction()
{
    MyModManager.GetInstance().Init();
}
```

---

## Пример из практики: пользовательский класс предмета


Вот полный пример, показывающий иерархию пользовательских классов предметов в стиле моддинга DayZ. Он демонстрирует всё, что было рассмотрено в этой главе.

```c
// Базовый класс для всех пользовательских медицинских предметов
class CustomMedicalBase extends ItemBase
{
    protected float m_HealAmount;
    protected float m_UseTime;      // секунды для использования
    protected bool m_RequiresBandage;

    void CustomMedicalBase()
    {
        m_HealAmount = 0;
        m_UseTime = 3.0;
        m_RequiresBandage = false;
    }

    float GetHealAmount()
    {
        return m_HealAmount;
    }

    float GetUseTime()
    {
        return m_UseTime;
    }

    bool RequiresBandage()
    {
        return m_RequiresBandage;
    }

    // Может быть переопределён подклассами
    void OnApplied(PlayerBase player)
    {
        if (!player)
            return;

        player.AddHealth("", "Health", m_HealAmount);
        Print(string.Format("[Medical] %1 applied, healed %2", GetType(), m_HealAmount));
    }
}

// Конкретный медицинский предмет: Бинт
class CustomBandage extends CustomMedicalBase
{
    void CustomBandage()
    {
        m_HealAmount = 25.0;
        m_UseTime = 2.0;
    }

    override void OnApplied(PlayerBase player)
    {
        super.OnApplied(player);

        // Дополнительный эффект, специфичный для бинта: остановка кровотечения
        // (упрощённый пример)
        Print("[Medical] Bleeding stopped");
    }
}

// Конкретный медицинский предмет: Аптечка первой помощи (лечит больше, занимает дольше)
class CustomFirstAidKit extends CustomMedicalBase
{
    private int m_UsesRemaining;

    void CustomFirstAidKit()
    {
        m_HealAmount = 75.0;
        m_UseTime = 8.0;
        m_UsesRemaining = 3;
    }

    int GetUsesRemaining()
    {
        return m_UsesRemaining;
    }

    override void OnApplied(PlayerBase player)
    {
        if (m_UsesRemaining <= 0)
        {
            Print("[Medical] First Aid Kit is empty!");
            return;
        }

        super.OnApplied(player);
        m_UsesRemaining--;

        Print(string.Format("[Medical] Uses remaining: %1", m_UsesRemaining));
    }
}
```

### config.cpp для пользовательских предметов

Иерархия классов в скрипте должна соответствовать наследованию в `config.cpp`:

```cpp
class CfgVehicles
{
    class ItemBase;

    class CustomMedicalBase : ItemBase
    {
        scope = 0;  // 0 = абстрактный, нельзя заспавнить
        displayName = "";
    };

    class CustomBandage : CustomMedicalBase
    {
        scope = 2;  // 2 = публичный, можно заспавнить
        displayName = "Custom Bandage";
        descriptionShort = "A sterile bandage for wound treatment.";
        model = "\MyMod\data\bandage.p3d";
        weight = 50;
    };

    class CustomFirstAidKit : CustomMedicalBase
    {
        scope = 2;
        displayName = "Custom First Aid Kit";
        descriptionShort = "A complete first aid kit with multiple uses.";
        model = "\MyMod\data\firstaidkit.p3d";
        weight = 300;
    };
};
```

---

## Иерархия классов DayZ


Понимание ванильной иерархии классов необходимо для моддинга. Вот наиболее важные классы, от которых вы будете наследовать или с которыми будете взаимодействовать:

```
Class                          // Корень всех ссылочных типов
  Managed                      // Отключает подсчёт ссылок движком (для чисто скриптовых классов)
  IEntity                      // Базовая сущность движка
    Object                     // Всё, что имеет позицию в мире
      Entity
        EntityAI               // Имеет инвентарь, здоровье, действия
          InventoryItem
            ItemBase           // ВСЕ предметы (наследуйте от этого для пользовательских предметов)
              Weapon_Base      // Всё оружие
              Magazine_Base    // Все магазины
              Clothing_Base    // Вся одежда
          Transport
            CarScript          // Все транспортные средства
          DayZCreatureAI
            DayZInfected       // Зомби
            DayZAnimal         // Животные
          Man
            DayZPlayer
              PlayerBase       // Класс игрока (постоянно моддится)
                SurvivorBase   // Внешний вид персонажа
```

### Типичные базовые классы для моддинга


| Если вы хотите создать... | Наследуйте от... |
|--------------------------|-----------|
| Новый предмет | `ItemBase` |
| Новое оружие | `Weapon_Base` |
| Новую одежду | `Clothing_Base` |
| Новый транспорт | `CarScript` |
| Элемент UI | `UIScriptedMenu` или `ScriptedWidgetEventHandler` |
| Менеджер/систему | `Managed` |
| Класс данных конфигурации | `Managed` |
| Хук миссии | `MissionServer` или `MissionGameplay` (через `modded class`) |

---

## Распространённые ошибки


### 1. Забытый `ref` для принадлежащих объектов

```mermaid
classDiagram
    class Object {
        +GetPosition() vector
        +SetPosition(vector)
        +GetType() string
        +IsKindOf(string) bool
    }

    class Entity {
        +GetOrientation() vector
        +SetOrientation(vector)
    }

    class EntityAI {
        +GetHealth(string, string) float
        +SetHealth(string, string, float)
        +IsAlive() bool
        +GetInventory() GameInventory
    }

    class ItemBase {
        +GetQuantity() float
        +SetQuantity(float)
        +OnDebugSpawn()
    }

    class PlayerBase {
        +GetIdentity() PlayerIdentity
        +GetBleeding() bool
        +IsRestrained() bool
    }

    class Building {
        +GetDoorIndex(int) int
    }

    class CarScript {
        +EngineStart()
        +EngineStop()
        +Fill(CarFluid, float)
    }

    Object <|-- Entity
    Entity <|-- EntityAI
    EntityAI <|-- ItemBase
    EntityAI <|-- ManBase
    EntityAI <|-- Building
    EntityAI <|-- DayZInfected
    ManBase <|-- PlayerBase
    ItemBase <|-- Weapon_Base
    ItemBase <|-- ClothingBase
    EntityAI <|-- CarScript
```

Когда класс владеет другим объектом (создаёт его, отвечает за его жизненный цикл), объявляйте поле как `ref`. Без `ref` объект может быть неожиданно удалён сборщиком мусора.

```c
// ПЛОХО: m_Data может быть удалён сборщиком мусора
class BadManager
{
    array<string> m_Data;  // сырой указатель, без владения

    void BadManager()
    {
        m_Data = new array<string>;  // объект может быть собран
    }
}

// ХОРОШО: ref гарантирует, что менеджер сохраняет m_Data
class GoodManager
{
    ref array<string> m_Data;  // сильная ссылка, владеет объектом

    void GoodManager()
    {
        m_Data = new array<string>;
    }
}
```

### 2. Забытое ключевое слово `override`


Если вы намереваетесь переопределить метод родителя, но забыли ключевое слово `override`, вы получите **новый** метод, который скрывает метод родителя вместо его замены. Компилятор может предупредить об этом.

```c
class Parent
{
    void DoWork() { Print("Parent"); }
}

class Child extends Parent
{
    // ПЛОХО: создаёт новый метод, не переопределяет
    void DoWork() { Print("Child"); }

    // ХОРОШО: правильно переопределяет
    override void DoWork() { Print("Child"); }
}
```

### 3. Отсутствие вызова `super` в переопределениях


При переопределении метода код родителя НЕ вызывается автоматически. Если пропустить `super`, вы теряете поведение родителя --- что может нарушить функциональность, особенно в глубоких цепочках наследования DayZ.

```c
class Parent
{
    void Init()
    {
        // Критическая инициализация происходит здесь
        Print("Parent.Init()");
    }
}

class Child extends Parent
{
    // ПЛОХО: Parent.Init() никогда не выполняется
    override void Init()
    {
        Print("Child.Init()");
    }

    // ХОРОШО: Parent.Init() выполняется первым, затем дочерний класс добавляет поведение
    override void Init()
    {
        super.Init();
        Print("Child.Init()");
    }
}
```

### 4. Циклы ref вызывают утечки памяти


Если объект A хранит `ref` на объект B, а объект B хранит `ref` на объект A, ни один не может быть освобождён. Одна сторона должна использовать сырой (не-ref) указатель.

```c
// ПЛОХО: цикл ref, ни один объект не может быть освобождён
class Parent
{
    ref Child m_Child;
}
class Child
{
    ref Parent m_Parent;  // УТЕЧКА: циклическая ссылка
}

// ХОРОШО: дочерний хранит сырой указатель на родителя
class Parent2
{
    ref Child2 m_Child;
}
class Child2
{
    Parent2 m_Parent;  // сырой указатель, без ref --- разрывает цикл
}
```

### 5. Попытка использовать множественное наследование


Enforce Script не поддерживает множественное наследование. Если вам нужно разделить поведение между несвязанными классами, используйте композицию (хранение ссылки на вспомогательный объект) или статические утилитарные методы.

```c
// ТАК НЕЛЬЗЯ:
// class FlyingCar extends Car, Aircraft { }  // ОШИБКА

// Вместо этого используйте композицию:
class FlyingCar extends Car
{
    protected ref FlightController m_Flight;

    void FlyingCar()
    {
        m_Flight = new FlightController;
    }

    void Fly(vector destination)
    {
        m_Flight.NavigateTo(destination);
    }
}
```

---

## Практические упражнения


### Упражнение 1: Иерархия фигур

Создайте базовый класс `Shape` с методом `float GetArea()`. Создайте подклассы `Circle` (радиус), `Rectangle` (ширина, высота) и `Triangle` (основание, высота), которые переопределяют `GetArea()`. Выведите площадь каждой фигуры.

### Упражнение 2: Система логирования

Создайте класс `Logger` с методом `Log(string message)`, который выводит в консоль. Создайте `FileLogger`, расширяющий его и дополнительно записывающий в концептуальный файл (просто выводите с префиксом `[FILE]`). Создайте `DiscordLogger`, расширяющий `Logger` и добавляющий префикс `[DISCORD]`. Каждый должен вызывать `super.Log()`.

### Упражнение 3: Предмет инвентаря

Создайте класс `CustomItem` с protected-полями для `m_Weight`, `m_Value` и `m_Condition` (float 0-1). Включите:
- Конструктор, принимающий все три значения
- Геттеры для каждого поля
- Метод `Degrade(float amount)`, уменьшающий состояние (ограничен до 0)
- Метод `GetEffectiveValue()`, возвращающий `m_Value * m_Condition`

Затем создайте `CustomWeaponItem`, расширяющий его, добавляющий `m_Damage` и переопределяющий `GetEffectiveValue()` с учётом урона.

### Упражнение 4: Синглтон-менеджер

Реализуйте синглтон `SessionManager`, отслеживающий события подключения/отключения игроков. Он должен хранить время подключения в map и предоставлять методы:
- `OnPlayerJoin(string uid, string name)`
- `OnPlayerLeave(string uid)`
- `int GetOnlineCount()`
- `float GetSessionDuration(string uid)` (в секундах)

### Упражнение 5: Цепочка обработчиков

Создайте абстрактный класс `Handler` с `protected Handler m_Next` и методами `SetNext(Handler next)` и `void Handle(string request)`. Создайте три конкретных обработчика (`AuthHandler`, `PermissionHandler`, `ActionHandler`), которые либо обрабатывают запрос, либо передают его `m_Next`. Продемонстрируйте цепочку.

---

## Итоги


| Концепция | Синтаксис | Примечания |
|---------|--------|-------|
| Объявление класса | `class Name { }` | Публичные члены по умолчанию |
| Наследование | `class Child extends Parent` | Только одиночное наследование; также `: Parent` |
| Конструктор | `void ClassName()` | Имя совпадает с именем класса |
| Деструктор | `void ~ClassName()` | Вызывается при удалении |
| Private | `private int m_Field;` | Только этот класс |
| Protected | `protected int m_Field;` | Этот класс + подклассы |
| Public | `int m_Field;` | Ключевое слово не нужно (по умолчанию) |
| Override | `override void Method()` | Должна совпадать сигнатура родителя |
| Вызов super | `super.Method()` | Вызывает версию родителя |
| Статическое поле | `static int s_Count;` | Общее для всех экземпляров |
| Статический метод | `static void DoThing()` | Вызывается через `ClassName.DoThing()` |
| `ref` | `ref MyClass m_Obj;` | Сильная ссылка (владеет объектом) |
| Sealed-класс | `sealed class Name { }` | Нельзя наследовать (ошибка компиляции 1.28+) |
| Sealed-метод | `sealed void Method()` | Нельзя переопределить в дочерних классах |
| Proto native | `proto native void Func();` | Метод, реализованный в движке |
| Параметр `out` | `void Func(out int val)` | Параметр только для записи |
| Параметр `inout` | `void Func(inout array<int> a)` | Параметр для ввода и вывода |
| Параметр `notnull` | `void Func(notnull EntityAI e)` | Компилятор гарантирует non-null |

---

[Главная](../README.md) | [<< Предыдущая: Массивы, Map и Set](02-arrays-maps-sets.md) | **Классы и наследование** | [Следующая: Modded-классы >>](04-modded-classes.md)
