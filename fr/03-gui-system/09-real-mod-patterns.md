# Chapitre 3.9 : Patrons d'interface des vrais mods

[Accueil](../README.md) | [<< Précédent : Dialogues et modales](08-dialogs-modals.md) | **Patrons d'interface des vrais mods** | [Suivant : Widgets avancés >>](10-advanced-widgets.md)

---

Ce chapitre examine les patrons d'interface trouvés dans six mods DayZ professionnels : COT (Community Online Tools), VPP Admin Tools, DabsFramework, Colorful UI, Expansion, et DayZ Editor. Chaque mod résout des problèmes différents. Étudier leurs approches vous donne une bibliothèque de patrons éprouvés au-delà de ce que la documentation officielle couvre.

Tout le code montré est extrait du code source réel des mods. Les chemins de fichiers font référence aux dépôts d'origine.

---

## Pourquoi étudier les vrais mods ?

La documentation DayZ explique les widgets individuels et les callbacks d'événements mais ne dit rien sur :

- Comment gérer 12 panneaux d'administration sans duplication de code
- Comment construire un système de dialogues avec routage de callbacks
- Comment thématiser une interface entière sans toucher aux fichiers layout vanilla
- Comment synchroniser une grille de marché avec les données serveur via RPC
- Comment structurer un éditeur avec annuler/rétablir et un système de commandes

Ce sont des problèmes d'architecture. Chaque gros mod invente des solutions pour eux. Certaines sont élégantes, d'autres sont des leçons à retenir. Ce chapitre cartographie les patrons pour que vous puissiez choisir la bonne approche pour votre projet.

---

## Patrons d'interface COT (Community Online Tools)

COT est l'outil d'administration DayZ le plus utilisé. Son architecture UI est construite autour d'un système module-formulaire-fenêtre où chaque outil (ESP, gestionnaire de joueurs, téléportation, générateur d'objets, etc.) est un module autonome avec son propre panneau.

### Architecture Module-Formulaire-Fenêtre

COT sépare les responsabilités en trois couches :

1. **JMRenderableModuleBase** -- Déclare les métadonnées du module (titre, icône, chemin du layout, permissions). Gère le cycle de vie de CF_Window. Ne contient pas de logique UI.
2. **JMFormBase** -- Le panneau UI réel. Étend `ScriptedWidgetEventHandler`. Reçoit les événements de widgets, construit les éléments UI, communique avec le module pour les opérations de données.
3. **CF_Window** -- Le conteneur de fenêtrage fourni par le framework CF. Gère le glisser, le redimensionnement, le chrome de fermeture.

Un module se déclare avec des overrides :

```c
class JMExampleModule: JMRenderableModuleBase
{
    void JMExampleModule()
    {
        GetPermissionsManager().RegisterPermission("Admin.Example.View");
        GetPermissionsManager().RegisterPermission("Admin.Example.Button");
    }

    override bool HasAccess()
    {
        return GetPermissionsManager().HasPermission("Admin.Example.View");
    }

    override string GetLayoutRoot()
    {
        return "JM/COT/GUI/layouts/Example_form.layout";
    }

    override string GetTitle()
    {
        return "Example Module";
    }

    override string GetIconName()
    {
        return "E";
    }

    override bool ImageIsIcon()
    {
        return false;
    }
}
```

Le module est enregistré dans un constructeur central qui construit la liste des modules :

```c
modded class JMModuleConstructor
{
    override void RegisterModules(out TTypenameArray modules)
    {
        super.RegisterModules(modules);

        modules.Insert(JMPlayerModule);
        modules.Insert(JMObjectSpawnerModule);
        modules.Insert(JMESPModule);
        modules.Insert(JMTeleportModule);
        modules.Insert(JMCameraModule);
        // ...
    }
}
```

Quand `Show()` est appelé sur un module, il crée une fenêtre et charge le formulaire :

```c
void Show()
{
    if (HasAccess())
    {
        m_Window = new CF_Window();
        Widget widgets = m_Window.CreateWidgets(GetLayoutRoot());
        widgets.GetScript(m_Form);
        m_Form.Init(m_Window, this);
    }
}
```

L'`Init` du formulaire lie la référence au module via un override protégé :

```c
class JMExampleForm: JMFormBase
{
    protected JMExampleModule m_Module;

    protected override bool SetModule(JMRenderableModuleBase mdl)
    {
        return Class.CastTo(m_Module, mdl);
    }

    override void OnInit()
    {
        // Construire les éléments UI de manière programmatique avec UIActionManager
    }
}
```

**Point clé :** Chaque outil est entièrement autonome. Ajouter un nouvel outil d'administration signifie créer une classe Module, une classe Form, un fichier layout, et insérer une ligne dans le constructeur. Aucun changement de code existant.

### UI programmatique avec UIActionManager

COT ne construit pas les formulaires complexes dans les fichiers layout. Au lieu de cela, il utilise une classe factory (`UIActionManager`) qui crée des widgets d'action UI standardisés à l'exécution :

```c
override void OnInit()
{
    m_Scroller = UIActionManager.CreateScroller(layoutRoot.FindAnyWidget("panel"));
    Widget actions = m_Scroller.GetContentWidget();

    // Disposition en grille : 8 lignes, 1 colonne
    m_PanelAlpha = UIActionManager.CreateGridSpacer(actions, 8, 1);

    // Types de widgets standard
    m_Text = UIActionManager.CreateText(m_PanelAlpha, "Label", "Value");
    m_EditableText = UIActionManager.CreateEditableText(
        m_PanelAlpha, "Name:", this, "OnChange_EditableText"
    );
    m_Slider = UIActionManager.CreateSlider(
        m_PanelAlpha, "Speed:", 0, 100, this, "OnChange_Slider"
    );
    m_Checkbox = UIActionManager.CreateCheckbox(
        m_PanelAlpha, "Enable Feature", this, "OnClick_Checkbox"
    );
    m_Button = UIActionManager.CreateButton(
        m_PanelAlpha, "Execute", this, "OnClick_Button"
    );

    // Sous-grille pour des boutons côte à côte
    Widget gridButtons = UIActionManager.CreateGridSpacer(m_PanelAlpha, 1, 2);
    m_Button = UIActionManager.CreateButton(gridButtons, "Left", this, "OnClick_Left");
    m_NavButton = UIActionManager.CreateNavButton(gridButtons, "Right", ...);
}
```

Chaque type de widget `UIAction*` a son propre fichier layout (ex. `UIActionSlider.layout`, `UIActionCheckbox.layout`) chargé comme un prefab. L'approche factory signifie :

- Dimensionnement et espacement cohérents dans tous les panneaux
- Pas de duplication de fichiers layout
- De nouveaux types d'actions peuvent être ajoutés une fois et utilisés partout

### Superposition ESP (dessin sur CanvasWidget)

Le système ESP de COT dessine des étiquettes, des barres de vie et des lignes directement par-dessus le monde 3D en utilisant `CanvasWidget`. Le patron clé est un `CanvasWidget` en espace écran qui couvre l'ensemble de la zone d'affichage, avec des gestionnaires de widgets ESP individuels positionnés aux coordonnées monde projetées :

```c
class JMESPWidgetHandler: ScriptedWidgetEventHandler
{
    bool ShowOnScreen;
    int Width, Height;
    float FOV;
    vector ScreenPos;
    JMESPMeta Info;

    void OnWidgetScriptInit(Widget w)
    {
        layoutRoot = w;
        layoutRoot.SetHandler(this);
        Init();
    }

    void Show()
    {
        layoutRoot.Show(true);
        OnShow();
    }

    void Hide()
    {
        OnHide();
        layoutRoot.Show(false);
    }
}
```

Les widgets ESP sont créés à partir de layouts prefab (`esp_widget.layout`) et positionnés à chaque frame en projetant les positions 3D en coordonnées écran. Le canvas lui-même est une superposition plein écran chargée au démarrage.

### Dialogues de confirmation

COT fournit un système de confirmation basé sur les callbacks intégré dans `JMFormBase`. Les confirmations sont créées avec des callbacks nommés :

```c
CreateConfirmation_Two(
    JMConfirmationType.INFO,
    "Are you sure?",
    "This will kick the player.",
    "#STR_COT_GENERIC_YES", "OnConfirmKick",
    "#STR_COT_GENERIC_NO", ""
);
```

Le `JMConfirmationForm` utilise `CallByName` pour invoquer la méthode de callback sur le formulaire :

```c
class JMConfirmationForm: JMConfirmation
{
    protected override void CallCallback(string callback)
    {
        if (callback != "")
        {
            g_Game.GetCallQueue(CALL_CATEGORY_GUI).CallByName(
                m_Window.GetForm(), callback, new Param1<JMConfirmation>(this)
            );
        }
    }
}
```

Cela permet de chaîner les confirmations (une confirmation en ouvre une autre) sans coder en dur le flux.

---

## Patrons d'interface VPP Admin Tools

VPP adopte une approche différente de COT : il utilise `UIScriptedMenu` avec un HUD de barre d'outils, des sous-fenêtres déplaçables, et un système global de boîtes de dialogue.

### Enregistrement des boutons de la barre d'outils

`VPPAdminHud` maintient une liste de définitions de boutons. Chaque bouton mappe une chaîne de permission à un nom d'affichage, une icône et une info-bulle :

```c
class VPPAdminHud extends VPPScriptedMenu
{
    private ref array<ref VPPButtonProperties> m_DefinedButtons;

    void VPPAdminHud()
    {
        InsertButton("MenuPlayerManager", "Player Manager",
            "set:dayz_gui_vpp image:vpp_icon_players",
            "#VSTR_TOOLTIP_PLAYERMANAGER");
        InsertButton("MenuItemManager", "Items Spawner",
            "set:dayz_gui_vpp image:vpp_icon_item_manager",
            "#VSTR_TOOLTIP_ITEMMANAGER");
        // ... 10 autres outils
        DefineButtons();

        // Vérifier les permissions avec le serveur via RPC
        array<string> perms = new array<string>;
        for (int i = 0; i < m_DefinedButtons.Count(); i++)
            perms.Insert(m_DefinedButtons[i].param1);
        GetRPCManager().VSendRPC("RPC_PermitManager",
            "VerifyButtonsPermission", new Param1<ref array<string>>(perms), true);
    }
}
```

Les mods externes peuvent surcharger `DefineButtons()` pour ajouter leurs propres boutons de barre d'outils, rendant VPP extensible sans modifier son code source.

### Système de fenêtres de sous-menu

Chaque panneau d'outil étend `AdminHudSubMenu`, qui fournit le comportement de fenêtre déplaçable, la bascule afficher/masquer et la gestion de priorité des fenêtres :

```c
class AdminHudSubMenu: ScriptedWidgetEventHandler
{
    protected Widget M_SUB_WIDGET;
    protected Widget m_TitlePanel;

    void ShowSubMenu()
    {
        m_IsVisible = true;
        M_SUB_WIDGET.Show(true);
        VPPAdminHud rootHud = VPPAdminHud.Cast(
            GetVPPUIManager().GetMenuByType(VPPAdminHud)
        );
        rootHud.SetWindowPriorty(this);
        OnMenuShow();
    }

    // Support du glisser via la barre de titre
    override bool OnDrag(Widget w, int x, int y)
    {
        if (w == m_TitlePanel)
        {
            M_SUB_WIDGET.GetPos(m_posX, m_posY);
            m_posX = x - m_posX;
            m_posY = y - m_posY;
            return false;
        }
        return true;
    }

    override bool OnDragging(Widget w, int x, int y, Widget reciever)
    {
        if (w == m_TitlePanel)
        {
            SetWindowPos(x - m_posX, y - m_posY);
            return false;
        }
        return true;
    }

    // Double-clic sur la barre de titre pour maximiser/restaurer
    override bool OnDoubleClick(Widget w, int x, int y, int button)
    {
        if (button == MouseState.LEFT && w == m_TitlePanel)
        {
            ResizeWindow(!m_WindowExpanded);
            return true;
        }
        return super.OnDoubleClick(w, x, y, button);
    }
}
```

**Point clé :** VPP construit un mini gestionnaire de fenêtres à l'intérieur de DayZ. Chaque sous-menu est une fenêtre déplaçable et redimensionnable avec gestion du focus. L'appel `SetWindowPriorty()` ajuste l'ordre Z pour que la fenêtre cliquée passe au premier plan.

### VPPDialogBox -- dialogue basé sur les callbacks

Le système de dialogue de VPP utilise une approche pilotée par enum. Le dialogue affiche/masque les boutons en fonction d'un enum de type, et route le résultat via `CallFunction` :

```c
enum DIAGTYPE
{
    DIAG_YESNO,
    DIAG_YESNOCANCEL,
    DIAG_OK,
    DIAG_OK_CANCEL_INPUT
}

class VPPDialogBox extends ScriptedWidgetEventHandler
{
    private Class   m_CallBackClass;
    private string  m_CbFunc = "OnDiagResult";

    void InitDiagBox(int diagType, string title, string content,
                     Class callBackClass, string cbFunc = string.Empty)
    {
        m_CallBackClass = callBackClass;
        if (cbFunc != string.Empty)
            m_CbFunc = cbFunc;

        switch (diagType)
        {
            case DIAGTYPE.DIAG_YESNO:
                m_Yes.Show(true);
                m_No.Show(true);
                break;
            case DIAGTYPE.DIAG_OK_CANCEL_INPUT:
                m_Ok.Show(true);
                m_Cancel.Show(true);
                m_InputBox.Show(true);
                break;
        }
        m_TitleText.SetText(title);
        m_Content.SetText(content);
    }

    private void OnOutCome(int result)
    {
        GetGame().GameScript.CallFunction(m_CallBackClass, m_CbFunc, null, result);
        delete this;
    }
}
```

Le `ConfirmationEventHandler` encapsule un widget bouton pour qu'un clic génère un dialogue. Le résultat du dialogue est transmis à n'importe quelle classe via un callback nommé :

```c
class ConfirmationEventHandler extends ScriptedWidgetEventHandler
{
    void InitEvent(Class callbackClass, string functionName,
                   int diagtype, string title, string message,
                   Widget parent, bool allowChars = false)
    {
        m_CallBackClass = callbackClass;
        m_CallbackFunc  = functionName;
        m_DiagType      = diagtype;
        m_Title         = title;
        m_Message       = message;
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_root)
        {
            m_diagBox = GetVPPUIManager().CreateDialogBox(m_Parent);
            m_diagBox.InitDiagBox(m_DiagType, m_Title, m_Message, this);
            return true;
        }
        return false;
    }

    void OnDiagResult(int outcome, string input)
    {
        GetGame().GameScript.CallFunctionParams(
            m_CallBackClass, m_CallbackFunc, null,
            new Param2<int, string>(outcome, input)
        );
    }
}
```

### PopUp avec OnWidgetScriptInit

Les formulaires popup VPP se lient à leur layout via `OnWidgetScriptInit` et utilisent `ScriptedWidgetEventHandler` :

```c
class PopUpCreatePreset extends ScriptedWidgetEventHandler
{
    private Widget m_root;
    private ButtonWidget m_Close, m_Cancel, m_Save;
    private EditBoxWidget m_editbox_name;

    void OnWidgetScriptInit(Widget w)
    {
        m_root = w;
        m_root.SetHandler(this);
        m_Close = ButtonWidget.Cast(m_root.FindAnyWidget("button_close"));
        m_Cancel = ButtonWidget.Cast(m_root.FindAnyWidget("button_cancel"));
        m_Save = ButtonWidget.Cast(m_root.FindAnyWidget("button_save"));
        m_editbox_name = EditBoxWidget.Cast(m_root.FindAnyWidget("editbox_name"));
    }

    void ~PopUpCreatePreset()
    {
        if (m_root != null)
            m_root.Unlink();
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        switch (w)
        {
            case m_Close:
            case m_Cancel:
                delete this;
                break;
            case m_Save:
                if (m_PresetName != "")
                {
                    m_RootClass.SaveNewPreset(m_PresetName);
                    delete this;
                }
                break;
        }
        return true;
    }
}
```

**Point clé :** `delete this` à la fermeture est le patron courant de suppression de popup. Le destructeur appelle `m_root.Unlink()` pour supprimer l'arbre de widgets. C'est propre mais nécessite de la prudence -- si quoi que ce soit détient une référence au popup après la suppression, vous obtenez un accès null.

---

## Patrons d'interface DabsFramework

DabsFramework introduit une architecture MVC (Modèle-Vue-Contrôleur) complète pour l'interface DayZ. Il est utilisé par DayZ Editor et Expansion comme fondation de leur interface.

### ViewController et liaison de données

L'idée centrale : au lieu de chercher manuellement des widgets et de définir leur texte, vous déclarez des propriétés sur une classe contrôleur et les liez aux widgets par nom dans l'éditeur de layout.

```c
class TestController: ViewController
{
    // Le nom de la variable correspond au Binding_Name dans le layout
    string TextBox1 = "Initial Text";
    int TextBox2;
    bool WindowButton1;

    void SetWindowButton1(bool state)
    {
        WindowButton1 = state;
        NotifyPropertyChanged("WindowButton1");
    }

    override void PropertyChanged(string propertyName)
    {
        switch (propertyName)
        {
            case "WindowButton1":
                Print("Button state: " + WindowButton1);
                break;
        }
    }
}
```

Dans le layout, chaque widget a une classe script `ViewBinding` avec une propriété de référence `Binding_Name` définie au nom de la variable (ex. "TextBox1"). Quand `NotifyPropertyChanged()` est appelé, le framework trouve tous les ViewBindings avec ce nom et met à jour le widget :

```c
class ViewBinding : ScriptedViewBase
{
    reference string Binding_Name;
    reference string Selected_Item;
    reference bool Two_Way_Binding;
    reference string Relay_Command;

    void UpdateView(ViewController controller)
    {
        if (m_PropertyConverter)
        {
            m_PropertyConverter.GetFromController(controller, Binding_Name, 0);
            m_WidgetController.Set(m_PropertyConverter);
        }
    }

    void UpdateController(ViewController controller)
    {
        if (m_PropertyConverter && Two_Way_Binding)
        {
            m_WidgetController.Get(m_PropertyConverter);
            m_PropertyConverter.SetToController(controller, Binding_Name, 0);
            controller.NotifyPropertyChanged(Binding_Name);
        }
    }
}
```

La **liaison bidirectionnelle** signifie que les changements dans le widget (saisie utilisateur) se propagent automatiquement à la propriété du contrôleur.

### ObservableCollection -- liaison de données pour les listes

Pour les listes dynamiques, DabsFramework fournit `ObservableCollection<T>`. Les opérations d'insertion/suppression mettent automatiquement à jour le widget lié (ex. un WrapSpacer ou ScrollWidget) :

```c
class MyController: ViewController
{
    ref ObservableCollection<string> ItemList;

    void MyController()
    {
        ItemList = new ObservableCollection<string>(this);
        ItemList.Insert("Item A");
        ItemList.Insert("Item B");
    }

    override void CollectionChanged(string property_name,
                                    CollectionChangedEventArgs args)
    {
        // Appelé automatiquement lors d'Insert/Remove
    }
}
```

Chaque `Insert()` déclenche un événement `CollectionChanged`, que le ViewBinding intercepte pour créer/détruire les widgets enfants. Pas de gestion manuelle de widgets nécessaire.

### ScriptView -- layout depuis le code

`ScriptView` est l'alternative tout-script à `OnWidgetScriptInit`. Vous en héritez, surchargez `GetLayoutFile()`, et l'instanciez. Le constructeur charge le layout, trouve le contrôleur, et connecte tout :

```c
class CustomDialogWindow: ScriptView
{
    override string GetLayoutFile()
    {
        return "MyMod/gui/layouts/dialogs/Dialog.layout";
    }

    override typename GetControllerType()
    {
        return CustomDialogController;
    }
}

// Utilisation :
CustomDialogWindow window = new CustomDialogWindow();
```

Les variables de widgets déclarées comme champs sur les sous-classes de `ScriptView` sont auto-remplies par correspondance de nom avec la hiérarchie du layout (`LoadWidgetsAsVariables`). Cela élimine les appels `FindAnyWidget()`.

### RelayCommand -- liaison bouton-action

Les boutons peuvent être liés à des objets `RelayCommand` via la propriété de référence `Relay_Command` dans ViewBinding. Cela découple les clics de bouton des gestionnaires :

```c
class EditorCommand: RelayCommand
{
    override bool Execute(Class sender, CommandArgs args)
    {
        // Effectuer l'action
        return true;
    }

    override bool CanExecute()
    {
        // Activer/désactiver le bouton
        return true;
    }

    override void CanExecuteChanged(bool state)
    {
        // Griser le widget quand désactivé
        if (m_ViewBinding)
        {
            Widget root = m_ViewBinding.GetLayoutRoot();
            root.SetAlpha(state ? 1 : 0.15);
            root.Enable(state);
        }
    }
}
```

**Point clé :** DabsFramework élimine le code répétitif. Vous déclarez les données, les liez par nom, et le framework gère la synchronisation. Le coût est la courbe d'apprentissage et la dépendance au framework.

---

## Patrons Colorful UI

Colorful UI remplace les menus vanilla DayZ par des versions thématisées sans modifier les fichiers de scripts vanilla. Son approche est entièrement basée sur les overrides de `modded class` et un système centralisé de couleurs/branding.

### Système de thème à 3 couches

Les couleurs sont organisées en trois niveaux :

**Couche 1 -- UIColor (palette de base) :** Valeurs de couleur brutes avec des noms sémantiques.

```c
class UIColor
{
    static int White()           { return ARGB(255, 255, 255, 255); }
    static int Grey()            { return ARGB(255, 130, 130, 130); }
    static int Red()             { return ARGB(255, 173, 35, 35); }
    static int Discord()         { return ARGB(255, 88, 101, 242); }
    static int cuiTeal()         { return ARGB(255, 102, 153, 153); }
    static int cuiDarkBlue()     { return ARGB(155, 0, 0, 32); }
}
```

**Couche 2 -- colorScheme (mappage sémantique) :** Mappe les concepts UI aux couleurs de la palette. Les propriétaires de serveur changent cette couche pour thématiser leur serveur.

```c
class colorScheme
{
    static int BrandColor()      { return ARGB(255, 255, 204, 102); }
    static int AccentColor()     { return ARGB(255, 100, 35, 35); }
    static int PrimaryText()     { return UIColor.White(); }
    static int TextHover()       { return BrandColor(); }
    static int ButtonHover()     { return BrandColor(); }
    static int TabSelectedColor(){ return BrandColor(); }
    static int Separator()       { return BrandColor(); }
    static int OptionSliderColors() { return BrandColor(); }
}
```

**Couche 3 -- Branding/Settings (identité serveur) :** Chemins de logos, URLs, bascules de fonctionnalités.

```c
class Branding
{
    static string Logo()
    {
        return "Colorful-UI/GUI/textures/Shared/CuiPro_Logo.edds";
    }

    static void ApplyLogo(ImageWidget widget)
    {
        if (!widget) return;
        widget.LoadImageFile(0, Logo());
        widget.SetFlags(WidgetFlags.STRETCH);
    }
}

class SocialURL
{
    static string Discord  = "http://www.example.com";
    static string Facebook = "http://www.example.com";
    static string Twitter  = "http://www.example.com";
}
```

### Modification non destructive de l'interface vanilla

Colorful UI remplace les menus vanilla en utilisant `modded class`. Chaque sous-classe de `UIScriptedMenu` vanilla est moddée pour charger un fichier layout personnalisé et appliquer les couleurs du thème :

```c
modded class MainMenu extends UIScriptedMenu
{
    protected ImageWidget m_TopShader, m_BottomShader, m_MenuDivider;

    override Widget Init()
    {
        layoutRoot = GetGame().GetWorkspace().CreateWidgets(
            "Colorful-UI/GUI/layouts/menus/cui.mainMenu.layout"
        );

        m_TopShader = ImageWidget.Cast(layoutRoot.FindAnyWidget("TopShader"));
        m_BottomShader = ImageWidget.Cast(layoutRoot.FindAnyWidget("BottomShader"));

        // Appliquer les couleurs du thème
        if (m_TopShader) m_TopShader.SetColor(colorScheme.TopShader());
        if (m_BottomShader) m_BottomShader.SetColor(colorScheme.BottomShader());
        if (m_MenuDivider) m_MenuDivider.SetColor(colorScheme.Separator());

        Branding.ApplyLogo(m_Logo);

        return layoutRoot;
    }
}
```

Ce patron est important : Colorful UI fournit des fichiers `.layout` entièrement personnalisés qui reproduisent les noms de widgets vanilla. L'override de `modded class` échange le chemin du layout mais conserve les noms de widgets vanilla pour que si du code vanilla référence ces noms de widgets, il fonctionne toujours.

### Variantes de layout selon la résolution

Colorful UI fournit des répertoires de layout d'inventaire séparés pour différentes largeurs d'écran :

```
GUI/layouts/inventory/narrow/   -- petits écrans
GUI/layouts/inventory/medium/   -- 1080p standard
GUI/layouts/inventory/wide/     -- ultra-large
```

Chaque répertoire contient les mêmes noms de fichiers (`cargo_container.layout`, `left_area.layout`, etc.) avec un dimensionnement ajusté. La variante correcte est sélectionnée à l'exécution en fonction de la résolution de l'écran.

### Configuration via variables statiques

Les propriétaires de serveur configurent Colorful UI en éditant les valeurs des variables statiques dans `Settings.c` :

```c
static bool StartMainMenu    = true;
static bool NoHints          = false;
static bool LoadVideo        = true;
static bool ShowDeadScreen   = false;
static bool CuiDebug         = true;
```

C'est le système de configuration le plus simple possible : éditer le script, reconstruire le PBO. Pas de chargement JSON, pas de gestionnaire de config. Pour un mod visuel côté client uniquement, c'est approprié.

**Point clé :** Colorful UI démontre que vous pouvez re-thématiser l'intégralité du client DayZ sans code côté serveur, en utilisant uniquement des overrides de `modded class`, des fichiers layout personnalisés et un système de couleurs centralisé.

---

## Patrons d'interface Expansion

DayZ Expansion est le plus grand écosystème de mods communautaires. Son interface va des notifications toast aux interfaces de trading de marché complètes avec synchronisation serveur.

### Système de notifications (types multiples)

Expansion définit six types visuels de notification, chacun avec son propre layout :

```c
enum ExpansionNotificationType
{
    TOAST    = 1,    // Petit popup dans un coin
    BAGUETTE = 2,   // Bannière large à travers l'écran
    ACTIVITY = 4,   // Entrée de flux d'activité
    KILLFEED = 8,   // Annonce de kill
    MARKET   = 16,  // Résultat de transaction de marché
    GARAGE   = 32   // Résultat de stockage de véhicule
}
```

Les notifications sont créées de n'importe où (client ou serveur) via une API statique :

```c
// Depuis le serveur, envoyé à un joueur spécifique via RPC :
NotificationSystem.Create_Expansion(
    "Trade Complete",          // titre
    "You purchased M4A1",     // texte
    "market_icon",             // nom de l'icône
    ARGB(255, 50, 200, 50),   // couleur
    7,                         // durée d'affichage (secondes)
    sendTo,                    // PlayerIdentity (null = tous)
    ExpansionNotificationType.MARKET  // type
);
```

Le module de notification maintient une liste de notifications actives et gère leur cycle de vie. Chaque `ExpansionNotificationView` (une sous-classe de `ScriptView`) gère sa propre animation d'apparition/disparition :

```c
class ExpansionNotificationView: ScriptView
{
    protected bool m_Showing;
    protected bool m_Hiding;
    protected float m_ShowUpdateTime;
    protected float m_TotalShowUpdateTime;

    void ShowNotification()
    {
        if (GetExpansionClientSettings().ShowNotifications
            && GetExpansionClientSettings().NotificationSound)
            PlaySound();

        GetLayoutRoot().Show(true);
        m_Showing = true;
        m_ShowUpdateTime = 0;
        SetView();
    }

    void HideNotification()
    {
        m_Hiding = true;
        m_HideUpdateTime = 0;
    }
}
```

Chaque type de notification a un fichier layout séparé (`expansion_notification_toast.layout`, `expansion_notification_killfeed.layout`, etc.) permettant des traitements visuels complètement différents.

### Menu du marché (panneau interactif complexe)

Le `ExpansionMarketMenu` est l'une des interfaces les plus complexes de tous les mods DayZ. Il étend `ExpansionScriptViewMenu` (qui étend ScriptView de DabsFramework) et gère :

- Arbre de catégories avec sections repliables
- Grille d'items avec filtrage par recherche
- Affichage des prix achat/vente avec icônes de monnaie
- Contrôles de quantité
- Widget de prévisualisation d'item
- Prévisualisation de l'inventaire du joueur
- Sélecteurs déroulants pour les skins
- Cases à cocher de configuration d'attachements
- Dialogues de confirmation pour achats/ventes

```c
class ExpansionMarketMenu: ExpansionScriptViewMenu
{
    protected ref ExpansionMarketMenuController m_MarketMenuController;
    protected ref ExpansionMarketModule m_MarketModule;
    protected ref ExpansionMarketItem m_SelectedMarketItem;

    // Références directes aux widgets (auto-remplies par ScriptView)
    protected EditBoxWidget market_filter_box;
    protected ButtonWidget market_item_buy;
    protected ButtonWidget market_item_sell;
    protected ScrollWidget market_categories_scroller;
    protected ItemPreviewWidget market_item_preview;
    protected PlayerPreviewWidget market_player_preview;

    // Suivi d'état
    protected int m_Quantity = 1;
    protected int m_BuyPrice;
    protected int m_SellPrice;
    protected ExpansionMarketMenuState m_CurrentState;
}
```

**Point clé :** Pour les interfaces interactives complexes, Expansion combine le MVC de DabsFramework avec des références directes aux widgets. Le contrôleur gère la liaison de données pour les listes et le texte, tandis que les références directes aux widgets gèrent les widgets spécialisés comme `ItemPreviewWidget` et `PlayerPreviewWidget` qui nécessitent un contrôle impératif.

### ExpansionScriptViewMenu -- cycle de vie du menu

Expansion encapsule ScriptView dans une classe de base de menu qui gère le verrouillage d'entrée, les effets de flou et les timers de mise à jour :

```c
class ExpansionScriptViewMenu: ExpansionScriptViewMenuBase
{
    override void OnShow()
    {
        super.OnShow();
        LockControls();
        PPEffects.SetBlurMenu(0.5);
        SetFocus(GetLayoutRoot());
        CreateUpdateTimer();
    }

    override void OnHide()
    {
        super.OnHide();
        PPEffects.SetBlurMenu(0.0);
        DestroyUpdateTimer();
        UnlockControls();
    }

    override void LockControls(bool lockMovement = true)
    {
        ShowHud(false);
        ShowUICursor(true);
        LockInputs(true, lockMovement);
    }
}
```

Cela garantit que chaque menu Expansion verrouille de manière cohérente les mouvements du joueur, affiche le curseur, applique le flou d'arrière-plan et nettoie à la fermeture.

---

## Patrons d'interface DayZ Editor

DayZ Editor est un outil complet de placement d'objets construit comme un mod DayZ. Il utilise DabsFramework extensivement et implémente des patrons typiquement trouvés dans les applications de bureau : barres d'outils, menus, inspecteurs de propriétés, système de commandes avec annuler/rétablir.

### Patron de commande avec raccourcis clavier

Le système de commandes de l'éditeur découple les actions des éléments UI. Chaque action (Nouveau, Ouvrir, Enregistrer, Annuler, Rétablir, Supprimer, etc.) est une sous-classe d'`EditorCommand` :

```c
class EditorUndoCommand: EditorCommand
{
    protected override bool Execute(Class sender, CommandArgs args)
    {
        super.Execute(sender, args);
        m_Editor.Undo();
        return true;
    }

    override string GetName()
    {
        return "#STR_EDITOR_UNDO";
    }

    override string GetIcon()
    {
        return "set:dayz_editor_gui image:undo";
    }

    override ShortcutKeys GetShortcut()
    {
        return { KeyCode.KC_LCONTROL, KeyCode.KC_Z };
    }

    override bool CanExecute()
    {
        return GetEditor().CanUndo();
    }
}
```

L'`EditorCommandManager` enregistre toutes les commandes et mappe les raccourcis :

```c
class EditorCommandManager
{
    protected ref map<typename, ref EditorCommand> m_Commands;
    protected ref map<int, EditorCommand> m_CommandShortcutMap;

    EditorCommand UndoCommand;
    EditorCommand RedoCommand;
    EditorCommand DeleteCommand;

    void Init()
    {
        UndoCommand = RegisterCommand(EditorUndoCommand);
        RedoCommand = RegisterCommand(EditorRedoCommand);
        DeleteCommand = RegisterCommand(EditorDeleteCommand);
        // ...
    }
}
```

Les commandes s'intègrent avec le `RelayCommand` de DabsFramework pour que les boutons de la barre d'outils se grisent automatiquement quand `CanExecute()` retourne false.

### Système de barre de menu

L'éditeur construit sa barre de menu (Fichier, Édition, Affichage, Éditeur) en utilisant une collection observable d'éléments de menu. Chaque menu est une sous-classe de `ScriptView` :

```c
class EditorMenu: ScriptView
{
    protected EditorMenuController m_TemplateController;

    void AddMenuButton(typename editor_command_type)
    {
        AddMenuButton(GetEditor().CommandManager[editor_command_type]);
    }

    void AddMenuButton(EditorCommand editor_command)
    {
        AddMenuItem(new EditorMenuItem(this, editor_command));
    }

    void AddMenuDivider()
    {
        AddMenuItem(new EditorMenuItemDivider(this));
    }

    void AddMenuItem(EditorMenuItem menu_item)
    {
        m_TemplateController.MenuItems.Insert(menu_item);
    }
}
```

L'`ObservableCollection` crée automatiquement les éléments de menu visuels quand des commandes sont insérées.

### HUD avec panneaux liés aux données

Le contrôleur HUD de l'éditeur utilise `ObservableCollection` pour tous les panneaux de liste :

```c
class EditorHudController: EditorControllerBase
{
    // Listes d'objets liées aux panneaux latéraux
    ref ObservableCollection<ref EditorPlaceableListItem> LeftbarSpacerConfig;
    ref ObservableCollection<EditorListItem> RightbarPlacedData;
    ref ObservableCollection<EditorPlayerListItem> RightbarPlayerData;

    // Entrées de log avec compteur max
    static const int MAX_LOG_ENTRIES = 20;
    ref ObservableCollection<ref EditorLogEntry> EditorLogEntries;

    // Images clés de piste caméra
    ref ObservableCollection<ref EditorCameraTrackListItem> CameraTrackData;
}
```

Ajouter un objet à la scène l'ajoute automatiquement à la liste latérale. Le supprimer le retire. Pas de création/destruction manuelle de widgets.

### Thématisation via listes de noms de widgets

L'éditeur centralise les widgets thématisés en utilisant un tableau statique de noms de widgets :

```c
static const ref array<string> ThemedWidgetStrings = {
    "LeftbarPanelSearchBarIconButton",
    "FavoritesTabButton",
    "ShowPrivateButton",
    // ...
};
```

Un passage de thématisation itère ce tableau et applique les couleurs depuis `EditorSettings`, évitant les appels `SetColor()` dispersés dans la base de code.

---

## Patrons d'architecture UI communs

Ces patrons apparaissent dans plusieurs mods. Ils représentent le consensus de la communauté sur comment résoudre les problèmes récurrents d'interface DayZ.

### Gestionnaire de panneaux (afficher/masquer par nom ou type)

VPP et COT maintiennent tous deux un registre de panneaux UI accessibles par typename :

```c
// Patron VPP
VPPScriptedMenu GetMenuByType(typename menuType)
{
    foreach (VPPScriptedMenu menu : M_SCRIPTED_UI_INSTANCES)
    {
        if (menu && menu.GetType() == menuType)
            return menu;
    }
    return NULL;
}

// Patron COT
void ToggleShow()
{
    if (IsVisible())
        Close();
    else
        Show();
}
```

Cela empêche les panneaux dupliqués et fournit un point de contrôle unique pour la visibilité.

### Recyclage de widgets pour les listes

Quand on affiche de grandes listes (listes de joueurs, catalogues d'items, navigateurs d'objets), les mods évitent de créer/détruire des widgets à chaque mise à jour. Au lieu de cela, ils maintiennent un pool :

```c
// Patron simplifié utilisé dans plusieurs mods
void UpdatePlayerList(array<PlayerInfo> players)
{
    // Masquer les widgets en excès
    for (int i = players.Count(); i < m_PlayerWidgets.Count(); i++)
        m_PlayerWidgets[i].Show(false);

    // Créer de nouveaux widgets uniquement si nécessaire
    while (m_PlayerWidgets.Count() < players.Count())
    {
        Widget w = GetGame().GetWorkspace().CreateWidgets(PLAYER_ENTRY_LAYOUT, m_ListParent);
        m_PlayerWidgets.Insert(w);
    }

    // Mettre à jour les widgets visibles avec les données
    for (int j = 0; j < players.Count(); j++)
    {
        m_PlayerWidgets[j].Show(true);
        SetPlayerData(m_PlayerWidgets[j], players[j]);
    }
}
```

L'`ObservableCollection` de DabsFramework gère cela automatiquement, mais les implémentations manuelles utilisent ce patron.

### Création paresseuse de widgets

Plusieurs mods reportent la création de widgets au premier affichage :

```c
// Patron VPP
override Widget Init()
{
    if (!m_Init)
    {
        layoutRoot = GetGame().GetWorkspace().CreateWidgets(VPPATUIConstants.VPPAdminHud);
        m_Init = true;
        return layoutRoot;
    }
    // Les appels suivants sautent la création
    return layoutRoot;
}
```

Cela évite de charger tous les panneaux d'administration au démarrage quand la plupart ne seront jamais ouverts.

### Délégation d'événements via chaînes de gestionnaires

Un patron courant est un gestionnaire parent qui délègue aux gestionnaires enfants :

```c
// Le parent gère le clic, route vers l'enfant approprié
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_closeButton)
    {
        HideSubMenu();
        return true;
    }

    // Déléguer au panneau d'outil actif
    if (m_ActivePanel)
        return m_ActivePanel.OnClick(w, x, y, button);

    return false;
}
```

### OnWidgetScriptInit comme point d'entrée universel

Chaque mod étudié utilise `OnWidgetScriptInit` comme mécanisme de liaison layout-script :

```c
void OnWidgetScriptInit(Widget w)
{
    m_root = w;
    m_root.SetHandler(this);

    // Trouver les widgets enfants
    m_Button = ButtonWidget.Cast(m_root.FindAnyWidget("button_name"));
    m_Text = TextWidget.Cast(m_root.FindAnyWidget("text_name"));
}
```

Ceci est défini via la propriété `scriptclass` dans le fichier layout. Le moteur appelle `OnWidgetScriptInit` automatiquement quand `CreateWidgets()` traite un widget avec une classe script.

---

## Anti-patrons à éviter

Ces erreurs apparaissent dans du vrai code de mods et causent des problèmes de performance ou des plantages.

### Créer des widgets à chaque frame

```c
// MAUVAIS : Crée de nouveaux widgets à chaque appel Update
override void Update(float dt)
{
    Widget label = GetGame().GetWorkspace().CreateWidgets("label.layout", m_Parent);
    TextWidget.Cast(label.FindAnyWidget("text")).SetText(m_Value);
}
```

La création de widgets alloue de la mémoire et déclenche un recalcul du layout. À 60 FPS, cela crée 60 widgets par seconde. Toujours créer une fois et mettre à jour sur place.

### Ne pas nettoyer les gestionnaires d'événements

```c
// MAUVAIS : Insert sans Remove correspondant
void OnInit()
{
    GetGame().GetUpdateQueue(CALL_CATEGORY_GUI).Insert(Update);
    JMScriptInvokers.ESP_VIEWTYPE_CHANGED.Insert(OnESPViewTypeChanged);
}

// Manquant dans le destructeur :
// GetGame().GetUpdateQueue(CALL_CATEGORY_GUI).Remove(Update);
// JMScriptInvokers.ESP_VIEWTYPE_CHANGED.Remove(OnESPViewTypeChanged);
```

Chaque `Insert` sur un `ScriptInvoker` ou une file de mise à jour nécessite un `Remove` correspondant dans le destructeur. Les gestionnaires orphelins causent des appels à des objets supprimés et des plantages par accès null.

### Coder en dur les positions en pixels

```c
// MAUVAIS : Casse à différentes résolutions
m_Panel.SetPos(540, 320);
m_Panel.SetSize(400, 300);
```

Utilisez toujours un positionnement proportionnel (0.0-1.0) ou laissez les widgets conteneurs gérer le layout. Les positions en pixels ne fonctionnent qu'à la résolution pour laquelle elles ont été conçues.

### Imbrication profonde de widgets sans utilité

```
Frame -> Panel -> Frame -> Panel -> Frame -> TextWidget
```

Chaque niveau d'imbrication ajoute un surcoût de calcul de layout. Si un widget intermédiaire ne sert à rien (pas de fond, pas de contrainte de dimensionnement, pas de gestion d'événements), supprimez-le. Aplatissez les hiérarchies quand c'est possible.

### Ignorer la gestion du focus

```c
// MAUVAIS : Ouvre un dialogue mais ne définit pas le focus
void ShowDialog()
{
    m_Dialog.Show(true);
    // Manquant : SetFocus(m_Dialog.GetLayoutRoot());
}
```

Sans `SetFocus()`, les événements clavier peuvent encore aller aux widgets derrière le dialogue. L'approche d'Expansion est correcte :

```c
override void OnShow()
{
    SetFocus(GetLayoutRoot());
}
```

### Oublier le nettoyage des widgets à la destruction

```c
// MAUVAIS : L'arbre de widgets fuit quand l'objet script est détruit
void ~MyPanel()
{
    // m_root.Unlink() manquant !
}
```

Si vous créez des widgets avec `CreateWidgets()`, vous en êtes propriétaire. Appelez `Unlink()` sur la racine dans votre destructeur. `ScriptView` et `UIScriptedMenu` gèrent cela automatiquement, mais les sous-classes brutes de `ScriptedWidgetEventHandler` doivent le faire manuellement.

---

## Résumé : quel patron utiliser quand

| Besoin | Patron recommandé | Mod source |
|--------|-------------------|------------|
| Panneau d'outil simple | `ScriptedWidgetEventHandler` + `OnWidgetScriptInit` | VPP |
| Interface complexe liée aux données | `ScriptView` + `ViewController` + `ObservableCollection` | DabsFramework |
| Système de panneaux d'administration | Module + Form + Window (patron d'enregistrement de modules) | COT |
| Sous-fenêtres déplaçables | `AdminHudSubMenu` (gestion du glisser par barre de titre) | VPP |
| Dialogue de confirmation | `VPPDialogBox` ou `JMConfirmation` (basé sur les callbacks) | VPP / COT |
| Popup avec saisie | Patron `PopUpCreatePreset` (`delete this` à la fermeture) | VPP |
| Menu plein écran | `ExpansionScriptViewMenu` (verrouillage des contrôles, flou, timer) | Expansion |
| Système de thème/couleurs | 3 couches (palette, schéma, branding) avec `modded class` | Colorful UI |
| Override d'interface vanilla | `modded class` + fichiers `.layout` de remplacement | Colorful UI |
| Système de notifications | Enum de types + layout par type + API de création statique | Expansion |
| Système de commandes de barre d'outils | `EditorCommand` + `EditorCommandManager` + raccourcis | DayZ Editor |
| Barre de menu avec éléments | `EditorMenu` + `ObservableCollection<EditorMenuItem>` | DayZ Editor |
| Superposition ESP/HUD | `CanvasWidget` plein écran + positionnement de widgets projetés | COT |
| Variantes de résolution | Répertoires de layout séparés (narrow/medium/wide) | Colorful UI |
| Performance de grandes listes | Pool de recyclage de widgets (masquer/afficher, créer à la demande) | Commun |
| Configuration | Variables statiques (mod client) ou JSON via gestionnaire de config | Colorful UI |

### Organigramme de décision

1. **Est-ce un panneau simple ponctuel ?** Utilisez `ScriptedWidgetEventHandler` avec `OnWidgetScriptInit`. Construisez le layout dans l'éditeur, trouvez les widgets par nom.

2. **A-t-il des listes dynamiques ou des données changeant fréquemment ?** Utilisez le `ViewController` de DabsFramework avec `ObservableCollection`. La liaison de données élimine les mises à jour manuelles de widgets.

3. **Fait-il partie d'un outil d'administration multi-panneaux ?** Utilisez le patron module-formulaire de COT. Chaque outil est autonome avec son propre module, formulaire et layout. L'enregistrement est une seule ligne.

4. **Doit-il remplacer l'interface vanilla ?** Utilisez le patron Colorful UI : `modded class`, fichier layout personnalisé, schéma de couleurs centralisé.

5. **Nécessite-t-il la synchronisation de données serveur-client ?** Combinez n'importe quel patron ci-dessus avec RPC. Le menu marché d'Expansion montre comment gérer les états de chargement, les cycles requête/réponse et les timers de mise à jour dans un ScriptView.

6. **Nécessite-t-il annuler/rétablir ou une interaction complexe ?** Utilisez le patron de commande de DayZ Editor. Les commandes découplent les actions des boutons, supportent les raccourcis et s'intègrent avec le `RelayCommand` de DabsFramework pour l'activation/désactivation automatique.

---

*Chapitre suivant : [Widgets avancés](10-advanced-widgets.md) -- formatage RichTextWidget, dessin CanvasWidget, marqueurs MapWidget, ItemPreviewWidget, PlayerPreviewWidget, VideoWidget, et RenderTargetWidget.*
