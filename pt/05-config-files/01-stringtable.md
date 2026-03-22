# Chapter 5.1: stringtable.csv --- Localization

[Home](../README.md) | **stringtable.csv** | [Next: inputs.xml >>](02-inputs-xml.md)

---

## Sumário

- [Visao Geral](#visao-geral)
- [Formato CSV](#formato-csv)
- [Referência de Colunas](#referência-de-colunas)
- [Convencao de Nomenclatura de Chaves](#convencao-de-nomenclatura-de-chaves)
- [Referênciando Strings](#referênciando-strings)
- [Criando uma Nova Stringtable](#criando-uma-nova-stringtable)
- [Tratamento de Celulas Vazias e Comportamento de Fallback](#tratamento-de-celulas-vazias-e-comportamento-de-fallback)
- [Fluxo de Trabalho Multi-Idioma](#fluxo-de-trabalho-multi-idioma)
- [Abordagem Modular de Stringtable (DayZ Expansion)](#abordagem-modular-de-stringtable-dayz-expansion)
- [Exemplos Reais](#exemplos-reais)
- [Erros Comuns](#erros-comuns)

---

## Visao Geral

O DayZ usa um sistema de localização baseado em CSV. Quando o motor encontra uma chave de string prefixada com `#` (por exemplo, `#STR_MYMOD_HELLO`), ele procura essa chave em todos os arquivos stringtable carregados e retorna a traducao correspondente ao idioma atual do jogador. Se nenhuma correspondencia for encontrada para o idioma ativo, o motor recorre a uma cadeia de fallback definida.

O arquivo stringtable deve ser nomeado exatamente `stringtable.csv` e colocado dentro da estrutura PBO do seu mod. O motor o descobre automáticamente --- nenhum registro no config.cpp é necessário.

---

## Formato CSV

O arquivo e um arquivo de valores separados por virgula padrão com campos entre aspas. A primeira linha e o cabecalho, e cada linha subsequente define uma chave de traducao.

### Linha de Cabecalho

A linha de cabecalho define as colunas. O DayZ reconhece até 15 colunas:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### Linhas de Dados

Cada linha comeca com a chave da string (sem prefixo `#` no CSV), seguida pela traducao para cada idioma:

```csv
"STR_MYMOD_HELLO","Hello World","Hello World","Ahoj světe","Hallo Welt","Привет мир","Witaj świecie","Helló világ","Ciao mondo","Hola mundo","Bonjour le monde","你好世界","ハローワールド","Olá mundo","你好世界",
```

### Virgula Final

Muitos arquivos stringtable incluem uma virgula final após a ultima coluna. Isso é convencional e seguro --- o motor tolera isso.

### Regras de Aspas

- Campos **devem** ser colocados entre aspas duplas se contiverem virgulas, quebras de linha ou aspas duplas.
- Na prática, a maioria dos mods coloca aspas em todos os campos por consistência.
- Alguns mods (como MyMissions Mod) omitem aspas inteiramente; o motor lida com ambos os estilos desde que o conteúdo do campo não contenha virgulas.

---

## Referência de Colunas

O DayZ suporta 13 idiomas selecionaveis pelo jogador. O CSV tem 15 colunas porque a primeira coluna e o nome da chave e a segunda e a coluna `original` (o idioma nativo do autor do mod ou texto padrão).

| # | Nome da Coluna | Idioma | Notas |
|---|----------------|--------|-------|
| 1 | `Language` | --- | O identificador da chave de string (ex.: `STR_MYMOD_HELLO`) |
| 2 | `original` | Nativo do autor | Fallback de ultimo recurso; usado se nenhuma outra coluna corresponder |
| 3 | `english` | Ingles | Idioma primario mais comum para mods internacionais |
| 4 | `czech` | Tcheco | |
| 5 | `german` | Alemao | |
| 6 | `russian` | Russo | |
| 7 | `polish` | Polones | |
| 8 | `hungarian` | Hungaro | |
| 9 | `italian` | Italiano | |
| 10 | `spanish` | Espanhol | |
| 11 | `french` | Frances | |
| 12 | `chinese` | Chines (Tradicional) | Caracteres chineses tradicionais |
| 13 | `japanese` | Japones | |
| 14 | `portuguese` | Portugues | |
| 15 | `chinesesimp` | Chines (Simplificado) | Caracteres chineses simplificados |

### A Ordem das Colunas Importa

O motor identifica colunas pelo **nome do cabecalho**, não pela posição. Porem, seguir a ordem padrão mostrada acima e fortemente recomendado para compatibilidade e legibilidade.

### Colunas Opcionais

Você não precisa incluir todas as 15 colunas. Se seu mod suporta apenas ingles, você pode usar um cabecalho mínimo:

```csv
"Language","english"
"STR_MYMOD_HELLO","Hello World"
```

Alguns mods adicionam colunas nao-padrão como `korean` (MyMissions Mod faz isso). O motor ignora colunas que não reconhece como um idioma suportado, mas essas colunas podem servir como documentação ou preparacao para suporte futuro de idioma.

---

## Convencao de Nomenclatura de Chaves

Chaves de string seguem um padrão de nomenclatura hierarquico:

```
STR_MODNAME_CATEGORY_ELEMENT
```

### Regras

1. **Sempre comece com `STR_`** --- esta é uma convencao universal do DayZ
2. **Prefixo do mod** --- identifica exclusivamente seu mod (ex.: `MYMOD`, `COT`, `EXPANSION`, `VPP`)
3. **Catégoria** --- agrupa strings relacionadas (ex.: `INPUT`, `TAB`, `CONFIG`, `DIR`)
4. **Elemento** --- a string específica (ex.: `ADMIN_PANEL`, `NORTH`, `SAVE`)
5. **Use MAIUSCULAS** --- a convencao em todos os mods principais
6. **Use underscores** como separadores, nunca espacos ou hifens

### Exemplos de Mods Reais

```
STR_MYMOD_INPUT_ADMIN_PANEL       -- MyMod: label de keybinding
STR_MYMOD_CLOSE                   -- MyMod: botao generico "Fechar"
STR_MyDIR_NORTH                  -- MyMod: direcao da bussola
STR_MyTAB_ONLINE                 -- MyMod: nome de aba do painel admin
STR_COT_ESP_MODULE_NAME            -- COT: nome de exibicao do modulo
STR_COT_CAMERA_MODULE_BLUR         -- COT: label da ferramenta de camera
STR_EXPANSION_ATM                  -- Expansion: nome da funcionalidade
STR_EXPANSION_AI_COMMAND_MENU      -- Expansion: label de input
```

### Anti-Padroes

```
STR_hello_world          -- Ruim: minusculas, sem prefixo de mod
MY_STRING                -- Ruim: prefixo STR_ ausente
STR_MYMOD Hello World    -- Ruim: espacos na chave
```

---

## Referênciando Strings

Existem três contextos distintos onde você referência strings localizadas, e cada um usa uma sintaxe ligeiramente diferente.

### Em Arquivos de Layout (.layout)

Use o prefixo `#` antes do nome da chave. O motor resolve isso no momento de criacao do widget.

```
TextWidgetClass MyLabel {
 text "#STR_MYMOD_CLOSE"
 size 100 30
}
```

O prefixo `#` diz ao parser do layout "esta é uma chave de localização, não texto literal."

### Em Enforce Script (arquivos .c)

Use `Widget.TranslateString()` para resolver a chave em tempo de execução. O prefixo `#` é necessário no argumento.

```c
string translated = Widget.TranslateString("#STR_MYMOD_CLOSE");
// translated == "Close" (if player language is English)
// translated == "Fechar" (if player language is Portuguese)
```

Você também pode definir o texto do widget diretamente:

```c
TextWidget label = TextWidget.Cast(layoutRoot.FindAnyWidget("MyLabel"));
label.SetText(Widget.TranslateString("#STR_MYMOD_ADMIN_PANEL"));
```

Ou usar chaves de string diretamente nas propriedades de texto do widget, e o motor as resolve:

```c
label.SetText("#STR_MYMOD_ADMIN_PANEL");  // Also works -- engine auto-resolves
```

### Em inputs.xml

Use o atributo `loc` **sem** o prefixo `#`.

```xml
<input name="UAMyAction" loc="STR_MYMOD_INPUT_MY_ACTION" />
```

Este é o único lugar onde você omite o `#`. O sistema de input o adiciona internamente.

### Tabela Resumo

| Contexto | Sintaxe | Exemplo |
|----------|---------|---------|
| Atributo `text` do layout | `#STR_KEY` | `text "#STR_MYMOD_CLOSE"` |
| Script `TranslateString()` | `"#STR_KEY"` | `Widget.TranslateString("#STR_MYMOD_CLOSE")` |
| Texto de widget no script | `"#STR_KEY"` | `label.SetText("#STR_MYMOD_CLOSE")` |
| Atributo `loc` do inputs.xml | `STR_KEY` (sem #) | `loc="STR_MYMOD_INPUT_ADMIN_PANEL"` |

---

## Criando uma Nova Stringtable

### Passo 1: Crie o Arquivo

Crie `stringtable.csv` na raiz do diretório de conteúdo PBO do seu mod. O motor varre todos os PBOs carregados por arquivos nomeados exatamente `stringtable.csv`.

Posicionamento típico:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      config.cpp
      stringtable.csv        <-- Aqui
      Scripts/
        3_Game/
        4_World/
        5_Mission/
```

### Passo 2: Escreva o Cabecalho

Comece com o cabecalho completo de 15 colunas:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
```

### Passo 3: Adicione Suas Strings

Adicione uma linha por string traduzivel. Comece com ingles, preencha outros idiomas conforme as traducoes ficam disponíveis:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_TITLE","My Cool Mod","My Cool Mod","","","","","","","","","","","","",
"STR_MYMOD_OPEN","Open","Open","Otevřít","Öffnen","Открыть","Otwórz","Megnyitás","Apri","Abrir","Ouvrir","打开","開く","Abrir","打开",
```

### Passo 4: Empacote e Teste

Faca o build do seu PBO. Lance o jogo. Verifique que `Widget.TranslateString("#STR_MYMOD_TITLE")` retorna "My Cool Mod" nos logs do seu script. Mude o idioma do jogo nas configurações para verificar o comportamento de fallback.

---

## Tratamento de Celulas Vazias e Comportamento de Fallback

Quando o motor procura uma chave de string para o idioma atual do jogador e encontra uma celula vazia, ele segue uma cadeia de fallback:

1. **Coluna do idioma selecionado pelo jogador** --- verificada primeiro
2. **Coluna `english`** --- se a celula do idioma do jogador estiver vazia
3. **Coluna `original`** --- se `english` também estiver vazia
4. **Nome bruto da chave** --- se todas as colunas estiverem vazias, o motor exibe a propria chave (ex.: `STR_MYMOD_TITLE`)

Isso significa que você pode deixar colunas nao-inglesas vazias durante o desenvolvimento com seguranca. Jogadores que falam ingles veem a coluna `english`, e outros jogadores veem o fallback em ingles até que uma traducao adequada seja adicionada.

### Implicacao Pratica

Você não precisa copiar o texto em ingles para cada coluna como placeholder. Deixe celulas não traduzidas vazias:

```csv
"STR_MYMOD_HELLO","Hello","Hello","","","","","","","","","","","","",
```

Jogadores cujo idioma e alémao verao "Hello" (o fallback em ingles) até que uma traducao em alémao seja fornecida.

---

## Fluxo de Trabalho Multi-Idioma

### Para Desenvolvedores Solo

1. Escreva todas as strings em ingles (colunas `original` e `english`).
2. Lance o mod. Ingles serve como fallback universal.
3. Conforme membros da comunidade oferecem traducoes, preencha colunas adicionais.
4. Reconstrua e lance atualizacoes.

### Para Equipes com Tradutores

1. Mantenha o CSV em um repositorio compartilhado ou planilha.
2. Atribua um tradutor por idioma.
3. Use a coluna `original` para o idioma nativo do autor (ex.: portugues para desenvolvedores brasileiros).
4. A coluna `english` é sempre preenchida --- e a linha de base internacional.
5. Use uma ferramenta de diff para rastrear quais chaves foram adicionadas desde a ultima rodada de traducao.

### Usando Software de Planilha

Arquivos CSV abrem naturalmente no Excel, Google Sheets ou LibreOffice Calc. Esteja ciente destas armadilhas:

- **Excel pode adicionar BOM (Byte Order Mark)** a arquivos UTF-8. O DayZ lida com BOM, mas pode causar problemas com algumas ferramentas. Salve como "CSV UTF-8" para seguranca.
- **Auto-formatacao do Excel** pode deformar campos que parecem datas ou números.
- **Finais de linha**: O DayZ aceita tanto `\r\n` (Windows) quanto `\n` (Unix).

---

## Abordagem Modular de Stringtable (DayZ Expansion)

O DayZ Expansion demonstra uma boa prática para mods grandes: dividir traducoes em múltiplos arquivos stringtable organizados por modulo de funcionalidade. Sua estrutura usa 20 arquivos stringtable separados dentro de um diretório `languagecore`:

```
DayZExpansion/
  languagecore/
    AI/stringtable.csv
    BaseBuilding/stringtable.csv
    Book/stringtable.csv
    Chat/stringtable.csv
    Core/stringtable.csv
    Garage/stringtable.csv
    Groups/stringtable.csv
    Hardline/stringtable.csv
    Licensed/stringtable.csv
    Main/stringtable.csv
    MapAssets/stringtable.csv
    Market/stringtable.csv
    Missions/stringtable.csv
    Navigation/stringtable.csv
    PersonalStorage/stringtable.csv
    PlayerList/stringtable.csv
    Quests/stringtable.csv
    SpawnSelection/stringtable.csv
    Vehicles/stringtable.csv
    Weapons/stringtable.csv
```

### Por Que Dividir?

- **Gerenciabilidade**: Uma única stringtable para um mod grande pode crescer para milhares de linhas. Dividir por modulo de funcionalidade torna cada arquivo gerenciavel.
- **Atualizacoes independentes**: Tradutores podem trabalhar em um modulo por vez sem conflitos de merge.
- **Inclusao condicional**: O PBO de cada sub-mod inclui apenas a stringtable da sua propria funcionalidade, mantendo tamanhos de PBO menores.

### Como Funciona

O motor varre todo PBO carregado por `stringtable.csv`. Como cada sub-modulo do Expansion e empacotado em seu proprio PBO, cada um naturalmente inclui apenas sua propria stringtable. Nenhuma configuração especial é necessária --- basta nomear o arquivo `stringtable.csv` e coloca-lo dentro do PBO.

Nomes de chave ainda usam um prefixo global (`STR_EXPANSION_`) para evitar colisoes.

---

## Exemplos Reais

### MyFramework

MyFramework usa o formato completo de 15 colunas com portugues como o idioma `original` (o idioma nativo da equipe de desenvolvimento) e traducoes abrangentes para todos os 13 idiomas suportados:

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod","MyMod",
"STR_MYMOD_INPUT_ADMIN_PANEL","Painel Admin","Open Admin Panel","Otevřít Admin Panel","Admin-Panel öffnen","Открыть Админ Панель","Otwórz Panel Admina","Admin Panel megnyitása","Apri Pannello Admin","Abrir Panel Admin","Ouvrir le Panneau Admin","打开管理面板","管理パネルを開く","Abrir Painel Admin","打开管理面板",
"STR_MYMOD_CLOSE","Fechar","Close","Zavřít","Schließen","Закрыть","Zamknij","Bezárás","Chiudi","Cerrar","Fermer","关闭","閉じる","Fechar","关闭",
"STR_MYMOD_SAVE","Salvar","Save","Uložit","Speichern","Сохранить","Zapisz","Mentés","Salva","Guardar","Sauvegarder","保存","保存","Salvar","保存",
```

Padroes notaveis:
- `original` contem texto em portugues (o idioma nativo da equipe)
- `english` é sempre preenchido como linha de base internacional
- Todas as 13 colunas de idioma estao preenchidas

### COT (Community Online Tools)

COT usa o mesmo formato de 15 colunas. Suas chaves seguem o padrão `STR_COT_MODULE_CATEGORY_ELEMENT`:

```csv
Language,original,english,czech,german,russian,polish,hungarian,italian,spanish,french,chinese,japanese,portuguese,chinesesimp,
STR_COT_CAMERA_MODULE_BLUR,Blur:,Blur:,Rozmazání:,Weichzeichner:,Размытие:,Rozmycie:,Elmosódás:,Sfocatura:,Desenfoque:,Flou:,模糊:,ぼかし:,Desfoque:,模糊:,
STR_COT_ESP_MODULE_NAME,Camera Tools,Camera Tools,Nástroje kamery,Kamera-Werkzeuge,Камера,Narzędzia Kamery,Kamera Eszközök,Strumenti Camera,Herramientas de Cámara,Outils Caméra,相機工具,カメラツール,Ferramentas da Câmera,相机工具,
```

### VPP Admin Tools

VPP usa um conjunto reduzido de colunas (13 colunas, sem coluna `hungarian`) e não prefixa chaves com `STR_`:

```csv
"Language","original","english","czech","german","russian","polish","italian","spanish","french","chinese","japanese","portuguese","chinesesimp"
"vpp_focus_on_game","[Hold/2xTap] Focus On Game","[Hold/2xTap] Focus On Game","...","...","...","...","...","...","...","...","...","...","..."
```

Isso demonstra que o prefixo `STR_` e uma convencao, não um requisito. Porem, omiti-lo significa que você não pode usar a resolução de prefixo `#` em arquivos de layout. O VPP referência essas chaves apenas atraves de código de script. O prefixo `STR_` e fortemente recomendado para todos os novos mods.

### MyMissions Mod

MyMissions Mod usa um CSV estilo sem aspas e sem cabecalho (sem aspas em torno dos campos) com uma coluna extra `Korean`:

```csv
Language,English,Czech,German,Russian,Polish,Hungarian,Italian,Spanish,French,Chinese,Japanese,Portuguese,Korean
STR_MyMISSION_AVAILABLE,MISSION AVAILABLE,MISE K DISPOZICI,MISSION VERFÜGBAR,МИССИЯ ДОСТУПНА,...
```

Notavel: a coluna `original` esta ausente, e `Korean` e adicionado como idioma extra. O motor ignora nomes de coluna não reconhecidos, então `Korean` serve como documentação até que suporte oficial ao coreano seja adicionado.

---

## Erros Comuns

### Esquecendo o Prefixo `#` em Scripts

```c
// WRONG -- displays the raw key, not the translation
label.SetText("STR_MYMOD_HELLO");

// CORRECT
label.SetText("#STR_MYMOD_HELLO");
```

### Usando `#` no inputs.xml

```xml
<!-- WRONG -- the input system adds # internally -->
<input name="UAMyAction" loc="#STR_MYMOD_MY_ACTION" />

<!-- CORRECT -->
<input name="UAMyAction" loc="STR_MYMOD_MY_ACTION" />
```

### Chaves Duplicadas Entre Mods

Se dois mods definem `STR_CLOSE`, o motor usa qualquer PBO que carregue por ultimo. Sempre use o prefixo do seu mod:

```csv
"STR_MYMOD_CLOSE","Close","Close",...
```

### Contagem de Colunas Incompatível

Se uma linha tem menos colunas que o cabecalho, o motor pode silenciosamente ignora-la ou atribuir strings vazias as colunas ausentes. Sempre garanta que cada linha tenha o mesmo número de campos que o cabecalho.

### Problemas com BOM

Alguns editores de texto inserem um BOM (byte order mark) UTF-8 no inicio do arquivo. Isso pode fazer com que a primeira chave de string no CSV fique silenciosamente quebrada. Se sua primeira chave de string nunca resolve, verifique é remova o BOM.

### Usando Virgulas Dentro de Campos Sem Aspas

```csv
STR_MYMOD_MSG,Hello, World,Hello, World,...
```

Isso quebra o parsing porque `Hello` e ` World` são lidos como colunas separadas. Coloque o campo entre aspas ou evite virgulas nos valores:

```csv
"STR_MYMOD_MSG","Hello, World","Hello, World",...
```
