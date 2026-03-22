# Chapter 2.4: Your First Mod -- Minimum Viable

[Home](../README.md) | [<< Previous: mod.cpp & Workshop](03-mod-cpp.md) | **Minimum Viable Mod** | [Next: File Organization >>](05-file-organization.md)

---

## Indice

- [O Que Voce Precisa](#o-que-voce-precisa)
- [O Objetivo](#o-objetivo)
- [Passo 1: Criar a Estrutura de Diretorios](#passo-1-criar-a-estrutura-de-diretorios)
- [Passo 2: Criar o mod.cpp](#passo-2-criar-o-modcpp)
- [Passo 3: Criar o config.cpp](#passo-3-criar-o-configcpp)
- [Passo 4: Criar Seu Primeiro Script](#passo-4-criar-seu-primeiro-script)
- [Passo 5: Empacotar e Testar](#passo-5-empacotar-e-testar)
- [Passo 6: Verificar se Funciona](#passo-6-verificar-se-funciona)
- [Entendendo o Que Aconteceu](#entendendo-o-que-aconteceu)
- [Proximos Passos](#proximos-passos)
- [Solucao de Problemas](#solucao-de-problemas)

---

## O Que Voce Precisa

- DayZ instalado (retail ou DayZ Tools/Diag)
- Um editor de texto (VS Code, Notepad++, ou qualquer editor de texto puro)
- DayZ Tools instalado (para empacotamento PBO) -- OU voce pode testar sem empacotar (veja Passo 5)

---

## O Objetivo

Vamos criar um mod chamado **HelloMod** que:
1. Carrega no DayZ sem erros
2. Imprime `"[HelloMod] Mission started!"` no log de script
3. Usa a estrutura padrao correta

Este e o equivalente DayZ do "Hello World."

---

## Passo 1: Criar a Estrutura de Diretorios

Crie as seguintes pastas e arquivos. Voce precisa de exatamente **3 arquivos**:

```
HelloMod/
  mod.cpp
  Scripts/
    config.cpp
    5_Mission/
      HelloMod/
        HelloMission.c
```

Essa e a estrutura completa. Vamos criar cada arquivo.

---

## Passo 2: Criar o mod.cpp

Crie `HelloMod/mod.cpp` com este conteudo:

```cpp
name = "Hello Mod";
author = "YourName";
version = "1.0";
overview = "My first DayZ mod - prints a message on mission start.";
```

Estes sao os metadados minimos. O launcher do DayZ mostrara "Hello Mod" na lista de mods.

---

## Passo 3: Criar o config.cpp

Crie `HelloMod/Scripts/config.cpp` com este conteudo:

```cpp
class CfgPatches
{
    class HelloMod_Scripts
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
    class HelloMod
    {
        dir = "HelloMod";
        name = "Hello Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "HelloMod/Scripts/5_Mission" };
            };
        };
    };
};
```

Vamos detalhar o que cada parte faz:

- **CfgPatches** declara o mod para o motor. `requiredAddons` diz que dependemos de `DZ_Data` (dados vanilla do DayZ), o que garante que carregamos depois do jogo base.
- **CfgMods** diz ao motor onde nossos scripts estao. Usamos apenas `5_Mission` porque e la que os hooks do ciclo de vida da missao estao disponiveis.
- **dependencies** lista `"Mission"` porque nosso codigo faz hook no script module de missao.

---

## Passo 4: Criar Seu Primeiro Script

Crie `HelloMod/Scripts/5_Mission/HelloMod/HelloMission.c` com este conteudo:

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Server is running.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Client is running.");
    }
};
```

O que isso faz:

- `modded class MissionServer` estende a classe de missao do servidor vanilla. Quando o servidor inicia uma missao, `OnInit()` dispara e nossa mensagem e impressa.
- `modded class MissionGameplay` faz o mesmo para o lado do cliente.
- `super.OnInit()` chama a implementacao original (vanilla) primeiro -- isso e critico. Nunca pule.
- `Print()` escreve no arquivo de log de script do DayZ.

---

## Passo 5: Empacotar e Testar

Voce tem duas opcoes para teste:

### Opcao A: File Patching (Sem PBO Necessario -- Apenas Desenvolvimento)

O DayZ suporta carregamento de mods desempacotados durante o desenvolvimento. Esta e a forma mais rapida de iterar.

1. Coloque sua pasta `HelloMod/` dentro do diretorio de instalacao do DayZ (ou use o drive P: com o workbench)
2. Inicie o DayZ com o parametro `-filePatching` e carregue seu mod:

```
DayZDiag_x64.exe -mod=HelloMod -filePatching
```

Isso carrega scripts diretamente da pasta sem empacotamento PBO.

### Opcao B: Empacotamento PBO (Necessario para Distribuicao)

Para publicacao no Workshop ou deploy em servidor, voce precisa empacotar em PBO:

1. Abra o **DayZ Tools** (do Steam)
2. Abra o **Addon Builder**
3. Defina o diretorio fonte como `HelloMod/Scripts/`
4. Defina a saida como `@HelloMod/Addons/HelloMod_Scripts.pbo`
5. Clique em **Pack**

Ou use um empacotador de linha de comando como `PBOConsole`:

```
PBOConsole.exe -pack HelloMod/Scripts @HelloMod/Addons/HelloMod_Scripts.pbo
```

Coloque o `mod.cpp` ao lado da pasta `Addons/`:

```
@HelloMod/
  mod.cpp
  Addons/
    HelloMod_Scripts.pbo
```

Entao inicie o DayZ:

```
DayZDiag_x64.exe -mod=@HelloMod
```

---

## Passo 6: Verificar se Funciona

### Encontrando o Log de Script

O DayZ escreve a saida de script em arquivos de log no seu diretorio de perfil:

```
Windows: C:\Users\SeuNome\AppData\Local\DayZ\
```

Procure pelo arquivo `.RPT` ou `.log` mais recente. O log de script tipicamente se chama:

```
script_<data>_<hora>.log
```

### O Que Procurar

Abra o arquivo de log e procure por `[HelloMod]`. Voce deve ver:

```
[HelloMod] Mission started! Server is running.
```

ou (se voce entrou como cliente):

```
[HelloMod] Mission started! Client is running.
```

Se voce viu essa mensagem, parabens -- seu mod esta funcionando.

### Se Voce Vir Erros

Se o log contem linhas comecando com `SCRIPT (E):`, algo deu errado. Veja a secao de [Solucao de Problemas](#solucao-de-problemas) abaixo.

---

## Entendendo o Que Aconteceu

Aqui esta a sequencia de eventos quando o DayZ carregou seu mod:

```
1. Motor inicia, le arquivos config.cpp de todos os PBOs
2. CfgPatches "HelloMod_Scripts" e registrado
   --> requiredAddons garante que carrega apos DZ_Data
3. CfgMods "HelloMod" e registrado
   --> Motor sabe sobre o caminho do missionScriptModule
4. Motor compila scripts de 5_Mission de todos os mods
   --> HelloMission.c e compilado
   --> "modded class MissionServer" modifica a classe vanilla
5. Servidor inicia uma missao
   --> MissionServer.OnInit() e chamado
   --> Seu override roda, chamando super.OnInit() primeiro
   --> Print() escreve no log de script
6. Cliente conecta e carrega
   --> MissionGameplay.OnInit() e chamado
   --> Seu override roda
   --> Print() escreve no log do cliente
```

A palavra-chave `modded` e o mecanismo principal. Ela diz ao motor "pegue a classe existente e adicione minhas mudancas por cima." E assim que todo mod de DayZ se integra com o codigo vanilla.

---

## Proximos Passos

Agora que voce tem um mod funcionando, aqui estao progressoes naturais:

### Adicionar uma Camada 3_Game

Adicione dados de configuracao ou constantes que nao dependem de entidades do mundo:

```
HelloMod/
  Scripts/
    config.cpp              <-- Adicione entrada gameScriptModule
    3_Game/
      HelloMod/
        HelloConfig.c       <-- Classe de configuracao
    5_Mission/
      HelloMod/
        HelloMission.c      <-- Arquivo existente
```

Atualize o `config.cpp` para incluir a nova camada:

```cpp
dependencies[] = { "Game", "Mission" };

class defs
{
    class gameScriptModule
    {
        value = "";
        files[] = { "HelloMod/Scripts/3_Game" };
    };
    class missionScriptModule
    {
        value = "";
        files[] = { "HelloMod/Scripts/5_Mission" };
    };
};
```

### Adicionar uma Camada 4_World

Crie itens customizados, estenda jogadores ou adicione managers do mundo:

```
HelloMod/
  Scripts/
    config.cpp              <-- Adicione entrada worldScriptModule
    3_Game/
      HelloMod/
        HelloConfig.c
    4_World/
      HelloMod/
        HelloManager.c      <-- Logica com consciencia do mundo
    5_Mission/
      HelloMod/
        HelloMission.c
```

### Adicionar UI

Crie um painel simples dentro do jogo (coberto na Parte 3 deste guia):

```
HelloMod/
  GUI/
    layouts/
      hello_panel.layout    <-- Arquivo de layout de UI
  Scripts/
    5_Mission/
      HelloMod/
        HelloPanel.c        <-- Script de UI
```

### Adicionar um Item Customizado

Defina um item em `Data/config.cpp` e crie seu comportamento de script em `4_World`:

```
HelloMod/
  Data/
    config.cpp              <-- CfgVehicles com definicao do item
    Models/
      hello_item.p3d        <-- Modelo 3D
  Scripts/
    4_World/
      HelloMod/
        HelloItem.c         <-- Script de comportamento do item
```

### Depender de um Framework

Se voce quer usar funcionalidades do Community Framework (CF), adicione a dependencia:

```cpp
// No config.cpp
requiredAddons[] = { "DZ_Data", "JM_CF_Scripts" };
```

---

## Solucao de Problemas

### "Addon HelloMod_Scripts requires addon DZ_Data which is not loaded"

Seu `requiredAddons` referencia um addon que nao esta presente. Certifique-se de que `DZ_Data` esta escrito corretamente e que o jogo base do DayZ esta carregado.

### Sem Saida no Log (Mod Parece Nao Carregar)

Verifique estes pontos em ordem:

1. **O mod esta no parametro de lancamento?** Verifique se `-mod=HelloMod` ou `-mod=@HelloMod` esta no seu comando de lancamento.
2. **O config.cpp esta no lugar certo?** Ele deve estar na raiz do PBO (ou na raiz da pasta `Scripts/` quando usando file-patching).
3. **Os caminhos de script estao corretos?** Os caminhos `files[]` no `config.cpp` devem corresponder a estrutura de diretorio real. `"HelloMod/Scripts/5_Mission"` significa que o motor procura exatamente esse caminho.
4. **Existe uma classe CfgPatches?** Sem ela, o PBO e ignorado.

### SCRIPT (E): Undefined variable / Undefined type

Seu codigo referencia algo que nao existe naquela camada. Causas comuns:

- Referenciar `PlayerBase` a partir de `3_Game` (e definido em `4_World`)
- Erro de digitacao em nome de classe ou variavel
- Chamada `super.OnInit()` faltando (causa falhas em cascata)

### SCRIPT (E): Member not found

O metodo ou propriedade que voce esta chamando nao existe naquela classe. Verifique a API vanilla. Erro comum: chamar metodos de uma versao mais nova do DayZ quando esta rodando uma mais antiga.

### Mod Carrega Mas o Script Nao Executa

- Verifique se seu arquivo `.c` esta dentro do diretorio listado em `files[]`
- Garanta que o arquivo tem extensao `.c` (nao `.txt` ou `.cs`)
- Verifique se o nome da `modded class` corresponde exatamente a classe vanilla (sensivel a maiusculas)

### Erros de Empacotamento PBO

- Garanta que `config.cpp` esta no nivel raiz dentro do PBO
- Caminhos de arquivo dentro de PBOs usam barras normais (`/`), nao barras invertidas
- Certifique-se de que nao ha arquivos binarios na pasta Scripts (apenas `.c` e `.cpp`)

---

## Listagem Completa dos Arquivos

Para referencia, aqui estao todos os tres arquivos na sua totalidade:

### HelloMod/mod.cpp

```cpp
name = "Hello Mod";
author = "YourName";
version = "1.0";
overview = "My first DayZ mod - prints a message on mission start.";
```

### HelloMod/Scripts/config.cpp

```cpp
class CfgPatches
{
    class HelloMod_Scripts
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
    class HelloMod
    {
        dir = "HelloMod";
        name = "Hello Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "HelloMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### HelloMod/Scripts/5_Mission/HelloMod/HelloMission.c

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Server is running.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Client is running.");
    }
};
```

---

**Anterior:** [Capitulo 2.3: mod.cpp e Workshop](03-mod-cpp.md)
**Proximo:** [Capitulo 2.5: Boas Praticas de Organizacao de Arquivos](05-file-organization.md)
