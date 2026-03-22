# Enforce Script 速查表

[首页](./README.md) | **速查表**

---

> DayZ Enforce Script 单页快速参考。建议收藏本页。

---

## 类型

| 类型 | 描述 | 默认值 | 示例 |
|------|------|--------|------|
| `int` | 32位有符号整数 | `0` | `int x = 42;` |
| `float` | 32位浮点数 | `0.0` | `float f = 3.14;` |
| `bool` | 布尔值 | `false` | `bool b = true;` |
| `string` | 不可变值类型 | `""` | `string s = "hello";` |
| `vector` | 3分量浮点型 (x,y,z) | `"0 0 0"` | `vector v = "1 2 3";` |
| `typename` | 类型引用 | `null` | `typename t = PlayerBase;` |
| `Class` | 所有引用类型的根类 | `null` | — |
| `void` | 无返回值 | — | — |

**限制：** `int.MAX` = 2147483647, `int.MIN` = -2147483648, `float.MAX`, `float.MIN`

---

## 数组方法 (`array<T>`)

| 方法 | 返回值 | 备注 |
|------|--------|------|
| `Insert(item)` | `int`（索引） | 追加 |
| `InsertAt(item, idx)` | `void` | 在指定位置插入 |
| `Get(idx)` / `arr[idx]` | `T` | 按索引访问 |
| `Set(idx, item)` | `void` | 替换指定索引的元素 |
| `Find(item)` | `int` | 返回索引或 -1 |
| `Count()` | `int` | 元素数量 |
| `IsValidIndex(idx)` | `bool` | 边界检查 |
| `Remove(idx)` | `void` | **无序**（与最后一个元素交换！） |
| `RemoveOrdered(idx)` | `void` | 保持顺序 |
| `RemoveItem(item)` | `void` | 查找并移除（有序） |
| `Clear()` | `void` | 移除所有元素 |
| `Sort()` / `Sort(true)` | `void` | 升序 / 降序 |
| `ShuffleArray()` | `void` | 随机打乱 |
| `Invert()` | `void` | 反转 |
| `GetRandomElement()` | `T` | 随机选取 |
| `InsertAll(other)` | `void` | 追加另一个数组的所有元素 |
| `Copy(other)` | `void` | 替换为副本 |
| `Resize(n)` | `void` | 调整大小（填充默认值） |
| `Reserve(n)` | `void` | 预分配容量 |

**类型别名：** `TStringArray`, `TIntArray`, `TFloatArray`, `TBoolArray`, `TVectorArray`

---

## Map 方法 (`map<K,V>`)

| 方法 | 返回值 | 备注 |
|------|--------|------|
| `Insert(key, val)` | `bool` | 添加新条目 |
| `Set(key, val)` | `void` | 插入或更新 |
| `Get(key)` | `V` | 缺失时返回默认值 |
| `Find(key, out val)` | `bool` | 安全获取 |
| `Contains(key)` | `bool` | 检查是否存在 |
| `Remove(key)` | `void` | 按键移除 |
| `Count()` | `int` | 条目数量 |
| `GetKey(idx)` | `K` | 按索引获取键（O(n)） |
| `GetElement(idx)` | `V` | 按索引获取值（O(n)） |
| `GetKeyArray()` | `array<K>` | 所有键 |
| `GetValueArray()` | `array<V>` | 所有值 |
| `Clear()` | `void` | 移除所有条目 |

---

## Set 方法 (`set<T>`)

| 方法 | 返回值 |
|------|--------|
| `Insert(item)` | `int`（索引） |
| `Find(item)` | `int`（索引或 -1） |
| `Get(idx)` | `T` |
| `Remove(idx)` | `void` |
| `RemoveItem(item)` | `void` |
| `Count()` | `int` |
| `Clear()` | `void` |

---

## 类语法

```c
class MyClass extends BaseClass
{
    protected int m_Value;                  // 字段
    private ref array<string> m_List;       // 拥有的引用

    void MyClass() { m_List = new array<string>; }  // 构造函数
    void ~MyClass() { }                              // 析构函数

    override void OnInit() { super.OnInit(); }       // 重写
    static int GetCount() { return 0; }              // 静态方法
};
```

**访问控制：** `private` | `protected` | （默认为 public）
**修饰符：** `static` | `override` | `ref` | `const` | `out` | `notnull`
**Modded：** `modded class MissionServer { override void OnInit() { super.OnInit(); } }`

---

## 控制流

```c
// if / else if / else
if (a > 0) { } else if (a == 0) { } else { }

// for
for (int i = 0; i < count; i++) { }

// foreach（值）
foreach (string item : myArray) { }

// foreach（索引 + 值）
foreach (int i, string item : myArray) { }

// foreach（map：键 + 值）
foreach (string key, int val : myMap) { }

// while
while (condition) { }

// switch（没有穿透！）
switch (val) { case 0: Print("zero"); break; default: break; }
```

---

## 字符串方法

| 方法 | 返回值 | 示例 |
|------|--------|------|
| `s.Length()` | `int` | `"hello".Length()` = 5 |
| `s.Substring(start, len)` | `string` | `"hello".Substring(1,3)` = `"ell"` |
| `s.IndexOf(sub)` | `int` | 未找到返回 -1 |
| `s.LastIndexOf(sub)` | `int` | 从末尾搜索 |
| `s.Contains(sub)` | `bool` | |
| `s.Replace(old, new)` | `int` | 原地修改，返回替换次数 |
| `s.ToLower()` | `void` | **原地修改！** |
| `s.ToUpper()` | `void` | **原地修改！** |
| `s.TrimInPlace()` | `void` | **原地修改！** |
| `s.Split(delim, out arr)` | `void` | 分割为 TStringArray |
| `s.Get(idx)` | `string` | 单个字符 |
| `s.Set(idx, ch)` | `void` | 替换字符 |
| `s.ToInt()` | `int` | 解析整数 |
| `s.ToFloat()` | `float` | 解析浮点数 |
| `s.ToVector()` | `vector` | 解析 `"1 2 3"` |
| `string.Format(fmt, ...)` | `string` | `%1`..`%9` 占位符 |
| `string.Join(sep, arr)` | `string` | 连接数组元素 |

---

## 数学方法

| 方法 | 描述 |
|------|------|
| `Math.RandomInt(min, max)` | `[min, max)` 最大值不包含 |
| `Math.RandomIntInclusive(min, max)` | `[min, max]` |
| `Math.RandomFloat01()` | `[0, 1]` |
| `Math.RandomBool()` | 随机 true/false |
| `Math.Round(f)` / `Floor(f)` / `Ceil(f)` | 四舍五入 |
| `Math.AbsFloat(f)` / `AbsInt(i)` | 绝对值 |
| `Math.Clamp(val, min, max)` | 限制在范围内 |
| `Math.Min(a, b)` / `Max(a, b)` | 最小/最大值 |
| `Math.Lerp(a, b, t)` | 线性插值 |
| `Math.InverseLerp(a, b, val)` | 反向线性插值 |
| `Math.Pow(base, exp)` / `Sqrt(f)` | 幂/根 |
| `Math.Sin(r)` / `Cos(r)` / `Tan(r)` | 三角函数（弧度） |
| `Math.Atan2(y, x)` | 从分量计算角度 |
| `Math.NormalizeAngle(deg)` | 归一化到 0-360 |
| `Math.SqrFloat(f)` / `SqrInt(i)` | 平方 |

**常量：** `Math.PI`, `Math.PI2`, `Math.PI_HALF`, `Math.DEG2RAD`, `Math.RAD2DEG`

**向量：** `vector.Distance(a,b)`, `vector.DistanceSq(a,b)`, `vector.Direction(a,b)`, `vector.Dot(a,b)`, `vector.Lerp(a,b,t)`, `v.Length()`, `v.Normalized()`

---

## 常用模式

### 安全向下转型

```c
PlayerBase player;
if (Class.CastTo(player, obj))
{
    player.DoSomething();
}
```

### 内联转型

```c
PlayerBase player = PlayerBase.Cast(obj);
if (player) player.DoSomething();
```

### 空值保护

```c
if (!player) return;
if (!player.GetIdentity()) return;
string name = player.GetIdentity().GetName();
```

### 检查 IsAlive（需要 EntityAI）

```c
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive()) { }
```

### Foreach Map 迭代

```c
foreach (string key, int value : myMap)
{
    Print(key + " = " + value.ToString());
}
```

### 枚举转换

```c
string name = typename.EnumToString(EDamageState, state);
int val; typename.StringToEnum(EDamageState, "RUINED", val);
```

### 位标志

```c
int flags = FLAG_A | FLAG_B;       // 组合
if (flags & FLAG_A) { }           // 测试
flags = flags & ~FLAG_B;          // 移除
```

---

## 不存在的特性

| 缺失特性 | 替代方案 |
|----------|----------|
| 三元运算符 `? :` | `if/else` |
| `do...while` | `while(true) { ... break; }` |
| `try/catch` | 保护子句 + 提前返回 |
| 多重继承 | 单继承 + 组合 |
| 运算符重载 | 命名方法（除了 `[]` 通过 Get/Set） |
| Lambda | 命名方法 |
| `nullptr` | `null` / `NULL` |
| 字符串中的 `\\` / `\"` | 避免使用（CParser 会崩溃） |
| `#include` | config.cpp `files[]` |
| 命名空间 | 名称前缀 (`MyMod_`, `VPP_`) |
| 接口 / 抽象 | 空基类方法 |
| switch 穿透 | 每个 case 独立 |
| `#define` 值 | 使用 `const` |
| 默认参数表达式 | 仅限字面量/NULL |
| 可变参数 | `string.Format` 或数组 |
| else-if 中重新声明变量 | 每个分支使用唯一名称 |

---

## 控件创建（编程方式）

```c
// 获取工作区
WorkspaceWidget ws = GetGame().GetWorkspace();

// 从布局创建
Widget root = ws.CreateWidgets("MyMod/gui/layouts/MyPanel.layout");

// 查找子控件
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
if (title) title.SetText("Hello World");

// 显示/隐藏
root.Show(true);
root.Show(false);
```

---

## RPC 模式

**注册（服务端）：**
```c
// 在 3_Game 或 4_World 初始化中：
GetGame().RPCSingleParam(null, MY_RPC_ID, null, true, identity);  // 引擎 RPC

// 或使用字符串路由 RPC（MyRPC / CF）：
GetRPCManager().AddRPC("MyMod", "RPC_Handler", this, 2);  // CF
MyRPC.Register("MyMod", "MyRoute", this, MyRPCSide.SERVER);  // MyMod
```

**发送（客户端到服务端）：**
```c
Param2<string, int> data = new Param2<string, int>("itemName", 5);
GetGame().RPCSingleParam(null, MY_RPC_ID, data, true);
```

**接收（服务端处理器）：**
```c
void RPC_Handler(CallType type, ParamsReadContext ctx, PlayerIdentity sender, Object target)
{
    if (type != CallType.Server) return;
    if (!sender) return;

    Param2<string, int> data;
    if (!ctx.Read(data)) return;

    string itemName = data.param1;
    int quantity = data.param2;
    // 处理...
}
```

---

## 错误处理

```c
ErrorEx("message");                              // 默认 ERROR 严重级别
ErrorEx("info", ErrorExSeverity.INFO);           // 信息
ErrorEx("warning", ErrorExSeverity.WARNING);     // 警告
Print("debug output");                           // 脚本日志
string stack = DumpStackString();                // 获取调用栈
```

---

## 文件 I/O

```c
// 路径："$profile:", "$saves:", "$mission:", "$CurrentDir:"
bool exists = FileExist("$profile:MyMod/config.json");
MakeDirectory("$profile:MyMod");

// JSON
MyConfig cfg = new MyConfig();
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);  // 返回 VOID！
JsonFileLoader<MyConfig>.JsonSaveFile(path, cfg);

// 原始文件
FileHandle fh = OpenFile(path, FileMode.WRITE);
if (fh != 0) { FPrintln(fh, "line"); CloseFile(fh); }
```

---

## 对象创建

```c
// 基础
Object obj = GetGame().CreateObject("AK101", pos, false, false, true);

// 带标志
Object obj = GetGame().CreateObjectEx("Barrel_Green", pos, ECE_PLACE_ON_SURFACE);

// 在玩家背包中
player.GetInventory().CreateInInventory("BandageDressing");

// 作为附件
weapon.GetInventory().CreateAttachment("ACOGOptic");

// 删除
GetGame().ObjectDelete(obj);
```

---

## 常用全局函数

```c
GetGame()                          // CGame 实例
GetGame().GetPlayer()              // 本地玩家（仅客户端，服务端为 null！）
GetGame().GetPlayers(out arr)      // 所有玩家（服务端）
GetGame().GetWorld()               // World 实例
GetGame().GetTickTime()            // 服务器时间（float）
GetGame().GetWorkspace()           // UI 工作区
GetGame().SurfaceY(x, z)          // 地形高度
GetGame().IsServer()               // 服务端返回 true
GetGame().IsClient()               // 客户端返回 true
GetGame().IsMultiplayer()          // 多人游戏返回 true
```

---

*完整文档：[DayZ 模组制作 Wiki](./README.md) | [常见陷阱](01-enforce-script/12-gotchas.md) | [错误处理](01-enforce-script/11-error-handling.md)*
