# Foire Aux Questions

[Accueil](../README.md) | **FAQ**

---

## Pour Commencer

### Q : De quoi ai-je besoin pour commencer le modding DayZ ?
**R :** Vous avez besoin de Steam, DayZ (copie commerciale), DayZ Tools (gratuit sur Steam dans la section Outils), et un editeur de texte (VS Code recommande). Aucune experience en programmation n'est strictement requise -- commencez par le [Chapitre 8.1 : Votre Premier Mod](08-tutorials/01-first-mod.md). DayZ Tools inclut Object Builder, Addon Builder, TexView2, et l'IDE Workbench.

### Q : Quel langage de programmation DayZ utilise-t-il ?
**R :** DayZ utilise **Enforce Script**, un langage proprietaire de Bohemia Interactive. Il a une syntaxe similaire au C#, mais avec ses propres regles et limitations (pas d'operateur ternaire, pas de try/catch, pas de lambdas). Voir [Partie 1 : Enforce Script](01-enforce-script/01-variables-types.md) pour un guide complet du langage.

### Q : Comment configurer le lecteur P: ?
**R :** Ouvrez DayZ Tools depuis Steam, cliquez sur "Workdrive" ou "Setup Workdrive" pour monter le lecteur P:. Cela cree un lecteur virtuel pointant vers votre espace de travail de modding ou le moteur cherche les fichiers source pendant le developpement. Vous pouvez aussi utiliser `subst P: "C:\Votre\Chemin"` en ligne de commande. Voir [Chapitre 4.5](04-file-formats/05-dayz-tools.md).

### Q : Puis-je tester mon mod sans serveur dedie ?
**R :** Oui. Lancez DayZ avec le parametre `-filePatching` et votre mod charge. Pour des tests rapides, utilisez un Listen Server (hebergez depuis le menu en jeu). Pour les tests de production, verifiez toujours aussi sur un serveur dedie, car certains chemins de code different. Voir [Chapitre 8.1](08-tutorials/01-first-mod.md).

### Q : Ou trouver les fichiers de script vanilla de DayZ pour les etudier ?
**R :** Apres avoir monte le lecteur P: via DayZ Tools, les scripts vanilla se trouvent dans `P:\DZ\scripts\` organises par couche (`3_Game`, `4_World`, `5_Mission`). Ce sont la reference faisant autorite pour chaque classe, methode et evenement du moteur. Voir aussi le [Cheat Sheet](cheatsheet.md) et la [Reference Rapide API](06-engine-api/quick-reference.md).

---

## Erreurs Courantes et Corrections

### Q : Mon mod se charge mais rien ne se passe. Pas d'erreurs dans le log.
**R :** Tres probablement votre `config.cpp` a une entree `requiredAddons[]` incorrecte, donc vos scripts se chargent trop tot ou pas du tout. Verifiez que chaque nom d'addon dans `requiredAddons` correspond exactement a un nom de classe `CfgPatches` existant (sensible a la casse). Verifiez le log de script dans `%localappdata%/DayZ/` pour les avertissements silencieux. Voir [Chapitre 2.2](02-mod-structure/02-config-cpp.md).

### Q : J'obtiens des erreurs "Cannot find variable" ou "Undefined variable".
**R :** Cela signifie generalement que vous referencez une classe ou variable d'une couche de script superieure. Les couches inferieures (`3_Game`) ne peuvent pas voir les types definis dans les couches superieures (`4_World`, `5_Mission`). Deplacez votre definition de classe vers la couche correcte, ou utilisez la reflection `typename` pour un couplage lache. Voir [Chapitre 2.1](02-mod-structure/01-five-layers.md).

### Q : Pourquoi `JsonFileLoader<T>.JsonLoadFile()` ne retourne-t-il pas mes donnees ?
**R :** `JsonLoadFile()` retourne `void`, pas l'objet charge. Vous devez pre-allouer votre objet et le passer comme parametre de reference : `ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`. Assigner la valeur de retour donne silencieusement `null`. Voir [Chapitre 6.8](06-engine-api/08-file-io.md).

### Q : Mon RPC est envoye mais jamais recu de l'autre cote.
**R :** Verifiez ces causes courantes : (1) L'ID RPC ne correspond pas entre l'emetteur et le recepteur. (2) Vous envoyez du client mais ecoutez sur le client (ou serveur vers serveur). (3) Vous avez oublie d'enregistrer le gestionnaire RPC dans `OnRPC()` ou votre gestionnaire personnalise. (4) L'entite cible est `null` ou n'est pas synchronisee sur le reseau. Voir [Chapitre 6.9](06-engine-api/09-networking.md) et [Chapitre 7.3](07-patterns/03-rpc-patterns.md).

### Q : J'obtiens "Error: Member already defined" dans un bloc else-if.
**R :** Enforce Script ne permet pas la redeclaration de variable dans des blocs `else if` freres au sein de la meme portee. Declarez la variable une seule fois avant la chaine `if`, ou utilisez des portees separees avec des accolades. Voir [Chapitre 1.12](01-enforce-script/12-gotchas.md).

### Q : Mon layout UI n'affiche rien / les widgets sont invisibles.
**R :** Causes courantes : (1) Le widget a une taille nulle -- verifiez que la largeur/hauteur sont correctement definies (pas de valeurs negatives). (2) Le widget n'est pas `Show(true)`. (3) L'alpha de la couleur du texte est 0 (completement transparent). (4) Le chemin du layout dans `CreateWidgets()` est incorrect (aucune erreur n'est levee, il retourne juste `null`). Voir [Chapitre 3.3](03-gui-system/03-sizing-positioning.md).

### Q : Mon mod provoque un crash au demarrage du serveur.
**R :** Verifiez : (1) Appel de methodes client-only (`GetGame().GetPlayer()`, code UI) sur le serveur. (2) Reference `null` dans `OnInit` ou `OnMissionStart` avant que le monde soit pret. (3) Recursion infinie dans un override de `modded class` qui a oublie d'appeler `super`. Ajoutez toujours des clauses de garde car il n'y a pas de try/catch. Voir [Chapitre 1.11](01-enforce-script/11-error-handling.md).

### Q : Les caracteres barre oblique inverse ou guillemet dans mes chaines causent des erreurs d'analyse.
**R :** L'analyseur d'Enforce Script (CParser) ne supporte pas les sequences d'echappement `\\` ou `\"` dans les literaux de chaine. Evitez completement les barres obliques inverses. Pour les chemins de fichiers, utilisez des barres obliques (`"my/path/file.json"`). Pour les guillemets dans les chaines, utilisez des caracteres apostrophe ou la concatenation de chaines. Voir [Chapitre 1.12](01-enforce-script/12-gotchas.md).

---

## Decisions d'Architecture

### Q : Qu'est-ce que la hierarchie de script a 5 couches et pourquoi est-elle importante ?
**R :** Les scripts DayZ se compilent en cinq couches numerotees : `1_Core`, `2_GameLib`, `3_Game`, `4_World`, `5_Mission`. Chaque couche ne peut referencer que les types de la meme couche ou des couches de numero inferieur. Cela impose des frontieres architecturales -- placez les enums et constantes partagees dans `3_Game`, la logique d'entite dans `4_World`, et les hooks UI/mission dans `5_Mission`. Voir [Chapitre 2.1](02-mod-structure/01-five-layers.md).

### Q : Dois-je utiliser `modded class` ou creer de nouvelles classes ?
**R :** Utilisez `modded class` lorsque vous devez modifier ou etendre un comportement vanilla existant (ajouter une methode a `PlayerBase`, accrocher dans `MissionServer`). Creez de nouvelles classes pour des systemes autonomes qui n'ont pas besoin de surcharger quoi que ce soit. Les classes modded se chainent automatiquement -- appelez toujours `super` pour eviter de casser d'autres mods. Voir [Chapitre 1.4](01-enforce-script/04-modded-classes.md).

### Q : Comment dois-je organiser le code client vs serveur ?
**R :** Utilisez les gardes preprocesseur `#ifdef SERVER` et `#ifdef CLIENT` pour le code qui ne doit s'executer que d'un cote. Pour les mods plus importants, separez en PBOs distincts : un mod client (UI, rendu, effets locaux) et un mod serveur (spawn, logique, persistance). Cela empeche la fuite de logique serveur vers les clients. Voir [Chapitre 2.5](02-mod-structure/05-file-organization.md) et [Chapitre 6.9](06-engine-api/09-networking.md).

### Q : Quand dois-je utiliser un Singleton vs un Module/Plugin ?
**R :** Utilisez un Module (enregistre avec le `PluginManager` de CF ou votre propre systeme de modules) lorsque vous avez besoin de gestion du cycle de vie (`OnInit`, `OnUpdate`, `OnMissionFinish`). Utilisez un Singleton autonome pour des services utilitaires sans etat qui ont juste besoin d'un acces global. Les modules sont preferes pour tout ce qui a un etat ou des besoins de nettoyage. Voir [Chapitre 7.1](07-patterns/01-singletons.md) et [Chapitre 7.2](07-patterns/02-module-systems.md).

### Q : Comment stocker en securite des donnees par joueur qui survivent aux redemarrages du serveur ?
**R :** Sauvegardez des fichiers JSON dans le repertoire `$profile:` du serveur en utilisant `JsonFileLoader`. Utilisez le Steam UID du joueur (depuis `PlayerIdentity.GetId()`) comme nom de fichier. Chargez a la connexion du joueur, sauvegardez a la deconnexion et periodiquement. Gerez toujours gracieusement les fichiers manquants/corrompus avec des clauses de garde. Voir [Chapitre 7.4](07-patterns/04-config-persistence.md) et [Chapitre 6.8](06-engine-api/08-file-io.md).

---

## Publication et Distribution

### Q : Comment empaqueter mon mod dans un PBO ?
**R :** Utilisez Addon Builder (de DayZ Tools) ou des outils tiers comme PBO Manager. Pointez-le vers le dossier source de votre mod, definissez le prefixe correct (correspondant au prefixe addon de votre `config.cpp`), et construisez. Le fichier `.pbo` resultant va dans le dossier `Addons/` de votre mod. Voir [Chapitre 4.6](04-file-formats/06-pbo-packing.md).

### Q : Comment signer mon mod pour une utilisation serveur ?
**R :** Generez une paire de cles avec DSSignFile ou DSCreateKey de DayZ Tools : cela produit un `.biprivatekey` et un `.bikey`. Signez chaque PBO avec la cle privee (cree des fichiers `.bisign` a cote de chaque PBO). Distribuez le `.bikey` aux administrateurs de serveur pour leur dossier `keys/`. Ne partagez jamais votre `.biprivatekey`. Voir [Chapitre 4.6](04-file-formats/06-pbo-packing.md).

### Q : Comment publier sur le Steam Workshop ?
**R :** Utilisez le Publisher de DayZ Tools ou l'uploader du Steam Workshop. Vous avez besoin d'un fichier `mod.cpp` a la racine de votre mod definissant le nom, l'auteur et la description. Le publisher televerse vos PBOs empaquetes, et Steam attribue un ID Workshop. Mettez a jour en republiant depuis le meme compte. Voir [Chapitre 2.3](02-mod-structure/03-mod-cpp.md) et [Chapitre 8.7](08-tutorials/07-publishing-workshop.md).

### Q : Mon mod peut-il necessiter d'autres mods comme dependances ?
**R :** Oui. Dans `config.cpp`, ajoutez le nom de classe `CfgPatches` du mod dependance a votre tableau `requiredAddons[]`. Dans `mod.cpp`, il n'y a pas de systeme de dependance formel -- documentez les mods requis dans votre description Workshop. Les joueurs doivent s'abonner et charger tous les mods requis. Voir [Chapitre 2.2](02-mod-structure/02-config-cpp.md).

---

## Sujets Avances

### Q : Comment creer des actions joueur personnalisees (interactions) ?
**R :** Etendez `ActionBase` (ou une sous-classe comme `ActionInteractBase`), definissez `CreateConditionComponents()` pour les preconditions, surchargez `OnStart`/`OnExecute`/`OnEnd` pour la logique, et enregistrez-la dans `SetActions()` sur l'entite cible. Les actions supportent les modes continu (maintien) et instantane (clic). Voir [Chapitre 6.12](06-engine-api/12-action-system.md).

### Q : Comment fonctionne le systeme de degats pour les objets personnalises ?
**R :** Definissez une classe `DamageSystem` dans le config.cpp de votre objet avec des `DamageZones` (regions nommees) et des valeurs `ArmorType`. Chaque zone suit sa propre sante. Surchargez `EEHitBy()` et `EEKilled()` dans le script pour des reactions de degats personnalisees. Le moteur mappe les composants Fire Geometry du modele aux noms de zones. Voir [Chapitre 6.1](06-engine-api/01-entity-system.md).

### Q : Comment ajouter des raccourcis clavier personnalises a mon mod ?
**R :** Creez un fichier `inputs.xml` definissant vos actions d'entree avec les affectations de touches par defaut. Enregistrez-les dans le script via `GetUApi().RegisterInput()`. Interrogez l'etat avec `GetUApi().GetInputByName("your_action").LocalPress()`. Ajoutez des noms localises dans votre `stringtable.csv`. Voir [Chapitre 5.2](05-config-files/02-inputs-xml.md) et [Chapitre 6.13](06-engine-api/13-input-system.md).

### Q : Comment rendre mon mod compatible avec d'autres mods ?
**R :** Suivez ces principes : (1) Appelez toujours `super` dans les overrides de modded class. (2) Utilisez des noms de classe uniques avec un prefixe de mod (ex. `MyMod_Manager`). (3) Utilisez des IDs RPC uniques. (4) Ne surchargez pas les methodes vanilla sans appeler `super`. (5) Utilisez `#ifdef` pour detecter les dependances optionnelles. (6) Testez avec les combinaisons de mods populaires (CF, Expansion, etc.). Voir [Chapitre 7.2](07-patterns/02-module-systems.md).

### Q : Comment optimiser mon mod pour la performance serveur ?
**R :** Strategies cles : (1) Evitez la logique par frame (`OnUpdate`) -- utilisez des timers ou une conception pilotee par evenements. (2) Mettez en cache les references au lieu d'appeler `GetGame().GetPlayer()` de maniere repetee. (3) Utilisez les gardes `GetGame().IsServer()` / `GetGame().IsClient()` pour sauter le code inutile. (4) Profilez avec des benchmarks `int start = TickCount(0);`. (5) Limitez le trafic reseau -- groupez les RPCs et utilisez les Net Sync Variables pour les petites mises a jour frequentes. Voir [Chapitre 7.7](07-patterns/07-performance.md).

---

*Vous avez une question non couverte ici ? Ouvrez une issue sur le depot.*
