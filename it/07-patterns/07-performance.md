# Capitolo 7.7: Ottimizzazione delle Prestazioni

[Home](../README.md) | [<< Precedente: Architettura Event-Driven](06-events.md) | **Ottimizzazione delle Prestazioni**

---

## Introduzione

DayZ gira a 10--60 FPS server a seconda del numero di giocatori, del carico di entità e della complessità dei mod. Ogni ciclo di script che impiega troppo tempo erode quel budget di frame. Un singolo `OnUpdate` scritto male che scansiona ogni veicolo sulla mappa o ricostruisce una lista UI da zero può ridurre notevolmente le prestazioni del server. I mod professionali si guadagnano la reputazione girando veloci --- non avendo più funzionalità, ma implementando le stesse funzionalità con meno spreco.

Questo capitolo copre i pattern di ottimizzazione collaudati usati da COT, VPP, Expansion e Dabs Framework. Queste non sono ottimizzazioni premature --- sono pratiche ingegneristiche standard che ogni modder di DayZ dovrebbe conoscere fin dall'inizio.

---

## Indice dei Contenuti

- [Caricamento Lazy ed Elaborazione a Batch](#caricamento-lazy-ed-elaborazione-a-batch)
- [Widget Pooling](#widget-pooling)
- [Debouncing della Ricerca](#debouncing-della-ricerca)
- [Limitazione della Frequenza di Aggiornamento](#limitazione-della-frequenza-di-aggiornamento)
- [Caching](#caching)
- [Pattern Registro Veicoli](#pattern-registro-veicoli)
- [Scelta dell'Algoritmo di Ordinamento](#scelta-dellalgoritmo-di-ordinamento)
- [Cose da Evitare](#cose-da-evitare)
- [Profiling](#profiling)
- [Checklist](#checklist)

---

## Caricamento Lazy ed Elaborazione a Batch

L'ottimizzazione con il maggiore impatto nel modding di DayZ è **non fare lavoro finché non è necessario** e **distribuire il lavoro su più frame** quando deve essere fatto.

### Caricamento Lazy

Non pre-calcolare o pre-caricare mai dati di cui l'utente potrebbe non aver bisogno:

```c
class ItemDatabase
{
    protected ref map<string, ref ItemData> m_Cache;
    protected bool m_Loaded;

    // SBAGLIATO: Carica tutto all'avvio
    void OnInit()
    {
        LoadAllItems();  // 5000 oggetti, 200ms di stallo all'avvio
    }

    // CORRETTO: Carica al primo accesso
    ItemData GetItem(string className)
    {
        if (!m_Loaded)
        {
            LoadAllItems();
            m_Loaded = true;
        }

        ItemData data;
        m_Cache.Find(className, data);
        return data;
    }
};
```

### Elaborazione a Batch (N Elementi per Frame)

Quando devi elaborare una collezione grande, elabora un batch fisso per frame invece dell'intera collezione in una volta:

```c
class LootCleanup : MyServerModule
{
    protected ref array<Object> m_DirtyItems;
    protected int m_ProcessIndex;

    static const int BATCH_SIZE = 50;  // Elabora 50 elementi per frame

    override void OnUpdate(float dt)
    {
        if (!m_DirtyItems || m_DirtyItems.Count() == 0) return;

        int processed = 0;
        while (m_ProcessIndex < m_DirtyItems.Count() && processed < BATCH_SIZE)
        {
            Object item = m_DirtyItems[m_ProcessIndex];
            if (item)
            {
                ProcessItem(item);
            }
            m_ProcessIndex++;
            processed++;
        }

        // Reset quando finito
        if (m_ProcessIndex >= m_DirtyItems.Count())
        {
            m_DirtyItems.Clear();
            m_ProcessIndex = 0;
        }
    }

    void ProcessItem(Object item) { ... }
};
```

### Perché 50?

La dimensione del batch dipende da quanto è costoso elaborare ogni elemento. Per operazioni leggere (controlli null, lettura posizioni), 100--200 per frame vanno bene. Per operazioni pesanti (spawn di entità, query di pathfinding, I/O su file), 5--10 per frame potrebbe essere il limite. Inizia con 50 e regola in base all'impatto osservato sul tempo del frame.

---

## Widget Pooling

Creare e distruggere widget UI è costoso. Il motore deve allocare memoria, costruire l'albero dei widget, applicare gli stili e calcolare il layout. Se hai una lista scrollabile con 500 voci, creare 500 widget, distruggerli e crearne 500 nuovi ogni volta che la lista si aggiorna è un calo di frame garantito.

### Il Problema

```c
// SBAGLIATO: Distruggi e ricrea ad ogni aggiornamento
void RefreshPlayerList(array<string> players)
{
    // Distruggi tutti i widget esistenti
    Widget child = m_ListPanel.GetChildren();
    while (child)
    {
        Widget next = child.GetSibling();
        child.Unlink();  // Distruggi
        child = next;
    }

    // Crea nuovi widget per ogni giocatore
    for (int i = 0; i < players.Count(); i++)
    {
        Widget row = GetGame().GetWorkspace().CreateWidgets("MyMod/layouts/PlayerRow.layout", m_ListPanel);
        TextWidget nameText = TextWidget.Cast(row.FindAnyWidget("NameText"));
        nameText.SetText(players[i]);
    }
}
```

### Il Pattern Pool

Pre-crea un pool di righe widget. Quando aggiorni, riutilizza le righe esistenti. Mostra le righe che hanno dati; nascondi le righe che non ne hanno.

```c
class WidgetPool
{
    protected ref array<Widget> m_Pool;
    protected Widget m_Parent;
    protected string m_LayoutPath;
    protected int m_ActiveCount;

    void WidgetPool(Widget parent, string layoutPath, int initialSize)
    {
        m_Parent = parent;
        m_LayoutPath = layoutPath;
        m_Pool = new array<Widget>();
        m_ActiveCount = 0;

        // Pre-crea il pool
        for (int i = 0; i < initialSize; i++)
        {
            Widget w = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
            w.Show(false);
            m_Pool.Insert(w);
        }
    }

    // Ottieni un widget dal pool, creandone di nuovi se necessario
    Widget Acquire()
    {
        if (m_ActiveCount < m_Pool.Count())
        {
            Widget w = m_Pool[m_ActiveCount];
            w.Show(true);
            m_ActiveCount++;
            return w;
        }

        // Pool esaurito — espandilo
        Widget newWidget = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
        m_Pool.Insert(newWidget);
        m_ActiveCount++;
        return newWidget;
    }

    // Nascondi tutti i widget attivi (ma non distruggerli)
    void ReleaseAll()
    {
        for (int i = 0; i < m_ActiveCount; i++)
        {
            m_Pool[i].Show(false);
        }
        m_ActiveCount = 0;
    }

    // Distruggi l'intero pool (chiama alla pulizia)
    void Destroy()
    {
        for (int i = 0; i < m_Pool.Count(); i++)
        {
            if (m_Pool[i]) m_Pool[i].Unlink();
        }
        m_Pool.Clear();
        m_ActiveCount = 0;
    }
};
```

### Utilizzo

```c
void RefreshPlayerList(array<string> players)
{
    m_WidgetPool.ReleaseAll();  // Nascondi tutti — nessuna distruzione

    for (int i = 0; i < players.Count(); i++)
    {
        Widget row = m_WidgetPool.Acquire();  // Riutilizza o crea
        TextWidget nameText = TextWidget.Cast(row.FindAnyWidget("NameText"));
        nameText.SetText(players[i]);
    }
}
```

La prima chiamata a `RefreshPlayerList` crea i widget. Ogni chiamata successiva li riutilizza. Nessuna distruzione, nessuna ri-creazione, nessun calo di frame.

---

## Debouncing della Ricerca

Quando un utente digita in una casella di ricerca, l'evento `OnChange` si attiva ad ogni tasto premuto. Ricostruire una lista filtrata ad ogni tasto è uno spreco --- l'utente sta ancora digitando. Ritarda invece la ricerca finché l'utente non fa una pausa.

### Il Pattern Debounce

```c
class SearchableList
{
    protected const float DEBOUNCE_DELAY = 0.15;  // 150ms
    protected float m_SearchTimer;
    protected bool m_SearchPending;
    protected string m_PendingQuery;

    // Chiamato ad ogni tasto premuto
    void OnSearchTextChanged(string text)
    {
        m_PendingQuery = text;
        m_SearchPending = true;
        m_SearchTimer = 0;  // Resetta il timer ad ogni tasto
    }

    // Chiamato ogni frame da OnUpdate
    void Tick(float dt)
    {
        if (!m_SearchPending) return;

        m_SearchTimer += dt;
        if (m_SearchTimer >= DEBOUNCE_DELAY)
        {
            m_SearchPending = false;
            ExecuteSearch(m_PendingQuery);
        }
    }

    void ExecuteSearch(string query)
    {
        // Ora esegui il filtraggio effettivo
        // Questo viene eseguito una volta dopo che l'utente smette di digitare, non ad ogni tasto
    }
};
```

### Perché 150ms?

150ms è un buon valore predefinito. È abbastanza lungo perché la maggior parte dei tasti durante la digitazione continua vengano raggruppati in una singola ricerca, ma abbastanza breve perché la UI risulti reattiva. Regola se la tua ricerca è particolarmente costosa (ritardo più lungo) o se i tuoi utenti si aspettano feedback istantaneo (ritardo più breve).

---

## Limitazione della Frequenza di Aggiornamento

Non tutto deve essere eseguito ogni frame. Molti sistemi possono aggiornarsi a una frequenza inferiore senza alcun impatto percepibile.

### Throttling Basato su Timer

```c
class EntityScanner : MyServerModule
{
    protected const float SCAN_INTERVAL = 5.0;  // Ogni 5 secondi
    protected float m_ScanTimer;

    override void OnUpdate(float dt)
    {
        m_ScanTimer += dt;
        if (m_ScanTimer < SCAN_INTERVAL) return;
        m_ScanTimer = 0;

        // La scansione costosa viene eseguita ogni 5 secondi, non ogni frame
        ScanEntities();
    }
};
```

### Throttling per Conteggio Frame

Per operazioni che dovrebbero essere eseguite ogni N frame:

```c
class PositionSync
{
    protected int m_FrameCounter;
    protected const int SYNC_EVERY_N_FRAMES = 10;  // Ogni decimo frame

    void OnUpdate(float dt)
    {
        m_FrameCounter++;
        if (m_FrameCounter % SYNC_EVERY_N_FRAMES != 0) return;

        SyncPositions();
    }
};
```

### Elaborazione Sfalsata

Quando più sistemi necessitano di aggiornamenti periodici, sfasa i loro timer in modo che non si attivino tutti nello stesso frame:

```c
// SBAGLIATO: Tutti e tre si attivano a t=5.0, t=10.0, t=15.0 — picco di frame
m_LootTimer   = 5.0;
m_VehicleTimer = 5.0;
m_WeatherTimer = 5.0;

// CORRETTO: Sfalsati — il lavoro è distribuito
m_LootTimer    = 5.0;
m_VehicleTimer = 5.0 + 1.6;  // Si attiva ~1.6s dopo il loot
m_WeatherTimer = 5.0 + 3.3;  // Si attiva ~3.3s dopo il loot
```

Oppure avvia i timer a offset diversi:

```c
m_LootTimer    = 0;
m_VehicleTimer = 1.6;
m_WeatherTimer = 3.3;
```

---

## Caching

Le ricerche ripetute degli stessi dati sono un comune drenaggio di prestazioni. Memorizza i risultati nella cache.

### Cache della Scansione CfgVehicles

Scansionare `CfgVehicles` (il database globale di configurazione di tutte le classi oggetto/veicolo) è costoso. Comporta l'iterazione di migliaia di voci di configurazione. Non farlo mai più di una volta:

```c
class WeaponRegistry
{
    private static ref array<string> s_AllWeapons;

    // Costruisci una volta, usa per sempre
    static array<string> GetAllWeapons()
    {
        if (s_AllWeapons) return s_AllWeapons;

        s_AllWeapons = new array<string>();

        int cfgCount = GetGame().ConfigGetChildrenCount("CfgVehicles");
        string className;
        for (int i = 0; i < cfgCount; i++)
        {
            GetGame().ConfigGetChildName("CfgVehicles", i, className);
            if (GetGame().IsKindOf(className, "Weapon_Base"))
            {
                s_AllWeapons.Insert(className);
            }
        }

        return s_AllWeapons;
    }

    static void Cleanup()
    {
        s_AllWeapons = null;
    }
};
```

### Cache delle Operazioni su Stringhe

Se calcoli la stessa trasformazione di stringa ripetutamente (es. conversione in minuscolo per ricerca case-insensitive), memorizza il risultato nella cache:

```c
class ItemEntry
{
    string DisplayName;
    string SearchName;  // Minuscolo pre-calcolato per la corrispondenza nella ricerca

    void ItemEntry(string displayName)
    {
        DisplayName = displayName;
        SearchName = displayName;
        SearchName.ToLower();  // Calcola una volta
    }
};
```

### Cache della Posizione

Se controlli frequentemente "il giocatore è vicino a X?", memorizza la posizione del giocatore nella cache e aggiornala periodicamente invece di chiamare `GetPosition()` ad ogni controllo:

```c
class ProximityChecker
{
    protected vector m_CachedPosition;
    protected float m_PositionAge;

    vector GetCachedPosition(EntityAI entity, float dt)
    {
        m_PositionAge += dt;
        if (m_PositionAge > 1.0)  // Aggiorna ogni secondo
        {
            m_CachedPosition = entity.GetPosition();
            m_PositionAge = 0;
        }
        return m_CachedPosition;
    }
};
```

---

## Pattern Registro Veicoli

Un'esigenza comune è tracciare tutti i veicoli (o tutte le entità di un tipo specifico) sulla mappa. L'approccio ingenuo è chiamare `GetGame().GetObjectsAtPosition3D()` con un raggio enorme. Questo è catastroficamente costoso.

### Sbagliato: Scansione del Mondo

```c
// TERRIBILE: Scansiona ogni oggetto in un raggio di 50km ogni frame
void FindAllVehicles()
{
    array<Object> objects = new array<Object>();
    GetGame().GetObjectsAtPosition3D(Vector(7500, 0, 7500), 50000, objects);

    foreach (Object obj : objects)
    {
        CarScript car = CarScript.Cast(obj);
        if (car) { ... }
    }
}
```

### Corretto: Registro Basato su Registrazione

Traccia le entità quando vengono create e distrutte:

```c
class VehicleRegistry
{
    private static ref array<CarScript> s_Vehicles = new array<CarScript>();

    static void Register(CarScript vehicle)
    {
        if (vehicle && s_Vehicles.Find(vehicle) == -1)
        {
            s_Vehicles.Insert(vehicle);
        }
    }

    static void Unregister(CarScript vehicle)
    {
        int idx = s_Vehicles.Find(vehicle);
        if (idx >= 0) s_Vehicles.Remove(idx);
    }

    static array<CarScript> GetAll()
    {
        return s_Vehicles;
    }

    static void Cleanup()
    {
        s_Vehicles.Clear();
    }
};

// Hook nella costruzione/distruzione dei veicoli:
modded class CarScript
{
    override void EEInit()
    {
        super.EEInit();
        if (GetGame().IsServer())
        {
            VehicleRegistry.Register(this);
        }
    }

    override void EEDelete(EntityAI parent)
    {
        if (GetGame().IsServer())
        {
            VehicleRegistry.Unregister(this);
        }
        super.EEDelete(parent);
    }
};
```

Ora `VehicleRegistry.GetAll()` restituisce tutti i veicoli istantaneamente --- nessuna scansione del mondo necessaria.

### Pattern Lista Collegata di Expansion

Expansion porta questo oltre con una lista doppiamente collegata sulla classe entità stessa, evitando il costo delle operazioni su array:

```c
// Pattern di Expansion (concettuale):
class ExpansionVehicle
{
    ExpansionVehicle m_Next;
    ExpansionVehicle m_Prev;

    static ExpansionVehicle s_Head;

    void Register()
    {
        m_Next = s_Head;
        if (s_Head) s_Head.m_Prev = this;
        s_Head = this;
    }

    void Unregister()
    {
        if (m_Prev) m_Prev.m_Next = m_Next;
        if (m_Next) m_Next.m_Prev = m_Prev;
        if (s_Head == this) s_Head = m_Next;
        m_Next = null;
        m_Prev = null;
    }
};
```

Questo fornisce inserimento e rimozione O(1) con zero allocazione di memoria per operazione. L'iterazione è un semplice attraversamento dei puntatori da `s_Head`.

---

## Scelta dell'Algoritmo di Ordinamento

Gli array di Enforce Script hanno un metodo `.Sort()` integrato, ma funziona solo per tipi base e usa il confronto predefinito. Per ordinamenti personalizzati, serve una funzione di confronto.

### Ordinamento Integrato

```c
array<int> numbers = {5, 2, 8, 1, 9, 3};
numbers.Sort();  // {1, 2, 3, 5, 8, 9}

array<string> names = {"Charlie", "Alice", "Bob"};
names.Sort();  // {"Alice", "Bob", "Charlie"} — lessicografico
```

### Ordinamento Personalizzato con Confronto

Per ordinare array di oggetti per un campo specifico, implementa il tuo ordinamento. L'insertion sort va bene per array piccoli (sotto ~100 elementi); per array più grandi, il quicksort ha prestazioni migliori.

```c
// Semplice insertion sort — buono per array piccoli
void SortPlayersByScore(array<ref PlayerData> players)
{
    for (int i = 1; i < players.Count(); i++)
    {
        ref PlayerData key = players[i];
        int j = i - 1;

        while (j >= 0 && players[j].Score < key.Score)
        {
            players[j + 1] = players[j];
            j--;
        }
        players[j + 1] = key;
    }
}
```

### Evitare l'Ordinamento per Frame

Se una lista ordinata è visualizzata nella UI, ordinala una volta quando i dati cambiano, non ogni frame:

```c
// SBAGLIATO: Ordina ogni frame
void OnUpdate(float dt)
{
    SortPlayersByScore(m_Players);
    RefreshUI();
}

// CORRETTO: Ordina solo quando i dati cambiano
void OnPlayerScoreChanged()
{
    SortPlayersByScore(m_Players);
    RefreshUI();
}
```

---

## Cose da Evitare

### 1. `GetObjectsAtPosition3D` con Raggio Enorme

Questa funzione scansiona ogni oggetto fisico nel mondo all'interno del raggio dato. A `50000` metri (l'intera mappa), itera ogni albero, roccia, edificio, oggetto, zombie e giocatore. Una singola chiamata può impiegare 50ms+.

```c
// NON FARLO MAI
GetGame().GetObjectsAtPosition3D(Vector(7500, 0, 7500), 50000, results);
```

Usa un registro basato su registrazione (vedi [Pattern Registro Veicoli](#pattern-registro-veicoli)).

### 2. Ricostruzione Completa della Lista ad Ogni Tasto

```c
// SBAGLIATO: Ricostruire 5000 righe widget ad ogni tasto
void OnSearchChanged(string text)
{
    DestroyAllRows();
    foreach (ItemData item : m_AllItems)
    {
        if (item.Name.Contains(text))
        {
            CreateWidgetRow(item);
        }
    }
}
```

Usa [debouncing della ricerca](#debouncing-della-ricerca) e [widget pooling](#widget-pooling).

### 3. Allocazioni di Stringhe per Frame

La concatenazione di stringhe crea nuovi oggetti stringa. In una funzione per-frame, questo genera spazzatura ogni frame:

```c
// SBAGLIATO: Due nuove allocazioni di stringhe per frame per entità
void OnUpdate(float dt)
{
    for (int i = 0; i < m_Entities.Count(); i++)
    {
        string label = "Entity_" + i.ToString();  // Nuova stringa ogni frame
        string info = label + " at " + m_Entities[i].GetPosition().ToString();  // Un'altra nuova stringa
    }
}
```

Se hai bisogno di stringhe formattate per logging o UI, fallo al cambio di stato, non per frame.

### 4. Controlli FileExist Ridondanti nei Loop

```c
// SBAGLIATO: Controllare FileExist per lo stesso percorso 500 volte
for (int i = 0; i < m_Players.Count(); i++)
{
    if (FileExist("$profile:MyMod/Config.json"))  // Stesso file, 500 controlli
    {
        // ...
    }
}

// CORRETTO: Controlla una volta
bool configExists = FileExist("$profile:MyMod/Config.json");
for (int i = 0; i < m_Players.Count(); i++)
{
    if (configExists)
    {
        // ...
    }
}
```

### 5. Chiamare GetGame() Ripetutamente

`GetGame()` è una chiamata a funzione globale. Nei loop intensi, memorizza il risultato nella cache:

```c
// Accettabile per uso occasionale
if (GetGame().IsServer()) { ... }

// In un loop intenso, memorizzalo nella cache:
CGame game = GetGame();
for (int i = 0; i < 1000; i++)
{
    if (game.IsServer()) { ... }
}
```

### 6. Spawn di Entità in un Loop Intenso

Lo spawn di entità è costoso (setup della fisica, replicazione di rete, ecc.). Non fare mai spawn di decine di entità in un singolo frame:

```c
// SBAGLIATO: 100 spawn di entità in un frame — picco di frame massiccio
for (int i = 0; i < 100; i++)
{
    GetGame().CreateObjectEx("Zombie", randomPos, ECE_PLACE_ON_SURFACE);
}
```

Usa l'elaborazione a batch: spawn 5 per frame su 20 frame.

---

## Profiling

### Monitoraggio degli FPS del Server

La metrica più basilare sono gli FPS del server. Se il tuo mod riduce gli FPS del server, qualcosa non va:

```c
// Nel tuo OnUpdate, misura il tempo trascorso:
void OnUpdate(float dt)
{
    float startTime = GetGame().GetTickTime();

    // ... la tua logica ...

    float elapsed = GetGame().GetTickTime() - startTime;
    if (elapsed > 0.005)  // Più di 5ms
    {
        MyLog.Warning("Perf", "OnUpdate took " + elapsed.ToString() + "s");
    }
}
```

### Indicatori nel Log degli Script

Osserva il log degli script del server DayZ per questi avvisi sulle prestazioni:

- `SCRIPT (W): Exceeded X ms` --- un'esecuzione di script ha superato il budget di tempo del motore
- Pause lunghe nei timestamp del log --- qualcosa ha bloccato il thread principale

### Test Empirici

L'unico modo affidabile per sapere se un'ottimizzazione è importante è misurare prima e dopo:

1. Aggiungi timing intorno al codice sospetto
2. Esegui un test riproducibile (es. 50 giocatori, 1000 entità)
3. Confronta i tempi dei frame
4. Se la differenza è inferiore a 1ms per frame, probabilmente non ha importanza

---

## Checklist

Prima di rilasciare codice sensibile alle prestazioni, verifica:

- [ ] Nessuna chiamata `GetObjectsAtPosition3D` con raggio > 100m nel codice per-frame
- [ ] Tutte le scansioni costose (CfgVehicles, ricerche di entità) sono memorizzate nella cache
- [ ] Le liste UI usano widget pooling, non distruzione/ri-creazione
- [ ] Gli input di ricerca usano debouncing (150ms+)
- [ ] Le operazioni OnUpdate sono limitate da timer o dimensione del batch
- [ ] Le collezioni grandi sono elaborate a batch (50 elementi/frame come default)
- [ ] Lo spawn di entità è distribuito su più frame, non fatto in un loop intenso
- [ ] La concatenazione di stringhe non viene fatta per-frame in loop intensi
- [ ] Le operazioni di ordinamento vengono eseguite al cambio dei dati, non per frame
- [ ] Più sistemi periodici hanno timer sfalsati
- [ ] Il tracciamento delle entità usa registrazione, non scansione del mondo

---

## Compatibilità e Impatto

- **Multi-Mod:** I costi delle prestazioni sono cumulativi. L'`OnUpdate` di ogni mod viene eseguito ogni frame. Cinque mod che impiegano ciascuno 2ms significano 10ms per frame solo dagli script. Coordinati con gli altri autori di mod per sfalsare i timer ed evitare scansioni del mondo duplicate.
- **Ordine di Caricamento:** L'ordine di caricamento non influisce direttamente sulle prestazioni. Tuttavia, se più mod fanno `modded class` della stessa entità (es. `CarScript.EEInit`), ogni override si aggiunge al costo della catena di chiamate. Mantieni gli override modded minimali.
- **Listen Server:** I listen server eseguono sia gli script client che server nello stesso processo. Widget pooling, aggiornamenti UI e costi di rendering si sommano ai tick lato server. I budget di prestazioni sono più stretti nei listen server rispetto ai server dedicati.
- **Prestazioni:** Il budget di frame del server DayZ a 60 FPS è ~16ms. A 20 FPS (comune nei server carichi), è ~50ms. Un singolo mod dovrebbe puntare a rimanere sotto i 2ms per frame. Profila con `GetGame().GetTickTime()` per verificare.
- **Migrazione:** I pattern di prestazione sono agnostici al motore e sopravvivono agli aggiornamenti delle versioni di DayZ. I costi specifici delle API (es. `GetObjectsAtPosition3D`) possono cambiare tra le versioni del motore, quindi ri-profila dopo aggiornamenti importanti di DayZ.

---

## Errori Comuni

| Errore | Impatto | Soluzione |
|---------|--------|-----|
| Ottimizzazione prematura (micro-ottimizzare codice che viene eseguito una volta all'avvio) | Tempo di sviluppo sprecato; nessun miglioramento misurabile; codice più difficile da leggere | Profila prima. Ottimizza solo codice che viene eseguito per-frame o elabora collezioni grandi. Il costo all'avvio viene pagato una volta. |
| Usare `GetObjectsAtPosition3D` con raggio a livello mappa in `OnUpdate` | Stallo di 50--200ms per chiamata, scansionando ogni oggetto fisico sulla mappa; gli FPS del server crollano a cifra singola | Usa un registro basato su registrazione (registra in `EEInit`, deregistra in `EEDelete`). Non scansionare mai il mondo per frame. |
| Ricostruire alberi di widget UI ad ogni cambio dei dati | Picchi di frame dalla creazione/distruzione dei widget; stuttering visibile per il giocatore | Usa widget pooling: nascondi/mostra i widget esistenti invece di distruggerli e ricrearli |
| Ordinare array grandi ogni frame | O(n log n) per frame per dati che cambiano raramente; spreco di CPU non necessario | Ordina una volta quando i dati cambiano (flag dirty), memorizza il risultato ordinato nella cache, ri-ordina solo alla mutazione |
| Eseguire I/O su file costoso (JsonSaveFile) ad ogni tick di `OnUpdate` | Le scritture su disco bloccano il thread principale; 5--20ms per salvataggio a seconda della dimensione del file | Usa timer di auto-save (300s default) con un flag dirty. Scrivi solo quando i dati sono effettivamente cambiati. |

---

## Teoria vs Pratica

| Il Manuale Dice | La Realtà di DayZ |
|---------------|-------------|
| Usa l'elaborazione asincrona per operazioni costose | Enforce Script è single-threaded senza primitive asincrone; distribuisci il lavoro su più frame usando l'elaborazione basata su indice |
| L'object pooling è un'ottimizzazione prematura | La creazione di widget è genuinamente costosa in Enfusion; il pooling è pratica standard in ogni mod importante (COT, VPP, Expansion) |
| Profila prima di ottimizzare | Corretto, ma alcuni pattern (scansioni del mondo, allocazione di stringhe per-frame, ricostruzioni per-tasto) sono *sempre* sbagliati in DayZ. Evitali fin dall'inizio. |

---

[<< Precedente: Architettura Event-Driven](06-events.md) | [Home](../../it/README.md)
