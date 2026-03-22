# Guida Completa al Modding di DayZ

> Documentazione completa per il modding DayZ — 92 capitoli, da zero al mod pubblicato.

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
  <a href="../hu/README.md"><img src="https://flagsapi.com/HU/flat/48.png" alt="Magyar" /></a>
  <a href="README.md"><img src="https://flagsapi.com/IT/flat/48.png" alt="Italiano" /></a>
</p>

---

## Indice Completo delle Pagine

### Parte 1: Linguaggio Enforce Script (13 capitoli)

| # | Capitolo | Descrizione |
|---|----------|-------------|
| 1.1 | [Variabili e tipi](01-enforce-script/01-variables-types.md) | Tipi primitivi, dichiarazione di variabili, conversioni e valori predefiniti |
| 1.2 | [Array, map e set](01-enforce-script/02-arrays-maps-sets.md) | Collezioni di dati: array, map, set — iterazione, ricerca, ordinamento |
| 1.3 | [Classi ed ereditarieta](01-enforce-script/03-classes-inheritance.md) | Definizione di classi, ereditarieta, costruttori, polimorfismo |
| 1.4 | [Classi modded](01-enforce-script/04-modded-classes.md) | Sistema di modded class, override di metodi, chiamate super |
| 1.5 | [Flusso di controllo](01-enforce-script/05-control-flow.md) | If/else, switch, cicli while/for, break, continue |
| 1.6 | [Operazioni sulle stringhe](01-enforce-script/06-strings.md) | Manipolazione di stringhe, formattazione, ricerca, confronto |
| 1.7 | [Matematica e vettori](01-enforce-script/07-math-vectors.md) | Funzioni matematiche, vettori 3D, distanze, direzioni |
| 1.8 | [Gestione della memoria](01-enforce-script/08-memory-management.md) | Conteggio dei riferimenti, ref, prevenzione leak, cicli di riferimento |
| 1.9 | [Casting e riflessione](01-enforce-script/09-casting-reflection.md) | Conversione di tipi, Class.CastTo, verifica del tipo a runtime |
| 1.10 | [Enum e preprocessore](01-enforce-script/10-enums-preprocessor.md) | Enumerazioni, #ifdef, #define, compilazione condizionale |
| 1.11 | [Gestione degli errori](01-enforce-script/11-error-handling.md) | Pattern di gestione errori senza try/catch, guard clauses |
| 1.12 | [Cosa NON esiste](01-enforce-script/12-gotchas.md) | 30+ trappole e limitazioni del linguaggio Enforce Script |
| 1.13 | [Funzioni e metodi](01-enforce-script/13-functions-methods.md) | Dichiarazione di funzioni, parametri, valori di ritorno, static, proto |

### Parte 2: Struttura del mod (6 capitoli)

| # | Capitolo | Descrizione |
|---|----------|-------------|
| 2.1 | [Gerarchia a 5 livelli](02-mod-structure/01-five-layers.md) | I 5 livelli di script di DayZ e ordine di compilazione |
| 2.2 | [config.cpp in dettaglio](02-mod-structure/02-config-cpp.md) | Struttura completa del config.cpp, CfgPatches, CfgMods |
| 2.3 | [mod.cpp e Workshop](02-mod-structure/03-mod-cpp.md) | File mod.cpp, pubblicazione su Steam Workshop |
| 2.4 | [Il tuo primo mod](02-mod-structure/04-minimum-viable-mod.md) | Mod minimo funzionante — file essenziali e struttura |
| 2.5 | [Organizzazione dei file](02-mod-structure/05-file-organization.md) | Convenzioni di denominazione, struttura cartelle consigliata |
| 2.6 | [Architettura server/client](02-mod-structure/06-server-client-split.md) | Separazione del codice server e client, sicurezza |

### Parte 3: Sistema GUI e layout (10 capitoli)

| # | Capitolo | Descrizione |
|---|----------|-------------|
| 3.1 | [Tipi di widget](03-gui-system/01-widget-types.md) | Tutti i tipi di widget disponibili: testo, immagine, pulsante, ecc. |
| 3.2 | [Formato file layout](03-gui-system/02-layout-files.md) | Struttura dei file XML .layout per le interfacce |
| 3.3 | [Dimensionamento e posizionamento](03-gui-system/03-sizing-positioning.md) | Sistema di coordinate, flag di dimensione, ancoraggio |
| 3.4 | [Contenitori](03-gui-system/04-containers.md) | Widget contenitore: WrapSpacer, GridSpacer, ScrollWidget |
| 3.5 | [Creazione programmatica](03-gui-system/05-programmatic-widgets.md) | Creare widget via codice, GetWidgetUnderCursor, SetHandler |
| 3.6 | [Gestione degli eventi](03-gui-system/06-event-handling.md) | Callback UI: OnClick, OnChange, OnMouseEnter |
| 3.7 | [Stili, font e immagini](03-gui-system/07-styles-fonts.md) | Font disponibili, stili, caricamento immagini |
| 3.8 | [Dialoghi e finestre modali](03-gui-system/08-dialogs-modals.md) | Creazione di dialoghi, menu modali, conferma |
| 3.9 | [Pattern UI reali](03-gui-system/09-real-mod-patterns.md) | Pattern UI da COT, VPP, Expansion, Dabs Framework |
| 3.10 | [Widget avanzati](03-gui-system/10-advanced-widgets.md) | MapWidget, RenderTargetWidget, widget specializzati |

### Parte 4: Formati di file e strumenti (8 capitoli)

| # | Capitolo | Descrizione |
|---|----------|-------------|
| 4.1 | [Texture](04-file-formats/01-textures.md) | Formati .paa, .edds, .tga — conversione e utilizzo |
| 4.2 | [Modelli 3D](04-file-formats/02-models.md) | Formato .p3d, LOD, geometria, memory point |
| 4.3 | [Materiali](04-file-formats/03-materials.md) | File .rvmat, shader, proprieta di superficie |
| 4.4 | [Audio](04-file-formats/04-audio.md) | Formati .ogg e .wss, configurazione del suono |
| 4.5 | [DayZ Tools](04-file-formats/05-dayz-tools.md) | Flusso di lavoro con i DayZ Tools ufficiali |
| 4.6 | [Impacchettamento PBO](04-file-formats/06-pbo-packing.md) | Creazione ed estrazione di file PBO |
| 4.7 | [Guida al Workbench](04-file-formats/07-workbench-guide.md) | Utilizzo del Workbench per la modifica di script e asset |
| 4.8 | [Modellazione di edifici](04-file-formats/08-building-modeling.md) | Modellazione di edifici con porte e scale |

### Parte 5: File di configurazione (6 capitoli)

| # | Capitolo | Descrizione |
|---|----------|-------------|
| 5.1 | [stringtable.csv](05-config-files/01-stringtable.md) | Localizzazione con stringtable.csv per 13 lingue |
| 5.2 | [inputs.xml](05-config-files/02-inputs-xml.md) | Configurazione tasti e keybinding personalizzati |
| 5.3 | [credits.json](05-config-files/03-credits-json.md) | File dei crediti del mod |
| 5.4 | [ImageSets](05-config-files/04-imagesets.md) | Formato ImageSet per icone e sprite |
| 5.5 | [Configurazione server](05-config-files/05-server-configs.md) | File di configurazione del server DayZ |
| 5.6 | [Configurazione spawn](05-config-files/06-spawning-gear.md) | Configurazione dell'equipaggiamento iniziale e punti di spawn |

### Parte 6: Riferimento API del motore (23 capitoli)

| # | Capitolo | Descrizione |
|---|----------|-------------|
| 6.1 | [Sistema di entita](06-engine-api/01-entity-system.md) | Gerarchia delle entita, EntityAI, ItemBase, Object |
| 6.2 | [Sistema veicoli](06-engine-api/02-vehicles.md) | API veicoli, motori, fluidi, simulazione fisica |
| 6.3 | [Sistema meteo](06-engine-api/03-weather.md) | Controllo del meteo, pioggia, nebbia, nuvolosita |
| 6.4 | [Sistema telecamere](06-engine-api/04-cameras.md) | Telecamere personalizzate, posizione, rotazione, transizioni |
| 6.5 | [Effetti di post-elaborazione](06-engine-api/05-ppe.md) | PPE: sfocatura, aberrazione cromatica, gradazione colore |
| 6.6 | [Sistema di notifiche](06-engine-api/06-notifications.md) | Notifiche sullo schermo, messaggi ai giocatori |
| 6.7 | [Timer e CallQueue](06-engine-api/07-timers.md) | Timer, chiamate ritardate, ripetizione |
| 6.8 | [File I/O e JSON](06-engine-api/08-file-io.md) | Lettura/scrittura di file, parsing JSON |
| 6.9 | [Rete e RPC](06-engine-api/09-networking.md) | Comunicazione di rete, RPC, sincronizzazione client-server |
| 6.10 | [Economia centrale](06-engine-api/10-central-economy.md) | Sistema di loot, categorie, flag, min/max |
| 6.11 | [Hook delle missioni](06-engine-api/11-mission-hooks.md) | Hook delle missioni, MissionBase, MissionServer |
| 6.12 | [Sistema di azioni](06-engine-api/12-action-system.md) | Azioni del giocatore, ActionBase, bersagli, condizioni |
| 6.13 | [Sistema di input](06-engine-api/13-input-system.md) | Cattura tasti, mapping, UAInput |
| 6.14 | [Sistema giocatore](06-engine-api/14-player-system.md) | PlayerBase, inventario, vita, resistenza, statistiche |
| 6.15 | [Sistema sonoro](06-engine-api/15-sound-system.md) | Riproduzione audio, SoundOnVehicle, ambienti |
| 6.16 | [Sistema di crafting](06-engine-api/16-crafting-system.md) | Ricette di crafting, ingredienti, risultati |
| 6.17 | [Sistema di costruzione](06-engine-api/17-construction-system.md) | Costruzione basi, pezzi, stati |
| 6.18 | [Sistema di animazione](06-engine-api/18-animation-system.md) | Animazione giocatore, command ID, callback |
| 6.19 | [Query sul terreno](06-engine-api/19-terrain-queries.md) | Raycast, posizione sul terreno, superfici |
| 6.20 | [Effetti particellari](06-engine-api/20-particle-effects.md) | Sistema di particelle, emettitori, effetti visivi |
| 6.21 | [Sistema zombie e IA](06-engine-api/21-zombie-ai-system.md) | ZombieBase, IA degli infetti, comportamento |
| 6.22 | [Admin e server](06-engine-api/22-admin-server.md) | Gestione server, ban, kick, RCON |
| 6.23 | [Sistemi del mondo](06-engine-api/23-world-systems.md) | Ora del giorno, data, funzioni del mondo |

### Parte 7: Pattern e buone pratiche (7 capitoli)

| # | Capitolo | Descrizione |
|---|----------|-------------|
| 7.1 | [Pattern Singleton](07-patterns/01-singletons.md) | Istanze uniche, accesso globale, inizializzazione |
| 7.2 | [Sistemi di moduli](07-patterns/02-module-systems.md) | Registrazione moduli, ciclo di vita, moduli CF |
| 7.3 | [Comunicazione RPC](07-patterns/03-rpc-patterns.md) | Pattern per RPC sicuri ed efficienti |
| 7.4 | [Persistenza della configurazione](07-patterns/04-config-persistence.md) | Salvataggio/caricamento configurazioni JSON, versionamento |
| 7.5 | [Sistemi di permessi](07-patterns/05-permissions.md) | Permessi gerarchici, wildcard, gruppi |
| 7.6 | [Architettura ad eventi](07-patterns/06-events.md) | Event bus, publish/subscribe, disaccoppiamento |
| 7.7 | [Ottimizzazione delle prestazioni](07-patterns/07-performance.md) | Profilazione, cache, pooling, riduzione RPC |

### Parte 8: Tutorial (13 capitoli)

| # | Capitolo | Descrizione |
|---|----------|-------------|
| 8.1 | [Il tuo primo mod (Hello World)](08-tutorials/01-first-mod.md) | Passo per passo: crea e carica un mod |
| 8.2 | [Creare un oggetto personalizzato](08-tutorials/02-custom-item.md) | Crea un oggetto con modello, texture e config |
| 8.3 | [Costruire un pannello admin](08-tutorials/03-admin-panel.md) | UI admin con teleport, spawn, gestione |
| 8.4 | [Aggiungere comandi chat](08-tutorials/04-chat-commands.md) | Comandi personalizzati nella chat del gioco |
| 8.5 | [Usare il template di mod](08-tutorials/05-mod-template.md) | Come usare il template ufficiale di mod DayZ |
| 8.6 | [Debug e test](08-tutorials/06-debugging-testing.md) | Log, debug, strumenti diagnostici |
| 8.7 | [Pubblicare sul Workshop](08-tutorials/07-publishing-workshop.md) | Pubblica il tuo mod su Steam Workshop |
| 8.8 | [Costruire un HUD overlay](08-tutorials/08-hud-overlay.md) | HUD overlay personalizzato sopra il gioco |
| 8.9 | [Template di mod professionale](08-tutorials/09-professional-template.md) | Template completo pronto per la produzione |
| 8.10 | [Creare un mod veicolo](08-tutorials/10-vehicle-mod.md) | Veicolo personalizzato con fisica e config |
| 8.11 | [Creare un mod abbigliamento](08-tutorials/11-clothing-mod.md) | Abbigliamento personalizzato con texture e slot |
| 8.12 | [Costruire un sistema di commercio](08-tutorials/12-trading-system.md) | Sistema di commercio tra giocatori/NPC |
| 8.13 | [Riferimento Diag Menu](08-tutorials/13-diag-menu.md) | Menu diagnostici per lo sviluppo |

### Riferimento rapido

| Pagina | Descrizione |
|--------|-------------|
| [Cheatsheet](cheatsheet.md) | Riepilogo rapido della sintassi Enforce Script |
| [Riferimento rapido API](06-engine-api/quick-reference.md) | Metodi API del motore piu utilizzati |
| [Glossario](glossary.md) | Definizioni dei termini usati nel modding DayZ |
| [FAQ](faq.md) | Domande frequenti sul modding |
| [Guida alla risoluzione dei problemi](troubleshooting.md) | 91 problemi comuni con soluzioni |

---

## Crediti

| Sviluppatore | Progetti | Contributi principali |
|--------------|----------|----------------------|
| [**Jacob_Mango**](https://github.com/Jacob-Mango) | Community Framework, COT | Sistema di moduli, RPC, permessi, ESP |
| [**InclementDab**](https://github.com/InclementDab) | Dabs Framework, DayZ Editor, Mod Template | MVC, ViewBinding, UI dell'editor |
| [**salutesh**](https://github.com/salutesh) | DayZ Expansion | Mercato, gruppi, marcatori mappa, veicoli |
| [**Arkensor**](https://github.com/Arkensor) | DayZ Expansion | Economia centrale, versionamento impostazioni |
| [**DaOne**](https://github.com/Da0ne) | VPP Admin Tools | Gestione giocatori, webhook, ESP |
| [**GravityWolf**](https://github.com/GravityWolfNotAmused) | VPP Admin Tools | Permessi, gestione server |
| [**Brian Orr (DrkDevil)**](https://github.com/DrkDevil) | Colorful UI | Temi di colore, pattern modded class UI |
| [**lothsun**](https://github.com/lothsun) | Colorful UI | Sistemi di colore UI, miglioramenti visivi |
| [**Bohemia Interactive**](https://github.com/BohemiaInteractive) | DayZ Engine & Samples | Enforce Script, script vanilla, DayZ Tools |
| [**StarDZ Team**](https://github.com/StarDZ-Team) | Questa wiki | Documentazione, traduzione e organizzazione |

## Licenza

La documentazione e concessa in licenza sotto [**CC BY-SA 4.0**](https://creativecommons.org/licenses/by-sa/4.0/).
Gli esempi di codice sono concessi in licenza sotto [**MIT**](../LICENCE).
