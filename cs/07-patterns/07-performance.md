# Chapter 7.7: Performance Optimization

[Domů](../README.md) | [<< Předchozí: Event-Driven Architecture](06-events.md) | **Performance Optimization**

---

## Úvod

DayZ runs at 10--60 server FPS depending on player count, entity load, and mod complexity. Every script cycle that takes příliš long eats into that frame budget. A jeden poorly-written `OnUpdate` that scans každý vehicle on the map or rebuilds a UI list od nuly can drop server performance noticeably. Professional mods earn their reputation by running fast --- not by having more features, but by implementing the stejný features with less waste.

This chapter covers the battle-tested optimization patterns used by COT, VPP, Expansion, and Dabs Framework. These are not premature optimizations --- they are standard engineering practices that každý DayZ modder should know from the start.

---

## Obsah

- [Lazy Loading and Batched Processing](#lazy-loading-and-batched-processing)
- [Widget Pooling](#widget-pooling)
- [Hledejte Debouncing](#search-debouncing)
- [Aktualizujte Rate Limiting](#update-rate-limiting)
- [Caching](#caching)
- [Vehicle Registry Pattern](#vehicle-registry-pattern)
- [Sort Algorithm Choice](#sort-algorithm-choice)
- [Things to Avoid](#things-to-avoid)
- [Profiling](#profiling)
- [Checklist](#checklist)

---

## Lazy Loading and Batched Processing

The většina impactful optimization in DayZ modding is **not doing work until it is needed** and **spreading work across více frames** when it must be done.

### Lazy Loading

Nikdy pre-compute or pre-load data that the user might not need:

```c
class ItemDatabase
{
    protected ref map<string, ref ItemData> m_Cache;
    protected bool m_Loaded;

    // BAD: Load everything at startup
    void OnInit()
    {
        LoadAllItems();  // 5000 items, 200ms stall on startup
    }

    // GOOD: Load on first access
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

### Batched Processing (N Items Per Frame)

When musíte process a large collection, process a fixed batch per frame místo the celý collection at once:

```c
class LootCleanup : MyServerModule
{
    protected ref array<Object> m_DirtyItems;
    protected int m_ProcessIndex;

    static const int BATCH_SIZE = 50;  // Process 50 items per frame

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

        // Reset when done
        if (m_ProcessIndex >= m_DirtyItems.Count())
        {
            m_DirtyItems.Clear();
            m_ProcessIndex = 0;
        }
    }

    void ProcessItem(Object item) { ... }
};
```

### Why 50?

The batch size depends on how expensive každý item is to process. For lightweight operations (null checks, position reads), 100--200 per frame is fine. For heavy operations (entity spawning, pathfinding queries, file I/O), 5--10 per frame may be the limit. Spusťte with 50 and adjust based on observed frame time impact.

---

## Widget Pooling

Creating and destroying UI widgets is expensive. Engine must allocate memory, build the widget tree, apply styles, and calculate layout. Pokud have a scrollable list with 500 entries, creating 500 widgets, destroying them, and creating 500 nový ones každý time the list refreshes is a guaranteed frame drop.

### The Problem

```c
// BAD: Destroy and recreate on every refresh
void RefreshPlayerList(array<string> players)
{
    // Destroy all existing widgets
    Widget child = m_ListPanel.GetChildren();
    while (child)
    {
        Widget next = child.GetSibling();
        child.Unlink();  // Destroy
        child = next;
    }

    // Create new widgets for every player
    for (int i = 0; i < players.Count(); i++)
    {
        Widget row = GetGame().GetWorkspace().CreateWidgets("MyMod/layouts/PlayerRow.layout", m_ListPanel);
        TextWidget nameText = TextWidget.Cast(row.FindAnyWidget("NameText"));
        nameText.SetText(players[i]);
    }
}
```

### The Pool Pattern

Pre-create a pool of widget rows. When refreshing, reuse existing rows. Show rows that have data; hide rows that ne.

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

        // Pre-create the pool
        for (int i = 0; i < initialSize; i++)
        {
            Widget w = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
            w.Show(false);
            m_Pool.Insert(w);
        }
    }

    // Get a widget from the pool, creating new ones if needed
    Widget Acquire()
    {
        if (m_ActiveCount < m_Pool.Count())
        {
            Widget w = m_Pool[m_ActiveCount];
            w.Show(true);
            m_ActiveCount++;
            return w;
        }

        // Pool exhausted — grow it
        Widget newWidget = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
        m_Pool.Insert(newWidget);
        m_ActiveCount++;
        return newWidget;
    }

    // Hide all active widgets (but do not destroy them)
    void ReleaseAll()
    {
        for (int i = 0; i < m_ActiveCount; i++)
        {
            m_Pool[i].Show(false);
        }
        m_ActiveCount = 0;
    }

    // Destroy the entire pool (call on cleanup)
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

### Usage

```c
void RefreshPlayerList(array<string> players)
{
    m_WidgetPool.ReleaseAll();  // Hide all — no destruction

    for (int i = 0; i < players.Count(); i++)
    {
        Widget row = m_WidgetPool.Acquire();  // Reuse or create
        TextWidget nameText = TextWidget.Cast(row.FindAnyWidget("NameText"));
        nameText.SetText(players[i]);
    }
}
```

The first `RefreshPlayerList` call creates widgets. Every subsequent call reuses them. No destruction, no re-creation, no frame drop.

---

## Hledejte Debouncing

Když user types into a search box, the `OnChange` dokoncet fires on každý keystroke. Rebuilding a filtered list on každý keystroke is wasteful --- the user is stále typing. Instead, delay the search until the user pauses.

### The Debounce Pattern

```c
class SearchableList
{
    protected const float DEBOUNCE_DELAY = 0.15;  // 150ms
    protected float m_SearchTimer;
    protected bool m_SearchPending;
    protected string m_PendingQuery;

    // Called on every keystroke
    void OnSearchTextChanged(string text)
    {
        m_PendingQuery = text;
        m_SearchPending = true;
        m_SearchTimer = 0;  // Reset the timer on each keystroke
    }

    // Called every frame from OnUpdate
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
        // Now do the actual filtering
        // This runs once after the user stops typing, not on every keystroke
    }
};
```

### Why 150ms?

150ms is a good výchozí. It is long enough that většina keystrokes during continuous typing are batched into a jeden search, but short enough that the UI feels responsive. Adjust if your search is konkrétníly expensive (longer delay) or your users expect instant feedback (shorter delay).

---

## Aktualizujte Rate Limiting

Not každýthing needs to run každý frame. Many systems can update at a lower frequency without jakýkoli noticeable impact.

### Timer-Based Throttling

```c
class EntityScanner : MyServerModule
{
    protected const float SCAN_INTERVAL = 5.0;  // Every 5 seconds
    protected float m_ScanTimer;

    override void OnUpdate(float dt)
    {
        m_ScanTimer += dt;
        if (m_ScanTimer < SCAN_INTERVAL) return;
        m_ScanTimer = 0;

        // Expensive scan runs every 5 seconds, not every frame
        ScanEntities();
    }
};
```

### Frame-Count Throttling

For operations that should run každý N frames:

```c
class PositionSync
{
    protected int m_FrameCounter;
    protected const int SYNC_EVERY_N_FRAMES = 10;  // Every 10th frame

    void OnUpdate(float dt)
    {
        m_FrameCounter++;
        if (m_FrameCounter % SYNC_EVERY_N_FRAMES != 0) return;

        SyncPositions();
    }
};
```

### Staggered Processing

When více systems need periodic updates, stagger their timers so they ne all fire on the stejný frame:

```c
// BAD: All three fire at t=5.0, t=10.0, t=15.0 — frame spike
m_LootTimer   = 5.0;
m_VehicleTimer = 5.0;
m_WeatherTimer = 5.0;

// GOOD: Staggered — work is distributed
m_LootTimer    = 5.0;
m_VehicleTimer = 5.0 + 1.6;  // Fires ~1.6s after loot
m_WeatherTimer = 5.0 + 3.3;  // Fires ~3.3s after loot
```

Or start the timers at odlišný offsets:

```c
m_LootTimer    = 0;
m_VehicleTimer = 1.6;
m_WeatherTimer = 3.3;
```

---

## Caching

Repeated lookups of the stejný data are běžný performance drain. Cache výsledeks.

### CfgVehicles Scan Cache

Scanning `CfgVehicles` (the globální config database of all item/vehicle classes) is expensive. It involves iterating thousands of config entries. Nikdy do it more than once:

```c
class WeaponRegistry
{
    private static ref array<string> s_AllWeapons;

    // Build once, use forever
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

### String Operation Cache

Pokud compute the stejný string transformation repeatedly (e.g., lowercasing for case-insensitive search), cache výsledek:

```c
class ItemEntry
{
    string DisplayName;
    string SearchName;  // Pre-computed lowercase for search matching

    void ItemEntry(string displayName)
    {
        DisplayName = displayName;
        SearchName = displayName;
        SearchName.ToLower();  // Compute once
    }
};
```

### Position Cache

Pokud frequently check "is player near X?", cache hráč's position and update it periodically spíše než calling `GetPosition()` každý check:

```c
class ProximityChecker
{
    protected vector m_CachedPosition;
    protected float m_PositionAge;

    vector GetCachedPosition(EntityAI entity, float dt)
    {
        m_PositionAge += dt;
        if (m_PositionAge > 1.0)  // Refresh every second
        {
            m_CachedPosition = entity.GetPosition();
            m_PositionAge = 0;
        }
        return m_CachedPosition;
    }
};
```

---

## Vehicle Registry Pattern

A common need is to track all vehicles (or all entities of a specifický type) on the map. The naive approach is to call `GetGame().GetObjectsAtPosition3D()` with a huge radius. This is catastrophically expensive.

### Bad: World Scan

```c
// TERRIBLE: Scans every object in a 50km radius every frame
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

### Good: Registration-Based Registry

Track entities as they are created and destroyed:

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

// Hook into vehicle construction/destruction:
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

Now `VehicleRegistry.GetAll()` vracíll vehicles instantly --- no world scan needed.

### Expansion's Linked-List Pattern

Expansion takes this further with a doubly-linked list on the entity class itself, avoiding the cost of array operations:

```c
// Expansion pattern (conceptual):
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

This gives O(1) insertion and removal with zero memory allocation per operation. Iteration is a simple pointer walk from `s_Head`.

---

## Sort Algorithm Choice

Enforce Script arrays have a vestavěný `.Sort()` method, but it pouze works for basic types and uses the výchozí comparison. For vlastní sort orders, potřebujete a comparison function.

### Built-in Sort

```c
array<int> numbers = {5, 2, 8, 1, 9, 3};
numbers.Sort();  // {1, 2, 3, 5, 8, 9}

array<string> names = {"Charlie", "Alice", "Bob"};
names.Sort();  // {"Alice", "Bob", "Charlie"} — lexicographic
```

### Custom Sort with Comparison

For sorting arrays of objects by a specifický field, implement your own sort. Insertion sort is good for small arrays (under ~100 elements); for larger arrays, quicksort performs better.

```c
// Simple insertion sort — good for small arrays
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

### Vyhněte se Sorting Per Frame

Pokud sorted list is displayed in the UI, sort it once when the data changes, not každý frame:

```c
// BAD: Sort every frame
void OnUpdate(float dt)
{
    SortPlayersByScore(m_Players);
    RefreshUI();
}

// GOOD: Sort only when data changes
void OnPlayerScoreChanged()
{
    SortPlayersByScore(m_Players);
    RefreshUI();
}
```

---

## Things to Avoid

### 1. `GetObjectsAtPosition3D` with Huge Radius

This scans každý physical object in the world within the given radius. At `50000` meters (the celý map), it iterates každý tree, rock, building, item, zombie, and player. One call can take 50ms+.

```c
// NEVER DO THIS
GetGame().GetObjectsAtPosition3D(Vector(7500, 0, 7500), 50000, results);
```

Use a registration-based registry místo toho (viz [Vehicle Registry Pattern](#vehicle-registry-pattern)).

### 2. Full List Rebuild on Every Keystroke

```c
// BAD: Rebuilding 5000 widget rows on every keystroke
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

Use [search debouncing](#search-debouncing) and [widget pooling](#widget-pooling) místo toho.

### 3. Per-Frame String Allocations

String concatenation creates nový string objects. In a per-frame function, this generates garbage každý frame:

```c
// BAD: Two new string allocations per frame per entity
void OnUpdate(float dt)
{
    for (int i = 0; i < m_Entities.Count(); i++)
    {
        string label = "Entity_" + i.ToString();  // New string every frame
        string info = label + " at " + m_Entities[i].GetPosition().ToString();  // Another new string
    }
}
```

If potřebujete formatted strings for logging or UI, do it on state change, not per frame.

### 4. Redundant FileExist Checks in Loops

```c
// BAD: Checking FileExist for the same path 500 times
for (int i = 0; i < m_Players.Count(); i++)
{
    if (FileExist("$profile:MyMod/Config.json"))  // Same file, 500 checks
    {
        // ...
    }
}

// GOOD: Check once
bool configExists = FileExist("$profile:MyMod/Config.json");
for (int i = 0; i < m_Players.Count(); i++)
{
    if (configExists)
    {
        // ...
    }
}
```

### 5. Calling GetGame() Repeatedly

`GetGame()` is a globální function call. In tight loops, cache výsledek:

```c
// Acceptable for occasional use
if (GetGame().IsServer()) { ... }

// In a tight loop, cache it:
CGame game = GetGame();
for (int i = 0; i < 1000; i++)
{
    if (game.IsServer()) { ... }
}
```

### 6. Spawning Entities in a Tight Loop

Entity spawning is expensive (physics setup, network replication, etc.). Nikdy spawn dozens of entities in a jeden frame:

```c
// BAD: 100 entity spawns in one frame — massive frame spike
for (int i = 0; i < 100; i++)
{
    GetGame().CreateObjectEx("Zombie", randomPos, ECE_PLACE_ON_SURFACE);
}
```

Use batched processing: spawn 5 per frame across 20 frames.

---

## Profiling

### Server FPS Monitoring

The většina basic metric is server FPS. Pokud váš mod drops server FPS, některéthing is wrong:

```c
// In your OnUpdate, measure elapsed time:
void OnUpdate(float dt)
{
    float startTime = GetGame().GetTickTime();

    // ... your logic ...

    float elapsed = GetGame().GetTickTime() - startTime;
    if (elapsed > 0.005)  // More than 5ms
    {
        MyLog.Warning("Perf", "OnUpdate took " + elapsed.ToString() + "s");
    }
}
```

### Script Log Indicators

Watch the DayZ server script log for these performance warnings:

- `SCRIPT (W): Exceeded X ms` --- a script execution exceeded engine's time budget
- Long pauses in log timestamps --- některéthing blocked the main thread

### Empirical Testing

The pouze reliable way to know if an optimization matters is to measure before and after:

1. Přidejte timing around the suspect code
2. Run a reproducible test (e.g., 50 hráči, 1000 entities)
3. Compare frame times
4. Pokud change is less than 1ms per frame, it probably ne matter

---

## Checklist

Před shipping performance-sensitive code, verify:

- [ ] No `GetObjectsAtPosition3D` calls with radius > 100m in per-frame code
- [ ] All expensive scans (CfgVehicles, entity searches) are cached
- [ ] UI lists use widget pooling, not destroy/recreate
- [ ] Hledejte inputs use debouncing (150ms+)
- [ ] OnAktualizujte operations are throttled by timer or batch size
- [ ] Large collections are processed in batches (50 items/frame výchozí)
- [ ] Entity spawning is batched across frames, not done in a tight loop
- [ ] String concatenation is not done per-frame in tight loops
- [ ] Sort operations run on data change, not per frame
- [ ] Multiple periodic systems have staggered timers
- [ ] Entity tracking uses registration, not world scanning

---

## Kompatibilita a dopad

- **Více modů:** Performance costs are cumulative. Each mod's `OnUpdate` runs každý frame. Five mods každý taking 2ms means 10ms per frame from scripts alone. Coordinate with jiný mod authors to stagger timers and avoid duplicate world scans.
- **Pořadí načítání:** Load order does not affect performance directly. Nicméně if multiple mods `modded class` the same entity (e.g., `CarScript.EEInit`), each override adds to the call chain cost. Keep modded overrides minimal.
- **Listen Server:** Listen servers run oba client and server scripts in the stejný process. Widget pooling, UI updates, and rendering costs compound with server-side ticks. Performance budgets are tighter on listen servers than dedicated servers.
- **Výkon:** The DayZ server frame budget at 60 FPS is ~16ms. At 20 FPS (common on loaded servers), it is ~50ms. A jeden mod should aim to stay under 2ms per frame. Profile with `GetGame().GetTickTime()` to verify.
- **Migration:** Performance patterns are engine-agnostic and survive DayZ version updates. Specific API costs (e.g., `GetObjectsAtPosition3D`) may change mezi engine versions, so re-profile after major DayZ updates.

---

## Časté chyby

| Mistake | Impact | Fix |
|---------|--------|-----|
| Premature optimization (micro-optimizing code that runs once při startu) | Wasted development time; no measurable improvement; harder-to-read code | Profile first. Only optimize code that runs per-frame or processes large collections. Startup cost is paid once. |
| Using `GetObjectsAtPosition3D` with map-wide radius in `OnUpdate` | 50--200ms stall per call, scanning každý physical object on the map; server FPS drops to jeden digits | Use a registration-based registry (register in `EEInit`, unregister in `EEDelete`). Nikdy world-scan per frame. |
| Rebuilding UI widget trees on každý data change | Frame spikes from widget creation/destruction; visible stutter for hráč | Use widget pooling: hide/show existing widgets místo destroying and recreating them |
| Sorting large arrays každý frame | O(n log n) per frame for data that rarely changes; unnecessary CPU waste | Sort once when data changes (dirty flag), cache the sorted result, re-sort pouze on mutation |
| Running expensive file I/O (JsonSaveFile) každý `OnUpdate` tick | Disk writes block the main thread; 5--20ms per save depending on velikost souboru | Use auto-save timers (300s výchozí) with a dirty flag. Only write when data has actually changed. |

---

## Teorie vs praxe

| Textbook Says | DayZ Reality |
|---------------|-------------|
| Use async processing for expensive operations | Enforce Script is jeden-threaded with no async primitives; batch work across frames using index-based processing místo toho |
| Object pooling is premature optimization | Widget creation is genuinely expensive in Enfusion; pooling is standard practice in každý major mod (COT, VPP, Expansion) |
| Profile before optimizing | Correct, but některé patterns (world scans, per-frame string alloc, per-keystroke rebuilds) are *always* wrong in DayZ. Vyhněte se them from the start. |

---

[Domů](../README.md) | [<< Předchozí: Event-Driven Architecture](06-events.md) | **Performance Optimization**
