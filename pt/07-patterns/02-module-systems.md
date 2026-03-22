# Chapter 7.2: Module / Plugin Systems

[Home](../../README.md) | [<< Previous: Singleton Pattern](01-singletons.md) | **Module / Plugin Systems** | [Next: RPC Patterns >>](03-rpc-patterns.md)

---

## Introdução

Todo framework sério de mods DayZ usa um sistema de módulos ou plugins para organizar código em unidades autocontidas com hooks de ciclo de vida definidos. Ao invés de espalhar lógica de inicialização por classes de missão modded, módulos se registram com um manager central que despacha eventos de ciclo de vida --- `OnInit`, `OnMissionStart`, `OnUpdate`, `OnMissionFinish` --- para cada módulo em uma ordem previsível.

Este capítulo examina quatro abordagens do mundo real: `CF_ModuleCore` do Community Framework, `PluginBase` / `ConfigurablePlugin` do VPP, registro baseado em atributos do Dabs Framework e `MyModuleManager` do MyMod. Cada um resolve o mesmo problema de forma diferente; entender todos os quatro ajudará você a escolher o padrão certo para seu mod ou integrar-se corretamente com um framework existente.

---

## Por que Módulos?

Sem um sistema de módulos, um mod DayZ tipicamente acaba com uma classe `MissionServer` ou `MissionGameplay` modded monolítica que cresce até se tornar ingerenciável:

```c
// RUIM: Tudo amontoado em uma classe modded
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        InitLootSystem();
        InitVehicleTracker();
        InitBanManager();
        InitWeatherController();
        InitAdminPanel();
        InitKillfeedHUD();
        // ... mais 20 sistemas
    }
};
```

Um sistema de módulos substitui isso com um único ponto de hook estável:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        MyModuleManager.Register(new LootModule());
        MyModuleManager.Register(new VehicleModule());
        MyModuleManager.Register(new WeatherModule());
    }

    override void OnMissionStart()
    {
        super.OnMissionStart();
        MyModuleManager.OnMissionStart();  // Despacha para todos os módulos
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);
        MyModuleManager.OnServerUpdate(timeslice);  // Despacha para todos os módulos
    }
};
```

Cada módulo é uma classe independente com seu próprio arquivo, seu próprio estado e seus próprios hooks de ciclo de vida. Adicionar uma nova feature significa adicionar um novo módulo --- não editar uma classe de missão de 3000 linhas.

---

## CF_ModuleCore (COT / Expansion)

Community Framework (CF) fornece o sistema de módulos mais amplamente usado no ecossistema de modding DayZ. Tanto COT quanto Expansion são construídos sobre ele.

### Como Funciona

1. Você declara uma classe de módulo que estende uma das classes base do CF
2. Você a registra em `config.cpp` em `CfgPatches` / `CfgMods`
3. O `CF_ModuleCoreManager` do CF auto-descobre e instancia todas as classes de módulo registradas no startup
4. Eventos de ciclo de vida são despachados automaticamente

### Classes Base de Módulo

CF fornece três classes base correspondendo às camadas de script do DayZ:

| Classe Base | Camada | Uso Típico |
|-----------|-------|-------------|
| `CF_ModuleGame` | 3_Game | Init inicial, registro de RPC, classes de dados |
| `CF_ModuleWorld` | 4_World | Interação com entidades, sistemas de gameplay |
| `CF_ModuleMission` | 5_Mission | UI, HUD, hooks de nível de missão |

### Exemplo: Um Módulo CF

```c
class MyLootModule : CF_ModuleWorld
{
    // CF chama isso uma vez durante a inicialização do módulo
    override void OnInit()
    {
        super.OnInit();
        // Registrar handlers de RPC, alocar estruturas de dados
    }

    // CF chama isso quando a missão começa
    override void OnMissionStart(Class sender, CF_EventArgs args)
    {
        super.OnMissionStart(sender, args);
        // Carregar configs, spawnar loot inicial
    }

    // CF chama isso todo frame no servidor
    override void OnUpdate(Class sender, CF_EventArgs args)
    {
        super.OnUpdate(sender, args);
        // Tick dos timers de respawn de loot
    }

    // CF chama isso quando a missão termina
    override void OnMissionFinish(Class sender, CF_EventArgs args)
    {
        super.OnMissionFinish(sender, args);
        // Salvar estado, liberar recursos
    }
};
```

### Acessando um Módulo CF

```c
// Obter referência a um módulo em execução por tipo
MyLootModule lootMod;
CF_Modules<MyLootModule>.Get(lootMod);
if (lootMod)
{
    lootMod.ForceRespawn();
}
```

---

## VPP PluginBase / ConfigurablePlugin

VPP Admin Tools usa uma arquitetura de plugins onde cada ferramenta admin é uma classe plugin registrada com um manager central.

### Plugin Base

```c
// Padrão VPP (simplificado)
class PluginBase : Managed
{
    void OnInit();
    void OnUpdate(float dt);
    void OnDestroy();

    // Identidade do plugin
    string GetPluginName();
    bool IsServerOnly();
};
```

### ConfigurablePlugin

VPP estende a base com uma variante ciente de config que automaticamente carrega/salva configurações:

```c
class ConfigurablePlugin : PluginBase
{
    // VPP auto-carrega isso de JSON no init
    ref PluginConfigBase m_Config;

    override void OnInit()
    {
        super.OnInit();
        LoadConfig();
    }
};
```

---

## Registro Baseado em Atributos do Dabs

O Dabs Framework usa uma abordagem mais moderna: atributos estilo C# para auto-registro.

### O Conceito

Ao invés de registrar módulos manualmente, você anota uma classe com um atributo, e o framework a descobre no startup usando reflexão:

```c
// Padrão Dabs (conceitual)
[CF_RegisterModule(DabsAdminESP)]
class DabsAdminESP : CF_ModuleWorld
{
    override void OnInit()
    {
        super.OnInit();
        // ...
    }
};
```

O atributo `CF_RegisterModule` diz ao module manager do CF para instanciar esta classe automaticamente. Sem chamada manual de `Register()` necessária.

---

## MyMod MyModuleManager

MyFramework usa um padrão de registro explícito com uma classe manager estática. Não há instância do manager --- são inteiramente métodos estáticos e armazenamento estático.

### Classes Base de Módulo

```c
// Base: hooks de ciclo de vida
class MyModuleBase : Managed
{
    bool IsServer();       // Sobrescrever na subclasse
    bool IsClient();       // Sobrescrever na subclasse
    string GetModuleName();
    void OnInit();
    void OnMissionStart();
    void OnMissionFinish();
};

// Módulo server-side: adiciona OnUpdate + eventos de jogador
class MyServerModule : MyModuleBase
{
    void OnUpdate(float dt);
    void OnPlayerConnect(PlayerIdentity identity);
    void OnPlayerDisconnect(PlayerIdentity identity, string uid);
};

// Módulo client-side: adiciona OnUpdate
class MyClientModule : MyModuleBase
{
    void OnUpdate(float dt);
};
```

### Registro

Módulos se registram explicitamente, tipicamente de classes de missão modded:

```c
// Em MissionServer.OnInit() modded:
MyModuleManager.Register(new MyMissionServerModule());
MyModuleManager.Register(new MyAIServerModule());
```

### Segurança em Listen-Server

As classes base de módulo do MyMod aplicam um invariante crítico: `MyServerModule` retorna `true` de `IsServer()` e `false` de `IsClient()`, enquanto `MyClientModule` faz o oposto. O manager usa essas flags para evitar despachar eventos de ciclo de vida duas vezes em listen servers (onde tanto `MissionServer` quanto `MissionGameplay` rodam no mesmo processo).

---

## Ciclo de Vida do Módulo: O Contrato Universal

Apesar das diferenças de implementação, todos os quatro frameworks seguem o mesmo contrato de ciclo de vida:

```
┌─────────────────────────────────────────────────────┐
│  Registro / Descoberta                               │
│  Instância do módulo é criada e registrada           │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnInit()                                            │
│  Setup único: alocar coleções, registrar RPCs        │
│  Chamado uma vez por módulo após registro             │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionStart()                                    │
│  Missão está ao vivo: carregar configs, iniciar      │
│  timers, inscrever em eventos, spawnar entidades     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnUpdate(float dt)         [repetindo todo frame]   │
│  Tick por frame: processar filas, atualizar timers,  │
│  verificar condições, avançar máquinas de estado     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OnMissionFinish()                                   │
│  Teardown: salvar estado, desinscrever eventos,      │
│  limpar coleções, anular referências                 │
└─────────────────────────────────────────────────────┘
```

### Regras

1. **OnInit vem antes de OnMissionStart.** Nunca carregue configs ou spawne entidades em `OnInit()` --- o mundo pode não estar pronto ainda.
2. **OnUpdate recebe delta time.** Sempre use `dt` para lógica baseada em tempo, nunca assuma uma taxa de frames fixa.
3. **OnMissionFinish deve limpar tudo.** Toda coleção `ref` deve ser limpa. Toda inscrição de evento deve ser removida. Todo singleton deve ser destruído. Este é o único ponto confiável de teardown.
4. **Módulos não devem depender da ordem de inicialização uns dos outros.** Se Módulo A precisa de Módulo B, use acesso lazy (`GetModule()`) ao invés de assumir que B foi registrado primeiro.

---

## Melhores Práticas para Design de Módulos

### 1. Um Módulo, Uma Responsabilidade

Um módulo deve possuir exatamente um domínio. Se você está escrevendo `VehicleAndWeatherAndLootModule`, divida.

### 2. Mantenha OnUpdate Barato

`OnUpdate` roda todo frame. Se seu módulo faz trabalho caro (I/O de arquivo, scans do mundo, pathfinding), faça em um timer ou distribua entre frames.

### 3. Registre RPCs em OnInit, Não em OnMissionStart

Handlers de RPC devem estar no lugar antes que qualquer cliente possa enviar uma mensagem. `OnInit()` roda durante o registro do módulo, que acontece cedo no setup da missão.

### 4. Use o Module Manager para Acesso Cross-Módulo

Não mantenha referências diretas a outros módulos. Use o lookup do manager para acoplamento frouxo.

### 5. Proteja-se Contra Dependências Ausentes

Use verificações de preprocessador para integração opcional com outros mods:

```c
override void OnMissionStart()
{
    super.OnMissionStart();

    #ifdef MyAI
    MyEventBus.OnMissionStarted.Insert(OnAIMissionStarted);
    #endif
}
```

### 6. Faça Log de Eventos de Ciclo de Vida do Módulo

Logging torna a depuração direta. Todo módulo deve fazer log quando inicializa e desliga.

---

## Tabela de Comparação

| Feature | CF_ModuleCore | VPP Plugin | Dabs Attribute | MyMod Module |
|---------|--------------|------------|----------------|---------------|
| **Descoberta** | config.cpp + auto | Manual `Register()` | Scan de atributo | Manual `Register()` |
| **Classes base** | Game / World / Mission | PluginBase / ConfigurablePlugin | CF_ModuleWorld + atributo | ServerModule / ClientModule |
| **Dependências** | Requer CF | Autocontido | Requer CF | Autocontido |
| **Segurança listen-server** | CF trata | Verificação manual | CF trata | Subclasses tipadas |
| **Integração config** | Separada | Integrada no ConfigurablePlugin | Separada | Via MyConfigManager |
| **Despacho de update** | Automático | Manager chama `OnUpdate` | Automático | Manager chama `OnUpdate` |
| **Limpeza** | CF trata | Manual `OnDestroy` | CF trata | `MyModuleManager.Cleanup()` |
| **Acesso cross-mod** | `CF_Modules<T>.Get()` | `GetPluginManager().Get()` | `CF_Modules<T>.Get()` | `MyModuleManager.GetModule()` |

Escolha a abordagem que corresponde ao perfil de dependências do seu mod. Se você já depende do CF, use `CF_ModuleCore`. Se quer zero dependências externas, construa seu próprio sistema seguindo o padrão MyMod ou VPP.

---

## Compatibilidade & Impacto

- **Multi-Mod:** Múltiplos mods podem registrar seus próprios módulos com o mesmo manager (CF, VPP ou customizado). Colisões de nome só acontecem se dois mods registram o mesmo tipo de classe --- use nomes de classe únicos prefixados com a tag do seu mod.
- **Ordem de Carregamento:** CF auto-descobre módulos do `config.cpp`, então a ordem de carregamento segue `requiredAddons`. Managers customizados registram módulos em `OnInit()`, onde a cadeia `modded class` determina a ordem. Módulos não devem depender da ordem de registro --- use padrões de acesso lazy.
- **Listen Server:** Em listen servers, tanto `MissionServer` quanto `MissionGameplay` rodam no mesmo processo. Se seu module manager despacha `OnUpdate` de ambos, módulos recebem ticks duplos. Use subclasses tipadas (`ServerModule` / `ClientModule`) que retornam `IsServer()` ou `IsClient()` para prevenir isso.
- **Performance:** Despacho de módulos adiciona uma iteração de loop por módulo registrado por chamada de ciclo de vida. Com 10--20 módulos isso é desprezível. Garanta que métodos `OnUpdate` individuais dos módulos sejam baratos (veja Capítulo 7.7).
- **Migração:** Ao atualizar versões do DayZ, sistemas de módulos são estáveis desde que a API da classe base (`CF_ModuleWorld`, `PluginBase`, etc.) não mude. Fixe a versão de dependência do CF para evitar quebras.

---

## Erros Comuns

| Erro | Impacto | Correção |
|------|---------|----------|
| Falta de limpeza `OnMissionFinish` em um módulo | Coleções, timers e inscrições de eventos sobrevivem entre reinícios de missão, causando dados obsoletos ou crashes | Sobrescreva `OnMissionFinish`, limpe todas as coleções `ref`, desinscreva todos os eventos |
| Despachar eventos de ciclo de vida duas vezes em listen servers | Módulos server rodam lógica client e vice-versa; spawns duplicados, envios duplos de RPC | Use guards `IsServer()` / `IsClient()` ou subclasses tipadas de módulo que aplicam a separação |
| Registrar RPCs em `OnMissionStart` ao invés de `OnInit` | Clientes que conectam durante o setup da missão podem enviar RPCs antes dos handlers estarem prontos --- mensagens são silenciosamente descartadas | Sempre registre handlers de RPC em `OnInit()`, que roda durante o registro do módulo antes de qualquer cliente conectar |
| Um "God module" tratando tudo | Impossível de debugar, testar ou estender; conflitos de merge quando múltiplos desenvolvedores trabalham nele | Divida em módulos focados com uma única responsabilidade cada |
| Manter `ref` direta para outra instância de módulo | Cria acoplamento forte e potenciais vazamentos de memória por ciclo de ref | Use o lookup do module manager (`GetModule()`, `CF_Modules<T>.Get()`) para acesso cross-módulo |

---

## Teoria vs Prática

| Livro-Texto Diz | Realidade do DayZ |
|-----------------|-------------------|
| Descoberta de módulos deve ser automática via reflexão | Reflexão do Enforce Script é limitada; descoberta baseada em `config.cpp` (CF) ou chamadas explícitas de `Register()` são as únicas abordagens confiáveis |
| Módulos devem ser substituíveis a quente em runtime | DayZ não suporta hot-reload de scripts; módulos vivem por todo o ciclo de vida da missão |
| Use interfaces para contratos de módulo | Enforce Script não tem palavra-chave `interface`; use métodos virtuais de classe base (`override`) ao invés |
| Injeção de dependência desacopla módulos | Nenhum framework de DI existe; use lookups do manager e guards `#ifdef` para dependências cross-mod opcionais |

---

[<< Anterior: Padrão Singleton](01-singletons.md) | [Início](../../README.md) | [Próximo: Padrões RPC >>](03-rpc-patterns.md)
