# Rozdział 6.3: System pogody

[Strona główna](../README.md) | [<< Poprzedni: Pojazdy](02-vehicles.md) | **Pogoda** | [Następny: Kamery >>](04-cameras.md)

---

## Wprowadzenie

DayZ posiada w pełni dynamiczny system pogody kontrolowany przez klasę `Weather`. System zarządza zachmurzeniem, deszczem, opadami śniegu, mgłą, wiatrem i burzami. Pogodę można konfigurować przez skrypt (Weather API), przez `cfgweather.xml` w folderze misji lub przez skryptową maszynę stanów pogody. Ten rozdział obejmuje skryptowe API do odczytu i programowego sterowania pogodą.

---

## Dostęp do obiektu Weather

```c
Weather weather = GetGame().GetWeather();
```

Obiekt `Weather` jest singletonem zarządzanym przez silnik. Jest zawsze dostępny po inicjalizacji świata gry.

---

## Zjawiska pogodowe

Każde zjawisko pogodowe (zachmurzenie, mgła, deszcz, opady śniegu, siła wiatru, kierunek wiatru) jest reprezentowane przez obiekt `WeatherPhenomenon`. Dostęp do nich odbywa się przez metody getter na `Weather`.

### Pobieranie obiektów zjawisk

```c
proto native WeatherPhenomenon GetOvercast();
proto native WeatherPhenomenon GetFog();
proto native WeatherPhenomenon GetRain();
proto native WeatherPhenomenon GetSnowfall();
proto native WeatherPhenomenon GetWindMagnitude();
proto native WeatherPhenomenon GetWindDirection();
```

### API WeatherPhenomenon

Każde zjawisko współdzieli to samo interfejs:

```c
class WeatherPhenomenon
{
    // Aktualny stan
    proto native float GetActual();          // Aktualna interpolowana wartość (0.0 - 1.0 dla większości)
    proto native float GetForecast();        // Docelowa wartość do interpolacji
    proto native float GetDuration();        // Jak długo aktualna prognoza trwa (sekundy)

    // Ustaw prognozę (tylko serwer)
    proto native void Set(float forecast, float time = 0, float minDuration = 0);
    // forecast: wartość docelowa
    // time:     sekundy do interpolacji do tej wartości (0 = natychmiast)
    // minDuration: minimalny czas utrzymywania wartości przed automatyczną zmianą

    // Limity
    proto native void  SetLimits(float fnMin, float fnMax);
    proto native float GetMin();
    proto native float GetMax();

    // Limity prędkości zmian (jak szybko zjawisko może się zmieniać)
    proto native void SetTimeLimits(float fnMin, float fnMax);

    // Limity zakresu zmian
    proto native void SetChangeLimits(float fnMin, float fnMax);
}
```

**Przykład --- odczyt aktualnego stanu pogody:**

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

**Przykład --- wymuś czystą pogodę (serwer):**

```c
void ForceClearWeather()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(0.0, 30, 600);    // Czyste niebo, 30s przejście, utrzymaj 10 min
    w.GetRain().Set(0.0, 10, 600);        // Bez deszczu
    w.GetFog().Set(0.0, 30, 600);         // Bez mgły
    w.GetSnowfall().Set(0.0, 10, 600);    // Bez śniegu
}
```

**Przykład --- stwórz burzę:**

```c
void ForceStorm()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(1.0, 60, 1800);   // Pełne zachmurzenie, 60s narastanie, utrzymaj 30 min
    w.GetRain().Set(0.8, 120, 1800);      // Silny deszcz
    w.GetFog().Set(0.3, 120, 1800);       // Lekka mgła
    w.GetWindMagnitude().Set(15.0, 60, 1800);  // Silny wiatr (m/s)
}
```

---

## Progi deszczu

Deszcz jest powiązany z poziomem zachmurzenia. Silnik renderuje deszcz tylko gdy zachmurzenie przekracza próg. Możesz to skonfigurować przez `cfgweather.xml`:

```xml
<rain>
    <thresholds min="0.5" max="1.0" end="120" />
</rain>
```

- `min` / `max`: zakres zachmurzenia, w którym deszcz jest dozwolony
- `end`: sekundy na zatrzymanie deszczu jeśli zachmurzenie spadnie poniżej progu

W skrypcie deszcz nie pojawi się wizualnie jeśli zachmurzenie jest zbyt niskie, nawet jeśli `GetRain().GetActual()` zwraca niezerową wartość.

---

## Wiatr

Wiatr używa dwóch zjawisk: siły (prędkość w m/s) i kierunku (kąt w radianach).

### Wektor wiatru

```c
proto native vector GetWind();           // Wektor kierunku wiatru (przestrzeń świata)
proto native float  GetWindSpeed();      // Prędkość wiatru w m/s
```

**Przykład --- pobranie informacji o wietrze:**

```c
Weather w = GetGame().GetWeather();
vector windVec = w.GetWind();
float windSpd = w.GetWindSpeed();
Print(string.Format("Wind: %1 m/s, direction: %2", windSpd, windVec));
```

---

## Burze (błyskawice)

```c
proto native void SetStorm(float density, float threshold, float timeout);
```

| Parametr | Opis |
|----------|------|
| `density` | Gęstość błyskawic (0.0 - 1.0) |
| `threshold` | Minimalny poziom zachmurzenia dla pojawienia się błyskawic (0.0 - 1.0) |
| `timeout` | Sekundy między uderzeniami piorunów |

**Przykład --- włącz częste błyskawice:**

```c
GetGame().GetWeather().SetStorm(1.0, 0.6, 10);
// Pełna gęstość, wyzwala się przy 60% zachmurzenia, uderzenia co 10 sekund
```

---

## Kontrola MissionWeather

Aby przejąć ręczną kontrolę nad pogodą (wyłączając automatyczną maszynę stanów pogody), wywołaj:

```c
proto native void MissionWeather(bool use);
```

Gdy wywołane jest `MissionWeather(true)`, silnik zatrzymuje automatyczne przejścia pogodowe i tylko twoje skryptowe wywołania `Set()` kontrolują pogodę.

**Przykład --- pełna ręczna kontrola w init.c:**

```c
void main()
{
    // Przejmij ręczną kontrolę nad pogodą
    GetGame().GetWeather().MissionWeather(true);

    // Ustaw pożądaną pogodę
    GetGame().GetWeather().GetOvercast().Set(0.3, 0, 0);
    GetGame().GetWeather().GetRain().Set(0.0, 0, 0);
    GetGame().GetWeather().GetFog().Set(0.1, 0, 0);
}
```

---

## Data i czas

Data i czas gry wpływają na oświetlenie, pozycję słońca i cykl dzień/noc. Są one kontrolowane przez obiekt `World`, nie `Weather`, ale są ściśle powiązane.

### Pobieranie aktualnej daty/czasu

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
```

### Ustawianie daty/czasu (tylko serwer)

```c
proto native void SetDate(int year, int month, int day, int hour, int minute);
```

**Przykład --- ustawienie czasu na południe:**

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
GetGame().GetWorld().SetDate(year, month, day, 12, 0);
```

### Przyspieszenie czasu

Przyspieszenie czasu jest konfigurowane w `serverDZ.cfg` przez:

```
serverTimeAcceleration = 12;      // 12x czas rzeczywisty
serverNightTimeAcceleration = 4;  // 4x przyspieszenie w nocy
```

W skrypcie możesz odczytać aktualny mnożnik czasu, ale zazwyczaj nie możesz go zmienić w trakcie działania.

---

## Maszyna stanów pogody WorldData

Vanilla DayZ używa skryptowanej maszyny stanów pogody w klasach `WorldData` (np. `ChernarusPlusData`, `EnochData`, `SakhalData`). Kluczowy punkt nadpisania to:

```c
class WorldData
{
    void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual, float change,
                                float time);
}
```

Nadpisz tę metodę w klasie `modded` WorldData, aby przechwytywać i modyfikować przejścia pogodowe:

```c
modded class ChernarusPlusData
{
    override void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual,
                                         float change, float time)
    {
        super.WeatherOnBeforeChange(type, actual, change, time);

        // Zapobiegaj przekroczeniu 0.5 przez deszcz
        if (type == EWeatherPhenomenon.RAIN && change > 0.5)
        {
            GetGame().GetWeather().GetRain().Set(0.5, time, 300);
        }
    }
}
```

---

## cfgweather.xml

Plik `cfgweather.xml` w folderze misji zapewnia deklaratywny sposób konfiguracji pogody bez skryptowania. Gdy jest obecny, nadpisuje domyślne parametry maszyny stanów pogody.

Kluczowa struktura:

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

| Atrybut | Opis |
|---------|------|
| `reset` | Czy resetować pogodę z pamięci przy starcie serwera |
| `enable` | Czy ten plik jest aktywny |
| `actual` | Wartość początkowa |
| `time` | Sekundy do osiągnięcia wartości początkowej |
| `duration` | Sekundy utrzymywania wartości początkowej |
| `limits min/max` | Zakres wartości zjawiska |
| `timelimits min/max` | Zakres czasu trwania przejścia (sekundy) |
| `changelimits min/max` | Zakres wielkości zmiany na przejście |

---

## Podsumowanie

| Koncept | Kluczowy punkt |
|---------|----------------|
| Dostęp | `GetGame().GetWeather()` zwraca singleton `Weather` |
| Zjawiska | `GetOvercast()`, `GetRain()`, `GetFog()`, `GetSnowfall()`, `GetWindMagnitude()`, `GetWindDirection()` |
| Odczyt | `phenomenon.GetActual()` dla aktualnej wartości (0.0 - 1.0) |
| Zapis | `phenomenon.Set(prognoza, czasPrzejścia, czasUtrzymania)` (tylko serwer) |
| Burze | `SetStorm(gęstość, próg, limit_czasu)` |
| Tryb ręczny | `MissionWeather(true)` wyłącza automatyczne zmiany pogody |
| Data/Czas | `GetGame().GetWorld().GetDate()` / `SetDate()` |
| Plik konfiguracji | `cfgweather.xml` w folderze misji dla deklaratywnej konfiguracji |

---

## Dobre praktyki

- **Wywołaj `MissionWeather(true)` przed ustawianiem pogody w `init.c`.** Bez tego automatyczna maszyna stanów pogody nadpisze twoje wywołania `Set()` w ciągu sekund. Zawsze najpierw przejmij ręczną kontrolę, jeśli chcesz deterministyczną pogodę.
- **Zawsze podawaj parametr `minDuration` w `Set()`.** Ustawienie `minDuration` na 0 oznacza, że system pogody może natychmiast przejść od twojej wartości. Użyj co najmniej 300-600 sekund, aby utrzymać pożądany stan.
- **Ustaw zachmurzenie przed deszczem.** Deszcz jest wizualnie powiązany z progami zachmurzenia. Jeśli zachmurzenie jest poniżej progu skonfigurowanego w `cfgweather.xml`, deszcz nie będzie renderowany, nawet jeśli `GetRain().GetActual()` zwraca niezerową wartość.
- **Używaj `WeatherOnBeforeChange()` dla ogólnoserwerowej polityki pogodowej.** Nadpisz to w `modded class ChernarusPlusData` (lub odpowiedniej podklasie WorldData), aby ograniczać lub przekierowywać przejścia pogodowe bez walki z maszyną stanów.
- **Odczytuj pogodę po obu stronach, zapisuj tylko na serwerze.** `GetActual()` i `GetForecast()` działają na kliencie i serwerze, ale `Set()` działa tylko na serwerze.

---

## Kompatybilność i wpływ

> **Kompatybilność modów:** Mody pogodowe powszechnie nadpisują `WeatherOnBeforeChange()` w podklasach WorldData. Tylko jeden łańcuch nadpisań jednego moda działa dla klasy WorldData każdej mapy.

- **Kolejność ładowania:** Jeśli wiele modów nadpisuje `WeatherOnBeforeChange` na tej samej podklasie WorldData (np. `ChernarusPlusData`), wszystkie muszą wywoływać `super`, w przeciwnym razie wcześniejsze mody tracą swoją logikę pogodową.
- **Konflikty modded klas:** Jeśli jeden mod wywołuje `MissionWeather(true)`, a inny oczekuje automatycznej pogody, są fundamentalnie niekompatybilne. Dokumentuj, czy twój mod przejmuje ręczną kontrolę nad pogodą.
- **Wpływ na wydajność:** Wywołania Weather API są lekkie. Interpolacja zjawisk działa w silniku, nie w skrypcie. Częste wywołania `Set()` (co klatkę) są marnotrawstwem, ale nie są szkodliwe.
- **Serwer/Klient:** Wszystkie wywołania `Set()` działają tylko na serwerze. Klienci otrzymują stan pogody przez automatyczną synchronizację silnika. Wywołania `Set()` po stronie klienta są po cichu ignorowane.

---

## Zaobserwowane w prawdziwych modach

> Te wzorce zostały potwierdzone przez analizę kodu źródłowego profesjonalnych modów DayZ.

| Wzorzec | Mod | Plik/Lokalizacja |
|---------|-----|------------------|
| `MissionWeather(true)` + skryptowany cykl pogodowy z `CallLater` | Expansion | Kontroler pogody w inicjalizacji misji |
| Nadpisanie `WeatherOnBeforeChange` aby zapobiec deszczowi w określonych obszarach | COT Weather Module | Modded `ChernarusPlusData` |
| Komenda admina do wymuszenia pogody czystej/burzowej przez `Set()` z długim czasem utrzymania | VPP Admin Tools | Panel administracji pogodą |
| `cfgweather.xml` z niestandardowymi progami dla map tylko ze śniegiem | Namalsk | Konfiguracja w folderze misji |

---

[<< Poprzedni: Pojazdy](02-vehicles.md) | **Pogoda** | [Następny: Kamery >>](04-cameras.md)
