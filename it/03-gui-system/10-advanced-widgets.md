# Capitolo 3.10: Widget Avanzati

[Home](../README.md) | [<< Precedente: Pattern UI dei Mod Reali](09-real-mod-patterns.md) | **Widget Avanzati**

---

Oltre ai contenitori standard, ai widget di testo e immagine trattati nei capitoli precedenti, DayZ fornisce tipi di widget specializzati per formattazione di testo ricco, disegno 2D su canvas, visualizzazione mappe, anteprime 3D di oggetti, riproduzione video e render-to-texture. Questi widget sbloccano capacità che i layout semplici non possono ottenere.

Questo capitolo copre ogni tipo di widget avanzato con firme API confermate estratte dal codice sorgente vanilla e dall'uso reale nei mod.

---

## Formattazione RichTextWidget

`RichTextWidget` estende `TextWidget` e supporta tag di markup inline nel suo contenuto testuale. È il modo principale per visualizzare testo formattato con immagini incorporate, dimensioni font variabili e interruzioni di riga.

### Definizione della Classe

```
// Da scripts/1_core/proto/enwidgets.c
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

`RichTextWidget` eredita tutti i metodi di `TextWidget` -- `SetText()`, `SetTextExactSize()`, `SetOutline()`, `SetShadow()`, `SetTextFormat()` e il resto. La differenza chiave è che `SetText()` su un `RichTextWidget` analizza i tag di markup inline.

### Tag Inline Supportati

Questi tag sono confermati attraverso l'uso vanilla di DayZ in `news_feed.txt`, `InputUtils.c` e script di menu multipli.

#### Immagine Inline

```
<image set="IMAGESET_NAME" name="IMAGE_NAME" />
<image set="IMAGESET_NAME" name="IMAGE_NAME" scale="1.5" />
```

Incorpora un'immagine da un imageset nominato direttamente nel flusso del testo. L'attributo `scale` controlla la dimensione dell'immagine relativa all'altezza della riga di testo.

Imageset comuni nel DayZ vanilla:
- `dayz_gui` -- icone UI generali (pin, notifiche)
- `dayz_inventory` -- icone slot inventario (spalla sinistra, mani, gilet, ecc.)
- `xbox_buttons` -- immagini pulsanti controller Xbox (A, B, X, Y)
- `playstation_buttons` -- immagini pulsanti controller PlayStation

#### Interruzione di Riga

```
</br>
```

Forza un'interruzione di riga nel contenuto del testo ricco.

#### Dimensione Font / Intestazione

```
<h scale="0.8">Contenuto testo qui</h>
<h scale="0.6">Contenuto testo più piccolo</h>
```

Racchiude il testo in un blocco intestazione con un moltiplicatore di scala.

### Pattern di Utilizzo Pratico

#### Impostare contenuto ricco con icone controller

La classe vanilla `InputUtils` fornisce un helper che genera la stringa del tag `<image>` per qualsiasi azione di input:

```c
string buttonIcon = InputUtils.GetRichtextButtonIconFromInputAction(
    "UAUISelect",              // nome azione input
    "#menu_select",            // etichetta localizzata
    EUAINPUT_DEVICE_CONTROLLER,
    InputUtils.ICON_SCALE_TOOLBAR  // scala 1.81
);
richTextWidget.SetText(buttonIcon);
```

Le due costanti di scala predefinite:
- `InputUtils.ICON_SCALE_NORMAL` = 1.21
- `InputUtils.ICON_SCALE_TOOLBAR` = 1.81

#### Contenuto di testo ricco scrollabile

`RichTextWidget` espone metodi per altezza del contenuto e offset per paginazione o scorrimento:

```c
float totalHeight = m_content.GetContentHeight();
m_content.SetContentOffset(pageOffset, true);  // snapToLine = true
```

### HtmlWidget -- RichTextWidget Esteso

`HtmlWidget` estende `RichTextWidget` con un singolo metodo aggiuntivo:

```
class HtmlWidget extends RichTextWidget
{
    proto native void LoadFile(string path);
};
```

Usato dal sistema libri vanilla per caricare file di testo `.html`.

### RichTextWidget vs TextWidget -- Differenze Chiave

| Funzionalità | TextWidget | RichTextWidget |
|---------|-----------|---------------|
| Tag `<image>` inline | No | Sì |
| Tag intestazione `<h>` | No | Sì |
| Interruzioni riga `</br>` | No (usa `\n`) | Sì |
| Scorrimento contenuto | No | Sì (via offset) |
| Visibilità righe | No | Sì |
| Elisione testo | No | Sì |
| Prestazioni | Più veloce | Più lento (parsing tag) |

Usa `TextWidget` per etichette semplici. Usa `RichTextWidget` solo quando hai bisogno di immagini inline, intestazioni formattate o scorrimento del contenuto.

---

## Disegno su CanvasWidget

`CanvasWidget` fornisce disegno 2D in modalità immediata sullo schermo. Ha esattamente due metodi nativi:

```
class CanvasWidget extends Widget
{
    proto native void DrawLine(float x1, float y1, float x2, float y2,
                               float width, int color);
    proto native void Clear();
};
```

Questa è l'intera API. Tutte le forme complesse -- rettangoli, cerchi, griglie -- devono essere costruite da segmenti di linea.

### Sistema di Coordinate

`CanvasWidget` usa **coordinate pixel nello spazio schermo** relative ai limiti del widget canvas stesso. L'origine `(0, 0)` è l'angolo in alto a sinistra del widget canvas.

### Setup del Layout

Nel file `.layout`:

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

Flag chiave:
- `ignorepointer 1` -- il canvas non blocca l'input del mouse ai widget sotto di esso

### Primitive di Disegno

#### Rettangoli (da linee)

```c
void DrawRectangle(CanvasWidget canvas, float x, float y,
                   float w, float h, float lineWidth, int color)
{
    canvas.DrawLine(x, y, x + w, y, lineWidth, color);         // superiore
    canvas.DrawLine(x + w, y, x + w, y + h, lineWidth, color); // destro
    canvas.DrawLine(x + w, y + h, x, y + h, lineWidth, color); // inferiore
    canvas.DrawLine(x, y + h, x, y, lineWidth, color);         // sinistro
}
```

#### Cerchi (da segmenti di linea)

COT implementa questo pattern in `JMESPCanvas`. Più segmenti producono un cerchio più liscio. 36 segmenti è un valore predefinito comune.

### Pattern di Ridisegno Per-Frame

`CanvasWidget` è in modalità immediata: devi chiamare `Clear()` e ridisegnare ogni frame.

### Pattern Overlay ESP (da COT)

COT usa `CanvasWidget` come overlay a schermo intero per disegnare wireframe scheletrici su giocatori e oggetti.

**Architettura:**
1. Un `CanvasWidget` a schermo intero viene creato da un file layout
2. Ogni frame, viene chiamato `Clear()`
3. Le posizioni nello spazio mondo vengono convertite in coordinate schermo
4. Le linee vengono disegnate tra le posizioni delle ossa per renderizzare gli scheletri

### Considerazioni sulle Prestazioni

- **Pulisci e ridisegna ogni frame.** Chiama `Clear()` all'inizio di ogni aggiornamento.
- **Minimizza il conteggio delle linee.** Ogni chiamata `DrawLine()` ha overhead.
- **Controlla i limiti dello schermo prima.** Salta gli oggetti fuori schermo o dietro la telecamera.
- **Usa `ignorepointer 1`.** Imposta sempre questo flag sugli overlay canvas.
- **Un canvas è sufficiente.** Usa un singolo canvas a schermo intero per tutto il disegno overlay.

---

## MapWidget

`MapWidget` visualizza la mappa del terreno di DayZ e fornisce metodi per posizionare marker, conversione di coordinate e controllo dello zoom.

### Definizione della Classe

```
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

### Coordinate Mappa vs Coordinate Mondo

DayZ usa due spazi di coordinate:

- **Coordinate mondo**: Vettori 3D in metri. `x` = est/ovest, `y` = altitudine, `z` = nord/sud.
- **Coordinate schermo**: Posizioni in pixel sul widget mappa. Cambiano quando l'utente scorre e zooma.

### Aggiungere Marker

```c
m_Map.AddUserMark(
    playerPos,                                   // vector: posizione mondo
    "You",                                       // string: testo etichetta
    COLOR_RED,                                   // int: colore ARGB
    "\\dz\\gear\\navigation\\data\\map_tree_ca.paa"  // string: texture icona
);
```

### Cancellare i Marker

`ClearUserMarks()` rimuove tutti i marker posizionati dall'utente in una volta. Non esiste un metodo per rimuovere un singolo marker per riferimento. Il pattern standard è cancellare tutti i marker e riaggiungere quelli desiderati ogni frame.

### Gestione Click sulla Mappa

Gestisci i click del mouse sulla mappa tramite i callback `OnDoubleClick` o `OnMouseButtonDown`. Converti la posizione del click in coordinate mondo usando `ScreenToMap()`:

```c
override bool OnDoubleClick(Widget w, int x, int y, int button)
{
    if (w == m_DebugMapWidget)
    {
        vector worldPos = m_DebugMapWidget.ScreenToMap(Vector(x, y, 0));
        float surfaceY = g_Game.SurfaceY(worldPos[0], worldPos[2]);
        worldPos[1] = surfaceY;
        // Usa la posizione mondo (es. teletrasporta il giocatore)
    }
    return false;
}
```

---

## ItemPreviewWidget

`ItemPreviewWidget` renderizza un'anteprima 3D di qualsiasi `EntityAI` (oggetto, arma, veicolo) dentro un pannello UI.

### Definizione della Classe

```
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

### Pattern di Utilizzo -- Ispezione Oggetto

```c
void SetItem(EntityAI item)
{
    m_item_widget.SetItem(item);
    m_item_widget.SetView(item.GetViewIndex());
    m_item_widget.SetModelPosition(Vector(0, 0, 1));
}
```

### Controllo Rotazione (Trascinamento Mouse)

Il pattern standard per la rotazione interattiva usa `GetMousePos` e `GetDragQueue` per tracciare il trascinamento del mouse e aggiornare l'orientamento del modello con `SetModelOrientation()`.

### Controllo Zoom (Rotella Mouse)

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

`PlayerPreviewWidget` renderizza un modello 3D completo del personaggio giocatore nella UI, completo di oggetti equipaggiati e animazioni.

### Definizione della Classe

```
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

### Pattern di Utilizzo -- Anteprima Personaggio Inventario

```c
m_CharacterPanelWidget.SetPlayer(g_Game.GetPlayer());
m_CharacterPanelWidget.SetModelPosition("0 0 0.605");
m_CharacterPanelWidget.SetSize(1.34, 1.34);
```

### Mantenere l'Equipaggiamento Aggiornato

Il metodo `UpdateInterval()` mantiene l'anteprima sincronizzata con l'equipaggiamento effettivo del giocatore tramite `UpdateItemInHands()` e accedendo al giocatore fittizio con `GetDummyPlayer()` per la sincronizzazione delle animazioni.

---

## VideoWidget

`VideoWidget` riproduce file video nella UI. Supporta controllo della riproduzione, looping, seeking, query di stato, sottotitoli e callback eventi.

### Definizione della Classe

```
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

### Pattern di Utilizzo -- Video Menu

```c
m_Video.Load("video\\DayZ_onboarding_MASTER.mp4");
m_Video.Play();
m_Video.SetCallback(VideoCallback.ON_END, StopVideo);
```

### Valori di Ritorno

I metodi `Load()`, `Play()`, `Pause()` e `Stop()` restituiscono `bool`, ma questo valore di ritorno è **deprecato**. Usa `VideoCallback.ON_ERROR` per rilevare errori.

---

## RenderTargetWidget e RTTextureWidget

Questi widget abilitano il rendering di una vista del mondo 3D in un widget UI.

### RenderTargetWidget

Renderizza una vista della telecamera da un `BaseWorld` nell'area del widget. Usato per telecamere di sicurezza, specchietti retrovisori o display picture-in-picture.

```c
// Lega al mondo di gioco con indice telecamera 0
SetWidgetWorld(m_RenderWidget, g_Game.GetWorldEntity(), 0);

// Renderizza ogni 2 frame (period=2, offset=0)
m_RenderWidget.SetRefresh(2, 0);

// Renderizza a metà risoluzione per le prestazioni
m_RenderWidget.SetResolutionScale(0.5, 0.5);
```

### RTTextureWidget

`RTTextureWidget` non ha metodi aggiuntivi lato script. Serve come target di texture render in cui i widget figli possono essere renderizzati.

---

## Buone Pratiche

1. **Usa il widget giusto per il lavoro.** `TextWidget` per etichette semplici, `RichTextWidget` solo quando hai bisogno di immagini inline o contenuto formattato. `CanvasWidget` per overlay 2D dinamici, non grafica statica.

2. **Pulisci il canvas ogni frame.** Chiama sempre `Clear()` prima di ridisegnare.

3. **Controlla i limiti dello schermo per il disegno ESP/overlay.** Prima di chiamare `DrawLine()`, verifica che entrambi gli endpoint siano sullo schermo.

4. **Marker mappa: pattern cancella-e-ricostruisci.** Non esiste un metodo `RemoveUserMark()`. Chiama `ClearUserMarks()` poi riaggiungi tutti i marker attivi ogni aggiornamento.

5. **ItemPreviewWidget ha bisogno di un EntityAI reale.** Non puoi visualizzare in anteprima una stringa classname -- hai bisogno di un riferimento a un'entità generata.

6. **PlayerPreviewWidget possiede un giocatore fittizio.** Il widget crea un `DayZPlayer` fittizio interno. Non distruggerlo tu stesso.

7. **VideoWidget: usa i callback, non i valori di ritorno.** I bool restituiti da `Load()`, `Play()`, ecc. sono deprecati.

8. **Prestazioni RenderTargetWidget.** Usa `SetRefresh()` con periodo > 1 per saltare frame. Usa `SetResolutionScale()` per ridurre la risoluzione. Questi widget sono costosi.

---

## Osservato nei Mod Reali

| Mod | Widget | Utilizzo |
|-----|--------|-------|
| **COT** | `CanvasWidget` | Overlay ESP a schermo intero con disegno scheletrico, proiezione mondo-schermo |
| **COT** | `MapWidget` | Teletrasporto admin via `ScreenToMap()` su doppio click |
| **Expansion** | `MapWidget` | Sistema marker personalizzato con categorie personali/server/party |
| **Vanilla Mappa** | `MapWidget` + `CanvasWidget` | Righello di scala renderizzato con segmenti di linea alternati |
| **Vanilla Ispeziona** | `ItemPreviewWidget` | Ispezione 3D oggetto con rotazione tramite trascinamento e zoom con scroll |
| **Vanilla Inventario** | `PlayerPreviewWidget` | Anteprima personaggio con sincronizzazione equipaggiamento |
| **Vanilla Menu** | `RichTextWidget` | Icone pulsanti controller via `InputUtils` |
| **Vanilla Menu Principale** | `VideoWidget` | Video onboarding con callback di fine |

---

## Errori Comuni

**1. Usare RichTextWidget dove TextWidget basta.** Il parsing del testo ricco ha overhead.

**2. Dimenticare di chiamare Clear() sul canvas.** I disegni si accumulano, riempiendo lo schermo.

**3. Disegnare dietro la telecamera.** Converti le posizioni mondo in coordinate schermo e controlla `screenPos[2] < 0`.

**4. Tentare di rimuovere un singolo marker mappa.** Non esiste `RemoveUserMark()`. Devi `ClearUserMarks()` e riaggiungere tutti i marker.

**5. Non impostare ignorepointer sugli overlay canvas.** Un canvas senza `ignorepointer 1` intercetterà tutti gli eventi mouse.

---

## Riepilogo

| Widget | Uso Principale | Metodi Chiave |
|--------|-----------|-------------|
| `RichTextWidget` | Testo formattato con immagini inline | `SetText()`, `GetContentHeight()`, `SetContentOffset()` |
| `HtmlWidget` | Caricamento file di testo formattati | `LoadFile()` |
| `CanvasWidget` | Overlay disegno 2D | `DrawLine()`, `Clear()` |
| `MapWidget` | Mappa del terreno con marker | `AddUserMark()`, `ClearUserMarks()`, `ScreenToMap()`, `MapToScreen()` |
| `ItemPreviewWidget` | Visualizzazione 3D oggetto | `SetItem()`, `SetView()`, `SetModelOrientation()` |
| `PlayerPreviewWidget` | Visualizzazione 3D personaggio giocatore | `SetPlayer()`, `Refresh()`, `UpdateItemInHands()` |
| `VideoWidget` | Riproduzione video | `Load()`, `Play()`, `Pause()`, `SetCallback()` |
| `RenderTargetWidget` | Vista telecamera 3D in tempo reale | `SetRefresh()`, `SetResolutionScale()` + `SetWidgetWorld()` |
| `RTTextureWidget` | Target render-to-texture | Serve come sorgente texture per `ImageWidget.SetImageTexture()` |

---

*Questo capitolo completa la sezione del sistema GUI. Tutte le firme API e i pattern sono confermati dal codice sorgente vanilla di DayZ e dal codice sorgente reale dei mod.*
