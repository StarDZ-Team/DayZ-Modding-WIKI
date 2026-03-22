# Chapter 2.5: File Organization Best Practices

[Home](../README.md) | [<< Previous: Minimum Viable Mod](04-minimum-viable-mod.md) | **File Organization** | [Next: Server vs Client Architecture >>](06-server-client-split.md)

---

## Indice

- [A Estrutura de Diretorio Canonica](#a-estrutura-de-diretorio-canonica)
- [Convencoes de Nomenclatura](#convencoes-de-nomenclatura)
- [Tres Tipos de Mods](#tres-tipos-de-mods)
- [Mods com Divisao Cliente-Servidor](#mods-com-divisao-cliente-servidor)
- [O Que Vai Onde](#o-que-vai-onde)
- [Nomenclatura de PBO e Pasta @mod](#nomenclatura-de-pbo-e-pasta-mod)
- [Exemplos Reais de Mods Profissionais](#exemplos-reais-de-mods-profissionais)
- [Anti-Padroes](#anti-padroes)

---

## A Estrutura de Diretorio Canonica

Este e o layout padrao usado por mods profissionais de DayZ. Nem toda pasta e obrigatoria -- crie apenas o que precisar.

```
MyMod/                                    <-- Raiz do projeto (desenvolvimento)
  mod.cpp                                 <-- Metadados do launcher
  stringtable.csv                         <-- Localizacao (na raiz do mod, NAO em Scripts/)

  Scripts/                                <-- Raiz do PBO de scripts
    config.cpp                            <-- CfgPatches + CfgMods + definicoes de script modules
    Inputs.xml                            <-- Keybindings customizados (opcional)
    Data/
      Credits.json                        <-- Creditos do autor
      Version.hpp                         <-- String de versao (opcional)

    1_Core/                               <-- engineScriptModule (raro)
      MyMod/
        Constants.c

    3_Game/                               <-- gameScriptModule
      MyMod/
        MyModConfig.c                     <-- Classe de configuracao
        MyModRPCs.c                       <-- Identificadores / registro de RPC
        Data/
          SomeDataClass.c                 <-- Estruturas de dados puras

    4_World/                              <-- worldScriptModule
      MyMod/
        Entities/
          MyCustomItem.c                  <-- Itens customizados
          MyCustomVehicle.c
        Managers/
          MyModManager.c                  <-- Managers com consciencia do mundo
        Actions/
          ActionMyCustom.c                <-- Acoes customizadas do jogador

    5_Mission/                            <-- missionScriptModule
      MyMod/
        MyModRegister.c                   <-- Registro do mod (hook de startup)
        GUI/
          MyModPanel.c                    <-- Scripts de paineis de UI
          MyModHUD.c                      <-- Scripts de overlay de HUD

  GUI/                                    <-- Raiz do PBO de GUI (separado de Scripts)
    config.cpp                            <-- Config especifico de GUI (imageSets, estilos)
    layouts/                              <-- Arquivos .layout
      mymod_panel.layout
      mymod_hud.layout
    imagesets/                            <-- Arquivos .imageset + atlas de texturas
      mymod_icons.imageset
      mymod_icons.edds
    looknfeel/                            <-- Arquivos .styles
      mymod.styles

  Data/                                   <-- Raiz do PBO de dados (modelos, texturas, itens)
    config.cpp                            <-- CfgVehicles, CfgWeapons, etc.
    Models/
      my_item.p3d                         <-- Modelos 3D
    Textures/
      my_item_co.paa                      <-- Texturas de cor
      my_item_nohq.paa                    <-- Normal maps
    Materials/
      my_item.rvmat                       <-- Definicoes de material

  Sounds/                                 <-- Arquivos de som
    alert.ogg                             <-- Arquivos de audio (sempre .ogg)
    ambient.ogg

  ServerFiles/                            <-- Arquivos para admins de servidor copiarem
    types.xml                             <-- Definicoes de spawn da Central Economy
    cfgspawnabletypes.xml                 <-- Presets de acessorios
    README.md                             <-- Guia de instalacao

  Keys/                                   <-- Chaves de assinatura
    MyMod.bikey                           <-- Chave publica para verificacao do servidor
```

---

## Convencoes de Nomenclatura

### Nomes de Mod/Projeto

Use PascalCase com um prefixo claro:

```
MyFramework          <-- Framework, prefixo: MyMod_
MyMissions      <-- Mod de funcionalidade
MyWeapons       <-- Mod de conteudo
VPPAdminTools        <-- Alguns mods pulam underscores
DabsFramework        <-- PascalCase sem separador
```

### Nomes de Classe

Use um prefixo curto unico para seu mod, seguido de um underscore e o proposito da classe:

```c
// Padrao MyMod: My[Subsistema]_[Nome]
class MyLog             // Logging do core
class MyRPC             // RPC do core
class MyW_Config        // Config de armas
class MyM_MissionBase   // Base de missoes

// Padrao CF: CF_[Nome]
class CF_ModuleWorld
class CF_EventArgs

// Padrao COT: JM_COT_[Nome]
class JM_COT_Menu

// Padrao VPP: [Nome] (sem prefixo)
class ChatCommandBase
class WebhookManager
```

**Regras:**
- Prefixo previne colisoes com outros mods
- Mantenha curto (2-4 caracteres)
- Seja consistente dentro do seu mod

### Nomes de Arquivo

Nomeie cada arquivo com a classe principal que ele contem:

```
MyLog.c            <-- Contem class MyLog
MyRPC.c            <-- Contem class MyRPC
MyModConfig.c        <-- Contem class MyModConfig
ActionMyCustom.c     <-- Contem class ActionMyCustom
```

Um classe por arquivo e o ideal. Multiplas classes auxiliares pequenas em um arquivo e aceitavel quando sao fortemente acopladas.

### Arquivos de Layout

Use minusculas com o prefixo do seu mod:

```
my_admin_panel.layout
my_killfeed_overlay.layout
mymod_settings_dialog.layout
```

### Nomes de Variaveis

```c
// Variaveis membro: prefixo m_
protected int m_Count;
protected ref array<string> m_Items;
protected ref MyConfig m_Config;

// Variaveis estaticas: prefixo s_
static int s_InstanceCount;
static ref MyLog s_Logger;

// Constantes: MAIUSCULAS_COMPLETAS
const int MAX_PLAYERS = 60;
const float UPDATE_INTERVAL = 0.5;
const string MOD_NAME = "MyMod";

// Variaveis locais: camelCase (sem prefixo)
int count = 0;
string playerName = identity.GetName();
float deltaTime = timeArgs.DeltaTime;

// Parametros: camelCase (sem prefixo)
void SetConfig(MyConfig config, bool forceReload)
```

---

## Tres Tipos de Mods

Mods de DayZ se dividem em tres categorias. Cada uma tem uma enfase de estrutura diferente.

### 1. Mod de Conteudo

Adiciona itens, armas, veiculos, construcoes -- principalmente assets 3D com scripting minimo.

```
MyWeaponPack/
  mod.cpp
  Data/
    config.cpp                <-- CfgVehicles, CfgWeapons, CfgMagazines, CfgAmmo
    Weapons/
      MyRifle/
        MyRifle.p3d
        MyRifle_co.paa
        MyRifle_nohq.paa
        MyRifle.rvmat
    Ammo/
      MyAmmo/
        MyAmmo.p3d
  Scripts/                    <-- Minimo (pode nem existir)
    config.cpp
    4_World/
      MyWeaponPack/
        MyRifle.c             <-- Apenas se a arma precisa de comportamento customizado
  ServerFiles/
    types.xml
```

**Caracteristicas:**
- Pesado em `Data/` (modelos, texturas, materiais)
- Pesado em `Data/config.cpp` (definicoes CfgVehicles, CfgWeapons)
- Scripting minimo ou nenhum
- Scripts apenas quando itens precisam de comportamento customizado alem do que o config define

### 2. Mod de Script

Adiciona funcionalidades de gameplay, ferramentas de admin, sistemas -- principalmente codigo com assets minimos.

```
MyAdminTools/
  mod.cpp
  stringtable.csv
  Scripts/
    config.cpp
    3_Game/
      MyAdminTools/
        Config.c
        RPCHandler.c
        Permissions.c
    4_World/
      MyAdminTools/
        PlayerManager.c
        VehicleManager.c
    5_Mission/
      MyAdminTools/
        AdminMenu.c
        AdminHUD.c
  GUI/
    layouts/
      admin_menu.layout
      admin_hud.layout
    imagesets/
      admin_icons.imageset
```

**Caracteristicas:**
- Pesado em `Scripts/` (maior parte do codigo em 3_Game, 4_World, 5_Mission)
- Layouts de GUI e imagesets para UI
- Pouco ou nenhum `Data/` (sem modelos 3D)
- Geralmente depende de um framework (CF, DabsFramework, MyFramework)

### 3. Mod de Framework

Fornece infraestrutura compartilhada para outros mods -- logging, RPC, configuracao, sistemas de UI.

```
MyFramework/
  mod.cpp
  stringtable.csv
  Scripts/
    config.cpp
    Data/
      Credits.json
    1_Core/                     <-- Frameworks frequentemente usam 1_Core
      MyFramework/
        Constants.c
        LogLevel.c
    3_Game/
      MyFramework/
        Config/
          ConfigManager.c
          ConfigBase.c
        RPC/
          RPCManager.c
        Events/
          EventBus.c
        Logging/
          Logger.c
        Permissions/
          PermissionManager.c
        UI/
          ViewBase.c
          DialogBase.c
    4_World/
      MyFramework/
        Module/
          ModuleManager.c
          ModuleBase.c
        Player/
          PlayerData.c
    5_Mission/
      MyFramework/
        MissionHooks.c
        ModRegistration.c
  GUI/
    config.cpp
    layouts/
    imagesets/
    icons/
    looknfeel/
```

**Caracteristicas:**
- Usa todas as camadas de script (1_Core ate 5_Mission)
- Hierarquia de subdiretorios profunda em cada camada
- Define `defines[]` para deteccao de funcionalidades
- Outros mods dependem dele via `requiredAddons`
- Fornece classes base que outros mods estendem

---

## Mods com Divisao Cliente-Servidor

Quando um mod tem tanto comportamento visivel ao cliente (UI, renderizacao de entidades) quanto logica apenas de servidor (spawning, cerebros de IA, estado seguro), ele deve ser dividido em dois pacotes.

### Estrutura de Diretorio

```
MyMod/                                    <-- Raiz do projeto (repositorio de desenvolvimento)
  MyMod_MyMod/                           <-- Pacote do cliente (carregado via -mod=)
    mod.cpp
    stringtable.csv
    Scripts/
      config.cpp                          <-- type = "mod"
      3_Game/MyMod/                       <-- Classes de dados compartilhadas, RPCs
      4_World/MyMod/                      <-- Renderizacao de entidades do lado do cliente
      5_Mission/MyMod/                    <-- UI do cliente, HUD
    GUI/
      layouts/
    Sounds/

  MyMod_MyModServer/                     <-- Pacote do servidor (carregado via -servermod=)
    mod.cpp
    Scripts/
      config.cpp                          <-- type = "servermod"
      3_Game/MyModServer/                 <-- Classes de dados do lado do servidor
      4_World/MyModServer/                <-- Spawning, logica de IA, gerenciamento de estado
      5_Mission/MyModServer/              <-- Hooks de startup/shutdown do servidor
```

### Regras Principais para Mods Divididos

1. **O pacote do cliente e carregado por todos** (servidor e todos os clientes via `-mod=`)
2. **O pacote do servidor e carregado apenas pelo servidor** (via `-servermod=`)
3. **O pacote do servidor depende do pacote do cliente** (via `requiredAddons`)
4. **Nunca coloque codigo de UI no pacote do servidor** -- clientes nao o receberao
5. **Mantenha logica segura/privada no pacote do servidor** -- nunca e enviado aos clientes

### Cadeia de Dependencias

```cpp
// config.cpp do pacote do cliente
class CfgPatches
{
    class MyMyMod_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "MyCore_Scripts" };
    };
};

// config.cpp do pacote do servidor
class CfgPatches
{
    class MyMyModServer_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "MyMyMod_Scripts", "MyCore_Scripts" };
        //                                  ^^^ depende do pacote do cliente
    };
};
```

### Exemplo Real: MyMissions Mod

```
MyMissions/
  MyMissions/                        <-- Cliente (-mod=)
    mod.cpp                               type = "mod"
    Scripts/
      config.cpp                          requiredAddons: MyCore_Scripts
      3_Game/MyMissions/             Enums compartilhados, config, RPC IDs
      4_World/MyMissions/            Marcadores de missao (renderizacao do cliente)
      5_Mission/MyMissions/          UI de missao, HUD de radio
    GUI/layouts/                          Layouts de painel de missao
    Sounds/                               Sons de bip de radio

  MyMissions_Server/                 <-- Servidor (-servermod=)
    mod.cpp                               type = "servermod"
    Scripts/
      config.cpp                          requiredAddons: MyScripts, MyCore_Scripts
      3_Game/MyMissionsServer/       Extensoes de config do servidor
      4_World/MyMissionsServer/      Spawner de missao, gerenciador de loot
      5_Mission/MyMissionsServer/    Ciclo de vida de missao do servidor
```

---

## O Que Vai Onde

### Diretorio Data/

Assets fisicos e definicoes de itens:

```
Data/
  config.cpp          <-- CfgVehicles, CfgWeapons, CfgMagazines, CfgAmmo
  Models/             <-- Arquivos de modelo 3D .p3d
  Textures/           <-- Arquivos de textura .paa, .edds
  Materials/          <-- Definicoes de material .rvmat
  Animations/         <-- Arquivos de animacao .anim (raro)
```

### Diretorio Scripts/

Todo codigo Enforce Script:

```
Scripts/
  config.cpp          <-- CfgPatches, CfgMods, definicoes de script modules
  Inputs.xml          <-- Definicoes de keybinding
  Data/
    Credits.json      <-- Creditos do autor
    Version.hpp       <-- String de versao
  1_Core/             <-- Constantes fundamentais e utilitarios
  3_Game/             <-- Configs, RPCs, classes de dados
  4_World/            <-- Entidades, managers, logica de gameplay
  5_Mission/          <-- UI, HUD, ciclo de vida da missao
```

### Diretorio GUI/

Recursos de interface do usuario:

```
GUI/
  config.cpp          <-- CfgPatches especifico de GUI (para registro de imageset/style)
  layouts/            <-- Arquivos .layout (arvores de widgets)
  imagesets/          <-- XML .imageset + atlas de texturas .edds
  icons/              <-- Imagesets de icones (podem ser separados dos imagesets gerais)
  looknfeel/          <-- Arquivos .styles (propriedades visuais de widgets)
  fonts/              <-- Arquivos de fontes customizadas (raro)
  sounds/             <-- Arquivos de som de UI (click, hover, etc.)
```

### Diretorio Sounds/

Arquivos de audio:

```
Sounds/
  alert.ogg           <-- Sempre formato .ogg
  ambient.ogg
  click.ogg
```

Config de som (CfgSoundSets, CfgSoundShaders) vai em `Scripts/config.cpp`, nao em um config separado de Sounds.

### Diretorio ServerFiles/

Arquivos que administradores de servidor copiam para a pasta de missao do servidor:

```
ServerFiles/
  types.xml                   <-- Definicoes de spawn de itens para Central Economy
  cfgspawnabletypes.xml       <-- Presets de acessorios/cargo
  cfgeventspawns.xml          <-- Posicoes de spawn de eventos (raro)
  README.md                   <-- Instrucoes de instalacao
```

---

## Nomenclatura de PBO e Pasta @mod

### Nomes de PBO

Cada PBO recebe um nome descritivo com o prefixo do mod:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo         <-- Codigo de script
    MyMod_Data.pbo            <-- Modelos, texturas, itens
    MyMod_GUI.pbo             <-- Layouts, imagesets, estilos
    MyMod_Sounds.pbo          <-- Audio (as vezes agrupado com Data)
```

O nome do PBO nao precisa corresponder ao nome da classe CfgPatches, mas mante-los alinhados previne confusao.

### Nome da Pasta @mod

O prefixo `@` e uma convencao do Steam Workshop. Durante o desenvolvimento, voce pode omiti-lo:

```
Desenvolvimento:    MyMod/           <-- Sem prefixo @
Workshop:           @MyMod/          <-- Com prefixo @
```

O `@` nao tem significado tecnico para o motor. E puramente convencao organizacional.

### Multiplos PBOs por Mod

Mods grandes se dividem em multiplos PBOs por varias razoes:

1. **Ciclos de atualizacao separados** -- atualizar scripts sem re-baixar modelos 3D
2. **Componentes opcionais** -- PBO de GUI e opcional se o mod funciona headless
3. **Pipeline de build** -- PBOs diferentes construidos por ferramentas diferentes

```
@MyWeapons/
  Addons/
    MyWeapons_Scripts.pbo    <-- Comportamento de script
    MyWeapons_Data.pbo       <-- 268 modelos de armas, texturas, configs
```

Cada PBO tem seu proprio `config.cpp` com sua propria entrada `CfgPatches`. O `requiredAddons` entre eles controla a ordem de carregamento:

```cpp
// Scripts/config.cpp
class CfgPatches
{
    class MyWeapons_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "DZ_Weapons_Firearms" };
    };
};

// Data/config.cpp
class CfgPatches
{
    class MyWeapons_Data
    {
        requiredAddons[] = { "DZ_Data", "DZ_Weapons_Firearms" };
    };
};
```

---

## Exemplos Reais de Mods Profissionais

### MyFramework -- Mod de Framework

```
MyFramework/
  MyFramework/                            <-- Pacote do cliente
    mod.cpp
    stringtable.csv
    GUI/
      config.cpp
      fonts/
      icons/                              <-- 5 imagesets de peso de icones
      imagesets/
      layouts/
        dialogs/
        options/
        prefabs/
        MyMod/loading/hints/
        MyFramework/AdminPanel/
        MyFramework/Dialogs/
        MyFramework/Modules/
        MyFramework/Options/
        MyFramework/Prefabs/
        MyFramework/Tooltip/
      looknfeel/
      sounds/
    Scripts/
      config.cpp
      Inputs.xml
      1_Core/MyMod/                      <-- Niveis de log, constantes
      2_GameLib/MyMod/UI/                <-- Sistema de atributos MVC
      3_Game/MyMod/                      <-- 15+ pastas de subsistemas
        Animation/
        Branding/
        Chat/
        Collections/
        Config/
        Core/
        Events/
        Hints/
        Killfeed/
        Logging/
        Module/
        MVC/
        Notifications/
        Permissions/
        PlayerData/
        RPC/
        Settings/
        Theme/
        Timer/
        UI/
      4_World/MyMod/                     <-- Dados de jogador, managers do mundo
      5_Mission/MyMod/                   <-- Painel de admin, registro de mods

  MyFramework_Server/                     <-- Pacote do servidor
    mod.cpp
    Scripts/
      config.cpp
      ...
```

### Community Online Tools (COT) -- Ferramenta de Admin

```
JM/COT/
  mod.cpp
  GUI/
    config.cpp
    layouts/
      cursors/
      uiactions/
      vehicles/
    textures/
  Objects/Debug/
    config.cpp                            <-- Definicoes de entidades de debug
  Scripts/
    config.cpp
    Data/
      Credits.json
      Version.hpp
      Inputs.xml
    Common/                               <-- Compartilhado entre todas as camadas
    1_Core/
    3_Game/
    4_World/
    5_Mission/
  languagecore/
    config.cpp                            <-- Config de string table
```

Note o padrao da pasta `Common/`: incluida em todo script module via `files[]`, permitindo tipos compartilhados entre todas as camadas.

### MyWeapons Mod -- Mod de Conteudo

```
MyWeapons/
  MyWeapons/
    mod.cpp
    Data/
      config.cpp                          <-- Config mesclado: 268 definicoes de armas
      Ammo/                               <-- Organizado por fonte/calibre
        BC/12.7x55/
        BC/338/
        BC/50Cal/
        GCGN/3006/
        GCGN/300AAC/
      Attachments/                        <-- Miras, supressores, grips
      Magazines/
      Weapons/                            <-- Modelos de armas organizados por fonte
    Scripts/
      config.cpp                          <-- Definicoes de script modules
      3_Game/                             <-- Config de armas, sistema de stats
      4_World/                            <-- Overrides de comportamento de armas
      5_Mission/                          <-- Registro, UI
```

Mods de conteudo tem um diretorio `Data/` massivo e `Scripts/` relativamente pequeno.

### DabsFramework -- Framework de UI

```
DabsFramework/
  mod.cpp
  gui/
    config.cpp
    imagesets/
    icons/
      brands.imageset
      light.imageset
      regular.imageset
      solid.imageset
      thin.imageset
    looknfeel/
  scripts/
    config.cpp
    Credits.json
    Version.hpp
    1_core/
    2_GameLib/                            <-- Um dos poucos mods usando camada 2
    3_Game/
    4_World/
    5_Mission/
```

Nota: DabsFramework usa nomes de pasta em minusculas (`scripts/`, `gui/`). Isso funciona porque o Windows nao diferencia maiusculas, mas pode causar problemas no Linux. A convencao e usar a capitalizacao canonica (`Scripts/`, `GUI/`).

---

## Anti-Padroes

### 1. Despejo Plano de Scripts

```
Scripts/
  3_Game/
    AllMyStuff.c            <-- 2000 linhas, 15 classes
    MoreStuff.c             <-- 1500 linhas, 12 classes
```

**Correcao:** Um arquivo por classe, organizado em subdiretorios por subsistema.

### 2. Posicionamento de Camada Errado

```
Scripts/
  3_Game/
    MyMod/
      PlayerManager.c       <-- Referencia PlayerBase (definido em 4_World)
      MyPanel.c             <-- Codigo de UI (pertence a 5_Mission)
      MyItem.c              <-- Estende ItemBase (pertence a 4_World)
```

**Correcao:** Siga as regras de camada do Capitulo 2.1. Mova codigo de entidades para `4_World` e codigo de UI para `5_Mission`.

### 3. Sem Subdiretorio do Mod nas Camadas de Script

```
Scripts/
  3_Game/
    Config.c                <-- Risco de colisao de nome com outros mods!
    RPCs.c
```

**Correcao:** Sempre use namespace com um subdiretorio:

```
Scripts/
  3_Game/
    MyMod/
      Config.c
      RPCs.c
```

### 4. stringtable.csv Dentro de Scripts/

```
Scripts/
  stringtable.csv           <-- LOCALIZACAO ERRADA
  config.cpp
```

**Correcao:** `stringtable.csv` vai na raiz do mod (ao lado de `mod.cpp`):

```
MyMod/
  mod.cpp
  stringtable.csv           <-- Correto
  Scripts/
    config.cpp
```

### 5. Assets e Scripts Misturados em Um PBO

```
MyMod/
  config.cpp
  Scripts/3_Game/...
  Models/weapon.p3d
  Textures/weapon_co.paa
```

**Correcao:** Separe em multiplos PBOs:

```
MyMod/
  Scripts/
    config.cpp
    3_Game/...
  Data/
    config.cpp
    Models/weapon.p3d
    Textures/weapon_co.paa
```

### 6. Subdiretorios Profundamente Aninhados

```
Scripts/3_Game/MyMod/Systems/Core/Config/Managers/Settings/PlayerSettings.c
```

**Correcao:** Mantenha aninhamento em 2-3 niveis no maximo. Achate quando possivel:

```
Scripts/3_Game/MyMod/Config/PlayerSettings.c
```

### 7. Nomenclatura Inconsistente

```
mymod_Config.c
MyMod_rpc.c
MYMOD_Manager.c
my_mod_panel.c
```

**Correcao:** Escolha uma convencao e mantenha-a:

```
MyModConfig.c
MyModRPC.c
MyModManager.c
MyModPanel.c
```

---

## Checklist de Resumo

Antes de publicar seu mod, verifique:

- [ ] `mod.cpp` esta na raiz do mod (ao lado de `Addons/` ou `Scripts/`)
- [ ] `stringtable.csv` esta na raiz do mod (NAO dentro de `Scripts/`)
- [ ] `config.cpp` existe na raiz de cada PBO
- [ ] `requiredAddons[]` lista TODAS as dependencias
- [ ] Caminhos `files[]` dos script modules correspondem a estrutura de diretorio real
- [ ] Todo arquivo `.c` esta dentro de um subdiretorio com namespace do mod (ex: `3_Game/MyMod/`)
- [ ] Nomes de classe tem um prefixo unico para evitar colisoes
- [ ] Classes de entidade estao em `4_World`, classes de UI estao em `5_Mission`, classes de dados estao em `3_Game`
- [ ] Sem segredos ou codigo de debug nos PBOs publicados
- [ ] Logica apenas de servidor esta em um pacote `-servermod` separado (se aplicavel)

---

**Anterior:** [Capitulo 2.4: Seu Primeiro Mod -- Minimo Viavel](04-minimum-viable-mod.md)
**Proximo:** [Parte 3: Sistema de GUI e Layout](../03-gui-system/01-widget-types.md)
