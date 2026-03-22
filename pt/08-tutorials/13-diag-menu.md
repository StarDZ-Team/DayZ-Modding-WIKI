# Capítulo 8.13: O Menu de Diagnóstico (Diag Menu)

[Início](../README.md) | [<< Anterior: Construindo um Sistema de Comércio](12-trading-system.md) | **O Menu de Diagnóstico**

---

> **Resumo:** O Diag Menu é a ferramenta de diagnóstico integrada do DayZ, disponível apenas através do executável DayZDiag. Ele fornece contadores de FPS, profiling de scripts, depuração de renderização, câmera livre, visualização de física, controle de clima, ferramentas da Economia Central, depuração de navegação de IA e diagnósticos de som. Este capítulo documenta cada categoria de menu, opção e atalho de teclado com base na documentação oficial da Bohemia Interactive.

---

## Sumário

- [O Que é o Diag Menu?](#o-que-é-o-diag-menu)
- [Como Acessar](#como-acessar)
- [Controles de Navegação](#controles-de-navegação)
- [Atalhos de Teclado de Acesso Rápido](#atalhos-de-teclado-de-acesso-rápido)
- [Visão Geral das Categorias do Menu](#visão-geral-das-categorias-do-menu)
- [Statistics](#statistics)
- [Enfusion Renderer](#enfusion-renderer)
- [Enfusion World (Physics)](#enfusion-world-physics)
- [DayZ Render](#dayz-render)
- [Game](#game)
- [AI](#ai)
- [Sounds](#sounds)
- [Recursos Úteis para Modders](#recursos-úteis-para-modders)
- [Quando Usar o Diag Menu](#quando-usar-o-diag-menu)
- [Erros Comuns](#erros-comuns)
- [Próximos Passos](#próximos-passos)

---

## O Que é o Diag Menu?

O Diag Menu é um menu de depuração hierárquico integrado ao executável de diagnóstico do DayZ. Ele lista opções usadas para depurar scripts e assets do jogo em sete categorias principais: Statistics, Enfusion Renderer, Enfusion World, DayZ Render, Game, AI e Sounds.

O Diag Menu **não está disponível** no executável de varejo do DayZ (`DayZ_x64.exe`). Você deve usar o `DayZDiag_x64.exe` -- a versão de diagnóstico que acompanha a versão de varejo na sua pasta de instalação do DayZ ou nos diretórios do DayZ Server.

---

## Como Acessar

### Requisitos

- **DayZDiag_x64.exe** -- O executável de diagnóstico. Encontra-se na pasta de instalação do DayZ junto com o `DayZ_x64.exe` normal.
- Você deve estar rodando o jogo (não na tela de carregamento). O menu está disponível em qualquer viewport 3D.

### Abrindo o Menu

Pressione **Win + Alt** para abrir o Diag Menu.

Um atalho alternativo é **Ctrl + Win**, mas ele conflita com um atalho do sistema do Windows 11 e não é recomendado nessa plataforma.

### Habilitando o Cursor do Mouse

Algumas opções do Diag Menu exigem que você interaja com a tela usando o mouse. O cursor do mouse pode ser alternado pressionando:

**LCtrl + Numpad 9**

Essa associação de tecla é registrada por script (`PluginKeyBinding`).

---

## Controles de Navegação

Quando o Diag Menu está aberto:

| Tecla | Ação |
|-------|------|
| **Seta para cima / baixo** | Navegar entre itens do menu |
| **Seta para direita** | Entrar em um submenu, ou alternar entre valores de opção |
| **Seta para esquerda** | Alternar valores de opção na direção inversa |
| **Backspace** | Sair do submenu atual (voltar um nível) |

Quando as opções mostram múltiplos valores, eles são listados na ordem em que aparecem no menu. A primeira opção é tipicamente o padrão.

---

## Atalhos de Teclado de Acesso Rápido

Esses atalhos funcionam a qualquer momento enquanto o DayZDiag está rodando, sem precisar abrir o menu:

| Atalho | Função |
|--------|--------|
| **LCtrl + Numpad 1** | Alternar contador de FPS |
| **LCtrl + Numpad 9** | Alternar cursor do mouse na tela |
| **RCtrl + RAlt + W** | Alternar modo de depuração de renderização |
| **LCtrl + LAlt + P** | Alternar efeitos de pós-processamento |
| **LAlt + Numpad 6** | Alternar visualização de corpos de física |
| **Page Up** | Câmera Livre: alternar movimento do jogador |
| **Page Down** | Câmera Livre: congelar/descongelar câmera |
| **Insert** | Teletransportar jogador para posição do cursor (na câmera livre) |
| **Home** | Alternar câmera livre / desativar e teletransportar jogador para cursor |
| **Numpad /** | Alternar câmera livre (sem teletransporte) |
| **End** | Desativar câmera livre (retornar à câmera do jogador) |

> **Nota:** Qualquer menção a "Cheat Inputs" na documentação oficial refere-se a inputs codificados no lado C++, não acessíveis por script.

---

## Visão Geral das Categorias do Menu

O Diag Menu contém sete categorias de nível superior:

1. **Statistics** -- Contador de FPS e profiler de scripts
2. **Enfusion Renderer** -- Iluminação, sombras, materiais, oclusão, pós-processamento, terreno, widgets
3. **Enfusion World** -- Visualização e depuração do motor de física (Bullet)
4. **DayZ Render** -- Renderização do céu, diagnósticos de geometria
5. **Game** -- Clima, câmera livre, veículos, combate, Economia Central, sons de superfície
6. **AI** -- Malha de navegação, pathfinding, comportamento de agentes IA
7. **Sounds** -- Depuração de amostras de áudio, informações do sistema de som

---

## Statistics

### Estrutura do Menu

```
Statistics
  FPS                              [LCtrl + Numpad 1]
  Script profiler UI
  > Script profiler settings
      Always enabled
      Flags
      Module
      Update interval
      Average
      Time resolution
      (UI) Scale
```

### FPS

Habilita o contador de FPS no canto superior esquerdo da tela.

O valor de FPS é calculado a partir do tempo entre os últimos 10 frames, então ele reflete uma média móvel curta em vez de uma leitura instantânea.

### Script Profiler UI

Ativa o Script Profiler na tela, que exibe dados de desempenho em tempo real para execução de scripts.

O profiler mostra seis seções de dados:

| Seção | O Que Mostra |
|-------|--------------|
| **Time per class** | Tempo total de todas as chamadas de função pertencentes a uma classe (top 20) |
| **Time per function** | Tempo total de todas as chamadas a uma função específica (top 20) |
| **Class allocations** | Número de alocações de uma classe (top 20) |
| **Count per function** | Número de vezes que uma função foi chamada (top 20) |
| **Class count** | Número de instâncias ativas de uma classe (top 40) |
| **Stats and settings** | Configuração atual do profiler e contadores de frames |

O painel Stats and settings mostra:

| Campo | Significado |
|-------|-------------|
| UI enabled (DIAG) | Se a interface do script profiler está ativa |
| Profiling enabled (SCRP) | Se o profiling executa mesmo quando a interface não está ativa |
| Profiling enabled (SCRC) | Se o profiling está realmente ocorrendo |
| Flags | Flags atuais de coleta de dados |
| Module | Módulo sendo analisado atualmente |
| Interval | Intervalo de atualização atual |
| Time Resolution | Resolução temporal atual |
| Average | Se os valores exibidos são médias |
| Game Frame | Total de frames passados |
| Session Frame | Total de frames nesta sessão de profiling |
| Total Frames | Total de frames em todas as sessões de profiling |
| Profiled Sess Frms | Frames analisados nesta sessão |
| Profiled Frames | Frames analisados em todas as sessões |

> **Importante:** O Script Profiler analisa apenas código de script. Métodos Proto (vinculados ao motor) não são medidos como entradas separadas, mas seu tempo de execução é incluído no tempo total do método de script que os chama.

> **Importante:** A API EnProfiler e o próprio script profiler estão disponíveis apenas no executável de diagnóstico.

### Script Profiler Settings

Essas configurações controlam como os dados de profiling são coletados. Elas também podem ser ajustadas programaticamente através da API `EnProfiler` (documentada em `EnProfiler.c`).

#### Always Enabled

A coleta de dados de profiling não está habilitada por padrão. Essa opção mostra se ela está ativa no momento.

Para habilitar o profiling na inicialização, use o parâmetro de lançamento `-profile`.

A interface do Script Profiler ignora essa configuração -- ela sempre força o profiling enquanto a interface está visível. Quando a interface é desativada, o profiling para novamente (a menos que "Always enabled" esteja definido como true).

#### Flags

Controla como os dados são coletados. Quatro combinações estão disponíveis:

| Combinação de Flags | Escopo | Tempo de Vida dos Dados |
|---------------------|--------|-------------------------|
| `SPF_RESET \| SPF_RECURSIVE` | Módulo selecionado + filhos | Por frame (reinicia a cada frame) |
| `SPF_RECURSIVE` | Módulo selecionado + filhos | Acumulado entre frames |
| `SPF_RESET` | Apenas módulo selecionado | Por frame (reinicia a cada frame) |
| `SPF_NONE` | Apenas módulo selecionado | Acumulado entre frames |

- **SPF_RECURSIVE**: Habilita profiling de módulos filhos (recursivamente)
- **SPF_RESET**: Limpa dados ao final de cada frame

#### Module

Seleciona qual módulo de script analisar:

| Opção | Camada de Script |
|-------|------------------|
| CORE | 1_Core |
| GAMELIB | 2_GameLib |
| GAME | 3_Game |
| WORLD | 4_World |
| MISSION | 5_Mission |
| MISSION_CUSTOM | init.c |

#### Update Interval

O número de frames a esperar antes de atualizar a exibição de dados ordenados. Isso também atrasa o reset causado por `SPF_RESET`.

Valores disponíveis: 0, 5, 10, 20, 30, 50, 60, 120, 144

#### Average

Habilita ou desabilita a exibição de valores médios.

- Com `SPF_RESET` e sem intervalo: valores são o valor bruto por frame
- Sem `SPF_RESET`: divide o valor acumulado pela contagem de frames da sessão
- Com um intervalo definido: divide pelo intervalo

A contagem de classes nunca é calculada como média -- ela sempre mostra a contagem atual de instâncias. Alocações mostrarão o número médio de vezes que uma instância foi criada.

#### Time Resolution

Define a unidade de tempo para exibição. O valor representa o denominador (enésimo de um segundo):

| Valor | Unidade |
|-------|---------|
| 1 | Segundos |
| 1000 | Milissegundos |
| 1000000 | Microssegundos |

Valores disponíveis: 1, 10, 100, 1000, 10000, 100000, 1000000

#### (UI) Scale

Ajusta a escala visual da exibição do profiler na tela para diferentes tamanhos de tela e resoluções.

Faixa: 0.5 a 1.5 (padrão: 1.0, passo: 0.05)

---

## Enfusion Renderer

### Estrutura do Menu

```
Enfusion Renderer
  Lights
  > Lighting
      Ambient lighting
      Ground lighting
      Directional lighting
      Bidirectional lighting
      Specular lighting
      Reflection
      Emission lighting
  Shadows
  Terrain shadows
  Render debug mode                [RCtrl + RAlt + W]
  Occluders
  Occlude entities
  Occlude proxies
  Show occluder volumes
  Show active occluders
  Show occluded
  Widgets
  Postprocess                      [LCtrl + LAlt + P]
  Terrain
  > Materials
      Common, TreeTrunk, TreeCrown, Grass, Basic, Normal,
      Super, Skin, Multi, Old Terrain, Old Roads, Water,
      Sky, Sky clouds, Sky stars, Sky flares,
      Particle Sprite, Particle Streak
```

### Lights

Alterna fontes de luz reais (como `PersonalLight` ou itens do jogo como lanternas). Isso não afeta a iluminação do ambiente -- use o submenu Lighting para isso.

### Submenu Lighting

Cada opção controla um componente específico de iluminação:

| Opção | Efeito Quando Desativada |
|-------|--------------------------|
| **Ambient lighting** | Remove a luz ambiente geral da cena |
| **Ground lighting** | Remove a luz refletida do chão (visível em telhados, axilas do personagem) |
| **Directional lighting** | Remove a luz direcional principal (sol/lua). Também desativa iluminação bidirecional |
| **Bidirectional lighting** | Remove o componente de luz bidirecional |
| **Specular lighting** | Remove destaques especulares (visíveis em superfícies brilhantes como armários, carros) |
| **Reflection** | Remove iluminação de reflexo (visível em superfícies metálicas/brilhantes) |
| **Emission lighting** | Remove emissão (auto-iluminação) dos materiais |

Essas opções são úteis para isolar contribuições específicas de iluminação ao depurar problemas visuais em modelos ou cenas personalizadas.

### Shadows

Habilita ou desabilita a renderização de sombras. Desabilitar também remove o culling de chuva dentro de objetos (a chuva cairá através dos telhados).

### Terrain Shadows

Controla como as sombras do terreno são geradas.

Opções: `on (slice)`, `on (full)`, `no update`, `disabled`

### Render Debug Mode

Alterna entre modos de visualização de renderização para inspecionar geometria de malha no jogo.

Opções: `normal`, `wire`, `wire only`, `overdraw`, `overdrawZ`

Diferentes materiais são exibidos em diferentes cores de wireframe:

| Material | Cor (RGB) |
|----------|-----------|
| TreeTrunk | 179, 126, 55 |
| TreeCrown | 143, 227, 94 |
| Grass | 41, 194, 53 |
| Basic | 208, 87, 87 |
| Normal | 204, 66, 107 |
| Super | 234, 181, 181 |
| Skin | 252, 170, 18 |
| Multi | 143, 185, 248 |
| Terrain | 255, 127, 127 |
| Water | 51, 51, 255 |
| Ocean | 51, 128, 255 |
| Sky | 143, 185, 248 |

### Occluders

Um conjunto de opções para o sistema de occlusion culling:

| Opção | Efeito |
|-------|--------|
| **Occluders** | Habilitar/desabilitar oclusão de objetos |
| **Occlude entities** | Habilitar/desabilitar oclusão de entidades |
| **Occlude proxies** | Habilitar/desabilitar oclusão de proxies |
| **Show occluder volumes** | Tira um snapshot e desenha shapes de depuração visualizando volumes de oclusão |
| **Show active occluders** | Mostra occluders ativos com shapes de depuração |
| **Show occluded** | Visualiza objetos ocluídos com shapes de depuração |

### Widgets

Habilita ou desabilita a renderização de todos os widgets de interface. Útil para tirar screenshots limpos ou isolar problemas de renderização.

### Postprocess

Habilita ou desabilita efeitos de pós-processamento (bloom, correção de cor, vignette, etc.).

### Terrain

Habilita ou desabilita completamente a renderização do terreno.

### Submenu Materials

Alterna a renderização de tipos específicos de material. A maioria é autoexplicativa. Entradas notáveis:

- **Super** -- Uma opção abrangente que cobre todo material relacionado ao shader "super"
- **Old Terrain** -- Cobre tanto materiais Terrain quanto Terrain Simple
- **Water** -- Cobre todo material relacionado a água (oceano, costa, rios)

---

## Enfusion World (Physics)

### Estrutura do Menu

```
Enfusion World
  Show Bullet
  > Bullet
      Draw Char Ctrl
      Draw Simple Char Ctrl
      Max. Collider Distance
      Draw Bullet shape
      Draw Bullet wireframe
      Draw Bullet shape AABB
      Draw obj center of mass
      Draw Bullet contacts
      Force sleep Bullet
      Show stats
  Show bodies                      [LAlt + Numpad 6]
```

> **Nota:** "Bullet" aqui se refere ao motor de física Bullet, não a munição.

### Show Bullet

Ativa a visualização de depuração do motor de física Bullet.

### Submenu Bullet

| Opção | Descrição |
|-------|-----------|
| **Draw Char Ctrl** | Visualizar o controlador do personagem do jogador. Depende de "Draw Bullet shape" |
| **Draw Simple Char Ctrl** | Visualizar o controlador de personagem da IA. Depende de "Draw Bullet shape" |
| **Max. Collider Distance** | Distância máxima do jogador para visualizar colisores (valores: 0, 1, 2, 5, 10, 20, 50, 100, 200, 500). O padrão é 0 |
| **Draw Bullet shape** | Visualizar formas de colisores de física |
| **Draw Bullet wireframe** | Mostrar colisores apenas como wireframe. Depende de "Draw Bullet shape" |
| **Draw Bullet shape AABB** | Mostrar bounding boxes alinhadas aos eixos dos colisores |
| **Draw obj center of mass** | Mostrar centros de massa dos objetos |
| **Draw Bullet contacts** | Visualizar colisores em contato |
| **Force sleep Bullet** | Forçar todos os corpos de física a dormir |
| **Show stats** | Mostrar estatísticas de depuração (opções: disabled, basic, all). As estatísticas permanecem visíveis por 10 segundos após desativar |

> **Aviso:** Max. Collider Distance é 0 por padrão porque essa visualização é cara. Definir uma distância grande causará degradação significativa de desempenho.

### Show Bodies

Visualiza corpos de física Bullet. Opções: `disabled`, `only`, `all`

---

## DayZ Render

### Estrutura do Menu

```
DayZ Render
  > Sky
      Space
      Stars
      > Planets
          Sun
          Moon
      Atmosphere
      > Clouds
          Far
          Near
          Physical
      Horizon
      > Post Process
          God Rays
  > Geometry diagnostic
      diagnostic mode
```

### Submenu Sky

Alterna componentes individuais de renderização do céu:

| Opção | O Que Controla |
|-------|----------------|
| **Space** | A textura de fundo atrás das estrelas |
| **Stars** | Renderização de estrelas |
| **Sun** | Sol e seu efeito de halo (não god rays) |
| **Moon** | Lua e seu efeito de halo (não god rays) |
| **Atmosphere** | A textura da atmosfera no céu |
| **Far (Clouds)** | Nuvens superiores/distantes. Não afetam raios de luz (menos densas) |
| **Near (Clouds)** | Nuvens inferiores/próximas. São mais densas e atuam como oclusão para raios de luz |
| **Physical (Clouds)** | Nuvens obsoletas baseadas em objetos. Removidas de Chernarus e Livonia no DayZ 1.23 |
| **Horizon** | Renderização do horizonte. O horizonte bloqueará raios de luz |
| **God Rays** | Efeito de pós-processamento de raios de luz |

### Geometry Diagnostic

Habilita desenho de shapes de depuração para visualizar como a geometria de um objeto aparece no jogo.

Tipos de geometria: `normal`, `roadway`, `geometry`, `viewGeometry`, `fireGeometry`, `paths`, `memory`, `wreck`

Modos de desenho: `solid+wire`, `Zsolid+wire`, `wire`, `ZWire`, `geom only`

Isso é extremamente útil para modders criando modelos personalizados -- você pode verificar se sua fire geometry, view geometry e memory points estão configurados corretamente sem sair do jogo.

---

## Game

### Estrutura do Menu

```
Game
  > Weather & environment
      Display
      Force fog at camera
      Override fog
        Distance density
        Height density
        Distance offset
        Height bias
  Free Camera
    FrCam Player Move              [Page Up]
    FrCam NoClip
    FrCam Freeze                   [Page Down]
  > Vehicles
      Audio
      Simulation
  > Combat
      DECombat
      DEShots
      DEHitpoints
      DEExplosions
  > Legacy/obsolete
      DEAmbient
      DELight
  DESurfaceSound
  > Central Economy
      > Loot Spawn Edit
          Spawn Volume Vis
          Setup Vis
          Edit Volume
          Re-Trace Group Points
          Spawn Candy
          Spawn Rotation Test
          Placement Test
          Export Group
          Export All Groups
          Export Map
          Export Clusters
          Export Economy [csv]
          Export Respawn Queue [csv]
      > Loot Tool
          Deplete Lifetime
          Set Damage = 1.0
          Damage + Deplete
          Invert Avoidance
          Project Target Loot
      > Infected
          Infected Vis
          Infected Zone Info
          Infected Spawn
          Reset Cleanup
      > Animal
          Animal Vis
          Animal Spawn
          Ambient Spawn
      > Building
          Building Stats
      Vehicle&Wreck Vis
      Loot Vis
      Cluster Vis
      Dynamic Events Status
      Dynamic Events Vis
      Dynamic Events Spawn
      Export Dyn Event
      Overall Stats
      Updaters State
      Idle Mode
      Force Save
```

### Weather & Environment

Funcionalidade de depuração para o sistema de clima.

#### Display

Habilita a visualização de depuração do clima. Mostra uma depuração na tela de névoa/distância de visão e abre uma janela separada em tempo real com dados detalhados de clima.

Para habilitar a janela separada enquanto rodando como servidor, use o parâmetro de lançamento `-debugweather`.

As configurações da janela são armazenadas nos profiles como `weather_client_imgui.ini` / `weather_client_imgui.bin` (ou `weather_server_*` para servidores).

#### Force Fog at Camera

Força a altura da névoa a corresponder à altura da câmera do jogador. Tem prioridade sobre a configuração Height bias.

#### Override Fog

Habilita a substituição de valores de névoa com configurações manuais:

| Parâmetro | Faixa | Passo |
|-----------|-------|-------|
| Distance density | 0 -- 1 | 0.01 |
| Height density | 0 -- 1 | 0.01 |
| Distance offset | 0 -- 1 | 0.01 |
| Height bias | -500 -- 500 | 5 |

### Free Camera

A câmera livre desacopla a visão do personagem do jogador e permite voar pelo mundo. Essa é uma das ferramentas de depuração mais úteis para modders.

#### Controles da Câmera Livre

| Tecla | Origem | Função |
|-------|--------|--------|
| **W / A / S / D** | Inputs (xml) | Mover para frente / esquerda / trás / direita |
| **Q** | Inputs (xml) | Mover para cima |
| **Z** | Inputs (xml) | Mover para baixo |
| **Mouse** | Inputs (xml) | Olhar ao redor |
| **Roda do mouse para cima** | Inputs (C++) | Aumentar velocidade |
| **Roda do mouse para baixo** | Inputs (C++) | Diminuir velocidade |
| **Barra de espaço** | Cheat Inputs (C++) | Alternar depuração na tela do objeto alvo |
| **Ctrl / Shift** | Cheat Inputs (C++) | Velocidade atual x 10 |
| **Alt** | Cheat Inputs (C++) | Velocidade atual / 10 |
| **End** | Cheat Inputs (C++) | Desativar câmera livre (retornar ao jogador) |
| **Enter** | Cheat Inputs (C++) | Vincular câmera ao objeto alvo |
| **Page Up** | Cheat Inputs (C++) | Alternar movimento do jogador na câmera livre |
| **Page Down** | Cheat Inputs (C++) | Congelar/descongelar posição da câmera |
| **Insert** | PluginKeyBinding (Script) | Teletransportar jogador para posição do cursor |
| **Home** | PluginKeyBinding (Script) | Alternar câmera livre / desativar e teletransportar para cursor |
| **Numpad /** | PluginKeyBinding (Script) | Alternar câmera livre (sem teletransporte) |

#### Opções da Câmera Livre

| Opção | Descrição |
|-------|-----------|
| **FrCam Player Move** | Habilitar/desabilitar inputs do jogador (WASD) movendo o jogador enquanto na câmera livre |
| **FrCam NoClip** | Habilitar/desabilitar a câmera passando através do terreno |
| **FrCam Freeze** | Habilitar/desabilitar inputs movendo a câmera |

### Vehicles

Funcionalidade de depuração estendida para veículos. Funciona apenas enquanto o jogador está dentro de um veículo.

- **Audio** -- Abre uma janela separada para ajustar configurações de som em tempo real. Inclui visualização de controladores de áudio.
- **Simulation** -- Abre uma janela separada com depuração de simulação de carro: ajuste de parâmetros de física e visualização.

### Combat

Ferramentas de depuração para combate, tiro e hitpoints:

| Opção | Descrição |
|-------|-----------|
| **DECombat** | Mostra texto na tela com distâncias para carros, IA e jogadores |
| **DEShots** | Submenu de depuração de projéteis (veja abaixo) |
| **DEHitpoints** | Exibe o DamageSystem do jogador e do objeto para o qual está olhando |
| **DEExplosions** | Mostra dados de penetração de explosão. Números mostram valores de desaceleração. Cruz vermelha = parou. Cruz verde = penetrou |

**Submenu DEShots:**

| Opção | Descrição |
|-------|-----------|
| Clear vis. | Limpar qualquer visualização de tiro existente |
| Vis. trajectory | Rastrear o caminho de um tiro, mostrando pontos de saída e ponto de parada |
| Always Deflect | Força todos os tiros disparados pelo cliente a defletir |

### Legacy/Obsolete

- **DEAmbient** -- Exibe variáveis que influenciam sons ambientes
- **DELight** -- Exibe estatísticas sobre o ambiente de iluminação atual

### DESurfaceSound

Exibe o tipo de superfície em que o jogador está parado e o tipo de atenuação.

### Central Economy

Um conjunto abrangente de ferramentas de depuração para o sistema de Economia Central (CE).

> **Importante:** A maioria das opções de depuração da CE funciona apenas em cliente single-player com CE habilitada. Apenas "Building Stats" funciona em ambiente multiplayer ou quando a CE está desativada.

> **Nota:** Muitas dessas funções também estão disponíveis através da `CEApi` em script (`CentralEconomy.c`).

#### Loot Spawn Edit

Ferramentas para criar e editar pontos de spawn de loot em objetos. A câmera livre deve estar habilitada para usar a ferramenta Edit Volume.

| Opção | Descrição | Equivalente em Script |
|-------|-----------|----------------------|
| **Spawn Volume Vis** | Visualizar pontos de spawn de loot. Opções: Off, Adaptive, Volume, Occupied | `GetCEApi().LootSetSpawnVolumeVisualisation()` |
| **Setup Vis** | Mostrar propriedades de setup da CE na tela com contêineres codificados por cores | `GetCEApi().LootToggleSpawnSetup()` |
| **Edit Volume** | Editor interativo de pontos de loot (requer câmera livre) | `GetCEApi().LootToggleVolumeEditing()` |
| **Re-Trace Group Points** | Re-traçar pontos de loot para corrigir problemas de flutuação | `GetCEApi().LootRetraceGroupPoints()` |
| **Spawn Candy** | Criar loot em todos os pontos de spawn do grupo selecionado | -- |
| **Spawn Rotation Test** | Testar flags de rotação na posição do cursor | -- |
| **Placement Test** | Visualizar posicionamento com cilindro esférico | -- |
| **Export Group** | Exportar grupo selecionado para `storage/export/mapGroup_CLASSNAME.xml` | `GetCEApi().LootExportGroup()` |
| **Export All Groups** | Exportar todos os grupos para `storage/export/mapgroupproto.xml` | `GetCEApi().LootExportAllGroups()` |
| **Export Map** | Gerar `storage/export/mapgrouppos.xml` | `GetCEApi().LootExportMap()` |
| **Export Clusters** | Gerar `storage/export/mapgroupcluster.xml` | `GetCEApi().ExportClusterData()` |
| **Export Economy [csv]** | Exportar economia para `storage/log/economy.csv` | `GetCEApi().EconomyLog(EconomyLogCategories.Economy)` |
| **Export Respawn Queue [csv]** | Exportar fila de respawn para `storage/log/respawn_queue.csv` | `GetCEApi().EconomyLog(EconomyLogCategories.RespawnQueue)` |

**Atalhos de teclado do Edit Volume:**

| Tecla | Função |
|-------|--------|
| **[** | Iterar para trás nos contêineres |
| **]** | Iterar para frente nos contêineres |
| **LMB** | Inserir novo ponto |
| **RMB** | Deletar ponto |
| **;** | Aumentar tamanho do ponto |
| **'** | Diminuir tamanho do ponto |
| **Insert** | Criar loot no ponto |
| **M** | Criar 48 "AmmoBox_762x54_20Rnd" |
| **Backspace** | Marcar loot próximo para limpeza (reduz lifetime, não é instantâneo) |

#### Loot Tool

| Opção | Descrição | Equivalente em Script |
|-------|-----------|----------------------|
| **Deplete Lifetime** | Reduz o lifetime para 3 segundos (agendado para limpeza) | `GetCEApi().LootDepleteLifetime()` |
| **Set Damage = 1.0** | Define a vida para 0 | `GetCEApi().LootSetDamageToOne()` |
| **Damage + Deplete** | Executa ambos acima | `GetCEApi().LootDepleteAndDamage()` |
| **Invert Avoidance** | Alterna evitação de jogador (detecção de jogadores próximos) | -- |
| **Project Target Loot** | Emula o spawn do item alvo, gera imagens e logs. Requer "Loot Vis" habilitado | `GetCEApi().SpawnAnalyze()` e `GetCEApi().EconomyMap()` |

#### Infected

| Opção | Descrição | Equivalente em Script |
|-------|-----------|----------------------|
| **Infected Vis** | Visualizar zonas de zumbis, localizações, status vivo/morto | `GetCEApi().InfectedToggleVisualisation()` |
| **Infected Zone Info** | Depuração na tela quando a câmera está dentro de uma zona de infectados | `GetCEApi().InfectedToggleZoneInfo()` |
| **Infected Spawn** | Criar infectado na zona selecionada (ou "InfectedArmy" no cursor) | `GetCEApi().InfectedSpawn()` |
| **Reset Cleanup** | Define o temporizador de limpeza para 3 segundos | `GetCEApi().InfectedResetCleanup()` |

#### Animal

| Opção | Descrição | Equivalente em Script |
|-------|-----------|----------------------|
| **Animal Vis** | Visualizar zonas de animais, localizações, status vivo/morto | `GetCEApi().AnimalToggleVisualisation()` |
| **Animal Spawn** | Criar animal na zona selecionada (ou "AnimalGoat" no cursor) | `GetCEApi().AnimalSpawn()` |
| **Ambient Spawn** | Criar "AmbientHen" no alvo do cursor | `GetCEApi().AnimalAmbientSpawn()` |

#### Building

**Building Stats** mostra depuração na tela sobre estados de portas de construções:

- Lado esquerdo: se cada porta está aberta/fechada e livre/trancada
- Centro: estatísticas sobre `buildings.bin` (persistência de construções)

A randomização de portas usa o valor de config `initOpened`. Quando `rand < initOpened`, a porta inicia aberta (então `initOpened=0` significa que as portas nunca iniciam abertas).

Configurações comuns de `<building/>` no economy.xml:

| Configuração | Comportamento |
|-------------|---------------|
| `init="0" load="0" respawn="0" save="0"` | Sem persistência, sem randomização, estado padrão após reinício |
| `init="1" load="0" respawn="0" save="0"` | Sem persistência, portas randomizadas por initOpened |
| `init="1" load="1" respawn="0" save="1"` | Salva apenas portas trancadas, portas randomizadas por initOpened |
| `init="0" load="1" respawn="0" save="1"` | Persistência total, salva estado exato das portas, sem randomização |

#### Outras Ferramentas da Economia Central

| Opção | Descrição | Equivalente em Script |
|-------|-----------|----------------------|
| **Vehicle&Wreck Vis** | Visualizar objetos registrados na evitação "Vehicle". Amarelo = Carro, Rosa = Destroços (Building), Azul = InventoryItem | `GetCEApi().ToggleVehicleAndWreckVisualisation()` |
| **Loot Vis** | Dados de Economia na tela para qualquer coisa que você olhar (loot, infectados, eventos dinâmicos) | `GetCEApi().ToggleLootVisualisation()` |
| **Cluster Vis** | Estatísticas de Trajetória DE na tela | `GetCEApi().ToggleClusterVisualisation()` |
| **Dynamic Events Status** | Estatísticas DE na tela | `GetCEApi().ToggleDynamicEventStatus()` |
| **Dynamic Events Vis** | Visualizar e editar pontos de spawn DE | `GetCEApi().ToggleDynamicEventVisualisation()` |
| **Dynamic Events Spawn** | Criar um evento dinâmico no ponto mais próximo ou "StaticChristmasTree" como fallback | `GetCEApi().DynamicEventSpawn()` |
| **Export Dyn Event** | Exportar pontos DE para `storage/export/eventSpawn_CLASSNAME.xml` | `GetCEApi().DynamicEventExport()` |
| **Overall Stats** | Estatísticas CE na tela | `GetCEApi().ToggleOverallStats()` |
| **Updaters State** | Mostra o que a CE está processando atualmente | -- |
| **Idle Mode** | Coloca a CE em hibernação (para processamento) | -- |
| **Force Save** | Força o salvamento de toda a pasta `storage/data` (exclui banco de dados de jogadores) | -- |

**Atalhos de teclado do Dynamic Events Vis:**

| Tecla | Função |
|-------|--------|
| **[** | Iterar para trás nos DE disponíveis |
| **]** | Iterar para frente nos DE disponíveis |
| **LMB** | Inserir novo ponto para o DE selecionado |
| **RMB** | Deletar ponto mais próximo do cursor |
| **MMB** | Segurar ou clicar para rotacionar ângulo |

---

## AI

### Estrutura do Menu

```
AI
  Show NavMesh
  Debug Pathgraph World
  Debug Path Agent
  Debug AI Agent
```

> **Importante:** A depuração de IA atualmente não funciona em ambiente multiplayer.

### Show NavMesh

Desenha shapes de depuração para visualizar a malha de navegação. Mostra depuração na tela com estatísticas.

| Tecla | Função |
|-------|--------|
| **Numpad 0** | Registrar "Test start" na posição da câmera |
| **Numpad 1** | Regenerar tile na posição da câmera |
| **Numpad 2** | Regenerar tiles ao redor da posição da câmera |
| **Numpad 3** | Iterar para frente nos tipos de visualização |
| **LAlt + Numpad 3** | Iterar para trás nos tipos de visualização |
| **Numpad 4** | Registrar "Test end" na posição da câmera. Desenha esferas e uma linha entre início e fim. Verde = caminho encontrado, Vermelho = sem caminho |
| **Numpad 5** | Teste de posição mais próxima da NavMesh (SamplePosition). Esfera azul = consulta, esfera rosa = resultado |
| **Numpad 6** | Teste de raycast da NavMesh. Esfera azul = consulta, esfera rosa = resultado |

### Debug Pathgraph World

Depuração na tela mostrando quantas requisições de trabalho de caminho foram concluídas e quantas estão pendentes.

### Debug Path Agent

Depuração na tela e shapes de depuração para o pathfinding de uma IA. Mire em uma entidade IA para selecioná-la para rastreamento. Use isso quando estiver especificamente interessado em como uma IA encontra seu caminho.

### Debug AI Agent

Depuração na tela e shapes de depuração para o estado de alerta e comportamento de uma IA. Mire em uma entidade IA para selecioná-la para rastreamento. Use isso quando quiser entender as decisões e o estado de percepção de uma IA.

---

## Sounds

### Estrutura do Menu

```
Sounds
  Show playing samples
  Show system info
```

### Show Playing Samples

Visualização de depuração para sons sendo reproduzidos.

| Opção | Descrição |
|-------|-----------|
| **none** | Padrão, sem depuração |
| **ImGui** | Janela separada (iteração mais recente). Suporta filtragem, cobertura completa de categorias. Configurações salvas como `playing_sounds_imgui.ini` / `.bin` nos profiles |
| **DbgUI** | Legado. Tem filtragem por categoria, mais legível, mas sai da tela e não tem categoria de veículo |
| **Engine** | Legado. Mostra dados em tempo real codificados por cor com estatísticas, mas sai da tela e não tem legenda de cores |

### Show System Info

Estatísticas de depuração na tela do sistema de som (contagens de buffer, fontes ativas, etc.).

---

## Recursos Úteis para Modders

Embora cada opção tenha sua utilidade, estas são as que os modders usam com mais frequência:

### Análise de Desempenho

1. **Contador de FPS** (LCtrl + Numpad 1) -- Verificação rápida de que seu mod não está destruindo a taxa de frames
2. **Script Profiler** -- Encontre quais de suas classes ou funções consomem mais tempo de CPU. Defina o módulo como WORLD ou MISSION para focar na camada de script do seu mod

### Depuração Visual

1. **Câmera Livre** -- Voe ao redor para inspecionar objetos criados, verificar posições, checar comportamento de IA à distância
2. **Geometry Diagnostic** -- Verifique fire geometry, view geometry, roadway LOD e memory points do seu modelo personalizado sem sair do jogo
3. **Render Debug Mode** (RCtrl + RAlt + W) -- Veja sobreposições de wireframe para verificar densidade de malha e atribuições de material

### Teste de Gameplay

1. **Câmera Livre + Insert** -- Teletransporte seu jogador para qualquer lugar do mapa instantaneamente
2. **Weather Override** -- Force condições específicas de névoa para testar funcionalidades dependentes de visibilidade
3. **Ferramentas da Economia Central** -- Crie infectados, animais, loot e eventos dinâmicos sob demanda
4. **Depuração de combate** -- Rastreie trajetórias de tiros, inspecione sistemas de dano de hitpoints, teste penetração de explosão

### Desenvolvimento de IA

1. **Show NavMesh** -- Verifique que a IA pode realmente navegar para onde você espera
2. **Debug AI Agent** -- Veja o que um infectado ou animal está "pensando", qual nível de alerta possui
3. **Debug Path Agent** -- Veja o caminho real que uma IA está tomando e se o pathfinding tem sucesso

---

## Quando Usar o Diag Menu

### Durante o Desenvolvimento

- **Script Profiler** ao otimizar código por frame (OnUpdate, EOnFrame)
- **Câmera Livre** para posicionar objetos, verificar locais de spawn, inspecionar posicionamento de modelos
- **Geometry Diagnostic** imediatamente após importar um novo modelo para verificar LODs e tipos de geometria
- **Contador de FPS** como referência antes e depois de adicionar novas funcionalidades

### Durante Testes

- **Depuração de combate** para verificar dano de armas, comportamento de projéteis, efeitos de explosão
- **Ferramentas CE** para testar distribuição de loot, pontos de spawn, eventos dinâmicos
- **Depuração de IA** para verificar se o comportamento de infectados/animais responde corretamente à presença do jogador
- **Depuração de clima** para testar seu mod em diferentes condições climáticas

### Durante Investigação de Bugs

- **Contador de FPS + Script Profiler** quando jogadores relatam problemas de desempenho
- **Câmera Livre + Barra de espaço** (depuração de objeto) para inspecionar objetos que não estão se comportando corretamente
- **Render Debug Mode** para diagnosticar artefatos visuais ou problemas de material
- **Show Bullet** para depurar problemas de colisão de física

---

## Erros Comuns

**Usar o executável de varejo.** O Diag Menu está disponível apenas no `DayZDiag_x64.exe`. Se você pressionar Win+Alt e nada acontecer, você está rodando a versão de varejo.

**Esquecer que Max. Collider Distance é 0.** A visualização de física (Draw Bullet shape) não mostrará nada se Max. Collider Distance ainda estiver no padrão de 0. Defina pelo menos 10-20 para ver colisores ao seu redor.

**Ferramentas CE em multiplayer.** A maioria das opções de depuração da Economia Central funciona apenas em single-player com CE habilitada. Não espere que funcionem em um servidor dedicado.

**Depuração de IA em multiplayer.** A depuração de IA atualmente não funciona em ambiente multiplayer. Teste o comportamento de IA em single-player.

**Confundir "Bullet" com munição.** As opções "Bullet" da categoria "Enfusion World" se referem ao motor de física Bullet, não à munição de armas. A depuração relacionada a combate está em Game > Combat.

**Deixar o profiler ligado.** O Script Profiler tem overhead mensurável. Desligue-o quando terminar de analisar para obter leituras de FPS precisas.

**Valores grandes de distância de colisores.** Definir Max. Collider Distance para 200 ou 500 vai destruir sua taxa de frames. Use o menor valor que cubra sua área de interesse.

**Não habilitar pré-requisitos.** Várias opções dependem de outras estarem habilitadas primeiro:
- "Draw Char Ctrl" e "Draw Bullet wireframe" dependem de "Draw Bullet shape"
- "Edit Volume" requer câmera livre
- "Project Target Loot" requer "Loot Vis" habilitado

---

## Próximos Passos

- **Capítulo 8.6: [Depuração e Testes](06-debugging-testing.md)** -- Logs de script, depuração com Print, file patching e Workbench
- **Capítulo 8.7: [Publicando no Workshop](07-publishing-workshop.md)** -- Empacote e publique seu mod testado
