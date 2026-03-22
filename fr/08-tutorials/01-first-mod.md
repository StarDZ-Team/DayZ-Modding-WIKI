# Chapitre 8.1 : Votre premier mod (Hello World)

[Accueil](../README.md) | **Votre premier mod** | [Suivant : Créer un objet personnalisé >>](02-custom-item.md)

---

> **Résumé :** Ce tutoriel vous guide dans la création de votre tout premier mod DayZ en partant de zéro. Vous allez installer les outils, configurer votre espace de travail, écrire trois fichiers, empaqueter un PBO, charger le mod dans DayZ et vérifier qu'il fonctionne en lisant le journal de scripts. Aucune expérience préalable en modding DayZ n'est requise.

---

## Table des matières

- [Prérequis](#prérequis)
- [Étape 1 : installer DayZ Tools](#étape-1--installer-dayz-tools)
- [Étape 2 : configurer le lecteur P: (Workdrive)](#étape-2--configurer-le-lecteur-p-workdrive)
- [Étape 3 : créer la structure de répertoires du mod](#étape-3--créer-la-structure-de-répertoires-du-mod)
- [Étape 4 : écrire mod.cpp](#étape-4--écrire-modcpp)
- [Étape 5 : écrire config.cpp](#étape-5--écrire-configcpp)
- [Étape 6 : écrire votre premier script](#étape-6--écrire-votre-premier-script)
- [Étape 7 : empaqueter le PBO avec Addon Builder](#étape-7--empaqueter-le-pbo-avec-addon-builder)
- [Étape 8 : charger le mod dans DayZ](#étape-8--charger-le-mod-dans-dayz)
- [Étape 9 : vérifier dans le journal de scripts](#étape-9--vérifier-dans-le-journal-de-scripts)
- [Étape 10 : résolution des problèmes courants](#étape-10--résolution-des-problèmes-courants)
- [Référence complète des fichiers](#référence-complète-des-fichiers)
- [Prochaines étapes](#prochaines-étapes)

---

## Prérequis

Avant de commencer, assurez-vous d'avoir :

- **Steam** installé et connecté
- **DayZ** installé (version commerciale depuis Steam)
- Un **éditeur de texte** (VS Code, Notepad++, ou même le Bloc-notes)
- Environ **15 Go d'espace disque libre** pour DayZ Tools

C'est tout. Aucune expérience en programmation n'est requise pour ce tutoriel -- chaque ligne de code est expliquée.

---

## Étape 1 : installer DayZ Tools

DayZ Tools est une application gratuite sur Steam qui comprend tout ce dont vous avez besoin pour créer des mods : l'éditeur de scripts Workbench, Addon Builder pour l'empaquetage des PBO, Terrain Builder et Object Builder.

### Comment installer

1. Ouvrez **Steam**
2. Allez dans **Bibliothèque**
3. Dans le filtre déroulant en haut, changez **Jeux** en **Outils**
4. Recherchez **DayZ Tools**
5. Cliquez sur **Installer**
6. Attendez la fin du téléchargement (environ 12 à 15 Go)

Une fois installé, vous trouverez DayZ Tools dans votre bibliothèque Steam sous Outils. Le chemin d'installation par défaut est :

```
C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\
```

### Ce qui est installé

| Outil | Fonction |
|-------|----------|
| **Addon Builder** | Empaquète vos fichiers de mod en archives `.pbo` |
| **Workbench** | Éditeur de scripts avec coloration syntaxique |
| **Object Builder** | Visionneuse et éditeur de modèles 3D pour les fichiers `.p3d` |
| **Terrain Builder** | Éditeur de cartes/terrains |
| **TexView2** | Visionneuse/convertisseur de textures (`.paa`, `.edds`) |

Pour ce tutoriel, vous n'avez besoin que d'**Addon Builder**. Les autres outils seront utiles plus tard.

---

## Étape 2 : configurer le lecteur P: (Workdrive)

Le modding DayZ utilise une lettre de lecteur virtuel **P:** comme espace de travail partagé. Tous les mods et données de jeu référencent des chemins commençant par P:, ce qui maintient la cohérence des chemins entre différentes machines.

### Création du lecteur P:

1. Ouvrez **DayZ Tools** depuis Steam
2. Dans la fenêtre principale de DayZ Tools, cliquez sur **P: Drive Management** (ou cherchez un bouton intitulé « Mount P drive » / « Setup P drive »)
3. Cliquez sur **Create/Mount P: Drive**
4. Choisissez un emplacement pour les données du lecteur P: (le choix par défaut convient, ou choisissez un disque avec suffisamment d'espace)
5. Attendez la fin du processus

### Vérifier que ça fonctionne

Ouvrez l'**Explorateur de fichiers** et naviguez vers `P:\`. Vous devriez voir un répertoire contenant les données du jeu DayZ. Si le lecteur P: existe et que vous pouvez le parcourir, vous êtes prêt à continuer.

### Alternative : lecteur P: manuel

Si l'interface graphique de DayZ Tools ne fonctionne pas, vous pouvez créer un lecteur P: manuellement en utilisant une invite de commandes Windows (exécutée en tant qu'administrateur) :

```batch
subst P: "C:\DayZWorkdrive"
```

Remplacez `C:\DayZWorkdrive` par le dossier de votre choix. Cela crée un mappage de lecteur temporaire qui dure jusqu'au redémarrage. Pour un mappage permanent, utilisez `net use` ou l'interface de DayZ Tools.

### Et si je ne veux pas utiliser le lecteur P: ?

Vous pouvez développer sans le lecteur P: en plaçant votre dossier de mod directement dans le répertoire du jeu DayZ et en utilisant le mode `-filePatching`. Cependant, le lecteur P: est le flux de travail standard et toute la documentation officielle le suppose. Nous recommandons fortement de le configurer.

---

## Étape 3 : créer la structure de répertoires du mod

Chaque mod DayZ suit une structure de dossiers spécifique. Créez les répertoires et fichiers suivants sur votre lecteur P: (ou dans le répertoire du jeu DayZ si vous n'utilisez pas P:) :

```
P:\MyFirstMod\
    mod.cpp
    Scripts\
        config.cpp
        5_Mission\
            MyFirstMod\
                MissionHello.c
```

### Créer les dossiers

1. Ouvrez l'**Explorateur de fichiers**
2. Naviguez vers `P:\`
3. Créez un nouveau dossier appelé `MyFirstMod`
4. À l'intérieur de `MyFirstMod`, créez un dossier appelé `Scripts`
5. À l'intérieur de `Scripts`, créez un dossier appelé `5_Mission`
6. À l'intérieur de `5_Mission`, créez un dossier appelé `MyFirstMod`

### Comprendre la structure

| Chemin | Fonction |
|--------|----------|
| `MyFirstMod/` | Racine de votre mod |
| `mod.cpp` | Métadonnées (nom, auteur) affichées dans le lanceur DayZ |
| `Scripts/config.cpp` | Indique au moteur de quoi dépend votre mod et où se trouvent les scripts |
| `Scripts/5_Mission/` | La couche de scripts mission (interface, hooks de démarrage) |
| `Scripts/5_Mission/MyFirstMod/` | Sous-dossier pour les scripts mission de votre mod |
| `Scripts/5_Mission/MyFirstMod/MissionHello.c` | Votre fichier de script proprement dit |

Vous avez besoin d'exactement **3 fichiers**. Créons-les un par un.

---

## Étape 4 : écrire mod.cpp

Créez le fichier `P:\MyFirstMod\mod.cpp` dans votre éditeur de texte et collez ce contenu :

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### Ce que fait chaque ligne

- **`name`** -- Le nom d'affichage montré dans la liste des mods du lanceur DayZ. Les joueurs voient ceci lorsqu'ils sélectionnent des mods.
- **`author`** -- Votre nom ou le nom de votre équipe.
- **`version`** -- N'importe quelle chaîne de version. Le moteur ne l'analyse pas.
- **`overview`** -- Une description affichée lorsqu'on développe les détails du mod.

Sauvegardez le fichier. C'est la carte d'identité de votre mod.

---

## Étape 5 : écrire config.cpp

Créez le fichier `P:\MyFirstMod\Scripts\config.cpp` et collez ce contenu :

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### Ce que fait chaque section

**CfgPatches** déclare votre mod auprès du moteur DayZ :

- `class MyFirstMod_Scripts` -- Un identifiant unique pour le paquet de scripts de votre mod. Ne doit pas entrer en conflit avec un autre mod.
- `units[] = {}; weapons[] = {};` -- Listes des entités et armes ajoutées par votre mod. Vides pour l'instant.
- `requiredVersion = 0.1;` -- Version minimale du jeu. Toujours `0.1`.
- `requiredAddons[] = { "DZ_Data" };` -- Dépendances. `DZ_Data` correspond aux données de base du jeu. Cela garantit que votre mod se charge **après** le jeu de base.

**CfgMods** indique au moteur où se trouvent vos scripts :

- `dir = "MyFirstMod";` -- Répertoire racine du mod.
- `type = "mod";` -- C'est un mod client+serveur (par opposition à `"servermod"` pour un mod serveur uniquement).
- `dependencies[] = { "Mission" };` -- Votre code se raccorde au module de script Mission.
- `class missionScriptModule` -- Indique au moteur de compiler tous les fichiers `.c` trouvés dans `MyFirstMod/Scripts/5_Mission/`.

**Pourquoi seulement `5_Mission` ?** Parce que notre script Hello World se raccorde à l'événement de démarrage de mission, qui se trouve dans la couche mission. La plupart des mods simples commencent ici.

---

## Étape 6 : écrire votre premier script

Créez le fichier `P:\MyFirstMod\Scripts\5_Mission\MyFirstMod\MissionHello.c` et collez ce contenu :

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

### Explication ligne par ligne

```c
modded class MissionServer
```
Le mot-clé `modded` est le coeur du modding DayZ. Il dit : « Prends la classe `MissionServer` existante du jeu vanilla et ajoute mes modifications par-dessus. » Vous ne créez pas une nouvelle classe -- vous étendez celle qui existe déjà.

```c
    override void OnInit()
```
`OnInit()` est appelée par le moteur lorsqu'une mission démarre. `override` indique au compilateur que cette méthode existe déjà dans la classe parente et que nous la remplaçons par notre version.

```c
        super.OnInit();
```
**Cette ligne est critique.** `super.OnInit()` appelle l'implémentation vanilla originale. Si vous l'omettez, le code d'initialisation vanilla de la mission ne s'exécute jamais et le jeu ne fonctionne plus. Appelez toujours `super` en premier.

```c
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
```
`Print()` écrit un message dans le fichier journal de scripts DayZ. Le préfixe `[MyFirstMod]` facilite la recherche de vos messages dans le journal.

```c
modded class MissionGameplay
```
`MissionGameplay` est l'équivalent côté client de `MissionServer`. Lorsqu'un joueur rejoint un serveur, `MissionGameplay.OnInit()` se déclenche sur sa machine. En moddant les deux classes, votre message apparaît à la fois dans les journaux serveur et client.

### À propos des fichiers `.c`

Les scripts DayZ utilisent l'extension de fichier `.c`. Bien qu'ils ressemblent à du C, c'est en fait de l'**Enforce Script**, le langage de script propre à DayZ. Il possède des classes, de l'héritage, des tableaux et des maps, mais ce n'est ni du C, ni du C++, ni du C#. Votre IDE peut afficher des erreurs de syntaxe -- c'est normal et attendu.

---

## Étape 7 : empaqueter le PBO avec Addon Builder

DayZ charge les mods depuis des fichiers d'archive `.pbo` (similaires aux .zip mais dans un format que le moteur comprend). Vous devez empaqueter votre dossier `Scripts` dans un PBO.

### Utiliser Addon Builder (interface graphique)

1. Ouvrez **DayZ Tools** depuis Steam
2. Cliquez sur **Addon Builder** pour le lancer
3. Définissez le **Répertoire source** sur : `P:\MyFirstMod\Scripts\`
4. Définissez le **Répertoire de sortie/destination** sur un nouveau dossier : `P:\@MyFirstMod\Addons\`

   Créez d'abord le dossier `@MyFirstMod\Addons\` s'il n'existe pas.

5. Dans les **Options d'Addon Builder** :
   - Définissez le **Prefix** sur : `MyFirstMod\Scripts`
   - Laissez les autres options par défaut
6. Cliquez sur **Pack**

En cas de succès, vous verrez un fichier à cet emplacement :

```
P:\@MyFirstMod\Addons\Scripts.pbo
```

### Mettre en place la structure finale du mod

Maintenant, copiez votre `mod.cpp` à côté du dossier `Addons` :

```
P:\@MyFirstMod\
    mod.cpp                         <-- Copié depuis P:\MyFirstMod\mod.cpp
    Addons\
        Scripts.pbo                 <-- Créé par Addon Builder
```

Le préfixe `@` sur le nom du dossier est une convention pour les mods distribuables. Il signale aux administrateurs de serveur et au lanceur qu'il s'agit d'un paquet de mod.

### Alternative : tester sans empaqueter (File Patching)

Pendant le développement, vous pouvez sauter entièrement l'empaquetage PBO en utilisant le mode file patching. Cela charge les scripts directement depuis vos dossiers sources :

```
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

Le file patching est plus rapide pour l'itération car vous modifiez un fichier `.c`, redémarrez le jeu et voyez les changements immédiatement. Pas besoin d'étape d'empaquetage. Cependant, le file patching ne fonctionne qu'avec l'exécutable de diagnostic (`DayZDiag_x64.exe`) et n'est pas adapté à la distribution.

---

## Étape 8 : charger le mod dans DayZ

Il existe deux façons de charger votre mod : via le lanceur ou avec des paramètres en ligne de commande.

### Option A : lanceur DayZ

1. Ouvrez le **Lanceur DayZ** depuis Steam
2. Allez dans l'onglet **Mods**
3. Cliquez sur **Ajouter un mod local** (ou « Ajouter un mod depuis le stockage local »)
4. Naviguez vers `P:\@MyFirstMod\`
5. Activez le mod en cochant sa case
6. Cliquez sur **Jouer** (assurez-vous de vous connecter à un serveur local/hors ligne, ou de lancer en solo)

### Option B : ligne de commande (recommandée pour le développement)

Pour une itération plus rapide, lancez DayZ directement avec des paramètres en ligne de commande. Créez un raccourci ou un fichier batch :

**Avec l'exécutable de diagnostic (file patching, pas de PBO nécessaire) :**

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ\DayZDiag_x64.exe" -mod=P:\MyFirstMod -filePatching -server -config=serverDZ.cfg -port=2302
```

**Avec le PBO empaqueté :**

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ\DayZDiag_x64.exe" -mod=P:\@MyFirstMod -server -config=serverDZ.cfg -port=2302
```

Le paramètre `-server` lance un serveur local listen. Le paramètre `-filePatching` permet le chargement de scripts depuis des dossiers non empaquetés.

### Test rapide : mode hors ligne

La façon la plus rapide de tester est de lancer DayZ en mode hors ligne :

```batch
DayZDiag_x64.exe -mod=P:\MyFirstMod -filePatching
```

Puis dans le menu principal, cliquez sur **Jouer** et sélectionnez **Mode hors ligne** (ou **Community Offline**). Cela démarre une session solo locale sans nécessiter de serveur.

---

## Étape 9 : vérifier dans le journal de scripts

Après avoir lancé DayZ avec votre mod, le moteur écrit toute la sortie de `Print()` dans des fichiers journaux.

### Trouver les fichiers journaux

DayZ stocke les journaux dans votre répertoire AppData local :

```
C:\Users\<VotreNomUtilisateurWindows>\AppData\Local\DayZ\
```

Pour y accéder rapidement :
1. Appuyez sur **Win + R** pour ouvrir la boîte de dialogue Exécuter
2. Tapez `%localappdata%\DayZ` et appuyez sur Entrée

Cherchez le fichier le plus récent nommé comme suit :

```
script_<date>_<heure>.log
```

Par exemple : `script_2025-01-15_14-30-22.log`

### Que rechercher

Ouvrez le fichier journal dans votre éditeur de texte et recherchez `[MyFirstMod]`. Vous devriez voir l'un de ces messages :

```
[MyFirstMod] Hello World! The SERVER mission has started.
```

ou (si vous avez chargé en tant que client) :

```
[MyFirstMod] Hello World! The CLIENT mission has started.
```

**Si vous voyez votre message : félicitations !** Votre premier mod DayZ fonctionne. Vous avez réussi à :

1. Créer une structure de répertoires pour un mod
2. Écrire un fichier de configuration que le moteur lit
3. Vous raccorder au code vanilla du jeu avec `modded class`
4. Afficher une sortie dans le journal de scripts

### Et si vous voyez des erreurs ?

Si le journal contient des lignes commençant par `SCRIPT (E):`, quelque chose s'est mal passé. Lisez la section suivante.

---

## Étape 10 : résolution des problèmes courants

### Problème : aucune sortie dans le journal (le mod ne semble pas se charger)

**Vérifiez vos paramètres de lancement.** Le chemin `-mod=` doit pointer vers le bon dossier. Si vous utilisez le file patching, vérifiez que le chemin pointe vers le dossier contenant directement `Scripts/config.cpp` (pas le dossier `@`).

**Vérifiez que config.cpp se trouve au bon niveau.** Il doit être à `Scripts/config.cpp` dans la racine de votre mod. S'il est dans le mauvais dossier, le moteur ignore silencieusement votre mod.

**Vérifiez le nom de la classe CfgPatches.** S'il n'y a pas de bloc `CfgPatches`, ou si sa syntaxe est erronée, le PBO entier est ignoré.

**Consultez le journal principal de DayZ** (pas seulement le journal de scripts). Vérifiez :
```
C:\Users\<VotreNom>\AppData\Local\DayZ\DayZ_<date>_<heure>.RPT
```
Recherchez le nom de votre mod. Vous pourriez voir des messages comme « Addon MyFirstMod_Scripts requires addon DZ_Data which is not loaded. »

### Problème : `SCRIPT (E): Undefined variable` ou `Undefined type`

Cela signifie que votre code fait référence à quelque chose que le moteur ne reconnaît pas. Causes courantes :

- **Faute de frappe dans un nom de classe.** `MisionServer` au lieu de `MissionServer` (notez le double « s »).
- **Mauvaise couche de script.** Si vous référencez `PlayerBase` depuis `5_Mission`, cela devrait fonctionner. Mais si vous avez accidentellement placé votre fichier dans `3_Game` et référencez des types mission, vous obtiendrez cette erreur.
- **Appel `super.OnInit()` manquant.** L'omettre peut provoquer des défaillances en cascade.

### Problème : `SCRIPT (E): Member not found`

La méthode que vous appelez n'existe pas sur la classe. Vérifiez le nom de la méthode et assurez-vous que vous substituez une vraie méthode vanilla. `OnInit` existe sur `MissionServer` et `MissionGameplay` -- mais pas sur toutes les classes.

### Problème : le mod se charge mais le script ne s'exécute jamais

- **Extension de fichier :** Assurez-vous que votre fichier de script se termine par `.c` (pas `.c.txt` ou `.cs`). Windows peut masquer les extensions par défaut.
- **Chemin de script incorrect :** Le chemin `files[]` dans `config.cpp` doit correspondre à votre répertoire réel. `"MyFirstMod/Scripts/5_Mission"` signifie que le moteur cherche un dossier à ce chemin exact relatif à la racine du mod.
- **Nom de classe :** `modded class MissionServer` est sensible à la casse. Il doit correspondre exactement au nom de la classe vanilla.

### Problème : erreurs d'empaquetage PBO

- Assurez-vous que `config.cpp` se trouve à la racine de ce que vous empaquetez (le dossier `Scripts/`).
- Vérifiez que le prefix dans Addon Builder correspond au chemin de votre mod.
- Assurez-vous qu'il n'y a pas de fichiers non textuels mélangés dans le dossier Scripts (pas de `.exe`, `.dll` ou fichiers binaires).

### Problème : le jeu plante au démarrage

- Vérifiez les erreurs de syntaxe dans `config.cpp`. Un point-virgule, une accolade ou un guillemet manquant peut faire planter l'analyseur de configuration.
- Vérifiez que `requiredAddons` liste des noms d'addon valides. Un nom d'addon mal orthographié provoque un échec critique.
- Retirez votre mod des paramètres de lancement et confirmez que le jeu démarre sans lui. Puis rajoutez-le pour isoler le problème.

---

## Référence complète des fichiers

Voici les trois fichiers dans leur forme complète, prêts à copier-coller :

### Fichier 1 : `MyFirstMod/mod.cpp`

```cpp
name = "My First Mod";
author = "YourName";
version = "1.0";
overview = "My very first DayZ mod. Prints Hello World to the script log.";
```

### Fichier 2 : `MyFirstMod/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class MyFirstMod_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

class CfgMods
{
    class MyFirstMod
    {
        dir = "MyFirstMod";
        name = "My First Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "MyFirstMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### Fichier 3 : `MyFirstMod/Scripts/5_Mission/MyFirstMod/MissionHello.c`

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The SERVER mission has started.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyFirstMod] Hello World! The CLIENT mission has started.");
    }
};
```

---

## Prochaines étapes

Maintenant que vous avez un mod fonctionnel, voici les progressions naturelles :

1. **[Chapitre 8.2 : Créer un objet personnalisé](02-custom-item.md)** -- Définir un nouvel objet en jeu avec des textures et l'apparition dans le monde.
2. **Ajouter d'autres couches de script** -- Créez des dossiers `3_Game` et `4_World` pour organiser la configuration, les classes de données et la logique des entités. Voir le [Chapitre 2.1 : La hiérarchie des 5 couches de script](../02-mod-structure/01-five-layers.md).
3. **Ajouter des raccourcis clavier** -- Créez un fichier `Inputs.xml` et enregistrez des actions clavier personnalisées.
4. **Créer une interface** -- Construisez des panneaux en jeu en utilisant des fichiers de layout et `ScriptedWidgetEventHandler`. Voir le [Chapitre 3 : Système GUI](../03-gui-system/01-widget-types.md).
5. **Utiliser un framework** -- Intégrez Community Framework (CF) ou un autre framework pour des fonctionnalités avancées comme les RPC, la gestion de configuration et les panneaux d'administration.

---

## Bonnes pratiques

- **Testez toujours avec `-filePatching` avant de construire des PBO.** Cela élimine le cycle empaquetage-copie-redémarrage et réduit le temps d'itération de plusieurs minutes à quelques secondes.
- **Commencez par la couche `5_Mission` pour une itération plus rapide.** Les hooks de mission comme `OnInit()` sont la façon la plus simple de prouver que votre mod se charge et s'exécute. N'ajoutez `3_Game` et `4_World` que lorsque vous en avez réellement besoin.
- **Appelez toujours `super` en premier dans les méthodes substituées.** Omettre `super.OnInit()` casse silencieusement le comportement vanilla et tous les autres mods qui se raccordent à la même méthode.
- **Utilisez un préfixe unique dans la sortie Print** (par ex. `[MyFirstMod]`). Les journaux de scripts contiennent des milliers de lignes provenant du vanilla et d'autres mods -- un préfixe est le seul moyen de trouver rapidement vos sorties.
- **Gardez la syntaxe de `config.cpp` simple et valide.** Un point-virgule ou une accolade manquante dans config.cpp provoque un plantage brutal ou une omission silencieuse du mod sans message d'erreur clair.

---

## Théorie vs pratique

| Concept | Théorie | Réalité |
|---------|---------|---------|
| Champs de `mod.cpp` | `version` est utilisé pour la résolution des dépendances | Le moteur ignore complètement la chaîne de version -- elle est purement cosmétique pour le lanceur. |
| `requiredAddons` dans CfgPatches | Liste les dépendances pour que votre mod se charge dans le bon ordre | Si vous faites une faute de frappe sur un nom d'addon, le PBO entier est ignoré silencieusement sans erreur dans le journal de scripts. Vérifiez le fichier `.RPT` à la place. |
| File patching | Modifiez un fichier `.c` et reconnectez-vous pour voir les changements instantanément | `config.cpp` et les fichiers nouvellement ajoutés ne sont PAS couverts par le file patching. Vous avez toujours besoin d'une reconstruction du PBO pour ceux-ci. |
| Test en mode hors ligne | Moyen rapide de vérifier que votre mod fonctionne | Certaines API (comme `GetGame().GetPlayer().GetIdentity()`) retournent NULL en mode hors ligne, causant des plantages qui ne se produisent pas sur un vrai serveur. |

---

## Ce que vous avez appris

Dans ce tutoriel, vous avez appris :
- Comment installer DayZ Tools et configurer l'espace de travail du lecteur P:
- Les trois fichiers essentiels dont chaque mod a besoin : `mod.cpp`, `config.cpp`, et au moins un script `.c`
- Comment `modded class` étend les classes vanilla sans les remplacer
- Comment empaqueter un PBO, charger un mod et vérifier qu'il fonctionne en lisant le journal de scripts

**Suivant :** [Chapitre 8.2 : Créer un objet personnalisé](02-custom-item.md)
