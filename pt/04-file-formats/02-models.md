# Chapter 4.2: 3D Models (.p3d)

[Home](../../README.md) | [<< Previous: Textures](01-textures.md) | **3D Models** | [Next: Matérials >>](03-matérials.md)

---

## Introdução

Todo objeto físico no DayZ -- armas, roupas, edificios, veículos, árvores, pedras -- é um modelo 3D armazenado no formato proprietário **P3D** da Bohemia. O formato P3D é muito mais do que um container de malha: ele codifica múltiplos níveis de detalhe, geometria de colisao, selecoes de animação, pontos de memória para acessórios é efeitos, é posicoes de proxy para itens montaveis. Entender como os arquivos P3D funcionam é como cria-los com o **Object Builder** é essencial para qualquer mod que adicione itens físicos ao mundo do jogo.

Este capítulo cobre a estrutura do formato P3D, o sistema de LODs, selecoes nomeadas, pontos de memória, o sistema de proxy, configuração de animação via `model.cfg`, é o fluxo de importação a partir de formatos 3D padrão.

---

## Sumário

- [Visao Geral do Formato P3D](#visao-geral-do-formato-p3d)
- [Object Builder](#object-builder)
- [O Sistema de LODs](#o-sistema-de-lods)
- [Selecoes Nomeadas](#selecoes-nomeadas)
- [Pontos de Memória](#pontos-de-memória)
- [O Sistema de Proxy](#o-sistema-de-proxy)
- [Model.cfg para Animações](#modelcfg-para-animações)
- [Importando de FBX/OBJ](#importando-de-fbxobj)
- [Tipos Comuns de Modelo](#tipos-comuns-de-modelo)
- [Erros Comuns](#erros-comuns)
- [Boas Práticas](#boas-práticas)

---

## Visao Geral do Formato P3D

**P3D** (Point 3D) é o formato binário de modelo 3D da Bohemia Interactive, herdado do motor Real Virtuality é mantido no Enfusion. E um formato compilado é pronto para o motor -- você não escreve arquivos P3D manualmente.

### Características Principais

- **Formato binário:** Não é legivel por humanos. Criado é editado exclusivamente com o Object Builder.
- **Container multi-LOD:** Um único arquivo P3D contem múltiplas malhas LOD (Level of Detail), cada uma com um propósito diferente.
- **Nativo do motor:** O motor do DayZ carrega P3D diretamente. Nenhuma conversão em tempo de execução ocorre.
- **Binarizado vs. nao-binarizado:** Arquivos P3D de origem do Object Builder são "MLOD" (editaveis). O Binarize os converte para "ODOL" (otimizado, somente leitura). O jogo pode carregar ambos, mas ODOL carrega mais rapido é e menor.

### Tipos de Arquivo que Você Encontrara

| Extensão | Descrição |
|----------|-----------|
| `.p3d` | Modelo 3D (tanto MLOD de origem quanto ODOL binarizado) |
| `.rtm` | Runtime Motion -- dados de keyframe de animação |
| `.bisurf` | Arquivo de propriedades de superfície (usado junto com P3D) |

### MLOD vs. ODOL

| Propriedade | MLOD (Origem) | ODOL (Binarizado) |
|-------------|---------------|-------------------|
| Criado por | Object Builder | Binarize |
| Editavel | Sim | Não |
| Tamanho do arquivo | Maior | Menor |
| Velocidade de carregamento | Mais lento | Mais rapido |
| Usado durante | Desenvolvimento | Distribuição |
| Contem | Dados completos de edicao, selecoes nomeadas | Dados de malha otimizados |

> **Importante:** Quando você empacota um PBO com binarização habilitada, seus arquivos P3D MLOD são automáticamente convertidos para ODOL. Se você empacotar com `-packonly`, os arquivos MLOD são incluidos como estao. Ambos funcionam no jogo, mas ODOL é preferido para builds de distribuição.

---

## Object Builder

**Object Builder** é a ferramenta fornecida pela Bohemia para criar é editar modelos P3D. Esta incluido no pacote DayZ Tools no Steam.

### Capacidades Principais

- Criar é editar malhas 3D com vertices, arestas é faces.
- Definir múltiplos LODs dentro de um único arquivo P3D.
- Atribuir **selecoes nomeadas** (grupos de vertices/faces) para animação é controle de textura.
- Posicionar **pontos de memória** para posicoes de acessórios, origens de particulas é fontes de som.
- Adicionar **objetos proxy** para itens acoplaveis (carregadores, miras, etc.).
- Atribuir matériais (`.rvmat`) é texturas (`.paa`) a faces.
- Importar malhas dos formatos FBX, OBJ é 3DS.
- Exportar arquivos P3D validados para o Binarize.

### Configuração do Workspace

O Object Builder requer a **unidade P:** (workdrive) configurada. Esta unidade virtual fornece um prefixo de caminho unificado que o motor usa para localizar assets.

```
P:\
  DZ\                        <-- Vanilla DayZ data (extracted)
  DayZ Tools\                <-- Tools installation
  MyMod\                     <-- Your mod's source directory
    data\
      models\
        my_item.p3d
      textures\
        my_item_co.paa
```

Todos os caminhos em arquivos P3D é matériais são relativos a raiz da unidade P:. Por exemplo, uma referência de matérial dentro do modelo seria `MyMod\data\textures\my_item_co.paa`.

### Fluxo de Trabalho Basico no Object Builder

1. **Crie ou importe** sua geometria de malha.
2. **Defina LODs** -- no mínimo, crie LODs de Resolution, Geometry é Fire Geometry.
3. **Atribua matériais** a faces no LOD Resolution.
4. **Nomeie selecoes** para quaisquer partes que animam, trocam texturas ou precisam de interação via código.
5. **Posicione pontos de memória** para acessórios, posicoes de flash de boca, portas de ejecao, etc.
6. **Adicione proxies** para itens que podem ser acoplados (miras, carregadores, supressores).
7. **Valide** usando a validação integrada do Object Builder (Structure --> Validate).
8. **Salve** como P3D.
9. **Faca o build** via Binarize ou AddonBuilder.

---

## O Sistema de LODs

Um arquivo P3D contem múltiplos **LODs** (Levels of Detail), cada um servindo a um propósito específico. O motor seleciona qual LOD usar com base na situacao -- distancia da camera, calculos de física, renderizacao de sombras, etc.

### Tipos de LOD

| LOD | Valor de Resolução | Propósito |
|-----|---------------------|-----------|
| **Resolution 0** | 1.000 | Malha visual de maior detalhe. Renderizado quando o objeto esta próximo da camera. |
| **Resolution 1** | 1.100 | Detalhe medio. Renderizado a distancia moderada. |
| **Resolution 2** | 1.200 | Detalhe baixo. Renderizado a distancia longa. |
| **Resolution 3+** | 1.300+ | LODs de distancia adicionais. |
| **View Geometry** | Especial | Determina o que bloqueia a visao do jogador (primeira pessoa). Malha simplificada. |
| **Fire Geometry** | Especial | Colisao para balas é projeteis. Deve ser convexo ou composto por partes convexas. |
| **Geometry** | Especial | Colisao de física. Usado para colisao de movimento, gravidade, posicionamento. Deve ser convexo ou composto por decomposição convexa. |
| **Shadow 0** | Especial | Malha de projecao de sombra (curta distancia). |
| **Shadow 1000** | Especial | Malha de projecao de sombra (longa distancia). Mais simples que Shadow 0. |
| **Memory** | Especial | Contem apenas pontos nomeados (sem geometria visível). Usado para posicoes de acessórios, origens de som, etc. |
| **Roadway** | Especial | Define superfícies caminhaveis em objetos (veículos, edificios com interiores acessiveis). |
| **Paths** | Especial | Dicas de pathfinding de IA para edificios. |

### Valores de Resolução de LOD (LODs Visuais)

O motor usa uma formula baseada em distancia é tamanho do objeto para determinar qual LOD visual renderizar:

```
LOD selected = (distance_to_object * LOD_factor) / object_bounding_sphere_radius
```

Valores mais baixos = camera mais proxima. O motor encontra o LOD cujo valor de resolução é a correspondencia mais proxima ao valor calculado.

### Criando LODs no Object Builder

1. **File --> New LOD** ou clique com o botao direito na lista de LODs.
2. Selecione o tipo de LOD no dropdown.
3. Para LODs visuais (Resolution), insira o valor de resolução.
4. Modele a geometria para aquele LOD.

### Requisitos de LOD por Tipo de Item

| Tipo de Item | LODs Obrigatórios | LODs Adicionais Recomendados |
|--------------|-------------------|------------------------------|
| **Item de mao** | Resolution 0, Geometry, Fire Geometry, Memory | Shadow 0, Resolution 1 |
| **Roupa** | Resolution 0, Geometry, Fire Geometry, Memory | Shadow 0, Resolution 1, Resolution 2 |
| **Arma** | Resolution 0, Geometry, Fire Geometry, View Geometry, Memory | Shadow 0, Resolution 1, Resolution 2 |
| **Edificio** | Resolution 0, Geometry, Fire Geometry, View Geometry, Memory | Shadow 0, Shadow 1000, Roadway, Paths |
| **Veículo** | Resolution 0, Geometry, Fire Geometry, View Geometry, Memory | Shadow 0, Roadway, Resolution 1+ |

### Regras do LOD Geometry

Os LODs Geometry é Fire Geometry possuem requisitos rigorosos:

- **Devem ser convexos** ou compostos por múltiplos componentes convexos. O sistema de física do motor requer formas de colisao convexas.
- **Selecoes nomeadas devem combinar** com as do LOD Resolution (para partes animadas).
- **Massa deve ser definida.** Selecione todos os vertices no LOD Geometry é atribua massa via **Structure --> Mass**. Isso determina o peso físico do objeto.
- **Mantenha simples.** Menos triangulos = melhor desempenho de física. O LOD geometry de uma arma pode ter 20-50 triangulos vs. milhares no LOD visual.

---

## Selecoes Nomeadas

Selecoes nomeadas são grupos de vertices, arestas ou faces dentro de um LOD que são marcados com um nome. Elas servem como handles que o motor é scripts usam para manipular partes de um modelo.

### O Que Selecoes Nomeadas Fazem

| Propósito | Exemplo de Nome de Seleção | Usado Por |
|-----------|----------------------------|-----------|
| **Animação** | `bolt`, `trigger`, `magazine` | Fontes de animação do `model.cfg` |
| **Troca de texturas** | `camo`, `camo1`, `body` | `hiddenSelections[]` no config.cpp |
| **Texturas de dano** | `zbytek` | Sistema de dano do motor, trocas de matérial |
| **Pontos de acoplamento** | `magazine`, `optics`, `suppressor` | Sistema de proxy é acessórios |

### hiddenSelections (Troca de Texturas)

O uso mais comum de selecoes nomeadas para modders é **hiddenSelections** -- a capacidade de trocar texturas em tempo de execução via config.cpp.

**No modelo P3D (LOD Resolution):**
1. Selecione as faces que devem ser retexturaveis.
2. Nomeie a seleção (ex.: `camo`).

**No config.cpp:**
```cpp
class MyRifle: Rifle_Base
{
    hiddenSelections[] = {"camo"};
    hiddenSelectionsTextures[] = {"MyMod\data\my_rifle_co.paa"};
    hiddenSelectionsMaterials[] = {"MyMod\data\my_rifle.rvmat"};
};
```

Isso permite variantes diferentes do mesmo modelo com texturas diferentes sem duplicar o arquivo P3D.

### Criando Selecoes Nomeadas

No Object Builder:

1. Selecione os vertices ou faces que deseja agrupar.
2. Va em **Structure --> Named Selections** (ou pressione Ctrl+N).
3. Clique em **New**, insira o nome da seleção.
4. Clique em **Assign** para marcar a geometria selecionada com aquele nome.

> **Dica:** Nomes de seleção são case-sensitive. `Camo` é `camo` são selecoes diferentes. A convencao é usar minusculas.

### Selecoes Entre LODs

Selecoes nomeadas devem ser consistentes entre LODs para que as animações funcionem:

- Se a seleção `bolt` existe no Resolution 0, ela também deve existir nos LODs Geometry é Fire Geometry (cobrindo a geometria de colisao correspondente).
- LODs de Shadow também devem ter a seleção se a parte animada deve projetar sombras corretas.

---

## Pontos de Memória

Pontos de memória são posicoes nomeadas definidas no **LOD Memory**. Eles não possuem representacao visual no jogo -- definem coordenadas espaciais que o motor é scripts referênciam para posicionar efeitos, acessórios, sons é mais.

### Pontos de Memória Comuns

| Nome do Ponto | Propósito |
|----------------|-----------|
| `usti hlavne` | Posição do cano (onde as balas originam, flash de boca aparece) |
| `konec hlavne` | Fim do cano (usado com `usti hlavne` para definir direção do cano) |
| `nabojnicestart` | Inicio da porta de ejecao (onde estojos emergem) |
| `nabojniceend` | Fim da porta de ejecao (direção de ejecao) |
| `handguard` | Ponto de acoplamento do handguard |
| `magazine` | Posição do alojamento do carregador |
| `optics` | Posição do trilho de mira |
| `suppressor` | Posição de montagem do supressor |
| `trigger` | Posição do gatilho (para IK da mao) |
| `pistolgrip` | Posição do punho (para IK da mao) |
| `lefthand` | Posição de empunhadura da mao esquerda |
| `righthand` | Posição de empunhadura da mao direita |
| `eye` | Posição do olho (para alinhamento de visao em primeira pessoa) |
| `pilot` | Posição do assento do motorista/piloto (veículos) |
| `light_l` / `light_r` | Posicoes do farol esquerdo/direito (veículos) |

### Pontos de Memória Direcionais

Muitos efeitos precisam tanto de uma posição quanto de uma direção. Isso é alcancado com pares de pontos de memória:

```
usti hlavne  ------>  konec hlavne
(muzzle start)        (muzzle end)

The direction vector is: konec hlavne - usti hlavne
```

### Criando Pontos de Memória no Object Builder

1. Mude para o **LOD Memory** na lista de LODs.
2. Crie um vertice na posição desejada.
3. Nomeie-o via **Structure --> Named Selections**: crie uma seleção com o nome do ponto é atribua o vertice único a ela.

> **Nota:** O LOD Memory deve conter APENAS pontos nomeados (vertices individuais). Não crie faces ou arestas no LOD Memory.

---

## O Sistema de Proxy

Proxies definem posicoes onde outros modelos P3D podem ser acoplados. Quando você ve um carregador inserido em uma arma, uma mira montada em um trilho, ou um supressor parafusado em um cano -- esses são modelos acoplados por proxy.

### Como Proxies Funcionam

Um proxy é uma referência especial colocada no LOD Resolution que aponta para outro arquivo P3D. O motor renderiza o modelo referênciado pelo proxy na posição é orientação do proxy.

### Convencao de Nomenclatura de Proxy

Nomes de proxy seguem o padrão: `proxy:\path\to\model.p3d`

Para proxies de acessórios em armas, os nomes padrão sao:

| Caminho do Proxy | Tipo de Acessorio |
|------------------|-------------------|
| `proxy:\dz\weapons\attachments\magazine\mag_placeholder.p3d` | Slot de carregador |
| `proxy:\dz\weapons\attachments\optics\optic_placeholder.p3d` | Trilho de mira |
| `proxy:\dz\weapons\attachments\suppressor\sup_placeholder.p3d` | Montagem de supressor |
| `proxy:\dz\weapons\attachments\handguard\handguard_placeholder.p3d` | Slot de handguard |
| `proxy:\dz\weapons\attachments\stock\stock_placeholder.p3d` | Slot de coronha |

### Adicionando Proxies no Object Builder

1. No LOD Resolution, posicione o cursor 3D onde o acessório deve aparecer.
2. Va em **Structure --> Proxy --> Create**.
3. Insira o caminho do proxy (ex.: `dz\weapons\attachments\magazine\mag_placeholder.p3d`).
4. O proxy aparece como uma pequena seta indicando posição é orientação.
5. Rotacione é posicione o proxy para alinhar corretamente com a geometria do acessório.

### Indice do Proxy

Cada proxy tem um número de índice (comecando em 1). Quando um modelo tem múltiplos proxies do mesmo tipo, o índice os diferencia. O índice é referênciado no config.cpp:

```cpp
class MyWeapon: Rifle_Base
{
    class Attachments
    {
        class magazine
        {
            type = "magazine";
            proxy = "proxy:\dz\weapons\attachments\magazine\mag_placeholder.p3d";
            proxyIndex = 1;
        };
    };
};
```

---

## Model.cfg para Animações

O arquivo `model.cfg` define animações para modelos P3D. Ele mapeia fontes de animação (controladas pela logica do jogo) para transformacoes em selecoes nomeadas.

### Estrutura Basica

```cpp
class CfgModels
{
    class Default
    {
        sectionsInherit = "";
        sections[] = {};
        skeletonName = "";
    };

    class MyRifle: Default
    {
        skeletonName = "MyRifle_skeleton";
        sections[] = {"camo"};

        class Animations
        {
            class bolt_move
            {
                type = "translation";
                source = "reload";        // Engine animation source
                selection = "bolt";       // Named selection in P3D
                axis = "bolt_axis";       // Axis memory point pair
                memory = 1;               // Axis defined in Memory LOD
                minValue = 0;
                maxValue = 1;
                offset0 = 0;
                offset1 = 0.05;           // 5cm translation
            };

            class trigger_move
            {
                type = "rotation";
                source = "trigger";
                selection = "trigger";
                axis = "trigger_axis";
                memory = 1;
                minValue = 0;
                maxValue = 1;
                angle0 = 0;
                angle1 = -0.4;            // Radians
            };
        };
    };
};

class CfgSkeletons
{
    class Default
    {
        isDiscrete = 0;
        skeletonInherit = "";
        skeletonBones[] = {};
    };

    class MyRifle_skeleton: Default
    {
        skeletonBones[] =
        {
            "bolt", "",          // "bone_name", "parent_bone" ("" = root)
            "trigger", "",
            "magazine", ""
        };
    };
};
```

### Tipos de Animação

| Tipo | Palavra-chave | Movimento | Controlado Por |
|------|---------------|-----------|----------------|
| **Translação** | `translation` | Movimento linear ao longo de um eixo | `offset0` / `offset1` (metros) |
| **Rotação** | `rotation` | Rotação em torno de um eixo | `angle0` / `angle1` (radianos) |
| **RotationX/Y/Z** | `rotationX` | Rotação em torno de um eixo fixo do mundo | `angle0` / `angle1` |
| **Ocultar** | `hide` | Mostrar/ocultar uma seleção | Limiar `hideValue` |

### Fontes de Animação

Fontes de animação são valores fornecidos pelo motor que controlam as animações:

| Fonte | Faixa | Descrição |
|-------|-------|-----------|
| `reload` | 0-1 | Fase de recarga da arma |
| `trigger` | 0-1 | Puxar do gatilho |
| `zeroing` | 0-N | Configuração de zeragem da arma |
| `isFlipped` | 0-1 | Estado de virada da mira de ferro |
| `door` | 0-1 | Porta aberta/fechada |
| `rpm` | 0-N | RPM do motor do veículo |
| `speed` | 0-N | Velocidade do veículo |
| `fuel` | 0-1 | Nivel de combustivel do veículo |
| `damper` | 0-1 | Suspensao do veículo |

---

## Importando de FBX/OBJ

A maioria dos modders cria modelos 3D em ferramentas externas (Blender, 3ds Max, Maya) é os importa para o Object Builder.

### Formatos de Importação Suportados

| Formato | Extensão | Notas |
|---------|----------|-------|
| **FBX** | `.fbx` | Melhor compatibilidade. Exporte como FBX 2013 ou posterior (binário). |
| **OBJ** | `.obj` | Wavefront OBJ. Apenas dados de malha simples (sem animações). |
| **3DS** | `.3ds` | Formato legado do 3ds Max. Limitado a 65K vertices por malha. |

### Fluxo de Importação

**Passo 1: Prepare no seu software 3D**
- O modelo deve estar centralizado na origem.
- Aplique todas as transformacoes (localização, rotação, escala).
- Escala: 1 unidade = 1 metro. O DayZ usa metros.
- Triangule a malha (o Object Builder trabalha com triangulos).
- Faca o UV unwrap do modelo.
- Exporte como FBX (binário, sem animação, Y-up ou Z-up -- o Object Builder lida com ambos).

**Passo 2: Importe para o Object Builder**
1. Abra o Object Builder.
2. **File --> Import --> FBX** (ou OBJ/3DS).
3. Revise as configurações de importação:
   - Fator de escala (deve ser 1.0 se sua origem esta em metros).
   - Conversão de eixo (Z-up para Y-up se necessário).
4. A malha aparece em um novo LOD Resolution.

**Passo 3: Configuração pos-importação**
1. Atribua matériais a faces (selecione faces, clique direito --> **Face Properties**).
2. Crie LODs adicionais (Geometry, Fire Geometry, Memory, Shadow).
3. Simplifique a geometria para LODs de colisao (remova pequenos detalhes, garanta convexidade).
4. Adicione selecoes nomeadas, pontos de memória é proxies.
5. Valide é salve.

### Dicas Especificas para Blender

- Use o addon comunitario **Blender DayZ Toolbox** se disponível -- ele agiliza as configurações de exportacao.
- Exporte com: **Apply Modifiers**, **Triangulate Faces**, **Apply Scale**.
- Defina **Forward: -Z Forward**, **Up: Y Up** no dialogo de exportacao FBX.
- Nomeie os objetos de malha no Blender para corresponder as selecoes nomeadas pretendidas -- alguns importadores preservam nomes de objeto.

---

## Tipos Comuns de Modelo

### Armas

Armas são os modelos P3D mais complexos, exigindo:
- LOD Resolution de alta poligonagem (5.000-20.000 triangulos)
- Multiplas selecoes nomeadas (bolt, trigger, magazine, camo, etc.)
- Conjunto completo de pontos de memória (cano, ejecao, posicoes de empunhadura)
- Multiplos proxies (carregador, mira, supressor, handguard, coronha)
- Skeleton é animações no model.cfg
- View Geometry para obstrucao em primeira pessoa

### Roupas

Modelos de roupa são rigged ao skeleton do personagem:
- LOD Resolution segue a estrutura de ossos do personagem
- Selecoes nomeadas para variantes de textura (`camo`, `camo1`)
- Geometria de colisao mais simples
- Sem proxies (geralmente)
- hiddenSelections para variantes de cor/camuflagem

### Edificios

Edificios possuem requisitos únicos:
- LODs Resolution grandes é detalhados
- LOD Roadway para superfícies caminhaveis (pisos, escadas)
- LOD Paths para navegação de IA
- View Geometry para evitar ver atraves das paredes
- Multiplos LODs de Shadow para desempenho em diferentes distancias
- Selecoes nomeadas para portas é janelas que abrem

### Veículos

Veículos combinam muitos sistemas:
- LOD Resolution detalhado com partes animadas (rodas, portas, capo)
- Skeleton complexo com muitos ossos
- LOD Roadway para passageiros em pe em cacambas de caminhoes
- Pontos de memória para luzes, escapamento, posição do motorista, assentos de passageiros
- Multiplos proxies para acessórios (rodas, portas)

---

## Erros Comuns

### 1. LOD Geometry Ausente

**Sintoma:** Objeto não tem colisao. Jogadores é balas passam atraves dele.
**Correção:** Crie um LOD Geometry com uma malha convexa simplificada. Atribua massa aos vertices.

### 2. Formas de Colisao Nao-Convexas

**Sintoma:** Glitches de física, objetos quicando erraticamente, itens caindo atraves de superfícies.
**Correção:** Divida formas complexas em múltiplos componentes convexos no LOD Geometry. Cada componente deve ser um sólido convexo fechado.

### 3. Selecoes Nomeadas Inconsistentes

**Sintoma:** Animações so funcionam visualmente mas não para colisao, ou sombra não anima.
**Correção:** Garanta que toda seleção nomeada que existe no LOD Resolution também exista nos LODs Geometry, Fire Geometry é Shadow.

### 4. Escala Errada

**Sintoma:** Objeto é gigantesco ou microscopico no jogo.
**Correção:** Verifique se seu software 3D usa metros como unidade. Um personagem do DayZ tem aproximadamente 1,8 metros de altura.

### 5. Pontos de Memória Ausentes

**Sintoma:** Flash de boca aparece na posição errada, acessórios flutuam no espaco.
**Correção:** Crie o LOD Memory é adicione todos os pontos nomeados necessários nas posicoes corretas.

### 6. Massa Não Definida

**Sintoma:** Objeto não pode ser pego, ou interacoes de física se comportam estranhamente.
**Correção:** Selecione todos os vertices no LOD Geometry é atribua massa via **Structure --> Mass**.

---

## Boas Práticas

1. **Comece pelo LOD Geometry.** Esboce sua forma de colisao primeiro, depois construa o detalhe visual em cima. Isso previne o erro comum de criar um modelo bonito que não consegue colidir adequadamente.

2. **Use modelos de referência.** Extraia arquivos P3D vanilla dos dados do jogo é estude-os no Object Builder. Eles mostram exatamente o que o motor espera para cada tipo de item.

3. **Valide frequentemente.** Use **Structure --> Validate** do Object Builder após cada mudanca significativa. Corrija avisos antes que se tornem bugs misteriosos no jogo.

4. **Mantenha contagens de triangulos dos LODs proporcionais.** Resolution 0 pode ter 10.000 triangulos; Resolution 1 deve ter ~5.000; Geometry deve ter ~100-500. Reducao dramatica em cada nível.

5. **Nomeie selecoes descritivamente.** Use `bolt_carrier` em vez de `sel01`. Seu eu do futuro (e outros modders) agradecerão.

6. **Teste com file patching primeiro.** Carregue seu P3D nao-binarizado via modo file patching antes de se comprometer com um build completo de PBO. Isso detecta a maioria dos problemas mais rapido.

7. **Documente pontos de memória.** Mantenha uma imagem de referência ou arquivo de texto listando todos os pontos de memória é suas posicoes pretendidas. Armas complexas podem ter 20+ pontos.

---

## Navegação

| Anterior | Acima | Próximo |
|----------|-------|---------|
| [4.1 Texturas](01-textures.md) | [Parte 4: Formatos de Arquivo & DayZ Tools](01-textures.md) | [4.3 Matériais](03-matérials.md) |
