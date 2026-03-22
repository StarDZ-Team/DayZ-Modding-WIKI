# Kapitel 3.10: Erweiterte Widgets

[Startseite](../README.md) | [<< Zurück: Echte Mod-UI-Muster](09-real-mod-patterns.md) | **Erweiterte Widgets**

---

Über die Standard-Container-, Text- und Bild-Widgets hinaus, die in früheren Kapiteln behandelt wurden, bietet DayZ spezialisierte Widget-Typen für Rich-Text-Formatierung, 2D-Canvas-Zeichnung, Kartenanzeige, 3D-Objektvorschauen, Videowiedergabe und Render-to-Texture. Diese Widgets ermöglichen Funktionen, die einfache Layouts nicht erreichen können.

Dieses Kapitel behandelt jeden erweiterten Widget-Typ mit bestätigten API-Signaturen, die aus Vanilla-Quellcode und realer Mod-Nutzung extrahiert wurden.

---

## RichTextWidget-Formatierung

`RichTextWidget` erweitert `TextWidget` und unterstützt Inline-Markup-Tags innerhalb seines Textinhalts. Es ist die primäre Methode, um formatierten Text mit eingebetteten Bildern, variablen Schriftgrößen und Zeilenumbrüchen anzuzeigen.

### Klassendefinition

```
// Aus scripts/1_core/proto/enwidgets.c
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

`RichTextWidget` erbt alle `TextWidget`-Methoden -- `SetText()`, `SetTextExactSize()`, `SetOutline()`, `SetShadow()`, `SetTextFormat()` und den Rest. Der Hauptunterschied ist, dass `SetText()` bei einem `RichTextWidget` Inline-Markup-Tags parst.

### Unterstützte Inline-Tags

Diese Tags sind durch Vanilla-DayZ-Nutzung in `news_feed.txt`, `InputUtils.c` und mehreren Menü-Scripts bestätigt.

#### Inline-Bild

```
<image set="IMAGESET_NAME" name="IMAGE_NAME" />
<image set="IMAGESET_NAME" name="IMAGE_NAME" scale="1.5" />
```

Bettet ein Bild aus einem benannten Imageset direkt in den Textfluss ein. Das `scale`-Attribut steuert die Bildgröße relativ zur Textzeilenhöhe.

Vanilla-Beispiel aus `scripts/data/news_feed.txt`:
```
<image set="dayz_gui" name="icon_pin" />  Welcome to DayZ!
```

Vanilla-Beispiel aus `scripts/3_game/tools/inpututils.c` -- Controller-Button-Icons erstellen:
```c
string icon = string.Format(
    "<image set=\"%1\" name=\"%2\" scale=\"%3\" />",
    imageSetName,
    iconName,
    1.21
);
richTextWidget.SetText(icon + " Press to confirm");
```

Häufige Imagesets in Vanilla DayZ:
- `dayz_gui` -- allgemeine UI-Icons (Pin, Benachrichtigungen)
- `dayz_inventory` -- Inventar-Slot-Icons (shoulderleft, hands, vest, etc.)
- `xbox_buttons` -- Xbox-Controller-Button-Bilder (A, B, X, Y)
- `playstation_buttons` -- PlayStation-Controller-Button-Bilder

#### Zeilenumbruch

```
</br>
```

Erzwingt einen Zeilenumbruch innerhalb des Rich-Text-Inhalts. Beachten Sie die schließende-Tag-Syntax -- so erwartet es der Parser von DayZ.

#### Schriftgröße / Überschrift

```
<h scale="0.8">Textinhalt hier</h>
<h scale="0.6">Kleinerer Textinhalt</h>
```

Umschließt Text in einem Überschriftsblock mit einem Skalierungsmultiplikator. Das `scale`-Attribut ist ein Float, der die Schriftgröße relativ zur Basisschrift des Widgets steuert. Größere Werte erzeugen größeren Text.

Vanilla-Beispiel aus `scripts/data/news_feed.txt`:
```
<h scale="0.8">
<image set="dayz_gui" name="icon_pin" />  Section Title
</h>
<h scale="0.6">
Body text at smaller size goes here.
</h>
</br>
```

### Praktische Nutzungsmuster

#### Eine RichTextWidget-Referenz erhalten

In Scripts casten Sie aus dem Layout genau wie bei jedem anderen Widget:

```c
RichTextWidget m_Label;
m_Label = RichTextWidget.Cast(root.FindAnyWidget("MyRichLabel"));
```

In `.layout`-Dateien verwenden Sie den Layout-Klassennamen:

```
RichTextWidgetClass MyRichLabel {
    position 0 0
    size 1 0.1
    text ""
}
```

#### Rich-Content mit Controller-Icons setzen

Die Vanilla-Klasse `InputUtils` bietet eine Hilfsfunktion, die den `<image>`-Tag-String für jede Eingabeaktion generiert:

```c
// Aus scripts/3_game/tools/inpututils.c
string buttonIcon = InputUtils.GetRichtextButtonIconFromInputAction(
    "UAUISelect",              // Name der Eingabeaktion
    "#menu_select",            // lokalisiertes Label
    EUAINPUT_DEVICE_CONTROLLER,
    InputUtils.ICON_SCALE_TOOLBAR  // 1.81 Skalierung
);
// Ergebnis: '<image set="xbox_buttons" name="A" scale="1.81" /> Select'

RichTextWidget toolbar = RichTextWidget.Cast(
    layoutRoot.FindAnyWidget("ToolbarText")
);
toolbar.SetText(buttonIcon);
```

Die zwei vordefinierten Skalierungskonstanten:
- `InputUtils.ICON_SCALE_NORMAL` = 1.21
- `InputUtils.ICON_SCALE_TOOLBAR` = 1.81

#### Scrollbarer Rich-Text-Inhalt

`RichTextWidget` stellt Inhaltshöhen- und Offset-Methoden für Seitennavigation oder Scrollen bereit:

```c
// Aus scripts/5_mission/gui/bookmenu.c
HtmlWidget m_content;  // HtmlWidget erweitert RichTextWidget
m_content.LoadFile(book.ConfigGetString("file"));

float totalHeight = m_content.GetContentHeight();
// Durch Inhalt blättern:
m_content.SetContentOffset(pageOffset, true);  // snapToLine = true
```

#### Text-Elision

Wenn Text einen Bereich mit fester Breite überläuft, können Sie ihn elidieren (mit einem Indikator abschneiden):

```c
// Zeile 0 auf maxWidth Pixel kürzen, "..." anhängen
richText.ElideText(0, maxWidth, "...");
```

#### Zeilensichtbarkeitssteuerung

Bestimmte Zeilenbereiche innerhalb des Inhalts anzeigen oder ausblenden:

```c
int lineCount = richText.GetNumLines();
// Alle Zeilen nach der 5. ausblenden
richText.SetLinesVisibility(5, lineCount - 1, false);
// Pixelbreite einer bestimmten Zeile ermitteln
float width = richText.GetLineWidth(2);
```

### HtmlWidget -- Erweitertes RichTextWidget

`HtmlWidget` erweitert `RichTextWidget` um eine einzige zusätzliche Methode:

```
class HtmlWidget extends RichTextWidget
{
    proto native void LoadFile(string path);
};
```

Wird vom Vanilla-Buchsystem verwendet, um `.html`-Textdateien zu laden:

```c
// Aus scripts/5_mission/gui/bookmenu.c
HtmlWidget content;
Class.CastTo(content, layoutRoot.FindAnyWidget("HtmlWidget"));
content.LoadFile(book.ConfigGetString("file"));
```

### RichTextWidget vs TextWidget -- Hauptunterschiede

| Funktion | TextWidget | RichTextWidget |
|----------|-----------|---------------|
| Inline-`<image>`-Tags | Nein | Ja |
| `<h>`-Überschrift-Tags | Nein | Ja |
| `</br>`-Zeilenumbrüche | Nein (verwende `\n`) | Ja |
| Inhalts-Scrolling | Nein | Ja (über Offset) |
| Zeilensichtbarkeit | Nein | Ja |
| Text-Elision | Nein | Ja |
| Leistung | Schneller | Langsamer (Tag-Parsing) |

Verwenden Sie `TextWidget` für einfache Beschriftungen. Verwenden Sie `RichTextWidget` nur, wenn Sie Inline-Bilder, formatierte Überschriften oder Inhalts-Scrolling benötigen.

---

## CanvasWidget-Zeichnung

`CanvasWidget` bietet 2D-Zeichnung im Sofortmodus auf dem Bildschirm. Es hat genau zwei native Methoden:

```
// Aus scripts/1_core/proto/enwidgets.c
class CanvasWidget extends Widget
{
    proto native void DrawLine(float x1, float y1, float x2, float y2,
                               float width, int color);
    proto native void Clear();
};
```

Das ist die gesamte API. Alle komplexen Formen -- Rechtecke, Kreise, Gitter -- müssen aus Liniensegmenten aufgebaut werden.

### Koordinatensystem

`CanvasWidget` verwendet **Bildschirm-Pixel-Koordinaten** relativ zu den eigenen Grenzen des Canvas-Widgets. Der Ursprung `(0, 0)` ist die obere linke Ecke des Canvas-Widgets.

Wenn der Canvas den gesamten Bildschirm ausfüllt (Position 0,0 Größe 1,1 im relativen Modus), dann werden die Koordinaten nach der Konvertierung aus der internen Größe des Widgets direkt auf Bildschirmpixel abgebildet.

### Layout-Einrichtung

In einer `.layout`-Datei:

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

Wichtige Flags:
- `ignorepointer 1` -- der Canvas blockiert keine Mauseingaben an Widgets darunter
- Die Größe `1 1` im relativen Modus bedeutet "übergeordnetes Element ausfüllen"

Im Script:

```c
CanvasWidget m_Canvas;
m_Canvas = CanvasWidget.Cast(
    root.FindAnyWidget("MyCanvas")
);
```

Oder aus einer Layout-Datei erstellen:

```c
// Aus COT: JM/COT/GUI/layouts/esp_canvas.layout
m_Canvas = CanvasWidget.Cast(
    g_Game.GetWorkspace().CreateWidgets("path/to/canvas.layout")
);
```

### Zeichengrundformen

#### Linien

```c
// Eine rote horizontale Linie zeichnen
m_Canvas.DrawLine(10, 50, 200, 50, 2, ARGB(255, 255, 0, 0));

// Eine weiße diagonale Linie zeichnen, 3 Pixel breit
m_Canvas.DrawLine(0, 0, 100, 100, 3, COLOR_WHITE);
```

Der `color`-Parameter verwendet das ARGB-Format: `ARGB(alpha, rot, grün, blau)`.

#### Rechtecke (aus Linien)

```c
void DrawRectangle(CanvasWidget canvas, float x, float y,
                   float w, float h, float lineWidth, int color)
{
    canvas.DrawLine(x, y, x + w, y, lineWidth, color);         // oben
    canvas.DrawLine(x + w, y, x + w, y + h, lineWidth, color); // rechts
    canvas.DrawLine(x + w, y + h, x, y + h, lineWidth, color); // unten
    canvas.DrawLine(x, y + h, x, y, lineWidth, color);         // links
}
```

#### Kreise (aus Liniensegmenten)

COT implementiert dieses Muster in `JMESPCanvas`:

```c
// Aus DayZ-CommunityOnlineTools/.../JMESPModule.c
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

Mehr Segmente erzeugen einen glatteren Kreis. 36 Segmente sind ein gängiger Standard.

### Muster für Neuzeichnung pro Frame

`CanvasWidget` arbeitet im Sofortmodus: Sie müssen jeden Frame `Clear()` aufrufen und neu zeichnen. Dies wird typischerweise in einem `Update()`- oder `OnUpdate()`-Callback gemacht.

Vanilla-Beispiel aus `scripts/5_mission/gui/mapmenu.c`:

```c
override void Update(float timeslice)
{
    super.Update(timeslice);
    m_ToolsScaleCellSizeCanvas.Clear();  // vorherigen Frame löschen

    // ... Maßstabslineal-Segmente zeichnen ...
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

### ESP-Overlay-Muster (aus COT)

COT (Community Online Tools) verwendet `CanvasWidget` als Vollbild-Overlay, um Skelett-Drahtgitter auf Spielern und Objekten zu zeichnen. Dies ist eines der anspruchsvollsten Canvas-Nutzungsmuster in jeder DayZ-Mod.

**Architektur:**

1. Ein Vollbild-`CanvasWidget` wird aus einer Layout-Datei erstellt
2. Jeden Frame wird `Clear()` aufgerufen
3. Welt-Raum-Positionen werden in Bildschirmkoordinaten umgerechnet
4. Linien werden zwischen Knochenpositionen gezeichnet, um Skelette zu rendern

**Welt-zu-Bildschirm-Konvertierung** (aus COTs `JMESPCanvas`):

```c
// Aus DayZ-CommunityOnlineTools/.../JMESPModule.c
vector TransformToScreenPos(vector worldPos, out bool isInBounds)
{
    float parentW, parentH;
    vector screenPos;

    // Relative Bildschirmposition ermitteln (0..1 Bereich)
    screenPos = g_Game.GetScreenPosRelative(worldPos);

    // Prüfen, ob die Position auf dem Bildschirm sichtbar ist
    isInBounds = screenPos[0] >= 0 && screenPos[0] <= 1
              && screenPos[1] >= 0 && screenPos[1] <= 1
              && screenPos[2] >= 0;

    // In Canvas-Pixel-Koordinaten umrechnen
    m_Canvas.GetScreenSize(parentW, parentH);
    screenPos[0] = screenPos[0] * parentW;
    screenPos[1] = screenPos[1] * parentH;

    return screenPos;
}
```

**Eine Linie von Weltposition A nach Weltposition B zeichnen:**

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

**Ein Spieler-Skelett zeichnen:**

```c
// Vereinfacht aus COTs JMESPSkeleton.Draw()
static void DrawSkeleton(Human human, CanvasWidget canvas)
{
    // Gliedmaßenverbindungen definieren (Knochenpaare)
    // neck->spine3, spine3->pelvis, neck->leftarm, etc.

    int color = COLOR_WHITE;
    switch (human.GetHealthLevel())
    {
        case GameConstants.STATE_DAMAGED:
            color = 0xFFDCDC00;  // gelb
            break;
        case GameConstants.STATE_BADLY_DAMAGED:
            color = 0xFFDC0000;  // rot
            break;
    }

    // Jedes Glied als Linie zwischen zwei Knochenpositionen zeichnen
    vector bone1Pos = human.GetBonePositionWS(
        human.GetBoneIndexByName("neck")
    );
    vector bone2Pos = human.GetBonePositionWS(
        human.GetBoneIndexByName("spine3")
    );
    // ... in Bildschirmkoordinaten umrechnen, dann DrawLine ...
}
```

### Vanilla Debug-Canvas

Die Engine bietet einen eingebauten Debug-Canvas über die `Debug`-Klasse:

```c
// Aus scripts/3_game/tools/debug.c
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

### Leistungsüberlegungen

- **Jeden Frame löschen und neu zeichnen.** `CanvasWidget` behält in den meisten Anwendungsfällen, in denen sich die Ansicht ändert (Kamerabewegung usw.), keinen Zustand zwischen Frames. Rufen Sie `Clear()` zu Beginn jedes Updates auf.
- **Linienanzahl minimieren.** Jeder `DrawLine()`-Aufruf hat Overhead. Verwenden Sie für komplexe Formen wie Kreise weniger Segmente (12-18) für entfernte Objekte, mehr (36) für nahe.
- **Bildschirmgrenzen zuerst prüfen.** Konvertieren Sie Weltpositionen in Bildschirmkoordinaten und überspringen Sie Objekte, die außerhalb des Bildschirms oder hinter der Kamera sind (`screenPos[2] < 0`).
- **`ignorepointer 1` verwenden.** Setzen Sie dieses Flag immer auf Canvas-Overlays, damit sie keine Mausereignisse abfangen.
- **Ein Canvas genügt.** Verwenden Sie einen einzigen Vollbild-Canvas für alle Overlay-Zeichnungen, anstatt mehrere Canvas-Widgets zu erstellen.

---

## MapWidget

`MapWidget` zeigt die DayZ-Geländekarte an und bietet Methoden zum Platzieren von Markierungen, zur Koordinatenumrechnung und zur Zoom-Steuerung.

### Klassendefinition

```
// Aus scripts/3_game/gameplay.c
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

### Das Map-Widget erhalten

In einer `.layout`-Datei platzieren Sie die Karte mit dem `MapWidgetClass`-Typ. Im Script erhalten Sie die Referenz durch Casting:

```c
MapWidget m_Map;
m_Map = MapWidget.Cast(layoutRoot.FindAnyWidget("Map"));
```

### Kartenkoordinaten vs. Weltkoordinaten

DayZ verwendet zwei Koordinatenräume:

- **Weltkoordinaten**: 3D-Vektoren in Metern. `x` = Ost/West, `y` = Höhe, `z` = Nord/Süd. Chernarus reicht ungefähr von 0-15360 auf x- und z-Achsen.
- **Bildschirmkoordinaten**: Pixel-Positionen auf dem Karten-Widget. Diese ändern sich, wenn der Benutzer schwenkt und zoomt.

Das `MapWidget` bietet Konvertierung zwischen diesen:

```c
// Weltposition zu Bildschirmpixel auf der Karte
vector screenPos = m_Map.MapToScreen(worldPosition);

// Bildschirmpixel auf der Karte zu Weltposition
vector worldPos = m_Map.ScreenToMap(Vector(screenX, screenY, 0));
```

### Markierungen hinzufügen

`AddUserMark()` platziert eine Markierung an einer Weltposition mit einem Label, einer Farbe und einer Icon-Textur:

```c
m_Map.AddUserMark(
    playerPos,                                   // vector: Weltposition
    "You",                                       // string: Label-Text
    COLOR_RED,                                   // int: ARGB-Farbe
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"  // string: Icon-Textur
);
```

Vanilla-Beispiel aus `scripts/5_mission/gui/scriptconsolegeneraltab.c`:

```c
// Spielerposition markieren
m_DebugMapWidget.AddUserMark(
    playerPos, "You", COLOR_RED,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);

// Andere Spieler markieren
m_DebugMapWidget.AddUserMark(
    rpd.m_Pos, rpd.m_Name + " " + dist + "m", COLOR_BLUE,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);

// Kameraposition markieren
m_DebugMapWidget.AddUserMark(
    cameraPos, "Camera", COLOR_GREEN,
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
);
```

Ein weiteres Vanilla-Beispiel aus `scripts/5_mission/gui/mapmenu.c` (auskommentiert, zeigt aber die API):

```c
m.AddUserMark("2681 4.7 1751", "Label1", ARGB(255,255,0,0),
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa");
m.AddUserMark("2683 4.7 1851", "Label2", ARGB(255,0,255,0),
    "\\dz\\gear\\navigation\\data\\map_bunker_ca.paa");
m.AddUserMark("2670 4.7 1651", "Label3", ARGB(255,0,0,255),
    "\\dz\\gear\\navigation\\data\\map_busstop_ca.paa");
```

### Markierungen löschen

`ClearUserMarks()` entfernt alle benutzersetzten Markierungen auf einmal. Es gibt keine Methode, um eine einzelne Markierung per Referenz zu entfernen. Das Standardmuster ist, alle Markierungen zu löschen und die gewünschten jeden Frame neu hinzuzufügen.

```c
// Aus scripts/5_mission/gui/scriptconsolesoundstab.c
override void Update(float timeslice)
{
    m_DebugMapWidget.ClearUserMarks();
    // Alle aktuellen Markierungen erneut hinzufügen
    m_DebugMapWidget.AddUserMark(playerPos, "You", COLOR_RED, iconPath);
}
```

### Verfügbare Karten-Markierungs-Icons

Das Vanilla-Spiel registriert diese Markierungs-Icon-Texturen in `scripts/5_mission/gui/mapmarkersinfo.c`:

| Enum-Konstante | Texturpfad |
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

Zugriff über Enum mit `MapMarkerTypes.GetMarkerTypeFromID(eMapMarkerTypes.MARKERTYPE_MAP_CAMP)`.

### Zoom- und Schwenk-Steuerung

```c
// Kartenmitte auf eine Weltposition setzen
m_Map.SetMapPos(playerWorldPos);

// Zoomstufe abrufen/setzen (0.0 = vollständig herausgezoomt, 1.0 = vollständig hineingezoomt)
float currentScale = m_Map.GetScale();
m_Map.SetScale(0.33);  // moderate Zoomstufe

// Karteninformationen abrufen
float contourInterval = m_Map.GetContourInterval();  // Meter zwischen Höhenlinien
float cellSize = m_Map.GetCellSize(legendWidth);      // Zellgröße für Maßstabslineal
```

### Karten-Klick-Behandlung

Behandeln Sie Mausklicks auf der Karte über die `OnDoubleClick`- oder `OnMouseButtonDown`-Callbacks eines `ScriptedWidgetEventHandler` oder `UIScriptedMenu`. Konvertieren Sie die Klickposition in Weltkoordinaten mit `ScreenToMap()`.

Vanilla-Beispiel aus `scripts/5_mission/gui/scriptconsolegeneraltab.c`:

```c
override bool OnDoubleClick(Widget w, int x, int y, int button)
{
    super.OnDoubleClick(w, x, y, button);

    if (w == m_DebugMapWidget)
    {
        // Bildschirmklick in Weltkoordinaten umrechnen
        vector worldPos = m_DebugMapWidget.ScreenToMap(Vector(x, y, 0));

        // Geländehöhe an dieser Position ermitteln
        float surfaceY = g_Game.SurfaceY(worldPos[0], worldPos[2]);
        float roadY = g_Game.SurfaceRoadY(worldPos[0], worldPos[2]);
        worldPos[1] = Math.Max(surfaceY, roadY);

        // Weltposition verwenden (z.B. Spieler teleportieren)
    }
    return false;
}
```

Aus `scripts/5_mission/gui/maphandler.c`:

```c
class MapHandler : ScriptedWidgetEventHandler
{
    override bool OnDoubleClick(Widget w, int x, int y, int button)
    {
        vector worldPos = MapWidget.Cast(w).ScreenToMap(Vector(x, y, 0));
        // Markierung platzieren, teleportieren, etc.
        return true;
    }
}
```

### Expansion-Karten-Markierungssystem

Die Expansion-Mod baut ein vollständiges Markierungssystem auf dem Vanilla-`MapWidget` auf. Wichtige Muster:

- Verwaltet separate Wörterbücher für persönliche, Server-, Gruppen- und Spielermarkierungen
- Begrenzt Markierungsaktualisierungen pro Frame (`m_MaxMarkerUpdatesPerFrame = 3`) für Leistung
- Zeichnet Maßstabslineal-Linien mit einem `CanvasWidget` neben der Karte
- Verwendet benutzerdefinierte Markierungs-Widget-Overlays, die über `MapToScreen()` positioniert werden, für reichhaltigere Markierungsvisualisierungen, als `AddUserMark()` unterstützt

Dieser Ansatz zeigt, dass Sie für komplexe Markierungs-UIs (Icons mit Tooltips, bearbeitbare Labels, farbige Kategorien) benutzerdefinierte Widgets überlagern sollten, die über `MapToScreen()` positioniert werden, anstatt sich ausschließlich auf `AddUserMark()` zu verlassen.

---

## ItemPreviewWidget

`ItemPreviewWidget` rendert eine 3D-Vorschau jeder `EntityAI` (Gegenstand, Waffe, Fahrzeug) innerhalb eines UI-Panels.

### Klassendefinition

```
// Aus scripts/3_game/gameplay.c
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

### View-Indizes

Der `viewIndex`-Parameter wählt aus, welche Bounding-Box und Kamerawinkel verwendet werden sollen. Diese sind pro Gegenstand in der Config des Gegenstands definiert:

- View 0: Standard (`boundingbox_min` + `boundingbox_max` + `invView`)
- View 1: Alternativ (`boundingbox_min2` + `boundingbox_max2` + `invView2`)
- View 2+: Zusätzliche Ansichten, falls definiert

Verwenden Sie `item.GetViewIndex()`, um die bevorzugte Ansicht des Gegenstands zu erhalten.

### Nutzungsmuster -- Gegenstandsinspektion

Aus `scripts/5_mission/gui/inspectmenunew.c`:

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

### Rotationssteuerung (Maus-Ziehen)

Das Standardmuster für interaktive Rotation:

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
    o[0] = o[0] + (m_RotationY - mouse_y);  // Neigung
    o[1] = o[1] - (m_RotationX - mouse_x);  // Gieren
    m_item_widget.SetModelOrientation(o);

    if (!is_dragging)
        m_Orientation = o;
}
```

### Zoom-Steuerung (Mausrad)

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

`PlayerPreviewWidget` rendert ein vollständiges 3D-Spielercharakter-Modell in der UI, komplett mit ausgerüsteten Gegenständen und Animationen.

### Klassendefinition

```
// Aus scripts/3_game/gameplay.c
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

### Nutzungsmuster -- Inventar-Charaktervorschau

Aus `scripts/5_mission/gui/inventorynew/playerpreview.c`:

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

### Ausrüstung aktuell halten

Die Methode `UpdateInterval()` hält die Vorschau mit der tatsächlichen Ausrüstung des Spielers synchron:

```c
override void UpdateInterval()
{
    // Gehaltenen Gegenstand aktualisieren
    m_CharacterPanelWidget.UpdateItemInHands(
        g_Game.GetPlayer().GetEntityInHands()
    );

    // Auf den Dummy-Spieler zugreifen für Animations-Synchronisation
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

### Rotation und Zoom

Die Rotations- und Zoom-Muster sind identisch mit `ItemPreviewWidget` -- verwenden Sie `SetModelOrientation()` mit Maus-Ziehen und `SetSize()` mit dem Mausrad. Siehe den vorherigen Abschnitt für den vollständigen Code.

---

## VideoWidget

`VideoWidget` gibt Videodateien in der UI wieder. Es unterstützt Wiedergabesteuerung, Schleifen, Suchen, Statusabfragen, Untertitel und Event-Callbacks.

### Klassendefinition

```
// Aus scripts/1_core/proto/enwidgets.c
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

### Nutzungsmuster -- Menü-Video

Aus `scripts/5_mission/gui/newui/mainmenu/mainmenuvideo.c`:

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

    // Callback registrieren für wenn das Video endet
    m_Video.SetCallback(VideoCallback.ON_END, StopVideo);

    return layoutRoot;
}

void StopVideo()
{
    // Video-Abschluss behandeln
    Close();
}
```

### Untertitel

Untertitel erfordern eine Schriftart, die dem `VideoWidget` im Layout zugewiesen ist. Untertiteldateien verwenden die Namenskonvention `videoName_Language.srt`, wobei die englische Version `videoName.srt` (ohne Sprachsuffix) heißt.

```c
// Untertitel sind standardmäßig aktiviert
m_Video.DisableSubtitles(false);  // explizit aktivieren
```

### Rückgabewerte

Die Methoden `Load()`, `Play()`, `Pause()` und `Stop()` geben `bool` zurück, aber dieser Rückgabewert ist **veraltet**. Verwenden Sie stattdessen `VideoCallback.ON_ERROR`, um Fehler zu erkennen.

---

## RenderTargetWidget und RTTextureWidget

Diese Widgets ermöglichen das Rendern einer 3D-Weltansicht in ein UI-Widget.

### Klassendefinitionen

```
// Aus scripts/1_core/proto/enwidgets.c
class RenderTargetWidget extends Widget
{
    proto native void SetRefresh(int period, int offset);
    proto native void SetResolutionScale(float xscale, float yscale);
};

class RTTextureWidget extends Widget
{
    // Keine zusätzlichen Methoden -- dient als Texturziel für Kinder
};
```

Die globale Funktion `SetWidgetWorld` bindet ein Render-Target an eine Welt und Kamera:

```
proto native void SetWidgetWorld(
    RenderTargetWidget w,
    IEntity worldEntity,
    int camera
);
```

### RenderTargetWidget

Rendert eine Kameraansicht aus einer `BaseWorld` in den Widget-Bereich. Verwendet für Überwachungskameras, Rückspiegel oder Bild-im-Bild-Anzeigen.

Aus `scripts/2_gamelib/entities/rendertarget.c`:

```c
// Render-Target programmatisch erstellen
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

// An die Spielwelt mit Kameraindex 0 binden
SetWidgetWorld(m_RenderWidget, g_Game.GetWorldEntity(), 0);
```

**Aktualisierungssteuerung:**

```c
// Jeden 2. Frame rendern (period=2, offset=0)
m_RenderWidget.SetRefresh(2, 0);

// Mit halber Auflösung rendern für bessere Leistung
m_RenderWidget.SetResolutionScale(0.5, 0.5);
```

### RTTextureWidget

`RTTextureWidget` hat keine script-seitigen Methoden über die von `Widget` geerbten hinaus. Es dient als Render-Target-Textur, in die Kind-Widgets gerendert werden können. Ein `ImageWidget` kann ein `RTTextureWidget` als seine Texturquelle über `SetImageTexture()` referenzieren:

```c
ImageWidget imgWidget;
RTTextureWidget rtTexture;
imgWidget.SetImageTexture(0, rtTexture);
```

---

## Best Practices

1. **Verwenden Sie das richtige Widget für den Zweck.** `TextWidget` für einfache Beschriftungen, `RichTextWidget` nur wenn Sie Inline-Bilder oder formatierten Inhalt benötigen. `CanvasWidget` für dynamische 2D-Overlays, nicht für statische Grafiken (verwenden Sie dafür `ImageWidget`).

2. **Canvas jeden Frame löschen.** Rufen Sie immer `Clear()` vor dem Neuzeichnen auf. Fehlendes Löschen bewirkt, dass sich Zeichnungen ansammeln und visuelle Artefakte entstehen.

3. **Bildschirmgrenzen für ESP/Overlay-Zeichnung prüfen.** Bevor Sie `DrawLine()` aufrufen, überprüfen Sie, ob beide Endpunkte auf dem Bildschirm sind. Zeichnungen außerhalb des Bildschirms sind verschwendete Arbeit.

4. **Kartenmarkierungen: Löschen-und-Neuaufbauen-Muster.** Es gibt keine `RemoveUserMark()`-Methode. Rufen Sie `ClearUserMarks()` auf und fügen Sie dann alle aktiven Markierungen bei jedem Update erneut hinzu. Dies ist das Muster, das jede Vanilla- und Mod-Implementierung verwendet.

5. **ItemPreviewWidget benötigt eine echte EntityAI.** Sie können keinen Klassennamen-String vorschauen -- Sie benötigen eine gespawnte Entitäts-Referenz. Für Inventarvorschauen verwenden Sie den tatsächlichen Inventargegenstand.

6. **PlayerPreviewWidget besitzt einen Dummy-Spieler.** Das Widget erstellt einen internen Dummy-`DayZPlayer`. Greifen Sie darauf über `GetDummyPlayer()` zu, um Animationen zu synchronisieren, aber zerstören Sie ihn nicht selbst.

7. **VideoWidget: Callbacks verwenden, nicht Rückgabewerte.** Die Bool-Rückgaben von `Load()`, `Play()`, etc. sind veraltet. Verwenden Sie `SetCallback(VideoCallback.ON_ERROR, handler)`.

8. **RenderTargetWidget-Leistung.** Verwenden Sie `SetRefresh()` mit period > 1, um Frames zu überspringen. Verwenden Sie `SetResolutionScale()`, um die Auflösung zu reduzieren. Diese Widgets sind ressourcenintensiv -- verwenden Sie sie sparsam.

---

## In echten Mods beobachtet

| Mod | Widget | Verwendung |
|-----|--------|-----------|
| **COT** | `CanvasWidget` | Vollbild-ESP-Overlay mit Skelettzeichnung, Welt-zu-Bildschirm-Projektion, Kreis- und Linienprimitiven |
| **COT** | `MapWidget` | Admin-Teleport über `ScreenToMap()` bei Doppelklick |
| **Expansion** | `MapWidget` | Benutzerdefiniertes Markierungssystem mit persönlichen/Server-/Gruppen-Kategorien, Aktualisierungsdrosselung pro Frame |
| **Expansion** | `CanvasWidget` | Karten-Maßstabslineal-Zeichnung neben `MapWidget` |
| **Vanilla Map** | `MapWidget` + `CanvasWidget` | Maßstabslineal gerendert mit abwechselnd schwarzen/grauen Liniensegmenten |
| **Vanilla Inspect** | `ItemPreviewWidget` | 3D-Gegenstandsinspektion mit Drag-Rotation und Scroll-Zoom |
| **Vanilla Inventory** | `PlayerPreviewWidget` | Charaktervorschau mit Ausrüstungssynchronisation und Verletzungsanimationen |
| **Vanilla Hints** | `RichTextWidget` | Ingame-Hinweis-Panel mit formatiertem Beschreibungstext |
| **Vanilla Menus** | `RichTextWidget` | Controller-Button-Icons über `InputUtils.GetRichtextButtonIconFromInputAction()` |
| **Vanilla Books** | `HtmlWidget` | Laden und Durchblättern von `.html`-Textdateien |
| **Vanilla Main Menu** | `VideoWidget` | Onboarding-Video mit End-Callback |
| **Vanilla Render Target** | `RenderTargetWidget` | Kamera-zu-Widget-Rendering mit konfigurierbarer Aktualisierungsrate |

---

## Häufige Fehler

**1. RichTextWidget verwenden, wo TextWidget ausreicht.**
Rich-Text-Parsing hat Overhead. Wenn Sie nur einfachen Text benötigen, verwenden Sie `TextWidget`.

**2. Vergessen, den Canvas mit Clear() zu löschen.**
```c
// FALSCH - Zeichnungen häufen sich an und füllen den Bildschirm
void Update(float dt)
{
    m_Canvas.DrawLine(0, 0, 100, 100, 1, COLOR_RED);
}

// RICHTIG
void Update(float dt)
{
    m_Canvas.Clear();
    m_Canvas.DrawLine(0, 0, 100, 100, 1, COLOR_RED);
}
```

**3. Hinter der Kamera zeichnen.**
```c
// FALSCH - zeichnet Linien zu Objekten hinter Ihnen
vector screenPos = g_Game.GetScreenPosRelative(worldPos);
// Keine Grenzenprüfung!

// RICHTIG
vector screenPos = g_Game.GetScreenPosRelative(worldPos);
if (screenPos[2] < 0)
    return;  // hinter der Kamera
if (screenPos[0] < 0 || screenPos[0] > 1 || screenPos[1] < 0 || screenPos[1] > 1)
    return;  // außerhalb des Bildschirms
```

**4. Versuchen, eine einzelne Kartenmarkierung zu entfernen.**
Es gibt kein `RemoveUserMark()`. Sie müssen `ClearUserMarks()` aufrufen und alle Markierungen, die Sie behalten möchten, erneut hinzufügen.

**5. ItemPreviewWidget-Item auf null setzen ohne Prüfung.**
Schützen Sie sich immer gegen null-Entitätsreferenzen, bevor Sie `SetItem()` aufrufen.

**6. ignorepointer auf Overlay-Canvases nicht setzen.**
Ein Canvas ohne `ignorepointer 1` fängt alle Mausereignisse ab und macht die UI darunter nicht ansprechbar.

**7. Backslashes in Texturpfaden ohne Verdopplung verwenden.**
In Enforce-Script-Strings müssen Backslashes verdoppelt werden:
```c
// FALSCH
"\\dz\\gear\\navigation\\data\\map_tree_ca.paa"
// Dies ist tatsächlich RICHTIG in Enforce Script -- jedes \\ erzeugt ein \
```

---

## Kompatibilität und Auswirkung

| Widget | Nur Client | Leistungskosten | Mod-Kompatibilität |
|--------|-----------|----------------|-------------------|
| `RichTextWidget` | Ja | Niedrig (Tag-Parsing) | Sicher, keine Konflikte |
| `CanvasWidget` | Ja | Mittel (pro Frame) | Sicher wenn `ignorepointer` gesetzt |
| `MapWidget` | Ja | Niedrig-Mittel | Mehrere Mods können Markierungen hinzufügen |
| `ItemPreviewWidget` | Ja | Mittel (3D-Render) | Sicher, widget-bezogen |
| `PlayerPreviewWidget` | Ja | Mittel (3D-Render) | Sicher, erstellt Dummy-Spieler |
| `VideoWidget` | Ja | Hoch (Video-Dekodierung) | Ein Video gleichzeitig |
| `RenderTargetWidget` | Ja | Hoch (3D-Render) | Kamerakonflikte möglich |
| `RTTextureWidget` | Ja | Niedrig (Texturziel) | Sicher |

Alle diese Widgets sind ausschließlich client-seitig. Sie haben keine server-seitige Darstellung und können nicht von Server-Scripts erstellt oder manipuliert werden.

---

## Zusammenfassung

| Widget | Hauptverwendung | Wichtige Methoden |
|--------|----------------|-------------------|
| `RichTextWidget` | Formatierter Text mit Inline-Bildern | `SetText()`, `GetContentHeight()`, `SetContentOffset()` |
| `HtmlWidget` | Formatierte Textdateien laden | `LoadFile()` |
| `CanvasWidget` | 2D-Zeichen-Overlay | `DrawLine()`, `Clear()` |
| `MapWidget` | Geländekarte mit Markierungen | `AddUserMark()`, `ClearUserMarks()`, `ScreenToMap()`, `MapToScreen()` |
| `ItemPreviewWidget` | 3D-Gegenstandsanzeige | `SetItem()`, `SetView()`, `SetModelOrientation()` |
| `PlayerPreviewWidget` | 3D-Spielercharakter-Anzeige | `SetPlayer()`, `Refresh()`, `UpdateItemInHands()` |
| `VideoWidget` | Videowiedergabe | `Load()`, `Play()`, `Pause()`, `SetCallback()` |
| `RenderTargetWidget` | Echtzeit-3D-Kameraansicht | `SetRefresh()`, `SetResolutionScale()` + `SetWidgetWorld()` |
| `RTTextureWidget` | Render-to-Texture-Ziel | Dient als Texturquelle für `ImageWidget.SetImageTexture()` |

---

*Dieses Kapitel schließt den GUI-System-Abschnitt ab. Alle API-Signaturen und Muster sind aus Vanilla-DayZ-Scripts und echtem Mod-Quellcode bestätigt.*
