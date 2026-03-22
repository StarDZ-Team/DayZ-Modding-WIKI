# Chapter 8.2: Creating a Custom Item

[Home](../README.md) | [<< Previous: Your First Mod](01-first-mod.md) | **Creating a Custom Item** | [Next: Building an Admin Panel >>](03-admin-panel.md)

---

## Sumário

- [O que Estamos Construindo](#o-que-estamos-construindo)
- [Pré-requisitos](#pré-requisitos)
- [Passo 1: Definir a Classe do Item em config.cpp](#passo-1-definir-a-classe-do-item-em-configcpp)
- [Passo 2: Configurar Hidden Selections para Texturas](#passo-2-configurar-hidden-selections-para-texturas)
- [Passo 3: Criar Texturas Básicas](#passo-3-criar-texturas-básicas)
- [Passo 4: Adicionar ao types.xml para Spawn no Servidor](#passo-4-adicionar-ao-typesxml-para-spawn-no-servidor)
- [Passo 5: Criar um Nome de Exibição com Stringtable](#passo-5-criar-um-nome-de-exibição-com-stringtable)
- [Passo 6: Testar In-Game](#passo-6-testar-in-game)
- [Passo 7: Polir -- Modelo, Texturas e Sons](#passo-7-polir----modelo-texturas-e-sons)
- [Referência Completa dos Arquivos](#referência-completa-dos-arquivos)
- [Resolução de Problemas](#resolução-de-problemas)
- [Próximos Passos](#próximos-passos)

---

## O que Estamos Construindo

Vamos criar um item chamado **Field Journal** -- um pequeno caderno que jogadores podem encontrar no mundo, pegar e guardar no inventário. Ele vai:

- Usar um modelo vanilla (emprestado de um item existente) para não precisarmos de modelagem 3D
- Ter uma aparência retexturizada personalizada usando hidden selections
- Aparecer na tabela de spawn do servidor
- Ter um nome de exibição e descrição adequados

Este é o workflow padrão para criar qualquer item no DayZ, seja comida, ferramentas, roupas ou materiais de construção.

---

## Pré-requisitos

- Uma estrutura de mod funcional (complete o [Capítulo 8.1](01-first-mod.md) primeiro)
- Um editor de texto
- DayZ Tools instalado (para conversão de texturas, opcional)

---

## Passo 1: Definir a Classe do Item em config.cpp

Itens no DayZ são definidos na classe config `CfgVehicles`. Apesar do nome "Vehicles", esta classe contém TODOS os tipos de entidade: itens, construções, veículos, animais e todo o resto.

Crie o arquivo `MyFirstMod/Data/config.cpp` com este conteúdo:

```cpp
class CfgPatches
{
    class MyFirstMod_Data
    {
        units[] = { "MFM_FieldJournal" };
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Characters"
        };
    };
};

class CfgVehicles
{
    class Inventory_Base;

    class MFM_FieldJournal : Inventory_Base
    {
        scope = 2;
        displayName = "$STR_MFM_FieldJournal";
        descriptionShort = "$STR_MFM_FieldJournal_Desc";
        model = "\DZ\characters\accessories\data\Notebook\Notebook.p3d";
        rotationFlags = 17;
        weight = 200;
        itemSize[] = { 1, 2 };
        absorbency = 0.5;

        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 100;
                    healthLevels[] =
                    {
                        { 1.0, {} },
                        { 0.7, {} },
                        { 0.5, {} },
                        { 0.3, {} },
                        { 0.0, {} }
                    };
                };
            };
        };

        hiddenSelections[] = { "camoGround" };
        hiddenSelectionsTextures[] = { "MyFirstMod\Data\Textures\field_journal_co.paa" };
    };
};
```

### O que Cada Campo Faz

| Campo | Valor | Explicação |
|-------|-------|-------------|
| `scope` | `2` | Torna o item público -- spawnável e visível em ferramentas admin. Use `0` para classes base que nunca devem spawnar diretamente. |
| `displayName` | `"$STR_MFM_FieldJournal"` | Referencia uma entrada da string table para o nome do item. O prefixo `$STR_` diz para a engine procurar em `stringtable.csv`. |
| `model` | Caminho para `.p3d` | O modelo 3D. Emprestamos o modelo vanilla Notebook. |
| `weight` | `200` | Peso em gramas. |
| `itemSize[]` | `{ 1, 2 }` | Tamanho na grid do inventário: 1 coluna de largura, 2 linhas de altura. |
| `hiddenSelections[]` | `{ "camoGround" }` | Slots de textura nomeados no modelo que podem ser sobrescritos. |
| `hiddenSelectionsTextures[]` | Caminho para `.paa` | Sua textura personalizada para cada hidden selection. |

### Sobre a Classe Pai

Classes pai comuns incluem:

| Classe Pai | Usar Para |
|-------------|---------|
| `Inventory_Base` | Itens genéricos de inventário |
| `Edible_Base` | Comida e bebida |
| `Clothing_Base` | Roupas/armaduras vestíveis |
| `Weapon_Base` | Armas de fogo |
| `Magazine_Base` | Carregadores e caixas de munição |
| `HouseNoDestruct` | Construções e estruturas |

---

## Passo 2: Configurar Hidden Selections para Texturas

Hidden selections são o mecanismo que DayZ usa para trocar texturas em um modelo 3D sem modificar o arquivo do modelo.

1. O modelo 3D (`.p3d`) define regiões nomeadas chamadas **selections**
2. No config.cpp, `hiddenSelections[]` lista quais selections você quer sobrescrever
3. `hiddenSelectionsTextures[]` fornece suas texturas de substituição, na ordem correspondente

---

## Passo 3: Criar Texturas Básicas

DayZ usa formato `.paa` para texturas. Durante o desenvolvimento, você pode começar com uma imagem colorida simples e converter depois.

### Opção A: Usar um Placeholder (Mais Rápido)

Para teste inicial, aponte `hiddenSelectionsTextures` para uma textura vanilla:

```cpp
hiddenSelectionsTextures[] = { "\DZ\characters\accessories\data\Notebook\notebook_co.paa" };
```

### Opção B: Criar uma Textura Personalizada

1. Crie uma imagem fonte em **512x512 pixels** (dimensões potência de 2 são obrigatórias)
2. Salve como `.tga` ou `.png`
3. Converta para `.paa` usando **TexView2** do DayZ Tools

O sufixo `_co` é uma convenção de nomenclatura significando "color" (textura diffuse/albedo).

---

## Passo 4: Adicionar ao types.xml para Spawn no Servidor

```xml
<type name="MFM_FieldJournal">
    <nominal>10</nominal>
    <lifetime>14400</lifetime>
    <restock>1800</restock>
    <min>5</min>
    <quantmin>-1</quantmin>
    <quantmax>-1</quantmax>
    <cost>100</cost>
    <flags count_in_cargo="0" count_in_hoarder="0" count_in_map="1" count_in_player="0" crafted="0" deloot="0" />
    <category name="tools" />
    <usage name="Town" />
    <usage name="Village" />
    <value name="Tier1" />
    <value name="Tier2" />
</type>
```

---

## Passo 5: Criar um Nome de Exibição com Stringtable

Crie o arquivo `MyFirstMod/Data/Stringtable.csv`:

```csv
"Language","English","Czech","German","Russian","Polish","Hungarian","Italian","Spanish","French","Chinese","Japanese","Portuguese","ChineseSimp","Korean"
"STR_MFM_FieldJournal","Field Journal","","","","","","","","","","","","",""
"STR_MFM_FieldJournal_Desc","A weathered leather journal used to record field notes and observations.","","","","","","","","","","","","",""
```

---

## Passo 6: Testar In-Game

A forma mais rápida de testar seu item sem esperar que spawne naturalmente:

1. Inicie DayZ com seu mod carregado
2. Abra o **console de script**
3. Digite:

```c
GetGame().GetPlayer().GetInventory().CreateInInventory("MFM_FieldJournal");
```

### O que Verificar

1. **O item aparece?** Se sim, a definição de classe no config.cpp está correta.
2. **Tem o nome correto?** Se você vê `$STR_MFM_FieldJournal` ao invés de "Field Journal", a stringtable não está carregando.
3. **Tem a textura correta?** Se o item aparece todo branco ou rosa, o caminho da textura está errado.
4. **Pode ser pego?** Verifique `itemSize` e `scope`.

---

## Passo 7: Polir -- Modelo, Texturas e Sons

### Adicionando Comportamento de Script

Para dar ao seu item comportamento personalizado, crie uma classe de script em `4_World`:

```c
class MFM_FieldJournal extends Inventory_Base
{
    override bool CanPutInCargo(EntityAI parent)
    {
        if (!super.CanPutInCargo(parent))
            return false;

        return true;
    }

    override void SetActions()
    {
        super.SetActions();
        // Adicionar ações personalizadas aqui
        // AddAction(ActionReadJournal);
    }

    override void OnInventoryEnter(Man player)
    {
        super.OnInventoryEnter(player);
        Print("[MyFirstMod] Player picked up the Field Journal!");
    }

    override void OnInventoryExit(Man player)
    {
        super.OnInventoryExit(player);
        Print("[MyFirstMod] Player dropped the Field Journal.");
    }
};
```

---

## Resolução de Problemas

### Item Não Aparece Quando Spawnado via Console de Script

- **Incompatibilidade de nome de classe:** O nome no comando de spawn deve corresponder ao nome de classe do config.cpp exatamente (case-sensitive).
- **config.cpp não carregado:** Verifique que seu PBO de Data está empacotado e carregado, ou que file patching está ativo.

### Nome do Item Mostra como `$STR_MFM_FieldJournal`

- **Stringtable não encontrada:** Garanta que `Stringtable.csv` está no mesmo PBO que a config que a referencia.
- **Nome de chave errado:** A chave no CSV deve corresponder exatamente (sem o prefixo `$`).

### Item Aparece Todo Branco, Rosa ou Invisível

- **Caminho da textura errado:** Verifique que `hiddenSelectionsTextures[]` aponta para o arquivo `.paa` correto.
- **Nome de hidden selection errado:** O nome da selection deve corresponder ao que o modelo define.

---

## Próximos Passos

1. **[Capítulo 8.3: Construindo um Módulo de Painel Admin](03-admin-panel.md)** -- Criar um painel UI com comunicação servidor-cliente.
2. **Adicionar variantes** -- Criar variantes de cor do seu item usando diferentes texturas de hidden selection.
3. **Adicionar receitas de crafting** -- Definir combinações de crafting em config.cpp usando `CfgRecipes`.
4. **Criar roupas** -- Estender `Clothing_Base` ao invés de `Inventory_Base` para itens vestíveis.

---

**Anterior:** [Capítulo 8.1: Seu Primeiro Mod (Hello World)](01-first-mod.md)
**Próximo:** [Capítulo 8.3: Construindo um Módulo de Painel Admin](03-admin-panel.md)
