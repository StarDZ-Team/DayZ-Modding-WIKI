# Chapter 8.1: Your First Mod (Hello World)

[Home](../README.md) | **Your First Mod** | [Next: Creating a Custom Item >>](02-custom-item.md)

---

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [Passo 1: Instalar DayZ Tools](#passo-1-instalar-dayz-tools)
- [Passo 2: Configurar o Drive P: (Workdrive)](#passo-2-configurar-o-drive-p-workdrive)
- [Passo 3: Criar a Estrutura de Diretórios do Mod](#passo-3-criar-a-estrutura-de-diretórios-do-mod)
- [Passo 4: Escrever mod.cpp](#passo-4-escrever-modcpp)
- [Passo 5: Escrever config.cpp](#passo-5-escrever-configcpp)
- [Passo 6: Escrever Seu Primeiro Script](#passo-6-escrever-seu-primeiro-script)
- [Passo 7: Empacotar o PBO com Addon Builder](#passo-7-empacotar-o-pbo-com-addon-builder)
- [Passo 8: Carregar o Mod no DayZ](#passo-8-carregar-o-mod-no-dayz)
- [Passo 9: Verificar no Log de Script](#passo-9-verificar-no-log-de-script)
- [Passo 10: Resolução de Problemas Comuns](#passo-10-resolução-de-problemas-comuns)
- [Referência Completa dos Arquivos](#referência-completa-dos-arquivos)
- [Próximos Passos](#próximos-passos)

---

## Pré-requisitos

Antes de começar, tenha certeza de que você tem:

- **Steam** instalado e logado
- **DayZ** instalado (versão retail da Steam)
- Um **editor de texto** (VS Code, Notepad++ ou até Notepad)
- Aproximadamente **15 GB de espaço livre em disco** para DayZ Tools

Isso é tudo. Nenhuma experiência de programação é necessária para este tutorial -- toda linha de código é explicada.

---

## Passo 1: Instalar DayZ Tools

DayZ Tools é uma aplicação gratuita na Steam que inclui tudo que você precisa para construir mods: o editor de script Workbench, Addon Builder para empacotamento de PBO, Terrain Builder e Object Builder.

### Como Instalar

1. Abra a **Steam**
2. Vá para **Biblioteca**
3. No filtro dropdown no topo, mude **Jogos** para **Ferramentas**
4. Procure por **DayZ Tools**
5. Clique **Instalar**
6. Aguarde o download completar (é aproximadamente 12-15 GB)

### O que é Instalado

| Ferramenta | Propósito |
|------|---------|
| **Addon Builder** | Empacota seus arquivos de mod em arquivos `.pbo` |
| **Workbench** | Editor de script com syntax highlighting |
| **Object Builder** | Visualizador e editor de modelos 3D para arquivos `.p3d` |
| **Terrain Builder** | Editor de mapa/terreno |
| **TexView2** | Visualizador/conversor de texturas (`.paa`, `.edds`) |

Para este tutorial, você só precisa do **Addon Builder**. Os outros são úteis depois.

---

## Passo 2: Configurar o Drive P: (Workdrive)

Modding DayZ usa uma letra de drive virtual **P:** como workspace compartilhado. Todos os mods e dados do jogo referenciam caminhos começando de P:, o que mantém os caminhos consistentes entre diferentes máquinas.

### Criando o Drive P:

1. Abra **DayZ Tools** pela Steam
2. Na janela principal do DayZ Tools, clique em **P: Drive Management**
3. Clique **Create/Mount P: Drive**
4. Escolha uma localização para os dados do drive P: (padrão é ok)
5. Aguarde o processo completar

### Verificar que Funciona

Abra o **Explorador de Arquivos** e navegue até `P:\`. Você deve ver um diretório contendo dados do jogo DayZ. Se o drive P: existe e você pode navegar nele, está pronto para prosseguir.

---

## Passo 3: Criar a Estrutura de Diretórios do Mod

Todo mod DayZ segue uma estrutura de pastas específica. Crie os seguintes diretórios e arquivos no seu drive P::

```
P:\MyFirstMod\
    mod.cpp
    Scripts\
        config.cpp
        5_Mission\
            MyFirstMod\
                MissionHello.c
```

### Entendendo a Estrutura

| Caminho | Propósito |
|------|---------|
| `MyFirstMod/` | Raiz do seu mod |
| `mod.cpp` | Metadata (nome, autor) mostrada no launcher DayZ |
| `Scripts/config.cpp` | Diz para a engine do que seu mod depende e onde os scripts ficam |
| `Scripts/5_Mission/` | A camada de script de missão (UI, hooks de startup) |
| `Scripts/5_Mission/MyFirstMod/` | Subpasta para scripts de missão do seu mod |
| `Scripts/5_Mission/MyFirstMod/MissionHello.c` | Seu arquivo de script real |

Você precisa exatamente de **3 arquivos**. Vamos criá-los um por um.

---

## Passo 4: Escrever mod.cpp

Crie o arquivo `P:\MyFirstMod\mod.cpp` no seu editor de texto e cole este conteúdo:

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### O que Cada Linha Faz

- **`name`** -- O nome de exibição mostrado na lista de mods do launcher DayZ. Jogadores veem isso ao selecionar mods.
- **`author`** -- Seu nome ou nome da equipe.
- **`version`** -- Qualquer string de versão que você quiser. A engine não a parseia.
- **`overview`** -- Uma descrição mostrada ao expandir os detalhes do mod.

---

## Passo 5: Escrever config.cpp

Crie o arquivo `P:\MyFirstMod\Scripts\config.cpp` e cole este conteúdo:

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### O que Cada Seção Faz

**CfgPatches** declara seu mod para a engine DayZ. `requiredAddons[] = { "DZ_Data" };` garante que seu mod carrega **após** os dados base do jogo.

**CfgMods** diz para a engine onde seus scripts ficam. `class missionScriptModule` diz para a engine compilar todos os arquivos `.c` encontrados em `MyFirstMod/Scripts/5_Mission/`.

---

## Passo 6: Escrever Seu Primeiro Script

Crie o arquivo `P:\MyFirstMod\Scripts\5_Mission\MyFirstMod\MissionHello.c` e cole este conteúdo:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

### Explicação Linha por Linha

A palavra-chave `modded` é o coração do modding DayZ. Ela diz: "Pegue a classe `MissionServer` existente do jogo vanilla e adicione minhas mudanças por cima." Você não está criando uma nova classe -- está estendendo a existente.

`super.OnInit();` chama a implementação vanilla original. **Esta linha é crítica.** Se você pular, o código de inicialização de missão vanilla nunca roda e o jogo quebra. Sempre chame `super` primeiro.

`Print()` escreve uma mensagem no arquivo de log de script do DayZ. O prefixo `[MyFirstMod]` facilita encontrar suas mensagens no log.

### Sobre Arquivos `.c`

Scripts DayZ usam a extensão `.c`. Apesar de parecer C, isso é **Enforce Script**, a linguagem de script própria do DayZ. Ela tem classes, herança, arrays e maps, mas não é C, C++ ou C#. Sua IDE pode mostrar erros de syntax -- isso é normal e esperado.

---

## Passo 7: Empacotar o PBO com Addon Builder

DayZ carrega mods de arquivos `.pbo` (similar a .zip mas em um formato que a engine entende). Você precisa empacotar sua pasta `Scripts` em um PBO.

### Usando Addon Builder (GUI)

1. Abra **DayZ Tools** pela Steam
2. Clique em **Addon Builder**
3. Defina **Source directory** para: `P:\MyFirstMod\Scripts\`
4. Defina **Output/Destination directory** para: `P:\@MyFirstMod\Addons\`
5. Em **Addon Builder Options**: Defina **Prefix** para: `MyFirstMod\Scripts`
6. Clique **Pack**

### Alternativa: Testar Sem Empacotar (File Patching)

Durante o desenvolvimento, você pode pular o empacotamento PBO inteiramente usando o modo file patching:

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

File patching é mais rápido para iteração porque você edita um arquivo `.c`, reinicia o jogo e vê as mudanças imediatamente.

---

## Passo 8: Carregar o Mod no DayZ

### Opção A: Launcher DayZ

Abra o launcher, vá para a aba **Mods**, clique **Add local mod**, navegue até `P:\@MyFirstMod\`, habilite o mod e clique **Play**.

### Opção B: Linha de Comando (Recomendado para Desenvolvimento)

```batch
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

---

## Passo 9: Verificar no Log de Script

Após iniciar o DayZ com seu mod, a engine escreve toda saída de `Print()` em arquivos de log.

### Encontrando os Arquivos de Log

Logs do DayZ ficam no diretório AppData local:

```
C:\Users\<SeuUsuarioWindows>\AppData\Local\DayZ\
```

Procure pelo arquivo mais recente com nome como: `script_<data>_<hora>.log`

### O que Procurar

Abra o arquivo de log e procure por `[MyFirstMod]`. Você deve ver:

```
[MyFirstMod] Hello World! The SERVER mission has started.
```

**Se você vê sua mensagem: parabéns.** Seu primeiro mod DayZ está funcionando.

---

## Passo 10: Resolução de Problemas Comuns

### Problema: Sem Saída no Log (Mod Parece Não Carregar)

- Verifique os parâmetros de lançamento. O caminho `-mod=` deve apontar para a pasta correta.
- Verifique que config.cpp existe no nível correto: `Scripts/config.cpp` dentro da raiz do mod.
- Verifique o nome da classe CfgPatches.

### Problema: `SCRIPT (E): Undefined variable` ou `Undefined type`

- Typo em um nome de classe. `MisionServer` ao invés de `MissionServer`.
- Camada de script errada.
- Chamada `super.OnInit()` faltando.

### Problema: Mod Carrega Mas Script Nunca Executa

- Extensão do arquivo: certifique-se que o arquivo de script termina em `.c` (não `.c.txt`).
- Incompatibilidade de caminho de script.
- Nome de classe é case-sensitive.

---

## Referência Completa dos Arquivos

### Arquivo 1: `MyFirstMod/mod.cpp`

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### Arquivo 2: `MyFirstMod/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### Arquivo 3: `MyFirstMod/Scripts/5_Mission/MyFirstMod/MissionHello.c`

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

---

## Próximos Passos

1. **[Capítulo 8.2: Criando um Item Personalizado](02-custom-item.md)** -- Definir um novo item no jogo com texturas e spawning.
2. **Adicionar mais camadas de script** -- Criar pastas `3_Game` e `4_World` para organizar configuração, classes de dados e lógica de entidade.
3. **Adicionar keybindings** -- Criar um arquivo `Inputs.xml` e registrar ações de tecla personalizadas.
4. **Criar UI** -- Construir painéis no jogo usando arquivos de layout e `ScriptedWidgetEventHandler`.
5. **Usar um framework** -- Integrar com Community Framework (CF) ou MyFramework para features avançadas como RPC, gerenciamento de config e painéis admin.

---

**Próximo:** [Capítulo 8.2: Criando um Item Personalizado](02-custom-item.md)
