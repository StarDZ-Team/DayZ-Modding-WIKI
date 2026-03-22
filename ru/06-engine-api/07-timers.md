# Глава 6.7: Таймеры и CallQueue

[Главная](../README.md) | [<< Предыдущая: Уведомления](06-notifications.md) | **Таймеры и CallQueue** | [Следующая: Файловый ввод-вывод и JSON >>](08-file-io.md)

---

## Введение

DayZ предоставляет несколько механизмов для отложенных и повторяющихся вызовов функций: `ScriptCallQueue` (основная система), `Timer`, `ScriptInvoker` и `WidgetFadeTimer`. Они необходимы для планирования отложенной логики, создания циклов обновления и управления временными событиями без блокировки основного потока. В этой главе описан каждый механизм с полными сигнатурами API и паттернами использования.

---

## Категории вызовов

Все системы таймеров и очередей вызовов требуют **категорию вызова**, определяющую, когда отложенный вызов выполняется в рамках кадра:

```c
const int CALL_CATEGORY_SYSTEM   = 0;   // Системные операции
const int CALL_CATEGORY_GUI      = 1;   // Обновления UI
const int CALL_CATEGORY_GAMEPLAY = 2;   // Игровая логика
const int CALL_CATEGORY_COUNT    = 3;   // Общее количество категорий
```

Доступ к очереди по категории:

```c
ScriptCallQueue  queue   = GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY);
ScriptInvoker    updater = GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY);
TimerQueue       timers  = GetGame().GetTimerQueue(CALL_CATEGORY_GAMEPLAY);
```

---

## ScriptCallQueue

**Файл:** `3_Game/tools/utilityclasses.c`

Основной механизм отложенных вызовов функций. Поддерживает одноразовые задержки, повторяющиеся вызовы и немедленное выполнение в следующем кадре.

### CallLater

```c
void CallLater(func fn, int delay = 0, bool repeat = false,
               void param1 = NULL, void param2 = NULL,
               void param3 = NULL, void param4 = NULL);
```

| Параметр | Описание |
|----------|----------|
| `fn` | Вызываемая функция (ссылка на метод: `this.MyMethod`) |
| `delay` | Задержка в миллисекундах (0 = следующий кадр) |
| `repeat` | `true` = вызывать повторно с интервалом `delay`; `false` = вызвать один раз |
| `param1..4` | Необязательные параметры, передаваемые функции |

**Пример --- одноразовая задержка:**

```c
// Вызвать MyFunction один раз через 5 секунд
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.MyFunction, 5000, false);
```

**Пример --- повторяющийся вызов:**

```c
// Вызывать UpdateLoop каждую 1 секунду, повторяя
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.UpdateLoop, 1000, true);
```

**Пример --- с параметрами:**

```c
void ShowMessage(string text, int color)
{
    Print(text);
}

// Вызов с параметрами через 2 секунды
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(
    this.ShowMessage, 2000, false, "Hello!", ARGB(255, 255, 0, 0)
);
```

### Call

```c
void Call(func fn, void param1 = NULL, void param2 = NULL,
          void param3 = NULL, void param4 = NULL);
```

Выполняет функцию в следующем кадре (задержка = 0, без повтора). Сокращение для `CallLater(fn, 0, false)`.

**Пример:**

```c
// Выполнить в следующем кадре
GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).Call(this.Initialize);
```

### CallByName

```c
void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false,
                Param par = null);
```

Вызов метода по его строковому имени. Полезно, когда ссылка на метод напрямую недоступна.

**Пример:**

```c
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallByName(
    myObject, "OnTimerExpired", 3000, false
);
```

### Remove

```c
void Remove(func fn);
```

Удаляет запланированный вызов. Необходим для остановки повторяющихся вызовов и предотвращения вызовов на уничтоженных объектах.

**Пример:**

```c
// Остановить повторяющийся вызов
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).Remove(this.UpdateLoop);
```

### RemoveByName

```c
void RemoveByName(Class obj, string fnName);
```

Удаление вызова, запланированного через `CallByName`.

### Tick

```c
void Tick(float timeslice);
```

Вызывается движком внутренне каждый кадр. Вам никогда не нужно вызывать это вручную.

---

## Timer

**Файл:** `3_Game/tools/utilityclasses.c`

Таймер на основе класса с явным жизненным циклом старт/стоп. Удобнее для долгоживущих таймеров, которые нужно ставить на паузу или перезапускать.

### Конструктор

```c
void Timer(int category = CALL_CATEGORY_SYSTEM);
```

### Run

```c
void Run(float duration, Class obj, string fn_name, Param params = null, bool loop = false);
```

| Параметр | Описание |
|----------|----------|
| `duration` | Время в секундах (не миллисекундах!) |
| `obj` | Объект, чей метод будет вызван |
| `fn_name` | Имя метода как строка |
| `params` | Необязательный объект `Param` с параметрами |
| `loop` | `true` = повторять после каждого интервала |

**Пример --- одноразовый таймер:**

```c
ref Timer m_Timer;

void StartTimer()
{
    m_Timer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_Timer.Run(5.0, this, "OnTimerComplete", null, false);
}

void OnTimerComplete()
{
    Print("Таймер завершён!");
}
```

**Пример --- повторяющийся таймер:**

```c
ref Timer m_UpdateTimer;

void StartUpdateLoop()
{
    m_UpdateTimer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_UpdateTimer.Run(1.0, this, "OnUpdate", null, true);  // Каждую 1 секунду
}

void StopUpdateLoop()
{
    if (m_UpdateTimer && m_UpdateTimer.IsRunning())
        m_UpdateTimer.Stop();
}
```

### Stop

```c
void Stop();
```

Останавливает таймер. Может быть перезапущен новым вызовом `Run()`.

### IsRunning

```c
bool IsRunning();
```

Возвращает `true`, если таймер сейчас активен.

### Pause

```c
void Pause();
```

Ставит работающий таймер на паузу, сохраняя оставшееся время. Таймер можно возобновить через `Continue()`.

### Continue

```c
void Continue();
```

Возобновляет приостановленный таймер с того места, где он остановился.

### IsPaused

```c
bool IsPaused();
```

Возвращает `true`, если таймер сейчас на паузе.

**Пример --- пауза и возобновление:**

```c
ref Timer m_Timer;

void StartTimer()
{
    m_Timer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_Timer.Run(10.0, this, "OnTimerComplete", null, false);
}

void TogglePause()
{
    if (m_Timer.IsPaused())
        m_Timer.Continue();
    else
        m_Timer.Pause();
}
```

### GetRemaining

```c
float GetRemaining();
```

Возвращает оставшееся время в секундах.

### GetDuration

```c
float GetDuration();
```

Возвращает общую длительность, установленную через `Run()`.

---

## ScriptInvoker

**Файл:** `3_Game/tools/utilityclasses.c`

Система событий/делегатов. `ScriptInvoker` хранит список функций обратного вызова и вызывает их все при вызове `Invoke()`. Это аналог событий C# или паттерна наблюдатель в DayZ.

### Insert

```c
void Insert(func fn);
```

Регистрация функции обратного вызова.

### Remove

```c
void Remove(func fn);
```

Снятие регистрации функции обратного вызова.

### Invoke

```c
void Invoke(void param1 = NULL, void param2 = NULL,
            void param3 = NULL, void param4 = NULL);
```

Вызов всех зарегистрированных функций с указанными параметрами.

### Count

```c
int Count();
```

Количество зарегистрированных обратных вызовов.

### Clear

```c
void Clear();
```

Удаление всех зарегистрированных обратных вызовов.

**Пример --- система пользовательских событий:**

```c
class MyModule
{
    ref ScriptInvoker m_OnMissionComplete = new ScriptInvoker();

    void CompleteMission()
    {
        // Логика завершения...

        // Уведомить всех подписчиков
        m_OnMissionComplete.Invoke("MissionAlpha", 1500);
    }
}

class MyUI
{
    void Init(MyModule module)
    {
        // Подписаться на событие
        module.m_OnMissionComplete.Insert(this.OnMissionComplete);
    }

    void OnMissionComplete(string name, int reward)
    {
        Print(string.Format("Миссия %1 завершена! Награда: %2", name, reward));
    }

    void Cleanup(MyModule module)
    {
        // Всегда отписывайтесь для предотвращения висячих ссылок
        module.m_OnMissionComplete.Remove(this.OnMissionComplete);
    }
}
```

### Очередь обновлений

Движок предоставляет покадровые очереди `ScriptInvoker`:

```c
ScriptInvoker updater = GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY);
updater.Insert(this.OnFrame);

// Удалить, когда не нужно
updater.Remove(this.OnFrame);
```

Функции, зарегистрированные в очереди обновлений, вызываются каждый кадр без параметров. Это удобно для покадровой логики без использования `EntityEvent.FRAME`.

---

## WidgetFadeTimer

**Файл:** `3_Game/tools/utilityclasses.c`

Специализированный таймер для плавного появления и исчезновения виджетов.

```c
class WidgetFadeTimer
{
    void FadeIn(Widget w, float time, bool continue_from_current = false);
    void FadeOut(Widget w, float time, bool continue_from_current = false);
    bool IsFading();
    void Stop();
}
```

| Параметр | Описание |
|----------|----------|
| `w` | Виджет для затухания |
| `time` | Длительность затухания в секундах |
| `continue_from_current` | Если `true`, начать с текущей альфы; иначе начать с 0 (появление) или 1 (исчезновение) |

**Пример:**

```c
ref WidgetFadeTimer m_FadeTimer;
Widget m_NotificationPanel;

void ShowNotification()
{
    m_NotificationPanel.Show(true);
    m_FadeTimer = new WidgetFadeTimer;
    m_FadeTimer.FadeIn(m_NotificationPanel, 0.3);

    // Автоскрытие через 5 секунд
    GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(this.HideNotification, 5000, false);
}

void HideNotification()
{
    m_FadeTimer.FadeOut(m_NotificationPanel, 0.5);
}
```

---

## GetRemainingTime (CallQueue)

`ScriptCallQueue` также предоставляет возможность запросить оставшееся время у запланированного `CallLater`:

```c
float GetRemainingTime(Class obj, string fnName);
```

**Пример:**

```c
// Узнать, сколько времени осталось у CallLater
float remaining = GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).GetRemainingTime(this, "MyCallback");
if (remaining > 0)
    Print(string.Format("Обратный вызов сработает через %1 мс", remaining));
```

---

## Распространённые паттерны

### Аккумулятор таймера (дросселированный OnUpdate)

Когда есть покадровый обратный вызов, но логику нужно выполнять с меньшей частотой:

```c
class MyModule
{
    protected float m_UpdateAccumulator;
    protected const float UPDATE_INTERVAL = 2.0;  // Каждые 2 секунды

    void OnUpdate(float timeslice)
    {
        m_UpdateAccumulator += timeslice;
        if (m_UpdateAccumulator < UPDATE_INTERVAL)
            return;
        m_UpdateAccumulator = 0;

        // Дросселированная логика здесь
        DoPeriodicWork();
    }
}
```

### Паттерн очистки

Всегда удаляйте запланированные вызовы при уничтожении вашего объекта для предотвращения вылетов:

```c
class MyManager
{
    void MyManager()
    {
        GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.Tick, 1000, true);
    }

    void ~MyManager()
    {
        GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).Remove(this.Tick);
    }

    void Tick()
    {
        // Периодическая работа
    }
}
```

### Одноразовая отложенная инициализация

Распространённый паттерн для инициализации систем после полной загрузки мира:

```c
void OnMissionStart()
{
    // Задержка инициализации на 1 секунду для уверенности, что всё загружено
    GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(this.DelayedInit, 1000, false);
}

void DelayedInit()
{
    // Теперь безопасно обращаться к объектам мира
}
```

---

## Итоги

| Механизм | Применение | Единица времени |
|----------|-----------|----------------|
| `CallLater` | Одноразовые или повторяющиеся отложенные вызовы | Миллисекунды |
| `Call` | Выполнение в следующем кадре | Н/Д (немедленно) |
| `Timer` | Таймер на основе класса со стартом/стопом/остатком | Секунды |
| `ScriptInvoker` | Событие/делегат (паттерн наблюдатель) | Н/Д (ручной вызов) |
| `WidgetFadeTimer` | Плавное появление/исчезновение виджетов | Секунды |
| `GetUpdateQueue()` | Регистрация покадрового обратного вызова | Н/Д (каждый кадр) |

| Концепция | Ключевой момент |
|-----------|----------------|
| Категории | `CALL_CATEGORY_SYSTEM` (0), `GUI` (1), `GAMEPLAY` (2) |
| Удаление вызовов | Всегда `Remove()` в деструкторе для предотвращения висячих ссылок |
| Timer vs CallLater | Timer --- секунды + на основе класса; CallLater --- миллисекунды + функциональный |
| ScriptInvoker | Insert/Remove для обратных вызовов, Invoke для вызова всех |

---

## Лучшие практики

- **Всегда вызывайте `Remove()` для запланированных `CallLater` в деструкторе.** Если владеющий объект уничтожен, пока `CallLater` ещё ожидает, движок вызовет метод на удалённом объекте и произойдёт вылет. Каждый `CallLater` должен иметь соответствующий `Remove()` в деструкторе.
- **Используйте `Timer` (секунды) для долгоживущих таймеров с паузой/возобновлением, `CallLater` (миллисекунды) для одноразовых задержек.** Путаница между ними приводит к ошибкам тайминга на 1000x, так как `Timer.Run()` использует секунды, а `CallLater` --- миллисекунды.
- **Дросселируйте `OnUpdate` аккумулятором таймера вместо повторяющегося `CallLater`.** `CallLater` с повтором создаёт отдельную отслеживаемую запись в очереди, тогда как паттерн аккумулятора (`m_Acc += timeslice; if (m_Acc >= INTERVAL)`) не имеет накладных расходов и легче настраивается.
- **Отписывайте обратные вызовы `ScriptInvoker` до уничтожения слушателя.** Если забыть вызвать `Remove()` у `ScriptInvoker`, остаётся висячая ссылка на функцию, которая вызывает вылет при срабатывании `Invoke()`.
- **Никогда не вызывайте `Tick()` вручную на `ScriptCallQueue`.** Движок вызывает его автоматически каждый кадр. Ручные вызовы дублируют срабатывание всех ожидающих обратных вызовов.

---

## Совместимость и влияние

> **Совместимость модов:** Системы таймеров индивидуальны для экземпляров, поэтому моды редко конфликтуют на таймерах напрямую. Риск заключается в общих событиях `ScriptInvoker`, где несколько модов регистрируют обратные вызовы.

- **Порядок загрузки:** Системы Timer и CallQueue не зависят от порядка загрузки. Каждый мод управляет своими собственными таймерами.
- **Конфликты modded-классов:** Прямых конфликтов нет, но если два мода переопределяют `OnUpdate()` на одном классе (напр., `MissionServer`) и один забывает `super`, аккумуляторные таймеры другого перестают работать.
- **Влияние на производительность:** Каждый активный `CallLater` с `repeat = true` проверяется каждый кадр. Сотни повторяющихся вызовов ухудшают серверный тикрейт. Предпочитайте меньше таймеров с большими интервалами или паттерн аккумулятора в `OnUpdate`.
- **Сервер/Клиент:** `CallLater` и `Timer` работают на обеих сторонах. Используйте `CALL_CATEGORY_GAMEPLAY` для игровой логики, `CALL_CATEGORY_GUI` для обновлений UI (только клиент) и `CALL_CATEGORY_SYSTEM` для низкоуровневых операций.

---

## Примеры из реальных модов

> Эти паттерны подтверждены изучением исходного кода профессиональных модов DayZ.

| Паттерн | Мод | Файл/Расположение |
|---------|-----|-------------------|
| Очистка `Remove()` в деструкторе для каждой регистрации `CallLater` | COT | Жизненный цикл менеджера модулей |
| Шина событий `ScriptInvoker` для межмодульных уведомлений | Expansion | `ExpansionEventBus` |
| `Timer` с `Pause()`/`Continue()` для таймера выхода из игры | Vanilla | Система выхода `MissionServer` |
| Паттерн аккумулятора в `OnUpdate` для периодических проверок каждые 5 секунд | Dabs Framework | Планирование тиков модулей |

---

[<< Предыдущая: Уведомления](06-notifications.md) | **Таймеры и CallQueue** | [Следующая: Файловый ввод-вывод и JSON >>](08-file-io.md)
