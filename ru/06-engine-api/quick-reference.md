# Краткий справочник API движка

> Сжатый справочник на одной странице по наиболее часто используемым методам движка DayZ. Подробные объяснения и примеры см. в полных главах, ссылки на которые приведены в заголовках разделов.

---

## Содержание

- [Методы сущностей](#методы-сущностей)
- [Здоровье и урон](#здоровье-и-урон)
- [Проверка типов](#проверка-типов)
- [Инвентарь](#инвентарь)
- [Создание и удаление сущностей](#создание-и-удаление-сущностей)
- [Методы игрока](#методы-игрока)
- [Методы транспорта](#методы-транспорта)
- [Методы погоды](#методы-погоды)
- [Методы файлового ввода-вывода](#методы-файлового-ввода-вывода)
- [Методы таймеров и CallQueue](#методы-таймеров-и-callqueue)
- [Методы создания виджетов](#методы-создания-виджетов)
- [Методы RPC / Сетевое взаимодействие](#методы-rpc--сетевое-взаимодействие)
- [Математические константы и методы](#математические-константы-и-методы)
- [Методы работы с векторами](#методы-работы-с-векторами)
- [Глобальные функции](#глобальные-функции)
- [Хуки миссий](#хуки-миссий)
- [Система действий](#система-действий)

---

## Методы сущностей

*Полный справочник: [Глава 6.1: Система сущностей](01-entity-system.md)*

### Позиция и ориентация (Object)

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `GetPosition` | `vector GetPosition()` | Позиция в мире |
| `SetPosition` | `void SetPosition(vector pos)` | Установить позицию в мире |
| `GetOrientation` | `vector GetOrientation()` | Yaw, pitch, roll в градусах |
| `SetOrientation` | `void SetOrientation(vector ori)` | Установить yaw, pitch, roll |
| `GetDirection` | `vector GetDirection()` | Вектор направления вперёд |
| `SetDirection` | `void SetDirection(vector dir)` | Установить направление вперёд |
| `GetScale` | `float GetScale()` | Текущий масштаб |
| `SetScale` | `void SetScale(float scale)` | Установить масштаб |

### Трансформация (IEntity)

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `GetOrigin` | `vector GetOrigin()` | Позиция в мире (уровень движка) |
| `SetOrigin` | `void SetOrigin(vector orig)` | Установить позицию в мире (уровень движка) |
| `GetYawPitchRoll` | `vector GetYawPitchRoll()` | Вращение как yaw/pitch/roll |
| `GetTransform` | `void GetTransform(out vector mat[4])` | Полная матрица трансформации 4x3 |
| `SetTransform` | `void SetTransform(vector mat[4])` | Установить полную трансформацию |
| `VectorToParent` | `vector VectorToParent(vector vec)` | Локальное направление в мировое |
| `CoordToParent` | `vector CoordToParent(vector coord)` | Локальная точка в мировую |
| `VectorToLocal` | `vector VectorToLocal(vector vec)` | Мировое направление в локальное |
| `CoordToLocal` | `vector CoordToLocal(vector coord)` | Мировая точка в локальную |

### Иерархия (IEntity)

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `AddChild` | `void AddChild(IEntity child, int pivot, bool posOnly = false)` | Прикрепить дочернюю сущность к кости |
| `RemoveChild` | `void RemoveChild(IEntity child, bool keepTransform = false)` | Открепить дочернюю сущность |
| `GetParent` | `IEntity GetParent()` | Родительская сущность или null |
| `GetChildren` | `IEntity GetChildren()` | Первая дочерняя сущность |
| `GetSibling` | `IEntity GetSibling()` | Следующая сущность-сиблинг |

### Информация для отображения (Object)

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `GetType` | `string GetType()` | Имя класса конфига (напр., `"AKM"`) |
| `GetDisplayName` | `string GetDisplayName()` | Локализованное отображаемое имя |
| `IsKindOf` | `bool IsKindOf(string type)` | Проверка наследования конфига |

### Позиции костей (Object)

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `GetBonePositionLS` | `vector GetBonePositionLS(int pivot)` | Позиция кости в локальном пространстве |
| `GetBonePositionMS` | `vector GetBonePositionMS(int pivot)` | Позиция кости в пространстве модели |
| `GetBonePositionWS` | `vector GetBonePositionWS(int pivot)` | Позиция кости в мировом пространстве |

### Доступ к конфигу (Object)

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `ConfigGetBool` | `bool ConfigGetBool(string entry)` | Прочитать bool из конфига |
| `ConfigGetInt` | `int ConfigGetInt(string entry)` | Прочитать int из конфига |
| `ConfigGetFloat` | `float ConfigGetFloat(string entry)` | Прочитать float из конфига |
| `ConfigGetString` | `string ConfigGetString(string entry)` | Прочитать строку из конфига |
| `ConfigGetTextArray` | `void ConfigGetTextArray(string entry, out TStringArray values)` | Прочитать массив строк |
| `ConfigIsExisting` | `bool ConfigIsExisting(string entry)` | Проверить, существует ли запись конфига |

---

## Здоровье и урон

*Полный справочник: [Глава 6.1: Система сущностей](01-entity-system.md)*

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `GetHealth` | `float GetHealth(string zone, string type)` | Получить значение здоровья |
| `GetMaxHealth` | `float GetMaxHealth(string zone, string type)` | Получить максимальное здоровье |
| `SetHealth` | `void SetHealth(string zone, string type, float value)` | Установить здоровье |
| `SetHealthMax` | `void SetHealthMax(string zone, string type)` | Установить на максимум |
| `AddHealth` | `void AddHealth(string zone, string type, float value)` | Добавить здоровье |
| `DecreaseHealth` | `void DecreaseHealth(string zone, string type, float value, bool auto_delete = false)` | Уменьшить здоровье |
| `SetAllowDamage` | `void SetAllowDamage(bool val)` | Включить/отключить урон |
| `GetAllowDamage` | `bool GetAllowDamage()` | Проверить, разрешён ли урон |
| `IsAlive` | `bool IsAlive()` | Проверка жив ли (использовать на EntityAI) |
| `ProcessDirectDamage` | `void ProcessDirectDamage(int dmgType, EntityAI source, string component, string ammoType, vector modelPos, float coef = 1.0, int flags = 0)` | Применить урон (EntityAI) |

**Типичные пары зона/тип:** `("", "Health")` глобальное, `("", "Blood")` кровь игрока, `("", "Shock")` шок игрока, `("Engine", "Health")` двигатель транспорта.

---

## Проверка типов

| Метод | Класс | Описание |
|-------|-------|----------|
| `IsMan()` | Object | Это игрок? |
| `IsBuilding()` | Object | Это здание? |
| `IsTransport()` | Object | Это транспорт? |
| `IsDayZCreature()` | Object | Это существо (зомби/животное)? |
| `IsKindOf(string)` | Object | Проверка наследования конфига |
| `IsItemBase()` | EntityAI | Это предмет инвентаря? |
| `IsWeapon()` | EntityAI | Это оружие? |
| `IsMagazine()` | EntityAI | Это магазин? |
| `IsClothing()` | EntityAI | Это одежда? |
| `IsFood()` | EntityAI | Это еда? |
| `Class.CastTo(out, obj)` | Class | Безопасное приведение типа (возвращает bool) |
| `ClassName.Cast(obj)` | Class | Приведение в строке (возвращает null при неудаче) |

---

## Инвентарь

*Полный справочник: [Глава 6.1: Система сущностей](01-entity-system.md)*

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `GetInventory` | `GameInventory GetInventory()` | Получить компонент инвентаря (EntityAI) |
| `CreateInInventory` | `EntityAI CreateInInventory(string type)` | Создать предмет в грузе |
| `CreateEntityInCargo` | `EntityAI CreateEntityInCargo(string type)` | Создать предмет в грузе |
| `CreateAttachment` | `EntityAI CreateAttachment(string type)` | Создать предмет как вложение |
| `EnumerateInventory` | `void EnumerateInventory(int traversal, out array<EntityAI> items)` | Перечислить все предметы |
| `CountInventory` | `int CountInventory()` | Подсчитать предметы |
| `HasEntityInInventory` | `bool HasEntityInInventory(EntityAI item)` | Проверить наличие предмета |
| `AttachmentCount` | `int AttachmentCount()` | Количество вложений |
| `GetAttachmentFromIndex` | `EntityAI GetAttachmentFromIndex(int idx)` | Получить вложение по индексу |
| `FindAttachmentByName` | `EntityAI FindAttachmentByName(string slot)` | Получить вложение по слоту |

---

## Создание и удаление сущностей

*Полный справочник: [Глава 6.1: Система сущностей](01-entity-system.md)*

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `CreateObject` | `Object GetGame().CreateObject(string type, vector pos, bool local = false, bool ai = false, bool physics = true)` | Создать сущность |
| `CreateObjectEx` | `Object GetGame().CreateObjectEx(string type, vector pos, int flags, int rotation = RF_DEFAULT)` | Создать с флагами ECE |
| `ObjectDelete` | `void GetGame().ObjectDelete(Object obj)` | Немедленное удаление на сервере |
| `ObjectDeleteOnClient` | `void GetGame().ObjectDeleteOnClient(Object obj)` | Удаление только на клиенте |
| `Delete` | `void obj.Delete()` | Отложенное удаление (следующий кадр) |

### Распространённые флаги ECE

| Флаг | Значение | Описание |
|------|----------|----------|
| `ECE_NONE` | `0` | Без специального поведения |
| `ECE_CREATEPHYSICS` | `1024` | Создать коллизию |
| `ECE_INITAI` | `2048` | Инициализировать ИИ |
| `ECE_EQUIP` | `24576` | Создать с вложениями + грузом |
| `ECE_PLACE_ON_SURFACE` | комбинированный | Физика + путь + трассировка |
| `ECE_LOCAL` | `1073741824` | Только на клиенте (не реплицируется) |
| `ECE_NOLIFETIME` | `4194304` | Не исчезнет |
| `ECE_KEEPHEIGHT` | `524288` | Сохранять позицию Y |

---

## Методы игрока

*Полный справочник: [Глава 6.1: Система сущностей](01-entity-system.md)*

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `GetIdentity` | `PlayerIdentity GetIdentity()` | Объект идентификации игрока |
| `GetIdentity().GetName()` | `string GetName()` | Отображаемое имя Steam/платформы |
| `GetIdentity().GetId()` | `string GetId()` | Уникальный ID BI |
| `GetIdentity().GetPlainId()` | `string GetPlainId()` | ID Steam64 |
| `GetIdentity().GetPlayerId()` | `int GetPlayerId()` | ID игрока сессии |
| `GetHumanInventory().GetEntityInHands()` | `EntityAI GetEntityInHands()` | Предмет в руках |
| `GetDrivingVehicle` | `EntityAI GetDrivingVehicle()` | Управляемый транспорт |
| `IsAlive` | `bool IsAlive()` | Проверка жив ли |
| `IsUnconscious` | `bool IsUnconscious()` | Проверка без сознания |
| `IsRestrained` | `bool IsRestrained()` | Проверка связан ли |
| `IsInVehicle` | `bool IsInVehicle()` | Проверка в транспорте |
| `SpawnEntityOnGroundOnCursorDir` | `EntityAI SpawnEntityOnGroundOnCursorDir(string type, float dist)` | Создать перед игроком |

---

## Методы транспорта

*Полный справочник: [Глава 6.2: Система транспорта](02-vehicles.md)*

### Экипаж (Transport)

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `CrewSize` | `int CrewSize()` | Общее количество мест |
| `CrewMember` | `Human CrewMember(int idx)` | Получить человека на месте |
| `CrewMemberIndex` | `int CrewMemberIndex(Human member)` | Получить место человека |
| `CrewGetOut` | `void CrewGetOut(int idx)` | Принудительно высадить с места |
| `CrewDeath` | `void CrewDeath(int idx)` | Убить члена экипажа |

### Двигатель (Car)

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `EngineIsOn` | `bool EngineIsOn()` | Двигатель работает? |
| `EngineStart` | `void EngineStart()` | Запустить двигатель |
| `EngineОстановить` | `void EngineОстановить()` | Остановить двигатель |
| `EngineGetRPM` | `float EngineGetRPM()` | Текущие обороты |
| `EngineGetRPMRedline` | `float EngineGetRPMRedline()` | Обороты красной зоны |
| `GetGear` | `int GetGear()` | Текущая передача |
| `GetSpeedometer` | `float GetSpeedometer()` | Скорость в км/ч |

### Жидкости (Car)

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `GetFluidCapacity` | `float GetFluidCapacity(CarFluid fluid)` | Максимальная ёмкость |
| `GetFluidFraction` | `float GetFluidFraction(CarFluid fluid)` | Уровень заполнения 0.0-1.0 |
| `Fill` | `void Fill(CarFluid fluid, float amount)` | Добавить жидкость |
| `Leak` | `void Leak(CarFluid fluid, float amount)` | Убрать жидкость |
| `LeakAll` | `void LeakAll(CarFluid fluid)` | Слить всю жидкость |

**Перечисление CarFluid:** `FUEL`, `OIL`, `BRAKE`, `COOLANT`

### Управление (Car)

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `SetBrake` | `void SetBrake(float value, int wheel = -1)` | 0.0-1.0, -1 = все |
| `SetHandbrake` | `void SetHandbrake(float value)` | 0.0-1.0 |
| `SetSteering` | `void SetSteering(float value, bool analog = true)` | Ввод руля |
| `SetThrust` | `void SetThrust(float value, int wheel = -1)` | 0.0-1.0 газ |

---

## Методы погоды

*Полный справочник: [Глава 6.3: Система погоды](03-weather.md)*

### Доступ

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `GetGame().GetWeather()` | `Weather GetWeather()` | Получить синглтон погоды |

### Явления (Weather)

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `GetOvercast` | `WeatherPhenomenon GetOvercast()` | Облачность |
| `GetRain` | `WeatherPhenomenon GetRain()` | Дождь |
| `GetFog` | `WeatherPhenomenon GetFog()` | Туман |
| `GetSnowfall` | `WeatherPhenomenon GetSnowfall()` | Снег |
| `GetWindMagnitude` | `WeatherPhenomenon GetWindMagnitude()` | Сила ветра |
| `GetWindDirection` | `WeatherPhenomenon GetWindDirection()` | Направление ветра |
| `GetWind` | `vector GetWind()` | Вектор направления ветра |
| `GetWindSpeed` | `float GetWindSpeed()` | Скорость ветра м/с |
| `SetStorm` | `void SetStorm(float density, float threshold, float timeout)` | Настройка молний |

### WeatherPhenomenon

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `GetActual` | `float GetActual()` | Текущее интерполированное значение |
| `GetForecast` | `float GetForecast()` | Целевое значение |
| `GetDuration` | `float GetDuration()` | Оставшаяся продолжительность (секунды) |
| `Set` | `void Set(float forecast, float time = 0, float minDuration = 0)` | Установить цель (только сервер) |
| `SetLimits` | `void SetLimits(float min, float max)` | Ограничения диапазона значений |
| `SetTimeLimits` | `void SetTimeLimits(float min, float max)` | Ограничения скорости изменения |
| `SetChangeLimits` | `void SetChangeLimits(float min, float max)` | Ограничения величины изменения |

---

## Методы файлового ввода-вывода

*Полный справочник: [Глава 6.8: Файловый ввод-вывод и JSON](08-file-io.md)*

### Префиксы путей

| Префикс | Расположение | Доступен для записи |
|----------|--------------|---------------------|
| `$profile:` | Каталог профиля сервера/клиента | Да |
| `$saves:` | Каталог сохранений | Да |
| `$mission:` | Папка текущей миссии | Обычно только чтение |
| `$CurrentDir:` | Рабочий каталог | Зависит от обстоятельств |

### Операции с файлами

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `FileExist` | `bool FileExist(string path)` | Проверить, существует ли файл |
| `MakeDirectory` | `bool MakeDirectory(string path)` | Создать каталог |
| `OpenFile` | `FileHandle OpenFile(string path, FileMode mode)` | Открыть файл (0 = неудача) |
| `CloseFile` | `void CloseFile(FileHandle fh)` | Закрыть файл |
| `FPrint` | `void FPrint(FileHandle fh, string text)` | Записать текст (без перевода строки) |
| `FPrintln` | `void FPrintln(FileHandle fh, string text)` | Записать текст + перевод строки |
| `FGets` | `int FGets(FileHandle fh, string line)` | Прочитать одну строку |
| `ReadFile` | `string ReadFile(FileHandle fh)` | Прочитать весь файл |
| `DeleteFile` | `bool DeleteFile(string path)` | Удалить файл |
| `CopyFile` | `bool CopyFile(string src, string dst)` | Копировать файл |

### JSON (JsonFileLoader)

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `JsonLoadFile` | `void JsonFileLoader<T>.JsonLoadFile(string path, T obj)` | Загрузить JSON в объект (**возвращает void**) |
| `JsonСохранитьFile` | `void JsonFileLoader<T>.JsonСохранитьFile(string path, T obj)` | Сохранить объект как JSON |

### Перечисление FileMode

| Значение | Описание |
|----------|----------|
| `FileMode.READ` | Открыть для чтения |
| `FileMode.WRITE` | Открыть для записи (создаёт/перезаписывает) |
| `FileMode.APPEND` | Открыть для дозаписи |

---

## Методы таймеров и CallQueue

*Полный справочник: [Глава 6.7: Таймеры и CallQueue](07-timers.md)*

### Доступ

| Выражение | Возвращает | Описание |
|-----------|------------|----------|
| `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptCallQueue` | Очередь вызовов геймплея |
| `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)` | `ScriptCallQueue` | Системная очередь вызовов |
| `GetGame().GetCallQueue(CALL_CATEGORY_GUI)` | `ScriptCallQueue` | Очередь вызовов GUI |
| `GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptInvoker` | Покадровая очередь обновления |

### ScriptCallQueue

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `CallLater` | `void CallLater(func fn, int delay = 0, bool repeat = false, param1..4)` | Запланировать отложенный/повторяющийся вызов |
| `Call` | `void Call(func fn, param1..4)` | Выполнить на следующем кадре |
| `CallByName` | `void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false, Param par = null)` | Вызвать метод по имени строкой |
| `Remove` | `void Remove(func fn)` | Отменить запланированный вызов |
| `RemoveByName` | `void RemoveByName(Class obj, string fnName)` | Отменить по имени строкой |
| `GetRemainingTime` | `float GetRemainingTime(Class obj, string fnName)` | Получить оставшееся время CallLater |

### Класс Timer

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `Timer()` | `void Timer(int category = CALL_CATEGORY_SYSTEM)` | Конструктор |
| `Run` | `void Run(float duration, Class obj, string fnName, Param params = null, bool loop = false)` | Запустить таймер |
| `Остановить` | `void Остановить()` | Остановить таймер |
| `Pause` | `void Pause()` | Приостановить таймер |
| `Продолжить` | `void Продолжить()` | Возобновить таймер |
| `IsPaused` | `bool IsPaused()` | Таймер приостановлен? |
| `IsRunning` | `bool IsRunning()` | Таймер активен? |
| `GetRemaining` | `float GetRemaining()` | Оставшиеся секунды |

### ScriptInvoker

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `Insert` | `void Insert(func fn)` | Зарегистрировать коллбэк |
| `Remove` | `void Remove(func fn)` | Отменить регистрацию коллбэка |
| `Invoke` | `void Invoke(params...)` | Вызвать все коллбэки |
| `Count` | `int Count()` | Количество зарегистрированных коллбэков |
| `Clear` | `void Clear()` | Удалить все коллбэки |

---

## Методы создания виджетов

*Полный справочник: [Глава 3.5: Программное создание](../03-gui-system/05-programmatic-widgets.md)*

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Получить рабочее пространство UI |
| `CreateWidgets` | `Widget CreateWidgets(string layout, Widget parent = null)` | Загрузить файл .layout |
| `FindAnyWidget` | `Widget FindAnyWidget(string name)` | Найти дочерний виджет по имени (рекурсивно) |
| `Show` | `void Show(bool show)` | Показать/скрыть виджет |
| `SetText` | `void TextWidget.SetText(string text)` | Установить текстовое содержимое |
| `SetImage` | `void ImageWidget.SetImage(int index)` | Установить индекс изображения |
| `SetColor` | `void SetColor(int color)` | Установить цвет виджета (ARGB) |
| `SetAlpha` | `void SetAlpha(float alpha)` | Установить прозрачность 0.0-1.0 |
| `SetSize` | `void SetSize(float x, float y, bool relative = false)` | Установить размер виджета |
| `SetPos` | `void SetPos(float x, float y, bool relative = false)` | Установить позицию виджета |
| `GetScreenSize` | `void GetScreenSize(out float x, out float y)` | Разрешение экрана |
| `Destroy` | `void Widget.Destroy()` | Удалить и уничтожить виджет |

### Вспомогательные функции цвета ARGB

| Функция | Сигнатура | Описание |
|---------|-----------|----------|
| `ARGB` | `int ARGB(int a, int r, int g, int b)` | Создать целое число цвета (0-255 каждый) |
| `ARGBF` | `int ARGBF(float a, float r, float g, float b)` | Создать целое число цвета (0.0-1.0 каждый) |

---

## Методы RPC / Сетевое взаимодействие

*Полный справочник: [Глава 6.9: Сетевое взаимодействие и RPC](09-networking.md)*

### Проверки окружения

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `GetGame().IsServer()` | `bool IsServer()` | True на сервере / хосте listen-сервера |
| `GetGame().IsClient()` | `bool IsClient()` | True на клиенте |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | True в мультиплеере |
| `GetGame().IsDedicatedServer()` | `bool IsDedicatedServer()` | True только на выделенном сервере |

### ScriptRPC

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `ScriptRPC()` | `void ScriptRPC()` | Конструктор |
| `Write` | `bool Write(void value)` | Сериализовать значение (int, float, bool, string, vector, array) |
| `Send` | `void Send(Object target, int rpc_type, bool guaranteed, PlayerIdentity recipient = null)` | Отправить RPC |
| `Reset` | `void Reset()` | Очистить записанные данные |

### Приём (Override на Object)

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `OnRPC` | `void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)` | Обработчик приёма RPC |

### ParamsReadContext

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `Read` | `bool Read(out void value)` | Десериализовать значение (те же типы, что и Write) |

### Устаревший RPC (CGame)

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `RPCSingleParam` | `void GetGame().RPCSingleParam(Object target, int rpc, Param param, bool guaranteed, PlayerIdentity recipient = null)` | Отправить один объект Param |
| `RPC` | `void GetGame().RPC(Object target, int rpc, array<Param> params, bool guaranteed, PlayerIdentity recipient = null)` | Отправить несколько Param |

### ScriptInputUserData (Проверенный вводом)

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `CanStoreInputUserData` | `bool ScriptInputUserData.CanStoreInputUserData()` | Проверить, есть ли место в очереди |
| `Write` | `bool Write(void value)` | Сериализовать значение |
| `Send` | `void Send()` | Отправить на сервер (только клиент) |

---

## Математические константы и методы

*Полный справочник: [Глава 1.7: Математика и векторы](../01-enforce-script/07-math-vectors.md)*

### Константы

| Константа | Значение | Описание |
|-----------|----------|----------|
| `Math.PI` | `3.14159...` | Число Пи |
| `Math.PI2` | `6.28318...` | 2 * Пи |
| `Math.PI_HALF` | `1.57079...` | Пи / 2 |
| `Math.DEG2RAD` | `0.01745...` | Множитель градусов в радианы |
| `Math.RAD2DEG` | `57.2957...` | Множитель радианов в градусы |
| `int.MAX` | `2147483647` | Максимальный int |
| `int.MIN` | `-2147483648` | Минимальный int |
| `float.MAX` | `3.4028e+38` | Максимальный float |
| `float.MIN` | `1.175e-38` | Минимальный положительный float |

### Случайные числа

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `Math.RandomInt` | `int RandomInt(int min, int max)` | Случайный int [min, max) |
| `Math.RandomIntInclusive` | `int RandomIntInclusive(int min, int max)` | Случайный int [min, max] |
| `Math.RandomFloat01` | `float RandomFloat01()` | Случайный float [0, 1] |
| `Math.RandomBool` | `bool RandomBool()` | Случайный true/false |

### Округление

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `Math.Round` | `float Round(float f)` | Округлить до ближайшего |
| `Math.Floor` | `float Floor(float f)` | Округлить вниз |
| `Math.Ceil` | `float Ceil(float f)` | Округлить вверх |

### Ограничение и интерполяция

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `Math.Clamp` | `float Clamp(float val, float min, float max)` | Ограничить диапазоном |
| `Math.Min` | `float Min(float a, float b)` | Минимум из двух |
| `Math.Max` | `float Max(float a, float b)` | Максимум из двух |
| `Math.Lerp` | `float Lerp(float a, float b, float t)` | Линейная интерполяция |
| `Math.InverseLerp` | `float InverseLerp(float a, float b, float val)` | Обратная линейная интерполяция |

### Абсолютное значение и степень

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `Math.AbsFloat` | `float AbsFloat(float f)` | Абсолютное значение (float) |
| `Math.AbsInt` | `int AbsInt(int i)` | Абсолютное значение (int) |
| `Math.Pow` | `float Pow(float base, float exp)` | Степень |
| `Math.Sqrt` | `float Sqrt(float f)` | Квадратный корень |
| `Math.SqrFloat` | `float SqrFloat(float f)` | Квадрат (f * f) |

### Тригонометрия (радианы)

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `Math.Sin` | `float Sin(float rad)` | Синус |
| `Math.Cos` | `float Cos(float rad)` | Косинус |
| `Math.Tan` | `float Tan(float rad)` | Тангенс |
| `Math.Asin` | `float Asin(float val)` | Арксинус |
| `Math.Acos` | `float Acos(float val)` | Арккосинус |
| `Math.Atan2` | `float Atan2(float y, float x)` | Угол по компонентам |

### Плавное демпфирование

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `Math.SmoothCD` | `float SmoothCD(float val, float target, inout float velocity, float smoothTime, float maxSpeed, float dt)` | Плавное приближение к цели (аналог SmoothDamp в Unity) |

```c
// Использование плавного демпфирования
// val: текущее значение, target: целевое значение, velocity: ref скорость (сохраняется между вызовами)
// smoothTime: время сглаживания, maxSpeed: ограничение скорости, dt: дельта времени
float m_Velocity = 0;
float result = Math.SmoothCD(current, target, m_Velocity, 0.3, 1000.0, dt);
```

### Угол

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `Math.NormalizeAngle` | `float NormalizeAngle(float deg)` | Нормализовать к 0-360 |

---

## Методы работы с векторами

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `vector.Distance` | `float Distance(vector a, vector b)` | Расстояние между точками |
| `vector.DistanceSq` | `float DistanceSq(vector a, vector b)` | Квадрат расстояния (быстрее) |
| `vector.Direction` | `vector Direction(vector from, vector to)` | Вектор направления |
| `vector.Dot` | `float Dot(vector a, vector b)` | Скалярное произведение |
| `vector.Lerp` | `vector Lerp(vector a, vector b, float t)` | Интерполяция позиций |
| `v.Length()` | `float Length()` | Длина вектора |
| `v.LengthSq()` | `float LengthSq()` | Квадрат длины (быстрее) |
| `v.Normalized()` | `vector Normalized()` | Единичный вектор |
| `v.VectorToAngles()` | `vector VectorToAngles()` | Направление в yaw/pitch |
| `v.AnglesToVector()` | `vector AnglesToVector()` | Yaw/pitch в направление |
| `v.Multiply3` | `vector Multiply3(vector mat[3])` | Умножение на матрицу |
| `v.InvMultiply3` | `vector InvMultiply3(vector mat[3])` | Обратное умножение на матрицу |
| `Vector(x, y, z)` | `vector Vector(float x, float y, float z)` | Создать вектор |

---

## Глобальные функции

| Функция | Сигнатура | Описание |
|---------|-----------|----------|
| `GetGame()` | `CGame GetGame()` | Экземпляр игры |
| `GetGame().GetPlayer()` | `Man GetPlayer()` | Локальный игрок (только КЛИЕНТ) |
| `GetGame().GetPlayers(out arr)` | `void GetPlayers(out array<Man> arr)` | Все игроки (сервер) |
| `GetGame().GetWorld()` | `World GetWorld()` | Экземпляр мира |
| `GetGame().GetTickTime()` | `float GetTickTime()` | Время сервера (секунды) |
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | Рабочее пространство UI |
| `GetGame().SurfaceY(x, z)` | `float SurfaceY(float x, float z)` | Высота местности в точке |
| `GetGame().SurfaceGetType(x, z)` | `string SurfaceGetType(float x, float z)` | Тип поверхности |
| `GetGame().GetObjectsAtPosition(pos, radius, objects, proxyCargo)` | `void GetObjectsAtPosition(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargo)` | Найти объекты рядом с позицией |
| `GetScreenSize(w, h)` | `void GetScreenSize(out int w, out int h)` | Получить разрешение экрана |
| `GetGame().IsServer()` | `bool IsServer()` | Проверка сервера |
| `GetGame().IsClient()` | `bool IsClient()` | Проверка клиента |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | Проверка мультиплеера |
| `Print(string)` | `void Print(string msg)` | Запись в лог скриптов |
| `ErrorEx(string)` | `void ErrorEx(string msg, ErrorExSeverity sev = ERROR)` | Запись ошибки с уровнем серьёзности |
| `DumpStackString()` | `string DumpStackString()` | Получить стек вызовов как строку |
| `string.Format(fmt, ...)` | `string Format(string fmt, ...)` | Форматирование строки (`%1`..`%9`) |

---

## Хуки миссий

*Полный справочник: [Глава 6.11: Хуки миссий](11-mission-hooks.md)*

### Серверная сторона (modded MissionServer)

| Метод | Описание |
|-------|----------|
| `override void OnInit()` | Инициализация менеджеров, регистрация RPC |
| `override void OnMissionStart()` | После загрузки всех модов |
| `override void OnUpdate(float timeslice)` | Покадрово (используйте аккумулятор!) |
| `override void OnMissionFinish()` | Очистка синглтонов, отписка от событий |
| `override void OnEvent(EventType eventTypeId, Param params)` | События чата, голоса |
| `override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)` | Игрок подключился |
| `override void InvokeOnDisconnect(PlayerBase player)` | Игрок отключился |
| `override void OnClientReadyEvent(int peerId, PlayerIdentity identity)` | Клиент готов к приёму данных |
| `override void PlayerRegistered(int peerId)` | Идентификация зарегистрирована |

### Клиентская сторона (modded MissionGameplay)

| Метод | Описание |
|-------|----------|
| `override void OnInit()` | Инициализация клиентских менеджеров, создание HUD |
| `override void OnUpdate(float timeslice)` | Покадровое обновление клиента |
| `override void OnMissionFinish()` | Очистка |
| `override void OnKeyPress(int key)` | Клавиша нажата |
| `override void OnKeyRelease(int key)` | Клавиша отпущена |

---

## Система действий

*Полный справочник: [Глава 6.12: Система действий](12-action-system.md)*

### Регистрация действий на объекте

```c
override void SetActions()
{
    super.SetActions();
    AddAction(MyAction);           // Добавить пользовательское действие
    RemoveAction(ActionEat);       // Удалить ванильное действие
}
```

### Ключевые методы ActionBase

| Метод | Описание |
|-------|----------|
| `override void CreateConditionComponents()` | Установить условия расстояния CCINone/CCTNone |
| `override bool ActionCondition(...)` | Пользовательская логика валидации |
| `override void OnExecuteServer(ActionData action_data)` | Выполнение на сервере |
| `override void OnExecuteClient(ActionData action_data)` | Эффекты на клиенте |
| `override string GetText()` | Отображаемое имя (поддерживает ключи `#STR_`) |

---

*Полная документация: [Главная](../../README.md) | [Шпаргалка](../cheatsheet.md) | [Система сущностей](01-entity-system.md) | [Транспорт](02-vehicles.md) | [Погода](03-weather.md) | [Таймеры](07-timers.md) | [Файловый I/O](08-file-io.md) | [Сеть](09-networking.md) | [Хуки миссий](11-mission-hooks.md) | [Система действий](12-action-system.md)*
