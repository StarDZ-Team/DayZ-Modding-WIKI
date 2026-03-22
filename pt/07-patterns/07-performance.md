# Chapter 7.7: Performance Optimization

[Home](../../README.md) | [<< Previous: Event-Driven Architecture](06-events.md) | **Performance Optimization**

---

## Introdução

DayZ roda a 10--60 FPS de servidor dependendo da contagem de jogadores, carga de entidades e complexidade de mods. Todo ciclo de script que leva muito tempo come o budget de frame. Um único `OnUpdate` mal escrito que escaneia todo veículo no mapa ou reconstrói uma lista de UI do zero pode derrubar a performance do servidor notavelmente. Mods profissionais ganham sua reputação rodando rápido --- não por ter mais features, mas por implementar as mesmas features com menos desperdício.

Este capítulo cobre os padrões de otimização testados em batalha usados por COT, VPP, Expansion, Dabs Framework e MyMod.

---

## Lazy Loading e Processamento em Batch

A otimização mais impactante em modding DayZ é **não fazer trabalho até que seja necessário** e **espalhar trabalho entre múltiplos frames** quando deve ser feito.

### Lazy Loading

Nunca pré-compute ou pré-carregue dados que o usuário pode não precisar.

### Processamento em Batch (N Itens por Frame)

Quando você deve processar uma grande coleção, processe um batch fixo por frame ao invés da coleção inteira de uma vez:

```c
class LootCleanup : MyServerModule
{
    protected ref array<Object> m_DirtyItems;
    protected int m_ProcessIndex;

    static const int BATCH_SIZE = 50;  // Processar 50 itens por frame

    override void OnUpdate(float dt)
    {
        if (!m_DirtyItems || m_DirtyItems.Count() == 0) return;

        int processed = 0;
        while (m_ProcessIndex < m_DirtyItems.Count() && processed < BATCH_SIZE)
        {
            Object item = m_DirtyItems[m_ProcessIndex];
            if (item)
            {
                ProcessItem(item);
            }
            m_ProcessIndex++;
            processed++;
        }

        // Resetar quando terminar
        if (m_ProcessIndex >= m_DirtyItems.Count())
        {
            m_DirtyItems.Clear();
            m_ProcessIndex = 0;
        }
    }
};
```

---

## Widget Pooling

Criar e destruir widgets de UI é caro. Se você tem uma lista rolável com 500 entradas, criar 500 widgets, destruí-los e criar 500 novos toda vez que a lista atualiza é uma queda de frame garantida.

### O Padrão de Pool

Pré-crie um pool de linhas de widget. Ao atualizar, reutilize linhas existentes. Mostre linhas que têm dados; esconda linhas que não têm.

```c
class WidgetPool
{
    protected ref array<Widget> m_Pool;
    protected Widget m_Parent;
    protected string m_LayoutPath;
    protected int m_ActiveCount;

    // Obter um widget do pool, criando novos se necessário
    Widget Acquire()
    {
        if (m_ActiveCount < m_Pool.Count())
        {
            Widget w = m_Pool[m_ActiveCount];
            w.Show(true);
            m_ActiveCount++;
            return w;
        }

        // Pool esgotado — crescer
        Widget newWidget = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
        m_Pool.Insert(newWidget);
        m_ActiveCount++;
        return newWidget;
    }

    // Esconder todos os widgets ativos (mas não destruí-los)
    void ReleaseAll()
    {
        for (int i = 0; i < m_ActiveCount; i++)
        {
            m_Pool[i].Show(false);
        }
        m_ActiveCount = 0;
    }
};
```

---

## Debouncing de Busca

Quando um usuário digita em uma caixa de busca, o evento `OnChange` dispara em cada tecla. Reconstruir uma lista filtrada em cada tecla é desperdício --- o usuário ainda está digitando. Ao invés, atrase a busca até o usuário pausar.

### O Padrão de Debounce

```c
class SearchableList
{
    protected const float DEBOUNCE_DELAY = 0.15;  // 150ms
    protected float m_SearchTimer;
    protected bool m_SearchPending;
    protected string m_PendingQuery;

    // Chamado em cada tecla
    void OnSearchTextChanged(string text)
    {
        m_PendingQuery = text;
        m_SearchPending = true;
        m_SearchTimer = 0;  // Resetar o timer em cada tecla
    }

    // Chamado todo frame de OnUpdate
    void Tick(float dt)
    {
        if (!m_SearchPending) return;

        m_SearchTimer += dt;
        if (m_SearchTimer >= DEBOUNCE_DELAY)
        {
            m_SearchPending = false;
            ExecuteSearch(m_PendingQuery);
        }
    }
};
```

---

## Limitação de Taxa de Atualização

Nem tudo precisa rodar todo frame. Muitos sistemas podem atualizar em uma frequência menor sem impacto perceptível.

### Throttling Baseado em Timer

```c
class EntityScanner : MyServerModule
{
    protected const float SCAN_INTERVAL = 5.0;  // A cada 5 segundos
    protected float m_ScanTimer;

    override void OnUpdate(float dt)
    {
        m_ScanTimer += dt;
        if (m_ScanTimer < SCAN_INTERVAL) return;
        m_ScanTimer = 0;

        // Scan caro roda a cada 5 segundos, não todo frame
        ScanEntities();
    }
};
```

### Processamento Escalonado

Quando múltiplos sistemas precisam de atualizações periódicas, escalone seus timers para que não disparem todos no mesmo frame:

```c
// BOM: Escalonado — trabalho é distribuído
m_LootTimer    = 5.0;
m_VehicleTimer = 5.0 + 1.6;  // Dispara ~1.6s após loot
m_WeatherTimer = 5.0 + 3.3;  // Dispara ~3.3s após loot
```

---

## Caching

Lookups repetidos dos mesmos dados são um dreno comum de performance. Cache os resultados.

### Cache de Scan CfgVehicles

Escanear `CfgVehicles` é caro. Envolve iterar milhares de entradas de config. Nunca faça mais de uma vez:

```c
class WeaponRegistry
{
    private static ref array<string> s_AllWeapons;

    // Construir uma vez, usar para sempre
    static array<string> GetAllWeapons()
    {
        if (s_AllWeapons) return s_AllWeapons;

        s_AllWeapons = new array<string>();

        int cfgCount = GetGame().ConfigGetChildrenCount("CfgVehicles");
        string className;
        for (int i = 0; i < cfgCount; i++)
        {
            GetGame().ConfigGetChildName("CfgVehicles", i, className);
            if (GetGame().IsKindOf(className, "Weapon_Base"))
            {
                s_AllWeapons.Insert(className);
            }
        }

        return s_AllWeapons;
    }

    static void Cleanup()
    {
        s_AllWeapons = null;
    }
};
```

---

## Padrão de Registro de Veículos

Uma necessidade comum é rastrear todos os veículos no mapa. A abordagem ingênua é chamar `GetGame().GetObjectsAtPosition3D()` com um raio enorme. Isso é catastroficamente caro.

### Bom: Registro Baseado em Registro

Rastreie entidades conforme são criadas e destruídas:

```c
class VehicleRegistry
{
    private static ref array<CarScript> s_Vehicles = new array<CarScript>();

    static void Register(CarScript vehicle)
    {
        if (vehicle && s_Vehicles.Find(vehicle) == -1)
        {
            s_Vehicles.Insert(vehicle);
        }
    }

    static void Unregister(CarScript vehicle)
    {
        int idx = s_Vehicles.Find(vehicle);
        if (idx >= 0) s_Vehicles.Remove(idx);
    }

    static array<CarScript> GetAll()
    {
        return s_Vehicles;
    }
};

// Hook na construção/destruição do veículo:
modded class CarScript
{
    override void EEInit()
    {
        super.EEInit();
        if (GetGame().IsServer())
        {
            VehicleRegistry.Register(this);
        }
    }

    override void EEDelete(EntityAI parent)
    {
        if (GetGame().IsServer())
        {
            VehicleRegistry.Unregister(this);
        }
        super.EEDelete(parent);
    }
};
```

Agora `VehicleRegistry.GetAll()` retorna todos os veículos instantaneamente --- sem scan do mundo necessário.

---

## Coisas a Evitar

### 1. `GetObjectsAtPosition3D` com Raio Enorme

Isso escaneia todo objeto físico no mundo dentro do raio dado. NUNCA faça isso em código por frame.

### 2. Reconstrução Completa de Lista em Cada Tecla

Use [debouncing de busca](#debouncing-de-busca) e [widget pooling](#widget-pooling).

### 3. Alocações de String por Frame

Concatenação de string cria novos objetos string. Em uma função por frame, gera lixo todo frame.

### 4. Verificações Redundantes de FileExist em Loops

Verifique uma vez, cache o resultado.

### 5. Chamar GetGame() Repetidamente

Em loops apertados, cache o resultado.

### 6. Spawnar Entidades em Loop Apertado

Spawn de entidades é caro. Use processamento em batch: spawne 5 por frame ao longo de 20 frames.

---

## Profiling

### Monitoramento de FPS do Servidor

A métrica mais básica é FPS do servidor. Se seu mod derruba FPS do servidor, algo está errado:

```c
void OnUpdate(float dt)
{
    float startTime = GetGame().GetTickTime();

    // ... sua lógica ...

    float elapsed = GetGame().GetTickTime() - startTime;
    if (elapsed > 0.005)  // Mais que 5ms
    {
        MyLog.Warning("Perf", "OnUpdate took " + elapsed.ToString() + "s");
    }
}
```

---

## Checklist

Antes de publicar código sensível a performance, verifique:

- [ ] Sem chamadas `GetObjectsAtPosition3D` com raio > 100m em código por frame
- [ ] Todos os scans caros (CfgVehicles, buscas de entidade) estão em cache
- [ ] Listas de UI usam widget pooling, não destroy/recreate
- [ ] Inputs de busca usam debouncing (150ms+)
- [ ] Operações de OnUpdate são throttled por timer ou tamanho de batch
- [ ] Grandes coleções são processadas em batches (50 itens/frame padrão)
- [ ] Spawn de entidades é feito em batch entre frames, não em loop apertado
- [ ] Concatenação de string não é feita por frame em loops apertados
- [ ] Operações de sort rodam na mudança de dados, não por frame
- [ ] Múltiplos sistemas periódicos têm timers escalonados
- [ ] Rastreamento de entidades usa registro, não scan do mundo

---

## Compatibilidade & Impacto

- **Multi-Mod:** Custos de performance são cumulativos. O `OnUpdate` de cada mod roda todo frame. Cinco mods cada um levando 2ms significa 10ms por frame só de scripts. Coordene com outros autores de mods para escalonar timers e evitar scans duplicados do mundo.
- **Ordem de Carregamento:** Ordem de carregamento não afeta performance diretamente. Porém, se múltiplos mods fazem `modded class` na mesma entidade (ex.: `CarScript.EEInit`), cada override adiciona ao custo da cadeia de chamadas. Mantenha overrides modded mínimos.
- **Listen Server:** Listen servers rodam scripts de cliente e servidor no mesmo processo. Widget pooling, atualizações de UI e custos de renderização se acumulam com ticks server-side. Budgets de performance são mais apertados em listen servers que em servidores dedicados.
- **Performance:** O budget de frame do servidor DayZ a 60 FPS é ~16ms. A 20 FPS (comum em servidores carregados), é ~50ms. Um único mod deve mirar em ficar abaixo de 2ms por frame. Faça profiling com `GetGame().GetTickTime()` para verificar.
- **Migração:** Padrões de performance são agnósticos de engine e sobrevivem a atualizações de versão do DayZ. Custos de APIs específicas (ex.: `GetObjectsAtPosition3D`) podem mudar entre versões da engine, então refaça profiling após atualizações maiores do DayZ.

---

## Erros Comuns

| Erro | Impacto | Correção |
|------|---------|----------|
| Otimização prematura (micro-otimizar código que roda uma vez no startup) | Tempo de desenvolvimento desperdiçado; sem melhoria mensurável; código mais difícil de ler | Faça profiling primeiro. Só otimize código que roda por frame ou processa grandes coleções. Custo de startup é pago uma vez. |
| Usar `GetObjectsAtPosition3D` com raio do mapa inteiro em `OnUpdate` | Travamento de 50--200ms por chamada, escaneando todo objeto físico no mapa; FPS do servidor cai para dígitos únicos | Use um registro baseado em registro (registre em `EEInit`, desregistre em `EEDelete`). Nunca faça scan do mundo por frame. |
| Reconstruir árvores de widget de UI em toda mudança de dados | Picos de frame pela criação/destruição de widgets; travamento visível para o jogador | Use widget pooling: esconda/mostre widgets existentes ao invés de destruir e recriar |
| Ordenar arrays grandes todo frame | O(n log n) por frame para dados que raramente mudam; desperdício desnecessário de CPU | Ordene uma vez quando dados mudam (flag dirty), cache o resultado ordenado, reordene apenas na mutação |
| Rodar I/O de arquivo caro (JsonSaveFile) todo tick de `OnUpdate` | Escritas em disco bloqueiam a thread principal; 5--20ms por save dependendo do tamanho do arquivo | Use timers de auto-save (300s padrão) com flag dirty. Só escreva quando dados realmente mudaram. |

---

## Teoria vs Prática

| Livro-Texto Diz | Realidade do DayZ |
|-----------------|-------------------|
| Use processamento async para operações caras | Enforce Script é single-threaded sem primitivas async; distribua trabalho entre frames usando processamento baseado em índice ao invés |
| Pooling de objetos é otimização prematura | Criação de widgets é genuinamente cara no Enfusion; pooling é prática padrão em todo mod principal (COT, VPP, Expansion) |
| Faça profiling antes de otimizar | Correto, mas alguns padrões (scans do mundo, alocação de string por frame, reconstruções por tecla) são *sempre* errados no DayZ. Evite-os desde o início. |

---

[<< Anterior: Arquitetura Orientada a Eventos](06-events.md) | [Início](../../README.md)
