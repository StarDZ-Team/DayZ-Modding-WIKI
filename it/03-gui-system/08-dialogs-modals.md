# Capitolo 3.8: Dialoghi e Modali

[Home](../README.md) | [<< Precedente: Stili, Font e Immagini](07-styles-fonts.md) | **Dialoghi e Modali** | [Successivo: Pattern UI dei Mod Reali >>](09-real-mod-patterns.md)

---

I dialoghi sono finestre overlay temporanee che richiedono l'interazione dell'utente -- prompt di conferma, messaggi di avviso, form di input e pannelli delle impostazioni. Questo capitolo copre il sistema di dialogo integrato, i pattern di dialogo manuali, la struttura del layout, la gestione del focus e le insidie comuni.

---

## Modale vs. Non Modale

Esistono due tipi fondamentali di dialogo:

- **Modale** -- Blocca tutta l'interazione con il contenuto dietro il dialogo. L'utente deve rispondere (conferma, annulla, chiudi) prima di fare qualsiasi altra cosa. Esempi: conferma di uscita, avviso di cancellazione, prompt di rinomina.
- **Non modale** -- Permette all'utente di interagire con il contenuto dietro il dialogo mentre rimane aperto. Esempi: pannelli informativi, finestre delle impostazioni, palette degli strumenti.

In DayZ, la distinzione è controllata dal fatto che si blocchi l'input di gioco quando il dialogo si apre. Un dialogo modale chiama `ChangeGameFocus(1)` e mostra il cursore; un dialogo non modale può saltare questo passaggio o usare un approccio a toggle.

---

## UIScriptedMenu -- Il Sistema Integrato

`UIScriptedMenu` è la classe base a livello del motore per tutte le schermate di menu in DayZ. Si integra con lo stack dei menu di `UIManager`, gestisce il blocco dell'input automaticamente e fornisce hook del ciclo di vita. Il DayZ vanilla lo usa per il menu in-game, il dialogo di logout, il dialogo di respawn, il menu delle opzioni e molti altri.

### Gerarchia delle Classi

```
UIMenuPanel          (base: stack menu, Close(), gestione sottomenu)
  UIScriptedMenu     (menu scriptati: Init(), OnShow(), OnHide(), Update())
```

### Dialogo UIScriptedMenu Minimale

```c
class MyDialog extends UIScriptedMenu
{
    protected ButtonWidget m_BtnConfirm;
    protected ButtonWidget m_BtnCancel;
    protected TextWidget   m_MessageText;

    override Widget Init()
    {
        layoutRoot = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/my_dialog.layout");

        m_BtnConfirm  = ButtonWidget.Cast(
            layoutRoot.FindAnyWidget("BtnConfirm"));
        m_BtnCancel   = ButtonWidget.Cast(
            layoutRoot.FindAnyWidget("BtnCancel"));
        m_MessageText = TextWidget.Cast(
            layoutRoot.FindAnyWidget("MessageText"));

        return layoutRoot;
    }

    override void OnShow()
    {
        super.OnShow();
        // super.OnShow() chiama LockControls() che gestisce:
        //   GetGame().GetInput().ChangeGameFocus(1);
        //   GetGame().GetUIManager().ShowUICursor(true);
    }

    override void OnHide()
    {
        super.OnHide();
        // super.OnHide() chiama UnlockControls() che gestisce:
        //   GetGame().GetInput().ChangeGameFocus(-1);
        //   GetGame().GetUIManager().ShowUICursor(false);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        super.OnClick(w, x, y, button);

        if (w == m_BtnConfirm)
        {
            // Esegui l'azione
            Close();
            return true;
        }

        if (w == m_BtnCancel)
        {
            Close();
            return true;
        }

        return false;
    }

    override void Update(float timeslice)
    {
        super.Update(timeslice);

        // ESC per chiudere
        if (GetUApi().GetInputByID(UAUIBack).LocalPress())
        {
            Close();
        }
    }
}
```

### Apertura e Chiusura

```c
// Apertura -- crea il menu e lo inserisce nello stack di UIManager
MyDialog dialog = new MyDialog();
GetGame().GetUIManager().ShowScriptedMenu(dialog, null);

// Chiusura dall'esterno
GetGame().GetUIManager().HideScriptedMenu(dialog);

// Chiusura dall'interno della classe dialogo
Close();
```

`ShowScriptedMenu()` inserisce il menu nello stack dei menu del motore, attiva `Init()`, poi `OnShow()`. `Close()` attiva `OnHide()`, lo rimuove dallo stack e distrugge l'albero dei widget.

### Metodi Chiave del Ciclo di Vita

| Metodo | Quando Viene Chiamato | Uso Tipico |
|--------|------------|-------------|
| `Init()` | Una volta, quando il menu viene creato | Crea widget, memorizza riferimenti |
| `OnShow()` | Dopo che il menu diventa visibile | Blocca input, avvia timer |
| `OnHide()` | Dopo che il menu viene nascosto | Sblocca input, annulla timer |
| `Update(float timeslice)` | Ogni frame mentre è visibile | Controlla input (tasto ESC), animazioni |
| `Cleanup()` | Prima della distruzione | Rilascia risorse |

### LockControls / UnlockControls

`UIScriptedMenu` fornisce metodi integrati che `OnShow()` e `OnHide()` chiamano automaticamente:

```c
// Dentro UIScriptedMenu (codice del motore, semplificato):
void LockControls()
{
    g_Game.GetInput().ChangeGameFocus(1, INPUT_DEVICE_MOUSE);
    g_Game.GetUIManager().ShowUICursor(true);
    g_Game.GetInput().ChangeGameFocus(1, INPUT_DEVICE_KEYBOARD);
    g_Game.GetInput().ChangeGameFocus(1, INPUT_DEVICE_GAMEPAD);
}

void UnlockControls()
{
    g_Game.GetInput().ChangeGameFocus(-1, INPUT_DEVICE_MOUSE);
    g_Game.GetInput().ChangeGameFocus(-1, INPUT_DEVICE_KEYBOARD);
    g_Game.GetInput().ChangeGameFocus(-1, INPUT_DEVICE_GAMEPAD);
    // La visibilità del cursore dipende dall'esistenza di un menu padre
}
```

Poiché `UIScriptedMenu` gestisce il focus automaticamente in `OnShow()`/`OnHide()`, raramente hai bisogno di chiamare `ChangeGameFocus()` tu stesso quando usi questa classe base. Basta chiamare `super.OnShow()` e `super.OnHide()`.

---

## ShowDialog Integrato (Finestre di Messaggio Native)

Il motore fornisce un sistema di dialogo nativo per semplici prompt di conferma. Renderizza una finestra di dialogo appropriata alla piattaforma senza richiedere alcun file layout.

### Utilizzo

```c
// Mostra un dialogo di conferma Sì/No
const int MY_DIALOG_ID = 500;

g_Game.GetUIManager().ShowDialog(
    "Confirm Action",                  // titolo
    "Are you sure you want to do this?", // testo
    MY_DIALOG_ID,                      // ID personalizzato per identificare questo dialogo
    DBT_YESNO,                         // configurazione pulsanti
    DBB_YES,                           // pulsante predefinito
    DMT_QUESTION,                      // tipo di icona
    this                               // handler (riceve OnModalResult)
);
```

### Ricezione del Risultato

L'handler (il `UIScriptedMenu` passato come ultimo argomento) riceve il risultato tramite `OnModalResult`:

```c
override bool OnModalResult(Widget w, int x, int y, int code, int result)
{
    if (code == MY_DIALOG_ID)
    {
        if (result == DBB_YES)
        {
            PerformAction();
        }
        // DBB_NO significa che l'utente ha rifiutato -- non fare nulla
        return true;
    }

    return false;
}
```

### Costanti

**Configurazioni dei pulsanti** (`DBT_` -- DialogBoxType):

| Costante | Pulsanti Mostrati |
|----------|---------------|
| `DBT_OK` | OK |
| `DBT_YESNO` | Sì, No |
| `DBT_YESNOCANCEL` | Sì, No, Annulla |

**Identificatori dei pulsanti** (`DBB_` -- DialogBoxButton):

| Costante | Valore | Significato |
|----------|-------|---------|
| `DBB_NONE` | 0 | Nessun predefinito |
| `DBB_OK` | 1 | Pulsante OK |
| `DBB_YES` | 2 | Pulsante Sì |
| `DBB_NO` | 3 | Pulsante No |
| `DBB_CANCEL` | 4 | Pulsante Annulla |

**Tipi di messaggio** (`DMT_` -- DialogMessageType):

| Costante | Icona |
|----------|------|
| `DMT_NONE` | Nessuna icona |
| `DMT_INFO` | Info |
| `DMT_WARNING` | Avviso |
| `DMT_QUESTION` | Punto interrogativo |
| `DMT_EXCLAMATION` | Punto esclamativo |

### Quando Usare ShowDialog

Usa `ShowDialog()` per semplici avvisi e conferme che non necessitano di stile personalizzato. È affidabile e gestisce focus/cursore automaticamente. Per dialoghi personalizzati o complessi (layout personalizzato, campi di input, opzioni multiple), costruisci la tua classe dialogo.

---

## Pattern di Dialogo Manuale (Senza UIScriptedMenu)

Quando hai bisogno di un dialogo che non fa parte dello stack dei menu del motore -- ad esempio, un popup dentro un pannello esistente -- estendi `ScriptedWidgetEventHandler` invece di `UIScriptedMenu`. Questo ti dà pieno controllo ma richiede gestione manuale del focus e del ciclo di vita.

### Pattern di Base

```c
class SimplePopup : ScriptedWidgetEventHandler
{
    protected Widget       m_Root;
    protected ButtonWidget m_BtnOk;
    protected ButtonWidget m_BtnCancel;
    protected TextWidget   m_Message;

    void Show(string message)
    {
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/simple_popup.layout");
        m_Root.SetHandler(this);

        m_BtnOk     = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnOk"));
        m_BtnCancel = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnCancel"));
        m_Message   = TextWidget.Cast(m_Root.FindAnyWidget("Message"));

        m_Message.SetText(message);

        // Blocca l'input di gioco così il giocatore non può muoversi/sparare
        GetGame().GetInput().ChangeGameFocus(1);
        GetGame().GetUIManager().ShowUICursor(true);
    }

    void Hide()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }

        // Ripristina l'input di gioco -- DEVE corrispondere al +1 da Show()
        GetGame().GetInput().ChangeGameFocus(-1);
        GetGame().GetUIManager().ShowUICursor(false);
    }

    void ~SimplePopup()
    {
        Hide();
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_BtnOk)
        {
            OnConfirm();
            Hide();
            return true;
        }

        if (w == m_BtnCancel)
        {
            Hide();
            return true;
        }

        return false;
    }

    protected void OnConfirm()
    {
        // Fai override nelle sottoclassi o imposta un callback
    }
}
```

### Popup Stile VPP (Pattern OnWidgetScriptInit)

VPP Admin Tools e altri mod usano `OnWidgetScriptInit()` per inizializzare i popup. Il widget viene creato da un padre, e la classe script viene collegata tramite `scriptclass` nel file layout:

```c
class MyPopup : ScriptedWidgetEventHandler
{
    protected Widget       m_Root;
    protected ButtonWidget m_BtnClose;
    protected ButtonWidget m_BtnSave;
    protected EditBoxWidget m_NameInput;

    void OnWidgetScriptInit(Widget w)
    {
        m_Root = w;
        m_Root.SetHandler(this);

        m_BtnClose  = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnClose"));
        m_BtnSave   = ButtonWidget.Cast(m_Root.FindAnyWidget("BtnSave"));
        m_NameInput = EditBoxWidget.Cast(m_Root.FindAnyWidget("NameInput"));

        // Porta il dialogo sopra gli altri widget
        m_Root.SetSort(1024, true);
    }

    void ~MyPopup()
    {
        if (m_Root)
            m_Root.Unlink();
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_BtnClose)
        {
            delete this;
            return true;
        }

        if (w == m_BtnSave)
        {
            string name = m_NameInput.GetText();
            if (name != "")
            {
                SaveName(name);
                delete this;
            }
            return true;
        }

        return false;
    }

    protected void SaveName(string name)
    {
        // Elabora l'input
    }
}
```

Il padre crea il popup creando il widget layout come figlio:

```c
Widget popup = GetGame().GetWorkspace().CreateWidgets(
    "MyMod/GUI/layouts/popup.layout", parentWidget);
```

Il motore chiama automaticamente `OnWidgetScriptInit()` sulla classe script specificata nell'attributo `scriptclass` del layout.

---

## Struttura del Layout dei Dialoghi

Un layout di dialogo ha tipicamente tre strati: un root a schermo intero per l'intercettazione dei click, un overlay semi-trasparente per l'oscuramento e il pannello del dialogo centrato.

### Esempio di File Layout

```
FrameWidget "DialogRoot" {
    size 1 1 0 0        // Schermo intero
    halign fill
    valign fill

    // Overlay sfondo semi-trasparente
    ImageWidget "Overlay" {
        size 1 1 0 0
        halign fill
        valign fill
        color "0 0 0 180"
    }

    // Pannello dialogo centrato
    FrameWidget "DialogPanel" {
        halign center
        valign center
        hexactsize 1
        vexactsize 1
        hexactpos  1
        vexactpos  1
        size 0 0 500 300   // Dialogo 500x300 pixel

        // Barra del titolo
        TextWidget "TitleText" {
            halign fill
            size 1 0 0 30
            text "Dialog Title"
            font "gui/fonts/MetronBook24"
        }

        // Area del contenuto
        MultilineTextWidget "ContentText" {
            position 0 0 0 35
            size 1 0 0 200
            halign fill
        }

        // Riga dei pulsanti in basso
        FrameWidget "ButtonRow" {
            valign bottom
            halign fill
            size 1 0 0 40

            ButtonWidget "BtnConfirm" {
                halign left
                size 0 0 120 35
                text "Confirm"
            }

            ButtonWidget "BtnCancel" {
                halign right
                size 0 0 120 35
                text "Cancel"
            }
        }
    }
}
```

### Principi Chiave del Layout

1. **Root a schermo intero** -- Il widget più esterno copre l'intero schermo così i click fuori dal dialogo vengono intercettati.
2. **Overlay semi-trasparente** -- Un `ImageWidget` o pannello con alpha (es. `color "0 0 0 180"`) oscura lo sfondo, indicando visivamente uno stato modale.
3. **Pannello centrato** -- Usa `halign center` e `valign center` con dimensioni in pixel esatte per dimensioni prevedibili.
4. **Allineamento dei pulsanti** -- Posiziona i pulsanti in un contenitore orizzontale nella parte inferiore del pannello del dialogo.

---

## Pattern del Dialogo di Conferma

Un dialogo di conferma riutilizzabile accetta un titolo, un messaggio e un callback. Questo è il pattern di dialogo più comune nei mod di DayZ.

### Implementazione

```c
class ConfirmDialog : ScriptedWidgetEventHandler
{
    protected Widget          m_Root;
    protected TextWidget      m_TitleText;
    protected MultilineTextWidget m_ContentText;
    protected ButtonWidget    m_BtnYes;
    protected ButtonWidget    m_BtnNo;

    protected Class           m_CallbackTarget;
    protected string          m_CallbackFunc;

    void ConfirmDialog(string title, string message,
                       Class callbackTarget, string callbackFunc)
    {
        m_CallbackTarget = callbackTarget;
        m_CallbackFunc   = callbackFunc;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/confirm_dialog.layout");
        m_Root.SetHandler(this);

        m_TitleText   = TextWidget.Cast(
            m_Root.FindAnyWidget("TitleText"));
        m_ContentText = MultilineTextWidget.Cast(
            m_Root.FindAnyWidget("ContentText"));
        m_BtnYes      = ButtonWidget.Cast(
            m_Root.FindAnyWidget("BtnYes"));
        m_BtnNo       = ButtonWidget.Cast(
            m_Root.FindAnyWidget("BtnNo"));

        m_TitleText.SetText(title);
        m_ContentText.SetText(message);

        // Assicura che il dialogo venga renderizzato sopra le altre UI
        m_Root.SetSort(1024, true);

        GetGame().GetInput().ChangeGameFocus(1);
        GetGame().GetUIManager().ShowUICursor(true);
    }

    void ~ConfirmDialog()
    {
        if (m_Root)
            m_Root.Unlink();
    }

    protected void SendResult(bool confirmed)
    {
        GetGame().GetInput().ChangeGameFocus(-1);
        GetGame().GetUIManager().ShowUICursor(false);

        // Chiama la funzione callback sull'oggetto target
        GetGame().GameScript.CallFunction(
            m_CallbackTarget, m_CallbackFunc, null, confirmed);

        // Pulisci -- differisci l'eliminazione per evitare problemi
        GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(
            DestroyDialog, 0, false);
    }

    protected void DestroyDialog()
    {
        delete this;
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_BtnYes)
        {
            SendResult(true);
            return true;
        }

        if (w == m_BtnNo)
        {
            SendResult(false);
            return true;
        }

        return false;
    }
}
```

### Utilizzo

```c
// Nella classe chiamante:
void AskDeleteItem()
{
    new ConfirmDialog(
        "Delete Item",
        "Are you sure you want to delete this item?",
        this,
        "OnDeleteConfirmed"
    );
}

void OnDeleteConfirmed(bool confirmed)
{
    if (confirmed)
    {
        DeleteSelectedItem();
    }
}
```

Il callback usa `GameScript.CallFunction()` che invoca una funzione per nome sull'oggetto target. Questo è il modo standard in cui i mod DayZ implementano i callback dei dialoghi poiché Enforce Script non supporta closure o delegate.

---

## Pattern del Dialogo di Input

Un dialogo di input aggiunge un `EditBoxWidget` per l'inserimento di testo con validazione.

```c
class InputDialog : ScriptedWidgetEventHandler
{
    protected Widget         m_Root;
    protected TextWidget     m_TitleText;
    protected EditBoxWidget  m_InputBox;
    protected ButtonWidget   m_BtnOk;
    protected ButtonWidget   m_BtnCancel;
    protected TextWidget     m_ErrorText;

    protected Class          m_CallbackTarget;
    protected string         m_CallbackFunc;

    void InputDialog(string title, string defaultText,
                     Class callbackTarget, string callbackFunc)
    {
        m_CallbackTarget = callbackTarget;
        m_CallbackFunc   = callbackFunc;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/input_dialog.layout");
        m_Root.SetHandler(this);

        m_TitleText = TextWidget.Cast(
            m_Root.FindAnyWidget("TitleText"));
        m_InputBox  = EditBoxWidget.Cast(
            m_Root.FindAnyWidget("InputBox"));
        m_BtnOk     = ButtonWidget.Cast(
            m_Root.FindAnyWidget("BtnOk"));
        m_BtnCancel = ButtonWidget.Cast(
            m_Root.FindAnyWidget("BtnCancel"));
        m_ErrorText = TextWidget.Cast(
            m_Root.FindAnyWidget("ErrorText"));

        m_TitleText.SetText(title);
        m_InputBox.SetText(defaultText);
        m_ErrorText.Show(false);

        m_Root.SetSort(1024, true);
        GetGame().GetInput().ChangeGameFocus(1);
        GetGame().GetUIManager().ShowUICursor(true);
    }

    void ~InputDialog()
    {
        if (m_Root)
            m_Root.Unlink();
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        if (w == m_BtnOk)
        {
            string text = m_InputBox.GetText();
            text.Trim();

            if (text == "")
            {
                m_ErrorText.SetText("Name cannot be empty");
                m_ErrorText.Show(true);
                return true;
            }

            GetGame().GetInput().ChangeGameFocus(-1);
            GetGame().GetUIManager().ShowUICursor(false);

            // Invia il risultato come Param2: stato OK + testo
            GetGame().GameScript.CallFunctionParams(
                m_CallbackTarget, m_CallbackFunc, null,
                new Param2<bool, string>(true, text));

            GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(
                DeleteSelf, 0, false);
            return true;
        }

        if (w == m_BtnCancel)
        {
            GetGame().GetInput().ChangeGameFocus(-1);
            GetGame().GetUIManager().ShowUICursor(false);

            GetGame().GameScript.CallFunctionParams(
                m_CallbackTarget, m_CallbackFunc, null,
                new Param2<bool, string>(false, ""));

            GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(
                DeleteSelf, 0, false);
            return true;
        }

        return false;
    }

    override bool OnChange(Widget w, int x, int y, bool finished)
    {
        if (w == m_InputBox)
        {
            // Nascondi l'errore quando l'utente inizia a digitare
            m_ErrorText.Show(false);

            // Invia con il tasto Invio
            if (finished)
            {
                OnClick(m_BtnOk, 0, 0, 0);
            }
            return true;
        }

        return false;
    }

    protected void DeleteSelf()
    {
        delete this;
    }
}
```

---

## Gestione del Focus

La gestione del focus è l'aspetto più critico dell'implementazione dei dialoghi. DayZ usa un sistema di focus **a conteggio di riferimento** -- ogni `ChangeGameFocus(1)` deve essere bilanciato da un `ChangeGameFocus(-1)`.

### Come Funziona

```c
// Incrementa il contatore del focus -- l'input di gioco è soppresso mentre il contatore > 0
GetGame().GetInput().ChangeGameFocus(1);

// Mostra il cursore del mouse
GetGame().GetUIManager().ShowUICursor(true);

// ... interazione con il dialogo ...

// Decrementa il contatore del focus -- l'input di gioco riprende quando il contatore raggiunge 0
GetGame().GetInput().ChangeGameFocus(-1);

// Nascondi il cursore (solo se nessun altro menu ne ha bisogno)
GetGame().GetUIManager().ShowUICursor(false);
```

### Regole

1. **Ogni +1 deve avere un -1 corrispondente.** Se chiami `ChangeGameFocus(1)` in `Show()`, devi chiamare `ChangeGameFocus(-1)` in `Hide()`, senza eccezioni.

2. **Chiama -1 anche nei percorsi di errore.** Se il dialogo viene distrutto inaspettatamente (il giocatore muore, disconnessione del server), il distruttore deve comunque decrementare. Metti la pulizia nel distruttore come rete di sicurezza.

3. **UIScriptedMenu gestisce questo automaticamente.** Se estendi `UIScriptedMenu` e chiami `super.OnShow()` / `super.OnHide()`, il focus è gestito per te. Gestiscilo manualmente solo quando usi `ScriptedWidgetEventHandler`.

4. **Il focus per-dispositivo è opzionale.** Il motore supporta il blocco del focus per dispositivo (`INPUT_DEVICE_MOUSE`, `INPUT_DEVICE_KEYBOARD`, `INPUT_DEVICE_GAMEPAD`). Per la maggior parte dei dialoghi dei mod, un singolo `ChangeGameFocus(1)` (senza argomento dispositivo) blocca tutto l'input.

5. **ResetGameFocus() è l'opzione nucleare.** Forza il contatore a zero. Usalo solo nella pulizia di primo livello (es. quando chiudi un intero strumento admin), mai dentro le singole classi dialogo.

### Cosa Può Andare Storto

| Errore | Sintomo |
|---------|---------|
| Dimenticato `ChangeGameFocus(-1)` alla chiusura | Il giocatore non può muoversi, sparare o interagire dopo la chiusura del dialogo |
| Chiamato `-1` due volte | Il contatore del focus diventa negativo; il prossimo menu che si apre non bloccherà correttamente l'input |
| Dimenticato `ShowUICursor(false)` | Il cursore del mouse rimane visibile permanentemente |
| Chiamato `ShowUICursor(false)` quando il menu padre è ancora aperto | Il cursore scompare mentre il menu padre è ancora attivo |

---

## Z-Order e Stratificazione

Quando un dialogo si apre sopra una UI esistente, deve essere renderizzato sopra tutto il resto. DayZ fornisce due meccanismi:

### Ordine di Ordinamento dei Widget

```c
// Porta il widget sopra tutti i fratelli (valore di ordinamento 1024)
m_Root.SetSort(1024, true);
```

Il metodo `SetSort()` imposta la priorità di rendering. Valori più alti vengono renderizzati sopra. Il secondo parametro (`true`) si applica ricorsivamente ai figli. VPP Admin Tools usa `SetSort(1024, true)` per tutte le finestre di dialogo.

### Priorità del Layout (Statica)

Nei file layout, puoi impostare la priorità direttamente:

```
FrameWidget "DialogRoot" {
    // Valori più alti vengono renderizzati sopra
    // UI normale: 0-100
    // Overlay:   998
    // Dialogo:    999
}
```

### Buone Pratiche

- **Sfondo overlay**: Usa un valore di ordinamento alto (es. 998) per lo sfondo semi-trasparente.
- **Pannello dialogo**: Usa un valore di ordinamento più alto (es. 999 o 1024) per il dialogo stesso.
- **Dialoghi impilati**: Se il tuo sistema supporta dialoghi annidati, incrementa il valore di ordinamento per ogni nuovo strato di dialogo.

---

## Pattern Comuni

### Pannello Toggle (Apri/Chiudi con lo Stesso Tasto)

```c
class TogglePanel : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected bool   m_IsVisible;

    void Toggle()
    {
        if (m_IsVisible)
            Hide();
        else
            Show();
    }

    protected void Show()
    {
        if (!m_Root)
        {
            m_Root = GetGame().GetWorkspace().CreateWidgets(
                "MyMod/GUI/layouts/toggle_panel.layout");
            m_Root.SetHandler(this);
        }

        m_Root.Show(true);
        m_IsVisible = true;
        GetGame().GetInput().ChangeGameFocus(1);
        GetGame().GetUIManager().ShowUICursor(true);
    }

    protected void Hide()
    {
        if (m_Root)
            m_Root.Show(false);

        m_IsVisible = false;
        GetGame().GetInput().ChangeGameFocus(-1);
        GetGame().GetUIManager().ShowUICursor(false);
    }
}
```

### ESC per Chiudere

```c
// Dentro Update() di un UIScriptedMenu:
override void Update(float timeslice)
{
    super.Update(timeslice);

    if (GetUApi().GetInputByID(UAUIBack).LocalPress())
    {
        Close();
    }
}

// Dentro un ScriptedWidgetEventHandler (nessun loop Update):
// Devi fare polling da una sorgente di update esterna, o usare OnKeyDown:
override bool OnKeyDown(Widget w, int x, int y, int key)
{
    if (key == KeyCode.KC_ESCAPE)
    {
        Hide();
        return true;
    }
    return false;
}
```

### Click Esterno per Chiudere

Rendi il widget overlay a schermo intero cliccabile. Quando viene cliccato, chiudi il dialogo:

```c
class OverlayDialog : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Overlay;
    protected Widget m_Panel;

    void Show()
    {
        m_Root    = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/overlay_dialog.layout");
        m_Overlay = m_Root.FindAnyWidget("Overlay");
        m_Panel   = m_Root.FindAnyWidget("DialogPanel");

        // Registra l'handler sia sull'overlay che sui widget del pannello
        m_Root.SetHandler(this);
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        // Se l'utente ha cliccato l'overlay (non il pannello), chiudi
        if (w == m_Overlay)
        {
            Hide();
            return true;
        }

        return false;
    }
}
```

### Callback dei Risultati del Dialogo

Per dialoghi che devono restituire risultati complessi, usa `GameScript.CallFunctionParams()` con oggetti `Param`:

```c
// Invio di un risultato con valori multipli
GetGame().GameScript.CallFunctionParams(
    m_CallbackTarget,
    m_CallbackFunc,
    null,
    new Param2<int, string>(RESULT_OK, inputText)
);

// Ricezione nel chiamante
void OnDialogResult(int result, string text)
{
    if (result == RESULT_OK)
    {
        ProcessInput(text);
    }
}
```

Questo è lo stesso pattern che VPP Admin Tools usa per il suo sistema di callback `VPPDialogBox`.

---

## UIScriptedWindow -- Finestre Flottanti

DayZ ha un secondo sistema integrato: `UIScriptedWindow`, per finestre flottanti che esistono accanto a un `UIScriptedMenu`. A differenza di `UIScriptedMenu`, le finestre vengono tracciate in una mappa statica e i loro eventi vengono instradati attraverso il menu attivo.

```c
class MyWindow extends UIScriptedWindow
{
    void MyWindow(int id) : UIScriptedWindow(id)
    {
    }

    override Widget Init()
    {
        m_WgtRoot = GetGame().GetWorkspace().CreateWidgets(
            "MyMod/GUI/layouts/my_window.layout");
        return m_WgtRoot;
    }

    override bool OnClick(Widget w, int x, int y, int button)
    {
        // Gestisci i click
        return false;
    }
}
```

Le finestre vengono aperte e chiuse tramite `UIManager`:

```c
// Apri
GetGame().GetUIManager().OpenWindow(MY_WINDOW_ID);

// Chiudi
GetGame().GetUIManager().CloseWindow(MY_WINDOW_ID);

// Controlla se è aperta
GetGame().GetUIManager().IsWindowOpened(MY_WINDOW_ID);
```

In pratica, la maggior parte degli sviluppatori di mod usa popup basati su `ScriptedWidgetEventHandler` piuttosto che `UIScriptedWindow`, perché il sistema di finestre richiede la registrazione con lo switch-case del motore in `MissionBase` e gli eventi vengono instradati attraverso il `UIScriptedMenu` attivo. Il pattern manuale è più semplice e flessibile.

---

## Errori Comuni

### 1. Non Ripristinare il Focus di Gioco alla Chiusura

**Il problema:** Il giocatore non può muoversi, sparare o interagire dopo la chiusura del dialogo.

```c
// SBAGLIATO -- nessun ripristino del focus
void CloseDialog()
{
    m_Root.Unlink();
    m_Root = null;
    // Il contatore del focus è ancora incrementato!
}

// CORRETTO -- decrementa sempre
void CloseDialog()
{
    m_Root.Unlink();
    m_Root = null;
    GetGame().GetInput().ChangeGameFocus(-1);
    GetGame().GetUIManager().ShowUICursor(false);
}
```

### 2. Non Fare Unlink dei Widget alla Chiusura

**Il problema:** L'albero dei widget rimane in memoria, gli eventi continuano a essere lanciati, i memory leak si accumulano.

```c
// SBAGLIATO -- solo nascondere
void Hide()
{
    m_Root.Show(false);  // Il widget esiste ancora e consuma memoria
}

// CORRETTO -- unlink distrugge l'albero dei widget
void Hide()
{
    if (m_Root)
    {
        m_Root.Unlink();
        m_Root = null;
    }
}
```

Se hai bisogno di mostrare/nascondere lo stesso dialogo ripetutamente, mantenere il widget e usare `Show(true/false)` va bene -- assicurati solo di fare `Unlink()` nel distruttore.

### 3. Il Dialogo Viene Renderizzato Dietro Altre UI

**Il problema:** Il dialogo è invisibile o parzialmente nascosto perché altri widget hanno una priorità di rendering più alta.

**La soluzione:** Usa `SetSort()` per portare il dialogo sopra tutto:

```c
m_Root.SetSort(1024, true);
```

### 4. Dialoghi Multipli che Impilano Cambiamenti di Focus

**Il problema:** Aprendo il dialogo A (+1), poi il dialogo B (+1), poi chiudendo B (-1) -- il contatore del focus è ancora 1, quindi l'input è ancora bloccato anche se l'utente non vede alcun dialogo.

**La soluzione:** Traccia se ogni istanza del dialogo ha bloccato il focus, e decrementa solo se lo ha fatto:

```c
class SafeDialog : ScriptedWidgetEventHandler
{
    protected bool m_HasFocus;

    void LockFocus()
    {
        if (!m_HasFocus)
        {
            GetGame().GetInput().ChangeGameFocus(1);
            GetGame().GetUIManager().ShowUICursor(true);
            m_HasFocus = true;
        }
    }

    void UnlockFocus()
    {
        if (m_HasFocus)
        {
            GetGame().GetInput().ChangeGameFocus(-1);
            GetGame().GetUIManager().ShowUICursor(false);
            m_HasFocus = false;
        }
    }

    void ~SafeDialog()
    {
        UnlockFocus();
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = null;
        }
    }
}
```

### 5. Chiamare Close() o Delete nel Costruttore

**Il problema:** Chiamare `Close()` o `delete this` durante la costruzione causa crash o comportamento indefinito perché l'oggetto non è completamente inizializzato.

**La soluzione:** Differisci la chiusura usando `CallLater`:

```c
void MyDialog()
{
    // ...
    if (someErrorCondition)
    {
        // SBAGLIATO: Close(); o delete this;
        // CORRETTO:
        GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(
            DeferredClose, 0, false);
    }
}

void DeferredClose()
{
    Close();  // o: delete this;
}
```

### 6. Non Controllare Null Prima delle Operazioni sui Widget

**Il problema:** Crash quando si accede a un widget che è già stato distrutto o mai creato.

```c
// SBAGLIATO
void UpdateMessage(string text)
{
    m_MessageText.SetText(text);  // Crash se m_MessageText è null
}

// CORRETTO
void UpdateMessage(string text)
{
    if (m_MessageText)
        m_MessageText.SetText(text);
}
```

---

## Riepilogo

| Approccio | Classe Base | Gestione del Focus | Ideale Per |
|----------|-----------|-----------------|----------|
| Stack menu del motore | `UIScriptedMenu` | Automatica via `LockControls`/`UnlockControls` | Menu a schermo intero, dialoghi principali |
| Dialogo nativo | `ShowDialog()` | Automatica | Semplici prompt Sì/No/OK |
| Popup manuale | `ScriptedWidgetEventHandler` | Manuale `ChangeGameFocus` | Popup dentro pannelli, dialoghi personalizzati |
| Finestra flottante | `UIScriptedWindow` | Via menu padre | Finestre strumento accanto a un menu |

La regola d'oro: **ogni `ChangeGameFocus(1)` deve essere corrisposto da un `ChangeGameFocus(-1)`.** Metti la pulizia del focus nel tuo distruttore come rete di sicurezza, fai sempre `Unlink()` dei widget quando hai finito, e usa `SetSort()` per assicurarti che il tuo dialogo venga renderizzato sopra.

---

## Prossimi Passi

- [3.6 Gestione degli Eventi](06-event-handling.md) -- Gestisci click, hover, eventi tastiera dentro i dialoghi
- [3.5 Creazione Programmatica dei Widget](05-programmatic-widgets.md) -- Costruisci il contenuto del dialogo dinamicamente nel codice
