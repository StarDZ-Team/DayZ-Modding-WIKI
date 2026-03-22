# Guia Completo de Modding para DayZ

> A documentacao mais abrangente de modding para DayZ disponivel. Do zero ao mod publicado.

[![English](https://flagsapi.com/US/flat/48.png)](../en/README.md) [![Português](https://flagsapi.com/BR/flat/48.png)](README.md) [![Deutsch](https://flagsapi.com/DE/flat/48.png)](../de/README.md) [![Русский](https://flagsapi.com/RU/flat/48.png)](../ru/README.md) [![Čeština](https://flagsapi.com/CZ/flat/48.png)](../cs/README.md) [![Polski](https://flagsapi.com/PL/flat/48.png)](../pl/README.md) [![Magyar](https://flagsapi.com/HU/flat/48.png)](../hu/README.md) [![Italiano](https://flagsapi.com/IT/flat/48.png)](../it/README.md) [![Español](https://flagsapi.com/ES/flat/48.png)](../es/README.md) [![Français](https://flagsapi.com/FR/flat/48.png)](../fr/README.md) [![日本語](https://flagsapi.com/JP/flat/48.png)](../ja/README.md) [![简体中文](https://flagsapi.com/CN/flat/48.png)](../zh-hans/README.md)

---

## Sumario

### Parte 1: Linguagem Enforce Script
Aprenda a linguagem de script do DayZ desde o basico.

| Capitulo | Topico | Status |
|----------|--------|--------|
| [1.1](../pt/01-enforce-script/01-variables-types.md) | Variaveis & Tipos | ✅ |
| [1.2](../pt/01-enforce-script/02-arrays-maps-sets.md) | Arrays, Maps & Sets | ✅ |
| [1.3](../pt/01-enforce-script/03-classes-inheritance.md) | Classes & Heranca | ✅ |
| [1.4](../pt/01-enforce-script/04-modded-classes.md) | Classes Modded | ✅ |
| [1.5](../pt/01-enforce-script/05-control-flow.md) | Fluxo de Controle | ✅ |
| [1.6](../pt/01-enforce-script/06-strings.md) | Operacoes com Strings | ✅ |
| [1.7](../pt/01-enforce-script/07-math-vectors.md) | Matematica & Vetores | ✅ |
| [1.8](../pt/01-enforce-script/08-memory-management.md) | Gerenciamento de Memoria | ✅ |
| [1.9](../pt/01-enforce-script/09-casting-reflection.md) | Casting & Reflection | ✅ |
| [1.10](../pt/01-enforce-script/10-enums-preprocessor.md) | Enums & Preprocessador | ✅ |
| [1.11](../pt/01-enforce-script/11-error-handling.md) | Tratamento de Erros | ✅ |
| [1.12](../pt/01-enforce-script/12-gotchas.md) | O Que NAO Existe | ✅ |
| [1.13](../en/01-enforce-script/13-functions-methods.md) | Functions & Methods (English) | 🔄 |

### Parte 2: Estrutura de Mod
Entenda como mods de DayZ sao organizados.

| Capitulo | Topico | Status |
|----------|--------|--------|
| [2.1](../pt/02-mod-structure/01-five-layers.md) | Hierarquia de 5 Camadas de Script | ✅ |
| [2.2](../pt/02-mod-structure/02-config-cpp.md) | config.cpp em Profundidade | ✅ |
| [2.3](../pt/02-mod-structure/03-mod-cpp.md) | mod.cpp & Workshop | ✅ |
| [2.4](../pt/02-mod-structure/04-minimum-viable-mod.md) | Seu Primeiro Mod | ✅ |
| [2.5](../pt/02-mod-structure/05-file-organization.md) | Organizacao de Arquivos | ✅ |
| [2.6](../en/02-mod-structure/06-server-client-split.md) | Server/Client Architecture (English) | 🔄 |

### Parte 3: Sistema GUI & Layout
Construa interfaces de usuario para DayZ.

| Capitulo | Topico | Status |
|----------|--------|--------|
| [3.1](../pt/03-gui-system/01-widget-types.md) | Tipos de Widget | ✅ |
| [3.2](../pt/03-gui-system/02-layout-files.md) | Formato de Arquivo Layout | ✅ |
| [3.3](../pt/03-gui-system/03-sizing-positioning.md) | Dimensionamento & Posicionamento | ✅ |
| [3.4](../pt/03-gui-system/04-containers.md) | Widgets Container | ✅ |
| [3.5](../pt/03-gui-system/05-programmatic-widgets.md) | Criacao Programatica | ✅ |
| [3.6](../pt/03-gui-system/06-event-handling.md) | Tratamento de Eventos | ✅ |
| [3.7](../pt/03-gui-system/07-styles-fonts.md) | Estilos, Fontes & Imagens | ✅ |
| [3.8](../en/03-gui-system/08-dialogs-modals.md) | Dialogs & Modals (English) | 🔄 |
| [3.9](../en/03-gui-system/09-real-mod-patterns.md) | Real Mod UI Patterns (English) | 🔄 |
| [3.10](../en/03-gui-system/10-advanced-widgets.md) | Advanced Widgets (English) | 🔄 |

### Parte 4: Formatos de Arquivo & Ferramentas
Trabalhando com o pipeline de assets do DayZ.

| Capitulo | Topico | Status |
|----------|--------|--------|
| [4.1](../pt/04-file-formats/01-textures.md) | Texturas (.paa, .edds, .tga) | ✅ |
| [4.2](../pt/04-file-formats/02-models.md) | Modelos 3D (.p3d) | ✅ |
| [4.3](../pt/04-file-formats/03-materials.md) | Materiais (.rvmat) | ✅ |
| [4.4](../pt/04-file-formats/04-audio.md) | Audio (.ogg, .wss) | ✅ |
| [4.5](../pt/04-file-formats/05-dayz-tools.md) | Fluxo de Trabalho DayZ Tools | ✅ |
| [4.6](../pt/04-file-formats/06-pbo-packing.md) | Empacotamento PBO | ✅ |
| [4.7](../en/04-file-formats/07-workbench-guide.md) | Workbench Guide (English) | 🔄 |

### Parte 5: Arquivos de Configuracao
Arquivos de configuracao essenciais para todo mod.

| Capitulo | Topico | Status |
|----------|--------|--------|
| [5.1](../pt/05-config-files/01-stringtable.md) | stringtable.csv (13 Idiomas) | ✅ |
| [5.2](../pt/05-config-files/02-inputs-xml.md) | Inputs.xml (Keybindings) | ✅ |
| [5.3](../pt/05-config-files/03-credits-json.md) | Credits.json | ✅ |
| [5.4](../pt/05-config-files/04-imagesets.md) | Formato ImageSet | ✅ |
| [5.5](../en/05-config-files/05-server-configs.md) | Server Configuration Files (English) | 🔄 |
| [5.6](../en/05-config-files/06-spawning-gear.md) | Spawning Gear Configuration (English) | 🔄 |

### Parte 6: Referencia da API do Motor
APIs do motor DayZ para desenvolvedores de mods.

| Capitulo | Topico | Status |
|----------|--------|--------|
| [6.1](../pt/06-engine-api/01-entity-system.md) | Sistema de Entidades | ✅ |
| [6.2](../pt/06-engine-api/02-vehicles.md) | Sistema de Veiculos | ✅ |
| [6.3](../pt/06-engine-api/03-weather.md) | Sistema de Clima | ✅ |
| [6.4](../pt/06-engine-api/04-cameras.md) | Sistema de Cameras | ✅ |
| [6.5](../pt/06-engine-api/05-ppe.md) | Efeitos de Pos-Processamento | ✅ |
| [6.6](../pt/06-engine-api/06-notifications.md) | Sistema de Notificacoes | ✅ |
| [6.7](../pt/06-engine-api/07-timers.md) | Timers & CallQueue | ✅ |
| [6.8](../pt/06-engine-api/08-file-io.md) | File I/O & JSON | ✅ |
| [6.9](../pt/06-engine-api/09-networking.md) | Networking & RPC | ✅ |
| [6.10](../pt/06-engine-api/10-central-economy.md) | Economia Central | ✅ |
| [6.11](../en/06-engine-api/11-mission-hooks.md) | Mission Hooks (English) | 🔄 |
| [6.12](../en/06-engine-api/12-action-system.md) | Action System (English) | 🔄 |
| [6.13](../en/06-engine-api/13-input-system.md) | Input System (English) | 🔄 |
| [6.14](../en/06-engine-api/14-player-system.md) | Player System (English) | 🔄 |
| [6.15](../en/06-engine-api/15-sound-system.md) | Sound System (English) | 🔄 |
| [6.16](../en/06-engine-api/16-crafting-system.md) | Crafting System (English) | 🔄 |
| [6.17](../en/06-engine-api/17-construction-system.md) | Construction System (English) | 🔄 |
| [6.18](../en/06-engine-api/18-animation-system.md) | Animation System (English) | 🔄 |
| [6.19](../en/06-engine-api/19-terrain-queries.md) | Terrain & World Queries (English) | 🔄 |
| [6.20](../en/06-engine-api/20-particle-effects.md) | Particle & Effect System (English) | 🔄 |
| [6.21](../en/06-engine-api/21-zombie-ai-system.md) | Zombie & AI System (English) | 🔄 |
| [6.22](../en/06-engine-api/22-admin-server.md) | Admin & Server Management (English) | 🔄 |

### Parte 7: Padroes & Boas Praticas
Padroes testados em batalha de mods profissionais.

| Capitulo | Topico | Status |
|----------|--------|--------|
| [7.1](../pt/07-patterns/01-singletons.md) | Padrao Singleton | ✅ |
| [7.2](../pt/07-patterns/02-module-systems.md) | Sistemas de Modulo/Plugin | ✅ |
| [7.3](../pt/07-patterns/03-rpc-patterns.md) | Comunicacao RPC | ✅ |
| [7.4](../pt/07-patterns/04-config-persistence.md) | Persistencia de Config | ✅ |
| [7.5](../pt/07-patterns/05-permissions.md) | Sistemas de Permissao | ✅ |
| [7.6](../pt/07-patterns/06-events.md) | Arquitetura Orientada a Eventos | ✅ |
| [7.7](../pt/07-patterns/07-performance.md) | Otimizacao de Desempenho | ✅ |

### Parte 8: Tutoriais
Guias passo a passo.

| Capitulo | Topico | Status |
|----------|--------|--------|
| [8.1](../pt/08-tutorials/01-first-mod.md) | Seu Primeiro Mod (Hello World) | ✅ |
| [8.2](../pt/08-tutorials/02-custom-item.md) | Criando um Item Personalizado | ✅ |
| [8.3](../pt/08-tutorials/03-admin-panel.md) | Construindo um Painel Admin | ✅ |
| [8.4](../pt/08-tutorials/04-chat-commands.md) | Adicionando Comandos de Chat | ✅ |
| [8.5](../en/08-tutorials/05-mod-template.md) | Using the DayZ Mod Template (English) | 🔄 |
| [8.6](../en/08-tutorials/06-debugging-testing.md) | Debugging & Testing (English) | 🔄 |
| [8.7](../en/08-tutorials/07-publishing-workshop.md) | Publishing to Steam Workshop (English) | 🔄 |
| [8.8](../en/08-tutorials/08-hud-overlay.md) | Building a HUD Overlay (English) | 🔄 |
| [8.9](../en/08-tutorials/09-professional-template.md) | Professional Mod Template (English) | 🔄 |
| [8.10](../en/08-tutorials/10-vehicle-mod.md) | Creating a Vehicle Mod (English) | 🔄 |
| [8.11](../en/08-tutorials/11-clothing-mod.md) | Creating a Clothing Mod (English) | 🔄 |
| [8.12](../en/08-tutorials/12-trading-system.md) | Building a Trading System (English) | 🔄 |
| [8.13](../en/08-tutorials/13-diag-menu.md) | Diag Menu Reference (English) | 🔄 |

---

## Idiomas Suportados

| Idioma | Codigo | Status |
|--------|--------|--------|
| English | `en` | ✅ Principal |
| Portugues | `pt` | ✅ Traduzido |
| Deutsch | `de` | Planejado |
| Russki | `ru` | Planejado |
| Cestina | `cs` | Planejado |
| Polski | `pl` | Planejado |
| Magyar | `hu` | Planejado |
| Italiano | `it` | Planejado |
| Espanol | `es` | Planejado |
| Francais | `fr` | Planejado |
| Nihongo | `ja` | Planejado |
| Jiantizi Zhongwen | `zh-hans` | Planejado |

---

## Referencia Rapida

- [Cheat Sheet do Enforce Script](../pt/cheatsheet.md)
- [Referencia de Tipos de Widget](../pt/03-gui-system/01-widget-types.md)
- [Referencia Rapida da API](../pt/06-engine-api/quick-reference.md)
- [Armadilhas Comuns](../pt/01-enforce-script/12-gotchas.md)
- [Glossary (English)](../en/glossary.md) 🔄
- [FAQ (English)](../en/faq.md) 🔄
- [Troubleshooting Guide (English)](../en/troubleshooting.md) 🔄

---

## Contribuindo

Esta documentacao foi compilada a partir do estudo de:
- 10+ mods profissionais de DayZ (COT, VPP, Expansion, Dabs Framework, DayZ Editor, Colorful UI)
- 15 mods oficiais de exemplo da Bohemia Interactive
- 2.800+ arquivos de script vanilla do DayZ
- Codigo-fonte do Community Framework

Pull requests sao bem-vindos! Veja [CONTRIBUTING.md](../CONTRIBUTING.md) para diretrizes.

---

## Creditos

- **Bohemia Interactive** -- Motor do DayZ & exemplos oficiais
- **Jacob_Mango** -- Community Framework & Community Online Tools
- **InclementDab** -- Dabs Framework & DayZ Editor
- **DaOne & GravityWolf** -- VPP Admin Tools
- **DayZ Expansion Team** -- Expansion Scripts
- **Brian Orr (DrkDevil)** -- Colorful UI, sistema de temas de cores
- **lothsun** -- Colorful UI, sistemas de cores de UI
- **StarDZ Team** -- Compilacao, traducao & organizacao da documentacao

## Licenca

Esta documentacao e licenciada sob [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
Exemplos de codigo sao licenciados sob [MIT](https://opensource.org/licenses/MIT).
