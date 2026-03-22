# Capitolo 5.2: inputs.xml --- Associazioni di Tasti Personalizzate

[Home](../README.md) | [<< Precedente: stringtable.csv](01-stringtable.md) | **inputs.xml** | [Successivo: Credits.json >>](03-credits-json.md)

---

> **Sommario:** Il file `inputs.xml` consente alla tua mod di registrare associazioni di tasti personalizzate che appaiono nel menù Impostazioni > Controlli del giocatore. I giocatori possono visualizzare, riassegnare e attivare/disattivare questi input proprio come le azioni vanilla. Questo è il meccanismo standard per aggiungere tasti rapidi alle mod DayZ.

---

## Indice

- [Panoramica](#panoramica)
- [Posizione del File](#posizione-del-file)
- [Struttura XML Completa](#struttura-xml-completa)
- [Blocco Actions](#blocco-actions)
- [Blocco Sorting](#blocco-sorting)
- [Blocco Preset (Tasti Predefiniti)](#blocco-preset-tasti-predefiniti)
- [Combinazioni con Modificatori](#combinazioni-con-modificatori)
- [Input Nascosti](#input-nascosti)
- [Tasti Predefiniti Multipli](#tasti-predefiniti-multipli)
- [Accedere agli Input negli Script](#accedere-agli-input-negli-script)
- [Riferimento dei Metodi di Input](#riferimento-dei-metodi-di-input)
- [Sopprimere e Disabilitare gli Input](#sopprimere-e-disabilitare-gli-input)
- [Riferimento dei Nomi dei Tasti](#riferimento-dei-nomi-dei-tasti)
- [Esempi Reali](#esempi-reali)
- [Errori Comuni](#errori-comuni)

---

## Panoramica

Quando la tua mod ha bisogno che il giocatore prema un tasto --- aprire un menù, attivare una funzionalità, comandare un'unità IA --- registri un'azione di input personalizzata in `inputs.xml`. Il motore legge questo file all'avvio e integra le tue azioni nel sistema di input universale. I giocatori vedono le tue associazioni di tasti nel menù Impostazioni > Controlli del gioco, raggruppate sotto un'intestazione che definisci tu.

Gli input personalizzati sono identificati da un nome di azione unico (convenzionalmente con prefisso `UA` per "User Action") e possono avere associazioni di tasti predefinite che i giocatori possono riassegnare a piacimento.

---

## Posizione del File

Posiziona `inputs.xml` dentro una sottocartella `data` della tua directory Scripts:

```
@MyMod/
  Addons/
    MyMod_Scripts.pbo
      Scripts/
        data/
          inputs.xml        <-- Qui
        3_Game/
        4_World/
        5_Mission/
```

Alcune mod lo posizionano direttamente nella cartella `Scripts/`. Entrambe le posizioni funzionano. Il motore individua il file automaticamente --- non è necessaria alcuna registrazione in config.cpp.

---

## Struttura XML Completa

Un file `inputs.xml` ha tre sezioni, tutte racchiuse in un elemento radice `<modded_inputs>`:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <!-- Le definizioni delle azioni vanno qui -->
        </actions>

        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <!-- Ordine di visualizzazione per il menù impostazioni -->
        </sorting>
    </inputs>
    <preset>
        <!-- Le assegnazioni predefinite dei tasti vanno qui -->
    </preset>
</modded_inputs>
```

Tutte e tre le sezioni --- `<actions>`, `<sorting>` e `<preset>` --- lavorano insieme ma servono scopi diversi.

---

## Blocco Actions

Il blocco `<actions>` dichiara ogni azione di input fornita dalla tua mod. Ogni azione è un singolo elemento `<input>`.

### Sintassi

```xml
<actions>
    <input name="UAMyModOpenMenu" loc="STR_MYMOD_INPUT_OPEN_MENU" />
    <input name="UAMyModToggleHUD" loc="STR_MYMOD_INPUT_TOGGLE_HUD" />
</actions>
```

### Attributi

| Attributo | Obbligatorio | Descrizione |
|-----------|--------------|-------------|
| `name` | Sì | Identificatore unico dell'azione. Convenzione: prefisso con `UA` (User Action). Usato negli script per interrogare questo input. |
| `loc` | No | Chiave stringtable per il nome visualizzato nel menù Controlli. **Senza prefisso `#`** --- il sistema lo aggiunge. |
| `visible` | No | Imposta a `"false"` per nascondere dal menù Controlli. Predefinito: `true`. |

### Convenzione di Denominazione

I nomi delle azioni devono essere globalmente unici tra tutte le mod caricate. Usa il prefisso della tua mod:

```xml
<input name="UAMyModAdminPanel" loc="STR_MYMOD_INPUT_ADMIN_PANEL" />
<input name="UAExpansionBookToggle" loc="STR_EXPANSION_BOOK_TOGGLE" />
<input name="eAICommandMenu" loc="STR_EXPANSION_AI_COMMAND_MENU" />
```

Il prefisso `UA` è convenzionale ma non obbligatorio. Expansion AI usa `eAI` come prefisso, che funziona altrettanto bene.

---

## Blocco Sorting

Il blocco `<sorting>` controlla come i tuoi input appaiono nelle impostazioni Controlli del giocatore. Definisce un gruppo con nome (che diventa un'intestazione di sezione) e elenca gli input in ordine di visualizzazione.

### Sintassi

```xml
<sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
    <input name="UAMyModOpenMenu" />
    <input name="UAMyModToggleHUD" />
    <input name="UAMyModSpecialAction" />
</sorting>
```

### Attributi

| Attributo | Obbligatorio | Descrizione |
|-----------|--------------|-------------|
| `name` | Sì | Identificatore interno per questo gruppo di ordinamento |
| `loc` | Sì | Chiave stringtable per l'intestazione del gruppo visualizzata in Impostazioni > Controlli |

### Come Appare

Nelle impostazioni Controlli, il giocatore vede:

```
[MyMod]                          <-- dal loc del sorting
  Open Menu .............. [Y]   <-- dal loc dell'input + preset
  Toggle HUD ............. [H]   <-- dal loc dell'input + preset
```

Solo gli input elencati nel blocco `<sorting>` appaiono nel menù impostazioni. Gli input definiti in `<actions>` ma non elencati in `<sorting>` vengono registrati silenziosamente ma sono invisibili al giocatore (anche se `visible` non è esplicitamente impostato a `false`).

---

## Blocco Preset (Tasti Predefiniti)

Il blocco `<preset>` assegna tasti predefiniti alle tue azioni. Questi sono i tasti con cui il giocatore inizia prima di qualsiasi personalizzazione.

### Associazione Semplice di Tasto

```xml
<preset>
    <input name="UAMyModOpenMenu">
        <btn name="kY"/>
    </input>
</preset>
```

Questo associa il tasto `Y` come predefinito per `UAMyModOpenMenu`.

### Nessun Tasto Predefinito

Se ometti un'azione dal blocco `<preset>`, non ha alcuna associazione predefinita. Il giocatore deve assegnare manualmente un tasto in Impostazioni > Controlli. Questo è appropriato per associazioni opzionali o avanzate.

---

## Combinazioni con Modificatori

Per richiedere un tasto modificatore (Ctrl, Shift, Alt), annida gli elementi `<btn>`:

### Ctrl + Tasto Sinistro del Mouse

```xml
<input name="eAISetWaypoint">
    <btn name="kLControl">
        <btn name="mBLeft"/>
    </btn>
</input>
```

Il `<btn>` esterno è il modificatore; il `<btn>` interno è il tasto principale. Il giocatore deve tenere premuto il modificatore e poi premere il tasto principale.

### Shift + Tasto

```xml
<input name="UAMyModQuickAction">
    <btn name="kLShift">
        <btn name="kQ"/>
    </btn>
</input>
```

### Regole di Annidamento

- Il `<btn>` **esterno** è sempre il modificatore (tenuto premuto)
- Il `<btn>` **interno** è il trigger (premuto mentre il modificatore è tenuto)
- Solo un livello di annidamento è tipico; un annidamento più profondo non è testato e non è consigliato

---

## Input Nascosti

Usa `visible="false"` per registrare un input che il giocatore non può vedere o riassegnare nel menù Controlli. Questo è utile per input interni usati dal codice della tua mod che non dovrebbero essere configurabili dal giocatore.

```xml
<actions>
    <input name="eAITestInput" visible="false" />
    <input name="UAExpansionConfirm" loc="" visible="false" />
</actions>
```

Gli input nascosti possono comunque avere assegnazioni di tasti predefinite nel blocco `<preset>`:

```xml
<preset>
    <input name="eAITestInput">
        <btn name="kY"/>
    </input>
</preset>
```

---

## Tasti Predefiniti Multipli

Un'azione può avere più tasti predefiniti. Elenca più elementi `<btn>` come fratelli:

```xml
<input name="UAExpansionConfirm">
    <btn name="kReturn" />
    <btn name="kNumpadEnter" />
</input>
```

Sia `Enter` che `Numpad Enter` attiveranno `UAExpansionConfirm`. Questo è utile per azioni in cui più tasti fisici dovrebbero corrispondere alla stessa azione logica.

---

## Accedere agli Input negli Script

### Ottenere l'API di Input

Tutto l'accesso agli input passa tramite `GetUApi()`, che restituisce l'API globale User Action:

```c
UAInput input = GetUApi().GetInputByName("UAMyModOpenMenu");
```

### Interrogazione in OnUpdate

Gli input personalizzati vengono tipicamente interrogati in `MissionGameplay.OnUpdate()` o callback simili per-frame:

```c
modded class MissionGameplay
{
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        UAInput input = GetUApi().GetInputByName("UAMyModOpenMenu");

        if (input.LocalPress())
        {
            // Il tasto è stato appena premuto in questo frame
            OpenMyModMenu();
        }
    }
}
```

### Alternativa: Usare il Nome dell'Input Direttamente

Molte mod controllano gli input inline usando i metodi `UAInputAPI` con nomi stringa:

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);

    Input input = GetGame().GetInput();

    if (input.LocalPress("UAMyModOpenMenu", false))
    {
        OpenMyModMenu();
    }
}
```

Il parametro `false` in `LocalPress("name", false)` indica che il controllo non dovrebbe consumare l'evento di input.

---

## Riferimento dei Metodi di Input

Una volta ottenuto un riferimento `UAInput` (da `GetUApi().GetInputByName()`), o usando direttamente la classe `Input`, questi metodi rilevano diversi stati di input:

| Metodo | Restituisce | Quando è Vero |
|--------|-------------|---------------|
| `LocalPress()` | `bool` | Il tasto è stato premuto **in questo frame** (trigger singolo alla pressione) |
| `LocalRelease()` | `bool` | Il tasto è stato rilasciato **in questo frame** (trigger singolo al rilascio) |
| `LocalClick()` | `bool` | Il tasto è stato premuto e rilasciato rapidamente (tap) |
| `LocalHold()` | `bool` | Il tasto è stato tenuto premuto per una durata soglia |
| `LocalDoubleClick()` | `bool` | Il tasto è stato premuto due volte rapidamente |
| `LocalValue()` | `float` | Valore analogico corrente (0.0 o 1.0 per tasti digitali; variabile per assi analogici) |

### Pattern di Utilizzo

**Toggle alla pressione:**
```c
if (input.LocalPress("UAMyModToggle", false))
{
    m_IsEnabled = !m_IsEnabled;
}
```

**Tieni per attivare, rilascia per disattivare:**
```c
if (input.LocalPress("eAICommandMenu", false))
{
    ShowCommandWheel();
}

if (input.LocalRelease("eAICommandMenu", false) || input.LocalValue("eAICommandMenu", false) == 0)
{
    HideCommandWheel();
}
```

**Azione con doppio tap:**
```c
if (input.LocalDoubleClick("UAMyModSpecial", false))
{
    PerformSpecialAction();
}
```

**Tenere premuto per azione estesa:**
```c
if (input.LocalHold("UAExpansionGPSToggle"))
{
    ToggleGPSMode();
}
```

---

## Sopprimere e Disabilitare gli Input

### ForceDisable

Disabilita temporaneamente un input specifico. Usato comunemente quando si aprono menù per impedire che le azioni di gioco si attivino mentre un'UI è attiva:

```c
// Disabilita l'input mentre il menù è aperto
GetUApi().GetInputByName("UAMyModToggle").ForceDisable(true);

// Riabilita quando il menù si chiude
GetUApi().GetInputByName("UAMyModToggle").ForceDisable(false);
```

### SupressNextFrame

Sopprime tutta l'elaborazione degli input per il frame successivo. Usato durante le transizioni di contesto degli input (es. chiusura di menù) per prevenire la perdita di input di un frame:

```c
GetUApi().SupressNextFrame(true);
```

### UpdateControls

Dopo aver modificato gli stati degli input, chiama `UpdateControls()` per applicare le modifiche immediatamente:

```c
GetUApi().GetInputByName("UAExpansionBookToggle").ForceDisable(false);
GetUApi().UpdateControls();
```

### Esclusioni degli Input

Il sistema di missione vanilla fornisce gruppi di esclusione. Quando un menù è attivo, puoi escludere categorie di input:

```c
// Sopprimi gli input di gameplay mentre l'inventario è aperto
AddActiveInputExcludes({"inventory"});

// Ripristina alla chiusura
RemoveActiveInputExcludes({"inventory"});
```

---

## Riferimento dei Nomi dei Tasti

I nomi dei tasti usati nell'attributo `<btn name="">` seguono una convenzione di denominazione specifica. Ecco il riferimento completo.

### Tasti della Tastiera

| Categoria | Nomi dei Tasti |
|-----------|---------------|
| Lettere | `kA`, `kB`, `kC`, `kD`, `kE`, `kF`, `kG`, `kH`, `kI`, `kJ`, `kK`, `kL`, `kM`, `kN`, `kO`, `kP`, `kQ`, `kR`, `kS`, `kT`, `kU`, `kV`, `kW`, `kX`, `kY`, `kZ` |
| Numeri (riga superiore) | `k0`, `k1`, `k2`, `k3`, `k4`, `k5`, `k6`, `k7`, `k8`, `k9` |
| Tasti funzione | `kF1`, `kF2`, `kF3`, `kF4`, `kF5`, `kF6`, `kF7`, `kF8`, `kF9`, `kF10`, `kF11`, `kF12` |
| Modificatori | `kLControl`, `kRControl`, `kLShift`, `kRShift`, `kLAlt`, `kRAlt` |
| Navigazione | `kUp`, `kDown`, `kLeft`, `kRight`, `kHome`, `kEnd`, `kPageUp`, `kPageDown` |
| Editing | `kReturn`, `kBackspace`, `kDelete`, `kInsert`, `kSpace`, `kTab`, `kEscape` |
| Tastierino numerico | `kNumpad0` ... `kNumpad9`, `kNumpadEnter`, `kNumpadPlus`, `kNumpadMinus`, `kNumpadMultiply`, `kNumpadDivide`, `kNumpadDecimal` |
| Punteggiatura | `kMinus`, `kEquals`, `kLBracket`, `kRBracket`, `kBackslash`, `kSemicolon`, `kApostrophe`, `kComma`, `kPeriod`, `kSlash`, `kGrave` |
| Blocchi | `kCapsLock`, `kNumLock`, `kScrollLock` |

### Pulsanti del Mouse

| Nome | Pulsante |
|------|----------|
| `mBLeft` | Pulsante sinistro del mouse |
| `mBRight` | Pulsante destro del mouse |
| `mBMiddle` | Pulsante centrale del mouse (clic della rotella) |
| `mBExtra1` | Pulsante mouse 4 (pulsante laterale indietro) |
| `mBExtra2` | Pulsante mouse 5 (pulsante laterale avanti) |

### Assi del Mouse

| Nome | Asse |
|------|------|
| `mAxisX` | Movimento orizzontale del mouse |
| `mAxisY` | Movimento verticale del mouse |
| `mWheelUp` | Rotella di scorrimento su |
| `mWheelDown` | Rotella di scorrimento giù |

### Pattern di Denominazione

- **Tastiera**: prefisso `k` + nome del tasto (es. `kT`, `kF5`, `kLControl`)
- **Pulsanti mouse**: prefisso `mB` + nome del pulsante (es. `mBLeft`, `mBRight`)
- **Assi mouse**: prefisso `m` + nome dell'asse (es. `mAxisX`, `mWheelUp`)

---

## Esempi Reali

### DayZ Expansion AI

Un inputs.xml ben strutturato con associazioni visibili, input di debug nascosti e combinazioni con modificatori:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="eAICommandMenu" loc="STR_EXPANSION_AI_COMMAND_MENU"/>
            <input name="eAISetWaypoint" loc="STR_EXPANSION_AI_SET_WAYPOINT"/>
            <input name="eAITestInput" visible="false" />
            <input name="eAITestLRIncrease" visible="false" />
            <input name="eAITestLRDecrease" visible="false" />
            <input name="eAITestUDIncrease" visible="false" />
            <input name="eAITestUDDecrease" visible="false" />
        </actions>

        <sorting name="expansion" loc="STR_EXPANSION_LABEL">
            <input name="eAICommandMenu" />
            <input name="eAISetWaypoint" />
            <input name="eAITestInput" />
            <input name="eAITestLRIncrease" />
            <input name="eAITestLRDecrease" />
            <input name="eAITestUDIncrease" />
            <input name="eAITestUDDecrease" />
        </sorting>
    </inputs>
    <preset>
        <input name="eAICommandMenu">
            <btn name="kT"/>
        </input>
        <input name="eAISetWaypoint">
            <btn name="kLControl">
                <btn name="mBLeft"/>
            </btn>
        </input>
        <input name="eAITestInput">
            <btn name="kY"/>
        </input>
        <input name="eAITestLRIncrease">
            <btn name="kRight"/>
        </input>
        <input name="eAITestLRDecrease">
            <btn name="kLeft"/>
        </input>
        <input name="eAITestUDIncrease">
            <btn name="kUp"/>
        </input>
        <input name="eAITestUDDecrease">
            <btn name="kDown"/>
        </input>
    </preset>
</modded_inputs>
```

Osservazioni chiave:
- `eAICommandMenu` associato a `T` --- visibile nelle impostazioni, il giocatore può riassegnarlo
- `eAISetWaypoint` usa una combinazione modificatore **Ctrl + Clic Sinistro**
- Gli input di test sono `visible="false"` --- nascosti ai giocatori ma accessibili nel codice

### DayZ Expansion Market

Un inputs.xml minimale per un input di utilità nascosto con più tasti predefiniti:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAExpansionConfirm" loc="" visible="false" />
        </actions>
    </inputs>
    <preset>
        <input name="UAExpansionConfirm">
            <btn name="kReturn" />
            <btn name="kNumpadEnter" />
        </input>
    </preset>
</modded_inputs>
```

Osservazioni chiave:
- Input nascosto (`visible="false"`) con `loc` vuoto --- mai mostrato nelle impostazioni
- Due tasti predefiniti: sia Enter che Numpad Enter attivano la stessa azione
- Nessun blocco `<sorting>` --- non necessario dato che l'input è nascosto

### Template Iniziale Completo

Un template minimale ma completo per una nuova mod:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAMyModOpenMenu" loc="STR_MYMOD_INPUT_OPEN_MENU" />
            <input name="UAMyModQuickAction" loc="STR_MYMOD_INPUT_QUICK_ACTION" />
        </actions>

        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <input name="UAMyModOpenMenu" />
            <input name="UAMyModQuickAction" />
        </sorting>
    </inputs>
    <preset>
        <input name="UAMyModOpenMenu">
            <btn name="kF6"/>
        </input>
        <!-- UAMyModQuickAction non ha tasto predefinito; il giocatore deve assegnarlo -->
    </preset>
</modded_inputs>
```

Con un corrispondente stringtable.csv:

```csv
"Language","original","english"
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod"
"STR_MYMOD_INPUT_OPEN_MENU","Open Menu","Open Menu"
"STR_MYMOD_INPUT_QUICK_ACTION","Quick Action","Quick Action"
```

---

## Errori Comuni

### Usare `#` nell'Attributo loc

```xml
<!-- SBAGLIATO -->
<input name="UAMyAction" loc="#STR_MYMOD_ACTION" />

<!-- CORRETTO -->
<input name="UAMyAction" loc="STR_MYMOD_ACTION" />
```

Il sistema di input antepone `#` internamente. Aggiungerlo tu stesso causa un doppio prefisso e la ricerca fallisce.

### Collisioni di Nomi delle Azioni

Se due mod definiscono `UAOpenMenu`, solo una funzionerà. Usa sempre il prefisso della tua mod:

```xml
<input name="UAMyModOpenMenu" />     <!-- Bene -->
<input name="UAOpenMenu" />          <!-- Rischioso -->
```

### Voce di Sorting Mancante

Se definisci un'azione in `<actions>` ma dimentichi di elencarla in `<sorting>`, l'azione funziona nel codice ma è invisibile nel menù Controlli. Il giocatore non ha modo di riassegnarla.

### Dimenticare di Definire nelle Actions

Se elenchi un input in `<sorting>` o `<preset>` ma non lo definisci mai in `<actions>`, il motore lo ignora silenziosamente.

### Assegnare Tasti in Conflitto

Scegliere tasti che entrano in conflitto con le associazioni vanilla (come `W`, `A`, `S`, `D`, `Tab`, `I`) causa l'attivazione simultanea sia della tua azione che di quella vanilla. Usa tasti meno comuni (F5-F12, tasti del tastierino numerico) o combinazioni con modificatori per sicurezza.

---

## Buone Pratiche

- Aggiungi sempre il prefisso `UA` + nome della tua mod ai nomi delle azioni (es. `UAMyModOpenMenu`). Nomi generici come `UAOpenMenu` entreranno in collisione con altre mod.
- Fornisci un attributo `loc` per ogni input visibile e definisci la chiave stringtable corrispondente. Senza di esso, il menù Controlli mostra il nome grezzo dell'azione.
- Scegli tasti predefiniti poco comuni (F5-F12, tastierino numerico) o combinazioni con modificatori (Ctrl+tasto) per minimizzare i conflitti con le associazioni vanilla e delle mod popolari.
- Elenca sempre gli input visibili nel blocco `<sorting>`. Un input definito in `<actions>` ma mancante da `<sorting>` è invisibile al giocatore e non può essere riassegnato.
- Memorizza nella cache il riferimento `UAInput` da `GetUApi().GetInputByName()` in una variabile membro anziché chiamarlo ogni frame in `OnUpdate`. La ricerca per stringa ha un costo.

---

## Teoria vs Pratica

> Cosa dice la documentazione rispetto a come funzionano effettivamente le cose a runtime.

| Concetto | Teoria | Realtà |
|----------|--------|--------|
| `visible="false"` nasconde dal menù Controlli | L'input è registrato ma invisibile | Gli input nascosti appaiono comunque nell'elenco del blocco `<sorting>` in alcune versioni di DayZ. Ometterlo dal `<sorting>` è il modo affidabile per nascondere gli input |
| `LocalPress()` si attiva una volta alla pressione | Trigger singolo nel frame in cui il tasto viene premuto | Se il gioco ha un singhiozzo (FPS bassi), `LocalPress()` può essere completamente mancato. Per azioni critiche, controlla anche `LocalValue() > 0` come fallback |
| Combinazioni con modificatori tramite `<btn>` annidati | L'esterno è il modificatore, l'interno è il trigger | Il tasto modificatore da solo registra anche una pressione sul suo input (es. `kLControl` è anche l'accovacciamento vanilla). I giocatori che tengono Ctrl+Clic si accovacceranno anche |
| `ForceDisable(true)` sopprime l'input | L'input è completamente ignorato | `ForceDisable` persiste fino a quando non viene esplicitamente riabilitato. Se la tua mod va in crash o l'UI si chiude senza chiamare `ForceDisable(false)`, l'input resta disabilitato fino al riavvio del gioco |
| Più `<btn>` fratelli | Entrambi i tasti attivano la stessa azione | Funziona correttamente, ma il menù Controlli mostra solo il primo tasto. Il giocatore può vedere e riassegnare il primo tasto ma potrebbe non rendersi conto che il secondo predefinito esiste |

---

## Compatibilità e Impatto

- **Multi-Mod:** Le collisioni dei nomi delle azioni sono il rischio principale. Se due mod definiscono `UAOpenMenu`, solo una funziona e il conflitto è silenzioso. Non c'è alcun avvertimento del motore per nomi di azioni duplicati tra mod.
- **Prestazioni:** L'interrogazione degli input tramite `GetUApi().GetInputByName()` comporta una ricerca hash per stringa. Interrogare 5-10 input per frame è trascurabile, ma memorizzare nella cache il riferimento `UAInput` è comunque consigliato per mod con molti input.
- **Versione:** Il formato `inputs.xml` e la struttura `<modded_inputs>` sono stabili da DayZ 1.0. L'attributo `visible` è stato aggiunto successivamente (intorno alla 1.08) -- nelle versioni precedenti, tutti gli input sono sempre visibili nel menù Controlli.

---

## Osservato nelle Mod Reali

| Pattern | Mod | Dettaglio |
|---------|-----|-----------|
| Combinazione modificatore `Ctrl+Clic` | Expansion AI | `eAISetWaypoint` usa `<btn name="kLControl"><btn name="mBLeft"/>` annidati per Ctrl+Clic Sinistro per piazzare waypoint IA |
| Input di utilità nascosti | Expansion Market | `UAExpansionConfirm` è `visible="false"` con doppio tasto (Enter + Numpad Enter) per logica di conferma interna |
| `ForceDisable` all'apertura del menù | COT, VPP | I pannelli admin chiamano `ForceDisable(true)` sugli input di gameplay quando il pannello si apre, e `ForceDisable(false)` alla chiusura per prevenire il movimento del personaggio durante la digitazione |
| `UAInput` memorizzato in variabile membro | DabsFramework | Memorizza il risultato di `GetUApi().GetInputByName()` in un campo della classe durante l'inizializzazione, interroga il riferimento memorizzato in `OnUpdate` per evitare la ricerca per stringa ad ogni frame |
