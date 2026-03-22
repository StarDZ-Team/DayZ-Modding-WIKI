# Capitolo 3.7: Stili, Font e Immagini

[Home](../../README.md) | [<< Precedente: Gestione degli Eventi](06-event-handling.md) | **Stili, Font e Immagini** | [Successivo: Dialoghi e Modali >>](08-dialogs-modals.md)

---

Questo capitolo copre gli elementi visivi fondamentali dell'interfaccia DayZ: stili predefiniti, utilizzo dei font, dimensionamento del testo, widget immagine con riferimenti imageset e come creare imageset personalizzati per la tua mod.

---

## Stili

Gli stili sono aspetti visivi predefiniti che possono essere applicati ai widget tramite l'attributo `style` nei file di layout. Controllano il rendering dello sfondo, i bordi e l'aspetto generale senza richiedere configurazione manuale di colori e immagini.

### Stili Integrati Comuni

| Nome Stile | Descrizione |
|---|---|
| `blank` | Nessun aspetto visivo -- sfondo completamente trasparente |
| `Empty` | Nessun rendering dello sfondo |
| `Default` | Stile predefinito per pulsanti/widget con aspetto DayZ standard |
| `Colorable` | Stile che può essere tintato usando `SetColor()` |
| `rover_sim_colorable` | Stile pannello colorato, comunemente usato per gli sfondi |
| `rover_sim_black` | Sfondo pannello scuro |
| `rover_sim_black_2` | Variante pannello più scuro |
| `Outline_1px_BlackBackground` | Contorno di 1 pixel con sfondo nero pieno |
| `OutlineFilled` | Contorno con interno riempito |
| `DayZDefaultPanelRight` | Stile pannello destro predefinito di DayZ |
| `DayZNormal` | Stile normale testo/widget di DayZ |
| `MenuDefault` | Stile pulsante menu standard |

### Usare gli Stili nei Layout

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

### Pattern Stile + Colore

Gli stili `Colorable` e `rover_sim_colorable` sono progettati per essere tintati. Imposta l'attributo `color` nel layout o chiama `SetColor()` nel codice:

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
// Cambia colore a runtime
PanelWidget bar = PanelWidget.Cast(root.FindAnyWidget("TitleBar"));
bar.SetColor(ARGB(240, 107, 165, 255));
```

### Stili nelle Mod Professionali

I dialoghi di DabsFramework usano `Outline_1px_BlackBackground` per i contenitori dei dialoghi:

```
WrapSpacerWidgetClass EditorDialog {
 style Outline_1px_BlackBackground
 Padding 5
 "Size To Content V" 1
}
```

Colorful UI usa `rover_sim_colorable` estensivamente per pannelli tematici dove il colore è controllato da un gestore di temi centralizzato.

---

## Font

DayZ include diversi font integrati. I percorsi dei font sono specificati nell'attributo `font`.

### Percorsi dei Font Integrati

| Percorso Font | Descrizione |
|---|---|
| `"gui/fonts/Metron"` | Font UI standard |
| `"gui/fonts/Metron28"` | Font standard, variante 28pt |
| `"gui/fonts/Metron-Bold"` | Variante grassetto |
| `"gui/fonts/Metron-Bold58"` | Variante grassetto 58pt |
| `"gui/fonts/sdf_MetronBook24"` | Font SDF (Signed Distance Field) -- nitido a qualsiasi dimensione |

### Usare i Font nei Layout

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

### Usare i Font nel Codice

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MyText"));
tw.SetText("Hello");
// Il font è impostato nel layout, non modificabile a runtime tramite script
```

### Font SDF

I font SDF (Signed Distance Field) si renderizzano nitidamente a qualsiasi livello di zoom, rendendoli ideali per elementi UI che possono apparire a varie dimensioni. Il font `sdf_MetronBook24` è la scelta migliore per il testo che deve apparire nitido con diverse impostazioni di scala dell'interfaccia.

---

## Dimensionamento del Testo: "exact text" vs. Proporzionale

I widget di testo DayZ supportano due modalità di dimensionamento, controllate dall'attributo `"exact text"`:

### Testo Proporzionale (Predefinito)

Quando `"exact text" 0` (il predefinito), la dimensione del font è determinata dall'altezza del widget. Il testo si scala con il widget. Questo è il comportamento predefinito.

```
TextWidgetClass ScalingText {
 size 1 0.05
 hexactsize 0
 vexactsize 0
 text "I scale with my parent"
}
```

### Dimensione Esatta del Testo

Quando `"exact text" 1`, la dimensione del font è un valore fisso in pixel impostato da `"exact text size"`:

```
TextWidgetClass FixedText {
 size 1 30
 hexactsize 0
 vexactsize 1
 text "I am always 16 pixels"
 "exact text" 1
 "exact text size" 16
}
```

### Quale Usare?

| Scenario | Raccomandazione |
|---|---|
| Elementi HUD che si scalano con la dimensione dello schermo | Proporzionale (predefinito) |
| Testo menu a una dimensione specifica | `"exact text" 1` con `"exact text size"` |
| Testo che deve corrispondere a una dimensione pixel specifica del font | `"exact text" 1` |
| Testo all'interno di spacer/griglie | Spesso proporzionale, determinato dall'altezza della cella |

### Attributi di Dimensione Relativi al Testo

| Attributo | Effetto |
|---|---|
| `"size to text h" 1` | La larghezza del widget si adatta al testo |
| `"size to text v" 1` | L'altezza del widget si adatta al testo |
| `"text sharpness"` | Valore float che controlla la nitidezza del rendering |
| `wrap 1` | Abilita l'a capo delle parole per il testo che eccede la larghezza del widget |

Gli attributi `"size to text"` sono utili per etichette e tag dove il widget deve essere esattamente grande quanto il suo contenuto testuale.

---

## Allineamento del Testo

Controlla dove il testo appare all'interno del suo widget usando gli attributi di allineamento:

```
TextWidgetClass CenteredLabel {
 text "Centered"
 "text halign" center
 "text valign" center
}
```

| Attributo | Valori | Effetto |
|---|---|---|
| `"text halign"` | `left`, `center`, `right` | Posizione orizzontale del testo nel widget |
| `"text valign"` | `top`, `center`, `bottom` | Posizione verticale del testo nel widget |

---

## Contorno del Testo

Aggiungi contorni al testo per la leggibilità su sfondi movimentati:

```c
TextWidget tw;
tw.SetOutline(1, ARGB(255, 0, 0, 0));   // Contorno nero di 1px

int size = tw.GetOutlineSize();           // Leggi la dimensione del contorno
int color = tw.GetOutlineColor();         // Leggi il colore del contorno (ARGB)
```

---

## ImageWidget

`ImageWidget` visualizza immagini da due fonti: riferimenti imageset e file caricati dinamicamente.

### Riferimenti Imageset

Il modo più comune per visualizzare immagini. Un imageset è un atlante di sprite -- un singolo file texture con più sotto-immagini nominate.

In un file di layout:

```
ImageWidgetClass MyIcon {
 image0 "set:dayz_gui image:icon_refresh"
 mode blend
 "src alpha" 1
 stretch 1
}
```

Il formato è `"set:<nome_imageset> image:<nome_immagine>"`.

Imageset e immagini vanilla comuni:

```
"set:dayz_gui image:icon_pin"           -- Icona puntina mappa
"set:dayz_gui image:icon_refresh"       -- Icona aggiornamento
"set:dayz_gui image:icon_x"            -- Icona chiudi/X
"set:dayz_gui image:icon_missing"      -- Icona avviso/mancante
"set:dayz_gui image:iconHealth0"       -- Icona salute/più
"set:dayz_gui image:DayZLogo"          -- Logo DayZ
"set:dayz_gui image:Expand"            -- Freccia espandi
"set:dayz_gui image:Gradient"          -- Striscia sfumatura
```

### Slot Immagine Multipli

Un singolo `ImageWidget` può contenere più immagini in slot diversi (`image0`, `image1`, ecc.) e alternare tra esse:

```
ImageWidgetClass StatusIcon {
 image0 "set:dayz_gui image:icon_missing"
 image1 "set:dayz_gui image:iconHealth0"
}
```

```c
ImageWidget icon;
icon.SetImage(0);    // Mostra image0 (icona mancante)
icon.SetImage(1);    // Mostra image1 (icona salute)
```

### Caricamento Immagini da File

Carica immagini dinamicamente a runtime:

```c
ImageWidget img;
img.LoadImageFile(0, "MyMod/gui/textures/my_image.edds");
img.SetImage(0);
```

Il percorso è relativo alla directory radice della mod. I formati supportati includono `.edds`, `.paa` e `.tga` (anche se `.edds` è lo standard per DayZ).

### Modalità di Fusione Immagine

L'attributo `mode` controlla come l'immagine si fonde con ciò che c'è dietro:

| Modalità | Effetto |
|---|---|
| `blend` | Alpha blending standard (più comune) |
| `additive` | I colori si sommano (effetti luminosi) |
| `stretch` | Estendi per riempire senza blending |

### Transizioni con Maschera Immagine

`ImageWidget` supporta transizioni di rivelazione basate su maschera:

```c
ImageWidget img;
img.LoadMaskTexture("gui/textures/mask_wipe.edds");
img.SetMaskProgress(0.5);  // 50% rivelato
```

Questo è utile per barre di caricamento, visualizzazioni della salute e animazioni di rivelazione.

---

## Formato ImageSet

Un file imageset (`.imageset`) definisce regioni nominate all'interno di una texture atlante di sprite. DayZ supporta due formati imageset.

### Formato Nativo DayZ

Usato da DayZ vanilla e dalla maggior parte delle mod. Questo **non** è XML -- usa lo stesso formato delimitato da parentesi graffe dei file di layout.

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

Campi principali:
- `Name` -- Nome dell'imageset (usato in `"set:<nome>"`)
- `RefSize` -- Dimensione di riferimento della texture sorgente in pixel (larghezza altezza)
- `path` -- Percorso al file texture (`.edds`)
- `mpix` -- Livello mipmap (0 = risoluzione standard, 1 = risoluzione 2x)
- Ogni voce immagine definisce `Name`, `Pos` (x y in pixel) e `Size` (larghezza altezza in pixel)

### Formato XML

Alcune mod (inclusi alcuni moduli di DayZ Expansion) usano un formato imageset basato su XML:

```xml
<?xml version="1.0" encoding="utf-8"?>
<imageset name="my_icons" file="MyMod/GUI/imagesets/my_icons.edds">
  <image name="icon_sword" pos="0 0" size="64 64" />
  <image name="icon_shield" pos="64 0" size="64 64" />
  <image name="icon_potion" pos="128 0" size="64 64" />
</imageset>
```

Entrambi i formati ottengono lo stesso risultato. Il formato nativo è usato da DayZ vanilla; il formato XML è talvolta più facile da leggere e modificare a mano.

---

## Creare Imageset Personalizzati

Per creare il tuo imageset per una mod:

### Passo 1: Creare la Texture Atlante di Sprite

Usa un editor di immagini (Photoshop, GIMP, ecc.) per creare una singola texture che contiene tutte le tue icone/immagini disposte su una griglia. Le dimensioni comuni sono 256x256, 512x512 o 1024x1024 pixel.

Salva come `.tga`, poi converti in `.edds` usando DayZ Tools (TexView2 o ImageTool).

### Passo 2: Creare il File Imageset

Crea un file `.imageset` che mappa le regioni nominate alle posizioni nella texture:

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

### Passo 3: Registrare in config.cpp

Nel `config.cpp` della tua mod, registra l'imageset sotto `CfgMods`:

```cpp
class CfgMods
{
    class MyMod
    {
        // ... altri campi ...
        class defs
        {
            class imageSets
            {
                files[] = { "MyMod/GUI/imagesets/mymod_icons.imageset" };
            };
            // ... moduli script ...
        };
    };
};
```

### Passo 4: Usare nei Layout e nel Codice

Nei file di layout:

```
ImageWidgetClass MissionIcon {
 image0 "set:mymod_icons image:icon_mission"
 mode blend
 "src alpha" 1
}
```

Nel codice:

```c
ImageWidget icon;
// Le immagini dagli imageset registrati sono disponibili tramite set:nome image:nome
// Non è necessario alcun passaggio di caricamento aggiuntivo dopo la registrazione in config.cpp
```

---

## Pattern del Tema Colori

Le mod professionali centralizzano le loro definizioni di colore in una classe tema, poi applicano i colori a runtime. Questo rende facile modificare lo stile dell'intera interfaccia cambiando un solo file.

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

Applica nel codice:

```c
titleBar.SetColor(UIColor.Primary());
statusText.SetColor(UIColor.Accent());
errorText.SetColor(UIColor.Danger());
```

Questo pattern (usato da Colorful UI, MyMod e altri) significa che cambiare l'intero schema colori dell'interfaccia richiede la modifica della sola classe tema.

---

## Riepilogo degli Attributi Visivi per Tipo di Widget

| Widget | Attributi Visivi Principali |
|---|---|
| Qualsiasi widget | `color`, `visible`, `style`, `priority`, `inheritalpha` |
| TextWidget | `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `wrap` |
| ImageWidget | `image0`, `mode`, `"src alpha"`, `stretch`, `"flip u"`, `"flip v"` |
| ButtonWidget | `text`, `style`, `switch toggle` |
| PanelWidget | `color`, `style` |
| SliderWidget | `"fill in"` |
| ProgressBarWidget | `style` |

---

## Buone Pratiche

1. **Usa riferimenti imageset** invece di percorsi file diretti dove possibile -- gli imageset sono raggruppati più efficientemente dal motore.

2. **Usa font SDF** (`sdf_MetronBook24`) per il testo che deve apparire nitido a qualsiasi scala.

3. **Usa `"exact text" 1`** per testo UI a dimensioni pixel specifiche; usa testo proporzionale per elementi HUD che devono scalare.

4. **Centralizza i colori** in una classe tema invece di hardcodare valori ARGB in tutto il codice.

5. **Imposta `"src alpha" 1`** sui widget immagine per ottenere la trasparenza corretta.

6. **Registra gli imageset personalizzati** in `config.cpp` così sono disponibili globalmente senza caricamento manuale.

7. **Mantieni gli atlanti di sprite a dimensioni ragionevoli** -- 512x512 o 1024x1024 è tipico. Texture più grandi sprecano memoria se la maggior parte dello spazio è vuoto.

---

## Prossimi Passi

- [3.8 Dialoghi e Modali](08-dialogs-modals.md) -- Finestre popup, prompt di conferma e pannelli overlay
- [3.1 Tipi di Widget](01-widget-types.md) -- Rivedi il catalogo completo dei widget
- [3.6 Gestione degli Eventi](06-event-handling.md) -- Rendi interattivi i tuoi widget stilizzati

---

## Teoria vs Pratica

| Concetto | Teoria | Realtà |
|---------|--------|---------|
| I font SDF si scalano a qualsiasi dimensione | `sdf_MetronBook24` è nitido a tutte le dimensioni | Vero per dimensioni sopra ~10px. Sotto, i font SDF possono apparire sfocati rispetto ai font bitmap alla loro dimensione nativa |
| `"exact text" 1` fornisce dimensionamento pixel-perfect | Il font si renderizza alla dimensione pixel esatta specificata | DayZ applica un ridimensionamento interno, quindi `"exact text size" 16` potrebbe renderizzarsi leggermente diverso tra risoluzioni. Testa a 1080p e 1440p |
| Gli stili integrati coprono tutte le esigenze | `Default`, `blank`, `Colorable` sono sufficienti | La maggior parte delle mod professionali definisce i propri file `.styles` perché gli stili integrati hanno varietà visiva limitata |
| I formati XML e nativo degli imageset sono equivalenti | Entrambi definiscono regioni sprite | Il formato nativo a parentesi graffe è quello che il motore processa più velocemente. Il formato XML funziona ma aggiunge un passaggio di parsing; usa il formato nativo per la produzione |
| `SetColor()` sovrascrive il colore del layout | Il colore a runtime sostituisce il valore del layout | `SetColor()` tinta il visuale esistente del widget. Sui widget con stile, la tinta si moltiplica con il colore base dello stile, producendo risultati inaspettati |

---

## Compatibilità e Impatto

- **Multi-Mod:** I nomi degli stili sono globali. Se due mod registrano un file `.styles` che definisce lo stesso nome di stile, l'ultima mod caricata vince. Prefixa i nomi degli stili personalizzati con l'identificatore della tua mod (ad es. `MyMod_PanelDark`).
- **Prestazioni:** Gli imageset vengono caricati una volta nella memoria GPU all'avvio. Aggiungere atlanti di sprite grandi (2048x2048+) aumenta l'uso della VRAM. Mantieni gli atlanti a 512x512 o 1024x1024 e dividili in più imageset se necessario.
