# Chapitre 3.1 : Types de widgets

[Accueil](../README.md) | **Types de widgets** | [Suivant : Fichiers layout >>](02-layout-files.md)

---

Le système d'interface de DayZ est construit sur des widgets -- des composants d'interface réutilisables allant de simples conteneurs à des contrôles interactifs complexes. Chaque élément visible à l'écran est un widget, et comprendre le catalogue complet est essentiel pour construire des interfaces de mods.

Ce chapitre fournit une référence complète de tous les types de widgets disponibles dans Enforce Script.

---

## Fonctionnement des widgets

Chaque widget dans DayZ hérite de la classe de base `Widget`. Les widgets sont organisés dans un arbre parent-enfant, où la racine est typiquement un `WorkspaceWidget` obtenu via `GetGame().GetWorkspace()`.

Chaque type de widget possède trois identifiants associés :

| Identifiant | Exemple | Utilisé pour |
|---|---|---|
| **Classe script** | `TextWidget` | Références dans le code, casting |
| **Classe layout** | `TextWidgetClass` | Déclarations dans les fichiers `.layout` |
| **Constante TypeID** | `TextWidgetTypeID` | Création programmatique avec `CreateWidget()` |

Dans les fichiers `.layout`, vous utilisez toujours le nom de la classe layout (se terminant par `Class`). Dans les scripts, vous travaillez avec le nom de la classe script.

---

## Widgets conteneurs / layout

Les widgets conteneurs contiennent et organisent les widgets enfants. Ils n'affichent pas de contenu eux-mêmes (sauf `PanelWidget`, qui dessine un rectangle coloré).

| Classe script | Classe layout | Objectif |
|---|---|---|
| `Widget` | `WidgetClass` | Classe de base abstraite pour tous les widgets. Ne jamais instancier directement. |
| `WorkspaceWidget` | `WorkspaceWidgetClass` | Espace de travail racine. Obtenu via `GetGame().GetWorkspace()`. Utilisé pour créer des widgets programmatiquement. |
| `FrameWidget` | `FrameWidgetClass` | Conteneur polyvalent. Le widget le plus couramment utilisé dans DayZ. |
| `PanelWidget` | `PanelWidgetClass` | Rectangle de couleur unie. À utiliser pour les arrière-plans, les séparateurs, les diviseurs. |
| `WrapSpacerWidget` | `WrapSpacerWidgetClass` | Layout en flux. Arrange les enfants séquentiellement avec retour à la ligne, padding et marges. |
| `GridSpacerWidget` | `GridSpacerWidgetClass` | Layout en grille. Arrange les enfants dans une grille définie par `Columns` et `Rows`. |
| `ScrollWidget` | `ScrollWidgetClass` | Zone de défilement. Active le défilement vertical/horizontal du contenu enfant. |
| `SpacerBaseWidget` | -- | Classe de base abstraite pour `WrapSpacerWidget` et `GridSpacerWidget`. |

### FrameWidget

Le cheval de bataille de l'interface DayZ. Utilisez `FrameWidget` comme conteneur par défaut lorsque vous devez regrouper des widgets ensemble. Il n'a aucune apparence visuelle -- il est purement structurel.

**Méthodes principales :**
- Toutes les méthodes de base de `Widget` (position, taille, couleur, enfants, drapeaux)

**Quand utiliser :** Presque partout. Enveloppez les groupes de widgets associés. Utilisez-le comme racine des dialogues, panneaux et éléments de HUD.

```c
// Trouver un widget frame par nom
FrameWidget panel = FrameWidget.Cast(root.FindAnyWidget("MyPanel"));
panel.Show(true);
```

### PanelWidget

Un rectangle visible avec une couleur unie. Contrairement à `FrameWidget`, un `PanelWidget` affiche réellement quelque chose à l'écran.

**Méthodes principales :**
- `SetColor(int argb)` -- Définir la couleur d'arrière-plan
- `SetAlpha(float alpha)` -- Définir la transparence

**Quand utiliser :** Arrière-plans derrière le texte, séparateurs colorés, rectangles de superposition, couches de teinte.

```c
PanelWidget bg = PanelWidget.Cast(root.FindAnyWidget("Background"));
bg.SetColor(ARGB(200, 0, 0, 0));  // Noir semi-transparent
```

### WrapSpacerWidget

Arrange automatiquement les enfants dans un layout en flux. Les enfants sont placés les uns après les autres, passant à la ligne suivante lorsque l'espace est insuffisant.

**Attributs de layout principaux :**
- `Padding` -- Espacement intérieur (pixels)
- `Margin` -- Espacement extérieur (pixels)
- `"Size To Content H" 1` -- Redimensionner la largeur pour s'adapter aux enfants
- `"Size To Content V" 1` -- Redimensionner la hauteur pour s'adapter aux enfants
- `content_halign` -- Alignement horizontal du contenu (`left`, `center`, `right`)
- `content_valign` -- Alignement vertical du contenu (`top`, `center`, `bottom`)

**Quand utiliser :** Listes dynamiques, nuages de tags, rangées de boutons, tout layout où les enfants ont des tailles variables.

### GridSpacerWidget

Arrange les enfants dans une grille fixe. Chaque cellule a une taille égale.

**Attributs de layout principaux :**
- `Columns` -- Nombre de colonnes
- `Rows` -- Nombre de lignes
- `Margin` -- Espace entre les cellules
- `"Size To Content V" 1` -- Redimensionner la hauteur pour s'adapter au contenu

**Quand utiliser :** Grilles d'inventaire, galeries d'icônes, panneaux de paramètres avec des lignes uniformes.

### ScrollWidget

Fournit une zone de défilement pour le contenu qui dépasse la zone visible.

**Attributs de layout principaux :**
- `"Scrollbar V" 1` -- Activer la barre de défilement verticale
- `"Scrollbar H" 1` -- Activer la barre de défilement horizontale

**Méthodes principales :**
- `VScrollToPos(float pos)` -- Défiler vers une position verticale
- `GetVScrollPos()` -- Obtenir la position actuelle du défilement vertical
- `GetContentHeight()` -- Obtenir la hauteur totale du contenu
- `VScrollStep(int step)` -- Défiler d'un montant défini

**Quand utiliser :** Longues listes, panneaux de configuration, fenêtres de chat, visionneuses de logs.

---

## Widgets d'affichage

Les widgets d'affichage montrent du contenu à l'utilisateur mais ne sont pas interactifs.

| Classe script | Classe layout | Objectif |
|---|---|---|
| `TextWidget` | `TextWidgetClass` | Affichage de texte sur une seule ligne |
| `MultilineTextWidget` | `MultilineTextWidgetClass` | Texte multiligne en lecture seule |
| `RichTextWidget` | `RichTextWidgetClass` | Texte avec images intégrées (balises `<image>`) |
| `ImageWidget` | `ImageWidgetClass` | Affichage d'images (depuis des imagesets ou des fichiers) |
| `CanvasWidget` | `CanvasWidgetClass` | Surface de dessin programmable |
| `VideoWidget` | `VideoWidgetClass` | Lecture de fichiers vidéo |
| `RTTextureWidget` | `RTTextureWidgetClass` | Surface de rendu vers texture |
| `RenderTargetWidget` | `RenderTargetWidgetClass` | Cible de rendu de scène 3D |
| `ItemPreviewWidget` | `ItemPreviewWidgetClass` | Aperçu 3D d'objet DayZ |
| `PlayerPreviewWidget` | `PlayerPreviewWidgetClass` | Aperçu 3D du personnage joueur |
| `MapWidget` | `MapWidgetClass` | Carte du monde interactive |

### TextWidget

Le widget d'affichage le plus courant. Affiche une seule ligne de texte.

**Méthodes principales :**
```c
TextWidget tw;
tw.SetText("Hello World");
tw.GetText();                           // Retourne une string
tw.GetTextSize(out int w, out int h);   // Dimensions en pixels du texte affiché
tw.SetTextExactSize(float size);        // Définir la taille de police en pixels
tw.SetOutline(int size, int color);     // Ajouter un contour au texte
tw.GetOutlineSize();                    // Retourne un int
tw.GetOutlineColor();                   // Retourne un int (ARGB)
tw.SetColor(int argb);                  // Couleur du texte
```

**Attributs de layout principaux :** `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `"size to text h"`, `"size to text v"`, `wrap`.

### MultilineTextWidget

Affiche plusieurs lignes de texte en lecture seule. Le texte passe automatiquement à la ligne en fonction de la largeur du widget.

**Quand utiliser :** Panneaux de description, texte d'aide, affichage de logs.

### RichTextWidget

Prend en charge les images intégrées dans le texte via des balises `<image>`. Prend également en charge le retour à la ligne du texte.

**Attributs de layout principaux :**
- `wrap 1` -- Activer le retour à la ligne automatique

**Utilisation dans le texte :**
```
"Health: <image set:dayz_gui image:iconHealth0 /> OK"
```

**Quand utiliser :** Texte de statut avec icônes, messages formatés, chat avec images intégrées.

### ImageWidget

Affiche des images depuis des feuilles de sprites imageset ou chargées depuis des chemins de fichiers.

**Méthodes principales :**
```c
ImageWidget iw;
iw.SetImage(int index);                    // Basculer entre image0, image1, etc.
iw.LoadImageFile(int slot, string path);   // Charger une image depuis un fichier
iw.LoadMaskTexture(string path);           // Charger une texture de masque
iw.SetMaskProgress(float progress);        // 0-1 pour les transitions de balayage/révélation
```

**Attributs de layout principaux :**
- `image0 "set:dayz_gui image:icon_refresh"` -- Image depuis un imageset
- `mode blend` -- Mode de fusion (`blend`, `additive`, `stretch`)
- `"src alpha" 1` -- Utiliser le canal alpha source
- `stretch 1` -- Étirer l'image pour remplir le widget
- `"flip u" 1` -- Retourner horizontalement
- `"flip v" 1` -- Retourner verticalement

**Quand utiliser :** Icônes, logos, arrière-plans, marqueurs de carte, indicateurs de statut.

### CanvasWidget

Une surface de dessin où vous pouvez tracer des lignes programmatiquement.

**Méthodes principales :**
```c
CanvasWidget cw;
cw.DrawLine(float x1, float y1, float x2, float y2, float width, int color);
cw.Clear();
```

**Quand utiliser :** Graphiques personnalisés, lignes de connexion entre des noeuds, superpositions de débogage.

### MapWidget

La carte du monde interactive complète. Prend en charge le panoramique, le zoom et la conversion de coordonnées.

**Méthodes principales :**
```c
MapWidget mw;
mw.SetMapPos(vector pos);              // Centrer sur une position dans le monde
mw.GetMapPos();                        // Position centrale actuelle
mw.SetScale(float scale);             // Niveau de zoom
mw.GetScale();                        // Zoom actuel
mw.MapToScreen(vector world_pos);     // Coordonnées monde vers coordonnées écran
mw.ScreenToMap(vector screen_pos);    // Coordonnées écran vers coordonnées monde
```

**Quand utiliser :** Cartes de mission, systèmes GPS, sélecteurs de position.

### ItemPreviewWidget

Affiche un aperçu 3D de n'importe quel objet d'inventaire DayZ.

**Quand utiliser :** Écrans d'inventaire, aperçus de butin, interfaces de boutique.

### PlayerPreviewWidget

Affiche un aperçu 3D du modèle du personnage joueur.

**Quand utiliser :** Écrans de création de personnage, aperçu d'équipement, systèmes de vestiaire.

### RTTextureWidget

Affiche ses enfants sur une surface de texture plutôt que directement à l'écran.

**Quand utiliser :** Rendu de minicarte, effets d'image dans l'image, composition d'interface hors écran.

---

## Widgets interactifs

Les widgets interactifs répondent aux entrées de l'utilisateur et déclenchent des événements.

| Classe script | Classe layout | Objectif |
|---|---|---|
| `ButtonWidget` | `ButtonWidgetClass` | Bouton cliquable |
| `CheckBoxWidget` | `CheckBoxWidgetClass` | Case à cocher booléenne |
| `EditBoxWidget` | `EditBoxWidgetClass` | Saisie de texte sur une seule ligne |
| `MultilineEditBoxWidget` | `MultilineEditBoxWidgetClass` | Saisie de texte multiligne |
| `PasswordEditBoxWidget` | `PasswordEditBoxWidgetClass` | Saisie de mot de passe masqué |
| `SliderWidget` | `SliderWidgetClass` | Curseur horizontal |
| `XComboBoxWidget` | `XComboBoxWidgetClass` | Sélection déroulante |
| `TextListboxWidget` | `TextListboxWidgetClass` | Liste de lignes sélectionnables |
| `ProgressBarWidget` | `ProgressBarWidgetClass` | Indicateur de progression |
| `SimpleProgressBarWidget` | `SimpleProgressBarWidgetClass` | Indicateur de progression minimal |

### ButtonWidget

Le contrôle interactif principal. Prend en charge à la fois les modes clic momentané et bascule.

**Méthodes principales :**
```c
ButtonWidget bw;
bw.SetText("Click Me");
bw.GetState();              // Retourne un bool (boutons bascule uniquement)
bw.SetState(bool state);    // Définir l'état de bascule
```

**Attributs de layout principaux :**
- `text "Label"` -- Texte du libellé du bouton
- `switch toggle` -- En faire un bouton bascule
- `style Default` -- Style visuel

**Événements déclenchés :** `OnClick(Widget w, int x, int y, int button)`

### CheckBoxWidget

Un contrôle de bascule booléen.

**Méthodes principales :**
```c
CheckBoxWidget cb;
cb.IsChecked();                 // Retourne un bool
cb.SetChecked(bool checked);    // Définir l'état
```

**Événements déclenchés :** `OnChange(Widget w, int x, int y, bool finished)`

### EditBoxWidget

Un champ de saisie de texte sur une seule ligne.

**Méthodes principales :**
```c
EditBoxWidget eb;
eb.GetText();               // Retourne une string
eb.SetText("default");      // Définir le contenu textuel
```

**Événements déclenchés :** `OnChange(Widget w, int x, int y, bool finished)` -- `finished` est `true` lorsque la touche Entrée est pressée.

### SliderWidget

Un curseur horizontal pour les valeurs numériques.

**Méthodes principales :**
```c
SliderWidget sw;
sw.GetCurrent();            // Retourne un float (0-1)
sw.SetCurrent(float val);   // Définir la position
```

**Attributs de layout principaux :**
- `"fill in" 1` -- Afficher la piste remplie derrière la poignée
- `"listen to input" 1` -- Répondre aux entrées de la souris

**Événements déclenchés :** `OnChange(Widget w, int x, int y, bool finished)` -- `finished` est `true` lorsque l'utilisateur relâche le curseur.

### XComboBoxWidget

Une liste de sélection déroulante.

**Méthodes principales :**
```c
XComboBoxWidget xcb;
xcb.AddItem("Option A");
xcb.AddItem("Option B");
xcb.SetCurrentItem(0);         // Sélectionner par index
xcb.GetCurrentItem();          // Retourne l'index sélectionné
xcb.ClearAll();                // Supprimer tous les éléments
```

### TextListboxWidget

Une liste déroulante de lignes de texte. Prend en charge la sélection et les données multi-colonnes.

**Méthodes principales :**
```c
TextListboxWidget tlb;
tlb.AddItem("Row text", null, 0);   // texte, userData, colonne
tlb.GetSelectedRow();               // Retourne un int (-1 si aucune sélection)
tlb.SetRow(int row);                // Sélectionner une ligne
tlb.RemoveRow(int row);
tlb.ClearItems();
```

**Événements déclenchés :** `OnItemSelected`

### ProgressBarWidget

Affiche un indicateur de progression.

**Méthodes principales :**
```c
ProgressBarWidget pb;
pb.SetCurrent(float value);    // 0-100
```

**Quand utiliser :** Barres de chargement, barres de santé, progression de mission, indicateurs de temps de recharge.

---

## Référence complète des TypeID

Utilisez ces constantes avec `GetGame().GetWorkspace().CreateWidget()` pour la création programmatique de widgets :

```
FrameWidgetTypeID
TextWidgetTypeID
MultilineTextWidgetTypeID
MultilineEditBoxWidgetTypeID
RichTextWidgetTypeID
RenderTargetWidgetTypeID
ImageWidgetTypeID
VideoWidgetTypeID
RTTextureWidgetTypeID
ButtonWidgetTypeID
CheckBoxWidgetTypeID
SimpleProgressBarWidgetTypeID
ProgressBarWidgetTypeID
SliderWidgetTypeID
TextListboxWidgetTypeID
EditBoxWidgetTypeID
PasswordEditBoxWidgetTypeID
WorkspaceWidgetTypeID
GridSpacerWidgetTypeID
WrapSpacerWidgetTypeID
ScrollWidgetTypeID
```

---

## Choisir le bon widget

| J'ai besoin de... | Utiliser ce widget |
|---|---|
| Regrouper des widgets ensemble (invisible) | `FrameWidget` |
| Dessiner un rectangle coloré | `PanelWidget` |
| Afficher du texte | `TextWidget` |
| Afficher du texte multiligne | `MultilineTextWidget` ou `RichTextWidget` avec `wrap 1` |
| Afficher du texte avec des icônes intégrées | `RichTextWidget` |
| Afficher une image/icône | `ImageWidget` |
| Créer un bouton cliquable | `ButtonWidget` |
| Créer une bascule (on/off) | `CheckBoxWidget` ou `ButtonWidget` avec `switch toggle` |
| Accepter une saisie de texte | `EditBoxWidget` |
| Accepter une saisie de texte multiligne | `MultilineEditBoxWidget` |
| Accepter un mot de passe | `PasswordEditBoxWidget` |
| Laisser l'utilisateur choisir un nombre | `SliderWidget` |
| Laisser l'utilisateur choisir dans une liste | `XComboBoxWidget` (déroulante) ou `TextListboxWidget` (liste visible) |
| Afficher une progression | `ProgressBarWidget` ou `SimpleProgressBarWidget` |
| Arranger les enfants en flux | `WrapSpacerWidget` |
| Arranger les enfants en grille | `GridSpacerWidget` |
| Rendre le contenu défilable | `ScrollWidget` |
| Afficher un modèle 3D d'objet | `ItemPreviewWidget` |
| Afficher le modèle du joueur | `PlayerPreviewWidget` |
| Afficher la carte du monde | `MapWidget` |
| Dessiner des lignes/formes personnalisées | `CanvasWidget` |
| Faire un rendu vers une texture | `RTTextureWidget` |

---

## Prochaines étapes

- [3.2 Format des fichiers layout](02-layout-files.md) -- Apprendre à définir des arborescences de widgets dans les fichiers `.layout`
- [3.5 Création programmatique de widgets](05-programmatic-widgets.md) -- Créer des widgets depuis le code plutôt que depuis des fichiers layout

---

## Bonnes pratiques

- Utilisez `FrameWidget` comme conteneur par défaut. N'utilisez `PanelWidget` que lorsque vous avez besoin d'un arrière-plan coloré visible.
- Préférez `RichTextWidget` à `TextWidget` lorsque vous pourriez avoir besoin d'icônes intégrées plus tard -- changer de type dans un layout existant est fastidieux.
- Vérifiez toujours la nullité après `FindAnyWidget()` et `Cast()`. Les noms de widgets manquants retournent silencieusement `null` et provoquent des plantages lors de l'appel de méthode suivant.
- Utilisez `WrapSpacerWidget` pour les listes dynamiques et `GridSpacerWidget` pour les grilles fixes. Ne positionnez pas manuellement les enfants dans un layout en flux.
- Évitez `CanvasWidget` pour l'interface de production -- il se redessine à chaque frame et n'a pas de regroupement. Utilisez-le uniquement pour les superpositions de débogage.

---

## Théorie vs pratique

| Concept | Théorie | Réalité |
|---------|--------|---------|
| `ScrollWidget` défile automatiquement vers le contenu | La barre de défilement apparaît quand le contenu dépasse les limites | Vous devez appeler `VScrollToPos()` manuellement pour défiler vers le nouveau contenu ; le widget ne défile pas automatiquement lors de l'ajout d'enfants |
| `SliderWidget` déclenche des événements continus | `OnChange` se déclenche à chaque pixel du glissement | Le paramètre `finished` est `false` pendant le glissement et `true` au relâchement ; ne mettez à jour la logique lourde que lorsque `finished == true` |
| `XComboBoxWidget` prend en charge beaucoup d'éléments | Le menu déroulant fonctionne avec n'importe quel nombre | Les performances se dégradent notablement avec 100+ éléments ; utilisez `TextListboxWidget` pour les longues listes à la place |
| `ItemPreviewWidget` affiche n'importe quel objet | Passez n'importe quel classname pour un aperçu 3D | Le widget nécessite que le modèle `.p3d` de l'objet soit chargé ; les objets moddés ont besoin que leur PBO de données soit présent |
| `MapWidget` est un simple affichage | Affiche simplement la carte | Il intercepte toutes les entrées de la souris par défaut ; vous devez gérer soigneusement les drapeaux `IGNOREPOINTER` ou il bloque les clics sur les widgets superposés |

---

## Compatibilité et impact

- **Multi-Mod :** Les TypeID des widgets sont des constantes du moteur partagées entre tous les mods. Deux mods créant des widgets avec le même nom sous le même parent entreront en collision. Utilisez des noms de widgets uniques avec le préfixe de votre mod.
- **Performance :** `TextListboxWidget` et `ScrollWidget` avec des centaines d'enfants provoquent des baisses de framerate. Regroupez et recyclez les widgets pour les listes dépassant 50 éléments.
