# Capitulo 7.4: Persistencia de Configuracion

[Inicio](../README.md) | [<< Anterior: Patrones RPC](03-rpc-patterns.md) | **Persistencia de Configuracion** | [Siguiente: Sistemas de Permisos >>](05-permissions.md)

---

## Introduccion

Casi todo mod de DayZ necesita guardar y cargar datos de configuracion: ajustes del servidor, tablas de spawn, listas de bans, datos de jugadores, ubicaciones de teletransporte. El motor proporciona `JsonFileLoader` para serializacion JSON simple e I/O de archivos crudo (`FileHandle`, `FPrintln`) para todo lo demas. Los mods profesionales agregan versionado de configuracion y auto-migracion encima.

Este capitulo cubre los patrones estandar para persistencia de configuracion, desde carga/guardado JSON basico hasta sistemas de migracion versionados, gestion de directorios y temporizadores de auto-guardado.

---

## Tabla de Contenidos

- [Patron JsonFileLoader](#patron-jsonfileloader)
- [Escritura Manual de JSON (FPrintln)](#escritura-manual-de-json-fprintln)
- [La Ruta $profile](#la-ruta-profile)
- [Creacion de Directorios](#creacion-de-directorios)
- [Clases de Datos de Configuracion](#clases-de-datos-de-configuracion)
- [Versionado y Migracion de Configuracion](#versionado-y-migracion-de-configuracion)
- [Temporizadores de Auto-Guardado](#temporizadores-de-auto-guardado)
- [Errores Comunes](#errores-comunes)
- [Mejores Practicas](#mejores-practicas)

---

## Patron JsonFileLoader

`JsonFileLoader` es el serializador incorporado del motor. Convierte entre objetos de Enforce Script y archivos JSON usando reflexion --- lee los campos publicos de tu clase y los mapea a claves JSON automaticamente.

### Advertencia Critica

**`JsonFileLoader<T>.JsonLoadFile()` y `JsonFileLoader<T>.JsonSaveFile()` retornan `void`.** No puedes verificar su valor de retorno. No puedes asignarlos a un `bool`. No puedes usarlos en una condicion `if`. Este es uno de los errores mas comunes en el modding de DayZ.

```c
// INCORRECTO — no compilara
bool success = JsonFileLoader<MyConfig>.JsonLoadFile(path, config);

// INCORRECTO — no compilara
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config))
{
    // ...
}

// CORRECTO — llamar y luego verificar el estado del objeto
JsonFileLoader<MyConfig>.JsonLoadFile(path, config);
// Verificar si los datos fueron realmente poblados
if (config.m_ServerName != "")
{
    // Datos cargados exitosamente
}
```

### Carga/Guardado Basico

```c
// Clase de datos — los campos publicos se serializan a/desde JSON
class ServerSettings
{
    string ServerName = "My DayZ Server";
    int MaxPlayers = 60;
    float RestartInterval = 14400.0;
    bool PvPEnabled = true;
};

class SettingsManager
{
    private static const string SETTINGS_PATH = "$profile:MyMod/ServerSettings.json";
    protected ref ServerSettings m_Settings;

    void Load()
    {
        m_Settings = new ServerSettings();

        if (FileExist(SETTINGS_PATH))
        {
            JsonFileLoader<ServerSettings>.JsonLoadFile(SETTINGS_PATH, m_Settings);
        }
        else
        {
            // Primera ejecucion: guardar valores por defecto
            Save();
        }
    }

    void Save()
    {
        JsonFileLoader<ServerSettings>.JsonSaveFile(SETTINGS_PATH, m_Settings);
    }
};
```

### Que Se Serializa

`JsonFileLoader` serializa **todos los campos publicos** del objeto. No serializa:
- Campos privados o protegidos
- Metodos
- Campos estaticos
- Campos transitorios/solo en tiempo de ejecucion (no hay atributo `[NonSerialized]` --- usa modificadores de acceso)

El JSON resultante se ve asi:

```json
{
    "ServerName": "My DayZ Server",
    "MaxPlayers": 60,
    "RestartInterval": 14400.0,
    "PvPEnabled": true
}
```

### Tipos de Campos Soportados

| Tipo | Representacion JSON |
|------|-------------------|
| `int` | Numero |
| `float` | Numero |
| `bool` | `true` / `false` |
| `string` | String |
| `vector` | Array de 3 numeros |
| `array<T>` | Array JSON |
| `map<string, T>` | Objeto JSON (solo claves string) |
| Clase anidada | Objeto JSON anidado |

### Objetos Anidados

```c
class SpawnPoint
{
    string Name;
    vector Position;
    float Radius;
};

class SpawnConfig
{
    ref array<ref SpawnPoint> SpawnPoints = new array<ref SpawnPoint>();
};
```

Produce:

```json
{
    "SpawnPoints": [
        {
            "Name": "Coast",
            "Position": [13000, 0, 3500],
            "Radius": 100.0
        },
        {
            "Name": "Airfield",
            "Position": [4500, 0, 9500],
            "Radius": 50.0
        }
    ]
}
```

---

## Escritura Manual de JSON (FPrintln)

A veces `JsonFileLoader` no es lo suficientemente flexible: no puede manejar arrays de tipos mixtos, formato personalizado o estructuras de datos que no son clases. En esos casos, usa I/O de archivos crudo.

### Patron Basico

```c
void WriteCustomData(string path, array<string> lines)
{
    FileHandle file = OpenFile(path, FileMode.WRITE);
    if (!file) return;

    FPrintln(file, "{");
    FPrintln(file, "    \"entries\": [");

    for (int i = 0; i < lines.Count(); i++)
    {
        string comma = "";
        if (i < lines.Count() - 1) comma = ",";
        FPrintln(file, "        \"" + lines[i] + "\"" + comma);
    }

    FPrintln(file, "    ]");
    FPrintln(file, "}");

    CloseFile(file);
}
```

### Leer Archivos Crudos

```c
void ReadCustomData(string path)
{
    FileHandle file = OpenFile(path, FileMode.READ);
    if (!file) return;

    string line;
    while (FGets(file, line) >= 0)
    {
        line = line.Trim();
        if (line == "") continue;
        // Procesar linea...
    }

    CloseFile(file);
}
```

### Cuando Usar I/O Manual

- Escribir archivos de log (modo append)
- Escribir exportaciones CSV o texto plano
- Formato JSON personalizado que `JsonFileLoader` no puede producir
- Parsear formatos de archivo no JSON (ej., archivos `.map` o `.xml` de DayZ)

Para archivos de configuracion estandar, prefiere `JsonFileLoader`. Es mas rapido de implementar, menos propenso a errores y maneja automaticamente objetos anidados.

---

## La Ruta $profile

DayZ proporciona el prefijo de ruta `$profile:`, que se resuelve al directorio de perfil del servidor (tipicamente la carpeta que contiene `DayZServer_x64.exe`, o la ruta de perfil especificada con `-profiles=`).

```c
// Estos se resuelven al directorio de perfil:
"$profile:MyMod/config.json"       // -> C:/DayZServer/MyMod/config.json
"$profile:MyMod/Players/data.json" // -> C:/DayZServer/MyMod/Players/data.json
```

### Siempre Usa $profile

Nunca uses rutas absolutas. Nunca uses rutas relativas. Siempre usa `$profile:` para cualquier archivo que tu mod cree o lea en tiempo de ejecucion:

```c
// MAL: Ruta absoluta — falla en cualquier otra maquina
const string CONFIG_PATH = "C:/DayZServer/MyMod/config.json";

// MAL: Ruta relativa — depende del directorio de trabajo, que varia
const string CONFIG_PATH = "MyMod/config.json";

// BIEN: $profile se resuelve correctamente en todas partes
const string CONFIG_PATH = "$profile:MyMod/config.json";
```

### Estructura de Directorios Convencional

La mayoria de los mods siguen esta convencion:

```
$profile:
  +-- YourModName/
      +-- Config.json          (config principal del servidor)
      +-- Permissions.json     (permisos de admin)
      +-- Logs/
      |   +-- 2025-01-15.log   (archivos de log diarios)
      +-- Players/
          +-- 76561198xxxxx.json
          +-- 76561198yyyyy.json
```

---

## Creacion de Directorios

Antes de escribir un archivo, debes asegurar que su directorio padre exista. DayZ no crea directorios automaticamente.

### MakeDirectory

```c
void EnsureDirectories()
{
    string baseDir = "$profile:MyMod";
    if (!FileExist(baseDir))
    {
        MakeDirectory(baseDir);
    }

    string playersDir = baseDir + "/Players";
    if (!FileExist(playersDir))
    {
        MakeDirectory(playersDir);
    }

    string logsDir = baseDir + "/Logs";
    if (!FileExist(logsDir))
    {
        MakeDirectory(logsDir);
    }
}
```

### Importante: MakeDirectory No Es Recursivo

`MakeDirectory` crea solo el directorio final en la ruta. Si el padre no existe, falla silenciosamente. Debes crear cada nivel:

```c
// INCORRECTO: El padre "MyMod" no existe aun
MakeDirectory("$profile:MyMod/Data/Players");  // Falla silenciosamente

// CORRECTO: Crear cada nivel
MakeDirectory("$profile:MyMod");
MakeDirectory("$profile:MyMod/Data");
MakeDirectory("$profile:MyMod/Data/Players");
```

### Patron de Constantes para Rutas

Un mod framework define todas las rutas como constantes en una clase dedicada:

```c
class MyModConst
{
    static const string PROFILE_DIR    = "$profile:MyMod";
    static const string CONFIG_DIR     = "$profile:MyMod/Configs";
    static const string LOG_DIR        = "$profile:MyMod/Logs";
    static const string PLAYERS_DIR    = "$profile:MyMod/Players";
    static const string PERMISSIONS_FILE = "$profile:MyMod/Permissions.json";
};
```

Esto evita la duplicacion de strings de ruta a traves del codebase y facilita encontrar cada archivo que tu mod toca.

---

## Clases de Datos de Configuracion

Una clase de datos de configuracion bien disenada proporciona valores por defecto, seguimiento de version y documentacion clara de cada campo.

### Patron Basico

```c
class MyModConfig
{
    // Seguimiento de version para migraciones
    int ConfigVersion = 3;

    // Ajustes de gameplay con valores por defecto sensatos
    bool EnableFeatureX = true;
    int MaxEntities = 50;
    float SpawnRadius = 500.0;
    string WelcomeMessage = "Welcome to the server!";

    // Ajustes complejos
    ref array<string> AllowedWeapons = new array<string>();
    ref map<string, float> ZoneRadii = new map<string, float>();

    void MyModConfig()
    {
        // Inicializar colecciones con valores por defecto
        AllowedWeapons.Insert("AK74");
        AllowedWeapons.Insert("M4A1");

        ZoneRadii.Set("safe_zone", 100.0);
        ZoneRadii.Set("pvp_zone", 500.0);
    }
};
```

### Patron de ConfigBase Reflectivo

Este patron usa un sistema de configuracion reflectivo donde cada clase de config declara sus campos como descriptores. Esto permite que el panel de administracion auto-genere UI para cualquier config sin nombres de campo codificados:

```c
// Patron conceptual (config reflectiva):
class MyConfigBase
{
    // Cada config declara su version
    int ConfigVersion;
    string ModId;

    // Las subclases sobreescriben para declarar sus campos
    void Init(string modId)
    {
        ModId = modId;
    }

    // Reflexion: obtener todos los campos configurables
    array<ref MyConfigField> GetFields();

    // Get/set dinamico por nombre de campo (para sincronizacion del panel de admin)
    string GetFieldValue(string fieldName);
    void SetFieldValue(string fieldName, string value);

    // Hooks para logica personalizada en carga/guardado
    void OnAfterLoad() {}
    void OnBeforeSave() {}
};
```

### Patron ConfigurablePlugin de VPP

VPP fusiona la gestion de configuracion directamente en el ciclo de vida del plugin:

```c
// Patron VPP (simplificado):
class VPPESPConfig
{
    bool EnableESP = true;
    float MaxDistance = 1000.0;
    int RefreshRate = 5;
};

class VPPESPPlugin : ConfigurablePlugin
{
    ref VPPESPConfig m_ESPConfig;

    override void OnInit()
    {
        m_ESPConfig = new VPPESPConfig();
        // ConfigurablePlugin.LoadConfig() maneja la carga JSON
        super.OnInit();
    }
};
```

---

## Versionado y Migracion de Configuracion

A medida que tu mod evoluciona, las estructuras de configuracion cambian. Agregas campos, eliminas campos, renombras campos, cambias valores por defecto. Sin versionado, los usuarios con archivos de configuracion antiguos obtendran silenciosamente valores incorrectos o se crashearan.

### El Campo de Version

Cada clase de configuracion deberia tener un campo de version entero:

```c
class MyModConfig
{
    int ConfigVersion = 5;  // Incrementar cuando la estructura cambie
    // ...
};
```

### Migracion al Cargar

Al cargar una configuracion, compara la version en disco con la version actual del codigo. Si difieren, ejecuta migraciones:

```c
void LoadConfig()
{
    MyModConfig config = new MyModConfig();  // Tiene valores por defecto actuales

    if (FileExist(CONFIG_PATH))
    {
        JsonFileLoader<MyModConfig>.JsonLoadFile(CONFIG_PATH, config);

        if (config.ConfigVersion < CURRENT_VERSION)
        {
            MigrateConfig(config);
            config.ConfigVersion = CURRENT_VERSION;
            SaveConfig(config);  // Re-guardar con version actualizada
        }
    }
    else
    {
        SaveConfig(config);  // Primera ejecucion: escribir valores por defecto
    }

    m_Config = config;
}
```

### Funciones de Migracion

```c
static const int CURRENT_VERSION = 5;

void MigrateConfig(MyModConfig config)
{
    // Ejecutar cada paso de migracion secuencialmente
    if (config.ConfigVersion < 2)
    {
        // v1 -> v2: "SpawnDelay" fue renombrado a "RespawnInterval"
        // El campo viejo se pierde al cargar; establecer nuevo valor por defecto
        config.RespawnInterval = 300.0;
    }

    if (config.ConfigVersion < 3)
    {
        // v2 -> v3: Se agrego campo "EnableNotifications"
        config.EnableNotifications = true;
    }

    if (config.ConfigVersion < 4)
    {
        // v3 -> v4: El valor por defecto de "MaxZombies" cambio de 100 a 200
        if (config.MaxZombies == 100)
        {
            config.MaxZombies = 200;  // Solo actualizar si el usuario no lo habia cambiado
        }
    }

    if (config.ConfigVersion < 5)
    {
        // v4 -> v5: "DifficultyMode" cambio de int a string
        // config.DifficultyMode = "Normal"; // Establecer nuevo valor por defecto
    }

    MyLog.Info("Config", "Config migrada de v"
        + config.ConfigVersion.ToString() + " a v" + CURRENT_VERSION.ToString());
}
```

### Ejemplo de Migracion de Expansion

Expansion es conocido por la evolucion agresiva de configuracion. Algunas configs de Expansion han pasado por 17+ versiones. Su patron:
1. Cada incremento de version tiene una funcion de migracion dedicada
2. Las migraciones se ejecutan en orden (1 a 2, luego 2 a 3, luego 3 a 4, etc.)
3. Cada migracion solo cambia lo necesario para ese paso de version
4. El numero de version final se escribe a disco despues de que todas las migraciones se completen

Este es el estandar de oro para versionado de configuracion en mods de DayZ.

---

## Temporizadores de Auto-Guardado

Para configs que cambian en tiempo de ejecucion (ediciones del admin, acumulacion de datos de jugadores), implementa un temporizador de auto-guardado para prevenir perdida de datos en crashes.

### Auto-Guardado Basado en Temporizador

```c
class MyDataManager
{
    protected const float AUTOSAVE_INTERVAL = 300.0;  // 5 minutos
    protected float m_AutosaveTimer;
    protected bool m_Dirty;  // Han cambiado los datos desde el ultimo guardado?

    void MarkDirty()
    {
        m_Dirty = true;
    }

    void OnUpdate(float dt)
    {
        m_AutosaveTimer += dt;
        if (m_AutosaveTimer >= AUTOSAVE_INTERVAL)
        {
            m_AutosaveTimer = 0;

            if (m_Dirty)
            {
                Save();
                m_Dirty = false;
            }
        }
    }

    void OnMissionFinish()
    {
        // Siempre guardar al apagar, incluso si el temporizador no se ha disparado
        if (m_Dirty)
        {
            Save();
            m_Dirty = false;
        }
    }
};
```

### Optimizacion con Flag Dirty

Solo escribe a disco cuando los datos han cambiado realmente. El I/O de archivos es costoso. Si nada cambio, omite el guardado:

```c
void UpdateSetting(string key, string value)
{
    if (m_Settings.Get(key) == value) return;  // Sin cambio, sin guardado

    m_Settings.Set(key, value);
    MarkDirty();
}
```

### Guardar en Eventos Criticos

Ademas de los guardados temporizados, guarda inmediatamente despues de operaciones criticas:

```c
void BanPlayer(string uid, string reason)
{
    m_BanList.Insert(uid);
    Save();  // Guardado inmediato — los bans deben sobrevivir a crashes
}
```

---

## Errores Comunes

### 1. Tratar JsonLoadFile Como Si Retornara un Valor

```c
// INCORRECTO — no compila
if (JsonFileLoader<MyConfig>.JsonLoadFile(path, config)) { ... }
```

`JsonLoadFile` retorna `void`. Llamalo, luego verifica el estado del objeto.

### 2. No Verificar FileExist Antes de Cargar

```c
// INCORRECTO — crashea o produce objeto vacio sin diagnostico
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);

// CORRECTO — verificar primero, crear valores por defecto si falta
if (!FileExist("$profile:MyMod/Config.json"))
{
    SaveDefaults();
    return;
}
JsonFileLoader<MyConfig>.JsonLoadFile("$profile:MyMod/Config.json", config);
```

### 3. Olvidar Crear Directorios

`JsonSaveFile` falla silenciosamente si el directorio no existe. Siempre asegura los directorios antes de guardar.

### 4. Campos Publicos Que No Tenias Intencion de Serializar

Cada campo `public` en una clase de configuracion termina en el JSON. Si tienes campos solo de tiempo de ejecucion, hazlos `protected` o `private`:

```c
class MyConfig
{
    // Estos van al JSON:
    int MaxPlayers = 60;
    string ServerName = "My Server";

    // Esto NO va al JSON (protected):
    protected bool m_Loaded;
    protected float m_LastSaveTime;
};
```

### 5. Caracteres de Barra Invertida y Comilla en Valores JSON

El CParser de Enforce Script tiene problemas con `\\` y `\"` en literales de string. Evita almacenar rutas de archivo con barras invertidas en configs. Usa barras normales:

```c
// MAL — las barras invertidas pueden romper el parsing
string LogPath = "C:\\DayZ\\Logs\\server.log";

// BIEN — las barras normales funcionan en todas partes
string LogPath = "$profile:MyMod/Logs/server.log";
```

---

## Mejores Practicas

1. **Usa `$profile:` para todas las rutas de archivo.** Nunca codifiques rutas absolutas.

2. **Crea directorios antes de escribir archivos.** Verifica con `FileExist()`, crea con `MakeDirectory()`, un nivel a la vez.

3. **Siempre proporciona valores por defecto en el constructor de tu clase de configuracion o inicializadores de campo.** Esto asegura que las configs de primera ejecucion sean sensatas.

4. **Versiona tus configs desde el dia uno.** Agregar un campo `ConfigVersion` no cuesta nada y ahorra horas de depuracion despues.

5. **Separa las clases de datos de configuracion de las clases manager.** La clase de datos es un contenedor tonto; el manager maneja la logica de carga/guardado/sincronizacion.

6. **Usa auto-guardado con flag dirty.** No escribas a disco cada vez que un valor cambie --- agrupa escrituras en un temporizador.

7. **Guarda al finalizar la mision.** El temporizador de auto-guardado es una red de seguridad, no el guardado principal. Siempre guarda durante `OnMissionFinish()`.

8. **Define constantes de ruta en un solo lugar.** Una clase `MyModConst` con todas las rutas previene la duplicacion de strings y hace trivial los cambios de ruta.

9. **Registra operaciones de carga/guardado.** Al depurar problemas de configuracion, una linea de log diciendo "Config v3 cargada desde $profile:MyMod/Config.json" es invaluable.

10. **Prueba con un archivo de configuracion eliminado.** Tu mod deberia manejar la primera ejecucion con gracia: crear directorios, escribir valores por defecto, registrar lo que hizo.

---

## Compatibilidad e Impacto

- **Multi-Mod:** Cada mod escribe en su propio directorio `$profile:NombreDelMod/`. Los conflictos solo ocurren si dos mods usan el mismo nombre de directorio. Usa un prefijo unico y reconocible para la carpeta de tu mod.
- **Orden de Carga:** La carga de configuracion ocurre en `OnInit` o `OnMissionStart`, ambos controlados por el ciclo de vida propio del mod. Sin problemas de orden de carga entre mods a menos que dos mods intenten leer/escribir el mismo archivo (lo que nunca deberian hacer).
- **Listen Server:** Los archivos de configuracion son solo del lado del servidor (`$profile:` se resuelve en el servidor). En listen servers, el codigo del lado del cliente tecnicamente puede acceder a `$profile:`, pero las configs solo deberian ser cargadas por modulos del servidor para evitar ambiguedad.
- **Rendimiento:** `JsonFileLoader` es sincrono y bloquea el hilo principal. Para configs grandes (100+ KB), carga durante `OnInit` (antes de que comience el gameplay). Los temporizadores de auto-guardado previenen escrituras repetidas; el patron de flag dirty asegura que el I/O de disco solo ocurra cuando los datos han cambiado realmente.
- **Migracion:** Agregar nuevos campos a una clase de configuracion es seguro --- `JsonFileLoader` ignora claves JSON faltantes y deja el valor por defecto de la clase. Eliminar o renombrar campos requiere un paso de migracion versionado para evitar perdida silenciosa de datos.

---

## Teoria vs Practica

| Los Libros Dicen | Realidad en DayZ |
|---------------|-------------|
| Usar I/O de archivos asincrono para evitar bloqueo | Enforce Script no tiene I/O de archivos asincrono; todas las lecturas/escrituras son sincronas. Carga al inicio, guarda con temporizadores. |
| Validar JSON con un esquema | No existe validacion de esquema JSON; valida campos en `OnAfterLoad()` o con clausulas de guarda despues de cargar. |
| Usar una base de datos para datos estructurados | Sin acceso a base de datos desde Enforce Script; archivos JSON en `$profile:` son el unico mecanismo de persistencia. |

---

[Inicio](../README.md) | [<< Anterior: Patrones RPC](03-rpc-patterns.md) | **Persistencia de Configuracion** | [Siguiente: Sistemas de Permisos >>](05-permissions.md)
