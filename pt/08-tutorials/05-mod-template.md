# Capitulo 8.5: Usando o Template de Mod para DayZ

> **Resumo:** Este tutorial mostra como usar o template de mod open-source do InclementDab para DayZ para iniciar um novo projeto de mod em segundos. Em vez de criar cada arquivo do zero, voce clona um esqueleto pronto que ja possui a estrutura de pastas correta, config.cpp, mod.cpp e stubs de camada de script. Voce entao renomeia algumas coisas e comeca a escrever codigo imediatamente.

---

## Indice

- [O Que E o Template de Mod para DayZ?](#o-que-e-o-template-de-mod-para-dayz)
- [O Que o Template Fornece](#o-que-o-template-fornece)
- [Passo 1: Clonar ou Baixar o Template](#passo-1-clonar-ou-baixar-o-template)
- [Passo 2: Entender a Estrutura de Arquivos](#passo-2-entender-a-estrutura-de-arquivos)
- [Passo 3: Renomear o Mod](#passo-3-renomear-o-mod)
- [Passo 4: Atualizar o config.cpp](#passo-4-atualizar-o-configcpp)
- [Passo 5: Atualizar o mod.cpp](#passo-5-atualizar-o-modcpp)
- [Passo 6: Renomear Pastas e Arquivos de Script](#passo-6-renomear-pastas-e-arquivos-de-script)
- [Passo 7: Compilar e Testar](#passo-7-compilar-e-testar)
- [Integracao com DayZ Tools e Workbench](#integracao-com-dayz-tools-e-workbench)
- [Template vs. Configuracao Manual](#template-vs-configuracao-manual)
- [Proximos Passos](#proximos-passos)

---

## O Que E o Template de Mod para DayZ?

O **Template de Mod para DayZ** e um repositorio open-source mantido pelo InclementDab que fornece um esqueleto de mod completo e pronto para uso no DayZ:

**Repositorio:** [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)

Em vez de criar cada arquivo manualmente (como abordado no [Capitulo 8.1: Seu Primeiro Mod](01-first-mod.md)), o template fornece uma estrutura de diretorios pre-construida com todo o boilerplate ja no lugar. Voce clona, renomeia alguns identificadores e esta pronto para escrever logica de jogo.

Este e o ponto de partida recomendado para quem ja construiu um mod Hello World e quer avancar para projetos mais complexos.

---

## O Que o Template Fornece

O template inclui tudo que um mod de DayZ precisa para compilar e carregar:

| Arquivo / Pasta | Proposito |
|-----------------|-----------|
| `mod.cpp` | Metadados do mod (nome, autor, versao) exibidos no launcher do DayZ |
| `config.cpp` | Declaracoes CfgPatches e CfgMods que registram o mod no motor |
| `Scripts/3_Game/` | Stubs de script da camada Game (enums, constantes, classes de config) |
| `Scripts/4_World/` | Stubs de script da camada World (entidades, gerenciadores, interacoes com o mundo) |
| `Scripts/5_Mission/` | Stubs de script da camada Mission (UI, hooks de missao) |
| `.gitignore` | Ignorar arquivos pre-configurados para desenvolvimento DayZ (PBOs, logs, arquivos temporarios) |

O template segue a hierarquia padrao de 5 camadas de script documentada no [Capitulo 2.1: A Hierarquia de 5 Camadas de Script](../02-mod-structure/01-five-layers.md). Todas as tres camadas de script estao configuradas no config.cpp, entao voce pode imediatamente colocar codigo em qualquer camada sem configuracao adicional.

---

## Passo 1: Clonar ou Baixar o Template

### Opcao A: Usar o Recurso "Use this template" do GitHub

1. Va para [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)
2. Clique no botao verde **"Use this template"** no topo do repositorio
3. Escolha **"Create a new repository"**
4. Nomeie seu repositorio (ex: `MyAwesomeMod`)
5. Clone seu novo repositorio para o drive P:

```bash
cd P:\
git clone https://github.com/YourUsername/MyAwesomeMod.git
```

### Opcao B: Clone Direto

Se voce nao precisa do seu proprio repositorio no GitHub, clone o template diretamente:

```bash
cd P:\
git clone https://github.com/InclementDab/DayZ-Mod-Template.git MyAwesomeMod
```

### Opcao C: Baixar como ZIP

1. Va para a pagina do repositorio
2. Clique em **Code** e depois em **Download ZIP**
3. Extraia o ZIP para `P:\MyAwesomeMod\`

---

## Passo 2: Entender a Estrutura de Arquivos

Apos clonar, o diretorio do seu mod fica assim:

```
P:\MyAwesomeMod\
    mod.cpp
    Scripts\
        config.cpp
        3_Game\
            ModName\
                (scripts da camada game)
        4_World\
            ModName\
                (scripts da camada world)
        5_Mission\
            ModName\
                (scripts da camada mission)
```

### Como Cada Parte Se Encaixa

**`mod.cpp`** e o cartao de identidade do seu mod. Ele controla o que os jogadores veem na lista de mods do launcher do DayZ. Consulte o [Capitulo 2.3: mod.cpp e Workshop](../02-mod-structure/03-mod-cpp.md) para todos os campos disponiveis.

**`Scripts/config.cpp`** e o arquivo mais critico. Ele diz ao motor do DayZ:
- Do que seu mod depende (`CfgPatches.requiredAddons[]`)
- Onde cada camada de script esta localizada (`CfgMods.class defs`)
- Quais defines de preprocessador definir (`defines[]`)

Consulte o [Capitulo 2.2: config.cpp a Fundo](../02-mod-structure/02-config-cpp.md) para uma referencia completa.

**`Scripts/3_Game/`** carrega primeiro. Coloque enums, constantes, IDs de RPC, classes de configuracao e qualquer coisa que nao referencie entidades do mundo aqui.

**`Scripts/4_World/`** carrega em segundo. Coloque classes de entidade (`modded class ItemBase`), gerenciadores e qualquer coisa que interaja com objetos do jogo aqui.

**`Scripts/5_Mission/`** carrega por ultimo. Coloque hooks de missao (`modded class MissionServer`), paineis de UI e logica de inicializacao aqui. Esta camada pode referenciar tipos de todas as camadas inferiores.

---

## Passo 3: Renomear o Mod

O template vem com nomes de placeholder. Voce precisa substitui-los pelo nome real do seu mod. Aqui esta uma abordagem sistematica.

### Escolha Seus Nomes

Antes de fazer qualquer edicao, decida:

| Identificador | Exemplo | Usado Em |
|----------------|---------|----------|
| **Nome de exibicao do mod** | `"My Awesome Mod"` | mod.cpp, config.cpp |
| **Nome do diretorio** | `MyAwesomeMod` | Nome da pasta, caminhos no config.cpp |
| **Classe CfgPatches** | `MyAwesomeMod_Scripts` | config.cpp CfgPatches |
| **Classe CfgMods** | `MyAwesomeMod` | config.cpp CfgMods |
| **Subpasta de script** | `MyAwesomeMod` | Dentro de 3_Game/, 4_World/, 5_Mission/ |
| **Define de preprocessador** | `MYAWESOMEMOD` | config.cpp defines[], verificacoes #ifdef |

### Regras de Nomenclatura

- **Sem espacos ou caracteres especiais** em nomes de diretorio e classe. Use PascalCase ou underscores.
- **Nomes de classe CfgPatches devem ser globalmente unicos.** Dois mods com o mesmo nome de classe CfgPatches vao conflitar. Use o nome do seu mod como prefixo.
- **Nomes de subpasta de script** dentro de cada camada devem corresponder ao nome do seu mod para consistencia.

---

## Passo 4: Atualizar o config.cpp

Abra `Scripts/config.cpp` e atualize as seguintes secoes.

### CfgPatches

Substitua o nome de classe do template pelo seu:

```cpp
class CfgPatches
{
    class MyAwesomeMod_Scripts    // <-- Seu nome de patch unico
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"            // Dependencia do jogo base
        };
    };
};
```

Se seu mod depende de outro mod, adicione o nome de classe CfgPatches dele ao `requiredAddons[]`:

```cpp
requiredAddons[] =
{
    "DZ_Data",
    "CF_Scripts"              // Depende do Community Framework
};
```

### CfgMods

Atualize a identidade do mod e os caminhos dos scripts:

```cpp
class CfgMods
{
    class MyAwesomeMod
    {
        dir = "MyAwesomeMod";
        name = "My Awesome Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/5_Mission" };
            };
        };
    };
};
```

**Pontos importantes:**
- O valor de `dir` deve corresponder exatamente ao nome da pasta raiz do seu mod.
- Cada caminho em `files[]` e relativo a raiz do mod.
- O array `dependencies[]` deve listar quais modulos de script vanilla voce utiliza. A maioria dos mods usa todos os tres: `"Game"`, `"World"` e `"Mission"`.

### Defines de Preprocessador (Opcional)

Se voce quer que outros mods detectem a presenca do seu mod, adicione um array `defines[]`:

```cpp
class MyAwesomeMod
{
    // ... (outros campos acima)

    class defs
    {
        class gameScriptModule
        {
            value = "";
            files[] = { "MyAwesomeMod/Scripts/3_Game" };
        };
        // ... outros modulos ...
    };

    // Habilitar deteccao entre mods
    defines[] = { "MYAWESOMEMOD" };
};
```

Outros mods podem entao usar `#ifdef MYAWESOMEMOD` para compilar condicionalmente codigo que integra com o seu.

---

## Passo 5: Atualizar o mod.cpp

Abra `mod.cpp` no diretorio raiz e atualize-o com as informacoes do seu mod:

```cpp
name         = "My Awesome Mod";
author       = "YourName";
version      = "1.0.0";
overview     = "Uma breve descricao do que seu mod faz.";
picture      = "";             // Opcional: caminho para uma imagem de preview
logo         = "";             // Opcional: caminho para um logo
logoSmall    = "";             // Opcional: caminho para um logo pequeno
logoOver     = "";             // Opcional: caminho para um logo em hover
tooltip      = "My Awesome Mod";
action       = "";             // Opcional: URL para o site do seu mod
```

No minimo, defina `name`, `author` e `overview`. Os outros campos sao opcionais, mas melhoram a apresentacao no launcher.

---

## Passo 6: Renomear Pastas e Arquivos de Script

Renomeie as subpastas de script dentro de cada camada para corresponder ao nome do seu mod:

```
Scripts/3_Game/ModName/    -->  Scripts/3_Game/MyAwesomeMod/
Scripts/4_World/ModName/   -->  Scripts/4_World/MyAwesomeMod/
Scripts/5_Mission/ModName/ -->  Scripts/5_Mission/MyAwesomeMod/
```

Dentro dessas pastas, renomeie quaisquer arquivos `.c` de placeholder e atualize seus nomes de classe. Por exemplo, se o template inclui um arquivo como `ModInit.c` com uma classe chamada `ModInit`, renomeie-o para `MyAwesomeModInit.c` e atualize a classe:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyAwesomeMod] Server initialized!");
    }
};
```

---

## Passo 7: Compilar e Testar

### Usando File Patching (Iteracao Rapida)

A forma mais rapida de testar durante o desenvolvimento:

```batch
DayZDiag_x64.exe -mod=P:\MyAwesomeMod -filePatching
```

Isso carrega seus scripts diretamente das pastas de codigo-fonte sem empacotar um PBO. Edite um arquivo `.c`, reinicie o jogo e veja as mudancas imediatamente.

### Usando o Addon Builder (Para Distribuicao)

Quando voce estiver pronto para distribuir:

1. Abra o **DayZ Tools** pelo Steam
2. Inicie o **Addon Builder**
3. Defina o **Source directory** para `P:\MyAwesomeMod\Scripts\`
4. Defina o **Output directory** para `P:\@MyAwesomeMod\Addons\`
5. Defina o **Prefix** para `MyAwesomeMod\Scripts`
6. Clique em **Pack**

Depois copie `mod.cpp` ao lado da pasta `Addons`:

```
P:\@MyAwesomeMod\
    mod.cpp
    Addons\
        Scripts.pbo
```

### Verificar no Log de Scripts

Apos iniciar, verifique o log de scripts para suas mensagens:

```
%localappdata%\DayZ\script_<date>_<time>.log
```

Procure pela tag de prefixo do seu mod (ex: `[MyAwesomeMod]`).

---

## Integracao com DayZ Tools e Workbench

### Workbench

O DayZ Workbench pode abrir e editar os scripts do seu mod com destaque de sintaxe:

1. Abra o **Workbench** pelo DayZ Tools
2. Va em **File > Open** e navegue ate a pasta `Scripts/` do seu mod
3. Abra qualquer arquivo `.c` para editar com suporte basico a Enforce Script

O Workbench le o `config.cpp` para entender quais arquivos pertencem a qual modulo de script, entao ter um config.cpp corretamente configurado e essencial.

### Configuracao do Drive P:

O template e projetado para funcionar a partir do drive P:. Se voce clonou para outro local, crie uma juncao:

```batch
mklink /J P:\MyAwesomeMod "D:\Projects\MyAwesomeMod"
```

Isso torna o mod acessivel em `P:\MyAwesomeMod` sem mover arquivos.

### Automacao do Addon Builder

Para compilacoes repetidas, voce pode criar um arquivo batch na raiz do seu mod:

```batch
@echo off
set DAYZ_TOOLS="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"
set SOURCE=P:\MyAwesomeMod\Scripts
set OUTPUT=P:\@MyAwesomeMod\Addons
set PREFIX=MyAwesomeMod\Scripts

%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe %SOURCE% %OUTPUT% -prefix=%PREFIX% -clear
echo Build complete.
pause
```

---

## Template vs. Configuracao Manual

| Aspecto | Template | Manual (Capitulo 8.1) |
|---------|----------|----------------------|
| **Tempo ate a primeira compilacao** | ~2 minutos | ~15 minutos |
| **Todas as 3 camadas de script** | Pre-configuradas | Voce adiciona conforme necessario |
| **config.cpp** | Completo com todos os modulos | Minimo (apenas missao) |
| **Pronto para Git** | .gitignore incluido | Voce cria o seu |
| **Valor de aprendizado** | Menor (arquivos pre-feitos) | Maior (construir tudo do zero) |
| **Recomendado para** | Modders experientes, novos projetos | Modders iniciantes aprendendo os fundamentos |

**Recomendacao:** Se este e seu primeiro mod de DayZ, comece com o [Capitulo 8.1](01-first-mod.md) para entender cada arquivo. Uma vez que esteja confortavel, use o template para todos os projetos futuros.

---

## Proximos Passos

Com seu mod baseado em template funcionando, voce pode:

1. **Adicionar um item personalizado** -- Siga o [Capitulo 8.2: Criando um Item Personalizado](02-custom-item.md) para definir itens no config.cpp.
2. **Construir um painel de admin** -- Siga o [Capitulo 8.3: Construindo um Painel de Admin](03-admin-panel.md) para UI de gerenciamento de servidor.
3. **Adicionar comandos de chat** -- Siga o [Capitulo 8.4: Adicionando Comandos de Chat](04-chat-commands.md) para comandos de texto no jogo.
4. **Estudar o config.cpp a fundo** -- Leia o [Capitulo 2.2: config.cpp a Fundo](../02-mod-structure/02-config-cpp.md) para entender cada campo.
5. **Aprender opcoes do mod.cpp** -- Leia o [Capitulo 2.3: mod.cpp e Workshop](../02-mod-structure/03-mod-cpp.md) para publicacao no Workshop.
6. **Adicionar dependencias** -- Se seu mod usa Community Framework ou outro mod, atualize `requiredAddons[]` e consulte o [Capitulo 2.4: Seu Primeiro Mod](../02-mod-structure/04-minimum-viable-mod.md).

---

**Anterior:** [Capitulo 8.4: Adicionando Comandos de Chat](04-chat-commands.md) | [Inicio](../../README.md)
