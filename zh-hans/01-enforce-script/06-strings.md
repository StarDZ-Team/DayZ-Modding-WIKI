# 第 1.6 章：字符串操作

[首页](../README.md) | [<< 上一章：控制流](05-control-flow.md) | **字符串操作** | [下一章：数学与向量 >>](07-math-vectors.md)

---

## 简介

Enforce Script 中的字符串是**值类型**，类似于 `int` 或 `float`。它们按值传递和比较。`string` 类型拥有丰富的内置方法，用于搜索、截取、转换和格式化文本。本章是 DayZ 脚本中所有字符串操作的完整参考，包含来自 Mod 开发的实际示例。

---

## 字符串基础

```c
// 声明和初始化
string empty;                          // ""（默认为空字符串）
string greeting = "Hello, Chernarus!";
string combined = "Player: " + "John"; // 使用 + 拼接

// 字符串是值类型——赋值创建副本
string original = "DayZ";
string copy = original;
copy = "Arma";
Print(original); // 仍然是 "DayZ"
```

---

## 完整的字符串方法参考

### Length

返回字符串中的字符数。

```c
string s = "Hello";
int len = s.Length(); // 5

string empty = "";
int emptyLen = empty.Length(); // 0
```

### Substring

提取字符串的一部分。参数：`start`（起始索引）、`length`（字符数）。

```c
string s = "Hello World";
string word = s.Substring(6, 5);  // "World"
string first = s.Substring(0, 5); // "Hello"

// 从某个位置提取到末尾
string rest = s.Substring(6, s.Length() - 6); // "World"
```

### IndexOf

查找子字符串的第一次出现。返回索引，如果未找到则返回 `-1`。

```c
string s = "Hello World";
int idx = s.IndexOf("World");     // 6
int notFound = s.IndexOf("DayZ"); // -1
```

### IndexOfFrom

从给定索引开始查找第一次出现。

```c
string s = "one-two-one-two";
int first = s.IndexOf("one");        // 0
int second = s.IndexOfFrom(1, "one"); // 8
```

### LastIndexOf

查找子字符串的最后一次出现。

```c
string path = "profiles/MyMod/Players/player.json";
int lastSlash = path.LastIndexOf("/"); // 23
```

### Contains

如果字符串包含给定子字符串则返回 `true`。

```c
string chatMsg = "!teleport 100 0 200";
if (chatMsg.Contains("!teleport"))
{
    Print("检测到传送命令");
}
```

### Replace

替换所有出现的子字符串。**就地修改字符串**并返回替换次数。

```c
string s = "Hello World World";
int count = s.Replace("World", "DayZ");
// s 现在是 "Hello DayZ DayZ"
// count 是 2
```

### Split

按分隔符分割字符串并填充数组。数组应预先分配。

```c
string csv = "AK101,M4A1,UMP45,Mosin9130";
TStringArray weapons = new TStringArray;
csv.Split(",", weapons);
// weapons = ["AK101", "M4A1", "UMP45", "Mosin9130"]

// 按空格分割聊天命令
string chatLine = "!spawn Barrel_Green 5";
TStringArray parts = new TStringArray;
chatLine.Split(" ", parts);
// parts = ["!spawn", "Barrel_Green", "5"]
string command = parts.Get(0);   // "!spawn"
string itemType = parts.Get(1);  // "Barrel_Green"
int amount = parts.Get(2).ToInt(); // 5
```

### Join（静态方法）

使用分隔符连接字符串数组。

```c
TStringArray names = {"Alice", "Bob", "Charlie"};
string result = string.Join(", ", names);
// result = "Alice, Bob, Charlie"
```

### Format（静态方法）

使用编号占位符 `%1` 到 `%9` 构建字符串。这是 Enforce Script 中构建格式化字符串的主要方式。

```c
string name = "John";
int kills = 15;
float distance = 342.5;

string msg = string.Format("玩家 %1 有 %2 次击杀（最佳射击：%3米）", name, kills, distance);
// msg = "玩家 John 有 15 次击杀（最佳射击：342.5米）"
```

占位符是**从 1 开始**的（`%1` 是第一个参数，不是 `%0`）。最多可使用 9 个占位符。

```c
string log = string.Format("[%1] %2 :: %3", "MyMod", "INFO", "服务器已启动");
// log = "[MyMod] INFO :: 服务器已启动"
```

> **注意：** 没有 `printf` 风格的格式化（`%d`、`%f`、`%s`）。只有 `%1` 到 `%9`。

### ToLower

将字符串转换为小写。**就地修改** -- 不返回新字符串。

```c
string s = "Hello WORLD";
s.ToLower();
Print(s); // "hello world"
```

### ToUpper

将字符串转换为大写。**就地修改。**

```c
string s = "Hello World";
s.ToUpper();
Print(s); // "HELLO WORLD"
```

### Trim / TrimInPlace

移除前导和尾随空白字符。**就地修改。**

```c
string s = "  Hello World  ";
s.TrimInPlace();
Print(s); // "Hello World"
```

还有 `Trim()` 返回新的已修剪字符串（某些引擎版本中可用）：

```c
string raw = "  padded  ";
string clean = raw.Trim();
// clean = "padded"，raw 不变
```

### Get

获取指定索引处的单个字符，以字符串形式返回。

```c
string s = "DayZ";
string ch = s.Get(0); // "D"
string ch2 = s.Get(3); // "Z"
```

### Set

设置指定索引处的单个字符。

```c
string s = "DayZ";
s.Set(0, "N");
Print(s); // "NayZ"
```

### ToInt

将数字字符串转换为整数。

```c
string s = "42";
int num = s.ToInt(); // 42

string bad = "hello";
int zero = bad.ToInt(); // 0（非数字字符串返回 0）
```

### ToFloat

将数字字符串转换为浮点数。

```c
string s = "3.14";
float f = s.ToFloat(); // 3.14
```

### ToVector

将三个空格分隔的数字字符串转换为向量。

```c
string s = "100.5 0 200.3";
vector pos = s.ToVector(); // Vector(100.5, 0, 200.3)
```

---

## 字符串比较

字符串使用标准运算符按值比较。比较是**区分大小写**的，遵循字典（lexicographic）顺序。

```c
string a = "Apple";
string b = "Banana";
string c = "Apple";

bool equal    = (a == c);  // true
bool notEqual = (a != b);  // true
bool less     = (a < b);   // true（"Apple" < "Banana" 按字典序）
bool greater  = (b > a);   // true
```

### 不区分大小写的比较

没有内置的不区分大小写的比较方法。先将两个字符串转换为小写：

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

## 字符串拼接

使用 `+` 运算符拼接字符串。非字符串类型会自动转换。

```c
string name = "John";
int health = 75;
float distance = 42.5;

string msg = "玩家 " + name + " 有 " + health + " HP，距离 " + distance + "米";
// "玩家 John 有 75 HP，距离 42.5米"
```

对于复杂的格式化，优先使用 `string.Format()` 而非拼接——它更易读，且避免多次中间分配。

```c
// 推荐：
string msg = string.Format("玩家 %1 有 %2 HP，距离 %3米", name, health, distance);

// 不推荐：
string msg2 = "玩家 " + name + " 有 " + health + " HP，距离 " + distance + "米";
```

---

## 实际示例

### 解析聊天命令

```c
void ProcessChatMessage(string sender, string message)
{
    // 修剪空白
    message.TrimInPlace();

    // 必须以 ! 开头
    if (message.Length() == 0 || message.Get(0) != "!")
        return;

    // 分割为部分
    TStringArray parts = new TStringArray;
    message.Split(" ", parts);

    if (parts.Count() == 0)
        return;

    string command = parts.Get(0);
    command.ToLower();

    switch (command)
    {
        case "!heal":
            Print(string.Format("[CMD] %1 使用了 !heal", sender));
            break;

        case "!spawn":
            if (parts.Count() >= 2)
            {
                string itemType = parts.Get(1);
                int quantity = 1;
                if (parts.Count() >= 3)
                    quantity = parts.Get(2).ToInt();

                Print(string.Format("[CMD] %1 生成 %2 x%3", sender, itemType, quantity));
            }
            break;

        case "!tp":
            if (parts.Count() >= 4)
            {
                float x = parts.Get(1).ToFloat();
                float y = parts.Get(2).ToFloat();
                float z = parts.Get(3).ToFloat();
                vector pos = Vector(x, y, z);
                Print(string.Format("[CMD] %1 传送到 %2", sender, pos.ToString()));
            }
            break;
    }
}
```

### 格式化玩家名称显示

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
        result = result + " (管理员)";
    }

    return result;
}
// FormatPlayerTag("John", "DZR", true) => "[DZR] John (管理员)"
// FormatPlayerTag("Jane", "", false)   => "Jane"
```

### 构建文件路径

```c
string BuildPlayerFilePath(string steamId)
{
    return "$profile:MyMod/Players/" + steamId + ".json";
}
```

### 清理日志消息

```c
string SanitizeForLog(string input)
{
    string safe = input;
    safe.Replace("\n", " ");
    safe.Replace("\r", "");
    safe.Replace("\t", " ");

    // 截断到最大长度
    if (safe.Length() > 200)
    {
        safe = safe.Substring(0, 197) + "...";
    }

    return safe;
}
```

### 从路径中提取文件名

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

## 最佳实践

- 所有格式化输出使用 `string.Format()` 配合 `%1`..`%9` 占位符——它更易读，且避免 `+` 拼接的类型转换陷阱。
- 记住 `ToLower()`、`ToUpper()` 和 `Replace()` 就地修改字符串——如果需要保留原始值，请先复制字符串。
- 调用 `Split()` 前始终用 `new TStringArray` 分配目标数组——传递 null 数组会导致崩溃。
- 简单的子字符串检查使用 `Contains()`，仅在需要位置时使用 `IndexOf()`。
- 不区分大小写的比较需要复制两个字符串，对每个调用 `ToLower()` 后再比较——没有内置的不区分大小写比较方法。

---

## 在真实 Mod 中的观察

> 通过研究专业 DayZ Mod 源代码确认的模式。

| 模式 | Mod | 详情 |
|---------|-----|--------|
| `Split(" ", parts)` 用于聊天命令解析 | VPP / COT | 所有聊天命令系统按空格分割，然后对 `parts.Get(0)` 使用 switch |
| `string.Format` 配合 `[TAG]` 前缀 | Expansion / Dabs | 日志消息始终使用 `string.Format("[%1] %2", tag, msg)` 而非拼接 |
| `"$profile:ModName/"` 路径约定 | COT / Expansion | 用 `+` 构建的文件路径使用正斜杠和 `$profile:` 前缀以避免反斜杠问题 |
| 命令匹配前 `ToLower()` | VPP Admin | 在 `switch`/比较前将用户输入转为小写以处理混合大小写输入 |

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| `ToLower()` / `Replace()` 的返回值 | 期望返回新字符串（类似 C#） | 它们就地修改并返回 `void` 或计数——这是 bug 的常见来源 |
| `string.Format` 占位符 | `%d`、`%f`、`%s` 类似 C 的 printf | 只有 `%1` 到 `%9` 有效；C 风格的格式说明符会被静默忽略 |
| 字符串中的反斜杠 `\\` | 标准转义字符 | 在 JSON 上下文中可能破坏 DayZ 的 CParser——路径优先使用正斜杠 |

---

## 常见错误

| 错误 | 问题 | 修复方法 |
|---------|---------|-----|
| 期望 `ToLower()` 返回新字符串 | `ToLower()` 就地修改，返回 `void` | 先复制字符串，然后在副本上调用 `ToLower()` |
| 期望 `ToUpper()` 返回新字符串 | 同上——就地修改 | 先复制，然后在副本上调用 `ToUpper()` |
| 期望 `Replace()` 返回新字符串 | `Replace()` 就地修改，返回替换计数 | 如需保留原始值，先复制字符串 |
| 在 `string.Format()` 中使用 `%0` | 占位符从 1 开始（`%1` 到 `%9`） | 从 `%1` 开始 |
| 使用 `%d`、`%f`、`%s` 格式说明符 | C 风格格式说明符不起作用 | 使用 `%1`、`%2` 等 |
| 比较字符串时不规范化大小写 | `"Hello" != "hello"` | 比较前对两者调用 `ToLower()` |
| 将字符串视为引用类型 | 字符串是值类型；赋值创建副本 | 这通常没问题——只需知道修改副本不影响原始值 |
| 在 `Split()` 前忘记创建数组 | 对 null 数组调用 `Split()` 会崩溃 | 始终：`TStringArray parts = new TStringArray;` 然后再 `Split()` |

---

## 快速参考

```c
// 长度
int len = s.Length();

// 搜索
int idx = s.IndexOf("sub");
int idx = s.IndexOfFrom(startIdx, "sub");
int idx = s.LastIndexOf("sub");
bool has = s.Contains("sub");

// 提取
string sub = s.Substring(start, length);
string ch  = s.Get(index);

// 修改（就地）
s.Set(index, "x");
int count = s.Replace("old", "new");
s.ToLower();
s.ToUpper();
s.TrimInPlace();

// 分割与连接
TStringArray parts = new TStringArray;
s.Split(delimiter, parts);
string joined = string.Join(sep, parts);

// 格式化（静态，%1-%9 占位符）
string msg = string.Format("你好 %1，你有 %2 个物品", name, count);

// 转换
int n    = s.ToInt();
float f  = s.ToFloat();
vector v = s.ToVector();

// 比较（区分大小写，字典序）
bool eq = (a == b);
bool lt = (a < b);
```

---

[<< 1.5：控制流](05-control-flow.md) | [首页](../README.md) | [1.7：数学与向量 >>](07-math-vectors.md)
