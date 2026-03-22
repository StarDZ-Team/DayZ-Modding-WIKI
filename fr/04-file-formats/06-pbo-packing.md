# Chapitre 4.6 : PBO Packing

[Accueil](../../README.md) | [<< Précédent : Workflow DayZ Tools](05-dayz-tools.md) | **PBO Packing** | [Suivant : Guide Workbench >>](07-workbench-guide.md)

---

## Introduction

Un **PBO** (Packed Bank of Objects) est le format d'archive de DayZ -- l'équivalent d'un fichier `.zip` pour le contenu du jeu. Chaque mod que le jeu charge est livré sous forme d'un ou plusieurs fichiers PBO. Quand un joueur s'abonne à un mod sur le Steam Workshop, il télécharge des PBO. Quand un serveur charge des mods, il lit des PBO. Le PBO est le livrable final de l'ensemble du pipeline de modding.

Comprendre comment créer des PBO correctement -- quand binariser, comment définir les préfixes, comment structurer la sortie, et comment automatiser le processus -- est la dernière étape entre vos fichiers source et un mod fonctionnel. Ce chapitre couvre tout, du concept de base jusqu'aux workflows de build automatisés avancés.

---

## Table des matières

- [Qu'est-ce qu'un PBO ?](#quest-ce-quun-pbo)
- [Structure interne du PBO](#structure-interne-du-pbo)
- [AddonBuilder : l'outil d'empaquetage](#addonbuilder--loutil-dempaquetage)
- [Le flag -packonly](#le-flag--packonly)
- [Le flag -prefix](#le-flag--prefix)
- [Binarisation : quand c'est nécessaire ou non](#binarisation--quand-cest-nécessaire-ou-non)
- [Signature de clé](#signature-de-clé)
- [Structure du dossier @mod](#structure-du-dossier-mod)
- [Scripts de build automatisés](#scripts-de-build-automatisés)
- [Builds multi-PBO](#builds-multi-pbo)
- [Erreurs de build courantes et solutions](#erreurs-de-build-courantes-et-solutions)
- [Test : File Patching vs. chargement PBO](#test--file-patching-vs-chargement-pbo)
- [Bonnes pratiques](#bonnes-pratiques)

---

## Qu'est-ce qu'un PBO ?

Un PBO est un fichier d'archive plat qui contient une arborescence de répertoires d'assets de jeu. Il n'a pas de compression (contrairement au ZIP) -- les fichiers à l'intérieur sont stockés à leur taille originale. L'« empaquetage » est purement organisationnel : de nombreux fichiers deviennent un seul fichier avec une structure de chemin interne.

### Caractéristiques principales

- **Pas de compression :** Les fichiers sont stockés tels quels. La taille du PBO est égale à la somme de son contenu plus un petit en-tête.
- **En-tête plat :** Une liste d'entrées de fichiers avec chemins, tailles et offsets.
- **Métadonnées de préfixe :** Chaque PBO déclare un préfixe de chemin interne qui mappe son contenu dans le système de fichiers virtuel du moteur.
- **Lecture seule à l'exécution :** Le moteur lit les PBO mais n'y écrit jamais.
- **Signé pour le multijoueur :** Les PBO peuvent être signés avec une paire de clés de style Bohemia pour la vérification de signature serveur.

### Pourquoi des PBO au lieu de fichiers libres

- **Distribution :** Un fichier par composant de mod est plus simple que des milliers de fichiers libres.
- **Intégrité :** La signature de clé garantit que le mod n'a pas été altéré.
- **Performance :** Les E/S fichier du moteur sont optimisées pour la lecture depuis les PBO.
- **Organisation :** Le système de préfixes garantit l'absence de collisions de chemins entre les mods.

---

## Structure interne du PBO

Quand vous ouvrez un PBO (en utilisant un outil comme PBO Manager ou MikeroTools), vous voyez une arborescence de répertoires :

```
MyMod.pbo
  $PBOPREFIX$                    <-- Fichier texte contenant le chemin de préfixe
  config.bin                      <-- config.cpp binarisé (ou config.cpp si -packonly)
  Scripts/
    3_Game/
      MyConstants.c
    4_World/
      MyManager.c
    5_Mission/
      MyUI.c
  data/
    models/
      my_item.p3d                 <-- ODOL binarisé (ou MLOD si -packonly)
    textures/
      my_item_co.paa
      my_item_nohq.paa
      my_item_smdi.paa
    materials/
      my_item.rvmat
  sound/
    gunshot_01.ogg
  GUI/
    layouts/
      my_panel.layout
```

### $PBOPREFIX$

Le fichier `$PBOPREFIX$` est un minuscule fichier texte à la racine du PBO qui déclare le préfixe de chemin du mod. Par exemple :

```
MyMod
```

Cela dit au moteur : « Quand quelque chose référence `MyMod\data\textures\my_item_co.paa`, chercher dans ce PBO à `data\textures\my_item_co.paa`. »

### config.bin vs. config.cpp

- **config.bin :** Version binarisée (binaire) de config.cpp, créée par Binarize. Plus rapide à parser au chargement.
- **config.cpp :** La configuration originale en format texte. Fonctionne dans le moteur mais est légèrement plus lente à parser.

Quand vous construisez avec binarisation, config.cpp devient config.bin. Quand vous utilisez `-packonly`, config.cpp est inclus tel quel.

---

## AddonBuilder : l'outil d'empaquetage

**AddonBuilder** est l'outil officiel d'empaquetage PBO de Bohemia, inclus avec DayZ Tools. Il peut fonctionner en mode GUI ou en mode ligne de commande.

### Mode GUI

1. Lancez AddonBuilder depuis le DayZ Tools Launcher.
2. **Répertoire source :** Naviguez vers votre dossier mod sur P: (ex. `P:\MyMod`).
3. **Répertoire de sortie :** Naviguez vers votre dossier de sortie (ex. `P:\output`).
4. **Options :**
   - **Binarize :** Cochez pour exécuter Binarize sur le contenu (convertit P3D, textures, configs).
   - **Sign :** Cochez et sélectionnez une clé pour signer le PBO.
   - **Prefix :** Entrez le préfixe du mod (ex. `MyMod`).
5. Cliquez sur **Pack**.

### Mode ligne de commande

Le mode ligne de commande est préféré pour les builds automatisés :

```bash
AddonBuilder.exe [chemin_source] [chemin_sortie] [options]
```

**Exemple complet :**
```bash
"P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe" ^
    "P:\MyMod" ^
    "P:\output" ^
    -prefix="MyMod" ^
    -sign="P:\keys\MyKey"
```

### Options de ligne de commande

| Flag | Description |
|------|-------------|
| `-prefix=<chemin>` | Définir le préfixe interne du PBO (critique pour la résolution de chemins) |
| `-packonly` | Ignorer la binarisation, empaqueter les fichiers tels quels |
| `-sign=<chemin_clé>` | Signer le PBO avec la clé BI spécifiée (chemin de la clé privée, sans extension) |
| `-include=<chemin>` | Liste de fichiers à inclure -- ne packer que les fichiers correspondant à ce filtre |
| `-exclude=<chemin>` | Liste de fichiers à exclure -- ignorer les fichiers correspondant à ce filtre |
| `-binarize=<chemin>` | Chemin vers Binarize.exe (si pas à l'emplacement par défaut) |
| `-temp=<chemin>` | Répertoire temporaire pour la sortie de Binarize |
| `-clear` | Nettoyer le répertoire de sortie avant l'empaquetage |
| `-project=<chemin>` | Chemin du lecteur projet (généralement `P:\`) |

---

## Le flag -packonly

Le flag `-packonly` est l'une des options les plus importantes d'AddonBuilder. Il indique à l'outil d'ignorer toute binarisation et d'empaqueter les fichiers source exactement tels quels.

### Quand utiliser -packonly

| Contenu du mod | Utiliser -packonly ? | Raison |
|---------------|---------------------|--------|
| Scripts uniquement (fichiers .c) | **Oui** | Les scripts ne sont jamais binarisés |
| Layouts UI (.layout) | **Oui** | Les layouts ne sont jamais binarisés |
| Audio uniquement (.ogg) | **Oui** | OGG est déjà prêt pour le jeu |
| Textures pré-converties (.paa) | **Oui** | Déjà au format final |
| Config.cpp (pas de CfgVehicles) | **Oui** | Les configs simples fonctionnent sans binarisation |
| Config.cpp (avec CfgVehicles) | **Non** | Les définitions d'items nécessitent une config binarisée |
| Modèles P3D (MLOD) | **Non** | Doivent être binarisés en ODOL pour la performance |
| Textures TGA/PNG (nécessitent conversion) | **Non** | Doivent être converties en PAA |

### Guide pratique

Pour un **mod scripts uniquement** (comme un framework ou un mod utilitaire sans items personnalisés) :
```bash
AddonBuilder.exe "P:\MyScriptMod" "P:\output" -prefix="MyScriptMod" -packonly
```

Pour un **mod d'items** (armes, vêtements, véhicules avec modèles et textures) :
```bash
AddonBuilder.exe "P:\MyItemMod" "P:\output" -prefix="MyItemMod" -sign="P:\keys\MyKey"
```

> **Astuce :** Beaucoup de mods se divisent en plusieurs PBO précisément pour optimiser le processus de build. Les PBO de scripts utilisent `-packonly` (rapide), tandis que les PBO de données avec modèles et textures reçoivent la binarisation complète (plus lente mais nécessaire).

---

## Le flag -prefix

Le flag `-prefix` définit le préfixe de chemin interne du PBO, qui est écrit dans le fichier `$PBOPREFIX$` à l'intérieur du PBO. Ce préfixe est critique -- il détermine comment le moteur résout les chemins vers le contenu à l'intérieur du PBO.

### Comment fonctionne le préfixe

```
Source : P:\MyMod\data\textures\item_co.paa
Préfixe : MyMod
Chemin interne PBO : data\textures\item_co.paa

Résolution du moteur : MyMod\data\textures\item_co.paa
  --> Cherche dans MyMod.pbo pour : data\textures\item_co.paa
  --> Trouvé !
```

### Préfixes multi-niveaux

Pour les mods qui utilisent une structure de sous-dossiers, le préfixe peut inclure plusieurs niveaux :

```bash
# Source sur le lecteur P:
P:\MyMod\MyMod\Scripts\3_Game\MyClass.c

# Si le préfixe est "MyMod\MyMod\Scripts"
# Interne PBO : 3_Game\MyClass.c
# Chemin moteur : MyMod\MyMod\Scripts\3_Game\MyClass.c
```

### Le préfixe doit correspondre aux références

Si votre config.cpp référence `MyMod\data\texture_co.paa`, alors le PBO contenant cette texture doit avoir le préfixe `MyMod` et le fichier doit être à `data\texture_co.paa` à l'intérieur du PBO. Une discordance fait que le moteur ne trouve pas le fichier.

### Patrons de préfixe courants

| Structure du mod | Chemin source | Préfixe | Référence config |
|-----------------|---------------|---------|------------------|
| Mod simple | `P:\MyMod\` | `MyMod` | `MyMod\data\item.p3d` |
| Mod avec namespace | `P:\MyMod_Weapons\` | `MyMod_Weapons` | `MyMod_Weapons\data\rifle.p3d` |
| Sous-package de scripts | `P:\MyFramework\MyMod\Scripts\` | `MyFramework\MyMod\Scripts` | (référencé via config.cpp `CfgMods`) |

---

## Binarisation : quand c'est nécessaire ou non

La binarisation est la conversion des formats source lisibles par l'homme en formats binaires optimisés pour le moteur. C'est l'étape la plus chronophage du processus de build et la source la plus courante d'erreurs de build.

### Ce qui est binarisé

| Type de fichier | Binarisé en | Requis ? |
|----------------|------------|----------|
| `config.cpp` | `config.bin` | Requis pour les mods définissant des items (CfgVehicles, CfgWeapons) |
| `.p3d` (MLOD) | `.p3d` (ODOL) | Recommandé -- ODOL charge plus vite et est plus petit |
| `.tga` / `.png` | `.paa` | Requis -- le moteur a besoin de PAA à l'exécution |
| `.edds` | `.paa` | Requis -- idem ci-dessus |
| `.rvmat` | `.rvmat` (traité) | Chemins résolus, optimisation mineure |
| `.wrp` | `.wrp` (optimisé) | Requis pour les mods de terrain/carte |

### Ce qui n'est PAS binarisé

| Type de fichier | Raison |
|----------------|--------|
| Scripts `.c` | Les scripts sont chargés comme du texte par le moteur |
| Audio `.ogg` | Déjà au format prêt pour le jeu |
| Fichiers `.layout` | Déjà au format prêt pour le jeu |
| Textures `.paa` | Déjà au format final (pré-converties) |
| Données `.json` | Lues comme du texte par le code script |

### Détails de la binarisation de Config.cpp

La binarisation de config.cpp est l'étape où la plupart des moddeurs rencontrent des problèmes. Le binariseur parse le texte config.cpp, valide sa structure, résout les chaînes d'héritage, et produit un config.bin binaire.

**Quand la binarisation est requise pour config.cpp :**
- La config définit des entrées `CfgVehicles` (items, armes, véhicules, bâtiments).
- La config définit des entrées `CfgWeapons`.
- La config définit des entrées qui référencent des modèles ou des textures.

**Quand la binarisation n'est PAS requise :**
- La config ne définit que `CfgPatches` et `CfgMods` (enregistrement du mod).
- La config ne définit que des configurations sonores.
- Mods scripts uniquement avec un config minimal.

> **Règle générale :** Si votre config.cpp ajoute des items physiques au monde du jeu, vous avez besoin de la binarisation. S'il ne fait qu'enregistrer des scripts et définir des données non-item, `-packonly` fonctionne bien.

---

## Signature de clé

Les PBO peuvent être signés avec une paire de clés cryptographiques. Les serveurs utilisent la vérification de signature pour s'assurer que tous les clients connectés ont les mêmes fichiers de mod (non modifiés).

### Composants de la paire de clés

| Fichier | Extension | Fonction | Qui le possède |
|---------|-----------|----------|----------------|
| Clé privée | `.biprivatekey` | Signe les PBO pendant le build | Auteur du mod uniquement (GARDER SECRET) |
| Clé publique | `.bikey` | Vérifie les signatures | Administrateurs serveur, distribué avec le mod |

### Générer des clés

Utilisez les utilitaires **DSSignFile** ou **DSCreateKey** de DayZ Tools :

```bash
# Générer une paire de clés
DSCreateKey.exe MyModKey

# Cela crée :
#   MyModKey.biprivatekey   (garder secret, ne pas distribuer)
#   MyModKey.bikey          (distribuer aux administrateurs serveur)
```

### Signer pendant le build

```bash
AddonBuilder.exe "P:\MyMod" "P:\output" ^
    -prefix="MyMod" ^
    -sign="P:\keys\MyModKey"
```

Cela produit :
```
P:\output\
  MyMod.pbo
  MyMod.pbo.MyModKey.bisign    <-- Fichier de signature
```

### Installation de la clé côté serveur

Les administrateurs serveur placent la clé publique (`.bikey`) dans le répertoire `keys/` du serveur :

```
DayZServer/
  keys/
    MyModKey.bikey             <-- Autorise les clients avec ce mod à se connecter
```

---

## Structure du dossier @mod

DayZ s'attend à ce que les mods soient organisés dans une structure de répertoire spécifique utilisant la convention du préfixe `@` :

```
@MyMod/
  addons/
    MyMod.pbo                  <-- Contenu du mod empaqueté
    MyMod.pbo.MyKey.bisign     <-- Signature PBO (optionnel)
  keys/
    MyKey.bikey                <-- Clé publique pour les serveurs (optionnel)
  mod.cpp                      <-- Métadonnées du mod
```

### mod.cpp

Le fichier `mod.cpp` fournit les métadonnées affichées dans le lanceur DayZ :

```cpp
name = "My Awesome Mod";
author = "ModAuthor";
version = "1.0.0";
url = "https://steamcommunity.com/sharedfiles/filedetails/?id=XXXXXXXXX";
```

### Mods multi-PBO

Les gros mods se divisent souvent en plusieurs PBO au sein d'un seul dossier `@mod` :

```
@MyFramework/
  addons/
    MyMod_Core_Scripts.pbo        <-- Couche scripts
    MyMod_Core_Data.pbo           <-- Textures, modèles, matériaux
    MyMod_Core_GUI.pbo            <-- Fichiers layout, imagesets
  keys/
    MyMod.bikey
  mod.cpp
```

### Charger les mods

Les mods sont chargés via le paramètre `-mod` :

```bash
# Mod unique
DayZDiag_x64.exe -mod="@MyMod"

# Mods multiples (séparés par des points-virgules)
DayZDiag_x64.exe -mod="@MyFramework;@MyMod_Weapons;@MyMod_Missions"
```

Le dossier `@` doit être dans le répertoire racine du jeu, ou un chemin absolu doit être fourni.

---

## Scripts de build automatisés

L'empaquetage PBO manuel via le GUI d'AddonBuilder est acceptable pour les petits mods simples. Pour les projets plus importants avec plusieurs PBO, les scripts de build automatisés sont essentiels.

### Patron de script batch

Un `build_pbos.bat` typique :

```batch
@echo off
setlocal

set TOOLS="P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe"
set OUTPUT="P:\@MyMod\addons"
set KEY="P:\keys\MyKey"

echo === Building Scripts PBO ===
%TOOLS% "P:\MyMod\Scripts" %OUTPUT% -prefix="MyMod\Scripts" -packonly -clear

echo === Building Data PBO ===
%TOOLS% "P:\MyMod\Data" %OUTPUT% -prefix="MyMod\Data" -sign=%KEY% -clear

echo === Build Complete ===
pause
```

### Patron de script Python (dev.py)

Pour des builds plus sophistiqués, un script Python offre une meilleure gestion des erreurs, journalisation et logique conditionnelle :

```python
import subprocess
import os
import sys

ADDON_BUILDER = r"P:\DayZ Tools\Bin\AddonBuilder\AddonBuilder.exe"
OUTPUT_DIR = r"P:\@MyMod\addons"
KEY_PATH = r"P:\keys\MyKey"

PBOS = [
    {
        "name": "Scripts",
        "source": r"P:\MyMod\Scripts",
        "prefix": r"MyMod\Scripts",
        "packonly": True,
    },
    {
        "name": "Data",
        "source": r"P:\MyMod\Data",
        "prefix": r"MyMod\Data",
        "packonly": False,
    },
]

def build_pbo(pbo_config):
    """Build a single PBO."""
    cmd = [
        ADDON_BUILDER,
        pbo_config["source"],
        OUTPUT_DIR,
        f"-prefix={pbo_config['prefix']}",
    ]

    if pbo_config.get("packonly"):
        cmd.append("-packonly")
    else:
        cmd.append(f"-sign={KEY_PATH}")

    print(f"Building {pbo_config['name']}...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"ERROR building {pbo_config['name']}:")
        print(result.stderr)
        return False

    print(f"  {pbo_config['name']} built successfully.")
    return True

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    success = True
    for pbo in PBOS:
        if not build_pbo(pbo):
            success = False

    if success:
        print("\nAll PBOs built successfully.")
    else:
        print("\nBuild completed with errors.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Intégration avec dev.py

Le projet MyMod utilise `dev.py` comme orchestrateur de build central :

```bash
python dev.py build          # Construire tous les PBO
python dev.py server         # Build + lancer le serveur + surveiller les logs
python dev.py full           # Build + serveur + client
```

Ce patron est recommandé pour tout espace de travail multi-mod. Une seule commande construit tout, lance le serveur, et démarre la surveillance -- éliminant les étapes manuelles et réduisant les erreurs humaines.

---

## Builds multi-PBO

Les gros mods bénéficient de la division en plusieurs PBO. Cela offre plusieurs avantages :

### Pourquoi diviser en plusieurs PBO

1. **Reconstructions plus rapides.** Si vous ne changez qu'un script, reconstruisez uniquement le PBO de scripts (avec `-packonly`, ce qui prend des secondes). Le PBO de données (avec binarisation) prend des minutes et n'a pas besoin d'être reconstruit.
2. **Chargement modulaire.** Les PBO serveur uniquement peuvent être exclus des téléchargements client.
3. **Organisation plus propre.** Scripts, données et GUI sont clairement séparés.
4. **Builds parallèles.** Les PBO indépendants peuvent être construits simultanément.

### Patron de division typique

```
@MyMod/
  addons/
    MyMod_Core.pbo           <-- config.cpp, CfgPatches (binarisé)
    MyMod_Scripts.pbo         <-- Tous les fichiers script .c (-packonly)
    MyMod_Data.pbo            <-- Modèles, textures, matériaux (binarisé)
    MyMod_GUI.pbo             <-- Layouts, imagesets (-packonly)
    MyMod_Sounds.pbo          <-- Fichiers audio OGG (-packonly)
```

### Dépendances entre PBO

Quand un PBO dépend d'un autre (ex. les scripts référencent des items définis dans le PBO config), le `requiredAddons[]` dans `CfgPatches` garantit l'ordre de chargement correct :

```cpp
// In MyMod_Scripts config.cpp
class CfgPatches
{
    class MyMod_Scripts
    {
        requiredAddons[] = {"MyMod_Core"};   // Load after the core PBO
    };
};
```

---

## Erreurs de build courantes et solutions

### Erreur : "Include file not found"

**Cause :** Config.cpp référence un fichier (modèle, texture) qui n'existe pas au chemin attendu.
**Solution :** Vérifiez que le fichier existe sur P: au chemin exact référencé. Vérifiez l'orthographe et la casse.

### Erreur : "Binarize failed" sans détails

**Cause :** Binarize a planté sur un fichier source corrompu ou invalide.
**Solution :**
1. Vérifiez quel fichier Binarize traitait (regardez sa sortie de log).
2. Ouvrez le fichier problématique dans l'outil approprié (Object Builder pour P3D, TexView2 pour les textures).
3. Validez le fichier.
4. Coupables courants : textures non puissance de 2, fichiers P3D corrompus, syntaxe config.cpp invalide.

### Erreur : "Addon requires addon X"

**Cause :** `requiredAddons[]` dans CfgPatches liste un addon qui n'est pas présent.
**Solution :** Soit installez l'addon requis, ajoutez-le au build, ou supprimez l'exigence si elle n'est pas réellement nécessaire.

### Erreur : Erreur de parsing Config.cpp (ligne X)

**Cause :** Erreur de syntaxe dans config.cpp.
**Solution :** Ouvrez config.cpp dans un éditeur de texte et vérifiez la ligne X. Problèmes courants :
- Points-virgules manquants après les définitions de classes.
- Accolades `{}` non fermées.
- Guillemets manquants autour des valeurs de chaînes.
- Backslash en fin de ligne (la continuation de ligne n'est pas supportée).

### Erreur : Discordance de préfixe PBO

**Cause :** Le préfixe dans le PBO ne correspond pas aux chemins utilisés dans config.cpp ou les matériaux.
**Solution :** Assurez-vous que `-prefix` correspond à la structure de chemin attendue par toutes les références. Si config.cpp référence `MyMod\data\item.p3d`, le préfixe PBO doit être `MyMod` et le fichier doit être à `data\item.p3d` à l'intérieur du PBO.

### Erreur : "Signature check failed" sur le serveur

**Cause :** Le PBO du client ne correspond pas à la signature attendue par le serveur.
**Solution :**
1. Assurez-vous que le serveur et le client ont la même version du PBO.
2. Re-signez le PBO avec une nouvelle clé si nécessaire.
3. Mettez à jour le `.bikey` sur le serveur.

### Erreur : "Cannot open file" pendant Binarize

**Cause :** Le lecteur P: n'est pas monté ou le chemin du fichier est incorrect.
**Solution :** Montez le lecteur P: et vérifiez que le chemin source existe.

---

## Test : File Patching vs. chargement PBO

Le développement implique deux modes de test. Choisir le bon pour chaque situation fait gagner un temps considérable.

### File Patching (développement)

| Aspect | Détail |
|--------|--------|
| **Vitesse** | Instantané -- éditer le fichier, redémarrer le jeu |
| **Configuration** | Monter le lecteur P:, lancer avec le flag `-filePatching` |
| **Exécutable** | `DayZDiag_x64.exe` (build Diag requis) |
| **Signature** | Non applicable (pas de PBO à signer) |
| **Limitations** | Pas de configs binarisées, build Diag uniquement |
| **Idéal pour** | Développement de scripts, itération UI, prototypage rapide |

### Chargement PBO (test de version finale)

| Aspect | Détail |
|--------|--------|
| **Vitesse** | Plus lent -- doit reconstruire le PBO pour chaque changement |
| **Configuration** | Construire le PBO, placer dans `@mod/addons/` |
| **Exécutable** | `DayZDiag_x64.exe` ou retail `DayZ_x64.exe` |
| **Signature** | Supportée (requise pour le multijoueur) |
| **Limitations** | Reconstruction requise pour chaque changement |
| **Idéal pour** | Test final, test multijoueur, validation avant publication |

### Workflow recommandé

1. **Développez avec le file patching :** Écrivez des scripts, ajustez les layouts, itérez sur les textures. Redémarrez le jeu pour tester. Pas d'étape de build.
2. **Construisez des PBO périodiquement :** Testez le build binarisé pour détecter les problèmes spécifiques à la binarisation (erreurs de parsing config, problèmes de conversion de textures).
3. **Test final uniquement en PBO :** Avant la publication, testez exclusivement depuis les PBO pour vous assurer que le mod empaqueté fonctionne de façon identique à la version en file patching.
4. **Signez et distribuez les PBO :** Générez les signatures pour la compatibilité multijoueur.

---

## Bonnes pratiques

1. **Utilisez `-packonly` pour les PBO de scripts.** Les scripts ne sont jamais binarisés, donc `-packonly` est toujours correct et bien plus rapide.

2. **Définissez toujours un préfixe.** Sans préfixe, le moteur ne peut pas résoudre les chemins vers le contenu de votre mod. Chaque PBO doit avoir un `-prefix` correct.

3. **Automatisez vos builds.** Créez un script de build (batch ou Python) dès le premier jour. L'empaquetage manuel ne passe pas à l'échelle et est sujet aux erreurs.

4. **Séparez source et sortie.** Source sur P:, PBO construits dans un répertoire de sortie séparé ou `@mod/addons/`. Ne jamais empaqueter depuis le répertoire de sortie.

5. **Signez vos PBO pour tout test multijoueur.** Les PBO non signés sont rejetés par les serveurs avec la vérification de signature activée. Signez pendant le développement même si cela semble inutile -- cela évite les problèmes « ça marche chez moi » quand d'autres testent.

6. **Versionnez vos clés.** Quand vous faites des changements majeurs, générez une nouvelle paire de clés. Cela force tous les clients et serveurs à se mettre à jour ensemble.

7. **Testez les deux modes file patching et PBO.** Certains bugs n'apparaissent que dans un mode. Les configs binarisées se comportent différemment des configs texte dans les cas limites.

8. **Nettoyez régulièrement votre répertoire de sortie.** Les PBO périmés de builds précédents peuvent causer un comportement déroutant. Utilisez le flag `-clear` ou nettoyez manuellement avant de construire.

9. **Divisez les gros mods en plusieurs PBO.** Le temps économisé sur les reconstructions incrémentales se rentabilise dès le premier jour de développement.

10. **Lisez les logs de build.** Binarize et AddonBuilder produisent des fichiers de log. Quand quelque chose ne va pas, la réponse est presque toujours dans les logs. Vérifiez `%TEMP%\AddonBuilder\` et `%TEMP%\Binarize\` pour une sortie détaillée.

---

## Observé dans les mods réels

| Patron | Mod | Détail |
|---------|-----|--------|
| 20+ PBO par mod avec des divisions fines | Expansion (tous les modules) | Divisé en PBO séparés pour Scripts, Data, GUI, Vehicles, Book, Market, etc., permettant des reconstructions indépendantes et une séparation client/serveur optionnelle |
| Triple division Scripts/Data/GUI | StarDZ (Core, Missions, AI) | Chaque mod produit 2-3 PBO : `_Scripts.pbo` (packonly), `_Data.pbo` (modèles/textures binarisés), `_GUI.pbo` (layouts packonly) |
| PBO monolithique unique | Mods de retexture simples | Les petits mods avec seulement un config.cpp et quelques textures PAA empaquètent tout dans un seul PBO avec binarisation |
| Versionnement de clé par version majeure | Expansion | Génère de nouvelles paires de clés pour les mises à jour majeures, forçant tous les clients et serveurs à se mettre à jour en synchronisation |

---

## Compatibilité et impact

- **Multi-Mod :** Les collisions de préfixe PBO font que le moteur charge les fichiers d'un mod au lieu de ceux d'un autre. Chaque mod doit utiliser un préfixe unique. Vérifiez soigneusement `$PBOPREFIX$` lors du débogage des erreurs « fichier non trouvé » dans les environnements multi-mods.
- **Performance :** Le chargement PBO est rapide (lectures séquentielles de fichiers), mais les mods avec beaucoup de gros PBO augmentent le temps de démarrage du serveur. Le contenu binarisé charge plus vite que le non binarisé. Utilisez des modèles ODOL et des textures PAA pour les builds de publication.
- **Version :** Le format PBO lui-même n'a pas changé. AddonBuilder reçoit des corrections périodiques via les mises à jour de DayZ Tools, mais les flags de ligne de commande et le comportement d'empaquetage sont stables depuis DayZ 1.0.

---

## Navigation

| Précédent | Haut | Suivant |
|-----------|------|---------|
| [4.5 Workflow DayZ Tools](05-dayz-tools.md) | [Partie 4 : Formats de fichiers et DayZ Tools](01-textures.md) | [4.7 Guide Workbench](07-workbench-guide.md) |
