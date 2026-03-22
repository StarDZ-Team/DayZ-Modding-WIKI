# Chapter 1.5: Control Flow

[Domů](../README.md) | [<< Předchozí: Modifikované třídy](04-modded-classes.md) | **Řízení toku** | [Další: String Operations >>](06-strings.md)

---

## Úvod

Control flow determines the order in which your code executes. Enforce Script provides the familiar `if/else`, `for`, `while`, `foreach`, and `switch` constructs -- but with several důležitý differences from C/C++ that will catch you off guard if you are not prepared. This chapter covers každý control flow mechanism dostupný, including the pitfalls unique to DayZ's scripting engine.

---

## if / else / else if

The `if` statement evaluates a boolean expression and executes a block of code when výsledek is `true`. You can chain conditions with `else if` and provide a fallback with `else`.

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

In Enforce Script, object references evaluate to `false` when null. Toto je standard way to guard against null access:

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

Combine conditions with `&&` (AND) and `||` (OR). Short-circuit evaluation applies: if the left side of `&&` is `false`, the right side is nikdy evaluated.

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

This is one of the většina common Enforce Script errors. In většina languages, variables declared inside one `if` branch are nezávislý from variables in a sibling `else` branch. **Not in Enforce Script.** Declaring the stejný variable name in sibling `if`/`else if`/`else` blocks causes a **multiple declaration error** at compile time.

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

### Iterating over pole with for

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

> **Poznámka:** Do not redeclare the loop variable `i` if there is již a variable named `i` in the enclosing scope. Enforce Script treats this as a více declaration error, dokonce in nested scopes.

---

## while Loop

The `while` loop repeats a block as long as its condition is `true`. The condition is evaluated **before** každý iteration.

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

The `do...while` keyword ne exist. The compiler will reject it. If potřebujete a loop that vždy executes at least once, use the flag pattern described níže.

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

The `foreach` statement is the cleanest way to iterate over arrays, maps, and statická arrays. It comes in two forms.

### Simple foreach (value pouze)

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

When iterating over arrays, the first variable receives index:

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

For maps, the first variable receives klíč and the second receives hodnota:

```c
void PrintScoreboard(map<string, int> scores)
{
    foreach (string playerName, int score : scores)
    {
        Print(string.Format("%1: %2 kills", playerName, score));
    }
}
```

You can také iterate over maps with jen hodnota:

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

### foreach over statická arrays

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

Unlike C/C++, Enforce Script `switch/case` does **NOT** fall through from one case to the next. Each `case` is nezávislý. You can include `break` for clarity, but it is not povinný to prevent fall-through.

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

> **Remember:** Protože there is no fall-through, můžetenot stack cases to share a handler the way you would in C. Each case must have its own body.

---

## break and continue

### break

`break` exits the innermost loop (or switch case) okamžitě.

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

`break` pouze exits the innermost loop. To break out of nested loops, use a flag variable:

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

## Thread Keyword

Enforce Script has a `thread` keyword for asynchronous execution:

```c
// Declare a threaded function
thread void LongOperation()
{
    // This runs asynchronously
    Sleep(5000);  // Wait 5 seconds without blocking
    Print("Done!");
}

// Call it
thread LongOperation();  // Starts without blocking the caller
```

**Important:** `thread` in Enforce Script is NOT the stejný as OS threads. It is more like a coroutine --- it runs on the stejný thread but can yield/sleep without blocking the game. Use `CallLater` místo `thread` for většina mod případ užitís --- it is simpler and more predictable.

### Thread vs CallLater

| Feature | `thread` | `CallLater` |
|---------|----------|-------------|
| Syntax | `thread MyFunc();` | `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.MyFunc, delayMs, repeat);` |
| Can sleep/yield | Yes (`Sleep()`) | No (fires once or repeats at interval) |
| Cancellable | No vestavěný cancel | Yes (`CallQueue.Remove()`) |
| Use case | Sequential async logic with waits | Delayed or repeated zpětné volánís |

For většina DayZ modding scenarios, `CallLater` with a timer is the preferred approach. Reserve `thread` for cases where you genuinely need sequential logic with intermediate waits (e.g., a multi-step animation sequence).

---

## Osvědčené postupy

- Use guard clauses (`if (!x) return;`) at the top of functions místo deeply nested `if` blocks -- it keeps the happy path flat and readable.
- Declare shared variables before `if`/`else` blocks to avoid the sibling-scope redeclaration error unique to Enforce Script.
- Use `foreach` for simple iteration and `for` with index pouze when potřebujete to remove elements or access neighbors.
- Nahraďte `do...while` with `while (first || condition)` using a `bool first = true` flag -- this is the standard Enforce Script workaround.
- Preferujte `CallLater` over `thread` for delayed or repeated actions -- it is cancellable, simpler, and more predictable.

---

## Pozorováno v reálných modech

> Patterns confirmed by studying professional DayZ mod source code.

| Vzor | Mod | Detail |
|---------|-----|--------|
| Guard clause + `continue` in loops | COT / Expansion | Loops over hráči vždy `continue` on failed cast or `!IsAlive()` before doing work |
| `switch` on string commands | VPP Admin | Chat command handlers use `switch(command)` with string cases like `"!heal"`, `"!tp"` |
| Flag variable to break nested loops | Expansion Market | Uses `bool found = false` with check after inner loop to exit outer loop |
| `CallLater` for delayed spawn | Dabs Framework | Prefers `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater()` over `thread` |

---

## Teorie vs praxe

| Concept | Theory | Reality |
|---------|--------|---------|
| `do...while` loop | Standard in většina C-like languages | Does not exist in Enforce Script; causes a confusing compile error |
| `switch` fall-through | C/C++ cases fall through without `break` | Enforce Script cases are nezávislý -- stacking cases ne share handlers |
| `thread` keyword | Sounds like multithreading | Actually a coroutine on the main thread; `Sleep()` yields, ne block |
| Variable scope in `if`/`else` | Sibling blocks should have nezávislý scope | Enforce Script treats them as shared scope -- stejný variable name in oba blocks is a compile error |

---

## Časté chyby

| Mistake | Problem | Fix |
|---------|---------|-----|
| Using `do...while` | Does not exist in Enforce Script | Use `while` with a `bool first = true` flag |
| Declaring stejný variable in `if` and `else` blocks | Multiple declaration error | Declare the variable before the `if` |
| Redeclaring loop variable `i` in nested scope | Multiple declaration error | Use odlišný names (`i`, `j`, `k`) or declare outside |
| Expecting `switch` fall-through | Cases are nezávislý, no fall-through | Each case needs its own complete handler |
| Modifying array while iterating with `foreach` | Undefined behavior, potential crash | Use index-based `for` loop when removing elements |
| Infinite `while` loop without `break` | Server freeze / client hang | Vždy ensure the condition will dokoncetually be `false`, or use `break` |

---

## Quick Reference

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

// thread (coroutine-style async)
thread void MyFunc() { Sleep(1000); }
thread MyFunc();  // non-blocking call
```

---

[<< 1.4: Modded Classes](04-modded-classes.md) | [Domů](../README.md) | [1.6: String Operations >>](06-strings.md)
