# Perguntas Frequentes

[Início](./README.md) | **FAQ**

---

## Primeiros Passos

### P: O que preciso para começar a moddar DayZ?
**R:** Você precisa do Steam, DayZ (cópia retail), DayZ Tools (gratuito no Steam, na seção Tools) e um editor de texto (VS Code é recomendado). Não é estritamente necessária experiência em programação -- comece com o [Capítulo 8.1: Seu Primeiro Mod](08-tutorials/01-first-mod.md). O DayZ Tools inclui Object Builder, Addon Builder, TexView2 e o IDE Workbench.

### P: Qual linguagem de programação o DayZ usa?
**R:** O DayZ usa **Enforce Script**, uma linguagem proprietária da Bohemia Interactive. Tem sintaxe similar a C#, mas com suas próprias regras e limitações (sem operador ternário, sem try/catch, sem lambdas). Veja a [Parte 1: Enforce Script](01-enforce-script/01-variables-types.md) para um guia completo da linguagem.

### P: Como configuro a unidade P:?
**R:** Abra o DayZ Tools pelo Steam, clique em "Workdrive" ou "Setup Workdrive" para montar a unidade P:. Isso cria uma unidade virtual apontando para seu espaço de trabalho de modding, onde o motor procura os arquivos fonte durante o desenvolvimento. Você também pode usar `subst P: "C:\Seu\Caminho"` pela linha de comando. Ver [Capítulo 4.5](04-file-formats/05-dayz-tools.md).

### P: Posso testar meu mod sem um servidor dedicado?
**R:** Sim. Inicie o DayZ com o parâmetro `-filePatching` e seu mod carregado. Para testes rápidos, use um Listen Server (hospede pelo menu do jogo). Para testes de produção, sempre verifique também em um servidor dedicado, pois alguns caminhos de código diferem. Ver [Capítulo 8.1](08-tutorials/01-first-mod.md).

### P: Onde encontro os arquivos de script vanilla do DayZ para estudar?
**R:** Após montar a unidade P: pelo DayZ Tools, os scripts vanilla estão em `P:\DZ\scripts\` organizados por camada (`3_Game`, `4_World`, `5_Mission`). Esses são a referência definitiva para cada classe, método e evento do motor. Veja também a [Folha de Referência](cheatsheet.md) e a [Referência Rápida de API](06-engine-api/quick-reference.md).

---

## Erros Comuns e Correções

### P: Meu mod carrega mas nada acontece. Sem erros no log.
**R:** Provavelmente seu `config.cpp` tem uma entrada incorreta em `requiredAddons[]`, fazendo seus scripts carregarem cedo demais ou não carregarem. Verifique se cada nome de addon em `requiredAddons` corresponde exatamente a um nome de classe `CfgPatches` existente (diferencia maiúsculas e minúsculas). Confira o log de scripts em `%localappdata%/DayZ/` para avisos silenciosos. Ver [Capítulo 2.2](02-mod-structure/02-config-cpp.md).

### P: Recebo erros "Cannot find variable" ou "Undefined variable".
**R:** Isso geralmente significa que você está referenciando uma classe ou variável de uma camada de scripts superior. Camadas inferiores (`3_Game`) não conseguem ver tipos definidos em camadas superiores (`4_World`, `5_Mission`). Mova a definição da sua classe para a camada correta, ou use reflexão com `typename` para acoplamento fraco. Ver [Capítulo 2.1](02-mod-structure/01-five-layers.md).

### P: Por que `JsonFileLoader<T>.JsonLoadFile()` não retorna meus dados?
**R:** `JsonLoadFile()` retorna `void`, não o objeto carregado. Você deve pré-alocar seu objeto e passá-lo como parâmetro de referência: `ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`. Atribuir o valor de retorno silenciosamente resulta em `null`. Ver [Capítulo 6.8](06-engine-api/08-file-io.md).

### P: Meu RPC é enviado mas nunca recebido no outro lado.
**R:** Verifique estas causas comuns: (1) O ID do RPC não corresponde entre emissor e receptor. (2) Você está enviando do cliente mas ouvindo no cliente (ou servidor para servidor). (3) Você esqueceu de registrar o handler de RPC em `OnRPC()` ou no seu handler personalizado. (4) A entidade alvo é `null` ou não está sincronizada pela rede. Ver [Capítulo 6.9](06-engine-api/09-networking.md) e [Capítulo 7.3](07-patterns/03-rpc-patterns.md).

### P: Recebo "Error: Member already defined" em um bloco else-if.
**R:** Enforce Script não permite redeclaração de variáveis em blocos `else if` irmãos dentro do mesmo escopo. Declare a variável uma vez antes da cadeia `if`, ou use escopos separados com chaves. Ver [Capítulo 1.12](01-enforce-script/12-gotchas.md).

### P: Meu layout de UI não mostra nada / widgets estão invisíveis.
**R:** Causas comuns: (1) O widget tem tamanho zero -- verifique se largura e altura estão configurados corretamente (sem valores negativos). (2) O widget não está com `Show(true)`. (3) O alfa da cor do texto é 0 (totalmente transparente). (4) O caminho do layout em `CreateWidgets()` está errado (nenhum erro é lançado, simplesmente retorna `null`). Ver [Capítulo 3.3](03-gui-system/03-sizing-positioning.md).

### P: Meu mod causa crash ao iniciar o servidor.
**R:** Verifique: (1) Chamadas a métodos exclusivos do cliente (`GetGame().GetPlayer()`, código de UI) no servidor. (2) Referência `null` em `OnInit` ou `OnMissionStart` antes do mundo estar pronto. (3) Recursão infinita em um override de `modded class` que esqueceu de chamar `super`. Sempre adicione cláusulas de guarda, pois não há try/catch. Ver [Capítulo 1.11](01-enforce-script/11-error-handling.md).

### P: Caracteres de barra invertida ou aspas nas minhas strings causam erros de parse.
**R:** O parser do Enforce Script (CParser) não suporta sequências de escape `\\` ou `\"` em literais de string. Evite barras invertidas completamente. Para caminhos de arquivos, use barras normais (`"meu/caminho/arquivo.json"`). Para aspas dentro de strings, use aspas simples ou concatenação de strings. Ver [Capítulo 1.12](01-enforce-script/12-gotchas.md).

---

## Decisões de Arquitetura

### P: O que é a hierarquia de 5 camadas de scripts e por que importa?
**R:** Os scripts do DayZ compilam em cinco camadas numeradas: `1_Core`, `2_GameLib`, `3_Game`, `4_World`, `5_Mission`. Cada camada só pode referenciar tipos da mesma camada ou de camadas com número inferior. Isso impõe limites arquiteturais -- coloque enums e constantes compartilhadas em `3_Game`, lógica de entidades em `4_World`, e hooks de UI/missão em `5_Mission`. Ver [Capítulo 2.1](02-mod-structure/01-five-layers.md).

### P: Devo usar `modded class` ou criar classes novas?
**R:** Use `modded class` quando precisar alterar ou estender o comportamento vanilla existente (adicionar um método ao `PlayerBase`, se conectar ao `MissionServer`). Crie classes novas para sistemas autocontidos que não precisem sobrescrever nada. Classes modded se encadeiam automaticamente -- sempre chame `super` para evitar quebrar outros mods. Ver [Capítulo 1.4](01-enforce-script/04-modded-classes.md).

### P: Como devo organizar o código de cliente vs. servidor?
**R:** Use as diretivas de pré-processador `#ifdef SERVER` e `#ifdef CLIENT` para código que deve rodar apenas em um lado. Para mods maiores, separe em PBOs distintos: um mod de cliente (UI, renderização, efeitos locais) e um mod de servidor (spawning, lógica, persistência). Isso evita vazar a lógica do servidor para os clientes. Ver [Capítulo 2.5](02-mod-structure/05-file-organization.md) e [Capítulo 6.9](06-engine-api/09-networking.md).

### P: Quando devo usar um Singleton vs. um Module/Plugin?
**R:** Use um Module (registrado com o `PluginManager` do CF ou seu próprio sistema de módulos) quando precisar de gerenciamento de ciclo de vida (`OnInit`, `OnUpdate`, `OnMissionFinish`). Use um Singleton independente para serviços utilitários sem estado que só precisem de acesso global. Modules são preferíveis para qualquer coisa com estado ou necessidade de limpeza. Ver [Capítulo 7.1](07-patterns/01-singletons.md) e [Capítulo 7.2](07-patterns/02-module-systems.md).

### P: Como armazeno dados por jogador de forma segura que sobrevivam a reinícios do servidor?
**R:** Salve arquivos JSON no diretório `$profile:` do servidor usando `JsonFileLoader`. Use o Steam UID do jogador (de `PlayerIdentity.GetId()`) como nome do arquivo. Carregue ao conectar o jogador, salve ao desconectar e periodicamente. Sempre trate arquivos ausentes ou corrompidos com cláusulas de guarda. Ver [Capítulo 7.4](07-patterns/04-config-persistence.md) e [Capítulo 6.8](06-engine-api/08-file-io.md).

---

## Publicação e Distribuição

### P: Como empacoto meu mod em um PBO?
**R:** Use o Addon Builder (do DayZ Tools) ou ferramentas de terceiros como PBO Manager. Aponte para a pasta fonte do seu mod, defina o prefixo correto (correspondendo ao prefixo de addon do seu `config.cpp`) e compile. O arquivo `.pbo` resultante vai na pasta `Addons/` do seu mod. Ver [Capítulo 4.6](04-file-formats/06-pbo-packing.md).

### P: Como assino meu mod para uso em servidores?
**R:** Gere um par de chaves com o DSSignFile ou DSCreateKey do DayZ Tools: isso produz um `.biprivatekey` e um `.bikey`. Assine cada PBO com a chave privada (cria arquivos `.bisign` ao lado de cada PBO). Distribua o `.bikey` para os administradores de servidor para a pasta `keys/` deles. Nunca compartilhe seu `.biprivatekey`. Ver [Capítulo 4.6](04-file-formats/06-pbo-packing.md).

### P: Como publico no Steam Workshop?
**R:** Use o Publisher do DayZ Tools ou o uploader do Steam Workshop. Você precisa de um arquivo `mod.cpp` na raiz do seu mod definindo o nome, autor e descrição. O publisher faz upload dos seus PBOs empacotados e o Steam atribui um Workshop ID. Atualize republicando pela mesma conta. Ver [Capítulo 2.3](02-mod-structure/03-mod-cpp.md) e [Capítulo 8.7](08-tutorials/07-publishing-workshop.md).

### P: Meu mod pode exigir outros mods como dependências?
**R:** Sim. No `config.cpp`, adicione o nome de classe `CfgPatches` do mod de dependência ao seu array `requiredAddons[]`. No `mod.cpp`, não há um sistema formal de dependências -- documente os mods necessários na descrição do seu Workshop. Os jogadores devem se inscrever e carregar todos os mods necessários. Ver [Capítulo 2.2](02-mod-structure/02-config-cpp.md).

---

## Tópicos Avançados

### P: Como crio ações de jogador personalizadas (interações)?
**R:** Estenda `ActionBase` (ou uma subclasse como `ActionInteractBase`), defina `CreateConditionComponents()` para precondições, sobrescreva `OnStart`/`OnExecute`/`OnEnd` para a lógica, e registre em `SetActions()` na entidade alvo. Ações suportam modos contínuo (segurar) e instantâneo (clique). Ver [Capítulo 6.12](06-engine-api/12-action-system.md).

### P: Como funciona o sistema de dano para itens personalizados?
**R:** Defina uma classe `DamageSystem` no config.cpp do seu item com `DamageZones` (regiões nomeadas) e valores de `ArmorType`. Cada zona rastreia sua própria vida. Sobrescreva `EEHitBy()` e `EEKilled()` no script para reações de dano personalizadas. O motor mapeia os componentes de Fire Geometry do modelo para nomes de zona. Ver [Capítulo 6.1](06-engine-api/01-entity-system.md).

### P: Como posso adicionar atalhos de teclado personalizados ao meu mod?
**R:** Crie um arquivo `inputs.xml` definindo suas ações de entrada com atribuições de teclas padrão. Registre-as no script via `GetUApi().RegisterInput()`. Consulte o estado com `GetUApi().GetInputByName("sua_acao").LocalPress()`. Adicione nomes localizados no seu `stringtable.csv`. Ver [Capítulo 5.2](05-config-files/02-inputs-xml.md) e [Capítulo 6.13](06-engine-api/13-input-system.md).

### P: Como faço meu mod ser compatível com outros mods?
**R:** Siga estes princípios: (1) Sempre chame `super` em overrides de modded class. (2) Use nomes de classe únicos com um prefixo do mod (ex. `MeuMod_Manager`). (3) Use IDs de RPC únicos. (4) Não sobrescreva métodos vanilla sem chamar `super`. (5) Use `#ifdef` para detectar dependências opcionais. (6) Teste com combinações de mods populares (CF, Expansion, etc.). Ver [Capítulo 7.2](07-patterns/02-module-systems.md).

### P: Como otimizo meu mod para desempenho do servidor?
**R:** Estratégias-chave: (1) Evite lógica por frame (`OnUpdate`) -- use temporizadores ou design orientado a eventos. (2) Faça cache de referências em vez de chamar `GetGame().GetPlayer()` repetidamente. (3) Use guardas `GetGame().IsServer()` / `GetGame().IsClient()` para pular código desnecessário. (4) Profile com benchmarks `int start = TickCount(0);`. (5) Limite o tráfego de rede -- agrupe RPCs e use Net Sync Variables para atualizações pequenas frequentes. Ver [Capítulo 7.7](07-patterns/07-performance.md).

---

*Tem uma pergunta que não foi coberta aqui? Abra uma issue no repositório.*
