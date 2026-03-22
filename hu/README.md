# DayZ Modding Teljes Utmutato

> Atfogo DayZ modding dokumentacio — 92 fejezet, a nullarol a publikalt modig.

<p align="center">
  <a href="../en/README.md"><img src="https://flagsapi.com/US/flat/48.png" alt="English" /></a>
  <a href="../pt/README.md"><img src="https://flagsapi.com/BR/flat/48.png" alt="Portugues" /></a>
  <a href="../de/README.md"><img src="https://flagsapi.com/DE/flat/48.png" alt="Deutsch" /></a>
  <a href="../ru/README.md"><img src="https://flagsapi.com/RU/flat/48.png" alt="Russki" /></a>
  <a href="../es/README.md"><img src="https://flagsapi.com/ES/flat/48.png" alt="Espanol" /></a>
  <a href="../fr/README.md"><img src="https://flagsapi.com/FR/flat/48.png" alt="Francais" /></a>
  <a href="../ja/README.md"><img src="https://flagsapi.com/JP/flat/48.png" alt="Nihongo" /></a>
  <a href="../zh-hans/README.md"><img src="https://flagsapi.com/CN/flat/48.png" alt="Jiantizi Zhongwen" /></a>
  <a href="../cs/README.md"><img src="https://flagsapi.com/CZ/flat/48.png" alt="Cestina" /></a>
  <a href="../pl/README.md"><img src="https://flagsapi.com/PL/flat/48.png" alt="Polski" /></a>
  <a href="README.md"><img src="https://flagsapi.com/HU/flat/48.png" alt="Magyar" /></a>
  <a href="../it/README.md"><img src="https://flagsapi.com/IT/flat/48.png" alt="Italiano" /></a>
</p>

---

## Teljes oldalmutato

### 1. resz: Enforce Script nyelv (13 fejezet)

| # | Fejezet | Leiras |
|---|---------|--------|
| 1.1 | [Valtozok es tipusok](01-enforce-script/01-variables-types.md) | Primitiv tipusok, valtozodeklalacio, konverziok es alapertekek |
| 1.2 | [Tombok, map-ek es halmazok](01-enforce-script/02-arrays-maps-sets.md) | Adatgyujtemenyek: array, map, set — iteracio, kereses, rendezes |
| 1.3 | [Osztalyok es oroklodes](01-enforce-script/03-classes-inheritance.md) | Osztalydefinicio, oroklodes, konstruktorok, polimorfizmus |
| 1.4 | [Modded osztalyok](01-enforce-script/04-modded-classes.md) | Modded class rendszer, metodusfeluliras, super hivasok |
| 1.5 | [Vezerles](01-enforce-script/05-control-flow.md) | If/else, switch, while/for ciklusok, break, continue |
| 1.6 | [Szovegmuveletek](01-enforce-script/06-strings.md) | Szovegmanipulacio, formatazas, kereses, osszehasonlitas |
| 1.7 | [Matematika es vektorok](01-enforce-script/07-math-vectors.md) | Matematikai fuggvenyek, 3D vektorok, tavolsagok, iranyok |
| 1.8 | [Memoriakezelés](01-enforce-script/08-memory-management.md) | Referenciaszamlalo, ref, memoriaszervaszes megelozese, referenciaciklusok |
| 1.9 | [Tipuskonverzio es reflexio](01-enforce-script/09-casting-reflection.md) | Tipuskonverzio, Class.CastTo, futasidju tipusellenorzes |
| 1.10 | [Felsorolasok es elofordito](01-enforce-script/10-enums-preprocessor.md) | Enumok, #ifdef, #define, felteteles forditas |
| 1.11 | [Hibakezelés](01-enforce-script/11-error-handling.md) | Hibakezelesi mintak try/catch nelkul, guard clauses |
| 1.12 | [Ami NEM letezik](01-enforce-script/12-gotchas.md) | 30+ buktato es korlatozas az Enforce Script nyelvben |
| 1.13 | [Fuggvenyek es metodusok](01-enforce-script/13-functions-methods.md) | Fuggvenydeklalacio, parameterek, visszateresi ertekek, static, proto |

### 2. resz: Mod struktura (6 fejezet)

| # | Fejezet | Leiras |
|---|---------|--------|
| 2.1 | [Az 5 retegu hierarchia](02-mod-structure/01-five-layers.md) | A DayZ 5 script retege es a forditas sorrendje |
| 2.2 | [config.cpp reszletesen](02-mod-structure/02-config-cpp.md) | Teljes config.cpp struktura, CfgPatches, CfgMods |
| 2.3 | [mod.cpp es Workshop](02-mod-structure/03-mod-cpp.md) | mod.cpp fajl, publikalas a Steam Workshop-on |
| 2.4 | [Elso mod](02-mod-structure/04-minimum-viable-mod.md) | Minimalis mukodokepes mod — alapveto fajlok es struktura |
| 2.5 | [Fajlszervezes](02-mod-structure/05-file-organization.md) | Elnevezesi konvenciok, ajanlott mappastruktura |
| 2.6 | [Szerver/kliens architektura](02-mod-structure/06-server-client-split.md) | Szerver- es klienskod szetvalasztasa, biztonsag |

### 3. resz: GUI es elrendezes rendszer (10 fejezet)

| # | Fejezet | Leiras |
|---|---------|--------|
| 3.1 | [Widget tipusok](03-gui-system/01-widget-types.md) | Minden elerheto widget tipus: szoveg, kep, gomb stb. |
| 3.2 | [Layout fajlformatum](03-gui-system/02-layout-files.md) | .layout XML fajlok strukturaja feluletek szamara |
| 3.3 | [Meretezés es pozicionalas](03-gui-system/03-sizing-positioning.md) | Koordinatarendszer, meret flag-ek, horgonyzas |
| 3.4 | [Kontenerek](03-gui-system/04-containers.md) | Kontener widgetek: WrapSpacer, GridSpacer, ScrollWidget |
| 3.5 | [Programozott letrehozas](03-gui-system/05-programmatic-widgets.md) | Widget-ek letrehozasa kodbol, GetWidgetUnderCursor, SetHandler |
| 3.6 | [Esemenykezelés](03-gui-system/06-event-handling.md) | UI callback-ek: OnClick, OnChange, OnMouseEnter |
| 3.7 | [Stilusok, betutipusok es kepek](03-gui-system/07-styles-fonts.md) | Elerheto betutipusok, stilusok, kepek betoltese |
| 3.8 | [Dialogusok es modalis ablakok](03-gui-system/08-dialogs-modals.md) | Dialogusok letrehozasa, modalis menuk, visszaigzalas |
| 3.9 | [Valos mod UI mintak](03-gui-system/09-real-mod-patterns.md) | UI mintak a COT, VPP, Expansion, Dabs Framework modokbol |
| 3.10 | [Halado widgetek](03-gui-system/10-advanced-widgets.md) | MapWidget, RenderTargetWidget, specializalt widgetek |

### 4. resz: Fajlformatumok es eszkozok (8 fejezet)

| # | Fejezet | Leiras |
|---|---------|--------|
| 4.1 | [Texturak](04-file-formats/01-textures.md) | .paa, .edds, .tga formatumok — konverzio es hasznalat |
| 4.2 | [3D modellek](04-file-formats/02-models.md) | .p3d formatum, LOD-ok, geometria, memory pontok |
| 4.3 | [Materialok](04-file-formats/03-materials.md) | .rvmat fajlok, shaderek, feluleti tulajdonsagok |
| 4.4 | [Hang](04-file-formats/04-audio.md) | .ogg es .wss formatumok, hangkonfigurcio |
| 4.5 | [DayZ Tools](04-file-formats/05-dayz-tools.md) | Munkafolyamat a hivatalos DayZ Tools-szal |
| 4.6 | [PBO csomagolas](04-file-formats/06-pbo-packing.md) | PBO fajlok letrehozasa es kicsomagolasa |
| 4.7 | [Workbench utmutato](04-file-formats/07-workbench-guide.md) | A Workbench hasznalata script- es asset-szerkeszteshez |
| 4.8 | [Epuletmodellezes](04-file-formats/08-building-modeling.md) | Epuletek modellezese ajtokkal es letrakkal |

### 5. resz: Konfiguracios fajlok (6 fejezet)

| # | Fejezet | Leiras |
|---|---------|--------|
| 5.1 | [stringtable.csv](05-config-files/01-stringtable.md) | Lokalizacio stringtable.csv-vel 13 nyelvre |
| 5.2 | [inputs.xml](05-config-files/02-inputs-xml.md) | Billentyu-konfiguracio es egyedi billentyukombinciok |
| 5.3 | [credits.json](05-config-files/03-credits-json.md) | Mod szerzoi informacios fajl |
| 5.4 | [ImageSets](05-config-files/04-imagesets.md) | ImageSet formatum ikonokhoz es spritekhez |
| 5.5 | [Szerver konfiguracip](05-config-files/05-server-configs.md) | DayZ szerver konfiguracios fajlok |
| 5.6 | [Spawn konfigurcio](05-config-files/06-spawning-gear.md) | Kezdo felszereles es spawn pont konfiguracio |

### 6. resz: Motor API referencia (23 fejezet)

| # | Fejezet | Leiras |
|---|---------|--------|
| 6.1 | [Entitas rendszer](06-engine-api/01-entity-system.md) | Entitas-hierarchia, EntityAI, ItemBase, Object |
| 6.2 | [Jarmu rendszer](06-engine-api/02-vehicles.md) | Jarmu API, motorok, folyadékok, fizikai szimulacio |
| 6.3 | [Idojaras rendszer](06-engine-api/03-weather.md) | Idojaras-vezerles, eso, kod, felhozet |
| 6.4 | [Kamera rendszer](06-engine-api/04-cameras.md) | Egyedi kamerak, pozicio, forgatas, atmenetek |
| 6.5 | [Utofeldolgozasi effektek](06-engine-api/05-ppe.md) | PPE: homályositas, kromatikus aberracio, szinkorrekció |
| 6.6 | [Ertesitesi rendszer](06-engine-api/06-notifications.md) | Kepernyon megjeleno ertesitesek, jatekos uzenetek |
| 6.7 | [Idozitok es CallQueue](06-engine-api/07-timers.md) | Idozitok, kesobbi hivasok, ismetles |
| 6.8 | [Fajl I/O es JSON](06-engine-api/08-file-io.md) | Fajlok olvasasa/irasa, JSON elemzes |
| 6.9 | [Halozat es RPC](06-engine-api/09-networking.md) | Halozati kommunikacio, RPC, kliens-szerver szinkronizacio |
| 6.10 | [Kozponti gazdasag](06-engine-api/10-central-economy.md) | Loot rendszer, kategoriak, flag-ek, min/max |
| 6.11 | [Mission hook-ok](06-engine-api/11-mission-hooks.md) | Mission hook-ok, MissionBase, MissionServer |
| 6.12 | [Akcio rendszer](06-engine-api/12-action-system.md) | Jatekos akciok, ActionBase, celok, feltetelek |
| 6.13 | [Beviteli rendszer](06-engine-api/13-input-system.md) | Billentyu elfogasa, lekepezes, UAInput |
| 6.14 | [Jatekos rendszer](06-engine-api/14-player-system.md) | PlayerBase, leltar, elet, allokepes, statisztikak |
| 6.15 | [Hang rendszer](06-engine-api/15-sound-system.md) | Hang lejatszas, SoundOnVehicle, kornyezet |
| 6.16 | [Crafting rendszer](06-engine-api/16-crafting-system.md) | Crafting receptek, hozzavalok, eredmenyek |
| 6.17 | [Epitesi rendszer](06-engine-api/17-construction-system.md) | Bazisepites, epitesi reszek, allapotok |
| 6.18 | [Animacios rendszer](06-engine-api/18-animation-system.md) | Jatekos animacio, command ID-k, callback-ek |
| 6.19 | [Terep lekerdezsek](06-engine-api/19-terrain-queries.md) | Raycast-ok, tereppozicio, feluletek |
| 6.20 | [Reszecske effektek](06-engine-api/20-particle-effects.md) | Reszecske rendszer, emitterek, vizualis effektek |
| 6.21 | [Zombi es MI rendszer](06-engine-api/21-zombie-ai-system.md) | ZombieBase, fertozott MI, viselkedes |
| 6.22 | [Admin es szerver](06-engine-api/22-admin-server.md) | Szerver kezelese, ban-ok, kick-ek, RCON |
| 6.23 | [Vilag rendszerek](06-engine-api/23-world-systems.md) | Napszak, datum, vilag fuggvenyek |

### 7. resz: Mintak es legjobb gyakorlatok (7 fejezet)

| # | Fejezet | Leiras |
|---|---------|--------|
| 7.1 | [Singleton minta](07-patterns/01-singletons.md) | Egyedi peldanyok, globalis hozzaferes, inicializalas |
| 7.2 | [Modul rendszerek](07-patterns/02-module-systems.md) | Modul regisztracio, eletciklus, CF modulok |
| 7.3 | [RPC kommunikacio](07-patterns/03-rpc-patterns.md) | Mintak biztonsagos es hatekony RPC-khoz |
| 7.4 | [Konfigurcio perzisztencia](07-patterns/04-config-persistence.md) | JSON konfiguraciok mentese/betoltese, verziozas |
| 7.5 | [Jogosultsagi rendszerek](07-patterns/05-permissions.md) | Hierarchikus jogosultsagok, wildcard-ok, csoportok |
| 7.6 | [Esemenyvezerelt architektura](07-patterns/06-events.md) | Event bus, publish/subscribe, szétcsatolas |
| 7.7 | [Teljesitmenyoptimalizalas](07-patterns/07-performance.md) | Profilozas, cache, pooling, RPC csokkentes |

### 8. resz: Oktatoanyagok (13 fejezet)

| # | Fejezet | Leiras |
|---|---------|--------|
| 8.1 | [Elso mod (Hello World)](08-tutorials/01-first-mod.md) | Lepesrol lepesre: mod letrehozasa es betoltese |
| 8.2 | [Egyedi targy letrehozasa](08-tutorials/02-custom-item.md) | Targy letrehozasa modellel, texturaval es konfiguracioval |
| 8.3 | [Admin panel epitese](08-tutorials/03-admin-panel.md) | Admin UI teleporttal, spawn-nal, kezeléssel |
| 8.4 | [Chat parancsok hozzaadasa](08-tutorials/04-chat-commands.md) | Egyedi parancsok a jatek chatjeben |
| 8.5 | [Mod sablon hasznalata](08-tutorials/05-mod-template.md) | Hogyan hasznald a hivatalos DayZ mod sablont |
| 8.6 | [Hibakeresés es teszteles](08-tutorials/06-debugging-testing.md) | Logok, debug, diagnosztikai eszkozok |
| 8.7 | [Publikalas a Workshop-on](08-tutorials/07-publishing-workshop.md) | Mod publikalasa a Steam Workshop-on |
| 8.8 | [HUD overlay epitese](08-tutorials/08-hud-overlay.md) | Egyedi HUD overlay a jatek folott |
| 8.9 | [Professzionalis mod sablon](08-tutorials/09-professional-template.md) | Teljes produkciokesz sablon |
| 8.10 | [Jarmu mod letrehozasa](08-tutorials/10-vehicle-mod.md) | Egyedi jarmu fizikaval es konfiguracioval |
| 8.11 | [Ruha mod letrehozasa](08-tutorials/11-clothing-mod.md) | Egyedi ruha texturakkal es slot-okkal |
| 8.12 | [Kereskedesi rendszer epitese](08-tutorials/12-trading-system.md) | Kereskedesi rendszer jatekosok/NPC-k kozott |
| 8.13 | [Diag Menu referencia](08-tutorials/13-diag-menu.md) | Diagnosztikai menuk fejleszteshez |

### Gyors referencia

| Oldal | Leiras |
|-------|--------|
| [Puska](cheatsheet.md) | Enforce Script szintaxis gyors attekintese |
| [API gyors referencia](06-engine-api/quick-reference.md) | Leggyakrabban hasznalt motor API metodusok |
| [Fogalomtar](glossary.md) | DayZ modding fogalmak definicioi |
| [GYIK](faq.md) | Gyakran ismetelt kerdesek a moddingrol |
| [Hibaelharitasi utmutato](troubleshooting.md) | 91 gyakori problema megoldasokkal |

---

## Szerzok

| Fejleszto | Projektek | Fo hozzajarulasok |
|-----------|-----------|-------------------|
| [**Jacob_Mango**](https://github.com/Jacob-Mango) | Community Framework, COT | Modul rendszer, RPC, jogosultsagok, ESP |
| [**InclementDab**](https://github.com/InclementDab) | Dabs Framework, DayZ Editor, Mod Template | MVC, ViewBinding, szerkeszto UI |
| [**salutesh**](https://github.com/salutesh) | DayZ Expansion | Piac, csoportok, terkepi jelolok, jarmuvek |
| [**Arkensor**](https://github.com/Arkensor) | DayZ Expansion | Kozponti gazdasag, beallitas verziozas |
| [**DaOne**](https://github.com/Da0ne) | VPP Admin Tools | Jatekos kezeles, webhook-ok, ESP |
| [**GravityWolf**](https://github.com/GravityWolfNotAmused) | VPP Admin Tools | Jogosultsagok, szerver kezeles |
| [**Brian Orr (DrkDevil)**](https://github.com/DrkDevil) | Colorful UI | Szin temak, modded class UI mintak |
| [**lothsun**](https://github.com/lothsun) | Colorful UI | UI szin rendszerek, vizualis fejlesztesek |
| [**Bohemia Interactive**](https://github.com/BohemiaInteractive) | DayZ Engine & Samples | Enforce Script, vanilla scriptek, DayZ Tools |
| [**StarDZ Team**](https://github.com/StarDZ-Team) | Ez a wiki | Dokumentacio, forditas es szervezes |

## Licenc

A dokumentacio a [**CC BY-SA 4.0**](https://creativecommons.org/licenses/by-sa/4.0/) licenc alatt all.
A kodpeldak a [**MIT**](../LICENCE) licenc alatt allnak.
