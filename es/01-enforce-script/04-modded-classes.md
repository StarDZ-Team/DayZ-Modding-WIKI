# Capitulo 1.4: Clases Modded (La Clave del Modding de DayZ)

[Inicio](../README.md) | [<< Anterior: Clases y Herencia](03-classes-inheritance.md) | **Clases Modded** | [Siguiente: Control Flow >>](05-control-flow.md)

---

## Introduccion

**Las clases modded son el concepto mas importante en el modding de DayZ.** Son el mecanismo que permite a tu mod cambiar el comportamiento de clases existentes del juego sin reemplazar los archivos originales. Sin clases modded, el modding de DayZ tal como lo conocemos no existiria.

Todos los mods importantes de DayZ --- Community Online Tools, VPP Admin Tools, DayZ Expansion, mods de traders, overhauls medicos, sistemas de construccion --- funcionan usando `modded class` para engancharse a clases vanilla y agregar o cambiar comportamiento. Cuando moddeas `PlayerBase`, cada jugador en el juego obtiene tu nuevo comportamiento. Cuando moddeas `MissionServer`, tu codigo se ejecuta como parte del ciclo de vida de la mision del servidor. Cuando moddeas `ItemBase`, cada item en el juego se ve afectado.

Este capitulo es intencionalmente el mas largo y detallado de la Parte 1 porque hacer las clases modded correctamente es lo que separa un mod funcional de uno que crashea servidores o rompe otros mods.

---

## Como Funcionan las Clases Modded

### La Idea Basica

Normalmente, `class Child extends Parent` crea una nueva clase llamada `Child` que hereda de `Parent`. Pero `modded class Parent` hace algo fundamentalmente diferente: **reemplaza** la clase original `Parent` en la jerarquia de clases del motor, insertando tu codigo en la cadena de herencia.

```
Antes de moddear:
  Parent -> (todo el codigo que crea Parent obtiene el original)

Despues de modded class:
  Parent Original -> Tu Parent Modded
  (todo el codigo que crea Parent ahora obtiene TU version)
```

Cada llamada a `new Parent()` en cualquier parte del juego --- codigo vanilla, otros mods, en todas partes --- ahora crea una instancia de tu version modded.

### Sintaxis

```c
modded class ClassName
{
    // Tus adiciones y sobreescrituras van aqui
}
```

Eso es todo. Sin `extends`, sin nombre nuevo. La palabra clave `modded` le dice al motor: "Estoy modificando la clase existente `ClassName`."

### El Ejemplo Canonico

```c
// === Clase vanilla original (en los scripts de DayZ) ===
class ModMe
{
    void Say()
    {
        Print("Hello from the original");
    }
}

// === El archivo de script de tu mod ===
modded class ModMe
{
    override void Say()
    {
        Print("Hello from the mod");
        super.Say();  // Llamar al original
    }
}

// === Lo que ocurre en tiempo de ejecucion ===
void Test()
{
    ModMe obj = new ModMe();
    obj.Say();
    // Salida:
    //   "Hello from the mod"
    //   "Hello from the original"
}
```

---

## Encadenamiento: Multiples Mods Modificando la Misma Clase

El verdadero poder de las clases modded es que **multiples mods pueden modificar la misma clase**, y todos se encadenan automaticamente. El motor procesa los mods en orden de carga, y cada `modded class` hereda del anterior.

```c
// === Vanilla ===
class ModMe
{
    void Say()
    {
        Print("Original");
    }
}

// === Mod A (cargado primero) ===
modded class ModMe
{
    override void Say()
    {
        Print("Mod A");
        super.Say();  // Llama al original
    }
}

// === Mod B (cargado segundo) ===
modded class ModMe
{
    override void Say()
    {
        Print("Mod B");
        super.Say();  // Llama a la version de Mod A
    }
}

// === En tiempo de ejecucion ===
void Test()
{
    ModMe obj = new ModMe();
    obj.Say();
    // Salida (orden inverso de carga):
    //   "Mod B"
    //   "Mod A"
    //   "Original"
}
```

Por eso **siempre llamar a `super`** es critico. Si Mod A no llama a `super.Say()`, entonces el `Say()` original nunca se ejecuta. Si Mod B no llama a `super.Say()`, entonces el `Say()` de Mod A nunca se ejecuta. Un mod saltandose `super` rompe toda la cadena.

### Representacion Visual

```
new ModMe() crea una instancia con esta cadena de herencia:

  ModMe (version de Mod B)      <-- Instanciado
    |
    super -> ModMe (version de Mod A)
               |
               super -> ModMe (Vanilla original)
```

---

## Que Puedes Hacer en una Clase Modded

### 1. Sobreescribir Metodos Existentes

El uso mas comun. Agrega comportamiento antes o despues del codigo vanilla.

```c
modded class PlayerBase
{
    override void Init()
    {
        super.Init();  // Dejar que la inicializacion vanilla ocurra primero
        Print("[MyMod] Player initialized: " + GetType());
    }
}
```

### 2. Agregar Nuevos Campos (Variables Miembro)

Extiende la clase con nuevos datos. Cada instancia de la clase modded tendra estos campos.

```c
modded class PlayerBase
{
    protected int m_KillStreak;
    protected float m_LastKillTime;
    protected ref array<string> m_Achievements;

    override void Init()
    {
        super.Init();
        m_KillStreak = 0;
        m_LastKillTime = 0;
        m_Achievements = new array<string>;
    }
}
```

### 3. Agregar Nuevos Metodos

Agrega funcionalidad completamente nueva que otras partes de tu mod pueden llamar.

```c
modded class PlayerBase
{
    protected int m_Reputation;

    override void Init()
    {
        super.Init();
        m_Reputation = 0;
    }

    void AddReputation(int amount)
    {
        m_Reputation += amount;
        if (m_Reputation > 1000)
            Print("[MyMod] " + GetIdentity().GetName() + " is now a legend!");
    }

    int GetReputation()
    {
        return m_Reputation;
    }

    bool IsHeroStatus()
    {
        return m_Reputation >= 500;
    }
}
```

### 4. Acceder a Miembros Privados de la Clase Original

A diferencia de la herencia normal donde los miembros `private` son inaccesibles, **las clases modded PUEDEN acceder a miembros privados** de la clase original. Esta es una regla especial de la palabra clave `modded`.

```c
// Clase vanilla
class VanillaClass
{
    private int m_SecretValue;

    private void DoSecretThing()
    {
        Print("Secret!");
    }
}

// La clase modded PUEDE acceder a miembros privados
modded class VanillaClass
{
    void ExposeSecret()
    {
        Print(m_SecretValue);  // OK! Las clases modded evitan private
        DoSecretThing();       // OK! Pueden llamar metodos privados tambien
    }
}
```

Esto es poderoso pero debe usarse con cuidado. Los miembros privados son privados por una razon --- pueden cambiar entre actualizaciones de DayZ.

### 5. Sobreescribir Constantes

Las clases modded pueden redefinir constantes:

```c
// Vanilla
class GameSettings
{
    const int MAX_PLAYERS = 60;
}

// Modded
modded class GameSettings
{
    const int MAX_PLAYERS = 100;  // Sobreescribe el valor original
}
```

---

## Objetivos Comunes de Modding

Estas son las clases en las que virtualmente todos los mods de DayZ se enganchan. Entender lo que cada una ofrece es esencial.

### MissionServer

Se ejecuta en el servidor dedicado. Maneja el arranque del servidor, conexiones de jugadores y el bucle del juego.

```c
modded class MissionServer
{
    protected ref MyServerManager m_MyManager;

    override void OnInit()
    {
        super.OnInit();

        // Inicializar tus sistemas del lado del servidor
        m_MyManager = new MyServerManager;
        m_MyManager.Init();
        Print("[MyMod] Server systems initialized");
    }

    override void OnMissionStart()
    {
        super.OnMissionStart();
        Print("[MyMod] Mission started");
    }

    override void OnMissionFinish()
    {
        // Limpiar ANTES de super (super puede destruir sistemas de los que dependemos)
        if (m_MyManager)
            m_MyManager.Shutdown();

        super.OnMissionFinish();
    }

    // Se llama cuando un jugador se conecta
    override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)
    {
        super.InvokeOnConnect(player, identity);

        if (identity)
            Print("[MyMod] Player connected: " + identity.GetName());
    }

    // Se llama cuando un jugador se desconecta
    override void InvokeOnDisconnect(PlayerBase player)
    {
        if (player && player.GetIdentity())
            Print("[MyMod] Player disconnected: " + player.GetIdentity().GetName());

        super.InvokeOnDisconnect(player);
    }

    // Se llama en cada tick del servidor
    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (m_MyManager)
            m_MyManager.Update(timeslice);
    }
}
```

### MissionGameplay

Se ejecuta en el cliente. Maneja la UI del lado del cliente, input y hooks de renderizado.

```c
modded class MissionGameplay
{
    protected ref MyHUDPanel m_MyHUD;

    override void OnInit()
    {
        super.OnInit();

        m_MyHUD = new MyHUDPanel;
        Print("[MyMod] Client HUD initialized");
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (m_MyHUD)
            m_MyHUD.Update(timeslice);
    }

    override void OnKeyPress(int key)
    {
        super.OnKeyPress(key);

        // Abrir menu personalizado con F5
        if (key == KeyCode.KC_F5)
        {
            if (m_MyHUD)
                m_MyHUD.Toggle();
        }
    }

    override void OnMissionFinish()
    {
        if (m_MyHUD)
            m_MyHUD.Destroy();

        super.OnMissionFinish();
    }
}
```

### PlayerBase

La clase del jugador. Cada jugador vivo en el juego es una instancia de `PlayerBase` (o una subclase como `SurvivorBase`). Moddear esta clase es como agregas funciones por jugador.

```c
modded class PlayerBase
{
    protected bool m_IsGodMode;
    protected float m_CustomTimer;

    override void Init()
    {
        super.Init();
        m_IsGodMode = false;
        m_CustomTimer = 0;
    }

    // Se llama cada frame en el servidor para este jugador
    override void CommandHandler(float pDt, int pCurrentCommandID, bool pCurrentCommandFinished)
    {
        super.CommandHandler(pDt, pCurrentCommandID, pCurrentCommandFinished);

        // Tick por jugador del lado del servidor
        if (GetGame().IsServer())
        {
            m_CustomTimer += pDt;
            if (m_CustomTimer >= 60.0)  // Cada 60 segundos
            {
                m_CustomTimer = 0;
                OnMinuteElapsed();
            }
        }
    }

    void SetGodMode(bool enabled)
    {
        m_IsGodMode = enabled;
    }

    // Sobreescribir dano para implementar god mode
    override void EEHitBy(TotalDamageResult damageResult, int damageType, EntityAI source,
                          int component, string dmgZone, string ammo,
                          vector modelPos, float speedCoef)
    {
        if (m_IsGodMode)
            return;  // Omitir dano completamente

        super.EEHitBy(damageResult, damageType, source, component, dmgZone, ammo, modelPos, speedCoef);
    }

    protected void OnMinuteElapsed()
    {
        // Logica periodica personalizada
    }
}
```

### ItemBase

La clase base para todos los items. Moddear esto afecta a cada item en el juego.

```c
modded class ItemBase
{
    override void SetActions()
    {
        super.SetActions();

        // Agregar una accion personalizada a TODOS los items
        AddAction(MyInspectAction);
    }

    override void EEItemLocationChanged(notnull InventoryLocation oldLoc, notnull InventoryLocation newLoc)
    {
        super.EEItemLocationChanged(oldLoc, newLoc);

        // Rastrear cuando los items se mueven
        Print(string.Format("[MyMod] %1 moved from %2 to %3",
            GetType(), oldLoc.GetType(), newLoc.GetType()));
    }
}
```

### DayZGame

La clase global del juego. Disponible durante todo el ciclo de vida del juego.

```c
modded class DayZGame
{
    void DayZGame()
    {
        // Constructor: inicializacion muy temprana
        Print("[MyMod] DayZGame constructor - extremely early init");
    }

    override void OnUpdate(bool doSim, float timeslice)
    {
        super.OnUpdate(doSim, timeslice);

        // Tick de actualizacion global (tanto cliente como servidor)
    }
}
```

### CarScript

La clase base de vehiculos. Moddeala para cambiar el comportamiento de todos los vehiculos.

```c
modded class CarScript
{
    protected float m_BoostMultiplier;

    override void OnEngineStart()
    {
        super.OnEngineStart();
        m_BoostMultiplier = 1.0;
        Print("[MyMod] Vehicle engine started: " + GetType());
    }

    override void OnEngineStop()
    {
        super.OnEngineStop();
        Print("[MyMod] Vehicle engine stopped: " + GetType());
    }
}
```

---

## Guardas `#ifdef` para Dependencias Opcionales

Cuando tu mod opcionalmente soporta otro mod, usa guardas de preprocesador. Si el otro mod define un simbolo en su `config.cpp` (via `CfgPatches`), puedes verificarlo en tiempo de compilacion.

### Como Funciona

El nombre de clase `CfgPatches` de cada mod se convierte en un simbolo de preprocesador. Por ejemplo, si un mod tiene:

```cpp
class CfgPatches
{
    class MyAI_Scripts
    {
        // ...
    };
};
```

Entonces `#ifdef MyAI_Scripts` sera `true` cuando ese mod este cargado.

Muchos mods tambien definen simbolos explicitos. La convencion varia --- consulta la documentacion del mod o el `config.cpp`.

### Patron Basico

```c
modded class PlayerBase
{
    override void Init()
    {
        super.Init();

        // Este codigo SOLO compila cuando MyAI esta presente
        #ifdef MyAI
            MyAIManager mgr = MyAIManager.GetInstance();
            if (mgr)
                mgr.RegisterPlayer(this);
        #endif
    }
}
```

### Guardas de Servidor vs Cliente

```c
modded class MissionBase
{
    override void OnInit()
    {
        super.OnInit();

        // Codigo solo del servidor
        #ifdef SERVER
            InitServerSystems();
        #endif

        // Codigo solo del cliente (tambien se ejecuta en listen-server host)
        #ifndef SERVER
            InitClientHUD();
        #endif
    }

    #ifdef SERVER
    protected void InitServerSystems()
    {
        Print("[MyMod] Server systems started");
    }
    #endif

    #ifndef SERVER
    protected void InitClientHUD()
    {
        Print("[MyMod] Client HUD started");
    }
    #endif
}
```

### Compatibilidad Multi-Mod

Aqui hay un patron del mundo real para un mod que mejora a los jugadores, con soporte opcional para dos otros mods:

```c
modded class PlayerBase
{
    protected int m_BountyPoints;

    override void Init()
    {
        super.Init();
        m_BountyPoints = 0;
    }

    void AddBounty(int amount)
    {
        m_BountyPoints += amount;

        // Si Expansion Notifications esta cargado, mostrar una notificacion elegante
        #ifdef EXPANSIONMODNOTIFICATION
            ExpansionNotification("Bounty!", string.Format("+%1 points", amount)).Create(GetIdentity());
        #else
            // Alternativa: notificacion simple
            NotificationSystem.SendNotificationToPlayerExtended(this, 5, "Bounty",
                string.Format("+%1 points", amount), "");
        #endif

        // Si un mod de trader esta cargado, actualizar el balance del jugador
        #ifdef TraderPlus
            // Llamada a la API especifica de TraderPlus
        #endif
    }
}
```

---

## Patrones Profesionales de Mods Reales

### Patron 1: Envolvimiento No Destructivo de Metodos (Estilo COT)

Community Online Tools envuelve metodos haciendo trabajo antes y despues de `super`, sin reemplazar completamente el comportamiento:

```c
modded class MissionServer
{
    // Nuevo campo agregado por COT
    protected ref JMPlayerModule m_JMPlayerModule;

    override void OnInit()
    {
        super.OnInit();  // Toda la inicializacion vanilla ocurre

        // COT agrega su propia inicializacion DESPUES de vanilla
        m_JMPlayerModule = new JMPlayerModule;
        m_JMPlayerModule.Init();
    }

    override void InvokeOnConnect(PlayerBase player, PlayerIdentity identity)
    {
        // COT hace pre-procesamiento
        if (identity)
            m_JMPlayerModule.OnClientConnect(identity);

        // Luego deja que vanilla (y otros mods) lo manejen
        super.InvokeOnConnect(player, identity);

        // COT hace post-procesamiento
        if (identity)
            m_JMPlayerModule.OnClientReady(identity);
    }
}
```

### Patron 2: Override Condicional (Estilo VPP)

VPP Admin Tools verifica condiciones antes de decidir si modifica el comportamiento:

```c
#ifndef VPPNOTIFICATIONS
modded class MissionGameplay
{
    private ref VPPNotificationUI m_NotificationUI;

    override void OnInit()
    {
        super.OnInit();
        m_NotificationUI = new VPPNotificationUI;
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (m_NotificationUI)
            m_NotificationUI.OnUpdate(timeslice);
    }
}
#endif
```

Nota la guarda `#ifndef VPPNOTIFICATIONS` --- esto previene que el codigo compile si el mod de notificaciones independiente ya esta cargado, evitando conflictos.

### Patron 3: Inyeccion de Eventos (Estilo Expansion)

DayZ Expansion inyecta eventos en clases vanilla para transmitir informacion a sus propios sistemas:

```c
modded class PlayerBase
{
    override void EEKilled(Object killer)
    {
        // Disparar el sistema de eventos de Expansion antes del manejo de muerte vanilla
        ExpansionEventBus.Fire("OnPlayerKilled", this, killer);

        super.EEKilled(killer);

        // Procesamiento post-muerte
        ExpansionEventBus.Fire("OnPlayerKilledPost", this, killer);
    }

    override void OnConnect()
    {
        super.OnConnect();
        ExpansionEventBus.Fire("OnPlayerConnect", this);
    }
}
```

### Patron 4: Registro de Funciones (Estilo Community Framework)

Los mods de CF registran funciones en constructores, manteniendo la inicializacion centralizada:

```c
modded class DayZGame
{
    void DayZGame()
    {
        // CF registra sus sistemas en el constructor de DayZGame
        // Esto se ejecuta extremadamente temprano, antes de que se cargue cualquier mision
        CF_ModuleManager.RegisterModule(MyCFModule);
    }
}

modded class MissionServer
{
    void MissionServer()
    {
        // Constructor: se ejecuta cuando MissionServer se crea por primera vez
        // Registrar RPCs aqui
        GetRPCManager().AddRPC("MyMod", "RPC_HandleRequest", this, SingleplayerExecutionType.Both);
    }
}
```

---

## Reglas y Mejores Practicas

### Regla 1: SIEMPRE Llamar a `super`

A menos que tengas una razon deliberada y bien comprendida para reemplazar completamente el comportamiento del padre, siempre llama a `super`. No hacerlo rompe la cadena de mods y puede crashear servidores.

```c
// La REGLA DE ORO de las clases modded
modded class AnyClass
{
    override void AnyMethod()
    {
        super.AnyMethod();  // SIEMPRE a menos que reemplaces intencionalmente
        // Tu codigo aqui
    }
}
```

Cuando intencionalmente omitas `super`, documenta por que:

```c
modded class PlayerBase
{
    // Intencionalmente NO llamando a super para deshabilitar completamente el dano por caida
    // ADVERTENCIA: Esto tambien prevendra que otros mods ejecuten su codigo de dano por caida
    override void EEHitBy(TotalDamageResult damageResult, int damageType, EntityAI source,
                          int component, string dmgZone, string ammo,
                          vector modelPos, float speedCoef)
    {
        // Verificar si es dano por caida
        if (ammo == "FallDamage")
            return;  // Ignorar silenciosamente

        // Para todo otro dano, llamar a la cadena normal
        super.EEHitBy(damageResult, damageType, source, component, dmgZone, ammo, modelPos, speedCoef);
    }
}
```

### Regla 2: Inicializar Nuevos Campos en el Override Correcto

Cuando agregas campos a una clase modded, inicializalos en el metodo de ciclo de vida apropiado, no en cualquier lugar:

| Clase | Inicializar en | Por que |
|-------|--------------|-----|
| `PlayerBase` | `override void Init()` | Se llama una vez cuando se crea la entidad del jugador |
| `ItemBase` | constructor o `override void InitItemVariables()` | Creacion del item |
| `MissionServer` | `override void OnInit()` | Arranque de la mision del servidor |
| `MissionGameplay` | `override void OnInit()` | Arranque de la mision del cliente |
| `DayZGame` | constructor `void DayZGame()` | El punto mas temprano posible |
| `CarScript` | constructor o `override void EOnInit(IEntity other, int extra)` | Creacion del vehiculo |

### Regla 3: Protegerse Contra Null

En clases modded, frecuentemente trabajas con objetos que pueden no estar inicializados aun (porque te estas ejecutando antes o despues de otro codigo):

```c
modded class PlayerBase
{
    override void CommandHandler(float pDt, int pCurrentCommandID, bool pCurrentCommandFinished)
    {
        super.CommandHandler(pDt, pCurrentCommandID, pCurrentCommandFinished);

        // Siempre verificar: estamos ejecutando en el servidor?
        if (!GetGame().IsServer())
            return;

        // Siempre verificar: esta el jugador vivo?
        if (!IsAlive())
            return;

        // Siempre verificar: tiene el jugador una identidad?
        PlayerIdentity identity = GetIdentity();
        if (!identity)
            return;

        // Ahora es seguro usar identity
        string uid = identity.GetPlainId();
    }
}
```

### Regla 4: No Romper Otros Mods

Tu clase modded es parte de una cadena. Respeta el contrato:

- No absorber eventos silenciosamente (siempre llama a `super` a menos que sobreescribas deliberadamente)
- No sobreescribir campos que otros mods pudieron haber establecido (agrega tus propios campos en su lugar)
- Usa guardas `#ifdef` para dependencias opcionales
- Prueba con otros mods populares cargados

### Regla 5: Usa Prefijos Descriptivos en los Campos

Cuando agregues campos a una clase modded, prefija con el nombre de tu mod para evitar colisiones con otros mods que agregan campos a la misma clase:

```c
modded class PlayerBase
{
    // MAL: nombre generico, podria colisionar con otro mod
    protected int m_Points;

    // BIEN: prefijo especifico del mod
    protected int m_MyMod_Points;
    protected float m_MyMod_LastSync;
    protected ref array<string> m_MyMod_Unlocks;
}
```

---

## Errores Comunes

### 1. No Llamar a `super` (El Bug #1 que Rompe Mods)

Esto no se puede enfatizar lo suficiente. Cada vez que veas un reporte de bug que dice "El Mod X se rompio cuando agregue el Mod Y", lo primero que hay que verificar es si alguien olvido llamar a `super`.

```c
// ESTO ROMPE TODO LO QUE ESTA DESPUES
modded class MissionServer
{
    override void OnInit()
    {
        // Sin llamada a super.OnInit()!
        // Cada mod cargado antes de este tiene su OnInit omitido
        Print("My mod started!");
    }
}
```

### 2. Sobreescribir un Metodo que No Existe

Si intentas hacer `override` de un metodo que no existe en la clase padre, obtienes un error de compilacion. Esto usualmente ocurre cuando:
- Escribiste mal el nombre del metodo
- Estas sobreescribiendo un metodo de la clase equivocada
- Una actualizacion de DayZ renombro o elimino el metodo

```c
modded class PlayerBase
{
    // ERROR: no existe tal metodo en PlayerBase
    // override void OnPlayerSpawned()

    // Nombre de metodo CORRECTO:
    override void OnConnect()
    {
        super.OnConnect();
    }
}
```

### 3. Moddear la Clase Equivocada

Un error comun de principiantes es moddear una clase que parece correcta por su nombre pero esta en la capa de script equivocada:

```c
// INCORRECTO: MissionBase es la base abstracta -- tus hooks aqui pueden no dispararse
// cuando lo esperas
modded class MissionBase
{
    override void OnInit()
    {
        super.OnInit();
        // Esto se ejecuta para TODOS los tipos de mision -- pero es lo que quieres?
    }
}

// CORRECTO: Elige la clase especifica para tu objetivo
// Para logica del servidor:
modded class MissionServer
{
    override void OnInit() { super.OnInit(); /* codigo del servidor */ }
}

// Para UI del cliente:
modded class MissionGameplay
{
    override void OnInit() { super.OnInit(); /* codigo del cliente */ }
}
```

### 4. Procesamiento Pesado en Overrides Por-Frame

Metodos como `OnUpdate()` y `CommandHandler()` se ejecutan cada tick o cada frame. Agregar logica costosa aqui destruye el rendimiento del servidor/cliente:

```c
modded class PlayerBase
{
    // MAL: se ejecuta cada frame para cada jugador
    override void CommandHandler(float pDt, int pCurrentCommandID, bool pCurrentCommandFinished)
    {
        super.CommandHandler(pDt, pCurrentCommandID, pCurrentCommandFinished);

        // Esto crea y destruye un array CADA FRAME para CADA JUGADOR
        array<Man> players = new array<Man>;
        GetGame().GetPlayers(players);
        foreach (Man m : players)
        {
            // O(n^2) por frame!
        }
    }
}

// BIEN: usa un timer para limitar operaciones costosas
modded class PlayerBase
{
    protected float m_MyMod_Timer;

    override void CommandHandler(float pDt, int pCurrentCommandID, bool pCurrentCommandFinished)
    {
        super.CommandHandler(pDt, pCurrentCommandID, pCurrentCommandFinished);

        if (!GetGame().IsServer())
            return;

        m_MyMod_Timer += pDt;
        if (m_MyMod_Timer < 5.0)  // Cada 5 segundos, no cada frame
            return;

        m_MyMod_Timer = 0;
        DoExpensiveWork();
    }

    protected void DoExpensiveWork()
    {
        // Logica periodica aqui
    }
}
```

### 5. Olvidar Guardas `#ifdef` para Dependencias Opcionales

Si tu mod referencia una clase de otro mod sin guardas `#ifdef`, fallara en compilar cuando ese mod no este cargado:

```c
modded class PlayerBase
{
    override void Init()
    {
        super.Init();

        // MAL: error de compilacion si ExpansionMod no esta cargado
        // ExpansionHumanity.AddKarma(this, 10);

        // BIEN: protegido con #ifdef
        #ifdef EXPANSIONMODCORE
            ExpansionHumanity.AddKarma(this, 10);
        #endif
    }
}
```

### 6. Destructores: Limpiar Antes de `super`

Cuando sobreescribas destructores o metodos de limpieza, haz tu limpieza **antes** de llamar a `super`, ya que `super` puede destruir recursos de los que dependes:

```c
modded class MissionServer
{
    protected ref MyManager m_MyManager;

    override void OnMissionFinish()
    {
        // Limpiar TUS cosas primero
        if (m_MyManager)
        {
            m_MyManager.Save();
            m_MyManager.Shutdown();
        }
        m_MyManager = null;

        // LUEGO dejar que vanilla y otros mods limpien
        super.OnMissionFinish();
    }
}
```

---

## Nombres de Archivos y Organizacion

Los archivos de clases modded deben seguir una convencion de nombres clara para que puedas saber de un vistazo que clase se esta moddeando y por cual mod:

```
MyMod/
  Scripts/
    3_Game/
      MyMod/
    4_World/
      MyMod/
        Entities/
          ManBase/
            MyMod_PlayerBase.c         <-- modded class PlayerBase
          ItemBase/
            MyMod_ItemBase.c           <-- modded class ItemBase
          Vehicles/
            MyMod_CarScript.c          <-- modded class CarScript
    5_Mission/
      MyMod/
        Mission/
          MyMod_MissionServer.c        <-- modded class MissionServer
          MyMod_MissionGameplay.c      <-- modded class MissionGameplay
```

Esto refleja la estructura de archivos de DayZ vanilla, haciendo facil encontrar cual archivo moddea cual clase.

---

## Ejercicios Practicos

### Ejercicio 1: Logger de Conexion de Jugadores
Crea un `modded class MissionServer` que imprima un mensaje en el log del servidor cada vez que un jugador se conecte o desconecte, incluyendo su nombre y UID. Asegurate de llamar a `super`.

### Ejercicio 2: Inspeccion de Items
Crea un `modded class ItemBase` que agregue un metodo `string GetInspectInfo()` que retorne un string formateado mostrando el nombre de clase del item, su salud y si esta arruinado. Sobreescribe un metodo apropiado para imprimir esta info cuando el item se coloca en las manos de un jugador.

### Ejercicio 3: God Mode de Admin
Crea un `modded class PlayerBase` que:
1. Agregue un campo `m_IsGodMode`
2. Agregue metodos `EnableGodMode()` y `DisableGodMode()`
3. Sobreescriba el metodo de dano `EEHitBy` para omitir dano cuando god mode esta activo
4. Siempre llame a `super` para dano normal (sin god mode)

### Ejercicio 4: Logger de Velocidad de Vehiculos
Crea un `modded class CarScript` que rastree la velocidad maxima alcanzada durante cada sesion del motor. Sobreescribe `OnEngineStart()` y `OnEngineStop()` para comenzar/terminar el rastreo. Imprime la velocidad maxima cuando el motor se detiene.

### Ejercicio 5: Integracion con Mods Opcionales
Crea un `modded class PlayerBase` que agregue un sistema de reputacion. Cuando un jugador mata un zombie, gana 1 punto. Usa guardas `#ifdef` para:
- Si el sistema de notificaciones de Expansion esta disponible, mostrar una notificacion
- Si un mod de trader esta disponible, agregar moneda
- Si ninguno esta disponible, recurrir a un simple mensaje Print()

---

## Resumen

| Concepto | Detalles |
|---------|---------|
| Sintaxis | `modded class ClassName { }` |
| Efecto | Reemplaza la clase original globalmente para todas las llamadas `new` |
| Encadenamiento | Multiples mods pueden moddear la misma clase; se encadenan en orden de carga |
| `super` | **Siempre llamarlo** a menos que reemplaces deliberadamente el comportamiento |
| Nuevos campos | Agregar con prefijos especificos del mod (`m_MyMod_FieldName`) |
| Nuevos metodos | Totalmente soportados; llamables desde cualquier lugar que tenga una referencia |
| Acceso privado | Las clases modded **pueden** acceder a miembros privados del original |
| Guardas `#ifdef` | Usar para dependencias opcionales de otros mods |
| Objetivos comunes | `MissionServer`, `MissionGameplay`, `PlayerBase`, `ItemBase`, `DayZGame`, `CarScript` |

### Los Tres Mandamientos de las Clases Modded

1. **Siempre llamar a `super`** --- a menos que tengas una razon documentada para no hacerlo
2. **Proteger dependencias opcionales con `#ifdef`** --- tu mod deberia funcionar solo
3. **Prefijar tus campos y metodos** --- evitar colisiones de nombres con otros mods

---

[Inicio](../README.md) | [<< Anterior: Clases y Herencia](03-classes-inheritance.md) | **Clases Modded** | [Siguiente: Control Flow >>](05-control-flow.md)
