# Chapitre 4.8 : Modélisation de bâtiments -- Portes et échelles

[Accueil](../README.md) | [<< Précédent : Guide Workbench](07-workbench-guide.md) | **Modélisation de bâtiments**

---

## Introduction

Les bâtiments dans DayZ sont bien plus que du décor statique. Les joueurs interagissent constamment avec eux -- ouvrant des portes, grimpant aux échelles, se mettant à couvert derrière les murs. Créer un bâtiment personnalisé qui supporte ces interactions nécessite une configuration soigneuse du modèle : les portes ont besoin d'axes de rotation et de sélections nommées à travers plusieurs LODs, les échelles ont besoin de chemins d'escalade précisément placés définis entièrement par des sommets dans le LOD Memory.

Ce chapitre couvre le flux de travail complet pour ajouter des portes interactives et des échelles grimpables aux modèles de bâtiments personnalisés, basé sur la documentation officielle de Bohemia Interactive.

### Prérequis

- Un **Work-drive** fonctionnel avec la structure de dossiers de votre mod personnalisé.
- **Object Builder** (du package DayZ Tools) avec **Buldozer** (prévisualisation de modèle) configuré.
- La capacité de binariser et empaqueter des fichiers de mod personnalisés en PBO.
- Familiarité avec le système de LOD et les sélections nommées (couvert dans le [Chapitre 4.2 : Modèles 3D](02-models.md)).

---

## Table des matières

- [Vue d'ensemble](#introduction)
- [Configuration des portes](#configuration-des-portes)
  - [Configuration du modèle](#configuration-du-modèle-pour-les-portes)
  - [model.cfg -- Squelettes et animations](#modelcfg----squelettes-et-animations)
  - [Configuration de jeu (config.cpp)](#configuration-de-jeu-configcpp)
  - [Portes doubles](#portes-doubles)
  - [Portes coulissantes](#portes-coulissantes)
  - [Problèmes de sphère englobante](#problèmes-de-sphère-englobante)
- [Configuration des échelles](#configuration-des-échelles)
  - [Types d'échelles supportés](#types-déchelles-supportés)
  - [Sélections nommées du LOD Memory](#sélections-nommées-du-lod-memory)
  - [Exigences du View Geometry](#exigences-du-view-geometry)
  - [Dimensions des échelles](#dimensions-des-échelles)
  - [Espace de collision](#espace-de-collision)
  - [Exigences de config pour les échelles](#exigences-de-config-pour-les-échelles)
- [Résumé des exigences du modèle](#résumé-des-exigences-du-modèle)
- [Bonnes pratiques](#bonnes-pratiques)
- [Erreurs courantes](#erreurs-courantes)
- [Références](#références)

---

## Configuration des portes

Les portes interactives nécessitent trois choses qui convergent : le modèle P3D avec des sélections correctement nommées et des points mémoire, un `model.cfg` qui définit le squelette d'animation et les paramètres de rotation, et un `config.cpp` de jeu qui lie la porte aux sons, zones de dommages et logique de jeu.

### Configuration du modèle pour les portes

Une porte dans le modèle P3D doit inclure les éléments suivants :

1. **Sélections nommées à travers tous les LODs pertinents.** La géométrie qui représente la porte doit être assignée à une sélection nommée (ex. `door1`) dans chacun de ces LODs :
   - **LOD Resolution** -- le maillage visuel que le joueur voit.
   - **LOD Geometry** -- la forme de collision physique. Doit aussi contenir une propriété nommée `class` avec la valeur `house`.
   - **LOD View Geometry** -- utilisé pour les vérifications de visibilité et le ray-casting d'action. Le nom de la sélection ici correspond au paramètre `component` dans la config de jeu.
   - **LOD Fire Geometry** -- utilisé pour la détection de tir balistique.

2. **Sommets du LOD Memory** qui définissent :
   - **Axe de rotation** -- Deux sommets formant l'axe de rotation, assignés à une sélection nommée comme `door1_axis`. Cet axe définit la ligne de charnière autour de laquelle la porte pivote.
   - **Position du son** -- Un sommet assigné à une sélection nommée comme `door1_action`, marquant l'origine des sons de la porte.
   - **Position du widget d'action** -- Où le widget d'interaction est affiché au joueur.

#### Dimensions recommandées des portes

Presque toutes les portes dans DayZ vanilla font **120 x 220 cm** (largeur x hauteur). Utiliser ces dimensions standard garantit que les animations semblent correctes et que les personnages passent naturellement à travers les ouvertures. Modélisez vos portes **fermées par défaut** et animez-les vers la position ouverte -- Bohemia prévoit de supporter l'ouverture des portes dans les deux sens à l'avenir.

### model.cfg -- Squelettes et animations

Toute porte animée nécessite un fichier `model.cfg`. Cette config définit la structure osseuse (squelette) et les paramètres d'animation. Placez `model.cfg` près de votre fichier de modèle, ou plus haut dans la structure de dossiers -- l'emplacement exact est flexible tant que le binariseur peut le trouver.

Le `model.cfg` a deux sections :

#### CfgSkeletons

Définit les os animés. Chaque porte obtient une entrée d'os. Les os sont listés en paires : le nom de l'os suivi de son parent (chaîne vide `""` pour les os de niveau racine).

```cpp
class CfgSkeletons
{
    class Default
    {
        isDiscrete = 1;
        skeletonInherit = "";
        skeletonBones[] = {};
    };
    class Skeleton_2door: Default
    {
        skeletonInherit = "Default";
        skeletonBones[] =
        {
            "door1", "",
            "door2", ""
        };
    };
};
```

#### CfgModels

Définit les animations pour chaque os. Le nom de la classe sous `CfgModels` **doit correspondre au nom de fichier de votre modèle** (sans extension) pour que le lien fonctionne.

```cpp
class CfgModels
{
    class Default
    {
        sectionsInherit = "";
        sections[] = {};
        skeletonName = "";
    };
    class yourmodelname: Default
    {
        skeletonName = "Skeleton_2door";
        class Animations
        {
            class Door1
            {
                type = "rotation";
                selection = "door1";
                source = "door1";
                axis = "door1_axis";
                memory = 1;
                minValue = 0;
                maxValue = 1;
                angle0 = 0;
                angle1 = 1.4;
            };
            class Door2
            {
                type = "rotation";
                selection = "door2";
                source = "door2";
                axis = "door2_axis";
                memory = 1;
                minValue = 0;
                maxValue = 1;
                angle0 = 0;
                angle1 = -1.4;
            };
        };
    };
};
```

**Paramètres clés expliqués :**

| Paramètre | Description |
|-----------|-------------|
| `type` | Type d'animation. Utilisez `"rotation"` pour les portes battantes, `"translation"` pour les portes coulissantes. |
| `selection` | La sélection nommée dans le modèle qui doit être animée. |
| `source` | Se lie à la classe `Doors` de la config de jeu. Doit correspondre au nom de la classe dans `config.cpp`. |
| `axis` | Sélection nommée dans le LOD Memory définissant l'axe de rotation (deux sommets). |
| `memory` | Mis à `1` pour indiquer que l'axe est défini dans le LOD Memory. |
| `minValue` / `maxValue` | Plage de phase d'animation. Typiquement `0` à `1`. |
| `angle0` / `angle1` | Angles de rotation en **radians**. `angle1` définit la distance d'ouverture de la porte. Utilisez des valeurs négatives pour inverser la direction. Une valeur de `1.4` radians fait approximativement 80 degrés. |

#### Vérification dans Buldozer

Après avoir écrit le `model.cfg`, ouvrez votre modèle dans Object Builder avec Buldozer en cours d'exécution. Utilisez les touches `[` et `]` pour parcourir les sources d'animation disponibles, et `;` / `'` (ou molette de souris haut/bas) pour avancer ou reculer l'animation. Cela vous permet de vérifier que la porte pivote correctement sur son axe.

### Configuration de jeu (config.cpp)

La config de jeu connecte le modèle animé aux systèmes de jeu -- sons, dommages et logique d'état des portes. Le nom de la classe de config **doit** suivre le patron `land_modelname` pour se lier correctement avec le modèle.

```cpp
class CfgPatches
{
    class yourcustombuilding
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = {"DZ_Data"};
        author = "yourname";
        name = "addonname";
        url = "";
    };
};

class CfgVehicles
{
    class HouseNoDestruct;
    class land_modelname: HouseNoDestruct
    {
        model = "\path\to\your\model\file.p3d";
        class Doors
        {
            class Door1
            {
                displayName = "door 1";
                component = "Door1";
                soundPos = "door1_action";
                animPeriod = 1;
                initPhase = 0;
                initOpened = 0.5;
                soundOpen = "sound open";
                soundClose = "sound close";
                soundLocked = "sound locked";
                soundOpenABit = "sound openabit";
            };
            class Door2
            {
                displayName = "door 2";
                component = "Door2";
                soundPos = "door2_action";
                animPeriod = 1;
                initPhase = 0;
                initOpened = 0.5;
                soundOpen = "sound open";
                soundClose = "sound close";
                soundLocked = "sound locked";
                soundOpenABit = "sound openabit";
            };
        };
        class DamageSystem
        {
            class GlobalHealth
            {
                class Health
                {
                    hitpoints = 1000;
                };
            };
            class GlobalArmor
            {
                class Projectile
                {
                    class Health { damage = 0; };
                    class Blood { damage = 0; };
                    class Shock { damage = 0; };
                };
                class Melee
                {
                    class Health { damage = 0; };
                    class Blood { damage = 0; };
                    class Shock { damage = 0; };
                };
            };
            class DamageZones
            {
                class Door1
                {
                    class Health
                    {
                        hitpoints = 1000;
                        transferToGlobalCoef = 0;
                    };
                    componentNames[] = {"door1"};
                    fatalInjuryCoef = -1;
                    class ArmorType
                    {
                        class Projectile
                        {
                            class Health { damage = 2; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                        class Melee
                        {
                            class Health { damage = 2.5; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                    };
                };
                class Door2
                {
                    class Health
                    {
                        hitpoints = 1000;
                        transferToGlobalCoef = 0;
                    };
                    componentNames[] = {"door2"};
                    fatalInjuryCoef = -1;
                    class ArmorType
                    {
                        class Projectile
                        {
                            class Health { damage = 2; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                        class Melee
                        {
                            class Health { damage = 2.5; };
                            class Blood { damage = 0; };
                            class Shock { damage = 0; };
                        };
                    };
                };
            };
        };
    };
};
```

**Paramètres de config de porte expliqués :**

| Paramètre | Description |
|-----------|-------------|
| `component` | Sélection nommée dans le **LOD View Geometry** utilisée pour cette porte. |
| `soundPos` | Sélection nommée dans le **LOD Memory** où les sons de porte sont joués. |
| `animPeriod` | Vitesse de l'animation de la porte (en secondes). |
| `initPhase` | Phase initiale de l'animation (`0` = fermée, `1` = complètement ouverte). Testez dans Buldozer pour vérifier quelle valeur correspond à quel état. |
| `initOpened` | Probabilité que la porte apparaisse ouverte dans le monde. `0.5` signifie 50% de chance. |
| `soundOpen` | Classe de son de `CfgActionSounds` jouée quand la porte s'ouvre. Voir `DZ\sounds\hpp\config.cpp` pour les sets de sons disponibles. |
| `soundClose` | Classe de son jouée quand la porte se ferme. |
| `soundLocked` | Classe de son jouée quand un joueur essaie d'ouvrir une porte verrouillée. |
| `soundOpenABit` | Classe de son jouée quand un joueur force l'ouverture d'une porte verrouillée. |

**Notes importantes sur la config :**

- Tous les bâtiments dans DayZ héritent de `HouseNoDestruct`.
- Chaque nom de classe sous `class Doors` doit correspondre au paramètre `source` défini dans `model.cfg`.
- La section `DamageSystem` doit inclure une sous-classe `DamageZones` pour chaque porte. Le tableau `componentNames[]` référence la sélection nommée du LOD Fire Geometry du modèle.
- Ajouter la propriété nommée `class=house` et une classe de config de jeu nécessite que votre terrain soit re-binarisé (les chemins de modèles dans les fichiers `.wrp` sont remplacés par des références de classes de config de jeu).

### Portes doubles

Les portes doubles (deux battants qui s'ouvrent ensemble depuis une seule interaction) sont courantes dans DayZ. Elles nécessitent une configuration spéciale :

**Dans le modèle :**
- Configurez chaque battant comme une porte individuelle avec sa propre sélection nommée (ex. `door3_1` et `door3_2`).
- Dans le **LOD Memory**, le point d'action doit être **partagé** entre les deux battants -- utilisez une sélection nommée et un sommet pour la position d'action.
- La sélection nommée sans suffixe (ex. `door3` sans suffixe de battant) doit couvrir **les deux** poignées de porte.
- **View Geometry** et **Fire Geometry** nécessitent une sélection nommée supplémentaire qui couvre les deux battants ensemble.

**Dans model.cfg :**
- Définissez chaque battant comme une classe d'animation séparée, mais définissez le **même paramètre `source`** pour les deux battants (ex. `"doors34"` pour les deux).
- Définissez `angle1` à une valeur **positive** pour un battant et **négative** pour l'autre, pour qu'ils s'ouvrent dans des directions opposées.

**Dans config.cpp :**
- Définissez seulement **une** classe sous `class Doors`, avec son nom correspondant au paramètre `source` partagé.
- De même, définissez seulement **une** entrée dans `DamageZones` pour la paire de portes doubles.

### Portes coulissantes

Pour les portes qui glissent sur un rail plutôt que de battre (comme les portes de grange ou les panneaux coulissants), changez le `type` de l'animation dans `model.cfg` de `"rotation"` à `"translation"`. Les sommets de l'axe dans le LOD Memory définissent alors la direction de déplacement au lieu de la ligne de pivot.

### Problèmes de sphère englobante

Par défaut, la sphère englobante d'un modèle est dimensionnée pour contenir l'objet entier. Quand les portes sont modélisées en position fermée, la position ouverte peut s'étendre **en dehors** de cette sphère englobante. Cela cause des problèmes :

- **Les actions cessent de fonctionner** -- le ray-casting pour les interactions de porte échoue depuis certains angles.
- **La balistique ignore la porte** -- les balles traversent la géométrie qui se trouve en dehors de la sphère englobante.

**Solution :** Créez une sélection nommée dans le LOD Memory qui couvre la zone plus grande qu'occupe le bâtiment quand les portes sont complètement ouvertes. Puis ajoutez un paramètre `bounding` à votre classe de config de jeu :

```cpp
class land_modelname: HouseNoDestruct
{
    bounding = "selection_name";
    // ... reste de la config
};
```

Cela remplace le calcul automatique de la sphère englobante par une qui englobe toutes les positions de porte.

---

## Configuration des échelles

Contrairement aux portes, les échelles dans DayZ ne nécessitent **pas de config d'animation** et **pas d'entrées spéciales dans la config de jeu** au-delà de la classe de base du bâtiment. Toute la configuration des échelles se fait par le placement de sommets dans le LOD Memory et une sélection View Geometry. Cela rend les échelles plus simples à configurer que les portes, mais le placement des sommets doit être précis.

### Types d'échelles supportés

DayZ supporte deux types d'échelles :

1. **Entrée frontale en bas avec sortie latérale en haut** -- Le joueur approche par l'avant en bas et sort sur le côté en haut (contre un mur).
2. **Entrée frontale en bas avec sortie frontale en haut** -- Le joueur approche par l'avant en bas et sort vers l'avant en haut (sur un toit ou une plateforme).

Les deux types supportent aussi des **points d'entrée et de sortie latéraux au milieu**, permettant aux joueurs de monter et descendre de l'échelle à des étages intermédiaires. Les échelles peuvent aussi être placées **en angle** plutôt que strictement verticales.

### Sélections nommées du LOD Memory

L'échelle est définie entièrement par des sommets nommés dans le LOD Memory. Chaque nom de sélection commence par `ladderN_` où **N** est l'ID de l'échelle, commençant à `1`. Un bâtiment peut avoir plusieurs échelles (`ladder1_`, `ladder2_`, `ladder3_`, etc.).

Voici le jeu complet de sélections nommées pour une échelle :

| Sélection nommée | Description |
|-----------------|-------------|
| `ladderN_bottom_front` | Définit la marche d'entrée en bas -- où le joueur commence l'escalade. |
| `ladderN_middle_left` | Définit un point d'entrée/sortie au milieu (côté gauche). Peut contenir plusieurs sommets si l'échelle traverse plusieurs étages. |
| `ladderN_middle_right` | Définit un point d'entrée/sortie au milieu (côté droit). Peut contenir plusieurs sommets pour les échelles multi-étages. |
| `ladderN_top_front` | Définit la marche de sortie supérieure -- où le joueur finit l'escalade (type sortie frontale). |
| `ladderN_top_left` | Définit la direction de sortie supérieure pour les échelles murales (côté gauche). Doit être au moins **5 marches d'échelle plus haut** que le sol (approximativement la hauteur d'un joueur debout sur une échelle). |
| `ladderN_top_right` | Définit la direction de sortie supérieure pour les échelles murales (côté droit). Même exigence de hauteur que `top_left`. |
| `ladderN` | Définit où le widget d'action « Monter à l'échelle » apparaît au joueur. |
| `ladderN_dir` | Définit la direction depuis laquelle l'échelle peut être escaladée (direction d'approche). |
| `ladderN_con` | Le point de mesure pour l'action d'entrée. **Doit être placé au niveau du sol.** |
| `ladderN_con_dir` | Définit la direction d'un cône de 180 degrés (originant de `ladderN_con`) dans lequel l'action pour entrer sur l'échelle est disponible. |

Chacun de ces éléments est un sommet (ou un ensemble de sommets pour les points du milieu) que vous placez manuellement dans le LOD Memory d'Object Builder.

### Exigences du View Geometry

En plus de la configuration du LOD Memory, vous devez créer un composant **View Geometry** avec une sélection nommée appelée `ladderN`. Cette sélection doit couvrir le **volume entier** de l'échelle -- la hauteur et la largeur complètes de la zone grimpable. Sans cette sélection View Geometry, l'échelle ne fonctionnera pas correctement.

### Dimensions des échelles

Les animations d'escalade sont conçues pour des **dimensions fixes**. Les barreaux et l'espacement de votre échelle doivent correspondre aux proportions des échelles vanilla pour que les animations s'alignent correctement. Référez-vous au dépôt officiel DayZ Samples pour les mesures exactes -- les pièces d'échelle de référence sont les mêmes que celles utilisées sur la plupart des bâtiments vanilla.

### Espace de collision

Les personnages **entrent en collision avec la géométrie pendant l'escalade d'une échelle**. Cela signifie que vous devez vous assurer qu'il y a suffisamment d'espace libre autour de l'échelle pour le personnage grimpant dans :

- **LOD Geometry** -- collision physique.
- **LOD Roadway** -- interaction de surface.

Si l'espace est trop étroit, le personnage traversera les murs ou restera bloqué pendant l'animation d'escalade.

### Exigences de config pour les échelles

Contrairement à la série Arma, DayZ **ne nécessite pas** de tableau `ladders[]` dans la classe de config de jeu. Cependant, deux choses sont toujours nécessaires :

1. Votre modèle doit avoir une **représentation de config** -- un `config.cpp` avec une classe `CfgVehicles` (la même classe de base utilisée pour les portes ; voir la section config de porte ci-dessus).
2. Le **LOD Geometry** doit contenir la propriété nommée `class` avec la valeur `house`.

Au-delà de ces deux exigences, l'échelle est entièrement définie par les sommets du LOD Memory et la sélection View Geometry. Aucune entrée d'animation `model.cfg` n'est nécessaire.

---

## Résumé des exigences du modèle

Les bâtiments avec portes et échelles doivent inclure plusieurs LODs, chacun servant un objectif distinct. Le tableau ci-dessous résume ce que chaque LOD doit contenir :

| LOD | Objectif | Exigences porte | Exigences échelle |
|-----|----------|----------------|-------------------|
| **LOD Resolution** | Maillage visuel affiché au joueur. | Sélection nommée pour la géométrie de la porte (ex. `door1`). | Pas d'exigences spécifiques. |
| **LOD Geometry** | Détection de collision physique. | Sélection nommée pour la géométrie de la porte. Propriété nommée `class = "house"`. | Propriété nommée `class = "house"`. Dégagement suffisant autour de l'échelle pour les personnages grimpants. |
| **LOD Fire Geometry** | Détection de tir balistique (balles, projectiles). | Sélection nommée correspondant à `componentNames[]` dans la config de zone de dommages. | Pas d'exigences spécifiques. |
| **LOD View Geometry** | Vérifications de visibilité, ray-casting d'action. | Sélection nommée correspondant au paramètre `component` dans la config de porte. | Sélection nommée `ladderN` couvrant le volume complet de l'échelle. |
| **LOD Memory** | Définitions d'axes, points d'action, positions de sons. | Sommets d'axe (`door1_axis`), position du son (`door1_action`), position du widget d'action. | Jeu complet de sommets d'échelle (`ladderN_bottom_front`, `ladderN_top_left`, `ladderN_dir`, `ladderN_con`, etc.). |
| **LOD Roadway** | Interaction de surface pour les personnages. | Pas typiquement requis. | Dégagement suffisant autour de l'échelle pour les personnages grimpants. |

### Cohérence des sélections nommées

Une exigence critique est que les **sélections nommées doivent être cohérentes à travers tous les LODs** qui les référencent. Si une sélection est appelée `door1` dans le LOD Resolution, elle doit aussi être `door1` dans les LODs Geometry, Fire Geometry et View Geometry. Des noms incohérents entre les LODs feront échouer silencieusement la porte ou l'échelle.

---

## Bonnes pratiques

1. **Modélisez les portes fermées par défaut.** Animez de fermé à ouvert. Bohemia prévoit de supporter l'ouverture des portes dans les deux sens, donc partir de fermé est pérenne.

2. **Utilisez les dimensions standard des portes.** Restez à 120 x 220 cm pour les ouvertures de porte sauf si vous avez une raison de conception spécifique de ne pas le faire. Cela correspond aux bâtiments vanilla et assure que les animations des personnages semblent correctes.

3. **Testez les animations dans Buldozer avant l'empaquetage.** Utilisez `[` / `]` pour parcourir les sources et `;` / `'` ou la molette de souris pour balayer l'animation. Attraper les erreurs d'axe ou d'angle ici économise un temps significatif.

4. **Surchargez les sphères englobantes pour les grands bâtiments.** Si votre bâtiment a des portes qui s'ouvrent significativement vers l'extérieur, créez une sélection dans le LOD Memory couvrant l'étendue animée complète et liez-la avec le paramètre de config `bounding`.

5. **Placez les sommets d'échelle précisément.** Les animations d'escalade sont fixées à des dimensions spécifiques. Des sommets trop éloignés ou mal alignés feront que le personnage flotte, traverse ou reste bloqué.

6. **Assurez le dégagement autour des échelles.** Laissez suffisamment d'espace dans les LODs Geometry et Roadway pour le modèle du personnage pendant l'escalade.

7. **Gardez un `model.cfg` par modèle ou dossier.** Le `model.cfg` n'a pas besoin d'être à côté du fichier `.p3d`, mais les garder proches facilite l'organisation. Il peut aussi être placé plus haut dans la structure de dossiers pour couvrir plusieurs modèles.

8. **Utilisez le dépôt DayZ Samples.** Bohemia fournit des exemples fonctionnels pour les portes (`Test_Building`) et les échelles (`Test_Ladders`) à `https://github.com/BohemiaInteractive/DayZ-Samples`. Étudiez-les avant de construire les vôtres.

9. **Re-binarisez le terrain après ajout des configs de bâtiments.** Ajouter `class=house` et une classe de config de jeu signifie que les chemins de modèles dans les fichiers `.wrp` sont remplacés par des références de classes. Votre terrain doit être re-binarisé pour que cela prenne effet.

10. **Mettez à jour le navmesh après le placement des bâtiments.** Un terrain reconstruit sans navmesh mis à jour peut faire que l'IA traverse les portes au lieu de les utiliser correctement.

---

## Erreurs courantes

### Portes

| Erreur | Symptôme | Correction |
|--------|----------|------------|
| Le nom de classe `CfgModels` ne correspond pas au nom de fichier du modèle. | L'animation de la porte ne joue pas. | Renommez la classe pour correspondre exactement au nom du fichier `.p3d` (sans extension). |
| Sélection nommée manquante dans un ou plusieurs LODs. | La porte est visible mais pas interactive, ou les balles passent à travers. | Assurez-vous que la sélection existe dans les LODs Resolution, Geometry, View Geometry et Fire Geometry. |
| Sommets d'axe manquants ou un seul sommet défini. | La porte pivote depuis le mauvais point ou ne tourne pas du tout. | Placez exactement deux sommets dans le LOD Memory pour la sélection d'axe (ex. `door1_axis`). |
| `source` dans `model.cfg` ne correspond pas au nom de classe dans `config.cpp` Doors. | La porte n'est pas liée à la logique de jeu -- pas de sons, pas de changements d'état. | Assurez-vous que le paramètre `source` et le nom de la classe Doors sont identiques. |
| Oubli de la propriété nommée `class = "house"` dans le LOD Geometry. | Le bâtiment n'est pas reconnu comme une structure interactive. | Ajoutez la propriété nommée dans le LOD Geometry d'Object Builder. |
| Sphère englobante trop petite. | Les actions de porte ou la balistique échouent depuis certains angles. | Ajoutez une sélection `bounding` dans le LOD Memory et référencez-la dans la config. |
| Confusion entre `angle1` négatif et positif pour les portes doubles. | Les deux battants s'ouvrent dans la même direction et se traversent. | Un battant a besoin d'un `angle1` positif, l'autre négatif. |

### Échelles

| Erreur | Symptôme | Correction |
|--------|----------|------------|
| `ladderN_con` pas placé au niveau du sol. | L'action « Monter à l'échelle » n'apparaît pas ou apparaît à la mauvaise hauteur. | Déplacez le sommet au niveau du sol/plancher. |
| Sélection View Geometry `ladderN` manquante. | L'échelle ne peut pas être interagie. | Créez un composant View Geometry avec une sélection nommée couvrant le volume complet de l'échelle. |
| `ladderN_top_left` / `ladderN_top_right` trop bas. | Le personnage traverse le mur ou le sol à la sortie en haut. | Ceux-ci doivent être au moins 5 marches d'échelle plus haut que le niveau du sol. |
| Dégagement insuffisant dans le LOD Geometry. | Le personnage reste bloqué ou traverse les murs pendant l'escalade. | Élargissez l'espace autour de l'échelle dans les LODs Geometry et Roadway. |
| La numérotation des échelles commence à 0. | L'échelle ne fonctionne pas. | La numérotation commence à `1` (`ladder1_`, pas `ladder0_`). |
| Spécifier `ladders[]` dans la config de jeu. | Effort gaspillé (inoffensif mais inutile). | DayZ n'utilise pas le tableau `ladders[]`. Supprimez-le et fiez-vous au placement des sommets du LOD Memory. |

---

## Références

- [Bohemia Interactive -- Portes sur les bâtiments](https://community.bistudio.com/wiki/DayZ:Doors_on_buildings) (documentation officielle BI)
- [Bohemia Interactive -- Échelles sur les bâtiments](https://community.bistudio.com/wiki/DayZ:Ladders_on_buildings) (documentation officielle BI)
- [DayZ Samples -- Test_Building](https://github.com/BohemiaInteractive/DayZ-Samples/tree/master/Test_Building) (exemple fonctionnel de porte)
- [DayZ Samples -- Test_Ladders](https://github.com/BohemiaInteractive/DayZ-Samples/tree/master/Test_Ladders) (exemple fonctionnel d'échelle)
- [Chapitre 4.2 : Modèles 3D](02-models.md) -- Système de LOD, sélections nommées, fondamentaux de `model.cfg`

---

## Navigation

| Précédent | Haut | Suivant |
|-----------|------|---------|
| [4.7 Guide Workbench](07-workbench-guide.md) | [Partie 4 : Formats de fichiers et outils DayZ](01-textures.md) | -- |
