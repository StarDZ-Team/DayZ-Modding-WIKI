# Chapter 8.7: Publicando na Steam Workshop

[Inicio](../README.md) | [<< Anterior: Depuração & Testes](06-debugging-testing.md) | **Publicando na Steam Workshop** | [Próximo: Construindo um HUD Overlay >>](08-hud-overlay.md)

---

> **Resumo:** Seu mod está construído, testado e pronto para o mundo. Este tutorial guia você pelo processo completo de publicação do início ao fim: preparando sua pasta de mod, assinando PBOs para compatibilidade multiplayer, criando um item na Steam Workshop, fazendo upload via DayZ Tools ou linha de comando, e mantendo atualizações ao longo do tempo. Ao final, seu mod estará no ar na Workshop e jogável por qualquer pessoa.

---

## Sumário

- [Introdução](#introdução)
- [Checklist Pré-Publicação](#checklist-pré-publicação)
- [Passo 1: Preparar a Pasta do Mod](#passo-1-preparar-a-pasta-do-mod)
- [Passo 2: Escrever um mod.cpp Completo](#passo-2-escrever-um-modcpp-completo)
- [Passo 3: Preparar Imagens de Logo e Preview](#passo-3-preparar-imagens-de-logo-e-preview)
- [Passo 4: Gerar um Par de Chaves](#passo-4-gerar-um-par-de-chaves)
- [Passo 5: Assinar Seus PBOs](#passo-5-assinar-seus-pbos)
- [Passo 6: Publicar via DayZ Tools Publisher](#passo-6-publicar-via-dayz-tools-publisher)
- [Publicando via Linha de Comando (Alternativa)](#publicando-via-linha-de-comando-alternativa)
- [Atualizando Seu Mod](#atualizando-seu-mod)
- [Boas Práticas de Gerenciamento de Versão](#boas-práticas-de-gerenciamento-de-versão)
- [Boas Práticas para a Página da Workshop](#boas-práticas-para-a-página-da-workshop)
- [Guia para Operadores de Servidor](#guia-para-operadores-de-servidor)
- [Distribuição Sem a Workshop](#distribuição-sem-a-workshop)
- [Problemas Comuns e Soluções](#problemas-comuns-e-soluções)
- [O Ciclo de Vida Completo do Mod](#o-ciclo-de-vida-completo-do-mod)
- [Próximos Passos](#próximos-passos)

---

## Introdução

Publicar na Steam Workshop é o passo final na jornada de modding do DayZ. Tudo que você aprendeu nos capítulos anteriores culmina aqui. Uma vez que seu mod esteja na Workshop, qualquer jogador de DayZ pode se inscrever, baixar e jogar com ele. Este capítulo cobre o processo completo: preparando seu mod, assinando PBOs, fazendo upload e mantendo atualizações.

---

## Checklist Pré-Publicação

Antes de fazer upload de qualquer coisa, passe por esta lista. Pular itens aqui causa as dores de cabeça mais comuns pós-publicação.

- [ ] Todas as features testadas em um **servidor dedicado** (não apenas single-player)
- [ ] Multiplayer testado: outro cliente pode entrar e usar as features do mod
- [ ] Sem erros que quebram o jogo nos logs de script (`DayZDiag_x64.RPT` ou `script_*.log`)
- [ ] Todas as instruções `Print()` de debug removidas ou encapsuladas em `#ifdef DEVELOPER`
- [ ] Sem valores de teste hardcoded ou código experimental restante
- [ ] `stringtable.csv` contém todas as strings voltadas ao usuário com traduções
- [ ] `credits.json` preenchido com informações de autor e colaboradores
- [ ] Imagem de logo preparada (veja [Passo 3](#passo-3-preparar-imagens-de-logo-e-preview) para tamanhos)
- [ ] Todas as texturas convertidas para formato `.paa` (não `.png`/`.tga` crus nos PBOs)
- [ ] Descrição da Workshop e instruções de instalação escritas
- [ ] Changelog iniciado (mesmo que apenas "1.0.0 - Lançamento inicial")

---

## Passo 1: Preparar a Pasta do Mod

Sua pasta final de mod deve seguir exatamente a estrutura esperada pelo DayZ.

### Estrutura Obrigatória

```
@MyMod/
├── addons/
│   ├── MyMod_Scripts.pbo
│   ├── MyMod_Scripts.pbo.MyMod.bisign
│   ├── MyMod_Data.pbo
│   └── MyMod_Data.pbo.MyMod.bisign
├── keys/
│   └── MyMod.bikey
├── mod.cpp
└── meta.cpp  (auto-gerado pelo DayZ Launcher no primeiro carregamento)
```

### Detalhamento das Pastas

| Pasta / Arquivo | Propósito |
|-----------------|-----------|
| `addons/` | Contém todos os arquivos `.pbo` (conteúdo empacotado do mod) e seus arquivos de assinatura `.bisign` |
| `keys/` | Contém a chave pública (`.bikey`) que servidores usam para verificar seus PBOs |
| `mod.cpp` | Metadados do mod: nome, autor, versão, descrição, caminhos de ícones |
| `meta.cpp` | Auto-gerado pelo DayZ Launcher; contém o ID da Workshop após publicação |

### Regras Importantes

- O nome da pasta **deve** começar com `@`. É assim que o DayZ identifica diretórios de mod.
- Todo `.pbo` em `addons/` deve ter um arquivo `.bisign` correspondente ao lado.
- O arquivo `.bikey` em `keys/` deve corresponder à chave privada usada para criar os arquivos `.bisign`.
- **Não** inclua arquivos fonte (scripts `.c`, texturas cruas, projetos do Workbench) na pasta de upload. Apenas PBOs empacotados devem estar aqui.

---

## Passo 2: Escrever um mod.cpp Completo

O arquivo `mod.cpp` diz ao DayZ e ao launcher tudo sobre seu mod. Um `mod.cpp` incompleto causa ícones ausentes, descrições em branco e problemas de exibição.

### Exemplo Completo de mod.cpp

```cpp
name         = "My Awesome Mod";
picture      = "MyMod/Data/Textures/logo_co.paa";
logo         = "MyMod/Data/Textures/logo_co.paa";
logoSmall    = "MyMod/Data/Textures/logo_small_co.paa";
logoOver     = "MyMod/Data/Textures/logo_co.paa";
tooltip      = "My Awesome Mod - Adds cool features to DayZ";
overview     = "A comprehensive mod that adds new items, mechanics, and UI elements to DayZ.";
author       = "YourName";
overviewPicture = "MyMod/Data/Textures/overview_co.paa";
action       = "https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_WORKSHOP_ID";
version      = "1.0.0";
versionPath  = "MyMod/Data/version.txt";
```

### Referência de Campos

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `name` | Sim | Nome de exibição mostrado na lista de mods do DayZ Launcher |
| `picture` | Sim | Caminho para a imagem principal do logo (exibida no launcher). Relativo ao drive P: ou raiz do mod |
| `logo` | Sim | Mesmo que picture na maioria dos casos; usado em alguns contextos de UI |
| `logoSmall` | Não | Versão menor do logo para views compactas |
| `logoOver` | Não | Estado hover do logo (geralmente o mesmo que `logo`) |
| `tooltip` | Sim | Descrição curta de uma linha mostrada ao passar o mouse no launcher |
| `overview` | Sim | Descrição mais longa mostrada no painel de detalhes do mod |
| `author` | Sim | Seu nome ou nome da equipe |
| `overviewPicture` | Não | Imagem grande mostrada no painel de visão geral do mod |
| `action` | Não | URL aberta quando o jogador clica "Website" (tipicamente sua página da Workshop ou GitHub) |
| `version` | Sim | String de versão atual (ex.: `"1.0.0"`) |
| `versionPath` | Não | Caminho para um arquivo texto contendo o número da versão (para builds automatizados) |

### Erros Comuns

- **Ponto e vírgula faltando** no final de cada linha. Toda linha deve terminar com `;`.
- **Caminhos de imagem errados.** Caminhos são relativos à raiz do drive P: ao construir. Após empacotar, o caminho deve refletir o prefixo do PBO. Teste carregando o mod localmente antes de fazer upload.
- **Esquecer de atualizar a versão** antes de re-uploar. Sempre incremente a string de versão.

---

## Passo 3: Preparar Imagens de Logo e Preview

### Requisitos de Imagem

| Imagem | Tamanho | Formato | Usado Para |
|--------|---------|---------|------------|
| Logo do mod (`picture` / `logo`) | 512 x 512 px | `.paa` (in-game) | Lista de mods do DayZ Launcher |
| Logo pequeno (`logoSmall`) | 128 x 128 px | `.paa` (in-game) | Views compactas do launcher |
| Preview da Steam Workshop | 512 x 512 px | `.png` ou `.jpg` | Thumbnail da página da Workshop |
| Imagem de visão geral | 1024 x 512 px | `.paa` (in-game) | Painel de detalhes do mod |

### Convertendo Imagens para PAA

DayZ usa texturas `.paa` internamente. Para converter imagens PNG/TGA:

1. Abra o **TexView2** (incluído com DayZ Tools)
2. File > Open sua imagem `.png` ou `.tga`
3. File > Save As > escolha o formato `.paa`
4. Salve no diretório `Data/Textures/` do seu mod

Addon Builder também pode auto-converter texturas ao empacotar PBOs se configurado para binarizar.

### Dicas

- Use um ícone claro e reconhecível que seja legível em tamanhos pequenos.
- Mantenha texto em logos no mínimo -- fica ilegível em 128x128.
- A imagem de preview da Steam Workshop (`.png`/`.jpg`) é separada do logo in-game (`.paa`). Você faz upload dela pelo Publisher.

---

## Passo 4: Gerar um Par de Chaves

Assinatura de chaves é **essencial** para multiplayer. Quase todos os servidores públicos habilitam verificação de assinatura, então sem assinaturas adequadas os jogadores serão kickados ao entrar com seu mod.

### Como a Assinatura de Chaves Funciona

- Você cria um **par de chaves**: um `.biprivatekey` (privado) e um `.bikey` (público)
- Você assina cada `.pbo` com a chave privada, produzindo um arquivo `.bisign`
- Você distribui o `.bikey` com seu mod; operadores de servidor colocam na pasta `keys/` deles
- Quando um jogador entra, o servidor verifica cada `.pbo` contra seu `.bisign` usando o `.bikey`

### Gerando Chaves com DayZ Tools

1. Abra **DayZ Tools** pelo Steam
2. Na janela principal, encontre e clique em **DS Create Key** (às vezes listado em Tools ou Utilities)
3. Insira um **nome de chave** -- use o nome do seu mod (ex.: `MyMod`)
4. Escolha onde salvar os arquivos
5. Dois arquivos são criados:
   - `MyMod.bikey` -- a **chave pública** (distribua esta)
   - `MyMod.biprivatekey` -- a **chave privada** (mantenha em segredo)

### Gerando Chaves via Linha de Comando

Você também pode usar a ferramenta `DSCreateKey` diretamente de um terminal:

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSCreateKey.exe" MyMod
```

Isso cria `MyMod.bikey` e `MyMod.biprivatekey` no diretório atual.

### Regra Crítica de Segurança

> **NUNCA compartilhe seu arquivo `.biprivatekey`.** Qualquer pessoa que tenha sua chave privada pode assinar PBOs modificados que servidores aceitarão como legítimos. Armazene-o com segurança e faça backup. Se você o perder, deve gerar um novo par de chaves, re-assinar tudo, e operadores de servidor devem atualizar suas chaves.

---

## Passo 5: Assinar Seus PBOs

Todo arquivo `.pbo` no seu mod deve ser assinado com sua chave privada. Isso produz arquivos `.bisign` que ficam ao lado dos PBOs.

### Assinando com DayZ Tools

1. Abra **DayZ Tools**
2. Encontre e clique em **DS Sign File** (em Tools ou Utilities)
3. Selecione seu arquivo `.biprivatekey`
4. Selecione o arquivo `.pbo` para assinar
5. Um arquivo `.bisign` é criado ao lado do PBO (ex.: `MyMod_Scripts.pbo.MyMod.bisign`)
6. Repita para todo `.pbo` na sua pasta `addons/`

### Assinando via Linha de Comando

Para automação ou múltiplos PBOs, use a linha de comando:

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe" MyMod.biprivatekey MyMod_Scripts.pbo
```

Para assinar todos os PBOs em uma pasta com um script batch:

```batch
@echo off
set DSSIGN="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe"
set KEY="path\to\MyMod.biprivatekey"

for %%f in (addons\*.pbo) do (
    echo Signing %%f ...
    %DSSIGN% %KEY% "%%f"
)

echo All PBOs signed.
pause
```

### Após Assinar: Verifique Sua Pasta

Sua pasta `addons/` deve ficar assim:

```
addons/
├── MyMod_Scripts.pbo
├── MyMod_Scripts.pbo.MyMod.bisign
├── MyMod_Data.pbo
└── MyMod_Data.pbo.MyMod.bisign
```

Todo `.pbo` deve ter um `.bisign` correspondente. Se algum `.bisign` estiver faltando, jogadores serão kickados de servidores com verificação de assinatura.

### Coloque a Chave Pública

Copie `MyMod.bikey` para sua pasta `@MyMod/keys/`. Isto é o que operadores de servidor vão copiar para o diretório `keys/` do servidor deles para permitir seu mod.

---

## Passo 6: Publicar via DayZ Tools Publisher

DayZ Tools inclui um publisher integrado da Workshop -- a forma mais fácil de colocar seu mod no Steam.

### Abrir o Publisher

1. Abra **DayZ Tools** pelo Steam
2. Clique em **Publisher** na janela principal (pode também estar rotulado como "Workshop Tool")
3. A janela do Publisher abre com campos para os detalhes do seu mod

### Preencher os Detalhes

| Campo | O que Inserir |
|-------|---------------|
| **Title** | Nome de exibição do seu mod (ex.: "My Awesome Mod") |
| **Description** | Visão geral detalhada do que seu mod faz. Suporta formatação BB code do Steam (veja abaixo) |
| **Preview Image** | Navegue até sua imagem de preview 512 x 512 `.png` ou `.jpg` |
| **Mod Folder** | Navegue até sua pasta `@MyMod` completa |
| **Tags** | Selecione tags relevantes (ex.: Weapons, Vehicles, UI, Server, Gear, Maps) |
| **Visibility** | **Public** (qualquer um pode encontrar), **Friends Only**, ou **Unlisted** (apenas acessível via link direto) |

### Referência Rápida de BB Code do Steam

A descrição da Workshop suporta BB code:

```
[h1]Features[/h1]
[list]
[*] Feature one
[*] Feature two
[/list]

[b]Bold[/b]  [i]Italic[/i]  [code]Code[/code]
[url=https://example.com]Link text[/url]
[img]https://example.com/image.png[/img]
```

### Publicar

1. Revise todos os campos uma última vez
2. Clique em **Publish** (ou **Upload**)
3. Aguarde o upload completar. Mods grandes podem levar vários minutos dependendo da sua conexão.
4. Ao completar, você verá uma confirmação com seu **Workshop ID** (um ID numérico longo como `2345678901`)
5. **Salve este Workshop ID.** Você precisa dele para enviar atualizações depois.

### Após Publicar: Verifique

Não pule isso. Teste seu mod como um jogador regular faria:

1. Visite `https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_ID` e verifique título, descrição, imagem de preview
2. **Inscreva-se** no seu próprio mod na Workshop
3. Abra o DayZ, confirme que o mod aparece no launcher
4. Ative-o, inicie o jogo, entre em um servidor (ou rode seu próprio servidor de teste)
5. Confirme que todas as features funcionam
6. Atualize o campo `action` no `mod.cpp` para apontar para a URL da sua página na Workshop

Se algo estiver quebrado, atualize e re-uploade antes de anunciar publicamente.

---

## Publicando via Linha de Comando (Alternativa)

Para automação, CI/CD ou uploads em lote, SteamCMD fornece uma alternativa via linha de comando.

### Instalar SteamCMD

Baixe do [site de desenvolvedores da Valve](https://developer.valvesoftware.com/wiki/SteamCMD) e extraia para uma pasta como `C:\SteamCMD\`.

### Criar um Arquivo VDF

SteamCMD usa um arquivo `.vdf` para descrever o que uploar. Crie um arquivo chamado `workshop_publish.vdf`:

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "0"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "previewfile"    "C:\\Path\\To\\preview.png"
    "visibility"     "0"
    "title"          "My Awesome Mod"
    "description"    "A comprehensive mod for DayZ."
    "changenote"     "Initial release"
}
```

### Referência de Campos

| Campo | Valor |
|-------|-------|
| `appid` | Sempre `221100` para DayZ |
| `publishedfileid` | `0` para um item novo; use o Workshop ID para atualizações |
| `contentfolder` | Caminho absoluto para sua pasta `@MyMod` |
| `previewfile` | Caminho absoluto para sua imagem de preview |
| `visibility` | `0` = Público, `1` = Apenas Amigos, `2` = Não Listado, `3` = Privado |
| `title` | Nome do mod |
| `description` | Descrição do mod (texto puro) |
| `changenote` | Texto mostrado no histórico de mudanças na página da Workshop |

### Executar SteamCMD

```batch
C:\SteamCMD\steamcmd.exe +login YourSteamUsername +workshop_build_item "C:\Path\To\workshop_publish.vdf" +quit
```

SteamCMD vai solicitar sua senha e código Steam Guard no primeiro uso. Após autenticação, faz upload do mod e imprime o Workshop ID.

### Quando Usar Linha de Comando

- **Builds automatizados:** integrar em um script de build que empacota PBOs, assina e faz upload em um único passo
- **Operações em lote:** uploar múltiplos mods de uma vez
- **Servidores headless:** ambientes sem GUI
- **Pipelines CI/CD:** GitHub Actions ou similares podem chamar SteamCMD

---

## Atualizando Seu Mod

### Processo de Atualização Passo a Passo

1. **Faça suas mudanças de código** e teste completamente
2. **Incremente a versão** no `mod.cpp` (ex.: `"1.0.0"` vira `"1.0.1"`)
3. **Reconstrua todos os PBOs** usando Addon Builder ou seu script de build
4. **Re-assine todos os PBOs** com a **mesma chave privada** que usou originalmente
5. **Abra o DayZ Tools Publisher**
6. Insira seu **Workshop ID** existente (ou selecione o item existente)
7. Aponte para sua pasta `@MyMod` atualizada
8. Escreva uma **nota de mudança** descrevendo o que mudou
9. Clique em **Publish / Update**

### Usando SteamCMD para Atualizações

Atualize o arquivo VDF com seu Workshop ID e uma nova nota de mudança:

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "2345678901"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "changenote"     "v1.0.1 - Fixed item duplication bug, added French translation"
}
```

Depois execute SteamCMD como antes. O `publishedfileid` diz ao Steam para atualizar o item existente ao invés de criar um novo.

### Importante: Use a Mesma Chave

Sempre assine atualizações com a **mesma chave privada** que usou para o lançamento original. Se assinar com uma chave diferente, operadores de servidor devem substituir o `.bikey` antigo pelo novo -- o que significa downtime e confusão. Só gere um novo par de chaves se sua chave privada for comprometida.

---

## Boas Práticas de Gerenciamento de Versão

### Versionamento Semântico

Use o formato **MAJOR.MINOR.PATCH**:

| Componente | Quando Incrementar | Exemplo |
|------------|---------------------|---------|
| **MAJOR** | Mudanças que quebram: mudanças de formato de config, features removidas, reformulações de API | `1.0.0` para `2.0.0` |
| **MINOR** | Novas features retrocompatíveis | `1.0.0` para `1.1.0` |
| **PATCH** | Correções de bugs, pequenos ajustes, atualizações de tradução | `1.0.0` para `1.0.1` |

### Formato de Changelog

Mantenha um changelog na descrição da Workshop ou em um arquivo separado. Um formato limpo:

```
v1.2.0 (2025-06-15)
- Added: Night vision toggle keybind
- Added: German and Spanish translations
- Fixed: Inventory crash when dropping stacked items
- Changed: Reduced default spawn rate from 5 to 3

v1.1.0 (2025-05-01)
- Added: New crafting recipes for 4 items
- Fixed: Server crash on player disconnect during trade

v1.0.0 (2025-04-01)
- Initial release
```

### Compatibilidade Retroativa

Quando seu mod salva dados persistentes (configs JSON, arquivos de dados de jogador), pense cuidadosamente antes de mudar o formato:

- **Adicionar novos campos** é seguro. Use valores padrão para campos ausentes ao carregar arquivos antigos.
- **Renomear ou remover campos** é uma mudança que quebra. Incremente a versão MAJOR.
- **Considere um padrão de migração:** detecte o formato antigo, converta para o novo formato, salve.

Exemplo de verificação de migração em Enforce Script:

```csharp
// Na sua função de carregamento de config
if (config.configVersion < 2)
{
    // Migrar de v1 para v2: renomear "oldField" para "newField"
    config.newField = config.oldField;
    config.configVersion = 2;
    SaveConfig(config);
    SDZ_Log.Info("MyMod", "Config migrated from v1 to v2");
}
```

### Tags do Git

Se você usa Git para controle de versão (e deveria), marque cada release:

```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

Isso cria um ponto de referência permanente para que você sempre possa voltar ao código exato de qualquer versão publicada.

---

## Boas Práticas para a Página da Workshop

### Estrutura da Descrição

Organize sua descrição com estas seções:

1. **Visão Geral** -- o que o mod faz, em 2-3 frases
2. **Recursos** -- lista de itens com as features principais
3. **Requisitos** -- liste todos os mods de dependência com links da Workshop
4. **Instalação** -- passo a passo para jogadores (geralmente apenas "inscreva-se e ative")
5. **Configuração do Servidor** -- instruções para operadores de servidor (colocação de chaves, arquivos de config)
6. **FAQ** -- perguntas comuns respondidas preventivamente
7. **Problemas Conhecidos** -- seja honesto sobre limitações atuais
8. **Suporte** -- link para seu Discord, GitHub issues ou tópico no fórum
9. **Changelog** -- histórico de versões recentes
10. **Licença** -- como outros podem (ou não podem) usar seu trabalho

### Screenshots e Mídia

- Inclua **3-5 screenshots in-game** mostrando seu mod em ação
- Se seu mod adiciona UI, mostre os painéis de UI claramente
- Se seu mod adiciona itens, mostre-os in-game (não apenas no editor)
- Um vídeo curto de gameplay aumenta dramaticamente as inscrições

### Dependências

Se seu mod requer outros mods, liste-os claramente com links da Workshop. Use o recurso "Required Items" da Steam Workshop para que o launcher carregue dependências automaticamente.

### Cronograma de Atualizações

Defina expectativas. Se você atualiza semanalmente, diga isso. Se atualizações são ocasionais, diga "atualizações conforme necessário." Jogadores são mais compreensivos quando sabem o que esperar.

---

## Guia para Operadores de Servidor

Inclua estas informações na descrição da Workshop para admins de servidor.

### Instalando um Mod da Workshop em um Servidor Dedicado

1. **Baixe o mod** usando SteamCMD ou o cliente Steam:
   ```batch
   steamcmd +login anonymous +workshop_download_item 221100 WORKSHOP_ID +quit
   ```
2. **Copie** (ou crie symlink) a pasta `@ModName` para o diretório do DayZ Server
3. **Copie o arquivo `.bikey`** de `@ModName/keys/` para a pasta `keys/` do servidor
4. **Adicione o mod** ao parâmetro de lançamento `-mod=`

### Sintaxe do Parâmetro de Lançamento

Mods são carregados via o parâmetro `-mod=`, separados por ponto e vírgula:

```
-mod=@CF;@VPPAdminTools;@MyMod
```

Use o **caminho relativo completo** a partir da raiz do servidor. No Linux, caminhos são case-sensitive.

### Ordem de Carregamento

Mods carregam na ordem listada em `-mod=`. Isso importa quando mods dependem uns dos outros:

- **Dependências primeiro.** Se `@MyMod` requer `@CF`, liste `@CF` antes de `@MyMod`.
- **Regra geral:** frameworks primeiro, mods de conteúdo por último.
- Se seu mod declara `requiredAddons` no `config.cpp`, DayZ tentará resolver a ordem de carregamento automaticamente, mas ordenação explícita em `-mod=` é mais segura.

### Gerenciamento de Chaves

- Coloque **um `.bikey` por mod** no diretório `keys/` do servidor
- Quando um mod atualiza com a mesma chave, nenhuma ação necessária -- o `.bikey` existente ainda funciona
- Se o autor do mod muda as chaves, você deve substituir o `.bikey` antigo pelo novo
- O caminho da pasta `keys/` é relativo à raiz do servidor (ex.: `DayZServer/keys/`)

---

## Distribuição Sem a Workshop

### Quando Pular a Workshop

- **Mods privados** para sua própria comunidade de servidor
- **Testes beta** com um grupo pequeno antes do lançamento público
- **Mods comerciais ou licenciados** distribuídos por outros canais
- **Iteração rápida** durante desenvolvimento (mais rápido que re-uploar cada vez)

### Criando um ZIP de Release

Empacote seu mod para distribuição manual:

```
MyMod_v1.0.0.zip
└── @MyMod/
    ├── addons/
    │   ├── MyMod_Scripts.pbo
    │   ├── MyMod_Scripts.pbo.MyMod.bisign
    │   ├── MyMod_Data.pbo
    │   └── MyMod_Data.pbo.MyMod.bisign
    ├── keys/
    │   └── MyMod.bikey
    └── mod.cpp
```

Inclua um `README.txt` com instruções de instalação:

```
INSTALAÇÃO:
1. Extraia a pasta @MyMod para o diretório do seu jogo DayZ
2. (Operadores de servidor) Copie MyMod.bikey de @MyMod/keys/ para a pasta keys/ do servidor
3. Adicione @MyMod ao seu parâmetro de lançamento -mod=
```

### GitHub Releases

Se seu mod é open source, use GitHub Releases para hospedar downloads versionados:

1. Marque a release no Git (`git tag v1.0.0`)
2. Construa e assine os PBOs
3. Crie um ZIP da pasta `@MyMod`
4. Crie um GitHub Release e anexe o ZIP
5. Escreva notas de release na descrição da release

Isso te dá histórico de versões, contagens de download e uma URL estável para cada release.

---

## Problemas Comuns e Soluções

| Problema | Causa | Correção |
|----------|-------|----------|
| "Addon rejected by server" | Servidor sem `.bikey`, ou `.bisign` não corresponde ao `.pbo` | Confirme que `.bikey` está na pasta `keys/` do servidor. Re-assine PBOs com o `.biprivatekey` correto. |
| "Signature check failed" | PBO modificado após assinatura, ou assinado com chave errada | Reconstrua PBO de fonte limpa. Re-assine com a **mesma chave** que gerou o `.bikey` do servidor. |
| Mod não aparece no DayZ Launcher | `mod.cpp` malformado ou estrutura de pasta errada | Verifique `mod.cpp` por erros de sintaxe (`;` faltando). Garanta que a pasta começa com `@`. Reinicie o launcher. |
| Upload falha no Publisher | Problema de autenticação, conexão ou arquivo travado | Verifique login do Steam. Feche Workbench/Addon Builder. Tente executar DayZ Tools como Administrador. |
| Ícone da Workshop errado/ausente | Caminho ruim no `mod.cpp` ou formato de imagem errado | Verifique que caminhos `picture`/`logo` apontam para arquivos `.paa` reais. Preview da Workshop (`.png`) é separado. |
| Conflitos com outros mods | Redefinindo classes vanilla ao invés de moddá-las | Use `modded class`, chame `super` em overrides, defina `requiredAddons` para ordem de carregamento. |
| Jogadores crasham no carregamento | Erros de script, PBOs corrompidos ou dependências faltando | Verifique logs `.RPT`. Reconstrua PBOs de fonte limpa. Verifique que dependências carregam primeiro. |

---

## O Ciclo de Vida Completo do Mod

```
IDEIA → SETUP (8.1) → ESTRUTURA (8.1, 8.5) → CÓDIGO (8.2, 8.3, 8.4) → BUILD (8.1)
  → TESTE → DEBUG (8.6) → POLIMENTO → ASSINATURA (8.7) → PUBLICAÇÃO (8.7) → MANUTENÇÃO (8.7)
                                    ↑                                          │
                                    └────── loop de feedback ──────────────────┘
```

Após publicar, feedback dos jogadores te envia de volta para CÓDIGO, TESTE e DEBUG. Esse ciclo de publicar-feedback-melhorar é como grandes mods são construídos.

---

## Próximos Passos

Você completou a série completa de tutoriais de modding DayZ -- de um workspace em branco a um mod publicado, assinado e mantido na Steam Workshop. Daqui:

- **Explore os capítulos de referência** (Capítulos 1-7) para conhecimento mais profundo sobre o sistema de GUI, config.cpp e Enforce Script
- **Estude mods open-source** como CF, Community Online Tools e Expansion para padrões avançados
- **Junte-se à comunidade de modding DayZ** no Discord e nos fóruns da Bohemia Interactive
- **Construa maior.** Seu primeiro mod foi Hello World. Seu próximo pode ser uma reformulação completa de gameplay.

As ferramentas estão em suas mãos. Construa algo grandioso.
