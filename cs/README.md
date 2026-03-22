# Kompletni pruvodce moddingem DayZ

> Komplexni dokumentace moddingu DayZ — 92 kapitol, od nuly po publikovany mod.

<p align="center">
  <a href="../en/README.md"><img src="https://flagsapi.com/US/flat/48.png" alt="English" /></a>
  <a href="../pt/README.md"><img src="https://flagsapi.com/BR/flat/48.png" alt="Portugues" /></a>
  <a href="../de/README.md"><img src="https://flagsapi.com/DE/flat/48.png" alt="Deutsch" /></a>
  <a href="../ru/README.md"><img src="https://flagsapi.com/RU/flat/48.png" alt="Russki" /></a>
  <a href="../es/README.md"><img src="https://flagsapi.com/ES/flat/48.png" alt="Espanol" /></a>
  <a href="../fr/README.md"><img src="https://flagsapi.com/FR/flat/48.png" alt="Francais" /></a>
  <a href="../ja/README.md"><img src="https://flagsapi.com/JP/flat/48.png" alt="Nihongo" /></a>
  <a href="../zh-hans/README.md"><img src="https://flagsapi.com/CN/flat/48.png" alt="Jiantizi Zhongwen" /></a>
  <a href="README.md"><img src="https://flagsapi.com/CZ/flat/48.png" alt="Cestina" /></a>
  <a href="../pl/README.md"><img src="https://flagsapi.com/PL/flat/48.png" alt="Polski" /></a>
  <a href="../hu/README.md"><img src="https://flagsapi.com/HU/flat/48.png" alt="Magyar" /></a>
  <a href="../it/README.md"><img src="https://flagsapi.com/IT/flat/48.png" alt="Italiano" /></a>
</p>

---

## Kompletni rejstrik stranek

### Cast 1: Jazyk Enforce Script (13 kapitol)

| # | Kapitola | Popis |
|---|----------|-------|
| 1.1 | [Promenne a typy](01-enforce-script/01-variables-types.md) | Primitivni typy, deklarace promennych, konverze a vychozi hodnoty |
| 1.2 | [Pole, mapy a mnoziny](01-enforce-script/02-arrays-maps-sets.md) | Datove kolekce: array, map, set — iterace, vyhledavani, razeni |
| 1.3 | [Tridy a dedicnost](01-enforce-script/03-classes-inheritance.md) | Definice trid, dedicnost, konstruktory, polymorfismus |
| 1.4 | [Modded tridy](01-enforce-script/04-modded-classes.md) | System modded class, prepis metod, volani super |
| 1.5 | [Rizeni toku](01-enforce-script/05-control-flow.md) | If/else, switch, smycky while/for, break, continue |
| 1.6 | [Operace s retezci](01-enforce-script/06-strings.md) | Manipulace s retezci, formatovani, vyhledavani, porovnani |
| 1.7 | [Matematika a vektory](01-enforce-script/07-math-vectors.md) | Matematicke funkce, 3D vektory, vzdalenosti, smery |
| 1.8 | [Sprava pameti](01-enforce-script/08-memory-management.md) | Pocitani referenci, ref, prevence uniku, cykly referenci |
| 1.9 | [Pretypovani a reflexe](01-enforce-script/09-casting-reflection.md) | Pretypovani, Class.CastTo, kontrola typu za behu |
| 1.10 | [Enumerace a preprocesor](01-enforce-script/10-enums-preprocessor.md) | Vycty, #ifdef, #define, podminkova kompilace |
| 1.11 | [Zpracovani chyb](01-enforce-script/11-error-handling.md) | Vzory zpracovani chyb bez try/catch, guard clauses |
| 1.12 | [Co NEEXISTUJE](01-enforce-script/12-gotchas.md) | 30+ nastrah a omezeni jazyka Enforce Script |
| 1.13 | [Funkce a metody](01-enforce-script/13-functions-methods.md) | Deklarace funkci, parametry, navratove hodnoty, static, proto |

### Cast 2: Struktura modu (6 kapitol)

| # | Kapitola | Popis |
|---|----------|-------|
| 2.1 | [5-vrstva hierarchie](02-mod-structure/01-five-layers.md) | 5 vrstev skriptu DayZ a poradi kompilace |
| 2.2 | [config.cpp podrobne](02-mod-structure/02-config-cpp.md) | Kompletni struktura config.cpp, CfgPatches, CfgMods |
| 2.3 | [mod.cpp a Workshop](02-mod-structure/03-mod-cpp.md) | Soubor mod.cpp, publikovani na Steam Workshop |
| 2.4 | [Vas prvni mod](02-mod-structure/04-minimum-viable-mod.md) | Minimalni funkcni mod — zakladni soubory a struktura |
| 2.5 | [Organizace souboru](02-mod-structure/05-file-organization.md) | Konvence pojmenovani, doporucena struktura slozek |
| 2.6 | [Architektura server/klient](02-mod-structure/06-server-client-split.md) | Oddeleni serveroveho a klientskeho kodu, bezpecnost |

### Cast 3: System GUI a rozlozeni (10 kapitol)

| # | Kapitola | Popis |
|---|----------|-------|
| 3.1 | [Typy widgetu](03-gui-system/01-widget-types.md) | Vsechny dostupne typy widgetu: text, obrazek, tlacitko atd. |
| 3.2 | [Format souboru layout](03-gui-system/02-layout-files.md) | Struktura XML souboru .layout pro rozhrani |
| 3.3 | [Dimenzovani a pozicovani](03-gui-system/03-sizing-positioning.md) | System souradnic, flagy velikosti, ukotveni |
| 3.4 | [Kontejnery](03-gui-system/04-containers.md) | Kontejnerove widgety: WrapSpacer, GridSpacer, ScrollWidget |
| 3.5 | [Programaticka tvorba](03-gui-system/05-programmatic-widgets.md) | Vytvareni widgetu kodem, GetWidgetUnderCursor, SetHandler |
| 3.6 | [Zpracovani udalosti](03-gui-system/06-event-handling.md) | UI callbacky: OnClick, OnChange, OnMouseEnter |
| 3.7 | [Styly, fonty a obrazky](03-gui-system/07-styles-fonts.md) | Dostupne fonty, styly, nacitani obrazku |
| 3.8 | [Dialogy a modalni okna](03-gui-system/08-dialogs-modals.md) | Tvorba dialogu, modalni nabidky, potvrzeni |
| 3.9 | [Realne UI vzory](03-gui-system/09-real-mod-patterns.md) | UI vzory z COT, VPP, Expansion, Dabs Framework |
| 3.10 | [Pokrocile widgety](03-gui-system/10-advanced-widgets.md) | MapWidget, RenderTargetWidget, specializovane widgety |

### Cast 4: Formaty souboru a nastroje (8 kapitol)

| # | Kapitola | Popis |
|---|----------|-------|
| 4.1 | [Textury](04-file-formats/01-textures.md) | Formaty .paa, .edds, .tga — konverze a pouziti |
| 4.2 | [3D modely](04-file-formats/02-models.md) | Format .p3d, LODy, geometrie, memory pointy |
| 4.3 | [Materialy](04-file-formats/03-materials.md) | Soubory .rvmat, shadery, vlastnosti povrchu |
| 4.4 | [Zvuk](04-file-formats/04-audio.md) | Formaty .ogg a .wss, konfigurace zvuku |
| 4.5 | [DayZ Tools](04-file-formats/05-dayz-tools.md) | Pracovni postup s oficialnimi DayZ Tools |
| 4.6 | [Baleni PBO](04-file-formats/06-pbo-packing.md) | Tvorba a extrakce souboru PBO |
| 4.7 | [Pruvodce Workbench](04-file-formats/07-workbench-guide.md) | Pouziti Workbench pro upravu skriptu a assetu |
| 4.8 | [Modelovani budov](04-file-formats/08-building-modeling.md) | Modelovani budov s dvermi a zebriky |

### Cast 5: Konfiguracni soubory (6 kapitol)

| # | Kapitola | Popis |
|---|----------|-------|
| 5.1 | [stringtable.csv](05-config-files/01-stringtable.md) | Lokalizace pomoci stringtable.csv pro 13 jazyku |
| 5.2 | [inputs.xml](05-config-files/02-inputs-xml.md) | Nastaveni klaves a vlastni klávesové zkratky |
| 5.3 | [credits.json](05-config-files/03-credits-json.md) | Soubor titulku modu |
| 5.4 | [ImageSets](05-config-files/04-imagesets.md) | Format ImageSet pro ikony a sprity |
| 5.5 | [Konfigurace serveru](05-config-files/05-server-configs.md) | Konfiguracni soubory serveru DayZ |
| 5.6 | [Konfigurace spawnu](05-config-files/06-spawning-gear.md) | Nastaveni pocatecniho vybaveni a bodu spawnu |

### Cast 6: Reference API enginu (23 kapitol)

| # | Kapitola | Popis |
|---|----------|-------|
| 6.1 | [System entit](06-engine-api/01-entity-system.md) | Hierarchie entit, EntityAI, ItemBase, Object |
| 6.2 | [System vozidel](06-engine-api/02-vehicles.md) | API vozidel, motory, kapaliny, fyzikalni simulace |
| 6.3 | [System pocasi](06-engine-api/03-weather.md) | Ovladani pocasi, dest, mlha, oblacnost |
| 6.4 | [System kamer](06-engine-api/04-cameras.md) | Vlastni kamery, pozice, rotace, prechody |
| 6.5 | [Post-processing efekty](06-engine-api/05-ppe.md) | PPE: rozmazani, chromaticka aberace, barevna korekce |
| 6.6 | [System oznameni](06-engine-api/06-notifications.md) | Oznameni na obrazovce, zpravy hracum |
| 6.7 | [Casovace a CallQueue](06-engine-api/07-timers.md) | Casovace, odlozena volani, opakovani |
| 6.8 | [Soubory I/O a JSON](06-engine-api/08-file-io.md) | Cteni/zapis souboru, parsovani JSON |
| 6.9 | [Sitovani a RPC](06-engine-api/09-networking.md) | Sitova komunikace, RPC, synchronizace klient-server |
| 6.10 | [Centralni ekonomika](06-engine-api/10-central-economy.md) | System lootu, kategorie, flagy, min/max |
| 6.11 | [Hooky misi](06-engine-api/11-mission-hooks.md) | Hooky misi, MissionBase, MissionServer |
| 6.12 | [System akci](06-engine-api/12-action-system.md) | Akce hrace, ActionBase, cile, podminky |
| 6.13 | [System vstupu](06-engine-api/13-input-system.md) | Zachyceni klaves, mapovani, UAInput |
| 6.14 | [System hrace](06-engine-api/14-player-system.md) | PlayerBase, inventar, zdravi, stamina, statistiky |
| 6.15 | [Zvukovy system](06-engine-api/15-sound-system.md) | Prehravani zvuku, SoundOnVehicle, prostredí |
| 6.16 | [System crafteni](06-engine-api/16-crafting-system.md) | Recepty crafteni, ingredience, vysledky |
| 6.17 | [System staveni](06-engine-api/17-construction-system.md) | Stavba zakladny, stavebni dily, stavy |
| 6.18 | [System animaci](06-engine-api/18-animation-system.md) | Animace hrace, command ID, callbacky |
| 6.19 | [Dotazy na teren](06-engine-api/19-terrain-queries.md) | Raycasty, pozice na terenu, povrchy |
| 6.20 | [Casticove efekty](06-engine-api/20-particle-effects.md) | System castic, emitery, vizualni efekty |
| 6.21 | [System zombie a AI](06-engine-api/21-zombie-ai-system.md) | ZombieBase, AI infikovanych, chovani |
| 6.22 | [Admin a server](06-engine-api/22-admin-server.md) | Sprava serveru, bany, kicky, RCON |
| 6.23 | [Svetove systemy](06-engine-api/23-world-systems.md) | Denni doba, datum, funkce sveta |

### Cast 7: Vzory a osvedcene postupy (7 kapitol)

| # | Kapitola | Popis |
|---|----------|-------|
| 7.1 | [Vzor Singleton](07-patterns/01-singletons.md) | Jedine instance, globalni pristup, inicializace |
| 7.2 | [Systemy modulu](07-patterns/02-module-systems.md) | Registrace modulu, zivotni cyklus, CF moduly |
| 7.3 | [RPC komunikace](07-patterns/03-rpc-patterns.md) | Vzory pro bezpecne a efektivni RPC |
| 7.4 | [Perzistence konfigurace](07-patterns/04-config-persistence.md) | Ukladani/nacitani JSON konfiguraci, verzovani |
| 7.5 | [Systemy opravneni](07-patterns/05-permissions.md) | Hierarchicka opravneni, wildcards, skupiny |
| 7.6 | [Udalostmi rizena architektura](07-patterns/06-events.md) | Event bus, publish/subscribe, oddeleni |
| 7.7 | [Optimalizace vykonu](07-patterns/07-performance.md) | Profilovani, cache, pooling, redukce RPC |

### Cast 8: Tutorialy (13 kapitol)

| # | Kapitola | Popis |
|---|----------|-------|
| 8.1 | [Vas prvni mod (Hello World)](08-tutorials/01-first-mod.md) | Krok za krokem: vytvorte a nacte mod |
| 8.2 | [Vytvoreni vlastniho predmetu](08-tutorials/02-custom-item.md) | Vytvorte predmet s modelem, texturou a konfiguraci |
| 8.3 | [Stavba admin panelu](08-tutorials/03-admin-panel.md) | Admin UI s teleportem, spawnem, spravou |
| 8.4 | [Pridani chatovych prikazu](08-tutorials/04-chat-commands.md) | Vlastni prikazy v hernim chatu |
| 8.5 | [Pouziti sablony modu](08-tutorials/05-mod-template.md) | Jak pouzit oficialni sablonu modu DayZ |
| 8.6 | [Ladeni a testovani](08-tutorials/06-debugging-testing.md) | Logy, ladeni, diagnosticke nastroje |
| 8.7 | [Publikovani na Workshop](08-tutorials/07-publishing-workshop.md) | Publikujte svuj mod na Steam Workshop |
| 8.8 | [Stavba HUD overlayu](08-tutorials/08-hud-overlay.md) | Vlastni HUD overlay pres hru |
| 8.9 | [Profesionalni sablona modu](08-tutorials/09-professional-template.md) | Kompletni sablona pripravena pro produkci |
| 8.10 | [Vytvoreni modu vozidla](08-tutorials/10-vehicle-mod.md) | Vlastni vozidlo s fyzikou a konfiguraci |
| 8.11 | [Vytvoreni modu obleceni](08-tutorials/11-clothing-mod.md) | Vlastni obleceni s texturami a sloty |
| 8.12 | [Stavba obchodniho systemu](08-tutorials/12-trading-system.md) | System obchodovani mezi hraci/NPC |
| 8.13 | [Reference Diag Menu](08-tutorials/13-diag-menu.md) | Diagnosticke nabidky pro vyvoj |

### Rychla reference

| Stranka | Popis |
|---------|-------|
| [Cheatsheet](cheatsheet.md) | Rychly prehled syntaxe Enforce Script |
| [Rychla reference API](06-engine-api/quick-reference.md) | Nejpouzivanejsi metody API enginu |
| [Glosar](glossary.md) | Definice pojmu pouzivanych v moddingu DayZ |
| [FAQ](faq.md) | Casto kladene otazky o moddingu |
| [Pruvodce resenim problemu](troubleshooting.md) | 91 beznych problemu s resenimi |

---

## Autori

| Vyvojar | Projekty | Hlavni prispevky |
|---------|----------|------------------|
| [**Jacob_Mango**](https://github.com/Jacob-Mango) | Community Framework, COT | System modulu, RPC, opravneni, ESP |
| [**InclementDab**](https://github.com/InclementDab) | Dabs Framework, DayZ Editor, Mod Template | MVC, ViewBinding, UI editoru |
| [**salutesh**](https://github.com/salutesh) | DayZ Expansion | Trh, skupiny, znacky na mape, vozidla |
| [**Arkensor**](https://github.com/Arkensor) | DayZ Expansion | Centralni ekonomika, verzovani nastaveni |
| [**DaOne**](https://github.com/Da0ne) | VPP Admin Tools | Sprava hracu, webhooky, ESP |
| [**GravityWolf**](https://github.com/GravityWolfNotAmused) | VPP Admin Tools | Opravneni, sprava serveru |
| [**Brian Orr (DrkDevil)**](https://github.com/DrkDevil) | Colorful UI | Barevne motivy, vzory modded class UI |
| [**lothsun**](https://github.com/lothsun) | Colorful UI | UI barevne systemy, vizualni vylepseni |
| [**Bohemia Interactive**](https://github.com/BohemiaInteractive) | DayZ Engine & Samples | Enforce Script, vanilla skripty, DayZ Tools |
| [**StarDZ Team**](https://github.com/StarDZ-Team) | Tato wiki | Dokumentace, preklad a organizace |

## Licence

Dokumentace je licencovana pod [**CC BY-SA 4.0**](https://creativecommons.org/licenses/by-sa/4.0/).
Priklady kodu jsou licencovany pod [**MIT**](../LICENCE).
