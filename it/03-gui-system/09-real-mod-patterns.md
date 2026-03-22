# Capitolo 3.9: Pattern UI dei Mod Reali

[Home](../README.md) | [<< Precedente: Dialoghi e Modali](08-dialogs-modals.md) | **Pattern UI dei Mod Reali** | [Successivo: Widget Avanzati >>](10-advanced-widgets.md)

---

Questo capitolo analizza i pattern UI trovati in sei mod professionali di DayZ: COT (Community Online Tools), VPP Admin Tools, DabsFramework, Colorful UI, Expansion e DayZ Editor. Ogni mod risolve problemi diversi. Studiare i loro approcci ti dà una libreria di pattern collaudati oltre ciò che la documentazione ufficiale copre.

Tutto il codice mostrato è estratto dal codice sorgente reale dei mod. I percorsi dei file fanno riferimento ai repository originali.

---

## Perché Studiare i Mod Reali?

La documentazione di DayZ spiega i widget individuali e i callback degli eventi ma non dice nulla su:

- Come gestire 12 pannelli admin senza duplicazione del codice
- Come costruire un sistema di dialoghi con routing dei callback
- Come applicare un tema a un'intera UI senza toccare i file layout vanilla
- Come sincronizzare una griglia di mercato con i dati del server via RPC
- Come strutturare un editor con undo/redo e un sistema di comandi

Questi sono problemi di architettura. Ogni mod grande inventa soluzioni per essi. Alcuni sono eleganti, altri sono storie ammonitorie. Questo capitolo mappa i pattern così puoi scegliere l'approccio giusto per il tuo progetto.

---

## Pattern UI di COT (Community Online Tools)

COT è lo strumento admin DayZ più usato. La sua architettura UI è costruita attorno a un sistema modulo-form-finestra dove ogni strumento (ESP, Player Manager, Teleport, Object Spawner, ecc.) è un modulo autocontenuto con il proprio pannello.

### Architettura Modulo-Form-Finestra

COT separa le responsabilità in tre strati:

1. **JMRenderableModuleBase** -- Dichiara i metadati del modulo (titolo, icona, percorso layout, permessi). Gestisce il ciclo di vita della CF_Window. Non contiene logica UI.
2. **JMFormBase** -- Il pannello UI effettivo. Estende `ScriptedWidgetEventHandler`. Riceve eventi widget, costruisce elementi UI, comunica con il modulo per le operazioni sui dati.
3. **CF_Window** -- Il contenitore della finestra fornito dal framework CF. Gestisce trascinamento, ridimensionamento, chrome di chiusura.

Un modulo si dichiara con degli override:

```c
class JMExampleModule: JMRenderableModuleBase
{
    void JMExampleModule()
    {
        GetPermissionsManager().RegisterPermission("Admin.Example.View");
        GetPermissionsManager().RegisterPermission("Admin.Example.Button");
    }

    override bool HasAccess()
    {
        return GetPermissionsManager().HasPermission("Admin.Example.View");
    }

    override string GetLayoutRoot()
    {
        return "JM/COT/GUI/layouts/Example_form.layout";
    }

    override string GetTitle()
    {
        return "Example Module";
    }

    override string GetIconName()
    {
        return "E";
    }

    override bool ImageIsIcon()
    {
        return false;
    }
}
```

**Punto chiave:** Ogni strumento è completamente autocontenuto. Aggiungere un nuovo strumento admin significa creare una classe Module, una classe Form, un file layout e inserire una riga nel costruttore. Nessun codice esistente cambia.

### UI Programmatica con UIActionManager

COT non costruisce form complesse nei file layout. Usa una classe factory (`UIActionManager`) che crea widget di azione UI standardizzati a runtime:

```c
override void OnInit()
{
    m_Scroller = UIActionManager.CreateScroller(layoutRoot.FindAnyWidget("panel"));
    Widget actions = m_Scroller.GetContentWidget();

    // Layout a griglia: 8 righe, 1 colonna
    m_PanelAlpha = UIActionManager.CreateGridSpacer(actions, 8, 1);

    // Tipi di widget standard
    m_Text = UIActionManager.CreateText(m_PanelAlpha, "Label", "Value");
    m_EditableText = UIActionManager.CreateEditableText(
        m_PanelAlpha, "Name:", this, "OnChange_EditableText"
    );
    m_Slider = UIActionManager.CreateSlider(
        m_PanelAlpha, "Speed:", 0, 100, this, "OnChange_Slider"
    );
    m_Checkbox = UIActionManager.CreateCheckbox(
        m_PanelAlpha, "Enable Feature", this, "OnClick_Checkbox"
    );
    m_Button = UIActionManager.CreateButton(
        m_PanelAlpha, "Execute", this, "OnClick_Button"
    );
}
```

L'approccio factory significa: dimensionamento e spaziatura coerenti in tutti i pannelli, nessuna duplicazione dei file layout, nuovi tipi di azione possono essere aggiunti una volta e usati ovunque.

### Overlay ESP (Disegno su CanvasWidget)

Il sistema ESP di COT disegna etichette, barre di salute e linee direttamente sul mondo 3D usando `CanvasWidget`. I widget ESP vengono creati da layout prefab e posizionati ogni frame proiettando posizioni 3D in coordinate schermo.

### Dialoghi di Conferma

COT fornisce un sistema di conferma basato su callback integrato in `JMFormBase`. Le conferme sono create con callback nominati:

```c
CreateConfirmation_Two(
    JMConfirmationType.INFO,
    "Are you sure?",
    "This will kick the player.",
    "#STR_COT_GENERIC_YES", "OnConfirmKick",
    "#STR_COT_GENERIC_NO", ""
);
```

Questo permette il concatenamento delle conferme (una conferma ne apre un'altra) senza codificare rigidamente il flusso.

---

## Pattern UI di VPP Admin Tools

VPP adotta un approccio diverso da COT: usa `UIScriptedMenu` con un HUD a barra degli strumenti, sotto-finestre trascinabili e un sistema di dialog box globale.

### Registrazione dei Pulsanti della Toolbar

`VPPAdminHud` mantiene una lista di definizioni di pulsanti. Ogni pulsante mappa una stringa di permesso a un nome visualizzato, un'icona e un tooltip. I mod esterni possono fare override di `DefineButtons()` per aggiungere i propri pulsanti alla toolbar, rendendo VPP estensibile senza modificare il suo sorgente.

### Sistema di Sotto-Finestre

Ogni pannello strumento estende `AdminHudSubMenu`, che fornisce comportamento di finestra trascinabile, toggle mostra/nascondi e gestione della priorità della finestra:

```c
class AdminHudSubMenu: ScriptedWidgetEventHandler
{
    protected Widget M_SUB_WIDGET;
    protected Widget m_TitlePanel;

    void ShowSubMenu()
    {
        m_IsVisible = true;
        M_SUB_WIDGET.Show(true);
        VPPAdminHud rootHud = VPPAdminHud.Cast(
            GetVPPUIManager().GetMenuByType(VPPAdminHud)
        );
        rootHud.SetWindowPriorty(this);
        OnMenuShow();
    }

    // Supporto trascinamento via barra del titolo
    override bool OnDrag(Widget w, int x, int y)
    {
        if (w == m_TitlePanel)
        {
            M_SUB_WIDGET.GetPos(m_posX, m_posY);
            m_posX = x - m_posX;
            m_posY = y - m_posY;
            return false;
        }
        return true;
    }
}
```

**Punto chiave:** VPP costruisce un mini window manager dentro DayZ. Ogni sotto-menu è una finestra trascinabile, ridimensionabile con gestione del focus.

### VPPDialogBox -- Dialogo Basato su Callback

Il sistema di dialoghi di VPP usa un approccio guidato da enum. Il dialogo mostra/nasconde pulsanti basandosi su un tipo enum, e instrada il risultato attraverso `CallFunction`:

```c
enum DIAGTYPE
{
    DIAG_YESNO,
    DIAG_YESNOCANCEL,
    DIAG_OK,
    DIAG_OK_CANCEL_INPUT
}

class VPPDialogBox extends ScriptedWidgetEventHandler
{
    private Class   m_CallBackClass;
    private string  m_CbFunc = "OnDiagResult";

    private void OnOutCome(int result)
    {
        GetGame().GameScript.CallFunction(m_CallBackClass, m_CbFunc, null, result);
        delete this;
    }
}
```

---

## Pattern UI di DabsFramework

DabsFramework introduce un'architettura MVC (Model-View-Controller) completa per la UI di DayZ. È usato da DayZ Editor e Expansion come fondamento UI.

### ViewController e Data Binding

L'idea centrale: invece di trovare manualmente i widget e impostare il loro testo, dichiari proprietà su una classe controller e le leghi ai widget per nome nell'editor di layout.

```c
class TestController: ViewController
{
    // Il nome della variabile corrisponde a Binding_Name nel layout
    string TextBox1 = "Initial Text";
    int TextBox2;
    bool WindowButton1;

    void SetWindowButton1(bool state)
    {
        WindowButton1 = state;
        NotifyPropertyChanged("WindowButton1");
    }

    override void PropertyChanged(string propertyName)
    {
        switch (propertyName)
        {
            case "WindowButton1":
                Print("Button state: " + WindowButton1);
                break;
        }
    }
}
```

Il **binding bidirezionale** significa che i cambiamenti nel widget (l'utente che digita) si propagano automaticamente alla proprietà del controller.

### ObservableCollection -- Data Binding per Liste

Per liste dinamiche, DabsFramework fornisce `ObservableCollection<T>`. Le operazioni di inserimento/rimozione aggiornano automaticamente il widget legato:

```c
class MyController: ViewController
{
    ref ObservableCollection<string> ItemList;

    void MyController()
    {
        ItemList = new ObservableCollection<string>(this);
        ItemList.Insert("Item A");
        ItemList.Insert("Item B");
    }
}
```

Ogni `Insert()` lancia un evento `CollectionChanged`, che il ViewBinding intercetta per creare/distruggere widget figli. Nessuna gestione manuale dei widget necessaria.

### ScriptView -- Layout da Codice

`ScriptView` è l'alternativa tutto-script a `OnWidgetScriptInit`. La sottoclassi, fai override di `GetLayoutFile()` e la istanzi. Il costruttore carica il layout, trova il controller e collega tutto.

### RelayCommand -- Binding Pulsante-Azione

I pulsanti possono essere legati a oggetti `RelayCommand` tramite la proprietà reference `Relay_Command` nel ViewBinding. Questo disaccoppia i click dei pulsanti dagli handler.

**Punto chiave:** DabsFramework elimina il boilerplate. Dichiari i dati, li leghi per nome, e il framework gestisce la sincronizzazione. Il costo è la curva di apprendimento e la dipendenza dal framework.

---

## Pattern di Colorful UI

Colorful UI sostituisce i menu vanilla di DayZ con versioni tematizzate senza modificare i file script vanilla. Il suo approccio si basa interamente su override `modded class` e un sistema centralizzato di colori/branding.

### Sistema a Tema a 3 Strati

I colori sono organizzati in tre livelli:

**Strato 1 -- UIColor (palette base):** Valori colore grezzi con nomi semantici.

**Strato 2 -- colorScheme (mappatura semantica):** Mappa concetti UI ai colori della palette. Gli owner del server cambiano questo strato per tematizzare il proprio server.

**Strato 3 -- Branding/Settings (identità server):** Percorsi logo, URL, toggle funzionalità.

### Modifica Non Distruttiva della UI Vanilla

Colorful UI sostituisce i menu vanilla usando `modded class`. Ogni sottoclasse `UIScriptedMenu` vanilla viene moddata per caricare un file layout personalizzato e applicare i colori del tema:

```c
modded class MainMenu extends UIScriptedMenu
{
    override Widget Init()
    {
        layoutRoot = GetGame().GetWorkspace().CreateWidgets(
            "Colorful-UI/GUI/layouts/menus/cui.mainMenu.layout"
        );

        // Applica i colori del tema
        if (m_TopShader) m_TopShader.SetColor(colorScheme.TopShader());
        if (m_BottomShader) m_BottomShader.SetColor(colorScheme.BottomShader());

        Branding.ApplyLogo(m_Logo);
        return layoutRoot;
    }
}
```

**Punto chiave:** Colorful UI dimostra che puoi ritematizzare l'intero client DayZ senza codice lato server, usando solo override `modded class`, file layout personalizzati e un sistema di colori centralizzato.

---

## Pattern UI di Expansion

DayZ Expansion è il più grande ecosistema di mod della comunità. La sua UI spazia da toast di notifica a interfacce complete di trading con sincronizzazione server.

### Sistema di Notifiche (Tipi Multipli)

Expansion definisce sei tipi visivi di notifica, ciascuno con il proprio layout. Le notifiche vengono create da qualsiasi punto (client o server) usando un'API statica:

```c
NotificationSystem.Create_Expansion(
    "Trade Complete",          // titolo
    "You purchased M4A1",     // testo
    "market_icon",             // nome icona
    ARGB(255, 50, 200, 50),   // colore
    7,                         // tempo di visualizzazione (secondi)
    sendTo,                    // PlayerIdentity (null = tutti)
    ExpansionNotificationType.MARKET  // tipo
);
```

### Menu del Mercato (Pannello Interattivo Complesso)

L'`ExpansionMarketMenu` è una delle UI più complesse in qualsiasi mod di DayZ. Gestisce: albero delle categorie con sezioni comprimibili, griglia oggetti con filtro di ricerca, visualizzazione prezzi acquisto/vendita, controlli quantità, widget anteprima oggetto, anteprima inventario giocatore, selettori dropdown per skin, checkbox configurazione accessori e dialoghi di conferma per acquisti/vendite.

**Punto chiave:** Per UI interattive complesse, Expansion combina l'MVC di DabsFramework con riferimenti diretti ai widget. Il controller gestisce il data binding per liste e testo, mentre i riferimenti diretti ai widget gestiscono widget specializzati come `ItemPreviewWidget` e `PlayerPreviewWidget` che necessitano di controllo imperativo.

---

## Pattern UI di DayZ Editor

DayZ Editor è uno strumento completo di posizionamento oggetti costruito come mod di DayZ. Usa DabsFramework estensivamente e implementa pattern tipicamente trovati in applicazioni desktop: toolbar, menu, property inspector, sistema di comandi con undo/redo.

### Pattern dei Comandi con Scorciatoie da Tastiera

Il sistema di comandi dell'Editor disaccoppia le azioni dagli elementi UI. Ogni azione è una sottoclasse `EditorCommand`:

```c
class EditorUndoCommand: EditorCommand
{
    protected override bool Execute(Class sender, CommandArgs args)
    {
        super.Execute(sender, args);
        m_Editor.Undo();
        return true;
    }

    override ShortcutKeys GetShortcut()
    {
        return { KeyCode.KC_LCONTROL, KeyCode.KC_Z };
    }

    override bool CanExecute()
    {
        return GetEditor().CanUndo();
    }
}
```

I comandi si integrano con il `RelayCommand` di DabsFramework così i pulsanti della toolbar si disattivano automaticamente quando `CanExecute()` restituisce false.

### HUD con Pannelli Data-Bound

Il controller HUD dell'editor usa `ObservableCollection` per tutti i pannelli lista. Aggiungere un oggetto alla scena lo aggiunge automaticamente alla lista nella sidebar. Cancellare lo rimuove. Nessuna creazione/distruzione manuale dei widget.

---

## Pattern Architetturali UI Comuni

Questi pattern appaiono in più mod. Rappresentano il consenso della comunità su come risolvere problemi UI ricorrenti in DayZ.

### Panel Manager (Mostra/Nascondi per Nome o Tipo)

Sia VPP che COT mantengono un registro di pannelli UI accessibili per typename. Questo previene pannelli duplicati e fornisce un singolo punto di controllo per la visibilità.

### Riciclo dei Widget per le Liste

Quando si visualizzano liste grandi, i mod evitano di creare/distruggere widget ad ogni aggiornamento. Mantengono invece un pool:

```c
// Pattern semplificato usato tra i mod
void UpdatePlayerList(array<PlayerInfo> players)
{
    // Nascondi i widget in eccesso
    for (int i = players.Count(); i < m_PlayerWidgets.Count(); i++)
        m_PlayerWidgets[i].Show(false);

    // Crea nuovi widget solo se necessario
    while (m_PlayerWidgets.Count() < players.Count())
    {
        Widget w = GetGame().GetWorkspace().CreateWidgets(PLAYER_ENTRY_LAYOUT, m_ListParent);
        m_PlayerWidgets.Insert(w);
    }

    // Aggiorna i widget visibili con i dati
    for (int j = 0; j < players.Count(); j++)
    {
        m_PlayerWidgets[j].Show(true);
        SetPlayerData(m_PlayerWidgets[j], players[j]);
    }
}
```

### Creazione Widget Lazy

Diversi mod differiscono la creazione dei widget fino alla prima visualizzazione. Questo evita di caricare tutti i pannelli admin all'avvio quando la maggior parte non verrà mai aperta.

### OnWidgetScriptInit come Punto di Ingresso Universale

Ogni mod studiato usa `OnWidgetScriptInit` come meccanismo di binding layout-script:

```c
void OnWidgetScriptInit(Widget w)
{
    m_root = w;
    m_root.SetHandler(this);

    // Trova widget figli
    m_Button = ButtonWidget.Cast(m_root.FindAnyWidget("button_name"));
    m_Text = TextWidget.Cast(m_root.FindAnyWidget("text_name"));
}
```

Questo viene impostato tramite la proprietà `scriptclass` nel file layout. Il motore chiama `OnWidgetScriptInit` automaticamente quando `CreateWidgets()` elabora un widget con una script class.

---

## Anti-Pattern da Evitare

Questi errori appaiono nel codice reale dei mod e causano problemi di prestazioni o crash.

### Creare Widget Ogni Frame

La creazione di widget alloca memoria e attiva il ricalcolo del layout. A 60 FPS questo crea 60 widget al secondo. Crea sempre una volta e aggiorna sul posto.

### Non Pulire gli Event Handler

Ogni `Insert` su uno `ScriptInvoker` o coda di aggiornamento necessita di un `Remove` corrispondente nel distruttore. Gli handler orfani causano chiamate a oggetti eliminati e crash per accesso null.

### Codificare Posizioni in Pixel

Usa sempre posizionamento proporzionale (0.0-1.0) o lascia che i widget contenitore gestiscano il layout. Le posizioni in pixel funzionano solo alla risoluzione per cui sono state progettate.

### Annidamento Profondo dei Widget Senza Motivo

Ogni livello di annidamento aggiunge overhead al calcolo del layout. Se un widget intermedio non serve a nulla (nessuno sfondo, nessun vincolo di dimensione, nessuna gestione eventi), rimuovilo. Appiattisci le gerarchie dove possibile.

### Ignorare la Gestione del Focus

Senza `SetFocus()`, gli eventi tastiera possono ancora andare ai widget dietro il dialogo.

### Dimenticare la Pulizia dei Widget alla Distruzione

Se crei widget con `CreateWidgets()`, li possiedi. Chiama `Unlink()` sulla root nel tuo distruttore. `ScriptView` e `UIScriptedMenu` gestiscono questo automaticamente, ma le sottoclassi di `ScriptedWidgetEventHandler` devono farlo manualmente.

---

## Riepilogo: Quale Pattern Usare e Quando

| Necessità | Pattern Consigliato | Mod Sorgente |
|------|-------------------|------------|
| Pannello strumento semplice | `ScriptedWidgetEventHandler` + `OnWidgetScriptInit` | VPP |
| UI complessa data-bound | `ScriptView` + `ViewController` + `ObservableCollection` | DabsFramework |
| Sistema pannelli admin | Module + Form + Window (pattern registrazione moduli) | COT |
| Sotto-finestre trascinabili | `AdminHudSubMenu` (gestione trascinamento barra titolo) | VPP |
| Dialogo di conferma | `VPPDialogBox` o `JMConfirmation` (basato su callback) | VPP / COT |
| Popup con input | Pattern `PopUpCreatePreset` (`delete this` alla chiusura) | VPP |
| Menu a schermo intero | `ExpansionScriptViewMenu` (blocco controlli, blur, timer) | Expansion |
| Sistema tema/colori | 3 strati (palette, schema, branding) con `modded class` | Colorful UI |
| Override UI vanilla | `modded class` + file `.layout` sostitutivi | Colorful UI |
| Sistema di notifiche | Enum tipo + layout per-tipo + API di creazione statica | Expansion |
| Sistema comandi toolbar | `EditorCommand` + `EditorCommandManager` + scorciatoie | DayZ Editor |
| Barra menu con elementi | `EditorMenu` + `ObservableCollection<EditorMenuItem>` | DayZ Editor |
| Overlay ESP/HUD | `CanvasWidget` a schermo intero + posizionamento widget proiettato | COT |
| Varianti per risoluzione | Directory layout separate (stretto/medio/largo) | Colorful UI |
| Prestazioni liste grandi | Pool di riciclo widget (nascondi/mostra, crea su richiesta) | Comune |
| Configurazione | Variabili statiche (mod client) o JSON via config manager | Colorful UI |

### Diagramma Decisionale

1. **È un pannello semplice una tantum?** Usa `ScriptedWidgetEventHandler` con `OnWidgetScriptInit`. Costruisci il layout nell'editor, trova i widget per nome.

2. **Ha liste dinamiche o dati che cambiano frequentemente?** Usa il `ViewController` di DabsFramework con `ObservableCollection`. Il data binding elimina gli aggiornamenti manuali dei widget.

3. **Fa parte di uno strumento admin multi-pannello?** Usa il pattern modulo-form di COT. Ogni strumento è autocontenuto con il proprio modulo, form e layout. La registrazione è una singola riga.

4. **Deve sostituire la UI vanilla?** Usa il pattern di Colorful UI: `modded class`, file layout personalizzato, schema colori centralizzato.

5. **Ha bisogno di sincronizzazione dati server-client?** Combina qualsiasi pattern sopra con RPC. Il menu mercato di Expansion mostra come gestire stati di caricamento, cicli richiesta/risposta e timer di aggiornamento all'interno di una ScriptView.

6. **Ha bisogno di undo/redo o interazione complessa?** Usa il pattern dei comandi di DayZ Editor. I comandi disaccoppiano le azioni dai pulsanti, supportano scorciatoie e si integrano con il `RelayCommand` di DabsFramework per abilitazione/disabilitazione automatica.

---

*Prossimo capitolo: [Widget Avanzati](10-advanced-widgets.md) -- Formattazione RichTextWidget, disegno CanvasWidget, marker MapWidget, ItemPreviewWidget, PlayerPreviewWidget, VideoWidget e RenderTargetWidget.*
