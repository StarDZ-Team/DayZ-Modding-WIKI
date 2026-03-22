# Preguntas Frecuentes

[Inicio](../README.md) | **FAQ**

---

## Primeros Pasos

### P: ¿Qué necesito para empezar a moddear DayZ?
**R:** Necesitas Steam, DayZ (copia retail), DayZ Tools (gratis en Steam, en la sección Tools) y un editor de texto (se recomienda VS Code). No se requiere experiencia previa en programación -- comienza con el [Capítulo 8.1: Tu Primer Mod](08-tutorials/01-first-mod.md). DayZ Tools incluye Object Builder, Addon Builder, TexView2 y el IDE Workbench.

### P: ¿Qué lenguaje de programación usa DayZ?
**R:** DayZ usa **Enforce Script**, un lenguaje propietario de Bohemia Interactive. Tiene una sintaxis similar a C#, pero con sus propias reglas y limitaciones (sin operador ternario, sin try/catch, sin lambdas). Consulta la [Parte 1: Enforce Script](01-enforce-script/01-variables-types.md) para una guía completa del lenguaje.

### P: ¿Cómo configuro la unidad P:?
**R:** Abre DayZ Tools desde Steam, haz clic en "Workdrive" o "Setup Workdrive" para montar la unidad P:. Esto crea una unidad virtual que apunta a tu espacio de trabajo de modding, donde el motor busca los archivos fuente durante el desarrollo. También puedes usar `subst P: "C:\Tu\Ruta"` desde la línea de comandos. Ver [Capítulo 4.5](04-file-formats/05-dayz-tools.md).

### P: ¿Puedo probar mi mod sin un servidor dedicado?
**R:** Sí. Lanza DayZ con el parámetro `-filePatching` y tu mod cargado. Para pruebas rápidas, usa un Listen Server (aloja desde el menú del juego). Para pruebas de producción, verifica siempre también en un servidor dedicado, ya que algunas rutas de código difieren. Ver [Capítulo 8.1](08-tutorials/01-first-mod.md).

### P: ¿Dónde encuentro los archivos de script vanilla de DayZ para estudiar?
**R:** Después de montar la unidad P: mediante DayZ Tools, los scripts vanilla están en `P:\DZ\scripts\` organizados por capa (`3_Game`, `4_World`, `5_Mission`). Estos son la referencia definitiva para cada clase, método y evento del motor. Consulta también la [Hoja de Referencia](cheatsheet.md) y la [Referencia Rápida de API](06-engine-api/quick-reference.md).

---

## Errores Comunes y Soluciones

### P: Mi mod carga pero no pasa nada. No hay errores en el log.
**R:** Lo más probable es que tu `config.cpp` tenga una entrada incorrecta en `requiredAddons[]`, lo que hace que tus scripts se carguen demasiado pronto o no se carguen en absoluto. Verifica que cada nombre de addon en `requiredAddons` coincida exactamente con un nombre de clase `CfgPatches` existente (distingue mayúsculas y minúsculas). Revisa el log de scripts en `%localappdata%/DayZ/` para advertencias silenciosas. Ver [Capítulo 2.2](02-mod-structure/02-config-cpp.md).

### P: Obtengo errores "Cannot find variable" o "Undefined variable".
**R:** Esto generalmente significa que estás referenciando una clase o variable de una capa de scripts superior. Las capas inferiores (`3_Game`) no pueden ver tipos definidos en capas superiores (`4_World`, `5_Mission`). Mueve la definición de tu clase a la capa correcta, o usa reflexión con `typename` para un acoplamiento débil. Ver [Capítulo 2.1](02-mod-structure/01-five-layers.md).

### P: ¿Por qué `JsonFileLoader<T>.JsonLoadFile()` no devuelve mis datos?
**R:** `JsonLoadFile()` devuelve `void`, no el objeto cargado. Debes pre-asignar tu objeto y pasarlo como parámetro de referencia: `ref MyConfig cfg = new MyConfig(); JsonFileLoader<MyConfig>.JsonLoadFile(path, cfg);`. Asignar el valor de retorno silenciosamente te da `null`. Ver [Capítulo 6.8](06-engine-api/08-file-io.md).

### P: Mi RPC se envía pero nunca se recibe en el otro lado.
**R:** Verifica estas causas comunes: (1) El ID de RPC no coincide entre emisor y receptor. (2) Estás enviando desde el cliente pero escuchando en el cliente (o servidor a servidor). (3) Olvidaste registrar el handler de RPC en `OnRPC()` o en tu handler personalizado. (4) La entidad objetivo es `null` o no está sincronizada por red. Ver [Capítulo 6.9](06-engine-api/09-networking.md) y [Capítulo 7.3](07-patterns/03-rpc-patterns.md).

### P: Obtengo "Error: Member already defined" en un bloque else-if.
**R:** Enforce Script no permite la redeclaración de variables en bloques `else if` hermanos dentro del mismo ámbito. Declara la variable una vez antes de la cadena `if`, o usa ámbitos separados con llaves. Ver [Capítulo 1.12](01-enforce-script/12-gotchas.md).

### P: Mi layout de UI no muestra nada / los widgets son invisibles.
**R:** Causas comunes: (1) El widget tiene tamaño cero -- verifica que el ancho y alto estén configurados correctamente (sin valores negativos). (2) El widget no tiene `Show(true)`. (3) El alfa del color del texto es 0 (completamente transparente). (4) La ruta del layout en `CreateWidgets()` es incorrecta (no se lanza ningún error, simplemente devuelve `null`). Ver [Capítulo 3.3](03-gui-system/03-sizing-positioning.md).

### P: Mi mod causa un crash al iniciar el servidor.
**R:** Verifica: (1) Llamadas a métodos exclusivos del cliente (`GetGame().GetPlayer()`, código de UI) en el servidor. (2) Referencia `null` en `OnInit` o `OnMissionStart` antes de que el mundo esté listo. (3) Recursión infinita en un override de `modded class` que olvidó llamar a `super`. Siempre agrega cláusulas de guarda ya que no hay try/catch. Ver [Capítulo 1.11](01-enforce-script/11-error-handling.md).

### P: Los caracteres de barra invertida o comillas en mis strings causan errores de parseo.
**R:** El parser de Enforce Script (CParser) no soporta secuencias de escape `\\` o `\"` en literales de string. Evita las barras invertidas por completo. Para rutas de archivos, usa barras normales (`"mi/ruta/archivo.json"`). Para comillas dentro de strings, usa comillas simples o concatenación de strings. Ver [Capítulo 1.12](01-enforce-script/12-gotchas.md).

---

## Decisiones de Arquitectura

### P: ¿Qué es la jerarquía de 5 capas de scripts y por qué importa?
**R:** Los scripts de DayZ se compilan en cinco capas numeradas: `1_Core`, `2_GameLib`, `3_Game`, `4_World`, `5_Mission`. Cada capa solo puede referenciar tipos de la misma capa o de capas con número inferior. Esto impone límites arquitectónicos -- coloca enums y constantes compartidas en `3_Game`, lógica de entidades en `4_World`, y hooks de UI/misión en `5_Mission`. Ver [Capítulo 2.1](02-mod-structure/01-five-layers.md).

### P: ¿Debo usar `modded class` o crear clases nuevas?
**R:** Usa `modded class` cuando necesites cambiar o extender el comportamiento vanilla existente (agregar un método a `PlayerBase`, engancharte a `MissionServer`). Crea clases nuevas para sistemas autocontenidos que no necesiten sobreescribir nada. Las clases modded se encadenan automáticamente -- siempre llama a `super` para evitar romper otros mods. Ver [Capítulo 1.4](01-enforce-script/04-modded-classes.md).

### P: ¿Cómo debo organizar el código de cliente vs. servidor?
**R:** Usa las directivas de preprocesador `#ifdef SERVER` y `#ifdef CLIENT` para código que solo debe ejecutarse en un lado. Para mods más grandes, separa en PBOs distintos: un mod de cliente (UI, renderizado, efectos locales) y un mod de servidor (spawning, lógica, persistencia). Esto evita filtrar la lógica del servidor a los clientes. Ver [Capítulo 2.5](02-mod-structure/05-file-organization.md) y [Capítulo 6.9](06-engine-api/09-networking.md).

### P: ¿Cuándo debo usar un Singleton vs. un Module/Plugin?
**R:** Usa un Module (registrado con el `PluginManager` de CF o tu propio sistema de módulos) cuando necesites gestión del ciclo de vida (`OnInit`, `OnUpdate`, `OnMissionFinish`). Usa un Singleton independiente para servicios utilitarios sin estado que solo necesiten acceso global. Los Modules son preferibles para cualquier cosa con estado o necesidades de limpieza. Ver [Capítulo 7.1](07-patterns/01-singletons.md) y [Capítulo 7.2](07-patterns/02-module-systems.md).

### P: ¿Cómo almaceno datos por jugador de forma segura que sobrevivan a reinicios del servidor?
**R:** Guarda archivos JSON en el directorio `$profile:` del servidor usando `JsonFileLoader`. Usa el Steam UID del jugador (de `PlayerIdentity.GetId()`) como nombre de archivo. Carga al conectar el jugador, guarda al desconectar y periódicamente. Siempre maneja archivos faltantes o corruptos con cláusulas de guarda. Ver [Capítulo 7.4](07-patterns/04-config-persistence.md) y [Capítulo 6.8](06-engine-api/08-file-io.md).

---

## Publicación y Distribución

### P: ¿Cómo empaqueto mi mod en un PBO?
**R:** Usa Addon Builder (de DayZ Tools) o herramientas de terceros como PBO Manager. Apunta a la carpeta fuente de tu mod, establece el prefijo correcto (que coincida con el prefijo de addon de tu `config.cpp`) y compila. El archivo `.pbo` resultante va en la carpeta `Addons/` de tu mod. Ver [Capítulo 4.6](04-file-formats/06-pbo-packing.md).

### P: ¿Cómo firmo mi mod para uso en servidores?
**R:** Genera un par de claves con DSSignFile o DSCreateKey de DayZ Tools: esto produce un `.biprivatekey` y un `.bikey`. Firma cada PBO con la clave privada (crea archivos `.bisign` junto a cada PBO). Distribuye el `.bikey` a los administradores de servidor para su carpeta `keys/`. Nunca compartas tu `.biprivatekey`. Ver [Capítulo 4.6](04-file-formats/06-pbo-packing.md).

### P: ¿Cómo publico en el Steam Workshop?
**R:** Usa el Publisher de DayZ Tools o el cargador del Steam Workshop. Necesitas un archivo `mod.cpp` en la raíz de tu mod que defina el nombre, autor y descripción. El publisher sube tus PBOs empaquetados y Steam asigna un Workshop ID. Actualiza republicando desde la misma cuenta. Ver [Capítulo 2.3](02-mod-structure/03-mod-cpp.md) y [Capítulo 8.7](08-tutorials/07-publishing-workshop.md).

### P: ¿Puede mi mod requerir otros mods como dependencias?
**R:** Sí. En `config.cpp`, agrega el nombre de clase `CfgPatches` del mod dependencia a tu array `requiredAddons[]`. En `mod.cpp`, no hay un sistema formal de dependencias -- documenta los mods requeridos en la descripción de tu Workshop. Los jugadores deben suscribirse y cargar todos los mods requeridos. Ver [Capítulo 2.2](02-mod-structure/02-config-cpp.md).

---

## Temas Avanzados

### P: ¿Cómo creo acciones de jugador personalizadas (interacciones)?
**R:** Extiende `ActionBase` (o una subclase como `ActionInteractBase`), define `CreateConditionComponents()` para precondiciones, sobreescribe `OnStart`/`OnExecute`/`OnEnd` para la lógica, y regístrala en `SetActions()` en la entidad objetivo. Las acciones soportan modos continuo (mantener) e instantáneo (clic). Ver [Capítulo 6.12](06-engine-api/12-action-system.md).

### P: ¿Cómo funciona el sistema de daño para items personalizados?
**R:** Define una clase `DamageSystem` en el config.cpp de tu item con `DamageZones` (regiones nombradas) y valores de `ArmorType`. Cada zona rastrea su propia salud. Sobreescribe `EEHitBy()` y `EEKilled()` en el script para reacciones de daño personalizadas. El motor mapea los componentes de Fire Geometry del modelo a nombres de zona. Ver [Capítulo 6.1](06-engine-api/01-entity-system.md).

### P: ¿Cómo puedo agregar atajos de teclado personalizados a mi mod?
**R:** Crea un archivo `inputs.xml` definiendo tus acciones de entrada con asignaciones de teclas por defecto. Regístralas en el script mediante `GetUApi().RegisterInput()`. Consulta el estado con `GetUApi().GetInputByName("tu_accion").LocalPress()`. Agrega nombres localizados en tu `stringtable.csv`. Ver [Capítulo 5.2](05-config-files/02-inputs-xml.md) y [Capítulo 6.13](06-engine-api/13-input-system.md).

### P: ¿Cómo hago que mi mod sea compatible con otros mods?
**R:** Sigue estos principios: (1) Siempre llama a `super` en overrides de modded class. (2) Usa nombres de clase únicos con un prefijo de mod (ej. `MiMod_Manager`). (3) Usa IDs de RPC únicos. (4) No sobreescribas métodos vanilla sin llamar a `super`. (5) Usa `#ifdef` para detectar dependencias opcionales. (6) Prueba con combinaciones de mods populares (CF, Expansion, etc.). Ver [Capítulo 7.2](07-patterns/02-module-systems.md).

### P: ¿Cómo optimizo mi mod para el rendimiento del servidor?
**R:** Estrategias clave: (1) Evita lógica por frame (`OnUpdate`) -- usa temporizadores o diseño basado en eventos. (2) Cachea referencias en lugar de llamar a `GetGame().GetPlayer()` repetidamente. (3) Usa guardas `GetGame().IsServer()` / `GetGame().IsClient()` para saltar código innecesario. (4) Perfila con benchmarks `int start = TickCount(0);`. (5) Limita el tráfico de red -- agrupa RPCs y usa Net Sync Variables para actualizaciones pequeñas frecuentes. Ver [Capítulo 7.7](07-patterns/07-performance.md).

---

*¿Tienes una pregunta que no se cubre aquí? Abre un issue en el repositorio.*
