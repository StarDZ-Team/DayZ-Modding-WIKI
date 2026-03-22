# 引擎 API 快速参考

[首页](../README.md) | **引擎 API 快速参考**

---

> 最常用 DayZ 引擎方法的精简单页参考。有关详细说明和示例，请参阅各节标题中链接的完整章节。

---

## 目录

- [实体方法](#实体方法)
- [生命值与伤害](#生命值与伤害)
- [类型检查](#类型检查)
- [背包](#背包)
- [实体创建与删除](#实体创建与删除)
- [玩家方法](#玩家方法)
- [载具方法](#载具方法)
- [天气方法](#天气方法)
- [文件 I/O 方法](#文件-io-方法)
- [定时器与 CallQueue 方法](#定时器与-callqueue-方法)
- [控件创建方法](#控件创建方法)
- [RPC / 网络方法](#rpc--网络方法)
- [数学常量与方法](#数学常量与方法)
- [向量方法](#向量方法)
- [全局函数](#全局函数)
- [任务钩子](#任务钩子)
- [动作系统](#动作系统)

---

## 实体方法

*完整参考：[第 6.1 章：实体系统](01-entity-system.md)*

### 位置与朝向（Object）

| 方法 | 签名 | 描述 |
|------|------|------|
| `GetPosition` | `vector GetPosition()` | 世界位置 |
| `SetPosition` | `void SetPosition(vector pos)` | 设置世界位置 |
| `GetOrientation` | `vector GetOrientation()` | 偏航、俯仰、翻滚（角度） |
| `SetOrientation` | `void SetOrientation(vector ori)` | 设置偏航、俯仰、翻滚 |
| `GetDirection` | `vector GetDirection()` | 前方向量 |
| `SetDirection` | `void SetDirection(vector dir)` | 设置前方向 |
| `GetScale` | `float GetScale()` | 当前缩放 |
| `SetScale` | `void SetScale(float scale)` | 设置缩放 |

### 变换（IEntity）

| 方法 | 签名 | 描述 |
|------|------|------|
| `GetOrigin` | `vector GetOrigin()` | 世界位置（引擎级别） |
| `SetOrigin` | `void SetOrigin(vector orig)` | 设置世界位置（引擎级别） |
| `GetYawPitchRoll` | `vector GetYawPitchRoll()` | 以偏航/俯仰/翻滚表示的旋转 |
| `GetTransform` | `void GetTransform(out vector mat[4])` | 完整 4x3 变换矩阵 |
| `SetTransform` | `void SetTransform(vector mat[4])` | 设置完整变换 |
| `VectorToParent` | `vector VectorToParent(vector vec)` | 本地方向转世界方向 |
| `CoordToParent` | `vector CoordToParent(vector coord)` | 本地点转世界点 |
| `VectorToLocal` | `vector VectorToLocal(vector vec)` | 世界方向转本地方向 |
| `CoordToLocal` | `vector CoordToLocal(vector coord)` | 世界点转本地点 |

### 层级（IEntity）

| 方法 | 签名 | 描述 |
|------|------|------|
| `AddChild` | `void AddChild(IEntity child, int pivot, bool posOnly = false)` | 将子对象附加到骨骼 |
| `RemoveChild` | `void RemoveChild(IEntity child, bool keepTransform = false)` | 分离子对象 |
| `GetParent` | `IEntity GetParent()` | 父实体或 null |
| `GetChildren` | `IEntity GetChildren()` | 第一个子实体 |
| `GetSibling` | `IEntity GetSibling()` | 下一个兄弟实体 |

### 显示信息（Object）

| 方法 | 签名 | 描述 |
|------|------|------|
| `GetType` | `string GetType()` | 配置类名（例如 `"AKM"`） |
| `GetDisplayName` | `string GetDisplayName()` | 本地化显示名称 |
| `IsKindOf` | `bool IsKindOf(string type)` | 检查配置继承 |

### 骨骼位置（Object）

| 方法 | 签名 | 描述 |
|------|------|------|
| `GetBonePositionLS` | `vector GetBonePositionLS(int pivot)` | 本地空间骨骼位置 |
| `GetBonePositionMS` | `vector GetBonePositionMS(int pivot)` | 模型空间骨骼位置 |
| `GetBonePositionWS` | `vector GetBonePositionWS(int pivot)` | 世界空间骨骼位置 |

### 配置访问（Object）

| 方法 | 签名 | 描述 |
|------|------|------|
| `ConfigGetBool` | `bool ConfigGetBool(string entry)` | 从配置读取 bool |
| `ConfigGetInt` | `int ConfigGetInt(string entry)` | 从配置读取 int |
| `ConfigGetFloat` | `float ConfigGetFloat(string entry)` | 从配置读取 float |
| `ConfigGetString` | `string ConfigGetString(string entry)` | 从配置读取 string |
| `ConfigGetTextArray` | `void ConfigGetTextArray(string entry, out TStringArray values)` | 读取字符串数组 |
| `ConfigIsExisting` | `bool ConfigIsExisting(string entry)` | 检查配置条目是否存在 |

---

## 生命值与伤害

*完整参考：[第 6.1 章：实体系统](01-entity-system.md)*

| 方法 | 签名 | 描述 |
|------|------|------|
| `GetHealth` | `float GetHealth(string zone, string type)` | 获取生命值 |
| `GetMaxHealth` | `float GetMaxHealth(string zone, string type)` | 获取最大生命值 |
| `SetHealth` | `void SetHealth(string zone, string type, float value)` | 设置生命值 |
| `SetHealthMax` | `void SetHealthMax(string zone, string type)` | 设为最大值 |
| `AddHealth` | `void AddHealth(string zone, string type, float value)` | 增加生命值 |
| `DecreaseHealth` | `void DecreaseHealth(string zone, string type, float value, bool auto_delete = false)` | 减少生命值 |
| `SetAllowDamage` | `void SetAllowDamage(bool val)` | 启用/禁用伤害 |
| `GetAllowDamage` | `bool GetAllowDamage()` | 检查是否允许伤害 |
| `IsAlive` | `bool IsAlive()` | 存活检查（在 EntityAI 上使用） |
| `ProcessDirectDamage` | `void ProcessDirectDamage(int dmgType, EntityAI source, string component, string ammoType, vector modelPos, float coef = 1.0, int flags = 0)` | 应用伤害（EntityAI） |

**常用 zone/type 组合：** `("", "Health")` 全局，`("", "Blood")` 玩家血量，`("", "Shock")` 玩家休克，`("Engine", "Health")` 载具引擎。

---

## 类型检查

| 方法 | 类 | 描述 |
|------|---|------|
| `IsMan()` | Object | 这是玩家吗？ |
| `IsBuilding()` | Object | 这是建筑吗？ |
| `IsTransport()` | Object | 这是载具吗？ |
| `IsDayZCreature()` | Object | 这是生物（僵尸/动物）吗？ |
| `IsKindOf(string)` | Object | 配置继承检查 |
| `IsItemBase()` | EntityAI | 这是背包物品吗？ |
| `IsWeapon()` | EntityAI | 这是武器吗？ |
| `IsMagazine()` | EntityAI | 这是弹匣吗？ |
| `IsClothing()` | EntityAI | 这是衣物吗？ |
| `IsFood()` | EntityAI | 这是食物吗？ |
| `Class.CastTo(out, obj)` | Class | 安全向下转型（返回 bool） |
| `ClassName.Cast(obj)` | Class | 内联转型（失败返回 null） |

---

## 背包

*完整参考：[第 6.1 章：实体系统](01-entity-system.md)*

| 方法 | 签名 | 描述 |
|------|------|------|
| `GetInventory` | `GameInventory GetInventory()` | 获取背包组件（EntityAI） |
| `CreateInInventory` | `EntityAI CreateInInventory(string type)` | 在货物中创建物品 |
| `CreateEntityInCargo` | `EntityAI CreateEntityInCargo(string type)` | 在货物中创建物品 |
| `CreateAttachment` | `EntityAI CreateAttachment(string type)` | 作为附件创建物品 |
| `EnumerateInventory` | `void EnumerateInventory(int traversal, out array<EntityAI> items)` | 列出所有物品 |
| `CountInventory` | `int CountInventory()` | 计算物品数量 |
| `HasEntityInInventory` | `bool HasEntityInInventory(EntityAI item)` | 检查物品是否存在 |
| `AttachmentCount` | `int AttachmentCount()` | 附件数量 |
| `GetAttachmentFromIndex` | `EntityAI GetAttachmentFromIndex(int idx)` | 按索引获取附件 |
| `FindAttachmentByName` | `EntityAI FindAttachmentByName(string slot)` | 按插槽获取附件 |

---

## 实体创建与删除

*完整参考：[第 6.1 章：实体系统](01-entity-system.md)*

| 方法 | 签名 | 描述 |
|------|------|------|
| `CreateObject` | `Object GetGame().CreateObject(string type, vector pos, bool local = false, bool ai = false, bool physics = true)` | 创建实体 |
| `CreateObjectEx` | `Object GetGame().CreateObjectEx(string type, vector pos, int flags, int rotation = RF_DEFAULT)` | 使用 ECE 标志创建 |
| `ObjectDelete` | `void GetGame().ObjectDelete(Object obj)` | 服务端立即删除 |
| `ObjectDeleteOnClient` | `void GetGame().ObjectDeleteOnClient(Object obj)` | 仅客户端删除 |
| `Delete` | `void obj.Delete()` | 延迟删除（下一帧） |

### 常用 ECE 标志

| 标志 | 值 | 描述 |
|------|---|------|
| `ECE_NONE` | `0` | 无特殊行为 |
| `ECE_CREATEPHYSICS` | `1024` | 创建碰撞 |
| `ECE_INITAI` | `2048` | 初始化 AI |
| `ECE_EQUIP` | `24576` | 带附件和货物生成 |
| `ECE_PLACE_ON_SURFACE` | 组合值 | 物理 + 路径 + 射线检测 |
| `ECE_LOCAL` | `1073741824` | 仅客户端（不同步） |
| `ECE_NOLIFETIME` | `4194304` | 不会消失 |
| `ECE_KEEPHEIGHT` | `524288` | 保持 Y 位置 |

---

## 玩家方法

*完整参考：[第 6.1 章：实体系统](01-entity-system.md)*

| 方法 | 签名 | 描述 |
|------|------|------|
| `GetIdentity` | `PlayerIdentity GetIdentity()` | 玩家身份对象 |
| `GetIdentity().GetName()` | `string GetName()` | Steam/平台显示名 |
| `GetIdentity().GetId()` | `string GetId()` | BI 唯一 ID |
| `GetIdentity().GetPlainId()` | `string GetPlainId()` | Steam64 ID |
| `GetIdentity().GetPlayerId()` | `int GetPlayerId()` | 会话玩家 ID |
| `GetHumanInventory().GetEntityInHands()` | `EntityAI GetEntityInHands()` | 手中物品 |
| `GetDrivingVehicle` | `EntityAI GetDrivingVehicle()` | 正在驾驶的载具 |
| `IsAlive` | `bool IsAlive()` | 存活检查 |
| `IsUnconscious` | `bool IsUnconscious()` | 昏迷检查 |
| `IsRestrained` | `bool IsRestrained()` | 被束缚检查 |
| `IsInVehicle` | `bool IsInVehicle()` | 是否在载具中 |
| `SpawnEntityOnGroundOnCursorDir` | `EntityAI SpawnEntityOnGroundOnCursorDir(string type, float dist)` | 在玩家前方生成 |

---

## 载具方法

*完整参考：[第 6.2 章：载具系统](02-vehicles.md)*

### 乘员（Transport）

| 方法 | 签名 | 描述 |
|------|------|------|
| `CrewSize` | `int CrewSize()` | 总座位数 |
| `CrewMember` | `Human CrewMember(int idx)` | 获取座位上的人员 |
| `CrewMemberIndex` | `int CrewMemberIndex(Human member)` | 获取人员的座位 |
| `CrewGetOut` | `void CrewGetOut(int idx)` | 强制弹出座位 |
| `CrewDeath` | `void CrewDeath(int idx)` | 击杀乘员 |

### 引擎（Car）

| 方法 | 签名 | 描述 |
|------|------|------|
| `EngineIsOn` | `bool EngineIsOn()` | 引擎是否运行？ |
| `EngineStart` | `void EngineStart()` | 启动引擎 |
| `EngineStop` | `void EngineStop()` | 停止引擎 |
| `EngineGetRPM` | `float EngineGetRPM()` | 当前转速 |
| `EngineGetRPMRedline` | `float EngineGetRPMRedline()` | 红线转速 |
| `GetGear` | `int GetGear()` | 当前档位 |
| `GetSpeedometer` | `float GetSpeedometer()` | 速度（千米/时） |

### 流体（Car）

| 方法 | 签名 | 描述 |
|------|------|------|
| `GetFluidCapacity` | `float GetFluidCapacity(CarFluid fluid)` | 最大容量 |
| `GetFluidFraction` | `float GetFluidFraction(CarFluid fluid)` | 填充水平 0.0-1.0 |
| `Fill` | `void Fill(CarFluid fluid, float amount)` | 添加流体 |
| `Leak` | `void Leak(CarFluid fluid, float amount)` | 移除流体 |
| `LeakAll` | `void LeakAll(CarFluid fluid)` | 排空所有流体 |

**CarFluid 枚举：** `FUEL`, `OIL`, `BRAKE`, `COOLANT`

### 控制（Car）

| 方法 | 签名 | 描述 |
|------|------|------|
| `SetBrake` | `void SetBrake(float value, int wheel = -1)` | 0.0-1.0，-1 = 所有车轮 |
| `SetHandbrake` | `void SetHandbrake(float value)` | 0.0-1.0 |
| `SetSteering` | `void SetSteering(float value, bool analog = true)` | 转向输入 |
| `SetThrust` | `void SetThrust(float value, int wheel = -1)` | 0.0-1.0 油门 |

---

## 天气方法

*完整参考：[第 6.3 章：天气系统](03-weather.md)*

### 访问

| 方法 | 签名 | 描述 |
|------|------|------|
| `GetGame().GetWeather()` | `Weather GetWeather()` | 获取天气单例 |

### 现象（Weather）

| 方法 | 签名 | 描述 |
|------|------|------|
| `GetOvercast` | `WeatherPhenomenon GetOvercast()` | 云量 |
| `GetRain` | `WeatherPhenomenon GetRain()` | 降雨 |
| `GetFog` | `WeatherPhenomenon GetFog()` | 雾 |
| `GetSnowfall` | `WeatherPhenomenon GetSnowfall()` | 降雪 |
| `GetWindMagnitude` | `WeatherPhenomenon GetWindMagnitude()` | 风速 |
| `GetWindDirection` | `WeatherPhenomenon GetWindDirection()` | 风向 |
| `GetWind` | `vector GetWind()` | 风向向量 |
| `GetWindSpeed` | `float GetWindSpeed()` | 风速（米/秒） |
| `SetStorm` | `void SetStorm(float density, float threshold, float timeout)` | 闪电配置 |

### WeatherPhenomenon

| 方法 | 签名 | 描述 |
|------|------|------|
| `GetActual` | `float GetActual()` | 当前插值后的值 |
| `GetForecast` | `float GetForecast()` | 目标值 |
| `GetDuration` | `float GetDuration()` | 剩余持续时间（秒） |
| `Set` | `void Set(float forecast, float time = 0, float minDuration = 0)` | 设置目标（仅服务端） |
| `SetLimits` | `void SetLimits(float min, float max)` | 值范围限制 |
| `SetTimeLimits` | `void SetTimeLimits(float min, float max)` | 变化速度限制 |
| `SetChangeLimits` | `void SetChangeLimits(float min, float max)` | 变化幅度限制 |

---

## 文件 I/O 方法

*完整参考：[第 6.8 章：文件 I/O 与 JSON](08-file-io.md)*

### 路径前缀

| 前缀 | 位置 | 可写 |
|------|------|------|
| `$profile:` | 服务端/客户端配置目录 | 是 |
| `$saves:` | 存档目录 | 是 |
| `$mission:` | 当前任务文件夹 | 通常只读 |
| `$CurrentDir:` | 工作目录 | 视情况而定 |

### 文件操作

| 方法 | 签名 | 描述 |
|------|------|------|
| `FileExist` | `bool FileExist(string path)` | 检查文件是否存在 |
| `MakeDirectory` | `bool MakeDirectory(string path)` | 创建目录 |
| `OpenFile` | `FileHandle OpenFile(string path, FileMode mode)` | 打开文件（0 = 失败） |
| `CloseFile` | `void CloseFile(FileHandle fh)` | 关闭文件 |
| `FPrint` | `void FPrint(FileHandle fh, string text)` | 写入文本（无换行） |
| `FPrintln` | `void FPrintln(FileHandle fh, string text)` | 写入文本 + 换行 |
| `FGets` | `int FGets(FileHandle fh, string line)` | 读取一行 |
| `ReadFile` | `string ReadFile(FileHandle fh)` | 读取整个文件 |
| `DeleteFile` | `bool DeleteFile(string path)` | 删除文件 |
| `CopyFile` | `bool CopyFile(string src, string dst)` | 复制文件 |

### JSON（JsonFileLoader）

| 方法 | 签名 | 描述 |
|------|------|------|
| `JsonLoadFile` | `void JsonFileLoader<T>.JsonLoadFile(string path, T obj)` | 将 JSON 加载到对象中（**返回 void**） |
| `JsonSaveFile` | `void JsonFileLoader<T>.JsonSaveFile(string path, T obj)` | 将对象保存为 JSON |

### FileMode 枚举

| 值 | 描述 |
|---|------|
| `FileMode.READ` | 以读取方式打开 |
| `FileMode.WRITE` | 以写入方式打开（创建/覆盖） |
| `FileMode.APPEND` | 以追加方式打开 |

---

## 定时器与 CallQueue 方法

*完整参考：[第 6.7 章：定时器与 CallQueue](07-timers.md)*

### 访问

| 表达式 | 返回值 | 描述 |
|--------|--------|------|
| `GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptCallQueue` | 游戏玩法调用队列 |
| `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)` | `ScriptCallQueue` | 系统调用队列 |
| `GetGame().GetCallQueue(CALL_CATEGORY_GUI)` | `ScriptCallQueue` | GUI 调用队列 |
| `GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY)` | `ScriptInvoker` | 每帧更新队列 |

### ScriptCallQueue

| 方法 | 签名 | 描述 |
|------|------|------|
| `CallLater` | `void CallLater(func fn, int delay = 0, bool repeat = false, param1..4)` | 调度延迟/重复调用 |
| `Call` | `void Call(func fn, param1..4)` | 下一帧执行 |
| `CallByName` | `void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false, Param par = null)` | 按字符串名称调用方法 |
| `Remove` | `void Remove(func fn)` | 取消已调度的调用 |
| `RemoveByName` | `void RemoveByName(Class obj, string fnName)` | 按字符串名称取消 |
| `GetRemainingTime` | `float GetRemainingTime(Class obj, string fnName)` | 获取 CallLater 的剩余时间 |

### Timer 类

| 方法 | 签名 | 描述 |
|------|------|------|
| `Timer()` | `void Timer(int category = CALL_CATEGORY_SYSTEM)` | 构造函数 |
| `Run` | `void Run(float duration, Class obj, string fnName, Param params = null, bool loop = false)` | 启动定时器 |
| `Stop` | `void Stop()` | 停止定时器 |
| `Pause` | `void Pause()` | 暂停定时器 |
| `Continue` | `void Continue()` | 恢复定时器 |
| `IsPaused` | `bool IsPaused()` | 定时器是否暂停？ |
| `IsRunning` | `bool IsRunning()` | 定时器是否活动？ |
| `GetRemaining` | `float GetRemaining()` | 剩余秒数 |

### ScriptInvoker

| 方法 | 签名 | 描述 |
|------|------|------|
| `Insert` | `void Insert(func fn)` | 注册回调 |
| `Remove` | `void Remove(func fn)` | 取消注册回调 |
| `Invoke` | `void Invoke(params...)` | 触发所有回调 |
| `Count` | `int Count()` | 已注册回调数 |
| `Clear` | `void Clear()` | 移除所有回调 |

---

## 控件创建方法

*完整参考：[第 3.5 章：编程创建](../03-gui-system/05-programmatic-widgets.md)*

| 方法 | 签名 | 描述 |
|------|------|------|
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | 获取 UI 工作区 |
| `CreateWidgets` | `Widget CreateWidgets(string layout, Widget parent = null)` | 加载 .layout 文件 |
| `FindAnyWidget` | `Widget FindAnyWidget(string name)` | 按名称查找子控件（递归） |
| `Show` | `void Show(bool show)` | 显示/隐藏控件 |
| `SetText` | `void TextWidget.SetText(string text)` | 设置文本内容 |
| `SetImage` | `void ImageWidget.SetImage(int index)` | 设置图片索引 |
| `SetColor` | `void SetColor(int color)` | 设置控件颜色（ARGB） |
| `SetAlpha` | `void SetAlpha(float alpha)` | 设置透明度 0.0-1.0 |
| `SetSize` | `void SetSize(float x, float y, bool relative = false)` | 设置控件大小 |
| `SetPos` | `void SetPos(float x, float y, bool relative = false)` | 设置控件位置 |
| `GetScreenSize` | `void GetScreenSize(out float x, out float y)` | 屏幕分辨率 |
| `Destroy` | `void Widget.Destroy()` | 移除并销毁控件 |

### ARGB 颜色辅助函数

| 函数 | 签名 | 描述 |
|------|------|------|
| `ARGB` | `int ARGB(int a, int r, int g, int b)` | 创建颜色整数（每个 0-255） |
| `ARGBF` | `int ARGBF(float a, float r, float g, float b)` | 创建颜色整数（每个 0.0-1.0） |

---

## RPC / 网络方法

*完整参考：[第 6.9 章：网络与 RPC](09-networking.md)*

### 环境检查

| 方法 | 签名 | 描述 |
|------|------|------|
| `GetGame().IsServer()` | `bool IsServer()` | 在服务端/监听服务器主机上为 true |
| `GetGame().IsClient()` | `bool IsClient()` | 在客户端为 true |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | 在多人游戏中为 true |
| `GetGame().IsDedicatedServer()` | `bool IsDedicatedServer()` | 仅在专用服务器上为 true |

### ScriptRPC

| 方法 | 签名 | 描述 |
|------|------|------|
| `ScriptRPC()` | `void ScriptRPC()` | 构造函数 |
| `Write` | `bool Write(void value)` | 序列化一个值（int, float, bool, string, vector, array） |
| `Send` | `void Send(Object target, int rpc_type, bool guaranteed, PlayerIdentity recipient = null)` | 发送 RPC |
| `Reset` | `void Reset()` | 清除已写入的数据 |

### 接收（在 Object 上覆盖）

| 方法 | 签名 | 描述 |
|------|------|------|
| `OnRPC` | `void OnRPC(PlayerIdentity sender, int rpc_type, ParamsReadContext ctx)` | RPC 接收处理器 |

### ParamsReadContext

| 方法 | 签名 | 描述 |
|------|------|------|
| `Read` | `bool Read(out void value)` | 反序列化一个值（与 Write 相同的类型） |

### 传统 RPC（CGame）

| 方法 | 签名 | 描述 |
|------|------|------|
| `RPCSingleParam` | `void GetGame().RPCSingleParam(Object target, int rpc, Param param, bool guaranteed, PlayerIdentity recipient = null)` | 发送单个 Param 对象 |
| `RPC` | `void GetGame().RPC(Object target, int rpc, array<Param> params, bool guaranteed, PlayerIdentity recipient = null)` | 发送多个 Params |

### ScriptInputUserData（输入验证）

| 方法 | 签名 | 描述 |
|------|------|------|
| `CanStoreInputUserData` | `bool ScriptInputUserData.CanStoreInputUserData()` | 检查队列是否有空间 |
| `Write` | `bool Write(void value)` | 序列化值 |
| `Send` | `void Send()` | 发送到服务端（仅客户端） |

---

## 数学常量与方法

*完整参考：[第 1.7 章：数学与向量](../01-enforce-script/07-math-vectors.md)*

### 常量

| 常量 | 值 | 描述 |
|------|---|------|
| `Math.PI` | `3.14159...` | 圆周率 |
| `Math.PI2` | `6.28318...` | 2 * Pi |
| `Math.PI_HALF` | `1.57079...` | Pi / 2 |
| `Math.DEG2RAD` | `0.01745...` | 角度转弧度乘数 |
| `Math.RAD2DEG` | `57.2957...` | 弧度转角度乘数 |
| `int.MAX` | `2147483647` | 最大整数 |
| `int.MIN` | `-2147483648` | 最小整数 |
| `float.MAX` | `3.4028e+38` | 最大浮点数 |
| `float.MIN` | `1.175e-38` | 最小正浮点数 |

### 随机数

| 方法 | 签名 | 描述 |
|------|------|------|
| `Math.RandomInt` | `int RandomInt(int min, int max)` | 随机整数 [min, max) |
| `Math.RandomIntInclusive` | `int RandomIntInclusive(int min, int max)` | 随机整数 [min, max] |
| `Math.RandomFloat01` | `float RandomFloat01()` | 随机浮点数 [0, 1] |
| `Math.RandomBool` | `bool RandomBool()` | 随机 true/false |

### 四舍五入

| 方法 | 签名 | 描述 |
|------|------|------|
| `Math.Round` | `float Round(float f)` | 四舍五入到最近 |
| `Math.Floor` | `float Floor(float f)` | 向下取整 |
| `Math.Ceil` | `float Ceil(float f)` | 向上取整 |

### 限制与插值

| 方法 | 签名 | 描述 |
|------|------|------|
| `Math.Clamp` | `float Clamp(float val, float min, float max)` | 限制在范围内 |
| `Math.Min` | `float Min(float a, float b)` | 两者中的最小值 |
| `Math.Max` | `float Max(float a, float b)` | 两者中的最大值 |
| `Math.Lerp` | `float Lerp(float a, float b, float t)` | 线性插值 |
| `Math.InverseLerp` | `float InverseLerp(float a, float b, float val)` | 反向线性插值 |

### 绝对值与幂

| 方法 | 签名 | 描述 |
|------|------|------|
| `Math.AbsFloat` | `float AbsFloat(float f)` | 绝对值（浮点数） |
| `Math.AbsInt` | `int AbsInt(int i)` | 绝对值（整数） |
| `Math.Pow` | `float Pow(float base, float exp)` | 幂 |
| `Math.Sqrt` | `float Sqrt(float f)` | 平方根 |
| `Math.SqrFloat` | `float SqrFloat(float f)` | 平方（f * f） |

### 三角函数（弧度）

| 方法 | 签名 | 描述 |
|------|------|------|
| `Math.Sin` | `float Sin(float rad)` | 正弦 |
| `Math.Cos` | `float Cos(float rad)` | 余弦 |
| `Math.Tan` | `float Tan(float rad)` | 正切 |
| `Math.Asin` | `float Asin(float val)` | 反正弦 |
| `Math.Acos` | `float Acos(float val)` | 反余弦 |
| `Math.Atan2` | `float Atan2(float y, float x)` | 从分量计算角度 |

### 平滑阻尼

| 方法 | 签名 | 描述 |
|------|------|------|
| `Math.SmoothCD` | `float SmoothCD(float val, float target, inout float velocity, float smoothTime, float maxSpeed, float dt)` | 平滑趋近目标（类似 Unity 的 SmoothDamp） |

```c
// 平滑阻尼用法
// val：当前值，target：目标值，velocity：引用速度（在调用间持久化）
// smoothTime：平滑时间，maxSpeed：速度上限，dt：增量时间
float m_Velocity = 0;
float result = Math.SmoothCD(current, target, m_Velocity, 0.3, 1000.0, dt);
```

### 角度

| 方法 | 签名 | 描述 |
|------|------|------|
| `Math.NormalizeAngle` | `float NormalizeAngle(float deg)` | 归一化到 0-360 |

---

## 向量方法

| 方法 | 签名 | 描述 |
|------|------|------|
| `vector.Distance` | `float Distance(vector a, vector b)` | 两点间距离 |
| `vector.DistanceSq` | `float DistanceSq(vector a, vector b)` | 距离的平方（更快） |
| `vector.Direction` | `vector Direction(vector from, vector to)` | 方向向量 |
| `vector.Dot` | `float Dot(vector a, vector b)` | 点积 |
| `vector.Lerp` | `vector Lerp(vector a, vector b, float t)` | 位置插值 |
| `v.Length()` | `float Length()` | 向量长度 |
| `v.LengthSq()` | `float LengthSq()` | 长度的平方（更快） |
| `v.Normalized()` | `vector Normalized()` | 单位向量 |
| `v.VectorToAngles()` | `vector VectorToAngles()` | 方向转偏航/俯仰 |
| `v.AnglesToVector()` | `vector AnglesToVector()` | 偏航/俯仰转方向 |
| `v.Multiply3` | `vector Multiply3(vector mat[3])` | 矩阵乘法 |
| `v.InvMultiply3` | `vector InvMultiply3(vector mat[3])` | 逆矩阵乘法 |
| `Vector(x, y, z)` | `vector Vector(float x, float y, float z)` | 创建向量 |

---

## 全局函数

| 函数 | 签名 | 描述 |
|------|------|------|
| `GetGame()` | `CGame GetGame()` | 游戏实例 |
| `GetGame().GetPlayer()` | `Man GetPlayer()` | 本地玩家（仅客户端） |
| `GetGame().GetPlayers(out arr)` | `void GetPlayers(out array<Man> arr)` | 所有玩家（服务端） |
| `GetGame().GetWorld()` | `World GetWorld()` | 世界实例 |
| `GetGame().GetTickTime()` | `float GetTickTime()` | 服务器时间（秒） |
| `GetGame().GetWorkspace()` | `WorkspaceWidget GetWorkspace()` | UI 工作区 |
| `GetGame().SurfaceY(x, z)` | `float SurfaceY(float x, float z)` | 指定位置的地形高度 |
| `GetGame().SurfaceGetType(x, z)` | `string SurfaceGetType(float x, float z)` | 地表材质类型 |
| `GetGame().GetObjectsAtPosition(pos, radius, objects, proxyCargo)` | `void GetObjectsAtPosition(vector pos, float radius, out array<Object> objects, out array<CargoBase> proxyCargo)` | 查找附近物体 |
| `GetScreenSize(w, h)` | `void GetScreenSize(out int w, out int h)` | 获取屏幕分辨率 |
| `GetGame().IsServer()` | `bool IsServer()` | 服务端检查 |
| `GetGame().IsClient()` | `bool IsClient()` | 客户端检查 |
| `GetGame().IsMultiplayer()` | `bool IsMultiplayer()` | 多人游戏检查 |
| `Print(string)` | `void Print(string msg)` | 写入脚本日志 |
| `ErrorEx(string)` | `void ErrorEx(string msg, ErrorExSeverity sev = ERROR)` | 带严重级别的日志错误 |
| `DumpStackString()` | `string DumpStackString()` | 获取调用栈字符串 |
| `string.Format(fmt, ...)` | `string Format(string fmt, ...)` | 格式化字符串（`%1`..`%9`） |

---

## 任务钩子

*完整参考：[第 6.11 章：任务钩子](11-mission-hooks.md)*

### 服务端（modded MissionServer）

| 方法 | 描述 |
|------|------|
| `override void OnInit()` | 初始化管理器，注册 RPC |
| `override void OnMissionStart()` | 所有模组加载后 |
| `override void OnUpdate(float timeslice)` | 每帧（使用累加器！） |
| `override void OnMissionFinish()` | 清理单例，取消订阅事件 |
| `override void OnEvent(EventType eventTypeId, Param params)` | 聊天、语音事件 |
| `override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)` | 玩家加入 |
| `override void InvokeOnDisconnect(PlayerBase player)` | 玩家离开 |
| `override void OnClientReadyEvent(int peerId, PlayerIdentity identity)` | 客户端准备好接收数据 |
| `override void PlayerRegistered(int peerId)` | 身份已注册 |

### 客户端（modded MissionGameplay）

| 方法 | 描述 |
|------|------|
| `override void OnInit()` | 初始化客户端管理器，创建 HUD |
| `override void OnUpdate(float timeslice)` | 客户端每帧更新 |
| `override void OnMissionFinish()` | 清理 |
| `override void OnKeyPress(int key)` | 按键按下 |
| `override void OnKeyRelease(int key)` | 按键释放 |

---

## 动作系统

*完整参考：[第 6.12 章：动作系统](12-action-system.md)*

### 在物品上注册动作

```c
override void SetActions()
{
    super.SetActions();
    AddAction(MyAction);           // 添加自定义动作
    RemoveAction(ActionEat);       // 移除原版动作
}
```

### ActionBase 关键方法

| 方法 | 描述 |
|------|------|
| `override void CreateConditionComponents()` | 设置 CCINone/CCTNone 距离条件 |
| `override bool ActionCondition(...)` | 自定义验证逻辑 |
| `override void OnExecuteServer(ActionData action_data)` | 服务端执行 |
| `override void OnExecuteClient(ActionData action_data)` | 客户端效果 |
| `override string GetText()` | 显示名称（支持 `#STR_` 键） |

---

*完整文档：[首页](../README.md) | [速查表](../cheatsheet.md) | [实体系统](01-entity-system.md) | [载具](02-vehicles.md) | [天气](03-weather.md) | [定时器](07-timers.md) | [文件 I/O](08-file-io.md) | [网络](09-networking.md) | [任务钩子](11-mission-hooks.md) | [动作系统](12-action-system.md)*
