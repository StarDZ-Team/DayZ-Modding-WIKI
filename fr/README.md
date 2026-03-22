# Guide Complet du Modding DayZ

> Documentation complete pour le modding DayZ — 92 chapitres, de zero au mod publie.

<p align="center">
  <a href="../en/README.md"><img src="https://flagsapi.com/US/flat/48.png" alt="English" /></a>
  <a href="../pt/README.md"><img src="https://flagsapi.com/BR/flat/48.png" alt="Portugues" /></a>
  <a href="../de/README.md"><img src="https://flagsapi.com/DE/flat/48.png" alt="Deutsch" /></a>
  <a href="../ru/README.md"><img src="https://flagsapi.com/RU/flat/48.png" alt="Russki" /></a>
  <a href="../es/README.md"><img src="https://flagsapi.com/ES/flat/48.png" alt="Espanol" /></a>
  <a href="README.md"><img src="https://flagsapi.com/FR/flat/48.png" alt="Francais" /></a>
  <a href="../ja/README.md"><img src="https://flagsapi.com/JP/flat/48.png" alt="Nihongo" /></a>
  <a href="../zh-hans/README.md"><img src="https://flagsapi.com/CN/flat/48.png" alt="Jiantizi Zhongwen" /></a>
  <a href="../cs/README.md"><img src="https://flagsapi.com/CZ/flat/48.png" alt="Cestina" /></a>
  <a href="../pl/README.md"><img src="https://flagsapi.com/PL/flat/48.png" alt="Polski" /></a>
  <a href="../hu/README.md"><img src="https://flagsapi.com/HU/flat/48.png" alt="Magyar" /></a>
  <a href="../it/README.md"><img src="https://flagsapi.com/IT/flat/48.png" alt="Italiano" /></a>
</p>

---

## Index Complet des Pages

### Partie 1 : Langage Enforce Script (13 chapitres)

| # | Chapitre | Description |
|---|----------|-------------|
| 1.1 | [Variables et Types](01-enforce-script/01-variables-types.md) | Types primitifs, declaration de variables, conversions et valeurs par defaut |
| 1.2 | [Arrays, Maps et Sets](01-enforce-script/02-arrays-maps-sets.md) | Collections de donnees : array, map, set — iteration, recherche, tri |
| 1.3 | [Classes et Heritage](01-enforce-script/03-classes-inheritance.md) | Definition de classes, heritage, constructeurs, polymorphisme |
| 1.4 | [Modded Classes](01-enforce-script/04-modded-classes.md) | Systeme de modded class, override de methodes, appels super |
| 1.5 | [Flux de Controle](01-enforce-script/05-control-flow.md) | If/else, switch, boucles while/for, break, continue |
| 1.6 | [Operations sur les Chaines](01-enforce-script/06-strings.md) | Manipulation de chaines, formatage, recherche, comparaison |
| 1.7 | [Mathematiques et Vecteurs](01-enforce-script/07-math-vectors.md) | Fonctions mathematiques, vecteurs 3D, distances, directions |
| 1.8 | [Gestion de la Memoire](01-enforce-script/08-memory-management.md) | Comptage de references, ref, prevention des fuites, cycles de reference |
| 1.9 | [Casting et Reflexion](01-enforce-script/09-casting-reflection.md) | Conversion de types, Class.CastTo, verification de type a l'execution |
| 1.10 | [Enums et Preprocesseur](01-enforce-script/10-enums-preprocessor.md) | Enumerations, #ifdef, #define, compilation conditionnelle |
| 1.11 | [Gestion des Erreurs](01-enforce-script/11-error-handling.md) | Gestion d'erreurs sans try/catch, guard clauses |
| 1.12 | [Ce Qui N'Existe PAS](01-enforce-script/12-gotchas.md) | 30+ pieges et limitations du langage Enforce Script |
| 1.13 | [Fonctions et Methodes](01-enforce-script/13-functions-methods.md) | Declaration de fonctions, parametres, retours, static, proto |

### Partie 2 : Structure de Mod (6 chapitres)

| # | Chapitre | Description |
|---|----------|-------------|
| 2.1 | [Hierarchie a 5 Couches](02-mod-structure/01-five-layers.md) | Les 5 couches de scripts DayZ et ordre de compilation |
| 2.2 | [config.cpp en Detail](02-mod-structure/02-config-cpp.md) | Structure complete du config.cpp, CfgPatches, CfgMods |
| 2.3 | [mod.cpp et Workshop](02-mod-structure/03-mod-cpp.md) | Fichier mod.cpp, publication sur le Steam Workshop |
| 2.4 | [Votre Premier Mod](02-mod-structure/04-minimum-viable-mod.md) | Mod minimum viable — fichiers essentiels et structure |
| 2.5 | [Organisation des Fichiers](02-mod-structure/05-file-organization.md) | Conventions de nommage, structure de dossiers recommandee |
| 2.6 | [Architecture Serveur/Client](02-mod-structure/06-server-client-split.md) | Separation du code serveur et client, securite |

### Partie 3 : Systeme GUI et Layout (10 chapitres)

| # | Chapitre | Description |
|---|----------|-------------|
| 3.1 | [Types de Widget](03-gui-system/01-widget-types.md) | Tous les types de widget disponibles : texte, image, bouton, etc. |
| 3.2 | [Format de Layout](03-gui-system/02-layout-files.md) | Structure des fichiers .layout XML pour les interfaces |
| 3.3 | [Dimensionnement et Positionnement](03-gui-system/03-sizing-positioning.md) | Systeme de coordonnees, flags de taille, ancrage |
| 3.4 | [Conteneurs](03-gui-system/04-containers.md) | Widgets conteneurs : WrapSpacer, GridSpacer, ScrollWidget |
| 3.5 | [Creation Programmatique](03-gui-system/05-programmatic-widgets.md) | Creer des widgets par code, GetWidgetUnderCursor, SetHandler |
| 3.6 | [Gestion des Evenements](03-gui-system/06-event-handling.md) | Callbacks d'UI : OnClick, OnChange, OnMouseEnter |
| 3.7 | [Styles, Polices et Images](03-gui-system/07-styles-fonts.md) | Polices disponibles, styles, chargement d'images |
| 3.8 | [Dialogues et Modaux](03-gui-system/08-dialogs-modals.md) | Creation de dialogues, menus modaux, confirmation |
| 3.9 | [Patterns UI Reels](03-gui-system/09-real-mod-patterns.md) | Patterns d'UI de COT, VPP, Expansion, Dabs Framework |
| 3.10 | [Widgets Avances](03-gui-system/10-advanced-widgets.md) | MapWidget, RenderTargetWidget, widgets specialises |

### Partie 4 : Formats de Fichier et Outils (8 chapitres)

| # | Chapitre | Description |
|---|----------|-------------|
| 4.1 | [Textures](04-file-formats/01-textures.md) | Formats .paa, .edds, .tga — conversion et utilisation |
| 4.2 | [Modeles 3D](04-file-formats/02-models.md) | Format .p3d, LODs, geometrie, points de memoire |
| 4.3 | [Materiaux](04-file-formats/03-materials.md) | Fichiers .rvmat, shaders, proprietes de surface |
| 4.4 | [Audio](04-file-formats/04-audio.md) | Formats .ogg et .wss, configuration du son |
| 4.5 | [DayZ Tools](04-file-formats/05-dayz-tools.md) | Flux de travail avec les DayZ Tools officiels |
| 4.6 | [Empaquetage PBO](04-file-formats/06-pbo-packing.md) | Creation et extraction de fichiers PBO |
| 4.7 | [Guide du Workbench](04-file-formats/07-workbench-guide.md) | Utilisation du Workbench pour l'edition de scripts et d'assets |
| 4.8 | [Modelisation de Batiments](04-file-formats/08-building-modeling.md) | Modelisation de batiments avec portes et echelles |

### Partie 5 : Fichiers de Configuration (6 chapitres)

| # | Chapitre | Description |
|---|----------|-------------|
| 5.1 | [stringtable.csv](05-config-files/01-stringtable.md) | Localisation avec stringtable.csv pour 13 langues |
| 5.2 | [inputs.xml](05-config-files/02-inputs-xml.md) | Configuration de touches et keybindings personnalises |
| 5.3 | [credits.json](05-config-files/03-credits-json.md) | Fichier de credits du mod |
| 5.4 | [ImageSets](05-config-files/04-imagesets.md) | Format ImageSet pour icones et sprites |
| 5.5 | [Configuration Serveur](05-config-files/05-server-configs.md) | Fichiers de configuration du serveur DayZ |
| 5.6 | [Configuration de Spawn](05-config-files/06-spawning-gear.md) | Configuration de l'equipement initial et des points de spawn |

### Partie 6 : Reference de l'API du Moteur (23 chapitres)

| # | Chapitre | Description |
|---|----------|-------------|
| 6.1 | [Systeme d'Entites](06-engine-api/01-entity-system.md) | Hierarchie d'entites, EntityAI, ItemBase, Object |
| 6.2 | [Systeme de Vehicules](06-engine-api/02-vehicles.md) | API vehicules, moteurs, fluides, simulation physique |
| 6.3 | [Systeme Meteorologique](06-engine-api/03-weather.md) | Controle de la meteo, pluie, brouillard, nebulosite |
| 6.4 | [Systeme de Cameras](06-engine-api/04-cameras.md) | Cameras personnalisees, position, rotation, transitions |
| 6.5 | [Effets de Post-Traitement](06-engine-api/05-ppe.md) | PPE : blur, aberration chromatique, gradation des couleurs |
| 6.6 | [Systeme de Notifications](06-engine-api/06-notifications.md) | Notifications a l'ecran, messages pour les joueurs |
| 6.7 | [Timers et CallQueue](06-engine-api/07-timers.md) | Minuteries, appels differes, repetition |
| 6.8 | [File I/O et JSON](06-engine-api/08-file-io.md) | Lecture/ecriture de fichiers, analyse JSON |
| 6.9 | [Reseau et RPC](06-engine-api/09-networking.md) | Communication reseau, RPCs, synchronisation client-serveur |
| 6.10 | [Economie Centrale](06-engine-api/10-central-economy.md) | Systeme de loot, categories, flags, min/max |
| 6.11 | [Mission Hooks](06-engine-api/11-mission-hooks.md) | Hooks de mission, MissionBase, MissionServer |
| 6.12 | [Systeme d'Actions](06-engine-api/12-action-system.md) | Actions du joueur, ActionBase, cibles, conditions |
| 6.13 | [Systeme d'Input](06-engine-api/13-input-system.md) | Capture de touches, mapping, UAInput |
| 6.14 | [Systeme de Joueur](06-engine-api/14-player-system.md) | PlayerBase, inventaire, vie, endurance, statistiques |
| 6.15 | [Systeme Sonore](06-engine-api/15-sound-system.md) | Lecture audio, SoundOnVehicle, environnements |
| 6.16 | [Systeme de Craft](06-engine-api/16-crafting-system.md) | Recettes de craft, ingredients, resultats |
| 6.17 | [Systeme de Construction](06-engine-api/17-construction-system.md) | Construction de bases, pieces, etats |
| 6.18 | [Systeme d'Animation](06-engine-api/18-animation-system.md) | Animation du joueur, command IDs, callbacks |
| 6.19 | [Requetes de Terrain](06-engine-api/19-terrain-queries.md) | Raycasts, position au sol, surfaces |
| 6.20 | [Effets de Particules](06-engine-api/20-particle-effects.md) | Systeme de particules, emetteurs, effets visuels |
| 6.21 | [Systeme Zombie et IA](06-engine-api/21-zombie-ai-system.md) | ZombieBase, IA des infectes, comportement |
| 6.22 | [Admin et Serveur](06-engine-api/22-admin-server.md) | Gestion de serveur, bans, kicks, RCON |
| 6.23 | [Systemes de Monde](06-engine-api/23-world-systems.md) | Heure du jour, date, fonctions du monde |

### Partie 7 : Patterns et Bonnes Pratiques (7 chapitres)

| # | Chapitre | Description |
|---|----------|-------------|
| 7.1 | [Pattern Singleton](07-patterns/01-singletons.md) | Instances uniques, acces global, initialisation |
| 7.2 | [Systemes de Modules](07-patterns/02-module-systems.md) | Enregistrement de modules, cycle de vie, CF modules |
| 7.3 | [Communication RPC](07-patterns/03-rpc-patterns.md) | Patterns pour RPCs securises et efficaces |
| 7.4 | [Persistance de Config](07-patterns/04-config-persistence.md) | Sauvegarder/charger des configurations JSON, versionnage |
| 7.5 | [Systemes de Permissions](07-patterns/05-permissions.md) | Permissions hierarchiques, wildcards, groupes |
| 7.6 | [Architecture Evenementielle](07-patterns/06-events.md) | Event bus, publish/subscribe, decouplage |
| 7.7 | [Optimisation des Performances](07-patterns/07-performance.md) | Profiling, cache, pooling, reduction des RPCs |

### Partie 8 : Tutoriels (13 chapitres)

| # | Chapitre | Description |
|---|----------|-------------|
| 8.1 | [Votre Premier Mod (Hello World)](08-tutorials/01-first-mod.md) | Tutoriel pas a pas : creer et charger un mod |
| 8.2 | [Creer un Item Personnalise](08-tutorials/02-custom-item.md) | Creer un item avec modele, texture et config |
| 8.3 | [Construire un Panneau Admin](08-tutorials/03-admin-panel.md) | UI admin avec teleport, spawn, gestion |
| 8.4 | [Ajouter des Commandes Chat](08-tutorials/04-chat-commands.md) | Commandes personnalisees dans le chat du jeu |
| 8.5 | [Utiliser le Template de Mod](08-tutorials/05-mod-template.md) | Comment utiliser le template officiel de mods DayZ |
| 8.6 | [Debogage et Tests](08-tutorials/06-debugging-testing.md) | Logs, debug, outils de diagnostic |
| 8.7 | [Publier sur le Workshop](08-tutorials/07-publishing-workshop.md) | Publier votre mod sur le Steam Workshop |
| 8.8 | [Construire un HUD Overlay](08-tutorials/08-hud-overlay.md) | Overlay HUD personnalise au-dessus du jeu |
| 8.9 | [Template de Mod Professionnel](08-tutorials/09-professional-template.md) | Template complet pret pour la production |
| 8.10 | [Creer un Mod de Vehicule](08-tutorials/10-vehicle-mod.md) | Vehicule personnalise avec physique et config |
| 8.11 | [Creer un Mod de Vetements](08-tutorials/11-clothing-mod.md) | Vetements personnalises avec textures et slots |
| 8.12 | [Construire un Systeme de Commerce](08-tutorials/12-trading-system.md) | Systeme de commerce entre joueurs/NPCs |
| 8.13 | [Reference du Diag Menu](08-tutorials/13-diag-menu.md) | Menus de diagnostic pour le developpement |

### Reference Rapide

| Page | Description |
|------|-------------|
| [Cheatsheet](cheatsheet.md) | Resume rapide de la syntaxe Enforce Script |
| [Reference Rapide de l'API](06-engine-api/quick-reference.md) | Methodes les plus utilisees de l'API du moteur |
| [Glossaire](glossary.md) | Definitions des termes utilises dans le modding DayZ |
| [FAQ](faq.md) | Questions frequemment posees sur le modding |
| [Guide de Depannage](troubleshooting.md) | 91 problemes courants avec solutions |

---

## Credits

| Developpeur | Projets | Contributions Principales |
|-------------|---------|---------------------------|
| [**Jacob_Mango**](https://github.com/Jacob-Mango) | Community Framework, COT | Systeme de modules, RPC, permissions, ESP |
| [**InclementDab**](https://github.com/InclementDab) | Dabs Framework, DayZ Editor, Mod Template | MVC, ViewBinding, UI de l'editeur |
| [**salutesh**](https://github.com/salutesh) | DayZ Expansion | Marche, groupes, marqueurs de carte, vehicules |
| [**Arkensor**](https://github.com/Arkensor) | DayZ Expansion | Economie centrale, versionnage des configs |
| [**DaOne**](https://github.com/Da0ne) | VPP Admin Tools | Gestion des joueurs, webhooks, ESP |
| [**GravityWolf**](https://github.com/GravityWolfNotAmused) | VPP Admin Tools | Permissions, gestion de serveur |
| [**Brian Orr (DrkDevil)**](https://github.com/DrkDevil) | Colorful UI | Themes de couleurs, patterns modded class UI |
| [**lothsun**](https://github.com/lothsun) | Colorful UI | Systemes de couleurs UI, amelioration visuelle |
| [**Bohemia Interactive**](https://github.com/BohemiaInteractive) | DayZ Engine & Samples | Enforce Script, scripts vanilla, DayZ Tools |
| [**StarDZ Team**](https://github.com/StarDZ-Team) | Ce Wiki | Documentation, traduction et organisation |

## Licence

La documentation est sous licence [**CC BY-SA 4.0**](https://creativecommons.org/licenses/by-sa/4.0/).
Les exemples de code sont sous licence [**MIT**](../LICENCE).
