# 第 1.7 章：数学与向量运算

[首页](../README.md) | [<< 上一章：字符串操作](06-strings.md) | **数学与向量运算** | [下一章：内存管理 >>](08-memory-management.md)

---

## 简介

DayZ 模组开发经常需要数学计算：查找玩家之间的距离、随机化生成位置、插值摄像机运动、计算 AI 瞄准角度。Enforce Script 提供了 `Math` 类用于标量运算，以及 `vector` 类型和静态辅助方法用于 3D 数学。本章是两者的完整参考，按类别组织。

---

## Math 类

`Math` 类的所有方法都是**静态**的。你以 `Math.MethodName()` 的形式调用它们。

### 常量

| 常量 | 值 | 描述 |
|----------|-------|-------------|
| `Math.PI` | 3.14159265... | 圆周率 |
| `Math.PI2` | 6.28318530... | 2 * Pi（一整圈的弧度） |
| `Math.PI_HALF` | 1.57079632... | Pi / 2（四分之一圈） |
| `Math.EULER` | 2.71828182... | 欧拉数 |
| `Math.DEG2RAD` | 0.01745329... | 将度数乘以此值得到弧度 |
| `Math.RAD2DEG` | 57.29577951... | 将弧度乘以此值得到度数 |

```c
// 将 90 度转换为弧度
float rad = 90 * Math.DEG2RAD; // 1.5707...

// 将 PI 弧度转换为度数
float deg = Math.PI * Math.RAD2DEG; // 180.0
```

---

### 随机数

```c
// 范围 [min, max) 内的随机整数——max 是排他的
int roll = Math.RandomInt(0, 10);           // 0 到 9

// 范围 [min, max] 内的随机整数——max 是包含的
int dice = Math.RandomIntInclusive(1, 6);   // 1 到 6

// 范围 [min, max) 内的随机浮点数——max 是排他的
float rf = Math.RandomFloat(0.0, 1.0);

// 范围 [min, max] 内的随机浮点数——max 是包含的
float rf2 = Math.RandomFloatInclusive(0.0, 1.0);

// [0, 1] 包含的随机浮点数（简写）
float chance = Math.RandomFloat01();

// 随机布尔值
bool coinFlip = Math.RandomBool();

// 设置随机数生成器种子（-1 从系统时间获取种子）
Math.Randomize(-1);
```

#### DayZ 示例：随机战利品概率

```c
bool ShouldSpawnRareLoot(float rarity)
{
    // rarity：0.0 = 永不，1.0 = 总是
    return Math.RandomFloat01() < rarity;
}

// 15% 的稀有武器概率
if (ShouldSpawnRareLoot(0.15))
{
    GetGame().CreateObject("VSS", position, false, false, true);
}
```

#### DayZ 示例：半径范围内的随机位置

```c
vector GetRandomPositionInRadius(vector center, float radius)
{
    float angle = Math.RandomFloat(0, Math.PI2);
    float dist = Math.RandomFloat(0, radius);

    vector pos = center;
    pos[0] = pos[0] + Math.Cos(angle) * dist;
    pos[2] = pos[2] + Math.Sin(angle) * dist;
    pos[1] = GetGame().SurfaceY(pos[0], pos[2]);

    return pos;
}
```

---

### 四舍五入

```c
float rounded = Math.Round(5.6);   // 6.0
float rounded2 = Math.Round(5.4);  // 5.0
float floored = Math.Floor(5.9);   // 5.0
float ceiled = Math.Ceil(5.1);     // 6.0
```

#### DayZ 示例：网格对齐的建筑放置

```c
vector SnapToGrid(vector pos, float gridSize)
{
    pos[0] = Math.Round(pos[0] / gridSize) * gridSize;
    pos[2] = Math.Round(pos[2] / gridSize) * gridSize;
    pos[1] = GetGame().SurfaceY(pos[0], pos[2]);
    return pos;
}
```

---

### 绝对值与符号

```c
float af = Math.AbsFloat(-5.5);    // 5.5
int ai = Math.AbsInt(-42);         // 42

float sf = Math.SignFloat(-5.0);   // -1.0
float sf2 = Math.SignFloat(5.0);   // 1.0
float sf3 = Math.SignFloat(0.0);   // 0.0

int si = Math.SignInt(-3);         // -1
int si2 = Math.SignInt(7);         // 1
```

---

### 幂、根与对数

```c
float pw = Math.Pow(2, 10);        // 1024.0
float sq = Math.Sqrt(25);          // 5.0
float lg = Math.Log2(8);           // 3.0
```

---

### 三角函数

所有三角函数使用**弧度**。使用 `Math.DEG2RAD` 和 `Math.RAD2DEG` 进行转换。

```c
// 基本三角函数
float s = Math.Sin(Math.PI / 4);     // ~0.707
float c = Math.Cos(Math.PI / 4);     // ~0.707
float t = Math.Tan(Math.PI / 4);     // ~1.0

// 反三角函数
float asin = Math.Asin(0.5);         // ~0.5236 弧度（30 度）
float acos = Math.Acos(0.5);         // ~1.0472 弧度（60 度）

// Atan2——从 x 轴到点 (y, x) 的角度
float angle = Math.Atan2(1, 1);      // PI/4（~0.785 弧度 = 45 度）
```

#### DayZ 示例：两个位置之间的方向角

```c
float GetAngleBetween(vector from, vector to)
{
    float dx = to[0] - from[0];
    float dz = to[2] - from[2];
    float angleRad = Math.Atan2(dx, dz);
    return angleRad * Math.RAD2DEG; // 以度数返回
}
```

#### DayZ 示例：在圆形上生成对象

```c
void SpawnCircleOfBarrels(vector center, float radius, int count)
{
    float angleStep = Math.PI2 / count;

    for (int i = 0; i < count; i++)
    {
        float angle = angleStep * i;
        vector pos = center;
        pos[0] = pos[0] + Math.Cos(angle) * radius;
        pos[2] = pos[2] + Math.Sin(angle) * radius;
        pos[1] = GetGame().SurfaceY(pos[0], pos[2]);

        GetGame().CreateObject("Barrel_Green", pos, false, false, true);
    }
}
```

---

### 限制与最小/最大值

```c
// 将值限制在范围内
float clamped = Math.Clamp(15, 0, 10);  // 10（上限）
float clamped2 = Math.Clamp(-5, 0, 10); // 0（下限）
float clamped3 = Math.Clamp(5, 0, 10);  // 5（在范围内）

// 最小值和最大值
float mn = Math.Min(3, 7);              // 3
float mx = Math.Max(3, 7);              // 7

// 检查值是否在范围内
bool inRange = Math.IsInRange(5, 0, 10); // true
bool outRange = Math.IsInRange(15, 0, 10); // false
```

#### DayZ 示例：限制玩家生命值

```c
void ApplyDamage(PlayerBase player, float damage)
{
    float currentHealth = player.GetHealth("", "Health");
    float newHealth = Math.Clamp(currentHealth - damage, 0, 100);
    player.SetHealth("", "Health", newHealth);
}
```

---

### 插值

```c
// 线性插值（Lerp）
// 返回 a + (b - a) * t，其中 t 在 [0, 1]
float lerped = Math.Lerp(0, 100, 0.5);     // 50
float lerped2 = Math.Lerp(0, 100, 0.25);   // 25

// 反向插值——找到 t 值
// 返回 (value - a) / (b - a)
float t = Math.InverseLerp(0, 100, 50);    // 0.5
float t2 = Math.InverseLerp(0, 100, 75);   // 0.75
```

#### SmoothCD（平滑临界阻尼）

`SmoothCD` 提供平滑的、与帧率无关的插值。它是摄像机平滑、UI 动画以及任何需要逐渐接近目标而不振荡的值的最佳选择。

```c
// SmoothCD(current, target, velocity, smoothTime, maxSpeed, dt)
// velocity 通过引用传递并在每次调用时更新
float currentVal = 0;
float velocity = 0;
float target = 100;
float smoothTime = 0.3;

// 每帧调用：
currentVal = Math.SmoothCD(currentVal, target, velocity, smoothTime, 1000, 0.016);
```

#### DayZ 示例：平滑摄像机缩放

```c
class SmoothZoomCamera
{
    protected float m_CurrentFOV;
    protected float m_TargetFOV;
    protected float m_Velocity;

    void SmoothZoomCamera()
    {
        m_CurrentFOV = 70;
        m_TargetFOV = 70;
        m_Velocity = 0;
    }

    void SetZoom(float targetFOV)
    {
        m_TargetFOV = Math.Clamp(targetFOV, 20, 120);
    }

    void Update(float dt)
    {
        m_CurrentFOV = Math.SmoothCD(m_CurrentFOV, m_TargetFOV, m_Velocity, 0.2, 500, dt);
    }

    float GetFOV()
    {
        return m_CurrentFOV;
    }
}
```

---

### 角度运算

```c
// 将角度规范化到 [0, 360)
float norm = Math.NormalizeAngle(370);   // 10
float norm2 = Math.NormalizeAngle(-30);  // 330

// 两个角度之间的差值（最短路径）
float diff = Math.DiffAngle(350, 10);   // -20
float diff2 = Math.DiffAngle(10, 350);  // 20
```

---

### 平方与取模

```c
// 平方（比 Pow(x, 2) 更快）
float sqf = Math.SqrFloat(5);          // 25.0
int sqi = Math.SqrInt(5);              // 25

// 浮点取模
float mod = Math.ModFloat(5.5, 2.0);   // 1.5

// 将整数包装到范围内
int wrapped = Math.WrapInt(12, 0, 10);  // 2
int wrapped2 = Math.WrapInt(-1, 0, 10); // 9
```

---

## vector 类型

`vector` 类型是一个内置值类型，包含三个浮点分量（x, y, z）。它在 DayZ 中到处使用，用于位置、方向、朝向和缩放。

### 创建向量

```c
// 字符串初始化（x y z 以空格分隔）
vector pos = "100.5 0 200.3";

// 构造函数
vector pos2 = Vector(100.5, 0, 200.3);

// 默认值（零向量）
vector zero;           // "0 0 0"
```

### 访问分量

```c
vector pos = Vector(10, 25, 30);

float x = pos[0]; // 10
float y = pos[1]; // 25（DayZ 中的高度）
float z = pos[2]; // 30

pos[1] = 50.0;    // 设置 y 分量
```

> **DayZ 坐标系：**`[0]` 是东西方向（X），`[1]` 是高度（Y），`[2]` 是南北方向（Z）。

### 向量常量

| 常量 | 值 | 描述 |
|----------|-------|-------------|
| `vector.Zero` | `"0 0 0"` | 零向量（原点） |
| `vector.Up` | `"0 1 0"` | 指向上方 |
| `vector.Aside` | `"1 0 0"` | 指向东方（X+） |
| `vector.Forward` | `"0 0 1"` | 指向北方（Z+） |

---

### 向量运算（静态方法）

#### 距离

```c
vector a = Vector(0, 0, 0);
vector b = Vector(100, 0, 100);

float dist = vector.Distance(a, b);     // ~141.42
float distSq = vector.DistanceSq(a, b); // 20000（无 sqrt，更快）
```

> **性能提示：**比较距离时使用 `DistanceSq`。比较平方值可以避免昂贵的平方根计算。

```c
// 好——比较平方距离
float maxDistSq = 100 * 100; // 10000
if (vector.DistanceSq(playerPos, targetPos) < maxDistSq)
{
    Print("Target is within 100m");
}

// 较慢——计算实际距离
if (vector.Distance(playerPos, targetPos) < 100)
{
    Print("Target is within 100m");
}
```

#### 方向

返回从一个点到另一个点的方向向量（未归一化）。

```c
vector dir = vector.Direction(from, to);
// 等价于：to - from
```

#### 点积

```c
float dot = vector.Dot(a, b);
// dot > 0：向量指向相似方向
// dot = 0：向量垂直
// dot < 0：向量指向相反方向
```

#### DayZ 示例：目标是否在玩家前方？

```c
bool IsTargetInFront(PlayerBase player, vector targetPos)
{
    vector playerDir = player.GetDirection();
    vector toTarget = vector.Direction(player.GetPosition(), targetPos);
    toTarget.Normalize();

    float dot = vector.Dot(playerDir, toTarget);
    return dot > 0; // 正值表示在前方
}
```

#### 归一化

将向量转换为单位长度（长度为 1）。

```c
vector dir = Vector(3, 0, 4);
float len = dir.Length();      // 5.0

vector norm = dir.Normalized(); // Vector(0.6, 0, 0.8)
// norm.Length() == 1.0

// 原地归一化
dir.Normalize();
// dir 现在是 Vector(0.6, 0, 0.8)
```

#### 长度

```c
vector v = Vector(3, 4, 0);
float len = v.Length();        // 5.0
float lenSq = v.LengthSq();   // 25.0（更快，无 sqrt）
```

#### Lerp（静态）

两个向量之间的线性插值。

```c
vector start = Vector(0, 0, 0);
vector end = Vector(100, 50, 200);

vector mid = vector.Lerp(start, end, 0.5);
// mid = Vector(50, 25, 100)

vector quarter = vector.Lerp(start, end, 0.25);
// quarter = Vector(25, 12.5, 50)
```

#### RotateAroundZeroDeg（静态）

围绕轴以给定角度（度数）旋转向量。

```c
vector original = Vector(1, 0, 0); // 指向东方
vector axis = Vector(0, 1, 0);     // 围绕 Y 轴旋转
float angle = 90;                  // 90 度

vector rotated = vector.RotateAroundZeroDeg(original, axis, angle);
// rotated 大约是 Vector(0, 0, 1)——现在指向北方
```

#### 随机方向

```c
vector rdir = vector.RandomDir();    // 随机 3D 方向（单位向量）
vector rdir2d = vector.RandomDir2D(); // XZ 平面上的随机方向
```

---

### 向量算术

向量支持标准算术运算符：

```c
vector a = Vector(1, 2, 3);
vector b = Vector(4, 5, 6);

vector sum = a + b;         // Vector(5, 7, 9)
vector diff = a - b;        // Vector(-3, -3, -3)
vector scaled = a * 2;      // Vector(2, 4, 6)

// 将位置向前移动
vector pos = player.GetPosition();
vector dir = player.GetDirection();
vector ahead = pos + dir * 5; // 玩家前方 5 米
```

### 将向量转换为字符串

```c
vector pos = Vector(100.5, 25.3, 200.7);
string s = pos.ToString(); // "<100.5, 25.3, 200.7>"
```

---

## Math3D 类

对于高级 3D 运算，`Math3D` 类提供矩阵和旋转工具。

```c
// 从偏航/俯仰/翻滚（度数）创建旋转矩阵
vector mat[3];
Math3D.YawPitchRollMatrix("45 0 0", mat);

// 将旋转矩阵转换回角度
vector angles = Math3D.MatrixToAngles(mat);

// 单位矩阵（4x4）
vector mat4[4];
Math3D.MatrixIdentity4(mat4);
```

---

## 真实案例

### 计算两个玩家之间的距离

```c
float GetPlayerDistance(PlayerBase player1, PlayerBase player2)
{
    if (!player1 || !player2)
        return -1;

    return vector.Distance(player1.GetPosition(), player2.GetPosition());
}

void WarnProximity(PlayerBase player, array<Man> allPlayers, float warnDistance)
{
    vector myPos = player.GetPosition();
    float warnDistSq = warnDistance * warnDistance;

    foreach (Man man : allPlayers)
    {
        if (man == player)
            continue;

        if (vector.DistanceSq(myPos, man.GetPosition()) < warnDistSq)
        {
            Print(string.Format("Player nearby! Distance: %1m",
                vector.Distance(myPos, man.GetPosition())));
        }
    }
}
```

### 查找最近的对象

```c
Object FindClosest(vector origin, array<Object> objects)
{
    Object closest = null;
    float closestDistSq = float.MAX;

    foreach (Object obj : objects)
    {
        if (!obj)
            continue;

        float distSq = vector.DistanceSq(origin, obj.GetPosition());
        if (distSq < closestDistSq)
        {
            closestDistSq = distSq;
            closest = obj;
        }
    }

    return closest;
}
```

### 沿路径移动对象

```c
class PathMover
{
    protected ref array<vector> m_Waypoints;
    protected int m_CurrentWaypoint;
    protected float m_Progress; // 路径点之间的 0.0 到 1.0
    protected float m_Speed;    // 每秒米数

    void PathMover(array<vector> waypoints, float speed)
    {
        m_Waypoints = waypoints;
        m_CurrentWaypoint = 0;
        m_Progress = 0;
        m_Speed = speed;
    }

    vector Update(float dt)
    {
        if (m_CurrentWaypoint >= m_Waypoints.Count() - 1)
            return m_Waypoints.Get(m_Waypoints.Count() - 1);

        vector from = m_Waypoints.Get(m_CurrentWaypoint);
        vector to = m_Waypoints.Get(m_CurrentWaypoint + 1);
        float segmentLength = vector.Distance(from, to);

        if (segmentLength > 0)
        {
            m_Progress += (m_Speed * dt) / segmentLength;
        }

        if (m_Progress >= 1.0)
        {
            m_Progress = 0;
            m_CurrentWaypoint++;
            return Update(0); // 使用下一段重新计算
        }

        return vector.Lerp(from, to, m_Progress);
    }
}
```

### 计算围绕某点的生成环

```c
array<vector> GetSpawnRing(vector center, float radius, int count)
{
    array<vector> positions = new array<vector>;
    float angleStep = Math.PI2 / count;

    for (int i = 0; i < count; i++)
    {
        float angle = angleStep * i;
        vector pos = center;
        pos[0] = pos[0] + Math.Cos(angle) * radius;
        pos[2] = pos[2] + Math.Sin(angle) * radius;
        pos[1] = GetGame().SurfaceY(pos[0], pos[2]);
        positions.Insert(pos);
    }

    return positions;
}
```

---

## 最佳实践

- 在紧密循环中使用 `vector.DistanceSq()` 并与 `radius * radius` 比较——它避免了 `Distance()` 中昂贵的 `sqrt`。
- 在将角度传递给 `Sin()`/`Cos()` 之前始终乘以 `Math.DEG2RAD`——所有三角函数使用弧度。
- 在调用 `Normalize()` 之前检查 `v.Length() > 0`——归一化零长度向量会产生 `NaN` 值。
- 使用 `Math.Clamp()` 限制生命值、伤害和 UI 值，而不是编写手动的 `if` 链。
- 当最大值应该可达时（例如掷骰子）优先使用 `Math.RandomIntInclusive()`——`RandomInt()` 的最大值是排他的。

---

## 真实模组中的观察

> 通过研究专业 DayZ 模组源代码确认的模式。

| 模式 | 模组 | 细节 |
|---------|-----|--------|
| `DistanceSq` 与预平方阈值 | Expansion / COT | 距离检查存储 `float maxDistSq = range * range` 并与 `DistanceSq` 比较 |
| `Math.Atan2(dx, dz) * RAD2DEG` 用于朝向 | Expansion AI | 目标方向计算为度数角度用于朝向赋值 |
| `Math.RandomFloat(0, Math.PI2)` 用于生成环 | Dabs / Expansion | 随机角度 + `Cos`/`Sin` 生成圆形生成位置 |
| `Math.Clamp` 用于生命值/伤害值 | VPP / COT | 每次伤害应用都将结果限制在 `[0, maxHealth]` 以防止负值或溢出 |

---

## 理论与实践

| 概念 | 理论 | 现实 |
|---------|--------|---------|
| `Math.RandomInt(0, 10)` | 可能期望 0-10 包含 | 最大值是排他的——返回 0-9；包含最大值使用 `RandomIntInclusive` |
| `vector[1]` 是 Y 轴 | 标准 XYZ 映射 | 在 DayZ 中，Y 是垂直高度——容易与其他引擎的 Z 轴朝上惯例混淆 |
| `Math.SqrFloat` 与 `Math.Sqrt` | 名称看起来相似 | `SqrFloat(5)` = 25（平方值），`Sqrt(25)` = 5（平方根）——相反的运算 |

---

## 常见错误

| 错误 | 问题 | 修复方法 |
|---------|---------|-----|
| 将度数传递给 `Math.Sin()` / `Math.Cos()` | 三角函数期望弧度 | 先乘以 `Math.DEG2RAD` |
| 使用 `Math.RandomInt(0, 10)` 并期望得到 10 | 最大值是排他的 | 使用 `Math.RandomIntInclusive(0, 10)` 包含最大值 |
| 在紧密循环中计算 `vector.Distance()` | `Distance` 使用 `sqrt`，速度慢 | 使用 `vector.DistanceSq()` 并与平方距离比较 |
| 归一化零长度向量 | 除以零，产生 NaN | 归一化前检查 `v.Length() > 0` |
| 忘记 DayZ 的 Y 轴朝上 | `pos[1]` 是高度，不是 Z | `[0]` = X（东），`[1]` = Y（上），`[2]` = Z（北） |
| 使用 t 超出 [0,1] 的 `Lerp` | 外推超出范围 | 用 `Math.Clamp(t, 0, 1)` 限制 t |
| 混淆 `SqrFloat` 和 `Sqrt` | `SqrFloat` 对值求平方；`Sqrt` 取平方根 | `Math.SqrFloat(5)` = 25，`Math.Sqrt(25)` = 5 |

---

## 快速参考

```c
// 常量
Math.PI  Math.PI2  Math.PI_HALF  Math.EULER  Math.DEG2RAD  Math.RAD2DEG

// 随机数
Math.RandomInt(min, max)              // [min, max)
Math.RandomIntInclusive(min, max)     // [min, max]
Math.RandomFloat(min, max)            // [min, max)
Math.RandomFloatInclusive(min, max)   // [min, max]
Math.RandomFloat01()                  // [0, 1]
Math.RandomBool()
Math.Randomize(-1)                    // 从时间获取种子

// 四舍五入
Math.Round(f)  Math.Floor(f)  Math.Ceil(f)

// 绝对值与符号
Math.AbsFloat(f)  Math.AbsInt(i)  Math.SignFloat(f)  Math.SignInt(i)

// 幂与根
Math.Pow(base, exp)  Math.Sqrt(f)  Math.Log2(f)  Math.SqrFloat(f)

// 三角函数（弧度）
Math.Sin(r) Math.Cos(r) Math.Tan(r) Math.Asin(f) Math.Acos(f) Math.Atan2(y, x)

// 限制与插值
Math.Clamp(val, min, max)  Math.Min(a, b)  Math.Max(a, b)
Math.Lerp(a, b, t)  Math.InverseLerp(a, b, val)
Math.SmoothCD(cur, target, vel, smoothTime, maxSpeed, dt)
Math.IsInRange(val, min, max)

// 角度
Math.NormalizeAngle(deg)  Math.DiffAngle(a, b)

// 向量
vector.Distance(a, b)    vector.DistanceSq(a, b)
vector.Direction(from, to)
vector.Dot(a, b)          vector.Lerp(a, b, t)
vector.RotateAroundZeroDeg(vec, axis, angleDeg)
vector.RandomDir()        vector.RandomDir2D()
v.Length()  v.LengthSq()  v.Normalized()  v.Normalize()

// 向量常量
vector.Zero  vector.Up  vector.Aside  vector.Forward
```

---

[<< 1.6：字符串操作](06-strings.md) | [首页](../README.md) | [1.8：内存管理 >>](08-memory-management.md)
