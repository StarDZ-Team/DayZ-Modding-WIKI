# Chapter 9.6: Spawn de Jogadores

[Inicio](../README.md) | [<< Anterior: Spawn de Veiculos](05-vehicle-spawning.md) | [Proximo: Persistencia >>](07-persistence.md)

---

> **Resumo:** Locais de spawn de jogadores sao controlados por **cfgplayerspawnpoints.xml** (bolhas de posicao) e **init.c** (equipamento inicial). Este capitulo cobre ambos os arquivos com valores reais do vanilla de Chernarus.

---

## Sumario

- [Visao Geral do cfgplayerspawnpoints.xml](#visao-geral-do-cfgplayerspawnpointsxml)
- [Parametros de Spawn](#parametros-de-spawn)
- [Parametros do Gerador](#parametros-do-gerador)
- [Parametros de Grupo](#parametros-de-grupo)
- [Bolhas de Spawn para Novos Jogadores](#bolhas-de-spawn-para-novos-jogadores)
- [Spawns de Hop](#spawns-de-hop)
- [init.c -- Equipamento Inicial](#initc----equipamento-inicial)
- [Adicionando Pontos de Spawn Customizados](#adicionando-pontos-de-spawn-customizados)
- [Erros Comuns](#erros-comuns)

---

## Visao Geral do cfgplayerspawnpoints.xml

Este arquivo fica na sua pasta de missao (ex.: `dayzOffline.chernarusplus/cfgplayerspawnpoints.xml`). Ele tem duas secoes, cada uma com seus proprios parametros e bolhas de posicao:

- **`<fresh>`** -- personagens novos (primeira vida ou apos morte)
- **`<hop>`** -- server hoppers (jogador tinha um personagem em outro servidor)

---

## Parametros de Spawn

Valores vanilla de spawn para novos jogadores:

```xml
<spawn_params>
    <min_dist_infected>30</min_dist_infected>
    <max_dist_infected>70</max_dist_infected>
    <min_dist_player>65</min_dist_player>
    <max_dist_player>150</max_dist_player>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
</spawn_params>
```

| Parametro | Valor | Significado |
|-----------|-------|---------|
| `min_dist_infected` | 30 | O jogador deve spawnar a pelo menos 30m do infectado mais proximo |
| `max_dist_infected` | 70 | Se nenhuma posicao a 30m+ existir, aceitar ate 70m como faixa de fallback |
| `min_dist_player` | 65 | O jogador deve spawnar a pelo menos 65m de qualquer outro jogador |
| `max_dist_player` | 150 | Faixa de fallback -- aceitar posicoes ate 150m de outros jogadores |
| `min_dist_static` | 0 | Distancia minima de objetos estaticos (construcoes, muros) |
| `max_dist_static` | 2 | Distancia maxima de objetos estaticos -- mantem jogadores perto de estruturas |

O engine tenta `min_dist_*` primeiro; se nenhuma posicao valida existir, ele relaxa em direcao a `max_dist_*`.

---

## Parametros do Gerador

O gerador cria uma grade de posicoes candidatas ao redor de cada bolha:

```xml
<generator_params>
    <grid_density>4</grid_density>
    <grid_width>200</grid_width>
    <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>
    <max_steepness>45</max_steepness>
</generator_params>
```

| Parametro | Valor | Significado |
|-----------|-------|---------|
| `grid_density` | 4 | Espacamento entre pontos da grade em metros -- menor = mais candidatos, maior custo de CPU |
| `grid_width` | 200 | A grade se estende 200m no eixo X ao redor do centro de cada bolha |
| `grid_height` | 200 | A grade se estende 200m no eixo Z ao redor do centro de cada bolha |
| `min_steepness` / `max_steepness` | -45 / 45 | Faixa de inclinacao do terreno em graus -- rejeita faces de penhasco e encostas ingremes |

Cada bolha recebe uma grade de 200x200m com um ponto a cada 4m (~2.500 candidatos). O engine filtra por inclinacao e distancia estatica, depois aplica `spawn_params` no momento do spawn.

#### Parametro `allow_in_water` (1.28+)

A partir do DayZ 1.28, um novo parametro booleano `allow_in_water` foi adicionado ao `generator_params` (padrao: `false`). Quando definido como `true`, o gerador de pontos de spawn considerara posicoes na agua como pontos de spawn validos:

```xml
<generator_params>
    <grid_density>4</grid_density>
    <grid_width>200</grid_width>
    <grid_height>200</grid_height>
    <min_dist_static>0</min_dist_static>
    <max_dist_static>2</max_dist_static>
    <min_steepness>-45</min_steepness>
    <max_steepness>45</max_steepness>
    <allow_in_water>false</allow_in_water>
</generator_params>
```

Por padrao, o engine rejeita qualquer posicao candidata que caia na agua (lagos, rios, oceano). Definir `allow_in_water` como `true` remove esse filtro. Isso e util principalmente para mapas customizados com spawns em ilhas ou cenarios onde spawns costeiros na agua sao intencionais. Para a maioria dos servidores, deixe como `false` para evitar jogadores spawnando em lagos ou no oceano.

---

## Parametros de Grupo

```xml
<group_params>
    <enablegroups>true</enablegroups>
    <groups_as_regular>true</groups_as_regular>
    <lifetime>240</lifetime>
    <counter>-1</counter>
</group_params>
```

| Parametro | Valor | Significado |
|-----------|-------|---------|
| `enablegroups` | true | Bolhas de posicao sao organizadas em grupos nomeados |
| `groups_as_regular` | true | Grupos sao tratados como pontos de spawn regulares (qualquer grupo pode ser selecionado) |
| `lifetime` | 240 | Segundos antes de um ponto de spawn usado ficar disponivel novamente |
| `counter` | -1 | Numero de vezes que um ponto de spawn pode ser usado. -1 = ilimitado |

Uma posicao usada fica bloqueada por 240 segundos, prevenindo dois jogadores de spawnarem um em cima do outro.

---

## Bolhas de Spawn para Novos Jogadores

O Chernarus vanilla define 11 grupos ao longo da costa para spawns de novos jogadores. Cada grupo agrupa 3-8 posicoes ao redor de uma cidade:

| Grupo | Posicoes | Area |
|-------|-----------|------|
| WestCherno | 4 | Lado oeste de Chernogorsk |
| EastCherno | 4 | Lado leste de Chernogorsk |
| WestElektro | 5 | Elektrozavodsk oeste |
| EastElektro | 4 | Elektrozavodsk leste |
| Kamyshovo | 5 | Litoral de Kamyshovo |
| Solnechny | 5 | Area da fabrica de Solnechniy |
| Orlovets | 4 | Entre Solnechniy e Nizhnoye |
| Nizhnee | 4 | Costa de Nizhnoye |
| SouthBerezino | 3 | Berezino sul |
| NorthBerezino | 8 | Berezino norte + costa estendida |
| Svetlojarsk | 3 | Porto de Svetlojarsk |

### Exemplos Reais de Grupo

```xml
<generator_posbubbles>
    <group name="WestCherno">
        <pos x="6063.018555" z="1931.907227" />
        <pos x="5933.964844" z="2171.072998" />
        <pos x="6199.782715" z="2241.805176" />
        <pos x="13552.5654" z="5955.893066" />
    </group>
    <group name="WestElektro">
        <pos x="8747.670898" z="2357.187012" />
        <pos x="9363.6533" z="2017.953613" />
        <pos x="9488.868164" z="1898.900269" />
        <pos x="9675.2216" z="1817.324585" />
        <pos x="9821.274414" z="2194.003662" />
    </group>
    <group name="Kamyshovo">
        <pos x="11830.744141" z="3400.428955" />
        <pos x="11930.805664" z="3484.882324" />
        <pos x="11961.211914" z="3419.867676" />
        <pos x="12222.977539" z="3454.867188" />
        <pos x="12336.774414" z="3503.847168" />
    </group>
</generator_posbubbles>
```

Coordenadas usam `x` (leste-oeste) e `z` (norte-sul). O eixo Y (altitude) e calculado automaticamente a partir do heightmap do terreno.

---

## Spawns de Hop

Spawns de hop sao mais lenientes na distancia de jogadores e usam grades menores:

```xml
<!-- Diferencas de spawn_params do hop em relacao ao fresh -->
<min_dist_player>25.0</min_dist_player>   <!-- fresh: 65 -->
<max_dist_player>70.0</max_dist_player>   <!-- fresh: 150 -->
<min_dist_static>0.5</min_dist_static>    <!-- fresh: 0 -->

<!-- Diferencas de generator_params do hop -->
<grid_width>150</grid_width>              <!-- fresh: 200 -->
<grid_height>150</grid_height>            <!-- fresh: 200 -->

<!-- Diferencas de group_params do hop -->
<enablegroups>false</enablegroups>        <!-- fresh: true -->
<lifetime>360</lifetime>                  <!-- fresh: 240 -->
```

Grupos de hop sao espalhados **no interior**: Balota (6), Cherno (5), Pusta (5), Kamyshovo (4), Solnechny (5), Nizhnee (6), Berezino (5), Olsha (4), Svetlojarsk (5), Dobroye (5). Com `enablegroups=false`, o engine trata todas as 50 posicoes como um pool plano.

---

## init.c -- Equipamento Inicial

O arquivo **init.c** na sua pasta de missao controla a criacao de personagem e equipamento inicial. Duas sobrescritas importam:

- **`CreateCharacter`** -- chama `GetGame().CreatePlayer()`. O engine escolhe a posicao do **cfgplayerspawnpoints.xml** antes disso rodar; voce nao define a posicao de spawn aqui.
- **`StartingEquipSetup`** -- roda apos a criacao do personagem. O jogador ja tem roupas padrao (camisa, jeans, tenis). Este metodo adiciona itens iniciais.

### StartingEquipSetup Vanilla (Chernarus)

```c
override void StartingEquipSetup(PlayerBase player, bool clothesChosen)
{
    EntityAI itemClothing;
    EntityAI itemEnt;
    float rand;

    itemClothing = player.FindAttachmentBySlotName( "Body" );
    if ( itemClothing )
    {
        SetRandomHealth( itemClothing );  // 0.45 - 0.65 de saude

        itemEnt = itemClothing.GetInventory().CreateInInventory( "BandageDressing" );
        player.SetQuickBarEntityShortcut(itemEnt, 2);

        string chemlightArray[] = { "Chemlight_White", "Chemlight_Yellow", "Chemlight_Green", "Chemlight_Red" };
        int rndIndex = Math.RandomInt( 0, 4 );
        itemEnt = itemClothing.GetInventory().CreateInInventory( chemlightArray[rndIndex] );
        SetRandomHealth( itemEnt );
        player.SetQuickBarEntityShortcut(itemEnt, 1);

        rand = Math.RandomFloatInclusive( 0.0, 1.0 );
        if ( rand < 0.35 )
            itemEnt = player.GetInventory().CreateInInventory( "Apple" );
        else if ( rand > 0.65 )
            itemEnt = player.GetInventory().CreateInInventory( "Pear" );
        else
            itemEnt = player.GetInventory().CreateInInventory( "Plum" );
        player.SetQuickBarEntityShortcut(itemEnt, 3);
        SetRandomHealth( itemEnt );
    }

    itemClothing = player.FindAttachmentBySlotName( "Legs" );
    if ( itemClothing )
        SetRandomHealth( itemClothing );
}
```

O que isso da a cada jogador: **BandageDressing** (quickbar 3), **Chemlight** aleatorio (quickbar 2), fruta aleatoria -- 35% Apple, 30% Plum, 35% Pear (quickbar 1). `SetRandomHealth` define 45-65% de condicao em todos os itens.

### Adicionando equipamento inicial customizado

```c
// Adicione apos o bloco de fruta, dentro da verificacao do slot Body
itemEnt = player.GetInventory().CreateInInventory( "KitchenKnife" );
SetRandomHealth( itemEnt );
```

---

## Adicionando Pontos de Spawn Customizados

Para adicionar um grupo de spawn customizado, edite a secao `<fresh>` do **cfgplayerspawnpoints.xml**:

```xml
<group name="MyCustomSpawn">
    <pos x="7500.0" z="7500.0" />
    <pos x="7550.0" z="7520.0" />
    <pos x="7480.0" z="7540.0" />
    <pos x="7520.0" z="7480.0" />
</group>
```

Passos:

1. Abra seu mapa in-game ou use o iZurvive para encontrar coordenadas
2. Escolha 3-5 posicoes espalhadas por 100-200m em uma area segura (sem penhascos, sem agua)
3. Adicione o bloco `<group>` dentro de `<generator_posbubbles>`
4. Use `x` para leste-oeste e `z` para norte-sul -- o engine calcula Y (altitude) a partir do terreno
5. Reinicie o servidor -- nenhum wipe de persistencia e necessario

Para spawn balanceado, mantenha pelo menos 4 posicoes por grupo para que o bloqueio de 240 segundos nao bloqueie todas as posicoes quando multiplos jogadores morrem de uma vez.

---

## Erros Comuns

### Jogadores spawnando no oceano

Voce trocou `z` (norte-sul) com Y (altitude), ou usou coordenadas fora da faixa 0-15360. Posicoes costeiras tem valores baixos de `z` (borda sul). Verifique com o iZurvive.

### Pontos de spawn insuficientes

Com apenas 2-3 posicoes, o bloqueio de 240 segundos causa agrupamento. O vanilla usa 49 posicoes de spawn para novos jogadores em 11 grupos. Tente ter pelo menos 20 posicoes em 4+ grupos.

### Esquecendo a secao hop

Uma secao `<hop>` vazia significa que server hoppers spawnam em `0,0,0` -- o oceano em Chernarus. Sempre defina pontos de hop, mesmo que voce os copie do `<fresh>`.

### Pontos de spawn em terreno ingreme

O gerador rejeita inclinacoes acima de 45 graus. Se todas as posicoes customizadas estao em encostas, nenhum candidato valido existe. Use terreno plano perto de estradas.

### Jogadores sempre spawnando no mesmo lugar

Grupos com 1-2 posicoes ficam bloqueados pelo cooldown de 240 segundos. Adicione mais posicoes por grupo.

---

[Inicio](../README.md) | [<< Anterior: Spawn de Veiculos](05-vehicle-spawning.md) | [Proximo: Persistencia >>](07-persistence.md)
