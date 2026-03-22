# Chapitre 3.7 : Styles, polices et images

[Accueil](../README.md) | [<< Précédent : Gestion des événements](06-event-handling.md) | **Styles, polices et images** | [Suivant : Dialogues et modales >>](08-dialogs-modals.md)

---

Ce chapitre couvre les éléments visuels de base de l'interface DayZ : les styles prédéfinis, l'utilisation des polices, le dimensionnement du texte, les widgets d'image avec les références d'imagesets, et comment créer des imagesets personnalisés pour votre mod.

---

## Styles

Les styles sont des apparences visuelles prédéfinies qui peuvent être appliquées aux widgets via l'attribut `style` dans les fichiers layout. Ils contrôlent le rendu de l'arrière-plan, les bordures et l'apparence générale sans nécessiter de configuration manuelle des couleurs et des images.

### Styles intégrés courants

| Nom du style | Description |
|---|---|
| `blank` | Aucun visuel -- arrière-plan complètement transparent |
| `Empty` | Pas de rendu d'arrière-plan |
| `Default` | Style par défaut de bouton/widget avec l'apparence standard de DayZ |
| `Colorable` | Style qui peut être teinté avec `SetColor()` |
| `rover_sim_colorable` | Style de panneau coloré, couramment utilisé pour les arrière-plans |
| `rover_sim_black` | Arrière-plan de panneau sombre |
| `rover_sim_black_2` | Variante de panneau plus sombre |
| `Outline_1px_BlackBackground` | Contour de 1 pixel avec arrière-plan noir uni |
| `OutlineFilled` | Contour avec un intérieur rempli |
| `DayZDefaultPanelRight` | Style de panneau droit par défaut de DayZ |
| `DayZNormal` | Style normal de texte/widget DayZ |
| `MenuDefault` | Style de bouton de menu standard |

### Utiliser les styles dans les layouts

```
ButtonWidgetClass MyButton {
 style Default
 text "Click Me"
 size 120 30
 hexactsize 1
 vexactsize 1
}

PanelWidgetClass Background {
 style rover_sim_colorable
 color 0.2 0.3 0.5 0.9
 size 1 1
}
```

### Patron style + couleur

Les styles `Colorable` et `rover_sim_colorable` sont conçus pour être teintés. Définissez l'attribut `color` dans le layout ou appelez `SetColor()` dans le code :

```
PanelWidgetClass TitleBar {
 style rover_sim_colorable
 color 0.4196 0.6471 1 0.9412
 size 1 30
 hexactsize 0
 vexactsize 1
}
```

```c
// Changer la couleur à l'exécution
PanelWidget bar = PanelWidget.Cast(root.FindAnyWidget("TitleBar"));
bar.SetColor(ARGB(240, 107, 165, 255));
```

### Styles dans les mods professionnels

Les dialogues de DabsFramework utilisent `Outline_1px_BlackBackground` pour les conteneurs de dialogues :

```
WrapSpacerWidgetClass EditorDialog {
 style Outline_1px_BlackBackground
 Padding 5
 "Size To Content V" 1
}
```

Colorful UI utilise `rover_sim_colorable` de manière extensive pour les panneaux thématiques dont la couleur est contrôlée par un gestionnaire de thème centralisé.

---

## Polices

DayZ inclut plusieurs polices intégrées. Les chemins de police sont spécifiés dans l'attribut `font`.

### Chemins des polices intégrées

| Chemin de la police | Description |
|---|---|
| `"gui/fonts/Metron"` | Police d'interface standard |
| `"gui/fonts/Metron28"` | Police standard, variante 28pt |
| `"gui/fonts/Metron-Bold"` | Variante grasse |
| `"gui/fonts/Metron-Bold58"` | Variante grasse 58pt |
| `"gui/fonts/sdf_MetronBook24"` | Police SDF (Signed Distance Field) -- nette à toute taille |

### Utiliser les polices dans les layouts

```
TextWidgetClass Title {
 text "Mission Briefing"
 font "gui/fonts/Metron-Bold"
 "text halign" center
 "text valign" center
}

TextWidgetClass Body {
 text "Objective: Secure the airfield"
 font "gui/fonts/Metron"
}
```

### Utiliser les polices dans le code

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MyText"));
tw.SetText("Hello");
// La police est définie dans le layout, non modifiable à l'exécution via script
```

### Polices SDF

Les polices SDF (Signed Distance Field) s'affichent nettement à n'importe quel niveau de zoom, ce qui les rend idéales pour les éléments d'interface qui peuvent apparaître à différentes tailles. La police `sdf_MetronBook24` est le meilleur choix pour le texte qui doit rester net à travers différents paramètres de mise à l'échelle de l'interface.

---

## Dimensionnement du texte : "exact text" vs proportionnel

Les widgets de texte de DayZ prennent en charge deux modes de dimensionnement, contrôlés par l'attribut `"exact text"` :

### Texte proportionnel (par défaut)

Lorsque `"exact text" 0` (la valeur par défaut), la taille de la police est déterminée par la hauteur du widget. Le texte se redimensionne avec le widget. C'est le comportement par défaut.

```
TextWidgetClass ScalingText {
 size 1 0.05
 hexactsize 0
 vexactsize 0
 text "I scale with my parent"
}
```

### Taille de texte exacte

Lorsque `"exact text" 1`, la taille de la police est une valeur fixe en pixels définie par `"exact text size"` :

```
TextWidgetClass FixedText {
 size 1 30
 hexactsize 0
 vexactsize 1
 text "I am always 16 pixels"
 "exact text" 1
 "exact text size" 16
}
```

### Lequel utiliser ?

| Scénario | Recommandation |
|---|---|
| Éléments de HUD qui se redimensionnent avec la taille de l'écran | Proportionnel (par défaut) |
| Texte de menu à une taille spécifique | `"exact text" 1` avec `"exact text size"` |
| Texte qui doit correspondre à une taille de police spécifique en pixels | `"exact text" 1` |
| Texte à l'intérieur de spacers/grilles | Souvent proportionnel, déterminé par la hauteur de la cellule |

### Attributs de taille liés au texte

| Attribut | Effet |
|---|---|
| `"size to text h" 1` | La largeur du widget s'ajuste pour contenir le texte |
| `"size to text v" 1` | La hauteur du widget s'ajuste pour contenir le texte |
| `"text sharpness"` | Valeur flottante contrôlant la netteté du rendu |
| `wrap 1` | Activer le retour à la ligne automatique pour le texte qui dépasse la largeur du widget |

Les attributs `"size to text"` sont utiles pour les étiquettes et les tags où le widget doit être exactement aussi grand que son contenu textuel.

---

## Alignement du texte

Contrôlez où le texte apparaît dans son widget en utilisant les attributs d'alignement :

```
TextWidgetClass CenteredLabel {
 text "Centered"
 "text halign" center
 "text valign" center
}
```

| Attribut | Valeurs | Effet |
|---|---|---|
| `"text halign"` | `left`, `center`, `right` | Position horizontale du texte dans le widget |
| `"text valign"` | `top`, `center`, `bottom` | Position verticale du texte dans le widget |

---

## Contour du texte

Ajoutez des contours au texte pour la lisibilité sur des arrière-plans chargés :

```c
TextWidget tw;
tw.SetOutline(1, ARGB(255, 0, 0, 0));   // Contour noir de 1px

int size = tw.GetOutlineSize();           // Lire la taille du contour
int color = tw.GetOutlineColor();         // Lire la couleur du contour (ARGB)
```

---

## ImageWidget

`ImageWidget` affiche des images depuis deux sources : les références d'imagesets et les fichiers chargés dynamiquement.

### Références d'imagesets

La manière la plus courante d'afficher des images. Un imageset est un atlas de sprites -- un fichier de texture unique avec plusieurs sous-images nommées.

Dans un fichier layout :

```
ImageWidgetClass MyIcon {
 image0 "set:dayz_gui image:icon_refresh"
 mode blend
 "src alpha" 1
 stretch 1
}
```

Le format est `"set:<nom_imageset> image:<nom_image>"`.

Imagesets et images vanilla courants :

```
"set:dayz_gui image:icon_pin"           -- Icône d'épingle de carte
"set:dayz_gui image:icon_refresh"       -- Icône de rafraîchissement
"set:dayz_gui image:icon_x"            -- Icône de fermeture/X
"set:dayz_gui image:icon_missing"      -- Icône d'avertissement/manquant
"set:dayz_gui image:iconHealth0"       -- Icône de santé/plus
"set:dayz_gui image:DayZLogo"          -- Logo DayZ
"set:dayz_gui image:Expand"            -- Flèche d'expansion
"set:dayz_gui image:Gradient"          -- Bande de dégradé
```

### Emplacements d'images multiples

Un seul `ImageWidget` peut contenir plusieurs images dans différents emplacements (`image0`, `image1`, etc.) et basculer entre elles :

```
ImageWidgetClass StatusIcon {
 image0 "set:dayz_gui image:icon_missing"
 image1 "set:dayz_gui image:iconHealth0"
}
```

```c
ImageWidget icon;
icon.SetImage(0);    // Afficher image0 (icône manquante)
icon.SetImage(1);    // Afficher image1 (icône de santé)
```

### Chargement d'images depuis des fichiers

Chargez des images dynamiquement à l'exécution :

```c
ImageWidget img;
img.LoadImageFile(0, "MyMod/gui/textures/my_image.edds");
img.SetImage(0);
```

Le chemin est relatif au répertoire racine du mod. Les formats pris en charge incluent `.edds`, `.paa` et `.tga` (bien que `.edds` soit le standard pour DayZ).

### Modes de fusion d'images

L'attribut `mode` contrôle comment l'image se mélange avec ce qui est derrière elle :

| Mode | Effet |
|---|---|
| `blend` | Mélange alpha standard (le plus courant) |
| `additive` | Les couleurs s'additionnent (effets de lueur) |
| `stretch` | Étirer pour remplir sans mélange |

### Transitions par masque d'image

`ImageWidget` prend en charge les transitions de révélation basées sur des masques :

```c
ImageWidget img;
img.LoadMaskTexture("gui/textures/mask_wipe.edds");
img.SetMaskProgress(0.5);  // 50% révélé
```

C'est utile pour les barres de chargement, les affichages de santé et les animations de révélation.

---

## Format des imagesets

Un fichier imageset (`.imageset`) définit des régions nommées au sein d'un atlas de sprites. DayZ prend en charge deux formats d'imageset.

### Format natif DayZ

Utilisé par le DayZ vanilla et la plupart des mods. Ce n'est **pas** du XML -- il utilise le même format à accolades que les fichiers layout.

```
ImageSetClass {
 Name "my_mod_icons"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "MyMod/GUI/imagesets/my_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_sword {
   Name "icon_sword"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_shield {
   Name "icon_shield"
   Pos 64 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_potion {
   Name "icon_potion"
   Pos 128 0
   Size 64 64
   Flags 0
  }
 }
}
```

Champs clés :
- `Name` -- Nom de l'imageset (utilisé dans `"set:<nom>"`)
- `RefSize` -- Taille de référence de la texture source en pixels (largeur hauteur)
- `path` -- Chemin vers le fichier de texture (`.edds`)
- `mpix` -- Niveau de mipmap (0 = résolution standard, 1 = résolution 2x)
- Chaque entrée d'image définit `Name`, `Pos` (x y en pixels) et `Size` (largeur hauteur en pixels)

### Format XML

Certains mods (y compris certains modules de DayZ Expansion) utilisent un format d'imageset basé sur XML :

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="my_icons" file="MyMod/GUI/imagesets/my_icons.edds">
  <image name="icon_sword" pos="0 0" size="64 64" />
  <image name="icon_shield" pos="64 0" size="64 64" />
  <image name="icon_potion" pos="128 0" size="64 64" />
</imageset>
```

Les deux formats accomplissent la même chose. Le format natif est utilisé par le DayZ vanilla ; le format XML est parfois plus facile à lire et à modifier à la main.

---

## Créer des imagesets personnalisés

Pour créer votre propre imageset pour un mod :

### Étape 1 : créer la texture de l'atlas de sprites

Utilisez un éditeur d'image (Photoshop, GIMP, etc.) pour créer une texture unique contenant toutes vos icônes/images arrangées sur une grille. Les tailles courantes sont 256x256, 512x512 ou 1024x1024 pixels.

Sauvegardez en `.tga`, puis convertissez en `.edds` en utilisant DayZ Tools (TexView2 ou le ImageTool).

### Étape 2 : créer le fichier imageset

Créez un fichier `.imageset` qui associe des régions nommées à des positions dans la texture :

```
ImageSetClass {
 Name "mymod_icons"
 RefSize 512 512
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "MyFramework/GUI/imagesets/mymod_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_mission {
   Name "icon_mission"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_waypoint {
   Name "icon_waypoint"
   Pos 64 0
   Size 64 64
   Flags 0
  }
 }
}
```

### Étape 3 : enregistrer dans config.cpp

Dans le `config.cpp` de votre mod, enregistrez l'imageset sous `CfgMods` :

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
                files[] = { "MyMod/GUI/imagesets/mymod_icons.imageset" };
            };
            // ... modules de script ...
        };
    };
};
```

### Étape 4 : utiliser dans les layouts et le code

Dans les fichiers layout :

```
ImageWidgetClass MissionIcon {
 image0 "set:mymod_icons image:icon_mission"
 mode blend
 "src alpha" 1
}
```

Dans le code :

```c
ImageWidget icon;
// Les images des imagesets enregistrés sont disponibles par set:nom image:nom
// Aucune étape de chargement supplémentaire nécessaire après l'enregistrement dans config.cpp
```

---

## Patron de thème de couleurs

Les mods professionnels centralisent leurs définitions de couleurs dans une classe de thème, puis appliquent les couleurs à l'exécution. Cela facilite le changement de style de toute l'interface en modifiant un seul fichier.

```c
class UIColor
{
    static int White()        { return ARGB(255, 255, 255, 255); }
    static int Black()        { return ARGB(255, 0, 0, 0); }
    static int Primary()      { return ARGB(255, 75, 119, 190); }
    static int Secondary()    { return ARGB(255, 60, 60, 60); }
    static int Accent()       { return ARGB(255, 100, 200, 100); }
    static int Danger()       { return ARGB(255, 200, 50, 50); }
    static int Transparent()  { return ARGB(1, 0, 0, 0); }
    static int SemiBlack()    { return ARGB(180, 0, 0, 0); }
}
```

Appliquer dans le code :

```c
titleBar.SetColor(UIColor.Primary());
statusText.SetColor(UIColor.Accent());
errorText.SetColor(UIColor.Danger());
```

Ce patron (utilisé par Colorful UI, MyMod et d'autres) signifie que changer l'ensemble du schéma de couleurs de l'interface ne nécessite de modifier que la classe de thème.

---

## Résumé des attributs visuels par type de widget

| Widget | Attributs visuels principaux |
|---|---|
| Tout widget | `color`, `visible`, `style`, `priority`, `inheritalpha` |
| TextWidget | `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `wrap` |
| ImageWidget | `image0`, `mode`, `"src alpha"`, `stretch`, `"flip u"`, `"flip v"` |
| ButtonWidget | `text`, `style`, `switch toggle` |
| PanelWidget | `color`, `style` |
| SliderWidget | `"fill in"` |
| ProgressBarWidget | `style` |

---

## Bonnes pratiques

1. **Utilisez les références d'imagesets** plutôt que les chemins de fichiers directs lorsque c'est possible -- les imagesets sont regroupés plus efficacement par le moteur.

2. **Utilisez les polices SDF** (`sdf_MetronBook24`) pour le texte qui doit rester net à n'importe quelle échelle.

3. **Utilisez `"exact text" 1`** pour le texte d'interface à des tailles en pixels spécifiques ; utilisez le texte proportionnel pour les éléments de HUD qui doivent se redimensionner.

4. **Centralisez les couleurs** dans une classe de thème plutôt que de coder en dur des valeurs ARGB dans tout votre code.

5. **Définissez `"src alpha" 1`** sur les widgets d'image pour obtenir une transparence correcte.

6. **Enregistrez les imagesets personnalisés** dans `config.cpp` pour qu'ils soient disponibles globalement sans chargement manuel.

7. **Gardez les atlas de sprites à une taille raisonnable** -- 512x512 ou 1024x1024 est typique. Les textures plus grandes gaspillent de la mémoire si la plupart de l'espace est vide.

---

## Prochaines étapes

- [3.8 Dialogues et modales](08-dialogs-modals.md) -- Fenêtres popup, invites de confirmation et panneaux de superposition
- [3.1 Types de widgets](01-widget-types.md) -- Revoir le catalogue complet des widgets
- [3.6 Gestion des événements](06-event-handling.md) -- Rendre vos widgets stylisés interactifs

---

## Théorie vs pratique

| Concept | Théorie | Réalité |
|---------|--------|---------|
| Les polices SDF se redimensionnent à n'importe quelle taille | `sdf_MetronBook24` est nette à toutes les tailles | Vrai pour les tailles au-dessus de ~10px. En dessous, les polices SDF peuvent apparaître floues par rapport aux polices bitmap à leur taille native |
| `"exact text" 1` donne un dimensionnement au pixel près | La police s'affiche à la taille exacte en pixels spécifiée | DayZ applique une mise à l'échelle interne, donc `"exact text size" 16` peut s'afficher légèrement différemment selon les résolutions. Testez en 1080p et 1440p |
| Les styles intégrés couvrent tous les besoins | `Default`, `blank`, `Colorable` sont suffisants | La plupart des mods professionnels définissent leurs propres fichiers `.styles` car les styles intégrés ont une variété visuelle limitée |
| Les formats XML et natif des imagesets sont équivalents | Les deux définissent des régions de sprites | Le format natif à accolades est ce que le moteur traite le plus rapidement. Le format XML fonctionne mais ajoute une étape d'analyse ; utilisez le format natif pour la production |
| `SetColor()` remplace la couleur du layout | La couleur à l'exécution remplace la valeur du layout | `SetColor()` teinte le visuel existant du widget. Sur les widgets avec style, la teinte se multiplie avec la couleur de base du style, produisant des résultats inattendus |

---

## Compatibilité et impact

- **Multi-Mod :** Les noms de styles sont globaux. Si deux mods enregistrent un fichier `.styles` définissant le même nom de style, le dernier mod chargé gagne. Préfixez les noms de styles personnalisés avec l'identifiant de votre mod (par exemple, `MyMod_PanelDark`).
- **Performance :** Les imagesets sont chargés une seule fois dans la mémoire GPU au démarrage. Ajouter de grands atlas de sprites (2048x2048+) augmente l'utilisation de la VRAM. Gardez les atlas à 512x512 ou 1024x1024 et répartissez-les sur plusieurs imagesets si nécessaire.
