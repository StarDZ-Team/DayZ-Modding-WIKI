# 第 1.2 章：数组、映射与集合

[首页](../README.md) | [<< 上一章：变量与类型](01-variables-types.md) | **数组、映射与集合** | [下一章：类与继承 >>](03-classes-inheritance.md)

---

## 简介

真实的 DayZ 模组处理的是事物的集合：玩家列表、物品栏、玩家 ID 到权限的映射、活跃区域的集合。Enforce Script 提供了三种集合类型来处理这些需求：

- **`array<T>`**——动态的、有序的、可调整大小的列表（你最常使用的集合）
- **`map<K,V>`**——键值关联容器（哈希映射）
- **`set<T>`**——基于值移除的有序集合

还有**静态数组**（`int arr[5]`）用于编译时已知的固定大小数据。本章深入涵盖所有这些，包括每个可用方法、迭代模式，以及在生产模组中导致真实错误的微妙陷阱。

---

## 静态数组

静态数组有在编译时确定的固定大小。它们不能增长或缩小。它们对于小的、已知大小的集合很有用，并且比动态数组更节省内存。

### 声明和使用

```c
void StaticArrayBasics()
{
    // 使用字面量大小声明
    int numbers[5];
    numbers[0] = 10;
    numbers[1] = 20;
    numbers[2] = 30;
    numbers[3] = 40;
    numbers[4] = 50;

    // 使用初始化列表声明
    float damages[3] = {10.5, 25.0, 50.0};

    // 使用 const 大小声明
    const int GRID_SIZE = 4;
    string labels[GRID_SIZE];

    // 访问元素
    int first = numbers[0];     // 10
    float maxDmg = damages[2];  // 50.0

    // 使用 for 循环迭代
    for (int i = 0; i < 5; i++)
    {
        Print(numbers[i]);
    }
}
```

### 静态数组规则

1. 大小必须是编译时常量（字面量或 `const int`）
2. 你**不能**使用变量作为大小：`int arr[myVar]` 是编译错误
3. 访问越界索引会导致未定义行为（没有运行时边界检查）
4. 静态数组通过引用传递给函数（与原始类型不同）

```c
// 静态数组作为函数参数
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
    Print(myArr[0]);  // 100——原始数组被修改了（通过引用传递）
}
```

### 何时使用静态数组

使用静态数组用于：
- 向量/矩阵数据（`vector mat[3]` 用于 3x3 旋转矩阵）
- 小的固定查找表
- 分配开销重要的性能关键热路径

其他所有情况使用动态 `array<T>`。

---

## 动态数组：`array<T>`

动态数组是 DayZ 模组开发中最常用的集合。它们可以在运行时增长和缩小，支持泛型，并提供丰富的方法集。

### 创建

```c
void CreateArrays()
{
    // 方法 1：new 运算符
    array<string> names = new array<string>;

    // 方法 2：初始化列表
    array<int> scores = {100, 85, 92, 78};

    // 方法 3：使用 typedef
    TStringArray items = new TStringArray;  // 等同于 array<string>

    // 任何类型的数组
    array<float> distances = new array<float>;
    array<bool> flags = new array<bool>;
    array<vector> positions = new array<vector>;
    array<PlayerBase> players = new array<PlayerBase>;
}
```

### 预定义的 Typedef

DayZ 为最常见的数组类型提供了简写 typedef：

```c
typedef array<string>  TStringArray;
typedef array<float>   TFloatArray;
typedef array<int>     TIntArray;
typedef array<bool>    TBoolArray;
typedef array<vector>  TVectorArray;
```

你会在 DayZ 代码中经常遇到 `TStringArray`——配置解析、聊天消息、战利品表等。

---

## 完整的数组方法参考

### 添加元素

```c
void AddingElements()
{
    array<string> items = new array<string>;

    // Insert：追加到末尾，返回新索引
    int idx = items.Insert("Bandage");     // idx == 0
    idx = items.Insert("Morphine");        // idx == 1
    idx = items.Insert("Saline");          // idx == 2
    // items: ["Bandage", "Morphine", "Saline"]

    // InsertAt：在指定索引处插入，将现有元素右移
    items.InsertAt("Epinephrine", 1);
    // items: ["Bandage", "Epinephrine", "Morphine", "Saline"]

    // InsertAll：从另一个数组追加所有元素
    array<string> moreItems = {"Tetracycline", "Charcoal"};
    items.InsertAll(moreItems);
    // items: ["Bandage", "Epinephrine", "Morphine", "Saline", "Tetracycline", "Charcoal"]
}
```

### 访问元素

```c
void AccessingElements()
{
    array<string> items = {"Apple", "Banana", "Cherry", "Date"};

    // Get：按索引访问
    string first = items.Get(0);       // "Apple"
    string third = items.Get(2);       // "Cherry"

    // 方括号运算符：与 Get 相同
    string second = items[1];          // "Banana"

    // Set：替换指定索引处的元素
    items.Set(1, "Blueberry");         // items[1] 现在是 "Blueberry"

    // Count：元素数量
    int count = items.Count();         // 4

    // IsValidIndex：边界检查
    bool valid = items.IsValidIndex(3);   // true
    bool invalid = items.IsValidIndex(4); // false
    bool negative = items.IsValidIndex(-1); // false
}
```

### 搜索

```c
void SearchingArrays()
{
    array<string> weapons = {"AKM", "M4A1", "Mosin", "IZH18", "AKM"};

    // Find：返回元素的第一个索引，如果未找到返回 -1
    int idx = weapons.Find("Mosin");    // 2
    int notFound = weapons.Find("FAL");  // -1

    // 检查是否存在
    if (weapons.Find("M4A1") != -1)
        Print("M4A1 found!");

    // GetRandomElement：返回一个随机元素
    string randomWeapon = weapons.GetRandomElement();

    // GetRandomIndex：返回一个随机有效索引
    int randomIdx = weapons.GetRandomIndex();
}
```

### 移除元素

这是最常发生错误的地方。请仔细注意 `Remove` 和 `RemoveOrdered` 之间的区别。

```c
void RemovingElements()
{
    array<string> items = {"A", "B", "C", "D", "E"};

    // Remove(index)：快速但无序
    // 将索引处的元素与最后一个元素交换，然后缩小数组
    items.Remove(1);  // 通过与 "E" 交换来移除 "B"
    // items 现在是：["A", "E", "C", "D"]——顺序改变了！

    // RemoveOrdered(index)：较慢但保持顺序
    // 将索引之后的所有元素左移一位
    items = {"A", "B", "C", "D", "E"};
    items.RemoveOrdered(1);  // 移除 "B"，将 C,D,E 左移
    // items 现在是：["A", "C", "D", "E"]——顺序保持

    // RemoveItem(value)：查找元素并移除它（有序）
    items = {"A", "B", "C", "D", "E"};
    items.RemoveItem("C");
    // items 现在是：["A", "B", "D", "E"]

    // Clear：移除所有元素
    items.Clear();
    // items.Count() == 0
}
```

### 大小和容量

```c
void SizingArrays()
{
    array<int> data = new array<int>;

    // Reserve：预分配内部容量（不改变 Count）
    // 当你知道要添加多少元素时使用
    data.Reserve(100);
    // data.Count() == 0，但内部缓冲区已准备好容纳 100 个元素

    // Resize：改变 Count，用默认值填充新位置
    data.Resize(10);
    // data.Count() == 10，所有元素为 0

    // Resize 缩小则截断
    data.Resize(5);
    // data.Count() == 5
}
```

### 排序和打乱

```c
void OrderingArrays()
{
    array<int> numbers = {5, 2, 8, 1, 9, 3};

    // 升序排序
    numbers.Sort();
    // numbers: [1, 2, 3, 5, 8, 9]

    // 降序排序
    numbers.Sort(true);
    // numbers: [9, 8, 5, 3, 2, 1]

    // 反转数组
    numbers = {1, 2, 3, 4, 5};
    numbers.Invert();
    // numbers: [5, 4, 3, 2, 1]

    // 随机打乱
    numbers.ShuffleArray();
    // numbers: [3, 1, 5, 2, 4]（随机顺序）
}
```

### 复制

```c
void CopyingArrays()
{
    array<string> original = {"A", "B", "C"};

    // Copy：用另一个数组的副本替换所有内容
    array<string> copy = new array<string>;
    copy.Copy(original);
    // copy: ["A", "B", "C"]
    // 修改 copy 不会影响 original

    // InsertAll：追加（不替换）
    array<string> combined = {"X", "Y"};
    combined.InsertAll(original);
    // combined: ["X", "Y", "A", "B", "C"]
}
```

### 调试

```c
void DebuggingArrays()
{
    array<string> items = {"Bandage", "Morphine", "Saline"};

    // Debug：将所有元素打印到脚本日志
    items.Debug();
    // 输出：
    // [0] => Bandage
    // [1] => Morphine
    // [2] => Saline
}
```

---

## 迭代数组

### for 循环（基于索引）

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

### foreach（仅值）

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

### foreach（索引 + 值）

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

### 真实案例：查找最近的玩家

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

## 映射：`map<K,V>`

映射存储键值对。当你需要通过键查找值时使用它们——通过 UID 查找玩家数据、通过类名查找物品价格、通过角色名查找权限等。

### 创建

```c
void CreateMaps()
{
    // 标准创建
    map<string, int> prices = new map<string, int>;

    // 各种类型的映射
    map<string, float> multipliers = new map<string, float>;
    map<int, string> idToName = new map<int, string>;
    map<string, ref array<string>> categories = new map<string, ref array<string>>;
}
```

### 预定义的映射 Typedef

```c
typedef map<string, int>     TStringIntMap;
typedef map<string, string>  TStringStringMap;
typedef map<int, string>     TIntStringMap;
typedef map<string, float>   TStringFloatMap;
```

---

## 完整的映射方法参考

### 插入和更新

```c
void MapInsertUpdate()
{
    map<string, int> inventory = new map<string, int>;

    // Insert：添加新的键值对
    // 如果键是新的返回 true，如果已存在返回 false
    bool isNew = inventory.Insert("Bandage", 5);    // true（新键）
    isNew = inventory.Insert("Bandage", 10);         // false（键已存在，值未更新）
    // inventory["Bandage"] 仍然是 5！

    // Set：插入或更新（这是你通常需要的）
    inventory.Set("Bandage", 10);    // 现在 inventory["Bandage"] == 10
    inventory.Set("Morphine", 3);    // 添加新键
    inventory.Set("Morphine", 7);    // 更新现有键为 7
}
```

**关键区别：**`Insert()` **不会**更新现有键。`Set()` 会。当有疑问时，使用 `Set()`。

### 访问值

```c
void MapAccess()
{
    map<string, int> prices = new map<string, int>;
    prices.Set("AKM", 5000);
    prices.Set("M4A1", 7500);
    prices.Set("Mosin", 2000);

    // Get：返回值，如果键未找到则返回默认值（int 的默认值为 0）
    int akmPrice = prices.Get("AKM");         // 5000
    int falPrice = prices.Get("FAL");          // 0（未找到，返回默认值）

    // Find：安全访问，如果键存在返回 true 并设置 out 参数
    int price;
    bool found = prices.Find("M4A1", price);  // found == true, price == 7500
    bool notFound = prices.Find("SVD", price); // notFound == false, price 不变

    // Contains：检查键是否存在（不检索值）
    bool hasAKM = prices.Contains("AKM");     // true
    bool hasFAL = prices.Contains("FAL");     // false

    // Count：键值对数量
    int count = prices.Count();  // 3
}
```

### 移除

```c
void MapRemove()
{
    map<string, int> data = new map<string, int>;
    data.Set("a", 1);
    data.Set("b", 2);
    data.Set("c", 3);

    // Remove：按键移除
    data.Remove("b");
    // data 现在有：{"a": 1, "c": 3}

    // Clear：移除所有条目
    data.Clear();
    // data.Count() == 0
}
```

### 基于索引的访问

映射支持位置访问，但它是 `O(n)` 的——用于迭代，而不是频繁查找。

```c
void MapIndexAccess()
{
    map<string, int> data = new map<string, int>;
    data.Set("alpha", 1);
    data.Set("beta", 2);
    data.Set("gamma", 3);

    // 按内部索引访问（O(n)，顺序是插入顺序）
    for (int i = 0; i < data.Count(); i++)
    {
        string key = data.GetKey(i);
        int value = data.GetElement(i);
        Print(string.Format("%1 = %2", key, value));
    }
}
```

### 提取键和值

```c
void MapExtraction()
{
    map<string, int> prices = new map<string, int>;
    prices.Set("AKM", 5000);
    prices.Set("M4A1", 7500);
    prices.Set("Mosin", 2000);

    // 获取所有键作为数组
    array<string> keys = prices.GetKeyArray();
    // keys: ["AKM", "M4A1", "Mosin"]

    // 获取所有值作为数组
    array<int> values = prices.GetValueArray();
    // values: [5000, 7500, 2000]
}
```

### 真实案例：玩家跟踪

```c
class PlayerTracker
{
    protected ref map<string, vector> m_LastPositions;  // UID -> 位置
    protected ref map<string, float> m_PlayTime;        // UID -> 秒数

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

## 集合：`set<T>`

集合是类似于数组的有序集合，但语义面向基于值的操作（按值查找和移除）。它们比数组和映射使用得更少。

```c
void SetExamples()
{
    set<string> activeZones = new set<string>;

    // Insert：添加元素
    activeZones.Insert("NWAF");
    activeZones.Insert("Tisy");
    activeZones.Insert("Balota");

    // Find：返回索引或 -1
    int idx = activeZones.Find("Tisy");    // 1
    int missing = activeZones.Find("Zelenogorsk");  // -1

    // Get：按索引访问
    string first = activeZones.Get(0);     // "NWAF"

    // Count
    int count = activeZones.Count();       // 3

    // 按索引移除
    activeZones.Remove(0);
    // activeZones: ["Tisy", "Balota"]

    // RemoveItem：按值移除
    activeZones.RemoveItem("Tisy");
    // activeZones: ["Balota"]

    // Clear
    activeZones.Clear();
}
```

### 何时使用 Set 与 Array

实际上，大多数 DayZ 模组开发者对几乎所有情况都使用 `array<T>`，因为：
- `set<T>` 比 `array<T>` 方法更少
- `array<T>` 提供 `Find()` 用于搜索和 `RemoveItem()` 用于基于值的移除
- 你通常需要的 API 已经在 `array<T>` 上了

当你的代码在语义上表示一个集合（没有有意义的顺序，专注于成员测试）时，或者当你在原版 DayZ 代码中遇到它并需要与之交互时，使用 `set<T>`。

---

## 迭代映射

映射支持 `foreach` 以方便迭代：

### foreach 带键值

```c
void IterateMap()
{
    map<string, int> scores = new map<string, int>;
    scores.Set("Alice", 150);
    scores.Set("Bob", 230);
    scores.Set("Charlie", 180);

    // foreach 带键和值
    foreach (string name, int score : scores)
    {
        Print(string.Format("%1: %2 points", name, score));
    }
    // Alice: 150 points
    // Bob: 230 points
    // Charlie: 180 points
}
```

### 基于索引的 for 循环

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

## 嵌套集合

集合可以包含其他集合。当在映射中存储引用类型（如数组）时，使用 `ref` 管理所有权。

```c
class LootTable
{
    // 从类别名称到类名列表的映射
    protected ref map<string, ref array<string>> m_Categories;

    void LootTable()
    {
        m_Categories = new map<string, ref array<string>>;

        // 创建类别数组
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

## 最佳实践

- 使用前始终用 `new` 实例化集合——`array<string> items;` 是 `null`，不是空的。
- 更新时优先使用 `map.Set()` 而非 `map.Insert()`——`Insert` 静默忽略现有键。
- 在迭代期间移除元素时，使用反向 `for` 循环或构建单独的移除列表——永远不要在 `foreach` 内修改集合。
- 当你预先知道预期的元素数量时使用 `Reserve()`，以避免重复的内部重新分配。
- 用 `IsValidIndex()` 或 `Count() > 0` 检查守卫每次元素访问——越界访问会导致静默崩溃。

---

## 真实模组中的观察

> 通过研究专业 DayZ 模组源代码确认的模式。

| 模式 | 模组 | 细节 |
|---------|-----|--------|
| 反向 `for` 循环用于移除 | Expansion / COT | 移除过滤后的元素时始终从 `Count()-1` 迭代到 `0` |
| `map<string, ref ClassName>` 用于注册表 | Dabs Framework | 所有管理器注册表在映射值中使用 `ref` 保持对象存活 |
| 到处使用 `TStringArray` typedef | Vanilla / VPP | 配置解析、聊天消息和战利品表都使用 `TStringArray` 而非 `array<string>` |
| 访问前的空值 + 空检查守卫 | Expansion Market | 每个接收数组的函数都以 `if (!arr \|\| arr.Count() == 0) return;` 开头 |

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| `Remove(index)` 是"快速移除" | 应该只是删除元素 | 它先与最后一个元素交换，静默地重新排列数组 |
| `map.Insert()` 添加键 | 期望如果键存在则更新 | 如果键已存在则返回 `false` 且不做任何事 |
| `set<T>` 用于唯一集合 | 应该像数学集合一样行为 | 大多数模组开发者使用 `array<T>` 配合 `Find()` 替代，因为 `set` 方法更少 |

---

## 常见错误

### 1. `Remove` 与 `RemoveOrdered`：静默的错误

`Remove(index)` 很快但**改变了顺序**，通过与最后一个元素交换。如果你向前迭代并移除，这会导致跳过元素：

```c
// 错误：因为 Remove 交换顺序而跳过元素
array<int> nums = {1, 2, 3, 4, 5};
for (int i = 0; i < nums.Count(); i++)
{
    if (nums[i] % 2 == 0)
        nums.Remove(i);  // 移除索引 1 后，索引 1 处的元素现在是 "5"
                          // 我们跳到索引 2，错过了 "5"
}

// 好：移除时反向迭代
array<int> nums2 = {1, 2, 3, 4, 5};
for (int j = nums2.Count() - 1; j >= 0; j--)
{
    if (nums2[j] % 2 == 0)
        nums2.Remove(j);  // 安全：从末尾移除不影响较低的索引
}

// 也好：使用 RemoveOrdered 配合反向迭代以保持顺序
array<int> nums3 = {1, 2, 3, 4, 5};
for (int k = nums3.Count() - 1; k >= 0; k--)
{
    if (nums3[k] % 2 == 0)
        nums3.RemoveOrdered(k);
}
// nums3: [1, 3, 5] 保持原始顺序
```

### 2. 数组索引越界

Enforce Script 不会对越界访问抛出异常——它静默返回垃圾值或崩溃。始终检查边界。

```c
// 错误：没有边界检查
array<string> items = {"A", "B", "C"};
string fourth = items[3];  // 未定义行为：索引 3 不存在

// 好：检查边界
if (items.IsValidIndex(3))
{
    string fourth2 = items[3];
}

// 好：检查数量
if (items.Count() > 0)
{
    string last = items[items.Count() - 1];
}
```

### 3. 忘记创建集合

集合是对象，必须用 `new` 实例化：

```c
// 错误：空引用崩溃
array<string> items;
items.Insert("Test");  // 崩溃：items 是 null

// 好：先创建
array<string> items2 = new array<string>;
items2.Insert("Test");

// 也好：初始化列表自动创建
array<string> items3 = {"Test"};
```

### 4. 映射上的 `Insert` 与 `Set`

`Insert` 不更新现有键——它返回 `false` 并保留值不变：

```c
map<string, int> data = new map<string, int>;
data.Insert("key", 100);
data.Insert("key", 200);   // 返回 false，值仍然是 100！

// 使用 Set 更新
data.Set("key", 200);      // 现在值是 200
```

### 5. 在 foreach 期间修改集合

不要在使用 `foreach` 迭代集合时添加或移除元素。构建一个单独的要移除的元素列表，然后再移除它们。

```c
// 错误：在迭代期间修改
array<string> items = {"A", "B", "C", "D"};
foreach (string item : items)
{
    if (item == "B")
        items.RemoveItem(item);  // 未定义：使迭代器失效
}

// 好：收集然后移除
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

### 6. 空数组安全

在访问元素之前始终检查数组是否非空且非 null：

```c
string GetFirstItem(array<string> items)
{
    // 守卫子句：空值检查 + 空检查
    if (!items || items.Count() == 0)
        return "";

    return items[0];
}
```

---

## 练习

### 练习 1：物品栏计数器
创建一个函数，接受 `array<string>` 的物品类名（有重复），返回 `map<string, int>` 计算每种物品的数量。

示例：`{"Bandage", "Morphine", "Bandage", "Saline", "Bandage"}` 应产生 `{"Bandage": 3, "Morphine": 1, "Saline": 1}`。

### 练习 2：数组去重
编写函数 `array<string> RemoveDuplicates(array<string> input)`，返回一个移除了重复项的新数组，保留首次出现的顺序。

### 练习 3：排行榜
创建玩家名称到击杀数的 `map<string, int>`。编写函数来：
1. 为玩家添加击杀（如果需要则创建条目）
2. 获取按击杀数排序的前 N 名玩家（提示：提取到数组，排序）
3. 移除所有零击杀的玩家

### 练习 4：位置历史
创建一个类，存储玩家最近 10 个位置（使用数组的环形缓冲区）。它应该：
1. 添加新位置（达到容量时丢弃最旧的）
2. 返回所有存储位置的总移动距离
3. 返回平均位置

### 练习 5：双向查找
创建一个带有两个映射的类，允许双向查找：给定玩家 UID，找到其名称；给定名称，找到其 UID。实现 `Register(uid, name)`、`GetNameByUID(uid)`、`GetUIDByName(name)` 和 `Unregister(uid)`。

---

## 总结

| 集合 | 类型 | 用途 | 关键区别 |
|-----------|------|----------|----------------|
| 静态数组 | `int arr[5]` | 固定大小，编译时已知 | 不能调整大小，没有方法 |
| 动态数组 | `array<T>` | 通用有序列表 | 丰富的 API，可调整大小 |
| 映射 | `map<K,V>` | 键值查找 | 用 `Set()` 插入/更新 |
| 集合 | `set<T>` | 基于值的成员关系 | 比数组简单，不太常用 |

| 操作 | 方法 | 备注 |
|-----------|--------|-------|
| 添加到末尾 | `Insert(val)` | 返回索引 |
| 在位置添加 | `InsertAt(val, idx)` | 右移 |
| 快速移除 | `Remove(idx)` | 与最后一个交换，**无序** |
| 有序移除 | `RemoveOrdered(idx)` | 左移，保持顺序 |
| 按值移除 | `RemoveItem(val)` | 查找然后移除（有序） |
| 查找 | `Find(val)` | 返回索引或 -1 |
| 数量 | `Count()` | 元素数量 |
| 边界检查 | `IsValidIndex(idx)` | 返回布尔值 |
| 排序 | `Sort()` / `Sort(true)` | 升序 / 降序 |
| 随机 | `GetRandomElement()` | 返回随机值 |
| foreach | `foreach (T val : arr)` | 仅值 |
| 索引 foreach | `foreach (int i, T val : arr)` | 索引 + 值 |

---

[首页](../README.md) | [<< 上一章：变量与类型](01-variables-types.md) | **数组、映射与集合** | [下一章：类与继承 >>](03-classes-inheritance.md)
