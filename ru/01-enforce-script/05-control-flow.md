# Глава 1.5: Управление потоком выполнения

[Главная](../../README.md) | [<< Назад: Modded-классы](04-modded-classes.md) | **Управление потоком выполнения** | [Далее: Строковые операции >>](06-strings.md)

---

## Введение

Управление потоком выполнения определяет порядок, в котором выполняется ваш код. Enforce Script предоставляет знакомые конструкции `if/else`, `for`, `while`, `foreach` и `switch` -- но с несколькими важными отличиями от C/C++, которые застанут вас врасплох, если вы не будете к ним готовы. Эта глава охватывает все механизмы управления потоком, включая подводные камни, уникальные для скриптового движка DayZ.

---

## if / else / else if

Оператор `if` вычисляет логическое выражение и выполняет блок кода, когда результат равен `true`. Условия можно объединять в цепочку с помощью `else if` и предоставлять запасной вариант с помощью `else`.

```c
void CheckHealth(PlayerBase player)
{
    float health = player.GetHealth("", "Health");

    if (health > 75)
    {
        Print("Player is healthy");
    }
    else if (health > 25)
    {
        Print("Player is wounded");
    }
    else
    {
        Print("Player is critical");
    }
}
```

### Проверки на null

В Enforce Script ссылки на объекты возвращают `false`, когда равны null. Это стандартный способ защиты от обращения к null:

```c
void ProcessItem(EntityAI item)
{
    if (!item)
        return;

    string name = item.GetType();
    Print("Processing: " + name);
}
```

### Логические операторы

Объединяйте условия с помощью `&&` (И) и `||` (ИЛИ). Применяется сокращённое вычисление: если левая часть `&&` равна `false`, правая часть не вычисляется.

```c
void CheckPlayerState(PlayerBase player)
{
    if (player && player.IsAlive())
    {
        // Безопасно -- player сначала проверяется на null перед вызовом IsAlive()
        Print("Player is alive");
    }

    if (player.GetHealth("", "Blood") < 3000 || player.GetHealth("", "Health") < 25)
    {
        Print("Player is in danger");
    }
}
```

### ПОДВОДНЫЙ КАМЕНЬ: Повторное объявление переменной в блоках else-if

Это одна из самых частых ошибок Enforce Script. В большинстве языков переменные, объявленные внутри одной ветви `if`, независимы от переменных в соседней ветви `else`. **В Enforce Script не так.** Объявление одинакового имени переменной в соседних блоках `if`/`else if`/`else` вызывает **ошибку множественного объявления** на этапе компиляции.

```c
// НЕПРАВИЛЬНО -- Ошибка компиляции!
void BadExample(Object obj)
{
    if (obj.IsKindOf("Car"))
    {
        Car vehicle = Car.Cast(obj);
        vehicle.GetSpeedometer();
    }
    else if (obj.IsKindOf("ItemBase"))
    {
        ItemBase item = ItemBase.Cast(obj);    // OK -- другое имя
        item.GetQuantity();
    }
    else
    {
        string msg = "Unknown object";         // Первое объявление msg
        Print(msg);
    }
}
```

Подождите -- выглядит нормально, верно? Проблема возникает, когда вы используете **одинаковое имя переменной** в двух ветвях:

```c
// НЕПРАВИЛЬНО -- Ошибка компиляции: множественное объявление 'result'
void ProcessObject(Object obj)
{
    if (obj.IsKindOf("Car"))
    {
        string result = "It's a car";
        Print(result);
    }
    else
    {
        string result = "It's something else";  // ОШИБКА! То же имя, что и в блоке if
        Print(result);
    }
}
```

**Решение:** Объявите переменную **перед** оператором if или используйте уникальные имена для каждой ветви.

```c
// ПРАВИЛЬНО -- Объявить перед if
void ProcessObject(Object obj)
{
    string result;

    if (obj.IsKindOf("Car"))
    {
        result = "It's a car";
    }
    else
    {
        result = "It's something else";
    }

    Print(result);
}
```

---

## Цикл for

Цикл `for` идентичен синтаксису в стиле C: инициализатор, условие и инкремент.

```c
// Вывести числа от 0 до 9
void CountToTen()
{
    for (int i = 0; i < 10; i++)
    {
        Print(i);
    }
}
```

### Итерация по массиву с помощью for

```c
void ListInventory(PlayerBase player)
{
    array<EntityAI> items = new array<EntityAI>;
    player.GetInventory().EnumerateInventory(InventoryTraversalType.PREORDER, items);

    for (int i = 0; i < items.Count(); i++)
    {
        EntityAI item = items.Get(i);
        if (item)
        {
            Print(string.Format("[%1] %2", i, item.GetType()));
        }
    }
}
```

### Вложенные циклы for

```c
// Создание сетки объектов
void SpawnGrid(vector origin, int rows, int cols, float spacing)
{
    for (int r = 0; r < rows; r++)
    {
        for (int c = 0; c < cols; c++)
        {
            vector pos = origin;
            pos[0] = pos[0] + (c * spacing);
            pos[2] = pos[2] + (r * spacing);
            pos[1] = GetGame().SurfaceY(pos[0], pos[2]);

            GetGame().CreateObject("Barrel_Green", pos, false, false, true);
        }
    }
}
```

> **Примечание:** Не объявляйте повторно переменную цикла `i`, если в охватывающей области видимости уже есть переменная с именем `i`. Enforce Script считает это ошибкой множественного объявления, даже во вложенных областях.

---

## Цикл while

Цикл `while` повторяет блок, пока его условие равно `true`. Условие вычисляется **перед** каждой итерацией.

```c
// Удалить всех мёртвых зомби из списка отслеживания
void CleanupDeadZombies(array<DayZInfected> zombieList)
{
    int i = 0;
    while (i < zombieList.Count())
    {
        EntityAI eai;
        if (Class.CastTo(eai, zombieList.Get(i)) && !eai.IsAlive())
        {
            zombieList.RemoveOrdered(i);
            // НЕ увеличиваем i -- следующий элемент сдвинулся на этот индекс
        }
        else
        {
            i++;
        }
    }
}
```

### ВНИМАНИЕ: В Enforce Script НЕТ do...while

Ключевое слово `do...while` не существует. Компилятор отклонит его. Если вам нужен цикл, который всегда выполняется хотя бы один раз, используйте шаблон с флагом, описанный ниже.

```c
// НЕПРАВИЛЬНО -- Это НЕ скомпилируется
do
{
    // тело
}
while (someCondition);
```

---

## Имитация do...while с помощью флага

Стандартный обходной путь -- использовать переменную `bool`, которая равна `true` на первой итерации:

```c
void SimulateDoWhile()
{
    bool first = true;
    int attempts = 0;
    vector spawnPos;

    while (first || !IsPositionSafe(spawnPos))
    {
        first = false;
        attempts++;
        spawnPos = GetRandomPosition();

        if (attempts > 100)
            break;
    }

    Print(string.Format("Found safe position after %1 attempts", attempts));
}
```

Альтернативный подход с использованием `break`:

```c
void AlternativeDoWhile()
{
    while (true)
    {
        // Тело выполняется хотя бы один раз
        DoSomething();

        // Проверка условия выхода В КОНЦЕ
        if (!ShouldContinue())
            break;
    }
}
```

---

## foreach

Оператор `foreach` — наиболее чистый способ итерации по массивам, словарям и статическим массивам. Он имеет две формы.

### Простой foreach (только значение)

```c
void AnnounceItems(array<string> itemNames)
{
    foreach (string name : itemNames)
    {
        Print("Found item: " + name);
    }
}
```

### foreach с индексом

При итерации по массивам первая переменная получает индекс:

```c
void ListPlayers(array<Man> players)
{
    foreach (int idx, Man player : players)
    {
        Print(string.Format("Player #%1: %2", idx, player.GetIdentity().GetName()));
    }
}
```

### foreach по словарям

Для словарей первая переменная получает ключ, а вторая — значение:

```c
void PrintScoreboard(map<string, int> scores)
{
    foreach (string playerName, int score : scores)
    {
        Print(string.Format("%1: %2 kills", playerName, score));
    }
}
```

Можно также итерировать по словарям, получая только значение:

```c
void SumScores(map<string, int> scores)
{
    int total = 0;
    foreach (int score : scores)
    {
        total += score;
    }
    Print("Total kills: " + total);
}
```

### foreach по статическим массивам

```c
void PrintStaticArray()
{
    int numbers[] = {10, 20, 30, 40, 50};

    foreach (int value : numbers)
    {
        Print(value);
    }
}
```

---

## switch / case

Оператор `switch` сопоставляет значение со списком меток `case`. Он работает с `int`, `string`, значениями перечислений и константами.

### Важно: НЕТ проваливания (fall-through)

В отличие от C/C++, `switch/case` в Enforce Script **НЕ** проваливается из одного case в следующий. Каждый `case` независим. Вы можете включить `break` для ясности, но он не требуется для предотвращения проваливания.

```c
void HandleCommand(string command)
{
    switch (command)
    {
        case "heal":
            HealPlayer();
            break;

        case "kill":
            KillPlayer();
            break;

        case "teleport":
            TeleportPlayer();
            break;

        default:
            Print("Unknown command: " + command);
            break;
    }
}
```

### switch с перечислениями

```c
enum EDifficulty
{
    EASY = 0,
    MEDIUM,
    HARD
};

void SetDifficulty(EDifficulty difficulty)
{
    float zombieMultiplier;

    switch (difficulty)
    {
        case EDifficulty.EASY:
            zombieMultiplier = 0.5;
            break;

        case EDifficulty.MEDIUM:
            zombieMultiplier = 1.0;
            break;

        case EDifficulty.HARD:
            zombieMultiplier = 2.0;
            break;

        default:
            zombieMultiplier = 1.0;
            break;
    }

    Print(string.Format("Zombie multiplier: %1", zombieMultiplier));
}
```

### switch с целочисленными константами

```c
void DescribeWeaponSlot(int slotId)
{
    const int SLOT_SHOULDER = 0;
    const int SLOT_MELEE = 1;
    const int SLOT_PISTOL = 2;

    switch (slotId)
    {
        case SLOT_SHOULDER:
            Print("Primary weapon");
            break;

        case SLOT_MELEE:
            Print("Melee weapon");
            break;

        case SLOT_PISTOL:
            Print("Sidearm");
            break;

        default:
            Print("Unknown slot");
            break;
    }
}
```

> **Помните:** Поскольку проваливания нет, вы не можете складывать case для общего обработчика, как в C. Каждый case должен иметь собственное тело.

---

## break и continue

### break

`break` немедленно выходит из самого внутреннего цикла (или case оператора switch).

```c
// Найти первого игрока в пределах 100 метров
void FindNearbyPlayer(vector origin, array<Man> players)
{
    foreach (Man player : players)
    {
        float dist = vector.Distance(origin, player.GetPosition());
        if (dist < 100)
        {
            Print("Found nearby player: " + player.GetIdentity().GetName());
            break; // Прекратить поиск
        }
    }
}
```

### continue

`continue` пропускает оставшуюся часть текущей итерации и переходит к следующей.

```c
// Обработать только живых игроков
void HealAllPlayers(array<Man> players)
{
    foreach (Man man : players)
    {
        PlayerBase player;
        if (!Class.CastTo(player, man))
            continue; // Не PlayerBase, пропустить

        if (!player.IsAlive())
            continue; // Мёртв, пропустить

        player.SetHealth("", "Health", 100);
        Print("Healed: " + player.GetIdentity().GetName());
    }
}
```

### Вложенные циклы с break

`break` выходит только из самого внутреннего цикла. Для выхода из вложенных циклов используйте переменную-флаг:

```c
void FindItemInGrid(array<array<string>> grid, string target)
{
    bool found = false;

    for (int row = 0; row < grid.Count(); row++)
    {
        for (int col = 0; col < grid.Get(row).Count(); col++)
        {
            if (grid.Get(row).Get(col) == target)
            {
                Print(string.Format("Found '%1' at [%2, %3]", target, row, col));
                found = true;
                break; // Выходит только из внутреннего цикла
            }
        }

        if (found)
            break; // Выход из внешнего цикла
    }
}
```

---

## Ключевое слово thread

Enforce Script имеет ключевое слово `thread` для асинхронного выполнения:

```c
// Объявление потоковой функции
thread void LongOperation()
{
    // Это выполняется асинхронно
    Sleep(5000);  // Ожидание 5 секунд без блокировки
    Print("Done!");
}

// Вызов
thread LongOperation();  // Запускается без блокировки вызывающего кода
```

**Важно:** `thread` в Enforce Script — это НЕ то же самое, что потоки ОС. Это скорее корутина --- она выполняется в том же потоке, но может уступать/засыпать без блокировки игры. Используйте `CallLater` вместо `thread` для большинства случаев в модах --- это проще и предсказуемее.

### Thread vs CallLater

| Возможность | `thread` | `CallLater` |
|-------------|----------|-------------|
| Синтаксис | `thread MyFunc();` | `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.MyFunc, delayMs, repeat);` |
| Может засыпать/уступать | Да (`Sleep()`) | Нет (срабатывает один раз или повторяется с интервалом) |
| Отменяемый | Нет встроенной отмены | Да (`CallQueue.Remove()`) |
| Применение | Последовательная асинхронная логика с ожиданиями | Отложенные или повторяющиеся обратные вызовы |

Для большинства сценариев моддинга DayZ `CallLater` с таймером является предпочтительным подходом. Используйте `thread` только в случаях, когда вам действительно нужна последовательная логика с промежуточными ожиданиями (например, многоэтапная анимационная последовательность).

---

## Лучшие практики

- Используйте защитные проверки (`if (!x) return;`) в начале функций вместо глубоко вложенных блоков `if` -- это делает основной путь плоским и читаемым.
- Объявляйте общие переменные перед блоками `if`/`else`, чтобы избежать ошибки повторного объявления в смежных областях, уникальной для Enforce Script.
- Используйте `foreach` для простой итерации и `for` с индексом только когда нужно удалять элементы или обращаться к соседним.
- Заменяйте `do...while` на `while (first || condition)` с флагом `bool first = true` -- это стандартный обходной путь в Enforce Script.
- Предпочитайте `CallLater` вместо `thread` для отложенных или повторяющихся действий -- он отменяем, проще и предсказуемее.

---

## Наблюдается в реальных модах

> Шаблоны подтверждены изучением исходного кода профессиональных модов DayZ.

| Шаблон | Мод | Описание |
|--------|-----|----------|
| Защитная проверка + `continue` в циклах | COT / Expansion | Циклы по игрокам всегда используют `continue` при неудачном приведении типа или `!IsAlive()` перед выполнением работы |
| `switch` по строковым командам | VPP Admin | Обработчики команд чата используют `switch(command)` со строковыми case типа `"!heal"`, `"!tp"` |
| Переменная-флаг для выхода из вложенных циклов | Expansion Market | Используют `bool found = false` с проверкой после внутреннего цикла для выхода из внешнего |
| `CallLater` для отложенного спавна | Dabs Framework | Предпочитают `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater()` вместо `thread` |

---

## Теория vs практика

| Концепция | Теория | Реальность |
|-----------|--------|------------|
| Цикл `do...while` | Стандарт в большинстве C-подобных языков | Не существует в Enforce Script; вызывает непонятную ошибку компиляции |
| Проваливание `switch` | В C/C++ case проваливаются без `break` | В Enforce Script case независимы -- складывание case не разделяет обработчики |
| Ключевое слово `thread` | Звучит как многопоточность | На самом деле корутина в основном потоке; `Sleep()` уступает, а не блокирует |
| Область видимости переменных в `if`/`else` | Смежные блоки должны иметь независимую область | Enforce Script рассматривает их как общую область -- одинаковое имя переменной в обоих блоках — ошибка компиляции |

---

## Распространённые ошибки

| Ошибка | Проблема | Решение |
|--------|----------|---------|
| Использование `do...while` | Не существует в Enforce Script | Используйте `while` с флагом `bool first = true` |
| Объявление одной переменной в блоках `if` и `else` | Ошибка множественного объявления | Объявите переменную перед `if` |
| Повторное объявление переменной цикла `i` во вложенной области | Ошибка множественного объявления | Используйте разные имена (`i`, `j`, `k`) или объявите снаружи |
| Ожидание проваливания `switch` | Case независимы, нет проваливания | Каждый case должен иметь свой полный обработчик |
| Изменение массива при итерации через `foreach` | Неопределённое поведение, возможный вылет | Используйте цикл `for` с индексом при удалении элементов |
| Бесконечный цикл `while` без `break` | Зависание сервера / клиента | Всегда убеждайтесь, что условие станет `false`, или используйте `break` |

---

## Краткий справочник

```c
// if / else if / else
if (condition) { } else if (other) { } else { }

// цикл for
for (int i = 0; i < count; i++) { }

// цикл while
while (condition) { }

// Имитация do...while
bool first = true;
while (first || condition) { first = false; /* тело */ }

// foreach (только значение)
foreach (Type value : collection) { }

// foreach (индекс + значение)
foreach (int i, Type value : array) { }

// foreach (ключ + значение для словаря)
foreach (KeyType key, ValueType val : someMap) { }

// switch/case (без проваливания)
switch (value) { case X: /* ... */ break; default: break; }

// thread (корутинный стиль асинхронности)
thread void MyFunc() { Sleep(1000); }
thread MyFunc();  // неблокирующий вызов
```

---

[<< 1.4: Modded-классы](04-modded-classes.md) | [Главная](../../README.md) | [1.6: Строковые операции >>](06-strings.md)
