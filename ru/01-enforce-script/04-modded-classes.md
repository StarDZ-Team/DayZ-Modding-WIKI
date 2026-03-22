# Глава 1.4: Modded-классы (Ключ к моддингу DayZ)

[Главная](../README.md) | [<< Предыдущая: Классы и наследование](03-classes-inheritance.md) | **Modded-классы** | [Следующая: Поток управления >>](05-control-flow.md)

---
---

## Введение


**Modded-классы --- это самая важная концепция в моддинге DayZ.** Это механизм, позволяющий вашему моду изменять поведение существующих игровых классов без замены исходных файлов. Без modded-классов моддинг DayZ в том виде, в каком мы его знаем, не существовал бы.

Каждый крупный мод DayZ --- Community Online Tools, VPP Admin Tools, DayZ Expansion, моды на торговлю, медицинские переработки, строительные системы --- работает с помощью `modded class` для подключения к ванильным классам и добавления или изменения поведения. Когда вы моддите `PlayerBase`, каждый игрок в игре получает ваше новое поведение. Когда вы моддите `MissionServer`, ваш код выполняется как часть жизненного цикла миссии сервера. Когда вы моддите `ItemBase`, затрагивается каждый предмет в игре.

Эта глава намеренно самая длинная и подробная в Части 1, потому что правильная работа с modded-классами --- это то, что отличает рабочий мод от того, который крашит серверы или ломает другие моды.

---

## Как работают modded-классы


### Основная идея


Обычно `class Child extends Parent` создаёт новый класс с именем `Child`, наследующий от `Parent`. Но `modded class Parent` делает нечто принципиально иное: он **заменяет** оригинальный класс `Parent` в иерархии классов движка, вставляя ваш код в цепочку наследования.

```
До моддинга:
  Parent -> (весь код, создающий Parent, получает оригинал)

После modded class:
  Оригинальный Parent -> Ваш Modded Parent
  (весь код, создающий Parent, теперь получает ВАШУ версию)
```

Каждый вызов `new Parent()` в любом месте игры --- ванильный код, другие моды, везде --- теперь создаёт экземпляр вашей модифицированной версии.

### Синтаксис


```c
modded class ClassName
{
    // Ваши дополнения и переопределения здесь
}
```

Вот и всё. Никакого `extends`, никакого нового имени. Ключевое слово `modded` сообщает движку: «Я модифицирую существующий класс `ClassName`».

### Каноничный пример


```c
// === Оригинальный ванильный класс (в скриптах DayZ) ===
class ModMe
{
    void Say()
    {
        Print("Hello from the original");
    }
}

// === Скриптовый файл вашего мода ===
modded class ModMe
{
    override void Say()
    {
        Print("Hello from the mod");
        super.Say();  // Вызвать оригинал
    }
}

// === Что происходит в рантайме ===
void Test()
{
    ModMe obj = new ModMe();
    obj.Say();
    // Вывод:
    //   "Hello from the mod"
    //   "Hello from the original"
}
```

---

## Цепочка: несколько модов модифицируют один класс


Настоящая мощь modded-классов в том, что **несколько модов могут модифицировать один и тот же класс**, и они автоматически выстраиваются в цепочку. Движок обрабатывает моды в порядке загрузки, и каждый `modded class` наследует от предыдущего.

```c
// === Ваниль ===
class ModMe
{
    void Say()
    {
        Print("Original");
    }
}

// === Мод A (загружен первым) ===
modded class ModMe
{
    override void Say()
    {
        Print("Mod A");
        super.Say();  // Вызывает оригинал
    }
}

// === Мод B (загружен вторым) ===
modded class ModMe
{
    override void Say()
    {
        Print("Mod B");
        super.Say();  // Вызывает версию Мода A
    }
}

// === В рантайме ===
void Test()
{
    ModMe obj = new ModMe();
    obj.Say();
    // Вывод (обратный порядок загрузки):
    //   "Mod B"
    //   "Mod A"
    //   "Original"
}
```

Вот почему **обязательный вызов `super`** критически важен. Если Мод A не вызывает `super.Say()`, то оригинальный `Say()` никогда не выполняется. Если Мод B не вызывает `super.Say()`, то `Say()` Мода A никогда не выполняется. Один мод, пропустивший `super`, ломает всю цепочку.

### Визуальное представление


```
new ModMe() создаёт экземпляр с такой цепочкой наследования:

  ModMe (версия Мода B)      <-- Создаётся экземпляр
    |
    super -> ModMe (версия Мода A)
               |
               super -> ModMe (Оригинальная ваниль)
```

---

## Что можно делать в modded-классе


### 1. Переопределение существующих методов

Наиболее частое использование. Добавление поведения до или после ванильного кода.

```c
modded class PlayerBase
{
    override void Init()
    {
        super.Init();  // Позволить ванильной инициализации произойти первой
        Print("[MyMod] Player initialized: " + GetType());
    }
}
```

### 2. Добавление новых полей (переменных-членов)

Расширение класса новыми данными. Каждый экземпляр модифицированного класса будет иметь эти поля.

```c
modded class PlayerBase
{
    protected int m_KillStreak;
    protected float m_LastKillTime;
    protected ref array<string> m_Achievements;

    override void Init()
    {
        super.Init();
        m_KillStreak = 0;
        m_LastKillTime = 0;
        m_Achievements = new array<string>;
    }
}
```

### 3. Добавление новых методов

Добавление совершенно новой функциональности, которую могут вызывать другие части вашего мода.

```c
modded class PlayerBase
{
    protected int m_Reputation;

    override void Init()
    {
        super.Init();
        m_Reputation = 0;
    }

    void AddReputation(int amount)
    {
        m_Reputation += amount;
        if (m_Reputation > 1000)
            Print("[MyMod] " + GetIdentity().GetName() + " is now a legend!");
    }

    int GetReputation()
    {
        return m_Reputation;
    }

    bool IsHeroStatus()
    {
        return m_Reputation >= 500;
    }
}
```

### 4. Доступ к приватным членам оригинального класса

В отличие от обычного наследования, где `private` члены недоступны, **modded-классы МОГУТ обращаться к приватным членам** оригинального класса. Это особое правило ключевого слова `modded`.

```c
// Ванильный класс
class VanillaClass
{
    private int m_SecretValue;

    private void DoSecretThing()
    {
        Print("Secret!");
    }
}

// Modded-класс МОЖЕТ обращаться к приватным членам
modded class VanillaClass
{
    void ExposeSecret()
    {
        Print(m_SecretValue);  // OK! Modded-классы обходят private
        DoSecretThing();       // OK! Можно вызывать приватные методы тоже
    }
}
```

Это мощный инструмент, но использовать его следует осторожно. Приватные члены приватны не просто так --- они могут измениться между обновлениями DayZ.

### 5. Переопределение констант

Modded-классы могут переопределять константы:

```c
// Ваниль
class GameSettings
{
    const int MAX_PLAYERS = 60;
}

// Modded
modded class GameSettings
{
    const int MAX_PLAYERS = 100;  // Переопределяет оригинальное значение
}
```

---

## Типичные цели для модификации


Это классы, в которые подключается практически каждый мод DayZ. Понимание того, что предлагает каждый из них, необходимо.

### MissionServer


Выполняется на выделенном сервере. Управляет запуском сервера, подключениями игроков и игровым циклом.

```c
modded class MissionServer
{
    protected ref MyServerManager m_MyManager;

    override void OnInit()
    {
        super.OnInit();

        // Инициализация ваших серверных систем
        m_MyManager = new MyServerManager;
        m_MyManager.Init();
        Print("[MyMod] Server systems initialized");
    }

    override void OnMissionStart()
    {
        super.OnMissionStart();
        Print("[MyMod] Mission started");
    }

    override void OnMissionFinish()
    {
        // Очистка ДО super (super может разрушить системы, от которых мы зависим)
        if (m_MyManager)
            m_MyManager.Shutdown();

        super.OnMissionFinish();
    }

    // Вызывается при подключении игрока
    override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)
    {
        super.InvokeOnConnect(player, identity);

        if (identity)
            Print("[MyMod] Player connected: " + identity.GetName());
    }

    // Вызывается при отключении игрока
    override void InvokeOnDisconnect(PlayerBase player)
    {
        if (player && player.GetIdentity())
            Print("[MyMod] Player disconnected: " + player.GetIdentity().GetName());

        super.InvokeOnDisconnect(player);
    }

    // Вызывается каждый серверный тик
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (m_MyManager)
            m_MyManager.Update(timeslice);
    }
}
```

### MissionGameplay


Выполняется на клиенте. Управляет клиентским UI, вводом и хуками рендеринга.

```c
modded class MissionGameplay
{
    protected ref MyHUDPanel m_MyHUD;

    override void OnInit()
    {
        super.OnInit();

        m_MyHUD = new MyHUDPanel;
        Print("[MyMod] Client HUD initialized");
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (m_MyHUD)
            m_MyHUD.Update(timeslice);
    }

    override void OnKeyPress(int key)
    {
        super.OnKeyPress(key);

        // Открыть пользовательское меню по F5
        if (key == KeyCode.KC_F5)
        {
            if (m_MyHUD)
                m_MyHUD.Toggle();
        }
    }

    override void OnMissionFinish()
    {
        if (m_MyHUD)
            m_MyHUD.Destroy();

        super.OnMissionFinish();
    }
}
```

### PlayerBase


Класс игрока. Каждый живой игрок в игре является экземпляром `PlayerBase` (или подкласса вроде `SurvivorBase`). Модификация этого класса --- способ добавления функций для каждого игрока.

```c
modded class PlayerBase
{
    protected bool m_IsGodMode;
    protected float m_CustomTimer;

    override void Init()
    {
        super.Init();
        m_IsGodMode = false;
        m_CustomTimer = 0;
    }

    // Вызывается каждый кадр на сервере для этого игрока
    override void CommandHandler(float pDt, int pCurrentCommandID, bool pCurrentCommandFinished)
    {
        super.CommandHandler(pDt, pCurrentCommandID, pCurrentCommandFinished);

        // Серверный тик для каждого игрока
        if (GetGame().IsServer())
        {
            m_CustomTimer += pDt;
            if (m_CustomTimer >= 60.0)  // Каждые 60 секунд
            {
                m_CustomTimer = 0;
                OnMinuteElapsed();
            }
        }
    }

    void SetGodMode(bool enabled)
    {
        m_IsGodMode = enabled;
    }

    // Переопределение урона для реализации режима бога
    override void EEHitBy(TotalDamageResult damageResult, int damageType, EntityAI source,
                          int component, string dmgZone, string ammo,
                          vector modelPos, float speedCoef)
    {
        if (m_IsGodMode)
            return;  // Полностью пропустить урон

        super.EEHitBy(damageResult, damageType, source, component, dmgZone, ammo, modelPos, speedCoef);
    }

    protected void OnMinuteElapsed()
    {
        // Пользовательская периодическая логика
    }
}
```

### ItemBase


Базовый класс для всех предметов. Модификация затрагивает каждый предмет в игре.

```c
modded class ItemBase
{
    override void SetActions()
    {
        super.SetActions();

        // Добавить пользовательское действие ко ВСЕМ предметам
        AddAction(MyInspectAction);
    }

    override void EEItemLocationChanged(notnull InventoryLocation oldLoc, notnull InventoryLocation newLoc)
    {
        super.EEItemLocationChanged(oldLoc, newLoc);

        // Отслеживание перемещения предметов
        Print(string.Format("[MyMod] %1 moved from %2 to %3",
            GetType(), oldLoc.GetType(), newLoc.GetType()));
    }
}
```

### DayZGame


Глобальный класс игры. Доступен на протяжении всего жизненного цикла игры.

```c
modded class DayZGame
{
    void DayZGame()
    {
        // Конструктор: очень ранняя инициализация
        Print("[MyMod] DayZGame constructor - extremely early init");
    }

    override void OnUpdate(bool doSim, float timeslice)
    {
        super.OnUpdate(doSim, timeslice);

        // Глобальный тик обновления (и клиент, и сервер)
    }
}
```

### CarScript


Базовый класс транспортных средств. Моддинг изменяет поведение всех транспортных средств.

```c
modded class CarScript
{
    protected float m_BoostMultiplier;

    override void OnEngineStart()
    {
        super.OnEngineStart();
        m_BoostMultiplier = 1.0;
        Print("[MyMod] Vehicle engine started: " + GetType());
    }

    override void OnEngineStop()
    {
        super.OnEngineStop();
        Print("[MyMod] Vehicle engine stopped: " + GetType());
    }
}
```

---

## Защита `#ifdef` для опциональных зависимостей

Когда ваш мод опционально поддерживает другой мод, используйте защиту препроцессора. Если другой мод определяет символ в своём `config.cpp` (через `CfgPatches`), вы можете проверить его на этапе компиляции.

### Как это работает

Имя класса `CfgPatches` каждого мода становится символом препроцессора. Например, если мод имеет:

```cpp
class CfgPatches
{
    class MyAI_Scripts
    {
        // ...
    };
};
```

Тогда `#ifdef MyAI_Scripts` будет `true`, когда этот мод загружен.

Многие моды также определяют явные символы. Соглашения различаются --- проверяйте документацию мода или `config.cpp`.

### Базовый паттерн

```c
modded class PlayerBase
{
    override void Init()
    {
        super.Init();

        // Этот код компилируется ТОЛЬКО когда MyAI присутствует
        #ifdef MyAI
            MyAIManager mgr = MyAIManager.GetInstance();
            if (mgr)
                mgr.RegisterPlayer(this);
        #endif
    }
}
```

### Защита сервер vs клиент

```c
modded class MissionBase
{
    override void OnInit()
    {
        super.OnInit();

        // Код только для сервера
        #ifdef SERVER
            InitServerSystems();
        #endif

        // Код только для клиента (также выполняется на хосте listen-сервера)
        #ifndef SERVER
            InitClientHUD();
        #endif
    }

    #ifdef SERVER
    protected void InitServerSystems()
    {
        Print("[MyMod] Server systems started");
    }
    #endif

    #ifndef SERVER
    protected void InitClientHUD()
    {
        Print("[MyMod] Client HUD started");
    }
    #endif
}
```

### Совместимость нескольких модов

Вот реальный паттерн для мода, который улучшает игроков с опциональной поддержкой двух других модов:

```c
modded class PlayerBase
{
    protected int m_BountyPoints;

    override void Init()
    {
        super.Init();
        m_BountyPoints = 0;
    }

    void AddBounty(int amount)
    {
        m_BountyPoints += amount;

        // Если загружены Expansion Notifications, показать красивое уведомление
        #ifdef EXPANSIONMODNOTIFICATION
            ExpansionNotification("Bounty!", string.Format("+%1 points", amount)).Create(GetIdentity());
        #else
            // Запасной вариант: простое уведомление
            NotificationSystem.SendNotificationToPlayerExtended(this, 5, "Bounty",
                string.Format("+%1 points", amount), "");
        #endif

        // Если загружен мод торговца, обновить баланс игрока
        #ifdef TraderPlus
            // Вызов API TraderPlus
        #endif
    }
}
```

---

## Профессиональные паттерны из реальных модов


### Паттерн 1: Неразрушающее оборачивание метода (стиль COT)

Community Online Tools оборачивает методы, выполняя работу до и после `super`, никогда не заменяя поведение полностью:

```c
modded class MissionServer
{
    // Новое поле, добавленное COT
    protected ref JMPlayerModule m_JMPlayerModule;

    override void OnInit()
    {
        super.OnInit();  // Вся ванильная инициализация происходит

        // COT добавляет свою инициализацию ПОСЛЕ ванильной
        m_JMPlayerModule = new JMPlayerModule;
        m_JMPlayerModule.Init();
    }

    override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)
    {
        // COT выполняет предобработку
        if (identity)
            m_JMPlayerModule.OnClientConnect(identity);

        // Затем позволяет ванили (и другим модам) обработать
        super.InvokeOnConnect(player, identity);

        // COT выполняет постобработку
        if (identity)
            m_JMPlayerModule.OnClientReady(identity);
    }
}
```

### Паттерн 2: Условное переопределение (стиль VPP)

VPP Admin Tools проверяет условия перед решением, изменять ли поведение:

```c
#ifndef VPPNOTIFICATIONS
modded class MissionGameplay
{
    private ref VPPNotificationUI m_NotificationUI;

    override void OnInit()
    {
        super.OnInit();
        m_NotificationUI = new VPPNotificationUI;
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (m_NotificationUI)
            m_NotificationUI.OnUpdate(timeslice);
    }
}
#endif
```

Обратите внимание на защиту `#ifndef VPPNOTIFICATIONS` --- она предотвращает компиляцию кода, если отдельный мод уведомлений уже загружен, избегая конфликтов.

### Паттерн 3: Внедрение событий (стиль Expansion)

DayZ Expansion внедряет события в ванильные классы для трансляции информации в собственные системы:

```c
modded class PlayerBase
{
    override void EEKilled(Object killer)
    {
        // Вызвать систему событий Expansion перед ванильной обработкой смерти
        ExpansionEventBus.Fire("OnPlayerKilled", this, killer);

        super.EEKilled(killer);

        // Постобработка после смерти
        ExpansionEventBus.Fire("OnPlayerKilledPost", this, killer);
    }

    override void OnConnect()
    {
        super.OnConnect();
        ExpansionEventBus.Fire("OnPlayerConnect", this);
    }
}
```

### Паттерн 4: Регистрация функций (стиль Community Framework)

Моды CF регистрируют функции в конструкторах, централизуя инициализацию:

```c
modded class DayZGame
{
    void DayZGame()
    {
        // CF регистрирует свои системы в конструкторе DayZGame
        // Это выполняется очень рано, до загрузки любой миссии
        CF_ModuleManager.RegisterModule(MyCFModule);
    }
}

modded class MissionServer
{
    void MissionServer()
    {
        // Конструктор: выполняется при создании MissionServer
        // Регистрируйте RPC здесь
        GetRPCManager().AddRPC("MyMod", "RPC_HandleRequest", this, SingleplayerExecutionType.Both);
    }
}
```

---

## Правила и лучшие практики


### Правило 1: ВСЕГДА вызывайте `super`


Если у вас нет намеренной и хорошо обоснованной причины полностью заменить поведение родителя, всегда вызывайте `super`. Невыполнение этого ломает цепочку модов и может крашить серверы.

```c
// ЗОЛОТОЕ ПРАВИЛО modded-классов
modded class AnyClass
{
    override void AnyMethod()
    {
        super.AnyMethod();  // ВСЕГДА, если вы не заменяете намеренно
        // Ваш код здесь
    }
}
```

Когда вы намеренно пропускаете `super`, документируйте почему:

```c
modded class PlayerBase
{
    // Намеренно НЕ вызываем super для полного отключения урона от падения
    // ВНИМАНИЕ: Это также предотвратит выполнение кода урона от падения других модов
    override void EEHitBy(TotalDamageResult damageResult, int damageType, EntityAI source,
                          int component, string dmgZone, string ammo,
                          vector modelPos, float speedCoef)
    {
        // Проверить, урон ли это от падения
        if (ammo == "FallDamage")
            return;  // Молча игнорировать

        // Для всего остального урона вызвать обычную цепочку
        super.EEHitBy(damageResult, damageType, source, component, dmgZone, ammo, modelPos, speedCoef);
    }
}
```

### Правило 2: Инициализируйте новые поля в правильном override


При добавлении полей в modded-класс инициализируйте их в соответствующем методе жизненного цикла, а не где попало:

| Класс | Инициализируйте в | Почему |
|-------|--------------|-----|
| `PlayerBase` | `override void Init()` | Вызывается один раз при создании сущности игрока |
| `ItemBase` | конструктор или `override void InitItemVariables()` | Создание предмета |
| `MissionServer` | `override void OnInit()` | Запуск серверной миссии |
| `MissionGameplay` | `override void OnInit()` | Запуск клиентской миссии |
| `DayZGame` | конструктор `void DayZGame()` | Самый ранний возможный момент |
| `CarScript` | конструктор или `override void EOnInit(IEntity other, int extra)` | Создание транспорта |

### Правило 3: Защита от null


В modded-классах вы часто работаете с объектами, которые могут быть ещё не инициализированы (потому что вы выполняетесь до или после другого кода):

```c
modded class PlayerBase
{
    override void CommandHandler(float pDt, int pCurrentCommandID, bool pCurrentCommandFinished)
    {
        super.CommandHandler(pDt, pCurrentCommandID, pCurrentCommandFinished);

        // Всегда проверяйте: выполняется ли это на сервере?
        if (!GetGame().IsServer())
            return;

        // Всегда проверяйте: жив ли игрок?
        if (!IsAlive())
            return;

        // Всегда проверяйте: есть ли у игрока identity?
        PlayerIdentity identity = GetIdentity();
        if (!identity)
            return;

        // Теперь безопасно использовать identity
        string uid = identity.GetPlainId();
    }
}
```

### Правило 4: Не ломайте другие моды


Ваш modded-класс --- часть цепочки. Соблюдайте контракт:

- Не подавляйте события молча (всегда вызывайте `super`, если только не переопределяете намеренно)
- Не перезаписывайте поля, которые могли установить другие моды (добавляйте собственные поля)
- Используйте защиту `#ifdef` для опциональных зависимостей
- Тестируйте с другими популярными модами

### Правило 5: Используйте описательные префиксы полей


При добавлении полей в modded-класс используйте префикс с именем вашего мода, чтобы избежать коллизий с другими модами, добавляющими поля в тот же класс:

```c
modded class PlayerBase
{
    // ПЛОХО: общее имя, может совпасть с другим модом
    protected int m_Points;

    // ХОРОШО: префикс, специфичный для мода
    protected int m_MyMod_Points;
    protected float m_MyMod_LastSync;
    protected ref array<string> m_MyMod_Unlocks;
}
```

---

## Распространённые ошибки


### 1. Невызов `super` (ошибка #1, ломающая моды)

Это нельзя подчеркнуть достаточно. Каждый раз, когда вы видите баг-репорт «Мод X сломался, когда я добавил Мод Y», первое, что нужно проверить --- не забыл ли кто-то вызвать `super`.

```c
// ЭТО ЛОМАЕТ ВСЁ НИЖЕ ПО ЦЕПОЧКЕ
modded class MissionServer
{
    override void OnInit()
    {
        // НЕТ вызова super.OnInit()!
        // OnInit каждого мода, загруженного до этого, пропускается
        Print("My mod started!");
    }
}
```

### 2. Переопределение несуществующего метода

Если вы пытаетесь `override` метод, которого нет в родительском классе, вы получите ошибку компиляции. Обычно это происходит, когда:
- Вы допустили опечатку в имени метода
- Вы переопределяете метод не того класса
- Обновление DayZ переименовало или удалило метод

```c
modded class PlayerBase
{
    // ОШИБКА: такого метода нет в PlayerBase
    // override void OnPlayerSpawned()

    // ПРАВИЛЬНОЕ имя метода:
    override void OnConnect()
    {
        super.OnConnect();
    }
}
```

### 3. Модификация не того класса

Типичная ошибка новичков --- модификация класса, который кажется правильным по имени, но находится не в том скриптовом слое:

```c
// НЕПРАВИЛЬНО: MissionBase --- это абстрактная база, ваши хуки здесь могут не сработать,
// когда вы этого ожидаете
modded class MissionBase
{
    override void OnInit()
    {
        super.OnInit();
        // Это выполняется для ВСЕХ типов миссий -- но это ли то, что вам нужно?
    }
}

// ПРАВИЛЬНО: выберите конкретный класс для вашей цели
// Для серверной логики:
modded class MissionServer
{
    override void OnInit() { super.OnInit(); /* серверный код */ }
}

// Для клиентского UI:
modded class MissionGameplay
{
    override void OnInit() { super.OnInit(); /* клиентский код */ }
}
```

### 4. Тяжёлая обработка в покадровых override

Методы вроде `OnUpdate()` и `CommandHandler()` вызываются каждый тик или каждый кадр. Добавление тяжёлой логики здесь убивает производительность сервера/клиента:

```c
modded class PlayerBase
{
    // ПЛОХО: выполняется каждый кадр для каждого игрока
    override void CommandHandler(float pDt, int pCurrentCommandID, bool pCurrentCommandFinished)
    {
        super.CommandHandler(pDt, pCurrentCommandID, pCurrentCommandFinished);

        // Создаёт и уничтожает массив КАЖДЫЙ КАДР для КАЖДОГО ИГРОКА
        array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);
        foreach (Man m : players)
        {
            // O(n^2) за кадр!
        }
    }
}

// ХОРОШО: используйте таймер для ограничения частоты тяжёлых операций
modded class PlayerBase
{
    protected float m_MyMod_Timer;

    override void CommandHandler(float pDt, int pCurrentCommandID, bool pCurrentCommandFinished)
    {
        super.CommandHandler(pDt, pCurrentCommandID, pCurrentCommandFinished);

        if (!GetGame().IsServer())
            return;

        m_MyMod_Timer += pDt;
        if (m_MyMod_Timer < 5.0)  // Каждые 5 секунд, а не каждый кадр
            return;

        m_MyMod_Timer = 0;
        DoExpensiveWork();
    }

    protected void DoExpensiveWork()
    {
        // Периодическая логика здесь
    }
}
```

### 5. Отсутствие защиты `#ifdef` для опциональных зависимостей

Если ваш мод ссылается на класс другого мода без защиты `#ifdef`, он не скомпилируется, когда тот мод не загружен:

```c
modded class PlayerBase
{
    override void Init()
    {
        super.Init();

        // ПЛОХО: ошибка компиляции, если ExpansionMod не загружен
        // ExpansionHumanity.AddKarma(this, 10);

        // ХОРОШО: защищено с помощью #ifdef
        #ifdef EXPANSIONMODCORE
            ExpansionHumanity.AddKarma(this, 10);
        #endif
    }
}
```

### 6. Деструкторы: очистка перед `super`

При переопределении деструкторов или методов очистки выполняйте свою очистку **перед** вызовом `super`, так как `super` может уничтожить ресурсы, от которых вы зависите:

```c
modded class MissionServer
{
    protected ref MyManager m_MyManager;

    override void OnMissionFinish()
    {
        // Сначала очистите СВОИ ресурсы
        if (m_MyManager)
        {
            m_MyManager.Save();
            m_MyManager.Shutdown();
        }
        m_MyManager = null;

        // ЗАТЕМ позвольте ванили и другим модам выполнить очистку
        super.OnMissionFinish();
    }
}
```

---

## Именование и организация файлов


Файлы modded-классов должны следовать чёткому соглашению об именовании, чтобы с первого взгляда было видно, какой класс модифицируется и каким модом:

```
MyMod/
  Scripts/
    3_Game/
      MyMod/
    4_World/
      MyMod/
        Entities/
          ManBase/
            MyMod_PlayerBase.c         <-- modded class PlayerBase
          ItemBase/
            MyMod_ItemBase.c           <-- modded class ItemBase
          Vehicles/
            MyMod_CarScript.c          <-- modded class CarScript
    5_Mission/
      MyMod/
        Mission/
          MyMod_MissionServer.c        <-- modded class MissionServer
          MyMod_MissionGameplay.c      <-- modded class MissionGameplay
```

Это повторяет структуру файлов ванильного DayZ, упрощая поиск того, какой файл модифицирует какой класс.

---

## Практические упражнения


### Упражнение 1: Логгер подключений игроков

Создайте `modded class MissionServer`, который выводит сообщение в серверный лог при подключении или отключении игрока, включая его имя и UID. Не забудьте вызвать `super`.

### Упражнение 2: Осмотр предмета

Создайте `modded class ItemBase`, добавляющий метод `string GetInspectInfo()`, возвращающий форматированную строку с именем класса предмета, его здоровьем и тем, сломан ли он. Переопределите подходящий метод для вывода этой информации, когда предмет берётся в руки игрока.

### Упражнение 3: Режим бога для администратора

Создайте `modded class PlayerBase`, который:
1. Добавляет поле `m_IsGodMode`
2. Добавляет методы `EnableGodMode()` и `DisableGodMode()`
3. Переопределяет метод урона `EEHitBy`, чтобы пропускать урон при активном режиме бога
4. Всегда вызывает `super` для обычного (не в режиме бога) урона

### Упражнение 4: Логгер скорости транспорта

Создайте `modded class CarScript`, отслеживающий максимальную достигнутую скорость за каждую сессию двигателя. Переопределите `OnEngineStart()` и `OnEngineStop()` для начала/окончания отслеживания. Выведите максимальную скорость при остановке двигателя.

### Упражнение 5: Интеграция с опциональным модом

Создайте `modded class PlayerBase`, добавляющий систему репутации. Когда игрок убивает зомби, он получает 1 очко. Используйте защиту `#ifdef` для:
- Если доступна система уведомлений Expansion, показать уведомление
- Если доступен мод торговца, добавить валюту
- Если ничего не доступно, использовать простой Print()

---

## Итоги


| Концепция | Подробности |
|---------|---------|
| Синтаксис | `modded class ClassName { }` |
| Эффект | Глобально заменяет оригинальный класс для всех вызовов `new` |
| Цепочка | Несколько модов могут модифицировать один класс; они выстраиваются в порядке загрузки |
| `super` | **Всегда вызывайте**, если только не заменяете поведение намеренно |
| Новые поля | Добавляйте с префиксами мода (`m_MyMod_FieldName`) |
| Новые методы | Полностью поддерживаются; вызываемы из любого места, имеющего ссылку |
| Доступ к private | Modded-классы **могут** обращаться к приватным членам оригинала |
| Защита `#ifdef` | Используйте для опциональных зависимостей от других модов |
| Типичные цели | `MissionServer`, `MissionGameplay`, `PlayerBase`, `ItemBase`, `DayZGame`, `CarScript` |

### Три заповеди modded-классов


1. **Всегда вызывайте `super`** --- если нет документированной причины не делать этого
2. **Защищайте опциональные зависимости с помощью `#ifdef`** --- ваш мод должен работать автономно
3. **Используйте префиксы для полей и методов** --- избегайте коллизий имён с другими модами

---

[Главная](../README.md) | [<< Предыдущая: Классы и наследование](03-classes-inheritance.md) | **Modded-классы** | [Следующая: Поток управления >>](05-control-flow.md)
