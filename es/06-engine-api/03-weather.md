# Capítulo 6.3: Sistema de Clima

[Inicio](../README.md) | [<< Anterior: Vehículos](02-vehicles.md) | **Clima** | [Siguiente: Cámaras >>](04-cameras.md)

---

## Introducción

DayZ tiene un sistema de clima completamente dinámico controlado a través de la clase `Weather`. El sistema gestiona nubosidad, lluvia, nieve, niebla, viento y tormentas eléctricas. El clima se puede configurar mediante script (la API de Weather), mediante `cfgweather.xml` en la carpeta de misión, o mediante una máquina de estados de clima por script. Este capítulo cubre la API de script para leer y controlar el clima programáticamente.

---

## Acceder al Objeto Weather

```c
Weather weather = GetGame().GetWeather();
```

El objeto `Weather` es un singleton gestionado por el motor. Siempre está disponible después de que el mundo del juego se inicializa.

---

## Fenómenos Meteorológicos

Cada fenómeno meteorológico (nubosidad, niebla, lluvia, nieve, magnitud del viento, dirección del viento) está representado por un objeto `WeatherPhenomenon`. Se accede a ellos mediante métodos getter en `Weather`.

### Obtener Objetos de Fenómeno

```c
proto native WeatherPhenomenon GetOvercast();
proto native WeatherPhenomenon GetFog();
proto native WeatherPhenomenon GetRain();
proto native WeatherPhenomenon GetSnowfall();
proto native WeatherPhenomenon GetWindMagnitude();
proto native WeatherPhenomenon GetWindDirection();
```

### API de WeatherPhenomenon

Cada fenómeno comparte la misma interfaz:

```c
class WeatherPhenomenon
{
    // Estado actual
    proto native float GetActual();          // Valor interpolado actual (0.0 - 1.0 para la mayoría)
    proto native float GetForecast();        // Valor objetivo hacia el que se interpola
    proto native float GetDuration();        // Cuánto tiempo persiste el pronóstico actual (segundos)

    // Establecer el pronóstico (solo servidor)
    proto native void Set(float forecast, float time = 0, float minDuration = 0);
    // forecast: valor objetivo
    // time:     segundos para interpolar a ese valor (0 = instantáneo)
    // minDuration: tiempo mínimo que el valor se mantiene antes del cambio automático

    // Límites
    proto native void  SetLimits(float fnMin, float fnMax);
    proto native float GetMin();
    proto native float GetMax();

    // Límites de velocidad de cambio (qué tan rápido puede cambiar el fenómeno)
    proto native void SetTimeLimits(float fnMin, float fnMax);

    // Límites de magnitud de cambio
    proto native void SetChangeLimits(float fnMin, float fnMax);
}
```

**Ejemplo --- leer el estado actual del clima:**

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

**Ejemplo --- forzar clima despejado (servidor):**

```c
void ForceClearWeather()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(0.0, 30, 600);    // Cielo despejado, transición 30s, mantener 10 min
    w.GetRain().Set(0.0, 10, 600);        // Sin lluvia
    w.GetFog().Set(0.0, 30, 600);         // Sin niebla
    w.GetSnowfall().Set(0.0, 10, 600);    // Sin nieve
}
```

**Ejemplo --- crear una tormenta:**

```c
void ForceStorm()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(1.0, 60, 1800);   // Nubosidad total, rampa 60s, mantener 30 min
    w.GetRain().Set(0.8, 120, 1800);      // Lluvia fuerte
    w.GetFog().Set(0.3, 120, 1800);       // Niebla ligera
    w.GetWindMagnitude().Set(15.0, 60, 1800);  // Viento fuerte (m/s)
}
```

---

## Umbrales de Lluvia

La lluvia está vinculada a los niveles de nubosidad. El motor solo renderiza lluvia cuando la nubosidad excede un umbral. Puedes configurar esto vía `cfgweather.xml`:

```xml
<rain>
    <thresholds min="0.5" max="1.0" end="120" />
</rain>
```

- `min` / `max`: rango de nubosidad donde se permite lluvia
- `end`: segundos para que la lluvia se detenga si la nubosidad cae por debajo del umbral

En script, la lluvia no aparecerá visualmente si la nubosidad es demasiado baja, incluso si `GetRain().GetActual()` retorna un valor distinto de cero.

---

## Viento

El viento usa dos fenómenos: magnitud (velocidad en m/s) y dirección (ángulo en radianes).

### Vector de Viento

```c
proto native vector GetWind();           // Vector de dirección del viento (espacio mundial)
proto native float  GetWindSpeed();      // Velocidad del viento en m/s
```

**Ejemplo --- obtener información del viento:**

```c
Weather w = GetGame().GetWeather();
vector windVec = w.GetWind();
float windSpd = w.GetWindSpeed();
Print(string.Format("Wind: %1 m/s, direction: %2", windSpd, windVec));
```

---

## Tormentas Eléctricas (Relámpagos)

```c
proto native void SetStorm(float density, float threshold, float timeout);
```

| Parámetro | Descripción |
|-----------|-------------|
| `density` | Densidad de relámpagos (0.0 - 1.0) |
| `threshold` | Nivel mínimo de nubosidad para que aparezcan relámpagos (0.0 - 1.0) |
| `timeout` | Segundos entre relámpagos |

**Ejemplo --- habilitar relámpagos frecuentes:**

```c
GetGame().GetWeather().SetStorm(1.0, 0.6, 10);
// Densidad total, se activa al 60% de nubosidad, relámpagos cada 10 segundos
```

---

## Control MissionWeather

Para tomar control manual del clima (deshabilitando la máquina de estados automática del clima), llama:

```c
proto native void MissionWeather(bool use);
```

Cuando se llama `MissionWeather(true)`, el motor detiene las transiciones automáticas del clima y solo tus llamadas a `Set()` desde script controlan el clima.

**Ejemplo --- control manual completo en init.c:**

```c
void main()
{
    // Tomar control manual del clima
    GetGame().GetWeather().MissionWeather(true);

    // Establecer el clima deseado
    GetGame().GetWeather().GetOvercast().Set(0.3, 0, 0);
    GetGame().GetWeather().GetRain().Set(0.0, 0, 0);
    GetGame().GetWeather().GetFog().Set(0.1, 0, 0);
}
```

---

## Fecha y Hora

La fecha y hora del juego afectan la iluminación, la posición del sol y el ciclo día/noche. Estos se controlan a través del objeto `World`, no de `Weather`, pero están estrechamente relacionados.

### Obtener Fecha/Hora Actual

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
```

### Establecer Fecha/Hora (Solo Servidor)

```c
proto native void SetDate(int year, int month, int day, int hour, int minute);
```

**Ejemplo --- establecer la hora al mediodía:**

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
GetGame().GetWorld().SetDate(year, month, day, 12, 0);
```

### Aceleración del Tiempo

La aceleración del tiempo se configura en `serverDZ.cfg` vía:

```
serverTimeAcceleration = 12;      // 12x tiempo real
serverNightTimeAcceleration = 4;  // 4x aceleración durante la noche
```

En script, puedes leer el multiplicador de tiempo actual pero típicamente no puedes cambiarlo en tiempo de ejecución.

---

## Máquina de Estados de Clima WorldData

El DayZ vanilla usa una máquina de estados de clima con script en clases `WorldData` (ej., `ChernarusPlusData`, `EnochData`, `SakhalData`). El punto clave de sobreescritura es:

```c
class WorldData
{
    void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual, float change,
                                float time);
}
```

Sobreescribe este método en una clase `modded` de WorldData para interceptar y modificar transiciones de clima:

```c
modded class ChernarusPlusData
{
    override void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual,
                                         float change, float time)
    {
        super.WeatherOnBeforeChange(type, actual, change, time);

        // Prevenir que la lluvia supere 0.5
        if (type == EWeatherPhenomenon.RAIN && change > 0.5)
        {
            GetGame().GetWeather().GetRain().Set(0.5, time, 300);
        }
    }
}
```

---

## cfgweather.xml

El archivo `cfgweather.xml` en la carpeta de misión proporciona una forma declarativa de configurar el clima sin scripting. Cuando está presente, sobreescribe los parámetros predeterminados de la máquina de estados del clima.

Estructura principal:

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

| Atributo | Descripción |
|-----------|-------------|
| `reset` | Si se reinicia el clima desde almacenamiento al iniciar el servidor |
| `enable` | Si este archivo está activo |
| `actual` | Valor inicial |
| `time` | Segundos para alcanzar el valor inicial |
| `duration` | Segundos que se mantiene el valor inicial |
| `limits min/max` | Rango para el valor del fenómeno |
| `timelimits min/max` | Rango para la duración de transición (segundos) |
| `changelimits min/max` | Rango para la magnitud del cambio por transición |

---

## Resumen

| Concepto | Punto Clave |
|---------|-----------|
| Acceso | `GetGame().GetWeather()` retorna el singleton `Weather` |
| Fenómenos | `GetOvercast()`, `GetRain()`, `GetFog()`, `GetSnowfall()`, `GetWindMagnitude()`, `GetWindDirection()` |
| Leer | `phenomenon.GetActual()` para el valor actual (0.0 - 1.0) |
| Escribir | `phenomenon.Set(forecast, transitionTime, holdDuration)` (solo servidor) |
| Tormentas | `SetStorm(density, threshold, timeout)` |
| Modo manual | `MissionWeather(true)` deshabilita los cambios automáticos de clima |
| Fecha/Hora | `GetGame().GetWorld().GetDate()` / `SetDate()` |
| Archivo config | `cfgweather.xml` en carpeta de misión para configuración declarativa |

---

## Mejores Prácticas

- **Llama a `MissionWeather(true)` antes de establecer el clima en `init.c`.** Sin esto, la máquina de estados automática del clima sobreescribirá tus llamadas `Set()` en segundos. Siempre toma control manual primero si quieres un clima determinístico.
- **Siempre proporciona un parámetro `minDuration` en `Set()`.** Establecer `minDuration` a 0 significa que el sistema de clima puede transicionar inmediatamente lejos de tu valor. Usa al menos 300-600 segundos para mantener tu estado deseado.
- **Establece la nubosidad antes de la lluvia.** La lluvia está visualmente vinculada a los umbrales de nubosidad. Si la nubosidad está por debajo del umbral configurado en `cfgweather.xml`, la lluvia no se renderizará aunque `GetRain().GetActual()` retorne un valor distinto de cero.
- **Usa `WeatherOnBeforeChange()` para políticas de clima a nivel de servidor.** Sobreescribe esto en una `modded class ChernarusPlusData` (o la subclase WorldData apropiada) para limitar o redirigir transiciones de clima sin pelear con la máquina de estados.
- **Lee el clima en ambos lados, escribe solo en el servidor.** `GetActual()` y `GetForecast()` funcionan en cliente y servidor, pero `Set()` solo tiene efecto en el servidor.

---

## Compatibilidad e Impacto

> **Compatibilidad de Mods:** Los mods de clima comúnmente sobreescriben `WeatherOnBeforeChange()` en subclases de WorldData. Solo la cadena de sobreescritura de un mod se ejecuta por clase WorldData de mapa.

- **Orden de Carga:** Múltiples mods sobreescribiendo `WeatherOnBeforeChange` en la misma subclase de WorldData (ej., `ChernarusPlusData`) deben todos llamar a `super`, o los mods anteriores pierden su lógica de clima.
- **Conflictos de Clases Modded:** Si un mod llama a `MissionWeather(true)` y otro espera clima automático, son fundamentalmente incompatibles. Documenta si tu mod toma control manual del clima.
- **Impacto en el Rendimiento:** Las llamadas a la API de clima son ligeras. La interpolación de fenómenos se ejecuta en el motor, no en script. Las llamadas frecuentes a `Set()` (cada frame) son innecesarias pero no dañinas.
- **Servidor/Cliente:** Todas las llamadas a `Set()` son solo del servidor. Los clientes reciben el estado del clima vía sincronización automática del motor. Las llamadas a `Set()` del lado del cliente son silenciosamente ignoradas.

---

## Observado en Mods Reales

> Estos patrones fueron confirmados estudiando el código fuente de mods profesionales de DayZ.

| Patrón | Mod | Archivo/Ubicación |
|---------|-----|---------------|
| `MissionWeather(true)` + ciclo de clima con script usando `CallLater` | Expansion | Controlador de clima en init de misión |
| Sobreescritura de `WeatherOnBeforeChange` para prevenir lluvia en áreas específicas | COT Weather Module | `ChernarusPlusData` modded |
| Comando de admin para forzar despejado/tormenta vía `Set()` con duración larga | VPP Admin Tools | Panel de admin de clima |
| `cfgweather.xml` con umbrales personalizados para mapas de solo nieve | Namalsk | Config en carpeta de misión |

---

[<< Anterior: Vehículos](02-vehicles.md) | **Clima** | [Siguiente: Cámaras >>](04-cameras.md)
