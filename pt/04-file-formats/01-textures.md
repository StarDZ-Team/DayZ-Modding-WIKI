# Chapter 4.1: Textures (.paa, .edds, .tga)

[Home](../../README.md) | **Textures** | [Next: 3D Models >>](02-models.md)

---

## Introdução

Toda superfície que você ve no DayZ -- skins de armas, roupas, terreno, ícones de UI -- é definida por arquivos de textura. O motor do jogo usa um formato compactado proprietário chamado **PAA** em tempo de execução, mas durante o desenvolvimento você trabalha com varios formatos de origem que são convertidos durante o processo de build. Entender esses formatos, as convenções de nomenclatura por sufixo que dizem ao motor como interpretar cada textura, os requisitos de resolução é as regras de canal alfa é fundamental para criar conteúdo visual para mods de DayZ.

Este capítulo cobre todos os formatos de textura que você encontrara, o sistema de nomenclatura por sufixos que informa ao motor como interpretar cada textura, requisitos de resolução é canal alfa, é o fluxo de trabalho prático para converter entre formatos.

---

## Sumário

- [Visao Geral dos Formatos de Textura](#visao-geral-dos-formatos-de-textura)
- [Formato PAA](#formato-paa)
- [Formato EDDS](#formato-edds)
- [Formato TGA](#formato-tga)
- [Formato PNG](#formato-png)
- [Convenções de Nomenclatura de Textura](#convenções-de-nomenclatura-de-textura)
- [Requisitos de Resolução](#requisitos-de-resolução)
- [Suporte a Canal Alfa](#suporte-a-canal-alfa)
- [Convertendo Entre Formatos](#convertendo-entre-formatos)
- [Qualidade de Textura é Compressão](#qualidade-de-textura-e-compressão)
- [Exemplos Reais](#exemplos-reais)
- [Erros Comuns](#erros-comuns)
- [Boas Práticas](#boas-práticas)

---

## Visao Geral dos Formatos de Textura

O DayZ usa quatro formatos de textura em diferentes estágios do pipeline de desenvolvimento:

| Formato | Extensão | Função | Suporte a Alfa | Usado Em |
|---------|----------|--------|----------------|----------|
| **PAA** | `.paa` | Formato de execução do jogo (compactado) | Sim | Build final, distribuido em PBOs |
| **EDDS** | `.edds` | Variante DDS para editor/intermediário | Sim | Preview no Object Builder, converte automáticamente |
| **TGA** | `.tga` | Arte-fonte não compactada | Sim | Workspace do artista, exportacao do Photoshop/GIMP |
| **PNG** | `.png` | Formato de origem portátil | Sim | Texturas de UI, ferramentas externas |

O fluxo de trabalho geral e: **Origem (TGA/PNG) --> Conversão pelo DayZ Tools --> PAA (pronto para o jogo)**.

---

## Formato PAA

**PAA** (PAcked Arma) é o formato de textura compactado nativo usado pelo motor Enfusion em tempo de execução. Toda textura distribuida em um PBO deve estar no formato PAA (ou será convertida para ele durante a binarização).

### Características

- **Compactado:** Usa compressão DXT1, DXT5 ou ARGB8888 internamente, dependendo da presenca do canal alfa é das configurações de qualidade.
- **Com mipmaps:** Arquivos PAA contem uma cadeia completa de mipmaps, gerada automáticamente durante a conversão. Isso é crítico para o desempenho de renderizacao -- o motor seleciona o nível de mip apropriado com base na distancia.
- **Dimensoes em potencia de dois:** O motor exige que texturas PAA tenham dimensoes que sejam potencias de 2 (256, 512, 1024, 2048, 4096).
- **Somente leitura em tempo de execução:** O motor carrega arquivos PAA diretamente dos PBOs. Você nunca edita um arquivo PAA -- você edita a origem é reconverte.

### Tipos de Compressão Interna

| Tipo | Alfa | Qualidade | Caso de Uso |
|------|------|-----------|-------------|
| **DXT1** | Não (1-bit) | Boa, taxa 6:1 | Texturas opacas, terreno |
| **DXT5** | Total 8-bit | Boa, taxa 4:1 | Texturas com alfa suave (vidro, folhagem) |
| **ARGB4444** | Total 4-bit | Media | Texturas de UI, ícones pequenos |
| **ARGB8888** | Total 8-bit | Sem perda | Debug, qualidade máxima (tamanho de arquivo grande) |
| **AI88** | Escala de cinza + alfa | Boa | Normal maps, mascaras em escala de cinza |

### Quando Você Encontrara Arquivos PAA

- Dentro dos dados vanilla descompactados do jogo (diretório `dta/` é PBOs de addon)
- Como saida da conversão do TexView2
- Como saida do Binarize ao processar texturas de origem
- No PBO final do seu mod após o build

---

## Formato EDDS

**EDDS** é um formato de textura intermediário usado principalmente pelo **Object Builder** do DayZ é pelas ferramentas do editor. E essencialmente uma variante do formato padrão DirectDraw Surface (DDS) com metadados específicos do motor.

### Características

- **Formato de preview:** O Object Builder pode exibir texturas EDDS diretamente, tornando-as úteis durante a criacao de modelos.
- **Converte automáticamente para PAA:** Quando você executa o Binarize ou AddonBuilder (sem `-packonly`), arquivos EDDS na sua árvore de origem são automáticamente convertidos para PAA.
- **Maior que PAA:** Arquivos EDDS não são otimizados para distribuição -- existem por conveniencia do editor.
- **Formato do DayZ-Samples:** Os exemplos oficiais DayZ-Samples fornecidos pela Bohemia usam texturas EDDS extensivamente.

### Fluxo de Trabalho com EDDS

```
Artista cria TGA/PNG de origem
    --> Plugin DDS do Photoshop exporta EDDS para preview
        --> Object Builder exibe EDDS no modelo
            --> Binarize converte EDDS para PAA no PBO
```

> **Dica:** Você pode pular completamente o EDDS se preferir. Converta suas texturas de origem diretamente para PAA usando o TexView2 é referencie os caminhos PAA nos seus matériais. EDDS é uma conveniencia, não um requisito.

---

## Formato TGA

**TGA** (Truevision TGA / Targa) é o formato de origem não compactado tradicional para trabalho com texturas do DayZ. Muitas texturas vanilla do DayZ foram originalmente criadas como arquivos TGA.

### Características

- **Não compactado:** Sem perda de qualidade, profundidade de cor total (24-bit ou 32-bit com alfa).
- **Tamanhos de arquivo grandes:** Um TGA 2048x2048 com alfa tem aproximadamente 16 MB.
- **Alfa em canal dedicado:** TGA suporta um canal alfa de 8 bits (TGA 32-bit), que mapeia diretamente para transparência no PAA.
- **Compativel com TexView2:** O TexView2 pode abrir arquivos TGA diretamente é converte-los para PAA.

### Quando Usar TGA

- Como seu arquivo-mestre de origem para texturas que você cria do zero.
- Ao exportar do Substance Painter ou Photoshop para DayZ.
- Quando a documentação do DayZ-Samples ou tutoriais da comunidade específicam TGA como formato de origem.

### Configurações de Exportacao TGA

Ao exportar TGA para conversão no DayZ:

- **Profundidade de bits:** 32-bit (se alfa for necessário) ou 24-bit (texturas opacas)
- **Compressão:** Nenhuma (não compactado)
- **Orientação:** Origem no canto inferior esquerdo (orientação padrão do TGA)
- **Resolução:** Deve ser potencia de 2 (veja [Requisitos de Resolução](#requisitos-de-resolução))

---

## Formato PNG

**PNG** (Portable Network Graphics) é amplamente suportado é pode ser usado como formato de origem alternativo, particularmente para texturas de UI.

### Características

- **Compressão sem perda:** Menor que TGA, mas mantem qualidade total.
- **Canal alfa completo:** PNG 32-bit suporta alfa de 8 bits.
- **Compativel com TexView2:** O TexView2 pode abrir é converter PNG para PAA.
- **Ideal para UI:** Muitos imagesets é ícones de UI em mods usam PNG como formato de origem.

### Quando Usar PNG

- **Texturas é ícones de UI:** PNG é a escolha prática para imagesets é elementos de HUD.
- **Retexturas simples:** Quando você precisa apenas de um mapa de cor/diffuse sem alfa complexo.
- **Fluxos de trabalho multi-ferramenta:** PNG é universalmente suportado entre editores de imagem, ferramentas web é scripts.

> **Nota:** PNG não é um formato de origem oficial da Bohemia -- eles preferem TGA. Porem, as ferramentas de conversão lidam com PNG sem problemas é muitos modders o utilizam com sucesso.

---

## Convenções de Nomenclatura de Textura

O DayZ usa um sistema rigoroso de sufixos para identificar a função de cada textura. O motor é os matériais referênciam texturas pelo nome do arquivo, é o sufixo informa tanto ao motor quanto a outros modders que tipo de dados a textura contem.

### Sufixos Obrigatórios

| Sufixo | Nome Completo | Propósito | Formato Típico |
|--------|---------------|-----------|----------------|
| `_co` | **Color / Diffuse** | A cor base (albedo) de uma superfície | RGB, alfa opcional |
| `_nohq` | **Normal Map (High Quality)** | Normais de detalhe de superfície, define relevos é sulcos | RGB (normal em espaco tangente) |
| `_smdi` | **Specular / Metallic / Detail Index** | Controla brilho é propriedades metálicas | Canais RGB codificam dados separados |
| `_ca` | **Color with Alpha** | Textura de cor onde o canal alfa carrega dados significativos (transparência, mascara) | RGBA |
| `_as` | **Ambient Shadow** | Oclusao ambiental / shadow bake | Escala de cinza |
| `_mc` | **Macro** | Variacao de cor em larga escala visível a distancia | RGB |
| `_li` | **Light / Emissive** | Mapa de auto-iluminacao (partes que brilham) | RGB |
| `_no` | **Normal Map (Standard)** | Variante de normal map de qualidade inferior | RGB |
| `_mca` | **Macro with Alpha** | Textura macro com canal alfa | RGBA |
| `_de` | **Detail** | Textura de detalhe com repetição para variacao de superfície em close | RGB |

### Convencao de Nomenclatura na Pratica

Um único item típicamente tem múltiplas texturas, todas compartilhando um nome base:

```
data/
  my_rifle_co.paa          <-- Cor base (o que voce ve)
  my_rifle_nohq.paa        <-- Normal map (relevos da superficie)
  my_rifle_smdi.paa         <-- Specular/metallic (brilho)
  my_rifle_as.paa           <-- Ambient shadow (AO baked)
  my_rifle_ca.paa           <-- Cor com alfa (se transparencia for necessaria)
```

### Os Canais do _smdi

A textura specular/metallic/detail empacota três fluxos de dados em uma única imagem RGB:

| Canal | Dados | Faixa | Efeito |
|-------|-------|-------|--------|
| **R** | Metalico | 0-255 | 0 = nao-metal, 255 = totalmente metálico |
| **G** | Rugosidade (specular invertido) | 0-255 | 0 = rugoso/fosco, 255 = liso/brilhante |
| **B** | Indice de detalhe / AO | 0-255 | Repetição de detalhe ou oclusao ambiental |

### Os Canais do _nohq

Normal maps no DayZ usam codificacao em espaco tangente:

| Canal | Dados |
|-------|-------|
| **R** | Normal do eixo X (esquerda-direita) |
| **G** | Normal do eixo Y (cima-baixo) |
| **B** | Normal do eixo Z (em direção ao observador) |
| **A** | Potencia specular (opcional, depende do matérial) |

---

## Requisitos de Resolução

O motor Enfusion exige que todas as texturas tenham **dimensoes em potencia de dois**. Tanto a largura quanto a altura devem ser independentemente uma potencia de 2, mas não precisam ser iguais (texturas nao-quadradas são válidas).

### Dimensoes Validas

| Tamanho | Uso Típico |
|---------|------------|
| **64x64** | Ícones minusculos, elementos de UI |
| **128x128** | Ícones pequenos, miniaturas de inventario |
| **256x256** | Paineis de UI, texturas de itens pequenos |
| **512x512** | Texturas de itens padrão, roupas |
| **1024x1024** | Armas, roupas detalhadas, peças de veículos |
| **2048x2048** | Armas de alto detalhe, modelos de personagens |
| **4096x4096** | Texturas de terreno, texturas de veículos grandes |

### Texturas Nao-Quadradas

Texturas nao-quadradas com potencia de dois são válidas:

```
256x512    -- Valido (ambos sao potencias de 2)
512x1024   -- Valido
1024x2048  -- Valido
300x512    -- INVALIDO (300 nao e potencia de 2)
```

### Diretrizes de Resolução

- **Armas:** 2048x2048 para o corpo principal, 1024x1024 para acessórios.
- **Roupas:** 1024x1024 ou 2048x2048 dependendo da área de cobertura da superfície.
- **Ícones de UI:** 128x128 ou 256x256 para ícones de inventario, 64x64 para elementos de HUD.
- **Terreno:** 4096x4096 para mapas de satélite, 512x512 ou 1024x1024 para tiles de matérial.
- **Normal maps:** Mesma resolução da textura de cor correspondente.
- **Mapas SMDI:** Mesma resolução da textura de cor correspondente.

> **Aviso:** Se uma textura tiver dimensoes que não sejam potencia de dois, o motor ira recusar carrega-la ou exibir uma textura de erro magenta. O TexView2 mostrara um aviso durante a conversão.

---

## Suporte a Canal Alfa

O canal alfa em uma textura carrega dados adicionais além da cor. Como ele é interpretado depende do sufixo da textura é do shader do matérial.

### Funcoes do Canal Alfa

| Sufixo | Interpretacao do Alfa |
|--------|-----------------------|
| `_co` | Geralmente não usado; se presente, pode definir transparência para matériais simples |
| `_ca` | Mascara de transparência (0 = totalmente transparente, 255 = totalmente opaco) |
| `_nohq` | Mapa de potencia specular (maior = reflexo specular mais nítido) |
| `_smdi` | Geralmente não usado |
| `_li` | Mascara de intensidade emissiva |

### Criando Texturas com Alfa

No seu editor de imagem (Photoshop, GIMP, Krita):

1. Crie o conteúdo RGB normalmente.
2. Adicione um canal alfa.
3. Pinte branco (255) onde você quer opacidade/efeito total, preto (0) onde não quer nada.
4. Exporte como TGA 32-bit ou PNG.
5. Converta para PAA usando o TexView2 -- ele detectara o canal alfa automáticamente.

### Verificando Alfa no TexView2

Abra o PAA no TexView2 é use os botoes de exibicao de canal:

- **RGBA** -- Mostra o composto final
- **RGB** -- Mostra apenas a cor
- **A** -- Mostra apenas o canal alfa (branco = opaco, preto = transparente)

---

## Convertendo Entre Formatos

### TexView2 (Ferramenta Principal)

**TexView2** esta incluido no DayZ Tools é e o utilitário padrão de conversão de texturas.

**Abrindo um arquivo:**
1. Abra o TexView2 a partir do DayZ Tools ou diretamente de `DayZ Tools\Bin\TexView2\TexView2.exe`.
2. Abra seu arquivo de origem (TGA, PNG ou EDDS).
3. Verifique se a imagem parece correta é confira as dimensoes.

**Convertendo para PAA:**
1. Abra a textura de origem no TexView2.
2. Va em **File --> Save As**.
3. Selecione **PAA** como formato de saida.
4. Escolha o tipo de compressão:
   - **DXT1** para texturas opacas (sem necessidade de alfa)
   - **DXT5** para texturas com transparência alfa
   - **ARGB4444** para texturas de UI pequenas onde o tamanho do arquivo importa
5. Clique em **Save**.

**Conversão em lote via linha de comando:**

```bash
# Convert a single TGA to PAA
"P:\DayZ Tools\Bin\TexView2\TexView2.exe" -i "source.tga" -o "output.paa"

# TexView2 will auto-select compression based on alpha channel presence
```

### Binarize (Automatizado)

Quando o Binarize processa o diretório de origem do seu mod, ele converte automáticamente todos os formatos de textura reconhecidos (TGA, PNG, EDDS) para PAA. Isso acontece como parte do pipeline do AddonBuilder.

**Fluxo de conversão do Binarize:**
```
source/mod_name/data/texture_co.tga
    --> Binarize detects TGA
        --> Converts to PAA with automatic compression selection
            --> Output: build/mod_name/data/texture_co.paa
```

### Tabela de Conversão Manual

| De | Para | Ferramenta | Notas |
|----|------|------------|-------|
| TGA --> PAA | TexView2 | Fluxo de trabalho padrão |
| PNG --> PAA | TexView2 | Funciona identicamente ao TGA |
| EDDS --> PAA | TexView2 ou Binarize | Automatico durante o build |
| PAA --> TGA | TexView2 (Save As TGA) | Para editar texturas existentes |
| PAA --> PNG | TexView2 (Save As PNG) | Para extrair para formato portátil |
| PSD --> TGA/PNG | Photoshop/GIMP | Exporte do editor, depois converta |

---

## Qualidade de Textura é Compressão

### Seleção do Tipo de Compressão

| Cenario | Compressão Recomendada | Motivo |
|---------|------------------------|--------|
| Diffuse opaco (`_co`) | DXT1 | Melhor taxa, sem necessidade de alfa |
| Diffuse transparente (`_ca`) | DXT5 | Suporte completo a alfa |
| Normal maps (`_nohq`) | DXT5 | Canal alfa carrega potencia specular |
| Mapas specular (`_smdi`) | DXT1 | Geralmente opaco, apenas canais RGB |
| Texturas de UI | ARGB4444 ou DXT5 | Tamanho pequeno, bordas nítidas |
| Mapas emissivos (`_li`) | DXT1 ou DXT5 | DXT5 se o alfa carrega intensidade |

### Qualidade vs. Tamanho do Arquivo

```
Format        2048x2048 approx. size
-----------------------------------------
ARGB8888      16.0 MB    (uncompressed)
DXT5           5.3 MB    (4:1 compression)
DXT1           2.7 MB    (6:1 compression)
ARGB4444       8.0 MB    (2:1 compression)
```

### Configurações de Qualidade no Jogo

Os jogadores podem ajustar a qualidade da textura nas configurações de video do DayZ. O motor seleciona níveis de mip mais baixos quando a qualidade é reduzida, então suas texturas parecerão progressivamente mais borradas em configurações mais baixas. Isso é automático -- você não precisa criar níveis de qualidade separados.

---

## Exemplos Reais

### Conjunto de Texturas de Arma

Um mod de arma típico contem estes arquivos de textura:

```
MyWeapons/data/weapons/m4a1/
  my_weapon_co.paa           <-- 2048x2048, DXT1, base color
  my_weapon_nohq.paa         <-- 2048x2048, DXT5, normal map
  my_weapon_smdi.paa          <-- 2048x2048, DXT1, specular/metallic
  my_weapon_as.paa            <-- 1024x1024, DXT1, ambient shadow
```

O arquivo de matérial (`.rvmat`) referência essas texturas é as atribui aos estágios do shader.

### Textura de UI (Origem do Imageset)

```
MyFramework/data/gui/icons/
  my_icons_co.paa           <-- 512x512, ARGB4444, sprite atlas
```

Texturas de UI são frequentemente empacotadas em um único atlas (imageset) é referênciadas por nome nos arquivos de layout. Compressão ARGB4444 é comum para UI porque preserva bordas nítidas mantendo tamanhos de arquivo pequenos.

### Texturas de Terreno

```
terrain/
  grass_green_co.paa         <-- 1024x1024, DXT1, tiling color
  grass_green_nohq.paa       <-- 1024x1024, DXT5, tiling normal
  grass_green_smdi.paa        <-- 1024x1024, DXT1, tiling specular
  grass_green_mc.paa          <-- 512x512, DXT1, macro variation
  grass_green_de.paa          <-- 512x512, DXT1, detail tiling
```

Texturas de terreno se repetem pela paisagem. A textura macro `_mc` adiciona variacao de cor em larga escala para evitar repetição.

---

## Erros Comuns

### 1. Dimensoes Não Potencia de Dois

**Sintoma:** Textura magenta no jogo, avisos no TexView2.
**Correção:** Redimensione sua origem para a potencia de 2 mais proxima antes de converter.

### 2. Sufixo Ausente

**Sintoma:** O matérial não encontra a textura, ou ela renderiza incorretamente.
**Correção:** Sempre inclua o sufixo adequado (`_co`, `_nohq`, etc.) no nome do arquivo.

### 3. Compressão Errada para Alfa

**Sintoma:** Transparencia parece blocada ou binária (ligado/desligado sem gradiente).
**Correção:** Use DXT5 em vez de DXT1 para texturas que precisam de gradientes alfa suaves.

### 4. Esquecendo Mipmaps

**Sintoma:** Textura fica bem de perto, mas cintila/brilha a distancia.
**Correção:** Arquivos PAA gerados pelo TexView2 incluem mipmaps automáticamente. Se você estiver usando uma ferramenta não padrão, certifique-se de que a geracao de mipmaps esta habilitada.

### 5. Formato Incorreto do Normal Map

**Sintoma:** Iluminacao no modelo parece invertida ou achatada.
**Correção:** Certifique-se de que seu normal map esta no formato de espaco tangente com convencao de eixo Y estilo DirectX (canal verde: para cima = mais claro). Algumas ferramentas exportam estilo OpenGL (Y invertido) -- você precisa inverter o canal verde.

### 6. Incompatibilidade de Caminho Apos Conversão

**Sintoma:** Modelo ou matérial mostra magenta porque referência um caminho `.tga`, mas o PBO contem `.paa`.
**Correção:** Matériais devem referênciar o caminho final `.paa`. O Binarize lida com o remapeamento de caminhos automáticamente, mas se você empacotar com `-packonly` (sem binarização), você deve garantir que os caminhos combinem exatamente.

---

## Boas Práticas

1. **Mantenha os arquivos de origem no controle de versao.** Armazene os mestrês TGA/PNG junto com seu mod. Os arquivos PAA são saida gerada -- as origens são o que importa.

2. **Combine a resolução com a importancia.** Um rifle que o jogador olha por horas merece 2048x2048. Uma lata de feijao no fundo de uma pratéleira pode usar 512x512.

3. **Sempre forneca um normal map.** Mesmo um normal map plano (128, 128, 255 em preenchimento sólido) é melhor do que nenhum -- normal maps ausentes causam erros de matérial.

4. **Nomeie consistentemente.** Um nome base, múltiplos sufixos: `myitem_co.paa`, `myitem_nohq.paa`, `myitem_smdi.paa`. Nunca misture esquemas de nomenclatura.

5. **Faca preview no TexView2 antes do build.** Abra sua saida PAA é verifique se parece correta. Confira cada canal individualmente.

6. **Use DXT1 por padrão, DXT5 somente quando alfa for necessário.** DXT1 tem metade do tamanho do arquivo do DXT5 é parece identico para texturas opacas.

7. **Teste em configurações de qualidade baixa.** O que fica otimo em Ultra pode ficar ilegivel em Low porque o motor descarta níveis de mip agressivamente.

---

## Navegação

| Anterior | Acima | Próximo |
|----------|-------|---------|
| [Parte 3: Sistema GUI](../03-gui-system/07-styles-fonts.md) | [Parte 4: Formatos de Arquivo & DayZ Tools](../04-file-formats/01-textures.md) | [4.2 Modelos 3D](02-models.md) |
