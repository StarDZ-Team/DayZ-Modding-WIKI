# Глава 1.7: Математические и векторные операции

[Главная](../README.md) | [<< Назад: Строковые операции](06-strings.md) | **Математические и векторные операции** | [Далее: Управление памятью >>](08-memory-management.md)

---

## Введение

Моддинг DayZ часто требует математических вычислений: нахождение расстояний между игроками, рандомизация позиций спауна, интерполяция движений камеры, вычисление углов для наведения ИИ. Enforce Script предоставляет класс `Math` для скалярных операций и тип `vector` со статическими методами для 3D-математики. Эта глава является полным справочником по обоим, организованным по категориям.

---

## Класс Math

Все методы класса `Math` являются **статическими**. Вы вызываете их как `Math.MethodName()`.

### Константы

| Константа | Значение | Описание |
|----------|-------|-------------|
| `Math.PI` | 3.14159265... | Число Пи |
| `Math.PI2` | 6.28318530... | 2 * Пи (полный оборот в радианах) |
| `Math.PI_HALF` | 1.57079632... | Пи / 2 (четверть оборота) |
| `Math.EULER` | 2.71828182... | Число Эйлера |
| `Math.DEG2RAD` | 0.01745329... | Умножьте градусы на это, чтобы получить радианы |
| `Math.RAD2DEG` | 57.29577951... | Умножьте радианы на это, чтобы получить градусы |

```c
// Конвертация 90 градусов в радианы
float rad = 90 * Math.DEG2RAD; // 1.5707...

// Конвертация PI радиан в градусы
float deg = Math.PI * Math.RAD2DEG; // 180.0
```

---

### Случайные числа

```c
// Случайное целое число в диапазоне [min, max) -- max ИСКЛЮЧИТЕЛЬНО
int roll = Math.RandomInt(0, 10);           // от 0 до 9

// Случайное целое число в диапазоне [min, max] -- max ВКЛЮЧИТЕЛЬНО
int dice = Math.RandomIntInclusive(1, 6);   // от 1 до 6

// Случайное число с плавающей запятой в диапазоне [min, max) -- max ИСКЛЮЧИТЕЛЬНО
float rf = Math.RandomFloat(0.0, 1.0);

// Случайное число с плавающей запятой в диапазоне [min, max] -- max ВКЛЮЧИТЕЛЬНО
float rf2 = Math.RandomFloatInclusive(0.0, 1.0);

// Случайное число с плавающей запятой [0, 1] включительно (сокращение)
float chance = Math.RandomFloat01();

// Случайное булево значение
bool coinFlip = Math.RandomBool();

// Инициализация генератора случайных чисел (-1 использует системное время)
Math.Randomize(-1);
```

#### Пример DayZ: шанс выпадения редкого лута

```c
bool ShouldSpawnRareLoot(float rarity)
{
    // rarity: 0.0 = никогда, 1.0 = всегда
    return Math.RandomFloat01() < rarity;
}

// 15% шанс на редкое оружие
if (ShouldSpawnRareLoot(0.15))
{
    GetGame().CreateObject("VSS", position, false, false, true);
}
```

#### Пример DayZ: случайная позиция в радиусе

```c
vector GetRandomPositionInRadius(vector center, float radius)
{
    float angle = Math.RandomFloat(0, Math.PI2);
    float dist = Math.RandomFloat(0, radius);

    vector pos = center;
    pos[0] = pos[0] + Math.Cos(angle) * dist;
    pos[2] = pos[2] + Math.Sin(angle) * dist;
    pos[1] = GetGame().SurfaceY(pos[0], pos[2]);

    return pos;
}
```

---

### Округление

```c
float rounded = Math.Round(5.6);   // 6.0
float rounded2 = Math.Round(5.4);  // 5.0
float floored = Math.Floor(5.9);   // 5.0
float ceiled = Math.Ceil(5.1);     // 6.0
```

#### Пример DayZ: привязка здания к сетке

```c
vector SnapToGrid(vector pos, float gridSize)
{
    pos[0] = Math.Round(pos[0] / gridSize) * gridSize;
    pos[2] = Math.Round(pos[2] / gridSize) * gridSize;
    pos[1] = GetGame().SurfaceY(pos[0], pos[2]);
    return pos;
}
```

---

### Абсолютное значение и знак

```c
float af = Math.AbsFloat(-5.5);    // 5.5
int ai = Math.AbsInt(-42);         // 42

float sf = Math.SignFloat(-5.0);   // -1.0
float sf2 = Math.SignFloat(5.0);   // 1.0
float sf3 = Math.SignFloat(0.0);   // 0.0

int si = Math.SignInt(-3);         // -1
int si2 = Math.SignInt(7);         // 1
```

---

### Степень, корень и логарифм

```c
float pw = Math.Pow(2, 10);        // 1024.0
float sq = Math.Sqrt(25);          // 5.0
float lg = Math.Log2(8);           // 3.0
```

---

### Тригонометрия

Все тригонометрические функции работают в **радианах**. Используйте `Math.DEG2RAD` и `Math.RAD2DEG` для конвертации.

```c
// Базовые тригонометрические функции
float s = Math.Sin(Math.PI / 4);     // ~0.707
float c = Math.Cos(Math.PI / 4);     // ~0.707
float t = Math.Tan(Math.PI / 4);     // ~1.0

// Обратные тригонометрические функции
float asin = Math.Asin(0.5);         // ~0.5236 рад (30 градусов)
float acos = Math.Acos(0.5);         // ~1.0472 рад (60 градусов)

// Atan2 -- угол от оси X до точки (y, x)
float angle = Math.Atan2(1, 1);      // PI/4 (~0.785 рад = 45 градусов)
```

#### Пример DayZ: угол направления между двумя позициями

```c
float GetAngleBetween(vector from, vector to)
{
    float dx = to[0] - from[0];
    float dz = to[2] - from[2];
    float angleRad = Math.Atan2(dx, dz);
    return angleRad * Math.RAD2DEG; // Возвращает в градусах
}
```

#### Пример DayZ: спаун объектов по кругу

```c
void SpawnCircleOfBarrels(vector center, float radius, int count)
{
    float angleStep = Math.PI2 / count;

    for (int i = 0; i < count; i++)
    {
        float angle = angleStep * i;
        vector pos = center;
        pos[0] = pos[0] + Math.Cos(angle) * radius;
        pos[2] = pos[2] + Math.Sin(angle) * radius;
        pos[1] = GetGame().SurfaceY(pos[0], pos[2]);

        GetGame().CreateObject("Barrel_Green", pos, false, false, true);
    }
}
```

---

### Ограничение и Min/Max

```c
// Ограничить значение диапазоном
float clamped = Math.Clamp(15, 0, 10);  // 10 (ограничено максимумом)
float clamped2 = Math.Clamp(-5, 0, 10); // 0  (ограничено минимумом)
float clamped3 = Math.Clamp(5, 0, 10);  // 5  (в пределах диапазона)

// Min и Max
float mn = Math.Min(3, 7);              // 3
float mx = Math.Max(3, 7);              // 7

// Проверить, находится ли значение в диапазоне
bool inRange = Math.IsInRange(5, 0, 10); // true
bool outRange = Math.IsInRange(15, 0, 10); // false
```

#### Пример DayZ: ограничение здоровья игрока

```c
void ApplyDamage(PlayerBase player, float damage)
{
    float currentHealth = player.GetHealth("", "Health");
    float newHealth = Math.Clamp(currentHealth - damage, 0, 100);
    player.SetHealth("", "Health", newHealth);
}
```

---

### Интерполяция

```c
// Линейная интерполяция (Lerp)
// Возвращает a + (b - a) * t, где t находится в [0, 1]
float lerped = Math.Lerp(0, 100, 0.5);     // 50
float lerped2 = Math.Lerp(0, 100, 0.25);   // 25

// Обратная линейная интерполяция -- находит значение t
// Возвращает (value - a) / (b - a)
float t = Math.InverseLerp(0, 100, 50);    // 0.5
float t2 = Math.InverseLerp(0, 100, 75);   // 0.75
```

#### SmoothCD (плавное критическое затухание)

`SmoothCD` обеспечивает плавную, независимую от частоты кадров интерполяцию. Это лучший выбор для сглаживания камеры, анимаций UI и любого значения, которое должно плавно приближаться к цели без осцилляций.

```c
// SmoothCD(current, target, velocity, smoothTime, maxSpeed, dt)
// velocity передаётся по ссылке и обновляется при каждом вызове
float currentVal = 0;
float velocity = 0;
float target = 100;
float smoothTime = 0.3;

// Вызывается каждый кадр:
currentVal = Math.SmoothCD(currentVal, target, velocity, smoothTime, 1000, 0.016);
```

#### Пример DayZ: плавное масштабирование камеры

```c
class SmoothZoomCamera
{
    protected float m_CurrentFOV;
    protected float m_TargetFOV;
    protected float m_Velocity;

    void SmoothZoomCamera()
    {
        m_CurrentFOV = 70;
        m_TargetFOV = 70;
        m_Velocity = 0;
    }

    void SetZoom(float targetFOV)
    {
        m_TargetFOV = Math.Clamp(targetFOV, 20, 120);
    }

    void Update(float dt)
    {
        m_CurrentFOV = Math.SmoothCD(m_CurrentFOV, m_TargetFOV, m_Velocity, 0.2, 500, dt);
    }

    float GetFOV()
    {
        return m_CurrentFOV;
    }
}
```

---

### Операции с углами

```c
// Нормализация угла в [0, 360)
float norm = Math.NormalizeAngle(370);   // 10
float norm2 = Math.NormalizeAngle(-30);  // 330

// Разница между двумя углами (кратчайший путь)
float diff = Math.DiffAngle(350, 10);   // -20
float diff2 = Math.DiffAngle(10, 350);  // 20
```

---

### Возведение в квадрат и модуль

```c
// Квадрат (быстрее, чем Pow(x, 2))
float sqf = Math.SqrFloat(5);          // 25.0
int sqi = Math.SqrInt(5);              // 25

// Модуль для чисел с плавающей запятой
float mod = Math.ModFloat(5.5, 2.0);   // 1.5

// Обернуть целое число в диапазон
int wrapped = Math.WrapInt(12, 0, 10);  // 2
int wrapped2 = Math.WrapInt(-1, 0, 10); // 9
```

---

## Тип vector

Тип `vector` -- это встроенный тип-значение с тремя компонентами float (x, y, z). Он используется повсюду в DayZ для позиций, направлений, ориентаций и масштабов.

### Создание векторов

```c
// Инициализация строкой (x y z, разделённые пробелами)
vector pos = "100.5 0 200.3";

// Функция-конструктор
vector pos2 = Vector(100.5, 0, 200.3);

// Значение по умолчанию (нулевой вектор)
vector zero;           // "0 0 0"
```

### Доступ к компонентам

```c
vector pos = Vector(10, 25, 30);

float x = pos[0]; // 10
float y = pos[1]; // 25 (высота в DayZ)
float z = pos[2]; // 30

pos[1] = 50.0;    // Установить компонент y
```

> **Система координат DayZ:** `[0]` -- Восток-Запад (X), `[1]` -- высота (Y), `[2]` -- Север-Юг (Z).

### Константы vector

| Константа | Значение | Описание |
|----------|-------|-------------|
| `vector.Zero` | `"0 0 0"` | Нулевой вектор (начало координат) |
| `vector.Up` | `"0 1 0"` | Направлен вверх |
| `vector.Aside` | `"1 0 0"` | Направлен на восток (X+) |
| `vector.Forward` | `"0 0 1"` | Направлен на север (Z+) |

---

### Операции с векторами (статические методы)

#### Расстояние

```c
vector a = Vector(0, 0, 0);
vector b = Vector(100, 0, 100);

float dist = vector.Distance(a, b);     // ~141.42
float distSq = vector.DistanceSq(a, b); // 20000 (без sqrt, быстрее)
```

> **Совет по производительности:** используйте `DistanceSq` при сравнении расстояний. Сравнение квадратов значений позволяет избежать дорогостоящего вычисления квадратного корня.

```c
// ХОРОШО -- сравнение квадратов расстояний
float maxDistSq = 100 * 100; // 10000
if (vector.DistanceSq(playerPos, targetPos) < maxDistSq)
{
    Print("Target is within 100m");
}

// МЕДЛЕННЕЕ -- вычисление фактического расстояния
if (vector.Distance(playerPos, targetPos) < 100)
{
    Print("Target is within 100m");
}
```

#### Направление

Возвращает вектор направления от одной точки к другой (не нормализованный).

```c
vector dir = vector.Direction(from, to);
// Эквивалентно: to - from
```

#### Скалярное произведение

```c
float dot = vector.Dot(a, b);
// dot > 0: векторы направлены в схожих направлениях
// dot = 0: векторы перпендикулярны
// dot < 0: векторы направлены в противоположных направлениях
```

#### Пример DayZ: находится ли цель перед игроком?

```c
bool IsTargetInFront(PlayerBase player, vector targetPos)
{
    vector playerDir = player.GetDirection();
    vector toTarget = vector.Direction(player.GetPosition(), targetPos);
    toTarget.Normalize();

    float dot = vector.Dot(playerDir, toTarget);
    return dot > 0; // Положительное значение означает спереди
}
```

#### Нормализация

Преобразует вектор к единичной длине (длина равна 1).

```c
vector dir = Vector(3, 0, 4);
float len = dir.Length();      // 5.0

vector norm = dir.Normalized(); // Vector(0.6, 0, 0.8)
// norm.Length() == 1.0

// Нормализация на месте
dir.Normalize();
// dir теперь Vector(0.6, 0, 0.8)
```

#### Длина

```c
vector v = Vector(3, 4, 0);
float len = v.Length();        // 5.0
float lenSq = v.LengthSq();   // 25.0 (быстрее, без sqrt)
```

#### Lerp (статический)

Линейная интерполяция между двумя векторами.

```c
vector start = Vector(0, 0, 0);
vector end = Vector(100, 50, 200);

vector mid = vector.Lerp(start, end, 0.5);
// mid = Vector(50, 25, 100)

vector quarter = vector.Lerp(start, end, 0.25);
// quarter = Vector(25, 12.5, 50)
```

#### RotateAroundZeroDeg (статический)

Вращает вектор вокруг оси на заданный угол в градусах.

```c
vector original = Vector(1, 0, 0); // направлен на восток
vector axis = Vector(0, 1, 0);     // вращение вокруг оси Y
float angle = 90;                  // 90 градусов

vector rotated = vector.RotateAroundZeroDeg(original, axis, angle);
// rotated приблизительно Vector(0, 0, 1) -- теперь направлен на север
```

#### Случайное направление

```c
vector rdir = vector.RandomDir();    // Случайное 3D-направление (единичный вектор)
vector rdir2d = vector.RandomDir2D(); // Случайное направление в плоскости XZ
```

---

### Арифметика векторов

Векторы поддерживают стандартные арифметические операторы:

```c
vector a = Vector(1, 2, 3);
vector b = Vector(4, 5, 6);

vector sum = a + b;         // Vector(5, 7, 9)
vector diff = a - b;        // Vector(-3, -3, -3)
vector scaled = a * 2;      // Vector(2, 4, 6)

// Перемещение позиции вперёд
vector pos = player.GetPosition();
vector dir = player.GetDirection();
vector ahead = pos + dir * 5; // 5 метров впереди игрока
```

### Преобразование Vector в String

```c
vector pos = Vector(100.5, 25.3, 200.7);
string s = pos.ToString(); // "<100.5, 25.3, 200.7>"
```

---

## Класс Math3D

Для продвинутых 3D-операций класс `Math3D` предоставляет утилиты для матриц и вращений.

```c
// Создание матрицы вращения из yaw/pitch/roll (градусы)
vector mat[3];
Math3D.YawPitchRollMatrix("45 0 0", mat);

// Конвертация матрицы вращения обратно в углы
vector angles = Math3D.MatrixToAngles(mat);

// Единичная матрица (4x4)
vector mat4[4];
Math3D.MatrixIdentity4(mat4);
```

---

## Примеры из практики

### Вычисление расстояния между двумя игроками

```c
float GetPlayerDistance(PlayerBase player1, PlayerBase player2)
{
    if (!player1 || !player2)
        return -1;

    return vector.Distance(player1.GetPosition(), player2.GetPosition());
}

void WarnProximity(PlayerBase player, array<Man> allPlayers, float warnDistance)
{
    vector myPos = player.GetPosition();
    float warnDistSq = warnDistance * warnDistance;

    foreach (Man man : allPlayers)
    {
        if (man == player)
            continue;

        if (vector.DistanceSq(myPos, man.GetPosition()) < warnDistSq)
        {
            Print(string.Format("Player nearby! Distance: %1m",
                vector.Distance(myPos, man.GetPosition())));
        }
    }
}
```

### Поиск ближайшего объекта

```c
Object FindClosest(vector origin, array<Object> objects)
{
    Object closest = null;
    float closestDistSq = float.MAX;

    foreach (Object obj : objects)
    {
        if (!obj)
            continue;

        float distSq = vector.DistanceSq(origin, obj.GetPosition());
        if (distSq < closestDistSq)
        {
            closestDistSq = distSq;
            closest = obj;
        }
    }

    return closest;
}
```

### Перемещение объекта по пути

```c
class PathMover
{
    protected ref array<vector> m_Waypoints;
    protected int m_CurrentWaypoint;
    protected float m_Progress; // от 0.0 до 1.0 между путевыми точками
    protected float m_Speed;    // метров в секунду

    void PathMover(array<vector> waypoints, float speed)
    {
        m_Waypoints = waypoints;
        m_CurrentWaypoint = 0;
        m_Progress = 0;
        m_Speed = speed;
    }

    vector Update(float dt)
    {
        if (m_CurrentWaypoint >= m_Waypoints.Count() - 1)
            return m_Waypoints.Get(m_Waypoints.Count() - 1);

        vector from = m_Waypoints.Get(m_CurrentWaypoint);
        vector to = m_Waypoints.Get(m_CurrentWaypoint + 1);
        float segmentLength = vector.Distance(from, to);

        if (segmentLength > 0)
        {
            m_Progress += (m_Speed * dt) / segmentLength;
        }

        if (m_Progress >= 1.0)
        {
            m_Progress = 0;
            m_CurrentWaypoint++;
            return Update(0); // Пересчитать для следующего сегмента
        }

        return vector.Lerp(from, to, m_Progress);
    }
}
```

### Вычисление кольца спауна вокруг точки

```c
array<vector> GetSpawnRing(vector center, float radius, int count)
{
    array<vector> positions = new array<vector>;
    float angleStep = Math.PI2 / count;

    for (int i = 0; i < count; i++)
    {
        float angle = angleStep * i;
        vector pos = center;
        pos[0] = pos[0] + Math.Cos(angle) * radius;
        pos[2] = pos[2] + Math.Sin(angle) * radius;
        pos[1] = GetGame().SurfaceY(pos[0], pos[2]);
        positions.Insert(pos);
    }

    return positions;
}
```

---

## Лучшие практики

- Используйте `vector.DistanceSq()` и сравнивайте с `radius * radius` в плотных циклах -- это позволяет избежать дорогостоящего `sqrt` внутри `Distance()`.
- Всегда умножайте на `Math.DEG2RAD` перед передачей углов в `Sin()`/`Cos()` -- все тригонометрические функции работают в радианах.
- Проверяйте `v.Length() > 0` перед вызовом `Normalize()` -- нормализация вектора нулевой длины порождает значения `NaN`.
- Используйте `Math.Clamp()` для ограничения здоровья, урона и значений UI вместо написания ручных цепочек `if`.
- Предпочитайте `Math.RandomIntInclusive()`, когда максимальное значение должно быть достижимо (например, броски кубика) -- максимум `RandomInt()` исключителен.

---

## Замечено в реальных модах

> Паттерны, подтверждённые изучением исходного кода профессиональных модов DayZ.

| Паттерн | Мод | Детали |
|---------|-----|--------|
| `DistanceSq` с предварительно возведённым в квадрат порогом | Expansion / COT | Проверки близости хранят `float maxDistSq = range * range` и сравнивают с `DistanceSq` |
| `Math.Atan2(dx, dz) * RAD2DEG` для направления | Expansion AI | Направление к цели вычисляется как угол в градусах для присвоения ориентации |
| `Math.RandomFloat(0, Math.PI2)` для кольца спауна | Dabs / Expansion | Случайный угол + `Cos`/`Sin` для генерации круговых позиций спауна |
| `Math.Clamp` для значений здоровья/урона | VPP / COT | Каждое применение урона ограничивает результат диапазоном `[0, maxHealth]` для предотвращения отрицательных значений или переполнения |

---

## Теория и практика

| Концепция | Теория | Реальность |
|---------|--------|---------|
| `Math.RandomInt(0, 10)` | Можно ожидать 0-10 включительно | Максимум исключителен -- возвращает 0-9; используйте `RandomIntInclusive` для включительного максимума |
| `vector[1]` -- ось Y | Стандартное отображение XYZ | В DayZ Y -- это вертикальная высота -- легко спутать с соглашением Z-вверх из других движков |
| `Math.SqrFloat` и `Math.Sqrt` | Названия выглядят похоже | `SqrFloat(5)` = 25 (возводит в квадрат), `Sqrt(25)` = 5 (квадратный корень) -- противоположные операции |

---

## Распространённые ошибки

| Ошибка | Проблема | Решение |
|---------|---------|-----|
| Передача градусов в `Math.Sin()` / `Math.Cos()` | Тригонометрические функции ожидают радианы | Сначала умножьте на `Math.DEG2RAD` |
| Использование `Math.RandomInt(0, 10)` с ожиданием 10 | Максимум исключителен | Используйте `Math.RandomIntInclusive(0, 10)` для включительного максимума |
| Вычисление `vector.Distance()` в плотном цикле | `Distance` использует `sqrt`, что медленно | Используйте `vector.DistanceSq()` и сравнивайте с квадратом расстояния |
| Нормализация вектора нулевой длины | Деление на ноль, порождает NaN | Проверяйте `v.Length() > 0` перед нормализацией |
| Забыли, что в DayZ Y направлен вверх | `pos[1]` -- это высота, а не Z | `[0]` = X (Восток), `[1]` = Y (Вверх), `[2]` = Z (Север) |
| Использование `Lerp` с t вне [0,1] | Экстраполирует за пределы диапазона | Ограничьте t с помощью `Math.Clamp(t, 0, 1)` |
| Путаница `SqrFloat` и `Sqrt` | `SqrFloat` возводит в квадрат; `Sqrt` извлекает квадратный корень | `Math.SqrFloat(5)` = 25, `Math.Sqrt(25)` = 5 |

---

## Краткая справка

```c
// Константы
Math.PI  Math.PI2  Math.PI_HALF  Math.EULER  Math.DEG2RAD  Math.RAD2DEG

// Случайные числа
Math.RandomInt(min, max)              // [min, max)
Math.RandomIntInclusive(min, max)     // [min, max]
Math.RandomFloat(min, max)            // [min, max)
Math.RandomFloatInclusive(min, max)   // [min, max]
Math.RandomFloat01()                  // [0, 1]
Math.RandomBool()
Math.Randomize(-1)                    // Инициализация от времени

// Округление
Math.Round(f)  Math.Floor(f)  Math.Ceil(f)

// Абсолютное значение и знак
Math.AbsFloat(f)  Math.AbsInt(i)  Math.SignFloat(f)  Math.SignInt(i)

// Степень и корень
Math.Pow(base, exp)  Math.Sqrt(f)  Math.Log2(f)  Math.SqrFloat(f)

// Тригонометрия (радианы)
Math.Sin(r) Math.Cos(r) Math.Tan(r) Math.Asin(f) Math.Acos(f) Math.Atan2(y, x)

// Ограничение и интерполяция
Math.Clamp(val, min, max)  Math.Min(a, b)  Math.Max(a, b)
Math.Lerp(a, b, t)  Math.InverseLerp(a, b, val)
Math.SmoothCD(cur, target, vel, smoothTime, maxSpeed, dt)
Math.IsInRange(val, min, max)

// Углы
Math.NormalizeAngle(deg)  Math.DiffAngle(a, b)

// Вектор
vector.Distance(a, b)    vector.DistanceSq(a, b)
vector.Direction(from, to)
vector.Dot(a, b)          vector.Lerp(a, b, t)
vector.RotateAroundZeroDeg(vec, axis, angleDeg)
vector.RandomDir()        vector.RandomDir2D()
v.Length()  v.LengthSq()  v.Normalized()  v.Normalize()

// Константы vector
vector.Zero  vector.Up  vector.Aside  vector.Forward
```

---

[<< 1.6: Строковые операции](06-strings.md) | [Главная](../README.md) | [1.8: Управление памятью >>](08-memory-management.md)
