# Chapter 2.2: config.cpp Deep Dive

[Home](../README.md) | [<< Previous: The 5-Layer Script Hierarchy](01-five-layers.md) | **config.cpp Deep Dive** | [Next: mod.cpp & Workshop >>](03-mod-cpp.md)

---

## Indice

- [Visao Geral](#visao-geral)
- [Onde o config.cpp Fica](#onde-o-configcpp-fica)
- [Bloco CfgPatches](#bloco-cfgpatches)
- [Bloco CfgMods](#bloco-cfgmods)
- [class defs: Caminhos dos Script Modules](#class-defs-caminhos-dos-script-modules)
- [class defs: imageSets e widgetStyles](#class-defs-imagesets-e-widgetstyles)
- [Array defines](#array-defines)
- [CfgVehicles: Definicoes de Itens e Entidades](#cfgvehicles-definicoes-de-itens-e-entidades)
- [CfgSoundSets e CfgSoundShaders](#cfgsoundsets-e-cfgsoundshaders)
- [CfgAddons: Declaracoes de Preload](#cfgaddons-declaracoes-de-preload)
- [Exemplos Reais de Mods Profissionais](#exemplos-reais-de-mods-profissionais)
- [Erros Comuns](#erros-comuns)
- [Template Completo](#template-completo)

---

## Visao Geral

Um mod de DayZ tipicamente tem um ou mais arquivos PBO, cada um contendo um `config.cpp` na sua raiz. O motor le essas configs durante a inicializacao para determinar:

1. **Do que seu mod depende** (CfgPatches)
2. **Onde seus scripts estao** (CfgMods class defs)
3. **Quais itens/entidades ele adiciona** (CfgVehicles, CfgWeapons, etc.)
4. **Quais sons ele adiciona** (CfgSoundSets, CfgSoundShaders)
5. **Quais simbolos de preprocessador ele define** (defines[])

Um mod geralmente tem PBOs separados para diferentes preocupacoes:
- `MyMod/Scripts/config.cpp` -- definicoes de script e caminhos de modulos
- `MyMod/Data/config.cpp` -- definicoes de itens/veiculos/armas
- `MyMod/GUI/config.cpp` -- declaracoes de imageset e estilos

---

## Onde o config.cpp Fica

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo         --> contem Scripts/config.cpp
    MyMod_Data.pbo            --> contem Data/config.cpp (itens, veiculos)
    MyMod_GUI.pbo             --> contem GUI/config.cpp (imagesets, estilos)
```

Cada PBO tem seu proprio `config.cpp`. O motor le todos eles. Multiplos PBOs do mesmo mod sao comuns -- esta e uma pratica padrao, nao uma excecao.

---

## Bloco CfgPatches

`CfgPatches` e **obrigatorio** em todo config.cpp. Ele declara um patch nomeado e suas dependencias.

### Sintaxe

```cpp
class CfgPatches
{
    class MyMod_Scripts          // Nome unico do patch (nao pode colidir com outros mods)
    {
        units[] = {};            // Classnames de entidades que este PBO adiciona (para editor/spawner)
        weapons[] = {};          // Classnames de armas que este PBO adiciona
        requiredVersion = 0.1;   // Versao minima do jogo (sempre 0.1 na pratica)
        requiredAddons[] =       // Dependencias de PBO -- CONTROLA A ORDEM DE CARREGAMENTO
        {
            "DZ_Data"            // Quase sempre necessario
        };
    };
};
```

### requiredAddons: A Cadeia de Dependencias

Este e o campo mais critico de todo o config. `requiredAddons` diz ao motor:

1. **Ordem de carregamento:** Os scripts do seu PBO compilam DEPOIS de todos os addons listados
2. **Dependencia obrigatoria:** Se um addon listado estiver faltando, seu mod falha ao carregar

Cada entrada deve corresponder a um nome de classe `CfgPatches` de outro mod:

| Dependencia | Entrada em requiredAddons | Quando Usar |
|-------------|--------------------------|-------------|
| Dados vanilla do DayZ | `"DZ_Data"` | Quase sempre (itens, configs) |
| Scripts vanilla do DayZ | `"DZ_Scripts"` | Ao estender classes de script vanilla |
| Armas vanilla | `"DZ_Weapons_Firearms"` | Ao adicionar armas/acessorios |
| Magazines vanilla | `"DZ_Weapons_Magazines"` | Ao adicionar magazines/municao |
| Community Framework | `"JM_CF_Scripts"` | Ao usar o sistema de modulos CF |
| DabsFramework | `"DF_Scripts"` | Ao usar MVC/framework do Dabs |
| MyFramework | `"MyCore_Scripts"` | Ao construir um mod MyMod |

**Exemplo: Multiplas dependencias**

```cpp
requiredAddons[] =
{
    "DZ_Scripts",
    "DZ_Data",
    "DZ_Weapons_Firearms",
    "DZ_Weapons_Ammunition",
    "DZ_Weapons_Magazines",
    "MyCore_Scripts"
};
```

### units[] e weapons[]

Esses arrays listam os classnames de entidades e armas definidos neste PBO. Eles servem dois propositos:

1. O editor do DayZ os usa para popular listas de spawn
2. Outras ferramentas (como paineis de admin) os usam para descoberta de itens

```cpp
units[] = { "MyMod_SomeBuilding", "MyMod_SomeVehicle" };
weapons[] = { "MyMod_CustomRifle", "MyMod_CustomPistol" };
```

Para PBOs apenas de script, deixe ambos vazios.

---

## Bloco CfgMods

`CfgMods` e necessario quando seu PBO adiciona ou modifica scripts, inputs ou recursos de GUI. Ele define a identidade do mod e sua estrutura de script modules.

### Estrutura Basica

```cpp
class CfgMods
{
    class MyMod                   // Identificador do mod (usado internamente)
    {
        dir = "MyMod";            // Diretorio raiz do mod (caminho de prefixo do PBO)
        name = "My Mod Name";     // Nome legivel por humanos
        author = "AuthorName";    // String do autor
        credits = "AuthorName";   // String de creditos
        creditsJson = "MyMod/Scripts/Data/Credits.json";  // Caminho para arquivo de creditos
        versionPath = "MyMod/Scripts/Data/Version.hpp";   // Caminho para arquivo de versao
        overview = "Description"; // Descricao do mod
        picture = "";             // Caminho da imagem de logo
        action = "";              // URL (website/Discord)
        type = "mod";             // "mod" para cliente, "servermod" para apenas servidor
        extra = 0;                // Reservado, sempre 0
        hideName = 0;             // Ocultar nome do mod no launcher (0 = mostrar, 1 = ocultar)
        hidePicture = 0;          // Ocultar imagem do mod no launcher

        // Definicoes de keybind (opcional)
        inputs = "MyMod/Scripts/Data/Inputs.xml";

        // Simbolos de preprocessador (opcional)
        defines[] = { "MYMOD_LOADED" };

        // Dependencias de script modules
        dependencies[] = { "Game", "World", "Mission" };

        // Caminhos dos script modules
        class defs
        {
            // ... (coberto na proxima secao)
        };
    };
};
```

### Campos Principais Explicados

**`dir`** -- O prefixo de caminho raiz para todos os caminhos de arquivo neste config. Quando o motor ve `files[] = { "MyMod/Scripts/3_Game" }`, ele usa `dir` como base.

**`type`** -- Ou `"mod"` (carregado via `-mod=`) ou `"servermod"` (carregado via `-servermod=`). Server mods rodam apenas no servidor dedicado. E assim que voce separa logica apenas de servidor do codigo do cliente.

**`dependencies`** -- Quais script modules vanilla seu mod estende. Quase sempre `{ "Game", "World", "Mission" }`. Valores possiveis: `"Core"`, `"GameLib"`, `"Game"`, `"World"`, `"Mission"`.

**`inputs`** -- Caminho para um arquivo `Inputs.xml` que define keybindings customizados. O caminho e relativo a raiz do PBO.

---

## class defs: Caminhos dos Script Modules

O bloco `class defs` dentro de `CfgMods` e onde voce diz ao motor quais pastas contem seus scripts para cada camada.

### Todos os Script Modules Disponiveis

```cpp
class defs
{
    class engineScriptModule        // 1_Core
    {
        value = "";                 // Funcao de entrada (vazio = padrao)
        files[] = { "MyMod/Scripts/1_Core" };
    };
    class gameLibScriptModule       // 2_GameLib (raramente usado)
    {
        value = "";
        files[] = { "MyMod/Scripts/2_GameLib" };
    };
    class gameScriptModule          // 3_Game
    {
        value = "";
        files[] = { "MyMod/Scripts/3_Game" };
    };
    class worldScriptModule         // 4_World
    {
        value = "";
        files[] = { "MyMod/Scripts/4_World" };
    };
    class missionScriptModule       // 5_Mission
    {
        value = "";
        files[] = { "MyMod/Scripts/5_Mission" };
    };
};
```

### O Campo `value`

O campo `value` especifica um nome de funcao de entrada customizada para aquele script module. Quando vazio (`""`), o motor usa o ponto de entrada padrao. Quando definido (ex: `value = "CreateGameMod"`), o motor chama aquela funcao global ao inicializar o modulo.

Community Framework usa isso:

```cpp
class gameScriptModule
{
    value = "CF_CreateGame";    // Ponto de entrada customizado
    files[] = { "JM/CF/Scripts/3_Game" };
};
```

Para a maioria dos mods, deixe `value` vazio.

### O Array `files`

Cada entrada e um **caminho de diretorio** (nao arquivos individuais). O motor compila recursivamente todos os arquivos `.c` nos diretorios listados:

```cpp
class gameScriptModule
{
    value = "";
    files[] =
    {
        "MyMod/Scripts/3_Game"      // Todos os arquivos .c nesta arvore de diretorio
    };
};
```

Voce pode listar multiplos diretorios. E assim que o padrao "pasta Common" funciona:

```cpp
class gameScriptModule
{
    value = "";
    files[] =
    {
        "MyMod/Scripts/Common",     // Codigo compartilhado compilado em TODOS os modulos
        "MyMod/Scripts/3_Game"      // Codigo especifico da camada
    };
};
class worldScriptModule
{
    value = "";
    files[] =
    {
        "MyMod/Scripts/Common",     // Mesmo codigo compartilhado, tambem disponivel aqui
        "MyMod/Scripts/4_World"
    };
};
```

### Defina Apenas o Que Voce Usa

Voce nao precisa declarar todos os cinco script modules. Declare apenas os que seu mod realmente usa:

```cpp
// Um mod simples que so tem codigo em 3_Game e 5_Mission
class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    class missionScriptModule
    {
        files[] = { "MyMod/Scripts/5_Mission" };
    };
};
```

---

## class defs: imageSets e widgetStyles

Se seu mod usa icones customizados ou estilos de GUI, declare-os dentro de `class defs`:

### imageSets

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "MyMod/GUI/imagesets/icons.imageset",
            "MyMod/GUI/imagesets/items.imageset"
        };
    };
    // ... script modules ...
};
```

ImageSets sao arquivos XML que mapeiam regioes nomeadas de um atlas de textura para nomes de sprites. Uma vez declarados aqui, qualquer script pode referenciar os icones pelo nome.

### widgetStyles

```cpp
class defs
{
    class widgetStyles
    {
        files[] =
        {
            "MyMod/GUI/looknfeel/custom.styles"
        };
    };
    // ... script modules ...
};
```

Widget styles definem propriedades visuais reutilizaveis (cores, fontes, padding) para widgets de GUI.

### Exemplo Real: MyFramework

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "MyFramework/GUI/imagesets/prefabs.imageset",
            "MyFramework/GUI/imagesets/CUI.imageset",
            "MyFramework/GUI/icons/thin.imageset",
            "MyFramework/GUI/icons/light.imageset",
            "MyFramework/GUI/icons/regular.imageset",
            "MyFramework/GUI/icons/solid.imageset",
            "MyFramework/GUI/icons/brands.imageset"
        };
    };
    class widgetStyles
    {
        files[] =
        {
            "MyFramework/GUI/looknfeel/prefabs.styles"
        };
    };
    // ... script modules ...
};
```

---

## Array defines

O array `defines[]` em `CfgMods` cria simbolos de preprocessador que outros mods podem verificar com `#ifdef`:

```cpp
defines[] =
{
    "MYMOD_CORE",           // Outros mods podem fazer: #ifdef MYMOD_CORE
    // "MYMOD_DEBUG"        // Comentado = desabilitado em release
};
```

### Casos de Uso

**Deteccao de funcionalidades entre mods:**

```c
// No codigo de outro mod:
#ifdef MYMOD_CORE
    MyLog.Info("MyMod", "MyFramework detectado, habilitando integracao");
#else
    Print("[MyMod] Rodando sem MyFramework");
#endif
```

**Builds de debug/release:**

```cpp
defines[] =
{
    "MYMOD_LOADED",
    // "MYMOD_DEBUG",        // Descomente para logging de debug
    // "MYMOD_VERBOSE"       // Descomente para saida detalhada
};
```

### Exemplos Reais

**COT** usa defines extensivamente para feature flags:

```cpp
defines[] =
{
    "JM_COT",
    "JM_COT_VEHICLE_ONSPAWNVEHICLE",
    "COT_BUGFIX_REF",
    "COT_BUGFIX_REF_UIACTIONS",
    "COT_UIACTIONS_SETWIDTH",
    "COT_REFRESHSTATS_NEW",
    "JM_COT_VEHICLEMANAGER",
    "JM_COT_INVISIBILITY"
};
```

**CF** usa defines para habilitar/desabilitar subsistemas:

```cpp
defines[] =
{
    "CF_MODULE_CONFIG",
    "CF_EXPRESSION",
    "CF_GHOSTICONS",
    "CF_MODSTORAGE",
    "CF_SURFACES",
    "CF_MODULES"
};
```

---

## CfgVehicles: Definicoes de Itens e Entidades

`CfgVehicles` e a classe de config principal para definir itens, construcoes, veiculos e outras entidades no jogo. Apesar do nome "vehicles", ela cobre TODOS os tipos de entidade.

### Definicao Basica de Item

```cpp
class CfgVehicles
{
    class ItemBase;                          // Declaracao antecipada da classe pai
    class MyMod_CustomItem : ItemBase        // Herdar da base vanilla
    {
        scope = 2;                           // 0=oculto, 1=apenas editor, 2=publico
        displayName = "Custom Item";
        descriptionShort = "A custom item.";
        model = "MyMod/Data/Models/item.p3d";
        weight = 500;                        // Gramas
        itemSize[] = { 2, 3 };               // Slots de inventario (largura, altura)
        rotationFlags = 17;                   // Rotacao permitida no inventario
        inventorySlot[] = {};                 // Em quais slots de acessorio ele encaixa
    };
};
```

### Valores de scope

| Valor | Significado | Uso |
|-------|-------------|-----|
| `0` | Oculto | Classes base, pais abstratos -- nunca spawnavel |
| `1` | Apenas editor | Visivel no Editor do DayZ mas nao no gameplay normal |
| `2` | Publico | Totalmente spawnavel, aparece em ferramentas de admin e spawners |

### Definicao de Construcao/Estrutura

```cpp
class CfgVehicles
{
    class HouseNoDestruct;
    class MyMod_Bunker : HouseNoDestruct
    {
        scope = 2;
        displayName = "Military Bunker";
        model = "MyMod/Data/Models/bunker.p3d";
    };
};
```

### Definicao de Veiculo (Simplificada)

```cpp
class CfgVehicles
{
    class CarScript;
    class MyMod_Truck : CarScript
    {
        scope = 2;
        displayName = "Custom Truck";
        model = "MyMod/Data/Models/truck.p3d";

        class Cargo
        {
            itemsCargoSize[] = { 10, 50 };   // Dimensoes do cargo
        };
    };
};
```

### Exemplo de Entidade do DabsFramework

```cpp
class CfgVehicles
{
    class HouseNoDestruct;
    class NetworkLightBase : HouseNoDestruct
    {
        scope = 1;
    };
    class NetworkPointLight : NetworkLightBase
    {
        scope = 1;
    };
    class NetworkSpotLight : NetworkLightBase
    {
        scope = 1;
    };
};
```

---

## CfgSoundSets e CfgSoundShaders

Audio customizado requer duas classes de config trabalhando juntas: um SoundShader (a referencia ao arquivo de audio) e um SoundSet (a configuracao de reproducao).

### CfgSoundShaders

```cpp
class CfgSoundShaders
{
    class MyMod_Alert_SoundShader
    {
        samples[] = {{ "MyMod/Sounds/alert", 1 }};  // Caminho para arquivo .ogg, probabilidade
        volume = 0.8;                                 // Volume base (0.0 a 1.0)
        range = 50;                                   // Alcance audivel em metros (apenas 3D)
        limitation = 0;                               // 0 = sem limite de reproduções simultaneas
    };
};
```

O array `samples` usa chaves duplas. Cada entrada e `{ "caminho_sem_extensao", probabilidade }`. Se voce listar multiplas amostras, o motor escolhe aleatoriamente baseado nos pesos de probabilidade.

### CfgSoundSets

```cpp
class CfgSoundSets
{
    class MyMod_Alert_SoundSet
    {
        soundShaders[] = { "MyMod_Alert_SoundShader" };
        volumeFactor = 1.0;                           // Multiplicador no volume do shader
        frequencyFactor = 1.0;                        // Multiplicador de pitch
        spatial = 1;                                  // 0 = 2D (sons de UI), 1 = 3D (mundo)
    };
};
```

### Tocando Sons em Script

```c
// Som de UI 2D (spatial = 0)
SEffectManager.PlaySound("MyMod_Alert_SoundSet", vector.Zero);

// Som de mundo 3D (spatial = 1)
SEffectManager.PlaySound("MyMod_Alert_SoundSet", GetPosition());
```

### Exemplo Real: Bip de Radio do MyMissions Mod

```cpp
class CfgSoundShaders
{
    class MyBeep_SoundShader
    {
        samples[] = {{ "MyMissions\Sounds\bip", 1 }};
        volume = 0.6;
        range = 5;
        limitation = 0;
    };
};

class CfgSoundSets
{
    class MyBeep_SoundSet
    {
        soundShaders[] = { "MyBeep_SoundShader" };
        volumeFactor = 1.0;
        frequencyFactor = 1.0;
        spatial = 0;      // 2D -- toca como som de UI
    };
};
```

---

## CfgAddons: Declaracoes de Preload

`CfgAddons` e um bloco opcional que da dicas ao motor sobre precarregamento de assets:

```cpp
class CfgAddons
{
    class PreloadAddons
    {
        class MyMod
        {
            list[] = {};       // Lista de nomes de addons para precarregar (geralmente vazia)
        };
    };
};
```

Na pratica, a maioria dos mods declara isso com um `list[]` vazio. Isso garante que o motor reconheca o mod durante a fase de preload. Alguns mods pulam isso inteiramente sem problemas.

---

## Exemplos Reais de Mods Profissionais

### MyFramework (Apenas Script, Framework)

```cpp
class CfgPatches
{
    class MyCore_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Scripts" };
    };
};

class CfgMods
{
    class MyMod
    {
        name = "MyFramework";
        dir = "MyFramework";
        author = "MyMod Team";
        overview = "MyFramework - Central Admin Panel and Shared Library";
        inputs = "MyFramework/Scripts/Inputs.xml";
        creditsJson = "MyFramework/Scripts/Credits.json";
        type = "mod";
        defines[] = { "MYMOD_CORE" };
        dependencies[] = { "Core", "Game", "World", "Mission" };

        class defs
        {
            class imageSets
            {
                files[] =
                {
                    "MyFramework/GUI/imagesets/prefabs.imageset",
                    "MyFramework/GUI/imagesets/CUI.imageset",
                    "MyFramework/GUI/icons/thin.imageset",
                    "MyFramework/GUI/icons/light.imageset",
                    "MyFramework/GUI/icons/regular.imageset",
                    "MyFramework/GUI/icons/solid.imageset",
                    "MyFramework/GUI/icons/brands.imageset"
                };
            };
            class widgetStyles
            {
                files[] =
                {
                    "MyFramework/GUI/looknfeel/prefabs.styles"
                };
            };
            class engineScriptModule
            {
                files[] = { "MyFramework/Scripts/1_Core" };
            };
            class gameScriptModule
            {
                files[] = { "MyFramework/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                files[] = { "MyFramework/Scripts/4_World" };
            };
            class missionScriptModule
            {
                files[] = { "MyFramework/Scripts/5_Mission" };
            };
        };
    };
};
```

### COT (Depende de CF, Usa Pasta Common)

```cpp
class CfgPatches
{
    class JM_COT_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "JM_CF_Scripts", "JM_COT_GUI", "DZ_Data" };
    };
};

class CfgMods
{
    class JM_CommunityOnlineTools
    {
        dir = "JM";
        name = "Community Online Tools";
        credits = "Jacob_Mango, DannyDog, Arkensor";
        creditsJson = "JM/COT/Scripts/Data/Credits.json";
        author = "Jacob_Mango";
        versionPath = "JM/COT/Scripts/Data/Version.hpp";
        inputs = "JM/COT/Scripts/Data/Inputs.xml";
        type = "mod";
        defines[] = { "JM_COT", "JM_COT_VEHICLEMANAGER", "JM_COT_INVISIBILITY" };
        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class engineScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",     // Codigo compartilhado
                    "JM/COT/Scripts/1_Core"
                };
            };
            class gameScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",
                    "JM/COT/Scripts/3_Game"
                };
            };
            class worldScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",
                    "JM/COT/Scripts/4_World"
                };
            };
            class missionScriptModule
            {
                value = "";
                files[] =
                {
                    "JM/COT/Scripts/Common",
                    "JM/COT/Scripts/5_Mission"
                };
            };
        };
    };
};
```

### MyMissions Mod Server (Mod Apenas de Servidor)

```cpp
class CfgPatches
{
    class SDZS_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = { "DZ_Scripts", "MyScripts", "MyCore_Scripts" };
    };
};

class CfgMods
{
    class MyMissionsServer
    {
        name = "MyMissions Mod Server";
        dir = "MyMissions_Server";
        author = "MyMod";
        type = "servermod";              // <-- Mod apenas de servidor
        defines[] = { "MYMOD_MISSIONS" };
        dependencies[] = { "Core", "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                files[] = { "MyMissions_Server/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                files[] = { "MyMissions_Server/Scripts/4_World" };
            };
            class missionScriptModule
            {
                files[] = { "MyMissions_Server/Scripts/5_Mission" };
            };
        };
    };
};
```

### DabsFramework (Usa gameLibScriptModule + CfgVehicles)

```cpp
class CfgPatches
{
    class DF_Scripts
    {
        requiredAddons[] = { "DZ_Scripts", "DF_GUI" };
    };
};

class CfgMods
{
    class DabsFramework
    {
        name = "Dabs Framework";
        dir = "DabsFramework";
        credits = "InclementDab";
        author = "InclementDab";
        creditsJson = "DabsFramework/Scripts/Credits.json";
        versionPath = "DabsFramework/Scripts/Version.hpp";
        type = "mod";
        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class imageSets
            {
                files[] =
                {
                    "DabsFramework/gui/imagesets/prefabs.imageset",
                    "DabsFramework/gui/icons/brands.imageset",
                    "DabsFramework/gui/icons/light.imageset",
                    "DabsFramework/gui/icons/regular.imageset",
                    "DabsFramework/gui/icons/solid.imageset",
                    "DabsFramework/gui/icons/thin.imageset"
                };
            };
            class widgetStyles
            {
                files[] =
                {
                    "DabsFramework/gui/looknfeel/prefabs.styles"
                };
            };
            class engineScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/1_core" };
            };
            class gameLibScriptModule      // Raro: Dabs usa a camada 2
            {
                value = "";
                files[] = { "DabsFramework/scripts/2_GameLib" };
            };
            class gameScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "DabsFramework/scripts/5_Mission" };
            };
        };
    };
};

class CfgVehicles
{
    class HouseNoDestruct;
    class NetworkLightBase : HouseNoDestruct
    {
        scope = 1;
    };
    class NetworkPointLight : NetworkLightBase
    {
        scope = 1;
    };
    class NetworkSpotLight : NetworkLightBase
    {
        scope = 1;
    };
};
```

---

## Erros Comuns

### 1. requiredAddons Errado -- Mod Carrega Antes de Sua Dependencia

```cpp
// ERRADO: Dependencia do CF faltando, entao seu mod pode carregar antes do CF
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = { "DZ_Data" };  // CF nao listado!
    };
};

// CERTO: Declare TODAS as dependencias
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = { "DZ_Data", "JM_CF_Scripts" };
    };
};
```

**Sintoma:** Erros de tipo indefinido para classes da dependencia. O mod carregou antes da dependencia ser compilada.

### 2. Caminhos de Script Module Faltando

```cpp
// ERRADO: Voce tem uma pasta Scripts/4_World/ mas esqueceu de declara-la
class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    // 4_World esta faltando! Todos os arquivos .c em 4_World/ sao ignorados.
};

// CERTO: Declare cada camada que voce usa
class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    class worldScriptModule
    {
        files[] = { "MyMod/Scripts/4_World" };
    };
};
```

**Sintoma:** Classes que voce definiu simplesmente nao existem. Sem erro -- elas silenciosamente nao sao compiladas.

### 3. Caminhos de Arquivo Errados (Sensibilidade a Maiusculas)

Embora o Windows nao diferencie maiusculas de minusculas, caminhos do DayZ podem ser sensiveis a maiusculas em certos contextos (servidores Linux, empacotamento PBO):

```cpp
// ARRISCADO: Maiusculas misturadas que podem falhar no Linux
files[] = { "mymod/scripts/3_game" };   // Pasta e na verdade "MyMod/Scripts/3_Game"

// SEGURO: Corresponda exatamente ao caso real do diretorio
files[] = { "MyMod/Scripts/3_Game" };
```

### 4. Colisao de Nome de Classe CfgPatches

```cpp
// ERRADO: Usando um nome comum que pode colidir com outro mod
class CfgPatches
{
    class Scripts              // Generico demais! Vai colidir.
    {
        // ...
    };
};

// CERTO: Use um prefixo unico
class CfgPatches
{
    class MyMod_Scripts        // Unico para o seu mod
    {
        // ...
    };
};
```

### 5. requiredAddons Circulares

```cpp
// config.cpp do ModA
requiredAddons[] = { "ModB_Scripts" };

// config.cpp do ModB
requiredAddons[] = { "ModA_Scripts" };  // CIRCULAR! O motor falha ao resolver.
```

### 6. Declarar dependencies[] Sem Script Modules Correspondentes

```cpp
// ERRADO: Listou "World" como dependencia mas nao tem worldScriptModule
dependencies[] = { "Game", "World", "Mission" };

class defs
{
    class gameScriptModule
    {
        files[] = { "MyMod/Scripts/3_Game" };
    };
    // Nenhum worldScriptModule declarado -- dependencia "World" e enganosa
    class missionScriptModule
    {
        files[] = { "MyMod/Scripts/5_Mission" };
    };
};
```

Isso nao causa um erro, mas e enganoso. Liste apenas dependencias que voce realmente usa.

### 7. Colocar CfgVehicles no config.cpp de Scripts

Funciona, mas e ma pratica. Mantenha definicoes de itens/entidades em um PBO separado (`Data/config.cpp`) e definicoes de script em `Scripts/config.cpp`.

---

## Template Completo

Aqui esta um template de `Scripts/config.cpp` pronto para producao que voce pode copiar e modificar:

```cpp
// ============================================================================
// Scripts/config.cpp -- MyMod Script Module Definitions
// ============================================================================

class CfgPatches
{
    class MyMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Scripts"
            // Adicione dependencias de framework aqui:
            // "JM_CF_Scripts",         // Community Framework
            // "MyCore_Scripts",      // MyFramework
        };
    };
};

class CfgMods
{
    class MyMod
    {
        dir = "MyMod";
        name = "My Mod";
        author = "YourName";
        credits = "YourName";
        creditsJson = "MyMod/Scripts/Data/Credits.json";
        overview = "A brief description of what this mod does.";
        type = "mod";

        defines[] =
        {
            "MYMOD_LOADED"
            // "MYMOD_DEBUG"      // Descomente para builds de debug
        };

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class imageSets
            {
                files[] = {};     // Adicione caminhos de .imageset aqui
            };

            class widgetStyles
            {
                files[] = {};     // Adicione caminhos de .styles aqui
            };

            class gameScriptModule
            {
                value = "";
                files[] = { "MyMod/Scripts/3_Game" };
            };

            class worldScriptModule
            {
                value = "";
                files[] = { "MyMod/Scripts/4_World" };
            };

            class missionScriptModule
            {
                value = "";
                files[] = { "MyMod/Scripts/5_Mission" };
            };
        };
    };
};
```

---

**Anterior:** [Capitulo 2.1: A Hierarquia de 5 Camadas de Script](01-five-layers.md)
**Proximo:** [Capitulo 2.3: mod.cpp e Workshop](03-mod-cpp.md)
