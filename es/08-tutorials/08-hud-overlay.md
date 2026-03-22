# Capítulo 8.8: Construyendo una Superposición HUD

[Inicio](../README.md) | [<< Anterior: Publicando en el Steam Workshop](07-publishing-workshop.md) | **Construyendo una Superposición HUD** | [Siguiente: Plantilla Profesional de Mod >>](09-professional-template.md)

---

> **Resumen:** Este tutorial te guía a través de la construcción de una superposición HUD personalizada que muestra información del servidor en la esquina superior derecha de la pantalla. Crearás un archivo de layout, escribirás una clase controladora, te conectarás al ciclo de vida de la misión, solicitarás datos del servidor vía RPC, agregarás una tecla de alternado, y pulirás el resultado con animaciones de desvanecimiento y visibilidad inteligente. Al final, tendrás un HUD de Información del Servidor no intrusivo mostrando el nombre del servidor, la cantidad de jugadores y la hora actual del juego -- además de una comprensión sólida de cómo funcionan las superposiciones HUD en DayZ.

---

## Tabla de Contenidos

- [Lo Que Vamos a Construir](#lo-que-vamos-a-construir)
- [Prerrequisitos](#prerrequisitos)
- [Estructura del Mod](#estructura-del-mod)
- [Paso 1: Crear el Archivo de Layout](#paso-1-crear-el-archivo-de-layout)
- [Paso 2: Crear la Clase Controladora del HUD](#paso-2-crear-la-clase-controladora-del-hud)
- [Paso 3: Conectarse a MissionGameplay](#paso-3-conectarse-a-missiongameplay)
- [Paso 4: Solicitar Datos del Servidor](#paso-4-solicitar-datos-del-servidor)
- [Paso 5: Agregar Alternado con Tecla de Atajo](#paso-5-agregar-alternado-con-tecla-de-atajo)
- [Paso 6: Pulir](#paso-6-pulir)
- [Referencia Completa del Código](#referencia-completa-del-código)
- [Extendiendo el HUD](#extendiendo-el-hud)
- [Errores Comunes](#errores-comunes)
- [Próximos Pasos](#próximos-pasos)

---

## Lo Que Vamos a Construir

Un panel pequeño y semitransparente anclado a la esquina superior derecha de la pantalla que muestra tres líneas de información:

```
  Aurora Survival [Official]
  Players: 24 / 60
  Time: 14:35
```

El panel se ubica debajo de los indicadores de estado y encima de la barra rápida. Se actualiza una vez por segundo (no cada frame), aparece con desvanecimiento cuando se muestra y se desvanece cuando se oculta, y se oculta automáticamente cuando el inventario o el menú de pausa están abiertos. El jugador puede alternarlo con una tecla configurable (predeterminada: **F7**).

### Resultado Esperado

Cuando se carga, verás un rectángulo oscuro semitransparente en el área superior derecha de la pantalla. El texto blanco muestra el nombre del servidor en la primera línea, la cantidad actual de jugadores en la segunda línea, y la hora del mundo en el juego en la tercera línea. Presionar F7 lo desvanece suavemente; presionar F7 de nuevo lo hace reaparecer con desvanecimiento.

---

## Prerrequisitos

- Una estructura de mod funcional (completa primero el [Capítulo 8.1](01-first-mod.md))
- Comprensión básica de la sintaxis de Enforce Script
- Familiaridad con el modelo cliente-servidor de DayZ (el HUD se ejecuta en el cliente; la cantidad de jugadores viene del servidor)

---

## Estructura del Mod

Crea el siguiente árbol de directorios:

```
ServerInfoHUD/
    mod.cpp
    Scripts/
        config.cpp
        data/
            inputs.xml
        3_Game/
            ServerInfoHUD/
                ServerInfoRPC.c
        4_World/
            ServerInfoHUD/
                ServerInfoServer.c
        5_Mission/
            ServerInfoHUD/
                ServerInfoHUD.c
                MissionHook.c
    GUI/
        layouts/
            ServerInfoHUD.layout
```

La capa `3_Game` define constantes (nuestro ID de RPC). La capa `4_World` maneja la respuesta del lado del servidor. La capa `5_Mission` contiene la clase del HUD y el hook de la misión. El archivo de layout define el árbol de widgets.

---

## Paso 1: Crear el Archivo de Layout

Los archivos de layout (`.layout`) definen la jerarquía de widgets en XML. El sistema de GUI de DayZ usa un modelo de coordenadas donde cada widget tiene una posición y tamaño expresados como valores proporcionales (0.0 a 1.0 del padre) más desplazamientos en píxeles.

### `GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <!-- Marco raíz: cubre toda la pantalla, no consume entrada -->
    <Widget name="ServerInfoRoot" type="FrameWidgetClass">
      <Attribute name="position" value="0 0" />
      <Attribute name="size" value="1 1" />
      <Attribute name="halign" value="0" />
      <Attribute name="valign" value="0" />
      <Attribute name="hexactpos" value="0" />
      <Attribute name="vexactpos" value="0" />
      <Attribute name="hexactsize" value="0" />
      <Attribute name="vexactsize" value="0" />
      <children>
        <!-- Panel de fondo: esquina superior derecha -->
        <Widget name="ServerInfoPanel" type="ImageWidgetClass">
          <Attribute name="position" value="1 0" />
          <Attribute name="size" value="220 70" />
          <Attribute name="halign" value="2" />
          <Attribute name="valign" value="0" />
          <Attribute name="hexactpos" value="0" />
          <Attribute name="vexactpos" value="1" />
          <Attribute name="hexactsize" value="1" />
          <Attribute name="vexactsize" value="1" />
          <Attribute name="color" value="0 0 0 0.55" />
          <children>
            <!-- Texto del nombre del servidor -->
            <Widget name="ServerNameText" type="TextWidgetClass">
              <Attribute name="position" value="8 6" />
              <Attribute name="size" value="204 20" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="14" />
              <Attribute name="text" value="Server Name" />
              <Attribute name="color" value="1 1 1 0.9" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
            <!-- Texto de cantidad de jugadores -->
            <Widget name="PlayerCountText" type="TextWidgetClass">
              <Attribute name="position" value="8 28" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Players: - / -" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
            <!-- Texto de hora del juego -->
            <Widget name="TimeText" type="TextWidgetClass">
              <Attribute name="position" value="8 48" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Time: --:--" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
              <Attribute name="halign" value="0" />
              <Attribute name="valign" value="0" />
            </Widget>
          </children>
        </Widget>
      </children>
    </Widget>
  </children>
</layoutset>
```

### Conceptos Clave del Layout

| Atributo | Significado |
|----------|-------------|
| `halign="2"` | Alineación horizontal: **derecha**. El widget se ancla al borde derecho de su padre. |
| `valign="0"` | Alineación vertical: **arriba**. |
| `hexactpos="0"` + `vexactpos="1"` | La posición horizontal es proporcional (1.0 = borde derecho), la posición vertical está en píxeles. |
| `hexactsize="1"` + `vexactsize="1"` | El ancho y alto están en píxeles (220 x 70). |
| `color="0 0 0 0.55"` | RGBA como flotantes. Negro al 55% de opacidad para el panel de fondo. |

El `ServerInfoPanel` está posicionado en X proporcional=1.0 (borde derecho) con `halign="2"` (alineado a la derecha), por lo que el borde derecho del panel toca el lado derecho de la pantalla. La posición Y es 0 píxeles desde arriba. Esto coloca nuestro HUD en la esquina superior derecha.

**¿Por qué tamaños en píxeles para el panel?** El tamaño proporcional haría que el panel escale con la resolución, pero para widgets de información pequeños querrás un tamaño fijo en píxeles para que el texto sea legible en todas las resoluciones.

---

## Paso 2: Crear la Clase Controladora del HUD

La clase controladora carga el layout, encuentra widgets por nombre, y expone métodos para actualizar el texto mostrado. Extiende `ScriptedWidgetEventHandler` para que pueda recibir eventos de widgets si se necesita después.

### `Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Panel;
    protected TextWidget m_ServerNameText;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_TimeText;

    protected bool m_IsVisible;
    protected float m_UpdateTimer;

    // Con qué frecuencia refrescar los datos mostrados (segundos)
    static const float UPDATE_INTERVAL = 1.0;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
    }

    void ~ServerInfoHUD()
    {
        Destroy();
    }

    // Crear y mostrar el HUD
    void Init()
    {
        if (m_Root)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout"
        );

        if (!m_Root)
        {
            Print("[ServerInfoHUD] ERROR: Failed to load layout file.");
            return;
        }

        m_Panel = m_Root.FindAnyWidget("ServerInfoPanel");
        m_ServerNameText = TextWidget.Cast(
            m_Root.FindAnyWidget("ServerNameText")
        );
        m_PlayerCountText = TextWidget.Cast(
            m_Root.FindAnyWidget("PlayerCountText")
        );
        m_TimeText = TextWidget.Cast(
            m_Root.FindAnyWidget("TimeText")
        );

        m_Root.Show(true);
        m_IsVisible = true;

        // Solicitar datos iniciales del servidor
        RequestServerInfo();
    }

    // Eliminar todos los widgets
    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    // Se llama cada frame desde MissionGameplay.OnUpdate
    void Update(float timeslice)
    {
        if (!m_Root)
            return;

        if (!m_IsVisible)
            return;

        m_UpdateTimer += timeslice;

        if (m_UpdateTimer >= UPDATE_INTERVAL)
        {
            m_UpdateTimer = 0;
            RefreshTime();
            RequestServerInfo();
        }
    }

    // Actualizar la visualización de hora del juego (lado del cliente, no necesita RPC)
    protected void RefreshTime()
    {
        if (!m_TimeText)
            return;

        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);

        string hourStr = hour.ToString();
        string minStr = minute.ToString();

        if (hour < 10)
            hourStr = "0" + hourStr;

        if (minute < 10)
            minStr = "0" + minStr;

        m_TimeText.SetText("Time: " + hourStr + ":" + minStr);
    }

    // Enviar RPC al servidor pidiendo cantidad de jugadores y nombre del servidor
    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            // Modo offline: solo mostrar información local
            SetServerName("Offline Mode");
            SetPlayerCount(1, 1);
            return;
        }

        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        ScriptRPC rpc = new ScriptRPC();
        rpc.Send(player, SIH_RPC_REQUEST_INFO, true, NULL);
    }

    // --- Setters llamados cuando llegan datos ---

    void SetServerName(string name)
    {
        if (m_ServerNameText)
            m_ServerNameText.SetText(name);
    }

    void SetPlayerCount(int current, int max)
    {
        if (m_PlayerCountText)
        {
            string text = "Players: " + current.ToString()
                + " / " + max.ToString();
            m_PlayerCountText.SetText(text);
        }
    }

    // Alternar visibilidad
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (m_Root)
            m_Root.Show(m_IsVisible);
    }

    // Ocultar cuando los menús están abiertos
    void SetMenuState(bool menuOpen)
    {
        if (!m_Root)
            return;

        if (menuOpen)
        {
            m_Root.Show(false);
        }
        else if (m_IsVisible)
        {
            m_Root.Show(true);
        }
    }

    bool IsVisible()
    {
        return m_IsVisible;
    }

    Widget GetRoot()
    {
        return m_Root;
    }
};
```

### Detalles Importantes

1. **Ruta de `CreateWidgets`**: La ruta es relativa a la raíz del mod. Como empaquetamos la carpeta `GUI/` dentro del PBO, el motor resuelve `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout` usando el prefijo del mod.
2. **`FindAnyWidget`**: Busca recursivamente en el árbol de widgets por nombre. Siempre verifica NULL después de hacer cast.
3. **`Widget.Unlink()`**: Elimina correctamente el widget y todos sus hijos del árbol de UI. Siempre llama esto en la limpieza.
4. **Patrón de acumulador de timer**: Sumamos `timeslice` cada frame y actuamos solo cuando el tiempo acumulado excede `UPDATE_INTERVAL`. Esto previene hacer trabajo en cada frame.

---

## Paso 3: Conectarse a MissionGameplay

La clase `MissionGameplay` es el controlador de misión del lado del cliente. Usamos `modded class` para inyectar nuestro HUD en su ciclo de vida sin reemplazar el archivo vanilla.

### `Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        // Crear la superposición HUD
        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        // Limpiar ANTES de llamar a super
        if (m_ServerInfoHUD)
        {
            m_ServerInfoHUD.Destroy();
            m_ServerInfoHUD = NULL;
        }

        super.OnMissionFinish();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_ServerInfoHUD)
            return;

        // Ocultar HUD cuando el inventario o cualquier menú está abierto
        UIManager uiMgr = GetGame().GetUIManager();
        bool menuOpen = false;

        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);

        // Actualizar datos del HUD (regulado internamente)
        m_ServerInfoHUD.Update(timeslice);

        // Verificar tecla de alternado
        Input input = GetGame().GetInput();
        if (input)
        {
            if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
            {
                m_ServerInfoHUD.ToggleVisibility();
            }
        }
    }

    // Accessor para que el manejador RPC pueda acceder al HUD
    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### Por Qué Este Patrón Funciona

- **`OnInit`** se ejecuta una vez cuando el jugador entra al gameplay. Creamos e inicializamos el HUD aquí.
- **`OnUpdate`** se ejecuta cada frame. Pasamos `timeslice` al HUD, que internamente regula a una vez por segundo. También verificamos la tecla de alternado y la visibilidad del menú aquí.
- **`OnMissionFinish`** se ejecuta cuando el jugador se desconecta o la misión termina. Destruimos nuestros widgets aquí para prevenir fugas de memoria.

### Regla Crítica: Siempre Limpiar

Si olvidas destruir tus widgets en `OnMissionFinish`, el widget raíz se fugará a la siguiente sesión. Después de algunos cambios de servidor, el jugador termina con widgets fantasma apilados consumiendo memoria. Siempre empareja `Init()` con `Destroy()`.

---

## Paso 4: Solicitar Datos del Servidor

La cantidad de jugadores solo es conocida en el servidor. Necesitamos un viaje de ida y vuelta de RPC (Llamada a Procedimiento Remoto) simple: el cliente envía una solicitud, el servidor lee los datos y los envía de vuelta.

### Paso 4a: Definir el ID del RPC

Los IDs de RPC deben ser únicos entre todos los mods. Definimos los nuestros en la capa `3_Game` para que tanto el código del cliente como del servidor puedan referenciarlos.

### `Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// IDs de RPC para el Server Info HUD.
// Usando números altos para evitar conflictos con vanilla y otros mods.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

**¿Por qué `3_Game`?** Las constantes y enums pertenecen a la capa más baja a la que tanto el cliente como el servidor pueden acceder. La capa `3_Game` se carga antes de `4_World` y `5_Mission`, así que ambos lados pueden ver estos valores.

### Paso 4b: Manejador del Lado del Servidor

El servidor escucha `SIH_RPC_REQUEST_INFO`, recopila los datos, y responde con `SIH_RPC_RESPONSE_INFO`.

### `Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (!GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_REQUEST_INFO)
        {
            HandleServerInfoRequest(sender);
        }
    }

    protected void HandleServerInfoRequest(PlayerIdentity sender)
    {
        if (!sender)
            return;

        // Recopilar información del servidor
        string serverName = "";
        GetGame().GetHostName(serverName);

        int playerCount = 0;
        int maxPlayers = 0;

        // Obtener la lista de jugadores
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        playerCount = players.Count();

        // Jugadores máximos de la configuración del servidor
        maxPlayers = GetGame().GetMaxPlayers();

        // Enviar respuesta de vuelta al cliente que la solicitó
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### Paso 4c: Receptor RPC del Lado del Cliente

El cliente recibe la respuesta y actualiza el HUD.

Agrega esto al mismo archivo `ServerInfoHUD.c` (al final, fuera de la clase), o crea un archivo separado en `5_Mission/ServerInfoHUD/`:

Agrega lo siguiente **debajo** de la clase `ServerInfoHUD` en `ServerInfoHUD.c`:

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_RESPONSE_INFO)
        {
            HandleServerInfoResponse(ctx);
        }
    }

    protected void HandleServerInfoResponse(ParamsReadContext ctx)
    {
        string serverName;
        int playerCount;
        int maxPlayers;

        if (!ctx.Read(serverName))
            return;
        if (!ctx.Read(playerCount))
            return;
        if (!ctx.Read(maxPlayers))
            return;

        // Acceder al HUD a través de MissionGameplay
        MissionGameplay mission = MissionGameplay.Cast(
            GetGame().GetMission()
        );

        if (!mission)
            return;

        ServerInfoHUD hud = mission.GetServerInfoHUD();
        if (!hud)
            return;

        hud.SetServerName(serverName);
        hud.SetPlayerCount(playerCount, maxPlayers);
    }
};
```

### Cómo Funciona el Flujo RPC

```
CLIENTE                          SERVIDOR
  |                                |
  |--- SIH_RPC_REQUEST_INFO ----->|
  |                                | lee serverName, playerCount, maxPlayers
  |<-- SIH_RPC_RESPONSE_INFO ----|
  |                                |
  | actualiza texto del HUD       |
```

El cliente envía la solicitud una vez por segundo (regulado por el timer de actualización). El servidor responde con tres valores empaquetados en el contexto RPC. El cliente los lee en el mismo orden en que fueron escritos.

**Importante:** `rpc.Write()` y `ctx.Read()` deben usar los mismos tipos en el mismo orden. Si el servidor escribe un `string` y luego dos valores `int`, el cliente debe leer un `string` y luego dos valores `int`.

---

## Paso 5: Agregar Alternado con Tecla de Atajo

### Paso 5a: Definir la Entrada en `inputs.xml`

DayZ usa `inputs.xml` para registrar acciones de teclas personalizadas. El archivo debe colocarse en `Scripts/data/inputs.xml` y referenciarse desde `config.cpp`.

### `Scripts/data/inputs.xml`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAServerInfoToggle" loc="Toggle Server Info HUD" />
        </actions>
    </inputs>
    <preset>
        <input name="UAServerInfoToggle">
            <btn name="kF7" />
        </input>
    </preset>
</modded_inputs>
```

| Elemento | Propósito |
|----------|-----------|
| `<actions>` | Declara la acción de entrada por nombre. `loc` es la cadena mostrada en el menú de opciones de teclas. |
| `<preset>` | Asigna la tecla predeterminada. `kF7` mapea a la tecla F7. |

### Paso 5b: Referenciar `inputs.xml` en `config.cpp`

Tu `config.cpp` debe decirle al motor dónde encontrar el archivo de entradas. Agrega una entrada `inputs` dentro del bloque `defs`:

```cpp
class defs
{
    class gameScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/3_Game" };
    };

    class worldScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/4_World" };
    };

    class missionScriptModule
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/5_Mission" };
    };

    class inputs
    {
        value = "";
        files[] = { "ServerInfoHUD/Scripts/data" };
    };
};
```

### Paso 5c: Leer la Pulsación de Tecla

Ya manejamos esto en el hook de `MissionGameplay` del Paso 3:

```c
if (GetUApi().GetInputByName("UAServerInfoToggle").LocalPress())
{
    m_ServerInfoHUD.ToggleVisibility();
}
```

`GetUApi()` devuelve el singleton de la API de entrada. `GetInputByName` busca nuestra acción registrada. `LocalPress()` devuelve `true` por exactamente un frame cuando se presiona la tecla.

### Referencia de Nombres de Teclas

Nombres de teclas comunes para `<btn>`:

| Nombre de Tecla | Tecla |
|-----------------|-------|
| `kF1` hasta `kF12` | Teclas de función |
| `kH`, `kI`, etc. | Teclas de letras |
| `kNumpad0` hasta `kNumpad9` | Teclado numérico |
| `kLControl` | Control izquierdo |
| `kLShift` | Shift izquierdo |
| `kLAlt` | Alt izquierdo |

Las combinaciones de modificadores usan anidación:

```xml
<input name="UAServerInfoToggle">
    <btn name="kLControl">
        <btn name="kH" />
    </btn>
</input>
```

Esto significa "mantener Control izquierdo y presionar H."

---

## Paso 6: Pulir

### 6a: Animación de Aparición/Desaparición

DayZ proporciona `WidgetFadeTimer` para transiciones suaves de alfa. Actualiza la clase `ServerInfoHUD` para usarlo:

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    // ... campos existentes ...

    protected ref WidgetFadeTimer m_FadeTimer;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    // Reemplaza el método ToggleVisibility:
    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (!m_Root)
            return;

        if (m_IsVisible)
        {
            m_Root.Show(true);
            m_FadeTimer.FadeIn(m_Root, 0.3);
        }
        else
        {
            m_FadeTimer.FadeOut(m_Root, 0.3);
        }
    }

    // ... resto de la clase ...
};
```

`FadeIn(widget, duración)` anima el alfa del widget de 0 a 1 durante la duración dada en segundos. `FadeOut` va de 1 a 0 y oculta el widget cuando termina.

### 6b: Panel de Fondo con Alfa

Ya establecimos esto en el layout (`color="0 0 0 0.55"`), dando una superposición oscura al 55% de opacidad. Si quieres ajustar el alfa en tiempo de ejecución:

```c
void SetBackgroundAlpha(float alpha)
{
    if (m_Panel)
    {
        int color = ARGB(
            (int)(alpha * 255),
            0, 0, 0
        );
        m_Panel.SetColor(color);
    }
}
```

La función `ARGB()` toma valores enteros de 0-255 para alfa, rojo, verde y azul.

### 6c: Opciones de Fuente y Color

DayZ incluye varias fuentes que puedes referenciar en layouts:

| Ruta de Fuente | Estilo |
|----------------|--------|
| `gui/fonts/MetronBook` | Sans-serif limpia (usada en el HUD vanilla) |
| `gui/fonts/MetronMedium` | Versión más gruesa de MetronBook |
| `gui/fonts/Metron` | Variante más delgada |
| `gui/fonts/luxuriousscript` | Script decorativo (evitar para HUD) |

Para cambiar el color del texto en tiempo de ejecución:

```c
void SetTextColor(TextWidget widget, int r, int g, int b, int a)
{
    if (widget)
        widget.SetColor(ARGB(a, r, g, b));
}
```

### 6d: Respetando Otras UIs

Nuestro `MissionHook.c` ya detecta cuando un menú está abierto y llama a `SetMenuState(true)`. Aquí hay un enfoque más completo que verifica el inventario específicamente:

```c
// En el override de OnUpdate de la modded MissionGameplay:
bool menuOpen = false;

UIManager uiMgr = GetGame().GetUIManager();
if (uiMgr)
{
    UIScriptedMenu topMenu = uiMgr.GetMenu();
    if (topMenu)
        menuOpen = true;
}

// También verificar si el inventario está abierto
if (uiMgr && uiMgr.FindMenu(MENU_INVENTORY))
    menuOpen = true;

m_ServerInfoHUD.SetMenuState(menuOpen);
```

Esto asegura que tu HUD se oculte detrás de la pantalla de inventario, el menú de pausa, la pantalla de opciones y cualquier otro menú con script.

---

## Referencia Completa del Código

A continuación está cada archivo del mod, en su forma final con todo el pulido aplicado.

### Archivo 1: `ServerInfoHUD/mod.cpp`

```cpp
name = "Server Info HUD";
author = "YourName";
version = "1.0";
overview = "Displays server name, player count, and in-game time.";
```

### Archivo 2: `ServerInfoHUD/Scripts/config.cpp`

```cpp
class CfgPatches
{
    class ServerInfoHUD_Scripts
    {
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] =
        {
            "DZ_Data",
            "DZ_Scripts"
        };
    };
};

class CfgMods
{
    class ServerInfoHUD
    {
        dir = "ServerInfoHUD";
        name = "Server Info HUD";
        author = "YourName";
        type = "mod";

        dependencies[] = { "Game", "World", "Mission" };

        class defs
        {
            class gameScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/3_Game" };
            };

            class worldScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/4_World" };
            };

            class missionScriptModule
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/5_Mission" };
            };

            class inputs
            {
                value = "";
                files[] = { "ServerInfoHUD/Scripts/data" };
            };
        };
    };
};
```

### Archivo 3: `ServerInfoHUD/Scripts/data/inputs.xml`

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<modded_inputs>
    <inputs>
        <actions>
            <input name="UAServerInfoToggle" loc="Toggle Server Info HUD" />
        </actions>
    </inputs>
    <preset>
        <input name="UAServerInfoToggle">
            <btn name="kF7" />
        </input>
    </preset>
</modded_inputs>
```

### Archivo 4: `ServerInfoHUD/Scripts/3_Game/ServerInfoHUD/ServerInfoRPC.c`

```c
// IDs de RPC para el Server Info HUD.
// Usar números altos para evitar colisiones con ERPCs vanilla y otros mods.

const int SIH_RPC_REQUEST_INFO = 72810;
const int SIH_RPC_RESPONSE_INFO = 72811;
```

### Archivo 5: `ServerInfoHUD/Scripts/4_World/ServerInfoHUD/ServerInfoServer.c`

```c
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        // Solo el servidor maneja este RPC
        if (!GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_REQUEST_INFO)
        {
            HandleServerInfoRequest(sender);
        }
    }

    protected void HandleServerInfoRequest(PlayerIdentity sender)
    {
        if (!sender)
            return;

        // Obtener nombre del servidor
        string serverName = "";
        GetGame().GetHostName(serverName);

        // Contar jugadores
        ref array<Man> players = new array<Man>();
        GetGame().GetPlayers(players);
        int playerCount = players.Count();

        // Obtener ranuras máximas de jugadores
        int maxPlayers = GetGame().GetMaxPlayers();

        // Enviar los datos de vuelta al cliente que los solicitó
        ScriptRPC rpc = new ScriptRPC();
        rpc.Write(serverName);
        rpc.Write(playerCount);
        rpc.Write(maxPlayers);
        rpc.Send(this, SIH_RPC_RESPONSE_INFO, true, sender);
    }
};
```

### Archivo 6: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/ServerInfoHUD.c`

```c
class ServerInfoHUD : ScriptedWidgetEventHandler
{
    protected Widget m_Root;
    protected Widget m_Panel;
    protected TextWidget m_ServerNameText;
    protected TextWidget m_PlayerCountText;
    protected TextWidget m_TimeText;

    protected bool m_IsVisible;
    protected float m_UpdateTimer;
    protected ref WidgetFadeTimer m_FadeTimer;

    static const float UPDATE_INTERVAL = 1.0;

    void ServerInfoHUD()
    {
        m_IsVisible = true;
        m_UpdateTimer = 0;
        m_FadeTimer = new WidgetFadeTimer();
    }

    void ~ServerInfoHUD()
    {
        Destroy();
    }

    void Init()
    {
        if (m_Root)
            return;

        m_Root = GetGame().GetWorkspace().CreateWidgets(
            "ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout"
        );

        if (!m_Root)
        {
            Print("[ServerInfoHUD] ERROR: Failed to load layout.");
            return;
        }

        m_Panel = m_Root.FindAnyWidget("ServerInfoPanel");
        m_ServerNameText = TextWidget.Cast(
            m_Root.FindAnyWidget("ServerNameText")
        );
        m_PlayerCountText = TextWidget.Cast(
            m_Root.FindAnyWidget("PlayerCountText")
        );
        m_TimeText = TextWidget.Cast(
            m_Root.FindAnyWidget("TimeText")
        );

        m_Root.Show(true);
        m_IsVisible = true;

        RequestServerInfo();
    }

    void Destroy()
    {
        if (m_Root)
        {
            m_Root.Unlink();
            m_Root = NULL;
        }
    }

    void Update(float timeslice)
    {
        if (!m_Root || !m_IsVisible)
            return;

        m_UpdateTimer += timeslice;

        if (m_UpdateTimer >= UPDATE_INTERVAL)
        {
            m_UpdateTimer = 0;
            RefreshTime();
            RequestServerInfo();
        }
    }

    protected void RefreshTime()
    {
        if (!m_TimeText)
            return;

        int year, month, day, hour, minute;
        GetGame().GetWorld().GetDate(year, month, day, hour, minute);

        string hourStr = hour.ToString();
        string minStr = minute.ToString();

        if (hour < 10)
            hourStr = "0" + hourStr;

        if (minute < 10)
            minStr = "0" + minStr;

        m_TimeText.SetText("Time: " + hourStr + ":" + minStr);
    }

    protected void RequestServerInfo()
    {
        if (!GetGame().IsMultiplayer())
        {
            SetServerName("Offline Mode");
            SetPlayerCount(1, 1);
            return;
        }

        Man player = GetGame().GetPlayer();
        if (!player)
            return;

        ScriptRPC rpc = new ScriptRPC();
        rpc.Send(player, SIH_RPC_REQUEST_INFO, true, NULL);
    }

    void SetServerName(string name)
    {
        if (m_ServerNameText)
            m_ServerNameText.SetText(name);
    }

    void SetPlayerCount(int current, int max)
    {
        if (m_PlayerCountText)
        {
            string text = "Players: " + current.ToString()
                + " / " + max.ToString();
            m_PlayerCountText.SetText(text);
        }
    }

    void ToggleVisibility()
    {
        m_IsVisible = !m_IsVisible;

        if (!m_Root)
            return;

        if (m_IsVisible)
        {
            m_Root.Show(true);
            m_FadeTimer.FadeIn(m_Root, 0.3);
        }
        else
        {
            m_FadeTimer.FadeOut(m_Root, 0.3);
        }
    }

    void SetMenuState(bool menuOpen)
    {
        if (!m_Root)
            return;

        if (menuOpen)
        {
            m_Root.Show(false);
        }
        else if (m_IsVisible)
        {
            m_Root.Show(true);
        }
    }

    bool IsVisible()
    {
        return m_IsVisible;
    }

    Widget GetRoot()
    {
        return m_Root;
    }
};

// -----------------------------------------------
// Receptor RPC del lado del cliente
// -----------------------------------------------
modded class PlayerBase
{
    override void OnRPC(
        PlayerIdentity sender,
        int rpc_type,
        ParamsReadContext ctx
    )
    {
        super.OnRPC(sender, rpc_type, ctx);

        if (GetGame().IsServer())
            return;

        if (rpc_type == SIH_RPC_RESPONSE_INFO)
        {
            HandleServerInfoResponse(ctx);
        }
    }

    protected void HandleServerInfoResponse(ParamsReadContext ctx)
    {
        string serverName;
        int playerCount;
        int maxPlayers;

        if (!ctx.Read(serverName))
            return;
        if (!ctx.Read(playerCount))
            return;
        if (!ctx.Read(maxPlayers))
            return;

        MissionGameplay mission = MissionGameplay.Cast(
            GetGame().GetMission()
        );
        if (!mission)
            return;

        ServerInfoHUD hud = mission.GetServerInfoHUD();
        if (!hud)
            return;

        hud.SetServerName(serverName);
        hud.SetPlayerCount(playerCount, maxPlayers);
    }
};
```

### Archivo 7: `ServerInfoHUD/Scripts/5_Mission/ServerInfoHUD/MissionHook.c`

```c
modded class MissionGameplay
{
    protected ref ServerInfoHUD m_ServerInfoHUD;

    override void OnInit()
    {
        super.OnInit();

        m_ServerInfoHUD = new ServerInfoHUD();
        m_ServerInfoHUD.Init();
    }

    override void OnMissionFinish()
    {
        if (m_ServerInfoHUD)
        {
            m_ServerInfoHUD.Destroy();
            m_ServerInfoHUD = NULL;
        }

        super.OnMissionFinish();
    }

    override void OnUpdate(float timeslice)
    {
        super.OnUpdate(timeslice);

        if (!m_ServerInfoHUD)
            return;

        // Detectar menús abiertos
        bool menuOpen = false;
        UIManager uiMgr = GetGame().GetUIManager();
        if (uiMgr)
        {
            UIScriptedMenu topMenu = uiMgr.GetMenu();
            if (topMenu)
                menuOpen = true;
        }

        m_ServerInfoHUD.SetMenuState(menuOpen);
        m_ServerInfoHUD.Update(timeslice);

        // Tecla de alternado
        if (GetUApi().GetInputByName(
            "UAServerInfoToggle"
        ).LocalPress())
        {
            m_ServerInfoHUD.ToggleVisibility();
        }
    }

    ServerInfoHUD GetServerInfoHUD()
    {
        return m_ServerInfoHUD;
    }
};
```

### Archivo 8: `ServerInfoHUD/GUI/layouts/ServerInfoHUD.layout`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<layoutset>
  <children>
    <Widget name="ServerInfoRoot" type="FrameWidgetClass">
      <Attribute name="position" value="0 0" />
      <Attribute name="size" value="1 1" />
      <Attribute name="halign" value="0" />
      <Attribute name="valign" value="0" />
      <Attribute name="hexactpos" value="0" />
      <Attribute name="vexactpos" value="0" />
      <Attribute name="hexactsize" value="0" />
      <Attribute name="vexactsize" value="0" />
      <children>
        <Widget name="ServerInfoPanel" type="ImageWidgetClass">
          <Attribute name="position" value="1 0" />
          <Attribute name="size" value="220 70" />
          <Attribute name="halign" value="2" />
          <Attribute name="valign" value="0" />
          <Attribute name="hexactpos" value="0" />
          <Attribute name="vexactpos" value="1" />
          <Attribute name="hexactsize" value="1" />
          <Attribute name="vexactsize" value="1" />
          <Attribute name="color" value="0 0 0 0.55" />
          <children>
            <Widget name="ServerNameText" type="TextWidgetClass">
              <Attribute name="position" value="8 6" />
              <Attribute name="size" value="204 20" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="14" />
              <Attribute name="text" value="Server Name" />
              <Attribute name="color" value="1 1 1 0.9" />
            </Widget>
            <Widget name="PlayerCountText" type="TextWidgetClass">
              <Attribute name="position" value="8 28" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Players: - / -" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
            </Widget>
            <Widget name="TimeText" type="TextWidgetClass">
              <Attribute name="position" value="8 48" />
              <Attribute name="size" value="204 18" />
              <Attribute name="hexactpos" value="1" />
              <Attribute name="vexactpos" value="1" />
              <Attribute name="hexactsize" value="1" />
              <Attribute name="vexactsize" value="1" />
              <Attribute name="font" value="gui/fonts/MetronBook" />
              <Attribute name="fontsize" value="12" />
              <Attribute name="text" value="Time: --:--" />
              <Attribute name="color" value="0.8 0.8 0.8 0.85" />
            </Widget>
          </children>
        </Widget>
      </children>
    </Widget>
  </children>
</layoutset>
```

---

## Extendiendo el HUD

Una vez que el HUD básico funcione, aquí hay extensiones naturales.

### Agregando Visualización de FPS

Los FPS se pueden leer del lado del cliente sin ningún RPC:

```c
// Agrega un campo TextWidget m_FPSText y encuéntralo en Init()

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    float fps = 1.0 / GetGame().GetDeltaT();
    m_FPSText.SetText("FPS: " + Math.Round(fps).ToString());
}
```

Llama a `RefreshFPS()` junto con `RefreshTime()` en el método de actualización. Ten en cuenta que `GetDeltaT()` devuelve el tiempo del frame actual, así que el valor de FPS fluctuará. Para una visualización más suave, promedia sobre varios frames:

```c
protected float m_FPSAccum;
protected int m_FPSFrames;

protected void RefreshFPS()
{
    if (!m_FPSText)
        return;

    m_FPSAccum += GetGame().GetDeltaT();
    m_FPSFrames++;

    float avgFPS = m_FPSFrames / m_FPSAccum;
    m_FPSText.SetText("FPS: " + Math.Round(avgFPS).ToString());

    // Reiniciar cada segundo (cuando dispara el timer principal)
    m_FPSAccum = 0;
    m_FPSFrames = 0;
}
```

### Agregando Posición del Jugador

```c
protected void RefreshPosition()
{
    if (!m_PositionText)
        return;

    Man player = GetGame().GetPlayer();
    if (!player)
        return;

    vector pos = player.GetPosition();
    string text = "Pos: " + Math.Round(pos[0]).ToString()
        + " / " + Math.Round(pos[2]).ToString();
    m_PositionText.SetText(text);
}
```

### Múltiples Paneles HUD

Para múltiples paneles (brújula, estado, minimapa), crea una clase administradora padre que contenga un array de elementos HUD:

```c
class HUDManager
{
    protected ref array<ref ServerInfoHUD> m_Panels;

    void HUDManager()
    {
        m_Panels = new array<ref ServerInfoHUD>();
    }

    void AddPanel(ServerInfoHUD panel)
    {
        m_Panels.Insert(panel);
    }

    void UpdateAll(float timeslice)
    {
        int count = m_Panels.Count();
        int i = 0;
        while (i < count)
        {
            m_Panels.Get(i).Update(timeslice);
            i++;
        }
    }
};
```

### Elementos HUD Arrastrables

Hacer un widget arrastrable requiere manejar eventos del mouse vía `ScriptedWidgetEventHandler`:

```c
class DraggableHUD : ScriptedWidgetEventHandler
{
    protected bool m_Dragging;
    protected float m_OffsetX;
    protected float m_OffsetY;
    protected Widget m_DragWidget;

    override bool OnMouseButtonDown(Widget w, int x, int y, int button)
    {
        if (w == m_DragWidget && button == 0)
        {
            m_Dragging = true;
            float wx, wy;
            m_DragWidget.GetScreenPos(wx, wy);
            m_OffsetX = x - wx;
            m_OffsetY = y - wy;
            return true;
        }
        return false;
    }

    override bool OnMouseButtonUp(Widget w, int x, int y, int button)
    {
        if (button == 0)
            m_Dragging = false;
        return false;
    }

    override bool OnUpdate(Widget w, int x, int y, int oldX, int oldY)
    {
        if (m_Dragging && m_DragWidget)
        {
            m_DragWidget.SetPos(x - m_OffsetX, y - m_OffsetY);
            return true;
        }
        return false;
    }
};
```

Nota: para que el arrastre funcione, el widget debe tener `SetHandler(this)` llamado para que el manejador de eventos reciba los eventos. Además, el cursor debe ser visible, lo que limita los HUDs arrastrables a situaciones donde un menú o modo de edición está activo.

---

## Errores Comunes

### 1. Actualizar Cada Frame en Lugar de Regulado

**Incorrecto:**

```c
override void OnUpdate(float timeslice)
{
    super.OnUpdate(timeslice);
    m_ServerInfoHUD.RefreshTime();      // Se ejecuta 60+ veces por segundo!
    m_ServerInfoHUD.RequestServerInfo(); // Envía 60+ RPCs por segundo!
}
```

**Correcto:** Usa un acumulador de timer (como se muestra en el tutorial) para que las operaciones costosas se ejecuten como máximo una vez por segundo. El texto del HUD que cambia cada frame (como un contador de FPS) está bien actualizarlo por frame, pero las solicitudes RPC deben ser reguladas.

### 2. No Limpiar en OnMissionFinish

**Incorrecto:**

```c
modded class MissionGameplay
{
    ref ServerInfoHUD m_HUD;

    override void OnInit()
    {
        super.OnInit();
        m_HUD = new ServerInfoHUD();
        m_HUD.Init();
        // Sin limpieza en ningún lado -- el widget se fuga al desconectar!
    }
};
```

**Correcto:** Siempre destruye widgets y anula referencias en `OnMissionFinish()`. El destructor (`~ServerInfoHUD`) es una red de seguridad, pero no dependas de él -- `OnMissionFinish` es el lugar correcto para la limpieza explícita.

### 3. HUD Detrás de Otros Elementos de UI

Los widgets creados después se renderizan encima de los widgets creados antes. Si tu HUD aparece detrás de la UI vanilla, fue creado demasiado temprano. Soluciones:

- Crea el HUD más tarde en la secuencia de inicialización (ej: en la primera llamada a `OnUpdate` en lugar de en `OnInit`).
- Usa `m_Root.SetSort(100)` para forzar un orden de clasificación más alto, empujando tu widget por encima de otros.

### 4. Solicitar Datos Con Demasiada Frecuencia (Spam de RPC)

Enviar un RPC cada frame crea 60+ paquetes de red por segundo por jugador conectado. En un servidor de 60 jugadores, eso son 3,600 paquetes por segundo de tráfico innecesario. Siempre regula las solicitudes RPC. Una vez por segundo es razonable para información no crítica. Para datos que raramente cambian (como el nombre del servidor), podrías solicitarlo solo una vez en init y almacenarlo en caché.

### 5. Olvidar la Llamada a `super`

```c
// INCORRECTO: rompe la funcionalidad del HUD vanilla
override void OnInit()
{
    m_HUD = new ServerInfoHUD();
    m_HUD.Init();
    // Falta super.OnInit()! El HUD vanilla no se inicializará.
}
```

Siempre llama a `super.OnInit()` (y `super.OnUpdate()`, `super.OnMissionFinish()`) primero. Omitir la llamada a super rompe la implementación vanilla y cualquier otro mod que haga hook al mismo método.

### 6. Usar la Capa de Script Incorrecta

Si intentas referenciar `MissionGameplay` desde `4_World`, obtendrás un error "Undefined type" porque los tipos de `5_Mission` no son visibles para `4_World`. Las constantes RPC van en `3_Game`, el manejador del servidor va en `4_World` (modificando `PlayerBase` que vive allí), y la clase del HUD y el hook de misión van en `5_Mission`.

### 7. Ruta de Layout Hardcodeada

La ruta del layout en `CreateWidgets()` es relativa a las rutas de búsqueda del juego. Si el prefijo de tu PBO no coincide con la cadena de ruta, el layout no cargará y `CreateWidgets` devuelve NULL. Siempre verifica NULL después de `CreateWidgets` y registra un error si falla.

---

## Próximos Pasos

Ahora que tienes una superposición HUD funcional, considera estas progresiones:

1. **Guardar preferencias del usuario** -- Almacena si el HUD es visible en un archivo JSON local para que el estado de alternado persista entre sesiones.
2. **Agregar configuración del lado del servidor** -- Permite a los administradores del servidor habilitar/deshabilitar el HUD o elegir qué campos mostrar vía un archivo JSON de configuración.
3. **Construir una superposición de administrador** -- Expande el HUD para mostrar información solo para administradores (rendimiento del servidor, cantidad de entidades, temporizador de reinicio) usando verificaciones de permisos.
4. **Crear un HUD de brújula** -- Usa `GetGame().GetCurrentCameraDirection()` para calcular la dirección y muestra una barra de brújula en la parte superior de la pantalla.
5. **Estudiar mods existentes** -- Mira el HUD de misiones de DayZ Expansion y el sistema de superposición de Colorful UI para implementaciones de HUD de calidad de producción.

---

## Mejores Prácticas

- **Regula `OnUpdate` a intervalos de 1 segundo mínimo.** Usa un acumulador de timer para evitar ejecutar operaciones costosas (solicitudes RPC, formateo de texto) 60+ veces por segundo. Solo las visuales por frame como contadores de FPS deberían actualizarse cada frame.
- **Oculta el HUD cuando el inventario o cualquier menú esté abierto.** Verifica `GetGame().GetUIManager().GetMenu()` en cada actualización y suprime tu superposición. Los elementos de UI superpuestos confunden a los jugadores y bloquean la interacción.
- **Siempre limpia widgets en `OnMissionFinish`.** Las raíces de widgets fugados persisten entre cambios de servidor, apilando paneles fantasma que consumen memoria y eventualmente causan problemas visuales.
- **Usa `SetSort()` para controlar el orden de renderizado.** Si tu HUD aparece detrás de elementos vanilla, llama a `m_Root.SetSort(100)` para empujarlo por encima. Sin orden de clasificación explícito, el momento de creación determina las capas.
- **Almacena en caché datos del servidor que raramente cambian.** El nombre del servidor no cambia durante una sesión. Solicítalo una vez en init y almacénalo localmente en lugar de re-solicitarlo cada segundo.

---

## Teoría vs Práctica

| Concepto | Teoría | Realidad |
|----------|--------|----------|
| `OnUpdate(float timeslice)` | Se llama una vez por frame con el delta time del frame | En un cliente de 144 FPS, esto se dispara 144 veces por segundo. Enviar un RPC en cada llamada crea 144 paquetes de red/segundo por jugador. Siempre acumula `timeslice` y actúa solo cuando la suma excede tu intervalo. |
| Ruta de layout de `CreateWidgets()` | Carga el layout desde la ruta que proporcionas | La ruta es relativa al prefijo del PBO, no al sistema de archivos. Si el prefijo de tu PBO no coincide con la cadena de ruta, `CreateWidgets` silenciosamente devuelve NULL sin error en el log. |
| `WidgetFadeTimer` | Anima suavemente la opacidad del widget | `FadeOut` oculta el widget después de que la animación se completa, pero `FadeIn` NO llama a `Show(true)` primero. Debes mostrar manualmente el widget antes de llamar a `FadeIn`, o nada aparece. |
| `GetUApi().GetInputByName()` | Devuelve la acción de entrada para tu tecla de atajo personalizada | Si `inputs.xml` no se referencia en `config.cpp` bajo `class inputs`, el nombre de la acción es desconocido y `GetInputByName` devuelve null, causando un crash en `.LocalPress()`. |

---

## Lo Que Aprendiste

En este tutorial aprendiste:
- Cómo crear un layout de HUD con paneles anclados y semitransparentes
- Cómo construir una clase controladora que regula actualizaciones a un intervalo fijo
- Cómo conectarse a `MissionGameplay` para la gestión del ciclo de vida del HUD (inicialización, actualización, limpieza)
- Cómo solicitar datos del servidor vía RPC y mostrarlos en el cliente
- Cómo registrar una tecla de atajo personalizada vía `inputs.xml` y alternar la visibilidad del HUD con animaciones de desvanecimiento

**Anterior:** [Capítulo 8.7: Publicando en el Steam Workshop](07-publishing-workshop.md)
