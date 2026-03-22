# Kapitola 6.3: Systém počasí

[Domů](../README.md) | [<< Předchozí: Vozidla](02-vehicles.md) | **Počasí** | [Další: Kamery >>](04-cameras.md)

---

## Úvod

DayZ má plně dynamický systém počasí řízený prostřednictvím třídy `Weather`. Systém spravuje oblačnost, déšť, sněžení, mlhu, vítr a bouřky. Počasí lze konfigurovat prostřednictvím skriptu (Weather API), prostřednictvím `cfgweather.xml` ve složce mise, nebo prostřednictvím skriptovaného stavového automatu počasí. Tato kapitola pokrývá skriptové API pro čtení a programové řízení počasí.

---

## Přístup k objektu Weather

```c
Weather weather = GetGame().GetWeather();
```

Objekt `Weather` je singleton spravovaný enginem. Je vždy dostupný po inicializaci herního světa.

---

## Meteorologické jevy

Každý meteorologický jev (oblačnost, mlha, déšť, sněžení, síla větru, směr větru) je reprezentován objektem `WeatherPhenomenon`. Přistupujete k nim prostřednictvím getter metod na `Weather`.

### Získání objektů jevů

```c
proto native WeatherPhenomenon GetOvercast();
proto native WeatherPhenomenon GetFog();
proto native WeatherPhenomenon GetRain();
proto native WeatherPhenomenon GetSnowfall();
proto native WeatherPhenomenon GetWindMagnitude();
proto native WeatherPhenomenon GetWindDirection();
```

### API WeatherPhenomenon

Každý jev sdílí stejné rozhraní:

```c
class WeatherPhenomenon
{
    // Aktuální stav
    proto native float GetActual();          // Aktuální interpolovaná hodnota (0.0 - 1.0 pro většinu)
    proto native float GetForecast();        // Cílová hodnota k interpolaci
    proto native float GetDuration();        // Jak dlouho aktuální předpověď trvá (sekundy)

    // Nastavit předpověď (pouze server)
    proto native void Set(float forecast, float time = 0, float minDuration = 0);
    // forecast: cílová hodnota
    // time:     sekundy pro interpolaci k této hodnotě (0 = okamžitě)
    // minDuration: minimální doba, po kterou hodnota drží před automatickou změnou

    // Limity
    proto native void  SetLimits(float fnMin, float fnMax);
    proto native float GetMin();
    proto native float GetMax();

    // Limity rychlosti změny (jak rychle se jev může měnit)
    proto native void SetTimeLimits(float fnMin, float fnMax);

    // Limity rozsahu změny
    proto native void SetChangeLimits(float fnMin, float fnMax);
}
```

**Příklad --- čtení aktuálního stavu počasí:**

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

**Příklad --- vynutit jasné počasí (server):**

```c
void ForceClearWeather()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(0.0, 30, 600);    // Jasná obloha, 30s přechod, držet 10 min
    w.GetRain().Set(0.0, 10, 600);        // Bez deště
    w.GetFog().Set(0.0, 30, 600);         // Bez mlhy
    w.GetSnowfall().Set(0.0, 10, 600);    // Bez sněhu
}
```

**Příklad --- vytvořit bouři:**

```c
void ForceStorm()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(1.0, 60, 1800);   // Plná oblačnost, 60s nárůst, držet 30 min
    w.GetRain().Set(0.8, 120, 1800);      // Silný déšť
    w.GetFog().Set(0.3, 120, 1800);       // Lehká mlha
    w.GetWindMagnitude().Set(15.0, 60, 1800);  // Silný vítr (m/s)
}
```

---

## Prahy deště

Déšť je vázán na úrovně oblačnosti. Engine vykresluje déšť pouze když oblačnost překročí práh. To můžete konfigurovat přes `cfgweather.xml`:

```xml
<rain>
    <thresholds min="0.5" max="1.0" end="120" />
</rain>
```

- `min` / `max`: rozsah oblačnosti, kde je déšť povolen
- `end`: sekundy pro zastavení deště, pokud oblačnost klesne pod práh

Ve skriptu se déšť vizuálně neobjeví, pokud je oblačnost příliš nízká, i když `GetRain().GetActual()` vrací nenulovou hodnotu.

---

## Vítr

Vítr používá dva jevy: sílu (rychlost v m/s) a směr (úhel v radiánech).

### Vektor větru

```c
proto native vector GetWind();           // Vektor směru větru (světový prostor)
proto native float  GetWindSpeed();      // Rychlost větru v m/s
```

**Příklad --- získat informace o větru:**

```c
Weather w = GetGame().GetWeather();
vector windVec = w.GetWind();
float windSpd = w.GetWindSpeed();
Print(string.Format("Wind: %1 m/s, direction: %2", windSpd, windVec));
```

---

## Bouřky (blesky)

```c
proto native void SetStorm(float density, float threshold, float timeout);
```

| Parametr | Popis |
|----------|-------|
| `density` | Hustota blesků (0.0 - 1.0) |
| `threshold` | Minimální úroveň oblačnosti pro výskyt blesků (0.0 - 1.0) |
| `timeout` | Sekundy mezi údery blesků |

**Příklad --- povolit časté blesky:**

```c
GetGame().GetWeather().SetStorm(1.0, 0.6, 10);
// Plná hustota, spouští se při 60% oblačnosti, údery každých 10 sekund
```

---

## Řízení MissionWeather

Pro převzetí manuální kontroly nad počasím (vypnutí automatického stavového automatu počasí) volejte:

```c
proto native void MissionWeather(bool use);
```

Při zavolání `MissionWeather(true)` engine zastaví automatické přechody počasí a pouze vaše skriptové volání `Set()` řídí počasí.

**Příklad --- plná manuální kontrola v init.c:**

```c
void main()
{
    // Převzít manuální kontrolu nad počasím
    GetGame().GetWeather().MissionWeather(true);

    // Nastavit požadované počasí
    GetGame().GetWeather().GetOvercast().Set(0.3, 0, 0);
    GetGame().GetWeather().GetRain().Set(0.0, 0, 0);
    GetGame().GetWeather().GetFog().Set(0.1, 0, 0);
}
```

---

## Datum a čas

Herní datum a čas ovlivňují osvětlení, pozici slunce a cyklus den/noc. Tyto jsou řízeny prostřednictvím objektu `World`, ne `Weather`, ale úzce s ním souvisí.

### Získání aktuálního data/času

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
```

### Nastavení data/času (pouze server)

```c
proto native void SetDate(int year, int month, int day, int hour, int minute);
```

**Příklad --- nastavit čas na poledne:**

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
GetGame().GetWorld().SetDate(year, month, day, 12, 0);
```

### Zrychlení času

Zrychlení času je konfigurováno v `serverDZ.cfg` přes:

```
serverTimeAcceleration = 12;      // 12x reálný čas
serverNightTimeAcceleration = 4;  // 4x zrychlení během noci
```

Ve skriptu můžete číst aktuální multiplikátor času, ale obvykle ho nelze změnit za běhu.

---

## Stavový automat počasí WorldData

Vanilla DayZ používá skriptovaný stavový automat počasí ve třídách `WorldData` (např. `ChernarusPlusData`, `EnochData`, `SakhalData`). Klíčový bod pro přepsání je:

```c
class WorldData
{
    void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual, float change,
                                float time);
}
```

Přepište tuto metodu ve třídě `modded` WorldData pro zachycení a úpravu přechodů počasí:

```c
modded class ChernarusPlusData
{
    override void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual,
                                         float change, float time)
    {
        super.WeatherOnBeforeChange(type, actual, change, time);

        // Zabránit dešti v překročení 0.5
        if (type == EWeatherPhenomenon.RAIN && change > 0.5)
        {
            GetGame().GetWeather().GetRain().Set(0.5, time, 300);
        }
    }
}
```

---

## cfgweather.xml

Soubor `cfgweather.xml` ve složce mise poskytuje deklarativní způsob konfigurace počasí bez skriptování. Pokud je přítomen, přepíše výchozí parametry stavového automatu počasí.

Klíčová struktura:

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

| Atribut | Popis |
|---------|-------|
| `reset` | Zda resetovat počasí z úložiště při startu serveru |
| `enable` | Zda je tento soubor aktivní |
| `actual` | Počáteční hodnota |
| `time` | Sekundy pro dosažení počáteční hodnoty |
| `duration` | Sekundy, po které počáteční hodnota drží |
| `limits min/max` | Rozsah pro hodnotu jevu |
| `timelimits min/max` | Rozsah pro dobu trvání přechodu (sekundy) |
| `changelimits min/max` | Rozsah pro velikost změny za přechod |

---

## Shrnutí

| Koncept | Klíčový bod |
|---------|-------------|
| Přístup | `GetGame().GetWeather()` vrací singleton `Weather` |
| Jevy | `GetOvercast()`, `GetRain()`, `GetFog()`, `GetSnowfall()`, `GetWindMagnitude()`, `GetWindDirection()` |
| Čtení | `phenomenon.GetActual()` pro aktuální hodnotu (0.0 - 1.0) |
| Zápis | `phenomenon.Set(předpověď, časPřechodu, dobaDržení)` (pouze server) |
| Bouřky | `SetStorm(hustota, práh, časový limit)` |
| Manuální režim | `MissionWeather(true)` vypne automatické změny počasí |
| Datum/Čas | `GetGame().GetWorld().GetDate()` / `SetDate()` |
| Konfigurační soubor | `cfgweather.xml` ve složce mise pro deklarativní nastavení |

---

## Osvědčené postupy

- **Volejte `MissionWeather(true)` před nastavením počasí v `init.c`.** Bez toho automatický stavový automat počasí přepíše vaše volání `Set()` během sekund. Vždy nejdříve převezměte manuální kontrolu, pokud chcete deterministické počasí.
- **Vždy zadávejte parametr `minDuration` v `Set()`.** Nastavení `minDuration` na 0 znamená, že systém počasí může okamžitě přejít od vaší hodnoty. Použijte alespoň 300-600 sekund pro udržení požadovaného stavu.
- **Nastavte oblačnost před deštěm.** Déšť je vizuálně vázán na prahy oblačnosti. Pokud je oblačnost pod prahem konfigurovaným v `cfgweather.xml`, déšť se nevykreslí, i když `GetRain().GetActual()` vrací nenulovou hodnotu.
- **Používejte `WeatherOnBeforeChange()` pro celoserverovou politiku počasí.** Přepište to ve třídě `modded class ChernarusPlusData` (nebo příslušné podtřídě WorldData) pro omezení nebo přesměrování přechodů počasí bez boje se stavovým automatem.
- **Čtěte počasí na obou stranách, zapisujte pouze na serveru.** `GetActual()` a `GetForecast()` fungují na klientovi i serveru, ale `Set()` má efekt pouze na serveru.

---

## Kompatibilita a dopad

> **Kompatibilita modů:** Mody počasí běžně přepisují `WeatherOnBeforeChange()` v podtřídách WorldData. Pouze jeden řetězec přepsání jednoho modu běží pro každou třídu WorldData příslušné mapy.

- **Pořadí načítání:** Pokud více modů přepisuje `WeatherOnBeforeChange` na stejné podtřídě WorldData (např. `ChernarusPlusData`), všechny musí volat `super`, jinak dřívější mody ztratí svou logiku počasí.
- **Konflikty modded tříd:** Pokud jeden mod volá `MissionWeather(true)` a druhý očekává automatické počasí, jsou zásadně nekompatibilní. Dokumentujte, zda váš mod přebírá manuální kontrolu nad počasím.
- **Dopad na výkon:** Volání Weather API jsou lehká. Interpolace jevů běží v enginu, ne ve skriptu. Časté volání `Set()` (každý snímek) je plýtvání, ale neškodí.
- **Server/Klient:** Všechna volání `Set()` jsou pouze serverová. Klienti přijímají stav počasí prostřednictvím automatické synchronizace enginu. Klientská volání `Set()` jsou tiše ignorována.

---

## Pozorováno v reálných modech

> Tyto vzory byly potvrzeny studiem zdrojového kódu profesionálních DayZ modů.

| Vzor | Mod | Soubor/Umístění |
|------|-----|-----------------|
| `MissionWeather(true)` + skriptovaný cyklus počasí s `CallLater` | Expansion | Kontroler počasí v inicializaci mise |
| Přepsání `WeatherOnBeforeChange` pro zabránění deště v konkrétních oblastech | COT Weather Module | Modded `ChernarusPlusData` |
| Admin příkaz pro vynucení jasna/bouře přes `Set()` s dlouhou dobou držení | VPP Admin Tools | Panel správy počasí |
| `cfgweather.xml` s vlastními prahy pro mapy pouze se sněhem | Namalsk | Konfigurace ve složce mise |

---

[<< Předchozí: Vozidla](02-vehicles.md) | **Počasí** | [Další: Kamery >>](04-cameras.md)
