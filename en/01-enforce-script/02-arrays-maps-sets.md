# Chapter 1.2: Arrays, Maps & Sets

[Home](../README.md) | [<< Previous: Variables & Types](01-variables-types.md) | **Arrays, Maps & Sets** | [Next: Classes & Inheritance >>](03-classes-inheritance.md)

---

## Introduction

Real DayZ mods deal with collections of things: lists of players, inventories of items, mappings from player IDs to permissions, sets of active zones. Enforce Script provides three collection types to handle these needs:

- **`array<T>`** --- Dynamic, ordered, resizable list (the collection you will use most)
- **`map<K,V>`** --- Key-value associative container (hash map)
- **`set<T>`** --- Ordered collection with value-based removal

There are also **static arrays** (`int arr[5]`) for fixed-size data known at compile time. This chapter covers all of them in depth, including every available method, iteration patterns, and the subtle pitfalls that cause real bugs in production mods.

---

## Static Arrays

Static arrays have a fixed size determined at compile time. They cannot grow or shrink. They are useful for small, known-size collections and are more memory-efficient than dynamic arrays.

### Declaration and Usage

```c
void StaticArrayBasics()
{
    // Declare with literal size
    int numbers[5];
    numbers[0] = 10;
    numbers[1] = 20;
    numbers[2] = 30;
    numbers[3] = 40;
    numbers[4] = 50;

    // Declare with initializer list
    float damages[3] = {10.5, 25.0, 50.0};

    // Declare with const size
    const int GRID_SIZE = 4;
    string labels[GRID_SIZE];

    // Access elements
    int first = numbers[0];     // 10
    float maxDmg = damages[2];  // 50.0

    // Iterate with for loop
    for (int i = 0; i < 5; i++)
    {
        Print(numbers[i]);
    }
}
```

### Static Array Rules

1. Size must be a compile-time constant (literal or `const int`)
2. You **cannot** use a variable as the size: `int arr[myVar]` is a compile error
3. Accessing an out-of-bounds index causes undefined behavior (no runtime bounds check)
4. Static arrays are passed by reference to functions (unlike primitives)

```c
// Static arrays as function parameters
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
    Print(myArr[0]);  // 100 -- the original was modified (passed by reference)
}
```

### When to Use Static Arrays

Use static arrays for:
- Vector/matrix data (`vector mat[3]` for 3x3 rotation matrices)
- Small fixed lookup tables
- Performance-critical hot paths where allocation matters

Use dynamic `array<T>` for everything else.

---

## Dynamic Arrays: `array<T>`

Dynamic arrays are the most commonly used collection in DayZ modding. They can grow and shrink at runtime, support generics, and provide a rich set of methods.

### Creation

```c
void CreateArrays()
{
    // Method 1: new operator
    array<string> names = new array<string>;

    // Method 2: Initializer list
    array<int> scores = {100, 85, 92, 78};

    // Method 3: Using typedef
    TStringArray items = new TStringArray;  // same as array<string>

    // Arrays of any type
    array<float> distances = new array<float>;
    array<bool> flags = new array<bool>;
    array<vector> positions = new array<vector>;
    array<PlayerBase> players = new array<PlayerBase>;
}
```

### Pre-defined Typedefs

DayZ provides shorthand typedefs for the most common array types:

```c
typedef array<string>  TStringArray;
typedef array<float>   TFloatArray;
typedef array<int>     TIntArray;
typedef array<bool>    TBoolArray;
typedef array<vector>  TVectorArray;
```

You will encounter `TStringArray` constantly in DayZ code --- config parsing, chat messages, loot tables, and more.

---

## Complete Array Method Reference

### Adding Elements

```c
void AddingElements()
{
    array<string> items = new array<string>;

    // Insert: append to end, returns the new index
    int idx = items.Insert("Bandage");     // idx == 0
    idx = items.Insert("Morphine");        // idx == 1
    idx = items.Insert("Saline");          // idx == 2
    // items: ["Bandage", "Morphine", "Saline"]

    // InsertAt: insert at specific index, shifts existing elements right
    items.InsertAt("Epinephrine", 1);
    // items: ["Bandage", "Epinephrine", "Morphine", "Saline"]

    // InsertAll: append all elements from another array
    array<string> moreItems = {"Tetracycline", "Charcoal"};
    items.InsertAll(moreItems);
    // items: ["Bandage", "Epinephrine", "Morphine", "Saline", "Tetracycline", "Charcoal"]
}
```

### Accessing Elements

```c
void AccessingElements()
{
    array<string> items = {"Apple", "Banana", "Cherry", "Date"};

    // Get: access by index
    string first = items.Get(0);       // "Apple"
    string third = items.Get(2);       // "Cherry"

    // Bracket operator: same as Get
    string second = items[1];          // "Banana"

    // Set: replace element at index
    items.Set(1, "Blueberry");         // items[1] is now "Blueberry"

    // Count: number of elements
    int count = items.Count();         // 4

    // IsValidIndex: bounds check
    bool valid = items.IsValidIndex(3);   // true
    bool invalid = items.IsValidIndex(4); // false
    bool negative = items.IsValidIndex(-1); // false
}
```

### Searching

```c
void SearchingArrays()
{
    array<string> weapons = {"AKM", "M4A1", "Mosin", "IZH18", "AKM"};

    // Find: returns first index of element, or -1 if not found
    int idx = weapons.Find("Mosin");    // 2
    int notFound = weapons.Find("FAL");  // -1

    // Check existence
    if (weapons.Find("M4A1") != -1)
        Print("M4A1 found!");

    // GetRandomElement: returns a random element
    string randomWeapon = weapons.GetRandomElement();

    // GetRandomIndex: returns a random valid index
    int randomIdx = weapons.GetRandomIndex();
}
```

### Removing Elements

This is where the most common bugs occur. Pay close attention to the difference between `Remove` and `RemoveOrdered`.

```c
void RemovingElements()
{
    array<string> items = {"A", "B", "C", "D", "E"};

    // Remove(index): FAST but UNORDERED
    // Swaps the element at index with the LAST element, then shrinks the array
    items.Remove(1);  // Removes "B" by swapping with "E"
    // items is now: ["A", "E", "C", "D"]  -- ORDER CHANGED!

    // RemoveOrdered(index): SLOW but preserves order
    // Shifts all elements after the index left by one
    items = {"A", "B", "C", "D", "E"};
    items.RemoveOrdered(1);  // Removes "B", shifts C,D,E left
    // items is now: ["A", "C", "D", "E"]  -- order preserved

    // RemoveItem(value): finds the element and removes it (ordered)
    items = {"A", "B", "C", "D", "E"};
    items.RemoveItem("C");
    // items is now: ["A", "B", "D", "E"]

    // Clear: remove all elements
    items.Clear();
    // items.Count() == 0
}
```

### Sizing and Capacity

```c
void SizingArrays()
{
    array<int> data = new array<int>;

    // Reserve: pre-allocate internal capacity (does NOT change Count)
    // Use when you know how many elements you will add
    data.Reserve(100);
    // data.Count() == 0, but internal buffer is ready for 100 elements

    // Resize: change the Count, filling new slots with default values
    data.Resize(10);
    // data.Count() == 10, all elements are 0

    // Resize smaller truncates
    data.Resize(5);
    // data.Count() == 5
}
```

### Ordering and Shuffling

```c
void OrderingArrays()
{
    array<int> numbers = {5, 2, 8, 1, 9, 3};

    // Sort ascending
    numbers.Sort();
    // numbers: [1, 2, 3, 5, 8, 9]

    // Sort descending
    numbers.Sort(true);
    // numbers: [9, 8, 5, 3, 2, 1]

    // Invert (reverse) the array
    numbers = {1, 2, 3, 4, 5};
    numbers.Invert();
    // numbers: [5, 4, 3, 2, 1]

    // Shuffle randomly
    numbers.ShuffleArray();
    // numbers: [3, 1, 5, 2, 4]  (random order)
}
```

### Copying

```c
void CopyingArrays()
{
    array<string> original = {"A", "B", "C"};

    // Copy: replaces all contents with a copy of another array
    array<string> copy = new array<string>;
    copy.Copy(original);
    // copy: ["A", "B", "C"]
    // Modifying copy does NOT affect original

    // InsertAll: appends (does not replace)
    array<string> combined = {"X", "Y"};
    combined.InsertAll(original);
    // combined: ["X", "Y", "A", "B", "C"]
}
```

### Debugging

```c
void DebuggingArrays()
{
    array<string> items = {"Bandage", "Morphine", "Saline"};

    // Debug: prints all elements to script log
    items.Debug();
    // Output:
    // [0] => Bandage
    // [1] => Morphine
    // [2] => Saline
}
```

---

## Iterating Arrays

### for Loop (Index-Based)

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

### foreach (Value Only)

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

### foreach (Index + Value)

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

### Real-World Example: Finding the Nearest Player

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

## Maps: `map<K,V>`

Maps store key-value pairs. They are used when you need to look up a value by a key --- player data by UID, item prices by class name, permissions by role name, and so on.

### Creation

```c
void CreateMaps()
{
    // Standard creation
    map<string, int> prices = new map<string, int>;

    // Maps of various types
    map<string, float> multipliers = new map<string, float>;
    map<int, string> idToName = new map<int, string>;
    map<string, ref array<string>> categories = new map<string, ref array<string>>;
}
```

### Pre-defined Map Typedefs

```c
typedef map<string, int>     TStringIntMap;
typedef map<string, string>  TStringStringMap;
typedef map<int, string>     TIntStringMap;
typedef map<string, float>   TStringFloatMap;
```

---

## Complete Map Method Reference

### Inserting and Updating

```c
void MapInsertUpdate()
{
    map<string, int> inventory = new map<string, int>;

    // Insert: add a new key-value pair
    // Returns true if the key was new, false if it already existed
    bool isNew = inventory.Insert("Bandage", 5);    // true (new key)
    isNew = inventory.Insert("Bandage", 10);         // false (key exists, value NOT updated)
    // inventory["Bandage"] is still 5!

    // Set: insert OR update (this is what you usually want)
    inventory.Set("Bandage", 10);    // Now inventory["Bandage"] == 10
    inventory.Set("Morphine", 3);    // New key added
    inventory.Set("Morphine", 7);    // Existing key updated to 7
}
```

**Critical distinction:** `Insert()` does **not** update existing keys. `Set()` does. When in doubt, use `Set()`.

### Accessing Values

```c
void MapAccess()
{
    map<string, int> prices = new map<string, int>;
    prices.Set("AKM", 5000);
    prices.Set("M4A1", 7500);
    prices.Set("Mosin", 2000);

    // Get: returns value, or default (0 for int) if key not found
    int akmPrice = prices.Get("AKM");         // 5000
    int falPrice = prices.Get("FAL");          // 0 (not found, returns default)

    // Find: safe access, returns true if key exists and sets the out parameter
    int price;
    bool found = prices.Find("M4A1", price);  // found == true, price == 7500
    bool notFound = prices.Find("SVD", price); // notFound == false, price unchanged

    // Contains: check if key exists (no value retrieval)
    bool hasAKM = prices.Contains("AKM");     // true
    bool hasFAL = prices.Contains("FAL");     // false

    // Count: number of key-value pairs
    int count = prices.Count();  // 3
}
```

### Removing

```c
void MapRemove()
{
    map<string, int> data = new map<string, int>;
    data.Set("a", 1);
    data.Set("b", 2);
    data.Set("c", 3);

    // Remove: remove by key
    data.Remove("b");
    // data now has: {"a": 1, "c": 3}

    // Clear: remove all entries
    data.Clear();
    // data.Count() == 0
}
```

### Index-Based Access

Maps support positional access, but it is `O(n)` --- use it for iteration, not frequent lookups.

```c
void MapIndexAccess()
{
    map<string, int> data = new map<string, int>;
    data.Set("alpha", 1);
    data.Set("beta", 2);
    data.Set("gamma", 3);

    // Access by internal index (O(n), order is insertion order)
    for (int i = 0; i < data.Count(); i++)
    {
        string key = data.GetKey(i);
        int value = data.GetElement(i);
        Print(string.Format("%1 = %2", key, value));
    }
}
```

### Extracting Keys and Values

```c
void MapExtraction()
{
    map<string, int> prices = new map<string, int>;
    prices.Set("AKM", 5000);
    prices.Set("M4A1", 7500);
    prices.Set("Mosin", 2000);

    // Get all keys as an array
    array<string> keys = prices.GetKeyArray();
    // keys: ["AKM", "M4A1", "Mosin"]

    // Get all values as an array
    array<int> values = prices.GetValueArray();
    // values: [5000, 7500, 2000]
}
```

### Real-World Example: Player Tracking

```c
class PlayerTracker
{
    protected ref map<string, vector> m_LastPositions;  // UID -> position
    protected ref map<string, float> m_PlayTime;        // UID -> seconds

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

## Sets: `set<T>`

Sets are ordered collections similar to arrays, but with semantics oriented toward value-based operations (find and remove by value). They are less commonly used than arrays and maps.

```c
void SetExamples()
{
    set<string> activeZones = new set<string>;

    // Insert: add an element
    activeZones.Insert("NWAF");
    activeZones.Insert("Tisy");
    activeZones.Insert("Balota");

    // Find: returns index or -1
    int idx = activeZones.Find("Tisy");    // 1
    int missing = activeZones.Find("Zelenogorsk");  // -1

    // Get: access by index
    string first = activeZones.Get(0);     // "NWAF"

    // Count
    int count = activeZones.Count();       // 3

    // Remove by index
    activeZones.Remove(0);
    // activeZones: ["Tisy", "Balota"]

    // RemoveItem: remove by value
    activeZones.RemoveItem("Tisy");
    // activeZones: ["Balota"]

    // Clear
    activeZones.Clear();
}
```

### When to Use Set vs Array

In practice, most DayZ modders use `array<T>` for almost everything because:
- `set<T>` has fewer methods than `array<T>`
- `array<T>` provides `Find()` for search and `RemoveItem()` for value-based removal
- The API you need is typically on `array<T>` already

Use `set<T>` when your code semantically represents a set (no meaningful order, focused on membership testing), or when you encounter it in vanilla DayZ code and need to interface with it.

---

## Iterating Maps

Maps support `foreach` for convenient iteration:

### foreach with Key-Value

```c
void IterateMap()
{
    map<string, int> scores = new map<string, int>;
    scores.Set("Alice", 150);
    scores.Set("Bob", 230);
    scores.Set("Charlie", 180);

    // foreach with key and value
    foreach (string name, int score : scores)
    {
        Print(string.Format("%1: %2 points", name, score));
    }
    // Alice: 150 points
    // Bob: 230 points
    // Charlie: 180 points
}
```

### Index-Based for Loop

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

## Nested Collections

Collections can contain other collections. When storing reference types (like arrays) inside a map, use `ref` to manage ownership.

```c
class LootTable
{
    // Map from category name to list of class names
    protected ref map<string, ref array<string>> m_Categories;

    void LootTable()
    {
        m_Categories = new map<string, ref array<string>>;

        // Create category arrays
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

## Best Practices

- Always use `new` to instantiate collections before use -- `array<string> items;` is `null`, not empty.
- Prefer `map.Set()` over `map.Insert()` for updates -- `Insert` silently ignores existing keys.
- When removing elements during iteration, use a backward `for` loop or build a separate removal list -- never modify a collection inside `foreach`.
- Use `Reserve()` when you know the expected element count ahead of time to avoid repeated internal re-allocations.
- Guard every element access with `IsValidIndex()` or a `Count() > 0` check -- out-of-bounds access causes silent crashes.

---

## Observed in Real Mods

> Patterns confirmed by studying professional DayZ mod source code.

| Pattern | Mod | Detail |
|---------|-----|--------|
| Backward `for` loop for removal | Expansion / COT | Always iterate `Count()-1` down to `0` when removing filtered elements |
| `map<string, ref ClassName>` for registries | Dabs Framework | All manager registries use `ref` in map values to keep objects alive |
| `TStringArray` typedef everywhere | Vanilla / VPP | Config parsing, chat messages, and loot tables all use `TStringArray` instead of `array<string>` |
| Null + empty guard before access | Expansion Market | Every function receiving an array starts with `if (!arr \|\| arr.Count() == 0) return;` |

---

## Theory vs Practice

| Concept | Theory | Reality |
|---------|--------|---------|
| `Remove(index)` is "fast remove" | Should just delete the element | It swaps with the last element first, silently re-ordering the array |
| `map.Insert()` adds a key | Expected to update if key exists | Returns `false` and does nothing if the key is already present |
| `set<T>` for unique collections | Should behave like a mathematical set | Most modders use `array<T>` with `Find()` instead because `set` has fewer methods |

---

## Common Mistakes

### 1. `Remove` vs `RemoveOrdered`: The Silent Bug

`Remove(index)` is fast but **changes the order** by swapping with the last element. If you are iterating forward and removing, this causes skipped elements:

```c
// BAD: skips elements because Remove swaps order
array<int> nums = {1, 2, 3, 4, 5};
for (int i = 0; i < nums.Count(); i++)
{
    if (nums[i] % 2 == 0)
        nums.Remove(i);  // After removing index 1, element at index 1 is now "5"
                          // and we skip to index 2, missing "5"
}

// GOOD: iterate backward when removing
array<int> nums2 = {1, 2, 3, 4, 5};
for (int j = nums2.Count() - 1; j >= 0; j--)
{
    if (nums2[j] % 2 == 0)
        nums2.Remove(j);  // Safe: removing from the end doesn't affect lower indices
}

// ALSO GOOD: use RemoveOrdered with backward iteration for order preservation
array<int> nums3 = {1, 2, 3, 4, 5};
for (int k = nums3.Count() - 1; k >= 0; k--)
{
    if (nums3[k] % 2 == 0)
        nums3.RemoveOrdered(k);
}
// nums3: [1, 3, 5] in original order
```

### 2. Array Index Out of Bounds

Enforce Script does not throw exceptions for out-of-bounds access --- it silently returns garbage or crashes. Always check bounds.

```c
// BAD: no bounds check
array<string> items = {"A", "B", "C"};
string fourth = items[3];  // UNDEFINED BEHAVIOR: index 3 doesn't exist

// GOOD: check bounds
if (items.IsValidIndex(3))
{
    string fourth2 = items[3];
}

// GOOD: check count
if (items.Count() > 0)
{
    string last = items[items.Count() - 1];
}
```

### 3. Forgetting to Create the Collection

Collections are objects and must be instantiated with `new`:

```c
// BAD: null reference crash
array<string> items;
items.Insert("Test");  // CRASH: items is null

// GOOD: create first
array<string> items2 = new array<string>;
items2.Insert("Test");

// ALSO GOOD: initializer list creates automatically
array<string> items3 = {"Test"};
```

### 4. `Insert` vs `Set` on Maps

`Insert` does not update existing keys --- it returns `false` and leaves the value unchanged:

```c
map<string, int> data = new map<string, int>;
data.Insert("key", 100);
data.Insert("key", 200);   // Returns false, value is STILL 100!

// Use Set to update
data.Set("key", 200);      // Now value is 200
```

### 5. Modifying a Collection During foreach

Do not add or remove elements from a collection while iterating over it with `foreach`. Build a separate list of elements to remove, then remove them afterward.

```c
// BAD: modifying during iteration
array<string> items = {"A", "B", "C", "D"};
foreach (string item : items)
{
    if (item == "B")
        items.RemoveItem(item);  // UNDEFINED: invalidates iterator
}

// GOOD: collect then remove
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

### 6. Empty Array Safety

Always check if an array is both non-null and non-empty before accessing elements:

```c
string GetFirstItem(array<string> items)
{
    // Guard clause: null check + empty check
    if (!items || items.Count() == 0)
        return "";

    return items[0];
}
```

---

## Practice Exercises

### Exercise 1: Inventory Counter
Create a function that takes an `array<string>` of item class names (with duplicates) and returns a `map<string, int>` counting how many of each item exists.

Example: `{"Bandage", "Morphine", "Bandage", "Saline", "Bandage"}` should produce `{"Bandage": 3, "Morphine": 1, "Saline": 1}`.

### Exercise 2: Array Deduplication
Write a function `array<string> RemoveDuplicates(array<string> input)` that returns a new array with duplicates removed, preserving the order of first occurrence.

### Exercise 3: Leaderboard
Create a `map<string, int>` of player names to kill counts. Write functions to:
1. Add a kill for a player (creating the entry if needed)
2. Get the top N players sorted by kills (hint: extract to arrays, sort)
3. Remove all players with zero kills

### Exercise 4: Position History
Create a class that stores the last 10 positions of a player (ring buffer using an array). It should:
1. Add a new position (dropping the oldest if at capacity)
2. Return the total distance traveled across all stored positions
3. Return the average position

### Exercise 5: Two-Way Lookup
Create a class with two maps that allows lookup in both directions: given a player UID, find their name; given a name, find their UID. Implement `Register(uid, name)`, `GetNameByUID(uid)`, `GetUIDByName(name)`, and `Unregister(uid)`.

---

## Summary

| Collection | Type | Use Case | Key Difference |
|-----------|------|----------|----------------|
| Static array | `int arr[5]` | Fixed-size, compile-time known | No resize, no methods |
| Dynamic array | `array<T>` | General-purpose ordered list | Rich API, resizable |
| Map | `map<K,V>` | Key-value lookup | `Set()` to insert/update |
| Set | `set<T>` | Value-based membership | Simpler than array, less common |

| Operation | Method | Notes |
|-----------|--------|-------|
| Add to end | `Insert(val)` | Returns index |
| Add at position | `InsertAt(val, idx)` | Shifts right |
| Remove fast | `Remove(idx)` | Swaps with last, **unordered** |
| Remove ordered | `RemoveOrdered(idx)` | Shifts left, preserves order |
| Remove by value | `RemoveItem(val)` | Finds then removes (ordered) |
| Find | `Find(val)` | Returns index or -1 |
| Count | `Count()` | Number of elements |
| Bounds check | `IsValidIndex(idx)` | Returns bool |
| Sort | `Sort()` / `Sort(true)` | Ascending / descending |
| Random | `GetRandomElement()` | Returns random value |
| foreach | `foreach (T val : arr)` | Value only |
| foreach indexed | `foreach (int i, T val : arr)` | Index + value |

---

[Home](../README.md) | [<< Previous: Variables & Types](01-variables-types.md) | **Arrays, Maps & Sets** | [Next: Classes & Inheritance >>](03-classes-inheritance.md)
