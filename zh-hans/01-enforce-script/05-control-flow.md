# 第 1.5 章：控制流

[首页](../../README.md) | [<< 上一章：Modded 类](04-modded-classes.md) | **控制流** | [下一章：字符串操作 >>](06-strings.md)

---

## 简介

控制流决定了代码的执行顺序。Enforce Script 提供了常见的 `if/else`、`for`、`while`、`foreach` 和 `switch` 结构——但与 C/C++ 相比存在几个重要差异，如果你没有做好准备，这些差异会让你措手不及。本章涵盖所有可用的控制流机制，包括 DayZ 脚本引擎特有的陷阱。

---

## if / else / else if

`if` 语句对布尔表达式求值，当结果为 `true` 时执行代码块。你可以使用 `else if` 链接条件，并使用 `else` 提供后备分支。

```c
void CheckHealth(PlayerBase player)
{
    float health = player.GetHealth("", "Health");

    if (health > 75)
    {
        Print("玩家状态健康");
    }
    else if (health > 25)
    {
        Print("玩家受伤了");
    }
    else
    {
        Print("玩家状态危急");
    }
}
```

### 空值检查

在 Enforce Script 中，对象引用为 null 时求值为 `false`。这是防止空值访问的标准方法：

```c
void ProcessItem(EntityAI item)
{
    if (!item)
        return;

    string name = item.GetType();
    Print("正在处理：" + name);
}
```

### 逻辑运算符

使用 `&&`（与）和 `||`（或）组合条件。短路求值适用：如果 `&&` 的左侧为 `false`，右侧不会被求值。

```c
void CheckPlayerState(PlayerBase player)
{
    if (player && player.IsAlive())
    {
        // 安全——在调用 IsAlive() 之前已检查 player 是否为空
        Print("玩家存活");
    }

    if (player.GetHealth("", "Blood") < 3000 || player.GetHealth("", "Health") < 25)
    {
        Print("玩家处于危险中");
    }
}
```

### 陷阱：else-if 代码块中的变量重复声明

这是最常见的 Enforce Script 错误之一。在大多数语言中，在一个 `if` 分支中声明的变量与同级 `else` 分支中的变量是独立的。**在 Enforce Script 中不是这样。** 在同级的 `if`/`else if`/`else` 代码块中声明同名变量会在编译时导致**重复声明错误**。

```c
// 错误——编译错误！
void BadExample(Object obj)
{
    if (obj.IsKindOf("Car"))
    {
        Car vehicle = Car.Cast(obj);
        vehicle.GetSpeedometer();
    }
    else if (obj.IsKindOf("ItemBase"))
    {
        ItemBase item = ItemBase.Cast(obj);    // 没问题——不同的名称
        item.GetQuantity();
    }
    else
    {
        string msg = "未知对象";         // msg 的首次声明
        Print(msg);
    }
}
```

等等——这看起来没问题吧？问题出现在两个分支中使用**相同的变量名**时：

```c
// 错误——编译错误：'result' 的重复声明
void ProcessObject(Object obj)
{
    if (obj.IsKindOf("Car"))
    {
        string result = "这是一辆车";
        Print(result);
    }
    else
    {
        string result = "这是其他东西";  // 错误！与 if 块中的同名
        Print(result);
    }
}
```

**解决方法：** 在 if 语句**之前**声明变量，或在每个分支中使用不同的名称。

```c
// 正确——在 if 之前声明
void ProcessObject(Object obj)
{
    string result;

    if (obj.IsKindOf("Car"))
    {
        result = "这是一辆车";
    }
    else
    {
        result = "这是其他东西";
    }

    Print(result);
}
```

---

## for 循环

`for` 循环与 C 风格的语法相同：初始化器、条件和递增。

```c
// 打印数字 0 到 9
void CountToTen()
{
    for (int i = 0; i < 10; i++)
    {
        Print(i);
    }
}
```

### 使用 for 遍历数组

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

### 嵌套 for 循环

```c
// 生成一个对象网格
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

> **注意：** 如果外围作用域中已有名为 `i` 的变量，请不要重新声明循环变量 `i`。Enforce Script 将此视为重复声明错误，即使在嵌套作用域中也是如此。

---

## while 循环

`while` 循环在条件为 `true` 时重复执行代码块。条件在每次迭代**之前**求值。

```c
// 从跟踪列表中移除所有已死的僵尸
void CleanupDeadZombies(array<DayZInfected> zombieList)
{
    int i = 0;
    while (i < zombieList.Count())
    {
        EntityAI eai;
        if (Class.CastTo(eai, zombieList.Get(i)) && !eai.IsAlive())
        {
            zombieList.RemoveOrdered(i);
            // 不要递增 i——下一个元素已移到当前索引位置
        }
        else
        {
            i++;
        }
    }
}
```

### 警告：Enforce Script 中没有 do...while

`do...while` 关键字不存在。编译器会拒绝它。如果你需要一个至少执行一次的循环，请使用下面描述的标志模式。

```c
// 错误——这无法编译
do
{
    // 循环体
}
while (someCondition);
```

---

## 使用标志模拟 do...while

标准的解决方法是使用一个 `bool` 标志，在第一次迭代时为 `true`：

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

    Print(string.Format("在 %1 次尝试后找到安全位置", attempts));
}
```

另一种使用 `break` 的方法：

```c
void AlternativeDoWhile()
{
    while (true)
    {
        // 循环体至少执行一次
        DoSomething();

        // 在末尾检查退出条件
        if (!ShouldContinue())
            break;
    }
}
```

---

## foreach

`foreach` 语句是遍历数组、映射和静态数组最简洁的方式。它有两种形式。

### 简单 foreach（仅值）

```c
void AnnounceItems(array<string> itemNames)
{
    foreach (string name : itemNames)
    {
        Print("发现物品：" + name);
    }
}
```

### 带索引的 foreach

遍历数组时，第一个变量接收索引：

```c
void ListPlayers(array<Man> players)
{
    foreach (int idx, Man player : players)
    {
        Print(string.Format("玩家 #%1：%2", idx, player.GetIdentity().GetName()));
    }
}
```

### foreach 遍历映射

对于映射，第一个变量接收键，第二个接收值：

```c
void PrintScoreboard(map<string, int> scores)
{
    foreach (string playerName, int score : scores)
    {
        Print(string.Format("%1：%2 次击杀", playerName, score));
    }
}
```

你也可以仅用值遍历映射：

```c
void SumScores(map<string, int> scores)
{
    int total = 0;
    foreach (int score : scores)
    {
        total += score;
    }
    Print("总击杀数：" + total);
}
```

### foreach 遍历静态数组

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

`switch` 语句将一个值与一系列 `case` 标签进行匹配。它适用于 `int`、`string`、枚举值和常量。

### 重要：没有贯穿（fall-through）

与 C/C++ 不同，Enforce Script 的 `switch/case` **不会**从一个 case 贯穿到下一个。每个 `case` 是独立的。你可以为了清晰而包含 `break`，但它不是防止贯穿所必需的。

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
            Print("未知命令：" + command);
            break;
    }
}
```

### 使用枚举的 switch

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

    Print(string.Format("僵尸倍率：%1", zombieMultiplier));
}
```

### 使用整数常量的 switch

```c
void DescribeWeaponSlot(int slotId)
{
    const int SLOT_SHOULDER = 0;
    const int SLOT_MELEE = 1;
    const int SLOT_PISTOL = 2;

    switch (slotId)
    {
        case SLOT_SHOULDER:
            Print("主武器");
            break;

        case SLOT_MELEE:
            Print("近战武器");
            break;

        case SLOT_PISTOL:
            Print("副武器");
            break;

        default:
            Print("未知槽位");
            break;
    }
}
```

> **记住：** 由于没有贯穿机制，你不能像在 C 中那样堆叠 case 来共享处理程序。每个 case 必须有自己的主体。

---

## break 和 continue

### break

`break` 立即退出最内层的循环（或 switch case）。

```c
// 查找 100 米内的第一个玩家
void FindNearbyPlayer(vector origin, array<Man> players)
{
    foreach (Man player : players)
    {
        float dist = vector.Distance(origin, player.GetPosition());
        if (dist < 100)
        {
            Print("找到附近的玩家：" + player.GetIdentity().GetName());
            break; // 停止搜索
        }
    }
}
```

### continue

`continue` 跳过当前迭代的剩余部分，直接进入下一次迭代。

```c
// 仅处理存活的玩家
void HealAllPlayers(array<Man> players)
{
    foreach (Man man : players)
    {
        PlayerBase player;
        if (!Class.CastTo(player, man))
            continue; // 不是 PlayerBase，跳过

        if (!player.IsAlive())
            continue; // 已死亡，跳过

        player.SetHealth("", "Health", 100);
        Print("已治疗：" + player.GetIdentity().GetName());
    }
}
```

### 嵌套循环中的 break

`break` 仅退出最内层的循环。要跳出嵌套循环，请使用标志变量：

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
                Print(string.Format("在 [%2, %3] 找到 '%1'", target, row, col));
                found = true;
                break; // 仅退出内层循环
            }
        }

        if (found)
            break; // 退出外层循环
    }
}
```

---

## thread 关键字

Enforce Script 有一个用于异步执行的 `thread` 关键字：

```c
// 声明一个线程函数
thread void LongOperation()
{
    // 异步运行
    Sleep(5000);  // 等待 5 秒而不阻塞
    Print("完成！");
}

// 调用它
thread LongOperation();  // 启动而不阻塞调用者
```

**重要：** Enforce Script 中的 `thread` 与操作系统线程不同。它更像是协程——运行在同一个线程上，但可以让出/休眠而不阻塞游戏。大多数 Mod 用例建议使用 `CallLater` 代替 `thread`——它更简单、更可预测。

### Thread 与 CallLater 对比

| 特性 | `thread` | `CallLater` |
|---------|----------|-------------|
| 语法 | `thread MyFunc();` | `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.MyFunc, delayMs, repeat);` |
| 可以休眠/让出 | 是（`Sleep()`） | 否（一次性触发或按间隔重复） |
| 可取消 | 无内置取消功能 | 是（`CallQueue.Remove()`） |
| 用例 | 带等待的顺序异步逻辑 | 延迟或重复回调 |

大多数 DayZ Mod 场景中，`CallLater` 配合计时器是首选方法。仅在你确实需要带中间等待的顺序逻辑时才使用 `thread`（例如多步动画序列）。

---

## 最佳实践

- 在函数顶部使用守卫子句（`if (!x) return;`）而非深层嵌套的 `if` 块——这使正常流程保持扁平和可读。
- 在 `if`/`else` 块之前声明共享变量，以避免 Enforce Script 特有的同级作用域重复声明错误。
- 简单迭代使用 `foreach`，仅在需要移除元素或访问邻居时才使用带索引的 `for`。
- 使用 `bool first = true` 标志将 `do...while` 替换为 `while (first || condition)`——这是标准的 Enforce Script 解决方法。
- 对于延迟或重复操作，优先使用 `CallLater` 而非 `thread`——它可取消、更简单且更可预测。

---

## 在真实 Mod 中的观察

> 通过研究专业 DayZ Mod 源代码确认的模式。

| 模式 | Mod | 详情 |
|---------|-----|--------|
| 循环中的守卫子句 + `continue` | COT / Expansion | 遍历玩家时总是在类型转换失败或 `!IsAlive()` 时先 `continue` 再执行工作 |
| 字符串命令的 `switch` | VPP Admin | 聊天命令处理器使用 `switch(command)` 配合 `"!heal"`、`"!tp"` 等字符串 case |
| 标志变量退出嵌套循环 | Expansion Market | 使用 `bool found = false` 在内层循环后检查以退出外层循环 |
| `CallLater` 用于延迟生成 | Dabs Framework | 优先使用 `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater()` 而非 `thread` |

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| `do...while` 循环 | 大多数类 C 语言的标准 | 在 Enforce Script 中不存在；导致令人困惑的编译错误 |
| `switch` 贯穿 | C/C++ 中没有 `break` 时 case 会贯穿 | Enforce Script 的 case 是独立的——堆叠 case 不会共享处理程序 |
| `thread` 关键字 | 听起来像多线程 | 实际上是主线程上的协程；`Sleep()` 让出执行，不会阻塞 |
| `if`/`else` 中的变量作用域 | 同级块应有独立作用域 | Enforce Script 将其视为共享作用域——两个块中同名变量是编译错误 |

---

## 常见错误

| 错误 | 问题 | 修复方法 |
|---------|---------|-----|
| 使用 `do...while` | 在 Enforce Script 中不存在 | 使用 `while` 配合 `bool first = true` 标志 |
| 在 `if` 和 `else` 块中声明同名变量 | 重复声明错误 | 在 `if` 之前声明变量 |
| 在嵌套作用域中重新声明循环变量 `i` | 重复声明错误 | 使用不同名称（`i`、`j`、`k`）或在外部声明 |
| 期望 `switch` 贯穿 | case 是独立的，没有贯穿 | 每个 case 需要自己的完整处理程序 |
| 在 `foreach` 中修改数组 | 未定义行为，可能崩溃 | 移除元素时使用基于索引的 `for` 循环 |
| 没有 `break` 的无限 `while` 循环 | 服务器冻结/客户端卡死 | 始终确保条件最终变为 `false`，或使用 `break` |

---

## 快速参考

```c
// if / else if / else
if (condition) { } else if (other) { } else { }

// for 循环
for (int i = 0; i < count; i++) { }

// while 循环
while (condition) { }

// 模拟 do...while
bool first = true;
while (first || condition) { first = false; /* 循环体 */ }

// foreach（仅值）
foreach (Type value : collection) { }

// foreach（索引 + 值）
foreach (int i, Type value : array) { }

// foreach（映射的键 + 值）
foreach (KeyType key, ValueType val : someMap) { }

// switch/case（无贯穿）
switch (value) { case X: /* ... */ break; default: break; }

// thread（协程风格异步）
thread void MyFunc() { Sleep(1000); }
thread MyFunc();  // 非阻塞调用
```

---

[<< 1.4：Modded 类](04-modded-classes.md) | [首页](../../README.md) | [1.6：字符串操作 >>](06-strings.md)
