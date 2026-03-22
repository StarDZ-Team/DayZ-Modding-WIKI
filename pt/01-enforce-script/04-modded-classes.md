# Chapter 1.4: Modded Classes (The Key to DayZ Modding)

[Home](../README.md) | [<< Previous: Classes & Inheritance](03-classes-inheritance.md) | **Modded Classes** | [Next: Control Flow >>](05-control-flow.md)

---

## Introdução

**Modded classes são o conceito mais importante do modding de DayZ.** São o mecanismo que permite ao seu mod mudar o comportamento de classes existentes do jogo sem substituir os arquivos originais. Sem modded classes, o modding de DayZ como conhecemos não existiria.

Todo mod grande de DayZ --- Community Online Tools, VPP Admin Tools, DayZ Expansion, mods de Trader, overhauls médicos, sistemas de construção --- funciona usando `modded class` para se conectar a classes vanilla e adicionar ou mudar comportamento. Quando você faz mod de `PlayerBase`, todo jogador no jogo recebe seu novo comportamento. Quando você faz mod de `MissionServer`, seu código roda como parte do ciclo de vida da mission do servidor. Quando você faz mod de `ItemBase`, todo item no jogo é afetado.

Este capítulo é intencionalmente o mais longo e detalhado da Parte 1 porque acertar as modded classes é o que separa um mod funcional de um que crasha servidores ou quebra outros mods.

---

## Como Modded Classes Funcionam

### A Ideia Básica

Normalmente, `class Child extends Parent` cria uma nova classe chamada `Child` que herda de `Parent`. Mas `modded class Parent` faz algo fundamentalmente diferente: ela **substitui** a classe `Parent` original na hierarquia de classes do engine, inserindo seu código na cadeia de herança.

```
Before modding:
  Parent -> (all code that creates Parent gets the original)

After modded class:
  Original Parent -> Your Modded Parent
  (all code that creates Parent now gets YOUR version)
```

Toda chamada `new Parent()` em qualquer lugar do jogo --- código vanilla, outros mods, em todo lugar --- agora cria uma instância da sua versão modificada.

### Sintaxe

```c
modded class ClassName
{
    // Your additions and overrides go here
}
```

É isso. Sem `extends`, sem nome novo. A palavra-chave `modded` diz ao engine: "Estou modificando a classe `ClassName` existente."

### O Exemplo Canônico

```c
// === Original vanilla class (in DayZ's scripts) ===
class ModMe
{
    void Say()
    {
        Print("Hello from the original");
    }
}

// === Your mod's script file ===
modded class ModMe
{
    override void Say()
    {
        Print("Hello from the mod");
        super.Say();  // Call the original
    }
}

// === What happens at runtime ===
void Test()
{
    ModMe obj = new ModMe();
    obj.Say();
    // Output:
    //   "Hello from the mod"
    //   "Hello from the original"
}
```

---

## Encadeamento: Múltiplos Mods Modificando a Mesma Classe

O verdadeiro poder das modded classes é que **múltiplos mods podem modificar a mesma classe**, e todos se encadeiam automaticamente. O engine processa os mods na ordem de carregamento, e cada `modded class` herda da anterior.

```c
// === Vanilla ===
class ModMe
{
    void Say()
    {
        Print("Original");
    }
}

// === Mod A (loaded first) ===
modded class ModMe
{
    override void Say()
    {
        Print("Mod A");
        super.Say();  // Calls original
    }
}

// === Mod B (loaded second) ===
modded class ModMe
{
    override void Say()
    {
        Print("Mod B");
        super.Say();  // Calls Mod A's version
    }
}

// === At runtime ===
void Test()
{
    ModMe obj = new ModMe();
    obj.Say();
    // Output (reverse load order):
    //   "Mod B"
    //   "Mod A"
    //   "Original"
}
```

É por isso que **sempre chamar `super`** é crítico. Se o Mod A não chamar `super.Say()`, o `Say()` original nunca executa. Se o Mod B não chamar `super.Say()`, o `Say()` do Mod A nunca executa. Um mod pulando o `super` quebra toda a cadeia.

### Representação Visual

```
new ModMe() creates an instance with this inheritance chain:

  ModMe (Mod B's version)      <-- Instantiated
    |
    super -> ModMe (Mod A's version)
               |
               super -> ModMe (Original vanilla)
```

---

## O Que Você Pode Fazer em uma Modded Class

### 1. Sobrescrever Métodos Existentes

O uso mais comum. Adicione comportamento antes ou depois do código vanilla.

```c
modded class PlayerBase
{
    override void Init()
    {
        super.Init();  // Let vanilla initialization happen first
        Print("[MyMod] Player initialized: " + GetType());
    }
}
```

### 2. Adicionar Novos Campos (Variáveis de Membro)

Estenda a classe com novos dados. Toda instância da classe modificada terá esses campos.

```c
modded class PlayerBase
{
    protected int m_KillStreak;
    protected float m_LastKillTime;
    protected ref array<string> m_Achievements;

    override void Init()
    {
        super.Init();
        m_KillStreak = 0;
        m_LastKillTime = 0;
        m_Achievements = new array<string>;
    }
}
```

### 3. Adicionar Novos Métodos

Adicione funcionalidade inteiramente nova que outras partes do seu mod podem chamar.

```c
modded class PlayerBase
{
    protected int m_Reputation;

    override void Init()
    {
        super.Init();
        m_Reputation = 0;
    }

    void AddReputation(int amount)
    {
        m_Reputation += amount;
        if (m_Reputation > 1000)
            Print("[MyMod] " + GetIdentity().GetName() + " is now a legend!");
    }

    int GetReputation()
    {
        return m_Reputation;
    }

    bool IsHeroStatus()
    {
        return m_Reputation >= 500;
    }
}
```

### 4. Acessar Membros Private da Classe Original

Diferente da herança normal onde membros `private` são inacessíveis, **modded classes PODEM acessar membros private** da classe original. Esta é uma regra especial da palavra-chave `modded`.

```c
// Vanilla class
class VanillaClass
{
    private int m_SecretValue;

    private void DoSecretThing()
    {
        Print("Secret!");
    }
}

// Modded class CAN access private members
modded class VanillaClass
{
    void ExposeSecret()
    {
        Print(m_SecretValue);  // OK! Modded classes bypass private
        DoSecretThing();       // OK! Can call private methods too
    }
}
```

Isso é poderoso mas deve ser usado com cuidado. Membros private são private por uma razão --- podem mudar entre atualizações do DayZ.

### 5. Sobrescrever Constantes

Modded classes podem redefinir constantes:

```c
// Vanilla
class GameSettings
{
    const int MAX_PLAYERS = 60;
}

// Modded
modded class GameSettings
{
    const int MAX_PLAYERS = 100;  // Overrides the original value
}
```

---

## Alvos Comuns de Modding

Estas são as classes que virtualmente todo mod de DayZ se conecta. Entender o que cada uma oferece é essencial.

### MissionServer

Roda no servidor dedicado. Gerencia inicialização do servidor, conexões de jogadores e o game loop.

```c
modded class MissionServer
{
    protected ref MyServerManager m_MyManager;

    override void OnInit()
    {
        super.OnInit();

        // Initialize your server-side systems
        m_MyManager = new MyServerManager;
        m_MyManager.Init();
        Print("[MyMod] Server systems initialized");
    }

    override void OnMissionStart()
    {
        super.OnMissionStart();
        Print("[MyMod] Mission started");
    }

    override void OnMissionFinish()
    {
        // Clean up BEFORE super (super may tear down systems we depend on)
        if (m_MyManager)
            m_MyManager.Shutdown();

        super.OnMissionFinish();
    }

    // Called when a player connects
    override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)
    {
        super.InvokeOnConnect(player, identity);

        if (identity)
            Print("[MyMod] Player connected: " + identity.GetName());
    }

    // Called when a player disconnects
    override void InvokeOnDisconnect(PlayerBase player)
    {
        if (player && player.GetIdentity())
            Print("[MyMod] Player disconnected: " + player.GetIdentity().GetName());

        super.InvokeOnDisconnect(player);
    }

    // Called every server tick
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (m_MyManager)
            m_MyManager.Update(timeslice);
    }
}
```

### MissionGameplay

Roda no cliente. Gerencia UI do lado do cliente, input e hooks de renderização.

```c
modded class MissionGameplay
{
    protected ref MyHUDPanel m_MyHUD;

    override void OnInit()
    {
        super.OnInit();

        m_MyHUD = new MyHUDPanel;
        Print("[MyMod] Client HUD initialized");
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (m_MyHUD)
            m_MyHUD.Update(timeslice);
    }

    override void OnKeyPress(int key)
    {
        super.OnKeyPress(key);

        // Open custom menu on F5
        if (key == KeyCode.KC_F5)
        {
            if (m_MyHUD)
                m_MyHUD.Toggle();
        }
    }

    override void OnMissionFinish()
    {
        if (m_MyHUD)
            m_MyHUD.Destroy();

        super.OnMissionFinish();
    }
}
```

### PlayerBase

A classe do jogador. Todo jogador vivo no jogo é uma instância de `PlayerBase` (ou uma subclasse como `SurvivorBase`). Fazer mod desta classe é como você adiciona funcionalidades por jogador.

```c
modded class PlayerBase
{
    protected bool m_IsGodMode;
    protected float m_CustomTimer;

    override void Init()
    {
        super.Init();
        m_IsGodMode = false;
        m_CustomTimer = 0;
    }

    // Called every frame on the server for this player
    override void CommandHandler(float pDt, int pCurrentCommandID, bool pCurrentCommandFinished)
    {
        super.CommandHandler(pDt, pCurrentCommandID, pCurrentCommandFinished);

        // Server-side per-player tick
        if (GetGame().IsServer())
        {
            m_CustomTimer += pDt;
            if (m_CustomTimer >= 60.0)  // Every 60 seconds
            {
                m_CustomTimer = 0;
                OnMinuteElapsed();
            }
        }
    }

    void SetGodMode(bool enabled)
    {
        m_IsGodMode = enabled;
    }

    // Override damage to implement god mode
    override void EEHitBy(TotalDamageResult damageResult, int damageType, EntityAI source,
                          int component, string dmgZone, string ammo,
                          vector modelPos, float speedCoef)
    {
        if (m_IsGodMode)
            return;  // Skip damage entirely

        super.EEHitBy(damageResult, damageType, source, component, dmgZone, ammo, modelPos, speedCoef);
    }

    protected void OnMinuteElapsed()
    {
        // Custom periodic logic
    }
}
```

### ItemBase

A classe base para todos os itens. Fazer mod desta afeta todo item no jogo.

```c
modded class ItemBase
{
    override void SetActions()
    {
        super.SetActions();

        // Add a custom action to ALL items
        AddAction(MyInspectAction);
    }

    override void EEItemLocationChanged(notnull InventoryLocation oldLoc, notnull InventoryLocation newLoc)
    {
        super.EEItemLocationChanged(oldLoc, newLoc);

        // Track when items move
        Print(string.Format("[MyMod] %1 moved from %2 to %3",
            GetType(), oldLoc.GetType(), newLoc.GetType()));
    }
}
```

### DayZGame

A classe global do jogo. Disponível durante todo o ciclo de vida do jogo.

```c
modded class DayZGame
{
    void DayZGame()
    {
        // Constructor: very early initialization
        Print("[MyMod] DayZGame constructor - extremely early init");
    }

    override void OnUpdate(bool doSim, float timeslice)
    {
        super.OnUpdate(doSim, timeslice);

        // Global update tick (both client and server)
    }
}
```

### CarScript

A classe base de veículos. Faça mod para mudar o comportamento de todos os veículos.

```c
modded class CarScript
{
    protected float m_BoostMultiplier;

    override void OnEngineStart()
    {
        super.OnEngineStart();
        m_BoostMultiplier = 1.0;
        Print("[MyMod] Vehicle engine started: " + GetType());
    }

    override void OnEngineStop()
    {
        super.OnEngineStop();
        Print("[MyMod] Vehicle engine stopped: " + GetType());
    }
}
```

---

## Guards `#ifdef` para Dependências Opcionais

Quando seu mod opcionalmente suporta outro mod, use guards de pré-processador. Se o outro mod define um símbolo no seu `config.cpp` (via `CfgPatches`), você pode verificá-lo em tempo de compilação.

### Como Funciona

O nome da classe `CfgPatches` de cada mod se torna um símbolo de pré-processador. Por exemplo, se um mod tem:

```cpp
class CfgPatches
{
    class MyAI_Scripts
    {
        // ...
    };
};
```

Então `#ifdef MyAI_Scripts` será `true` quando esse mod estiver carregado.

Muitos mods também definem símbolos explícitos. A convenção varia --- verifique a documentação do mod ou o `config.cpp`.

### Padrão Básico

```c
modded class PlayerBase
{
    override void Init()
    {
        super.Init();

        // This code ONLY compiles when MyAI is present
        #ifdef MyAI
            MyAIManager mgr = MyAIManager.GetInstance();
            if (mgr)
                mgr.RegisterPlayer(this);
        #endif
    }
}
```

### Guards de Servidor vs Cliente

```c
modded class MissionBase
{
    override void OnInit()
    {
        super.OnInit();

        // Server-only code
        #ifdef SERVER
            InitServerSystems();
        #endif

        // Client-only code (also runs on listen-server host)
        #ifndef SERVER
            InitClientHUD();
        #endif
    }

    #ifdef SERVER
    protected void InitServerSystems()
    {
        Print("[MyMod] Server systems started");
    }
    #endif

    #ifndef SERVER
    protected void InitClientHUD()
    {
        Print("[MyMod] Client HUD started");
    }
    #endif
}
```

### Compatibilidade Multi-Mod

Aqui está um padrão real para um mod que melhora jogadores, com suporte opcional para dois outros mods:

```c
modded class PlayerBase
{
    protected int m_BountyPoints;

    override void Init()
    {
        super.Init();
        m_BountyPoints = 0;
    }

    void AddBounty(int amount)
    {
        m_BountyPoints += amount;

        // If Expansion Notifications is loaded, show a fancy notification
        #ifdef EXPANSIONMODNOTIFICATION
            ExpansionNotification("Bounty!", string.Format("+%1 points", amount)).Create(GetIdentity());
        #else
            // Fallback: simple notification
            NotificationSystem.SendNotificationToPlayerExtended(this, 5, "Bounty",
                string.Format("+%1 points", amount), "");
        #endif

        // If a trader mod is loaded, update the player's balance
        #ifdef TraderPlus
            // TraderPlus-specific API call
        #endif
    }
}
```

---

## Padrões Profissionais de Mods Reais

### Padrão 1: Wrapping Não-Destrutivo de Métodos (Estilo COT)

Community Online Tools envolve métodos fazendo trabalho antes e depois do `super`, nunca substituindo comportamento inteiramente:

```c
modded class MissionServer
{
    // New field added by COT
    protected ref JMPlayerModule m_JMPlayerModule;

    override void OnInit()
    {
        super.OnInit();  // All vanilla init happens

        // COT adds its own initialization AFTER vanilla
        m_JMPlayerModule = new JMPlayerModule;
        m_JMPlayerModule.Init();
    }

    override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)
    {
        // COT does pre-processing
        if (identity)
            m_JMPlayerModule.OnClientConnect(identity);

        // Then lets vanilla (and other mods) handle it
        super.InvokeOnConnect(player, identity);

        // COT does post-processing
        if (identity)
            m_JMPlayerModule.OnClientReady(identity);
    }
}
```

### Padrão 2: Override Condicional (Estilo VPP)

VPP Admin Tools verifica condições antes de decidir se modifica o comportamento:

```c
#ifndef VPPNOTIFICATIONS
modded class MissionGameplay
{
    private ref VPPNotificationUI m_NotificationUI;

    override void OnInit()
    {
        super.OnInit();
        m_NotificationUI = new VPPNotificationUI;
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (m_NotificationUI)
            m_NotificationUI.OnUpdate(timeslice);
    }
}
#endif
```

Note o guard `#ifndef VPPNOTIFICATIONS` --- isso impede o código de compilar se o mod standalone de notificações já estiver carregado, evitando conflitos.

### Padrão 3: Injeção de Eventos (Estilo Expansion)

DayZ Expansion injeta eventos em classes vanilla para transmitir informações para seus próprios sistemas:

```c
modded class PlayerBase
{
    override void EEKilled(Object killer)
    {
        // Fire Expansion's event system before vanilla death handling
        ExpansionEventBus.Fire("OnPlayerKilled", this, killer);

        super.EEKilled(killer);

        // Post-death processing
        ExpansionEventBus.Fire("OnPlayerKilledPost", this, killer);
    }

    override void OnConnect()
    {
        super.OnConnect();
        ExpansionEventBus.Fire("OnPlayerConnect", this);
    }
}
```

### Padrão 4: Registro de Features (Estilo Community Framework)

Mods CF registram features em construtores, mantendo a inicialização centralizada:

```c
modded class DayZGame
{
    void DayZGame()
    {
        // CF registers its systems in the DayZGame constructor
        // This runs extremely early, before any mission loads
        CF_ModuleManager.RegisterModule(MyCFModule);
    }
}

modded class MissionServer
{
    void MissionServer()
    {
        // Constructor: runs when MissionServer is first created
        // Register RPCs here
        GetRPCManager().AddRPC("MyMod", "RPC_HandleRequest", this, SingleplayerExecutionType.Both);
    }
}
```

---

## Regras e Boas Práticas

### Regra 1: SEMPRE Chame `super`

A menos que você tenha um motivo deliberado e bem compreendido para substituir completamente o comportamento do pai, sempre chame `super`. Não fazer isso quebra a cadeia de mods e pode crashar servidores.

```c
// The GOLDEN RULE of modded classes
modded class AnyClass
{
    override void AnyMethod()
    {
        super.AnyMethod();  // ALWAYS unless you intentionally replace
        // Your code here
    }
}
```

Quando você intencionalmente pula o `super`, documente o motivo:

```c
modded class PlayerBase
{
    // Intentionally NOT calling super to completely disable fall damage
    // WARNING: This will also prevent other mods from running their fall damage code
    override void EEHitBy(TotalDamageResult damageResult, int damageType, EntityAI source,
                          int component, string dmgZone, string ammo,
                          vector modelPos, float speedCoef)
    {
        // Check if this is fall damage
        if (ammo == "FallDamage")
            return;  // Silently ignore

        // For all other damage, call the normal chain
        super.EEHitBy(damageResult, damageType, source, component, dmgZone, ammo, modelPos, speedCoef);
    }
}
```

### Regra 2: Inicialize Novos Campos no Override Correto

Ao adicionar campos a uma modded class, inicialize-os no método de ciclo de vida apropriado, não em qualquer lugar:

| Classe | Inicialize em | Por quê |
|--------|--------------|---------|
| `PlayerBase` | `override void Init()` | Chamado uma vez quando a entidade do jogador é criada |
| `ItemBase` | construtor ou `override void InitItemVariables()` | Criação do item |
| `MissionServer` | `override void OnInit()` | Inicialização da mission do servidor |
| `MissionGameplay` | `override void OnInit()` | Inicialização da mission do cliente |
| `DayZGame` | construtor `void DayZGame()` | Ponto mais cedo possível |
| `CarScript` | construtor ou `override void EOnInit(IEntity other, int extra)` | Criação do veículo |

### Regra 3: Proteja Contra Null

Em modded classes, você frequentemente trabalha com objetos que podem não estar inicializados ainda (porque você está executando antes ou depois de outro código):

```c
modded class PlayerBase
{
    override void CommandHandler(float pDt, int pCurrentCommandID, bool pCurrentCommandFinished)
    {
        super.CommandHandler(pDt, pCurrentCommandID, pCurrentCommandFinished);

        // Always check: is this running on the server?
        if (!GetGame().IsServer())
            return;

        // Always check: is the player alive?
        if (!IsAlive())
            return;

        // Always check: does the player have an identity?
        PlayerIdentity identity = GetIdentity();
        if (!identity)
            return;

        // Now it is safe to use identity
        string uid = identity.GetPlainId();
    }
}
```

### Regra 4: Não Quebre Outros Mods

Sua modded class é parte de uma cadeia. Respeite o contrato:

- Não engula eventos silenciosamente (sempre chame `super` a menos que deliberadamente sobrescrevendo)
- Não sobrescreva campos que outros mods possam ter definido (adicione seus próprios campos em vez disso)
- Use guards `#ifdef` para dependências opcionais
- Teste com outros mods populares carregados

### Regra 5: Use Prefixos Descritivos nos Campos

Ao adicionar campos a uma modded class, prefixe-os com o nome do seu mod para evitar colisões com outros mods adicionando campos à mesma classe:

```c
modded class PlayerBase
{
    // BAD: generic name, might collide with another mod
    protected int m_Points;

    // GOOD: mod-specific prefix
    protected int m_MyMod_Points;
    protected float m_MyMod_LastSync;
    protected ref array<string> m_MyMod_Unlocks;
}
```

---

## Erros Comuns

### 1. Não Chamar `super` (O Bug #1 que Quebra Mods)

Isso não pode ser enfatizado o suficiente. Toda vez que você vê um bug report dizendo "Mod X quebrou quando adicionei Mod Y", a primeira coisa a verificar é se alguém esqueceu de chamar `super`.

```c
// THIS BREAKS EVERYTHING DOWNSTREAM
modded class MissionServer
{
    override void OnInit()
    {
        // NO super.OnInit() call!
        // Every mod loaded before this one has its OnInit skipped
        Print("My mod started!");
    }
}
```

### 2. Sobrescrevendo um Método que Não Existe

Se você tenta fazer `override` de um método que não existe na classe pai, recebe um erro de compilação. Isso geralmente acontece quando:
- Você escreveu o nome do método errado
- Você está sobrescrevendo um método da classe errada
- Uma atualização do DayZ renomeou ou removeu o método

```c
modded class PlayerBase
{
    // ERROR: no such method in PlayerBase
    // override void OnPlayerSpawned()

    // CORRECT method name:
    override void OnConnect()
    {
        super.OnConnect();
    }
}
```

### 3. Fazendo Mod da Classe Errada

Um erro comum de iniciante é fazer mod de uma classe que parece certa pelo nome mas está na camada de script errada:

```c
// WRONG: MissionBase is the abstract base -- your hooks here may not fire
// when you expect them to
modded class MissionBase
{
    override void OnInit()
    {
        super.OnInit();
        // This runs for ALL mission types -- but is it what you want?
    }
}

// RIGHT: Choose the specific class for your target
// For server logic:
modded class MissionServer
{
    override void OnInit() { super.OnInit(); /* server code */ }
}

// For client UI:
modded class MissionGameplay
{
    override void OnInit() { super.OnInit(); /* client code */ }
}
```

### 4. Processamento Pesado em Overrides Por Frame

Métodos como `OnUpdate()` e `CommandHandler()` rodam todo tick ou todo frame. Adicionar lógica cara aqui destrói a performance do servidor/cliente:

```c
modded class PlayerBase
{
    // BAD: runs every frame for every player
    override void CommandHandler(float pDt, int pCurrentCommandID, bool pCurrentCommandFinished)
    {
        super.CommandHandler(pDt, pCurrentCommandID, pCurrentCommandFinished);

        // This creates and destroys an array EVERY FRAME for EVERY PLAYER
        array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);
        foreach (Man m : players)
        {
            // O(n^2) per frame!
        }
    }
}

// GOOD: use a timer to throttle expensive operations
modded class PlayerBase
{
    protected float m_MyMod_Timer;

    override void CommandHandler(float pDt, int pCurrentCommandID, bool pCurrentCommandFinished)
    {
        super.CommandHandler(pDt, pCurrentCommandID, pCurrentCommandFinished);

        if (!GetGame().IsServer())
            return;

        m_MyMod_Timer += pDt;
        if (m_MyMod_Timer < 5.0)  // Every 5 seconds, not every frame
            return;

        m_MyMod_Timer = 0;
        DoExpensiveWork();
    }

    protected void DoExpensiveWork()
    {
        // Periodic logic here
    }
}
```

### 5. Esquecendo Guards `#ifdef` para Dependências Opcionais

Se seu mod referencia uma classe de outro mod sem guards `#ifdef`, vai falhar ao compilar quando aquele mod não estiver carregado:

```c
modded class PlayerBase
{
    override void Init()
    {
        super.Init();

        // BAD: compile error if ExpansionMod is not loaded
        // ExpansionHumanity.AddKarma(this, 10);

        // GOOD: guarded with #ifdef
        #ifdef EXPANSIONMODCORE
            ExpansionHumanity.AddKarma(this, 10);
        #endif
    }
}
```

### 6. Destrutores: Limpe Antes do `super`

Ao sobrescrever destrutores ou métodos de limpeza, faça sua limpeza **antes** de chamar `super`, já que `super` pode destruir recursos dos quais você depende:

```c
modded class MissionServer
{
    protected ref MyManager m_MyManager;

    override void OnMissionFinish()
    {
        // Clean up YOUR stuff first
        if (m_MyManager)
        {
            m_MyManager.Save();
            m_MyManager.Shutdown();
        }
        m_MyManager = null;

        // THEN let vanilla and other mods clean up
        super.OnMissionFinish();
    }
}
```

---

## Nomenclatura e Organização de Arquivos

Arquivos de modded class devem seguir uma convenção de nomenclatura clara para que você saiba de relance qual classe está sendo modificada e por qual mod:

```
MyMod/
  Scripts/
    3_Game/
      MyMod/
    4_World/
      MyMod/
        Entities/
          ManBase/
            MyMod_PlayerBase.c         <-- modded class PlayerBase
          ItemBase/
            MyMod_ItemBase.c           <-- modded class ItemBase
          Vehicles/
            MyMod_CarScript.c          <-- modded class CarScript
    5_Mission/
      MyMod/
        Mission/
          MyMod_MissionServer.c        <-- modded class MissionServer
          MyMod_MissionGameplay.c      <-- modded class MissionGameplay
```

Isso espelha a estrutura de arquivos vanilla do DayZ, facilitando encontrar qual arquivo faz mod de qual classe.

---

## Exercícios Práticos

### Exercício 1: Logger de Entrada de Jogadores
Crie uma `modded class MissionServer` que imprime uma mensagem no log do servidor sempre que um jogador conecta ou desconecta, incluindo nome e UID. Certifique-se de chamar `super`.

### Exercício 2: Inspeção de Item
Crie uma `modded class ItemBase` que adiciona um método `string GetInspectInfo()` que retorna uma string formatada mostrando o nome da classe do item, saúde e se está destruído. Sobrescreva um método apropriado para imprimir esta info quando o item é colocado nas mãos do jogador.

### Exercício 3: God Mode de Admin
Crie uma `modded class PlayerBase` que:
1. Adiciona um campo `m_IsGodMode`
2. Adiciona métodos `EnableGodMode()` e `DisableGodMode()`
3. Sobrescreve o método de dano `EEHitBy` para pular dano quando god mode está ativo
4. Sempre chama `super` para dano normal (sem god mode)

### Exercício 4: Logger de Velocidade de Veículos
Crie uma `modded class CarScript` que rastreia a velocidade máxima atingida durante cada sessão do motor. Sobrescreva `OnEngineStart()` e `OnEngineStop()` para iniciar/terminar o rastreamento. Imprima a velocidade máxima quando o motor para.

### Exercício 5: Integração com Mod Opcional
Crie uma `modded class PlayerBase` que adiciona um sistema de reputação. Quando um jogador mata um zumbi, ganha 1 ponto. Use guards `#ifdef` para:
- Se o sistema de notificação do Expansion estiver disponível, mostrar uma notificação
- Se um mod de trader estiver disponível, adicionar moeda
- Se nenhum estiver disponível, fazer fallback para uma mensagem simples com Print()

---

## Resumo

| Conceito | Detalhes |
|----------|----------|
| Sintaxe | `modded class ClassName { }` |
| Efeito | Substitui a classe original globalmente para todas as chamadas `new` |
| Encadeamento | Múltiplos mods podem fazer mod da mesma classe; encadeiam na ordem de carregamento |
| `super` | **Sempre chame** a menos que deliberadamente substituindo comportamento |
| Novos campos | Adicione com prefixos específicos do mod (`m_MyMod_FieldName`) |
| Novos métodos | Totalmente suportados; chamáveis de qualquer lugar que tenha uma referência |
| Acesso private | Modded classes **podem** acessar membros private do original |
| Guards `#ifdef` | Use para dependências opcionais em outros mods |
| Alvos comuns | `MissionServer`, `MissionGameplay`, `PlayerBase`, `ItemBase`, `DayZGame`, `CarScript` |

### Os Três Mandamentos das Modded Classes

1. **Sempre chame `super`** --- a menos que tenha um motivo documentado para não fazer
2. **Proteja dependências opcionais com `#ifdef`** --- seu mod deve funcionar standalone
3. **Prefixe seus campos e métodos** --- evite colisões de nomes com outros mods

---

[Início](../README.md) | [<< Anterior: Classes & Herança](03-classes-inheritance.md) | **Modded Classes** | [Próximo: Fluxo de Controle >>](05-control-flow.md)
