# Capitolo 3.5: Creazione Programmatica di Widget

[Home](../../README.md) | [<< Precedente: Widget Contenitore](04-containers.md) | **Creazione Programmatica di Widget** | [Successivo: Gestione degli Eventi >>](06-event-handling.md)

---

Mentre i file `.layout` sono il modo standard per definire la struttura dell'interfaccia, puoi anche creare e configurare widget interamente da codice. Questo è utile per interfacce dinamiche, elementi generati proceduralmente e situazioni in cui il layout non è noto al momento della compilazione.

---

## Due Approcci

DayZ fornisce due modi per creare widget nel codice:

1. **`CreateWidgets()`** -- Carica un file `.layout` e istanzia il suo albero di widget
2. **`CreateWidget()`** -- Crea un singolo widget con parametri espliciti

Entrambi i metodi vengono chiamati sul `WorkspaceWidget` ottenuto da `GetGame().GetWorkspace()`.

---

## CreateWidgets() -- Da File di Layout

L'approccio più comune. Carica un file `.layout` e crea l'intero albero di widget, collegandolo a un widget genitore.

```c
Widget root = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/gui/layouts/MyPanel.layout",   // Percorso al file di layout
    parentWidget                            // Widget genitore (o null per la radice)
);
```

Il `Widget` restituito è il widget radice dal file di layout. Puoi poi trovare i widget figli per nome:

```c
TextWidget title = TextWidget.Cast(root.FindAnyWidget("TitleText"));
title.SetText("Hello World");

ButtonWidget closeBtn = ButtonWidget.Cast(root.FindAnyWidget("CloseButton"));
```

### Creazione di Istanze Multiple

Un pattern comune è creare istanze multiple di un modello di layout (ad es. elementi di lista):

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

    container.Update();  // Forza il ricalcolo del layout
}
```

---

## CreateWidget() -- Creazione Programmatica

Crea un singolo widget con tipo, posizione, dimensione, flag e genitore espliciti.

```c
Widget w = GetGame().GetWorkspace().CreateWidget(
    FrameWidgetTypeID,      // Costante ID tipo widget
    0,                       // Posizione X
    0,                       // Posizione Y
    100,                     // Larghezza
    100,                     // Altezza
    WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS,
    -1,                      // Colore (intero ARGB, -1 = bianco/predefinito)
    0,                       // Ordine di ordinamento (priorità)
    parentWidget             // Widget genitore
);
```

### Parametri

| Parametro | Tipo | Descrizione |
|---|---|---|
| typeID | int | Costante tipo widget (ad es. `FrameWidgetTypeID`, `TextWidgetTypeID`) |
| x | float | Posizione X (proporzionale o in pixel in base ai flag) |
| y | float | Posizione Y |
| width | float | Larghezza del widget |
| height | float | Altezza del widget |
| flags | int | OR bit a bit delle costanti `WidgetFlags` |
| color | int | Intero colore ARGB (-1 per predefinito/bianco) |
| sort | int | Ordine Z (valori più alti renderizzano sopra) |
| parent | Widget | Widget genitore a cui collegarsi |

### ID Tipo Widget

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

I flag controllano il comportamento del widget quando viene creato programmaticamente. Combinali con l'OR bit a bit (`|`).

| Flag | Effetto |
|---|---|
| `WidgetFlags.VISIBLE` | Il widget inizia visibile |
| `WidgetFlags.IGNOREPOINTER` | Il widget non riceve eventi del mouse |
| `WidgetFlags.DRAGGABLE` | Il widget può essere trascinato |
| `WidgetFlags.EXACTSIZE` | I valori di dimensione sono in pixel (non proporzionali) |
| `WidgetFlags.EXACTPOS` | I valori di posizione sono in pixel (non proporzionali) |
| `WidgetFlags.SOURCEALPHA` | Usa il canale alfa sorgente |
| `WidgetFlags.BLEND` | Abilita il blending alfa |
| `WidgetFlags.FLIPU` | Capovolgi la texture orizzontalmente |
| `WidgetFlags.FLIPV` | Capovolgi la texture verticalmente |

Combinazioni di flag comuni:

```c
// Visibile, dimensione in pixel, posizione in pixel, alpha blending
int FLAGS_EXACT = WidgetFlags.VISIBLE | WidgetFlags.EXACTSIZE | WidgetFlags.EXACTPOS | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;

// Visibile, proporzionale, non interattivo
int FLAGS_OVERLAY = WidgetFlags.VISIBLE | WidgetFlags.IGNOREPOINTER | WidgetFlags.SOURCEALPHA | WidgetFlags.BLEND;
```

Dopo la creazione, puoi modificare i flag dinamicamente:

```c
widget.SetFlags(WidgetFlags.VISIBLE);          // Aggiungi un flag
widget.ClearFlags(WidgetFlags.IGNOREPOINTER);  // Rimuovi un flag
int flags = widget.GetFlags();                  // Leggi i flag correnti
```

---

## Impostare le Proprietà Dopo la Creazione

Dopo aver creato un widget con `CreateWidget()`, devi configurarlo. Il widget viene restituito come tipo base `Widget`, quindi devi eseguire il cast al tipo specifico.

### Impostare il Nome

```c
Widget w = GetGame().GetWorkspace().CreateWidget(TextWidgetTypeID, ...);
w.SetName("MyTextWidget");
```

I nomi sono importanti per le ricerche con `FindAnyWidget()` e per il debug.

### Impostare il Testo

```c
TextWidget tw = TextWidget.Cast(w);
tw.SetText("Hello World");
tw.SetTextExactSize(16);           // Dimensione font in pixel
tw.SetOutline(1, ARGB(255, 0, 0, 0));  // Contorno nero di 1px
```

### Impostare il Colore

I colori in DayZ usano il formato ARGB (Alfa, Rosso, Verde, Blu), compressi in un singolo intero a 32 bit:

```c
// Usando la funzione helper ARGB (0-255 per canale)
int red    = ARGB(255, 255, 0, 0);       // Rosso opaco
int green  = ARGB(255, 0, 255, 0);       // Verde opaco
int blue   = ARGB(200, 0, 0, 255);       // Blu semi-trasparente
int black  = ARGB(255, 0, 0, 0);         // Nero opaco
int white  = ARGB(255, 255, 255, 255);   // Bianco opaco (uguale a -1)

// Usando la versione float (0.0-1.0 per canale)
int color = ARGBF(1.0, 0.5, 0.25, 0.1);

// Scomponi un colore in float
float a, r, g, b;
InverseARGBF(color, a, r, g, b);

// Applica a qualsiasi widget
widget.SetColor(ARGB(255, 100, 150, 200));
widget.SetAlpha(0.5);  // Sovrascrive solo l'alfa
```

Il formato esadecimale `0xAARRGGBB` è anch'esso comune:

```c
int color = 0xFF4B77BE;   // A=255, R=75, G=119, B=190
widget.SetColor(color);
```

### Impostare un Gestore di Eventi

```c
widget.SetHandler(myEventHandler);  // Istanza di ScriptedWidgetEventHandler
```

### Impostare i Dati Utente

Collega dati arbitrari a un widget per il recupero successivo:

```c
widget.SetUserData(myDataObject);  // Deve ereditare da Managed

// Recuperali più tardi:
Managed data;
widget.GetUserData(data);
MyDataClass myData = MyDataClass.Cast(data);
```

---

## Pulizia dei Widget

I widget che non sono più necessari devono essere puliti correttamente per evitare perdite di memoria.

### Unlink()

Rimuove un widget dal suo genitore e lo distrugge (insieme a tutti i suoi figli):

```c
widget.Unlink();
```

Dopo aver chiamato `Unlink()`, il riferimento al widget diventa invalido. Impostalo a `null`:

```c
widget.Unlink();
widget = null;
```

### Rimozione di Tutti i Figli

Per svuotare un widget contenitore di tutti i suoi figli:

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

**Importante:** Devi ottenere `GetSibling()` **prima** di chiamare `Unlink()`, perché l'unlink invalida la catena dei fratelli del widget.

### Controlli di Nullità

Controlla sempre la nullità dei widget prima di usarli. `FindAnyWidget()` restituisce `null` se il widget non viene trovato, e le operazioni di cast restituiscono `null` se il tipo non corrisponde:

```c
TextWidget tw = TextWidget.Cast(root.FindAnyWidget("MaybeExists"));
if (tw)
{
    tw.SetText("Trovato");
}
```

---

## Navigazione della Gerarchia dei Widget

Naviga l'albero dei widget dal codice:

```c
Widget parent = widget.GetParent();           // Widget genitore
Widget firstChild = widget.GetChildren();     // Primo figlio
Widget nextSibling = widget.GetSibling();     // Fratello successivo
Widget found = widget.FindAnyWidget("Name");  // Ricerca ricorsiva per nome

string name = widget.GetName();               // Nome del widget
string typeName = widget.GetTypeName();       // Ad es. "TextWidget"
```

Per iterare tutti i figli:

```c
Widget child = parent.GetChildren();
while (child)
{
    // Processa il figlio
    Print("Figlio: " + child.GetName());

    child = child.GetSibling();
}
```

Per iterare tutti i discendenti ricorsivamente:

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

## Esempio Completo: Creare un Dialogo nel Codice

Ecco un esempio completo che crea un semplice dialogo informativo interamente nel codice, senza alcun file di layout:

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

        // Frame radice: 400x200 pixel, centrato sullo schermo
        m_Root = workspace.CreateWidget(
            FrameWidgetTypeID, 0, 0, 400, 200, FLAGS_EXACT,
            ARGB(230, 30, 30, 30), 100, null);

        // Centralo manualmente
        int sw, sh;
        GetScreenSize(sw, sh);
        m_Root.SetScreenPos((sw - 400) / 2, (sh - 200) / 2);

        // Testo del titolo: larghezza piena, 30px di altezza, in alto
        Widget titleW = workspace.CreateWidget(
            TextWidgetTypeID, 0, 0, 400, 30, FLAGS_EXACT,
            ARGB(255, 100, 160, 220), 0, m_Root);
        m_Title = TextWidget.Cast(titleW);
        m_Title.SetText(title);

        // Testo del messaggio: sotto il titolo, riempie lo spazio rimanente
        Widget msgW = workspace.CreateWidget(
            TextWidgetTypeID, 10, 40, 380, 110, FLAGS_EXACT,
            ARGB(255, 200, 200, 200), 0, m_Root);
        m_Message = TextWidget.Cast(msgW);
        m_Message.SetText(message);

        // Pulsante chiudi: 80x30 pixel, area in basso a destra
        Widget btnW = workspace.CreateWidget(
            ButtonWidgetTypeID, 310, 160, 80, 30, FLAGS_EXACT,
            ARGB(255, 80, 130, 200), 0, m_Root);
        m_CloseBtn = ButtonWidget.Cast(btnW);
        m_CloseBtn.SetText("Close");
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

// Utilizzo:
SimpleCodeDialog dialog = new SimpleCodeDialog("Alert", "Server restart in 5 minutes.");
```

---

## Pooling dei Widget

Creare e distruggere widget ogni frame causa problemi di prestazioni. Invece, mantieni un pool di widget riutilizzabili:

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

        // Pre-crea i widget
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

**Quando usare il pooling:**
- Liste che si aggiornano frequentemente (kill feed, chat, lista giocatori)
- Griglie con contenuto dinamico (inventario, mercato)
- Qualsiasi interfaccia che crea/distrugge 10+ widget al secondo

**Quando NON usare il pooling:**
- Pannelli statici creati una sola volta
- Dialoghi mostrati/nascosti (basta usare Show/Hide)

---

## File di Layout vs. Programmatico: Quando Usare Ciascuno

| Situazione | Raccomandazione |
|---|---|
| Struttura UI statica | File di layout (`.layout`) |
| Alberi di widget complessi | File di layout |
| Numero dinamico di elementi | `CreateWidgets()` da un modello di layout |
| Elementi runtime semplici (testo debug, marcatori) | `CreateWidget()` |
| Prototipazione rapida | `CreateWidget()` |
| Interfaccia mod di produzione | File di layout + configurazione via codice |

In pratica, la maggior parte delle mod usa **file di layout** per la struttura e **codice** per popolare i dati, mostrare/nascondere elementi e gestire gli eventi. Le interfacce puramente programmatiche sono rare al di fuori degli strumenti di debug.

---

## Prossimi Passi

- [3.6 Gestione degli Eventi](06-event-handling.md) -- Gestisci click, cambiamenti ed eventi del mouse
- [3.7 Stili, Font e Immagini](07-styles-fonts.md) -- Stile visivo e risorse immagine

---

## Teoria vs Pratica

| Concetto | Teoria | Realtà |
|---------|--------|---------|
| `CreateWidget()` crea qualsiasi tipo di widget | Tutti i TypeID funzionano con `CreateWidget()` | `ScrollWidget` e `WrapSpacerWidget` creati programmaticamente spesso necessitano di configurazione manuale dei flag (`EXACTSIZE`, dimensionamento) che i file di layout gestiscono automaticamente |
| `Unlink()` libera tutta la memoria | Widget e figli vengono distrutti | I riferimenti mantenuti nelle variabili script diventano pendenti. Imposta sempre i ref dei widget a `null` dopo `Unlink()` o rischi crash |
| `SetHandler()` instrada tutti gli eventi | Un gestore riceve tutti gli eventi del widget | Il gestore riceve eventi solo per i widget che hanno chiamato `SetHandler(this)`. I figli non ereditano il gestore dal loro genitore |
| `CreateWidgets()` da layout è istantaneo | Il layout si carica in modo sincrono | Layout grandi con molti widget annidati causano un picco di frame. Pre-carica i layout durante le schermate di caricamento, non durante il gameplay |
| Il dimensionamento proporzionale (0.0-1.0) scala al genitore | I valori sono relativi alle dimensioni del genitore | Senza il flag `EXACTSIZE`, anche i valori di `CreateWidget()` come `100` sono trattati come proporzionali (intervallo 0-1), facendo sì che i widget riempiano l'intero genitore |

---

## Compatibilità e Impatto

- **Multi-Mod:** I widget creati programmaticamente sono privati della mod che li crea. A differenza di `modded class`, non c'è rischio di collisione a meno che due mod non colleghino widget allo stesso widget genitore vanilla per nome.
- **Prestazioni:** Ogni chiamata a `CreateWidgets()` analizza il file di layout dal disco. Memorizza nella cache il widget radice e mostralo/nascondilo invece di ricrearlo dal layout ogni volta che l'interfaccia si apre.

---

## Osservato nelle Mod Reali

| Pattern | Mod | Dettaglio |
|---------|-----|--------|
| Modello layout + popolamento via codice | COT, Expansion | Carica un modello `.layout` per riga tramite `CreateWidgets()` per ogni elemento della lista, poi popola tramite `FindAnyWidget()` |
| Pooling widget per kill feed | Colorful UI | Pre-crea 20 widget per voci del feed, li mostra/nasconde invece di crearli e distruggerli |
| Dialoghi puramente via codice | Strumenti debug/admin | Semplici dialoghi di avviso costruiti interamente con `CreateWidget()` per evitare di distribuire file `.layout` aggiuntivi |
| `SetHandler(this)` su ogni figlio interattivo | VPP Admin Tools | Itera tutti i pulsanti dopo il caricamento del layout e chiama `SetHandler()` su ciascuno individualmente |
| Pattern `Unlink()` + null | DabsFramework | Il metodo `Close()` di ogni dialogo chiama `m_Root.Unlink(); m_Root = null;` in modo consistente |
