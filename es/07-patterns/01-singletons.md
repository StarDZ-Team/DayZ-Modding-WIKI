# Capitulo 7.1: Patron Singleton

[Inicio](../../README.md) | **Patron Singleton** | [Siguiente: Sistemas de Modulos >>](02-module-systems.md)

---

## Introduccion

El patron singleton garantiza que una clase tenga exactamente una instancia, accesible globalmente. En el modding de DayZ es el patron arquitectonico mas comun --- practicamente cada manager, cache, registro y subsistema lo utiliza. COT, VPP, Expansion, Dabs Framework y otros dependen de singletons para coordinar el estado a traves de las capas de scripts del motor.

Este capitulo cubre la implementacion canonica, la gestion del ciclo de vida, cuando el patron es apropiado y donde falla.

---

## Tabla de Contenidos

- [La Implementacion Canonica](#la-implementacion-canonica)
- [Inicializacion Lazy vs Eager](#inicializacion-lazy-vs-eager)
- [Gestion del Ciclo de Vida](#gestion-del-ciclo-de-vida)
- [Cuando Usar Singletons](#cuando-usar-singletons)
- [Ejemplos del Mundo Real](#ejemplos-del-mundo-real)
- [Consideraciones de Seguridad de Hilos](#consideraciones-de-seguridad-de-hilos)
- [Anti-Patrones](#anti-patrones)
- [Alternativa: Clases Solo Estaticas](#alternativa-clases-solo-estaticas)
- [Lista de Verificacion](#lista-de-verificacion)

---

## La Implementacion Canonica

El singleton estandar de DayZ sigue una formula simple: un campo `private static ref`, un accesor estatico `GetInstance()` y un `DestroyInstance()` estatico para limpieza.

```c
class LootManager
{
    // La instancia unica. 'ref' la mantiene viva; 'private' previene manipulacion externa.
    private static ref LootManager s_Instance;

    // Datos privados del singleton
    protected ref map<string, int> m_SpawnCounts;

    // Constructor — se llama exactamente una vez
    void LootManager()
    {
        m_SpawnCounts = new map<string, int>();
    }

    // Destructor — se llama cuando s_Instance se establece a null
    void ~LootManager()
    {
        m_SpawnCounts = null;
    }

    // Accesor lazy: crea en la primera llamada
    static LootManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new LootManager();
        }
        return s_Instance;
    }

    // Destruccion explicita
    static void DestroyInstance()
    {
        s_Instance = null;
    }

    // --- API Publica ---

    void RecordSpawn(string className)
    {
        int count = 0;
        m_SpawnCounts.Find(className, count);
        m_SpawnCounts.Set(className, count + 1);
    }

    int GetSpawnCount(string className)
    {
        int count = 0;
        m_SpawnCounts.Find(className, count);
        return count;
    }
};
```

### Por que `private static ref`?

| Palabra clave | Proposito |
|---------|---------|
| `private` | Previene que otras clases establezcan `s_Instance` a null o la reemplacen |
| `static` | Compartido en todo el codigo --- no se necesita instancia para acceder |
| `ref` | Referencia fuerte --- mantiene el objeto vivo mientras `s_Instance` no sea null |

Sin `ref`, la instancia seria una referencia debil y podria ser recolectada por el garbage collector mientras aun esta en uso.

---

## Inicializacion Lazy vs Eager

### Inicializacion Lazy (Por Defecto Recomendada)

El metodo `GetInstance()` crea la instancia en el primer acceso. Este es el enfoque utilizado por la mayoria de los mods de DayZ.

```c
static LootManager GetInstance()
{
    if (!s_Instance)
    {
        s_Instance = new LootManager();
    }
    return s_Instance;
}
```

**Ventajas:**
- No se realiza trabajo hasta que realmente se necesita
- Sin dependencia del orden de inicializacion entre mods
- Seguro si el singleton es opcional (algunas configuraciones de servidor pueden nunca llamarlo)

**Desventaja:**
- El primer llamador paga el costo de construccion (generalmente insignificante)

### Inicializacion Eager

Algunos singletons se crean explicitamente durante el inicio de la mision, tipicamente desde `MissionServer.OnInit()` o el `OnMissionStart()` de un modulo.

```c
// En tu MissionServer.OnInit() con modded:
void OnInit()
{
    super.OnInit();
    LootManager.Create();  // Eager: construido ahora, no en el primer uso
}

// En LootManager:
static void Create()
{
    if (!s_Instance)
    {
        s_Instance = new LootManager();
    }
}
```

**Cuando preferir eager:**
- El singleton carga datos del disco (configs, archivos JSON) y quieres que los errores de carga aparezcan al inicio
- El singleton registra manejadores RPC que deben estar en su lugar antes de que cualquier cliente se conecte
- El orden de inicializacion importa y necesitas controlarlo explicitamente

---

## Gestion del Ciclo de Vida

La fuente mas comun de bugs de singleton en DayZ es no limpiar al finalizar la mision. Los servidores de DayZ pueden reiniciar misiones sin reiniciar el proceso, lo que significa que los campos estaticos sobreviven entre reinicios de mision. Si no pones `s_Instance` a null en `OnMissionFinish`, llevas referencias obsoletas, objetos muertos y callbacks huerfanos a la siguiente mision.

### El Contrato de Ciclo de Vida

```
Inicio del Proceso del Servidor
  |-- MissionServer.OnInit()
       |-- Crear singletons (eager) o dejarlos auto-crearse (lazy)
  |-- MissionServer.OnMissionStart()
       |-- Los singletons comienzan a operar
  |-- ... el servidor funciona ...
  |-- MissionServer.OnMissionFinish()
       |-- DestroyInstance() en cada singleton
       |-- Todas las refs estaticas establecidas a null
  |-- (La mision puede reiniciar)
       |-- Singletons frescos creados de nuevo
```

### Patron de Limpieza

Siempre empareja tu singleton con un metodo `DestroyInstance()` y llamalo durante el cierre:

```c
class VehicleRegistry
{
    private static ref VehicleRegistry s_Instance;
    protected ref array<ref VehicleData> m_Vehicles;

    static VehicleRegistry GetInstance()
    {
        if (!s_Instance) s_Instance = new VehicleRegistry();
        return s_Instance;
    }

    static void DestroyInstance()
    {
        s_Instance = null;  // Suelta la ref, el destructor se ejecuta
    }

    void ~VehicleRegistry()
    {
        if (m_Vehicles) m_Vehicles.Clear();
        m_Vehicles = null;
    }
};

// En tu MissionServer con modded:
modded class MissionServer
{
    override void OnMissionFinish()
    {
        VehicleRegistry.DestroyInstance();
        super.OnMissionFinish();
    }
};
```

### Patron de Cierre Centralizado

Un mod framework puede consolidar toda la limpieza de singletons en `MyFramework.ShutdownAll()`, que se llama desde el `MissionServer.OnMissionFinish()` con modded. Esto previene el error comun de olvidar un singleton:

```c
// Patron conceptual (cierre centralizado):
static void ShutdownAll()
{
    MyRPC.Cleanup();
    MyEventBus.Cleanup();
    MyModuleManager.Cleanup();
    MyConfigManager.DestroyInstance();
    MyPermissions.DestroyInstance();
}
```

---

## Cuando Usar Singletons

### Buenos Candidatos

| Caso de Uso | Por que Funciona el Singleton |
|----------|-------------------|
| **Clases manager** (LootManager, VehicleManager) | Exactamente un coordinador para un dominio |
| **Caches** (cache de CfgVehicles, cache de iconos) | Una unica fuente de verdad evita computacion redundante |
| **Registros** (registro de manejadores RPC, registro de modulos) | La busqueda central debe ser accesible globalmente |
| **Contenedores de config** (configuracion del servidor, permisos) | Una config por mod, cargada una vez del disco |
| **Despachadores RPC** | Punto de entrada unico para todos los RPCs entrantes |

### Malos Candidatos

| Caso de Uso | Por que No |
|----------|---------|
| **Datos por jugador** | Una instancia por jugador, no una instancia global |
| **Computaciones temporales** | Crear, usar, descartar --- no se necesita estado global |
| **Vistas / dialogos de UI** | Pueden coexistir multiples; usa la pila de vistas en su lugar |
| **Componentes de entidad** | Adjuntos a objetos individuales, no globales |

---

## Ejemplos del Mundo Real

### COT (Community Online Tools)

COT utiliza un patron singleton basado en modulos a traves del framework CF. Cada herramienta es un singleton `JMModuleBase` registrado al inicio:

```c
// Patron COT: CF auto-instancia modulos declarados en config.cpp
class JM_COT_ESP : JMModuleBase
{
    // CF gestiona el ciclo de vida del singleton
    // Acceso via: JM_COT_ESP.Cast(GetModuleManager().GetModule(JM_COT_ESP));
}
```

### VPP Admin Tools

VPP usa `GetInstance()` explicito en clases manager:

```c
// Patron VPP (simplificado)
class VPPATBanManager
{
    private static ref VPPATBanManager m_Instance;

    static VPPATBanManager GetInstance()
    {
        if (!m_Instance)
            m_Instance = new VPPATBanManager();
        return m_Instance;
    }
}
```

### Expansion

Expansion declara singletons para cada subsistema y se engancha al ciclo de vida de la mision para limpieza:

```c
// Patron Expansion (simplificado)
class ExpansionMarketModule : CF_ModuleWorld
{
    // CF_ModuleWorld es en si mismo un singleton gestionado por el sistema de modulos CF
    // ExpansionMarketModule.Cast(CF_ModuleCoreManager.Get(ExpansionMarketModule));
}
```

---

## Consideraciones de Seguridad de Hilos

Enforce Script es de un solo hilo. Toda la ejecucion de scripts ocurre en el hilo principal dentro del bucle de juego del motor Enfusion. Esto significa:

- **No hay condiciones de carrera** entre hilos concurrentes
- **No** necesitas mutexes, locks u operaciones atomicas
- `GetInstance()` con inicializacion lazy es siempre seguro

Sin embargo, la **re-entrancia** aun puede causar problemas. Si `GetInstance()` dispara codigo que llama a `GetInstance()` de nuevo durante la construccion, puedes obtener un singleton parcialmente inicializado:

```c
// PELIGROSO: construccion re-entrante del singleton
class BadManager
{
    private static ref BadManager s_Instance;

    void BadManager()
    {
        // Esto llama a GetInstance() durante la construccion!
        OtherSystem.Register(BadManager.GetInstance());
    }

    static BadManager GetInstance()
    {
        if (!s_Instance)
        {
            // s_Instance aun es null aqui durante la construccion
            s_Instance = new BadManager();
        }
        return s_Instance;
    }
};
```

La solucion es asignar `s_Instance` antes de ejecutar cualquier inicializacion que pueda re-entrar:

```c
static BadManager GetInstance()
{
    if (!s_Instance)
    {
        s_Instance = new BadManager();  // Asignar primero
        s_Instance.Initialize();         // Luego ejecutar inicializacion que puede llamar GetInstance()
    }
    return s_Instance;
}
```

O mejor aun, evita la inicializacion circular por completo.

---

## Anti-Patrones

### 1. Estado Mutable Global Sin Encapsulacion

El patron singleton te da acceso global. Eso no significa que los datos deban ser escribibles globalmente.

```c
// MAL: Campos publicos invitan mutacion descontrolada
class GameState
{
    private static ref GameState s_Instance;
    int PlayerCount;         // Cualquiera puede escribir esto
    bool ServerLocked;       // Cualquiera puede escribir esto
    string CurrentWeather;   // Cualquiera puede escribir esto

    static GameState GetInstance() { ... }
};

// Cualquier codigo puede hacer:
GameState.GetInstance().PlayerCount = -999;  // Caos
```

```c
// BIEN: Acceso controlado a traves de metodos
class GameState
{
    private static ref GameState s_Instance;
    protected int m_PlayerCount;
    protected bool m_ServerLocked;

    int GetPlayerCount() { return m_PlayerCount; }

    void IncrementPlayerCount()
    {
        m_PlayerCount++;
    }

    static GameState GetInstance() { ... }
};
```

### 2. DestroyInstance Faltante

Si olvidas la limpieza, el singleton persiste entre reinicios de mision con datos obsoletos:

```c
// MAL: Sin ruta de limpieza
class ZombieTracker
{
    private static ref ZombieTracker s_Instance;
    ref array<Object> m_TrackedZombies;  // Estos objetos se eliminan al final de la mision!

    static ZombieTracker GetInstance() { ... }
    // Sin DestroyInstance() — m_TrackedZombies ahora tiene referencias muertas
};
```

### 3. Singletons Que Poseen Todo

Cuando un singleton acumula demasiadas responsabilidades, se convierte en un "objeto Dios" que es imposible de razonar:

```c
// MAL: Un singleton haciendo todo
class ServerManager
{
    // Gestiona loot Y vehiculos Y clima Y spawns Y bans Y...
    ref array<Object> m_Loot;
    ref array<Object> m_Vehicles;
    ref WeatherData m_Weather;
    ref array<string> m_BannedPlayers;

    void SpawnLoot() { ... }
    void DespawnVehicle() { ... }
    void SetWeather() { ... }
    void BanPlayer() { ... }
    // 2000 lineas despues...
};
```

Divide en singletons enfocados: `LootManager`, `VehicleManager`, `WeatherManager`, `BanManager`. Cada uno es pequeno, testeable y tiene un dominio claro.

### 4. Acceder a Singletons en Constructores de Otros Singletons

Esto crea dependencias ocultas en el orden de inicializacion:

```c
// MAL: Constructor depende de otro singleton
class ModuleA
{
    void ModuleA()
    {
        // Que pasa si ModuleB aun no ha sido creado?
        ModuleB.GetInstance().Register(this);
    }
};
```

Difiere el registro entre singletons a `OnInit()` o `OnMissionStart()`, donde el orden de inicializacion esta controlado.

---

## Alternativa: Clases Solo Estaticas

Algunos "singletons" no necesitan una instancia en absoluto. Si la clase no tiene estado de instancia y solo tiene metodos estaticos y campos estaticos, omite la ceremonia de `GetInstance()` por completo:

```c
// No se necesita instancia — todo estatico
class MyLog
{
    private static FileHandle s_LogFile;
    private static int s_LogLevel;

    static void Info(string tag, string msg)
    {
        WriteLog("INFO", tag, msg);
    }

    static void Error(string tag, string msg)
    {
        WriteLog("ERROR", tag, msg);
    }

    static void Cleanup()
    {
        if (s_LogFile) CloseFile(s_LogFile);
        s_LogFile = null;
    }

    private static void WriteLog(string level, string tag, string msg)
    {
        // ...
    }
};
```

Este es el enfoque utilizado por `MyLog`, `MyRPC`, `MyEventBus` y `MyModuleManager` en un mod framework. Es mas simple, evita la sobrecarga de verificacion de null de `GetInstance()` y hace la intencion clara: no hay instancia, solo estado compartido.

**Usa una clase solo estatica cuando:**
- Todos los metodos son sin estado u operan sobre campos estaticos
- No hay logica significativa de constructor/destructor
- Nunca necesitas pasar la "instancia" como parametro

**Usa un singleton verdadero cuando:**
- La clase tiene estado de instancia que se beneficia de la encapsulacion (campos `protected`)
- Necesitas polimorfismo (una clase base con metodos sobrescritos)
- El objeto necesita ser pasado a otros sistemas por referencia

---

## Lista de Verificacion

Antes de publicar un singleton, verifica:

- [ ] `s_Instance` esta declarado `private static ref`
- [ ] `GetInstance()` maneja el caso null (init lazy) o tienes una llamada explicita a `Create()`
- [ ] `DestroyInstance()` existe y establece `s_Instance = null`
- [ ] `DestroyInstance()` se llama desde `OnMissionFinish()` o un metodo de cierre centralizado
- [ ] El destructor limpia las colecciones propias (`.Clear()`, establecer a `null`)
- [ ] Sin campos publicos --- toda mutacion pasa por metodos
- [ ] El constructor no llama a `GetInstance()` en otros singletons (diferir a `OnInit()`)

---

## Compatibilidad e Impacto

- **Multi-Mod:** Multiples mods definiendo cada uno sus propios singletons coexisten de forma segura --- cada uno tiene su propio `s_Instance`. Los conflictos solo surgen si dos mods definen el mismo nombre de clase, lo que Enforce Script marcara como error de redefinicion al cargar.
- **Orden de Carga:** Los singletons lazy no se ven afectados por el orden de carga de mods. Los singletons eager creados en `OnInit()` dependen del orden de la cadena `modded class`, que sigue los `requiredAddons` de `config.cpp`.
- **Listen Server:** Los campos estaticos son compartidos entre los contextos de cliente y servidor en el mismo proceso. Un singleton que solo deberia existir del lado del servidor debe proteger la construccion con `GetGame().IsServer()`, o sera accesible (y potencialmente inicializado) desde codigo del cliente tambien.
- **Rendimiento:** El acceso a singleton es una verificacion de null estatica + llamada a metodo --- sobrecarga insignificante. El costo esta en lo que el singleton *hace*, no en acceder a el.
- **Migracion:** Los singletons sobreviven a las actualizaciones de version de DayZ mientras las APIs que llaman (ej., `GetGame()`, `JsonFileLoader`) permanezcan estables. No se necesita migracion especial para el patron en si.

---

## Errores Comunes

| Error | Impacto | Solucion |
|---------|--------|-----|
| Falta llamada a `DestroyInstance()` en `OnMissionFinish` | Datos obsoletos y referencias a entidades muertas se transfieren entre reinicios de mision, causando crashes o estado fantasma | Siempre llamar `DestroyInstance()` desde `OnMissionFinish` o un `ShutdownAll()` centralizado |
| Llamar `GetInstance()` dentro del constructor de otro singleton | Dispara construccion re-entrante; `s_Instance` aun es null, asi que se crea una segunda instancia | Diferir el acceso entre singletons a un metodo `Initialize()` llamado despues de la construccion |
| Usar `public static ref` en vez de `private static ref` | Cualquier codigo puede establecer `s_Instance = null` o reemplazarlo, rompiendo la garantia de instancia unica | Siempre declarar `s_Instance` como `private static ref` |
| No proteger init eager en listen servers | El singleton se construye dos veces (una desde la ruta del servidor, otra desde la del cliente) si `Create()` carece de verificacion de null | Siempre verificar `if (!s_Instance)` dentro de `Create()` |
| Acumular estado sin limites (caches sin limites) | La memoria crece indefinidamente en servidores de larga duracion; eventual OOM o lag severo | Limitar colecciones con tamano maximo o eviccion periodica en `OnUpdate` |

---

## Teoria vs Practica

| Los Libros Dicen | Realidad en DayZ |
|---------------|-------------|
| Los singletons son un anti-patron; usa inyeccion de dependencias | Enforce Script no tiene contenedor DI. Los singletons son el enfoque estandar para managers globales en todos los mods principales. |
| La inicializacion lazy siempre es suficiente | Los manejadores RPC deben estar registrados antes de que cualquier cliente se conecte, asi que la init eager en `OnInit()` es frecuentemente necesaria. |
| Los singletons nunca deberian ser destruidos | Las misiones de DayZ reinician sin reiniciar el proceso del servidor; los singletons *deben* ser destruidos y recreados en cada ciclo de mision. |

---

[Inicio](../../README.md) | **Patron Singleton** | [Siguiente: Sistemas de Modulos >>](02-module-systems.md)
