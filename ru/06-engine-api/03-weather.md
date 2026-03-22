# Глава 6.3: Система погоды

[Главная](../README.md) | [<< Предыдущая: Транспорт](02-vehicles.md) | **Погода** | [Следующая: Камеры >>](04-cameras.md)

---

## Введение

DayZ имеет полностью динамическую систему погоды, управляемую через класс `Weather`. Система управляет облачностью, дождём, снегопадом, туманом, ветром и грозами. Погоду можно настраивать через скрипт (API Weather), через `cfgweather.xml` в папке миссии или через скриптовую машину состояний погоды. В этой главе описан скриптовый API для чтения и программного управления погодой.

---

## Доступ к объекту Weather

```c
Weather weather = GetGame().GetWeather();
```

Объект `Weather` --- это синглтон, управляемый движком. Он всегда доступен после инициализации игрового мира.

---

## Погодные явления

Каждое погодное явление (облачность, туман, дождь, снегопад, сила ветра, направление ветра) представлено объектом `WeatherPhenomenon`. Доступ к ним осуществляется через методы-геттеры объекта `Weather`.

### Получение объектов явлений

```c
proto native WeatherPhenomenon GetOvercast();
proto native WeatherPhenomenon GetFog();
proto native WeatherPhenomenon GetRain();
proto native WeatherPhenomenon GetSnowfall();
proto native WeatherPhenomenon GetWindMagnitude();
proto native WeatherPhenomenon GetWindDirection();
```

### API WeatherPhenomenon

Каждое явление имеет одинаковый интерфейс:

```c
class WeatherPhenomenon
{
    // Текущее состояние
    proto native float GetActual();          // Текущее интерполированное значение (0.0 - 1.0 для большинства)
    proto native float GetForecast();        // Целевое значение, к которому идёт интерполяция
    proto native float GetDuration();        // Длительность текущего прогноза (секунды)

    // Установка прогноза (только сервер)
    proto native void Set(float forecast, float time = 0, float minDuration = 0);
    // forecast: целевое значение
    // time:     секунды интерполяции к этому значению (0 = мгновенно)
    // minDuration: минимальное время удержания значения перед автоматическим изменением

    // Пределы
    proto native void  SetLimits(float fnMin, float fnMax);
    proto native float GetMin();
    proto native float GetMax();

    // Пределы скорости изменения (насколько быстро явление может меняться)
    proto native void SetTimeLimits(float fnMin, float fnMax);

    // Пределы величины изменения
    proto native void SetChangeLimits(float fnMin, float fnMax);
}
```

**Пример --- чтение текущего состояния погоды:**

```c
Weather w = GetGame().GetWeather();
float overcast  = w.GetOvercast().GetActual();
float rain      = w.GetRain().GetActual();
float fog       = w.GetFog().GetActual();
float snow      = w.GetSnowfall().GetActual();
float windSpeed = w.GetWindMagnitude().GetActual();
float windDir   = w.GetWindDirection().GetActual();

Print(string.Format("Облачность: %1, Дождь: %2, Туман: %3", overcast, rain, fog));
```

**Пример --- принудительная ясная погода (сервер):**

```c
void ForceClearWeather()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(0.0, 30, 600);    // Ясное небо, переход 30 сек, удержание 10 мин
    w.GetRain().Set(0.0, 10, 600);        // Без дождя
    w.GetFog().Set(0.0, 30, 600);         // Без тумана
    w.GetSnowfall().Set(0.0, 10, 600);    // Без снега
}
```

**Пример --- создание шторма:**

```c
void ForceStorm()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(1.0, 60, 1800);   // Полная облачность, нарастание 60 сек, удержание 30 мин
    w.GetRain().Set(0.8, 120, 1800);      // Сильный дождь
    w.GetFog().Set(0.3, 120, 1800);       // Лёгкий туман
    w.GetWindMagnitude().Set(15.0, 60, 1800);  // Сильный ветер (м/с)
}
```

---

## Пороги дождя

Дождь привязан к уровню облачности. Движок рендерит дождь только когда облачность превышает порог. Это можно настроить через `cfgweather.xml`:

```xml
<rain>
    <thresholds min="0.5" max="1.0" end="120" />
</rain>
```

- `min` / `max`: диапазон облачности, при котором дождь разрешён
- `end`: секунды до прекращения дождя, если облачность падает ниже порога

В скрипте дождь визуально не появится, если облачность слишком низкая, даже если `GetRain().GetActual()` возвращает ненулевое значение.

---

## Ветер

Ветер использует два явления: величина (скорость в м/с) и направление (угол в радианах).

### Вектор ветра

```c
proto native vector GetWind();           // Вектор направления ветра (мировые координаты)
proto native float  GetWindSpeed();      // Скорость ветра в м/с
```

**Пример --- получение информации о ветре:**

```c
Weather w = GetGame().GetWeather();
vector windVec = w.GetWind();
float windSpd = w.GetWindSpeed();
Print(string.Format("Ветер: %1 м/с, направление: %2", windSpd, windVec));
```

---

## Грозы (молнии)

```c
proto native void SetStorm(float density, float threshold, float timeout);
```

| Параметр | Описание |
|----------|----------|
| `density` | Плотность молний (0.0 - 1.0) |
| `threshold` | Минимальный уровень облачности для появления молний (0.0 - 1.0) |
| `timeout` | Секунды между ударами молний |

**Пример --- включение частых молний:**

```c
GetGame().GetWeather().SetStorm(1.0, 0.6, 10);
// Полная плотность, срабатывает при 60% облачности, удары каждые 10 секунд
```

---

## Управление MissionWeather

Для ручного управления погодой (отключения автоматической машины состояний погоды) вызовите:

```c
proto native void MissionWeather(bool use);
```

Когда вызван `MissionWeather(true)`, движок прекращает автоматические переходы погоды и только ваши скриптовые вызовы `Set()` управляют погодой.

**Пример --- полное ручное управление в init.c:**

```c
void main()
{
    // Взять ручное управление погодой
    GetGame().GetWeather().MissionWeather(true);

    // Установить нужную погоду
    GetGame().GetWeather().GetOvercast().Set(0.3, 0, 0);
    GetGame().GetWeather().GetRain().Set(0.0, 0, 0);
    GetGame().GetWeather().GetFog().Set(0.1, 0, 0);
}
```

---

## Дата и время

Дата и время в игре влияют на освещение, положение солнца и цикл дня/ночи. Они управляются через объект `World`, а не `Weather`, но тесно связаны.

### Получение текущей даты/времени

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
```

### Установка даты/времени (только сервер)

```c
proto native void SetDate(int year, int month, int day, int hour, int minute);
```

**Пример --- установка полудня:**

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
GetGame().GetWorld().SetDate(year, month, day, 12, 0);
```

### Ускорение времени

Ускорение времени настраивается в `serverDZ.cfg` через:

```
serverTimeAcceleration = 12;      // 12x реальное время
serverNightTimeAcceleration = 4;  // 4x ускорение ночью
```

В скрипте можно прочитать текущий множитель времени, но обычно его нельзя изменить во время выполнения.

---

## Машина состояний погоды WorldData

Ванильный DayZ использует скриптовую машину состояний погоды в классах `WorldData` (напр., `ChernarusPlusData`, `EnochData`, `SakhalData`). Ключевая точка переопределения:

```c
class WorldData
{
    void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual, float change,
                                float time);
}
```

Переопределите этот метод в `modded`-классе WorldData для перехвата и изменения переходов погоды:

```c
modded class ChernarusPlusData
{
    override void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual,
                                         float change, float time)
    {
        super.WeatherOnBeforeChange(type, actual, change, time);

        // Не допускать дождь выше 0.5
        if (type == EWeatherPhenomenon.RAIN && change > 0.5)
        {
            GetGame().GetWeather().GetRain().Set(0.5, time, 300);
        }
    }
}
```

---

## cfgweather.xml

Файл `cfgweather.xml` в папке миссии предоставляет декларативный способ настройки погоды без скриптинга. При наличии он переопределяет параметры машины состояний погоды по умолчанию.

Основная структура:

```xml
<weather reset="0" enable="1">
    <overcast>
        <current actual="0.45" time="120" duration="240" />
        <limits min="0.0" max="1.0" />
        <timelimits min="900" max="1800" />
        <changelimits min="0.0" max="1.0" />
    </overcast>
    <fog>...</fog>
    <rain>
        ...
        <thresholds min="0.5" max="1.0" end="120" />
    </rain>
    <snowfall>...</snowfall>
    <windMagnitude>...</windMagnitude>
    <windDirection>...</windDirection>
    <storm density="1.0" threshold="0.7" timeout="25"/>
</weather>
```

| Атрибут | Описание |
|---------|----------|
| `reset` | Сбрасывать ли погоду из хранилища при старте сервера |
| `enable` | Активен ли этот файл |
| `actual` | Начальное значение |
| `time` | Секунды для достижения начального значения |
| `duration` | Секунды удержания начального значения |
| `limits min/max` | Диапазон значения явления |
| `timelimits min/max` | Диапазон длительности перехода (секунды) |
| `changelimits min/max` | Диапазон величины изменения за переход |

---

## Итоги

| Концепция | Ключевой момент |
|-----------|----------------|
| Доступ | `GetGame().GetWeather()` возвращает синглтон `Weather` |
| Явления | `GetOvercast()`, `GetRain()`, `GetFog()`, `GetSnowfall()`, `GetWindMagnitude()`, `GetWindDirection()` |
| Чтение | `phenomenon.GetActual()` для текущего значения (0.0 - 1.0) |
| Запись | `phenomenon.Set(прогноз, времяПерехода, длительностьУдержания)` (только сервер) |
| Грозы | `SetStorm(плотность, порог, интервал)` |
| Ручной режим | `MissionWeather(true)` отключает автоматические изменения погоды |
| Дата/Время | `GetGame().GetWorld().GetDate()` / `SetDate()` |
| Конфиг-файл | `cfgweather.xml` в папке миссии для декларативной настройки |

---

## Лучшие практики

- **Вызывайте `MissionWeather(true)` перед установкой погоды в `init.c`.** Без этого автоматическая машина состояний погоды переопределит ваши вызовы `Set()` в течение секунд. Всегда берите ручное управление, если хотите детерминированную погоду.
- **Всегда указывайте параметр `minDuration` в `Set()`.** Установка `minDuration` в 0 означает, что система погоды может мгновенно перейти от вашего значения. Используйте минимум 300-600 секунд для удержания желаемого состояния.
- **Устанавливайте облачность перед дождём.** Дождь визуально привязан к порогам облачности. Если облачность ниже порога, настроенного в `cfgweather.xml`, дождь не будет рендериться, даже если `GetRain().GetActual()` возвращает ненулевое значение.
- **Используйте `WeatherOnBeforeChange()` для серверной политики погоды.** Переопределите его в `modded class ChernarusPlusData` (или соответствующем подклассе WorldData) для ограничения или перенаправления переходов погоды без борьбы с машиной состояний.
- **Читайте погоду на обеих сторонах, записывайте только на сервере.** `GetActual()` и `GetForecast()` работают на клиенте и сервере, но `Set()` действует только на сервере.

---

## Совместимость и влияние

> **Совместимость модов:** Моды погоды часто переопределяют `WeatherOnBeforeChange()` в подклассах WorldData. Только одна цепочка переопределений запускается для каждого класса WorldData карты.

- **Порядок загрузки:** Если несколько модов переопределяют `WeatherOnBeforeChange` для одного и того же подкласса WorldData (напр., `ChernarusPlusData`), все должны вызывать `super`, иначе предыдущие моды потеряют свою логику погоды.
- **Конфликты modded-классов:** Если один мод вызывает `MissionWeather(true)`, а другой ожидает автоматическую погоду, они принципиально несовместимы. Документируйте, берёт ли ваш мод ручное управление погодой.
- **Влияние на производительность:** Вызовы API погоды легковесны. Интерполяция явлений выполняется в движке, а не в скрипте. Частые вызовы `Set()` (каждый кадр) расточительны, но не вредны.
- **Сервер/Клиент:** Все вызовы `Set()` работают только на сервере. Клиенты получают состояние погоды через автоматическую синхронизацию движка. Клиентские вызовы `Set()` молча игнорируются.

---

## Примеры из реальных модов

> Эти паттерны подтверждены изучением исходного кода профессиональных модов DayZ.

| Паттерн | Мод | Файл/Расположение |
|---------|-----|-------------------|
| `MissionWeather(true)` + скриптовый цикл погоды с `CallLater` | Expansion | Контроллер погоды в инициализации миссии |
| Переопределение `WeatherOnBeforeChange` для предотвращения дождя в определённых зонах | COT Weather Module | Modded `ChernarusPlusData` |
| Команда администратора для принудительной ясной/штормовой погоды через `Set()` с длительным удержанием | VPP Admin Tools | Панель администратора погоды |
| `cfgweather.xml` с пользовательскими порогами для карт только со снегом | Namalsk | Конфиг в папке миссии |

---

[<< Предыдущая: Транспорт](02-vehicles.md) | **Погода** | [Следующая: Камеры >>](04-cameras.md)
