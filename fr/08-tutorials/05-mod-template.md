# Chapitre 8.5 : Utiliser le DayZ Mod Template

> **Resume :** Ce tutoriel vous montre comment utiliser le DayZ Mod Template open-source d'InclementDab pour creer un nouveau projet de mod en quelques secondes. Au lieu de creer chaque fichier de zero, vous clonez un squelette pret a l'emploi qui contient deja la bonne structure de dossiers, config.cpp, mod.cpp et les stubs des couches de scripts. Vous renommez ensuite quelques elements et vous pouvez commencer a coder immediatement.

---

## Sommaire

- [Qu'est-ce que le DayZ Mod Template ?](#quest-ce-que-le-dayz-mod-template-)
- [Ce que le template fournit](#ce-que-le-template-fournit)
- [Etape 1 : Cloner ou telecharger le template](#etape-1--cloner-ou-telecharger-le-template)
- [Etape 2 : Comprendre la structure des fichiers](#etape-2--comprendre-la-structure-des-fichiers)
- [Etape 3 : Renommer le mod](#etape-3--renommer-le-mod)
- [Etape 4 : Mettre a jour config.cpp](#etape-4--mettre-a-jour-configcpp)
- [Etape 5 : Mettre a jour mod.cpp](#etape-5--mettre-a-jour-modcpp)
- [Etape 6 : Renommer les dossiers et fichiers de scripts](#etape-6--renommer-les-dossiers-et-fichiers-de-scripts)
- [Etape 7 : Compiler et tester](#etape-7--compiler-et-tester)
- [Integration avec DayZ Tools et Workbench](#integration-avec-dayz-tools-et-workbench)
- [Template vs. configuration manuelle](#template-vs-configuration-manuelle)
- [Prochaines etapes](#prochaines-etapes)

---

## Qu'est-ce que le DayZ Mod Template ?

Le **DayZ Mod Template** est un repository open-source maintenu par InclementDab qui fournit un squelette de mod complet et pret a l'emploi pour DayZ :

**Repository :** [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)

Au lieu de creer chaque fichier a la main (comme decrit dans le [Chapitre 8.1 : Votre premier mod](01-first-mod.md)), le template vous donne une structure de repertoire preconfiguree avec tout le code boilerplate deja en place. Vous le clonez, renommez quelques identifiants, et vous etes pret a ecrire de la logique de jeu.

C'est le point de depart recommande pour quiconque a deja cree un mod Hello World et souhaite passer a des projets plus complexes.

---

## Ce que le template fournit

Le template inclut tout ce dont un mod DayZ a besoin pour se compiler et se charger :

| Fichier / Dossier | Utilite |
|--------------------|---------|
| `mod.cpp` | Metadonnees du mod (nom, auteur, version) affichees dans le launcher DayZ |
| `config.cpp` | Declarations CfgPatches et CfgMods qui enregistrent le mod aupres du moteur |
| `Scripts/3_Game/` | Stubs de la couche Game (enums, constantes, classes de configuration) |
| `Scripts/4_World/` | Stubs de la couche World (entites, managers, interactions avec le monde) |
| `Scripts/5_Mission/` | Stubs de la couche Mission (UI, mission hooks) |
| `.gitignore` | Ignores preconfigures pour le developpement DayZ (PBOs, logs, fichiers temporaires) |

Le template suit la hierarchie standard des 5 couches de scripts documentee dans le [Chapitre 2.1 : La hierarchie des 5 couches de scripts](../02-mod-structure/01-five-layers.md). Les trois couches de scripts sont configurees dans config.cpp, ce qui vous permet de placer du code dans n'importe quelle couche sans configuration supplementaire.

---

## Etape 1 : Cloner ou telecharger le template

### Option A : Utiliser la fonction "Use this template" de GitHub

1. Rendez-vous sur [https://github.com/InclementDab/DayZ-Mod-Template](https://github.com/InclementDab/DayZ-Mod-Template)
2. Cliquez sur le bouton vert **"Use this template"** en haut du repository
3. Choisissez **"Create a new repository"**
4. Nommez votre repository (par exemple `MyAwesomeMod`)
5. Clonez votre nouveau repository sur votre lecteur P: :

```bash
cd P:\
git clone https://github.com/YourUsername/MyAwesomeMod.git
```

### Option B : Clonage direct

Si vous n'avez pas besoin de votre propre repository GitHub, clonez directement le template :

```bash
cd P:\
git clone https://github.com/InclementDab/DayZ-Mod-Template.git MyAwesomeMod
```

### Option C : Telecharger en ZIP

1. Rendez-vous sur la page du repository
2. Cliquez sur **Code** puis **Download ZIP**
3. Extrayez le ZIP dans `P:\MyAwesomeMod\`

---

## Etape 2 : Comprendre la structure des fichiers

Apres le clonage, votre repertoire de mod ressemble a ceci :

```
P:\MyAwesomeMod\
    mod.cpp
    Scripts\
        config.cpp
        3_Game\
            ModName\
                (scripts de la couche Game)
        4_World\
            ModName\
                (scripts de la couche World)
        5_Mission\
            ModName\
                (scripts de la couche Mission)
```

### Comment les pieces s'assemblent

**`mod.cpp`** est la carte d'identite de votre mod. Elle controle ce que les joueurs voient dans la liste des mods du launcher DayZ. Voir le [Chapitre 2.3 : mod.cpp & Workshop](../02-mod-structure/03-mod-cpp.md) pour tous les champs disponibles.

**`Scripts/config.cpp`** est le fichier le plus important. Il indique au moteur DayZ :
- De quoi votre mod depend (`CfgPatches.requiredAddons[]`)
- Ou se trouve chaque couche de scripts (`CfgMods.class defs`)
- Quels defines du preprocesseur activer (`defines[]`)

Voir le [Chapitre 2.2 : config.cpp en detail](../02-mod-structure/02-config-cpp.md) pour une reference complete.

**`Scripts/3_Game/`** est charge en premier. Placez-y les enums, constantes, IDs RPC, classes de configuration et tout ce qui ne reference pas d'entites du monde.

**`Scripts/4_World/`** est charge en deuxieme. Placez-y les classes d'entites (`modded class ItemBase`), les managers et tout ce qui interagit avec les objets du jeu.

**`Scripts/5_Mission/`** est charge en dernier. Placez-y les mission hooks (`modded class MissionServer`), les panneaux UI et la logique de demarrage. Cette couche peut referencer les types de toutes les couches inferieures.

---

## Etape 3 : Renommer le mod

Le template est livre avec des noms generiques. Vous devez les remplacer par le nom reel de votre mod. Voici une approche systematique.

### Choisir vos noms

Avant de faire des modifications, decidez :

| Identifiant | Exemple | Utilise dans |
|-------------|---------|-------------|
| **Nom d'affichage du mod** | `"My Awesome Mod"` | mod.cpp, config.cpp |
| **Nom du repertoire** | `MyAwesomeMod` | Nom du dossier, chemins config.cpp |
| **Classe CfgPatches** | `MyAwesomeMod_Scripts` | config.cpp CfgPatches |
| **Classe CfgMods** | `MyAwesomeMod` | config.cpp CfgMods |
| **Sous-dossier de scripts** | `MyAwesomeMod` | Dans 3_Game/, 4_World/, 5_Mission/ |
| **Define du preprocesseur** | `MYAWESOMEMOD` | config.cpp defines[], verifications #ifdef |

### Regles de nommage

- **Pas d'espaces ni de caracteres speciaux** dans les noms de repertoires et de classes. Utilisez le PascalCase ou des underscores.
- **Les noms de classes CfgPatches doivent etre globalement uniques.** Deux mods avec le meme nom de classe CfgPatches entreront en conflit. Utilisez le nom de votre mod comme prefixe.
- **Les noms de sous-dossiers de scripts** dans chaque couche doivent correspondre au nom de votre mod par souci de coherence.

---

## Etape 4 : Mettre a jour config.cpp

Ouvrez `Scripts/config.cpp` et mettez a jour les sections suivantes.

### CfgPatches

Remplacez le nom de classe du template par le votre :

```cpp
class CfgPatches
{
    class MyAwesomeMod_Scripts    // <-- Votre nom de patch unique
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data"            // Dependance au jeu de base
        };
    };
};
```

Si votre mod depend d'un autre mod, ajoutez son nom de classe CfgPatches dans `requiredAddons[]` :

```cpp
requiredAddons[] =
{
    "DZ_Data",
    "CF_Scripts"              // Depend du Community Framework
};
```

### CfgMods

Mettez a jour l'identite du mod et les chemins de scripts :

```cpp
class CfgMods
{
    class MyAwesomeMod
    {
        dir = "MyAwesomeMod";
        name = "My Awesome Mod";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/3_Game" };
            };
            class worldScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/4_World" };
            };
            class missionScriptModule
            {
                value = "";
                files[] = { "MyAwesomeMod/Scripts/5_Mission" };
            };
        };
    };
};
```

**Points importants :**
- La valeur `dir` doit correspondre exactement au nom du dossier racine de votre mod.
- Chaque chemin `files[]` est relatif a la racine du mod.
- Le tableau `dependencies[]` doit lister les modules de scripts vanilla auxquels vous vous connectez. La plupart des mods utilisent les trois : `"Game"`, `"World"` et `"Mission"`.

### Defines du preprocesseur (optionnel)

Si vous souhaitez que d'autres mods puissent detecter la presence de votre mod, ajoutez un tableau `defines[]` :

```cpp
class MyAwesomeMod
{
    // ... (autres champs ci-dessus)

    class defs
    {
        class gameScriptModule
        {
            value = "";
            files[] = { "MyAwesomeMod/Scripts/3_Game" };
        };
        // ... autres modules ...
    };

    // Activer la detection inter-mods
    defines[] = { "MYAWESOMEMOD" };
};
```

D'autres mods peuvent alors utiliser `#ifdef MYAWESOMEMOD` pour compiler conditionnellement du code qui s'integre au votre.

---

## Etape 5 : Mettre a jour mod.cpp

Ouvrez `mod.cpp` dans le repertoire racine et mettez-le a jour avec les informations de votre mod :

```cpp
name         = "My Awesome Mod";
author       = "YourName";
version      = "1.0.0";
overview     = "Une breve description de ce que fait votre mod.";
picture      = "";             // Optionnel : chemin vers une image de previsualisation
logo         = "";             // Optionnel : chemin vers un logo
logoSmall    = "";             // Optionnel : chemin vers un petit logo
logoOver     = "";             // Optionnel : chemin vers un logo au survol
tooltip      = "My Awesome Mod";
action       = "";             // Optionnel : URL vers le site web de votre mod
```

Au minimum, definissez `name`, `author` et `overview`. Les autres champs sont optionnels mais ameliorent la presentation dans le launcher.

---

## Etape 6 : Renommer les dossiers et fichiers de scripts

Renommez les sous-dossiers de scripts dans chaque couche pour correspondre au nom de votre mod :

```
Scripts/3_Game/ModName/    -->  Scripts/3_Game/MyAwesomeMod/
Scripts/4_World/ModName/   -->  Scripts/4_World/MyAwesomeMod/
Scripts/5_Mission/ModName/ -->  Scripts/5_Mission/MyAwesomeMod/
```

Dans ces dossiers, renommez tous les fichiers `.c` generiques et mettez a jour leurs noms de classes. Par exemple, si le template contient un fichier `ModInit.c` avec une classe nommee `ModInit`, renommez-le en `MyAwesomeModInit.c` et mettez a jour la classe :

```c
modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        Print("[MyAwesomeMod] Server initialized!");
    }
};
```

---

## Etape 7 : Compiler et tester

### Utiliser le File Patching (iteration rapide)

Le moyen le plus rapide de tester pendant le developpement :

```batch
DayZDiag_x64.exe -mod=P:\MyAwesomeMod -filePatching
```

Cela charge vos scripts directement depuis les dossiers sources sans empaqueter de PBO. Modifiez un fichier `.c`, redemarrez le jeu et voyez les changements immediatement.

### Utiliser l'Addon Builder (pour la distribution)

Quand vous etes pret a distribuer :

1. Ouvrez **DayZ Tools** depuis Steam
2. Lancez l'**Addon Builder**
3. Definissez **Source directory** sur `P:\MyAwesomeMod\Scripts\`
4. Definissez **Output directory** sur `P:\@MyAwesomeMod\Addons\`
5. Definissez **Prefix** sur `MyAwesomeMod\Scripts`
6. Cliquez sur **Pack**

Puis copiez `mod.cpp` a cote du dossier `Addons` :

```
P:\@MyAwesomeMod\
    mod.cpp
    Addons\
        Scripts.pbo
```

### Verifier dans le log de scripts

Apres le lancement, verifiez le log de scripts pour vos messages :

```
%localappdata%\DayZ\script_<date>_<time>.log
```

Recherchez le tag prefixe de votre mod (par exemple `[MyAwesomeMod]`).

---

## Integration avec DayZ Tools et Workbench

### Workbench

DayZ Workbench peut ouvrir et editer les scripts de votre mod avec la coloration syntaxique :

1. Ouvrez **Workbench** depuis DayZ Tools
2. Allez dans **File > Open** et naviguez vers le dossier `Scripts/` de votre mod
3. Ouvrez n'importe quel fichier `.c` pour l'editer avec le support de base d'Enforce Script

Workbench lit la `config.cpp` pour comprendre quels fichiers appartiennent a quel module de scripts. Avoir une config.cpp correctement configuree est donc essentiel.

### Configuration du lecteur P:

Le template est concu pour fonctionner depuis le lecteur P:. Si vous avez clone ailleurs, creez une jonction :

```batch
mklink /J P:\MyAwesomeMod "D:\Projects\MyAwesomeMod"
```

Cela rend le mod accessible a `P:\MyAwesomeMod` sans deplacer de fichiers.

### Automatisation de l'Addon Builder

Pour des builds repetes, vous pouvez creer un fichier batch a la racine de votre mod :

```batch
@echo off
set DAYZ_TOOLS="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools"
set SOURCE=P:\MyAwesomeMod\Scripts
set OUTPUT=P:\@MyAwesomeMod\Addons
set PREFIX=MyAwesomeMod\Scripts

%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe %SOURCE% %OUTPUT% -prefix=%PREFIX% -clear
echo Compilation terminee.
pause
```

---

## Template vs. configuration manuelle

| Aspect | Template | Manuel (Chapitre 8.1) |
|--------|----------|----------------------|
| **Temps jusqu'au premier build** | ~2 minutes | ~15 minutes |
| **Les 3 couches de scripts** | Preconfigurees | Vous les ajoutez selon vos besoins |
| **config.cpp** | Complete avec tous les modules | Minimale (mission uniquement) |
| **Pret pour Git** | .gitignore inclus | Vous creez le votre |
| **Valeur pedagogique** | Plus faible (fichiers pre-faits) | Plus elevee (vous construisez tout vous-meme) |
| **Recommande pour** | Moddeurs experimentes, nouveaux projets | Moddeurs debutants qui apprennent les bases |

**Recommandation :** Si c'est votre tout premier mod DayZ, commencez par le [Chapitre 8.1](01-first-mod.md) pour comprendre chaque fichier. Une fois a l'aise, utilisez le template pour tous vos futurs projets.

---

## Prochaines etapes

Avec votre mod base sur le template operationnel, vous pouvez :

1. **Ajouter un objet personnalise** -- Suivez le [Chapitre 8.2 : Creer un objet personnalise](02-custom-item.md) pour definir des objets dans config.cpp.
2. **Construire un panneau d'administration** -- Suivez le [Chapitre 8.3 : Construire un panneau d'administration](03-admin-panel.md) pour l'UI de gestion serveur.
3. **Ajouter des commandes de chat** -- Suivez le [Chapitre 8.4 : Ajouter des commandes de chat](04-chat-commands.md) pour les commandes texte en jeu.
4. **Etudier config.cpp en profondeur** -- Lisez le [Chapitre 2.2 : config.cpp en detail](../02-mod-structure/02-config-cpp.md) pour comprendre chaque champ.
5. **Decouvrir les options de mod.cpp** -- Lisez le [Chapitre 2.3 : mod.cpp & Workshop](../02-mod-structure/03-mod-cpp.md) pour la publication sur le Workshop.
6. **Ajouter des dependances** -- Si votre mod utilise le Community Framework ou un autre mod, mettez a jour `requiredAddons[]` et consultez le [Chapitre 2.4 : Votre premier mod](../02-mod-structure/04-minimum-viable-mod.md).

---

**Precedent :** [Chapitre 8.4 : Commandes de chat](04-chat-commands.md) | [Accueil](../../README.md)
