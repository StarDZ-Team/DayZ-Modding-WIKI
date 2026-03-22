# Chapitre 5.4 : Format ImageSet

[Accueil](../README.md) | [<< Précédent : Credits.json](03-credits-json.md) | **Format ImageSet** | [Suivant : Fichiers de configuration serveur >>](05-server-configs.md)

---

> **Résumé :** Les ImageSets définissent des régions de sprites nommées dans un atlas de textures. C'est le mécanisme principal de DayZ pour référencer des icônes, des graphiques d'interface et des feuilles de sprites depuis les fichiers de layout et les scripts. Au lieu de charger des centaines de fichiers image individuels, vous empaquetez toutes les icônes dans une seule texture et décrivez la position et la taille de chaque icône dans un fichier de définition d'imageset.

---

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnement des ImageSets](#fonctionnement-des-imagesets)
- [Format natif des ImageSets DayZ](#format-natif-des-imagesets-dayz)
- [Format XML des ImageSets](#format-xml-des-imagesets)
- [Enregistrement des ImageSets dans config.cpp](#enregistrement-des-imagesets-dans-configcpp)
- [Référencer les images dans les layouts](#référencer-les-images-dans-les-layouts)
- [Référencer les images dans les scripts](#référencer-les-images-dans-les-scripts)
- [Drapeaux d'image](#drapeaux-dimage)
- [Textures multi-résolution](#textures-multi-résolution)
- [Créer des jeux d'icônes personnalisés](#créer-des-jeux-dicônes-personnalisés)
- [Patron d'intégration Font Awesome](#patron-dintégration-font-awesome)
- [Exemples réels](#exemples-réels)
- [Erreurs courantes](#erreurs-courantes)

---

## Vue d'ensemble

Un atlas de textures est une seule grande image (typiquement au format `.edds`) contenant de nombreuses petites icônes arrangées en grille ou en disposition libre. Un fichier imageset fait correspondre des noms lisibles à des régions rectangulaires dans cet atlas.

Par exemple, une texture 1024x1024 pourrait contenir 64 icônes de 64x64 pixels chacune. Le fichier imageset dit « l'icône nommée `arrow_down` est à la position (128, 64) et mesure 64x64 pixels ». Vos fichiers de layout et scripts référencent `arrow_down` par son nom, et le moteur extrait le sous-rectangle correct de l'atlas au moment du rendu.

Cette approche est efficace : un seul chargement de texture GPU sert toutes les icônes, réduisant les appels de dessin et la surcharge mémoire.

---

## Fonctionnement des ImageSets

Le flux de données :

1. **Atlas de textures** (fichier `.edds`) --- une seule image contenant toutes les icônes
2. **Définition ImageSet** (fichier `.imageset`) --- fait correspondre les noms aux régions dans l'atlas
3. **Enregistrement config.cpp** --- indique au moteur de charger l'imageset au démarrage
4. **Référence layout/script** --- utilise la syntaxe `set:name image:iconName` pour afficher une icône spécifique

Une fois enregistré, n'importe quel widget dans n'importe quel fichier de layout peut référencer n'importe quelle image du set par son nom.

---

## Format natif des ImageSets DayZ

Le format natif utilise la syntaxe basée sur les classes du moteur Enfusion (similaire à config.cpp). C'est le format utilisé par le jeu vanilla et la plupart des mods établis.

### Structure

```
ImageSetClass {
 Name "my_icons"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyMod/GUI/imagesets/my_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_name {
   Name "icon_name"
   Pos 0 0
   Size 64 64
   Flags 0
  }
 }
}
```

### Champs de niveau supérieur

| Champ | Description |
|-------|-------------|
| `Name` | Le nom du set. Utilisé dans la partie `set:` des références d'images. Doit être unique parmi tous les mods chargés. |
| `RefSize` | Dimensions de référence de la texture (largeur hauteur). Utilisées pour le mappage des coordonnées. |
| `Textures` | Contient une ou plusieurs entrées `ImageSetTextureClass` pour différents niveaux de résolution mip. |

### Champs d'entrée de texture

| Champ | Description |
|-------|-------------|
| `mpix` | Niveau minimum de pixels (niveau mip). `0` = résolution la plus basse, `1` = résolution standard. |
| `path` | Chemin vers le fichier de texture `.edds`, relatif à la racine du mod. Peut utiliser le format GUID Enfusion (`{GUID}path`) ou des chemins relatifs simples. |

### Champs d'entrée d'image

Chaque image est un `ImageSetDefClass` dans le bloc `Images` :

| Champ | Description |
|-------|-------------|
| Nom de classe | Doit correspondre au champ `Name` (utilisé pour les recherches du moteur) |
| `Name` | L'identifiant de l'image. Utilisé dans la partie `image:` des références. |
| `Pos` | Position du coin supérieur gauche dans l'atlas (x y), en pixels |
| `Size` | Dimensions (largeur hauteur), en pixels |
| `Flags` | Drapeaux de comportement de tuile (voir [Drapeaux d'image](#drapeaux-dimage)) |

### Exemple complet (DayZ vanilla)

```
ImageSetClass {
 Name "dayz_gui"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "{534691EE0479871C}Gui/imagesets/dayz_gui.edds"
  }
  ImageSetTextureClass {
   mpix 1
   path "{C139E49FD0ECAF9E}Gui/imagesets/dayz_gui@2x.edds"
  }
 }
 Images {
  ImageSetDefClass Gradient {
   Name "Gradient"
   Pos 0 317
   Size 75 5
   Flags ISVerticalTile
  }
  ImageSetDefClass Expand {
   Name "Expand"
   Pos 121 257
   Size 20 20
   Flags 0
  }
 }
}
```

---

## Format XML des ImageSets

Un format alternatif basé sur XML existe et est utilisé par certains mods. Il est plus simple mais offre moins de fonctionnalités (pas de support multi-résolution).

### Structure

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="mh_icons" file="MyMod/GUI/imagesets/mh_icons.edds">
  <image name="icon_store" pos="0 0" size="64 64" />
  <image name="icon_cart" pos="64 0" size="64 64" />
  <image name="icon_wallet" pos="128 0" size="64 64" />
</imageset>
```

### Attributs XML

**Élément `<imageset>` :**

| Attribut | Description |
|----------|-------------|
| `name` | Le nom du set (équivalent au `Name` natif) |
| `file` | Chemin vers le fichier de texture (équivalent au `path` natif) |

**Élément `<image>` :**

| Attribut | Description |
|----------|-------------|
| `name` | Identifiant de l'image |
| `pos` | Position du coin supérieur gauche sous forme `"x y"` |
| `size` | Dimensions sous forme `"largeur hauteur"` |

### Quand utiliser quel format

| Fonctionnalité | Format natif | Format XML |
|----------------|-------------|-----------|
| Multi-résolution (niveaux mip) | Oui | Non |
| Drapeaux de tuile | Oui | Non |
| Chemins GUID Enfusion | Oui | Oui |
| Simplicité | Moindre | Plus élevée |
| Utilisé par DayZ vanilla | Oui | Non |
| Utilisé par Expansion, MyMod, VPP | Oui | Occasionnellement |

**Recommandation :** Utilisez le format natif pour les mods de production. Utilisez le format XML pour le prototypage rapide ou les jeux d'icônes simples qui n'ont pas besoin de tuiles ou de support multi-résolution.

---

## Enregistrement des ImageSets dans config.cpp

Les fichiers ImageSet doivent être enregistrés dans le `config.cpp` de votre mod sous le bloc `CfgMods` > `class defs` > `class imageSets`. Sans cet enregistrement, le moteur ne charge jamais l'imageset et vos références d'images échouent silencieusement.

### Syntaxe

```cpp
class CfgMods
{
    class MyMod
    {
        // ... autres champs ...
        class defs
        {
            class imageSets
            {
                files[] =
                {
                    "MyMod/GUI/imagesets/my_icons.imageset",
                    "MyMod/GUI/imagesets/my_other_icons.imageset"
                };
            };
        };
    };
};
```

### Exemple réel : MyMod Core

MyMod Core enregistre sept imagesets incluant les jeux d'icônes Font Awesome :

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "MyFramework/GUI/imagesets/prefabs.imageset",
            "MyFramework/GUI/imagesets/CUI.imageset",
            "MyFramework/GUI/icons/thin.imageset",
            "MyFramework/GUI/icons/light.imageset",
            "MyFramework/GUI/icons/regular.imageset",
            "MyFramework/GUI/icons/solid.imageset",
            "MyFramework/GUI/icons/brands.imageset"
        };
    };
};
```

### Exemple réel : VPP Admin Tools

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "VPPAdminTools/GUI/Textures/dayz_gui_vpp.imageset"
        };
    };
};
```

### Exemple réel : DayZ Editor

```cpp
class defs
{
    class imageSets
    {
        files[] =
        {
            "DayZEditor/gui/imagesets/dayz_editor_gui.imageset"
        };
    };
};
```

---

## Référencer les images dans les layouts

Dans les fichiers `.layout`, utilisez la propriété `image0` avec la syntaxe `set:name image:imageName` :

```
ImageWidgetClass MyIcon {
 size 32 32
 hexactsize 1
 vexactsize 1
 image0 "set:dayz_gui image:icon_refresh"
}
```

### Décomposition de la syntaxe

```
set:SETNAME image:IMAGENAME
```

- `SETNAME` --- le champ `Name` de la définition de l'imageset (ex. `dayz_gui`, `solid`, `brands`)
- `IMAGENAME` --- le champ `Name` d'une entrée `ImageSetDefClass` spécifique (ex. `icon_refresh`, `arrow_down`)

### Plusieurs états d'image

Certains widgets supportent plusieurs états d'image (normal, survol, pressé) :

```
ImageWidgetClass icon {
 image0 "set:solid image:circle"
}

ButtonWidgetClass btn {
 image0 "set:dayz_gui image:icon_expand"
}
```

### Exemples de mods réels

```
image0 "set:regular image:arrow_down_short_wide"     -- MyMod : icône Font Awesome regular
image0 "set:dayz_gui image:icon_minus"                -- MyMod : icône DayZ vanilla
image0 "set:dayz_gui image:icon_collapse"             -- MyMod : icône DayZ vanilla
image0 "set:dayz_gui image:circle"                    -- MyMod : forme DayZ vanilla
image0 "set:dayz_editor_gui image:eye_open"           -- DayZ Editor : icône personnalisée
```

---

## Référencer les images dans les scripts

Dans Enforce Script, utilisez `ImageWidget.LoadImageFile()` ou définissez les propriétés d'image sur les widgets :

### LoadImageFile

```c
ImageWidget icon = ImageWidget.Cast(layoutRoot.FindAnyWidget("MyIcon"));
icon.LoadImageFile(0, "set:solid image:circle");
```

Le paramètre `0` est l'index d'image (correspondant à `image0` dans les layouts).

### Plusieurs états via l'index

```c
ImageWidget collapseIcon;
collapseIcon.LoadImageFile(0, "set:regular image:square_plus");    // État normal
collapseIcon.LoadImageFile(1, "set:solid image:square_minus");     // État basculé
```

Basculez entre les états avec `SetImage(index)` :

```c
collapseIcon.SetImage(isExpanded ? 1 : 0);
```

### Utilisation de variables de chaîne

```c
// Depuis DayZ Editor
string icon = "set:dayz_editor_gui image:search";
searchBarIcon.LoadImageFile(0, icon);

// Plus tard, changer dynamiquement
searchBarIcon.LoadImageFile(0, "set:dayz_gui image:icon_x");
```

---

## Drapeaux d'image

Le champ `Flags` dans les entrées d'imageset au format natif contrôle le comportement de tuile quand l'image est étirée au-delà de sa taille naturelle.

| Drapeau | Valeur | Description |
|---------|--------|-------------|
| `0` | 0 | Pas de tuile. L'image s'étire pour remplir le widget. |
| `ISHorizontalTile` | 1 | Tuile horizontalement quand le widget est plus large que l'image. |
| `ISVerticalTile` | 2 | Tuile verticalement quand le widget est plus haut que l'image. |
| Les deux | 3 | Tuile dans les deux directions (`ISHorizontalTile` + `ISVerticalTile`). |

### Utilisation

```
ImageSetDefClass Gradient {
 Name "Gradient"
 Pos 0 317
 Size 75 5
 Flags ISVerticalTile
}
```

Cette image `Gradient` fait 75x5 pixels. Quand elle est utilisée dans un widget plus haut que 5 pixels, elle se répète verticalement pour remplir la hauteur, créant une bande de dégradé répétitive.

La plupart des icônes utilisent `Flags 0` (pas de tuile). Les drapeaux de tuile sont principalement pour les éléments d'interface comme les bordures, les séparateurs et les motifs répétitifs.

---

## Textures multi-résolution

Le format natif supporte plusieurs textures de résolution pour le même imageset. Cela permet au moteur d'utiliser des illustrations de meilleure résolution sur les écrans haute densité de pixels.

```
Textures {
 ImageSetTextureClass {
  mpix 0
  path "Gui/imagesets/dayz_gui.edds"
 }
 ImageSetTextureClass {
  mpix 1
  path "Gui/imagesets/dayz_gui@2x.edds"
 }
}
```

- `mpix 0` --- basse résolution (utilisée sur les paramètres de qualité bas ou les éléments d'interface distants)
- `mpix 1` --- résolution standard/haute (par défaut)

La convention de nommage `@2x` est empruntée au système Retina d'Apple mais n'est pas imposée --- vous pouvez nommer le fichier comme vous voulez.

### En pratique

La plupart des mods n'incluent que `mpix 1` (une seule résolution). Le support multi-résolution est principalement utilisé par le jeu vanilla :

```
Textures {
 ImageSetTextureClass {
  mpix 1
  path "MyFramework/GUI/icons/solid.edds"
 }
}
```

---

## Créer des jeux d'icônes personnalisés

### Flux de travail étape par étape

**1. Créer l'atlas de textures**

Utilisez un éditeur d'images (Photoshop, GIMP, etc.) pour arranger vos icônes sur un seul canevas :
- Choisissez une taille en puissance de deux (256x256, 512x512, 1024x1024, etc.)
- Arrangez les icônes en grille pour faciliter le calcul des coordonnées
- Laissez un peu d'espace entre les icônes pour empêcher le saignement de texture
- Sauvegardez en `.tga` ou `.png`

**2. Convertir en EDDS**

DayZ utilise le format `.edds` (Enfusion DDS) pour les textures. Utilisez le DayZ Workbench ou les outils de Mikero pour convertir :
- Importez votre `.tga` dans DayZ Workbench
- Ou utilisez `Pal2PacE.exe` pour convertir `.paa` en `.edds`
- La sortie doit être un fichier `.edds`

**3. Écrire la définition ImageSet**

Faites correspondre chaque icône à une région nommée. Si vos icônes sont sur une grille de 64 pixels :

```
ImageSetClass {
 Name "mymod_icons"
 RefSize 512 512
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "MyMod/GUI/imagesets/mymod_icons.edds"
  }
 }
 Images {
  ImageSetDefClass settings {
   Name "settings"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass player {
   Name "player"
   Pos 64 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass map_marker {
   Name "map_marker"
   Pos 128 0
   Size 64 64
   Flags 0
  }
 }
}
```

**4. Enregistrer dans config.cpp**

Ajoutez le chemin de l'imageset au config.cpp de votre mod :

```cpp
class imageSets
{
    files[] =
    {
        "MyMod/GUI/imagesets/mymod_icons.imageset"
    };
};
```

**5. Utiliser dans les layouts et scripts**

```
ImageWidgetClass SettingsIcon {
 image0 "set:mymod_icons image:settings"
 size 32 32
 hexactsize 1
 vexactsize 1
}
```

---

## Patron d'intégration Font Awesome

MyMod Core (hérité de DabsFramework) démontre un patron puissant : convertir les polices d'icônes Font Awesome en imagesets DayZ. Cela donne aux mods l'accès à des milliers d'icônes de qualité professionnelle sans créer d'illustrations personnalisées.

### Fonctionnement

1. Les icônes Font Awesome sont rendues dans un atlas de textures à une taille de grille fixe (64x64 par icône)
2. Chaque style d'icône obtient son propre imageset : `solid`, `regular`, `light`, `thin`, `brands`
3. Les noms d'icônes dans l'imageset correspondent aux noms d'icônes Font Awesome (ex. `circle`, `arrow_down`, `discord`)
4. Les imagesets sont enregistrés dans config.cpp et disponibles pour tout layout ou script

### Jeux d'icônes MyMod Core / DabsFramework

```
MyFramework/GUI/icons/
  solid.imageset       -- Icônes remplies (atlas 3648x3712, 64x64 par icône)
  regular.imageset     -- Icônes contournées
  light.imageset       -- Icônes contournées légères
  thin.imageset        -- Icônes contournées ultra-fines
  brands.imageset      -- Logos de marques (Discord, GitHub, etc.)
```

### Utilisation dans les layouts

```
image0 "set:solid image:circle"
image0 "set:solid image:gear"
image0 "set:regular image:arrow_down_short_wide"
image0 "set:brands image:discord"
image0 "set:brands image:500px"
```

### Utilisation dans les scripts

```c
// DayZ Editor utilisant le set solid
CollapseIcon.LoadImageFile(1, "set:solid image:square_minus");
CollapseIcon.LoadImageFile(0, "set:regular image:square_plus");
```

### Pourquoi ce patron fonctionne bien

- **Bibliothèque d'icônes massive** : des milliers d'icônes disponibles sans aucune création d'illustration
- **Style cohérent** : toutes les icônes partagent le même poids visuel et le même style
- **Plusieurs épaisseurs** : choisissez solid, regular, light ou thin pour différents contextes visuels
- **Icônes de marques** : logos prêts à l'emploi pour Discord, Steam, GitHub, etc.
- **Noms standards** : les noms d'icônes suivent les conventions Font Awesome, facilitant la découverte

---

## Exemples réels

### VPP Admin Tools

VPP empaquète toutes les icônes d'outils admin dans un seul atlas 1920x1080 avec un positionnement libre (pas une grille stricte) :

```
ImageSetClass {
 Name "dayz_gui_vpp"
 RefSize 1920 1080
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{534691EE0479871E}VPPAdminTools/GUI/Textures/dayz_gui_vpp.edds"
  }
 }
 Images {
  ImageSetDefClass vpp_icon_cloud {
   Name "vpp_icon_cloud"
   Pos 1206 108
   Size 62 62
   Flags 0
  }
  ImageSetDefClass vpp_icon_players {
   Name "vpp_icon_players"
   Pos 391 112
   Size 62 62
   Flags 0
  }
 }
}
```

Référencé dans les layouts comme :
```
image0 "set:dayz_gui_vpp image:vpp_icon_cloud"
```

### MyMod Core Prefabs

Primitives d'interface (coins arrondis, dégradés alpha) empaquetées dans un petit atlas 256x256 :

```
ImageSetClass {
 Name "prefabs"
 RefSize 256 256
 Textures {
  ImageSetTextureClass {
   mpix 1
   path "{82F14D6B9D1AA1CE}MyFramework/GUI/imagesets/prefabs.edds"
  }
 }
 Images {
  ImageSetDefClass Round_Outline_TopLeft {
   Name "Round_Outline_TopLeft"
   Pos 24 21
   Size 8 8
   Flags 0
  }
  ImageSetDefClass "Alpha 10" {
   Name "Alpha 10"
   Pos 0 15
   Size 1 1
   Flags 0
  }
 }
}
```

Notable : les noms d'images peuvent contenir des espaces quand ils sont entre guillemets (ex. `"Alpha 10"`). Cependant, les référencer dans les layouts nécessite le nom exact incluant l'espace.

---

## Erreurs courantes

### Oublier l'enregistrement dans config.cpp

Le problème le plus courant. Si votre fichier imageset existe mais n'est pas listé dans `class imageSets { files[] = { ... }; };` dans config.cpp, le moteur ne le charge jamais. Toutes les références d'images échoueront silencieusement (les widgets apparaissent vides).

### Collisions de noms de sets

Si deux mods enregistrent des imagesets avec le même `Name`, un seul est chargé (le dernier l'emporte). Utilisez un préfixe unique :

```
Name "mymod_icons"     -- Bon
Name "icons"           -- Risqué, trop générique
```

### Mauvais chemin de texture

Le `path` doit être relatif à la racine du PBO (comment le fichier apparaît dans le PBO empaqueté) :

```
path "MyMod/GUI/imagesets/icons.edds"     -- Correct si MyMod est la racine du PBO
path "GUI/imagesets/icons.edds"            -- Faux si la racine du PBO est MyMod/
path "C:/Users/dev/icons.edds"            -- Faux : les chemins absolus ne fonctionnent pas
```

### RefSize inadéquat

Le `RefSize` doit correspondre aux dimensions réelles en pixels de votre texture. Si vous spécifiez `RefSize 512 512` mais que votre texture fait 1024x1024, toutes les positions d'icônes seront décalées d'un facteur deux.

### Coordonnées Pos décalées d'un pixel

`Pos` est le coin supérieur gauche de la région de l'icône. Si vos icônes sont à des intervalles de 64 pixels mais que vous décalez accidentellement d'un pixel, les icônes auront une fine tranche de l'icône adjacente visible.

### Utiliser .png ou .tga directement

Le moteur nécessite le format `.edds` pour les atlas de textures référencés par les imagesets. Les fichiers `.png` ou `.tga` bruts ne se chargeront pas. Convertissez toujours en `.edds` en utilisant DayZ Workbench ou les outils de Mikero.

### Espaces dans les noms d'images

Bien que le moteur supporte les espaces dans les noms d'images (ex. `"Alpha 10"`), ils peuvent causer des problèmes dans certains contextes d'analyse. Préférez les underscores : `Alpha_10`.

---

## Bonnes pratiques

- Utilisez toujours un nom de set unique et préfixé par le mod (ex. `"mymod_icons"` au lieu de `"icons"`). Les collisions de noms de sets entre les mods font qu'un set écrase silencieusement l'autre.
- Utilisez des dimensions de texture en puissance de deux (256x256, 512x512, 1024x1024). Les textures non-puissance-de-deux fonctionnent mais peuvent avoir des performances de rendu réduites sur certains GPU.
- Ajoutez 1-2 pixels d'espace entre les icônes dans l'atlas pour empêcher le saignement de texture aux bords, surtout quand la texture est affichée à des tailles non natives.
- Préférez le format natif `.imageset` au XML pour les mods de production. Il supporte les textures multi-résolution et les drapeaux de tuile que le format XML ne propose pas.
- Vérifiez que `RefSize` correspond exactement aux dimensions réelles de la texture. Une inadéquation fait que toutes les coordonnées d'icônes sont fausses d'un facteur proportionnel.

---

## Théorie vs pratique

> Ce que dit la documentation versus comment les choses fonctionnent réellement à l'exécution.

| Concept | Théorie | Réalité |
|---------|---------|---------|
| L'enregistrement config.cpp est requis | Les ImageSets doivent être listés dans `class imageSets` | Correct, et c'est la source la plus courante de bugs « icône vide ». Le moteur ne donne pas d'erreur si l'enregistrement est manquant -- les widgets s'affichent simplement vides |
| `RefSize` mappe les coordonnées | Les coordonnées sont dans l'espace `RefSize` | `RefSize` doit correspondre aux dimensions réelles en pixels de la texture. Si votre texture fait 1024x1024 mais que `RefSize` dit 512x512, toutes les valeurs `Pos` sont interprétées au double de l'échelle |
| Le format XML est plus simple | Moins de fonctionnalités mais fonctionne pareil | Les imagesets XML ne peuvent pas spécifier de drapeaux de tuile ou de niveaux mip multi-résolution. Pour les icônes c'est bien, mais pour les éléments d'interface répétitifs (bordures, dégradés) vous avez besoin du format natif |
| Plusieurs entrées `mpix` | Le moteur sélectionne selon le paramètre de qualité | En pratique, la plupart des mods ne livrent que `mpix 1`. Le moteur replie gracieusement si un seul niveau mip est fourni -- pas de problème visuel, juste pas d'optimisation haute densité |
| Les noms d'images sont sensibles à la casse | `"MyIcon"` et `"myicon"` sont différents | Vrai dans la définition de l'imageset, mais `LoadImageFile()` en script effectue une recherche insensible à la casse sur certaines versions du moteur. Faites toujours correspondre la casse exactement par sécurité |

---

## Compatibilité et impact

- **Multi-Mod :** Les collisions de noms de sets sont le risque principal. Si deux mods définissent tous deux un imageset nommé `"icons"`, un seul est chargé (le dernier PBO l'emporte). Toutes les références à `set:icons` dans le mod perdant échouent silencieusement. Utilisez toujours un préfixe spécifique au mod.
- **Performance :** Chaque texture unique d'imageset est un chargement de texture GPU. Consolider les icônes en moins d'atlas plus grands réduit les appels de dessin. Un mod avec 10 textures séparées de 64x64 est moins performant qu'un seul atlas 512x512 avec 10 icônes.
- **Version :** Le format natif `.imageset` et la syntaxe de référence `set:name image:name` sont stables depuis DayZ 1.0. Le format XML est disponible comme alternative depuis les premières versions mais n'est pas officiellement documenté par Bohemia.

---

## Observé dans les mods réels

| Patron | Mod | Détail |
|--------|-----|--------|
| Atlas d'icônes Font Awesome | DabsFramework / StarDZ Core | Rend les icônes Font Awesome dans de grands atlas (3648x3712), fournissant des milliers d'icônes professionnelles via `set:solid`, `set:regular`, `set:brands` |
| Disposition d'atlas libre | VPP Admin Tools | Icônes arrangées de manière non uniforme sur un atlas 1920x1080 avec des tailles variées, maximisant l'utilisation de l'espace de texture |
| Petits atlas par fonctionnalité | Expansion | Chaque sous-module Expansion a son propre petit imageset plutôt qu'un seul atlas massif, gardant les tailles de PBO minimales |
| Icônes d'inventaire 300x300 | SNAFU Weapons | Grandes tailles d'icônes pour les slots d'inventaire d'armes/accessoires où le détail compte, contrairement aux icônes d'interface 64x64 |
