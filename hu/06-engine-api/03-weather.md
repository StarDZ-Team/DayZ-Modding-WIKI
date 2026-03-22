# 6.3. fejezet: Időjárásrendszer

[Kezdőlap](../README.md) | [<< Előző: Járművek](02-vehicles.md) | **Időjárás** | [Következő: Kamerák >>](04-cameras.md)

---

## Bevezetés

A DayZ teljesen dinamikus időjárási rendszerrel rendelkezik, amelyet a `Weather` osztályon keresztül vezérel. A rendszer a felhőzetet, esőt, havazást, ködöt, szelet és zivatarokat kezeli. Az időjárás konfigurálható szkripttel (a Weather API-n keresztül), a misszió mappában lévő `cfgweather.xml` fájllal, vagy szkriptelt időjárás állapotgéppel. Ez a fejezet az időjárás programozott olvasásának és vezérlésének szkript API-ját tárgyalja.

---

## A Weather objektum elérése

```c
Weather weather = GetGame().GetWeather();
```

A `Weather` objektum a motor által kezelt singleton. A játékvilág inicializálása után mindig elérhető.

---

## Időjárási jelenségek

Minden időjárási jelenséget (felhőzet, köd, eső, havazás, szél erőssége, szélirány) egy `WeatherPhenomenon` objektum képvisel. Ezeket a `Weather` getter metódusain keresztül éred el.

### Jelenség objektumok lekérése

```c
proto native WeatherPhenomenon GetOvercast();
proto native WeatherPhenomenon GetFog();
proto native WeatherPhenomenon GetRain();
proto native WeatherPhenomenon GetSnowfall();
proto native WeatherPhenomenon GetWindMagnitude();
proto native WeatherPhenomenon GetWindDirection();
```

### WeatherPhenomenon API

Minden jelenség ugyanazt az interfészt használja:

```c
class WeatherPhenomenon
{
    // Aktuális állapot
    proto native float GetActual();          // Aktuális interpolált érték (legtöbbnél 0.0 - 1.0)
    proto native float GetForecast();        // Célérték, amire interpolál
    proto native float GetDuration();        // Mennyi ideig tart az aktuális előrejelzés (másodperc)

    // Előrejelzés beállítása (csak szerver)
    proto native void Set(float forecast, float time = 0, float minDuration = 0);
    // forecast: célérték
    // time:     másodperc az interpolációhoz (0 = azonnali)
    // minDuration: minimális idő, amíg az érték megmarad automatikus változás előtt

    // Korlátok
    proto native void  SetLimits(float fnMin, float fnMax);
    proto native float GetMin();
    proto native float GetMax();

    // Változási sebesség korlátok (milyen gyorsan változhat a jelenség)
    proto native void SetTimeLimits(float fnMin, float fnMax);

    // Változási mérték korlátok
    proto native void SetChangeLimits(float fnMin, float fnMax);
}
```

**Példa --- aktuális időjárási állapot olvasása:**

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

**Példa --- tiszta időjárás kényszerítése (szerver):**

```c
void ForceClearWeather()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(0.0, 30, 600);    // Tiszta ég, 30mp átmenet, 10 perc tartás
    w.GetRain().Set(0.0, 10, 600);        // Nincs eső
    w.GetFog().Set(0.0, 30, 600);         // Nincs köd
    w.GetSnowfall().Set(0.0, 10, 600);    // Nincs hó
}
```

**Példa --- vihar létrehozása:**

```c
void ForceStorm()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(1.0, 60, 1800);   // Teljes felhőzet, 60mp felfutás, 30 perc tartás
    w.GetRain().Set(0.8, 120, 1800);      // Erős eső
    w.GetFog().Set(0.3, 120, 1800);       // Enyhe köd
    w.GetWindMagnitude().Set(15.0, 60, 1800);  // Erős szél (m/s)
}
```

---

## Eső küszöbértékek

Az eső a felhőzeti szintekhez van kötve. A motor csak akkor jeleníti meg az esőt, ha a felhőzet meghalad egy küszöbértéket. Ezt a `cfgweather.xml` fájlban konfigurálhatod:

```xml
<rain>
    <thresholds min="0.5" max="1.0" end="120" />
</rain>
```

- `min` / `max`: felhőzeti tartomány, ahol az eső engedélyezett
- `end`: másodpercek, amíg az eső leáll, ha a felhőzet a küszöb alá esik

Szkriptben az eső vizuálisan nem jelenik meg, ha a felhőzet túl alacsony, még akkor sem, ha a `GetRain().GetActual()` nem nulla értéket ad vissza.

---

## Szél

A szél két jelenséget használ: erősség (sebesség m/s-ban) és irány (szög radiánban).

### Szélvektor

```c
proto native vector GetWind();           // Szélirány vektor (világtér)
proto native float  GetWindSpeed();      // Szélsebesség m/s-ban
```

**Példa --- szél információ lekérése:**

```c
Weather w = GetGame().GetWeather();
vector windVec = w.GetWind();
float windSpd = w.GetWindSpeed();
Print(string.Format("Wind: %1 m/s, direction: %2", windSpd, windVec));
```

---

## Zivatarok (villám)

```c
proto native void SetStorm(float density, float threshold, float timeout);
```

| Paraméter | Leírás |
|-----------|--------|
| `density` | Villám sűrűség (0.0 - 1.0) |
| `threshold` | Minimális felhőzeti szint a villám megjelenéséhez (0.0 - 1.0) |
| `timeout` | Másodpercek a villámlások között |

**Példa --- gyakori villámlás engedélyezése:**

```c
GetGame().GetWeather().SetStorm(1.0, 0.6, 10);
// Teljes sűrűség, 60%-os felhőzetnél aktiválódik, 10 másodpercenként csap le
```

---

## MissionWeather vezérlés

Az időjárás kézi vezérléséhez (az automatikus időjárás állapotgép letiltásához) hívd meg:

```c
proto native void MissionWeather(bool use);
```

Amikor a `MissionWeather(true)` meghívásra kerül, a motor leállítja az automatikus időjárás-átmeneteket, és csak a szkript-vezérelt `Set()` hívásaid vezérlik az időjárást.

**Példa --- teljes kézi vezérlés az init.c-ben:**

```c
void main()
{
    // Időjárás kézi vezérlésének átvétele
    GetGame().GetWeather().MissionWeather(true);

    // Kívánt időjárás beállítása
    GetGame().GetWeather().GetOvercast().Set(0.3, 0, 0);
    GetGame().GetWeather().GetRain().Set(0.0, 0, 0);
    GetGame().GetWeather().GetFog().Set(0.1, 0, 0);
}
```

---

## Dátum és idő

A játék dátuma és ideje befolyásolja a megvilágítást, a nap pozícióját és a nappal/éjjel ciklust. Ezeket a `World` objektumon keresztül vezérlik, nem a `Weather`-en, de szorosan összefüggenek.

### Aktuális dátum/idő lekérése

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
```

### Dátum/idő beállítása (csak szerver)

```c
proto native void SetDate(int year, int month, int day, int hour, int minute);
```

**Példa --- idő beállítása délre:**

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
GetGame().GetWorld().SetDate(year, month, day, 12, 0);
```

### Időgyorsítás

Az időgyorsítás a `serverDZ.cfg` fájlban konfigurálható:

```
serverTimeAcceleration = 12;      // 12-szeres valós idő
serverNightTimeAcceleration = 4;  // 4-szeres gyorsítás éjszaka
```

Szkriptben olvashatod az aktuális időszorzót, de általában nem változtathatod meg futásidőben.

---

## WorldData időjárás állapotgép

A vanilla DayZ szkriptelt időjárás állapotgépet használ a `WorldData` osztályokban (pl. `ChernarusPlusData`, `EnochData`, `SakhalData`). A fő felülírási pont:

```c
class WorldData
{
    void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual, float change,
                                float time);
}
```

Írd felül ezt a metódust egy `modded` WorldData osztályban az időjárás-átmenetek elfogásához és módosításához:

```c
modded class ChernarusPlusData
{
    override void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual,
                                         float change, float time)
    {
        super.WeatherOnBeforeChange(type, actual, change, time);

        // Eső megakadályozása 0.5 fölött
        if (type == EWeatherPhenomenon.RAIN && change > 0.5)
        {
            GetGame().GetWeather().GetRain().Set(0.5, time, 300);
        }
    }
}
```

---

## cfgweather.xml

A misszió mappában lévő `cfgweather.xml` fájl deklaratív módot biztosít az időjárás konfigurálására szkriptelés nélkül. Ha jelen van, felülírja az alapértelmezett időjárás állapotgép paramétereit.

Fő szerkezet:

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

| Attribútum | Leírás |
|------------|--------|
| `reset` | Időjárás visszaállítása a tárolóból szerver indításkor |
| `enable` | Ez a fájl aktív-e |
| `actual` | Kezdeti érték |
| `time` | Másodpercek a kezdeti érték eléréséig |
| `duration` | Másodpercek, amíg a kezdeti érték megmarad |
| `limits min/max` | A jelenség értékének tartománya |
| `timelimits min/max` | Az átmenet időtartamának tartománya (másodperc) |
| `changelimits min/max` | A változás mértékének tartománya átmenetenként |

---

## Összefoglalás

| Fogalom | Lényeg |
|---------|--------|
| Hozzáférés | `GetGame().GetWeather()` a `Weather` singletont adja vissza |
| Jelenségek | `GetOvercast()`, `GetRain()`, `GetFog()`, `GetSnowfall()`, `GetWindMagnitude()`, `GetWindDirection()` |
| Olvasás | `phenomenon.GetActual()` az aktuális értékhez (0.0 - 1.0) |
| Írás | `phenomenon.Set(előrejelzés, átmenetiIdő, tartásIdő)` (csak szerver) |
| Zivatarok | `SetStorm(sűrűség, küszöb, időköz)` |
| Kézi mód | `MissionWeather(true)` letiltja az automatikus időjárás-változásokat |
| Dátum/Idő | `GetGame().GetWorld().GetDate()` / `SetDate()` |
| Konfigurációs fájl | `cfgweather.xml` a misszió mappában deklaratív beállításhoz |

---

## Bevált gyakorlatok

- **Hívd meg a `MissionWeather(true)` metódust az időjárás beállítása előtt az `init.c`-ben.** Enélkül az automatikus időjárás állapotgép másodperceken belül felülírja a `Set()` hívásaidat. Mindig vedd át a kézi vezérlést, ha determinisztikus időjárást szeretnél.
- **Mindig adj meg `minDuration` paramétert a `Set()` hívásban.** Ha a `minDuration` értéke 0, az időjárási rendszer azonnal eltérhet az értékedtől. Használj legalább 300-600 másodpercet a kívánt állapot tartásához.
- **Állítsd be a felhőzetet az eső előtt.** Az eső vizuálisan a felhőzeti küszöbértékekhez van kötve. Ha a felhőzet a `cfgweather.xml`-ben konfigurált küszöb alatt van, az eső nem jelenik meg, még ha a `GetRain().GetActual()` nem nulla értéket is ad vissza.
- **Használd a `WeatherOnBeforeChange()` metódust szerver szintű időjárási irányelvekhez.** Írd felül egy `modded class ChernarusPlusData`-ban (vagy a megfelelő WorldData alosztályban) az időjárás-átmenetek korlátozásához vagy átirányításához anélkül, hogy az állapotgéppel harcolnál.
- **Olvass mindkét oldalon, írj csak szerveren.** A `GetActual()` és `GetForecast()` kliensen és szerveren is működik, de a `Set()` csak a szerveren fejt ki hatást.

---

## Kompatibilitás és hatás

> **Mod kompatibilitás:** Az időjárás modok általában felülírják a `WeatherOnBeforeChange()` metódust a WorldData alosztályokban. Térképenként csak egy mod felülírási lánca fut le a WorldData osztályon.

- **Betöltési sorrend:** Több mod, amely felülírja a `WeatherOnBeforeChange` metódust ugyanazon a WorldData alosztályon (pl. `ChernarusPlusData`), mindegyiknek meg kell hívnia a `super`-t, különben a korábbi modok elveszítik az időjárási logikájukat.
- **Modded osztály konfliktusok:** Ha az egyik mod `MissionWeather(true)`-t hív, a másik pedig automatikus időjárást vár, alapvetően inkompatibilisek. Dokumentáld, ha a modod átveszi a kézi időjárás-vezérlést.
- **Teljesítményi hatás:** Az időjárás API hívások könnyűek. A jelenségek interpolációja a motorban fut, nem szkriptben. A gyakori `Set()` hívások (minden képkockában) pazarlóak, de nem károsak.
- **Szerver/Kliens:** Minden `Set()` hívás csak szerveren érvényes. A kliensek automatikusan megkapják az időjárási állapotot a motor szinkronizálásán keresztül. A kliens oldali `Set()` hívásokat csendben figyelmen kívül hagyja.

---

## Valós modokban megfigyelt minták

> Ezeket a mintákat professzionális DayZ modok forráskódjának tanulmányozásával erősítettük meg.

| Minta | Mod | Fájl/Helyszín |
|-------|-----|---------------|
| `MissionWeather(true)` + szkriptelt időjárási ciklus `CallLater`-rel | Expansion | Időjárás vezérlő a misszió inicializálásban |
| `WeatherOnBeforeChange` felülírás eső megakadályozásához bizonyos területeken | COT Weather Module | Modded `ChernarusPlusData` |
| Admin parancs tiszta/vihar kényszerítéséhez `Set()`-tel hosszú tartási idővel | VPP Admin Tools | Időjárás admin panel |
| `cfgweather.xml` egyéni küszöbértékekkel csak havazós térképekhez | Namalsk | Misszió mappa konfig |

---

[<< Előző: Járművek](02-vehicles.md) | **Időjárás** | [Következő: Kamerák >>](04-cameras.md)
