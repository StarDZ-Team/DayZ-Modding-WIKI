# Kapitel 3.7: Stile, Schriftarten & Bilder

[Startseite](../README.md) | [<< Zurück: Ereignisbehandlung](06-event-handling.md) | **Stile, Schriftarten & Bilder** | [Weiter: Dialoge & Modale >>](08-dialogs-modals.md)

---

Dieses Kapitel behandelt die visuellen Bausteine der DayZ-UI: vordefinierte Stile, Schriftartenverwendung, Textgrößen, Bild-Widgets mit ImageSet-Referenzen und wie du eigene ImageSets für deine Mod erstellst.

---

## Stile

Stile sind vordefinierte visuelle Erscheinungsbilder, die über das `style`-Attribut in Layout-Dateien auf Widgets angewendet werden können. Sie steuern die Hintergrunddarstellung, Rahmen und das allgemeine Aussehen, ohne dass eine manuelle Farb- und Bildkonfiguration erforderlich ist.

### Häufige eingebaute Stile

| Stilname | Beschreibung |
|---|---|
| `blank` | Kein Visuelles -- vollständig transparenter Hintergrund |
| `Empty` | Keine Hintergrunddarstellung |
| `Default` | Standard-Button/Widget-Stil mit typischem DayZ-Aussehen |
| `Colorable` | Stil, der mit `SetColor()` eingefärbt werden kann |
| `rover_sim_colorable` | Farbiges Panel, häufig für Hintergründe verwendet |
| `rover_sim_black` | Dunkler Panel-Hintergrund |
| `rover_sim_black_2` | Dunklere Panel-Variante |
| `Outline_1px_BlackBackground` | 1-Pixel-Umrandung mit solidem schwarzem Hintergrund |
| `OutlineFilled` | Umrandung mit gefülltem Inneren |
| `DayZDefaultPanelRight` | DayZ-Standard-Stil für rechtes Panel |
| `DayZNormal` | DayZ normaler Text-/Widget-Stil |
| `MenuDefault` | Standard-Menü-Button-Stil |

### Stile in Layouts verwenden

```
ButtonWidgetClass MyButton {
 style Default
 text "Click Me"
 size 120 30
 hexactsize 1
 vexactsize 1
}

PanelWidgetClass Background {
 style rover_sim_colorable
 color 0.2 0.3 0.5 0.9
 size 1 1
}
```

### Stil + Farbe Muster

Die `Colorable`- und `rover_sim_colorable`-Stile sind dafür ausgelegt, eingefärbt zu werden. Setze das `color`-Attribut im Layout oder rufe `SetColor()` im Code auf:

```
PanelWidgetClass TitleBar {
 style rover_sim_colorable
 color 0.4196 0.6471 1 0.9412
 size 1 30
 hexactsize 0
 vexactsize 1
}
```

```c
// Farbe zur Laufzeit ändern
PanelWidget bar = PanelWidget.Cast(root.FindAnyWidget("TitleBar"));
bar.SetColor(ARGB(240, 107, 165, 255));
```

### Stile in professionellen Mods

DabsFramework-Dialoge verwenden `Outline_1px_BlackBackground` für Dialog-Container:

```
WrapSpacerWidgetClass EditorDialog {
 style Outline_1px_BlackBackground
 Padding 5
 "Size To Content V" 1
}
```

Colorful UI verwendet `rover_sim_colorable` ausgiebig für thematische Panels, bei denen die Farbe durch einen zentralisierten Theme-Manager gesteuert wird.

---

## Schriftarten

DayZ enthält mehrere eingebaute Schriftarten. Schriftartpfade werden im `font`-Attribut angegeben.

### Eingebaute Schriftartpfade

| Schriftartpfad | Beschreibung |
|---|---|
| `"gui/fonts/Metron"` | Standard-UI-Schrift |
| `"gui/fonts/Metron28"` | Standardschrift, 28pt-Variante |
| `"gui/fonts/Metron-Bold"` | Fettdruck-Variante |
| `"gui/fonts/Metron-Bold58"` | Fettdruck 58pt-Variante |
| `"gui/fonts/sdf_MetronBook24"` | SDF-Schrift (Signed Distance Field) -- scharf bei jeder Größe |

### Schriftarten in Layouts verwenden

```
TextWidgetClass Title {
 text "Mission Briefing"
 font "gui/fonts/Metron-Bold"
 "text halign" center
 "text valign" center
}

TextWidgetClass Body {
 text "Objective: Secure the airfield"
 font "gui/fonts/Metron"
}
```

### Schriftarten im Code verwenden

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MyText"));
tw.SetText("Hello");
// Die Schriftart wird im Layout gesetzt, nicht zur Laufzeit per Skript änderbar
```

### SDF-Schriftarten

SDF-Schriftarten (Signed Distance Field) werden bei jeder Zoomstufe scharf dargestellt, was sie ideal für UI-Elemente macht, die in verschiedenen Größen erscheinen können. Die `sdf_MetronBook24`-Schrift ist die beste Wahl für Text, der über verschiedene UI-Skalierungseinstellungen scharf aussehen muss.

---

## Textgrößen: "exact text" vs. Proportional

DayZ-Text-Widgets unterstützen zwei Größenmodi, gesteuert durch das `"exact text"`-Attribut:

### Proportionaler Text (Standard)

Wenn `"exact text" 0` (der Standard) gesetzt ist, wird die Schriftgröße durch die Höhe des Widgets bestimmt. Der Text skaliert mit dem Widget. Dies ist das Standardverhalten.

```
TextWidgetClass ScalingText {
 size 1 0.05
 hexactsize 0
 vexactsize 0
 text "Ich skaliere mit meinem Eltern-Widget"
}
```

### Exakte Textgröße

Wenn `"exact text" 1` gesetzt ist, ist die Schriftgröße ein fester Pixelwert, festgelegt durch `"exact text size"`:

```
TextWidgetClass FixedText {
 size 1 30
 hexactsize 0
 vexactsize 1
 text "Ich bin immer 16 Pixel groß"
 "exact text" 1
 "exact text size" 16
}
```

### Wann was verwenden?

| Szenario | Empfehlung |
|---|---|
| HUD-Elemente, die mit der Bildschirmgröße skalieren | Proportional (Standard) |
| Menütext in einer bestimmten Größe | `"exact text" 1` mit `"exact text size"` |
| Text, der einer bestimmten Pixelgröße entsprechen muss | `"exact text" 1` |
| Text innerhalb von Spacern/Grids | Oft proportional, bestimmt durch Zellenhöhe |

### Textbezogene Größenattribute

| Attribut | Effekt |
|---|---|
| `"size to text h" 1` | Widget-Breite passt sich dem Text an |
| `"size to text v" 1` | Widget-Höhe passt sich dem Text an |
| `"text sharpness"` | Float-Wert zur Steuerung der Darstellungsschärfe |
| `wrap 1` | Zeilenumbruch für Text aktivieren, der die Widget-Breite überschreitet |

Die `"size to text"`-Attribute sind nützlich für Labels und Tags, bei denen das Widget genau so groß sein soll wie sein Textinhalt.

---

## Textausrichtung

Steuere, wo Text innerhalb seines Widgets erscheint, mit Ausrichtungsattributen:

```
TextWidgetClass CenteredLabel {
 text "Zentriert"
 "text halign" center
 "text valign" center
}
```

| Attribut | Werte | Effekt |
|---|---|---|
| `"text halign"` | `left`, `center`, `right` | Horizontale Textposition innerhalb des Widgets |
| `"text valign"` | `top`, `center`, `bottom` | Vertikale Textposition innerhalb des Widgets |

---

## Textumrandung

Füge Text Umrandungen hinzu für bessere Lesbarkeit auf unruhigen Hintergründen:

```c
TextWidget tw;
tw.SetOutline(1, ARGB(255, 0, 0, 0));   // 1px schwarze Umrandung

int size = tw.GetOutlineSize();           // Umrandungsgröße auslesen
int color = tw.GetOutlineColor();         // Umrandungsfarbe auslesen (ARGB)
```

---

## ImageWidget

`ImageWidget` zeigt Bilder aus zwei Quellen an: ImageSet-Referenzen und dynamisch geladene Dateien.

### ImageSet-Referenzen

Der gebräuchlichste Weg, Bilder anzuzeigen. Ein ImageSet ist ein Sprite-Atlas -- eine einzelne Texturdatei mit mehreren benannten Teilbildern.

In einer Layout-Datei:

```
ImageWidgetClass MyIcon {
 image0 "set:dayz_gui image:icon_refresh"
 mode blend
 "src alpha" 1
 stretch 1
}
```

Das Format ist `"set:<imageset_name> image:<image_name>"`.

Häufige Vanilla-ImageSets und Bilder:

```
"set:dayz_gui image:icon_pin"           -- Kartennadel-Symbol
"set:dayz_gui image:icon_refresh"       -- Aktualisieren-Symbol
"set:dayz_gui image:icon_x"            -- Schließen/X-Symbol
"set:dayz_gui image:icon_missing"      -- Warnung/fehlendes Symbol
"set:dayz_gui image:iconHealth0"       -- Gesundheit/Plus-Symbol
"set:dayz_gui image:DayZLogo"          -- DayZ-Logo
"set:dayz_gui image:Expand"            -- Erweiterungs-Pfeil
"set:dayz_gui image:Gradient"          -- Verlaufsstreifen
```

### Mehrere Bildslots

Ein einzelnes `ImageWidget` kann mehrere Bilder in verschiedenen Slots (`image0`, `image1`, etc.) halten und zwischen ihnen wechseln:

```
ImageWidgetClass StatusIcon {
 image0 "set:dayz_gui image:icon_missing"
 image1 "set:dayz_gui image:iconHealth0"
}
```

```c
ImageWidget icon;
icon.SetImage(0);    // image0 anzeigen (fehlendes Symbol)
icon.SetImage(1);    // image1 anzeigen (Gesundheitssymbol)
```

### Bilder aus Dateien laden

Lade Bilder dynamisch zur Laufzeit:

```c
ImageWidget img;
img.LoadImageFile(0, "MyMod/gui/textures/my_image.edds");
img.SetImage(0);
```

Der Pfad ist relativ zum Stammverzeichnis der Mod. Unterstützte Formate sind `.edds`, `.paa` und `.tga` (wobei `.edds` der Standard für DayZ ist).

### Bild-Mischmodi

Das `mode`-Attribut steuert, wie das Bild mit dem Hintergrund gemischt wird:

| Modus | Effekt |
|---|---|
| `blend` | Standard-Alpha-Mischung (am häufigsten) |
| `additive` | Farben werden addiert (Leuchteffekte) |
| `stretch` | Strecken zum Füllen ohne Mischung |

### Bild-Masken-Übergänge

`ImageWidget` unterstützt maskenbasierte Aufdeckungsübergänge:

```c
ImageWidget img;
img.LoadMaskTexture("gui/textures/mask_wipe.edds");
img.SetMaskProgress(0.5);  // 50% aufgedeckt
```

Dies ist nützlich für Ladebalken, Gesundheitsanzeigen und Aufdeckungsanimationen.

---

## ImageSet-Format

Eine ImageSet-Datei (`.imageset`) definiert benannte Bereiche innerhalb eines Sprite-Atlas-Textur. DayZ unterstützt zwei ImageSet-Formate.

### DayZ-natives Format

Verwendet von Vanilla-DayZ und den meisten Mods. Dies ist **kein** XML -- es verwendet das gleiche klammerbasierte Format wie Layout-Dateien.

```
ImageSetClass {
 Name "my_mod_icons"
 RefSize 1024 1024
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "MyMod/GUI/imagesets/my_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_sword {
   Name "icon_sword"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_shield {
   Name "icon_shield"
   Pos 64 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_potion {
   Name "icon_potion"
   Pos 128 0
   Size 64 64
   Flags 0
  }
 }
}
```

Wichtige Felder:
- `Name` -- ImageSet-Name (verwendet in `"set:<name>"`)
- `RefSize` -- Referenzgröße der Quelltextur in Pixeln (Breite Höhe)
- `path` -- Pfad zur Texturdatei (`.edds`)
- `mpix` -- Mipmap-Level (0 = Standardauflösung, 1 = 2x Auflösung)
- Jeder Bildeintrag definiert `Name`, `Pos` (x y in Pixeln) und `Size` (Breite Höhe in Pixeln)

### XML-Format

Einige Mods (einschließlich einiger DayZ Expansion-Module) verwenden ein XML-basiertes ImageSet-Format:

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="my_icons" file="MyMod/GUI/imagesets/my_icons.edds">
  <image name="icon_sword" pos="0 0" size="64 64" />
  <image name="icon_shield" pos="64 0" size="64 64" />
  <image name="icon_potion" pos="128 0" size="64 64" />
</imageset>
```

Beide Formate erreichen dasselbe. Das native Format wird von Vanilla-DayZ verwendet; das XML-Format ist manchmal einfacher von Hand zu lesen und zu bearbeiten.

---

## Eigene ImageSets erstellen

Um ein eigenes ImageSet für eine Mod zu erstellen:

### Schritt 1: Die Sprite-Atlas-Textur erstellen

Verwende einen Bildeditor (Photoshop, GIMP, etc.), um eine einzelne Textur zu erstellen, die alle deine Icons/Bilder auf einem Raster angeordnet enthält. Übliche Größen sind 256x256, 512x512 oder 1024x1024 Pixel.

Speichere als `.tga`, dann konvertiere zu `.edds` mit DayZ Tools (TexView2 oder dem ImageTool).

### Schritt 2: Die ImageSet-Datei erstellen

Erstelle eine `.imageset`-Datei, die benannte Bereiche auf Positionen in der Textur abbildet:

```
ImageSetClass {
 Name "mymod_icons"
 RefSize 512 512
 Textures {
  ImageSetTextureClass {
   mpix 0
   path "MyFramework/GUI/imagesets/mymod_icons.edds"
  }
 }
 Images {
  ImageSetDefClass icon_mission {
   Name "icon_mission"
   Pos 0 0
   Size 64 64
   Flags 0
  }
  ImageSetDefClass icon_waypoint {
   Name "icon_waypoint"
   Pos 64 0
   Size 64 64
   Flags 0
  }
 }
}
```

### Schritt 3: In config.cpp registrieren

Registriere das ImageSet in der `config.cpp` deiner Mod unter `CfgMods`:

```cpp
class CfgMods
{
    class MyMod
    {
        // ... andere Felder ...
        class defs
        {
            class imageSets
            {
                files[] = { "MyMod/GUI/imagesets/mymod_icons.imageset" };
            };
            // ... Skriptmodule ...
        };
    };
};
```

### Schritt 4: In Layouts und Code verwenden

In Layout-Dateien:

```
ImageWidgetClass MissionIcon {
 image0 "set:mymod_icons image:icon_mission"
 mode blend
 "src alpha" 1
}
```

Im Code:

```c
ImageWidget icon;
// Bilder aus registrierten ImageSets sind per set:name image:name verfügbar
// Kein zusätzlicher Ladeschritt nach der config.cpp-Registrierung nötig
```

---

## Farbthema-Muster

Professionelle Mods zentralisieren ihre Farbdefinitionen in einer Theme-Klasse und wenden Farben dann zur Laufzeit an. Dies macht es einfach, die gesamte UI umzugestalten, indem man eine einzige Datei ändert.

```c
class UIColor
{
    static int White()        { return ARGB(255, 255, 255, 255); }
    static int Black()        { return ARGB(255, 0, 0, 0); }
    static int Primary()      { return ARGB(255, 75, 119, 190); }
    static int Secondary()    { return ARGB(255, 60, 60, 60); }
    static int Accent()       { return ARGB(255, 100, 200, 100); }
    static int Danger()       { return ARGB(255, 200, 50, 50); }
    static int Transparent()  { return ARGB(1, 0, 0, 0); }
    static int SemiBlack()    { return ARGB(180, 0, 0, 0); }
}
```

Im Code anwenden:

```c
titleBar.SetColor(UIColor.Primary());
statusText.SetColor(UIColor.Accent());
errorText.SetColor(UIColor.Danger());
```

Dieses Muster (verwendet von Colorful UI, MyMod und anderen) bedeutet, dass die Änderung des gesamten UI-Farbschemas nur die Bearbeitung der Theme-Klasse erfordert.

---

## Übersicht der visuellen Attribute nach Widget-Typ

| Widget | Wichtige visuelle Attribute |
|---|---|
| Beliebiges Widget | `color`, `visible`, `style`, `priority`, `inheritalpha` |
| TextWidget | `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `wrap` |
| ImageWidget | `image0`, `mode`, `"src alpha"`, `stretch`, `"flip u"`, `"flip v"` |
| ButtonWidget | `text`, `style`, `switch toggle` |
| PanelWidget | `color`, `style` |
| SliderWidget | `"fill in"` |
| ProgressBarWidget | `style` |

---

## Bewährte Methoden

1. **Verwende ImageSet-Referenzen** anstelle direkter Dateipfade, wo möglich -- ImageSets werden von der Engine effizienter gebündelt.

2. **Verwende SDF-Schriften** (`sdf_MetronBook24`) für Text, der bei jeder Skalierung scharf aussehen muss.

3. **Verwende `"exact text" 1`** für UI-Text in bestimmten Pixelgrößen; verwende proportionalen Text für HUD-Elemente, die skalieren sollen.

4. **Zentralisiere Farben** in einer Theme-Klasse anstatt ARGB-Werte hart im gesamten Code zu kodieren.

5. **Setze `"src alpha" 1`** auf Bild-Widgets, um korrekte Transparenz zu erhalten.

6. **Registriere eigene ImageSets** in `config.cpp`, damit sie global verfügbar sind ohne manuelles Laden.

7. **Halte Sprite-Atlanten vernünftig dimensioniert** -- 512x512 oder 1024x1024 ist typisch. Größere Texturen verschwenden Speicher, wenn der Großteil des Platzes leer ist.

---

## Nächste Schritte

- [3.8 Dialoge & Modale](08-dialogs-modals.md) -- Popup-Fenster, Bestätigungsaufforderungen und Overlay-Panels
- [3.1 Widget-Typen](01-widget-types.md) -- Den vollständigen Widget-Katalog durchgehen
- [3.6 Ereignisbehandlung](06-event-handling.md) -- Deine gestylten Widgets interaktiv machen

---

## Theorie vs. Praxis

| Konzept | Theorie | Realität |
|---------|---------|---------|
| SDF-Schriften skalieren auf jede Größe | `sdf_MetronBook24` ist bei allen Größen scharf | Stimmt für Größen über ~10px. Darunter können SDF-Schriften im Vergleich zu Bitmap-Schriften bei ihrer nativen Größe unscharf wirken |
| `"exact text" 1` gibt pixelgenaue Größen | Schrift wird in der exakt angegebenen Pixelgröße gerendert | DayZ wendet interne Skalierung an, daher kann `"exact text size" 16` bei verschiedenen Auflösungen leicht unterschiedlich dargestellt werden. Teste bei 1080p und 1440p |
| Eingebaute Stile decken alle Bedürfnisse ab | `Default`, `blank`, `Colorable` reichen aus | Die meisten professionellen Mods definieren eigene `.styles`-Dateien, weil eingebaute Stile begrenzte visuelle Vielfalt bieten |
| ImageSet-XML und natives Format sind gleichwertig | Beide definieren Sprite-Bereiche | Das native Klammerformat wird von der Engine am schnellsten verarbeitet. XML-Format funktioniert, fügt aber einen Parsing-Schritt hinzu; verwende das native Format für die Produktion |
| `SetColor()` überschreibt die Layout-Farbe | Laufzeitfarbe ersetzt den Layout-Wert | `SetColor()` tönt das vorhandene Visuelle des Widgets. Bei gestylten Widgets multipliziert sich die Tönung mit der Grundfarbe des Stils, was unerwartete Ergebnisse produziert |

---

## Kompatibilität & Auswirkungen

- **Multi-Mod:** Stilnamen sind global. Wenn zwei Mods eine `.styles`-Datei registrieren, die denselben Stilnamen definiert, gewinnt die zuletzt geladene Mod. Versehe eigene Stilnamen mit deinem Mod-Bezeichner als Präfix (z.B. `MyMod_PanelDark`).
- **Leistung:** ImageSets werden beim Start einmalig in den GPU-Speicher geladen. Das Hinzufügen großer Sprite-Atlanten (2048x2048+) erhöht den VRAM-Verbrauch. Halte Atlanten bei 512x512 oder 1024x1024 und teile sie bei Bedarf auf mehrere ImageSets auf.
