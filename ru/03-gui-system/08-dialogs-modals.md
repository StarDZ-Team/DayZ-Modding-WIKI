# 3.8 Диалоги и модальные окна

[Главная](../../README.md) | [<< Previous: Styles & Fonts](07-styles-fonts.md) | **Dialogs & Modals**

Диалоги --- это временные оверлейные окна, требующие взаимодействия пользователя --- запросы подтверждения, уведомления, формы ввода и панели настроек. Эта глава охватывает встроенную систему диалогов, паттерны ручных диалогов, структуру макетов, управление фокусом и типичные ошибки.

---

## Модальные и немодальные

Существует два основных типа диалогов:

- **Модальный** --- Блокирует все взаимодействие с содержимым за диалогом. Пользователь должен ответить (подтвердить, отменить, закрыть) прежде чем делать что-либо еще. Примеры: подтверждение выхода, предупреждение об удалении, запрос переименования.
- **Немодальный** --- Позволяет пользователю взаимодействовать с содержимым за диалогом, пока он остается открытым. Примеры: информационные панели, окна настроек, палитры инструментов.

В DayZ различие контролируется тем, блокируете ли вы игровой ввод при открытии диалога. Модальный диалог вызывает `ChangeGameFocus(1)` и показывает курсор; немодальный диалог может пропустить это или использовать переключаемый подход.

---

## UIScriptedMenu -- The Built-in System

`UIScriptedMenu` is the engine-level base class for all menu screens in DayZ. It integrates with the `UIManager` menu stack, handles input locking automatically, and provides lifecycle hooks. Vanilla DayZ uses it for the in-game menu, logout dialog, respawn dialog, options menu, and many others.

### Иерархия классов

```
UIMenuPanel          (base: menu stack, Close(), submenu management)
  UIScriptedMenu     (scripted menus: Init(), OnShow(), OnHide(), Update())
```

### Минимальный диалог UIScriptedMenu

```c
class MyDialog extends UIScriptedMenu
{
    protected ButtonWidget m_BtnConfirm;
    protected ButtonWidget m_BtnCancel;
    protected TextWidget   m_MessageText;

    override Widget Init()
    {
        layoutRoot = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/my_dialog.layout");

        m_BtnConfirm  = ButtonWidget.Cast(
            layoutRoot.FindAnyWidget("BtnConfirm"));
        m_BtnCancel   = ButtonWidget.Cast(
            layoutRoot.FindAnyWidget("BtnCancel"));
        m_MessageText = TextWidget.Cast(
            layoutRoot.FindAnyWidget("MessageText"));

        return layoutRoot;
    }

    override void OnShow()
    {
        super.OnShow();
        // super.OnShow() calls LockControls() which handles:
        //   GetGame().GetInput().ChangeGameFocus(1);
        //   GetGame().GetUIManager().ShowUICursor(true);
    }

    override void OnHide()
    {
        super.OnHide();
        // super.OnHide() calls UnlockControls() which handles:
        //   GetGame().GetInput().ChangeGameFocus(-1);
        //   GetGame().GetUIManager().ShowUICursor(false);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        super.OnClick(w, x, y, button);

        if (w == m_BtnConfirm)
        {
            // Do action
            Close();
            return true;
        }

        if (w == m_BtnCancel)
        {
            Close();
            return true;
        }

        return false;
    }

    override void Update(float timeslice)
    {
        super.Update(timeslice);

        // ESC to close
        if (GetUApi().GetInputByID(UAUIBack).LocalPress())
        {
            Close();
        }
    }
}
```

### Открытие and Closing

```c
// Opening -- create the menu and push it onto the UIManager stack
MyDialog dialog = new MyDialog();
GetGame().GetUIManager().ShowScriptedMenu(dialog, null);

// Closing from outside
GetGame().GetUIManager().HideScriptedMenu(dialog);

// Closing from inside the dialog class
Close();
```

`ShowScriptedMenu()` pushes the menu onto the engine menu stack, triggers `Init()`, then `OnShow()`. `Close()` triggers `OnHide()`, pops it from the stack, and destroys the widget tree.

### Ключевые методы жизненного цикла

| Метод | Когда вызывается | Типичное использование |
|--------|------------|-------------|
| `Init()` | Один раз при создании меню | Создание виджетов, кеширование ссылок |
| `OnShow()` | После появления меню | Блокировка ввода, запуск таймеров |
| `OnHide()` | После скрытия меню | Разблокировка ввода, отмена таймеров |
| `Update(float timeslice)` | Каждый кадр пока видим | Опрос ввода (клавиша ESC), анимации |
| `Cleanup()` | Перед уничтожением | Освобождение ресурсов |

### LockControls / UnlockControls

`UIScriptedMenu` provides built-in methods that `OnShow()` and `OnHide()` call automatically:

```c
// Inside UIScriptedMenu (engine code, simplified):
void LockControls()
{
    g_Game.GetInput().ChangeGameFocus(1, INPUT_DEVICE_MOUSE);
    g_Game.GetUIManager().ShowUICursor(true);
    g_Game.GetInput().ChangeGameFocus(1, INPUT_DEVICE_KEYBOARD);
    g_Game.GetInput().ChangeGameFocus(1, INPUT_DEVICE_GAMEPAD);
}

void UnlockControls()
{
    g_Game.GetInput().ChangeGameFocus(-1, INPUT_DEVICE_MOUSE);
    g_Game.GetInput().ChangeGameFocus(-1, INPUT_DEVICE_KEYBOARD);
    g_Game.GetInput().ChangeGameFocus(-1, INPUT_DEVICE_GAMEPAD);
    // Cursor visibility depends on whether a parent menu exists
}
```

Because `UIScriptedMenu` handles focus management automatically in `OnShow()`/`OnHide()`, you rarely need to call `ChangeGameFocus()` yourself when using this base class. Simply call `super.OnShow()` and `super.OnHide()`.

---

## Встроенный ShowDialog (нативные диалоговые окна)

The engine provides a native dialog system for simple confirmation prompts. It renders a platform-appropriate dialog box without requiring any layout file.

### Использование

```c
// Show a Yes/No confirmation dialog
const int MY_DIALOG_ID = 500;

g_Game.GetUIManager().ShowDialog(
    "Confirm Action",                  // caption
    "Are you sure you want to do this?", // text
    MY_DIALOG_ID,                      // custom ID to identify this dialog
    DBT_YESNO,                         // button configuration
    DBB_YES,                           // default button
    DMT_QUESTION,                      // icon type
    this                               // handler (receives OnModalResult)
);
```

### Получение результата

The handler (the `UIScriptedMenu` passed as the last argument) receives the result through `OnModalResult`:

```c
override bool OnModalResult(Widget w, int x, int y, int code, int result)
{
    if (code == MY_DIALOG_ID)
    {
        if (result == DBB_YES)
        {
            PerformAction();
        }
        // DBB_NO means user declined -- do nothing
        return true;
    }

    return false;
}
```

### Константы

**Button configurations** (`DBT_` -- DialogBoxType):

| Константа | Показываемые кнопки |
|----------|---------------|
| `DBT_OK` | OK |
| `DBT_YESNO` | Yes, No |
| `DBT_YESNOCANCEL` | Yes, No, Cancel |

**Button identifiers** (`DBB_` -- DialogBoxButton):

| Константа | Значение | Смысл |
|----------|-------|---------|
| `DBB_NONE` | 0 | No default |
| `DBB_OK` | 1 | OK button |
| `DBB_YES` | 2 | Yes button |
| `DBB_NO` | 3 | No button |
| `DBB_CANCEL` | 4 | Cancel button |

**Message types** (`DMT_` -- DialogMessageType):

| Константа | Иконка |
|----------|------|
| `DMT_NONE` | No icon |
| `DMT_INFO` | Info |
| `DMT_WARNING` | Warning |
| `DMT_QUESTION` | Question mark |
| `DMT_EXCLAMATION` | Exclamation |

### Когда использовать ShowDialog

Use `ShowDialog()` for simple alerts and confirmations that do not need custom styling. It is reliable and handles focus/cursor automatically. For branded or complex dialogs (custom layout, input fields, multiple options), build your own dialog class.

---

## Паттерн ручного диалога (без UIScriptedMenu)

When you need a dialog that is not part of the engine menu stack -- for example, a popup inside an existing panel -- extend `ScriptedWidgetEventHandler` instead of `UIScriptedMenu`. This gives you full control but requires manual focus and lifecycle management.

### Базовый паттерн

```c
class SimplePopup : ScriptedWidgetEventHandler
{
    protected Widget       m_Root;
    protected ButtonWidget m_BtnOk;
    protected ButtonWidget m_BtnCancel;
    protected TextWidget   m_Message;

    void Show(string message)
    {
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/simple_popup.layout");
        m_Root.SetHandler(this);

        m_BtnOk     = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnOk"));
        m_BtnCancel = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnCancel"));
        m_Message   = TextWidget.Cast(m_Root.FindAnyWidget("Message"));

        m_Message.SetText(message);

        // Lock game input so player cannot move/shoot
        GetGame().GetInput().ChangeGameFocus(1);
        GetGame().GetUIManager().ShowUICursor(true);
    }

    void Hide()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }

        // Restore game input -- MUST match the +1 from Show()
        GetGame().GetInput().ChangeGameFocus(-1);
        GetGame().GetUIManager().ShowUICursor(false);
    }

    void ~SimplePopup()
    {
        Hide();
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_BtnOk)
        {
            OnConfirm();
            Hide();
            return true;
        }

        if (w == m_BtnCancel)
        {
            Hide();
            return true;
        }

        return false;
    }

    protected void OnConfirm()
    {
        // Override in subclasses or set a callback
    }
}
```

### VPP-Style Popup (OnWidgetScriptInit Pattern)

VPP Admin Tools and other mods use `OnWidgetScriptInit()` to initialize popups. The widget is created by a parent, and the script class is attached via `scriptclass` in the layout file:

```c
class MyPopup : ScriptedWidgetEventHandler
{
    protected Widget       m_Root;
    protected ButtonWidget m_BtnClose;
    protected ButtonWidget m_BtnSave;
    protected EditBoxWidget m_NameInput;

    void OnWidgetScriptInit(Widget w)
    {
        m_Root = w;
        m_Root.SetHandler(this);

        m_BtnClose  = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnClose"));
        m_BtnSave   = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnSave"));
        m_NameInput = EditBoxWidget.Cast(m_Root.FindAnyWidget("NameInput"));

        // Push dialog above other widgets
        m_Root.SetSort(1024, true);
    }

    void ~MyPopup()
    {
        if (m_Root)
            m_Root.Unlink();
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_BtnClose)
        {
            delete this;
            return true;
        }

        if (w == m_BtnSave)
        {
            string name = m_NameInput.GetText();
            if (name != "")
            {
                SaveName(name);
                delete this;
            }
            return true;
        }

        return false;
    }

    protected void SaveName(string name)
    {
        // Process the input
    }
}
```

Родитель создает всплывающее окно, создавая виджет макета как дочерний:

```c
Widget popup = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/GUI/layouts/popup.layout", parentWidget);
```

Движок автоматически вызывает `OnWidgetScriptInit()` для класса скрипта, указанного в атрибуте `scriptclass` макета.

---

## Структура макета диалога

Макет диалога обычно имеет три слоя: полноэкранный корневой элемент для перехвата кликов, полупрозрачный оверлей для затемнения и центрированную панель диалога.

### Пример файла макета

```
FrameWidget "DialogRoot" {
    size 1 1 0 0        // Full screen
    halign fill
    valign fill

    // Semi-transparent background overlay
    ImageWidget "Overlay" {
        size 1 1 0 0
        halign fill
        valign fill
        color "0 0 0 180"
    }

    // Centered dialog panel
    FrameWidget "DialogPanel" {
        halign center
        valign center
        hexactsize 1
        vexactsize 1
        hexactpos  1
        vexactpos  1
        size 0 0 500 300   // 500x300 pixel dialog

        // Title bar
        TextWidget "TitleText" {
            halign fill
            size 1 0 0 30
            text "Dialog Title"
            font "gui/fonts/MetronBook24"
        }

        // Content area
        MultilineTextWidget "ContentText" {
            position 0 0 0 35
            size 1 0 0 200
            halign fill
        }

        // Button row at bottom
        FrameWidget "ButtonRow" {
            valign bottom
            halign fill
            size 1 0 0 40

            ButtonWidget "BtnConfirm" {
                halign left
                size 0 0 120 35
                text "Confirm"
            }

            ButtonWidget "BtnCancel" {
                halign right
                size 0 0 120 35
                text "Cancel"
            }
        }
    }
}
```

### Ключевые принципы макета

1. **Full-screen root** -- The outermost widget covers the entire screen so clicks outside the dialog are intercepted.
2. **Semi-transparent overlay** -- An `ImageWidget` or panel with alpha (e.g., `color "0 0 0 180"`) dims the background, visually indicating a modal state.
3. **Centered panel** -- Use `halign center` and `valign center` with exact pixel sizes for predictable dimensions.
4. **Button alignment** -- Place buttons in a horizontal container at the bottom of the dialog panel.

---

## Паттерн диалога подтверждения

Переиспользуемый диалог подтверждения принимает заголовок, сообщение и обратный вызов. Это самый распространенный паттерн диалога в модах DayZ.

### Реализация

```c
class ConfirmDialog : ScriptedWidgetEventHandler
{
    protected Widget          m_Root;
    protected TextWidget      m_TitleText;
    protected MultilineTextWidget m_ContentText;
    protected ButtonWidget    m_BtnYes;
    protected ButtonWidget    m_BtnNo;

    protected Class           m_CallbackTarget;
    protected string          m_CallbackFunc;

    void ConfirmDialog(string title, string message,
                       Class callbackTarget, string callbackFunc)
    {
        m_CallbackTarget = callbackTarget;
        m_CallbackFunc   = callbackFunc;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/confirm_dialog.layout");
        m_Root.SetHandler(this);

        m_TitleText   = TextWidget.Cast(
            m_Root.FindAnyWidget("TitleText"));
        m_ContentText = MultilineTextWidget.Cast(
            m_Root.FindAnyWidget("ContentText"));
        m_BtnYes      = ButtonWidget.Cast(
            m_Root.FindAnyWidget("BtnYes"));
        m_BtnNo       = ButtonWidget.Cast(
            m_Root.FindAnyWidget("BtnNo"));

        m_TitleText.SetText(title);
        m_ContentText.SetText(message);

        // Ensure dialog renders above other UI
        m_Root.SetSort(1024, true);

        GetGame().GetInput().ChangeGameFocus(1);
        GetGame().GetUIManager().ShowUICursor(true);
    }

    void ~ConfirmDialog()
    {
        if (m_Root)
            m_Root.Unlink();
    }

    protected void SendResult(bool confirmed)
    {
        GetGame().GetInput().ChangeGameFocus(-1);
        GetGame().GetUIManager().ShowUICursor(false);

        // Call the callback function on the target object
        GetGame().GameScript.CallFunction(
            m_CallbackTarget, m_CallbackFunc, null, confirmed);

        // Clean up -- defer deletion to avoid issues
        GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(
            DestroyDialog, 0, false);
    }

    protected void DestroyDialog()
    {
        delete this;
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_BtnYes)
        {
            SendResult(true);
            return true;
        }

        if (w == m_BtnNo)
        {
            SendResult(false);
            return true;
        }

        return false;
    }
}
```

### Использование

```c
// In the calling class:
void AskDeleteItem()
{
    new ConfirmDialog(
        "Delete Item",
        "Are you sure you want to delete this item?",
        this,
        "OnDeleteConfirmed"
    );
}

void OnDeleteConfirmed(bool confirmed)
{
    if (confirmed)
    {
        DeleteSelectedItem();
    }
}
```

Обратный вызов использует `GameScript.CallFunction()`, который вызывает функцию по имени на целевом объекте. Это стандартный способ реализации обратных вызовов диалогов в модах DayZ, поскольку Enforce Script не поддерживает замыкания или делегаты.

---

## Паттерн диалога ввода

Диалог ввода добавляет `EditBoxWidget` для ввода текста с валидацией.

```c
class InputDialog : ScriptedWidgetEventHandler
{
    protected Widget         m_Root;
    protected TextWidget     m_TitleText;
    protected EditBoxWidget  m_InputBox;
    protected ButtonWidget   m_BtnOk;
    protected ButtonWidget   m_BtnCancel;
    protected TextWidget     m_ErrorText;

    protected Class          m_CallbackTarget;
    protected string         m_CallbackFunc;

    void InputDialog(string title, string defaultText,
                     Class callbackTarget, string callbackFunc)
    {
        m_CallbackTarget = callbackTarget;
        m_CallbackFunc   = callbackFunc;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/input_dialog.layout");
        m_Root.SetHandler(this);

        m_TitleText = TextWidget.Cast(
            m_Root.FindAnyWidget("TitleText"));
        m_InputBox  = EditBoxWidget.Cast(
            m_Root.FindAnyWidget("InputBox"));
        m_BtnOk     = ButtonWidget.Cast(
            m_Root.FindAnyWidget("BtnOk"));
        m_BtnCancel = ButtonWidget.Cast(
            m_Root.FindAnyWidget("BtnCancel"));
        m_ErrorText = TextWidget.Cast(
            m_Root.FindAnyWidget("ErrorText"));

        m_TitleText.SetText(title);
        m_InputBox.SetText(defaultText);
        m_ErrorText.Show(false);

        m_Root.SetSort(1024, true);
        GetGame().GetInput().ChangeGameFocus(1);
        GetGame().GetUIManager().ShowUICursor(true);
    }

    void ~InputDialog()
    {
        if (m_Root)
            m_Root.Unlink();
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_BtnOk)
        {
            string text = m_InputBox.GetText();
            text.Trim();

            if (text == "")
            {
                m_ErrorText.SetText("Name cannot be empty");
                m_ErrorText.Show(true);
                return true;
            }

            GetGame().GetInput().ChangeGameFocus(-1);
            GetGame().GetUIManager().ShowUICursor(false);

            // Send result as Param2: OK status + text
            GetGame().GameScript.CallFunctionParams(
                m_CallbackTarget, m_CallbackFunc, null,
                new Param2<bool, string>(true, text));

            GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(
                DeleteSelf, 0, false);
            return true;
        }

        if (w == m_BtnCancel)
        {
            GetGame().GetInput().ChangeGameFocus(-1);
            GetGame().GetUIManager().ShowUICursor(false);

            GetGame().GameScript.CallFunctionParams(
                m_CallbackTarget, m_CallbackFunc, null,
                new Param2<bool, string>(false, ""));

            GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(
                DeleteSelf, 0, false);
            return true;
        }

        return false;
    }

    override bool OnChange(Widget w, int x, int y, bool finished)
    {
        if (w == m_InputBox)
        {
            // Hide error when user starts typing
            m_ErrorText.Show(false);

            // Submit on Enter key
            if (finished)
            {
                OnClick(m_BtnOk, 0, 0, 0);
            }
            return true;
        }

        return false;
    }

    protected void DeleteSelf()
    {
        delete this;
    }
}
```

---

## Управление фокусом

Управление фокусом --- наиболее критический аспект реализации диалогов. DayZ использует систему фокуса **со счетчиком ссылок** --- каждый вызов `ChangeGameFocus(1)` должен быть уравновешен вызовом `ChangeGameFocus(-1)`.

### Как это работает

```c
// Increment focus counter -- game input is suppressed while counter > 0
GetGame().GetInput().ChangeGameFocus(1);

// Show the mouse cursor
GetGame().GetUIManager().ShowUICursor(true);

// ... dialog interaction ...

// Decrement focus counter -- game input resumes when counter reaches 0
GetGame().GetInput().ChangeGameFocus(-1);

// Hide cursor (only if no other menus need it)
GetGame().GetUIManager().ShowUICursor(false);
```

### Правила

1. **Every +1 must have a matching -1.** If you call `ChangeGameFocus(1)` in `Show()`, you must call `ChangeGameFocus(-1)` in `Hide()`, with no exceptions.

2. **Call -1 even on error paths.** If the dialog is destroyed unexpectedly (player dies, server disconnect), the destructor must still decrement. Put cleanup in the destructor as a safety net.

3. **UIScriptedMenu handles this automatically.** If you extend `UIScriptedMenu` and call `super.OnShow()` / `super.OnHide()`, focus is managed for you. Only manage it manually when using `ScriptedWidgetEventHandler`.

4. **Per-device focus is optional.** The engine supports per-device focus locking (`INPUT_DEVICE_MOUSE`, `INPUT_DEVICE_KEYBOARD`, `INPUT_DEVICE_GAMEPAD`). For most mod dialogs, a single `ChangeGameFocus(1)` (no device argument) locks all input.

5. **ResetGameFocus() is a nuclear option.** It forces the counter to zero. Use it only in top-level cleanup (e.g., when closing an entire admin tool), never inside individual dialog classes.

### Что идет не так

| Mistake | Symptom |
|---------|---------|
| Forgot `ChangeGameFocus(-1)` on close | Игрок не может двигаться, стрелять или взаимодействовать после закрытия диалога |
| Called `-1` twice | Счетчик фокуса уходит в минус; next menu that opens will not properly lock input |
| Forgot `ShowUICursor(false)` | Курсор мыши остается видимым постоянно |
| Called `ShowUICursor(false)` when parent menu is still open | Курсор исчезает, пока родительское меню еще активно |

---

## Z-порядок и слои

When a dialog opens on top of existing UI, it must render above everything else. DayZ provides two mechanisms:

### Порядок сортировки виджетов

```c
// Push widget above all siblings (sort value 1024)
m_Root.SetSort(1024, true);
```

The `SetSort()` method sets the rendering priority. Higher values render on top. The second parameter (`true`) applies recursively to children. VPP Admin Tools use `SetSort(1024, true)` for all dialog boxes.

### Приоритет макета (статический)

In layout files, you can set priority directly:

```
FrameWidget "DialogRoot" {
    // Higher values render on top
    // Normal UI: 0-100
    // Overlay:   998
    // Dialog:    999
}
```

### Лучшие практики

- **Overlay background**: Use a high sort value (e.g., 998) for the semi-transparent background.
- **Dialog panel**: Use a higher sort value (e.g., 999 or 1024) for the dialog itself.
- **Stacking dialogs**: If your system supports nested dialogs, increment the sort value for each new dialog layer.

---

## Распространенные паттерны

### Переключаемая панель (открытие/закрытие одной клавишей)

```c
class TogglePanel : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected bool   m_IsVisible;

    void Toggle()
    {
        if (m_IsVisible)
            Hide();
        else
            Show();
    }

    protected void Show()
    {
        if (!m_Root)
        {
            m_Root = GetGame().GetWorkspace().CreateWidgets(
                "MyMod/GUI/layouts/toggle_panel.layout");
            m_Root.SetHandler(this);
        }

        m_Root.Show(true);
        m_IsVisible = true;
        GetGame().GetInput().ChangeGameFocus(1);
        GetGame().GetUIManager().ShowUICursor(true);
    }

    protected void Hide()
    {
        if (m_Root)
            m_Root.Show(false);

        m_IsVisible = false;
        GetGame().GetInput().ChangeGameFocus(-1);
        GetGame().GetUIManager().ShowUICursor(false);
    }
}
```

### ESC для закрытия

```c
// Inside Update() of a UIScriptedMenu:
override void Update(float timeslice)
{
    super.Update(timeslice);

    if (GetUApi().GetInputByID(UAUIBack).LocalPress())
    {
        Close();
    }
}

// Inside a ScriptedWidgetEventHandler (no Update loop):
// You must poll from an external update source, or use OnKeyDown:
override bool OnKeyDown(Widget w, int x, int y, int key)
{
    if (key == KeyCode.KC_ESCAPE)
    {
        Hide();
        return true;
    }
    return false;
}
```

### Клик за пределами для закрытия

Сделайте полноэкранный виджет-оверлей кликабельным. При клике закрывайте диалог:

```c
class OverlayDialog : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Overlay;
    protected Widget m_Panel;

    void Show()
    {
        m_Root    = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/overlay_dialog.layout");
        m_Overlay = m_Root.FindAnyWidget("Overlay");
        m_Panel   = m_Root.FindAnyWidget("DialogPanel");

        // Register handler on both overlay and panel widgets
        m_Root.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        // If user clicked the overlay (not the panel), close
        if (w == m_Overlay)
        {
            Hide();
            return true;
        }

        return false;
    }
}
```

### Обратные вызовы результатов диалога

Для диалогов, которым нужно возвращать сложные результаты, используйте `GameScript.CallFunctionParams()` с объектами `Param`:

```c
// Sending a result with multiple values
GetGame().GameScript.CallFunctionParams(
    m_CallbackTarget,
    m_CallbackFunc,
    null,
    new Param2<int, string>(RESULT_OK, inputText)
);

// Receiving in the caller
void OnDialogResult(int result, string text)
{
    if (result == RESULT_OK)
    {
        ProcessInput(text);
    }
}
```

Это тот же паттерн, который VPP Admin Tools использует для своей системы обратных вызовов `VPPDialogBox`.

---

## UIScriptedWindow --- плавающие окна

DayZ has a second built-in system: `UIScriptedWindow`, for floating windows that exist alongside a `UIScriptedMenu`. Unlike `UIScriptedMenu`, windows are tracked in a static map and their events are routed through the active menu.

```c
class MyWindow extends UIScriptedWindow
{
    void MyWindow(int id) : UIScriptedWindow(id)
    {
    }

    override Widget Init()
    {
        m_WgtRoot = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/my_window.layout");
        return m_WgtRoot;
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        // Handle clicks
        return false;
    }
}
```

Windows are opened and closed through the `UIManager`:

```c
// Open
GetGame().GetUIManager().OpenWindow(MY_WINDOW_ID);

// Close
GetGame().GetUIManager().CloseWindow(MY_WINDOW_ID);

// Check if open
GetGame().GetUIManager().IsWindowOpened(MY_WINDOW_ID);
```

На практике most mod developers use `ScriptedWidgetEventHandler`-based popups rather than `UIScriptedWindow`, because the window system requires registering with the engine's switch-case in `MissionBase` and the events route through the active `UIScriptedMenu`. The manual pattern is simpler and more flexible.

---

## Типичные ошибки

### 1. Не восстановлен фокус игры при закрытии

**Проблема:** Player cannot move, shoot, or interact after the dialog closes.

```c
// WRONG -- no focus restoration
void CloseDialog()
{
    m_Root.Unlink();
    m_Root = null;
    // Focus counter is still incremented!
}

// CORRECT -- always decrement
void CloseDialog()
{
    m_Root.Unlink();
    m_Root = null;
    GetGame().GetInput().ChangeGameFocus(-1);
    GetGame().GetUIManager().ShowUICursor(false);
}
```

### 2. Виджеты не отсоединены при закрытии

**Проблема:** Widget tree stays in memory, events keep firing, memory leaks accumulate.

```c
// WRONG -- just hiding
void Hide()
{
    m_Root.Show(false);  // Widget still exists and consumes memory
}

// CORRECT -- unlink destroys the widget tree
void Hide()
{
    if (m_Root)
    {
        m_Root.Unlink();
        m_Root = null;
    }
}
```

If you need to show/hide the same dialog repeatedly, keeping the widget and using `Show(true/false)` is fine -- just ensure you `Unlink()` in the destructor.

### 3. Диалог отрисовывается за другими элементами UI

**Проблема:** Dialog is invisible or partially hidden because other widgets have higher rendering priority.

**Решение:** Use `SetSort()` to push the dialog above everything:

```c
m_Root.SetSort(1024, true);
```

### 4. Множественные диалоги с накоплением изменений фокуса

**Проблема:** Opening dialog A (+1), then dialog B (+1), then closing B (-1) -- focus counter is still 1, so input is still locked even though the user sees no dialog.

**Решение:** Track whether each dialog instance has locked focus, and only decrement if it did:

```c
class SafeDialog : ScriptedWidgetEventHandler
{
    protected bool m_HasFocus;

    void LockFocus()
    {
        if (!m_HasFocus)
        {
            GetGame().GetInput().ChangeGameFocus(1);
            GetGame().GetUIManager().ShowUICursor(true);
            m_HasFocus = true;
        }
    }

    void UnlockFocus()
    {
        if (m_HasFocus)
        {
            GetGame().GetInput().ChangeGameFocus(-1);
            GetGame().GetUIManager().ShowUICursor(false);
            m_HasFocus = false;
        }
    }

    void ~SafeDialog()
    {
        UnlockFocus();
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }
    }
}
```

### 5. Вызов Close() или Delete в конструкторе

**Проблема:** Calling `Close()` or `delete this` during construction causes crashes or undefined behavior because the object is not fully initialized.

**Решение:** Defer closure using `CallLater`:

```c
void MyDialog()
{
    // ...
    if (someErrorCondition)
    {
        // WRONG: Close(); or delete this;
        // CORRECT:
        GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(
            DeferredClose, 0, false);
    }
}

void DeferredClose()
{
    Close();  // or: delete this;
}
```

### 6. Отсутствие проверки на null перед операциями с виджетами

**Проблема:** Crash when accessing a widget that was already destroyed or never created.

```c
// WRONG
void UpdateMessage(string text)
{
    m_MessageText.SetText(text);  // Crash if m_MessageText is null
}

// CORRECT
void UpdateMessage(string text)
{
    if (m_MessageText)
        m_MessageText.SetText(text);
}
```

---

## Итоги

| Подход | Базовый класс | Управление фокусом | Лучше для |
|----------|-----------|-----------------|----------|
| Engine menu stack | `UIScriptedMenu` | Автоматическое через `LockControls`/`UnlockControls` | Полноэкранные меню, основные диалоги |
| Native dialog | `ShowDialog()` | Automatic | Простые запросы Да/Нет/ОК |
| Ручное popup | `ScriptedWidgetEventHandler` | Ручное `ChangeGameFocus` | Всплывающие окна в панелях, пользовательские диалоги |
| Floating window | `UIScriptedWindow` | Через родительское меню | Окна инструментов рядом с меню |

Золотое правило: **каждый `ChangeGameFocus(1)` должен быть сбалансирован `ChangeGameFocus(-1)`.** Помещайте очистку фокуса в деструктор как страховку, всегда используйте `Unlink()` для виджетов по завершении и `SetSort()` для отрисовки диалога поверх всего.

---

## Следующие шаги

- [3.6 Event Handling](06-event-handling.md) -- Handle clicks, hover, keyboard events inside dialogs
- [3.5 Programmatic Widget Creation](05-programmatic-widgets.md) -- Build dialog content dynamically in code
