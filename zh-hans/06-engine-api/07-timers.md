# 第 6.7 章：定时器与 CallQueue

[首页](../README.md) | [<< 上一章：通知系统](06-notifications.md) | **定时器与 CallQueue** | [下一章：文件 I/O 与 JSON >>](08-file-io.md)

---

## 简介

DayZ 提供了多种延迟和重复函数调用的机制：`ScriptCallQueue`（主要系统）、`Timer`、`ScriptInvoker` 和 `WidgetFadeTimer`。这些对于调度延迟逻辑、创建更新循环和管理定时事件至关重要，而不会阻塞主线程。本章介绍每种机制的完整 API 签名和使用模式。

---

## 调用类别

所有定时器和调用队列系统都需要一个**调用类别**，它决定了延迟调用在帧内何时执行：

```c
const int CALL_CATEGORY_SYSTEM   = 0;   // 系统级操作
const int CALL_CATEGORY_GUI      = 1;   // UI 更新
const int CALL_CATEGORY_GAMEPLAY = 2;   // 游戏玩法逻辑
const int CALL_CATEGORY_COUNT    = 3;   // 类别总数
```

访问某个类别的队列：

```c
ScriptCallQueue  queue   = GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY);
ScriptInvoker    updater = GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY);
TimerQueue       timers  = GetGame().GetTimerQueue(CALL_CATEGORY_GAMEPLAY);
```

---

## ScriptCallQueue

**文件：** `3_Game/tools/utilityclasses.c`

延迟函数调用的主要机制。支持一次性延迟、重复调用和立即下一帧执行。

### CallLater

```c
void CallLater(func fn, int delay = 0, bool repeat = false,
               void param1 = NULL, void param2 = NULL,
               void param3 = NULL, void param4 = NULL);
```

| 参数 | 描述 |
|------|------|
| `fn` | 要调用的函数（方法引用：`this.MyMethod`） |
| `delay` | 延迟毫秒数（0 = 下一帧） |
| `repeat` | `true` = 按 `delay` 间隔重复调用；`false` = 只调用一次 |
| `param1..4` | 传递给函数的可选参数 |

**示例 --- 一次性延迟：**

```c
// 5 秒后调用 MyFunction 一次
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.MyFunction, 5000, false);
```

**示例 --- 重复调用：**

```c
// 每 1 秒调用 UpdateLoop，重复执行
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.UpdateLoop, 1000, true);
```

**示例 --- 带参数：**

```c
void ShowMessage(string text, int color)
{
    Print(text);
}

// 2 秒后带参数调用
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(
    this.ShowMessage, 2000, false, "Hello!", ARGB(255, 255, 0, 0)
);
```

### Call

```c
void Call(func fn, void param1 = NULL, void param2 = NULL,
          void param3 = NULL, void param4 = NULL);
```

在下一帧执行函数（delay = 0，不重复）。是 `CallLater(fn, 0, false)` 的简写。

**示例：**

```c
// 下一帧执行
GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).Call(this.Initialize);
```

### CallByName

```c
void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false,
                Param par = null);
```

通过字符串名称调用方法。在方法引用不可直接获取时很有用。

**示例：**

```c
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallByName(
    myObject, "OnTimerExpired", 3000, false
);
```

### Remove

```c
void Remove(func fn);
```

移除已调度的调用。对于停止重复调用和防止对已销毁对象的调用至关重要。

**示例：**

```c
// 停止重复调用
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).Remove(this.UpdateLoop);
```

### RemoveByName

```c
void RemoveByName(Class obj, string fnName);
```

移除通过 `CallByName` 调度的调用。

### Tick

```c
void Tick(float timeslice);
```

由引擎在每帧内部调用。你不应该需要手动调用它。

---

## Timer

**文件：** `3_Game/tools/utilityclasses.c`

基于类的定时器，具有显式的启动/停止生命周期。对于需要暂停或重启的长期定时器更清晰。

### 构造函数

```c
void Timer(int category = CALL_CATEGORY_SYSTEM);
```

### Run

```c
void Run(float duration, Class obj, string fn_name, Param params = null, bool loop = false);
```

| 参数 | 描述 |
|------|------|
| `duration` | 以秒为单位的时间（不是毫秒！） |
| `obj` | 将调用其方法的对象 |
| `fn_name` | 方法名称字符串 |
| `params` | 带参数的可选 `Param` 对象 |
| `loop` | `true` = 每次持续时间后重复 |

**示例 --- 一次性定时器：**

```c
ref Timer m_Timer;

void StartTimer()
{
    m_Timer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_Timer.Run(5.0, this, "OnTimerComplete", null, false);
}

void OnTimerComplete()
{
    Print("Timer finished!");
}
```

**示例 --- 重复定时器：**

```c
ref Timer m_UpdateTimer;

void StartUpdateLoop()
{
    m_UpdateTimer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_UpdateTimer.Run(1.0, this, "OnUpdate", null, true);  // 每 1 秒
}

void StopUpdateLoop()
{
    if (m_UpdateTimer && m_UpdateTimer.IsRunning())
        m_UpdateTimer.Stop();
}
```

### Stop

```c
void Stop();
```

停止定时器。可以通过另一次 `Run()` 调用重新启动。

### IsRunning

```c
bool IsRunning();
```

如果定时器当前处于活动状态则返回 `true`。

### Pause

```c
void Pause();
```

暂停正在运行的定时器，保留剩余时间。可以用 `Continue()` 恢复定时器。

### Continue

```c
void Continue();
```

从中断处恢复暂停的定时器。

### IsPaused

```c
bool IsPaused();
```

如果定时器当前处于暂停状态则返回 `true`。

**示例 --- 暂停和恢复：**

```c
ref Timer m_Timer;

void StartTimer()
{
    m_Timer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_Timer.Run(10.0, this, "OnTimerComplete", null, false);
}

void TogglePause()
{
    if (m_Timer.IsPaused())
        m_Timer.Continue();
    else
        m_Timer.Pause();
}
```

### GetRemaining

```c
float GetRemaining();
```

返回剩余时间（秒）。

### GetDuration

```c
float GetDuration();
```

返回 `Run()` 设置的总持续时间。

---

## ScriptInvoker

**文件：** `3_Game/tools/utilityclasses.c`

事件/委托系统。`ScriptInvoker` 持有一组回调函数，当调用 `Invoke()` 时触发所有回调。这是 DayZ 中等同于 C# 事件或观察者模式的实现。

### Insert

```c
void Insert(func fn);
```

注册一个回调函数。

### Remove

```c
void Remove(func fn);
```

取消注册一个回调函数。

### Invoke

```c
void Invoke(void param1 = NULL, void param2 = NULL,
            void param3 = NULL, void param4 = NULL);
```

使用提供的参数调用所有已注册的函数。

### Count

```c
int Count();
```

已注册回调的数量。

### Clear

```c
void Clear();
```

移除所有已注册的回调。

**示例 --- 自定义事件系统：**

```c
class MyModule
{
    ref ScriptInvoker m_OnMissionComplete = new ScriptInvoker();

    void CompleteMission()
    {
        // 执行完成逻辑...

        // 通知所有监听者
        m_OnMissionComplete.Invoke("MissionAlpha", 1500);
    }
}

class MyUI
{
    void Init(MyModule module)
    {
        // 订阅事件
        module.m_OnMissionComplete.Insert(this.OnMissionComplete);
    }

    void OnMissionComplete(string name, int reward)
    {
        Print(string.Format("Mission %1 complete! Reward: %2", name, reward));
    }

    void Cleanup(MyModule module)
    {
        // 始终取消订阅以防止悬挂引用
        module.m_OnMissionComplete.Remove(this.OnMissionComplete);
    }
}
```

### 更新队列

引擎提供每帧 `ScriptInvoker` 队列：

```c
ScriptInvoker updater = GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY);
updater.Insert(this.OnFrame);

// 完成后移除
updater.Remove(this.OnFrame);
```

注册在更新队列上的函数每帧调用，不带参数。这对于不使用 `EntityEvent.FRAME` 的每帧逻辑很有用。

---

## WidgetFadeTimer

**文件：** `3_Game/tools/utilityclasses.c`

专门用于控件淡入淡出的定时器。

```c
class WidgetFadeTimer
{
    void FadeIn(Widget w, float time, bool continue_from_current = false);
    void FadeOut(Widget w, float time, bool continue_from_current = false);
    bool IsFading();
    void Stop();
}
```

| 参数 | 描述 |
|------|------|
| `w` | 要淡化的控件 |
| `time` | 淡化持续时间（秒） |
| `continue_from_current` | 如果为 `true`，从当前透明度开始；否则从 0（淡入）或 1（淡出）开始 |

**示例：**

```c
ref WidgetFadeTimer m_FadeTimer;
Widget m_NotificationPanel;

void ShowNotification()
{
    m_NotificationPanel.Show(true);
    m_FadeTimer = new WidgetFadeTimer;
    m_FadeTimer.FadeIn(m_NotificationPanel, 0.3);

    // 5 秒后自动隐藏
    GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(this.HideNotification, 5000, false);
}

void HideNotification()
{
    m_FadeTimer.FadeOut(m_NotificationPanel, 0.5);
}
```

---

## GetRemainingTime（CallQueue）

`ScriptCallQueue` 还提供了查询已调度 `CallLater` 剩余时间的方法：

```c
float GetRemainingTime(Class obj, string fnName);
```

**示例：**

```c
// 获取 CallLater 的剩余时间
float remaining = GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).GetRemainingTime(this, "MyCallback");
if (remaining > 0)
    Print(string.Format("Callback fires in %1 ms", remaining));
```

---

## 常用模式

### 定时器累加器（节流 OnUpdate）

当你有每帧回调但想以更慢的速率运行逻辑时：

```c
class MyModule
{
    protected float m_UpdateAccumulator;
    protected const float UPDATE_INTERVAL = 2.0;  // 每 2 秒

    void OnUpdate(float timeslice)
    {
        m_UpdateAccumulator += timeslice;
        if (m_UpdateAccumulator < UPDATE_INTERVAL)
            return;
        m_UpdateAccumulator = 0;

        // 节流后的逻辑
        DoPeriodicWork();
    }
}
```

### 清理模式

当对象被销毁时始终移除已调度的调用以防止崩溃：

```c
class MyManager
{
    void MyManager()
    {
        GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.Tick, 1000, true);
    }

    void ~MyManager()
    {
        GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).Remove(this.Tick);
    }

    void Tick()
    {
        // 周期性工作
    }
}
```

### 一次性延迟初始化

在世界完全加载后初始化系统的常见模式：

```c
void OnMissionStart()
{
    // 延迟 1 秒初始化以确保一切已加载
    GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(this.DelayedInit, 1000, false);
}

void DelayedInit()
{
    // 现在可以安全访问世界对象
}
```

---

## 总结

| 机制 | 用例 | 时间单位 |
|------|------|----------|
| `CallLater` | 一次性或重复的延迟调用 | 毫秒 |
| `Call` | 下一帧执行 | 无（立即） |
| `Timer` | 基于类的定时器，支持启动/停止/剩余时间 | 秒 |
| `ScriptInvoker` | 事件/委托（观察者模式） | 无（手动调用） |
| `WidgetFadeTimer` | 控件淡入/淡出 | 秒 |
| `GetUpdateQueue()` | 每帧回调注册 | 无（每帧） |

| 概念 | 要点 |
|------|------|
| 类别 | `CALL_CATEGORY_SYSTEM` (0)、`GUI` (1)、`GAMEPLAY` (2) |
| 移除调用 | 始终在析构函数中 `Remove()` 以防止悬挂引用 |
| Timer vs CallLater | Timer 使用秒 + 基于类；CallLater 使用毫秒 + 函数式 |
| ScriptInvoker | Insert/Remove 回调，Invoke 触发所有回调 |

---

## 最佳实践

- **始终在析构函数中 `Remove()` 已调度的 `CallLater` 调用。** 如果拥有对象在 `CallLater` 仍未执行时被销毁，引擎将在已删除的对象上调用方法并崩溃。每个 `CallLater` 必须在析构函数中有匹配的 `Remove()`。
- **对需要暂停/恢复的长期定时器使用 `Timer`（秒），对一次性延迟使用 `CallLater`（毫秒）。** 混淆它们会导致时间差 1000 倍的 bug，因为 `Timer.Run()` 使用秒而 `CallLater` 使用毫秒。
- **使用定时器累加器节流 `OnUpdate`，而非注册重复的 `CallLater`。** 重复的 `CallLater` 会在队列中创建单独的跟踪条目，而累加器模式（`m_Acc += timeslice; if (m_Acc >= INTERVAL)`）零开销且更容易调整。
- **在监听者被销毁前取消订阅 `ScriptInvoker` 回调。** 忘记对 `ScriptInvoker` 调用 `Remove()` 会留下悬挂的函数引用，当 `Invoke()` 触发时会崩溃。
- **永远不要手动调用 `ScriptCallQueue` 上的 `Tick()`。** 引擎每帧自动调用它。手动调用会双重触发所有待处理的回调。

---

## 兼容性与影响

> **模组兼容性：** 定时器系统是每实例的，因此模组很少在定时器上直接冲突。风险在于共享的 `ScriptInvoker` 事件，多个模组在其上注册回调。

- **加载顺序：** 定时器和 CallQueue 系统与加载顺序无关。每个模组管理自己的定时器。
- **Modded 类冲突：** 没有直接冲突，但如果两个模组都在同一个类（例如 `MissionServer`）上覆盖 `OnUpdate()` 且其中一个忘记了 `super`，另一个基于累加器的定时器就会停止工作。
- **性能影响：** 每个 `repeat = true` 的活动 `CallLater` 每帧都会被检查。数百个重复调用会降低服务器帧率。优先使用更少的定时器和更长的间隔，或在 `OnUpdate` 中使用累加器模式。
- **服务端/客户端：** `CallLater` 和 `Timer` 在两端都有效。游戏逻辑使用 `CALL_CATEGORY_GAMEPLAY`，UI 更新使用 `CALL_CATEGORY_GUI`（仅客户端），底层操作使用 `CALL_CATEGORY_SYSTEM`。

---

## 真实模组中的观察

> 这些模式已通过研究专业 DayZ 模组的源代码得到确认。

| 模式 | 模组 | 文件/位置 |
|------|------|-----------|
| 析构函数中对每个 `CallLater` 注册进行 `Remove()` 清理 | COT | 模块管理器生命周期 |
| 用于跨模块通知的 `ScriptInvoker` 事件总线 | Expansion | `ExpansionEventBus` |
| 带 `Pause()`/`Continue()` 的 `Timer` 用于登出倒计时 | 原版 | `MissionServer` 登出系统 |
| `OnUpdate` 中的累加器模式用于 5 秒周期性检查 | Dabs Framework | 模块滴答调度 |

---

[<< 上一章：通知系统](06-notifications.md) | **定时器与 CallQueue** | [下一章：文件 I/O 与 JSON >>](08-file-io.md)
