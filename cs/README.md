# DayZ Modding Wiki (Čeština)

[![English](https://flagsapi.com/US/flat/48.png)](../en/README.md) [![Português](https://flagsapi.com/BR/flat/48.png)](../pt/README.md) [![Deutsch](https://flagsapi.com/DE/flat/48.png)](../de/README.md) [![Русский](https://flagsapi.com/RU/flat/48.png)](../ru/README.md) [![Čeština](https://flagsapi.com/CZ/flat/48.png)](../cs/README.md) [![Polski](https://flagsapi.com/PL/flat/48.png)](../pl/README.md) [![Magyar](https://flagsapi.com/HU/flat/48.png)](../hu/README.md) [![Italiano](https://flagsapi.com/IT/flat/48.png)](../it/README.md) [![Español](https://flagsapi.com/ES/flat/48.png)](../es/README.md) [![Français](https://flagsapi.com/FR/flat/48.png)](../fr/README.md) [![日本語](https://flagsapi.com/JP/flat/48.png)](../ja/README.md) [![简体中文](https://flagsapi.com/CN/flat/48.png)](../zh-hans/README.md)

> Kompletní průvodce DayZ moddingem v Enforce Script. DayZ vytvořilo české studio Bohemia Interactive.

---

## Části

### Část 1: Enforce Script
Základy skriptovacího jazyka Enforce Script -- typy, proměnné, třídy, řízení toku programu a další.

| # | Kapitola | Popis |
|---|----------|-------|
| 1.1 | [Proměnné a typy](01-enforce-script/01-variables-types.md) | Primitivní typy, deklarace proměnných, konverze typů |
| 1.2 | [Pole, mapy a množiny](01-enforce-script/02-arrays-maps-sets.md) | Dynamická pole, mapy, množiny a iterace |
| 1.3 | [Třídy a dědičnost](01-enforce-script/03-classes-inheritance.md) | Deklarace tříd, dědičnost, přístupové modifikátory |
| 1.4 | [Modifikované třídy](01-enforce-script/04-modded-classes.md) | Klíč k DayZ moddingu -- `modded class` |
| 1.5 | [Řízení toku programu](01-enforce-script/05-control-flow.md) | if/else, for, while, foreach, switch |
| 1.6 | [Operace s řetězci](01-enforce-script/06-strings.md) | Kompletní reference metod řetězců |
| 1.7 | [Matematika a vektory](01-enforce-script/07-math-vectors.md) | Třída Math, typ vector, 3D operace |
| 1.8 | [Správa paměti](01-enforce-script/08-memory-management.md) | ref, autoptr, surové ukazatele, cykly referencí |
| 1.9 | [Přetypování a reflexe](01-enforce-script/09-casting-reflection.md) | Class.CastTo, Type.Cast, typename, reflexe |
| 1.10 | [Výčty a preprocesor](01-enforce-script/10-enums-preprocessor.md) | Deklarace enum, bitové příznaky, #ifdef |
| 1.11 | [Zpracování chyb](01-enforce-script/11-error-handling.md) | Ochranné klauzule, logování, ErrorEx |
| 1.12 | [Co NEEXISTUJE (Úskalí)](01-enforce-script/12-gotchas.md) | 30 chybějících funkcí a řešení |
| 1.13 | [Functions & Methods](../en/01-enforce-script/13-functions-methods.md) | Funkce a metody (English) 🔄 |

### Část 2: Struktura modu
Jak organizovat soubory, konfigurovat závislosti a strukturovat DayZ mod.

| # | Kapitola | Popis |
|---|----------|-------|
| 2.1 | [Pětivrstvá hierarchie skriptů](02-mod-structure/01-five-layers.md) | 1_Core až 5_Mission -- co kam patří |
| 2.2 | [config.cpp do hloubky](02-mod-structure/02-config-cpp.md) | CfgPatches, CfgMods, skriptové moduly |
| 2.3 | [mod.cpp a Workshop](02-mod-structure/03-mod-cpp.md) | Metadata, launcher, Steam Workshop |
| 2.4 | [Váš první mod](02-mod-structure/04-minimum-viable-mod.md) | Minimální funkční mod od nuly |
| 2.5 | [Organizace souborů](02-mod-structure/05-file-organization.md) | Osvědčené postupy, konvence, antivzory |
| 2.6 | [Server/Client Architecture](../en/02-mod-structure/06-server-client-split.md) | Architektura server/klient (English) 🔄 |

### Část 3: GUI systém
Kompletní průvodce systémem grafického rozhraní DayZ.

| # | Kapitola | Popis |
|---|----------|-------|
| 3.1 | [Typy widgetů](03-gui-system/01-widget-types.md) | Kontejnerové, zobrazovací a interaktivní widgety |
| 3.2 | [Soubory layoutu](03-gui-system/02-layout-files.md) | Formát .layout, atributy, vnořování |
| 3.3 | [Rozměry a umístění](03-gui-system/03-sizing-positioning.md) | Proporcionální vs. pixelové jednotky |
| 3.4 | [Kontejnerové widgety](03-gui-system/04-containers.md) | WrapSpacer, GridSpacer, ScrollWidget |
| 3.5 | [Programové widgety](03-gui-system/05-programmatic-widgets.md) | Vytváření widgetů z kódu |
| 3.6 | [Zpracování událostí](03-gui-system/06-event-handling.md) | Události myši, klávesnice, fokusu |
| 3.7 | [Styly a fonty](03-gui-system/07-styles-fonts.md) | Soubory .styles, fonty, barevné schéma |
| 3.8 | [Dialogs & Modals](../en/03-gui-system/08-dialogs-modals.md) | Dialogy a modální okna (English) 🔄 |
| 3.9 | [Real Mod UI Patterns](../en/03-gui-system/09-real-mod-patterns.md) | Reálné vzory UI z modů (English) 🔄 |
| 3.10 | [Advanced Widgets](../en/03-gui-system/10-advanced-widgets.md) | Pokročilé widgety (English) 🔄 |

### Část 4: Formáty souborů
Formáty souborů používané v DayZ moddingu.

| # | Kapitola | Popis |
|---|----------|-------|
| 4.1 | [Textury](04-file-formats/01-textures.md) | .paa, .edds, konverze textur |
| 4.2 | [Modely](04-file-formats/02-models.md) | .p3d, Object Builder, LODy |
| 4.3 | [Materiály](04-file-formats/03-materials.md) | .rvmat, shadery, vlastnosti materiálů |
| 4.4 | [Zvuky](04-file-formats/04-audio.md) | .ogg, CfgSoundSets, CfgSoundShaders |
| 4.5 | [DayZ Tools](04-file-formats/05-dayz-tools.md) | Addon Builder, Workbench, TexView |
| 4.6 | [Balení PBO](04-file-formats/06-pbo-packing.md) | Tvorba a struktura PBO souborů |
| 4.7 | [Workbench Guide](../en/04-file-formats/07-workbench-guide.md) | Průvodce Workbench (English) 🔄 |

### Část 5: Konfigurační soubory
Datové soubory pro lokalizaci, vstupy a GUI.

| # | Kapitola | Popis |
|---|----------|-------|
| 5.1 | [stringtable.csv](05-config-files/01-stringtable.md) | Lokalizace a překlad textů |
| 5.2 | [Inputs.xml](05-config-files/02-inputs-xml.md) | Vlastní klávesové zkratky |
| 5.3 | [Credits.json](05-config-files/03-credits-json.md) | Soubor s kredity autora |
| 5.4 | [Imagesets](05-config-files/04-imagesets.md) | Spritové atlasy a sady ikon |
| 5.5 | [Server Configuration Files](../en/05-config-files/05-server-configs.md) | Konfigurační soubory serveru (English) 🔄 |
| 5.6 | [Spawning Gear Configuration](../en/05-config-files/06-spawning-gear.md) | Konfigurace výbavy při spawnu (English) 🔄 |

### Část 6: API enginu
Reference klíčových systémů enginu DayZ.

| # | Kapitola | Popis |
|---|----------|-------|
| 6.1 | [Entity systém](06-engine-api/01-entity-system.md) | Hierarchie entit, životní cyklus |
| 6.2 | [Vozidla](06-engine-api/02-vehicles.md) | CarScript, fyzika, palivo |
| 6.3 | [Počasí](06-engine-api/03-weather.md) | Ovládání počasí, deště, mlhy |
| 6.4 | [Kamery](06-engine-api/04-cameras.md) | Systém kamer, FOV, přechody |
| 6.5 | [Postprocessing](06-engine-api/05-ppe.md) | Post-processing efekty |
| 6.6 | [Notifikace](06-engine-api/06-notifications.md) | Systém notifikací hráčům |
| 6.7 | [Časovače](06-engine-api/07-timers.md) | CallLater, Timer, GetCallQueue |
| 6.8 | [Souborové I/O](06-engine-api/08-file-io.md) | Čtení/zápis souborů, JSON |
| 6.9 | [Síťování](06-engine-api/09-networking.md) | RPC, synchronizace, identita |
| 6.10 | [Centrální ekonomika](06-engine-api/10-central-economy.md) | types.xml, spawn systém |
| 6.11 | [Mission Hooks](../en/06-engine-api/11-mission-hooks.md) | Háky misí (English) 🔄 |
| 6.12 | [Action System](../en/06-engine-api/12-action-system.md) | Systém akcí (English) 🔄 |
| 6.13 | [Input System](../en/06-engine-api/13-input-system.md) | Vstupní systém (English) 🔄 |
| 6.14 | [Player System](../en/06-engine-api/14-player-system.md) | Systém hráče (English) 🔄 |
| 6.15 | [Sound System](../en/06-engine-api/15-sound-system.md) | Zvukový systém (English) 🔄 |
| 6.16 | [Crafting System](../en/06-engine-api/16-crafting-system.md) | Systém craftění (English) 🔄 |
| 6.17 | [Construction System](../en/06-engine-api/17-construction-system.md) | Systém stavění (English) 🔄 |
| 6.18 | [Animation System](../en/06-engine-api/18-animation-system.md) | Animační systém (English) 🔄 |
| 6.19 | [Terrain & World Queries](../en/06-engine-api/19-terrain-queries.md) | Terén a dotazy na svět (English) 🔄 |
| 6.20 | [Particle & Effect System](../en/06-engine-api/20-particle-effects.md) | Systém částic a efektů (English) 🔄 |
| 6.21 | [Zombie & AI System](../en/06-engine-api/21-zombie-ai-system.md) | Systém zombie a AI (English) 🔄 |
| 6.22 | [Admin & Server Management](../en/06-engine-api/22-admin-server.md) | Správa serveru a administrace (English) 🔄 |
| | [Rychlá reference](06-engine-api/quick-reference.md) | Jednostránkový přehled API enginu |

### Část 7: Návrhové vzory
Osvědčené vzory pro DayZ modding.

| # | Kapitola | Popis |
|---|----------|-------|
| 7.1 | [Singletony](07-patterns/01-singletons.md) | Vzor singleton, globální přístup |
| 7.2 | [Modulové systémy](07-patterns/02-module-systems.md) | Registrace a životní cyklus modulů |
| 7.3 | [Vzory RPC](07-patterns/03-rpc-patterns.md) | Komunikace klient-server |
| 7.4 | [Persistence konfigurace](07-patterns/04-config-persistence.md) | JSON uložení/načtení, validace |
| 7.5 | [Oprávnění](07-patterns/05-permissions.md) | Hierarchická oprávnění, role |
| 7.6 | [Události](07-patterns/06-events.md) | EventBus, ScriptInvoker, callbacky |
| 7.7 | [Výkon](07-patterns/07-performance.md) | Optimalizace, profilování, nejlepší postupy |

### Část 8: Tutoriály
Praktické průvodce krok za krokem.

| # | Kapitola | Popis |
|---|----------|-------|
| 8.1 | [První mod](08-tutorials/01-first-mod.md) | Hello World mod od nuly |
| 8.2 | [Vlastní předmět](08-tutorials/02-custom-item.md) | Tvorba vlastního předmětu s 3D modelem |
| 8.3 | [Admin panel](08-tutorials/03-admin-panel.md) | Tvorba administrátorského panelu |
| 8.4 | [Chatové příkazy](08-tutorials/04-chat-commands.md) | Systém chatových příkazů |
| 8.5 | [Šablona modu](08-tutorials/05-mod-template.md) | Použití DayZ Mod Template |
| 8.6 | [Debugging & Testing](../en/08-tutorials/06-debugging-testing.md) | Ladění a testování (English) 🔄 |
| 8.7 | [Publishing to Steam Workshop](../en/08-tutorials/07-publishing-workshop.md) | Publikování na Steam Workshop (English) 🔄 |
| 8.8 | [Building a HUD Overlay](../en/08-tutorials/08-hud-overlay.md) | Tvorba HUD overlay (English) 🔄 |
| 8.9 | [Professional Mod Template](../en/08-tutorials/09-professional-template.md) | Profesionální šablona modu (English) 🔄 |
| 8.10 | [Creating a Vehicle Mod](../en/08-tutorials/10-vehicle-mod.md) | Tvorba modu vozidla (English) 🔄 |
| 8.11 | [Creating a Clothing Mod](../en/08-tutorials/11-clothing-mod.md) | Tvorba modu oblečení (English) 🔄 |
| 8.12 | [Building a Trading System](../en/08-tutorials/12-trading-system.md) | Tvorba obchodního systému (English) 🔄 |
| 8.13 | [Diag Menu Reference](../en/08-tutorials/13-diag-menu.md) | Reference diagnostického menu (English) 🔄 |

### Tahák

| Soubor | Popis |
|--------|-------|
| [Tahák Enforce Script](cheatsheet.md) | Jednostránkový rychlý přehled -- typy, metody, vzory |
| [Glossary](../en/glossary.md) | Slovník pojmů (English) 🔄 |
| [FAQ](../en/faq.md) | Často kladené otázky (English) 🔄 |
| [Troubleshooting Guide](../en/troubleshooting.md) | Řešení problémů (English) 🔄 |

---

## Zásluhy

- **Bohemia Interactive** -- DayZ engine a oficiální ukázky
- **Jacob_Mango** -- Community Framework a Community Online Tools
- **InclementDab** -- Dabs Framework a DayZ Editor
- **DaOne & GravityWolf** -- VPP Admin Tools
- **DayZ Expansion Team** -- Expansion Scripts
- **Brian Orr (DrkDevil)** -- Colorful UI, systém barevných témat
- **lothsun** -- Colorful UI, systémy barev UI
- **StarDZ Team** -- Kompilace, překlad a organizace dokumentace

---

## O tomto překladu

Tento wiki překlad z angličtiny do češtiny reflektuje fakt, že DayZ bylo vytvořeno českým studiem **Bohemia Interactive**. Veškerý kód a technické termíny zůstávají v angličtině, protože jsou standardem v programátorské komunitě. Vysvětlující text, komentáře a popisy jsou přeloženy do přirozené češtiny.

**Zdroj:** [Anglická verze](../en/)
