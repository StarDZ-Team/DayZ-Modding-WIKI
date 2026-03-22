# Глава 8.4: Добавление чат-команд

[Главная](../README.md) | [<< Назад: Создание панели администратора](03-admin-panel.md) | **Добавление чат-команд** | [Далее: Использование шаблона мода DayZ >>](05-mod-template.md)

---

> **Краткое описание:** В этом руководстве вы пошагово создадите систему чат-команд для DayZ. Вы подключитесь к вводу чата, научитесь разбирать префиксы команд и аргументы, проверять права администратора, выполнять действия на стороне сервера и отправлять обратную связь игроку. В итоге у вас будет работающая команда `/heal`, полностью исцеляющая персонаж администратора, а также фреймворк для добавления новых команд.

---

## Содержание


- [Что мы создаём](#что-мы-создаём)
- [Предварительные требования](#предварительные-требования)
- [Обзор архитектуры](#обзор-архитектуры)
- [Шаг 1: Перехват ввода чата](#шаг-1-перехват-ввода-чата)
- [Шаг 2: Разбор префикса команды и аргументов](#шаг-2-разбор-префикса-команды-и-аргументов)
- [Шаг 3: Проверка прав администратора](#шаг-3-проверка-прав-администратора)
- [Шаг 4: Выполнение действия на стороне сервера](#шаг-4-выполнение-действия-на-стороне-сервера)
- [Шаг 5: Отправка обратной связи администратору](#шаг-5-отправка-обратной-связи-администратору)
- [Шаг 6: Регистрация команд](#шаг-6-регистрация-команд)
- [Шаг 7: Добавление в список команд админ-панели](#шаг-7-добавление-в-список-команд-админ-панели)
- [Полный рабочий код: команда /heal](#полный-рабочий-код-команда-heal)
- [Добавление новых команд](#добавление-новых-команд)
- [Устранение неполадок](#устранение-неполадок)
- [Следующие шаги](#следующие-шаги)

---

## Что мы создаём

Система чат-команд с:

- **`/heal`** -- Полностью исцеляет персонаж администратора (здоровье, кровь, шок, голод, жажда)
- **`/heal PlayerName`** -- Исцеляет конкретного игрока по имени
- Переиспользуемый фреймворк для добавления `/kill`, `/teleport`, `/time`, `/weather` и любых других команд
- Проверка прав администратора, чтобы обычные игроки не могли использовать админ-команды
- Выполнение на стороне сервера с сообщениями обратной связи в чате

---

## Предварительные требования

- Работающая структура мода (сначала пройдите [Главу 8.1](01-first-mod.md))
- Понимание [паттерна клиент-серверного RPC](03-admin-panel.md) из Главы 8.3

### Структура мода для этого руководства

```
ChatCommands/
    mod.cpp
    Scripts/
        config.cpp
        3_Game/
            ChatCommands/
                CCmdRPC.c
                CCmdBase.c
                CCmdRegistry.c
        4_World/
            ChatCommands/
                CCmdServerHandler.c
                commands/
                    CCmdHeal.c
        5_Mission/
            ChatCommands/
                CCmdChatHook.c
```

---

## Обзор архитектуры

Чат-команды следуют такому потоку:

```
КЛИЕНТ                                  СЕРВЕР
------                                  ------

1. Админ вводит "/heal" в чат
2. Хук чата перехватывает сообщение
   (предотвращает отправку как обычный чат)
3. Клиент отправляет команду через RPC  ---->  4. Сервер получает RPC
                                            Проверяет права администратора
                                            Ищет обработчик команды
                                            Выполняет команду
                                        5. Сервер отправляет обратную связь  ---->  КЛИЕНТ
                                            (RPC с сообщением в чат)
                                                                     6. Админ видит
                                                                        обратную связь в чате
```

**Почему команды обрабатываются на сервере?** Потому что сервер обладает авторитетом над состоянием игры. Только сервер может надёжно исцелять игроков, менять погоду, телепортировать персонажей и изменять состояние мира. Роль клиента ограничена обнаружением команды и её пересылкой.

---

## Шаг 1: Перехват ввода чата

Нам нужно перехватывать сообщения чата до того, как они будут отправлены как обычный чат. DayZ предоставляет для этого класс `ChatInputMenu`.

### Подход с перехватом чата

Мы модифицируем класс `MissionGameplay` для перехвата событий ввода чата. Когда игрок отправляет сообщение чата, начинающееся с `/`, мы перехватываем его, предотвращаем отправку как обычного чата и вместо этого отправляем его как RPC команды на сервер.

### Создайте `Scripts/5_Mission/ChatCommands/CCmdChatHook.c`

```c
modded class MissionGameplay
{
    // -------------------------------------------------------
    // Перехват сообщений чата, начинающихся с /
    // -------------------------------------------------------
    override void OnEvent(EventType eventTypeId, Param params)
    {
        super.OnEvent(eventTypeId, params);

        // ChatMessageEventTypeID срабатывает, когда игрок отправляет сообщение в чат
        if (eventTypeId == ChatMessageEventTypeID)
        {
            Param3<int, string, string> chatParams;
            if (Class.CastTo(chatParams, params))
            {
                string message = chatParams.param3;

                // Проверяем, начинается ли с /
                if (message.Length() > 0 && message.Substring(0, 1) == "/")
                {
                    // Это команда -- отправляем на сервер
                    SendChatCommand(message);
                }
            }
        }
    }

    // -------------------------------------------------------
    // Отправка строки команды на сервер через RPC
    // -------------------------------------------------------
    protected void SendChatCommand(string fullCommand)
    {
        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        Print("[ChatCommands] Sending command to server: " + fullCommand);

        Param1<string> data = new Param1<string>(fullCommand);
        GetGame().RPCSingleParam(player, CCmdRPC.COMMAND_REQUEST, data, true);
    }

    // -------------------------------------------------------
    // Получение обратной связи от сервера
    // -------------------------------------------------------
    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
        {
            Param2<string, string> data = new Param2<string, string>("", "");
            if (ctx.Read(data))
            {
                string prefix = data.param1;
                string message = data.param2;

                // Отображение обратной связи как системного сообщения в чате
                GetGame().Chat(prefix + " " + message, "colorStatusChannel");

                Print("[ChatCommands] Feedback: " + prefix + " " + message);
            }
        }
    }
};
```

### Как работает перехват чата

Метод `OnEvent` класса `MissionGameplay` вызывается для различных игровых событий. Когда `eventTypeId` равен `ChatMessageEventTypeID`, это означает, что игрок только что отправил сообщение в чат. `Param3` содержит:

- `param1` -- Канал (int): канал чата (глобальный, прямой и т.д.)
- `param2` -- Имя отправителя (string)
- `param3` -- Текст сообщения (string)

Мы проверяем, начинается ли сообщение с `/`. Если да, мы пересылаем всю строку на сервер через RPC. Сообщение также отправляется как обычный чат -- в продакшн-моде вы бы подавили его (это рассмотрено в примечаниях в конце).

---

## Шаг 2: Разбор префикса команды и аргументов

На стороне сервера нам нужно разбить строку команды вида `/heal PlayerName` на составные части: имя команды (`heal`) и аргументы (`["PlayerName"]`).

### Создайте `Scripts/3_Game/ChatCommands/CCmdRPC.c`

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST  = 79001;
    static const int COMMAND_FEEDBACK = 79002;
};
```

### Создайте `Scripts/3_Game/ChatCommands/CCmdBase.c`

```c
// -------------------------------------------------------
// Базовый класс для всех чат-команд
// -------------------------------------------------------
class CCmdBase
{
    // Имя команды без префикса / (например, "heal")
    string GetName()
    {
        return "";
    }

    // Краткое описание, отображаемое в справке или списке команд
    string GetDescription()
    {
        return "";
    }

    // Синтаксис использования, отображаемый при неправильном использовании команды
    string GetUsage()
    {
        return "/" + GetName();
    }

    // Требует ли эта команда привилегий администратора
    bool RequiresAdmin()
    {
        return true;
    }

    // Выполнение команды на сервере
    // Возвращает true при успехе, false при неудаче
    bool Execute(PlayerIdentity caller, array<string> args)
    {
        return false;
    }

    // -------------------------------------------------------
    // Помощник: Отправка сообщения обратной связи вызвавшему команду
    // -------------------------------------------------------
    protected void SendFeedback(PlayerIdentity caller, string prefix, string message)
    {
        if (!caller)
            return;

        // Находим объект игрока вызвавшего
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        Man callerPlayer = null;
        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == caller.GetId())
                {
                    callerPlayer = candidate;
                    break;
                }
            }
        }

        if (callerPlayer)
        {
            Param2<string, string> data = new Param2<string, string>(prefix, message);
            GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
        }
    }

    // -------------------------------------------------------
    // Помощник: Поиск игрока по частичному совпадению имени
    // -------------------------------------------------------
    protected Man FindPlayerByName(string partialName)
    {
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        string searchLower = partialName;
        searchLower.ToLower();

        for (int i = 0; i < players.Count(); i++)
        {
            Man man = players.Get(i);
            if (man && man.GetIdentity())
            {
                string playerName = man.GetIdentity().GetName();
                string playerNameLower = playerName;
                playerNameLower.ToLower();

                if (playerNameLower.Contains(searchLower))
                    return man;
            }
        }

        return null;
    }
};
```

### Создайте `Scripts/3_Game/ChatCommands/CCmdRegistry.c`

```c
// -------------------------------------------------------
// Реестр, содержащий все доступные команды
// -------------------------------------------------------
class CCmdRegistry
{
    protected static ref map<string, ref CCmdBase> s_Commands;

    // -------------------------------------------------------
    // Инициализация реестра (вызывается один раз при запуске)
    // -------------------------------------------------------
    static void Init()
    {
        if (!s_Commands)
            s_Commands = new map<string, ref CCmdBase>;
    }

    // -------------------------------------------------------
    // Регистрация экземпляра команды
    // -------------------------------------------------------
    static void Register(CCmdBase command)
    {
        if (!s_Commands)
            Init();

        if (!command)
            return;

        string name = command.GetName();
        name.ToLower();

        if (s_Commands.Contains(name))
        {
            Print("[ChatCommands] WARNING: Command '" + name + "' already registered, overwriting.");
        }

        s_Commands.Set(name, command);
        Print("[ChatCommands] Registered command: /" + name);
    }

    // -------------------------------------------------------
    // Поиск команды по имени
    // -------------------------------------------------------
    static CCmdBase GetCommand(string name)
    {
        if (!s_Commands)
            return null;

        string nameLower = name;
        nameLower.ToLower();

        CCmdBase cmd;
        if (s_Commands.Find(nameLower, cmd))
            return cmd;

        return null;
    }

    // -------------------------------------------------------
    // Получение всех зарегистрированных имён команд
    // -------------------------------------------------------
    static array<string> GetCommandNames()
    {
        ref array<string> names = new array<string>;

        if (s_Commands)
        {
            for (int i = 0; i < s_Commands.Count(); i++)
            {
                names.Insert(s_Commands.GetKey(i));
            }
        }

        return names;
    }

    // -------------------------------------------------------
    // Разбор сырой строки команды в имя + аргументы
    // Пример: "/heal PlayerName" --> name="heal", args=["PlayerName"]
    // -------------------------------------------------------
    static void ParseCommand(string fullCommand, out string commandName, out array<string> args)
    {
        args = new array<string>;
        commandName = "";

        if (fullCommand.Length() == 0)
            return;

        // Удаляем начальный /
        string raw = fullCommand;
        if (raw.Substring(0, 1) == "/")
            raw = raw.Substring(1, raw.Length() - 1);

        // Разделяем по пробелам
        raw.Split(" ", args);

        if (args.Count() > 0)
        {
            commandName = args.Get(0);
            commandName.ToLower();
            args.RemoveOrdered(0);
        }
    }
};
```

### Объяснение логики разбора

Для ввода `/heal SomePlayer` метод `ParseCommand` выполняет следующее:

1. Удаляет начальный `/`, получая `"heal SomePlayer"`
2. Разделяет по пробелам, получая `["heal", "SomePlayer"]`
3. Берёт первый элемент как имя команды: `"heal"`
4. Удаляет его из массива, оставляя аргументы: `["SomePlayer"]`

Имя команды преобразуется в нижний регистр, поэтому `/Heal`, `/HEAL` и `/heal` работают одинаково.

---

## Шаг 3: Проверка прав администратора

Проверка прав администратора предотвращает выполнение админ-команд обычными игроками. DayZ не имеет встроенной системы прав администратора в скриптах, поэтому мы проверяем по простому списку администраторов.

### Проверка администратора в серверном обработчике

Простейший подход -- проверить Steam64 ID игрока по списку известных ID администраторов. В продакшн-моде вы бы загружали этот список из конфигурационного файла.

```c
// Простая проверка администратора -- в продакшне загружайте из JSON-файла конфигурации
static bool IsAdmin(PlayerIdentity identity)
{
    if (!identity)
        return false;

    // Проверяем простой ID игрока (Steam64 ID)
    string playerId = identity.GetPlainId();

    // Жёстко заданный список администраторов -- замените на загрузку из файла конфигурации в продакшне
    ref array<string> adminIds = new array<string>;
    adminIds.Insert("76561198000000001");    // Замените на реальные Steam64 ID
    adminIds.Insert("76561198000000002");

    return (adminIds.Find(playerId) != -1);
}
```

### Где найти Steam64 ID

- Откройте свой профиль Steam в браузере
- URL содержит ваш Steam64 ID: `https://steamcommunity.com/profiles/76561198XXXXXXXXX`
- Или используйте инструмент вроде https://steamid.io для поиска любого игрока

### Права промышленного уровня

В реальном моде вы бы:

1. Хранили ID администраторов в JSON-файле (`$profile:ChatCommands/admins.json`)
2. Загружали файл при запуске сервера
3. Поддерживали уровни прав (модератор, администратор, суперадминистратор)
4. Использовали фреймворк с иерархической системой прав

---

## Шаг 4: Выполнение действия на стороне сервера

Теперь мы создадим саму команду `/heal` и серверный обработчик, который обрабатывает входящие RPC команд.

### Создайте `Scripts/4_World/ChatCommands/commands/CCmdHeal.c`

```c
class CCmdHeal extends CCmdBase
{
    override string GetName()
    {
        return "heal";
    }

    override string GetDescription()
    {
        return "Fully heals a player (health, blood, shock, hunger, thirst)";
    }

    override string GetUsage()
    {
        return "/heal [PlayerName]";
    }

    override bool RequiresAdmin()
    {
        return true;
    }

    // -------------------------------------------------------
    // Выполнение команды исцеления
    // /heal         --> исцеляет вызвавшего
    // /heal Name    --> исцеляет названного игрока
    // -------------------------------------------------------
    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (!caller)
            return false;

        Man targetMan = null;
        string targetName = "";

        // Определяем целевого игрока
        if (args.Count() > 0)
        {
            // Исцеление конкретного игрока по имени
            string searchName = args.Get(0);
            targetMan = FindPlayerByName(searchName);

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Player '" + searchName + "' not found.");
                return false;
            }

            targetName = targetMan.GetIdentity().GetName();
        }
        else
        {
            // Исцеление самого вызвавшего
            ref array<Man> allPlayers = new array<Man>;
            GetGame().GetPlayers(allPlayers);

            for (int i = 0; i < allPlayers.Count(); i++)
            {
                Man candidate = allPlayers.Get(i);
                if (candidate && candidate.GetIdentity())
                {
                    if (candidate.GetIdentity().GetId() == caller.GetId())
                    {
                        targetMan = candidate;
                        break;
                    }
                }
            }

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Could not find your player object.");
                return false;
            }

            targetName = "yourself";
        }

        // Выполняем исцеление
        PlayerBase targetPlayer;
        if (!Class.CastTo(targetPlayer, targetMan))
        {
            SendFeedback(caller, "[Heal]", "Target is not a valid player.");
            return false;
        }

        HealPlayer(targetPlayer);

        // Логирование и отправка обратной связи
        Print("[ChatCommands] " + caller.GetName() + " healed " + targetName);
        SendFeedback(caller, "[Heal]", "Successfully healed " + targetName + ".");

        return true;
    }

    // -------------------------------------------------------
    // Применение полного исцеления к игроку
    // -------------------------------------------------------
    protected void HealPlayer(PlayerBase player)
    {
        if (!player)
            return;

        // Восстановление здоровья до максимума
        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));

        // Восстановление крови до максимума
        player.SetHealth("GlobalHealth", "Blood", player.GetMaxHealth("GlobalHealth", "Blood"));

        // Снятие шокового урона
        player.SetHealth("GlobalHealth", "Shock", player.GetMaxHealth("GlobalHealth", "Shock"));

        // Установка голода на максимум (значение энергии)
        // PlayerBase имеет систему статов -- устанавливаем стат энергии
        player.GetStatEnergy().Set(player.GetStatEnergy().GetMax());

        // Установка жажды на максимум (значение воды)
        player.GetStatWater().Set(player.GetStatWater().GetMax());

        // Очистка всех источников кровотечения
        player.GetBleedingManagerServer().RemoveAllSources();

        Print("[ChatCommands] Healed player: " + player.GetIdentity().GetName());
    }
};
```

### Почему 4_World?

Команда исцеления ссылается на `PlayerBase`, который определён в слое `4_World`. Она также использует методы статов игрока (`GetStatEnergy`, `GetStatWater`, `GetBleedingManagerServer`), которые доступны только для мировых сущностей. Команда **обязана** находиться в `4_World` или выше.

Базовый класс `CCmdBase` находится в `3_Game`, потому что не ссылается на типы мира. Конкретные классы команд, работающие с мировыми сущностями, находятся в `4_World`.

---

## Шаг 5: Отправка обратной связи администратору

Обратная связь обрабатывается методом `SendFeedback()` в `CCmdBase`. Давайте проследим полный путь обратной связи:

### Сервер отправляет обратную связь

```c
// Внутри CCmdBase.SendFeedback()
Param2<string, string> data = new Param2<string, string>(prefix, message);
GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
```

Сервер отправляет RPC `COMMAND_FEEDBACK` конкретному клиенту, который выполнил команду. Данные содержат префикс (например, `"[Heal]"`) и текст сообщения.

### Клиент получает и отображает обратную связь

В `CCmdChatHook.c` (Шаг 1) обработчик `OnRPC` перехватывает это:

```c
if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
{
    // Десериализация сообщения
    Param2<string, string> data = new Param2<string, string>("", "");
    if (ctx.Read(data))
    {
        string prefix = data.param1;
        string message = data.param2;

        // Отображение в окне чата
        GetGame().Chat(prefix + " " + message, "colorStatusChannel");
    }
}
```

`GetGame().Chat()` отображает сообщение в окне чата игрока. Второй параметр -- это цветовой канал:

| Канал | Цвет | Типичное использование |
|-------|------|----------------------|
| `"colorStatusChannel"` | Жёлтый/оранжевый | Системные сообщения |
| `"colorAction"` | Белый | Обратная связь по действиям |
| `"colorFriendly"` | Зелёный | Положительная обратная связь |
| `"colorImportant"` | Красный | Предупреждения/ошибки |

---

## Шаг 6: Регистрация команд

Серверный обработчик получает RPC команд, ищет команду в реестре и выполняет её.

### Создайте `Scripts/4_World/ChatCommands/CCmdServerHandler.c`

```c
modded class MissionServer
{
    // -------------------------------------------------------
    // Регистрация всех команд при запуске сервера
    // -------------------------------------------------------
    override void OnInit()
    {
        super.OnInit();

        CCmdRegistry.Init();

        // Регистрируем все команды здесь
        CCmdRegistry.Register(new CCmdHeal());

        // Добавьте больше команд:
        // CCmdRegistry.Register(new CCmdKill());
        // CCmdRegistry.Register(new CCmdTeleport());
        // CCmdRegistry.Register(new CCmdTime());

        Print("[ChatCommands] Server initialized. Commands registered.");
    }
};

// -------------------------------------------------------
// Серверный обработчик RPC для входящих команд
// -------------------------------------------------------
modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == CCmdRPC.COMMAND_REQUEST)
        {
            HandleCommandRPC(sender, ctx);
        }
    }

    protected void HandleCommandRPC(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender)
            return;

        // Чтение строки команды
        Param1<string> data = new Param1<string>("");
        if (!ctx.Read(data))
        {
            Print("[ChatCommands] ERROR: Failed to read command RPC data.");
            return;
        }

        string fullCommand = data.param1;
        Print("[ChatCommands] Received command from " + sender.GetName() + ": " + fullCommand);

        // Разбор команды
        string commandName;
        ref array<string> args;
        CCmdRegistry.ParseCommand(fullCommand, commandName, args);

        if (commandName == "")
            return;

        // Поиск команды
        CCmdBase command = CCmdRegistry.GetCommand(commandName);
        if (!command)
        {
            SendCommandFeedback(sender, "[Error]", "Unknown command: /" + commandName);
            return;
        }

        // Проверка прав администратора
        if (command.RequiresAdmin() && !IsCommandAdmin(sender))
        {
            Print("[ChatCommands] Non-admin " + sender.GetName() + " tried to use /" + commandName);
            SendCommandFeedback(sender, "[Error]", "You do not have permission to use this command.");
            return;
        }

        // Выполнение команды
        bool success = command.Execute(sender, args);

        if (success)
            Print("[ChatCommands] Command /" + commandName + " executed successfully by " + sender.GetName());
        else
            Print("[ChatCommands] Command /" + commandName + " failed for " + sender.GetName());
    }

    // -------------------------------------------------------
    // Проверка, является ли игрок администратором
    // -------------------------------------------------------
    protected bool IsCommandAdmin(PlayerIdentity identity)
    {
        if (!identity)
            return false;

        string playerId = identity.GetPlainId();

        // ----------------------------------------------------------
        // ВАЖНО: Замените на ваши реальные Steam64 ID администраторов
        // В продакшне загружайте из JSON-файла конфигурации
        // ----------------------------------------------------------
        ref array<string> adminIds = new array<string>;
        adminIds.Insert("76561198000000001");
        adminIds.Insert("76561198000000002");

        return (adminIds.Find(playerId) != -1);
    }

    // -------------------------------------------------------
    // Отправка обратной связи конкретному игроку
    // -------------------------------------------------------
    protected void SendCommandFeedback(PlayerIdentity target, string prefix, string message)
    {
        if (!target)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == target.GetId())
                {
                    Param2<string, string> data = new Param2<string, string>(prefix, message);
                    GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_FEEDBACK, data, true, target);
                    return;
                }
            }
        }
    }
};
```

### Паттерн регистрации

Команды регистрируются в `MissionServer.OnInit()`:

```c
CCmdRegistry.Init();
CCmdRegistry.Register(new CCmdHeal());
```

Каждый вызов `Register()` создаёт экземпляр класса команды и сохраняет его в карте, индексированной по имени команды. Когда приходит RPC команды, обработчик ищет имя в реестре и вызывает `Execute()` на соответствующем объекте команды.

Этот паттерн делает добавление новых команд тривиальным -- создайте новый класс, расширяющий `CCmdBase`, реализуйте `Execute()` и добавьте одну строку `Register()`.

---

## Шаг 7: Добавление в список команд админ-панели

Если у вас есть админ-панель (из [Главы 8.3](03-admin-panel.md)), вы можете отобразить список доступных команд в интерфейсе.

### Запрос списка команд с сервера

Добавьте новый ID RPC в `CCmdRPC.c`:

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST   = 79001;
    static const int COMMAND_FEEDBACK  = 79002;
    static const int COMMAND_LIST_REQ  = 79003;
    static const int COMMAND_LIST_RESP = 79004;
};
```

### Серверная сторона: Отправка списка команд

Добавьте этот обработчик в серверный код:

```c
// В серверном обработчике добавьте случай для COMMAND_LIST_REQ
if (rpc_type == CCmdRPC.COMMAND_LIST_REQ)
{
    HandleCommandListRequest(sender);
}

protected void HandleCommandListRequest(PlayerIdentity requestor)
{
    if (!requestor)
        return;

    // Формируем строку со списком всех команд
    array<string> names = CCmdRegistry.GetCommandNames();
    string commandList = "Available Commands:\n";

    for (int i = 0; i < names.Count(); i++)
    {
        CCmdBase cmd = CCmdRegistry.GetCommand(names.Get(i));
        if (cmd)
        {
            commandList = commandList + cmd.GetUsage() + " - " + cmd.GetDescription() + "\n";
        }
    }

    // Отправляем обратно клиенту
    ref array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);

    for (int j = 0; j < players.Count(); j++)
    {
        Man candidate = players.Get(j);
        if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == requestor.GetId())
        {
            Param1<string> data = new Param1<string>(commandList);
            GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_LIST_RESP, data, true, requestor);
            return;
        }
    }
}
```

### Клиентская сторона: Отображение в панели

На клиенте перехватите ответ и отобразите его в текстовом виджете:

```c
if (rpc_type == CCmdRPC.COMMAND_LIST_RESP)
{
    Param1<string> data = new Param1<string>("");
    if (ctx.Read(data))
    {
        string commandList = data.param1;
        // Отображение в текстовом виджете админ-панели
        // m_CommandListText.SetText(commandList);
        Print("[ChatCommands] Command list received:\n" + commandList);
    }
}
```

---

## Полный рабочий код: команда /heal

Ниже приведены все файлы, необходимые для полной рабочей системы. Создайте эти файлы, и ваш мод получит функциональную команду `/heal`.

### Настройка config.cpp

```cpp
class CfgPatches
{
    class ChatCommands_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Scripts"
        };
    };
};

class CfgMods
{
    class ChatCommands
    {
        dir = "ChatCommands";
        name = "Chat Commands";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "ChatCommands/Scripts/5_Mission" };
            };
        };
    };
};
```

### 3_Game/ChatCommands/CCmdRPC.c

```c
class CCmdRPC
{
    static const int COMMAND_REQUEST  = 79001;
    static const int COMMAND_FEEDBACK = 79002;
};
```

### 3_Game/ChatCommands/CCmdBase.c

```c
class CCmdBase
{
    string GetName()
    {
        return "";
    }

    string GetDescription()
    {
        return "";
    }

    string GetUsage()
    {
        return "/" + GetName();
    }

    bool RequiresAdmin()
    {
        return true;
    }

    bool Execute(PlayerIdentity caller, array<string> args)
    {
        return false;
    }

    protected void SendFeedback(PlayerIdentity caller, string prefix, string message)
    {
        if (!caller)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        Man callerPlayer = null;
        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity())
            {
                if (candidate.GetIdentity().GetId() == caller.GetId())
                {
                    callerPlayer = candidate;
                    break;
                }
            }
        }

        if (callerPlayer)
        {
            Param2<string, string> data = new Param2<string, string>(prefix, message);
            GetGame().RPCSingleParam(callerPlayer, CCmdRPC.COMMAND_FEEDBACK, data, true, caller);
        }
    }

    protected Man FindPlayerByName(string partialName)
    {
        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        string searchLower = partialName;
        searchLower.ToLower();

        for (int i = 0; i < players.Count(); i++)
        {
            Man man = players.Get(i);
            if (man && man.GetIdentity())
            {
                string playerName = man.GetIdentity().GetName();
                string playerNameLower = playerName;
                playerNameLower.ToLower();

                if (playerNameLower.Contains(searchLower))
                    return man;
            }
        }

        return null;
    }
};
```

### 3_Game/ChatCommands/CCmdRegistry.c

```c
class CCmdRegistry
{
    protected static ref map<string, ref CCmdBase> s_Commands;

    static void Init()
    {
        if (!s_Commands)
            s_Commands = new map<string, ref CCmdBase>;
    }

    static void Register(CCmdBase command)
    {
        if (!s_Commands)
            Init();

        if (!command)
            return;

        string name = command.GetName();
        name.ToLower();

        s_Commands.Set(name, command);
        Print("[ChatCommands] Registered command: /" + name);
    }

    static CCmdBase GetCommand(string name)
    {
        if (!s_Commands)
            return null;

        string nameLower = name;
        nameLower.ToLower();

        CCmdBase cmd;
        if (s_Commands.Find(nameLower, cmd))
            return cmd;

        return null;
    }

    static array<string> GetCommandNames()
    {
        ref array<string> names = new array<string>;

        if (s_Commands)
        {
            for (int i = 0; i < s_Commands.Count(); i++)
            {
                names.Insert(s_Commands.GetKey(i));
            }
        }

        return names;
    }

    static void ParseCommand(string fullCommand, out string commandName, out array<string> args)
    {
        args = new array<string>;
        commandName = "";

        if (fullCommand.Length() == 0)
            return;

        string raw = fullCommand;
        if (raw.Substring(0, 1) == "/")
            raw = raw.Substring(1, raw.Length() - 1);

        raw.Split(" ", args);

        if (args.Count() > 0)
        {
            commandName = args.Get(0);
            commandName.ToLower();
            args.RemoveOrdered(0);
        }
    }
};
```

### 4_World/ChatCommands/commands/CCmdHeal.c

```c
class CCmdHeal extends CCmdBase
{
    override string GetName()
    {
        return "heal";
    }

    override string GetDescription()
    {
        return "Fully heals a player (health, blood, shock, hunger, thirst)";
    }

    override string GetUsage()
    {
        return "/heal [PlayerName]";
    }

    override bool RequiresAdmin()
    {
        return true;
    }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (!caller)
            return false;

        Man targetMan = null;
        string targetName = "";

        if (args.Count() > 0)
        {
            string searchName = args.Get(0);
            targetMan = FindPlayerByName(searchName);

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Player '" + searchName + "' not found.");
                return false;
            }

            targetName = targetMan.GetIdentity().GetName();
        }
        else
        {
            ref array<Man> allPlayers = new array<Man>;
            GetGame().GetPlayers(allPlayers);

            for (int i = 0; i < allPlayers.Count(); i++)
            {
                Man candidate = allPlayers.Get(i);
                if (candidate && candidate.GetIdentity())
                {
                    if (candidate.GetIdentity().GetId() == caller.GetId())
                    {
                        targetMan = candidate;
                        break;
                    }
                }
            }

            if (!targetMan)
            {
                SendFeedback(caller, "[Heal]", "Could not find your player object.");
                return false;
            }

            targetName = "yourself";
        }

        PlayerBase targetPlayer;
        if (!Class.CastTo(targetPlayer, targetMan))
        {
            SendFeedback(caller, "[Heal]", "Target is not a valid player.");
            return false;
        }

        HealPlayer(targetPlayer);

        Print("[ChatCommands] " + caller.GetName() + " healed " + targetName);
        SendFeedback(caller, "[Heal]", "Successfully healed " + targetName + ".");

        return true;
    }

    protected void HealPlayer(PlayerBase player)
    {
        if (!player)
            return;

        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));
        player.SetHealth("GlobalHealth", "Blood", player.GetMaxHealth("GlobalHealth", "Blood"));
        player.SetHealth("GlobalHealth", "Shock", player.GetMaxHealth("GlobalHealth", "Shock"));

        player.GetStatEnergy().Set(player.GetStatEnergy().GetMax());
        player.GetStatWater().Set(player.GetStatWater().GetMax());

        player.GetBleedingManagerServer().RemoveAllSources();
    }
};
```

### 4_World/ChatCommands/CCmdServerHandler.c

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();

        CCmdRegistry.Init();
        CCmdRegistry.Register(new CCmdHeal());

        Print("[ChatCommands] Server initialized. Commands registered.");
    }
};

modded class PlayerBase
{
    override void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == CCmdRPC.COMMAND_REQUEST)
        {
            HandleCommandRPC(sender, ctx);
        }
    }

    protected void HandleCommandRPC(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender)
            return;

        Param1<string> data = new Param1<string>("");
        if (!ctx.Read(data))
        {
            Print("[ChatCommands] ERROR: Failed to read command RPC data.");
            return;
        }

        string fullCommand = data.param1;
        Print("[ChatCommands] Received command from " + sender.GetName() + ": " + fullCommand);

        string commandName;
        ref array<string> args;
        CCmdRegistry.ParseCommand(fullCommand, commandName, args);

        if (commandName == "")
            return;

        CCmdBase command = CCmdRegistry.GetCommand(commandName);
        if (!command)
        {
            SendCommandFeedback(sender, "[Error]", "Unknown command: /" + commandName);
            return;
        }

        if (command.RequiresAdmin() && !IsCommandAdmin(sender))
        {
            Print("[ChatCommands] Non-admin " + sender.GetName() + " tried to use /" + commandName);
            SendCommandFeedback(sender, "[Error]", "You do not have permission to use this command.");
            return;
        }

        command.Execute(sender, args);
    }

    protected bool IsCommandAdmin(PlayerIdentity identity)
    {
        if (!identity)
            return false;

        string playerId = identity.GetPlainId();

        // ЗАМЕНИТЕ НА ВАШИ РЕАЛЬНЫЕ STEAM64 ID АДМИНИСТРАТОРОВ
        ref array<string> adminIds = new array<string>;
        adminIds.Insert("76561198000000001");
        adminIds.Insert("76561198000000002");

        return (adminIds.Find(playerId) != -1);
    }

    protected void SendCommandFeedback(PlayerIdentity target, string prefix, string message)
    {
        if (!target)
            return;

        ref array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);

        for (int i = 0; i < players.Count(); i++)
        {
            Man candidate = players.Get(i);
            if (candidate && candidate.GetIdentity() && candidate.GetIdentity().GetId() == target.GetId())
            {
                Param2<string, string> data = new Param2<string, string>(prefix, message);
                GetGame().RPCSingleParam(candidate, CCmdRPC.COMMAND_FEEDBACK, data, true, target);
                return;
            }
        }
    }
};
```

### 5_Mission/ChatCommands/CCmdChatHook.c

```c
modded class MissionGameplay
{
    override void OnEvent(EventType eventTypeId, Param params)
    {
        super.OnEvent(eventTypeId, params);

        if (eventTypeId == ChatMessageEventTypeID)
        {
            Param3<int, string, string> chatParams;
            if (Class.CastTo(chatParams, params))
            {
                string message = chatParams.param3;

                if (message.Length() > 0 && message.Substring(0, 1) == "/")
                {
                    SendChatCommand(message);
                }
            }
        }
    }

    protected void SendChatCommand(string fullCommand)
    {
        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        Print("[ChatCommands] Sending command to server: " + fullCommand);

        Param1<string> data = new Param1<string>(fullCommand);
        GetGame().RPCSingleParam(player, CCmdRPC.COMMAND_REQUEST, data, true);
    }

    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        if (rpc_type == CCmdRPC.COMMAND_FEEDBACK)
        {
            Param2<string, string> data = new Param2<string, string>("", "");
            if (ctx.Read(data))
            {
                string prefix = data.param1;
                string message = data.param2;

                GetGame().Chat(prefix + " " + message, "colorStatusChannel");
                Print("[ChatCommands] Feedback: " + prefix + " " + message);
            }
        }
    }
};
```

---

## Добавление новых команд

Паттерн реестра делает добавление новых команд простым. Вот примеры:

### Команда /kill

```c
class CCmdKill extends CCmdBase
{
    override string GetName()        { return "kill"; }
    override string GetDescription() { return "Kills a player"; }
    override string GetUsage()       { return "/kill [PlayerName]"; }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        Man targetMan = null;

        if (args.Count() > 0)
            targetMan = FindPlayerByName(args.Get(0));
        else
        {
            ref array<Man> players = new array<Man>;
            GetGame().GetPlayers(players);
            for (int i = 0; i < players.Count(); i++)
            {
                if (players.Get(i).GetIdentity() && players.Get(i).GetIdentity().GetId() == caller.GetId())
                {
                    targetMan = players.Get(i);
                    break;
                }
            }
        }

        if (!targetMan)
        {
            SendFeedback(caller, "[Kill]", "Player not found.");
            return false;
        }

        PlayerBase targetPlayer;
        if (Class.CastTo(targetPlayer, targetMan))
        {
            targetPlayer.SetHealth("GlobalHealth", "Health", 0);
            SendFeedback(caller, "[Kill]", "Killed " + targetMan.GetIdentity().GetName() + ".");
            return true;
        }

        return false;
    }
};
```

### Команда /time

```c
class CCmdTime extends CCmdBase
{
    override string GetName()        { return "time"; }
    override string GetDescription() { return "Sets the server time (0-23)"; }
    override string GetUsage()       { return "/time <hour>"; }

    override bool Execute(PlayerIdentity caller, array<string> args)
    {
        if (args.Count() < 1)
        {
            SendFeedback(caller, "[Time]", "Usage: " + GetUsage());
            return false;
        }

        int hour = args.Get(0).ToInt();
        if (hour < 0 || hour > 23)
        {
            SendFeedback(caller, "[Time]", "Hour must be between 0 and 23.");
            return false;
        }

        GetGame().GetWorld().SetDate(2024, 6, 15, hour, 0);
        SendFeedback(caller, "[Time]", "Server time set to " + hour.ToString() + ":00.");
        return true;
    }
};
```

### Регистрация новых команд

Добавьте одну строку на команду в `MissionServer.OnInit()`:

```c
CCmdRegistry.Register(new CCmdHeal());
CCmdRegistry.Register(new CCmdKill());
CCmdRegistry.Register(new CCmdTime());
```

---

## Устранение неполадок

### Команда не распознаётся ("Unknown command")

- **Отсутствует регистрация:** Убедитесь, что `CCmdRegistry.Register(new CCmdYourCommand())` вызывается в `MissionServer.OnInit()`.
- **Опечатка в GetName():** Строка, возвращаемая `GetName()`, должна совпадать с тем, что вводит игрок (без `/`).
- **Несовпадение регистра:** Реестр преобразует имена в нижний регистр. `/Heal`, `/HEAL` и `/heal` должны работать одинаково.

### Отказ в доступе для администраторов

- **Неправильный Steam64 ID:** Перепроверьте ID администраторов в `IsCommandAdmin()`. Они должны быть точными Steam64 ID (17-значные числа, начинающиеся с `7656`).
- **GetPlainId() vs GetId():** `GetPlainId()` возвращает Steam64 ID. `GetId()` возвращает ID сессии DayZ. Используйте `GetPlainId()` для проверок администратора.

### Сообщение обратной связи не появляется в чате

- **RPC не доходит до клиента:** Добавьте операторы `Print()` на сервере для подтверждения отправки RPC обратной связи.
- **Клиентский OnRPC не перехватывает:** Убедитесь, что ID RPC совпадает (`CCmdRPC.COMMAND_FEEDBACK`).
- **GetGame().Chat() не работает:** Эта функция требует, чтобы игра находилась в состоянии, когда чат доступен. На экране загрузки она может не работать.

### /heal не исцеляет

- **Выполнение только на сервере:** `SetHealth()` и изменения статов должны выполняться на сервере. Убедитесь, что `GetGame().IsServer()` возвращает true при вызове `Execute()`.
- **Приведение к PlayerBase не удаётся:** Если `Class.CastTo(targetPlayer, targetMan)` возвращает false, цель не является валидным PlayerBase. Это может случиться с ИИ или неигровыми сущностями.
- **Геттеры статов возвращают null:** `GetStatEnergy()` и `GetStatWater()` могут возвращать null, если игрок мёртв или не полностью инициализирован. Добавьте проверки на null в продакшн-коде.

### Команда отображается в чате как обычное сообщение

- Хук `OnEvent` перехватывает сообщение, но не подавляет его отправку как обычного чата. Чтобы подавить его в продакшн-моде, необходимо модифицировать класс `ChatInputMenu` для фильтрации сообщений с `/` перед отправкой:

```c
modded class ChatInputMenu
{
    override void OnChatInputSend()
    {
        string text = "";
        // Получить текущий текст из виджета ввода
        // Если начинается с /, НЕ вызывать super (который отправляет как чат)
        // Вместо этого обработать как команду

        // Этот подход зависит от версии DayZ -- проверьте ванильные исходники
        super.OnChatInputSend();
    }
};
```

Конкретная реализация зависит от версии DayZ и того, как `ChatInputMenu` предоставляет доступ к тексту. Подход через `OnEvent` в этом руководстве проще и работает для разработки, с компромиссом в том, что текст команды также появляется как сообщение в чате.

---

## Следующие шаги

1. **Загрузка администраторов из файла конфигурации** -- Используйте `JsonFileLoader` для загрузки ID администраторов из JSON-файла вместо жёсткого кодирования.
2. **Добавьте команду /help** -- Список всех доступных команд с описаниями и использованием.
3. **Добавьте логирование** -- Записывайте использование команд в лог-файл для целей аудита.
4. **Интеграция с фреймворком** -- Используйте фреймворк с иерархическими правами и строковой маршрутизацией RPC для избежания коллизий целочисленных ID.
5. **Добавьте кулдауны** -- Предотвратите спам командами, отслеживая время последнего выполнения для каждого игрока.
6. **Создайте UI палитры команд** -- Создайте админ-панель со списком всех команд с кнопками (объединяя это руководство с [Главой 8.3](03-admin-panel.md)).

---

## Лучшие практики

- **Всегда проверяйте права перед выполнением админ-команд.** Отсутствие проверки прав означает, что любой игрок может `/heal` или `/kill` кого угодно. Проверяйте Steam64 ID вызвавшего (через `GetPlainId()`) на сервере перед обработкой.
- **Отправляйте обратную связь администратору даже для неудавшихся команд.** Молчаливые ошибки делают отладку невозможной. Всегда отправляйте сообщение в чат с объяснением причины ("Player not found", "Permission denied").
- **Используйте `GetPlainId()` для проверок администратора, а не `GetId()`.** `GetId()` возвращает специфичный для сессии DayZ ID, который меняется при каждом переподключении. `GetPlainId()` возвращает постоянный Steam64 ID.
- **Храните ID администраторов в JSON-файле конфигурации, а не в коде.** Жёстко заданные ID требуют пересборки PBO для изменения. JSON-файл в `$profile:` может быть отредактирован администраторами сервера без знаний в моддинге.
- **Преобразуйте имена команд в нижний регистр перед сопоставлением.** Игроки могут ввести `/Heal`, `/HEAL` или `/heal`. Нормализация в нижний регистр предотвращает раздражающие ошибки "unknown command".

---

## Теория и практика

| Концепция | Теория | Реальность |
|-----------|--------|------------|
| Перехват чата через `OnEvent` | Перехватить сообщение и обработать его как команду | Сообщение всё равно появляется в чате для всех игроков. Подавление требует модификации `ChatInputMenu`, что зависит от версии DayZ. |
| `GetGame().Chat()` | Отображает сообщение в окне чата игрока | Работает только когда UI чата активен. На экране загрузки или в определённых состояниях меню сообщение молча отбрасывается. |
| Паттерн реестра команд | Чистая архитектура с одним классом на команду | Каждый файл класса команды должен находиться в правильном слое скриптов. `CCmdBase` в `3_Game`, конкретные команды, ссылающиеся на `PlayerBase`, в `4_World`. Неправильное размещение слоя вызывает "Undefined type" при загрузке. |
| Поиск игрока по имени | `FindPlayerByName` ищет по частичному совпадению | Частичное совпадение может попасть на неправильного игрока на сервере с похожими именами. В продакшне предпочитайте поиск по Steam64 ID или добавьте шаг подтверждения. |

---

## Что вы изучили

В этом руководстве вы научились:
- Как перехватывать ввод чата с помощью `MissionGameplay.OnEvent` с `ChatMessageEventTypeID`
- Как разбирать префиксы команд и аргументы из текста чата
- Как проверять права администратора на сервере с помощью Steam64 ID
- Как отправлять обратную связь по команде обратно игроку через RPC и `GetGame().Chat()`
- Как создать переиспользуемый паттерн реестра команд для добавления новых команд

**Далее:** [Глава 8.6: Отладка и тестирование мода](06-debugging-testing.md)

---

**Предыдущая:** [Глава 8.3: Создание модуля панели администратора](03-admin-panel.md)
