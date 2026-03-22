# Chapter 4.5: DayZ Tools Workflow

[Home](../README.md) | [<< Previous: Audio](04-audio.md) | **DayZ Tools** | [Next: PBO Packing >>](06-pbo-packing.md)

---

## Introdução

DayZ Tools e um pacote gratuito de aplicativos de desenvolvimento distribuido pelo Steam, fornecido pela Bohemia Interactive para modders. Contem tudo necessário para criar, converter e empacotar assets do jogo: um editor de modelos 3D, visualizador de texturas, editor de terreno, depurador de scripts e o pipeline de binarização que transforma arquivos de origem legiveis por humanos em formatos otimizados prontos para o jogo. Nenhum mod de DayZ pode ser construido sem pelo menos alguma interação com essas ferramentas.

Este capítulo fornece uma visao geral de cada ferramenta do pacote, explica o sistema de unidade P: (workdrive) que sustenta todo o fluxo de trabalho, cobre file patching para iteracao rapida de desenvolvimento, e percorre o pipeline completo de assets desde arquivos de origem até mod jogavel.

---

## Sumário

- [Visao Geral do Pacote DayZ Tools](#visao-geral-do-pacote-dayz-tools)
- [Instalação e Configuração](#instalação-e-configuração)
- [Unidade P: (Workdrive)](#unidade-p-workdrive)
- [Object Builder](#object-builder)
- [TexView2](#texview2)
- [Terrain Builder](#terrain-builder)
- [Binarize](#binarize)
- [AddonBuilder](#addonbuilder)
- [Workbench](#workbench)
- [Modo File Patching](#modo-file-patching)
- [Fluxo Completo: Da Origem ao Jogo](#fluxo-completo-da-origem-ao-jogo)
- [Erros Comuns](#erros-comuns)
- [Boas Práticas](#boas-práticas)

---

## Visao Geral do Pacote DayZ Tools

DayZ Tools esta disponível como download gratuito no Steam na catégoria **Tools**. Ele instala uma colecao de aplicativos, cada um servindo a um papel específico no pipeline de modding.

| Ferramenta | Propósito | Usuarios Principais |
|------------|-----------|---------------------|
| **Object Builder** | Criacao e edicao de modelos 3D (.p3d) | Artistas 3D, modeladores |
| **TexView2** | Visualizacao e conversão de texturas (.paa, .tga, .png) | Artistas de textura, todos os modders |
| **Terrain Builder** | Criacao e edicao de terreno/mapas | Criadores de mapas |
| **Binarize** | Conversão de formato origem-para-jogo | Pipeline de build (geralmente automatizado) |
| **AddonBuilder** | Empacotamento PBO com binarização opcional | Todos os modders |
| **Workbench** | Depuração, teste é profiling de scripts | Scripters |
| **DayZ Tools Launcher** | Hub central para lancar ferramentas e configurar a unidade P: | Todos os modders |

### Onde Ficam no Disco

Apos a instalação pelo Steam, as ferramentas estao típicamente localizadas em:

```
C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\
  Bin\
    AddonBuilder\
      AddonBuilder.exe          <-- PBO packer
    Binarize\
      Binarize.exe              <-- Asset converter
    TexView2\
      TexView2.exe              <-- Texture tool
    ObjectBuilder\
      ObjectBuilder.exe         <-- 3D model editor
    Workbench\
      workbenchApp.exe          <-- Script debugger
  TerrainBuilder\
    TerrainBuilder.exe          <-- Terrain editor
```

---

## Instalação e Configuração

### Passo 1: Instale o DayZ Tools pelo Steam

1. Abra a Biblioteca do Steam.
2. Habilite o filtro **Tools** no dropdown.
3. Pesquise "DayZ Tools".
4. Instale (gratuito, aproximadamente 2 GB).

### Passo 2: Inicie o DayZ Tools

1. Inicie "DayZ Tools" pelo Steam.
2. O DayZ Tools Launcher abre -- um aplicativo hub central.
3. A partir dele você pode lancar qualquer ferramenta individual e configurar opcoes.

### Passo 3: Configure a Unidade P:

O launcher fornece um botao para criar e montar a unidade P: (workdrive). Esta é a unidade virtual que todas as ferramentas DayZ usam como caminho raiz.

1. Clique em **Setup Workdrive** (ou o botao de configuração da unidade P:).
2. A ferramenta cria uma unidade P: mapeada via subst apontando para um diretório no seu disco real.
3. Extraia ou crie links simbolicos dos dados vanilla do DayZ para P: para que as ferramentas possam referênciar assets do jogo.

---

## Unidade P: (Workdrive)

A **unidade P:** e uma unidade virtual do Windows (criada via `subst` ou junction) que serve como o caminho raiz unificado para todo o modding de DayZ. Todo caminho em modelos P3D, matériais RVMAT, referências do config.cpp e scripts de build e relativo a P:.

### Por Que a Unidade P: Existe

O pipeline de assets do DayZ foi projetado em torno de um caminho raiz fixo. Quando um matérial referência `MyMod\data\texture_co.paa`, o motor procura `P:\MyMod\data\texture_co.paa`. Esta convencao garante:

- Todas as ferramentas concordam sobre onde os arquivos estao.
- Caminhos em PBOs empacotados correspondem aos caminhos durante o desenvolvimento.
- Multiplos mods podem coexistir sob uma única raiz.

### Estrutura

```
P:\
  DZ\                          <-- Vanilla DayZ extracted data
  DayZ Tools\                  <-- Tools installation (or symlink)
  MyMod\                       <-- Your mod source
    config.cpp
    Scripts\
    data\
  AnotherMod\                  <-- Another mod's source
    ...
```

### SetupWorkdrive.bat

Muitos projetos de mod incluem um script `SetupWorkdrive.bat` que automatiza a criacao da unidade P: e a configuração de junctions. Um script típico:

```batch
@echo off
REM Create P: drive pointing to the workspace
subst P: "D:\DayZModding"

REM Create junctions for vanilla game data
mklink /J "P:\DZ" "C:\Program Files (x86)\Steam\steamapps\common\DayZ\dta"

REM Create junction for tools
mklink /J "P:\DayZ Tools" "C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"

echo Workdrive P: configured.
pause
```

> **Dica:** O workdrive deve estar montado antes de lancar qualquer ferramenta DayZ. Se o Object Builder ou Binarize não conseguir encontrar arquivos, a primeira coisa a verificar e se P: esta montado.

---

## Object Builder

Object Builder e o editor de modelos 3D para arquivos P3D. Ele e coberto em detalhes no [Capítulo 4.2: Modelos 3D](02-models.md). Aqui esta um resumo do seu papel na cadeia de ferramentas.

### Capacidades Principais

- Criar e editar arquivos de modelo P3D.
- Definir LODs (Level of Detail) para malhas visuais, de colisao e de sombra.
- Atribuir matériais (RVMAT) e texturas (PAA) a faces do modelo.
- Criar selecoes nomeadas para animações e troca de texturas.
- Posicionar pontos de memória e objetos proxy.
- Importar geometria dos formatos FBX, OBJ e 3DS.
- Validar modelos para compatibilidade com o motor.

### Lancamento

```
DayZ Tools Launcher --> Object Builder
```

Ou diretamente: `P:\DayZ Tools\Bin\ObjectBuilder\ObjectBuilder.exe`

### Integracao com Outras Ferramentas

- **Referência o TexView2** para previews de textura (clique duplo em uma textura nas propriedades de face).
- **Produz arquivos P3D** consumidos pelo Binarize e AddonBuilder.
- **Le arquivos P3D** dos dados vanilla na unidade P: para referência.

---

## TexView2

TexView2 e o utilitário de visualizacao e conversão de texturas. Ele lida com todas as conversoes de formato de textura necessárias para modding de DayZ.

### Capacidades Principais

- Abrir e visualizar arquivos PAA, TGA, PNG, EDDS e DDS.
- Converter entre formatos (TGA/PNG para PAA, PAA para TGA, etc.).
- Visualizar canais individuais (R, G, B, A) separadamente.
- Exibir níveis de mipmap.
- Mostrar dimensoes da textura e tipo de compressão.
- Conversão em lote via linha de comando.

### Lancamento

```
DayZ Tools Launcher --> TexView2
```

Ou diretamente: `P:\DayZ Tools\Bin\TexView2\TexView2.exe`

### Operacoes Comuns

**Converter TGA para PAA:**
1. File --> Open --> selecione seu arquivo TGA.
2. Verifique se a imagem parece correta.
3. File --> Save As --> escolha formato PAA.
4. Selecione compressão (DXT1 para opaco, DXT5 para alfa).
5. Salve.

**Inspecionar uma textura PAA vanilla:**
1. File --> Open --> navegue até `P:\DZ\...` e selecione um arquivo PAA.
2. Visualize a imagem. Clique nos botoes de canal (R, G, B, A) para inspecionar canais individuais.
3. Note as dimensoes e tipo de compressão mostrados na barra de status.

**Conversão via linha de comando:**
```bash
TexView2.exe -i "P:\MyMod\data\texture_co.tga" -o "P:\MyMod\data\texture_co.paa"
```

---

## Terrain Builder

Terrain Builder e uma ferramenta especializada para criar mapas (terrenos) personalizados. Criacao de mapas e uma das tarefas de modding mais complexas no DayZ, envolvendo imagens de satélite, mapas de altura, mascaras de superfície e posicionamento de objetos.

### Capacidades Principais

- Importar imagens de satélite e mapas de altura.
- Definir camadas de terreno (grama, terra, rocha, areia, etc.).
- Posicionar objetos (edificios, árvores, pedras) no mapa.
- Configurar texturas e matériais de superfície.
- Exportar dados de terreno para o Binarize.

### Quando Você Precisa do Terrain Builder

- Criando um novo mapa do zero.
- Modificando um terreno existente (adicionando/removendo objetos, mudando a forma do terreno).
- Terrain Builder NAO é necessário para mods de itens, armas, UI ou somente scripts.

### Lancamento

```
DayZ Tools Launcher --> Terrain Builder
```

> **Nota:** Criacao de terreno e um topico avancado que merece seu proprio guia dedicado. Este capítulo cobre o Terrain Builder apenas como parte da visao geral das ferramentas.

---

## Binarize

Binarize e o motor de conversão principal que transforma arquivos de origem legiveis por humanos em formatos binários otimizados e prontos para o jogo. Ele roda nos bastidores durante o empacotamento de PBO (via AddonBuilder), mas também pode ser invocado diretamente.

### O Que o Binarize Converte

| Formato de Origem | Formato de Saida | Descrição |
|--------------------|-------------------|-----------|
| MLOD `.p3d` | ODOL `.p3d` | Modelo 3D otimizado |
| `.tga` / `.png` / `.edds` | `.paa` | Textura compactada |
| `.cpp` (config) | `.bin` | Config binarizada (parsing mais rapido) |
| `.rvmat` | `.rvmat` (processado) | Matérial com caminhos resolvidos |
| `.wrp` | `.wrp` (otimizado) | Mundo de terreno |

### Quando a Binarização e Necessaria

| Tipo de Conteúdo | Binarizar? | Motivo |
|------------------|------------|--------|
| Config.cpp com CfgVehicles | **Sim** | Motor requer configs binarizadas para definicoes de item |
| Config.cpp (somente scripts) | Opcional | Configs somente de script funcionam não binarizadas |
| Modelos P3D | **Sim** | ODOL e mais rapido de carregar, menor, otimizado pelo motor |
| Texturas (TGA/PNG) | **Sim** | PAA é necessário em tempo de execução |
| Scripts (arquivos .c) | **Nao** | Scripts são carregados como estao (texto) |
| Audio (.ogg) | **Nao** | OGG já esta pronto para o jogo |
| Layouts (.layout) | **Nao** | Carregados como estao |

### Invocacao Direta

```bash
Binarize.exe -targetPath="P:\build\MyMod" -sourcePath="P:\MyMod" -noLogs
```

Na prática, você raramente chama o Binarize diretamente -- o AddonBuilder o encapsula como parte do processo de empacotamento de PBO.

---

## AddonBuilder

AddonBuilder é a ferramenta de empacotamento de PBO. Ele recebe um diretório de origem e cria um arquivo `.pbo`, opcionalmente executando o Binarize no conteúdo primeiro. Isso é coberto em detalhe no [Capítulo 4.6: Empacotamento PBO](06-pbo-packing.md).

### Referência Rapida

```bash
# Pack with binarization (for item/weapon mods with configs, models, textures)
AddonBuilder.exe "P:\MyMod" "P:\output" -prefix="MyMod" -sign="MyKey"

# Pack without binarization (for script-only mods)
AddonBuilder.exe "P:\MyMod" "P:\output" -prefix="MyMod" -packonly
```

### Lancamento

Pelo DayZ Tools Launcher, ou diretamente:
```
P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe
```

AddonBuilder tem tanto um modo GUI quanto um modo de linha de comando. O GUI fornece um navegador visual de arquivos e caixas de seleção de opcoes. O modo de linha de comando é usado por scripts de build automatizados.

---

## Workbench

Workbench e um ambiente de desenvolvimento de scripts incluido no DayZ Tools. Ele fornece capacidades de edicao, depuração e profiling de scripts.

### Capacidades Principais

- **Edicao de scripts** com syntax highlighting para Enforce Script.
- **Depuração** com breakpoints, execução passo a passo e inspecao de variaveis.
- **Profiling** para identificar gargalos de desempenho em scripts.
- **Console** para avaliar expressoes e testar trechos.
- **Navegador de recursos** para inspecionar dados do jogo.

### Lancamento

```
DayZ Tools Launcher --> Workbench
```

Ou diretamente: `P:\DayZ Tools\Bin\Workbench\workbenchApp.exe`

### Fluxo de Depuração

1. Abra o Workbench.
2. Configure o projeto para apontar para os scripts do seu mod.
3. Defina breakpoints nos seus arquivos `.c`.
4. Inicie o jogo atraves do Workbench (ele inicia o DayZ em modo debug).
5. Quando a execução atinge um breakpoint, o Workbench pausa o jogo e mostra a pilha de chamadas, variaveis locais e permite execução passo a passo.

### Limitacoes

- O suporte a Enforce Script do Workbench tem algumas lacunas -- nem todas as APIs do motor estao completamente documentadas no autocomplete.
- Alguns modders preferem editores externos (VS Code com extensoes comunitarias de Enforce Script) para escrever código e usam o Workbench apenas para depuração.
- O Workbench pode ficar instavel com mods grandes ou configurações complexas de breakpoints.

---

## Modo File Patching

**File patching** e um atalho de desenvolvimento que permite ao jogo carregar arquivos soltos do disco em vez de exigir que sejam empacotados em PBOs. Isso acelera dramaticamente a iteracao durante o desenvolvimento.

### Como File Patching Funciona

Quando o DayZ e lancado com o parâmetro `-filePatching`, o motor verifica a unidade P: por arquivos antes de olhar nos PBOs. Se um arquivo existe em P:, a versao solta é carregada em vez da versao do PBO.

```
Normal mode:   Game loads --> PBO --> files
File patching: Game loads --> P: drive (if file exists) --> PBO (fallback)
```

### Habilitando File Patching

Adicione o parâmetro de lancamento `-filePatching` ao DayZ:

```bash
# Client
DayZDiag_x64.exe -filePatching -mod="MyMod" -connect=127.0.0.1

# Server
DayZDiag_x64.exe -filePatching -server -mod="MyMod" -config=serverDZ.cfg
```

> **Importante:** File patching requer o executavel **Diag** (diagnóstico) (`DayZDiag_x64.exe`), não o executavel retail. A versao retail ignora `-filePatching` por seguranca.

### O Que File Patching Pode Fazer

| Tipo de Asset | File Patching Funciona? | Notas |
|---------------|-------------------------|-------|
| Scripts (.c) | **Sim** | Iteracao mais rapida -- edite, reinicie, teste |
| Layouts (.layout) | **Sim** | Mudancas de UI sem rebuild |
| Texturas (.paa) | **Sim** | Troque texturas sem rebuild |
| Config.cpp | **Parcial** | Apenas configs não binarizadas |
| Modelos (.p3d) | **Sim** | Apenas P3D MLOD não binarizado |
| Audio (.ogg) | **Sim** | Troque sons sem rebuild |

### Fluxo de Trabalho com File Patching

1. Configure a unidade P: com os arquivos de origem do seu mod.
2. Lance servidor e cliente com `-filePatching`.
3. Edite um arquivo de script no seu editor.
4. Reinicie o jogo (ou reconecte) para carregar as mudancas.
5. Sem necessidade de rebuild de PBO.

> **Dica:** Para mudancas somente de script, file patching elimina completamente a etapa de build. Você edita arquivos `.c`, reinicia e testa. Este é o loop de desenvolvimento mais rapido disponível.

### Limitacoes

- **Sem conteúdo binarizado.** Config.cpp com entradas de `CfgVehicles` pode não funcionar corretamente sem binarização. Configs somente de script funcionam bem.
- **Sem assinatura de chave.** Conteúdo com file patching não é assinado, então so funciona em desenvolvimento (não em servidores publicos).
- **Somente versao Diag.** O executavel retail ignora file patching.
- **Unidade P: deve estar montada.** Se o workdrive não esta montado, file patching não tem de onde ler.

---

## Fluxo Completo: Da Origem ao Jogo

Aqui esta o pipeline de ponta a ponta para transformar assets de origem em um mod jogavel:

### Fase 1: Criar Assets de Origem

```mermaid
graph LR
    subgraph "Source Assets"
        TGA[".tga textures"]
        FBX[".fbx/.obj models"]
        OGG[".ogg audio"]
        CPP["config.cpp"]
        ES[".c scripts"]
    end

    subgraph "DayZ Tools"
        TV["TexView2"]
        OB["Object Builder"]
        BIN["Binarize"]
        AB["AddonBuilder"]
    end

    subgraph "Game Ready"
        PAA[".paa textures"]
        P3D[".p3d models"]
        CBIN["config.bin"]
        PBO[".pbo archive"]
    end

    TGA --> TV --> PAA
    FBX --> OB --> P3D
    CPP --> BIN --> CBIN
    PAA --> AB
    P3D --> AB
    CBIN --> AB
    OGG --> AB
    ES --> AB
    AB --> PBO

    PBO --> GAME["DayZ Game<br/>@MyMod folder"]

    style PBO fill:#2D8A4E,color:#fff
    style GAME fill:#4A90D9,color:#fff
```
```
3D Software (Blender/3dsMax)  -->  FBX export
Image Editor (Photoshop/GIMP) -->  TGA/PNG export
Audio Editor (Audacity)       -->  OGG export
Text Editor (VS Code)         -->  .c scripts, config.cpp, .layout files
```

### Fase 2: Importar e Converter

```
FBX  -->  Object Builder  -->  P3D (with LODs, selections, materials)
TGA  -->  TexView2         -->  PAA (compressed texture)
PNG  -->  TexView2         -->  PAA (compressed texture)
OGG  -->  (no conversion needed, game-ready)
```

### Fase 3: Organizar na Unidade P:

```
P:\MyMod\
  config.cpp                    <-- Mod configuration
  Scripts\
    3_Game\                     <-- Early-load scripts
    4_World\                    <-- Entity/manager scripts
    5_Mission\                  <-- UI/mission scripts
  data\
    models\
      my_item.p3d               <-- 3D model
    textures\
      my_item_co.paa            <-- Diffuse texture
      my_item_nohq.paa          <-- Normal map
      my_item_smdi.paa          <-- Specular map
    materials\
      my_item.rvmat             <-- Material definition
  sound\
    my_sound.ogg                <-- Audio file
  GUI\
    layouts\
      my_panel.layout           <-- UI layout
```

### Fase 4: Testar com File Patching (Desenvolvimento)

```
Launch DayZDiag with -filePatching
  |
  |--> Engine reads loose files from P:\MyMod\
  |--> Test in-game
  |--> Edit files directly on P:
  |--> Restart to pick up changes
  |--> Iterate rapidly
```

### Fase 5: Empacotar PBO (Distribuição)

```
AddonBuilder / build script
  |
  |--> Reads source from P:\MyMod\
  |--> Binarize converts: P3D-->ODOL, TGA-->PAA, config.cpp-->.bin
  |--> Packs everything into MyMod.pbo
  |--> Signs with key: MyMod.pbo.MyKey.bisign
  |--> Output: @MyMod\addons\MyMod.pbo
```

### Fase 6: Distribuir

```
@MyMod\
  addons\
    MyMod.pbo                   <-- The packed mod
    MyMod.pbo.MyKey.bisign      <-- Signature for server verification
  keys\
    MyKey.bikey                 <-- Public key for server admins
  mod.cpp                       <-- Mod metadata (name, author, etc.)
```

Jogadores se inscrevem no mod na Steam Workshop, ou administradores de servidor instalam manualmente.

---

## Erros Comuns

### 1. Unidade P: Não Montada

**Sintoma:** Todas as ferramentas reportam erros "file not found". Object Builder mostra texturas em branco.
**Correção:** Execute seu `SetupWorkdrive.bat` ou monte P: pelo DayZ Tools Launcher antes de lancar qualquer ferramenta.

### 2. Ferramenta Errada para o Trabalho

**Sintoma:** Tentar editar um arquivo PAA em um editor de texto, ou abrir um P3D no Notepad.
**Correção:** PAA e binário -- use TexView2. P3D e binário -- use Object Builder. Config.cpp e texto -- use qualquer editor de texto.

### 3. Esquecendo de Extrair Dados Vanilla

**Sintoma:** Object Builder não consegue exibir texturas vanilla em modelos referênciados. Matériais mostram rosa/magenta.
**Correção:** Extraia dados vanilla do DayZ para `P:\DZ\` para que as ferramentas possam resolver referências cruzadas ao conteúdo do jogo.

### 4. File Patching com Executavel Retail

**Sintoma:** Mudancas em arquivos na unidade P: não são refletidas no jogo.
**Correção:** Use `DayZDiag_x64.exe`, não `DayZ_x64.exe`. Apenas a versao Diag suporta `-filePatching`.

### 5. Fazendo Build Sem Unidade P:

**Sintoma:** AddonBuilder ou Binarize falha com erros de resolução de caminho.
**Correção:** Monte a unidade P: antes de executar qualquer ferramenta de build. Todos os caminhos em modelos e matériais são relativos a P:.

---

## Boas Práticas

1. **Sempre use a unidade P:.** Resista a tentacao de usar caminhos absolutos. P: é o padrão e todas as ferramentas esperam isso.

2. **Use file patching durante o desenvolvimento.** Isso reduz o tempo de iteracao de minutos (rebuild de PBO) para segundos (reinicio do jogo). So faca build de PBOs para testes de distribuição e lancamento.

3. **Automatize seu pipeline de build.** Use scripts (`build_pbos.bat`, `dev.py`) para automatizar a invocacao do AddonBuilder. Empacotamento manual pelo GUI e propenso a erros é lento para mods com múltiplos PBOs.

4. **Mantenha origem e saida separados.** Arquivos de origem ficam em P:. PBOs construidos vao para um diretório de saida separado. Nunca os misture.

5. **Aprenda atalhos de teclado.** Object Builder e TexView2 possuem extensos atalhos de teclado que aceleram dramaticamente o trabalho. Invista tempo aprendendo-os.

6. **Extraia e estude dados vanilla.** A melhor maneira de aprender como assets do DayZ são estruturados e examinar os existentes. Extraia PBOs vanilla e abra modelos, matériais e texturas nas ferramentas apropriadas.

7. **Use Workbench para depuração, editores externos para escrita.** VS Code com extensoes de Enforce Script fornece melhor edicao. Workbench fornece melhor depuração. Use ambos.

---

## Navegação

| Anterior | Acima | Próximo |
|----------|-------|---------|
| [4.4 Audio](04-audio.md) | [Parte 4: Formatos de Arquivo & DayZ Tools](01-textures.md) | [4.6 Empacotamento PBO](06-pbo-packing.md) |
