# Chapter 6.3: Weather System

[Home](../README.md) | [<< Previous: Vehicles](02-vehicles.md) | **Weather** | [Next: Cameras >>](04-cameras.md)

---

## Introduction

DayZ has a fully dynamic weather system controlled through the `Weather` class. The system manages overcast, rain, snowfall, fog, wind, and thunderstorms. Weather can be configured through script (the Weather API), through `cfgweather.xml` in the mission folder, or through a scripted weather state machine. This chapter covers the script API for reading and controlling weather programmatically.

---

## Accessing the Weather Object

```c
Weather weather = GetGame().GetWeather();
```

The `Weather` object is a singleton managed by the engine. It is always available after the game world initializes.

---

## Weather Phenomena

Each weather phenomenon (overcast, fog, rain, snowfall, wind magnitude, wind direction) is represented by a `WeatherPhenomenon` object. You access them through getter methods on `Weather`.

### Getting Phenomenon Objects

```c
proto native WeatherPhenomenon GetOvercast();
proto native WeatherPhenomenon GetFog();
proto native WeatherPhenomenon GetRain();
proto native WeatherPhenomenon GetSnowfall();
proto native WeatherPhenomenon GetWindMagnitude();
proto native WeatherPhenomenon GetWindDirection();
```

### WeatherPhenomenon API

Each phenomenon shares the same interface:

```c
class WeatherPhenomenon
{
    // Current state
    proto native float GetActual();          // Current interpolated value (0.0 - 1.0 for most)
    proto native float GetForecast();        // Target value being interpolated toward
    proto native float GetDuration();        // How long the current forecast persists (seconds)

    // Set the forecast (server only)
    proto native void Set(float forecast, float time = 0, float minDuration = 0);
    // forecast: target value
    // time:     seconds to interpolate to that value (0 = instant)
    // minDuration: minimum time the value holds before auto-change

    // Limits
    proto native void  SetLimits(float fnMin, float fnMax);
    proto native float GetMin();
    proto native float GetMax();

    // Change speed limits (how fast the phenomenon can change)
    proto native void SetTimeLimits(float fnMin, float fnMax);

    // Change magnitude limits
    proto native void SetChangeLimits(float fnMin, float fnMax);
}
```

**Example --- read current weather state:**

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

**Example --- force clear weather (server):**

```c
void ForceClearWeather()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(0.0, 30, 600);    // Clear sky, 30s transition, hold 10 min
    w.GetRain().Set(0.0, 10, 600);        // No rain
    w.GetFog().Set(0.0, 30, 600);         // No fog
    w.GetSnowfall().Set(0.0, 10, 600);    // No snow
}
```

**Example --- create a storm:**

```c
void ForceStorm()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(1.0, 60, 1800);   // Full overcast, 60s ramp, hold 30 min
    w.GetRain().Set(0.8, 120, 1800);      // Heavy rain
    w.GetFog().Set(0.3, 120, 1800);       // Light fog
    w.GetWindMagnitude().Set(15.0, 60, 1800);  // Strong wind (m/s)
}
```

---

## Rain Thresholds

Rain is tied to overcast levels. The engine only renders rain when overcast exceeds a threshold. You can configure this via `cfgweather.xml`:

```xml
<rain>
    <thresholds min="0.5" max="1.0" end="120" />
</rain>
```

- `min` / `max`: overcast range where rain is allowed
- `end`: seconds for rain to stop if overcast falls below threshold

In script, rain will not visually appear if overcast is too low, even if `GetRain().GetActual()` returns a non-zero value.

---

## Wind

Wind uses two phenomena: magnitude (speed in m/s) and direction (angle in radians).

### Wind Vector

```c
proto native vector GetWind();           // Wind direction vector (world space)
proto native float  GetWindSpeed();      // Wind speed in m/s
```

**Example --- get wind info:**

```c
Weather w = GetGame().GetWeather();
vector windVec = w.GetWind();
float windSpd = w.GetWindSpeed();
Print(string.Format("Wind: %1 m/s, direction: %2", windSpd, windVec));
```

---

## Thunderstorms (Lightning)

```c
proto native void SetStorm(float density, float threshold, float timeout);
```

| Parameter | Description |
|-----------|-------------|
| `density` | Lightning density (0.0 - 1.0) |
| `threshold` | Minimum overcast level for lightning to appear (0.0 - 1.0) |
| `timeout` | Seconds between lightning strikes |

**Example --- enable frequent lightning:**

```c
GetGame().GetWeather().SetStorm(1.0, 0.6, 10);
// Full density, triggers at 60% overcast, strikes every 10 seconds
```

---

## MissionWeather Control

To take manual control of weather (disabling the automatic weather state machine), call:

```c
proto native void MissionWeather(bool use);
```

When `MissionWeather(true)` is called, the engine stops the automatic weather transitions and only your script-driven `Set()` calls control the weather.

**Example --- full manual control in init.c:**

```c
void main()
{
    // Take manual control of weather
    GetGame().GetWeather().MissionWeather(true);

    // Set desired weather
    GetGame().GetWeather().GetOvercast().Set(0.3, 0, 0);
    GetGame().GetWeather().GetRain().Set(0.0, 0, 0);
    GetGame().GetWeather().GetFog().Set(0.1, 0, 0);
}
```

---

## Date & Time

The game date and time affect lighting, sun position, and the day/night cycle. These are controlled through the `World` object, not `Weather`, but they are closely related.

### Getting Current Date/Time

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
```

### Setting Date/Time (Server Only)

```c
proto native void SetDate(int year, int month, int day, int hour, int minute);
```

**Example --- set time to noon:**

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
GetGame().GetWorld().SetDate(year, month, day, 12, 0);
```

### Time Acceleration

Time acceleration is configured in `serverDZ.cfg` via:

```
serverTimeAcceleration = 12;      // 12x real time
serverNightTimeAcceleration = 4;  // 4x acceleration during night
```

In script, you can read the current time multiplier but typically cannot change it at runtime.

---

## WorldData Weather State Machine

Vanilla DayZ uses a scripted weather state machine in `WorldData` classes (e.g., `ChernarusPlusData`, `EnochData`, `SakhalData`). The key override point is:

```c
class WorldData
{
    void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual, float change,
                                float time);
}
```

Override this method in a `modded` WorldData class to intercept and modify weather transitions:

```c
modded class ChernarusPlusData
{
    override void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual,
                                         float change, float time)
    {
        super.WeatherOnBeforeChange(type, actual, change, time);

        // Prevent rain from ever going above 0.5
        if (type == EWeatherPhenomenon.RAIN && change > 0.5)
        {
            GetGame().GetWeather().GetRain().Set(0.5, time, 300);
        }
    }
}
```

---

## cfgweather.xml

The `cfgweather.xml` file in the mission folder provides a declarative way to configure weather without scripting. When present, it overrides the default weather state machine parameters.

Key structure:

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

| Attribute | Description |
|-----------|-------------|
| `reset` | Whether to reset weather from storage on server start |
| `enable` | Whether this file is active |
| `actual` | Initial value |
| `time` | Seconds to reach the initial value |
| `duration` | Seconds the initial value holds |
| `limits min/max` | Range for the phenomenon value |
| `timelimits min/max` | Range for transition duration (seconds) |
| `changelimits min/max` | Range for change magnitude per transition |

---

## Summary

| Concept | Key Point |
|---------|-----------|
| Access | `GetGame().GetWeather()` returns the `Weather` singleton |
| Phenomena | `GetOvercast()`, `GetRain()`, `GetFog()`, `GetSnowfall()`, `GetWindMagnitude()`, `GetWindDirection()` |
| Read | `phenomenon.GetActual()` for current value (0.0 - 1.0) |
| Write | `phenomenon.Set(forecast, transitionTime, holdDuration)` (server only) |
| Storms | `SetStorm(density, threshold, timeout)` |
| Manual mode | `MissionWeather(true)` disables automatic weather changes |
| Date/Time | `GetGame().GetWorld().GetDate()` / `SetDate()` |
| Config file | `cfgweather.xml` in mission folder for declarative setup |

---

## Best Practices

- **Call `MissionWeather(true)` before setting weather in `init.c`.** Without this, the automatic weather state machine will override your `Set()` calls within seconds. Always take manual control first if you want deterministic weather.
- **Always provide a `minDuration` parameter in `Set()`.** Setting `minDuration` to 0 means the weather system can immediately transition away from your value. Use at least 300-600 seconds to hold your desired state.
- **Set overcast before rain.** Rain is visually tied to overcast thresholds. If overcast is below the threshold configured in `cfgweather.xml`, rain will not render even if `GetRain().GetActual()` returns a non-zero value.
- **Use `WeatherOnBeforeChange()` for server-wide weather policy.** Override this in a `modded class ChernarusPlusData` (or the appropriate WorldData subclass) to clamp or redirect weather transitions without fighting the state machine.
- **Read weather on both sides, write only on server.** `GetActual()` and `GetForecast()` work on client and server, but `Set()` only has effect on the server.

---

## Compatibility & Impact

> **Mod Compatibility:** Weather mods commonly override `WeatherOnBeforeChange()` in WorldData subclasses. Only one mod's override chain runs per map's WorldData class.

- **Load Order:** Multiple mods overriding `WeatherOnBeforeChange` on the same WorldData subclass (e.g., `ChernarusPlusData`) must all call `super`, or earlier mods lose their weather logic.
- **Modded Class Conflicts:** If one mod calls `MissionWeather(true)` and another expects automatic weather, they are fundamentally incompatible. Document whether your mod takes manual weather control.
- **Performance Impact:** Weather API calls are lightweight. The phenomena interpolation runs in the engine, not in script. Frequent `Set()` calls (every frame) are wasteful but not harmful.
- **Server/Client:** All `Set()` calls are server-only. Clients receive weather state via engine synchronization automatically. Client-side `Set()` calls are silently ignored.

---

## Observed in Real Mods

> These patterns were confirmed by studying the source code of professional DayZ mods.

| Pattern | Mod | File/Location |
|---------|-----|---------------|
| `MissionWeather(true)` + scripted weather cycle with `CallLater` | Expansion | Weather controller in mission init |
| `WeatherOnBeforeChange` override to prevent rain in specific areas | COT Weather Module | Modded `ChernarusPlusData` |
| Admin command to force clear/storm via `Set()` with long hold duration | VPP Admin Tools | Weather admin panel |
| `cfgweather.xml` with custom thresholds for snow-only maps | Namalsk | Mission folder config |

---

[<< Previous: Vehicles](02-vehicles.md) | **Weather** | [Next: Cameras >>](04-cameras.md)
