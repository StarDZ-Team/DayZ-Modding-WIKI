# Chapter 8.11: Criando Roupas Personalizadas

[Inicio](../README.md) | [<< Anterior: Criando um Veículo Personalizado](10-vehicle-mod.md) | **Criando Roupas Personalizadas** | [Próximo: Construindo um Sistema de Comércio >>](12-trading-system.md)

---

> **Resumo:** Este tutorial guia você pela criação de uma jaqueta tática personalizada para DayZ. Você vai escolher uma classe base, definir a roupa no config.cpp com propriedades de isolamento e cargo, retexturizar com um padrão camuflado usando hidden selections, adicionar localização e spawn, e opcionalmente estender com comportamento por script. Ao final, você terá uma jaqueta vestível que mantém jogadores aquecidos, carrega itens e spawna no mundo.

---

## Sumário

- [O que Estamos Construindo](#o-que-estamos-construindo)
- [Passo 1: Escolher uma Classe Base](#passo-1-escolher-uma-classe-base)
- [Passo 2: config.cpp para Roupas](#passo-2-configcpp-para-roupas)
- [Passo 3: Criar Texturas](#passo-3-criar-texturas)
- [Passo 4: Adicionar Espaço de Cargo](#passo-4-adicionar-espaço-de-cargo)
- [Passo 5: Localização e Spawn](#passo-5-localização-e-spawn)
- [Passo 6: Comportamento por Script (Opcional)](#passo-6-comportamento-por-script-opcional)
- [Passo 7: Build, Teste, Polimento](#passo-7-build-teste-polimento)
- [Referência Completa de Código](#referência-completa-de-código)
- [Erros Comuns](#erros-comuns)
- [Boas Práticas](#boas-práticas)
- [Teoria vs Prática](#teoria-vs-prática)
- [O que Você Aprendeu](#o-que-você-aprendeu)

---

## O que Estamos Construindo

Vamos criar uma **Jaqueta Tática Camuflada** -- uma jaqueta estilo militar com camuflagem florestal que jogadores podem encontrar e vestir. Ela vai:

- Estender o modelo vanilla da jaqueta Gorka (sem modelagem 3D necessária)
- Ter uma retextura camuflada personalizada usando hidden selections
- Fornecer aquecimento através de valores `heatIsolation`
- Carregar itens nos bolsos (espaço de cargo)
- Sofrer dano com degradação visual entre estados de saúde
- Spawnar em locais militares no mundo

**Pré-requisitos:** Uma estrutura de mod funcional (complete o [Capítulo 8.1](01-first-mod.md) e [Capítulo 8.2](02-custom-item.md) primeiro), um editor de texto, DayZ Tools instalado (para TexView2) e um editor de imagem para criar texturas camufladas.

---

## Passo 1: Escolher uma Classe Base

Roupas no DayZ herdam de `Clothing_Base`, mas você quase nunca estende diretamente. DayZ fornece classes base intermediárias para cada slot do corpo:

| Classe Base | Slot do Corpo | Exemplos |
|-------------|---------------|----------|
| `Top_Base` | Corpo (torso) | Jaquetas, camisas, moletons |
| `Pants_Base` | Pernas | Jeans, calças cargo |
| `Shoes_Base` | Pés | Botas, tênis |
| `HeadGear_Base` | Cabeça | Capacetes, chapéus |
| `Mask_Base` | Rosto | Máscaras de gás, balaclavas |
| `Gloves_Base` | Mãos | Luvas táticas |
| `Vest_Base` | Slot de colete | Plate carriers, rigs de peito |
| `Glasses_Base` | Óculos | Óculos de sol |
| `Backpack_Base` | Costas | Mochilas, bolsas |

A cadeia completa de herança é: `Clothing_Base -> Clothing -> Top_Base -> GorkaEJacket_ColorBase -> SuaJaqueta`

### Por que Estender um Item Vanilla Existente

Você pode estender em diferentes níveis:

1. **Estender um item específico** (como `GorkaEJacket_ColorBase`) -- mais fácil. Você herda o modelo, animações, slot e todas as propriedades. Só mude texturas e ajuste valores. É isso que o sample `Test_ClothingRetexture` da Bohemia faz.
2. **Estender uma base de slot** (como `Top_Base`) -- ponto de partida limpo, mas você deve especificar um modelo e todas as propriedades.
3. **Estender `Clothing` diretamente** -- apenas para comportamento de slot completamente personalizado. Raramente necessário.

Para nossa jaqueta tática, vamos estender `GorkaEJacket_ColorBase`. Olhando o script vanilla:

```c
class GorkaEJacket_ColorBase extends Top_Base
{
    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
class GorkaEJacket_Summer extends GorkaEJacket_ColorBase {};
class GorkaEJacket_Flat extends GorkaEJacket_ColorBase {};
```

Note o padrão: uma classe `_ColorBase` trata comportamento compartilhado, e variantes de cores individuais a estendem sem código adicional. Suas entradas no config.cpp fornecem texturas diferentes. Seguiremos o mesmo padrão.

Para encontrar classes base, procure em `scripts/4_world/entities/itembase/clothing_base.c` (define todas as bases de slot) e `scripts/4_world/entities/itembase/clothing/` (um arquivo por família de roupa).

---

## Passo 2: config.cpp para Roupas

Crie `MyClothingMod/Data/config.cpp`:

```cpp
class CfgPatches
{
    class MyClothingMod_Data
    {
        units[] = { "MCM_TacticalJacket_Woodland" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Characters_Tops" };
    };
};

class CfgVehicles
{
    class GorkaEJacket_ColorBase;

    class MCM_TacticalJacket_ColorBase : GorkaEJacket_ColorBase
    {
        scope = 0;
        displayName = "";
        descriptionShort = "";

        weight = 1800;
        itemSize[] = { 3, 4 };
        absorbency = 0.3;
        heatIsolation = 0.8;
        visibilityModifier = 0.7;

        repairableWithKits[] = { 5, 2 };
        repairCosts[] = { 30.0, 25.0 };

        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 200;
                    healthLevels[] =
                    {
                        { 1.0,  { "DZ\characters\tops\Data\GorkaUpper.rvmat" } },
                        { 0.70, { "DZ\characters\tops\Data\GorkaUpper.rvmat" } },
                        { 0.50, { "DZ\characters\tops\Data\GorkaUpper_damage.rvmat" } },
                        { 0.30, { "DZ\characters\tops\Data\GorkaUpper_damage.rvmat" } },
                        { 0.01, { "DZ\characters\tops\Data\GorkaUpper_destruct.rvmat" } }
                    };
                };
            };
            class GlobalArmor
            {
                class Melee
                {
                    class Health    { damage = 0.8; };
                    class Blood     { damage = 0.8; };
                    class Shock     { damage = 0.8; };
                };
                class Infected
                {
                    class Health    { damage = 0.8; };
                    class Blood     { damage = 0.8; };
                    class Shock     { damage = 0.8; };
                };
            };
        };

        class EnvironmentWetnessIncrements
        {
            class Soaking
            {
                rain = 0.015;
                water = 0.1;
            };
            class Drying
            {
                playerHeat = -0.08;
                fireBarrel = -0.25;
                wringing = -0.15;
            };
        };
    };

    class MCM_TacticalJacket_Woodland : MCM_TacticalJacket_ColorBase
    {
        scope = 2;
        displayName = "$STR_MCM_TacticalJacket_Woodland";
        descriptionShort = "$STR_MCM_TacticalJacket_Woodland_Desc";
        hiddenSelectionsTextures[] =
        {
            "MyClothingMod\Data\Textures\tactical_jacket_g_woodland_co.paa",
            "MyClothingMod\Data\Textures\tactical_jacket_woodland_co.paa",
            "MyClothingMod\Data\Textures\tactical_jacket_woodland_co.paa"
        };
    };
};
```

### Campos Específicos de Roupas Explicados

**Térmico e furtividade:**

| Campo | Valor | Explicação |
|-------|-------|------------|
| `heatIsolation` | `0.8` | Aquecimento fornecido (faixa 0.0-1.0). A engine multiplica isso por fatores de saúde e umidade. Uma jaqueta prístina seca dá aquecimento total; uma arruinada e encharcada quase nenhum. |
| `visibilityModifier` | `0.7` | Visibilidade do jogador para IA (menor = mais difícil de detectar). |
| `absorbency` | `0.3` | Absorção de água (0 = impermeável, 1 = esponja). Menor é melhor para resistência à chuva. |

**Referência vanilla de heatIsolation:** Camiseta 0.2, Moletom 0.5, Jaqueta Gorka 0.7, Jaqueta de Campo 0.8, Casaco de Lã 0.9.

**Reparo:** `repairableWithKits[] = { 5, 2 }` lista tipos de kit (5=Kit de Costura, 2=Kit de Costura em Couro). `repairCosts[]` indica material consumido por reparo, na mesma ordem.

**Armadura:** Um valor de `damage` de 0.8 significa que o jogador recebe 80% do dano recebido (20% absorvido). Valores menores = mais proteção.

**Umidade:** `Soaking` controla quão rápido chuva/água encharca o item. Valores negativos em `Drying` representam perda de umidade por calor corporal, fogueiras e torção.

**Hidden selections:** O modelo Gorka tem 3 seleções -- índice 0 é o modelo de chão, índices 1 e 2 são o modelo vestido. Você sobrescreve `hiddenSelectionsTextures[]` com seus caminhos PAA personalizados.

**Níveis de saúde:** Cada entrada é `{ limiarDeSaúde, { caminhDoMaterial } }`. Quando a saúde cai abaixo de um limiar, a engine troca o material. Rvmats vanilla de dano adicionam marcas de desgaste e rasgos.

---

## Passo 3: Criar Texturas

### Encontrando e Criando Texturas

As texturas da jaqueta Gorka ficam em `DZ\characters\tops\data\` -- extraia o `gorka_upper_summer_co.paa` (cor), `gorka_upper_nohq.paa` (normal) e `gorka_upper_smdi.paa` (especular) do drive P: para usar como templates.

**Criando o padrão camuflado:**

1. Abra a textura vanilla `_co` no TexView2, exporte como TGA/PNG
2. Pinte sua camuflagem florestal no seu editor de imagem, seguindo o layout UV
3. Mantenha as mesmas dimensões (tipicamente 2048x2048 ou 1024x1024)
4. Salve como TGA, converta para PAA usando TexView2 (File > Save As > .paa)

### Tipos de Textura

| Sufixo | Propósito | Obrigatório? |
|--------|-----------|--------------|
| `_co` | Cor/padrão principal | Sim |
| `_nohq` | Normal map (detalhe do tecido) | Não -- usa padrão vanilla |
| `_smdi` | Especular (brilho) | Não -- usa padrão vanilla |
| `_as` | Máscara alpha/superfície | Não |

Para uma retextura, você só precisa de texturas `_co`. Os normal e specular maps do modelo vanilla continuam funcionando.

Para controle total de material, crie arquivos `.rvmat` e referencie em `hiddenSelectionsMaterials[]`. Veja o sample `Test_ClothingRetexture` da Bohemia para exemplos funcionais de rvmat com variantes de dano e destruição.

---

## Passo 4: Adicionar Espaço de Cargo

Ao estender `GorkaEJacket_ColorBase`, você herda seu grid de cargo (4x3) e slot de inventário (`"Body"`) automaticamente. A propriedade `itemSize[] = { 3, 4 }` define quão grande a jaqueta é quando armazenada como loot -- NÃO sua capacidade de cargo.

Slots comuns de roupas: `"Body"` (jaquetas), `"Legs"` (calças), `"Feet"` (botas), `"Headgear"` (chapéus), `"Vest"` (rigs de peito), `"Gloves"`, `"Mask"`, `"Back"` (mochilas).

Algumas roupas aceitam attachments (como bolsas do Plate Carrier). Adicione com `attachments[] = { "Shoulder", "Armband" };`. Para uma jaqueta básica, o cargo herdado é suficiente.

---

## Passo 5: Localização e Spawn

### Stringtable

Crie `MyClothingMod/Data/Stringtable.csv`:

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MCM_TacticalJacket_Woodland","Tactical Jacket (Woodland)","","","","","","","","","","","","",""
"STR_MCM_TacticalJacket_Woodland_Desc","A rugged tactical jacket with woodland camouflage. Provides good insulation and has multiple pockets.","","","","","","","","","","","","",""
```

### Spawn (types.xml)

Adicione ao `types.xml` da pasta de missão do seu servidor:

```xml
<type name="MCM_TacticalJacket_Woodland">
    <nominal>8</nominal>
    <lifetime>14400</lifetime>
    <restock>3600</restock>
    <min>3</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="clothes" />
    <usage name="Military" />
    <value name="Tier2" />
    <value name="Tier3" />
</type>
```

Use `category name="clothes"` para todas as roupas. Defina `usage` para corresponder onde o item deve spawnar (Military, Town, Police, etc.) e `value` para o tier do mapa (Tier1=costa até Tier4=interior profundo).

---

## Passo 6: Comportamento por Script (Opcional)

Para uma retextura simples, você não precisa de scripts. Mas para adicionar comportamento quando a jaqueta é vestida, crie uma classe de script.

### config.cpp de Scripts

```cpp
class CfgPatches
{
    class MyClothingMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Data", "DZ_Characters_Tops" };
    };
};

class CfgMods
{
    class MyClothingMod
    {
        dir = "MyClothingMod";
        name = "My Clothing Mod";
        author = "YourName";
        type = "mod";
        dependencies[] = { "World" };
        class defs
        {
            class worldScriptModule
            {
                value = "";
                files[] = { "MyClothingMod/Scripts/4_World" };
            };
        };
    };
};
```

### Script Personalizado da Jaqueta

Crie `Scripts/4_World/MyClothingMod/MCM_TacticalJacket.c`:

```c
class MCM_TacticalJacket_ColorBase extends GorkaEJacket_ColorBase
{
    override void OnWasAttached(EntityAI parent, int slot_id)
    {
        super.OnWasAttached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Player equipped Tactical Jacket");
        }
    }

    override void OnWasDetached(EntityAI parent, int slot_id)
    {
        super.OnWasDetached(parent, slot_id);
        PlayerBase player = PlayerBase.Cast(parent);
        if (player)
        {
            Print("[MyClothingMod] Player removed Tactical Jacket");
        }
    }

    override void SetActions()
    {
        super.SetActions();
        AddAction(ActionWringClothes);
    }
};
```

### Eventos Principais de Roupas

| Evento | Quando Dispara | Uso Comum |
|--------|----------------|-----------|
| `OnWasAttached(parent, slot_id)` | Jogador equipa o item | Aplicar buffs, mostrar efeitos |
| `OnWasDetached(parent, slot_id)` | Jogador desequipa o item | Remover buffs, limpar |
| `EEItemAttached(item, slot_name)` | Item anexado a esta roupa | Mostrar/esconder seleções do modelo |
| `EEItemDetached(item, slot_name)` | Item desanexado desta roupa | Reverter mudanças visuais |
| `EEHealthLevelChanged(old, new, zone)` | Saúde cruza um limiar | Atualizar estado visual |

**Importante:** Sempre chame `super` no início de todo override. A classe pai trata comportamento crítico da engine.

---

## Passo 7: Build, Teste, Polimento

### Build e Spawn

Empacote `Data/` e `Scripts/` como PBOs separados. Inicie o DayZ com seu mod e spawne a jaqueta:

```c
GetGame().GetPlayer().GetInventory().CreateInInventory("MCM_TacticalJacket_Woodland");
```

### Checklist de Verificação

1. **Aparece no inventário?** Se não, verifique `scope=2` e correspondência do nome da classe.
2. **Textura correta?** Textura padrão da Gorka = caminhos errados. Branco/rosa = arquivo de textura faltando.
3. **Pode equipar?** Deve ir para o slot Body. Se não, verifique a cadeia de classe pai.
4. **Nome de exibição aparece?** Se você vê texto `$STR_` cru, o stringtable não está carregando.
5. **Fornece aquecimento?** Verifique `heatIsolation` no menu debug/inspect.
6. **Dano degrada visuais?** Teste com: `ItemBase.Cast(GetGame().GetPlayer().GetItemOnSlot("Body")).SetHealth("", "", 40);`

### Adicionando Variantes de Cor

Siga o padrão `_ColorBase` -- adicione classes irmãs que diferem apenas nas texturas:

```cpp
class MCM_TacticalJacket_Desert : MCM_TacticalJacket_ColorBase
{
    scope = 2;
    displayName = "$STR_MCM_TacticalJacket_Desert";
    descriptionShort = "$STR_MCM_TacticalJacket_Desert_Desc";
    hiddenSelectionsTextures[] =
    {
        "MyClothingMod\Data\Textures\tactical_jacket_g_desert_co.paa",
        "MyClothingMod\Data\Textures\tactical_jacket_desert_co.paa",
        "MyClothingMod\Data\Textures\tactical_jacket_desert_co.paa"
    };
};
```

Cada variante precisa de seu próprio `scope=2`, nome de exibição, texturas, entradas no stringtable e entrada no types.xml.

---

## Referência Completa de Código

### Estrutura de Diretórios

```
MyClothingMod/
    mod.cpp
    Data/
        config.cpp              <-- Definições de itens (veja Passo 2)
        Stringtable.csv         <-- Nomes de exibição (veja Passo 5)
        Textures/
            tactical_jacket_woodland_co.paa
            tactical_jacket_g_woodland_co.paa
    Scripts/                    <-- Necessário apenas para comportamento por script
        config.cpp              <-- Entrada CfgMods (veja Passo 6)
        4_World/
            MyClothingMod/
                MCM_TacticalJacket.c
```

### mod.cpp

```cpp
name = "My Clothing Mod";
author = "YourName";
version = "1.0";
overview = "Adds a tactical jacket with camo variants to DayZ.";
```

Todos os outros arquivos são mostrados na íntegra em seus respectivos passos acima.

---

## Erros Comuns

| Erro | Consequência | Correção |
|------|--------------|----------|
| Esquecer `scope=2` nas variantes | Item não spawna ou aparece em ferramentas admin | Defina `scope=0` na base, `scope=2` em cada variante spawnável |
| Contagem errada no array de texturas | Texturas brancas/rosa em algumas partes | Faça match da contagem de `hiddenSelectionsTextures` com as hidden selections do modelo (Gorka tem 3) |
| Barras normais em caminhos de textura | Texturas falham em carregar silenciosamente | Use barras invertidas: `"MyMod\Data\tex.paa"` |
| `requiredAddons` faltando | Parser de config não consegue resolver classe pai | Inclua `"DZ_Characters_Tops"` para tops |
| `heatIsolation` acima de 1.0 | Jogador superaquece em clima quente | Mantenha valores na faixa 0.0-1.0 |
| Materiais de `healthLevels` vazios | Sem degradação visual de dano | Sempre referencie pelo menos rvmats vanilla |
| Pular `super` em overrides | Comportamento quebrado de inventário, dano ou attachment | Sempre chame `super.NomeDoMetodo()` primeiro |

---

## Boas Práticas

- **Comece com uma retextura simples.** Tenha um mod funcional com troca de textura antes de adicionar propriedades personalizadas ou scripts. Isso isola problemas de config dos problemas de textura.
- **Use o padrão _ColorBase.** Propriedades compartilhadas na base `scope=0`, apenas texturas e nomes nas variantes `scope=2`. Sem duplicação.
- **Mantenha valores de isolamento realistas.** Referencie itens vanilla com equivalentes similares do mundo real.
- **Teste com o console de script antes do types.xml.** Confirme que o item funciona antes de debugar tabelas de spawn.
- **Use referências `$STR_` para todo texto voltado ao jogador.** Habilita localização futura sem mudanças na config.
- **Empacote Data e Scripts como PBOs separados.** Atualize texturas sem reconstruir scripts.
- **Forneça texturas de chão.** A textura `_g_` faz itens dropados parecerem corretos.

---

## Teoria vs Prática

| Conceito | Teoria | Realidade |
|----------|--------|-----------|
| `heatIsolation` | Um simples número de aquecimento | Aquecimento efetivo depende da saúde e umidade. A engine o multiplica por fatores em `MiscGameplayFunctions.GetCurrentItemHeatIsolation()`. |
| Valores de `damage` da armadura | Menor = mais proteção | Um valor de 0.8 significa que o jogador recebe 80% do dano (apenas 20% absorvido). Muitos modders leem 0.9 como "90% de proteção" quando na verdade é 10%. |
| Herança de `scope` | Filhos herdam scope do pai | NÃO herdam. Cada classe deve definir `scope` explicitamente. Pai `scope=0` faz todos os filhos ficarem `scope=0` por padrão. |
| `absorbency` | Controla proteção contra chuva | Controla absorção de umidade, que REDUZ o aquecimento. Impermeável = absorbência BAIXA (0.1). Absorbência alta (0.8+) = encharca como uma esponja. |
| Hidden selections | Funcionam em qualquer modelo | Nem todos os modelos expõem as mesmas seleções. Verifique com Object Builder ou config vanilla antes de escolher um modelo base. |

---

## O que Você Aprendeu

Neste tutorial você aprendeu:

- Como roupas do DayZ herdam de classes base específicas de slot (`Top_Base`, `Pants_Base`, etc.)
- Como definir um item de roupa no config.cpp com propriedades térmicas, de armadura e umidade
- Como hidden selections permitem retexturizar modelos vanilla com padrões camuflados personalizados
- Como `heatIsolation`, `visibilityModifier` e `absorbency` afetam o gameplay
- Como o `DamageSystem` controla degradação visual e proteção de armadura
- Como criar variantes de cor usando o padrão `_ColorBase`
- Como adicionar entradas de spawn com `types.xml` e nomes de exibição com `Stringtable.csv`
- Como opcionalmente adicionar comportamento por script com eventos `OnWasAttached` e `OnWasDetached`

**Próximo:** Aplique as mesmas técnicas para criar calças (`Pants_Base`), botas (`Shoes_Base`) ou um colete (`Vest_Base`). A estrutura de config é idêntica -- apenas a classe pai e o slot de inventário mudam.

---

**Anterior:** [Capítulo 8.10: Criando um Veículo Personalizado](10-vehicle-mod.md)
**Próximo:** [Capítulo 8.12: Construindo um Sistema de Comércio](12-trading-system.md)
