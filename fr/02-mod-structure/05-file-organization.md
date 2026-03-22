# Chapitre 2.5 : Bonnes pratiques d'organisation des fichiers

[Accueil](../README.md) | [<< Précédent : Mod Minimum Viable](04-minimum-viable-mod.md) | **Organisation des fichiers** | [Suivant : Architecture Serveur vs Client >>](06-server-client-split.md)

---

> **Résumé :** La façon dont vous organisez vos fichiers détermine si votre mod est maintenable à 10 fichiers ou à 1 000. Ce chapitre couvre la structure de répertoires canonique, les conventions de nommage, les mods de contenu vs script vs framework, les séparations client-serveur et les leçons tirées des mods DayZ professionnels.

---

## Table des matières

- [La structure de répertoires canonique](#la-structure-de-répertoires-canonique)
- [Conventions de nommage](#conventions-de-nommage)
- [Trois types de mods](#trois-types-de-mods)
- [Mods avec séparation client-serveur](#mods-avec-séparation-client-serveur)
- [Quoi mettre où](#quoi-mettre-où)
- [Nommage des PBO et dossiers @mod](#nommage-des-pbo-et-dossiers-mod)
- [Exemples réels de mods professionnels](#exemples-réels-de-mods-professionnels)
- [Anti-patterns](#anti-patterns)

---

## La structure de répertoires canonique

Voici la disposition standard utilisée par les mods DayZ professionnels. Tous les dossiers ne sont pas requis -- créez uniquement ce dont vous avez besoin.

```
MyMod/                                    <-- Racine du projet (développement)
  mod.cpp                                 <-- Métadonnées du lanceur
  stringtable.csv                         <-- Localisation (à la racine du mod, PAS dans Scripts/)

  Scripts/                                <-- Racine du PBO de scripts
    config.cpp                            <-- CfgPatches + CfgMods + defs de modules de script
    Inputs.xml                            <-- Raccourcis clavier personnalisés (optionnel)
    Data/
      Credits.json                        <-- Crédits d'auteur
      Version.hpp                         <-- Chaîne de version (optionnel)

    1_Core/                               <-- engineScriptModule (rare)
      MyMod/
        Constants.c

    3_Game/                               <-- gameScriptModule
      MyMod/
        MyModConfig.c                     <-- Classe de configuration
        MyModRPCs.c                       <-- Identifiants / enregistrement RPC
        Data/
          SomeDataClass.c                 <-- Structures de données pures

    4_World/                              <-- worldScriptModule
      MyMod/
        Entities/
          MyCustomItem.c                  <-- Objets personnalisés
          MyCustomVehicle.c
        Managers/
          MyModManager.c                  <-- Gestionnaires conscients du monde
        Actions/
          ActionMyCustom.c                <-- Actions joueur personnalisées

    5_Mission/                            <-- missionScriptModule
      MyMod/
        MyModRegister.c                   <-- Enregistrement du mod (hook de démarrage)
        GUI/
          MyModPanel.c                    <-- Scripts de panneau UI
          MyModHUD.c                      <-- Scripts de superposition HUD

  GUI/                                    <-- Racine du PBO GUI (séparé de Scripts)
    config.cpp                            <-- Config spécifique GUI (imageSets, styles)
    layouts/                              <-- Fichiers .layout
      mymod_panel.layout
      mymod_hud.layout
    imagesets/                            <-- Fichiers .imageset + atlas de textures
      mymod_icons.imageset
      mymod_icons.edds
    looknfeel/                            <-- Fichiers .styles
      mymod.styles

  Data/                                   <-- Racine du PBO Data (modèles, textures, objets)
    config.cpp                            <-- CfgVehicles, CfgWeapons, etc.
    Models/
      my_item.p3d                         <-- Modèles 3D
    Textures/
      my_item_co.paa                      <-- Textures de couleur
      my_item_nohq.paa                    <-- Normal maps
    Materials/
      my_item.rvmat                       <-- Définitions de matériaux

  Sounds/                                 <-- Fichiers son
    alert.ogg                             <-- Fichiers audio (toujours .ogg)
    ambient.ogg

  ServerFiles/                            <-- Fichiers à copier par les admins serveur
    types.xml                             <-- Définitions de spawn Central Economy
    cfgspawnabletypes.xml                 <-- Préréglages d'accessoires
    README.md                             <-- Guide d'installation

  Keys/                                   <-- Clés de signature
    MyMod.bikey                           <-- Clé publique pour vérification serveur
```

---

## Conventions de nommage

### Noms de mod/projet

Utilisez le PascalCase avec un préfixe clair :

```
MyFramework          <-- Framework, préfixe : MyFW_
MyMod_Missions      <-- Mod de fonctionnalité
MyMod_Weapons       <-- Mod de contenu
VPPAdminTools        <-- Certains mods sautent les underscores
DabsFramework        <-- PascalCase sans séparateur
```

### Noms de classes

Utilisez un préfixe court unique à votre mod, suivi d'un underscore et de l'objectif de la classe :

```c
// Pattern MyMod : MyMod_[SousSystème]_[Nom]
class MyLog             // Logging central
class MyRPC             // RPC central
class MyW_Config        // Config armes
class MyM_MissionBase   // Base de missions

// Pattern CF : CF_[Nom]
class CF_ModuleWorld
class CF_EventArgs

// Pattern COT : JM_COT_[Nom]
class JM_COT_Menu

// Pattern VPP : [Nom] (pas de préfixe)
class ChatCommandBase
class WebhookManager
```

**Règles :**
- Le préfixe empêche les collisions avec d'autres mods
- Gardez-le court (2-4 caractères)
- Soyez cohérent au sein de votre mod

### Noms de fichiers

Nommez chaque fichier d'après la classe principale qu'il contient :

```
MyLog.c            <-- Contient class MyLog
MyRPC.c            <-- Contient class MyRPC
MyModConfig.c        <-- Contient class MyModConfig
ActionMyCustom.c     <-- Contient class ActionMyCustom
```

Une classe par fichier est l'idéal. Plusieurs petites classes utilitaires dans un seul fichier est acceptable quand elles sont étroitement couplées.

### Fichiers de mise en page

Utilisez des minuscules avec le préfixe de votre mod :

```
my_admin_panel.layout
my_killfeed_overlay.layout
mymod_settings_dialog.layout
```

### Noms de variables

```c
// Variables membres : préfixe m_
protected int m_Count;
protected ref array<string> m_Items;
protected ref MyConfig m_Config;

// Variables statiques : préfixe s_
static int s_InstanceCount;
static ref MyLog s_Logger;

// Constantes : TOUT_EN_MAJUSCULES
const int MAX_PLAYERS = 60;
const float UPDATE_INTERVAL = 0.5;
const string MOD_NAME = "MyMod";

// Variables locales : camelCase (pas de préfixe)
int count = 0;
string playerName = identity.GetName();
float deltaTime = timeArgs.DeltaTime;

// Paramètres : camelCase (pas de préfixe)
void SetConfig(MyConfig config, bool forceReload)
```

---

## Trois types de mods

Les mods DayZ se répartissent en trois catégories. Chacune a un accent structurel différent.

### 1. Mod de contenu

Ajoute des objets, armes, véhicules, bâtiments -- principalement des assets 3D avec un scripting minimal.

```
MyWeaponPack/
  mod.cpp
  Data/
    config.cpp                <-- CfgVehicles, CfgWeapons, CfgMagazines, CfgAmmo
    Weapons/
      MyRifle/
        MyRifle.p3d
        MyRifle_co.paa
        MyRifle_nohq.paa
        MyRifle.rvmat
    Ammo/
      MyAmmo/
        MyAmmo.p3d
  Scripts/                    <-- Minimal (peut même ne pas exister)
    config.cpp
    4_World/
      MyWeaponPack/
        MyRifle.c             <-- Seulement si l'arme a besoin d'un comportement personnalisé
  ServerFiles/
    types.xml
```

**Caractéristiques :**
- Beaucoup de `Data/` (modèles, textures, matériaux)
- Beaucoup de `Data/config.cpp` (définitions CfgVehicles, CfgWeapons)
- Scripting minimal ou inexistant
- Scripts seulement quand les objets ont besoin d'un comportement personnalisé au-delà de ce que la config définit

### 2. Mod de script

Ajoute des fonctionnalités de gameplay, des outils d'administration, des systèmes -- principalement du code avec un minimum d'assets.

```
MyAdminTools/
  mod.cpp
  stringtable.csv
  Scripts/
    config.cpp
    3_Game/
      MyAdminTools/
        Config.c
        RPCHandler.c
        Permissions.c
    4_World/
      MyAdminTools/
        PlayerManager.c
        VehicleManager.c
    5_Mission/
      MyAdminTools/
        AdminMenu.c
        AdminHUD.c
  GUI/
    layouts/
      admin_menu.layout
      admin_hud.layout
    imagesets/
      admin_icons.imageset
```

**Caractéristiques :**
- Beaucoup de `Scripts/` (la plupart du code dans 3_Game, 4_World, 5_Mission)
- Mises en page GUI et imagesets pour l'UI
- Peu ou pas de `Data/` (pas de modèles 3D)
- Dépend généralement d'un framework (CF, DabsFramework ou un framework personnalisé)

### 3. Mod framework

Fournit une infrastructure partagée pour d'autres mods -- logging, RPC, configuration, systèmes UI.

```
MyFramework/
  mod.cpp
  stringtable.csv
  Scripts/
    config.cpp
    Data/
      Credits.json
    1_Core/                     <-- Les frameworks utilisent souvent 1_Core
      MyFramework/
        Constants.c
        LogLevel.c
    3_Game/
      MyFramework/
        Config/
          ConfigManager.c
          ConfigBase.c
        RPC/
          RPCManager.c
        Events/
          EventBus.c
        Logging/
          Logger.c
        Permissions/
          PermissionManager.c
        UI/
          ViewBase.c
          DialogBase.c
    4_World/
      MyFramework/
        Module/
          ModuleManager.c
          ModuleBase.c
        Player/
          PlayerData.c
    5_Mission/
      MyFramework/
        MissionHooks.c
        ModRegistration.c
  GUI/
    config.cpp
    layouts/
    imagesets/
    icons/
    looknfeel/
```

**Caractéristiques :**
- Utilise toutes les couches de script (1_Core à 5_Mission)
- Hiérarchie de sous-répertoires profonde dans chaque couche
- Définit `defines[]` pour la détection de fonctionnalités
- Les autres mods en dépendent via `requiredAddons`
- Fournit des classes de base que d'autres mods étendent

---

## Mods avec séparation client-serveur

Quand un mod a à la fois un comportement visible côté client (UI, rendu d'entités) et une logique serveur uniquement (spawn, cerveaux IA, état sécurisé), il devrait se diviser en deux packages.

### Structure de répertoires

```
MyMod/                                    <-- Racine du projet (dépôt de développement)
  MyMod_Sub/                           <-- Package client (chargé via -mod=)
    mod.cpp
    stringtable.csv
    Scripts/
      config.cpp                          <-- type = "mod"
      3_Game/MyMod/                       <-- Classes de données partagées, RPCs
      4_World/MyMod/                      <-- Rendu d'entités côté client
      5_Mission/MyMod/                    <-- UI client, HUD
    GUI/
      layouts/
    Sounds/

  MyMod_SubServer/                     <-- Package serveur (chargé via -servermod=)
    mod.cpp
    Scripts/
      config.cpp                          <-- type = "servermod"
      3_Game/MyModServer/                 <-- Classes de données côté serveur
      4_World/MyModServer/                <-- Spawn, logique IA, gestion d'état
      5_Mission/MyModServer/              <-- Hooks de démarrage/arrêt serveur
```

### Règles clés pour les mods divisés

1. **Le package client est chargé par tout le monde** (serveur et tous les clients via `-mod=`)
2. **Le package serveur est chargé uniquement par le serveur** (via `-servermod=`)
3. **Le package serveur dépend du package client** (via `requiredAddons`)
4. **Ne jamais mettre de code UI dans le package serveur** -- les clients ne le recevront pas
5. **Garder la logique sécurisée/privée dans le package serveur** -- elle n'est jamais envoyée aux clients

---

## Quoi mettre où

### Répertoire Data/

Assets physiques et définitions d'objets :

```
Data/
  config.cpp          <-- CfgVehicles, CfgWeapons, CfgMagazines, CfgAmmo
  Models/             <-- Fichiers de modèles 3D .p3d
  Textures/           <-- Fichiers de textures .paa, .edds
  Materials/          <-- Définitions de matériaux .rvmat
  Animations/         <-- Fichiers d'animation .anim (rare)
```

### Répertoire Scripts/

Tout le code Enforce Script :

```
Scripts/
  config.cpp          <-- CfgPatches, CfgMods, définitions de modules de script
  Inputs.xml          <-- Définitions de raccourcis clavier
  Data/
    Credits.json      <-- Crédits d'auteur
    Version.hpp       <-- Chaîne de version
  1_Core/             <-- Constantes et utilitaires fondamentaux
  3_Game/             <-- Configs, RPCs, classes de données
  4_World/            <-- Entités, gestionnaires, logique de gameplay
  5_Mission/          <-- UI, HUD, cycle de vie de la mission
```

### Répertoire GUI/

Ressources d'interface utilisateur :

```
GUI/
  config.cpp          <-- CfgPatches spécifique GUI (pour l'enregistrement d'imageset/style)
  layouts/            <-- Fichiers .layout (arbres de widgets)
  imagesets/          <-- XML .imageset + atlas de textures .edds
  icons/              <-- Imagesets d'icônes (peuvent être séparés des imagesets généraux)
  looknfeel/          <-- Fichiers .styles (propriétés visuelles des widgets)
  fonts/              <-- Fichiers de polices personnalisées (rare)
  sounds/             <-- Fichiers son UI (clic, survol, etc.)
```

### Répertoire Sounds/

Fichiers audio :

```
Sounds/
  alert.ogg           <-- Toujours au format .ogg
  ambient.ogg
  click.ogg
```

La configuration sonore (CfgSoundSets, CfgSoundShaders) va dans `Scripts/config.cpp`, pas dans une config Sounds séparée.

### Répertoire ServerFiles/

Fichiers que les administrateurs de serveur copient dans le dossier de mission de leur serveur :

```
ServerFiles/
  types.xml                   <-- Définitions de spawn d'objets pour Central Economy
  cfgspawnabletypes.xml       <-- Préréglages d'accessoires/cargo
  cfgeventspawns.xml          <-- Positions de spawn d'événements (rare)
  README.md                   <-- Instructions d'installation
```

---

## Nommage des PBO et dossiers @mod

### Noms de PBO

Chaque PBO reçoit un nom descriptif avec le préfixe du mod :

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo         <-- Code script
    MyMod_Data.pbo            <-- Modèles, textures, objets
    MyMod_GUI.pbo             <-- Mises en page, imagesets, styles
    MyMod_Sounds.pbo          <-- Audio (parfois regroupé avec Data)
```

Le nom du PBO n'a pas besoin de correspondre au nom de la classe CfgPatches, mais les garder alignés évite la confusion.

### Nom du dossier @mod

Le préfixe `@` est une convention Steam Workshop. Pendant le développement, vous pouvez l'omettre :

```
Développement :    MyMod/           <-- Pas de préfixe @
Workshop :         @MyMod/          <-- Avec préfixe @
```

Le `@` n'a aucune signification technique pour le moteur. C'est purement une convention organisationnelle.

### PBOs multiples par mod

Les grands mods se divisent en plusieurs PBOs pour plusieurs raisons :

1. **Cycles de mise à jour séparés** -- mettre à jour les scripts sans re-télécharger les modèles 3D
2. **Composants optionnels** -- le PBO GUI est optionnel si le mod fonctionne headless
3. **Pipeline de build** -- différents PBOs construits par différents outils

---

## Exemples réels de mods professionnels

### Exemple de mod framework

```
MyFramework/
  MyFramework/                            <-- Package client
    mod.cpp
    stringtable.csv
    GUI/
      config.cpp
      fonts/
      icons/                              <-- 5 imagesets d'icônes par poids
      imagesets/
      layouts/
        dialogs/
        options/
        prefabs/
        MyMod/loading/hints/
        MyFramework/AdminPanel/
        MyFramework/Dialogs/
        MyFramework/Modules/
        MyFramework/Options/
        MyFramework/Prefabs/
        MyFramework/Tooltip/
      looknfeel/
      sounds/
    Scripts/
      config.cpp
      Inputs.xml
      1_Core/MyMod/                      <-- Niveaux de log, constantes
      2_GameLib/MyMod/UI/                <-- Système d'attributs MVC
      3_Game/MyMod/                      <-- 15+ dossiers de sous-systèmes
        Animation/
        Branding/
        Chat/
        Collections/
        Config/
        Core/
        Events/
        Hints/
        Killfeed/
        Logging/
        Module/
        MVC/
        Notifications/
        Permissions/
        PlayerData/
        RPC/
        Settings/
        Theme/
        Timer/
        UI/
      4_World/MyMod/                     <-- Données joueur, gestionnaires du monde
      5_Mission/MyMod/                   <-- Panneau admin, enregistrement du mod
```

### Community Online Tools (COT) -- Outil d'administration

```
JM/COT/
  mod.cpp
  GUI/
    config.cpp
    layouts/
      cursors/
      uiactions/
      vehicles/
    textures/
  Objects/Debug/
    config.cpp                            <-- Définitions d'entités de debug
  Scripts/
    config.cpp
    Data/
      Credits.json
      Version.hpp
      Inputs.xml
    Common/                               <-- Partagé entre toutes les couches
    1_Core/
    3_Game/
    4_World/
    5_Mission/
  languagecore/
    config.cpp                            <-- Config de table de chaînes
```

Notez le pattern du dossier `Common/` : inclus dans chaque module de script via `files[]`, permettant des types partagés entre toutes les couches.

### Exemple de mod de contenu

```
MyMod_Weapons/
  MyMod_Weapons/
    mod.cpp
    Data/
      config.cpp                          <-- Config fusionnée : 268 définitions d'armes
      Ammo/                               <-- Organisé par source/calibre
        BC/12.7x55/
        BC/338/
        BC/50Cal/
        GCGN/3006/
        GCGN/300AAC/
      Attachments/                        <-- Lunettes, suppresseurs, grips
      Magazines/
      Weapons/                            <-- Modèles d'armes organisés par source
    Scripts/
      config.cpp                          <-- Définitions de modules de script
      3_Game/                             <-- Config d'armes, système de stats
      4_World/                            <-- Overrides de comportement d'armes
      5_Mission/                          <-- Enregistrement, UI
```

Les mods de contenu ont un répertoire `Data/` massif et un `Scripts/` relativement petit.

---

## Anti-patterns

### 1. Dump de scripts à plat

```
Scripts/
  3_Game/
    AllMyStuff.c            <-- 2000 lignes, 15 classes
    MoreStuff.c             <-- 1500 lignes, 12 classes
```

**Solution :** Un fichier par classe, organisé en sous-répertoires par sous-système.

### 2. Mauvais placement de couche

```
Scripts/
  3_Game/
    MyMod/
      PlayerManager.c       <-- Référence PlayerBase (défini dans 4_World)
      MyPanel.c             <-- Code UI (appartient à 5_Mission)
      MyItem.c              <-- Étend ItemBase (appartient à 4_World)
```

**Solution :** Suivez les règles de couche du Chapitre 2.1. Déplacez le code d'entité vers `4_World` et le code UI vers `5_Mission`.

### 3. Pas de sous-répertoire de mod dans les couches de script

```
Scripts/
  3_Game/
    Config.c                <-- Risque de collision de nom avec d'autres mods !
    RPCs.c
```

**Solution :** Toujours namespaser avec un sous-répertoire :

```
Scripts/
  3_Game/
    MyMod/
      Config.c
      RPCs.c
```

### 4. stringtable.csv à l'intérieur de Scripts/

```
Scripts/
  stringtable.csv           <-- MAUVAIS EMPLACEMENT
  config.cpp
```

**Solution :** `stringtable.csv` va à la racine du mod (à côté de `mod.cpp`) :

```
MyMod/
  mod.cpp
  stringtable.csv           <-- Correct
  Scripts/
    config.cpp
```

### 5. Assets et scripts mélangés dans un seul PBO

```
MyMod/
  config.cpp
  Scripts/3_Game/...
  Models/weapon.p3d
  Textures/weapon_co.paa
```

**Solution :** Séparer en plusieurs PBOs :

```
MyMod/
  Scripts/
    config.cpp
    3_Game/...
  Data/
    config.cpp
    Models/weapon.p3d
    Textures/weapon_co.paa
```

### 6. Sous-répertoires profondément imbriqués

```
Scripts/3_Game/MyMod/Systems/Core/Config/Managers/Settings/PlayerSettings.c
```

**Solution :** Gardez l'imbrication à 2-3 niveaux maximum. Aplatissez quand c'est possible :

```
Scripts/3_Game/MyMod/Config/PlayerSettings.c
```

### 7. Nommage incohérent

```
mymod_Config.c
MyMod_rpc.c
MYMOD_Manager.c
my_mod_panel.c
```

**Solution :** Choisissez une convention et tenez-vous-y :

```
MyModConfig.c
MyModRPC.c
MyModManager.c
MyModPanel.c
```

---

## Checklist de résumé

Avant de publier votre mod, vérifiez :

- [ ] `mod.cpp` est à la racine du mod (à côté de `Addons/` ou `Scripts/`)
- [ ] `stringtable.csv` est à la racine du mod (PAS à l'intérieur de `Scripts/`)
- [ ] `config.cpp` existe dans chaque racine de PBO
- [ ] `requiredAddons[]` liste TOUTES les dépendances
- [ ] Les chemins `files[]` des modules de script correspondent à la structure de répertoires réelle
- [ ] Chaque fichier `.c` est dans un sous-répertoire namespacé par le mod (par exemple, `3_Game/MyMod/`)
- [ ] Les noms de classes ont un préfixe unique pour éviter les collisions
- [ ] Les classes d'entité sont dans `4_World`, les classes UI dans `5_Mission`, les classes de données dans `3_Game`
- [ ] Pas de secrets ou de code debug dans les PBOs publiés
- [ ] La logique serveur uniquement est dans un package `-servermod` séparé (si applicable)

---

## Observé dans les mods réels

| Pattern | Mod | Détail |
|---------|-----|--------|
| Dossiers de sous-systèmes profonds dans `3_Game` | StarDZ Core | 15+ dossiers sous `3_Game/` (Config, RPC, Events, Logging, Permissions, etc.) |
| Dossier `Common/` partagé | COT | Inclus dans les `files[]` de chaque module de script pour fournir des types utilitaires inter-couches |
| Noms de dossiers en minuscules | DabsFramework | Utilise `scripts/`, `gui/` au lieu de `Scripts/`, `GUI/` -- fonctionne sous Windows mais risque des problèmes sous Linux |
| PBO GUI séparé | Expansion, COT | Les ressources GUI (layouts, imagesets, styles) empaquetées dans un PBO dédié avec son propre config.cpp |
| Scripts minimaux pour les mods de contenu | Packs d'armes | Le répertoire `Data/` domine ; `Scripts/` n'a qu'un mince config.cpp et des overrides de comportement optionnels |

---

## Théorie vs Pratique

| Concept | Théorie | Réalité |
|---------|---------|---------|
| Une classe par fichier | Chaque fichier `.c` contient une classe | Les petites classes utilitaires et enums sont souvent co-localisés avec leur classe parente par commodité |
| PBOs séparés pour Scripts/Data/GUI | Séparation propre par préoccupation | Les petits mods fusionnent souvent tout dans un seul PBO pour simplifier la distribution |
| Le sous-dossier de mod empêche les collisions | `3_Game/MyMod/` namespace les fichiers | Vrai, mais les noms de classes entrent toujours en collision globalement -- le sous-dossier n'empêche que les conflits au niveau fichier |
| `stringtable.csv` à la racine du mod | Le moteur le trouve automatiquement | Doit être à la racine du PBO qui est chargé ; le placer dans `Scripts/` cause son ignorance silencieuse |
| ServerFiles/ est livré avec le mod | Les admins serveur copient types.xml | Beaucoup d'auteurs de mods oublient d'inclure ServerFiles, forçant les admins à créer les entrées types.xml manuellement |

---

## Compatibilité & Impact

- **Multi-Mod :** L'organisation des fichiers en elle-même ne cause pas de conflits. Cependant, deux mods plaçant des fichiers avec le même chemin dans leurs PBOs (par exemple, les deux utilisant `3_Game/Config.c` sans sous-dossier de mod) entreront en collision au niveau du moteur, causant l'override silencieux de l'un par l'autre.
- **Performance :** La profondeur des répertoires et le nombre de fichiers n'ont aucun impact mesurable sur le temps de compilation des scripts. Le moteur scanne récursivement tous les répertoires `files[]` listés indépendamment de l'imbrication.

---

**Précédent :** [Chapitre 2.4 : Votre premier mod -- Minimum Viable](04-minimum-viable-mod.md)
**Suivant :** [Chapitre 2.6 : Architecture Serveur vs Client](06-server-client-split.md)
