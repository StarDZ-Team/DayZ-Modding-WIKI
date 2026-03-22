# DayZ Modding Glossary & Page Index

[Home](./README.md) | **Glossary & Index**

---

Une reference complete des termes utilises dans ce wiki et le modding DayZ.

---

## A

**Action** -- Une interaction joueur avec un objet ou le monde (manger, ouvrir des portes, reparer). Les actions sont construites en utilisant `ActionBase` avec des conditions et des etapes de callback. Voir [Chapitre 6.12](06-engine-api/12-action-system.md).

**Addon Builder** -- Application DayZ Tools qui empaquete les fichiers de mod dans des archives PBO. Gere la binarisation, la signature de fichiers et le mappage de prefixe. Voir [Chapitre 4.6](04-file-formats/06-pbo-packing.md).

**autoptr** -- Pointeur de reference forte a portee dans Enforce Script. L'objet reference est automatiquement detruit lorsque l'`autoptr` sort de la portee. Rarement utilise dans le modding DayZ (preferez `ref` explicite). Voir [Chapitre 1.8](01-enforce-script/08-memory-management.md).

---

## B

**Binarize** -- Processus de conversion des fichiers source (`config.cpp`, `.p3d`, `.tga`) en formats optimises pour le moteur (`.bin`, ODOL, `.paa`). Effectue automatiquement par Addon Builder ou l'outil Binarize dans DayZ Tools. Voir [Chapitre 4.6](04-file-formats/06-pbo-packing.md).

**bikey / biprivatekey / bisign** -- Voir [Signature de Cles](#k).

---

## C

**CallQueue** -- Utilitaire du moteur DayZ pour planifier des appels de fonction differes ou repetes. Accessible via `GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM)`. Voir [Chapitre 6.7](06-engine-api/07-timers.md).

**CastTo** -- Voir [Class.CastTo](#classcasto).

**Central Economy (CE)** -- Le systeme de distribution et de persistance du loot de DayZ. Configure via des fichiers XML (`types.xml`, `mapgrouppos.xml`, `cfglimitsdefinition.xml`) qui definissent ce qui apparait, ou et a quelle frequence. Voir [Chapitre 6.10](06-engine-api/10-central-economy.md).

**CfgMods** -- Classe de premier niveau dans config.cpp qui enregistre un mod aupres du moteur. Definit le nom du mod, les repertoires de script, les dependances requises et l'ordre de chargement des addons. Voir [Chapitre 2.2](02-mod-structure/02-config-cpp.md).

**CfgPatches** -- Classe config.cpp qui enregistre des addons individuels (packages de scripts, modeles, textures) au sein d'un mod. Le tableau `requiredAddons[]` controle l'ordre de chargement entre les mods. Voir [Chapitre 2.2](02-mod-structure/02-config-cpp.md).

**CfgVehicles** -- Hierarchie de classes config.cpp qui definit toutes les entites du jeu : objets, batiments, vehicules, animaux et joueurs. Malgre le nom, elle contient bien plus que des vehicules. Voir [Chapitre 2.2](02-mod-structure/02-config-cpp.md).

**Class.CastTo** -- Methode statique pour le downcasting securise dans Enforce Script. Retourne `true` si le cast reussit. Necessaire car Enforce Script n'a pas de mot-cle `as`. Utilisation : `Class.CastTo(result, source)`. Voir [Chapitre 1.9](01-enforce-script/09-casting-reflection.md).

**CommunityFramework (CF)** -- Mod framework tiers par Jacob_Mango fournissant la gestion du cycle de vie des modules, le logging, les helpers RPC, les utilitaires d'E/S fichier et les structures de donnees a liste doublement chainee. De nombreux mods populaires en dependent. Voir [Chapitre 7.2](07-patterns/02-module-systems.md).

**config.cpp** -- Le fichier de configuration central pour chaque mod DayZ. Definit `CfgPatches`, `CfgMods`, `CfgVehicles` et autres hierarchies de classes que le moteur lit au demarrage. Ce n'est PAS du code C++ malgre l'extension. Voir [Chapitre 2.2](02-mod-structure/02-config-cpp.md).

---

## D

**DamageSystem** -- Sous-systeme du moteur qui gere l'enregistrement des coups, les zones de degats, les valeurs sante/sang/choc et les calculs d'armure sur les entites. Configure via la classe `DamageSystem` du config.cpp avec des zones et des composants de coup. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

**DayZ Tools** -- Application Steam gratuite contenant le kit d'outils de modding officiel : Object Builder, Terrain Builder, Addon Builder, TexView2, Workbench et gestion du lecteur P:. Voir [Chapitre 4.5](04-file-formats/05-dayz-tools.md).

**DayZPlayer** -- Classe de base pour toutes les entites joueur dans le moteur. Fournit l'acces aux systemes de mouvement, animation, inventaire et entree. `PlayerBase` etend cette classe et est le point d'entree typique pour le modding. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

**Dedicated Server** (Serveur Dedie) -- Processus serveur autonome sans interface (`DayZServer_x64.exe`) utilise pour l'hebergement multijoueur. Execute uniquement les scripts cote serveur. A opposer au [Listen Server](#l).

---

## E

**EEInit** -- Methode d'evenement du moteur appelee lorsqu'une entite est initialisee apres creation. Surchargez-la dans votre classe d'entite pour effectuer la logique de configuration. Appelee sur le client et le serveur. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

**EEKilled** -- Methode d'evenement du moteur appelee lorsque la sante d'une entite atteint zero. Utilisee pour la logique de mort, le loot drop et le suivi des kills. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

**EEHitBy** -- Methode d'evenement du moteur appelee lorsqu'une entite recoit des degats. Les parametres incluent la source de degats, le composant touche, le type de degats et les zones de degats. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

**EEItemAttached** -- Methode d'evenement du moteur appelee lorsqu'un objet est attache a un slot d'inventaire d'une entite (par ex. attacher une lunette a une arme). Couplee avec `EEItemDetached`. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

**Enforce Script** -- Langage de script proprietaire de Bohemia Interactive utilise dans DayZ et les jeux du moteur Enfusion. Syntaxe similaire au C#, mais avec des limitations uniques (pas de ternaire, pas de try/catch, pas de lambdas). Voir [Partie 1](01-enforce-script/01-variables-types.md).

**EntityAI** -- Classe de base pour toutes les entites "intelligentes" dans DayZ (joueurs, animaux, zombies, objets). Etend `Entity` avec inventaire, systeme de degats et interfaces IA. La plupart du modding d'objets et de personnages commence ici. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

**EventBus** -- Un patron publication-abonnement pour la communication decouplee entre systemes. Les modules s'abonnent a des evenements nommes et recoivent des callbacks quand les evenements sont emis, sans dependances directes. Voir [Chapitre 7.6](07-patterns/06-events.md).

---

## F

**File Patching** -- Parametre de lancement (`-filePatching`) qui permet au moteur de charger des fichiers non empaquetes depuis le lecteur P: au lieu de PBOs empaquetes. Essentiel pour une iteration de developpement rapide. Doit etre active sur le client et le serveur. Voir [Chapitre 4.6](04-file-formats/06-pbo-packing.md).

**Fire Geometry** -- LOD specialise dans un modele 3D (`.p3d`) qui definit les surfaces ou les balles peuvent impacter et infliger des degats. Distinct du View Geometry et du Geometry LOD. Voir [Chapitre 4.2](04-file-formats/02-models.md).

---

## G

**GameInventory** -- Classe du moteur gerant le systeme d'inventaire d'une entite. Fournit des methodes pour ajouter, supprimer, trouver et transferer des objets entre conteneurs et slots. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

**GetGame()** -- Fonction globale retournant le singleton `CGame`. Point d'entree pour acceder a la mission, aux joueurs, aux files d'attente d'appels, aux RPC, a la meteo et aux autres systemes du moteur. Disponible partout dans le script. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

**GetUApi()** -- Fonction globale retournant le singleton `UAInputAPI` pour le systeme d'entree. Utilisee pour enregistrer et interroger les raccourcis clavier personnalises. Voir [Chapitre 6.13](06-engine-api/13-input-system.md).

**Geometry LOD** -- Niveau de detail du modele 3D utilise pour la detection de collision physique (mouvement joueur, physique vehicule). Separe du View Geometry et du Fire Geometry. Voir [Chapitre 4.2](04-file-formats/02-models.md).

**Guard Clause** (Clause de Garde) -- Patron de programmation defensive : verifier les preconditions au debut d'une methode et retourner tot si elles echouent. Essentiel dans Enforce Script car il n'y a pas de try/catch. Voir [Chapitre 1.11](01-enforce-script/11-error-handling.md).

---

## H

**Hidden Selections** -- Slots de texture/materiau nommes sur un modele 3D qui peuvent etre changes a l'execution via script. Utilises pour les variantes de camouflage, les couleurs d'equipe, les etats de degats et les changements d'apparence dynamiques. Definis dans config.cpp et les selections nommees du modele. Voir [Chapitre 4.2](04-file-formats/02-models.md).

**HUD** -- Affichage tete haute : elements d'interface a l'ecran visibles pendant le jeu (indicateurs de sante, barre rapide, boussole, notifications). Construit en utilisant des fichiers `.layout` et des classes de widget scriptees. Voir [Chapitre 3.1](03-gui-system/01-widget-types.md).

---

## I

**IEntity** -- L'interface d'entite de plus bas niveau dans le moteur Enfusion. Fournit l'acces a la transformation (position/rotation), au visuel et a la physique. La plupart des moddeurs travaillent avec `EntityAI` ou des classes superieures. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

**ImageSet** -- Fichier XML (`.imageset`) definissant des regions rectangulaires nommees au sein d'un atlas de texture (`.edds` ou `.paa`). Utilise pour referencer des icones, des graphiques de boutons et des elements d'interface sans fichiers image separes. Voir [Chapitre 5.4](05-config-files/04-imagesets.md).

**InventoryLocation** -- Classe du moteur decrivant une position specifique dans le systeme d'inventaire : quelle entite, quel slot, quelle ligne/colonne du cargo. Utilisee pour la manipulation et les transferts precis d'inventaire. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

**ItemBase** -- La classe de base standard pour tous les objets en jeu (etend `EntityAI`). Armes, outils, nourriture, vetements, conteneurs et accessoires heritent tous de `ItemBase`. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

---

## J

**JsonFileLoader** -- Classe utilitaire du moteur pour charger et sauvegarder des fichiers JSON dans Enforce Script. Piege important : `JsonLoadFile()` retourne `void` -- vous devez passer un objet pre-alloue par reference, pas assigner la valeur de retour. Voir [Chapitre 6.8](06-engine-api/08-file-io.md).

---

## K

**Signature de Cles (.bikey, .biprivatekey, .bisign)** -- Le systeme de verification de mod de DayZ. Un `.biprivatekey` est utilise pour signer les PBOs (produisant des fichiers `.bisign`). La cle publique `.bikey` correspondante est placee dans le dossier `keys/` du serveur. Les serveurs ne chargent que les mods dont les signatures correspondent a une cle installee. Voir [Chapitre 4.6](04-file-formats/06-pbo-packing.md).

---

## L

**Layout (fichier .layout)** -- Fichier de definition d'interface base sur XML utilise par le systeme GUI de DayZ. Definit la hierarchie des widgets, le positionnement, le dimensionnement et les proprietes de style. Charge a l'execution avec `GetGame().GetWorkspace().CreateWidgets()`. Voir [Chapitre 3.2](03-gui-system/02-layout-files.md).

**Listen Server** -- Un serveur heberge dans le client de jeu (le joueur agit comme serveur et client). Utile pour les tests en solo. Certains chemins de code different des serveurs dedies -- testez toujours les deux. Voir [Chapitre 8.1](08-tutorials/01-first-mod.md).

**LOD (Level of Detail)** (Niveau de Detail) -- Versions multiples d'un modele 3D a differents nombres de polygones. Le moteur bascule entre eux en fonction de la distance de la camera pour optimiser les performances. Les modeles DayZ ont aussi des LODs a usage special : Geometry, Fire Geometry, View Geometry, Memory et Shadow. Voir [Chapitre 4.2](04-file-formats/02-models.md).

---

## M

**Managed** -- Mot-cle Enforce Script indiquant une classe dont les instances sont comptees par reference et collectees automatiquement par le ramasse-miettes. La plupart des classes DayZ heritent de `Managed`. A opposer a `Class` (gere manuellement). Voir [Chapitre 1.8](01-enforce-script/08-memory-management.md).

**Memory Point** -- Point nomme incorpore dans le LOD Memory d'un modele 3D. Utilise par les scripts pour localiser des positions sur un objet (origine du flash de bouche, points d'attache, positions de proxy). Accessible via `GetMemoryPointPosition()`. Voir [Chapitre 4.2](04-file-formats/02-models.md).

**Mission (MissionServer / MissionGameplay)** -- Le controleur d'etat de jeu de plus haut niveau. `MissionServer` s'execute sur le serveur, `MissionGameplay` s'execute sur le client. Surchargez ceux-ci pour accrocher au demarrage du jeu, aux connexions joueur et a l'arret. Voir [Chapitre 6.11](06-engine-api/11-mission-hooks.md).

**mod.cpp** -- Fichier place dans le dossier racine d'un mod qui definit ses metadonnees Steam Workshop : nom, auteur, description, icone et URL d'action. A ne pas confondre avec `config.cpp`. Voir [Chapitre 2.3](02-mod-structure/03-mod-cpp.md).

**Modded Class** (Classe Moddee) -- Mecanisme Enforce Script (`modded class X extends X`) pour etendre ou surcharger des classes existantes sans modifier les fichiers originaux. Le moteur chaine toutes les definitions de classes moddees ensemble. C'est le principal moyen d'interaction des mods avec le vanilla et les autres mods. Voir [Chapitre 1.4](01-enforce-script/04-modded-classes.md).

**Module** -- Une unite de fonctionnalite autonome enregistree aupres d'un gestionnaire de modules (comme le `PluginManager` de CF). Les modules ont des methodes de cycle de vie (`OnInit`, `OnUpdate`, `OnMissionFinish`) et sont l'architecture standard pour les systemes de mod. Voir [Chapitre 7.2](07-patterns/02-module-systems.md).

---

## N

**Named Selection** (Selection Nommee) -- Un groupe nomme de vertices/faces dans un modele 3D, cree dans Object Builder. Utilise pour les Hidden Selections (echange de textures), les zones de degats et les cibles d'animation. Voir [Chapitre 4.2](04-file-formats/02-models.md).

**Net Sync Variable** -- Une variable automatiquement synchronisee du serveur vers tous les clients par le systeme de replication reseau du moteur. Enregistree via les methodes `RegisterNetSyncVariable*()` et recue dans `OnVariablesSynchronized()`. Voir [Chapitre 6.9](06-engine-api/09-networking.md).

**notnull** -- Modificateur de parametre Enforce Script qui indique au compilateur qu'un parametre de reference ne doit pas etre `null`. Fournit une securite au moment de la compilation et documente l'intention. Utilisation : `void DoWork(notnull MyClass obj)`. Voir [Chapitre 1.3](01-enforce-script/03-classes-inheritance.md).

---

## O

**Object Builder** -- Application DayZ Tools pour creer et editer des modeles 3D (`.p3d`). Utilise pour definir les LODs, les selections nommees, les points memoire et les composants de geometrie. Voir [Chapitre 4.5](04-file-formats/05-dayz-tools.md).

**OnInit** -- Methode de cycle de vie appelee lorsqu'un module ou plugin est initialise pour la premiere fois. Utilisee pour l'enregistrement, l'abonnement aux evenements et la configuration unique. Voir [Chapitre 7.2](07-patterns/02-module-systems.md).

**OnUpdate** -- Methode de cycle de vie appelee a chaque frame (ou a intervalle fixe) sur les modules et certaines entites. A utiliser avec parcimonie -- le code par frame est un souci de performance. Voir [Chapitre 7.7](07-patterns/07-performance.md).

**OnMissionFinish** -- Methode de cycle de vie appelee lorsqu'une mission se termine (arret du serveur, deconnexion). Utilisee pour le nettoyage, la sauvegarde d'etat et la liberation des ressources. Voir [Chapitre 6.11](06-engine-api/11-mission-hooks.md).

**Override** (Surcharge) -- Le mot-cle `override` dans Enforce Script, marquant une methode qui remplace une methode de la classe parente. Requis (ou fortement recommande) lors de la surcharge de methodes virtuelles. Appelez toujours `super.MethodName()` pour preserver le comportement parent sauf si vous voulez intentionnellement le remplacer. Voir [Chapitre 1.3](01-enforce-script/03-classes-inheritance.md).

---

## P

**Lecteur P: (Workdrive)** -- Lettre de lecteur virtuel mappee par DayZ Tools vers le repertoire de votre projet de mod. Le moteur utilise les chemins `P:\` en interne pour localiser les fichiers source pendant le developpement. Configure via DayZ Tools ou des commandes manuelles `subst`. Voir [Chapitre 4.5](04-file-formats/05-dayz-tools.md).

**PAA** -- Format de texture proprietaire de Bohemia (`.paa`). Converti depuis les fichiers source `.tga` ou `.png` en utilisant TexView2 ou l'etape de binarisation d'Addon Builder. Supporte la compression DXT1, DXT5 et ARGB. Voir [Chapitre 4.1](04-file-formats/01-textures.md).

**PBO** -- Packed Bohemia Object (`.pbo`) : le format d'archive pour distribuer le contenu des mods DayZ. Contient scripts, configs, textures, modeles et fichiers de donnees. Construit avec Addon Builder ou des outils tiers. Voir [Chapitre 4.6](04-file-formats/06-pbo-packing.md).

**PlayerBase** -- La classe d'entite joueur principale avec laquelle les moddeurs travaillent. Etend `DayZPlayer` et fournit l'acces a l'inventaire, aux degats, aux effets de statut et a toutes les fonctionnalites liees au joueur. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

**PlayerIdentity** -- Classe du moteur contenant les metadonnees d'un joueur connecte : Steam UID, nom, ID reseau et ping. Accessible cote serveur depuis `PlayerBase.GetIdentity()`. Essentiel pour les outils d'administration et la persistance. Voir [Chapitre 6.9](06-engine-api/09-networking.md).

**PPE (Post-Process Effects)** (Effets Post-Traitement) -- Systeme du moteur pour les effets visuels en espace ecran : flou, correction des couleurs, aberration chromatique, vignette, grain de film. Controle via les classes `PPERequester`. Voir [Chapitre 6.5](06-engine-api/05-ppe.md).

**Print** -- Fonction integree pour la sortie de texte vers le log de script (fichiers log `%localappdata%/DayZ/`). Utile pour le debogage mais doit etre supprime ou protege dans le code de production. Voir [Chapitre 1.11](01-enforce-script/11-error-handling.md).

**Proto Native** -- Les fonctions declarees avec `proto native` sont implementees dans le moteur C++, pas dans le script. Elles font le pont entre Enforce Script et les internes du moteur et ne peuvent pas etre surchargees. Voir [Chapitre 1.3](01-enforce-script/03-classes-inheritance.md).

---

## Q

**Quaternion** -- Representation de rotation a quatre composants utilisee en interne par le moteur. En pratique, les moddeurs DayZ travaillent generalement avec les angles d'Euler (`vector` de pitch/yaw/roll) et le moteur convertit en interne. Voir [Chapitre 1.7](01-enforce-script/07-math-vectors.md).

---

## R

**ref** -- Mot-cle Enforce Script declarant une reference forte vers un objet gere. Empeche la collecte des dechets tant que la reference existe. Utilisez `ref` pour la possession ; les references brutes pour les pointeurs non possedants. Attention aux cycles de `ref` (A reference B, B reference A) qui causent des fuites memoire. Voir [Chapitre 1.8](01-enforce-script/08-memory-management.md).

**requiredAddons** -- Tableau dans `CfgPatches` specifiant quels addons doivent se charger avant le votre. Controle l'ordre de compilation des scripts et d'heritage des configs entre mods. Se tromper cause des erreurs "missing class" ou des echecs de chargement silencieux. Voir [Chapitre 2.2](02-mod-structure/02-config-cpp.md).

**RPC (Remote Procedure Call)** (Appel de Procedure Distante) -- Mecanisme pour envoyer des donnees entre serveur et client. DayZ fournit `GetGame().RPCSingleParam()` et `ScriptRPC` pour la communication personnalisee. Necessite un emetteur et un recepteur correspondants sur la bonne machine. Voir [Chapitre 6.9](06-engine-api/09-networking.md).

**RVMAT** -- Fichier de definition de materiau (`.rvmat`) utilise par le renderer de DayZ. Specifie les textures, shaders et proprietes de surface pour les modeles 3D. Voir [Chapitre 4.3](04-file-formats/03-materials.md).

---

## S

**Scope (config)** -- Valeur entiere dans `CfgVehicles` controlant la visibilite de l'objet : `0` = cache/abstrait (ne spawn jamais), `1` = accessible uniquement via script, `2` = visible en jeu et spawnable par le Central Economy. Voir [Chapitre 2.2](02-mod-structure/02-config-cpp.md).

**ScriptRPC** -- Classe Enforce Script pour construire et envoyer des messages RPC personnalises. Permet d'ecrire plusieurs parametres (ints, floats, strings, vectors) dans un seul paquet reseau. Voir [Chapitre 6.9](06-engine-api/09-networking.md).

**SEffectManager** -- Gestionnaire singleton pour les effets visuels et sonores. Gere la creation de particules, la lecture de sons et le cycle de vie des effets. Utilisez `SEffectManager.PlayInWorld()` pour les effets positionnes. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

**Singleton** -- Patron de conception garantissant qu'une seule instance d'une classe existe. Dans Enforce Script, generalement implemente avec une methode statique `GetInstance()` stockant l'instance dans une variable `static ref`. Voir [Chapitre 7.1](07-patterns/01-singletons.md).

**Slot** -- Un point d'attache nomme sur une entite (ex. `"Shoulder"`, `"Hands"`, `"Slot_Magazine"`). Defini dans config.cpp sous `InventorySlots` et le tableau `attachments[]` de l'entite. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

**stringtable.csv** -- Fichier CSV fournissant des chaines localisees pour jusqu'a 13 langues. Reference dans le code via des cles prefixees `#STR_`. Le moteur selectionne automatiquement la bonne colonne de langue. Voir [Chapitre 5.1](05-config-files/01-stringtable.md).

**super** -- Mot-cle utilise dans une surcharge de methode pour appeler l'implementation de la classe parente. Appelez toujours `super.MethodName()` dans les methodes surchargees sauf si vous voulez intentionnellement ignorer la logique parente. Voir [Chapitre 1.3](01-enforce-script/03-classes-inheritance.md).

---

## T

**TexView2** -- Utilitaire DayZ Tools pour visualiser et convertir les textures entre les formats `.tga`, `.png`, `.paa` et `.edds`. Aussi utilise pour inspecter la compression PAA, les mipmaps et les canaux alpha. Voir [Chapitre 4.5](04-file-formats/05-dayz-tools.md).

**typename** -- Type Enforce Script representant une reference de classe a l'execution. Utilise pour la reflection, les patrons de fabrique et la verification de type dynamique. Obtenu depuis une instance avec `obj.Type()` ou directement depuis un nom de classe : `typename t = PlayerBase;`. Voir [Chapitre 1.9](01-enforce-script/09-casting-reflection.md).

**types.xml** -- Fichier XML du Central Economy definissant le nombre nominal, la duree de vie, le comportement de restock, les categories de spawn et les zones de tier de chaque objet spawnable. Situe dans le dossier `db/` de la mission. Voir [Chapitre 6.10](06-engine-api/10-central-economy.md).

---

## U

**UAInput** -- Classe du moteur representant une seule action d'entree (raccourci clavier). Creee depuis `GetUApi().RegisterInput()` et utilisee pour detecter les appuis, maintiens et relachements de touches. Definie avec `inputs.xml`. Voir [Chapitre 6.13](06-engine-api/13-input-system.md).

**Unlink** -- Methode pour detruire et dereferencier de maniere securisee un objet gere. Preferee au simple `null` quand vous avez besoin d'un nettoyage immediat. Appelee comme `GetGame().ObjectDelete(obj)` pour les entites. Voir [Chapitre 1.8](01-enforce-script/08-memory-management.md).

---

## V

**View Geometry** -- LOD du modele 3D utilise pour les tests d'occlusion visuelle (verifications de la vue de l'IA, ligne de vue du joueur). Determine si un objet bloque la vision. Separe du Geometry LOD (collision) et du Fire Geometry (balistique). Voir [Chapitre 4.2](04-file-formats/02-models.md).

---

## W

**Widget** -- Classe de base pour tous les elements d'interface dans le systeme GUI de DayZ. Les sous-types incluent `TextWidget`, `ImageWidget`, `ButtonWidget`, `EditBoxWidget`, `ScrollWidget` et les types conteneurs comme `WrapSpacerWidget`. Voir [Chapitre 3.1](03-gui-system/01-widget-types.md).

**Workbench** -- IDE DayZ Tools pour editer les scripts, les configs et executer le jeu en mode developpement. Fournit la compilation de scripts, les points d'arret et le Resource Browser. Voir [Chapitre 4.5](04-file-formats/05-dayz-tools.md).

**WrapSpacer** -- Widget conteneur qui dispose ses enfants en lignes/colonnes (comme le CSS flexbox wrap). Essentiel pour les listes dynamiques, les grilles d'inventaire et tout layout ou le nombre d'enfants varie. Voir [Chapitre 3.4](03-gui-system/04-containers.md).

---

## X

**XML Configs** -- Terme collectif pour les nombreux fichiers de configuration XML utilises par les serveurs DayZ : `types.xml`, `globals.xml`, `economy.xml`, `events.xml`, `cfglimitsdefinition.xml`, `mapgrouppos.xml` et autres. Voir [Chapitre 6.10](06-engine-api/10-central-economy.md).

---

## Z

**Zone (Zone de Degats)** -- Une region nommee sur le modele d'une entite qui recoit un suivi de sante independant. Definie dans config.cpp sous `DamageSystem` avec `class DamageZones`. Zones courantes sur les joueurs : `Head`, `Torso`, `LeftArm`, `LeftLeg`, etc. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

---

*Un terme manque ? Ouvrez une issue ou soumettez une pull request.*
