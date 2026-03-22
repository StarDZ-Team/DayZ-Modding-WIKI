# Глава 8.8: Создание HUD-оверлея

[Главная](../../README.md) | [<< Назад: Публикация в Steam Workshop](07-publishing-workshop.md) | **Создание HUD-оверлея** | [Далее: Профессиональный шаблон мода >>](09-professional-template.md)

---

> **Краткое описание:** В этом руководстве вы пошагово создадите пользовательский HUD-оверлей, отображающий информацию о сервере в правом верхнем углу экрана. Вы создадите файл макета, напишете класс контроллера, подключитесь к жизненному циклу миссии, запросите данные с сервера через RPC, добавите привязку клавиши переключения и отполируете результат с помощью анимаций затухания и интеллектуальной видимости. В итоге у вас будет ненавязчивый HUD с информацией о сервере, показывающий название сервера, количество игроков и текущее игровое время, а также твёрдое понимание того, как работают HUD-оверлеи в DayZ.

---

## Содержание

- [Что мы создаём](#что-мы-создаём)
- [Предварительные требования](#предварительные-требования)
- [Структура мода](#структура-мода)
- [Шаг 1: Создание файла макета](#шаг-1-создание-файла-макета)
- [Шаг 2: Создание класса контроллера HUD](#шаг-2-создание-класса-контроллера-hud)
- [Шаг 3: Подключение к MissionGameplay](#шаг-3-подключение-к-missiongameplay)
- [Шаг 4: Запрос данных с сервера](#шаг-4-запрос-данных-с-сервера)
- [Шаг 5: Добавление переключения по клавише](#шаг-5-добавление-переключения-по-клавише)
- [Шаг 6: Доработка](#шаг-6-доработка)
- [Полный справочник по коду](#полный-справочник-по-коду)
- [Расширение HUD](#расширение-hud)
- [Типичные ошибки](#типичные-ошибки)
- [Следующие шаги](#следующие-шаги)

---

## Что мы создаём

Небольшую полупрозрачную панель, привязанную к правому верхнему углу экрана, которая отображает три строки информации:

```
  Aurora Survival [Official]
  Players: 24 / 60
  Time: 14:35
```

Панель располагается ниже индикаторов состояния и выше панели быстрого доступа. Она обновляется раз в секунду (не каждый кадр), плавно появляется при показе и исчезает при скрытии, автоматически скрывается при открытии инвентаря или меню паузы. Игрок может включать и выключать её настраиваемой клавишей (по умолчанию: **F7**).

### Ожидаемый результат

После загрузки вы увидите тёмный полупрозрачный прямоугольник в правой верхней области экрана. Белый текст показывает название сервера на первой строке, текущее количество игроков на второй и внутриигровое время на третьей. Нажатие F7 плавно скрывает его; повторное нажатие F7 плавно возвращает.

---

## Предварительные требования

- Работающая структура мода (сначала пройдите [Главу 8.1](01-first-mod.md))
- Базовое понимание синтаксиса Enforce Script
- Знакомство с клиент-серверной моделью DayZ (HUD работает на клиенте; количество игроков приходит с сервера)

---

## Структура мода

Создайте следующее дерево каталогов:

```
ServerInfoHUD/
    mod.cpp
    Scripts/
        config.cpp
        data/
            inputs.xml
        3_Game/
            ServerInfoHUD/
                ServerInfoRPC.c
        4_World/
            ServerInfoHUD/
                ServerInfoServer.c
        5_Mission/
            ServerInfoHUD/
                ServerInfoHUD.c
                MissionHook.c
    GUI/
        layouts/
            ServerInfoHUD.layout
```

Слой `3_Game` определяет константы (наш ID RPC). Слой `4_World` обрабатывает серверную часть ответа. Слой `5_Mission` содержит класс HUD и хук миссии. Файл макета определяет дерево виджетов.

---

## Шаг 1: Создание файла макета

Файлы макетов (`.layout`) определяют иерархию виджетов в XML. GUI-система DayZ использует координатную модель, где каждый виджет имеет позицию и размер, выраженные как пропорциональные значения (от 0.0 до 1.0 родительского элемента) плюс пиксельные смещения.

### `GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <!-- Корневой фрейм: покрывает весь экран, не перехватывает ввод -->
    <Widget name="ServerInfoRoot" type="FrameWidgetClass">
      <Attribute name="position" value="0 0" />
      <Attribute name="size" value="1 1" />
      <Attribute name="halign" value="0" />
      <Attribute name="valign" value="0" />
      <Attribute name="hexactpos" value="0" />
      <Attribute name="vexactpos" value="0" />
      <Attribute name="hexactsize" value="0" />
      <Attribute name="vexactsize" value="0" />
      <children>
        <!-- Фоновая панель: правый верхний угол -->
        <Widget name="ServerInfoPanel" type="ImageWidgetClass">
          <Attribute name="position" value="1 0" />
          <Attribute name="size" value="220 70" />
          <Attribute name="halign" value="2" />
          <Attribute name="valign" value="0" />
          <Attribute name="hexactpos" value="0" />
          <Attribute name="vexactpos" value="1" />
          <Attribute name="hexactsize" value="1" />
          <Attribute name="vexactsize" value="1" />
          <Attribute name="color" value="0 0 0 0.55" />
          <children>
            <!-- Текст названия сервера -->
            <Widget name="ServerNameText" type="TextWidgetClass">
              <Attribute name="position" value="8 6" />
              <Attribute name="size" value="204 20" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="14" />
              <Attribute name="text" value="Server Name" />
              <Attribute name="color" value="1 1 1 0.9" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
            <!-- Текст количества игроков -->
            <Widget name="PlayerCountText" type="TextWidgetClass">
              <Attribute name="position" value="8 28" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Players: - / -" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
            <!-- Текст внутриигрового времени -->
            <Widget name="TimeText" type="TextWidgetClass">
              <Attribute name="position" value="8 48" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Time: --:--" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
          </children>
        </Widget>
      </children>
    </Widget>
  </children>
</layoutset>
```

### Ключевые концепции макета

| Атрибут | Значение |
|---------|----------|
| `halign="2"` | Горизонтальное выравнивание: **вправо**. Виджет привязывается к правому краю родителя. |
| `valign="0"` | Вертикальное выравнивание: **вверх**. |
| `hexactpos="0"` + `vexactpos="1"` | Горизонтальная позиция пропорциональная (1.0 = правый край), вертикальная -- в пикселях. |
| `hexactsize="1"` + `vexactsize="1"` | Ширина и высота в пикселях (220 x 70). |
| `color="0 0 0 0.55"` | RGBA в виде дробных чисел. Чёрный с 55% непрозрачности для фоновой панели. |

`ServerInfoPanel` позиционирован с пропорциональным X=1.0 (правый край) и `halign="2"` (выравнивание вправо), поэтому правый край панели касается правой стороны экрана. Позиция Y -- 0 пикселей от верха. Это размещает наш HUD в правом верхнем углу.

**Почему пиксельные размеры для панели?** Пропорциональное масштабирование заставило бы панель изменяться с разрешением, но для небольших информационных виджетов нужен фиксированный пиксельный размер, чтобы текст оставался читаемым при любом разрешении.

---

## Шаг 2: Создание класса контроллера HUD

Класс контроллера загружает макет, находит виджеты по имени и предоставляет методы для обновления отображаемого текста. Он расширяет `ScriptedWidgetEventHandler`, чтобы при необходимости получать события виджетов позже.

### `Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Panel;
    protected TextWidget m_ServerNameText;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_TimeText;

    protected bool m_IsVisible;
    protected float m_UpdateTimer;

    // Как часто обновлять отображаемые данные (в секундах)
    static const float UPDATE_INTERVAL = 1.0;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
    }

    void ~ServerInfoHUD()
    {
        Destroy();
    }

    // Создание и отображение HUD
    void Init()
    {
        if (m_Root)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout"
        );

        if (!m_Root)
        {
            Print("[ServerInfoHUD] ERROR: Failed to load layout file.");
            return;
        }

        m_Panel = m_Root.FindAnyWidget("ServerInfoPanel");
        m_ServerNameText = TextWidget.Cast(
            m_Root.FindAnyWidget("ServerNameText")
        );
        m_PlayerCountText = TextWidget.Cast(
            m_Root.FindAnyWidget("PlayerCountText")
        );
        m_TimeText = TextWidget.Cast(
            m_Root.FindAnyWidget("TimeText")
        );

        m_Root.Show(true);
        m_IsVisible = true;

        // Запрос начальных данных с сервера
        RequestServerInfo();
    }

    // Удаление всех виджетов
    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    // Вызывается каждый кадр из MissionGameplay.OnUpdate
    void Update(float timeslice)
    {
        if (!m_Root)
            return;

        if (!m_IsVisible)
            return;

        m_UpdateTimer += timeslice;

        if (m_UpdateTimer >= UPDATE_INTERVAL)
        {
            m_UpdateTimer = 0;
            RefreshTime();
            RequestServerInfo();
        }
    }

    // Обновление отображения внутриигрового времени (клиентское, RPC не нужен)
    protected void RefreshTime()
    {
        if (!m_TimeText)
            return;

        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);

        string hourStr = hour.ToString();
        string minStr = minute.ToString();

        if (hour < 10)
            hourStr = "0" + hourStr;

        if (minute < 10)
            minStr = "0" + minStr;

        m_TimeText.SetText("Time: " + hourStr + ":" + minStr);
    }

    // Отправка RPC серверу с запросом количества игроков и названия сервера
    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            // Офлайн-режим: показываем только локальную информацию
            SetServerName("Offline Mode");
            SetPlayerCount(1, 1);
            return;
        }

        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        ScriptRPC rpc = new ScriptRPC();
        rpc.Send(player, SIH_RPC_REQUEST_INFO, true, NULL);
    }

    // --- Сеттеры, вызываемые при получении данных ---

    void SetServerName(string name)
    {
        if (m_ServerNameText)
            m_ServerNameText.SetText(name);
    }

    void SetPlayerCount(int current, int max)
    {
        if (m_PlayerCountText)
        {
            string text = "Players: " + current.ToString()
                + " / " + max.ToString();
            m_PlayerCountText.SetText(text);
        }
    }

    // Переключение видимости
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (m_Root)
            m_Root.Show(m_IsVisible);
    }

    // Скрытие при открытых меню
    void SetMenuState(bool menuOpen)
    {
        if (!m_Root)
            return;

        if (menuOpen)
        {
            m_Root.Show(false);
        }
        else if (m_IsVisible)
        {
            m_Root.Show(true);
        }
    }

    bool IsVisible()
    {
        return m_IsVisible;
    }

    Widget GetRoot()
    {
        return m_Root;
    }
};
```

### Важные детали

1. **Путь `CreateWidgets`**: Путь задаётся относительно корня мода. Поскольку мы упаковываем папку `GUI/` внутрь PBO, движок разрешает `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout` используя префикс мода.
2. **`FindAnyWidget`**: Рекурсивно ищет в дереве виджетов по имени. Всегда проверяйте на NULL после приведения типа.
3. **`Widget.Unlink()`**: Корректно удаляет виджет и все его дочерние элементы из дерева UI. Всегда вызывайте это при очистке.
4. **Паттерн аккумулятора таймера**: Мы добавляем `timeslice` каждый кадр и действуем только когда накопленное время превышает `UPDATE_INTERVAL`. Это предотвращает выполнение работы каждый кадр.

---

## Шаг 3: Подключение к MissionGameplay

Класс `MissionGameplay` -- это контроллер миссии на стороне клиента. Мы используем `modded class` для внедрения нашего HUD в его жизненный цикл без замены ванильного файла.

### `Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        // Создание HUD-оверлея
        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        // Очистка ДО вызова super
        if (m_ServerInfoHUD)
        {
            m_ServerInfoHUD.Destroy();
            m_ServerInfoHUD = NULL;
        }

        super.OnMissionFinish();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_ServerInfoHUD)
            return;

        // Скрытие HUD при открытом инвентаре или любом меню
        UIManager uiMgr = GetGame().GetUIManager();
        bool menuOpen = false;

        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);

        // Обновление данных HUD (внутреннее ограничение частоты)
        m_ServerInfoHUD.Update(timeslice);

        // Проверка клавиши переключения
        Input input = GetGame().GetInput();
        if (input)
        {
            if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
            {
                m_ServerInfoHUD.ToggleVisibility();
            }
        }
    }

    // Аксессор для доступа обработчика RPC к HUD
    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### Почему этот паттерн работает

- **`OnInit`** выполняется один раз, когда игрок входит в геймплей. Мы создаём и инициализируем HUD здесь.
- **`OnUpdate`** выполняется каждый кадр. Мы передаём `timeslice` в HUD, который внутренне ограничивает обновление до одного раза в секунду. Мы также проверяем нажатие клавиши переключения и видимость меню здесь.
- **`OnMissionFinish`** выполняется при отключении игрока или завершении миссии. Мы уничтожаем наши виджеты здесь для предотвращения утечек памяти.

### Критическое правило: Всегда очищайте ресурсы

Если вы забудете уничтожить виджеты в `OnMissionFinish`, корневой виджет утечёт в следующую сессию. После нескольких переключений серверов у игрока будут накапливаться призрачные виджеты, потребляющие память. Всегда сопровождайте `Init()` вызовом `Destroy()`.

---

## Шаг 4: Запрос данных с сервера

Количество игроков известно только серверу. Нам нужен простой цикл RPC (удалённый вызов процедур): клиент отправляет запрос, сервер считывает данные и отправляет их обратно.

### Шаг 4а: Определение ID RPC

ID RPC должны быть уникальными для всех модов. Мы определяем наши в слое `3_Game`, чтобы и клиентский, и серверный код мог ссылаться на них.

### `Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// ID RPC для Server Info HUD.
// Используем большие числа для избежания конфликтов с ванильными и другими модами.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

**Почему `3_Game`?** Константы и перечисления должны находиться в самом нижнем слое, доступном и клиенту, и серверу. Слой `3_Game` загружается до `4_World` и `5_Mission`, поэтому обе стороны могут видеть эти значения.

### Шаг 4б: Серверный обработчик

Сервер слушает `SIH_RPC_REQUEST_INFO`, собирает данные и отвечает с `SIH_RPC_RESPONSE_INFO`.

### `Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_REQUEST_INFO)
        {
            HandleServerInfoRequest(sender);
        }
    }

    protected void HandleServerInfoRequest(PlayerIdentity sender)
    {
        if (!sender)
            return;

        // Сбор информации о сервере
        string serverName = "";
        GetGame().GetHostName(serverName);

        int playerCount = 0;
        int maxPlayers = 0;

        // Получение списка игроков
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        playerCount = players.Count();

        // Максимум игроков из конфигурации сервера
        maxPlayers = GetGame().GetMaxPlayers();

        // Отправка ответа запрашивающему клиенту
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### Шаг 4в: Клиентский приёмник RPC

Клиент получает ответ и обновляет HUD.

Добавьте следующее **ниже** класса `ServerInfoHUD` в `ServerInfoHUD.c`:

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_RESPONSE_INFO)
        {
            HandleServerInfoResponse(ctx);
        }
    }

    protected void HandleServerInfoResponse(ParamsReadContext ctx)
    {
        string serverName;
        int playerCount;
        int maxPlayers;

        if (!ctx.Read(serverName))
            return;
        if (!ctx.Read(playerCount))
            return;
        if (!ctx.Read(maxPlayers))
            return;

        // Доступ к HUD через MissionGameplay
        MissionGameplay mission = MissionGameplay.Cast(
            GetGame().GetMission()
        );

        if (!mission)
            return;

        ServerInfoHUD hud = mission.GetServerInfoHUD();
        if (!hud)
            return;

        hud.SetServerName(serverName);
        hud.SetPlayerCount(playerCount, maxPlayers);
    }
};
```

### Как работает поток RPC

```
КЛИЕНТ                           СЕРВЕР
  |                                |
  |--- SIH_RPC_REQUEST_INFO ----->|
  |                                | считывает serverName, playerCount, maxPlayers
  |<-- SIH_RPC_RESPONSE_INFO ----|
  |                                |
  | обновляет текст HUD           |
```

Клиент отправляет запрос раз в секунду (ограничен таймером обновления). Сервер отвечает тремя значениями, упакованными в контекст RPC. Клиент считывает их в том же порядке, в котором они были записаны.

**Важно:** `rpc.Write()` и `ctx.Read()` должны использовать одинаковые типы в одинаковом порядке. Если сервер записывает `string`, затем два значения `int`, клиент должен прочитать `string`, затем два значения `int`.

---

## Шаг 5: Добавление переключения по клавише

### Шаг 5а: Определение ввода в `inputs.xml`

DayZ использует `inputs.xml` для регистрации пользовательских действий клавиш. Файл должен быть размещён в `Scripts/data/inputs.xml` и указан в `config.cpp`.

### `Scripts/data/inputs.xml`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAServerInfoToggle" loc="Toggle Server Info HUD" />
        </actions>
    </inputs>
    <preset>
        <input name="UAServerInfoToggle">
            <btn name="kF7" />
        </input>
    </preset>
</modded_inputs>
```

| Элемент | Назначение |
|---------|-----------|
| `<actions>` | Объявляет действие ввода по имени. `loc` -- это строка, отображаемая в меню настроек привязки клавиш. |
| `<preset>` | Назначает клавишу по умолчанию. `kF7` соответствует клавише F7. |

### Шаг 5б: Ссылка на `inputs.xml` в `config.cpp`

Ваш `config.cpp` должен сообщить движку, где найти файл ввода. Добавьте запись `inputs` внутри блока `defs`:

```cpp
class defs
{
    class gameScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/3_Game" };
    };

    class worldScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/4_World" };
    };

    class missionScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/5_Mission" };
    };

    class inputs
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/data" };
    };
};
```

### Шаг 5в: Чтение нажатия клавиши

Мы уже обрабатываем это в хуке `MissionGameplay` из Шага 3:

```c
if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
{
    m_ServerInfoHUD.ToggleVisibility();
}
```

`GetUApi()` возвращает синглтон API ввода. `GetInputByName` ищет наше зарегистрированное действие. `LocalPress()` возвращает `true` ровно на один кадр при нажатии клавиши.

### Справочник имён клавиш

Часто используемые имена клавиш для `<btn>`:

| Имя клавиши | Клавиша |
|-------------|---------|
| `kF1` до `kF12` | Функциональные клавиши |
| `kH`, `kI` и т.д. | Буквенные клавиши |
| `kNumpad0` до `kNumpad9` | Цифровая клавиатура |
| `kLControl` | Левый Control |
| `kLShift` | Левый Shift |
| `kLAlt` | Левый Alt |

Комбинации модификаторов используют вложенность:

```xml
<input name="UAServerInfoToggle">
    <btn name="kLControl">
        <btn name="kH" />
    </btn>
</input>
```

Это означает "удерживайте левый Control и нажмите H."

---

## Шаг 6: Доработка

### 6а: Анимация плавного появления/исчезновения

DayZ предоставляет `WidgetFadeTimer` для плавных переходов прозрачности. Обновите класс `ServerInfoHUD` для его использования:

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    // ... существующие поля ...

    protected ref WidgetFadeTimer m_FadeTimer;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    // Замените метод ToggleVisibility:
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (!m_Root)
            return;

        if (m_IsVisible)
        {
            m_Root.Show(true);
            m_FadeTimer.FadeIn(m_Root, 0.3);
        }
        else
        {
            m_FadeTimer.FadeOut(m_Root, 0.3);
        }
    }

    // ... остальная часть класса ...
};
```

`FadeIn(widget, duration)` анимирует альфу виджета от 0 до 1 за заданную продолжительность в секундах. `FadeOut` работает от 1 до 0 и скрывает виджет по завершении.

### 6б: Фоновая панель с прозрачностью

Мы уже задали это в макете (`color="0 0 0 0.55"`), что даёт тёмное наложение с 55% непрозрачности. Если вы хотите настроить альфу во время выполнения:

```c
void SetBackgroundAlpha(float alpha)
{
    if (m_Panel)
    {
        int color = ARGB(
            (int)(alpha * 255),
            0, 0, 0
        );
        m_Panel.SetColor(color);
    }
}
```

Функция `ARGB()` принимает целочисленные значения 0-255 для альфа, красного, зелёного и синего.

### 6в: Выбор шрифта и цвета

DayZ поставляется с несколькими шрифтами, которые можно указывать в макетах:

| Путь к шрифту | Стиль |
|---------------|-------|
| `gui/fonts/MetronBook` | Чистый sans-serif (используется в ванильном HUD) |
| `gui/fonts/MetronMedium` | Более жирная версия MetronBook |
| `gui/fonts/Metron` | Самый тонкий вариант |
| `gui/fonts/luxuriousscript` | Декоративный скрипт (избегайте для HUD) |

Для изменения цвета текста во время выполнения:

```c
void SetTextColor(TextWidget widget, int r, int g, int b, int a)
{
    if (widget)
        widget.SetColor(ARGB(a, r, g, b));
}
```

### 6г: Уважение к другому UI

Наш `MissionHook.c` уже обнаруживает открытие меню и вызывает `SetMenuState(true)`. Вот более тщательный подход, который проверяет инвентарь отдельно:

```c
// В переопределении OnUpdate модифицированного MissionGameplay:
bool menuOpen = false;

UIManager uiMgr = GetGame().GetUIManager();
if (uiMgr)
{
    UIScriptedMenu topMenu = uiMgr.GetMenu();
    if (topMenu)
        menuOpen = true;
}

// Также проверяем, открыт ли инвентарь
if (uiMgr && uiMgr.FindMenu(MENU_INVENTORY))
    menuOpen = true;

m_ServerInfoHUD.SetMenuState(menuOpen);
```

Это гарантирует, что ваш HUD скрывается за экраном инвентаря, меню паузы, экраном настроек и любым другим скриптовым меню.

---

## Полный справочник по коду

Ниже приведён каждый файл мода в его финальной форме со всей примённой доработкой.

### Файл 1: `ServerInfoHUD/mod.cpp`

```cpp
name = "Server Info HUD";
author = "YourName";
version = "1.0";
overview = "Displays server name, player count, and in-game time.";
```

### Файл 2: `ServerInfoHUD/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class ServerInfoHUD_Scripts
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
    class ServerInfoHUD
    {
        dir = "ServerInfoHUD";
        name = "Server Info HUD";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/3_Game" };
            };

            class worldScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/4_World" };
            };

            class missionScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/5_Mission" };
            };

            class inputs
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/data" };
            };
        };
    };
};
```

### Файл 3: `ServerInfoHUD/Scripts/data/inputs.xml`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAServerInfoToggle" loc="Toggle Server Info HUD" />
        </actions>
    </inputs>
    <preset>
        <input name="UAServerInfoToggle">
            <btn name="kF7" />
        </input>
    </preset>
</modded_inputs>
```

### Файл 4: `ServerInfoHUD/Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// ID RPC для Server Info HUD.
// Используем большие числа для избежания коллизий с ванильными ERPC и другими модами.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

### Файл 5: `ServerInfoHUD/Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        // Только сервер обрабатывает этот RPC
        if (!GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_REQUEST_INFO)
        {
            HandleServerInfoRequest(sender);
        }
    }

    protected void HandleServerInfoRequest(PlayerIdentity sender)
    {
        if (!sender)
            return;

        // Получение названия сервера
        string serverName = "";
        GetGame().GetHostName(serverName);

        // Подсчёт игроков
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        int playerCount = players.Count();

        // Получение максимального количества слотов
        int maxPlayers = GetGame().GetMaxPlayers();

        // Отправка данных обратно запрашивающему клиенту
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### Файл 6: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Panel;
    protected TextWidget m_ServerNameText;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_TimeText;

    protected bool m_IsVisible;
    protected float m_UpdateTimer;
    protected ref WidgetFadeTimer m_FadeTimer;

    static const float UPDATE_INTERVAL = 1.0;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    void ~ServerInfoHUD()
    {
        Destroy();
    }

    void Init()
    {
        if (m_Root)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout"
        );

        if (!m_Root)
        {
            Print("[ServerInfoHUD] ERROR: Failed to load layout.");
            return;
        }

        m_Panel = m_Root.FindAnyWidget("ServerInfoPanel");
        m_ServerNameText = TextWidget.Cast(
            m_Root.FindAnyWidget("ServerNameText")
        );
        m_PlayerCountText = TextWidget.Cast(
            m_Root.FindAnyWidget("PlayerCountText")
        );
        m_TimeText = TextWidget.Cast(
            m_Root.FindAnyWidget("TimeText")
        );

        m_Root.Show(true);
        m_IsVisible = true;

        RequestServerInfo();
    }

    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    void Update(float timeslice)
    {
        if (!m_Root || !m_IsVisible)
            return;

        m_UpdateTimer += timeslice;

        if (m_UpdateTimer >= UPDATE_INTERVAL)
        {
            m_UpdateTimer = 0;
            RefreshTime();
            RequestServerInfo();
        }
    }

    protected void RefreshTime()
    {
        if (!m_TimeText)
            return;

        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);

        string hourStr = hour.ToString();
        string minStr = minute.ToString();

        if (hour < 10)
            hourStr = "0" + hourStr;

        if (minute < 10)
            minStr = "0" + minStr;

        m_TimeText.SetText("Time: " + hourStr + ":" + minStr);
    }

    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            SetServerName("Offline Mode");
            SetPlayerCount(1, 1);
            return;
        }

        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        ScriptRPC rpc = new ScriptRPC();
        rpc.Send(player, SIH_RPC_REQUEST_INFO, true, NULL);
    }

    void SetServerName(string name)
    {
        if (m_ServerNameText)
            m_ServerNameText.SetText(name);
    }

    void SetPlayerCount(int current, int max)
    {
        if (m_PlayerCountText)
        {
            string text = "Players: " + current.ToString()
                + " / " + max.ToString();
            m_PlayerCountText.SetText(text);
        }
    }

    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (!m_Root)
            return;

        if (m_IsVisible)
        {
            m_Root.Show(true);
            m_FadeTimer.FadeIn(m_Root, 0.3);
        }
        else
        {
            m_FadeTimer.FadeOut(m_Root, 0.3);
        }
    }

    void SetMenuState(bool menuOpen)
    {
        if (!m_Root)
            return;

        if (menuOpen)
        {
            m_Root.Show(false);
        }
        else if (m_IsVisible)
        {
            m_Root.Show(true);
        }
    }

    bool IsVisible()
    {
        return m_IsVisible;
    }

    Widget GetRoot()
    {
        return m_Root;
    }
};

// -----------------------------------------------
// Клиентский приёмник RPC
// -----------------------------------------------
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_RESPONSE_INFO)
        {
            HandleServerInfoResponse(ctx);
        }
    }

    protected void HandleServerInfoResponse(ParamsReadContext ctx)
    {
        string serverName;
        int playerCount;
        int maxPlayers;

        if (!ctx.Read(serverName))
            return;
        if (!ctx.Read(playerCount))
            return;
        if (!ctx.Read(maxPlayers))
            return;

        MissionGameplay mission = MissionGameplay.Cast(
            GetGame().GetMission()
        );
        if (!mission)
            return;

        ServerInfoHUD hud = mission.GetServerInfoHUD();
        if (!hud)
            return;

        hud.SetServerName(serverName);
        hud.SetPlayerCount(playerCount, maxPlayers);
    }
};
```

### Файл 7: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        if (m_ServerInfoHUD)
        {
            m_ServerInfoHUD.Destroy();
            m_ServerInfoHUD = NULL;
        }

        super.OnMissionFinish();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_ServerInfoHUD)
            return;

        // Обнаружение открытых меню
        bool menuOpen = false;
        UIManager uiMgr = GetGame().GetUIManager();
        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);
        m_ServerInfoHUD.Update(timeslice);

        // Клавиша переключения
        if (GetUApi().GetInputByName(
            "UAServerInfoToggle"
        ).LocalPress())
        {
            m_ServerInfoHUD.ToggleVisibility();
        }
    }

    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### Файл 8: `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <Widget name="ServerInfoRoot" type="FrameWidgetClass">
      <Attribute name="position" value="0 0" />
      <Attribute name="size" value="1 1" />
      <Attribute name="halign" value="0" />
      <Attribute name="valign" value="0" />
      <Attribute name="hexactpos" value="0" />
      <Attribute name="vexactpos" value="0" />
      <Attribute name="hexactsize" value="0" />
      <Attribute name="vexactsize" value="0" />
      <children>
        <Widget name="ServerInfoPanel" type="ImageWidgetClass">
          <Attribute name="position" value="1 0" />
          <Attribute name="size" value="220 70" />
          <Attribute name="halign" value="2" />
          <Attribute name="valign" value="0" />
          <Attribute name="hexactpos" value="0" />
          <Attribute name="vexactpos" value="1" />
          <Attribute name="hexactsize" value="1" />
          <Attribute name="vexactsize" value="1" />
          <Attribute name="color" value="0 0 0 0.55" />
          <children>
            <Widget name="ServerNameText" type="TextWidgetClass">
              <Attribute name="position" value="8 6" />
              <Attribute name="size" value="204 20" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="14" />
              <Attribute name="text" value="Server Name" />
              <Attribute name="color" value="1 1 1 0.9" />
            </Widget>
            <Widget name="PlayerCountText" type="TextWidgetClass">
              <Attribute name="position" value="8 28" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Players: - / -" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
            </Widget>
            <Widget name="TimeText" type="TextWidgetClass">
              <Attribute name="position" value="8 48" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Time: --:--" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
            </Widget>
          </children>
        </Widget>
      </children>
    </Widget>
  </children>
</layoutset>
```

---

## Расширение HUD

Когда базовый HUD работает, вот естественные расширения.

### Добавление отображения FPS

FPS можно считать на клиенте без какого-либо RPC:

```c
// Добавьте поле TextWidget m_FPSText и найдите его в Init()

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    float fps = 1.0 / GetGame().GetDeltaT();
    m_FPSText.SetText("FPS: " + Math.Round(fps).ToString());
}
```

Вызывайте `RefreshFPS()` наряду с `RefreshTime()` в методе обновления. Обратите внимание, что `GetDeltaT()` возвращает время текущего кадра, поэтому значение FPS будет колебаться. Для более плавного отображения усредняйте за несколько кадров:

```c
protected float m_FPSAccum;
protected int m_FPSFrames;

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    m_FPSAccum += GetGame().GetDeltaT();
    m_FPSFrames++;

    float avgFPS = m_FPSFrames / m_FPSAccum;
    m_FPSText.SetText("FPS: " + Math.Round(avgFPS).ToString());

    // Сброс каждую секунду (при срабатывании основного таймера)
    m_FPSAccum = 0;
    m_FPSFrames = 0;
}
```

### Добавление позиции игрока

```c
protected void RefreshPosition()
{
    if (!m_PositionText)
        return;

    Man player = GetGame().GetPlayer();
    if (!player)
        return;

    vector pos = player.GetPosition();
    string text = "Pos: " + Math.Round(pos[0]).ToString()
        + " / " + Math.Round(pos[2]).ToString();
    m_PositionText.SetText(text);
}
```

### Множественные панели HUD

Для множественных панелей (компас, статус, миникарта) создайте родительский класс-менеджер, который хранит массив элементов HUD:

```c
class HUDManager
{
    protected ref array<ref ServerInfoHUD> m_Panels;

    void HUDManager()
    {
        m_Panels = new array<ref ServerInfoHUD>();
    }

    void AddPanel(ServerInfoHUD panel)
    {
        m_Panels.Insert(panel);
    }

    void UpdateAll(float timeslice)
    {
        int count = m_Panels.Count();
        int i = 0;
        while (i < count)
        {
            m_Panels.Get(i).Update(timeslice);
            i++;
        }
    }
};
```

### Перетаскиваемые элементы HUD

Для перетаскивания виджета необходимо обрабатывать события мыши через `ScriptedWidgetEventHandler`:

```c
class DraggableHUD : ScriptedWidgetEventHandler
{
    protected bool m_Dragging;
    protected float m_OffsetX;
    protected float m_OffsetY;
    protected Widget m_DragWidget;

    override bool OnMouseButtonDown(Widget w, int x, int y, int button)
    {
        if (w == m_DragWidget && button == 0)
        {
            m_Dragging = true;
            float wx, wy;
            m_DragWidget.GetScreenPos(wx, wy);
            m_OffsetX = x - wx;
            m_OffsetY = y - wy;
            return true;
        }
        return false;
    }

    override bool OnMouseButtonUp(Widget w, int x, int y, int button)
    {
        if (button == 0)
            m_Dragging = false;
        return false;
    }

    override bool OnUpdate(Widget w, int x, int y, int oldX, int oldY)
    {
        if (m_Dragging && m_DragWidget)
        {
            m_DragWidget.SetPos(x - m_OffsetX, y - m_OffsetY);
            return true;
        }
        return false;
    }
};
```

Примечание: для работы перетаскивания виджет должен иметь вызванный на нём `SetHandler(this)`, чтобы обработчик событий получал события. Также курсор должен быть видимым, что ограничивает перетаскиваемые HUD ситуациями, когда активно меню или режим редактирования.

---

## Типичные ошибки

### 1. Обновление каждый кадр вместо ограниченного

**Неправильно:**

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);
    m_ServerInfoHUD.RefreshTime();      // Выполняется 60+ раз в секунду!
    m_ServerInfoHUD.RequestServerInfo(); // Отправляет 60+ RPC в секунду!
}
```

**Правильно:** Используйте аккумулятор таймера (как показано в руководстве), чтобы дорогостоящие операции выполнялись максимум раз в секунду. Текст HUD, меняющийся каждый кадр (как счётчик FPS), можно обновлять покадрово, но запросы RPC должны быть ограничены.

### 2. Отсутствие очистки в OnMissionFinish

**Неправильно:**

```c
modded class MissionGameplay
{
    ref ServerInfoHUD m_HUD;

    override void OnInit()
    {
        super.OnInit();
        m_HUD = new ServerInfoHUD();
        m_HUD.Init();
        // Нигде нет очистки -- виджет утекает при отключении!
    }
};
```

**Правильно:** Всегда уничтожайте виджеты и обнуляйте ссылки в `OnMissionFinish()`. Деструктор (`~ServerInfoHUD`) -- это страховочная сетка, но не полагайтесь на него -- `OnMissionFinish` -- правильное место для явной очистки.

### 3. HUD позади других элементов UI

Виджеты, созданные позже, рендерятся поверх виджетов, созданных ранее. Если ваш HUD появляется позади ванильного UI, он был создан слишком рано. Решения:

- Создавайте HUD позже в последовательности инициализации (например, при первом вызове `OnUpdate`, а не в `OnInit`).
- Используйте `m_Root.SetSort(100)` для принудительного повышения порядка сортировки, помещая ваш виджет выше остальных.

### 4. Слишком частые запросы данных (спам RPC)

Отправка RPC каждый кадр создаёт 60+ сетевых пакетов в секунду на каждого подключённого игрока. На сервере с 60 игроками это 3 600 пакетов в секунду ненужного трафика. Всегда ограничивайте запросы RPC. Раз в секунду -- разумная частота для некритичной информации. Для данных, которые редко меняются (например, название сервера), вы можете запросить их только один раз при инициализации и кэшировать.

### 5. Забывание вызова `super`

```c
// НЕПРАВИЛЬНО: ломает функциональность ванильного HUD
override void OnInit()
{
    m_HUD = new ServerInfoHUD();
    m_HUD.Init();
    // Отсутствует super.OnInit()! Ванильный HUD не инициализируется.
}
```

Всегда вызывайте `super.OnInit()` (и `super.OnUpdate()`, `super.OnMissionFinish()`) первым делом. Пропуск вызова super ломает ванильную реализацию и каждый другой мод, который хукает тот же метод.

### 6. Использование неправильного слоя скриптов

Если вы попытаетесь сослаться на `MissionGameplay` из `4_World`, вы получите ошибку "Undefined type", потому что типы `5_Mission` не видны из `4_World`. Константы RPC идут в `3_Game`, серверный обработчик идёт в `4_World` (модифицируя `PlayerBase`, который живёт там), а класс HUD и хук миссии идут в `5_Mission`.

### 7. Жёстко заданный путь макета

Путь макета в `CreateWidgets()` задаётся относительно путей поиска игры. Если префикс вашего PBO не совпадает со строкой пути, макет не загрузится и `CreateWidgets` вернёт NULL. Всегда проверяйте на NULL после `CreateWidgets` и логируйте ошибку в случае неудачи.

---

## Следующие шаги

Теперь, когда у вас есть работающий HUD-оверлей, рассмотрите следующие направления развития:

1. **Сохранение пользовательских настроек** -- Сохраняйте видимость HUD в локальном JSON-файле, чтобы состояние переключения сохранялось между сессиями.
2. **Добавление серверной конфигурации** -- Позвольте администраторам сервера включать/выключать HUD или выбирать отображаемые поля через JSON-файл конфигурации.
3. **Создание админского оверлея** -- Расширьте HUD для отображения информации только для администраторов (производительность сервера, количество сущностей, таймер рестарта) с проверкой прав.
4. **Создание компаса HUD** -- Используйте `GetGame().GetCurrentCameraDirection()` для вычисления направления и отображения полосы компаса в верхней части экрана.
5. **Изучение существующих модов** -- Посмотрите на HUD квестов DayZ Expansion и систему оверлеев Colorful UI для примеров HUD промышленного качества.

---

## Лучшие практики

- **Ограничивайте `OnUpdate` до интервалов минимум 1 секунда.** Используйте аккумулятор таймера, чтобы избежать выполнения дорогостоящих операций (запросы RPC, форматирование текста) 60+ раз в секунду. Только покадровые визуальные эффекты вроде счётчиков FPS должны обновляться каждый кадр.
- **Скрывайте HUD при открытом инвентаре или любом меню.** Проверяйте `GetGame().GetUIManager().GetMenu()` при каждом обновлении и подавляйте ваш оверлей. Перекрывающиеся элементы UI сбивают игроков с толку и блокируют взаимодействие.
- **Всегда очищайте виджеты в `OnMissionFinish`.** Утёкшие корневые виджеты сохраняются при переключении серверов, накапливая призрачные панели, которые потребляют память и в итоге вызывают визуальные глюки.
- **Используйте `SetSort()` для управления порядком рендеринга.** Если ваш HUD появляется позади ванильных элементов, вызовите `m_Root.SetSort(100)` для помещения его выше. Без явного порядка сортировки порядок создания определяет наложение.
- **Кэшируйте серверные данные, которые редко меняются.** Название сервера не меняется в течение сессии. Запросите его один раз при инициализации и кэшируйте локально вместо повторных запросов каждую секунду.

---

## Теория и практика

| Концепция | Теория | Реальность |
|-----------|--------|------------|
| `OnUpdate(float timeslice)` | Вызывается раз в кадр с дельтой времени кадра | На клиенте с 144 FPS это срабатывает 144 раза в секунду. Отправка RPC при каждом вызове создаёт 144 сетевых пакета в секунду на игрока. Всегда накапливайте `timeslice` и действуйте только когда сумма превышает ваш интервал. |
| Путь макета `CreateWidgets()` | Загружает макет по указанному пути | Путь задаётся относительно префикса PBO, а не файловой системы. Если префикс PBO не совпадает со строкой пути, `CreateWidgets` молча возвращает NULL без ошибки в логе. |
| `WidgetFadeTimer` | Плавно анимирует непрозрачность виджета | `FadeOut` скрывает виджет после завершения анимации, но `FadeIn` НЕ вызывает `Show(true)` предварительно. Вы должны вручную показать виджет перед вызовом `FadeIn`, иначе ничего не появится. |
| `GetUApi().GetInputByName()` | Возвращает действие ввода для вашей пользовательской привязки клавиш | Если `inputs.xml` не указан в `config.cpp` в разделе `class inputs`, имя действия неизвестно и `GetInputByName` возвращает null, вызывая крах при `.LocalPress()`. |

---

## Что вы изучили

В этом руководстве вы научились:
- Как создать макет HUD с привязанными полупрозрачными панелями
- Как создать класс контроллера с ограничением частоты обновления до фиксированного интервала
- Как подключиться к `MissionGameplay` для управления жизненным циклом HUD (инициализация, обновление, очистка)
- Как запрашивать серверные данные через RPC и отображать их на клиенте
- Как зарегистрировать пользовательскую привязку клавиш через `inputs.xml` и переключать видимость HUD с анимациями затухания

**Предыдущая:** [Глава 8.7: Публикация в Steam Workshop](07-publishing-workshop.md)
