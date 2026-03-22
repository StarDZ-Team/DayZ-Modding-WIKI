# Глава 1.6: Операции со строками


[<< 1.5: Control Flow](05-control-flow.md) | [Главная](../../README.md) | [1.7: Math & Vectors >>](07-math-vectors.md)

---

## Введение


Strings in Enforce Script are a **value type**, like `int` or `float`. They are passed by value and compared by value. The `string` type has a rich set of built-in methods for searching, slicing, converting, and formatting text. This chapter is a complete reference for every string operation available in DayZ scripting, with real-world examples from mod development.

---

## Основы строк


```c
// Declaration and initialization
string empty;                          // "" (empty string by default)
string greeting = "Hello, Chernarus!";
string combined = "Player: " + "John"; // Concatenation with +

// Strings are value types -- assignment creates a copy
string original = "DayZ";
string copy = original;
copy = "Arma";
Print(original); // Still "DayZ"
```

---

## Полный справочник методов строк


### Длина


Returns the number of characters in the string.

```c
string s = "Hello";
int len = s.Length(); // 5

string empty = "";
int emptyLen = empty.Length(); // 0
```

### Substring


Extracts a portion of the string. Parameters: `start` (index), `length` (number of characters).

```c
string s = "Hello World";
string word = s.Substring(6, 5);  // "World"
string first = s.Substring(0, 5); // "Hello"

// Extract from a position to the end
string rest = s.Substring(6, s.Length() - 6); // "World"
```

### IndexOf


Finds the first occurrence of a substring. Returns the index, or `-1` if not found.

```c
string s = "Hello World";
int idx = s.IndexOf("World");     // 6
int notFound = s.IndexOf("DayZ"); // -1
```

### IndexOfFrom


Finds the first occurrence starting from a given index.

```c
string s = "one-two-one-two";
int first = s.IndexOf("one");        // 0
int second = s.IndexOfFrom(1, "one"); // 8
```

### LastIndexOf


Finds the last occurrence of a substring.

```c
string path = "profiles/MyMod/Players/player.json";
int lastSlash = path.LastIndexOf("/"); // 23
```

### Contains


Returns `true` if the string contains the given substring.

```c
string chatMsg = "!teleport 100 0 200";
if (chatMsg.Contains("!teleport"))
{
    Print("Teleport command detected");
}
```

### Replace


Replaces all occurrences of a substring. **Modifies the string in place** and returns the number of replacements made.

```c
string s = "Hello World World";
int count = s.Replace("World", "DayZ");
// s is now "Hello DayZ DayZ"
// count is 2
```

### Split


Splits a string by a delimiter and fills an array. The array should be pre-allocated.

```c
string csv = "AK101,M4A1,UMP45,Mosin9130";
TStringArray weapons = new TStringArray;
csv.Split(",", weapons);
// weapons = ["AK101", "M4A1", "UMP45", "Mosin9130"]

// Split chat command by spaces
string chatLine = "!spawn Barrel_Green 5";
TStringArray parts = new TStringArray;
chatLine.Split(" ", parts);
// parts = ["!spawn", "Barrel_Green", "5"]
string command = parts.Get(0);   // "!spawn"
string itemType = parts.Get(1);  // "Barrel_Green"
int amount = parts.Get(2).ToInt(); // 5
```

### Join (статический)


Joins an array of strings with a separator.

```c
TStringArray names = {"Alice", "Bob", "Charlie"};
string result = string.Join(", ", names);
// result = "Alice, Bob, Charlie"
```

### Format (статический)


Builds a string using numbered placeholders `%1` through `%9`. Это primary way to build formatted strings in Enforce Script.

```c
string name = "John";
int kills = 15;
float distance = 342.5;

string msg = string.Format("Player %1 has %2 kills (best shot: %3m)", name, kills, distance);
// msg = "Player John has 15 kills (best shot: 342.5m)"
```

Placeholders are **1-indexed** (`%1` is the first argument, not `%0`). You can use up to 9 placeholders.

```c
string log = string.Format("[%1] %2 :: %3", "MyMod", "INFO", "Server started");
// log = "[MyMod] INFO :: Server started"
```

> **Примечание:** There is no `printf`-style formatting (`%d`, `%f`, `%s`). Only `%1` through `%9`.

### ToLower


Converts the string to lowercase. **Modifies in place** -- does NOT return a new string.

```c
string s = "Hello WORLD";
s.ToLower();
Print(s); // "hello world"
```

### ToUpper


Converts the string to uppercase. **Modifies in place.**

```c
string s = "Hello World";
s.ToUpper();
Print(s); // "HELLO WORLD"
```

### Trim / TrimInPlace


Removes leading and trailing whitespace. **Modifies in place.**

```c
string s = "  Hello World  ";
s.TrimInPlace();
Print(s); // "Hello World"
```

There is also `Trim()` which returns a new trimmed string (available in some engine versions):

```c
string raw = "  padded  ";
string clean = raw.Trim();
// clean = "padded", raw unchanged
```

### Get


Gets a single character at an index, returned as a string.

```c
string s = "DayZ";
string ch = s.Get(0); // "D"
string ch2 = s.Get(3); // "Z"
```

### Set


Sets a single character at an index.

```c
string s = "DayZ";
s.Set(0, "N");
Print(s); // "NayZ"
```

### ToInt


Converts a numeric string to an integer.

```c
string s = "42";
int num = s.ToInt(); // 42

string bad = "hello";
int zero = bad.ToInt(); // 0 (non-numeric strings return 0)
```

### ToFloat


Converts a numeric string to a float.

```c
string s = "3.14";
float f = s.ToFloat(); // 3.14
```

### ToVector


Converts a space-separated string of three numbers to a vector.

```c
string s = "100.5 0 200.3";
vector pos = s.ToVector(); // Vector(100.5, 0, 200.3)
```

---

## Сравнение строк


Strings are compared by value using standard operators. Comparison is **case-sensitive** and follows lexicographic (dictionary) order.

```c
string a = "Apple";
string b = "Banana";
string c = "Apple";

bool equal    = (a == c);  // true
bool notEqual = (a != b);  // true
bool less     = (a < b);   // true  ("Apple" < "Banana" lexicographically)
bool greater  = (b > a);   // true
```

### Сравнение без учёта регистра


There is no built-in case-insensitive comparison. Convert both strings to lowercase first:

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


Use the `+` operator to concatenate strings. Non-string types are automatically converted.

```c
string name = "John";
int health = 75;
float distance = 42.5;

string msg = "Player " + name + " has " + health + " HP at " + distance + "m";
// "Player John has 75 HP at 42.5m"
```

For complex formatting, prefer `string.Format()` over concatenation --- он is more readable and avoids multiple intermediate allocations.

```c
// Prefer this:
string msg = string.Format("Player %1 has %2 HP at %3m", name, health, distance);

// Over this:
string msg2 = "Player " + name + " has " + health + " HP at " + distance + "m";
```

---

## Примеры из практики


### Парсинг команд чата


```c
void ProcessChatMessage(string sender, string message)
{
    // Trim whitespace
    message.TrimInPlace();

    // Must start with !
    if (message.Length() == 0 || message.Get(0) != "!")
        return;

    // Split into parts
    TStringArray parts = new TStringArray;
    message.Split(" ", parts);

    if (parts.Count() == 0)
        return;

    string command = parts.Get(0);
    command.ToLower();

    switch (command)
    {
        case "!heal":
            Print(string.Format("[CMD] %1 used !heal", sender));
            break;

        case "!spawn":
            if (parts.Count() >= 2)
            {
                string itemType = parts.Get(1);
                int quantity = 1;
                if (parts.Count() >= 3)
                    quantity = parts.Get(2).ToInt();

                Print(string.Format("[CMD] %1 spawning %2 x%3", sender, itemType, quantity));
            }
            break;

        case "!tp":
            if (parts.Count() >= 4)
            {
                float x = parts.Get(1).ToFloat();
                float y = parts.Get(2).ToFloat();
                float z = parts.Get(3).ToFloat();
                vector pos = Vector(x, y, z);
                Print(string.Format("[CMD] %1 teleporting to %2", sender, pos.ToString()));
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
        result = result + " (Admin)";
    }

    return result;
}
// FormatPlayerTag("John", "DZR", true) => "[DZR] John (Admin)"
// FormatPlayerTag("Jane", "", false)   => "Jane"
```

### Построение путей к файлам


```c
string BuildPlayerFilePath(string steamId)
{
    return "$profile:MyMod/Players/" + steamId + ".json";
}
```

### Очистка сообщений лога


```c
string SanitizeForLog(string input)
{
    string safe = input;
    safe.Replace("\n", " ");
    safe.Replace("\r", "");
    safe.Replace("\t", " ");

    // Truncate to max length
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

## Распространённые ошибки


| Mistake | Problem | Fix |
|---------|---------|-----|
| Expecting `ToLower()` to return a new string | `ToLower()` modifies in place, returns `void` | Copy the string first, then call `ToLower()` on the copy |
| Expecting `ToUpper()` to return a new string | Same as above -- modifies in place | Copy first, then call `ToUpper()` on the copy |
| Expecting `Replace()` to return a new string | `Replace()` modifies in place, returns replacement count | Copy the string first if you need the original |
| Using `%0` in `string.Format()` | Placeholders are 1-indexed (`%1` through `%9`) | Start from `%1` |
| Using `%d`, `%f`, `%s` format specifiers | C-style format specifiers do not work | Use `%1`, `%2`, etc. |
| Comparing strings without normalizing case | `"Hello" != "hello"` | Call `ToLower()` on both before comparing |
| Treating strings as reference types | Strings are value types; assigning creates a copy | This is usually fine -- just be aware that modifying a copy does not affect the original |
| Forgetting to create the array before `Split()` | Calling `Split()` on a null array causes a crash | Always: `TStringArray parts = new TStringArray;` before `Split()` |

---

## Краткая справка


```c
// Length
int len = s.Length();

// Search
int idx = s.IndexOf("sub");
int idx = s.IndexOfFrom(startIdx, "sub");
int idx = s.LastIndexOf("sub");
bool has = s.Contains("sub");

// Extract
string sub = s.Substring(start, length);
string ch  = s.Get(index);

// Modify (in place)
s.Set(index, "x");
int count = s.Replace("old", "new");
s.ToLower();
s.ToUpper();
s.TrimInPlace();

// Split & Join
TStringArray parts = new TStringArray;
s.Split(delimiter, parts);
string joined = string.Join(sep, parts);

// Format (static, %1-%9 placeholders)
string msg = string.Format("Hello %1, you have %2 items", name, count);

// Conversion
int n    = s.ToInt();
float f  = s.ToFloat();
vector v = s.ToVector();

// Comparison (case-sensitive, lexicographic)
bool eq = (a == b);
bool lt = (a < b);
```

---

[<< 1.5: Control Flow](05-control-flow.md) | [Главная](../../README.md) | [1.7: Math & Vectors >>](07-math-vectors.md)
