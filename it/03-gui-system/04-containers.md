# Capitolo 3.4: Widget Contenitore

[Home](../README.md) | [<< Precedente: Dimensionamento e Posizionamento](03-sizing-positioning.md) | **Widget Contenitore** | [Successivo: Widget Programmatici >>](05-programmatic-widgets.md)

---

I widget contenitore organizzano i widget figli al loro interno. Mentre `FrameWidget` è il più semplice (riquadro invisibile, posizionamento manuale), DayZ fornisce tre contenitori specializzati che gestiscono il layout automaticamente: `WrapSpacerWidget`, `GridSpacerWidget` e `ScrollWidget`.


```mermaid
graph LR
    subgraph "FrameWidget (Absolute)"
        FA["Child A<br/>pos: 10,10"]
        FB["Child B<br/>pos: 200,10"]
        FC["Child C<br/>pos: 10,100"]
    end

    subgraph "WrapSpacer (Flow)"
        WA["Item 1"] --> WB["Item 2"] --> WC["Item 3"]
        WC --> WD["Item 4<br/>(wraps to next row)"]
    end

    subgraph "GridSpacer (Grid)"
        GA["Cell 0,0"] --- GB["Cell 1,0"] --- GC["Cell 2,0"]
        GD["Cell 0,1"] --- GE["Cell 1,1"] --- GF["Cell 2,1"]
    end

    style FA fill:#4A90D9,color:#fff
    style WA fill:#2D8A4E,color:#fff
    style GA fill:#D97A4A,color:#fff
```

---

## FrameWidget -- Contenitore Strutturale

`FrameWidget` è il contenitore più basilare. Non disegna nulla sullo schermo e non dispone i suoi figli -- devi posizionare ogni figlio manualmente.

**Quando usare:**
- Raggruppare widget correlati in modo da poterli mostrare/nascondere insieme
- Widget radice di un pannello o dialogo
- Qualsiasi raggruppamento strutturale dove gestisci il posizionamento da solo

```
FrameWidgetClass MyPanel {
 size 0.5 0.5
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 0
 vexactsize 0
 {
  TextWidgetClass Header {
   position 0 0
   size 1 0.1
   text "Panel Title"
   "text halign" center
  }
  PanelWidgetClass Divider {
   position 0 0.1
   size 1 2
   hexactsize 0
   vexactsize 1
   color 1 1 1 0.3
  }
  FrameWidgetClass Content {
   position 0 0.12
   size 1 0.88
  }
 }
}
```

**Caratteristiche principali:**
- Nessun aspetto visivo (trasparente)
- I figli sono posizionati relativamente ai limiti del frame
- Nessun layout automatico -- ogni figlio necessita di posizione/dimensione esplicita
- Leggero -- costo di rendering zero oltre ai suoi figli

---

## WrapSpacerWidget -- Layout a Flusso

`WrapSpacerWidget` dispone automaticamente i suoi figli in una sequenza a flusso. I figli vengono posizionati uno dopo l'altro orizzontalmente, andando a capo alla riga successiva quando eccedono la larghezza disponibile. Questo è il widget da usare per liste dinamiche dove il numero di figli cambia a runtime.

### Attributi di Layout
| Attributo | Valori | Descrizione |
|---|---|---|
| `Padding` | intero (pixel) | Spazio tra il bordo dello spacer e i suoi figli |
| `Margin` | intero (pixel) | Spazio tra i singoli figli |
| `"Size To Content H"` | `0` o `1` | Ridimensiona la larghezza per adattarsi a tutti i figli |
| `"Size To Content V"` | `0` o `1` | Ridimensiona l'altezza per adattarsi a tutti i figli |
| `content_halign` | `left`, `center`, `right` | Allineamento orizzontale del gruppo di figli |
| `content_valign` | `top`, `center`, `bottom` | Allineamento verticale del gruppo di figli |

### Layout a Flusso Base

```
WrapSpacerWidgetClass TagList {
 size 1 0
 hexactsize 0
 "Size To Content V" 1
 Padding 5
 Margin 3
 {
  ButtonWidgetClass Tag1 {
   size 80 24
   hexactsize 1
   vexactsize 1
   text "Weapons"
  }
  ButtonWidgetClass Tag2 {
   size 60 24
   hexactsize 1
   vexactsize 1
   text "Food"
  }
  ButtonWidgetClass Tag3 {
   size 90 24
   hexactsize 1
   vexactsize 1
   text "Medical"
  }
 }
}
```

In questo esempio:
- Lo spacer occupa tutta la larghezza del genitore (`size 1`), ma la sua altezza si adatta ai figli (`"Size To Content V" 1`).
- I figli sono pulsanti larghi 80px, 60px e 90px.
- Se la larghezza disponibile non può contenere tutti e tre su una riga, lo spacer li manda a capo alla riga successiva.
- `Padding 5` aggiunge 5px di spazio all'interno dei bordi dello spacer.
- `Margin 3` aggiunge 3px tra ogni figlio.

### Lista Verticale con WrapSpacer

Per creare una lista verticale (un elemento per riga), rendi i figli a larghezza piena:

```
WrapSpacerWidgetClass ItemList {
 size 1 0
 hexactsize 0
 "Size To Content V" 1
 Margin 2
 {
  FrameWidgetClass Item1 {
   size 1 30
   hexactsize 0
   vexactsize 1
  }
  FrameWidgetClass Item2 {
   size 1 30
   hexactsize 0
   vexactsize 1
  }
 }
}
```

Ogni figlio è al 100% della larghezza (`size 1` con `hexactsize 0`), quindi solo uno entra per riga, creando uno stack verticale.

### Figli Dinamici

`WrapSpacerWidget` è ideale per figli aggiunti programmaticamente. Quando aggiungi o rimuovi figli, chiama `Update()` sullo spacer per attivare un ricalcolo del layout:

```c
WrapSpacerWidget spacer;

// Aggiungi un figlio da un file di layout
Widget child = GetGame().GetWorkspace().CreateWidgets("MyMod/gui/layouts/ListItem.layout", spacer);

// Forza lo spacer a ricalcolare
spacer.Update();
```

---

## GridSpacerWidget -- Layout a Griglia

`GridSpacerWidget` dispone i figli in una griglia uniforme. Definisci il numero di colonne e righe, e ogni cella ottiene lo stesso spazio.

### Attributi di Layout

| Attributo | Valori | Descrizione |
|---|---|---|
| `Columns` | intero | Numero di colonne della griglia |
| `Rows` | intero | Numero di righe della griglia |
| `Margin` | intero (pixel) | Spazio tra le celle della griglia |
| `"Size To Content V"` | `0` o `1` | Ridimensiona l'altezza per adattarsi al contenuto |

### Griglia Base

```
GridSpacerWidgetClass InventoryGrid {
 size 0.5 0.5
 hexactsize 0
 vexactsize 0
 Columns 4
 Rows 3
 Margin 2
 {
  // 12 celle (4 colonne x 3 righe)
  // I figli vengono posizionati in ordine: da sinistra a destra, dall'alto al basso
  FrameWidgetClass Slot1 { }
  FrameWidgetClass Slot2 { }
  FrameWidgetClass Slot3 { }
  FrameWidgetClass Slot4 { }
  FrameWidgetClass Slot5 { }
  FrameWidgetClass Slot6 { }
  FrameWidgetClass Slot7 { }
  FrameWidgetClass Slot8 { }
  FrameWidgetClass Slot9 { }
  FrameWidgetClass Slot10 { }
  FrameWidgetClass Slot11 { }
  FrameWidgetClass Slot12 { }
 }
}
```

### Griglia a Colonna Singola (Lista Verticale)

Impostando `Columns 1` si crea un semplice stack verticale dove ogni figlio ottiene la larghezza piena:

```
GridSpacerWidgetClass SettingsList {
 size 1 0
 hexactsize 0
 "Size To Content V" 1
 Columns 1
 {
  FrameWidgetClass Setting1 {
   size 150 30
   hexactsize 1
   vexactsize 1
  }
  FrameWidgetClass Setting2 {
   size 150 30
   hexactsize 1
   vexactsize 1
  }
  FrameWidgetClass Setting3 {
   size 150 30
   hexactsize 1
   vexactsize 1
  }
 }
}
```

### GridSpacer vs. WrapSpacer

| Funzionalità | GridSpacer | WrapSpacer |
|---|---|---|
| Dimensione celle | Uniforme (uguale) | Ogni figlio mantiene la propria dimensione |
| Modalità layout | Griglia fissa (colonne x righe) | Flusso con a capo |
| Ideale per | Slot inventario, gallerie uniformi | Liste dinamiche, gruppi di tag |
| Dimensionamento figli | Ignorato (la griglia lo controlla) | Rispettato (la dimensione del figlio conta) |

---

## ScrollWidget -- Viewport Scorrevole

`ScrollWidget` avvolge il contenuto che potrebbe essere più alto (o più largo) dell'area visibile, fornendo barre di scorrimento per la navigazione.

### Attributi di Layout

| Attributo | Valori | Descrizione |
|---|---|---|
| `"Scrollbar V"` | `0` o `1` | Mostra barra di scorrimento verticale |
| `"Scrollbar H"` | `0` o `1` | Mostra barra di scorrimento orizzontale |

### API Script

```c
ScrollWidget sw;
sw.VScrollToPos(float pos);     // Scorri alla posizione verticale (0 = inizio)
sw.GetVScrollPos();             // Ottieni la posizione di scorrimento corrente
sw.GetContentHeight();          // Ottieni l'altezza totale del contenuto
sw.VScrollStep(int step);       // Scorri di un valore step
```

### Lista Scorrevole Base

```
ScrollWidgetClass ListScroll {
 size 1 300
 hexactsize 0
 vexactsize 1
 "Scrollbar V" 1
 {
  WrapSpacerWidgetClass ListContent {
   size 1 0
   hexactsize 0
   "Size To Content V" 1
   {
    // Molti figli qui...
    FrameWidgetClass Item1 {
     size 1 30
     hexactsize 0
     vexactsize 1
    }
    FrameWidgetClass Item2 {
     size 1 30
     hexactsize 0
     vexactsize 1
    }
    // ... altri elementi
   }
  }
 }
}
```

---

## Il Pattern ScrollWidget + WrapSpacer

```mermaid
graph TB
    SCROLL["ScrollWidget<br/>fixed viewport size<br/>Scrollbar V = 1"]
    WRAP["WrapSpacerWidget<br/>size: 1 0<br/>Size To Content V = 1"]
    I1["Item 1"]
    I2["Item 2"]
    I3["Item 3"]
    I4["Item N..."]

    SCROLL --> WRAP
    WRAP --> I1
    WRAP --> I2
    WRAP --> I3
    WRAP --> I4

    style SCROLL fill:#4A90D9,color:#fff
    style WRAP fill:#2D8A4E,color:#fff
```

Questo è **il** pattern per liste dinamiche scorrevoli nelle mod DayZ. Combina un `ScrollWidget` ad altezza fissa con un `WrapSpacerWidget` che cresce per adattarsi ai suoi figli.

```
// Viewport di scorrimento ad altezza fissa
ScrollWidgetClass DialogScroll {
 size 0.97 235
 hexactsize 0
 vexactsize 1
 "Scrollbar V" 1
 {
  // Il contenuto cresce verticalmente per adattarsi a tutti i figli
  WrapSpacerWidgetClass DialogContent {
   size 1 0
   hexactsize 0
   "Size To Content V" 1
  }
 }
}
```

Come funziona:

1. Il `ScrollWidget` ha un'altezza **fissa** (235 pixel in questo esempio).
2. Al suo interno, il `WrapSpacerWidget` ha `"Size To Content V" 1`, quindi la sua altezza cresce man mano che vengono aggiunti figli.
3. Quando il contenuto dello spacer eccede i 235 pixel, la scrollbar appare e l'utente può scorrere.

Questo pattern appare in tutto DabsFramework, DayZ Editor, Expansion e virtualmente in ogni mod DayZ professionale.

### Aggiunta di Elementi Programmatica

```c
ScrollWidget m_Scroll;
WrapSpacerWidget m_Content;

void AddItem(string text)
{
    // Crea un nuovo figlio dentro il WrapSpacer
    Widget item = GetGame().GetWorkspace().CreateWidgets(
        "MyMod/gui/layouts/ListItem.layout", m_Content);

    // Configura il nuovo elemento
    TextWidget tw = TextWidget.Cast(item.FindAnyWidget("Label"));
    tw.SetText(text);

    // Forza il ricalcolo del layout
    m_Content.Update();
}

void ScrollToBottom()
{
    m_Scroll.VScrollToPos(m_Scroll.GetContentHeight());
}

void ClearAll()
{
    // Rimuovi tutti i figli
    Widget child = m_Content.GetChildren();
    while (child)
    {
        Widget next = child.GetSibling();
        child.Unlink();
        child = next;
    }
    m_Content.Update();
}
```

---

## Regole di Annidamento

I contenitori possono essere annidati per creare layout complessi. Alcune linee guida:

1. **FrameWidget dentro qualsiasi cosa** -- Funziona sempre. Usa i frame per raggruppare sotto-sezioni all'interno di spacer o griglie.

2. **WrapSpacer dentro ScrollWidget** -- Il pattern standard per liste scorrevoli. Lo spacer cresce; lo scroll ritaglia.

3. **GridSpacer dentro WrapSpacer** -- Funziona. Utile per inserire una griglia fissa come un elemento in un layout a flusso.

4. **ScrollWidget dentro WrapSpacer** -- Possibile ma richiede un'altezza fissa sul widget di scorrimento (`vexactsize 1`). Senza un'altezza fissa, lo scroll widget cercherà di crescere per adattarsi al suo contenuto (vanificando lo scopo dello scorrimento).

5. **Evita l'annidamento profondo** -- Ogni livello di annidamento aggiunge costo di calcolo del layout. Tre o quattro livelli di profondità sono tipici per interfacce complesse; andare oltre sei livelli suggerisce che il layout dovrebbe essere ristrutturato.

---

## Quando Usare Ogni Contenitore

| Scenario | Contenitore Migliore |
|---|---|
| Pannello statico con elementi posizionati manualmente | `FrameWidget` |
| Lista dinamica di elementi a dimensione variabile | `WrapSpacerWidget` |
| Griglia uniforme (inventario, galleria) | `GridSpacerWidget` |
| Lista verticale con un elemento per riga | `WrapSpacerWidget` (figli a larghezza piena) o `GridSpacerWidget` (`Columns 1`) |
| Contenuto più alto dello spazio disponibile | `ScrollWidget` che avvolge uno spacer |
| Area contenuto delle schede | `FrameWidget` (alterna la visibilità dei figli) |
| Pulsanti della barra strumenti | `WrapSpacerWidget` o `GridSpacerWidget` |

---

## Esempio Completo: Pannello Impostazioni Scorrevole

Un pannello impostazioni con una barra del titolo, un'area di contenuto scorrevole con opzioni disposte a griglia e una barra di pulsanti in basso:

```
FrameWidgetClass SettingsPanel {
 size 0.4 0.6
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 0
 vexactsize 0
 {
  // Barra del titolo
  PanelWidgetClass TitleBar {
   position 0 0
   size 1 30
   hexactsize 0
   vexactsize 1
   color 0.2 0.4 0.8 1
  }

  // Area impostazioni scorrevole
  ScrollWidgetClass SettingsScroll {
   position 0 30
   size 1 0
   hexactpos 0
   vexactpos 1
   hexactsize 0
   vexactsize 0
   "Scrollbar V" 1
   {
    GridSpacerWidgetClass SettingsGrid {
     size 1 0
     hexactsize 0
     "Size To Content V" 1
     Columns 1
     Margin 2
    }
   }
  }

  // Barra pulsanti in basso
  FrameWidgetClass ButtonBar {
   size 1 40
   halign left_ref
   valign bottom_ref
   hexactpos 0
   vexactpos 1
   hexactsize 0
   vexactsize 1
  }
 }
}
```

---

## Buone Pratiche

- Chiama sempre `Update()` su un `WrapSpacerWidget` o `GridSpacerWidget` dopo aver aggiunto o rimosso figli programmaticamente. Senza questa chiamata, lo spacer non ricalcola il suo layout e i figli potrebbero sovrapporsi o essere invisibili.
- Usa `ScrollWidget` + `WrapSpacerWidget` come pattern standard per qualsiasi lista dinamica. Imposta lo scroll a un'altezza fissa in pixel e lo spacer interno a `"Size To Content V" 1`.
- Preferisci `WrapSpacerWidget` con figli a larghezza piena rispetto a `GridSpacerWidget Columns 1` per liste verticali dove gli elementi hanno altezze variabili. GridSpacer forza dimensioni uniformi delle celle.
- Imposta sempre `clipchildren 1` sul `ScrollWidget`. Senza di esso, il contenuto che eccede viene renderizzato fuori dai limiti del viewport di scorrimento.
- Evita di annidare più di 4-5 livelli di contenitori. Ogni livello aggiunge costo di calcolo del layout e rende il debug significativamente più difficile.

---

## Teoria vs Pratica

> Cosa dice la documentazione rispetto a come funzionano effettivamente le cose a runtime.

| Concetto | Teoria | Realtà |
|---------|--------|---------|
| `WrapSpacerWidget.Update()` | Il layout si ricalcola automaticamente quando i figli cambiano | Devi chiamare `Update()` manualmente dopo `CreateWidgets()` o `Unlink()`. Dimenticarlo è il bug più comune degli spacer |
| `"Size To Content V"` | Lo spacer cresce per adattarsi ai figli | Funziona solo se i figli hanno dimensioni esplicite (altezza in pixel o genitore proporzionale noto). Se i figli sono anch'essi `Size To Content`, ottieni altezza zero |
| `GridSpacerWidget` dimensionamento celle | La griglia controlla la dimensione delle celle uniformemente | Gli attributi di dimensione dei figli vengono ignorati -- la griglia li sovrascrive. Impostare `size` su un figlio della griglia non ha effetto |
| `ScrollWidget` posizione di scorrimento | `VScrollToPos(0)` scorre all'inizio | Dopo aver aggiunto figli, potresti dover ritardare `VScrollToPos()` di un frame (tramite `CallLater`) perché l'altezza del contenuto non è ancora stata ricalcolata |
| Spacer annidati | Gli spacer possono annidarsi liberamente | Un `WrapSpacer` dentro un `WrapSpacer` funziona, ma `Size To Content` su entrambi i livelli può causare loop di layout infiniti che bloccano l'interfaccia |

---

## Compatibilità e Impatto

- **Multi-Mod:** I widget contenitore sono per-layout e non entrano in conflitto tra mod. Tuttavia, se due mod iniettano figli nello stesso `ScrollWidget` vanilla (tramite `modded class`), l'ordine dei figli è imprevedibile.
- **Prestazioni:** `WrapSpacerWidget.Update()` ricalcola le posizioni di tutti i figli. Per liste con 100+ elementi, chiama `Update()` una volta dopo le operazioni in batch, non dopo ogni singola aggiunta. GridSpacer è più veloce per griglie uniformi perché le posizioni delle celle sono calcolate aritmeticamente.
- **Versione:** `WrapSpacerWidget` e `GridSpacerWidget` sono disponibili da DayZ 1.0. Gli attributi `"Size To Content H/V"` erano presenti dall'inizio ma il loro comportamento con layout profondamente annidati è stato stabilizzato intorno a DayZ 1.10.

---

## Osservato nelle Mod Reali

| Pattern | Mod | Dettaglio |
|---------|-----|--------|
| `ScrollWidget` + `WrapSpacerWidget` per liste dinamiche | DabsFramework, Expansion, COT | Viewport di scorrimento ad altezza fissa con spacer interno a crescita automatica -- il pattern universale per liste scorrevoli |
| `GridSpacerWidget Columns 10` per inventario | DayZ Vanilla | La griglia inventario usa GridSpacer con conteggio colonne fisso corrispondente al layout degli slot |
| Figli raggruppati in WrapSpacer | VPP Admin Tools | Pre-crea un pool di widget per gli elementi della lista, li mostra/nasconde invece di crearli/distruggerli per evitare l'overhead di `Update()` |
| `WrapSpacerWidget` come radice del dialogo | COT, DayZ Editor | La radice del dialogo usa `Size To Content V/H` così il dialogo si auto-dimensiona intorno al suo contenuto senza dimensioni hardcoded |

---

## Prossimi Passi

- [3.5 Creazione Programmatica di Widget](05-programmatic-widgets.md) -- Crea widget da codice
- [3.6 Gestione degli Eventi](06-event-handling.md) -- Rispondi a click, cambiamenti e altri eventi
