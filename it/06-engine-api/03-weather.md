# Capitolo 6.3: Sistema Meteo

[Home](../README.md) | [<< Precedente: Veicoli](02-vehicles.md) | **Meteo** | [Successivo: Telecamere >>](04-cameras.md)

---

## Introduzione

DayZ ha un sistema meteo completamente dinamico controllato tramite la classe `Weather`. Il sistema gestisce nuvolosita, pioggia, nevicata, nebbia, vento e temporali. Il meteo puo essere configurato tramite script (l'API Weather), tramite `cfgweather.xml` nella cartella della missione, o tramite una macchina a stati meteo scriptata. Questo capitolo copre l'API script per leggere e controllare il meteo programmaticamente.

---

## Accesso all'oggetto Weather

```c
Weather weather = GetGame().GetWeather();
```

L'oggetto `Weather` e un singleton gestito dal motore. E sempre disponibile dopo l'inizializzazione del mondo di gioco.

---

## Fenomeni meteorologici

Ogni fenomeno meteorologico (nuvolosita, nebbia, pioggia, nevicata, intensita del vento, direzione del vento) e rappresentato da un oggetto `WeatherPhenomenon`. Li accedi tramite i metodi getter di `Weather`.

### Ottenere gli oggetti fenomeno

```c
proto native WeatherPhenomenon GetOvercast();
proto native WeatherPhenomenon GetFog();
proto native WeatherPhenomenon GetRain();
proto native WeatherPhenomenon GetSnowfall();
proto native WeatherPhenomenon GetWindMagnitude();
proto native WeatherPhenomenon GetWindDirection();
```

### API WeatherPhenomenon

Ogni fenomeno condivide la stessa interfaccia:

```c
class WeatherPhenomenon
{
    // Stato attuale
    proto native float GetActual();          // Valore interpolato attuale (0.0 - 1.0 per la maggior parte)
    proto native float GetForecast();        // Valore obiettivo verso cui si interpola
    proto native float GetDuration();        // Quanto dura la previsione attuale (secondi)

    // Impostare la previsione (solo server)
    proto native void Set(float forecast, float time = 0, float minDuration = 0);
    // forecast: valore obiettivo
    // time:     secondi per interpolare a quel valore (0 = istantaneo)
    // minDuration: tempo minimo in cui il valore resta prima del cambio automatico

    // Limiti
    proto native void  SetLimits(float fnMin, float fnMax);
    proto native float GetMin();
    proto native float GetMax();

    // Limiti velocita di cambio (quanto velocemente puo cambiare il fenomeno)
    proto native void SetTimeLimits(float fnMin, float fnMax);

    // Limiti magnitudine di cambio
    proto native void SetChangeLimits(float fnMin, float fnMax);
}
```

**Esempio --- leggere lo stato meteo attuale:**

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

**Esempio --- forzare tempo sereno (server):**

```c
void ForceClearWeather()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(0.0, 30, 600);    // Cielo sereno, transizione 30s, mantieni 10 min
    w.GetRain().Set(0.0, 10, 600);        // Nessuna pioggia
    w.GetFog().Set(0.0, 30, 600);         // Nessuna nebbia
    w.GetSnowfall().Set(0.0, 10, 600);    // Nessuna neve
}
```

**Esempio --- creare un temporale:**

```c
void ForceStorm()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(1.0, 60, 1800);   // Nuvolosita totale, rampa 60s, mantieni 30 min
    w.GetRain().Set(0.8, 120, 1800);      // Pioggia intensa
    w.GetFog().Set(0.3, 120, 1800);       // Nebbia leggera
    w.GetWindMagnitude().Set(15.0, 60, 1800);  // Vento forte (m/s)
}
```

---

## Soglie della pioggia

La pioggia e legata ai livelli di nuvolosita. Il motore renderizza la pioggia solo quando la nuvolosita supera una soglia. Puoi configurarlo tramite `cfgweather.xml`:

```xml
<rain>
    <thresholds min="0.5" max="1.0" end="120" />
</rain>
```

- `min` / `max`: intervallo di nuvolosita in cui la pioggia e consentita
- `end`: secondi prima che la pioggia si fermi se la nuvolosita scende sotto la soglia

Nello script, la pioggia non apparira visivamente se la nuvolosita e troppo bassa, anche se `GetRain().GetActual()` restituisce un valore diverso da zero.

---

## Vento

Il vento usa due fenomeni: magnitudine (velocita in m/s) e direzione (angolo in radianti).

### Vettore del vento

```c
proto native vector GetWind();           // Vettore direzione del vento (spazio mondo)
proto native float  GetWindSpeed();      // Velocita del vento in m/s
```

**Esempio --- ottenere informazioni sul vento:**

```c
Weather w = GetGame().GetWeather();
vector windVec = w.GetWind();
float windSpd = w.GetWindSpeed();
Print(string.Format("Wind: %1 m/s, direction: %2", windSpd, windVec));
```

---

## Temporali (fulmini)

```c
proto native void SetStorm(float density, float threshold, float timeout);
```

| Parametro | Descrizione |
|-----------|-------------|
| `density` | Densita dei fulmini (0.0 - 1.0) |
| `threshold` | Livello minimo di nuvolosita per la comparsa dei fulmini (0.0 - 1.0) |
| `timeout` | Secondi tra i fulmini |

**Esempio --- abilitare fulmini frequenti:**

```c
GetGame().GetWeather().SetStorm(1.0, 0.6, 10);
// Densita massima, si attiva al 60% di nuvolosita, fulmine ogni 10 secondi
```

---

## Controllo MissionWeather

Per prendere il controllo manuale del meteo (disabilitando la macchina a stati meteo automatica), chiama:

```c
proto native void MissionWeather(bool use);
```

Quando viene chiamato `MissionWeather(true)`, il motore ferma le transizioni meteo automatiche e solo le tue chiamate `Set()` guidate dallo script controllano il meteo.

**Esempio --- controllo manuale completo in init.c:**

```c
void main()
{
    // Prendere il controllo manuale del meteo
    GetGame().GetWeather().MissionWeather(true);

    // Impostare il meteo desiderato
    GetGame().GetWeather().GetOvercast().Set(0.3, 0, 0);
    GetGame().GetWeather().GetRain().Set(0.0, 0, 0);
    GetGame().GetWeather().GetFog().Set(0.1, 0, 0);
}
```

---

## Data e ora

La data e l'ora del gioco influenzano l'illuminazione, la posizione del sole e il ciclo giorno/notte. Questi sono controllati tramite l'oggetto `World`, non `Weather`, ma sono strettamente correlati.

### Ottenere data/ora attuale

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
```

### Impostare data/ora (solo server)

```c
proto native void SetDate(int year, int month, int day, int hour, int minute);
```

**Esempio --- impostare l'ora a mezzogiorno:**

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
GetGame().GetWorld().SetDate(year, month, day, 12, 0);
```

### Accelerazione del tempo

L'accelerazione del tempo e configurata in `serverDZ.cfg` tramite:

```
serverTimeAcceleration = 12;      // 12x tempo reale
serverNightTimeAcceleration = 4;  // Accelerazione 4x durante la notte
```

Nello script, puoi leggere il moltiplicatore del tempo corrente ma tipicamente non puoi cambiarlo a runtime.

---

## Macchina a stati meteo WorldData

Il DayZ vanilla usa una macchina a stati meteo scriptata nelle classi `WorldData` (es. `ChernarusPlusData`, `EnochData`, `SakhalData`). Il punto di override chiave e:

```c
class WorldData
{
    void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual, float change,
                                float time);
}
```

Sovrascrivi questo metodo in una classe `modded` WorldData per intercettare e modificare le transizioni meteo:

```c
modded class ChernarusPlusData
{
    override void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual,
                                         float change, float time)
    {
        super.WeatherOnBeforeChange(type, actual, change, time);

        // Impedire alla pioggia di superare 0.5
        if (type == EWeatherPhenomenon.RAIN && change > 0.5)
        {
            GetGame().GetWeather().GetRain().Set(0.5, time, 300);
        }
    }
}
```

---

## cfgweather.xml

Il file `cfgweather.xml` nella cartella della missione fornisce un modo dichiarativo per configurare il meteo senza scripting. Quando presente, sovrascrive i parametri predefiniti della macchina a stati meteo.

Struttura principale:

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

| Attributo | Descrizione |
|-----------|-------------|
| `reset` | Se resettare il meteo dalla memorizzazione all'avvio del server |
| `enable` | Se questo file e attivo |
| `actual` | Valore iniziale |
| `time` | Secondi per raggiungere il valore iniziale |
| `duration` | Secondi in cui il valore iniziale viene mantenuto |
| `limits min/max` | Intervallo per il valore del fenomeno |
| `timelimits min/max` | Intervallo per la durata della transizione (secondi) |
| `changelimits min/max` | Intervallo per la magnitudine del cambio per transizione |

---

## Riepilogo

| Concetto | Punto chiave |
|----------|-------------|
| Accesso | `GetGame().GetWeather()` restituisce il singleton `Weather` |
| Fenomeni | `GetOvercast()`, `GetRain()`, `GetFog()`, `GetSnowfall()`, `GetWindMagnitude()`, `GetWindDirection()` |
| Lettura | `phenomenon.GetActual()` per il valore corrente (0.0 - 1.0) |
| Scrittura | `phenomenon.Set(previsione, tempoTransizione, durataMantenimento)` (solo server) |
| Temporali | `SetStorm(densita, soglia, timeout)` |
| Modalita manuale | `MissionWeather(true)` disabilita i cambiamenti meteo automatici |
| Data/Ora | `GetGame().GetWorld().GetDate()` / `SetDate()` |
| File di configurazione | `cfgweather.xml` nella cartella missione per setup dichiarativo |

---

## Buone pratiche

- **Chiama `MissionWeather(true)` prima di impostare il meteo in `init.c`.** Senza questo, la macchina a stati meteo automatica sovrascrivera le tue chiamate `Set()` entro pochi secondi. Prendi sempre il controllo manuale se vuoi un meteo deterministico.
- **Fornisci sempre un parametro `minDuration` in `Set()`.** Impostare `minDuration` a 0 significa che il sistema meteo puo immediatamente allontanarsi dal tuo valore. Usa almeno 300-600 secondi per mantenere lo stato desiderato.
- **Imposta la nuvolosita prima della pioggia.** La pioggia e visivamente legata alle soglie di nuvolosita. Se la nuvolosita e sotto la soglia configurata in `cfgweather.xml`, la pioggia non sara renderizzata anche se `GetRain().GetActual()` restituisce un valore diverso da zero.
- **Usa `WeatherOnBeforeChange()` per la politica meteo a livello di server.** Sovrascrivilo in una `modded class ChernarusPlusData` (o la sottoclasse WorldData appropriata) per limitare o reindirizzare le transizioni meteo senza combattere la macchina a stati.
- **Leggi il meteo su entrambi i lati, scrivi solo sul server.** `GetActual()` e `GetForecast()` funzionano su client e server, ma `Set()` ha effetto solo sul server.

---

## Compatibilita e impatto

> **Compatibilita mod:** I mod meteo comunemente sovrascrivono `WeatherOnBeforeChange()` nelle sottoclassi WorldData. Solo la catena di override di un mod viene eseguita per la classe WorldData di ogni mappa.

- **Ordine di caricamento:** Piu mod che sovrascrivono `WeatherOnBeforeChange` sulla stessa sottoclasse WorldData (es. `ChernarusPlusData`) devono tutti chiamare `super`, altrimenti i mod precedenti perdono la loro logica meteo.
- **Conflitti di classi moddate:** Se un mod chiama `MissionWeather(true)` e un altro si aspetta il meteo automatico, sono fondamentalmente incompatibili. Documenta se il tuo mod prende il controllo manuale del meteo.
- **Impatto sulle prestazioni:** Le chiamate all'API meteo sono leggere. L'interpolazione dei fenomeni viene eseguita nel motore, non nello script. Chiamate `Set()` frequenti (ogni frame) sono dispendiose ma non dannose.
- **Server/Client:** Tutte le chiamate `Set()` sono solo server. I client ricevono lo stato meteo tramite la sincronizzazione automatica del motore. Le chiamate `Set()` lato client vengono silenziosamente ignorate.

---

## Pattern osservati nei mod reali

> Questi pattern sono stati confermati studiando il codice sorgente di mod DayZ professionali.

| Pattern | Mod | File/Posizione |
|---------|-----|---------------|
| `MissionWeather(true)` + ciclo meteo scriptato con `CallLater` | Expansion | Controller meteo nell'init della missione |
| Override `WeatherOnBeforeChange` per prevenire pioggia in aree specifiche | COT Weather Module | `ChernarusPlusData` moddata |
| Comando admin per forzare sereno/temporale tramite `Set()` con lunga durata di mantenimento | VPP Admin Tools | Pannello admin meteo |
| `cfgweather.xml` con soglie personalizzate per mappe solo neve | Namalsk | Config cartella missione |

---

[<< Precedente: Veicoli](02-vehicles.md) | **Meteo** | [Successivo: Telecamere >>](04-cameras.md)
