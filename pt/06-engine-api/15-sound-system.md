# Capítulo 6.15: Sistema de Som

[Início](../README.md) | [<< Anterior: Sistema do Jogador](14-player-system.md) | **Sistema de Som** | [Próximo: Sistema de Crafting >>](16-crafting-system.md)

---

## Introdução

O DayZ fornece duas abordagens principais para reproduzir sons a partir de scripts: uma **API de alto nível** construída em torno de `EffectSound` e `SEffectManager`, e um **atalho orientado a config** via `PlaySoundSet` / `StopSoundSet` em entidades. Ambas dependem, em última instância, das definições de `CfgSoundSets` e `CfgSoundShaders` em nível de motor no `config.cpp`.

Toda reprodução de som via script é **apenas do lado do cliente**. Servidores dedicados não têm dispositivo de saída de áudio --- chamar métodos de som em um servidor headless desperdiça recursos e pode disparar avisos. Sempre proteja chamadas de som com `!GetGame().IsDedicatedServer()` ou use as proteções embutidas fornecidas pela API.

Este capítulo cobre o pipeline completo de som: definições de config, a API `SEffectManager`, os métodos de conveniência de entidades, a classe `EffectSound`, sons espaciais vs UI, looping e padrões comuns encontrados em mods vanilla e da comunidade.

---

## Visão Geral da Arquitetura de Som

```
config.cpp                         Script
-----------                        ------

CfgSoundShaders                    SEffectManager
  (samples[], volume, range)           |
       |                               v
CfgSoundSets                      EffectSound
  (spatial, loop, doppler,             |
   soundShaders[], volumeCurve)        v
       |                           SoundParams -> SoundObjectBuilder -> SoundObject
       +---------------------------+                                        |
                                                                            v
                                                                     AbstractSoundScene
                                                                       Play2D / Play3D
                                                                            |
                                                                            v
                                                                      AbstractWave
                                                                  (o handle do som ao vivo)
```

**Resumo do fluxo:**

1. Você define amostras de áudio em `CfgSoundShaders` (quais arquivos `.ogg`, volume, alcance).
2. Você agrupa shaders em `CfgSoundSets` (modo espacial, looping, doppler, curva de atenuação).
3. Do script, você referencia o **nome do SoundSet** (ex.: `"MyMod_Alert_SoundSet"`).
4. O motor carrega a config, constrói um `SoundObject` e o reproduz através do `AbstractSoundScene`.

---

## Configuração no Config

Antes de qualquer som poder ser reproduzido do script, ele deve ser definido no `config.cpp`. Duas classes de config são necessárias: `CfgSoundShaders` e `CfgSoundSets`.

### CfgSoundShaders

Um sound shader mapeia arquivos de amostras de áudio para parâmetros de reprodução.

```cpp
class CfgSoundShaders
{
    class MyMod_Alert_SoundShader
    {
        // Array de pares {caminho, probabilidade}
        // Caminho é relativo à raiz do mod, SEM extensão de arquivo
        // O motor espera formato .ogg
        samples[] =
        {
            {"MyMod\Sounds\data\alert_01", 1},
            {"MyMod\Sounds\data\alert_02", 1}
        };
        volume = 0.8;       // Volume base (0.0 - 1.0)
        frequency = 1;      // Multiplicador de velocidade de reprodução
        range = 100;         // Distância máxima audível em metros
        radius = 50;         // Distância em que a atenuação começa
        limitation = 0;      // Máximo de instâncias simultâneas (0 = ilimitado)
    };
};
```

**Propriedades chave:**

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `samples[]` | array | Pares de `{caminho, probabilidade}`. Múltiplas entradas para variação aleatória. |
| `volume` | float | Multiplicador de volume base, 0.0 a 1.0. |
| `frequency` | float | Multiplicador de pitch. 1.0 = normal, 2.0 = velocidade dobrada. |
| `range` | float | Distância máxima (metros) em que o som pode ser ouvido. |
| `radius` | float | Distância (metros) em que a atenuação de volume começa. |
| `limitation` | int | Máximo de instâncias concorrentes deste shader. 0 = sem limite. |

### CfgSoundSets

Um sound set combina um ou mais shaders com configurações espaciais e de processamento. É o que os scripts referenciam pelo nome.

```cpp
class CfgSoundSets
{
    class MyMod_Alert_SoundSet
    {
        soundShaders[] =
        {
            "MyMod_Alert_SoundShader"
        };
        // Tipo de processamento 3D (usar tipos fornecidos pelo motor)
        sound3DProcessingType = "character3DProcessingType";
        // Curva de atenuação de volume
        volumeCurve = "characterAttenuationCurve";
        // Preset de filtro de distância
        distanceFilter = "defaultDistanceFilter";
        // 1 = som posicional 3D, 0 = 2D (UI/HUD)
        spatial = 1;
        // 1 = repete continuamente, 0 = toca uma vez
        loop = 0;
        // 1 = efeito doppler habilitado, 0 = desabilitado
        doppler = 0;
    };
};
```

**Propriedades chave:**

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `soundShaders[]` | array | Lista de nomes de classes `CfgSoundShaders` a usar. |
| `spatial` | int | `1` para áudio posicional 3D, `0` para 2D (plano, sem posição). |
| `loop` | int | `1` para repetir, `0` para tocar uma vez. |
| `doppler` | int | `1` para habilitar mudança de pitch doppler para fontes em movimento. |
| `sound3DProcessingType` | string | Preset de processamento do motor para sons 3D. |
| `volumeCurve` | string | Nome da curva de atenuação controlando volume por distância. |
| `distanceFilter` | string | Preset de filtro passa-baixa aplicado com distância. |

### Dependência de CfgPatches

Sua config de som deve declarar uma dependência de `DZ_Sounds_Effects` (ou outra base apropriada) para que os shaders de som base e tipos de processamento do motor estejam disponíveis:

```cpp
class CfgPatches
{
    class MyMod_Sounds
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Sounds_Effects"
        };
    };
};
```

### Herança para Configs Mais Limpas

Defina um sound set base e herde dele para evitar repetir propriedades comuns:

```cpp
class CfgSoundSets
{
    // Classe base com configurações compartilhadas
    class MyMod_Base_SoundSet
    {
        sound3DProcessingType = "character3DProcessingType";
        volumeCurve = "characterAttenuationCurve";
        spatial = 1;
        doppler = 0;
        loop = 0;
        distanceFilter = "defaultDistanceFilter";
    };

    // Alerta único herda a base
    class MyMod_Alert_SoundSet : MyMod_Base_SoundSet
    {
        soundShaders[] = { "MyMod_Alert_SoundShader" };
    };

    // Ambiente em loop herda e sobrescreve loop
    class MyMod_Ambient_SoundSet : MyMod_Base_SoundSet
    {
        soundShaders[] = { "MyMod_Ambient_SoundShader" };
        loop = 1;
    };
};
```

---

## SEffectManager --- Reproduzindo Sons de Qualquer Lugar

`SEffectManager` é uma classe gerenciadora estática (`scripts/3_game/effectmanager.c`) que lida com criação, registro e tempo de vida de todos os objetos `Effect`, incluindo `EffectSound`. É a API principal para reproduzir sons de código de script arbitrário.

### Reproduzir um Som Único em uma Posição

```c
EffectSound sound = SEffectManager.PlaySound("MyMod_Alert_SoundSet", position);
sound.SetAutodestroy(true);
```

`PlaySound` cria um `EffectSound`, o registra no gerenciador e imediatamente inicia a reprodução. Definir `SetAutodestroy(true)` garante que o efeito seja automaticamente limpo e desregistrado quando o som terminar.

### Assinatura Completa

```c
static EffectSound PlaySound(
    string sound_set,         // nome da classe CfgSoundSets
    vector position,          // posição no mundo
    float play_fade_in = 0,   // duração do fade-in (segundos)
    float stop_fade_out = 0,  // duração do fade-out (segundos)
    bool loop = false         // reprodução em loop
);
```

### Reproduzir um Som Anexado a um Objeto

```c
EffectSound sound = SEffectManager.PlaySoundOnObject(
    "MyMod_EngineLoop_SoundSet",
    vehicle,    // o Object pai a seguir
    0.5,        // duração do fade-in
    0.5,        // duração do fade-out
    true        // loop
);
```

O som vai acompanhar a posição do objeto automaticamente. Quando o objeto se mover, o som o segue.

### Reproduzir com SoundParams em Cache

Para sons reproduzidos frequentemente (ex.: cliques de UI, passos), use params em cache para evitar re-parsear a config toda vez:

```c
EffectSound sound = SEffectManager.PlaySoundCachedParams(
    "MyMod_Click_SoundSet",
    GetGame().GetPlayer().GetPosition()
);
sound.SetAutodestroy(true);
```

Internamente, `SEffectManager` mantém um cache `map<string, ref SoundParams>`. A primeira chamada para um dado sound set cria o `SoundParams`; chamadas subsequentes o reutilizam.

### Reproduzir com Variáveis de Ambiente

```c
EffectSound sound = SEffectManager.PlaySoundEnviroment(
    "MyMod_Ambient_SoundSet",
    position
);
```

Esta variante chama `AddEnvSoundVariables` no `SoundObjectBuilder`, que atualiza controladores de som relacionados ao ambiente (chuva, vento, floresta, etc.) baseados na posição. Use isso para sons ambientais que devem reagir aos arredores.

### Criar Sem Reproduzir

```c
EffectSound sound = SEffectManager.CreateSound(
    "MyMod_Ready_SoundSet",
    position,
    0.3,    // fade in
    0.3,    // fade out
    false,  // loop
    false   // variáveis de ambiente
);

// Configurar antes de reproduzir
sound.SetSoundMaxVolume(0.5);

// Reproduzir quando pronto
sound.SoundPlay();
```

### Parando e Destruindo

```c
// Parar um som (respeita fade-out se configurado)
sound.SoundStop();

// Ou destruí-lo inteiramente (desregistra do gerenciador)
SEffectManager.DestroyEffect(sound);

// Helper legado (sempre retorna true)
SEffectManager.DestroySound(sound);
```

---

## PlaySoundSet / StopSoundSet --- Métodos de Conveniência de Entidade

A classe `Object` fornece métodos de conveniência que envolvem `SEffectManager`. Estes são a maneira mais comum de reproduzir sons em entidades (itens, edifícios, veículos, jogadores).

### PlaySoundSet

```c
class MyItem : ItemBase
{
    ref EffectSound m_AlertSound;

    void PlayAlert()
    {
        // PlaySoundSet(out sound, soundset, fade_in, fade_out, loop)
        PlaySoundSet(m_AlertSound, "MyMod_Alert_SoundSet", 0, 0);
    }

    void StopAlert()
    {
        StopSoundSet(m_AlertSound);
    }
}
```

**Assinatura do método em Object:**

```c
bool PlaySoundSet(
    out EffectSound sound,    // Saída: o EffectSound criado
    string sound_set,         // nome da classe CfgSoundSets
    float fade_in,            // duração do fade-in (segundos)
    float fade_out,           // duração do fade-out (segundos)
    bool loop = false         // reprodução em loop
);
```

**Detalhes de comportamento:**

- Automaticamente protege contra servidor dedicado (retorna `false` no servidor).
- Se a referência `sound` já contém um som sendo reproduzido e `loop` é `false`, chama `StopSoundSet` primeiro.
- Se `loop` é `true` e `sound` já está definido, retorna `true` sem criar um duplicado.
- Chama `SetAutodestroy(true)` no som criado.
- O som é vinculado ao objeto `this`, então segue a posição da entidade.

### PlaySoundSetLoop

Atalho para looping:

```c
ref EffectSound m_EngineSound;

// Equivalente a PlaySoundSet(m_EngineSound, "Engine_SoundSet", 0.5, 0.5, true)
PlaySoundSetLoop(m_EngineSound, "Engine_SoundSet", 0.5, 0.5);
```

### StopSoundSet

```c
bool StopSoundSet(out EffectSound sound);
```

Chama `SoundStop()` no efeito e define a referência como `null`. Retorna `false` se o som já era null ou em um servidor dedicado.

### PlaySoundSetAtMemoryPoint

Reproduz um som em um ponto de memória específico do modelo (definido no modelo P3D do objeto):

```c
ref EffectSound m_MuzzleSound;

// Reproduzir no ponto de memória "usti hlavne" (boca do cano)
PlaySoundSetAtMemoryPoint(m_MuzzleSound, "MyMod_Shot_SoundSet", "usti hlavne");

// Variante em loop
PlaySoundSetAtMemoryPointLooped(m_MuzzleSound, "MyMod_Flame_SoundSet", "usti hlavne", 0.3, 0.3);

// Variante segura: para som existente antes de reproduzir novo
PlaySoundSetAtMemoryPointLoopedSafe(m_MuzzleSound, "MyMod_Flame_SoundSet", "usti hlavne", 0.3, 0.3);
```

A variante "Safe" é útil quando um sound set pode mudar dinamicamente (ex.: alternando entre intensidades de fogo). Ela explicitamente para qualquer som em reprodução antes de iniciar o novo.

---

## A Classe EffectSound

`EffectSound` (`scripts/3_game/effects/effectsound.c`) estende `Effect` e envolve os tipos de nível inferior `SoundParams`, `SoundObjectBuilder`, `SoundObject` e `AbstractWave`. É o handle principal com o qual você interage após criar um som.

### Métodos Chave

| Método | Descrição |
|--------|-----------|
| `SoundPlay()` | Iniciar reprodução. Retorna `bool` (sucesso). |
| `SoundStop()` | Parar reprodução. Respeita duração de fade-out se definida. |
| `IsPlaying()` | Retorna `true` se o som está sendo reproduzido. |
| `IsSoundPlaying()` | Igual a `IsPlaying()`. Nome legado. |
| `SetSoundSet(string name)` | Definir o nome do CfgSoundSets. Deve ser chamado antes de reproduzir. |
| `GetSoundSet()` | Obter o nome do sound set atual. |
| `SetSoundLoop(bool loop)` | Habilitar ou desabilitar looping. Pode ser chamado durante a reprodução. |
| `SetSoundVolume(float vol)` | Definir volume relativo (0.0 a 1.0). |
| `GetSoundVolume()` | Obter o volume relativo atual. |
| `SetSoundMaxVolume(float vol)` | Definir teto máximo de volume (usado como alvo de fade-in). |
| `SetSoundFadeIn(float sec)` | Definir duração do fade-in em segundos. |
| `SetSoundFadeOut(float sec)` | Definir duração do fade-out em segundos. |
| `SetDoppler(bool enabled)` | Habilitar ou desabilitar efeito doppler. |
| `SetSoundWaveKind(WaveKind kind)` | Definir o canal da wave. Deve ser chamado antes de reproduzir. |
| `GetSoundWaveLength()` | Obter o comprimento total do som em segundos. |
| `GetSoundWaveTime()` | Obter tempo de reprodução decorrido em segundos. |
| `SetAutodestroy(bool auto)` | Se `true`, efeito auto-limpa ao parar. |
| `IsAutodestroy()` | Verificar configuração de autodestroy. |
| `SetParent(Object obj, int pivot)` | Anexar som para seguir uma entidade. |
| `SetPosition(vector pos)` | Definir posição no mundo. |
| `SetCurrentLocalPosition(vector pos)` | Definir posição relativa ao pai. |

### Métodos de Posição

```c
// Definir posição no mundo
sound.SetCurrentPosition("1000 200 5000");

// Definir posição relativa ao objeto pai
sound.SetCurrentLocalPosition("0 1.5 0");  // 1.5m acima da origem do pai

// Obter posição atual no mundo
vector pos = sound.GetCurrentPosition();

// Obter posição local relativa ao pai
vector localPos = sound.GetCurrentLocalPosition();
```

### Eventos

`EffectSound` expõe eventos `ScriptInvoker` para callbacks do ciclo de vida do som:

```c
EffectSound sound = SEffectManager.CreateSound("MyMod_Alert_SoundSet", position);

// Chamado quando a wave de som realmente começa a tocar
sound.Event_OnSoundWaveStarted.Insert(OnMyAlertStarted);

// Chamado quando a wave de som termina (ou é parada)
sound.Event_OnSoundWaveEnded.Insert(OnMyAlertEnded);

// Chamado quando o fade-in completa
sound.Event_OnSoundFadeInStopped.Insert(OnMyAlertFadedIn);

// Chamado quando o fade-out começa
sound.Event_OnSoundFadeOutStarted.Insert(OnMyAlertFadeOutStarted);

sound.SoundPlay();

// Assinaturas dos handlers de evento
void OnMyAlertStarted(EffectSound sound)
{
    // Som começou a tocar
}

void OnMyAlertEnded(EffectSound sound)
{
    // Som terminou
}
```

### Enum WaveKind

O enum `WaveKind` determina qual canal/barramento de áudio o som usa:

```c
enum WaveKind
{
    WAVEEFFECT,           // Efeito padrão
    WAVEEFFECTEX,         // Efeito estendido (PADRÃO para EffectSound)
    WAVESPEECH,           // Fala/voz
    WAVEMUSIC,            // Música
    WAVESPEECHEX,         // Fala estendida
    WAVEENVIRONMENT,      // Ambiente
    WAVEENVIRONMENTEX,    // Ambiente estendido
    WAVEWEAPONS,          // Sons de armas
    WAVEWEAPONSEX,        // Sons de armas estendido
    WAVEATTALWAYS,        // Sempre atenuado
    WAVEUI                // Sons de UI (sem processamento espacial)
}
```

Para sons de UI que devem ignorar posicionamento 3D, defina `WAVEUI`:

```c
EffectSound uiSound = SEffectManager.CreateSound("MyMod_Click_SoundSet", vector.Zero);
uiSound.SetSoundWaveKind(WaveKind.WAVEUI);
uiSound.SetAutodestroy(true);
uiSound.SoundPlay();
```

---

## Sons Posicionais 3D vs Sons de UI

### Sons Posicionais 3D

Sons 3D existem no espaço do mundo. Seu volume atenua com a distância e são afetados por oclusão, obstrução e opcionalmente mudança de pitch doppler.

**Requisitos de config:**
- `spatial = 1` em `CfgSoundSets`
- O arquivo de áudio **deve ser mono** (canal único). Arquivos estéreo não serão espacializados corretamente.
- Defina `range` e `radius` apropriados em `CfgSoundShaders`.

```c
// Som 3D em uma posição específica do mundo
EffectSound sound = SEffectManager.PlaySound("MyMod_Explosion_SoundSet", explosionPos);
sound.SetAutodestroy(true);
```

### Sons de UI / HUD

Sons de UI tocam em volume constante independentemente da posição do jogador. Eles não são espacializados.

**Requisitos de config:**
- `spatial = 0` em `CfgSoundSets`
- O arquivo de áudio pode ser estéreo.

```c
// Som de UI (posição é irrelevante mas necessária pela API)
EffectSound sound = SEffectManager.CreateSound("MyMod_ButtonClick_SoundSet", vector.Zero);
sound.SetSoundWaveKind(WaveKind.WAVEUI);
sound.SetAutodestroy(true);
sound.SoundPlay();
```

### Atenuação por Distância

A atenuação por distância é controlada pela propriedade `volumeCurve` em `CfgSoundSets` e pelas propriedades `radius`/`range` em `CfgSoundShaders`:

- De 0 a `radius`: volume total.
- De `radius` a `range`: volume atenua de acordo com `volumeCurve`.
- Além de `range`: silêncio.

---

## Sons em Loop

### Looping Baseado em Config

Defina `loop = 1` na sua definição de `CfgSoundSets`:

```cpp
class CfgSoundSets
{
    class MyMod_Generator_SoundSet
    {
        soundShaders[] = { "MyMod_Generator_SoundShader" };
        sound3DProcessingType = "character3DProcessingType";
        volumeCurve = "characterAttenuationCurve";
        spatial = 1;
        loop = 1;   // <-- repete continuamente
        doppler = 0;
        distanceFilter = "defaultDistanceFilter";
    };
};
```

### Looping Baseado em Script

Você também pode habilitar looping do script, sobrescrevendo a config:

```c
EffectSound sound = SEffectManager.CreateSound("MyMod_Generator_SoundSet", position);
sound.SetSoundLoop(true);
sound.SoundPlay();
```

Ou com o atalho do `SEffectManager`:

```c
EffectSound sound = SEffectManager.PlaySound(
    "MyMod_Generator_SoundSet",
    position,
    0.5,    // fade in
    0.5,    // fade out
    true    // loop = true
);
```

### Iniciando e Parando Loops em Entidades

Os métodos de conveniência de entidade são a abordagem mais limpa para sons em loop:

```c
class MyGenerator : ItemBase
{
    ref EffectSound m_EngineLoop;

    void StartEngine()
    {
        // PlaySoundSetLoop lida com a proteção contra reprodução duplicada
        PlaySoundSetLoop(m_EngineLoop, "MyMod_Generator_SoundSet", 0.5, 0.5);
    }

    void StopEngine()
    {
        StopSoundSet(m_EngineLoop);
    }

    void ~MyGenerator()
    {
        // Sempre limpar no destrutor
        StopSoundSet(m_EngineLoop);
    }
}
```

### Padrão de Crossfade

Para transicionar suavemente entre dois estados de som (ex.: motor parado para motor acelerando):

```c
class MyVehicleSound
{
    ref EffectSound m_IdleSound;
    ref EffectSound m_RevSound;

    void TransitionToRev()
    {
        // Parar idle com fade-out
        if (m_IdleSound && m_IdleSound.IsPlaying())
        {
            m_IdleSound.SoundStop();  // Usa o fade-out definido durante a criação
        }

        // Iniciar aceleração com fade-in
        if (!m_RevSound || !m_RevSound.IsPlaying())
        {
            m_RevSound = SEffectManager.PlaySound(
                "MyMod_EngineRev_SoundSet",
                m_Vehicle.GetPosition(),
                0.5,    // 0.5s de fade-in
                0.5,    // 0.5s de fade-out (para quando pararmos depois)
                true    // loop
            );
        }
    }
}
```

---

## API de Nível Inferior: AbstractSoundScene

Para casos de uso avançados, você pode contornar `SEffectManager` e usar o `AbstractSoundScene` do motor diretamente. Isso raramente é necessário, mas é como `EffectSound` funciona internamente.

```c
// Construir sound params a partir de um nome de sound set
SoundParams params = new SoundParams("MyMod_Alert_SoundSet");
if (!params.IsValid())
    return;  // Sound set não encontrado na config

// Criar um builder e opcionalmente adicionar variáveis de ambiente
SoundObjectBuilder builder = new SoundObjectBuilder(params);
builder.AddEnvSoundVariables(position);

// Adicionar variáveis personalizadas referenciadas pela config de som
builder.AddVariable("speed", 0.5);

// Construir o objeto de som
SoundObject soundObj = builder.BuildSoundObject();
soundObj.SetPosition(position);
soundObj.SetKind(WaveKind.WAVEEFFECTEX);

// Reproduzir através da cena de som
AbstractSoundScene soundScene = GetGame().GetSoundScene();
AbstractWave wave = soundScene.Play3D(soundObj, builder);

// Controlar a wave ao vivo
wave.SetVolume(0.8);
wave.Loop(false);
```

### Métodos de AbstractWave

O `AbstractWave` é o handle ao vivo para um som em reprodução:

| Método | Descrição |
|--------|-----------|
| `Play()` | Iniciar reprodução. |
| `Stop()` | Parar reprodução. |
| `Restart()` | Reiniciar do início. |
| `Loop(bool)` | Habilitar/desabilitar looping. |
| `SetVolume(float)` | Definir volume absoluto. |
| `SetVolumeRelative(float)` | Definir volume relativo à base (0.0 - 1.0). |
| `SetFrequency(float)` | Definir multiplicador de pitch/velocidade. |
| `SetPosition(vector pos, vector vel)` | Definir posição 3D e velocidade. |
| `SetDoppler(bool)` | Habilitar/desabilitar doppler. |
| `SetFadeInFactor(float)` | Definir fator de volume de fade-in. |
| `SetFadeOutFactor(float)` | Definir fator de volume de fade-out. |
| `SetStartOffset(float)` | Iniciar reprodução em offset (segundos). |
| `Skip(float)` | Avançar em segundos. |
| `GetLength()` | Obter comprimento total em segundos. **Bloqueante se header não carregado.** |
| `GetCurrPosition()` | Obter posição atual como porcentagem (0.0 - 1.0). |
| `GetVolume()` | Obter volume atual. |
| `GetFrequency()` | Obter frequência/pitch atual. |
| `IsHeaderLoaded()` | Verificar se o header de áudio está carregado (não-bloqueante). |

### Eventos de AbstractWave

```c
AbstractWaveEvents events = wave.GetEvents();
events.Event_OnSoundWaveStarted.Insert(MyOnStartCallback);
events.Event_OnSoundWaveEnded.Insert(MyOnEndCallback);
events.Event_OnSoundWaveLoaded.Insert(MyOnLoadCallback);
events.Event_OnSoundWaveHeaderLoaded.Insert(MyOnHeaderCallback);
events.Event_OnSoundWaveStopped.Insert(MyOnStopCallback);
```

### Vinculação de SoundObject a Pai

Você pode vincular um `SoundObject` a uma entidade para que ele acompanhe o movimento dessa entidade:

```c
SoundObject soundObj = builder.BuildSoundObject();
soundObj.SetParent(parentEntity, -1);  // -1 = sem ponto pivot específico
soundObj.SetPosition("0 1 0");        // Offset local: 1m acima da origem da entidade
```

---

## Padrões Comuns

### 1. Som de Clique de Botão (UI)

```c
class MyMenu : UIScriptedMenu
{
    void OnButtonClick()
    {
        EffectSound sound = SEffectManager.PlaySoundCachedParams(
            "MyMod_Click_SoundSet",
            GetGame().GetPlayer().GetPosition()
        );
        sound.SetAutodestroy(true);
    }
}
```

Config:

```cpp
class CfgSoundShaders
{
    class MyMod_Click_SoundShader
    {
        samples[] = { {"MyMod\Sounds\data\ui_click", 1} };
        volume = 0.5;
    };
};

class CfgSoundSets
{
    class MyMod_Click_SoundSet
    {
        soundShaders[] = { "MyMod_Click_SoundShader" };
        spatial = 0;
        loop = 0;
    };
};
```

### 2. Som de Alerta / Notificação

```c
void PlayAlertSound()
{
    if (GetGame().IsDedicatedServer())
        return;

    PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
    if (!player)
        return;

    EffectSound alert = SEffectManager.PlaySound(
        "MyMod_Notification_SoundSet",
        player.GetPosition()
    );
    alert.SetAutodestroy(true);
}
```

### 3. Loop Ambiente com Atenuação por Distância

```c
class MyAmbientSource : BuildingSuper
{
    ref EffectSound m_AmbientSound;

    override void EOnInit(IEntity other, int extra)
    {
        if (!GetGame().IsDedicatedServer())
        {
            PlaySoundSetLoop(m_AmbientSound, "MyMod_AmbientHum_SoundSet", 1.0, 1.0);
        }
    }

    void ~MyAmbientSource()
    {
        StopSoundSet(m_AmbientSound);
    }
}
```

Config com alcance grande:

```cpp
class CfgSoundShaders
{
    class MyMod_AmbientHum_SoundShader
    {
        samples[] = { {"MyMod\Sounds\data\ambient_hum", 1} };
        volume = 0.4;
        radius = 30;
        range = 120;
    };
};

class CfgSoundSets
{
    class MyMod_AmbientHum_SoundSet
    {
        soundShaders[] = { "MyMod_AmbientHum_SoundShader" };
        sound3DProcessingType = "character3DProcessingType";
        volumeCurve = "characterAttenuationCurve";
        spatial = 1;
        loop = 1;
        doppler = 0;
        distanceFilter = "defaultDistanceFilter";
    };
};
```

### 4. Som Personalizado de Arma (Troca de Modo de Tiro)

Do vanilla `weapon_base.c`:

```c
void PlayFireModeSound()
{
    EffectSound eff;

    if (fireMode == 0)
        eff = SEffectManager.PlaySound("Fire_Mode_Switch_Marked_Click_SoundSet", GetPosition());
    else
        eff = SEffectManager.PlaySound("Fire_Mode_Switch_Simple_Click_SoundSet", GetPosition());

    eff.SetAutodestroy(true);
}
```

### 5. Som Estilo Expansion com Parada Atrasada

Dos sons de partida de motor do Expansion, onde sons são criados manualmente e parados em um timer:

```c
void PlayEngineStartSound(CarScript vehicle, string soundSet, float stopDelay)
{
    vector position = vehicle.ModelToWorld(vehicle.GetEnginePos());

    EffectSound sound = SEffectManager.CreateSound(soundSet, position, 0, 0, false, false);
    sound.SoundPlay();

    if (stopDelay > 0)
    {
        // Parar após atraso (milissegundos)
        GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(sound.Stop, stopDelay * 1000);
    }
}
```

### 6. Som em um Ponto de Memória

```c
class MyExplosiveBarrel : BuildingSuper
{
    ref EffectSound m_FuseSound;

    void LightFuse()
    {
        // "fuse_point" deve existir como ponto de memória no modelo P3D
        PlaySoundSetAtMemoryPointLooped(
            m_FuseSound,
            "MyMod_Fuse_SoundSet",
            "fuse_point",
            0.2,   // fade in
            0.2    // fade out
        );
    }

    void Explode()
    {
        StopSoundSet(m_FuseSound);
    }
}
```

---

## Erros Comuns

### 1. Usar Arquivos Estéreo para Sons 3D

Arquivos de áudio usados com `spatial = 1` **devem ser mono** (canal único). Arquivos estéreo não serão espacializados corretamente pelo motor --- o som parecerá vir de todos os lugares ou apenas de um lado. Sempre converta seu áudio para `.ogg` mono para qualquer som posicional 3D.

### 2. Não Parar Sons no Destrutor

Se você armazena uma referência `EffectSound` e o objeto proprietário é destruído sem parar o som, o som pode continuar tocando como órfão, ou pior, causar um vazamento de memória no mapa interno do `SEffectManager`.

```c
// ERRADO: sem limpeza
class MyObject : ItemBase
{
    ref EffectSound m_Loop;

    void StartLoop()
    {
        PlaySoundSetLoop(m_Loop, "MyMod_Loop_SoundSet", 0, 0);
    }
    // Limpeza no destrutor faltando!
}

// CORRETO: sempre parar no destrutor
class MyObject : ItemBase
{
    ref EffectSound m_Loop;

    void StartLoop()
    {
        PlaySoundSetLoop(m_Loop, "MyMod_Loop_SoundSet", 0, 0);
    }

    void ~MyObject()
    {
        StopSoundSet(m_Loop);
    }
}
```

### 3. Reproduzir Sons em um Servidor Dedicado

Servidores dedicados não têm dispositivo de áudio. Chamadas de som no servidor desperdiçam CPU e podem registrar avisos. Sempre proteja:

```c
// ERRADO
void OnActivated()
{
    SEffectManager.PlaySound("MyMod_Activate_SoundSet", GetPosition());
}

// CORRETO
void OnActivated()
{
    if (!GetGame().IsDedicatedServer())
    {
        EffectSound snd = SEffectManager.PlaySound("MyMod_Activate_SoundSet", GetPosition());
        snd.SetAutodestroy(true);
    }
}
```

Nota: `PlaySoundSet` / `StopSoundSet` em `Object` já incluem essa proteção internamente, então você não precisa verificar ao usar esses métodos.

### 4. Definição de CfgSoundSets Ausente

Se o nome do sound set passado para `SEffectManager.PlaySound()` não corresponder a nenhuma classe em `CfgSoundSets`, o motor falhará ao criar um `SoundParams` válido e o som não tocará. Você verá erros como `"Invalid sound set"` no log de script.

Sempre verifique:
- O nome do sound set no script corresponde ao nome da classe na config **exatamente** (sensível a maiúsculas/minúsculas).
- A config está devidamente carregada via `CfgPatches` com `requiredAddons` corretos.
- O caminho do arquivo `.ogg` em `CfgSoundShaders` está correto e o arquivo existe.

### 5. Esquecer SetAutodestroy em Sons Únicos

Sons únicos criados via `SEffectManager.PlaySound()` permanecem registrados no mapa de efeitos mesmo após terminarem de tocar. Sem `SetAutodestroy(true)`, eles se acumulam e só são limpos quando `SEffectManager.Cleanup()` roda (no fim da missão).

```c
// ERRADO: som fica registrado para sempre
SEffectManager.PlaySound("MyMod_Beep_SoundSet", pos);

// CORRETO: auto-limpeza quando o som terminar
EffectSound snd = SEffectManager.PlaySound("MyMod_Beep_SoundSet", pos);
snd.SetAutodestroy(true);
```

### 6. Chamar GetLength() Antes do Header Estar Carregado

`AbstractWave.GetLength()` é uma chamada bloqueante que espera o header de áudio carregar. Se chamada imediatamente após o início da reprodução, pode travar a thread principal. Verifique `IsHeaderLoaded()` primeiro ou use o evento de header-carregado:

```c
// ERRADO: potencialmente bloqueante
float len = wave.GetLength();

// CORRETO: esperar pelo header
if (wave.IsHeaderLoaded())
{
    float len = wave.GetLength();
}
else
{
    wave.GetEvents().Event_OnSoundWaveHeaderLoaded.Insert(OnHeaderReady);
}
```

---

## Sobrescritas de Controlador de Som

O motor expõe controladores de som globais para áudio ambiental. Você pode sobrescrevê-los do script:

```c
// Sobrescrever um valor de controlador
SetSoundControllerOverride("rain", 1.0, SoundControllerAction.Overwrite);

// Limitar um controlador a um valor máximo
SetSoundControllerOverride("wind", 0.5, SoundControllerAction.Limit);

// Silenciar todos os controladores de ambiente
MuteAllSoundControllers();

// Resetar todas as sobrescritas de volta ao normal
ResetAllSoundControllers();
```

Nomes de controladores disponíveis incluem: `rain`, `night`, `meadow`, `trees`, `hills`, `houses`, `windy`, `deadBody`, `sea`, `forest`, `altitudeGround`, `altitudeSea`, `altitudeSurface`, `daytime`, `shooting`, `coast`, `waterDepth`, `overcast`, `fog`, `snowfall`, `caveSmall`, `caveBig`.

---

## Referência Rápida

| Tarefa | Método |
|--------|--------|
| Reproduzir único na posição | `SEffectManager.PlaySound(soundSet, pos)` |
| Reproduzir anexado a entidade | `SEffectManager.PlaySoundOnObject(soundSet, obj)` |
| Reproduzir na entidade (conveniência) | `PlaySoundSet(m_Sound, soundSet, fadeIn, fadeOut)` |
| Reproduzir loop na entidade | `PlaySoundSetLoop(m_Sound, soundSet, fadeIn, fadeOut)` |
| Parar som da entidade | `StopSoundSet(m_Sound)` |
| Reproduzir com params em cache | `SEffectManager.PlaySoundCachedParams(soundSet, pos)` |
| Criar sem reproduzir | `SEffectManager.CreateSound(soundSet, pos, ...)` |
| Destruir efeito | `SEffectManager.DestroyEffect(sound)` |
| Verificar se está tocando | `sound.IsPlaying()` ou `sound.IsSoundPlaying()` |
| Definir volume | `sound.SetSoundVolume(0.5)` |
| Definir loop do script | `sound.SetSoundLoop(true)` |
| Habilitar autodestroy | `sound.SetAutodestroy(true)` |

---

## Arquivos de Código-Fonte

| Arquivo | Descrição |
|---------|-----------|
| `scripts/3_game/effects/effectsound.c` | Classe `EffectSound` --- o wrapper principal de som |
| `scripts/3_game/effectmanager.c` | `SEffectManager` --- gerenciador estático para todos os efeitos |
| `scripts/3_game/sound.c` | `AbstractSoundScene`, `SoundObjectBuilder`, `SoundObject`, `SoundParams`, `AbstractWave` |
| `scripts/3_game/entities/object.c` | `PlaySoundSet`, `StopSoundSet`, `PlaySoundLoop` em `Object` |
| `scripts/3_game/entities/soundonvehicle.c` | Classe de entidade `SoundOnVehicle` |
| `scripts/4_world/static/betasound.c` | `BetaSound.SaySound()` --- helper legado de som de ação |

---

## Boas Práticas

- **Sempre chame `SetAutodestroy(true)` em sons únicos.** Sem isso, instâncias de `EffectSound` se acumulam no registro interno do `SEffectManager` e só são limpas no fim da missão, causando um vazamento de memória em sessões longas.
- **Proteja toda reprodução de som com `!GetGame().IsDedicatedServer()`.** Servidores dedicados não têm dispositivo de áudio. Chamar métodos de som no servidor desperdiça ciclos de CPU e pode registrar avisos. Os métodos de conveniência `PlaySoundSet` incluem essa proteção internamente, mas `SEffectManager.PlaySound()` não.
- **Use arquivos OGG mono para todos os sons posicionais 3D.** Arquivos estéreo não serão espacializados corretamente -- o motor não pode determinar panning esquerda/direita de uma fonte estéreo. Reserve estéreo para sons de UI com `spatial = 0`.
- **Pare sons em loop no destrutor do seu objeto.** Se a entidade proprietária for deletada sem parar o loop, o som toca indefinidamente como um efeito órfão sem maneira de pará-lo.
- **Prefixe nomes de classes CfgSoundShaders e CfgSoundSets com o identificador do seu mod.** Classes de config de som são globais. Dois mods usando o mesmo nome de classe (ex.: `Alert_SoundSet`) vão colidir silenciosamente, com a definição do último mod carregado prevalecendo.

---

## Compatibilidade e Impacto

- **Multi-Mod:** Nomes de classes CfgSoundShaders e CfgSoundSets compartilham um namespace global entre todos os mods carregados. Colisões de nomes fazem os sons de um mod silenciosamente substituírem os de outro. Sempre use um prefixo de mod único.
- **Desempenho:** Cada `EffectSound` ativo consome um canal de áudio. O motor tem um pool limitado de canais -- sons simultâneos excessivos (50+) podem fazer sons mais novos falharem silenciosamente. Use `limitation` em CfgSoundShaders para limitar instâncias concorrentes de sons frequentes.
- **Servidor/Cliente:** Toda reprodução de som é apenas do lado do cliente. O servidor não tem saída de áudio. Métodos de conveniência de entidade (`PlaySoundSet`, `StopSoundSet`) incluem proteções de servidor internamente, mas chamadas diretas a `SEffectManager` não.

---

[Início](../README.md) | [<< Anterior: Sistema do Jogador](14-player-system.md) | **Sistema de Som** | [Próximo: Sistema de Crafting >>](16-crafting-system.md)
