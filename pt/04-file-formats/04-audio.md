# Chapter 4.4: Audio (.ogg, .wss)

[Home](../../README.md) | [<< Previous: Matérials](03-materials.md) | **Audio** | [Next: DayZ Tools Workflow >>](05-dayz-tools.md)

---

## Introdução

O design de som e um dos aspectos mais imersivos do modding de DayZ. Do estalo de um rifle ao vento ambiente em uma floresta, o audio da vida ao mundo do jogo. O DayZ usa **OGG Vorbis** como seu formato de audio principal e configura a reprodução de som atraves de um sistema em camadas de **CfgSoundShaders** e **CfgSoundSets** definidos no `config.cpp`. Entender esse pipeline -- do arquivo de audio bruto ao som espacializado no jogo -- é essencial para qualquer mod que introduza armas, veículos, efeitos ambientais ou feedback de UI personalizados.

Este capítulo cobre formatos de audio, o sistema de som orientado por configuração, audio posicional 3D, volume e atenuação por distancia, loops e o fluxo de trabalho completo para adicionar sons personalizados a um mod de DayZ.

---

## Sumário

- [Formatos de Audio](#formatos-de-audio)
- [CfgSoundShaders e CfgSoundSets](#cfgsoundshaders-e-cfgsoundsets)
- [Catégorias de Som](#catégorias-de-som)
- [Audio Posicional 3D](#audio-posicional-3d)
- [Volume e Atenuação por Distancia](#volume-e-atenuação-por-distancia)
- [Sons em Loop](#sons-em-loop)
- [Adicionando Sons Personalizados a um Mod](#adicionando-sons-personalizados-a-um-mod)
- [Ferramentas de Produção de Audio](#ferramentas-de-produção-de-audio)
- [Erros Comuns](#erros-comuns)
- [Boas Práticas](#boas-práticas)

---

## Formatos de Audio

### OGG Vorbis (Formato Principal)

**OGG Vorbis** é o formato de audio principal do DayZ. Todos os sons personalizados devem ser exportados como arquivos `.ogg`.

| Propriedade | Valor |
|-------------|-------|
| **Extensão** | `.ogg` |
| **Codec** | Vorbis (compressão com perda) |
| **Taxas de amostragem** | 44100 Hz (padrão), 22050 Hz (aceitavel para ambiente) |
| **Profundidade de bits** | Gerenciada pelo encoder (configuração de qualidade) |
| **Canais** | Mono (para sons 3D) ou Stereo (para musica/UI) |
| **Faixa de qualidade** | -1 a 10 (5-7 recomendado para audio de jogo) |

### Regras Principais para OGG no DayZ

- **Sons posicionais 3D DEVEM ser mono.** Se você fornecer um arquivo stereo para um som 3D, o motor pode não espacializa-lo corretamente ou pode ignorar um canal.
- **Sons de UI e musica podem ser stereo.** Sons nao-posicionais (menus, feedback de HUD, musica de fundo) funcionam corretamente em stereo.
- **A taxa de amostragem deve ser 44100 Hz** para a maioria dos sons. Taxas mais baixas (22050 Hz) podem ser usadas para sons ambientais distantes para economizar espaco.

### WSS (Formato Legado)

**WSS** e um formato de som legado de titulos mais antigos da Bohemia (serie Arma). O DayZ ainda pode carregar arquivos WSS, mas novos mods devem usar OGG exclusivamente.

| Propriedade | Valor |
|-------------|-------|
| **Extensão** | `.wss` |
| **Status** | Legado, não recomendado para novos mods |
| **Conversão** | Arquivos WSS podem ser convertidos para OGG com Audacity ou ferramentas similares |

Você encontrara arquivos WSS ao examinar dados vanilla do DayZ ou portar conteúdo de jogos mais antigos da Bohemia.

---

## CfgSoundShaders e CfgSoundSets

O sistema de audio do DayZ usa uma abordagem de configuração em duas camadas definida no `config.cpp`. Um **SoundShader** define qual arquivo de audio tocar e como, enquanto um **SoundSet** define onde e como o som e ouvido no mundo.

### O Relacionamento

```
config.cpp
  |
  |--> CfgSoundShaders     (O QUE tocar: arquivo, volume, frequencia)
  |      |
  |      |--> MyShader      references --> sound\my_sound.ogg
  |
  |--> CfgSoundSets         (COMO tocar: posicao 3D, distancia, espacial)
         |
         |--> MySoundSet    references --> MyShader
```

O código do jogo e outras configs referênciam **SoundSets**, nunca SoundShaders diretamente. SoundSets são a interface publica; SoundShaders são o detalhe de implementacao.

### CfgSoundShaders

Um SoundShader define o conteúdo bruto de audio e parâmetros básicos de reprodução:

```cpp
class CfgSoundShaders
{
    class MyMod_GunShot_SoundShader
    {
        // Array of audio files -- engine picks one randomly
        samples[] =
        {
            {"MyMod\sound\gunshot_01", 1},    // {path (no extension), probability weight}
            {"MyMod\sound\gunshot_02", 1},
            {"MyMod\sound\gunshot_03", 1}
        };
        volume = 1.0;                          // Base volume (0.0 - 1.0)
        range = 300;                           // Maximum audible distance (meters)
        rangeCurve[] = {{0, 1.0}, {300, 0.0}}; // Volume falloff curve
    };
};
```

#### Propriedades do SoundShader

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `samples[]` | array | Lista de pares `{caminho, peso}`. O caminho exclui a extensão do arquivo. |
| `volume` | float | Multiplicador de volume base (0.0 a 1.0). |
| `range` | float | Distancia máxima audivel em metros. |
| `rangeCurve[]` | array | Array de pontos `{distancia, volume}` definindo atenuação ao longo da distancia. |
| `frequency` | float | Multiplicador de velocidade de reprodução. 1.0 = normal, 0.5 = metade da velocidade (tom mais baixo), 2.0 = velocidade dobrada (tom mais alto). |

> **Importante:** O caminho em `samples[]` NAO inclui a extensão do arquivo. O motor acrescenta `.ogg` (ou `.wss`) automáticamente com base no que encontra no disco.

### CfgSoundSets

Um SoundSet agrupa um ou mais SoundShaders e define as propriedades espaciais e comportamentais:

```cpp
class CfgSoundSets
{
    class MyMod_GunShot_SoundSet
    {
        soundShaders[] = {"MyMod_GunShot_SoundShader"};
        volumeFactor = 1.0;          // Volume scaling (applied on top of shader volume)
        frequencyFactor = 1.0;       // Frequency scaling
        volumeCurve = "InverseSquare"; // Predefined attenuation curve name
        spatial = 1;                  // 1 = 3D positional, 0 = 2D (HUD/menu)
        doppler = 0;                  // 1 = enable Doppler effect
        loop = 0;                     // 1 = loop continuously
    };
};
```

#### Propriedades do SoundSet

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `soundShaders[]` | array | Lista de nomes de classe de SoundShader para combinar. |
| `volumeFactor` | float | Multiplicador de volume adicional aplicado sobre o volume do shader. |
| `frequencyFactor` | float | Multiplicador adicional de frequência/tom. |
| `frequencyRandomizer` | float | Variacao aleatoria de tom (0.0 = nenhuma, 0.1 = +/- 10%). |
| `volumeCurve` | string | Curva de atenuação nomeada: `"InverseSquare"`, `"Linear"`, `"Logarithmic"`. |
| `spatial` | int | `1` para audio posicional 3D, `0` para 2D (UI, musica). |
| `doppler` | int | `1` para habilitar mudanca de tom Doppler para fontes em movimento. |
| `loop` | int | `1` para loop continuo, `0` para reprodução única. |
| `distanceFilter` | int | `1` para aplicar filtro passa-baixa a distancia (sons distantes abafados). |
| `occlusionFactor` | float | Quanto paredes/terreno abafam o som (0.0 a 1.0). |
| `obstructionFactor` | float | Quanto obstaculos entre a fonte e o ouvinte afetam o som. |

---

## Catégorias de Som

O DayZ organiza sons em catégorias que afetam como eles interagem com o sistema de mixagem de audio do jogo.

### Sons de Armas

Sons de armas são o audio mais complexo no DayZ, típicamente envolvendo múltiplos SoundSets para diferentes aspectos de um único tiro:

```
Shot fired
  |--> Close shot SoundSet       (o "bang" ouvido de perto)
  |--> Distance shot SoundSet    (o estrondo/eco ouvido de longe)
  |--> Tail SoundSet             (reverb/eco que se segue)
  |--> Supersonic crack SoundSet (bala passando acima da cabeca)
  |--> Mechanical SoundSet       (ciclagem do ferrolho, insercao de carregador)
```

Exemplo de configuração de som de arma:

```cpp
class CfgSoundShaders
{
    class MyMod_Rifle_Shot_SoundShader
    {
        samples[] =
        {
            {"MyMod\sound\weapons\rifle_shot_01", 1},
            {"MyMod\sound\weapons\rifle_shot_02", 1},
            {"MyMod\sound\weapons\rifle_shot_03", 1}
        };
        volume = 1.0;
        range = 200;
        rangeCurve[] = {{0, 1.0}, {50, 0.8}, {100, 0.4}, {200, 0.0}};
    };

    class MyMod_Rifle_Tail_SoundShader
    {
        samples[] =
        {
            {"MyMod\sound\weapons\rifle_tail_01", 1},
            {"MyMod\sound\weapons\rifle_tail_02", 1}
        };
        volume = 0.8;
        range = 800;
        rangeCurve[] = {{0, 0.6}, {200, 0.4}, {500, 0.2}, {800, 0.0}};
    };
};

class CfgSoundSets
{
    class MyMod_Rifle_Shot_SoundSet
    {
        soundShaders[] = {"MyMod_Rifle_Shot_SoundShader"};
        volumeFactor = 1.0;
        spatial = 1;
        doppler = 0;
        loop = 0;
    };

    class MyMod_Rifle_Tail_SoundSet
    {
        soundShaders[] = {"MyMod_Rifle_Tail_SoundShader"};
        volumeFactor = 1.0;
        spatial = 1;
        doppler = 0;
        loop = 0;
        distanceFilter = 1;
    };
};
```

### Sons Ambientais

Audio ambiental para atmosfera:

```cpp
class MyMod_Wind_SoundShader
{
    samples[] = {{"MyMod\sound\ambient\wind_loop", 1}};
    volume = 0.5;
    range = 50;
};

class MyMod_Wind_SoundSet
{
    soundShaders[] = {"MyMod_Wind_SoundShader"};
    volumeFactor = 0.6;
    spatial = 0;           // Non-positional (ambient surround)
    loop = 1;              // Continuous loop
};
```

### Sons de UI

Sons de feedback de interface (cliques de botao, notificacoes):

```cpp
class MyMod_ButtonClick_SoundShader
{
    samples[] = {{"MyMod\sound\ui\click_01", 1}};
    volume = 0.7;
    range = 0;             // No spatial range needed
};

class MyMod_ButtonClick_SoundSet
{
    soundShaders[] = {"MyMod_ButtonClick_SoundShader"};
    volumeFactor = 0.8;
    spatial = 0;           // 2D -- plays in the listener's head
    loop = 0;
};
```

### Sons de Veículos

Veículos usam configurações de som complexas com múltiplos componentes:

- **Motor em marcha lenta** -- loop, tom varia com RPM
- **Aceleracao do motor** -- loop, volume e tom escalam com acelerador
- **Ruido de pneu** -- loop, volume escala com velocidade
- **Buzina** -- acionada, loop enquanto pressionada
- **Colisao** -- única reprodução ao colidir

### Sons de Personagem

Sons relacionados ao jogador incluem:

- **Passos** -- varia por matérial da superfície (concreto, grama, madeira, metal)
- **Respiracao** -- dependente de stamina
- **Voz** -- emotes e comandos
- **Inventario** -- sons de manipulacao de itens

---

## Audio Posicional 3D

O DayZ usa audio espacial 3D para posicionar sons no mundo do jogo. Quando uma arma dispara a 200 metros a sua esquerda, você ouve do alto-falante/fone esquerdo com reducao de volume apropriada.

### Requisitos para Audio 3D

1. **O arquivo de audio deve ser mono.** Arquivos stereo não serão espacializados corretamente.
2. **O `spatial` do SoundSet deve ser `1`.** Isso habilita o sistema de posicionamento 3D.
3. **A fonte sonora deve ter uma posição no mundo.** O motor precisa de coordenadas para calcular direção e distancia.

### Como o Motor Espacializa o Som

```
Sound Source (world position)
  |
  |--> Calculate distance to listener
  |--> Calculate direction relative to listener facing
  |--> Apply distance attenuation (rangeCurve)
  |--> Apply occlusion (walls, terrain)
  |--> Apply Doppler effect (if enabled and source is moving)
  |--> Output to correct speaker channels
```

### Acionando Sons 3D via Script

```c
// Play a positional sound at a world location
void PlaySoundAtPosition(vector position)
{
    EffectSound sound;
    SEffectManager.PlaySound("MyMod_Rifle_Shot_SoundSet", position);
}

// Play a sound attached to an object (moves with it)
void PlaySoundOnObject(Object obj)
{
    EffectSound sound;
    SEffectManager.PlaySoundOnObject("MyMod_Engine_SoundSet", obj);
}
```

---

## Volume e Atenuação por Distancia

### Curva de Alcance

A `rangeCurve[]` em um SoundShader define como o volume diminui com a distancia. E um array de pares `{distancia, volume}`:

```cpp
rangeCurve[] =
{
    {0, 1.0},       // At 0m: full volume
    {50, 0.7},      // At 50m: 70% volume
    {150, 0.3},     // At 150m: 30% volume
    {300, 0.0}      // At 300m: silent
};
```

O motor interpola linearmente entre os pontos definidos. Você pode criar qualquer curva de queda adicionando mais pontos de controle.

### Curvas de Volume Predefinidas

SoundSets podem referênciar curvas nomeadas via a propriedade `volumeCurve`:

| Nome da Curva | Comportamento |
|---------------|---------------|
| `"InverseSquare"` | Queda realista (volume = 1/distancia^2). Som natural. |
| `"Linear"` | Queda uniforme de máximo a zero ao longo do alcance. |
| `"Logarithmic"` | Alto de perto, cai rapidamente em distancia media, depois diminui lentamente. |

### Exemplos Praticos de Atenuação

**Tiro (alto, alcance longo):**
```cpp
range = 800;
rangeCurve[] = {{0, 1.0}, {100, 0.6}, {300, 0.3}, {600, 0.1}, {800, 0.0}};
```

**Passo (baixo, curto alcance):**
```cpp
range = 30;
rangeCurve[] = {{0, 1.0}, {10, 0.5}, {20, 0.15}, {30, 0.0}};
```

**Motor de veículo (alcance medio, sustentado):**
```cpp
range = 200;
rangeCurve[] = {{0, 1.0}, {50, 0.7}, {100, 0.4}, {200, 0.0}};
```

---

## Sons em Loop

Sons em loop repetem continuamente até serem explicitamente parados. Sao usados para motores, atmosfera ambiente, alarmes e qualquer audio sustentado.

### Configurando um Som em Loop

No SoundSet:
```cpp
class MyMod_Alarm_SoundSet
{
    soundShaders[] = {"MyMod_Alarm_SoundShader"};
    spatial = 1;
    loop = 1;              // Enable looping
};
```

### Loop via Script

```c
// Start a looping sound
EffectSound m_AlarmSound;

void StartAlarm(vector position)
{
    if (!m_AlarmSound)
    {
        m_AlarmSound = SEffectManager.PlaySound("MyMod_Alarm_SoundSet", position);
    }
}

// Stop the looping sound
void StopAlarm()
{
    if (m_AlarmSound)
    {
        m_AlarmSound.Stop();
        m_AlarmSound = null;
    }
}
```

### Preparacao de Arquivo de Audio para Loops

Para loops perfeitos, o proprio arquivo de audio deve fazer loop sem falhas:

1. **Cruzamento zero no inicio e fim.** A forma de onda deve cruzar amplitude zero em ambos os pontos finais para evitar um clique/estouro no ponto do loop.
2. **Inicio e fim correspondentes.** O final do arquivo deve se mesclar perfeitamente com o inicio.
3. **Sem fade in/out.** Fades seriam audiveis a cada iteracao do loop.
4. **Teste o loop no Audacity.** Selecione todo o clipe, habilite reprodução em loop e ouça por cliques ou descontinuidades.

---

## Adicionando Sons Personalizados a um Mod

### Fluxo de Trabalho Completo

**Passo 1: Prepare os arquivos de audio**
- Grave ou obtenha seu audio.
- Edite no Audacity (ou seu editor de audio preferido).
- Para sons 3D: converta para mono.
- Exporte como OGG Vorbis (qualidade 5-7).
- Nomeie os arquivos descritivamente: `rifle_shot_01.ogg`, `rifle_shot_02.ogg`.

**Passo 2: Organize no diretório do mod**

```
MyMod/
  sound/
    weapons/
      rifle_shot_01.ogg
      rifle_shot_02.ogg
      rifle_shot_03.ogg
      rifle_tail_01.ogg
      rifle_tail_02.ogg
    ambient/
      wind_loop.ogg
    ui/
      click_01.ogg
      notification_01.ogg
  config.cpp
```

**Passo 3: Defina SoundShaders no config.cpp**

```cpp
class CfgPatches
{
    class MyMod_Sounds
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = {"DZ_Sounds_Effects"};
    };
};

class CfgSoundShaders
{
    class MyMod_RifleShot_SoundShader
    {
        samples[] =
        {
            {"MyMod\sound\weapons\rifle_shot_01", 1},
            {"MyMod\sound\weapons\rifle_shot_02", 1},
            {"MyMod\sound\weapons\rifle_shot_03", 1}
        };
        volume = 1.0;
        range = 300;
        rangeCurve[] = {{0, 1.0}, {100, 0.6}, {200, 0.2}, {300, 0.0}};
    };
};

class CfgSoundSets
{
    class MyMod_RifleShot_SoundSet
    {
        soundShaders[] = {"MyMod_RifleShot_SoundShader"};
        volumeFactor = 1.0;
        spatial = 1;
        doppler = 0;
        loop = 0;
        distanceFilter = 1;
    };
};
```

**Passo 4: Referencie na configuração da arma/item**

Para armas, o SoundSet e referênciado na classe de configuração da arma:

```cpp
class CfgWeapons
{
    class MyMod_Rifle: Rifle_Base
    {
        // ... other config ...

        class Sounds
        {
            class Fire
            {
                soundSet = "MyMod_RifleShot_SoundSet";
            };
        };
    };
};
```

**Passo 5: Faca o build e teste**
- Empacote o PBO (use `-packonly` já que arquivos OGG não precisam de binarização).
- Inicie o jogo com o mod carregado.
- Teste o som no jogo em varias distancias.

---

## Ferramentas de Produção de Audio

### Audacity (Gratuito, Código Aberto)

Audacity é a ferramenta recomendada para produção de audio para DayZ:

- **Download:** [audacityteam.org](https://www.audacityteam.org/)
- **Exportacao OGG:** File --> Export --> Export as OGG
- **Conversão para mono:** Tracks --> Mix --> Mix Stereo Down to Mono
- **Normalizacao:** Effect --> Normalize (defina pico para -1 dB para evitar clipping)
- **Remocao de ruido:** Effect --> Noise Reduction
- **Teste de loop:** Transport --> Loop Play (Shift+Space)

### Configurações de Exportacao OGG no Audacity

1. **File --> Export --> Export as OGG Vorbis**
2. **Qualidade:** 5-7 (5 para ambiente/UI, 7 para armas/sons importantes)
3. **Canais:** Mono para sons 3D, Stereo para UI/musica

### Outras Ferramentas Uteis

| Ferramenta | Propósito | Custo |
|------------|-----------|-------|
| **Audacity** | Edicao geral de audio, conversão de formato | Gratuito |
| **Reaper** | DAW profissional, edicao avancada | $60 (licenca pessoal) |
| **FFmpeg** | Conversão em lote de audio via linha de comando | Gratuito |
| **Ocenaudio** | Editor simples com preview em tempo real | Gratuito |

### Conversão em Lote com FFmpeg

Converta todos os arquivos WAV em um diretório para OGG mono:

```bash
for file in *.wav; do
    ffmpeg -i "$file" -ac 1 -codec:a libvorbis -qscale:a 6 "${file%.wav}.ogg"
done
```

---

## Erros Comuns

### 1. Arquivo Stereo para Som 3D

**Sintoma:** Som não espacializa, toca centralizado ou apenas em um ouvido.
**Correção:** Converta para mono antes de exportar. Sons posicionais 3D exigem arquivos de audio mono.

### 2. Extensão do Arquivo no Caminho samples[]

**Sintoma:** Som não toca, sem erro no log (o motor falha silenciosamente ao encontrar o arquivo).
**Correção:** Remova a extensão `.ogg` do caminho em `samples[]`. O motor a adiciona automáticamente.

```cpp
// WRONG
samples[] = {{"MyMod\sound\gunshot_01.ogg", 1}};

// CORRECT
samples[] = {{"MyMod\sound\gunshot_01", 1}};
```

### 3. requiredAddons Ausente no CfgPatches

**Sintoma:** SoundShaders ou SoundSets não reconhecidos, sons não tocam.
**Correção:** Adicione `"DZ_Sounds_Effects"` ao `requiredAddons[]` do seu CfgPatches para garantir que o sistema base de som carregue antes das suas definicoes.

### 4. Alcance Muito Curto

**Sintoma:** Som corta abruptamente em curta distancia, parece antinatural.
**Correção:** Defina `range` para um valor realista. Tiros devem alcancar 300-800m, passos 20-40m, vozes 50-100m.

### 5. Sem Variacao Aleatoria

**Sintoma:** Som parece repetitivo e artificial após ouvi-lo múltiplas vezes.
**Correção:** Forneca múltiplas amostras no SoundShader e adicione `frequencyRandomizer` ao SoundSet para variacao de tom.

```cpp
// Multiple samples for variety
samples[] =
{
    {"MyMod\sound\step_01", 1},
    {"MyMod\sound\step_02", 1},
    {"MyMod\sound\step_03", 1},
    {"MyMod\sound\step_04", 1}
};

// Plus pitch randomization in the SoundSet
frequencyRandomizer = 0.05;    // +/- 5% pitch variation
```

### 6. Clipping / Distorcao

**Sintoma:** Som crepita ou distorce, especialmente a curta distancia.
**Correção:** Normalize seu audio para -1 dB ou -3 dB de pico no Audacity antes de exportar. Nunca defina `volume` ou `volumeFactor` acima de 1.0 a menos que o audio de origem seja muito baixo.

---

## Boas Práticas

1. **Sempre exporte sons 3D como OGG mono.** Esta é a regra mais importante. Arquivos stereo não serão espacializados.

2. **Forneca 3-5 variantes de amostra** para sons ouvidos frequentemente (tiros, passos, impactos). Seleção aleatoria previne o "efeito metralhadora" de audio identico repetido.

3. **Use `frequencyRandomizer`** entre 0.03 e 0.08 para variacao natural de tom. Mesmo variacao sutil melhora significativamente a qualidade de audio percebida.

4. **Defina valores de alcance realistas.** Estude sons vanilla do DayZ para referência. Um tiro de rifle a 600-800m de alcance, um tiro suprimido a 150-200m, passos a 20-40m.

5. **Coloque camadas nos seus sons.** Eventos de audio complexos (tiros) devem usar múltiplos SoundSets: tiro próximo + estrondo distante + eco/reverb. Isso cria profundidade que um único arquivo de som não consegue alcancar.

6. **Teste em múltiplas distancias.** Afaste-se da fonte sonora no jogo e verifique se a curva de atenuação parece natural. Ajuste os pontos de controle da `rangeCurve[]` iterativamente.

7. **Organize seu diretório de som.** Use subdiretórios por catégoria (`weapons/`, `ambient/`, `ui/`, `vehicles/`). Um diretório plano com 200 arquivos OGG é impossível de gerenciar.

8. **Mantenha tamanhos de arquivo razoaveis.** Audio de jogo não precisa de qualidade de estudio. Qualidade OGG 5-7 é suficiente. A maioria dos arquivos de som individuais deve ter menos de 500 KB.

---

## Navegação

| Anterior | Acima | Próximo |
|----------|-------|---------|
| [4.3 Matériais](03-materials.md) | [Parte 4: Formatos de Arquivo & DayZ Tools](01-textures.md) | [4.5 Fluxo de Trabalho DayZ Tools](05-dayz-tools.md) |
