# Kapitola 3.9: Vzory UI ve skutečných modech

[Domů](../README.md) | [<< Předchozí: Dialogy a modální okna](08-dialogs-modals.md) | **Vzory UI ve skutečných modech** | [Další: Pokročilé widgety >>](10-advanced-widgets.md)

---

Tato kapitola zkoumá vzory UI nalezené v šesti profesionálních modech DayZ: COT (Community Online Tools), VPP Admin Tools, DabsFramework, Colorful UI, Expansion a DayZ Editor. Každý mod řeší jiné problémy. Studium jejich přístupů vám dá knihovnu ověřených vzorů nad rámec toho, co pokrývá oficiální dokumentace.

Veškerý zobrazený kód je extrahován ze skutečného zdrojového kódu modů. Cesty k souborům odkazují na původní repozitáře.

---

## Proč studovat skutečné mody?

Dokumentace DayZ vysvětluje jednotlivé widgety a callbacky událostí, ale neříká nic o:

- Jak spravovat 12 admin panelů bez duplikace kódu
- Jak vytvořit systém dialogů se směrováním callbacků
- Jak tematizovat celé UI bez úprav vanilla souborů layoutu
- Jak synchronizovat mřížku marketu se serverovými daty přes RPC
- Jak strukturovat editor s undo/redo a systémem příkazů

To jsou architektonické problémy. Každý velký mod pro ně vymýšlí řešení. Některá jsou elegantní, jiná jsou varovné příklady. Tato kapitola mapuje vzory, abyste si mohli vybrat správný přístup pro svůj projekt.

---

## Vzory UI v COT (Community Online Tools)

COT je nejrozšířenější admin nástroj pro DayZ. Jeho UI architektura je postavena kolem systému modul-formulář-okno, kde každý nástroj (ESP, Správce hráčů, Teleport, Spawner objektů atd.) je samostatný modul s vlastním panelem.

### Architektura modul-formulář-okno

COT odděluje záležitosti do tří vrstev:

1. **JMRenderableModuleBase** -- Deklaruje metadata modulu (název, ikona, cesta layoutu, oprávnění). Spravuje životní cyklus CF_Window. Neobsahuje logiku UI.
2. **JMFormBase** -- Vlastní panel UI. Rozšiřuje `ScriptedWidgetEventHandler`. Přijímá události widgetů, vytváří elementy UI, komunikuje s modulem pro datové operace.
3. **CF_Window** -- Okenní kontejner poskytovaný frameworkem CF. Zpracovává přetahování, změnu velikosti, zavírání.

Modul se deklaruje přepsáními:

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

Modul se registruje v centrálním konstruktoru, který sestavuje seznam modulů:

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

Když se na modulu zavolá `Show()`, vytvoří okno a načte formulář:

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

`Init` formuláře naváže referenci modulu přes chráněné přepsání:

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
        // Sestavit elementy UI programaticky pomocí UIActionManager
    }
}
```

**Klíčový poznatek:** Každý nástroj je zcela samostatný. Přidání nového admin nástroje znamená vytvoření jedné třídy modulu, jedné třídy formuláře, jednoho souboru layoutu a vložení jednoho řádku v konstruktoru. Žádné změny existujícího kódu.

### Programatické UI s UIActionManager

COT nestaví složité formuláře v souborech layoutu. Místo toho používá tovární třídu (`UIActionManager`), která vytváří standardizované widgety UI akcí za běhu:

```c
override void OnInit()
{
    m_Scroller = UIActionManager.CreateScroller(layoutRoot.FindAnyWidget("panel"));
    Widget actions = m_Scroller.GetContentWidget();

    // Layout mřížky: 8 řádků, 1 sloupec
    m_PanelAlpha = UIActionManager.CreateGridSpacer(actions, 8, 1);

    // Standardní typy widgetů
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

    // Podmřížka pro tlačítka vedle sebe
    Widget gridButtons = UIActionManager.CreateGridSpacer(m_PanelAlpha, 1, 2);
    m_Button = UIActionManager.CreateButton(gridButtons, "Left", this, "OnClick_Left");
    m_NavButton = UIActionManager.CreateNavButton(gridButtons, "Right", ...);
}
```

Každý typ widgetu `UIAction*` má svůj vlastní soubor layoutu (např. `UIActionSlider.layout`, `UIActionCheckbox.layout`) načtený jako prefab. Tovární přístup znamená:

- Konzistentní velikosti a mezery napříč všemi panely
- Žádná duplikace souborů layoutu
- Nové typy akcí mohou být přidány jednou a použity všude

### ESP překrytí (kreslení na CanvasWidget)

ESP systém COT kreslí popisky, health bary a čáry přímo přes 3D svět pomocí `CanvasWidget`. Klíčovým vzorem je `CanvasWidget` v prostoru obrazovky, který pokrývá celý viewport, s individuálními handlery ESP widgetů pozicovanými na promítnutých světových souřadnicích:

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

ESP widgety jsou vytvářeny z prefabových layoutů (`esp_widget.layout`) a každý snímek pozicovány projekcí 3D pozic na souřadnice obrazovky. Plátno samotné je celoobrazovkové překrytí načtené při spuštění.

### Potvrzovací dialogy

COT poskytuje systém potvrzení založený na callbackech zabudovaný do `JMFormBase`. Potvrzení se vytvářejí s pojmenovanými callbacky:

```c
CreateConfirmation_Two(
    JMConfirmationType.INFO,
    "Are you sure?",
    "This will kick the player.",
    "#STR_COT_GENERIC_YES", "OnConfirmKick",
    "#STR_COT_GENERIC_NO", ""
);
```

`JMConfirmationForm` používá `CallByName` pro vyvolání metody callbacku na formuláři:

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

To umožňuje řetězení potvrzení (jedno potvrzení otevře další) bez natvrdo kódování toku.

---

## Vzory UI v VPP Admin Tools

VPP volí jiný přístup než COT: používá `UIScriptedMenu` s HUD panelem nástrojů, přetahovatelnými podokny a globálním systémem dialogových oken.

### Registrace tlačítek panelu nástrojů

`VPPAdminHud` udržuje seznam definic tlačítek. Každé tlačítko mapuje řetězec oprávnění na zobrazovaný název, ikonu a tooltip:

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
        // ... 10 dalších nástrojů
        DefineButtons();

        // Ověřit oprávnění se serverem přes RPC
        array<string> perms = new array<string>;
        for (int i = 0; i < m_DefinedButtons.Count(); i++)
            perms.Insert(m_DefinedButtons[i].param1);
        GetRPCManager().VSendRPC("RPC_PermitManager",
            "VerifyButtonsPermission", new Param1<ref array<string>>(perms), true);
    }
}
```

Externí mody mohou přepsat `DefineButtons()` pro přidání vlastních tlačítek panelu nástrojů, čímž je VPP rozšiřitelné bez modifikace jeho zdrojového kódu.

### Systém podoken menu

Každý panel nástroje rozšiřuje `AdminHudSubMenu`, který poskytuje přetahovatelné chování okna, přepínání zobrazení/skrytí a správu priority oken:

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

    // Podpora přetahování přes záhlaví
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

    // Dvojklik na záhlaví pro maximalizaci/obnovení
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

**Klíčový poznatek:** VPP staví mini správce oken uvnitř DayZ. Každé podmenu je přetahovatelné okno s možností změny velikosti a správou fokusu. Volání `SetWindowPriorty()` upravuje z-pořadí, takže kliknuté okno se dostane dopředu.

### VPPDialogBox -- Dialog založený na callbackech

Systém dialogů VPP používá přístup řízený enumerací. Dialog zobrazuje/skrývá tlačítka na základě enumerace typu a směruje výsledek přes `CallFunction`:

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

`ConfirmationEventHandler` obaluje widget tlačítka tak, že kliknutí na něj spawne dialog. Výsledek dialogu je předán jakékoliv třídě přes pojmenovaný callback:

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

### PopUp s OnWidgetScriptInit

VPP vyskakovací formuláře se navazují na svůj layout přes `OnWidgetScriptInit` a používají `ScriptedWidgetEventHandler`:

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

**Klíčový poznatek:** `delete this` při zavření je běžný vzor likvidace vyskakovacího okna. Destruktor volá `m_root.Unlink()` pro odstranění stromu widgetů. Toto je čisté, ale vyžaduje opatrnost -- pokud cokoliv drží referenci na vyskakovací okno po smazání, dojde k přístupu na null.

---

## Vzory UI v DabsFramework

DabsFramework zavádí plnou MVC (Model-View-Controller) architekturu pro DayZ UI. Používá ho DayZ Editor a Expansion jako základ svého UI.

### ViewController a datové navázání

Jádrová myšlenka: místo ručního hledání widgetů a nastavování jejich textu deklarujete vlastnosti na třídě controlleru a navážete je na widgety podle názvu v editoru layoutu.

```c
class TestController: ViewController
{
    // Název proměnné odpovídá Binding_Name v layoutu
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

V layoutu má každý widget skriptovou třídu `ViewBinding` s referenční vlastností `Binding_Name` nastavenou na název proměnné (např. "TextBox1"). Když se zavolá `NotifyPropertyChanged()`, framework najde všechna ViewBindings s tímto názvem a aktualizuje widget:

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

**Obousměrné navázání** znamená, že změny ve widgetu (uživatel píše) se automaticky propagují zpět do vlastnosti controlleru.

### ObservableCollection -- Datové navázání seznamů

Pro dynamické seznamy poskytuje DabsFramework `ObservableCollection<T>`. Operace vkládání/odebírání automaticky aktualizují navázaný widget (např. WrapSpacer nebo ScrollWidget):

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
        // Volá se automaticky při Insert/Remove
    }
}
```

Každé `Insert()` vyvolá událost `CollectionChanged`, kterou ViewBinding zachytí pro vytvoření/zničení podřízených widgetů. Žádná ruční správa widgetů není potřeba.

### ScriptView -- Layout z kódu

`ScriptView` je plně skriptová alternativa k `OnWidgetScriptInit`. Podtřídíte ji, přepíšete `GetLayoutFile()` a instancujete ji. Konstruktor načte layout, najde controller a propojí vše:

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

// Použití:
CustomDialogWindow window = new CustomDialogWindow();
```

Proměnné widgetů deklarované jako pole na podtřídách `ScriptView` jsou automaticky naplněny shodou názvů oproti hierarchii layoutu (`LoadWidgetsAsVariables`). Tím se eliminují volání `FindAnyWidget()`.

### RelayCommand -- Navázání tlačítka na akci

Tlačítka mohou být navázána na objekty `RelayCommand` přes referenční vlastnost `Relay_Command` ve ViewBinding. To odděluje kliknutí na tlačítko od handlerů:

```c
class EditorCommand: RelayCommand
{
    override bool Execute(Class sender, CommandArgs args)
    {
        // Provést akci
        return true;
    }

    override bool CanExecute()
    {
        // Povolit/zakázat tlačítko
        return true;
    }

    override void CanExecuteChanged(bool state)
    {
        // Zšedivit widget při zakázání
        if (m_ViewBinding)
        {
            Widget root = m_ViewBinding.GetLayoutRoot();
            root.SetAlpha(state ? 1 : 0.15);
            root.Enable(state);
        }
    }
}
```

**Klíčový poznatek:** DabsFramework eliminuje boilerplate. Deklarujete data, navážete je podle názvu a framework zpracovává synchronizaci. Cenou je křivka učení a závislost na frameworku.

---

## Vzory UI v Colorful UI

Colorful UI nahrazuje vanilla menu DayZ tematizovanými verzemi bez modifikace vanilla skriptových souborů. Jeho přístup je zcela založen na přepsáních `modded class` a centralizovaném systému barev/brandingu.

### 3-vrstvý systém témat

Barvy jsou organizovány ve třech úrovních:

**Vrstva 1 -- UIColor (základní paleta):** Surové hodnoty barev se sémantickými názvy.

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

**Vrstva 2 -- colorScheme (sémantické mapování):** Mapuje koncepty UI na barvy palety. Majitelé serverů mění tuto vrstvu pro tematizaci svého serveru.

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

**Vrstva 3 -- Branding/Settings (identita serveru):** Cesty k logům, URL, přepínače funkcí.

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

### Nedestruktivní modifikace vanilla UI

Colorful UI nahrazuje vanilla menu pomocí `modded class`. Každá podtřída vanilla `UIScriptedMenu` je modována pro načtení vlastního souboru layoutu a aplikaci barev tématu:

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

        // Aplikovat barvy tématu
        if (m_TopShader) m_TopShader.SetColor(colorScheme.TopShader());
        if (m_BottomShader) m_BottomShader.SetColor(colorScheme.BottomShader());
        if (m_MenuDivider) m_MenuDivider.SetColor(colorScheme.Separator());

        Branding.ApplyLogo(m_Logo);

        return layoutRoot;
    }
}
```

Tento vzor je důležitý: Colorful UI dodává zcela vlastní soubory `.layout`, které zrcadlí názvy vanilla widgetů. Přepsání `modded class` zamění cestu layoutu, ale zachová názvy vanilla widgetů, takže pokud jakýkoliv vanilla kód odkazuje na tyto názvy widgetů, stále funguje.

### Varianty layoutu podle rozlišení

Colorful UI poskytuje oddělené adresáře layoutu inventáře pro různé šířky obrazovek:

```
GUI/layouts/inventory/narrow/   -- malé obrazovky
GUI/layouts/inventory/medium/   -- standardní 1080p
GUI/layouts/inventory/wide/     -- ultrawide
```

Každý adresář obsahuje stejné názvy souborů (`cargo_container.layout`, `left_area.layout` atd.) s upravenými rozměry. Správná varianta je vybrána za běhu na základě rozlišení obrazovky.

### Konfigurace přes statické proměnné

Majitelé serverů konfigurují Colorful UI úpravou hodnot statických proměnných v `Settings.c`:

```c
static bool StartMainMenu    = true;
static bool NoHints          = false;
static bool LoadVideo        = true;
static bool ShowDeadScreen   = false;
static bool CuiDebug         = true;
```

Toto je nejjednodušší možný konfigurovací systém: upravte skript, sestavte PBO. Žádné načítání JSON, žádný config manager. Pro mod pouze na straně klienta se zaměřením na vizuály je to přiměřené.

**Klíčový poznatek:** Colorful UI ukazuje, že můžete kompletně přetematizovat celý DayZ klient bez serverového kódu, pouze pomocí přepsání `modded class`, vlastních souborů layoutu a centralizovaného systému barev.

---

## Vzory UI v Expansion

DayZ Expansion je největší komunitní modový ekosystém. Jeho UI sahá od notifikačních toastů po plná rozhraní pro obchodování na marketu se serverovou synchronizací.

### Systém notifikací (více typů)

Expansion definuje šest vizuálních typů notifikací, každý s vlastním layoutem:

```c
enum ExpansionNotificationType
{
    TOAST    = 1,    // Malé vyskakovací okno v rohu
    BAGUETTE = 2,   // Široký banner přes obrazovku
    ACTIVITY = 4,   // Záznam feedu aktivit
    KILLFEED = 8,   // Oznámení zabití
    MARKET   = 16,  // Výsledek transakce na marketu
    GARAGE   = 32   // Výsledek úschovy vozidla
}
```

Notifikace se vytvářejí odkudkoliv (klient nebo server) pomocí statického API:

```c
// Ze serveru, odesláno konkrétnímu hráči přes RPC:
NotificationSystem.Create_Expansion(
    "Trade Complete",          // titulek
    "You purchased M4A1",     // text
    "market_icon",             // název ikony
    ARGB(255, 50, 200, 50),   // barva
    7,                         // doba zobrazení (sekundy)
    sendTo,                    // PlayerIdentity (null = všichni)
    ExpansionNotificationType.MARKET  // typ
);
```

Modul notifikací udržuje seznam aktivních notifikací a spravuje jejich životní cyklus. Každý `ExpansionNotificationView` (podtřída `ScriptView`) zpracovává svou vlastní animaci zobrazení/skrytí:

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

Každý typ notifikace má oddělený soubor layoutu (`expansion_notification_toast.layout`, `expansion_notification_killfeed.layout` atd.), což umožňuje zcela odlišné vizuální zpracování.

### Menu marketu (složitý interaktivní panel)

`ExpansionMarketMenu` je jedno z nejsložitějších UI v jakémkoliv modu DayZ. Rozšiřuje `ExpansionScriptViewMenu` (který rozšiřuje ScriptView z DabsFramework) a spravuje:

- Strom kategorií se skládacími sekcemi
- Mřížku předmětů s filtrováním vyhledáváním
- Zobrazení cen nákupu/prodeje s ikonami měny
- Ovládání množství
- Widget náhledu předmětu
- Náhled inventáře hráče
- Výběrové rozbalovací nabídky pro skiny
- Zaškrtávací políčka konfigurace příslušenství
- Potvrzovací dialogy pro nákupy/prodeje

```c
class ExpansionMarketMenu: ExpansionScriptViewMenu
{
    protected ref ExpansionMarketMenuController m_MarketMenuController;
    protected ref ExpansionMarketModule m_MarketModule;
    protected ref ExpansionMarketItem m_SelectedMarketItem;

    // Přímé reference na widgety (automaticky naplněné ScriptView)
    protected EditBoxWidget market_filter_box;
    protected ButtonWidget market_item_buy;
    protected ButtonWidget market_item_sell;
    protected ScrollWidget market_categories_scroller;
    protected ItemPreviewWidget market_item_preview;
    protected PlayerPreviewWidget market_player_preview;

    // Sledování stavu
    protected int m_Quantity = 1;
    protected int m_BuyPrice;
    protected int m_SellPrice;
    protected ExpansionMarketMenuState m_CurrentState;
}
```

**Klíčový poznatek:** Pro složitá interaktivní UI Expansion kombinuje MVC z DabsFramework s tradičními referencemi na widgety. Controller zpracovává datové navázání pro seznamy a text, zatímco přímé reference na widgety zpracovávají specializované widgety jako `ItemPreviewWidget` a `PlayerPreviewWidget`, které potřebují imperativní řízení.

### ExpansionScriptViewMenu -- Životní cyklus menu

Expansion obaluje ScriptView do základní třídy menu, která zpracovává uzamčení vstupu, efekty rozmazání a časovače aktualizací:

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

Toto zajišťuje, že každé menu Expansion konzistentně uzamkne pohyb hráče, zobrazí kurzor, aplikuje rozmazání pozadí a vyčistí se při zavření.

---

## Vzory UI v DayZ Editoru

DayZ Editor je plný nástroj pro umísťování objektů postavený jako mod DayZ. Rozsáhle používá DabsFramework a implementuje vzory typicky nalézané v desktopových aplikacích: panely nástrojů, menu, inspektory vlastností, systém příkazů s undo/redo.

### Vzor příkazů s klávesovými zkratkami

Systém příkazů Editoru odděluje akce od elementů UI. Každá akce (Nový, Otevřít, Uložit, Zpět, Vpřed, Smazat atd.) je podtřída `EditorCommand`:

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

`EditorCommandManager` registruje všechny příkazy a mapuje zkratky:

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

Příkazy se integrují s `RelayCommand` z DabsFramework, takže tlačítka panelu nástrojů automaticky zšediví, když `CanExecute()` vrací false.

### Systém lišty menu

Editor staví svou lištu menu (Soubor, Úpravy, Zobrazení, Editor) pomocí observable kolekce položek menu. Každé menu je podtřída `ScriptView`:

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

`ObservableCollection` automaticky vytváří vizuální položky menu při vkládání příkazů.

### HUD s datově navázanými panely

Controller HUD editoru používá `ObservableCollection` pro všechny panely seznamů:

```c
class EditorHudController: EditorControllerBase
{
    // Seznamy objektů navázané na panely postranního panelu
    ref ObservableCollection<ref EditorPlaceableListItem> LeftbarSpacerConfig;
    ref ObservableCollection<EditorListItem> RightbarPlacedData;
    ref ObservableCollection<EditorPlayerListItem> RightbarPlayerData;

    // Záznamy logu s maximálním počtem
    static const int MAX_LOG_ENTRIES = 20;
    ref ObservableCollection<ref EditorLogEntry> EditorLogEntries;

    // Klíčové snímky stopy kamery
    ref ObservableCollection<ref EditorCameraTrackListItem> CameraTrackData;
}
```

Přidání objektu na scénu automaticky přidá položku do seznamu postranního panelu. Smazání ji odstraní. Žádné ruční vytváření/ničení widgetů.

### Tematizace přes seznamy názvů widgetů

Editor centralizuje tematizované widgety pomocí statického pole názvů widgetů:

```c
static const ref array<string> ThemedWidgetStrings = {
    "LeftbarPanelSearchBarIconButton",
    "FavoritesTabButton",
    "ShowPrivateButton",
    // ...
};
```

Průchod tematizace iteruje toto pole a aplikuje barvy z `EditorSettings`, čímž se vyhne rozptýleným voláním `SetColor()` po celém kódu.

---

## Společné vzory architektur UI

Tyto vzory se objevují napříč více mody. Reprezentují konsenzus komunity ohledně řešení opakujících se problémů UI v DayZ.

### Správce panelů (zobrazení/skrytí podle názvu nebo typu)

VPP i COT udržují registr UI panelů přístupných podle typename:

```c
// Vzor VPP
VPPScriptedMenu GetMenuByType(typename menuType)
{
    foreach (VPPScriptedMenu menu : M_SCRIPTED_UI_INSTANCES)
    {
        if (menu && menu.GetType() == menuType)
            return menu;
    }
    return NULL;
}

// Vzor COT
void ToggleShow()
{
    if (IsVisible())
        Close();
    else
        Show();
}
```

Toto zabraňuje duplicitním panelům a poskytuje jediný bod řízení viditelnosti.

### Recyklace widgetů pro seznamy

Při zobrazování velkých seznamů (seznamy hráčů, katalogy předmětů, prohlížeče objektů) mody vyhnou se vytváření/ničení widgetů při každé aktualizaci. Místo toho udržují pool:

```c
// Zjednodušený vzor používaný napříč mody
void UpdatePlayerList(array<PlayerInfo> players)
{
    // Skrýt přebytečné widgety
    for (int i = players.Count(); i < m_PlayerWidgets.Count(); i++)
        m_PlayerWidgets[i].Show(false);

    // Vytvořit nové widgety pouze pokud je potřeba
    while (m_PlayerWidgets.Count() < players.Count())
    {
        Widget w = GetGame().GetWorkspace().CreateWidgets(PLAYER_ENTRY_LAYOUT, m_ListParent);
        m_PlayerWidgets.Insert(w);
    }

    // Aktualizovat viditelné widgety s daty
    for (int j = 0; j < players.Count(); j++)
    {
        m_PlayerWidgets[j].Show(true);
        SetPlayerData(m_PlayerWidgets[j], players[j]);
    }
}
```

`ObservableCollection` z DabsFramework to zpracovává automaticky, ale ruční implementace používají tento vzor.

### Líné vytváření widgetů

Několik modů odkládá vytváření widgetů do prvního zobrazení:

```c
// Vzor VPP
override Widget Init()
{
    if (!m_Init)
    {
        layoutRoot = GetGame().GetWorkspace().CreateWidgets(VPPATUIConstants.VPPAdminHud);
        m_Init = true;
        return layoutRoot;
    }
    // Následná volání přeskočí vytváření
    return layoutRoot;
}
```

Tím se vyhne načítání všech admin panelů při spuštění, když většina z nich nebude nikdy otevřena.

### Delegování událostí přes řetězce handlerů

Běžným vzorem je rodičovský handler, který deleguje na podřízené handlery:

```c
// Rodič zpracovává kliknutí, směruje na příslušného potomka
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_closeButton)
    {
        HideSubMenu();
        return true;
    }

    // Delegovat na aktivní panel nástrojů
    if (m_ActivePanel)
        return m_ActivePanel.OnClick(w, x, y, button);

    return false;
}
```

### OnWidgetScriptInit jako univerzální vstupní bod

Každý studovaný mod používá `OnWidgetScriptInit` jako mechanismus navázání layoutu na skript:

```c
void OnWidgetScriptInit(Widget w)
{
    m_root = w;
    m_root.SetHandler(this);

    // Najít podřízené widgety
    m_Button = ButtonWidget.Cast(m_root.FindAnyWidget("button_name"));
    m_Text = TextWidget.Cast(m_root.FindAnyWidget("text_name"));
}
```

Toto se nastavuje přes vlastnost `scriptclass` v souboru layoutu. Engine volá `OnWidgetScriptInit` automaticky, když `CreateWidgets()` zpracovává widget se skriptovou třídou.

---

## Anti-vzory, kterým se vyhnout

Tyto chyby se objevují ve skutečném kódu modů a způsobují problémy s výkonem nebo pády.

### Vytváření widgetů každý snímek

```c
// ŠPATNĚ: Vytváří nové widgety při každém volání Update
override void Update(float dt)
{
    Widget label = GetGame().GetWorkspace().CreateWidgets("label.layout", m_Parent);
    TextWidget.Cast(label.FindAnyWidget("text")).SetText(m_Value);
}
```

Vytváření widgetů alokuje paměť a spouští přepočet layoutu. Při 60 FPS to vytváří 60 widgetů za sekundu. Vždy vytvořte jednou a aktualizujte na místě.

### Nečištění handlerů událostí

```c
// ŠPATNĚ: Insert bez odpovídajícího Remove
void OnInit()
{
    GetGame().GetUpdateQueue(CALL_CATEGORY_GUI).Insert(Update);
    JMScriptInvokers.ESP_VIEWTYPE_CHANGED.Insert(OnESPViewTypeChanged);
}

// Chybí v destruktoru:
// GetGame().GetUpdateQueue(CALL_CATEGORY_GUI).Remove(Update);
// JMScriptInvokers.ESP_VIEWTYPE_CHANGED.Remove(OnESPViewTypeChanged);
```

Každé `Insert` na `ScriptInvoker` nebo frontě aktualizací potřebuje odpovídající `Remove` v destruktoru. Osiřelé handlery způsobují volání na smazané objekty a pády přístupu na null.

### Natvrdo kódované pixelové pozice

```c
// ŠPATNĚ: Nefunguje na jiných rozlišeních
m_Panel.SetPos(540, 320);
m_Panel.SetSize(400, 300);
```

Vždy používejte proporcionální (0.0-1.0) pozicování nebo nechte kontejnerové widgety zpracovat layout. Pixelové pozice fungují pouze na rozlišení, pro které byly navrženy.

### Hluboké vnoření widgetů bez účelu

```
Frame -> Panel -> Frame -> Panel -> Frame -> TextWidget
```

Každá úroveň vnoření přidává režii výpočtu layoutu. Pokud prostřední widget neslouží žádnému účelu (žádné pozadí, žádné omezení rozměrů, žádné zpracování událostí), odstraňte ho. Zploštěte hierarchie, kde je to možné.

### Ignorování správy fokusu

```c
// ŠPATNĚ: Otevře dialog, ale nenastaví fokus
void ShowDialog()
{
    m_Dialog.Show(true);
    // Chybí: SetFocus(m_Dialog.GetLayoutRoot());
}
```

Bez `SetFocus()` mohou klávesnicové události stále směřovat na widgety za dialogem. Přístup Expansion je správný:

```c
override void OnShow()
{
    SetFocus(GetLayoutRoot());
}
```

### Zapomenutí čištění widgetů při destrukci

```c
// ŠPATNĚ: Strom widgetů uniká, když je skriptový objekt zničen
void ~MyPanel()
{
    // m_root.Unlink() chybí!
}
```

Pokud vytváříte widgety pomocí `CreateWidgets()`, vlastníte je. Zavolejte `Unlink()` na kořeni ve vašem destruktoru. `ScriptView` a `UIScriptedMenu` to zpracovávají automaticky, ale surové podtřídy `ScriptedWidgetEventHandler` to musí udělat ručně.

---

## Shrnutí: Který vzor použít kdy

| Potřeba | Doporučený vzor | Zdrojový mod |
|------|-------------------|------------|
| Jednoduchý panel nástroje | `ScriptedWidgetEventHandler` + `OnWidgetScriptInit` | VPP |
| Složité datově navázané UI | `ScriptView` + `ViewController` + `ObservableCollection` | DabsFramework |
| Systém admin panelů | Modul + formulář + okno (vzor registrace modulů) | COT |
| Přetahovatelná podokna | `AdminHudSubMenu` (přetahování přes záhlaví) | VPP |
| Potvrzovací dialog | `VPPDialogBox` nebo `JMConfirmation` (založené na callbackech) | VPP / COT |
| Vyskakovací okno se vstupem | Vzor `PopUpCreatePreset` (`delete this` při zavření) | VPP |
| Celoobrazovkové menu | `ExpansionScriptViewMenu` (uzamčení ovládání, rozmazání, časovač) | Expansion |
| Systém témat/barev | 3-vrstvý (paleta, schéma, branding) s `modded class` | Colorful UI |
| Přepsání vanilla UI | `modded class` + náhradní soubory `.layout` | Colorful UI |
| Systém notifikací | Enumerace typu + layout per typ + statické API pro vytváření | Expansion |
| Systém příkazů panelu nástrojů | `EditorCommand` + `EditorCommandManager` + zkratky | DayZ Editor |
| Lišta menu s položkami | `EditorMenu` + `ObservableCollection<EditorMenuItem>` | DayZ Editor |
| ESP/HUD překrytí | Celoobrazovkový `CanvasWidget` + pozicování promítnutých widgetů | COT |
| Varianty rozlišení | Oddělené adresáře layoutu (narrow/medium/wide) | Colorful UI |
| Výkon velkých seznamů | Pool recyklace widgetů (skrýt/zobrazit, vytvořit na vyžádání) | Společné |
| Konfigurace | Statické proměnné (klientský mod) nebo JSON přes config manager | Colorful UI |

### Rozhodovací vývojový diagram

1. **Je to jednorázový jednoduchý panel?** Použijte `ScriptedWidgetEventHandler` s `OnWidgetScriptInit`. Sestavte layout v editoru, najděte widgety podle názvu.

2. **Má dynamické seznamy nebo často se měnící data?** Použijte `ViewController` z DabsFramework s `ObservableCollection`. Datové navázání eliminuje ruční aktualizace widgetů.

3. **Je to součást vícepanelového admin nástroje?** Použijte vzor modulu-formuláře z COT. Každý nástroj je samostatný se svým vlastním modulem, formulářem a layoutem. Registrace je jeden řádek.

4. **Potřebuje nahradit vanilla UI?** Použijte vzor Colorful UI: `modded class`, vlastní soubor layoutu, centralizované barevné schéma.

5. **Potřebuje synchronizaci dat server-klient?** Kombinujte jakýkoliv výše uvedený vzor s RPC. Menu marketu Expansion ukazuje, jak spravovat stavy načítání, cykly požadavek/odpověď a časovače aktualizací v rámci ScriptView.

6. **Potřebuje undo/redo nebo složitou interakci?** Použijte vzor příkazů z DayZ Editoru. Příkazy oddělují akce od tlačítek, podporují zkratky a integrují se s `RelayCommand` z DabsFramework pro automatické povolování/zakazování.

---

*Další kapitola: [Pokročilé widgety](10-advanced-widgets.md) -- Formátování RichTextWidget, kreslení CanvasWidget, značky MapWidget, ItemPreviewWidget, PlayerPreviewWidget, VideoWidget a RenderTargetWidget.*
