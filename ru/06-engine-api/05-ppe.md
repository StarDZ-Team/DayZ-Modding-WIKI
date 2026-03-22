# Глава 6.5: Эффекты постобработки (PPE)

[Главная](../README.md) | [<< Предыдущая: Камеры](04-cameras.md) | **Эффекты постобработки** | [Следующая: Уведомления >>](06-notifications.md)

---

## Введение

Система постобработки (PPE) в DayZ управляет визуальными эффектами, применяемыми после рендеринга сцены: размытие, цветокоррекция, виньетка, хроматическая аберрация, ночное видение и многое другое. Система построена на классах `PPERequester`, которые запрашивают определённые визуальные эффекты. Одновременно могут быть активны несколько запросчиков, и движок смешивает их вклады. В этой главе описано, как использовать систему PPE в модах.

---

## Обзор архитектуры

```
PPEManager
├── PPERequesterBank              // Статический реестр всех доступных запросчиков
│   ├── REQ_INVENTORYBLUR         // Размытие инвентаря
│   ├── REQ_MENUEFFECTS           // Эффекты меню
│   ├── REQ_CONTROLLERDISCONNECT  // Наложение при отключении контроллера
│   ├── REQ_UNCONSCIOUS           // Эффект потери сознания
│   ├── REQ_FEVEREFFECTS          // Визуальные эффекты лихорадки
│   ├── REQ_FLASHBANGEFFECTS      // Ослепление
│   ├── REQ_BURLAPSACK            // Мешок на голове
│   ├── REQ_DEATHEFFECTS          // Экран смерти
│   ├── REQ_BLOODLOSS             // Обесцвечивание при потере крови
│   └── ... (и многие другие)
└── PPERequester_*                // Реализации отдельных запросчиков
```

---

## PPEManager

`PPEManager` --- это синглтон, координирующий все активные PPE-запросы. Обычно вы не взаимодействуете с ним напрямую --- вместо этого работаете через подклассы `PPERequester`.

```c
// Получение экземпляра менеджера
PPEManager GetPPEManager();
```

---

## PPERequesterBank

**Файл:** `3_Game/PPE/pperequesterbank.c`

Статический реестр, содержащий экземпляры всех PPE-запросчиков. Доступ к конкретным запросчикам осуществляется по константному индексу.

### Получение запросчика

```c
// Получение запросчика по константе банка
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
```

### Распространённые константы запросчиков

| Константа | Эффект |
|-----------|--------|
| `REQ_INVENTORYBLUR` | Гауссово размытие при открытом инвентаре |
| `REQ_MENUEFFECTS` | Размытие фона меню |
| `REQ_UNCONSCIOUS` | Визуал потери сознания (размытие + обесцвечивание) |
| `REQ_DEATHEFFECTS` | Экран смерти (оттенки серого + виньетка) |
| `REQ_BLOODLOSS` | Обесцвечивание при потере крови |
| `REQ_FEVEREFFECTS` | Хроматическая аберрация при лихорадке |
| `REQ_FLASHBANGEFFECTS` | Засвечивание от светошумовой гранаты |
| `REQ_BURLAPSACK` | Повязка из мешковины |
| `REQ_PAINBLUR` | Эффект размытия от боли |
| `REQ_CONTROLLERDISCONNECT` | Наложение при отключении контроллера |
| `REQ_CAMERANV` | Ночное видение |
| `REQ_FILMGRAINEFFECTS` | Наложение зернистости плёнки |
| `REQ_RAINEFFECTS` | Эффекты дождя на экране |
| `REQ_COLORSETTING` | Настройки цветокоррекции |

---

## Базовый класс PPERequester

Все PPE-запросчики наследуют от `PPERequester`:

```c
class PPERequester : Managed
{
    // Запуск эффекта
    void Start(Param par = null);

    // Остановка эффекта
    void Stop(Param par = null);

    // Проверка активности
    bool IsActiveRequester();

    // Установка значений параметров материалов
    void SetTargetValueFloat(int mat_id, int param_idx, bool relative,
                              float val, int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueColor(int mat_id, int param_idx, bool relative,
                              float val1, float val2, float val3, float val4,
                              int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueBool(int mat_id, int param_idx, bool relative,
                             bool val, int priority_layer, int operator = PPOperators.SET);
    void SetTargetValueInt(int mat_id, int param_idx, bool relative,
                            int val, int priority_layer, int operator = PPOperators.SET);
}
```

### PPOperators

```c
class PPOperators
{
    static const int SET          = 0;  // Установить значение напрямую
    static const int ADD          = 1;  // Добавить к текущему значению
    static const int ADD_RELATIVE = 2;  // Добавить относительно текущего
    static const int HIGHEST      = 3;  // Использовать наибольшее из текущего и нового
    static const int LOWEST       = 4;  // Использовать наименьшее из текущего и нового
    static const int MULTIPLY     = 5;  // Умножить текущее значение
    static const int OVERRIDE     = 6;  // Принудительное переопределение
}
```

---

## Распространённые идентификаторы материалов PPE

Эффекты нацелены на конкретные материалы постобработки. Распространённые идентификаторы:

| Константа | Материал |
|-----------|----------|
| `PostProcessEffectType.Glow` | Свечение / блум |
| `PostProcessEffectType.FilmGrain` | Зернистость плёнки |
| `PostProcessEffectType.RadialBlur` | Радиальное размытие |
| `PostProcessEffectType.ChromAber` | Хроматическая аберрация |
| `PostProcessEffectType.WetEffect` | Эффект мокрой линзы |
| `PostProcessEffectType.ColorGrading` | Цветокоррекция / LUT |
| `PostProcessEffectType.DepthOfField` | Глубина резкости |
| `PostProcessEffectType.SSAO` | Экранная окклюзия окружающего пространства |
| `PostProcessEffectType.GodRays` | Объёмный свет |
| `PostProcessEffectType.Rain` | Дождь на экране |
| `PostProcessEffectType.Vignette` | Виньетка |
| `PostProcessEffectType.HBAO` | Окклюзия на основе горизонта |

---

## Использование встроенных запросчиков

### Размытие инвентаря

Простейший пример --- размытие, появляющееся при открытии инвентаря:

```c
// Запуск размытия
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Остановка размытия
blurReq.Stop();
```

### Эффект светошумовой гранаты

```c
PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
flashReq.Start();

// Остановка через задержку
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(StopFlashbang, 3000, false);

void StopFlashbang()
{
    PPERequester flashReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_FLASHBANGEFFECTS);
    flashReq.Stop();
}
```

---

## Создание пользовательского PPE-запросчика

Для создания собственных эффектов постобработки наследуйте `PPERequester` и зарегистрируйте его.

### Шаг 1: Определение запросчика

```c
class MyCustomPPERequester extends PPERequester
{
    override protected void OnStart(Param par = null)
    {
        super.OnStart(par);

        // Применение сильной виньетки
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.8, PPEManager.L_0_STATIC, PPOperators.SET);

        // Обесцвечивание
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 0.3, PPEManager.L_0_STATIC, PPOperators.SET);
    }

    override protected void OnStop(Param par = null)
    {
        super.OnStop(par);

        // Сброс к значениям по умолчанию
        SetTargetValueFloat(PostProcessEffectType.Glow, PPEGlow.PARAM_VIGNETTE,
                            false, 0.0, PPEManager.L_0_STATIC, PPOperators.SET);
        SetTargetValueFloat(PostProcessEffectType.ColorGrading, PPEColorGrading.PARAM_SATURATION,
                            false, 1.0, PPEManager.L_0_STATIC, PPOperators.SET);
    }
}
```

### Шаг 2: Регистрация и использование

Регистрация осуществляется добавлением запросчика в банк. На практике большинство моддеров используют встроенные запросчики с изменёнными параметрами, а не создают полностью пользовательские.

---

## Ночное видение (ПНВ)

Ночное видение реализовано как PPE-эффект. Соответствующий запросчик --- `REQ_CAMERANV`:

```c
// Включение эффекта ПНВ
PPERequester nvgReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_CAMERANV);
nvgReq.Start();

// Выключение эффекта ПНВ
nvgReq.Stop();
```

Настоящие ПНВ в игре активируются через предмет NVGoggles посредством его `ComponentEnergyManager` и метода `NVGoggles.ToggleNVG()`, который внутренне управляет системой PPE.

---

## Цветокоррекция

Цветокоррекция изменяет общий цветовой вид сцены:

```c
PPERequester colorReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_COLORSETTING);
colorReq.Start();

// Регулировка насыщенности (1.0 = нормальная, 0.0 = оттенки серого, >1.0 = перенасыщенная)
colorReq.SetTargetValueFloat(PostProcessEffectType.ColorGrading,
                              PPEColorGrading.PARAM_SATURATION,
                              false, 0.5, PPEManager.L_0_STATIC,
                              PPOperators.SET);
```

---

## Эффекты размытия

### Гауссово размытие

```c
PPERequester blurReq = PPERequesterBank.GetRequester(PPERequesterBank.REQ_INVENTORYBLUR);
blurReq.Start();

// Регулировка интенсивности размытия (0.0 = нет, больше = сильнее)
blurReq.SetTargetValueFloat(PostProcessEffectType.GaussFilter,
                             PPEGaussFilter.PARAM_INTENSITY,
                             false, 0.5, PPEManager.L_0_STATIC,
                             PPOperators.SET);
```

### Радиальное размытие

```c
PPERequester req = PPERequesterBank.GetRequester(PPERequesterBank.REQ_PAINBLUR);
req.Start();

req.SetTargetValueFloat(PostProcessEffectType.RadialBlur,
                         PPERadialBlur.PARAM_POWERX,
                         false, 0.3, PPEManager.L_0_STATIC,
                         PPOperators.SET);
```

---

## Слои приоритета

Когда несколько запросчиков изменяют один и тот же параметр, слой приоритета определяет, какой из них победит:

```c
class PPEManager
{
    static const int L_0_STATIC   = 0;   // Самый низкий приоритет (статические эффекты)
    static const int L_1_VALUES   = 1;   // Динамические изменения значений
    static const int L_2_SCRIPTS  = 2;   // Эффекты, управляемые скриптами
    static const int L_3_EFFECTS  = 3;   // Игровые эффекты
    static const int L_4_OVERLAY  = 4;   // Эффекты наложения
    static const int L_LAST       = 100;  // Самый высокий приоритет (перекрывает всё)
}
```

Большие числа имеют более высокий приоритет. Используйте `PPEManager.L_LAST` для принудительного переопределения всех остальных эффектов.

---

## Итоги

| Концепция | Ключевой момент |
|-----------|----------------|
| Доступ | `PPERequesterBank.GetRequester(КОНСТАНТА)` |
| Запуск/Остановка | `requester.Start()` / `requester.Stop()` |
| Параметры | `SetTargetValueFloat(материал, параметр, относительный, значение, слой, оператор)` |
| Операторы | `PPOperators.SET`, `ADD`, `MULTIPLY`, `HIGHEST`, `LOWEST`, `OVERRIDE` |
| Частые эффекты | Размытие, виньетка, насыщенность, ПНВ, ослепление, зернистость, хроматическая аберрация |
| ПНВ | Запросчик `REQ_CAMERANV` |
| Приоритет | Слои 0-100; большее число побеждает в конфликтах |
| Пользовательские | Наследуйте `PPERequester`, переопределите `OnStart()` / `OnStop()` |

---

## Лучшие практики

- **Всегда вызывайте `Stop()` для очистки запросчика.** Невызов `Stop()` оставляет визуальный эффект постоянно активным, даже после окончания вызвавшего его условия.
- **Используйте подходящие слои приоритета.** Игровые эффекты должны использовать `L_3_EFFECTS` или выше. Использование `L_LAST` (100) перекрывает всё, включая ванильные эффекты потери сознания и смерти, что может нарушить игровой опыт.
- **Предпочитайте встроенные запросчики пользовательским.** `PPERequesterBank` уже содержит запросчики для размытия, обесцвечивания, виньетки и зернистости. Используйте их с изменёнными параметрами, прежде чем создавать пользовательский класс.
- **Тестируйте PPE-эффекты при разных условиях освещения.** Виньетка и обесцвечивание выглядят кардинально по-разному ночью и днём. Убедитесь, что ваш эффект хорошо читается в обоих крайних случаях.
- **Избегайте наложения нескольких интенсивных эффектов размытия.** Множество активных запросчиков размытия накапливаются, потенциально делая экран нечитаемым. Проверяйте `IsActiveRequester()` перед запуском дополнительных эффектов.

---

## Совместимость и влияние

- **Мультимод:** Несколько модов могут активировать PPE-запросчики одновременно. Движок смешивает их, используя слои приоритета и операторы. Конфликты возникают, когда два мода используют один и тот же уровень приоритета с `PPOperators.SET` для одного параметра --- побеждает последний записавший.
- **Производительность:** PPE-эффекты --- это проходы постобработки на GPU. Включение множества одновременных эффектов (размытие + зернистость + хроматическая аберрация + виньетка) может снизить частоту кадров на слабых GPU. Держите количество активных эффектов минимальным.
- **Сервер/Клиент:** PPE --- это исключительно клиентский рендеринг. Сервер не знает об эффектах постобработки. Никогда не привязывайте серверную логику к состоянию PPE.

---

[<< Предыдущая: Камеры](04-cameras.md) | **Эффекты постобработки** | [Следующая: Уведомления >>](06-notifications.md)
