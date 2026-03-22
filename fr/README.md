# Wiki de Modding DayZ (Francais)

[![English](https://flagsapi.com/US/flat/48.png)](../en/README.md) [![Português](https://flagsapi.com/BR/flat/48.png)](../pt/README.md) [![Deutsch](https://flagsapi.com/DE/flat/48.png)](../de/README.md) [![Русский](https://flagsapi.com/RU/flat/48.png)](../ru/README.md) [![Čeština](https://flagsapi.com/CZ/flat/48.png)](../cs/README.md) [![Polski](https://flagsapi.com/PL/flat/48.png)](../pl/README.md) [![Magyar](https://flagsapi.com/HU/flat/48.png)](../hu/README.md) [![Italiano](https://flagsapi.com/IT/flat/48.png)](../it/README.md) [![Español](https://flagsapi.com/ES/flat/48.png)](../es/README.md) [![Français](https://flagsapi.com/FR/flat/48.png)](../fr/README.md) [![日本語](https://flagsapi.com/JP/flat/48.png)](../ja/README.md) [![简体中文](https://flagsapi.com/CN/flat/48.png)](../zh-hans/README.md)

Bienvenue dans le wiki de modding DayZ en francais. Ce wiki couvre tout ce que vous devez savoir pour creer des mods DayZ, du scripting Enforce Script a la structure des mods, en passant par le systeme GUI, les formats de fichiers, les API du moteur, les patterns de conception et les tutoriels.

> **Remarque :** Cette traduction conserve tous les termes techniques, noms de classes, mots-cles du langage et extraits de code en anglais. Seul le texte explicatif est traduit en francais.

---

## Sommaire

### Partie 1 : Enforce Script
1. [Variables et types](01-enforce-script/01-variables-types.md)
2. [Tableaux, Maps et Sets](01-enforce-script/02-arrays-maps-sets.md)
3. [Classes et heritage](01-enforce-script/03-classes-inheritance.md)
4. [Classes moddees](01-enforce-script/04-modded-classes.md)
5. [Flux de controle](01-enforce-script/05-control-flow.md)
6. [Operations sur les chaines](01-enforce-script/06-strings.md)
7. [Mathematiques et vecteurs](01-enforce-script/07-math-vectors.md)
8. [Gestion de la memoire](01-enforce-script/08-memory-management.md)
9. [Casting et reflexion](01-enforce-script/09-casting-reflection.md)
10. [Enums et preprocesseur](01-enforce-script/10-enums-preprocessor.md)
11. [Gestion des erreurs](01-enforce-script/11-error-handling.md)
12. [Ce qui n'existe PAS (Pieges)](01-enforce-script/12-gotchas.md)
13. [Functions & Methods (English)](../en/01-enforce-script/13-functions-methods.md) 🔄

### Partie 2 : Structure des mods
1. [La hierarchie des 5 couches de scripts](02-mod-structure/01-five-layers.md)
2. [config.cpp en detail](02-mod-structure/02-config-cpp.md)
3. [mod.cpp et Workshop](02-mod-structure/03-mod-cpp.md)
4. [Votre premier mod -- Minimum viable](02-mod-structure/04-minimum-viable-mod.md)
5. [Bonnes pratiques d'organisation des fichiers](02-mod-structure/05-file-organization.md)
6. [Server/Client Architecture (English)](../en/02-mod-structure/06-server-client-split.md) 🔄

### Partie 3 : Systeme GUI
1. [Types de widgets](03-gui-system/01-widget-types.md)
2. [Fichiers layout](03-gui-system/02-layout-files.md)
3. [Dimensionnement et positionnement](03-gui-system/03-sizing-positioning.md)
4. [Widgets conteneurs](03-gui-system/04-containers.md)
5. [Creation programmatique de widgets](03-gui-system/05-programmatic-widgets.md)
6. [Gestion des evenements](03-gui-system/06-event-handling.md)
7. [Styles, polices et images](03-gui-system/07-styles-fonts.md)
8. [Dialogs & Modals (English)](../en/03-gui-system/08-dialogs-modals.md) 🔄
9. [Real Mod UI Patterns (English)](../en/03-gui-system/09-real-mod-patterns.md) 🔄
10. [Advanced Widgets (English)](../en/03-gui-system/10-advanced-widgets.md) 🔄

### Partie 4 : Formats de fichiers et DayZ Tools
1. [Textures](04-file-formats/01-textures.md)
2. [Modeles 3D](04-file-formats/02-models.md)
3. [Materiaux](04-file-formats/03-materials.md)
4. [Audio](04-file-formats/04-audio.md)
5. [Workflow DayZ Tools](04-file-formats/05-dayz-tools.md)
6. [Empaquetage PBO](04-file-formats/06-pbo-packing.md)
7. [Workbench Guide (English)](../en/04-file-formats/07-workbench-guide.md) 🔄

### Partie 5 : Fichiers de configuration
1. [stringtable.csv -- Localisation](05-config-files/01-stringtable.md)
2. [inputs.xml -- Raccourcis clavier personnalises](05-config-files/02-inputs-xml.md)
3. [Credits.json](05-config-files/03-credits-json.md)
4. [Format ImageSet](05-config-files/04-imagesets.md)
5. [Server Configuration Files (English)](../en/05-config-files/05-server-configs.md) 🔄
6. [Spawning Gear Configuration (English)](../en/05-config-files/06-spawning-gear.md) 🔄

### Partie 6 : API du moteur
1. [Systeme d'entites](06-engine-api/01-entity-system.md)
2. [Vehicules](06-engine-api/02-vehicles.md)
3. [Meteo](06-engine-api/03-weather.md)
4. [Cameras](06-engine-api/04-cameras.md)
5. [Effets post-traitement (PPE)](06-engine-api/05-ppe.md)
6. [Notifications](06-engine-api/06-notifications.md)
7. [Timers](06-engine-api/07-timers.md)
8. [Entrees/Sorties fichiers](06-engine-api/08-file-io.md)
9. [Reseau](06-engine-api/09-networking.md)
10. [Economie centrale](06-engine-api/10-central-economy.md)
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

### Partie 7 : Patterns de conception
1. [Singletons](07-patterns/01-singletons.md)
2. [Systemes de modules](07-patterns/02-module-systems.md)
3. [Patterns RPC](07-patterns/03-rpc-patterns.md)
4. [Persistence de configuration](07-patterns/04-config-persistence.md)
5. [Permissions](07-patterns/05-permissions.md)
6. [Evenements](07-patterns/06-events.md)
7. [Performance](07-patterns/07-performance.md)

### Partie 8 : Tutoriels
1. [Votre premier mod](08-tutorials/01-first-mod.md)
2. [Objet personnalise](08-tutorials/02-custom-item.md)
3. [Panneau d'administration](08-tutorials/03-admin-panel.md)
4. [Commandes de chat](08-tutorials/04-chat-commands.md)
5. [Utiliser le DayZ Mod Template](08-tutorials/05-mod-template.md)
6. [Debugging & Testing (English)](../en/08-tutorials/06-debugging-testing.md) 🔄
7. [Publishing to Steam Workshop (English)](../en/08-tutorials/07-publishing-workshop.md) 🔄
8. [Building a HUD Overlay (English)](../en/08-tutorials/08-hud-overlay.md) 🔄
9. [Professional Mod Template (English)](../en/08-tutorials/09-professional-template.md) 🔄
10. [Creating a Vehicle Mod (English)](../en/08-tutorials/10-vehicle-mod.md) 🔄
11. [Creating a Clothing Mod (English)](../en/08-tutorials/11-clothing-mod.md) 🔄
12. [Building a Trading System (English)](../en/08-tutorials/12-trading-system.md) 🔄
13. [Diag Menu Reference (English)](../en/08-tutorials/13-diag-menu.md) 🔄

### Annexes
- [Aide-memoire](cheatsheet.md)
- [Glossary (English)](../en/glossary.md) 🔄
- [FAQ (English)](../en/faq.md) 🔄
- [Troubleshooting Guide (English)](../en/troubleshooting.md) 🔄

---

## Credits

- **Bohemia Interactive** -- Moteur DayZ et exemples officiels
- **Jacob_Mango** -- Community Framework et Community Online Tools
- **InclementDab** -- Dabs Framework et DayZ Editor
- **DaOne & GravityWolf** -- VPP Admin Tools
- **DayZ Expansion Team** -- Expansion Scripts
- **Brian Orr (DrkDevil)** -- Colorful UI, systeme de themes de couleurs
- **lothsun** -- Colorful UI, systemes de couleurs UI
- **StarDZ Team** -- Compilation, traduction et organisation de la documentation

---

## A propos de cette traduction

Cette traduction francaise a ete realisee a partir de la version anglaise du wiki situe dans `docs/wiki/en/`. Les regles suivantes ont ete appliquees :

- **Le code reste en anglais** : tous les extraits de code, noms de variables, noms de classes et mots-cles du langage sont conserves tels quels.
- **Les termes techniques restent en anglais** : des termes comme "widget", "callback", "singleton", "override", "proxy", "PBO", "layout", etc. ne sont pas traduits.
- **Les liens de navigation** pointent vers les fichiers du repertoire `fr/`.
- **Le texte explicatif** est traduit en francais naturel.
