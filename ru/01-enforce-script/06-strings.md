# Глава 1.6: Операции со строками

[Главная](../README.md) | [<< Предыдущая: Управление потоком](05-control-flow.md) | **Операции со строками** | [Следующая: Математика и векторы >>](07-math-vectors.md)

---

## Введение

Строки в Enforce Script --- это **тип-значение**, как `int` или `float`. Они передаются по значению и сравниваются по значению. Тип `string` обладает богатым набором встроенных методов для поиска, извлечения подстрок, преобразования и форматирования текста. Эта глава --- полный справочник по всем строковым операциям, доступным в скриптинге DayZ, с реальными примерами из разработки модов.

---

## Основы строк

```c
// Объявление и инициализация
string empty;                          // "" (пустая строка по умолчанию)
string greeting = "Hello, Chernarus!";
string combined = "Player: " + "John"; // Конкатенация через +

// Строки --- типы-значения, присваивание создаёт копию
string original = "DayZ";
string copy = original;
copy = "Arma";
Print(original); // По-прежнему "DayZ"
```

---

## Полный справочник методов строк

### Length

Возвращает количество символов в строке.

```c
string s = "Hello";
int len = s.Length(); // 5

string empty = "";
int emptyLen = empty.Length(); // 0
```

### Substring

Извлекает часть строки. Параметры: `start` (индекс), `length` (количество символов).

```c
string s = "Hello World";
string word = s.Substring(6, 5);  // "World"
string first = s.Substring(0, 5); // "Hello"

// Извлечение от позиции до конца
string rest = s.Substring(6, s.Length() - 6); // "World"
```

### IndexOf

Находит первое вхождение подстроки. Возвращает индекс или `-1`, если не найдено.

```c
string s = "Hello World";
int idx = s.IndexOf("World");     // 6
int notFound = s.IndexOf("DayZ"); // -1
```

### IndexOfFrom

Находит первое вхождение, начиная с заданного индекса.

```c
string s = "one-two-one-two";
int first = s.IndexOf("one");        // 0
int second = s.IndexOfFrom(1, "one"); // 8
```

### LastIndexOf

Находит последнее вхождение подстроки.

```c
string path = "profiles/MyMod/Players/player.json";
int lastSlash = path.LastIndexOf("/"); // 23
```

### Contains

Возвращает `true`, если строка содержит заданную подстроку.

```c
string chatMsg = "!teleport 100 0 200";
if (chatMsg.Contains("!teleport"))
{
    Print("Обнаружена команда телепортации");
}
```

### Replace

Заменяет все вхождения подстроки. **Модифицирует строку на месте** и возвращает количество замен.

```c
string s = "Hello World World";
int count = s.Replace("World", "DayZ");
// s теперь "Hello DayZ DayZ"
// count равен 2
```

### Split

Разделяет строку по разделителю и заполняет массив. Массив должен быть предварительно создан.

```c
string csv = "AK101,M4A1,UMP45,Mosin9130";
TStringArray weapons = new TStringArray;
csv.Split(",", weapons);
// weapons = ["AK101", "M4A1", "UMP45", "Mosin9130"]

// Разбиение команды чата по пробелам
string chatLine = "!spawn Barrel_Green 5";
TStringArray parts = new TStringArray;
chatLine.Split(" ", parts);
// parts = ["!spawn", "Barrel_Green", "5"]
string command = parts.Get(0);   // "!spawn"
string itemType = parts.Get(1);  // "Barrel_Green"
int amount = parts.Get(2).ToInt(); // 5
```

### Join (статический)

Объединяет массив строк через разделитель.

```c
TStringArray names = {"Alice", "Bob", "Charlie"};
string result = string.Join(", ", names);
// result = "Alice, Bob, Charlie"
```

### Format (статический)

Строит строку с использованием нумерованных подстановок `%1` --- `%9`. Это основной способ создания форматированных строк в Enforce Script.

```c
string name = "John";
int kills = 15;
float distance = 342.5;

string msg = string.Format("Игрок %1 имеет %2 убийств (лучший выстрел: %3м)", name, kills, distance);
// msg = "Игрок John имеет 15 убийств (лучший выстрел: 342.5м)"
```

Подстановки **индексируются с 1** (`%1` --- первый аргумент, не `%0`). Можно использовать до 9 подстановок.

```c
string log = string.Format("[%1] %2 :: %3", "MyMod", "INFO", "Server started");
// log = "[MyMod] INFO :: Server started"
```

> **Примечание:** Нет форматирования в стиле `printf` (`%d`, `%f`, `%s`). Только `%1` --- `%9`.

### ToLower

Преобразует строку в нижний регистр. **Модифицирует на месте** --- НЕ возвращает новую строку.

```c
string s = "Hello WORLD";
s.ToLower();
Print(s); // "hello world"
```

### ToUpper

Преобразует строку в верхний регистр. **Модифицирует на месте.**

```c
string s = "Hello World";
s.ToUpper();
Print(s); // "HELLO WORLD"
```

### Trim / TrimInPlace

Удаляет начальные и конечные пробелы. **Модифицирует на месте.**

```c
string s = "  Hello World  ";
s.TrimInPlace();
Print(s); // "Hello World"
```

Также существует `Trim()`, который возвращает новую обрезанную строку (доступен в некоторых версиях движка):

```c
string raw = "  padded  ";
string clean = raw.Trim();
// clean = "padded", raw без изменений
```

### Get

Получает один символ по индексу, возвращаемый как строка.

```c
string s = "DayZ";
string ch = s.Get(0); // "D"
string ch2 = s.Get(3); // "Z"
```

### Set

Устанавливает один символ по индексу.

```c
string s = "DayZ";
s.Set(0, "N");
Print(s); // "NayZ"
```

### ToInt

Преобразует числовую строку в целое число.

```c
string s = "42";
int num = s.ToInt(); // 42

string bad = "hello";
int zero = bad.ToInt(); // 0 (нечисловые строки возвращают 0)
```

### ToFloat

Преобразует числовую строку в число с плавающей точкой.

```c
string s = "3.14";
float f = s.ToFloat(); // 3.14
```

### ToVector

Преобразует строку из трёх чисел, разделённых пробелами, в вектор.

```c
string s = "100.5 0 200.3";
vector pos = s.ToVector(); // Vector(100.5, 0, 200.3)
```

---

## Сравнение строк

Строки сравниваются по значению стандартными операторами. Сравнение **чувствительно к регистру** и следует лексикографическому (словарному) порядку.

```c
string a = "Apple";
string b = "Banana";
string c = "Apple";

bool equal    = (a == c);  // true
bool notEqual = (a != b);  // true
bool less     = (a < b);   // true  ("Apple" < "Banana" лексикографически)
bool greater  = (b > a);   // true
```

### Сравнение без учёта регистра

Встроенного сравнения без учёта регистра нет. Сначала преобразуйте обе строки в нижний регистр:

```c
bool EqualsIgnoreCase(string a, string b)
{
    string lowerA = a;
    string lowerB = b;
    lowerA.ToLower();
    lowerB.ToLower();
    return lowerA == lowerB;
}
```

---

## Конкатенация строк

Используйте оператор `+` для конкатенации строк. Нестроковые типы автоматически преобразуются.

```c
string name = "John";
int health = 75;
float distance = 42.5;

string msg = "Игрок " + name + " имеет " + health + " HP на " + distance + "м";
// "Игрок John имеет 75 HP на 42.5м"
```

Для сложного форматирования предпочитайте `string.Format()` вместо конкатенации --- это более читаемо и избавляет от множественных промежуточных аллокаций.

```c
// Предпочтительно:
string msg = string.Format("Игрок %1 имеет %2 HP на %3м", name, health, distance);

// Вместо:
string msg2 = "Игрок " + name + " имеет " + health + " HP на " + distance + "м";
```

---

## Реальные примеры

### Парсинг команд чата

```c
void ProcessChatMessage(string sender, string message)
{
    // Обрезать пробелы
    message.TrimInPlace();

    // Должна начинаться с !
    if (message.Length() == 0 || message.Get(0) != "!")
        return;

    // Разбить на части
    TStringArray parts = new TStringArray;
    message.Split(" ", parts);

    if (parts.Count() == 0)
        return;

    string command = parts.Get(0);
    command.ToLower();

    switch (command)
    {
        case "!heal":
            Print(string.Format("[CMD] %1 использовал !heal", sender));
            break;

        case "!spawn":
            if (parts.Count() >= 2)
            {
                string itemType = parts.Get(1);
                int quantity = 1;
                if (parts.Count() >= 3)
                    quantity = parts.Get(2).ToInt();

                Print(string.Format("[CMD] %1 спавнит %2 x%3", sender, itemType, quantity));
            }
            break;

        case "!tp":
            if (parts.Count() >= 4)
            {
                float x = parts.Get(1).ToFloat();
                float y = parts.Get(2).ToFloat();
                float z = parts.Get(3).ToFloat();
                vector pos = Vector(x, y, z);
                Print(string.Format("[CMD] %1 телепортируется в %2", sender, pos.ToString()));
            }
            break;
    }
}
```

### Форматирование имён игроков для отображения

```c
string FormatPlayerTag(string name, string clanTag, bool isAdmin)
{
    string result = "";

    if (clanTag.Length() > 0)
    {
        result = "[" + clanTag + "] ";
    }

    result = result + name;

    if (isAdmin)
    {
        result = result + " (Админ)";
    }

    return result;
}
// FormatPlayerTag("John", "DZR", true) => "[DZR] John (Админ)"
// FormatPlayerTag("Jane", "", false)   => "Jane"
```

### Построение путей к файлам

```c
string BuildPlayerFilePath(string steamId)
{
    return "$profile:MyMod/Players/" + steamId + ".json";
}
```

### Очистка сообщений для лога

```c
string SanitizeForLog(string input)
{
    string safe = input;
    safe.Replace("\n", " ");
    safe.Replace("\r", "");
    safe.Replace("\t", " ");

    // Обрезать до максимальной длины
    if (safe.Length() > 200)
    {
        safe = safe.Substring(0, 197) + "...";
    }

    return safe;
}
```

### Извлечение имени файла из пути

```c
string GetFileName(string path)
{
    int lastSlash = path.LastIndexOf("/");
    if (lastSlash == -1)
        lastSlash = path.LastIndexOf("\\");

    if (lastSlash >= 0 && lastSlash < path.Length() - 1)
    {
        return path.Substring(lastSlash + 1, path.Length() - lastSlash - 1);
    }

    return path;
}
// GetFileName("profiles/MyMod/config.json") => "config.json"
```

---

## Лучшие практики

- Используйте `string.Format()` с подстановками `%1`..`%9` для всего форматированного вывода --- это более читаемо и избавляет от подводных камней преобразования типов при конкатенации через `+`.
- Помните, что `ToLower()`, `ToUpper()` и `Replace()` модифицируют строку на месте --- скопируйте строку, если нужно сохранить оригинал.
- Всегда создавайте целевой массив через `new TStringArray` перед вызовом `Split()` --- передача null-массива вызывает вылет.
- Используйте `Contains()` для простых проверок подстрок и `IndexOf()` только когда нужна позиция.
- Для сравнения без учёта регистра скопируйте обе строки и вызовите `ToLower()` для каждой перед сравнением --- встроенного сравнения без учёта регистра нет.

---

## Примеры из реальных модов

> Паттерны подтверждены изучением исходного кода профессиональных модов DayZ.

| Паттерн | Мод | Детали |
|---------|-----|--------|
| `Split(" ", parts)` для парсинга команд чата | VPP / COT | Все системы чат-команд разбивают по пробелу, затем switch на `parts.Get(0)` |
| `string.Format` с префиксом `[TAG]` | Expansion / Dabs | Сообщения логов всегда используют `string.Format("[%1] %2", tag, msg)` вместо конкатенации |
| Соглашение путей `"$profile:ModName/"` | COT / Expansion | Пути файлов, построенные через `+`, используют прямые слеши и префикс `$profile:` для избежания проблем с обратными слешами |
| `ToLower()` перед сопоставлением команд | VPP Admin | Пользовательский ввод приводится к нижнему регистру перед `switch`/сравнением для обработки смешанного регистра |

---

## Теория vs Практика

| Концепция | Теория | Реальность |
|-----------|--------|------------|
| Возвращаемое значение `ToLower()` / `Replace()` | Ожидается возврат новой строки (как в C#) | Они модифицируют на месте и возвращают `void` или количество --- постоянный источник багов |
| Подстановки `string.Format` | `%d`, `%f`, `%s` как printf в C | Работают только `%1` --- `%9`; спецификаторы в стиле C молча игнорируются |
| Обратный слеш `\\` в строках | Стандартный символ экранирования | Может сломать CParser DayZ в контексте JSON --- предпочитайте прямые слеши для путей |

---

## Распространённые ошибки

| Ошибка | Проблема | Исправление |
|--------|----------|-------------|
| Ожидание, что `ToLower()` вернёт новую строку | `ToLower()` модифицирует на месте, возвращает `void` | Сначала скопируйте строку, затем вызовите `ToLower()` для копии |
| Ожидание, что `ToUpper()` вернёт новую строку | Аналогично --- модифицирует на месте | Сначала скопируйте, затем вызовите `ToUpper()` для копии |
| Ожидание, что `Replace()` вернёт новую строку | `Replace()` модифицирует на месте, возвращает количество замен | Сначала скопируйте строку, если нужен оригинал |
| Использование `%0` в `string.Format()` | Подстановки индексируются с 1 (`%1` --- `%9`) | Начинайте с `%1` |
| Использование спецификаторов `%d`, `%f`, `%s` | Спецификаторы формата в стиле C не работают | Используйте `%1`, `%2` и т.д. |
| Сравнение строк без нормализации регистра | `"Hello" != "hello"` | Вызовите `ToLower()` для обеих перед сравнением |
| Обращение со строками как с ссылочными типами | Строки --- типы-значения; присваивание создаёт копию | Обычно это нормально --- просто помните, что модификация копии не влияет на оригинал |
| Забывание создать массив перед `Split()` | Вызов `Split()` с null-массивом вызывает вылет | Всегда: `TStringArray parts = new TStringArray;` перед `Split()` |

---

## Краткий справочник

```c
// Длина
int len = s.Length();

// Поиск
int idx = s.IndexOf("sub");
int idx = s.IndexOfFrom(startIdx, "sub");
int idx = s.LastIndexOf("sub");
bool has = s.Contains("sub");

// Извлечение
string sub = s.Substring(start, length);
string ch  = s.Get(index);

// Модификация (на месте)
s.Set(index, "x");
int count = s.Replace("old", "new");
s.ToLower();
s.ToUpper();
s.TrimInPlace();

// Разделение и объединение
TStringArray parts = new TStringArray;
s.Split(delimiter, parts);
string joined = string.Join(sep, parts);

// Форматирование (статический, подстановки %1-%9)
string msg = string.Format("Привет %1, у вас %2 предметов", name, count);

// Преобразование
int n    = s.ToInt();
float f  = s.ToFloat();
vector v = s.ToVector();

// Сравнение (чувствительное к регистру, лексикографическое)
bool eq = (a == b);
bool lt = (a < b);
```

---

[<< 1.5: Управление потоком](05-control-flow.md) | [Главная](../README.md) | [1.7: Математика и векторы >>](07-math-vectors.md)
