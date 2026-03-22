# Chapter 6.3: Weather System

[Home](../../README.md) | [<< Previous: Vehicles](02-vehicles.md) | **Weather** | [Next: Cameras >>](04-cameras.md)

---

## Introdução

DayZ possui um sistema de clima totalmente dinâmico controlado através da classe `Weather`. O sistema gerencia nebulosidade, chuva, neve, neblina, vento e tempestades. O clima pode ser configurado por script (a API Weather), pelo `cfgweather.xml` na pasta da missão, ou por uma máquina de estados de clima scriptada. Este capítulo cobre a API de script para ler e controlar o clima programaticamente.

---

## Acessando o Objeto Weather

```c
Weather weather = GetGame().GetWeather();
```

O objeto `Weather` e um singleton gerenciado pela engine. Ele está sempre disponível após a inicialização do mundo do jogo.

---

## Fenômenos Climáticos

Cada fenômeno climático (nebulosidade, neblina, chuva, neve, magnitude do vento, direção do vento) e representado por um objeto `WeatherPhenomenon`. Você os acessa através de métodos getter em `Weather`.

### Obtendo Objetos de Fenômeno

```c
proto native WeatherPhenomenon GetOvercast();
proto native WeatherPhenomenon GetFog();
proto native WeatherPhenomenon GetRain();
proto native WeatherPhenomenon GetSnowfall();
proto native WeatherPhenomenon GetWindMagnitude();
proto native WeatherPhenomenon GetWindDirection();
```

### API do WeatherPhenomenon

Cada fenômeno compartilha a mesma interface:

```c
class WeatherPhenomenon
{
    // Estado atual
    proto native float GetActual();          // Valor interpolado atual (0.0 - 1.0 para a maioria)
    proto native float GetForecast();        // Valor alvo sendo interpolado
    proto native float GetDuration();        // Quanto tempo a previsão atual persiste (segundos)

    // Definir a previsão (apenas servidor)
    proto native void Set(float forecast, float time = 0, float minDuration = 0);
    // forecast: valor alvo
    // time:     segundos para interpolar até esse valor (0 = instantâneo)
    // minDuration: tempo mínimo que o valor se mantém antes de mudança automática

    // Limites
    proto native void  SetLimits(float fnMin, float fnMax);
    proto native float GetMin();
    proto native float GetMax();

    // Limites de velocidade de mudança (quão rápido o fenômeno pode mudar)
    proto native void SetTimeLimits(float fnMin, float fnMax);

    // Limites de magnitude de mudança
    proto native void SetChangeLimits(float fnMin, float fnMax);
}
```

**Exemplo --- ler estado atual do clima:**

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

**Exemplo --- forçar clima limpo (servidor):**

```c
void ForceClearWeather()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(0.0, 30, 600);    // Céu limpo, transição de 30s, manter 10 min
    w.GetRain().Set(0.0, 10, 600);        // Sem chuva
    w.GetFog().Set(0.0, 30, 600);         // Sem neblina
    w.GetSnowfall().Set(0.0, 10, 600);    // Sem neve
}
```

**Exemplo --- criar uma tempestade:**

```c
void ForceStorm()
{
    Weather w = GetGame().GetWeather();
    w.GetOvercast().Set(1.0, 60, 1800);   // Nebulosidade total, rampa de 60s, manter 30 min
    w.GetRain().Set(0.8, 120, 1800);      // Chuva forte
    w.GetFog().Set(0.3, 120, 1800);       // Neblina leve
    w.GetWindMagnitude().Set(15.0, 60, 1800);  // Vento forte (m/s)
}
```

---

## Limites de Chuva

A chuva está ligada aos níveis de nebulosidade. A engine só renderiza chuva quando a nebulosidade excede um limite. Você pode configurar isso via `cfgweather.xml`:

```xml
<rain>
    <thresholds min="0.5" max="1.0" end="120" />
</rain>
```

- `min` / `max`: faixa de nebulosidade onde a chuva e permitida
- `end`: segundos para a chuva parar se a nebulosidade cair abaixo do limite

Em script, a chuva não aparecerá visualmente se a nebulosidade estiver muito baixa, mesmo que `GetRain().GetActual()` retorne um valor diferente de zero.

---

## Vento

O vento usa dois fenômenos: magnitude (velocidade em m/s) e direção (ângulo em radianos).

### Vetor do Vento

```c
proto native vector GetWind();           // Vetor de direção do vento (espaço mundo)
proto native float  GetWindSpeed();      // Velocidade do vento em m/s
```

**Exemplo --- obter informações do vento:**

```c
Weather w = GetGame().GetWeather();
vector windVec = w.GetWind();
float windSpd = w.GetWindSpeed();
Print(string.Format("Wind: %1 m/s, direction: %2", windSpd, windVec));
```

---

## Tempestades (Relâmpagos)

```c
proto native void SetStorm(float density, float threshold, float timeout);
```

| Parâmetro | Descrição |
|-----------|-------------|
| `density` | Densidade dos relâmpagos (0.0 - 1.0) |
| `threshold` | Nível mínimo de nebulosidade para relâmpagos aparecerem (0.0 - 1.0) |
| `timeout` | Segundos entre raios |

**Exemplo --- habilitar relâmpagos frequentes:**

```c
GetGame().GetWeather().SetStorm(1.0, 0.6, 10);
// Densidade total, ativa em 60% de nebulosidade, raios a cada 10 segundos
```

---

## Controle MissionWeather

Para assumir controle manual do clima (desabilitando a máquina de estados automática), chame:

```c
proto native void MissionWeather(bool use);
```

Quando `MissionWeather(true)` é chamado, a engine para as transições automáticas de clima e apenas suas chamadas `Set()` controladas por script controlam o clima.

**Exemplo --- controle manual total no init.c:**

```c
void main()
{
    // Assumir controle manual do clima
    GetGame().GetWeather().MissionWeather(true);

    // Definir clima desejado
    GetGame().GetWeather().GetOvercast().Set(0.3, 0, 0);
    GetGame().GetWeather().GetRain().Set(0.0, 0, 0);
    GetGame().GetWeather().GetFog().Set(0.1, 0, 0);
}
```

---

## Data e Hora

A data e hora do jogo afetam iluminação, posição do sol e o ciclo dia/noite. Estes são controlados através do objeto `World`, não `Weather`, mas estão intimamente relacionados.

### Obtendo Data/Hora Atual

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
```

### Definindo Data/Hora (Apenas Servidor)

```c
proto native void SetDate(int year, int month, int day, int hour, int minute);
```

**Exemplo --- definir horário para meio-dia:**

```c
int year, month, day, hour, minute;
GetGame().GetWorld().GetDate(year, month, day, hour, minute);
GetGame().GetWorld().SetDate(year, month, day, 12, 0);
```

### Aceleração do Tempo

A aceleração do tempo e configurada no `serverDZ.cfg` via:

```
serverTimeAcceleration = 12;      // 12x tempo real
serverNightTimeAcceleration = 4;  // 4x aceleração durante a noite
```

Em script, você pode ler o multiplicador de tempo atual, mas típicamente não pode alterá-lo em runtime.

---

## Máquina de Estados de Clima WorldData

O DayZ vanilla usa uma máquina de estados de clima scriptada em classes `WorldData` (ex: `ChernarusPlusData`, `EnochData`, `SakhalData`). O ponto principal de sobrescrita é:

```c
class WorldData
{
    void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual, float change,
                                float time);
}
```

Sobrescreva este método em uma classe `modded` WorldData para interceptar e modificar transições de clima:

```c
modded class ChernarusPlusData
{
    override void WeatherOnBeforeChange(EWeatherPhenomenon type, float actual,
                                         float change, float time)
    {
        super.WeatherOnBeforeChange(type, actual, change, time);

        // Impedir chuva de ultrapassar 0.5
        if (type == EWeatherPhenomenon.RAIN && change > 0.5)
        {
            GetGame().GetWeather().GetRain().Set(0.5, time, 300);
        }
    }
}
```

---

## cfgweather.xml

O arquivo `cfgweather.xml` na pasta da missão fornece uma maneira declarativa de configurar o clima sem scripting. Quando presente, ele sobrescreve os parâmetros padrão da máquina de estados de clima.

Estrutura principal:

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

| Atributo | Descrição |
|-----------|-------------|
| `reset` | Se deve resetar o clima do armazenamento ao iniciar o servidor |
| `enable` | Se este arquivo está ativo |
| `actual` | Valor inicial |
| `time` | Segundos para atingir o valor inicial |
| `duration` | Segundos que o valor inicial se mantém |
| `limits min/max` | Faixa para o valor do fenômeno |
| `timelimits min/max` | Faixa para duração da transição (segundos) |
| `changelimits min/max` | Faixa para magnitude de mudança por transição |

---

## Resumo

| Conceito | Ponto-chave |
|---------|-----------|
| Acesso | `GetGame().GetWeather()` retorna o singleton `Weather` |
| Fenômenos | `GetOvercast()`, `GetRain()`, `GetFog()`, `GetSnowfall()`, `GetWindMagnitude()`, `GetWindDirection()` |
| Leitura | `phenomenon.GetActual()` para valor atual (0.0 - 1.0) |
| Escrita | `phenomenon.Set(forecast, transitionTime, holdDuration)` (apenas servidor) |
| Tempestades | `SetStorm(density, threshold, timeout)` |
| Modo manual | `MissionWeather(true)` desabilita mudanças automáticas de clima |
| Data/Hora | `GetGame().GetWorld().GetDate()` / `SetDate()` |
| Arquivo config | `cfgweather.xml` na pasta da missão para configuração declarativa |

---

[<< Anterior: Veículos](02-vehicles.md) | **Clima** | [Próximo: Câmeras >>](04-cameras.md)
