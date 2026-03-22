# 6.7. fejezet: Időzítők és CallQueue

[Kezdőlap](../README.md) | [<< Előző: Értesítések](06-notifications.md) | **Időzítők és CallQueue** | [Következő: Fájl I/O és JSON >>](08-file-io.md)

---

## Bevezetés

A DayZ több mechanizmust biztosít a késleltetett és ismétlődő függvényhívásokhoz: `ScriptCallQueue` (az elsődleges rendszer), `Timer`, `ScriptInvoker` és `WidgetFadeTimer`. Ezek elengedhetetlenek a késleltetett logika ütemezéséhez, frissítési ciklusok létrehozásához és időzített események kezeléséhez a fő szál blokkolása nélkül. Ez a fejezet minden mechanizmust ismertet teljes API szignatúrákkal és használati mintákkal.

---

## Hívási kategóriák

Minden időzítő és hívási sor rendszer egy **hívási kategóriát** igényel, amely meghatározza, hogy a késleltetett hívás mikor hajtódik végre a képkockán belül:

```c
const int CALL_CATEGORY_SYSTEM   = 0;   // Rendszerszintű műveletek
const int CALL_CATEGORY_GUI      = 1;   // UI frissítések
const int CALL_CATEGORY_GAMEPLAY = 2;   // Játéklogika
const int CALL_CATEGORY_COUNT    = 3;   // Kategóriák összszáma
```

A sor elérése egy adott kategóriához:

```c
ScriptCallQueue  queue   = GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY);
ScriptInvoker    updater = GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY);
TimerQueue       timers  = GetGame().GetTimerQueue(CALL_CATEGORY_GAMEPLAY);
```

---

## ScriptCallQueue

**Fájl:** `3_Game/tools/utilityclasses.c`

Az elsődleges mechanizmus késleltetett függvényhívásokhoz. Támogatja az egyszeri késleltetéseket, ismétlődő hívásokat és azonnali következő-képkockás végrehajtást.

### CallLater

```c
void CallLater(func fn, int delay = 0, bool repeat = false,
               void param1 = NULL, void param2 = NULL,
               void param3 = NULL, void param4 = NULL);
```

| Paraméter | Leírás |
|-----------|-------------|
| `fn` | A meghívandó függvény (metódushivatkozás: `this.MyMethod`) |
| `delay` | Késleltetés milliszekundumban (0 = következő képkocka) |
| `repeat` | `true` = ismételt hívás `delay` időközönként; `false` = egyszeri hívás |
| `param1..4` | Opcionális paraméterek, amelyeket a függvénynek adunk át |

**Példa --- egyszeri késleltetés:**

```c
// MyFunction hívása egyszer 5 másodperc múlva
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.MyFunction, 5000, false);
```

**Példa --- ismétlődő hívás:**

```c
// UpdateLoop hívása minden 1 másodpercben, ismétlődően
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(this.UpdateLoop, 1000, true);
```

**Példa --- paraméterekkel:**

```c
void ShowMessage(string text, int color)
{
    Print(text);
}

// Hívás paraméterekkel 2 másodperc múlva
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallLater(
    this.ShowMessage, 2000, false, "Hello!", ARGB(255, 255, 0, 0)
);
```

### Call

```c
void Call(func fn, void param1 = NULL, void param2 = NULL,
          void param3 = NULL, void param4 = NULL);
```

A függvényt a következő képkockán hajtja végre (delay = 0, nincs ismétlés). Rövidítés a `CallLater(fn, 0, false)` helyett.

**Példa:**

```c
// Végrehajtás a következő képkockán
GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).Call(this.Initialize);
```

### CallByName

```c
void CallByName(Class obj, string fnName, int delay = 0, bool repeat = false,
                Param par = null);
```

Metódus hívása a string neve alapján. Hasznos, ha a metódushivatkozás nem érhető el közvetlenül.

**Példa:**

```c
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).CallByName(
    myObject, "OnTimerExpired", 3000, false
);
```

### Remove

```c
void Remove(func fn);
```

Egy ütemezett hívás eltávolítása. Elengedhetetlen az ismétlődő hívások leállításához és a megsemmisített objektumokon történő hívások megelőzéséhez.

**Példa:**

```c
// Ismétlődő hívás leállítása
GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).Remove(this.UpdateLoop);
```

### RemoveByName

```c
void RemoveByName(Class obj, string fnName);
```

A `CallByName`-mel ütemezett hívás eltávolítása.

### Tick

```c
void Tick(float timeslice);
```

A motor minden képkockában belsőleg hívja. Soha nem szabad manuálisan meghívnod.

---

## Timer

**Fájl:** `3_Game/tools/utilityclasses.c`

Osztályalapú időzítő explicit start/stop életciklussal. Tisztább megoldás hosszú életű időzítőkhöz, amelyeket szüneteltetni vagy újraindítani kell.

### Konstruktor

```c
void Timer(int category = CALL_CATEGORY_SYSTEM);
```

### Run

```c
void Run(float duration, Class obj, string fn_name, Param params = null, bool loop = false);
```

| Paraméter | Leírás |
|-----------|-------------|
| `duration` | Idő másodpercben (nem milliszekundumban!) |
| `obj` | Az objektum, amelynek a metódusa meghívásra kerül |
| `fn_name` | Metódusnév stringként |
| `params` | Opcionális `Param` objektum paraméterekkel |
| `loop` | `true` = ismétlés minden időtartam után |

**Példa --- egyszeri időzítő:**

```c
ref Timer m_Timer;

void StartTimer()
{
    m_Timer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_Timer.Run(5.0, this, "OnTimerComplete", null, false);
}

void OnTimerComplete()
{
    Print("Időzítő befejeződött!");
}
```

**Példa --- ismétlődő időzítő:**

```c
ref Timer m_UpdateTimer;

void StartUpdateLoop()
{
    m_UpdateTimer = new Timer(CALL_CATEGORY_GAMEPLAY);
    m_UpdateTimer.Run(1.0, this, "OnUpdate", null, true);  // Minden 1 másodpercben
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

Megállítja az időzítőt. Újraindítható egy újabb `Run()` hívással.

### IsRunning

```c
bool IsRunning();
```

`true`-t ad vissza, ha az időzítő jelenleg aktív.

### Pause

```c
void Pause();
```

Szünetelteti a futó időzítőt, megőrizve a hátralévő időt. Az időzítő a `Continue()`-val folytatható.

### Continue

```c
void Continue();
```

Folytatja a szüneteltetett időzítőt onnan, ahol megállt.

### IsPaused

```c
bool IsPaused();
```

`true`-t ad vissza, ha az időzítő jelenleg szünetel.

**Példa --- szüneteltetés és folytatás:**

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

A hátralévő időt adja vissza másodpercben.

### GetDuration

```c
float GetDuration();
```

A `Run()` által beállított teljes időtartamot adja vissza.

---

## ScriptInvoker

**Fájl:** `3_Game/tools/utilityclasses.c`

Egy esemény/delegált rendszer. A `ScriptInvoker` visszahívási függvények listáját tartja, és mindegyiket meghívja, amikor az `Invoke()` hívásra kerül. Ez a DayZ megfelelője a C# eseményeknek vagy a megfigyelő mintának.

### Insert

```c
void Insert(func fn);
```

Visszahívási függvény regisztrálása.

### Remove

```c
void Remove(func fn);
```

Visszahívási függvény regisztrációjának törlése.

### Invoke

```c
void Invoke(void param1 = NULL, void param2 = NULL,
            void param3 = NULL, void param4 = NULL);
```

Az összes regisztrált függvény hívása a megadott paraméterekkel.

### Count

```c
int Count();
```

A regisztrált visszahívások száma.

### Clear

```c
void Clear();
```

Az összes regisztrált visszahívás eltávolítása.

**Példa --- egyéni eseményrendszer:**

```c
class MyModule
{
    ref ScriptInvoker m_OnMissionComplete = new ScriptInvoker();

    void CompleteMission()
    {
        // Befejezési logika végrehajtása...

        // Összes figyelő értesítése
        m_OnMissionComplete.Invoke("MissionAlpha", 1500);
    }
}

class MyUI
{
    void Init(MyModule module)
    {
        // Feliratkozás az eseményre
        module.m_OnMissionComplete.Insert(this.OnMissionComplete);
    }

    void OnMissionComplete(string name, int reward)
    {
        Print(string.Format("Misszió %1 befejezve! Jutalom: %2", name, reward));
    }

    void Cleanup(MyModule module)
    {
        // Mindig iratkozz le a lógó hivatkozások megelőzése érdekében
        module.m_OnMissionComplete.Remove(this.OnMissionComplete);
    }
}
```

### Frissítési sor

A motor képkockánkénti `ScriptInvoker` sorokat biztosít:

```c
ScriptInvoker updater = GetGame().GetUpdateQueue(CALL_CATEGORY_GAMEPLAY);
updater.Insert(this.OnFrame);

// Eltávolítás, ha kész
updater.Remove(this.OnFrame);
```

A frissítési sorba regisztrált függvények minden képkockában meghívódnak paraméterek nélkül. Ez hasznos képkockánkénti logikához az `EntityEvent.FRAME` használata nélkül.

---

## WidgetFadeTimer

**Fájl:** `3_Game/tools/utilityclasses.c`

Speciális időzítő widgetek be- és kihalványításához.

```c
class WidgetFadeTimer
{
    void FadeIn(Widget w, float time, bool continue_from_current = false);
    void FadeOut(Widget w, float time, bool continue_from_current = false);
    bool IsFading();
    void Stop();
}
```

| Paraméter | Leírás |
|-----------|-------------|
| `w` | A halványítandó widget |
| `time` | A halványítás időtartama másodpercben |
| `continue_from_current` | Ha `true`, az aktuális alfa értéktől indul; egyébként 0-ról (behalványítás) vagy 1-ről (kihalványítás) |

**Példa:**

```c
ref WidgetFadeTimer m_FadeTimer;
Widget m_NotificationPanel;

void ShowNotification()
{
    m_NotificationPanel.Show(true);
    m_FadeTimer = new WidgetFadeTimer;
    m_FadeTimer.FadeIn(m_NotificationPanel, 0.3);

    // Automatikus elrejtés 5 másodperc múlva
    GetGame().GetCallQueue(CALL_CATEGORY_GUI).CallLater(this.HideNotification, 5000, false);
}

void HideNotification()
{
    m_FadeTimer.FadeOut(m_NotificationPanel, 0.5);
}
```

---

## GetRemainingTime (CallQueue)

A `ScriptCallQueue` lehetőséget biztosít arra is, hogy lekérdezd, mennyi idő van hátra egy ütemezett `CallLater`-ból:

```c
float GetRemainingTime(Class obj, string fnName);
```

**Példa:**

```c
// Mennyi idő van hátra egy CallLater-ből
float remaining = GetGame().GetCallQueue(CALL_CATEGORY_GAMEPLAY).GetRemainingTime(this, "MyCallback");
if (remaining > 0)
    Print(string.Format("A visszahívás %1 ms múlva fut le", remaining));
```

---

## Gyakori minták

### Időzítő akkumulátor (lassított OnUpdate)

Amikor képkockánkénti visszahívásod van, de lassabb ütemben szeretnéd futtatni a logikát:

```c
class MyModule
{
    protected float m_UpdateAccumulator;
    protected const float UPDATE_INTERVAL = 2.0;  // Minden 2 másodpercben

    void OnUpdate(float timeslice)
    {
        m_UpdateAccumulator += timeslice;
        if (m_UpdateAccumulator < UPDATE_INTERVAL)
            return;
        m_UpdateAccumulator = 0;

        // Lassított logika itt
        DoPeriodicWork();
    }
}
```

### Takarítási minta

Mindig távolítsd el az ütemezett hívásokat, amikor az objektumod megsemmisül, hogy megelőzd az összeomlásokat:

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
        // Periodikus munka
    }
}
```

### Egyszeri késleltetett inicializálás

Gyakori minta rendszerek inicializálásához a világ teljes betöltése után:

```c
void OnMissionStart()
{
    // Init késleltetése 1 másodperccel, hogy minden biztosan betöltődjön
    GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(this.DelayedInit, 1000, false);
}

void DelayedInit()
{
    // Biztonságosan hozzáférhetünk a világ objektumaihoz
}
```

---

## Összefoglalás

| Mechanizmus | Felhasználás | Időegység |
|-----------|----------|-----------|
| `CallLater` | Egyszeri vagy ismétlődő késleltetett hívások | Milliszekundum |
| `Call` | Végrehajtás a következő képkockán | N/A (azonnali) |
| `Timer` | Osztályalapú időzítő start/stop/hátralévő idővel | Másodperc |
| `ScriptInvoker` | Esemény/delegált (megfigyelő minta) | N/A (kézi hívás) |
| `WidgetFadeTimer` | Widget behalványítás/kihalványítás | Másodperc |
| `GetUpdateQueue()` | Képkockánkénti visszahívás regisztráció | N/A (minden képkocka) |

| Fogalom | Lényeg |
|---------|-----------|
| Kategóriák | `CALL_CATEGORY_SYSTEM` (0), `GUI` (1), `GAMEPLAY` (2) |
| Hívások eltávolítása | Mindig `Remove()` a destruktorban a lógó hivatkozások megelőzéséhez |
| Timer vs CallLater | Timer másodperc + osztályalapú; CallLater milliszekundum + funkcionális |
| ScriptInvoker | Insert/Remove visszahívások, Invoke az összes kiváltásához |

---

## Legjobb gyakorlatok

- **Mindig hívd meg a `Remove()`-ot az ütemezett `CallLater` hívásokra a destruktorodban.** Ha a tulajdonos objektum megsemmisül, miközben egy `CallLater` még függőben van, a motor egy törölt objektum metódusát hívja meg és összeomlik. Minden `CallLater`-nek kell egy megfelelő `Remove()` a destruktorban.
- **Használd a `Timer`-t (másodperc) hosszú életű időzítőkhöz szüneteltetéssel/folytatással, a `CallLater`-t (milliszekundum) tüzelj-és-felejtsd késleltetésekhez.** A kettő keverése 1000-szeres időzítési hibákhoz vezet, mivel a `Timer.Run()` másodpercet, de a `CallLater` milliszekundumot használ.
- **Lassítsd az `OnUpdate`-et időzítő akkumulátorral az ismétlődő `CallLater` regisztrálása helyett.** Az ismétlődő `CallLater` külön nyomon követett bejegyzést hoz létre a sorban, míg az akkumulátor minta (`m_Acc += timeslice; if (m_Acc >= INTERVAL)`) nulla terheléssel jár és könnyebben hangolható.
- **Iratkozz le a `ScriptInvoker` visszahívásokról, mielőtt a figyelő megsemmisül.** A `Remove()` elfelejtése egy `ScriptInvoker`-en lógó függvényhivatkozást hagy hátra, ami összeomlást okoz, amikor az `Invoke()` kiváltódik.
- **Soha ne hívd meg manuálisan a `Tick()`-et a `ScriptCallQueue`-n.** A motor automatikusan hívja minden képkockán. A manuális hívások duplán váltják ki az összes függőben lévő visszahívást.

---

## Kompatibilitás és hatás

> **Mod kompatibilitás:** Az időzítő rendszerek példányonkéntiák, így a modok ritkán ütköznek közvetlenül az időzítőkön. A kockázat a megosztott `ScriptInvoker` eseményeknél van, ahol több mod regisztrál visszahívásokat.

- **Betöltési sorrend:** Az időzítő és CallQueue rendszerek betöltési sorrendtől függetlenek. Minden mod kezeli a saját időzítőit.
- **Modolt osztály ütközések:** Nincs közvetlen ütközés, de ha két mod is felülírja az `OnUpdate()`-et ugyanazon az osztályon (pl. `MissionServer`) és az egyik elfelejti a `super`-t, a másik akkumulátor-alapú időzítői nem működnek.
- **Teljesítményhatás:** Minden aktív `CallLater` `repeat = true`-val minden képkockán ellenőrzésre kerül. Több száz ismétlődő hívás rontja a szerver frissítési rátáját. Előnyben részesítsd a kevesebb időzítőt hosszabb időközökkel, vagy használd az akkumulátor mintát az `OnUpdate`-ben.
- **Szerver/Kliens:** A `CallLater` és a `Timer` mindkét oldalon működik. Használd a `CALL_CATEGORY_GAMEPLAY`-t játéklogikához, a `CALL_CATEGORY_GUI`-t UI frissítésekhez (csak kliens), és a `CALL_CATEGORY_SYSTEM`-et alacsony szintű műveletekhez.

---

## Valós modokban megfigyelt minták

> Ezeket a mintákat professzionális DayZ modok forráskódjának tanulmányozásával igazoltuk.

| Minta | Mod | Fájl/Hely |
|---------|-----|---------------|
| Destruktor `Remove()` takarítás minden `CallLater` regisztrációhoz | COT | Modulkezelő életciklus |
| `ScriptInvoker` eseménybusz modulok közötti értesítésekhez | Expansion | `ExpansionEventBus` |
| `Timer` `Pause()`/`Continue()` használattal kilépési visszaszámláláshoz | Vanilla | `MissionServer` kilépési rendszer |
| Akkumulátor minta `OnUpdate`-ben 5 másodperces periodikus ellenőrzésekhez | Dabs Framework | Modul frissítés ütemezés |

---

[<< Előző: Értesítések](06-notifications.md) | **Időzítők és CallQueue** | [Következő: Fájl I/O és JSON >>](08-file-io.md)
