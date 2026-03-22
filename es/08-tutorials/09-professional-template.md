# Capítulo 8.9: Plantilla Profesional de Mod

[Inicio](../README.md) | [<< Anterior: Construyendo una Superposición HUD](08-hud-overlay.md) | **Plantilla Profesional de Mod** | [Siguiente: Creando un Vehículo Personalizado >>](10-vehicle-mod.md)

---

> **Resumen:** Este capítulo proporciona una plantilla de mod completa y lista para producción con cada archivo que necesitas para un mod profesional de DayZ. A diferencia del [Capítulo 8.5](05-mod-template.md) que introduce el esqueleto inicial de InclementDab, esta es una plantilla con todas las funcionalidades con un sistema de configuración, manager singleton, RPC cliente-servidor, panel de UI, teclas de atajo, localización y automatización de compilación. Cada archivo está listo para copiar y pegar y está ampliamente comentado para explicar **por qué** existe cada línea.

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Estructura Completa del Directorio](#estructura-completa-del-directorio)
- [mod.cpp](#modcpp)
- [config.cpp](#configcpp)
- [Archivo de Constantes (3_Game)](#archivo-de-constantes-3_game)
- [Clase de Datos de Configuración (3_Game)](#clase-de-datos-de-configuración-3_game)
- [Definiciones de RPC (3_Game)](#definiciones-de-rpc-3_game)
- [Manager Singleton (4_World)](#manager-singleton-4_world)
- [Manejador de Eventos de Jugador (4_World)](#manejador-de-eventos-de-jugador-4_world)
- [Hook de Misión: Servidor (5_Mission)](#hook-de-misión-servidor-5_mission)
- [Hook de Misión: Cliente (5_Mission)](#hook-de-misión-cliente-5_mission)
- [Script del Panel de UI (5_Mission)](#script-del-panel-de-ui-5_mission)
- [Archivo de Layout](#archivo-de-layout)
- [stringtable.csv](#stringtablecsv)
- [Inputs.xml](#inputsxml)
- [Script de Compilación](#script-de-compilación)
- [Guía de Personalización](#guía-de-personalización)
- [Guía de Expansión de Funcionalidades](#guía-de-expansión-de-funcionalidades)
- [Próximos Pasos](#próximos-pasos)

---

## Descripción General

Un mod "Hello World" prueba que la cadena de herramientas funciona. Un mod profesional necesita mucho más:

| Aspecto | Hello World | Plantilla Profesional |
|---------|-------------|----------------------|
| Configuración | Valores hardcodeados | Configuración JSON con carga/guardado/valores predeterminados |
| Comunicación | Declaraciones Print | RPC enrutado por cadenas (cliente a servidor y viceversa) |
| Arquitectura | Un archivo, una función | Manager singleton, scripts en capas, ciclo de vida limpio |
| Interfaz de usuario | Ninguna | Panel de UI basado en layout con abrir/cerrar |
| Vinculación de teclas | Ninguna | Tecla personalizada en Opciones > Controles |
| Localización | Ninguna | stringtable.csv con 13 idiomas |
| Pipeline de compilación | Addon Builder manual | Script batch de un clic |
| Limpieza | Ninguna | Apagado correcto al finalizar la misión, sin fugas |

Esta plantilla te da todo esto listo para usar. Renombras los identificadores, eliminas los sistemas que no necesitas, y comienzas a construir tu funcionalidad real sobre una base sólida.

---

## Estructura Completa del Directorio

Este es el layout completo del código fuente. Cada archivo listado a continuación se proporciona como plantilla completa en este capítulo.

```
MyProfessionalMod/                          <-- Raíz del código fuente (vive en el drive P:)
    mod.cpp                                 <-- Metadatos del launcher
    Scripts/
        config.cpp                          <-- Registro con el motor (CfgPatches + CfgMods)
        Inputs.xml                          <-- Definiciones de teclas de atajo
        stringtable.csv                     <-- Cadenas localizadas (13 idiomas)
        3_Game/
            MyMod/
                MyModConstants.c            <-- Enums, cadena de versión, constantes compartidas
                MyModConfig.c               <-- Configuración serializable a JSON con valores predeterminados
                MyModRPC.c                  <-- Nombres de rutas RPC y registro
        4_World/
            MyMod/
                MyModManager.c              <-- Manager singleton (ciclo de vida, config, estado)
                MyModPlayerHandler.c        <-- Hooks de conexión/desconexión de jugadores
        5_Mission/
            MyMod/
                MyModMissionServer.c        <-- modded MissionServer (init/shutdown del servidor)
                MyModMissionClient.c        <-- modded MissionGameplay (init/shutdown del cliente)
                MyModUI.c                   <-- Script del panel de UI (abrir/cerrar/poblar)
        GUI/
            layouts/
                MyModPanel.layout           <-- Definición del layout de UI
    build.bat                               <-- Automatización de empaquetado PBO

Después de compilar, la carpeta distribuible del mod se ve así:

@MyProfessionalMod/                         <-- Lo que va en el servidor / Workshop
    mod.cpp
    addons/
        MyProfessionalMod_Scripts.pbo       <-- Empaquetado desde Scripts/
    keys/
        MyMod.bikey                         <-- Clave para servidores firmados
    meta.cpp                                <-- Metadatos del Workshop (auto-generados)
```

---

## mod.cpp

Este archivo controla lo que los jugadores ven en el launcher de DayZ. Se coloca en la raíz del mod, **no** dentro de `Scripts/`.

```cpp
// ==========================================================================
// mod.cpp - Identidad del mod para el launcher de DayZ
// Este archivo es leído por el launcher para mostrar información del mod en la lista.
// NO es compilado por el motor de script -- es pura metadata.
// ==========================================================================

// Nombre mostrado en la lista de mods del launcher y en la pantalla de mods del juego.
name         = "My Professional Mod";

// Tu nombre o nombre del equipo. Se muestra en la columna "Author".
author       = "YourName";

// Cadena de versión semántica. Actualiza esto con cada lanzamiento.
// El launcher muestra esto para que los jugadores sepan qué versión tienen.
version      = "1.0.0";

// Descripción corta mostrada al pasar el cursor sobre el mod en el launcher.
// Mantén menos de 200 caracteres para legibilidad.
overview     = "A professional mod template with config, RPC, UI, and keybinds.";

// Tooltip mostrado al pasar el cursor. Usualmente coincide con el nombre del mod.
tooltipOwned = "My Professional Mod";

// Opcional: ruta a una imagen de vista previa (relativa a la raíz del mod).
// Tamaño recomendado: 256x256 o 512x512, formato PAA o EDDS.
// Dejar vacío si aún no tienes imagen.
picture      = "";

// Opcional: logo mostrado en el panel de detalles del mod.
logo         = "";
logoSmall    = "";
logoOver     = "";

// Opcional: URL abierta cuando el jugador hace clic en "Website" en el launcher.
action       = "";
actionURL    = "";
```

---

## config.cpp

Este es el archivo más crítico. Registra tu mod con el motor, declara dependencias, conecta las capas de script, y opcionalmente establece defines del preprocesador e image sets.

Colócalo en `Scripts/config.cpp`.

```cpp
// ==========================================================================
// config.cpp - Registro con el motor
// El motor de DayZ lee esto para saber qué proporciona tu mod.
// Dos secciones importan: CfgPatches (grafo de dependencias) y CfgMods (carga de scripts).
// ==========================================================================

// --------------------------------------------------------------------------
// CfgPatches - Declaración de Dependencias
// El motor usa esto para determinar el orden de carga. Si tu mod depende de
// otro mod, lista la clase CfgPatches de ese mod en requiredAddons[].
// --------------------------------------------------------------------------
class CfgPatches
{
    // El nombre de clase DEBE ser globalmente único entre todos los mods.
    // Convención: NombreMod_Scripts (coincide con el nombre del PBO).
    class MyMod_Scripts
    {
        // units[] y weapons[] declaran clases de config definidas por este addon.
        // Para mods solo de script, deja estos vacíos. Se usan por mods
        // que definen nuevos ítems, armas o vehículos en config.cpp.
        units[] = {};
        weapons[] = {};

        // Versión mínima del motor. 0.1 funciona para todas las versiones actuales de DayZ.
        requiredVersion = 0.1;

        // Dependencias: lista nombres de clase CfgPatches de otros mods.
        // "DZ_Data" es el juego base -- cada mod debería depender de él.
        // Agrega "CF_Scripts" si usas Community Framework.
        // Agrega parches de otros mods si los extiendes.
        requiredAddons[] =
        {
            "DZ_Data"
        };
    };
};

// --------------------------------------------------------------------------
// CfgMods - Registro de Módulos de Script
// Le dice al motor dónde vive cada capa de script y qué defines establecer.
// --------------------------------------------------------------------------
class CfgMods
{
    // El nombre de clase aquí es el identificador interno de tu mod.
    // NO necesita coincidir con CfgPatches -- pero mantenerlos relacionados
    // hace que la base de código sea más fácil de navegar.
    class MyMod
    {
        // dir: el nombre de carpeta en el drive P: (o en el PBO).
        // Debe coincidir exactamente con el nombre de tu carpeta raíz real.
        dir = "MyProfessionalMod";

        // Nombre para mostrar (mostrado en Workbench y algunos logs del motor).
        name = "My Professional Mod";

        // Autor y descripción para metadata del motor.
        author = "YourName";
        overview = "Professional mod template";

        // Tipo de mod. Siempre "mod" para mods de script.
        type = "mod";

        // inputs: ruta a tu Inputs.xml para teclas de atajo personalizadas.
        // DEBE establecerse aquí para que el motor cargue tus teclas de atajo.
        inputs = "MyProfessionalMod/Scripts/Inputs.xml";

        // defines: símbolos del preprocesador establecidos cuando tu mod está cargado.
        // Otros mods pueden usar #ifdef MYMOD para detectar la presencia de tu mod
        // y compilar condicionalmente código de integración.
        defines[] = { "MYMOD" };

        // dependencies: qué módulos de script vanilla tu mod intercepta.
        // "Game" = 3_Game, "World" = 4_World, "Mission" = 5_Mission.
        // La mayoría de mods necesitan los tres. Agrega "Core" solo si usas 1_Core.
        dependencies[] =
        {
            "Game", "World", "Mission"
        };

        // defs: mapea cada módulo de script a su carpeta en disco.
        // El motor compila todos los archivos .c encontrados recursivamente en estas rutas.
        // No hay #include en Enforce Script -- así es como se cargan los archivos.
        class defs
        {
            // Capa Game (3_Game): se carga primero.
            // Coloca enums, constantes, clases de config, definiciones de RPC aquí.
            // NO PUEDE referenciar tipos de 4_World o 5_Mission.
            class gameScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/3_Game" };
            };

            // Capa World (4_World): se carga segundo.
            // Coloca managers, modificaciones de entidades, interacciones del mundo aquí.
            // PUEDE referenciar tipos de 3_Game. NO PUEDE referenciar tipos de 5_Mission.
            class worldScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/4_World" };
            };

            // Capa Mission (5_Mission): se carga último.
            // Coloca hooks de misión, paneles de UI, lógica de inicio/apagado aquí.
            // PUEDE referenciar tipos de todas las capas inferiores.
            class missionScriptModule
            {
                value = "";
                files[] = { "MyProfessionalMod/Scripts/5_Mission" };
            };
        };
    };
};
```

---

## Archivo de Constantes (3_Game)

Colócalo en `Scripts/3_Game/MyMod/MyModConstants.c`.

Este archivo define todas las constantes compartidas, enums y la cadena de versión. Vive en `3_Game` para que cada capa superior pueda acceder a estos valores.

```c
// ==========================================================================
// MyModConstants.c - Constantes y enums compartidos
// Capa 3_Game: disponible para todas las capas superiores (4_World, 5_Mission).
//
// POR QUÉ existe este archivo:
//   Centralizar constantes previene números mágicos dispersos entre archivos.
//   Los enums dan seguridad en tiempo de compilación en lugar de comparaciones con int crudos.
//   La cadena de versión se define una vez y se usa en logs y UI.
// ==========================================================================

// ---------------------------------------------------------------------------
// Versión - actualiza esto con cada lanzamiento
// ---------------------------------------------------------------------------
const string MYMOD_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Etiqueta de log - prefijo para todos los mensajes Print/log de este mod
// Usar una etiqueta consistente facilita filtrar el log de script.
// ---------------------------------------------------------------------------
const string MYMOD_TAG = "[MyMod]";

// ---------------------------------------------------------------------------
// Rutas de archivos - centralizadas para que los errores tipográficos se detecten en un solo lugar
// $profile: se resuelve al directorio de perfil del servidor en tiempo de ejecución.
// ---------------------------------------------------------------------------
const string MYMOD_CONFIG_DIR  = "$profile:MyMod";
const string MYMOD_CONFIG_PATH = "$profile:MyMod/config.json";

// ---------------------------------------------------------------------------
// Enum: Modos de funcionalidad
// Usa enums en lugar de ints crudos para legibilidad y verificaciones en tiempo de compilación.
// ---------------------------------------------------------------------------
enum MyModMode
{
    DISABLED = 0,    // La funcionalidad está desactivada
    PASSIVE  = 1,    // La funcionalidad se ejecuta pero no interfiere
    ACTIVE   = 2     // La funcionalidad está completamente habilitada
};

// ---------------------------------------------------------------------------
// Enum: Tipos de notificación (usados por UI para elegir icono/color)
// ---------------------------------------------------------------------------
enum MyModNotifyType
{
    INFO    = 0,
    SUCCESS = 1,
    WARNING = 2,
    ERROR   = 3
};
```

---

## Clase de Datos de Configuración (3_Game)

Colócalo en `Scripts/3_Game/MyMod/MyModConfig.c`.

Esta es una clase de configuración serializable a JSON. El servidor la carga al inicio. Si no existe ningún archivo, se usan los valores predeterminados y se guarda una configuración nueva en disco.

```c
// ==========================================================================
// MyModConfig.c - Configuración JSON con valores predeterminados
// Capa 3_Game para que tanto managers de 4_World como hooks de 5_Mission puedan leerla.
//
// CÓMO FUNCIONA:
//   JsonFileLoader<MyModConfig> usa el serializador JSON incorporado de Enforce Script.
//   Cada campo con un valor predeterminado se escribe/lee del archivo JSON. Agregar
//   un nuevo campo es seguro -- los archivos de config antiguos simplemente obtienen
//   el valor predeterminado para cualquier campo faltante.
//
// PARTICULARIDAD DE ENFORCE SCRIPT:
//   JsonFileLoader<T>.JsonLoadFile(path, obj) devuelve VOID.
//   NO PUEDES hacer: if (JsonFileLoader<T>.JsonLoadFile(...)) -- no compilará.
//   Siempre pasa un objeto pre-creado por referencia.
// ==========================================================================

class MyModConfig
{
    // --- Configuración General ---

    // Interruptor principal: si es false, todo el mod está deshabilitado.
    bool Enabled = true;

    // Con qué frecuencia (en segundos) el manager ejecuta su tick de actualización.
    // Valores más bajos = más responsivo pero mayor costo de CPU.
    float UpdateInterval = 5.0;

    // Cantidad máxima de ítems/entidades que este mod gestiona simultáneamente.
    int MaxItems = 100;

    // Modo: 0 = DISABLED, 1 = PASSIVE, 2 = ACTIVE (ver enum MyModMode).
    int Mode = 2;

    // --- Mensajes ---

    // Mensaje de bienvenida mostrado a los jugadores cuando se conectan.
    // Cadena vacía = sin mensaje.
    string WelcomeMessage = "Welcome to the server!";

    // Si mostrar el mensaje de bienvenida como notificación o mensaje de chat.
    bool WelcomeAsNotification = true;

    // --- Logging ---

    // Habilitar logging verboso de debug. Desactivar para servidores de producción.
    bool DebugLogging = false;

    // -----------------------------------------------------------------------
    // Load - lee config de disco, devuelve instancia con valores predeterminados si falta
    // -----------------------------------------------------------------------
    static MyModConfig Load()
    {
        // Siempre crear una instancia nueva primero. Esto asegura que todos los
        // valores predeterminados estén establecidos incluso si al archivo JSON le
        // faltan campos (ej: después de una actualización que agregó nuevas configuraciones).
        MyModConfig cfg = new MyModConfig();

        // Verificar si el archivo de config existe antes de intentar cargar.
        // En la primera ejecución, no existirá -- usamos valores predeterminados y guardamos.
        if (FileExist(MYMOD_CONFIG_PATH))
        {
            // JsonLoadFile pobla el objeto existente. NO devuelve un objeto nuevo.
            // Los campos presentes en el JSON sobreescriben los predeterminados;
            // los campos faltantes del JSON mantienen sus valores predeterminados.
            JsonFileLoader<MyModConfig>.JsonLoadFile(MYMOD_CONFIG_PATH, cfg);
        }
        else
        {
            // Primera ejecución: guardar valores predeterminados para que el admin tenga un archivo que editar.
            cfg.Save();
            Print(MYMOD_TAG + " No config found, created default at: " + MYMOD_CONFIG_PATH);
        }

        return cfg;
    }

    // -----------------------------------------------------------------------
    // Save - escribe valores actuales en disco como JSON formateado
    // -----------------------------------------------------------------------
    void Save()
    {
        // Asegurar que el directorio exista. MakeDirectory es seguro de llamar
        // incluso si el directorio ya existe.
        if (!FileExist(MYMOD_CONFIG_DIR))
        {
            MakeDirectory(MYMOD_CONFIG_DIR);
        }

        // JsonSaveFile escribe todos los campos como un objeto JSON.
        // El archivo se sobreescribe completamente -- no hay merge.
        JsonFileLoader<MyModConfig>.JsonSaveFile(MYMOD_CONFIG_PATH, this);
    }
};
```

El `config.json` resultante en disco se ve así:

```json
{
    "Enabled": true,
    "UpdateInterval": 5.0,
    "MaxItems": 100,
    "Mode": 2,
    "WelcomeMessage": "Welcome to the server!",
    "WelcomeAsNotification": true,
    "DebugLogging": false
}
```

Los administradores editan este archivo, reinician el servidor, y los nuevos valores toman efecto.

---

## Definiciones de RPC (3_Game)

Colócalo en `Scripts/3_Game/MyMod/MyModRPC.c`.

RPC (Llamada a Procedimiento Remoto) es cómo el cliente y el servidor se comunican en DayZ. Este archivo define nombres de rutas y proporciona métodos auxiliares para el registro.

```c
// ==========================================================================
// MyModRPC.c - Definiciones y auxiliares de rutas RPC
// Capa 3_Game: las constantes de nombre de ruta deben estar disponibles en todas partes.
// ==========================================================================

// ---------------------------------------------------------------------------
// ID de RPC - elige un número único que probablemente no colisione con otros mods.
// ---------------------------------------------------------------------------
const int MYMOD_RPC_ID = 74291;

// ---------------------------------------------------------------------------
// Nombres de Rutas RPC - identificadores de cadena para cada endpoint RPC.
// Usar constantes previene errores tipográficos y habilita búsqueda en IDE.
// ---------------------------------------------------------------------------
const string MYMOD_RPC_CONFIG_SYNC     = "MyMod:ConfigSync";
const string MYMOD_RPC_WELCOME         = "MyMod:Welcome";
const string MYMOD_RPC_PLAYER_DATA     = "MyMod:PlayerData";
const string MYMOD_RPC_UI_REQUEST      = "MyMod:UIRequest";
const string MYMOD_RPC_UI_RESPONSE     = "MyMod:UIResponse";

// ---------------------------------------------------------------------------
// MyModRPCHelper - clase de utilidad estática para enviar RPCs
// ---------------------------------------------------------------------------
class MyModRPCHelper
{
    // Enviar un mensaje de cadena del servidor a un cliente específico.
    static void SendStringToClient(PlayerIdentity identity, string routeName, string message)
    {
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(routeName);
        rpc.Write(message);
        rpc.Send(null, MYMOD_RPC_ID, true, identity);
    }

    // Enviar una solicitud del cliente al servidor (sin payload, solo la ruta).
    static void SendRequestToServer(string routeName)
    {
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(routeName);
        rpc.Send(null, MYMOD_RPC_ID, true, null);
    }
};
```

---

## Manager Singleton (4_World)

Colócalo en `Scripts/4_World/MyMod/MyModManager.c`.

Este es el cerebro central de tu mod del lado del servidor. Es dueño de la config, procesa RPC y ejecuta actualizaciones periódicas.

```c
// ==========================================================================
// MyModManager.c - Manager singleton del lado del servidor
// Capa 4_World: puede referenciar tipos de 3_Game (config, constantes, RPC).
// ==========================================================================

class MyModManager
{
    private static ref MyModManager s_Instance;
    protected ref MyModConfig m_Config;
    protected float m_TimeSinceUpdate;
    protected bool m_Initialized;

    static MyModManager GetInstance()
    {
        if (!s_Instance)
        {
            s_Instance = new MyModManager();
        }
        return s_Instance;
    }

    static void Cleanup()
    {
        s_Instance = null;
    }

    void Init()
    {
        if (m_Initialized) return;

        m_Config = MyModConfig.Load();

        if (!m_Config.Enabled)
        {
            Print(MYMOD_TAG + " Mod is DISABLED in config. Skipping initialization.");
            return;
        }

        m_TimeSinceUpdate = 0;
        m_Initialized = true;

        Print(MYMOD_TAG + " Manager initialized (v" + MYMOD_VERSION + ")");

        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " Debug logging enabled");
            Print(MYMOD_TAG + " Update interval: " + m_Config.UpdateInterval.ToString() + "s");
            Print(MYMOD_TAG + " Max items: " + m_Config.MaxItems.ToString());
        }
    }

    void OnUpdate(float timeslice)
    {
        if (!m_Initialized || !m_Config.Enabled) return;

        m_TimeSinceUpdate += timeslice;
        if (m_TimeSinceUpdate < m_Config.UpdateInterval) return;
        m_TimeSinceUpdate = 0;

        // --- La lógica de actualización periódica va aquí ---
        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " Periodic update tick");
        }
    }

    void Shutdown()
    {
        if (!m_Initialized) return;
        Print(MYMOD_TAG + " Manager shutting down");
        m_Initialized = false;
    }

    void OnUIRequest(PlayerIdentity sender, ParamsReadContext ctx)
    {
        if (!sender) return;

        if (m_Config.DebugLogging)
        {
            Print(MYMOD_TAG + " UI data requested by: " + sender.GetName());
        }

        string responseData = "Items: " + m_Config.MaxItems.ToString();
        MyModRPCHelper.SendStringToClient(sender, MYMOD_RPC_UI_RESPONSE, responseData);
    }

    void OnPlayerConnected(PlayerIdentity identity)
    {
        if (!m_Initialized || !m_Config.Enabled) return;
        if (!identity) return;

        if (m_Config.WelcomeMessage != "")
        {
            MyModRPCHelper.SendStringToClient(identity, MYMOD_RPC_WELCOME, m_Config.WelcomeMessage);

            if (m_Config.DebugLogging)
            {
                Print(MYMOD_TAG + " Sent welcome to: " + identity.GetName());
            }
        }
    }

    MyModConfig GetConfig()
    {
        return m_Config;
    }

    bool IsInitialized()
    {
        return m_Initialized;
    }
};
```

---

## Manejador de Eventos de Jugador (4_World)

Colócalo en `Scripts/4_World/MyMod/MyModPlayerHandler.c`.

Este usa el patrón de `modded class` para interceptar la entidad vanilla `PlayerBase` y detectar eventos de conexión/desconexión.

```c
// ==========================================================================
// MyModPlayerHandler.c - Hooks del ciclo de vida del jugador
// Capa 4_World: modded PlayerBase para interceptar conexión/desconexión.
// ==========================================================================

modded class PlayerBase
{
    protected bool m_MyModPlayerReady;

    override void Init()
    {
        super.Init();

        if (!GetGame().IsServer()) return;
        if (m_MyModPlayerReady) return;
        m_MyModPlayerReady = true;

        PlayerIdentity identity = GetIdentity();
        if (!identity) return;

        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnPlayerConnected(identity);
        }
    }
};
```

---

## Hook de Misión: Servidor (5_Mission)

Colócalo en `Scripts/5_Mission/MyMod/MyModMissionServer.c`.

Este se conecta a `MissionServer` para inicializar y apagar el mod del lado del servidor.

```c
// ==========================================================================
// MyModMissionServer.c - Hooks de misión del lado del servidor
// Capa 5_Mission: último en cargar, puede referenciar todas las capas inferiores.
// ==========================================================================

modded class MissionServer
{
    override void OnInit()
    {
        super.OnInit();
        MyModManager.GetInstance().Init();
        Print(MYMOD_TAG + " Server mission initialized");
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.OnUpdate(timeslice);
        }
    }

    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        if (rpc_type != MYMOD_RPC_ID) return;

        string routeName;
        if (!ctx.Read(routeName)) return;

        MyModManager mgr = MyModManager.GetInstance();
        if (!mgr) return;

        if (routeName == MYMOD_RPC_UI_REQUEST)
        {
            mgr.OnUIRequest(sender, ctx);
        }
        // Agrega más rutas aquí a medida que tu mod crece
    }

    override void OnMissionFinish()
    {
        MyModManager mgr = MyModManager.GetInstance();
        if (mgr)
        {
            mgr.Shutdown();
        }

        MyModManager.Cleanup();
        Print(MYMOD_TAG + " Server mission finished");
        super.OnMissionFinish();
    }
};
```

---

## Hook de Misión: Cliente (5_Mission)

Colócalo en `Scripts/5_Mission/MyMod/MyModMissionClient.c`.

Este se conecta a `MissionGameplay` para la inicialización del lado del cliente, manejo de entradas y recepción de RPC.

```c
// ==========================================================================
// MyModMissionClient.c - Hooks de misión del lado del cliente
// Capa 5_Mission.
// ==========================================================================

modded class MissionGameplay
{
    protected ref MyModUI m_MyModPanel;
    protected bool m_MyModInitialized;

    override void OnInit()
    {
        super.OnInit();
        m_MyModInitialized = true;
        Print(MYMOD_TAG + " Client mission initialized");
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_MyModInitialized) return;

        UAInput panelInput = GetUApi().GetInputByName("UAMyModPanel");
        if (panelInput && panelInput.LocalPress())
        {
            TogglePanel();
        }
    }

    override void OnRPC(PlayerIdentity sender, Object target, int rpc_type, ParamsReadContext ctx)
    {
        super.OnRPC(sender, target, rpc_type, ctx);

        if (rpc_type != MYMOD_RPC_ID) return;

        string routeName;
        if (!ctx.Read(routeName)) return;

        if (routeName == MYMOD_RPC_WELCOME)
        {
            string welcomeMsg;
            if (ctx.Read(welcomeMsg))
            {
                GetGame().Chat(welcomeMsg, "");
                Print(MYMOD_TAG + " Welcome message: " + welcomeMsg);
            }
        }
        else if (routeName == MYMOD_RPC_UI_RESPONSE)
        {
            string responseData;
            if (ctx.Read(responseData))
            {
                if (m_MyModPanel)
                {
                    m_MyModPanel.SetData(responseData);
                }
            }
        }
    }

    protected void TogglePanel()
    {
        if (m_MyModPanel && m_MyModPanel.IsOpen())
        {
            m_MyModPanel.Close();
            m_MyModPanel = null;
        }
        else
        {
            PlayerBase player = PlayerBase.Cast(GetGame().GetPlayer());
            if (!player || !player.IsAlive()) return;

            UIManager uiMgr = GetGame().GetUIManager();
            if (uiMgr && uiMgr.GetMenu()) return;

            m_MyModPanel = new MyModUI();
            m_MyModPanel.Open();

            MyModRPCHelper.SendRequestToServer(MYMOD_RPC_UI_REQUEST);
        }
    }

    override void OnMissionFinish()
    {
        if (m_MyModPanel)
        {
            m_MyModPanel.Close();
            m_MyModPanel = null;
        }

        m_MyModInitialized = false;
        Print(MYMOD_TAG + " Client mission finished");
        super.OnMissionFinish();
    }
};
```

---

## Script del Panel de UI (5_Mission)

Colócalo en `Scripts/5_Mission/MyMod/MyModUI.c`.

Este script maneja el panel de UI definido en el archivo `.layout`. Encuentra referencias de widgets, los pobla con datos, y maneja abrir/cerrar.

```c
// ==========================================================================
// MyModUI.c - Controlador del panel de UI
// Capa 5_Mission: puede referenciar todas las capas inferiores.
// ==========================================================================

class MyModUI
{
    protected ref Widget m_Root;
    protected TextWidget m_TitleText;
    protected TextWidget m_DataText;
    protected TextWidget m_VersionText;
    protected ButtonWidget m_CloseButton;
    protected bool m_IsOpen;

    void MyModUI()
    {
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyProfessionalMod/Scripts/GUI/layouts/MyModPanel.layout"
        );

        if (m_Root)
        {
            m_Root.Show(false);

            m_TitleText   = TextWidget.Cast(m_Root.FindAnyWidget("TitleText"));
            m_DataText    = TextWidget.Cast(m_Root.FindAnyWidget("DataText"));
            m_VersionText = TextWidget.Cast(m_Root.FindAnyWidget("VersionText"));
            m_CloseButton = ButtonWidget.Cast(m_Root.FindAnyWidget("CloseButton"));

            if (m_TitleText)
                m_TitleText.SetText("My Professional Mod");

            if (m_VersionText)
                m_VersionText.SetText("v" + MYMOD_VERSION);
        }
    }

    void Open()
    {
        if (!m_Root) return;

        m_Root.Show(true);
        m_IsOpen = true;

        GetGame().GetMission().PlayerControlDisable(INPUT_EXCLUDE_ALL);
        GetGame().GetUIManager().ShowUICursor(true);

        Print(MYMOD_TAG + " UI panel opened");
    }

    void Close()
    {
        if (!m_Root) return;

        m_Root.Show(false);
        m_IsOpen = false;

        GetGame().GetMission().PlayerControlEnable(true);
        GetGame().GetUIManager().ShowUICursor(false);

        Print(MYMOD_TAG + " UI panel closed");
    }

    void SetData(string data)
    {
        if (m_DataText)
        {
            m_DataText.SetText(data);
        }
    }

    bool IsOpen()
    {
        return m_IsOpen;
    }

    void ~MyModUI()
    {
        if (m_Root)
        {
            m_Root.Unlink();
        }
    }
};
```

---

## Archivo de Layout

Colócalo en `Scripts/GUI/layouts/MyModPanel.layout`.

Este define la estructura visual del panel de UI.

```
PanelWidgetClass MyModPanelRoot {
 position 0 0
 size 400 300
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
 color 0.1 0.1 0.12 0.92
 priority 100
 {
  PanelWidgetClass TitleBar {
   position 0 0
   size 1 36
   hexactpos 1
   vexactpos 1
   hexactsize 0
   vexactsize 1
   color 0.15 0.15 0.18 1
   {
    TextWidgetClass TitleText {
     position 12 0
     size 300 36
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     valign center_ref
     ignorepointer 1
     text "My Mod"
     font "gui/fonts/metron2"
     "exact size" 16
     color 1 1 1 0.9
    }
    TextWidgetClass VersionText {
     position 0 0
     size 80 36
     halign right_ref
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     valign center_ref
     ignorepointer 1
     text "v1.0.0"
     font "gui/fonts/metron2"
     "exact size" 12
     color 0.6 0.6 0.6 0.8
    }
   }
  }
  PanelWidgetClass ContentArea {
   position 0 40
   size 380 200
   halign center_ref
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   color 0 0 0 0
   {
    TextWidgetClass DataText {
     position 12 12
     size 356 160
     hexactpos 1
     vexactpos 1
     hexactsize 1
     vexactsize 1
     ignorepointer 1
     text "Waiting for data..."
     font "gui/fonts/metron2"
     "exact size" 14
     color 0.85 0.85 0.85 1
    }
   }
  }
  ButtonWidgetClass CloseButton {
   position 0 0
   size 100 32
   halign right_ref
   valign bottom_ref
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   text "Close"
   font "gui/fonts/metron2"
   "exact size" 14
  }
 }
}
```

---

## stringtable.csv

Colócalo en `Scripts/stringtable.csv`.

Este proporciona localización para todo el texto orientado al jugador. El motor lee la columna que coincide con el idioma del juego del jugador. La columna `original` es el respaldo.

DayZ soporta 13 columnas de idioma. Cada fila debe tener las 13 columnas (usa el texto en inglés como marcador de posición para idiomas que no traduzcas).

```csv
"Language","original","english","czech","german","russian","polish","hungarian","italian","spanish","french","chinese","japanese","portuguese","chinesesimp",
"STR_MYMOD_INPUT_GROUP","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod","My Mod",
"STR_MYMOD_INPUT_PANEL","Open Panel","Open Panel","Otevrit Panel","Panel offnen","Otkryt Panel","Otworz Panel","Panel megnyitasa","Apri Pannello","Abrir Panel","Ouvrir Panneau","Open Panel","Open Panel","Abrir Painel","Open Panel",
"STR_MYMOD_TITLE","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod","My Professional Mod",
"STR_MYMOD_CLOSE","Close","Close","Zavrit","Schliessen","Zakryt","Zamknij","Bezaras","Chiudi","Cerrar","Fermer","Close","Close","Fechar","Close",
"STR_MYMOD_WELCOME","Welcome!","Welcome!","Vitejte!","Willkommen!","Dobro pozhalovat!","Witaj!","Udvozoljuk!","Benvenuto!","Bienvenido!","Bienvenue!","Welcome!","Welcome!","Bem-vindo!","Welcome!",
```

**Importante:** Cada línea debe terminar con una coma final después de la última columna de idioma. Este es un requisito del analizador CSV de DayZ.

---

## Inputs.xml

Colócalo en `Scripts/Inputs.xml`.

Este define teclas de atajo personalizadas que aparecen en el menú Opciones > Controles del juego. El campo `inputs` en CfgMods de `config.cpp` debe apuntar a este archivo.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <!-- Declarar la acción de entrada. -->
        <actions>
            <input name="UAMyModPanel" loc="STR_MYMOD_INPUT_PANEL" />
        </actions>

        <!-- Agrupar bajo una categoría en Opciones > Controles. -->
        <sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
            <input name="UAMyModPanel"/>
        </sorting>
    </inputs>

    <!-- Preset de tecla predeterminada. Los jugadores pueden reconfigurar en Opciones > Controles. -->
    <preset>
        <!-- Vincular a la tecla Home por defecto. -->
        <input name="UAMyModPanel">
            <btn name="kHome"/>
        </input>
    </preset>
</modded_inputs>
```

---

## Script de Compilación

Colócalo en `build.bat` en la raíz del mod.

Este archivo batch automatiza el empaquetado PBO usando Addon Builder de DayZ Tools.

```batch
@echo off
REM ==========================================================================
REM build.bat - Empaquetado PBO automatizado para MyProfessionalMod
REM ==========================================================================

REM --- Configuración: actualiza estas rutas para que coincidan con tu setup ---

set DAYZ_TOOLS=C:\Program Files (x86)\Steam\steamapps\common\DayZ Tools
set SOURCE=P:\MyProfessionalMod\Scripts
set OUTPUT=P:\@MyProfessionalMod\addons
set PREFIX=MyProfessionalMod\Scripts

echo ============================================
echo  Building MyProfessionalMod
echo ============================================

if not exist "%OUTPUT%" mkdir "%OUTPUT%"

echo Packing PBO...
"%DAYZ_TOOLS%\Bin\AddonBuilder\AddonBuilder.exe" "%SOURCE%" "%OUTPUT%" -prefix=%PREFIX% -clear

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: PBO packing failed! Check the output above for details.
    pause
    exit /b 1
)

echo Copying mod.cpp...
copy /Y "P:\MyProfessionalMod\mod.cpp" "P:\@MyProfessionalMod\mod.cpp" >nul

echo.
echo ============================================
echo  Build complete!
echo  Output: P:\@MyProfessionalMod\
echo ============================================
echo.
echo To test with file patching (no PBO needed):
echo   DayZDiag_x64.exe -mod=P:\MyProfessionalMod -filePatching
echo.
echo To test with the built PBO:
echo   DayZDiag_x64.exe -mod=P:\@MyProfessionalMod
echo.
pause
```

---

## Guía de Personalización

Cuando uses esta plantilla para tu propio mod, necesitas renombrar cada ocurrencia de los nombres de marcador de posición. Aquí hay una lista completa.

### Paso 1: Elige Tus Nombres

Decide estos identificadores antes de hacer cualquier edición:

| Identificador | Ejemplo | Reglas |
|----------------|---------|--------|
| **Nombre de carpeta del mod** | `MyBountySystem` | Sin espacios, PascalCase o guiones bajos |
| **Nombre para mostrar** | `"My Bounty System"` | Legible por humanos, para mod.cpp y config.cpp |
| **Clase CfgPatches** | `MyBountySystem_Scripts` | Debe ser globalmente único entre todos los mods |
| **Clase CfgMods** | `MyBountySystem` | Identificador interno del motor |
| **Prefijo de script** | `MyBounty` | Prefijo corto para clases: `MyBountyManager`, `MyBountyConfig` |
| **Constante de etiqueta** | `MYBOUNTY_TAG` | Para mensajes de log: `"[MyBounty]"` |
| **Define del preprocesador** | `MYBOUNTYSYSTEM` | Para detección `#ifdef` entre mods |
| **ID de RPC** | `58432` | Número único de 5 dígitos, no usado por otros mods |
| **Nombre de acción de entrada** | `UAMyBountyPanel` | Comienza con `UA`, único |

### Paso 2: Renombrar Archivos y Carpetas

Renombra cada archivo y carpeta que contenga "MyMod" o "MyProfessionalMod":

```
MyProfessionalMod/           -> MyBountySystem/
  Scripts/3_Game/MyMod/      -> Scripts/3_Game/MyBounty/
    MyModConstants.c          -> MyBountyConstants.c
    MyModConfig.c             -> MyBountyConfig.c
    MyModRPC.c                -> MyBountyRPC.c
  Scripts/4_World/MyMod/     -> Scripts/4_World/MyBounty/
    MyModManager.c            -> MyBountyManager.c
    MyModPlayerHandler.c      -> MyBountyPlayerHandler.c
  Scripts/5_Mission/MyMod/   -> Scripts/5_Mission/MyBounty/
    MyModMissionServer.c      -> MyBountyMissionServer.c
    MyModMissionClient.c      -> MyBountyMissionClient.c
    MyModUI.c                 -> MyBountyUI.c
  Scripts/GUI/layouts/
    MyModPanel.layout          -> MyBountyPanel.layout
```

### Paso 3: Buscar-y-Reemplazar en Cada Archivo

Realiza estos reemplazos **en orden** (cadenas más largas primero para evitar coincidencias parciales):

| Buscar | Reemplazar | Archivos Afectados |
|--------|------------|-------------------|
| `MyProfessionalMod` | `MyBountySystem` | config.cpp, mod.cpp, build.bat, script de UI |
| `MyModManager` | `MyBountyManager` | Manager, hooks de misión, manejador de jugadores |
| `MyModConfig` | `MyBountyConfig` | Clase de config, manager |
| `MyModUI` | `MyBountyUI` | Script de UI, hook de misión del cliente |
| `MyMod_Scripts` | `MyBountySystem_Scripts` | config.cpp CfgPatches |
| `MYMOD_RPC_ID` | `MYBOUNTY_RPC_ID` | Constantes, RPC, hooks de misión |
| `MYMOD_RPC_` | `MYBOUNTY_RPC_` | Todas las constantes de rutas RPC |
| `MYMOD_TAG` | `MYBOUNTY_TAG` | Constantes, todos los archivos que usan la etiqueta de log |
| `MYMOD_CONFIG` | `MYBOUNTY_CONFIG` | Constantes, clase de config |
| `MYMOD_VERSION` | `MYBOUNTY_VERSION` | Constantes, script de UI |
| `MYMOD` | `MYBOUNTYSYSTEM` | config.cpp defines[] |
| `MyMod` | `MyBounty` | config.cpp clase CfgMods, cadenas de rutas RPC |
| `My Mod` | `My Bounty System` | Cadenas en layouts, stringtable |
| `mymod` | `mybounty` | Nombre de sorting en Inputs.xml |
| `STR_MYMOD_` | `STR_MYBOUNTY_` | stringtable.csv, Inputs.xml |
| `UAMyMod` | `UAMyBounty` | Inputs.xml, hook de misión del cliente |
| `m_MyMod` | `m_MyBounty` | Variables miembro del hook de misión del cliente |
| `74291` | `58432` | ID de RPC (tu número único elegido) |

### Paso 4: Verificar

Después de renombrar, haz una búsqueda en todo el proyecto por "MyMod" y "MyProfessionalMod" para detectar cualquier cosa que hayas pasado por alto. Luego compila y prueba:

```batch
DayZDiag_x64.exe -mod=P:\MyBountySystem -filePatching
```

Revisa el log de script buscando tu etiqueta (ej: `[MyBounty]`) para confirmar que todo cargó.

---

## Guía de Expansión de Funcionalidades

Una vez que tu mod esté funcionando, aquí te explicamos cómo agregar funcionalidades comunes.

### Agregando un Nuevo Endpoint RPC

**1. Define la constante de ruta** en `MyModRPC.c` (3_Game):

```c
const string MYMOD_RPC_BOUNTY_SET = "MyMod:BountySet";
```

**2. Agrega el manejador del servidor** en `MyModManager.c` (4_World):

```c
void OnBountySet(PlayerIdentity sender, ParamsReadContext ctx)
{
    string targetName;
    int bountyAmount;
    if (!ctx.Read(targetName)) return;
    if (!ctx.Read(bountyAmount)) return;

    Print(MYMOD_TAG + " Bounty set on " + targetName + ": " + bountyAmount.ToString());
    // ... tu lógica aquí ...
}
```

**3. Agrega el caso de despacho** en `MyModMissionServer.c` (5_Mission), dentro de `OnRPC()`:

```c
else if (routeName == MYMOD_RPC_BOUNTY_SET)
{
    mgr.OnBountySet(sender, ctx);
}
```

**4. Envía desde el cliente** (donde se dispare la acción):

```c
ScriptRPC rpc = new ScriptRPC();
rpc.Write(MYMOD_RPC_BOUNTY_SET);
rpc.Write("PlayerName");
rpc.Write(5000);
rpc.Send(null, MYMOD_RPC_ID, true, null);
```

### Agregando un Nuevo Campo de Configuración

**1. Agrega el campo** en `MyModConfig.c` con un valor predeterminado:

```c
// Cantidad mínima de recompensa que los jugadores pueden establecer.
int MinBountyAmount = 100;
```

Eso es todo. El serializador JSON detecta campos públicos automáticamente. Los archivos de config existentes en disco usarán el valor predeterminado para el nuevo campo hasta que el admin lo edite y guarde.

**2. Referéncialo** desde el manager:

```c
if (bountyAmount < m_Config.MinBountyAmount)
{
    // Rechazar: muy bajo.
    return;
}
```

### Agregando un Nuevo Panel de UI

**1. Crea el layout** en `Scripts/GUI/layouts/MyModBountyList.layout`:

```
PanelWidgetClass BountyListRoot {
 position 0 0
 size 500 400
 halign center_ref
 valign center_ref
 hexactpos 1
 vexactpos 1
 hexactsize 1
 vexactsize 1
 color 0.1 0.1 0.12 0.92
 {
  TextWidgetClass BountyListTitle {
   position 12 8
   size 476 30
   hexactpos 1
   vexactpos 1
   hexactsize 1
   vexactsize 1
   text "Active Bounties"
   font "gui/fonts/metron2"
   "exact size" 18
   color 1 1 1 0.9
  }
 }
}
```

**2. Crea el script** en `Scripts/5_Mission/MyMod/MyModBountyListUI.c`:

```c
class MyModBountyListUI
{
    protected ref Widget m_Root;
    protected bool m_IsOpen;

    void MyModBountyListUI()
    {
        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "MyProfessionalMod/Scripts/GUI/layouts/MyModBountyList.layout"
        );
        if (m_Root)
            m_Root.Show(false);
    }

    void Open()  { if (m_Root) { m_Root.Show(true); m_IsOpen = true; } }
    void Close() { if (m_Root) { m_Root.Show(false); m_IsOpen = false; } }
    bool IsOpen() { return m_IsOpen; }

    void ~MyModBountyListUI()
    {
        if (m_Root) m_Root.Unlink();
    }
};
```

### Agregando una Nueva Tecla de Atajo

**1. Agrega la acción** en `Inputs.xml`:

```xml
<actions>
    <input name="UAMyModPanel" loc="STR_MYMOD_INPUT_PANEL" />
    <input name="UAMyModBountyList" loc="STR_MYMOD_INPUT_BOUNTYLIST" />
</actions>

<sorting name="mymod" loc="STR_MYMOD_INPUT_GROUP">
    <input name="UAMyModPanel"/>
    <input name="UAMyModBountyList"/>
</sorting>
```

**2. Agrega la vinculación predeterminada** en la sección `<preset>`:

```xml
<input name="UAMyModBountyList">
    <btn name="kEnd"/>
</input>
```

**3. Agrega la localización** en `stringtable.csv`:

```csv
"STR_MYMOD_INPUT_BOUNTYLIST","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List","Bounty List",
```

**4. Consulta la entrada** en `MyModMissionClient.c`:

```c
UAInput bountyInput = GetUApi().GetInputByName("UAMyModBountyList");
if (bountyInput && bountyInput.LocalPress())
{
    ToggleBountyList();
}
```

### Agregando una Nueva Entrada de stringtable

**1. Agrega la fila** en `stringtable.csv`. Cada fila necesita las 13 columnas de idioma más una coma final:

```csv
"STR_MYMOD_BOUNTY_PLACED","Bounty placed!","Bounty placed!","Odměna vypsána!","Kopfgeld gesetzt!","Награда назначена!","Nagroda wyznaczona!","Fejpénz kiírva!","Taglia piazzata!","Recompensa puesta!","Prime placée!","Bounty placed!","Bounty placed!","Recompensa colocada!","Bounty placed!",
```

**2. Úsala** en código de script:

```c
// Widget.SetText() NO resuelve automáticamente claves de stringtable.
// Debes usar Widget.SetText() con la cadena resuelta:
string localizedText = Widget.TranslateString("#STR_MYMOD_BOUNTY_PLACED");
myTextWidget.SetText(localizedText);
```

O en un archivo `.layout`, el motor resuelve claves `#STR_` automáticamente:

```
text "#STR_MYMOD_BOUNTY_PLACED"
```

---

## Próximos Pasos

Con esta plantilla profesional funcionando, puedes:

1. **Estudiar mods de producción** -- Lee [DayZ Expansion](https://github.com/salutesh/DayZ-Expansion-Scripts) y el código fuente de `StarDZ_Core` para patrones del mundo real a escala.
2. **Agregar ítems personalizados** -- Sigue el [Capítulo 8.2: Creando un Ítem Personalizado](02-custom-item.md) e intégralos con tu manager.
3. **Construir un panel de administrador** -- Sigue el [Capítulo 8.3: Construyendo un Panel de Administrador](03-admin-panel.md) usando tu sistema de configuración.
4. **Agregar una superposición HUD** -- Sigue el [Capítulo 8.8: Construyendo una Superposición HUD](08-hud-overlay.md) para elementos de UI siempre visibles.
5. **Publicar en el Workshop** -- Sigue el [Capítulo 8.7: Publicando en el Workshop](07-publishing-workshop.md) cuando tu mod esté listo.
6. **Aprender depuración** -- Lee el [Capítulo 8.6: Depuración y Pruebas](06-debugging-testing.md) para análisis de logs y solución de problemas.

---

**Anterior:** [Capítulo 8.8: Construyendo una Superposición HUD](08-hud-overlay.md) | [Inicio](../README.md)
