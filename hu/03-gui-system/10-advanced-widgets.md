# 3.10. fejezet: Haladó widgetek

[Főoldal](../README.md) | [<< Előző: Valós mod UI minták](09-real-mod-patterns.md) | **Haladó widgetek**

---

A korábbi fejezetekben tárgyalt standard konténer-, szöveg- és kép widgeteken túl a DayZ speciális widget típusokat kínál formázott szöveges megjelenítéshez, 2D vászon rajzoláshoz, térkép megjelenítéshez, 3D tárgy előnézetekhez, videó lejátszáshoz és render-to-texture funkcióhoz. Ezek a widgetek olyan képességeket nyitnak meg, amelyeket egyszerű layoutokkal nem lehet elérni.

Ez a fejezet minden haladó widget típust lefed, megerősített API szignatúrákkal, amelyeket a vanilla forráskódból és valós mod használatból nyertünk ki.

---

## RichTextWidget formázás

A `RichTextWidget` kiterjeszti a `TextWidget`-et és támogatja az inline jelölő tageket a szöveges tartalmán belül. Ez az elsődleges módja a formázott szöveg megjelenítésének beágyazott képekkel, változó betűméretekkel és sortörésekkel.

### Osztálydefiníció

```
// Forrás: scripts/1_core/proto/enwidgets.c
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

A `RichTextWidget` örökli az összes `TextWidget` metódust -- `SetText()`, `SetTextExactSize()`, `SetOutline()`, `SetShadow()`, `SetTextFormat()` és a többit. A lényeges különbség az, hogy a `SetText()` egy `RichTextWidget`-en elemzi az inline jelölő tageket.

### Támogatott inline tagek

Ezek a tagek a vanilla DayZ használatán keresztül vannak megerősítve a `news_feed.txt`, `InputUtils.c` és több menü scriptben.

#### Inline kép

```
<image set="IMAGESET_NAME" name="IMAGE_NAME" />
<image set="IMAGESET_NAME" name="IMAGE_NAME" scale="1.5" />
```

Egy képet ágyaz be egy megnevezett képkészletből közvetlenül a szövegfolyamba. A `scale` attribútum a kép méretét szabályozza a szöveg sormagasságához képest.

Vanilla példa a `scripts/data/news_feed.txt` fájlból:
```
<image set="dayz_gui" name="icon_pin" />  Welcome to DayZ!
```

Vanilla példa a `scripts/3_game/tools/inpututils.c` fájlból -- kontroller gomb ikonok építése:
```c
string icon = string.Format(
    "<image set=\"%1\" name=\"%2\" scale=\"%3\" />",
    imageSetName,
    iconName,
    1.21
);
richTextWidget.SetText(icon + " Press to confirm");
```

Gyakori képkészletek a vanilla DayZ-ben:
- `dayz_gui` -- általános UI ikonok (tű, értesítések)
- `dayz_inventory` -- felszerelés slot ikonok (shoulderleft, hands, vest, stb.)
- `xbox_buttons` -- Xbox kontroller gomb képek (A, B, X, Y)
- `playstation_buttons` -- PlayStation kontroller gomb képek

#### Sortörés

```
</br>
```

Sortörést kényszerít a formázott szöveg tartalmon belül. Figyeld meg a záró-tag szintaxist -- a DayZ elemzője így várja.

#### Betűméret / Címsor

```
<h scale="0.8">Szöveges tartalom itt</h>
<h scale="0.6">Kisebb szöveges tartalom</h>
```

A szöveget egy címsor blokkba csomagolja egy skálázási szorzóval. A `scale` attribútum egy lebegőpontos szám, amely a betűméretet a widget alap betűtípusához képest szabályozza. Nagyobb értékek nagyobb szöveget eredményeznek.

Vanilla példa a `scripts/data/news_feed.txt` fájlból:
```
<h scale="0.8">
<image set="dayz_gui" name="icon_pin" />  Section Title
</h>
<h scale="0.6">
Body text at smaller size goes here.
</h>
</br>
```

### Gyakorlati használati minták

#### RichTextWidget referencia lekérése

Scriptben pontosan úgy castolj a layoutból, mint bármely más widgetet:

```c
RichTextWidget m_Label;
m_Label = RichTextWidget.Cast(root.FindAnyWidget("MyRichLabel"));
```

`.layout` fájlokban használd a layout osztálynevet:

```
RichTextWidgetClass MyRichLabel {
    position 0 0
    size 1 0.1
    text ""
}
```

#### Formázott tartalom beállítása kontroller ikonokkal

A vanilla `InputUtils` osztály egy segédfüggvényt biztosít, amely a `<image>` tag stringet generálja bármely beviteli akcióhoz:

```c
// Forrás: scripts/3_game/tools/inpututils.c
string buttonIcon = InputUtils.GetRichtextButtonIconFromInputAction(
    "UAUISelect",              // beviteli akció neve
    "#menu_select",            // lokalizált címke
    EUAINPUT_DEVICE_CONTROLLER,
    InputUtils.ICON_SCALE_TOOLBAR  // 1.81 skála
);
// Eredmény: '<image set="xbox_buttons" name="A" scale="1.81" /> Select'

RichTextWidget toolbar = RichTextWidget.Cast(
    layoutRoot.FindAnyWidget("ToolbarText")
);
toolbar.SetText(buttonIcon);
```

A két előre definiált skála konstans:
- `InputUtils.ICON_SCALE_NORMAL` = 1.21
- `InputUtils.ICON_SCALE_TOOLBAR` = 1.81

#### Görgethető formázott szöveg tartalom

A `RichTextWidget` tartalom magasság és eltolás metódusokat tesz elérhetővé lapozáshoz vagy görgetéshez:

```c
// Forrás: scripts/5_mission/gui/bookmenu.c
HtmlWidget m_content;  // A HtmlWidget kiterjeszti a RichTextWidget-et
m_content.LoadFile(book.ConfigGetString("file"));

float totalHeight = m_content.GetContentHeight();
// Lapozás a tartalomban:
m_content.SetContentOffset(pageOffset, true);  // snapToLine = true
```

#### Szöveg levágás

Amikor a szöveg túlcsordul egy rögzített szélességű területen, levághatod (csonkíthatod jelzővel):

```c
// A 0. sor csonkítása maxWidth pixelre, "..." hozzáfűzésével
richText.ElideText(0, maxWidth, "...");
```

#### Sor láthatóság vezérlés

Specifikus sortartományok megjelenítése vagy elrejtése a tartalmon belül:

```c
int lineCount = richText.GetNumLines();
// Az 5. után minden sor elrejtése
richText.SetLinesVisibility(5, lineCount - 1, false);
// Egy specifikus sor pixel szélességének lekérése
float width = richText.GetLineWidth(2);
```

### HtmlWidget -- Kiterjesztett RichTextWidget

A `HtmlWidget` kiterjeszti a `RichTextWidget`-et egyetlen további metódussal:

```
class HtmlWidget extends RichTextWidget
{
    proto native void LoadFile(string path);
};
```

A vanilla könyvrendszer használja `.html` szövegfájlok betöltéséhez:

```c
// Forrás: scripts/5_mission/gui/bookmenu.c
HtmlWidget content;
Class.CastTo(content, layoutRoot.FindAnyWidget("HtmlWidget"));
content.LoadFile(book.ConfigGetString("file"));
```

### RichTextWidget vs TextWidget -- Főbb különbségek

| Funkció | TextWidget | RichTextWidget |
|---------|-----------|---------------|
| Inline `<image>` tagek | Nem | Igen |
| `<h>` címsor tagek | Nem | Igen |
| `</br>` sortörések | Nem (használj `\n`-t) | Igen |
| Tartalom görgetés | Nem | Igen (eltolással) |
| Sor láthatóság | Nem | Igen |
| Szöveg levágás | Nem | Igen |
| Teljesítmény | Gyorsabb | Lassabb (tag elemzés) |

Használj `TextWidget`-et egyszerű címkékhez. Használj `RichTextWidget`-et csak akkor, ha inline képekre, formázott címsorokra vagy tartalom görgetésre van szükséged.

---

## CanvasWidget rajzolás

A `CanvasWidget` azonnali módú 2D rajzolást biztosít a képernyőn. Pontosan két natív metódusa van:

```
// Forrás: scripts/1_core/proto/enwidgets.c
class CanvasWidget extends Widget
{
    proto native void DrawLine(float x1, float y1, float x2, float y2,
                               float width, int color);
    proto native void Clear();
};
```

Ez az egész API. Minden összetett alakzatot -- téglalapokat, köröket, rácsokat -- vonalszegmensekből kell felépíteni.

### Koordinátarendszer

A `CanvasWidget` **képernyő-tér pixel koordinátákat** használ a vászon widget saját határaihoz képest. Az origó `(0, 0)` a vászon widget bal felső sarka.

Ha a vászon kitölti a teljes képernyőt (pozíció 0,0 méret 1,1 relatív módban), akkor a koordináták közvetlenül a képernyő pixelekre térképeződnek a widget belső méretéből való átalakítás után.

### Layout beállítás

Egy `.layout` fájlban:

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

Fontos jelzők:
- `ignorepointer 1` -- a vászon nem blokkolja az egér bemenetet az alatta lévő widgetekhez
- Az `1 1` méret relatív módban azt jelenti, hogy "töltsd ki a szülőt"

Scriptben:

```c
CanvasWidget m_Canvas;
m_Canvas = CanvasWidget.Cast(
    root.FindAnyWidget("MyCanvas")
);
```

Vagy hozd létre egy layout fájlból:

```c
// Forrás: COT: JM/COT/GUI/layouts/esp_canvas.layout
m_Canvas = CanvasWidget.Cast(
    g_Game.GetWorkspace().CreateWidgets("path/to/canvas.layout")
);
```

### Rajzolási primitívek

#### Vonalak

```c
// Piros vízszintes vonal rajzolása
m_Canvas.DrawLine(10, 50, 200, 50, 2, ARGB(255, 255, 0, 0));

// Fehér átlós vonal rajzolása, 3 pixel széles
m_Canvas.DrawLine(0, 0, 100, 100, 3, COLOR_WHITE);
```

A `color` paraméter ARGB formátumot használ: `ARGB(alfa, piros, zöld, kék)`.

#### Téglalapok (vonalakból)

```c
void DrawRectangle(CanvasWidget canvas, float x, float y,
                   float w, float h, float lineWidth, int color)
{
    canvas.DrawLine(x, y, x + w, y, lineWidth, color);         // felső
    canvas.DrawLine(x + w, y, x + w, y + h, lineWidth, color); // jobb
    canvas.DrawLine(x + w, y + h, x, y + h, lineWidth, color); // alsó
    canvas.DrawLine(x, y + h, x, y, lineWidth, color);         // bal
}
```

#### Körök (vonalszegmensekből)

A COT implementálja ezt a mintát a `JMESPCanvas`-ban:

```c
// Forrás: DayZ-CommunityOnlineTools/.../JMESPModule.c
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

Több szegmens simább kört eredményez. 36 szegmens egy gyakori alapértelmezés.

### Képkockánkénti újrarajzolási minta

A `CanvasWidget` azonnali módú: minden képkockánál `Clear()`-elni és újra kell rajzolni. Ezt jellemzően egy `Update()` vagy `OnUpdate()` callbackben végzik.

Vanilla példa a `scripts/5_mission/gui/mapmenu.c` fájlból:

```c
override void Update(float timeslice)
{
    super.Update(timeslice);
    m_ToolsScaleCellSizeCanvas.Clear();  // előző képkocka törlése

    // ... skála vonalzó szegmensek rajzolása ...
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

### ESP overlay minta (a COT-ból)

A COT (Community Online Tools) a `CanvasWidget`-et teljes képernyős overlayként használja csontváz drótvázak rajzolásához játékosokon és objektumokon. Ez az egyik legkifinomultabb vászon használati minta bármely DayZ modban.

**Architektúra:**

1. Egy teljes képernyős `CanvasWidget` jön létre egy layout fájlból
2. Minden képkockánál meghívódik a `Clear()`
3. A világ-tér pozíciók képernyő koordinátákká alakulnak
4. Vonalak rajzolódnak a csont pozíciók közé a csontvázak megjelenítéséhez

**Világ-képernyő átalakítás** (a COT `JMESPCanvas`-ából):

```c
// Forrás: DayZ-CommunityOnlineTools/.../JMESPModule.c
vector TransformToScreenPos(vector worldPos, out bool isInBounds)
{
    float parentW, parentH;
    vector screenPos;

    // Relatív képernyő pozíció lekérése (0..1 tartomány)
    screenPos = g_Game.GetScreenPosRelative(worldPos);

    // Ellenőrzés, hogy a pozíció látható-e a képernyőn
    isInBounds = screenPos[0] >= 0 && screenPos[0] <= 1
              && screenPos[1] >= 0 && screenPos[1] <= 1
              && screenPos[2] >= 0;

    // Átalakítás vászon pixel koordinátákra
    m_Canvas.GetScreenSize(parentW, parentH);
    screenPos[0] = screenPos[0] * parentW;
    screenPos[1] = screenPos[1] * parentH;

    return screenPos;
}
```

**Vonal rajzolása A világ pozícióból B világ pozícióba:**

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

**Játékos csontváz rajzolása:**

```c
// Egyszerűsítve a COT JMESPSkeleton.Draw() metódusából
static void DrawSkeleton(Human human, CanvasWidget canvas)
{
    // Végtag csatlakozások definiálása (csont párok)
    // neck->spine3, spine3->pelvis, neck->leftarm, stb.

    int color = COLOR_WHITE;
    switch (human.GetHealthLevel())
    {
        case GameConstants.STATE_DAMAGED:
            color = 0xFFDCDC00;  // sárga
            break;
        case GameConstants.STATE_BADLY_DAMAGED:
            color = 0xFFDC0000;  // piros
            break;
    }

    // Minden végtag rajzolása vonalként két csont pozíció között
    vector bone1Pos = human.GetBonePositionWS(
        human.GetBoneIndexByName("neck")
    );
    vector bone2Pos = human.GetBonePositionWS(
        human.GetBoneIndexByName("spine3")
    );
    // ... átalakítás képernyő koordinátákra, majd DrawLine ...
}
```

### Vanilla debug vászon

A motor beépített debug vásznat biztosít a `Debug` osztályon keresztül:

```c
// Forrás: scripts/3_game/tools/debug.c
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

### Teljesítmény szempontok

- **Töröld és rajzold újra minden képkockánál.** A `CanvasWidget` nem tartja meg az állapotot a képkockák között a legtöbb használati esetben, ahol a nézet változik (kamera mozgás, stb.). Hívd meg a `Clear()` metódust minden frissítés elején.
- **Minimalizáld a vonalak számát.** Minden `DrawLine()` hívásnak van többletterhelése. Összetett alakzatoknál, mint a körök, használj kevesebb szegmenst (12-18) távoli objektumoknál, többet (36) közeli objektumoknál.
- **Először ellenőrizd a képernyő határokat.** Alakítsd át a világ pozíciókat képernyő koordinátákra, és hagyd ki az objektumokat, amelyek a képernyőn kívül vagy a kamera mögött vannak (`screenPos[2] < 0`).
- **Használd az `ignorepointer 1`-et.** Mindig állítsd be ezt a jelzőt a vászon overlayeken, hogy ne fogják el az egér eseményeket.
- **Egy vászon elegendő.** Használj egyetlen teljes képernyős vásznat az összes overlay rajzoláshoz ahelyett, hogy több vászon widgetet hoznál létre.

---

## MapWidget

A `MapWidget` megjeleníti a DayZ terep térképet és metódusokat biztosít jelölők elhelyezéséhez, koordináta átalakításhoz és zoom vezérléshez.

### Osztálydefiníció

```
// Forrás: scripts/3_game/gameplay.c
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

### A térkép widget lekérése

Egy `.layout` fájlban helyezd el a térképet a `MapWidgetClass` típussal. Scriptben a referenciát castolással szerezheted meg:

```c
MapWidget m_Map;
m_Map = MapWidget.Cast(layoutRoot.FindAnyWidget("Map"));
```

### Térkép koordináták vs világ koordináták

A DayZ két koordinátateret használ:

- **Világ koordináták**: 3D vektorok méterben. `x` = kelet/nyugat, `y` = magasság, `z` = észak/dél. A Chernarus hozzávetőleg 0-15360 tartományú az x és z tengelyeken.
- **Képernyő koordináták**: Pixel pozíciók a térkép widgeten. Ezek változnak, ahogy a felhasználó mozgatja és zoomolja a térképet.

A `MapWidget` biztosítja az átalakítást ezek között:

```c
// Világ pozíció képernyő pixelre a térképen
vector screenPos = m_Map.MapToScreen(worldPosition);

// Képernyő pixel a térképen világ pozícióvá
vector worldPos = m_Map.ScreenToMap(Vector(screenX, screenY, 0));
```

### Jelölők hozzáadása

Az `AddUserMark()` egy jelölőt helyez el egy világ pozíción címkével, színnel és ikon textúrával:

```c
m_Map.AddUserMark(
    playerPos,                                   // vector: világ pozíció
    "You",                                       // string: címke szöveg
    COLOR_RED,                                   // int: ARGB szín
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"  // string: ikon textúra
);
```

Vanilla példa a `scripts/5_mission/gui/scriptconsolegeneraltab.c` fájlból:

```c
// Játékos pozíció jelölése
m_DebugMapWidget.AddUserMark(
    playerPos, "You", COLOR_RED,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);

// Más játékosok jelölése
m_DebugMapWidget.AddUserMark(
    rpd.m_Pos, rpd.m_Name + " " + dist + "m", COLOR_BLUE,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);

// Kamera pozíció jelölése
m_DebugMapWidget.AddUserMark(
    cameraPos, "Camera", COLOR_GREEN,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);
```

Másik vanilla példa a `scripts/5_mission/gui/mapmenu.c` fájlból (kikommentezve, de mutatja az API-t):

```c
m.AddUserMark("2681 4.7 1751", "Label1", ARGB(255,255,0,0),
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa");
m.AddUserMark("2683 4.7 1851", "Label2", ARGB(255,0,255,0),
    "\\dz\\gear\\navigation\\data\\map_bunker_ca.paa");
m.AddUserMark("2670 4.7 1651", "Label3", ARGB(255,0,0,255),
    "\\dz\\gear\\navigation\\data\\map_busstop_ca.paa");
```

### Jelölők törlése

A `ClearUserMarks()` egyszerre eltávolítja az összes felhasználó által elhelyezett jelölőt. Nincs metódus egyetlen jelölő referencia alapján történő eltávolítására. A standard minta az, hogy törölsz minden jelölőt, és újra hozzáadod azokat, amelyeket meg akarsz tartani, minden képkockánál.

```c
// Forrás: scripts/5_mission/gui/scriptconsolesoundstab.c
override void Update(float timeslice)
{
    m_DebugMapWidget.ClearUserMarks();
    // Összes aktuális jelölő újra hozzáadása
    m_DebugMapWidget.AddUserMark(playerPos, "You", COLOR_RED, iconPath);
}
```

### Elérhető térkép jelölő ikonok

A vanilla játék ezeket a jelölő ikon textúrákat regisztrálja a `scripts/5_mission/gui/mapmarkersinfo.c` fájlban:

| Enum konstans | Textúra útvonal |
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

Ezeket enum-mal érheted el a `MapMarkerTypes.GetMarkerTypeFromID(eMapMarkerTypes.MARKERTYPE_MAP_CAMP)` segítségével.

### Zoom és panorámázás vezérlés

```c
// A térkép közepének beállítása egy világ pozícióra
m_Map.SetMapPos(playerWorldPos);

// Zoom szint lekérése/beállítása (0.0 = teljesen kicsinyítve, 1.0 = teljesen nagyítva)
float currentScale = m_Map.GetScale();
m_Map.SetScale(0.33);  // mérsékelt zoom szint

// Térkép információk lekérése
float contourInterval = m_Map.GetContourInterval();  // méter a szintvonalak között
float cellSize = m_Map.GetCellSize(legendWidth);      // cellaméret a skála vonalzóhoz
```

### Térkép kattintás kezelés

Kezeld az egérkattintásokat a térképen az `OnDoubleClick` vagy `OnMouseButtonDown` callbackeken keresztül egy `ScriptedWidgetEventHandler`-en vagy `UIScriptedMenu`-n. Alakítsd át a kattintás pozíciót világ koordinátákra a `ScreenToMap()` segítségével.

Vanilla példa a `scripts/5_mission/gui/scriptconsolegeneraltab.c` fájlból:

```c
override bool OnDoubleClick(Widget w, int x, int y, int button)
{
    super.OnDoubleClick(w, x, y, button);

    if (w == m_DebugMapWidget)
    {
        // Képernyő kattintás átalakítása világ koordinátákra
        vector worldPos = m_DebugMapWidget.ScreenToMap(Vector(x, y, 0));

        // Terep magasság lekérése az adott pozícióban
        float surfaceY = g_Game.SurfaceY(worldPos[0], worldPos[2]);
        float roadY = g_Game.SurfaceRoadY(worldPos[0], worldPos[2]);
        worldPos[1] = Math.Max(surfaceY, roadY);

        // A világ pozíció használata (pl. játékos teleportálása)
    }
    return false;
}
```

A `scripts/5_mission/gui/maphandler.c` fájlból:

```c
class MapHandler : ScriptedWidgetEventHandler
{
    override bool OnDoubleClick(Widget w, int x, int y, int button)
    {
        vector worldPos = MapWidget.Cast(w).ScreenToMap(Vector(x, y, 0));
        // Jelölő elhelyezése, teleportálás, stb.
        return true;
    }
}
```

### Expansion térkép jelölő rendszer

Az Expansion mod egy teljes jelölő rendszert épít a vanilla `MapWidget` tetejére. Főbb minták:

- Külön szótárakat tart fenn személyes, szerver, csapat és játékos jelölőkhöz
- Korlátozza a képkockánkénti jelölő frissítéseket (`m_MaxMarkerUpdatesPerFrame = 3`) a teljesítmény érdekében
- Skála vonalzó vonalakat rajzol egy `CanvasWidget` segítségével a térkép mellett
- Egyéni jelölő widget overlayeket használ, amelyeket a `MapToScreen()` segítségével pozícionál, gazdagabb jelölő vizualitáshoz, mint amit az `AddUserMark()` támogat

Ez a megközelítés bemutatja, hogy összetett jelölő felületeknél (ikonok eszköztippekkel, szerkeszthető címkékkel, színes kategóriákkal) egyéni widgeteket kell pozícionálnod a `MapToScreen()` segítségével, ahelyett hogy kizárólag az `AddUserMark()`-ra hagyatkoznál.

---

## ItemPreviewWidget

Az `ItemPreviewWidget` bármely `EntityAI` (tárgy, fegyver, jármű) 3D előnézetét rendereli egy UI panelen belül.

### Osztálydefiníció

```
// Forrás: scripts/3_game/gameplay.c
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

### Nézet indexek

A `viewIndex` paraméter kiválasztja, melyik befoglaló dobozt és kameraszöget használja. Ezek tárgyankénti konfigurációban vannak definiálva:

- View 0: alapértelmezett (`boundingbox_min` + `boundingbox_max` + `invView`)
- View 1: alternatív (`boundingbox_min2` + `boundingbox_max2` + `invView2`)
- View 2+: további nézetek, ha definiálva vannak

Használd az `item.GetViewIndex()` metódust a tárgy preferált nézetének lekéréséhez.

### Használati minta -- Tárgy vizsgálat

A `scripts/5_mission/gui/inspectmenunew.c` fájlból:

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

### Forgatás vezérlés (egér húzás)

A standard minta az interaktív forgatáshoz:

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
    o[0] = o[0] + (m_RotationY - mouse_y);  // billenés
    o[1] = o[1] - (m_RotationX - mouse_x);  // forgás
    m_item_widget.SetModelOrientation(o);

    if (!is_dragging)
        m_Orientation = o;
}
```

### Zoom vezérlés (egérgörgő)

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

A `PlayerPreviewWidget` egy teljes 3D játékos karakter modellt renderel a felületen, felszerelt tárgyakkal és animációkkal.

### Osztálydefiníció

```
// Forrás: scripts/3_game/gameplay.c
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

### Használati minta -- Felszerelés karakter előnézet

A `scripts/5_mission/gui/inventorynew/playerpreview.c` fájlból:

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

### Felszerelés naprakészen tartása

Az `UpdateInterval()` metódus szinkronban tartja az előnézetet a tényleges játékos felszerelésével:

```c
override void UpdateInterval()
{
    // Kézben tartott tárgy frissítése
    m_CharacterPanelWidget.UpdateItemInHands(
        g_Game.GetPlayer().GetEntityInHands()
    );

    // A dummy játékos elérése animáció szinkronizáláshoz
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

### Forgatás és zoom

A forgatási és zoom minták azonosak az `ItemPreviewWidget`-éval -- használd a `SetModelOrientation()` metódust egér húzással, és a `SetSize()` metódust egérgörgővel. Lásd az előző szekciót a teljes kódért.

---

## VideoWidget

A `VideoWidget` videó fájlokat játszik le a felületen. Támogatja a lejátszás vezérlést, ismétlést, tekerést, állapot lekérdezéseket, feliratokat és esemény callbackeket.

### Osztálydefiníció

```
// Forrás: scripts/1_core/proto/enwidgets.c
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

### Használati minta -- Menü videó

A `scripts/5_mission/gui/newui/mainmenu/mainmenuvideo.c` fájlból:

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

    // Callback regisztrálása a videó végéhez
    m_Video.SetCallback(VideoCallback.ON_END, StopVideo);

    return layoutRoot;
}

void StopVideo()
{
    // Videó befejezés kezelése
    Close();
}
```

### Feliratok

A feliratok megkövetelik, hogy egy betűtípus legyen hozzárendelve a `VideoWidget`-hez a layoutban. A felirat fájlok a `videoName_Language.srt` elnevezési konvenciót használják, az angol verzió `videoName.srt` névvel (nyelvi utótag nélkül).

```c
// A feliratok alapértelmezés szerint engedélyezve vannak
m_Video.DisableSubtitles(false);  // explicit engedélyezés
```

### Visszatérési értékek

A `Load()`, `Play()`, `Pause()` és `Stop()` metódusok `bool`-t adnak vissza, de ez a visszatérési érték **elavult**. Használd a `VideoCallback.ON_ERROR`-t a hibák észleléséhez.

---

## RenderTargetWidget és RTTextureWidget

Ezek a widgetek lehetővé teszik egy 3D világnézet renderelését egy UI widgetbe.

### Osztálydefiníciók

```
// Forrás: scripts/1_core/proto/enwidgets.c
class RenderTargetWidget extends Widget
{
    proto native void SetRefresh(int period, int offset);
    proto native void SetResolutionScale(float xscale, float yscale);
};

class RTTextureWidget extends Widget
{
    // Nincsenek további metódusok -- textúra célként szolgál a gyerekeknek
};
```

A `SetWidgetWorld` globális függvény köt egy render target-et egy világhoz és kamerához:

```
proto native void SetWidgetWorld(
    RenderTargetWidget w,
    IEntity worldEntity,
    int camera
);
```

### RenderTargetWidget

Egy kameranézetet renderel egy `BaseWorld`-ből a widget területére. Biztonsági kamerákhoz, visszapillantó tükrökhöz vagy kép-a-képben kijelzőkhöz használják.

A `scripts/2_gamelib/entities/rendertarget.c` fájlból:

```c
// Render target programozottan létrehozása
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

// Kötés a játék világhoz a 0-s kamera indexszel
SetWidgetWorld(m_RenderWidget, g_Game.GetWorldEntity(), 0);
```

**Frissítés vezérlés:**

```c
// Renderelés minden 2. képkockánál (period=2, offset=0)
m_RenderWidget.SetRefresh(2, 0);

// Renderelés fele felbontáson a teljesítmény érdekében
m_RenderWidget.SetResolutionScale(0.5, 0.5);
```

### RTTextureWidget

Az `RTTextureWidget`-nek nincsenek script oldali metódusai a `Widget`-től örökölteken túl. Render target textúraként szolgál, amelybe gyerek widgetek renderelhetők. Egy `ImageWidget` hivatkozhat egy `RTTextureWidget`-re textúra forrásaként a `SetImageTexture()` segítségével:

```c
ImageWidget imgWidget;
RTTextureWidget rtTexture;
imgWidget.SetImageTexture(0, rtTexture);
```

---

## Legjobb gyakorlatok

1. **Használd a megfelelő widgetet a feladathoz.** `TextWidget` egyszerű címkékhez, `RichTextWidget` csak akkor, ha inline képekre vagy formázott tartalomra van szükséged. `CanvasWidget` dinamikus 2D overlayekhez, nem statikus grafikákhoz (használj `ImageWidget`-et azokhoz).

2. **Töröld a vásznat minden képkockánál.** Mindig hívd meg a `Clear()` metódust az újrarajzolás előtt. A törlés elmulasztása a rajzok felhalmozódását okozza és vizuális hibákat hoz létre.

3. **Ellenőrizd a képernyő határokat ESP/overlay rajzoláshoz.** A `DrawLine()` hívása előtt ellenőrizd, hogy mindkét végpont a képernyőn van. A képernyőn kívüli rajzolás pazarlás.

4. **Térkép jelölők: törlés-és-újraépítés minta.** Nincs `RemoveUserMark()` metódus. Hívd meg a `ClearUserMarks()` metódust, majd add újra hozzá az összes aktív jelölőt minden frissítésnél. Ezt a mintát használja minden vanilla és mod implementáció.

5. **Az ItemPreviewWidget-nek valós EntityAI kell.** Nem tudsz előnézni egy osztálynév stringet -- szükséged van egy spawnolt entitás referenciára. Felszerelés előnézetekhez használd a tényleges felszerelés tárgyat.

6. **A PlayerPreviewWidget saját dummy játékost birtokol.** A widget létrehoz egy belső dummy `DayZPlayer`-t. Érd el a `GetDummyPlayer()` segítségével az animációk szinkronizálásához, de ne semmisítsd meg magad.

7. **VideoWidget: használj callbackeket, ne visszatérési értékeket.** A `Load()`, `Play()`, stb. bool visszatérési értékei elavultak. Használd a `SetCallback(VideoCallback.ON_ERROR, handler)` metódust.

8. **RenderTargetWidget teljesítmény.** Használd a `SetRefresh()` metódust period > 1 értékkel képkockák kihagyásához. Használd a `SetResolutionScale()` metódust a felbontás csökkentéséhez. Ezek a widgetek drágák -- használd takarékosan.

---

## Valós modokban megfigyelt minták

| Mod | Widget | Használat |
|-----|--------|-----------|
| **COT** | `CanvasWidget` | Teljes képernyős ESP overlay csontváz rajzolással, világ-képernyő vetítéssel, kör és vonal primitívekkel |
| **COT** | `MapWidget` | Admin teleportálás a `ScreenToMap()` segítségével dupla kattintásra |
| **Expansion** | `MapWidget` | Egyéni jelölő rendszer személyes/szerver/csapat kategóriákkal, képkockánkénti frissítés korlátozással |
| **Expansion** | `CanvasWidget` | Térkép skála vonalzó rajzolás a `MapWidget` mellett |
| **Vanilla térkép** | `MapWidget` + `CanvasWidget` | Skála vonalzó váltakozó fekete/szürke vonalszegmensekkel |
| **Vanilla vizsgálat** | `ItemPreviewWidget` | 3D tárgy vizsgálat húzásos forgatással és görgős zoommal |
| **Vanilla felszerelés** | `PlayerPreviewWidget` | Karakter előnézet felszerelés szinkronizálással és sérülés animációkkal |
| **Vanilla tippek** | `RichTextWidget` | Játékon belüli tipp panel formázott leírás szöveggel |
| **Vanilla menük** | `RichTextWidget` | Kontroller gomb ikonok az `InputUtils.GetRichtextButtonIconFromInputAction()` segítségével |
| **Vanilla könyvek** | `HtmlWidget` | `.html` szövegfájlok betöltése és lapozása |
| **Vanilla főmenü** | `VideoWidget` | Bevezető videó vége callbackkel |
| **Vanilla render target** | `RenderTargetWidget` | Kamera-widget renderelés konfigurálható frissítési rátával |

---

## Gyakori hibák

**1. RichTextWidget használata ott, ahol a TextWidget is elég.**
A formázott szöveg elemzésnek van többletterhelése. Ha csak egyszerű szövegre van szükséged, használj `TextWidget`-et.

**2. A vászon Clear() elfelejtése.**
```c
// HELYTELEN - a rajzok felhalmozódnak, megtöltik a képernyőt
void Update(float dt)
{
    m_Canvas.DrawLine(0, 0, 100, 100, 1, COLOR_RED);
}

// HELYES
void Update(float dt)
{
    m_Canvas.Clear();
    m_Canvas.DrawLine(0, 0, 100, 100, 1, COLOR_RED);
}
```

**3. Rajzolás a kamera mögé.**
```c
// HELYTELEN - vonalakat rajzol a mögötted lévő objektumokhoz
vector screenPos = g_Game.GetScreenPosRelative(worldPos);
// Nincs határ ellenőrzés!

// HELYES
vector screenPos = g_Game.GetScreenPosRelative(worldPos);
if (screenPos[2] < 0)
    return;  // kamera mögött
if (screenPos[0] < 0 || screenPos[0] > 1 || screenPos[1] < 0 || screenPos[1] > 1)
    return;  // képernyőn kívül
```

**4. Egyetlen térkép jelölő eltávolításának kísérlete.**
Nincs `RemoveUserMark()`. A `ClearUserMarks()` metódust kell meghívnod, és újra hozzá kell adnod az összes jelölőt, amelyet meg akarsz tartani.

**5. Az ItemPreviewWidget tárgyának null-ra állítása ellenőrzés nélkül.**
Mindig védekezz null entitás referenciák ellen a `SetItem()` meghívása előtt.

**6. Az ignorepointer beállításának elmulasztása overlay vásznakon.**
Egy `ignorepointer 1` nélküli vászon elfog minden egér eseményt, ami az alatta lévő felületet nem reagálóvá teszi.

**7. Visszaper jelek használata textúra útvonalakban megduplázás nélkül.**
Enforce Script stringekben a visszaper jeleket meg kell duplázni:
```c
// HELYTELEN
"\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
// Ez valójában HELYES az Enforce Script-ben -- minden \\ egy \-t eredményez
```

---

## Kompatibilitás és hatás

| Widget | Csak kliens | Teljesítmény költség | Mod kompatibilitás |
|--------|------------|---------------------|-------------------|
| `RichTextWidget` | Igen | Alacsony (tag elemzés) | Biztonságos, nincs ütközés |
| `CanvasWidget` | Igen | Közepes (képkockánkénti) | Biztonságos, ha az `ignorepointer` be van állítva |
| `MapWidget` | Igen | Alacsony-Közepes | Több mod is hozzáadhat jelölőket |
| `ItemPreviewWidget` | Igen | Közepes (3D renderelés) | Biztonságos, widget-hatókörű |
| `PlayerPreviewWidget` | Igen | Közepes (3D renderelés) | Biztonságos, dummy játékost hoz létre |
| `VideoWidget` | Igen | Magas (videó dekódolás) | Egyszerre egy videó |
| `RenderTargetWidget` | Igen | Magas (3D renderelés) | Kamera ütközések lehetségesek |
| `RTTextureWidget` | Igen | Alacsony (textúra cél) | Biztonságos |

Ezek a widgetek mind kizárólag kliens oldaliak. Nincs szerver oldali reprezentációjuk, és nem hozhatók létre vagy manipulálhatók szerver scriptekből.

---

## Összefoglalás

| Widget | Elsődleges használat | Fő metódusok |
|--------|---------------------|-------------|
| `RichTextWidget` | Formázott szöveg inline képekkel | `SetText()`, `GetContentHeight()`, `SetContentOffset()` |
| `HtmlWidget` | Formázott szövegfájlok betöltése | `LoadFile()` |
| `CanvasWidget` | 2D rajzolás overlay | `DrawLine()`, `Clear()` |
| `MapWidget` | Terep térkép jelölőkkel | `AddUserMark()`, `ClearUserMarks()`, `ScreenToMap()`, `MapToScreen()` |
| `ItemPreviewWidget` | 3D tárgy megjelenítés | `SetItem()`, `SetView()`, `SetModelOrientation()` |
| `PlayerPreviewWidget` | 3D játékos karakter megjelenítés | `SetPlayer()`, `Refresh()`, `UpdateItemInHands()` |
| `VideoWidget` | Videó lejátszás | `Load()`, `Play()`, `Pause()`, `SetCallback()` |
| `RenderTargetWidget` | Valós idejű 3D kameranézet | `SetRefresh()`, `SetResolutionScale()` + `SetWidgetWorld()` |
| `RTTextureWidget` | Render-to-texture cél | Textúra forrásként szolgál az `ImageWidget.SetImageTexture()` számára |

---

*Ez a fejezet lezárja a GUI rendszer szekciót. Minden API szignatúra és minta megerősítve van a vanilla DayZ scriptekből és valós mod forráskódból.*
