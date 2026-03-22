# Chapter 1.5: Control Flow

[Home](../README.md) | [<< Previous: Modded Classes](04-modded-classes.md) | **Control Flow** | [Next: String Operations >>](06-strings.md)

---

## Introdução

Fluxo de controle determina a ordem em que seu código executa. Enforce Script fornece os familiares `if/else`, `for`, `while`, `foreach` e `switch` --- mas com várias diferenças importantes em relação ao C/C++ que vão te pegar de surpresa se você não estiver preparado. Este capítulo cobre cada mecanismo de fluxo de controle disponível, incluindo as armadilhas exclusivas do engine de scripting do DayZ.

---

## if / else / else if

O `if` avalia uma expressão booleana e executa um bloco de código quando o resultado é `true`. Você pode encadear condições com `else if` e fornecer um fallback com `else`.

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

### Verificações de null

Em Enforce Script, referências de objetos avaliam como `false` quando nulas. Esta é a forma padrão de se proteger contra acesso nulo:

```c
void ProcessItem(EntityAI item)
{
    if (!item)
        return;

    string name = item.GetType();
    Print("Processing: " + name);
}
```

### Operadores lógicos

Combine condições com `&&` (AND) e `||` (OR). Avaliação de curto-circuito se aplica: se o lado esquerdo do `&&` é `false`, o lado direito nunca é avaliado.

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

### ARMADILHA: Redeclaração de variáveis em blocos else-if

Este é um dos erros mais comuns do Enforce Script. Na maioria das linguagens, variáveis declaradas dentro de um bloco `if` são independentes de variáveis em um bloco `else` irmão. **Não no Enforce Script.** Declarar o mesmo nome de variável em blocos irmãos `if`/`else if`/`else` causa um **erro de declaração múltipla** em tempo de compilação.

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

Espere --- parece certo, não? O problema acontece quando você usa o **mesmo nome de variável** em dois blocos:

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

**A correção:** Declare a variável **antes** do if, ou use nomes únicos por bloco.

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

## Loop for

O loop `for` é idêntico à sintaxe estilo C: inicializador, condição e incremento.

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

### Iterando sobre um array com for

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

### Loops for aninhados

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

> **Nota:** Não redeclare a variável de loop `i` se já existir uma variável chamada `i` no escopo envolvente. Enforce Script trata isso como erro de declaração múltipla, mesmo em escopos aninhados.

---

## Loop while

O loop `while` repete um bloco enquanto sua condição for `true`. A condição é avaliada **antes** de cada iteração.

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

### AVISO: NÃO existe do...while no Enforce Script

A palavra-chave `do...while` não existe. O compilador vai rejeitá-la. Se você precisa de um loop que sempre executa pelo menos uma vez, use o padrão com flag descrito abaixo.

```c
// WRONG -- This will NOT compile
do
{
    // body
}
while (someCondition);
```

---

## Simulando do...while com Flag

O workaround padrão é usar uma variável `bool` que é `true` na primeira iteração:

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

Uma abordagem alternativa usando `break`:

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

O `foreach` é a forma mais limpa de iterar sobre arrays, maps e arrays estáticos. Vem em duas formas.

### foreach simples (apenas valor)

```c
void AnnounceItems(array<string> itemNames)
{
    foreach (string name : itemNames)
    {
        Print("Found item: " + name);
    }
}
```

### foreach com índice

Ao iterar sobre arrays, a primeira variável recebe o índice:

```c
void ListPlayers(array<Man> players)
{
    foreach (int idx, Man player : players)
    {
        Print(string.Format("Player #%1: %2", idx, player.GetIdentity().GetName()));
    }
}
```

### foreach sobre maps

Para maps, a primeira variável recebe a chave e a segunda recebe o valor:

```c
void PrintScoreboard(map<string, int> scores)
{
    foreach (string playerName, int score : scores)
    {
        Print(string.Format("%1: %2 kills", playerName, score));
    }
}
```

Você também pode iterar sobre maps apenas com o valor:

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

### foreach sobre arrays estáticos

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

O `switch` compara um valor contra uma lista de labels `case`. Funciona com `int`, `string`, valores de enum e constantes.

### Importante: SEM fall-through

Diferente do C/C++, o `switch/case` do Enforce Script **NÃO** faz fall-through de um case para o próximo. Cada `case` é independente. Você pode incluir `break` para clareza, mas não é necessário para prevenir fall-through.

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

### switch com enums

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

### switch com constantes inteiras

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

> **Lembre-se:** Como não há fall-through, você não pode empilhar cases para compartilhar um handler como faria em C. Cada case deve ter seu próprio corpo.

---

## break e continue

### break

`break` sai do loop mais interno (ou switch case) imediatamente.

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

`continue` pula o resto da iteração atual e vai para a próxima.

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

### Loops aninhados com break

`break` só sai do loop mais interno. Para sair de loops aninhados, use uma variável flag:

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

## Erros Comuns

| Erro | Problema | Correção |
|------|----------|----------|
| Usar `do...while` | Não existe no Enforce Script | Use `while` com flag `bool first = true` |
| Declarar mesma variável em blocos `if` e `else` | Erro de declaração múltipla | Declare a variável antes do `if` |
| Redeclarar variável de loop `i` em escopo aninhado | Erro de declaração múltipla | Use nomes diferentes (`i`, `j`, `k`) ou declare fora |
| Esperar fall-through no `switch` | Cases são independentes, sem fall-through | Cada case precisa de seu próprio handler completo |
| Modificar array enquanto itera com `foreach` | Comportamento indefinido, possível crash | Use loop `for` baseado em índice ao remover elementos |
| Loop `while` infinito sem `break` | Freeze do servidor / travamento do cliente | Sempre garanta que a condição eventualmente será `false`, ou use `break` |

---

## Referência Rápida

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

[<< 1.4: Modded Classes](04-modded-classes.md) | [Início](../README.md) | [1.6: Operações com Strings >>](06-strings.md)
