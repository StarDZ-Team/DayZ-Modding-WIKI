# 第 1.13 章：函数与方法

[首页](../README.md) | [<< 上一章：注意事项](12-gotchas.md) | **函数与方法**

---

## 简介

函数是 Enforce Script 中行为的基本单元。模组执行的每个操作——生成物品、检查玩家生命值、发送 RPC、绘制 UI 元素——都存在于函数中。理解如何声明它们、传入和传出数据、以及使用引擎的特殊修饰符对于编写正确的 DayZ 模组至关重要。

本章深入涵盖函数机制：声明语法、参数传递模式、返回值、默认参数、proto native 绑定、静态与实例方法、重写、`thread` 关键字和 `event` 关键字。如果第 1.3 章（类）教了你函数在哪里存在，本章教你它们如何工作。

---

## 目录

- [函数声明语法](#函数声明语法)
  - [独立函数](#独立函数)
  - [实例方法](#实例方法)
  - [静态方法](#静态方法)
- [参数传递模式](#参数传递模式)
  - [按值传递（默认）](#按值传递默认)
  - [out 参数](#out-参数)
  - [inout 参数](#inout-参数)
  - [notnull 参数](#notnull-参数)
- [返回值](#返回值)
- [默认参数值](#默认参数值)
- [Proto Native 方法（引擎绑定）](#proto-native-方法引擎绑定)
- [静态与实例方法](#静态与实例方法)
- [方法重写](#方法重写)
- [方法重载（不支持）](#方法重载不支持)
- [event 关键字](#event-关键字)
- [线程方法（协程）](#线程方法协程)
- [使用 CallLater 延迟调用](#使用-calllater-延迟调用)
- [最佳实践](#最佳实践)
- [真实模组中的观察](#真实模组中的观察)
- [理论与实践](#理论与实践)
- [常见错误](#常见错误)
- [快速参考表](#快速参考表)

---

## 函数声明语法

每个函数都有返回类型、名称和参数列表。函数体用花括号包围。

```
ReturnType FunctionName(ParamType paramName, ...)
{
    // 函数体
}
```

### 独立函数

独立（全局）函数存在于任何类之外。它们在 DayZ 模组开发中很罕见——几乎所有代码都在类内——但你会在原版脚本中遇到一些。

```c
// 独立函数（全局作用域）
void PrintPlayerCount()
{
    int count = GetGame().GetPlayers().Count();
    Print(string.Format("Players online: %1", count));
}

// 带返回值的独立函数
string FormatTimestamp(int hours, int minutes)
{
    return string.Format("%1:%2", hours.ToStringLen(2), minutes.ToStringLen(2));
}
```

原版引擎定义了几个独立的工具函数：

```c
// 来自 enscript.c——字符串表达式辅助
string String(string s)
{
    return s;
}
```

### 实例方法

DayZ 模组中的绝大多数函数是实例方法——它们属于一个类并操作该实例的数据。

```c
class LootSpawner
{
    protected vector m_Position;
    protected float m_Radius;

    void SetPosition(vector pos)
    {
        m_Position = pos;
    }

    float GetRadius()
    {
        return m_Radius;
    }

    bool IsNearby(vector testPos)
    {
        return vector.Distance(m_Position, testPos) <= m_Radius;
    }
}
```

实例方法可以隐式访问 `this`——对当前对象的引用。你很少需要显式写 `this.`，但当参数有类似名称时，它可以帮助消除歧义。

### 静态方法

静态方法属于类本身，而不是任何实例。通过 `ClassName.Method()` 调用它们。它们不能访问实例字段或 `this`。

```c
class MathHelper
{
    static float Clamp01(float value)
    {
        if (value < 0) return 0;
        if (value > 1) return 1;
        return value;
    }

    static float Lerp(float a, float b, float t)
    {
        return a + (b - a) * Clamp01(t);
    }
}

// 用法：
float result = MathHelper.Lerp(0, 100, 0.75);  // 75.0
```

静态方法非常适合工具函数、工厂方法和单例访问器。DayZ 的原版代码广泛使用它们：

```c
// 来自 DamageSystem（3_game/damagesystem.c）
class DamageSystem
{
    static bool GetDamageZoneMap(EntityAI entity, out DamageZoneMap zoneMap)
    {
        // ...
    }

    static string GetDamageDisplayName(EntityAI entity, string zone)
    {
        // ...
    }
}
```

---

## 参数传递模式

Enforce Script 支持四种参数传递模式。理解它们至关重要，因为错误的模式会导致数据永远无法到达调用者的静默错误。

### 按值传递（默认）

当没有指定修饰符时，参数是**按值传递**的。对于原始类型（`int`、`float`、`bool`、`string`、`vector`），会创建一个副本。函数内部的修改不影响调用者的变量。

```c
void DoubleValue(int x)
{
    x = x * 2;  // 仅修改本地副本
}

// 用法：
int n = 5;
DoubleValue(n);
Print(n);  // 仍然是 5——原始值未改变
```

对于类类型（对象），按值传递仍然传递**对象的引用**——但引用本身是复制的。你可以修改对象的字段，但不能重新分配引用指向不同的对象。

```c
void RenameZone(SpawnZone zone)
{
    zone.SetName("NewName");  // 这有效——修改同一个对象
    zone = null;              // 这不影响调用者的变量
}
```

### out 参数

`out` 关键字将参数标记为**仅输出**。函数向其写入值，调用者接收该值。参数的初始值是未定义的——不要在写入之前读取它。

```c
// out 参数——函数填充值
bool TryFindPlayer(string name, out PlayerBase player)
{
    array<Man> players = new array<Man>;
    GetGame().GetPlayers(players);

    for (int i = 0; i < players.Count(); i++)
    {
        PlayerBase pb = PlayerBase.Cast(players[i]);
        if (pb && pb.GetIdentity() && pb.GetIdentity().GetName() == name)
        {
            player = pb;
            return true;
        }
    }

    player = null;
    return false;
}

// 用法：
PlayerBase result;
if (TryFindPlayer("John", result))
{
    Print(result.GetIdentity().GetName());
}
```

原版脚本广泛使用 `out` 用于引擎到脚本的数据流：

```c
// 来自 DayZPlayer（3_game/dayzplayer.c）
proto native void GetCurrentCameraTransform(out vector position, out vector direction, out vector rotation);

// 来自 AIWorld（3_game/ai/aiworld.c）
proto native bool RaycastNavMesh(vector from, vector to, PGFilter pgFilter, out vector hitPos, out vector hitNormal);

// 多个 out 参数用于视角限制
proto void GetLookLimits(out float pDown, out float pUp, out float pLeft, out float pRight);
```

### inout 参数

`inout` 关键字将参数标记为函数**既读取又写入**的。调用者的值在函数内可用，任何修改在之后对调用者可见。

```c
// inout——函数读取当前值并修改它
void ClampHealth(inout float health)
{
    if (health < 0)
        health = 0;
    if (health > 100)
        health = 100;
}

// 用法：
float hp = 150.0;
ClampHealth(hp);
Print(hp);  // 100.0
```

原版中 `inout` 的示例：

```c
// 来自 enmath.c——平滑函数读取和写入速度
proto static float SmoothCD(float val, float target, inout float velocity[],
    float smoothTime, float maxVelocity, float dt);

// 来自 enscript.c——解析修改输入字符串
proto int ParseStringEx(inout string input, string token);

// 来自 Pawn（3_game/entities/pawn.c）——变换被读取和修改
event void GetTransform(inout vector transform[4])
```

### notnull 参数

`notnull` 关键字告诉编译器（和引擎）参数不能为 `null`。如果传递了空值，游戏会以错误崩溃，而不是静默地继续处理无效数据。

```c
void ProcessEntity(notnull EntityAI entity)
{
    // 可以安全使用 entity 而无需空值检查——引擎保证了它
    string name = entity.GetType();
    Print(name);
}
```

原版在引擎接口函数中大量使用 `notnull`：

```c
// 来自 envisual.c
proto native void SetBone(notnull IEntity ent, int bone, vector angles, vector trans, float scale);
proto native bool GetBoneMatrix(notnull IEntity ent, int bone, vector mat[4]);

// 来自 DamageSystem
static bool GetDamageZoneFromComponentName(notnull EntityAI entity, string component, out string damageZone);
```

你可以将 `notnull` 与 `out` 组合：

```c
// 来自 universaltemperaturesourcelambdabaseimpl.c
override void DryItemsInVicinity(UniversalTemperatureSourceSettings pSettings, vector position,
    out notnull array<EntityAI> nearestObjects);
```

---

## 返回值

### 单一返回值

函数返回单个值。返回类型在函数名之前声明。

```c
float GetDistanceBetween(vector a, vector b)
{
    return vector.Distance(a, b);
}
```

### void（无返回值）

对执行操作但不返回数据的函数使用 `void`。

```c
void LogMessage(string msg)
{
    Print(string.Format("[MyMod] %1", msg));
}
```

### 返回对象

当函数返回对象时，它返回一个**引用**（不是副本）。调用者收到指向内存中同一对象的指针。

```c
EntityAI SpawnItem(string className, vector pos)
{
    EntityAI item = EntityAI.Cast(GetGame().CreateObject(className, pos, false, false, true));
    return item;  // 调用者获得同一对象的引用
}
```

### 通过 out 参数返回多个值

当你需要返回多个值时，使用 `out` 参数。这是 DayZ 脚本中的通用模式。

```c
void GetTimeComponents(float totalSeconds, out int hours, out int minutes, out int seconds)
{
    hours = (int)(totalSeconds / 3600);
    minutes = (int)((totalSeconds % 3600) / 60);
    seconds = (int)(totalSeconds % 60);
}

// 用法：
int h, m, s;
GetTimeComponents(3725, h, m, s);
// h == 1, m == 2, s == 5
```

### 注意：JsonFileLoader 返回 void

一个常见的陷阱：`JsonFileLoader<T>.JsonLoadFile()` 返回 `void`，而不是加载的对象。你必须传递一个预先创建的对象作为 `ref` 参数。

```c
// 错误——不会编译
MyConfig config = JsonFileLoader<MyConfig>.JsonLoadFile(path);

// 正确——传递 ref 对象
MyConfig config = new MyConfig;
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
```

---

## 默认参数值

Enforce Script 支持参数的默认值。带默认值的参数必须在所有必需参数**之后**。

```c
void SpawnItem(string className, vector pos, float quantity = -1, bool withAttachments = true)
{
    // quantity 默认为 -1（满），withAttachments 默认为 true
    EntityAI item = EntityAI.Cast(GetGame().CreateObject(className, pos, false, false, true));
    if (item && quantity >= 0)
        item.SetQuantity(quantity);
}

// 以下所有调用都是有效的：
SpawnItem("AKM", myPos);                   // 使用两个默认值
SpawnItem("AKM", myPos, 0.5);             // 自定义数量，默认附件
SpawnItem("AKM", myPos, -1, false);        // 必须指定数量才能到达附件
```

### 原版中的默认值

原版脚本广泛使用默认参数：

```c
// 来自 Weather（3_game/weather.c）
proto native void Set(float forecast, float time = 0, float minDuration = 0);
proto native void SetDynVolFogDistanceDensity(float value, float time = 0);

// 来自 UAInput（3_game/inputapi/uainput.c）
proto native float SyncedValue_ID(int action, bool check_focus = true);
proto native bool SyncedPress(string action, bool check_focus = true);

// 来自 DbgUI（1_core/proto/dbgui.c）
static bool FloatOverride(string id, inout float value, float min, float max,
    int precision = 1000, bool sameLine = true);

// 来自 InputManager（2_gamelib/inputmanager.c）
proto native external bool ActivateAction(string actionName, int duration = 0);
```

### 限制

1. **仅字面值**——你不能使用表达式、函数调用或其他变量作为默认值：

```c
// 错误——默认值中不能有表达式
void MyFunc(float speed = Math.PI * 2)  // 编译错误

// 正确——使用字面量
void MyFunc(float speed = 6.283)
```

2. **没有命名参数**——你不能按名称跳过参数。要设置第三个默认值，你必须提供所有前面的参数：

```c
void Configure(int a = 1, int b = 2, int c = 3) {}

Configure(1, 2, 10);  // 必须指定 a 和 b 才能设置 c
// 没有类似 Configure(c: 10) 的语法
```

3. **类类型的默认值限制为 `null` 或 `NULL`：**

```c
void DoWork(EntityAI target = null, string name = "")
{
    if (!target) return;
    // ...
}
```

---

## Proto Native 方法（引擎绑定）

Proto native 方法在脚本中声明但**在 C++ 引擎中实现**。它们形成了你的 Enforce Script 代码和 DayZ 游戏引擎之间的桥梁。你像普通方法一样调用它们，但无法看到或修改它们的实现。

### 修饰符参考

| 修饰符 | 含义 | 示例 |
|----------|---------|---------|
| `proto native` | 在 C++ 引擎代码中实现 | `proto native void SetPosition(vector pos);` |
| `proto native owned` | 返回调用者拥有（管理内存）的值 | `proto native owned string GetType();` |
| `proto native external` | 在另一个模块中定义 | `proto native external bool AddSettings(typename cls);` |
| `proto volatile` | 有副作用；编译器不能优化掉 | `proto volatile int Call(Class inst, string fn, void parm);` |
| `proto`（不带 `native`） | 内部函数，可能是也可能不是原生的 | `proto int ParseString(string input, out string tokens[]);` |

### proto native

最常见的修饰符。这些是直接的引擎调用。

```c
// 设置/获取位置（Object）
proto native void SetPosition(vector pos);
proto native vector GetPosition();

// AI 寻路（AIWorld）
proto native bool FindPath(vector from, vector to, PGFilter pgFilter, out TVectorArray waypoints);
proto native bool SampleNavmeshPosition(vector position, float maxDistance, PGFilter pgFilter,
    out vector sampledPosition);
```

### proto native owned

`owned` 修饰符意味着返回值由引擎分配，**所有权转移给脚本**。这主要用于 `string` 返回值，引擎创建新字符串，脚本的垃圾回收器之后必须释放。

```c
// 来自 Class（enscript.c）——返回脚本现在拥有的字符串
proto native owned external string ClassName();

// 来自 Widget（enwidgets.c）
proto native owned string GetName();
proto native owned string GetTypeName();
proto native owned string GetStyleName();

// 来自 Object（3_game/entities/object.c）
proto native owned string GetLODName(LOD lod);
proto native owned string GetActionComponentName(int componentIndex, string geometry = "");
```

### proto native external

`external` 修饰符表示函数在不同的脚本模块中定义。这允许跨模块方法声明。

```c
// 来自 Settings（2_gamelib/settings.c）
proto native external bool AddSettings(typename settingsClass);

// 来自 InputManager（2_gamelib/inputmanager.c）
proto native external bool RegisterAction(string actionName);
proto native external float LocalValue(string actionName);
proto native external bool ActivateAction(string actionName, int duration = 0);

// 来自 Workbench API（1_core/workbenchapi.c）
proto native external bool SetOpenedResource(string filename);
proto native external bool Save();
```

### proto volatile

`volatile` 修饰符告诉编译器函数可能有**副作用**或可能**回调脚本**（创建重入）。编译器在调用这些函数时必须保留完整上下文。

```c
// 来自 ScriptModule（enscript.c）——可能调用脚本的动态函数调用
proto volatile int Call(Class inst, string function, void parm);
proto volatile int CallFunction(Class inst, string function, out void returnVal, void parm);

// 来自 typename（enconvert.c）——动态创建新实例
proto volatile Class Spawn();

// 让出控制
proto volatile void Idle();
```

### 调用 Proto Native 方法

像调用其他方法一样调用它们。关键规则：**永远不要尝试重写或重新定义 proto native 方法**。它们是固定的引擎绑定。

```c
// 调用 proto native 方法——与脚本方法没有区别
Object obj = GetGame().CreateObject("AKM", pos, false, false, true);
vector position = obj.GetPosition();
string typeName = obj.GetType();     // owned 字符串——返回给你
obj.SetPosition(newPos);             // native void——无返回值
```

---

## 静态与实例方法

### 何时使用静态

当函数不需要任何实例数据时使用静态方法：

```c
class StringUtils
{
    // 纯工具——不需要状态
    static bool IsNullOrEmpty(string s)
    {
        return s == "" || s.Length() == 0;
    }

    static string PadLeft(string s, int totalWidth, string padChar = "0")
    {
        while (s.Length() < totalWidth)
            s = padChar + s;
        return s;
    }
}
```

**常见的静态用途：**
- **工具函数**——数学辅助、字符串格式化、验证检查
- **工厂方法**——返回新配置实例的 `Create()`
- **单例访问器**——返回单个实例的 `GetInstance()`
- **常量/查找**——用于静态数据表的 `Init()` + `Cleanup()`

### 单例模式（静态 + 实例）

许多 DayZ 管理器结合了静态和实例：

```c
class NotificationManager
{
    private static ref NotificationManager s_Instance;

    static NotificationManager GetInstance()
    {
        if (!s_Instance)
            s_Instance = new NotificationManager;
        return s_Instance;
    }

    // 实际工作的实例方法
    void ShowNotification(string text, float duration)
    {
        // ...
    }
}

// 用法：
NotificationManager.GetInstance().ShowNotification("Hello", 5.0);
```

### 何时使用实例

当函数需要访问对象状态时使用实例方法：

```c
class SupplyDrop
{
    protected vector m_DropPosition;
    protected float m_DropRadius;
    protected ref array<string> m_LootTable;

    // 需要 m_DropPosition、m_DropRadius——必须是实例方法
    bool IsInDropZone(vector testPos)
    {
        return vector.Distance(m_DropPosition, testPos) <= m_DropRadius;
    }

    // 需要 m_LootTable——必须是实例方法
    string GetRandomItem()
    {
        return m_LootTable.GetRandomElement();
    }
}
```

---

## 方法重写

当子类需要更改父方法的行为时，使用 `override` 关键字。

### 基本重写

```c
class BaseModule
{
    void OnInit()
    {
        Print("[BaseModule] Initialized");
    }

    void OnUpdate(float dt)
    {
        // 默认：不做任何事
    }
}

class CombatModule extends BaseModule
{
    override void OnInit()
    {
        super.OnInit();  // 先调用父方法
        Print("[CombatModule] Combat system ready");
    }

    override void OnUpdate(float dt)
    {
        super.OnUpdate(dt);
        // 自定义战斗逻辑
        CheckCombatState();
    }
}
```

### 重写规则

1. **`override` 关键字是必需的**——没有它，你创建的是隐藏父方法的新方法，而不是替换它。

2. **签名必须完全匹配**——相同的返回类型、相同的参数类型、相同的参数数量。

3. **`super.MethodName()` 调用父方法**——用它来扩展行为而不是完全替换。

4. **私有方法不能被重写**——子类看不到它们。

5. **受保护的方法可以被重写**——子类可以看到并重写它们。

```c
class Parent
{
    private void SecretMethod() {}    // 不能被重写
    protected void InternalWork() {}  // 可以被子类重写
    void PublicWork() {}              // 可以被任何人重写
}

class Child extends Parent
{
    // override void SecretMethod() {}   // 编译错误——private
    override void InternalWork() {}      // OK——protected 可见
    override void PublicWork() {}        // OK——public
}
```

### 注意：忘记 override

如果你省略 `override`，编译器可能发出警告但**不会**报错。你的方法静默地变成新方法而不是替换父方法。当通过父类型变量引用对象时，父方法的版本会运行。

```c
class Animal
{
    void Speak() { Print("..."); }
}

class Dog extends Animal
{
    // 错误：缺少 override——创建了新方法
    void Speak() { Print("Woof!"); }

    // 好：正确重写
    override void Speak() { Print("Woof!"); }
}
```

---

## 方法重载（不支持）

**Enforce Script 不支持方法重载。**你不能有两个同名但参数列表不同的方法。尝试这样做会导致编译错误。

```c
class Calculator
{
    // 编译错误——方法名重复
    int Add(int a, int b) { return a + b; }
    float Add(float a, float b) { return a + b; }  // 不允许
}
```

### 解决方法 1：不同的方法名

最常见的方法是使用描述性名称：

```c
class Calculator
{
    int AddInt(int a, int b) { return a + b; }
    float AddFloat(float a, float b) { return a + b; }
}
```

### 解决方法 2：Ex() 约定

DayZ 原版和模组遵循一个命名约定，方法的扩展版本在名称后追加 `Ex`：

```c
// 来自原版脚本——基本版本与扩展版本
void ExplosionEffects(Object source, Object directHit, int componentIndex);
void ExplosionEffectsEx(Object source, Object directHit, int componentIndex,
    float energyFactor, float explosionFactor, HitInfo hitInfo);

// 来自 EffectManager
static void EffectUnregister(Effect effect);
static void EffectUnregisterEx(Effect effect);

// 来自 EntityAI
void SplitIntoStackMax(EntityAI destination_entity, int slot_id);
void SplitIntoStackMaxEx(EntityAI destination_entity, int slot_id);
```

### 解决方法 3：默认参数

如果区别只是可选参数，使用默认值代替：

```c
class Spawner
{
    // 不用重载，使用默认值
    void SpawnAt(vector pos, float radius = 0, string filter = "")
    {
        // 一个方法处理所有情况
    }
}
```

---

## event 关键字

`event` 关键字将方法标记为**引擎事件处理器**——C++ 引擎在特定时刻（实体创建、动画事件、物理回调等）调用的函数。它是对工具（如 Workbench）的提示，表明该方法应作为脚本事件公开。

```c
// 来自 Pawn（3_game/entities/pawn.c）
protected event void OnPossess()
{
    // 当控制器占有此 pawn 时由引擎调用
}

protected event void OnUnPossess()
{
    // 当控制器释放此 pawn 时由引擎调用
}

event void GetTransform(inout vector transform[4])
{
    // 引擎调用此方法以获取实体的变换
}

// 为网络提供数据的事件方法
protected event void ObtainMove(PawnMove pMove)
{
    // 由引擎调用以收集移动输入
}
```

你通常在子类中 `override` 事件方法而不是从头定义它们：

```c
class MyVehicle extends Transport
{
    override event void GetTransform(inout vector transform[4])
    {
        // 提供自定义变换逻辑
        super.GetTransform(transform);
    }
}
```

关键要点：`event` 是声明修饰符，不是你调用的东西。引擎在适当的时候调用事件方法。

---

## 线程方法（协程）

`thread` 关键字创建一个**协程**——可以让出执行并稍后恢复的函数。尽管名称如此，Enforce Script 是**单线程**的。线程方法是协作式协程，不是操作系统级线程。

### 声明和启动线程

通过在调用前加上 `thread` 关键字来启动线程：

```c
class Monitor
{
    void Start()
    {
        thread MonitorLoop();
    }

    void MonitorLoop()
    {
        while (true)
        {
            CheckStatus();
            Sleep(1000);  // 让出 1000 毫秒
        }
    }
}
```

`thread` 关键字放在**调用**上，而不是函数声明上。函数本身是普通函数——使它成为协程的是你如何调用它。

### Sleep() 和让出

在线程函数内部，`Sleep(milliseconds)` 暂停执行并让出给其他代码。当睡眠时间到期时，线程从停止的地方恢复。

### 终止线程

你可以用 `KillThread()` 终止正在运行的线程：

```c
// 来自 enscript.c
proto native int KillThread(Class owner, string name);

// 用法：
KillThread(this, "MonitorLoop");  // 停止 MonitorLoop 协程
```

`owner` 是启动线程的对象（或全局线程为 `null`）。`name` 是函数名。

### 何时使用线程（何时不用）

**优先使用 `CallLater` 和计时器而非线程。**线程协程有限制：
- 更难调试（堆栈跟踪不太清晰）
- 消耗一个持续到完成或终止的协程槽位
- 无法跨网络边界序列化或传输

仅当你确实需要带有中间让出的长期运行循环时才使用线程。对于一次性延迟操作，使用 `CallLater`（见下文）。

---

## 使用 CallLater 延迟调用

`CallLater` 安排函数调用在延迟后执行。它是线程协程的主要替代方案，在原版 DayZ 中被广泛使用。

### 语法

```c
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(FunctionToCall, delayMs, repeat, ...params);
```

| 参数 | 类型 | 描述 |
|-----------|------|-------------|
| Function | `func` | 要调用的方法 |
| Delay | `int` | 调用前的毫秒数 |
| Repeat | `bool` | `true` 按间隔重复，`false` 一次性 |
| Params | 可变参数 | 传递给函数的参数 |

### 调用类别

| 类别 | 用途 |
|----------|---------|
| `CALL_CATEGORY_SYSTEM` | 通用，每帧运行 |
| `CALL_CATEGORY_GUI` | UI 相关回调 |
| `CALL_CATEGORY_GAMEPLAY` | 游戏逻辑回调 |

### 原版中的示例

```c
// 一次性延迟调用（3_game/entities/entityai.c）
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(DeferredInit, 34);

// 重复调用——每 1 秒登录倒计时（3_game/dayzgame.c）
GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(this.LoginTimeCountdown, 1000, true);

// 带参数的延迟删除（4_world/entities/explosivesbase）
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(DeleteSafe, delayFor * 1000, false);

// UI 延迟回调（3_game/gui/hints/uihintpanel.c）
m_Game.GetCallQueue(CALL_CATEGORY_GUI).CallLater(SlideshowThread, m_SlideShowDelay);
```

### 移除排队的调用

要在触发前取消已安排的调用：

```c
g_Game.GetCallQueue(CALL_CATEGORY_SYSTEM).Remove(FunctionToCall);
```

---

## 最佳实践

1. **保持函数简短**——目标是 50 行以内。如果函数更长，提取辅助方法。

2. **使用守卫子句进行提前返回**——在顶部检查前置条件并提前返回。这减少了嵌套，使"正常路径"更容易阅读。

```c
void ProcessPlayer(PlayerBase player)
{
    if (!player) return;
    if (!player.IsAlive()) return;
    if (!player.GetIdentity()) return;

    // 实际逻辑在这里，不嵌套
    string name = player.GetIdentity().GetName();
    // ...
}
```

3. **优先使用 out 参数而非复杂返回类型**——当函数需要传达成功/失败加上数据时，使用 `bool` 返回值配合 `out` 参数。

4. **对无状态工具使用 static**——如果方法不访问 `this`，就让它成为 `static`。这记录了意图并允许无需实例即可调用。

5. **记录 proto native 的限制**——当包装 proto native 调用时，在注释中说明引擎函数能做什么和不能做什么。

6. **优先使用 CallLater 而非线程协程**——`CallLater` 更简单、更容易取消且更不容易出错。

7. **在重写中始终调用 super**——除非你有意要完全替换父行为。DayZ 的深层继承链依赖 `super` 调用在层次结构中传播。

---

## 真实模组中的观察

> 通过研究专业 DayZ 模组源代码确认的模式。

| 模式 | 模组 | 细节 |
|---------|-----|--------|
| `TryGet___()` 返回 `bool` 配合 `out` 参数 | COT / Expansion | 可空查找的一致模式：返回 `true`/`false`，成功时填充 `out` 参数 |
| `MethodEx()` 用于扩展签名 | Vanilla / Expansion Market | 当 API 需要更多参数时，追加 `Ex` 而不是破坏现有调用者 |
| 静态 `Init()` + `Cleanup()` 类方法 | Expansion / VPP | 管理器类在 `Init()` 中初始化静态数据，在 `Cleanup()` 中拆除，从任务生命周期调用 |
| 方法开头的守卫子句 `if (!GetGame()) return` | COT Admin Tools | 每个接触引擎的方法都以空值检查开始，以避免关闭期间的崩溃 |
| 带延迟创建的单例 `GetInstance()` | COT / Expansion / Dabs | 管理器公开 `static ref` 实例配合 `GetInstance()` 访问器，在首次访问时创建 |

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| 方法重载 | 标准 OOP 特性 | 不支持；改用 `Ex()` 后缀或默认参数 |
| `thread` 创建操作系统线程 | 关键字暗示并行性 | 单线程协程，通过 `Sleep()` 协作让出 |
| `out` 参数是只写的 | 不应读取初始值 | 一些原版代码在写入前读取 `out` 参数；更安全的做法是始终当作 `inout` 防御性处理 |
| `override` 是可选的 | 可以推断 | 省略它会静默创建新方法而不是重写；始终包含它 |
| 默认参数表达式 | 应支持函数调用 | 只允许字面值（`42`、`true`、`null`、`""`）；不允许表达式 |

---

## 常见错误

### 1. 替换父方法时忘记 override

没有 `override`，你的方法变成隐藏父方法的新方法。当通过父类型引用对象时，父方法的版本仍然会被调用。

```c
// 错误——静默创建新方法
class CustomPlayer extends PlayerBase
{
    void OnConnect() { Print("Custom!"); }
}

// 好——正确重写
class CustomPlayer extends PlayerBase
{
    override void OnConnect() { Print("Custom!"); }
}
```

### 2. 期望 out 参数被预初始化

`out` 参数没有保证的初始值。不要在写入前读取它。

```c
// 错误——在设置前读取 out 参数
void GetData(out int value)
{
    if (value > 0)  // 错误——value 在这里是未定义的
        return;
    value = 42;
}

// 好——始终先写后读
void GetData(out int value)
{
    value = 42;
}
```

### 3. 尝试重载方法

Enforce Script 不支持重载。两个同名方法会导致编译错误。

```c
// 编译错误
void Process(int id) {}
void Process(string name) {}

// 正确——使用不同名称
void ProcessById(int id) {}
void ProcessByName(string name) {}
```

### 4. 赋值 void 函数的返回值

一些函数（特别是 `JsonFileLoader.JsonLoadFile`）返回 `void`。尝试赋值它们的结果会导致编译错误。

```c
// 编译错误——JsonLoadFile 返回 void
MyConfig cfg = JsonFileLoader<MyConfig>.JsonLoadFile(path);

// 正确
MyConfig cfg = new MyConfig;
JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);
```

### 5. 在默认参数中使用表达式

默认参数值必须是编译时字面量。不允许表达式、函数调用和变量引用。

```c
// 编译错误——默认值中有表达式
void SetTimeout(float seconds = GetDefaultTimeout()) {}
void SetAngle(float rad = Math.PI) {}

// 正确——仅字面值
void SetTimeout(float seconds = 30.0) {}
void SetAngle(float rad = 3.14159) {}
```

### 6. 在重写链中忘记 super

DayZ 的类层次结构很深。在重写中省略 `super` 可能会破坏你甚至不知道存在的几层之上的功能。

```c
// 错误——破坏了父类初始化
class MyMission extends MissionServer
{
    override void OnInit()
    {
        // 忘记了 super.OnInit()——原版初始化永远不会运行！
        Print("My mission started");
    }
}

// 好
class MyMission extends MissionServer
{
    override void OnInit()
    {
        super.OnInit();  // 让原版 + 其他模组先初始化
        Print("My mission started");
    }
}
```

---

## 快速参考表

| 特性 | 语法 | 备注 |
|---------|--------|-------|
| 实例方法 | `void DoWork()` | 可以访问 `this` |
| 静态方法 | `static void DoWork()` | 通过 `ClassName.DoWork()` 调用 |
| 按值参数 | `void Fn(int x)` | 原始类型复制；对象引用复制 |
| `out` 参数 | `void Fn(out int x)` | 只写；调用者接收值 |
| `inout` 参数 | `void Fn(inout float x)` | 读 + 写；调用者看到变化 |
| `notnull` 参数 | `void Fn(notnull EntityAI e)` | null 时崩溃 |
| 默认值 | `void Fn(int x = 5)` | 仅字面量，无表达式 |
| 重写 | `override void Fn()` | 必须匹配父签名 |
| 调用父方法 | `super.Fn()` | 在重写体内 |
| Proto native | `proto native void Fn()` | 在 C++ 中实现 |
| Owned 返回 | `proto native owned string Fn()` | 脚本管理返回的内存 |
| External | `proto native external void Fn()` | 在另一个模块中定义 |
| Volatile | `proto volatile void Fn()` | 可能回调脚本 |
| Event | `event void Fn()` | 引擎调用的回调 |
| 启动线程 | `thread MyFunc()` | 启动协程（不是操作系统线程） |
| 终止线程 | `KillThread(owner, "FnName")` | 停止正在运行的协程 |
| 延迟调用 | `CallLater(Fn, delay, repeat)` | 优于线程 |
| `Ex()` 约定 | `void FnEx(...)` | `Fn` 的扩展版本 |

---

## 导航

| 上一章 | 上级 | 下一章 |
|----------|----|------|
| [1.12 注意事项](12-gotchas.md) | [第一部分：Enforce Script](../README.md) | -- |
