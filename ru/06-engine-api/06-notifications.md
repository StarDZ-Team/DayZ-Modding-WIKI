# Глава 6.6: Система уведомлений

[Главная](../README.md) | [<< Предыдущая: Эффекты постобработки](05-ppe.md) | **Уведомления** | [Следующая: Таймеры и CallQueue >>](07-timers.md)

---

## Введение

DayZ включает встроенную систему уведомлений для отображения всплывающих сообщений в стиле «тостов» игрокам. Класс `NotificationSystem` предоставляет статические методы для отправки уведомлений как локально (на стороне клиента), так и от сервера к клиенту через RPC. В этой главе описан полный API для отправки, настройки и управления уведомлениями.

---

## NotificationSystem

**Файл:** `3_Game/client/notifications/notificationsystem.c` (320 строк)

Статический класс, управляющий очередью уведомлений. Уведомления появляются как небольшие всплывающие карточки в верхней части экрана, расположенные вертикально, и исчезают после истечения времени отображения.

### Константы

```c
const int   DEFAULT_TIME_DISPLAYED = 10;    // Время отображения по умолчанию в секундах
const float NOTIFICATION_FADE_TIME = 3.0;   // Длительность затухания в секундах
static const int MAX_NOTIFICATIONS = 5;     // Максимум видимых уведомлений
```

---

## Уведомления от сервера к клиенту

Эти методы вызываются на сервере. Они отправляют RPC целевому клиенту игрока, который отображает уведомление локально.

### SendNotificationToPlayerExtended

```c
static void SendNotificationToPlayerExtended(
    Man player,            // Целевой игрок (Man или PlayerBase)
    float show_time,       // Длительность отображения в секундах
    string title_text,     // Заголовок уведомления
    string detail_text = "",  // Необязательный текст тела
    string icon = ""       // Необязательный путь к иконке (напр., "set:dayz_gui image:icon_info")
);
```

**Пример --- уведомление конкретного игрока:**

```c
void NotifyPlayer(PlayerBase player, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerExtended(
        player,
        8.0,                   // Показывать 8 секунд
        "Server Notice",       // Заголовок
        message,               // Тело
        ""                     // Иконка по умолчанию
    );
}
```

### SendNotificationToPlayerIdentityExtended

```c
static void SendNotificationToPlayerIdentityExtended(
    PlayerIdentity player,   // Целевая идентичность (null = рассылка ВСЕМ игрокам)
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Пример --- рассылка всем игрокам:**

```c
void BroadcastNotification(string title, string message)
{
    if (!GetGame().IsServer())
        return;

    NotificationSystem.SendNotificationToPlayerIdentityExtended(
        null,                  // null = все подключённые игроки
        10.0,                  // Показывать 10 секунд
        title,
        message,
        ""
    );
}
```

### SendNotificationToPlayer (типизированный)

```c
static void SendNotificationToPlayer(
    Man player,
    NotificationType type,    // Предопределённый тип уведомления
    float show_time,
    string detail_text = ""
);
```

Этот вариант использует предопределённые значения перечисления `NotificationType`, которые сопоставлены со встроенными заголовками и иконками. `detail_text` добавляется как тело сообщения.

---

## Локальные уведомления (на стороне клиента)

Эти методы отображают уведомления только на локальном клиенте. Они не задействуют сетевое взаимодействие.

### AddNotificationExtended

```c
static void AddNotificationExtended(
    float show_time,
    string title_text,
    string detail_text = "",
    string icon = ""
);
```

**Пример --- локальное уведомление на клиенте:**

```c
void ShowLocalNotification(string title, string body)
{
    if (!GetGame().IsClient())
        return;

    NotificationSystem.AddNotificationExtended(
        5.0,
        title,
        body,
        "set:dayz_gui image:icon_info"
    );
}
```

### AddNotification (типизированный)

```c
static void AddNotification(
    NotificationType type,
    float show_time,
    string detail_text = ""
);
```

Использует предопределённый `NotificationType` для заголовка и иконки.

---

## Перечисление NotificationType

Ванильная игра определяет типы уведомлений с назначенными заголовками и иконками. Распространённые значения:

| Тип | Описание |
|-----|----------|
| `NotificationType.GENERIC` | Общее уведомление |
| `NotificationType.FRIENDLY_FIRE` | Предупреждение о дружественном огне |
| `NotificationType.JOIN` | Подключение игрока |
| `NotificationType.LEAVE` | Отключение игрока |
| `NotificationType.STATUS` | Обновление статуса |

> **Примечание:** Доступные типы зависят от версии игры. Для максимальной гибкости используйте варианты `Extended`, которые принимают пользовательские строки заголовка и иконки.

---

## Пути к иконкам

Иконки используют синтаксис наборов изображений DayZ:

```
"set:dayz_gui image:имя_иконки"
```

Распространённые имена иконок:

| Иконка | Путь к набору |
|--------|---------------|
| Информация | `"set:dayz_gui image:icon_info"` |
| Предупреждение | `"set:dayz_gui image:icon_warning"` |
| Череп | `"set:dayz_gui image:icon_skull"` |

Можно также указать прямой путь к файлу `.edds`:

```c
"MyMod/GUI/notification_icon.edds"
```

Или передать пустую строку `""` для отсутствия иконки.

---

## События

`NotificationSystem` предоставляет скрипт-инвокеры для реакции на жизненный цикл уведомлений:

```c
ref ScriptInvoker m_OnNotificationAdded;
ref ScriptInvoker m_OnNotificationRemoved;
```

**Пример --- реакция на уведомления:**

```c
void Init()
{
    NotificationSystem notifSys = GetNotificationSystem();
    if (notifSys)
    {
        notifSys.m_OnNotificationAdded.Insert(OnNotifAdded);
        notifSys.m_OnNotificationRemoved.Insert(OnNotifRemoved);
    }
}

void OnNotifAdded()
{
    Print("Уведомление добавлено");
}

void OnNotifRemoved()
{
    Print("Уведомление удалено");
}
```

---

## Цикл обновления

Система уведомлений должна обновляться каждый кадр для обработки анимаций появления/затухания и удаления просроченных уведомлений:

```c
static void Update(float timeslice);
```

Этот метод вызывается автоматически методом `OnUpdate` ванильной миссии. Если вы пишете полностью пользовательскую миссию, убедитесь, что вызываете его.

---

## Полный пример «сервер-клиент»

Типичный паттерн мода для отправки уведомлений из серверного кода:

```c
// Серверная сторона: в обработчике событий миссии или модуле
class MyServerModule
{
    void OnMissionStarted(string missionName, vector location)
    {
        if (!GetGame().IsServer())
            return;

        // Рассылка всем игрокам
        string title = "Mission Started!";
        string body = string.Format("Go to %1!", missionName);

        NotificationSystem.SendNotificationToPlayerIdentityExtended(
            null,
            12.0,
            title,
            body,
            "set:dayz_gui image:icon_info"
        );
    }

    void OnPlayerEnteredZone(PlayerBase player, string zoneName)
    {
        if (!GetGame().IsServer())
            return;

        // Уведомить только этого игрока
        NotificationSystem.SendNotificationToPlayerExtended(
            player,
            5.0,
            "Zone Entered",
            string.Format("You have entered %1", zoneName),
            ""
        );
    }
}
```

---

## Альтернатива CommunityFramework (CF)

Если вы используете CommunityFramework, он предоставляет собственный API уведомлений:

```c
// CF-уведомление (другой RPC внутри)
NotificationSystem.Create(
    new StringLocaliser("Title"),
    new StringLocaliser("Body with param: %1", someValue),
    "set:dayz_gui image:icon_info",
    COLOR_GREEN,
    5,
    player.GetIdentity()
);
```

API CF добавляет поддержку цвета и локализации. Используйте ту систему, которую требует ваш стек модов --- они функционально похожи, но используют разные внутренние RPC.

---

## Итоги

| Концепция | Ключевой момент |
|-----------|----------------|
| Сервер игроку | `SendNotificationToPlayerExtended(player, время, заголовок, текст, иконка)` |
| Сервер всем | `SendNotificationToPlayerIdentityExtended(null, время, заголовок, текст, иконка)` |
| Локально на клиенте | `AddNotificationExtended(время, заголовок, текст, иконка)` |
| Типизированный | `SendNotificationToPlayer(player, NotificationType, время, текст)` |
| Максимум видимых | 5 уведомлений в стеке |
| Время по умолчанию | 10 секунд отображения, 3 секунды затухания |
| Иконки | `"set:dayz_gui image:имя_иконки"` или прямой путь к `.edds` |
| События | `m_OnNotificationAdded`, `m_OnNotificationRemoved` |

---

## Лучшие практики

- **Используйте варианты `Extended` для пользовательских уведомлений.** `SendNotificationToPlayerExtended` даёт полный контроль над заголовком, телом и иконкой. Типизированные варианты `NotificationType` ограничены ванильными пресетами.
- **Соблюдайте лимит стека в 5 уведомлений.** Отправка множества уведомлений подряд вытесняет старые с экрана до того, как игроки успеют их прочитать. Группируйте связанные сообщения или используйте большее время отображения.
- **Всегда защищайте серверные уведомления проверкой `GetGame().IsServer()`.** Вызов `SendNotificationToPlayerExtended` на клиенте не даёт результата и тратит вызов метода впустую.
- **Передавайте `null` в качестве идентичности для настоящей рассылки.** `SendNotificationToPlayerIdentityExtended(null, ...)` доставляет всем подключённым игрокам. Не перебирайте игроков вручную для отправки одного и того же сообщения.
- **Делайте текст уведомлений кратким.** Всплывающее окно имеет ограниченную ширину. Длинные заголовки или тела будут обрезаны. Стремитесь к заголовкам до 30 символов и тексту тела до 80 символов.

---

## Совместимость и влияние

- **Мультимод:** Ванильная `NotificationSystem` используется всеми модами совместно. Несколько модов, отправляющих уведомления одновременно, могут переполнить стек из 5 уведомлений. CF предоставляет отдельный канал уведомлений, не конфликтующий с ванильными.
- **Производительность:** Уведомления легковесны (один RPC на уведомление). Однако рассылка всем игрокам каждые несколько секунд создаёт заметный сетевой трафик на серверах с 60+ игроками.
- **Сервер/Клиент:** Методы `SendNotificationToPlayer*` --- это RPC от сервера к клиенту. `AddNotificationExtended` работает только на клиенте (локально). Обновление `Update()` выполняется в цикле клиентской миссии.

---

[<< Предыдущая: Эффекты постобработки](05-ppe.md) | **Уведомления** | [Следующая: Таймеры и CallQueue >>](07-timers.md)
