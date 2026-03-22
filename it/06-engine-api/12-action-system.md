# Capitolo 6.12: Sistema delle Azioni

[Home](../README.md) | [<< Precedente: Mission Hooks](11-mission-hooks.md) | **Sistema delle Azioni** | [Successivo: Sistema di Input >>](13-input-system.md)

---

## Introduzione

Il Sistema delle Azioni è il modo in cui DayZ gestisce tutte le interazioni del giocatore con gli oggetti e il mondo. Ogni volta che un giocatore mangia del cibo, apre una porta, fascia una ferita, ripara un muro o accende una torcia, il motore attraversa la pipeline delle azioni. Comprendere questa pipeline --- dai controlli delle condizioni ai callback delle animazioni all'esecuzione sul server --- è fondamentale per creare qualsiasi mod di gameplay interattivo.

Il sistema risiede principalmente in `4_World/classes/useractionscomponent/` ed è costruito attorno a tre pilastri:

1. **Classi azione** che definiscono cosa succede (logica, condizioni, animazioni)
2. **Componenti condizione** che controllano quando un'azione può apparire (distanza, stato dell'oggetto, tipo del target)
3. **Componenti azione** che controllano come l'azione progredisce (tempo, quantità, cicli ripetuti)

Questo capitolo copre l'API completa, la gerarchia delle classi, il ciclo di vita e i pattern pratici per creare azioni personalizzate.

---

## Gerarchia delle Classi

```
ActionBase_Basic                         // 3_Game — shell vuoto, ancora di compilazione
└── ActionBase                           // 4_World — logica core, condizioni, eventi
    └── AnimatedActionBase               // 4_World — callback animazioni, OnExecute
        ├── ActionSingleUseBase          // azioni istantanee (mangia pillola, accendi luce)
        ├── ActionContinuousBase         // azioni con barra progresso (fascia, ripara, mangia)
        └── ActionInteractBase           // interazioni mondo (apri porta, attiva interruttore)
```

### Differenze Chiave tra i Tipi di Azione

| Proprietà | SingleUse | Continuous | Interact |
|----------|-----------|------------|----------|
| Costante categoria | `AC_SINGLE_USE` | `AC_CONTINUOUS` | `AC_INTERACT` |
| Tipo di input | `DefaultActionInput` | `ContinuousDefaultActionInput` | `InteractActionInput` |
| Barra progresso | No | Sì | No |
| Usa oggetto principale | Sì | Sì | No (predefinito) |
| Ha target | Varia | Varia | Sì (predefinito) |
| Uso tipico | Mangia pillola, attiva torcia | Fascia, ripara, mangia cibo | Apri porta, accendi generatore |

---

## Ciclo di Vita dell'Azione

### Costanti di Stato

La macchina a stati dell'azione usa queste costanti definite in `3_Game/constants.c`:

| Costante | Valore | Significato |
|----------|-------|---------|
| `UA_NONE` | 0 | Nessuna azione in corso |
| `UA_PROCESSING` | 2 | Azione in progresso |
| `UA_FINISHED` | 4 | Azione completata con successo |
| `UA_CANCEL` | 5 | Azione annullata dal giocatore |
| `UA_INTERRUPT` | 6 | Azione interrotta esternamente |
| `UA_INITIALIZE` | 12 | Azione continua in inizializzazione |
| `UA_ERROR` | 24 | Stato di errore --- azione abortita |
| `UA_ANIM_EVENT` | 11 | Evento di esecuzione animazione lanciato |

### Riferimento dei Metodi del Ciclo di Vita

Questi metodi vengono chiamati in ordine durante la vita di un'azione. Fai override nelle tue azioni personalizzate:

| Metodo | Chiamato su | Scopo |
|--------|-----------|---------|
| `CreateConditionComponents()` | Entrambi | Imposta `m_ConditionItem` e `m_ConditionTarget` |
| `ActionCondition()` | Entrambi | Validazione personalizzata (distanza, stato, controlli tipo) |
| `ActionConditionContinue()` | Entrambi | Solo continua: ricontrollata ogni frame durante il progresso |
| `OnStart()` | Entrambi | L'azione inizia |
| `OnStartServer()` | Server | Logica di avvio lato server |
| `OnStartClient()` | Client | Effetti di avvio lato client |
| `OnExecute()` | Entrambi | Evento animazione lanciato --- esecuzione principale |
| `OnExecuteServer()` | Server | Logica di esecuzione lato server |
| `OnExecuteClient()` | Client | Effetti di esecuzione lato client |
| `OnFinishProgress()` | Entrambi | Solo continua: un ciclo completato |
| `OnFinishProgressServer()` | Server | Solo continua: ciclo server completato |
| `OnEnd()` | Entrambi | Azione terminata (successo o annullamento) |
| `OnEndServer()` | Server | Pulizia lato server |
| `OnEndClient()` | Client | Pulizia lato client |

---

## ActionData

Ogni azione in esecuzione trasporta un'istanza `ActionData` che contiene il contesto runtime:

```c
class ActionData
{
    ref ActionBase       m_Action;          // la classe azione eseguita
    ItemBase             m_MainItem;        // oggetto nelle mani del giocatore (o null)
    ActionBaseCB         m_Callback;        // handler callback animazione
    ref CABase           m_ActionComponent;  // componente progresso (tempo, quantità)
    int                  m_State;           // stato corrente (UA_PROCESSING, ecc.)
    ref ActionTarget     m_Target;          // oggetto target + info hit
    PlayerBase           m_Player;          // giocatore che esegue l'azione
    bool                 m_WasExecuted;     // true dopo che OnExecute viene lanciato
    bool                 m_WasActionStarted; // true dopo che il loop azione inizia
}
```

Puoi estendere `ActionData` per dati personalizzati. Fai override di `CreateActionData()` nella tua azione.

---

## ActionTarget

La classe `ActionTarget` rappresenta ciò a cui il giocatore sta mirando:

```c
class ActionTarget
{
    Object GetObject();         // l'oggetto diretto sotto il cursore
    Object GetParent();         // oggetto padre (se il target è un proxy/attacco)
    bool   IsProxy();           // true se il target ha un padre
    int    GetComponentIndex(); // indice componente geometria (selezione nominata)
    float  GetUtility();        // punteggio priorità
    vector GetCursorHitPos();   // posizione mondo esatta dell'hit del cursore
}
```

---

## Componenti Condizione

Ogni azione ha due componenti condizione impostati in `CreateConditionComponents()`. Questi vengono controllati **prima** di `ActionCondition()` e determinano se l'azione può apparire nell'HUD del giocatore.

### Condizioni Oggetto (CCIBase)

Controlla se l'oggetto nella mano del giocatore qualifica per questa azione.

| Classe | Comportamento |
|-------|----------|
| `CCINone` | Passa sempre --- nessun requisito oggetto |
| `CCIDummy` | Passa se l'oggetto non è null (l'oggetto deve esistere) |
| `CCINonRuined` | Passa se l'oggetto esiste E non è rovinato |
| `CCINotPresent` | Passa se l'oggetto è null (le mani devono essere vuote) |
| `CCINotRuinedAndEmpty` | Passa se l'oggetto esiste, non rovinato e non vuoto |

### Condizioni Target (CCTBase)

Controlla se l'oggetto target (ciò che il giocatore sta guardando) qualifica.

| Classe | Costruttore | Comportamento |
|-------|-------------|----------|
| `CCTNone` | `CCTNone()` | Passa sempre --- nessun target necessario |
| `CCTSelf` | `CCTSelf()` | Passa se il giocatore esiste ed è vivo |
| `CCTObject` | `CCTObject(float dist)` | Oggetto target entro la distanza |
| `CCTCursor` | `CCTCursor(float dist)` | Posizione hit del cursore entro la distanza |
| `CCTNonRuined` | `CCTNonRuined(float dist)` | Target entro la distanza E non rovinato |

### Costanti di Distanza

| Costante | Valore (metri) | Uso tipico |
|----------|---------------|-------------|
| `UAMaxDistances.SMALL` | 1.3 | Interazioni ravvicinate, scale |
| `UAMaxDistances.DEFAULT` | 2.0 | Azioni standard |
| `UAMaxDistances.REPAIR` | 3.0 | Azioni di riparazione |
| `UAMaxDistances.LARGE` | 8.0 | Azioni ad area grande |
| `UAMaxDistances.BASEBUILDING` | 20.0 | Costruzione base |

---

## Registrare Azioni sugli Oggetti

Le azioni vengono registrate sulle entità tramite il pattern `SetActions()` / `AddAction()` / `RemoveAction()`.

### Su ItemBase (Oggetti Inventario)

Il pattern più comune. Fai override di `SetActions()` in una `modded class`:

```c
modded class MyCustomItem extends ItemBase
{
    override void SetActions()
    {
        super.SetActions();          // CRITICO: mantieni tutte le azioni vanilla
        AddAction(MyCustomAction);   // aggiungi la tua azione
    }
}
```

Per rimuovere un'azione vanilla e aggiungere la tua sostitutiva:

```c
modded class Bandage_Basic extends ItemBase
{
    override void SetActions()
    {
        super.SetActions();
        RemoveAction(ActionBandageTarget);       // rimuovi vanilla
        AddAction(MyImprovedBandageAction);      // aggiungi sostitutiva
    }
}
```

### Su BuildingBase (Edifici del Mondo)

Gli edifici usano lo stesso pattern tramite `BuildingBase`.

### Su PlayerBase (Azioni del Giocatore)

Le azioni a livello giocatore (bere da stagni, aprire porte, ecc.) sono registrate in `PlayerBase.SetActions()`. Il giocatore ha anche `SetActionsRemoteTarget()` per azioni eseguite **su** un giocatore da un altro giocatore (CPR, controllare il polso, ecc.).

---

## Creare un'Azione Personalizzata --- Passo dopo Passo

### Esempio 1: Azione SingleUse Semplice

Un'azione personalizzata che cura istantaneamente il giocatore quando usa un oggetto speciale:

```c
class ActionHealInstant : ActionSingleUseBase
{
    void ActionHealInstant()
    {
        m_CommandUID = DayZPlayerConstants.CMD_ACTIONMOD_EAT_PILL;
        m_CommandUIDProne = DayZPlayerConstants.CMD_ACTIONFB_EAT_PILL;
        m_Text = "#heal";
    }

    override void CreateConditionComponents()
    {
        m_ConditionItem = new CCINonRuined;    // l'oggetto non deve essere rovinato
        m_ConditionTarget = new CCTSelf;       // auto-azione
    }

    override bool HasTarget()
    {
        return false;  // nessun target esterno necessario
    }

    override bool ActionCondition(PlayerBase player, ActionTarget target, ItemBase item)
    {
        // Mostra solo se il giocatore è effettivamente ferito
        if (player.GetHealth("GlobalHealth", "Health") >= player.GetMaxHealth("GlobalHealth", "Health"))
            return false;
        return true;
    }

    override void OnExecuteServer(ActionData action_data)
    {
        // Cura il giocatore sul server
        PlayerBase player = action_data.m_Player;
        player.SetHealth("GlobalHealth", "Health", player.GetMaxHealth("GlobalHealth", "Health"));

        // Consuma l'oggetto (riduci la quantità di 1)
        ItemBase item = action_data.m_MainItem;
        if (item)
        {
            item.AddQuantity(-1);
        }
    }
}
```

### Esempio 2: Azione Continua con Barra Progresso

Un'azione di riparazione personalizzata che richiede tempo e consuma la durabilità dell'oggetto:

```c
// Passo 1: Definisci il callback con un componente azione
class ActionRepairCustomCB : ActionContinuousBaseCB
{
    override void CreateActionComponent()
    {
        // CAContinuousTime(secondi) — singola barra progresso che si completa una volta
        m_ActionData.m_ActionComponent = new CAContinuousTime(UATimeSpent.DEFAULT_REPAIR_CYCLE);
    }
}

// Passo 2: Definisci l'azione
class ActionRepairCustom : ActionContinuousBase
{
    void ActionRepairCustom()
    {
        m_CallbackClass = ActionRepairCustomCB;
        m_CommandUID = DayZPlayerConstants.CMD_ACTIONFB_ASSEMBLE;
        m_FullBody = true;  // animazione a corpo intero (il giocatore non può muoversi)
        m_StanceMask = DayZPlayerConstants.STANCEMASK_ERECT;
        m_Text = "#repair";
    }

    override void CreateConditionComponents()
    {
        m_ConditionItem = new CCINonRuined;
        m_ConditionTarget = new CCTObject(UAMaxDistances.REPAIR);
    }

    override void OnFinishProgressServer(ActionData action_data)
    {
        // Chiamato quando la barra progresso si completa
        Object target = action_data.m_Target.GetObject();
        if (target)
        {
            EntityAI entity = EntityAI.Cast(target);
            if (entity)
            {
                float currentHealth = entity.GetHealth("", "Health");
                entity.SetHealth("", "Health", currentHealth + 25);
            }
        }

        // Danneggia lo strumento
        action_data.m_MainItem.DecreaseHealth(UADamageApplied.REPAIR, false);
    }
}
```

### Esempio 3: Azione Interact (Toggle Oggetto del Mondo)

Un'azione interact per attivare/disattivare un dispositivo personalizzato:

```c
class ActionToggleMyDevice : ActionInteractBase
{
    void ActionToggleMyDevice()
    {
        m_CommandUID = DayZPlayerConstants.CMD_ACTIONMOD_INTERACTONCE;
        m_StanceMask = DayZPlayerConstants.STANCEMASK_CROUCH | DayZPlayerConstants.STANCEMASK_ERECT;
        m_Text = "#switch_on";
    }

    override void CreateConditionComponents()
    {
        m_ConditionItem = new CCINone;     // nessun oggetto necessario nelle mani
        m_ConditionTarget = new CCTCursor(UAMaxDistances.DEFAULT);
    }

    override bool ActionCondition(PlayerBase player, ActionTarget target, ItemBase item)
    {
        Object obj = target.GetObject();
        if (!obj)
            return false;

        MyCustomDevice device = MyCustomDevice.Cast(obj);
        if (!device)
            return false;

        if (device.IsActive())
            m_Text = "#switch_off";
        else
            m_Text = "#switch_on";

        return true;
    }

    override void OnExecuteServer(ActionData action_data)
    {
        MyCustomDevice device = MyCustomDevice.Cast(action_data.m_Target.GetObject());
        if (device)
        {
            if (device.IsActive())
                device.Deactivate();
            else
                device.Activate();
        }
    }
}
```

---

## Componenti Azione (Controllo del Progresso)

I componenti azione controllano _come_ l'azione progredisce nel tempo. Vengono creati nel metodo `CreateActionComponent()` del callback.

### Componenti Disponibili

| Componente | Parametri | Comportamento |
|-----------|------------|----------|
| `CASingleUse` | nessuno | Esecuzione istantanea, nessun progresso |
| `CAInteract` | nessuno | Esecuzione istantanea per azioni interact |
| `CAContinuousTime` | `float time` | Barra progresso, si completa dopo `time` secondi |
| `CAContinuousRepeat` | `float time` | Cicli ripetuti, lancia `OnFinishProgress` ogni ciclo |
| `CAContinuousQuantity` | `float quantity, float time` | Consuma quantità nel tempo |
| `CAContinuousQuantityEdible` | `float quantity, float time` | Come Quantity ma applica modificatori cibo/bevanda |

### Costanti di Tempo

| Costante | Valore (secondi) | Uso |
|----------|----------------|-----|
| `UATimeSpent.DEFAULT` | 1.0 | Generale |
| `UATimeSpent.DEFAULT_CONSTRUCT` | 5.0 | Costruzione |
| `UATimeSpent.DEFAULT_REPAIR_CYCLE` | 5.0 | Riparazione per ciclo |
| `UATimeSpent.BANDAGE` | 4.0 | Fasciatura |
| `UATimeSpent.RESTRAIN` | 10.0 | Legatura |
| `UATimeSpent.SKIN` | 10.0 | Scuoiatura animali |

---

## Argomenti Avanzati

### Animazioni Full Body vs Additive

Le azioni possono essere **additive** (il giocatore può camminare) o **full body** (il giocatore è bloccato sul posto):

- **Additive** (`m_FullBody = false`): Usa UID comando `CMD_ACTIONMOD_*`. Il giocatore può camminare.
- **Full body** (`m_FullBody = true`): Usa UID comando `CMD_ACTIONFB_*`. Il giocatore è fermo.

### Interruzione dell'Azione

Le azioni possono essere interrotte lato server tramite il callback:

```c
override void OnFinishProgressServer(ActionData action_data)
{
    if (SomeConditionFailed())
    {
        if (action_data.m_Callback)
            action_data.m_Callback.Interrupt();
        return;
    }
    // Esecuzione normale...
}
```

### Inventario ed Esecuzione dalla Quickbar

```c
override bool CanBePerformedFromInventory()
{
    return true;   // l'azione appare nel menu contestuale dell'inventario
}

override bool CanBePerformedFromQuickbar()
{
    return true;   // l'azione può essere attivata dalla quickbar
}
```

---

## Errori Comuni

### 1. Dimenticare `super.SetActions()`

```c
// SBAGLIATO — rimuove TUTTE le azioni vanilla dall'oggetto
modded class Apple extends ItemBase
{
    override void SetActions()
    {
        AddAction(MyCustomEatAction);
    }
}

// CORRETTO — preserva le azioni vanilla
modded class Apple extends ItemBase
{
    override void SetActions()
    {
        super.SetActions();
        AddAction(MyCustomEatAction);
    }
}
```

### 2. Mettere la Logica Server in OnExecuteClient

I cambiamenti di salute e le operazioni di inventario devono avvenire sul server. `OnExecuteClient` è solo per feedback visivo (suoni, effetti particellari, aggiornamenti UI).

### 3. Non Controllare Null in ActionCondition

```c
// SBAGLIATO
override bool ActionCondition(PlayerBase player, ActionTarget target, ItemBase item)
{
    return target.GetObject().IsInherited(MyClass);  // CRASH se target o oggetto è null
}

// CORRETTO
override bool ActionCondition(PlayerBase player, ActionTarget target, ItemBase item)
{
    if (!target)
        return false;
    Object obj = target.GetObject();
    if (!obj)
        return false;
    return obj.IsInherited(MyClass);
}
```

### 4. Componenti Condizione Sbagliati (L'Azione Non Appare Mai)

Cause comuni:
- `CCIDummy` richiede un oggetto in mano, ma l'azione dovrebbe funzionare a mani vuote --- usa `CCINone`
- `CCTDummy` richiede un oggetto target, ma l'azione è un'auto-azione --- usa `CCTSelf` o `CCTNone`
- La distanza di `CCTObject` è troppo piccola per il tipo di target --- aumenta il parametro distanza

### 5. Confondere OnStart vs OnExecute

- `OnStart` / `OnStartServer`: Chiamato quando l'azione **inizia** (l'animazione parte). Usa per setup, riserva oggetti.
- `OnExecute` / `OnExecuteServer`: Chiamato quando l'**evento animazione si attiva** (il momento del "fare"). Usa per l'effetto effettivo.

### 6. L'Azione Continua Non Si Ripete

Se la tua azione continua si completa una volta e si ferma invece di ripetere, stai usando `CAContinuousTime` (completamento singolo). Passa a `CAContinuousRepeat` per cicli ripetuti.

### 7. Dimenticare l'Override di HasTarget()

Se la tua azione è un'auto-azione (mangiare, curarsi, attivare oggetto tenuto in mano), devi fare override:

```c
override bool HasTarget()
{
    return false;
}
```

---

## Riepilogo

Il Sistema delle Azioni di DayZ segue un pattern coerente:

1. **Scegli la tua classe base**: `ActionSingleUseBase` per istantanee, `ActionContinuousBase` per temporizzate, `ActionInteractBase` per toggle del mondo
2. **Imposta i componenti condizione** in `CreateConditionComponents()`: CCI per requisiti oggetto, CCT per requisiti target
3. **Aggiungi validazione personalizzata** in `ActionCondition()`: controlli tipo, controlli stato, controlli distanza
4. **Implementa la logica server** in `OnExecuteServer()` o `OnFinishProgressServer()`
5. **Registra l'azione** tramite `AddAction()` nel `SetActions()` dell'entità appropriata
6. **Chiama sempre `super.SetActions()`** per preservare le azioni vanilla

Il sistema è progettato per essere modulare: i componenti condizione gestiscono "può succedere questo?", i componenti azione gestiscono "quanto tempo ci vuole?", e i tuoi override gestiscono "cosa fa?". Mantieni la logica server sul server, il feedback visivo sul client, e controlla sempre null sui tuoi target.

---

## Buone Pratiche

- **Chiama sempre `super.SetActions()` quando moddi oggetti esistenti.** Ometterlo rimuove tutte le azioni vanilla dall'oggetto.
- **Metti tutta la logica che cambia stato in `OnExecuteServer` o `OnFinishProgressServer`.** I cambiamenti di salute, l'eliminazione di oggetti e la manipolazione dell'inventario devono essere eseguiti lato server.
- **Usa `CCTObject` con costanti di distanza appropriate.** Codificare i controlli di distanza in `ActionCondition()` è fragile.
- **Controlla null su ogni oggetto in `ActionCondition()`.** Il metodo viene chiamato frequentemente con target potenzialmente null.
- **Preferisci `CAContinuousRepeat` a `CAContinuousTime` per azioni stile riparazione.** Repeat lancia `OnFinishProgressServer` ogni ciclo e continua finché il giocatore rilascia il tasto.

---

## Compatibilità e Impatto

- **Multi-Mod:** Le azioni sono registrate per tipo di classe tramite `SetActions()`. Due mod che aggiungono azioni diverse allo stesso tipo di oggetto funzionano entrambi --- le azioni si accumulano. Tuttavia, se entrambi i mod fanno override di `SetActions()` senza chiamare `super`, solo le azioni dell'ultimo mod caricato sopravvivono.
- **Prestazioni:** `ActionCondition()` viene valutata ogni frame per ogni azione candidata sul target corrente del giocatore. Mantienila leggera --- evita raycast costosi, ricerche config o iterazioni di array dentro i controlli condizione.
- **Server/Client:** La pipeline delle azioni è divisa: i controlli condizione e la visualizzazione UI girano sul client, i callback di esecuzione girano sul server. Il motore gestisce la sincronizzazione tramite RPC interni.

---

[Home](../README.md) | [<< Precedente: Mission Hooks](11-mission-hooks.md) | **Sistema delle Azioni** | [Successivo: Sistema di Input >>](13-input-system.md)
