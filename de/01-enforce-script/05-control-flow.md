# Chapter 1.5: Control Flow

[Home](../../README.md) | [<< Previous: Modded Classes](04-modded-classes.md) | **Control Flow** | [Next: String Operations >>](06-strings.md)

---

## Einführung

Control flow determines the order in which your code executes. Enforce Script provides the familiar `if/else`, `for`, `while`, `foreach`, and `switch` constructs -- but with several important differences from C/C++ that will catch you off guard if you are not prepared. This chapter covers every control flow mechanism available, including the pitfalls unique to DayZ's scripting engine.

---

## if / else / else if

The `if` statement evaluates a boolean expression and executes a block of code when the result is `true`. You can chain conditions with `else if` and provide a fallback with `else`.

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

### Null checks

In Enforce Script, object references evaluate to `false` when null. This is the standard way to guard against null access:

```c
void ProcessItem(EntityAI item)
{
    if (!item)
        return;

    string name = item.GetType();
    Print("Processing: " + name);
}
```

### Logical operators

Combine conditions with `&&` (AND) and `||` (OR). Short-circuit evaluation applies: if the left side of `&&` is `false`, the right side is never evaluated.

```c
void CheckPlayerState(PlayerBase player)
{
    if (player && player.IsAlive())
    {
        // Safe -- player is checked for null before calling IsAlive()
        Print("Player is alive");
    }

    if (player.GetHealth("", "Blood") < 3000 || player.GetHealth("", "Health") < 25)
    {
        Print("Player is in danger");
    }
}
```

### PITFALL: Variable redeclaration in else-if blocks

This is one of the most common Enforce Script errors. In most languages, variables declared inside one `if` branch are independent from variables in a sibling `else` branch. **Not in Enforce Script.** Declaring the same variable name in sibling `if`/`else if`/`else` blocks causes a **multiple declaration error** at compile time.

```c
// WRONG -- Compile error!
void BadExample(Object obj)
{
    if (obj.IsKindOf("Car"))
    {
        Car vehicle = Car.Cast(obj);
        vehicle.GetSpeedometer();
    }
    else if (obj.IsKindOf("ItemBase"))
    {
        ItemBase item = ItemBase.Cast(obj);    // OK -- different name
        item.GetQuantity();
    }
    else
    {
        string msg = "Unknown object";         // First declaration of msg
        Print(msg);
    }
}
```

Wait -- that looks fine, right? The problem occurs when you use the **same variable name** in two branches:

```c
// WRONG -- Compile error: multiple declaration of 'result'
void ProcessObject(Object obj)
{
    if (obj.IsKindOf("Car"))
    {
        string result = "It's a car";
        Print(result);
    }
    else
    {
        string result = "It's something else";  // ERROR! Same name as in the if block
        Print(result);
    }
}
```

**The fix:** Declare the variable **before** the if statement, or use unique names per branch.

```c
// CORRECT -- Declare before the if
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

## for Loop

The `for` loop is identical to C-style syntax: initializer, condition, and increment.

```c
// Print numbers 0 through 9
void CountToTen()
{
    for (int i = 0; i < 10; i++)
    {
        Print(i);
    }
}
```

### Iterating over an array with for

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

### Nested for loops

```c
// Spawn a grid of objects
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

> **Note:** Do not redeclare the loop variable `i` if there is already a variable named `i` in the enclosing scope. Enforce Script treats this as a multiple declaration error, even in nested scopes.

---

## while Loop

The `while` loop repeats a block as long as its condition is `true`. The condition is evaluated **before** each iteration.

```c
// Remove all dead zombies from a tracking list
void CleanupDeadZombies(array<DayZInfected> zombieList)
{
    int i = 0;
    while (i < zombieList.Count())
    {
        EntityAI eai;
        if (Class.CastTo(eai, zombieList.Get(i)) && !eai.IsAlive())
        {
            zombieList.RemoveOrdered(i);
            // Do NOT increment i -- the next element has shifted into this index
        }
        else
        {
            i++;
        }
    }
}
```

### WARNING: There is NO do...while in Enforce Script

The `do...while` keyword does not exist. The compiler will reject it. If you need a loop that always executes at least once, use the flag pattern described below.

```c
// WRONG -- This will NOT compile
do
{
    // body
}
while (someCondition);
```

---

## Simulating do...while with a Flag

The standard workaround is to use a `bool` flag that is `true` on the first iteration:

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

An alternative approach using `break`:

```c
void AlternativeDoWhile()
{
    while (true)
    {
        // Body executes at least once
        DoSomething();

        // Check the exit condition at the END
        if (!ShouldContinue())
            break;
    }
}
```

---

## foreach

The `foreach` statement is the cleanest way to iterate over arrays, maps, and static arrays. It comes in two forms.

### Simple foreach (value only)

```c
void AnnounceItems(array<string> itemNames)
{
    foreach (string name : itemNames)
    {
        Print("Found item: " + name);
    }
}
```

### foreach with index

When iterating over arrays, the first variable receives the index:

```c
void ListPlayers(array<Man> players)
{
    foreach (int idx, Man player : players)
    {
        Print(string.Format("Player #%1: %2", idx, player.GetIdentity().GetName()));
    }
}
```

### foreach over maps

For maps, the first variable receives the key and the second receives the value:

```c
void PrintScoreboard(map<string, int> scores)
{
    foreach (string playerName, int score : scores)
    {
        Print(string.Format("%1: %2 kills", playerName, score));
    }
}
```

You can also iterate over maps with just the value:

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

### foreach over static arrays

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

The `switch` statement matches a value against a list of `case` labels. It works with `int`, `string`, enum values, and constants.

### Important: NO fall-through

Unlike C/C++, Enforce Script `switch/case` does **NOT** fall through from one case to the next. Each `case` is independent. You can include `break` for clarity, but it is not required to prevent fall-through.

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

### switch with enums

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

### switch with integer constants

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

> **Remember:** Because there is no fall-through, you cannot stack cases to share a handler the way you would in C. Each case must have its own body.

---

## break and continue

### break

`break` exits the innermost loop (or switch case) immediately.

```c
// Find the first player within 100 meters
void FindNearbyPlayer(vector origin, array<Man> players)
{
    foreach (Man player : players)
    {
        float dist = vector.Distance(origin, player.GetPosition());
        if (dist < 100)
        {
            Print("Found nearby player: " + player.GetIdentity().GetName());
            break; // Stop searching
        }
    }
}
```

### continue

`continue` skips the rest of the current iteration and jumps to the next one.

```c
// Process only alive players
void HealAllPlayers(array<Man> players)
{
    foreach (Man man : players)
    {
        PlayerBase player;
        if (!Class.CastTo(player, man))
            continue; // Not a PlayerBase, skip

        if (!player.IsAlive())
            continue; // Dead, skip

        player.SetHealth("", "Health", 100);
        Print("Healed: " + player.GetIdentity().GetName());
    }
}
```

### Nested loops with break

`break` only exits the innermost loop. To break out of nested loops, use a flag variable:

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
                break; // Only exits inner loop
            }
        }

        if (found)
            break; // Exits outer loop
    }
}
```

---

## Häufige Fehler

| Mistake | Problem | Fix |
|---------|---------|-----|
| Using `do...while` | Does not exist in Enforce Script | Use `while` with a `bool first = true` flag |
| Declaring same variable in `if` and `else` blocks | Multiple declaration error | Declare the variable before the `if` |
| Redeclaring loop variable `i` in nested scope | Multiple declaration error | Use different names (`i`, `j`, `k`) or declare outside |
| Expecting `switch` fall-through | Cases are independent, no fall-through | Each case needs its own complete handler |
| Modifying array while iterating with `foreach` | Undefined behavior, potential crash | Use index-based `for` loop when removing elements |
| Infinite `while` loop without `break` | Server freeze / client hang | Always ensure the condition will eventually be `false`, or use `break` |

---

## Schnellreferenz

```c
// if / else if / else
if (condition) { } else if (other) { } else { }

// for loop
for (int i = 0; i < count; i++) { }

// while loop
while (condition) { }

// Simulate do...while
bool first = true;
while (first || condition) { first = false; /* body */ }

// foreach (value only)
foreach (Type value : collection) { }

// foreach (index + value)
foreach (int i, Type value : array) { }

// foreach (key + value on map)
foreach (KeyType key, ValueType val : someMap) { }

// switch/case (no fall-through)
switch (value) { case X: /* ... */ break; default: break; }
```

---

[<< 1.4: Modded Classes](04-modded-classes.md) | [Startseite](../../README.md) | [1.6: String Operations >>](06-strings.md)
