# Capitulo 7.7: Optimizacion de Rendimiento

[Inicio](../README.md) | [<< Anterior: Arquitectura Orientada a Eventos](06-events.md) | **Optimizacion de Rendimiento**

---

## Introduccion

DayZ funciona a 10--60 FPS de servidor dependiendo del conteo de jugadores, carga de entidades y complejidad de mods. Cada ciclo de script que tarda demasiado consume el presupuesto de ese frame. Un solo `OnUpdate` mal escrito que escanea cada vehiculo del mapa o reconstruye una lista de UI desde cero puede disminuir notablemente el rendimiento del servidor. Los mods profesionales ganan su reputacion siendo rapidos --- no por tener mas funcionalidades, sino por implementar las mismas funcionalidades con menos desperdicio.

Este capitulo cubre los patrones de optimizacion probados en batalla utilizados por COT, VPP, Expansion y Dabs Framework. Estas no son optimizaciones prematuras --- son practicas de ingenieria estandar que todo modder de DayZ deberia conocer desde el principio.

---

## Tabla de Contenidos

- [Carga Lazy y Procesamiento por Lotes](#carga-lazy-y-procesamiento-por-lotes)
- [Pooling de Widgets](#pooling-de-widgets)
- [Debouncing de Busqueda](#debouncing-de-busqueda)
- [Limitacion de Tasa de Actualizacion](#limitacion-de-tasa-de-actualizacion)
- [Cache](#cache)
- [Patron de Registro de Vehiculos](#patron-de-registro-de-vehiculos)
- [Eleccion de Algoritmo de Ordenamiento](#eleccion-de-algoritmo-de-ordenamiento)
- [Cosas a Evitar](#cosas-a-evitar)
- [Perfilado](#perfilado)
- [Lista de Verificacion](#lista-de-verificacion)

---

## Carga Lazy y Procesamiento por Lotes

La optimizacion mas impactante en el modding de DayZ es **no hacer trabajo hasta que sea necesario** y **distribuir el trabajo a traves de multiples frames** cuando debe hacerse.

### Carga Lazy

Nunca pre-computes ni pre-cargues datos que el usuario podria no necesitar:

```c
class ItemDatabase
{
    protected ref map<string, ref ItemData> m_Cache;
    protected bool m_Loaded;

    // MAL: Cargar todo al inicio
    void OnInit()
    {
        LoadAllItems();  // 5000 items, 200ms de bloqueo al inicio
    }

    // BIEN: Cargar en el primer acceso
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

### Procesamiento por Lotes (N Items Por Frame)

Cuando debes procesar una coleccion grande, procesa un lote fijo por frame en lugar de la coleccion completa de una vez:

```c
class LootCleanup : MyServerModule
{
    protected ref array<Object> m_DirtyItems;
    protected int m_ProcessIndex;

    static const int BATCH_SIZE = 50;  // Procesar 50 items por frame

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

        // Reiniciar cuando termine
        if (m_ProcessIndex >= m_DirtyItems.Count())
        {
            m_DirtyItems.Clear();
            m_ProcessIndex = 0;
        }
    }

    void ProcessItem(Object item) { ... }
};
```

### Por que 50?

El tamano del lote depende de lo costoso que sea procesar cada item. Para operaciones ligeras (verificaciones de null, lecturas de posicion), 100--200 por frame esta bien. Para operaciones pesadas (generacion de entidades, consultas de pathfinding, I/O de archivos), 5--10 por frame puede ser el limite. Comienza con 50 y ajusta basandote en el impacto observado en el tiempo de frame.

---

## Pooling de Widgets

Crear y destruir widgets de UI es costoso. El motor debe asignar memoria, construir el arbol de widgets, aplicar estilos y calcular el layout. Si tienes una lista desplazable con 500 entradas, crear 500 widgets, destruirlos y crear 500 nuevos cada vez que la lista se refresca es una caida de frame garantizada.

### El Problema

```c
// MAL: Destruir y recrear en cada refresco
void RefreshPlayerList(array<string> players)
{
    // Destruir todos los widgets existentes
    Widget child = m_ListPanel.GetChildren();
    while (child)
    {
        Widget next = child.GetSibling();
        child.Unlink();  // Destruir
        child = next;
    }

    // Crear nuevos widgets para cada jugador
    for (int i = 0; i < players.Count(); i++)
    {
        Widget row = GetGame().GetWorkspace().CreateWidgets("MyMod/layouts/PlayerRow.layout", m_ListPanel);
        TextWidget nameText = TextWidget.Cast(row.FindAnyWidget("NameText"));
        nameText.SetText(players[i]);
    }
}
```

### El Patron de Pool

Pre-crear un pool de filas de widgets. Al refrescar, reusar filas existentes. Mostrar filas que tienen datos; ocultar filas que no.

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

        // Pre-crear el pool
        for (int i = 0; i < initialSize; i++)
        {
            Widget w = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
            w.Show(false);
            m_Pool.Insert(w);
        }
    }

    // Obtener un widget del pool, creando nuevos si es necesario
    Widget Acquire()
    {
        if (m_ActiveCount < m_Pool.Count())
        {
            Widget w = m_Pool[m_ActiveCount];
            w.Show(true);
            m_ActiveCount++;
            return w;
        }

        // Pool agotado — hacerlo crecer
        Widget newWidget = GetGame().GetWorkspace().CreateWidgets(m_LayoutPath, m_Parent);
        m_Pool.Insert(newWidget);
        m_ActiveCount++;
        return newWidget;
    }

    // Ocultar todos los widgets activos (pero no destruirlos)
    void ReleaseAll()
    {
        for (int i = 0; i < m_ActiveCount; i++)
        {
            m_Pool[i].Show(false);
        }
        m_ActiveCount = 0;
    }

    // Destruir el pool completo (llamar en limpieza)
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

### Uso

```c
void RefreshPlayerList(array<string> players)
{
    m_WidgetPool.ReleaseAll();  // Ocultar todos — sin destruccion

    for (int i = 0; i < players.Count(); i++)
    {
        Widget row = m_WidgetPool.Acquire();  // Reusar o crear
        TextWidget nameText = TextWidget.Cast(row.FindAnyWidget("NameText"));
        nameText.SetText(players[i]);
    }
}
```

La primera llamada a `RefreshPlayerList` crea widgets. Cada llamada subsiguiente los reusa. Sin destruccion, sin re-creacion, sin caida de frame.

---

## Debouncing de Busqueda

Cuando un usuario escribe en un cuadro de busqueda, el evento `OnChange` se dispara en cada pulsacion de tecla. Reconstruir una lista filtrada en cada pulsacion es un desperdicio --- el usuario aun esta escribiendo. En su lugar, retrasa la busqueda hasta que el usuario haga una pausa.

### El Patron de Debounce

```c
class SearchableList
{
    protected const float DEBOUNCE_DELAY = 0.15;  // 150ms
    protected float m_SearchTimer;
    protected bool m_SearchPending;
    protected string m_PendingQuery;

    // Se llama en cada pulsacion de tecla
    void OnSearchTextChanged(string text)
    {
        m_PendingQuery = text;
        m_SearchPending = true;
        m_SearchTimer = 0;  // Reiniciar el temporizador en cada pulsacion
    }

    // Se llama cada frame desde OnUpdate
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
        // Ahora hacer el filtrado real
        // Esto se ejecuta una vez despues de que el usuario deje de escribir, no en cada pulsacion
    }
};
```

### Por que 150ms?

150ms es un buen valor por defecto. Es lo suficientemente largo para que la mayoria de las pulsaciones durante escritura continua se agrupen en una sola busqueda, pero lo suficientemente corto para que la UI se sienta responsiva. Ajusta si tu busqueda es particularmente costosa (retraso mas largo) o tus usuarios esperan feedback instantaneo (retraso mas corto).

---

## Limitacion de Tasa de Actualizacion

No todo necesita ejecutarse cada frame. Muchos sistemas pueden actualizarse a una frecuencia menor sin ningun impacto notable.

### Throttling Basado en Temporizador

```c
class EntityScanner : MyServerModule
{
    protected const float SCAN_INTERVAL = 5.0;  // Cada 5 segundos
    protected float m_ScanTimer;

    override void OnUpdate(float dt)
    {
        m_ScanTimer += dt;
        if (m_ScanTimer < SCAN_INTERVAL) return;
        m_ScanTimer = 0;

        // Escaneo costoso se ejecuta cada 5 segundos, no cada frame
        ScanEntities();
    }
};
```

### Throttling por Conteo de Frames

Para operaciones que deberian ejecutarse cada N frames:

```c
class PositionSync
{
    protected int m_FrameCounter;
    protected const int SYNC_EVERY_N_FRAMES = 10;  // Cada 10mo frame

    void OnUpdate(float dt)
    {
        m_FrameCounter++;
        if (m_FrameCounter % SYNC_EVERY_N_FRAMES != 0) return;

        SyncPositions();
    }
};
```

### Procesamiento Escalonado

Cuando multiples sistemas necesitan actualizaciones periodicas, escalona sus temporizadores para que no disparen todos en el mismo frame:

```c
// MAL: Los tres disparan en t=5.0, t=10.0, t=15.0 — pico de frame
m_LootTimer   = 5.0;
m_VehicleTimer = 5.0;
m_WeatherTimer = 5.0;

// BIEN: Escalonados — el trabajo se distribuye
m_LootTimer    = 5.0;
m_VehicleTimer = 5.0 + 1.6;  // Dispara ~1.6s despues de loot
m_WeatherTimer = 5.0 + 3.3;  // Dispara ~3.3s despues de loot
```

O inicia los temporizadores con diferentes offsets:

```c
m_LootTimer    = 0;
m_VehicleTimer = 1.6;
m_WeatherTimer = 3.3;
```

---

## Cache

Las busquedas repetidas de los mismos datos son un drenaje comun de rendimiento. Cachea los resultados.

### Cache de Escaneo de CfgVehicles

Escanear `CfgVehicles` (la base de datos de configuracion global de todas las clases de items/vehiculos) es costoso. Implica iterar miles de entradas de configuracion. Nunca lo hagas mas de una vez:

```c
class WeaponRegistry
{
    private static ref array<string> s_AllWeapons;

    // Construir una vez, usar para siempre
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

### Cache de Operaciones de String

Si computas la misma transformacion de string repetidamente (ej., convertir a minusculas para busqueda sin distincion de mayusculas), cachea el resultado:

```c
class ItemEntry
{
    string DisplayName;
    string SearchName;  // Minusculas pre-computadas para coincidencia de busqueda

    void ItemEntry(string displayName)
    {
        DisplayName = displayName;
        SearchName = displayName;
        SearchName.ToLower();  // Computar una vez
    }
};
```

### Cache de Posicion

Si frecuentemente verificas "esta el jugador cerca de X?", cachea la posicion del jugador y actualizala periodicamente en lugar de llamar `GetPosition()` en cada verificacion:

```c
class ProximityChecker
{
    protected vector m_CachedPosition;
    protected float m_PositionAge;

    vector GetCachedPosition(EntityAI entity, float dt)
    {
        m_PositionAge += dt;
        if (m_PositionAge > 1.0)  // Refrescar cada segundo
        {
            m_CachedPosition = entity.GetPosition();
            m_PositionAge = 0;
        }
        return m_CachedPosition;
    }
};
```

---

## Patron de Registro de Vehiculos

Una necesidad comun es rastrear todos los vehiculos (o todas las entidades de un tipo especifico) en el mapa. El enfoque ingenuo es llamar `GetGame().GetObjectsAtPosition3D()` con un radio enorme. Esto es catastroficamente costoso.

### Malo: Escaneo del Mundo

```c
// TERRIBLE: Escanea cada objeto en un radio de 50km cada frame
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

### Bueno: Registro Basado en Registro

Rastrear entidades a medida que se crean y destruyen:

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

// Engancharse a la construccion/destruccion del vehiculo:
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

Ahora `VehicleRegistry.GetAll()` retorna todos los vehiculos instantaneamente --- sin escaneo del mundo necesario.

### Patron de Lista Enlazada de Expansion

Expansion lleva esto mas lejos con una lista doblemente enlazada en la propia clase de entidad, evitando el costo de operaciones de array:

```c
// Patron Expansion (conceptual):
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

Esto da insercion y eliminacion O(1) con cero asignacion de memoria por operacion. La iteracion es un simple recorrido de punteros desde `s_Head`.

---

## Eleccion de Algoritmo de Ordenamiento

Los arrays de Enforce Script tienen un metodo `.Sort()` incorporado, pero solo funciona para tipos basicos y usa la comparacion por defecto. Para ordenes de clasificacion personalizados, necesitas una funcion de comparacion.

### Sort Incorporado

```c
array<int> numbers = {5, 2, 8, 1, 9, 3};
numbers.Sort();  // {1, 2, 3, 5, 8, 9}

array<string> names = {"Charlie", "Alice", "Bob"};
names.Sort();  // {"Alice", "Bob", "Charlie"} — lexicografico
```

### Sort Personalizado con Comparacion

Para ordenar arrays de objetos por un campo especifico, implementa tu propio sort. Insertion sort es bueno para arrays pequenos (menos de ~100 elementos); para arrays mas grandes, quicksort rinde mejor.

```c
// Insertion sort simple — bueno para arrays pequenos
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

### Evitar Ordenar Por Frame

Si una lista ordenada se muestra en la UI, ordenala una vez cuando los datos cambien, no cada frame:

```c
// MAL: Ordenar cada frame
void OnUpdate(float dt)
{
    SortPlayersByScore(m_Players);
    RefreshUI();
}

// BIEN: Ordenar solo cuando los datos cambien
void OnPlayerScoreChanged()
{
    SortPlayersByScore(m_Players);
    RefreshUI();
}
```

---

## Cosas a Evitar

### 1. `GetObjectsAtPosition3D` con Radio Enorme

Esto escanea cada objeto fisico en el mundo dentro del radio dado. Con `50000` metros (el mapa completo), itera cada arbol, roca, edificio, item, zombie y jugador. Una llamada puede tomar 50ms+.

```c
// NUNCA HAGAS ESTO
GetGame().GetObjectsAtPosition3D(Vector(7500, 0, 7500), 50000, results);
```

Usa un registro basado en registro en su lugar (ver [Patron de Registro de Vehiculos](#patron-de-registro-de-vehiculos)).

### 2. Reconstruccion Completa de Lista en Cada Pulsacion de Tecla

```c
// MAL: Reconstruir 5000 filas de widgets en cada pulsacion
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

Usa [debouncing de busqueda](#debouncing-de-busqueda) y [pooling de widgets](#pooling-de-widgets) en su lugar.

### 3. Asignaciones de String Por Frame

La concatenacion de strings crea nuevos objetos de string. En una funcion por frame, esto genera basura cada frame:

```c
// MAL: Dos nuevas asignaciones de string por frame por entidad
void OnUpdate(float dt)
{
    for (int i = 0; i < m_Entities.Count(); i++)
    {
        string label = "Entity_" + i.ToString();  // Nuevo string cada frame
        string info = label + " at " + m_Entities[i].GetPosition().ToString();  // Otro string nuevo
    }
}
```

Si necesitas strings formateados para logging o UI, hazlo en cambio de estado, no por frame.

### 4. Verificaciones Redundantes de FileExist en Bucles

```c
// MAL: Verificar FileExist para la misma ruta 500 veces
for (int i = 0; i < m_Players.Count(); i++)
{
    if (FileExist("$profile:MyMod/Config.json"))  // Mismo archivo, 500 verificaciones
    {
        // ...
    }
}

// BIEN: Verificar una vez
bool configExists = FileExist("$profile:MyMod/Config.json");
for (int i = 0; i < m_Players.Count(); i++)
{
    if (configExists)
    {
        // ...
    }
}
```

### 5. Llamar GetGame() Repetidamente

`GetGame()` es una llamada a funcion global. En bucles ajustados, cachea el resultado:

```c
// Aceptable para uso ocasional
if (GetGame().IsServer()) { ... }

// En un bucle ajustado, cachealo:
CGame game = GetGame();
for (int i = 0; i < 1000; i++)
{
    if (game.IsServer()) { ... }
}
```

### 6. Generar Entidades en un Bucle Ajustado

La generacion de entidades es costosa (configuracion de fisica, replicacion de red, etc.). Nunca generes docenas de entidades en un solo frame:

```c
// MAL: 100 generaciones de entidad en un frame — pico masivo de frame
for (int i = 0; i < 100; i++)
{
    GetGame().CreateObjectEx("Zombie", randomPos, ECE_PLACE_ON_SURFACE);
}
```

Usa procesamiento por lotes: genera 5 por frame a lo largo de 20 frames.

---

## Perfilado

### Monitoreo de FPS del Servidor

La metrica mas basica es el FPS del servidor. Si tu mod reduce el FPS del servidor, algo esta mal:

```c
// En tu OnUpdate, mide el tiempo transcurrido:
void OnUpdate(float dt)
{
    float startTime = GetGame().GetTickTime();

    // ... tu logica ...

    float elapsed = GetGame().GetTickTime() - startTime;
    if (elapsed > 0.005)  // Mas de 5ms
    {
        MyLog.Warning("Perf", "OnUpdate tomo " + elapsed.ToString() + "s");
    }
}
```

### Indicadores del Log de Script

Vigila el log de script del servidor de DayZ para estas advertencias de rendimiento:

- `SCRIPT (W): Exceeded X ms` --- una ejecucion de script excedio el presupuesto de tiempo del motor
- Pausas largas en las marcas de tiempo del log --- algo bloqueo el hilo principal

### Pruebas Empiricas

La unica forma confiable de saber si una optimizacion importa es medir antes y despues:

1. Agrega medicion de tiempo alrededor del codigo sospechoso
2. Ejecuta una prueba reproducible (ej., 50 jugadores, 1000 entidades)
3. Compara tiempos de frame
4. Si el cambio es menos de 1ms por frame, probablemente no importa

---

## Lista de Verificacion

Antes de publicar codigo sensible al rendimiento, verifica:

- [ ] Sin llamadas a `GetObjectsAtPosition3D` con radio > 100m en codigo por frame
- [ ] Todos los escaneos costosos (CfgVehicles, busquedas de entidades) estan cacheados
- [ ] Las listas de UI usan pooling de widgets, no destruir/recrear
- [ ] Las entradas de busqueda usan debouncing (150ms+)
- [ ] Las operaciones de OnUpdate estan limitadas por temporizador o tamano de lote
- [ ] Las colecciones grandes se procesan en lotes (50 items/frame por defecto)
- [ ] La generacion de entidades esta distribuida entre frames, no en un bucle ajustado
- [ ] La concatenacion de strings no se hace por frame en bucles ajustados
- [ ] Las operaciones de ordenamiento se ejecutan en cambio de datos, no por frame
- [ ] Multiples sistemas periodicos tienen temporizadores escalonados
- [ ] El seguimiento de entidades usa registro, no escaneo del mundo

---

## Compatibilidad e Impacto

- **Multi-Mod:** Los costos de rendimiento son acumulativos. El `OnUpdate` de cada mod se ejecuta cada frame. Cinco mods tomando 2ms cada uno significa 10ms por frame solo de scripts. Coordina con otros autores de mods para escalonar temporizadores y evitar escaneos duplicados del mundo.
- **Orden de Carga:** El orden de carga no afecta el rendimiento directamente. Sin embargo, si multiples mods hacen `modded class` de la misma entidad (ej., `CarScript.EEInit`), cada override agrega a la cadena de costos de llamada. Manten los overrides con modded minimos.
- **Listen Server:** Los listen servers ejecutan tanto scripts de cliente como de servidor en el mismo proceso. El pooling de widgets, las actualizaciones de UI y los costos de renderizado se componen con los ticks del lado del servidor. Los presupuestos de rendimiento son mas ajustados en listen servers que en servidores dedicados.
- **Rendimiento:** El presupuesto de frame del servidor de DayZ a 60 FPS es ~16ms. A 20 FPS (comun en servidores cargados), es ~50ms. Un solo mod deberia apuntar a mantenerse por debajo de 2ms por frame. Perfila con `GetGame().GetTickTime()` para verificar.
- **Migracion:** Los patrones de rendimiento son agniosticos al motor y sobreviven a las actualizaciones de version de DayZ. Los costos especificos de API (ej., `GetObjectsAtPosition3D`) pueden cambiar entre versiones del motor, asi que re-perfila despues de actualizaciones importantes de DayZ.

---

## Errores Comunes

| Error | Impacto | Solucion |
|---------|--------|-----|
| Optimizacion prematura (micro-optimizar codigo que se ejecuta una vez al inicio) | Tiempo de desarrollo desperdiciado; sin mejora medible; codigo mas dificil de leer | Perfila primero. Solo optimiza codigo que se ejecuta por frame o procesa colecciones grandes. El costo de inicio se paga una vez. |
| Usar `GetObjectsAtPosition3D` con radio de todo el mapa en `OnUpdate` | Bloqueo de 50--200ms por llamada, escaneando cada objeto fisico del mapa; FPS del servidor cae a un digito | Usa un registro basado en registro (registrar en `EEInit`, desregistrar en `EEDelete`). Nunca escanees el mundo por frame. |
| Reconstruir arboles de widgets de UI en cada cambio de datos | Picos de frame por creacion/destruccion de widgets; tartamudeo visible para el jugador | Usa pooling de widgets: ocultar/mostrar widgets existentes en lugar de destruirlos y recrearlos |
| Ordenar arrays grandes cada frame | O(n log n) por frame para datos que raramente cambian; desperdicio innecesario de CPU | Ordena una vez cuando los datos cambien (flag dirty), cachea el resultado ordenado, re-ordena solo en mutacion |
| Ejecutar I/O de archivos costoso (JsonSaveFile) cada tick de `OnUpdate` | Las escrituras a disco bloquean el hilo principal; 5--20ms por guardado dependiendo del tamano del archivo | Usa temporizadores de auto-guardado (300s por defecto) con flag dirty. Solo escribe cuando los datos hayan cambiado realmente. |

---

## Teoria vs Practica

| Los Libros Dicen | Realidad en DayZ |
|---------------|-------------|
| Usar procesamiento asincrono para operaciones costosas | Enforce Script es de un solo hilo sin primitivas asincronas; distribuye trabajo entre frames usando procesamiento basado en indice en su lugar |
| El pooling de objetos es optimizacion prematura | La creacion de widgets es genuinamente costosa en Enfusion; el pooling es practica estandar en todos los mods principales (COT, VPP, Expansion) |
| Perfilar antes de optimizar | Correcto, pero algunos patrones (escaneos del mundo, asignacion de strings por frame, reconstrucciones por pulsacion de tecla) son *siempre* incorrectos en DayZ. Evitalos desde el principio. |

---

[Inicio](../README.md) | [<< Anterior: Arquitectura Orientada a Eventos](06-events.md) | **Optimizacion de Rendimiento**
