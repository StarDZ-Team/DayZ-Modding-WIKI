# Kapitel 6.3: Wettersystem

[Startseite](../README.md) | [<< Zurück: Fahrzeuge](02-vehicles.md) | **Wetter** | [Weiter: Kameras >>](04-cameras.md)

---

## Einführung

DayZ verfügt über ein vollständig dynamisches Wettersystem, das über die `Weather`-Klasse gesteuert wird. Das System verwaltet Bewölkung, Regen, Schneefall, Nebel, Wind und Gewitter. Das Wetter kann über Script (die Weather-API), über `cfgweather.xml` im Missionsordner oder über eine geskriptete Wetterzustandsmaschine konfiguriert werden. Dieses Kapitel behandelt die Script-API zum programmgesteuerten Lesen und Steuern des Wetters.

---

## Zugriff auf das Weather-Objekt

```c
Weather weather = GetGame().GetWeather();
```

Das `Weather`-Objekt ist ein Singleton, das von der Engine verwaltet wird. Es ist immer verfügbar, nachdem die Spielwelt initialisiert wurde.

---

## Wetterphänomene

Jedes Wetterphänomen (Bewölkung, Nebel, Regen, Schneefall, Windstärke, Windrichtung) wird durch ein `WeatherPhenomenon`-Objekt dargestellt. Sie greifen über Getter-Methoden auf `Weather` darauf zu.

### Phänomen-Objekte abrufen

```c
proto native WeatherPhenomenon GetOvercast();
proto native WeatherPhenomenon GetFog();
proto native WeatherPhenomenon GetRain();
proto native WeatherPhenomenon GetSnowfall();
proto native WeatherPhenomenon GetWindMagnitude();
proto native WeatherPhenomenon GetWindDirection();
```

### WeatherPhenomenon-API

Jedes Phänomen teilt dieselbe Schnittstelle:

```c
class WeatherPhenomenon
{
    // Aktueller Zustand
    proto native float GetActual();          // Aktueller interpolierter Wert (0.0 - 1.0 für die meisten)
    proto native float GetForecast();        // Zielwert, auf den interpoliert wird
    proto native float GetDuration();        // Wie lange die aktuelle Vorhersage bestehen bleibt (Sekunden)

    // Vorhersage setzen (nur Server)
    proto native void Set(float forecast, float time = 0, float minDuration = 0);
    // forecast: Zielwert
    // time:     Sekunden für die Interpolation zu diesem Wert (0 = sofort)
    // minDuration: Mindestzeit, die der Wert gehalten wird, bevor automatische Änderung

    // Grenzen
    proto native void  SetLimits(float fnMin, float fnMax);
    proto native float GetMin();
    proto native float GetMax();

    // Änderungsgeschwindigkeitsgrenzen (wie schnell sich das Phänomen ändern kann)
    proto native void SetTimeLimits(float fnMin, float fnMax);

    // Änderungsgrößengrenzen
    proto native void SetChangeLimits(float fnMin, float fnMax);
}
```

**Beispiel --- aktuellen Wetterzustand lesen:**

```c
Weather w = GetGame().GetWeather();
float overcast  = w.GetOvercast().GetActual();
float rain      = w.GetRain().GetActual();
float fog       = w.GetFog().GetActual();
float snow      = w.GetSnowfall().GetActual();
float windSpeed = w.GetWindMagnitude().GetActual();
float windDir   = w.GetWindDirection().GetActual();

Print(string.Format("Bewölkung: %1, Regen: %2, Nebel: %3", overcast, rain, fog));
```

**Beispiel --- klares Wetter erzwingen (Server):**

```c
void ForceClearWeather()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(0.0, 30, 600);    // Klarer Himmel, 30s Übergang, 10 Min halten
    w.GetRain().Set(0.0, 10, 600);        // Kein Regen
    w.GetFog().Set(0.0, 30, 600);         // Kein Nebel
    w.GetSnowfall().Set(0.0, 10, 600);    // Kein Schnee
}
```

**Beispiel --- einen Sturm erzeugen:**

```c
void ForceStorm()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(1.0, 60, 1800);   // Volle Bewölkung, 60s Aufbau, 30 Min halten
    w.GetRain().Set(0.8, 120, 1800);      // Starker Regen
    w.GetFog().Set(0.3, 120, 1800);       // Leichter Nebel
    w.GetWindMagnitude().Set(15.0, 60, 1800);  // Starker Wind (m/s)
}
```

---

## Regenschwellenwerte

Regen ist an Bewölkungsstufen gebunden. Die Engine rendert Regen nur, wenn die Bewölkung einen Schwellenwert überschreitet. Sie können dies über `cfgweather.xml` konfigurieren:

```xml
<rain>
    <thresholds min="0.5" max="1.0" end="120" />
</rain>
```

- `min` / `max`: Bewölkungsbereich, in dem Regen erlaubt ist
- `end`: Sekunden, bis der Regen aufhört, wenn die Bewölkung unter den Schwellenwert fällt

Im Script wird Regen visuell nicht erscheinen, wenn die Bewölkung zu niedrig ist, selbst wenn `GetRain().GetActual()` einen Wert ungleich Null zurückgibt.

---

## Wind

Wind verwendet zwei Phänomene: Stärke (Geschwindigkeit in m/s) und Richtung (Winkel in Bogenmaß).

### Windvektor

```c
proto native vector GetWind();           // Windrichtungsvektor (Weltraum)
proto native float  GetWindSpeed();      // Windgeschwindigkeit in m/s
```

**Beispiel --- Windindformationen abrufen:**

```c
Weather w = GetGame().GetWeather();
vector windVec = w.GetWind();
float windSpd = w.GetWindSpeed();
Print(string.Format("Wind: %1 m/s, Richtung: %2", windSpd, windVec));
```

---

## Gewitter (Blitz)

```c
proto native void SetStorm(float density, float threshold, float timeout);
```

| Parameter | Beschreibung |
|-----------|--------------|
| `density` | Blitzdichte (0.0 - 1.0) |
| `threshold` | Minimale Bewölkungsstufe, damit Blitze erscheinen (0.0 - 1.0) |
| `timeout` | Sekunden zwischen Blitzeinschlägen |

**Beispiel --- häufige Blitze aktivieren:**

```c
GetGame().GetWeather().SetStorm(1.0, 0.6, 10);
// Volle Dichte, löst bei 60% Bewölkung aus, Einschlag alle 10 Sekunden
```

---

## MissionWeather-Steuerung

Um die manuelle Kontrolle über das Wetter zu übernehmen (Deaktivierung der automatischen Wetterzustandsmaschine), rufen Sie auf:

```c
proto native void MissionWeather(bool use);
```

Wenn `MissionWeather(true)` aufgerufen wird, stoppt die Engine die automatischen Wetterübergänge und nur Ihre script-gesteuerten `Set()`-Aufrufe steuern das Wetter.

**Beispiel --- volle manuelle Kontrolle in init.c:**

```c
void main()
{
    // Manuelle Kontrolle über das Wetter übernehmen
    GetGame().GetWeather().MissionWeather(true);

    // Gewünschtes Wetter setzen
    GetGame().GetWeather().GetOvercast().Set(0.3, 0, 0);
    GetGame().GetWeather().GetRain().Set(0.0, 0, 0);
    GetGame().GetWeather().GetFog().Set(0.1, 0, 0);
}
```

---

## Datum und Uhrzeit

Das Spieldatum und die Uhrzeit beeinflussen Beleuchtung, Sonnenposition und den Tag-Nacht-Zyklus. Diese werden über das `World`-Objekt gesteuert, nicht über `Weather`, sind aber eng verwandt.

### Aktuelles Datum/Uhrzeit abrufen

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
```

### Datum/Uhrzeit setzen (nur Server)

```c
proto native void SetDate(int year, int month, int day, int hour, int minute);
```

**Beispiel --- Zeit auf Mittag setzen:**

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
GetGame().GetWorld().SetDate(year, month, day, 12, 0);
```

### Zeitbeschleunigung

Die Zeitbeschleunigung wird in `serverDZ.cfg` konfiguriert über:

```
serverTimeAcceleration = 12;      // 12-fache Echtzeit
serverNightTimeAcceleration = 4;  // 4-fache Beschleunigung während der Nacht
```

Im Script können Sie den aktuellen Zeitmultiplikator lesen, ihn aber typischerweise zur Laufzeit nicht ändern.

---

## WorldData-Wetterzustandsmaschine

Das Vanilla-DayZ verwendet eine geskriptete Wetterzustandsmaschine in `WorldData`-Klassen (z.B. `ChernarusPlusData`, `EnochData`, `SakhalData`). Der wichtige Überschreibungspunkt ist:

```c
class WorldData
{
    void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual, float change,
                                float time);
}
```

Überschreiben Sie diese Methode in einer `modded` WorldData-Klasse, um Wetterübergänge abzufangen und zu modifizieren:

```c
modded class ChernarusPlusData
{
    override void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual,
                                         float change, float time)
    {
        super.WeatherOnBeforeChange(type, actual, change, time);

        // Verhindern, dass Regen jemals über 0.5 steigt
        if (type == EWeatherPhenomenon.RAIN && change > 0.5)
        {
            GetGame().GetWeather().GetRain().Set(0.5, time, 300);
        }
    }
}
```

---

## cfgweather.xml

Die Datei `cfgweather.xml` im Missionsordner bietet eine deklarative Möglichkeit, das Wetter ohne Scripting zu konfigurieren. Wenn vorhanden, überschreibt sie die Standardparameter der Wetterzustandsmaschine.

Grundstruktur:

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

| Attribut | Beschreibung |
|----------|--------------|
| `reset` | Ob das Wetter beim Serverstart aus dem Speicher zurückgesetzt werden soll |
| `enable` | Ob diese Datei aktiv ist |
| `actual` | Anfangswert |
| `time` | Sekunden, um den Anfangswert zu erreichen |
| `duration` | Sekunden, die der Anfangswert gehalten wird |
| `limits min/max` | Bereich für den Phänomenwert |
| `timelimits min/max` | Bereich für die Übergangsdauer (Sekunden) |
| `changelimits min/max` | Bereich für die Änderungsgröße pro Übergang |

---

## Zusammenfassung

| Konzept | Kernpunkt |
|---------|-----------|
| Zugriff | `GetGame().GetWeather()` gibt den `Weather`-Singleton zurück |
| Phänomene | `GetOvercast()`, `GetRain()`, `GetFog()`, `GetSnowfall()`, `GetWindMagnitude()`, `GetWindDirection()` |
| Lesen | `phenomenon.GetActual()` für aktuellen Wert (0.0 - 1.0) |
| Schreiben | `phenomenon.Set(Vorhersage, Übergangszeit, Haltedauer)` (nur Server) |
| Gewitter | `SetStorm(Dichte, Schwellenwert, Timeout)` |
| Manueller Modus | `MissionWeather(true)` deaktiviert automatische Wetteränderungen |
| Datum/Uhrzeit | `GetGame().GetWorld().GetDate()` / `SetDate()` |
| Konfigurationsdatei | `cfgweather.xml` im Missionsordner für deklarative Einrichtung |

---

## Bewährte Praktiken

- **Rufen Sie `MissionWeather(true)` auf, bevor Sie Wetter in `init.c` setzen.** Ohne dies wird die automatische Wetterzustandsmaschine Ihre `Set()`-Aufrufe innerhalb von Sekunden überschreiben. Übernehmen Sie immer zuerst die manuelle Kontrolle, wenn Sie deterministisches Wetter wollen.
- **Geben Sie immer einen `minDuration`-Parameter in `Set()` an.** Das Setzen von `minDuration` auf 0 bedeutet, dass das Wettersystem sofort von Ihrem Wert wegtransitionieren kann. Verwenden Sie mindestens 300-600 Sekunden, um Ihren gewünschten Zustand zu halten.
- **Setzen Sie Bewölkung vor Regen.** Regen ist visuell an Bewölkungsschwellenwerte gebunden. Wenn die Bewölkung unter dem in `cfgweather.xml` konfigurierten Schwellenwert liegt, wird Regen nicht gerendert, selbst wenn `GetRain().GetActual()` einen Wert ungleich Null zurückgibt.
- **Verwenden Sie `WeatherOnBeforeChange()` für serverweite Wetterpolitik.** Überschreiben Sie dies in einer `modded class ChernarusPlusData` (oder der entsprechenden WorldData-Unterklasse), um Wetterübergänge zu begrenzen oder umzuleiten, ohne gegen die Zustandsmaschine zu kämpfen.
- **Lesen Sie Wetter auf beiden Seiten, schreiben Sie nur auf dem Server.** `GetActual()` und `GetForecast()` funktionieren auf Client und Server, aber `Set()` hat nur auf dem Server Wirkung.

---

## Kompatibilität und Auswirkungen

> **Mod-Kompatibilität:** Wetter-Mods überschreiben häufig `WeatherOnBeforeChange()` in WorldData-Unterklassen. Nur die Override-Kette einer Mod läuft pro Karten-WorldData-Klasse.

- **Ladereihenfolge:** Wenn mehrere Mods `WeatherOnBeforeChange` auf derselben WorldData-Unterklasse (z.B. `ChernarusPlusData`) überschreiben, müssen alle `super` aufrufen, sonst verlieren frühere Mods ihre Wetterlogik.
- **Modded-Class-Konflikte:** Wenn eine Mod `MissionWeather(true)` aufruft und eine andere automatisches Wetter erwartet, sind sie grundsätzlich inkompatibel. Dokumentieren Sie, ob Ihre Mod die manuelle Wetterkontrolle übernimmt.
- **Leistungsauswirkung:** Weather-API-Aufrufe sind leichtgewichtig. Die Phänomen-Interpolation läuft in der Engine, nicht im Script. Häufige `Set()`-Aufrufe (jeden Frame) sind verschwenderisch, aber nicht schädlich.
- **Server/Client:** Alle `Set()`-Aufrufe gelten nur für den Server. Clients empfangen den Wetterzustand automatisch über die Engine-Synchronisierung. Clientseitige `Set()`-Aufrufe werden stillschweigend ignoriert.

---

## In echten Mods beobachtet

> Diese Muster wurden durch das Studium des Quellcodes professioneller DayZ-Mods bestätigt.

| Muster | Mod | Datei/Ort |
|--------|-----|-----------|
| `MissionWeather(true)` + geskripteter Wetterzyklus mit `CallLater` | Expansion | Wetter-Controller in Mission-Init |
| `WeatherOnBeforeChange`-Override zur Verhinderung von Regen in bestimmten Gebieten | COT Wetter-Modul | Modded `ChernarusPlusData` |
| Admin-Befehl zum Erzwingen von Klar/Sturm über `Set()` mit langer Haltedauer | VPP Admin Tools | Wetter-Admin-Panel |
| `cfgweather.xml` mit benutzerdefinierten Schwellenwerten für reine Schnee-Karten | Namalsk | Missionsordner-Konfiguration |

---

[<< Zurück: Fahrzeuge](02-vehicles.md) | **Wetter** | [Weiter: Kameras >>](04-cameras.md)
