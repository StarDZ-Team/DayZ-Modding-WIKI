# Rozdział 3.10: Zaawansowane widgety

[Strona główna](../README.md) | [<< Poprzedni: Wzorce UI z prawdziwych modów](09-real-mod-patterns.md) | **Zaawansowane widgety**

---

Poza standardowymi kontenerami, widgetami tekstu i obrazów omówionymi we wcześniejszych rozdziałach, DayZ zapewnia wyspecjalizowane typy widgetów do formatowania tekstu sformatowanego, rysowania na kanwie 2D, wyświetlania map, podglądów przedmiotów 3D, odtwarzania wideo i renderowania do tekstury. Te widgety odblokowują możliwości, których proste layouty nie są w stanie osiągnąć.

Ten rozdział omawia każdy zaawansowany typ widgetu z potwierdzonymi sygnaturami API wyodrębnionymi z kodu źródłowego vanilla i rzeczywistego użycia w modach.

---

## Formatowanie RichTextWidget

`RichTextWidget` rozszerza `TextWidget` i obsługuje znaczniki inline w treści tekstowej. Jest głównym sposobem na wyświetlanie sformatowanego tekstu z osadzonymi obrazami, zmiennym rozmiarem czcionek i łamaniem linii.

### Definicja klasy

```
// Z scripts/1_core/proto/enwidgets.c
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

`RichTextWidget` dziedziczy wszystkie metody `TextWidget` -- `SetText()`, `SetTextExactSize()`, `SetOutline()`, `SetShadow()`, `SetTextFormat()` i pozostałe. Kluczowa różnica polega na tym, że `SetText()` na `RichTextWidget` parsuje znaczniki inline.

### Obsługiwane znaczniki inline

Te znaczniki są potwierdzone przez użycie w vanilla DayZ w `news_feed.txt`, `InputUtils.c` i wielu skryptach menu.

#### Osadzony obraz

```
<image set="IMAGESET_NAME" name="IMAGE_NAME" />
<image set="IMAGESET_NAME" name="IMAGE_NAME" scale="1.5" />
```

Osadza obraz z nazwanego zestawu obrazów bezpośrednio w przepływie tekstu. Atrybut `scale` kontroluje rozmiar obrazu względem wysokości linii tekstu.

Przykład z vanilla, z `scripts/data/news_feed.txt`:
```
<image set="dayz_gui" name="icon_pin" />  Welcome to DayZ!
```

Przykład z vanilla, z `scripts/3_game/tools/inpututils.c` -- budowanie ikon przycisków kontrolera:
```c
string icon = string.Format(
    "<image set=\"%1\" name=\"%2\" scale=\"%3\" />",
    imageSetName,
    iconName,
    1.21
);
richTextWidget.SetText(icon + " Press to confirm");
```

Popularne zestawy obrazów w vanilla DayZ:
- `dayz_gui` -- ogólne ikony UI (pin, powiadomienia)
- `dayz_inventory` -- ikony slotów inwentarza (shoulderleft, hands, vest itp.)
- `xbox_buttons` -- obrazy przycisków kontrolera Xbox (A, B, X, Y)
- `playstation_buttons` -- obrazy przycisków kontrolera PlayStation

#### Łamanie linii

```
</br>
```

Wymusza łamanie linii w treści tekstu sformatowanego. Zwróć uwagę na składnię znacznika zamykającego -- tak parser DayZ tego oczekuje.

#### Rozmiar czcionki / Nagłówek

```
<h scale="0.8">Treść tekstowa tutaj</h>
<h scale="0.6">Mniejsza treść tekstowa</h>
```

Otacza tekst blokiem nagłówka z mnożnikiem skali. Atrybut `scale` to liczba zmiennoprzecinkowa kontrolująca rozmiar czcionki względem bazowej czcionki widgetu. Większe wartości dają większy tekst.

Przykład z vanilla, z `scripts/data/news_feed.txt`:
```
<h scale="0.8">
<image set="dayz_gui" name="icon_pin" />  Section Title
</h>
<h scale="0.6">
Body text at smaller size goes here.
</h>
</br>
```

### Praktyczne wzorce użycia

#### Uzyskiwanie referencji do RichTextWidget

W skryptach rzutuj z layoutu dokładnie jak każdy inny widget:

```c
RichTextWidget m_Label;
m_Label = RichTextWidget.Cast(root.FindAnyWidget("MyRichLabel"));
```

W plikach `.layout` użyj nazwy klasy layoutu:

```
RichTextWidgetClass MyRichLabel {
    position 0 0
    size 1 0.1
    text ""
}
```

#### Ustawianie sformatowanej treści z ikonami kontrolera

Klasa `InputUtils` w vanilla zapewnia helper, który generuje ciąg znacznika `<image>` dla dowolnej akcji wejściowej:

```c
// Z scripts/3_game/tools/inpututils.c
string buttonIcon = InputUtils.GetRichtextButtonIconFromInputAction(
    "UAUISelect",              // nazwa akcji wejściowej
    "#menu_select",            // zlokalizowana etykieta
    EUAINPUT_DEVICE_CONTROLLER,
    InputUtils.ICON_SCALE_TOOLBAR  // skala 1.81
);
// Wynik: '<image set="xbox_buttons" name="A" scale="1.81" /> Select'

RichTextWidget toolbar = RichTextWidget.Cast(
    layoutRoot.FindAnyWidget("ToolbarText")
);
toolbar.SetText(buttonIcon);
```

Dwie predefiniowane stałe skali:
- `InputUtils.ICON_SCALE_NORMAL` = 1.21
- `InputUtils.ICON_SCALE_TOOLBAR` = 1.81

#### Przewijalna treść tekstu sformatowanego

`RichTextWidget` udostępnia metody wysokości treści i offsetu do stronicowania lub przewijania:

```c
// Z scripts/5_mission/gui/bookmenu.c
HtmlWidget m_content;  // HtmlWidget rozszerza RichTextWidget
m_content.LoadFile(book.ConfigGetString("file"));

float totalHeight = m_content.GetContentHeight();
// Stronicowanie treści:
m_content.SetContentOffset(pageOffset, true);  // snapToLine = true
```

#### Obcinanie tekstu

Gdy tekst wykracza poza obszar o stałej szerokości, możesz go obciąć (skrócić ze wskaźnikiem):

```c
// Obetnij linię 0 do maxWidth pikseli, dodając "..."
richText.ElideText(0, maxWidth, "...");
```

#### Kontrola widoczności linii

Pokaż lub ukryj określone zakresy linii w treści:

```c
int lineCount = richText.GetNumLines();
// Ukryj wszystkie linie po 5-tej
richText.SetLinesVisibility(5, lineCount - 1, false);
// Pobierz szerokość w pikselach konkretnej linii
float width = richText.GetLineWidth(2);
```

### HtmlWidget -- Rozszerzony RichTextWidget

`HtmlWidget` rozszerza `RichTextWidget` o jedną dodatkową metodę:

```
class HtmlWidget extends RichTextWidget
{
    proto native void LoadFile(string path);
};
```

Używany przez vanillowy system książek do ładowania plików tekstowych `.html`:

```c
// Z scripts/5_mission/gui/bookmenu.c
HtmlWidget content;
Class.CastTo(content, layoutRoot.FindAnyWidget("HtmlWidget"));
content.LoadFile(book.ConfigGetString("file"));
```

### RichTextWidget vs TextWidget -- Kluczowe różnice

| Funkcja | TextWidget | RichTextWidget |
|---------|-----------|---------------|
| Znaczniki `<image>` inline | Nie | Tak |
| Znaczniki nagłówka `<h>` | Nie | Tak |
| Łamanie linii `</br>` | Nie (użyj `\n`) | Tak |
| Przewijanie treści | Nie | Tak (przez offset) |
| Widoczność linii | Nie | Tak |
| Obcinanie tekstu | Nie | Tak |
| Wydajność | Szybsza | Wolniejsza (parsowanie znaczników) |

Używaj `TextWidget` do prostych etykiet. Używaj `RichTextWidget` tylko gdy potrzebujesz osadzonych obrazów, sformatowanych nagłówków lub przewijania treści.

---

## Rysowanie na CanvasWidget

`CanvasWidget` zapewnia natychmiastowe rysowanie 2D na ekranie. Ma dokładnie dwie natywne metody:

```
// Z scripts/1_core/proto/enwidgets.c
class CanvasWidget extends Widget
{
    proto native void DrawLine(float x1, float y1, float x2, float y2,
                               float width, int color);
    proto native void Clear();
};
```

To całe API. Wszystkie złożone kształty -- prostokąty, okręgi, siatki -- muszą być budowane z segmentów linii.

### Układ współrzędnych

`CanvasWidget` używa **współrzędnych pikseli w przestrzeni ekranu** względem własnych granic widgetu kanwy. Początek `(0, 0)` to lewy górny róg widgetu kanwy.

Jeśli kanwa wypełnia cały ekran (pozycja 0,0 rozmiar 1,1 w trybie relatywnym), współrzędne mapują bezpośrednio na piksele ekranu po przeliczeniu z wewnętrznego rozmiaru widgetu.

### Konfiguracja layoutu

W pliku `.layout`:

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

Kluczowe flagi:
- `ignorepointer 1` -- kanwa nie blokuje wejścia myszy dla widgetów pod nią
- Rozmiar `1 1` w trybie relatywnym oznacza "wypełnij rodzica"

W skrypcie:

```c
CanvasWidget m_Canvas;
m_Canvas = CanvasWidget.Cast(
    root.FindAnyWidget("MyCanvas")
);
```

Lub utwórz z pliku layout:

```c
// Z COT: JM/COT/GUI/layouts/esp_canvas.layout
m_Canvas = CanvasWidget.Cast(
    g_Game.GetWorkspace().CreateWidgets("path/to/canvas.layout")
);
```

### Rysowanie prymitywów

#### Linie

```c
// Narysuj czerwoną linię poziomą
m_Canvas.DrawLine(10, 50, 200, 50, 2, ARGB(255, 255, 0, 0));

// Narysuj białą linię przekątną, 3 piksele szerokości
m_Canvas.DrawLine(0, 0, 100, 100, 3, COLOR_WHITE);
```

Parametr `color` używa formatu ARGB: `ARGB(alfa, czerwony, zielony, niebieski)`.

#### Prostokąty (z linii)

```c
void DrawRectangle(CanvasWidget canvas, float x, float y,
                   float w, float h, float lineWidth, int color)
{
    canvas.DrawLine(x, y, x + w, y, lineWidth, color);         // góra
    canvas.DrawLine(x + w, y, x + w, y + h, lineWidth, color); // prawa
    canvas.DrawLine(x + w, y + h, x, y + h, lineWidth, color); // dół
    canvas.DrawLine(x, y + h, x, y, lineWidth, color);         // lewa
}
```

#### Okręgi (z segmentów linii)

COT implementuje ten wzorzec w `JMESPCanvas`:

```c
// Z DayZ-CommunityOnlineTools/.../JMESPModule.c
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

Więcej segmentów daje gładszy okrąg. 36 segmentów to popularna wartość domyślna.

### Wzorzec przerysowywania co klatkę

`CanvasWidget` działa w trybie natychmiastowym: musisz wywołać `Clear()` i przerysować co klatkę. Zazwyczaj odbywa się to w callbacku `Update()` lub `OnUpdate()`.

Przykład z vanilla, z `scripts/5_mission/gui/mapmenu.c`:

```c
override void Update(float timeslice)
{
    super.Update(timeslice);
    m_ToolsScaleCellSizeCanvas.Clear();  // wyczyść poprzednią klatkę

    // ... rysuj segmenty linijki skali ...
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

### Wzorzec nakładki ESP (z COT)

COT (Community Online Tools) używa `CanvasWidget` jako pełnoekranowej nakładki do rysowania szkieletów postaci i obiektów. Jest to jeden z najbardziej zaawansowanych wzorców użycia kanwy w jakimkolwiek modzie DayZ.

**Architektura:**

1. Pełnoekranowy `CanvasWidget` jest tworzony z pliku layout
2. Co klatkę wywoływane jest `Clear()`
3. Pozycje w przestrzeni świata są konwertowane na współrzędne ekranowe
4. Linie są rysowane między pozycjami kości, aby renderować szkielety

**Konwersja świat-ekran** (z `JMESPCanvas` COT):

```c
// Z DayZ-CommunityOnlineTools/.../JMESPModule.c
vector TransformToScreenPos(vector worldPos, out bool isInBounds)
{
    float parentW, parentH;
    vector screenPos;

    // Pobierz relatywną pozycję ekranową (zakres 0..1)
    screenPos = g_Game.GetScreenPosRelative(worldPos);

    // Sprawdź, czy pozycja jest widoczna na ekranie
    isInBounds = screenPos[0] >= 0 && screenPos[0] <= 1
              && screenPos[1] >= 0 && screenPos[1] <= 1
              && screenPos[2] >= 0;

    // Skonwertuj na współrzędne pikseli kanwy
    m_Canvas.GetScreenSize(parentW, parentH);
    screenPos[0] = screenPos[0] * parentW;
    screenPos[1] = screenPos[1] * parentH;

    return screenPos;
}
```

**Rysowanie linii z pozycji świata A do pozycji świata B:**

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

**Rysowanie szkieletu gracza:**

```c
// Uproszczone z COT JMESPSkeleton.Draw()
static void DrawSkeleton(Human human, CanvasWidget canvas)
{
    // Zdefiniuj połączenia kończyn (pary kości)
    // kark->kręgosłup3, kręgosłup3->miednica, kark->leweramię itp.

    int color = COLOR_WHITE;
    switch (human.GetHealthLevel())
    {
        case GameConstants.STATE_DAMAGED:
            color = 0xFFDCDC00;  // żółty
            break;
        case GameConstants.STATE_BADLY_DAMAGED:
            color = 0xFFDC0000;  // czerwony
            break;
    }

    // Rysuj każdą kończynę jako linię między dwoma pozycjami kości
    vector bone1Pos = human.GetBonePositionWS(
        human.GetBoneIndexByName("neck")
    );
    vector bone2Pos = human.GetBonePositionWS(
        human.GetBoneIndexByName("spine3")
    );
    // ... skonwertuj na współrzędne ekranowe, potem DrawLine ...
}
```

### Kanwa debugowania vanilla

Silnik zapewnia wbudowaną kanwę debugowania przez klasę `Debug`:

```c
// Z scripts/3_game/tools/debug.c
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

### Kwestie wydajności

- **Czyść i przerysowuj co klatkę.** `CanvasWidget` nie zachowuje stanu między klatkami w większości przypadków, gdzie widok się zmienia (ruch kamery itp.). Wywołuj `Clear()` na początku każdej aktualizacji.
- **Minimalizuj liczbę linii.** Każde wywołanie `DrawLine()` ma narzut. Dla złożonych kształtów jak okręgi, używaj mniejszej liczby segmentów (12-18) dla odległych obiektów, więcej (36) dla bliskich.
- **Sprawdzaj granice ekranu najpierw.** Konwertuj pozycje świata na współrzędne ekranowe i pomijaj obiekty poza ekranem lub za kamerą (`screenPos[2] < 0`).
- **Używaj `ignorepointer 1`.** Zawsze ustawiaj tę flagę na nakładkach kanwy, aby nie przechwytywały zdarzeń myszy.
- **Jedna kanwa wystarczy.** Używaj jednej pełnoekranowej kanwy do całego rysowania nakładki zamiast tworzyć wiele widgetów kanwy.

---

## MapWidget

`MapWidget` wyświetla mapę terenu DayZ i zapewnia metody do umieszczania znaczników, konwersji współrzędnych i kontroli powiększenia.

### Definicja klasy

```
// Z scripts/3_game/gameplay.c
class MapWidget: Widget
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

### Uzyskiwanie widgetu mapy

W pliku `.layout` umieść mapę używając typu `MapWidgetClass`. W skrypcie uzyskaj referencję przez rzutowanie:

```c
MapWidget m_Map;
m_Map = MapWidget.Cast(layoutRoot.FindAnyWidget("Map"));
```

### Współrzędne mapy vs współrzędne świata

DayZ używa dwóch przestrzeni współrzędnych:

- **Współrzędne świata**: wektory 3D w metrach. `x` = wschód/zachód, `y` = wysokość, `z` = północ/południe. Chernarus obejmuje zakres mniej więcej 0-15360 na osiach x i z.
- **Współrzędne ekranowe**: pozycje pikseli na widgecie mapy. Zmieniają się w miarę przesuwania i powiększania przez użytkownika.

`MapWidget` zapewnia konwersję między nimi:

```c
// Pozycja świata na piksel ekranu na mapie
vector screenPos = m_Map.MapToScreen(worldPosition);

// Piksel ekranu na mapie na pozycję świata
vector worldPos = m_Map.ScreenToMap(Vector(screenX, screenY, 0));
```

### Dodawanie znaczników

`AddUserMark()` umieszcza znacznik na pozycji świata z etykietą, kolorem i teksturą ikony:

```c
m_Map.AddUserMark(
    playerPos,                                   // vector: pozycja świata
    "You",                                       // string: tekst etykiety
    COLOR_RED,                                   // int: kolor ARGB
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"  // string: tekstura ikony
);
```

Przykład z vanilla, z `scripts/5_mission/gui/scriptconsolegeneraltab.c`:

```c
// Oznacz pozycję gracza
m_DebugMapWidget.AddUserMark(
    playerPos, "You", COLOR_RED,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);

// Oznacz innych graczy
m_DebugMapWidget.AddUserMark(
    rpd.m_Pos, rpd.m_Name + " " + dist + "m", COLOR_BLUE,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);

// Oznacz pozycję kamery
m_DebugMapWidget.AddUserMark(
    cameraPos, "Camera", COLOR_GREEN,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);
```

Inny przykład z vanilla, z `scripts/5_mission/gui/mapmenu.c` (zakomentowany, ale pokazuje API):

```c
m.AddUserMark("2681 4.7 1751", "Label1", ARGB(255,255,0,0),
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa");
m.AddUserMark("2683 4.7 1851", "Label2", ARGB(255,0,255,0),
    "\\dz\\gear\\navigation\\data\\map_bunker_ca.paa");
m.AddUserMark("2670 4.7 1651", "Label3", ARGB(255,0,0,255),
    "\\dz\\gear\\navigation\\data\\map_busstop_ca.paa");
```

### Usuwanie znaczników

`ClearUserMarks()` usuwa wszystkie znaczniki użytkownika na raz. Nie istnieje metoda usuwania pojedynczego znacznika po referencji. Standardowy wzorzec to wyczyszczenie wszystkich znaczników i ponowne dodanie tych, które chcesz, co klatkę.

```c
// Z scripts/5_mission/gui/scriptconsolesoundstab.c
override void Update(float timeslice)
{
    m_DebugMapWidget.ClearUserMarks();
    // Ponownie dodaj wszystkie aktualne znaczniki
    m_DebugMapWidget.AddUserMark(playerPos, "You", COLOR_RED, iconPath);
}
```

### Dostępne ikony znaczników mapy

Gra vanilla rejestruje te tekstury ikon znaczników w `scripts/5_mission/gui/mapmarkersinfo.c`:

| Stała enum | Ścieżka tekstury |
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

Dostęp do nich przez enum: `MapMarkerTypes.GetMarkerTypeFromID(eMapMarkerTypes.MARKERTYPE_MAP_CAMP)`.

### Kontrola powiększenia i przesuwania

```c
// Ustaw centrum mapy na pozycję świata
m_Map.SetMapPos(playerWorldPos);

// Pobierz/ustaw poziom powiększenia (0.0 = pełne oddalenie, 1.0 = pełne przybliżenie)
float currentScale = m_Map.GetScale();
m_Map.SetScale(0.33);  // umiarkowany poziom powiększenia

// Pobierz informacje o mapie
float contourInterval = m_Map.GetContourInterval();  // metry między warstwicami
float cellSize = m_Map.GetCellSize(legendWidth);      // rozmiar komórki dla linijki skali
```

### Obsługa kliknięć na mapie

Obsłuż kliknięcia myszy na mapie przez callbacki `OnDoubleClick` lub `OnMouseButtonDown` na `ScriptedWidgetEventHandler` lub `UIScriptedMenu`. Skonwertuj pozycję kliknięcia na współrzędne świata używając `ScreenToMap()`.

Przykład z vanilla, z `scripts/5_mission/gui/scriptconsolegeneraltab.c`:

```c
override bool OnDoubleClick(Widget w, int x, int y, int button)
{
    super.OnDoubleClick(w, x, y, button);

    if (w == m_DebugMapWidget)
    {
        // Skonwertuj kliknięcie ekranowe na współrzędne świata
        vector worldPos = m_DebugMapWidget.ScreenToMap(Vector(x, y, 0));

        // Pobierz wysokość terenu w tej pozycji
        float surfaceY = g_Game.SurfaceY(worldPos[0], worldPos[2]);
        float roadY = g_Game.SurfaceRoadY(worldPos[0], worldPos[2]);
        worldPos[1] = Math.Max(surfaceY, roadY);

        // Użyj pozycji świata (np. teleportuj gracza)
    }
    return false;
}
```

Z `scripts/5_mission/gui/maphandler.c`:

```c
class MapHandler : ScriptedWidgetEventHandler
{
    override bool OnDoubleClick(Widget w, int x, int y, int button)
    {
        vector worldPos = MapWidget.Cast(w).ScreenToMap(Vector(x, y, 0));
        // Umieść znacznik, teleportuj itp.
        return true;
    }
}
```

### System znaczników mapy Expansion

Mod Expansion buduje pełny system znaczników na bazie vanillowego `MapWidget`. Kluczowe wzorce:

- Utrzymuje oddzielne słowniki dla osobistych, serwerowych, drużynowych i gracza znaczników
- Limituje aktualizacje znaczników co klatkę (`m_MaxMarkerUpdatesPerFrame = 3`) dla wydajności
- Rysuje linie linijki skali używając `CanvasWidget` obok mapy
- Używa niestandardowych nakładek widgetów znaczników pozycjonowanych przez `MapToScreen()` dla bogatszych wizualizacji znaczników niż obsługuje `AddUserMark()`

To podejście pokazuje, że dla złożonych interfejsów znaczników (ikony z tooltipami, edytowalne etykiety, kolorowe kategorie), powinieneś nakładać niestandardowe widgety pozycjonowane przez `MapToScreen()` zamiast polegać wyłącznie na `AddUserMark()`.

---

## ItemPreviewWidget

`ItemPreviewWidget` renderuje podgląd 3D dowolnego `EntityAI` (przedmiot, broń, pojazd) wewnątrz panelu UI.

### Definicja klasy

```
// Z scripts/3_game/gameplay.c
class ItemPreviewWidget: Widget
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

### Indeksy widoków

Parametr `viewIndex` wybiera, która ramka ograniczająca i kąt kamery mają być użyte. Są one definiowane per przedmiot w konfiguracji przedmiotu:

- Widok 0: domyślny (`boundingbox_min` + `boundingbox_max` + `invView`)
- Widok 1: alternatywny (`boundingbox_min2` + `boundingbox_max2` + `invView2`)
- Widok 2+: dodatkowe widoki, jeśli zdefiniowane

Użyj `item.GetViewIndex()`, aby uzyskać preferowany widok przedmiotu.

### Wzorzec użycia -- Inspekcja przedmiotu

Z `scripts/5_mission/gui/inspectmenunew.c`:

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

### Kontrola obracania (przeciąganie myszą)

Standardowy wzorzec interaktywnego obracania:

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
    o[0] = o[0] + (m_RotationY - mouse_y);  // pitch
    o[1] = o[1] - (m_RotationX - mouse_x);  // yaw
    m_item_widget.SetModelOrientation(o);

    if (!is_dragging)
        m_Orientation = o;
}
```

### Kontrola powiększenia (kółko myszy)

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

`PlayerPreviewWidget` renderuje pełny model postaci gracza 3D w UI, razem z wyposażonymi przedmiotami i animacjami.

### Definicja klasy

```
// Z scripts/3_game/gameplay.c
class PlayerPreviewWidget: Widget
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

### Wzorzec użycia -- Podgląd postaci w inwentarzu

Z `scripts/5_mission/gui/inventorynew/playerpreview.c`:

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

### Aktualizacja wyposażenia

Metoda `UpdateInterval()` utrzymuje podgląd zsynchronizowany z rzeczywistym wyposażeniem gracza:

```c
override void UpdateInterval()
{
    // Zaktualizuj trzymany przedmiot
    m_CharacterPanelWidget.UpdateItemInHands(
        g_Game.GetPlayer().GetEntityInHands()
    );

    // Dostęp do gracza-manekina do synchronizacji animacji
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

### Obracanie i powiększanie

Wzorce obracania i powiększania są identyczne z `ItemPreviewWidget` -- użyj `SetModelOrientation()` z przeciąganiem myszą i `SetSize()` z kółkiem myszy. Zobacz poprzednią sekcję dla pełnego kodu.

---

## VideoWidget

`VideoWidget` odtwarza pliki wideo w UI. Obsługuje kontrolę odtwarzania, zapętlanie, przewijanie, zapytania o stan, napisy i callbacki zdarzeń.

### Definicja klasy

```
// Z scripts/1_core/proto/enwidgets.c
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

### Wzorzec użycia -- Wideo w menu

Z `scripts/5_mission/gui/newui/mainmenu/mainmenuvideo.c`:

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

    // Zarejestruj callback na zakończenie wideo
    m_Video.SetCallback(VideoCallback.ON_END, StopVideo);

    return layoutRoot;
}

void StopVideo()
{
    // Obsłuż zakończenie wideo
    Close();
}
```

### Napisy

Napisy wymagają czcionki przypisanej do `VideoWidget` w layoucie. Pliki napisów używają konwencji nazewnictwa `videoName_Language.srt`, z angielską wersją nazwaną `videoName.srt` (bez przyrostka języka).

```c
// Napisy są domyślnie włączone
m_Video.DisableSubtitles(false);  // jawne włączenie
```

### Wartości zwracane

Metody `Load()`, `Play()`, `Pause()` i `Stop()` zwracają `bool`, ale ta wartość zwracana jest **przestarzała**. Używaj `VideoCallback.ON_ERROR` do wykrywania niepowodzeń.

---

## RenderTargetWidget i RTTextureWidget

Te widgety umożliwiają renderowanie widoku świata 3D do widgetu UI.

### Definicje klas

```
// Z scripts/1_core/proto/enwidgets.c
class RenderTargetWidget extends Widget
{
    proto native void SetRefresh(int period, int offset);
    proto native void SetResolutionScale(float xscale, float yscale);
};

class RTTextureWidget extends Widget
{
    // Brak dodatkowych metod -- służy jako cel tekstury dla widgetów potomnych
};
```

Funkcja globalna `SetWidgetWorld` wiąże cel renderowania ze światem i kamerą:

```
proto native void SetWidgetWorld(
    RenderTargetWidget w,
    IEntity worldEntity,
    int camera
);
```

### RenderTargetWidget

Renderuje widok kamery z `BaseWorld` do obszaru widgetu. Używany do kamer bezpieczeństwa, lusterek wstecznych lub wyświetlaczy obraz-w-obrazie.

Z `scripts/2_gamelib/entities/rendertarget.c`:

```c
// Utwórz cel renderowania programowo
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

// Powiąż ze światem gry z indeksem kamery 0
SetWidgetWorld(m_RenderWidget, g_Game.GetWorldEntity(), 0);
```

**Kontrola odświeżania:**

```c
// Renderuj co 2-gą klatkę (period=2, offset=0)
m_RenderWidget.SetRefresh(2, 0);

// Renderuj w połowie rozdzielczości dla wydajności
m_RenderWidget.SetResolutionScale(0.5, 0.5);
```

### RTTextureWidget

`RTTextureWidget` nie ma metod po stronie skryptu poza odziedziczonymi z `Widget`. Służy jako cel tekstury renderowania, do którego mogą być renderowane widgety potomne. `ImageWidget` może odwoływać się do `RTTextureWidget` jako źródła tekstury przez `SetImageTexture()`:

```c
ImageWidget imgWidget;
RTTextureWidget rtTexture;
imgWidget.SetImageTexture(0, rtTexture);
```

---

## Najlepsze praktyki

1. **Używaj odpowiedniego widgetu do zadania.** `TextWidget` do prostych etykiet, `RichTextWidget` tylko gdy potrzebujesz osadzonych obrazów lub sformatowanej treści. `CanvasWidget` do dynamicznych nakładek 2D, nie statycznej grafiki (do tego użyj `ImageWidget`).

2. **Czyść kanwę co klatkę.** Zawsze wywołuj `Clear()` przed przerysowaniem. Brak czyszczenia powoduje kumulację rysunków i artefakty wizualne.

3. **Sprawdzaj granice ekranu przy rysowaniu ESP/nakładki.** Przed wywołaniem `DrawLine()` upewnij się, że oba punkty końcowe są na ekranie. Rysowanie poza ekranem to zmarnowana praca.

4. **Znaczniki mapy: wzorzec wyczyść-i-odbuduj.** Nie istnieje metoda `RemoveUserMark()`. Wywołuj `ClearUserMarks()`, a następnie dodawaj ponownie wszystkie aktywne znaczniki przy każdej aktualizacji. Ten wzorzec jest używany przez każdą implementację vanilla i modów.

5. **ItemPreviewWidget wymaga prawdziwego EntityAI.** Nie możesz podglądać ciągu nazwy klasy -- potrzebujesz referencji do utworzonej encji. Dla podglądów inwentarza użyj rzeczywistego przedmiotu z inwentarza.

6. **PlayerPreviewWidget posiada gracza-manekina.** Widget tworzy wewnętrznego gracza-manekina `DayZPlayer`. Uzyskaj do niego dostęp przez `GetDummyPlayer()` do synchronizacji animacji, ale nie niszcz go samodzielnie.

7. **VideoWidget: używaj callbacków, nie wartości zwracanych.** Wartości bool zwracane przez `Load()`, `Play()` itp. są przestarzałe. Używaj `SetCallback(VideoCallback.ON_ERROR, handler)`.

8. **Wydajność RenderTargetWidget.** Używaj `SetRefresh()` z okresem > 1, aby pomijać klatki. Używaj `SetResolutionScale()`, aby zmniejszyć rozdzielczość. Te widgety są kosztowne -- używaj oszczędnie.

---

## Zaobserwowane w prawdziwych modach

| Mod | Widget | Użycie |
|-----|--------|-------|
| **COT** | `CanvasWidget` | Pełnoekranowa nakładka ESP z rysowaniem szkieletów, projekcją świat-ekran, prymitywami okręgów i linii |
| **COT** | `MapWidget` | Teleportacja administratora przez `ScreenToMap()` po podwójnym kliknięciu |
| **Expansion** | `MapWidget` | Niestandardowy system znaczników z kategoriami osobistymi/serwerowymi/drużynowymi, ograniczanie aktualizacji co klatkę |
| **Expansion** | `CanvasWidget` | Rysowanie linijki skali mapy obok `MapWidget` |
| **Vanilla Map** | `MapWidget` + `CanvasWidget` | Linijka skali renderowana z naprzemiennymi czarno-szarymi segmentami linii |
| **Vanilla Inspect** | `ItemPreviewWidget` | Inspekcja przedmiotu 3D z obracaniem przeciąganiem i powiększaniem kółkiem |
| **Vanilla Inventory** | `PlayerPreviewWidget` | Podgląd postaci z synchronizacją wyposażenia i animacjami obrażeń |
| **Vanilla Hints** | `RichTextWidget` | Panel podpowiedzi w grze ze sformatowanym tekstem opisu |
| **Vanilla Menus** | `RichTextWidget` | Ikony przycisków kontrolera przez `InputUtils.GetRichtextButtonIconFromInputAction()` |
| **Vanilla Books** | `HtmlWidget` | Ładowanie i stronicowanie plików tekstowych `.html` |
| **Vanilla Main Menu** | `VideoWidget` | Wideo wprowadzające z callbackiem zakończenia |
| **Vanilla Render Target** | `RenderTargetWidget` | Renderowanie kamery-do-widgetu z konfigurowalną częstotliwością odświeżania |

---

## Częste błędy

**1. Używanie RichTextWidget tam, gdzie wystarczy TextWidget.**
Parsowanie tekstu sformatowanego ma narzut. Jeśli potrzebujesz tylko zwykłego tekstu, użyj `TextWidget`.

**2. Zapomnienie o Clear() kanwy.**
```c
// ŹLE - rysunki się kumulują, wypełniając ekran
void Update(float dt)
{
    m_Canvas.DrawLine(0, 0, 100, 100, 1, COLOR_RED);
}

// DOBRZE
void Update(float dt)
{
    m_Canvas.Clear();
    m_Canvas.DrawLine(0, 0, 100, 100, 1, COLOR_RED);
}
```

**3. Rysowanie za kamerą.**
```c
// ŹLE - rysuje linie do obiektów za tobą
vector screenPos = g_Game.GetScreenPosRelative(worldPos);
// Brak sprawdzenia granic!

// DOBRZE
vector screenPos = g_Game.GetScreenPosRelative(worldPos);
if (screenPos[2] < 0)
    return;  // za kamerą
if (screenPos[0] < 0 || screenPos[0] > 1 || screenPos[1] < 0 || screenPos[1] > 1)
    return;  // poza ekranem
```

**4. Próba usunięcia pojedynczego znacznika mapy.**
Nie istnieje `RemoveUserMark()`. Musisz wywołać `ClearUserMarks()` i ponownie dodać wszystkie znaczniki, które chcesz zachować.

**5. Ustawianie przedmiotu ItemPreviewWidget na null bez sprawdzenia.**
Zawsze zabezpiecz się przed referencjami null encji przed wywołaniem `SetItem()`.

**6. Brak ustawienia ignorepointer na kanwach nakładki.**
Kanwa bez `ignorepointer 1` przechwyci wszystkie zdarzenia myszy, czyniąc UI pod nią nieresponsywnym.

**7. Używanie ukośników odwrotnych w ścieżkach tekstur bez podwojenia.**
W ciągach znaków Enforce Script ukośniki odwrotne muszą być podwojone:
```c
// ŹLE
"\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
// To jest w rzeczywistości DOBRZE w Enforce Script -- każde \\ daje jeden \
```

---

## Kompatybilność i wpływ

| Widget | Tylko klient | Koszt wydajności | Kompatybilność z modami |
|--------|------------|-----------------|-------------------|
| `RichTextWidget` | Tak | Niski (parsowanie znaczników) | Bezpieczny, bez konfliktów |
| `CanvasWidget` | Tak | Średni (co klatkę) | Bezpieczny jeśli ustawiono `ignorepointer` |
| `MapWidget` | Tak | Niski-Średni | Wiele modów może dodawać znaczniki |
| `ItemPreviewWidget` | Tak | Średni (renderowanie 3D) | Bezpieczny, zasięg widgetu |
| `PlayerPreviewWidget` | Tak | Średni (renderowanie 3D) | Bezpieczny, tworzy gracza-manekina |
| `VideoWidget` | Tak | Wysoki (dekodowanie wideo) | Jedno wideo na raz |
| `RenderTargetWidget` | Tak | Wysoki (renderowanie 3D) | Możliwe konflikty kamer |
| `RTTextureWidget` | Tak | Niski (cel tekstury) | Bezpieczny |

Wszystkie te widgety działają wyłącznie po stronie klienta. Nie mają reprezentacji po stronie serwera i nie mogą być tworzone ani manipulowane z poziomu skryptów serwerowych.

---

## Podsumowanie

| Widget | Główne zastosowanie | Kluczowe metody |
|--------|-----------|-------------|
| `RichTextWidget` | Sformatowany tekst z osadzonymi obrazami | `SetText()`, `GetContentHeight()`, `SetContentOffset()` |
| `HtmlWidget` | Ładowanie sformatowanych plików tekstowych | `LoadFile()` |
| `CanvasWidget` | Nakładka rysowania 2D | `DrawLine()`, `Clear()` |
| `MapWidget` | Mapa terenu ze znacznikami | `AddUserMark()`, `ClearUserMarks()`, `ScreenToMap()`, `MapToScreen()` |
| `ItemPreviewWidget` | Wyświetlanie przedmiotu 3D | `SetItem()`, `SetView()`, `SetModelOrientation()` |
| `PlayerPreviewWidget` | Wyświetlanie postaci gracza 3D | `SetPlayer()`, `Refresh()`, `UpdateItemInHands()` |
| `VideoWidget` | Odtwarzanie wideo | `Load()`, `Play()`, `Pause()`, `SetCallback()` |
| `RenderTargetWidget` | Widok kamery 3D w czasie rzeczywistym | `SetRefresh()`, `SetResolutionScale()` + `SetWidgetWorld()` |
| `RTTextureWidget` | Cel renderowania do tekstury | Służy jako źródło tekstury dla `ImageWidget.SetImageTexture()` |

---

*Ten rozdział kończy sekcję systemu GUI. Wszystkie sygnatury API i wzorce są potwierdzone z vanillowych skryptów DayZ i kodu źródłowego prawdziwych modów.*
