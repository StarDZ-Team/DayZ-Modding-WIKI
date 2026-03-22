# Chapitre 2.4 : Votre premier mod -- Minimum Viable

[Accueil](../README.md) | [<< Précédent : mod.cpp & Workshop](03-mod-cpp.md) | **Mod Minimum Viable** | [Suivant : Organisation des fichiers >>](05-file-organization.md)

---

> **Résumé :** Ce chapitre vous guide dans la création du plus petit mod DayZ possible à partir de zéro. À la fin, vous aurez un mod fonctionnel qui affiche un message dans le log de script quand le jeu démarre. Trois fichiers, zéro dépendance, moins de cinq minutes.

---

## Table des matières

- [Ce dont vous avez besoin](#ce-dont-vous-avez-besoin)
- [L'objectif](#lobjectif)
- [Étape 1 : Créer la structure de répertoires](#étape-1--créer-la-structure-de-répertoires)
- [Étape 2 : Créer mod.cpp](#étape-2--créer-modcpp)
- [Étape 3 : Créer config.cpp](#étape-3--créer-configcpp)
- [Étape 4 : Créer votre premier script](#étape-4--créer-votre-premier-script)
- [Étape 5 : Empaqueter et tester](#étape-5--empaqueter-et-tester)
- [Étape 6 : Vérifier que ça fonctionne](#étape-6--vérifier-que-ça-fonctionne)
- [Comprendre ce qui s'est passé](#comprendre-ce-qui-sest-passé)
- [Prochaines étapes](#prochaines-étapes)
- [Dépannage](#dépannage)

---

## Ce dont vous avez besoin

- Le jeu DayZ installé (version retail ou DayZ Tools/Diag)
- Un éditeur de texte (VS Code, Notepad++ ou n'importe quel éditeur de texte brut)
- DayZ Tools installé (pour l'empaquetage PBO) -- OU vous pouvez tester sans empaqueter (voir Étape 5)

---

## L'objectif

Nous allons créer un mod appelé **HelloMod** qui :
1. Se charge dans DayZ sans erreurs
2. Affiche `"[HelloMod] Mission started!"` dans le log de script
3. Utilise la structure standard correcte

C'est l'équivalent DayZ du « Hello World ».

---

## Étape 1 : Créer la structure de répertoires

Créez les dossiers et fichiers suivants. Vous avez besoin d'exactement **3 fichiers** :

```
HelloMod/
  mod.cpp
  Scripts/
    config.cpp
    5_Mission/
      HelloMod/
        HelloMission.c
```

C'est la structure complète. Créons chaque fichier.

---

## Étape 2 : Créer mod.cpp

Créez `HelloMod/mod.cpp` avec ce contenu :

```cpp
name = "Hello Mod";
author = "YourName";
version = "1.0";
overview = "My first DayZ mod - prints a message on mission start.";
```

Ce sont les métadonnées minimales. Le lanceur DayZ affichera « Hello Mod » dans la liste des mods.

---

## Étape 3 : Créer config.cpp

Créez `HelloMod/Scripts/config.cpp` avec ce contenu :

```cpp
class CfgPatches
{
    class HelloMod_Scripts
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
    class HelloMod
    {
        dir = "HelloMod";
        name = "Hello Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "HelloMod/Scripts/5_Mission" };
            };
        };
    };
};
```

Décomposons ce que fait chaque partie :

- **CfgPatches** déclare le mod au moteur. `requiredAddons` dit que nous dépendons de `DZ_Data` (données vanilla DayZ), ce qui garantit que nous nous chargeons après le jeu de base.
- **CfgMods** dit au moteur où se trouvent nos scripts. Nous utilisons uniquement `5_Mission` car c'est là que les hooks du cycle de vie de la mission sont disponibles.
- **dependencies** liste `"Mission"` car notre code s'accroche au module de script mission.

---

## Étape 4 : Créer votre premier script

Créez `HelloMod/Scripts/5_Mission/HelloMod/HelloMission.c` avec ce contenu :

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Server is running.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Client is running.");
    }
};
```

Ce que ça fait :

- `modded class MissionServer` étend la classe de mission serveur vanilla. Quand le serveur démarre une mission, `OnInit()` se déclenche et notre message s'affiche.
- `modded class MissionGameplay` fait la même chose côté client.
- `super.OnInit()` appelle l'implémentation originale (vanilla) en premier -- c'est critique. Ne la sautez jamais.
- `Print()` écrit dans le fichier log de script DayZ.

---

## Étape 5 : Empaqueter et tester

Vous avez deux options pour tester :

### Option A : File Patching (Pas de PBO requis -- Développement uniquement)

DayZ supporte le chargement de mods non empaquetés pendant le développement. C'est la façon la plus rapide d'itérer.

1. Placez votre dossier `HelloMod/` dans le répertoire d'installation de DayZ (ou utilisez le lecteur P: avec le workbench)
2. Lancez DayZ avec le paramètre `-filePatching` et chargez votre mod :

```
DayZDiag_x64.exe -mod=HelloMod -filePatching
```

Cela charge les scripts directement depuis le dossier sans empaquetage PBO.

### Option B : Empaquetage PBO (Requis pour la distribution)

Pour la publication sur le Workshop ou le déploiement serveur, vous devez empaqueter en PBO :

1. Ouvrez **DayZ Tools** (depuis Steam)
2. Ouvrez **Addon Builder**
3. Définissez le répertoire source sur `HelloMod/Scripts/`
4. Définissez la sortie sur `@HelloMod/Addons/HelloMod_Scripts.pbo`
5. Cliquez sur **Pack**

Ou utilisez un empaqueteur en ligne de commande comme `PBOConsole` :

```
PBOConsole.exe -pack HelloMod/Scripts @HelloMod/Addons/HelloMod_Scripts.pbo
```

Placez le `mod.cpp` à côté du dossier `Addons/` :

```
@HelloMod/
  mod.cpp
  Addons/
    HelloMod_Scripts.pbo
```

Puis lancez DayZ :

```
DayZDiag_x64.exe -mod=@HelloMod
```

---

## Étape 6 : Vérifier que ça fonctionne

### Trouver le log de script

DayZ écrit la sortie de script dans des fichiers log dans votre répertoire de profil :

```
Windows : C:\Users\VotreNom\AppData\Local\DayZ\
```

Cherchez le fichier `.RPT` ou `.log` le plus récent. Le log de script est typiquement nommé :

```
script_<date>_<heure>.log
```

### Ce qu'il faut chercher

Ouvrez le fichier log et recherchez `[HelloMod]`. Vous devriez voir :

```
[HelloMod] Mission started! Server is running.
```

ou (si vous avez rejoint en tant que client) :

```
[HelloMod] Mission started! Client is running.
```

Si vous voyez ce message, félicitations -- votre mod fonctionne.

### Si vous voyez des erreurs

Si le log contient des lignes commençant par `SCRIPT (E):`, quelque chose s'est mal passé. Voir la section [Dépannage](#dépannage) ci-dessous.

---

## Comprendre ce qui s'est passé

Voici la séquence d'événements quand DayZ a chargé votre mod :

```
1. Le moteur démarre, lit les fichiers config.cpp de tous les PBOs
2. CfgPatches "HelloMod_Scripts" est enregistré
   --> requiredAddons garantit le chargement après DZ_Data
3. CfgMods "HelloMod" est enregistré
   --> Le moteur connaît le chemin du missionScriptModule
4. Le moteur compile les scripts 5_Mission de tous les mods
   --> HelloMission.c est compilé
   --> "modded class MissionServer" patche la classe vanilla
5. Le serveur démarre une mission
   --> MissionServer.OnInit() est appelé
   --> Votre override s'exécute, appelant super.OnInit() en premier
   --> Print() écrit dans le log de script
6. Le client se connecte et charge
   --> MissionGameplay.OnInit() est appelé
   --> Votre override s'exécute
   --> Print() écrit dans le log client
```

Le mot-clé `modded` est le mécanisme clé. Il dit au moteur « prends la classe existante et ajoute mes modifications par-dessus ». C'est ainsi que chaque mod DayZ s'intègre avec le code vanilla.

---

## Prochaines étapes

Maintenant que vous avez un mod fonctionnel, voici les progressions naturelles :

### Ajouter une couche 3_Game

Ajoutez des données de configuration ou des constantes qui ne dépendent pas des entités du monde :

```
HelloMod/
  Scripts/
    config.cpp              <-- Ajoutez l'entrée gameScriptModule
    3_Game/
      HelloMod/
        HelloConfig.c       <-- Classe de configuration
    5_Mission/
      HelloMod/
        HelloMission.c      <-- Fichier existant
```

Mettez à jour `config.cpp` pour inclure la nouvelle couche :

```cpp
dependencies[] = { "Game", "Mission" };

class defs
{
    class gameScriptModule
    {
        value = "";
        files[] = { "HelloMod/Scripts/3_Game" };
    };
    class missionScriptModule
    {
        value = "";
        files[] = { "HelloMod/Scripts/5_Mission" };
    };
};
```

### Ajouter une couche 4_World

Créez des objets personnalisés, étendez les joueurs ou ajoutez des gestionnaires du monde :

```
HelloMod/
  Scripts/
    config.cpp              <-- Ajoutez l'entrée worldScriptModule
    3_Game/
      HelloMod/
        HelloConfig.c
    4_World/
      HelloMod/
        HelloManager.c      <-- Logique liée au monde
    5_Mission/
      HelloMod/
        HelloMission.c
```

### Ajouter de l'UI

Créez un simple panneau en jeu (couvert dans la Partie 3 de ce guide) :

```
HelloMod/
  GUI/
    layouts/
      hello_panel.layout    <-- Fichier de mise en page UI
  Scripts/
    5_Mission/
      HelloMod/
        HelloPanel.c        <-- Script UI
```

### Ajouter un objet personnalisé

Définissez un objet dans `Data/config.cpp` et créez son comportement script dans `4_World` :

```
HelloMod/
  Data/
    config.cpp              <-- CfgVehicles avec définition d'objet
    Models/
      hello_item.p3d        <-- Modèle 3D
  Scripts/
    4_World/
      HelloMod/
        HelloItem.c         <-- Script de comportement d'objet
```

### Dépendre d'un framework

Si vous voulez utiliser les fonctionnalités de Community Framework (CF), ajoutez la dépendance :

```cpp
// Dans config.cpp
requiredAddons[] = { "DZ_Data", "JM_CF_Scripts" };
```

---

## Dépannage

### "Addon HelloMod_Scripts requires addon DZ_Data which is not loaded"

Votre `requiredAddons` référence un addon qui n'est pas présent. Assurez-vous que `DZ_Data` est correctement orthographié et que le jeu de base DayZ est chargé.

### Pas de sortie log (le mod semble ne pas se charger)

Vérifiez ces points dans l'ordre :

1. **Le mod est-il dans le paramètre de lancement ?** Vérifiez que `-mod=HelloMod` ou `-mod=@HelloMod` est dans votre commande de lancement.
2. **config.cpp est-il au bon endroit ?** Il doit être à la racine du PBO (ou à la racine du dossier `Scripts/` en file-patching).
3. **Les chemins de script sont-ils corrects ?** Les chemins `files[]` dans `config.cpp` doivent correspondre à la structure de répertoires réelle. `"HelloMod/Scripts/5_Mission"` signifie que le moteur cherche exactement ce chemin.
4. **Y a-t-il une classe CfgPatches ?** Sans elle, le PBO est ignoré.

### SCRIPT (E): Undefined variable / Undefined type

Votre code référence quelque chose qui n'existe pas dans cette couche. Causes courantes :

- Référencer `PlayerBase` depuis `3_Game` (il est défini dans `4_World`)
- Faute de frappe dans un nom de classe ou de variable
- Appel manquant à `super.OnInit()` (cause des défaillances en cascade)

### SCRIPT (E): Member not found

La méthode ou propriété que vous appelez n'existe pas sur cette classe. Vérifiez l'API vanilla. Erreur courante : appeler des méthodes d'une version DayZ plus récente en exécutant une version plus ancienne.

### Le mod se charge mais le script ne s'exécute pas

- Vérifiez que votre fichier `.c` est dans le répertoire listé dans `files[]`
- Assurez-vous que le fichier a une extension `.c` (pas `.txt` ou `.cs`)
- Vérifiez que le nom `modded class` correspond exactement à la classe vanilla (sensible à la casse)

### Erreurs d'empaquetage PBO

- Assurez-vous que `config.cpp` est au niveau racine dans le PBO
- Les chemins de fichiers dans les PBOs utilisent des barres obliques (`/`), pas des antislashs
- Vérifiez qu'il n'y a pas de fichiers binaires dans le dossier Scripts (uniquement `.c` et `.cpp`)

---

## Bonnes pratiques

- Appelez toujours `super.OnInit()` avant votre code personnalisé dans les classes de mission moddées -- le sauter casse l'initialisation des autres mods.
- Utilisez un préfixe unique dans vos messages `Print()` (par exemple, `[HelloMod]`) pour pouvoir chercher rapidement dans les fichiers log.
- Commencez avec `5_Mission` uniquement. Ajoutez les couches `3_Game` et `4_World` progressivement à mesure que votre mod grandit.
- Utilisez `-filePatching` pendant le développement pour éviter de re-empaqueter les PBOs à chaque modification.
- Gardez votre premier mod à moins de 3 fichiers jusqu'à ce qu'il fonctionne, puis étendez. Déboguer une structure minimale est bien plus facile.

---

## Théorie vs Pratique

| Concept | Théorie | Réalité |
|---------|---------|---------|
| `Print()` affiche dans le log | Les messages apparaissent dans le log de script | La sortie va dans le fichier `.RPT`, pas dans un log de script séparé. Sur les serveurs dédiés, vérifiez le RPT du serveur dans le dossier de profil |
| `-filePatching` charge les fichiers loose | Les mods non empaquetés fonctionnent instantanément | Certains assets (modèles, textures) nécessitent encore l'empaquetage PBO ; les scripts fonctionnent en loose, mais les fichiers `.layout` peuvent ne pas se charger depuis des dossiers non empaquetés sur toutes les configurations |
| `modded class` patche le vanilla | Votre override remplace l'original | Plusieurs mods peuvent utiliser `modded class` sur la même classe ; ils se chaînent dans l'ordre de chargement. Si un saute `super.OnInit()`, tous les mods suivants sont cassés |
| `DZ_Data` est la seule dépendance nécessaire | `requiredAddons` minimal | Fonctionne pour les mods purement script, mais si vous référencez une classe d'arme/objet vanilla, vous avez aussi besoin de `DZ_Scripts` ou du PBO vanilla spécifique |
| Trois fichiers suffisent | Le mod se charge avec mod.cpp + config.cpp + un fichier .c | Vrai pour un mod uniquement script, mais ajouter des objets ou de l'UI nécessite des PBOs supplémentaires (Data, GUI) |

---

## Liste complète des fichiers

Pour référence, voici les trois fichiers dans leur intégralité :

### HelloMod/mod.cpp

```cpp
name = "Hello Mod";
author = "YourName";
version = "1.0";
overview = "My first DayZ mod - prints a message on mission start.";
```

### HelloMod/Scripts/config.cpp

```cpp
class CfgPatches
{
    class HelloMod_Scripts
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
    class HelloMod
    {
        dir = "HelloMod";
        name = "Hello Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Mission" };

        class defs
        {
            class missionScriptModule
            {
                value = "";
                files[] = { "HelloMod/Scripts/5_Mission" };
            };
        };
    };
};
```

### HelloMod/Scripts/5_Mission/HelloMod/HelloMission.c

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Server is running.");
    }
};

modded class MissionGameplay
{
    override void OnInit()
    {
        super.OnInit();
        Print("[HelloMod] Mission started! Client is running.");
    }
};
```

---

**Précédent :** [Chapitre 2.3 : mod.cpp & Workshop](03-mod-cpp.md)
**Suivant :** [Chapitre 2.5 : Bonnes pratiques d'organisation des fichiers](05-file-organization.md)
