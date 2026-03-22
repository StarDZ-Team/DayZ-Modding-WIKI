# Глава 1.2: Массивы, словари и множества

[Главная](../README.md) | [<< Назад: Переменные и типы](01-variables-types.md) | **Массивы, словари и множества** | [Далее: Классы и наследование >>](03-classes-inheritance.md)

---

## Введение

Реальные моды DayZ работают с коллекциями объектов: списками игроков, инвентарями предметов, соответствиями идентификаторов игроков правам доступа, наборами активных зон. Enforce Script предоставляет три типа коллекций для этих нужд:

- **`array<T>`** --- Динамический упорядоченный список с изменяемым размером (коллекция, которую вы будете использовать чаще всего)
- **`map<K,V>`** --- Ассоциативный контейнер ключ-значение (хеш-таблица)
- **`set<T>`** --- Упорядоченная коллекция с удалением по значению

Также существуют **статические массивы** (`int arr[5]`) для данных фиксированного размера, известного на этапе компиляции. Эта глава подробно рассматривает все типы коллекций, включая каждый доступный метод, шаблоны итерации и тонкие подводные камни, которые вызывают реальные ошибки в рабочих модах.

---

## Статические массивы

Статические массивы имеют фиксированный размер, определяемый на этапе компиляции. Они не могут увеличиваться или уменьшаться. Они полезны для небольших коллекций известного размера и более эффективны по памяти, чем динамические массивы.

### Объявление и использование

```c
void StaticArrayBasics()
{
    // Объявление с литеральным размером
    int numbers[5];
    numbers[0] = 10;
    numbers[1] = 20;
    numbers[2] = 30;
    numbers[3] = 40;
    numbers[4] = 50;

    // Объявление со списком инициализации
    float damages[3] = {10.5, 25.0, 50.0};

    // Объявление с константным размером
    const int GRID_SIZE = 4;
    string labels[GRID_SIZE];

    // Доступ к элементам
    int first = numbers[0];     // 10
    float maxDmg = damages[2];  // 50.0

    // Итерация циклом for
    for (int i = 0; i < 5; i++)
    {
        Print(numbers[i]);
    }
}
```

### Правила статических массивов

1. Размер должен быть константой времени компиляции (литерал или `const int`)
2. Вы **не можете** использовать переменную как размер: `int arr[myVar]` — ошибка компиляции
3. Обращение к индексу за пределами массива вызывает неопределённое поведение (проверка границ во время выполнения отсутствует)
4. Статические массивы передаются в функции по ссылке (в отличие от примитивов)

```c
// Статические массивы как параметры функций
void FillArray(int arr[3])
{
    arr[0] = 100;
    arr[1] = 200;
    arr[2] = 300;
}

void Test()
{
    int myArr[3];
    FillArray(myArr);
    Print(myArr[0]);  // 100 -- оригинал изменён (передан по ссылке)
}
```

### Когда использовать статические массивы

Используйте статические массивы для:
- Данных вектор/матрица (`vector mat[3]` для матриц вращения 3x3)
- Небольших фиксированных таблиц поиска
- Критичных по производительности горячих путей, где важно выделение памяти

Для всего остального используйте динамический `array<T>`.

---

## Динамические массивы: `array<T>`

Динамические массивы — наиболее часто используемая коллекция в моддинге DayZ. Они могут увеличиваться и уменьшаться во время выполнения, поддерживают обобщённые типы и предоставляют богатый набор методов.

### Создание

```c
void CreateArrays()
{
    // Способ 1: оператор new
    array<string> names = new array<string>;

    // Способ 2: список инициализации
    array<int> scores = {100, 85, 92, 78};

    // Способ 3: использование typedef
    TStringArray items = new TStringArray;  // то же самое, что array<string>

    // Массивы любого типа
    array<float> distances = new array<float>;
    array<bool> flags = new array<bool>;
    array<vector> positions = new array<vector>;
    array<PlayerBase> players = new array<PlayerBase>;
}
```

### Предопределённые typedef

DayZ предоставляет сокращённые typedef для наиболее распространённых типов массивов:

```c
typedef array<string>  TStringArray;
typedef array<float>   TFloatArray;
typedef array<int>     TIntArray;
typedef array<bool>    TBoolArray;
typedef array<vector>  TVectorArray;
```

Вы будете постоянно встречать `TStringArray` в коде DayZ --- парсинг конфигураций, сообщения чата, таблицы лута и многое другое.

---

## Полный справочник методов массива

### Добавление элементов

```c
void AddingElements()
{
    array<string> items = new array<string>;

    // Insert: добавить в конец, возвращает новый индекс
    int idx = items.Insert("Bandage");     // idx == 0
    idx = items.Insert("Morphine");        // idx == 1
    idx = items.Insert("Saline");          // idx == 2
    // items: ["Bandage", "Morphine", "Saline"]

    // InsertAt: вставить по указанному индексу, сдвигает существующие элементы вправо
    items.InsertAt("Epinephrine", 1);
    // items: ["Bandage", "Epinephrine", "Morphine", "Saline"]

    // InsertAll: добавить все элементы из другого массива
    array<string> moreItems = {"Tetracycline", "Charcoal"};
    items.InsertAll(moreItems);
    // items: ["Bandage", "Epinephrine", "Morphine", "Saline", "Tetracycline", "Charcoal"]
}
```

### Доступ к элементам

```c
void AccessingElements()
{
    array<string> items = {"Apple", "Banana", "Cherry", "Date"};

    // Get: доступ по индексу
    string first = items.Get(0);       // "Apple"
    string third = items.Get(2);       // "Cherry"

    // Оператор квадратных скобок: то же самое, что Get
    string second = items[1];          // "Banana"

    // Set: замена элемента по индексу
    items.Set(1, "Blueberry");         // items[1] теперь "Blueberry"

    // Count: количество элементов
    int count = items.Count();         // 4

    // IsValidIndex: проверка границ
    bool valid = items.IsValidIndex(3);   // true
    bool invalid = items.IsValidIndex(4); // false
    bool negative = items.IsValidIndex(-1); // false
}
```

### Поиск

```c
void SearchingArrays()
{
    array<string> weapons = {"AKM", "M4A1", "Mosin", "IZH18", "AKM"};

    // Find: возвращает первый индекс элемента, или -1 если не найден
    int idx = weapons.Find("Mosin");    // 2
    int notFound = weapons.Find("FAL");  // -1

    // Проверка существования
    if (weapons.Find("M4A1") != -1)
        Print("M4A1 found!");

    // GetRandomElement: возвращает случайный элемент
    string randomWeapon = weapons.GetRandomElement();

    // GetRandomIndex: возвращает случайный допустимый индекс
    int randomIdx = weapons.GetRandomIndex();
}
```

### Удаление элементов

Именно здесь возникают наиболее частые ошибки. Обратите особое внимание на разницу между `Remove` и `RemoveOrdered`.

```c
void RemovingElements()
{
    array<string> items = {"A", "B", "C", "D", "E"};

    // Remove(index): БЫСТРОЕ, но НЕУПОРЯДОЧЕННОЕ удаление
    // Меняет местами элемент по индексу с ПОСЛЕДНИМ элементом, затем уменьшает массив
    items.Remove(1);  // Удаляет "B", поменяв местами с "E"
    // items теперь: ["A", "E", "C", "D"]  -- ПОРЯДОК ИЗМЕНЁН!

    // RemoveOrdered(index): МЕДЛЕННОЕ, но сохраняет порядок
    // Сдвигает все элементы после индекса влево на один
    items = {"A", "B", "C", "D", "E"};
    items.RemoveOrdered(1);  // Удаляет "B", сдвигает C,D,E влево
    // items теперь: ["A", "C", "D", "E"]  -- порядок сохранён

    // RemoveItem(value): находит элемент и удаляет его (упорядоченно)
    items = {"A", "B", "C", "D", "E"};
    items.RemoveItem("C");
    // items теперь: ["A", "B", "D", "E"]

    // Clear: удалить все элементы
    items.Clear();
    // items.Count() == 0
}
```

### Размер и ёмкость

```c
void SizingArrays()
{
    array<int> data = new array<int>;

    // Reserve: предварительно выделить внутреннюю ёмкость (НЕ изменяет Count)
    // Используйте, когда знаете, сколько элементов добавите
    data.Reserve(100);
    // data.Count() == 0, но внутренний буфер готов для 100 элементов

    // Resize: изменить Count, заполняя новые слоты значениями по умолчанию
    data.Resize(10);
    // data.Count() == 10, все элементы равны 0

    // Resize до меньшего размера обрезает
    data.Resize(5);
    // data.Count() == 5
}
```

### Сортировка и перемешивание

```c
void OrderingArrays()
{
    array<int> numbers = {5, 2, 8, 1, 9, 3};

    // Сортировка по возрастанию
    numbers.Sort();
    // numbers: [1, 2, 3, 5, 8, 9]

    // Сортировка по убыванию
    numbers.Sort(true);
    // numbers: [9, 8, 5, 3, 2, 1]

    // Invert (обратный порядок) массива
    numbers = {1, 2, 3, 4, 5};
    numbers.Invert();
    // numbers: [5, 4, 3, 2, 1]

    // Случайное перемешивание
    numbers.ShuffleArray();
    // numbers: [3, 1, 5, 2, 4]  (случайный порядок)
}
```

### Копирование

```c
void CopyingArrays()
{
    array<string> original = {"A", "B", "C"};

    // Copy: заменяет всё содержимое копией другого массива
    array<string> copy = new array<string>;
    copy.Copy(original);
    // copy: ["A", "B", "C"]
    // Изменение copy НЕ влияет на original

    // InsertAll: добавляет (не заменяет)
    array<string> combined = {"X", "Y"};
    combined.InsertAll(original);
    // combined: ["X", "Y", "A", "B", "C"]
}
```

### Отладка

```c
void DebuggingArrays()
{
    array<string> items = {"Bandage", "Morphine", "Saline"};

    // Debug: выводит все элементы в лог скриптов
    items.Debug();
    // Вывод:
    // [0] => Bandage
    // [1] => Morphine
    // [2] => Saline
}
```

---

## Итерация по массивам

### Цикл for (по индексу)

```c
void ForLoopIteration()
{
    array<string> items = {"AKM", "M4A1", "Mosin"};

    for (int i = 0; i < items.Count(); i++)
    {
        Print(string.Format("[%1] %2", i, items[i]));
    }
    // [0] AKM
    // [1] M4A1
    // [2] Mosin
}
```

### foreach (только значение)

```c
void ForEachValue()
{
    array<string> items = {"AKM", "M4A1", "Mosin"};

    foreach (string weapon : items)
    {
        Print(weapon);
    }
    // AKM
    // M4A1
    // Mosin
}
```

### foreach (индекс + значение)

```c
void ForEachIndexValue()
{
    array<string> items = {"AKM", "M4A1", "Mosin"};

    foreach (int i, string weapon : items)
    {
        Print(string.Format("[%1] %2", i, weapon));
    }
    // [0] AKM
    // [1] M4A1
    // [2] Mosin
}
```

### Реальный пример: Поиск ближайшего игрока

```c
PlayerBase FindNearestPlayer(vector origin, float maxRange)
{
    array<Man> allPlayers = new array<Man>;
    GetGame().GetPlayers(allPlayers);

    PlayerBase nearest = null;
    float nearestDist = maxRange;

    foreach (Man man : allPlayers)
    {
        PlayerBase player;
        if (!Class.CastTo(player, man))
            continue;

        if (!player.IsAlive())
            continue;

        float dist = vector.Distance(origin, player.GetPosition());
        if (dist < nearestDist)
        {
            nearestDist = dist;
            nearest = player;
        }
    }

    return nearest;
}
```

---

## Словари: `map<K,V>`

Словари хранят пары ключ-значение. Они используются, когда нужно искать значение по ключу --- данные игрока по UID, цены предметов по имени класса, права по имени роли и так далее.

### Создание

```c
void CreateMaps()
{
    // Стандартное создание
    map<string, int> prices = new map<string, int>;

    // Словари различных типов
    map<string, float> multipliers = new map<string, float>;
    map<int, string> idToName = new map<int, string>;
    map<string, ref array<string>> categories = new map<string, ref array<string>>;
}
```

### Предопределённые typedef для словарей

```c
typedef map<string, int>     TStringIntMap;
typedef map<string, string>  TStringStringMap;
typedef map<int, string>     TIntStringMap;
typedef map<string, float>   TStringFloatMap;
```

---

## Полный справочник методов словаря

### Вставка и обновление

```c
void MapInsertUpdate()
{
    map<string, int> inventory = new map<string, int>;

    // Insert: добавить новую пару ключ-значение
    // Возвращает true если ключ новый, false если уже существует
    bool isNew = inventory.Insert("Bandage", 5);    // true (новый ключ)
    isNew = inventory.Insert("Bandage", 10);         // false (ключ существует, значение НЕ обновлено)
    // inventory["Bandage"] по-прежнему 5!

    // Set: вставить ИЛИ обновить (обычно это то, что нужно)
    inventory.Set("Bandage", 10);    // Теперь inventory["Bandage"] == 10
    inventory.Set("Morphine", 3);    // Новый ключ добавлен
    inventory.Set("Morphine", 7);    // Существующий ключ обновлён до 7
}
```

**Критическое различие:** `Insert()` **не** обновляет существующие ключи. `Set()` обновляет. Если сомневаетесь, используйте `Set()`.

### Доступ к значениям

```c
void MapAccess()
{
    map<string, int> prices = new map<string, int>;
    prices.Set("AKM", 5000);
    prices.Set("M4A1", 7500);
    prices.Set("Mosin", 2000);

    // Get: возвращает значение, или значение по умолчанию (0 для int) если ключ не найден
    int akmPrice = prices.Get("AKM");         // 5000
    int falPrice = prices.Get("FAL");          // 0 (не найден, возвращает значение по умолчанию)

    // Find: безопасный доступ, возвращает true если ключ существует и устанавливает выходной параметр
    int price;
    bool found = prices.Find("M4A1", price);  // found == true, price == 7500
    bool notFound = prices.Find("SVD", price); // notFound == false, price не изменён

    // Contains: проверка наличия ключа (без получения значения)
    bool hasAKM = prices.Contains("AKM");     // true
    bool hasFAL = prices.Contains("FAL");     // false

    // Count: количество пар ключ-значение
    int count = prices.Count();  // 3
}
```

### Удаление

```c
void MapRemove()
{
    map<string, int> data = new map<string, int>;
    data.Set("a", 1);
    data.Set("b", 2);
    data.Set("c", 3);

    // Remove: удалить по ключу
    data.Remove("b");
    // data теперь содержит: {"a": 1, "c": 3}

    // Clear: удалить все записи
    data.Clear();
    // data.Count() == 0
}
```

### Доступ по индексу

Словари поддерживают позиционный доступ, но он `O(n)` --- используйте его для итерации, а не для частых поисков.

```c
void MapIndexAccess()
{
    map<string, int> data = new map<string, int>;
    data.Set("alpha", 1);
    data.Set("beta", 2);
    data.Set("gamma", 3);

    // Доступ по внутреннему индексу (O(n), порядок — порядок вставки)
    for (int i = 0; i < data.Count(); i++)
    {
        string key = data.GetKey(i);
        int value = data.GetElement(i);
        Print(string.Format("%1 = %2", key, value));
    }
}
```

### Извлечение ключей и значений

```c
void MapExtraction()
{
    map<string, int> prices = new map<string, int>;
    prices.Set("AKM", 5000);
    prices.Set("M4A1", 7500);
    prices.Set("Mosin", 2000);

    // Получить все ключи в виде массива
    array<string> keys = prices.GetKeyArray();
    // keys: ["AKM", "M4A1", "Mosin"]

    // Получить все значения в виде массива
    array<int> values = prices.GetValueArray();
    // values: [5000, 7500, 2000]
}
```

### Реальный пример: Отслеживание игроков

```c
class PlayerTracker
{
    protected ref map<string, vector> m_LastPositions;  // UID -> позиция
    protected ref map<string, float> m_PlayTime;        // UID -> секунды

    void PlayerTracker()
    {
        m_LastPositions = new map<string, vector>;
        m_PlayTime = new map<string, float>;
    }

    void OnPlayerConnect(string uid)
    {
        m_PlayTime.Set(uid, 0);
    }

    void OnPlayerDisconnect(string uid)
    {
        m_LastPositions.Remove(uid);
        m_PlayTime.Remove(uid);
    }

    void UpdatePlayer(string uid, vector pos, float deltaTime)
    {
        m_LastPositions.Set(uid, pos);

        float current = 0;
        m_PlayTime.Find(uid, current);
        m_PlayTime.Set(uid, current + deltaTime);
    }

    float GetPlayTime(string uid)
    {
        float time = 0;
        m_PlayTime.Find(uid, time);
        return time;
    }
}
```

---

## Множества: `set<T>`

Множества — упорядоченные коллекции, аналогичные массивам, но с семантикой, ориентированной на операции по значению (поиск и удаление по значению). Они используются реже, чем массивы и словари.

```c
void SetExamples()
{
    set<string> activeZones = new set<string>;

    // Insert: добавить элемент
    activeZones.Insert("NWAF");
    activeZones.Insert("Tisy");
    activeZones.Insert("Balota");

    // Find: возвращает индекс или -1
    int idx = activeZones.Find("Tisy");    // 1
    int missing = activeZones.Find("Zelenogorsk");  // -1

    // Get: доступ по индексу
    string first = activeZones.Get(0);     // "NWAF"

    // Count
    int count = activeZones.Count();       // 3

    // Remove по индексу
    activeZones.Remove(0);
    // activeZones: ["Tisy", "Balota"]

    // RemoveItem: удаление по значению
    activeZones.RemoveItem("Tisy");
    // activeZones: ["Balota"]

    // Clear
    activeZones.Clear();
}
```

### Когда использовать Set vs Array

На практике большинство моддеров DayZ используют `array<T>` почти для всего, потому что:
- `set<T>` имеет меньше методов, чем `array<T>`
- `array<T>` предоставляет `Find()` для поиска и `RemoveItem()` для удаления по значению
- Нужный API обычно уже есть в `array<T>`

Используйте `set<T>`, когда ваш код семантически представляет множество (порядок не важен, акцент на проверке принадлежности), или когда вы встречаете его в ванильном коде DayZ и нужно с ним взаимодействовать.

---

## Итерация по словарям

Словари поддерживают `foreach` для удобной итерации:

### foreach с ключом и значением

```c
void IterateMap()
{
    map<string, int> scores = new map<string, int>;
    scores.Set("Alice", 150);
    scores.Set("Bob", 230);
    scores.Set("Charlie", 180);

    // foreach с ключом и значением
    foreach (string name, int score : scores)
    {
        Print(string.Format("%1: %2 points", name, score));
    }
    // Alice: 150 points
    // Bob: 230 points
    // Charlie: 180 points
}
```

### Цикл for по индексу

```c
void IterateMapByIndex()
{
    map<string, int> scores = new map<string, int>;
    scores.Set("Alice", 150);
    scores.Set("Bob", 230);

    for (int i = 0; i < scores.Count(); i++)
    {
        string key = scores.GetKey(i);
        int val = scores.GetElement(i);
        Print(string.Format("%1 = %2", key, val));
    }
}
```

---

## Вложенные коллекции

Коллекции могут содержать другие коллекции. При хранении ссылочных типов (таких как массивы) внутри словаря используйте `ref` для управления владением.

```c
class LootTable
{
    // Словарь: имя категории -> список имён классов
    protected ref map<string, ref array<string>> m_Categories;

    void LootTable()
    {
        m_Categories = new map<string, ref array<string>>;

        // Создание массивов категорий
        ref array<string> medical = new array<string>;
        medical.Insert("Bandage");
        medical.Insert("Morphine");
        medical.Insert("Saline");

        ref array<string> weapons = new array<string>;
        weapons.Insert("AKM");
        weapons.Insert("M4A1");

        m_Categories.Set("medical", medical);
        m_Categories.Set("weapons", weapons);
    }

    string GetRandomFromCategory(string category)
    {
        array<string> items;
        if (!m_Categories.Find(category, items))
            return "";

        if (items.Count() == 0)
            return "";

        return items.GetRandomElement();
    }
}
```

---

## Лучшие практики

- Всегда используйте `new` для создания коллекций перед использованием -- `array<string> items;` является `null`, а не пустым массивом.
- Предпочитайте `map.Set()` вместо `map.Insert()` для обновлений -- `Insert` молча игнорирует существующие ключи.
- При удалении элементов во время итерации используйте обратный цикл `for` или создайте отдельный список для удаления -- никогда не изменяйте коллекцию внутри `foreach`.
- Используйте `Reserve()`, когда заранее знаете ожидаемое количество элементов, чтобы избежать повторных внутренних перевыделений памяти.
- Защищайте каждый доступ к элементу проверкой `IsValidIndex()` или `Count() > 0` -- доступ за границами массива вызывает тихие сбои.

---

## Наблюдается в реальных модах

> Шаблоны подтверждены изучением исходного кода профессиональных модов DayZ.

| Шаблон | Мод | Описание |
|--------|-----|----------|
| Обратный цикл `for` для удаления | Expansion / COT | При удалении отфильтрованных элементов всегда итерируют от `Count()-1` до `0` |
| `map<string, ref ClassName>` для реестров | Dabs Framework | Все реестры менеджеров используют `ref` в значениях словаря для поддержания жизни объектов |
| Typedef `TStringArray` повсюду | Vanilla / VPP | Парсинг конфигов, сообщения чата и таблицы лута используют `TStringArray` вместо `array<string>` |
| Защита от null + пустоты перед доступом | Expansion Market | Каждая функция, получающая массив, начинается с `if (!arr \|\| arr.Count() == 0) return;` |

---

## Теория vs практика

| Концепция | Теория | Реальность |
|-----------|--------|------------|
| `Remove(index)` — «быстрое удаление» | Должен просто удалить элемент | Сначала меняет местами с последним элементом, молча изменяя порядок массива |
| `map.Insert()` добавляет ключ | Ожидается обновление при существующем ключе | Возвращает `false` и ничего не делает, если ключ уже присутствует |
| `set<T>` для уникальных коллекций | Должен вести себя как математическое множество | Большинство моддеров используют `array<T>` с `Find()` вместо этого, потому что `set` имеет меньше методов |

---

## Распространённые ошибки

### 1. `Remove` vs `RemoveOrdered`: Тихая ошибка

`Remove(index)` быстр, но **меняет порядок**, обменивая элемент с последним. Если вы итерируете вперёд и удаляете, это приводит к пропуску элементов:

```c
// ПЛОХО: пропускает элементы, потому что Remove меняет порядок
array<int> nums = {1, 2, 3, 4, 5};
for (int i = 0; i < nums.Count(); i++)
{
    if (nums[i] % 2 == 0)
        nums.Remove(i);  // После удаления индекса 1, элемент по индексу 1 теперь "5"
                          // и мы перескакиваем к индексу 2, пропуская "5"
}

// ХОРОШО: итерация в обратном направлении при удалении
array<int> nums2 = {1, 2, 3, 4, 5};
for (int j = nums2.Count() - 1; j >= 0; j--)
{
    if (nums2[j] % 2 == 0)
        nums2.Remove(j);  // Безопасно: удаление с конца не влияет на меньшие индексы
}

// ТОЖЕ ХОРОШО: RemoveOrdered с обратной итерацией для сохранения порядка
array<int> nums3 = {1, 2, 3, 4, 5};
for (int k = nums3.Count() - 1; k >= 0; k--)
{
    if (nums3[k] % 2 == 0)
        nums3.RemoveOrdered(k);
}
// nums3: [1, 3, 5] в исходном порядке
```

### 2. Выход за границы массива

Enforce Script не выбрасывает исключений при обращении за границами --- он молча возвращает мусор или вылетает. Всегда проверяйте границы.

```c
// ПЛОХО: нет проверки границ
array<string> items = {"A", "B", "C"};
string fourth = items[3];  // НЕОПРЕДЕЛЁННОЕ ПОВЕДЕНИЕ: индекс 3 не существует

// ХОРОШО: проверка границ
if (items.IsValidIndex(3))
{
    string fourth2 = items[3];
}

// ХОРОШО: проверка количества
if (items.Count() > 0)
{
    string last = items[items.Count() - 1];
}
```

### 3. Забыли создать коллекцию

Коллекции — это объекты, и их нужно создать с помощью `new`:

```c
// ПЛОХО: вылет с null reference
array<string> items;
items.Insert("Test");  // ВЫЛЕТ: items равен null

// ХОРОШО: сначала создать
array<string> items2 = new array<string>;
items2.Insert("Test");

// ТОЖЕ ХОРОШО: список инициализации создаёт автоматически
array<string> items3 = {"Test"};
```

### 4. `Insert` vs `Set` для словарей

`Insert` не обновляет существующие ключи --- возвращает `false` и оставляет значение без изменений:

```c
map<string, int> data = new map<string, int>;
data.Insert("key", 100);
data.Insert("key", 200);   // Возвращает false, значение ПО-ПРЕЖНЕМУ 100!

// Используйте Set для обновления
data.Set("key", 200);      // Теперь значение 200
```

### 5. Изменение коллекции во время foreach

Не добавляйте и не удаляйте элементы из коллекции во время итерации по ней с помощью `foreach`. Создайте отдельный список элементов для удаления, затем удалите их после.

```c
// ПЛОХО: изменение во время итерации
array<string> items = {"A", "B", "C", "D"};
foreach (string item : items)
{
    if (item == "B")
        items.RemoveItem(item);  // НЕОПРЕДЕЛЁННОЕ ПОВЕДЕНИЕ: инвалидация итератора
}

// ХОРОШО: собрать, затем удалить
array<string> toRemove = new array<string>;
foreach (string item2 : items)
{
    if (item2 == "B")
        toRemove.Insert(item2);
}
foreach (string rem : toRemove)
{
    items.RemoveItem(rem);
}
```

### 6. Безопасность пустого массива

Всегда проверяйте, что массив не null и не пуст, прежде чем обращаться к элементам:

```c
string GetFirstItem(array<string> items)
{
    // Защитная проверка: null + проверка пустоты
    if (!items || items.Count() == 0)
        return "";

    return items[0];
}
```

---

## Практические упражнения

### Упражнение 1: Счётчик инвентаря
Создайте функцию, которая принимает `array<string>` имён классов предметов (с дубликатами) и возвращает `map<string, int>`, считающий количество каждого предмета.

Пример: `{"Bandage", "Morphine", "Bandage", "Saline", "Bandage"}` должно дать `{"Bandage": 3, "Morphine": 1, "Saline": 1}`.

### Упражнение 2: Удаление дубликатов из массива
Напишите функцию `array<string> RemoveDuplicates(array<string> input)`, которая возвращает новый массив с удалёнными дубликатами, сохраняя порядок первого вхождения.

### Упражнение 3: Таблица лидеров
Создайте `map<string, int>` имён игроков и числа убийств. Напишите функции для:
1. Добавления убийства игроку (создавая запись при необходимости)
2. Получения топ-N игроков, отсортированных по убийствам (подсказка: извлечь в массивы, отсортировать)
3. Удаления всех игроков с нулём убийств

### Упражнение 4: История позиций
Создайте класс, который хранит последние 10 позиций игрока (кольцевой буфер на основе массива). Он должен:
1. Добавлять новую позицию (удаляя старейшую при достижении ёмкости)
2. Возвращать общее пройденное расстояние по всем сохранённым позициям
3. Возвращать среднюю позицию

### Упражнение 5: Двустороний поиск
Создайте класс с двумя словарями, позволяющий поиск в обоих направлениях: по UID игрока найти имя; по имени найти UID. Реализуйте `Register(uid, name)`, `GetNameByUID(uid)`, `GetUIDByName(name)` и `Unregister(uid)`.

---

## Итого

| Коллекция | Тип | Применение | Ключевое отличие |
|-----------|-----|------------|------------------|
| Статический массив | `int arr[5]` | Фиксированный размер, известный на этапе компиляции | Без изменения размера, без методов |
| Динамический массив | `array<T>` | Универсальный упорядоченный список | Богатый API, изменяемый размер |
| Словарь | `map<K,V>` | Поиск по ключу-значению | `Set()` для вставки/обновления |
| Множество | `set<T>` | Принадлежность по значению | Проще массива, менее распространён |

| Операция | Метод | Примечания |
|----------|-------|------------|
| Добавить в конец | `Insert(val)` | Возвращает индекс |
| Добавить по позиции | `InsertAt(val, idx)` | Сдвигает вправо |
| Быстрое удаление | `Remove(idx)` | Меняет с последним, **неупорядоченное** |
| Упорядоченное удаление | `RemoveOrdered(idx)` | Сдвигает влево, сохраняет порядок |
| Удаление по значению | `RemoveItem(val)` | Находит и удаляет (упорядоченно) |
| Поиск | `Find(val)` | Возвращает индекс или -1 |
| Количество | `Count()` | Число элементов |
| Проверка границ | `IsValidIndex(idx)` | Возвращает bool |
| Сортировка | `Sort()` / `Sort(true)` | По возрастанию / по убыванию |
| Случайный | `GetRandomElement()` | Возвращает случайное значение |
| foreach | `foreach (T val : arr)` | Только значение |
| foreach с индексом | `foreach (int i, T val : arr)` | Индекс + значение |

---

[Главная](../README.md) | [<< Назад: Переменные и типы](01-variables-types.md) | **Массивы, словари и множества** | [Далее: Классы и наследование >>](03-classes-inheritance.md)
