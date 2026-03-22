# Chapitre 4.7 : Guide Workbench

[Accueil](../../README.md) | [<< Précédent : PBO Packing](06-pbo-packing.md) | **Guide Workbench** | [Suivant : Modélisation de bâtiments >>](08-building-modeling.md)

---

## Introduction

Workbench est l'environnement de développement intégré de Bohemia Interactive pour le moteur Enfusion. Il est livré avec DayZ Tools et est le seul outil officiel qui comprend Enforce Script au niveau du langage. Bien que beaucoup de moddeurs écrivent du code dans VS Code ou d'autres éditeurs, Workbench reste indispensable pour des tâches qu'aucun autre outil ne peut effectuer : attacher un débogueur à une instance DayZ en cours d'exécution, placer des points d'arrêt, exécuter du code pas à pas, inspecter des variables à l'exécution, prévisualiser des fichiers UI `.layout`, parcourir les ressources du jeu, et exécuter des commandes script en direct via la console intégrée.

---

## Table des matières

- [Qu'est-ce que Workbench ?](#quest-ce-que-workbench)
- [Installation et configuration](#installation-et-configuration)
- [Fichiers projet (.gproj)](#fichiers-projet-gproj)
- [L'interface de Workbench](#linterface-de-workbench)
- [Édition de scripts](#édition-de-scripts)
- [Débogage de scripts](#débogage-de-scripts)
- [Console de scripts -- test en direct](#console-de-scripts----test-en-direct)
- [Prévisualisation UI / Layout](#prévisualisation-ui--layout)
- [Navigateur de ressources](#navigateur-de-ressources)
- [Profilage de performance](#profilage-de-performance)
- [Intégration avec le File Patching](#intégration-avec-le-file-patching)
- [Problèmes courants de Workbench](#problèmes-courants-de-workbench)
- [Conseils et bonnes pratiques](#conseils-et-bonnes-pratiques)

---

## Qu'est-ce que Workbench ?

Workbench est l'IDE de Bohemia pour le développement sur le moteur Enfusion. C'est le seul outil de la suite DayZ Tools qui peut compiler, analyser et déboguer Enforce Script. Il remplit six fonctions :

| Fonction | Description |
|----------|-------------|
| **Édition de scripts** | Coloration syntaxique, complétion de code et vérification d'erreurs pour les fichiers `.c` |
| **Débogage de scripts** | Points d'arrêt, inspection de variables, pile d'appels, exécution pas à pas |
| **Navigation de ressources** | Naviguer et prévisualiser les assets du jeu -- modèles, textures, configs, layouts |
| **Prévisualisation UI / layout** | Prévisualisation visuelle des hiérarchies de widgets `.layout` avec inspection des propriétés |
| **Profilage de performance** | Profilage de scripts, analyse du temps de frame, surveillance mémoire |
| **Console de scripts** | Exécuter des commandes Enforce Script en direct sur une instance de jeu en cours |

Workbench utilise le même compilateur de script Enfusion que DayZ lui-même. Quand Workbench signale une erreur de compilation, cette erreur se produira aussi en jeu -- ce qui en fait un contrôle pré-vol fiable avant le lancement.

### Ce que Workbench n'est PAS

- **Pas un éditeur de code généraliste.** Il lui manque les outils de refactoring, l'intégration Git, l'édition multi-curseur et l'écosystème d'extensions de VS Code.
- **Pas un lanceur de jeu.** Vous exécutez toujours `DayZDiag_x64.exe` séparément ; Workbench s'y connecte.
- **Pas nécessaire pour construire les PBO.** AddonBuilder et les scripts de build gèrent l'empaquetage PBO indépendamment.

---

## Installation et configuration

### Étape 1 : Installer DayZ Tools

Workbench est inclus avec DayZ Tools, distribué gratuitement via Steam. Ouvrez la bibliothèque Steam, activez le filtre **Outils**, recherchez **DayZ Tools**, et installez (~2 Go).

### Étape 2 : Localiser Workbench

```
Steam\steamapps\common\DayZ Tools\Bin\Workbench\
  workbenchApp.exe          <-- L'exécutable Workbench
  dayz.gproj                <-- Fichier projet par défaut
```

### Étape 3 : Monter le lecteur P:

Workbench nécessite que le lecteur P: (workdrive) soit monté. Sans lui, Workbench échoue au démarrage ou affiche un navigateur de ressources vide. Montez via le DayZ Tools Launcher, le `SetupWorkdrive.bat` de votre projet, ou manuellement : `subst P: "D:\YourWorkDir"`.

### Étape 4 : Extraire les scripts vanilla

Workbench a besoin des scripts vanilla DayZ sur P: pour compiler votre mod (puisque votre code étend les classes vanilla) :

```
P:\scripts\
  1_Core\
  2_GameLib\
  3_Game\
  4_World\
  5_Mission\
```

Extrayez-les via le DayZ Tools Launcher, ou créez un lien symbolique vers le répertoire de scripts extraits.

### Étape 4b : Lier l'installation du jeu au lecteur projet (pour le rechargement en direct)

Pour permettre à DayZDiag de charger les scripts directement depuis votre lecteur projet (permettant l'édition en direct sans reconstruction PBO), créez un lien symbolique depuis le dossier d'installation de DayZ vers `P:\scripts` :

1. Naviguez vers votre dossier d'installation de DayZ (généralement `Steam\steamapps\common\DayZ`).
2. Supprimez tout dossier `scripts` existant à l'intérieur.
3. Ouvrez une invite de commande **en tant qu'Administrateur** et exécutez :

```batch
mklink /J "C:\...\steamapps\common\DayZ\scripts" "P:\scripts"
```

Remplacez le premier chemin par votre chemin d'installation DayZ réel. Après cela, le dossier d'installation DayZ contiendra une jonction `scripts` qui pointe vers `P:\scripts`. Tout changement que vous faites sur le lecteur projet est immédiatement visible par le jeu.

### Étape 5 : Configurer le répertoire de données source

1. Lancez `workbenchApp.exe`.
2. Cliquez sur **Workbench > Options** dans la barre de menu.
3. Définissez **Source data directory** sur `P:\`.
4. Cliquez sur **OK** et laissez Workbench redémarrer.

---

## Fichiers projet (.gproj)

Le fichier `.gproj` est la configuration de projet de Workbench. Il indique à Workbench où trouver les scripts, quels jeux d'images charger pour la prévisualisation des layouts, et quels styles de widgets sont disponibles.

### Emplacement du fichier

La convention est de le placer dans un répertoire `Workbench/` à l'intérieur de votre mod :

```
P:\MyMod\
  Workbench\
    dayz.gproj
  Scripts\
    3_Game\
    4_World\
    5_Mission\
  config.cpp
```

### Vue d'ensemble de la structure

Un `.gproj` utilise un format texte propriétaire (ni JSON, ni XML) :

```
GameProjectClass {
    ID "MyMod"
    TITLE "My Mod Name"
    Configurations {
        GameProjectConfigClass PC {
            platformHardware PC
            skeletonDefinitions "DZ/Anims/cfg/skeletons.anim.xml"

            FileSystem {
                FileSystemPathClass {
                    Name "Workdrive"
                    Directory "P:/"
                }
            }

            imageSets {
                "gui/imagesets/ccgui_enforce.imageset"
                "gui/imagesets/dayz_gui.imageset"
                "gui/imagesets/dayz_inventory.imageset"
                // ... other vanilla image sets ...
                "MyMod/gui/imagesets/my_imageset.imageset"
            }

            widgetStyles {
                "gui/looknfeel/dayzwidgets.styles"
                "gui/looknfeel/widgets.styles"
            }

            ScriptModules {
                ScriptModulePathClass {
                    Name "core"
                    Paths {
                        "scripts/1_Core"
                        "MyMod/Scripts/1_Core"
                    }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "gameLib"
                    Paths { "scripts/2_GameLib" }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "game"
                    Paths {
                        "scripts/3_Game"
                        "MyMod/Scripts/3_Game"
                    }
                    EntryPoint "CreateGame"
                }
                ScriptModulePathClass {
                    Name "world"
                    Paths {
                        "scripts/4_World"
                        "MyMod/Scripts/4_World"
                    }
                    EntryPoint ""
                }
                ScriptModulePathClass {
                    Name "mission"
                    Paths {
                        "scripts/5_Mission"
                        "MyMod/Scripts/5_Mission"
                    }
                    EntryPoint "CreateMission"
                }
                ScriptModulePathClass {
                    Name "workbench"
                    Paths { "MyMod/Workbench/ToolAddons" }
                    EntryPoint ""
                }
            }
        }
        GameProjectConfigClass XBOX_ONE { platformHardware XBOX_ONE }
        GameProjectConfigClass PS4 { platformHardware PS4 }
        GameProjectConfigClass LINUX { platformHardware LINUX }
    }
}
```

### Sections clés expliquées

**FileSystem** -- Répertoires racines où Workbench recherche les fichiers. Au minimum, incluez `P:/`. Vous pouvez ajouter des chemins supplémentaires (ex. le répertoire d'installation Steam de DayZ) si des fichiers vivent en dehors du workdrive.

**ScriptModules** -- La section la plus importante. Mappe chaque couche du moteur à des répertoires de scripts :

| Module | Couche | EntryPoint | Fonction |
|--------|--------|------------|----------|
| `core` | `1_Core` | `""` | Noyau moteur, types de base |
| `gameLib` | `2_GameLib` | `""` | Utilitaires de la bibliothèque jeu |
| `game` | `3_Game` | `"CreateGame"` | Enums, constantes, initialisation du jeu |
| `world` | `4_World` | `""` | Entités, managers |
| `mission` | `5_Mission` | `"CreateMission"` | Hooks de mission, panneaux UI |
| `workbench` | (outils) | `""` | Plugins Workbench |

Les chemins vanilla viennent en premier, puis les chemins de votre mod. Si votre mod dépend d'autres mods (comme Community Framework), ajoutez aussi leurs chemins :

```
ScriptModulePathClass {
    Name "game"
    Paths {
        "scripts/3_Game"              // Vanilla
        "JM/CF/Scripts/3_Game"        // Community Framework
        "MyMod/Scripts/3_Game"        // Your mod
    }
    EntryPoint "CreateGame"
}
```

Certains frameworks remplacent les points d'entrée (CF utilise `"CF_CreateGame"`).

**imageSets / widgetStyles** -- Requis pour la prévisualisation des layouts. Sans les jeux d'images vanilla, les fichiers layout affichent des images manquantes. Incluez toujours les 14 jeux d'images vanilla standard listés dans l'exemple ci-dessus.

### Résolution du préfixe de chemin

Quand Workbench résout automatiquement les chemins de scripts depuis le `config.cpp` d'un mod, le chemin FileSystem est préfixé. Si votre mod est à `P:\OtherMods\MyMod` et que config.cpp déclare `MyMod/scripts/3_Game`, le FileSystem doit inclure `P:\OtherMods` pour une résolution correcte.

### Création et lancement

**Créer un .gproj :** Copiez le `dayz.gproj` par défaut depuis `DayZ Tools\Bin\Workbench\`, mettez à jour `ID`/`TITLE`, et ajoutez les chemins de scripts de votre mod à chaque module.

**Lancer avec un projet personnalisé :**
```batch
workbenchApp.exe -project="P:\MyMod\Workbench\dayz.gproj"
```

**Lancer avec -mod (auto-configuration depuis config.cpp) :**
```batch
workbenchApp.exe -mod=P:\MyMod
workbenchApp.exe -mod=P:\CommunityFramework;P:\MyMod
```

L'approche `-mod` est plus simple mais donne moins de contrôle. Pour les configurations multi-mods complexes, un `.gproj` personnalisé est plus fiable.

---

## L'interface de Workbench

### Barre de menu principale

| Menu | Éléments clés |
|------|--------------|
| **File** | Ouvrir un projet, projets récents, enregistrer |
| **Edit** | Couper, copier, coller, rechercher, remplacer |
| **View** | Basculer les panneaux on/off, réinitialiser la disposition |
| **Workbench** | Options (répertoire de données source, préférences) |
| **Debug** | Démarrer/arrêter le débogage, basculer client/serveur, gestion des points d'arrêt |
| **Plugins** | Plugins Workbench installés et addons d'outils |

### Panneaux

- **Navigateur de ressources** (gauche) -- Arborescence de fichiers du lecteur P:. Double-cliquez sur les fichiers `.c` pour éditer, les fichiers `.layout` pour prévisualiser, `.p3d` pour visualiser les modèles, `.paa` pour visualiser les textures.
- **Éditeur de scripts** (centre) -- Zone d'édition de code avec coloration syntaxique, complétion de code, soulignement des erreurs, numéros de ligne, marqueurs de points d'arrêt et édition multi-fichiers par onglets.
- **Sortie** (bas) -- Erreurs/avertissements du compilateur, sortie `Print()` d'un jeu connecté, messages de débogage. Quand connecté à DayZDiag, cette fenêtre affiche en temps réel tout le texte que l'exécutable de diagnostic produit à des fins de débogage -- la même sortie que vous verriez dans les logs de scripts. Double-cliquez sur les erreurs pour naviguer vers la ligne source.
- **Propriétés** (droite) -- Propriétés de l'objet sélectionné. Le plus utile dans l'éditeur de layout pour l'inspection des widgets.
- **Console** -- Exécution de commandes Enforce Script en direct.
- **Panneaux de débogage** (pendant le débogage) -- **Locals** (variables de la portée courante), **Watch** (expressions utilisateur), **Call Stack** (chaîne de fonctions), **Breakpoints** (liste avec bascules activer/désactiver).

---

## Édition de scripts

### Ouvrir des fichiers

1. **Navigateur de ressources :** Double-cliquez sur un fichier `.c`. Cela ouvre automatiquement le module Éditeur de scripts et charge le fichier.
2. **Navigateur de ressources de l'Éditeur de scripts :** L'Éditeur de scripts a son propre panneau Navigateur de ressources intégré, séparé du Navigateur de ressources principal de Workbench. Vous pouvez utiliser l'un ou l'autre pour naviguer et ouvrir des fichiers de scripts.
3. **File > Open :** Boîte de dialogue standard.
4. **Sortie d'erreur :** Double-cliquez sur une erreur du compilateur pour aller au fichier et à la ligne.

### Coloration syntaxique

| Élément | Coloré |
|---------|--------|
| Mots-clés (`class`, `if`, `while`, `return`, `modded`, `override`) | Gras / couleur de mot-clé |
| Types (`int`, `float`, `string`, `bool`, `vector`, `void`) | Couleur de type |
| Chaînes, commentaires, directives préprocesseur | Couleurs distinctes |

### Complétion de code

Tapez un nom de classe suivi de `.` pour voir les méthodes et champs, ou appuyez sur `Ctrl+Espace` pour les suggestions. La complétion est basée sur le contexte de script compilé. Elle est fonctionnelle mais limitée par rapport à VS Code -- idéale pour des consultations rapides d'API.

### Retour du compilateur

Workbench compile à la sauvegarde. Erreurs courantes :

| Message | Signification |
|---------|--------------|
| `Undefined variable 'xyz'` | Non déclaré ou faute de frappe |
| `Method 'Foo' not found in class 'Bar'` | Mauvais nom de méthode ou de classe |
| `Cannot convert 'string' to 'int'` | Incompatibilité de type |
| `Type 'MyClass' not found` | Fichier absent du projet |

### Rechercher, remplacer et aller à la définition

- `Ctrl+F` / `Ctrl+H` -- rechercher/remplacer dans le fichier courant.
- `Ctrl+Shift+F` -- rechercher dans tous les fichiers du projet.
- Clic droit sur un symbole et sélectionnez **Go to Definition** pour aller à sa déclaration, même dans les scripts vanilla.

---

## Débogage de scripts

Le débogage est la fonctionnalité la plus puissante de Workbench -- mettre en pause une instance DayZ en cours d'exécution, inspecter chaque variable, et exécuter le code ligne par ligne.

### Prérequis

- **DayZDiag_x64.exe** (pas le DayZ retail) -- seule la version Diag supporte le débogage.
- **Lecteur P: monté** avec les scripts vanilla extraits.
- **Les scripts doivent correspondre** -- si vous éditez après le chargement du jeu, les numéros de ligne ne seront pas alignés.

### Configurer une session de débogage

1. Ouvrez Workbench et chargez votre projet.
2. Ouvrez le module **Éditeur de scripts** (depuis la barre de menu ou en double-cliquant sur n'importe quel fichier `.c` dans le Navigateur de ressources -- cela ouvre automatiquement l'Éditeur de scripts et charge le fichier).
3. Lancez DayZDiag séparément :

```batch
DayZDiag_x64.exe -filePatching -mod=P:\MyMod -connect=127.0.0.1 -port=2302
```

4. Workbench détecte automatiquement DayZDiag et se connecte. Un bref popup apparaît dans le coin inférieur droit de l'écran confirmant la connexion.

> **Astuce :** Si vous avez seulement besoin de voir la sortie console (pas de points d'arrêt ni d'exécution pas à pas), vous n'avez pas besoin d'extraire les PBO ou de charger les scripts dans Workbench. L'Éditeur de scripts se connectera toujours à DayZDiag et affichera le flux de sortie. Cependant, les points d'arrêt et la navigation de code nécessitent que les fichiers de scripts correspondants soient chargés dans le projet.

### Points d'arrêt

Cliquez sur la marge gauche à côté d'un numéro de ligne. Un point rouge apparaît.

| Marqueur | Signification |
|----------|--------------|
| Point rouge | Point d'arrêt actif -- l'exécution se met en pause ici |
| Exclamation jaune | Invalide -- cette ligne ne s'exécute jamais |
| Point bleu | Signet -- marqueur de navigation uniquement |

Basculez avec `F9`. Vous pouvez aussi cliquer directement dans la zone de marge (où apparaissent les points rouges) pour ajouter ou supprimer des points d'arrêt. Un clic droit dans la marge ajoute un **Signet** bleu à la place -- les signets n'ont aucun effet sur l'exécution mais marquent les endroits que vous voulez revisiter. Cliquez droit sur un point d'arrêt pour définir une **condition** (ex. `i == 10` ou `player.GetIdentity().GetName() == "TestPlayer"`).

### Exécution pas à pas

| Action | Raccourci | Description |
|--------|-----------|-------------|
| Continuer | `F5` | Exécuter jusqu'au prochain point d'arrêt |
| Pas à pas principal | `F10` | Exécuter la ligne courante, passer à la suivante |
| Pas à pas détaillé | `F11` | Entrer dans la fonction appelée |
| Pas à pas sortant | `Shift+F11` | Exécuter jusqu'au retour de la fonction courante |
| Arrêter | `Shift+F5` | Déconnecter et reprendre le jeu |

### Inspection de variables

Le panneau **Locals** montre toutes les variables en portée -- primitives avec valeurs, objets avec noms de classes (extensibles), tableaux avec longueurs, et références NULL clairement marquées. Le panneau **Watch** évalue des expressions personnalisées à chaque pause. La **Call Stack** montre la chaîne de fonctions ; cliquez sur les entrées pour naviguer.

### Débogage client vs serveur

`DayZDiag_x64.exe` peut agir comme un client ou un serveur (en ajoutant le paramètre de lancement `-server`). Il accepte tous les mêmes paramètres que l'exécutable retail. Workbench peut se connecter à l'une ou l'autre instance.

Utilisez **Debug > Debug Client** ou **Debug > Debug Server** dans le menu de l'Éditeur de scripts pour choisir quel côté déboguer. Sur un serveur d'écoute, vous pouvez basculer librement. Les contrôles d'exécution, les points d'arrêt et l'inspection de variables s'appliquent tous au côté actuellement sélectionné.

### Limitations

- Seul `DayZDiag_x64.exe` supporte le débogage, pas les builds retail.
- Les fonctions internes C++ du moteur ne peuvent pas être parcourues pas à pas.
- Beaucoup de points d'arrêt dans des fonctions à haute fréquence (`OnUpdate`) causent un lag sévère.
- Les gros projets de mods peuvent ralentir l'indexation de Workbench.

---

## Console de scripts -- test en direct

La console de scripts vous permet d'exécuter des commandes Enforce Script sur une instance de jeu en cours -- inestimable pour l'expérimentation d'API sans éditer de fichiers.

### Ouverture

Cherchez l'onglet **Console** dans le panneau du bas, ou activez-le via **View > Console**.

### Commandes courantes

```c
// Print player position
Print(GetGame().GetPlayer().GetPosition().ToString());

// Spawn an item at player feet
GetGame().CreateObject("AKM", GetGame().GetPlayer().GetPosition(), false, false, true);

// Test math
float dist = vector.Distance("0 0 0", "100 0 100");
Print("Distance: " + dist.ToString());

// Teleport player
GetGame().GetPlayer().SetPosition("6737 0 2505");

// Spawn zombies nearby
vector pos = GetGame().GetPlayer().GetPosition();
for (int i = 0; i < 5; i++)
{
    vector offset = Vector(Math.RandomFloat(-5, 5), 0, Math.RandomFloat(-5, 5));
    GetGame().CreateObject("ZmbF_JournalistNormal_Blue", pos + offset, false, false, true);
}
```

### Limitations

- **Côté client uniquement** par défaut (le code côté serveur nécessite un serveur d'écoute).
- **Pas d'état persistant** -- les variables ne sont pas conservées entre les exécutions.
- **Certaines API indisponibles** jusqu'à ce que le jeu atteigne un état spécifique (joueur apparu, mission chargée).
- **Pas de récupération d'erreur** -- les pointeurs null échouent simplement en silence.

---

## Prévisualisation UI / Layout

Workbench peut ouvrir des fichiers `.layout` pour une inspection visuelle.

### Ce que vous pouvez faire

- **Voir la hiérarchie des widgets** -- voir l'imbrication parent-enfant et les noms des widgets.
- **Inspecter les propriétés** -- position, taille, couleur, alpha, alignement, source d'image, texte, police.
- **Trouver les noms de widgets** utilisés par `FindAnyWidget()` dans le code script.
- **Vérifier les références d'images** -- quelles entrées de jeu d'images ou textures un widget utilise.

### Ce que vous ne pouvez PAS faire

- **Pas de comportement à l'exécution** -- les gestionnaires ScriptClass et le contenu dynamique ne s'exécutent pas.
- **Différences de rendu** -- la transparence, la superposition et la résolution peuvent différer de l'affichage en jeu.
- **Édition limitée** -- Workbench est principalement un visualiseur, pas un concepteur visuel.

**Bonne pratique :** Utilisez l'éditeur de layout pour l'inspection. Construisez et éditez les fichiers `.layout` dans un éditeur de texte. Testez en jeu avec le file patching.

---

## Navigateur de ressources

Le Navigateur de ressources parcourt le lecteur P: avec des prévisualisations de fichiers adaptées au jeu.

### Capacités

| Type de fichier | Action au double-clic |
|----------------|----------------------|
| `.c` | Ouvre dans l'Éditeur de scripts |
| `.layout` | Ouvre dans l'Éditeur de layout |
| `.p3d` | Prévisualisation 3D du modèle (rotation, zoom, inspection des LODs) |
| `.paa` / `.edds` | Visualiseur de textures avec inspection des canaux (R, G, B, A) |
| Classes de config | Parcourir les hiérarchies CfgVehicles, CfgWeapons parsées |

### Trouver les ressources vanilla

L'une des utilisations les plus précieuses -- étudier comment Bohemia structure les assets :

```
P:\DZ\weapons\        <-- Modèles et textures d'armes vanilla
P:\DZ\characters\     <-- Modèles de personnages et vêtements
P:\scripts\4_World\   <-- Scripts world vanilla
P:\scripts\5_Mission\  <-- Scripts mission vanilla
```

---

## Profilage de performance

Quand connecté à DayZDiag, Workbench peut profiler l'exécution des scripts.

### Ce que le profileur montre

- **Compteurs d'appels de fonctions** -- combien de fois chaque fonction s'exécute par frame.
- **Temps d'exécution** -- millisecondes par fonction.
- **Hiérarchie d'appels** -- quelles fonctions appellent quelles fonctions, avec attribution de temps.
- **Décomposition du temps de frame** -- temps script vs temps moteur. À 60 FPS, chaque frame a ~16,6 ms de budget.
- **Mémoire** -- compteurs d'allocation par classe, détection de fuites de cycles de références.

### Profileur de scripts en jeu (Menu Diag)

En plus du profileur de Workbench, `DayZDiag_x64.exe` possède un profileur de scripts intégré accessible via le Menu Diag (sous Statistics). Il affiche des listes top-20 pour le temps par classe, le temps par fonction, les allocations de classes, le compteur par fonction et le nombre d'instances de classes. Utilisez le paramètre de lancement `-profile` pour activer le profilage dès le démarrage. Le profileur ne mesure que Enforce Script -- les méthodes proto (moteur) ne sont pas mesurées comme des entrées séparées, mais leur temps d'exécution est inclus dans le temps total de la méthode script qui les appelle. Voir `EnProfiler.c` dans les scripts vanilla pour l'API programmatique (`EnProfiler.Enable`, `EnProfiler.SetModule`, constantes de flags).

### Goulots d'étranglement courants

| Problème | Symptôme dans le profileur | Solution |
|----------|---------------------------|----------|
| Code coûteux par frame | Temps élevé dans `OnUpdate` | Déplacer vers des timers, réduire la fréquence |
| Itération excessive | Boucle avec des milliers d'appels | Mettre en cache les résultats, utiliser des requêtes spatiales |
| Concaténation de chaînes dans les boucles | Compteur d'allocations élevé | Réduire la journalisation, regrouper les chaînes |

---

## Intégration avec le File Patching

Le workflow de développement le plus rapide combine Workbench avec le file patching, éliminant les reconstructions PBO pour les changements de scripts.

### Configuration

1. Scripts sur le lecteur P: comme fichiers libres (pas dans des PBO).
2. Lien symbolique des scripts d'installation DayZ : `mklink /J "...\DayZ\scripts" "P:\scripts"`
3. Lancer avec `-filePatching` : client et serveur utilisent `DayZDiag_x64.exe`.

### La boucle d'itération rapide

```
1. Éditer un fichier .c dans votre éditeur
2. Enregistrer (le fichier est déjà sur le lecteur P:)
3. Redémarrer la mission dans DayZDiag (pas de reconstruction PBO)
4. Tester en jeu
5. Placer des points d'arrêt dans Workbench si nécessaire
6. Répéter
```

### Qu'est-ce qui nécessite une reconstruction ?

| Changement | Reconstruction ? |
|-----------|------------------|
| Logique de script (`.c`) | Non -- redémarrer la mission |
| Fichiers layout (`.layout`) | Non -- redémarrer la mission |
| Config.cpp (scripts uniquement) | Non -- redémarrer la mission |
| Config.cpp (avec CfgVehicles) | Oui -- les configs binarisées nécessitent un PBO |
| Textures (`.paa`) | Non -- le moteur recharge depuis P: |
| Modèles (`.p3d`) | Peut-être -- MLOD non binarisé uniquement |

---

## Problèmes courants de Workbench

### Workbench plante au démarrage

**Cause :** Lecteur P: non monté ou `.gproj` référence des chemins inexistants.
**Solution :** Montez P: d'abord. Vérifiez **Workbench > Options** le répertoire source. Vérifiez que les chemins FileSystem du `.gproj` existent.

### Pas de complétion de code

**Cause :** Projet mal configuré -- Workbench ne peut pas compiler les scripts.
**Solution :** Vérifiez que les ScriptModules du `.gproj` incluent les chemins vanilla (`scripts/1_Core`, etc.). Vérifiez la sortie pour les erreurs du compilateur. Assurez-vous que les scripts vanilla sont sur P:.

### Les scripts ne compilent pas

**Solution :** Vérifiez le panneau de sortie pour les erreurs exactes. Vérifiez que tous les chemins de mods dépendants sont dans ScriptModules. Assurez-vous qu'il n'y a pas de références inter-couches (3_Game ne peut pas utiliser les types de 4_World).

### Les points d'arrêt ne se déclenchent pas

**Liste de vérification :**
1. Connecté à DayZDiag (pas le retail) ?
2. Point rouge (valide) ou exclamation jaune (invalide) ?
3. Les scripts correspondent entre Workbench et le jeu ?
4. Débogage du bon côté (client vs serveur) ?
5. Le chemin de code est réellement atteint ? (Ajoutez `Print()` pour vérifier.)

### Impossible de trouver des fichiers dans le navigateur de ressources

**Solution :** Vérifiez que le FileSystem du `.gproj` inclut le répertoire où vivent vos fichiers. Redémarrez Workbench après avoir modifié le `.gproj`.

### Erreurs "Plugin Not Found"

**Solution :** Vérifiez l'intégrité de DayZ Tools via Steam (clic droit > Propriétés > Fichiers installés > Vérifier). Réinstallez si nécessaire.

### La connexion à DayZDiag échoue

**Solution :** Les deux processus doivent être sur la même machine. Vérifiez les pare-feux. Assurez-vous que le module Éditeur de scripts est ouvert avant de lancer DayZDiag. Essayez de redémarrer les deux.

---

## Conseils et bonnes pratiques

1. **Utilisez Workbench pour le débogage, VS Code pour l'écriture.** L'éditeur de Workbench est basique. Utilisez des éditeurs externes pour le codage quotidien ; passez à Workbench pour le débogage et la prévisualisation des layouts.

2. **Gardez un .gproj par mod.** Chaque mod devrait avoir son propre fichier projet pour compiler exactement le bon contexte de script sans indexer des mods non liés.

3. **Utilisez la console pour l'expérimentation d'API.** Testez les appels d'API dans la console avant de les écrire dans des fichiers. Plus rapide que les cycles éditer-redémarrer-tester.

4. **Profilez avant d'optimiser.** Ne devinez pas les goulots d'étranglement. Le profileur montre où le temps est réellement passé.

5. **Placez les points d'arrêt stratégiquement.** Évitez les points d'arrêt dans `OnUpdate()` sauf s'ils sont conditionnels. Ils se déclenchent à chaque frame et gèlent le jeu constamment.

6. **Utilisez les signets pour la navigation.** Les points bleus de signets marquent les emplacements intéressants dans les scripts vanilla que vous référencez fréquemment.

7. **Vérifiez la sortie du compilateur avant de lancer.** Si Workbench signale des erreurs, le jeu échouera aussi. Corrigez les erreurs dans Workbench d'abord -- plus rapide que d'attendre le démarrage du jeu.

8. **Utilisez -mod pour les configurations simples, .gproj pour les complexes.** Mod unique sans dépendances : `-mod=P:\MyMod`. Multi-mod avec CF/Dabs : `.gproj` personnalisé.

9. **Gardez Workbench à jour.** Mettez à jour DayZ Tools via Steam quand DayZ se met à jour. Des versions dépareillées causent des échecs de compilation.

---

## Référence rapide : raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `F5` | Démarrer / Continuer le débogage |
| `Shift+F5` | Arrêter le débogage |
| `F9` | Basculer un point d'arrêt |
| `F10` | Pas à pas principal |
| `F11` | Pas à pas détaillé |
| `Shift+F11` | Pas à pas sortant |
| `Ctrl+F` | Rechercher dans le fichier |
| `Ctrl+H` | Rechercher et remplacer |
| `Ctrl+Shift+F` | Rechercher dans le projet |
| `Ctrl+S` | Enregistrer |
| `Ctrl+Space` | Complétion de code |

## Référence rapide : paramètres de lancement

| Paramètre | Description |
|-----------|-------------|
| `-project="path/dayz.gproj"` | Charger un fichier projet spécifique |
| `-mod=P:\MyMod` | Auto-configurer depuis le config.cpp du mod |
| `-mod=P:\ModA;P:\ModB` | Mods multiples (séparés par des points-virgules) |

---

## Navigation

| Précédent | Haut | Suivant |
|-----------|------|---------|
| [4.6 PBO Packing](06-pbo-packing.md) | [Partie 4 : Formats de fichiers et DayZ Tools](01-textures.md) | [4.8 Modélisation de bâtiments](08-building-modeling.md) |
