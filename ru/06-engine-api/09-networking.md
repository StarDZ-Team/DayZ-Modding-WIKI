# Глава 6.9: Сетевое взаимодействие и RPC

[Главная](../README.md) | [<< Предыдущая: Файловый ввод-вывод и JSON](08-file-io.md) | **Сетевое взаимодействие и RPC** | [Следующая: Центральная экономика >>](10-central-economy.md)

---

## Введение


DayZ --- клиент-серверная игра. Вся авторитетная логика выполняется на сервере, а клиенты взаимодействуют с ним через удалённые вызовы процедур (RPC). Основной механизм RPC --- это `ScriptRPC`, позволяющий записывать произвольные данные на одной стороне и считывать их на другой. Эта глава охватывает сетевой API: отправку и получение RPC, классы контекста сериализации, устаревший метод `CGame.RPC()` и `ScriptInputUserData` для проверенных движком сообщений от клиента к серверу.

---

## Клиент-серверная архитектура

```
┌────────────┐                    ┌────────────┐
│   Клиент   │  ──── RPC ────►   │   Сервер   │
│            │  ◄──── RPC ────   │            │
│ GetGame()  │                    │ GetGame()  │
│ .IsClient()│                    │ .IsServer()│
└────────────┘                    └────────────┘
```

### Проверка окружения

```c
proto native bool GetGame().IsServer();          // true на сервере и хосте listen-сервера
proto native bool GetGame().IsClient();          // true на клиенте
proto native bool GetGame().IsMultiplayer();      // true в мультиплеере
proto native bool GetGame().IsDedicatedServer();  // true только на выделенном сервере
```

**Типичный паттерн защиты:**

```c
if (GetGame().IsServer())
{
    // Логика только для сервера
}

if (!GetGame().IsServer())
{
    // Логика только для клиента
}
```

---

## ScriptRPC

**Файл:** `3_Game/gameplay.c:104`

Основной класс RPC для отправки пользовательских данных между клиентом и сервером. `ScriptRPC` расширяет `ParamsWriteContext`, поэтому вы вызываете `.Write()` на нём непосредственно для сериализации данных.

### Определение класса

```c
class ScriptRPC : ParamsWriteContext
{
    void ScriptRPC();
    void ~ScriptRPC();
    proto native void Reset();
    proto native void Send(Object target, int rpc_type, bool guaranteed,
                           PlayerIdentity recipient = NULL);
}
```

### Параметры Send

| Параметр | Описание |
|-----------|-------------|
| `target` | Объект, с которым связан этот RPC (может быть `null` для глобальных RPC) |
| `rpc_type` | Целочисленный идентификатор RPC (должен совпадать у отправителя и получателя) |
| `guaranteed` | `true` = надёжная доставка в стиле TCP; `false` = ненадёжная в стиле UDP |
| `recipient` | `PlayerIdentity` целевого клиента; `null` = трансляция всем клиентам (только сервер) |

### Запись данных

`ParamsWriteContext` (который расширяет `ScriptRPC`) предоставляет:

```c
proto bool Write(void value_out);
```

Поддерживает все примитивные типы, массивы и сериализуемые объекты:

```c
ScriptRPC rpc = new ScriptRPC();
rpc.Write(42);                          // int
rpc.Write(3.14);                        // float
rpc.Write(true);                        // bool
rpc.Write("hello");                     // string
rpc.Write(Vector(100, 0, 200));         // vector

array<string> names = {"Alice", "Bob"};
rpc.Write(names);                       // array<string>
```

### Отправка: сервер к клиенту

```c
// Отправить конкретному игроку
void SendDataToPlayer(PlayerBase player, int value, string message)
{
    if (!GetGame().IsServer())
        return;

    ScriptRPC rpc = new ScriptRPC();
    rpc.Write(value);
    rpc.Write(message);
    rpc.Send(player, MY_RPC_ID, true, player.GetIdentity());
}

// Трансляция всем игрокам
void BroadcastData(string message)
{
    if (!GetGame().IsServer())
        return;

    ScriptRPC rpc = new ScriptRPC();
    rpc.Write(message);
    rpc.Send(null, MY_RPC_ID, true, null);  // null получатель = все клиенты
}
```

### Отправка: клиент к серверу

```c
void SendRequestToServer(int requestType)
{
    if (!GetGame().IsClient())
        return;

    PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
    if (!player)
        return;

    ScriptRPC rpc = new ScriptRPC();
    rpc.Write(requestType);
    rpc.Send(player, MY_REQUEST_RPC, true, null);
    // При отправке с клиента recipient игнорируется --- всегда идёт на сервер
}
```

---

## Получение RPC

RPC получаются путём переопределения `OnRPC` у целевого объекта (или любого родительского класса в иерархии).

### Сигнатура OnRPC

```c
override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
{
    super.OnRPC(sender, rpc_type, ctx);

    if (rpc_type == MY_RPC_ID)
    {
        // Считывать данные в том же порядке, в котором они были записаны
        int value;
        string message;

        if (!ctx.Read(value))
            return;
        if (!ctx.Read(message))
            return;

        // Обработать данные
        HandleData(value, message);
    }
}
```

### ParamsReadContext

`ParamsReadContext` --- это typedef для `Serializer`:

```c
typedef Serializer ParamsReadContext;
typedef Serializer ParamsWriteContext;
```

Метод `Read`:

```c
proto bool Read(void value_in);
```

Возвращает `true` при успехе, `false` при неудаче чтения (неправильный тип, недостаточно данных). Всегда проверяйте возвращаемое значение.

### Где переопределять OnRPC

| Целевой объект | Получает RPC для |
|---------------|-------------------|
| `PlayerBase` | RPC, отправленные с `target = player` |
| `ItemBase` | RPC, отправленные с `target = item` |
| Любой `Object` | RPC, отправленные с этим объектом как target |
| `MissionGameplay` / `MissionServer` | Глобальные RPC (`target = null`) через `OnRPC` в миссии |

**Пример --- полный клиент-серверный обмен:**

```c
// Общая константа (уровень 3_Game)
const int RPC_MY_CUSTOM_DATA = 87001;

// Серверная сторона: отправка данных клиенту (4_World или 5_Mission)
class MyServerHandler
{
    void SendScore(PlayerBase player, int score)
    {
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(score);
        rpc.Send(player, RPC_MY_CUSTOM_DATA, true, player.GetIdentity());
    }
}

// Клиентская сторона: получение данных (modded PlayerBase)
modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (rpc_type == RPC_MY_CUSTOM_DATA)
        {
            int score;
            if (!ctx.Read(score))
                return;

            Print(string.Format("Received score: %1", score));
        }
    }
}
```

---

## CGame.RPC (устаревший API)

Старая система RPC на основе массивов. Всё ещё используется в ванильном коде, но `ScriptRPC` предпочтителен для новых модов.

### Сигнатуры

```c
// Отправка с массивом объектов Param
proto native void GetGame().RPC(Object target, int rpcType,
                                 notnull array<ref Param> params,
                                 bool guaranteed,
                                 PlayerIdentity recipient = null);

// Отправка с одним Param
proto native void GetGame().RPCSingleParam(Object target, int rpc_type,
                                            Param param, bool guaranteed,
                                            PlayerIdentity recipient = null);
```

### Классы Param

```c
class Param1<Class T1> extends Param { T1 param1; };
class Param2<Class T1, Class T2> extends Param { T1 param1; T2 param2; };
// ... до Param8
```

**Пример --- устаревший RPC:**

```c
// Отправка
Param1<string> data = new Param1<string>("Hello World");
GetGame().RPCSingleParam(null, MY_RPC_ID, data, true, player.GetIdentity());

// Получение (в OnRPC)
if (rpc_type == MY_RPC_ID)
{
    Param1<string> data = new Param1<string>("");
    if (ctx.Read(data))
    {
        Print(data.param1);  // "Hello World"
    }
}
```

---

## ScriptInputUserData

**Файл:** `3_Game/gameplay.c`

Специализированный контекст записи для отправки сообщений ввода от клиента к серверу, проходящих через конвейер валидации ввода движка. Используется для действий, требующих проверки античита.

```c
class ScriptInputUserData : ParamsWriteContext
{
    proto native void Reset();
    proto native void Send();
    proto native static bool CanStoreInputUserData();
}
```

### Паттерн использования

```c
// Клиентская сторона
void SendAction(int actionId)
{
    if (!ScriptInputUserData.CanStoreInputUserData())
    {
        Print("Cannot send input data right now");
        return;
    }

    ScriptInputUserData ctx = new ScriptInputUserData();
    ctx.Write(actionId);
    ctx.Send();  // Автоматически направляется на сервер
}
```

> **Примечание:** `ScriptInputUserData` имеет ограничение частоты. Всегда проверяйте `CanStoreInputUserData()` перед отправкой.

---

## Управление идентификаторами RPC

### Выбор идентификаторов RPC

Ванильный DayZ использует перечисление `ERPCs` для встроенных RPC. Пользовательские моды должны использовать идентификаторы, не конфликтующие с ванильными.

**Лучшие практики:**

```c
// Определите в уровне 3_Game (общие между клиентом и сервером)
const int MY_MOD_RPC_BASE = 87000;  // Выберите большое число, маловероятно конфликтующее
const int RPC_MY_FEATURE_A = MY_MOD_RPC_BASE + 1;
const int RPC_MY_FEATURE_B = MY_MOD_RPC_BASE + 2;
const int RPC_MY_FEATURE_C = MY_MOD_RPC_BASE + 3;
```

### Паттерн одного идентификатора движка (используется MyFramework)

Для модов с множеством типов RPC используйте один идентификатор движка и маршрутизируйте внутренне по строковому идентификатору:

```c
// Один идентификатор движка
const int MyRPC_ENGINE_ID = 83722;

// Отправка со строковой маршрутизацией
ScriptRPC rpc = new ScriptRPC();
rpc.Write("MyFeature.DoAction");  // Строковый маршрут
rpc.Write(payload);
rpc.Send(target, MyRPC_ENGINE_ID, true, recipient);

// Получение и маршрутизация
override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
{
    if (rpc_type == MyRPC_ENGINE_ID)
    {
        string route;
        if (!ctx.Read(route))
            return;

        // Маршрутизация к обработчику на основе строки
        HandleRoute(route, sender, ctx);
    }
}
```

---

## Сетевые переменные синхронизации (альтернатива RPC)

Для простой синхронизации состояния `RegisterNetSyncVariable*()` часто проще, чем RPC. См. [Главу 6.1](01-entity-system.md) для подробностей.

RPC лучше, когда:
- Нужно отправить одноразовые события (не непрерывное состояние)
- Данные не принадлежат конкретной сущности
- Нужно отправить сложные или данные переменной длины
- Нужна связь от клиента к серверу

Переменные сетевой синхронизации лучше, когда:
- У вас небольшое количество переменных сущности, меняющихся периодически
- Вы хотите автоматическую интерполяцию
- Данные естественно принадлежат сущности

---

## Вопросы безопасности

### Серверная валидация

**Никогда не доверяйте данным клиента.** Всегда валидируйте данные RPC на сервере:

```c
override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
{
    super.OnRPC(sender, rpc_type, ctx);

    if (rpc_type == RPC_PLAYER_REQUEST && GetGame().IsServer())
    {
        int requestedAmount;
        if (!ctx.Read(requestedAmount))
            return;

        // ВАЛИДАЦИЯ: ограничение допустимым диапазоном
        requestedAmount = Math.Clamp(requestedAmount, 0, 100);

        // ВАЛИДАЦИЯ: проверка, что identity отправителя совпадает с объектом игрока
        PlayerBase senderPlayer = GetPlayerBySender(sender);
        if (!senderPlayer || !senderPlayer.IsAlive())
            return;

        // Теперь обработать валидированный запрос
        ProcessRequest(senderPlayer, requestedAmount);
    }
}
```

### Ограничение частоты

Движок имеет встроенное ограничение частоты для RPC. Отправка слишком многих RPC за кадр может привести к их сбросу. Для высокочастотных данных рассмотрите:

- Использование переменных сетевой синхронизации вместо RPC
- Группировку нескольких значений в один RPC
- Ограничение частоты отправки таймером

---

## Итоги


| Концепция | Ключевой момент |
|---------|-----------|
| ScriptRPC | Основной класс RPC: `Write()` данные, затем `Send(target, id, guaranteed, recipient)` |
| OnRPC | Переопределите у целевого объекта для получения: `OnRPC(sender, rpc_type, ctx)` |
| Read/Write | `ctx.Write(value)` / `ctx.Read(value)` --- всегда проверяйте возврат Read |
| Направление | Клиент отправляет серверу; сервер отправляет конкретному клиенту или транслирует |
| Получатель | `null` = трансляция (сервер), игнорируется (клиент) |
| Гарантия | `true` = надёжная доставка, `false` = ненадёжная (быстрее) |
| Устаревший | `GetGame().RPC()` / `RPCSingleParam()` с объектами Param |
| Данные ввода | `ScriptInputUserData` для валидированного клиентского ввода |
| Идентификаторы | Используйте большие числа (87000+) во избежание конфликтов с ванилью |
| Безопасность | Всегда валидируйте данные клиента на сервере |

---

[<< Предыдущая: Файловый ввод-вывод и JSON](08-file-io.md) | **Сетевое взаимодействие и RPC** | [Следующая: Центральная экономика >>](10-central-economy.md)
