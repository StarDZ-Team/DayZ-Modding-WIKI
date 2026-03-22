# Guia Completo de Modding para DayZ

> Documentacao abrangente para modding de DayZ — 92 capitulos, do zero ao mod publicado.

<p align="center">
  <a href="../en/README.md"><img src="https://flagsapi.com/US/flat/48.png" alt="English" /></a>
  <a href="README.md"><img src="https://flagsapi.com/BR/flat/48.png" alt="Portugues" /></a>
  <a href="../de/README.md"><img src="https://flagsapi.com/DE/flat/48.png" alt="Deutsch" /></a>
  <a href="../ru/README.md"><img src="https://flagsapi.com/RU/flat/48.png" alt="Russki" /></a>
  <a href="../es/README.md"><img src="https://flagsapi.com/ES/flat/48.png" alt="Espanol" /></a>
  <a href="../fr/README.md"><img src="https://flagsapi.com/FR/flat/48.png" alt="Francais" /></a>
  <a href="../ja/README.md"><img src="https://flagsapi.com/JP/flat/48.png" alt="Nihongo" /></a>
  <a href="../zh-hans/README.md"><img src="https://flagsapi.com/CN/flat/48.png" alt="Jiantizi Zhongwen" /></a>
  <a href="../cs/README.md"><img src="https://flagsapi.com/CZ/flat/48.png" alt="Cestina" /></a>
  <a href="../pl/README.md"><img src="https://flagsapi.com/PL/flat/48.png" alt="Polski" /></a>
  <a href="../hu/README.md"><img src="https://flagsapi.com/HU/flat/48.png" alt="Magyar" /></a>
  <a href="../it/README.md"><img src="https://flagsapi.com/IT/flat/48.png" alt="Italiano" /></a>
</p>

---

## Indice Completo de Paginas

### Parte 1: Linguagem Enforce Script (13 capitulos)

| # | Capitulo | Descricao |
|---|----------|-----------|
| 1.1 | [Variaveis & Tipos](01-enforce-script/01-variables-types.md) | Tipos primitivos, declaracao de variaveis, conversoes e valores padrao |
| 1.2 | [Arrays, Maps & Sets](01-enforce-script/02-arrays-maps-sets.md) | Colecoes de dados: array, map, set — iteracao, busca, ordenacao |
| 1.3 | [Classes & Heranca](01-enforce-script/03-classes-inheritance.md) | Definicao de classes, heranca, construtores, polimorfismo |
| 1.4 | [Modded Classes](01-enforce-script/04-modded-classes.md) | Sistema de modded class, override de metodos, chamadas super |
| 1.5 | [Fluxo de Controle](01-enforce-script/05-control-flow.md) | If/else, switch, loops while/for, break, continue |
| 1.6 | [Operacoes com Strings](01-enforce-script/06-strings.md) | Manipulacao de strings, formatacao, busca, comparacao |
| 1.7 | [Matematica & Vetores](01-enforce-script/07-math-vectors.md) | Funcoes matematicas, vetores 3D, distancias, direcoes |
| 1.8 | [Gerenciamento de Memoria](01-enforce-script/08-memory-management.md) | Contagem de referencias, ref, prevent leaks, ciclos de referencia |
| 1.9 | [Casting & Reflexao](01-enforce-script/09-casting-reflection.md) | Cast de tipos, Class.CastTo, verificacao de tipo em runtime |
| 1.10 | [Enums & Preprocessador](01-enforce-script/10-enums-preprocessor.md) | Enumeracoes, #ifdef, #define, compilacao condicional |
| 1.11 | [Tratamento de Erros](01-enforce-script/11-error-handling.md) | Padroes de tratamento de erros sem try/catch, guard clauses |
| 1.12 | [O Que NAO Existe](01-enforce-script/12-gotchas.md) | 30+ armadilhas e limitacoes da linguagem Enforce Script |
| 1.13 | [Funcoes & Metodos](01-enforce-script/13-functions-methods.md) | Declaracao de funcoes, parametros, retornos, static, proto |

### Parte 2: Estrutura de Mod (6 capitulos)

| # | Capitulo | Descricao |
|---|----------|-----------|
| 2.1 | [Hierarquia de 5 Camadas](02-mod-structure/01-five-layers.md) | As 5 camadas de scripts do DayZ e ordem de compilacao |
| 2.2 | [config.cpp em Detalhe](02-mod-structure/02-config-cpp.md) | Estrutura completa do config.cpp, CfgPatches, CfgMods |
| 2.3 | [mod.cpp & Workshop](02-mod-structure/03-mod-cpp.md) | Arquivo mod.cpp, publicacao no Steam Workshop |
| 2.4 | [Seu Primeiro Mod](02-mod-structure/04-minimum-viable-mod.md) | Mod minimo viavel — arquivos essenciais e estrutura |
| 2.5 | [Organizacao de Arquivos](02-mod-structure/05-file-organization.md) | Convencoes de nomenclatura, estrutura de pastas recomendada |
| 2.6 | [Arquitetura Servidor/Cliente](02-mod-structure/06-server-client-split.md) | Separacao de codigo servidor e cliente, seguranca |

### Parte 3: Sistema GUI & Layout (10 capitulos)

| # | Capitulo | Descricao |
|---|----------|-----------|
| 3.1 | [Tipos de Widget](03-gui-system/01-widget-types.md) | Todos os tipos de widget disponiveis: texto, imagem, botao, etc. |
| 3.2 | [Formato de Layout](03-gui-system/02-layout-files.md) | Estrutura de arquivos .layout XML para interfaces |
| 3.3 | [Dimensionamento & Posicionamento](03-gui-system/03-sizing-positioning.md) | Sistema de coordenadas, flags de tamanho, ancoragem |
| 3.4 | [Containers](03-gui-system/04-containers.md) | Widgets de container: WrapSpacer, GridSpacer, ScrollWidget |
| 3.5 | [Criacao Programatica](03-gui-system/05-programmatic-widgets.md) | Criar widgets via codigo, GetWidgetUnderCursor, SetHandler |
| 3.6 | [Tratamento de Eventos](03-gui-system/06-event-handling.md) | Callbacks de UI, OnClick, OnChange, OnMouseEnter |
| 3.7 | [Estilos, Fontes & Imagens](03-gui-system/07-styles-fonts.md) | Fontes disponiveis, estilos, carregamento de imagens |
| 3.8 | [Dialogos & Modais](03-gui-system/08-dialogs-modals.md) | Criacao de dialogos, menus modais, confirmacao |
| 3.9 | [Padroes Reais de UI](03-gui-system/09-real-mod-patterns.md) | Padroes de UI de COT, VPP, Expansion, Dabs Framework |
| 3.10 | [Widgets Avancados](03-gui-system/10-advanced-widgets.md) | MapWidget, RenderTargetWidget, widgets especializados |

### Parte 4: Formatos de Arquivo & Ferramentas (8 capitulos)

| # | Capitulo | Descricao |
|---|----------|-----------|
| 4.1 | [Texturas](04-file-formats/01-textures.md) | Formatos .paa, .edds, .tga — conversao e uso |
| 4.2 | [Modelos 3D](04-file-formats/02-models.md) | Formato .p3d, LODs, geometria, pontos de memoria |
| 4.3 | [Materiais](04-file-formats/03-materials.md) | Arquivos .rvmat, shaders, propriedades de superficie |
| 4.4 | [Audio](04-file-formats/04-audio.md) | Formatos .ogg e .wss, configuracao de som |
| 4.5 | [DayZ Tools](04-file-formats/05-dayz-tools.md) | Fluxo de trabalho com DayZ Tools oficiais |
| 4.6 | [Empacotamento PBO](04-file-formats/06-pbo-packing.md) | Criacao e extracao de arquivos PBO |
| 4.7 | [Guia do Workbench](04-file-formats/07-workbench-guide.md) | Uso do Workbench para edicao de scripts e assets |
| 4.8 | [Modelagem de Construcoes](04-file-formats/08-building-modeling.md) | Modelagem de predios com portas e escadas |

### Parte 5: Arquivos de Configuracao (6 capitulos)

| # | Capitulo | Descricao |
|---|----------|-----------|
| 5.1 | [stringtable.csv](05-config-files/01-stringtable.md) | Localizacao com stringtable.csv para 13 idiomas |
| 5.2 | [inputs.xml](05-config-files/02-inputs-xml.md) | Configuracao de teclas e keybindings personalizados |
| 5.3 | [credits.json](05-config-files/03-credits-json.md) | Arquivo de creditos do mod |
| 5.4 | [ImageSets](05-config-files/04-imagesets.md) | Formato ImageSet para icones e sprites |
| 5.5 | [Configuracao de Servidor](05-config-files/05-server-configs.md) | Arquivos de configuracao do servidor DayZ |
| 5.6 | [Configuracao de Spawn](05-config-files/06-spawning-gear.md) | Configuracao de equipamento inicial e pontos de spawn |

### Parte 6: Referencia da API do Motor (23 capitulos)

| # | Capitulo | Descricao |
|---|----------|-----------|
| 6.1 | [Sistema de Entidades](06-engine-api/01-entity-system.md) | Hierarquia de entidades, EntityAI, ItemBase, Object |
| 6.2 | [Sistema de Veiculos](06-engine-api/02-vehicles.md) | API de veiculos, motores, fluidos, simulacao de fisica |
| 6.3 | [Sistema Meteorologico](06-engine-api/03-weather.md) | Controle de clima, chuva, neblina, overcast |
| 6.4 | [Sistema de Cameras](06-engine-api/04-cameras.md) | Cameras personalizadas, posicao, rotacao, transicoes |
| 6.5 | [Efeitos de Pos-Processamento](06-engine-api/05-ppe.md) | PPE: blur, chromatic aberration, color grading |
| 6.6 | [Sistema de Notificacoes](06-engine-api/06-notifications.md) | Notificacoes na tela, mensagens para jogadores |
| 6.7 | [Timers & CallQueue](06-engine-api/07-timers.md) | Temporizadores, chamadas atrasadas, repeticao |
| 6.8 | [File I/O & JSON](06-engine-api/08-file-io.md) | Leitura/escrita de arquivos, parse de JSON |
| 6.9 | [Networking & RPC](06-engine-api/09-networking.md) | Comunicacao rede, RPCs, sincronizacao cliente-servidor |
| 6.10 | [Economia Central](06-engine-api/10-central-economy.md) | Sistema de loot, categories, flags, min/max |
| 6.11 | [Mission Hooks](06-engine-api/11-mission-hooks.md) | Hooks de missao, MissionBase, MissionServer |
| 6.12 | [Sistema de Acoes](06-engine-api/12-action-system.md) | Acoes do jogador, ActionBase, alvos, condicoes |
| 6.13 | [Sistema de Input](06-engine-api/13-input-system.md) | Captura de teclas, mapeamento, UAInput |
| 6.14 | [Sistema de Jogador](06-engine-api/14-player-system.md) | PlayerBase, inventario, vida, stamina, stats |
| 6.15 | [Sistema de Som](06-engine-api/15-sound-system.md) | Reproducao de audio, SoundOnVehicle, ambientes |
| 6.16 | [Sistema de Crafting](06-engine-api/16-crafting-system.md) | Receitas de crafting, ingredientes, resultados |
| 6.17 | [Sistema de Construcao](06-engine-api/17-construction-system.md) | Basebuilding, pecas de construcao, estados |
| 6.18 | [Sistema de Animacao](06-engine-api/18-animation-system.md) | Player animation, command IDs, callbacks |
| 6.19 | [Consultas de Terreno](06-engine-api/19-terrain-queries.md) | Raycasts, posicao no terreno, superficies |
| 6.20 | [Efeitos de Particulas](06-engine-api/20-particle-effects.md) | Sistema de particulas, emissores, efeitos visuais |
| 6.21 | [Sistema de Zumbis & IA](06-engine-api/21-zombie-ai-system.md) | ZombieBase, IA dos infectados, comportamento |
| 6.22 | [Admin & Servidor](06-engine-api/22-admin-server.md) | Gerenciamento de servidor, bans, kicks, RCON |
| 6.23 | [Sistemas de Mundo](06-engine-api/23-world-systems.md) | Hora do dia, data, funcoes de mundo |

### Parte 7: Padroes & Boas Praticas (7 capitulos)

| # | Capitulo | Descricao |
|---|----------|-----------|
| 7.1 | [Padrao Singleton](07-patterns/01-singletons.md) | Instancias unicas, acesso global, inicializacao |
| 7.2 | [Sistemas de Modulos](07-patterns/02-module-systems.md) | Registro de modulos, ciclo de vida, CF modules |
| 7.3 | [Comunicacao RPC](07-patterns/03-rpc-patterns.md) | Padroes para RPCs seguros e eficientes |
| 7.4 | [Persistencia de Config](07-patterns/04-config-persistence.md) | Salvar/carregar configuracoes JSON, versionamento |
| 7.5 | [Sistemas de Permissao](07-patterns/05-permissions.md) | Permissoes hierarquicas, wildcards, grupos |
| 7.6 | [Arquitetura de Eventos](07-patterns/06-events.md) | Event bus, publish/subscribe, desacoplamento |
| 7.7 | [Otimizacao de Desempenho](07-patterns/07-performance.md) | Profiling, cache, pooling, reducao de RPCs |

### Parte 8: Tutoriais (13 capitulos)

| # | Capitulo | Descricao |
|---|----------|-----------|
| 8.1 | [Seu Primeiro Mod (Hello World)](08-tutorials/01-first-mod.md) | Tutorial passo a passo: construa e carregue um mod |
| 8.2 | [Criando um Item Personalizado](08-tutorials/02-custom-item.md) | Crie um item com modelo, textura e config |
| 8.3 | [Construindo um Painel Admin](08-tutorials/03-admin-panel.md) | UI admin com teleport, spawn, gerenciamento |
| 8.4 | [Adicionando Comandos de Chat](08-tutorials/04-chat-commands.md) | Comandos personalizados no chat do jogo |
| 8.5 | [Usando o Template de Mod](08-tutorials/05-mod-template.md) | Como usar o template oficial de mods DayZ |
| 8.6 | [Depuracao & Testes](08-tutorials/06-debugging-testing.md) | Logs, debug, ferramentas de diagnostico |
| 8.7 | [Publicando no Workshop](08-tutorials/07-publishing-workshop.md) | Publicar seu mod no Steam Workshop |
| 8.8 | [Construindo um HUD Overlay](08-tutorials/08-hud-overlay.md) | Overlay de HUD personalizado sobre o jogo |
| 8.9 | [Template Profissional de Mod](08-tutorials/09-professional-template.md) | Template completo pronto para producao |
| 8.10 | [Criando um Mod de Veiculo](08-tutorials/10-vehicle-mod.md) | Veiculo personalizado com fisica e config |
| 8.11 | [Criando um Mod de Roupa](08-tutorials/11-clothing-mod.md) | Roupas personalizadas com texturas e slots |
| 8.12 | [Construindo um Sistema de Troca](08-tutorials/12-trading-system.md) | Sistema de comercio entre jogadores/NPCs |
| 8.13 | [Referencia do Diag Menu](08-tutorials/13-diag-menu.md) | Menus de diagnostico para desenvolvimento |

### Referencia Rapida

| Pagina | Descricao |
|--------|-----------|
| [Cheatsheet](cheatsheet.md) | Resumo rapido da sintaxe Enforce Script |
| [Referencia Rapida de API](06-engine-api/quick-reference.md) | Metodos mais usados da API do motor |
| [Glossario](glossary.md) | Definicoes de termos usados no modding DayZ |
| [FAQ](faq.md) | Perguntas frequentes sobre modding |
| [Guia de Solucao de Problemas](troubleshooting.md) | 91 problemas comuns com solucoes |

---

## Creditos

| Desenvolvedor | Projetos | Contribuicoes Principais |
|---------------|----------|--------------------------|
| [**Jacob_Mango**](https://github.com/Jacob-Mango) | Community Framework, COT | Sistema de modulos, RPC, permissoes, ESP |
| [**InclementDab**](https://github.com/InclementDab) | Dabs Framework, DayZ Editor, Mod Template | MVC, ViewBinding, UI do editor |
| [**salutesh**](https://github.com/salutesh) | DayZ Expansion | Mercado, grupo, marcadores de mapa, veiculos |
| [**Arkensor**](https://github.com/Arkensor) | DayZ Expansion | Economia central, versionamento de configs |
| [**DaOne**](https://github.com/Da0ne) | VPP Admin Tools | Gerenciamento de jogadores, webhooks, ESP |
| [**GravityWolf**](https://github.com/GravityWolfNotAmused) | VPP Admin Tools | Permissoes, gerenciamento de servidor |
| [**Brian Orr (DrkDevil)**](https://github.com/DrkDevil) | Colorful UI | Temas de cores, padroes modded class UI |
| [**lothsun**](https://github.com/lothsun) | Colorful UI | Sistemas de cores UI, melhoria visual |
| [**Bohemia Interactive**](https://github.com/BohemiaInteractive) | DayZ Engine & Samples | Enforce Script, scripts vanilla, DayZ Tools |
| [**StarDZ Team**](https://github.com/StarDZ-Team) | Esta Wiki | Documentacao, traducao & organizacao |

## Licenca

A documentacao e licenciada sob [**CC BY-SA 4.0**](https://creativecommons.org/licenses/by-sa/4.0/).
Exemplos de codigo sao licenciados sob [**MIT**](../LICENCE).
