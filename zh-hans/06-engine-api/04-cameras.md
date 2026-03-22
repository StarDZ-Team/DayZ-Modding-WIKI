# 第 6.4 章：相机系统

[首页](../README.md) | [<< 上一章：天气](03-weather.md) | **相机** | [下一章：后处理效果 >>](05-ppe.md)

---

## 简介

DayZ 使用多层相机系统。玩家相机由引擎通过 `DayZPlayerCamera` 子类管理。用于模组开发和调试时，`FreeDebugCamera` 可以实现自由飞行。引擎还提供了全局访问器来获取当前相机状态。本章介绍相机类型、如何访问相机数据以及如何使用脚本化相机工具。

---

## 当前相机状态（全局访问器）

这些方法在任何地方都可用，无论相机类型如何，都返回当前活动相机的状态：

```c
// 当前相机世界位置
proto native vector GetGame().GetCurrentCameraPosition();

// 当前相机前方方向（单位向量）
proto native vector GetGame().GetCurrentCameraDirection();

// 将世界位置转换为屏幕坐标
proto native vector GetGame().GetScreenPos(vector world_pos);
// 返回值：x = 屏幕 X（像素），y = 屏幕 Y（像素），z = 深度（到相机的距离）
```

**示例 --- 检查一个位置是否在屏幕上：**

```c
bool IsPositionOnScreen(vector worldPos)
{
    vector screenPos = GetGame().GetScreenPos(worldPos);

    // z < 0 表示在相机后面
    if (screenPos[2] < 0)
        return false;

    int screenW, screenH;
    GetScreenSize(screenW, screenH);

    return (screenPos[0] >= 0 && screenPos[0] <= screenW &&
            screenPos[1] >= 0 && screenPos[1] <= screenH);
}
```

**示例 --- 获取相机到某点的距离：**

```c
float DistanceFromCamera(vector worldPos)
{
    return vector.Distance(GetGame().GetCurrentCameraPosition(), worldPos);
}
```

---

## DayZPlayerCamera 系统

DayZ 玩家相机是由引擎的玩家控制器管理的原生类。它们不能从脚本中直接实例化 --- 引擎会根据玩家的状态（站立、趴下、游泳、载具、昏迷等）自动选择合适的相机。

### 相机类型（DayZPlayerCameras 常量）

相机类型 ID 定义为常量：

| 常量 | 描述 |
|------|------|
| `DayZPlayerCameras.DAYZCAMERA_1ST` | 第一人称相机 |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC` | 第三人称直立（站立） |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO` | 第三人称蹲下 |
| `DayZPlayerCameras.DAYZCAMERA_3RD_PRO` | 第三人称趴下 |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_SPR` | 第三人称冲刺 |
| `DayZPlayerCameras.DAYZCAMERA_3RD_ERC_RAISED` | 第三人称举枪 |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CRO_RAISED` | 第三人称蹲下举枪 |
| `DayZPlayerCameras.DAYZCAMERA_IRONSIGHTS` | 机械瞄准 |
| `DayZPlayerCameras.DAYZCAMERA_OPTICS` | 光学/瞄准镜瞄准 |
| `DayZPlayerCameras.DAYZCAMERA_3RD_VEHICLE` | 第三人称载具 |
| `DayZPlayerCameras.DAYZCAMERA_1ST_VEHICLE` | 第一人称载具 |
| `DayZPlayerCameras.DAYZCAMERA_3RD_SWIM` | 第三人称游泳 |
| `DayZPlayerCameras.DAYZCAMERA_3RD_UNCONSCIOUS` | 第三人称昏迷 |
| `DayZPlayerCameras.DAYZCAMERA_1ST_UNCONSCIOUS` | 第一人称昏迷 |
| `DayZPlayerCameras.DAYZCAMERA_3RD_CLIMB` | 第三人称攀爬 |
| `DayZPlayerCameras.DAYZCAMERA_3RD_JUMP` | 第三人称跳跃 |

### 获取当前相机类型

```c
DayZPlayer player = GetGame().GetPlayer();
if (player)
{
    int cameraType = player.GetCurrentCameraType();
    if (cameraType == DayZPlayerCameras.DAYZCAMERA_1ST)
    {
        Print("Player is in first person");
    }
}
```

---

## FreeDebugCamera

**文件：** `5_Mission/gui/scriptconsole/freedebugcamera.c`

用于调试和影视制作的自由飞行相机。在诊断版本中可用，或通过模组启用。

### 获取实例

```c
FreeDebugCamera GetFreeDebugCamera();
```

此全局函数返回自由相机的单例实例（如果不存在则返回 null）。

### 主要方法

```c
// 启用/禁用自由相机
static void SetActive(bool active);
static bool GetActive();

// 位置和朝向
vector GetPosition();
void   SetPosition(vector pos);
vector GetOrientation();
void   SetOrientation(vector ori);   // 偏航、俯仰、翻滚

// 速度
void SetFlySpeed(float speed);
float GetFlySpeed();

// 相机方向
vector GetDirection();
```

**示例 --- 激活自由相机并传送：**

```c
void ActivateDebugCamera(vector pos)
{
    FreeDebugCamera.SetActive(true);

    FreeDebugCamera cam = GetFreeDebugCamera();
    if (cam)
    {
        cam.SetPosition(pos);
        cam.SetOrientation(Vector(0, -30, 0));  // 略微向下看
        cam.SetFlySpeed(10.0);
    }
}
```

---

## 视场角（FOV）

引擎原生控制 FOV。你可以通过玩家相机系统读取和修改它：

### 读取 FOV

```c
// 获取当前相机 FOV
float fov = GetDayZGame().GetFieldOfView();
```

### DayZPlayerCamera FOV 覆盖

在继承自 `DayZPlayerCamera` 的自定义相机类中，你可以覆盖 FOV：

```c
class MyCustomCamera extends DayZPlayerCamera1stPerson
{
    override float GetCurrentFOV()
    {
        return 0.7854;  // 约 45 度（弧度）
    }
}
```

---

## 景深（DOF）

景深通过后处理效果系统控制（见[第 6.5 章](05-ppe.md)）。然而，相机系统通过以下机制与 DOF 配合工作：

### 通过 World 设置 DOF

```c
World world = GetGame().GetWorld();
if (world)
{
    // SetDOF(对焦距离, 对焦长度, 近端对焦长度, 模糊度, 对焦深度偏移)
    // 所有值以米为单位
    world.SetDOF(5.0, 100.0, 0.5, 0.3, 0.0);
}
```

### 禁用 DOF

```c
World world = GetGame().GetWorld();
if (world)
{
    world.SetDOF(0, 0, 0, 0, 0);  // 全部设为零可禁用 DOF
}
```

---

## ScriptCamera（GameLib）

**文件：** `2_GameLib/entities/scriptcamera.c`

GameLib 层的底层脚本化相机实体。这是自定义相机实现的基类。

### 创建相机

```c
ScriptCamera camera = ScriptCamera.Cast(
    GetGame().CreateObject("ScriptCamera", pos, true)  // 仅本地
);
```

### 主要方法

```c
proto native void SetFOV(float fov);          // FOV（弧度）
proto native void SetNearPlane(float nearPlane);
proto native void SetFarPlane(float farPlane);
proto native void SetFocus(float dist, float len);
```

### 激活相机

```c
// 使此相机成为活动渲染相机
GetGame().SelectPlayer(null, null);   // 从玩家分离
GetGame().ObjectRelease(camera);      // 释放给引擎
```

> **注意：** 从玩家相机切换出去需要仔细处理输入和 HUD。大多数模组使用自由调试相机或 PPE 叠加效果，而不是创建自定义相机。

---

## 从相机射线检测

一个常见模式是从相机位置沿相机方向进行射线检测，以找到玩家正在看的物体：

```c
Object GetObjectInCrosshair(float maxDistance)
{
    vector from = GetGame().GetCurrentCameraPosition();
    vector to = from + (GetGame().GetCurrentCameraDirection() * maxDistance);

    vector contactPos;
    vector contactDir;
    int contactComponent;
    set<Object> hitObjects = new set<Object>;

    if (DayZPhysics.RaycastRV(from, to, contactPos, contactDir,
                               contactComponent, hitObjects, null, null,
                               false, false, ObjIntersectView, 0.0))
    {
        if (hitObjects.Count() > 0)
            return hitObjects[0];
    }

    return null;
}
```

---

## 总结

| 概念 | 要点 |
|------|------|
| 全局访问器 | `GetCurrentCameraPosition()`, `GetCurrentCameraDirection()`, `GetScreenPos()` |
| 相机类型 | `DayZPlayerCameras` 常量（1ST, 3RD_ERC, IRONSIGHTS, OPTICS, VEHICLE 等） |
| 当前类型 | `player.GetCurrentCameraType()` |
| 自由相机 | `FreeDebugCamera.SetActive(true)`，然后 `GetFreeDebugCamera()` |
| FOV | `GetDayZGame().GetFieldOfView()` 读取，在相机类中覆盖 `GetCurrentFOV()` |
| DOF | `GetGame().GetWorld().SetDOF(focus, length, near, blur, offset)` |
| 屏幕转换 | `GetScreenPos(worldPos)` 返回像素 XY + 深度 Z |

---

## 最佳实践

- **在一帧内多次查询时缓存相机位置。** `GetGame().GetCurrentCameraPosition()` 和 `GetCurrentCameraDirection()` 是引擎调用 -- 如果在同一帧内多次计算需要使用，请将结果存储在局部变量中。
- **在放置 UI 前使用 `GetScreenPos()` 深度检查。** 在世界位置绘制 HUD 标记之前，始终验证 `screenPos[2] > 0`（在相机前方），否则标记会镜像显示在玩家身后。
- **避免为简单效果创建自定义 ScriptCamera 实例。** FreeDebugCamera 和 PPE 系统涵盖了大多数影视和视觉需求。自定义相机需要仔细的输入/HUD 管理，容易出问题。
- **尊重引擎的相机类型切换。** 除非你完全处理了玩家控制器状态，否则不要从脚本强制切换相机类型。意外的相机切换可能导致玩家移动锁定或不同步。
- **将自由相机使用限制在管理员/调试检查之后。** FreeDebugCamera 提供了类似上帝视角的世界检查功能。仅为经过验证的管理员或诊断版本启用它，以防止滥用。

---

## 兼容性与影响

- **多模组：** 相机访问器是只读全局函数，因此多个模组可以安全地同时读取相机状态。仅当两个模组都尝试激活 FreeDebugCamera 或自定义 ScriptCamera 实例时才会产生冲突。
- **性能：** `GetScreenPos()` 和 `GetCurrentCameraPosition()` 是轻量级引擎调用。从相机进行射线检测（`DayZPhysics.RaycastRV`）更耗费资源 -- 限制为每帧一次，而不是每个实体一次。
- **服务端/客户端：** 相机状态仅存在于客户端。所有相机方法在专用服务器上返回无意义的数据。切勿在服务端逻辑中使用相机查询。

---

[<< 上一章：天气](03-weather.md) | **相机** | [下一章：后处理效果 >>](05-ppe.md)
