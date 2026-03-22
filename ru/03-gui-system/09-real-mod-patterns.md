# Глава 3.9: Паттерны UI реальных модов

[Главная](../README.md) | [<< Назад: Диалоги и модальные окна](08-dialogs-modals.md) | **Паттерны UI реальных модов** | [Далее: Продвинутые виджеты >>](10-advanced-widgets.md)

---

Эта глава рассматривает паттерны UI, обнаруженные в шести профессиональных модах DayZ: COT (Community Online Tools), VPP Admin Tools, DabsFramework, Colorful UI, Expansion и DayZ Editor. Каждый мод решает свои задачи. Изучение их подходов даёт библиотеку проверенных паттернов, выходящих за рамки официальной документации.

Весь показанный код извлечён из реального исходного кода модов. Пути к файлам ссылаются на оригинальные репозитории.

---

## Зачем изучать реальные моды?

Документация DayZ объясняет отдельные виджеты и обратные вызовы событий, но ничего не говорит о:

- Как управлять 12 админ-панелями без дублирования кода
- Как построить систему диалогов с маршрутизацией обратных вызовов
- Как стилизовать весь UI без изменения ванильных файлов макетов
- Как синхронизировать сетку маркета с серверными данными через RPC
- Как структурировать редактор с отменой/повтором и системой команд

Это архитектурные задачи. Каждый крупный мод изобретает для них решения. Одни элегантные, другие -- поучительные примеры. Эта глава систематизирует паттерны, чтобы вы могли выбрать правильный подход для своего проекта.

---

## Паттерны UI COT (Community Online Tools)

COT -- наиболее широко используемый инструмент администрирования DayZ. Его архитектура UI построена вокруг системы модуль-форма-окно, где каждый инструмент (ESP, менеджер игроков, телепорт, спаунер объектов и т.д.) является самодостаточным модулем со своей панелью.

### Архитектура "модуль-форма-окно"

COT разделяет ответственности на три уровня:

1. **JMRenderableModuleBase** -- объявляет метаданные модуля (заголовок, иконка, путь к макету, разрешения). Управляет жизненным циклом CF_Window. Не содержит логики UI.
2. **JMFormBase** -- фактическая панель UI. Расширяет `ScriptedWidgetEventHandler`. Получает события виджетов, строит элементы UI, взаимодействует с модулем для операций с данными.
3. **CF_Window** -- оконный контейнер, предоставляемый фреймворком CF. Обрабатывает перетаскивание, изменение размера, закрытие окна.

Модуль объявляет себя через переопределения:

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

Модуль регистрируется в центральном конструкторе, который строит список модулей:

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

Когда вызывается `Show()` для модуля, создаётся окно и загружается форма:

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

Метод `Init` формы привязывает ссылку на модуль через защищённое переопределение:

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
        // Построить элементы UI программно с помощью UIActionManager
    }
}
```

**Ключевой вывод:** Каждый инструмент полностью самодостаточен. Добавление нового инструмента администрирования означает создание одного класса Module, одного класса Form, одного файла макета и вставку одной строки в конструктор. Никаких изменений в существующем коде.

### Программное создание UI с UIActionManager

COT не строит сложные формы в файлах макетов. Вместо этого используется фабричный класс (`UIActionManager`), который создаёт стандартизированные виджеты действий UI во время выполнения:

```c
override void OnInit()
{
    m_Scroller = UIActionManager.CreateScroller(layoutRoot.FindAnyWidget("panel"));
    Widget actions = m_Scroller.GetContentWidget();

    // Сетка: 8 строк, 1 столбец
    m_PanelAlpha = UIActionManager.CreateGridSpacer(actions, 8, 1);

    // Стандартные типы виджетов
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

    // Вложенная сетка для кнопок рядом друг с другом
    Widget gridButtons = UIActionManager.CreateGridSpacer(m_PanelAlpha, 1, 2);
    m_Button = UIActionManager.CreateButton(gridButtons, "Left", this, "OnClick_Left");
    m_NavButton = UIActionManager.CreateNavButton(gridButtons, "Right", ...);
}
```

Каждый тип `UIAction*` виджета имеет собственный файл макета (например, `UIActionSlider.layout`, `UIActionCheckbox.layout`), загружаемый как префаб. Фабричный подход означает:

- Единообразные размеры и отступы во всех панелях
- Нет дублирования файлов макетов
- Новые типы действий можно добавить один раз и использовать повсюду

### ESP-оверлей (рисование на CanvasWidget)

ESP-система COT рисует метки, полоски здоровья и линии непосредственно поверх 3D-мира с помощью `CanvasWidget`. Ключевой паттерн -- экранный `CanvasWidget`, покрывающий весь viewport, с отдельными обработчиками виджетов ESP, позиционируемыми по проецированным мировым координатам:

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

Виджеты ESP создаются из макетов-префабов (`esp_widget.layout`) и позиционируются каждый кадр путём проецирования 3D-позиций в экранные координаты. Сам холст -- это полноэкранный оверлей, загружаемый при запуске.

### Диалоги подтверждения

COT предоставляет систему подтверждений на основе обратных вызовов, встроенную в `JMFormBase`. Подтверждения создаются с именованными обратными вызовами:

```c
CreateConfirmation_Two(
    JMConfirmationType.INFO,
    "Are you sure?",
    "This will kick the player.",
    "#STR_COT_GENERIC_YES", "OnConfirmKick",
    "#STR_COT_GENERIC_NO", ""
);
```

`JMConfirmationForm` использует `CallByName` для вызова метода обратного вызова на форме:

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

Это позволяет цепочку подтверждений (одно подтверждение открывает другое) без жёсткого кодирования потока.

---

## Паттерны UI VPP Admin Tools

VPP использует другой подход по сравнению с COT: он использует `UIScriptedMenu` с HUD-панелью инструментов, перетаскиваемыми подокнами и глобальной системой диалогов.

### Регистрация кнопок панели инструментов

`VPPAdminHud` поддерживает список определений кнопок. Каждая кнопка связывает строку разрешения с отображаемым именем, иконкой и подсказкой:

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
        // ... ещё 10 инструментов
        DefineButtons();

        // Проверить разрешения на сервере через RPC
        array<string> perms = new array<string>;
        for (int i = 0; i < m_DefinedButtons.Count(); i++)
            perms.Insert(m_DefinedButtons[i].param1);
        GetRPCManager().VSendRPC("RPC_PermitManager",
            "VerifyButtonsPermission", new Param1<ref array<string>>(perms), true);
    }
}
```

Внешние моды могут переопределить `DefineButtons()` для добавления своих кнопок на панель инструментов, что делает VPP расширяемым без изменения его исходного кода.

### Система подокон

Каждая панель инструмента расширяет `AdminHudSubMenu`, который обеспечивает поведение перетаскиваемого окна, переключение видимости и управление приоритетом окон:

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

    // Поддержка перетаскивания через заголовок
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

    // Двойной клик по заголовку для максимизации/восстановления
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

**Ключевой вывод:** VPP строит мини-менеджер окон внутри DayZ. Каждое подменю -- это перетаскиваемое, изменяемое в размерах окно с управлением фокусом. Вызов `SetWindowPriorty()` регулирует z-порядок, чтобы нажатое окно оказывалось поверх остальных.

### VPPDialogBox -- диалог на основе обратных вызовов

Система диалогов VPP использует подход на основе перечислений. Диалог показывает/скрывает кнопки в зависимости от типа перечисления и направляет результат через `CallFunction`:

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

`ConfirmationEventHandler` оборачивает виджет кнопки так, чтобы нажатие на неё открывало диалог. Результат диалога передаётся любому классу через именованный обратный вызов:

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

### Всплывающее окно с OnWidgetScriptInit

Всплывающие формы VPP привязываются к макету через `OnWidgetScriptInit` и используют `ScriptedWidgetEventHandler`:

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

**Ключевой вывод:** `delete this` при закрытии -- распространённый паттерн утилизации всплывающих окон. Деструктор вызывает `m_root.Unlink()` для удаления дерева виджетов. Это чисто, но требует осторожности -- если что-то удерживает ссылку на всплывающее окно после удаления, вы получите доступ к null.

---

## Паттерны UI DabsFramework

DabsFramework вводит полноценную архитектуру MVC (Модель-Представление-Контроллер) для UI DayZ. Он используется DayZ Editor и Expansion как основа UI.

### ViewController и привязка данных

Основная идея: вместо ручного поиска виджетов и установки их текста, вы объявляете свойства в классе контроллера и привязываете их к виджетам по имени в редакторе макетов.

```c
class TestController: ViewController
{
    // Имя переменной совпадает с Binding_Name в макете
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

В макете каждый виджет имеет скриптовый класс `ViewBinding` с ссылочным свойством `Binding_Name`, установленным в имя переменной (например, "TextBox1"). Когда вызывается `NotifyPropertyChanged()`, фреймворк находит все ViewBinding с этим именем и обновляет виджет:

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

**Двусторонняя привязка** означает, что изменения в виджете (пользовательский ввод) автоматически распространяются обратно на свойство контроллера.

### ObservableCollection -- привязка данных списков

Для динамических списков DabsFramework предоставляет `ObservableCollection<T>`. Операции вставки/удаления автоматически обновляют привязанный виджет (например, WrapSpacer или ScrollWidget):

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
        // Вызывается автоматически при Insert/Remove
    }
}
```

Каждый `Insert()` генерирует событие `CollectionChanged`, которое ViewBinding перехватывает для создания/уничтожения дочерних виджетов. Ручное управление виджетами не требуется.

### ScriptView -- макет из кода

`ScriptView` -- это полностью скриптовая альтернатива `OnWidgetScriptInit`. Вы наследуете его, переопределяете `GetLayoutFile()` и создаёте экземпляр. Конструктор загружает макет, находит контроллер и связывает всё:

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

// Использование:
CustomDialogWindow window = new CustomDialogWindow();
```

Переменные виджетов, объявленные как поля подклассов `ScriptView`, автоматически заполняются путём сопоставления имён с иерархией макета (`LoadWidgetsAsVariables`). Это устраняет вызовы `FindAnyWidget()`.

### RelayCommand -- привязка кнопки к действию

Кнопки могут быть привязаны к объектам `RelayCommand` через ссылочное свойство `Relay_Command` в ViewBinding. Это отделяет нажатия кнопок от обработчиков:

```c
class EditorCommand: RelayCommand
{
    override bool Execute(Class sender, CommandArgs args)
    {
        // Выполнить действие
        return true;
    }

    override bool CanExecute()
    {
        // Включить/отключить кнопку
        return true;
    }

    override void CanExecuteChanged(bool state)
    {
        // Затемнить виджет когда отключён
        if (m_ViewBinding)
        {
            Widget root = m_ViewBinding.GetLayoutRoot();
            root.SetAlpha(state ? 1 : 0.15);
            root.Enable(state);
        }
    }
}
```

**Ключевой вывод:** DabsFramework устраняет шаблонный код. Вы объявляете данные, привязываете их по имени, и фреймворк обрабатывает синхронизацию. Цена -- кривая обучения и зависимость от фреймворка.

---

## Паттерны Colorful UI

Colorful UI заменяет ванильные меню DayZ стилизованными версиями без изменения ванильных файлов скриптов. Его подход полностью основан на переопределениях `modded class` и централизованной системе цветов/брендинга.

### 3-уровневая система тем

Цвета организованы в три уровня:

**Уровень 1 -- UIColor (базовая палитра):** Необработанные значения цветов с семантическими именами.

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

**Уровень 2 -- colorScheme (семантическое отображение):** Связывает концепции UI с цветами палитры. Владельцы серверов меняют этот уровень для стилизации своего сервера.

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

**Уровень 3 -- Branding/Settings (идентичность сервера):** Пути к логотипам, URL-адреса, переключатели функций.

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

### Неразрушающая модификация ванильного UI

Colorful UI заменяет ванильные меню с помощью `modded class`. Каждый подкласс ванильного `UIScriptedMenu` модифицируется для загрузки пользовательского файла макета и применения цветов темы:

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

        // Применить цвета темы
        if (m_TopShader) m_TopShader.SetColor(colorScheme.TopShader());
        if (m_BottomShader) m_BottomShader.SetColor(colorScheme.BottomShader());
        if (m_MenuDivider) m_MenuDivider.SetColor(colorScheme.Separator());

        Branding.ApplyLogo(m_Logo);

        return layoutRoot;
    }
}
```

Этот паттерн важен: Colorful UI поставляет полностью пользовательские файлы `.layout`, которые зеркально повторяют ванильные имена виджетов. Переопределение `modded class` заменяет путь к макету, но сохраняет ванильные имена виджетов, чтобы если какой-либо ванильный код ссылается на эти имена виджетов, он по-прежнему работал.

### Варианты макетов с учётом разрешения

Colorful UI предоставляет отдельные директории макетов инвентаря для разных ширин экрана:

```
GUI/layouts/inventory/narrow/   -- маленькие экраны
GUI/layouts/inventory/medium/   -- стандартное 1080p
GUI/layouts/inventory/wide/     -- ультраширокие
```

Каждая директория содержит одинаковые имена файлов (`cargo_container.layout`, `left_area.layout` и т.д.) с адаптированными размерами. Правильный вариант выбирается во время выполнения на основе разрешения экрана.

### Конфигурация через статические переменные

Владельцы серверов настраивают Colorful UI, редактируя значения статических переменных в `Settings.c`:

```c
static bool StartMainMenu    = true;
static bool NoHints          = false;
static bool LoadVideo        = true;
static bool ShowDeadScreen   = false;
static bool CuiDebug         = true;
```

Это простейшая возможная система конфигурации: отредактировать скрипт, пересобрать PBO. Никакой загрузки JSON, никакого менеджера конфигурации. Для клиентского визуального мода это уместно.

**Ключевой вывод:** Colorful UI демонстрирует, что можно полностью перестилизовать клиент DayZ без серверного кода, используя только переопределения `modded class`, пользовательские файлы макетов и централизованную систему цветов.

---

## Паттерны UI Expansion

DayZ Expansion -- крупнейшая экосистема модов сообщества. Его UI варьируется от всплывающих уведомлений до полноценных торговых интерфейсов маркета с серверной синхронизацией.

### Система уведомлений (несколько типов)

Expansion определяет шесть визуальных типов уведомлений, каждый со своим макетом:

```c
enum ExpansionNotificationType
{
    TOAST    = 1,    // Маленькое всплывающее окно в углу
    BAGUETTE = 2,   // Широкий баннер через весь экран
    ACTIVITY = 4,   // Запись ленты активности
    KILLFEED = 8,   // Объявление об убийстве
    MARKET   = 16,  // Результат транзакции маркета
    GARAGE   = 32   // Результат хранения транспорта
}
```

Уведомления создаются из любого места (клиент или сервер) через статический API:

```c
// С сервера, отправляется конкретному игроку через RPC:
NotificationSystem.Create_Expansion(
    "Trade Complete",          // заголовок
    "You purchased M4A1",     // текст
    "market_icon",             // имя иконки
    ARGB(255, 50, 200, 50),   // цвет
    7,                         // время отображения (секунды)
    sendTo,                    // PlayerIdentity (null = всем)
    ExpansionNotificationType.MARKET  // тип
);
```

Модуль уведомлений поддерживает список активных уведомлений и управляет их жизненным циклом. Каждый `ExpansionNotificationView` (подкласс `ScriptView`) обрабатывает свою анимацию показа/скрытия:

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

Каждый тип уведомления имеет отдельный файл макета (`expansion_notification_toast.layout`, `expansion_notification_killfeed.layout` и т.д.), что позволяет совершенно различное визуальное оформление.

### Меню маркета (сложная интерактивная панель)

`ExpansionMarketMenu` -- один из самых сложных UI в любом моде DayZ. Он расширяет `ExpansionScriptViewMenu` (который расширяет ScriptView от DabsFramework) и управляет:

- Деревом категорий со сворачиваемыми секциями
- Сеткой предметов с поиском и фильтрацией
- Отображением цен покупки/продажи с иконками валюты
- Элементами управления количеством
- Виджетом предпросмотра предмета
- Предпросмотром инвентаря игрока
- Выпадающими списками для выбора скинов
- Чекбоксами конфигурации вложений
- Диалогами подтверждения для покупок/продаж

```c
class ExpansionMarketMenu: ExpansionScriptViewMenu
{
    protected ref ExpansionMarketMenuController m_MarketMenuController;
    protected ref ExpansionMarketModule m_MarketModule;
    protected ref ExpansionMarketItem m_SelectedMarketItem;

    // Прямые ссылки на виджеты (автозаполнение через ScriptView)
    protected EditBoxWidget market_filter_box;
    protected ButtonWidget market_item_buy;
    protected ButtonWidget market_item_sell;
    protected ScrollWidget market_categories_scroller;
    protected ItemPreviewWidget market_item_preview;
    protected PlayerPreviewWidget market_player_preview;

    // Отслеживание состояния
    protected int m_Quantity = 1;
    protected int m_BuyPrice;
    protected int m_SellPrice;
    protected ExpansionMarketMenuState m_CurrentState;
}
```

**Ключевой вывод:** Для сложных интерактивных UI Expansion комбинирует MVC от DabsFramework с традиционными ссылками на виджеты. Контроллер обрабатывает привязку данных для списков и текста, а прямые ссылки на виджеты обрабатывают специализированные виджеты, такие как `ItemPreviewWidget` и `PlayerPreviewWidget`, которые требуют императивного управления.

### ExpansionScriptViewMenu -- жизненный цикл меню

Expansion оборачивает ScriptView в базовый класс меню, который обрабатывает блокировку ввода, эффекты размытия и таймеры обновления:

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

Это гарантирует, что каждое меню Expansion единообразно блокирует движение игрока, показывает курсор, применяет размытие фона и корректно очищается при закрытии.

---

## Паттерны UI DayZ Editor

DayZ Editor -- это полноценный инструмент размещения объектов, построенный как мод DayZ. Он активно использует DabsFramework и реализует паттерны, обычно встречающиеся в настольных приложениях: панели инструментов, меню, инспекторы свойств, система команд с отменой/повтором.

### Паттерн команд с горячими клавишами

Система команд редактора отделяет действия от элементов UI. Каждое действие (Создать, Открыть, Сохранить, Отменить, Повторить, Удалить и т.д.) -- это подкласс `EditorCommand`:

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

`EditorCommandManager` регистрирует все команды и назначает горячие клавиши:

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

Команды интегрируются с `RelayCommand` от DabsFramework, так что кнопки панели инструментов автоматически становятся серыми, когда `CanExecute()` возвращает false.

### Система панели меню

Редактор строит свою панель меню (Файл, Редактирование, Вид, Редактор) используя наблюдаемую коллекцию элементов меню. Каждое меню -- это подкласс `ScriptView`:

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

`ObservableCollection` автоматически создаёт визуальные элементы меню при добавлении команд.

### HUD с панелями на привязке данных

Контроллер HUD редактора использует `ObservableCollection` для всех панелей списков:

```c
class EditorHudController: EditorControllerBase
{
    // Списки объектов, привязанные к панелям боковой панели
    ref ObservableCollection<ref EditorPlaceableListItem> LeftbarSpacerConfig;
    ref ObservableCollection<EditorListItem> RightbarPlacedData;
    ref ObservableCollection<EditorPlayerListItem> RightbarPlayerData;

    // Записи журнала с максимальным количеством
    static const int MAX_LOG_ENTRIES = 20;
    ref ObservableCollection<ref EditorLogEntry> EditorLogEntries;

    // Ключевые кадры трека камеры
    ref ObservableCollection<ref EditorCameraTrackListItem> CameraTrackData;
}
```

Добавление объекта в сцену автоматически добавляет его в список боковой панели. Удаление убирает его. Ручное создание/уничтожение виджетов не требуется.

### Стилизация через списки имён виджетов

Редактор централизует стилизуемые виджеты с помощью статического массива имён виджетов:

```c
static const ref array<string> ThemedWidgetStrings = {
    "LeftbarPanelSearchBarIconButton",
    "FavoritesTabButton",
    "ShowPrivateButton",
    // ...
};
```

Проход стилизации перебирает этот массив и применяет цвета из `EditorSettings`, избегая разбросанных вызовов `SetColor()` по всей кодовой базе.

---

## Общие архитектурные паттерны UI

Эти паттерны встречаются в нескольких модах. Они представляют собой консенсус сообщества о том, как решать повторяющиеся проблемы UI DayZ.

### Менеджер панелей (показ/скрытие по имени или типу)

И VPP, и COT поддерживают реестр панелей UI, доступных по typename:

```c
// Паттерн VPP
VPPScriptedMenu GetMenuByType(typename menuType)
{
    foreach (VPPScriptedMenu menu : M_SCRIPTED_UI_INSTANCES)
    {
        if (menu && menu.GetType() == menuType)
            return menu;
    }
    return NULL;
}

// Паттерн COT
void ToggleShow()
{
    if (IsVisible())
        Close();
    else
        Show();
}
```

Это предотвращает дублирование панелей и обеспечивает единую точку управления видимостью.

### Переиспользование виджетов для списков

При отображении больших списков (списки игроков, каталоги предметов, браузеры объектов) моды избегают создания/уничтожения виджетов при каждом обновлении. Вместо этого поддерживается пул:

```c
// Упрощённый паттерн, используемый в разных модах
void UpdatePlayerList(array<PlayerInfo> players)
{
    // Скрыть лишние виджеты
    for (int i = players.Count(); i < m_PlayerWidgets.Count(); i++)
        m_PlayerWidgets[i].Show(false);

    // Создать новые виджеты только если нужно
    while (m_PlayerWidgets.Count() < players.Count())
    {
        Widget w = GetGame().GetWorkspace().CreateWidgets(PLAYER_ENTRY_LAYOUT, m_ListParent);
        m_PlayerWidgets.Insert(w);
    }

    // Обновить видимые виджеты данными
    for (int j = 0; j < players.Count(); j++)
    {
        m_PlayerWidgets[j].Show(true);
        SetPlayerData(m_PlayerWidgets[j], players[j]);
    }
}
```

`ObservableCollection` от DabsFramework обрабатывает это автоматически, но ручные реализации используют этот паттерн.

### Ленивое создание виджетов

Несколько модов откладывают создание виджетов до первого показа:

```c
// Паттерн VPP
override Widget Init()
{
    if (!m_Init)
    {
        layoutRoot = GetGame().GetWorkspace().CreateWidgets(VPPATUIConstants.VPPAdminHud);
        m_Init = true;
        return layoutRoot;
    }
    // Последующие вызовы пропускают создание
    return layoutRoot;
}
```

Это позволяет избежать загрузки всех админ-панелей при запуске, когда большинство из них никогда не будут открыты.

### Делегирование событий через цепочки обработчиков

Распространённый паттерн -- родительский обработчик, который делегирует дочерним обработчикам:

```c
// Родитель обрабатывает клик и направляет к соответствующему дочернему
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_closeButton)
    {
        HideSubMenu();
        return true;
    }

    // Делегировать активной панели инструмента
    if (m_ActivePanel)
        return m_ActivePanel.OnClick(w, x, y, button);

    return false;
}
```

### OnWidgetScriptInit как универсальная точка входа

Каждый изученный мод использует `OnWidgetScriptInit` как механизм привязки макета к скрипту:

```c
void OnWidgetScriptInit(Widget w)
{
    m_root = w;
    m_root.SetHandler(this);

    // Найти дочерние виджеты
    m_Button = ButtonWidget.Cast(m_root.FindAnyWidget("button_name"));
    m_Text = TextWidget.Cast(m_root.FindAnyWidget("text_name"));
}
```

Это устанавливается через свойство `scriptclass` в файле макета. Движок автоматически вызывает `OnWidgetScriptInit`, когда `CreateWidgets()` обрабатывает виджет со скриптовым классом.

---

## Антипаттерны, которых следует избегать

Эти ошибки встречаются в реальном коде модов и вызывают проблемы с производительностью или вылеты.

### Создание виджетов каждый кадр

```c
// ПЛОХО: Создаёт новые виджеты при каждом вызове Update
override void Update(float dt)
{
    Widget label = GetGame().GetWorkspace().CreateWidgets("label.layout", m_Parent);
    TextWidget.Cast(label.FindAnyWidget("text")).SetText(m_Value);
}
```

Создание виджетов выделяет память и вызывает пересчёт макета. При 60 FPS это создаёт 60 виджетов в секунду. Всегда создавайте один раз и обновляйте на месте.

### Отсутствие очистки обработчиков событий

```c
// ПЛОХО: Insert без соответствующего Remove
void OnInit()
{
    GetGame().GetUpdateQueue(CALL_CATEGORY_GUI).Insert(Update);
    JMScriptInvokers.ESP_VIEWTYPE_CHANGED.Insert(OnESPViewTypeChanged);
}

// Отсутствует в деструкторе:
// GetGame().GetUpdateQueue(CALL_CATEGORY_GUI).Remove(Update);
// JMScriptInvokers.ESP_VIEWTYPE_CHANGED.Remove(OnESPViewTypeChanged);
```

Каждый `Insert` в `ScriptInvoker` или очередь обновлений требует соответствующего `Remove` в деструкторе. Осиротевшие обработчики вызывают обращения к удалённым объектам и вылеты из-за доступа к null.

### Жёсткое кодирование пиксельных позиций

```c
// ПЛОХО: Ломается на разных разрешениях
m_Panel.SetPos(540, 320);
m_Panel.SetSize(400, 300);
```

Всегда используйте пропорциональное (0.0-1.0) позиционирование или позвольте контейнерным виджетам управлять макетом. Пиксельные позиции работают только на том разрешении, для которого были спроектированы.

### Глубокая вложенность виджетов без необходимости

```
Frame -> Panel -> Frame -> Panel -> Frame -> TextWidget
```

Каждый уровень вложенности добавляет накладные расходы на расчёт макета. Если промежуточный виджет не несёт функции (нет фона, нет ограничений размера, нет обработки событий), удалите его. Делайте иерархии плоскими где возможно.

### Игнорирование управления фокусом

```c
// ПЛОХО: Открывает диалог, но не устанавливает фокус
void ShowDialog()
{
    m_Dialog.Show(true);
    // Отсутствует: SetFocus(m_Dialog.GetLayoutRoot());
}
```

Без `SetFocus()` события клавиатуры могут по-прежнему поступать виджетам за диалогом. Подход Expansion корректен:

```c
override void OnShow()
{
    SetFocus(GetLayoutRoot());
}
```

### Забывание об очистке виджетов при уничтожении

```c
// ПЛОХО: Дерево виджетов утекает при уничтожении скриптового объекта
void ~MyPanel()
{
    // m_root.Unlink() отсутствует!
}
```

Если вы создали виджеты с помощью `CreateWidgets()`, вы владеете ими. Вызывайте `Unlink()` для корня в деструкторе. `ScriptView` и `UIScriptedMenu` обрабатывают это автоматически, но подклассы `ScriptedWidgetEventHandler` должны делать это вручную.

---

## Сводка: какой паттерн использовать

| Потребность | Рекомендуемый паттерн | Мод-источник |
|------|-------------------|------------|
| Простая панель инструмента | `ScriptedWidgetEventHandler` + `OnWidgetScriptInit` | VPP |
| Сложный UI с привязкой данных | `ScriptView` + `ViewController` + `ObservableCollection` | DabsFramework |
| Система админ-панелей | Модуль + Форма + Окно (паттерн регистрации модулей) | COT |
| Перетаскиваемые подокна | `AdminHudSubMenu` (перетаскивание за заголовок) | VPP |
| Диалог подтверждения | `VPPDialogBox` или `JMConfirmation` (на основе обратных вызовов) | VPP / COT |
| Всплывающее окно с вводом | Паттерн `PopUpCreatePreset` (`delete this` при закрытии) | VPP |
| Полноэкранное меню | `ExpansionScriptViewMenu` (блокировка управления, размытие, таймер) | Expansion |
| Система тем/цветов | 3-уровневая (палитра, схема, брендинг) с `modded class` | Colorful UI |
| Переопределение ванильного UI | `modded class` + заменяющие файлы `.layout` | Colorful UI |
| Система уведомлений | Перечисление типов + макет для каждого типа + статический API создания | Expansion |
| Система команд панели инструментов | `EditorCommand` + `EditorCommandManager` + горячие клавиши | DayZ Editor |
| Панель меню с элементами | `EditorMenu` + `ObservableCollection<EditorMenuItem>` | DayZ Editor |
| ESP/HUD оверлей | Полноэкранный `CanvasWidget` + позиционирование проецированных виджетов | COT |
| Варианты для разных разрешений | Отдельные директории макетов (narrow/medium/wide) | Colorful UI |
| Производительность больших списков | Пул переиспользуемых виджетов (скрыть/показать, создать по требованию) | Общий |
| Конфигурация | Статические переменные (клиентский мод) или JSON через менеджер конфигурации | Colorful UI |

### Блок-схема принятия решений

1. **Это одноразовая простая панель?** Используйте `ScriptedWidgetEventHandler` с `OnWidgetScriptInit`. Постройте макет в редакторе, найдите виджеты по имени.

2. **Есть динамические списки или часто меняющиеся данные?** Используйте `ViewController` от DabsFramework с `ObservableCollection`. Привязка данных устраняет ручное обновление виджетов.

3. **Это часть многопанельного инструмента администрирования?** Используйте паттерн модуль-форма от COT. Каждый инструмент самодостаточен со своим модулем, формой и макетом. Регистрация -- одна строка.

4. **Нужно ли заменить ванильный UI?** Используйте паттерн Colorful UI: `modded class`, пользовательский файл макета, централизованная цветовая схема.

5. **Нужна синхронизация данных сервер-клиент?** Комбинируйте любой из вышеперечисленных паттернов с RPC. Меню маркета Expansion показывает, как управлять состояниями загрузки, циклами запрос/ответ и таймерами обновления внутри ScriptView.

6. **Нужна отмена/повтор или сложное взаимодействие?** Используйте паттерн команд из DayZ Editor. Команды отделяют действия от кнопок, поддерживают горячие клавиши и интегрируются с `RelayCommand` от DabsFramework для автоматического включения/отключения.

---

*Следующая глава: [Продвинутые виджеты](10-advanced-widgets.md) -- форматирование RichTextWidget, рисование CanvasWidget, маркеры MapWidget, ItemPreviewWidget, PlayerPreviewWidget, VideoWidget и RenderTargetWidget.*
