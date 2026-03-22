# Chapter 6.10: Central Economy

[Home](../README.md) | [<< Previous: Networking & RPC](09-networking.md) | **Central Economy** | [Next: Mission Hooks >>](11-mission-hooks.md)

---

## Introdução

A Central Economy (CE) é o sistema server-side do DayZ para gerenciar todas as entidades que podem spawnar no mundo: loot, veículos, infectados, animais e eventos dinâmicos. Ela é configurada inteiramente através de arquivos XML na pasta da missão. Embora a CE em si seja um sistema da engine (não diretamente scriptável), entender seus arquivos de configuração é essencial para qualquer mod de servidor. Este capítulo cobre todos os arquivos de configuração da CE, sua estrutura, parâmetros-chave e como eles interagem.

---

## Como a CE Funciona

1. O servidor lê `types.xml` para aprender o **nominal** (contagem alvo) e **min** (mínimo antes de restock) de cada item.
2. Itens recebem **flags de usage** (ex: `Military`, `Town`) que mapeiam para tipos de construção/localização.
3. Itens recebem **flags de value** (ex: `Tier1` até `Tier4`) que os restringem a zonas do mapa.
4. A CE periodicamente escaneia o mundo, conta itens existentes e spawna novos quando as contagens caem abaixo do `min`.
5. Itens não tocados pelo tempo de `lifetime` (segundos) são limpos.
6. Eventos dinâmicos (`events.xml`) spawnam veículos, quedas de helicóptero e grupos de infectados em sua própria programação.

---

## Visão Geral dos Arquivos

Todos os arquivos da CE ficam na pasta da missão (ex: `dayzOffline.chernarusplus/`).

| Arquivo | Propósito |
|------|---------|
| `db/types.xml` | Parâmetros de cada item spawnável |
| `db/events.xml` | Definições de eventos dinâmicos (veículos, quedas, infectados) |
| `db/globals.xml` | Parâmetros globais da CE (timers, limites) |
| `db/economy.xml` | Chaves de alternância de subsistemas |
| `cfgeconomycore.xml` | Classes raiz, padrões, logging da CE |
| `cfgspawnabletypes.xml` | Regras de attachment e cargo por item |
| `cfgrandompresets.xml` | Pools de preset de loot aleatório |
| `cfgeventspawns.xml` | Coordenadas do mundo para posições de spawn de eventos |
| `cfglimitsdefinition.xml` | Todos os nomes válidos de flags de categoria, usage e value |
| `cfgplayerspawnpoints.xml` | Localizações de spawn de novos jogadores |

---

## types.xml

```mermaid
flowchart TD
    A[CE Startup] --> B[Load types.xml]
    B --> C[For each item type]
    C --> D{Current count < nominal?}
    D -->|Yes| E{Restock timer elapsed?}
    E -->|Yes| F[Spawn item at valid position]
    E -->|No| G[Wait for restock interval]
    D -->|No| H{Current count > nominal?}
    H -->|Yes| I[Mark excess for cleanup]
    H -->|No| J[Item count balanced]
    F --> K{Lifetime expired?}
    K -->|Yes| L[Delete item]
    K -->|No| M[Item persists]
    L --> C
```

O arquivo mais crítico da CE. Todo item que pode existir no mundo deve ter uma entrada aqui.

### Estrutura

```xml
<types>
    <type name="AKM">
        <nominal>10</nominal>
        <lifetime>14400</lifetime>
        <restock>0</restock>
        <min>5</min>
        <quantmin>-1</quantmin>
        <quantmax>-1</quantmax>
        <cost>100</cost>
        <flags count_in_cargo="0" count_in_hoarder="0"
               count_in_map="1" count_in_player="0" crafted="0" deloot="0"/>
        <category name="weapons"/>
        <usage name="Military"/>
        <value name="Tier3"/>
        <value name="Tier4"/>
    </type>
</types>
```

### Parâmetros

| Parâmetro | Descrição | Valores Típicos |
|-----------|-------------|----------------|
| `nominal` | Contagem alvo em todo o mapa | 1 - 200 |
| `lifetime` | Segundos antes de itens não tocados desaparecerem | 3600 (1h) - 14400 (4h) |
| `restock` | Segundos antes da CE tentar respawnar após item ser pego | 0 (imediato) - 1800 |
| `min` | Contagem mínima antes da CE spawnar mais | Geralmente `nominal / 2` |
| `quantmin` | Quantidade mínima % (munição, líquidos); -1 = não aplicável | -1, 0 - 100 |
| `quantmax` | Quantidade máxima %; -1 = não aplicável | -1, 0 - 100 |
| `cost` | Custo de prioridade (sempre 100 no vanilla) | 100 |

### Flags

| Flag | Descrição |
|------|-------------|
| `count_in_cargo` | Contar itens dentro de cargo de jogador/container para o nominal |
| `count_in_hoarder` | Contar itens em armazenamento (tendas, barris, esconderijos enterrados) |
| `count_in_map` | Contar itens no chão e em construções |
| `count_in_player` | Contar itens em personagens de jogadores |
| `crafted` | Item é craftável (CE não o spawna naturalmente) |
| `deloot` | Loot de evento dinâmico (spawnado por eventos, não pela CE) |

### Category, Usage e Value

- **category**: Categoria do item (ex: `weapons`, `tools`, `food`, `clothes`, `containers`)
- **usage**: Onde o item spawna (ex: `Military`, `Police`, `Town`, `Village`, `Farm`, `Hunting`, `Coast`)
- **value**: Restrição de tier do mapa (ex: `Tier1` = costa, `Tier2` = interior, `Tier3` = militar, `Tier4` = interior profundo)

Um item pode ter múltiplas tags `<usage>` e `<value>` para spawnar em múltiplas localizações e tiers.

**Exemplo --- adicionar um item personalizado à economia:**

```xml
<type name="MyCustomRifle">
    <nominal>5</nominal>
    <lifetime>14400</lifetime>
    <restock>1800</restock>
    <min>2</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0"
           count_in_map="1" count_in_player="0" crafted="0" deloot="0"/>
    <category name="weapons"/>
    <usage name="Military"/>
    <value name="Tier3"/>
    <value name="Tier4"/>
</type>
```

---

## globals.xml

Parâmetros globais da CE que afetam todos os itens.

```xml
<variables>
    <var name="AnimalMaxCount" type="0" value="200"/>
    <var name="CleanupLifetimeDeadPlayer" type="0" value="3600"/>
    <var name="CleanupLifetimeDeadInfected" type="0" value="330"/>
    <var name="InitialSpawn" type="0" value="1200"/>
    <var name="LootDamageMax" type="0" value="2"/>
    <var name="LootDamageMin" type="0" value="0"/>
    <var name="RespawnAttempt" type="0" value="2"/>
    <var name="FlagRefreshFrequency" type="0" value="432000"/>
    <var name="TimeLogin" type="0" value="15"/>
    <var name="TimeLogout" type="0" value="15"/>
    <var name="ZombieMaxCount" type="0" value="1000"/>
</variables>
```

### Parâmetros-Chave

| Variável | Descrição |
|----------|-------------|
| `AnimalMaxCount` | Máximo de animais vivos simultaneamente |
| `ZombieMaxCount` | Máximo de infectados vivos simultaneamente |
| `CleanupLifetimeDeadPlayer` | Segundos antes do corpo de jogador morto desaparecer |
| `CleanupLifetimeDeadInfected` | Segundos antes do zumbi morto desaparecer |
| `InitialSpawn` | Número de itens para spawnar ao iniciar o servidor |
| `LootDamageMin` / `LootDamageMax` | Range de dano aplicado ao loot spawnado (0-4: Prístino a Arruinado) |
| `RespawnAttempt` | Segundos entre verificações de respawn |
| `FlagRefreshFrequency` | Intervalo de refresh da flag de território (segundos) |
| `TimeLogin` / `TimeLogout` | Timer de login/logout (segundos) |

---

## events.xml

Define eventos dinâmicos: zonas de spawn de infectados, spawns de veículos, quedas de helicóptero e outros eventos do mundo.

### Estrutura

```xml
<events>
    <event name="StaticHeliCrash">
        <nominal>3</nominal>
        <min>1</min>
        <max>3</max>
        <lifetime>1800</lifetime>
        <restock>0</restock>
        <saferadius>500</saferadius>
        <distanceradius>500</distanceradius>
        <cleanupradius>200</cleanupradius>
        <flags deletable="1" init_random="0" remove_damaged="1"/>
        <position>fixed</position>
        <limit>child</limit>
        <active>1</active>
        <children>
            <child lootmax="10" lootmin="5" max="3" min="1"
                   type="Wreck_Mi8_Crashed"/>
        </children>
    </event>
</events>
```

### Parâmetros do Evento

| Parâmetro | Descrição |
|-----------|-------------|
| `nominal` | Número alvo de eventos ativos |
| `min` / `max` | Mínimo e máximo ativos ao mesmo tempo |
| `lifetime` | Segundos antes do evento desaparecer |
| `saferadius` | Distância mínima de jogadores ao spawnar |
| `distanceradius` | Distância mínima entre instâncias do evento |
| `cleanupradius` | Raio para verificações de limpeza |
| `position` | `"fixed"` (de cfgeventspawns.xml) ou `"player"` (perto de jogadores) |
| `active` | `1` = habilitado, `0` = desabilitado |

---

## cfgspawnabletypes.xml

Define quais attachments e cargo spawnam com itens específicos.

```xml
<spawnabletypes>
    <type name="AKM">
        <attachments chance="0.3">
            <item name="AK_WoodBttstck" chance="0.5"/>
            <item name="AK_PlasticBttstck" chance="0.3"/>
            <item name="AK_FoldingBttstck" chance="0.2"/>
        </attachments>
        <attachments chance="0.2">
            <item name="AK_WoodHndgrd" chance="0.6"/>
            <item name="AK_PlasticHndgrd" chance="0.4"/>
        </attachments>
        <cargo chance="0.15">
            <item name="Mag_AKM_30Rnd" chance="0.7"/>
            <item name="Mag_AKM_Drum75Rnd" chance="0.3"/>
        </cargo>
    </type>
</spawnabletypes>
```

### Como Funciona

- Cada bloco `<attachments>` tem uma `chance` (0.0 - 1.0) de ser aplicado.
- Dentro de um bloco, itens são selecionados por seus valores individuais de `chance` (normalizados para 100% dentro do bloco).
- Múltiplos blocos `<attachments>` permitem que diferentes slots de attachment sejam sorteados independentemente.
- Blocos `<cargo>` funcionam da mesma forma para itens colocados no cargo da entidade.

---

## Flags ECE em Script

Ao spawnar entidades por script, as flags ECE (cobertas no [Capítulo 6.1](01-entity-system.md)) determinam como a entidade interage com a CE:

| Flag | Comportamento da CE |
|------|-------------|
| `ECE_NOLIFETIME` | Entidade nunca vai desaparecer (não rastreada pelo lifetime da CE) |
| `ECE_DYNAMIC_PERSISTENCY` | Entidade se torna persistente apenas após interação do jogador |
| `ECE_EQUIP_ATTACHMENTS` | CE spawna attachments configurados de `cfgspawnabletypes.xml` |
| `ECE_EQUIP_CARGO` | CE spawna cargo configurado de `cfgspawnabletypes.xml` |

**Exemplo --- spawnar um item que persiste para sempre:**

```c
int flags = ECE_PLACE_ON_SURFACE | ECE_NOLIFETIME;
Object obj = GetGame().CreateObjectEx("Barrel_Green", pos, flags);
```

**Exemplo --- spawnar com attachments configurados pela CE:**

```c
int flags = ECE_PLACE_ON_SURFACE | ECE_EQUIP_ATTACHMENTS | ECE_EQUIP_CARGO;
Object obj = GetGame().CreateObjectEx("AKM", pos, flags);
// A AKM vai spawnar com attachments aleatórios conforme cfgspawnabletypes.xml
```

---

## Modding da Central Economy

### Adicionando Itens Personalizados

1. Definir a classe do item no `config.cpp` do seu mod em `CfgVehicles`.
2. Adicionar uma entrada `<type>` no `types.xml` com nominal, lifetime, flags de usage e value.
3. Opcionalmente adicionar regras de attachment/cargo em `cfgspawnabletypes.xml`.
4. Se usar novas flags de usage/value, defini-las em `cfglimitsdefinition.xml`.

### Modificando Itens Existentes

Edite a entrada `<type>` no `types.xml` para mudar taxas de spawn, lifetimes ou restrições de localização. Mudanças entram em efeito ao reiniciar o servidor.

### Desabilitando Itens

Defina `nominal` e `min` como `0`:

```xml
<type name="UnwantedItem">
    <nominal>0</nominal>
    <min>0</min>
    <!-- resto dos parâmetros -->
</type>
```

---

## Resumo

| Arquivo | Propósito | Parâmetros-Chave |
|------|---------|----------------|
| `types.xml` | Definições de spawn de itens | `nominal`, `min`, `lifetime`, `usage`, `value` |
| `globals.xml` | Variáveis globais da CE | `ZombieMaxCount`, `AnimalMaxCount`, timers de cleanup |
| `events.xml` | Eventos dinâmicos | `nominal`, `lifetime`, `position`, `children` |
| `cfgspawnabletypes.xml` | Regras de attachment/cargo por item | `attachments`, `cargo`, `chance` |
| `cfgrandompresets.xml` | Pools de loot reutilizáveis | presets de `cargo`/`attachments` |
| `cfgeconomycore.xml` | Configuração raiz da CE | `classes`, `defaults`, pasta da CE |
| `cfglimitsdefinition.xml` | Definições de flags válidas | `categories`, `usageflags`, `valueflags` |

| Conceito | Ponto-chave |
|---------|-----------|
| Nominal/Min | CE spawna itens quando contagem cai abaixo de `min`, visando `nominal` |
| Lifetime | Segundos antes de itens não tocados desaparecerem |
| Flags de usage | Onde itens spawnam (Military, Town, etc.) |
| Flags de value | Restrição de tier do mapa (Tier1 = costa até Tier4 = interior profundo) |
| Flags de contagem | Quais itens contam para o nominal (cargo, hoarder, map, player) |
| Eventos | Spawns dinâmicos com seu próprio ciclo de vida (quedas, veículos, infectados) |
| Flags ECE | `ECE_NOLIFETIME`, `ECE_EQUIP` para itens spawnados por script |

---

[<< Anterior: Networking & RPC](09-networking.md) | **Central Economy** | [Início](../README.md)
