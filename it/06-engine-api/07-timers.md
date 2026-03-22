# Capitolo 6.7: Timer e CallQueue

[Home](../README.md) | [<< Precedente: Notifiche](06-notifications.md) | **Timer e CallQueue** | [Successivo: I/O File e JSON >>](08-file-io.md)

---

## Introduzione

DayZ fornisce diversi meccanismi per chiamate di funzione differite e ripetute: `ScriptCallQueue` (il sistema principale), `Timer`, `ScriptInvoker` e `WidgetFadeTimer`. Questi sono essenziali per pianificare logica ritardata, creare cicli di aggiornamento e gestire eventi temporizzati senza bloccare il thread principale. Questo capitolo copre ogni meccanismo con firme API complete e pattern di utilizzo.

---

## Categorie di Chiamata

Tutti i sistemi di timer e code di chiamata richiedono una **categoria di chiamata** che determina quando la chiamata differita viene eseguita all'interno del frame:

```c
const int CALL_CATEGORY_SYSTEM   = 0;   // Operazioni a livello di sistema
const int CALL_CATEGORY_GUI      = 1;   // Aggiornamenti dell'interfaccia
const int CALL_CATEGORY_GAMEPLAY = 2;   // Logica di gioco
const int CALL_CATEGORY_COUNT    = 3;   // Numero totale di categorie
```

Accedi alla coda di una categoria:

```c
ScriptCallQueue  queue   = GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY);
ScriptInvoker    updater = GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY);
TimerQueue       timers  = GetGame().GetTimerQueue(CALL_CATEGORY_GAMEPLAY);
```

---

## ScriptCallQueue

**File:** `3_Game/tools/utilityclasses.c`

Il meccanismo principale per chiamate di funzione differite. Supporta ritardi a colpo singolo, chiamate ripetute e esecuzione immediata al frame successivo.

### CallLater

```c
void CallLater(func fn, int delay = 0, bool repeat = false,
               void param1 = NULL, void param2 = NULL,
               void param3 = NULL, void param4 = NULL);
```

| Parametro | Descrizione |
|-----------|-------------|
| `fn` | La funzione da chiamare (riferimento al metodo: `this.MyMethod`) |
| `delay` | Ritardo in millisecondi (0 = frame successivo) |
| `repeat` | `true` = chiama ripetutamente a intervalli di `delay`; `false` = chiama una volta |
| `param1..4` | Parametri opzionali passati alla funzione |

**Esempio --- ritardo a colpo singolo:**

```c
// Chiama MyFunction una volta dopo 5 secondi
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.MyFunction, 5000, false);
```

**Esempio --- chiamata ripetuta:**

```c
// Chiama UpdateLoop ogni 1 secondo, ripetutamente
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.UpdateLoop, 1000, true);
```

**Esempio --- con parametri:**

```c
void ShowMessage(string text, int color)
{
    Print(text);
}

// Chiama con parametri dopo 2 secondi
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(
    this.ShowMessage, 2000, false, "Ciao!", ARGB(255, 255, 0, 0)
);
```

### Call

```c
void Call(func fn, void param1 = NULL, void param2 = NULL,
          void param3 = NULL, void param4 = NULL);
```

Esegue la funzione al frame successivo (ritardo = 0, nessuna ripetizione). Abbreviazione per `CallLater(fn, 0, false)`.

**Esempio:**

```c
// Esegui al frame successivo
GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).Call(this.Initialize);
```

### CallByName

```c
void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false,
                Param par = null);
```

Chiama un metodo tramite il suo nome come stringa. Utile quando il riferimento al metodo non è direttamente disponibile.

**Esempio:**

```c
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallByName(
    myObject, "OnTimerExpired", 3000, false
);
```

### Remove

```c
void Remove(func fn);
```

Rimuove una chiamata pianificata. Essenziale per fermare le chiamate ripetute e prevenire chiamate su oggetti distrutti.

**Esempio:**

```c
// Fermare una chiamata ripetuta
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).Remove(this.UpdateLoop);
```

### RemoveByName

```c
void RemoveByName(Class obj, string fnName);
```

Rimuove una chiamata pianificata tramite `CallByName`.

### Tick

```c
void Tick(float timeslice);
```

Chiamato internamente dal motore ogni frame. Non dovresti mai aver bisogno di chiamarlo manualmente.

---

## Timer

**File:** `3_Game/tools/utilityclasses.c`

Un timer basato su classe con ciclo di vita esplicito start/stop. Più pulito per timer a lunga durata che devono essere messi in pausa o riavviati.

### Costruttore

```c
void Timer(int category = CALL_CATEGORY_SYSTEM);
```

### Run

```c
void Run(float duration, Class obj, string fn_name, Param params = null, bool loop = false);
```

| Parametro | Descrizione |
|-----------|-------------|
| `duration` | Tempo in secondi (non millisecondi!) |
| `obj` | L'oggetto il cui metodo verrà chiamato |
| `fn_name` | Nome del metodo come stringa |
| `params` | Oggetto `Param` opzionale con parametri |
| `loop` | `true` = ripeti dopo ogni durata |

**Esempio --- timer a colpo singolo:**

```c
ref Timer m_Timer;

void StartTimer()
{
    m_Timer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_Timer.Run(5.0, this, "OnTimerComplete", null, false);
}

void OnTimerComplete()
{
    Print("Timer terminato!");
}
```

**Esempio --- timer ripetuto:**

```c
ref Timer m_UpdateTimer;

void StartUpdateLoop()
{
    m_UpdateTimer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_UpdateTimer.Run(1.0, this, "OnUpdate", null, true);  // Ogni 1 secondo
}

void StopUpdateLoop()
{
    if (m_UpdateTimer && m_UpdateTimer.IsRunning())
        m_UpdateTimer.Stop();
}
```

### Stop

```c
void Stop();
```

Ferma il timer. Può essere riavviato con un'altra chiamata `Run()`.

### IsRunning

```c
bool IsRunning();
```

Restituisce `true` se il timer è attualmente attivo.

### Pause

```c
void Pause();
```

Mette in pausa un timer in esecuzione, preservando il tempo rimanente. Il timer può essere ripreso con `Continue()`.

### Continue

```c
void Continue();
```

Riprende un timer in pausa da dove si era fermato.

### IsPaused

```c
bool IsPaused();
```

Restituisce `true` se il timer è attualmente in pausa.

**Esempio --- pausa e ripresa:**

```c
ref Timer m_Timer;

void StartTimer()
{
    m_Timer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_Timer.Run(10.0, this, "OnTimerComplete", null, false);
}

void TogglePause()
{
    if (m_Timer.IsPaused())
        m_Timer.Continue();
    else
        m_Timer.Pause();
}
```

### GetRemaining

```c
float GetRemaining();
```

Restituisce il tempo rimanente in secondi.

### GetDuration

```c
float GetDuration();
```

Restituisce la durata totale impostata da `Run()`.

---

## ScriptInvoker

**File:** `3_Game/tools/utilityclasses.c`

Un sistema di eventi/delegati. `ScriptInvoker` mantiene una lista di funzioni callback e le invoca tutte quando viene chiamato `Invoke()`. Questo è l'equivalente DayZ degli eventi C# o del pattern observer.

### Insert

```c
void Insert(func fn);
```

Registra una funzione callback.

### Remove

```c
void Remove(func fn);
```

Cancella la registrazione di una funzione callback.

### Invoke

```c
void Invoke(void param1 = NULL, void param2 = NULL,
            void param3 = NULL, void param4 = NULL);
```

Chiama tutte le funzioni registrate con i parametri forniti.

### Count

```c
int Count();
```

Numero di callback registrate.

### Clear

```c
void Clear();
```

Rimuove tutte le callback registrate.

**Esempio --- sistema di eventi personalizzato:**

```c
class MyModule
{
    ref ScriptInvoker m_OnMissionComplete = new ScriptInvoker();

    void CompleteMission()
    {
        // Esegui la logica di completamento...

        // Notifica tutti i listener
        m_OnMissionComplete.Invoke("MissionAlpha", 1500);
    }
}

class MyUI
{
    void Init(MyModule module)
    {
        // Iscriviti all'evento
        module.m_OnMissionComplete.Insert(this.OnMissionComplete);
    }

    void OnMissionComplete(string name, int reward)
    {
        Print(string.Format("Missione %1 completata! Ricompensa: %2", name, reward));
    }

    void Cleanup(MyModule module)
    {
        // Annulla sempre l'iscrizione per prevenire riferimenti pendenti
        module.m_OnMissionComplete.Remove(this.OnMissionComplete);
    }
}
```

### Coda di Aggiornamento

Il motore fornisce code `ScriptInvoker` per-frame:

```c
ScriptInvoker updater = GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY);
updater.Insert(this.OnFrame);

// Rimuovi quando finito
updater.Remove(this.OnFrame);
```

Le funzioni registrate nella coda di aggiornamento vengono chiamate ogni frame senza parametri. Questo è utile per logica per-frame senza usare `EntityEvent.FRAME`.

---

## WidgetFadeTimer

**File:** `3_Game/tools/utilityclasses.c`

Un timer specializzato per la dissolvenza dei widget in entrata e in uscita.

```c
class WidgetFadeTimer
{
    void FadeIn(Widget w, float time, bool continue_from_current = false);
    void FadeOut(Widget w, float time, bool continue_from_current = false);
    bool IsFading();
    void Stop();
}
```

| Parametro | Descrizione |
|-----------|-------------|
| `w` | Il widget da sfumare |
| `time` | Durata della dissolvenza in secondi |
| `continue_from_current` | Se `true`, inizia dall'alfa corrente; altrimenti inizia da 0 (fade in) o 1 (fade out) |

**Esempio:**

```c
ref WidgetFadeTimer m_FadeTimer;
Widget m_NotificationPanel;

void ShowNotification()
{
    m_NotificationPanel.Show(true);
    m_FadeTimer = new WidgetFadeTimer;
    m_FadeTimer.FadeIn(m_NotificationPanel, 0.3);

    // Nascondi automaticamente dopo 5 secondi
    GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(this.HideNotification, 5000, false);
}

void HideNotification()
{
    m_FadeTimer.FadeOut(m_NotificationPanel, 0.5);
}
```

---

## GetRemainingTime (CallQueue)

La `ScriptCallQueue` fornisce anche un modo per interrogare quanto tempo rimane su un `CallLater` pianificato:

```c
float GetRemainingTime(Class obj, string fnName);
```

**Esempio:**

```c
// Ottieni quanto tempo rimane su un CallLater
float remaining = GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).GetRemainingTime(this, "MyCallback");
if (remaining > 0)
    Print(string.Format("La callback si attiva tra %1 ms", remaining));
```

---

## Pattern Comuni

### Accumulatore Timer (OnUpdate Rallentato)

Quando hai una callback per-frame ma vuoi eseguire la logica a una frequenza più lenta:

```c
class MyModule
{
    protected float m_UpdateAccumulator;
    protected const float UPDATE_INTERVAL = 2.0;  // Ogni 2 secondi

    void OnUpdate(float timeslice)
    {
        m_UpdateAccumulator += timeslice;
        if (m_UpdateAccumulator < UPDATE_INTERVAL)
            return;
        m_UpdateAccumulator = 0;

        // Logica rallentata qui
        DoPeriodicWork();
    }
}
```

### Pattern di Pulizia

Rimuovi sempre le chiamate pianificate quando il tuo oggetto viene distrutto per prevenire crash:

```c
class MyManager
{
    void MyManager()
    {
        GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.Tick, 1000, true);
    }

    void ~MyManager()
    {
        GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).Remove(this.Tick);
    }

    void Tick()
    {
        // Lavoro periodico
    }
}
```

### Init Ritardato a Colpo Singolo

Un pattern comune per inizializzare sistemi dopo che il mondo è completamente caricato:

```c
void OnMissionStart()
{
    // Ritarda l'init di 1 secondo per assicurarsi che tutto sia caricato
    GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(this.DelayedInit, 1000, false);
}

void DelayedInit()
{
    // Sicuro accedere agli oggetti del mondo ora
}
```

---

## Riepilogo

| Meccanismo | Caso d'Uso | Unità di Tempo |
|------------|------------|----------------|
| `CallLater` | Chiamate differite a colpo singolo o ripetute | Millisecondi |
| `Call` | Esegui al frame successivo | N/A (immediato) |
| `Timer` | Timer basato su classe con start/stop/rimanente | Secondi |
| `ScriptInvoker` | Evento/delegato (pattern observer) | N/A (invocazione manuale) |
| `WidgetFadeTimer` | Dissolvenza widget in entrata/uscita | Secondi |
| `GetUpdateQueue()` | Registrazione callback per-frame | N/A (ogni frame) |

| Concetto | Punto Chiave |
|----------|-------------|
| Categorie | `CALL_CATEGORY_SYSTEM` (0), `GUI` (1), `GAMEPLAY` (2) |
| Rimuovere chiamate | Sempre `Remove()` nel distruttore per prevenire riferimenti pendenti |
| Timer vs CallLater | Timer è in secondi + basato su classe; CallLater è in millisecondi + funzionale |
| ScriptInvoker | Insert/Remove callback, Invoke per attivare tutte |

---

## Buone Pratiche

- **Fai sempre `Remove()` delle chiamate `CallLater` pianificate nel tuo distruttore.** Se l'oggetto proprietario viene distrutto mentre un `CallLater` è ancora in sospeso, il motore chiamerà un metodo su un oggetto eliminato e andrà in crash. Ogni `CallLater` deve avere un `Remove()` corrispondente nel distruttore.
- **Usa `Timer` (secondi) per timer a lunga durata con pausa/ripresa, `CallLater` (millisecondi) per ritardi usa-e-getta.** Confonderli porta a bug di temporizzazione fuori di 1000x poiché `Timer.Run()` usa secondi ma `CallLater` usa millisecondi.
- **Rallenta `OnUpdate` con un accumulatore timer invece di registrare un `CallLater` ripetuto.** Un `CallLater` con repeat crea una voce tracciata separata nella coda, mentre un pattern accumulatore (`m_Acc += timeslice; if (m_Acc >= INTERVAL)`) ha zero sovraccarico ed è più facile da calibrare.
- **Annulla l'iscrizione delle callback di `ScriptInvoker` prima che il listener venga distrutto.** Dimenticare di chiamare `Remove()` su uno `ScriptInvoker` lascia un riferimento a funzione pendente che va in crash quando `Invoke()` viene attivato.
- **Non chiamare mai `Tick()` manualmente su `ScriptCallQueue`.** Il motore lo chiama automaticamente ogni frame. Chiamate manuali raddoppiano l'attivazione di tutte le callback in sospeso.

---

## Compatibilità e Impatto

> **Compatibilità Mod:** I sistemi timer sono per-istanza, quindi le mod raramente entrano in conflitto direttamente sui timer. Il rischio è negli eventi `ScriptInvoker` condivisi dove più mod registrano callback.

- **Ordine di Caricamento:** I sistemi Timer e CallQueue sono indipendenti dall'ordine di caricamento. Ogni mod gestisce i propri timer.
- **Conflitti di Classi Moddate:** Nessun conflitto diretto, ma se due mod fanno entrambe l'override di `OnUpdate()` sulla stessa classe (es. `MissionServer`) e una dimentica `super`, i timer basati su accumulatore dell'altra smettono di funzionare.
- **Impatto sulle Prestazioni:** Ogni `CallLater` attivo con `repeat = true` viene controllato ogni frame. Centinaia di chiamate ripetute degradano il tick rate del server. Preferisci meno timer con intervalli più lunghi, o usa il pattern accumulatore in `OnUpdate`.
- **Server/Client:** `CallLater` e `Timer` funzionano su entrambi i lati. Usa `CALL_CATEGORY_GAMEPLAY` per logica di gioco, `CALL_CATEGORY_GUI` per aggiornamenti UI (solo client) e `CALL_CATEGORY_SYSTEM` per operazioni di basso livello.

---

## Osservato nelle Mod Reali

> Questi pattern sono stati confermati studiando il codice sorgente di mod DayZ professionali.

| Pattern | Mod | File/Posizione |
|---------|-----|---------------|
| Pulizia `Remove()` nel distruttore per ogni registrazione `CallLater` | COT | Ciclo di vita del module manager |
| Event bus `ScriptInvoker` per notifiche cross-modulo | Expansion | `ExpansionEventBus` |
| `Timer` con `Pause()`/`Continue()` per conto alla rovescia logout | Vanilla | Sistema logout `MissionServer` |
| Pattern accumulatore in `OnUpdate` per controlli periodici ogni 5 secondi | Dabs Framework | Pianificazione tick dei moduli |

---

[<< Precedente: Notifiche](06-notifications.md) | **Timer e CallQueue** | [Successivo: I/O File e JSON >>](08-file-io.md)
