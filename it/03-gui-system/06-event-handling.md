# Capitolo 3.6: Gestione degli Eventi

[Home](../README.md) | [<< Precedente: Creazione Programmatica di Widget](05-programmatic-widgets.md) | **Gestione degli Eventi** | [Successivo: Stili, Font e Immagini >>](07-styles-fonts.md)

---

I widget generano eventi quando l'utente interagisce con essi -- cliccando pulsanti, digitando nelle caselle di testo, muovendo il mouse, trascinando elementi. Questo capitolo copre come ricevere e gestire quegli eventi.

---

## ScriptedWidgetEventHandler

La classe `ScriptedWidgetEventHandler` è il fondamento di tutta la gestione degli eventi dei widget in DayZ. Fornisce metodi da sovrascrivere per ogni possibile evento del widget.

Per ricevere eventi da un widget, crea una classe che estende `ScriptedWidgetEventHandler`, sovrascrivi i metodi degli eventi che ti interessano e collega il gestore al widget con `SetHandler()`.

### Lista Completa dei Metodi degli Eventi

```c
class ScriptedWidgetEventHandler
{
    // Eventi di click
    bool OnClick(Widget w, int x, int y, int button);
    bool OnDoubleClick(Widget w, int x, int y, int button);

    // Eventi di selezione
    bool OnSelect(Widget w, int x, int y);
    bool OnItemSelected(Widget w, int x, int y, int row, int column,
                         int oldRow, int oldColumn);

    // Eventi di focus
    bool OnFocus(Widget w, int x, int y);
    bool OnFocusLost(Widget w, int x, int y);

    // Eventi del mouse
    bool OnMouseEnter(Widget w, int x, int y);
    bool OnMouseLeave(Widget w, Widget enterW, int x, int y);
    bool OnMouseWheel(Widget w, int x, int y, int wheel);
    bool OnMouseButtonDown(Widget w, int x, int y, int button);
    bool OnMouseButtonUp(Widget w, int x, int y, int button);

    // Eventi della tastiera
    bool OnKeyDown(Widget w, int x, int y, int key);
    bool OnKeyUp(Widget w, int x, int y, int key);
    bool OnKeyPress(Widget w, int x, int y, int key);

    // Eventi di cambiamento (cursori, checkbox, caselle di testo)
    bool OnChange(Widget w, int x, int y, bool finished);

    // Eventi di drag and drop
    bool OnDrag(Widget w, int x, int y);
    bool OnDragging(Widget w, int x, int y, Widget receiver);
    bool OnDraggingOver(Widget w, int x, int y, Widget receiver);
    bool OnDrop(Widget w, int x, int y, Widget receiver);
    bool OnDropReceived(Widget w, int x, int y, Widget receiver);

    // Eventi del controller (gamepad)
    bool OnController(Widget w, int control, int value);

    // Eventi di layout
    bool OnResize(Widget w, int x, int y);
    bool OnChildAdd(Widget w, Widget child);
    bool OnChildRemove(Widget w, Widget child);

    // Altro
    bool OnUpdate(Widget w);
    bool OnModalResult(Widget w, int x, int y, int code, int result);
}
```

### Valore di Ritorno: Consumato vs Passato

Ogni gestore di eventi restituisce un `bool`:

- **`return true;`** -- L'evento è **consumato**. Nessun altro gestore lo riceverà. L'evento smette di propagarsi verso l'alto nella gerarchia dei widget.
- **`return false;`** -- L'evento è **passato** al gestore del widget genitore (se presente).

Questo è fondamentale per costruire interfacce a livelli. Ad esempio, un gestore di click su un pulsante dovrebbe restituire `true` per impedire che il click attivi anche un pannello dietro di esso.

---

## Registrare i Gestori con SetHandler()

Il modo più semplice per gestire gli eventi è chiamare `SetHandler()` su un widget:

```c
class MyPanel : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected ButtonWidget m_SaveBtn;
    protected ButtonWidget m_CancelBtn;

    void MyPanel()
    {
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/gui/layouts/panel.layout");

        m_SaveBtn = ButtonWidget.Cast(m_Root.FindAnyWidget("SaveButton"));
        m_CancelBtn = ButtonWidget.Cast(m_Root.FindAnyWidget("CancelButton"));

        // Registra questa classe come gestore di eventi per entrambi i pulsanti
        m_SaveBtn.SetHandler(this);
        m_CancelBtn.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_SaveBtn)
        {
            Save();
            return true;  // Consumato
        }

        if (w == m_CancelBtn)
        {
            Cancel();
            return true;
        }

        return false;  // Non è il nostro widget, passa oltre
    }
}
```

Una singola istanza di gestore può essere registrata su più widget. All'interno del metodo dell'evento, confronta `w` (il widget che ha generato l'evento) con i tuoi riferimenti memorizzati per determinare con quale widget si è interagito.

---

## Eventi Comuni nel Dettaglio

### OnClick

```c
bool OnClick(Widget w, int x, int y, int button)
```

Generato quando un `ButtonWidget` viene cliccato (mouse rilasciato sopra il widget).

- `w` -- Il widget cliccato
- `x, y` -- Posizione del cursore del mouse (pixel dello schermo)
- `button` -- Indice del pulsante del mouse: `0` = sinistro, `1` = destro, `2` = centrale

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (button != 0) return false;  // Gestisci solo il click sinistro

    if (w == m_MyButton)
    {
        DoAction();
        return true;
    }
    return false;
}
```

### OnChange

```c
bool OnChange(Widget w, int x, int y, bool finished)
```

Generato da `SliderWidget`, `CheckBoxWidget`, `EditBoxWidget` e altri widget basati su valori quando il loro valore cambia.

- `w` -- Il widget il cui valore è cambiato
- `finished` -- Per i cursori: `true` quando l'utente rilascia la maniglia. Per le caselle di testo: `true` quando viene premuto Invio.

```c
override bool OnChange(Widget w, int x, int y, bool finished)
{
    if (w == m_VolumeSlider)
    {
        SliderWidget slider = SliderWidget.Cast(w);
        float value = slider.GetCurrent();

        // Applica solo quando l'utente finisce di trascinare
        if (finished)
        {
            ApplyVolume(value);
        }
        else
        {
            // Anteprima durante il trascinamento
            PreviewVolume(value);
        }
        return true;
    }

    if (w == m_NameInput)
    {
        EditBoxWidget edit = EditBoxWidget.Cast(w);
        string text = edit.GetText();

        if (finished)
        {
            // L'utente ha premuto Invio
            SubmitName(text);
        }
        return true;
    }

    if (w == m_EnableCheckbox)
    {
        CheckBoxWidget cb = CheckBoxWidget.Cast(w);
        bool checked = cb.IsChecked();
        ToggleFeature(checked);
        return true;
    }

    return false;
}
```

### OnMouseEnter / OnMouseLeave

```c
bool OnMouseEnter(Widget w, int x, int y)
bool OnMouseLeave(Widget w, Widget enterW, int x, int y)
```

Generati quando il cursore del mouse entra o esce dai limiti di un widget. Il parametro `enterW` in `OnMouseLeave` è il widget verso cui il cursore si è spostato.

Uso comune: effetti hover.

```c
override bool OnMouseEnter(Widget w, int x, int y)
{
    if (w == m_HoverPanel)
    {
        m_HoverPanel.SetColor(ARGB(255, 80, 130, 200));  // Evidenzia
        return true;
    }
    return false;
}

override bool OnMouseLeave(Widget w, Widget enterW, int x, int y)
{
    if (w == m_HoverPanel)
    {
        m_HoverPanel.SetColor(ARGB(255, 50, 50, 50));  // Predefinito
        return true;
    }
    return false;
}
```

### OnFocus / OnFocusLost

```c
bool OnFocus(Widget w, int x, int y)
bool OnFocusLost(Widget w, int x, int y)
```

Generati quando un widget ottiene o perde il focus della tastiera. Importante per le caselle di testo e altri widget di input.

```c
override bool OnFocus(Widget w, int x, int y)
{
    if (w == m_SearchBox)
    {
        m_SearchBox.SetColor(ARGB(255, 100, 160, 220));
        return true;
    }
    return false;
}

override bool OnFocusLost(Widget w, int x, int y)
{
    if (w == m_SearchBox)
    {
        m_SearchBox.SetColor(ARGB(255, 60, 60, 60));
        return true;
    }
    return false;
}
```

### OnMouseWheel

```c
bool OnMouseWheel(Widget w, int x, int y, int wheel)
```

Generato quando la rotella del mouse scorre sopra un widget. `wheel` è positivo per scorrimento verso l'alto, negativo per scorrimento verso il basso.

### OnKeyDown / OnKeyUp / OnKeyPress

```c
bool OnKeyDown(Widget w, int x, int y, int key)
bool OnKeyUp(Widget w, int x, int y, int key)
bool OnKeyPress(Widget w, int x, int y, int key)
```

Eventi della tastiera. Il parametro `key` corrisponde alle costanti `KeyCode` (ad es. `KeyCode.KC_ESCAPE`, `KeyCode.KC_RETURN`).

### OnDrag / OnDrop / OnDropReceived

```c
bool OnDrag(Widget w, int x, int y)
bool OnDrop(Widget w, int x, int y, Widget receiver)
bool OnDropReceived(Widget w, int x, int y, Widget receiver)
```

Eventi di drag and drop. Il widget deve avere `draggable 1` nel suo layout (o `WidgetFlags.DRAGGABLE` impostato nel codice).

- `OnDrag` -- L'utente ha iniziato a trascinare il widget `w`
- `OnDrop` -- Il widget `w` è stato rilasciato; `receiver` è il widget sottostante
- `OnDropReceived` -- Il widget `w` ha ricevuto un rilascio; `receiver` è il widget rilasciato

### OnItemSelected

```c
bool OnItemSelected(Widget w, int x, int y, int row, int column,
                     int oldRow, int oldColumn)
```

Generato da `TextListboxWidget` quando viene selezionata una riga.

---

## WidgetEventHandler Vanilla (Registrazione Callback)

Il codice vanilla di DayZ usa un pattern alternativo: `WidgetEventHandler`, un singleton che instrada gli eventi a funzioni callback nominate. Questo è comunemente usato nei menu vanilla.

```c
WidgetEventHandler handler = WidgetEventHandler.GetInstance();

// Registra callback degli eventi per nome di funzione
handler.RegisterOnClick(myButton, this, "OnMyButtonClick");
handler.RegisterOnMouseEnter(myWidget, this, "OnHoverStart");
handler.RegisterOnMouseLeave(myWidget, this, "OnHoverEnd");
handler.RegisterOnDoubleClick(myWidget, this, "OnDoubleClick");
handler.RegisterOnMouseButtonDown(myWidget, this, "OnMouseDown");
handler.RegisterOnMouseButtonUp(myWidget, this, "OnMouseUp");
handler.RegisterOnMouseWheel(myWidget, this, "OnWheel");
handler.RegisterOnFocus(myWidget, this, "OnFocusGained");
handler.RegisterOnFocusLost(myWidget, this, "OnFocusLost");
handler.RegisterOnDrag(myWidget, this, "OnDragStart");
handler.RegisterOnDrop(myWidget, this, "OnDropped");
handler.RegisterOnDropReceived(myWidget, this, "OnDropReceived");
handler.RegisterOnDraggingOver(myWidget, this, "OnDragOver");
handler.RegisterOnChildAdd(myWidget, this, "OnChildAdded");
handler.RegisterOnChildRemove(myWidget, this, "OnChildRemoved");

// Cancella la registrazione di tutti i callback per un widget
handler.UnregisterWidget(myWidget);
```

Le firme delle funzioni callback devono corrispondere al tipo di evento:

```c
void OnMyButtonClick(Widget w, int x, int y, int button)
{
    // Gestisci il click
}

void OnHoverStart(Widget w, int x, int y)
{
    // Gestisci l'entrata del mouse
}

void OnHoverEnd(Widget w, Widget enterW, int x, int y)
{
    // Gestisci l'uscita del mouse
}
```

### SetHandler() vs. WidgetEventHandler

| Aspetto | SetHandler() | WidgetEventHandler |
|---|---|---|
| Pattern | Sovrascrivi metodi virtuali | Registra callback nominati |
| Gestore per widget | Un gestore per widget | Callback multipli per evento |
| Usato da | DabsFramework, Expansion, mod personalizzate | Menu vanilla di DayZ |
| Flessibilità | Deve gestire tutti gli eventi in una classe | Può registrare target diversi per eventi diversi |
| Pulizia | Implicita quando il gestore viene distrutto | Deve chiamare `UnregisterWidget()` |

Per le nuove mod, `SetHandler()` con `ScriptedWidgetEventHandler` è l'approccio consigliato.

---

## Esempio Completo: Pannello con Pulsanti Interattivi

Un pannello con tre pulsanti che cambiano colore all'hover ed eseguono azioni al click:

```c
class InteractivePanel : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected ButtonWidget m_BtnStart;
    protected ButtonWidget m_BtnStop;
    protected ButtonWidget m_BtnReset;
    protected TextWidget m_StatusText;

    protected int m_DefaultColor = ARGB(255, 60, 60, 60);
    protected int m_HoverColor   = ARGB(255, 80, 130, 200);
    protected int m_ActiveColor  = ARGB(255, 50, 180, 80);

    void InteractivePanel()
    {
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/gui/layouts/interactive_panel.layout");

        m_BtnStart  = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnStart"));
        m_BtnStop   = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnStop"));
        m_BtnReset  = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnReset"));
        m_StatusText = TextWidget.Cast(m_Root.FindAnyWidget("StatusText"));

        // Registra questo gestore su tutti i widget interattivi
        m_BtnStart.SetHandler(this);
        m_BtnStop.SetHandler(this);
        m_BtnReset.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (button != 0) return false;

        if (w == m_BtnStart)
        {
            m_StatusText.SetText("Avviato");
            m_StatusText.SetColor(m_ActiveColor);
            return true;
        }
        if (w == m_BtnStop)
        {
            m_StatusText.SetText("Fermato");
            m_StatusText.SetColor(ARGB(255, 200, 50, 50));
            return true;
        }
        if (w == m_BtnReset)
        {
            m_StatusText.SetText("Pronto");
            m_StatusText.SetColor(ARGB(255, 200, 200, 200));
            return true;
        }
        return false;
    }

    override bool OnMouseEnter(Widget w, int x, int y)
    {
        if (w == m_BtnStart || w == m_BtnStop || w == m_BtnReset)
        {
            w.SetColor(m_HoverColor);
            return true;
        }
        return false;
    }

    override bool OnMouseLeave(Widget w, Widget enterW, int x, int y)
    {
        if (w == m_BtnStart || w == m_BtnStop || w == m_BtnReset)
        {
            w.SetColor(m_DefaultColor);
            return true;
        }
        return false;
    }

    void Show(bool visible)
    {
        m_Root.Show(visible);
    }

    void ~InteractivePanel()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }
    }
}
```

---

## Buone Pratiche per la Gestione degli Eventi

1. **Restituisci sempre `true` quando gestisci un evento** -- Altrimenti l'evento si propaga ai widget genitori e potrebbe attivare comportamenti indesiderati.

2. **Restituisci `false` per gli eventi che non gestisci** -- Questo permette ai widget genitori di processare l'evento.

3. **Memorizza nella cache i riferimenti ai widget** -- Non chiamare `FindAnyWidget()` all'interno dei gestori di eventi. Cerca i widget una volta nel costruttore e memorizza i riferimenti.

4. **Controlla la nullità dei widget negli eventi** -- Il widget `w` è di solito valido, ma la programmazione difensiva previene i crash.

5. **Pulisci i gestori** -- Quando distruggi un pannello, scollega il widget radice. Se usi `WidgetEventHandler`, chiama `UnregisterWidget()`.

6. **Usa il parametro `finished` con saggezza** -- Per i cursori, applica operazioni costose solo quando `finished` è `true` (l'utente ha rilasciato la maniglia). Usa gli eventi non-finished per l'anteprima.

7. **Rinvia il lavoro pesante** -- Se un gestore di eventi deve fare calcoli costosi, usa `CallLater` per rinviarlo:

```c
override bool OnClick(Widget w, int x, int y, int button)
{
    if (w == m_HeavyActionBtn)
    {
        GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(DoHeavyWork, 0, false);
        return true;
    }
    return false;
}
```

---

## Teoria vs Pratica

> Cosa dice la documentazione rispetto a come funzionano effettivamente le cose a runtime.

| Concetto | Teoria | Realtà |
|---------|--------|---------|
| `OnClick` si attiva su qualsiasi widget | Qualsiasi widget può ricevere eventi di click | Solo `ButtonWidget` attiva `OnClick` in modo affidabile. Per altri tipi di widget, usa `OnMouseButtonDown` / `OnMouseButtonUp` invece |
| `SetHandler()` sostituisce il gestore | Impostare un nuovo gestore sostituisce il vecchio | Corretto, ma il vecchio gestore non viene notificato. Se conteneva risorse, queste vengono perse. Pulisci sempre prima di sostituire i gestori |
| Il parametro `finished` di `OnChange` | `true` quando l'utente finisce l'interazione | Per `EditBoxWidget`, `finished` è `true` solo al tasto Invio -- tabulare via o cliccare altrove NON imposta `finished` a `true` |
| Propagazione del valore di ritorno dell'evento | `return false` passa l'evento al genitore | Gli eventi si propagano verso l'alto nell'albero dei widget, non ai widget fratelli. Un `return false` da un figlio va al suo genitore, mai a un widget adiacente |
| Nomi dei callback di `WidgetEventHandler` | Qualsiasi nome di funzione funziona | La funzione deve esistere sull'oggetto target al momento della registrazione. Se il nome della funzione è scritto male, la registrazione riesce silenziosamente ma il callback non si attiva mai |

---

## Compatibilità e Impatto

- **Multi-Mod:** `SetHandler()` permette un solo gestore per widget. Se la mod A e la mod B chiamano entrambe `SetHandler()` sullo stesso widget vanilla (tramite `modded class`), l'ultimo vince e l'altro smette silenziosamente di ricevere eventi. Usa `WidgetEventHandler.RegisterOnClick()` per compatibilità multi-mod additiva.
- **Prestazioni:** I gestori di eventi si attivano sul thread principale del gioco. Un gestore `OnClick` lento (ad es. I/O su file o calcoli complessi) causa scatti visibili dei frame. Rinvia il lavoro pesante con `GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater()`.
- **Versione:** L'API `ScriptedWidgetEventHandler` è stabile da DayZ 1.0. I callback singleton di `WidgetEventHandler` sono pattern vanilla presenti dalle prime versioni di Enforce Script e rimangono invariati.

---

## Osservato nelle Mod Reali

| Pattern | Mod | Dettaglio |
|---------|-----|--------|
| Gestore singolo per intero pannello | COT, VPP Admin Tools | Una sottoclasse di `ScriptedWidgetEventHandler` gestisce tutti i pulsanti in un pannello, smistando confrontando `w` con i riferimenti ai widget memorizzati |
| `WidgetEventHandler.RegisterOnClick` per pulsanti modulari | Expansion Market | Ogni pulsante compra/vendi creato dinamicamente registra il proprio callback, permettendo funzioni gestore per-elemento |
| `OnMouseEnter` / `OnMouseLeave` per tooltip hover | DayZ Editor | Gli eventi hover attivano widget tooltip che seguono la posizione del cursore tramite `GetMousePos()` |
| Rinvio `CallLater` in `OnClick` | DabsFramework | Le operazioni pesanti (salvataggio config, invio RPC) vengono rinviate di 0ms tramite `CallLater` per evitare di bloccare il thread UI durante l'evento |

---

## Prossimi Passi

- [3.7 Stili, Font e Immagini](07-styles-fonts.md) -- Stile visivo con stili, font e riferimenti imageset
- [3.5 Creazione Programmatica di Widget](05-programmatic-widgets.md) -- Creare widget che generano eventi
