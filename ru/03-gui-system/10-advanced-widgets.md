# Глава 3.10: Продвинутые виджеты

[Главная](../README.md) | [<< Назад: Паттерны UI реальных модов](09-real-mod-patterns.md) | **Продвинутые виджеты**

---

Помимо стандартных контейнеров, текстовых и графических виджетов, рассмотренных в предыдущих главах, DayZ предоставляет специализированные типы виджетов для форматированного текста, рисования на 2D-холсте, отображения карты, 3D-предпросмотра предметов, воспроизведения видео и рендеринга в текстуру. Эти виджеты открывают возможности, недоступные при использовании простых макетов.

Эта глава охватывает каждый продвинутый тип виджетов с подтверждёнными сигнатурами API, извлечёнными из ванильного исходного кода и реального использования в модах.

---

## Форматирование RichTextWidget

`RichTextWidget` расширяет `TextWidget` и поддерживает встроенные теги разметки в текстовом содержимом. Это основной способ отображения форматированного текста со встроенными изображениями, переменными размерами шрифта и переносами строк.

### Определение класса

```
// Из scripts/1_core/proto/enwidgets.c
class RichTextWidget extends TextWidget
{
    proto native float GetContentHeight();
    proto native float GetContentOffset();
    proto native void  SetContentOffset(float offset, bool snapToLine = false);
    proto native void  ElideText(int line, float maxWidth, string str);
    proto native int   GetNumLines();
    proto native void  SetLinesVisibility(int lineFrom, int lineTo, bool visible);
    proto native float GetLineWidth(int line);
    proto native float SetLineBreakingOverride(int mode);
};
```

`RichTextWidget` наследует все методы `TextWidget` -- `SetText()`, `SetTextExactSize()`, `SetOutline()`, `SetShadow()`, `SetTextFormat()` и остальные. Ключевое отличие в том, что `SetText()` у `RichTextWidget` парсит встроенные теги разметки.

### Поддерживаемые встроенные теги

Эти теги подтверждены через использование в ванильном DayZ в `news_feed.txt`, `InputUtils.c` и множестве скриптов меню.

#### Встроенное изображение

```
<image set="IMAGESET_NAME" name="IMAGE_NAME" />
<image set="IMAGESET_NAME" name="IMAGE_NAME" scale="1.5" />
```

Встраивает изображение из именованного набора изображений (imageset) непосредственно в текстовый поток. Атрибут `scale` управляет размером изображения относительно высоты строки текста.

Пример из ванильного DayZ из `scripts/data/news_feed.txt`:
```
<image set="dayz_gui" name="icon_pin" />  Welcome to DayZ!
```

Пример из ванильного DayZ из `scripts/3_game/tools/inpututils.c` -- построение иконок кнопок контроллера:
```c
string icon = string.Format(
    "<image set=\"%1\" name=\"%2\" scale=\"%3\" />",
    imageSetName,
    iconName,
    1.21
);
richTextWidget.SetText(icon + " Press to confirm");
```

Распространённые наборы изображений в ванильном DayZ:
- `dayz_gui` -- общие иконки UI (булавка, уведомления)
- `dayz_inventory` -- иконки слотов инвентаря (левое плечо, руки, жилет и т.д.)
- `xbox_buttons` -- изображения кнопок контроллера Xbox (A, B, X, Y)
- `playstation_buttons` -- изображения кнопок контроллера PlayStation

#### Перенос строки

```
</br>
```

Принудительно вставляет перенос строки в содержимом форматированного текста. Обратите внимание на синтаксис закрывающего тега -- именно так парсер DayZ ожидает его.

#### Размер шрифта / Заголовок

```
<h scale="0.8">Текстовое содержимое</h>
<h scale="0.6">Текст меньшего размера</h>
```

Оборачивает текст в блок заголовка с множителем масштаба. Атрибут `scale` -- это число с плавающей точкой, которое управляет размером шрифта относительно базового шрифта виджета. Большие значения создают более крупный текст.

Пример из ванильного DayZ из `scripts/data/news_feed.txt`:
```
<h scale="0.8">
<image set="dayz_gui" name="icon_pin" />  Заголовок раздела
</h>
<h scale="0.6">
Основной текст меньшего размера размещается здесь.
</h>
</br>
```

### Практические паттерны использования

#### Получение ссылки на RichTextWidget

В скриптах получение ссылки происходит точно так же, как для любого другого виджета:

```c
RichTextWidget m_Label;
m_Label = RichTextWidget.Cast(root.FindAnyWidget("MyRichLabel"));
```

В файлах `.layout` используйте имя класса макета:

```
RichTextWidgetClass MyRichLabel {
    position 0 0
    size 1 0.1
    text ""
}
```

#### Установка форматированного содержимого с иконками контроллера

Ванильный класс `InputUtils` предоставляет вспомогательный метод, генерирующий строку тега `<image>` для любого действия ввода:

```c
// Из scripts/3_game/tools/inpututils.c
string buttonIcon = InputUtils.GetRichtextButtonIconFromInputAction(
    "UAUISelect",              // имя действия ввода
    "#menu_select",            // локализованная метка
    EUAINPUT_DEVICE_CONTROLLER,
    InputUtils.ICON_SCALE_TOOLBAR  // масштаб 1.81
);
// Результат: '<image set="xbox_buttons" name="A" scale="1.81" /> Select'

RichTextWidget toolbar = RichTextWidget.Cast(
    layoutRoot.FindAnyWidget("ToolbarText")
);
toolbar.SetText(buttonIcon);
```

Два предопределённых константы масштаба:
- `InputUtils.ICON_SCALE_NORMAL` = 1.21
- `InputUtils.ICON_SCALE_TOOLBAR` = 1.81

#### Прокручиваемое форматированное содержимое

`RichTextWidget` предоставляет методы для получения высоты содержимого и смещения для постраничного просмотра или прокрутки:

```c
// Из scripts/5_mission/gui/bookmenu.c
HtmlWidget m_content;  // HtmlWidget расширяет RichTextWidget
m_content.LoadFile(book.ConfigGetString("file"));

float totalHeight = m_content.GetContentHeight();
// Постраничная навигация:
m_content.SetContentOffset(pageOffset, true);  // snapToLine = true
```

#### Усечение текста

Когда текст выходит за пределы области фиксированной ширины, можно усечь его (обрезать с индикатором):

```c
// Усечь строку 0 до maxWidth пикселей, добавив "..."
richText.ElideText(0, maxWidth, "...");
```

#### Управление видимостью строк

Показать или скрыть определённые диапазоны строк в содержимом:

```c
int lineCount = richText.GetNumLines();
// Скрыть все строки после 5-й
richText.SetLinesVisibility(5, lineCount - 1, false);
// Получить ширину определённой строки в пикселях
float width = richText.GetLineWidth(2);
```

### HtmlWidget -- расширенный RichTextWidget

`HtmlWidget` расширяет `RichTextWidget` одним дополнительным методом:

```
class HtmlWidget extends RichTextWidget
{
    proto native void LoadFile(string path);
};
```

Используется ванильной системой книг для загрузки текстовых файлов `.html`:

```c
// Из scripts/5_mission/gui/bookmenu.c
HtmlWidget content;
Class.CastTo(content, layoutRoot.FindAnyWidget("HtmlWidget"));
content.LoadFile(book.ConfigGetString("file"));
```

### RichTextWidget vs TextWidget -- ключевые различия

| Функция | TextWidget | RichTextWidget |
|---------|-----------|---------------|
| Встроенные теги `<image>` | Нет | Да |
| Теги заголовков `<h>` | Нет | Да |
| Переносы строк `</br>` | Нет (используйте `\n`) | Да |
| Прокрутка содержимого | Нет | Да (через смещение) |
| Видимость строк | Нет | Да |
| Усечение текста | Нет | Да |
| Производительность | Быстрее | Медленнее (парсинг тегов) |

Используйте `TextWidget` для простых надписей. Используйте `RichTextWidget` только когда вам нужны встроенные изображения, форматированные заголовки или прокрутка содержимого.

---

## Рисование на CanvasWidget

`CanvasWidget` предоставляет рисование в немедленном режиме (immediate-mode) 2D-графики на экране. Он имеет ровно два нативных метода:

```
// Из scripts/1_core/proto/enwidgets.c
class CanvasWidget extends Widget
{
    proto native void DrawLine(float x1, float y1, float x2, float y2,
                               float width, int color);
    proto native void Clear();
};
```

Это весь API. Все сложные фигуры -- прямоугольники, круги, сетки -- должны строиться из отрезков линий.

### Система координат

`CanvasWidget` использует **экранные пиксельные координаты** относительно собственных границ виджета холста. Начало координат `(0, 0)` находится в верхнем левом углу виджета холста.

Если холст заполняет весь экран (позиция 0,0, размер 1,1 в относительном режиме), то координаты напрямую соответствуют экранным пикселям после преобразования из внутреннего размера виджета.

### Настройка макета

В файле `.layout`:

```
CanvasWidgetClass MyCanvas {
    ignorepointer 1
    position 0 0
    size 1 1
    hexactpos 1
    vexactpos 1
    hexactsize 0
    vexactsize 0
}
```

Ключевые флаги:
- `ignorepointer 1` -- холст не блокирует ввод мыши для виджетов под ним
- Размер `1 1` в относительном режиме означает "заполнить родителя"

В скрипте:

```c
CanvasWidget m_Canvas;
m_Canvas = CanvasWidget.Cast(
    root.FindAnyWidget("MyCanvas")
);
```

Или создание из файла макета:

```c
// Из COT: JM/COT/GUI/layouts/esp_canvas.layout
m_Canvas = CanvasWidget.Cast(
    g_Game.GetWorkspace().CreateWidgets("path/to/canvas.layout")
);
```

### Рисование примитивов

#### Линии

```c
// Нарисовать красную горизонтальную линию
m_Canvas.DrawLine(10, 50, 200, 50, 2, ARGB(255, 255, 0, 0));

// Нарисовать белую диагональную линию шириной 3 пикселя
m_Canvas.DrawLine(0, 0, 100, 100, 3, COLOR_WHITE);
```

Параметр `color` использует формат ARGB: `ARGB(альфа, красный, зелёный, синий)`.

#### Прямоугольники (из линий)

```c
void DrawRectangle(CanvasWidget canvas, float x, float y,
                   float w, float h, float lineWidth, int color)
{
    canvas.DrawLine(x, y, x + w, y, lineWidth, color);         // верх
    canvas.DrawLine(x + w, y, x + w, y + h, lineWidth, color); // правая сторона
    canvas.DrawLine(x + w, y + h, x, y + h, lineWidth, color); // низ
    canvas.DrawLine(x, y + h, x, y, lineWidth, color);         // левая сторона
}
```

#### Круги (из отрезков линий)

COT реализует этот паттерн в `JMESPCanvas`:

```c
// Из DayZ-CommunityOnlineTools/.../JMESPModule.c
void DrawCircle(float cx, float cy, float radius,
                int lineWidth, int color, int segments)
{
    float segAngle = 360.0 / segments;
    int i;
    for (i = 0; i < segments; i++)
    {
        float a1 = i * segAngle * Math.DEG2RAD;
        float a2 = (i + 1) * segAngle * Math.DEG2RAD;

        float x1 = cx + radius * Math.Cos(a1);
        float y1 = cy + radius * Math.Sin(a1);
        float x2 = cx + radius * Math.Cos(a2);
        float y2 = cy + radius * Math.Sin(a2);

        m_Canvas.DrawLine(x1, y1, x2, y2, lineWidth, color);
    }
}
```

Больше сегментов -- более гладкий круг. 36 сегментов -- распространённое значение по умолчанию.

### Паттерн перерисовки каждый кадр

`CanvasWidget` работает в немедленном режиме: вы должны вызвать `Clear()` и перерисовать всё каждый кадр. Обычно это делается в обратном вызове `Update()` или `OnUpdate()`.

Пример из ванильного кода из `scripts/5_mission/gui/mapmenu.c`:

```c
override void Update(float timeslice)
{
    super.Update(timeslice);
    m_ToolsScaleCellSizeCanvas.Clear();  // очистить предыдущий кадр

    // ... нарисовать сегменты линейки масштаба ...
    RenderScaleRuler();
}

protected void RenderScaleRuler()
{
    float sizeYShift = 8;
    float segLen = m_ToolScaleCellSizeCanvasWidth / SCALE_RULER_NUM_SEGMENTS;
    int lineColor;

    int i;
    for (i = 1; i <= SCALE_RULER_NUM_SEGMENTS; i++)
    {
        lineColor = FadeColors.BLACK;
        if (i % 2 == 0)
            lineColor = FadeColors.LIGHT_GREY;

        float startX = segLen * (i - 1);
        float endX = segLen * i;
        m_ToolsScaleCellSizeCanvas.DrawLine(
            startX, sizeYShift, endX, sizeYShift,
            SCALE_RULER_LINE_WIDTH, lineColor
        );
    }
}
```

### Паттерн ESP-оверлея (из COT)

COT (Community Online Tools) использует `CanvasWidget` как полноэкранный оверлей для рисования каркасов скелетов на игроках и объектах. Это один из самых сложных паттернов использования холста в любом моде DayZ.

**Архитектура:**

1. Полноэкранный `CanvasWidget` создаётся из файла макета
2. Каждый кадр вызывается `Clear()`
3. Мировые позиции преобразуются в экранные координаты
4. Между позициями костей рисуются линии для отображения скелетов

**Преобразование мировых координат в экранные** (из `JMESPCanvas` в COT):

```c
// Из DayZ-CommunityOnlineTools/.../JMESPModule.c
vector TransformToScreenPos(vector worldPos, out bool isInBounds)
{
    float parentW, parentH;
    vector screenPos;

    // Получить относительную позицию на экране (диапазон 0..1)
    screenPos = g_Game.GetScreenPosRelative(worldPos);

    // Проверить, видна ли позиция на экране
    isInBounds = screenPos[0] >= 0 && screenPos[0] <= 1
              && screenPos[1] >= 0 && screenPos[1] <= 1
              && screenPos[2] >= 0;

    // Преобразовать в пиксельные координаты холста
    m_Canvas.GetScreenSize(parentW, parentH);
    screenPos[0] = screenPos[0] * parentW;
    screenPos[1] = screenPos[1] * parentH;

    return screenPos;
}
```

**Рисование линии от мировой позиции A к мировой позиции B:**

```c
void DrawWorldLine(vector from, vector to, int width, int color)
{
    bool inBoundsFrom, inBoundsTo;
    from = TransformToScreenPos(from, inBoundsFrom);
    to = TransformToScreenPos(to, inBoundsTo);

    if (!inBoundsFrom || !inBoundsTo)
        return;

    m_Canvas.DrawLine(from[0], from[1], to[0], to[1], width, color);
}
```

**Рисование скелета игрока:**

```c
// Упрощённо из COT JMESPSkeleton.Draw()
static void DrawSkeleton(Human human, CanvasWidget canvas)
{
    // Определить соединения конечностей (пары костей)
    // шея->позвоночник3, позвоночник3->таз, шея->левая_рука и т.д.

    int color = COLOR_WHITE;
    switch (human.GetHealthLevel())
    {
        case GameConstants.STATE_DAMAGED:
            color = 0xFFDCDC00;  // жёлтый
            break;
        case GameConstants.STATE_BADLY_DAMAGED:
            color = 0xFFDC0000;  // красный
            break;
    }

    // Нарисовать каждую конечность как линию между двумя позициями костей
    vector bone1Pos = human.GetBonePositionWS(
        human.GetBoneIndexByName("neck")
    );
    vector bone2Pos = human.GetBonePositionWS(
        human.GetBoneIndexByName("spine3")
    );
    // ... преобразовать в экранные координаты, затем DrawLine ...
}
```

### Отладочный холст ванильного движка

Движок предоставляет встроенный отладочный холст через класс `Debug`:

```c
// Из scripts/3_game/tools/debug.c
static void InitCanvas()
{
    if (!m_DebugLayoutCanvas)
    {
        m_DebugLayoutCanvas = g_Game.GetWorkspace().CreateWidgets(
            "gui/layouts/debug/day_z_debugcanvas.layout"
        );
        m_CanvasDebug = CanvasWidget.Cast(
            m_DebugLayoutCanvas.FindAnyWidget("CanvasWidget")
        );
    }
}

static void CanvasDrawLine(float x1, float y1, float x2, float y2,
                           float width, int color)
{
    InitCanvas();
    m_CanvasDebug.DrawLine(x1, y1, x2, y2, width, color);
}

static void CanvasDrawPoint(float x1, float y1, int color)
{
    CanvasDrawLine(x1, y1, x1 + 1, y1, 1, color);
}

static void ClearCanvas()
{
    if (m_CanvasDebug)
        m_CanvasDebug.Clear();
}
```

### Вопросы производительности

- **Очищайте и перерисовывайте каждый кадр.** `CanvasWidget` не сохраняет состояние между кадрами в большинстве случаев, когда вид меняется (движение камеры и т.д.). Вызывайте `Clear()` в начале каждого обновления.
- **Минимизируйте количество линий.** Каждый вызов `DrawLine()` имеет накладные расходы. Для сложных фигур, таких как круги, используйте меньше сегментов (12-18) для удалённых объектов, больше (36) для близких.
- **Сначала проверяйте границы экрана.** Преобразуйте мировые позиции в экранные координаты и пропускайте объекты, находящиеся за экраном или за камерой (`screenPos[2] < 0`).
- **Используйте `ignorepointer 1`.** Всегда устанавливайте этот флаг на оверлеях холста, чтобы они не перехватывали события мыши.
- **Одного холста достаточно.** Используйте один полноэкранный холст для всего оверлейного рисования вместо создания множества виджетов холста.

---

## MapWidget

`MapWidget` отображает карту местности DayZ и предоставляет методы для размещения маркеров, преобразования координат и управления масштабом.

### Определение класса

```
// Из scripts/3_game/gameplay.c
class MapWidget extends Widget
{
    proto native void    ClearUserMarks();
    proto native void    AddUserMark(vector pos, string text,
                                     int color, string texturePath);
    proto native vector  GetMapPos();
    proto native void    SetMapPos(vector worldPos);
    proto native float   GetScale();
    proto native void    SetScale(float scale);
    proto native float   GetContourInterval();
    proto native float   GetCellSize(float legendWidth);
    proto native vector  MapToScreen(vector worldPos);
    proto native vector  ScreenToMap(vector screenPos);
};
```

### Получение виджета карты

В файле `.layout` разместите карту, используя тип `MapWidgetClass`. В скрипте получите ссылку через приведение типа:

```c
MapWidget m_Map;
m_Map = MapWidget.Cast(layoutRoot.FindAnyWidget("Map"));
```

### Координаты карты и мировые координаты

DayZ использует два пространства координат:

- **Мировые координаты**: 3D-векторы в метрах. `x` = восток/запад, `y` = высота, `z` = север/юг. Черноруссь имеет диапазон примерно 0-15360 по осям x и z.
- **Экранные координаты**: Пиксельные позиции на виджете карты. Они меняются при панорамировании и масштабировании.

`MapWidget` предоставляет преобразование между ними:

```c
// Мировая позиция в экранный пиксель на карте
vector screenPos = m_Map.MapToScreen(worldPosition);

// Экранный пиксель на карте в мировую позицию
vector worldPos = m_Map.ScreenToMap(Vector(screenX, screenY, 0));
```

### Добавление маркеров

`AddUserMark()` размещает маркер в мировой позиции с меткой, цветом и текстурой иконки:

```c
m_Map.AddUserMark(
    playerPos,                                   // vector: мировая позиция
    "Вы",                                        // string: текст метки
    COLOR_RED,                                   // int: цвет ARGB
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"  // string: текстура иконки
);
```

Пример из ванильного кода из `scripts/5_mission/gui/scriptconsolegeneraltab.c`:

```c
// Отметить позицию игрока
m_DebugMapWidget.AddUserMark(
    playerPos, "You", COLOR_RED,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);

// Отметить других игроков
m_DebugMapWidget.AddUserMark(
    rpd.m_Pos, rpd.m_Name + " " + dist + "m", COLOR_BLUE,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);

// Отметить позицию камеры
m_DebugMapWidget.AddUserMark(
    cameraPos, "Camera", COLOR_GREEN,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);
```

Другой ванильный пример из `scripts/5_mission/gui/mapmenu.c` (закомментированный, но показывающий API):

```c
m.AddUserMark("2681 4.7 1751", "Label1", ARGB(255,255,0,0),
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa");
m.AddUserMark("2683 4.7 1851", "Label2", ARGB(255,0,255,0),
    "\\dz\\gear\\navigation\\data\\map_bunker_ca.paa");
m.AddUserMark("2670 4.7 1651", "Label3", ARGB(255,0,0,255),
    "\\dz\\gear\\navigation\\data\\map_busstop_ca.paa");
```

### Очистка маркеров

`ClearUserMarks()` удаляет все пользовательские маркеры за один раз. Метода для удаления одного маркера по ссылке не существует. Стандартный паттерн -- очистить все маркеры и заново добавить нужные каждый кадр.

```c
// Из scripts/5_mission/gui/scriptconsolesoundstab.c
override void Update(float timeslice)
{
    m_DebugMapWidget.ClearUserMarks();
    // Заново добавить все текущие маркеры
    m_DebugMapWidget.AddUserMark(playerPos, "You", COLOR_RED, iconPath);
}
```

### Доступные иконки маркеров карты

Ванильная игра регистрирует следующие текстуры иконок маркеров в `scripts/5_mission/gui/mapmarkersinfo.c`:

| Константа перечисления | Путь к текстуре |
|---|---|
| `MARKERTYPE_MAP_BORDER_CROSS` | `\dz\gear\navigation\data\map_border_cross_ca.paa` |
| `MARKERTYPE_MAP_BROADLEAF` | `\dz\gear\navigation\data\map_broadleaf_ca.paa` |
| `MARKERTYPE_MAP_CAMP` | `\dz\gear\navigation\data\map_camp_ca.paa` |
| `MARKERTYPE_MAP_FACTORY` | `\dz\gear\navigation\data\map_factory_ca.paa` |
| `MARKERTYPE_MAP_FIR` | `\dz\gear\navigation\data\map_fir_ca.paa` |
| `MARKERTYPE_MAP_FIREDEP` | `\dz\gear\navigation\data\map_firedep_ca.paa` |
| `MARKERTYPE_MAP_GOVOFFICE` | `\dz\gear\navigation\data\map_govoffice_ca.paa` |
| `MARKERTYPE_MAP_HILL` | `\dz\gear\navigation\data\map_hill_ca.paa` |
| `MARKERTYPE_MAP_MONUMENT` | `\dz\gear\navigation\data\map_monument_ca.paa` |
| `MARKERTYPE_MAP_POLICE` | `\dz\gear\navigation\data\map_police_ca.paa` |
| `MARKERTYPE_MAP_STATION` | `\dz\gear\navigation\data\map_station_ca.paa` |
| `MARKERTYPE_MAP_STORE` | `\dz\gear\navigation\data\map_store_ca.paa` |
| `MARKERTYPE_MAP_TOURISM` | `\dz\gear\navigation\data\map_tourism_ca.paa` |
| `MARKERTYPE_MAP_TRANSMITTER` | `\dz\gear\navigation\data\map_transmitter_ca.paa` |
| `MARKERTYPE_MAP_TREE` | `\dz\gear\navigation\data\map_tree_ca.paa` |
| `MARKERTYPE_MAP_VIEWPOINT` | `\dz\gear\navigation\data\map_viewpoint_ca.paa` |
| `MARKERTYPE_MAP_WATERPUMP` | `\dz\gear\navigation\data\map_waterpump_ca.paa` |

Доступ к ним по перечислению через `MapMarkerTypes.GetMarkerTypeFromID(eMapMarkerTypes.MARKERTYPE_MAP_CAMP)`.

### Управление масштабом и панорамированием

```c
// Установить центр карты на мировую позицию
m_Map.SetMapPos(playerWorldPos);

// Получить/установить уровень масштаба (0.0 = полностью отдалён, 1.0 = полностью приближён)
float currentScale = m_Map.GetScale();
m_Map.SetScale(0.33);  // умеренный уровень масштаба

// Получить информацию о карте
float contourInterval = m_Map.GetContourInterval();  // метры между линиями контура
float cellSize = m_Map.GetCellSize(legendWidth);      // размер ячейки для линейки масштаба
```

### Обработка кликов по карте

Обработка кликов мыши по карте осуществляется через обратные вызовы `OnDoubleClick` или `OnMouseButtonDown` в `ScriptedWidgetEventHandler` или `UIScriptedMenu`. Преобразуйте позицию клика в мировые координаты с помощью `ScreenToMap()`.

Пример из ванильного кода из `scripts/5_mission/gui/scriptconsolegeneraltab.c`:

```c
override bool OnDoubleClick(Widget w, int x, int y, int button)
{
    super.OnDoubleClick(w, x, y, button);

    if (w == m_DebugMapWidget)
    {
        // Преобразовать экранный клик в мировые координаты
        vector worldPos = m_DebugMapWidget.ScreenToMap(Vector(x, y, 0));

        // Получить высоту рельефа в этой позиции
        float surfaceY = g_Game.SurfaceY(worldPos[0], worldPos[2]);
        float roadY = g_Game.SurfaceRoadY(worldPos[0], worldPos[2]);
        worldPos[1] = Math.Max(surfaceY, roadY);

        // Использовать мировую позицию (например, телепортировать игрока)
    }
    return false;
}
```

Из `scripts/5_mission/gui/maphandler.c`:

```c
class MapHandler : ScriptedWidgetEventHandler
{
    override bool OnDoubleClick(Widget w, int x, int y, int button)
    {
        vector worldPos = MapWidget.Cast(w).ScreenToMap(Vector(x, y, 0));
        // Разместить маркер, телепортировать и т.д.
        return true;
    }
}
```

### Система маркеров карты Expansion

Мод Expansion строит полноценную систему маркеров поверх ванильного `MapWidget`. Ключевые паттерны:

- Поддерживает отдельные словари для персональных, серверных, групповых и маркеров игроков
- Ограничивает обновления маркеров за кадр (`m_MaxMarkerUpdatesPerFrame = 3`) для производительности
- Рисует линии линейки масштаба с помощью `CanvasWidget` рядом с картой
- Использует пользовательские оверлеи виджетов маркеров, позиционируемые через `MapToScreen()`, для более богатой визуализации маркеров, чем поддерживает `AddUserMark()`

Этот подход демонстрирует, что для сложных UI маркеров (иконки с подсказками, редактируемые метки, цветовые категории) следует накладывать пользовательские виджеты, позиционируемые через `MapToScreen()`, а не полагаться исключительно на `AddUserMark()`.

---

## ItemPreviewWidget

`ItemPreviewWidget` отображает 3D-превью любого `EntityAI` (предмета, оружия, транспорта) внутри панели UI.

### Определение класса

```
// Из scripts/3_game/gameplay.c
class ItemPreviewWidget extends Widget
{
    proto native void    SetItem(EntityAI object);
    proto native EntityAI GetItem();
    proto native int     GetView();
    proto native void    SetView(int viewIndex);
    proto native void    SetModelOrientation(vector vOrientation);
    proto native vector  GetModelOrientation();
    proto native void    SetModelPosition(vector vPos);
    proto native vector  GetModelPosition();
    proto native void    SetForceFlipEnable(bool enable);
    proto native void    SetForceFlip(bool value);
};
```

### Индексы видов

Параметр `viewIndex` выбирает, какой ограничивающий параллелепипед и угол камеры использовать. Они определяются для каждого предмета в его конфигурации:

- Вид 0: по умолчанию (`boundingbox_min` + `boundingbox_max` + `invView`)
- Вид 1: альтернативный (`boundingbox_min2` + `boundingbox_max2` + `invView2`)
- Вид 2+: дополнительные виды, если определены

Используйте `item.GetViewIndex()` для получения предпочтительного вида предмета.

### Паттерн использования -- осмотр предмета

Из `scripts/5_mission/gui/inspectmenunew.c`:

```c
class InspectMenuNew extends UIScriptedMenu
{
    private ItemPreviewWidget m_item_widget;
    private vector m_characterOrientation;

    void SetItem(EntityAI item)
    {
        if (!m_item_widget)
        {
            Widget preview_frame = layoutRoot.FindAnyWidget("ItemFrameWidget");
            m_item_widget = ItemPreviewWidget.Cast(preview_frame);
        }

        m_item_widget.SetItem(item);
        m_item_widget.SetView(item.GetViewIndex());
        m_item_widget.SetModelPosition(Vector(0, 0, 1));
    }
}
```

### Управление вращением (перетаскивание мышью)

Стандартный паттерн интерактивного вращения:

```c
private int m_RotationX;
private int m_RotationY;
private vector m_Orientation;

override bool OnMouseButtonDown(Widget w, int x, int y, int button)
{
    if (w == m_item_widget)
    {
        GetMousePos(m_RotationX, m_RotationY);
        g_Game.GetDragQueue().Call(this, "UpdateRotation");
        return true;
    }
    return false;
}

void UpdateRotation(int mouse_x, int mouse_y, bool is_dragging)
{
    vector o = m_Orientation;
    o[0] = o[0] + (m_RotationY - mouse_y);  // наклон
    o[1] = o[1] - (m_RotationX - mouse_x);  // поворот
    m_item_widget.SetModelOrientation(o);

    if (!is_dragging)
        m_Orientation = o;
}
```

### Управление масштабом (колесо мыши)

```c
override bool OnMouseWheel(Widget w, int x, int y, int wheel)
{
    if (w == m_item_widget)
    {
        float widgetW, widgetH;
        m_item_widget.GetSize(widgetW, widgetH);

        widgetW = widgetW + (wheel / 4.0);
        widgetH = widgetH + (wheel / 4.0);

        if (widgetW > 0.5 && widgetW < 3.0)
            m_item_widget.SetSize(widgetW, widgetH);
    }
    return false;
}
```

---

## PlayerPreviewWidget

`PlayerPreviewWidget` отображает полную 3D-модель персонажа игрока в UI, включая экипированные предметы и анимации.

### Определение класса

```
// Из scripts/3_game/gameplay.c
class PlayerPreviewWidget extends Widget
{
    proto native void       UpdateItemInHands(EntityAI object);
    proto native void       SetPlayer(DayZPlayer player);
    proto native DayZPlayer GetDummyPlayer();
    proto native void       Refresh();
    proto native void       SetModelOrientation(vector vOrientation);
    proto native vector     GetModelOrientation();
    proto native void       SetModelPosition(vector vPos);
    proto native vector     GetModelPosition();
};
```

### Паттерн использования -- превью персонажа в инвентаре

Из `scripts/5_mission/gui/inventorynew/playerpreview.c`:

```c
class PlayerPreview: LayoutHolder
{
    protected ref PlayerPreviewWidget m_CharacterPanelWidget;
    protected vector m_CharacterOrientation;
    protected int m_CharacterScaleDelta;

    void PlayerPreview(LayoutHolder parent)
    {
        m_CharacterPanelWidget = PlayerPreviewWidget.Cast(
            m_Parent.GetMainWidget().FindAnyWidget("CharacterPanelWidget")
        );

        m_CharacterPanelWidget.SetPlayer(g_Game.GetPlayer());
        m_CharacterPanelWidget.SetModelPosition("0 0 0.605");
        m_CharacterPanelWidget.SetSize(1.34, 1.34);
    }

    void RefreshPlayerPreview()
    {
        m_CharacterPanelWidget.Refresh();
    }
}
```

### Поддержание актуальности экипировки

Метод `UpdateInterval()` поддерживает превью в синхронизации с фактической экипировкой игрока:

```c
override void UpdateInterval()
{
    // Обновить предмет в руках
    m_CharacterPanelWidget.UpdateItemInHands(
        g_Game.GetPlayer().GetEntityInHands()
    );

    // Получить доступ к фиктивному игроку для синхронизации анимаций
    DayZPlayer dummyPlayer = m_CharacterPanelWidget.GetDummyPlayer();
    if (dummyPlayer)
    {
        HumanCommandAdditives hca = dummyPlayer.GetCommandModifier_Additives();
        PlayerBase realPlayer = PlayerBase.Cast(g_Game.GetPlayer());
        if (hca && realPlayer.m_InjuryHandler)
        {
            hca.SetInjured(
                realPlayer.m_InjuryHandler.GetInjuryAnimValue(),
                realPlayer.m_InjuryHandler.IsInjuryAnimEnabled()
            );
        }
    }
}
```

### Вращение и масштабирование

Паттерны вращения и масштабирования идентичны `ItemPreviewWidget` -- используйте `SetModelOrientation()` с перетаскиванием мыши и `SetSize()` с колесом мыши. Полный код смотрите в предыдущем разделе.

---

## VideoWidget

`VideoWidget` воспроизводит видеофайлы в UI. Поддерживает управление воспроизведением, зацикливание, перемотку, запросы состояния, субтитры и обратные вызовы событий.

### Определение класса

```
// Из scripts/1_core/proto/enwidgets.c
enum VideoState { NONE, PLAYING, PAUSED, STOPPED, FINISHED };

enum VideoCallback
{
    ON_PLAY, ON_PAUSE, ON_STOP, ON_END, ON_LOAD,
    ON_SEEK, ON_BUFFERING_START, ON_BUFFERING_END, ON_ERROR
};

class VideoWidget extends Widget
{
    proto native bool Load(string name, bool looping = false, int startTime = 0);
    proto native void Unload();
    proto native bool Play();
    proto native bool Pause();
    proto native bool Stop();
    proto native bool SetTime(int time, bool preload);
    proto native int  GetTime();
    proto native int  GetTotalTime();
    proto native void SetLooping(bool looping);
    proto native bool IsLooping();
    proto native bool IsPlaying();
    proto native VideoState GetState();
    proto native void DisableSubtitles(bool disable);
    proto native bool IsSubtitlesDisabled();
    proto void SetCallback(VideoCallback cb, func fn);
};
```

### Паттерн использования -- видео в меню

Из `scripts/5_mission/gui/newui/mainmenu/mainmenuvideo.c`:

```c
protected VideoWidget m_Video;

override Widget Init()
{
    layoutRoot = g_Game.GetWorkspace().CreateWidgets(
        "gui/layouts/xbox/video_menu.layout"
    );
    m_Video = VideoWidget.Cast(layoutRoot.FindAnyWidget("video"));

    m_Video.Load("video\\DayZ_onboarding_MASTER.mp4");
    m_Video.Play();

    // Зарегистрировать обратный вызов для завершения видео
    m_Video.SetCallback(VideoCallback.ON_END, StopVideo);

    return layoutRoot;
}

void StopVideo()
{
    // Обработать завершение видео
    Close();
}
```

### Субтитры

Для субтитров требуется шрифт, назначенный `VideoWidget` в макете. Файлы субтитров используют соглашение об именовании `videoName_Language.srt`, при этом английская версия называется `videoName.srt` (без суффикса языка).

```c
// Субтитры включены по умолчанию
m_Video.DisableSubtitles(false);  // явно включить
```

### Возвращаемые значения

Методы `Load()`, `Play()`, `Pause()` и `Stop()` возвращают `bool`, но это возвращаемое значение **устарело**. Используйте `VideoCallback.ON_ERROR` для обнаружения ошибок.

---

## RenderTargetWidget и RTTextureWidget

Эти виджеты позволяют рендерить вид 3D-мира в виджет UI.

### Определения классов

```
// Из scripts/1_core/proto/enwidgets.c
class RenderTargetWidget extends Widget
{
    proto native void SetRefresh(int period, int offset);
    proto native void SetResolutionScale(float xscale, float yscale);
};

class RTTextureWidget extends Widget
{
    // Нет дополнительных методов -- служит целью рендеринга текстуры для дочерних виджетов
};
```

Глобальная функция `SetWidgetWorld` привязывает цель рендеринга к миру и камере:

```
proto native void SetWidgetWorld(
    RenderTargetWidget w,
    IEntity worldEntity,
    int camera
);
```

### RenderTargetWidget

Рендерит вид камеры из `BaseWorld` в область виджета. Используется для камер наблюдения, зеркал заднего вида или дисплеев "картинка в картинке".

Из `scripts/2_gamelib/entities/rendertarget.c`:

```c
// Создание цели рендеринга программно
RenderTargetWidget m_RenderWidget;

int screenW, screenH;
GetScreenSize(screenW, screenH);
int posX = screenW * x;
int posY = screenH * y;
int width = screenW * w;
int height = screenH * h;

Class.CastTo(m_RenderWidget, g_Game.GetWorkspace().CreateWidget(
    RenderTargetWidgetTypeID,
    posX, posY, width, height,
    WidgetFlags.VISIBLE | WidgetFlags.HEXACTSIZE
    | WidgetFlags.VEXACTSIZE | WidgetFlags.HEXACTPOS
    | WidgetFlags.VEXACTPOS,
    0xffffffff,
    sortOrder
));

// Привязать к игровому миру с индексом камеры 0
SetWidgetWorld(m_RenderWidget, g_Game.GetWorldEntity(), 0);
```

**Управление обновлением:**

```c
// Рендерить каждый 2-й кадр (period=2, offset=0)
m_RenderWidget.SetRefresh(2, 0);

// Рендерить в половинном разрешении для производительности
m_RenderWidget.SetResolutionScale(0.5, 0.5);
```

### RTTextureWidget

`RTTextureWidget` не имеет скриптовых методов помимо унаследованных от `Widget`. Он служит текстурой цели рендеринга, в которую могут рендериться дочерние виджеты. `ImageWidget` может ссылаться на `RTTextureWidget` как на источник текстуры через `SetImageTexture()`:

```c
ImageWidget imgWidget;
RTTextureWidget rtTexture;
imgWidget.SetImageTexture(0, rtTexture);
```

---

## Лучшие практики

1. **Используйте подходящий виджет для задачи.** `TextWidget` для простых надписей, `RichTextWidget` только когда нужны встроенные изображения или форматированное содержимое. `CanvasWidget` для динамических 2D-оверлеев, а не для статической графики (для неё используйте `ImageWidget`).

2. **Очищайте холст каждый кадр.** Всегда вызывайте `Clear()` перед перерисовкой. Невыполнение очистки приводит к накоплению рисунков и визуальным артефактам.

3. **Проверяйте границы экрана для рисования ESP/оверлея.** Перед вызовом `DrawLine()` убедитесь, что обе конечные точки находятся на экране. Рисование за пределами экрана -- пустая трата ресурсов.

4. **Маркеры карты: паттерн "очистить и восстановить".** Метода `RemoveUserMark()` не существует. Вызывайте `ClearUserMarks()`, затем заново добавляйте все активные маркеры при каждом обновлении. Этот паттерн используется во всех ванильных и модовых реализациях.

5. **ItemPreviewWidget требует реальный EntityAI.** Вы не можете предпросмотреть строку с именем класса -- вам нужна ссылка на созданную сущность. Для превью инвентаря используйте фактический предмет инвентаря.

6. **PlayerPreviewWidget владеет фиктивным игроком.** Виджет создаёт внутреннего фиктивного `DayZPlayer`. Получайте к нему доступ через `GetDummyPlayer()` для синхронизации анимаций, но не уничтожайте его самостоятельно.

7. **VideoWidget: используйте обратные вызовы, а не возвращаемые значения.** Возвращаемые bool из `Load()`, `Play()` и т.д. устарели. Используйте `SetCallback(VideoCallback.ON_ERROR, handler)`.

8. **Производительность RenderTargetWidget.** Используйте `SetRefresh()` с period > 1 для пропуска кадров. Используйте `SetResolutionScale()` для снижения разрешения. Эти виджеты ресурсоёмки -- используйте их экономно.

---

## Использование в реальных модах

| Мод | Виджет | Использование |
|-----|--------|---------------|
| **COT** | `CanvasWidget` | Полноэкранный ESP-оверлей с рисованием скелетов, проецированием мировых координат на экран, примитивами кругов и линий |
| **COT** | `MapWidget` | Админ-телепорт через `ScreenToMap()` по двойному клику |
| **Expansion** | `MapWidget` | Пользовательская система маркеров с категориями: персональные/серверные/групповые, ограничение обновлений за кадр |
| **Expansion** | `CanvasWidget` | Рисование линейки масштаба карты рядом с `MapWidget` |
| **Ванильная карта** | `MapWidget` + `CanvasWidget` | Линейка масштаба, отрисованная чередующимися чёрными/серыми отрезками линий |
| **Ванильный осмотр** | `ItemPreviewWidget` | 3D-осмотр предмета с вращением перетаскиванием и масштабированием прокруткой |
| **Ванильный инвентарь** | `PlayerPreviewWidget` | Превью персонажа с синхронизацией экипировки и анимациями ранений |
| **Ванильные подсказки** | `RichTextWidget` | Панель внутриигровых подсказок с форматированным текстом описания |
| **Ванильные меню** | `RichTextWidget` | Иконки кнопок контроллера через `InputUtils.GetRichtextButtonIconFromInputAction()` |
| **Ванильные книги** | `HtmlWidget` | Загрузка и постраничный просмотр текстовых файлов `.html` |
| **Ванильное главное меню** | `VideoWidget` | Ознакомительное видео с обратным вызовом завершения |
| **Ванильная цель рендеринга** | `RenderTargetWidget` | Рендеринг камеры в виджет с настраиваемой частотой обновления |

---

## Распространённые ошибки

**1. Использование RichTextWidget там, где достаточно TextWidget.**
Парсинг форматированного текста имеет накладные расходы. Если вам нужен только простой текст, используйте `TextWidget`.

**2. Забывание вызвать Clear() для холста.**
```c
// НЕПРАВИЛЬНО - рисунки накапливаются, заполняя экран
void Update(float dt)
{
    m_Canvas.DrawLine(0, 0, 100, 100, 1, COLOR_RED);
}

// ПРАВИЛЬНО
void Update(float dt)
{
    m_Canvas.Clear();
    m_Canvas.DrawLine(0, 0, 100, 100, 1, COLOR_RED);
}
```

**3. Рисование за камерой.**
```c
// НЕПРАВИЛЬНО - рисует линии к объектам позади вас
vector screenPos = g_Game.GetScreenPosRelative(worldPos);
// Нет проверки границ!

// ПРАВИЛЬНО
vector screenPos = g_Game.GetScreenPosRelative(worldPos);
if (screenPos[2] < 0)
    return;  // за камерой
if (screenPos[0] < 0 || screenPos[0] > 1 || screenPos[1] < 0 || screenPos[1] > 1)
    return;  // за пределами экрана
```

**4. Попытка удалить один маркер карты.**
Метода `RemoveUserMark()` не существует. Необходимо вызвать `ClearUserMarks()` и заново добавить все маркеры, которые нужно сохранить.

**5. Установка предмета ItemPreviewWidget в null без проверки.**
Всегда проверяйте ссылку на сущность на null перед вызовом `SetItem()`.

**6. Не установлен ignorepointer для оверлейных холстов.**
Холст без `ignorepointer 1` будет перехватывать все события мыши, делая UI под ним неотзывчивым.

**7. Использование обратных слешей в путях текстур без удвоения.**
В строках Enforce Script обратные слеши должны быть удвоены:
```c
// НЕПРАВИЛЬНО
"\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
// На самом деле это ПРАВИЛЬНО в Enforce Script -- каждый \\ создаёт один \
```

---

## Совместимость и влияние

| Виджет | Только клиент | Стоимость производительности | Совместимость модов |
|--------|------------|-----------------|-------------------|
| `RichTextWidget` | Да | Низкая (парсинг тегов) | Безопасно, нет конфликтов |
| `CanvasWidget` | Да | Средняя (каждый кадр) | Безопасно при установленном `ignorepointer` |
| `MapWidget` | Да | Низкая-Средняя | Несколько модов могут добавлять маркеры |
| `ItemPreviewWidget` | Да | Средняя (3D-рендер) | Безопасно, область видимости виджета |
| `PlayerPreviewWidget` | Да | Средняя (3D-рендер) | Безопасно, создаёт фиктивного игрока |
| `VideoWidget` | Да | Высокая (декодирование видео) | Одно видео за раз |
| `RenderTargetWidget` | Да | Высокая (3D-рендер) | Возможны конфликты камер |
| `RTTextureWidget` | Да | Низкая (цель текстуры) | Безопасно |

Все эти виджеты работают только на стороне клиента. Они не имеют серверного представления и не могут быть созданы или изменены из серверных скриптов.

---

## Сводка

| Виджет | Основное применение | Ключевые методы |
|--------|-----------|-------------|
| `RichTextWidget` | Форматированный текст со встроенными изображениями | `SetText()`, `GetContentHeight()`, `SetContentOffset()` |
| `HtmlWidget` | Загрузка форматированных текстовых файлов | `LoadFile()` |
| `CanvasWidget` | 2D-оверлей для рисования | `DrawLine()`, `Clear()` |
| `MapWidget` | Карта местности с маркерами | `AddUserMark()`, `ClearUserMarks()`, `ScreenToMap()`, `MapToScreen()` |
| `ItemPreviewWidget` | 3D-отображение предмета | `SetItem()`, `SetView()`, `SetModelOrientation()` |
| `PlayerPreviewWidget` | 3D-отображение персонажа игрока | `SetPlayer()`, `Refresh()`, `UpdateItemInHands()` |
| `VideoWidget` | Воспроизведение видео | `Load()`, `Play()`, `Pause()`, `SetCallback()` |
| `RenderTargetWidget` | 3D-вид камеры в реальном времени | `SetRefresh()`, `SetResolutionScale()` + `SetWidgetWorld()` |
| `RTTextureWidget` | Цель рендеринга в текстуру | Служит источником текстуры для `ImageWidget.SetImageTexture()` |

---

*Эта глава завершает раздел о системе GUI. Все сигнатуры API и паттерны подтверждены из ванильных скриптов DayZ и исходного кода реальных модов.*
