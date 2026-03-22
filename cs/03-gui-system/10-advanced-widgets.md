# Kapitola 3.10: Pokročilé widgety

[Domů](../README.md) | [<< Předchozí: Vzory UI ve skutečných modech](09-real-mod-patterns.md) | **Pokročilé widgety**

---

Mimo standardní kontejnery, textové a obrázkové widgety pokryté v dřívějších kapitolách poskytuje DayZ specializované typy widgetů pro formátování bohatého textu, 2D kreslení na plátno, zobrazení mapy, 3D náhledy předmětů, přehrávání videa a vykreslování do textury. Tyto widgety odemykají schopnosti, kterých jednoduché layouty nemohou dosáhnout.

Tato kapitola pokrývá každý pokročilý typ widgetu s potvrzenými signaturami API extrahovanými z vanilla zdrojového kódu a skutečného použití v modech.

---

## Formátování RichTextWidget

`RichTextWidget` rozšiřuje `TextWidget` a podporuje inline značkovací tagy v textovém obsahu. Je to primární způsob zobrazení formátovaného textu s vloženými obrázky, proměnlivými velikostmi písma a zalomením řádků.

### Definice třídy

```
// Ze scripts/1_core/proto/enwidgets.c
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

`RichTextWidget` dědí všechny metody `TextWidget` -- `SetText()`, `SetTextExactSize()`, `SetOutline()`, `SetShadow()`, `SetTextFormat()` a další. Klíčový rozdíl je, že `SetText()` na `RichTextWidget` parsuje inline značkovací tagy.

### Podporované inline tagy

Tyto tagy jsou potvrzeny prostřednictvím vanilla DayZ použití v `news_feed.txt`, `InputUtils.c` a několika skriptech menu.

#### Inline obrázek

```
<image set="IMAGESET_NAME" name="IMAGE_NAME" />
<image set="IMAGESET_NAME" name="IMAGE_NAME" scale="1.5" />
```

Vloží obrázek z pojmenovaného imagesetu přímo do textového toku. Atribut `scale` řídí velikost obrázku relativně k výšce řádku textu.

Vanilla příklad ze `scripts/data/news_feed.txt`:
```
<image set="dayz_gui" name="icon_pin" />  Welcome to DayZ!
```

Vanilla příklad ze `scripts/3_game/tools/inpututils.c` -- sestavení ikon tlačítek ovladače:
```c
string icon = string.Format(
    "<image set=\"%1\" name=\"%2\" scale=\"%3\" />",
    imageSetName,
    iconName,
    1.21
);
richTextWidget.SetText(icon + " Press to confirm");
```

Běžné imagesety ve vanilla DayZ:
- `dayz_gui` -- obecné ikony UI (pin, notifikace)
- `dayz_inventory` -- ikony slotů inventáře (shoulderleft, hands, vest atd.)
- `xbox_buttons` -- obrázky tlačítek Xbox ovladače (A, B, X, Y)
- `playstation_buttons` -- obrázky tlačítek PlayStation ovladače

#### Zalomení řádku

```
</br>
```

Vynutí zalomení řádku uvnitř obsahu bohatého textu. Všimněte si syntaxe uzavíracího tagu -- takto to DayZ parser očekává.

#### Velikost písma / nadpis

```
<h scale="0.8">Textový obsah zde</h>
<h scale="0.6">Menší textový obsah</h>
```

Obalí text do bloku nadpisu s multiplikátorem měřítka. Atribut `scale` je float, který řídí velikost písma relativně k základnímu písmu widgetu. Větší hodnoty produkují větší text.

Vanilla příklad ze `scripts/data/news_feed.txt`:
```
<h scale="0.8">
<image set="dayz_gui" name="icon_pin" />  Section Title
</h>
<h scale="0.6">
Body text at smaller size goes here.
</h>
</br>
```

### Praktické vzory použití

#### Získání reference na RichTextWidget

Ve skriptech přetypujte z layoutu přesně jako jakýkoliv jiný widget:

```c
RichTextWidget m_Label;
m_Label = RichTextWidget.Cast(root.FindAnyWidget("MyRichLabel"));
```

V souborech `.layout` použijte název třídy layoutu:

```
RichTextWidgetClass MyRichLabel {
    position 0 0
    size 1 0.1
    text ""
}
```

#### Nastavení bohatého obsahu s ikonami ovladače

Vanilla třída `InputUtils` poskytuje helper, který generuje řetězec tagu `<image>` pro jakoukoli vstupní akci:

```c
// Ze scripts/3_game/tools/inpututils.c
string buttonIcon = InputUtils.GetRichtextButtonIconFromInputAction(
    "UAUISelect",              // název vstupní akce
    "#menu_select",            // lokalizovaný popisek
    EUAINPUT_DEVICE_CONTROLLER,
    InputUtils.ICON_SCALE_TOOLBAR  // měřítko 1.81
);
// Výsledek: '<image set="xbox_buttons" name="A" scale="1.81" /> Select'

RichTextWidget toolbar = RichTextWidget.Cast(
    layoutRoot.FindAnyWidget("ToolbarText")
);
toolbar.SetText(buttonIcon);
```

Dvě předdefinované konstanty měřítka:
- `InputUtils.ICON_SCALE_NORMAL` = 1.21
- `InputUtils.ICON_SCALE_TOOLBAR` = 1.81

#### Posuvný obsah bohatého textu

`RichTextWidget` vystavuje metody výšky obsahu a offsetu pro stránkování nebo posouvání:

```c
// Ze scripts/5_mission/gui/bookmenu.c
HtmlWidget m_content;  // HtmlWidget rozšiřuje RichTextWidget
m_content.LoadFile(book.ConfigGetString("file"));

float totalHeight = m_content.GetContentHeight();
// Stránkování obsahu:
m_content.SetContentOffset(pageOffset, true);  // snapToLine = true
```

#### Oříznutí textu

Když text přetéká oblast s pevnou šířkou, můžete jej oříznout (zkrátit s indikátorem):

```c
// Oříznout řádek 0 na maxWidth pixelů, přidáním "..."
richText.ElideText(0, maxWidth, "...");
```

#### Řízení viditelnosti řádků

Zobrazení nebo skrytí specifických rozsahů řádků v obsahu:

```c
int lineCount = richText.GetNumLines();
// Skrýt všechny řádky po 5. řádku
richText.SetLinesVisibility(5, lineCount - 1, false);
// Získat šířku v pixelech specifického řádku
float width = richText.GetLineWidth(2);
```

### HtmlWidget -- Rozšířený RichTextWidget

`HtmlWidget` rozšiřuje `RichTextWidget` o jednu další metodu:

```
class HtmlWidget extends RichTextWidget
{
    proto native void LoadFile(string path);
};
```

Používán vanilla systémem knih pro načítání `.html` textových souborů:

```c
// Ze scripts/5_mission/gui/bookmenu.c
HtmlWidget content;
Class.CastTo(content, layoutRoot.FindAnyWidget("HtmlWidget"));
content.LoadFile(book.ConfigGetString("file"));
```

### RichTextWidget vs TextWidget -- Klíčové rozdíly

| Funkce | TextWidget | RichTextWidget |
|---------|-----------|---------------|
| Inline tagy `<image>` | Ne | Ano |
| Tagy nadpisu `<h>` | Ne | Ano |
| Zalomení řádku `</br>` | Ne (použijte `\n`) | Ano |
| Posouvání obsahu | Ne | Ano (přes offset) |
| Viditelnost řádků | Ne | Ano |
| Oříznutí textu | Ne | Ano |
| Výkon | Rychlejší | Pomalejší (parsování tagů) |

Používejte `TextWidget` pro jednoduché popisky. `RichTextWidget` používejte pouze tehdy, když potřebujete inline obrázky, formátované nadpisy nebo posouvání obsahu.

---

## Kreslení na CanvasWidget

`CanvasWidget` poskytuje 2D kreslení v okamžitém režimu na obrazovku. Má přesně dvě nativní metody:

```
// Ze scripts/1_core/proto/enwidgets.c
class CanvasWidget extends Widget
{
    proto native void DrawLine(float x1, float y1, float x2, float y2,
                               float width, int color);
    proto native void Clear();
};
```

To je celé API. Všechny složité tvary -- obdélníky, kruhy, mřížky -- musí být sestaveny z úseček.

### Souřadnicový systém

`CanvasWidget` používá **pixelové souřadnice obrazovky** relativní k vlastním hranicím widgetu plátna. Počátek `(0, 0)` je levý horní roh widgetu plátna.

Pokud plátno vyplňuje celou obrazovku (position 0,0 size 1,1 v relativním režimu), pak se souřadnice mapují přímo na pixely obrazovky po konverzi z interní velikosti widgetu.

### Nastavení layoutu

V souboru `.layout`:

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

Klíčové příznaky:
- `ignorepointer 1` -- plátno neblokuje vstup myší pro widgety pod ním
- Velikost `1 1` v relativním režimu znamená "vyplnit rodiče"

Ve skriptu:

```c
CanvasWidget m_Canvas;
m_Canvas = CanvasWidget.Cast(
    root.FindAnyWidget("MyCanvas")
);
```

Nebo vytvoření ze souboru layoutu:

```c
// Z COT: JM/COT/GUI/layouts/esp_canvas.layout
m_Canvas = CanvasWidget.Cast(
    g_Game.GetWorkspace().CreateWidgets("path/to/canvas.layout")
);
```

### Kreslicí primitiva

#### Čáry

```c
// Nakreslit červenou horizontální čáru
m_Canvas.DrawLine(10, 50, 200, 50, 2, ARGB(255, 255, 0, 0));

// Nakreslit bílou diagonální čáru, 3 pixely širokou
m_Canvas.DrawLine(0, 0, 100, 100, 3, COLOR_WHITE);
```

Parametr `color` používá formát ARGB: `ARGB(alfa, červená, zelená, modrá)`.

#### Obdélníky (z čar)

```c
void DrawRectangle(CanvasWidget canvas, float x, float y,
                   float w, float h, float lineWidth, int color)
{
    canvas.DrawLine(x, y, x + w, y, lineWidth, color);         // horní
    canvas.DrawLine(x + w, y, x + w, y + h, lineWidth, color); // pravá
    canvas.DrawLine(x + w, y + h, x, y + h, lineWidth, color); // dolní
    canvas.DrawLine(x, y + h, x, y, lineWidth, color);         // levá
}
```

#### Kruhy (ze segmentů čar)

COT implementuje tento vzor v `JMESPCanvas`:

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

Více segmentů produkuje hladší kruh. 36 segmentů je běžné výchozí nastavení.

### Vzor překreslení každý snímek

`CanvasWidget` je v okamžitém režimu: musíte zavolat `Clear()` a překreslit každý snímek. To se typicky dělá v callbacku `Update()` nebo `OnUpdate()`.

Vanilla příklad ze `scripts/5_mission/gui/mapmenu.c`:

```c
override void Update(float timeslice)
{
    super.Update(timeslice);
    m_ToolsScaleCellSizeCanvas.Clear();  // vyčistit předchozí snímek

    // ... nakreslit segmenty měřítkového pravítka ...
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

### Vzor ESP překrytí (z COT)

COT (Community Online Tools) používá `CanvasWidget` jako celoobrazovkové překrytí pro kreslení drátěných modelů koster na hráčích a objektech. Jedná se o jeden z nejsofistikovanějších vzorů použití plátna v jakémkoliv modu DayZ.

**Architektura:**

1. Celoobrazovkový `CanvasWidget` je vytvořen ze souboru layoutu
2. Každý snímek je zavoláno `Clear()`
3. Pozice ve světovém prostoru jsou konvertovány na souřadnice obrazovky
4. Čáry jsou kresleny mezi pozicemi kostí pro vykreslení koster

**Konverze ze světa na obrazovku** (z `JMESPCanvas` v COT):

```c
// Z DayZ-CommunityOnlineTools/.../JMESPModule.c
vector TransformToScreenPos(vector worldPos, out bool isInBounds)
{
    float parentW, parentH;
    vector screenPos;

    // Získat relativní pozici na obrazovce (rozsah 0..1)
    screenPos = g_Game.GetScreenPosRelative(worldPos);

    // Zkontrolovat, zda je pozice viditelná na obrazovce
    isInBounds = screenPos[0] >= 0 && screenPos[0] <= 1
              && screenPos[1] >= 0 && screenPos[1] <= 1
              && screenPos[2] >= 0;

    // Konvertovat na pixelové souřadnice plátna
    m_Canvas.GetScreenSize(parentW, parentH);
    screenPos[0] = screenPos[0] * parentW;
    screenPos[1] = screenPos[1] * parentH;

    return screenPos;
}
```

**Nakreslení čáry ze světové pozice A do světové pozice B:**

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

**Nakreslení kostry hráče:**

```c
// Zjednodušeno z JMESPSkeleton.Draw() v COT
static void DrawSkeleton(Human human, CanvasWidget canvas)
{
    // Definovat spojení končetin (páry kostí)
    // krk->spine3, spine3->pánev, krk->levá ruka atd.

    int color = COLOR_WHITE;
    switch (human.GetHealthLevel())
    {
        case GameConstants.STATE_DAMAGED:
            color = 0xFFDCDC00;  // žlutá
            break;
        case GameConstants.STATE_BADLY_DAMAGED:
            color = 0xFFDC0000;  // červená
            break;
    }

    // Nakreslit každou končetinu jako čáru mezi dvěma pozicemi kostí
    vector bone1Pos = human.GetBonePositionWS(
        human.GetBoneIndexByName("neck")
    );
    vector bone2Pos = human.GetBonePositionWS(
        human.GetBoneIndexByName("spine3")
    );
    // ... konvertovat na souřadnice obrazovky, pak DrawLine ...
}
```

### Vanilla debug plátno

Engine poskytuje vestavěné debug plátno přes třídu `Debug`:

```c
// Ze scripts/3_game/tools/debug.c
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

### Úvahy o výkonu

- **Vyčistěte a překreslete každý snímek.** `CanvasWidget` neuchovává stav mezi snímky ve většině případů, kdy se mění pohled (pohyb kamery atd.). Volejte `Clear()` na začátku každé aktualizace.
- **Minimalizujte počet čar.** Každé volání `DrawLine()` má režii. Pro složité tvary jako kruhy použijte méně segmentů (12-18) pro vzdálené objekty, více (36) pro blízké.
- **Nejdříve kontrolujte hranice obrazovky.** Konvertujte světové pozice na souřadnice obrazovky a přeskočte objekty, které jsou mimo obrazovku nebo za kamerou (`screenPos[2] < 0`).
- **Použijte `ignorepointer 1`.** Vždy nastavte tento příznak na překrytích plátna, aby nezachycovala události myši.
- **Jedno plátno stačí.** Použijte jedno celoobrazovkové plátno pro veškeré kreslení překrytí místo vytváření více widgetů plátna.

---

## MapWidget

`MapWidget` zobrazuje mapu terénu DayZ a poskytuje metody pro umísťování značek, konverzi souřadnic a řízení přiblížení.

### Definice třídy

```
// Ze scripts/3_game/gameplay.c
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

### Získání widgetu mapy

V souboru `.layout` umístěte mapu pomocí typu `MapWidgetClass`. Ve skriptu získejte referenci přetypováním:

```c
MapWidget m_Map;
m_Map = MapWidget.Cast(layoutRoot.FindAnyWidget("Map"));
```

### Souřadnice mapy vs světové souřadnice

DayZ používá dva souřadnicové prostory:

- **Světové souřadnice**: 3D vektory v metrech. `x` = východ/západ, `y` = nadmořská výška, `z` = sever/jih. Chernarus sahá přibližně od 0 do 15360 na osách x a z.
- **Souřadnice obrazovky**: Pixelové pozice na widgetu mapy. Ty se mění při posouvání a přibližování uživatelem.

`MapWidget` poskytuje konverzi mezi nimi:

```c
// Světová pozice na pixel obrazovky na mapě
vector screenPos = m_Map.MapToScreen(worldPosition);

// Pixel obrazovky na mapě na světovou pozici
vector worldPos = m_Map.ScreenToMap(Vector(screenX, screenY, 0));
```

### Přidávání značek

`AddUserMark()` umístí značku na světovou pozici s popiskem, barvou a texturou ikony:

```c
m_Map.AddUserMark(
    playerPos,                                   // vector: světová pozice
    "You",                                       // string: text popisku
    COLOR_RED,                                   // int: barva ARGB
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"  // string: textura ikony
);
```

Vanilla příklad ze `scripts/5_mission/gui/scriptconsolegeneraltab.c`:

```c
// Označit pozici hráče
m_DebugMapWidget.AddUserMark(
    playerPos, "You", COLOR_RED,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);

// Označit ostatní hráče
m_DebugMapWidget.AddUserMark(
    rpd.m_Pos, rpd.m_Name + " " + dist + "m", COLOR_BLUE,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);

// Označit pozici kamery
m_DebugMapWidget.AddUserMark(
    cameraPos, "Camera", COLOR_GREEN,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);
```

Další vanilla příklad ze `scripts/5_mission/gui/mapmenu.c` (zakomentovaný, ale ukazuje API):

```c
m.AddUserMark("2681 4.7 1751", "Label1", ARGB(255,255,0,0),
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa");
m.AddUserMark("2683 4.7 1851", "Label2", ARGB(255,0,255,0),
    "\\dz\\gear\\navigation\\data\\map_bunker_ca.paa");
m.AddUserMark("2670 4.7 1651", "Label3", ARGB(255,0,0,255),
    "\\dz\\gear\\navigation\\data\\map_busstop_ca.paa");
```

### Vymazání značek

`ClearUserMarks()` odstraní všechny uživatelem umístěné značky najednou. Neexistuje metoda pro odstranění jedné značky podle reference. Standardní vzor je vymazat všechny značky a znovu přidat ty požadované každý snímek.

```c
// Ze scripts/5_mission/gui/scriptconsolesoundstab.c
override void Update(float timeslice)
{
    m_DebugMapWidget.ClearUserMarks();
    // Znovu přidat všechny aktuální značky
    m_DebugMapWidget.AddUserMark(playerPos, "You", COLOR_RED, iconPath);
}
```

### Dostupné ikony značek mapy

Vanilla hra registruje tyto textury ikon značek v `scripts/5_mission/gui/mapmarkersinfo.c`:

| Enum konstanta | Cesta k textuře |
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

Přístup přes enum: `MapMarkerTypes.GetMarkerTypeFromID(eMapMarkerTypes.MARKERTYPE_MAP_CAMP)`.

### Řízení přiblížení a posouvání

```c
// Nastavit střed mapy na světovou pozici
m_Map.SetMapPos(playerWorldPos);

// Získat/nastavit úroveň přiblížení (0.0 = plně oddáleno, 1.0 = plně přiblíženo)
float currentScale = m_Map.GetScale();
m_Map.SetScale(0.33);  // střední úroveň přiblížení

// Získat informace o mapě
float contourInterval = m_Map.GetContourInterval();  // metry mezi vrstevnicemi
float cellSize = m_Map.GetCellSize(legendWidth);      // velikost buňky pro měřítkové pravítko
```

### Zpracování kliknutí na mapu

Zpracovávejte kliknutí myší na mapě přes callbacky `OnDoubleClick` nebo `OnMouseButtonDown` na `ScriptedWidgetEventHandler` nebo `UIScriptedMenu`. Konvertujte pozici kliknutí na světové souřadnice pomocí `ScreenToMap()`.

Vanilla příklad ze `scripts/5_mission/gui/scriptconsolegeneraltab.c`:

```c
override bool OnDoubleClick(Widget w, int x, int y, int button)
{
    super.OnDoubleClick(w, x, y, button);

    if (w == m_DebugMapWidget)
    {
        // Konvertovat kliknutí na obrazovce na světové souřadnice
        vector worldPos = m_DebugMapWidget.ScreenToMap(Vector(x, y, 0));

        // Získat výšku terénu na dané pozici
        float surfaceY = g_Game.SurfaceY(worldPos[0], worldPos[2]);
        float roadY = g_Game.SurfaceRoadY(worldPos[0], worldPos[2]);
        worldPos[1] = Math.Max(surfaceY, roadY);

        // Použít světovou pozici (např. teleportovat hráče)
    }
    return false;
}
```

Ze `scripts/5_mission/gui/maphandler.c`:

```c
class MapHandler : ScriptedWidgetEventHandler
{
    override bool OnDoubleClick(Widget w, int x, int y, int button)
    {
        vector worldPos = MapWidget.Cast(w).ScreenToMap(Vector(x, y, 0));
        // Umístit značku, teleportovat atd.
        return true;
    }
}
```

### Systém značek mapy v Expansion

Mod Expansion staví plný systém značek nad vanilla `MapWidget`. Klíčové vzory:

- Udržuje oddělené slovníky pro osobní, serverové, party a hráčské značky
- Omezuje aktualizace značek na snímek (`m_MaxMarkerUpdatesPerFrame = 3`) pro výkon
- Kreslí čáry měřítkového pravítka pomocí `CanvasWidget` vedle mapy
- Používá vlastní překryvné widgety značek pozicované přes `MapToScreen()` pro bohatší vizuály značek, než podporuje `AddUserMark()`

Tento přístup ukazuje, že pro složitá UI značek (ikony s tooltipem, editovatelné popisky, barevné kategorie) byste měli překrývat vlastní widgety pozicované přes `MapToScreen()` místo spoléhání se pouze na `AddUserMark()`.

---

## ItemPreviewWidget

`ItemPreviewWidget` vykresluje 3D náhled jakéhokoliv `EntityAI` (předmět, zbraň, vozidlo) uvnitř panelu UI.

### Definice třídy

```
// Ze scripts/3_game/gameplay.c
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

### Indexy pohledů

Parametr `viewIndex` vybírá, který ohraničující box a úhel kamery použít. Ty jsou definovány pro každý předmět v konfiguraci předmětu:

- Pohled 0: výchozí (`boundingbox_min` + `boundingbox_max` + `invView`)
- Pohled 1: alternativní (`boundingbox_min2` + `boundingbox_max2` + `invView2`)
- Pohled 2+: další pohledy, pokud jsou definovány

Použijte `item.GetViewIndex()` pro získání preferovaného pohledu předmětu.

### Vzor použití -- Prohlížení předmětů

Ze `scripts/5_mission/gui/inspectmenunew.c`:

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

### Řízení rotace (tažení myší)

Standardní vzor pro interaktivní rotaci:

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
    o[0] = o[0] + (m_RotationY - mouse_y);  // náklon
    o[1] = o[1] - (m_RotationX - mouse_x);  // otáčení
    m_item_widget.SetModelOrientation(o);

    if (!is_dragging)
        m_Orientation = o;
}
```

### Řízení přiblížení (kolečko myši)

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

`PlayerPreviewWidget` vykresluje plný 3D model hráčské postavy v UI, kompletně s nasazenými předměty a animacemi.

### Definice třídy

```
// Ze scripts/3_game/gameplay.c
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

### Vzor použití -- Náhled postavy v inventáři

Ze `scripts/5_mission/gui/inventorynew/playerpreview.c`:

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

### Udržování aktuální výbavy

Metoda `UpdateInterval()` udržuje náhled synchronizovaný se skutečnou výbavou hráče:

```c
override void UpdateInterval()
{
    // Aktualizovat držený předmět
    m_CharacterPanelWidget.UpdateItemInHands(
        g_Game.GetPlayer().GetEntityInHands()
    );

    // Přístup k dummy hráči pro synchronizaci animací
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

### Rotace a přiblížení

Vzory rotace a přiblížení jsou identické s `ItemPreviewWidget` -- použijte `SetModelOrientation()` s tažením myší a `SetSize()` s kolečkem myši. Viz předchozí sekce pro úplný kód.

---

## VideoWidget

`VideoWidget` přehrává video soubory v UI. Podporuje řízení přehrávání, opakování, hledání, dotazy na stav, titulky a callbacky událostí.

### Definice třídy

```
// Ze scripts/1_core/proto/enwidgets.c
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

### Vzor použití -- Video v menu

Ze `scripts/5_mission/gui/newui/mainmenu/mainmenuvideo.c`:

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

    // Zaregistrovat callback pro konec videa
    m_Video.SetCallback(VideoCallback.ON_END, StopVideo);

    return layoutRoot;
}

void StopVideo()
{
    // Zpracovat dokončení videa
    Close();
}
```

### Titulky

Titulky vyžadují font přiřazený k `VideoWidget` v layoutu. Soubory titulků používají konvenci pojmenování `videoName_Language.srt`, přičemž anglická verze se jmenuje `videoName.srt` (bez přípony jazyka).

```c
// Titulky jsou ve výchozím nastavení povoleny
m_Video.DisableSubtitles(false);  // explicitně povolit
```

### Návratové hodnoty

Metody `Load()`, `Play()`, `Pause()` a `Stop()` vracejí `bool`, ale tato návratová hodnota je **zastaralá**. Pro detekci selhání používejte místo toho `VideoCallback.ON_ERROR`.

---

## RenderTargetWidget a RTTextureWidget

Tyto widgety umožňují vykreslení 3D pohledu na svět do widgetu UI.

### Definice tříd

```
// Ze scripts/1_core/proto/enwidgets.c
class RenderTargetWidget extends Widget
{
    proto native void SetRefresh(int period, int offset);
    proto native void SetResolutionScale(float xscale, float yscale);
};

class RTTextureWidget extends Widget
{
    // Žádné další metody -- slouží jako texturový cíl pro potomky
};
```

Globální funkce `SetWidgetWorld` navazuje render target na svět a kameru:

```
proto native void SetWidgetWorld(
    RenderTargetWidget w,
    IEntity worldEntity,
    int camera
);
```

### RenderTargetWidget

Vykresluje pohled kamery ze `BaseWorld` do oblasti widgetu. Používá se pro bezpečnostní kamery, zpětná zrcátka nebo picture-in-picture zobrazení.

Ze `scripts/2_gamelib/entities/rendertarget.c`:

```c
// Vytvoření render targetu programaticky
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

// Navázat na herní svět s indexem kamery 0
SetWidgetWorld(m_RenderWidget, g_Game.GetWorldEntity(), 0);
```

**Řízení obnovování:**

```c
// Vykreslovat každý 2. snímek (period=2, offset=0)
m_RenderWidget.SetRefresh(2, 0);

// Vykreslovat v polovičním rozlišení pro výkon
m_RenderWidget.SetResolutionScale(0.5, 0.5);
```

### RTTextureWidget

`RTTextureWidget` nemá žádné skriptové metody mimo ty zděděné z `Widget`. Slouží jako textura render targetu, do které mohou být vykresleny podřízené widgety. `ImageWidget` může odkazovat na `RTTextureWidget` jako svůj zdroj textury přes `SetImageTexture()`:

```c
ImageWidget imgWidget;
RTTextureWidget rtTexture;
imgWidget.SetImageTexture(0, rtTexture);
```

---

## Doporučené postupy

1. **Používejte správný widget pro daný úkol.** `TextWidget` pro jednoduché popisky, `RichTextWidget` pouze tehdy, když potřebujete inline obrázky nebo formátovaný obsah. `CanvasWidget` pro dynamická 2D překrytí, ne pro statickou grafiku (pro tu použijte `ImageWidget`).

2. **Vyčistěte plátno každý snímek.** Vždy volejte `Clear()` před překreslením. Opomenutí čištění způsobuje hromadění kreseb a vizuální artefakty.

3. **Kontrolujte hranice obrazovky pro ESP/překryvné kreslení.** Před voláním `DrawLine()` ověřte, že oba koncové body jsou na obrazovce. Kreslení mimo obrazovku je zbytečná práce.

4. **Značky mapy: vzor vyčistit a znovu sestavit.** Neexistuje metoda `RemoveUserMark()`. Volejte `ClearUserMarks()` a poté znovu přidejte všechny aktivní značky při každé aktualizaci. Toto je vzor používaný každou vanilla a mod implementací.

5. **ItemPreviewWidget potřebuje skutečné EntityAI.** Nemůžete zobrazit náhled řetězce classname -- potřebujete referenci na spawnutou entitu. Pro náhledy inventáře použijte skutečný předmět z inventáře.

6. **PlayerPreviewWidget vlastní dummy hráče.** Widget vytvoří interního dummy `DayZPlayer`. Přistupujte k němu přes `GetDummyPlayer()` pro synchronizaci animací, ale neničte ho sami.

7. **VideoWidget: používejte callbacky, ne návratové hodnoty.** Návratové bool z `Load()`, `Play()` atd. jsou zastaralé. Použijte `SetCallback(VideoCallback.ON_ERROR, handler)`.

8. **Výkon RenderTargetWidget.** Použijte `SetRefresh()` s periodou > 1 pro přeskočení snímků. Použijte `SetResolutionScale()` pro snížení rozlišení. Tyto widgety jsou nákladné -- používejte je střídmě.

---

## Pozorováno ve skutečných modech

| Mod | Widget | Použití |
|-----|--------|-------|
| **COT** | `CanvasWidget` | Celoobrazovkové ESP překrytí s kreslením koster, projekcí ze světa na obrazovku, primitiva kruhů a čar |
| **COT** | `MapWidget` | Admin teleport přes `ScreenToMap()` při dvojkliku |
| **Expansion** | `MapWidget` | Vlastní systém značek s osobními/serverovými/party kategoriemi, omezení aktualizací na snímek |
| **Expansion** | `CanvasWidget` | Kreslení měřítkového pravítka vedle `MapWidget` |
| **Vanilla mapa** | `MapWidget` + `CanvasWidget` | Měřítkové pravítko vykreslené střídavými černými/šedými segmenty čar |
| **Vanilla prohlížení** | `ItemPreviewWidget` | 3D prohlížení předmětů s rotací tažením a přiblížením scrollem |
| **Vanilla inventář** | `PlayerPreviewWidget` | Náhled postavy se synchronizací výbavy a animacemi zranění |
| **Vanilla nápovědy** | `RichTextWidget` | Herní panel nápovědy s formátovaným textem popisu |
| **Vanilla menu** | `RichTextWidget` | Ikony tlačítek ovladače přes `InputUtils.GetRichtextButtonIconFromInputAction()` |
| **Vanilla knihy** | `HtmlWidget` | Načítání a stránkování `.html` textových souborů |
| **Vanilla hlavní menu** | `VideoWidget` | Onboarding video s callbackem při ukončení |
| **Vanilla render target** | `RenderTargetWidget` | Vykreslování kamery do widgetu s konfigurovatelnou obnovovací frekvencí |

---

## Časté chyby

**1. Použití RichTextWidget tam, kde stačí TextWidget.**
Parsování bohatého textu má režii. Pokud potřebujete pouze prostý text, použijte `TextWidget`.

**2. Zapomenutí volání Clear() na plátně.**
```c
// ŠPATNĚ - kresby se hromadí, zaplňují obrazovku
void Update(float dt)
{
    m_Canvas.DrawLine(0, 0, 100, 100, 1, COLOR_RED);
}

// SPRÁVNĚ
void Update(float dt)
{
    m_Canvas.Clear();
    m_Canvas.DrawLine(0, 0, 100, 100, 1, COLOR_RED);
}
```

**3. Kreslení za kamerou.**
```c
// ŠPATNĚ - kreslí čáry k objektům za vámi
vector screenPos = g_Game.GetScreenPosRelative(worldPos);
// Žádná kontrola hranic!

// SPRÁVNĚ
vector screenPos = g_Game.GetScreenPosRelative(worldPos);
if (screenPos[2] < 0)
    return;  // za kamerou
if (screenPos[0] < 0 || screenPos[0] > 1 || screenPos[1] < 0 || screenPos[1] > 1)
    return;  // mimo obrazovku
```

**4. Pokus o odstranění jedné značky mapy.**
Neexistuje `RemoveUserMark()`. Musíte zavolat `ClearUserMarks()` a znovu přidat všechny značky, které chcete zachovat.

**5. Nastavení předmětu ItemPreviewWidget na null bez kontroly.**
Vždy chraňte proti nulovým referencím entit před voláním `SetItem()`.

**6. Nenastavení ignorepointer na překryvných plátnech.**
Plátno bez `ignorepointer 1` zachytí všechny události myši, čímž udělá UI pod ním nereagující.

**7. Použití zpětných lomítek v cestách textur bez zdvojení.**
V řetězcích Enforce Scriptu musí být zpětná lomítka zdvojená:
```c
// ŠPATNĚ
"\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
// Toto je vlastně SPRÁVNĚ v Enforce Scriptu -- každé \\ produkuje jedno \
```

---

## Kompatibilita a dopad

| Widget | Pouze klient | Náklady na výkon | Kompatibilita modů |
|--------|------------|-----------------|-------------------|
| `RichTextWidget` | Ano | Nízké (parsování tagů) | Bezpečný, bez konfliktů |
| `CanvasWidget` | Ano | Střední (každý snímek) | Bezpečný pokud je nastaveno `ignorepointer` |
| `MapWidget` | Ano | Nízké-střední | Více modů může přidávat značky |
| `ItemPreviewWidget` | Ano | Střední (3D vykreslení) | Bezpečný, omezeno na widget |
| `PlayerPreviewWidget` | Ano | Střední (3D vykreslení) | Bezpečný, vytváří dummy hráče |
| `VideoWidget` | Ano | Vysoké (dekódování videa) | Jedno video najednou |
| `RenderTargetWidget` | Ano | Vysoké (3D vykreslení) | Možné konflikty kamer |
| `RTTextureWidget` | Ano | Nízké (texturový cíl) | Bezpečný |

Všechny tyto widgety jsou pouze na straně klienta. Nemají žádnou serverovou reprezentaci a nemohou být vytvořeny ani manipulovány ze serverových skriptů.

---

## Shrnutí

| Widget | Primární použití | Klíčové metody |
|--------|-----------|-------------|
| `RichTextWidget` | Formátovaný text s inline obrázky | `SetText()`, `GetContentHeight()`, `SetContentOffset()` |
| `HtmlWidget` | Načítání formátovaných textových souborů | `LoadFile()` |
| `CanvasWidget` | 2D překryvné kreslení | `DrawLine()`, `Clear()` |
| `MapWidget` | Mapa terénu se značkami | `AddUserMark()`, `ClearUserMarks()`, `ScreenToMap()`, `MapToScreen()` |
| `ItemPreviewWidget` | 3D zobrazení předmětu | `SetItem()`, `SetView()`, `SetModelOrientation()` |
| `PlayerPreviewWidget` | 3D zobrazení hráčské postavy | `SetPlayer()`, `Refresh()`, `UpdateItemInHands()` |
| `VideoWidget` | Přehrávání videa | `Load()`, `Play()`, `Pause()`, `SetCallback()` |
| `RenderTargetWidget` | Pohled 3D kamery v reálném čase | `SetRefresh()`, `SetResolutionScale()` + `SetWidgetWorld()` |
| `RTTextureWidget` | Cíl vykreslování do textury | Slouží jako zdroj textury pro `ImageWidget.SetImageTexture()` |

---

*Tato kapitola uzavírá sekci GUI systému. Všechny signatury API a vzory jsou potvrzeny z vanilla DayZ skriptů a zdrojového kódu skutečných modů.*
