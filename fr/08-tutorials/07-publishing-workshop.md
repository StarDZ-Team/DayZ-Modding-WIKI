# Chapitre 8.7 : Publier sur le Steam Workshop

[Accueil](../../README.md) | [<< Précédent : Débogage et tests](06-debugging-testing.md) | **Publier sur le Steam Workshop** | [Suivant : Créer un overlay HUD >>](08-hud-overlay.md)

---

> **Résumé :** Votre mod est compilé, testé et prêt pour le monde. Ce tutoriel vous guide à travers le processus complet de publication du début à la fin : préparer votre dossier de mod, signer les PBO pour la compatibilité multijoueur, créer un élément Steam Workshop, uploader via DayZ Tools ou en ligne de commande, et maintenir les mises à jour au fil du temps. À la fin, votre mod sera en ligne sur le Workshop et jouable par n'importe qui.

---

## Table des matières

- [Introduction](#introduction)
- [Checklist pré-publication](#checklist-pré-publication)
- [Étape 1 : Préparer votre dossier de mod](#étape-1--préparer-votre-dossier-de-mod)
- [Étape 2 : Écrire un mod.cpp complet](#étape-2--écrire-un-modcpp-complet)
- [Étape 3 : Préparer les logos et images de prévisualisation](#étape-3--préparer-les-logos-et-images-de-prévisualisation)
- [Étape 4 : Générer une paire de clés](#étape-4--générer-une-paire-de-clés)
- [Étape 5 : Signer vos PBO](#étape-5--signer-vos-pbo)
- [Étape 6 : Publier via DayZ Tools Publisher](#étape-6--publier-via-dayz-tools-publisher)
- [Publier en ligne de commande (alternative)](#publier-en-ligne-de-commande-alternative)
- [Mettre à jour votre mod](#mettre-à-jour-votre-mod)
- [Bonnes pratiques de gestion des versions](#bonnes-pratiques-de-gestion-des-versions)
- [Bonnes pratiques pour la page Workshop](#bonnes-pratiques-pour-la-page-workshop)
- [Guide pour les opérateurs de serveur](#guide-pour-les-opérateurs-de-serveur)
- [Distribution sans le Workshop](#distribution-sans-le-workshop)
- [Problèmes courants et solutions](#problèmes-courants-et-solutions)
- [Le cycle de vie complet d'un mod](#le-cycle-de-vie-complet-dun-mod)
- [Prochaines étapes](#prochaines-étapes)

---

## Introduction

Publier sur le Steam Workshop est l'étape finale du parcours de modding DayZ. Tout ce que vous avez appris dans les chapitres précédents culmine ici. Une fois votre mod sur le Workshop, n'importe quel joueur DayZ peut s'y abonner, le télécharger et jouer avec. Ce chapitre couvre le processus complet : préparer votre mod, signer les PBO, uploader et maintenir les mises à jour.

---

## Checklist pré-publication

Avant d'uploader quoi que ce soit, parcourez cette liste. Sauter des éléments ici cause les maux de tête post-publication les plus courants.

- [ ] Toutes les fonctionnalités testées sur un **serveur dédié** (pas seulement en solo)
- [ ] Multijoueur testé : un autre client peut rejoindre et utiliser les fonctionnalités du mod
- [ ] Pas d'erreurs bloquantes dans les logs de script (`DayZDiag_x64.RPT` ou `script_*.log`)
- [ ] Toutes les instructions `Print()` de debug retirées ou encapsulées dans `#ifdef DEVELOPER`
- [ ] Pas de valeurs de test codées en dur ou de code expérimental restant
- [ ] `stringtable.csv` contient toutes les chaînes visibles par l'utilisateur avec les traductions
- [ ] `credits.json` rempli avec les informations de l'auteur et des contributeurs
- [ ] Image du logo préparée (voir [Étape 3](#étape-3--préparer-les-logos-et-images-de-prévisualisation) pour les tailles)
- [ ] Toutes les textures converties au format `.paa` (pas de `.png`/`.tga` bruts dans les PBO)
- [ ] Description Workshop et instructions d'installation rédigées
- [ ] Changelog commencé (même si c'est juste "1.0.0 - Version initiale")

---

## Étape 1 : Préparer votre dossier de mod

Votre dossier de mod final doit suivre exactement la structure attendue par DayZ.

### Structure requise

```
@MyMod/
├── addons/
│   ├── MyMod_Scripts.pbo
│   ├── MyMod_Scripts.pbo.MyMod.bisign
│   ├── MyMod_Data.pbo
│   └── MyMod_Data.pbo.MyMod.bisign
├── keys/
│   └── MyMod.bikey
├── mod.cpp
└── meta.cpp  (auto-généré par le DayZ Launcher au premier chargement)
```

### Détail des dossiers

| Dossier / Fichier | But |
|---------------|---------|
| `addons/` | Contient tous les fichiers `.pbo` (contenu mod empaqueté) et leurs fichiers de signature `.bisign` |
| `keys/` | Contient la clé publique (`.bikey`) que les serveurs utilisent pour vérifier vos PBO |
| `mod.cpp` | Métadonnées du mod : nom, auteur, version, description, chemins des icônes |
| `meta.cpp` | Auto-généré par le DayZ Launcher ; contient l'ID Workshop après publication |

### Règles importantes

- Le nom du dossier **doit** commencer par `@`. C'est ainsi que DayZ identifie les répertoires de mods.
- Chaque `.pbo` dans `addons/` doit avoir un fichier `.bisign` correspondant à côté.
- Le fichier `.bikey` dans `keys/` doit correspondre à la clé privée utilisée pour créer les fichiers `.bisign`.
- N'incluez **pas** les fichiers sources (scripts `.c`, textures brutes, projets Workbench) dans le dossier d'upload. Seuls les PBO empaquetés ont leur place ici.

---

## Étape 2 : Écrire un mod.cpp complet

Le fichier `mod.cpp` indique à DayZ et au launcher tout sur votre mod. Un `mod.cpp` incomplet cause des icônes manquantes, des descriptions vides et des problèmes d'affichage.

### Exemple complet de mod.cpp

```cpp
name         = "My Awesome Mod";
picture      = "MyMod/Data/Textures/logo_co.paa";
logo         = "MyMod/Data/Textures/logo_co.paa";
logoSmall    = "MyMod/Data/Textures/logo_small_co.paa";
logoOver     = "MyMod/Data/Textures/logo_co.paa";
tooltip      = "My Awesome Mod - Adds cool features to DayZ";
overview     = "A comprehensive mod that adds new items, mechanics, and UI elements to DayZ.";
author       = "YourName";
overviewPicture = "MyMod/Data/Textures/overview_co.paa";
action       = "https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_WORKSHOP_ID";
version      = "1.0.0";
versionPath  = "MyMod/Data/version.txt";
```

### Référence des champs

| Champ | Requis | Description |
|-------|----------|-------------|
| `name` | Oui | Nom d'affichage montré dans la liste de mods du DayZ Launcher |
| `picture` | Oui | Chemin vers l'image logo principale (affichée dans le launcher). Relatif au lecteur P: ou à la racine du mod |
| `logo` | Oui | Identique à picture dans la plupart des cas ; utilisé dans certains contextes d'interface |
| `logoSmall` | Non | Version plus petite du logo pour les vues compactes |
| `logoOver` | Non | État survol du logo (souvent identique à `logo`) |
| `tooltip` | Oui | Description courte d'une ligne affichée au survol dans le launcher |
| `overview` | Oui | Description plus longue affichée dans le panneau de détails du mod |
| `author` | Oui | Votre nom ou nom d'équipe |
| `overviewPicture` | Non | Grande image affichée dans le panneau de vue d'ensemble du mod |
| `action` | Non | URL ouverte quand le joueur clique sur "Site web" (typiquement votre page Workshop ou GitHub) |
| `version` | Oui | Chaîne de version actuelle (ex: `"1.0.0"`) |
| `versionPath` | Non | Chemin vers un fichier texte contenant le numéro de version (pour les builds automatisés) |

### Erreurs courantes

- **Points-virgules manquants** à la fin de chaque ligne. Chaque ligne doit se terminer par `;`.
- **Chemins d'images incorrects.** Les chemins sont relatifs à la racine du lecteur P: lors de la compilation. Après empaquetage, le chemin doit refléter le préfixe PBO. Testez en chargeant le mod localement avant d'uploader.
- **Oublier de mettre à jour la version** avant de ré-uploader. Incrémentez toujours la chaîne de version.

---

## Étape 3 : Préparer les logos et images de prévisualisation

### Exigences d'images

| Image | Taille | Format | Utilisé pour |
|-------|------|--------|----------|
| Logo du mod (`picture` / `logo`) | 512 x 512 px | `.paa` (en jeu) | Liste de mods du DayZ Launcher |
| Petit logo (`logoSmall`) | 128 x 128 px | `.paa` (en jeu) | Vues compactes du launcher |
| Prévisualisation Steam Workshop | 512 x 512 px | `.png` ou `.jpg` | Miniature de la page Workshop |
| Image de vue d'ensemble | 1024 x 512 px | `.paa` (en jeu) | Panneau de détails du mod |

### Convertir les images en PAA

DayZ utilise des textures `.paa` en interne. Pour convertir des images PNG/TGA :

1. Ouvrir **TexView2** (inclus avec DayZ Tools)
2. Fichier > Ouvrir votre image `.png` ou `.tga`
3. Fichier > Enregistrer sous > choisir le format `.paa`
4. Enregistrer dans le répertoire `Data/Textures/` de votre mod

Addon Builder peut aussi auto-convertir les textures lors de l'empaquetage des PBO s'il est configuré pour binariser.

### Conseils

- Utilisez une icône claire et reconnaissable qui se lit bien aux petites tailles.
- Gardez le texte sur les logos au minimum -- il devient illisible à 128x128.
- L'image de prévisualisation du Steam Workshop (`.png`/`.jpg`) est séparée du logo en jeu (`.paa`). Vous l'uploadez via le Publisher.

---

## Étape 4 : Générer une paire de clés

La signature par clé est **essentielle** pour le multijoueur. Presque tous les serveurs publics activent la vérification de signature, donc sans signatures correctes les joueurs seront expulsés en rejoignant avec votre mod.

### Comment fonctionne la signature par clé

- Vous créez une **paire de clés** : un `.biprivatekey` (privée) et un `.bikey` (publique)
- Vous signez chaque `.pbo` avec la clé privée, produisant un fichier `.bisign`
- Vous distribuez le `.bikey` avec votre mod ; les opérateurs de serveurs le placent dans leur dossier `keys/`
- Quand un joueur rejoint, le serveur vérifie chaque `.pbo` contre son `.bisign` en utilisant le `.bikey`

### Générer les clés avec DayZ Tools

1. Ouvrir **DayZ Tools** depuis Steam
2. Dans la fenêtre principale, trouver et cliquer sur **DS Create Key** (parfois listé sous Tools ou Utilities)
3. Entrer un **nom de clé** -- utilisez le nom de votre mod (ex: `MyMod`)
4. Choisir où sauvegarder les fichiers
5. Deux fichiers sont créés :
   - `MyMod.bikey` -- la **clé publique** (distribuez-la)
   - `MyMod.biprivatekey` -- la **clé privée** (gardez-la secrète)

### Générer les clés en ligne de commande

Vous pouvez aussi utiliser l'outil `DSCreateKey` directement depuis un terminal :

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSCreateKey.exe" MyMod
```

Cela crée `MyMod.bikey` et `MyMod.biprivatekey` dans le répertoire courant.

### Règle de sécurité critique

> **Ne JAMAIS partager votre fichier `.biprivatekey`.** Quiconque possède votre clé privée peut signer des PBO modifiés que les serveurs accepteront comme légitimes. Stockez-la de manière sécurisée et sauvegardez-la. Si vous la perdez, vous devez générer une nouvelle paire de clés, re-signer tout, et les opérateurs de serveurs doivent mettre à jour leurs clés.

---

## Étape 5 : Signer vos PBO

Chaque fichier `.pbo` dans votre mod doit être signé avec votre clé privée. Cela produit des fichiers `.bisign` qui se trouvent à côté des PBO.

### Signer avec DayZ Tools

1. Ouvrir **DayZ Tools**
2. Trouver et cliquer sur **DS Sign File** (sous Tools ou Utilities)
3. Sélectionner votre fichier `.biprivatekey`
4. Sélectionner le fichier `.pbo` à signer
5. Un fichier `.bisign` est créé à côté du PBO (ex: `MyMod_Scripts.pbo.MyMod.bisign`)
6. Répéter pour chaque `.pbo` dans votre dossier `addons/`

### Signer en ligne de commande

Pour l'automatisation ou plusieurs PBO, utilisez la ligne de commande :

```batch
"C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe" MyMod.biprivatekey MyMod_Scripts.pbo
```

Pour signer tous les PBO d'un dossier avec un script batch :

```batch
@echo off
set DSSIGN="C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools\Bin\DsUtils\DSSignFile.exe"
set KEY="path\to\MyMod.biprivatekey"

for %%f in (addons\*.pbo) do (
    echo Signing %%f ...
    %DSSIGN% %KEY% "%%f"
)

echo All PBOs signed.
pause
```

### Après la signature : Vérifiez votre dossier

Votre dossier `addons/` devrait ressembler à ceci :

```
addons/
├── MyMod_Scripts.pbo
├── MyMod_Scripts.pbo.MyMod.bisign
├── MyMod_Data.pbo
└── MyMod_Data.pbo.MyMod.bisign
```

Chaque `.pbo` doit avoir un `.bisign` correspondant. Si un `.bisign` manque, les joueurs seront expulsés des serveurs avec vérification de signature.

### Placer la clé publique

Copiez `MyMod.bikey` dans votre dossier `@MyMod/keys/`. C'est ce que les opérateurs de serveurs copieront dans le répertoire `keys/` de leur serveur pour autoriser votre mod.

---

## Étape 6 : Publier via DayZ Tools Publisher

DayZ Tools inclut un publisher Workshop intégré -- la façon la plus facile de mettre votre mod sur Steam.

### Ouvrir le Publisher

1. Ouvrir **DayZ Tools** depuis Steam
2. Cliquer sur **Publisher** dans la fenêtre principale (peut aussi être intitulé "Workshop Tool")
3. La fenêtre du Publisher s'ouvre avec des champs pour les détails de votre mod

### Remplir les détails

| Champ | Quoi entrer |
|-------|---------------|
| **Title** | Le nom d'affichage de votre mod (ex: "My Awesome Mod") |
| **Description** | Aperçu détaillé de ce que fait votre mod. Supporte le formatage BB code de Steam (voir ci-dessous) |
| **Preview Image** | Parcourir vers votre image de prévisualisation 512 x 512 `.png` ou `.jpg` |
| **Mod Folder** | Parcourir vers votre dossier `@MyMod` complet |
| **Tags** | Sélectionner les tags pertinents (ex: Weapons, Vehicles, UI, Server, Gear, Maps) |
| **Visibility** | **Public** (tout le monde peut le trouver), **Friends Only** ou **Unlisted** (accessible uniquement via lien direct) |

### Référence rapide BB Code Steam

La description Workshop supporte le BB code :

```
[h1]Features[/h1]
[list]
[*] Feature one
[*] Feature two
[/list]

[b]Bold[/b]  [i]Italic[/i]  [code]Code[/code]
[url=https://example.com]Link text[/url]
[img]https://example.com/image.png[/img]
```

### Publier

1. Revérifier tous les champs une dernière fois
2. Cliquer sur **Publish** (ou **Upload**)
3. Attendre la fin de l'upload. Les gros mods peuvent prendre plusieurs minutes selon votre connexion.
4. Une fois terminé, vous verrez une confirmation avec votre **Workshop ID** (un long ID numérique comme `2345678901`)
5. **Sauvegardez cet Workshop ID.** Vous en avez besoin pour pousser les mises à jour plus tard.

### Après la publication : Vérifier

Ne sautez pas cette étape. Testez votre mod comme le ferait un joueur ordinaire :

1. Visitez `https://steamcommunity.com/sharedfiles/filedetails/?id=YOUR_ID` et vérifiez le titre, la description, l'image de prévisualisation
2. **Abonnez-vous** à votre propre mod sur le Workshop
3. Lancez DayZ, confirmez que le mod apparaît dans le launcher
4. Activez-le, lancez le jeu, rejoignez un serveur (ou lancez votre propre serveur de test)
5. Confirmez que toutes les fonctionnalités fonctionnent
6. Mettez à jour le champ `action` dans `mod.cpp` pour pointer vers l'URL de votre page Workshop

Si quelque chose est cassé, mettez à jour et ré-uploadez avant d'annoncer publiquement.

---

## Publier en ligne de commande (alternative)

Pour l'automatisation, le CI/CD ou les uploads en masse, SteamCMD offre une alternative en ligne de commande.

### Installer SteamCMD

Téléchargez depuis le [site développeur de Valve](https://developer.valvesoftware.com/wiki/SteamCMD) et extrayez dans un dossier comme `C:\SteamCMD\`.

### Créer un fichier VDF

SteamCMD utilise un fichier `.vdf` pour décrire quoi uploader. Créez un fichier nommé `workshop_publish.vdf` :

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "0"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "previewfile"    "C:\\Path\\To\\preview.png"
    "visibility"     "0"
    "title"          "My Awesome Mod"
    "description"    "A comprehensive mod for DayZ."
    "changenote"     "Initial release"
}
```

### Référence des champs

| Champ | Valeur |
|-------|-------|
| `appid` | Toujours `221100` pour DayZ |
| `publishedfileid` | `0` pour un nouvel élément ; utilisez l'ID Workshop pour les mises à jour |
| `contentfolder` | Chemin absolu vers votre dossier `@MyMod` |
| `previewfile` | Chemin absolu vers votre image de prévisualisation |
| `visibility` | `0` = Public, `1` = Amis uniquement, `2` = Non listé, `3` = Privé |
| `title` | Nom du mod |
| `description` | Description du mod (texte brut) |
| `changenote` | Texte affiché dans l'historique des changements sur la page Workshop |

### Exécuter SteamCMD

```batch
C:\SteamCMD\steamcmd.exe +login YourSteamUsername +workshop_build_item "C:\Path\To\workshop_publish.vdf" +quit
```

SteamCMD demandera votre mot de passe et code Steam Guard à la première utilisation. Après authentification, il uploade le mod et affiche l'ID Workshop.

### Quand utiliser la ligne de commande

- **Builds automatisés :** intégrer dans un script de build qui empaquète les PBO, les signe et uploade en une étape
- **Opérations en masse :** uploader plusieurs mods à la fois
- **Serveurs headless :** environnements sans interface graphique
- **Pipelines CI/CD :** GitHub Actions ou similaire peut appeler SteamCMD

---

## Mettre à jour votre mod

### Processus de mise à jour étape par étape

1. **Faire vos changements de code** et tester minutieusement
2. **Incrémenter la version** dans `mod.cpp` (ex: `"1.0.0"` devient `"1.0.1"`)
3. **Reconstruire tous les PBO** avec Addon Builder ou votre script de build
4. **Re-signer tous les PBO** avec la **même clé privée** utilisée à l'origine
5. **Ouvrir le DayZ Tools Publisher**
6. Entrer votre **Workshop ID** existant (ou sélectionner l'élément existant)
7. Pointer vers votre dossier `@MyMod` mis à jour
8. Écrire une **note de changement** décrivant ce qui a changé
9. Cliquer sur **Publish / Update**

### Utiliser SteamCMD pour les mises à jour

Mettez à jour le fichier VDF avec votre Workshop ID et une nouvelle note de changement :

```
"workshopitem"
{
    "appid"          "221100"
    "publishedfileid" "2345678901"
    "contentfolder"  "C:\\Path\\To\\@MyMod"
    "changenote"     "v1.0.1 - Fixed item duplication bug, added French translation"
}
```

Puis exécutez SteamCMD comme avant. Le `publishedfileid` dit à Steam de mettre à jour l'élément existant au lieu d'en créer un nouveau.

### Important : Utiliser la même clé

Signez toujours les mises à jour avec la **même clé privée** que celle utilisée pour la version originale. Si vous signez avec une clé différente, les opérateurs de serveurs doivent remplacer l'ancien `.bikey` par le nouveau -- ce qui signifie temps d'arrêt et confusion. Ne générez une nouvelle paire de clés que si votre clé privée est compromise.

---

## Bonnes pratiques de gestion des versions

### Versionnage sémantique

Utilisez le format **MAJEUR.MINEUR.CORRECTIF** :

| Composant | Quand incrémenter | Exemple |
|-----------|-------------------|---------|
| **MAJEUR** | Changements cassants : changements de format de config, fonctionnalités retirées, révisions d'API | `1.0.0` à `2.0.0` |
| **MINEUR** | Nouvelles fonctionnalités rétrocompatibles | `1.0.0` à `1.1.0` |
| **CORRECTIF** | Corrections de bugs, petits ajustements, mises à jour de traduction | `1.0.0` à `1.0.1` |

### Format du changelog

Maintenez un changelog dans votre description Workshop ou un fichier séparé. Un format propre :

```
v1.2.0 (2025-06-15)
- Added: Night vision toggle keybind
- Added: German and Spanish translations
- Fixed: Inventory crash when dropping stacked items
- Changed: Reduced default spawn rate from 5 to 3

v1.1.0 (2025-05-01)
- Added: New crafting recipes for 4 items
- Fixed: Server crash on player disconnect during trade

v1.0.0 (2025-04-01)
- Initial release
```

### Rétrocompatibilité

Quand votre mod sauvegarde des données persistantes (configs JSON, fichiers de données joueur), réfléchissez bien avant de changer le format :

- **Ajouter de nouveaux champs** est sûr. Utilisez des valeurs par défaut pour les champs manquants lors du chargement de vieux fichiers.
- **Renommer ou supprimer des champs** est un changement cassant. Incrémentez la version MAJEURE.
- **Envisagez un patron de migration :** détecter l'ancien format, convertir au nouveau format, sauvegarder.

Exemple de vérification de migration en Enforce Script :

```csharp
// Dans votre fonction de chargement de config
if (config.configVersion < 2)
{
    // Migrer de v1 à v2 : renommer "oldField" en "newField"
    config.newField = config.oldField;
    config.configVersion = 2;
    SaveConfig(config);
    SDZ_Log.Info("MyMod", "Config migrated from v1 to v2");
}
```

### Tags Git

Si vous utilisez Git pour le contrôle de version (et vous devriez), taguez chaque release :

```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

Cela crée un point de référence permanent pour pouvoir toujours revenir au code exact de chaque version publiée.

---

## Bonnes pratiques pour la page Workshop

### Structure de la description

Organisez votre description avec ces sections :

1. **Vue d'ensemble** -- ce que fait le mod, en 2-3 phrases
2. **Fonctionnalités** -- liste à puces des fonctionnalités clés
3. **Prérequis** -- listez tous les mods dépendants avec les liens Workshop
4. **Installation** -- étape par étape pour les joueurs (généralement juste "s'abonner et activer")
5. **Configuration serveur** -- instructions pour les opérateurs de serveurs (placement des clés, fichiers de config)
6. **FAQ** -- questions courantes répondues préventivement
7. **Problèmes connus** -- soyez honnête sur les limitations actuelles
8. **Support** -- lien vers votre Discord, GitHub issues ou fil de forum
9. **Changelog** -- historique récent des versions
10. **Licence** -- comment les autres peuvent (ou ne peuvent pas) utiliser votre travail

### Captures d'écran et médias

- Incluez **3-5 captures d'écran en jeu** montrant votre mod en action
- Si votre mod ajoute de l'interface, montrez les panneaux d'interface clairement
- Si votre mod ajoute des objets, montrez-les en jeu (pas seulement dans l'éditeur)
- Une courte vidéo de gameplay augmente dramatiquement les abonnements

### Dépendances

Si votre mod nécessite d'autres mods, listez-les clairement avec les liens Workshop. Utilisez la fonctionnalité "Required Items" du Steam Workshop pour que le launcher charge automatiquement les dépendances.

### Calendrier de mises à jour

Définissez les attentes. Si vous mettez à jour chaque semaine, dites-le. Si les mises à jour sont occasionnelles, dites "mises à jour selon les besoins". Les joueurs sont plus compréhensifs quand ils savent à quoi s'attendre.

---

## Guide pour les opérateurs de serveur

Incluez ces informations dans votre description Workshop pour les admins de serveurs.

### Installer un mod Workshop sur un serveur dédié

1. **Télécharger le mod** avec SteamCMD ou le client Steam :
   ```batch
   steamcmd +login anonymous +workshop_download_item 221100 WORKSHOP_ID +quit
   ```
2. **Copier** (ou créer un lien symbolique) le dossier `@ModName` dans le répertoire du serveur DayZ
3. **Copier le fichier `.bikey`** depuis `@ModName/keys/` vers le dossier `keys/` du serveur
4. **Ajouter le mod** au paramètre de lancement `-mod=`

### Syntaxe du paramètre de lancement

Les mods sont chargés via le paramètre `-mod=`, séparés par des points-virgules :

```
-mod=@CF;@VPPAdminTools;@MyMod
```

Utilisez le **chemin relatif complet** depuis la racine du serveur. Sur Linux, les chemins sont sensibles à la casse.

### Ordre de chargement

Les mods chargent dans l'ordre listé dans `-mod=`. Cela compte quand les mods dépendent les uns des autres :

- **Dépendances en premier.** Si `@MyMod` nécessite `@CF`, listez `@CF` avant `@MyMod`.
- **Règle générale :** frameworks en premier, mods de contenu en dernier.
- Si votre mod déclare `requiredAddons` dans `config.cpp`, DayZ tentera de résoudre l'ordre de chargement automatiquement, mais l'ordonnancement explicite dans `-mod=` est plus sûr.

### Gestion des clés

- Placez **un `.bikey` par mod** dans le répertoire `keys/` du serveur
- Quand un mod se met à jour avec la même clé, aucune action nécessaire -- le `.bikey` existant fonctionne toujours
- Si un auteur de mod change de clés, vous devez remplacer l'ancien `.bikey` par le nouveau
- Le chemin du dossier `keys/` est relatif à la racine du serveur (ex: `DayZServer/keys/`)

---

## Distribution sans le Workshop

### Quand ne pas utiliser le Workshop

- **Mods privés** pour votre propre communauté de serveur
- **Tests bêta** avec un petit groupe avant la version publique
- **Mods commerciaux ou sous licence** distribués par d'autres canaux
- **Itération rapide** pendant le développement (plus rapide que de ré-uploader à chaque fois)

### Créer un ZIP de release

Empaquetez votre mod pour la distribution manuelle :

```
MyMod_v1.0.0.zip
└── @MyMod/
    ├── addons/
    │   ├── MyMod_Scripts.pbo
    │   ├── MyMod_Scripts.pbo.MyMod.bisign
    │   ├── MyMod_Data.pbo
    │   └── MyMod_Data.pbo.MyMod.bisign
    ├── keys/
    │   └── MyMod.bikey
    └── mod.cpp
```

Incluez un `README.txt` avec les instructions d'installation :

```
INSTALLATION:
1. Extract the @MyMod folder into your DayZ game directory
2. (Server operators) Copy MyMod.bikey from @MyMod/keys/ to your server's keys/ folder
3. Add @MyMod to your -mod= launch parameter
```

### Releases GitHub

Si votre mod est open source, utilisez GitHub Releases pour héberger les téléchargements versionnés :

1. Taguer la release dans Git (`git tag v1.0.0`)
2. Compiler et signer les PBO
3. Créer un ZIP du dossier `@MyMod`
4. Créer une GitHub Release et y attacher le ZIP
5. Écrire les notes de release dans la description de la release

Cela vous donne un historique de versions, un compteur de téléchargements et une URL stable pour chaque release.

---

## Problèmes courants et solutions

| Problème | Cause | Correction |
|---------|-------|-----|
| "Addon rejected by server" | Serveur manquant le `.bikey`, ou le `.bisign` ne correspond pas au `.pbo` | Confirmer que le `.bikey` est dans le dossier `keys/` du serveur. Re-signer les PBO avec le bon `.biprivatekey`. |
| "Signature check failed" | PBO modifié après signature, ou signé avec la mauvaise clé | Reconstruire le PBO depuis la source propre. Re-signer avec la **même clé** qui a généré le `.bikey` du serveur. |
| Mod absent du DayZ Launcher | `mod.cpp` malformé ou mauvaise structure de dossier | Vérifier `mod.cpp` pour les erreurs de syntaxe (`;` manquants). S'assurer que le dossier commence par `@`. Redémarrer le launcher. |
| L'upload échoue dans le Publisher | Problème d'auth, de connexion ou de verrouillage de fichier | Vérifier la connexion Steam. Fermer Workbench/Addon Builder. Essayer d'exécuter DayZ Tools en tant qu'administrateur. |
| Icône Workshop incorrecte/manquante | Mauvais chemin dans `mod.cpp` ou mauvais format d'image | Vérifier que les chemins `picture`/`logo` pointent vers de vrais fichiers `.paa`. La prévisualisation Workshop (`.png`) est séparée. |
| Conflits avec d'autres mods | Redéfinition de classes vanilla au lieu de les modder | Utiliser `modded class`, appeler `super` dans les overrides, définir `requiredAddons` pour l'ordre de chargement. |
| Les joueurs crashent au chargement | Erreurs de script, PBO corrompus ou dépendances manquantes | Vérifier les logs `.RPT`. Reconstruire les PBO depuis la source propre. Vérifier que les dépendances chargent en premier. |

---

## Le cycle de vie complet d'un mod

```
IDÉE → SETUP (8.1) → STRUCTURE (8.1, 8.5) → CODE (8.2, 8.3, 8.4) → BUILD (8.1)
  → TEST → DEBUG (8.6) → PEAUFINAGE → SIGNATURE (8.7) → PUBLICATION (8.7) → MAINTENANCE (8.7)
                                    ↑                                    │
                                    └────── boucle de feedback ──────────┘
```

Après la publication, les retours des joueurs vous renvoient vers CODE, TEST et DEBUG. Ce cycle de publication-feedback-amélioration est la manière dont les grands mods sont construits.

---

## Prochaines étapes

Vous avez terminé la série complète de tutoriels de modding DayZ -- d'un workspace vierge à un mod publié, signé et maintenu sur le Steam Workshop. À partir de là :

- **Explorez les chapitres de référence** (Chapitres 1-7) pour des connaissances plus approfondies sur le système GUI, config.cpp et Enforce Script
- **Étudiez les mods open source** comme CF, Community Online Tools et Expansion pour des patrons avancés
- **Rejoignez la communauté de modding DayZ** sur Discord et les forums Bohemia Interactive
- **Voyez plus grand.** Votre premier mod était Hello World. Le prochain pourrait être une refonte complète du gameplay.

Les outils sont entre vos mains. Construisez quelque chose de grand.
