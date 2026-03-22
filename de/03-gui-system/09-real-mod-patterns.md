# Kapitel 3.9: Echte Mod-UI-Muster

[Startseite](../README.md) | [<< Zurück: Dialoge & Modale Fenster](08-dialogs-modals.md) | **Echte Mod-UI-Muster** | [Weiter: Erweiterte Widgets >>](10-advanced-widgets.md)

---

Dieses Kapitel untersucht UI-Muster aus sechs professionellen DayZ-Mods: COT (Community Online Tools), VPP Admin Tools, DabsFramework, Colorful UI, Expansion und DayZ Editor. Jede Mod löst unterschiedliche Probleme. Das Studium ihrer Ansätze gibt Ihnen eine Bibliothek bewährter Muster über das hinaus, was die offizielle Dokumentation abdeckt.

Der gesamte gezeigte Code ist aus tatsächlichem Mod-Quellcode extrahiert. Dateipfade beziehen sich auf die Original-Repositories.

---

## Warum echte Mods studieren?

Die DayZ-Dokumentation erklärt einzelne Widgets und Event-Callbacks, sagt aber nichts darüber aus:

- Wie man 12 Admin-Panels ohne Code-Duplizierung verwaltet
- Wie man ein Dialogsystem mit Callback-Routing erstellt
- Wie man eine gesamte UI thematisch gestaltet, ohne Vanilla-Layout-Dateien anzufassen
- Wie man ein Markt-Grid mit Serverdaten über RPC synchronisiert
- Wie man einen Editor mit Undo/Redo und einem Befehlssystem strukturiert

Dies sind Architekturprobleme. Jede große Mod erfindet Lösungen dafür. Manche sind elegant, manche sind warnende Beispiele. Dieses Kapitel kartiert die Muster, damit Sie den richtigen Ansatz für Ihr Projekt wählen können.

---

## COT (Community Online Tools) UI-Muster

COT ist das am weitesten verbreitete DayZ-Admin-Tool. Seine UI-Architektur basiert auf einem Modul-Form-Fenster-System, bei dem jedes Werkzeug (ESP, Spielerverwaltung, Teleport, Objekt-Spawner usw.) ein eigenständiges Modul mit eigenem Panel ist.

### Modul-Form-Fenster-Architektur

COT trennt die Zuständigkeiten in drei Schichten:

1. **JMRenderableModuleBase** -- Deklariert die Metadaten des Moduls (Titel, Icon, Layout-Pfad, Berechtigungen). Verwaltet den CF_Window-Lifecycle. Enthält keine UI-Logik.
2. **JMFormBase** -- Das eigentliche UI-Panel. Erweitert `ScriptedWidgetEventHandler`. Empfängt Widget-Events, erstellt UI-Elemente, kommuniziert mit dem Modul für Datenoperationen.
3. **CF_Window** -- Der Fenster-Container, bereitgestellt vom CF-Framework. Behandelt Ziehen, Größenänderung, Schließen-Leiste.

Ein Modul deklariert sich über Overrides:

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

Das Modul wird in einem zentralen Konstruktor registriert, der die Modulliste aufbaut:

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

Wenn `Show()` auf einem Modul aufgerufen wird, erstellt es ein Fenster und lädt das Formular:

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

Das Init des Formulars bindet die Modul-Referenz über ein geschütztes Override:

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
        // UI-Elemente programmatisch mit UIActionManager erstellen
    }
}
```

**Wichtige Erkenntnis:** Jedes Werkzeug ist vollständig eigenständig. Das Hinzufügen eines neuen Admin-Tools bedeutet: eine Modul-Klasse, eine Form-Klasse, eine Layout-Datei erstellen und eine Zeile im Konstruktor einfügen. Kein bestehender Code muss geändert werden.

### Programmatische UI mit UIActionManager

COT erstellt komplexe Formulare nicht in Layout-Dateien. Stattdessen verwendet es eine Factory-Klasse (`UIActionManager`), die standardisierte UI-Action-Widgets zur Laufzeit erzeugt:

```c
override void OnInit()
{
    m_Scroller = UIActionManager.CreateScroller(layoutRoot.FindAnyWidget("panel"));
    Widget actions = m_Scroller.GetContentWidget();

    // Grid-Layout: 8 Zeilen, 1 Spalte
    m_PanelAlpha = UIActionManager.CreateGridSpacer(actions, 8, 1);

    // Standard-Widget-Typen
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

    // Unter-Grid für nebeneinander liegende Schaltflächen
    Widget gridButtons = UIActionManager.CreateGridSpacer(m_PanelAlpha, 1, 2);
    m_Button = UIActionManager.CreateButton(gridButtons, "Left", this, "OnClick_Left");
    m_NavButton = UIActionManager.CreateNavButton(gridButtons, "Right", ...);
}
```

Jeder `UIAction*`-Widget-Typ hat seine eigene Layout-Datei (z.B. `UIActionSlider.layout`, `UIActionCheckbox.layout`), die als Vorlage geladen wird. Der Factory-Ansatz bedeutet:

- Konsistente Größen und Abstände über alle Panels
- Keine Layout-Datei-Duplizierung
- Neue Aktionstypen können einmal hinzugefügt und überall verwendet werden

### ESP-Overlay (Zeichnen auf CanvasWidget)

COTs ESP-System zeichnet Labels, Lebensbalken und Linien direkt über die 3D-Welt mit `CanvasWidget`. Das Schlüsselmuster ist ein Bildschirm-großes `CanvasWidget`, das den gesamten Viewport bedeckt, mit einzelnen ESP-Widget-Handlern, die an projizierten Weltkoordinaten positioniert werden:

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

ESP-Widgets werden aus Vorlagen-Layouts (`esp_widget.layout`) erstellt und jeden Frame positioniert, indem 3D-Positionen in Bildschirmkoordinaten projiziert werden. Der Canvas selbst ist ein Vollbild-Overlay, das beim Start geladen wird.

### Bestätigungsdialoge

COT bietet ein callback-basiertes Bestätigungssystem, das in `JMFormBase` eingebaut ist. Bestätigungen werden mit benannten Callbacks erstellt:

```c
CreateConfirmation_Two(
    JMConfirmationType.INFO,
    "Are you sure?",
    "This will kick the player.",
    "#STR_COT_GENERIC_YES", "OnConfirmKick",
    "#STR_COT_GENERIC_NO", ""
);
```

Das `JMConfirmationForm` verwendet `CallByName`, um die Callback-Methode auf dem Formular aufzurufen:

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

Dies ermöglicht die Verkettung von Bestätigungen (eine Bestätigung öffnet eine andere), ohne den Ablauf fest zu codieren.

---

## VPP Admin Tools UI-Muster

VPP verfolgt einen anderen Ansatz als COT: Es verwendet `UIScriptedMenu` mit einer Toolbar-HUD, ziehbaren Unterfenstern und einem globalen Dialogbox-System.

### Toolbar-Schaltflächen-Registrierung

`VPPAdminHud` verwaltet eine Liste von Schaltflächendefinitionen. Jede Schaltfläche ordnet einen Berechtigungs-String einem Anzeigenamen, Icon und Tooltip zu:

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
        // ... 10 weitere Werkzeuge
        DefineButtons();

        // Berechtigungen beim Server über RPC verifizieren
        array<string> perms = new array<string>;
        for (int i = 0; i < m_DefinedButtons.Count(); i++)
            perms.Insert(m_DefinedButtons[i].param1);
        GetRPCManager().VSendRPC("RPC_PermitManager",
            "VerifyButtonsPermission", new Param1<ref array<string>>(perms), true);
    }
}
```

Externe Mods können `DefineButtons()` überschreiben, um eigene Toolbar-Schaltflächen hinzuzufügen, was VPP erweiterbar macht, ohne den Quellcode zu ändern.

### Untermenü-Fenster-System

Jedes Werkzeug-Panel erweitert `AdminHudSubMenu`, das ziehbares Fensterverhalten, Ein-/Ausblend-Umschaltung und Fensterpriorität-Verwaltung bietet:

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

    // Zieh-Unterstützung über Titelleiste
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

    // Doppelklick auf Titelleiste zum Maximieren/Wiederherstellen
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

**Wichtige Erkenntnis:** VPP erstellt einen Mini-Fenstermanager innerhalb von DayZ. Jedes Untermenü ist ein ziehbares, größenveränderbares Fenster mit Fokusverwaltung. Der `SetWindowPriorty()`-Aufruf passt die Z-Reihenfolge an, damit das angeklickte Fenster in den Vordergrund kommt.

### VPPDialogBox -- Callback-basierter Dialog

VPPs Dialogsystem verwendet einen Enum-gesteuerten Ansatz. Der Dialog zeigt/verbirgt Schaltflächen basierend auf einem Typ-Enum und leitet das Ergebnis über `CallFunction` weiter:

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

Der `ConfirmationEventHandler` umhüllt ein Schaltflächen-Widget, sodass ein Klick darauf einen Dialog erzeugt. Das Dialogergebnis wird über einen benannten Callback an jede Klasse weitergeleitet:

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

### PopUp mit OnWidgetScriptInit

VPP-Popup-Formulare binden sich an ihr Layout über `OnWidgetScriptInit` und verwenden `ScriptedWidgetEventHandler`:

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

**Wichtige Erkenntnis:** `delete this` beim Schließen ist das gängige Popup-Entsorgungsmuster. Der Destruktor ruft `m_root.Unlink()` auf, um den Widget-Baum zu entfernen. Dies ist sauber, erfordert aber Vorsicht -- wenn etwas eine Referenz auf das Popup nach der Löschung hält, erhalten Sie einen Null-Zugriff.

---

## DabsFramework UI-Muster

DabsFramework führt eine vollständige MVC-Architektur (Model-View-Controller) für die DayZ-UI ein. Es wird vom DayZ Editor und Expansion als UI-Grundlage verwendet.

### ViewController und Datenbindung

Die Kernidee: Anstatt manuell Widgets zu finden und ihren Text zu setzen, deklarieren Sie Eigenschaften auf einer Controller-Klasse und binden sie anhand des Namens an Widgets im Layout-Editor.

```c
class TestController: ViewController
{
    // Variablenname stimmt mit Binding_Name im Layout überein
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

Im Layout hat jedes Widget eine `ViewBinding`-Script-Klasse mit einer `Binding_Name`-Referenz-Eigenschaft, die auf den Variablennamen gesetzt ist (z.B. "TextBox1"). Wenn `NotifyPropertyChanged()` aufgerufen wird, findet das Framework alle ViewBindings mit diesem Namen und aktualisiert das Widget:

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

**Zwei-Wege-Bindung** bedeutet, dass Änderungen im Widget (Benutzereingabe) automatisch zur Controller-Eigenschaft zurückpropagiert werden.

### ObservableCollection -- Listen-Datenbindung

Für dynamische Listen bietet DabsFramework `ObservableCollection<T>`. Einfüge-/Entfernoperationen aktualisieren automatisch das gebundene Widget (z.B. einen WrapSpacer oder ScrollWidget):

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
        // Wird automatisch bei Insert/Remove aufgerufen
    }
}
```

Jedes `Insert()` feuert ein `CollectionChanged`-Event, das die ViewBinding abfängt, um Kind-Widgets zu erstellen/zu zerstören. Keine manuelle Widget-Verwaltung nötig.

### ScriptView -- Layout-aus-Code

`ScriptView` ist die reine Script-Alternative zu `OnWidgetScriptInit`. Sie erstellen eine Unterklasse, überschreiben `GetLayoutFile()` und instanziieren sie. Der Konstruktor lädt das Layout, findet den Controller und verbindet alles:

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

// Verwendung:
CustomDialogWindow window = new CustomDialogWindow();
```

Widget-Variablen, die als Felder in `ScriptView`-Unterklassen deklariert sind, werden automatisch durch Namensabgleich gegen die Layout-Hierarchie befüllt (`LoadWidgetsAsVariables`). Dies eliminiert `FindAnyWidget()`-Aufrufe.

### RelayCommand -- Schaltfläche-zu-Aktion-Bindung

Schaltflächen können an `RelayCommand`-Objekte über die `Relay_Command`-Referenz-Eigenschaft in ViewBinding gebunden werden. Dies entkoppelt Schaltflächen-Klicks von Handlern:

```c
class EditorCommand: RelayCommand
{
    override bool Execute(Class sender, CommandArgs args)
    {
        // Aktion ausführen
        return true;
    }

    override bool CanExecute()
    {
        // Schaltfläche aktivieren/deaktivieren
        return true;
    }

    override void CanExecuteChanged(bool state)
    {
        // Widget ausgrauen wenn deaktiviert
        if (m_ViewBinding)
        {
            Widget root = m_ViewBinding.GetLayoutRoot();
            root.SetAlpha(state ? 1 : 0.15);
            root.Enable(state);
        }
    }
}
```

**Wichtige Erkenntnis:** DabsFramework eliminiert Boilerplate-Code. Sie deklarieren Daten, binden sie per Name, und das Framework übernimmt die Synchronisierung. Die Kosten sind die Lernkurve und die Framework-Abhängigkeit.

---

## Colorful UI-Muster

Colorful UI ersetzt Vanilla-DayZ-Menüs durch thematisierte Versionen, ohne Vanilla-Script-Dateien zu modifizieren. Sein Ansatz basiert vollständig auf `modded class`-Overrides und einem zentralisierten Farb-/Branding-System.

### 3-Schichten-Themensystem

Farben sind in drei Ebenen organisiert:

**Schicht 1 -- UIColor (Basispalette):** Rohe Farbwerte mit semantischen Namen.

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

**Schicht 2 -- colorScheme (semantische Zuordnung):** Ordnet UI-Konzepte Palette-Farben zu. Serverbetreiber ändern diese Schicht, um ihren Server zu thematisieren.

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

**Schicht 3 -- Branding/Settings (Serveridentität):** Logo-Pfade, URLs, Feature-Schalter.

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

### Nicht-destruktive Vanilla-UI-Modifikation

Colorful UI ersetzt Vanilla-Menüs mit `modded class`. Jede Vanilla-`UIScriptedMenu`-Unterklasse wird modifiziert, um eine benutzerdefinierte Layout-Datei zu laden und Theme-Farben anzuwenden:

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

        // Theme-Farben anwenden
        if (m_TopShader) m_TopShader.SetColor(colorScheme.TopShader());
        if (m_BottomShader) m_BottomShader.SetColor(colorScheme.BottomShader());
        if (m_MenuDivider) m_MenuDivider.SetColor(colorScheme.Separator());

        Branding.ApplyLogo(m_Logo);

        return layoutRoot;
    }
}
```

Dieses Muster ist wichtig: Colorful UI liefert komplett eigene `.layout`-Dateien, die Vanilla-Widget-Namen spiegeln. Das `modded class`-Override tauscht den Layout-Pfad, behält aber Vanilla-Widget-Namen bei, sodass Vanilla-Code, der diese Widget-Namen referenziert, weiterhin funktioniert.

### Auflösungsbewusste Layout-Varianten

Colorful UI bietet separate Inventar-Layout-Verzeichnisse für verschiedene Bildschirmbreiten:

```
GUI/layouts/inventory/narrow/   -- kleine Bildschirme
GUI/layouts/inventory/medium/   -- Standard 1080p
GUI/layouts/inventory/wide/     -- Ultrawide
```

Jedes Verzeichnis enthält die gleichen Dateinamen (`cargo_container.layout`, `left_area.layout` usw.) mit angepassten Größen. Die richtige Variante wird zur Laufzeit basierend auf der Bildschirmauflösung ausgewählt.

### Konfiguration über statische Variablen

Serverbetreiber konfigurieren Colorful UI durch Bearbeitung statischer Variablenwerte in `Settings.c`:

```c
static bool StartMainMenu    = true;
static bool NoHints          = false;
static bool LoadVideo        = true;
static bool ShowDeadScreen   = false;
static bool CuiDebug         = true;
```

Dies ist das einfachste mögliche Konfigurationssystem: Script bearbeiten, PBO neu erstellen. Kein JSON-Laden, kein Config-Manager. Für eine rein clientseitige visuelle Mod ist dies angemessen.

**Wichtige Erkenntnis:** Colorful UI demonstriert, dass Sie den gesamten DayZ-Client umgestalten können, ohne serverseitigen Code, nur mit `modded class`-Overrides, benutzerdefinierten Layout-Dateien und einem zentralisierten Farbsystem.

---

## Expansion UI-Muster

DayZ Expansion ist das größte Community-Mod-Ökosystem. Seine UI reicht von Benachrichtigungs-Toasts bis hin zu vollständigen Markt-Handelsschnittstellen mit Serversynchronisation.

### Benachrichtigungssystem (Mehrere Typen)

Expansion definiert sechs visuelle Benachrichtigungstypen, jeder mit eigenem Layout:

```c
enum ExpansionNotificationType
{
    TOAST    = 1,    // Kleines Eck-Popup
    BAGUETTE = 2,   // Breites Banner über dem Bildschirm
    ACTIVITY = 4,   // Aktivitäts-Feed-Eintrag
    KILLFEED = 8,   // Kill-Ankündigung
    MARKET   = 16,  // Markttransaktions-Ergebnis
    GARAGE   = 32   // Fahrzeugabstell-Ergebnis
}
```

Benachrichtigungen werden von überall (Client oder Server) über eine statische API erstellt:

```c
// Vom Server, an bestimmten Spieler via RPC gesendet:
NotificationSystem.Create_Expansion(
    "Trade Complete",          // Titel
    "You purchased M4A1",     // Text
    "market_icon",             // Icon-Name
    ARGB(255, 50, 200, 50),   // Farbe
    7,                         // Anzeigezeit (Sekunden)
    sendTo,                    // PlayerIdentity (null = alle)
    ExpansionNotificationType.MARKET  // Typ
);
```

Das Benachrichtigungsmodul verwaltet eine Liste aktiver Benachrichtigungen und steuert deren Lifecycle. Jede `ExpansionNotificationView` (eine `ScriptView`-Unterklasse) behandelt ihre eigene Ein-/Ausblend-Animation:

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

Jeder Benachrichtigungstyp hat eine separate Layout-Datei (`expansion_notification_toast.layout`, `expansion_notification_killfeed.layout` usw.), die völlig verschiedene visuelle Behandlungen ermöglicht.

### Markt-Menü (Komplexes interaktives Panel)

Das `ExpansionMarketMenu` ist eine der komplexesten UIs in jeder DayZ-Mod. Es erweitert `ExpansionScriptViewMenu` (das DabsFrameworks ScriptView erweitert) und verwaltet:

- Kategoriebaum mit einklappbaren Abschnitten
- Gegenstands-Grid mit Suchfilterung
- Kauf-/Verkaufspreisanzeige mit Währungssymbolen
- Mengensteuerung
- Gegenstandsvorschau-Widget
- Spielerinventar-Vorschau
- Dropdown-Auswahl für Skins
- Anbauteil-Konfigurations-Checkboxen
- Bestätigungsdialoge für Käufe/Verkäufe

```c
class ExpansionMarketMenu: ExpansionScriptViewMenu
{
    protected ref ExpansionMarketMenuController m_MarketMenuController;
    protected ref ExpansionMarketModule m_MarketModule;
    protected ref ExpansionMarketItem m_SelectedMarketItem;

    // Direkte Widget-Referenzen (automatisch von ScriptView befüllt)
    protected EditBoxWidget market_filter_box;
    protected ButtonWidget market_item_buy;
    protected ButtonWidget market_item_sell;
    protected ScrollWidget market_categories_scroller;
    protected ItemPreviewWidget market_item_preview;
    protected PlayerPreviewWidget market_player_preview;

    // Zustandsverfolgung
    protected int m_Quantity = 1;
    protected int m_BuyPrice;
    protected int m_SellPrice;
    protected ExpansionMarketMenuState m_CurrentState;
}
```

**Wichtige Erkenntnis:** Für komplexe interaktive UIs kombiniert Expansion DabsFrameworks MVC mit traditionellen Widget-Referenzen. Der Controller behandelt Datenbindung für Listen und Text, während direkte Widget-Referenzen spezialisierte Widgets wie `ItemPreviewWidget` und `PlayerPreviewWidget` behandeln, die imperative Steuerung benötigen.

### ExpansionScriptViewMenu -- Menü-Lifecycle

Expansion umhüllt ScriptView in einer Menü-Basisklasse, die Eingabesperre, Unschärfe-Effekte und Update-Timer behandelt:

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

Dies stellt sicher, dass jedes Expansion-Menü konsistent die Spielerbewegung sperrt, den Cursor zeigt, Hintergrund-Unschärfe anwendet und beim Schließen aufräumt.

---

## DayZ Editor UI-Muster

DayZ Editor ist ein vollständiges Objektplatzierungs-Tool, das als DayZ-Mod erstellt wurde. Es nutzt DabsFramework umfangreich und implementiert Muster, die typischerweise in Desktop-Anwendungen zu finden sind: Werkzeugleisten, Menüs, Eigenschaftsinspektoren, Befehlssystem mit Undo/Redo.

### Befehlsmuster mit Tastenkombinationen

Das Befehlssystem des Editors entkoppelt Aktionen von UI-Elementen. Jede Aktion (Neu, Öffnen, Speichern, Rückgängig, Wiederholen, Löschen usw.) ist eine `EditorCommand`-Unterklasse:

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

Der `EditorCommandManager` registriert alle Befehle und ordnet Tastenkombinationen zu:

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

Befehle integrieren sich mit DabsFrameworks `RelayCommand`, sodass Toolbar-Schaltflächen automatisch ausgegraut werden, wenn `CanExecute()` false zurückgibt.

### Menüleisten-System

Der Editor erstellt seine Menüleiste (Datei, Bearbeiten, Ansicht, Editor) mit einer beobachtbaren Sammlung von Menüeinträgen. Jedes Menü ist eine `ScriptView`-Unterklasse:

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

Die `ObservableCollection` erstellt automatisch die visuellen Menüeinträge, wenn Befehle eingefügt werden.

### HUD mit datengebundenen Panels

Der Editor-HUD-Controller verwendet `ObservableCollection` für alle Listenpanels:

```c
class EditorHudController: EditorControllerBase
{
    // Objektlisten an Seitenleisten-Panels gebunden
    ref ObservableCollection<ref EditorPlaceableListItem> LeftbarSpacerConfig;
    ref ObservableCollection<EditorListItem> RightbarPlacedData;
    ref ObservableCollection<EditorPlayerListItem> RightbarPlayerData;

    // Logeinträge mit Maximalanzahl
    static const int MAX_LOG_ENTRIES = 20;
    ref ObservableCollection<ref EditorLogEntry> EditorLogEntries;

    // Kamerafahrt-Keyframes
    ref ObservableCollection<ref EditorCameraTrackListItem> CameraTrackData;
}
```

Ein Objekt zur Szene hinzuzufügen fügt es automatisch zur Seitenleistenliste hinzu. Löschen entfernt es. Keine manuelle Widget-Erstellung/Zerstörung.

### Theming über Widget-Namenslisten

Der Editor zentralisiert thematisierte Widgets mithilfe eines statischen Arrays von Widget-Namen:

```c
static const ref array<string> ThemedWidgetStrings = {
    "LeftbarPanelSearchBarIconButton",
    "FavoritesTabButton",
    "ShowPrivateButton",
    // ...
};
```

Ein Theming-Durchlauf iteriert dieses Array und wendet Farben aus `EditorSettings` an, wodurch verstreute `SetColor()`-Aufrufe in der gesamten Codebasis vermieden werden.

---

## Allgemeine UI-Architekturmuster

Diese Muster erscheinen in mehreren Mods. Sie repräsentieren den Konsens der Community, wie wiederkehrende DayZ-UI-Probleme gelöst werden.

### Panel-Manager (Anzeigen/Verbergen nach Name oder Typ)

Sowohl VPP als auch COT verwalten ein Register von UI-Panels, zugänglich nach Typename:

```c
// VPP-Muster
VPPScriptedMenu GetMenuByType(typename menuType)
{
    foreach (VPPScriptedMenu menu : M_SCRIPTED_UI_INSTANCES)
    {
        if (menu && menu.GetType() == menuType)
            return menu;
    }
    return NULL;
}

// COT-Muster
void ToggleShow()
{
    if (IsVisible())
        Close();
    else
        Show();
}
```

Dies verhindert doppelte Panels und bietet einen einzigen Kontrollpunkt für die Sichtbarkeit.

### Widget-Recycling für Listen

Bei der Anzeige großer Listen (Spielerlisten, Gegenstandskataloge, Objekt-Browser) vermeiden Mods das Erstellen/Zerstören von Widgets bei jedem Update. Stattdessen halten sie einen Pool vor:

```c
// Vereinfachtes Muster, das in Mods verwendet wird
void UpdatePlayerList(array<PlayerInfo> players)
{
    // Überschüssige Widgets ausblenden
    for (int i = players.Count(); i < m_PlayerWidgets.Count(); i++)
        m_PlayerWidgets[i].Show(false);

    // Neue Widgets nur bei Bedarf erstellen
    while (m_PlayerWidgets.Count() < players.Count())
    {
        Widget w = GetGame().GetWorkspace().CreateWidgets(PLAYER_ENTRY_LAYOUT, m_ListParent);
        m_PlayerWidgets.Insert(w);
    }

    // Sichtbare Widgets mit Daten aktualisieren
    for (int j = 0; j < players.Count(); j++)
    {
        m_PlayerWidgets[j].Show(true);
        SetPlayerData(m_PlayerWidgets[j], players[j]);
    }
}
```

DabsFrameworks `ObservableCollection` behandelt dies automatisch, aber manuelle Implementierungen verwenden dieses Muster.

### Verzögerte Widget-Erstellung

Mehrere Mods verzögern die Widget-Erstellung bis zum ersten Anzeigen:

```c
// VPP-Muster
override Widget Init()
{
    if (!m_Init)
    {
        layoutRoot = GetGame().GetWorkspace().CreateWidgets(VPPATUIConstants.VPPAdminHud);
        m_Init = true;
        return layoutRoot;
    }
    // Nachfolgende Aufrufe überspringen die Erstellung
    return layoutRoot;
}
```

Dies vermeidet das Laden aller Admin-Panels beim Start, wenn die meisten nie geöffnet werden.

### Event-Delegation durch Handler-Ketten

Ein häufiges Muster ist ein übergeordneter Handler, der an Kind-Handler delegiert:

```c
// Übergeordnetes Element behandelt Klick, leitet an das entsprechende Kind weiter
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_closeButton)
    {
        HideSubMenu();
        return true;
    }

    // An aktives Werkzeug-Panel delegieren
    if (m_ActivePanel)
        return m_ActivePanel.OnClick(w, x, y, button);

    return false;
}
```

### OnWidgetScriptInit als universeller Einstiegspunkt

Jede untersuchte Mod verwendet `OnWidgetScriptInit` als Mechanismus zur Bindung von Layout an Script:

```c
void OnWidgetScriptInit(Widget w)
{
    m_root = w;
    m_root.SetHandler(this);

    // Kind-Widgets finden
    m_Button = ButtonWidget.Cast(m_root.FindAnyWidget("button_name"));
    m_Text = TextWidget.Cast(m_root.FindAnyWidget("text_name"));
}
```

Dies wird über die `scriptclass`-Eigenschaft in der Layout-Datei festgelegt. Die Engine ruft `OnWidgetScriptInit` automatisch auf, wenn `CreateWidgets()` ein Widget mit einer Script-Klasse verarbeitet.

---

## Anti-Muster, die vermieden werden sollten

Diese Fehler erscheinen in echtem Mod-Code und verursachen Leistungsprobleme oder Abstürze.

### Widgets jeden Frame erstellen

```c
// SCHLECHT: Erstellt neue Widgets bei jedem Update-Aufruf
override void Update(float dt)
{
    Widget label = GetGame().GetWorkspace().CreateWidgets("label.layout", m_Parent);
    TextWidget.Cast(label.FindAnyWidget("text")).SetText(m_Value);
}
```

Widget-Erstellung reserviert Speicher und löst Layout-Neuberechnung aus. Bei 60 FPS erstellt dies 60 Widgets pro Sekunde. Immer einmal erstellen und vor Ort aktualisieren.

### Event-Handler nicht aufräumen

```c
// SCHLECHT: Insert ohne entsprechendes Remove
void OnInit()
{
    GetGame().GetUpdateQueue(CALL_CATEGORY_GUI).Insert(Update);
    JMScriptInvokers.ESP_VIEWTYPE_CHANGED.Insert(OnESPViewTypeChanged);
}

// Fehlt im Destruktor:
// GetGame().GetUpdateQueue(CALL_CATEGORY_GUI).Remove(Update);
// JMScriptInvokers.ESP_VIEWTYPE_CHANGED.Remove(OnESPViewTypeChanged);
```

Jedes `Insert` auf einem `ScriptInvoker` oder Update-Queue benötigt ein passendes `Remove` im Destruktor. Verwaiste Handler verursachen Aufrufe auf gelöschte Objekte und Null-Zugriff-Abstürze.

### Pixel-Positionen fest codieren

```c
// SCHLECHT: Funktioniert bei verschiedenen Auflösungen nicht
m_Panel.SetPos(540, 320);
m_Panel.SetSize(400, 300);
```

Verwenden Sie immer proportionale (0.0-1.0) Positionierung oder lassen Sie Container-Widgets das Layout verwalten. Pixel-Positionen funktionieren nur bei der Auflösung, für die sie entworfen wurden.

### Tiefe Widget-Verschachtelung ohne Zweck

```
Frame -> Panel -> Frame -> Panel -> Frame -> TextWidget
```

Jede Verschachtelungsebene erhöht den Layout-Berechnungs-Overhead. Wenn ein Zwischen-Widget keinem Zweck dient (kein Hintergrund, keine Größenbeschränkung, keine Event-Behandlung), entfernen Sie es. Hierarchien wo möglich flach halten.

### Fokusverwaltung ignorieren

```c
// SCHLECHT: Öffnet Dialog, setzt aber keinen Fokus
void ShowDialog()
{
    m_Dialog.Show(true);
    // Fehlend: SetFocus(m_Dialog.GetLayoutRoot());
}
```

Ohne `SetFocus()` gehen Tastaturereignisse möglicherweise noch an Widgets hinter dem Dialog. Expansions Ansatz ist korrekt:

```c
override void OnShow()
{
    SetFocus(GetLayoutRoot());
}
```

### Widget-Aufräumung bei Zerstörung vergessen

```c
// SCHLECHT: Widget-Baum leckt, wenn Script-Objekt zerstört wird
void ~MyPanel()
{
    // m_root.Unlink() fehlt!
}
```

Wenn Sie Widgets mit `CreateWidgets()` erstellen, gehören sie Ihnen. Rufen Sie `Unlink()` auf dem Root in Ihrem Destruktor auf. `ScriptView` und `UIScriptedMenu` behandeln dies automatisch, aber rohe `ScriptedWidgetEventHandler`-Unterklassen müssen es manuell tun.

---

## Zusammenfassung: Welches Muster wann verwenden

| Bedarf | Empfohlenes Muster | Quell-Mod |
|--------|-------------------|------------|
| Einfaches Werkzeug-Panel | `ScriptedWidgetEventHandler` + `OnWidgetScriptInit` | VPP |
| Komplexe datengebundene UI | `ScriptView` + `ViewController` + `ObservableCollection` | DabsFramework |
| Admin-Panel-System | Modul + Formular + Fenster (Modul-Registrierungsmuster) | COT |
| Ziehbare Unterfenster | `AdminHudSubMenu` (Titelleisten-Zieh-Behandlung) | VPP |
| Bestätigungsdialog | `VPPDialogBox` oder `JMConfirmation` (callback-basiert) | VPP / COT |
| Popup mit Eingabe | `PopUpCreatePreset`-Muster (`delete this` beim Schließen) | VPP |
| Vollbild-Menü | `ExpansionScriptViewMenu` (Steuerungssperre, Unschärfe, Timer) | Expansion |
| Theme-/Farbsystem | 3-Schichten (Palette, Schema, Branding) mit `modded class` | Colorful UI |
| Vanilla-UI-Override | `modded class` + Ersatz-`.layout`-Dateien | Colorful UI |
| Benachrichtigungssystem | Typ-Enum + Layout pro Typ + statische Erstellungs-API | Expansion |
| Toolbar-Befehlssystem | `EditorCommand` + `EditorCommandManager` + Tastenkombinationen | DayZ Editor |
| Menüleiste mit Einträgen | `EditorMenu` + `ObservableCollection<EditorMenuItem>` | DayZ Editor |
| ESP/HUD-Overlay | Vollbild-`CanvasWidget` + projizierte Widget-Positionierung | COT |
| Auflösungsvarianten | Separate Layout-Verzeichnisse (narrow/medium/wide) | Colorful UI |
| Große Listen-Leistung | Widget-Recycling-Pool (ausblenden/anzeigen, bei Bedarf erstellen) | Allgemein |
| Konfiguration | Statische Variablen (Client-Mod) oder JSON über Config-Manager | Colorful UI |

### Entscheidungs-Flussdiagramm

1. **Ist es ein einmaliges einfaches Panel?** Verwenden Sie `ScriptedWidgetEventHandler` mit `OnWidgetScriptInit`. Erstellen Sie das Layout im Editor, finden Sie Widgets per Name.

2. **Hat es dynamische Listen oder häufig wechselnde Daten?** Verwenden Sie DabsFrameworks `ViewController` mit `ObservableCollection`. Die Datenbindung eliminiert manuelle Widget-Updates.

3. **Ist es Teil eines Multi-Panel-Admin-Tools?** Verwenden Sie das COT-Modul-Formular-Muster. Jedes Werkzeug ist eigenständig mit eigenem Modul, Formular und Layout. Registrierung ist eine einzelne Zeile.

4. **Muss es Vanilla-UI ersetzen?** Verwenden Sie das Colorful-UI-Muster: `modded class`, benutzerdefinierte Layout-Datei, zentralisiertes Farbschema.

5. **Braucht es Server-zu-Client-Datensynchronisation?** Kombinieren Sie ein beliebiges Muster oben mit RPC. Expansions Markt-Menü zeigt, wie Ladezustände, Anfrage-/Antwortzyklen und Update-Timer innerhalb einer ScriptView verwaltet werden.

6. **Braucht es Undo/Redo oder komplexe Interaktion?** Verwenden Sie das Befehlsmuster vom DayZ Editor. Befehle entkoppeln Aktionen von Schaltflächen, unterstützen Tastenkombinationen und integrieren sich mit DabsFrameworks `RelayCommand` für automatisches Aktivieren/Deaktivieren.

---

*Nächstes Kapitel: [Erweiterte Widgets](10-advanced-widgets.md) -- RichTextWidget-Formatierung, CanvasWidget-Zeichnung, MapWidget-Markierungen, ItemPreviewWidget, PlayerPreviewWidget, VideoWidget und RenderTargetWidget.*
