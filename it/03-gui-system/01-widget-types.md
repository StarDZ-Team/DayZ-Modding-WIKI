# Capitolo 3.1: Tipi di Widget

[Home](../README.md) | **Tipi di Widget** | [Successivo: File di Layout >>](02-layout-files.md)

---

Il sistema GUI di DayZ è costruito su widget -- componenti UI riutilizzabili che vanno da semplici contenitori a complessi controlli interattivi. Ogni elemento visibile sullo schermo è un widget, e comprendere il catalogo completo è essenziale per costruire interfacce per le mod.

Questo capitolo fornisce un riferimento completo di tutti i tipi di widget disponibili in Enforce Script.

---

## Come Funzionano i Widget

Ogni widget in DayZ eredita dalla classe base `Widget`. I widget sono organizzati in un albero padre-figlio, dove la radice è tipicamente un `WorkspaceWidget` ottenuto tramite `GetGame().GetWorkspace()`.

Ogni tipo di widget ha tre identificatori associati:

| Identificatore | Esempio | Utilizzato Per |
|---|---|---|
| **Classe script** | `TextWidget` | Riferimenti nel codice, casting |
| **Classe layout** | `TextWidgetClass` | Dichiarazioni nei file `.layout` |
| **Costante TypeID** | `TextWidgetTypeID` | Creazione programmatica con `CreateWidget()` |

Nei file `.layout` si usa sempre il nome della classe layout (che termina con `Class`). Negli script si lavora con il nome della classe script.

---

## Widget Contenitore / Layout

I widget contenitore contengono e organizzano i widget figli. Non visualizzano contenuto direttamente (tranne `PanelWidget`, che disegna un rettangolo colorato).

| Classe Script | Classe Layout | Scopo |
|---|---|---|
| `Widget` | `WidgetClass` | Classe base astratta per tutti i widget. Non istanziare mai direttamente. |
| `WorkspaceWidget` | `WorkspaceWidgetClass` | Workspace radice. Ottenuto tramite `GetGame().GetWorkspace()`. Usato per creare widget programmaticamente. |
| `FrameWidget` | `FrameWidgetClass` | Contenitore generico. Il widget più comunemente usato in DayZ. |
| `PanelWidget` | `PanelWidgetClass` | Rettangolo colorato pieno. Usare per sfondi, divisori, separatori. |
| `WrapSpacerWidget` | `WrapSpacerWidgetClass` | Layout a flusso. Dispone i figli sequenzialmente con a capo automatico, padding e margini. |
| `GridSpacerWidget` | `GridSpacerWidgetClass` | Layout a griglia. Dispone i figli in una griglia definita da `Columns` e `Rows`. |
| `ScrollWidget` | `ScrollWidgetClass` | Viewport scorrevole. Abilita lo scorrimento verticale/orizzontale del contenuto figlio. |
| `SpacerBaseWidget` | -- | Classe base astratta per `WrapSpacerWidget` e `GridSpacerWidget`. |

### FrameWidget

Il cavallo di battaglia dell'interfaccia DayZ. Usa `FrameWidget` come contenitore predefinito quando devi raggruppare widget insieme. Non ha aspetto visivo -- è puramente strutturale.

**Metodi principali:**
- Tutti i metodi base di `Widget` (posizione, dimensione, colore, figli, flag)

**Quando usare:** Quasi ovunque. Raggruppa insiemi di widget correlati. Usa come radice di dialoghi, pannelli ed elementi HUD.

```c
// Trova un frame widget per nome
FrameWidget panel = FrameWidget.Cast(root.FindAnyWidget("MyPanel"));
panel.Show(true);
```

### PanelWidget

Un rettangolo visibile con un colore pieno. A differenza di `FrameWidget`, un `PanelWidget` effettivamente disegna qualcosa sullo schermo.

**Metodi principali:**
- `SetColor(int argb)` -- Imposta il colore di sfondo
- `SetAlpha(float alpha)` -- Imposta la trasparenza

**Quando usare:** Sfondi dietro al testo, divisori colorati, rettangoli overlay, livelli di tinta.

```c
PanelWidget bg = PanelWidget.Cast(root.FindAnyWidget("Background"));
bg.SetColor(ARGB(200, 0, 0, 0));  // Nero semi-trasparente
```

### WrapSpacerWidget

Dispone automaticamente i figli in un layout a flusso. I figli vengono posizionati uno dopo l'altro, andando a capo alla riga successiva quando lo spazio si esaurisce.

**Attributi di layout principali:**
- `Padding` -- Padding interno (pixel)
- `Margin` -- Margine esterno (pixel)
- `"Size To Content H" 1` -- Ridimensiona la larghezza per adattarsi ai figli
- `"Size To Content V" 1` -- Ridimensiona l'altezza per adattarsi ai figli
- `content_halign` -- Allineamento orizzontale del contenuto (`left`, `center`, `right`)
- `content_valign` -- Allineamento verticale del contenuto (`top`, `center`, `bottom`)

**Quando usare:** Liste dinamiche, gruppi di tag, righe di pulsanti, qualsiasi layout dove i figli hanno dimensioni variabili.

### GridSpacerWidget

Dispone i figli in una griglia fissa. Ogni cella ha la stessa dimensione.

**Attributi di layout principali:**
- `Columns` -- Numero di colonne
- `Rows` -- Numero di righe
- `Margin` -- Spazio tra le celle
- `"Size To Content V" 1` -- Ridimensiona l'altezza per adattarsi al contenuto

**Quando usare:** Griglie inventario, gallerie di icone, pannelli impostazioni con righe uniformi.

### ScrollWidget

Fornisce un viewport scorrevole per il contenuto che eccede l'area visibile.

**Attributi di layout principali:**
- `"Scrollbar V" 1` -- Abilita la barra di scorrimento verticale
- `"Scrollbar H" 1` -- Abilita la barra di scorrimento orizzontale

**Metodi principali:**
- `VScrollToPos(float pos)` -- Scorri a una posizione verticale
- `GetVScrollPos()` -- Ottieni la posizione di scorrimento verticale corrente
- `GetContentHeight()` -- Ottieni l'altezza totale del contenuto
- `VScrollStep(int step)` -- Scorri di un valore step

**Quando usare:** Liste lunghe, pannelli di configurazione, finestre di chat, visualizzatori di log.

---

## Widget di Visualizzazione

I widget di visualizzazione mostrano contenuto all'utente ma non sono interattivi.

| Classe Script | Classe Layout | Scopo |
|---|---|---|
| `TextWidget` | `TextWidgetClass` | Visualizzazione di testo a riga singola |
| `MultilineTextWidget` | `MultilineTextWidgetClass` | Testo multilinea di sola lettura |
| `RichTextWidget` | `RichTextWidgetClass` | Testo con immagini incorporate (tag `<image>`) |
| `ImageWidget` | `ImageWidgetClass` | Visualizzazione di immagini (da imageset o file) |
| `CanvasWidget` | `CanvasWidgetClass` | Superficie di disegno programmabile |
| `VideoWidget` | `VideoWidgetClass` | Riproduzione di file video |
| `RTTextureWidget` | `RTTextureWidgetClass` | Superficie render-to-texture |
| `RenderTargetWidget` | `RenderTargetWidgetClass` | Target di rendering scena 3D |
| `ItemPreviewWidget` | `ItemPreviewWidgetClass` | Anteprima 3D di oggetti DayZ |
| `PlayerPreviewWidget` | `PlayerPreviewWidgetClass` | Anteprima 3D del personaggio giocatore |
| `MapWidget` | `MapWidgetClass` | Mappa del mondo interattiva |

### TextWidget

Il widget di visualizzazione più comune. Mostra una singola riga di testo.

**Metodi principali:**
```c
TextWidget tw;
tw.SetText("Hello World");
tw.GetText();                           // Restituisce string
tw.GetTextSize(out int w, out int h);   // Dimensioni in pixel del testo renderizzato
tw.SetTextExactSize(float size);        // Imposta la dimensione del font in pixel
tw.SetOutline(int size, int color);     // Aggiunge contorno al testo
tw.GetOutlineSize();                    // Restituisce int
tw.GetOutlineColor();                   // Restituisce int (ARGB)
tw.SetColor(int argb);                  // Colore del testo
```

**Attributi di layout principali:** `text`, `font`, `"text halign"`, `"text valign"`, `"exact text"`, `"exact text size"`, `"bold text"`, `"size to text h"`, `"size to text v"`, `wrap`.

### MultilineTextWidget

Visualizza più righe di testo di sola lettura. Il testo va a capo automaticamente in base alla larghezza del widget.

**Quando usare:** Pannelli di descrizione, testo di aiuto, visualizzazioni di log.

### RichTextWidget

Supporta immagini inline incorporate nel testo usando i tag `<image>`. Supporta anche l'a capo del testo.

**Attributi di layout principali:**
- `wrap 1` -- Abilita l'a capo delle parole

**Uso nel testo:**
```
"Health: <image set:dayz_gui image:iconHealth0 /> OK"
```

**Quando usare:** Testo di stato con icone, messaggi formattati, chat con immagini inline.

### ImageWidget

Visualizza immagini da fogli sprite imageset o caricate da percorsi file.

**Metodi principali:**
```c
ImageWidget iw;
iw.SetImage(int index);                    // Alterna tra image0, image1, ecc.
iw.LoadImageFile(int slot, string path);   // Carica immagine da file
iw.LoadMaskTexture(string path);           // Carica una texture maschera
iw.SetMaskProgress(float progress);        // 0-1 per transizioni wipe/reveal
```

**Attributi di layout principali:**
- `image0 "set:dayz_gui image:icon_refresh"` -- Immagine da un imageset
- `mode blend` -- Modalità di fusione (`blend`, `additive`, `stretch`)
- `"src alpha" 1` -- Usa il canale alfa sorgente
- `stretch 1` -- Estendi l'immagine per riempire il widget
- `"flip u" 1` -- Capovolgi orizzontalmente
- `"flip v" 1` -- Capovolgi verticalmente

**Quando usare:** Icone, loghi, sfondi, marcatori mappa, indicatori di stato.

### CanvasWidget

Una superficie di disegno dove puoi renderizzare linee programmaticamente.

**Metodi principali:**
```c
CanvasWidget cw;
cw.DrawLine(float x1, float y1, float x2, float y2, float width, int color);
cw.Clear();
```

**Quando usare:** Grafici personalizzati, linee di connessione tra nodi, overlay di debug.

### MapWidget

La mappa del mondo interattiva completa. Supporta panoramica, zoom e conversione di coordinate.

**Metodi principali:**
```c
MapWidget mw;
mw.SetMapPos(vector pos);              // Centra sulla posizione nel mondo
mw.GetMapPos();                        // Posizione del centro corrente
mw.SetScale(float scale);             // Livello di zoom
mw.GetScale();                        // Zoom corrente
mw.MapToScreen(vector world_pos);     // Coordinate mondo in coordinate schermo
mw.ScreenToMap(vector screen_pos);    // Coordinate schermo in coordinate mondo
```

**Quando usare:** Mappe missione, sistemi GPS, selettori di posizione.

### ItemPreviewWidget

Renderizza un'anteprima 3D di qualsiasi oggetto dell'inventario DayZ.

**Quando usare:** Schermate inventario, anteprime bottino, interfacce negozio.

### PlayerPreviewWidget

Renderizza un'anteprima 3D del modello del personaggio giocatore.

**Quando usare:** Schermate di creazione personaggio, anteprima equipaggiamento, sistemi guardaroba.

### RTTextureWidget

Renderizza i suoi figli su una superficie texture anziché direttamente sullo schermo.

**Quando usare:** Rendering minimappa, effetti picture-in-picture, composizione UI fuori schermo.

---

## Widget Interattivi

I widget interattivi rispondono all'input dell'utente e generano eventi.

| Classe Script | Classe Layout | Scopo |
|---|---|---|
| `ButtonWidget` | `ButtonWidgetClass` | Pulsante cliccabile |
| `CheckBoxWidget` | `CheckBoxWidgetClass` | Casella di controllo booleana |
| `EditBoxWidget` | `EditBoxWidgetClass` | Input di testo a riga singola |
| `MultilineEditBoxWidget` | `MultilineEditBoxWidgetClass` | Input di testo multilinea |
| `PasswordEditBoxWidget` | `PasswordEditBoxWidgetClass` | Input password mascherato |
| `SliderWidget` | `SliderWidgetClass` | Controllo a cursore orizzontale |
| `XComboBoxWidget` | `XComboBoxWidgetClass` | Selezione a tendina |
| `TextListboxWidget` | `TextListboxWidgetClass` | Lista di righe selezionabili |
| `ProgressBarWidget` | `ProgressBarWidgetClass` | Indicatore di progresso |
| `SimpleProgressBarWidget` | `SimpleProgressBarWidgetClass` | Indicatore di progresso minimale |

### ButtonWidget

Il controllo interattivo principale. Supporta sia la modalità click momentaneo che la modalità toggle.

**Metodi principali:**
```c
ButtonWidget bw;
bw.SetText("Click Me");
bw.GetState();              // Restituisce bool (solo pulsanti toggle)
bw.SetState(bool state);    // Imposta lo stato toggle
```

**Attributi di layout principali:**
- `text "Label"` -- Testo etichetta del pulsante
- `switch toggle` -- Rende il pulsante un toggle
- `style Default` -- Stile visivo

**Eventi generati:** `OnClick(Widget w, int x, int y, int button)`

### CheckBoxWidget

Un controllo toggle booleano.

**Metodi principali:**
```c
CheckBoxWidget cb;
cb.IsChecked();                 // Restituisce bool
cb.SetChecked(bool checked);    // Imposta lo stato
```

**Eventi generati:** `OnChange(Widget w, int x, int y, bool finished)`

### EditBoxWidget

Un campo di input testo a riga singola.

**Metodi principali:**
```c
EditBoxWidget eb;
eb.GetText();               // Restituisce string
eb.SetText("default");      // Imposta il contenuto testuale
```

**Eventi generati:** `OnChange(Widget w, int x, int y, bool finished)` -- `finished` è `true` quando viene premuto Invio.

### SliderWidget

Un cursore orizzontale per valori numerici.

**Metodi principali:**
```c
SliderWidget sw;
sw.GetCurrent();            // Restituisce float (0-1)
sw.SetCurrent(float val);   // Imposta la posizione
```

**Attributi di layout principali:**
- `"fill in" 1` -- Mostra la traccia riempita dietro la maniglia
- `"listen to input" 1` -- Rispondi all'input del mouse

**Eventi generati:** `OnChange(Widget w, int x, int y, bool finished)` -- `finished` è `true` quando l'utente rilascia il cursore.

### XComboBoxWidget

Una lista di selezione a tendina.

**Metodi principali:**
```c
XComboBoxWidget xcb;
xcb.AddItem("Opzione A");
xcb.AddItem("Opzione B");
xcb.SetCurrentItem(0);         // Seleziona per indice
xcb.GetCurrentItem();          // Restituisce l'indice selezionato
xcb.ClearAll();                // Rimuovi tutti gli elementi
```

### TextListboxWidget

Una lista scorrevole di righe di testo. Supporta selezione e dati multi-colonna.

**Metodi principali:**
```c
TextListboxWidget tlb;
tlb.AddItem("Testo riga", null, 0);   // testo, userData, colonna
tlb.GetSelectedRow();               // Restituisce int (-1 se nessuno)
tlb.SetRow(int row);                // Seleziona una riga
tlb.RemoveRow(int row);
tlb.ClearItems();
```

**Eventi generati:** `OnItemSelected`

### ProgressBarWidget

Visualizza un indicatore di progresso.

**Metodi principali:**
```c
ProgressBarWidget pb;
pb.SetCurrent(float value);    // 0-100
```

**Quando usare:** Barre di caricamento, barre salute, progresso missione, indicatori di cooldown.

---

## Riferimento Completo dei TypeID

Usa queste costanti con `GetGame().GetWorkspace().CreateWidget()` per la creazione programmatica dei widget:

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

## Scegliere il Widget Giusto

| Ho bisogno di... | Usa questo widget |
|---|---|
| Raggruppare widget insieme (invisibile) | `FrameWidget` |
| Disegnare un rettangolo colorato | `PanelWidget` |
| Mostrare testo | `TextWidget` |
| Mostrare testo multilinea | `MultilineTextWidget` o `RichTextWidget` con `wrap 1` |
| Mostrare testo con icone inline | `RichTextWidget` |
| Visualizzare un'immagine/icona | `ImageWidget` |
| Creare un pulsante cliccabile | `ButtonWidget` |
| Creare un toggle (on/off) | `CheckBoxWidget` o `ButtonWidget` con `switch toggle` |
| Accettare input di testo | `EditBoxWidget` |
| Accettare input di testo multilinea | `MultilineEditBoxWidget` |
| Accettare una password | `PasswordEditBoxWidget` |
| Permettere all'utente di scegliere un numero | `SliderWidget` |
| Permettere all'utente di scegliere da una lista | `XComboBoxWidget` (tendina) o `TextListboxWidget` (lista visibile) |
| Mostrare il progresso | `ProgressBarWidget` o `SimpleProgressBarWidget` |
| Disporre i figli in un flusso | `WrapSpacerWidget` |
| Disporre i figli in una griglia | `GridSpacerWidget` |
| Rendere il contenuto scorrevole | `ScrollWidget` |
| Mostrare un modello 3D di un oggetto | `ItemPreviewWidget` |
| Mostrare il modello del giocatore | `PlayerPreviewWidget` |
| Mostrare la mappa del mondo | `MapWidget` |
| Disegnare linee/forme personalizzate | `CanvasWidget` |
| Renderizzare su una texture | `RTTextureWidget` |

---

## Prossimi Passi

- [3.2 Formato File di Layout](02-layout-files.md) -- Impara come definire alberi di widget nei file `.layout`
- [3.5 Creazione Programmatica di Widget](05-programmatic-widgets.md) -- Crea widget da codice invece che da file di layout

---

## Buone Pratiche

- Usa `FrameWidget` come contenitore predefinito. Usa `PanelWidget` solo quando hai bisogno di uno sfondo colorato visibile.
- Preferisci `RichTextWidget` rispetto a `TextWidget` quando potresti aver bisogno di icone inline in futuro -- cambiare tipo in un layout esistente è laborioso.
- Controlla sempre la nullità dopo `FindAnyWidget()` e `Cast()`. I nomi di widget mancanti restituiscono silenziosamente `null` e causano crash alla chiamata del metodo successivo.
- Usa `WrapSpacerWidget` per liste dinamiche e `GridSpacerWidget` per griglie fisse. Non posizionare manualmente i figli in un layout a flusso.
- Evita `CanvasWidget` per l'interfaccia di produzione -- ridisegna ogni frame e non ha batching. Usalo solo per overlay di debug.

---

## Teoria vs Pratica

| Concetto | Teoria | Realtà |
|---------|--------|---------|
| `ScrollWidget` scorre automaticamente al contenuto | La scrollbar appare quando il contenuto eccede i limiti | Devi chiamare `VScrollToPos()` manualmente per scorrere al nuovo contenuto; il widget non scorre automaticamente all'aggiunta di figli |
| `SliderWidget` genera eventi continui | `OnChange` si attiva ad ogni pixel di trascinamento | Il parametro `finished` è `false` durante il trascinamento e `true` al rilascio; aggiorna la logica pesante solo quando `finished == true` |
| `XComboBoxWidget` supporta molti elementi | La tendina funziona con qualsiasi quantità | Le prestazioni degradano notevolmente con 100+ elementi; usa `TextListboxWidget` per liste lunghe |
| `ItemPreviewWidget` mostra qualsiasi oggetto | Passa qualsiasi classname per l'anteprima 3D | Il widget richiede che il modello `.p3d` dell'oggetto sia caricato; gli oggetti moddati necessitano del loro PBO Data presente |
| `MapWidget` è un semplice display | Mostra solo la mappa | Intercetta tutto l'input del mouse per impostazione predefinita; devi gestire attentamente i flag `IGNOREPOINTER` o blocca i click sui widget sovrapposti |

---

## Compatibilità e Impatto

- **Multi-Mod:** Gli ID tipo dei widget sono costanti del motore condivise tra tutte le mod. Due mod che creano widget con lo stesso nome sotto lo stesso genitore entreranno in conflitto. Usa nomi di widget univoci con il prefisso della tua mod.
- **Prestazioni:** `TextListboxWidget` e `ScrollWidget` con centinaia di figli causano cali di frame. Raggruppa e ricicla i widget per liste che superano i 50 elementi.
