# Chapter 4.3: Matérials (.rvmat)

[Home](../README.md) | [<< Previous: 3D Models](02-models.md) | **Matérials** | [Next: Audio >>](04-audio.md)

---

## Introdução

Um matérial no DayZ é a ponte entre um modelo 3D e sua aparência visual. Enquanto texturas fornecem dados brutos de imagem, o arquivo **RVMAT** (Real Virtuality Matérial) define como essas texturas são combinadas, qual shader as interpreta e quais propriedades de superfície o motor deve simular -- brilho, transparência, auto-iluminacao e mais. Toda face em todo modelo P3D no jogo referência um arquivo RVMAT, e entender como cria-los e configura-los é essencial para qualquer mod visual.

Este capítulo cobre o formato de arquivo RVMAT, tipos de shader, configuração de estágios de textura, propriedades de matérial, o sistema de troca de matérial por nível de dano, e exemplos práticos extraidos dos DayZ-Samples.

---

## Sumário

- [Visao Geral do Formato RVMAT](#visao-geral-do-formato-rvmat)
- [Estrutura do Arquivo](#estrutura-do-arquivo)
- [Tipos de Shader](#tipos-de-shader)
- [Estagios de Textura](#estágios-de-textura)
- [Propriedades do Matérial](#propriedades-do-matérial)
- [Niveis de Saude (Troca de Matérial por Dano)](#níveis-de-saude-troca-de-matérial-por-dano)
- [Como Matériais Referênciam Texturas](#como-matériais-referênciam-texturas)
- [Criando um RVMAT do Zero](#criando-um-rvmat-do-zero)
- [Exemplos Reais](#exemplos-reais)
- [Erros Comuns](#erros-comuns)
- [Boas Práticas](#boas-práticas)

---

## Visao Geral do Formato RVMAT

Um arquivo **RVMAT** e um arquivo de configuração baseado em texto (não binário) que define um matérial. Apesar da extensão customizada, o formato e texto puro usando a sintaxe de configuração estilo Bohemia com classes e pares chave-valor.

### Características Principais

- **Formato texto:** Editavel em qualquer editor de texto (Notepad++, VS Code).
- **Vinculacao de shader:** Cada RVMAT específica qual shader de renderizacao usar.
- **Mapeamento de textura:** Define quais arquivos de textura são atribuidos a quais entradas do shader (diffuse, normal, specular, etc.).
- **Propriedades de superfície:** Controla intensidade specular, brilho emissivo, transparência e mais.
- **Referênciado por modelos P3D:** Faces no LOD Resolution do Object Builder recebem um RVMAT. O motor carrega o RVMAT e todas as texturas que ele referência.
- **Referênciado pelo config.cpp:** `hiddenSelectionsMaterials[]` pode sobrescrever matériais em tempo de execução.

### Convencao de Caminho

Arquivos RVMAT ficam junto com suas texturas, típicamente em um diretório `data/`:

```
MyMod/
  data/
    my_item.rvmat              <-- Material definition
    my_item_co.paa             <-- Diffuse texture (referenced by the RVMAT)
    my_item_nohq.paa           <-- Normal map (referenced by the RVMAT)
    my_item_smdi.paa           <-- Specular map (referenced by the RVMAT)
```

---

## Estrutura do Arquivo

Um arquivo RVMAT tem uma estrutura consistente. Aqui esta um exemplo completo e anotado:

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};        // Ambient color multiplier (RGBA)
diffuse[] = {1.0, 1.0, 1.0, 1.0};        // Diffuse color multiplier (RGBA)
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};  // Additive diffuse override
emmisive[] = {0.0, 0.0, 0.0, 0.0};       // Emissive (self-illumination) color
specular[] = {0.7, 0.7, 0.7, 1.0};       // Specular highlight color
specularPower = 80;                        // Specular sharpness (higher = tighter highlight)
PixelShaderID = "Super";                   // Shader program to use
VertexShaderID = "Super";                  // Vertex shader program

class Stage1                               // Texture stage: Normal map
{
    texture = "MyMod\data\my_item_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2                               // Texture stage: Diffuse/Color map
{
    texture = "MyMod\data\my_item_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3                               // Texture stage: Specular/Metallic map
{
    texture = "MyMod\data\my_item_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

### Propriedades de Nivel Superior

Estas são declaradas antes das classes Stage e controlam o comportamento geral do matérial:

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `ambient[]` | float[4] | Multiplicador de cor de luz ambiente. `{1,1,1,1}` = total, `{0,0,0,0}` = sem ambiente. |
| `diffuse[]` | float[4] | Multiplicador de cor de luz difusa. Geralmente `{1,1,1,1}`. |
| `forcedDiffuse[]` | float[4] | Override aditivo de difuso. Geralmente `{0,0,0,0}`. |
| `emmisive[]` | float[4] | Cor de auto-iluminacao. Valores nao-zero fazem a superfície brilhar. Nota: Bohemia usa a grafia errada `emmisive`, não `emissive`. |
| `specular[]` | float[4] | Cor e intensidade do reflexo specular. |
| `specularPower` | float | Nitidez dos reflexos speculares. Faixa 1-200. Maior = mais apertado, reflexao mais focada. |
| `PixelShaderID` | string | Nome do programa de pixel shader. |
| `VertexShaderID` | string | Nome do programa de vertex shader. |

---

## Tipos de Shader

Os valores `PixelShaderID` e `VertexShaderID` determinam qual pipeline de renderizacao processa o matérial. Ambos geralmente devem ser configurados com o mesmo valor.

### Shaders Disponíveis

| Shader | Caso de Uso | Estagios de Textura Necessarios |
|--------|-------------|--------------------------------|
| **Super** | Superficies opacas padrão (armas, roupas, itens) | Normal, Diffuse, Specular/Metallic |
| **Multi** | Terreno multicamada e superfícies complexas | Multiplos pares diffuse/normal |
| **Glass** | Superficies transparentes e semi-transparentes | Diffuse com alfa |
| **Watér** | Superficies de agua com reflexao e refracao | Texturas especiais de agua |
| **Terrain** | Superficies de solo do terreno | Satélite, mascara, camadas de matérial |
| **NormalMap** | Superficie simplificada com normal map | Normal, Diffuse |
| **NormalMapSpecular** | Normal map com specular | Normal, Diffuse, Specular |
| **Hair** | Renderizacao de cabelo de personagem | Diffuse com alfa, translucencia especial |
| **Skin** | Pele de personagem com espalhamento subsuperficial | Diffuse, Normal, Specular |
| **AlphaTest** | Transparencia de borda rigida (folhagem, cercas) | Diffuse com alfa |
| **AlphaBlend** | Transparencia suave (vidro, fumaca) | Diffuse com alfa |

### Shader Super (Mais Comum)

O shader **Super** e o shader padrão de renderizacao baseada em física usado para a grande maioria dos itens no DayZ. Ele espera três estágios de textura:

```
Stage1 = Normal map (_nohq)
Stage2 = Diffuse/Color map (_co)
Stage3 = Specular/Metallic map (_smdi)
```

Se você esta criando um item de mod (arma, roupa, ferramenta, container), você quase sempre usara o shader Super.

### Shader Glass

O shader **Glass** lida com superfícies transparentes. Ele le o alfa da textura diffuse para determinar a transparência:

```cpp
PixelShaderID = "Glass";
VertexShaderID = "Glass";

class Stage1
{
    texture = "MyMod\data\glass_nohq.paa";
    uvSource = "tex";
    class uvTransform { /* ... */ };
};

class Stage2
{
    texture = "MyMod\data\glass_ca.paa";    // Note: _ca suffix for color+alpha
    uvSource = "tex";
    class uvTransform { /* ... */ };
};
```

---

## Estagios de Textura

Cada classe `Stage` no RVMAT atribui uma textura a uma entrada específica do shader. O número do estágio determina qual função a textura desempenha.

### Atribuicoes de Estagio para o Shader Super

| Estagio | Função da Textura | Sufixo Típico | Descrição |
|---------|-------------------|---------------|-----------|
| **Stage1** | Normal map | `_nohq` | Detalhe de superfície, relevos, sulcos |
| **Stage2** | Mapa diffuse / cor | `_co` ou `_ca` | Cor base da superfície |
| **Stage3** | Mapa specular / metálico | `_smdi` | Brilho, propriedades metálicas, detalhe |
| **Stage4** | Ambient Shadow | `_as` | Oclusao ambiental pre-assada (opcional) |
| **Stage5** | Mapa macro | `_mc` | Variacao de cor em larga escala (opcional) |
| **Stage6** | Mapa de detalhe | `_de` | Micro-detalhe com repetição (opcional) |
| **Stage7** | Mapa emissivo / de luz | `_li` | Auto-iluminacao (opcional) |

### Propriedades do Estagio

Cada estágio contem:

```cpp
class Stage1
{
    texture = "path\to\texture.paa";    // Path relative to P: drive
    uvSource = "tex";                    // UV source: "tex" (model UVs) or "tex1" (2nd UV set)
    class uvTransform                    // UV transformation matrix
    {
        aside[] = {1.0, 0.0, 0.0};     // U-axis scale and direction
        up[] = {0.0, 1.0, 0.0};        // V-axis scale and direction
        dir[] = {0.0, 0.0, 0.0};       // Not typically used
        pos[] = {0.0, 0.0, 0.0};       // UV offset (translation)
    };
};
```

### UV Transform para Repetição

Para repetir uma textura (repeti-la em uma superfície), modifique os valores `aside` e `up`:

```cpp
class uvTransform
{
    aside[] = {4.0, 0.0, 0.0};     // Tile 4x horizontally
    up[] = {0.0, 4.0, 0.0};        // Tile 4x vertically
    dir[] = {0.0, 0.0, 0.0};
    pos[] = {0.0, 0.0, 0.0};
};
```

Isso é comumente usado para matériais de terreno e superfícies de edificios onde a mesma textura de detalhe se repete.

---

## Propriedades do Matérial

### Controle Specular

Os valores `specular[]` e `specularPower` trabalham juntos para definir quao brilhante uma superfície aparece:

| Tipo de Matérial | specular[] | specularPower | Aparencia |
|------------------|-----------|---------------|-----------|
| **Plastico fosco** | `{0.1, 0.1, 0.1, 1.0}` | 10 | Opaco, reflexo amplo |
| **Metal desgastado** | `{0.3, 0.3, 0.3, 1.0}` | 40 | Brilho moderado |
| **Metal polido** | `{0.8, 0.8, 0.8, 1.0}` | 120 | Reflexo brilhante e apertado |
| **Cromado** | `{1.0, 1.0, 1.0, 1.0}` | 200 | Reflexao tipo espelho |
| **Borracha** | `{0.02, 0.02, 0.02, 1.0}` | 5 | Quase sem reflexo |
| **Superficie molhada** | `{0.6, 0.6, 0.6, 1.0}` | 80 | Liso, reflexo medio-nítido |

### Emissivo (Auto-Iluminacao)

Para fazer uma superfície brilhar (LEDs, telas, elementos luminosos):

```cpp
emmisive[] = {0.2, 0.8, 0.2, 1.0};   // Green glow
```

A cor emissiva e adicionada a cor final do pixel independentemente da iluminacao. Um mapa emissivo `_li` em um estágio posterior de textura pode mascara quais partes da superfície brilham.

### Renderizacao em Dois Lados

Para superfícies finas que devem ser visíveis de ambos os lados (bandeiras, folhagem, tecido):

```cpp
renderFlags[] = {"noZWrite", "noAlpha", "twoSided"};
```

Esta não é uma propriedade de nível superior do RVMAT, mas e configurada no config.cpp ou atraves das configurações de shader do matérial dependendo do caso de uso.

---

## Niveis de Saude (Troca de Matérial por Dano)

Itens do DayZ degradam ao longo do tempo. O motor suporta troca automática de matérial em diferentes limiares de dano, definidos no `config.cpp` usando o array `healthLevels[]`. Isso cria a progressao visual de pristino até arruinado.

### Estrutura do healthLevels[]

```cpp
class MyItem: Inventory_Base
{
    // ... other config ...

    healthLevels[] =
    {
        // {health_threshold, {"material_set"}},

        {1.0, {"MyMod\data\my_item.rvmat"}},           // Pristine (100% health)
        {0.7, {"MyMod\data\my_item_worn.rvmat"}},       // Worn (70% health)
        {0.5, {"MyMod\data\my_item_damaged.rvmat"}},     // Damaged (50% health)
        {0.3, {"MyMod\data\my_item_badly_damaged.rvmat"}},// Badly Damaged (30% health)
        {0.0, {"MyMod\data\my_item_ruined.rvmat"}}       // Ruined (0% health)
    };
};
```

### Como Funciona

1. O motor monitora o valor de saude do item (0.0 a 1.0).
2. Quando a saude cai abaixo de um limiar, o motor troca o matérial para o RVMAT correspondente.
3. Cada RVMAT pode referênciar texturas diferentes -- típicamente variantes progressivamente mais danificadas.
4. A troca é automática. Nenhum código de script é necessário.

### Progressao de Textura de Dano

Uma progressao típica de dano:

| Nivel | Saude | Mudanca Visual |
|-------|-------|----------------|
| **Pristino** | 1.0 | Aparencia limpa, novo de fabrica |
| **Desgastado** | 0.7 | Arranhoes leves, desgaste menor |
| **Danificado** | 0.5 | Arranhoes visíveis, descoloracao, sujeira |
| **Muito Danificado** | 0.3 | Desgaste pesado, ferrugem, rachaduras, tinta descascando |
| **Arruinado** | 0.0 | Severamente degradado, aparência quebrada |

### Criando Matériais de Dano

Para cada nível de dano, crie um RVMAT separado que referência texturas progressivamente mais danificadas:

```
data/
  my_item.rvmat                    --> my_item_co.paa (clean)
  my_item_worn.rvmat               --> my_item_worn_co.paa (light damage)
  my_item_damaged.rvmat            --> my_item_damaged_co.paa (moderate damage)
  my_item_badly_damaged.rvmat      --> my_item_badly_damaged_co.paa (heavy damage)
  my_item_ruined.rvmat             --> my_item_ruined_co.paa (destroyed)
```

> **Dica:** Você nem sempre precisa de texturas únicas para cada nível de dano. Uma otimizacao comum e compartilhar os normal maps e specular maps entre todos os níveis e mudar apenas a textura diffuse:
>
> ```
> my_item.rvmat           --> my_item_co.paa
> my_item_worn.rvmat      --> my_item_co.paa  (same diffuse, lower specular)
> my_item_damaged.rvmat   --> my_item_damaged_co.paa
> my_item_ruined.rvmat    --> my_item_ruined_co.paa
> ```

### Usando Matériais de Dano Vanilla

O DayZ fornece um conjunto de matériais genericos de overlay de dano que podem ser usados se você não quiser criar texturas de dano personalizadas:

```cpp
healthLevels[] =
{
    {1.0, {"MyMod\data\my_item.rvmat"}},
    {0.7, {"DZ\data\data\default_worn.rvmat"}},
    {0.5, {"DZ\data\data\default_damaged.rvmat"}},
    {0.3, {"DZ\data\data\default_badly_damaged.rvmat"}},
    {0.0, {"DZ\data\data\default_ruined.rvmat"}}
};
```

---

## Como Matériais Referênciam Texturas

A conexao entre modelos, matériais e texturas forma uma cadeia:

```
P3D Model (Object Builder)
  |
  |--> Face assigned to RVMAT
         |
         |--> Stage1.texture = "path\to\normal_nohq.paa"
         |--> Stage2.texture = "path\to\color_co.paa"
         |--> Stage3.texture = "path\to\specular_smdi.paa"
```

### Resolução de Caminho

Todos os caminhos de textura em arquivos RVMAT são relativos a raiz da **unidade P:**:

```cpp
// Correct: relative to P: drive
texture = "MyMod\data\textures\my_item_co.paa";

// This means: P:\MyMod\data\textures\my_item_co.paa
```

Quando empacotado em um PBO, o prefixo do caminho deve corresponder ao prefixo do PBO:

```
PBO prefix: MyMod
Internal path: data\textures\my_item_co.paa
Full reference: MyMod\data\textures\my_item_co.paa
```

### Override de hiddenSelectionsMatérials

O config.cpp pode sobrescrever qual matérial e aplicado a uma seleção nomeada em tempo de execução:

```cpp
class MyItem_Green: MyItem
{
    hiddenSelections[] = {"camo"};
    hiddenSelectionsTextures[] = {"MyMod\data\my_item_green_co.paa"};
    hiddenSelectionsMaterials[] = {"MyMod\data\my_item_green.rvmat"};
};
```

Isso permite criar variantes de item (esquemas de cor, padroes de camuflagem) que compartilham o mesmo modelo P3D mas usam matériais diferentes.

---

## Criando um RVMAT do Zero

### Passo a Passo: Item Opaco Padrão

1. **Crie seus arquivos de textura:**
   - `my_item_co.paa` (cor diffuse)
   - `my_item_nohq.paa` (normal map)
   - `my_item_smdi.paa` (specular/metallic)

2. **Crie o arquivo RVMAT** (texto puro):

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.0, 0.0, 0.0, 0.0};
specular[] = {0.5, 0.5, 0.5, 1.0};
specularPower = 60;
PixelShaderID = "Super";
VertexShaderID = "Super";

class Stage1
{
    texture = "MyMod\data\my_item_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2
{
    texture = "MyMod\data\my_item_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3
{
    texture = "MyMod\data\my_item_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

3. **Atribua no Object Builder:**
   - Abra seu modelo P3D.
   - Selecione faces no LOD Resolution.
   - Clique direito --> **Face Properties**.
   - Navegue até seu arquivo RVMAT.

4. **Teste no jogo** via file patching ou build de PBO.

---

## Exemplos Reais

### DayZ-Samples Test_ClothingRetexture

Os DayZ-Samples oficiais incluem um exemplo `Test_ClothingRetexture` que demonstra o fluxo de trabalho padrão de matérial:

```cpp
// From DayZ-Samples retexture example
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.0, 0.0, 0.0, 0.0};
specular[] = {0.3, 0.3, 0.3, 1.0};
specularPower = 50;
PixelShaderID = "Super";
VertexShaderID = "Super";

class Stage1
{
    texture = "DZ_Samples\Test_ClothingRetexture\data\tshirt_nohq.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage2
{
    texture = "DZ_Samples\Test_ClothingRetexture\data\tshirt_co.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};

class Stage3
{
    texture = "DZ_Samples\Test_ClothingRetexture\data\tshirt_smdi.paa";
    uvSource = "tex";
    class uvTransform
    {
        aside[] = {1.0, 0.0, 0.0};
        up[] = {0.0, 1.0, 0.0};
        dir[] = {0.0, 0.0, 0.0};
        pos[] = {0.0, 0.0, 0.0};
    };
};
```

### Matérial de Arma Metalica

Um cano de arma polido com alta resposta metalica:

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.0, 0.0, 0.0, 0.0};
specular[] = {0.9, 0.9, 0.9, 1.0};        // High specular for metal
specularPower = 150;                        // Tight, focused highlight
PixelShaderID = "Super";
VertexShaderID = "Super";

// ... Stage definitions with weapon textures ...
```

### Matérial Emissivo (Tela Brilhante)

Um matérial para a tela de um dispositivo que emite luz:

```cpp
ambient[] = {1.0, 1.0, 1.0, 1.0};
diffuse[] = {1.0, 1.0, 1.0, 1.0};
forcedDiffuse[] = {0.0, 0.0, 0.0, 0.0};
emmisive[] = {0.05, 0.3, 0.05, 1.0};      // Soft green glow
specular[] = {0.5, 0.5, 0.5, 1.0};
specularPower = 80;
PixelShaderID = "Super";
VertexShaderID = "Super";

// ... Stage definitions including _li emissive map in Stage7 ...
```

---

## Erros Comuns

### 1. Ordem de Stage Errada

**Sintoma:** Textura aparece embaralhada, normal map mostra como cor, cor mostra como relevos.
**Correção:** Garanta que Stage1 = normal, Stage2 = diffuse, Stage3 = specular (para o shader Super).

### 2. Grafia Errada de `emmisive`

**Sintoma:** Emissivo não funciona.
**Correção:** Bohemia usa `emmisive` (m duplo, s único). Usar a grafia correta em ingles `emissive` não funciona. Essa e uma peculiaridade historica conhecida.

### 3. Incompatibilidade de Caminho de Textura

**Sintoma:** Modelo aparece com matérial cinza padrão ou magenta.
**Correção:** Verifique se os caminhos de textura no RVMAT correspondem exatamente aos locais dos arquivos relativos a unidade P:. Caminhos usam barras invertidas. Confira capitalizacao -- alguns sistemas são case-sensitive.

### 4. Atribuicao de RVMAT Ausente no P3D

**Sintoma:** Modelo renderiza sem matérial (cinza flat ou shader padrão).
**Correção:** Abra o modelo no Object Builder, selecione faces e atribua o RVMAT via **Face Properties**.

### 5. Usando Shader Errado para Itens Transparentes

**Sintoma:** Textura transparente aparece opaca, ou toda a superfície desaparece.
**Correção:** Use o shader `Glass`, `AlphaTest` ou `AlphaBlend` em vez de `Super` para superfícies transparentes. Use texturas com sufixo `_ca` com canais alfa adequados.

---

## Boas Práticas

1. **Comece a partir de um exemplo funcional.** Copie um RVMAT dos DayZ-Samples ou de um item vanilla e modifique. Comecar do zero convida erros de digitacao.

2. **Mantenha matériais e texturas juntos.** Armazene o RVMAT no mesmo diretório `data/` que suas texturas. Isso torna a relacao obvia e simplifica o gerenciamento de caminhos.

3. **Use o shader Super a menos que tenha um motivo para não usar.** Ele lida com 95% dos casos de uso corretamente.

4. **Crie matériais de dano mesmo para itens simples.** Jogadores percebem quando itens não degradam visualmente. No mínimo, use os matériais de dano padrão vanilla para os níveis de saude mais baixos.

5. **Teste o specular no jogo, não apenas no Object Builder.** A iluminacao do editor e a iluminacao no jogo produzem resultados muito diferentes. O que parece perfeito no Object Builder pode ser muito brilhante ou muito opaco sob a iluminacao dinamica do DayZ.

6. **Documente suas configurações de matérial.** Quando encontrar valores de specular/power que funcionam bem para um tipo de superfície, registre-os. Você reutilizara essas configurações em muitos itens.

---

## Navegação

| Anterior | Acima | Próximo |
|----------|-------|---------|
| [4.2 Modelos 3D](02-models.md) | [Parte 4: Formatos de Arquivo & DayZ Tools](01-textures.md) | [4.4 Audio](04-audio.md) |
