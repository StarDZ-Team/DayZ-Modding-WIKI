# Chapitre 3.5 : Création programmatique de widgets

[Accueil](../../README.md) | [<< Précédent : Widgets conteneurs](04-containers.md) | **Création programmatique de widgets** | [Suivant : Gestion des événements >>](06-event-handling.md)

---

Bien que les fichiers `.layout` soient la manière standard de définir la structure de l'interface, vous pouvez également créer et configurer des widgets entièrement depuis le code. C'est utile pour les interfaces dynamiques, les éléments générés procéduralement et les situations où le layout n'est pas connu à la compilation.

---

## Deux approches

DayZ offre deux manières de créer des widgets dans le code :

1. **`CreateWidgets()`** -- Charger un fichier `.layout` et instancier son arborescence de widgets
2. **`CreateWidget()`** -- Créer un widget unique avec des paramètres explicites

Les deux méthodes sont appelées sur le `WorkspaceWidget` obtenu depuis `GetGame().GetWorkspace()`.

---

## CreateWidgets() -- Depuis des fichiers layout

L'approche la plus courante. Charge un fichier `.layout` et crée l'arborescence complète de widgets, en l'attachant à un widget parent.

```c
Widget root = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/gui/layouts/MyPanel.layout",   // Chemin vers le fichier layout
    parentWidget                            // Widget parent (ou null pour la racine)
);
```

Le `Widget` retourné est le widget racine du fichier layout. Vous pouvez ensuite trouver les widgets enfants par nom :

```c
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
title.SetText("Hello World");

ButtonWidget closeBtn = ButtonWidget.Cast(root.FindAnyWidget("CloseButton"));
```

### Création d'instances multiples

Un patron courant consiste à créer plusieurs instances d'un modèle de layout (par exemple, des éléments de liste) :

```c
void PopulateList(WrapSpacerWidget container, array<string> items)
{
    foreach (string item : items)
    {
        Widget row = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/gui/layouts/ListRow.layout", container);

        TextWidget label = TextWidget.Cast(row.FindAnyWidget("Label"));
        label.SetText(item);
    }

    container.Update();  // Forcer le recalcul du layout
}
```

---

## CreateWidget() -- Création programmatique

Crée un widget unique avec un type, une position, une taille, des drapeaux et un parent explicites.

```c
Widget w = GetGame().GetWorkspace().CreateWidget(
    FrameWidgetTypeID,      // Constante de type de widget
    0,                       // Position X
    0,                       // Position Y
    100,                     // Largeur
    100,                     // Hauteur
    WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS,
    -1,                      // Couleur (entier ARGB, -1 = blanc/défaut)
    0,                       // Ordre de tri (priorité)
    parentWidget             // Widget parent
);
```

### Paramètres

| Paramètre | Type | Description |
|---|---|---|
| typeID | int | Constante de type de widget (ex. `FrameWidgetTypeID`, `TextWidgetTypeID`) |
| x | float | Position X (proportionnelle ou pixel selon les drapeaux) |
| y | float | Position Y |
| width | float | Largeur du widget |
| height | float | Hauteur du widget |
| flags | int | OU binaire de constantes `WidgetFlags` |
| color | int | Entier de couleur ARGB (-1 pour défaut/blanc) |
| sort | int | Ordre Z (les valeurs plus élevées s'affichent au-dessus) |
| parent | Widget | Widget parent auquel s'attacher |

### TypeID des widgets

```c
FrameWidgetTypeID
TextWidgetTypeID
MultilineTextWidgetTypeID
RichTextWidgetTypeID
ImageWidgetTypeID
VideoWidgetTypeID
RTTextureWidgetTypeID
RenderTargetWidgetTypeID
ButtonWidgetTypeID
CheckBoxWidgetTypeID
EditBoxWidgetTypeID
PasswordEditBoxWidgetTypeID
MultilineEditBoxWidgetTypeID
SliderWidgetTypeID
SimpleProgressBarWidgetTypeID
ProgressBarWidgetTypeID
TextListboxWidgetTypeID
GridSpacerWidgetTypeID
WrapSpacerWidgetTypeID
ScrollWidgetTypeID
WorkspaceWidgetTypeID
```

---

## WidgetFlags

Les drapeaux contrôlent le comportement des widgets lors de la création programmatique. Combinez-les avec l'opérateur OU binaire (`|`).

| Drapeau | Effet |
|---|---|
| `WidgetFlags.VISIBLE` | Le widget démarre visible |
| `WidgetFlags.IGNOREPOINTER` | Le widget ne reçoit pas les événements de la souris |
| `WidgetFlags.DRAGGABLE` | Le widget peut être glissé |
| `WidgetFlags.EXACTSIZE` | Les valeurs de taille sont en pixels (pas proportionnelles) |
| `WidgetFlags.EXACTPOS` | Les valeurs de position sont en pixels (pas proportionnelles) |
| `WidgetFlags.SOURCEALPHA` | Utiliser le canal alpha source |
| `WidgetFlags.BLEND` | Activer le mélange alpha |
| `WidgetFlags.FLIPU` | Retourner la texture horizontalement |
| `WidgetFlags.FLIPV` | Retourner la texture verticalement |

Combinaisons de drapeaux courantes :

```c
// Visible, taille en pixels, position en pixels, mélange alpha
int FLAGS_EXACT = WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;

// Visible, proportionnel, non interactif
int FLAGS_OVERLAY = WidgetFlags.VISIBLE | WidgetFlags.IGNOREPOINTER | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;
```

Après la création, vous pouvez modifier les drapeaux dynamiquement :

```c
widget.SetFlags(WidgetFlags.VISIBLE);          // Ajouter un drapeau
widget.ClearFlags(WidgetFlags.IGNOREPOINTER);  // Supprimer un drapeau
int flags = widget.GetFlags();                  // Lire les drapeaux actuels
```

---

## Définir les propriétés après la création

Après avoir créé un widget avec `CreateWidget()`, vous devez le configurer. Le widget est retourné en tant que type de base `Widget`, donc vous devez le caster vers le type spécifique.

### Définir le nom

```c
Widget w = GetGame().GetWorkspace().CreateWidget(TextWidgetTypeID, ...);
w.SetName("MyTextWidget");
```

Les noms sont importants pour les recherches avec `FindAnyWidget()` et le débogage.

### Définir le texte

```c
TextWidget tw = TextWidget.Cast(w);
tw.SetText("Hello World");
tw.SetTextExactSize(16);           // Taille de police en pixels
tw.SetOutline(1, ARGB(255, 0, 0, 0));  // Contour noir de 1px
```

### Définir la couleur

Les couleurs dans DayZ utilisent le format ARGB (Alpha, Rouge, Vert, Bleu), empaqueté dans un seul entier de 32 bits :

```c
// Utilisation de la fonction d'aide ARGB (0-255 par canal)
int red    = ARGB(255, 255, 0, 0);       // Rouge opaque
int green  = ARGB(255, 0, 255, 0);       // Vert opaque
int blue   = ARGB(200, 0, 0, 255);       // Bleu semi-transparent
int black  = ARGB(255, 0, 0, 0);         // Noir opaque
int white  = ARGB(255, 255, 255, 255);   // Blanc opaque (identique à -1)

// Utilisation de la version flottante (0.0-1.0 par canal)
int color = ARGBF(1.0, 0.5, 0.25, 0.1);

// Décomposer une couleur en flottants
float a, r, g, b;
InverseARGBF(color, a, r, g, b);

// Appliquer à n'importe quel widget
widget.SetColor(ARGB(255, 100, 150, 200));
widget.SetAlpha(0.5);  // Remplacer uniquement l'alpha
```

Le format hexadécimal `0xAARRGGBB` est également courant :

```c
int color = 0xFF4B77BE;   // A=255, R=75, G=119, B=190
widget.SetColor(color);
```

### Définir un gestionnaire d'événements

```c
widget.SetHandler(myEventHandler);  // Instance de ScriptedWidgetEventHandler
```

### Définir des données utilisateur

Attachez des données arbitraires à un widget pour une récupération ultérieure :

```c
widget.SetUserData(myDataObject);  // Doit hériter de Managed

// Récupérer plus tard :
Managed data;
widget.GetUserData(data);
MyDataClass myData = MyDataClass.Cast(data);
```

---

## Nettoyage des widgets

Les widgets qui ne sont plus nécessaires doivent être correctement nettoyés pour éviter les fuites de mémoire.

### Unlink()

Supprime un widget de son parent et le détruit (ainsi que tous ses enfants) :

```c
widget.Unlink();
```

Après avoir appelé `Unlink()`, la référence au widget devient invalide. Mettez-la à `null` :

```c
widget.Unlink();
widget = null;
```

### Supprimer tous les enfants

Pour vider un widget conteneur de tous ses enfants :

```c
void ClearChildren(Widget parent)
{
    Widget child = parent.GetChildren();
    while (child)
    {
        Widget next = child.GetSibling();
        child.Unlink();
        child = next;
    }
}
```

**Important :** Vous devez appeler `GetSibling()` **avant** d'appeler `Unlink()`, car le détachement invalide la chaîne de frères du widget.

### Vérifications de nullité

Vérifiez toujours la nullité des widgets avant de les utiliser. `FindAnyWidget()` retourne `null` si le widget n'est pas trouvé, et les opérations de cast retournent `null` si le type ne correspond pas :

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MaybeExists"));
if (tw)
{
    tw.SetText("Found it");
}
```

---

## Navigation dans la hiérarchie des widgets

Naviguez dans l'arborescence des widgets depuis le code :

```c
Widget parent = widget.GetParent();           // Widget parent
Widget firstChild = widget.GetChildren();     // Premier enfant
Widget nextSibling = widget.GetSibling();     // Frère suivant
Widget found = widget.FindAnyWidget("Name");  // Recherche récursive par nom

string name = widget.GetName();               // Nom du widget
string typeName = widget.GetTypeName();       // Ex. "TextWidget"
```

Pour itérer tous les enfants :

```c
Widget child = parent.GetChildren();
while (child)
{
    // Traiter l'enfant
    Print("Child: " + child.GetName());

    child = child.GetSibling();
}
```

Pour itérer tous les descendants récursivement :

```c
void WalkWidgets(Widget w, int depth = 0)
{
    if (!w) return;

    string indent = "";
    for (int i = 0; i < depth; i++) indent += "  ";
    Print(indent + w.GetTypeName() + " " + w.GetName());

    WalkWidgets(w.GetChildren(), depth + 1);
    WalkWidgets(w.GetSibling(), depth);
}
```

---

## Exemple complet : créer un dialogue en code

Voici un exemple complet qui crée un simple dialogue d'information entièrement en code, sans aucun fichier layout :

```c
class SimpleCodeDialog : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected TextWidget m_Title;
    protected TextWidget m_Message;
    protected ButtonWidget m_CloseBtn;

    void SimpleCodeDialog(string title, string message)
    {
        int FLAGS_EXACT = WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE
            | WidgetFlags.EXACTPOS | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;
        int FLAGS_PROP = WidgetFlags.VISIBLE | WidgetFlags.SOURCEALPHA
            | WidgetFlags.BLEND;

        WorkspaceWidget workspace = GetGame().GetWorkspace();

        // Frame racine : 400x200 pixels, centré à l'écran
        m_Root = workspace.CreateWidget(
            FrameWidgetTypeID, 0, 0, 400, 200, FLAGS_EXACT,
            ARGB(230, 30, 30, 30), 100, null);

        // Le centrer manuellement
        int sw, sh;
        GetScreenSize(sw, sh);
        m_Root.SetScreenPos((sw - 400) / 2, (sh - 200) / 2);

        // Texte du titre : pleine largeur, 30px de haut, en haut
        Widget titleW = workspace.CreateWidget(
            TextWidgetTypeID, 0, 0, 400, 30, FLAGS_EXACT,
            ARGB(255, 100, 160, 220), 0, m_Root);
        m_Title = TextWidget.Cast(titleW);
        m_Title.SetText(title);

        // Texte du message : sous le titre, remplit l'espace restant
        Widget msgW = workspace.CreateWidget(
            TextWidgetTypeID, 10, 40, 380, 110, FLAGS_EXACT,
            ARGB(255, 200, 200, 200), 0, m_Root);
        m_Message = TextWidget.Cast(msgW);
        m_Message.SetText(message);

        // Bouton de fermeture : 80x30 pixels, zone en bas à droite
        Widget btnW = workspace.CreateWidget(
            ButtonWidgetTypeID, 310, 160, 80, 30, FLAGS_EXACT,
            ARGB(255, 80, 130, 200), 0, m_Root);
        m_CloseBtn = ButtonWidget.Cast(btnW);
        m_CloseBtn.SetText("Close");
        m_CloseBtn.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_CloseBtn)
        {
            Close();
            return true;
        }
        return false;
    }

    void Close()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }
    }

    void ~SimpleCodeDialog()
    {
        Close();
    }
}

// Utilisation :
SimpleCodeDialog dialog = new SimpleCodeDialog("Alert", "Server restart in 5 minutes.");
```

---

## Pooling de widgets

Créer et détruire des widgets à chaque frame cause des problèmes de performance. Maintenez plutôt un pool de widgets réutilisables :

```c
class WidgetPool
{
    protected ref array<Widget> m_Pool;
    protected ref array<Widget> m_Active;
    protected Widget m_Parent;
    protected string m_LayoutPath;

    void WidgetPool(Widget parent, string layoutPath, int initialSize = 10)
    {
        m_Pool = new array<Widget>();
        m_Active = new array<Widget>();
        m_Parent = parent;
        m_LayoutPath = layoutPath;

        // Pré-créer les widgets
        for (int i = 0; i < initialSize; i++)
        {
            Widget w = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
            w.Show(false);
            m_Pool.Insert(w);
        }
    }

    Widget Acquire()
    {
        Widget w;
        if (m_Pool.Count() > 0)
        {
            w = m_Pool[m_Pool.Count() - 1];
            m_Pool.Remove(m_Pool.Count() - 1);
        }
        else
        {
            w = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
        }
        w.Show(true);
        m_Active.Insert(w);
        return w;
    }

    void Release(Widget w)
    {
        w.Show(false);
        int idx = m_Active.Find(w);
        if (idx >= 0)
            m_Active.Remove(idx);
        m_Pool.Insert(w);
    }

    void ReleaseAll()
    {
        foreach (Widget w : m_Active)
        {
            w.Show(false);
            m_Pool.Insert(w);
        }
        m_Active.Clear();
    }
}
```

**Quand utiliser le pooling :**
- Listes qui se mettent à jour fréquemment (fil de victimes, chat, liste de joueurs)
- Grilles avec du contenu dynamique (inventaire, marché)
- Toute interface qui crée/détruit 10+ widgets par seconde

**Quand NE PAS utiliser le pooling :**
- Panneaux statiques créés une seule fois
- Dialogues affichés/masqués (utilisez simplement Show/Hide)

---

## Fichiers layout vs programmatique : quand utiliser chaque approche

| Situation | Recommandation |
|---|---|
| Structure d'interface statique | Fichier layout (`.layout`) |
| Arborescences de widgets complexes | Fichier layout |
| Nombre dynamique d'éléments | `CreateWidgets()` depuis un modèle de layout |
| Éléments simples à l'exécution (texte de débogage, marqueurs) | `CreateWidget()` |
| Prototypage rapide | `CreateWidget()` |
| Interface de mod en production | Fichier layout + configuration par code |

En pratique, la plupart des mods utilisent des **fichiers layout** pour la structure et du **code** pour peupler les données, afficher/masquer les éléments et gérer les événements. Les interfaces purement programmatiques sont rares en dehors des outils de débogage.

---

## Prochaines étapes

- [3.6 Gestion des événements](06-event-handling.md) -- Gérer les clics, les changements et les événements de la souris
- [3.7 Styles, polices et images](07-styles-fonts.md) -- Stylisation visuelle et ressources d'images

---

## Théorie vs pratique

| Concept | Théorie | Réalité |
|---------|--------|---------|
| `CreateWidget()` crée n'importe quel type de widget | Tous les TypeID fonctionnent avec `CreateWidget()` | `ScrollWidget` et `WrapSpacerWidget` créés programmatiquement nécessitent souvent une configuration manuelle des drapeaux (`EXACTSIZE`, dimensionnement) que les fichiers layout gèrent automatiquement |
| `Unlink()` libère toute la mémoire | Le widget et ses enfants sont détruits | Les références conservées dans les variables de script deviennent pendantes. Mettez toujours les refs de widgets à `null` après `Unlink()` ou vous risquez des plantages |
| `SetHandler()` route tous les événements | Un gestionnaire reçoit tous les événements du widget | Le gestionnaire ne reçoit les événements que des widgets qui ont appelé `SetHandler(this)`. Les enfants n'héritent pas du gestionnaire de leur parent |
| `CreateWidgets()` depuis un layout est instantané | Le layout se charge de manière synchrone | Les layouts volumineux avec beaucoup de widgets imbriqués provoquent un pic de frame. Pré-chargez les layouts pendant les écrans de chargement, pas pendant le gameplay |
| Le dimensionnement proportionnel (0.0-1.0) se redimensionne par rapport au parent | Les valeurs sont relatives aux dimensions du parent | Sans le drapeau `EXACTSIZE`, même les valeurs de `CreateWidget()` comme `100` sont traitées comme proportionnelles (plage 0-1), faisant que les widgets remplissent tout le parent |

---

## Compatibilité et impact

- **Multi-Mod :** Les widgets créés programmatiquement sont privés au mod qui les crée. Contrairement à `modded class`, il n'y a pas de risque de collision à moins que deux mods n'attachent des widgets au même widget parent vanilla par nom.
- **Performance :** Chaque appel à `CreateWidgets()` analyse le fichier layout depuis le disque. Mettez en cache le widget racine et affichez/masquez-le plutôt que de recréer depuis le layout à chaque ouverture de l'interface.

---

## Observé dans les mods réels

| Patron | Mod | Détail |
|---------|-----|--------|
| Modèle de layout + peuplement par code | COT, Expansion | Charge un modèle de ligne `.layout` via `CreateWidgets()` par élément de liste, puis peuple via `FindAnyWidget()` |
| Pooling de widgets pour le fil de victimes | Colorful UI | Pré-crée 20 widgets d'entrées de fil, les affiche/masque au lieu de les créer et détruire |
| Dialogues purement en code | Outils de débogage/admin | Simples dialogues d'alerte construits entièrement avec `CreateWidget()` pour éviter d'expédier des fichiers `.layout` supplémentaires |
| `SetHandler(this)` sur chaque enfant interactif | VPP Admin Tools | Itère tous les boutons après le chargement du layout et appelle `SetHandler()` sur chacun individuellement |
| Patron `Unlink()` + null | DabsFramework | La méthode `Close()` de chaque dialogue appelle `m_Root.Unlink(); m_Root = null;` de manière cohérente |
