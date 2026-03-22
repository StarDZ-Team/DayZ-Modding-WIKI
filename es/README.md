# Guia Completa de Modding para DayZ

> Documentacion integral de modding para DayZ — 92 capitulos, de cero a mod publicado.

<p align="center">
  <a href="../en/README.md"><img src="https://flagsapi.com/US/flat/48.png" alt="English" /></a>
  <a href="../pt/README.md"><img src="https://flagsapi.com/BR/flat/48.png" alt="Portugues" /></a>
  <a href="../de/README.md"><img src="https://flagsapi.com/DE/flat/48.png" alt="Deutsch" /></a>
  <a href="../ru/README.md"><img src="https://flagsapi.com/RU/flat/48.png" alt="Russki" /></a>
  <a href="README.md"><img src="https://flagsapi.com/ES/flat/48.png" alt="Espanol" /></a>
  <a href="../fr/README.md"><img src="https://flagsapi.com/FR/flat/48.png" alt="Francais" /></a>
  <a href="../ja/README.md"><img src="https://flagsapi.com/JP/flat/48.png" alt="Nihongo" /></a>
  <a href="../zh-hans/README.md"><img src="https://flagsapi.com/CN/flat/48.png" alt="Jiantizi Zhongwen" /></a>
  <a href="../cs/README.md"><img src="https://flagsapi.com/CZ/flat/48.png" alt="Cestina" /></a>
  <a href="../pl/README.md"><img src="https://flagsapi.com/PL/flat/48.png" alt="Polski" /></a>
  <a href="../hu/README.md"><img src="https://flagsapi.com/HU/flat/48.png" alt="Magyar" /></a>
  <a href="../it/README.md"><img src="https://flagsapi.com/IT/flat/48.png" alt="Italiano" /></a>
</p>

---

## Indice Completo de Paginas

### Parte 1: Lenguaje Enforce Script (13 capitulos)

| # | Capitulo | Descripcion |
|---|----------|-------------|
| 1.1 | [Variables y Tipos](01-enforce-script/01-variables-types.md) | Tipos primitivos, declaracion de variables, conversiones y valores por defecto |
| 1.2 | [Arrays, Maps y Sets](01-enforce-script/02-arrays-maps-sets.md) | Colecciones de datos: array, map, set — iteracion, busqueda, ordenacion |
| 1.3 | [Clases y Herencia](01-enforce-script/03-classes-inheritance.md) | Definicion de clases, herencia, constructores, polimorfismo |
| 1.4 | [Modded Classes](01-enforce-script/04-modded-classes.md) | Sistema de modded class, override de metodos, llamadas super |
| 1.5 | [Flujo de Control](01-enforce-script/05-control-flow.md) | If/else, switch, bucles while/for, break, continue |
| 1.6 | [Operaciones con Strings](01-enforce-script/06-strings.md) | Manipulacion de cadenas, formateo, busqueda, comparacion |
| 1.7 | [Matematicas y Vectores](01-enforce-script/07-math-vectors.md) | Funciones matematicas, vectores 3D, distancias, direcciones |
| 1.8 | [Gestion de Memoria](01-enforce-script/08-memory-management.md) | Conteo de referencias, ref, prevencion de leaks, ciclos de referencia |
| 1.9 | [Casting y Reflexion](01-enforce-script/09-casting-reflection.md) | Conversion de tipos, Class.CastTo, verificacion de tipo en tiempo de ejecucion |
| 1.10 | [Enums y Preprocesador](01-enforce-script/10-enums-preprocessor.md) | Enumeraciones, #ifdef, #define, compilacion condicional |
| 1.11 | [Manejo de Errores](01-enforce-script/11-error-handling.md) | Patrones de manejo de errores sin try/catch, guard clauses |
| 1.12 | [Lo Que NO Existe](01-enforce-script/12-gotchas.md) | 30+ trampas y limitaciones del lenguaje Enforce Script |
| 1.13 | [Funciones y Metodos](01-enforce-script/13-functions-methods.md) | Declaracion de funciones, parametros, retornos, static, proto |

### Parte 2: Estructura de Mod (6 capitulos)

| # | Capitulo | Descripcion |
|---|----------|-------------|
| 2.1 | [Jerarquia de 5 Capas](02-mod-structure/01-five-layers.md) | Las 5 capas de scripts de DayZ y orden de compilacion |
| 2.2 | [config.cpp en Detalle](02-mod-structure/02-config-cpp.md) | Estructura completa del config.cpp, CfgPatches, CfgMods |
| 2.3 | [mod.cpp y Workshop](02-mod-structure/03-mod-cpp.md) | Archivo mod.cpp, publicacion en Steam Workshop |
| 2.4 | [Tu Primer Mod](02-mod-structure/04-minimum-viable-mod.md) | Mod minimo viable — archivos esenciales y estructura |
| 2.5 | [Organizacion de Archivos](02-mod-structure/05-file-organization.md) | Convenciones de nombres, estructura de carpetas recomendada |
| 2.6 | [Arquitectura Servidor/Cliente](02-mod-structure/06-server-client-split.md) | Separacion de codigo servidor y cliente, seguridad |

### Parte 3: Sistema GUI y Layout (10 capitulos)

| # | Capitulo | Descripcion |
|---|----------|-------------|
| 3.1 | [Tipos de Widget](03-gui-system/01-widget-types.md) | Todos los tipos de widget disponibles: texto, imagen, boton, etc. |
| 3.2 | [Formato de Layout](03-gui-system/02-layout-files.md) | Estructura de archivos .layout XML para interfaces |
| 3.3 | [Dimensionamiento y Posicionamiento](03-gui-system/03-sizing-positioning.md) | Sistema de coordenadas, flags de tamano, anclaje |
| 3.4 | [Contenedores](03-gui-system/04-containers.md) | Widgets contenedores: WrapSpacer, GridSpacer, ScrollWidget |
| 3.5 | [Creacion Programatica](03-gui-system/05-programmatic-widgets.md) | Crear widgets por codigo, GetWidgetUnderCursor, SetHandler |
| 3.6 | [Manejo de Eventos](03-gui-system/06-event-handling.md) | Callbacks de UI: OnClick, OnChange, OnMouseEnter |
| 3.7 | [Estilos, Fuentes e Imagenes](03-gui-system/07-styles-fonts.md) | Fuentes disponibles, estilos, carga de imagenes |
| 3.8 | [Dialogos y Modales](03-gui-system/08-dialogs-modals.md) | Creacion de dialogos, menus modales, confirmacion |
| 3.9 | [Patrones Reales de UI](03-gui-system/09-real-mod-patterns.md) | Patrones de UI de COT, VPP, Expansion, Dabs Framework |
| 3.10 | [Widgets Avanzados](03-gui-system/10-advanced-widgets.md) | MapWidget, RenderTargetWidget, widgets especializados |

### Parte 4: Formatos de Archivo y Herramientas (8 capitulos)

| # | Capitulo | Descripcion |
|---|----------|-------------|
| 4.1 | [Texturas](04-file-formats/01-textures.md) | Formatos .paa, .edds, .tga — conversion y uso |
| 4.2 | [Modelos 3D](04-file-formats/02-models.md) | Formato .p3d, LODs, geometria, puntos de memoria |
| 4.3 | [Materiales](04-file-formats/03-materials.md) | Archivos .rvmat, shaders, propiedades de superficie |
| 4.4 | [Audio](04-file-formats/04-audio.md) | Formatos .ogg y .wss, configuracion de sonido |
| 4.5 | [DayZ Tools](04-file-formats/05-dayz-tools.md) | Flujo de trabajo con DayZ Tools oficiales |
| 4.6 | [Empaquetado PBO](04-file-formats/06-pbo-packing.md) | Creacion y extraccion de archivos PBO |
| 4.7 | [Guia del Workbench](04-file-formats/07-workbench-guide.md) | Uso del Workbench para edicion de scripts y assets |
| 4.8 | [Modelado de Edificios](04-file-formats/08-building-modeling.md) | Modelado de edificios con puertas y escaleras |

### Parte 5: Archivos de Configuracion (6 capitulos)

| # | Capitulo | Descripcion |
|---|----------|-------------|
| 5.1 | [stringtable.csv](05-config-files/01-stringtable.md) | Localizacion con stringtable.csv para 13 idiomas |
| 5.2 | [inputs.xml](05-config-files/02-inputs-xml.md) | Configuracion de teclas y keybindings personalizados |
| 5.3 | [credits.json](05-config-files/03-credits-json.md) | Archivo de creditos del mod |
| 5.4 | [ImageSets](05-config-files/04-imagesets.md) | Formato ImageSet para iconos y sprites |
| 5.5 | [Configuracion de Servidor](05-config-files/05-server-configs.md) | Archivos de configuracion del servidor DayZ |
| 5.6 | [Configuracion de Spawn](05-config-files/06-spawning-gear.md) | Configuracion de equipamiento inicial y puntos de spawn |

### Parte 6: Referencia de la API del Motor (23 capitulos)

| # | Capitulo | Descripcion |
|---|----------|-------------|
| 6.1 | [Sistema de Entidades](06-engine-api/01-entity-system.md) | Jerarquia de entidades, EntityAI, ItemBase, Object |
| 6.2 | [Sistema de Vehiculos](06-engine-api/02-vehicles.md) | API de vehiculos, motores, fluidos, simulacion de fisica |
| 6.3 | [Sistema Meteorologico](06-engine-api/03-weather.md) | Control del clima, lluvia, niebla, nubosidad |
| 6.4 | [Sistema de Camaras](06-engine-api/04-cameras.md) | Camaras personalizadas, posicion, rotacion, transiciones |
| 6.5 | [Efectos de Post-Procesado](06-engine-api/05-ppe.md) | PPE: blur, aberracion cromatica, gradacion de color |
| 6.6 | [Sistema de Notificaciones](06-engine-api/06-notifications.md) | Notificaciones en pantalla, mensajes para jugadores |
| 6.7 | [Timers y CallQueue](06-engine-api/07-timers.md) | Temporizadores, llamadas retrasadas, repeticion |
| 6.8 | [File I/O y JSON](06-engine-api/08-file-io.md) | Lectura/escritura de archivos, parseo de JSON |
| 6.9 | [Networking y RPC](06-engine-api/09-networking.md) | Comunicacion de red, RPCs, sincronizacion cliente-servidor |
| 6.10 | [Economia Central](06-engine-api/10-central-economy.md) | Sistema de loot, categorias, flags, min/max |
| 6.11 | [Mission Hooks](06-engine-api/11-mission-hooks.md) | Hooks de mision, MissionBase, MissionServer |
| 6.12 | [Sistema de Acciones](06-engine-api/12-action-system.md) | Acciones del jugador, ActionBase, objetivos, condiciones |
| 6.13 | [Sistema de Input](06-engine-api/13-input-system.md) | Captura de teclas, mapeo, UAInput |
| 6.14 | [Sistema de Jugador](06-engine-api/14-player-system.md) | PlayerBase, inventario, vida, stamina, estadisticas |
| 6.15 | [Sistema de Sonido](06-engine-api/15-sound-system.md) | Reproduccion de audio, SoundOnVehicle, ambientes |
| 6.16 | [Sistema de Crafting](06-engine-api/16-crafting-system.md) | Recetas de crafting, ingredientes, resultados |
| 6.17 | [Sistema de Construccion](06-engine-api/17-construction-system.md) | Construccion de bases, piezas, estados |
| 6.18 | [Sistema de Animacion](06-engine-api/18-animation-system.md) | Animacion de jugador, command IDs, callbacks |
| 6.19 | [Consultas de Terreno](06-engine-api/19-terrain-queries.md) | Raycasts, posicion en terreno, superficies |
| 6.20 | [Efectos de Particulas](06-engine-api/20-particle-effects.md) | Sistema de particulas, emisores, efectos visuales |
| 6.21 | [Sistema de Zombis e IA](06-engine-api/21-zombie-ai-system.md) | ZombieBase, IA de infectados, comportamiento |
| 6.22 | [Admin y Servidor](06-engine-api/22-admin-server.md) | Gestion de servidor, bans, kicks, RCON |
| 6.23 | [Sistemas de Mundo](06-engine-api/23-world-systems.md) | Hora del dia, fecha, funciones de mundo |

### Parte 7: Patrones y Buenas Practicas (7 capitulos)

| # | Capitulo | Descripcion |
|---|----------|-------------|
| 7.1 | [Patron Singleton](07-patterns/01-singletons.md) | Instancias unicas, acceso global, inicializacion |
| 7.2 | [Sistemas de Modulos](07-patterns/02-module-systems.md) | Registro de modulos, ciclo de vida, CF modules |
| 7.3 | [Comunicacion RPC](07-patterns/03-rpc-patterns.md) | Patrones para RPCs seguros y eficientes |
| 7.4 | [Persistencia de Config](07-patterns/04-config-persistence.md) | Guardar/cargar configuraciones JSON, versionado |
| 7.5 | [Sistemas de Permisos](07-patterns/05-permissions.md) | Permisos jerarquicos, wildcards, grupos |
| 7.6 | [Arquitectura de Eventos](07-patterns/06-events.md) | Event bus, publish/subscribe, desacoplamiento |
| 7.7 | [Optimizacion de Rendimiento](07-patterns/07-performance.md) | Profiling, cache, pooling, reduccion de RPCs |

### Parte 8: Tutoriales (13 capitulos)

| # | Capitulo | Descripcion |
|---|----------|-------------|
| 8.1 | [Tu Primer Mod (Hello World)](08-tutorials/01-first-mod.md) | Tutorial paso a paso: crea y carga un mod |
| 8.2 | [Creando un Item Personalizado](08-tutorials/02-custom-item.md) | Crea un item con modelo, textura y config |
| 8.3 | [Construyendo un Panel Admin](08-tutorials/03-admin-panel.md) | UI admin con teleport, spawn, gestion |
| 8.4 | [Anadiendo Comandos de Chat](08-tutorials/04-chat-commands.md) | Comandos personalizados en el chat del juego |
| 8.5 | [Usando el Template de Mod](08-tutorials/05-mod-template.md) | Como usar el template oficial de mods DayZ |
| 8.6 | [Depuracion y Pruebas](08-tutorials/06-debugging-testing.md) | Logs, debug, herramientas de diagnostico |
| 8.7 | [Publicando en el Workshop](08-tutorials/07-publishing-workshop.md) | Publica tu mod en Steam Workshop |
| 8.8 | [Construyendo un HUD Overlay](08-tutorials/08-hud-overlay.md) | Overlay de HUD personalizado sobre el juego |
| 8.9 | [Template Profesional de Mod](08-tutorials/09-professional-template.md) | Template completo listo para produccion |
| 8.10 | [Creando un Mod de Vehiculo](08-tutorials/10-vehicle-mod.md) | Vehiculo personalizado con fisica y config |
| 8.11 | [Creando un Mod de Ropa](08-tutorials/11-clothing-mod.md) | Ropa personalizada con texturas y slots |
| 8.12 | [Construyendo un Sistema de Comercio](08-tutorials/12-trading-system.md) | Sistema de comercio entre jugadores/NPCs |
| 8.13 | [Referencia del Diag Menu](08-tutorials/13-diag-menu.md) | Menus de diagnostico para desarrollo |

### Referencia Rapida

| Pagina | Descripcion |
|--------|-------------|
| [Cheatsheet](cheatsheet.md) | Resumen rapido de la sintaxis Enforce Script |
| [Referencia Rapida de API](06-engine-api/quick-reference.md) | Metodos mas usados de la API del motor |
| [Glosario](glossary.md) | Definiciones de terminos usados en modding DayZ |
| [FAQ](faq.md) | Preguntas frecuentes sobre modding |
| [Guia de Solucion de Problemas](troubleshooting.md) | 91 problemas comunes con soluciones |

---

## Creditos

| Desarrollador | Proyectos | Contribuciones Principales |
|---------------|-----------|----------------------------|
| [**Jacob_Mango**](https://github.com/Jacob-Mango) | Community Framework, COT | Sistema de modulos, RPC, permisos, ESP |
| [**InclementDab**](https://github.com/InclementDab) | Dabs Framework, DayZ Editor, Mod Template | MVC, ViewBinding, UI del editor |
| [**salutesh**](https://github.com/salutesh) | DayZ Expansion | Mercado, grupos, marcadores de mapa, vehiculos |
| [**Arkensor**](https://github.com/Arkensor) | DayZ Expansion | Economia central, versionado de configs |
| [**DaOne**](https://github.com/Da0ne) | VPP Admin Tools | Gestion de jugadores, webhooks, ESP |
| [**GravityWolf**](https://github.com/GravityWolfNotAmused) | VPP Admin Tools | Permisos, gestion de servidor |
| [**Brian Orr (DrkDevil)**](https://github.com/DrkDevil) | Colorful UI | Temas de colores, patrones modded class UI |
| [**lothsun**](https://github.com/lothsun) | Colorful UI | Sistemas de colores UI, mejora visual |
| [**Bohemia Interactive**](https://github.com/BohemiaInteractive) | DayZ Engine & Samples | Enforce Script, scripts vanilla, DayZ Tools |
| [**StarDZ Team**](https://github.com/StarDZ-Team) | Esta Wiki | Documentacion, traduccion y organizacion |

## Licencia

La documentacion esta licenciada bajo [**CC BY-SA 4.0**](https://creativecommons.org/licenses/by-sa/4.0/).
Los ejemplos de codigo estan licenciados bajo [**MIT**](../LICENCE).
