# 第 6.3 章：天气系统

[首页](../README.md) | [<< 上一章：载具](02-vehicles.md) | **天气** | [下一章：相机 >>](04-cameras.md)

---

## 简介

DayZ 拥有一个完全动态的天气系统，通过 `Weather` 类进行控制。该系统管理云量、降雨、降雪、雾、风和雷暴。天气可以通过脚本（Weather API）、任务文件夹中的 `cfgweather.xml` 或脚本化的天气状态机进行配置。本章介绍用于以编程方式读取和控制天气的脚本 API。

---

## 访问 Weather 对象

```c
Weather weather = GetGame().GetWeather();
```

`Weather` 对象是由引擎管理的单例。它在游戏世界初始化后始终可用。

---

## 天气现象

每种天气现象（云量、雾、雨、雪、风速、风向）都由一个 `WeatherPhenomenon` 对象表示。你可以通过 `Weather` 上的 getter 方法来访问它们。

### 获取现象对象

```c
proto native WeatherPhenomenon GetOvercast();
proto native WeatherPhenomenon GetFog();
proto native WeatherPhenomenon GetRain();
proto native WeatherPhenomenon GetSnowfall();
proto native WeatherPhenomenon GetWindMagnitude();
proto native WeatherPhenomenon GetWindDirection();
```

### WeatherPhenomenon API

每种现象共享相同的接口：

```c
class WeatherPhenomenon
{
    // 当前状态
    proto native float GetActual();          // 当前插值后的值（大多数为 0.0 - 1.0）
    proto native float GetForecast();        // 正在插值趋近的目标值
    proto native float GetDuration();        // 当前预报持续的时间（秒）

    // 设置预报（仅服务端）
    proto native void Set(float forecast, float time = 0, float minDuration = 0);
    // forecast：目标值
    // time：插值到该值的秒数（0 = 即时）
    // minDuration：值在自动更改前保持的最短时间

    // 限制
    proto native void  SetLimits(float fnMin, float fnMax);
    proto native float GetMin();
    proto native float GetMax();

    // 变化速度限制（现象变化的快慢）
    proto native void SetTimeLimits(float fnMin, float fnMax);

    // 变化幅度限制
    proto native void SetChangeLimits(float fnMin, float fnMax);
}
```

**示例 --- 读取当前天气状态：**

```c
Weather w = GetGame().GetWeather();
float overcast  = w.GetOvercast().GetActual();
float rain      = w.GetRain().GetActual();
float fog       = w.GetFog().GetActual();
float snow      = w.GetSnowfall().GetActual();
float windSpeed = w.GetWindMagnitude().GetActual();
float windDir   = w.GetWindDirection().GetActual();

Print(string.Format("Overcast: %1, Rain: %2, Fog: %3", overcast, rain, fog));
```

**示例 --- 强制晴天（服务端）：**

```c
void ForceClearWeather()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(0.0, 30, 600);    // 晴朗天空，30秒过渡，保持10分钟
    w.GetRain().Set(0.0, 10, 600);        // 无雨
    w.GetFog().Set(0.0, 30, 600);         // 无雾
    w.GetSnowfall().Set(0.0, 10, 600);    // 无雪
}
```

**示例 --- 制造暴风雨：**

```c
void ForceStorm()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(1.0, 60, 1800);   // 完全多云，60秒渐变，保持30分钟
    w.GetRain().Set(0.8, 120, 1800);      // 大雨
    w.GetFog().Set(0.3, 120, 1800);       // 轻雾
    w.GetWindMagnitude().Set(15.0, 60, 1800);  // 强风（米/秒）
}
```

---

## 降雨阈值

降雨与云量水平相关。只有当云量超过阈值时，引擎才会渲染雨。你可以通过 `cfgweather.xml` 配置：

```xml
<rain>
    <thresholds min="0.5" max="1.0" end="120" />
</rain>
```

- `min` / `max`：允许降雨的云量范围
- `end`：如果云量低于阈值，雨停止所需的秒数

在脚本中，如果云量过低，即使 `GetRain().GetActual()` 返回非零值，雨也不会在视觉上出现。

---

## 风

风使用两种现象：风速（米/秒）和方向（弧度角度）。

### 风向量

```c
proto native vector GetWind();           // 风向向量（世界空间）
proto native float  GetWindSpeed();      // 风速（米/秒）
```

**示例 --- 获取风信息：**

```c
Weather w = GetGame().GetWeather();
vector windVec = w.GetWind();
float windSpd = w.GetWindSpeed();
Print(string.Format("Wind: %1 m/s, direction: %2", windSpd, windVec));
```

---

## 雷暴（闪电）

```c
proto native void SetStorm(float density, float threshold, float timeout);
```

| 参数 | 描述 |
|------|------|
| `density` | 闪电密度（0.0 - 1.0） |
| `threshold` | 闪电出现所需的最低云量水平（0.0 - 1.0） |
| `timeout` | 闪电间隔时间（秒） |

**示例 --- 启用频繁闪电：**

```c
GetGame().GetWeather().SetStorm(1.0, 0.6, 10);
// 最大密度，60% 云量时触发，每 10 秒一次闪电
```

---

## MissionWeather 控制

要手动控制天气（禁用自动天气状态机），调用：

```c
proto native void MissionWeather(bool use);
```

当调用 `MissionWeather(true)` 时，引擎会停止自动天气转换，只有你的脚本驱动的 `Set()` 调用才能控制天气。

**示例 --- 在 init.c 中完全手动控制：**

```c
void main()
{
    // 接管天气手动控制
    GetGame().GetWeather().MissionWeather(true);

    // 设置所需天气
    GetGame().GetWeather().GetOvercast().Set(0.3, 0, 0);
    GetGame().GetWeather().GetRain().Set(0.0, 0, 0);
    GetGame().GetWeather().GetFog().Set(0.1, 0, 0);
}
```

---

## 日期与时间

游戏日期和时间影响光照、太阳位置和昼夜循环。这些通过 `World` 对象控制，而非 `Weather`，但它们密切相关。

### 获取当前日期/时间

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
```

### 设置日期/时间（仅服务端）

```c
proto native void SetDate(int year, int month, int day, int hour, int minute);
```

**示例 --- 设置时间为中午：**

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
GetGame().GetWorld().SetDate(year, month, day, 12, 0);
```

### 时间加速

时间加速在 `serverDZ.cfg` 中通过以下方式配置：

```
serverTimeAcceleration = 12;      // 12倍现实时间
serverNightTimeAcceleration = 4;  // 夜间4倍加速
```

在脚本中，你可以读取当前的时间倍率，但通常无法在运行时更改它。

---

## WorldData 天气状态机

原版 DayZ 在 `WorldData` 类中使用脚本化的天气状态机（例如 `ChernarusPlusData`、`EnochData`、`SakhalData`）。关键覆盖点是：

```c
class WorldData
{
    void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual, float change,
                                float time);
}
```

在 `modded` WorldData 类中覆盖此方法以拦截和修改天气转换：

```c
modded class ChernarusPlusData
{
    override void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual,
                                         float change, float time)
    {
        super.WeatherOnBeforeChange(type, actual, change, time);

        // 防止雨量超过 0.5
        if (type == EWeatherPhenomenon.RAIN && change > 0.5)
        {
            GetGame().GetWeather().GetRain().Set(0.5, time, 300);
        }
    }
}
```

---

## cfgweather.xml

任务文件夹中的 `cfgweather.xml` 文件提供了一种无需脚本即可配置天气的声明式方式。如果存在，它会覆盖默认的天气状态机参数。

关键结构：

```xml
<weather reset="0" enable="1">
    <overcast>
        <current actual="0.45" time="120" duration="240" />
        <limits min="0.0" max="1.0" />
        <timelimits min="900" max="1800" />
        <changelimits min="0.0" max="1.0" />
    </overcast>
    <fog>...</fog>
    <rain>
        ...
        <thresholds min="0.5" max="1.0" end="120" />
    </rain>
    <snowfall>...</snowfall>
    <windMagnitude>...</windMagnitude>
    <windDirection>...</windDirection>
    <storm density="1.0" threshold="0.7" timeout="25"/>
</weather>
```

| 属性 | 描述 |
|------|------|
| `reset` | 是否在服务器启动时从存储中重置天气 |
| `enable` | 此文件是否激活 |
| `actual` | 初始值 |
| `time` | 达到初始值的秒数 |
| `duration` | 初始值保持的秒数 |
| `limits min/max` | 现象值的范围 |
| `timelimits min/max` | 过渡持续时间的范围（秒） |
| `changelimits min/max` | 每次过渡的变化幅度范围 |

---

## 总结

| 概念 | 要点 |
|------|------|
| 访问 | `GetGame().GetWeather()` 返回 `Weather` 单例 |
| 现象 | `GetOvercast()`, `GetRain()`, `GetFog()`, `GetSnowfall()`, `GetWindMagnitude()`, `GetWindDirection()` |
| 读取 | `phenomenon.GetActual()` 获取当前值（0.0 - 1.0） |
| 写入 | `phenomenon.Set(forecast, transitionTime, holdDuration)`（仅服务端） |
| 暴风雨 | `SetStorm(density, threshold, timeout)` |
| 手动模式 | `MissionWeather(true)` 禁用自动天气变化 |
| 日期/时间 | `GetGame().GetWorld().GetDate()` / `SetDate()` |
| 配置文件 | 任务文件夹中的 `cfgweather.xml` 用于声明式设置 |

---

## 最佳实践

- **在 `init.c` 中设置天气前调用 `MissionWeather(true)`。** 如果不这样做，自动天气状态机会在几秒内覆盖你的 `Set()` 调用。如果你想要确定性的天气，请先接管手动控制。
- **始终在 `Set()` 中提供 `minDuration` 参数。** 将 `minDuration` 设为 0 意味着天气系统可以立即从你的值转换走。使用至少 300-600 秒来保持你期望的状态。
- **先设置云量再设置降雨。** 雨在视觉上与云量阈值相关。如果云量低于 `cfgweather.xml` 中配置的阈值，即使 `GetRain().GetActual()` 返回非零值，雨也不会渲染。
- **使用 `WeatherOnBeforeChange()` 进行服务器范围的天气策略。** 在 `modded class ChernarusPlusData`（或适当的 WorldData 子类）中覆盖此方法，以在不与状态机冲突的情况下限制或重定向天气转换。
- **双端读取天气，仅服务端写入。** `GetActual()` 和 `GetForecast()` 在客户端和服务端都有效，但 `Set()` 仅在服务端起作用。

---

## 兼容性与影响

> **模组兼容性：** 天气模组通常会覆盖 WorldData 子类中的 `WeatherOnBeforeChange()`。每个地图的 WorldData 类只运行一个模组的覆盖链。

- **加载顺序：** 多个模组在同一个 WorldData 子类（例如 `ChernarusPlusData`）上覆盖 `WeatherOnBeforeChange` 时，都必须调用 `super`，否则早期模组会丢失其天气逻辑。
- **Modded 类冲突：** 如果一个模组调用 `MissionWeather(true)` 而另一个期望自动天气，它们从根本上是不兼容的。请记录你的模组是否接管了手动天气控制。
- **性能影响：** 天气 API 调用是轻量级的。现象插值在引擎中运行，而非在脚本中。频繁的 `Set()` 调用（每帧）是浪费的但不是有害的。
- **服务端/客户端：** 所有 `Set()` 调用仅限服务端。客户端通过引擎同步自动接收天气状态。客户端的 `Set()` 调用被静默忽略。

---

## 真实模组中的观察

> 这些模式已通过研究专业 DayZ 模组的源代码得到确认。

| 模式 | 模组 | 文件/位置 |
|------|------|-----------|
| `MissionWeather(true)` + 使用 `CallLater` 的脚本化天气循环 | Expansion | 任务初始化中的天气控制器 |
| `WeatherOnBeforeChange` 覆盖以在特定区域防止降雨 | COT 天气模块 | Modded `ChernarusPlusData` |
| 通过 `Set()` 的管理员命令强制晴天/暴风雨并设置长保持时间 | VPP 管理工具 | 天气管理面板 |
| 自定义阈值的 `cfgweather.xml` 用于纯雪地图 | Namalsk | 任务文件夹配置 |

---

[<< 上一章：载具](02-vehicles.md) | **天气** | [下一章：相机 >>](04-cameras.md)
