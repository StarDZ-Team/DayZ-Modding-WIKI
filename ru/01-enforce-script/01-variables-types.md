# Глава 1.1: Переменные и типы

[Главная](../README.md) | **Переменные и типы** | [Следующая: Массивы, Map и Set >>](02-arrays-maps-sets.md)

---
---

## Введение


Enforce Script --- это скриптовый язык движка Enfusion, используемый в DayZ Standalone. Это объектно-ориентированный язык с C-подобным синтаксисом, во многом похожий на C#, но с собственным набором типов, правил и ограничений. Если у вас есть опыт работы с C#, Java или C++, вы быстро освоитесь --- но обратите особое внимание на отличия, потому что именно там, где Enforce Script расходится с этими языками, прячутся ошибки.

Эта глава охватывает фундаментальные строительные блоки: примитивные типы, объявление и инициализацию переменных, а также преобразование типов. Каждая строка кода DayZ-мода начинается именно здесь.

---

## Примитивные типы


В Enforce Script есть небольшой фиксированный набор примитивных типов. Вы не можете определять новые типы-значения --- только классы (рассмотрены в [Главе 1.3](03-classes-inheritance.md)).

| Тип | Размер | Значение по умолчанию | Описание |
|------|------|---------------|-------------|
| `int` | 32-битное знаковое | `0` | Целые числа от -2 147 483 648 до 2 147 483 647 |
| `float` | 32-битное IEEE 754 | `0.0` | Числа с плавающей точкой |
| `bool` | 1 бит логический | `false` | `true` или `false` |
| `string` | Переменный | `""` (пустая) | Текст. Неизменяемый тип-значение --- передаётся по значению, не по ссылке |
| `vector` | 3x float | `"0 0 0"` | Трёхкомпонентное float-значение (x, y, z). Передаётся по значению |
| `typename` | Ссылка движка | `null` | Ссылка на сам тип, используется для рефлексии |
| `void` | Н/Д | Н/Д | Используется только как тип возвращаемого значения для обозначения «ничего не возвращает» |

### Константы типов


У некоторых типов есть полезные константы:

```c
// Границы int
int maxInt = int.MAX;    // 2147483647
int minInt = int.MIN;    // -2147483648

// Границы float
float smallest = float.MIN;     // наименьшее положительное float (~1.175e-38)
float largest  = float.MAX;     // наибольшее float (~3.403e+38)
float lowest   = float.LOWEST;  // самое отрицательное float (-3.403e+38)
```

---

## Объявление переменных


Переменные объявляются указанием типа, за которым следует имя. Можно объявить и присвоить значение в одном выражении или раздельно.

```c
void MyFunction()
{
    // Только объявление (инициализируется значением по умолчанию)
    int health;          // health == 0
    float speed;         // speed == 0.0
    bool isAlive;        // isAlive == false
    string name;         // name == ""

    // Объявление с инициализацией
    int maxPlayers = 60;
    float gravity = 9.81;
    bool debugMode = true;
    string serverName = "My DayZ Server";
}
```

### Ключевое слово `auto`

Когда тип очевиден из правой части выражения, можно использовать `auto`, чтобы компилятор определил тип самостоятельно:

```c
void Example()
{
    auto count = 10;           // int
    auto ratio = 0.75;         // float
    auto label = "Hello";      // string
    auto player = GetGame().GetPlayer();  // DayZPlayer (или что возвращает GetPlayer)
}
```

Это исключительно удобство --- компилятор определяет тип на этапе компиляции. Разницы в производительности нет.

### Константы


Используйте ключевое слово `const` для значений, которые не должны меняться после инициализации:

```c
const int MAX_SQUAD_SIZE = 8;
const float SPAWN_RADIUS = 150.0;
const string MOD_PREFIX = "[MyMod]";

void Example()
{
    int a = MAX_SQUAD_SIZE;  // OK: чтение константы
    MAX_SQUAD_SIZE = 10;     // ОШИБКА: нельзя присвоить значение константе
}
```

Константы обычно объявляются на уровне файла (вне функций) или как члены класса. Соглашение об именовании: `UPPER_SNAKE_CASE`.

---

## Работа с `int`

Целые числа --- это рабочий тип. DayZ использует их для подсчёта предметов, идентификаторов игроков, значений здоровья (когда они дискретные), значений перечислений, битовых флагов и многого другого.

```c
void IntExamples()
{
    int count = 5;
    int total = count + 10;     // 15
    int doubled = count * 2;    // 10
    int remainder = 17 % 5;     // 2 (остаток от деления)

    // Инкремент и декремент
    count++;    // count теперь 6
    count--;    // count снова 5

    // Составное присваивание
    count += 3;  // count теперь 8
    count -= 2;  // count теперь 6
    count *= 4;  // count теперь 24
    count /= 6;  // count теперь 4

    // Целочисленное деление усекает (без округления)
    int result = 7 / 2;    // result == 3, не 3.5

    // Побитовые операции (используются для флагов)
    int flags = 0;
    flags = flags | 0x01;   // установить бит 0
    flags = flags | 0x04;   // установить бит 2
    bool hasBit0 = (flags & 0x01) != 0;  // true
}
```

### Пример из практики: подсчёт игроков


```c
void PrintPlayerCount()
{
    array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);
    int count = players.Count();
    Print(string.Format("Players online: %1", count));
}
```

---

## Работа с `float`

Числа с плавающей точкой представляют десятичные числа. DayZ активно использует их для позиций, расстояний, процентов здоровья, значений урона и таймеров.

```c
void FloatExamples()
{
    float health = 100.0;
    float damage = 25.5;
    float remaining = health - damage;   // 74.5

    // Специфично для DayZ: множитель урона
    float headMultiplier = 3.0;
    float actualDamage = damage * headMultiplier;  // 76.5

    // Деление float даёт десятичный результат
    float ratio = 7.0 / 2.0;   // 3.5

    // Полезная математика
    float dist = 150.7;
    float rounded = Math.Round(dist);    // 151
    float floored = Math.Floor(dist);    // 150
    float ceiled  = Math.Ceil(dist);     // 151
    float clamped = Math.Clamp(dist, 0.0, 100.0);  // 100
}
```

### Пример из практики: проверка расстояния


```c
bool IsPlayerNearby(PlayerBase player, vector targetPos, float radius)
{
    if (!player)
        return false;

    vector playerPos = player.GetPosition();
    float distance = vector.Distance(playerPos, targetPos);
    return distance <= radius;
}
```

---

## Работа с `bool`

Логические значения хранят `true` или `false`. Они используются в условиях, флагах и отслеживании состояний.

```c
void BoolExamples()
{
    bool isAdmin = true;
    bool isBanned = false;

    // Логические операторы
    bool canPlay = isAdmin || !isBanned;    // true (ИЛИ, НЕ)
    bool isSpecial = isAdmin && !isBanned;  // true (И)

    // Отрицание
    bool notAdmin = !isAdmin;   // false

    // Результаты сравнения --- bool
    int health = 50;
    bool isLow = health < 25;       // false
    bool isHurt = health < 100;     // true
    bool isDead = health == 0;      // false
    bool isAlive = health != 0;     // true
}
```

### Истинность в условиях

В Enforce Script можно использовать не-bool значения в условиях. Следующие считаются `false`:
- `0` (int)
- `0.0` (float)
- `""` (пустая строка)
- `null` (нулевая ссылка на объект)

Всё остальное считается `true`. Это часто используется для проверки на null:

```c
void SafeCheck(PlayerBase player)
{
    // Эти два выражения эквивалентны:
    if (player != null)
        Print("Player exists");

    if (player)
        Print("Player exists");

    // И эти два:
    if (player == null)
        Print("No player");

    if (!player)
        Print("No player");
}
```

---

## Работа с `string`

Строки в Enforce Script являются **типами-значениями** --- они копируются при присваивании или передаче в функции, так же как `int` или `float`. Это отличается от C# или Java, где строки являются ссылочными типами.

```c
void StringExamples()
{
    string greeting = "Hello";
    string name = "Survivor";

    // Конкатенация с +
    string message = greeting + ", " + name + "!";  // "Hello, Survivor!"

    // Форматирование строк (заполнители с индексацией от 1)
    string formatted = string.Format("Player %1 has %2 health", name, 75);
    // Результат: "Player Survivor has 75 health"

    // Длина
    int len = message.Length();    // 17

    // Сравнение
    bool same = (greeting == "Hello");  // true

    // Преобразование из других типов
    string fromInt = "Score: " + 42;     // НЕ работает -- нужно преобразовать явно
    string correct = "Score: " + 42.ToString();  // "Score: 42"

    // Использование Format --- предпочтительный подход
    string best = string.Format("Score: %1", 42);  // "Score: 42"
}
```

### Escape-последовательности


Строки поддерживают стандартные escape-последовательности:

| Последовательность | Значение |
|----------|---------|
| `\n` | Новая строка |
| `\r` | Возврат каретки |
| `\t` | Табуляция |
| `\\` | Литеральный обратный слэш |
| `\"` | Литеральная двойная кавычка |

**Внимание:** Хотя они задокументированы, обратный слэш (`\\`) и экранированные кавычки (`\"`) известны проблемами с CParser в некоторых контекстах, особенно в операциях с JSON. При работе с путями файлов или JSON-строками по возможности избегайте обратных слэшей. Используйте прямые слэши для путей --- DayZ принимает их на всех платформах.

### Пример из практики: сообщение чата


```c
void SendAdminMessage(string adminName, string text)
{
    string msg = string.Format("[ADMIN] %1: %2", adminName, text);
    Print(msg);
}
```

---

## Работа с `vector`

Тип `vector` содержит три компонента `float` (x, y, z). Это фундаментальный тип DayZ для позиций, направлений, вращений и скоростей. Как строки и примитивы, векторы являются **типами-значениями** --- они копируются при присваивании.

### Инициализация

Векторы можно инициализировать двумя способами:

```c
void VectorInit()
{
    // Способ 1: Инициализация строкой (три числа через пробел)
    vector pos1 = "100.5 0 200.3";

    // Способ 2: Функция-конструктор Vector()
    vector pos2 = Vector(100.5, 0, 200.3);

    // Значение по умолчанию --- "0 0 0"
    vector empty;   // empty == <0, 0, 0>
}
```

**Важно:** Формат инициализации строкой использует **пробелы** в качестве разделителей, не запятые. `"1 2 3"` --- допустимо; `"1,2,3"` --- нет.

### Доступ к компонентам

Доступ к отдельным компонентам осуществляется через индексацию в стиле массива:

```c
void VectorComponents()
{
    vector pos = Vector(100.5, 25.0, 200.3);

    // Чтение компонентов
    float x = pos[0];   // 100.5  (Восток/Запад)
    float y = pos[1];   // 25.0   (Верх/Низ, высота)
    float z = pos[2];   // 200.3  (Север/Юг)

    // Запись компонентов
    pos[1] = 50.0;      // Изменить высоту на 50
}
```

Система координат DayZ:
- `[0]` = X = Восток(+) / Запад(-)
- `[1]` = Y = Верх(+) / Низ(-) (высота над уровнем моря)
- `[2]` = Z = Север(+) / Юг(-)

### Статические константы

```c
vector zero    = vector.Zero;      // "0 0 0"
vector up      = vector.Up;        // "0 1 0"
vector right   = vector.Aside;     // "1 0 0"
vector forward = vector.Forward;   // "0 0 1"
```

### Распространённые операции с векторами

```c
void VectorOps()
{
    vector pos1 = Vector(100, 0, 200);
    vector pos2 = Vector(150, 0, 250);

    // Расстояние между двумя точками
    float dist = vector.Distance(pos1, pos2);

    // Квадрат расстояния (быстрее, подходит для сравнений)
    float distSq = vector.DistanceSq(pos1, pos2);

    // Направление от pos1 к pos2
    vector dir = vector.Direction(pos1, pos2);

    // Нормализация вектора (сделать длину = 1)
    vector norm = dir.Normalized();

    // Длина вектора
    float len = dir.Length();

    // Линейная интерполяция (50% между pos1 и pos2)
    vector midpoint = vector.Lerp(pos1, pos2, 0.5);

    // Скалярное произведение
    float dot = vector.Dot(dir, vector.Up);
}
```

### Пример из практики: позиция спавна


```c
// Получить позицию на земле по заданным координатам X,Z
vector GetGroundPosition(float x, float z)
{
    vector pos = Vector(x, 0, z);
    pos[1] = GetGame().SurfaceY(x, z);  // Установить Y на высоту рельефа
    return pos;
}

// Получить случайную позицию в радиусе от центральной точки
vector GetRandomPositionAround(vector center, float radius)
{
    float angle = Math.RandomFloat(0, Math.PI2);
    float dist = Math.RandomFloat(0, radius);

    vector offset = Vector(Math.Cos(angle) * dist, 0, Math.Sin(angle) * dist);
    vector pos = center + offset;
    pos[1] = GetGame().SurfaceY(pos[0], pos[2]);
    return pos;
}
```

---

## Работа с `typename`

Тип `typename` хранит ссылку на сам тип. Он используется для рефлексии --- исследования и работы с типами во время выполнения. Вы встретите его при написании универсальных систем, загрузчиков конфигураций и фабричных паттернов.

```c
void TypenameExamples()
{
    // Получить typename класса
    typename t = PlayerBase;

    // Получить typename из строки
    typename t2 = t.StringToEnum(PlayerBase, "PlayerBase");

    // Сравнение типов
    if (t == PlayerBase)
        Print("It's PlayerBase!");

    // Получить typename экземпляра объекта
    PlayerBase player;
    // ... предположим, player валиден ...
    typename objType = player.Type();

    // Проверка наследования
    bool isMan = objType.IsInherited(Man);

    // Преобразование typename в строку
    string name = t.ToString();  // "PlayerBase"

    // Создание экземпляра из typename (фабричный паттерн)
    Class instance = t.Spawn();
}
```

### Преобразование enum с typename

```c
enum DamageType
{
    MELEE = 0,
    BULLET = 1,
    EXPLOSION = 2
};

void EnumConvert()
{
    // Enum в строку
    string name = typename.EnumToString(DamageType, DamageType.BULLET);
    // name == "BULLET"

    // Строка в enum
    int value;
    typename.StringToEnum(DamageType, "EXPLOSION", value);
    // value == 2
}
```

---

## Преобразование типов


Enforce Script поддерживает как неявные, так и явные преобразования между типами.

### Неявные преобразования


Некоторые преобразования происходят автоматически:

```c
void ImplicitConversions()
{
    // int в float (всегда безопасно, без потери данных)
    int count = 42;
    float fCount = count;    // 42.0

    // float в int (УСЕКАЕТ, не округляет!)
    float precise = 3.99;
    int truncated = precise;  // 3, НЕ 4

    // int/float в bool
    bool fromInt = 5;      // true (не ноль)
    bool fromZero = 0;     // false
    bool fromFloat = 0.1;  // true (не ноль)

    // bool в int
    int fromBool = true;   // 1
    int fromFalse = false; // 0
}
```

### Явные преобразования (парсинг)


Для преобразования между строками и числовыми типами используйте методы парсинга:

```c
void ExplicitConversions()
{
    // Строка в int
    int num = "42".ToInt();           // 42
    int bad = "hello".ToInt();        // 0 (завершается молча)

    // Строка в float
    float f = "3.14".ToFloat();       // 3.14

    // Строка в vector
    vector v = "100 25 200".ToVector();  // <100, 25, 200>

    // Число в строку (используя Format)
    string s1 = string.Format("%1", 42);       // "42"
    string s2 = string.Format("%1", 3.14);     // "3.14"

    // int/float .ToString()
    string s3 = (42).ToString();     // "42"
}
```

### Приведение типов объектов


Для типов классов используйте `Class.CastTo()` или `ClassName.Cast()`. Подробнее это рассмотрено в [Главе 1.3](03-classes-inheritance.md), но вот основной паттерн:

```c
void CastExample()
{
    Object obj = GetSomeObject();

    // Безопасное приведение (предпочтительно)
    PlayerBase player;
    if (Class.CastTo(player, obj))
    {
        // player валиден и безопасен для использования
        string name = player.GetIdentity().GetName();
    }

    // Альтернативный синтаксис приведения
    PlayerBase player2 = PlayerBase.Cast(obj);
    if (player2)
    {
        // player2 валиден
    }
}
```

---

## Область видимости переменных


Переменные существуют только в пределах блока кода (фигурных скобок), где они объявлены. Enforce Script **не** позволяет повторно объявлять имя переменной во вложенных или смежных областях видимости.

```c
void ScopeExample()
{
    int x = 10;

    if (true)
    {
        // int x = 20;  // ОШИБКА: повторное объявление 'x' во вложенной области
        x = 20;         // OK: изменение внешней переменной x
        int y = 30;     // OK: новая переменная в этой области
    }

    // y НЕ доступна здесь (объявлена во внутренней области)
    // Print(y);  // ОШИБКА: необъявленный идентификатор 'y'

    // ВАЖНО: это также применяется к циклам for
    for (int i = 0; i < 5; i++)
    {
        // i существует здесь
    }
    // for (int i = 0; i < 3; i++)  // ОШИБКА в DayZ: 'i' уже объявлена
    // Используйте другое имя:
    for (int j = 0; j < 3; j++)
    {
        // j существует здесь
    }
}
```

### Ловушка одноуровневой области видимости


Это одна из самых известных особенностей Enforce Script. Объявление переменной с одним и тем же именем в блоках `if` и `else` вызывает ошибку компиляции:

```c
void SiblingTrap()
{
    if (someCondition)
    {
        int result = 10;    // Объявлена здесь
        Print(result);
    }
    else
    {
        // int result = 20; // ОШИБКА: множественное объявление 'result'
        // Несмотря на то, что это смежная область, а не та же самая
    }

    // РЕШЕНИЕ: объявить перед if/else
    int result;
    if (someCondition)
    {
        result = 10;
    }
    else
    {
        result = 20;
    }
}
```

---

## Распространённые ошибки


### 1. Неинициализированные переменные в логике

Примитивы получают значения по умолчанию (`0`, `0.0`, `false`, `""`), но полагаться на это делает код хрупким и трудночитаемым. Всегда инициализируйте явно.

```c
// ПЛОХО: зависимость от неявного нуля
int count;
if (count > 0)  // Работает, потому что count == 0, но намерение неясно
    DoThing();

// ХОРОШО: явная инициализация
int count = 0;
if (count > 0)
    DoThing();
```

### 2. Усечение float в int

Преобразование float в int усекает (округляет к нулю), а не округляет к ближайшему:

```c
float f = 3.99;
int i = f;         // i == 3, НЕ 4

// Если нужно округление:
int rounded = Math.Round(f);  // 4
```

### 3. Точность float в сравнениях

Никогда не сравнивайте float на точное равенство:

```c
float a = 0.1 + 0.2;
// ПЛОХО: может не сработать из-за представления с плавающей точкой
if (a == 0.3)
    Print("Equal");

// ХОРОШО: используйте допуск (эпсилон)
if (Math.AbsFloat(a - 0.3) < 0.001)
    Print("Close enough");
```

### 4. Конкатенация строк с числами

Нельзя просто прибавить число к строке с помощью `+`. Используйте `string.Format()`:

```c
int kills = 5;
// Потенциально проблематично:
// string msg = "Kills: " + kills;

// ПРАВИЛЬНО: используйте Format
string msg = string.Format("Kills: %1", kills);
```

### 5. Формат строки vector

Инициализация вектора строкой требует пробелов, а не запятых:

```c
vector good = "100 25 200";     // ПРАВИЛЬНО
// vector bad = "100, 25, 200"; // НЕПРАВИЛЬНО: запятые не обрабатываются корректно
// vector bad2 = "100,25,200";  // НЕПРАВИЛЬНО
```

### 6. Строки и векторы --- типы-значения

В отличие от объектов классов, строки и векторы копируются при присваивании. Изменение копии не влияет на оригинал:

```c
vector posA = "10 20 30";
vector posB = posA;       // posB --- это КОПИЯ
posB[1] = 99;             // Изменяется только posB
// posA по-прежнему "10 20 30"
```

---

## Практические упражнения


### Упражнение 1: Основы переменных

Объявите переменные для хранения:
- Имени игрока (string)
- Процента здоровья (float, 0-100)
- Количества убийств (int)
- Является ли администратором (bool)
- Позиции в мире (vector)

Выведите форматированную сводку с помощью `string.Format()`.

### Упражнение 2: Конвертер температур

Напишите функцию `float CelsiusToFahrenheit(float celsius)` и обратную `float FahrenheitToCelsius(float fahrenheit)`. Проверьте на точке кипения (100C = 212F) и точке замерзания (0C = 32F).

### Упражнение 3: Калькулятор расстояний

Напишите функцию, которая принимает два вектора и возвращает:
- 3D-расстояние между ними
- 2D-расстояние (без учёта высоты/оси Y)
- Разницу по высоте

Подсказка: для 2D-расстояния создайте новые векторы с `[1]`, установленным в `0`, перед вычислением расстояния.

### Упражнение 4: Манипуляции с типами

Дана строка `"42"`, преобразуйте её в:
1. `int`
2. `float`
3. Обратно в `string` с помощью `string.Format()`
4. `bool` (должно быть `true`, так как значение int не равно нулю)

### Упражнение 5: Позиция на земле

Напишите функцию `vector SnapToGround(vector pos)`, которая принимает любую позицию и возвращает её с компонентом Y, установленным на высоту рельефа в данном месте X,Z. Используйте `GetGame().SurfaceY()`.

---

## Итоги


| Концепция | Ключевой момент |
|---------|-----------|
| Типы | `int`, `float`, `bool`, `string`, `vector`, `typename`, `void` |
| Значения по умолчанию | `0`, `0.0`, `false`, `""`, `"0 0 0"`, `null` |
| Константы | Ключевое слово `const`, соглашение `UPPER_SNAKE_CASE` |
| Векторы | Инициализация строкой `"x y z"` или `Vector(x,y,z)`, доступ через `[0]`, `[1]`, `[2]` |
| Область видимости | Переменные ограничены блоками `{}`; нет повторного объявления во вложенных/смежных блоках |
| Преобразование | `float` в `int` усекает; используйте `.ToInt()`, `.ToFloat()`, `.ToVector()` для парсинга строк |
| Форматирование | Всегда используйте `string.Format()` для построения строк из смешанных типов |

---

[Главная](../README.md) | **Переменные и типы** | [Следующая: Массивы, Map и Set >>](02-arrays-maps-sets.md)
