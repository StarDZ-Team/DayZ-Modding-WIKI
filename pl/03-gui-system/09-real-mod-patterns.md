# Rozdział 3.9: Wzorce UI z prawdziwych modów

[Strona główna](../README.md) | [<< Poprzedni: Okna dialogowe i modale](08-dialogs-modals.md) | **Wzorce UI z prawdziwych modów** | [Następny: Zaawansowane widgety >>](10-advanced-widgets.md)

---

Ten rozdział prezentuje wzorce UI znalezione w sześciu profesjonalnych modach DayZ: COT (Community Online Tools), VPP Admin Tools, DabsFramework, Colorful UI, Expansion i DayZ Editor. Każdy mod rozwiązuje inne problemy. Studiowanie ich podejść daje bibliotekę sprawdzonych wzorców wykraczających poza to, co pokrywa oficjalna dokumentacja.

Cały pokazany kod jest wyodrębniony z rzeczywistego źródła modów. Ścieżki plików odnoszą się do oryginalnych repozytoriów.

---

## Dlaczego warto studiować prawdziwe mody?

Dokumentacja DayZ wyjaśnia poszczególne widgety i callbacki zdarzeń, ale nie mówi nic o:

- Jak zarządzać 12 panelami administracyjnymi bez duplikacji kodu
- Jak zbudować system okien dialogowych z routowaniem callbacków
- Jak wystylizować cały UI bez dotykania vanillowych plików layout
- Jak zsynchronizować siatkę rynku z danymi serwera przez RPC
- Jak zbudować edytor z cofaniem/ponawianiem i systemem poleceń

To są problemy architektoniczne. Każdy duży mod wymyśla rozwiązania. Niektóre są eleganckie, inne to przestrogi. Ten rozdział mapuje wzorce, abyś mógł wybrać odpowiednie podejście do swojego projektu.

---

## Wzorce UI COT (Community Online Tools)

COT jest najszerzej używanym narzędziem administratora DayZ. Jego architektura UI jest zbudowana wokół systemu moduł-formularz-okno, gdzie każde narzędzie (ESP, Menedżer Graczy, Teleport, Spawner Obiektów itp.) jest samodzielnym modułem z własnym panelem.

### Architektura Moduł-Formularz-Okno

COT rozdziela odpowiedzialności na trzy warstwy:

1. **JMRenderableModuleBase** -- Deklaruje metadane modułu (tytuł, ikona, ścieżka layoutu, uprawnienia). Zarządza cyklem życia CF_Window. Nie zawiera logiki UI.
2. **JMFormBase** -- Właściwy panel UI. Rozszerza `ScriptedWidgetEventHandler`. Odbiera zdarzenia widgetów, buduje elementy UI, komunikuje się z modułem w celu operacji na danych.
3. **CF_Window** -- Kontener okna zapewniony przez framework CF. Obsługuje przeciąganie, zmianę rozmiaru, przyciski chrome zamknięcia.

Moduł deklaruje się przez nadpisania:

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

Moduł jest rejestrowany w centralnym konstruktorze budującym listę modułów:

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

Gdy na module wywoływane jest `Show()`, tworzy okno i ładuje formularz:

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

`Init` formularza wiąże referencję modułu przez chronione nadpisanie:

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
        // Buduj elementy UI programowo używając UIActionManager
    }
}
```

**Kluczowy wniosek:** Każde narzędzie jest w pełni samodzielne. Dodanie nowego narzędzia administracyjnego oznacza utworzenie jednej klasy Modułu, jednej klasy Formularza, jednego pliku layout i wstawienie jednej linii w konstruktorze. Żadne istniejące zmiany kodu.

### Programowe UI z UIActionManager

COT nie buduje złożonych formularzy w plikach layout. Zamiast tego używa klasy fabrycznej (`UIActionManager`), która tworzy standaryzowane widgety akcji UI w czasie wykonania:

```c
override void OnInit()
{
    m_Scroller = UIActionManager.CreateScroller(layoutRoot.FindAnyWidget("panel"));
    Widget actions = m_Scroller.GetContentWidget();

    // Layout siatki: 8 wierszy, 1 kolumna
    m_PanelAlpha = UIActionManager.CreateGridSpacer(actions, 8, 1);

    // Standardowe typy widgetów
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

    // Pod-siatka dla przycisków obok siebie
    Widget gridButtons = UIActionManager.CreateGridSpacer(m_PanelAlpha, 1, 2);
    m_Button = UIActionManager.CreateButton(gridButtons, "Left", this, "OnClick_Left");
    m_NavButton = UIActionManager.CreateNavButton(gridButtons, "Right", ...);
}
```

Każdy typ widgetu `UIAction*` ma własny plik layout (np. `UIActionSlider.layout`, `UIActionCheckbox.layout`) ładowany jako prefab. Podejście fabryczne oznacza:

- Spójne rozmiarowanie i odstępy we wszystkich panelach
- Brak duplikacji plików layout
- Nowe typy akcji mogą być dodane raz i używane wszędzie

### Nakładka ESP (Rysowanie na CanvasWidget)

System ESP COT rysuje etykiety, paski zdrowia i linie bezpośrednio nad światem 3D używając `CanvasWidget`. Kluczowym wzorcem jest `CanvasWidget` w przestrzeni ekranowej pokrywający cały viewport, z indywidualnymi handlerami widgetów ESP pozycjonowanymi na rzutowanych współrzędnych świata:

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

Widgety ESP są tworzone z prefabów layoutów (`esp_widget.layout`) i pozycjonowane co klatkę przez rzutowanie pozycji 3D na współrzędne ekranowe. Sama kanwa jest pełnoekranową nakładką ładowaną przy starcie.

### Okna dialogowe potwierdzenia

COT zapewnia system potwierdzeń oparty na callbackach wbudowany w `JMFormBase`. Potwierdzenia są tworzone z nazwanymi callbackami:

```c
CreateConfirmation_Two(
    JMConfirmationType.INFO,
    "Are you sure?",
    "This will kick the player.",
    "#STR_COT_GENERIC_YES", "OnConfirmKick",
    "#STR_COT_GENERIC_NO", ""
);
```

`JMConfirmationForm` używa `CallByName` do wywołania metody callbacku na formularzu:

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

Pozwala to na łańcuchowanie potwierdzeń (jedno potwierdzenie otwiera następne) bez hardkodowania przepływu.

---

## Wzorce UI VPP Admin Tools

VPP stosuje inne podejście niż COT: używa `UIScriptedMenu` z paskiem narzędzi HUD, przeciągalnymi pod-oknami i globalnym systemem okien dialogowych.

### Rejestracja przycisków paska narzędzi

`VPPAdminHud` utrzymuje listę definicji przycisków. Każdy przycisk mapuje ciąg uprawnień na nazwę wyświetlaną, ikonę i tooltip:

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
        // ... 10 kolejnych narzędzi
        DefineButtons();

        // Weryfikuj uprawnienia z serwerem przez RPC
        array<string> perms = new array<string>;
        for (int i = 0; i < m_DefinedButtons.Count(); i++)
            perms.Insert(m_DefinedButtons[i].param1);
        GetRPCManager().VSendRPC("RPC_PermitManager",
            "VerifyButtonsPermission", new Param1<ref array<string>>(perms), true);
    }
}
```

Zewnętrzne mody mogą nadpisywać `DefineButtons()`, aby dodać własne przyciski paska narzędzi, czyniąc VPP rozszerzalnym bez modyfikowania jego źródła.

### System pod-okien menu

Każdy panel narzędziowy rozszerza `AdminHudSubMenu`, który zapewnia zachowanie przeciągalnego okna, przełączanie widoczności i zarządzanie priorytetem okien:

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

    // Wsparcie przeciągania przez pasek tytułu
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

    // Podwójne kliknięcie na pasek tytułu aby zmaksymalizować/przywrócić
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

**Kluczowy wniosek:** VPP buduje mini menedżer okien wewnątrz DayZ. Każde podmenu to przeciągalne, skalowalne okno z zarządzaniem fokusem. Wywołanie `SetWindowPriorty()` dostosowuje kolejność Z, aby kliknięte okno wyszło na wierzch.

### VPPDialogBox -- Okno dialogowe oparte na callbackach

System okien dialogowych VPP używa podejścia opartego na enumach. Okno dialogowe pokazuje/ukrywa przyciski na podstawie enuma typu i kieruje wynik przez `CallFunction`:

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

`ConfirmationEventHandler` opakowuje widget przycisku, aby kliknięcie go uruchamiało okno dialogowe. Wynik okna dialogowego jest przekazywany do dowolnej klasy przez nazwany callback:

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

### PopUp z OnWidgetScriptInit

Formularze popup VPP wiążą się z layoutem przez `OnWidgetScriptInit` i używają `ScriptedWidgetEventHandler`:

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

**Kluczowy wniosek:** `delete this` przy zamykaniu to powszechny wzorzec usuwania popup. Destruktor wywołuje `m_root.Unlink()` aby usunąć drzewo widgetów. Jest to czyste, ale wymaga ostrożności -- jeśli cokolwiek trzyma referencję do popup po usunięciu, dostaniesz dostęp do null.

---

## Wzorce UI DabsFramework

DabsFramework wprowadza pełną architekturę MVC (Model-Widok-Kontroler) dla UI DayZ. Jest używany przez DayZ Editor i Expansion jako ich podstawa UI.

### ViewController i wiązanie danych

Główna idea: zamiast ręcznie znajdować widgety i ustawiać ich tekst, deklarujesz właściwości na klasie kontrolera i wiążesz je z widgetami po nazwie w edytorze layoutu.

```c
class TestController: ViewController
{
    // Nazwa zmiennej odpowiada Binding_Name w layoucie
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

W layoucie każdy widget ma klasę skryptu `ViewBinding` z właściwością referencji `Binding_Name` ustawioną na nazwę zmiennej (np. "TextBox1"). Gdy wywoływane jest `NotifyPropertyChanged()`, framework znajduje wszystkie ViewBindings z tą nazwą i aktualizuje widget:

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

**Wiązanie dwukierunkowe** oznacza, że zmiany w widgecie (pisanie użytkownika) propagują się z powrotem do właściwości kontrolera automatycznie.

### ObservableCollection -- Wiązanie danych list

Dla dynamicznych list DabsFramework zapewnia `ObservableCollection<T>`. Operacje wstawiania/usuwania automatycznie aktualizują powiązany widget (np. WrapSpacer lub ScrollWidget):

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
        // Wywoływane automatycznie przy Insert/Remove
    }
}
```

Każde `Insert()` uruchamia zdarzenie `CollectionChanged`, które ViewBinding przechwytuje aby tworzyć/niszczyć widgety potomne. Nie potrzeba ręcznego zarządzania widgetami.

### ScriptView -- Layout z kodu

`ScriptView` to alternatywa w pełni skryptowa dla `OnWidgetScriptInit`. Dziedziczysz po niej, nadpisujesz `GetLayoutFile()` i tworzysz instancję. Konstruktor ładuje layout, znajduje kontroler i łączy wszystko:

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

// Użycie:
CustomDialogWindow window = new CustomDialogWindow();
```

Zmienne widgetów zadeklarowane jako pola na podklasach `ScriptView` są auto-wypełniane przez dopasowanie nazw do hierarchii layoutu (`LoadWidgetsAsVariables`). Eliminuje to wywołania `FindAnyWidget()`.

### RelayCommand -- Wiązanie przycisk-akcja

Przyciski mogą być wiązane z obiektami `RelayCommand` przez właściwość referencji `Relay_Command` w ViewBinding. Oddziela to kliknięcia przycisków od handlerów:

```c
class EditorCommand: RelayCommand
{
    override bool Execute(Class sender, CommandArgs args)
    {
        // Wykonaj akcję
        return true;
    }

    override bool CanExecute()
    {
        // Włącz/wyłącz przycisk
        return true;
    }

    override void CanExecuteChanged(bool state)
    {
        // Wyszarz widget gdy wyłączony
        if (m_ViewBinding)
        {
            Widget root = m_ViewBinding.GetLayoutRoot();
            root.SetAlpha(state ? 1 : 0.15);
            root.Enable(state);
        }
    }
}
```

**Kluczowy wniosek:** DabsFramework eliminuje boilerplate. Deklarujesz dane, wiążesz po nazwie, a framework obsługuje synchronizację. Kosztem jest krzywa uczenia się i zależność od frameworka.

---

## Wzorce Colorful UI

Colorful UI zastępuje vanillowe menu DayZ wersjami ze skórkami bez modyfikowania vanillowych plików skryptów. Podejście opiera się w całości na nadpisaniach `modded class` i scentralizowanym systemie kolorów/brandingu.

### Trójwarstwowy system motywów

Kolory są zorganizowane w trzech warstwach:

**Warstwa 1 -- UIColor (paleta bazowa):** Surowe wartości kolorów z semantycznymi nazwami.

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

**Warstwa 2 -- colorScheme (mapowanie semantyczne):** Mapuje koncepty UI na kolory palety. Właściciele serwerów zmieniają tę warstwę, aby zmotywować swój serwer.

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

**Warstwa 3 -- Branding/Settings (tożsamość serwera):** Ścieżki logo, adresy URL, przełączniki funkcji.

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

### Niedestrukcyjna modyfikacja vanillowego UI

Colorful UI zastępuje vanillowe menu używając `modded class`. Każda podklasa vanillowego `UIScriptedMenu` jest modowana, aby ładować niestandardowy plik layout i stosować kolory motywu:

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

        // Zastosuj kolory motywu
        if (m_TopShader) m_TopShader.SetColor(colorScheme.TopShader());
        if (m_BottomShader) m_BottomShader.SetColor(colorScheme.BottomShader());
        if (m_MenuDivider) m_MenuDivider.SetColor(colorScheme.Separator());

        Branding.ApplyLogo(m_Logo);

        return layoutRoot;
    }
}
```

Ten wzorzec jest ważny: Colorful UI dostarcza w pełni niestandardowe pliki `.layout`, które odzwierciedlają vanillowe nazwy widgetów. Nadpisanie `modded class` zamienia ścieżkę layoutu, ale zachowuje vanillowe nazwy widgetów, dzięki czemu jeśli jakikolwiek vanillowy kod odwołuje się do tych nazw widgetów, nadal działa.

### Warianty layoutu dostosowane do rozdzielczości

Colorful UI zapewnia oddzielne katalogi layoutu inwentarza dla różnych szerokości ekranu:

```
GUI/layouts/inventory/narrow/   -- małe ekrany
GUI/layouts/inventory/medium/   -- standardowe 1080p
GUI/layouts/inventory/wide/     -- ultrawide
```

Każdy katalog zawiera te same nazwy plików (`cargo_container.layout`, `left_area.layout` itp.) z dostosowanymi rozmiarami. Prawidłowy wariant jest wybierany w czasie wykonania na podstawie rozdzielczości ekranu.

### Konfiguracja przez zmienne statyczne

Właściciele serwerów konfigurują Colorful UI edytując wartości zmiennych statycznych w `Settings.c`:

```c
static bool StartMainMenu    = true;
static bool NoHints          = false;
static bool LoadVideo        = true;
static bool ShowDeadScreen   = false;
static bool CuiDebug         = true;
```

Jest to najprostszy możliwy system konfiguracji: edytuj skrypt, przebuduj PBO. Brak ładowania JSON, brak menedżera konfiguracji. Dla moda czysto klienckowidocznego jest to odpowiednie.

**Kluczowy wniosek:** Colorful UI demonstruje, że można zmienić skórkę całego klienta DayZ bez kodu po stronie serwera, używając jedynie nadpisań `modded class`, niestandardowych plików layout i scentralizowanego systemu kolorów.

---

## Wzorce UI Expansion

DayZ Expansion to największy ekosystem modów społeczności. Jego UI obejmuje zakres od powiadomień toast po pełne interfejsy handlu rynkowego z synchronizacją serwera.

### System powiadomień (wiele typów)

Expansion definiuje sześć wizualnych typów powiadomień, każdy z własnym layoutem:

```c
enum ExpansionNotificationType
{
    TOAST    = 1,    // Mały popup w rogu
    BAGUETTE = 2,   // Szerokie przejście przez ekran
    ACTIVITY = 4,   // Wpis w kanale aktywności
    KILLFEED = 8,   // Ogłoszenie o zabiciu
    MARKET   = 16,  // Wynik transakcji rynkowej
    GARAGE   = 32   // Wynik przechowywania pojazdu
}
```

Powiadomienia są tworzone z dowolnego miejsca (klient lub serwer) używając statycznego API:

```c
// Z serwera, wysyłane do konkretnego gracza przez RPC:
NotificationSystem.Create_Expansion(
    "Trade Complete",          // tytuł
    "You purchased M4A1",     // tekst
    "market_icon",             // nazwa ikony
    ARGB(255, 50, 200, 50),   // kolor
    7,                         // czas wyświetlania (sekundy)
    sendTo,                    // PlayerIdentity (null = wszyscy)
    ExpansionNotificationType.MARKET  // typ
);
```

Moduł powiadomień utrzymuje listę aktywnych powiadomień i zarządza ich cyklem życia. Każdy `ExpansionNotificationView` (podklasa `ScriptView`) obsługuje własną animację pokazywania/ukrywania:

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

Każdy typ powiadomienia ma oddzielny plik layout (`expansion_notification_toast.layout`, `expansion_notification_killfeed.layout` itp.) pozwalający na zupełnie różne sposoby wizualizacji.

### Menu rynku (Złożony panel interaktywny)

`ExpansionMarketMenu` jest jednym z najbardziej złożonych UI w jakimkolwiek modzie DayZ. Rozszerza `ExpansionScriptViewMenu` (który rozszerza ScriptView DabsFramework) i zarządza:

- Drzewem kategorii ze zwijanymi sekcjami
- Siatką przedmiotów z filtrowaniem wyszukiwania
- Wyświetlaniem cen kupna/sprzedaży z ikonami walut
- Kontrolkami ilości
- Widgetem podglądu przedmiotu
- Podglądem inwentarza gracza
- Selektorami rozwijalnymi dla skórek
- Checkboxami konfiguracji akcesoriów
- Oknami dialogowymi potwierdzenia zakupów/sprzedaży

```c
class ExpansionMarketMenu: ExpansionScriptViewMenu
{
    protected ref ExpansionMarketMenuController m_MarketMenuController;
    protected ref ExpansionMarketModule m_MarketModule;
    protected ref ExpansionMarketItem m_SelectedMarketItem;

    // Bezpośrednie referencje widgetów (auto-wypełniane przez ScriptView)
    protected EditBoxWidget market_filter_box;
    protected ButtonWidget market_item_buy;
    protected ButtonWidget market_item_sell;
    protected ScrollWidget market_categories_scroller;
    protected ItemPreviewWidget market_item_preview;
    protected PlayerPreviewWidget market_player_preview;

    // Śledzenie stanu
    protected int m_Quantity = 1;
    protected int m_BuyPrice;
    protected int m_SellPrice;
    protected ExpansionMarketMenuState m_CurrentState;
}
```

**Kluczowy wniosek:** Dla złożonych interaktywnych UI, Expansion łączy MVC DabsFramework z tradycyjnymi referencjami widgetów. Kontroler obsługuje wiązanie danych dla list i tekstu, podczas gdy bezpośrednie referencje widgetów obsługują wyspecjalizowane widgety jak `ItemPreviewWidget` i `PlayerPreviewWidget`, które wymagają imperatywnej kontroli.

### ExpansionScriptViewMenu -- Cykl życia menu

Expansion opakowuje ScriptView w bazową klasę menu, która obsługuje blokowanie wejścia, efekty rozmycia i timery aktualizacji:

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

Zapewnia to, że każde menu Expansion spójnie blokuje ruch gracza, pokazuje kursor, stosuje rozmycie tła i sprząta przy zamykaniu.

---

## Wzorce UI DayZ Editor

DayZ Editor to pełne narzędzie do umieszczania obiektów zbudowane jako mod DayZ. Intensywnie używa DabsFramework i implementuje wzorce typowo spotykane w aplikacjach desktopowych: paski narzędzi, menu, inspektory właściwości, system poleceń z cofaniem/ponawianiem.

### Wzorzec poleceń ze skrótami klawiszowymi

System poleceń Edytora oddziela akcje od elementów UI. Każda akcja (Nowy, Otwórz, Zapisz, Cofnij, Ponów, Usuń itp.) to podklasa `EditorCommand`:

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

`EditorCommandManager` rejestruje wszystkie polecenia i mapuje skróty:

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

Polecenia integrują się z `RelayCommand` DabsFramework, dzięki czemu przyciski paska narzędzi automatycznie szarzeją gdy `CanExecute()` zwraca false.

### System paska menu

Edytor buduje pasek menu (Plik, Edycja, Widok, Edytor) używając obserwowalnej kolekcji elementów menu. Każde menu to podklasa `ScriptView`:

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

`ObservableCollection` automatycznie tworzy wizualne elementy menu gdy polecenia są wstawiane.

### HUD z panelami z wiązaniem danych

Kontroler HUD edytora używa `ObservableCollection` dla wszystkich paneli listowych:

```c
class EditorHudController: EditorControllerBase
{
    // Listy obiektów powiązane z panelami bocznych pasków
    ref ObservableCollection<ref EditorPlaceableListItem> LeftbarSpacerConfig;
    ref ObservableCollection<EditorListItem> RightbarPlacedData;
    ref ObservableCollection<EditorPlayerListItem> RightbarPlayerData;

    // Wpisy logu z maksymalną liczbą
    static const int MAX_LOG_ENTRIES = 20;
    ref ObservableCollection<ref EditorLogEntry> EditorLogEntries;

    // Klatki kluczowe ścieżki kamery
    ref ObservableCollection<ref EditorCameraTrackListItem> CameraTrackData;
}
```

Dodanie obiektu do sceny automatycznie dodaje go do listy bocznego paska. Usunięcie go usuwa. Brak ręcznego tworzenia/niszczenia widgetów.

### Stylizacja przez listy nazw widgetów

Edytor centralizuje stylizowane widgety używając statycznej tablicy nazw widgetów:

```c
static const ref array<string> ThemedWidgetStrings = {
    "LeftbarPanelSearchBarIconButton",
    "FavoritesTabButton",
    "ShowPrivateButton",
    // ...
};
```

Przebieg stylizacji iteruje tę tablicę i stosuje kolory z `EditorSettings`, unikając rozrzuconych wywołań `SetColor()` w całym kodzie.

---

## Wspólne wzorce architektury UI

Te wzorce pojawiają się w wielu modach. Reprezentują konsensus społeczności na temat rozwiązywania powtarzających się problemów UI DayZ.

### Menedżer paneli (Pokaż/Ukryj po nazwie lub typie)

Zarówno VPP, jak i COT utrzymują rejestr paneli UI dostępnych po typename:

```c
// Wzorzec VPP
VPPScriptedMenu GetMenuByType(typename menuType)
{
    foreach (VPPScriptedMenu menu : M_SCRIPTED_UI_INSTANCES)
    {
        if (menu && menu.GetType() == menuType)
            return menu;
    }
    return NULL;
}

// Wzorzec COT
void ToggleShow()
{
    if (IsVisible())
        Close();
    else
        Show();
}
```

Zapobiega to duplikowaniu paneli i zapewnia pojedynczy punkt kontroli widoczności.

### Recykling widgetów dla list

Wyświetlając duże listy (listy graczy, katalogi przedmiotów, przeglądarki obiektów), mody unikają tworzenia/niszczenia widgetów przy każdej aktualizacji. Zamiast tego utrzymują pulę:

```c
// Uproszczony wzorzec używany w modach
void UpdatePlayerList(array<PlayerInfo> players)
{
    // Ukryj nadmiarowe widgety
    for (int i = players.Count(); i < m_PlayerWidgets.Count(); i++)
        m_PlayerWidgets[i].Show(false);

    // Twórz nowe widgety tylko gdy potrzeba
    while (m_PlayerWidgets.Count() < players.Count())
    {
        Widget w = GetGame().GetWorkspace().CreateWidgets(PLAYER_ENTRY_LAYOUT, m_ListParent);
        m_PlayerWidgets.Insert(w);
    }

    // Aktualizuj widoczne widgety danymi
    for (int j = 0; j < players.Count(); j++)
    {
        m_PlayerWidgets[j].Show(true);
        SetPlayerData(m_PlayerWidgets[j], players[j]);
    }
}
```

`ObservableCollection` DabsFramework obsługuje to automatycznie, ale ręczne implementacje używają tego wzorca.

### Leniwe tworzenie widgetów

Kilka modów odkłada tworzenie widgetów do pierwszego wyświetlenia:

```c
// Wzorzec VPP
override Widget Init()
{
    if (!m_Init)
    {
        layoutRoot = GetGame().GetWorkspace().CreateWidgets(VPPATUIConstants.VPPAdminHud);
        m_Init = true;
        return layoutRoot;
    }
    // Kolejne wywołania pomijają tworzenie
    return layoutRoot;
}
```

Unika to ładowania wszystkich paneli administracyjnych przy starcie, gdy większość nigdy nie zostanie otwarta.

### Delegacja zdarzeń przez łańcuchy handlerów

Powszechnym wzorcem jest handler nadrzędny, który deleguje do handlerów potomnych:

```c
// Rodzic obsługuje kliknięcie, kieruje do odpowiedniego dziecka
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_closeButton)
    {
        HideSubMenu();
        return true;
    }

    // Deleguj do aktywnego panelu narzędziowego
    if (m_ActivePanel)
        return m_ActivePanel.OnClick(w, x, y, button);

    return false;
}
```

### OnWidgetScriptInit jako uniwersalny punkt wejścia

Każdy badany mod używa `OnWidgetScriptInit` jako mechanizmu wiązania layout-skrypt:

```c
void OnWidgetScriptInit(Widget w)
{
    m_root = w;
    m_root.SetHandler(this);

    // Znajdź widgety potomne
    m_Button = ButtonWidget.Cast(m_root.FindAnyWidget("button_name"));
    m_Text = TextWidget.Cast(m_root.FindAnyWidget("text_name"));
}
```

Jest to ustawiane przez właściwość `scriptclass` w pliku layout. Silnik wywołuje `OnWidgetScriptInit` automatycznie gdy `CreateWidgets()` przetwarza widget z klasą skryptu.

---

## Antywzorce do unikania

Te błędy pojawiają się w rzeczywistym kodzie modów i powodują problemy z wydajnością lub awarie.

### Tworzenie widgetów co klatkę

```c
// ŹLE: Tworzy nowe widgety przy każdym wywołaniu Update
override void Update(float dt)
{
    Widget label = GetGame().GetWorkspace().CreateWidgets("label.layout", m_Parent);
    TextWidget.Cast(label.FindAnyWidget("text")).SetText(m_Value);
}
```

Tworzenie widgetów alokuje pamięć i wymusza przeliczenie layoutu. Przy 60 FPS to tworzy 60 widgetów na sekundę. Zawsze twórz raz i aktualizuj w miejscu.

### Brak czyszczenia handlerów zdarzeń

```c
// ŹLE: Insert bez odpowiadającego Remove
void OnInit()
{
    GetGame().GetUpdateQueue(CALL_CATEGORY_GUI).Insert(Update);
    JMScriptInvokers.ESP_VIEWTYPE_CHANGED.Insert(OnESPViewTypeChanged);
}

// Brakuje w destruktorze:
// GetGame().GetUpdateQueue(CALL_CATEGORY_GUI).Remove(Update);
// JMScriptInvokers.ESP_VIEWTYPE_CHANGED.Remove(OnESPViewTypeChanged);
```

Każdy `Insert` na `ScriptInvoker` lub kolejce aktualizacji potrzebuje odpowiadającego `Remove` w destruktorze. Osierocone handlery powodują wywołania na usuniętych obiektach i awarie dostępu null.

### Hardkodowanie pozycji pikseli

```c
// ŹLE: Psuje się na różnych rozdzielczościach
m_Panel.SetPos(540, 320);
m_Panel.SetSize(400, 300);
```

Zawsze używaj proporcjonalnego (0.0-1.0) pozycjonowania lub pozwól kontenerom obsługiwać layout. Pozycje pikseli działają tylko w rozdzielczości, dla której zostały zaprojektowane.

### Głębokie zagnieżdżanie widgetów bez przeznaczenia

```
Frame -> Panel -> Frame -> Panel -> Frame -> TextWidget
```

Każdy poziom zagnieżdżenia dodaje narzut obliczeniowy layoutu. Jeśli pośredni widget nie służy żadnemu celowi (brak tła, brak ograniczeń rozmiaru, brak obsługi zdarzeń), usuń go. Spłaszczaj hierarchie gdzie to możliwe.

### Ignorowanie zarządzania fokusem

```c
// ŹLE: Otwiera okno dialogowe, ale nie ustawia fokusu
void ShowDialog()
{
    m_Dialog.Show(true);
    // Brak: SetFocus(m_Dialog.GetLayoutRoot());
}
```

Bez `SetFocus()` zdarzenia klawiatury mogą nadal trafiać do widgetów za oknem dialogowym. Podejście Expansion jest prawidłowe:

```c
override void OnShow()
{
    SetFocus(GetLayoutRoot());
}
```

### Zapomnienie o czyszczeniu widgetów przy destrukcji

```c
// ŹLE: Drzewo widgetów wycieka gdy obiekt skryptu jest niszczony
void ~MyPanel()
{
    // Brak m_root.Unlink()!
}
```

Jeśli tworzysz widgety przez `CreateWidgets()`, jesteś ich właścicielem. Wywołaj `Unlink()` na korzeniu w swoim destruktorze. `ScriptView` i `UIScriptedMenu` obsługują to automatycznie, ale surowe podklasy `ScriptedWidgetEventHandler` muszą to robić ręcznie.

---

## Podsumowanie: Który wzorzec kiedy używać

| Potrzeba | Zalecany wzorzec | Mod źródłowy |
|------|-------------------|------------|
| Prosty panel narzędziowy | `ScriptedWidgetEventHandler` + `OnWidgetScriptInit` | VPP |
| Złożone UI z wiązaniem danych | `ScriptView` + `ViewController` + `ObservableCollection` | DabsFramework |
| System paneli administracyjnych | Moduł + Formularz + Okno (wzorzec rejestracji modułów) | COT |
| Przeciągalne pod-okna | `AdminHudSubMenu` (obsługa przeciągania paska tytułu) | VPP |
| Okno dialogowe potwierdzenia | `VPPDialogBox` lub `JMConfirmation` (oparte na callbackach) | VPP / COT |
| Popup z polem wejściowym | Wzorzec `PopUpCreatePreset` (`delete this` przy zamknięciu) | VPP |
| Menu pełnoekranowe | `ExpansionScriptViewMenu` (blokada kontrolek, rozmycie, timer) | Expansion |
| System motywów/kolorów | Trójwarstwowy (paleta, schemat, branding) z `modded class` | Colorful UI |
| Nadpisanie vanillowego UI | `modded class` + zastępcze pliki `.layout` | Colorful UI |
| System powiadomień | Enum typów + layout per typ + statyczne API tworzenia | Expansion |
| System poleceń paska narzędzi | `EditorCommand` + `EditorCommandManager` + skróty | DayZ Editor |
| Pasek menu z elementami | `EditorMenu` + `ObservableCollection<EditorMenuItem>` | DayZ Editor |
| Nakładka ESP/HUD | Pełnoekranowy `CanvasWidget` + rzutowane pozycjonowanie widgetów | COT |
| Warianty rozdzielczości | Oddzielne katalogi layoutu (narrow/medium/wide) | Colorful UI |
| Wydajność dużych list | Pula recyklingu widgetów (ukryj/pokaż, twórz na żądanie) | Wspólne |
| Konfiguracja | Zmienne statyczne (mod kliencki) lub JSON przez menedżer konfiguracji | Colorful UI |

### Schemat decyzyjny

1. **Czy to prosty jednorazowy panel?** Użyj `ScriptedWidgetEventHandler` z `OnWidgetScriptInit`. Zbuduj layout w edytorze, znajdź widgety po nazwie.

2. **Czy ma dynamiczne listy lub często zmieniające się dane?** Użyj `ViewController` DabsFramework z `ObservableCollection`. Wiązanie danych eliminuje ręczne aktualizacje widgetów.

3. **Czy jest częścią wielopanelowego narzędzia administracyjnego?** Użyj wzorca moduł-formularz COT. Każde narzędzie jest samodzielne z własnym modułem, formularzem i layoutem. Rejestracja to jedna linia.

4. **Czy musi zastąpić vanillowe UI?** Użyj wzorca Colorful UI: `modded class`, niestandardowy plik layout, scentralizowany schemat kolorów.

5. **Czy potrzebuje synchronizacji danych serwer-klient?** Połącz dowolny powyższy wzorzec z RPC. Menu rynku Expansion pokazuje jak zarządzać stanami ładowania, cyklami żądanie/odpowiedź i timerami aktualizacji w ScriptView.

6. **Czy potrzebuje cofania/ponawiania lub złożonej interakcji?** Użyj wzorca poleceń z DayZ Editor. Polecenia oddzielają akcje od przycisków, obsługują skróty i integrują się z `RelayCommand` DabsFramework do automatycznego włączania/wyłączania.

---

*Następny rozdział: [Zaawansowane widgety](10-advanced-widgets.md) -- Formatowanie RichTextWidget, rysowanie CanvasWidget, znaczniki MapWidget, ItemPreviewWidget, PlayerPreviewWidget, VideoWidget i RenderTargetWidget.*
