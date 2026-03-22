# 第 1.9 章：类型转换与反射

[首页](../README.md) | [<< 上一章：内存管理](08-memory-management.md) | **类型转换与反射** | [下一章：枚举与预处理器 >>](10-enums-preprocessor.md)

---

> **目标：** 掌握安全的类型转换、运行时类型检查以及 Enforce Script 的反射 API，用于动态属性访问。

---

## 目录

- [为什么类型转换很重要](#为什么类型转换很重要)
- [Class.CastTo — 安全的向下转换](#classcastto--安全的向下转换)
- [Type.Cast — 替代转换方式](#typecast--替代转换方式)
- [CastTo vs Type.Cast — 何时使用哪个](#castto-vs-typecast--何时使用哪个)
- [obj.IsInherited — 运行时类型检查](#obisinherited--运行时类型检查)
- [obj.IsKindOf — 基于字符串的类型检查](#obiskindof--基于字符串的类型检查)
- [obj.Type — 获取运行时类型](#objtype--获取运行时类型)
- [typename — 存储类型引用](#typename--存储类型引用)
- [反射 API](#反射-api)
  - [检查变量](#检查变量)
  - [EnScript.GetClassVar / SetClassVar](#enscriptgetclassvar--setclassvar)
- [实际示例](#实际示例)
  - [查找世界中所有车辆](#查找世界中所有车辆)
  - [带类型转换的安全对象辅助函数](#带类型转换的安全对象辅助函数)
  - [基于反射的配置系统](#基于反射的配置系统)
  - [类型安全的事件分发](#类型安全的事件分发)
- [常见错误](#常见错误)
- [总结](#总结)
- [导航](#导航)

---

## 为什么类型转换很重要

DayZ 的实体层次结构很深。大多数引擎 API 返回通用基类型（`Object`、`Man`、`Class`），但你需要特定类型（`PlayerBase`、`ItemBase`、`CarScript`）才能访问专有方法。类型转换将基类引用安全地转换为派生类引用。

```
Class（根）
  └─ Object
       └─ Entity
            └─ EntityAI
                 ├─ InventoryItem → ItemBase
                 ├─ DayZCreatureAI
                 │    ├─ DayZInfected
                 │    └─ DayZAnimal
                 └─ Man
                      └─ DayZPlayer → PlayerBase
```

调用基类型上不存在的方法会导致**运行时崩溃**——不会有编译器错误，因为 Enforce Script 在运行时解析虚调用。

---

## Class.CastTo — 安全的向下转换

`Class.CastTo` 是 DayZ 中**首选的**类型转换方法。它是一个静态方法，将结果写入 `out` 参数并返回 `bool`。

```c
// 签名：
// static bool Class.CastTo(out Class target, Class source)

Object obj = GetSomeObject();
PlayerBase player;

if (Class.CastTo(player, obj))
{
    // 转换成功——player 有效
    string name = player.GetIdentity().GetName();
    Print("Found player: " + name);
}
else
{
    // 转换失败——obj 不是 PlayerBase
    // player 在此处为 null
}
```

**为什么首选：**
- 失败时返回 `false` 而不是崩溃
- `out` 参数在失败时设为 `null`——安全可检查
- 适用于整个类层次结构（不仅仅是 `Object`）

### 模式：转换并继续

在循环中，使用转换失败来跳过无关的对象：

```c
array<Object> nearObjects = new array<Object>;
array<CargoBase> proxyCargos = new array<CargoBase>;
GetGame().GetObjectsAtPosition(pos, 50.0, nearObjects, proxyCargos);

foreach (Object obj : nearObjects)
{
    EntityAI entity;
    if (!Class.CastTo(entity, obj))
        continue;  // 跳过非 EntityAI 对象（建筑、地形等）

    // 现在可以安全调用 EntityAI 方法
    if (entity.IsAlive())
    {
        Print(entity.GetType() + " is alive at " + entity.GetPosition().ToString());
    }
}
```

---

## Type.Cast — 替代转换方式

每个类都有一个静态 `Cast` 方法，直接返回转换结果（失败时返回 `null`）。

```c
// 语法：TargetType.Cast(source)

Object obj = GetSomeObject();
PlayerBase player = PlayerBase.Cast(obj);

if (player)
{
    player.DoSomething();
}
```

这是一个将转换和赋值结合在一行的写法，但你**必须**仍然对结果进行 null 检查。

### 转换原语和 Params

`Type.Cast` 也用于 `Param` 类（在 RPC 和事件中大量使用）：

```c
override void OnEvent(EventType eventTypeId, Param params)
{
    if (eventTypeId == ClientReadyEventTypeID)
    {
        Param2<PlayerIdentity, Man> readyParams = Param2<PlayerIdentity, Man>.Cast(params);
        if (readyParams)
        {
            PlayerIdentity identity = readyParams.param1;
            Man player = readyParams.param2;
        }
    }
}
```

---

## CastTo vs Type.Cast — 何时使用哪个

| 特性 | `Class.CastTo` | `Type.Cast` |
|---------|----------------|-------------|
| 返回类型 | `bool` | 目标类型或 `null` |
| 失败时为 null | 是（out 参数设为 null）| 是（返回 null）|
| 最适合 | 带分支逻辑的 if 块 | 单行赋值 |
| DayZ 原版中使用 | 到处 | 到处 |
| 适用于非 Object | 是（任何 `Class`）| 是（任何 `Class`）|

**经验法则：** 当你需要根据成功/失败进行分支时使用 `Class.CastTo`。当你只需要类型化引用并稍后进行 null 检查时使用 `Type.Cast`。

```c
// CastTo — 根据结果分支
PlayerBase player;
if (Class.CastTo(player, obj))
{
    // 处理 player
}

// Type.Cast — 赋值并稍后检查
PlayerBase player = PlayerBase.Cast(obj);
if (!player) return;
```

---

## obj.IsInherited — 运行时类型检查

`IsInherited` 检查对象是否是给定类型的实例，**而不**执行转换。它接受一个 `typename` 参数。

```c
Object obj = GetSomeObject();

if (obj.IsInherited(PlayerBase))
{
    Print("This is a player!");
}

if (obj.IsInherited(DayZInfected))
{
    Print("This is a zombie!");
}

if (obj.IsInherited(CarScript))
{
    Print("This is a vehicle!");
}
```

`IsInherited` 对确切类型**和**层次结构中的任何父类型返回 `true`。一个 `PlayerBase` 对象对 `IsInherited(Man)`、`IsInherited(EntityAI)`、`IsInherited(Object)` 等都返回 `true`。

---

## obj.IsKindOf — 基于字符串的类型检查

`IsKindOf` 执行相同的检查，但使用**字符串**类名。当你将类型名作为数据（例如从配置文件中）使用时很有用。

```c
Object obj = GetSomeObject();

if (obj.IsKindOf("ItemBase"))
{
    Print("This is an item");
}

if (obj.IsKindOf("DayZAnimal"))
{
    Print("This is an animal");
}
```

**重要：** `IsKindOf` 检查完整的继承链，就像 `IsInherited` 一样。一个 `Mag_STANAG_30Rnd` 对 `IsKindOf("Magazine_Base")`、`IsKindOf("InventoryItem")`、`IsKindOf("EntityAI")` 等都返回 `true`。

### IsInherited vs IsKindOf

| 特性 | `IsInherited(typename)` | `IsKindOf(string)` |
|---------|------------------------|---------------------|
| 参数 | 编译时类型 | 字符串名称 |
| 速度 | 更快（类型比较）| 更慢（字符串查找）|
| 使用时机 | 编译时已知类型 | 类型来自数据/配置 |

---

## obj.Type — 获取运行时类型

`Type()` 返回对象实际运行时类的 `typename`——不是声明的变量类型。

```c
Object obj = GetSomeObject();
typename t = obj.Type();

Print(t.ToString());  // 例如 "PlayerBase"、"AK101"、"LandRover"
```

用于日志记录、调试或动态比较类型：

```c
void ProcessEntity(EntityAI entity)
{
    typename t = entity.Type();
    Print("Processing entity of type: " + t.ToString());

    if (t == PlayerBase)
    {
        Print("It's a player");
    }
}
```

---

## typename — 存储类型引用

`typename` 是 Enforce Script 中的一等类型。你可以将它存储在变量中、作为参数传递和进行比较。

```c
// 声明 typename 变量
typename playerType = PlayerBase;
typename vehicleType = CarScript;

// 比较
typename objType = obj.Type();
if (objType == playerType)
{
    Print("Match!");
}

// 在集合中使用
array<typename> allowedTypes = new array<typename>;
allowedTypes.Insert(PlayerBase);
allowedTypes.Insert(DayZInfected);
allowedTypes.Insert(DayZAnimal);

// 检查成员关系
foreach (typename t : allowedTypes)
{
    if (obj.IsInherited(t))
    {
        Print("Object matches allowed type: " + t.ToString());
        break;
    }
}
```

### 从 typename 创建实例

你可以在运行时从 `typename` 创建对象：

```c
typename t = PlayerBase;
Class instance = t.Spawn();  // 创建新实例

// 或使用基于字符串的方式：
Class instance2 = GetGame().CreateObjectEx("AK101", pos, ECE_PLACE_ON_SURFACE);
```

> **注意：** `typename.Spawn()` 仅适用于具有无参构造函数的类。对于 DayZ 实体，使用 `GetGame().CreateObject()` 或 `CreateObjectEx()`。

---

## 反射 API

Enforce Script 提供基本的反射——在运行时不知道对象类型的情况下检查和修改其属性的能力。

### 检查变量

每个对象的 `Type()` 返回一个 `typename`，它暴露变量元数据：

```c
void InspectObject(Class obj)
{
    typename t = obj.Type();

    int varCount = t.GetVariableCount();
    Print("Class: " + t.ToString() + " has " + varCount.ToString() + " variables");

    for (int i = 0; i < varCount; i++)
    {
        string varName = t.GetVariableName(i);
        typename varType = t.GetVariableType(i);

        Print("  [" + i.ToString() + "] " + varName + " : " + varType.ToString());
    }
}
```

**`typename` 上可用的反射方法：**

| 方法 | 返回值 | 描述 |
|--------|---------|-------------|
| `GetVariableCount()` | `int` | 成员变量数量 |
| `GetVariableName(int index)` | `string` | 指定索引的变量名 |
| `GetVariableType(int index)` | `typename` | 指定索引的变量类型 |
| `ToString()` | `string` | 类名字符串 |

### EnScript.GetClassVar / SetClassVar

`EnScript.GetClassVar` 和 `EnScript.SetClassVar` 允许你在运行时按**名称**读写成员变量。这是 Enforce Script 的动态属性访问等价物。

```c
// 签名：
// static void EnScript.GetClassVar(Class instance, string varName, int index, out T value)
// static bool EnScript.SetClassVar(Class instance, string varName, int index, T value)
// 'index' 是数组元素索引——非数组字段使用 0。

class MyConfig
{
    int MaxSpawns = 10;
    float SpawnRadius = 100.0;
    string WelcomeMsg = "Hello!";
}

void DemoReflection()
{
    MyConfig cfg = new MyConfig();

    // 按名称读取值
    int maxVal;
    EnScript.GetClassVar(cfg, "MaxSpawns", 0, maxVal);
    Print("MaxSpawns = " + maxVal.ToString());  // "MaxSpawns = 10"

    float radius;
    EnScript.GetClassVar(cfg, "SpawnRadius", 0, radius);
    Print("SpawnRadius = " + radius.ToString());  // "SpawnRadius = 100"

    string msg;
    EnScript.GetClassVar(cfg, "WelcomeMsg", 0, msg);
    Print("WelcomeMsg = " + msg);  // "WelcomeMsg = Hello!"

    // 按名称写入值
    EnScript.SetClassVar(cfg, "MaxSpawns", 0, 50);
    EnScript.SetClassVar(cfg, "SpawnRadius", 0, 250.0);
    EnScript.SetClassVar(cfg, "WelcomeMsg", 0, "Welcome!");
}
```

> **警告：** `GetClassVar`/`SetClassVar` 在变量名错误或类型不匹配时会静默失败。使用前始终验证变量名。

---

## 实际示例

### 查找世界中所有车辆

```c
static array<CarScript> FindAllVehicles()
{
    array<CarScript> vehicles = new array<CarScript>;
    array<Object> allObjects = new array<Object>;
    array<CargoBase> proxyCargos = new array<CargoBase>;

    // 搜索大范围区域（或使用任务特定逻辑）
    vector center = "7500 0 7500";
    GetGame().GetObjectsAtPosition(center, 15000.0, allObjects, proxyCargos);

    foreach (Object obj : allObjects)
    {
        CarScript car;
        if (Class.CastTo(car, obj))
        {
            vehicles.Insert(car);
        }
    }

    Print("Found " + vehicles.Count().ToString() + " vehicles");
    return vehicles;
}
```

### 带类型转换的安全对象辅助函数

这个模式在 DayZ modding 中到处使用——一个实用函数，通过转换到 `EntityAI` 来安全地检查 `Object` 是否存活：

```c
// Object.IsAlive() 在基类 Object 上不存在！
// 你必须先转换到 EntityAI。

static bool IsObjectAlive(Object obj)
{
    if (!obj)
        return false;

    EntityAI eai;
    if (Class.CastTo(eai, obj))
    {
        return eai.IsAlive();
    }

    return false;  // 非 EntityAI 对象（建筑等）——视为"非存活"
}
```

### 基于反射的配置系统

这个模式（在 MyMod Core 中使用）构建了一个通用配置系统，其中字段按名称读写，使管理面板能够在不知道具体类的情况下编辑任何配置：

```c
class ConfigBase
{
    // 按名称查找成员变量索引
    protected int FindVarIndex(string fieldName)
    {
        typename t = Type();
        int count = t.GetVariableCount();
        for (int i = 0; i < count; i++)
        {
            if (t.GetVariableName(i) == fieldName)
                return i;
        }
        return -1;
    }

    // 获取任意字段值为字符串
    string GetFieldValue(string fieldName)
    {
        if (FindVarIndex(fieldName) == -1)
            return "";

        int iVal;
        EnScript.GetClassVar(this, fieldName, 0, iVal);
        return iVal.ToString();
    }

    // 从字符串设置任意字段值
    void SetFieldValue(string fieldName, string value)
    {
        if (FindVarIndex(fieldName) == -1)
            return;

        int iVal = value.ToInt();
        EnScript.SetClassVar(this, fieldName, 0, iVal);
    }
}

class MyModConfig : ConfigBase
{
    int MaxPlayers = 60;
    int RespawnTime = 300;
}

void AdminPanelSave(ConfigBase config, string fieldName, string newValue)
{
    // 适用于任何 config 子类——不需要类型特定代码
    config.SetFieldValue(fieldName, newValue);
}
```

### 类型安全的事件分发

使用 `typename` 构建将事件路由到正确处理程序的分发器：

```c
class EventDispatcher
{
    protected ref map<typename, ref array<ref EventHandler>> m_Handlers;

    void EventDispatcher()
    {
        m_Handlers = new map<typename, ref array<ref EventHandler>>;
    }

    void Register(typename eventType, EventHandler handler)
    {
        if (!m_Handlers.Contains(eventType))
        {
            m_Handlers.Insert(eventType, new array<ref EventHandler>);
        }

        m_Handlers.Get(eventType).Insert(handler);
    }

    void Dispatch(EventBase event)
    {
        typename eventType = event.Type();

        array<ref EventHandler> handlers;
        if (m_Handlers.Find(eventType, handlers))
        {
            foreach (EventHandler handler : handlers)
            {
                handler.Handle(event);
            }
        }
    }
}
```

---

## 最佳实践

- 每次转换后始终进行 null 检查——`Class.CastTo` 和 `Type.Cast` 在失败时都返回 null，不检查结果就使用会导致崩溃。
- 当你需要根据成功/失败进行分支时使用 `Class.CastTo`；对简洁的单行赋值后跟 null 检查使用 `Type.Cast`。
- 当类型在编译时已知时，优先使用 `IsInherited(typename)` 而不是 `IsKindOf(string)`——它更快且能在编译时捕获拼写错误。
- 调用 `IsAlive()` 之前先转换到 `EntityAI`——基类 `Object` 没有此方法。
- 使用 `EnScript.GetClassVar` 之前用 `GetVariableCount`/`GetVariableName` 验证变量名——它在名称错误时静默失败。

---

## 在实际 Mod 中的观察

> 通过研究专业 DayZ mod 源代码确认的模式。

| 模式 | Mod | 详情 |
|---------|-----|--------|
| `Class.CastTo` + `continue` 在实体循环中 | COT / Expansion | 每个遍历 `Object` 数组的循环都使用转换并继续来跳过不匹配的类型 |
| `IsKindOf` 用于配置驱动的类型检查 | Expansion Market | 从 JSON 加载的物品类别使用基于字符串的 `IsKindOf`，因为类型是数据 |
| `EnScript.GetClassVar`/`SetClassVar` 用于管理面板 | Dabs Framework | 通用配置编辑器按名称读写字段，使一个 UI 适用于所有配置类 |
| `obj.Type().ToString()` 用于日志记录 | VPP Admin | 调试日志始终包含 `entity.Type().ToString()` 来标识处理了什么 |

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| `Object.IsAlive()` | 期望它存在于 `Object` 上 | 仅在 `EntityAI` 及其子类上可用——在 `Object` 上调用会崩溃 |
| `EnScript.SetClassVar` 返回 `bool` | 应该指示成功/失败 | 在字段名错误时静默返回 `false`，没有错误消息——容易遗漏 |
| `typename.Spawn()` | 创建任何类的实例 | 仅适用于具有无参构造函数的类；对于游戏实体使用 `CreateObject` |

---

## 常见错误

### 1. 忘记在转换后进行 null 检查

```c
// 错误——如果 obj 不是 PlayerBase 则崩溃
PlayerBase player = PlayerBase.Cast(obj);
player.GetIdentity();  // 如果转换失败则崩溃！

// 正确
PlayerBase player = PlayerBase.Cast(obj);
if (player)
{
    player.GetIdentity();
}
```

### 2. 在基类 Object 上调用 IsAlive()

```c
// 错误——Object.IsAlive() 不存在
Object obj = GetSomeObject();
if (obj.IsAlive())  // 编译错误或运行时崩溃！

// 正确
EntityAI eai;
if (Class.CastTo(eai, obj) && eai.IsAlive())
{
    // 安全
}
```

### 3. 使用反射但变量名错误

```c
// 静默失败——没有错误，只返回零/空
int val;
EnScript.GetClassVar(obj, "NonExistentField", 0, val);
// val 为 0，没有抛出错误
```

始终先用 `FindVarIndex` 或 `GetVariableCount`/`GetVariableName` 验证。

### 4. 混淆 Type() 和 typename 字面量

```c
// Type() — 返回实例的运行时类型
typename t = myObj.Type();  // 例如 PlayerBase

// typename 字面量——编译时类型引用
typename t = PlayerBase;    // 始终是 PlayerBase

// 它们可以比较
if (myObj.Type() == PlayerBase)  // 如果 myObj 是 PlayerBase 则为 true
```

---

## 总结

| 操作 | 语法 | 返回值 |
|-----------|--------|---------|
| 安全向下转换 | `Class.CastTo(out target, source)` | `bool` |
| 内联转换 | `TargetType.Cast(source)` | 目标类型或 `null` |
| 类型检查（typename）| `obj.IsInherited(typename)` | `bool` |
| 类型检查（字符串）| `obj.IsKindOf("ClassName")` | `bool` |
| 获取运行时类型 | `obj.Type()` | `typename` |
| 变量数量 | `obj.Type().GetVariableCount()` | `int` |
| 变量名称 | `obj.Type().GetVariableName(i)` | `string` |
| 变量类型 | `obj.Type().GetVariableType(i)` | `typename` |
| 读取属性 | `EnScript.GetClassVar(obj, name, 0, out val)` | `void` |
| 写入属性 | `EnScript.SetClassVar(obj, name, 0, val)` | `bool` |

---

## 导航

| 上一章 | 上级 | 下一章 |
|----------|----|------|
| [1.8 内存管理](08-memory-management.md) | [第 1 部分：Enforce Script](../README.md) | [1.10 枚举与预处理器](10-enums-preprocessor.md) |
