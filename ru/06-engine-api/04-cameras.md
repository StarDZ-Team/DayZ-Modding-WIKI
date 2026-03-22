# Глава 6.4: Система камер

[Главная](../README.md) | [<< Предыдущая: Погода](03-weather.md) | **Камеры** | [Следующая: Постобработка >>](05-ppe.md)

---

## Введение

DayZ использует многоуровневую систему камер. Камера игрока управляется движком через подклассы `DayZPlayerCamera`. Для моддинга и отладки доступна `FreeDebugCamera`, позволяющая свободный полёт. Движок также предоставляет глобальные аксессоры для получения текущего состояния камеры. В этой главе рассматриваются типы камер, способы доступа к данным камеры и использование инструментов скриптовых камер.

---

## Текущее состояние камеры (глобальные аксессоры)

Эти методы доступны из любого места и возвращают состояние активной камеры независимо от её типа:

```c
// Текущая мировая позиция камеры
proto native vector GetGame().GetCurrentCameraPosition();

// Текущее направление камеры (единичный вектор)
proto native vector GetGame().GetCurrentCameraDirection();

// Преобразование мировой позиции в экранные координаты
proto native vector GetGame().GetScreenPos(vector world_pos);
// Возвращает: x = экранный X (пиксели), y = экранный Y (пиксели), z = глубина (расстояние от камеры)
```

**Пример --- проверка, находится ли позиция на экране:**

```c
bool IsPositionOnScreen(vector worldPos)
{
    vector screenPos = GetGame().GetScreenPos(worldPos);

    // z < 0 означает, что точка за камерой
    if (screenPos[2] < 0)
        return false;

    int screenW, screenH;
    GetScreenSize(screenW, screenH);

    return (screenPos[0] >= 0 && screenPos[0] <= screenW &&
            screenPos[1] >= 0 && screenPos[1] <= screenH);
}
```

**Пример --- получение расстояния от камеры до точки:**

```c
float DistanceFromCamera(vector worldPos)
{
    return vector.Distance(GetGame().GetCurrentCameraPosition(), worldPos);
}
```

---

## Система DayZPlayerCamera

Камеры игрока в DayZ --- это нативные классы, управляемые контроллером игрока в движке. Они не создаются напрямую из скрипта --- вместо этого движок выбирает подходящую камеру на основе состояния игрока (стоя, лёжа, плавание, транспорт, без сознания и т.д.).

### Типы камер (константы DayZPlayerCameras)

Идентификаторы типов камер определены как константы:

| Константа | Описание |
|-----------|----------|
| `DayZPlayerCameras.DAYZCAMERA_1ST` | Камера от первого лица |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC` | Третье лицо стоя |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO` | Третье лицо в приседе |
| `DayZPlayerCameras.DAYZCAMERA_3RD_PRO` | Третье лицо лёжа |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_SPR` | Третье лицо в спринте |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_RAISED` | Третье лицо с поднятым оружием |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO_RAISED` | Третье лицо в приседе с поднятым оружием |
| `DayZPlayerCameras.DAYZCAMERA_IRONSIGHTS` | Прицеливание через мушку |
| `DayZPlayerCameras.DAYZCAMERA_OPTICS` | Прицеливание через оптику |
| `DayZPlayerCameras.DAYZCAMERA_3RD_VEHICLE` | Третье лицо в транспорте |
| `DayZPlayerCameras.DAYZCAMERA_1ST_VEHICLE` | Первое лицо в транспорте |
| `DayZPlayerCameras.DAYZCAMERA_3RD_SWIM` | Третье лицо при плавании |
| `DayZPlayerCameras.DAYZCAMERA_3RD_UNCONSCIOUS` | Третье лицо без сознания |
| `DayZPlayerCameras.DAYZCAMERA_1ST_UNCONSCIOUS` | Первое лицо без сознания |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CLIMB` | Третье лицо при подъёме |
| `DayZPlayerCameras.DAYZCAMERA_3RD_JUMP` | Третье лицо в прыжке |

### Получение текущего типа камеры

```c
DayZPlayer player = GetGame().GetPlayer();
if (player)
{
    int cameraType = player.GetCurrentCameraType();
    if (cameraType == DayZPlayerCameras.DAYZCAMERA_1ST)
    {
        Print("Игрок в режиме от первого лица");
    }
}
```

---

## FreeDebugCamera

**Файл:** `5_Mission/gui/scriptconsole/freedebugcamera.c`

Камера свободного полёта, используемая для отладки и создания кинематографических сцен. Доступна в диагностических сборках или при активации модами.

### Доступ к экземпляру

```c
FreeDebugCamera GetFreeDebugCamera();
```

Эта глобальная функция возвращает единственный экземпляр свободной камеры (или null, если он не существует).

### Основные методы

```c
// Включение/выключение свободной камеры
static void SetActive(bool active);
static bool GetActive();

// Позиция и ориентация
vector GetPosition();
void   SetPosition(vector pos);
vector GetOrientation();
void   SetOrientation(vector ori);   // рыскание, тангаж, крен

// Скорость
void SetFlySpeed(float speed);
float GetFlySpeed();

// Направление камеры
vector GetDirection();
```

**Пример --- активация свободной камеры и телепортация:**

```c
void ActivateDebugCamera(vector pos)
{
    FreeDebugCamera.SetActive(true);

    FreeDebugCamera cam = GetFreeDebugCamera();
    if (cam)
    {
        cam.SetPosition(pos);
        cam.SetOrientation(Vector(0, -30, 0));  // Смотреть немного вниз
        cam.SetFlySpeed(10.0);
    }
}
```

---

## Поле зрения (FOV)

Движок управляет FOV нативно. Вы можете читать и изменять его через систему камер игрока:

### Чтение FOV

```c
// Получение текущего FOV камеры
float fov = GetDayZGame().GetFieldOfView();
```

### Переопределение FOV в DayZPlayerCamera

В пользовательских классах камер, наследующих `DayZPlayerCamera`, можно переопределить FOV:

```c
class MyCustomCamera extends DayZPlayerCamera1stPerson
{
    override float GetCurrentFOV()
    {
        return 0.7854;  // ~45 градусов (в радианах)
    }
}
```

---

## Глубина резкости (DOF)

Глубина резкости контролируется через систему постобработки (см. [Главу 6.5](05-ppe.md)). Однако система камер работает с DOF через следующие механизмы:

### Установка DOF через World

```c
World world = GetGame().GetWorld();
if (world)
{
    // SetDOF(расстояние_фокуса, длина_фокуса, длина_фокуса_ближняя, размытие, смещение_глубины_фокуса)
    // Все значения в метрах
    world.SetDOF(5.0, 100.0, 0.5, 0.3, 0.0);
}
```

### Отключение DOF

```c
World world = GetGame().GetWorld();
if (world)
{
    world.SetDOF(0, 0, 0, 0, 0);  // Все нули отключают DOF
}
```

---

## ScriptCamera (GameLib)

**Файл:** `2_GameLib/entities/scriptcamera.c`

Низкоуровневая скриптовая сущность камеры из слоя GameLib. Это базовый класс для пользовательских реализаций камер.

### Создание камеры

```c
ScriptCamera camera = ScriptCamera.Cast(
    GetGame().CreateObject("ScriptCamera", pos, true)  // только локально
);
```

### Основные методы

```c
proto native void SetFOV(float fov);          // FOV в радианах
proto native void SetNearPlane(float nearPlane);
proto native void SetFarPlane(float farPlane);
proto native void SetFocus(float dist, float len);
```

### Активация камеры

```c
// Сделать эту камеру активной камерой рендеринга
GetGame().SelectPlayer(null, null);   // Отсоединить от игрока
GetGame().ObjectRelease(camera);      // Передать движку
```

> **Примечание:** Переключение с камеры игрока требует аккуратной обработки ввода и HUD. Большинство модов используют свободную отладочную камеру или эффекты постобработки вместо создания пользовательских камер.

---

## Рейкастинг из камеры

Распространённый паттерн --- выполнение рейкаста из позиции камеры в направлении камеры для определения того, на что смотрит игрок:

```c
Object GetObjectInCrosshair(float maxDistance)
{
    vector from = GetGame().GetCurrentCameraPosition();
    vector to = from + (GetGame().GetCurrentCameraDirection() * maxDistance);

    vector contactPos;
    vector contactDir;
    int contactComponent;
    set<Object> hitObjects = new set<Object>;

    if (DayZPhysics.RaycastRV(from, to, contactPos, contactDir,
                               contactComponent, hitObjects, null, null,
                               false, false, ObjIntersectView, 0.0))
    {
        if (hitObjects.Count() > 0)
            return hitObjects[0];
    }

    return null;
}
```

---

## Итоги

| Концепция | Ключевой момент |
|-----------|----------------|
| Глобальные аксессоры | `GetCurrentCameraPosition()`, `GetCurrentCameraDirection()`, `GetScreenPos()` |
| Типы камер | Константы `DayZPlayerCameras` (1ST, 3RD_ERC, IRONSIGHTS, OPTICS, VEHICLE и т.д.) |
| Текущий тип | `player.GetCurrentCameraType()` |
| Свободная камера | `FreeDebugCamera.SetActive(true)`, затем `GetFreeDebugCamera()` |
| FOV | `GetDayZGame().GetFieldOfView()` для чтения, переопределение `GetCurrentFOV()` в классе камеры |
| DOF | `GetGame().GetWorld().SetDOF(фокус, длина, ближняя, размытие, смещение)` |
| Экранные координаты | `GetScreenPos(worldPos)` возвращает пиксельные XY + глубину Z |

---

## Лучшие практики

- **Кэшируйте позицию камеры при множественных запросах в одном кадре.** `GetGame().GetCurrentCameraPosition()` и `GetCurrentCameraDirection()` --- это вызовы движка. Сохраняйте результат в локальную переменную, если он нужен в нескольких вычислениях в одном кадре.
- **Используйте проверку глубины `GetScreenPos()` перед размещением UI.** Всегда проверяйте `screenPos[2] > 0` (перед камерой) перед отрисовкой HUD-маркеров в мировых позициях, иначе маркеры будут отображаться зеркально за игроком.
- **Избегайте создания пользовательских экземпляров ScriptCamera для простых эффектов.** FreeDebugCamera и система PPE покрывают большинство кинематографических и визуальных потребностей. Пользовательские камеры требуют аккуратного управления вводом/HUD, что легко сломать.
- **Уважайте переходы типов камер в движке.** Не переключайте тип камеры из скрипта принудительно, если вы полностью не обрабатываете состояние контроллера игрока. Неожиданные переключения камеры могут заблокировать движение игрока или вызвать рассинхронизацию.
- **Защищайте использование свободной камеры проверками администратора/отладки.** FreeDebugCamera предоставляет возможность осмотра мира без ограничений. Включайте её только для авторизованных администраторов или диагностических сборок во избежание злоупотреблений.

---

## Совместимость и влияние

- **Мультимод:** Аксессоры камеры --- это глобальные функции только для чтения, поэтому несколько модов могут безопасно читать состояние камеры одновременно. Конфликты возникают только если два мода пытаются активировать FreeDebugCamera или пользовательские экземпляры ScriptCamera.
- **Производительность:** `GetScreenPos()` и `GetCurrentCameraPosition()` --- лёгкие вызовы движка. Рейкастинг из камеры (`DayZPhysics.RaycastRV`) более затратен --- ограничивайте его одним разом за кадр, а не за каждую сущность.
- **Сервер/Клиент:** Состояние камеры существует только на клиенте. Все методы камеры возвращают бессмысленные данные на выделенном сервере. Никогда не используйте запросы камеры в серверной логике.

---

[<< Предыдущая: Погода](03-weather.md) | **Камеры** | [Следующая: Постобработка >>](05-ppe.md)
