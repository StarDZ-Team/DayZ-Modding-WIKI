# Chapter 2.1: The 5-Layer Script Hierarchy

[Home](../README.md) | **The 5-Layer Script Hierarchy** | [Next: config.cpp Deep Dive >>](02-config-cpp.md)

---

## Indice

- [Visao Geral](#visao-geral)
- [A Pilha de Camadas](#a-pilha-de-camadas)
- [Camada 1: 1_Core (engineScriptModule)](#camada-1-1_core-enginescriptmodule)
- [Camada 2: 2_GameLib (gameLibScriptModule)](#camada-2-2_gamelib-gamelibscriptmodule)
- [Camada 3: 3_Game (gameScriptModule)](#camada-3-3_game-gamescriptmodule)
- [Camada 4: 4_World (worldScriptModule)](#camada-4-4_world-worldscriptmodule)
- [Camada 5: 5_Mission (missionScriptModule)](#camada-5-5_mission-missionscriptmodule)
- [A Regra Critica](#a-regra-critica)
- [Ordem de Carregamento e Tempo de Execucao](#ordem-de-carregamento-e-tempo-de-execucao)
- [Quando o Codigo de Cada Camada Executa](#quando-o-codigo-de-cada-camada-executa)
- [Diretrizes Praticas](#diretrizes-praticas)
- [Guia Rapido de Decisao](#guia-rapido-de-decisao)
- [Erros Comuns](#erros-comuns)

---

## Visao Geral

O motor do DayZ compila scripts em cinco etapas distintas chamadas **script modules**. Cada modulo corresponde a uma pasta numerada dentro do diretorio `Scripts/` do seu mod:

```
Scripts/
  1_Core/          --> engineScriptModule
  2_GameLib/       --> gameLibScriptModule
  3_Game/          --> gameScriptModule
  4_World/         --> worldScriptModule
  5_Mission/       --> missionScriptModule
```

Cada camada e construida sobre as anteriores. Os numeros nao sao arbitrarios -- eles definem uma ordem estrita de compilacao e dependencia aplicada pelo motor.

---

## A Pilha de Camadas

```
+---------------------------------------------------------------+
|                                                               |
|   5_Mission   (missionScriptModule)                           |
|   UI, HUD, ciclo de vida da missao, telas de menu             |
|   Pode referenciar: tudo abaixo (1-4)                         |
|                                                               |
+---------------------------------------------------------------+
|                                                               |
|   4_World     (worldScriptModule)                             |
|   Entidades, itens, veiculos, managers, logica de gameplay     |
|   Pode referenciar: 1_Core, 2_GameLib, 3_Game                 |
|                                                               |
+---------------------------------------------------------------+
|                                                               |
|   3_Game      (gameScriptModule)                              |
|   Configs, registro de RPC, classes de dados, input bindings   |
|   Pode referenciar: 1_Core, 2_GameLib                         |
|                                                               |
+---------------------------------------------------------------+
|                                                               |
|   2_GameLib   (gameLibScriptModule)                           |
|   Bindings de baixo nivel do motor (raramente usado por mods)  |
|   Pode referenciar: apenas 1_Core                              |
|                                                               |
+---------------------------------------------------------------+
|                                                               |
|   1_Core      (engineScriptModule)                            |
|   Tipos fundamentais, constantes, funcoes utilitarias puras    |
|   Pode referenciar: nada (esta e a fundacao)                   |
|                                                               |
+---------------------------------------------------------------+

        ORDEM DE COMPILACAO: 1 --> 2 --> 3 --> 4 --> 5
        DIRECAO DE DEPENDENCIA: apenas para cima (inferior nao ve superior)
```

---

## Camada 1: 1_Core (engineScriptModule)

### Proposito

```mermaid
graph TB
    subgraph "Script Module Load Order"
        M5["5_Mission<br/>UI, HUD, Mission hooks<br/>MissionServer, MissionGameplay"]
        M4["4_World<br/>Entities, Managers<br/>PlayerBase, ItemBase, CarScript"]
        M3["3_Game<br/>Game init, Configs, RPC<br/>DayZGame, Constants, Enums"]
        M2["2_GameLib<br/>Engine library<br/>Input, Settings, Components"]
        M1["1_Core<br/>Engine bindings<br/>Proto declarations, Math, Physics"]
    end

    M1 --> M2 --> M3 --> M4 --> M5

    M5 -.->|"can reference"| M4
    M5 -.->|"can reference"| M3
    M4 -.->|"can reference"| M3
    M4 -.-x|"CANNOT reference"| M5

    style M5 fill:#4A90D9,color:#fff
    style M4 fill:#2D8A4E,color:#fff
    style M3 fill:#D97A4A,color:#fff
    style M2 fill:#8B5CF6,color:#fff
    style M1 fill:#6B7280,color:#fff
```

A fundacao absoluta. O codigo aqui roda no nivel do motor antes de qualquer sistema de jogo existir. Este e o ponto mais cedo onde o codigo do mod pode executar.

### O Que Colocar Aqui

- Constantes e enums compartilhados entre todas as camadas
- Funcoes utilitarias puras (helpers de matematica, utilitarios de string)
- Infraestrutura de logging (o logger em si, nao o que faz log)
- Defines de preprocessador e typedefs
- Definicoes de classes base que precisam ser visiveis em todo lugar

### Exemplos Reais

**Community Framework** coloca seu sistema de modulos core aqui:

```c
// 1_Core/CF_ModuleCoreManager.c
class CF_ModuleCoreManager
{
    static ref array<typename> s_Modules = new array<typename>;

    static void _Insert(typename module)
    {
        s_Modules.Insert(module);
    }
};
```

**MyFramework** coloca suas constantes de logging aqui:

```c
// 1_Core/MyLogLevel.c
enum MyLogLevel
{
    TRACE = 0,
    DEBUG = 1,
    INFO  = 2,
    WARN  = 3,
    ERROR = 4
};
```

### Quando Usar

Use `1_Core` apenas quando precisar de algo disponivel para **todas** as outras camadas, e que tenha zero dependencia de tipos de jogo como `PlayerBase`, `ItemBase` ou `MissionBase`. A maioria dos mods nao precisa desta camada.

---

## Camada 2: 2_GameLib (gameLibScriptModule)

### Proposito

Bindings de biblioteca de baixo nivel do motor. Esta camada existe na hierarquia de scripts vanilla, mas e **raramente usada por mods**. Ela fica entre o motor bruto e a logica de jogo.

### O Que Colocar Aqui

- Abstracoes de nivel de motor (rendering, bindings de audio)
- Bibliotecas matematicas alem do que `1_Core` fornece
- Tipos base de widget/UI do motor

### Exemplos Reais

**DabsFramework** e um dos poucos mods que usa esta camada:

```c
// 2_GameLib/DabsFramework/MVC/ScriptView.c
// Infraestrutura de binding de view de baixo nivel
class ScriptView : ScriptedWidgetEventHandler
{
    // ...
};
```

### Quando Usar

Quase nunca. A menos que voce esteja construindo um framework que precise de bindings de nivel de motor abaixo da camada de jogo, pule `2_GameLib` inteiramente. A grande maioria dos mods usa apenas as camadas 3, 4 e 5.

---

## Camada 3: 3_Game (gameScriptModule)

### Proposito

A camada principal para configuracao, definicoes de dados e sistemas que nao interagem diretamente com entidades do mundo. Esta e a primeira camada onde tipos de jogo estao disponiveis.

### O Que Colocar Aqui

- Classes de configuracao (settings que podem ser carregados/salvos)
- Registro e identificadores de RPC
- Classes de dados e DTOs (data transfer objects)
- Registro de input bindings
- Sistemas de registro de plugin/modulo
- Enums e constantes compartilhados que dependem de tipos de jogo
- Handlers de keybinds customizados

### Exemplos Reais

Sistema de configuracao do **MyFramework**:

```c
// 3_Game/MyMod/Config/MyConfigBase.c
class MyConfigBase
{
    // Configuracao base com persistencia JSON automatica
    void Load();
    void Save();
    string GetConfigPath();
};
```

**COT** define seus identificadores RPC aqui:

```c
// 3_Game/COT/RPCData.c
class JMRPCData
{
    static const int WEATHER_SET  = 0x1001;
    static const int PLAYER_HEAL  = 0x1002;
    // ...
};
```

**VPP Admin Tools** registra seus comandos de chat:

```c
// 3_Game/VPPAdminTools/ChatCommands/ChatCommandBase.c
class ChatCommandBase
{
    string GetCommand();
    bool Execute(PlayerIdentity sender, array<string> args);
};
```

### Quando Usar

**Na duvida, coloque em `3_Game`.** Esta e a camada padrao para a maioria do codigo que nao envolve entidades. Classes de configuracao, enums, constantes, definicoes de RPC, classes de dados -- tudo pertence aqui.

---

## Camada 4: 4_World (worldScriptModule)

### Proposito

Logica de gameplay que interage com o mundo 3D. Esta camada tem acesso a entidades, itens, veiculos, construcoes e todos os objetos do mundo.

### O Que Colocar Aqui

- Itens e armas customizados (estendendo `ItemBase`, `Weapon_Base`)
- Entidades customizadas (estendendo `Building`, `DayZAnimal`, etc.)
- Managers do mundo (sistemas de spawn, gerenciadores de loot, diretores de IA)
- Extensoes de jogador (comportamento modded de `PlayerBase`)
- Customizacao de veiculos
- Sistemas de acao (estendendo `ActionBase`)
- Zonas de trigger e efeitos de area

### Exemplos Reais

**MyMissions Mod** spawna marcadores de missao no mundo:

```c
// 4_World/Missions/MyMissionMarker.c
class MyMissionMarker : House
{
    void MyMissionMarker()
    {
        SetFlags(EntityFlags.VISIBLE, true);
    }

    void SetPosition(vector pos)
    {
        SetPosition(pos);
    }
};
```

**MyAI Mod** implementa entidades de bot aqui:

```c
// 4_World/AI/MyAIBot.c
class MyAIBot : SurvivorBase
{
    protected ref MyAIBrain m_Brain;

    override void EOnInit(IEntity other, int extra)
    {
        super.EOnInit(other, extra);
        m_Brain = new MyAIBrain(this);
    }
};
```

**DayZ Vanilla** define todos os itens aqui:

```c
// 4_World/Entities/ItemBase/Edible_Base.c
class Edible_Base extends ItemBase
{
    // Todos os itens de comida herdam deste
};
```

### Quando Usar

Qualquer coisa que toque o mundo fisico do jogo: criar entidades, modificar itens, lidar com interacoes de jogador, gerenciar estado do mundo. Se sua classe estende `EntityAI`, `ItemBase`, `PlayerBase`, `Building`, ou interage com `GetGame().GetWorld()`, ela pertence a `4_World`.

---

## Camada 5: 5_Mission (missionScriptModule)

### Proposito

A camada mais alta. Ciclo de vida da missao, paineis de UI, overlays de HUD e o ponto final de inicializacao. E aqui que o codigo de startup do lado do cliente e do servidor vive.

### O Que Colocar Aqui

- Hooks de classe de missao (overrides de `MissionServer`, `MissionGameplay`)
- Paineis de HUD e UI
- Telas de menu
- Registro e inicializacao do mod (a sequencia de "boot")
- Overlays de renderizacao do lado do cliente
- Handlers de startup/shutdown do servidor

### Exemplos Reais

**MyFramework** faz hook na missao para inicializar todos os subsistemas:

```c
// 5_Mission/MyMod/MyModMissionClient.c
modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        MyFramework.Init();
    }

    override void OnMissionFinish()
    {
        MyFramework.ShutdownAll();
        super.OnMissionFinish();
    }
};
```

**COT** adiciona seu menu de admin aqui:

```c
// 5_Mission/COT/gui/COT_Menu.c
class COT_Menu : UIScriptedMenu
{
    override Widget Init()
    {
        // Construir UI do painel de admin
    }
};
```

**MyMissions Mod** se registra no Core:

```c
// 5_Mission/Missions/MyMissionsRegister.c
class MyMissionsRegister
{
    void MyMissionsRegister()
    {
        MyFramework.RegisterMod("Missions", "1.0.0");
        MyFramework.RegisterModConfig(new MyMissionsConfig());
    }
};
```

### Quando Usar

UI, HUD, telas de menu e inicializacao de mod que depende da missao estar ativa. Tambem e o lugar final onde o servidor faz hook no ciclo de vida de startup/shutdown.

---

## A Regra Critica

> **Camadas inferiores NAO PODEM referenciar tipos de camadas superiores.**

Esta e a regra mais importante da arquitetura de scripts do DayZ. O motor a aplica em tempo de compilacao.

```
PERMITIDO:
  Codigo de 5_Mission referencia uma classe de 4_World       OK
  Codigo de 4_World referencia uma classe de 3_Game           OK
  Codigo de 3_Game referencia uma classe de 1_Core            OK

PROIBIDO:
  Codigo de 3_Game referencia uma classe de 4_World           ERRO DE COMPILACAO
  Codigo de 4_World referencia uma classe de 5_Mission        ERRO DE COMPILACAO
  Codigo de 1_Core referencia uma classe de 3_Game            ERRO DE COMPILACAO
```

### Por Que Isso Existe

Cada camada e compilada separadamente e sequencialmente. Quando `3_Game` esta sendo compilado, `4_World` e `5_Mission` ainda nao existem. O compilador nao tem conhecimento desses tipos.

### O Que Acontece Quando Voce Viola

A mensagem de erro costuma ser pouco util:

```
SCRIPT (E): Undefined type 'PlayerBase'
```

Isso tipicamente significa que voce colocou codigo em `3_Game` que referencia `PlayerBase`, que e definido em `4_World`. A correcao e mover seu codigo para `4_World` ou superior.

### A Solucao Alternativa: Casting Atraves de Tipos Base

Quando codigo em `3_Game` precisa lidar com um objeto que sera um `PlayerBase` em tempo de execucao, use o tipo base `Object` ou `Man` (definido em `3_Game`) e faca cast depois:

```c
// Em 3_Game -- nao podemos referenciar PlayerBase diretamente
class MyConfig
{
    void HandlePlayer(Man player)
    {
        // 'Man' esta disponivel em 3_Game
        // Em tempo de execucao, isso sera um PlayerBase, mas nao podemos nomea-lo aqui
    }
};

// Em 4_World -- agora podemos fazer cast com seguranca
class MyWorldLogic
{
    void ProcessPlayer(Man player)
    {
        PlayerBase pb;
        if (Class.CastTo(pb, player))
        {
            // Agora temos acesso completo a PlayerBase
        }
    }
};
```

---

## Ordem de Carregamento e Tempo de Execucao

### Ordem de Compilacao

O motor compila os scripts de todos os mods para cada camada antes de passar para a proxima:

```
Passo 1: Compila scripts 1_Core de TODOS os mods
Passo 2: Compila scripts 2_GameLib de TODOS os mods
Passo 3: Compila scripts 3_Game de TODOS os mods
Passo 4: Compila scripts 4_World de TODOS os mods
Passo 5: Compila scripts 5_Mission de TODOS os mods
```

Dentro de cada passo, os mods sao ordenados pela cadeia de dependencias `requiredAddons` no `config.cpp`. Se o ModB depende do ModA, os scripts do ModA para aquela camada sao compilados primeiro.

### Ordem de Inicializacao

Apos a compilacao, a inicializacao em tempo de execucao segue uma sequencia diferente:

```
1. Motor inicia, carrega configs
2. Scripts de 1_Core ficam disponiveis (construtores estaticos executam)
3. Scripts de 2_GameLib ficam disponiveis
4. Scripts de 3_Game ficam disponiveis
   --> Funcoes de entrada do CfgMods executam (ex: "CreateGameMod")
   --> Input bindings registram
5. Scripts de 4_World ficam disponiveis
   --> Entidades podem ser criadas
6. Missao carrega
7. Scripts de 5_Mission ficam disponiveis
   --> MissionServer.OnInit() / MissionGameplay.OnInit() disparam
   --> UI e HUD ficam disponiveis
```

---

## Quando o Codigo de Cada Camada Executa

| Camada | Init Estatico | Pronto em Runtime | Evento Chave |
|--------|--------------|-------------------|--------------|
| `1_Core` | Primeiro | Imediatamente | Boot do motor |
| `2_GameLib` | Segundo | Apos init do motor | Subsistemas do motor prontos |
| `3_Game` | Terceiro | Apos init do jogo | `CreateGame()` / funcao de entrada customizada |
| `4_World` | Quarto | Apos o mundo carregar | Entidades comecam a spawnar |
| `5_Mission` | Quinto (ultimo) | Apos a missao iniciar | `MissionServer.OnInit()` / `MissionGameplay.OnInit()` |

**Importante:** Variaveis estaticas e codigo de escopo global em cada camada executam durante a fase de compilacao/linkagem, antes de `OnInit()` ser chamado. Nao coloque logica de inicializacao complexa em inicializadores estaticos.

---

## Diretrizes Praticas

### "Na Duvida, Coloque em 3_Game"

Esta e a camada mais comum para codigo de mod. A menos que seu codigo:
- Precise estar disponivel antes dos tipos de jogo existirem --> `1_Core`
- Estenda uma entidade/item/veiculo/jogador --> `4_World`
- Toque UI, HUD ou ciclo de vida da missao --> `5_Mission`

...entao ele pertence a `3_Game`.

### O Checklist de Camadas

Antes de posicionar um arquivo, faca estas perguntas:

1. **Ele estende `EntityAI`, `ItemBase`, `PlayerBase`, `Building` ou qualquer entidade do mundo?**
   Coloque em `4_World`.

2. **Ele referencia `MissionServer`, `MissionGameplay` ou cria widgets de UI?**
   Coloque em `5_Mission`.

3. **E uma classe de dados pura, config, enum ou definicao de RPC?**
   Coloque em `3_Game`.

4. **E uma constante fundamental ou utilitario com zero dependencias de jogo?**
   Coloque em `1_Core`.

5. **Nenhuma das anteriores?**
   Padrao e `3_Game`.

### Mantenha Suas Camadas Enxutas

Um erro comum e jogar tudo em `4_World`. Isso cria codigo fortemente acoplado. Em vez disso:

```
BOM:
  3_Game/  --> Classe de config, enums, RPC IDs, structs de dados
  4_World/ --> Manager que usa a config, classes de entidade
  5_Mission/ --> UI que exibe o estado do manager

RUIM:
  4_World/ --> Config, enums, RPCs, managers E classes de entidade tudo misturado
```

---

## Guia Rapido de Decisao

```
                    Estende uma entidade do mundo?
                          (EntityAI, ItemBase, etc.)
                         /                    \
                       SIM                    NAO
                        |                      |
                    4_World              Toca UI/HUD/Mission?
                                        /                    \
                                      SIM                    NAO
                                       |                      |
                                   5_Mission          E um utilitario puro
                                                      com zero deps de jogo?
                                                      /                \
                                                    SIM                NAO
                                                     |                  |
                                                  1_Core            3_Game
```

---

## Erros Comuns

### 1. Referenciar PlayerBase a partir de 3_Game

```c
// ERRADO: em 3_Game/MyConfig.c
class MyConfig
{
    void ApplyToPlayer(PlayerBase player)  // ERRO: PlayerBase nao definido ainda
    {
    }
};

// CERTO: em 3_Game/MyConfig.c
class MyConfig
{
    ref array<float> m_Values;  // Dados puros, sem referencias a entidades
};

// CERTO: em 4_World/MyManager.c
class MyManager
{
    void ApplyConfig(PlayerBase player, MyConfig config)
    {
        // Agora podemos usar ambos
    }
};
```

### 2. Colocar Codigo de UI em 4_World

```c
// ERRADO: em 4_World/MyPanel.c
class MyPanel : UIScriptedMenu  // UIScriptedMenu funciona em 4_World,
{                                // mas hooks de MissionGameplay estao em 5_Mission
    // Isso causara problemas ao tentar registrar a UI
};

// CERTO: em 5_Mission/MyPanel.c
class MyPanel : UIScriptedMenu
{
    // UI pertence a 5_Mission onde o ciclo de vida da missao esta disponivel
};
```

### 3. Colocar Constantes em 4_World Quando 3_Game Precisa Delas

```c
// ERRADO: Constantes definidas em 4_World
// 4_World/MyConstants.c
const int MY_RPC_ID = 12345;

// 3_Game/MyRPCHandler.c
class MyRPCHandler
{
    void Register()
    {
        // ERRO: MY_RPC_ID nao visivel aqui (definido em camada superior)
    }
};

// CERTO: Constantes definidas em 3_Game (ou 1_Core)
// 3_Game/MyConstants.c
const int MY_RPC_ID = 12345;  // Agora visivel para 3_Game E 4_World E 5_Mission
```

### 4. Complicar Demais com 1_Core

Se suas "constantes" referenciam qualquer tipo de jogo, elas nao podem ir em `1_Core`. Algo como `const string PLAYER_CONFIG_PATH` e tranquilo em `1_Core`, mas uma classe que recebe um parametro `CGame` nao e.

---

## Resumo

| Camada | Pasta | Entrada no Config | Uso Principal | Frequencia |
|--------|-------|-------------------|---------------|------------|
| 1 | `1_Core/` | `engineScriptModule` | Constantes, utilitarios, base de logging | Raro |
| 2 | `2_GameLib/` | `gameLibScriptModule` | Bindings do motor | Muito raro |
| 3 | `3_Game/` | `gameScriptModule` | Configs, RPCs, classes de dados | **Mais comum** |
| 4 | `4_World/` | `worldScriptModule` | Entidades, itens, managers | Comum |
| 5 | `5_Mission/` | `missionScriptModule` | UI, HUD, hooks de missao | Comum |

**Lembre-se:** Camadas inferiores nao podem ver camadas superiores. Na duvida, use `3_Game`. Mova o codigo para cima apenas quando precisar acessar tipos definidos em uma camada superior.

---

**Proximo:** [Capitulo 2.2: config.cpp em Profundidade](02-config-cpp.md)
