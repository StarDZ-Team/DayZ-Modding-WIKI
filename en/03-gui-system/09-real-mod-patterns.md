# Chapter 3.9: Real Mod UI Patterns

[Home](../README.md) | [<< Previous: Dialogs & Modals](08-dialogs-modals.md) | **Real Mod UI Patterns** | [Next: Advanced Widgets >>](10-advanced-widgets.md)

---

This chapter surveys UI patterns found in six professional DayZ mods: COT (Community Online Tools), VPP Admin Tools, DabsFramework, Colorful UI, Expansion, and DayZ Editor. Each mod solves different problems. Studying their approaches gives you a library of proven patterns beyond what official documentation covers.

All code shown is extracted from actual mod source. File paths reference the original repositories.

---

## Why Study Real Mods?

DayZ documentation explains individual widgets and event callbacks but says nothing about:

- How to manage 12 admin panels without code duplication
- How to build a dialog system with callback routing
- How to theme an entire UI without touching vanilla layout files
- How to synchronize a market grid with server data over RPC
- How to structure an editor with undo/redo and a command system

These are architecture problems. Every large mod invents solutions for them. Some are elegant, some are cautionary tales. This chapter maps the patterns so you can pick the right approach for your project.

---

## COT (Community Online Tools) UI Patterns

COT is the most widely-used DayZ admin tool. Its UI architecture is built around a module-form-window system where each tool (ESP, Player Manager, Teleport, Object Spawner, etc.) is a self-contained module with its own panel.

### Module-Form-Window Architecture

COT separates concerns into three layers:

1. **JMRenderableModuleBase** -- Declares the module's metadata (title, icon, layout path, permissions). Manages the CF_Window lifecycle. Does not contain UI logic.
2. **JMFormBase** -- The actual UI panel. Extends `ScriptedWidgetEventHandler`. Receives widget events, builds UI elements, talks to the module for data operations.
3. **CF_Window** -- The windowing container provided by the CF framework. Handles drag, resize, close chrome.

A module declares itself with overrides:

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

The module is registered in a central constructor that builds the module list:

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

When `Show()` is called on a module, it creates a window and loads the form:

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

The form's `Init` binds the module reference through a protected override:

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
        // Build UI elements programmatically using UIActionManager
    }
}
```

**Key takeaway:** Each tool is entirely self-contained. Adding a new admin tool means creating one Module class, one Form class, one layout file, and inserting one line in the constructor. No existing code changes.

### Programmatic UI with UIActionManager

COT does not build complex forms in layout files. Instead, it uses a factory class (`UIActionManager`) that creates standardized UI action widgets at runtime:

```c
override void OnInit()
{
    m_Scroller = UIActionManager.CreateScroller(layoutRoot.FindAnyWidget("panel"));
    Widget actions = m_Scroller.GetContentWidget();

    // Grid layout: 8 rows, 1 column
    m_PanelAlpha = UIActionManager.CreateGridSpacer(actions, 8, 1);

    // Standard widget types
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

    // Sub-grid for side-by-side buttons
    Widget gridButtons = UIActionManager.CreateGridSpacer(m_PanelAlpha, 1, 2);
    m_Button = UIActionManager.CreateButton(gridButtons, "Left", this, "OnClick_Left");
    m_NavButton = UIActionManager.CreateNavButton(gridButtons, "Right", ...);
}
```

Each `UIAction*` widget type has its own layout file (e.g., `UIActionSlider.layout`, `UIActionCheckbox.layout`) loaded as a prefab. The factory approach means:

- Consistent sizing and spacing across all panels
- No layout file duplication
- New action types can be added once and used everywhere

### ESP Overlay (Drawing on CanvasWidget)

COT's ESP system draws labels, health bars, and lines directly over the 3D world using `CanvasWidget`. The key pattern is a screen-space `CanvasWidget` that covers the entire viewport, with individual ESP widget handlers positioned at projected world coordinates:

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

ESP widgets are created from prefab layouts (`esp_widget.layout`) and positioned each frame by projecting 3D positions to screen coordinates. The canvas itself is a fullscreen overlay loaded at startup.

### Confirmation Dialogs

COT provides a callback-based confirmation system built into `JMFormBase`. Confirmations are created with named callbacks:

```c
CreateConfirmation_Two(
    JMConfirmationType.INFO,
    "Are you sure?",
    "This will kick the player.",
    "#STR_COT_GENERIC_YES", "OnConfirmKick",
    "#STR_COT_GENERIC_NO", ""
);
```

The `JMConfirmationForm` uses `CallByName` to invoke the callback method on the form:

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

This allows chaining confirmations (one confirmation opens another) without hardcoding the flow.

---

## VPP Admin Tools UI Patterns

VPP takes a different approach from COT: it uses `UIScriptedMenu` with a toolbar HUD, draggable sub-windows, and a global dialog box system.

### Toolbar Button Registration

`VPPAdminHud` maintains a list of button definitions. Each button maps a permission string to a display name, icon, and tooltip:

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
        // ... 10 more tools
        DefineButtons();

        // Verify permissions with server via RPC
        array<string> perms = new array<string>;
        for (int i = 0; i < m_DefinedButtons.Count(); i++)
            perms.Insert(m_DefinedButtons[i].param1);
        GetRPCManager().VSendRPC("RPC_PermitManager",
            "VerifyButtonsPermission", new Param1<ref array<string>>(perms), true);
    }
}
```

External mods can override `DefineButtons()` to add their own toolbar buttons, making VPP extensible without modifying its source.

### Sub-Menu Window System

Each tool panel extends `AdminHudSubMenu`, which provides draggable window behavior, show/hide toggling, and window priority management:

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

    // Drag support via title bar
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

    // Double-click title bar to maximize/restore
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

**Key takeaway:** VPP builds a mini window manager inside DayZ. Each sub-menu is a draggable, resizable window with focus management. The `SetWindowPriorty()` call adjusts z-order so the clicked window comes to front.

### VPPDialogBox -- Callback-based Dialog

VPP's dialog system uses an enum-driven approach. The dialog shows/hides buttons based on a type enum, and routes the result through `CallFunction`:

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

The `ConfirmationEventHandler` wraps a button widget so clicking it spawns a dialog. The dialog result is forwarded to any class via a named callback:

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

### PopUp with OnWidgetScriptInit

VPP popup forms bind to their layout via `OnWidgetScriptInit` and use `ScriptedWidgetEventHandler`:

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

**Key takeaway:** `delete this` on close is the common popup disposal pattern. The destructor calls `m_root.Unlink()` to remove the widget tree. This is clean but requires care -- if anything holds a reference to the popup after deletion, you get a null access.

---

## DabsFramework UI Patterns

DabsFramework introduces a full MVC (Model-View-Controller) architecture for DayZ UI. It is used by DayZ Editor and Expansion as their UI foundation.

### ViewController and Data Binding

The core idea: instead of manually finding widgets and setting their text, you declare properties on a controller class and bind them to widgets by name in the layout editor.

```c
class TestController: ViewController
{
    // Variable name matches Binding_Name in the layout
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

In the layout, each widget has a `ViewBinding` script class with a `Binding_Name` reference property set to the variable name (e.g., "TextBox1"). When `NotifyPropertyChanged()` is called, the framework finds all ViewBindings with that name and updates the widget:

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

**Two-way binding** means changes in the widget (user typing) propagate back to the controller property automatically.

### ObservableCollection -- List Data Binding

For dynamic lists, DabsFramework provides `ObservableCollection<T>`. Insert/remove operations automatically update the bound widget (e.g., a WrapSpacer or ScrollWidget):

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
        // Called automatically on Insert/Remove
    }
}
```

Each `Insert()` fires a `CollectionChanged` event, which the ViewBinding intercepts to create/destroy child widgets. No manual widget management needed.

### ScriptView -- Layout-from-Code

`ScriptView` is the all-script alternative to `OnWidgetScriptInit`. You subclass it, override `GetLayoutFile()`, and instantiate it. The constructor loads the layout, finds the controller, and wires everything:

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

// Usage:
CustomDialogWindow window = new CustomDialogWindow();
```

Widget variables declared as fields on `ScriptView` subclasses are auto-populated by name matching against the layout hierarchy (`LoadWidgetsAsVariables`). This eliminates `FindAnyWidget()` calls.

### RelayCommand -- Button-to-Action Binding

Buttons can be bound to `RelayCommand` objects via the `Relay_Command` reference property in ViewBinding. This decouples button clicks from handlers:

```c
class EditorCommand: RelayCommand
{
    override bool Execute(Class sender, CommandArgs args)
    {
        // Perform action
        return true;
    }

    override bool CanExecute()
    {
        // Enable/disable the button
        return true;
    }

    override void CanExecuteChanged(bool state)
    {
        // Grey out the widget when disabled
        if (m_ViewBinding)
        {
            Widget root = m_ViewBinding.GetLayoutRoot();
            root.SetAlpha(state ? 1 : 0.15);
            root.Enable(state);
        }
    }
}
```

**Key takeaway:** DabsFramework eliminates boilerplate. You declare data, bind it by name, and the framework handles synchronization. The cost is the learning curve and the framework dependency.

---

## Colorful UI Patterns

Colorful UI replaces vanilla DayZ menus with themed versions without modifying vanilla script files. Its approach is entirely based on `modded class` overrides and a centralized color/branding system.

### 3-Layer Theme System

Colors are organized in three tiers:

**Layer 1 -- UIColor (base palette):** Raw color values with semantic names.

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

**Layer 2 -- colorScheme (semantic mapping):** Maps UI concepts to palette colors. Server owners change this layer to theme their server.

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

**Layer 3 -- Branding/Settings (server identity):** Logo paths, URLs, feature toggles.

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

### Non-Destructive Vanilla UI Modification

Colorful UI replaces vanilla menus using `modded class`. Each vanilla `UIScriptedMenu` subclass is modded to load a custom layout file and apply theme colors:

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

        // Apply theme colors
        if (m_TopShader) m_TopShader.SetColor(colorScheme.TopShader());
        if (m_BottomShader) m_BottomShader.SetColor(colorScheme.BottomShader());
        if (m_MenuDivider) m_MenuDivider.SetColor(colorScheme.Separator());

        Branding.ApplyLogo(m_Logo);

        return layoutRoot;
    }
}
```

This pattern is important: Colorful UI ships entirely custom `.layout` files that mirror vanilla widget names. The `modded class` override swaps the layout path but keeps vanilla widget names so that if any vanilla code references those widget names, it still works.

### Resolution-Aware Layout Variants

Colorful UI provides separate inventory layout directories for different screen widths:

```
GUI/layouts/inventory/narrow/   -- small screens
GUI/layouts/inventory/medium/   -- standard 1080p
GUI/layouts/inventory/wide/     -- ultrawide
```

Each directory contains the same file names (`cargo_container.layout`, `left_area.layout`, etc.) with adjusted sizing. The correct variant is selected at runtime based on screen resolution.

### Configuration via Static Variables

Server owners configure Colorful UI by editing static variable values in `Settings.c`:

```c
static bool StartMainMenu    = true;
static bool NoHints          = false;
static bool LoadVideo        = true;
static bool ShowDeadScreen   = false;
static bool CuiDebug         = true;
```

This is the simplest possible config system: edit the script, rebuild PBO. No JSON loading, no config manager. For a client-only visual mod, this is appropriate.

**Key takeaway:** Colorful UI demonstrates that you can retheme the entire DayZ client without server-side code, using only `modded class` overrides, custom layout files, and a centralized color system.

---

## Expansion UI Patterns

DayZ Expansion is the largest community mod ecosystem. Its UI ranges from notification toasts to full market trading interfaces with server synchronization.

### Notification System (Multiple Types)

Expansion defines six notification visual types, each with its own layout:

```c
enum ExpansionNotificationType
{
    TOAST    = 1,    // Small corner popup
    BAGUETTE = 2,   // Wide banner across screen
    ACTIVITY = 4,   // Activity feed entry
    KILLFEED = 8,   // Kill announcement
    MARKET   = 16,  // Market transaction result
    GARAGE   = 32   // Vehicle storage result
}
```

Notifications are created from anywhere (client or server) using a static API:

```c
// From server, sent to specific player via RPC:
NotificationSystem.Create_Expansion(
    "Trade Complete",          // title
    "You purchased M4A1",     // text
    "market_icon",             // icon name
    ARGB(255, 50, 200, 50),   // color
    7,                         // display time (seconds)
    sendTo,                    // PlayerIdentity (null = all)
    ExpansionNotificationType.MARKET  // type
);
```

The notification module maintains a list of active notifications and manages their lifecycle. Each `ExpansionNotificationView` (a `ScriptView` subclass) handles its own show/hide animation:

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

Each notification type has a separate layout file (`expansion_notification_toast.layout`, `expansion_notification_killfeed.layout`, etc.) allowing completely different visual treatments.

### Market Menu (Complex Interactive Panel)

The `ExpansionMarketMenu` is one of the most complex UIs in any DayZ mod. It extends `ExpansionScriptViewMenu` (which extends DabsFramework's ScriptView) and manages:

- Category tree with collapsible sections
- Item grid with search filtering
- Buy/sell price display with currency icons
- Quantity controls
- Item preview widget
- Player inventory preview
- Dropdown selectors for skins
- Attachment configuration checkboxes
- Confirmation dialogs for purchases/sales

```c
class ExpansionMarketMenu: ExpansionScriptViewMenu
{
    protected ref ExpansionMarketMenuController m_MarketMenuController;
    protected ref ExpansionMarketModule m_MarketModule;
    protected ref ExpansionMarketItem m_SelectedMarketItem;

    // Direct widget references (auto-populated by ScriptView)
    protected EditBoxWidget market_filter_box;
    protected ButtonWidget market_item_buy;
    protected ButtonWidget market_item_sell;
    protected ScrollWidget market_categories_scroller;
    protected ItemPreviewWidget market_item_preview;
    protected PlayerPreviewWidget market_player_preview;

    // State tracking
    protected int m_Quantity = 1;
    protected int m_BuyPrice;
    protected int m_SellPrice;
    protected ExpansionMarketMenuState m_CurrentState;
}
```

**Key takeaway:** For complex interactive UIs, Expansion combines DabsFramework's MVC with traditional widget references. The controller handles data binding for lists and text, while direct widget references handle specialized widgets like `ItemPreviewWidget` and `PlayerPreviewWidget` that need imperative control.

### ExpansionScriptViewMenu -- Menu Lifecycle

Expansion wraps ScriptView in a menu base class that handles input locking, blur effects, and update timers:

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

This ensures every Expansion menu consistently locks player movement, shows cursor, applies background blur, and cleans up on close.

---

## DayZ Editor UI Patterns

DayZ Editor is a full object placement tool built as a DayZ mod. It uses DabsFramework extensively and implements patterns typically found in desktop applications: toolbars, menus, property inspectors, command system with undo/redo.

### Command Pattern with Keyboard Shortcuts

The Editor's command system decouples actions from UI elements. Each action (New, Open, Save, Undo, Redo, Delete, etc.) is an `EditorCommand` subclass:

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

The `EditorCommandManager` registers all commands and maps shortcuts:

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

Commands integrate with DabsFramework's `RelayCommand` so toolbar buttons automatically grey out when `CanExecute()` returns false.

### Menu Bar System

The Editor builds its menu bar (File, Edit, View, Editor) using an observable collection of menu items. Each menu is a `ScriptView` subclass:

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

The `ObservableCollection` automatically creates the visual menu items when commands are inserted.

### HUD with Data-Bound Panels

The editor HUD controller uses `ObservableCollection` for all list panels:

```c
class EditorHudController: EditorControllerBase
{
    // Object lists bound to sidebar panels
    ref ObservableCollection<ref EditorPlaceableListItem> LeftbarSpacerConfig;
    ref ObservableCollection<EditorListItem> RightbarPlacedData;
    ref ObservableCollection<EditorPlayerListItem> RightbarPlayerData;

    // Log entries with max count
    static const int MAX_LOG_ENTRIES = 20;
    ref ObservableCollection<ref EditorLogEntry> EditorLogEntries;

    // Camera track keyframes
    ref ObservableCollection<ref EditorCameraTrackListItem> CameraTrackData;
}
```

Adding an object to the scene automatically adds it to the sidebar list. Deleting removes it. No manual widget creation/destruction.

### Theming via Widget Name Lists

The Editor centralizes themed widgets using a static array of widget names:

```c
static const ref array<string> ThemedWidgetStrings = {
    "LeftbarPanelSearchBarIconButton",
    "FavoritesTabButton",
    "ShowPrivateButton",
    // ...
};
```

A theming pass iterates this array and applies colors from `EditorSettings`, avoiding scattered `SetColor()` calls throughout the codebase.

---

## Common UI Architecture Patterns

These patterns appear across multiple mods. They represent the community's consensus on how to solve recurring DayZ UI problems.

### Panel Manager (Show/Hide by Name or Type)

Both VPP and COT maintain a registry of UI panels accessible by typename:

```c
// VPP pattern
VPPScriptedMenu GetMenuByType(typename menuType)
{
    foreach (VPPScriptedMenu menu : M_SCRIPTED_UI_INSTANCES)
    {
        if (menu && menu.GetType() == menuType)
            return menu;
    }
    return NULL;
}

// COT pattern
void ToggleShow()
{
    if (IsVisible())
        Close();
    else
        Show();
}
```

This prevents duplicate panels and provides a single point of control for visibility.

### Widget Recycling for Lists

When displaying large lists (player lists, item catalogs, object browsers), mods avoid creating/destroying widgets on every update. Instead they maintain a pool:

```c
// Simplified pattern used across mods
void UpdatePlayerList(array<PlayerInfo> players)
{
    // Hide excess widgets
    for (int i = players.Count(); i < m_PlayerWidgets.Count(); i++)
        m_PlayerWidgets[i].Show(false);

    // Create new widgets only if needed
    while (m_PlayerWidgets.Count() < players.Count())
    {
        Widget w = GetGame().GetWorkspace().CreateWidgets(PLAYER_ENTRY_LAYOUT, m_ListParent);
        m_PlayerWidgets.Insert(w);
    }

    // Update visible widgets with data
    for (int j = 0; j < players.Count(); j++)
    {
        m_PlayerWidgets[j].Show(true);
        SetPlayerData(m_PlayerWidgets[j], players[j]);
    }
}
```

DabsFramework's `ObservableCollection` handles this automatically, but manual implementations use this pattern.

### Lazy Widget Creation

Several mods defer widget creation until first show:

```c
// VPP pattern
override Widget Init()
{
    if (!m_Init)
    {
        layoutRoot = GetGame().GetWorkspace().CreateWidgets(VPPATUIConstants.VPPAdminHud);
        m_Init = true;
        return layoutRoot;
    }
    // Subsequent calls skip creation
    return layoutRoot;
}
```

This avoids loading all admin panels at startup when most will never be opened.

### Event Delegation Through Handler Chains

A common pattern is a parent handler that delegates to child handlers:

```c
// Parent handles click, routes to appropriate child
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_closeButton)
    {
        HideSubMenu();
        return true;
    }

    // Delegate to active tool panel
    if (m_ActivePanel)
        return m_ActivePanel.OnClick(w, x, y, button);

    return false;
}
```

### OnWidgetScriptInit as Universal Entry Point

Every mod studied uses `OnWidgetScriptInit` as the layout-to-script binding mechanism:

```c
void OnWidgetScriptInit(Widget w)
{
    m_root = w;
    m_root.SetHandler(this);

    // Find child widgets
    m_Button = ButtonWidget.Cast(m_root.FindAnyWidget("button_name"));
    m_Text = TextWidget.Cast(m_root.FindAnyWidget("text_name"));
}
```

This is set via the `scriptclass` property in the layout file. The engine calls `OnWidgetScriptInit` automatically when `CreateWidgets()` processes a widget with a script class.

---

## Anti-Patterns to Avoid

These mistakes appear in real mod code and cause performance issues or crashes.

### Creating Widgets Every Frame

```c
// BAD: Creates new widgets on every Update call
override void Update(float dt)
{
    Widget label = GetGame().GetWorkspace().CreateWidgets("label.layout", m_Parent);
    TextWidget.Cast(label.FindAnyWidget("text")).SetText(m_Value);
}
```

Widget creation allocates memory and triggers layout recalculation. At 60 FPS this creates 60 widgets per second. Always create once and update in place.

### Not Cleaning Up Event Handlers

```c
// BAD: Insert without corresponding Remove
void OnInit()
{
    GetGame().GetUpdateQueue(CALL_CATEGORY_GUI).Insert(Update);
    JMScriptInvokers.ESP_VIEWTYPE_CHANGED.Insert(OnESPViewTypeChanged);
}

// Missing from destructor:
// GetGame().GetUpdateQueue(CALL_CATEGORY_GUI).Remove(Update);
// JMScriptInvokers.ESP_VIEWTYPE_CHANGED.Remove(OnESPViewTypeChanged);
```

Every `Insert` on a `ScriptInvoker` or update queue needs a matching `Remove` in the destructor. Orphaned handlers cause calls to deleted objects and null access crashes.

### Hardcoding Pixel Positions

```c
// BAD: Breaks on different resolutions
m_Panel.SetPos(540, 320);
m_Panel.SetSize(400, 300);
```

Always use proportional (0.0-1.0) positioning or let container widgets handle layout. Pixel positions only work at the resolution they were designed for.

### Deep Widget Nesting Without Purpose

```
Frame -> Panel -> Frame -> Panel -> Frame -> TextWidget
```

Every nesting level adds layout calculation overhead. If an intermediate widget serves no purpose (no background, no sizing constraint, no event handling), remove it. Flatten hierarchies where possible.

### Ignoring Focus Management

```c
// BAD: Opens dialog but does not set focus
void ShowDialog()
{
    m_Dialog.Show(true);
    // Missing: SetFocus(m_Dialog.GetLayoutRoot());
}
```

Without `SetFocus()`, keyboard events may still go to widgets behind the dialog. Expansion's approach is correct:

```c
override void OnShow()
{
    SetFocus(GetLayoutRoot());
}
```

### Forgetting Widget Cleanup on Destruction

```c
// BAD: Widget tree leaks when script object is destroyed
void ~MyPanel()
{
    // m_root.Unlink() is missing!
}
```

If you create widgets with `CreateWidgets()`, you own them. Call `Unlink()` on the root in your destructor. `ScriptView` and `UIScriptedMenu` handle this automatically, but raw `ScriptedWidgetEventHandler` subclasses must do it manually.

---

## Summary: Which Pattern to Use When

| Need | Recommended Pattern | Source Mod |
|------|-------------------|------------|
| Simple tool panel | `ScriptedWidgetEventHandler` + `OnWidgetScriptInit` | VPP |
| Complex data-bound UI | `ScriptView` + `ViewController` + `ObservableCollection` | DabsFramework |
| Admin panel system | Module + Form + Window (module registration pattern) | COT |
| Draggable sub-windows | `AdminHudSubMenu` (title bar drag handling) | VPP |
| Confirmation dialog | `VPPDialogBox` or `JMConfirmation` (callback-based) | VPP / COT |
| Popup with input | `PopUpCreatePreset` pattern (`delete this` on close) | VPP |
| Fullscreen menu | `ExpansionScriptViewMenu` (lock controls, blur, timer) | Expansion |
| Theme/color system | 3-layer (palette, scheme, branding) with `modded class` | Colorful UI |
| Vanilla UI override | `modded class` + replacement `.layout` files | Colorful UI |
| Notification system | Type enum + per-type layout + static creation API | Expansion |
| Toolbar command system | `EditorCommand` + `EditorCommandManager` + shortcuts | DayZ Editor |
| Menu bar with items | `EditorMenu` + `ObservableCollection<EditorMenuItem>` | DayZ Editor |
| ESP/HUD overlay | Fullscreen `CanvasWidget` + projected widget positioning | COT |
| Resolution variants | Separate layout directories (narrow/medium/wide) | Colorful UI |
| Large list performance | Widget recycling pool (hide/show, create on demand) | Common |
| Configuration | Static variables (client mod) or JSON via config manager | Colorful UI |

### Decision Flowchart

1. **Is it a one-off simple panel?** Use `ScriptedWidgetEventHandler` with `OnWidgetScriptInit`. Build the layout in the editor, find widgets by name.

2. **Does it have dynamic lists or frequently-changing data?** Use DabsFramework's `ViewController` with `ObservableCollection`. The data binding eliminates manual widget updates.

3. **Is it part of a multi-panel admin tool?** Use the COT module-form pattern. Each tool is self-contained with its own module, form, and layout. Registration is a single line.

4. **Does it need to replace vanilla UI?** Use the Colorful UI pattern: `modded class`, custom layout file, centralized color scheme.

5. **Does it need server-to-client data sync?** Combine any pattern above with RPC. Expansion's market menu shows how to manage loading states, request/response cycles, and update timers within a ScriptView.

6. **Does it need undo/redo or complex interaction?** Use the command pattern from DayZ Editor. Commands decouple actions from buttons, support shortcuts, and integrate with DabsFramework's `RelayCommand` for automatic enable/disable.

---

*Next chapter: [Advanced Widgets](10-advanced-widgets.md) -- RichTextWidget formatting, CanvasWidget drawing, MapWidget markers, ItemPreviewWidget, PlayerPreviewWidget, VideoWidget, and RenderTargetWidget.*
