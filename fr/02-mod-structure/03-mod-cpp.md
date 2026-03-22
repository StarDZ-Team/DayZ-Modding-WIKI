# Chapitre 2.3 : mod.cpp & Workshop

[Accueil](../README.md) | [<< Précédent : Plongée dans config.cpp](02-config-cpp.md) | **mod.cpp & Workshop** | [Suivant : Mod Minimum Viable >>](04-minimum-viable-mod.md)

---

> **Résumé :** Le fichier `mod.cpp` est purement des métadonnées -- il contrôle l'apparence de votre mod dans le lanceur DayZ, la liste des mods en jeu et le Steam Workshop. Il n'a aucun effet sur le gameplay, le scripting ou l'ordre de chargement. Si `config.cpp` est le moteur, `mod.cpp` est la peinture de carrosserie.

---

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Emplacement de mod.cpp](#emplacement-de-modcpp)
- [Référence de tous les champs](#référence-de-tous-les-champs)
- [Détails des champs](#détails-des-champs)
- [Mod Client vs Mod Serveur](#mod-client-vs-mod-serveur)
- [Métadonnées Workshop](#métadonnées-workshop)
- [Champs obligatoires vs optionnels](#champs-obligatoires-vs-optionnels)
- [Exemples réels](#exemples-réels)
- [Conseils et bonnes pratiques](#conseils-et-bonnes-pratiques)

---

## Vue d'ensemble

`mod.cpp` se trouve à la racine du dossier de votre mod (à côté du répertoire `Addons/`). Le lanceur DayZ le lit pour afficher le nom, le logo, la description et l'auteur de votre mod dans l'écran de sélection des mods.

**Point clé :** `mod.cpp` n'est PAS compilé. Ce n'est pas de l'Enforce Script. C'est un simple fichier clé-valeur lu par le lanceur. Il n'y a pas de classes, pas de points-virgules après les accolades fermantes, pas de tableaux avec la syntaxe `[]` (à une exception près pour les modules de script Workshop -- voir ci-dessous).

---

## Emplacement de mod.cpp

```
@MyMod/                       <-- Dossier Workshop/lancement (préfixé avec @)
  mod.cpp                     <-- Ce fichier
  Addons/
    MyMod_Scripts.pbo
    MyMod_Data.pbo
  Keys/
    MyMod.bikey
  meta.cpp                    <-- Auto-généré par l'éditeur Workshop
```

Le préfixe `@` sur le nom du dossier est une convention pour les mods Steam Workshop mais n'est pas strictement obligatoire.

---

## Référence de tous les champs

| Champ | Type | Objectif | Obligatoire |
|-------|------|----------|-------------|
| `name` | string | Nom d'affichage du mod | Oui |
| `picture` | string | Grande image dans la description développée | Non |
| `logo` | string | Logo sous le menu du jeu | Non |
| `logoSmall` | string | Petite icône à côté du nom du mod (réduit) | Non |
| `logoOver` | string | Logo au survol de la souris | Non |
| `tooltip` | string | Info-bulle au survol de la souris | Non |
| `tooltipOwned` | string | Info-bulle quand le mod est installé | Non |
| `overview` | string | Description plus longue dans les détails du mod | Non |
| `action` | string | Lien URL (site web, Discord, GitHub) | Non |
| `actionURL` | string | Alternative à `action` (même objectif) | Non |
| `author` | string | Nom de l'auteur | Non |
| `authorID` | string | Steam64 ID de l'auteur | Non |
| `version` | string | Chaîne de version | Non |
| `type` | string | `"mod"` ou `"servermod"` | Non |
| `extra` | int | Champ réservé (toujours 0) | Non |

---

## Détails des champs

### name

Le nom d'affichage montré dans la liste des mods du lanceur DayZ et dans l'écran des mods en jeu.

```cpp
name = "My Framework";
```

Vous pouvez utiliser des références de table de chaînes pour la localisation :

```cpp
name = "$STR_DF_NAME";    // Résolu via stringtable.csv
```

### picture

Chemin vers une image plus grande affichée quand la description du mod est développée. Supporte les formats `.paa`, `.edds` et `.tga`.

```cpp
picture = "MyMod/GUI/images/logo_large.edds";
```

Le chemin est relatif à la racine du mod. Si vide ou omis, aucune image n'est affichée.

### logo

Le logo principal affiché sous le menu du jeu quand le mod est chargé.

```cpp
logo = "MyMod/GUI/images/logo.edds";
```

### logoSmall

Petite icône affichée à côté du nom du mod quand la description est réduite (non développée).

```cpp
logoSmall = "MyMod/GUI/images/logo_small.edds";
```

### logoOver

Le logo qui apparaît quand l'utilisateur survole le logo du mod avec la souris. Souvent identique à `logo` mais peut être une variante en surbrillance ou lumineuse.

```cpp
logoOver = "MyMod/GUI/images/logo_hover.edds";
```

### tooltip / tooltipOwned

Court texte affiché au survol du mod dans le lanceur. `tooltipOwned` est affiché quand le mod est installé (téléchargé depuis le Workshop).

```cpp
tooltip = "MyMod Core - Admin Panel & Framework";
tooltipOwned = "My Framework - Central Admin Panel & Shared Library";
```

### overview

Une description plus longue affichée dans le panneau de détails du mod. C'est votre texte « à propos ».

```cpp
overview = "My Framework provides a centralized admin panel and shared library for all framework mods. Manage configurations, permissions, and mod integration from a single in-game interface.";
```

### action / actionURL

Une URL cliquable associée au mod (typiquement un site web, une invitation Discord ou un dépôt GitHub). Les deux champs servent le même objectif -- utilisez celui que vous préférez.

```cpp
action = "https://github.com/mymod/repo";
// OU
actionURL = "https://discord.gg/mymod";
```

### author / authorID

Le nom de l'auteur et son Steam64 ID.

```cpp
author = "Documentation Team";
authorID = "76561198000000000";
```

`authorID` est utilisé par le Workshop pour lier au profil Steam de l'auteur.

### version

Une chaîne de version. Peut être n'importe quel format -- le moteur ne l'analyse pas et ne la valide pas.

```cpp
version = "1.0.0";
```

Certains mods pointent vers un fichier de version dans config.cpp à la place :

```cpp
versionPath = "MyMod/Scripts/Data/Version.hpp";   // Ceci va dans config.cpp, PAS dans mod.cpp
```

### type

Déclare si c'est un mod classique ou un mod serveur uniquement. Quand omis, la valeur par défaut est `"mod"`.

```cpp
type = "mod";           // Chargé via -mod= (client + serveur)
type = "servermod";     // Chargé via -servermod= (serveur uniquement, non envoyé aux clients)
```

### extra

Champ réservé. Toujours réglé à `0` ou omis entièrement.

```cpp
extra = 0;
```

---

## Mod Client vs Mod Serveur

DayZ supporte deux mécanismes de chargement de mods :

### Mod Client (`-mod=`)

- Téléchargé par les clients depuis le Steam Workshop
- Les scripts s'exécutent sur le client ET le serveur
- Peut inclure UI, HUD, modèles, textures, sons
- Nécessite la signature de clé (`.bikey`) pour rejoindre le serveur

```
// Paramètre de lancement :
-mod=@MyMod

// mod.cpp :
type = "mod";
```

### Mod Serveur (`-servermod=`)

- S'exécute UNIQUEMENT sur le serveur dédié
- Les clients ne le téléchargent jamais
- Ne peut pas inclure d'UI côté client ni de code client `5_Mission`
- Aucune signature de clé requise

```
// Paramètre de lancement :
-servermod=@MyModServer

// mod.cpp :
type = "servermod";
```

### Pattern de mod divisé

Beaucoup de mods sont livrés en DEUX packages -- un mod client et un mod serveur :

```
@MyMod_Missions/           <-- Mod client (-mod=)
  mod.cpp                   type = "mod"
  Addons/
    MyMod_Missions.pbo     Scripts : UI, rendu d'entités, réception RPC

@MyMod_MissionsServer/     <-- Mod serveur (-servermod=)
  mod.cpp                   type = "servermod"
  Addons/
    MyMod_MissionsServer.pbo   Scripts : spawn, logique, gestion d'état
```

Cela garde la logique côté serveur privée (jamais envoyée aux clients) et réduit la taille de téléchargement côté client.

---

## Métadonnées Workshop

### meta.cpp (Auto-généré)

Quand vous publiez sur le Steam Workshop, les outils DayZ auto-génèrent un fichier `meta.cpp` :

```cpp
protocol = 2;
publishedid = 2900000000;    // ID de l'objet Steam Workshop
timestamp = 1711000000;       // Horodatage Unix de la dernière mise à jour
```

Ne modifiez pas `meta.cpp` manuellement. Il est géré par les outils de publication.

### Interaction avec le Workshop

Le lanceur DayZ lit à la fois `mod.cpp` et `meta.cpp` :

- `mod.cpp` fournit les métadonnées visuelles (nom, logo, description)
- `meta.cpp` lie les fichiers locaux à l'objet Steam Workshop
- La page Steam Workshop a son propre titre, description et images (gérés via l'interface web de Steam)

Les champs de `mod.cpp` sont ce que les joueurs voient dans la liste des mods **en jeu**. La page Workshop est ce qu'ils voient sur **Steam**. Gardez-les cohérents.

### Recommandations d'images Workshop

| Image | Objectif | Taille recommandée |
|-------|----------|-------------------|
| `picture` | Description du mod développée | 512x512 ou similaire |
| `logo` | Logo dans le menu | 128x128 à 256x256 |
| `logoSmall` | Icône de liste réduite | 64x64 à 128x128 |

Utilisez le format `.edds` pour une meilleure compatibilité. `.paa` et `.tga` fonctionnent aussi. PNG et JPG ne fonctionnent PAS dans les champs d'image de mod.cpp.

---

## Champs obligatoires vs optionnels

### Minimum absolu

Un `mod.cpp` fonctionnel n'a besoin que de :

```cpp
name = "My Mod";
```

C'est tout. Une seule ligne. Le mod se chargera et fonctionnera. Tout le reste est cosmétique.

### Minimum recommandé

Pour un mod publié sur le Workshop, incluez au moins :

```cpp
name = "My Mod Name";
author = "YourName";
version = "1.0";
overview = "What this mod does in one sentence.";
```

### Configuration professionnelle complète

```cpp
name = "My Mod Name";
picture = "MyMod/GUI/images/logo_large.edds";
logo = "MyMod/GUI/images/logo.edds";
logoSmall = "MyMod/GUI/images/logo_small.edds";
logoOver = "MyMod/GUI/images/logo_hover.edds";
tooltip = "Short description";
overview = "Full description of your mod's features.";
action = "https://discord.gg/mymod";
author = "YourName";
authorID = "76561198000000000";
version = "1.2.3";
type = "mod";
```

---

## Exemples réels

### Mod Framework (Mod Client)

```cpp
name = "My Framework";
picture = "";
actionURL = "";
tooltipOwned = "My Framework - Central Admin Panel & Shared Library";
overview = "My Framework provides a centralized admin panel and shared library for all framework mods. Manage configurations, permissions, and mod integration from a single in-game interface.";
author = "Documentation Team";
version = "1.0.0";
```

### Mod Serveur Framework (Minimal)

```cpp
name = "My Framework Server";
author = "Documentation Team";
version = "1.0.0";
extra = 0;
type = "mod";
```

### Community Framework

```cpp
name = "Community Framework";
picture = "JM/CF/GUI/textures/cf_icon.edds";
logo = "JM/CF/GUI/textures/cf_icon.edds";
logoSmall = "JM/CF/GUI/textures/cf_icon.edds";
logoOver = "JM/CF/GUI/textures/cf_icon.edds";
tooltip = "Community Framework";
overview = "This is a Community Framework for DayZ SA. One notable feature is it aims to resolve the issue of conflicting RPC type ID's and mods.";
action = "https://github.com/Arkensor/DayZ-CommunityFramework";
author = "CF Mod Team";
authorID = "76561198103677868";
version = "1.5.8";
```

### VPP Admin Tools

```cpp
picture = "VPPAdminTools/data/vpp_logo_m.paa";
logoSmall = "VPPAdminTools/data/vpp_logo_ss.paa";
logo = "VPPAdminTools/data/vpp_logo_s.paa";
logoOver = "VPPAdminTools/data/vpp_logo_s.paa";
tooltip = "Tools helping in administrative DayZ server tasks";
overview = "V++ Admin Tools built for the DayZ community servers!";
action = "https://discord.dayzvpp.com";
```

Note : VPP omet `name` et `author` -- ça fonctionne quand même, mais le nom du mod par défaut devient le nom du dossier dans le lanceur.

### DabsFramework (Avec localisation)

```cpp
name = "$STR_DF_NAME";
picture = "DabsFramework/gui/images/dabs_framework_logo.paa";
logo = "DabsFramework/gui/images/dabs_framework_logo.paa";
logoSmall = "DabsFramework/gui/images/dabs_framework_logo.paa";
logoOver = "DabsFramework/gui/images/dabs_framework_logo.paa";
tooltip = "$STR_DF_TOOLTIP";
overview = "$STR_DF_DESCRIPTION";
action = "https://dab.dev";
author = "$STR_DF_AUTHOR";
authorID = "76561198247958888";
version = "1.0";
```

DabsFramework utilise des références de table de chaînes `$STR_` pour tous les champs texte, permettant le support multilingue pour la liste du mod elle-même.

### Mod IA (Mod Client avec modules de script dans mod.cpp)

```cpp
name = "My AI Mod";
picture = "";
actionURL = "";
tooltipOwned = "My AI Mod - Intelligent Bot Framework for DayZ";
overview = "Advanced AI bot framework with human-like perception, combat tactics, and developer API";
author = "YourName";
version = "1.0.0";
type = "mod";
dependencies[] = {"Game", "World", "Mission"};
class Defs
{
    class gameScriptModule
    {
        value = "";
        files[] = {"MyMod_AI/Scripts/3_Game"};
    };
    class worldScriptModule
    {
        value = "";
        files[] = {"MyMod_AI/Scripts/4_World"};
    };
    class missionScriptModule
    {
        value = "";
        files[] = {"MyMod_AI/Scripts/5_Mission"};
    };
};
```

Note : Ce mod place les définitions de modules de script dans `mod.cpp` plutôt que dans `config.cpp`. Les deux emplacements fonctionnent -- le moteur lit les deux fichiers. Cependant, la convention standard est de mettre `CfgMods` et les définitions de modules de script dans `config.cpp`. Les placer dans `mod.cpp` est une approche alternative utilisée par certains mods.

---

## Conseils et bonnes pratiques

### 1. Gardez mod.cpp simple

`mod.cpp` est uniquement des métadonnées. N'essayez pas d'y mettre de la logique de jeu, des définitions de classes ou quoi que ce soit de complexe. Si vous avez besoin de modules de script, mettez-les dans `config.cpp`.

### 2. Utilisez .edds pour les images

`.edds` est le format de texture standard DayZ pour les éléments d'UI. Utilisez DayZ Tools (TexView2) pour convertir de PNG/TGA vers .edds.

### 3. Correspondez avec votre page Workshop

Gardez les champs `name`, `overview` et `author` cohérents avec votre page Steam Workshop. Les joueurs voient les deux.

### 4. Versionnez de manière cohérente

Choisissez un schéma de versionnage (par exemple, `1.0.0` en versionnage sémantique) et mettez-le à jour à chaque publication. Certains mods utilisent un fichier `Version.hpp` référencé dans `config.cpp` pour une gestion centralisée des versions.

### 5. Testez sans images d'abord

Pendant le développement, laissez les chemins d'images vides. Ajoutez les logos en dernier, après que tout fonctionne. Les images manquantes n'empêchent pas le chargement du mod.

### 6. Les mods serveur ont besoin de moins

Les mods serveur uniquement nécessitent un mod.cpp minimal puisque les joueurs ne les voient jamais dans un lanceur :

```cpp
name = "My Server Mod";
author = "YourName";
version = "1.0.0";
type = "servermod";
```

---

## Bonnes pratiques

- Incluez toujours au moins `name` et `author` -- même pour les mods serveur, cela aide à les identifier dans les logs et les outils d'administration.
- Utilisez le format `.edds` pour tous les champs d'image (`picture`, `logo`, `logoSmall`, `logoOver`). PNG et JPG ne sont pas supportés.
- Gardez `mod.cpp` uniquement pour les métadonnées. Mettez `CfgMods`, les modules de script et `defines[]` dans `config.cpp` à la place.
- Utilisez le versionnage sémantique (`1.2.3`) dans le champ `version` et mettez-le à jour à chaque publication Workshop.
- Testez votre mod sans images d'abord ; ajoutez les logos comme étape de finition après que la fonctionnalité est confirmée.

---

## Observé dans les mods réels

| Pattern | Mod | Détail |
|---------|-----|--------|
| Champ `name` localisé | DabsFramework | Utilise la référence stringtable `$STR_DF_NAME` pour un listing de mod multilingue |
| Modules de script dans mod.cpp | Certains mods IA | Place `class Defs` avec les chemins de modules de script directement dans mod.cpp au lieu de config.cpp |
| Champ `name` manquant | VPP Admin Tools | Omet entièrement `name` ; le lanceur se rabat sur le nom du dossier comme texte d'affichage |
| Tous les champs d'image identiques | Community Framework | Définit `logo`, `logoSmall` et `logoOver` avec le même fichier `.edds` |
| Chemins d'images vides | Beaucoup de mods en début de développement | Laissent `picture=""` pendant le développement ; ajoutent la marque avant la publication Workshop |

---

## Théorie vs Pratique

| Concept | Théorie | Réalité |
|---------|---------|---------|
| `mod.cpp` est obligatoire | Chaque dossier de mod en a besoin | Un mod se charge bien sans, mais le lanceur n'affiche ni nom ni métadonnées |
| Le champ `type` contrôle le chargement | `"mod"` vs `"servermod"` | Le paramètre de lancement (`-mod=` vs `-servermod=`) est ce qui contrôle réellement le chargement ; le champ `type` n'est que des métadonnées |
| Les chemins d'images supportent les formats courants | Tous les formats de texture fonctionnent | Seuls `.edds`, `.paa` et `.tga` fonctionnent ; `.png` et `.jpg` sont silencieusement ignorés |
| `authorID` lie vers Steam | Le Steam64 ID crée un lien cliquable | Fonctionne uniquement sur la page Workshop ; la liste des mods en jeu ne l'affiche pas comme lien |
| `version` est validée | Le moteur vérifie le format de version | Le moteur le traite comme une chaîne brute ; `"banana"` est techniquement valide |

---

## Compatibilité & Impact

- **Multi-Mod :** `mod.cpp` n'a aucun effet sur l'ordre de chargement ou les dépendances. Deux mods avec des valeurs de champs identiques ne seront pas en conflit -- seuls les noms de classes `CfgPatches` dans `config.cpp` peuvent entrer en collision.
- **Performance :** `mod.cpp` est lu une seule fois au démarrage. Les fichiers images référencés ici sont chargés en mémoire pour l'UI du lanceur mais n'ont aucun impact sur les performances en jeu.

---

**Précédent :** [Chapitre 2.2 : Plongée dans config.cpp](02-config-cpp.md)
**Suivant :** [Chapitre 2.4 : Votre premier mod -- Minimum Viable](04-minimum-viable-mod.md)
