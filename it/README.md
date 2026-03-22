# Wiki del Modding DayZ (Italiano)

[![English](https://flagsapi.com/US/flat/48.png)](../en/README.md) [![Português](https://flagsapi.com/BR/flat/48.png)](../pt/README.md) [![Deutsch](https://flagsapi.com/DE/flat/48.png)](../de/README.md) [![Русский](https://flagsapi.com/RU/flat/48.png)](../ru/README.md) [![Čeština](https://flagsapi.com/CZ/flat/48.png)](../cs/README.md) [![Polski](https://flagsapi.com/PL/flat/48.png)](../pl/README.md) [![Magyar](https://flagsapi.com/HU/flat/48.png)](../hu/README.md) [![Italiano](https://flagsapi.com/IT/flat/48.png)](../it/README.md) [![Español](https://flagsapi.com/ES/flat/48.png)](../es/README.md) [![Français](https://flagsapi.com/FR/flat/48.png)](../fr/README.md) [![日本語](https://flagsapi.com/JP/flat/48.png)](../ja/README.md) [![简体中文](https://flagsapi.com/CN/flat/48.png)](../zh-hans/README.md)

> Guida completa al modding di DayZ: Enforce Script, struttura dei mod, sistema GUI, formati di file, API del motore, pattern e tutorial.

Questa e' la versione italiana della wiki. [English version](../en/README.md)

---

## Indice dei Contenuti

### Parte 1: Enforce Script
1. [Variabili e Tipi](01-enforce-script/01-variables-types.md)
2. [Array, Mappe e Set](01-enforce-script/02-arrays-maps-sets.md)
3. [Classi ed Ereditarieta'](01-enforce-script/03-classes-inheritance.md)
4. [Classi Moddate](01-enforce-script/04-modded-classes.md)
5. [Flusso di Controllo](01-enforce-script/05-control-flow.md)
6. [Operazioni sulle Stringhe](01-enforce-script/06-strings.md)
7. [Matematica e Vettori](01-enforce-script/07-math-vectors.md)
8. [Gestione della Memoria](01-enforce-script/08-memory-management.md)
9. [Casting e Reflection](01-enforce-script/09-casting-reflection.md)
10. [Enum e Preprocessore](01-enforce-script/10-enums-preprocessor.md)
11. [Gestione degli Errori](01-enforce-script/11-error-handling.md)
12. [Cosa NON Esiste (Insidie)](01-enforce-script/12-gotchas.md)
13. [Functions & Methods (English)](../en/01-enforce-script/13-functions-methods.md) 🔄

### Parte 2: Struttura dei Mod
1. [La Gerarchia a 5 Layer degli Script](02-mod-structure/01-five-layers.md)
2. [config.cpp in Dettaglio](02-mod-structure/02-config-cpp.md)
3. [mod.cpp e Workshop](02-mod-structure/03-mod-cpp.md)
4. [Il Tuo Primo Mod -- Minimo Funzionante](02-mod-structure/04-minimum-viable-mod.md)
5. [Buone Pratiche di Organizzazione dei File](02-mod-structure/05-file-organization.md)
6. [Server/Client Architecture (English)](../en/02-mod-structure/06-server-client-split.md) 🔄

### Parte 3: Sistema GUI
1. [Tipi di Widget](03-gui-system/01-widget-types.md)
2. [File di Layout](03-gui-system/02-layout-files.md)
3. [Dimensionamento e Posizionamento](03-gui-system/03-sizing-positioning.md)
4. [Widget Container](03-gui-system/04-containers.md)
5. [Creazione Programmatica dei Widget](03-gui-system/05-programmatic-widgets.md)
6. [Gestione degli Eventi](03-gui-system/06-event-handling.md)
7. [Stili, Font e Immagini](03-gui-system/07-styles-fonts.md)
8. [Dialogs & Modals (English)](../en/03-gui-system/08-dialogs-modals.md) 🔄
9. [Real Mod UI Patterns (English)](../en/03-gui-system/09-real-mod-patterns.md) 🔄
10. [Advanced Widgets (English)](../en/03-gui-system/10-advanced-widgets.md) 🔄

### Parte 4: Formati di File e DayZ Tools
1. [Texture (.paa, .edds, .tga)](04-file-formats/01-textures.md)
2. [Modelli 3D (.p3d)](04-file-formats/02-models.md)
3. [Materiali (.rvmat)](04-file-formats/03-materials.md)
4. [Audio (.ogg, .wss)](04-file-formats/04-audio.md)
5. [Flusso di Lavoro con DayZ Tools](04-file-formats/05-dayz-tools.md)
6. [Impacchettamento PBO](04-file-formats/06-pbo-packing.md)
7. [Workbench Guide (English)](../en/04-file-formats/07-workbench-guide.md) 🔄

### Parte 5: File di Configurazione
1. [stringtable.csv -- Localizzazione](05-config-files/01-stringtable.md)
2. [inputs.xml -- Tasti Personalizzati](05-config-files/02-inputs-xml.md)
3. [Credits.json](05-config-files/03-credits-json.md)
4. [Formato ImageSet](05-config-files/04-imagesets.md)
5. [Server Configuration Files (English)](../en/05-config-files/05-server-configs.md) 🔄
6. [Spawning Gear Configuration (English)](../en/05-config-files/06-spawning-gear.md) 🔄

### Parte 6: API del Motore
1. [Sistema delle Entita'](06-engine-api/01-entity-system.md)
2. [Veicoli](06-engine-api/02-vehicles.md)
3. [Meteo](06-engine-api/03-weather.md)
4. [Telecamere](06-engine-api/04-cameras.md)
5. [Post-Processing (PPE)](06-engine-api/05-ppe.md)
6. [Notifiche](06-engine-api/06-notifications.md)
7. [Timer](06-engine-api/07-timers.md)
8. [I/O su File](06-engine-api/08-file-io.md)
9. [Networking](06-engine-api/09-networking.md)
10. [Central Economy](06-engine-api/10-central-economy.md)
11. [Mission Hooks (English)](../en/06-engine-api/11-mission-hooks.md) 🔄
12. [Action System (English)](../en/06-engine-api/12-action-system.md) 🔄
13. [Input System (English)](../en/06-engine-api/13-input-system.md) 🔄
14. [Player System (English)](../en/06-engine-api/14-player-system.md) 🔄
15. [Sound System (English)](../en/06-engine-api/15-sound-system.md) 🔄
16. [Crafting System (English)](../en/06-engine-api/16-crafting-system.md) 🔄
17. [Construction System (English)](../en/06-engine-api/17-construction-system.md) 🔄
18. [Animation System (English)](../en/06-engine-api/18-animation-system.md) 🔄
19. [Terrain & World Queries (English)](../en/06-engine-api/19-terrain-queries.md) 🔄
20. [Particle & Effect System (English)](../en/06-engine-api/20-particle-effects.md) 🔄
21. [Zombie & AI System (English)](../en/06-engine-api/21-zombie-ai-system.md) 🔄
22. [Admin & Server Management (English)](../en/06-engine-api/22-admin-server.md) 🔄

### Parte 7: Pattern e Architettura
1. [Singleton](07-patterns/01-singletons.md)
2. [Sistemi a Moduli](07-patterns/02-module-systems.md)
3. [Pattern RPC](07-patterns/03-rpc-patterns.md)
4. [Persistenza delle Configurazioni](07-patterns/04-config-persistence.md)
5. [Permessi](07-patterns/05-permissions.md)
6. [Eventi](07-patterns/06-events.md)
7. [Prestazioni](07-patterns/07-performance.md)

### Parte 8: Tutorial
1. [Il Tuo Primo Mod](08-tutorials/01-first-mod.md)
2. [Creare un Oggetto Personalizzato](08-tutorials/02-custom-item.md)
3. [Pannello di Amministrazione](08-tutorials/03-admin-panel.md)
4. [Comandi Chat](08-tutorials/04-chat-commands.md)
5. [Usare il Template per Mod](08-tutorials/05-mod-template.md)
6. [Debugging & Testing (English)](../en/08-tutorials/06-debugging-testing.md) 🔄
7. [Publishing to Steam Workshop (English)](../en/08-tutorials/07-publishing-workshop.md) 🔄
8. [Building a HUD Overlay (English)](../en/08-tutorials/08-hud-overlay.md) 🔄
9. [Professional Mod Template (English)](../en/08-tutorials/09-professional-template.md) 🔄
10. [Creating a Vehicle Mod (English)](../en/08-tutorials/10-vehicle-mod.md) 🔄
11. [Creating a Clothing Mod (English)](../en/08-tutorials/11-clothing-mod.md) 🔄
12. [Building a Trading System (English)](../en/08-tutorials/12-trading-system.md) 🔄
13. [Diag Menu Reference (English)](../en/08-tutorials/13-diag-menu.md) 🔄

### Riferimento Rapido
- [Cheat Sheet di Enforce Script](cheatsheet.md)
- [Riferimento Rapido API del Motore](06-engine-api/quick-reference.md)
- [Glossary (English)](../en/glossary.md) 🔄
- [FAQ (English)](../en/faq.md) 🔄
- [Troubleshooting Guide (English)](../en/troubleshooting.md) 🔄

---

## Credits

- **Bohemia Interactive** -- Motore DayZ e campioni ufficiali
- **Jacob_Mango** -- Community Framework e Community Online Tools
- **InclementDab** -- Dabs Framework e DayZ Editor
- **DaOne & GravityWolf** -- VPP Admin Tools
- **DayZ Expansion Team** -- Expansion Scripts
- **Brian Orr (DrkDevil)** -- Colorful UI, sistema di temi di colore
- **lothsun** -- Colorful UI, sistemi di colori UI
- **StarDZ Team** -- Compilazione, traduzione e organizzazione della documentazione
