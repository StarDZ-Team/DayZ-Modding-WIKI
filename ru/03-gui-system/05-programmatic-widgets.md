# Глава 3.5: Программное создание виджетов

[Главная](../README.md) | [<< Назад: Виджеты-контейнеры](04-containers.md) | **Программное создание виджетов** | [Далее: Обработка событий >>](06-event-handling.md)

---

Хотя файлы `.layout` являются стандартным способом определения структуры UI, вы также можете создавать и настраивать виджеты полностью из кода. Это полезно для динамических UI, процедурно генерируемых элементов и ситуаций, когда компоновка неизвестна на этапе компиляции.

---

## Два подхода

DayZ предоставляет два способа создания виджетов в коде:

1. **`CreateWidgets()`** — Загрузить файл `.layout` и создать его дерево виджетов
2. **`CreateWidget()`** — Создать один виджет с явными параметрами

Оба метода вызываются на `WorkspaceWidget`, полученном через `GetGame().GetWorkspace()`.

---

## CreateWidgets() — Из файлов layout

Самый распространённый подход. Загружает файл `.layout` и создаёт всё дерево виджетов, прикрепляя его к родительскому виджету.

```c
Widget root = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/gui/layouts/MyPanel.layout",   // Путь к файлу layout
    parentWidget                            // Родительский виджет (или null для корня)
);
```

Возвращённый `Widget` — корневой виджет из файла layout. Затем вы можете находить дочерние виджеты по имени:

```c
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
title.SetText("Hello World");

ButtonWidget closeBtn = ButtonWidget.Cast(root.FindAnyWidget("CloseButton"));
```

### Создание множественных экземпляров

Распространённый паттерн — создание нескольких экземпляров шаблона layout (например, элементов списка):

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

    container.Update();  // Принудительный пересчёт компоновки
}
```

---

## CreateWidget() — Программное создание

Создаёт один виджет с явным типом, позицией, размером, флагами и родителем.

```c
Widget w = GetGame().GetWorkspace().CreateWidget(
    FrameWidgetTypeID,      // Константа TypeID виджета
    0,                       // Позиция X
    0,                       // Позиция Y
    100,                     // Ширина
    100,                     // Высота
    WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS,
    -1,                      // Цвет (ARGB integer, -1 = белый/по умолчанию)
    0,                       // Порядок сортировки (приоритет)
    parentWidget             // Родительский виджет
);
```

### Параметры

| Параметр | Тип | Описание |
|---|---|---|
| typeID | int | Константа типа виджета (например, `FrameWidgetTypeID`, `TextWidgetTypeID`) |
| x | float | Позиция X (пропорциональная или пиксельная в зависимости от флагов) |
| y | float | Позиция Y |
| width | float | Ширина виджета |
| height | float | Высота виджета |
| flags | int | Побитовое ИЛИ констант `WidgetFlags` |
| color | int | Цвет ARGB integer (-1 для белого/по умолчанию) |
| sort | int | Z-порядок (более высокие значения отрисовываются поверх) |
| parent | Widget | Родительский виджет для прикрепления |

### TypeID виджетов

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

Флаги управляют поведением виджета при программном создании. Комбинируйте их побитовым ИЛИ (`|`).

| Флаг | Эффект |
|---|---|
| `WidgetFlags.VISIBLE` | Виджет начинает видимым |
| `WidgetFlags.IGNOREPOINTER` | Виджет не получает события мыши |
| `WidgetFlags.DRAGGABLE` | Виджет можно перетаскивать |
| `WidgetFlags.EXACTSIZE` | Значения размера в пикселях (не пропорциональные) |
| `WidgetFlags.EXACTPOS` | Значения позиции в пикселях (не пропорциональные) |
| `WidgetFlags.SOURCEALPHA` | Использовать альфа-канал источника |
| `WidgetFlags.BLEND` | Включить альфа-смешивание |
| `WidgetFlags.FLIPU` | Отразить текстуру горизонтально |
| `WidgetFlags.FLIPV` | Отразить текстуру вертикально |

Распространённые комбинации флагов:

```c
// Видимый, пиксельные размеры, пиксельная позиция, альфа-смешивание
int FLAGS_EXACT = WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;

// Видимый, пропорциональный, неинтерактивный
int FLAGS_OVERLAY = WidgetFlags.VISIBLE | WidgetFlags.IGNOREPOINTER | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;
```

После создания вы можете динамически изменять флаги:

```c
widget.SetFlags(WidgetFlags.VISIBLE);          // Добавить флаг
widget.ClearFlags(WidgetFlags.IGNOREPOINTER);  // Убрать флаг
int flags = widget.GetFlags();                  // Прочитать текущие флаги
```

---

## Настройка свойств после создания

После создания виджета через `CreateWidget()` вам нужно его настроить. Виджет возвращается как базовый тип `Widget`, поэтому вы должны привести к конкретному типу.

### Установка имени

```c
Widget w = GetGame().GetWorkspace().CreateWidget(TextWidgetTypeID, ...);
w.SetName("MyTextWidget");
```

Имена важны для поиска через `FindAnyWidget()` и отладки.

### Установка текста

```c
TextWidget tw = TextWidget.Cast(w);
tw.SetText("Hello World");
tw.SetTextExactSize(16);           // Размер шрифта в пикселях
tw.SetOutline(1, ARGB(255, 0, 0, 0));  // чёрная обводка 1px
```

### Установка цвета

Цвета в DayZ используют формат ARGB (Alpha, Red, Green, Blue), упакованный в одно 32-битное целое число:

```c
// Использование вспомогательной функции ARGB (0-255 на канал)
int red    = ARGB(255, 255, 0, 0);       // Непрозрачный красный
int green  = ARGB(255, 0, 255, 0);       // Непрозрачный зелёный
int blue   = ARGB(200, 0, 0, 255);       // Полупрозрачный синий
int black  = ARGB(255, 0, 0, 0);         // Непрозрачный чёрный
int white  = ARGB(255, 255, 255, 255);   // Непрозрачный белый (то же, что -1)

// Использование версии с float (0.0-1.0 на канал)
int color = ARGBF(1.0, 0.5, 0.25, 0.1);

// Разложение цвета обратно в float
float a, r, g, b;
InverseARGBF(color, a, r, g, b);

// Применение к любому виджету
widget.SetColor(ARGB(255, 100, 150, 200));
widget.SetAlpha(0.5);  // Переопределить только альфу
```

Шестнадцатеричный формат `0xAARRGGBB` тоже распространён:

```c
int color = 0xFF4B77BE;   // A=255, R=75, G=119, B=190
widget.SetColor(color);
```

### Установка обработчика событий

```c
widget.SetHandler(myEventHandler);  // Экземпляр ScriptedWidgetEventHandler
```

### Установка пользовательских данных

Прикрепите произвольные данные к виджету для последующего извлечения:

```c
widget.SetUserData(myDataObject);  // Должен наследовать от Managed

// Позже получить:
Managed data;
widget.GetUserData(data);
MyDataClass myData = MyDataClass.Cast(data);
```

---

## Очистка виджетов

Виджеты, которые больше не нужны, должны быть правильно очищены, чтобы избежать утечек памяти.

### Unlink()

Удаляет виджет от его родителя и уничтожает его (и все дочерние элементы):

```c
widget.Unlink();
```

После вызова `Unlink()` ссылка на виджет становится недействительной. Установите её в `null`:

```c
widget.Unlink();
widget = null;
```

### Удаление всех дочерних элементов

Для очистки контейнерного виджета от всех дочерних элементов:

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

**Важно:** Вы должны получить `GetSibling()` **до** вызова `Unlink()`, потому что отвязка делает цепочку соседних элементов виджета недействительной.

### Проверка на null

Всегда проверяйте виджеты на null перед использованием. `FindAnyWidget()` возвращает `null`, если виджет не найден, а операции приведения типов возвращают `null`, если тип не совпадает:

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MaybeExists"));
if (tw)
{
    tw.SetText("Found it");
}
```

---

## Навигация по иерархии виджетов

Навигация по дереву виджетов из кода:

```c
Widget parent = widget.GetParent();           // Родительский виджет
Widget firstChild = widget.GetChildren();     // Первый дочерний элемент
Widget nextSibling = widget.GetSibling();     // Следующий соседний элемент
Widget found = widget.FindAnyWidget("Name");  // Рекурсивный поиск по имени

string name = widget.GetName();               // Имя виджета
string typeName = widget.GetTypeName();       // Например, "TextWidget"
```

Итерация по всем дочерним элементам:

```c
Widget child = parent.GetChildren();
while (child)
{
    // Обработать дочерний элемент
    Print("Child: " + child.GetName());

    child = child.GetSibling();
}
```

Рекурсивная итерация по всем потомкам:

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

## Полный пример: создание диалога в коде

Полный пример создания простого информационного диалога целиком в коде, без файла layout:

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

        // Корневой frame: 400x200 пикселей, центрирован на экране
        m_Root = workspace.CreateWidget(
            FrameWidgetTypeID, 0, 0, 400, 200, FLAGS_EXACT,
            ARGB(230, 30, 30, 30), 100, null);

        // Центрирование вручную
        int sw, sh;
        GetScreenSize(sw, sh);
        m_Root.SetScreenPos((sw - 400) / 2, (sh - 200) / 2);

        // Текст заголовка: полная ширина, 30px высота, вверху
        Widget titleW = workspace.CreateWidget(
            TextWidgetTypeID, 0, 0, 400, 30, FLAGS_EXACT,
            ARGB(255, 100, 160, 220), 0, m_Root);
        m_Title = TextWidget.Cast(titleW);
        m_Title.SetText(title);

        // Текст сообщения: ниже заголовка, заполняет оставшееся пространство
        Widget msgW = workspace.CreateWidget(
            TextWidgetTypeID, 10, 40, 380, 110, FLAGS_EXACT,
            ARGB(255, 200, 200, 200), 0, m_Root);
        m_Message = TextWidget.Cast(msgW);
        m_Message.SetText(message);

        // Кнопка закрытия: 80x30 пикселей, в правой нижней области
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

// Использование:
SimpleCodeDialog dialog = new SimpleCodeDialog("Alert", "Server restart in 5 minutes.");
```

---

## Пулинг виджетов

Создание и уничтожение виджетов каждый кадр вызывает проблемы производительности. Вместо этого поддерживайте пул переиспользуемых виджетов:

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

        // Предварительное создание виджетов
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

**Когда использовать пулинг:**
- Списки с частым обновлением (килфид, чат, список игроков)
- Сетки с динамическим содержимым (инвентарь, маркет)
- Любой UI, создающий/уничтожающий 10+ виджетов в секунду

**Когда НЕ использовать пулинг:**
- Статические панели, созданные однократно
- Диалоги, которые показываются/скрываются (просто используйте Show/Hide)

---

## Файлы layout vs. программное создание: когда что использовать

| Ситуация | Рекомендация |
|---|---|
| Статическая структура UI | Файл layout (`.layout`) |
| Сложные деревья виджетов | Файл layout |
| Динамическое количество элементов | `CreateWidgets()` из шаблонного layout |
| Простые элементы рантайма (отладочный текст, маркеры) | `CreateWidget()` |
| Быстрое прототипирование | `CreateWidget()` |
| Продакшн UI мода | Файл layout + настройка из кода |

На практике большинство модов используют **файлы layout** для структуры и **код** для заполнения данными, показа/скрытия элементов и обработки событий. Полностью программные UI редки за пределами инструментов отладки.

---

## Следующие шаги

- [3.6 Обработка событий](06-event-handling.md) — Обработка кликов, изменений и событий мыши
- [3.7 Стили, шрифты и изображения](07-styles-fonts.md) — Визуальное оформление и ресурсы изображений

---

## Теория и практика

| Концепция | Теория | Реальность |
|---------|--------|---------|
| `CreateWidget()` создаёт любой тип виджета | Все TypeID работают с `CreateWidget()` | `ScrollWidget` и `WrapSpacerWidget`, созданные программно, часто требуют ручной настройки флагов (`EXACTSIZE`, размеры), которую файлы layout обрабатывают автоматически |
| `Unlink()` освобождает всю память | Виджет и дочерние элементы уничтожены | Ссылки в переменных скрипта становятся висячими. Всегда устанавливайте ссылки на виджеты в `null` после `Unlink()`, иначе рискуете получить крэш |
| `SetHandler()` маршрутизирует все события | Один обработчик получает все события виджета | Обработчик получает события только для виджетов, которые вызвали `SetHandler(this)`. Дочерние элементы не наследуют обработчик от родителя |
| `CreateWidgets()` из layout мгновенен | Layout загружается синхронно | Большие layout с множеством вложенных виджетов вызывают всплеск нагрузки на кадр. Предварительно загружайте layout во время экранов загрузки, а не во время геймплея |
| Пропорциональные размеры (0.0-1.0) масштабируются к родителю | Значения относительны к размерам родителя | Без флага `EXACTSIZE` даже значения `CreateWidget()` вроде `100` трактуются как пропорциональные (диапазон 0-1), заставляя виджеты заполнять весь родительский элемент |

---

## Совместимость и влияние

- **Мультимод:** Программно созданные виджеты приватны для создающего мода. В отличие от `modded class`, нет риска коллизии, если два мода не прикрепляют виджеты к одному и тому же ванильному родительскому виджету по имени.
- **Производительность:** Каждый вызов `CreateWidgets()` парсит файл layout с диска. Кэшируйте корневой виджет и показывайте/скрывайте его, а не пересоздавайте из layout каждый раз при открытии UI.

---

## Наблюдения в реальных модах

| Паттерн | Мод | Детали |
|---------|-----|--------|
| Шаблон layout + наполнение кодом | COT, Expansion | Загрузка шаблонного `.layout` строки через `CreateWidgets()` для каждого элемента списка, затем наполнение через `FindAnyWidget()` |
| Пулинг виджетов для килфида | Colorful UI | Предварительное создание 20 виджетов записей фида, показ/скрытие вместо создания и уничтожения |
| Диалоги полностью в коде | Отладочные/админ инструменты | Простые диалоги оповещений, построенные целиком через `CreateWidget()`, чтобы не поставлять дополнительные файлы `.layout` |
| `SetHandler(this)` на каждом интерактивном дочернем элементе | VPP Admin Tools | Перебор всех кнопок после загрузки layout и вызов `SetHandler()` на каждой по отдельности |
| `Unlink()` + null паттерн | DabsFramework | Метод `Close()` каждого диалога вызывает `m_Root.Unlink(); m_Root = null;` последовательно |
