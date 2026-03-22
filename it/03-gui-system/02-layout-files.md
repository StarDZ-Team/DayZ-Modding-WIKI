# Chapter 3.2: Layout File Format (.layout)

[Home](../README.md) | [<< Previous: Widget Types](01-widget-types.md) | **Layout File Format** | [Next: Sizing & Positioning >>](03-sizing-positioning.md)

---

## Struttura Base

A `.layout` file defines a tree of widgets. Every file has exactly one root widget, which contains nested children.

```
WidgetTypeClass WidgetName {
 attribute value
 attribute "quoted value"
 {
  ChildWidgetTypeClass ChildName {
   attribute value
  }
 }
}
```

Key rules:

1. The root element is always a single widget (typically `FrameWidgetClass`).
2. Widget type names use the **layout class** name, which always ends with `Class` (e.g., `FrameWidgetClass`, `TextWidgetClass`, `ButtonWidgetClass`).
3. Each widget has a unique name following its type class.
4. Attributes are `key value` pairs, one per line.
5. Attribute names containing spaces must be quoted: `"text halign" center`.
6. String values are quoted: `text "Hello World"`.
7. Numeric values are unquoted: `size 0.5 0.3`.
8. Children are nested inside `{ }` blocks after the parent's attributes.

---

## Riferimento degli Attributi

### Positioning & Sizing

| Attribute | Values | Descrizione |
|---|---|---|
| `position` | `x y` | Widget position (proportional 0-1 or pixel values) |
| `size` | `w h` | Widget dimensions (proportional 0-1 or pixel values) |
| `halign` | `left_ref`, `center_ref`, `right_ref` | Horizontal alignment reference point |
| `valign` | `top_ref`, `center_ref`, `bottom_ref` | Vertical alignment reference point |
| `hexactpos` | `0` or `1` | 0 = proportional X position, 1 = pixel X position |
| `vexactpos` | `0` or `1` | 0 = proportional Y position, 1 = pixel Y position |
| `hexactsize` | `0` or `1` | 0 = proportional width, 1 = pixel width |
| `vexactsize` | `0` or `1` | 0 = proportional height, 1 = pixel height |
| `fixaspect` | `fixwidth`, `fixheight` | Maintain aspect ratio by constraining one dimension |
| `scaled` | `0` or `1` | Scale with DayZ UI scaling setting |
| `priority` | integer | Z-order (higher values render on top) |

The `hexactpos`, `vexactpos`, `hexactsize`, and `vexactsize` flags are the most important attributes in the entire layout system. They control whether each dimension uses proportional (0.0 - 1.0 relative to parent) or pixel (absolute screen pixels) units. Vedi [3.3 Sizing & Positioning](03-sizing-positioning.md) for a thorough explanation.

### Visual Attributes

| Attribute | Values | Descrizione |
|---|---|---|
| `visible` | `0` or `1` | Initial visibility (0 = hidden) |
| `color` | `r g b a` | Color as four floats, each 0.0 to 1.0 |
| `style` | style name | Predefined visual style (e.g., `Default`, `Colorable`) |
| `draggable` | `0` or `1` | Widget can be dragged by the user |
| `clipchildren` | `0` or `1` | Clip child widgets to this widget's bounds |
| `inheritalpha` | `0` or `1` | Children inherit this widget's alpha value |
| `keepsafezone` | `0` or `1` | Keep widget within screen safe zone |

### Behavioral Attributes

| Attribute | Values | Descrizione |
|---|---|---|
| `ignorepointer` | `0` or `1` | Widget ignores mouse input (clicks pass through) |
| `disabled` | `0` or `1` | Widget is disabled |
| `"no focus"` | `0` or `1` | Widget cannot receive keyboard focus |

### Text Attributes

These apply to `TextWidgetClass`, `RichTextWidgetClass`, `MultilineTextWidgetClass`, `ButtonWidgetClass`, and other text-bearing widgets.

| Attribute | Values | Descrizione |
|---|---|---|
| `text` | `"string"` | Predefinito text content |
| `font` | `"path/to/font"` | Font file path |
| `"text halign"` | `left`, `center`, `right` | Horizontal text alignment within the widget |
| `"text valign"` | `top`, `center`, `bottom` | Vertical text alignment within the widget |
| `"bold text"` | `0` or `1` | Bold rendering |
| `"italic text"` | `0` or `1` | Italic rendering |
| `"exact text"` | `0` or `1` | Use exact pixel font size invece of proportional |
| `"exact text size"` | integer | Font size in pixels (requires `"exact text" 1`) |
| `"size to text h"` | `0` or `1` | Resize widget width to fit text |
| `"size to text v"` | `0` or `1` | Resize widget height to fit text |
| `"text sharpness"` | float | Text rendering sharpness |
| `wrap` | `0` or `1` | Enable word wrapping |

### Image Attributes

These apply to `ImageWidgetClass`.

| Attribute | Values | Descrizione |
|---|---|---|
| `image0` | `"set:name image:name"` | Principale image from an imageset |
| `mode` | `blend`, `additive`, `stretch` | Image blend mode |
| `"src alpha"` | `0` or `1` | Use the source alpha channel |
| `stretch` | `0` or `1` | Stretch image to fill widget |
| `filter` | `0` or `1` | Enable texture filtering |
| `"flip u"` | `0` or `1` | Flip image horizontally |
| `"flip v"` | `0` or `1` | Flip image vertically |
| `"clamp mode"` | `clamp`, `wrap` | Texture edge comportamento |
| `"stretch mode"` | `stretch_w_h`, etc. | Stretch mode |

### Spacer Attributes

These apply to `WrapSpacerWidgetClass` and `GridSpacerWidgetClass`.

| Attribute | Values | Descrizione |
|---|---|---|
| `Padding` | integer | Inner padding in pixels |
| `Margin` | integer | Space between child items in pixels |
| `"Size To Content H"` | `0` or `1` | Resize width to match children |
| `"Size To Content V"` | `0` or `1` | Resize height to match children |
| `content_halign` | `left`, `center`, `right` | Child content horizontal alignment |
| `content_valign` | `top`, `center`, `bottom` | Child content vertical alignment |
| `Columns` | integer | Grid columns (GridSpacer only) |
| `Rows` | integer | Grid rows (GridSpacer only) |

### Button Attributes

| Attribute | Values | Descrizione |
|---|---|---|
| `switch` | `toggle` | Makes the button a toggle (stays pressed) |
| `style` | style name | Visual style for the button |

### Slider Attributes

| Attribute | Values | Descrizione |
|---|---|---|
| `"fill in"` | `0` or `1` | Show a filled track behind the slider handle |
| `"listen to input"` | `0` or `1` | Respond to mouse input |

### Scroll Attributes

| Attribute | Values | Descrizione |
|---|---|---|
| `"Scrollbar V"` | `0` or `1` | Show vertical scrollbar |
| `"Scrollbar H"` | `0` or `1` | Show horizontal scrollbar |

---

## Integrazione con gli Script

### The `scriptclass` Attribute

The `scriptclass` attribute binds a widget to an Enforce Script class. When the layout is loaded, the engine creates an instance of that class and calls its `OnWidgetScriptInit(Widget w)` method.

```
FrameWidgetClass MyPanel {
 size 1 1
 scriptclass "MyPanelHandler"
}
```

The script class must inherit from `Managed` and implement `OnWidgetScriptInit`:

```c
class MyPanelHandler : Managed
{
    Widget m_Root;

    void OnWidgetScriptInit(Widget w)
    {
        m_Root = w;
    }
}
```

### The ScriptParamsClass Block

Parameters can be passed from the layout to the `scriptclass` via a `ScriptParamsClass` block. This block appears as a second `{ }` child block after the widget's children.

```
ImageWidgetClass Logo {
 image0 "set:dayz_gui image:DayZLogo"
 scriptclass "Bouncer"
 {
  ScriptParamsClass {
   amount 0.1
   speed 1
  }
 }
}
```

The script class reads these parameters in `OnWidgetScriptInit` by using the widget's script param system.

### DabsFramework ViewBinding

In mods that use DabsFramework MVC, the `scriptclass "ViewBinding"` pattern connects widgets to a ViewController's data properties:

```
TextWidgetClass StatusLabel {
 scriptclass "ViewBinding"
 "text halign" center
 {
  ScriptParamsClass {
   Binding_Name "StatusText"
   Two_Way_Binding 0
  }
 }
}
```

| Param | Descrizione |
|---|---|
| `Binding_Name` | Name of the ViewController property to bind to |
| `Two_Way_Binding` | `1` = UI changes push back to the controller |
| `Relay_Command` | Function name on the controller to call when the widget is clicked/changed |
| `Selected_Item` | Property to bind the selected item to (for lists) |
| `Debug_Logging` | `1` = enable verbose logging for this binding |

---

## Annidamento dei Widget Figli

Children are placed inside a `{ }` block after the parent's attributes. Multiple children can exist in the same block.

```
FrameWidgetClass Parent {
 size 1 1
 {
  TextWidgetClass Child1 {
   position 0 0
   size 1 0.1
   text "First"
  }
  TextWidgetClass Child2 {
   position 0 0.1
   size 1 0.1
   text "Second"
  }
 }
}
```

Children are always positioned relative to their parent. A child with `position 0 0` and `size 1 1` (proportional) fills its parent completely.

---

## Esempio Completo Annotato

Ecco un fully annotated layout file for a notification panel -- the kind of UI you might build for a mod:

```
// Root container -- invisible frame that covers 30% of screen width
// Centered horizontally, positioned at top of screen
FrameWidgetClass NotificationPanel {

 // Start hidden (script will show it)
 visible 0

 // Don't block mouse clicks on things behind this panel
 ignorepointer 1

 // Blue tint color (R=0.2, G=0.6, B=1.0, A=0.9)
 color 0.2 0.6 1.0 0.9

 // Position: 0 pixels from left, 0 pixels from top
 position 0 0
 hexactpos 1
 vexactpos 1

 // Size: 30% of parent width, 30 pixels tall
 size 0.3 30
 hexactsize 0
 vexactsize 1

 // Center horizontally within parent
 halign center_ref

 // Children block
 {
  // Text label fills the entire notification panel
  TextWidgetClass NotificationText {

   // Also ignore mouse input
   ignorepointer 1

   // Position at origin relative to parent
   position 0 0
   hexactpos 1
   vexactpos 1

   // Fill parent completely (proportional)
   size 1 1
   hexactsize 0
   vexactsize 0

   // Center the text both ways
   "text halign" center
   "text valign" center

   // Use a bold font
   font "gui/fonts/Metron-Bold"

   // Default text (will be overridden by script)
   text "Notification"
  }
 }
}
```

And here is a more complex example -- a dialog with a title bar, scrollable content, and a close button:

```
WrapSpacerWidgetClass MyDialog {
 clipchildren 1
 color 0.7059 0.7059 0.7059 0.7843
 size 0.35 0
 halign center_ref
 valign center_ref
 priority 998
 style Outline_1px_BlackBackground
 Padding 5
 "Size To Content H" 1
 "Size To Content V" 1
 content_halign center
 {
  // Title bar row
  FrameWidgetClass TitleBarRow {
   size 1 26
   hexactsize 0
   vexactsize 1
   draggable 1
   {
    PanelWidgetClass TitleBar {
     color 0.4196 0.6471 1 0.9412
     size 1 25
     style rover_sim_colorable
     {
      TextWidgetClass TitleText {
       size 0.85 0.9
       text "My Dialog"
       font "gui/fonts/Metron"
       "text halign" center
       "text valign" center
      }
      ButtonWidgetClass CloseBtn {
       size 0.15 0.9
       halign right_ref
       text "X"
      }
     }
    }
   }
  }

  // Scrollable content area
  ScrollWidgetClass ContentScroll {
   size 0.97 235
   hexactsize 0
   vexactsize 1
   "Scrollbar V" 1
   {
    WrapSpacerWidgetClass ContentItems {
     size 1 0
     hexactsize 0
     "Size To Content V" 1
    }
   }
  }
 }
}
```

---

## Errori comuni

1. **Dimenticare il suffisso `Class`** -- Nei layout, scrivi `TextWidgetClass`, non `TextWidget`.
2. **Mescolare valori proporzionali e in pixel** -- Se `hexactsize 0`, i valori di dimensione sono proporzionali 0.0-1.0. Se `hexactsize 1`, sono valori in pixel. Usare `300` in modalita proporzionale significa 300x la larghezza del genitore.
3. **Non quotare attributi con piu parole** -- Scrivi `"text halign" center`, non `text halign center`.
4. **Posizionare ScriptParamsClass nel blocco sbagliato** -- Deve essere in un blocco `{ }` separato dopo il blocco dei figli, non al suo interno.

---

## Migliori pratiche

- Imposta sempre tutti e quattro i flag exact (`hexactpos`, `vexactpos`, `hexactsize`, `vexactsize`) esplicitamente su ogni widget. Affidarsi ai valori predefiniti porta a layout ambigui che si rompono quando la struttura del genitore cambia.
- Usa `scriptclass` con parsimonia -- solo sui widget che necessitano veramente di comportamento guidato dallo script. Il binding eccessivo aggiunge overhead di inizializzazione.
- Nomina i widget in modo descrittivo (`PlayerListScroll`, `TitleBarClose`) piuttosto che generico (`Frame1`, `btn`). Il codice script usa `FindAnyWidget()` per nome, e le collisioni causano fallimenti silenziosi.
- Mantieni i file layout sotto le 200 righe. Dividi UI complesse in piu file `.layout` caricati con `CreateWidgets()` e collegati programmaticamente al genitore.
- Quota sempre i nomi di attributi multi-parola (`"text halign"`, `"Size To Content V"`). Gli attributi multi-parola non quotati falliscono silenziosamente senza errore.

---

## Teoria vs pratica

> Cosa dice la documentazione rispetto a come funzionano realmente le cose a runtime.

| Concetto | Teoria | Realta |
|----------|--------|--------|
| Inizializzazione `scriptclass` | `OnWidgetScriptInit` viene chiamata quando il layout si carica | Se la classe non eredita da `Managed` o ha un errore nel costruttore, il widget si carica ma il gestore e silenziosamente null |
| `ScriptParamsClass` | I parametri passano dati arbitrari alle classi script | Solo valori stringa e numerici funzionano in modo affidabile; oggetti annidati o array non sono supportati |
| Attributo `color` | Quattro float 0.0-1.0 (RGBA) | Alcuni tipi di widget ignorano il canale alfa o richiedono `inheritalpha 1` sul genitore per la propagazione della trasparenza |
| Predefiniti degli attributi | Gli attributi non documentati usano i predefiniti del motore | I predefiniti variano per tipo di widget |
| `"no focus"` | Impedisce il focus della tastiera | Impedisce anche la selezione col gamepad, il che puo interrompere la navigazione con controller se impostato su widget interattivi |

---

## Compatibilita e impatto

- **Multi-Mod:** I file layout sono isolati per mod -- nessun conflitto diretto. Tuttavia, i nomi `scriptclass` devono essere globalmente unici. Due mod che usano `scriptclass "PanelHandler"` causeranno il fallimento silenzioso di uno.
- **Prestazioni:** Ogni widget in un layout e un vero oggetto del motore. Layout con 500+ widget causano cali di frame misurabili. Per liste grandi, preferisci il pooling programmatico.
- **Versione:** Il formato layout e stabile da DayZ 1.0. Il blocco `ScriptParamsClass` e la scriptclass `ViewBinding` sono stati aggiunti da DabsFramework e non sono funzionalita vanilla.

---

## Osservato nei mod reali

| Pattern | Mod | Dettaglio |
|---------|-----|-----------|
| `scriptclass "ViewBinding"` con `ScriptParamsClass` | DabsFramework / DayZ Editor | Binding dati bidirezionale tra layout e ViewController tramite parametro `Binding_Name` |
| `WrapSpacerWidgetClass` come root del dialogo | COT, Expansion | Abilita `Size To Content V/H` per il dimensionamento automatico dei dialoghi attorno al contenuto dinamico |
| `.layout` separato per riga della lista | VPP Admin Tools | Ogni riga giocatore e un layout autonomo caricato in un WrapSpacer, abilitando riuso e pooling |
| `priority 998-999` per overlay modali | DabsFramework, COT | Assicura che i dialoghi si renderizzino sopra tutti gli altri elementi UI |

---

## Prossimi passi

- [3.3 Dimensionamento e posizionamento](03-sizing-positioning.md) -- Padroneggia il sistema di coordinate proporzionale vs. pixel
- [3.4 Widget contenitore](04-containers.md) -- Approfondimento sui widget spacer e scroll
