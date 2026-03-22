# Kapitel 6.7: Timer und CallQueue

[Startseite](../README.md) | [<< Zurück: Benachrichtigungen](06-notifications.md) | **Timer und CallQueue** | [Weiter: Datei-E/A und JSON >>](08-file-io.md)

---

## Einführung

DayZ bietet mehrere Mechanismen für verzögerte und wiederholende Funktionsaufrufe: `ScriptCallQueue` (das primäre System), `Timer`, `ScriptInvoker` und `WidgetFadeTimer`. Diese sind unverzichtbar für die Planung verzögerter Logik, die Erstellung von Update-Schleifen und die Verwaltung zeitgesteuerter Ereignisse, ohne den Haupt-Thread zu blockieren. Dieses Kapitel behandelt jeden Mechanismus mit vollständigen API-Signaturen und Nutzungsmustern.

---

## Aufrufkategorien

Alle Timer- und CallQueue-Systeme erfordern eine **Aufrufkategorie**, die bestimmt, wann der verzögerte Aufruf innerhalb des Frames ausgeführt wird:

```c
const int CALL_CATEGORY_SYSTEM   = 0;   // Operationen auf Systemebene
const int CALL_CATEGORY_GUI      = 1;   // UI-Updates
const int CALL_CATEGORY_GAMEPLAY = 2;   // Gameplay-Logik
const int CALL_CATEGORY_COUNT    = 3;   // Gesamtanzahl der Kategorien
```

Zugriff auf die Warteschlange einer Kategorie:

```c
ScriptCallQueue  queue   = GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY);
ScriptInvoker    updater = GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY);
TimerQueue       timers  = GetGame().GetTimerQueue(CALL_CATEGORY_GAMEPLAY);
```

---

## ScriptCallQueue

**Datei:** `3_Game/tools/utilityclasses.c`

Der primäre Mechanismus für verzögerte Funktionsaufrufe. Unterstützt einmalige Verzögerungen, wiederholende Aufrufe und sofortige Ausführung im nächsten Frame.

### CallLater

```c
void CallLater(func fn, int delay = 0, bool repeat = false,
               void param1 = NULL, void param2 = NULL,
               void param3 = NULL, void param4 = NULL);
```

| Parameter | Beschreibung |
|-----------|--------------|
| `fn` | Die aufzurufende Funktion (Methodenreferenz: `this.MyMethod`) |
| `delay` | Verzögerung in Millisekunden (0 = nächster Frame) |
| `repeat` | `true` = wiederholter Aufruf im `delay`-Intervall; `false` = einmaliger Aufruf |
| `param1..4` | Optionale Parameter, die an die Funktion übergeben werden |

**Beispiel --- einmaliger verzögerter Aufruf:**

```c
// MyFunction einmal nach 5 Sekunden aufrufen
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.MyFunction, 5000, false);
```

**Beispiel --- wiederholender Aufruf:**

```c
// UpdateLoop jede Sekunde aufrufen, wiederholend
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.UpdateLoop, 1000, true);
```

**Beispiel --- mit Parametern:**

```c
void ShowMessage(string text, int color)
{
    Print(text);
}

// Mit Parametern nach 2 Sekunden aufrufen
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(
    this.ShowMessage, 2000, false, "Hallo!", ARGB(255, 255, 0, 0)
);
```

### Call

```c
void Call(func fn, void param1 = NULL, void param2 = NULL,
          void param3 = NULL, void param4 = NULL);
```

Führt die Funktion im nächsten Frame aus (delay = 0, keine Wiederholung). Kurzform für `CallLater(fn, 0, false)`.

**Beispiel:**

```c
// Im nächsten Frame ausführen
GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).Call(this.Initialize);
```

### CallByName

```c
void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false,
                Param par = null);
```

Ruft eine Methode über ihren String-Namen auf. Nützlich, wenn die Methodenreferenz nicht direkt verfügbar ist.

**Beispiel:**

```c
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallByName(
    myObject, "OnTimerExpired", 3000, false
);
```

### Remove

```c
void Remove(func fn);
```

Entfernt einen geplanten Aufruf. Unverzichtbar zum Stoppen wiederholender Aufrufe und zur Verhinderung von Aufrufen auf zerstörten Objekten.

**Beispiel:**

```c
// Einen wiederholenden Aufruf stoppen
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).Remove(this.UpdateLoop);
```

### RemoveByName

```c
void RemoveByName(Class obj, string fnName);
```

Entfernt einen über `CallByName` geplanten Aufruf.

### Tick

```c
void Tick(float timeslice);
```

Wird intern von der Engine jeden Frame aufgerufen. Sie sollten dies niemals manuell aufrufen müssen.

---

## Timer

**Datei:** `3_Game/tools/utilityclasses.c`

Ein klassenbasierter Timer mit explizitem Start/Stopp-Lebenszyklus. Übersichtlicher für langlebige Timer, die pausiert oder neu gestartet werden müssen.

### Konstruktor

```c
void Timer(int category = CALL_CATEGORY_SYSTEM);
```

### Run

```c
void Run(float duration, Class obj, string fn_name, Param params = null, bool loop = false);
```

| Parameter | Beschreibung |
|-----------|--------------|
| `duration` | Zeit in Sekunden (nicht Millisekunden!) |
| `obj` | Das Objekt, dessen Methode aufgerufen wird |
| `fn_name` | Methodenname als String |
| `params` | Optionales `Param`-Objekt mit Parametern |
| `loop` | `true` = nach jeder Dauer wiederholen |

**Beispiel --- einmaliger Timer:**

```c
ref Timer m_Timer;

void StartTimer()
{
    m_Timer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_Timer.Run(5.0, this, "OnTimerComplete", null, false);
}

void OnTimerComplete()
{
    Print("Timer abgeschlossen!");
}
```

**Beispiel --- wiederholender Timer:**

```c
ref Timer m_UpdateTimer;

void StartUpdateLoop()
{
    m_UpdateTimer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_UpdateTimer.Run(1.0, this, "OnUpdate", null, true);  // Jede Sekunde
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

Stoppt den Timer. Kann mit einem weiteren `Run()`-Aufruf neu gestartet werden.

### IsRunning

```c
bool IsRunning();
```

Gibt `true` zurück, wenn der Timer aktuell aktiv ist.

### Pause

```c
void Pause();
```

Pausiert einen laufenden Timer unter Beibehaltung der verbleibenden Zeit. Der Timer kann mit `Continue()` fortgesetzt werden.

### Continue

```c
void Continue();
```

Setzt einen pausierten Timer an der Stelle fort, an der er gestoppt wurde.

### IsPaused

```c
bool IsPaused();
```

Gibt `true` zurück, wenn der Timer aktuell pausiert ist.

**Beispiel --- Pause und Fortsetzen:**

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

Gibt die verbleibende Zeit in Sekunden zurück.

### GetDuration

```c
float GetDuration();
```

Gibt die gesamte durch `Run()` gesetzte Dauer zurück.

---

## ScriptInvoker

**Datei:** `3_Game/tools/utilityclasses.c`

Ein Ereignis-/Delegaten-System. `ScriptInvoker` hält eine Liste von Callback-Funktionen und ruft alle auf, wenn `Invoke()` aufgerufen wird. Dies ist DayZ's Äquivalent zu C#-Events oder dem Beobachter-Muster.

### Insert

```c
void Insert(func fn);
```

Registriert eine Callback-Funktion.

### Remove

```c
void Remove(func fn);
```

Deregistriert eine Callback-Funktion.

### Invoke

```c
void Invoke(void param1 = NULL, void param2 = NULL,
            void param3 = NULL, void param4 = NULL);
```

Ruft alle registrierten Funktionen mit den übergebenen Parametern auf.

### Count

```c
int Count();
```

Anzahl der registrierten Callbacks.

### Clear

```c
void Clear();
```

Entfernt alle registrierten Callbacks.

**Beispiel --- benutzerdefiniertes Ereignissystem:**

```c
class MyModule
{
    ref ScriptInvoker m_OnMissionComplete = new ScriptInvoker();

    void CompleteMission()
    {
        // Abschlusslogik durchführen...

        // Alle Listener benachrichtigen
        m_OnMissionComplete.Invoke("MissionAlpha", 1500);
    }
}

class MyUI
{
    void Init(MyModule module)
    {
        // Ereignis abonnieren
        module.m_OnMissionComplete.Insert(this.OnMissionComplete);
    }

    void OnMissionComplete(string name, int reward)
    {
        Print(string.Format("Mission %1 abgeschlossen! Belohnung: %2", name, reward));
    }

    void Cleanup(MyModule module)
    {
        // Immer abmelden, um hängende Referenzen zu verhindern
        module.m_OnMissionComplete.Remove(this.OnMissionComplete);
    }
}
```

### Update-Warteschlange

Die Engine stellt Frame-weise `ScriptInvoker`-Warteschlangen bereit:

```c
ScriptInvoker updater = GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY);
updater.Insert(this.OnFrame);

// Entfernen wenn fertig
updater.Remove(this.OnFrame);
```

Funktionen, die in der Update-Warteschlange registriert sind, werden jeden Frame ohne Parameter aufgerufen. Dies ist nützlich für Frame-weise Logik ohne Verwendung von `EntityEvent.FRAME`.

---

## WidgetFadeTimer

**Datei:** `3_Game/tools/utilityclasses.c`

Ein spezialisierter Timer zum Ein- und Ausblenden von Widgets.

```c
class WidgetFadeTimer
{
    void FadeIn(Widget w, float time, bool continue_from_current = false);
    void FadeOut(Widget w, float time, bool continue_from_current = false);
    bool IsFading();
    void Stop();
}
```

| Parameter | Beschreibung |
|-----------|--------------|
| `w` | Das Widget zum Ein-/Ausblenden |
| `time` | Dauer der Blende in Sekunden |
| `continue_from_current` | Wenn `true`, vom aktuellen Alpha-Wert starten; sonst bei 0 (Einblenden) oder 1 (Ausblenden) beginnen |

**Beispiel:**

```c
ref WidgetFadeTimer m_FadeTimer;
Widget m_NotificationPanel;

void ShowNotification()
{
    m_NotificationPanel.Show(true);
    m_FadeTimer = new WidgetFadeTimer;
    m_FadeTimer.FadeIn(m_NotificationPanel, 0.3);

    // Nach 5 Sekunden automatisch ausblenden
    GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(this.HideNotification, 5000, false);
}

void HideNotification()
{
    m_FadeTimer.FadeOut(m_NotificationPanel, 0.5);
}
```

---

## GetRemainingTime (CallQueue)

Die `ScriptCallQueue` bietet auch eine Möglichkeit, die verbleibende Zeit eines geplanten `CallLater` abzufragen:

```c
float GetRemainingTime(Class obj, string fnName);
```

**Beispiel:**

```c
// Verbleibende Zeit eines CallLater abfragen
float remaining = GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).GetRemainingTime(this, "MyCallback");
if (remaining > 0)
    Print(string.Format("Callback feuert in %1 ms", remaining));
```

---

## Häufige Muster

### Timer-Akkumulator (Gedrosseltes OnUpdate)

Wenn Sie einen Frame-weisen Callback haben, die Logik aber langsamer ausführen möchten:

```c
class MyModule
{
    protected float m_UpdateAccumulator;
    protected const float UPDATE_INTERVAL = 2.0;  // Alle 2 Sekunden

    void OnUpdate(float timeslice)
    {
        m_UpdateAccumulator += timeslice;
        if (m_UpdateAccumulator < UPDATE_INTERVAL)
            return;
        m_UpdateAccumulator = 0;

        // Gedrosselte Logik hier
        DoPeriodicWork();
    }
}
```

### Aufräum-Muster

Entfernen Sie geplante Aufrufe immer, wenn Ihr Objekt zerstört wird, um Abstürze zu verhindern:

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
        // Periodische Arbeit
    }
}
```

### Einmaliges verzögertes Init

Ein häufiges Muster zum Initialisieren von Systemen, nachdem die Welt vollständig geladen ist:

```c
void OnMissionStart()
{
    // Init um 1 Sekunde verzögern, um sicherzustellen, dass alles geladen ist
    GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(this.DelayedInit, 1000, false);
}

void DelayedInit()
{
    // Sicherer Zugriff auf Weltobjekte möglich
}
```

---

## Zusammenfassung

| Mechanismus | Anwendungsfall | Zeiteinheit |
|-------------|----------------|-------------|
| `CallLater` | Einmalige oder wiederholende verzögerte Aufrufe | Millisekunden |
| `Call` | Im nächsten Frame ausführen | N/A (sofort) |
| `Timer` | Klassenbasierter Timer mit Start/Stopp/Verbleibend | Sekunden |
| `ScriptInvoker` | Ereignis/Delegat (Beobachter-Muster) | N/A (manueller Aufruf) |
| `WidgetFadeTimer` | Widget Ein-/Ausblenden | Sekunden |
| `GetUpdateQueue()` | Frame-weise Callback-Registrierung | N/A (jeden Frame) |

| Konzept | Kernpunkt |
|---------|-----------|
| Kategorien | `CALL_CATEGORY_SYSTEM` (0), `GUI` (1), `GAMEPLAY` (2) |
| Aufrufe entfernen | Immer `Remove()` im Destruktor, um hängende Referenzen zu verhindern |
| Timer vs CallLater | Timer ist Sekunden + klassenbasiert; CallLater ist Millisekunden + funktional |
| ScriptInvoker | Insert/Remove für Callbacks, Invoke zum Auslösen aller |

---

## Bewährte Praktiken

- **Entfernen Sie geplante `CallLater`-Aufrufe immer in Ihrem Destruktor mit `Remove()`.** Wenn das besitzende Objekt zerstört wird, während ein `CallLater` noch aussteht, ruft die Engine eine Methode auf einem gelöschten Objekt auf und stürzt ab. Jedes `CallLater` muss ein passendes `Remove()` im Destruktor haben.
- **Verwenden Sie `Timer` (Sekunden) für langlebige Timer mit Pause/Fortsetzung, `CallLater` (Millisekunden) für Fire-and-Forget-Verzögerungen.** Verwechslungen führen zu 1000-fachen Timing-Fehlern, da `Timer.Run()` Sekunden, aber `CallLater` Millisekunden verwendet.
- **Drosseln Sie `OnUpdate` mit einem Timer-Akkumulator anstatt ein wiederholendes `CallLater` zu registrieren.** Ein `CallLater` mit Wiederholung erstellt einen separaten verfolgten Eintrag in der Warteschlange, während ein Akkumulator-Muster (`m_Acc += timeslice; if (m_Acc >= INTERVAL)`) null Overhead hat und leichter anzupassen ist.
- **Melden Sie `ScriptInvoker`-Callbacks ab, bevor der Listener zerstört wird.** Vergessenes Aufrufen von `Remove()` auf einem `ScriptInvoker` hinterlässt eine hängende Funktionsreferenz, die beim Auslösen von `Invoke()` abstürzt.
- **Rufen Sie niemals `Tick()` manuell auf `ScriptCallQueue` auf.** Die Engine ruft es automatisch jeden Frame auf. Manuelle Aufrufe lösen alle ausstehenden Callbacks doppelt aus.

---

## Kompatibilität und Auswirkungen

> **Mod-Kompatibilität:** Timer-Systeme sind pro Instanz, daher kollidieren Mods selten direkt bei Timern. Das Risiko liegt bei gemeinsamen `ScriptInvoker`-Ereignissen, bei denen mehrere Mods Callbacks registrieren.

- **Ladereihenfolge:** Timer- und CallQueue-Systeme sind ladereihenfolge-unabhängig. Jede Mod verwaltet ihre eigenen Timer.
- **Modded-Class-Konflikte:** Keine direkten Konflikte, aber wenn zwei Mods beide `OnUpdate()` auf derselben Klasse (z.B. `MissionServer`) überschreiben und eine `super` vergisst, funktionieren die akkumulator-basierten Timer der anderen nicht mehr.
- **Leistungsauswirkung:** Jedes aktive `CallLater` mit `repeat = true` wird jeden Frame geprüft. Hunderte wiederholende Aufrufe verschlechtern die Server-Tickrate. Bevorzugen Sie weniger Timer mit längeren Intervallen, oder verwenden Sie das Akkumulator-Muster in `OnUpdate`.
- **Server/Client:** `CallLater` und `Timer` funktionieren auf beiden Seiten. Verwenden Sie `CALL_CATEGORY_GAMEPLAY` für Spiellogik, `CALL_CATEGORY_GUI` für UI-Updates (nur Client) und `CALL_CATEGORY_SYSTEM` für Low-Level-Operationen.

---

## In echten Mods beobachtet

> Diese Muster wurden durch das Studium des Quellcodes professioneller DayZ-Mods bestätigt.

| Muster | Mod | Datei/Ort |
|--------|-----|-----------|
| Destruktor-`Remove()`-Aufräumung für jede `CallLater`-Registrierung | COT | Modul-Manager-Lebenszyklus |
| `ScriptInvoker`-Ereignisbus für modulübergreifende Benachrichtigungen | Expansion | `ExpansionEventBus` |
| `Timer` mit `Pause()`/`Continue()` für Logout-Countdown | Vanilla | `MissionServer`-Logout-System |
| Akkumulator-Muster in `OnUpdate` für 5-Sekunden-Periodikprüfungen | Dabs Framework | Modul-Tick-Planung |

---

[<< Zurück: Benachrichtigungen](06-notifications.md) | **Timer und CallQueue** | [Weiter: Datei-E/A und JSON >>](08-file-io.md)
