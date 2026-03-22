# 3.9. fejezet: Valós mod UI minták

[Főoldal](../README.md) | [<< Előző: Dialógusok és modálisok](08-dialogs-modals.md) | **Valós mod UI minták** | [Következő: Haladó widgetek >>](10-advanced-widgets.md)

---

Minden bemutatott kód valódi mod forrásból lett kinyerve. A fájlútvonalak az eredeti adattárakra hivatkoznak.

---

## Miért érdemes valódi modokat tanulmányozni?

A DayZ dokumentáció elmagyarázza az egyedi widgeteket és esemény visszahívásokat, de semmit sem mond arról:

- Hogyan kezelj 12 admin panelt kódduplikáció nélkül
- Hogyan építs dialógus rendszert visszahívás-útválasztással
- Hogyan témázz egy teljes UI-t a vanilla layout fájlok érintése nélkül
- Hogyan szinkronizálj egy piaci rácsot szerver adattal RPC-n keresztül
- Hogyan strukturálj egy szerkesztőt visszavonás/újra végrehajtás és parancsrendszerrel

Ezek architektúrális problémák. Minden nagy mod kitalálja a saját megoldásait rájuk. Néhány elegáns, néhány elrettentő példa. Ez a fejezet feltérképezi a mintákat, hogy kiválaszthasd a projekted számára megfelelő megközelítést.

---

## COT (Community Online Tools) UI minták

A COT a legszélesebb körben használt DayZ admin eszköz. UI architektúrája egy modul-űrlap-ablak rendszerre épül, ahol minden eszköz (ESP, Player Manager, Teleport, Object Spawner, stb.) egy önálló modul a saját paneljével.

### Modul-Űrlap-Ablak architektúra

A COT három rétegre bontja a felelősségeket:

1. **JMRenderableModuleBase** -- Deklarálja a modul metaadatait (cím, ikon, layout útvonal, jogosultságok). Kezeli a CF_Window életciklust. Nem tartalmaz UI logikát.
2. **JMFormBase** -- A tényleges UI panel. A `ScriptedWidgetEventHandler`-t terjeszti ki. Widget eseményeket fogad, UI elemeket épít, a modulhoz fordul adatműveletekért.
3. **CF_Window** -- A CF keretrendszer által biztosított ablakozó konténer. Kezeli a húzást, átméretezést, bezárás keretdíszítést.

Egy modul felülírásokkal deklarálja magát:

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

A modul egy központi konstruktorban van regisztrálva, amely felépíti a modullistát:

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

Amikor a `Show()` meghívásra kerül egy modulon, ablakot hoz létre és betölti az űrlapot:

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

Az űrlap `Init` metódusa köti a modul hivatkozást egy védett felülíráson keresztül:

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
        // UI elemek felépítése programozottan az UIActionManager segítségével
    }
}
```

**Kulcs tanulság:** Minden eszköz teljesen önálló. Új admin eszköz hozzáadása egy Module osztály, egy Form osztály, egy layout fájl létrehozását és egy sor beillesztését jelenti a konstruktorba. Meglévő kód nem változik.

### Programozott UI az UIActionManager-rel

A COT nem épít komplex űrlapokat layout fájlokban. Ehelyett egy gyár osztályt (`UIActionManager`) használ, amely szabványosított UI akció widgeteket hoz létre futásidőben:

```c
override void OnInit()
{
    m_Scroller = UIActionManager.CreateScroller(layoutRoot.FindAnyWidget("panel"));
    Widget actions = m_Scroller.GetContentWidget();

    // Rács elrendezés: 8 sor, 1 oszlop
    m_PanelAlpha = UIActionManager.CreateGridSpacer(actions, 8, 1);

    // Szabványos widget típusok
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

    // Al-rács egymás melletti gombokhoz
    Widget gridButtons = UIActionManager.CreateGridSpacer(m_PanelAlpha, 1, 2);
    m_Button = UIActionManager.CreateButton(gridButtons, "Left", this, "OnClick_Left");
    m_NavButton = UIActionManager.CreateNavButton(gridButtons, "Right", ...);
}
```

Minden `UIAction*` widget típusnak saját layout fájlja van (pl. `UIActionSlider.layout`, `UIActionCheckbox.layout`), amelyeket prefabként tölt be. A gyár megközelítés azt jelenti:

- Következetes méretezés és térköz az összes panelen
- Nincs layout fájl duplikáció
- Új akció típusok egyszer adhatók hozzá és mindenhol használhatók

### ESP overlay (rajzolás CanvasWidget-re)

A COT ESP rendszere címkéket, életerő sávokat és vonalakat rajzol közvetlenül a 3D világ fölé a `CanvasWidget` használatával. A kulcs minta egy képernyő-tér `CanvasWidget`, amely lefedi a teljes nézőablakot, egyedi ESP widget kezelőkkel, amelyek vetített világ koordinátáknál vannak elhelyezve:

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

Az ESP widgetek prefab layoutokból (`esp_widget.layout`) jönnek létre és minden frame-ben a 3D pozíciók képernyő koordinátákra vetítésével pozícionálódnak. Maga a vászon egy teljes képernyős overlay, amely indításkor töltődik be.

### Megerősítő dialógusok

A COT visszahívás-alapú megerősítő rendszert biztosít, amely a `JMFormBase`-be van beépítve. A megerősítések nevesített visszahívásokkal jönnek létre:

```c
CreateConfirmation_Two(
    JMConfirmationType.INFO,
    "Are you sure?",
    "This will kick the player.",
    "#STR_COT_GENERIC_YES", "OnConfirmKick",
    "#STR_COT_GENERIC_NO", ""
);
```

A `JMConfirmationForm` a `CallByName` metódust használja a visszahívás metódus meghívására az űrlapon:

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

Ez lehetővé teszi megerősítések láncolását (egy megerősítés másikat nyit) a folyamat hardkódolása nélkül.

---

## VPP Admin Tools UI minták

A VPP más megközelítést alkalmaz, mint a COT: `UIScriptedMenu`-t használ eszköztár HUD-dal, húzható alablakokkal és globális dialógus rendszerrel.

### Eszköztár gomb regisztráció

A `VPPAdminHud` egy gomb definíció listát tart fenn. Minden gomb egy jogosultsági sztringet társít megjelenítendő névhez, ikonhoz és tooltiphez:

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
        // ... további 10 eszköz
        DefineButtons();

        // Jogosultságok ellenőrzése a szerverrel RPC-n keresztül
        array<string> perms = new array<string>;
        for (int i = 0; i < m_DefinedButtons.Count(); i++)
            perms.Insert(m_DefinedButtons[i].param1);
        GetRPCManager().VSendRPC("RPC_PermitManager",
            "VerifyButtonsPermission", new Param1<ref array<string>>(perms), true);
    }
}
```

Külső modok felülírhatják a `DefineButtons()` metódust saját eszköztár gombok hozzáadásához, így a VPP bővíthető a forrásának módosítása nélkül.

### Almenü ablak rendszer

Minden eszközpanel az `AdminHudSubMenu`-t terjeszti ki, amely húzható ablak viselkedést, megjelenítés/elrejtés váltást és ablak prioritás kezelést biztosít:

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

    // Húzás támogatás a címsoron keresztül
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

    // Dupla kattintás a címsoron a maximalizálás/visszaállításhoz
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

**Kulcs tanulság:** A VPP egy mini ablakkezelőt épít a DayZ-ben. Minden almenü egy húzható, átméretezhető ablak fókuszkezeléssel. A `SetWindowPriorty()` hívás módosítja a z-sorrendet, hogy a kattintott ablak előtérbe kerüljön.

### VPPDialogBox -- visszahívás-alapú dialógus

A VPP dialógusrendszere enum-vezérelt megközelítést használ. A dialógus egy típus enum alapján mutatja/rejti a gombokat, és az eredményt a `CallFunction` metóduson keresztül irányítja:

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

A `ConfirmationEventHandler` egy gomb widgetet burkol, így a kattintás dialógust hoz létre. A dialógus eredménye bármely osztálynak továbbítódik nevesített visszahíváson keresztül:

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

### PopUp az OnWidgetScriptInit-tel

A VPP popup űrlapok az `OnWidgetScriptInit` metóduson keresztül kötődnek a layoutjukhoz és a `ScriptedWidgetEventHandler`-t használják:

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

**Kulcs tanulság:** A `delete this` bezáráskor a gyakori popup megsemmisítési minta. A destruktor a `m_root.Unlink()` metódust hívja a widget fa eltávolításához. Ez tiszta, de óvatosságot igényel -- ha bármi hivatkozást tart a popup-ra a törlés után, null hozzáférést kapsz.

---

## DabsFramework UI minták

A DabsFramework teljes MVC (Model-View-Controller) architektúrát vezet be a DayZ UI-hoz. A DayZ Editor és az Expansion használja UI alapként.

### ViewController és adatkötés

Az alapötlet: a widgetek manuális megkeresése és szövegük beállítása helyett deklarálsz tulajdonságokat egy controller osztályon, és név szerint kötöd őket widgetekhez a layout szerkesztőben.

```c
class TestController: ViewController
{
    // A változónév megegyezik a Binding_Name-mel a layoutban
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

A layoutban minden widgetnek van egy `ViewBinding` script osztálya, amelynek `Binding_Name` referencia tulajdonsága a változónévre van állítva (pl. "TextBox1"). Amikor a `NotifyPropertyChanged()` meghívásra kerül, a keretrendszer megkeresi az összes ezzel a névvel rendelkező ViewBinding-ot és frissíti a widgetet:

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

A **kétirányú kötés** azt jelenti, hogy a widgetben történő változások (felhasználói gépelés) automatikusan visszavezetődnek a controller tulajdonságba.

### ObservableCollection -- lista adatkötés

Dinamikus listákhoz a DabsFramework `ObservableCollection<T>`-t biztosít. A beszúrás/eltávolítás műveletek automatikusan frissítik a kötött widgetet (pl. WrapSpacer vagy ScrollWidget):

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
        // Automatikusan meghívásra kerül Insert/Remove esetén
    }
}
```

Minden `Insert()` egy `CollectionChanged` eseményt aktivál, amelyet a ViewBinding elfog a gyermek widgetek létrehozásához/megsemmisítéséhez. Nincs szükség manuális widget kezelésre.

### ScriptView -- layout kódból

A `ScriptView` a tisztán szkript alapú alternatíva az `OnWidgetScriptInit`-hez. Alosztályt készítesz belőle, felülírod a `GetLayoutFile()` metódust és példányosítod. A konstruktor betölti a layoutot, megkeresi a controllert és mindent összeköt:

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

// Használat:
CustomDialogWindow window = new CustomDialogWindow();
```

A `ScriptView` alosztályokon mezőkként deklarált widget változók automatikusan feltöltődnek a layout hierarchiával való névazonosítás alapján (`LoadWidgetsAsVariables`). Ez kiküszöböli a `FindAnyWidget()` hívásokat.

### RelayCommand -- gomb-akció kötés

A gombok `RelayCommand` objektumokhoz köthetők a ViewBinding `Relay_Command` referencia tulajdonságán keresztül. Ez leválasztja a gombkattintásokat a kezelőkről:

```c
class EditorCommand: RelayCommand
{
    override bool Execute(Class sender, CommandArgs args)
    {
        // Művelet végrehajtása
        return true;
    }

    override bool CanExecute()
    {
        // Gomb engedélyezése/letiltása
        return true;
    }

    override void CanExecuteChanged(bool state)
    {
        // Widget kiszürkítése letiltáskor
        if (m_ViewBinding)
        {
            Widget root = m_ViewBinding.GetLayoutRoot();
            root.SetAlpha(state ? 1 : 0.15);
            root.Enable(state);
        }
    }
}
```

**Kulcs tanulság:** A DabsFramework kiküszöböli a sablonkódot. Deklarálod az adatokat, név szerint kötöd, és a keretrendszer kezeli a szinkronizálást. Az ára a tanulási görbe és a keretrendszer függőség.

---

## Colorful UI minták

A Colorful UI lecseréli a vanilla DayZ menüket témázott változatokra a vanilla szkript fájlok módosítása nélkül. Megközelítése teljes egészében `modded class` felülírásokra és egy központosított szín/márkajelzés rendszerre épül.

### 3 rétegű téma rendszer

A színek három szinten vannak szervezve:

**1. réteg -- UIColor (alappaletta):** Nyers színértékek szemantikus nevekkel.

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

**2. réteg -- colorScheme (szemantikus leképezés):** UI koncepciókat társít paletta színekhez. A szerver tulajdonosok ezt a réteget változtatják a szerverük témázásához.

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

**3. réteg -- Branding/Settings (szerver identitás):** Logó útvonalak, URL-ek, funkció kapcsolók.

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

### Nem-destruktív vanilla UI módosítás

A Colorful UI a `modded class` segítségével cseréli le a vanilla menüket. Minden vanilla `UIScriptedMenu` alosztály módosításra kerül, hogy egyéni layout fájlt töltsön be és téma színeket alkalmazzon:

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

        // Téma színek alkalmazása
        if (m_TopShader) m_TopShader.SetColor(colorScheme.TopShader());
        if (m_BottomShader) m_BottomShader.SetColor(colorScheme.BottomShader());
        if (m_MenuDivider) m_MenuDivider.SetColor(colorScheme.Separator());

        Branding.ApplyLogo(m_Logo);

        return layoutRoot;
    }
}
```

Ez a minta fontos: a Colorful UI teljesen egyéni `.layout` fájlokat szállít, amelyek tükrözik a vanilla widget neveket. A `modded class` felülírás lecseréli a layout útvonalat, de megtartja a vanilla widget neveket, így ha bármely vanilla kód hivatkozik ezekre a widget nevekre, továbbra is működik.

### Felbontás-tudatos layout variánsok

A Colorful UI külön inventory layout könyvtárakat biztosít különböző képernyőszélességekhez:

```
GUI/layouts/inventory/narrow/   -- kis képernyők
GUI/layouts/inventory/medium/   -- szabványos 1080p
GUI/layouts/inventory/wide/     -- ultraszéles
```

Minden könyvtár ugyanazokat a fájlneveket tartalmazza (`cargo_container.layout`, `left_area.layout`, stb.) módosított méretezéssel. A megfelelő variáns futásidőben kerül kiválasztásra a képernyő felbontás alapján.

### Konfiguráció statikus változókon keresztül

A szerver tulajdonosok a Colorful UI-t a `Settings.c` fájlban lévő statikus változó értékek szerkesztésével konfigurálják:

```c
static bool StartMainMenu    = true;
static bool NoHints          = false;
static bool LoadVideo        = true;
static bool ShowDeadScreen   = false;
static bool CuiDebug         = true;
```

Ez a lehető legegyszerűbb konfigurációs rendszer: szerkesztsd a szkriptet, építsd újra a PBO-t. Nincs JSON betöltés, nincs config kezelő. Egy kliens-oldali vizuális modhoz ez megfelelő.

**Kulcs tanulság:** A Colorful UI bemutatja, hogy a teljes DayZ kliens újratémázható szerver-oldali kód nélkül, kizárólag `modded class` felülírások, egyéni layout fájlok és központosított színrendszer használatával.

---

## Expansion UI minták

A DayZ Expansion a legnagyobb közösségi mod ökoszisztéma. UI-ja az értesítő felugró ablakoktól a teljes piaci kereskedési felületekig terjed szerver szinkronizálással.

### Értesítési rendszer (több típus)

Az Expansion hat értesítési vizuális típust definiál, mindegyiknek saját layoutja van:

```c
enum ExpansionNotificationType
{
    TOAST    = 1,    // Kis sarokfelugró
    BAGUETTE = 2,   // Széles szalag a képernyőn
    ACTIVITY = 4,   // Tevékenység hírfolyam bejegyzés
    KILLFEED = 8,   // Ölési bejelentés
    MARKET   = 16,  // Piaci tranzakció eredmény
    GARAGE   = 32   // Jármű tárolás eredmény
}
```

Az értesítések bárhonnan (kliens vagy szerver) létrehozhatók statikus API-n keresztül:

```c
// Szerverről, adott játékosnak küldve RPC-n keresztül:
NotificationSystem.Create_Expansion(
    "Trade Complete",          // cím
    "You purchased M4A1",     // szöveg
    "market_icon",             // ikon neve
    ARGB(255, 50, 200, 50),   // szín
    7,                         // megjelenítési idő (másodperc)
    sendTo,                    // PlayerIdentity (null = mindenki)
    ExpansionNotificationType.MARKET  // típus
);
```

Az értesítési modul aktív értesítések listáját tartja fenn és kezeli azok életciklusát. Minden `ExpansionNotificationView` (egy `ScriptView` alosztály) kezeli a saját megjelenítés/elrejtés animációját:

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

Minden értesítési típusnak külön layout fájlja van (`expansion_notification_toast.layout`, `expansion_notification_killfeed.layout`, stb.), ami teljesen eltérő vizuális kezelést tesz lehetővé.

### Piaci menü (összetett interaktív panel)

Az `ExpansionMarketMenu` az egyik legösszetettebb UI bármely DayZ modban. Az `ExpansionScriptViewMenu`-t terjeszti ki (amely a DabsFramework ScriptView-ját bővíti) és kezeli:

- Kategória fa összecsukható szekciókkal
- Tárgy rács kereséses szűréssel
- Vétel/eladás ár megjelenítés pénznem ikonokkal
- Mennyiség vezérlők
- Tárgy előnézet widget
- Játékos inventory előnézet
- Legördülő kiválasztók kinézetekhez
- Csatolmány konfiguráció jelölőnégyzetek
- Megerősítő dialógusok vásárlásokhoz/eladásokhoz

```c
class ExpansionMarketMenu: ExpansionScriptViewMenu
{
    protected ref ExpansionMarketMenuController m_MarketMenuController;
    protected ref ExpansionMarketModule m_MarketModule;
    protected ref ExpansionMarketItem m_SelectedMarketItem;

    // Közvetlen widget hivatkozások (ScriptView által automatikusan feltöltve)
    protected EditBoxWidget market_filter_box;
    protected ButtonWidget market_item_buy;
    protected ButtonWidget market_item_sell;
    protected ScrollWidget market_categories_scroller;
    protected ItemPreviewWidget market_item_preview;
    protected PlayerPreviewWidget market_player_preview;

    // Állapot követés
    protected int m_Quantity = 1;
    protected int m_BuyPrice;
    protected int m_SellPrice;
    protected ExpansionMarketMenuState m_CurrentState;
}
```

**Kulcs tanulság:** Összetett interaktív UI-khoz az Expansion a DabsFramework MVC-jét kombinálja hagyományos widget hivatkozásokkal. A controller kezeli az adatkötést listákhoz és szövegekhez, míg a közvetlen widget hivatkozások kezelik a speciális widgeteket, mint az `ItemPreviewWidget` és `PlayerPreviewWidget`, amelyek imperatív vezérlést igényelnek.

### ExpansionScriptViewMenu -- menü életciklus

Az Expansion a ScriptView-t egy menü alaposztályba csomagolja, amely kezeli az input zárolást, homályosítási effekteket és frissítési időzítőket:

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

Ez biztosítja, hogy minden Expansion menü következetesen zárolja a játékos mozgását, mutatja a kurzort, alkalmazza a háttér homályosítást és takarít bezáráskor.

---

## DayZ Editor UI minták

A DayZ Editor egy teljes objektum elhelyezési eszköz, amely DayZ modként van megépítve. Kiterjedten használja a DabsFramework-öt és olyan mintákat implementál, amelyek jellemzően asztali alkalmazásokban találhatók: eszköztárak, menük, tulajdonság vizsgálók, parancsrendszer visszavonás/újra végrehajtással.

### Parancs minta billentyűkombinációkkal

Az Editor parancsrendszere leválasztja a műveleteket az UI elemekről. Minden művelet (Új, Megnyitás, Mentés, Visszavonás, Újra, Törlés, stb.) egy `EditorCommand` alosztály:

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

Az `EditorCommandManager` regisztrálja az összes parancsot és leképezi a gyorsbillentyűket:

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

A parancsok integrálódnak a DabsFramework `RelayCommand`-jával, így az eszköztár gombok automatikusan kiszürkülnek, amikor a `CanExecute()` false-t ad vissza.

### Menüsor rendszer

Az Editor a menüsorát (File, Edit, View, Editor) egy megfigyelhető menüelem kollekcióval építi. Minden menü egy `ScriptView` alosztály:

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

Az `ObservableCollection` automatikusan létrehozza a vizuális menüelemeket a parancsok beillesztésekor.

### HUD adatkötött panelekkel

Az editor HUD controller `ObservableCollection`-t használ az összes lista panelhez:

```c
class EditorHudController: EditorControllerBase
{
    // Objektum listák az oldalsó panel widgetekhez kötve
    ref ObservableCollection<ref EditorPlaceableListItem> LeftbarSpacerConfig;
    ref ObservableCollection<EditorListItem> RightbarPlacedData;
    ref ObservableCollection<EditorPlayerListItem> RightbarPlayerData;

    // Napló bejegyzések maximális számmal
    static const int MAX_LOG_ENTRIES = 20;
    ref ObservableCollection<ref EditorLogEntry> EditorLogEntries;

    // Kamera pálya kulcsképkockák
    ref ObservableCollection<ref EditorCameraTrackListItem> CameraTrackData;
}
```

Objektum hozzáadása a jelenethez automatikusan hozzáadja az oldalsó panel listájához. Törlés eltávolítja. Nincs manuális widget létrehozás/megsemmisítés.

### Témázás widget névlistákon keresztül

Az Editor központosítja a témázott widgeteket egy statikus widget név tömbben:

```c
static const ref array<string> ThemedWidgetStrings = {
    "LeftbarPanelSearchBarIconButton",
    "FavoritesTabButton",
    "ShowPrivateButton",
    // ...
};
```

Egy témázási menet végigiterál ezen a tömbön és alkalmazza az `EditorSettings` színeit, elkerülve a szétszórt `SetColor()` hívásokat az egész kódbázisban.

---

## Általános UI architektúra minták

Ezek a minták több modban is megjelennek. A közösség konszenzusát képviselik arról, hogyan kell megoldani az ismétlődő DayZ UI problémákat.

### Panel kezelő (megjelenítés/elrejtés név vagy típus szerint)

Mind a VPP, mind a COT fenntart egy UI panel nyilvántartást, amely typename szerint elérhető:

```c
// VPP minta
VPPScriptedMenu GetMenuByType(typename menuType)
{
    foreach (VPPScriptedMenu menu : M_SCRIPTED_UI_INSTANCES)
    {
        if (menu && menu.GetType() == menuType)
            return menu;
    }
    return NULL;
}

// COT minta
void ToggleShow()
{
    if (IsVisible())
        Close();
    else
        Show();
}
```

Ez megakadályozza a duplikált paneleket és egyetlen vezérlési pontot biztosít a láthatósághoz.

### Widget újrahasznosítás listákhoz

Hosszú listák (játékoslisták, tárgy katalógusok, objektum böngészők) megjelenítésekor a modok elkerülik a widgetek létrehozását/megsemmisítését minden frissítéskor. Ehelyett készletet tartanak fenn:

```c
// Egyszerűsített minta, amit több mod használ
void UpdatePlayerList(array<PlayerInfo> players)
{
    // Felesleges widgetek elrejtése
    for (int i = players.Count(); i < m_PlayerWidgets.Count(); i++)
        m_PlayerWidgets[i].Show(false);

    // Új widgetek létrehozása csak szükség esetén
    while (m_PlayerWidgets.Count() < players.Count())
    {
        Widget w = GetGame().GetWorkspace().CreateWidgets(PLAYER_ENTRY_LAYOUT, m_ListParent);
        m_PlayerWidgets.Insert(w);
    }

    // Látható widgetek frissítése adatokkal
    for (int j = 0; j < players.Count(); j++)
    {
        m_PlayerWidgets[j].Show(true);
        SetPlayerData(m_PlayerWidgets[j], players[j]);
    }
}
```

A DabsFramework `ObservableCollection`-ja ezt automatikusan kezeli, de a manuális implementációk ezt a mintát használják.

### Lusta widget létrehozás

Több mod elhalasztja a widget létrehozást az első megjelenítésig:

```c
// VPP minta
override Widget Init()
{
    if (!m_Init)
    {
        layoutRoot = GetGame().GetWorkspace().CreateWidgets(VPPATUIConstants.VPPAdminHud);
        m_Init = true;
        return layoutRoot;
    }
    // Későbbi hívások kihagyják a létrehozást
    return layoutRoot;
}
```

Ez elkerüli az összes admin panel betöltését indításkor, amikor a legtöbbet soha nem nyitják meg.

### Esemény delegálás kezelő láncokon keresztül

Gyakori minta egy szülő kezelő, amely gyermek kezelőknek delegál:

```c
// A szülő kezeli a kattintást, a megfelelő gyermekhez irányít
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_closeButton)
    {
        HideSubMenu();
        return true;
    }

    // Delegálás az aktív eszközpanelnek
    if (m_ActivePanel)
        return m_ActivePanel.OnClick(w, x, y, button);

    return false;
}
```

### OnWidgetScriptInit mint univerzális belépési pont

Minden tanulmányozott mod az `OnWidgetScriptInit`-et használja layout-szkript kötési mechanizmusként:

```c
void OnWidgetScriptInit(Widget w)
{
    m_root = w;
    m_root.SetHandler(this);

    // Gyermek widgetek keresése
    m_Button = ButtonWidget.Cast(m_root.FindAnyWidget("button_name"));
    m_Text = TextWidget.Cast(m_root.FindAnyWidget("text_name"));
}
```

Ez a layout fájl `scriptclass` tulajdonságán keresztül van beállítva. A motor automatikusan meghívja az `OnWidgetScriptInit`-et, amikor a `CreateWidgets()` feldolgoz egy widgetet script osztállyal.

---

## Elkerülendő anti-minták

Ezek a hibák valódi mod kódban jelennek meg és teljesítményproblémákat vagy összeomlásokat okoznak.

### Widgetek létrehozása minden frame-ben

```c
// ROSSZ: Új widgeteket hoz létre minden Update híváskor
override void Update(float dt)
{
    Widget label = GetGame().GetWorkspace().CreateWidgets("label.layout", m_Parent);
    TextWidget.Cast(label.FindAnyWidget("text")).SetText(m_Value);
}
```

A widget létrehozás memóriát foglal és layout újraszámolást indít. 60 FPS-nél ez 60 widgetet hoz létre másodpercenként. Mindig egyszer hozd létre és helyben frissítsd.

### Eseménykezelők takarításának elmulasztása

```c
// ROSSZ: Insert megfelelő Remove nélkül
void OnInit()
{
    GetGame().GetUpdateQueue(CALL_CATEGORY_GUI).Insert(Update);
    JMScriptInvokers.ESP_VIEWTYPE_CHANGED.Insert(OnESPViewTypeChanged);
}

// Hiányzik a destruktorból:
// GetGame().GetUpdateQueue(CALL_CATEGORY_GUI).Remove(Update);
// JMScriptInvokers.ESP_VIEWTYPE_CHANGED.Remove(OnESPViewTypeChanged);
```

Minden `ScriptInvoker`-re vagy frissítési sorra történő `Insert` hívásnak megfelelő `Remove` szükséges a destruktorban. Az árva kezelők törölt objektumokra hívnak és null hozzáférési összeomlásokat okoznak.

### Pixel pozíciók hardkódolása

```c
// ROSSZ: Eltörik más felbontásokon
m_Panel.SetPos(540, 320);
m_Panel.SetSize(400, 300);
```

Mindig használj arányos (0.0-1.0) pozícionálást, vagy hagyd a konténer widgetekre a layout kezelést. A pixel pozíciók csak azon a felbontáson működnek, amelyhez tervezték őket.

### Mély widget beágyazás cél nélkül

```
Frame -> Panel -> Frame -> Panel -> Frame -> TextWidget
```

Minden beágyazási szint layout számítási többletet ad. Ha egy köztes widget nem szolgál célt (nincs háttér, nincs méretezési megkötés, nincs eseménykezelés), távolítsd el. Laposítsd a hierarchiákat ahol lehetséges.

### Fókuszkezelés mellőzése

```c
// ROSSZ: Dialógust nyit, de nem állít fókuszt
void ShowDialog()
{
    m_Dialog.Show(true);
    // Hiányzik: SetFocus(m_Dialog.GetLayoutRoot());
}
```

`SetFocus()` nélkül a billentyűzet események továbbra is a dialógus mögötti widgetekhez mehetnek. Az Expansion megközelítése helyes:

```c
override void OnShow()
{
    SetFocus(GetLayoutRoot());
}
```

### Widget takarítás elfelejtése megsemmisítéskor

```c
// ROSSZ: Widget fa szivárog, amikor a szkript objektum megsemmisül
void ~MyPanel()
{
    // m_root.Unlink() hiányzik!
}
```

Ha widgeteket hoztál létre a `CreateWidgets()` metódussal, te birtoklod őket. Hívd meg az `Unlink()` metódust a gyökéren a destruktorban. A `ScriptView` és az `UIScriptedMenu` ezt automatikusan kezelik, de a nyers `ScriptedWidgetEventHandler` alosztályoknak manuálisan kell megtenni.

---

## Összefoglalás: melyik mintát használd mikor

| Igény | Ajánlott minta | Forrás mod |
|------|-------------------|------------|
| Egyszerű eszközpanel | `ScriptedWidgetEventHandler` + `OnWidgetScriptInit` | VPP |
| Összetett adatkötött UI | `ScriptView` + `ViewController` + `ObservableCollection` | DabsFramework |
| Admin panel rendszer | Module + Form + Window (modul regisztrációs minta) | COT |
| Húzható alablak | `AdminHudSubMenu` (címsor húzás kezelés) | VPP |
| Megerősítő dialógus | `VPPDialogBox` vagy `JMConfirmation` (visszahívás-alapú) | VPP / COT |
| Popup beviteli mezővel | `PopUpCreatePreset` minta (`delete this` bezáráskor) | VPP |
| Teljes képernyős menü | `ExpansionScriptViewMenu` (vezérlés zárolás, homályosítás, időzítő) | Expansion |
| Téma/szín rendszer | 3 rétegű (paletta, séma, márkajelzés) `modded class`-szal | Colorful UI |
| Vanilla UI felülírás | `modded class` + csere `.layout` fájlok | Colorful UI |
| Értesítési rendszer | Típus enum + típusonkénti layout + statikus létrehozási API | Expansion |
| Eszköztár parancsrendszer | `EditorCommand` + `EditorCommandManager` + gyorsbillentyűk | DayZ Editor |
| Menüsor elemekkel | `EditorMenu` + `ObservableCollection<EditorMenuItem>` | DayZ Editor |
| ESP/HUD overlay | Teljes képernyős `CanvasWidget` + vetített widget pozícionálás | COT |
| Felbontás variánsok | Külön layout könyvtárak (narrow/medium/wide) | Colorful UI |
| Nagy lista teljesítmény | Widget újrahasznosítási készlet (elrejtés/megjelenítés, igény szerinti létrehozás) | Általános |
| Konfiguráció | Statikus változók (kliens mod) vagy JSON config kezelőn keresztül | Colorful UI |

### Döntési folyamatábra

1. **Egyszerű egyszeri panel?** Használj `ScriptedWidgetEventHandler`-t az `OnWidgetScriptInit`-tel. Építsd a layoutot a szerkesztőben, keresd meg a widgeteket név szerint.

2. **Dinamikus listái vagy gyakran változó adatai vannak?** Használd a DabsFramework `ViewController`-jét `ObservableCollection`-nel. Az adatkötés kiküszöböli a manuális widget frissítéseket.

3. **Része egy több paneles admin eszköznek?** Használd a COT modul-űrlap mintát. Minden eszköz önálló saját modullal, űrlappal és layouttal. A regisztráció egy sor.

4. **Le kell cserélnie a vanilla UI-t?** Használd a Colorful UI mintát: `modded class`, egyéni layout fájl, központosított színséma.

5. **Szerver-kliens adat szinkronizálás szükséges?** Kombináld bármely fenti mintát RPC-vel. Az Expansion piaci menüje bemutatja, hogyan kezeld a betöltési állapotokat, kérés/válasz ciklusokat és frissítési időzítőket egy ScriptView-n belül.

6. **Visszavonás/újra végrehajtás vagy összetett interakció szükséges?** Használd a DayZ Editor parancs mintáját. A parancsok leválasztják a műveleteket a gomboktól, támogatják a gyorsbillentyűket és integrálódnak a DabsFramework `RelayCommand`-jával az automatikus engedélyezés/letiltáshoz.

---

*Következő fejezet: [Haladó widgetek](10-advanced-widgets.md) -- RichTextWidget formázás, CanvasWidget rajzolás, MapWidget jelölők, ItemPreviewWidget, PlayerPreviewWidget, VideoWidget és RenderTargetWidget.*
