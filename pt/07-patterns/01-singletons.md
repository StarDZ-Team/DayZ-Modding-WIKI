# Chapter 7.1: Singleton Pattern

[Home](../../README.md) | **Singleton Pattern** | [Next: Module Systems >>](02-module-systems.md)

---

## Introdução

O padrão singleton garante que uma classe tenha exatamente uma instância, acessível globalmente. No modding de DayZ ele é o padrão arquitetural mais comum --- virtualmente todo manager, cache, registro e subsistema o utiliza. COT, VPP, Expansion, Dabs Framework e MyMod todos dependem de singletons para coordenar estado entre as camadas de script da engine.

Este capítulo cobre a implementação canônica, gerenciamento de ciclo de vida, quando o padrão é apropriado e onde ele falha.

---

## Sumário

- [A Implementação Canônica](#a-implementação-canônica)
- [Inicialização Lazy vs Eager](#inicialização-lazy-vs-eager)
- [Gerenciamento de Ciclo de Vida](#gerenciamento-de-ciclo-de-vida)
- [Quando Usar Singletons](#quando-usar-singletons)
- [Exemplos do Mundo Real](#exemplos-do-mundo-real)
- [Considerações de Thread Safety](#considerações-de-thread-safety)
- [Anti-Padrões](#anti-padrões)
- [Alternativa: Classes Apenas Estáticas](#alternativa-classes-apenas-estáticas)
- [Checklist](#checklist)

---

## A Implementação Canônica

O singleton padrão do DayZ segue uma fórmula simples: um campo `private static ref`, um acessor estático `GetInstance()` e um `DestroyInstance()` estático para limpeza.

```c
class LootManager
{
    // A única instância. 'ref' mantém viva; 'private' impede manipulação externa.
    private static ref LootManager s_Instance;

    // Dados privados pertencentes ao singleton
    protected ref map<string, int> m_SpawnCounts;

    // Construtor — chamado exatamente uma vez
    void LootManager()
    {
        m_SpawnCounts = new map<string, int>();
    }

    // Destrutor — chamado quando s_Instance é definido como null
    void ~LootManager()
    {
        m_SpawnCounts = null;
    }

    // Acessor lazy: cria na primeira chamada
    static LootManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new LootManager();
        }
        return s_Instance;
    }

    // Teardown explícito
    static void DestroyInstance()
    {
        s_Instance = null;
    }

    // --- API Pública ---

    void RecordSpawn(string className)
    {
        int count = 0;
        m_SpawnCounts.Find(className, count);
        m_SpawnCounts.Set(className, count + 1);
    }

    int GetSpawnCount(string className)
    {
        int count = 0;
        m_SpawnCounts.Find(className, count);
        return count;
    }
};
```

### Por que `private static ref`?

| Palavra-chave | Propósito |
|---------|---------|
| `private` | Impede que outras classes definam `s_Instance` como null ou substituam |
| `static` | Compartilhado em todo o código --- não precisa de instância para acessar |
| `ref` | Referência forte --- mantém o objeto vivo enquanto `s_Instance` for não-null |

Sem `ref`, a instância seria uma referência fraca e poderia ser coletada pelo garbage collector enquanto ainda em uso.

---

## Inicialização Lazy vs Eager

### Inicialização Lazy (Padrão Recomendado)

O método `GetInstance()` cria a instância no primeiro acesso. Esta é a abordagem usada pela maioria dos mods DayZ.

```c
static LootManager GetInstance()
{
    if (!s_Instance)
    {
        s_Instance = new LootManager();
    }
    return s_Instance;
}
```

**Vantagens:**
- Nenhum trabalho feito até ser realmente necessário
- Sem dependência de ordem de inicialização entre mods
- Seguro se o singleton é opcional (algumas configurações de servidor podem nunca chamá-lo)

**Desvantagem:**
- Primeiro chamador paga o custo de construção (geralmente negligível)

### Inicialização Eager

Alguns singletons são criados explicitamente durante o startup da missão, tipicamente de `MissionServer.OnInit()` ou `OnMissionStart()` de um módulo.

```c
// No seu MissionServer.OnInit() modded:
void OnInit()
{
    super.OnInit();
    LootManager.Create();  // Eager: construído agora, não no primeiro uso
}

// Em LootManager:
static void Create()
{
    if (!s_Instance)
    {
        s_Instance = new LootManager();
    }
}
```

**Quando preferir eager:**
- O singleton carrega dados do disco (configs, arquivos JSON) e você quer que erros de carregamento apareçam no startup
- O singleton registra handlers de RPC que devem estar no lugar antes de qualquer cliente conectar
- A ordem de inicialização importa e você precisa controlá-la explicitamente

---

## Gerenciamento de Ciclo de Vida

A fonte mais comum de bugs de singleton no DayZ é falhar em limpar no final da missão. Servidores DayZ podem reiniciar missões sem reiniciar o processo, o que significa que campos estáticos sobrevivem entre reinícios de missão. Se você não anular `s_Instance` em `OnMissionFinish`, carrega referências obsoletas, objetos mortos e callbacks órfãos para a próxima missão.

### O Contrato de Ciclo de Vida

```
Início do Processo do Servidor
  └─ MissionServer.OnInit()
       └─ Criar singletons (eager) ou deixá-los se auto-criar (lazy)
  └─ MissionServer.OnMissionStart()
       └─ Singletons começam operação
  └─ ... servidor roda ...
  └─ MissionServer.OnMissionFinish()
       └─ DestroyInstance() em cada singleton
       └─ Todas as refs estáticas definidas como null
  └─ (Missão pode reiniciar)
       └─ Singletons frescos criados novamente
```

### Padrão de Limpeza

Sempre pareie seu singleton com um método `DestroyInstance()` e chame-o durante o shutdown:

```c
class VehicleRegistry
{
    private static ref VehicleRegistry s_Instance;
    protected ref array<ref VehicleData> m_Vehicles;

    static VehicleRegistry GetInstance()
    {
        if (!s_Instance) s_Instance = new VehicleRegistry();
        return s_Instance;
    }

    static void DestroyInstance()
    {
        s_Instance = null;  // Libera a ref, destrutor roda
    }

    void ~VehicleRegistry()
    {
        if (m_Vehicles) m_Vehicles.Clear();
        m_Vehicles = null;
    }
};

// No seu MissionServer modded:
modded class MissionServer
{
    override void OnMissionFinish()
    {
        VehicleRegistry.DestroyInstance();
        super.OnMissionFinish();
    }
};
```

### Shutdown Centralizado do MyMod

MyFramework consolida toda a limpeza de singletons em `MyFramework.ShutdownAll()`, que é chamado do `MissionServer.OnMissionFinish()` modded. Isso previne o erro comum de esquecer um singleton:

```c
// Padrão conceitual (simplificado do MyFramework):
static void ShutdownAll()
{
    MyRPC.Cleanup();
    MyEventBus.Cleanup();
    MyModuleManager.Cleanup();
    MyConfigManager.DestroyInstance();
    MyPermissions.DestroyInstance();
}
```

---

## Quando Usar Singletons

### Bons Candidatos

| Caso de Uso | Por que Singleton Funciona |
|----------|-------------------|
| **Classes manager** (LootManager, VehicleManager) | Exatamente um coordenador para um domínio |
| **Caches** (cache de CfgVehicles, cache de ícones) | Única fonte da verdade evita computação redundante |
| **Registros** (registro de handlers RPC, registro de módulos) | Lookup central deve ser globalmente acessível |
| **Holders de config** (configurações do servidor, permissões) | Uma config por mod, carregada uma vez do disco |
| **Dispatchers de RPC** | Ponto único de entrada para todos os RPCs recebidos |

### Candidatos Ruins

| Caso de Uso | Por que Não |
|----------|---------|
| **Dados por jogador** | Uma instância por jogador, não uma instância global |
| **Computações temporárias** | Criar, usar, descartar --- sem estado global necessário |
| **Views / dialogs de UI** | Múltiplos podem coexistir; use a pilha de views |
| **Componentes de entidade** | Anexados a objetos individuais, não globais |

---

## Exemplos do Mundo Real

### COT (Community Online Tools)

COT usa um padrão singleton baseado em módulos através do framework CF. Cada ferramenta é um singleton `JMModuleBase` registrado no startup:

```c
// Padrão COT: CF auto-instancia módulos declarados em config.cpp
class JM_COT_ESP : JMModuleBase
{
    // CF gerencia o ciclo de vida do singleton
    // Acesso via: JM_COT_ESP.Cast(GetModuleManager().GetModule(JM_COT_ESP));
}
```

### VPP Admin Tools

VPP usa `GetInstance()` explícito em classes manager:

```c
// Padrão VPP (simplificado)
class VPPATBanManager
{
    private static ref VPPATBanManager m_Instance;

    static VPPATBanManager GetInstance()
    {
        if (!m_Instance)
            m_Instance = new VPPATBanManager();
        return m_Instance;
    }
}
```

---

## Considerações de Thread Safety

Enforce Script é single-threaded. Toda execução de script acontece na thread principal dentro do game loop da engine Enfusion. Isso significa:

- **Não há condições de corrida** entre threads concorrentes
- Você **não** precisa de mutexes, locks ou operações atômicas
- `GetInstance()` com inicialização lazy é sempre seguro

Porém, **re-entrância** ainda pode causar problemas. Se `GetInstance()` disparar código que chama `GetInstance()` novamente durante a construção, você pode obter um singleton parcialmente inicializado:

```c
// PERIGOSO: construção de singleton re-entrante
class BadManager
{
    private static ref BadManager s_Instance;

    void BadManager()
    {
        // Isso chama GetInstance() durante a construção!
        OtherSystem.Register(BadManager.GetInstance());
    }

    static BadManager GetInstance()
    {
        if (!s_Instance)
        {
            // s_Instance ainda é null aqui durante a construção
            s_Instance = new BadManager();
        }
        return s_Instance;
    }
};
```

A correção é atribuir `s_Instance` antes de rodar qualquer inicialização que possa re-entrar:

```c
static BadManager GetInstance()
{
    if (!s_Instance)
    {
        s_Instance = new BadManager();  // Atribuir primeiro
        s_Instance.Initialize();         // Depois rodar inicialização que pode chamar GetInstance()
    }
    return s_Instance;
}
```

Ou melhor ainda, evite inicialização circular inteiramente.

---

## Anti-Padrões

### 1. Estado Mutável Global Sem Encapsulamento

O padrão singleton dá acesso global. Isso não significa que os dados devem ser globalmente graváveis.

```c
// RUIM: Campos públicos convidam mutação descontrolada
class GameState
{
    private static ref GameState s_Instance;
    int PlayerCount;         // Qualquer um pode escrever
    bool ServerLocked;       // Qualquer um pode escrever

    static GameState GetInstance() { ... }
};

// Qualquer código pode fazer:
GameState.GetInstance().PlayerCount = -999;  // Caos
```

```c
// BOM: Acesso controlado através de métodos
class GameState
{
    private static ref GameState s_Instance;
    protected int m_PlayerCount;
    protected bool m_ServerLocked;

    int GetPlayerCount() { return m_PlayerCount; }

    void IncrementPlayerCount()
    {
        m_PlayerCount++;
    }

    static GameState GetInstance() { ... }
};
```

### 2. DestroyInstance Ausente

Se você esquecer a limpeza, o singleton persiste entre reinícios de missão com dados obsoletos.

### 3. Singletons Que Possuem Tudo

Quando um singleton acumula muitas responsabilidades, se torna um "God object" impossível de entender. Divida em singletons focados: `LootManager`, `VehicleManager`, `WeatherManager`, `BanManager`.

### 4. Acessando Singletons em Construtores de Outros Singletons

Isso cria dependências ocultas de ordem de inicialização. Adie registro entre singletons para `OnInit()` ou `OnMissionStart()`, onde a ordem de inicialização é controlada.

---

## Alternativa: Classes Apenas Estáticas

Alguns "singletons" não precisam de instância alguma. Se a classe não mantém estado de instância e só tem métodos estáticos e campos estáticos, pule a cerimônia do `GetInstance()` inteiramente:

```c
// Sem instância necessária — tudo estático
class MyLog
{
    private static FileHandle s_LogFile;
    private static int s_LogLevel;

    static void Info(string tag, string msg)
    {
        WriteLog("INFO", tag, msg);
    }

    static void Error(string tag, string msg)
    {
        WriteLog("ERROR", tag, msg);
    }

    static void Cleanup()
    {
        if (s_LogFile) CloseFile(s_LogFile);
        s_LogFile = null;
    }

    private static void WriteLog(string level, string tag, string msg)
    {
        // ...
    }
};
```

Esta é a abordagem usada por `MyLog`, `MyRPC`, `MyEventBus` e `MyModuleManager` no MyFramework. É mais simples, evita o overhead da verificação null do `GetInstance()` e torna a intenção clara: não há instância, apenas estado compartilhado.

**Use uma classe apenas estática quando:**
- Todos os métodos são stateless ou operam em campos estáticos
- Não há lógica significativa de construtor/destrutor
- Você nunca precisa passar a "instância" como parâmetro

**Use um singleton verdadeiro quando:**
- A classe tem estado de instância que se beneficia de encapsulamento (campos `protected`)
- Você precisa de polimorfismo (uma classe base com métodos sobrescritos)
- O objeto precisa ser passado para outros sistemas por referência

---

## Checklist

Antes de publicar um singleton, verifique:

- [ ] `s_Instance` é declarado `private static ref`
- [ ] `GetInstance()` trata o caso null (init lazy) ou você tem uma chamada `Create()` explícita
- [ ] `DestroyInstance()` existe e define `s_Instance = null`
- [ ] `DestroyInstance()` é chamado de `OnMissionFinish()` ou um método centralizado de shutdown
- [ ] O destrutor limpa coleções pertencentes (`.Clear()`, definir como `null`)
- [ ] Sem campos públicos --- toda mutação passa por métodos
- [ ] O construtor não chama `GetInstance()` em outros singletons (adiar para `OnInit()`)

---

## Compatibilidade & Impacto

- **Multi-Mod:** Múltiplos mods cada um definindo seus próprios singletons coexistem com segurança --- cada um tem seu próprio `s_Instance`. Conflitos só surgem se dois mods definem o mesmo nome de classe, o que o Enforce Script vai indicar como erro de redefinição no carregamento.
- **Ordem de Carregamento:** Singletons lazy não são afetados pela ordem de carregamento de mods. Singletons eager criados em `OnInit()` dependem da ordem da cadeia `modded class`, que segue `requiredAddons` do `config.cpp`.
- **Listen Server:** Campos estáticos são compartilhados entre contextos cliente e servidor no mesmo processo. Um singleton que deveria existir apenas no server-side deve proteger a construção com `GetGame().IsServer()`, ou será acessível (e potencialmente inicializado) pelo código do cliente também.
- **Performance:** Acesso ao singleton é uma verificação estática de null + chamada de método --- overhead desprezível. O custo está no que o singleton *faz*, não em acessá-lo.
- **Migração:** Singletons sobrevivem a atualizações de versão do DayZ desde que as APIs que chamam (ex.: `GetGame()`, `JsonFileLoader`) permaneçam estáveis. Nenhuma migração especial é necessária para o padrão em si.

---

## Erros Comuns

| Erro | Impacto | Correção |
|------|---------|----------|
| Falta de chamada `DestroyInstance()` em `OnMissionFinish` | Dados obsoletos e referências mortas de entidades persistem entre reinícios de missão, causando crashes ou estado fantasma | Sempre chame `DestroyInstance()` de `OnMissionFinish` ou de um `ShutdownAll()` centralizado |
| Chamar `GetInstance()` dentro do construtor de outro singleton | Dispara construção re-entrante; `s_Instance` ainda é null, então uma segunda instância é criada | Adie acesso cross-singleton para um método `Initialize()` chamado após a construção |
| Usar `public static ref` ao invés de `private static ref` | Qualquer código pode definir `s_Instance = null` ou substituí-lo, quebrando a garantia de instância única | Sempre declare `s_Instance` como `private static ref` |
| Não proteger init eager em listen servers | Singleton é construído duas vezes (uma do caminho server, uma do caminho client) se `Create()` não tem verificação de null | Sempre verifique `if (!s_Instance)` dentro de `Create()` |
| Acumular estado sem limites (caches ilimitados) | Memória cresce indefinidamente em servidores de longa duração; eventual OOM ou lag severo | Limite coleções com tamanho máximo ou evicção periódica em `OnUpdate` |

---

## Teoria vs Prática

| Livro-Texto Diz | Realidade do DayZ |
|-----------------|-------------------|
| Singletons são um anti-padrão; use injeção de dependência | Enforce Script não tem container de DI. Singletons são a abordagem padrão para managers globais em todos os mods principais. |
| Inicialização lazy é sempre suficiente | Handlers de RPC devem ser registrados antes de qualquer cliente conectar, então init eager em `OnInit()` é frequentemente necessário. |
| Singletons nunca devem ser destruídos | Missões DayZ reiniciam sem reiniciar o processo do servidor; singletons *devem* ser destruídos e recriados em cada ciclo de missão. |

---

[Início](../../README.md) | **Padrão Singleton** | [Próximo: Sistemas de Módulos >>](02-module-systems.md)
