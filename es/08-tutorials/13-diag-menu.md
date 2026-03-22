# Capítulo 8.13: El Menú de Diagnóstico (Diag Menu)

[Inicio](../README.md) | [<< Anterior: Construyendo un Sistema de Comercio](12-trading-system.md) | **El Menú de Diagnóstico**

---

> **Resumen:** El Diag Menu es la herramienta de diagnóstico integrada de DayZ, disponible solo a través del ejecutable DayZDiag. Proporciona contadores de FPS, perfilado de scripts, depuración de renderizado, cámara libre, visualización de física, control del clima, herramientas de Economía Central, depuración de navegación de IA y diagnóstico de sonido. Este capítulo documenta cada categoría del menú, opción y atajo de teclado basándose en la documentación oficial de Bohemia Interactive.

---

## Tabla de Contenidos

- [¿Qué es el Diag Menu?](#qué-es-el-diag-menu)
- [Cómo Acceder](#cómo-acceder)
- [Controles de Navegación](#controles-de-navegación)
- [Atajos de Teclado de Acceso Rápido](#atajos-de-teclado-de-acceso-rápido)
- [Vista General de Categorías del Menú](#vista-general-de-categorías-del-menú)
- [Estadísticas](#estadísticas)
- [Enfusion Renderer](#enfusion-renderer)
- [Enfusion World (Física)](#enfusion-world-física)
- [DayZ Render](#dayz-render)
- [Juego](#juego)
- [IA](#ia)
- [Sonidos](#sonidos)
- [Funciones Útiles para Modders](#funciones-útiles-para-modders)
- [Cuándo Usar el Diag Menu](#cuándo-usar-el-diag-menu)
- [Errores Comunes](#errores-comunes)
- [Siguientes Pasos](#siguientes-pasos)

---

## ¿Qué es el Diag Menu?

El Diag Menu es un menú de depuración jerárquico integrado en el ejecutable de diagnóstico de DayZ. Lista opciones utilizadas para depurar scripts y assets del juego en siete categorías principales: Estadísticas, Enfusion Renderer, Enfusion World, DayZ Render, Juego, IA y Sonidos.

El Diag Menu **no está disponible** en el ejecutable retail de DayZ (`DayZ_x64.exe`). Debes usar `DayZDiag_x64.exe` -- la versión de diagnóstico que se distribuye junto con la versión retail en tu instalación de DayZ o en los directorios de DayZ Server.

---

## Cómo Acceder

### Requisitos

- **DayZDiag_x64.exe** -- El ejecutable de diagnóstico. Se encuentra en tu carpeta de instalación de DayZ junto al `DayZ_x64.exe` regular.
- Debes estar ejecutando el juego (no en una pantalla de carga). El menú está disponible en cualquier ventana 3D.

### Abriendo el Menú

Presiona **Win + Alt** para abrir el Diag Menu.

Un atajo alternativo es **Ctrl + Win**, pero esto entra en conflicto con un atajo del sistema de Windows 11 y no se recomienda en esa plataforma.

### Habilitando el Cursor del Ratón

Algunas opciones del Diag Menu requieren que interactúes con la pantalla usando el ratón. El cursor del ratón se puede alternar presionando:

**LCtrl + Numpad 9**

Esta combinación de teclas se registra a través de script (`PluginKeyBinding`).

---

## Controles de Navegación

Una vez que el Diag Menu está abierto:

| Tecla | Acción |
|-------|--------|
| **Arriba / Abajo** | Navegar entre elementos del menú |
| **Derecha** | Entrar en un submenú, o ciclar entre valores de opciones |
| **Izquierda** | Ciclar valores de opciones en dirección inversa |
| **Retroceso** | Salir del submenú actual (retroceder un nivel) |

Cuando las opciones muestran múltiples valores, se listan en el orden en que aparecen en el menú. La primera opción es típicamente la predeterminada.

---

## Atajos de Teclado de Acceso Rápido

Estos atajos funcionan en cualquier momento mientras se ejecuta DayZDiag, sin necesidad de abrir el menú:

| Atajo | Función |
|-------|---------|
| **LCtrl + Numpad 1** | Alternar contador de FPS |
| **LCtrl + Numpad 9** | Alternar cursor del ratón en pantalla |
| **RCtrl + RAlt + W** | Ciclar modo de depuración de renderizado |
| **LCtrl + LAlt + P** | Alternar efectos de posproceso |
| **LAlt + Numpad 6** | Alternar visualización de cuerpos físicos |
| **Page Up** | Cámara libre: alternar movimiento del jugador |
| **Page Down** | Cámara libre: congelar/descongelar cámara |
| **Insert** | Teletransportar jugador a la posición del cursor (mientras está en cámara libre) |
| **Home** | Alternar cámara libre / desactivar y teletransportar jugador al cursor |
| **Numpad /** | Alternar cámara libre (sin teletransporte) |
| **End** | Desactivar cámara libre (volver a cámara del jugador) |

> **Nota:** Cualquier mención de "Cheat Inputs" en la documentación oficial se refiere a entradas codificadas en el lado de C++, no accesibles a través de script.

---

## Vista General de Categorías del Menú

El Diag Menu contiene siete categorías de nivel superior:

1. **Statistics** -- Contador de FPS y perfilador de scripts
2. **Enfusion Renderer** -- Iluminación, sombras, materiales, oclusión, posproceso, terreno, widgets
3. **Enfusion World** -- Visualización y depuración del motor de física (Bullet)
4. **DayZ Render** -- Renderizado del cielo, diagnóstico de geometría
5. **Game** -- Clima, cámara libre, vehículos, combate, Economía Central, sonidos de superficie
6. **AI** -- Malla de navegación, búsqueda de caminos, comportamiento de agentes IA
7. **Sounds** -- Depuración de muestras en reproducción, información del sistema de sonido

---

## Estadísticas

### Estructura del Menú

```
Statistics
  FPS                              [LCtrl + Numpad 1]
  Script profiler UI
  > Script profiler settings
      Always enabled
      Flags
      Module
      Update interval
      Average
      Time resolution
      (UI) Scale
```

### FPS

Habilita el contador de FPS en la esquina superior izquierda de la pantalla.

El valor de FPS se calcula a partir del tiempo entre los últimos 10 cuadros, por lo que refleja un promedio móvil corto en lugar de una lectura instantánea.

### Script Profiler UI

Activa el Perfilador de Scripts en pantalla, que muestra datos de rendimiento en tiempo real para la ejecución de scripts.

El perfilador muestra seis secciones de datos:

| Sección | Qué Muestra |
|---------|-------------|
| **Time per class** | Tiempo total de todas las llamadas a funciones pertenecientes a una clase (top 20) |
| **Time per function** | Tiempo total de todas las llamadas a una función específica (top 20) |
| **Class allocations** | Número de asignaciones de una clase (top 20) |
| **Count per function** | Número de veces que una función fue llamada (top 20) |
| **Class count** | Número de instancias activas de una clase (top 40) |
| **Stats and settings** | Configuración actual del perfilador y contadores de cuadros |

El panel de Stats and settings muestra:

| Campo | Significado |
|-------|-------------|
| UI enabled (DIAG) | Si la interfaz del perfilador de scripts está activa |
| Profiling enabled (SCRP) | Si el perfilado se ejecuta incluso cuando la interfaz no está activa |
| Profiling enabled (SCRC) | Si el perfilado está ocurriendo realmente |
| Flags | Banderas actuales de recolección de datos |
| Module | Módulo actualmente perfilado |
| Interval | Intervalo de actualización actual |
| Time Resolution | Resolución de tiempo actual |
| Average | Si los valores mostrados son promedios |
| Game Frame | Total de cuadros transcurridos |
| Session Frame | Total de cuadros en esta sesión de perfilado |
| Total Frames | Total de cuadros en todas las sesiones de perfilado |
| Profiled Sess Frms | Cuadros perfilados en esta sesión |
| Profiled Frames | Cuadros perfilados en todas las sesiones |

> **Importante:** El Script Profiler solo perfila código de script. Los métodos Proto (vinculados al motor) no se miden como entradas separadas, pero su tiempo de ejecución se incluye en el tiempo total del método de script que los llama.

> **Importante:** La API EnProfiler y el perfilador de scripts en sí solo están disponibles en el ejecutable de diagnóstico.

### Configuración del Script Profiler

Estas configuraciones controlan cómo se recolectan los datos de perfilado. También pueden ajustarse programáticamente a través de la API `EnProfiler` (documentada en `EnProfiler.c`).

#### Always Enabled

La recolección de datos de perfilado no está habilitada por defecto. Este toggle muestra si está actualmente activa.

Para habilitar el perfilado al inicio, usa el parámetro de lanzamiento `-profile`.

La interfaz del Script Profiler ignora esta configuración -- siempre fuerza el perfilado mientras la interfaz es visible. Cuando la interfaz se apaga, el perfilado se detiene nuevamente (a menos que "Always enabled" esté configurado en true).

#### Flags

Controla cómo se recolectan los datos. Hay cuatro combinaciones disponibles:

| Combinación de Banderas | Alcance | Vida Útil de los Datos |
|------------------------|---------|------------------------|
| `SPF_RESET \| SPF_RECURSIVE` | Módulo seleccionado + hijos | Por cuadro (se reinicia cada cuadro) |
| `SPF_RECURSIVE` | Módulo seleccionado + hijos | Acumulado entre cuadros |
| `SPF_RESET` | Solo módulo seleccionado | Por cuadro (se reinicia cada cuadro) |
| `SPF_NONE` | Solo módulo seleccionado | Acumulado entre cuadros |

- **SPF_RECURSIVE**: Habilita el perfilado de módulos hijos (recursivamente)
- **SPF_RESET**: Limpia los datos al final de cada cuadro

#### Module

Selecciona qué módulo de script perfilar:

| Opción | Capa de Script |
|--------|---------------|
| CORE | 1_Core |
| GAMELIB | 2_GameLib |
| GAME | 3_Game |
| WORLD | 4_World |
| MISSION | 5_Mission |
| MISSION_CUSTOM | init.c |

#### Update Interval

El número de cuadros a esperar antes de actualizar la visualización de datos ordenados. Esto también retrasa el reinicio causado por `SPF_RESET`.

Valores disponibles: 0, 5, 10, 20, 30, 50, 60, 120, 144

#### Average

Habilitar o deshabilitar la visualización de valores promedio.

- Con `SPF_RESET` y sin intervalo: los valores son el valor crudo por cuadro
- Sin `SPF_RESET`: divide el valor acumulado por el conteo de cuadros de la sesión
- Con un intervalo configurado: divide por el intervalo

El conteo de clases nunca se promedia -- siempre muestra el conteo actual de instancias. Las asignaciones mostrarán el número promedio de veces que se creó una instancia.

#### Time Resolution

Establece la unidad de tiempo para la visualización. El valor representa el denominador (enésima parte de un segundo):

| Valor | Unidad |
|-------|--------|
| 1 | Segundos |
| 1000 | Milisegundos |
| 1000000 | Microsegundos |

Valores disponibles: 1, 10, 100, 1000, 10000, 100000, 1000000

#### (UI) Scale

Ajusta la escala visual de la visualización del perfilador en pantalla para diferentes tamaños de pantalla y resoluciones.

Rango: 0.5 a 1.5 (predeterminado: 1.0, paso: 0.05)

---

## Enfusion Renderer

### Estructura del Menú

```
Enfusion Renderer
  Lights
  > Lighting
      Ambient lighting
      Ground lighting
      Directional lighting
      Bidirectional lighting
      Specular lighting
      Reflection
      Emission lighting
  Shadows
  Terrain shadows
  Render debug mode                [RCtrl + RAlt + W]
  Occluders
  Occlude entities
  Occlude proxies
  Show occluder volumes
  Show active occluders
  Show occluded
  Widgets
  Postprocess                      [LCtrl + LAlt + P]
  Terrain
  > Materials
      Common, TreeTrunk, TreeCrown, Grass, Basic, Normal,
      Super, Skin, Multi, Old Terrain, Old Roads, Water,
      Sky, Sky clouds, Sky stars, Sky flares,
      Particle Sprite, Particle Streak
```

### Lights

Alterna las fuentes de luz reales (como `PersonalLight` o objetos del juego como linternas). Esto no afecta la iluminación ambiental -- usa el submenú Lighting para eso.

### Submenú Lighting

Cada toggle controla un componente específico de iluminación:

| Opción | Efecto Al Desactivar |
|--------|---------------------|
| **Ambient lighting** | Elimina la luz ambiental general en la escena |
| **Ground lighting** | Elimina la luz reflejada del suelo (visible en techos, axilas del personaje) |
| **Directional lighting** | Elimina la luz direccional principal (sol/luna). También desactiva la iluminación bidireccional |
| **Bidirectional lighting** | Elimina el componente de luz bidireccional |
| **Specular lighting** | Elimina los reflejos especulares (visibles en superficies brillantes como armarios, autos) |
| **Reflection** | Elimina la iluminación por reflexión (visible en superficies metálicas/brillantes) |
| **Emission lighting** | Elimina la emisión (auto-iluminación) de los materiales |

Estos toggles son útiles para aislar contribuciones específicas de iluminación al depurar problemas visuales en modelos o escenas personalizadas.

### Shadows

Habilita o deshabilita el renderizado de sombras. Desactivarlas también elimina el culling de lluvia dentro de objetos (la lluvia atravesará los techos).

### Terrain Shadows

Controla cómo se generan las sombras del terreno.

Opciones: `on (slice)`, `on (full)`, `no update`, `disabled`

### Render Debug Mode

Cambia entre modos de visualización de renderizado para inspeccionar la geometría de mallas en el juego.

Opciones: `normal`, `wire`, `wire only`, `overdraw`, `overdrawZ`

Diferentes materiales se muestran en diferentes colores de malla alámbrica:

| Material | Color (RGB) |
|----------|-------------|
| TreeTrunk | 179, 126, 55 |
| TreeCrown | 143, 227, 94 |
| Grass | 41, 194, 53 |
| Basic | 208, 87, 87 |
| Normal | 204, 66, 107 |
| Super | 234, 181, 181 |
| Skin | 252, 170, 18 |
| Multi | 143, 185, 248 |
| Terrain | 255, 127, 127 |
| Water | 51, 51, 255 |
| Ocean | 51, 128, 255 |
| Sky | 143, 185, 248 |

### Occluders

Un conjunto de toggles para el sistema de culling por oclusión:

| Opción | Efecto |
|--------|--------|
| **Occluders** | Habilitar/deshabilitar oclusión de objetos |
| **Occlude entities** | Habilitar/deshabilitar oclusión de entidades |
| **Occlude proxies** | Habilitar/deshabilitar oclusión de proxies |
| **Show occluder volumes** | Toma una captura y dibuja formas de depuración visualizando volúmenes de oclusión |
| **Show active occluders** | Muestra los occluders actualmente activos con formas de depuración |
| **Show occluded** | Visualiza objetos ocluidos con formas de depuración |

### Widgets

Habilitar o deshabilitar el renderizado de todos los widgets de interfaz. Útil para tomar capturas de pantalla limpias o aislar problemas de renderizado.

### Postprocess

Habilitar o deshabilitar efectos de posproceso (bloom, corrección de color, viñeta, etc.).

### Terrain

Habilitar o deshabilitar el renderizado del terreno por completo.

### Submenú Materials

Alterna el renderizado de tipos específicos de material. La mayoría son autoexplicativos. Entradas notables:

- **Super** -- Un toggle general que cubre cada material relacionado con el shader "super"
- **Old Terrain** -- Cubre tanto materiales de Terrain como Terrain Simple
- **Water** -- Cubre cada material relacionado con el agua (océano, costa, ríos)

---

## Enfusion World (Física)

### Estructura del Menú

```
Enfusion World
  Show Bullet
  > Bullet
      Draw Char Ctrl
      Draw Simple Char Ctrl
      Max. Collider Distance
      Draw Bullet shape
      Draw Bullet wireframe
      Draw Bullet shape AABB
      Draw obj center of mass
      Draw Bullet contacts
      Force sleep Bullet
      Show stats
  Show bodies                      [LAlt + Numpad 6]
```

> **Nota:** "Bullet" aquí se refiere al motor de física Bullet, no a la munición.

### Show Bullet

Activa la visualización de depuración para el motor de física Bullet.

### Submenú Bullet

| Opción | Descripción |
|--------|-------------|
| **Draw Char Ctrl** | Visualizar el controlador del personaje jugador. Depende de "Draw Bullet shape" |
| **Draw Simple Char Ctrl** | Visualizar el controlador del personaje IA. Depende de "Draw Bullet shape" |
| **Max. Collider Distance** | Distancia máxima desde el jugador para visualizar colisionadores (valores: 0, 1, 2, 5, 10, 20, 50, 100, 200, 500). El valor predeterminado es 0 |
| **Draw Bullet shape** | Visualizar las formas de los colisionadores de física |
| **Draw Bullet wireframe** | Mostrar colisionadores solo como malla alámbrica. Depende de "Draw Bullet shape" |
| **Draw Bullet shape AABB** | Mostrar cajas delimitadoras alineadas a los ejes de los colisionadores |
| **Draw obj center of mass** | Mostrar centros de masa de los objetos |
| **Draw Bullet contacts** | Visualizar colisionadores que están en contacto |
| **Force sleep Bullet** | Forzar a todos los cuerpos de física a dormir |
| **Show stats** | Mostrar estadísticas de depuración (opciones: disabled, basic, all). Las estadísticas permanecen visibles durante 10 segundos después de desactivar |

> **Advertencia:** Max. Collider Distance es 0 por defecto porque esta visualización es costosa. Configurarla a una distancia grande causará una degradación significativa del rendimiento.

### Show Bodies

Visualizar cuerpos de física Bullet. Opciones: `disabled`, `only`, `all`

---

## DayZ Render

### Estructura del Menú

```
DayZ Render
  > Sky
      Space
      Stars
      > Planets
          Sun
          Moon
      Atmosphere
      > Clouds
          Far
          Near
          Physical
      Horizon
      > Post Process
          God Rays
  > Geometry diagnostic
      diagnostic mode
```

### Submenú Sky

Alterna componentes individuales del renderizado del cielo:

| Opción | Qué Controla |
|--------|-------------|
| **Space** | La textura de fondo detrás de las estrellas |
| **Stars** | Renderizado de estrellas |
| **Sun** | Sol y su efecto de halo (no rayos divinos) |
| **Moon** | Luna y su efecto de halo (no rayos divinos) |
| **Atmosphere** | La textura de la atmósfera en el cielo |
| **Far (Clouds)** | Nubes superiores/distantes. Estas no afectan los ejes de luz (menos densas) |
| **Near (Clouds)** | Nubes inferiores/cercanas. Estas son más densas y actúan como oclusión para los ejes de luz |
| **Physical (Clouds)** | Nubes obsoletas basadas en objetos. Eliminadas de Chernarus y Livonia en DayZ 1.23 |
| **Horizon** | Renderizado del horizonte. El horizonte impedirá los ejes de luz |
| **God Rays** | Efecto de posproceso de ejes de luz |

### Geometry Diagnostic

Habilita el dibujo de formas de depuración para visualizar cómo se ve la geometría de un objeto en el juego.

Tipos de geometría: `normal`, `roadway`, `geometry`, `viewGeometry`, `fireGeometry`, `paths`, `memory`, `wreck`

Modos de dibujo: `solid+wire`, `Zsolid+wire`, `wire`, `ZWire`, `geom only`

Esto es extremadamente útil para modders que crean modelos personalizados -- puedes verificar que tu geometría de fuego, geometría de vista y puntos de memoria estén configurados correctamente sin salir del juego.

---

## Juego

### Estructura del Menú

```
Game
  > Weather & environment
      Display
      Force fog at camera
      Override fog
        Distance density
        Height density
        Distance offset
        Height bias
  Free Camera
    FrCam Player Move              [Page Up]
    FrCam NoClip
    FrCam Freeze                   [Page Down]
  > Vehicles
      Audio
      Simulation
  > Combat
      DECombat
      DEShots
      DEHitpoints
      DEExplosions
  > Legacy/obsolete
      DEAmbient
      DELight
  DESurfaceSound
  > Central Economy
      > Loot Spawn Edit
          Spawn Volume Vis
          Setup Vis
          Edit Volume
          Re-Trace Group Points
          Spawn Candy
          Spawn Rotation Test
          Placement Test
          Export Group
          Export All Groups
          Export Map
          Export Clusters
          Export Economy [csv]
          Export Respawn Queue [csv]
      > Loot Tool
          Deplete Lifetime
          Set Damage = 1.0
          Damage + Deplete
          Invert Avoidance
          Project Target Loot
      > Infected
          Infected Vis
          Infected Zone Info
          Infected Spawn
          Reset Cleanup
      > Animal
          Animal Vis
          Animal Spawn
          Ambient Spawn
      > Building
          Building Stats
      Vehicle&Wreck Vis
      Loot Vis
      Cluster Vis
      Dynamic Events Status
      Dynamic Events Vis
      Dynamic Events Spawn
      Export Dyn Event
      Overall Stats
      Updaters State
      Idle Mode
      Force Save
```

### Weather & Environment

Funcionalidad de depuración para el sistema de clima.

#### Display

Habilita la visualización de depuración del clima. Esto muestra una depuración en pantalla de la niebla/distancia de visión y abre una ventana separada en tiempo real con datos detallados del clima.

Para habilitar la ventana separada mientras se ejecuta como servidor, usa el parámetro de lanzamiento `-debugweather`.

Las configuraciones de la ventana se almacenan en perfiles como `weather_client_imgui.ini` / `weather_client_imgui.bin` (o `weather_server_*` para servidores).

#### Force Fog at Camera

Fuerza la altura de la niebla a coincidir con la altura de la cámara del jugador. Tiene prioridad sobre la configuración de Height bias.

#### Override Fog

Habilita la sobreescritura de valores de niebla con configuraciones manuales:

| Parámetro | Rango | Paso |
|-----------|-------|------|
| Distance density | 0 -- 1 | 0.01 |
| Height density | 0 -- 1 | 0.01 |
| Distance offset | 0 -- 1 | 0.01 |
| Height bias | -500 -- 500 | 5 |

### Free Camera

La cámara libre desacopla la vista del personaje del jugador y permite volar a través del mundo. Esta es una de las herramientas de depuración más útiles para modders.

#### Controles de la Cámara Libre

| Tecla | Origen | Función |
|-------|--------|---------|
| **W / A / S / D** | Inputs (xml) | Mover adelante / izquierda / atrás / derecha |
| **Q** | Inputs (xml) | Mover hacia arriba |
| **Z** | Inputs (xml) | Mover hacia abajo |
| **Mouse** | Inputs (xml) | Mirar alrededor |
| **Rueda del mouse arriba** | Inputs (C++) | Aumentar velocidad |
| **Rueda del mouse abajo** | Inputs (C++) | Disminuir velocidad |
| **Barra espaciadora** | Cheat Inputs (C++) | Alternar depuración en pantalla del objeto apuntado |
| **Ctrl / Shift** | Cheat Inputs (C++) | Velocidad actual x 10 |
| **Alt** | Cheat Inputs (C++) | Velocidad actual / 10 |
| **End** | Cheat Inputs (C++) | Desactivar cámara libre (volver al jugador) |
| **Enter** | Cheat Inputs (C++) | Vincular cámara al objeto apuntado |
| **Page Up** | Cheat Inputs (C++) | Alternar movimiento del jugador mientras está en cámara libre |
| **Page Down** | Cheat Inputs (C++) | Congelar/descongelar posición de la cámara |
| **Insert** | PluginKeyBinding (Script) | Teletransportar jugador a la posición del cursor |
| **Home** | PluginKeyBinding (Script) | Alternar cámara libre / desactivar y teletransportar al cursor |
| **Numpad /** | PluginKeyBinding (Script) | Alternar cámara libre (sin teletransporte) |

#### Opciones de la Cámara Libre

| Opción | Descripción |
|--------|-------------|
| **FrCam Player Move** | Habilitar/deshabilitar que las entradas del jugador (WASD) muevan al jugador mientras está en cámara libre |
| **FrCam NoClip** | Habilitar/deshabilitar que la cámara atraviese el terreno |
| **FrCam Freeze** | Habilitar/deshabilitar que las entradas muevan la cámara |

### Vehicles

Funcionalidad de depuración extendida para vehículos. Estas solo funcionan mientras el jugador está dentro de un vehículo.

- **Audio** -- Abre una ventana separada para ajustar configuraciones de sonido en tiempo real. Incluye visualización de controladores de audio.
- **Simulation** -- Abre una ventana separada con depuración de simulación del auto: ajuste de parámetros de física y visualización.

### Combat

Herramientas de depuración para combate, tiro y puntos de vida:

| Opción | Descripción |
|--------|-------------|
| **DECombat** | Muestra texto en pantalla con distancias a autos, IA y jugadores |
| **DEShots** | Submenú de depuración de proyectiles (ver abajo) |
| **DEHitpoints** | Muestra el DamageSystem del jugador y del objeto que está mirando |
| **DEExplosions** | Muestra datos de penetración de explosiones. Los números muestran valores de desaceleración. Cruz roja = detenido. Cruz verde = penetró |

**Submenú DEShots:**

| Opción | Descripción |
|--------|-------------|
| Clear vis. | Limpiar cualquier visualización de disparos existente |
| Vis. trajectory | Trazar la trayectoria de un disparo, mostrando puntos de salida y punto de detención |
| Always Deflect | Fuerza que todos los disparos del cliente se deflecten |

### Legacy/Obsolete

- **DEAmbient** -- Muestra variables que influyen en los sonidos ambientales
- **DELight** -- Muestra estadísticas sobre el entorno de iluminación actual

### DESurfaceSound

Muestra el tipo de superficie sobre la que el jugador está parado y el tipo de atenuación.

### Central Economy

Un conjunto completo de herramientas de depuración para el sistema de Economía Central (CE).

> **Importante:** La mayoría de las opciones de depuración de CE solo funcionan en cliente de un solo jugador con CE habilitada. Solo "Building Stats" funciona en un entorno multijugador o cuando la CE está desactivada.

> **Nota:** Muchas de estas funciones también están disponibles a través de `CEApi` en script (`CentralEconomy.c`).

#### Loot Spawn Edit

Herramientas para crear y editar puntos de generación de botín en objetos. La cámara libre debe estar habilitada para usar la herramienta Edit Volume.

| Opción | Descripción | Equivalente en Script |
|--------|-------------|----------------------|
| **Spawn Volume Vis** | Visualizar puntos de generación de botín. Opciones: Off, Adaptive, Volume, Occupied | `GetCEApi().LootSetSpawnVolumeVisualisation()` |
| **Setup Vis** | Mostrar propiedades de configuración CE en pantalla con contenedores codificados por color | `GetCEApi().LootToggleSpawnSetup()` |
| **Edit Volume** | Editor interactivo de puntos de botín (requiere cámara libre) | `GetCEApi().LootToggleVolumeEditing()` |
| **Re-Trace Group Points** | Retrazar puntos de botín para corregir problemas de flotación | `GetCEApi().LootRetraceGroupPoints()` |
| **Spawn Candy** | Generar botín en todos los puntos de generación del grupo seleccionado | -- |
| **Spawn Rotation Test** | Probar banderas de rotación en la posición del cursor | -- |
| **Placement Test** | Visualizar colocación con cilindro esférico | -- |
| **Export Group** | Exportar grupo seleccionado a `storage/export/mapGroup_CLASSNAME.xml` | `GetCEApi().LootExportGroup()` |
| **Export All Groups** | Exportar todos los grupos a `storage/export/mapgroupproto.xml` | `GetCEApi().LootExportAllGroups()` |
| **Export Map** | Generar `storage/export/mapgrouppos.xml` | `GetCEApi().LootExportMap()` |
| **Export Clusters** | Generar `storage/export/mapgroupcluster.xml` | `GetCEApi().ExportClusterData()` |
| **Export Economy [csv]** | Exportar economía a `storage/log/economy.csv` | `GetCEApi().EconomyLog(EconomyLogCategories.Economy)` |
| **Export Respawn Queue [csv]** | Exportar cola de respawn a `storage/log/respawn_queue.csv` | `GetCEApi().EconomyLog(EconomyLogCategories.RespawnQueue)` |

**Atajos de teclado de Edit Volume:**

| Tecla | Función |
|-------|---------|
| **[** | Iterar hacia atrás entre contenedores |
| **]** | Iterar hacia adelante entre contenedores |
| **LMB** | Insertar nuevo punto |
| **RMB** | Eliminar punto |
| **;** | Aumentar tamaño del punto |
| **'** | Disminuir tamaño del punto |
| **Insert** | Generar botín en el punto |
| **M** | Generar 48 "AmmoBox_762x54_20Rnd" |
| **Backspace** | Marcar botín cercano para limpieza (agota el tiempo de vida, no es instantáneo) |

#### Loot Tool

| Opción | Descripción | Equivalente en Script |
|--------|-------------|----------------------|
| **Deplete Lifetime** | Agota el tiempo de vida a 3 segundos (programado para limpieza) | `GetCEApi().LootDepleteLifetime()` |
| **Set Damage = 1.0** | Establece la salud a 0 | `GetCEApi().LootSetDamageToOne()` |
| **Damage + Deplete** | Realiza ambas acciones anteriores | `GetCEApi().LootDepleteAndDamage()` |
| **Invert Avoidance** | Alterna la evasión de jugadores (detección de jugadores cercanos) | -- |
| **Project Target Loot** | Emula la generación del objeto apuntado, genera imágenes y registros. Requiere "Loot Vis" habilitado | `GetCEApi().SpawnAnalyze()` y `GetCEApi().EconomyMap()` |

#### Infected

| Opción | Descripción | Equivalente en Script |
|--------|-------------|----------------------|
| **Infected Vis** | Visualizar zonas de zombis, ubicaciones, estado vivo/muerto | `GetCEApi().InfectedToggleVisualisation()` |
| **Infected Zone Info** | Depuración en pantalla cuando la cámara está dentro de una zona de infectados | `GetCEApi().InfectedToggleZoneInfo()` |
| **Infected Spawn** | Generar infectados en la zona seleccionada (o "InfectedArmy" en el cursor) | `GetCEApi().InfectedSpawn()` |
| **Reset Cleanup** | Establece el temporizador de limpieza a 3 segundos | `GetCEApi().InfectedResetCleanup()` |

#### Animal

| Opción | Descripción | Equivalente en Script |
|--------|-------------|----------------------|
| **Animal Vis** | Visualizar zonas de animales, ubicaciones, estado vivo/muerto | `GetCEApi().AnimalToggleVisualisation()` |
| **Animal Spawn** | Generar animal en la zona seleccionada (o "AnimalGoat" en el cursor) | `GetCEApi().AnimalSpawn()` |
| **Ambient Spawn** | Generar "AmbientHen" en el objetivo del cursor | `GetCEApi().AnimalAmbientSpawn()` |

#### Building

**Building Stats** muestra depuración en pantalla sobre los estados de las puertas de los edificios:

- Lado izquierdo: si cada puerta está abierta/cerrada y libre/bloqueada
- Centro: estadísticas sobre `buildings.bin` (persistencia de edificios)

La aleatorización de puertas usa el valor de configuración `initOpened`. Cuando `rand < initOpened`, la puerta se genera abierta (entonces `initOpened=0` significa que las puertas nunca se generan abiertas).

Configuraciones comunes de `<building/>` en economy.xml:

| Configuración | Comportamiento |
|---------------|---------------|
| `init="0" load="0" respawn="0" save="0"` | Sin persistencia, sin aleatorización, estado predeterminado después del reinicio |
| `init="1" load="0" respawn="0" save="0"` | Sin persistencia, puertas aleatorizadas por initOpened |
| `init="1" load="1" respawn="0" save="1"` | Guarda solo puertas bloqueadas, puertas aleatorizadas por initOpened |
| `init="0" load="1" respawn="0" save="1"` | Persistencia completa, guarda estado exacto de puertas, sin aleatorización |

#### Otras Herramientas de la Economía Central

| Opción | Descripción | Equivalente en Script |
|--------|-------------|----------------------|
| **Vehicle&Wreck Vis** | Visualizar objetos registrados para evasión "Vehicle". Amarillo = Auto, Rosa = Restos (Building), Azul = InventoryItem | `GetCEApi().ToggleVehicleAndWreckVisualisation()` |
| **Loot Vis** | Datos de Economía en pantalla para cualquier cosa que mires (botín, infectados, eventos dinámicos) | `GetCEApi().ToggleLootVisualisation()` |
| **Cluster Vis** | Estadísticas de Trayectoria DE en pantalla | `GetCEApi().ToggleClusterVisualisation()` |
| **Dynamic Events Status** | Estadísticas de DE en pantalla | `GetCEApi().ToggleDynamicEventStatus()` |
| **Dynamic Events Vis** | Visualizar y editar puntos de generación de DE | `GetCEApi().ToggleDynamicEventVisualisation()` |
| **Dynamic Events Spawn** | Generar un evento dinámico en el punto más cercano o "StaticChristmasTree" como respaldo | `GetCEApi().DynamicEventSpawn()` |
| **Export Dyn Event** | Exportar puntos DE a `storage/export/eventSpawn_CLASSNAME.xml` | `GetCEApi().DynamicEventExport()` |
| **Overall Stats** | Estadísticas CE en pantalla | `GetCEApi().ToggleOverallStats()` |
| **Updaters State** | Muestra lo que la CE está procesando actualmente | -- |
| **Idle Mode** | Pone la CE a dormir (detiene el procesamiento) | -- |
| **Force Save** | Fuerza el guardado de toda la carpeta `storage/data` (excluye base de datos de jugadores) | -- |

**Atajos de teclado de Dynamic Events Vis:**

| Tecla | Función |
|-------|---------|
| **[** | Iterar hacia atrás entre los DE disponibles |
| **]** | Iterar hacia adelante entre los DE disponibles |
| **LMB** | Insertar nuevo punto para el DE seleccionado |
| **RMB** | Eliminar punto más cercano al cursor |
| **MMB** | Mantener o hacer clic para rotar ángulo |

---

## IA

### Estructura del Menú

```
AI
  Show NavMesh
  Debug Pathgraph World
  Debug Path Agent
  Debug AI Agent
```

> **Importante:** La depuración de IA actualmente no funciona en un entorno multijugador.

### Show NavMesh

Dibuja formas de depuración para visualizar la malla de navegación. Muestra una depuración en pantalla con estadísticas.

| Tecla | Función |
|-------|---------|
| **Numpad 0** | Registrar "Test start" en la posición de la cámara |
| **Numpad 1** | Regenerar tile en la posición de la cámara |
| **Numpad 2** | Regenerar tiles alrededor de la posición de la cámara |
| **Numpad 3** | Iterar hacia adelante entre tipos de visualización |
| **LAlt + Numpad 3** | Iterar hacia atrás entre tipos de visualización |
| **Numpad 4** | Registrar "Test end" en la posición de la cámara. Dibuja esferas y una línea entre inicio y fin. Verde = camino encontrado, Rojo = sin camino |
| **Numpad 5** | Prueba de posición más cercana de NavMesh (SamplePosition). Esfera azul = consulta, esfera rosa = resultado |
| **Numpad 6** | Prueba de raycast de NavMesh. Esfera azul = consulta, esfera rosa = resultado |

### Debug Pathgraph World

Depuración en pantalla que muestra cuántas solicitudes de trabajo de camino se han completado y cuántas están pendientes actualmente.

### Debug Path Agent

Depuración en pantalla y formas de depuración para el trazado de caminos de una IA. Apunta a una entidad IA para seleccionarla para seguimiento. Usa esto cuando estés específicamente interesado en cómo una IA encuentra su camino.

### Debug AI Agent

Depuración en pantalla y formas de depuración para el estado de alerta y comportamiento de una IA. Apunta a una entidad IA para seleccionarla para seguimiento. Usa esto cuando quieras entender la toma de decisiones y el estado de conciencia de una IA.

---

## Sonidos

### Estructura del Menú

```
Sounds
  Show playing samples
  Show system info
```

### Show Playing Samples

Visualización de depuración para sonidos actualmente en reproducción.

| Opción | Descripción |
|--------|-------------|
| **none** | Predeterminado, sin depuración |
| **ImGui** | Ventana separada (iteración más reciente). Soporta filtrado, cobertura completa de categorías. Configuraciones guardadas como `playing_sounds_imgui.ini` / `.bin` en perfiles |
| **DbgUI** | Legado. Tiene filtrado por categoría, más legible, pero se sale de la pantalla y carece de categoría de vehículos |
| **Engine** | Legado. Muestra datos codificados por color en tiempo real con estadísticas, pero se sale de la pantalla y no tiene leyenda de colores |

### Show System Info

Estadísticas de depuración en pantalla del sistema de sonido (conteos de buffer, fuentes activas, etc.).

---

## Funciones Útiles para Modders

Aunque cada opción tiene su uso, estas son las que los modders usan con más frecuencia:

### Análisis de Rendimiento

1. **Contador de FPS** (LCtrl + Numpad 1) -- Verificación rápida de que tu mod no está destruyendo la tasa de cuadros
2. **Script Profiler** -- Encuentra cuáles de tus clases o funciones consumen más tiempo de CPU. Configura el módulo a WORLD o MISSION para enfocarte en la capa de script de tu mod

### Depuración Visual

1. **Cámara libre** -- Vuela alrededor para inspeccionar objetos generados, verificar posiciones, comprobar el comportamiento de la IA desde la distancia
2. **Geometry Diagnostic** -- Verifica la geometría de fuego de tu modelo personalizado, geometría de vista, LOD de carretera y puntos de memoria sin salir del juego
3. **Render Debug Mode** (RCtrl + RAlt + W) -- Ve superposiciones de malla alámbrica para comprobar la densidad de mallas y asignaciones de materiales

### Pruebas de Jugabilidad

1. **Cámara libre + Insert** -- Teletransporta a tu jugador a cualquier lugar del mapa instantáneamente
2. **Sobreescritura del clima** -- Fuerza condiciones específicas de niebla para probar funciones dependientes de la visibilidad
3. **Herramientas de Economía Central** -- Genera infectados, animales, botín y eventos dinámicos bajo demanda
4. **Depuración de combate** -- Traza trayectorias de disparos, inspecciona sistemas de daño de puntos de vida, prueba penetración de explosiones

### Desarrollo de IA

1. **Show NavMesh** -- Verifica que la IA realmente puede navegar hacia donde esperas
2. **Debug AI Agent** -- Mira lo que un infectado o animal está pensando, en qué nivel de alerta está
3. **Debug Path Agent** -- Ve el camino real que una IA está tomando y si la búsqueda de caminos tiene éxito

---

## Cuándo Usar el Diag Menu

### Durante el Desarrollo

- **Script Profiler** al optimizar código por cuadro (OnUpdate, EOnFrame)
- **Cámara libre** para posicionar objetos, verificar ubicaciones de generación, inspeccionar la colocación de modelos
- **Geometry Diagnostic** inmediatamente después de importar un nuevo modelo para verificar LODs y tipos de geometría
- **Contador de FPS** como línea base antes y después de agregar nuevas funciones

### Durante las Pruebas

- **Depuración de combate** para verificar daño de armas, comportamiento de proyectiles, efectos de explosión
- **Herramientas CE** para probar distribución de botín, puntos de generación, eventos dinámicos
- **Depuración de IA** para verificar que el comportamiento de infectados/animales responde correctamente a la presencia del jugador
- **Depuración del clima** para probar tu mod bajo diferentes condiciones climáticas

### Durante la Investigación de Errores

- **Contador de FPS + Script Profiler** cuando los jugadores reportan problemas de rendimiento
- **Cámara libre + Barra espaciadora** (depuración de objeto) para inspeccionar objetos que no se están comportando correctamente
- **Render Debug Mode** para diagnosticar artefactos visuales o problemas de materiales
- **Show Bullet** para depurar problemas de colisión de física

---

## Errores Comunes

**Usar el ejecutable retail.** El Diag Menu solo está disponible en `DayZDiag_x64.exe`. Si presionas Win+Alt y no pasa nada, estás ejecutando la versión retail.

**Olvidar que Max. Collider Distance es 0.** La visualización de física (Draw Bullet shape) no mostrará nada si Max. Collider Distance sigue en su valor predeterminado de 0. Configúralo al menos a 10-20 para ver los colisionadores a tu alrededor.

**Herramientas CE en multijugador.** La mayoría de las opciones de depuración de Economía Central solo funcionan en un solo jugador con CE habilitada. No esperes que funcionen en un servidor dedicado.

**Depuración de IA en multijugador.** La depuración de IA actualmente no funciona en un entorno multijugador. Prueba el comportamiento de la IA en un solo jugador.

**Confundir "Bullet" con munición.** Las opciones de "Bullet" en la categoría "Enfusion World" se refieren al motor de física Bullet, no a la munición de armas. La depuración relacionada con el combate está en Game > Combat.

**Dejar el perfilador activado.** El Script Profiler tiene una sobrecarga medible. Desactívalo cuando hayas terminado de perfilar para obtener lecturas de FPS precisas.

**Valores grandes de distancia de colisionador.** Configurar Max. Collider Distance a 200 o 500 hundirá tu tasa de cuadros. Usa el valor más pequeño que cubra tu área de interés.

**No habilitar los prerrequisitos.** Varias opciones dependen de que otras estén habilitadas primero:
- "Draw Char Ctrl" y "Draw Bullet wireframe" dependen de "Draw Bullet shape"
- "Edit Volume" requiere cámara libre
- "Project Target Loot" requiere que "Loot Vis" esté habilitado

---

## Siguientes Pasos

- **Capítulo 8.6: [Depuración y Pruebas](06-debugging-testing.md)** -- Registros de scripts, depuración con Print, file patching y Workbench
- **Capítulo 8.7: [Publicación en el Workshop](07-publishing-workshop.md)** -- Empaqueta y publica tu mod probado
