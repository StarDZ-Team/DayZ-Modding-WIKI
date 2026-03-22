# Chapter 4.6: PBO Packing

[Home](../../README.md) | [<< Previous: DayZ Tools Workflow](05-dayz-tools.md) | **PBO Packing** | [Next: Workbench Guide >>](07-workbench-guide.md)

---

## Introdução

Um **PBO** (Packed Bank of Objects) é o formato de arquivo do DayZ -- o equivalente a um arquivo `.zip` para conteúdo de jogo. Todo mod que o jogo carrega e entregue como um ou mais arquivos PBO. Quando um jogador se inscreve em um mod na Steam Workshop, ele baixa PBOs. Quando um servidor carrega mods, ele le PBOs. O PBO e o entregavel final de todo o pipeline de modding.

Entender como criar PBOs corretamente -- quando binarizar, como definir prefixos, como estruturar a saida e como automatizar o processo -- e o ultimo passo entre seus arquivos de origem e um mod funcional. Este capítulo cobre tudo, desde o conceito básico até fluxos de trabalho automatizados avancados de build.

---

## Sumário

- [O Que é um PBO?](#o-que-e-um-pbo)
- [Estrutura Interna do PBO](#estrutura-interna-do-pbo)
- [AddonBuilder: A Ferramenta de Empacotamento](#addonbuilder-a-ferramenta-de-empacotamento)
- [A Flag -packonly](#a-flag--packonly)
- [A Flag -prefix](#a-flag--prefix)
- [Binarização: Quando Necessaria vs. Nao](#binarização-quando-necessária-vs-nao)
- [Assinatura de Chave](#assinatura-de-chave)
- [Estrutura de Pasta @mod](#estrutura-de-pasta-mod)
- [Scripts de Build Automatizados](#scripts-de-build-automatizados)
- [Builds de Mod Multi-PBO](#builds-de-mod-multi-pbo)
- [Erros Comuns de Build e Solucoes](#erros-comuns-de-build-e-solucoes)
- [Teste: File Patching vs. Carregamento por PBO](#teste-file-patching-vs-carregamento-por-pbo)
- [Boas Práticas](#boas-práticas)

---

## O Que é um PBO?

Um PBO e um arquivo flat que contem uma árvore de diretórios de assets do jogo. Ele não tem compressão (diferente de ZIP) -- arquivos internos são armazenados no seu tamanho original. O "empacotamento" é puramente organizacional: muitos arquivos se tornam um único arquivo com uma estrutura de caminho interna.

### Características Principais

- **Sem compressão:** Arquivos são armazenados literalmente. O tamanho do PBO e igual a soma de seus conteúdos mais um pequeno cabecalho.
- **Cabecalho flat:** Uma lista de entradas de arquivo com caminhos, tamanhos e offsets.
- **Metadados de prefixo:** Cada PBO declara um prefixo de caminho interno que mapeia seus conteúdos no sistema de arquivos virtual do motor.
- **Somente leitura em tempo de execução:** O motor le de PBOs mas nunca escreve neles.
- **Assinado para multiplayer:** PBOs podem ser assinados com um par de chaves estilo Bohemia para verificação de assinatura no servidor.

### Por Que PBOs em Vez de Arquivos Soltos

- **Distribuição:** Um arquivo por componente de mod e mais simples do que milhares de arquivos soltos.
- **Integridade:** Assinatura de chave garante que o mod não foi adulterado.
- **Desempenho:** O I/O de arquivo do motor e otimizado para leitura de PBOs.
- **Organizacao:** O sistema de prefixo garante que não haja colisoes de caminho entre mods.

---

## Estrutura Interna do PBO

Quando você abre um PBO (usando uma ferramenta como PBO Manager ou MikeroTools), você ve uma árvore de diretórios:

```
MyMod.pbo
  $PBOPREFIX$                    <-- Text file containing the prefix path
  config.bin                      <-- Binarized config.cpp (or config.cpp if -packonly)
  Scripts/
    3_Game/
      MyConstants.c
    4_World/
      MyManager.c
    5_Mission/
      MyUI.c
  data/
    models/
      my_item.p3d                 <-- Binarized ODOL (or MLOD if -packonly)
    textures/
      my_item_co.paa
      my_item_nohq.paa
      my_item_smdi.paa
    materials/
      my_item.rvmat
  sound/
    gunshot_01.ogg
  GUI/
    layouts/
      my_panel.layout
```

### $PBOPREFIX$

O arquivo `$PBOPREFIX$` e um arquivo de texto minusculo na raiz do PBO que declara o prefixo de caminho do mod. Por exemplo:

```
MyMod
```

Isso diz ao motor: "Quando algo referência `MyMod\data\textures\my_item_co.paa`, procure dentro deste PBO em `data\textures\my_item_co.paa`."

### config.bin vs. config.cpp

- **config.bin:** Versao binarizada (binária) do config.cpp, criada pelo Binarize. Mais rapida de parsear no carregamento.
- **config.cpp:** A configuração original em formato texto. Funciona no motor, mas e ligeiramente mais lenta de parsear.

Quando você faz build com binarização, config.cpp se torna config.bin. Quando você usa `-packonly`, config.cpp e incluido como esta.

---

## AddonBuilder: A Ferramenta de Empacotamento

**AddonBuilder** é a ferramenta oficial de empacotamento de PBO da Bohemia, incluida no DayZ Tools. Pode operar em modo GUI ou modo de linha de comando.

### Modo GUI

1. Lance o AddonBuilder pelo DayZ Tools Launcher.
2. **Diretório de origem:** Navegue até a pasta do seu mod em P: (ex.: `P:\MyMod`).
3. **Diretório de saida:** Navegue até sua pasta de saida (ex.: `P:\output`).
4. **Opcoes:**
   - **Binarize:** Marque para executar Binarize no conteúdo (converte P3D, texturas, configs).
   - **Sign:** Marque é selecione uma chave para assinar o PBO.
   - **Prefix:** Insira o prefixo do mod (ex.: `MyMod`).
5. Clique em **Pack**.

### Modo de Linha de Comando

O modo de linha de comando e preferido para builds automatizados:

```bash
AddonBuilder.exe [source_path] [output_path] [options]
```

**Exemplo completo:**
```bash
"P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe" ^
    "P:\MyMod" ^
    "P:\output" ^
    -prefix="MyMod" ^
    -sign="P:\keys\MyKey"
```

### Opcoes de Linha de Comando

| Flag | Descrição |
|------|-----------|
| `-prefix=<path>` | Define o prefixo interno do PBO (crítico para resolução de caminhos) |
| `-packonly` | Pula binarização, empacota arquivos como estao |
| `-sign=<key_path>` | Assina o PBO com a chave BI específicada (caminho da chave privada, sem extensão) |
| `-include=<path>` | Lista de inclusao de arquivos -- empacota apenas arquivos que correspondam ao filtro |
| `-exclude=<path>` | Lista de exclusao de arquivos -- ignora arquivos que correspondam ao filtro |
| `-binarize=<path>` | Caminho para Binarize.exe (se não estiver no local padrão) |
| `-temp=<path>` | Diretório temporario para saida do Binarize |
| `-clear` | Limpa o diretório de saida antes de empacotar |
| `-project=<path>` | Caminho da unidade de projeto (geralmente `P:\`) |

---

## A Flag -packonly

A flag `-packonly` e uma das opcoes mais importantes no AddonBuilder. Ela diz a ferramenta para pular toda a binarização e empacotar os arquivos de origem exatamente como estao.

### Quando Usar -packonly

| Conteúdo do Mod | Usar -packonly? | Motivo |
|-----------------|-----------------|--------|
| Somente scripts (arquivos .c) | **Sim** | Scripts nunca são binarizados |
| Layouts de UI (.layout) | **Sim** | Layouts nunca são binarizados |
| Somente audio (.ogg) | **Sim** | OGG já esta pronto para o jogo |
| Texturas pre-convertidas (.paa) | **Sim** | Ja estao no formato final |
| Config.cpp (sem CfgVehicles) | **Sim** | Configs simples funcionam não binarizadas |
| Config.cpp (com CfgVehicles) | **Nao** | Definicoes de item requerem config binarizada |
| Modelos P3D (MLOD) | **Nao** | Devem ser binarizados para ODOL por desempenho |
| Texturas TGA/PNG (precisam conversão) | **Nao** | Devem ser convertidas para PAA |

### Orientação Pratica

Para um **mod somente de scripts** (como um framework ou mod utilitário sem itens personalizados):
```bash
AddonBuilder.exe "P:\MyScriptMod" "P:\output" -prefix="MyScriptMod" -packonly
```

Para um **mod de itens** (armas, roupas, veículos com modelos e texturas):
```bash
AddonBuilder.exe "P:\MyItemMod" "P:\output" -prefix="MyItemMod" -sign="P:\keys\MyKey"
```

> **Dica:** Muitos mods dividem-se em múltiplos PBOs precisamente para otimizar o processo de build. PBOs de script usam `-packonly` (rapido), enquanto PBOs de dados com modelos e texturas recebem binarização completa (mais lento, mas necessário).

---

## A Flag -prefix

A flag `-prefix` define o prefixo de caminho interno do PBO, que é escrito no arquivo `$PBOPREFIX$` dentro do PBO. Este prefixo é crítico -- ele determina como o motor resolve caminhos para conteúdo dentro do PBO.

### Como o Prefixo Funciona

```
Source: P:\MyMod\data\textures\item_co.paa
Prefix: MyMod
PBO internal path: data\textures\item_co.paa

Engine resolution: MyMod\data\textures\item_co.paa
  --> Looks in MyMod.pbo for: data\textures\item_co.paa
  --> Found!
```

### Prefixos Multi-Nivel

Para mods que usam uma estrutura de subpastas, o prefixo pode incluir múltiplos níveis:

```bash
# Source on P: drive
P:\MyMod\MyMod\Scripts\3_Game\MyClass.c

# If prefix is "MyMod\MyMod\Scripts"
# PBO internal: 3_Game\MyClass.c
# Engine path: MyMod\MyMod\Scripts\3_Game\MyClass.c
```

### Prefixo Deve Corresponder as Referências

Se seu config.cpp referência `MyMod\data\texture_co.paa`, então o PBO contendo aquela textura deve ter prefixo `MyMod` e o arquivo deve estar em `data\texture_co.paa` dentro do PBO. Uma incompatibilidade faz o motor não encontrar o arquivo.

### Padroes Comuns de Prefixo

| Estrutura do Mod | Caminho de Origem | Prefixo | Referência no Config |
|-------------------|-------------------|---------|---------------------|
| Mod simples | `P:\MyMod\` | `MyMod` | `MyMod\data\item.p3d` |
| Mod com namespace | `P:\MyWeapons\` | `MyWeapons` | `MyWeapons\data\rifle.p3d` |
| Sub-pacote de script | `P:\MyFramework\MyMod\Scripts\` | `MyFramework\MyMod\Scripts` | (referênciado via config.cpp `CfgMods`) |

---

## Binarização: Quando Necessaria vs. Nao

Binarização e a conversão de formatos de origem legiveis por humanos em formatos binários otimizados para o motor. E a etapa mais demorada no processo de build e a fonte mais comum de erros de build.

### O Que é Binarizado

| Tipo de Arquivo | Binarizado Para | Necessario? |
|-----------------|-----------------|-------------|
| `config.cpp` | `config.bin` | Necessario para mods que definem itens (CfgVehicles, CfgWeapons) |
| `.p3d` (MLOD) | `.p3d` (ODOL) | Recomendado -- ODOL carrega mais rapido e e menor |
| `.tga` / `.png` | `.paa` | Necessario -- motor precisa de PAA em tempo de execução |
| `.edds` | `.paa` | Necessario -- mesmo que acima |
| `.rvmat` | `.rvmat` (processado) | Caminhos resolvidos, otimizacao menor |
| `.wrp` | `.wrp` (otimizado) | Necessario para mods de terreno/mapa |

### O Que NAO e Binarizado

| Tipo de Arquivo | Motivo |
|-----------------|--------|
| Scripts `.c` | Scripts são carregados como texto pelo motor |
| Audio `.ogg` | Ja esta no formato pronto para o jogo |
| Arquivos `.layout` | Ja estao no formato pronto para o jogo |
| Texturas `.paa` | Ja estao no formato final (pre-convertidas) |
| Dados `.json` | Lidos como texto pelo código de script |

### Detalhes de Binarização do Config.cpp

Binarização do config.cpp e a etapa onde a maioria dos modders encontra problemas. O binarizador parseia o texto do config.cpp, valida sua estrutura, resolve cadeias de heranca e gera um config.bin binário.

**Quando a binarização é necessária para config.cpp:**
- A config define entradas `CfgVehicles` (itens, armas, veículos, edificios).
- A config define entradas `CfgWeapons`.
- A config define entradas que referênciam modelos ou texturas.

**Quando a binarização NAO é necessária:**
- A config define apenas `CfgPatches` e `CfgMods` (registro de mod).
- A config define apenas configurações de som.
- Mods somente de script com config minima.

> **Regra geral:** Se seu config.cpp adiciona itens físicos ao mundo do jogo, você precisa de binarização. Se apenas registra scripts e define dados nao-item, `-packonly` funciona bem.

---

## Assinatura de Chave

PBOs podem ser assinados com um par de chaves criptograficas. Servidores usam verificação de assinatura para garantir que todos os clientes conectados tenham os mesmos arquivos de mod (não modificados).

### Componentes do Par de Chaves

| Arquivo | Extensão | Propósito | Quem Possui |
|---------|----------|-----------|-------------|
| Chave privada | `.biprivatekey` | Assina PBOs durante o build | Apenas o autor do mod (MANTENHA EM SEGREDO) |
| Chave publica | `.bikey` | Verifica assinaturas | Administradores de servidor, distribuida com o mod |

### Gerando Chaves

Use os utilitários **DSSignFile** ou **DSCreatéKey** do DayZ Tools:

```bash
# Generate a key pair
DSCreateKey.exe MyModKey

# This creates:
#   MyModKey.biprivatekey   (keep secret, do not distribute)
#   MyModKey.bikey          (distribute to server admins)
```

### Assinando Durante o Build

```bash
AddonBuilder.exe "P:\MyMod" "P:\output" ^
    -prefix="MyMod" ^
    -sign="P:\keys\MyModKey"
```

Isso produz:
```
P:\output\
  MyMod.pbo
  MyMod.pbo.MyModKey.bisign    <-- Signature file
```

### Instalação de Chave no Servidor

Administradores de servidor colocam a chave publica (`.bikey`) no diretório `keys/` do servidor:

```
DayZServer/
  keys/
    MyModKey.bikey             <-- Allows clients with this mod to connect
```

---

## Estrutura de Pasta @mod

O DayZ espera que mods sejam organizados em uma estrutura de diretório específica usando a convencao de prefixo `@`:

```
@MyMod/
  addons/
    MyMod.pbo                  <-- Packed mod content
    MyMod.pbo.MyKey.bisign     <-- PBO signature (optional)
  keys/
    MyKey.bikey                <-- Public key for servers (optional)
  mod.cpp                      <-- Mod metadata
```

### mod.cpp

O arquivo `mod.cpp` fornece metadados exibidos no launcher do DayZ:

```cpp
name = "My Awesome Mod";
author = "ModAuthor";
version = "1.0.0";
url = "https://steamcommunity.com/sharedfiles/filedetails/?id=XXXXXXXXX";
```

### Mods Multi-PBO

Mods grandes frequentemente dividem-se em múltiplos PBOs dentro de uma única pasta `@mod`:

```
@MyFramework/
  addons/
    MyCore_Scripts.pbo        <-- Script layer
    MyCore_Data.pbo           <-- Textures, models, materials
    MyCore_GUI.pbo            <-- Layout files, imagesets
  keys/
    MyMod.bikey
  mod.cpp
```

### Carregando Mods

Mods são carregados via o parâmetro `-mod`:

```bash
# Single mod
DayZDiag_x64.exe -mod="@MyMod"

# Multiple mods (semicolon-separated)
DayZDiag_x64.exe -mod="@MyFramework;@MyWeapons;@MyMissions"
```

A pasta `@` deve estar no diretório raiz do jogo, ou um caminho absoluto deve ser fornecido.

---

## Scripts de Build Automatizados

Empacotamento manual de PBO pelo GUI do AddonBuilder e aceitavel para mods pequenos é simples. Para projetos maiores com múltiplos PBOs, scripts de build automatizados são essenciais.

### Padrão de Script Batch

Um `build_pbos.bat` típico:

```batch
@echo off
setlocal

set TOOLS="P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe"
set OUTPUT="P:\@MyMod\addons"
set KEY="P:\keys\MyKey"

echo === Building Scripts PBO ===
%TOOLS% "P:\MyMod\Scripts" %OUTPUT% -prefix="MyMod\Scripts" -packonly -clear

echo === Building Data PBO ===
%TOOLS% "P:\MyMod\Data" %OUTPUT% -prefix="MyMod\Data" -sign=%KEY% -clear

echo === Build Complete ===
pause
```

### Padrão de Script Python (dev.py)

Para builds mais sofisticados, um script Python fornece melhor tratamento de erros, logging e logica condicional:

```python
import subprocess
import os
import sys

ADDON_BUILDER = r"P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe"
OUTPUT_DIR = r"P:\@MyMod\addons"
KEY_PATH = r"P:\keys\MyKey"

PBOS = [
    {
        "name": "Scripts",
        "source": r"P:\MyMod\Scripts",
        "prefix": r"MyMod\Scripts",
        "packonly": True,
    },
    {
        "name": "Data",
        "source": r"P:\MyMod\Data",
        "prefix": r"MyMod\Data",
        "packonly": False,
    },
]

def build_pbo(pbo_config):
    """Build a single PBO."""
    cmd = [
        ADDON_BUILDER,
        pbo_config["source"],
        OUTPUT_DIR,
        f"-prefix={pbo_config['prefix']}",
    ]

    if pbo_config.get("packonly"):
        cmd.append("-packonly")
    else:
        cmd.append(f"-sign={KEY_PATH}")

    print(f"Building {pbo_config['name']}...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"ERROR building {pbo_config['name']}:")
        print(result.stderr)
        return False

    print(f"  {pbo_config['name']} built successfully.")
    return True

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    success = True
    for pbo in PBOS:
        if not build_pbo(pbo):
            success = False

    if success:
        print("\nAll PBOs built successfully.")
    else:
        print("\nBuild completed with errors.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Integracao com dev.py

O projeto MyMod usa `dev.py` como orquestrador central de build:

```bash
python dev.py build          # Build all PBOs
python dev.py server         # Build + launch server + monitor logs
python dev.py full           # Build + server + client
```

Este padrão é recomendado para qualquer workspace multi-mod. Um único comando constroi tudo, lanca o servidor e comeca a monitorar -- eliminando etapas manuais e reduzindo erros humanos.

---

## Builds de Mod Multi-PBO

Mods grandes se beneficiam de dividir em múltiplos PBOs. Isso tem varias vantagens:

### Por Que Dividir em Multiplos PBOs

1. **Rebuilds mais rapidos.** Se você mudou apenas um script, reconstrua apenas o PBO de script (com `-packonly`, que leva segundos). O PBO de dados (com binarização) leva minutos e não precisa de reconstrucao.
2. **Carregamento modular.** PBOs somente de servidor podem ser excluidos dos downloads do cliente.
3. **Organizacao mais limpa.** Scripts, dados e GUI são claramente separados.
4. **Builds paralelos.** PBOs independentes podem ser construidos simultaneamente.

### Padrão Típico de Divisao

```
@MyMod/
  addons/
    MyMod_Core.pbo           <-- config.cpp, CfgPatches (binarized)
    MyMod_Scripts.pbo         <-- All .c script files (-packonly)
    MyMod_Data.pbo            <-- Models, textures, materials (binarized)
    MyMod_GUI.pbo             <-- Layouts, imagesets (-packonly)
    MyMod_Sounds.pbo          <-- OGG audio files (-packonly)
```

### Dependencia Entre PBOs

Quando um PBO depende de outro (ex.: scripts referênciam itens definidos no PBO de config), o `requiredAddons[]` no `CfgPatches` garante a ordem de carregamento correta:

```cpp
// In MyMod_Scripts config.cpp
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = {"MyMod_Core"};   // Load after the core PBO
    };
};
```

---

## Erros Comuns de Build e Solucoes

### Erro: "Include file not found"

**Causa:** Config.cpp referência um arquivo (modelo, textura) que não existe no caminho esperado.
**Solucao:** Verifique se o arquivo existe em P: no caminho exato referênciado. Confira ortografia e capitalizacao.

### Erro: "Binarize failed" sem detalhes

**Causa:** Binarize travou em um arquivo de origem corrompido ou inválido.
**Solucao:**
1. Confira qual arquivo o Binarize estava processando (olhe a saida do log).
2. Abra o arquivo problematico na ferramenta apropriada (Object Builder para P3D, TexView2 para texturas).
3. Valide o arquivo.
4. Culpados comuns: texturas não potencia de 2, arquivos P3D corrompidos, sintaxe invalida no config.cpp.

### Erro: "Addon requires addon X"

**Causa:** `requiredAddons[]` do CfgPatches lista um addon que não esta presente.
**Solucao:** Instale o addon necessário, adicione-o ao build, ou remova o requisito se não for realmente necessário.

### Erro: Erro de parse do config.cpp (linha X)

**Causa:** Erro de sintaxe no config.cpp.
**Solucao:** Abra o config.cpp em um editor de texto e confira a linha X. Problemas comuns:
- Ponto-e-virgula ausente após definicoes de classe.
- Chaves `{}` não fechadas.
- Aspas ausentes em torno de valores string.
- Barra invertida no final da linha (continuacao de linha não é suportada).

### Erro: Incompatibilidade de prefixo do PBO

**Causa:** O prefixo no PBO não corresponde aos caminhos usados no config.cpp ou matériais.
**Solucao:** Garanta que `-prefix` corresponda a estrutura de caminho esperada por todas as referências. Se o config.cpp referência `MyMod\data\item.p3d`, o prefixo do PBO deve ser `MyMod` e o arquivo deve estar em `data\item.p3d` dentro do PBO.

### Erro: "Signature check failed" no servidor

**Causa:** O PBO do cliente não corresponde a assinatura esperada pelo servidor.
**Solucao:**
1. Garanta que tanto servidor quanto cliente tenham a mesma versao do PBO.
2. Re-assine o PBO com uma nova chave se necessário.
3. Atualize o `.bikey` no servidor.

### Erro: "Cannot open file" durante o Binarize

**Causa:** Unidade P: não esta montada ou o caminho do arquivo esta incorreto.
**Solucao:** Monte a unidade P: e verifique se o caminho de origem existe.

---

## Teste: File Patching vs. Carregamento por PBO

O desenvolvimento envolve dois modos de teste. Escolher o correto para cada situacao economiza tempo significativo.

### File Patching (Desenvolvimento)

| Aspecto | Detalhe |
|---------|---------|
| **Velocidade** | Instantaneo -- edite arquivo, reinicie jogo |
| **Configuração** | Monte unidade P:, lance com flag `-filePatching` |
| **Executavel** | `DayZDiag_x64.exe` (versao Diag necessária) |
| **Assinatura** | Não aplicavel (sem PBOs para assinar) |
| **Limitacoes** | Sem configs binarizadas, somente versao Diag |
| **Melhor para** | Desenvolvimento de scripts, iteracao de UI, prototipagem rapida |

### Carregamento por PBO (Teste de Distribuição)

| Aspecto | Detalhe |
|---------|---------|
| **Velocidade** | Mais lento -- deve reconstruir PBO para cada mudanca |
| **Configuração** | Construa PBO, coloque em `@mod/addons/` |
| **Executavel** | `DayZDiag_x64.exe` ou retail `DayZ_x64.exe` |
| **Assinatura** | Suportada (necessária para multiplayer) |
| **Limitacoes** | Rebuild necessário para cada mudanca |
| **Melhor para** | Teste final, teste multiplayer, validação de distribuição |

### Fluxo de Trabalho Recomendado

1. **Desenvolva com file patching:** Escreva scripts, ajuste layouts, itere em texturas. Reinicie o jogo para testar. Sem etapa de build.
2. **Faca builds de PBO periodicamente:** Teste o build binarizado para capturar problemas específicos de binarização (erros de parse de config, problemas de conversão de textura).
3. **Teste final somente com PBO:** Antes da distribuição, teste exclusivamente a partir de PBOs para garantir que o mod empacotado funcione identicamente a versao com file patching.
4. **Assine e distribua PBOs:** Gere assinaturas para compatibilidade multiplayer.

---

## Boas Práticas

1. **Use `-packonly` para PBOs de script.** Scripts nunca são binarizados, então `-packonly` é sempre correto e muito mais rapido.

2. **Sempre defina um prefixo.** Sem um prefixo, o motor não pode resolver caminhos para o conteúdo do seu mod. Todo PBO deve ter um `-prefix` correto.

3. **Automatize seus builds.** Crie um script de build (batch ou Python) desde o primeiro dia. Empacotamento manual não escala e e propenso a erros.

4. **Mantenha origem e saida separados.** Origem em P:, PBOs construidos em um diretório de saida separado ou `@mod/addons/`. Nunca empacote a partir do diretório de saida.

5. **Assine seus PBOs para qualquer teste multiplayer.** PBOs não assinados são rejeitados por servidores com verificação de assinatura habilitada. Assine durante o desenvolvimento mesmo que pareca desnecessário -- previne problemas de "funciona pra mim" quando outros testam.

6. **Versione suas chaves.** Quando fizer mudancas que quebram compatibilidade, gere um novo par de chaves. Isso forca todos os clientes e servidores a atualizarem juntos.

7. **Teste tanto em modo file patching quanto PBO.** Alguns bugs so aparecem em um modo. Configs binarizadas se comportam diferentemente de configs texto em casos extremos.

8. **Limpe seu diretório de saida regularmente.** PBOs velhos de builds anteriores podem causar comportamento confuso. Use a flag `-clear` ou limpe manualmente antes de construir.

9. **Divida mods grandes em múltiplos PBOs.** O tempo economizado em rebuilds incrementais se paga dentro do primeiro dia de desenvolvimento.

10. **Leia os logs de build.** Binarize e AddonBuilder produzem arquivos de log. Quando algo da errado, a resposta quase sempre esta nos logs. Confira `%TEMP%\AddonBuilder\` e `%TEMP%\Binarize\` para saida detalhada.

---

## Navegação

| Anterior | Acima | Próximo |
|----------|-------|---------|
| [4.5 Fluxo de Trabalho DayZ Tools](05-dayz-tools.md) | [Parte 4: Formatos de Arquivo & DayZ Tools](01-textures.md) | [Parte 5: Arquivos de Configuração](../05-config-files/01-stringtable.md) |
