# Kapitel 3.5: Programmatische Widget-Erstellung

[Startseite](../README.md) | [<< Zurück: Container-Widgets](04-containers.md) | **Programmatische Widget-Erstellung** | [Weiter: Event-Handling >>](06-event-handling.md)

---

Während `.layout`-Dateien der Standardweg sind, um UI-Strukturen zu definieren, können Sie Widgets auch vollständig aus dem Code heraus erstellen und konfigurieren. Das ist nützlich für dynamische UIs, prozedural generierte Elemente und Situationen, in denen das Layout zur Kompilierzeit nicht bekannt ist.

---

## Zwei Ansätze

DayZ bietet zwei Möglichkeiten, Widgets im Code zu erstellen:

1. **`CreateWidgets()`** -- Eine `.layout`-Datei laden und ihren Widget-Baum instanziieren
2. **`CreateWidget()`** -- Ein einzelnes Widget mit expliziten Parametern erstellen

Beide Methoden werden auf dem `WorkspaceWidget` aufgerufen, das über `GetGame().GetWorkspace()` abgerufen wird.

---

## CreateWidgets() -- Aus Layout-Dateien

Der häufigste Ansatz. Lädt eine `.layout`-Datei und erstellt den gesamten Widget-Baum, wobei dieser an ein Eltern-Widget angehängt wird.

```c
Widget root = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/gui/layouts/MyPanel.layout",   // Pfad zur Layout-Datei
    parentWidget                            // Eltern-Widget (oder null für Root)
);
```

Das zurückgegebene `Widget` ist das Wurzel-Widget aus der Layout-Datei. Sie können dann Kind-Widgets nach Namen suchen:

```c
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
title.SetText("Hello World");

ButtonWidget closeBtn = ButtonWidget.Cast(root.FindAnyWidget("CloseButton"));
```

### Mehrere Instanzen erstellen

Ein häufiges Muster ist das Erstellen mehrerer Instanzen einer Layout-Vorlage (z.B. Listeneinträge):

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

    container.Update();  // Layout-Neuberechnung erzwingen
}
```

---

## CreateWidget() -- Programmatische Erstellung

Erstellt ein einzelnes Widget mit explizitem Typ, Position, Größe, Flags und Eltern-Element.

```c
Widget w = GetGame().GetWorkspace().CreateWidget(
    FrameWidgetTypeID,      // Widget-Typ-ID-Konstante
    0,                       // X-Position
    0,                       // Y-Position
    100,                     // Breite
    100,                     // Höhe
    WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS,
    -1,                      // Farbe (ARGB-Integer, -1 = weiß/Standard)
    0,                       // Sortierreihenfolge (Priorität)
    parentWidget             // Eltern-Widget
);
```

### Parameter

| Parameter | Typ | Beschreibung |
|---|---|---|
| typeID | int | Widget-Typ-Konstante (z.B. `FrameWidgetTypeID`, `TextWidgetTypeID`) |
| x | float | X-Position (proportional oder pixelbasiert je nach Flags) |
| y | float | Y-Position |
| width | float | Widget-Breite |
| height | float | Widget-Höhe |
| flags | int | Bitweises ODER von `WidgetFlags`-Konstanten |
| color | int | ARGB-Farb-Integer (-1 für Standard/Weiß) |
| sort | int | Z-Reihenfolge (höhere Werte werden oben gerendert) |
| parent | Widget | Eltern-Widget zum Anhängen |

### Widget-Typ-IDs

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

Flags steuern das Widget-Verhalten bei programmatischer Erstellung. Kombinieren Sie sie mit bitweisem ODER (`|`).

| Flag | Wirkung |
|---|---|
| `WidgetFlags.VISIBLE` | Widget ist initial sichtbar |
| `WidgetFlags.IGNOREPOINTER` | Widget empfängt keine Maus-Events |
| `WidgetFlags.DRAGGABLE` | Widget kann gezogen werden |
| `WidgetFlags.EXACTSIZE` | Größenwerte sind in Pixeln (nicht proportional) |
| `WidgetFlags.EXACTPOS` | Positionswerte sind in Pixeln (nicht proportional) |
| `WidgetFlags.SOURCEALPHA` | Quell-Alphakanal verwenden |
| `WidgetFlags.BLEND` | Alpha-Blending aktivieren |
| `WidgetFlags.FLIPU` | Textur horizontal spiegeln |
| `WidgetFlags.FLIPV` | Textur vertikal spiegeln |

Häufige Flag-Kombinationen:

```c
// Sichtbar, pixelgroß, pixelpositioniert, alpha-geblendet
int FLAGS_EXACT = WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;

// Sichtbar, proportional, nicht-interaktiv
int FLAGS_OVERLAY = WidgetFlags.VISIBLE | WidgetFlags.IGNOREPOINTER | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;
```

Nach der Erstellung können Sie Flags dynamisch ändern:

```c
widget.SetFlags(WidgetFlags.VISIBLE);          // Ein Flag hinzufügen
widget.ClearFlags(WidgetFlags.IGNOREPOINTER);  // Ein Flag entfernen
int flags = widget.GetFlags();                  // Aktuelle Flags lesen
```

---

## Eigenschaften nach der Erstellung setzen

Nach dem Erstellen eines Widgets mit `CreateWidget()` müssen Sie es konfigurieren. Das Widget wird als Basistyp `Widget` zurückgegeben, daher müssen Sie zum spezifischen Typ casten.

### Namen setzen

```c
Widget w = GetGame().GetWorkspace().CreateWidget(TextWidgetTypeID, ...);
w.SetName("MyTextWidget");
```

Namen sind wichtig für `FindAnyWidget()`-Abfragen und das Debugging.

### Text setzen

```c
TextWidget tw = TextWidget.Cast(w);
tw.SetText("Hello World");
tw.SetTextExactSize(16);           // Schriftgröße in Pixeln
tw.SetOutline(1, ARGB(255, 0, 0, 0));  // 1px schwarzer Umriss
```

### Farbe setzen

Farben in DayZ verwenden das ARGB-Format (Alpha, Rot, Grün, Blau), gepackt in einen einzelnen 32-Bit-Integer:

```c
// ARGB-Hilfsfunktion verwenden (0-255 pro Kanal)
int red    = ARGB(255, 255, 0, 0);       // Deckendes Rot
int green  = ARGB(255, 0, 255, 0);       // Deckendes Grün
int blue   = ARGB(200, 0, 0, 255);       // Halbtransparentes Blau
int black  = ARGB(255, 0, 0, 0);         // Deckendes Schwarz
int white  = ARGB(255, 255, 255, 255);   // Deckendes Weiß (gleich wie -1)

// Float-Version verwenden (0.0-1.0 pro Kanal)
int color = ARGBF(1.0, 0.5, 0.25, 0.1);

// Farbe zurück in Floats zerlegen
float a, r, g, b;
InverseARGBF(color, a, r, g, b);

// Auf jedes Widget anwenden
widget.SetColor(ARGB(255, 100, 150, 200));
widget.SetAlpha(0.5);  // Nur das Alpha überschreiben
```

Das Hexadezimalformat `0xAARRGGBB` ist ebenfalls gebräuchlich:

```c
int color = 0xFF4B77BE;   // A=255, R=75, G=119, B=190
widget.SetColor(color);
```

### Event-Handler setzen

```c
widget.SetHandler(myEventHandler);  // ScriptedWidgetEventHandler-Instanz
```

### Benutzerdaten setzen

Beliebige Daten an ein Widget anhängen, um sie später abzurufen:

```c
widget.SetUserData(myDataObject);  // Muss von Managed erben

// Später abrufen:
Managed data;
widget.GetUserData(data);
MyDataClass myData = MyDataClass.Cast(data);
```

---

## Widget-Bereinigung

Widgets, die nicht mehr benötigt werden, müssen ordnungsgemäß bereinigt werden, um Speicherlecks zu vermeiden.

### Unlink()

Entfernt ein Widget von seinem Eltern-Element und zerstört es (und alle seine Kinder):

```c
widget.Unlink();
```

Nach dem Aufruf von `Unlink()` wird die Widget-Referenz ungültig. Setzen Sie sie auf `null`:

```c
widget.Unlink();
widget = null;
```

### Alle Kinder entfernen

Um ein Container-Widget von allen seinen Kindern zu befreien:

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

**Wichtig:** Sie müssen `GetSibling()` **vor** dem Aufruf von `Unlink()` aufrufen, da das Entfernen die Geschwisterkette des Widgets ungültig macht.

### Null-Prüfungen

Prüfen Sie Widgets immer auf null, bevor Sie sie verwenden. `FindAnyWidget()` gibt `null` zurück, wenn das Widget nicht gefunden wird, und Cast-Operationen geben `null` zurück, wenn der Typ nicht übereinstimmt:

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MaybeExists"));
if (tw)
{
    tw.SetText("Gefunden");
}
```

---

## Widget-Hierarchie-Navigation

Navigieren Sie den Widget-Baum aus dem Code:

```c
Widget parent = widget.GetParent();           // Eltern-Widget
Widget firstChild = widget.GetChildren();     // Erstes Kind
Widget nextSibling = widget.GetSibling();     // Nächstes Geschwister
Widget found = widget.FindAnyWidget("Name");  // Rekursive Suche nach Name

string name = widget.GetName();               // Widget-Name
string typeName = widget.GetTypeName();       // z.B. "TextWidget"
```

Alle Kinder durchlaufen:

```c
Widget child = parent.GetChildren();
while (child)
{
    // Kind verarbeiten
    Print("Kind: " + child.GetName());

    child = child.GetSibling();
}
```

Alle Nachkommen rekursiv durchlaufen:

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

## Vollständiges Beispiel: Dialog im Code erstellen

Hier ist ein vollständiges Beispiel, das einen einfachen Informationsdialog komplett im Code erstellt, ohne jegliche Layout-Datei:

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

        // Wurzel-Frame: 400x200 Pixel, auf dem Bildschirm zentriert
        m_Root = workspace.CreateWidget(
            FrameWidgetTypeID, 0, 0, 400, 200, FLAGS_EXACT,
            ARGB(230, 30, 30, 30), 100, null);

        // Manuell zentrieren
        int sw, sh;
        GetScreenSize(sw, sh);
        m_Root.SetScreenPos((sw - 400) / 2, (sh - 200) / 2);

        // Titeltext: volle Breite, 30px hoch, oben
        Widget titleW = workspace.CreateWidget(
            TextWidgetTypeID, 0, 0, 400, 30, FLAGS_EXACT,
            ARGB(255, 100, 160, 220), 0, m_Root);
        m_Title = TextWidget.Cast(titleW);
        m_Title.SetText(title);

        // Nachrichtentext: unter dem Titel, füllt den verbleibenden Platz
        Widget msgW = workspace.CreateWidget(
            TextWidgetTypeID, 10, 40, 380, 110, FLAGS_EXACT,
            ARGB(255, 200, 200, 200), 0, m_Root);
        m_Message = TextWidget.Cast(msgW);
        m_Message.SetText(message);

        // Schließen-Button: 80x30 Pixel, rechts unten
        Widget btnW = workspace.CreateWidget(
            ButtonWidgetTypeID, 310, 160, 80, 30, FLAGS_EXACT,
            ARGB(255, 80, 130, 200), 0, m_Root);
        m_CloseBtn = ButtonWidget.Cast(btnW);
        m_CloseBtn.SetText("Schließen");
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

// Verwendung:
SimpleCodeDialog dialog = new SimpleCodeDialog("Warnung", "Server-Neustart in 5 Minuten.");
```

---

## Widget-Pooling

Das Erstellen und Zerstören von Widgets in jedem Frame verursacht Leistungsprobleme. Stattdessen sollten Sie einen Pool wiederverwendbarer Widgets verwalten:

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

        // Widgets vorab erstellen
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

**Wann Pooling verwenden:**
- Listen, die häufig aktualisiert werden (Killfeed, Chat, Spielerliste)
- Raster mit dynamischem Inhalt (Inventar, Markt)
- Jede UI, die 10+ Widgets pro Sekunde erstellt/zerstört

**Wann KEIN Pooling verwenden:**
- Statische Panels, die einmal erstellt werden
- Dialoge, die ein-/ausgeblendet werden (einfach Show/Hide verwenden)

---

## Layout-Dateien vs. Programmatisch: Wann was verwenden

| Situation | Empfehlung |
|---|---|
| Statische UI-Struktur | Layout-Datei (`.layout`) |
| Komplexe Widget-Bäume | Layout-Datei |
| Dynamische Anzahl von Elementen | `CreateWidgets()` aus einer Vorlagen-Layout-Datei |
| Einfache Laufzeit-Elemente (Debug-Text, Marker) | `CreateWidget()` |
| Schnelles Prototyping | `CreateWidget()` |
| Produktions-Mod-UI | Layout-Datei + Code-Konfiguration |

In der Praxis verwenden die meisten Mods **Layout-Dateien** für die Struktur und **Code** zum Befüllen von Daten, Ein-/Ausblenden von Elementen und zur Event-Behandlung. Rein programmatische UIs sind außerhalb von Debug-Tools selten.

---

## Nächste Schritte

- [3.6 Event-Handling](06-event-handling.md) -- Klicks, Änderungen und Maus-Events verarbeiten
- [3.7 Styles, Schriftarten & Bilder](07-styles-fonts.md) -- Visuelle Gestaltung und Bildressourcen

---

## Theorie vs. Praxis

| Konzept | Theorie | Realität |
|---------|---------|---------|
| `CreateWidget()` erstellt jeden Widget-Typ | Alle TypeIDs funktionieren mit `CreateWidget()` | `ScrollWidget` und `WrapSpacerWidget`, die programmatisch erstellt werden, benötigen oft manuelle Flag-Einrichtung (`EXACTSIZE`, Größenangaben), die Layout-Dateien automatisch handhaben |
| `Unlink()` gibt allen Speicher frei | Widget und Kinder werden zerstört | Referenzen in Script-Variablen werden zu hängenden Zeigern. Setzen Sie Widget-Referenzen nach `Unlink()` immer auf `null`, sonst riskieren Sie Abstürze |
| `SetHandler()` leitet alle Events weiter | Ein Handler empfängt alle Widget-Events | Der Handler empfängt nur Events von Widgets, die `SetHandler(this)` aufgerufen haben. Kinder erben den Handler nicht vom Eltern-Element |
| `CreateWidgets()` aus Layout ist sofort | Layout wird synchron geladen | Große Layouts mit vielen verschachtelten Widgets verursachen einen Frame-Spike. Laden Sie Layouts während Ladebildschirmen vor, nicht während des Spiels |
| Proportionale Größenangabe (0.0-1.0) skaliert zum Eltern-Element | Werte sind relativ zu den Eltern-Dimensionen | Ohne `EXACTSIZE`-Flag werden selbst `CreateWidget()`-Werte wie `100` als proportional (0-1-Bereich) behandelt, wodurch Widgets das gesamte Eltern-Element ausfüllen |

---

## Kompatibilität & Auswirkungen

- **Multi-Mod:** Programmatisch erstellte Widgets sind privat für den erstellenden Mod. Anders als bei `modded class` gibt es kein Kollisionsrisiko, es sei denn, zwei Mods hängen Widgets an dasselbe Vanilla-Eltern-Widget nach Namen an.
- **Leistung:** Jeder `CreateWidgets()`-Aufruf parst die Layout-Datei von der Festplatte. Cachen Sie das Wurzel-Widget und blenden Sie es ein/aus, anstatt es bei jedem Öffnen der UI neu aus dem Layout zu erstellen.

---

## In echten Mods beobachtet

| Muster | Mod | Detail |
|---------|-----|--------|
| Layout-Vorlage + Code-Befüllung | COT, Expansion | Ein Zeilen-`.layout`-Template wird pro Listeneintrag über `CreateWidgets()` geladen und dann über `FindAnyWidget()` befüllt |
| Widget-Pooling für Killfeed | Colorful UI | Erstellt 20 Feed-Eintrags-Widgets im Voraus und blendet sie ein/aus, anstatt sie zu erstellen und zu zerstören |
| Reine Code-Dialoge | Debug/Admin-Tools | Einfache Warndialoge werden vollständig mit `CreateWidget()` erstellt, um das Mitliefern zusätzlicher `.layout`-Dateien zu vermeiden |
| `SetHandler(this)` auf jedem interaktiven Kind | VPP Admin Tools | Iteriert nach dem Layout-Laden alle Buttons und ruft auf jedem einzeln `SetHandler()` auf |
| `Unlink()` + null-Muster | DabsFramework | Jede `Close()`-Methode eines Dialogs ruft konsistent `m_Root.Unlink(); m_Root = null;` auf |
