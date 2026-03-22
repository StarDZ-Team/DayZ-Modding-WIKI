# Chapter 2.3: mod.cpp & Workshop

[Home](../README.md) | [<< Previous: config.cpp Deep Dive](02-config-cpp.md) | **mod.cpp & Workshop** | [Next: Minimum Viable Mod >>](04-minimum-viable-mod.md)

---

## Indice

- [Visao Geral](#visao-geral)
- [Onde o mod.cpp Fica](#onde-o-modcpp-fica)
- [Referencia de Todos os Campos](#referencia-de-todos-os-campos)
- [Detalhes dos Campos](#detalhes-dos-campos)
- [Mod de Cliente vs Mod de Servidor](#mod-de-cliente-vs-mod-de-servidor)
- [Metadados do Workshop](#metadados-do-workshop)
- [Campos Obrigatorios vs Opcionais](#campos-obrigatorios-vs-opcionais)
- [Exemplos Reais](#exemplos-reais)
- [Dicas e Boas Praticas](#dicas-e-boas-praticas)

---

## Visao Geral

`mod.cpp` fica na raiz da pasta do seu mod (ao lado do diretorio `Addons/`). O launcher do DayZ o le para exibir o nome, logo, descricao e autor do seu mod na tela de selecao de mods.

**Ponto chave:** `mod.cpp` NAO e compilado. Nao e Enforce Script. E um simples arquivo chave-valor lido pelo launcher. Nao ha classes, sem ponto-e-virgula apos chaves de fechamento, sem arrays com sintaxe `[]` (com uma excecao para script modules do Workshop -- veja abaixo).

---

## Onde o mod.cpp Fica

```
@MyMod/                       <-- Pasta do Workshop/launch (prefixada com @)
  mod.cpp                     <-- Este arquivo
  Addons/
    MyMod_Scripts.pbo
    MyMod_Data.pbo
  Keys/
    MyMod.bikey
  meta.cpp                    <-- Gerado automaticamente pelo publicador do Workshop
```

O prefixo `@` no nome da pasta e convencao para mods do Steam Workshop, mas nao e estritamente obrigatorio.

---

## Referencia de Todos os Campos

| Campo | Tipo | Proposito | Obrigatorio |
|-------|------|-----------|-------------|
| `name` | string | Nome de exibicao do mod | Sim |
| `picture` | string | Imagem grande na descricao expandida | Nao |
| `logo` | string | Logo abaixo do menu do jogo | Nao |
| `logoSmall` | string | Icone pequeno ao lado do nome do mod (recolhido) | Nao |
| `logoOver` | string | Logo ao passar o mouse | Nao |
| `tooltip` | string | Tooltip ao passar o mouse | Nao |
| `tooltipOwned` | string | Tooltip quando o mod esta instalado | Nao |
| `overview` | string | Descricao mais longa nos detalhes do mod | Nao |
| `action` | string | Link de URL (website, Discord, GitHub) | Nao |
| `actionURL` | string | Alternativa ao `action` (mesmo proposito) | Nao |
| `author` | string | Nome do autor | Nao |
| `authorID` | string | Steam64 ID do autor | Nao |
| `version` | string | String de versao | Nao |
| `type` | string | `"mod"` ou `"servermod"` | Nao |
| `extra` | int | Campo reservado (sempre 0) | Nao |

---

## Detalhes dos Campos

### name

O nome de exibicao mostrado na lista de mods do launcher do DayZ e na tela de mods dentro do jogo.

```cpp
name = "MyFramework";
```

Voce pode usar referencias de string table para localizacao:

```cpp
name = "$STR_DF_NAME";    // Resolve via stringtable.csv
```

### picture

Caminho para uma imagem maior exibida quando a descricao do mod e expandida. Suporta formatos `.paa`, `.edds` e `.tga`.

```cpp
picture = "MyMod/GUI/images/logo_large.edds";
```

O caminho e relativo a raiz do mod. Se vazio ou omitido, nenhuma imagem e mostrada.

### logo

O logo principal exibido abaixo do menu do jogo quando o mod esta carregado.

```cpp
logo = "MyMod/GUI/images/logo.edds";
```

### logoSmall

Icone pequeno mostrado ao lado do nome do mod quando a descricao esta recolhida (nao expandida).

```cpp
logoSmall = "MyMod/GUI/images/logo_small.edds";
```

### logoOver

O logo que aparece quando o usuario passa o mouse sobre o logo do mod. Frequentemente o mesmo que `logo`, mas pode ser uma variante destacada/brilhante.

```cpp
logoOver = "MyMod/GUI/images/logo_hover.edds";
```

### tooltip / tooltipOwned

Texto curto mostrado ao passar o mouse sobre o mod no launcher. `tooltipOwned` e mostrado quando o mod esta instalado (baixado do Workshop).

```cpp
tooltip = "MyFramework - Admin Panel & Framework";
tooltipOwned = "MyFramework - Central Admin Panel & Shared Library";
```

### overview

Uma descricao mais longa exibida no painel de detalhes do mod. Este e o seu texto "sobre".

```cpp
overview = "MyFramework provides a centralized admin panel and shared library for all MyMod mods. Manage configurations, permissions, and mod integration from a single in-game interface.";
```

### action / actionURL

Uma URL clicavel associada ao mod (tipicamente um website, convite de Discord ou repositorio GitHub). Ambos os campos servem o mesmo proposito -- use o que preferir.

```cpp
action = "https://github.com/mymod/repo";
// OU
actionURL = "https://discord.gg/mymod";
```

### author / authorID

O nome do autor e seu Steam64 ID.

```cpp
author = "MyMod Team";
authorID = "76561198000000000";
```

`authorID` e usado pelo Workshop para vincular ao perfil Steam do autor.

### version

Uma string de versao. Pode ser qualquer formato -- o motor nao analisa ou valida.

```cpp
version = "1.0.0";
```

Alguns mods apontam para um arquivo de versao no config.cpp:

```cpp
versionPath = "MyMod/Scripts/Data/Version.hpp";   // Isso vai no config.cpp, NAO no mod.cpp
```

### type

Declara se este e um mod regular ou apenas de servidor. Quando omitido, o padrao e `"mod"`.

```cpp
type = "mod";           // Carregado via -mod= (cliente + servidor)
type = "servermod";     // Carregado via -servermod= (apenas servidor, nao enviado aos clientes)
```

### extra

Campo reservado. Sempre defina como `0` ou omita inteiramente.

```cpp
extra = 0;
```

---

## Mod de Cliente vs Mod de Servidor

O DayZ suporta dois mecanismos de carregamento de mods:

### Mod de Cliente (`-mod=`)

- Baixado pelos clientes do Steam Workshop
- Scripts rodam em AMBOS cliente e servidor
- Pode incluir UI, HUD, modelos, texturas, sons
- Requer assinatura de chave (`.bikey`) para entrar no servidor

```
// Parametro de lancamento:
-mod=@MyMod

// mod.cpp:
type = "mod";
```

### Mod de Servidor (`-servermod=`)

- Roda APENAS no servidor dedicado
- Clientes nunca o baixam
- Nao pode incluir UI do lado do cliente ou codigo de `5_Mission` do cliente
- Nao requer assinatura de chave

```
// Parametro de lancamento:
-servermod=@MyModServer

// mod.cpp:
type = "servermod";
```

### Padrao de Mod Dividido

Muitos mods sao distribuidos como DOIS pacotes -- um mod de cliente e um mod de servidor:

```
@MyMissions/           <-- Mod de cliente (-mod=)
  mod.cpp                   type = "mod"
  Addons/
    MyMissions.pbo     Scripts: UI, renderizacao de entidades, recebimento de RPC

@MyMissionsServer/     <-- Mod de servidor (-servermod=)
  mod.cpp                   type = "servermod"
  Addons/
    MyMissionsServer.pbo   Scripts: spawning, logica, gerenciamento de estado
```

Isso mantem a logica do lado do servidor privada (nunca enviada aos clientes) e reduz o tamanho do download do cliente.

---

## Metadados do Workshop

### meta.cpp (Gerado Automaticamente)

Quando voce publica no Steam Workshop, as ferramentas do DayZ geram automaticamente um arquivo `meta.cpp`:

```cpp
protocol = 2;
publishedid = 2900000000;    // ID do item do Steam Workshop
timestamp = 1711000000;       // Timestamp Unix da ultima atualizacao
```

Nao edite `meta.cpp` manualmente. Ele e gerenciado pelas ferramentas de publicacao.

### Interacao com o Workshop

O launcher do DayZ le tanto `mod.cpp` quanto `meta.cpp`:

- `mod.cpp` fornece os metadados visuais (nome, logo, descricao)
- `meta.cpp` vincula os arquivos locais ao item do Steam Workshop
- A pagina do Steam Workshop tem seu proprio titulo, descricao e imagens (gerenciado pela interface web do Steam)

Os campos do `mod.cpp` sao o que os jogadores veem na lista de mods **dentro do jogo**. A pagina do Workshop e o que eles veem no **Steam**. Mantenha-os consistentes.

### Recomendacoes de Imagem para o Workshop

| Imagem | Proposito | Tamanho Recomendado |
|--------|-----------|---------------------|
| `picture` | Descricao expandida do mod | 512x512 ou similar |
| `logo` | Logo no menu | 128x128 a 256x256 |
| `logoSmall` | Icone na lista recolhida | 64x64 a 128x128 |

Use formato `.edds` para melhor compatibilidade. `.paa` e `.tga` tambem funcionam. PNG e JPG NAO funcionam nos campos de imagem do mod.cpp.

---

## Campos Obrigatorios vs Opcionais

### Minimo Absoluto

Um `mod.cpp` funcional precisa apenas de:

```cpp
name = "My Mod";
```

So isso. Uma linha. O mod vai carregar e funcionar. Todo o resto e cosmetico.

### Minimo Recomendado

Para um mod publicado no Workshop, inclua pelo menos:

```cpp
name = "My Mod Name";
author = "YourName";
version = "1.0";
overview = "What this mod does in one sentence.";
```

### Setup Profissional Completo

```cpp
name = "My Mod Name";
picture = "MyMod/GUI/images/logo_large.edds";
logo = "MyMod/GUI/images/logo.edds";
logoSmall = "MyMod/GUI/images/logo_small.edds";
logoOver = "MyMod/GUI/images/logo_hover.edds";
tooltip = "Short description";
overview = "Full description of your mod's features.";
action = "https://discord.gg/mymod";
author = "YourName";
authorID = "76561198000000000";
version = "1.2.3";
type = "mod";
```

---

## Exemplos Reais

### MyFramework (Mod de Cliente)

```cpp
name = "MyFramework";
picture = "";
actionURL = "";
tooltipOwned = "MyFramework - Central Admin Panel & Shared Library";
overview = "MyFramework provides a centralized admin panel and shared library for all MyMod mods. Manage configurations, permissions, and mod integration from a single in-game interface.";
author = "MyMod Team";
version = "1.0.0";
```

### MyFramework Server (Mod de Servidor -- Minimo)

```cpp
name = "MyFramework Server";
author = "MyMod Team";
version = "1.0.0";
extra = 0;
type = "mod";
```

### Community Framework

```cpp
name = "Community Framework";
picture = "JM/CF/GUI/textures/cf_icon.edds";
logo = "JM/CF/GUI/textures/cf_icon.edds";
logoSmall = "JM/CF/GUI/textures/cf_icon.edds";
logoOver = "JM/CF/GUI/textures/cf_icon.edds";
tooltip = "Community Framework";
overview = "This is a Community Framework for DayZ SA. One notable feature is it aims to resolve the issue of conflicting RPC type ID's and mods.";
action = "https://github.com/Arkensor/DayZ-CommunityFramework";
author = "CF Mod Team";
authorID = "76561198103677868";
version = "1.5.8";
```

### VPP Admin Tools

```cpp
picture = "VPPAdminTools/data/vpp_logo_m.paa";
logoSmall = "VPPAdminTools/data/vpp_logo_ss.paa";
logo = "VPPAdminTools/data/vpp_logo_s.paa";
logoOver = "VPPAdminTools/data/vpp_logo_s.paa";
tooltip = "Tools helping in administrative DayZ server tasks";
overview = "V++ Admin Tools built for the DayZ community servers!";
action = "https://discord.dayzvpp.com";
```

Nota: VPP omite `name` e `author` -- ainda funciona, mas o nome do mod aparece como o nome da pasta no launcher.

### DabsFramework (Com Localizacao)

```cpp
name = "$STR_DF_NAME";
picture = "DabsFramework/gui/images/dabs_framework_logo.paa";
logo = "DabsFramework/gui/images/dabs_framework_logo.paa";
logoSmall = "DabsFramework/gui/images/dabs_framework_logo.paa";
logoOver = "DabsFramework/gui/images/dabs_framework_logo.paa";
tooltip = "$STR_DF_TOOLTIP";
overview = "$STR_DF_DESCRIPTION";
action = "https://dab.dev";
author = "$STR_DF_AUTHOR";
authorID = "76561198247958888";
version = "1.0";
```

DabsFramework usa referencias `$STR_` de string table para todos os campos de texto, permitindo suporte multi-idioma para a propria listagem do mod.

### MyAI Mod (Mod de Cliente com Script Modules no mod.cpp)

```cpp
name = "MyAI Mod";
picture = "";
actionURL = "";
tooltipOwned = "MyAI Mod - Intelligent Bot Framework for DayZ";
overview = "Advanced AI bot framework with human-like perception, combat tactics, and developer API";
author = "MyMod";
version = "1.0.0";
type = "mod";
dependencies[] = {"Game", "World", "Mission"};
class Defs
{
    class gameScriptModule
    {
        value = "";
        files[] = {"MyAI/Scripts/3_Game"};
    };
    class worldScriptModule
    {
        value = "";
        files[] = {"MyAI/Scripts/4_World"};
    };
    class missionScriptModule
    {
        value = "";
        files[] = {"MyAI/Scripts/5_Mission"};
    };
};
```

Nota: Este mod coloca definicoes de script modules no `mod.cpp` em vez do `config.cpp`. Ambas as localizacoes funcionam -- o motor le ambos os arquivos. No entanto, a convencao padrao e colocar `CfgMods` e definicoes de script modules no `config.cpp`. Coloca-los no `mod.cpp` e uma abordagem alternativa usada por alguns mods.

---

## Dicas e Boas Praticas

### 1. Mantenha o mod.cpp Simples

`mod.cpp` e apenas metadados. Nao tente colocar logica de jogo, definicoes de classe ou qualquer coisa complexa aqui. Se precisar de script modules, coloque-os no `config.cpp`.

### 2. Use .edds para Imagens

`.edds` e o formato de textura padrao do DayZ para elementos de UI. Use DayZ Tools (TexView2) para converter de PNG/TGA para .edds.

### 3. Combine com Sua Pagina do Workshop

Mantenha os campos `name`, `overview` e `author` consistentes com sua pagina do Steam Workshop. Os jogadores veem ambos.

### 4. Versione Consistentemente

Escolha um esquema de versionamento (ex: `1.0.0` versionamento semantico) e atualize-o a cada release. Alguns mods usam um arquivo `Version.hpp` referenciado no `config.cpp` para gerenciamento centralizado de versao.

### 5. Teste Sem Imagens Primeiro

Durante o desenvolvimento, deixe os caminhos de imagem vazios. Adicione logos por ultimo, apos tudo funcionar. Imagens faltando nao impedem o mod de carregar.

### 6. Mods de Servidor Precisam de Menos

Mods apenas de servidor precisam de um mod.cpp minimo ja que jogadores nunca os veem no launcher:

```cpp
name = "My Server Mod";
author = "YourName";
version = "1.0.0";
type = "servermod";
```

---

**Anterior:** [Capitulo 2.2: config.cpp em Profundidade](02-config-cpp.md)
**Proximo:** [Capitulo 2.4: Seu Primeiro Mod -- Minimo Viavel](04-minimum-viable-mod.md)
