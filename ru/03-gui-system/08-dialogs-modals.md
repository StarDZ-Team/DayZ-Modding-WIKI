# Глава 3.8: Диалоги и модальные окна

[Главная](../README.md) | [<< Назад: Стили, шрифты и изображения](07-styles-fonts.md) | **Диалоги и модальные окна** | [Далее: Паттерны UI реальных модов >>](09-real-mod-patterns.md)

---

Диалоги -- это временные оверлейные окна, требующие взаимодействия пользователя: подтверждения, оповещения, формы ввода и панели настроек. Эта глава охватывает встроенную систему диалогов, ручные паттерны диалогов, структуру макетов, управление фокусом и распространённые подводные камни.

---

## Модальные и немодальные

Существует два основных типа диалогов:

- **Модальный** -- блокирует все взаимодействие с содержимым за диалогом. Пользователь должен ответить (подтвердить, отменить, закрыть) прежде чем делать что-либо ещё. Примеры: подтверждение выхода, предупреждение об удалении, запрос переименования.
- **Немодальный** -- позволяет пользователю взаимодействовать с содержимым за диалогом, пока он остаётся открытым. Примеры: информационные панели, окна настроек, палитры инструментов.

В DayZ различие контролируется тем, блокируете ли вы игровой ввод при открытии диалога. Модальный диалог вызывает `ChangeGameFocus(1)` и показывает курсор; немодальный может пропустить это или использовать переключаемый подход.

---

## UIScriptedMenu -- встроенная система

`UIScriptedMenu` -- это базовый класс движка для всех экранов меню в DayZ. Он интегрируется со стеком меню `UIManager`, автоматически обрабатывает блокировку ввода и предоставляет хуки жизненного цикла. Ванильный DayZ использует его для внутриигрового меню, диалога выхода, диалога респауна, меню настроек и многого другого.

### Иерархия классов

```
UIMenuPanel          (базовый: стек меню, Close(), управление подменю)
  UIScriptedMenu     (скриптовые меню: Init(), OnShow(), OnHide(), Update())
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
        // super.OnShow() вызывает LockControls(), который обрабатывает:
        //   GetGame().GetInput().ChangeGameFocus(1);
        //   GetGame().GetUIManager().ShowUICursor(true);
    }

    override void OnHide()
    {
        super.OnHide();
        // super.OnHide() вызывает UnlockControls(), который обрабатывает:
        //   GetGame().GetInput().ChangeGameFocus(-1);
        //   GetGame().GetUIManager().ShowUICursor(false);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        super.OnClick(w, x, y, button);

        if (w == m_BtnConfirm)
        {
            // Выполнить действие
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

        // ESC для закрытия
        if (GetUApi().GetInputByID(UAUIBack).LocalPress())
        {
            Close();
        }
    }
}
```

### Открытие и закрытие

```c
// Открытие -- создать меню и поместить в стек UIManager
MyDialog dialog = new MyDialog();
GetGame().GetUIManager().ShowScriptedMenu(dialog, null);

// Закрытие извне
GetGame().GetUIManager().HideScriptedMenu(dialog);

// Закрытие изнутри класса диалога
Close();
```

`ShowScriptedMenu()` помещает меню в стек движка, вызывает `Init()`, затем `OnShow()`. `Close()` вызывает `OnHide()`, извлекает из стека и уничтожает дерево виджетов.

### Ключевые методы жизненного цикла

| Метод | Когда вызывается | Типичное использование |
|--------|------------|-------------|
| `Init()` | Один раз, при создании меню | Создание виджетов, кэширование ссылок |
| `OnShow()` | После того, как меню стало видимым | Блокировка ввода, запуск таймеров |
| `OnHide()` | После скрытия меню | Разблокировка ввода, отмена таймеров |
| `Update(float timeslice)` | Каждый кадр, пока видимо | Опрос ввода (клавиша ESC), анимации |
| `Cleanup()` | Перед уничтожением | Освобождение ресурсов |

### LockControls / UnlockControls

`UIScriptedMenu` предоставляет встроенные методы, которые `OnShow()` и `OnHide()` вызывают автоматически:

```c
// Внутри UIScriptedMenu (код движка, упрощённо):
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
    // Видимость курсора зависит от наличия родительского меню
}
```

Поскольку `UIScriptedMenu` автоматически обрабатывает управление фокусом в `OnShow()`/`OnHide()`, вам редко нужно вызывать `ChangeGameFocus()` самостоятельно при использовании этого базового класса. Просто вызывайте `super.OnShow()` и `super.OnHide()`.

---

## Встроенный ShowDialog (нативные диалоговые окна)

Движок предоставляет нативную систему диалогов для простых подтверждающих запросов. Она отрисовывает платформенно-подходящее диалоговое окно без необходимости в файле макета.

### Использование

```c
// Показать диалог подтверждения Да/Нет
const int MY_DIALOG_ID = 500;

g_Game.GetUIManager().ShowDialog(
    "Confirm Action",                  // заголовок
    "Are you sure you want to do this?", // текст
    MY_DIALOG_ID,                      // пользовательский ID для идентификации диалога
    DBT_YESNO,                         // конфигурация кнопок
    DBB_YES,                           // кнопка по умолчанию
    DMT_QUESTION,                      // тип иконки
    this                               // обработчик (получает OnModalResult)
);
```

### Получение результата

Обработчик (`UIScriptedMenu`, переданный последним аргументом) получает результат через `OnModalResult`:

```c
override bool OnModalResult(Widget w, int x, int y, int code, int result)
{
    if (code == MY_DIALOG_ID)
    {
        if (result == DBB_YES)
        {
            PerformAction();
        }
        // DBB_NO означает отказ пользователя -- ничего не делаем
        return true;
    }

    return false;
}
```

### Константы

**Конфигурации кнопок** (`DBT_` -- DialogBoxType):

| Константа | Показываемые кнопки |
|----------|---------------|
| `DBT_OK` | OK |
| `DBT_YESNO` | Да, Нет |
| `DBT_YESNOCANCEL` | Да, Нет, Отмена |

**Идентификаторы кнопок** (`DBB_` -- DialogBoxButton):

| Константа | Значение | Значение |
|----------|-------|---------|
| `DBB_NONE` | 0 | Нет по умолчанию |
| `DBB_OK` | 1 | Кнопка OK |
| `DBB_YES` | 2 | Кнопка Да |
| `DBB_NO` | 3 | Кнопка Нет |
| `DBB_CANCEL` | 4 | Кнопка Отмена |

**Типы сообщений** (`DMT_` -- DialogMessageType):

| Константа | Иконка |
|----------|------|
| `DMT_NONE` | Без иконки |
| `DMT_INFO` | Информация |
| `DMT_WARNING` | Предупреждение |
| `DMT_QUESTION` | Вопросительный знак |
| `DMT_EXCLAMATION` | Восклицательный знак |

### Когда использовать ShowDialog

Используйте `ShowDialog()` для простых оповещений и подтверждений, не требующих пользовательского стиля. Он надёжен и автоматически обрабатывает фокус/курсор. Для брендированных или сложных диалогов (пользовательский макет, поля ввода, множество вариантов) создавайте собственный класс диалога.

---

## Ручной паттерн диалога (без UIScriptedMenu)

Когда вам нужен диалог, не являющийся частью стека меню движка -- например, всплывающее окно внутри существующей панели -- наследуйте `ScriptedWidgetEventHandler` вместо `UIScriptedMenu`. Это даёт полный контроль, но требует ручного управления фокусом и жизненным циклом.

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

        // Блокировать игровой ввод, чтобы игрок не мог двигаться/стрелять
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

        // Восстановить игровой ввод -- ДОЛЖНО совпадать с +1 из Show()
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
        // Переопределите в подклассах или установите обратный вызов
    }
}
```

### Всплывающее окно в стиле VPP (паттерн OnWidgetScriptInit)

VPP Admin Tools и другие моды используют `OnWidgetScriptInit()` для инициализации всплывающих окон. Виджет создаётся родителем, а класс скрипта привязывается через атрибут `scriptclass` в файле макета:

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

        // Поместить диалог поверх других виджетов
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
        // Обработка ввода
    }
}
```

Родитель создаёт всплывающее окно, создавая виджет макета как дочерний:

```c
Widget popup = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/GUI/layouts/popup.layout", parentWidget);
```

Движок автоматически вызывает `OnWidgetScriptInit()` для класса скрипта, указанного в атрибуте `scriptclass` макета.

---

## Структура макета диалога

Макет диалога обычно имеет три слоя: полноэкранный корень для перехвата кликов, полупрозрачный оверлей для затемнения и центрированная панель диалога.

### Пример файла макета

```
FrameWidget "DialogRoot" {
    size 1 1 0 0        // Полный экран
    halign fill
    valign fill

    // Полупрозрачный фоновый оверлей
    ImageWidget "Overlay" {
        size 1 1 0 0
        halign fill
        valign fill
        color "0 0 0 180"
    }

    // Центрированная панель диалога
    FrameWidget "DialogPanel" {
        halign center
        valign center
        hexactsize 1
        vexactsize 1
        hexactpos  1
        vexactpos  1
        size 0 0 500 300   // Диалог 500x300 пикселей

        // Заголовок
        TextWidget "TitleText" {
            halign fill
            size 1 0 0 30
            text "Dialog Title"
            font "gui/fonts/MetronBook24"
        }

        // Область содержимого
        MultilineTextWidget "ContentText" {
            position 0 0 0 35
            size 1 0 0 200
            halign fill
        }

        // Ряд кнопок внизу
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

1. **Полноэкранный корень** -- внешний виджет покрывает весь экран, чтобы клики за пределами диалога перехватывались.
2. **Полупрозрачный оверлей** -- `ImageWidget` или панель с альфа-каналом (например, `color "0 0 0 180"`) затемняет фон, визуально указывая на модальное состояние.
3. **Центрированная панель** -- используйте `halign center` и `valign center` с точными пиксельными размерами для предсказуемых размеров.
4. **Выравнивание кнопок** -- разместите кнопки в горизонтальном контейнере в нижней части панели диалога.

---

## Паттерн диалога подтверждения

Переиспользуемый диалог подтверждения принимает заголовок, сообщение и обратный вызов. Это самый распространённый паттерн диалога в модах DayZ.

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

        // Убедиться, что диалог рендерится поверх другого UI
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

        // Вызвать функцию обратного вызова на целевом объекте
        GetGame().GameScript.CallFunction(
            m_CallbackTarget, m_CallbackFunc, null, confirmed);

        // Очистка -- отложить удаление для избежания проблем
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
// В вызывающем классе:
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

Обратный вызов использует `GameScript.CallFunction()`, который вызывает функцию по имени на целевом объекте. Это стандартный способ реализации обратных вызовов диалогов в модах DayZ, поскольку Enforce Script не поддерживает замыкания и делегаты.

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

            // Отправить результат как Param2: статус OK + текст
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
            // Скрыть ошибку, когда пользователь начинает печатать
            m_ErrorText.Show(false);

            // Отправить по нажатию Enter
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

Управление фокусом -- это наиболее критический аспект реализации диалогов. DayZ использует систему фокуса **с подсчётом ссылок** -- каждый `ChangeGameFocus(1)` должен быть сбалансирован `ChangeGameFocus(-1)`.

### Как это работает

```c
// Увеличить счётчик фокуса -- игровой ввод подавляется, пока счётчик > 0
GetGame().GetInput().ChangeGameFocus(1);

// Показать курсор мыши
GetGame().GetUIManager().ShowUICursor(true);

// ... взаимодействие с диалогом ...

// Уменьшить счётчик фокуса -- игровой ввод возобновляется, когда счётчик достигает 0
GetGame().GetInput().ChangeGameFocus(-1);

// Скрыть курсор (только если другие меню его не требуют)
GetGame().GetUIManager().ShowUICursor(false);
```

### Правила

1. **Каждый +1 должен иметь соответствующий -1.** Если вы вызвали `ChangeGameFocus(1)` в `Show()`, вы должны вызвать `ChangeGameFocus(-1)` в `Hide()`, без исключений.

2. **Вызывайте -1 даже при ошибках.** Если диалог уничтожается неожиданно (игрок умер, отключение сервера), деструктор всё равно должен уменьшить счётчик. Поместите очистку в деструктор как страховку.

3. **UIScriptedMenu обрабатывает это автоматически.** Если вы наследуете `UIScriptedMenu` и вызываете `super.OnShow()` / `super.OnHide()`, фокус управляется за вас. Управляйте им вручную только при использовании `ScriptedWidgetEventHandler`.

4. **Фокус для отдельных устройств опционален.** Движок поддерживает блокировку фокуса для отдельных устройств (`INPUT_DEVICE_MOUSE`, `INPUT_DEVICE_KEYBOARD`, `INPUT_DEVICE_GAMEPAD`). Для большинства диалогов модов одного `ChangeGameFocus(1)` (без аргумента устройства) достаточно для блокировки всего ввода.

5. **ResetGameFocus() -- крайнее средство.** Оно принудительно сбрасывает счётчик в ноль. Используйте его только при очистке верхнего уровня (например, при закрытии всего инструмента администратора), никогда внутри отдельных классов диалогов.

### Что может пойти не так

| Ошибка | Симптом |
|---------|---------|
| Забыли `ChangeGameFocus(-1)` при закрытии | Игрок не может двигаться, стрелять или взаимодействовать после закрытия диалога |
| Вызвали `-1` дважды | Счётчик фокуса становится отрицательным; следующее открывшееся меню не сможет корректно заблокировать ввод |
| Забыли `ShowUICursor(false)` | Курсор мыши остаётся видимым навсегда |
| Вызвали `ShowUICursor(false)`, когда родительское меню ещё открыто | Курсор исчезает, пока родительское меню ещё активно |

---

## Z-порядок и слои

Когда диалог открывается поверх существующего UI, он должен рендериться поверх всего. DayZ предоставляет два механизма:

### Порядок сортировки виджетов

```c
// Поместить виджет поверх всех соседей (значение сортировки 1024)
m_Root.SetSort(1024, true);
```

Метод `SetSort()` устанавливает приоритет рендеринга. Более высокие значения рендерятся поверх. Второй параметр (`true`) применяется рекурсивно к дочерним элементам. VPP Admin Tools использует `SetSort(1024, true)` для всех диалоговых окон.

### Приоритет в макете (статический)

В файлах макета можно установить приоритет напрямую:

```
FrameWidget "DialogRoot" {
    // Более высокие значения рендерятся поверх
    // Обычный UI: 0-100
    // Оверлей:    998
    // Диалог:     999
}
```

### Лучшие практики

- **Фон оверлея**: используйте высокое значение сортировки (например, 998) для полупрозрачного фона.
- **Панель диалога**: используйте ещё более высокое значение (например, 999 или 1024) для самого диалога.
- **Вложенные диалоги**: если ваша система поддерживает вложенные диалоги, увеличивайте значение сортировки для каждого нового слоя.

---

## Распространённые паттерны

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
// Внутри Update() UIScriptedMenu:
override void Update(float timeslice)
{
    super.Update(timeslice);

    if (GetUApi().GetInputByID(UAUIBack).LocalPress())
    {
        Close();
    }
}

// Внутри ScriptedWidgetEventHandler (нет цикла Update):
// Нужно опрашивать из внешнего источника обновлений или использовать OnKeyDown:
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

### Клик вне для закрытия

Сделайте полноэкранный виджет оверлея кликабельным. При клике -- закрыть диалог:

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

        // Зарегистрировать обработчик на виджетах оверлея и панели
        m_Root.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        // Если пользователь кликнул на оверлей (не на панель), закрыть
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
// Отправка результата с несколькими значениями
GetGame().GameScript.CallFunctionParams(
    m_CallbackTarget,
    m_CallbackFunc,
    null,
    new Param2<int, string>(RESULT_OK, inputText)
);

// Получение в вызывающем коде
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

## UIScriptedWindow -- плавающие окна

DayZ имеет вторую встроенную систему: `UIScriptedWindow`, для плавающих окон, которые существуют рядом с `UIScriptedMenu`. В отличие от `UIScriptedMenu`, окна отслеживаются в статическом словаре и их события маршрутизируются через активное меню.

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
        // Обработка кликов
        return false;
    }
}
```

Окна открываются и закрываются через `UIManager`:

```c
// Открыть
GetGame().GetUIManager().OpenWindow(MY_WINDOW_ID);

// Закрыть
GetGame().GetUIManager().CloseWindow(MY_WINDOW_ID);

// Проверить, открыто ли
GetGame().GetUIManager().IsWindowOpened(MY_WINDOW_ID);
```

На практике большинство разработчиков модов используют всплывающие окна на основе `ScriptedWidgetEventHandler`, а не `UIScriptedWindow`, потому что система окон требует регистрации в switch-case движка в `MissionBase` и события маршрутизируются через активное `UIScriptedMenu`. Ручной паттерн проще и гибче.

---

## Типичные ошибки

### 1. Не восстановлен фокус игры при закрытии

**Проблема:** игрок не может двигаться, стрелять или взаимодействовать после закрытия диалога.

```c
// НЕПРАВИЛЬНО -- нет восстановления фокуса
void CloseDialog()
{
    m_Root.Unlink();
    m_Root = null;
    // Счётчик фокуса всё ещё увеличен!
}

// ПРАВИЛЬНО -- всегда уменьшайте
void CloseDialog()
{
    m_Root.Unlink();
    m_Root = null;
    GetGame().GetInput().ChangeGameFocus(-1);
    GetGame().GetUIManager().ShowUICursor(false);
}
```

### 2. Виджеты не отсоединены при закрытии

**Проблема:** дерево виджетов остаётся в памяти, события продолжают генерироваться, утечки памяти накапливаются.

```c
// НЕПРАВИЛЬНО -- просто скрытие
void Hide()
{
    m_Root.Show(false);  // Виджет всё ещё существует и потребляет память
}

// ПРАВИЛЬНО -- unlink уничтожает дерево виджетов
void Hide()
{
    if (m_Root)
    {
        m_Root.Unlink();
        m_Root = null;
    }
}
```

Если вам нужно показывать/скрывать один и тот же диалог повторно, сохранение виджета и использование `Show(true/false)` допустимо -- просто убедитесь, что вызываете `Unlink()` в деструкторе.

### 3. Диалог рендерится за другим UI

**Проблема:** диалог невидим или частично скрыт, потому что другие виджеты имеют более высокий приоритет рендеринга.

**Решение:** используйте `SetSort()` для помещения диалога поверх всего:

```c
m_Root.SetSort(1024, true);
```

### 4. Несколько диалогов накапливают изменения фокуса

**Проблема:** открытие диалога A (+1), затем диалога B (+1), затем закрытие B (-1) -- счётчик фокуса всё ещё 1, поэтому ввод всё ещё заблокирован, хотя пользователь не видит диалога.

**Решение:** отслеживайте, заблокировал ли каждый экземпляр диалога фокус, и уменьшайте только если он это сделал:

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

**Проблема:** вызов `Close()` или `delete this` во время конструирования вызывает крэши или неопределённое поведение, потому что объект ещё не полностью инициализирован.

**Решение:** отложите закрытие с помощью `CallLater`:

```c
void MyDialog()
{
    // ...
    if (someErrorCondition)
    {
        // НЕПРАВИЛЬНО: Close(); или delete this;
        // ПРАВИЛЬНО:
        GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(
            DeferredClose, 0, false);
    }
}

void DeferredClose()
{
    Close();  // или: delete this;
}
```

### 6. Отсутствие проверки на null перед операциями с виджетами

**Проблема:** крэш при обращении к виджету, который уже уничтожен или никогда не был создан.

```c
// НЕПРАВИЛЬНО
void UpdateMessage(string text)
{
    m_MessageText.SetText(text);  // Крэш, если m_MessageText равен null
}

// ПРАВИЛЬНО
void UpdateMessage(string text)
{
    if (m_MessageText)
        m_MessageText.SetText(text);
}
```

---

## Итоги

| Подход | Базовый класс | Управление фокусом | Лучше всего для |
|----------|-----------|-----------------|----------|
| Стек меню движка | `UIScriptedMenu` | Автоматическое через `LockControls`/`UnlockControls` | Полноэкранные меню, основные диалоги |
| Нативный диалог | `ShowDialog()` | Автоматическое | Простые запросы Да/Нет/OK |
| Ручное всплывающее окно | `ScriptedWidgetEventHandler` | Ручной `ChangeGameFocus` | Всплывающие окна в панелях, пользовательские диалоги |
| Плавающее окно | `UIScriptedWindow` | Через родительское меню | Инструментальные окна рядом с меню |

Золотое правило: **каждый `ChangeGameFocus(1)` должен иметь соответствующий `ChangeGameFocus(-1)`.** Помещайте очистку фокуса в деструктор как страховку, всегда вызывайте `Unlink()` для виджетов после завершения работы и используйте `SetSort()` для гарантии рендеринга диалога поверх.

---

## Дальнейшие шаги

- [3.6 Обработка событий](06-event-handling.md) -- обработка кликов, наведений, событий клавиатуры внутри диалогов
- [3.5 Программное создание виджетов](05-programmatic-widgets.md) -- динамическое построение содержимого диалога в коде
