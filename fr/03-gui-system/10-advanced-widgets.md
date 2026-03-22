# Chapitre 3.10 : Widgets avancés

[Accueil](../README.md) | [<< Précédent : Patrons d'interface des vrais mods](09-real-mod-patterns.md) | **Widgets avancés**

---

Au-delà des conteneurs standard, des widgets texte et image couverts dans les chapitres précédents, DayZ fournit des types de widgets spécialisés pour le formatage de texte riche, le dessin 2D sur canvas, l'affichage de carte, les prévisualisations 3D d'items, la lecture vidéo et le rendu vers texture. Ces widgets débloquent des capacités que les layouts simples ne peuvent pas atteindre.

Ce chapitre couvre chaque type de widget avancé avec des signatures d'API confirmées extraites du code source vanilla et de l'utilisation réelle dans les mods.

---

## Formatage RichTextWidget

`RichTextWidget` étend `TextWidget` et supporte des balises de markup en ligne dans son contenu texte. C'est le principal moyen d'afficher du texte formaté avec des images intégrées, des tailles de police variables et des sauts de ligne.

### Définition de classe

```
// From scripts/1_core/proto/enwidgets.c
class RichTextWidget extends TextWidget
{
    proto native float GetContentHeight();
    proto native float GetContentOffset();
    proto native void  SetContentOffset(float offset, bool snapToLine = false);
    proto native void  ElideText(int line, float maxWidth, string str);
    proto native int   GetNumLines();
    proto native void  SetLinesVisibility(int lineFrom, int lineTo, bool visible);
    proto native float GetLineWidth(int line);
    proto native float SetLineBreakingOverride(int mode);
};
```

`RichTextWidget` hérite de toutes les méthodes de `TextWidget` -- `SetText()`, `SetTextExactSize()`, `SetOutline()`, `SetShadow()`, `SetTextFormat()`, et le reste. La différence clé est que `SetText()` sur un `RichTextWidget` parse les balises de markup en ligne.

### Balises en ligne supportées

Ces balises sont confirmées par l'utilisation vanilla DayZ dans `news_feed.txt`, `InputUtils.c`, et plusieurs scripts de menus.

#### Image en ligne

```
<image set="IMAGESET_NAME" name="IMAGE_NAME" />
<image set="IMAGESET_NAME" name="IMAGE_NAME" scale="1.5" />
```

Intègre une image depuis un jeu d'images nommé directement dans le flux du texte. L'attribut `scale` contrôle la taille de l'image relative à la hauteur de ligne du texte.

Exemple vanilla depuis `scripts/data/news_feed.txt` :
```
<image set="dayz_gui" name="icon_pin" />  Welcome to DayZ!
```

Exemple vanilla depuis `scripts/3_game/tools/inpututils.c` -- construction d'icônes de boutons de manette :
```c
string icon = string.Format(
    "<image set=\"%1\" name=\"%2\" scale=\"%3\" />",
    imageSetName,
    iconName,
    1.21
);
richTextWidget.SetText(icon + " Press to confirm");
```

Jeux d'images courants dans DayZ vanilla :
- `dayz_gui` -- icônes UI générales (pin, notifications)
- `dayz_inventory` -- icônes de slots d'inventaire (shoulderleft, hands, vest, etc.)
- `xbox_buttons` -- images des boutons de manette Xbox (A, B, X, Y)
- `playstation_buttons` -- images des boutons de manette PlayStation

#### Saut de ligne

```
</br>
```

Force un saut de ligne dans le contenu du texte riche. Notez la syntaxe de balise fermante -- c'est ainsi que le parser de DayZ l'attend.

#### Taille de police / Titre

```
<h scale="0.8">Contenu texte ici</h>
<h scale="0.6">Contenu texte plus petit</h>
```

Encapsule le texte dans un bloc titre avec un multiplicateur d'échelle. L'attribut `scale` est un float qui contrôle la taille de la police relative à la police de base du widget. Des valeurs plus grandes produisent un texte plus gros.

Exemple vanilla depuis `scripts/data/news_feed.txt` :
```
<h scale="0.8">
<image set="dayz_gui" name="icon_pin" />  Section Title
</h>
<h scale="0.6">
Body text at smaller size goes here.
</h>
</br>
```

### Patrons d'utilisation pratiques

#### Obtenir une référence RichTextWidget

Dans les scripts, castez depuis le layout exactement comme tout autre widget :

```c
RichTextWidget m_Label;
m_Label = RichTextWidget.Cast(root.FindAnyWidget("MyRichLabel"));
```

Dans les fichiers `.layout`, utilisez le nom de classe du layout :

```
RichTextWidgetClass MyRichLabel {
    position 0 0
    size 1 0.1
    text ""
}
```

#### Définir du contenu riche avec des icônes de manette

La classe vanilla `InputUtils` fournit un helper qui génère la chaîne de balise `<image>` pour n'importe quelle action de saisie :

```c
// From scripts/3_game/tools/inpututils.c
string buttonIcon = InputUtils.GetRichtextButtonIconFromInputAction(
    "UAUISelect",              // nom de l'action de saisie
    "#menu_select",            // libellé localisé
    EUAINPUT_DEVICE_CONTROLLER,
    InputUtils.ICON_SCALE_TOOLBAR  // échelle 1.81
);
// Résultat : '<image set="xbox_buttons" name="A" scale="1.81" /> Select'

RichTextWidget toolbar = RichTextWidget.Cast(
    layoutRoot.FindAnyWidget("ToolbarText")
);
toolbar.SetText(buttonIcon);
```

Les deux constantes d'échelle prédéfinies :
- `InputUtils.ICON_SCALE_NORMAL` = 1.21
- `InputUtils.ICON_SCALE_TOOLBAR` = 1.81

#### Contenu de texte riche défilant

`RichTextWidget` expose des méthodes de hauteur de contenu et d'offset pour la pagination ou le défilement :

```c
// From scripts/5_mission/gui/bookmenu.c
HtmlWidget m_content;  // HtmlWidget étend RichTextWidget
m_content.LoadFile(book.ConfigGetString("file"));

float totalHeight = m_content.GetContentHeight();
// Naviguer dans le contenu :
m_content.SetContentOffset(pageOffset, true);  // snapToLine = true
```

#### Élision de texte

Quand le texte déborde d'une zone de largeur fixe, vous pouvez élider (tronquer avec un indicateur) :

```c
// Tronquer la ligne 0 à maxWidth pixels, en ajoutant "..."
richText.ElideText(0, maxWidth, "...");
```

#### Contrôle de visibilité des lignes

Afficher ou masquer des plages de lignes spécifiques dans le contenu :

```c
int lineCount = richText.GetNumLines();
// Masquer toutes les lignes après la 5ème
richText.SetLinesVisibility(5, lineCount - 1, false);
// Obtenir la largeur en pixels d'une ligne spécifique
float width = richText.GetLineWidth(2);
```

### HtmlWidget -- RichTextWidget étendu

`HtmlWidget` étend `RichTextWidget` avec une seule méthode supplémentaire :

```
class HtmlWidget extends RichTextWidget
{
    proto native void LoadFile(string path);
};
```

Utilisé par le système de livres vanilla pour charger des fichiers texte `.html` :

```c
// From scripts/5_mission/gui/bookmenu.c
HtmlWidget content;
Class.CastTo(content, layoutRoot.FindAnyWidget("HtmlWidget"));
content.LoadFile(book.ConfigGetString("file"));
```

### RichTextWidget vs TextWidget -- différences clés

| Fonctionnalité | TextWidget | RichTextWidget |
|---------------|-----------|---------------|
| Balises `<image>` en ligne | Non | Oui |
| Balises de titre `<h>` | Non | Oui |
| Sauts de ligne `</br>` | Non (utiliser `\n`) | Oui |
| Défilement du contenu | Non | Oui (via offset) |
| Visibilité des lignes | Non | Oui |
| Élision de texte | Non | Oui |
| Performance | Plus rapide | Plus lent (parsing des balises) |

Utilisez `TextWidget` pour les libellés simples. Utilisez `RichTextWidget` uniquement quand vous avez besoin d'images en ligne, de titres formatés ou de défilement de contenu.

---

## Dessin avec CanvasWidget

`CanvasWidget` fournit du dessin 2D en mode immédiat à l'écran. Il possède exactement deux méthodes natives :

```
// From scripts/1_core/proto/enwidgets.c
class CanvasWidget extends Widget
{
    proto native void DrawLine(float x1, float y1, float x2, float y2,
                               float width, int color);
    proto native void Clear();
};
```

C'est l'intégralité de l'API. Toutes les formes complexes -- rectangles, cercles, grilles -- doivent être construites à partir de segments de ligne.

### Système de coordonnées

`CanvasWidget` utilise des **coordonnées en pixels dans l'espace écran** relatives aux propres limites du widget canvas. L'origine `(0, 0)` est le coin supérieur gauche du widget canvas.

Si le canvas remplit l'écran entier (position 0,0 taille 1,1 en mode relatif), alors les coordonnées correspondent directement aux pixels de l'écran après conversion depuis la taille interne du widget.

### Configuration du layout

Dans un fichier `.layout` :

```
CanvasWidgetClass MyCanvas {
    ignorepointer 1
    position 0 0
    size 1 1
    hexactpos 1
    vexactpos 1
    hexactsize 0
    vexactsize 0
}
```

Flags clés :
- `ignorepointer 1` -- le canvas ne bloque pas les entrées souris vers les widgets en dessous
- La taille `1 1` en mode relatif signifie « remplir le parent »

En script :

```c
CanvasWidget m_Canvas;
m_Canvas = CanvasWidget.Cast(
    root.FindAnyWidget("MyCanvas")
);
```

Ou créer depuis un fichier layout :

```c
// From COT: JM/COT/GUI/layouts/esp_canvas.layout
m_Canvas = CanvasWidget.Cast(
    g_Game.GetWorkspace().CreateWidgets("path/to/canvas.layout")
);
```

### Primitives de dessin

#### Lignes

```c
// Dessiner une ligne horizontale rouge
m_Canvas.DrawLine(10, 50, 200, 50, 2, ARGB(255, 255, 0, 0));

// Dessiner une ligne diagonale blanche, 3 pixels de large
m_Canvas.DrawLine(0, 0, 100, 100, 3, COLOR_WHITE);
```

Le paramètre `color` utilise le format ARGB : `ARGB(alpha, rouge, vert, bleu)`.

#### Rectangles (à partir de lignes)

```c
void DrawRectangle(CanvasWidget canvas, float x, float y,
                   float w, float h, float lineWidth, int color)
{
    canvas.DrawLine(x, y, x + w, y, lineWidth, color);         // haut
    canvas.DrawLine(x + w, y, x + w, y + h, lineWidth, color); // droite
    canvas.DrawLine(x + w, y + h, x, y + h, lineWidth, color); // bas
    canvas.DrawLine(x, y + h, x, y, lineWidth, color);         // gauche
}
```

#### Cercles (à partir de segments de ligne)

COT implémente ce patron dans `JMESPCanvas` :

```c
// From DayZ-CommunityOnlineTools/.../JMESPModule.c
void DrawCircle(float cx, float cy, float radius,
                int lineWidth, int color, int segments)
{
    float segAngle = 360.0 / segments;
    int i;
    for (i = 0; i < segments; i++)
    {
        float a1 = i * segAngle * Math.DEG2RAD;
        float a2 = (i + 1) * segAngle * Math.DEG2RAD;

        float x1 = cx + radius * Math.Cos(a1);
        float y1 = cy + radius * Math.Sin(a1);
        float x2 = cx + radius * Math.Cos(a2);
        float y2 = cy + radius * Math.Sin(a2);

        m_Canvas.DrawLine(x1, y1, x2, y2, lineWidth, color);
    }
}
```

Plus de segments produisent un cercle plus lisse. 36 segments est une valeur par défaut courante.

### Patron de redessin par frame

`CanvasWidget` est en mode immédiat : vous devez appeler `Clear()` et redessiner à chaque frame. Cela se fait typiquement dans un callback `Update()` ou `OnUpdate()`.

Exemple vanilla depuis `scripts/5_mission/gui/mapmenu.c` :

```c
override void Update(float timeslice)
{
    super.Update(timeslice);
    m_ToolsScaleCellSizeCanvas.Clear();  // effacer la frame précédente

    // ... dessiner les segments de la règle d'échelle ...
    RenderScaleRuler();
}

protected void RenderScaleRuler()
{
    float sizeYShift = 8;
    float segLen = m_ToolScaleCellSizeCanvasWidth / SCALE_RULER_NUM_SEGMENTS;
    int lineColor;

    int i;
    for (i = 1; i <= SCALE_RULER_NUM_SEGMENTS; i++)
    {
        lineColor = FadeColors.BLACK;
        if (i % 2 == 0)
            lineColor = FadeColors.LIGHT_GREY;

        float startX = segLen * (i - 1);
        float endX = segLen * i;
        m_ToolsScaleCellSizeCanvas.DrawLine(
            startX, sizeYShift, endX, sizeYShift,
            SCALE_RULER_LINE_WIDTH, lineColor
        );
    }
}
```

### Patron de superposition ESP (de COT)

COT (Community Online Tools) utilise `CanvasWidget` comme une superposition plein écran pour dessiner des filaires de squelettes sur les joueurs et les objets. C'est l'un des patrons d'utilisation de canvas les plus sophistiqués de tous les mods DayZ.

**Architecture :**

1. Un `CanvasWidget` plein écran est créé depuis un fichier layout
2. À chaque frame, `Clear()` est appelé
3. Les positions en espace monde sont converties en coordonnées écran
4. Des lignes sont dessinées entre les positions des os pour rendre les squelettes

**Conversion monde-vers-écran** (depuis le `JMESPCanvas` de COT) :

```c
// From DayZ-CommunityOnlineTools/.../JMESPModule.c
vector TransformToScreenPos(vector worldPos, out bool isInBounds)
{
    float parentW, parentH;
    vector screenPos;

    // Obtenir la position écran relative (plage 0..1)
    screenPos = g_Game.GetScreenPosRelative(worldPos);

    // Vérifier si la position est visible à l'écran
    isInBounds = screenPos[0] >= 0 && screenPos[0] <= 1
              && screenPos[1] >= 0 && screenPos[1] <= 1
              && screenPos[2] >= 0;

    // Convertir en coordonnées pixels du canvas
    m_Canvas.GetScreenSize(parentW, parentH);
    screenPos[0] = screenPos[0] * parentW;
    screenPos[1] = screenPos[1] * parentH;

    return screenPos;
}
```

**Dessiner une ligne de la position monde A à la position monde B :**

```c
void DrawWorldLine(vector from, vector to, int width, int color)
{
    bool inBoundsFrom, inBoundsTo;
    from = TransformToScreenPos(from, inBoundsFrom);
    to = TransformToScreenPos(to, inBoundsTo);

    if (!inBoundsFrom || !inBoundsTo)
        return;

    m_Canvas.DrawLine(from[0], from[1], to[0], to[1], width, color);
}
```

**Dessiner un squelette de joueur :**

```c
// Simplifié depuis JMESPSkeleton.Draw() de COT
static void DrawSkeleton(Human human, CanvasWidget canvas)
{
    // Définir les connexions de membres (paires d'os)
    // cou->spine3, spine3->bassin, cou->brasgauche, etc.

    int color = COLOR_WHITE;
    switch (human.GetHealthLevel())
    {
        case GameConstants.STATE_DAMAGED:
            color = 0xFFDCDC00;  // jaune
            break;
        case GameConstants.STATE_BADLY_DAMAGED:
            color = 0xFFDC0000;  // rouge
            break;
    }

    // Dessiner chaque membre comme une ligne entre deux positions d'os
    vector bone1Pos = human.GetBonePositionWS(
        human.GetBoneIndexByName("neck")
    );
    vector bone2Pos = human.GetBonePositionWS(
        human.GetBoneIndexByName("spine3")
    );
    // ... convertir en coordonnées écran, puis DrawLine ...
}
```

### Canvas de débogage vanilla

Le moteur fournit un canvas de débogage intégré via la classe `Debug` :

```c
// From scripts/3_game/tools/debug.c
static void InitCanvas()
{
    if (!m_DebugLayoutCanvas)
    {
        m_DebugLayoutCanvas = g_Game.GetWorkspace().CreateWidgets(
            "gui/layouts/debug/day_z_debugcanvas.layout"
        );
        m_CanvasDebug = CanvasWidget.Cast(
            m_DebugLayoutCanvas.FindAnyWidget("CanvasWidget")
        );
    }
}

static void CanvasDrawLine(float x1, float y1, float x2, float y2,
                           float width, int color)
{
    InitCanvas();
    m_CanvasDebug.DrawLine(x1, y1, x2, y2, width, color);
}

static void CanvasDrawPoint(float x1, float y1, int color)
{
    CanvasDrawLine(x1, y1, x1 + 1, y1, 1, color);
}

static void ClearCanvas()
{
    if (m_CanvasDebug)
        m_CanvasDebug.Clear();
}
```

### Considérations de performance

- **Effacer et redessiner à chaque frame.** `CanvasWidget` ne conserve pas l'état entre les frames dans la plupart des cas d'utilisation où la vue change (mouvement de caméra, etc.). Appelez `Clear()` au début de chaque mise à jour.
- **Minimiser le nombre de lignes.** Chaque appel `DrawLine()` a un surcoût. Pour les formes complexes comme les cercles, utilisez moins de segments (12-18) pour les objets distants, plus (36) pour les proches.
- **Vérifier les limites d'écran d'abord.** Convertissez les positions monde en coordonnées écran et ignorez les objets hors écran ou derrière la caméra (`screenPos[2] < 0`).
- **Utilisez `ignorepointer 1`.** Toujours définir ce flag sur les superpositions canvas pour qu'elles n'interceptent pas les événements souris.
- **Un seul canvas suffit.** Utilisez un seul canvas plein écran pour tout le dessin de superposition plutôt que de créer plusieurs widgets canvas.

---

## MapWidget

`MapWidget` affiche la carte de terrain DayZ et fournit des méthodes pour placer des marqueurs, convertir des coordonnées et contrôler le zoom.

### Définition de classe

```
// From scripts/3_game/gameplay.c
class MapWidget: Widget
{
    proto native void    ClearUserMarks();
    proto native void    AddUserMark(vector pos, string text,
                                     int color, string texturePath);
    proto native vector  GetMapPos();
    proto native void    SetMapPos(vector worldPos);
    proto native float   GetScale();
    proto native void    SetScale(float scale);
    proto native float   GetContourInterval();
    proto native float   GetCellSize(float legendWidth);
    proto native vector  MapToScreen(vector worldPos);
    proto native vector  ScreenToMap(vector screenPos);
};
```

### Obtenir le widget de carte

Dans un fichier `.layout`, placez la carte en utilisant le type `MapWidgetClass`. En script, obtenez la référence par cast :

```c
MapWidget m_Map;
m_Map = MapWidget.Cast(layoutRoot.FindAnyWidget("Map"));
```

### Coordonnées de carte vs coordonnées monde

DayZ utilise deux espaces de coordonnées :

- **Coordonnées monde** : vecteurs 3D en mètres. `x` = est/ouest, `y` = altitude, `z` = nord/sud. Chernarus s'étend approximativement de 0 à 15360 sur les axes x et z.
- **Coordonnées écran** : positions en pixels sur le widget de carte. Elles changent quand l'utilisateur déplace et zoome.

Le `MapWidget` fournit la conversion entre les deux :

```c
// Position monde vers pixel d'écran sur la carte
vector screenPos = m_Map.MapToScreen(worldPosition);

// Pixel d'écran sur la carte vers position monde
vector worldPos = m_Map.ScreenToMap(Vector(screenX, screenY, 0));
```

### Ajouter des marqueurs

`AddUserMark()` place un marqueur à une position monde avec un libellé, une couleur et une icône de texture :

```c
m_Map.AddUserMark(
    playerPos,                                   // vector : position monde
    "You",                                       // string : texte du libellé
    COLOR_RED,                                   // int : couleur ARGB
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"  // string : texture de l'icône
);
```

Exemple vanilla depuis `scripts/5_mission/gui/scriptconsolegeneraltab.c` :

```c
// Marquer la position du joueur
m_DebugMapWidget.AddUserMark(
    playerPos, "You", COLOR_RED,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);

// Marquer les autres joueurs
m_DebugMapWidget.AddUserMark(
    rpd.m_Pos, rpd.m_Name + " " + dist + "m", COLOR_BLUE,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);

// Marquer la position de la caméra
m_DebugMapWidget.AddUserMark(
    cameraPos, "Camera", COLOR_GREEN,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);
```

Autre exemple vanilla depuis `scripts/5_mission/gui/mapmenu.c` (commenté mais montrant l'API) :

```c
m.AddUserMark("2681 4.7 1751", "Label1", ARGB(255,255,0,0),
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa");
m.AddUserMark("2683 4.7 1851", "Label2", ARGB(255,0,255,0),
    "\\dz\\gear\\navigation\\data\\map_bunker_ca.paa");
m.AddUserMark("2670 4.7 1651", "Label3", ARGB(255,0,0,255),
    "\\dz\\gear\\navigation\\data\\map_busstop_ca.paa");
```

### Effacer les marqueurs

`ClearUserMarks()` supprime tous les marqueurs placés par l'utilisateur d'un coup. Il n'y a pas de méthode pour supprimer un seul marqueur par référence. Le patron standard est d'effacer tous les marqueurs et de ré-ajouter ceux que vous voulez à chaque frame.

```c
// From scripts/5_mission/gui/scriptconsolesoundstab.c
override void Update(float timeslice)
{
    m_DebugMapWidget.ClearUserMarks();
    // Ré-ajouter tous les marqueurs actuels
    m_DebugMapWidget.AddUserMark(playerPos, "You", COLOR_RED, iconPath);
}
```

### Icônes de marqueurs de carte disponibles

Le jeu vanilla enregistre ces textures d'icônes de marqueurs dans `scripts/5_mission/gui/mapmarkersinfo.c` :

| Constante d'enum | Chemin de texture |
|---|---|
| `MARKERTYPE_MAP_BORDER_CROSS` | `\dz\gear\navigation\data\map_border_cross_ca.paa` |
| `MARKERTYPE_MAP_BROADLEAF` | `\dz\gear\navigation\data\map_broadleaf_ca.paa` |
| `MARKERTYPE_MAP_CAMP` | `\dz\gear\navigation\data\map_camp_ca.paa` |
| `MARKERTYPE_MAP_FACTORY` | `\dz\gear\navigation\data\map_factory_ca.paa` |
| `MARKERTYPE_MAP_FIR` | `\dz\gear\navigation\data\map_fir_ca.paa` |
| `MARKERTYPE_MAP_FIREDEP` | `\dz\gear\navigation\data\map_firedep_ca.paa` |
| `MARKERTYPE_MAP_GOVOFFICE` | `\dz\gear\navigation\data\map_govoffice_ca.paa` |
| `MARKERTYPE_MAP_HILL` | `\dz\gear\navigation\data\map_hill_ca.paa` |
| `MARKERTYPE_MAP_MONUMENT` | `\dz\gear\navigation\data\map_monument_ca.paa` |
| `MARKERTYPE_MAP_POLICE` | `\dz\gear\navigation\data\map_police_ca.paa` |
| `MARKERTYPE_MAP_STATION` | `\dz\gear\navigation\data\map_station_ca.paa` |
| `MARKERTYPE_MAP_STORE` | `\dz\gear\navigation\data\map_store_ca.paa` |
| `MARKERTYPE_MAP_TOURISM` | `\dz\gear\navigation\data\map_tourism_ca.paa` |
| `MARKERTYPE_MAP_TRANSMITTER` | `\dz\gear\navigation\data\map_transmitter_ca.paa` |
| `MARKERTYPE_MAP_TREE` | `\dz\gear\navigation\data\map_tree_ca.paa` |
| `MARKERTYPE_MAP_VIEWPOINT` | `\dz\gear\navigation\data\map_viewpoint_ca.paa` |
| `MARKERTYPE_MAP_WATERPUMP` | `\dz\gear\navigation\data\map_waterpump_ca.paa` |

Accédez-y par enum via `MapMarkerTypes.GetMarkerTypeFromID(eMapMarkerTypes.MARKERTYPE_MAP_CAMP)`.

### Contrôle du zoom et du déplacement

```c
// Centrer la carte sur une position monde
m_Map.SetMapPos(playerWorldPos);

// Obtenir/définir le niveau de zoom (0.0 = entièrement dézoomé, 1.0 = entièrement zoomé)
float currentScale = m_Map.GetScale();
m_Map.SetScale(0.33);  // niveau de zoom modéré

// Obtenir les infos de la carte
float contourInterval = m_Map.GetContourInterval();  // mètres entre les courbes de niveau
float cellSize = m_Map.GetCellSize(legendWidth);      // taille de cellule pour la règle d'échelle
```

### Gestion des clics sur la carte

Gérez les clics souris sur la carte via les callbacks `OnDoubleClick` ou `OnMouseButtonDown` sur un `ScriptedWidgetEventHandler` ou `UIScriptedMenu`. Convertissez la position du clic en coordonnées monde en utilisant `ScreenToMap()`.

Exemple vanilla depuis `scripts/5_mission/gui/scriptconsolegeneraltab.c` :

```c
override bool OnDoubleClick(Widget w, int x, int y, int button)
{
    super.OnDoubleClick(w, x, y, button);

    if (w == m_DebugMapWidget)
    {
        // Convertir le clic écran en coordonnées monde
        vector worldPos = m_DebugMapWidget.ScreenToMap(Vector(x, y, 0));

        // Obtenir la hauteur du terrain à cette position
        float surfaceY = g_Game.SurfaceY(worldPos[0], worldPos[2]);
        float roadY = g_Game.SurfaceRoadY(worldPos[0], worldPos[2]);
        worldPos[1] = Math.Max(surfaceY, roadY);

        // Utiliser la position monde (ex. téléporter le joueur)
    }
    return false;
}
```

Depuis `scripts/5_mission/gui/maphandler.c` :

```c
class MapHandler : ScriptedWidgetEventHandler
{
    override bool OnDoubleClick(Widget w, int x, int y, int button)
    {
        vector worldPos = MapWidget.Cast(w).ScreenToMap(Vector(x, y, 0));
        // Placer un marqueur, téléporter, etc.
        return true;
    }
}
```

### Système de marqueurs de carte Expansion

Le mod Expansion construit un système de marqueurs complet par-dessus le `MapWidget` vanilla. Patrons clés :

- Maintient des dictionnaires séparés pour les marqueurs personnels, serveur, groupe et joueur
- Limite les mises à jour de marqueurs par frame (`m_MaxMarkerUpdatesPerFrame = 3`) pour la performance
- Dessine des lignes de règle d'échelle en utilisant un `CanvasWidget` à côté de la carte
- Utilise des superpositions de widgets de marqueurs personnalisés positionnés via `MapToScreen()` pour des visuels de marqueurs plus riches que ce que `AddUserMark()` supporte

Cette approche démontre que pour des interfaces de marqueurs complexes (icônes avec infobulles, libellés éditables, catégories colorées), vous devriez superposer des widgets personnalisés positionnés via `MapToScreen()` plutôt que de vous reposer uniquement sur `AddUserMark()`.

---

## ItemPreviewWidget

`ItemPreviewWidget` rend une prévisualisation 3D de n'importe quel `EntityAI` (item, arme, véhicule) dans un panneau UI.

### Définition de classe

```
// From scripts/3_game/gameplay.c
class ItemPreviewWidget: Widget
{
    proto native void    SetItem(EntityAI object);
    proto native EntityAI GetItem();
    proto native int     GetView();
    proto native void    SetView(int viewIndex);
    proto native void    SetModelOrientation(vector vOrientation);
    proto native vector  GetModelOrientation();
    proto native void    SetModelPosition(vector vPos);
    proto native vector  GetModelPosition();
    proto native void    SetForceFlipEnable(bool enable);
    proto native void    SetForceFlip(bool value);
};
```

### Indices de vue

Le paramètre `viewIndex` sélectionne quelle boîte englobante et quel angle de caméra utiliser. Ceux-ci sont définis par item dans la config de l'item :

- Vue 0 : par défaut (`boundingbox_min` + `boundingbox_max` + `invView`)
- Vue 1 : alternative (`boundingbox_min2` + `boundingbox_max2` + `invView2`)
- Vue 2+ : vues additionnelles si définies

Utilisez `item.GetViewIndex()` pour obtenir la vue préférée de l'item.

### Patron d'utilisation -- inspection d'item

Depuis `scripts/5_mission/gui/inspectmenunew.c` :

```c
class InspectMenuNew extends UIScriptedMenu
{
    private ItemPreviewWidget m_item_widget;
    private vector m_characterOrientation;

    void SetItem(EntityAI item)
    {
        if (!m_item_widget)
        {
            Widget preview_frame = layoutRoot.FindAnyWidget("ItemFrameWidget");
            m_item_widget = ItemPreviewWidget.Cast(preview_frame);
        }

        m_item_widget.SetItem(item);
        m_item_widget.SetView(item.GetViewIndex());
        m_item_widget.SetModelPosition(Vector(0, 0, 1));
    }
}
```

### Contrôle de rotation (glisser souris)

Le patron standard pour la rotation interactive :

```c
private int m_RotationX;
private int m_RotationY;
private vector m_Orientation;

override bool OnMouseButtonDown(Widget w, int x, int y, int button)
{
    if (w == m_item_widget)
    {
        GetMousePos(m_RotationX, m_RotationY);
        g_Game.GetDragQueue().Call(this, "UpdateRotation");
        return true;
    }
    return false;
}

void UpdateRotation(int mouse_x, int mouse_y, bool is_dragging)
{
    vector o = m_Orientation;
    o[0] = o[0] + (m_RotationY - mouse_y);  // tangage
    o[1] = o[1] - (m_RotationX - mouse_x);  // lacet
    m_item_widget.SetModelOrientation(o);

    if (!is_dragging)
        m_Orientation = o;
}
```

### Contrôle du zoom (molette souris)

```c
override bool OnMouseWheel(Widget w, int x, int y, int wheel)
{
    if (w == m_item_widget)
    {
        float widgetW, widgetH;
        m_item_widget.GetSize(widgetW, widgetH);

        widgetW = widgetW + (wheel / 4.0);
        widgetH = widgetH + (wheel / 4.0);

        if (widgetW > 0.5 && widgetW < 3.0)
            m_item_widget.SetSize(widgetW, widgetH);
    }
    return false;
}
```

---

## PlayerPreviewWidget

`PlayerPreviewWidget` rend un modèle 3D complet de personnage joueur dans l'interface, avec les items équipés et les animations.

### Définition de classe

```
// From scripts/3_game/gameplay.c
class PlayerPreviewWidget: Widget
{
    proto native void       UpdateItemInHands(EntityAI object);
    proto native void       SetPlayer(DayZPlayer player);
    proto native DayZPlayer GetDummyPlayer();
    proto native void       Refresh();
    proto native void       SetModelOrientation(vector vOrientation);
    proto native vector     GetModelOrientation();
    proto native void       SetModelPosition(vector vPos);
    proto native vector     GetModelPosition();
};
```

### Patron d'utilisation -- prévisualisation du personnage dans l'inventaire

Depuis `scripts/5_mission/gui/inventorynew/playerpreview.c` :

```c
class PlayerPreview: LayoutHolder
{
    protected ref PlayerPreviewWidget m_CharacterPanelWidget;
    protected vector m_CharacterOrientation;
    protected int m_CharacterScaleDelta;

    void PlayerPreview(LayoutHolder parent)
    {
        m_CharacterPanelWidget = PlayerPreviewWidget.Cast(
            m_Parent.GetMainWidget().FindAnyWidget("CharacterPanelWidget")
        );

        m_CharacterPanelWidget.SetPlayer(g_Game.GetPlayer());
        m_CharacterPanelWidget.SetModelPosition("0 0 0.605");
        m_CharacterPanelWidget.SetSize(1.34, 1.34);
    }

    void RefreshPlayerPreview()
    {
        m_CharacterPanelWidget.Refresh();
    }
}
```

### Garder l'équipement à jour

La méthode `UpdateInterval()` maintient la prévisualisation synchronisée avec l'équipement réel du joueur :

```c
override void UpdateInterval()
{
    // Mettre à jour l'item tenu
    m_CharacterPanelWidget.UpdateItemInHands(
        g_Game.GetPlayer().GetEntityInHands()
    );

    // Accéder au joueur factice pour la synchronisation des animations
    DayZPlayer dummyPlayer = m_CharacterPanelWidget.GetDummyPlayer();
    if (dummyPlayer)
    {
        HumanCommandAdditives hca = dummyPlayer.GetCommandModifier_Additives();
        PlayerBase realPlayer = PlayerBase.Cast(g_Game.GetPlayer());
        if (hca && realPlayer.m_InjuryHandler)
        {
            hca.SetInjured(
                realPlayer.m_InjuryHandler.GetInjuryAnimValue(),
                realPlayer.m_InjuryHandler.IsInjuryAnimEnabled()
            );
        }
    }
}
```

### Rotation et zoom

Les patrons de rotation et de zoom sont identiques à ceux de `ItemPreviewWidget` -- utilisez `SetModelOrientation()` avec le glisser souris, et `SetSize()` avec la molette souris. Voir la section précédente pour le code complet.

---

## VideoWidget

`VideoWidget` lit des fichiers vidéo dans l'interface. Il supporte le contrôle de lecture, la boucle, la recherche, les requêtes d'état, les sous-titres et les callbacks d'événements.

### Définition de classe

```
// From scripts/1_core/proto/enwidgets.c
enum VideoState { NONE, PLAYING, PAUSED, STOPPED, FINISHED };

enum VideoCallback
{
    ON_PLAY, ON_PAUSE, ON_STOP, ON_END, ON_LOAD,
    ON_SEEK, ON_BUFFERING_START, ON_BUFFERING_END, ON_ERROR
};

class VideoWidget extends Widget
{
    proto native bool Load(string name, bool looping = false, int startTime = 0);
    proto native void Unload();
    proto native bool Play();
    proto native bool Pause();
    proto native bool Stop();
    proto native bool SetTime(int time, bool preload);
    proto native int  GetTime();
    proto native int  GetTotalTime();
    proto native void SetLooping(bool looping);
    proto native bool IsLooping();
    proto native bool IsPlaying();
    proto native VideoState GetState();
    proto native void DisableSubtitles(bool disable);
    proto native bool IsSubtitlesDisabled();
    proto void SetCallback(VideoCallback cb, func fn);
};
```

### Patron d'utilisation -- vidéo de menu

Depuis `scripts/5_mission/gui/newui/mainmenu/mainmenuvideo.c` :

```c
protected VideoWidget m_Video;

override Widget Init()
{
    layoutRoot = g_Game.GetWorkspace().CreateWidgets(
        "gui/layouts/xbox/video_menu.layout"
    );
    m_Video = VideoWidget.Cast(layoutRoot.FindAnyWidget("video"));

    m_Video.Load("video\\DayZ_onboarding_MASTER.mp4");
    m_Video.Play();

    // Enregistrer un callback pour la fin de la vidéo
    m_Video.SetCallback(VideoCallback.ON_END, StopVideo);

    return layoutRoot;
}

void StopVideo()
{
    // Gérer la fin de la vidéo
    Close();
}
```

### Sous-titres

Les sous-titres nécessitent une police assignée au `VideoWidget` dans le layout. Les fichiers de sous-titres utilisent la convention de nommage `nomVideo_Langue.srt`, la version anglaise étant nommée `nomVideo.srt` (sans suffixe de langue).

```c
// Les sous-titres sont activés par défaut
m_Video.DisableSubtitles(false);  // activer explicitement
```

### Valeurs de retour

Les méthodes `Load()`, `Play()`, `Pause()` et `Stop()` retournent un `bool`, mais cette valeur de retour est **dépréciée**. Utilisez `VideoCallback.ON_ERROR` pour détecter les échecs à la place.

---

## RenderTargetWidget et RTTextureWidget

Ces widgets permettent de rendre une vue 3D du monde dans un widget UI.

### Définitions de classes

```
// From scripts/1_core/proto/enwidgets.c
class RenderTargetWidget extends Widget
{
    proto native void SetRefresh(int period, int offset);
    proto native void SetResolutionScale(float xscale, float yscale);
};

class RTTextureWidget extends Widget
{
    // Pas de méthodes supplémentaires -- sert de cible de texture pour les enfants
};
```

La fonction globale `SetWidgetWorld` lie une cible de rendu à un monde et une caméra :

```
proto native void SetWidgetWorld(
    RenderTargetWidget w,
    IEntity worldEntity,
    int camera
);
```

### RenderTargetWidget

Rend une vue de caméra depuis un `BaseWorld` dans la zone du widget. Utilisé pour les caméras de sécurité, les rétroviseurs ou les affichages image-dans-l'image.

Depuis `scripts/2_gamelib/entities/rendertarget.c` :

```c
// Créer une cible de rendu programmatiquement
RenderTargetWidget m_RenderWidget;

int screenW, screenH;
GetScreenSize(screenW, screenH);
int posX = screenW * x;
int posY = screenH * y;
int width = screenW * w;
int height = screenH * h;

Class.CastTo(m_RenderWidget, g_Game.GetWorkspace().CreateWidget(
    RenderTargetWidgetTypeID,
    posX, posY, width, height,
    WidgetFlags.VISIBLE | WidgetFlags.HEXACTSIZE
    | WidgetFlags.VEXACTSIZE | WidgetFlags.HEXACTPOS
    | WidgetFlags.VEXACTPOS,
    0xffffffff,
    sortOrder
));

// Lier au monde du jeu avec l'index de caméra 0
SetWidgetWorld(m_RenderWidget, g_Game.GetWorldEntity(), 0);
```

**Contrôle du rafraîchissement :**

```c
// Rendre toutes les 2 frames (period=2, offset=0)
m_RenderWidget.SetRefresh(2, 0);

// Rendre à la moitié de la résolution pour la performance
m_RenderWidget.SetResolutionScale(0.5, 0.5);
```

### RTTextureWidget

`RTTextureWidget` n'a pas de méthodes côté script au-delà de celles héritées de `Widget`. Il sert de texture de cible de rendu dans laquelle les widgets enfants peuvent être rendus. Un `ImageWidget` peut référencer un `RTTextureWidget` comme source de texture via `SetImageTexture()` :

```c
ImageWidget imgWidget;
RTTextureWidget rtTexture;
imgWidget.SetImageTexture(0, rtTexture);
```

---

## Bonnes pratiques

1. **Utilisez le bon widget pour le travail.** `TextWidget` pour les libellés simples, `RichTextWidget` uniquement quand vous avez besoin d'images en ligne ou de contenu formaté. `CanvasWidget` pour les superpositions 2D dynamiques, pas pour les graphiques statiques (utilisez `ImageWidget` pour ceux-là).

2. **Effacez le canvas à chaque frame.** Appelez toujours `Clear()` avant de redessiner. Ne pas effacer cause l'accumulation des dessins et crée des artefacts visuels.

3. **Vérifiez les limites d'écran pour le dessin ESP/superposition.** Avant d'appeler `DrawLine()`, vérifiez que les deux extrémités sont à l'écran. Les dessins hors écran sont du travail gaspillé.

4. **Marqueurs de carte : patron effacer-et-reconstruire.** Il n'y a pas de méthode `RemoveUserMark()`. Appelez `ClearUserMarks()` puis ré-ajoutez tous les marqueurs actifs à chaque mise à jour. C'est le patron utilisé par chaque implémentation vanilla et mod.

5. **ItemPreviewWidget a besoin d'un vrai EntityAI.** Vous ne pouvez pas prévisualiser un nom de classe en chaîne -- vous avez besoin d'une référence d'entité apparue. Pour les prévisualisations d'inventaire, utilisez l'item d'inventaire réel.

6. **PlayerPreviewWidget possède un joueur factice.** Le widget crée un `DayZPlayer` factice interne. Accédez-y via `GetDummyPlayer()` pour synchroniser les animations, mais ne le détruisez pas vous-même.

7. **VideoWidget : utilisez les callbacks, pas les valeurs de retour.** Les retours bool de `Load()`, `Play()`, etc. sont dépréciés. Utilisez `SetCallback(VideoCallback.ON_ERROR, handler)`.

8. **Performance de RenderTargetWidget.** Utilisez `SetRefresh()` avec period > 1 pour sauter des frames. Utilisez `SetResolutionScale()` pour réduire la résolution. Ces widgets sont coûteux -- utilisez-les avec parcimonie.

---

## Observé dans les mods réels

| Mod | Widget | Utilisation |
|-----|--------|-------------|
| **COT** | `CanvasWidget` | Superposition ESP plein écran avec dessin de squelettes, projection monde-vers-écran, primitives de cercles et de lignes |
| **COT** | `MapWidget` | Téléportation admin via `ScreenToMap()` au double-clic |
| **Expansion** | `MapWidget` | Système de marqueurs personnalisé avec catégories personnel/serveur/groupe, limitation de mises à jour par frame |
| **Expansion** | `CanvasWidget` | Dessin de règle d'échelle de carte à côté du `MapWidget` |
| **Carte vanilla** | `MapWidget` + `CanvasWidget` | Règle d'échelle rendue avec des segments de ligne noir/gris alternés |
| **Inspection vanilla** | `ItemPreviewWidget` | Inspection 3D d'items avec rotation par glisser et zoom par défilement |
| **Inventaire vanilla** | `PlayerPreviewWidget` | Prévisualisation du personnage avec synchronisation d'équipement et animations de blessure |
| **Astuces vanilla** | `RichTextWidget` | Panneau d'astuces en jeu avec texte de description formaté |
| **Menus vanilla** | `RichTextWidget` | Icônes de boutons de manette via `InputUtils.GetRichtextButtonIconFromInputAction()` |
| **Livres vanilla** | `HtmlWidget` | Chargement et pagination de fichiers texte `.html` |
| **Menu principal vanilla** | `VideoWidget` | Vidéo d'accueil avec callback de fin |
| **Cible de rendu vanilla** | `RenderTargetWidget` | Rendu caméra-vers-widget avec taux de rafraîchissement configurable |

---

## Erreurs courantes

**1. Utiliser RichTextWidget là où TextWidget suffit.**
Le parsing de texte riche a un surcoût. Si vous n'avez besoin que de texte simple, utilisez `TextWidget`.

**2. Oublier de Clear() le canvas.**
```c
// INCORRECT - les dessins s'accumulent, remplissant l'écran
void Update(float dt)
{
    m_Canvas.DrawLine(0, 0, 100, 100, 1, COLOR_RED);
}

// CORRECT
void Update(float dt)
{
    m_Canvas.Clear();
    m_Canvas.DrawLine(0, 0, 100, 100, 1, COLOR_RED);
}
```

**3. Dessiner derrière la caméra.**
```c
// INCORRECT - dessine des lignes vers des objets derrière vous
vector screenPos = g_Game.GetScreenPosRelative(worldPos);
// Pas de vérification des limites !

// CORRECT
vector screenPos = g_Game.GetScreenPosRelative(worldPos);
if (screenPos[2] < 0)
    return;  // derrière la caméra
if (screenPos[0] < 0 || screenPos[0] > 1 || screenPos[1] < 0 || screenPos[1] > 1)
    return;  // hors écran
```

**4. Essayer de supprimer un seul marqueur de carte.**
Il n'y a pas de `RemoveUserMark()`. Vous devez appeler `ClearUserMarks()` et ré-ajouter tous les marqueurs que vous voulez garder.

**5. Définir l'item de ItemPreviewWidget à null sans vérification.**
Protégez toujours contre les références d'entités null avant d'appeler `SetItem()`.

**6. Ne pas définir ignorepointer sur les canvas de superposition.**
Un canvas sans `ignorepointer 1` interceptera tous les événements souris, rendant l'interface en dessous non réactive.

**7. Utiliser des backslashes dans les chemins de textures sans les doubler.**
Dans les chaînes Enforce Script, les backslashes doivent être doublés :
```c
// INCORRECT
"\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
// C'est en fait CORRECT en Enforce Script -- chaque \\ produit un seul \
```

---

## Compatibilité et impact

| Widget | Côté client uniquement | Coût en performance | Compatibilité multi-mods |
|--------|----------------------|--------------------|-----------------------|
| `RichTextWidget` | Oui | Faible (parsing des balises) | Sûr, pas de conflits |
| `CanvasWidget` | Oui | Moyen (par frame) | Sûr si `ignorepointer` défini |
| `MapWidget` | Oui | Faible-Moyen | Plusieurs mods peuvent ajouter des marqueurs |
| `ItemPreviewWidget` | Oui | Moyen (rendu 3D) | Sûr, portée widget |
| `PlayerPreviewWidget` | Oui | Moyen (rendu 3D) | Sûr, crée un joueur factice |
| `VideoWidget` | Oui | Élevé (décodage vidéo) | Une vidéo à la fois |
| `RenderTargetWidget` | Oui | Élevé (rendu 3D) | Conflits de caméra possibles |
| `RTTextureWidget` | Oui | Faible (cible de texture) | Sûr |

Tous ces widgets sont côté client uniquement. Ils n'ont pas de représentation côté serveur et ne peuvent pas être créés ou manipulés depuis des scripts serveur.

---

## Résumé

| Widget | Utilisation principale | Méthodes clés |
|--------|----------------------|---------------|
| `RichTextWidget` | Texte formaté avec images en ligne | `SetText()`, `GetContentHeight()`, `SetContentOffset()` |
| `HtmlWidget` | Chargement de fichiers texte formatés | `LoadFile()` |
| `CanvasWidget` | Superposition de dessin 2D | `DrawLine()`, `Clear()` |
| `MapWidget` | Carte de terrain avec marqueurs | `AddUserMark()`, `ClearUserMarks()`, `ScreenToMap()`, `MapToScreen()` |
| `ItemPreviewWidget` | Affichage 3D d'items | `SetItem()`, `SetView()`, `SetModelOrientation()` |
| `PlayerPreviewWidget` | Affichage 3D du personnage joueur | `SetPlayer()`, `Refresh()`, `UpdateItemInHands()` |
| `VideoWidget` | Lecture vidéo | `Load()`, `Play()`, `Pause()`, `SetCallback()` |
| `RenderTargetWidget` | Vue caméra 3D en temps réel | `SetRefresh()`, `SetResolutionScale()` + `SetWidgetWorld()` |
| `RTTextureWidget` | Cible de rendu vers texture | Sert de source de texture pour `ImageWidget.SetImageTexture()` |

---

*Ce chapitre complète la section du système GUI. Toutes les signatures d'API et les patrons sont confirmés depuis les scripts vanilla DayZ et le code source de vrais mods.*
