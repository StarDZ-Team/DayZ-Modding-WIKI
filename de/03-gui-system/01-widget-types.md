# Kapitel 3.1: Widget-Typen

[Startseite](../README.md) | **Widget-Typen** | [Weiter: Layout-Dateien >>](02-layout-files.md)

---

Das GUI-System von DayZ basiert auf Widgets -- wiederverwendbaren UI-Komponenten, die von einfachen Containern bis hin zu komplexen interaktiven Steuerelementen reichen. Jedes sichtbare Element auf dem Bildschirm ist ein Widget, und das Verständnis des gesamten Katalogs ist für den Aufbau von Mod-UIs unerlässlich.

Dieses Kapitel bietet eine vollständige Referenz aller Widget-Typen, die in Enforce Script verfügbar sind.

---

## Wie Widgets funktionieren

Jedes Widget in DayZ erbt von der Basisklasse `Widget`. Widgets sind in einer Eltern-Kind-Baumstruktur organisiert, wobei die Wurzel typischerweise ein `WorkspaceWidget` ist, das über `GetGame().GetWorkspace()` abgerufen wird.

Jeder Widget-Typ hat drei zugeordnete Bezeichner:

| Bezeichner | Beispiel | Verwendung |
|---|---|---|
| **Script-Klasse** | `TextWidget` | Code-Referenzen, Casting |
| **Layout-Klasse** | `TextWidgetClass` | Deklarationen in `.layout`-Dateien |
| **TypeID-Konstante** | `TextWidgetTypeID` | Programmatische Erstellung mit `CreateWidget()` |

In `.layout`-Dateien verwenden Sie immer den Layout-Klassennamen (Endung `Class`). In Skripten arbeiten Sie mit dem Script-Klassennamen.

---

## Container- / Layout-Widgets

Container-Widgets halten und organisieren Kind-Widgets. Sie zeigen selbst keinen Inhalt an (außer `PanelWidget`, das ein farbiges Rechteck zeichnet).

| Script-Klasse | Layout-Klasse | Zweck |
|---|---|---|
| `Widget` | `WidgetClass` | Abstrakte Basisklasse für alle Widgets. Niemals direkt instanziieren. |
| `WorkspaceWidget` | `WorkspaceWidgetClass` | Wurzel-Workspace. Wird über `GetGame().GetWorkspace()` abgerufen. Wird zum programmatischen Erstellen von Widgets verwendet. |
| `FrameWidget` | `FrameWidgetClass` | Allzweck-Container. Das am häufigsten verwendete Widget in DayZ. |
| `PanelWidget` | `PanelWidgetClass` | Einfarbiges Rechteck. Verwenden Sie es für Hintergründe, Trennlinien, Separatoren. |
| `WrapSpacerWidget` | `WrapSpacerWidgetClass` | Fließ-Layout. Ordnet Kinder sequentiell mit Umbruch, Innenabstand und Außenabstand an. |
| `GridSpacerWidget` | `GridSpacerWidgetClass` | Raster-Layout. Ordnet Kinder in einem Raster an, das durch `Columns` und `Rows` definiert wird. |
| `ScrollWidget` | `ScrollWidgetClass` | Scrollbarer Ansichtsbereich. Ermöglicht vertikales/horizontales Scrollen von Kindinhalten. |
| `SpacerBaseWidget` | -- | Abstrakte Basisklasse für `WrapSpacerWidget` und `GridSpacerWidget`. |

### FrameWidget

Das Arbeitspferd der DayZ-UI. Verwenden Sie `FrameWidget` als Ihren Standard-Container, wenn Sie Widgets gruppieren müssen. Es hat kein visuelles Erscheinungsbild -- es ist rein strukturell.

**Wichtige Methoden:**
- Alle Basis-`Widget`-Methoden (Position, Größe, Farbe, Kinder, Flags)

**Wann verwenden:** Fast überall. Fassen Sie Gruppen verwandter Widgets zusammen. Verwenden Sie es als Wurzel von Dialogen, Panels und HUD-Elementen.

```c
// Ein Frame-Widget nach Namen finden
FrameWidget panel = FrameWidget.Cast(root.FindAnyWidget("MyPanel"));
panel.Show(true);
```

### PanelWidget

Ein sichtbares Rechteck mit einer Volltonfarbe. Im Gegensatz zu `FrameWidget` zeichnet ein `PanelWidget` tatsächlich etwas auf den Bildschirm.

**Wichtige Methoden:**
- `SetColor(int argb)` -- Hintergrundfarbe setzen
- `SetAlpha(float alpha)` -- Transparenz setzen

**Wann verwenden:** Hintergründe hinter Text, farbige Trennlinien, Overlay-Rechtecke, Farbschichten.

```c
PanelWidget bg = PanelWidget.Cast(root.FindAnyWidget("Background"));
bg.SetColor(ARGB(200, 0, 0, 0));  // Halbtransparentes Schwarz
```

### WrapSpacerWidget

Ordnet Kinder automatisch in einem Fließ-Layout an. Kinder werden nacheinander platziert und umbrechen in die nächste Zeile, wenn der Platz nicht ausreicht.

**Wichtige Layout-Attribute:**
- `Padding` -- Innerer Abstand (Pixel)
- `Margin` -- Äußerer Abstand (Pixel)
- `"Size To Content H" 1` -- Breite an Kinder anpassen
- `"Size To Content V" 1` -- Höhe an Kinder anpassen
- `content_halign` -- Horizontale Ausrichtung des Inhalts (`left`, `center`, `right`)
- `content_valign` -- Vertikale Ausrichtung des Inhalts (`top`, `center`, `bottom`)

**Wann verwenden:** Dynamische Listen, Tag-Wolken, Schaltflächenreihen, jedes Layout, bei dem Kinder unterschiedliche Größen haben.

### GridSpacerWidget

Ordnet Kinder in einem festen Raster an. Jede Zelle hat die gleiche Größe.

**Wichtige Layout-Attribute:**
- `Columns` -- Anzahl der Spalten
- `Rows` -- Anzahl der Zeilen
- `Margin` -- Abstand zwischen den Zellen
- `"Size To Content V" 1` -- Höhe an Inhalt anpassen

**Wann verwenden:** Inventar-Raster, Symbol-Galerien, Einstellungs-Panels mit einheitlichen Zeilen.

### ScrollWidget

Bietet einen scrollbaren Ansichtsbereich für Inhalte, die den sichtbaren Bereich überschreiten.

**Wichtige Layout-Attribute:**
- `"Scrollbar V" 1` -- Vertikale Scrollleiste aktivieren
- `"Scrollbar H" 1` -- Horizontale Scrollleiste aktivieren

**Wichtige Methoden:**
- `VScrollToPos(float pos)` -- Zu einer vertikalen Position scrollen
- `GetVScrollPos()` -- Aktuelle vertikale Scroll-Position abrufen
- `GetContentHeight()` -- Gesamte Inhaltshöhe abrufen
- `VScrollStep(int step)` -- Um einen Schrittwert scrollen

**Wann verwenden:** Lange Listen, Konfigurations-Panels, Chat-Fenster, Log-Anzeigen.

---

## Anzeige-Widgets

Anzeige-Widgets zeigen dem Benutzer Inhalte an, sind aber nicht interaktiv.

| Script-Klasse | Layout-Klasse | Zweck |
|---|---|---|
| `TextWidget` | `TextWidgetClass` | Einzeilige Textanzeige |
| `MultilineTextWidget` | `MultilineTextWidgetClass` | Mehrzeiliger schreibgeschützter Text |
| `RichTextWidget` | `RichTextWidgetClass` | Text mit eingebetteten Bildern (`<image>`-Tags) |
| `ImageWidget` | `ImageWidgetClass` | Bildanzeige (aus Imagesets oder Dateien) |
| `CanvasWidget` | `CanvasWidgetClass` | Programmierbare Zeichenfläche |
| `VideoWidget` | `VideoWidgetClass` | Video-Wiedergabe |
| `RTTextureWidget` | `RTTextureWidgetClass` | Render-to-Texture-Oberfläche |
| `RenderTargetWidget` | `RenderTargetWidgetClass` | 3D-Szenen-Renderziel |
| `ItemPreviewWidget` | `ItemPreviewWidgetClass` | 3D-DayZ-Gegenstandsvorschau |
| `PlayerPreviewWidget` | `PlayerPreviewWidgetClass` | 3D-Spielercharakter-Vorschau |
| `MapWidget` | `MapWidgetClass` | Interaktive Weltkarte |

### TextWidget

Das häufigste Anzeige-Widget. Zeigt eine einzelne Textzeile an.

**Wichtige Methoden:**
```c
TextWidget tw;
tw.SetText("Hello World");
tw.GetText();                           // Gibt String zurück
tw.GetTextSize(out int w, out int h);   // Pixelmaße des gerenderten Texts
tw.SetTextExactSize(float size);        // Schriftgröße in Pixeln setzen
tw.SetOutline(int size, int color);     // Textumriss hinzufügen
tw.GetOutlineSize();                    // Gibt int zurück
tw.GetOutlineColor();                   // Gibt int (ARGB) zurück
tw.SetColor(int argb);                  // Textfarbe
```

**Wichtige Layout-Attribute:** `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `"size to text h"`, `"size to text v"`, `wrap`.

### MultilineTextWidget

Zeigt mehrere Zeilen schreibgeschützten Text an. Text wird automatisch basierend auf der Widget-Breite umgebrochen.

**Wann verwenden:** Beschreibungs-Panels, Hilfetexte, Log-Anzeigen.

### RichTextWidget

Unterstützt inline eingebettete Bilder innerhalb von Text mittels `<image>`-Tags. Unterstützt auch Textumbruch.

**Wichtige Layout-Attribute:**
- `wrap 1` -- Wortumbruch aktivieren

**Verwendung im Text:**
```
"Health: <image set:dayz_gui image:iconHealth0 /> OK"
```

**Wann verwenden:** Statustext mit Symbolen, formatierte Nachrichten, Chat mit eingebetteten Bildern.

### ImageWidget

Zeigt Bilder aus Imageset-Spriteblättern oder aus Dateipfaden geladene Bilder an.

**Wichtige Methoden:**
```c
ImageWidget iw;
iw.SetImage(int index);                    // Zwischen image0, image1 usw. wechseln
iw.LoadImageFile(int slot, string path);   // Bild aus Datei laden
iw.LoadMaskTexture(string path);           // Masken-Textur laden
iw.SetMaskProgress(float progress);        // 0-1 für Wisch-/Enthüllungsübergänge
```

**Wichtige Layout-Attribute:**
- `image0 "set:dayz_gui image:icon_refresh"` -- Bild aus einem Imageset
- `mode blend` -- Mischmodus (`blend`, `additive`, `stretch`)
- `"src alpha" 1` -- Quell-Alphakanal verwenden
- `stretch 1` -- Bild strecken, um Widget zu füllen
- `"flip u" 1` -- Horizontal spiegeln
- `"flip v" 1` -- Vertikal spiegeln

**Wann verwenden:** Symbole, Logos, Hintergründe, Kartenmarkierungen, Statusanzeigen.

### CanvasWidget

Eine Zeichenfläche, auf der Sie Linien programmatisch rendern können.

**Wichtige Methoden:**
```c
CanvasWidget cw;
cw.DrawLine(float x1, float y1, float x2, float y2, float width, int color);
cw.Clear();
```

**Wann verwenden:** Benutzerdefinierte Diagramme, Verbindungslinien zwischen Knoten, Debug-Overlays.

### MapWidget

Die vollständige interaktive Weltkarte. Unterstützt Schwenken, Zoomen und Koordinatenumrechnung.

**Wichtige Methoden:**
```c
MapWidget mw;
mw.SetMapPos(vector pos);              // Auf Weltposition zentrieren
mw.GetMapPos();                        // Aktuelle Mittelposition
mw.SetScale(float scale);             // Zoomstufe
mw.GetScale();                        // Aktueller Zoom
mw.MapToScreen(vector world_pos);     // Weltkoordinaten zu Bildschirmkoordinaten
mw.ScreenToMap(vector screen_pos);    // Bildschirmkoordinaten zu Weltkoordinaten
```

**Wann verwenden:** Missionskarten, GPS-Systeme, Standortauswahl.

### ItemPreviewWidget

Rendert eine 3D-Vorschau eines beliebigen DayZ-Inventargegenstands.

**Wann verwenden:** Inventar-Bildschirme, Beutevorschauen, Shop-Oberflächen.

### PlayerPreviewWidget

Rendert eine 3D-Vorschau des Spielercharakter-Modells.

**Wann verwenden:** Charakter-Erstellungsbildschirme, Ausrüstungsvorschau, Garderobensysteme.

### RTTextureWidget

Rendert seine Kinder auf eine Texturoberfläche anstatt direkt auf den Bildschirm.

**Wann verwenden:** Minimap-Rendering, Bild-im-Bild-Effekte, Offscreen-UI-Komposition.

---

## Interaktive Widgets

Interaktive Widgets reagieren auf Benutzereingaben und lösen Ereignisse aus.

| Script-Klasse | Layout-Klasse | Zweck |
|---|---|---|
| `ButtonWidget` | `ButtonWidgetClass` | Anklickbare Schaltfläche |
| `CheckBoxWidget` | `CheckBoxWidgetClass` | Boolesche Checkbox |
| `EditBoxWidget` | `EditBoxWidgetClass` | Einzeilige Texteingabe |
| `MultilineEditBoxWidget` | `MultilineEditBoxWidgetClass` | Mehrzeilige Texteingabe |
| `PasswordEditBoxWidget` | `PasswordEditBoxWidgetClass` | Maskierte Passworteingabe |
| `SliderWidget` | `SliderWidgetClass` | Horizontaler Schieberegler |
| `XComboBoxWidget` | `XComboBoxWidgetClass` | Dropdown-Auswahl |
| `TextListboxWidget` | `TextListboxWidgetClass` | Auswählbare Zeilenliste |
| `ProgressBarWidget` | `ProgressBarWidgetClass` | Fortschrittsanzeige |
| `SimpleProgressBarWidget` | `SimpleProgressBarWidgetClass` | Minimale Fortschrittsanzeige |

### ButtonWidget

Das primäre interaktive Steuerelement. Unterstützt sowohl momentane Klicks als auch Toggle-Modi.

**Wichtige Methoden:**
```c
ButtonWidget bw;
bw.SetText("Click Me");
bw.GetState();              // Gibt bool zurück (nur Toggle-Schaltflächen)
bw.SetState(bool state);    // Toggle-Zustand setzen
```

**Wichtige Layout-Attribute:**
- `text "Label"` -- Beschriftungstext der Schaltfläche
- `switch toggle` -- Als Toggle-Schaltfläche verwenden
- `style Default` -- Visueller Stil

**Ausgelöste Ereignisse:** `OnClick(Widget w, int x, int y, int button)`

### CheckBoxWidget

Ein boolesches Umschaltsteuerelement.

**Wichtige Methoden:**
```c
CheckBoxWidget cb;
cb.IsChecked();                 // Gibt bool zurück
cb.SetChecked(bool checked);    // Zustand setzen
```

**Ausgelöste Ereignisse:** `OnChange(Widget w, int x, int y, bool finished)`

### EditBoxWidget

Ein einzeiliges Texteingabefeld.

**Wichtige Methoden:**
```c
EditBoxWidget eb;
eb.GetText();               // Gibt String zurück
eb.SetText("default");      // Textinhalt setzen
```

**Ausgelöste Ereignisse:** `OnChange(Widget w, int x, int y, bool finished)` -- `finished` ist `true`, wenn Enter gedrückt wird.

### SliderWidget

Ein horizontaler Schieberegler für numerische Werte.

**Wichtige Methoden:**
```c
SliderWidget sw;
sw.GetCurrent();            // Gibt float zurück (0-1)
sw.SetCurrent(float val);   // Position setzen
```

**Wichtige Layout-Attribute:**
- `"fill in" 1` -- Gefüllte Spur hinter dem Griff anzeigen
- `"listen to input" 1` -- Auf Mauseingabe reagieren

**Ausgelöste Ereignisse:** `OnChange(Widget w, int x, int y, bool finished)` -- `finished` ist `true`, wenn der Benutzer den Schieberegler loslässt.

### XComboBoxWidget

Eine Dropdown-Auswahlliste.

**Wichtige Methoden:**
```c
XComboBoxWidget xcb;
xcb.AddItem("Option A");
xcb.AddItem("Option B");
xcb.SetCurrentItem(0);         // Nach Index auswählen
xcb.GetCurrentItem();          // Gibt ausgewählten Index zurück
xcb.ClearAll();                // Alle Einträge entfernen
```

### TextListboxWidget

Eine scrollbare Liste von Textzeilen. Unterstützt Auswahl und mehrspaltige Daten.

**Wichtige Methoden:**
```c
TextListboxWidget tlb;
tlb.AddItem("Row text", null, 0);   // Text, userData, Spalte
tlb.GetSelectedRow();               // Gibt int zurück (-1 wenn keine)
tlb.SetRow(int row);                // Eine Zeile auswählen
tlb.RemoveRow(int row);
tlb.ClearItems();
```

**Ausgelöste Ereignisse:** `OnItemSelected`

### ProgressBarWidget

Zeigt eine Fortschrittsanzeige an.

**Wichtige Methoden:**
```c
ProgressBarWidget pb;
pb.SetCurrent(float value);    // 0-100
```

**Wann verwenden:** Ladebalken, Gesundheitsbalken, Missionsfortschritt, Abklingzeit-Anzeigen.

---

## Vollständige TypeID-Referenz

Verwenden Sie diese Konstanten mit `GetGame().GetWorkspace().CreateWidget()` für die programmatische Widget-Erstellung:

```
FrameWidgetTypeID
TextWidgetTypeID
MultilineTextWidgetTypeID
MultilineEditBoxWidgetTypeID
RichTextWidgetTypeID
RenderTargetWidgetTypeID
ImageWidgetTypeID
VideoWidgetTypeID
RTTextureWidgetTypeID
ButtonWidgetTypeID
CheckBoxWidgetTypeID
SimpleProgressBarWidgetTypeID
ProgressBarWidgetTypeID
SliderWidgetTypeID
TextListboxWidgetTypeID
EditBoxWidgetTypeID
PasswordEditBoxWidgetTypeID
WorkspaceWidgetTypeID
GridSpacerWidgetTypeID
WrapSpacerWidgetTypeID
ScrollWidgetTypeID
```

---

## Das richtige Widget auswählen

| Ich muss... | Dieses Widget verwenden |
|---|---|
| Widgets gruppieren (unsichtbar) | `FrameWidget` |
| Ein farbiges Rechteck zeichnen | `PanelWidget` |
| Text anzeigen | `TextWidget` |
| Mehrzeiligen Text anzeigen | `MultilineTextWidget` oder `RichTextWidget` mit `wrap 1` |
| Text mit eingebetteten Symbolen anzeigen | `RichTextWidget` |
| Ein Bild/Symbol anzeigen | `ImageWidget` |
| Eine anklickbare Schaltfläche erstellen | `ButtonWidget` |
| Einen Umschalter (ein/aus) erstellen | `CheckBoxWidget` oder `ButtonWidget` mit `switch toggle` |
| Texteingabe akzeptieren | `EditBoxWidget` |
| Mehrzeilige Texteingabe akzeptieren | `MultilineEditBoxWidget` |
| Ein Passwort akzeptieren | `PasswordEditBoxWidget` |
| Den Benutzer eine Zahl wählen lassen | `SliderWidget` |
| Den Benutzer aus einer Liste wählen lassen | `XComboBoxWidget` (Dropdown) oder `TextListboxWidget` (sichtbare Liste) |
| Fortschritt anzeigen | `ProgressBarWidget` oder `SimpleProgressBarWidget` |
| Kinder in einem Fluss anordnen | `WrapSpacerWidget` |
| Kinder in einem Raster anordnen | `GridSpacerWidget` |
| Inhalt scrollbar machen | `ScrollWidget` |
| Ein 3D-Gegenstandsmodell anzeigen | `ItemPreviewWidget` |
| Das Spielermodell anzeigen | `PlayerPreviewWidget` |
| Die Weltkarte anzeigen | `MapWidget` |
| Benutzerdefinierte Linien/Formen zeichnen | `CanvasWidget` |
| Auf eine Textur rendern | `RTTextureWidget` |

---

## Nächste Schritte

- [3.2 Layout-Dateiformat](02-layout-files.md) -- Lernen Sie, wie Sie Widget-Bäume in `.layout`-Dateien definieren
- [3.5 Programmatische Widget-Erstellung](05-programmatic-widgets.md) -- Erstellen Sie Widgets aus Code statt aus Layout-Dateien

---

## Best Practices

- Verwenden Sie `FrameWidget` als Ihren Standard-Container. Verwenden Sie `PanelWidget` nur, wenn Sie einen sichtbaren farbigen Hintergrund benötigen.
- Bevorzugen Sie `RichTextWidget` gegenüber `TextWidget`, wenn Sie möglicherweise später eingebettete Symbole benötigen -- den Typ in einem bestehenden Layout zu wechseln ist mühsam.
- Führen Sie immer eine Null-Prüfung nach `FindAnyWidget()` und `Cast()` durch. Fehlende Widget-Namen geben stillschweigend `null` zurück und verursachen Abstürze beim nächsten Methodenaufruf.
- Verwenden Sie `WrapSpacerWidget` für dynamische Listen und `GridSpacerWidget` für feste Raster. Positionieren Sie Kinder in einem Fließ-Layout nicht manuell.
- Vermeiden Sie `CanvasWidget` für Produktions-UI -- es zeichnet jeden Frame neu und hat kein Batching. Verwenden Sie es nur für Debug-Overlays.

---

## Theorie vs. Praxis

| Konzept | Theorie | Realität |
|---------|--------|---------|
| `ScrollWidget` scrollt automatisch zum Inhalt | Scrollleiste erscheint, wenn Inhalt die Grenzen überschreitet | Sie müssen `VScrollToPos()` manuell aufrufen, um zu neuem Inhalt zu scrollen; das Widget scrollt nicht automatisch beim Hinzufügen von Kindern |
| `SliderWidget` löst kontinuierliche Ereignisse aus | `OnChange` wird bei jedem Pixel des Ziehens ausgelöst | Der `finished`-Parameter ist `false` während des Ziehens und `true` beim Loslassen; aktualisieren Sie aufwändige Logik nur wenn `finished == true` |
| `XComboBoxWidget` unterstützt viele Einträge | Dropdown funktioniert mit beliebiger Anzahl | Die Leistung verschlechtert sich merklich bei über 100 Einträgen; verwenden Sie stattdessen `TextListboxWidget` für lange Listen |
| `ItemPreviewWidget` zeigt jeden Gegenstand | Übergeben Sie einen beliebigen Klassennamen für die 3D-Vorschau | Das Widget erfordert, dass das `.p3d`-Modell des Gegenstands geladen ist; gemoddete Gegenstände benötigen ihr Data-PBO |
| `MapWidget` ist eine einfache Anzeige | Zeigt einfach die Karte | Es fängt standardmäßig alle Mauseingaben ab; Sie müssen `IGNOREPOINTER`-Flags sorgfältig verwalten, sonst blockiert es Klicks auf überlappende Widgets |

---

## Kompatibilität & Auswirkungen

- **Multi-Mod:** Widget-Typ-IDs sind Engine-Konstanten, die von allen Mods geteilt werden. Zwei Mods, die Widgets mit dem gleichen Namen unter dem gleichen Eltern-Widget erstellen, kollidieren. Verwenden Sie eindeutige Widget-Namen mit Ihrem Mod-Präfix.
- **Leistung:** `TextListboxWidget` und `ScrollWidget` mit Hunderten von Kindern verursachen Frame-Einbrüche. Verwenden Sie Widget-Pooling und recyceln Sie Widgets für Listen mit über 50 Einträgen.
